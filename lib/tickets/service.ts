import { getAdminDb } from '@/lib/firebase/admin';
import { recordAuditLog } from '@/lib/firebase/audit';
import { getStorageFile } from '@/lib/storage/service';
import {
  Ticket,
  TicketMessage,
  TicketEvent,
  TicketEventType,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketDepartment,
  TicketAssignee,
  TicketAttachment,
} from '@/types/tickets';
import { getNextTicketNumber } from './counter';
import { canonicalizeSubject, generateOutboundMessageId } from './threading';

/**
 * Searches the artists collection to link an email to a verified artist record.
 * If 0 or >1 matches are found, returns null to avoid ambiguous or false assumptions.
 */
export async function findArtistByEmail(
  email: string
): Promise<{ id: string; name: string } | null> {
  const db = getAdminDb();
  if (!db || !email) return null;

  const normalized = email.toLowerCase().trim();
  try {
    const snap = await db
      .collection('artists')
      .where('email', '==', normalized)
      .limit(2)
      .get();

    if (snap.size === 1) {
      const doc = snap.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || data.stageName || data.displayName || 'Roster Artist',
      };
    }
  } catch (err) {
    console.warn('[findArtistByEmail] Error checking artist email:', err);
  }
  return null;
}

/**
 * Creates a brand new ticket in Firestore with thread correlation and audit trail.
 */
