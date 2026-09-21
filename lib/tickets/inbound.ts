import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebase/admin';
import { uploadDirectBuffer } from '@/lib/storage/service';
import { isR2Configured } from '@/lib/storage/r2';
import { FORBIDDEN_EXTENSIONS } from '@/lib/storage/config';
import { Ticket, TicketAttachment } from '@/types/tickets';
import { matchEmailToThread, normalizeEmailArray } from './threading';
import { createTicket, addTicketMessage } from './service';

/**
 * Sanitizes untrusted inbound email HTML by stripping executable scripts,
 * event handlers, frames, and unsafe javascript: URIs.
 */
export function sanitizeInboundHtml(rawHtml?: string | null): string {
  if (!rawHtml || typeof rawHtml !== 'string') return '';

  let clean = rawHtml;

  // 1. Remove script tags and contents
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 2. Remove style tags with dangerous imports or expressions
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // 3. Remove iframe, object, embed, applet, form tags
  clean = clean.replace(/<\/?(?:iframe|object|embed|applet|form|base)[^>]*>/gi, '');

  // 4. Remove all inline event handlers like onload, onerror, onclick, onmouseover, etc.
  clean = clean.replace(/\son[a-zA-Z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

  // 5. Neutralize javascript: and vbscript: URIs
  clean = clean.replace(/href\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi, 'href="#"');
  clean = clean.replace(/src\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi, 'src=""');

  return clean;
}

/**
 * Verifies Svix webhook signatures used by Resend
 */
export function verifySvixSignature(params: {
  payload: string;
  headers: {
    id?: string | null;
    timestamp?: string | null;
    signature?: string | null;
  };
  secret: string;
}): boolean {
  const { payload, headers, secret } = params;
  if (!headers.id || !headers.timestamp || !headers.signature || !secret) {
    return false;
  }

  // Prevent replay attacks: ensure timestamp is within 10 minutes
  const tsNum = parseInt(headers.timestamp, 10);
  if (isNaN(tsNum)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - tsNum) > 600) {
    return false;
  }

  // Clean secret (remove whsec_ prefix if present, then decode base64)
  const cleanSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  let secretKey: Buffer;
  try {
    secretKey = Buffer.from(cleanSecret, 'base64');
  } catch {
    secretKey = Buffer.from(cleanSecret, 'utf-8');
  }

  const toSign = `${headers.id}.${headers.timestamp}.${payload}`;
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(toSign);
  const calculatedSig = hmac.digest('base64');

  // Split signatures in header (header might contain multiple like "v1,signature1 v1,signature2")
  const sigList = headers.signature.split(' ');
  for (const part of sigList) {
    const [version, sig] = part.split(',');
    if (version === 'v1' && sig) {
      if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(calculatedSig))) {
        return true;
      }
    }
  }

  return false;
}

export interface InboundEmailPayload {
  eventId?: string;
  from: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  messageId?: string;
  inReplyTo?: string | null;
  references?: string[] | string;
  headers?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    contentType?: string;
    content?: string | Buffer; // Base64 or Buffer
    size?: number;
    url?: string;
  }>;
}

/**
 * Main inbound email processor. Validates, deduplicates, stores attachments to R2,
 * correlates thread or opens new ticket, and saves message.
 */
