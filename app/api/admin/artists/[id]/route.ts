import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
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
    if (!adminDb) {
      return NextResponse.json({ error: 'Database instance not initialized' }, { status: 500 });
    }

    const artistDoc = await adminDb.collection('artists').doc(id).get();
    if (!artistDoc.exists) {
      return NextResponse.json({ error: 'Artist record not found' }, { status: 404 });
    }

    const artistData: any = { id: artistDoc.id, ...artistDoc.data() };

    // Also fetch associated user account
    let userAccount: any = null;
    if (artistData.userId) {
      const userDoc = await adminDb.collection('users').doc(artistData.userId).get();
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

    if (!adminDb) {
      return NextResponse.json({ error: 'Database instance not initialized' }, { status: 500 });
    }

    const artistRef = adminDb.collection('artists').doc(id);
    const artistDoc = await artistRef.get();

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
    if (currentArtist?.userId) {
      const userRef = adminDb.collection('users').doc(currentArtist.userId);
      const userUpdate: Record<string, any> = { updatedAt: now };

      if (body.stageName) userUpdate.displayName = body.stageName;
      if (body.status) userUpdate.status = body.status;
      if (body.email) userUpdate.email = body.email;

      await userRef.set(userUpdate, { merge: true });

      if (adminAuth) {
        try {
          await adminAuth.updateUser(currentArtist.userId, {
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
      id,
      `Updated artist profile "${body.stageName || currentArtist?.stageName}" (${id}).`,
      { updatedFields: Object.keys(body) }
    );

    const updatedDoc = await artistRef.get();
    return NextResponse.json({ success: true, artist: { id: updatedDoc.id, ...updatedDoc.data() } }, { status: 200 });
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
    if (!adminDb) {
      return NextResponse.json({ error: 'Database instance not initialized' }, { status: 500 });
    }

    const artistRef = adminDb.collection('artists').doc(id);
    const artistDoc = await artistRef.get();

    if (!artistDoc.exists) {
      return NextResponse.json({ error: 'Artist record not found' }, { status: 404 });
    }

    const artistData = artistDoc.data();
    const now = new Date().toISOString();

    // Mark status as SUSPENDED / DISABLED in Firestore
    await artistRef.set({ status: 'SUSPENDED', updatedAt: now }, { merge: true });

    if (artistData?.userId) {
      await adminDb.collection('users').doc(artistData.userId).set(
        { status: 'SUSPENDED', updatedAt: now },
        { merge: true }
      );

      if (adminAuth) {
        try {
          await adminAuth.updateUser(artistData.userId, { disabled: true });
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
      id,
      `Suspended artist account "${artistData?.stageName}" (${id}) and disabled associated auth credentials.`,
      { artistId: id, status: 'SUSPENDED' }
    );

    return NextResponse.json({ success: true, message: 'Artist account suspended successfully' }, { status: 200 });
  } catch (err: any) {
    console.error(`Error disabling artist ${id}:`, err);
    return NextResponse.json({ error: err.message || 'Failed to disable artist account' }, { status: 500 });
  }
}
