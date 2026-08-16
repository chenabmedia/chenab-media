import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { adminDb } from '@/lib/firebase/admin';
import { sendTemplateEmail } from '@/lib/email/service';
import { recordAuditLog } from '@/lib/firebase/audit';

export async function POST(req: NextRequest) {
  const authRes = await verifyServerAuth(req);
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { artistName, artistEmail, contractType, agreementTitle, expiryDays } = body;

    if (!artistName || !artistEmail || !agreementTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: artistName, artistEmail, agreementTitle are required.' },
        { status: 400 }
      );
    }

    const agreementId = `AGR-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date();
    const expiryDate = new Date(now.getTime() + (expiryDays || 14) * 24 * 60 * 60 * 1000).toISOString();

    const agreementData = {
      id: agreementId,
      artistName,
      artistEmail,
      contractType: contractType || 'EXCLUSIVE_RECORDING_AGREEMENT',
      agreementTitle,
      status: 'ISSUED',
      expiryDate,
      issuedAt: now.toISOString(),
      issuedBy: authRes.profile.uid,
    };

    if (adminDb) {
      await adminDb.collection('agreements').doc(agreementId).set(agreementData);
    }

    // Trigger template email: ArtistAgreement
    const emailResult = await sendTemplateEmail({
      templateKey: 'ARTIST_AGREEMENT',
      to: artistEmail,
      from: 'CHENAB Legal <legal@chenabmedia.in>',
      subject: `New Agreement Issued - ${agreementTitle}`,
      variables: {
        artistName,
        labelName: 'CHENAB MEDIA',
        contractType: contractType || 'Recording Agreement',
        agreementTitle,
        agreementId,
        expiryDate: new Date(expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        signingLink: `https://chenabmedia.in/agreements/${agreementId}`,
        supportEmail: 'legal@chenabmedia.in',
      },
      actorEmail: authRes.profile.email,
      actorUid: authRes.profile.uid,
      eventType: 'AGREEMENT_ISSUED',
      relatedId: agreementId,
    });

    await recordAuditLog({
      actorUid: authRes.profile.uid,
      actorName: authRes.profile.displayName || 'Admin',
      actorEmail: authRes.profile.email,
      action: 'AGREEMENT_ISSUED',
      targetType: 'agreement',
      targetId: agreementId,
      description: `Issued agreement "${agreementTitle}" (${agreementId}) to ${artistEmail}`,
      metadata: { agreementId, contractType },
    });

    return NextResponse.json(
      {
        success: true,
        agreement: agreementData,
        emailDispatched: emailResult.success,
        resendId: emailResult.resendId,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error issuing agreement:', err);
    return NextResponse.json({ error: err.message || 'Failed to issue agreement' }, { status: 500 });
  }
}
