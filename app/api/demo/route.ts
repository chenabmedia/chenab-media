import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { sendTemplateEmail } from '@/lib/email/service';
import { recordAuditLog } from '@/lib/firebase/audit';
import {
  getClientIp,
  checkPersistentRateLimit,
  checkAndApplyEmailCooldown,
  validateDemoPayload,
} from '@/lib/security/abuseProtection';

export async function POST(req: NextRequest) {
  try {
    // 1. Server-Side Rate Limiting (3 requests per IP per 10 minutes)
    const clientIp = getClientIp(req);
    const rateLimit = await checkPersistentRateLimit('demo', clientIp, 3, 600);
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

    const validation = validateDemoPayload(body);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { error: validation.error || 'Invalid submission' },
        { status: 400 }
      );
    }

    const {
      artistName,
      email,
      phone,
      genre,
      socialLinks,
      streamingLinks,
      demoTitle,
      message,
      fileName,
    } = validation.data;

    const demoId = `DEMO-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const demoData = {
      id: demoId,
      artistName,
      email,
      phone,
      genre,
      socialLinks,
      streamingLinks,
      demoTitle,
      message,
      fileName,
      status: 'PENDING_REVIEW',
      createdAt: now,
    };

    const adminDbInstance = getAdminDb();
    if (!adminDbInstance) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    // 3. Store demo document in Firestore
    await adminDbInstance.collection('demos').doc(demoId).set(demoData);

    // 4. Outbound Email Abuse Protection (Max 1 confirmation email per recipient per hour)
    const emailCooldown = await checkAndApplyEmailCooldown(email, 3600);
    let emailDispatched = false;
    let resendId: string | undefined = undefined;

    if (emailCooldown.allowed) {
      try {
        const emailResult = await sendTemplateEmail({
          templateKey: 'DEMO_SUBMISSION_RECEIVED',
          to: email,
          from: 'CHENAB A&R <a&r@chenabmedia.in>',
          subject: `Demo Received (${demoId}) - ${demoTitle}`,
          variables: {
            artistName,
            demoId,
            trackTitle: demoTitle,
            genre,
            submittedAt: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            estimatedReviewTime: '10 to 14 business days',
            website: 'https://chenabmedia.in',
            supportEmail: 'a&r@chenabmedia.in',
            supportPhone: '+1 (800) 555-CHENAB',
            companyName: 'Chenab Media',
          },
          eventType: 'DEMO_SUBMISSION',
          relatedId: demoId,
        });
        emailDispatched = emailResult.success;
        resendId = emailResult.resendId;
      } catch (emailErr) {
        console.warn('[Demo] Outbound confirmation email failed:', emailErr);
      }
    }

    // 5. Record audit log
    await recordAuditLog({
      actorUid: 'anonymous_artist',
      actorName: artistName,
      actorEmail: email,
      action: 'DEMO_SUBMITTED',
      targetType: 'demo',
      targetId: demoId,
      description: `Demo "${demoTitle}" submitted by ${artistName} (${email})`,
      metadata: { demoId, genre, demoTitle },
    });

    return NextResponse.json(
      {
        success: true,
        demoId,
        emailDispatched,
        resendId,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error in POST /api/demo:', err);
    return NextResponse.json({ error: 'Failed to submit demo' }, { status: 500 });
  }
}

