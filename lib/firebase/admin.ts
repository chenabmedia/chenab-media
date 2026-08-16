import { initializeApp, getApps, cert, getApp, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import appletConfig from '@/firebase-applet-config.json';

/**
 * Server-side Firebase Admin Initialization
 * 
 * Used strictly in Next.js Server Components, Server Actions, and API Routes.
 * Never imported or exposed in client components.
 */

const cfg = appletConfig as Record<string, string>;
const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  cfg.projectId ||
  'chenabmedia-in';

export const FIRESTORE_DATABASE_ID =
  cfg.firestoreDatabaseId ||
  process.env.FIREBASE_DATABASE_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID ||
  '(default)';

let serviceAccountProjectId: string | null = null;

function getServiceAccountCredential() {
  const rawServiceAccount =
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_ADMIN_CREDENTIALS ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (rawServiceAccount) {
    try {
      let parsed: any;
      if (rawServiceAccount.trim().startsWith('{')) {
        parsed = JSON.parse(rawServiceAccount);
      } else {
        // Handle base64 encoded JSON
        const decoded = Buffer.from(rawServiceAccount, 'base64').toString('utf-8');
        parsed = JSON.parse(decoded);
      }
      if (parsed && typeof parsed === 'object' && parsed.project_id) {
        serviceAccountProjectId = parsed.project_id;
        return cert(parsed);
      }
    } catch (e) {
      console.warn('Could not parse service account JSON from environment:', e);
    }
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (clientEmail && privateKey) {
    try {
      const formattedKey = privateKey.replace(/\\n/g, '\n');
      serviceAccountProjectId = projectId;
      return cert({
        projectId,
        clientEmail,
        privateKey: formattedKey,
      });
    } catch (e) {
      console.warn('Could not initialize cert with clientEmail/privateKey:', e);
    }
  }

  return undefined;
}

let adminAppInstance: App | null = null;

if (!getApps().length) {
  try {
    const credential = getServiceAccountCredential();
    adminAppInstance = initializeApp(
      credential
        ? { credential, projectId }
        : { projectId }
    );
  } catch (error) {
    console.error('Firebase Admin SDK initialization warning:', error);
  }
} else {
  adminAppInstance = getApp();
}

export const adminApp = adminAppInstance;

export const adminAuth: Auth | null = getApps().length ? getAuth() : null;

export const adminDb: Firestore | null = (() => {
  if (!getApps().length) return null;
  try {
    const app = getApp();
    return getFirestore(app);
  } catch (err) {
    try {
      return getFirestore();
    } catch {
      return null;
    }
  }
})();

export interface FirebaseRuntimeDiagnostics {
  clientFirebaseProjectId: string;
  serverAdminProjectId: string;
  serviceAccountProjectId: string;
  firestoreDatabaseId: string;
  adminAppName: string;
  isInitialized: boolean;
}

export function getAdminDiagnostics(): FirebaseRuntimeDiagnostics {
  const currentApp = getApps().length ? getApp() : null;
  return {
    clientFirebaseProjectId: cfg.projectId || 'chenabmedia-in',
    serverAdminProjectId: currentApp?.options?.projectId || projectId || 'chenabmedia-in',
    serviceAccountProjectId: serviceAccountProjectId || (process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'ADC configured' : 'None / Using Project ID'),
    firestoreDatabaseId: FIRESTORE_DATABASE_ID,
    adminAppName: currentApp?.name || 'none',
    isInitialized: getApps().length > 0,
  };
}
