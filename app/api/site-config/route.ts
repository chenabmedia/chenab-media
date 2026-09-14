import { NextResponse } from 'next/server';
import { getSiteConfig } from '@/lib/siteConfig';

export async function GET() {
  try {
    const config = await getSiteConfig();
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch site config' }, { status: 500 });
  }
}
