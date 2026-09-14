import { NextRequest, NextResponse } from 'next/server';
import { getPublicJournalPosts } from '@/lib/firebase/serverCatalog';

export async function GET(req: NextRequest) {
  try {
    const posts = await getPublicJournalPosts();
    return NextResponse.json({ posts }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching public journal posts:', err);
    return NextResponse.json({ error: 'Failed to fetch journal posts' }, { status: 500 });
  }
}
