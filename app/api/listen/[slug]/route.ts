import { NextRequest, NextResponse } from 'next/server';
import { adminDb, getAdminDb } from '@/lib/firebase/admin';
import { getPublicReleaseBySlug } from '@/lib/firebase/serverCatalog';
import { SmartLink, Release } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    let smartLink: SmartLink | null = null;
    let release: Release | null = null;
    const db = adminDb || getAdminDb();

    if (db) {
      // 1. Query smartLinks collection by slug
      try {
        const smartLinkSnap = await db
          .collection('smartLinks')
          .where('slug', '==', slug)
          .get();

        if (!smartLinkSnap.empty) {
          const doc = smartLinkSnap.docs[0];
          smartLink = { ...doc.data(), id: doc.id } as SmartLink;

          // Fetch associated release
          if (smartLink.releaseId) {
            const relDoc = await db.collection('releases').doc(smartLink.releaseId).get();
            if (relDoc.exists) {
              release = { ...relDoc.data(), id: relDoc.id } as Release;
            }
          }
        }
      } catch (e) {
        console.warn('SmartLink lookup note:', e);
      }
    }

    // 2. Query release by slug from serverCatalog (covers Firestore Admin & REST)
    if (!release) {
      const foundRel = await getPublicReleaseBySlug(slug);
      if (foundRel) {
        release = foundRel;
        smartLink = {
          id: foundRel.smartLink?.id || `sm-${foundRel.id}`,
          releaseId: foundRel.id,
          slug: foundRel.smartLink?.slug || foundRel.slug,
          title: foundRel.title,
          artistIds: foundRel.artistIds || [],
          artistName: foundRel.artistName,
          artwork: foundRel.coverImage || foundRel.cover || '',
          dspLinks: foundRel.dspLinks || foundRel.streamingLinks || {},
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

    const db = adminDb || getAdminDb();
    if (db) {
      const userAgent = req.headers.get('user-agent') || 'Unknown';
      const referrer = req.headers.get('referer') || 'Direct';

      const eventRef = db.collection('smartLinkEvents').doc();
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
        const slRef = db.collection('smartLinks').doc(smartLinkId);
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
