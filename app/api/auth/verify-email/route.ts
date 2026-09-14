import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { sendTemplateEmail } from '@/lib/email/service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, templateType = 'EMAIL_VERIFICATION' } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let displayName = 'CHENAB Member';
    let userRole = 'MEMBER';

    if (adminAuth) {
      try {
        const uSnap = await adminAuth.getUserByEmail(normalizedEmail);
        if (uSnap.displayName) displayName = uSnap.displayName;
      } catch (e) {
        // User not found in Firebase Auth yet, continue with fallback
      }
    }

    const verificationLink = `https://chenabmedia.in/login?mode=verifyEmail&email=${encodeURIComponent(normalizedEmail)}&code=${Date.now()}`;
    let emailResult;

    if (templateType === 'VERIFY_EMAIL') {
      emailResult = await sendTemplateEmail({
        templateKey: 'VERIFY_EMAIL',
        to: normalizedEmail,
        from: 'CHENAB Security <admin@chenabmedia.in>',
        subject: 'Verify Your Email Address',
        variables: {
          name: displayName,
          verificationUrl: verificationLink,
        },
        eventType: 'VERIFY_EMAIL',
      });
    } else {
      emailResult = await sendTemplateEmail({
        templateKey: 'EMAIL_VERIFICATION',
        to: normalizedEmail,
        from: 'CHENAB Security <admin@chenabmedia.in>',
        subject: 'Verify Your Email Address - CHENAB Portal',
        variables: {
          userName: displayName,
          userEmail: normalizedEmail,
          userRole,
          verificationExpiry: '24 hours',
          verificationLink,
          verificationCode: Math.floor(100000 + Math.random() * 900000).toString(),
          supportEmail: 'admin@chenabmedia.in',
          supportPhone: '+1 (800) 555-CHENAB',
          website: 'https://chenabmedia.in',
          companyName: 'Chenab Media',
        },
        eventType: 'EMAIL_VERIFICATION',
      });
    }

    return NextResponse.json({
      success: true,
      emailDispatched: emailResult.success,
      resendId: emailResult.resendId,
    });
  } catch (err: any) {
    console.error('Error in POST /api/auth/verify-email:', err);
    return NextResponse.json({ error: err.message || 'Failed to dispatch verification email' }, { status: 500 });
  }
}
