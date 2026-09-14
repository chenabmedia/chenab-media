import { NextRequest, NextResponse } from 'next/server';
import { getPublicJournalPostBySlug } from '@/lib/firebase/serverCatalog';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }

    const post = await getPublicJournalPostBySlug(slug);
    if (!post) {
      return NextResponse.json({ error: 'Journal post not found' }, { status: 404 });
    }

    return NextResponse.json({ post }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching journal post by slug:', err);
    return NextResponse.json({ error: 'Failed to fetch journal post' }, { status: 500 });
  }
}
