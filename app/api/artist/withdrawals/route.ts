import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/firestore';
import { collection, addDoc } from 'firebase/firestore';
import { sendTemplateEmail } from '@/lib/email/service';
import { recordAuditLog } from '@/lib/firebase/audit';

export async function POST(req: NextRequest) {
  const authRes = await verifyServerAuth(req);
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { amount, currency, method, accountDetails } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid withdrawal amount is required.' }, { status: 400 });
    }

    const withdrawalId = `WTH-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    const artistName = authRes.profile.displayName || authRes.profile.email.split('@')[0];
    const artistEmail = authRes.profile.email;

    const withdrawalData = {
      id: withdrawalId,
      userId: authRes.profile.uid,
      artistName,
      artistEmail,
      amount: Number(amount),
      currency: currency || 'INR',
      method: method || 'BANK_TRANSFER',
      accountDetails: accountDetails || {},
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };

    if (adminDb) {
      await adminDb.collection('withdrawals').doc(withdrawalId).set(withdrawalData);
    } else if (db) {
      await addDoc(collection(db, 'withdrawals'), withdrawalData);
    }

    // Trigger template email: WithdrawalReceived
    const emailResult = await sendTemplateEmail({
      templateKey: 'WITHDRAWAL_RECEIVED',
      to: artistEmail,
      from: 'CHENAB Finance <billing@chenabmedia.in>',
      subject: `Withdrawal Request Received (${withdrawalId})`,
      variables: {
        artistName,
        withdrawalId,
        withdrawalAmount: `${currency || 'INR'} ${amount}`,
        withdrawalCurrency: currency || 'INR',
        withdrawalMethod: method || 'BANK_TRANSFER',
        withdrawalStatus: 'PENDING_REVIEW',
        requestDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        estimatedProcessingTime: '3 to 5 business days',
        dashboardLink: 'https://chenabmedia.in/artist/earnings',
        website: 'https://chenabmedia.in',
        supportEmail: 'billing@chenabmedia.in',
        supportPhone: '+1 (800) 555-CHENAB',
        companyName: 'Chenab Media',
      },
      actorEmail: artistEmail,
      actorUid: authRes.profile.uid,
      eventType: 'ARTIST_WITHDRAWAL_REQUEST',
      relatedId: withdrawalId,
    });

    await recordAuditLog({
      actorUid: authRes.profile.uid,
      actorName: artistName,
      actorEmail: artistEmail,
      action: 'WITHDRAWAL_REQUESTED',
      targetType: 'withdrawal',
      targetId: withdrawalId,
      description: `Artist requested withdrawal of ${currency || 'INR'} ${amount}`,
      metadata: { withdrawalId, amount, currency, method },
    });

    return NextResponse.json(
      {
        success: true,
        withdrawal: withdrawalData,
        emailDispatched: emailResult.success,
        resendId: emailResult.resendId,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error in POST /api/artist/withdrawals:', err);
    return NextResponse.json({ error: err.message || 'Failed to request withdrawal' }, { status: 500 });
  }
}
