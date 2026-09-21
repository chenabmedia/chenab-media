import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { getStorageFile, deleteStorageFile } from '@/lib/storage/service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/storage/[id]
 * 
 * Fetches file metadata record. Resolves public URL for PUBLIC files
 * or short-lived signed download URL for PRIVATE files.
 * Requires: storage.view permission
 */
export async function GET(req: NextRequest, context: RouteContext) {
  const authRes = await verifyServerAuth(req, 'storage.view');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const file = await getStorageFile(id, true);
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, file });
  } catch (err: any) {
    console.error(`[API /api/admin/storage/${id}] GET error:`, err);
    return NextResponse.json(
      { error: err.message || 'Failed to retrieve storage file' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/storage/[id]
 * 
 * Deletes object from Cloudflare R2 and removes record from Firestore.
 * Requires: storage.delete permission
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  const authRes = await verifyServerAuth(req, 'storage.delete');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const actor = {
      uid: authRes.profile.uid,
      email: authRes.profile.email,
      displayName: authRes.profile.displayName,
    };

    const deleted = await deleteStorageFile(id, actor);
    if (!deleted) {
      return NextResponse.json({ error: 'File not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'File permanently deleted.' });
  } catch (err: any) {
    console.error(`[API /api/admin/storage/${id}] DELETE error:`, err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete storage file' },
      { status: 500 }
    );
  }
}
