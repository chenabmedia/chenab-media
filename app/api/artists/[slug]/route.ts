import { NextRequest, NextResponse } from 'next/server';
import { getPublicArtistBySlug } from '@/lib/firebase/serverCatalog';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const artist = await getPublicArtistBySlug(slug);
    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    return NextResponse.json({ artist }, { status: 200 });
  } catch (err: any) {
    console.error('Error in GET /api/artists/[slug]:', err);
    return NextResponse.json({ error: 'Failed to fetch artist' }, { status: 500 });
  }
}
