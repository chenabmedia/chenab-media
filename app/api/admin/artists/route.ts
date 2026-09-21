import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin';
import { recordAuditLog } from '@/lib/firebase/audit';

export async function GET(req: NextRequest) {
  try {
    const authRes = await verifyServerAuth(req, 'artists.view');
    if (!authRes.authenticated || !authRes.profile) {
      return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
    }

    let artistsList: any[] = [];
    const db = getAdminDb();

    if (db) {
      const snap = await db.collection('artists').get();
      snap.forEach((doc) => {
        artistsList.push({ ...doc.data(), id: doc.id });
      });
    }

    return NextResponse.json({ artists: artistsList }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching admin artists:', err);
    return NextResponse.json({ error: 'Failed to fetch artists' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authRes = await verifyServerAuth(req, 'artists.create');
    if (!authRes.authenticated || !authRes.profile) {
      return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      stageName,
      legalName,
      email,
      phone,
      password,
      profileImage,
      coverImage,
      bio,
      location,
      genres,
      socialLinks,
      streamingLinks,
      status,
      catalogueNumberPrefix,
      internalNotes,
    } = body;

    if (!stageName || !email) {
      return NextResponse.json(
        { error: 'Missing required parameters: stageName and email are mandatory.' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Firestore Admin service unavailable' }, { status: 503 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const auth = getAdminAuth();

    // Check duplicate email
    const existingDocSnap = await db.collection('users').where('email', '==', normalizedEmail).get();
    if (!existingDocSnap.empty) {
      return NextResponse.json(
        { error: `An account with email address ${normalizedEmail} already exists in the system.` },
        { status: 400 }
      );
    }

    let uid = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const temporaryPassword = password && password.trim() ? password.trim() : `Chn!${crypto.randomBytes(12).toString('base64url')}`;

    // Provision in Firebase Auth if available
    if (auth) {
      try {
        const existingAuthUser = await auth.getUserByEmail(normalizedEmail);
        uid = existingAuthUser.uid;
        await auth.updateUser(uid, {
          displayName: stageName,
          disabled: status === 'SUSPENDED' || status === 'INACTIVE',
        });
      } catch (authErr: any) {
        if (authErr.code === 'auth/user-not-found') {
          const createdAuth = await auth.createUser({
            email: normalizedEmail,
            emailVerified: true,
            password: temporaryPassword,
            displayName: stageName,
            disabled: status === 'SUSPENDED' || status === 'INACTIVE',
          });
          uid = createdAuth.uid;
        } else {
          console.warn('[Admin Artists] Auth provisioning error:', authErr);
        }
      }
    }

    const now = new Date().toISOString();
    const artistId = `art-${Date.now()}`;

    const userProfileData = {
      uid,
      email: normalizedEmail,
      displayName: stageName,
      photoURL: profileImage || null,
      role: 'artist',
      status: status || 'ACTIVE',
      artistId,
      createdAt: now,
      updatedAt: now,
      createdBy: authRes.profile.uid,
    };

    const artistData = {
      id: artistId,
      userId: uid,
      stageName,
      name: stageName,
      legalName: legalName || '',
      email: normalizedEmail,
      phone: phone || '',
      profileImage:
        profileImage ||
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
      image:
        profileImage ||
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
      coverImage: coverImage || '',
      bio: bio || '',
      location: location || 'Srinagar, J&K',
      genres: Array.isArray(genres) ? genres : genres ? genres.split(',').map((g: string) => g.trim()) : ['Contemporary'],
      socialLinks: socialLinks || {},
      streamingLinks: streamingLinks || {},
      status: status || 'ACTIVE',
      releaseIds: [],
      catalogueNumberPrefix: catalogueNumberPrefix || `CHNB-ART-${Math.floor(10 + Math.random() * 90)}`,
      joinedAt: now,
      updatedAt: now,
      internalNotes: internalNotes || '',
    };

    await db.collection('users').doc(uid).set(userProfileData, { merge: true });
    await db.collection('artists').doc(artistId).set(artistData, { merge: true });

    // Create a welcoming notification for the artist
    const notificationId = `notif-${Date.now()}`;
    await db.collection('notifications').doc(notificationId).set({
      id: notificationId,
      recipientUid: uid,
      userId: uid,
      artistId,
      title: 'WELCOME TO CHENAB MEDIA',
      message: `Your artist roster account (${stageName}) has been provisioned. Access your profile, catalog releases, and updates here.`,
      type: 'SYSTEM',
      read: false,
      createdAt: now,
      link: '/artist/profile',
    });

    // Trigger template email: ArtistWelcome
    const { sendTemplateEmail } = await import('@/lib/email/service');
    const emailResult = await sendTemplateEmail({
      templateKey: 'ARTIST_WELCOME',
      to: normalizedEmail,
      from: 'CHENAB A&R <artists@chenabmedia.in>',
      subject: `Welcome to CHENAB MEDIA Roster - ${stageName}`,
      variables: {
        artistStageName: stageName,
        artistId,
        artistEmail: normalizedEmail,
        temporaryPassword,
        loginLink: 'https://chenabmedia.in/login',
        supportEmail: 'artists@chenabmedia.in',
        supportPhone: '+1 (800) 555-CHENAB',
        website: 'https://chenabmedia.in',
        companyName: 'Chenab Media',
      },
      actorEmail: authRes.profile.email,
      actorUid: authRes.profile.uid,
      eventType: 'ARTIST_PROVISIONED',
      relatedId: artistId,
    });

    // Record Audit Log
    await recordAuditLog(
      { uid: authRes.profile.uid, name: authRes.profile.displayName || undefined, email: authRes.profile.email },
      'ARTIST_MODIFIED',
      'artist',
      artistId,
      `Created new artist profile "${stageName}" (${normalizedEmail}) linked to UID ${uid}.`,
      { artistId, uid, stageName, status }
    );

    return NextResponse.json(
      {
        success: true,
        artist: artistData,
        user: userProfileData,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error creating artist:', err);
    return NextResponse.json({ error: 'Failed to create artist' }, { status: 500 });
  }
}