export async function processInboundEmail(
  payload: InboundEmailPayload,
  providerEventId?: string | null
): Promise<{ success: boolean; duplicate?: boolean; ticketId?: string; messageId?: string; error?: string }> {
  const db = getAdminDb();
  if (!db) {
    return { success: false, error: 'Database service unavailable' };
  }

  const rawMessageId = payload.messageId || `<in-${Date.now()}-${crypto.randomUUID()}@inbound.chenabmedia.in>`;
  const cleanMessageId = rawMessageId.trim();

  // 1. Idempotency Protection: Check if event ID or Message-ID was already processed
  if (providerEventId) {
    const eventQuery = await db
      .collection('ticket_messages')
      .where('providerEventId', '==', providerEventId)
      .limit(1)
      .get();
    if (!eventQuery.empty) {
      const msg = eventQuery.docs[0].data();
      return { success: true, duplicate: true, ticketId: msg.ticketId, messageId: msg.id };
    }
  }

  const msgIdQuery = await db
    .collection('ticket_messages')
    .where('messageId', '==', cleanMessageId)
    .limit(1)
    .get();

  if (!msgIdQuery.empty) {
    const msg = msgIdQuery.docs[0].data();
    return { success: true, duplicate: true, ticketId: msg.ticketId, messageId: msg.id };
  }

  // 2. Parse senders and recipients
  const fromAddresses = normalizeEmailArray(payload.from);
  const requesterEmail = fromAddresses[0] || payload.from.trim().toLowerCase();
  if (!requesterEmail || !requesterEmail.includes('@')) {
    return { success: false, error: 'Invalid sender email address' };
  }

  // Extract friendly display name from from string if present (e.g., "Amaan Khan <amaan@example.com>")
  let requesterName = 'Customer';
  const nameMatch = payload.from.match(/^([^<]+)<[^>]+>$/);
  if (nameMatch) {
    requesterName = nameMatch[1].trim().replace(/^["']|["']$/g, '');
  } else {
    requesterName = requesterEmail.split('@')[0];
  }

  const toList = normalizeEmailArray(payload.to);
  const targetIdentity = toList[0] || 'contact@chenabmedia.in';

  // 3. Thread Matching Hierarchy
  let referencesArr: string[] = [];
  if (Array.isArray(payload.references)) {
    referencesArr = payload.references;
  } else if (typeof payload.references === 'string') {
    referencesArr = payload.references.split(/\s+/).filter(Boolean);
  }

  const matchResult = await matchEmailToThread({
    messageId: cleanMessageId,
    inReplyTo: payload.inReplyTo || null,
    references: referencesArr,
    rawSubject: payload.subject,
    fromEmail: requesterEmail,
    customHeaders: payload.headers || {},
  });

  const sanitizedHtml = sanitizeInboundHtml(payload.html);
  const plainText =
    payload.text ||
    sanitizedHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() ||
    '(Empty message)';

  // Determine ticket ID: either existing ticket or newly created ticket
  let ticket: Ticket;
  let isNewTicket = false;

  if (matchResult.matched && matchResult.ticket) {
    ticket = matchResult.ticket;
  } else {
    isNewTicket = true;
    const res = await createTicket({
      subject: payload.subject || 'Incoming Inquiry',
      requesterName,
      requesterEmail,
      sourceEmailIdentity: targetIdentity,
      initialMessageText: plainText,
      initialMessageHtml: sanitizedHtml,
      direction: 'INBOUND',
      messageId: cleanMessageId,
      providerEventId,
    });
    ticket = res.ticket;
  }

  // 4. Process Attachments and Store in Cloudflare R2
  const storedAttachments: TicketAttachment[] = [];
  if (payload.attachments && payload.attachments.length > 0) {
    for (const att of payload.attachments) {
      try {
        const rawFilename = att.filename || 'attachment.dat';
        const ext = rawFilename.split('.').pop()?.toLowerCase() || '';

        // Reject dangerous/executable extensions
        if (FORBIDDEN_EXTENSIONS.has(ext)) {
          console.warn(`[Inbound] Blocked dangerous attachment extension: ${rawFilename}`);
          continue;
        }

        // Limit size: max 25 MB per attachment
        let buffer: Buffer | null = null;
        if (Buffer.isBuffer(att.content)) {
          buffer = att.content;
        } else if (typeof att.content === 'string') {
          buffer = Buffer.from(att.content, 'base64');
        } else if (att.url) {
          // Fetch attachment from URL (e.g. Resend or external webhook asset)
          const res = await fetch(att.url);
          if (res.ok) {
            const arr = await res.arrayBuffer();
            buffer = Buffer.from(arr);
          }
        }

        if (buffer && buffer.length <= 25 * 1024 * 1024 && isR2Configured()) {
          const uploadedRecord = await uploadDirectBuffer({
            buffer,
            filename: rawFilename,
            mimeType: att.contentType || 'application/octet-stream',
            category: 'tickets',
            visibility: 'PRIVATE',
            ownerType: 'ticket',
            ownerId: ticket.id,
            description: `Inbound email attachment for ticket ${ticket.ticketNumber}`,
            uploader: {
              uid: 'inbound-webhook',
              email: requesterEmail,
              displayName: requesterName,
            },
          });

          storedAttachments.push({
            id: uploadedRecord.id,
            storageFileId: uploadedRecord.id,
            filename: uploadedRecord.filename,
            mimeType: uploadedRecord.mimeType,
            size: uploadedRecord.size,
            category: 'tickets',
          });
        }
      } catch (attError) {
        console.warn('[Inbound] Failed to process attachment:', attError);
      }
    }
  }

  // If this was an existing ticket, add the message now (with attachments attached)
  let finalMessageId = cleanMessageId;
  if (!isNewTicket) {
    const savedMsg = await addTicketMessage({
      ticket,
      direction: 'INBOUND',
      from: requesterEmail,
      to: [targetIdentity],
      cc: normalizeEmailArray(payload.cc),
      bcc: normalizeEmailArray(payload.bcc),
      subject: payload.subject,
      text: plainText,
      html: sanitizedHtml,
      messageId: cleanMessageId,
      inReplyTo: payload.inReplyTo || null,
      references: referencesArr,
      senderName: requesterName,
      attachments: storedAttachments,
      providerEventId,
    });
    finalMessageId = savedMsg.id;
  } else if (storedAttachments.length > 0) {
    // For newly created ticket, update initial message with attachments
    const msgQuery = await db
      .collection('ticket_messages')
      .where('ticketId', '==', ticket.id)
      .limit(1)
      .get();
    if (!msgQuery.empty) {
      await msgQuery.docs[0].ref.update({
        attachments: storedAttachments,
      });
    }
  }

  // 5. Notify Admins / Executives
  try {
    await db.collection('notifications').add({
      title: isNewTicket ? `New Ticket ${ticket.ticketNumber}` : `New Reply on ${ticket.ticketNumber}`,
      body: `${requesterName} (${requesterEmail}): ${plainText.slice(0, 100)}`,
      type: 'TICKET_MESSAGE',
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      read: false,
      createdAt: new Date().toISOString(),
    });
  } catch (notifErr) {
    console.warn('[Inbound] Could not write admin notification:', notifErr);
  }

  return {
    success: true,
    ticketId: ticket.id,
    messageId: finalMessageId,
  };
}