export async function createTicket(params: {
  subject: string;
  requesterName: string;
  requesterEmail: string;
  requesterUserId?: string | null;
  artistId?: string | null;
  priority?: TicketPriority;
  category?: TicketCategory;
  assignedTo?: TicketAssignee | null;
  assignedDepartment?: TicketDepartment | null;
  sourceEmailIdentity?: string;
  initialMessageText: string;
  initialMessageHtml?: string;
  direction?: 'INBOUND' | 'OUTBOUND';
  messageId?: string;
  attachments?: TicketAttachment[];
  providerEventId?: string | null;
  actorUid?: string;
  actorName?: string;
  actorEmail?: string;
}): Promise<{ ticket: Ticket; message: TicketMessage }> {
  const db = getAdminDb();
  if (!db) {
    throw new Error('Database service is unavailable');
  }

  const { canonical } = canonicalizeSubject(params.subject);
  const ticketNumber = await getNextTicketNumber();
  const threadId = `th_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();

  // Attempt artist linking if not already provided
  let artistId = params.artistId || null;
  let artistName: string | null = null;
  if (!artistId && params.requesterEmail) {
    const matchedArtist = await findArtistByEmail(params.requesterEmail);
    if (matchedArtist) {
      artistId = matchedArtist.id;
      artistName = matchedArtist.name;
    }
  } else if (artistId) {
    const artistDoc = await db.collection('artists').doc(artistId).get();
    if (artistDoc.exists) {
      artistName = artistDoc.data()?.name || null;
    }
  }

  const ticketRef = db.collection('tickets').doc();
  const ticketId = ticketRef.id;

  const direction = params.direction || 'INBOUND';
  const initialSnippet =
    params.initialMessageText.slice(0, 180).replace(/\s+/g, ' ').trim() || 'New conversation';

  const ticketData: Ticket = {
    id: ticketId,
    ticketNumber,
    threadId,
    subject: params.subject.trim(),
    canonicalSubject: canonical,
    requesterName: params.requesterName.trim() || 'Anonymous Requester',
    requesterEmail: params.requesterEmail.toLowerCase().trim(),
    requesterUserId: params.requesterUserId || null,
    artistId,
    artistName,

    status: direction === 'INBOUND' ? 'OPEN' : 'WAITING_FOR_CUSTOMER',
    priority: params.priority || 'NORMAL',
    category: params.category || 'GENERAL',

    assignedTo: params.assignedTo || null,
    assignedDepartment: params.assignedDepartment || null,

    sourceEmailIdentity: params.sourceEmailIdentity || 'contact@chenabmedia.in',

    lastMessageAt: now,
    lastMessageDirection: direction,
    lastSnippet: initialSnippet,
    messageCount: 1,

    createdAt: now,
    updatedAt: now,
    closedAt: null,
    closedBy: null,
  };

  await ticketRef.set(ticketData);

  // Create the initial message
  const msgRef = db.collection('ticket_messages').doc();
  const finalMessageId =
    params.messageId ||
    (direction === 'OUTBOUND'
      ? generateOutboundMessageId()
      : `<in-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@mail.chenabmedia.in>`);

  const messageData: TicketMessage = {
    id: msgRef.id,
    ticketId,
    threadId,
    direction,
    from: direction === 'INBOUND' ? ticketData.requesterEmail : ticketData.sourceEmailIdentity,
    to: [direction === 'INBOUND' ? ticketData.sourceEmailIdentity : ticketData.requesterEmail],
    subject: ticketData.subject,
    text: params.initialMessageText,
    html: params.initialMessageHtml || undefined,
    messageId: finalMessageId,
    inReplyTo: null,
    references: [],
    senderName: direction === 'INBOUND' ? ticketData.requesterName : 'CHENAB MEDIA',
    isInternalNote: false,
    attachments: params.attachments || [],
    createdAt: now,
    providerEventId: params.providerEventId || null,
    sentByStaffUid: direction === 'OUTBOUND' ? params.actorUid || null : null,
    sentByStaffName: direction === 'OUTBOUND' ? params.actorName || null : null,
  };

  await msgRef.set(messageData);

  // Record TICKET_CREATED event
  await recordTicketEvent({
    ticketId,
    type: 'TICKET_CREATED',
    actorUid: params.actorUid || 'system',
    actorName: params.actorName || 'System',
    actorEmail: params.actorEmail || 'system@chenabmedia.in',
    metadata: {
      ticketNumber,
      requesterEmail: ticketData.requesterEmail,
      subject: ticketData.subject,
      direction,
      artistId,
    },
  });

  return { ticket: ticketData, message: messageData };
}

/**
 * Appends a message to an existing ticket, updating ticket status and snippet.
 */
export async function addTicketMessage(params: {
  ticket: Ticket;
  direction: 'INBOUND' | 'OUTBOUND';
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text: string;
  html?: string;
  messageId: string;
  inReplyTo?: string | null;
  references?: string[];
  senderName: string;
  attachments?: TicketAttachment[];
  providerEventId?: string | null;
  actorUid?: string;
  actorName?: string;
  actorEmail?: string;
}): Promise<TicketMessage> {
  const db = getAdminDb();
  if (!db) throw new Error('Database unavailable');

  const { ticket, direction } = params;
  const now = new Date().toISOString();
  const snippet = params.text.slice(0, 180).replace(/\s+/g, ' ').trim() || 'New message';

  const msgRef = db.collection('ticket_messages').doc();
  const messageData: TicketMessage = {
    id: msgRef.id,
    ticketId: ticket.id,
    threadId: ticket.threadId,
    direction,
    from: params.from,
    to: params.to,
    cc: params.cc || [],
    bcc: params.bcc || [],
    subject: params.subject,
    text: params.text,
    html: params.html,
    messageId: params.messageId,
    inReplyTo: params.inReplyTo || null,
    references: params.references || [],
    senderName: params.senderName,
    isInternalNote: false,
    attachments: params.attachments || [],
    createdAt: now,
    providerEventId: params.providerEventId || null,
    sentByStaffUid: direction === 'OUTBOUND' ? params.actorUid || null : null,
    sentByStaffName: direction === 'OUTBOUND' ? params.actorName || null : null,
  };

  await msgRef.set(messageData);

  // Compute updated ticket status:
  // If customer replied (INBOUND), transition from WAITING_FOR_CUSTOMER to WAITING_FOR_CHENAB or IN_PROGRESS.
  // If CHENAB replied (OUTBOUND), transition to WAITING_FOR_CUSTOMER.
  let nextStatus: TicketStatus = ticket.status;
  if (direction === 'INBOUND') {
    if (ticket.status === 'WAITING_FOR_CUSTOMER' || ticket.status === 'RESOLVED') {
      nextStatus = 'WAITING_FOR_CHENAB';
    }
  } else {
    nextStatus = 'WAITING_FOR_CUSTOMER';
  }

  await db
    .collection('tickets')
    .doc(ticket.id)
    .update({
      lastMessageAt: now,
      lastMessageDirection: direction,
      lastSnippet: snippet,
      status: nextStatus,
      updatedAt: now,
    });

  // Record event
  await recordTicketEvent({
    ticketId: ticket.id,
    type: direction === 'INBOUND' ? 'MESSAGE_RECEIVED' : 'MESSAGE_SENT',
    actorUid: params.actorUid || (direction === 'INBOUND' ? 'requester' : 'system'),
    actorName: params.actorName || (direction === 'INBOUND' ? params.senderName : 'System'),
    actorEmail: params.actorEmail || params.from,
    metadata: {
      messageId: params.messageId,
      direction,
      attachmentCount: (params.attachments || []).length,
    },
  });

  return messageData;
}

/**
 * Adds an internal note to a ticket.
 * Internal notes are NEVER dispatched via email or exposed to customers.
 */
export async function addInternalNote(params: {
  ticketId: string;
  noteText: string;
  actorUid: string;
  actorName: string;
  actorEmail: string;
  attachments?: TicketAttachment[];
}): Promise<TicketMessage> {
  const db = getAdminDb();
  if (!db) throw new Error('Database unavailable');

  const ticketDoc = await db.collection('tickets').doc(params.ticketId).get();
  if (!ticketDoc.exists) {
    throw new Error('Ticket not found');
  }
  const ticket = ticketDoc.data() as Ticket;
  const now = new Date().toISOString();

  const msgRef = db.collection('ticket_messages').doc();
  const noteData: TicketMessage = {
    id: msgRef.id,
    ticketId: params.ticketId,
    threadId: ticket.threadId,
    direction: 'OUTBOUND',
    from: params.actorEmail,
    to: [],
    subject: `Internal Note on [${ticket.ticketNumber}]`,
    text: params.noteText,
    messageId: `<note-${Date.now()}-${msgRef.id}@internal.chenabmedia.in>`,
    senderName: params.actorName,
    isInternalNote: true,
    attachments: params.attachments || [],
    createdAt: now,
    sentByStaffUid: params.actorUid,
    sentByStaffName: params.actorName,
  };

  await msgRef.set(noteData);

  // Update ticket timestamp
  await db.collection('tickets').doc(params.ticketId).update({
    updatedAt: now,
  });

  // Record NOTE_ADDED event
  await recordTicketEvent({
    ticketId: params.ticketId,
    type: 'NOTE_ADDED',
    actorUid: params.actorUid,
    actorName: params.actorName,
    actorEmail: params.actorEmail,
    metadata: {
      noteId: msgRef.id,
      attachmentCount: (params.attachments || []).length,
    },
  });

  return noteData;
}

/**
 * Records an immutable ticket event in ticket_events.
 */
export async function recordTicketEvent(params: {
  ticketId: string;
  type: TicketEventType;
  actorUid: string;
  actorName: string;
  actorEmail: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  const db = getAdminDb();
  if (!db) return;

  try {
    const eventRef = db.collection('ticket_events').doc();
    const event: TicketEvent = {
      id: eventRef.id,
      ticketId: params.ticketId,
      type: params.type,
      actorUid: params.actorUid,
      actorName: params.actorName,
      actorEmail: params.actorEmail,
      metadata: params.metadata || {},
      createdAt: new Date().toISOString(),
    };
    await eventRef.set(event);
  } catch (err) {
    console.error('[recordTicketEvent] Error logging ticket event:', err);
  }
}

/**
 * Retrieves a full ticket with its messages, events, and authorized attachment URLs.
 */
export async function getTicketWithDetails(ticketId: string): Promise<{
  ticket: Ticket;
  messages: TicketMessage[];
  events: TicketEvent[];
} | null> {
  const db = getAdminDb();
  if (!db) return null;

  const ticketSnap = await db.collection('tickets').doc(ticketId).get();
  if (!ticketSnap.exists) return null;

  const ticket = { ...ticketSnap.data(), id: ticketSnap.id } as Ticket;

  // Fetch messages in chronological order
  const messagesSnap = await db
    .collection('ticket_messages')
    .where('ticketId', '==', ticketId)
    .get();

  const messages: TicketMessage[] = messagesSnap.docs.map((doc) => {
    return { ...doc.data(), id: doc.id } as TicketMessage;
  });

  // Sort chronological ascending
  messages.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Populate signed download URLs for any private attachments
  for (const msg of messages) {
    if (msg.attachments && msg.attachments.length > 0) {
      for (const att of msg.attachments) {
        if (att.storageFileId && !att.signedUrl) {
          try {
            const fileRec = await getStorageFile(att.storageFileId, true);
            if (fileRec && fileRec.downloadUrl) {
              att.signedUrl = fileRec.downloadUrl;
            }
          } catch (e) {
            console.warn('[getTicketWithDetails] Could not resolve attachment url:', e);
          }
        }
      }
    }
  }

  // Fetch events in chronological order
  const eventsSnap = await db
    .collection('ticket_events')
    .where('ticketId', '==', ticketId)
    .get();

  const events: TicketEvent[] = eventsSnap.docs.map((doc) => {
    return { ...doc.data(), id: doc.id } as TicketEvent;
  });
  events.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return { ticket, messages, events };
}
