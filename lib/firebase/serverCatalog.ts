import { adminDb, getAdminDb } from './admin';
import appletConfig from '@/firebase-applet-config.json';
import { Artist, Release, SmartLink } from '@/types';

/**
 * Helper to normalize string to URL-safe slug
 */
export function slugify(text: string): string {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Unwraps Firestore REST API values into plain JS values
 */
function unwrapFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return val;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(unwrapFirestoreValue);
  }
  if ('mapValue' in val) {
    const obj: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      obj[k] = unwrapFirestoreValue(v);
    }
    return obj;
  }
  return val;
}

/**
 * Parses raw Firestore REST Document into a plain object with canonical id: doc.id
 */
function parseFirestoreRestDoc<T = any>(doc: any): T {
  const nameParts = (doc.name || '').split('/');
  const docId = nameParts[nameParts.length - 1];
  const result: Record<string, any> = {};

  if (doc.fields) {
    for (const [key, val] of Object.entries(doc.fields)) {
      result[key] = unwrapFirestoreValue(val);
    }
  }

  // Canonical ID rule: doc.id is paramount
  result.id = docId;
  return result as T;
}

/**
 * Normalizes an Artist record to conform to the Artist UI interface
 */
export function normalizeArtist(raw: any, docId: string): Artist {
  const stageName = raw.stageName || raw.name || 'Unknown Artist';
  const slug = raw.slug || slugify(stageName) || docId;
  const image = raw.profileImage || raw.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80';

  return {
    ...raw,
    id: docId, // Canonical ID rule
    name: stageName,
    stageName: stageName,
    slug: slug,
    image: image,
    profileImage: image,
    bio: raw.bio || '',
    location: raw.location || 'Jammu & Kashmir',
    genres: Array.isArray(raw.genres) ? raw.genres : (raw.genres ? [raw.genres] : ['Electronic', 'Ambient']),
    status: raw.status || 'ACTIVE',
    socialLinks: raw.socialLinks || {},
    streamingLinks: raw.streamingLinks || raw.dspLinks || {},
    releaseIds: Array.isArray(raw.releaseIds) ? raw.releaseIds : [],
    featuredQuote: raw.featuredQuote || '',
  };
}

/**
 * Normalizes a Release record to conform to the Release UI interface
 */
export function normalizeRelease(raw: any, docId: string): Release {
  const title = raw.title || 'Untitled Release';
  const artistName = raw.artistName || 'CHENAB Artist';
  const slug = raw.slug || slugify(title) || docId;
  const cover = raw.coverImage || raw.cover || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80';
  const type = raw.releaseType || raw.type || 'SINGLE';

  return {
    ...raw,
    id: docId, // Canonical ID rule
    title: title,
    artistName: artistName,
    slug: slug,
    cover: cover,
    coverImage: cover,
    type: type,
    releaseType: type,
    catalogueNumber: raw.catalogueNumber || `CHNB-${docId.slice(-3).toUpperCase()}`,
    releaseDate: raw.releaseDate || new Date().toISOString().split('T')[0],
    genres: Array.isArray(raw.genres) ? raw.genres : (raw.genres ? [raw.genres] : ['Electronic']),
    description: raw.description || '',
    status: raw.status || 'PUBLISHED',
    tracks: Array.isArray(raw.tracks) ? raw.tracks : [],
    credits: Array.isArray(raw.credits) ? raw.credits : [],
    artistIds: Array.isArray(raw.primaryArtistIds) && raw.primaryArtistIds.length > 0 
      ? raw.primaryArtistIds 
      : (Array.isArray(raw.artistIds) ? raw.artistIds : []),
    featuredArtistIds: Array.isArray(raw.featuredArtistIds) ? raw.featuredArtistIds : [],
    streamingLinks: raw.streamingLinks || raw.dspLinks || {},
    dspLinks: raw.dspLinks || raw.streamingLinks || {},
    smartLink: raw.smartLink || undefined,
  };
}

/**
 * Fetches all public artists from Firestore (using adminDb/getAdminDb with REST fallback)
 */
