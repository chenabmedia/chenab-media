import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { adminDb } from '@/lib/firebase/admin';
import { sendTemplateEmail } from '@/lib/email/service';
import { recordAuditLog } from '@/lib/firebase/audit';

export async function PATCH(
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
    const docRef = adminDb.collection('withdrawals').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Withdrawal record not found' }, { status: 404 });
    }

    const existing = snap.data() as any;
    const body = await req.json();
    const { status, rejectionReason, adminNotes, transactionReference, paymentMethod } = body;

    if (!['APPROVED', 'REJECTED', 'PAID'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Expected APPROVED, REJECTED, or PAID.' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const updatedData = {
      status,
      ...(status === 'APPROVED' ? { approvedAt: now, approvedBy: authRes.profile.uid } : {}),
      ...(status === 'REJECTED' ? { rejectedAt: now, rejectedBy: authRes.profile.uid, rejectionReason: rejectionReason || 'Information mismatch' } : {}),
      ...(status === 'PAID' ? { paidAt: now, paidBy: authRes.profile.uid, transactionReference: transactionReference || `TXN-${Date.now()}` } : {}),
      adminNotes: adminNotes || existing.adminNotes || '',
      updatedAt: now,
    };

    await docRef.update(updatedData);

    const artistEmail = existing.artistEmail;
    const artistName = existing.artistName || 'Artist';
    let emailResult: { success: boolean; resendId?: string } = { success: false, resendId: undefined };

    // Trigger corresponding email template
    if (status === 'APPROVED') {
      emailResult = await sendTemplateEmail({
        templateKey: 'WITHDRAWAL_APPROVED',
        to: artistEmail,
        from: 'CHENAB Finance <billing@chenabmedia.in>',
        subject: `Withdrawal Approved (${id})`,
        variables: {
          artistName,
          withdrawalId: id,
          withdrawalAmount: `${existing.currency || 'INR'} ${existing.amount}`,
          withdrawalCurrency: existing.currency || 'INR',
          withdrawalMethod: existing.method || 'BANK_TRANSFER',
          withdrawalStatus: 'APPROVED',
          approvedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          estimatedPaymentDate: '1 to 2 business days',
          financeReference: `FIN-${id}`,
          dashboardLink: 'https://chenabmedia.in/artist/earnings',
          website: 'https://chenabmedia.in',
          supportEmail: 'billing@chenabmedia.in',
          supportPhone: '+1 (800) 555-CHENAB',
          companyName: 'Chenab Media',
        },
        actorEmail: authRes.profile.email,
        actorUid: authRes.profile.uid,
        eventType: 'WITHDRAWAL_APPROVED',
        relatedId: id,
      });
    } else if (status === 'REJECTED') {
      emailResult = await sendTemplateEmail({
        templateKey: 'WITHDRAWAL_REJECTED',
        to: artistEmail,
        from: 'CHENAB Finance <billing@chenabmedia.in>',
        subject: `Withdrawal Request Update (${id})`,
        variables: {
          artistName,
          withdrawalId: id,
          withdrawalAmount: `${existing.currency || 'INR'} ${existing.amount}`,
          withdrawalCurrency: existing.currency || 'INR',
          withdrawalMethod: existing.method || 'BANK_TRANSFER',
          withdrawalStatus: 'DECLINED',
          rejectedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          rejectionReason: rejectionReason || 'Account details verification incomplete',
          adminNotes: adminNotes || 'Please update your payout details and re-submit.',
          dashboardLink: 'https://chenabmedia.in/artist/earnings',
          website: 'https://chenabmedia.in',
          supportEmail: 'billing@chenabmedia.in',
          supportPhone: '+1 (800) 555-CHENAB',
          companyName: 'Chenab Media',
        },
        actorEmail: authRes.profile.email,
        actorUid: authRes.profile.uid,
        eventType: 'WITHDRAWAL_REJECTED',
        relatedId: id,
      });
    } else if (status === 'PAID') {
      emailResult = await sendTemplateEmail({
        templateKey: 'WITHDRAWAL_PAID',
        to: artistEmail,
        from: 'CHENAB Finance <billing@chenabmedia.in>',
        subject: `Payout Settled & Paid (${id})`,
        variables: {
          artistName,
          withdrawalId: id,
          withdrawalAmount: `${existing.currency || 'INR'} ${existing.amount}`,
          withdrawalCurrency: existing.currency || 'INR',
          paymentMethod: paymentMethod || existing.method || 'BANK_TRANSFER',
          paymentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          transactionReference: transactionReference || `TXN-${Date.now()}`,
          paymentStatus: 'PAID',
          dashboardLink: 'https://chenabmedia.in/artist/earnings',
          paymentReceiptUrl: 'https://chenabmedia.in/artist/earnings',
          invoiceUrl: 'https://chenabmedia.in/artist/earnings',
          website: 'https://chenabmedia.in',
          supportEmail: 'billing@chenabmedia.in',
          supportPhone: '+1 (800) 555-CHENAB',
          companyName: 'Chenab Media',
        },
        actorEmail: authRes.profile.email,
        actorUid: authRes.profile.uid,
        eventType: 'WITHDRAWAL_PAID',
        relatedId: id,
      });
    }

    const auditAction = (status === 'APPROVED' ? 'WITHDRAWAL_APPROVED' : status === 'REJECTED' ? 'WITHDRAWAL_REJECTED' : 'WITHDRAWAL_PAID') as 'WITHDRAWAL_APPROVED' | 'WITHDRAWAL_REJECTED' | 'WITHDRAWAL_PAID';
    await recordAuditLog({
      actorUid: authRes.profile.uid,
      actorName: authRes.profile.displayName || 'Admin',
      actorEmail: authRes.profile.email,
      action: auditAction,
      targetType: 'withdrawal',
      targetId: id,
      description: `Updated withdrawal ${id} status to ${status} for ${artistEmail}`,
      metadata: { id, status, rejectionReason, transactionReference },
    });

    return NextResponse.json({
      success: true,
      withdrawal: { id, ...existing, ...updatedData },
      emailDispatched: emailResult.success,
      resendId: emailResult.resendId,
    });
  } catch (err: any) {
    console.error(`Error updating withdrawal ${id}:`, err);
    return NextResponse.json({ error: err.message || 'Failed to update withdrawal' }, { status: 500 });
  }
}
