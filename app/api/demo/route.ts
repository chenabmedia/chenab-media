import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/firestore';
import { collection, addDoc } from 'firebase/firestore';
import { sendTemplateEmail } from '@/lib/email/service';
import { recordAuditLog } from '@/lib/firebase/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
    } = body;

    if (!artistName || !email || !demoTitle || !genre) {
      return NextResponse.json(
        { error: 'Missing required fields: artistName, email, genre, demoTitle are mandatory.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email address format.' }, { status: 400 });
    }

    const demoId = `DEMO-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const demoData = {
      id: demoId,
      artistName,
      email: normalizedEmail,
      phone: phone || '',
      genre,
      socialLinks: socialLinks || '',
      streamingLinks: streamingLinks || '',
      demoTitle,
      message: message || '',
      fileName: fileName || '',
      status: 'PENDING_REVIEW',
      createdAt: now,
    };

    if (adminDb) {
      await adminDb.collection('demos').doc(demoId).set(demoData);
    } else if (db) {
      await addDoc(collection(db, 'demos'), demoData);
    }

    // Trigger confirmation email using Resend template: DemoSubmissionReceived
    const emailResult = await sendTemplateEmail({
      templateKey: 'DEMO_SUBMISSION_RECEIVED',
      to: normalizedEmail,
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

    await recordAuditLog({
      actorUid: 'anonymous_artist',
      actorName: artistName,
      actorEmail: normalizedEmail,
      action: 'DEMO_SUBMITTED',
      targetType: 'demo',
      targetId: demoId,
      description: `Demo "${demoTitle}" submitted by ${artistName} (${normalizedEmail})`,
      metadata: { demoId, genre, demoTitle },
    });

    return NextResponse.json(
      {
        success: true,
        demoId,
        emailDispatched: emailResult.success,
        resendId: emailResult.resendId,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error in POST /api/demo:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit demo' }, { status: 500 });
  }
}
