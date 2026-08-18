import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { adminDb, getAdminDb } from '@/lib/firebase/admin';
import { AuditLogEntry } from '@/types/admin';

export async function GET(req: NextRequest) {
  const authRes = await verifyServerAuth(req, 'audit.view');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  try {
    const logs: AuditLogEntry[] = [];
    const db = adminDb || getAdminDb();

    if (db) {
      const snap = await db
        .collection('auditLogs')
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();

      snap.forEach((doc) => {
        logs.push({ ...doc.data(), id: doc.id } as AuditLogEntry);
      });
    }

    return NextResponse.json({ logs }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching audit logs:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch audit logs' }, { status: 500 });
  }
}
