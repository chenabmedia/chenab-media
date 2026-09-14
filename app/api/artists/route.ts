import { NextRequest, NextResponse } from 'next/server';
import { getPublicArtists } from '@/lib/firebase/serverCatalog';

export async function GET(req: NextRequest) {
  try {
    const artists = await getPublicArtists();
    return NextResponse.json({ artists }, { status: 200 });
  } catch (err: any) {
    console.error('Error in GET /api/artists:', err);
    return NextResponse.json({ error: 'Failed to fetch artists' }, { status: 500 });
  }
}
