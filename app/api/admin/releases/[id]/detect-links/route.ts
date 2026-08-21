import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { adminDb, getAdminDb } from '@/lib/firebase/admin';
import { detectOdesliLinks } from '@/lib/dsp/odesli';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Verify server authentication with releases.edit permission
  const authRes = await verifyServerAuth(req, 'releases.edit');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON request payload' },
      { status: 400 }
    );
  }

  const { scanSource } = body;

  if (!scanSource || typeof scanSource !== 'string' || !scanSource.trim()) {
    return NextResponse.json(
      { error: 'Enter a valid Spotify, Apple Music, YouTube, or other supported DSP URL.' },
      { status: 400 }
    );
  }

  const trimmedSource = scanSource.trim();

  // Validate that scanSource is a URL
  try {
    const parsedUrl = new URL(trimmedSource);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }
  } catch {
    return NextResponse.json(
      {
        error:
          'Enter a valid Spotify, Apple Music, YouTube, or other supported DSP URL. Direct ISRC/UPC lookups require a seed streaming link.',
      },
      { status: 400 }
    );
  }

  // Optional: check release existence if not creating a new one
  if (id && id !== 'new' && id !== 'draft') {
    const db = adminDb || getAdminDb();
    if (db) {
      try {
        let doc = await db.collection('releases').doc(id).get();
        if (!doc.exists) {
          const snap = await db.collection('releases').where('id', '==', id).limit(1).get();
          if (!snap.empty) {
            doc = snap.docs[0];
          }
        }
      } catch (err) {
        console.warn('Non-fatal release check error:', err);
      }
    }
  }

  // Perform read-only Odesli cross-DSP resolution (DOES NOT WRITE TO FIRESTORE)
  const result = await detectOdesliLinks(trimmedSource);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: result.error || 'Failed to detect streaming links',
        scanSource: trimmedSource,
      },
      { status: 422 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      releaseId: id,
      scanSource: result.scanSource,
      detectedLinks: result.detectedLinks,
      matchedStores: result.matchedStores,
      pageUrl: result.pageUrl,
      title: result.title,
      artistName: result.artistName,
    },
    { status: 200 }
  );
}
