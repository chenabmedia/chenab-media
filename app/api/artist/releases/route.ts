import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { adminDb } from '@/lib/firebase/admin';
import { RELEASES } from '@/data/releases';

export async function GET(req: NextRequest) {
  const authRes = await verifyServerAuth(req);
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  const { uid, artistId } = authRes.profile;

  try {
    let releasesList: any[] = [];

    if (adminDb) {
      // Fetch artist doc to get stageName and releaseIds
      let targetArtistId = artistId;
      let stageName = '';

      if (targetArtistId) {
        const aDoc = await adminDb.collection('artists').doc(targetArtistId).get();
        if (aDoc.exists) {
          stageName = aDoc.data()?.stageName || aDoc.data()?.name || '';
        }
      } else {
        const snap = await adminDb.collection('artists').where('userId', '==', uid).get();
        if (!snap.empty) {
          targetArtistId = snap.docs[0].id;
          stageName = snap.docs[0].data()?.stageName || snap.docs[0].data()?.name || '';
        }
      }

      // Query Firestore releases
      const releasesSnap = await adminDb.collection('releases').get();
      releasesSnap.forEach((doc) => {
        const data = doc.data();
        const artistIds: string[] = data.artistIds || [];
        const nameMatch = stageName && data.artistName?.toLowerCase().includes(stageName.toLowerCase());

        if (
          (targetArtistId && artistIds.includes(targetArtistId)) ||
          artistIds.includes(uid) ||
          nameMatch
        ) {
          releasesList.push({ id: doc.id, ...data });
        }
      });
    }

    // Fallback to static catalogue releases if Firestore releases list is empty
    if (releasesList.length === 0) {
      releasesList = RELEASES;
    }

    return NextResponse.json({ releases: releasesList }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching artist releases:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch releases' }, { status: 500 });
  }
}
