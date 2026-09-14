import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { adminDb, getAdminDb } from '@/lib/firebase/admin';
import { recordAuditLog } from '@/lib/firebase/audit';
import { normalizeJournalPost, slugify } from '@/lib/firebase/serverCatalog';
import { JOURNAL_POSTS } from '@/data/journal';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authRes = await verifyServerAuth(req, 'journal.view');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const db = adminDb || getAdminDb();

    if (db) {
      const docSnap = await db.collection('journal').doc(id).get();
      if (docSnap.exists) {
        return NextResponse.json(
          { post: normalizeJournalPost(docSnap.data(), docSnap.id) },
          { status: 200 }
        );
      }
    }

    // Check static fallback
    const staticItem = JOURNAL_POSTS.find((p) => p.id === id || p.slug === id);
    if (staticItem) {
      return NextResponse.json(
        { post: normalizeJournalPost(staticItem, staticItem.id) },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });
  } catch (err: any) {
    console.error('Error fetching admin journal entry:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch journal entry' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authRes = await verifyServerAuth(req, 'journal.edit');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  const db = adminDb || getAdminDb();
  if (!db) {
    return NextResponse.json({ error: 'Database instance not configured' }, { status: 500 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const docRef = db.collection('journal').doc(id);
    const existingSnap = await docRef.get();

    let existingData: any = {};
    if (existingSnap.exists) {
      existingData = existingSnap.data() || {};
    } else {
      // If it was a static item being saved to Firestore for the first time
      const staticItem = JOURNAL_POSTS.find((p) => p.id === id || p.slug === id);
      if (staticItem) {
        existingData = { ...staticItem };
      }
    }

    const {
      title,
      slug: rawSlug,
      category,
      status,
      author,
      coverUrl,
      image,
      shortExcerpt,
      excerpt,
      content,
      readTime,
      tags,
      featured,
      date,
      publishedAt,
    } = body;

    const updatedTitle = title !== undefined ? title.trim() : (existingData.title || '');
    const updatedSlug = rawSlug !== undefined ? slugify(rawSlug) : (existingData.slug || slugify(updatedTitle));
    const updatedCover = coverUrl || image || existingData.coverUrl || existingData.image || '';
    const updatedExcerpt = shortExcerpt !== undefined ? shortExcerpt.trim() : (excerpt !== undefined ? excerpt.trim() : (existingData.shortExcerpt || existingData.excerpt || ''));
    const nowIso = new Date().toISOString();
    const updatedDate = date || publishedAt || existingData.date || existingData.publishedAt || nowIso.split('T')[0];

    // Check duplicate slug if slug changed
    if (updatedSlug && updatedSlug !== existingData.slug) {
      const slugCheck = await db.collection('journal').where('slug', '==', updatedSlug).get();
      const conflicts = slugCheck.docs.filter((d) => d.id !== id);
      if (conflicts.length > 0) {
        return NextResponse.json(
          { error: `An article with slug "${updatedSlug}" already exists.` },
          { status: 400 }
        );
      }
    }

    // Process content
    let contentArray: string[] = existingData.content || [];
    if (content !== undefined) {
      if (Array.isArray(content)) {
        contentArray = content;
      } else if (typeof content === 'string') {
        contentArray = content.split('\n\n').map((s) => s.trim()).filter(Boolean);
      }
    }

    const updatePayload: Record<string, any> = {
      title: updatedTitle,
      slug: updatedSlug,
      category: category !== undefined ? category : (existingData.category || 'FIELD NOTES'),
      status: status !== undefined ? status : (existingData.status || 'PUBLISHED'),
      author: author !== undefined ? author.trim() : (existingData.author || 'CHENAB Editorial'),
      coverUrl: updatedCover,
      image: updatedCover,
      shortExcerpt: updatedExcerpt,
      excerpt: updatedExcerpt,
      content: contentArray,
      readTime: readTime !== undefined ? (typeof readTime === 'number' ? `${readTime} min read` : readTime) : (existingData.readTime || '5 min read'),
      tags: tags !== undefined ? (Array.isArray(tags) ? tags : []) : (existingData.tags || []),
      featured: featured !== undefined ? Boolean(featured) : Boolean(existingData.featured),
      date: updatedDate,
      publishedAt: updatedDate,
      updatedAt: nowIso,
      updatedBy: authRes.profile.email || authRes.profile.uid,
    };

    if (!existingSnap.exists) {
      updatePayload.createdAt = existingData.createdAt || nowIso;
      updatePayload.createdBy = authRes.profile.email || authRes.profile.uid;
      await docRef.set(updatePayload);
    } else {
      await docRef.update(updatePayload);
    }

    const auditAction = status === 'PUBLISHED' ? 'JOURNAL_PUBLISHED' : 'JOURNAL_UPDATED';

    await recordAuditLog({
      actor: {
        uid: authRes.profile.uid,
        name: authRes.profile.displayName || 'Admin',
        email: authRes.profile.email,
      },
      action: auditAction,
      targetType: 'journal',
      targetId: id,
      description: `Updated journal entry "${updatedTitle}" (${updatedSlug}) - status: ${updatePayload.status}.`,
      metadata: { slug: updatedSlug, status: updatePayload.status },
    });

    const updatedDocSnap = await docRef.get();
    const finalPost = normalizeJournalPost(updatedDocSnap.data() || updatePayload, id);

    return NextResponse.json({ post: finalPost, message: 'Journal post updated successfully' }, { status: 200 });
  } catch (err: any) {
    console.error('Error updating journal post:', err);
    return NextResponse.json({ error: err.message || 'Failed to update journal entry' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authRes = await verifyServerAuth(req, 'journal.delete');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  const db = adminDb || getAdminDb();
  if (!db) {
    return NextResponse.json({ error: 'Database instance not configured' }, { status: 500 });
  }

  try {
    const { id } = await params;
    const docRef = db.collection('journal').doc(id);
    const snap = await docRef.get();

    const title = snap.exists ? snap.data()?.title || id : id;

    if (snap.exists) {
      await docRef.delete();
    }

    await recordAuditLog({
      actor: {
        uid: authRes.profile.uid,
        name: authRes.profile.displayName || 'Admin',
        email: authRes.profile.email,
      },
      action: 'JOURNAL_DELETED',
      targetType: 'journal',
      targetId: id,
      description: `Deleted journal entry "${title}" (${id}).`,
      metadata: { deletedId: id },
    });

    return NextResponse.json({ success: true, message: `Journal entry "${title}" deleted.` }, { status: 200 });
  } catch (err: any) {
    console.error('Error deleting journal post:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete journal entry' }, { status: 500 });
  }
}
