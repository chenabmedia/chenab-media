import appletConfig from '@/firebase-applet-config.json';
import { Artist, Release, SmartLink, JournalPost } from '@/types';
import { JOURNAL_POSTS } from '@/data/journal';

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
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    const values = val.arrayValue?.values || [];
    return values.map(unwrapFirestoreValue);
  }
  if ('mapValue' in val) {
    const fields = val.mapValue?.fields || {};
    const res: Record<string, any> = {};
    for (const k of Object.keys(fields)) {
      res[k] = unwrapFirestoreValue(fields[k]);
    }
    return res;
  }
  return val;
}

/**
 * Parses raw Firestore REST Document resource into clean JS object
 */
function parseFirestoreRestDoc(doc: any): any {
  if (!doc) return null;
  const nameParts = (doc.name || '').split('/');
  const id = nameParts[nameParts.length - 1] || '';
  const fields = doc.fields || {};
  const data: Record<string, any> = { id };
  for (const k of Object.keys(fields)) {
    data[k] = unwrapFirestoreValue(fields[k]);
  }
  return data;
}

/**
 * Normalizes an Artist record to conform to Artist interface
 */
export function normalizeArtist(raw: any, docId: string): Artist {
  const stageName = raw.stageName || raw.name || 'Unknown Artist';
  const slug = raw.slug || slugify(stageName) || docId;
  const genres = Array.isArray(raw.genres)
    ? raw.genres
    : Array.isArray(raw.genre)
    ? raw.genre
    : typeof raw.genre === 'string'
    ? [raw.genre]
    : ['Electronic'];

  return {
    id: docId,
    name: stageName,
    stageName: stageName,
    legalName: raw.legalName || raw.realName || stageName,
    streamingLinks: raw.streamingLinks || {},
    releaseIds: raw.releaseIds || [],
    slug: slug,
    bio: raw.bio || raw.shortBio || 'CHENAB MEDIA roster artist based in Jammu & Kashmir.',
    genres: genres,
    location: raw.location || 'Jammu & Kashmir, IN',
    image: raw.image || raw.avatarUrl || raw.heroImage || raw.imageUrl || "",
    profileImage: raw.profileImage || raw.avatarUrl || raw.heroImage || "",
    socialLinks: raw.socialLinks || {},
    status: raw.status || 'ACTIVE',
  };
}

/**
 * Normalizes a Release record to conform to Release interface
 */
export function normalizeRelease(raw: any, docId: string): Release {
  const title = raw.title || 'Untitled Release';
  const slug = raw.slug || slugify(title) || docId;
  const smartLinks: SmartLink[] = Array.isArray(raw.smartLinks)
    ? raw.smartLinks
    : [];

  return {
    id: docId,
    title: title,
    slug: slug,
    artistIds: raw.artistIds || (raw.artistId ? [raw.artistId] : []),
    artistName: raw.artistName || raw.artist || 'CHENAB Artist',
    releaseType: raw.releaseType || 'SINGLE',
    catalogueNumber: raw.catalogueNumber || raw.catalogNumber || `CHN-${docId.substring(0, 4).toUpperCase()}`,
    releaseDate: raw.releaseDate || raw.date || '2026-01-01',
    coverImage: raw.coverImage || raw.coverArtUrl || raw.coverArt || raw.cover || "",
    cover: raw.cover || raw.coverImage || raw.coverArtUrl || "",
    genre: raw.genre || 'Electronic',
    status: raw.status || 'PUBLISHED',
    description: raw.description || '',
    tracks: Array.isArray(raw.tracks) ? raw.tracks : [],
    credits: raw.credits || '',
  };
}

/**
 * Helper to fetch documents from Firestore REST API
 */
async function fetchFirestoreCollection(collectionName: string): Promise<any[]> {
  try {
    const cfg = appletConfig as Record<string, string>;
    const projectId = cfg.projectId || 'chenabmedia-in';
    const dbId = cfg.firestoreDatabaseId || '(default)';
    const apiKey = cfg.apiKey;

    if (!apiKey) return [];

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/${collectionName}?key=${apiKey}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.documents && Array.isArray(json.documents)) {
        return json.documents.map(parseFirestoreRestDoc).filter(Boolean);
      }
    }
  } catch (err) {
    // Fail gracefully without crashing Worker / SSR isolate
  }
  return [];
}

