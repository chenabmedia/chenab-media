import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { adminAuth, adminDb, getAdminDb, getAdminAuth } from '@/lib/firebase/admin';
import { recordAuditLog } from '@/lib/firebase/audit';
import { ARTISTS } from '@/data/artists';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authRes = await verifyServerAuth(req, 'artists.view');
    if (!authRes.authenticated || !authRes.profile) {
      return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database instance not initialized' }, { status: 503 });
    }

    let artistDoc = await db.collection('artists').doc(id).get();
    if (!artistDoc.exists) {
      // Fallback lookup: query by stored 'id' field if document-ID lookup does not exist
      const snap = await db.collection('artists').where('id', '==', id).limit(1).get();
      if (!snap.empty) {
        artistDoc = snap.docs[0];
      }
    }

    if (artistDoc.exists) {
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
    }

    // Static catalog fallback (read-only, no write to Firestore on GET)
    const staticArtist = ARTISTS.find((a) => a.id === id || a.slug === id);
    if (staticArtist) {
      const artistData = {
        ...staticArtist,
        id: staticArtist.id,
        stageName: staticArtist.name,
        name: staticArtist.name,
        legalName: (staticArtist as any).legalName || '',
        email: (staticArtist as any).email || '',
        phone: (staticArtist as any).phone || '',
        profileImage: staticArtist.image || '',
        image: staticArtist.image || '',
        coverImage: (staticArtist as any).coverImage || '',
        bio: staticArtist.bio || '',
        location: staticArtist.location || '',
        genres: staticArtist.genres || [],
        status: staticArtist.status || 'ACTIVE',
        catalogueNumberPrefix: (staticArtist as any).catalogueNumberPrefix || staticArtist.id || '',
        socialLinks: staticArtist.socialLinks || {},
        streamingLinks: staticArtist.streamingLinks || {},
        releaseIds: staticArtist.releaseIds || [],
        internalNotes: (staticArtist as any).internalNotes || '',
      };
      return NextResponse.json({ artist: artistData, userAccount: null }, { status: 200 });
    }

    return NextResponse.json({ error: 'Artist record not found' }, { status: 404 });
  } catch (err: any) {
    console.error(`Error fetching artist:`, err);
    return NextResponse.json({ error: err.message || 'Failed to fetch artist details' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authRes = await verifyServerAuth(req, 'artists.edit');
    if (!authRes.authenticated || !authRes.profile) {
      return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const db = getAdminDb();

    if (!db) {
      return NextResponse.json({ error: 'Database instance not initialized' }, { status: 503 });
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

    const now = new Date().toISOString();

    if (!artistDoc.exists) {
      // Check if it exists in the static catalog for initial migration-on-save
      const staticArtist = ARTISTS.find((a) => a.id === id || a.slug === id);
      if (!staticArtist) {
        return NextResponse.json({ error: 'Artist record not found' }, { status: 404 });
      }

      const docId = staticArtist.id || id;
      artistRef = db.collection('artists').doc(docId);

      const stageNameVal = body.stageName || staticArtist.name;
      const profileImageVal = body.profileImage || staticArtist.image || '';

      const newArtistData: Record<string, any> = {
        slug: staticArtist.slug || id,
        stageName: stageNameVal,
        name: stageNameVal,
        legalName: body.legalName !== undefined ? body.legalName : ((staticArtist as any).legalName || ''),
        email: body.email !== undefined ? body.email : ((staticArtist as any).email || ''),
        phone: body.phone !== undefined ? body.phone : ((staticArtist as any).phone || ''),
        profileImage: profileImageVal,
        image: profileImageVal,
        coverImage: body.coverImage !== undefined ? body.coverImage : ((staticArtist as any).coverImage || ''),
        bio: body.bio !== undefined ? body.bio : (staticArtist.bio || ''),
        location: body.location !== undefined ? body.location : (staticArtist.location || ''),
        genres: body.genres !== undefined ? body.genres : (staticArtist.genres || []),
        catalogueNumberPrefix: body.catalogueNumberPrefix !== undefined ? body.catalogueNumberPrefix : ((staticArtist as any).catalogueNumberPrefix || docId),
        status: body.status !== undefined ? body.status : (staticArtist.status || 'ACTIVE'),
        socialLinks: body.socialLinks !== undefined ? body.socialLinks : (staticArtist.socialLinks || {}),
        streamingLinks: body.streamingLinks !== undefined ? body.streamingLinks : (staticArtist.streamingLinks || {}),
        releaseIds: staticArtist.releaseIds || [],
        internalNotes: body.internalNotes !== undefined ? body.internalNotes : ((staticArtist as any).internalNotes || ''),
        createdAt: now,
        ...body,
        id: docId,
        updatedAt: now,
      };

      if (body.stageName) {
        newArtistData.name = body.stageName;
        newArtistData.stageName = body.stageName;
      }
      if (body.profileImage) {
        newArtistData.image = body.profileImage;
        newArtistData.profileImage = body.profileImage;
      }

      await artistRef.set(newArtistData);

      // Record Audit Log
      await recordAuditLog(
        { uid: authRes.profile.uid, name: authRes.profile.displayName || undefined, email: authRes.profile.email },
        'ARTIST_MODIFIED',
        'artist',
        docId,
        `Migrated static artist "${stageNameVal}" (${docId}) to Firestore on initial save.`,
        { artistId: docId, updatedFields: Object.keys(body), migratedFromStatic: true }
      );

      const createdDoc = await artistRef.get();
      return NextResponse.json(
        { success: true, artist: { ...createdDoc.data(), id: createdDoc.id } },
        { status: 200 }
      );
    }

    const currentArtist = artistDoc.data();

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
    const auth = getAdminAuth();
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
    console.error(`Error updating artist:`, err);
    return NextResponse.json({ error: err.message || 'Failed to update artist profile' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authRes = await verifyServerAuth(req, 'artists.delete');
    if (!authRes.authenticated || !authRes.profile) {
      return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database instance not initialized' }, { status: 503 });
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

    const now = new Date().toISOString();

    if (!artistDoc.exists) {
      const staticArtist = ARTISTS.find((a) => a.id === id || a.slug === id);
      if (staticArtist) {
        const docId = staticArtist.id || id;
        artistRef = db.collection('artists').doc(docId);
        await artistRef.set(
          {
            ...staticArtist,
            id: docId,
            status: 'SUSPENDED',
            updatedAt: now,
          },
          { merge: true }
        );
        artistDoc = await artistRef.get();
      } else {
        return NextResponse.json({ error: 'Artist record not found' }, { status: 404 });
      }
    }

    const artistData = artistDoc.data();

    // Mark status as SUSPENDED / DISABLED in Firestore
    await artistRef.set({ status: 'SUSPENDED', updatedAt: now }, { merge: true });

    if (artistData?.userId) {
      await db.collection('users').doc(artistData.userId).set(
        { status: 'SUSPENDED', updatedAt: now },
        { merge: true }
      );

      const auth = getAdminAuth();
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
      `Suspended artist account "${artistData?.stageName || artistData?.name}" (${artistRef.id}) and disabled associated auth credentials.`,
      { artistId: artistRef.id, status: 'SUSPENDED' }
    );

    return NextResponse.json({ success: true, message: 'Artist account suspended successfully' }, { status: 200 });
  } catch (err: any) {
    console.error(`Error disabling artist:`, err);
    return NextResponse.json({ error: err.message || 'Failed to disable artist account' }, { status: 500 });
  }
}
