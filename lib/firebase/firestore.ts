import { getFirestore, Firestore, collection, doc } from 'firebase/firestore';
import { firebaseApp } from './client';
import { auth } from './auth';

export const db: Firestore = getFirestore(firebaseApp);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

// Collection references
export const usersCollection = collection(db, 'users');
export const artistsCollection = collection(db, 'artists');
export const releasesCollection = collection(db, 'releases');
export const journalCollection = collection(db, 'journal');
export const contactSubmissionsCollection = collection(db, 'contactSubmissions');
export const demoSubmissionsCollection = collection(db, 'demoSubmissions');
export const notificationsCollection = collection(db, 'notifications');
export const auditLogsCollection = collection(db, 'auditLogs');

export function getUserDocRef(uid: string) {
  return doc(db, 'users', uid);
}
