import { NextRequest, NextResponse } from 'next/server';
import {
  verifySvixSignature,
  processInboundEmail,
  InboundEmailPayload,
} from '@/lib/tickets/inbound';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const webhookSecret =
      process.env.RESEND_WEBHOOK_SECRET || process.env.INBOUND_WEBHOOK_SECRET;

    // 1. Authenticity Verification
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');
    const customSecretHeader = req.headers.get('x-webhook-secret');
    const authHeader = req.headers.get('authorization');

    let authenticated = false;

    if (webhookSecret) {
      if (svixId && svixSignature) {
        authenticated = verifySvixSignature({
          payload: rawBody,
          headers: {
            id: svixId,
            timestamp: svixTimestamp,
            signature: svixSignature,
          },
          secret: webhookSecret,
        });
      } else if (customSecretHeader && customSecretHeader === webhookSecret) {
        authenticated = true;
      } else if (authHeader && authHeader === `Bearer ${webhookSecret}`) {
        authenticated = true;
      }
    } else {
      // In local dev or unconfigured test environment
      console.warn(
        '[Inbound Webhook] RESEND_WEBHOOK_SECRET is not configured in environment.'
      );
      if (process.env.NODE_ENV === 'development' || !webhookSecret) {
        authenticated = true;
      }
    }

    if (!authenticated) {
      console.error('[Inbound Webhook] Webhook authenticity verification failed.');
      return NextResponse.json(
        { error: 'Unauthorized: Invalid webhook signature or secret.' },
        { status: 401 }
      );
    }

    // 2. Parse JSON body
    let jsonBody: any;
    try {
      jsonBody = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const eventType = jsonBody.type || 'email.received';
    const eventId = svixId || jsonBody.id || jsonBody.event_id || jsonBody.data?.email_id;

    let normalizedPayload: InboundEmailPayload;

    // 3. Handle Resend Inbound "email.received" event
    if (eventType === 'email.received' && jsonBody.data?.email_id) {
      const emailId = jsonBody.data.email_id;
      const resendApiKey = process.env.RESEND_API_KEY;

      let fullEmailData: any = null;

      if (resendApiKey) {
        try {
          const res = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
          });
          if (res.ok) {
            fullEmailData = await res.json();
          }
        } catch (fetchErr) {
          console.warn('[Inbound Webhook] Could not fetch received email from Resend API:', fetchErr);
        }
      }

      // Merge data from API or webhook metadata
      const source = fullEmailData || jsonBody.data;

      // Extract headers
      const headersMap: Record<string, string> = {};
      if (source.headers) {
        if (Array.isArray(source.headers)) {
          source.headers.forEach((h: any) => {
            if (h.name && h.value) {
              headersMap[h.name.toLowerCase()] = h.value;
            }
          });
        } else if (typeof source.headers === 'object') {
          Object.keys(source.headers).forEach((k) => {
            headersMap[k.toLowerCase()] = source.headers[k];
          });
        }
      }

      normalizedPayload = {
        eventId: emailId,
        from: source.from || jsonBody.data.from,
        to: source.to || jsonBody.data.to,
        cc: source.cc || jsonBody.data.cc,
        bcc: source.bcc || jsonBody.data.bcc,
        subject: source.subject || jsonBody.data.subject || 'Inquiry',
        text: source.text || '',
        html: source.html || '',
        messageId: source.message_id || headersMap['message-id'],
        inReplyTo: source.in_reply_to || headersMap['in-reply-to'],
        references: source.references || headersMap['references'],
        headers: headersMap,
        attachments: (source.attachments || []).map((a: any) => ({
          filename: a.filename || a.name || 'file',
          contentType: a.content_type || a.contentType,
          content: a.content,
          size: a.size,
          url: a.download_url || a.url,
        })),
      };
    } else {
      // 4. Standard Direct Inbound JSON format
      normalizedPayload = {
        eventId,
        from: jsonBody.from || jsonBody.sender || '',
        to: jsonBody.to || jsonBody.recipient || '',
        cc: jsonBody.cc,
        bcc: jsonBody.bcc,
        subject: jsonBody.subject || 'Inquiry',
        text: jsonBody.text || jsonBody.bodyText || '',
        html: jsonBody.html || jsonBody.bodyHtml || '',
        messageId: jsonBody.messageId || jsonBody['message-id'] || jsonBody.headers?.['message-id'],
        inReplyTo: jsonBody.inReplyTo || jsonBody['in-reply-to'] || jsonBody.headers?.['in-reply-to'],
        references: jsonBody.references || jsonBody.headers?.references,
        headers: jsonBody.headers || {},
        attachments: jsonBody.attachments || [],
      };
    }

    if (!normalizedPayload.from) {
      return NextResponse.json(
        { error: 'Missing required sender (from) field in inbound payload' },
        { status: 400 }
      );
    }

    // 5. Process Inbound Email (Idempotent, R2 attachment storage, thread matching)
    const result = await processInboundEmail(normalizedPayload, eventId);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('[Inbound Webhook Error]:', error);
    return NextResponse.json(
      { error: 'Failed to process inbound email webhook', details: error?.message },
      { status: 500 }
    );
  }
}
