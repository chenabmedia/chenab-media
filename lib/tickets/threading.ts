import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebase/admin';
import { Ticket, TicketMessage } from '@/types/tickets';

/**
 * Strips repeated Re:, Fwd:, FW:, RE: prefixes from an email subject line
 * without corrupting the canonical topic. Also extracts ticket token if present.
 */
export function canonicalizeSubject(rawSubject?: string | null): {
  canonical: string;
  ticketNumberToken?: string | null;
} {
  if (!rawSubject || typeof rawSubject !== 'string') {
    return { canonical: 'No Subject', ticketNumberToken: null };
  }

  let cleaned = rawSubject.trim();

  // Look for ticket number pattern like [CHN-0001042] or CHN-0001042
  const tokenMatch = cleaned.match(/\[?(CHN-\d{4,10})\]?/i);
  const ticketNumberToken = tokenMatch ? tokenMatch[1].toUpperCase() : null;

  // Remove repeated prefixes like "Re:", "RE:", "Fwd:", "FW:", "[Fwd:]", etc.
  const prefixRegex = /^(?:\[?(?:re|fwd|fw)\]?[:\s-]+)+/i;
  while (prefixRegex.test(cleaned)) {
    cleaned = cleaned.replace(prefixRegex, '').trim();
  }

  // Remove the ticket token from the canonical subject string so it's clean
  if (ticketNumberToken) {
    const removeTokenRegex = new RegExp(`\\[?${ticketNumberToken}\\]?:?\\s*`, 'gi');
    cleaned = cleaned.replace(removeTokenRegex, '').trim();
  }

  // Clean trailing punctuation / excess whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return {
    canonical: cleaned || 'Inquiry',
    ticketNumberToken,
  };
}

/**
 * Normalizes email list string or array into clean lowercase addresses
 */
export function normalizeEmailArray(input?: string | string[] | null): string[] {
  if (!input) return [];
  const list = Array.isArray(input) ? input : input.split(',');
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

  return list
    .map((item) => {
      const match = item.match(emailRegex);
      return match ? match[0].toLowerCase().trim() : '';
    })
    .filter(Boolean);
}

/**
 * Generates an RFC-compliant, cryptographically unique Message-ID header for outbound email.
 */
export function generateOutboundMessageId(domain: string = 'chenabmedia.in'): string {
  const unique = crypto.randomUUID();
  const timestamp = Date.now();
  return `<msg-${timestamp}-${unique}@${domain}>`;
}

export interface ThreadMatchResult {
  matched: boolean;
  ticket: Ticket | null;
  matchReason?:
    | 'TICKET_TOKEN'
    | 'IN_REPLY_TO'
    | 'REFERENCES'
    | 'KNOWN_MESSAGE_ID'
    | 'VALIDATED_FALLBACK'
    | 'NEW_THREAD';
}

/**
 * Finds an existing ticket based on strict threading hierarchy:
 * 1. Ticket token found in Subject, References, or In-Reply-To header
 * 2. In-Reply-To matching a known ticket_messages messageId
 * 3. References header matching any known ticket_messages messageId
 * 4. Exact messageId match (duplicate)
 * 5. Carefully validated fallback: matching requesterEmail + matching canonicalSubject on an OPEN/IN_PROGRESS/WAITING ticket within the last 30 days.
 */
