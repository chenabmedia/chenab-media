import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/firestore';
import { getDoc, doc } from 'firebase/firestore';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { SendTemplateEmailOptions, sendTemplateEmail } from '@/lib/email/service';
import { EmailIdentity } from '@/types/site';

const recentSends = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const authRes = await verifyServerAuth(req, 'email.send');
    if (!authRes.authenticated || !authRes.profile) {
      return NextResponse.json(
        { error: authRes.error || 'Unauthorized: email.send permission required' },
        { status: 403 }
      );
    }

    const now = Date.now();
    const lastSend = recentSends.get(authRes.profile.uid) || 0;
    if (now - lastSend < 5000) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a few seconds before sending another email.' },
        { status: 429 }
      );
    }
    recentSends.set(authRes.profile.uid, now);

    const body = await req.json();
    const {
      senderIdentityId,
      to,
      cc,
      bcc,
      subject,
      message,
      buttonEnabled,
      buttonLabel,
      buttonUrl,
      category,
      recipientName,
    } = body;

    const missingFields: string[] = [];
    if (!senderIdentityId || typeof senderIdentityId !== 'string' || !senderIdentityId.trim()) missingFields.push('senderIdentityId');
    if (!to || typeof to !== 'string' || !to.trim()) missingFields.push('to');
    if (!subject || typeof subject !== 'string' || !subject.trim()) missingFields.push('subject');
    if (!message || typeof message !== 'string' || !message.trim()) missingFields.push('message');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const recipients = to
      .split(',')
      .map((e: string) => e.trim())
      .filter(Boolean);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const r of recipients) {
      if (!emailRegex.test(r)) {
        return NextResponse.json({ error: `Invalid recipient email format: ${r}` }, { status: 400 });
      }
    }

    let senderIdentity: EmailIdentity | null = null;
    if (adminDb) {
      const docSnap = await adminDb.collection('emailIdentities').doc(senderIdentityId).get();
      if (docSnap.exists) {
        senderIdentity = { ...docSnap.data(), id: docSnap.id } as EmailIdentity;
      } else {
        // Fallback: search by email address or suffix
        const queryByEmail = await adminDb.collection('emailIdentities').where('email', '==', senderIdentityId).get();
        if (!queryByEmail.empty) {
          const firstDoc = queryByEmail.docs[0];
          senderIdentity = { ...firstDoc.data(), id: firstDoc.id } as EmailIdentity;
        } else {
          const queryBySuffix = await adminDb.collection('emailIdentities').where('suffix', '==', senderIdentityId).get();
          if (!queryBySuffix.empty) {
            const firstDoc = queryBySuffix.docs[0];
            senderIdentity = { ...firstDoc.data(), id: firstDoc.id } as EmailIdentity;
          }
        }
      }
    } else if (db) {
      const docSnap = await getDoc(doc(db, 'emailIdentities', senderIdentityId));
      if (docSnap.exists()) {
        senderIdentity = { ...docSnap.data(), id: docSnap.id } as EmailIdentity;
      }
    }

    let fromAddress = 'CHENAB MEDIA <admin@chenabmedia.in>';
    let replyToAddress = 'admin@chenabmedia.in';

    if (senderIdentity && senderIdentity.enabled) {
      fromAddress = `${senderIdentity.displayName} <${senderIdentity.email}>`;
      replyToAddress = senderIdentity.replyTo || senderIdentity.email;
    }

    if (buttonEnabled && buttonUrl) {
      const trimmedUrl = buttonUrl.trim();
      if (!trimmedUrl.startsWith('https://') && !trimmedUrl.startsWith('/')) {
        return NextResponse.json(
          { error: 'Button URL must be a secure HTTPS URL or approved internal path' },
          { status: 400 }
        );
      }
    }

    // Prepare variables for Resend template: CustomCommunication
    const templateVariables: Record<string, any> = {
      emailSubject: subject,
      emailCategory: category || 'ANNOUNCEMENT',
      heading: subject,
      subheading: 'Official Label Communication',
      recipientName: recipientName || recipients[0] || 'CHENAB Member',
      message,
      buttonText: buttonEnabled ? buttonLabel || 'Open Release Portal' : '',
      buttonUrl: buttonEnabled ? buttonUrl || 'https://chenabmedia.in' : '',
      secondaryButtonText: '',
      secondaryButtonUrl: '',
      signatureName: authRes.profile.displayName || 'CHENAB Management',
      signatureRole: authRes.profile.role ? authRes.profile.role.toUpperCase() : 'EXECUTIVE',
      signatureDepartment: 'CHENAB MEDIA OPERATIONS',
      senderEmail: senderIdentity ? senderIdentity.email : 'admin@chenabmedia.in',
      signaturePhone: '+1 (800) 555-CHENAB',
      signatureWebsite: 'https://chenabmedia.in',
      footerText: 'This communication was dispatched securely via CHENAB MEDIA Management Console.',
      socialInstagram: 'https://instagram.com/chenabmedia',
      socialSpotify: 'https://open.spotify.com/user/chenabmedia',
      socialYouTube: 'https://youtube.com/@chenabmedia',
      socialX: 'https://x.com/chenabmedia',
      socialFacebook: 'https://facebook.com/chenabmedia',
      website: 'https://chenabmedia.in',
      supportEmail: 'admin@chenabmedia.in',
      supportPhone: '+1 (800) 555-CHENAB',
      year: new Date().getFullYear().toString(),
      companyName: 'Chenab Media',
    };

    const sendOptions: SendTemplateEmailOptions = {
      templateKey: 'CUSTOM_COMMUNICATION',
      to: recipients,
      from: fromAddress,
      replyTo: replyToAddress,
      cc: cc ? cc.split(',').map((e: string) => e.trim()).filter(Boolean) : undefined,
      bcc: bcc ? bcc.split(',').map((e: string) => e.trim()).filter(Boolean) : undefined,
      subject,
      variables: templateVariables,
      actorEmail: authRes.profile.email,
      actorUid: authRes.profile.uid,
      eventType: 'CUSTOM_ADMIN_DISPATCH',
    };

    const result = await sendTemplateEmail(sendOptions);

    if (!result.success) {
      const statusCode = result.statusCode || 500;
      return NextResponse.json({ error: result.error || 'Failed to dispatch custom communication email' }, { status: statusCode });
    }

    return NextResponse.json({
      success: true,
      resendId: result.resendId,
      template: 'CustomCommunication',
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/email/send:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during email dispatch' },
      { status: 500 }
    );
  }
}
