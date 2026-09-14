import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { adminDb } from '@/lib/firebase/admin';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authRes = await verifyServerAuth(req);
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  const { uid, artistId } = authRes.profile;
  const { id } = await params;

  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database instance not initialized' }, { status: 500 });
    }

    const notifRef = adminDb.collection('notifications').doc(id);
    const notifDoc = await notifRef.get();

    if (!notifDoc.exists) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const notifData = notifDoc.data();

    // Verify ownership: notification must belong to this user or their artistId
    const isOwner =
      notifData?.recipientUid === uid ||
      notifData?.userId === uid ||
      (artistId && notifData?.artistId === artistId);

    if (!isOwner && authRes.profile.role !== 'admin' && authRes.profile.role !== 'executive') {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to modify this notification.' },
        { status: 403 }
      );
    }

    await notifRef.set({ read: true, updatedAt: new Date().toISOString() }, { merge: true });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error(`Error updating notification ${id}:`, err);
    return NextResponse.json({ error: err.message || 'Failed to update notification' }, { status: 500 });
  }
}
