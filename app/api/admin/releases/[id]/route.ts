import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { adminDb } from '@/lib/firebase/admin';
import { recordAuditLog } from '@/lib/firebase/audit';
import { Release, ReleaseType } from '@/types';

function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authRes = await verifyServerAuth(req, 'releases.view');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Database instance not configured' }, { status: 500 });
  }

  try {
    const doc = await adminDb.collection('releases').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Release record not found' }, { status: 404 });
    }

    const releaseData = { id: doc.id, ...doc.data() };
    return NextResponse.json({ release: releaseData }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching release:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch release' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authRes = await verifyServerAuth(req, 'releases.edit');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Database instance not configured' }, { status: 500 });
  }

  try {
    const docRef = adminDb.collection('releases').doc(id);
    const existingSnap = await docRef.get();
    if (!existingSnap.exists) {
      return NextResponse.json({ error: 'Release record not found' }, { status: 404 });
    }

    const existing = existingSnap.data() as Release;
    const body = await req.json();

    const {
      title = existing.title,
      releaseType = existing.releaseType || existing.type,
      type = existing.type || existing.releaseType,
      catalogueNumber = existing.catalogueNumber,
      slug: rawSlug = existing.slug,
      primaryArtistIds = existing.primaryArtistIds || existing.artistIds || [],
      featuredArtistIds = existing.featuredArtistIds || [],
      artistName = existing.artistName,
      coverImage = existing.coverImage || existing.cover,
      cover = existing.cover || existing.coverImage,
      backCoverImage = existing.backCoverImage || '',
      description = existing.description || '',
      genre = existing.genre || (existing.genres && existing.genres[0]) || '',
      subgenres = existing.subgenres || [],
      genres = existing.genres || [],
      releaseDate = existing.releaseDate,
      status = existing.status,
      explicit = existing.explicit || false,
      copyright = existing.copyright || '© CHENAB MEDIA',
      publisher = existing.publisher || 'CHENAB MEDIA Publishing',
      label = existing.label || 'CHENAB MEDIA',
      tracks = existing.tracks || [],
      credits = existing.credits || [],
      dspLinks = existing.dspLinks || existing.streamingLinks || {},
      smartLinkSlug: rawSmartLinkSlug = existing.smartLink?.slug || existing.slug,
    } = body;

    const actualType: ReleaseType = releaseType || type || 'SINGLE';
    const finalCover = coverImage || cover || '';
    const slug = generateSlug(rawSlug || title || '');
    const smartLinkSlug = generateSlug(rawSmartLinkSlug || slug);
    const catNum = (catalogueNumber || '').trim().toUpperCase();

    // 1. Check duplicate catalogue number if changed
    if (catNum !== existing.catalogueNumber) {
      const catCheck = await adminDb
        .collection('releases')
        .where('catalogueNumber', '==', catNum)
        .get();
      if (!catCheck.empty) {
        return NextResponse.json(
          { error: `Catalogue number "${catNum}" already exists on another release.` },
          { status: 400 }
        );
      }
    }

    // 2. Check duplicate release slug if changed
    if (slug !== existing.slug) {
      const slugCheck = await adminDb
        .collection('releases')
        .where('slug', '==', slug)
        .get();
      const duplicateDocs = slugCheck.docs.filter((d) => d.id !== id);
      if (duplicateDocs.length > 0) {
        return NextResponse.json(
          { error: `Release slug "/release/${slug}" already exists on another release.` },
          { status: 400 }
        );
      }
    }

    // 3. Check duplicate smart link slug if changed
    const smartLinkQuery = await adminDb
      .collection('smartLinks')
      .where('releaseId', '==', id)
      .get();
    let existingSmartLinkId = existing.smartLink?.id || null;
    if (!existingSmartLinkId && !smartLinkQuery.empty) {
      existingSmartLinkId = smartLinkQuery.docs[0].id;
    }

    const smartSlugCheck = await adminDb
      .collection('smartLinks')
      .where('slug', '==', smartLinkSlug)
      .get();
    const duplicateSmartLinks = smartSlugCheck.docs.filter((d) => d.id !== existingSmartLinkId);
    if (duplicateSmartLinks.length > 0) {
      return NextResponse.json(
        { error: `Smart Link slug "/listen/${smartLinkSlug}" already exists.` },
        { status: 400 }
      );
    }

    // 4. Validate if publishing
    if (status === 'PUBLISHED') {
      // Must have permission 'releases.publish' if changing to PUBLISHED
      if (existing.status !== 'PUBLISHED' && authRes.profile.role !== 'admin') {
        const canPublish = authRes.profile.permissions?.includes('releases.publish');
        if (canPublish === false) {
          return NextResponse.json({ error: 'Permission denied: releases.publish required' }, { status: 403 });
        }
      }

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
    const now = new Date().toISOString();

    const smartLinkInfo = {
      id: existingSmartLinkId || `sm-${id}`,
      slug: smartLinkSlug,
      url: `/listen/${smartLinkSlug}`,
    };

    const updatedData = {
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
      smartLink: smartLinkInfo,
      updatedAt: now,
      updatedBy: authRes.profile.uid,
      ...(status === 'PUBLISHED' && !existing.publishedAt ? { publishedAt: now } : {}),
    };

    await docRef.update(updatedData);

    // Update or create Smart Link collection entry
    const smartLinkRef = adminDb.collection('smartLinks').doc(smartLinkInfo.id);
    await smartLinkRef.set(
      {
        id: smartLinkInfo.id,
        releaseId: id,
        slug: smartLinkSlug,
        title,
        artistIds: allArtistIds,
        artistName: artistName || 'CHENAB Artist',
        artwork: finalCover,
        dspLinks,
        status: status === 'UNPUBLISHED' || status === 'ARCHIVED' ? 'INACTIVE' : 'ACTIVE',
        updatedAt: now,
      },
      { merge: true }
    );

    // Record audit logs based on status change / action
    if (existing.status !== status) {
      if (status === 'PUBLISHED') {
        await recordAuditLog({
          actorUid: authRes.profile.uid,
          actorName: authRes.profile.displayName || 'Admin',
          actorEmail: authRes.profile.email,
          action: 'RELEASE_MODIFIED',
          targetType: 'release',
          targetId: id,
          description: `Published release "${title}" (${catNum})`,
        });

        // Trigger template emails: ReleasePublished & MusicLinkPublished
        try {
          const { sendTemplateEmail } = await import('@/lib/email/service');
          // Find primary artist emails
          const artistDocs = await adminDb.collection('artists').where('id', 'in', primaryArtistIds.length > 0 ? primaryArtistIds : ['none']).get();
          const targetEmails: string[] = [];
          artistDocs.forEach((aDoc) => {
            const aData = aDoc.data();
            if (aData.email) targetEmails.push(aData.email);
          });

          if (targetEmails.length > 0) {
            await sendTemplateEmail({
              templateKey: 'RELEASE_PUBLISHED',
              to: targetEmails,
              from: 'CHENAB Distribution <catalog@chenabmedia.in>',
              subject: `Release Published - ${title}`,
              variables: {
                releaseTitle: title,
                coverArtwork: finalCover,
                artistName: artistName || 'CHENAB Artist',
                releaseType: actualType,
                smartLink: `https://chenabmedia.in/listen/${smartLinkSlug}`,
                spotifyLink: dspLinks.spotify || '',
                appleMusicLink: dspLinks.appleMusic || '',
                youtubeLink: dspLinks.youtube || '',
                youtubeMusicLink: dspLinks.youtubeMusic || '',
                amazonMusicLink: dspLinks.amazonMusic || '',
                soundCloudLink: dspLinks.soundcloud || '',
                audiomackLink: dspLinks.audiomack || '',
                website: 'https://chenabmedia.in',
                supportEmail: 'catalog@chenabmedia.in',
                companyName: 'Chenab Media',
              },
              actorEmail: authRes.profile.email,
              actorUid: authRes.profile.uid,
              eventType: 'RELEASE_PUBLISHED',
              relatedId: id,
            });

            await sendTemplateEmail({
              templateKey: 'MUSIC_LINK_PUBLISHED',
              to: targetEmails,
              from: 'CHENAB Distribution <catalog@chenabmedia.in>',
              subject: `SmartLink Ready - ${title}`,
              variables: {
                releaseTitle: title,
                coverArtwork: finalCover,
                artistName: artistName || 'CHENAB Artist',
                smartLink: `https://chenabmedia.in/listen/${smartLinkSlug}`,
                qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://chenabmedia.in/listen/${smartLinkSlug}`,
                website: 'https://chenabmedia.in',
                supportEmail: 'catalog@chenabmedia.in',
                companyName: 'Chenab Media',
              },
              actorEmail: authRes.profile.email,
              actorUid: authRes.profile.uid,
              eventType: 'MUSIC_LINK_PUBLISHED',
              relatedId: id,
            });
          }
        } catch (emailErr) {
          console.error('Error dispatching release published email:', emailErr);
        }
      } else if (status === 'UNPUBLISHED') {
        await recordAuditLog({
          actorUid: authRes.profile.uid,
          actorName: authRes.profile.displayName || 'Admin',
          actorEmail: authRes.profile.email,
          action: 'RELEASE_MODIFIED',
          targetType: 'release',
          targetId: id,
          description: `Unpublished release "${title}" (${catNum})`,
        });
      } else if (status === 'ARCHIVED') {
        await recordAuditLog({
          actorUid: authRes.profile.uid,
          actorName: authRes.profile.displayName || 'Admin',
          actorEmail: authRes.profile.email,
          action: 'RELEASE_MODIFIED',
          targetType: 'release',
          targetId: id,
          description: `Archived release "${title}" (${catNum})`,
        });
      }
    } else {
      await recordAuditLog({
        actorUid: authRes.profile.uid,
        actorName: authRes.profile.displayName || 'Admin',
        actorEmail: authRes.profile.email,
        action: 'RELEASE_MODIFIED',
        targetType: 'release',
        targetId: id,
        description: `Updated release metadata for "${title}" (${catNum})`,
      });
    }

    if (JSON.stringify(existing.dspLinks || {}) !== JSON.stringify(dspLinks)) {
      await recordAuditLog({
        actorUid: authRes.profile.uid,
        actorName: authRes.profile.displayName || 'Admin',
        actorEmail: authRes.profile.email,
        action: 'RELEASE_MODIFIED',
        targetType: 'release',
        targetId: id,
        description: `Updated DSP links for "${title}"`,
      });
    }

    return NextResponse.json(
      { message: 'Release updated successfully', release: { id, ...updatedData } },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Error updating release:', err);
    return NextResponse.json({ error: err.message || 'Failed to update release' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authRes = await verifyServerAuth(req, 'releases.delete');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Database instance not configured' }, { status: 500 });
  }

  try {
    const docRef = adminDb.collection('releases').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Release record not found' }, { status: 404 });
    }

    const existing = snap.data() as Release;

    // Soft-archive by updating status to ARCHIVED
    await docRef.update({
      status: 'ARCHIVED',
      updatedAt: new Date().toISOString(),
      updatedBy: authRes.profile.uid,
    });

    await recordAuditLog({
      actorUid: authRes.profile.uid,
      actorName: authRes.profile.displayName || 'Admin',
      actorEmail: authRes.profile.email,
      action: 'RELEASE_MODIFIED',
      targetType: 'release',
      targetId: id,
      description: `Archived release "${existing.title}" (${existing.catalogueNumber})`,
    });

    return NextResponse.json({ message: 'Release archived successfully' }, { status: 200 });
  } catch (err: any) {
    console.error('Error archiving release:', err);
    return NextResponse.json({ error: err.message || 'Failed to archive release' }, { status: 500 });
  }
}
