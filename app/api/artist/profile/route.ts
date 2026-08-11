import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
  const authRes = await verifyServerAuth(req);
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  const { uid, artistId, displayName, email } = authRes.profile;

  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database instance not configured' }, { status: 500 });
    }

    let artistData: any = null;

    // 1. Try fetching by user's artistId if attached to userProfile
    if (artistId) {
      const doc = await adminDb.collection('artists').doc(artistId).get();
      if (doc.exists) {
        artistData = { id: doc.id, ...doc.data() };
      }
    }

    // 2. Fallback: Query artists collection where userId == uid
    if (!artistData) {
      const snap = await adminDb.collection('artists').where('userId', '==', uid).get();
      if (!snap.empty) {
        const doc = snap.docs[0];
        artistData = { id: doc.id, ...doc.data() };
      }
    }

    // 3. Fallback for new accounts without an existing document in artists collection
    if (!artistData) {
      artistData = {
        id: artistId || `art-${uid.slice(0, 8)}`,
        userId: uid,
        stageName: displayName || 'Roster Artist',
        name: displayName || 'Roster Artist',
        legalName: '',
        email: email,
        phone: '',
        profileImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
        coverImage: '',
        bio: 'No bio provided yet. Update your artist statement in profile settings.',
        location: 'Srinagar, J&K',
        genres: ['Contemporary'],
        socialLinks: {},
        streamingLinks: {},
        status: 'ACTIVE',
        releaseIds: [],
        catalogueNumberPrefix: 'CHNB-ART-01',
      };
    }

    return NextResponse.json({ artist: artistData, userProfile: authRes.profile }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching artist profile:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch artist profile' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authRes = await verifyServerAuth(req);
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  const { uid, artistId } = authRes.profile;

  try {
    const body = await req.json();

    if (!adminDb) {
      return NextResponse.json({ error: 'Database instance not configured' }, { status: 500 });
    }

    // Find document ID
    let targetDocId = artistId;
    if (!targetDocId) {
      const snap = await adminDb.collection('artists').where('userId', '==', uid).get();
      if (!snap.empty) {
        targetDocId = snap.docs[0].id;
      }
    }

    if (!targetDocId) {
      targetDocId = `art-${uid.slice(0, 8)}`;
    }

    // STRICT WHITELIST OF ARTIST-EDITABLE FIELDS
    const allowedKeys = [
      'profileImage',
      'coverImage',
      'bio',
      'location',
      'genres',
      'socialLinks',
      'streamingLinks',
      'featuredQuote',
    ];

    const sanitizedUpdate: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        sanitizedUpdate[key] = body[key];
      }
    }

    if (body.profileImage) {
      sanitizedUpdate.image = body.profileImage;
    }

    // Save to Firestore
    await adminDb.collection('artists').doc(targetDocId).set(
      {
        userId: uid,
        ...sanitizedUpdate,
      },
      { merge: true }
    );

    const updatedDoc = await adminDb.collection('artists').doc(targetDocId).get();

    return NextResponse.json(
      {
        success: true,
        artist: { id: updatedDoc.id, ...updatedDoc.data() },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Error updating artist profile:', err);
    return NextResponse.json({ error: err.message || 'Failed to update profile' }, { status: 500 });
  }
}
