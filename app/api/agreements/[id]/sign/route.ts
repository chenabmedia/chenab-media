import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { adminDb } from '@/lib/firebase/admin';
import { sendTemplateEmail } from '@/lib/email/service';
import { recordAuditLog } from '@/lib/firebase/audit';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authRes = await verifyServerAuth(req);
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Database instance not configured' }, { status: 500 });
  }

  try {
    const docRef = adminDb.collection('agreements').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Agreement record not found' }, { status: 404 });
    }

    const existing = snap.data() as any;
    const now = new Date().toISOString();

    const updatedData = {
      status: 'EXECUTED',
      signedAt: now,
      signedByUid: authRes.profile.uid,
      signedByName: authRes.profile.displayName || existing.artistName,
      updatedAt: now,
    };

    await docRef.update(updatedData);

    const artistEmail = existing.artistEmail || authRes.profile.email;
    const artistName = existing.artistName || authRes.profile.displayName || 'Artist';

    // Trigger template email: AgreementSigned
    const emailResult = await sendTemplateEmail({
      templateKey: 'AGREEMENT_SIGNED',
      to: [artistEmail, 'legal@chenabmedia.in'],
      from: 'CHENAB Legal <legal@chenabmedia.in>',
      subject: `Agreement Executed - ${existing.agreementTitle}`,
      variables: {
        artistName,
        agreementId: id,
        agreementTitle: existing.agreementTitle,
        agreementStatus: 'EXECUTED',
        signedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        effectiveDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        agreementDownloadLink: `https://chenabmedia.in/agreements/${id}/download`,
        verificationLink: `https://chenabmedia.in/agreements/${id}/verify`,
        googleDriveLink: 'https://drive.google.com/drive/folders/chenab-executed-agreements',
        website: 'https://chenabmedia.in',
        supportEmail: 'legal@chenabmedia.in',
        supportPhone: '+1 (800) 555-CHENAB',
        companyName: 'Chenab Media',
      },
      actorEmail: authRes.profile.email,
      actorUid: authRes.profile.uid,
      eventType: 'AGREEMENT_SIGNED',
      relatedId: id,
    });

    await recordAuditLog({
      actorUid: authRes.profile.uid,
      actorName: artistName,
      actorEmail: artistEmail,
      action: 'AGREEMENT_SIGNED',
      targetType: 'agreement',
      targetId: id,
      description: `Artist ${artistName} signed and executed agreement "${existing.agreementTitle}" (${id})`,
      metadata: { id, agreementTitle: existing.agreementTitle },
    });

    return NextResponse.json({
      success: true,
      agreement: { id, ...existing, ...updatedData },
      emailDispatched: emailResult.success,
      resendId: emailResult.resendId,
    });
  } catch (err: any) {
    console.error(`Error signing agreement ${id}:`, err);
    return NextResponse.json({ error: err.message || 'Failed to sign agreement' }, { status: 500 });
  }
}
