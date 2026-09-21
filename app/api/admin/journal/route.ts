import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { getAdminDb } from '@/lib/firebase/admin';
import { recordAuditLog } from '@/lib/firebase/audit';
import { JournalPost } from '@/types';
import { JOURNAL_POSTS } from '@/data/journal';
import { normalizeJournalPost, slugify } from '@/lib/firebase/serverCatalog';

export async function GET(req: NextRequest) {
  try {
    const authRes = await verifyServerAuth(req, 'journal.view');
    if (!authRes.authenticated || !authRes.profile) {
      return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
    }

    const postsList: JournalPost[] = [];
    const db = getAdminDb();

    if (db) {
      const snap = await db.collection('journal').get();
      snap.forEach((doc) => {
        postsList.push(normalizeJournalPost(doc.data(), doc.id));
      });
    }

    // If database has 0 items, fallback to static journal posts
    if (postsList.length === 0) {
      JOURNAL_POSTS.forEach((p) => {
        postsList.push(normalizeJournalPost(p, p.id));
      });
    } else {
      // Sort newest first
      postsList.sort((a, b) => new Date(b.date || b.publishedAt || '').getTime() - new Date(a.date || a.publishedAt || '').getTime());
    }

    return NextResponse.json({ posts: postsList }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching admin journal entries:', err);
    return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authRes = await verifyServerAuth(req, 'journal.create');
    if (!authRes.authenticated || !authRes.profile) {
      return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database instance not configured or unavailable' }, { status: 503 });
    }

    const body = await req.json();
    const {
      title,
      slug: rawSlug,
      category = 'FIELD NOTES',
      status = 'DRAFT',
      author = 'CHENAB Editorial',
      coverUrl,
      image,
      shortExcerpt,
      excerpt,
      content,
      readTime = '5 min read',
      tags = [],
      featured = false,
      date,
      publishedAt,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Article Title is required.' },
        { status: 400 }
      );
    }

    const finalSlug = slugify(rawSlug || title || `post-${Date.now()}`);
    const finalCover = coverUrl || image || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80';
    const finalExcerpt = shortExcerpt || excerpt || '';
    const nowIso = new Date().toISOString();
    const finalDate = date || publishedAt || nowIso.split('T')[0];

    // Check duplicate slug in Firestore
    const slugCheck = await db.collection('journal').where('slug', '==', finalSlug).get();
    if (!slugCheck.empty) {
      return NextResponse.json(
        { error: `An article with slug "${finalSlug}" already exists. Please customize the slug.` },
        { status: 400 }
      );
    }

    // Process content
    let contentArray: string[] = [];
    if (Array.isArray(content)) {
      contentArray = content;
    } else if (typeof content === 'string') {
      contentArray = content.split('\n\n').map(s => s.trim()).filter(Boolean);
    }

    const newPostDoc = {
      title: title.trim(),
      slug: finalSlug,
      category,
      status,
      author: author.trim(),
      coverUrl: finalCover,
      image: finalCover,
      shortExcerpt: finalExcerpt.trim(),
      excerpt: finalExcerpt.trim(),
      content: contentArray,
      readTime: typeof readTime === 'number' ? `${readTime} min read` : readTime,
      tags: Array.isArray(tags) ? tags : [],
      featured: Boolean(featured),
      date: finalDate,
      publishedAt: finalDate,
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: authRes.profile.email || authRes.profile.uid,
      updatedBy: authRes.profile.email || authRes.profile.uid,
    };

    const docRef = await db.collection('journal').add(newPostDoc);
    const createdPost = normalizeJournalPost({ ...newPostDoc, id: docRef.id }, docRef.id);

    // Audit logging
    await recordAuditLog({
      actor: {
        uid: authRes.profile.uid,
        name: authRes.profile.displayName || 'Admin',
        email: authRes.profile.email,
      },
      action: 'JOURNAL_CREATED',
      targetType: 'journal',
      targetId: docRef.id,
      description: `Created journal entry "${title}" (${finalSlug}) in status ${status}.`,
      metadata: { slug: finalSlug, category, status },
    });

    return NextResponse.json({ post: createdPost, id: docRef.id }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating journal post:', err);
    return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 });
  }
}
