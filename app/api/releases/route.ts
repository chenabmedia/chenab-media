import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { RELEASES } from '@/data/releases';
import { Release } from '@/types';

export async function GET(req: NextRequest) {
  try {
    let publishedReleases: Release[] = [];

    if (adminDb) {
      const snap = await adminDb
        .collection('releases')
        .where('status', '==', 'PUBLISHED')
        .get();

      snap.forEach((doc) => {
        publishedReleases.push({ id: doc.id, ...doc.data() } as Release);
      });
    }

    // Fallback to static RELEASES data if Firestore has no published releases yet
    if (publishedReleases.length === 0) {
      publishedReleases = RELEASES.filter(
        (r) => r.status === 'OUT NOW' || r.status === 'PRE-ORDER' || (r.status as any) === 'PUBLISHED'
      );
    }

    // Sort newest release date first
    publishedReleases.sort(
      (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    );

    return NextResponse.json({ releases: publishedReleases }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching public releases:', err);
    // Fallback to static
    return NextResponse.json({ releases: RELEASES }, { status: 200 });
  }
}