export async function getPublicArtists(): Promise<Artist[]> {
  const db = adminDb || getAdminDb();
  if (db) {
    try {
      const snap = await db.collection('artists').get();
      if (!snap.empty) {
        const artists: Artist[] = [];
        snap.forEach((doc) => {
          artists.push(normalizeArtist(doc.data(), doc.id));
        });
        return artists;
      }
    } catch (e: any) {
      console.warn('ServerCatalog: Firestore Admin artists query error:', e?.message || e);
    }
  }

  // REST API Fallback
  try {
    const cfg = appletConfig as Record<string, string>;
    const projectId = cfg.projectId || 'chenabmedia-in';
    const dbId = cfg.firestoreDatabaseId || '(default)';
    const apiKey = cfg.apiKey;

    if (apiKey) {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/artists?key=${apiKey}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.documents && json.documents.length > 0) {
          return json.documents.map((doc: any) => {
            const parsed = parseFirestoreRestDoc(doc);
            return normalizeArtist(parsed, parsed.id);
          });
        }
      }
    }
  } catch (err: any) {
    console.warn('ServerCatalog: Firestore REST artists error:', err?.message || err);
  }

  // Return empty array if Firestore has no artists or is unreachable (never return stale demo data)
  return [];
}

/**
 * Fetches a single artist by slug or id from Firestore
 */
export async function getPublicArtistBySlug(slug: string): Promise<Artist | null> {
  const artists = await getPublicArtists();
  const lowerSlug = slug.toLowerCase();
  
  const found = artists.find(
    (a) =>
      (a.slug && a.slug.toLowerCase() === lowerSlug) ||
      a.id === slug ||
      (a.stageName && slugify(a.stageName) === lowerSlug) ||
      (a.name && slugify(a.name) === lowerSlug)
  );

  return found || null;
}

/**
 * Fetches all public releases from Firestore
 */
export async function getPublicReleases(): Promise<Release[]> {
  const db = adminDb || getAdminDb();
  if (db) {
    try {
      const snap = await db.collection('releases').get();
      if (!snap.empty) {
        const releases: Release[] = [];
        snap.forEach((doc) => {
          const raw = doc.data();
          const normalized = normalizeRelease(raw, doc.id);
          // Only show published / out now releases on public views
          if (
            normalized.status === 'PUBLISHED' ||
            normalized.status === 'OUT NOW' ||
            normalized.status === 'PRE-ORDER' ||
            !normalized.status
          ) {
            releases.push(normalized);
          }
        });

        if (releases.length > 0) {
          // Sort newest first
          releases.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
          return releases;
        }
      }
    } catch (e: any) {
      console.warn('ServerCatalog: Firestore Admin releases query error:', e?.message || e);
    }
  }

  // REST API Fallback
  try {
    const cfg = appletConfig as Record<string, string>;
    const projectId = cfg.projectId || 'chenabmedia-in';
    const dbId = cfg.firestoreDatabaseId || '(default)';
    const apiKey = cfg.apiKey;

    if (apiKey) {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/releases?key=${apiKey}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.documents && json.documents.length > 0) {
          const releases: Release[] = [];
          json.documents.forEach((doc: any) => {
            const parsed = parseFirestoreRestDoc(doc);
            const normalized = normalizeRelease(parsed, parsed.id);
            if (
              normalized.status === 'PUBLISHED' ||
              normalized.status === 'OUT NOW' ||
              normalized.status === 'PRE-ORDER' ||
              !normalized.status
            ) {
              releases.push(normalized);
            }
          });

          if (releases.length > 0) {
            releases.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
            return releases;
          }
        }
      }
    }
  } catch (err: any) {
    console.warn('ServerCatalog: Firestore REST releases error:', err?.message || err);
  }

  // Return empty array if Firestore has no published releases or is unreachable (never return stale demo data)
  return [];
}

/**
 * Fetches a single release by slug or id from Firestore
 */
export async function getPublicReleaseBySlug(slug: string): Promise<Release | null> {
  const releases = await getPublicReleases();
  const lowerSlug = slug.toLowerCase();

  const found = releases.find(
    (r) =>
      (r.slug && r.slug.toLowerCase() === lowerSlug) ||
      r.id === slug ||
      (r.catalogueNumber && r.catalogueNumber.toLowerCase() === lowerSlug) ||
      (r.title && slugify(r.title) === lowerSlug)
  );

  return found || null;
}
