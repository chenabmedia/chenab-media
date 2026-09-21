import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { hasPermission } from '@/lib/auth/permissions';
import { getAdminDb } from '@/lib/firebase/admin';
import { recordAuditLog } from '@/lib/firebase/audit';
import { getTicketWithDetails, recordTicketEvent } from '@/lib/tickets/service';
import { Ticket, TicketStatus, TicketPriority, TicketCategory, TicketDepartment, TicketAssignee } from '@/types/tickets';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const auth = await verifyServerAuth(req, 'tickets.view');
    if (!auth.authenticated || !auth.profile || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 403 });
    }

    const { id } = await context.params;
    const details = await getTicketWithDetails(id);

    if (!details) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json(details);
  } catch (error: any) {
    console.error('[API /admin/tickets/[id] GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve ticket', details: error?.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const auth = await verifyServerAuth(req);
    if (!auth.authenticated || !auth.profile || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const ticketRef = db.collection('tickets').doc(id);
    const snap = await ticketRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const currentTicket = { ...snap.data(), id: snap.id } as Ticket;
    const body = await req.json();

    const updates: Partial<Ticket> = {
      updatedAt: new Date().toISOString(),
    };

    const actor = {
      uid: auth.user.uid,
      name: auth.profile.displayName || auth.user.email,
      email: auth.user.email,
    };

    // 1. Status Update
    if (body.status && body.status !== currentTicket.status) {
      const newStatus = body.status as TicketStatus;
      if (newStatus === 'CLOSED') {
        if (!hasPermission(auth.profile, 'tickets.close') && !hasPermission(auth.profile, 'tickets.manage')) {
          return NextResponse.json({ error: 'Permission denied: tickets.close required' }, { status: 403 });
        }
        updates.status = 'CLOSED';
        updates.closedAt = new Date().toISOString();
        updates.closedBy = { uid: actor.uid, name: actor.name, email: actor.email };
      } else {
        if (!hasPermission(auth.profile, 'tickets.manage')) {
          return NextResponse.json({ error: 'Permission denied: tickets.manage required' }, { status: 403 });
        }
        updates.status = newStatus;
        if (currentTicket.status === 'CLOSED') {
          updates.closedAt = null;
          updates.closedBy = null;
        }
      }

      await recordTicketEvent({
        ticketId: id,
        type: newStatus === 'CLOSED' ? 'TICKET_CLOSED' : currentTicket.status === 'CLOSED' ? 'REOPENED' : 'STATUS_CHANGED',
        actorUid: actor.uid,
        actorName: actor.name,
        actorEmail: actor.email,
        metadata: {
          previousStatus: currentTicket.status,
          newStatus,
        },
      });
    }

    // 2. Priority Update
    if (body.priority && body.priority !== currentTicket.priority) {
      if (!hasPermission(auth.profile, 'tickets.manage')) {
        return NextResponse.json({ error: 'Permission denied: tickets.manage required' }, { status: 403 });
      }
      updates.priority = body.priority as TicketPriority;
      await recordTicketEvent({
        ticketId: id,
        type: 'PRIORITY_CHANGED',
        actorUid: actor.uid,
        actorName: actor.name,
        actorEmail: actor.email,
        metadata: {
          previousPriority: currentTicket.priority,
          newPriority: body.priority,
        },
      });
    }

    // 3. Category Update
    if (body.category && body.category !== currentTicket.category) {
      if (!hasPermission(auth.profile, 'tickets.manage')) {
        return NextResponse.json({ error: 'Permission denied: tickets.manage required' }, { status: 403 });
      }
      updates.category = body.category as TicketCategory;
      await recordTicketEvent({
        ticketId: id,
        type: 'CATEGORY_CHANGED',
        actorUid: actor.uid,
        actorName: actor.name,
        actorEmail: actor.email,
        metadata: {
          previousCategory: currentTicket.category,
          newCategory: body.category,
        },
      });
    }

    // 4. Assignment Update (Staff or Department)
    if (body.assignedTo !== undefined) {
      if (!hasPermission(auth.profile, 'tickets.assign') && !hasPermission(auth.profile, 'tickets.manage')) {
        return NextResponse.json({ error: 'Permission denied: tickets.assign required' }, { status: 403 });
      }

      const newAssignee = body.assignedTo as TicketAssignee | null;
      updates.assignedTo = newAssignee;

      await recordTicketEvent({
        ticketId: id,
        type: newAssignee ? 'ASSIGNED' : 'UNASSIGNED',
        actorUid: actor.uid,
        actorName: actor.name,
        actorEmail: actor.email,
        metadata: {
          assignedTo: newAssignee,
        },
      });
    }

    if (body.assignedDepartment !== undefined) {
      if (!hasPermission(auth.profile, 'tickets.assign') && !hasPermission(auth.profile, 'tickets.manage')) {
        return NextResponse.json({ error: 'Permission denied: tickets.assign required' }, { status: 403 });
      }
      updates.assignedDepartment = (body.assignedDepartment as TicketDepartment) || null;
    }

    // 5. Artist Linking
    if (body.artistId !== undefined && body.artistId !== currentTicket.artistId) {
      if (!hasPermission(auth.profile, 'tickets.manage')) {
        return NextResponse.json({ error: 'Permission denied: tickets.manage required' }, { status: 403 });
      }
      updates.artistId = body.artistId || null;
      let linkedArtistName: string | null = null;
      if (body.artistId) {
        const artistDoc = await db.collection('artists').doc(body.artistId).get();
        if (artistDoc.exists) {
          linkedArtistName = artistDoc.data()?.name || null;
        }
      }
      updates.artistName = linkedArtistName;

      await recordTicketEvent({
        ticketId: id,
        type: body.artistId ? 'ARTIST_LINKED' : 'ARTIST_UNLINKED',
        actorUid: actor.uid,
        actorName: actor.name,
        actorEmail: actor.email,
        metadata: {
          artistId: body.artistId,
          artistName: linkedArtistName,
        },
      });
    }

    await ticketRef.update(updates);

    await recordAuditLog({
      actorUid: actor.uid,
      actorName: actor.name,
      actorEmail: actor.email,
      action: updates.status === 'CLOSED' ? 'TICKET_CLOSED' : 'TICKET_UPDATED',
      targetType: 'ticket',
      targetId: id,
      description: `Updated ticket ${currentTicket.ticketNumber}`,
      metadata: updates,
    });

    const refreshedTicket = { ...currentTicket, ...updates };
    return NextResponse.json({ success: true, ticket: refreshedTicket });
  } catch (error: any) {
    console.error('[API /admin/tickets/[id] PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket', details: error?.message },
      { status: 500 }
    );
  }
}
