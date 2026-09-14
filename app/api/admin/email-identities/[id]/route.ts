import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { recordAuditLog } from '@/lib/firebase/audit';
import { EmailIdentity } from '@/types/site';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authRes = await verifyServerAuth(req);
    if (!authRes.authenticated || !authRes.profile) {
      return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    const { id } = await params;
    let identity: EmailIdentity | null = null;

    const snap = await adminDb.collection('emailIdentities').doc(id).get();
    if (snap.exists) {
      identity = { ...snap.data(), id: snap.id } as EmailIdentity;
    }

    if (!identity) {
      return NextResponse.json({ error: 'Email identity not found' }, { status: 404 });
    }

    return NextResponse.json({ identity });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch email identity' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authRes = await verifyServerAuth(req, 'email.identities.manage');
    if (!authRes.authenticated || !authRes.profile) {
      return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 403 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    const { id } = await params;
    const body = await req.json();
    const { displayName, replyTo, description, enabled } = body;

    const updates = {
      ...(displayName !== undefined && { displayName }),
      ...(replyTo !== undefined && { replyTo }),
      ...(description !== undefined && { description }),
      ...(enabled !== undefined && { enabled }),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection('emailIdentities').doc(id).update(updates);

    await recordAuditLog({
      actorUid: authRes.profile.uid,
      actorName: authRes.profile.displayName || authRes.profile.email.split('@')[0],
      actorEmail: authRes.profile.email,
      action: 'EMAIL_IDENTITY_UPDATED',
      targetType: 'system',
      targetId: id,
      description: `Updated email identity ${id}`,
      metadata: updates,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update email identity' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authRes = await verifyServerAuth(req, 'email.identities.manage');
    if (!authRes.authenticated || !authRes.profile) {
      return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 403 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    const { id } = await params;

    await adminDb.collection('emailIdentities').doc(id).delete();

    await recordAuditLog({
      actorUid: authRes.profile.uid,
      actorName: authRes.profile.displayName || authRes.profile.email.split('@')[0],
      actorEmail: authRes.profile.email,
      action: 'EMAIL_IDENTITY_DISABLED',
      targetType: 'system',
      targetId: id,
      description: `Deleted/disabled email identity ${id}`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete email identity' }, { status: 500 });
  }
}
