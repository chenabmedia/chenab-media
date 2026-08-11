import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/firestore';
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { recordAuditLog } from '@/lib/firebase/audit';
import { EmailIdentity } from '@/types/site';

const recentSends = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const authRes = await verifyServerAuth(req, 'email.send');
    if (!authRes.authenticated || !authRes.profile) {
      return NextResponse.json({ error: authRes.error || 'Unauthorized: email.send permission required' }, { status: 403 });
    }

    const now = Date.now();
    const lastSend = recentSends.get(authRes.profile.uid) || 0;
    if (now - lastSend < 6000) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please wait a few seconds before sending another email.' }, { status: 429 });
    }
    recentSends.set(authRes.profile.uid, now);

    const body = await req.json();
    const { senderIdentityId, to, cc, bcc, subject, message, buttonEnabled, buttonLabel, buttonUrl } = body;

    if (!senderIdentityId || !to || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields: senderIdentityId, to, subject, message' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipients = to.split(',').map((e: string) => e.trim()).filter(Boolean);
    for (const r of recipients) {
      if (!emailRegex.test(r)) {
        return NextResponse.json({ error: `Invalid recipient email format: ${r}` }, { status: 400 });
      }
    }

    let senderIdentity: EmailIdentity | null = null;
    if (adminDb) {
      const docSnap = await adminDb.collection('emailIdentities').doc(senderIdentityId).get();
      if (docSnap.exists) {
        senderIdentity = { id: docSnap.id, ...(docSnap.data() as Omit<EmailIdentity, 'id'>) };
      }
    } else if (db) {
      const docSnap = await getDoc(doc(db, 'emailIdentities', senderIdentityId));
      if (docSnap.exists()) {
        senderIdentity = { id: docSnap.id, ...(docSnap.data() as Omit<EmailIdentity, 'id'>) };
      }
    }

    if (!senderIdentity || !senderIdentity.enabled) {
      return NextResponse.json({ error: 'Selected sender identity is invalid or disabled' }, { status: 400 });
    }

    const fromEmail = `${senderIdentity.displayName} <${senderIdentity.email}>`;
    const replyToEmail = senderIdentity.replyTo || senderIdentity.email;

    let validatedButtonHtml = '';
    if (buttonEnabled && buttonUrl) {
      const trimmedUrl = buttonUrl.trim();
      if (!trimmedUrl.startsWith('https://') && !trimmedUrl.startsWith('/')) {
        return NextResponse.json({ error: 'Button URL must be a secure HTTPS URL or approved internal path' }, { status: 400 });
      }
      const safeLabel = (buttonLabel || 'Open Link').replace(/[<>]/g, '');
      const safeUrl = trimmedUrl.replace(/["']/g, '');
      validatedButtonHtml = `
        <div style="margin: 24px 0;">
          <a href="${safeUrl}" target="_blank" style="background-color: #F5F5F5; color: #080808; padding: 12px 24px; text-decoration: none; font-weight: bold; display: inline-block; font-family: monospace; font-size: 14px;">
            ${safeLabel} &rarr;
          </a>
        </div>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { background-color: #080808; color: #E5E5E5; font-family: sans-serif; padding: 32px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #111111; border: 1px solid #222222; padding: 40px; }
            .header { border-bottom: 1px solid #222222; padding-bottom: 20px; margin-bottom: 24px; font-family: monospace; font-size: 12px; color: #888888; letter-spacing: 0.1em; }
            .content { font-size: 15px; line-height: 1.6; color: #CCCCCC; white-space: pre-wrap; }
            .footer { margin-top: 40px; border-top: 1px solid #222222; padding-top: 20px; font-size: 11px; color: #666666; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              CHENAB MEDIA DISPATCH &bull; ${senderIdentity.email.toUpperCase()}
            </div>
            <div class="content">
              ${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
              ${validatedButtonHtml}
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Chenab Media. All rights reserved.<br>
              This message was dispatched securely via Chenab Global Infrastructure.
            </div>
          </div>
        </body>
      </html>
    `;

    const resendApiKey = process.env.RESEND_API_KEY;
    let resendId = '';
    let sendStatus: 'SENT' | 'FAILED' = 'SENT';
    let errorMessage = '';

    if (!resendApiKey) {
      sendStatus = 'FAILED';
      errorMessage = 'RESEND_API_KEY is not configured in environment variables';
    } else {
      try {
        const resend = new Resend(resendApiKey);
        const response = await resend.emails.send({
          from: fromEmail,
          to: recipients,
          cc: cc ? cc.split(',').map((e: string) => e.trim()).filter(Boolean) : undefined,
          bcc: bcc ? bcc.split(',').map((e: string) => e.trim()).filter(Boolean) : undefined,
          subject,
          html: htmlContent,
          replyTo: replyToEmail,
        }) as any;

        if (response.error) {
          sendStatus = 'FAILED';
          errorMessage = typeof response.error === 'string' ? response.error : JSON.stringify(response.error);
        } else {
          resendId = response.data?.id || `resend-${Date.now()}`;
        }
      } catch (err: any) {
        sendStatus = 'FAILED';
        errorMessage = err.message || 'Resend API dispatch failed';
      }
    }

    const logEntry = {
      senderIdentityId,
      from: fromEmail,
      to,
      subject,
      status: sendStatus,
      resendId: resendId || null,
      error: errorMessage || null,
      sentBy: authRes.profile.email,
      createdAt: new Date().toISOString(),
    };

    if (adminDb) {
      await adminDb.collection('emailLogs').add(logEntry);
    } else if (db) {
      await addDoc(collection(db, 'emailLogs'), logEntry);
    }

    await recordAuditLog({
      actorUid: authRes.profile.uid,
      actorName: authRes.profile.displayName || authRes.profile.email.split('@')[0],
      actorEmail: authRes.profile.email,
      action: 'EMAIL_SENT',
      targetType: 'system',
      targetId: resendId || 'email-dispatch',
      description: `Dispatched email from ${senderIdentity.email} to ${to} [Status: ${sendStatus}]`,
      metadata: { subject, to, resendId, status: sendStatus },
    });

    if (sendStatus === 'FAILED') {
      return NextResponse.json({ error: `Email dispatch failed: ${errorMessage}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, resendId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error during email dispatch' }, { status: 500 });
  }
}
