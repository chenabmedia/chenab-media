import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getReleaseBySlug } from '@/data/releases';
import { Release } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    if (adminDb) {
      const snap = await adminDb
        .collection('releases')
        .where('slug', '==', slug)
        .get();

      if (!snap.empty) {
        const doc = snap.docs[0];
        const release = { id: doc.id, ...doc.data() } as Release;

        // Non-published releases should not be publicly visible
        if (
          release.status !== 'PUBLISHED' &&
          (release.status as any) !== 'OUT NOW' &&
          (release.status as any) !== 'PRE-ORDER'
        ) {
          return NextResponse.json({ error: 'Release not available' }, { status: 404 });
        }

        return NextResponse.json({ release }, { status: 200 });
      }
    }

    // Fallback to static releases
    const staticRelease = getReleaseBySlug(slug);
    if (staticRelease) {
      return NextResponse.json({ release: staticRelease }, { status: 200 });
    }

    return NextResponse.json({ error: 'Release not found' }, { status: 404 });
  } catch (err: any) {
    console.error('Error fetching release by slug:', err);
    return NextResponse.json({ error: 'Failed to fetch release' }, { status: 500 });
  }
}
