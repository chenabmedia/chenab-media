import { Resend } from 'resend';
import { getAdminDb } from '@/lib/firebase/admin';
import { recordAuditLog } from '@/lib/firebase/audit';
import { getStorageFile } from '@/lib/storage/service';
import { downloadObject, isR2Configured } from '@/lib/storage/r2';
import { Ticket, TicketAttachment, TicketMessage } from '@/types/tickets';
import { EmailIdentity } from '@/types/site';
import { addTicketMessage } from './service';
import { generateOutboundMessageId } from './threading';

export interface SendTicketReplyOptions {
  ticketId: string;
  senderIdentityId: string;
  bodyText: string;
  bodyHtml?: string;
  cc?: string[];
  bcc?: string[];
  attachmentFileIds?: string[];
  actor: {
    uid: string;
    email: string;
    displayName: string;
  };
}

export interface SendTicketReplyResult {
  success: boolean;
  message?: TicketMessage;
  resendId?: string;
  error?: string;
}

/**
 * Dispatches an outbound email reply to a ticket thread via Resend,
 * preserving MIME threading headers and storing the message record.
 */
export async function sendTicketReply(
  options: SendTicketReplyOptions
): Promise<SendTicketReplyResult> {
  const db = getAdminDb();
  if (!db) {
    return { success: false, error: 'Database service unavailable' };
  }

  const { ticketId, senderIdentityId, bodyText, bodyHtml, cc = [], bcc = [], attachmentFileIds = [], actor } = options;

  // 1. Fetch Ticket
  const ticketSnap = await db.collection('tickets').doc(ticketId).get();
  if (!ticketSnap.exists) {
    return { success: false, error: 'Ticket not found' };
  }
  const ticket = { ...ticketSnap.data(), id: ticketSnap.id } as Ticket;

  // 2. Fetch Sender Identity
  let identity: EmailIdentity | null = null;
  const identitySnap = await db.collection('emailIdentities').doc(senderIdentityId).get();
  if (identitySnap.exists) {
    identity = { ...identitySnap.data(), id: identitySnap.id } as EmailIdentity;
  } else {
    // Fallback search by email
    const byEmail = await db.collection('emailIdentities').where('email', '==', senderIdentityId).limit(1).get();
    if (!byEmail.empty) {
      identity = { ...byEmail.docs[0].data(), id: byEmail.docs[0].id } as EmailIdentity;
    }
  }

  const fromEmail = identity?.email || ticket.sourceEmailIdentity || 'contact@chenabmedia.in';
  const fromName = identity?.displayName || 'CHENAB MEDIA Support';
  const formattedFrom = `${fromName} <${fromEmail}>`;
  const replyToAddress = identity?.replyTo || fromEmail;

  // 3. Find previous messages in thread to determine In-Reply-To and References
  const msgSnap = await db
    .collection('ticket_messages')
    .where('ticketId', '==', ticketId)
    .get();

  const existingMessages = msgSnap.docs.map((d) => d.data() as TicketMessage);
  existingMessages.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Find last inbound or outbound message ID
  const lastMessage = existingMessages[existingMessages.length - 1];
  const inReplyTo = lastMessage?.messageId || null;

  // Collect references list
  const referencesList: string[] = [];
  existingMessages.forEach((m) => {
    if (m.messageId && !referencesList.includes(m.messageId)) {
      referencesList.push(m.messageId);
    }
  });

  const outboundMessageId = generateOutboundMessageId();
  const emailSubject = `Re: [${ticket.ticketNumber}] ${ticket.canonicalSubject || ticket.subject}`;

  // 4. Resolve Attachments from CHENAB Storage
  const messageAttachments: TicketAttachment[] = [];
  const resendAttachments: Array<{ filename: string; content?: Buffer; path?: string }> = [];

  if (attachmentFileIds.length > 0 && isR2Configured()) {
    for (const fId of attachmentFileIds) {
      try {
        const fileRec = await getStorageFile(fId, false);
        if (fileRec && fileRec.objectKey) {
          const objData = await downloadObject(fileRec.objectKey);
          if (objData.body) {
            const bytes = await (objData.body as any).transformToByteArray();
            const buffer = Buffer.from(bytes);
            resendAttachments.push({
              filename: fileRec.filename,
              content: buffer,
            });
            messageAttachments.push({
              id: fId,
              storageFileId: fId,
              filename: fileRec.filename,
              mimeType: fileRec.mimeType,
              size: fileRec.size,
              category: fileRec.category,
            });
          }
        }
      } catch (attErr) {
        console.warn(`[sendTicketReply] Could not attach file ${fId}:`, attErr);
      }
    }
  }

  // 5. Append Identity Signature if present
  let finalHtml = bodyHtml || `<div style="font-family: sans-serif; font-size: 15px; line-height: 1.6; color: #111;">${bodyText.replace(/\n/g, '<br/>')}</div>`;
  let finalText = bodyText;

  if (identity?.signature) {
    finalHtml += `<br/><br/><div style="border-top: 1px solid #ddd; padding-top: 10px; color: #666; font-size: 13px;">${identity.signature.replace(/\n/g, '<br/>')}</div>`;
    finalText += `\n\n--\n${identity.signature}`;
  }

  // 6. Send via Resend
  const resendApiKey = process.env.RESEND_API_KEY;
  let resendId: string | undefined = undefined;
  let sendStatus: 'SENT' | 'FAILED' = 'SENT';
  let sendError: string | undefined = undefined;

  if (!resendApiKey) {
    console.warn('[sendTicketReply] RESEND_API_KEY missing. Simulating delivery in test environment.');
    resendId = `sim_${Date.now()}`;
  } else {
    try {
      const resend = new Resend(resendApiKey);
      const headers: Record<string, string> = {
        'Message-ID': outboundMessageId,
        'X-Chenab-Ticket-Number': ticket.ticketNumber,
        'X-Chenab-Thread-Id': ticket.threadId,
      };

      if (inReplyTo) {
        headers['In-Reply-To'] = inReplyTo;
      }
      if (referencesList.length > 0) {
        headers['References'] = referencesList.join(' ');
      }

      const resendPayload: any = {
        from: formattedFrom,
        to: [ticket.requesterEmail],
        replyTo: replyToAddress,
        subject: emailSubject,
        text: finalText,
        html: finalHtml,
        headers,
      };

      if (cc.length > 0) resendPayload.cc = cc;
      if (bcc.length > 0) resendPayload.bcc = bcc;
      if (resendAttachments.length > 0) resendPayload.attachments = resendAttachments;

      const res = (await resend.emails.send(resendPayload)) as any;
      if (res.error) {
        sendStatus = 'FAILED';
        sendError = typeof res.error === 'string' ? res.error : res.error.message || JSON.stringify(res.error);
      } else {
        resendId = res.data?.id;
      }
    } catch (err: any) {
      sendStatus = 'FAILED';
      sendError = err.message || 'Error communicating with Resend';
    }
  }

  // 7. Log in emailLogs collection (integrates with existing system)
  try {
    await db.collection('emailLogs').add({
      senderIdentityId: identity?.id || senderIdentityId,
      from: formattedFrom,
      to: ticket.requesterEmail,
      subject: emailSubject,
      status: sendStatus,
      resendId: resendId || null,
      error: sendError || null,
      sentBy: actor.email,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      messageId: outboundMessageId,
      createdAt: new Date().toISOString(),
    });
  } catch (logErr) {
    console.warn('[sendTicketReply] Failed to log email in emailLogs:', logErr);
  }

  if (sendStatus === 'FAILED') {
    return {
      success: false,
      error: sendError || 'Outbound email dispatch failed',
    };
  }

  // 8. Record Message in ticket_messages and update Ticket state
  const message = await addTicketMessage({
    ticket,
    direction: 'OUTBOUND',
    from: fromEmail,
    to: [ticket.requesterEmail],
    cc,
    bcc,
    subject: emailSubject,
    text: finalText,
    html: finalHtml,
    messageId: outboundMessageId,
    inReplyTo,
    references: referencesList,
    senderName: fromName,
    attachments: messageAttachments,
    actorUid: actor.uid,
    actorName: actor.displayName,
    actorEmail: actor.email,
  });

  // 9. Record Audit Log
  await recordAuditLog({
    actorUid: actor.uid,
    actorName: actor.displayName,
    actorEmail: actor.email,
    action: 'TICKET_REPLIED',
    targetType: 'ticket',
    targetId: ticket.id,
    description: `Sent reply on ticket ${ticket.ticketNumber} to ${ticket.requesterEmail}`,
    metadata: {
      ticketNumber: ticket.ticketNumber,
      recipient: ticket.requesterEmail,
      resendId,
      messageId: outboundMessageId,
    },
  });

  return {
    success: true,
    message,
    resendId,
  };
}
