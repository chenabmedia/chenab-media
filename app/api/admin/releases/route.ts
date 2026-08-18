import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { adminDb, getAdminDb } from '@/lib/firebase/admin';
import { recordAuditLog } from '@/lib/firebase/audit';
import { Release, ReleaseStatus, ReleaseType } from '@/types';

function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(req: NextRequest) {
  const authRes = await verifyServerAuth(req, 'releases.view');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  try {
    let releasesList: Release[] = [];
    const db = adminDb || getAdminDb();

    if (db) {
      const snap = await db.collection('releases').get();
      snap.forEach((doc) => {
        releasesList.push({ ...doc.data(), id: doc.id } as Release);
      });
    }

    return NextResponse.json({ releases: releasesList }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching admin releases:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch releases' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authRes = await verifyServerAuth(req, 'releases.create');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Database instance not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const {
      title,
      releaseType,
      type,
      catalogueNumber,
      slug: rawSlug,
      primaryArtistIds = [],
      featuredArtistIds = [],
      artistName,
      coverImage,
      cover,
      backCoverImage = '',
      description = '',
      genre = '',
      subgenres = [],
      genres = [],
      releaseDate = new Date().toISOString().split('T')[0],
      status = 'DRAFT',
      explicit = false,
      copyright = '© CHENAB MEDIA',
      publisher = 'CHENAB MEDIA Publishing',
      label = 'CHENAB MEDIA',
      tracks = [],
      credits = [],
      dspLinks = {},
      smartLinkSlug: rawSmartLinkSlug,
    } = body;

    const actualType: ReleaseType = releaseType || type || 'SINGLE';
    const finalCover = coverImage || cover || '';
    const slug = generateSlug(rawSlug || title || '');
    const smartLinkSlug = generateSlug(rawSmartLinkSlug || slug);
    const catNum = (catalogueNumber || '').trim().toUpperCase();

    if (!title || !catNum) {
      return NextResponse.json(
        { error: 'Release Title and Catalogue Number are required.' },
        { status: 400 }
      );
    }

    // 1. Check duplicate catalogue number in Firestore
    const catCheck = await adminDb
      .collection('releases')
      .where('catalogueNumber', '==', catNum)
      .get();
    if (!catCheck.empty) {
      return NextResponse.json(
        { error: `Catalogue number "${catNum}" already exists. Overwrite prevented.` },
        { status: 400 }
      );
    }

    // 2. Check duplicate release slug in Firestore
    const slugCheck = await adminDb
      .collection('releases')
      .where('slug', '==', slug)
      .get();
    if (!slugCheck.empty) {
      return NextResponse.json(
        { error: `Release slug "/release/${slug}" already exists. Please choose a unique slug.` },
        { status: 400 }
      );
    }

    // 3. Check duplicate smart link slug in Firestore
    const smartLinkCheck = await adminDb
      .collection('smartLinks')
      .where('slug', '==', smartLinkSlug)
      .get();
    if (!smartLinkCheck.empty) {
      return NextResponse.json(
        { error: `Smart Link slug "/listen/${smartLinkSlug}" already exists. Please choose a unique slug.` },
        { status: 400 }
      );
    }

    // 4. Validate if status is set to PUBLISHED
    if (status === 'PUBLISHED') {
      if (!primaryArtistIds || primaryArtistIds.length === 0) {
        return NextResponse.json(
          { error: 'Validation failed: At least one Primary Artist is required to publish.' },
          { status: 400 }
        );
      }
      if (!finalCover) {
        return NextResponse.json(
          { error: 'Validation failed: Cover Artwork is required to publish.' },
          { status: 400 }
        );
      }
      if (!releaseDate) {
        return NextResponse.json(
          { error: 'Validation failed: Release Date is required to publish.' },
          { status: 400 }
        );
      }
      if (!tracks || tracks.length === 0) {
        return NextResponse.json(
          { error: 'Validation failed: At least one track is required to publish.' },
          { status: 400 }
        );
      }
      for (const tr of tracks) {
        if (!tr.title || tr.title.trim() === '') {
          return NextResponse.json(
            { error: 'Validation failed: Every track must have a Title.' },
            { status: 400 }
          );
        }
      }
    }

    const allArtistIds = Array.from(new Set([...primaryArtistIds, ...featuredArtistIds]));
    const allGenres = Array.from(new Set([genre, ...subgenres, ...genres])).filter(Boolean);

    const newReleaseRef = adminDb.collection('releases').doc();
    const releaseId = newReleaseRef.id;

    const smartLinkRef = adminDb.collection('smartLinks').doc();
    const smartLinkId = smartLinkRef.id;

    const now = new Date().toISOString();

    const releaseData = {
      id: releaseId,
      slug,
      catalogueNumber: catNum,
      title,
      releaseType: actualType,
      type: actualType,
      primaryArtistIds,
      featuredArtistIds,
      artistIds: allArtistIds,
      artistName: artistName || 'CHENAB Artist',
      coverImage: finalCover,
      cover: finalCover,
      backCoverImage,
      description,
      genre,
      subgenres,
      genres: allGenres,
      releaseDate,
      status,
      explicit,
      copyright,
      publisher,
      label,
      tracks: tracks.map((t: any, idx: number) => ({
        id: t.id || `tr-${idx + 1}`,
        trackNumber: t.trackNumber || t.number || idx + 1,
        number: t.trackNumber || t.number || idx + 1,
        title: t.title,
        version: t.version || '',
        duration: t.duration || '03:30',
        isrc: t.isrc || '',
        explicit: !!t.explicit,
        primaryArtistIds: t.primaryArtistIds || primaryArtistIds,
        featuredArtistIds: t.featuredArtistIds || [],
        featuredArtists: t.featuredArtists || [],
        writers: t.writers || [],
        producers: t.producers || [],
        credits: t.credits || [],
        audioPreviewUrl: t.audioPreviewUrl || t.audioUrl || '',
        dspLinks: t.dspLinks || {},
      })),
      credits,
      dspLinks,
      streamingLinks: dspLinks,
      smartLink: {
        id: smartLinkId,
        slug: smartLinkSlug,
        url: `/listen/${smartLinkSlug}`,
      },
      createdAt: now,
      updatedAt: now,
      publishedAt: status === 'PUBLISHED' ? now : null,
      createdBy: authRes.profile.uid,
      updatedBy: authRes.profile.uid,
    };

    await newReleaseRef.set(releaseData);

    const smartLinkData = {
      id: smartLinkId,
      releaseId,
      slug: smartLinkSlug,
      title,
      artistIds: allArtistIds,
      artistName: artistName || 'CHENAB Artist',
      artwork: finalCover,
      dspLinks,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      clickCount: 0,
    };

    await smartLinkRef.set(smartLinkData);

    // Record audit logs
    await recordAuditLog({
      actorUid: authRes.profile.uid,
      actorName: authRes.profile.displayName || 'Admin',
      actorEmail: authRes.profile.email,
      action: 'RELEASE_MODIFIED',
      targetType: 'release',
      targetId: releaseId,
      description: `Created release "${title}" (${catNum}) with status ${status}`,
    });

    await recordAuditLog({
      actorUid: authRes.profile.uid,
      actorName: authRes.profile.displayName || 'Admin',
      actorEmail: authRes.profile.email,
      action: 'RELEASE_MODIFIED',
      targetType: 'release',
      targetId: smartLinkId,
      description: `Created Smart Link for "${title}" at /listen/${smartLinkSlug}`,
    });

    return NextResponse.json(
      { message: 'Release created successfully', release: releaseData, smartLink: smartLinkData },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error creating release:', err);
    return NextResponse.json({ error: err.message || 'Failed to create release' }, { status: 500 });
  }
}
