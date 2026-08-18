import { NextRequest, NextResponse } from 'next/server';
import { getPublicReleaseBySlug } from '@/lib/firebase/serverCatalog';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const release = await getPublicReleaseBySlug(slug);
    if (!release) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    return NextResponse.json({ release }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching release by slug:', err);
    return NextResponse.json({ error: 'Failed to fetch release' }, { status: 500 });
  }
}
