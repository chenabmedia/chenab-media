import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { hasPermission } from '@/lib/auth/permissions';
import { addInternalNote } from '@/lib/tickets/service';
import { recordAuditLog } from '@/lib/firebase/audit';

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
      (!hasPermission(auth.profile, 'tickets.manage') &&
        !hasPermission(auth.profile, 'tickets.reply'))
    ) {
      return NextResponse.json(
        { error: 'Unauthorized: tickets.manage or tickets.reply permission required' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const { noteText, attachments } = body;

    if (!noteText || typeof noteText !== 'string' || !noteText.trim()) {
      return NextResponse.json(
        { error: 'Note text cannot be empty' },
        { status: 400 }
      );
    }

    const note = await addInternalNote({
      ticketId: id,
      noteText: noteText.trim(),
      actorUid: auth.user.uid,
      actorName: auth.profile.displayName || auth.user.email,
      actorEmail: auth.user.email,
      attachments: Array.isArray(attachments) ? attachments : [],
    });

    await recordAuditLog({
      actorUid: auth.user.uid,
      actorName: auth.profile.displayName || auth.user.email,
      actorEmail: auth.user.email,
      action: 'TICKET_NOTE_ADDED',
      targetType: 'ticket',
      targetId: id,
      description: `Added internal note to ticket ${id}`,
      metadata: {
        noteId: note.id,
      },
    });

    return NextResponse.json({ success: true, note });
  } catch (error: any) {
    console.error('[API /admin/tickets/[id]/notes POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to add internal note', details: error?.message },
      { status: 500 }
    );
  }
}
