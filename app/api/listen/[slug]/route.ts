import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getReleaseBySlug, RELEASES } from '@/data/releases';
import { SmartLink, Release } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    let smartLink: SmartLink | null = null;
    let release: Release | null = null;

    if (adminDb) {
      // 1. Query smartLinks collection by slug
      const smartLinkSnap = await adminDb
        .collection('smartLinks')
        .where('slug', '==', slug)
        .get();

      if (!smartLinkSnap.empty) {
        const doc = smartLinkSnap.docs[0];
        smartLink = { id: doc.id, ...doc.data() } as SmartLink;

        // Fetch associated release
        if (smartLink.releaseId) {
          const relDoc = await adminDb.collection('releases').doc(smartLink.releaseId).get();
          if (relDoc.exists) {
            release = { id: relDoc.id, ...relDoc.data() } as Release;
          }
        }
      } else {
        // 2. Query releases collection by slug or smartLink.slug
        const releaseSnap = await adminDb
          .collection('releases')
          .where('slug', '==', slug)
          .get();

        if (!releaseSnap.empty) {
          const doc = releaseSnap.docs[0];
          release = { id: doc.id, ...doc.data() } as Release;
          smartLink = {
            id: release.smartLink?.id || `sm-${release.id}`,
            releaseId: release.id,
            slug: release.smartLink?.slug || release.slug,
            title: release.title,
            artistIds: release.artistIds || [],
            artistName: release.artistName,
            artwork: release.coverImage || release.cover || '',
            dspLinks: release.dspLinks || release.streamingLinks || {},
            status: 'ACTIVE',
          };
        }
      }
    }

    // 3. Fallback to static releases if not found in Firestore
    if (!smartLink || !release) {
      const staticRel = getReleaseBySlug(slug) || RELEASES.find((r) => r.slug === slug);
      if (staticRel) {
        release = staticRel;
        smartLink = {
          id: `sm-${staticRel.id}`,
          releaseId: staticRel.id,
          slug: staticRel.slug,
          title: staticRel.title,
          artistIds: staticRel.artistIds,
          artistName: staticRel.artistName,
          artwork: staticRel.cover || '',
          dspLinks: staticRel.streamingLinks || {},
          status: 'ACTIVE',
        };
      }
    }

    if (!smartLink || !release) {
      return NextResponse.json({ error: 'Smart Link not found' }, { status: 404 });
    }

    return NextResponse.json({ smartLink, release }, { status: 200 });
  } catch (err: any) {
    console.error('Error resolving Smart Link:', err);
    return NextResponse.json({ error: 'Failed to resolve Smart Link' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const body = await req.json();
    const { platform, smartLinkId, releaseId } = body;

    if (!platform) {
      return NextResponse.json({ error: 'Missing platform parameter' }, { status: 400 });
    }

    if (adminDb) {
      const userAgent = req.headers.get('user-agent') || 'Unknown';
      const referrer = req.headers.get('referer') || 'Direct';

      const eventRef = adminDb.collection('smartLinkEvents').doc();
      await eventRef.set({
        id: eventRef.id,
        smartLinkId: smartLinkId || '',
        releaseId: releaseId || '',
        slug,
        platform,
        timestamp: new Date().toISOString(),
        referrer,
        device: userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
      });

      // Increment click count on smartLink document if smartLinkId exists
      if (smartLinkId) {
        const slRef = adminDb.collection('smartLinks').doc(smartLinkId);
        const slDoc = await slRef.get();
        if (slDoc.exists) {
          const currentCount = slDoc.data()?.clickCount || 0;
          await slRef.update({
            clickCount: currentCount + 1,
            lastClickedAt: new Date().toISOString(),
          });
        }
      }
    }

    return NextResponse.json({ recorded: true }, { status: 200 });
  } catch (err: any) {
    console.error('Error recording smart link click:', err);
    return NextResponse.json({ recorded: false }, { status: 500 });
  }
}
