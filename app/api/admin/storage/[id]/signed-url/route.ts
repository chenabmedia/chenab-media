import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { getStorageFile } from '@/lib/storage/service';
import { createSignedDownloadUrl, isR2Configured } from '@/lib/storage/r2';
import { recordAuditLog } from '@/lib/firebase/audit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/storage/[id]/signed-url
 * 
 * Generates an on-demand temporary signed download URL for a file.
 * Requires: storage.view permission
 */
export async function POST(req: NextRequest, context: RouteContext) {
  const authRes = await verifyServerAuth(req, 'storage.view');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  if (!isR2Configured()) {
    return NextResponse.json(
      { error: 'Cloudflare R2 Storage is not configured on this server.' },
      { status: 503 }
    );
  }

  try {
    let expiresInSeconds = 3600;
    try {
      const body = await req.json();
      if (body.expiresInSeconds && typeof body.expiresInSeconds === 'number') {
        // Cap between 60 seconds and 24 hours
        expiresInSeconds = Math.max(60, Math.min(body.expiresInSeconds, 86400));
      }
    } catch {
      // Body is optional
    }

    const file = await getStorageFile(id, false);
    if (!file) {
      return NextResponse.json({ error: 'File record not found' }, { status: 404 });
    }

    const downloadUrl = await createSignedDownloadUrl(
      file.objectKey,
      expiresInSeconds,
      `attachment; filename="${file.filename}"`
    );

    // Audit log generation of signed access URL
    await recordAuditLog({
      actorUid: authRes.profile.uid,
      actorName: authRes.profile.displayName || authRes.profile.email.split('@')[0],
      actorEmail: authRes.profile.email,
      action: 'STORAGE_SIGNED_URL_GENERATED',
      targetType: 'storage_file',
      targetId: id,
      description: `Generated signed download URL for file: ${file.filename} (valid for ${expiresInSeconds}s)`,
      metadata: {
        objectKey: file.objectKey,
        expiresInSeconds,
      },
    });

    return NextResponse.json({
      success: true,
      downloadUrl,
      expiresInSeconds,
      filename: file.filename,
    });
  } catch (err: any) {
    console.error(`[API /api/admin/storage/${id}/signed-url] Error:`, err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate signed download URL' },
      { status: 500 }
    );
  }
}
