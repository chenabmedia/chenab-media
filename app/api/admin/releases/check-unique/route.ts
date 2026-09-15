import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
  const authRes = await verifyServerAuth(req, 'releases.view');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: 'Firestore Admin service unavailable' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const catNum = (searchParams.get('catalogueNumber') || '').trim().toUpperCase();
  const slug = (searchParams.get('slug') || '').trim().toLowerCase();
  const smartLinkSlug = (searchParams.get('smartLinkSlug') || '').trim().toLowerCase();
  const excludeId = searchParams.get('excludeId');

  try {
    let catNumExists = false;
    let slugExists = false;
    let smartLinkSlugExists = false;

    if (catNum) {
      const snap = await db
        .collection('releases')
        .where('catalogueNumber', '==', catNum)
        .get();
      const docs = snap.docs.filter((d) => d.id !== excludeId);
      if (docs.length > 0) catNumExists = true;
    }

    if (slug) {
      const snap = await db
        .collection('releases')
        .where('slug', '==', slug)
        .get();
      const docs = snap.docs.filter((d) => d.id !== excludeId);
      if (docs.length > 0) slugExists = true;
    }

    if (smartLinkSlug) {
      const snap = await db
        .collection('smartLinks')
        .where('slug', '==', smartLinkSlug)
        .get();
      const docs = snap.docs.filter((d) => d.data().releaseId !== excludeId);
      if (docs.length > 0) smartLinkSlugExists = true;
    }

    return NextResponse.json({
      catNumExists,
      slugExists,
      smartLinkSlugExists,
    });
  } catch (err: any) {
    console.error('Error checking uniqueness:', err);
    return NextResponse.json({ error: err.message || 'Validation failed' }, { status: 500 });
  }
}
