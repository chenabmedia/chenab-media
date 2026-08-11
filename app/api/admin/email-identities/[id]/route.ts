import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/firestore';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { recordAuditLog } from '@/lib/firebase/audit';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authRes = await verifyServerAuth(req, 'email.identities.manage');
    if (!authRes.authenticated || !authRes.profile) {
      return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 403 });
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

    if (adminDb) {
      await adminDb.collection('emailIdentities').doc(id).update(updates);
    } else if (db) {
      await updateDoc(doc(db, 'emailIdentities', id), updates);
    }

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

    const { id } = await params;

    if (adminDb) {
      await adminDb.collection('emailIdentities').doc(id).delete();
    } else if (db) {
      await deleteDoc(doc(db, 'emailIdentities', id));
    }

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