export async function matchEmailToThread(params: {
  messageId?: string | null;
  inReplyTo?: string | null;
  references?: string[] | null;
  rawSubject?: string | null;
  fromEmail: string;
  customHeaders?: Record<string, string>;
}): Promise<ThreadMatchResult> {
  const db = getAdminDb();
  if (!db) {
    return { matched: false, ticket: null, matchReason: 'NEW_THREAD' };
  }

  const { messageId, inReplyTo, references = [], rawSubject, fromEmail, customHeaders = {} } = params;
  const { canonical, ticketNumberToken } = canonicalizeSubject(rawSubject);
  const normalizedFrom = fromEmail.toLowerCase().trim();

  // 1. Check for Ticket Token in Subject or Custom Headers
  const tokenFromHeader =
    customHeaders['x-chenab-ticket-number'] ||
    customHeaders['x-chenab-ticket-id'] ||
    ticketNumberToken;

  if (tokenFromHeader) {
    const cleanToken = tokenFromHeader.trim().toUpperCase();
    const snap = await db
      .collection('tickets')
      .where('ticketNumber', '==', cleanToken)
      .limit(1)
      .get();

    if (!snap.empty) {
      const doc = snap.docs[0];
      return {
        matched: true,
        ticket: { ...doc.data(), id: doc.id } as Ticket,
        matchReason: 'TICKET_TOKEN',
      };
    }
  }

  // 2. Check In-Reply-To header
  if (inReplyTo && inReplyTo.trim()) {
    const cleanInReplyTo = inReplyTo.trim();
    const snap = await db
      .collection('ticket_messages')
      .where('messageId', '==', cleanInReplyTo)
      .limit(1)
      .get();

    if (!snap.empty) {
      const matchedMsg = snap.docs[0].data() as TicketMessage;
      if (matchedMsg.ticketId) {
        const ticketDoc = await db.collection('tickets').doc(matchedMsg.ticketId).get();
        if (ticketDoc.exists) {
          return {
            matched: true,
            ticket: { ...ticketDoc.data(), id: ticketDoc.id } as Ticket,
            matchReason: 'IN_REPLY_TO',
          };
        }
      }
    }
  }

  // 3. Check References header array
  if (references && references.length > 0) {
    // Check up to the last 5 references
    const checkRefs = references.slice(-5).map((r) => r.trim()).filter(Boolean);
    for (const refId of checkRefs) {
      const snap = await db
        .collection('ticket_messages')
        .where('messageId', '==', refId)
        .limit(1)
        .get();

      if (!snap.empty) {
        const matchedMsg = snap.docs[0].data() as TicketMessage;
        if (matchedMsg.ticketId) {
          const ticketDoc = await db.collection('tickets').doc(matchedMsg.ticketId).get();
          if (ticketDoc.exists) {
            return {
              matched: true,
              ticket: { ...ticketDoc.data(), id: ticketDoc.id } as Ticket,
              matchReason: 'REFERENCES',
            };
          }
        }
      }
    }
  }

  // 4. Check if this exact Message-ID was already received (duplicate event)
  if (messageId && messageId.trim()) {
    const cleanMsgId = messageId.trim();
    const snap = await db
      .collection('ticket_messages')
      .where('messageId', '==', cleanMsgId)
      .limit(1)
      .get();

    if (!snap.empty) {
      const matchedMsg = snap.docs[0].data() as TicketMessage;
      if (matchedMsg.ticketId) {
        const ticketDoc = await db.collection('tickets').doc(matchedMsg.ticketId).get();
        if (ticketDoc.exists) {
          return {
            matched: true,
            ticket: { ...ticketDoc.data(), id: ticketDoc.id } as Ticket,
            matchReason: 'KNOWN_MESSAGE_ID',
          };
        }
      }
    }
  }

  // 5. Carefully validated fallback matching:
  // Must match requesterEmail exactly AND matching canonicalSubject AND ticket not closed within 30 days
  if (normalizedFrom && canonical && canonical !== 'No Subject' && canonical !== 'Inquiry') {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const fallbackSnap = await db
      .collection('tickets')
      .where('requesterEmail', '==', normalizedFrom)
      .where('canonicalSubject', '==', canonical)
      .where('lastMessageAt', '>=', thirtyDaysAgo)
      .limit(2)
      .get();

    if (fallbackSnap.size === 1) {
      const doc = fallbackSnap.docs[0];
      const ticket = { ...doc.data(), id: doc.id } as Ticket;
      // Only match if not explicitly closed
      if (ticket.status !== 'CLOSED') {
        return {
          matched: true,
          ticket,
          matchReason: 'VALIDATED_FALLBACK',
        };
      }
    }
  }

  // No thread matched, a new ticket will be opened
  return {
    matched: false,
    ticket: null,
    matchReason: 'NEW_THREAD',
  };
}
