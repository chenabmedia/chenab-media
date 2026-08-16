import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/firestore';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { EmailLog } from '@/types/site';

export async function GET(req: NextRequest) {
  try {
    const authRes = await verifyServerAuth(req);
    if (!authRes.authenticated || !authRes.profile) {
      return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
    }

    let logs: EmailLog[] = [];
    if (adminDb) {
      const snapshot = await adminDb.collection('emailLogs').orderBy('createdAt', 'desc').limit(100).get();
      logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmailLog));
    } else if (db) {
      const q = query(collection(db, 'emailLogs'), orderBy('createdAt', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmailLog));
    }

    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch email logs' }, { status: 500 });
  }
}
