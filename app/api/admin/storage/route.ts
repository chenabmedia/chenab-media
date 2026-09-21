import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import {
  listStorageFiles,
  StorageValidationError,
} from '@/lib/storage/service';
import { isR2Configured } from '@/lib/storage/r2';
import { StorageCategory, StorageVisibility } from '@/types/storage';

/**
 * GET /api/admin/storage
 * 
 * Lists storage file records from Firestore with optional filtering.
 * Requires: storage.view permission
 */
export async function GET(req: NextRequest) {
  const authRes = await verifyServerAuth(req, 'storage.view');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') as StorageCategory | null;
    const visibility = searchParams.get('visibility') as StorageVisibility | null;
    const search = searchParams.get('search') || undefined;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    const files = await listStorageFiles({
      category: category || undefined,
      visibility: visibility || undefined,
      search,
      limit,
    });

    return NextResponse.json({
      success: true,
      files,
      r2Configured: isR2Configured(),
      total: files.length,
    });
  } catch (err: any) {
    console.error('[API /api/admin/storage] GET error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to list storage files' },
      { status: 500 }
    );
  }
}
