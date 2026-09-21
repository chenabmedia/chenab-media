import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { getAdminDb } from '@/lib/firebase/admin';
import { RELEASES } from '@/data/releases';

export async function GET(req: NextRequest) {
  const authRes = await verifyServerAuth(req);
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  const { uid, artistId } = authRes.profile;

  try {
    let releasesList: any[] = [];
    let targetArtistId = artistId;
    let stageName = '';
    const db = getAdminDb();

    if (db) {
      // Fetch artist doc to get stageName and releaseIds
      if (targetArtistId) {
        const aDoc = await db.collection('artists').doc(targetArtistId).get();
        if (aDoc.exists) {
          stageName = aDoc.data()?.stageName || aDoc.data()?.name || '';
        }
      } else {
        const snap = await db.collection('artists').where('userId', '==', uid).get();
        if (!snap.empty) {
          targetArtistId = snap.docs[0].id;
          stageName = snap.docs[0].data()?.stageName || snap.docs[0].data()?.name || '';
        }
      }

      // Query Firestore releases
      const releasesSnap = await db.collection('releases').get();
      releasesSnap.forEach((doc) => {
        const data = doc.data();
        const artistIds: string[] = data.artistIds || [];
        const nameMatch = stageName && data.artistName?.toLowerCase().includes(stageName.toLowerCase());

        if (
          (targetArtistId && artistIds.includes(targetArtistId)) ||
          artistIds.includes(uid) ||
          nameMatch
        ) {
          releasesList.push({ ...data, id: doc.id });
        }
      });
    }

    // Fallback to static catalogue releases matching this artist if Firestore releases list is empty
    if (releasesList.length === 0) {
      if (stageName) {
        const stageLower = stageName.toLowerCase();
        releasesList = RELEASES.filter(
          (r) =>
            r.artistName?.toLowerCase().includes(stageLower) ||
            (targetArtistId && r.artistIds?.includes(targetArtistId))
        );
      } else {
        releasesList = [];
      }
    }

    return NextResponse.json({ releases: releasesList }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching artist releases:', err);
    return NextResponse.json({ error: 'Failed to fetch releases' }, { status: 500 });
  }
}
