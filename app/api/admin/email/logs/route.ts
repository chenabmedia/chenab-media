import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { EmailLog } from '@/types/site';

export async function GET(req: NextRequest) {
  try {
    const authRes = await verifyServerAuth(req);
    if (!authRes.authenticated || !authRes.profile) {
      return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const snapshot = await db.collection('emailLogs').orderBy('createdAt', 'desc').limit(100).get();
    const logs: EmailLog[] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as EmailLog));

    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch email logs' }, { status: 500 });
  }
}
