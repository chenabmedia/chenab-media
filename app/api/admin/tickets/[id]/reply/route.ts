import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { sendTicketReply } from '@/lib/tickets/outbound';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const auth = await verifyServerAuth(req, 'tickets.reply');
    if (!auth.authenticated || !auth.profile || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized: tickets.reply permission required' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { senderIdentityId, bodyText, bodyHtml, cc, bcc, attachmentFileIds } = body;

    if (!senderIdentityId?.trim() || !bodyText?.trim()) {
      return NextResponse.json(
        { error: 'Sender identity and message body are required' },
        { status: 400 }
      );
    }

    const result = await sendTicketReply({
      ticketId: id,
      senderIdentityId: senderIdentityId.trim(),
      bodyText: bodyText.trim(),
      bodyHtml: bodyHtml?.trim(),
      cc: Array.isArray(cc) ? cc : [],
      bcc: Array.isArray(bcc) ? bcc : [],
      attachmentFileIds: Array.isArray(attachmentFileIds) ? attachmentFileIds : [],
      actor: {
        uid: auth.user.uid,
        email: auth.user.email,
        displayName: auth.profile.displayName || auth.user.email,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to dispatch email reply' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API /admin/tickets/[id]/reply POST] Error:', error);
    return NextResponse.json(
      { error: 'Internal error sending reply', details: error?.message },
      { status: 500 }
    );
  }
}
