import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import {
  prepareDirectUpload,
  finalizeFileRecord,
  uploadServerFile,
  StorageValidationError,
} from '@/lib/storage/service';
import { StorageCategory, StorageOwnerType, StorageVisibility } from '@/types/storage';

/**
 * POST /api/admin/storage/upload
 * 
 * Supports:
 * 1. multipart/form-data: Direct server-mediated upload
 * 2. application/json (mode: 'request_signed_url'): Generates pre-signed URL for direct browser-to-R2 upload
 * 3. application/json (mode: 'finalize_direct_upload'): Commits metadata after direct browser upload
 * 
 * Requires: storage.upload permission
 */
export async function POST(req: NextRequest) {
  const authRes = await verifyServerAuth(req, 'storage.upload');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  const uploader = {
    uid: authRes.profile.uid,
    email: authRes.profile.email,
    displayName: authRes.profile.displayName,
  };

  const contentType = req.headers.get('content-type') || '';

  try {
    // 1. JSON Request Handling (Signed upload URL or finalize)
    if (contentType.includes('application/json')) {
      const body = await req.json();

      if (body.mode === 'request_signed_url') {
        const {
          filename,
          mimeType,
          size,
          category,
          visibility,
          ownerType,
          ownerId,
          description,
          tags,
          subType,
        } = body;

        const result = await prepareDirectUpload(
          {
            filename,
            mimeType,
            size: Number(size),
            category: category as StorageCategory,
            visibility: (visibility || 'PUBLIC') as StorageVisibility,
            ownerType: ownerType as StorageOwnerType | undefined,
            ownerId,
            description,
            tags,
            subType,
          },
          uploader
        );

        return NextResponse.json({ success: true, ...result });
      }

      if (body.mode === 'finalize_direct_upload') {
        const { record } = body;
        if (!record || !record.id || !record.objectKey) {
          return NextResponse.json(
            { error: 'Invalid draft record provided for finalization.' },
            { status: 400 }
          );
        }

        // Enforce authentic server uploader
        record.uploadedBy = uploader;

        const finalized = await finalizeFileRecord(record);
        return NextResponse.json({ success: true, file: finalized });
      }

      return NextResponse.json(
        { error: 'Unrecognized JSON mode. Expected "request_signed_url" or "finalize_direct_upload".' },
        { status: 400 }
      );
    }

    // 2. Multipart Form Upload Handling
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file provided in form data.' }, { status: 400 });
      }

      const filename = (formData.get('filename') as string) || file.name;
      const category = ((formData.get('category') as string) || 'other') as StorageCategory;
      const visibility = ((formData.get('visibility') as string) || 'PUBLIC') as StorageVisibility;
      const ownerType = (formData.get('ownerType') as StorageOwnerType) || undefined;
      const ownerId = (formData.get('ownerId') as string) || undefined;
      const subType = (formData.get('subType') as string) || undefined;
      const description = (formData.get('description') as string) || undefined;
      const tagsRaw = formData.get('tags') as string;
      const tags = tagsRaw
        ? tagsRaw
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const record = await uploadServerFile({
        buffer,
        filename,
        mimeType: file.type || 'application/octet-stream',
        category,
        visibility,
        ownerType,
        ownerId,
        subType,
        description,
        tags,
        uploader,
      });

      return NextResponse.json({ success: true, file: record }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Unsupported Content-Type. Use multipart/form-data or application/json.' },
      { status: 415 }
    );
  } catch (err: any) {
    if (err instanceof StorageValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[API /api/admin/storage/upload] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process file upload' },
      { status: 500 }
    );
  }
}
