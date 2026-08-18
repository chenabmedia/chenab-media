import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { adminAuth, adminDb, getAdminDb, getAdminAuth } from '@/lib/firebase/admin';
import { recordAuditLog } from '@/lib/firebase/audit';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authRes = await verifyServerAuth(req, 'artists.view');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const db = adminDb || getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database instance not initialized' }, { status: 500 });
    }

    let artistDoc = await db.collection('artists').doc(id).get();
    if (!artistDoc.exists) {
      // Fallback lookup: query by stored 'id' field if document-ID lookup does not exist
      const snap = await db.collection('artists').where('id', '==', id).limit(1).get();
      if (!snap.empty) {
        artistDoc = snap.docs[0];
      }
    }

    if (!artistDoc.exists) {
      return NextResponse.json({ error: 'Artist record not found' }, { status: 404 });
    }

    const artistData: any = { ...artistDoc.data(), id: artistDoc.id };

    // Also fetch associated user account
    let userAccount: any = null;
    if (artistData.userId) {
      const userDoc = await db.collection('users').doc(artistData.userId).get();
      if (userDoc.exists) {
        userAccount = userDoc.data();
      }
    }

    return NextResponse.json({ artist: artistData, userAccount }, { status: 200 });
  } catch (err: any) {
    console.error(`Error fetching artist ${id}:`, err);
    return NextResponse.json({ error: err.message || 'Failed to fetch artist details' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authRes = await verifyServerAuth(req, 'artists.edit');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const db = adminDb || getAdminDb();

    if (!db) {
      return NextResponse.json({ error: 'Database instance not initialized' }, { status: 500 });
    }

    let artistRef = db.collection('artists').doc(id);
    let artistDoc = await artistRef.get();

    if (!artistDoc.exists) {
      const snap = await db.collection('artists').where('id', '==', id).limit(1).get();
      if (!snap.empty) {
        artistRef = snap.docs[0].ref;
        artistDoc = snap.docs[0];
      }
    }

    if (!artistDoc.exists) {
      return NextResponse.json({ error: 'Artist record not found' }, { status: 404 });
    }

    const currentArtist = artistDoc.data();
    const now = new Date().toISOString();

    const updateData: Record<string, any> = {
      ...body,
      updatedAt: now,
    };

    if (body.stageName) {
      updateData.name = body.stageName;
    }
    if (body.profileImage) {
      updateData.image = body.profileImage;
    }

    await artistRef.set(updateData, { merge: true });

    // Sync status and displayName to users collection & Firebase Auth if changed
    const auth = adminAuth || getAdminAuth();
    if (currentArtist?.userId) {
      const userRef = db.collection('users').doc(currentArtist.userId);
      const userUpdate: Record<string, any> = { updatedAt: now };

      if (body.stageName) userUpdate.displayName = body.stageName;
      if (body.status) userUpdate.status = body.status;
      if (body.email) userUpdate.email = body.email;

      await userRef.set(userUpdate, { merge: true });

      if (auth) {
        try {
          await auth.updateUser(currentArtist.userId, {
            displayName: body.stageName || currentArtist.stageName,
            disabled: body.status === 'SUSPENDED' || body.status === 'INACTIVE',
          });
        } catch (authErr) {
          console.warn('Non-fatal: Failed updating auth user properties:', authErr);
        }
      }
    }

    // Record Audit Log
    await recordAuditLog(
      { uid: authRes.profile.uid, name: authRes.profile.displayName || undefined, email: authRes.profile.email },
      'ARTIST_MODIFIED',
      'artist',
      artistRef.id,
      `Updated artist profile "${body.stageName || currentArtist?.stageName}" (${artistRef.id}).`,
      { updatedFields: Object.keys(body) }
    );

    const updatedDoc = await artistRef.get();
    return NextResponse.json({ success: true, artist: { ...updatedDoc.data(), id: updatedDoc.id } }, { status: 200 });
  } catch (err: any) {
    console.error(`Error updating artist ${id}:`, err);
    return NextResponse.json({ error: err.message || 'Failed to update artist profile' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authRes = await verifyServerAuth(req, 'artists.delete');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const db = adminDb || getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database instance not initialized' }, { status: 500 });
    }

    let artistRef = db.collection('artists').doc(id);
    let artistDoc = await artistRef.get();

    if (!artistDoc.exists) {
      const snap = await db.collection('artists').where('id', '==', id).limit(1).get();
      if (!snap.empty) {
        artistRef = snap.docs[0].ref;
        artistDoc = snap.docs[0];
      }
    }

    if (!artistDoc.exists) {
      return NextResponse.json({ error: 'Artist record not found' }, { status: 404 });
    }

    const artistData = artistDoc.data();
    const now = new Date().toISOString();

    // Mark status as SUSPENDED / DISABLED in Firestore
    await artistRef.set({ status: 'SUSPENDED', updatedAt: now }, { merge: true });

    if (artistData?.userId) {
      await db.collection('users').doc(artistData.userId).set(
        { status: 'SUSPENDED', updatedAt: now },
        { merge: true }
      );

      const auth = adminAuth || getAdminAuth();
      if (auth) {
        try {
          await auth.updateUser(artistData.userId, { disabled: true });
        } catch (authErr) {
          console.warn('Non-fatal: Failed disabling auth user:', authErr);
        }
      }
    }

    // Audit Log
    await recordAuditLog(
      { uid: authRes.profile.uid, name: authRes.profile.displayName || undefined, email: authRes.profile.email },
      'ARTIST_MODIFIED',
      'artist',
      artistRef.id,
      `Suspended artist account "${artistData?.stageName}" (${artistRef.id}) and disabled associated auth credentials.`,
      { artistId: artistRef.id, status: 'SUSPENDED' }
    );

    return NextResponse.json({ success: true, message: 'Artist account suspended successfully' }, { status: 200 });
  } catch (err: any) {
    console.error(`Error disabling artist ${id}:`, err);
    return NextResponse.json({ error: err.message || 'Failed to disable artist account' }, { status: 500 });
  }
}
