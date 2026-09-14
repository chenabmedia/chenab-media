import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
  const authRes = await verifyServerAuth(req);
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  const { uid, artistId, displayName } = authRes.profile;

  try {
    let notificationsList: any[] = [];

    if (adminDb) {
      const snap = await adminDb.collection('notifications').get();
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.recipientUid === uid || data.userId === uid || (artistId && data.artistId === artistId)) {
          notificationsList.push({ id: doc.id, ...data });
        }
      });
    }

    // Default fallback notification if none found
    if (notificationsList.length === 0) {
      notificationsList = [
        {
          id: 'welcome-notif-1',
          recipientUid: uid,
          userId: uid,
          artistId: artistId || 'art-default',
          title: 'ROSTER PORTAL SYSTEM ACTIVE',
          message: `Welcome to the CHENAB Media Artist Portal, ${displayName || 'Artist'}. Your profile and roster settings are now verified.`,
          type: 'SYSTEM',
          read: false,
          createdAt: new Date().toISOString(),
          link: '/artist/profile',
        },
      ];
    }

    // Sort by createdAt desc
    notificationsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ notifications: notificationsList }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch notifications' }, { status: 500 });
  }
}
