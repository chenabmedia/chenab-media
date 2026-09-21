import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { hasPermission } from '@/lib/auth/permissions';
import { uploadDirectBuffer } from '@/lib/storage/service';
import { isR2Configured } from '@/lib/storage/r2';
import { FORBIDDEN_EXTENSIONS } from '@/lib/storage/config';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const auth = await verifyServerAuth(req);
    if (
      !auth.authenticated ||
      !auth.profile ||
      !auth.user ||
      (!hasPermission(auth.profile, 'tickets.reply') &&
        !hasPermission(auth.profile, 'tickets.manage') &&
        !hasPermission(auth.profile, 'storage.upload'))
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await context.params;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const filename = file.name || 'attachment.dat';
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    if (FORBIDDEN_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `Executable or script extension .${ext} is forbidden.` },
        { status: 400 }
      );
    }

    // Limit size to 25 MB
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Attachment exceeds the 25 MB size limit.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const record = await uploadDirectBuffer({
      buffer,
      filename,
      mimeType: file.type || 'application/octet-stream',
      category: 'tickets',
      visibility: 'PRIVATE',
      ownerType: 'ticket',
      ownerId: id,
      description: `Staff attachment on ticket ${id}`,
      uploader: {
        uid: auth.user.uid,
        email: auth.user.email,
        displayName: auth.profile.displayName || auth.user.email,
      },
    });

    return NextResponse.json({
      success: true,
      attachment: {
        id: record.id,
        storageFileId: record.id,
        filename: record.filename,
        mimeType: record.mimeType,
        size: record.size,
        category: 'tickets',
        downloadUrl: record.downloadUrl || null,
      },
    });
  } catch (error: any) {
    console.error('[API /admin/tickets/[id]/attachments POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to upload ticket attachment', details: error?.message },
      { status: 500 }
    );
  }
}
