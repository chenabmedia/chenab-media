import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { sendTemplateEmail } from '@/lib/email/service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let displayName = 'CHENAB Member';
    let userRole = 'MEMBER';
    let resetPasswordLink = `https://chenabmedia.in/login?mode=resetPassword&email=${encodeURIComponent(normalizedEmail)}`;

    if (adminAuth) {
      try {
        const authUser = await adminAuth.getUserByEmail(normalizedEmail);
        if (authUser.displayName) displayName = authUser.displayName;
        // Generate actual Firebase Auth password reset link as source of truth
        resetPasswordLink = await adminAuth.generatePasswordResetLink(normalizedEmail);
      } catch (e) {
        // Return success even if user not found to prevent user enumeration
        return NextResponse.json({
          success: true,
          message: 'If an account exists for this email, password reset instructions have been dispatched.',
        });
      }
    }

    const emailResult = await sendTemplateEmail({
      templateKey: 'PASSWORD_RESET',
      to: normalizedEmail,
      from: 'CHENAB Security <admin@chenabmedia.in>',
      subject: 'Password Reset Request - CHENAB Account',
      variables: {
        userName: displayName,
        userRole,
        userEmail: normalizedEmail,
        requestTime: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        requestDevice: 'Web Browser',
        requestBrowser: 'Secure Web Client',
        requestIp: '127.0.0.1',
        resetPasswordLink,
        supportEmail: 'admin@chenabmedia.in',
        supportPhone: '+1 (800) 555-CHENAB',
        website: 'https://chenabmedia.in',
        companyName: 'Chenab Media',
      },
      eventType: 'PASSWORD_RESET_REQUEST',
    });

    return NextResponse.json({
      success: true,
      emailDispatched: emailResult.success,
      resendId: emailResult.resendId,
    });
  } catch (err: any) {
    console.error('Error in POST /api/auth/password-reset:', err);
    return NextResponse.json({ error: err.message || 'Failed to dispatch password reset email' }, { status: 500 });
  }
}
