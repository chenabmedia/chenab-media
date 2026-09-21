import { NextRequest, NextResponse } from 'next/server';
import { getPublicReleaseBySlug } from '@/lib/firebase/serverCatalog';
import appletConfig from '@/firebase-applet-config.json';
import { SmartLink, Release } from '@/types';

function parseRestDoc(doc: any): any {
  if (!doc) return null;
  const nameParts = (doc.name || '').split('/');
  const id = nameParts[nameParts.length - 1] || '';
  const fields = doc.fields || {};
  const data: Record<string, any> = { id };
  for (const k of Object.keys(fields)) {
    const val = fields[k];
    if ('stringValue' in val) data[k] = val.stringValue;
    else if ('integerValue' in val) data[k] = parseInt(val.integerValue, 10);
    else if ('booleanValue' in val) data[k] = val.booleanValue;
    else if ('mapValue' in val) {
      const subFields = val.mapValue?.fields || {};
      const subMap: Record<string, any> = {};
      for (const sk of Object.keys(subFields)) {
        subMap[sk] = subFields[sk].stringValue || subFields[sk].integerValue || subFields[sk].booleanValue;
      }
      data[k] = subMap;
    }
  }
  return data;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    let smartLink: SmartLink | null = null;
    let release: Release | null = null;

    // 1. Query smartLinks collection via Worker-safe Firestore REST
    const cfg = appletConfig as Record<string, string>;
    const projectId = cfg.projectId || 'chenabmedia-in';
    const dbId = cfg.firestoreDatabaseId || '(default)';
    const apiKey = cfg.apiKey;

    if (apiKey) {
      try {
        const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents:runQuery?key=${apiKey}`;
        const queryBody = {
          structuredQuery: {
            from: [{ collectionId: 'smartLinks' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'slug' },
                op: 'EQUAL',
                value: { stringValue: slug },
              },
            },
            limit: 1,
          },
        };

        const res = await fetch(queryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(queryBody),
          cache: 'no-store',
        });

        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json) && json[0]?.document) {
            const parsedSl = parseRestDoc(json[0].document);
            if (parsedSl) {
              smartLink = parsedSl as SmartLink;
              if (smartLink.releaseId) {
                const relRes = await fetch(
                  `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/releases/${smartLink.releaseId}?key=${apiKey}`,
                  { cache: 'no-store' }
                );
                if (relRes.ok) {
                  const relDoc = await relRes.json();
                  release = parseRestDoc(relDoc) as Release;
                }
              }
            }
          }
        }
      } catch (restErr) {
        console.warn('REST SmartLink lookup note:', restErr);
      }
    }

    // 2. Query release by slug from serverCatalog
    if (!release) {
      const foundRel = await getPublicReleaseBySlug(slug);
      if (foundRel) {
        release = foundRel;
        smartLink = {
          id: (foundRel as any).smartLink?.id || `sm-${foundRel.id}`,
          releaseId: foundRel.id,
          slug: (foundRel as any).smartLink?.slug || foundRel.slug,
          title: foundRel.title,
          artistIds: (foundRel as any).artistIds || [],
          artistName: foundRel.artistName,
          artwork: (foundRel as any).coverImage || (foundRel as any).cover || (foundRel as any).coverArtUrl || '',
          dspLinks: (foundRel as any).dspLinks || (foundRel as any).streamingLinks || {},
          status: 'ACTIVE',
        };
      }
    }

    if (!smartLink || !release) {
      return NextResponse.json({ error: 'Smart Link not found' }, { status: 404 });
    }

    return NextResponse.json({ smartLink, release }, { status: 200 });
  } catch (err: any) {
    console.error('Error resolving Smart Link:', err);
    return NextResponse.json({ error: 'Failed to resolve Smart Link' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const body = await req.json();
    const { platform, smartLinkId, releaseId } = body;

    if (!platform) {
      return NextResponse.json({ error: 'Missing platform parameter' }, { status: 400 });
    }

    const cfg = appletConfig as Record<string, string>;
    const projectId = cfg.projectId || 'chenabmedia-in';
    const dbId = cfg.firestoreDatabaseId || '(default)';
    const apiKey = cfg.apiKey;

    if (apiKey) {
      try {
        const userAgent = req.headers.get('user-agent') || 'Unknown';
        const referrer = req.headers.get('referer') || 'Direct';
        const eventUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/smartLinkEvents?key=${apiKey}`;

        await fetch(eventUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              smartLinkId: { stringValue: smartLinkId || '' },
              releaseId: { stringValue: releaseId || '' },
              slug: { stringValue: slug },
              platform: { stringValue: platform },
              timestamp: { stringValue: new Date().toISOString() },
              referrer: { stringValue: referrer },
              device: { stringValue: userAgent.includes('Mobile') ? 'Mobile' : 'Desktop' },
            },
          }),
        });
      } catch (trackErr) {
        console.warn('Event track warning:', trackErr);
      }
    }

    return NextResponse.json({ recorded: true }, { status: 200 });
  } catch (err: any) {
    console.error('Error recording smart link click:', err);
    return NextResponse.json({ recorded: false }, { status: 500 });
  }
}
