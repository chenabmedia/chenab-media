import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { getAdminDb } from '@/lib/firebase/admin';
import { createTicket } from '@/lib/tickets/service';
import { Ticket, TicketStatus, TicketPriority, TicketCategory, TicketDepartment } from '@/types/tickets';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyServerAuth(req, 'tickets.view');
    if (!auth.authenticated || !auth.profile || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 403 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status') as TicketStatus | null;
    const priorityParam = searchParams.get('priority') as TicketPriority | null;
    const categoryParam = searchParams.get('category') as TicketCategory | null;
    const departmentParam = searchParams.get('department') as TicketDepartment | null;
    const assignedToParam = searchParams.get('assignedTo');
    const artistIdParam = searchParams.get('artistId');
    const searchQuery = searchParams.get('search')?.toLowerCase().trim();
    const limitNum = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    let query: FirebaseFirestore.Query = db.collection('tickets');

    if (statusParam && statusParam !== ('ALL' as any)) {
      query = query.where('status', '==', statusParam);
    }
    if (priorityParam) {
      query = query.where('priority', '==', priorityParam);
    }
    if (categoryParam) {
      query = query.where('category', '==', categoryParam);
    }
    if (departmentParam) {
      query = query.where('assignedDepartment', '==', departmentParam);
    }
    if (artistIdParam) {
      query = query.where('artistId', '==', artistIdParam);
    }

    query = query.orderBy('lastMessageAt', 'desc').limit(limitNum);

    const snapshot = await query.get();
    let tickets: Ticket[] = snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as Ticket[];

    // In-memory assignment filtering if needed
    if (assignedToParam) {
      if (assignedToParam === 'me') {
        tickets = tickets.filter((t) => t.assignedTo?.uid === auth.user?.uid);
      } else if (assignedToParam === 'unassigned') {
        tickets = tickets.filter((t) => !t.assignedTo);
      } else {
        tickets = tickets.filter((t) => t.assignedTo?.uid === assignedToParam);
      }
    }

    // In-memory search
    if (searchQuery) {
      tickets = tickets.filter((t) => {
        return (
          t.ticketNumber?.toLowerCase().includes(searchQuery) ||
          t.subject?.toLowerCase().includes(searchQuery) ||
          t.requesterEmail?.toLowerCase().includes(searchQuery) ||
          t.requesterName?.toLowerCase().includes(searchQuery) ||
          t.artistName?.toLowerCase().includes(searchQuery) ||
          t.lastSnippet?.toLowerCase().includes(searchQuery)
        );
      });
    }

    return NextResponse.json({ tickets });
  } catch (error: any) {
    console.error('[API /admin/tickets GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve tickets', details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyServerAuth(req, 'tickets.create');
    if (!auth.authenticated || !auth.profile || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const {
      subject,
      requesterEmail,
      requesterName,
      initialMessage,
      priority,
      category,
      department,
      sourceEmailIdentity,
      artistId,
    } = body;

    if (!subject?.trim() || !requesterEmail?.trim() || !initialMessage?.trim()) {
      return NextResponse.json(
        { error: 'Subject, requester email, and initial message are required.' },
        { status: 400 }
      );
    }

    const result = await createTicket({
      subject: subject.trim(),
      requesterEmail: requesterEmail.trim().toLowerCase(),
      requesterName: requesterName?.trim() || requesterEmail.split('@')[0],
      initialMessageText: initialMessage.trim(),
      priority: priority || 'NORMAL',
      category: category || 'GENERAL',
      assignedDepartment: department || null,
      sourceEmailIdentity: sourceEmailIdentity || 'contact@chenabmedia.in',
      artistId: artistId || null,
      direction: 'OUTBOUND',
      actorUid: auth.user.uid,
      actorName: auth.profile.displayName || auth.user.email,
      actorEmail: auth.user.email,
    });

    return NextResponse.json({ success: true, ticket: result.ticket, message: result.message }, { status: 201 });
  } catch (error: any) {
    console.error('[API /admin/tickets POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket', details: error?.message },
      { status: 500 }
    );
  }
}
