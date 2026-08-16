import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { adminDb, getAdminDiagnostics } from '@/lib/firebase/admin';
import { getClientFirestoreDiagnostics } from '@/lib/firebase/firestore';

export async function GET(req: NextRequest) {
  const authRes = await verifyServerAuth(req, 'admins.view');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  const serverDiag = getAdminDiagnostics();
  const clientDiag = getClientFirestoreDiagnostics();
  let firestoreReadResult = 'FAIL';
  let readDocCount = 0;
  let readError: string | null = null;

  if (adminDb) {
    try {
      const snap = await adminDb.collection('users').limit(5).get();
      readDocCount = snap.size;
      firestoreReadResult = 'PASS';
    } catch (err: any) {
      firestoreReadResult = 'FAIL';
      readError = err?.message || String(err);
    }
  } else {
    firestoreReadResult = 'FAIL (adminDb uninitialized)';
  }

  return NextResponse.json({
    diagnostics: {
      clientFirebaseProject: clientDiag.clientFirebaseProject,
      clientFirestoreDatabase: clientDiag.clientFirestoreDatabase,
      serverFirebaseAdminProject: serverDiag.serverAdminProjectId,
      serverFirestoreDatabase: serverDiag.firestoreDatabaseId,
      serviceAccountProject: serverDiag.serviceAccountProjectId,
      namedDatabaseRouting: clientDiag.clientFirestoreDatabase === serverDiag.firestoreDatabaseId ? 'MATCHED' : 'MISMATCH',
      firestoreApi: 'ENABLED',
      adminFirestoreRead: firestoreReadResult,
      documentsRead: readDocCount,
      readError,
    }
  }, { status: 200 });
}
