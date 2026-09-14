import { NextRequest, NextResponse } from 'next/server';
import { getPublicReleases } from '@/lib/firebase/serverCatalog';

export async function GET(req: NextRequest) {
  try {
    const releases = await getPublicReleases();
    return NextResponse.json({ releases }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching public releases:', err);
    return NextResponse.json({ error: 'Failed to fetch releases' }, { status: 500 });
  }
}
