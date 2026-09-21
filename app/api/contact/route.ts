import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { sendTemplateEmail } from '@/lib/email/service';
import { recordAuditLog } from '@/lib/firebase/audit';
import {
  getClientIp,
  checkPersistentRateLimit,
  checkAndApplyEmailCooldown,
  validateContactPayload,
} from '@/lib/security/abuseProtection';

export async function POST(req: NextRequest) {
  try {
    // 1. Server-Side Rate Limiting (3 requests per IP per 10 minutes)
    const clientIp = getClientIp(req);
    const rateLimit = await checkPersistentRateLimit('contact', clientIp, 3, 600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429 }
      );
    }

    // 2. Strict Request Validation & Honeypot Detection
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
    }

    const validation = validateContactPayload(body);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { error: validation.error || 'Invalid submission' },
        { status: 400 }
      );
    }

    const { name, email, department, subject, message } = validation.data;
    const ticketId = `TICK-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const messageData = {
      id: ticketId,
      name,
      email,
      department,
      subject,
      message,
      status: 'UNREAD',
      createdAt: now,
    };

    const adminDbInstance = getAdminDb();
    if (!adminDbInstance) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    // 3. Store message document in Firestore
    await adminDbInstance.collection('messages').doc(ticketId).set(messageData);

    // 4. Outbound Email Abuse Protection (Max 1 confirmation email per recipient per hour)
    const emailCooldown = await checkAndApplyEmailCooldown(email, 3600);
    let emailDispatched = false;
    let resendId: string | undefined = undefined;

    if (emailCooldown.allowed) {
      try {
        const emailResult = await sendTemplateEmail({
          templateKey: 'CONTACT_CONFIRMATION',
          to: email,
          from: 'CHENAB MEDIA Correspondence <contact@chenabmedia.in>',
          subject: `Enquiry Received (${ticketId}) - ${subject}`,
          variables: {
            contactName: name,
            ticketId,
            subject,
            submittedAt: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            expectedResponse: '24-48 business hours',
            website: 'https://chenabmedia.in',
            supportEmail: 'contact@chenabmedia.in',
            supportPhone: '+1 (800) 555-CHENAB',
            companyName: 'Chenab Media',
          },
          eventType: 'PUBLIC_CONTACT_SUBMISSION',
          relatedId: ticketId,
        });
        emailDispatched = emailResult.success;
        resendId = emailResult.resendId;
      } catch (emailErr) {
        console.warn('[Contact] Outbound confirmation email failed:', emailErr);
      }
    }

    // 5. Record audit log
    await recordAuditLog({
      actorUid: 'anonymous_user',
      actorName: name,
      actorEmail: email,
      action: 'CONTACT_SUBMITTED',
      targetType: 'message',
      targetId: ticketId,
      description: `Public contact enquiry submitted by ${name} (${email}) for ${department}`,
      metadata: { ticketId, department, subject },
    });

    return NextResponse.json(
      {
        success: true,
        ticketId,
        emailDispatched,
        resendId,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error in POST /api/contact:', err);
    return NextResponse.json({ error: 'Failed to submit contact enquiry' }, { status: 500 });
  }
}