/**
 * Fetches all public artists from Firestore via Worker-safe REST API
 */
export async function getPublicArtists(): Promise<Artist[]> {
  const docs = await fetchFirestoreCollection('artists');
  if (docs.length > 0) {
    return docs.map((d) => normalizeArtist(d, d.id));
  }
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
 * Fetches all public releases from Firestore via Worker-safe REST API
 */
export async function getPublicReleases(): Promise<Release[]> {
  const docs = await fetchFirestoreCollection('releases');
  if (docs.length > 0) {
    const releases: Release[] = [];
    for (const d of docs) {
      const normalized = normalizeRelease(d, d.id);
      if (
        normalized.status === 'PUBLISHED' ||
        normalized.status === 'OUT NOW' ||
        normalized.status === 'PRE-ORDER' ||
        !normalized.status
      ) {
        releases.push(normalized);
      }
    }

    if (releases.length > 0) {
      releases.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
      return releases;
    }
  }

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

/**
 * Normalizes a JournalPost record to conform to Journal UI interface
 */
export function normalizeJournalPost(raw: any, docId: string): JournalPost {
  const title = raw.title || 'Untitled Journal Entry';
  const slug = raw.slug || slugify(title) || docId;
  const category = raw.category || 'FIELD NOTES';
  const author = raw.author || 'CHENAB Editorial';
  const date = raw.publishedAt || raw.date || raw.createdAt ? (raw.publishedAt || raw.date || raw.createdAt).split('T')[0] : '2026-02-10';
  const coverUrl = raw.coverUrl || raw.image || raw.cover || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80';
  const shortExcerpt = raw.shortExcerpt || raw.excerpt || '';
  
  let content: string[] = [];
  if (Array.isArray(raw.content)) {
    content = raw.content;
  } else if (typeof raw.content === 'string') {
    content = raw.content.split('\n\n').filter(Boolean);
  }
  const rawContent = typeof raw.content === 'string' ? raw.content : (Array.isArray(raw.content) ? raw.content.join('\n\n') : '');
  const readTime = typeof raw.readTime === 'number' ? `${raw.readTime} min read` : (raw.readTime || '5 min read');
  const tags = Array.isArray(raw.tags) ? raw.tags : [];
  const status = raw.status || 'PUBLISHED';
  const featured = Boolean(raw.featured);

  return {
    id: docId,
    slug,
    title,
    category,
    date,
    publishedAt: raw.publishedAt || date,
    author,
    coverUrl,
    image: coverUrl,
    shortExcerpt,
    excerpt: shortExcerpt,
    content,
    rawContent,
    readTime,
    tags,
    status,
    featured,
  };
}

/**
 * Fetches all published journal posts from Firestore with fallback to static JOURNAL_POSTS
 */
export async function getPublicJournalPosts(): Promise<JournalPost[]> {
  const docs = await fetchFirestoreCollection('journal');
  if (docs.length > 0) {
    const posts: JournalPost[] = [];
    for (const d of docs) {
      const normalized = normalizeJournalPost(d, d.id);
      if (normalized.status === 'PUBLISHED' || !normalized.status) {
        posts.push(normalized);
      }
    }

    if (posts.length > 0) {
      posts.sort((a, b) => new Date(b.date || b.publishedAt || '').getTime() - new Date(a.date || a.publishedAt || '').getTime());
      return posts;
    }
  }

  // Fallback to static JOURNAL_POSTS formatted
  return (JOURNAL_POSTS || []).map((p) => normalizeJournalPost(p, p.id));
}

/**
 * Fetches a single journal post by slug or id
 */
export async function getPublicJournalPostBySlug(slug: string): Promise<JournalPost | null> {
  const posts = await getPublicJournalPosts();
  const lowerSlug = slug.toLowerCase();
  const found = posts.find(
    (p) =>
      (p.slug && p.slug.toLowerCase() === lowerSlug) ||
      p.id === slug ||
      (p.title && slugify(p.title) === lowerSlug)
  );

  return found || null;
}
