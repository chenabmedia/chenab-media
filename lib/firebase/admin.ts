import fs from 'fs';
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

function parseServiceAccountInput(rawInput: string | undefined): any {
  if (!rawInput || typeof rawInput !== 'string') return null;
  let str = rawInput.trim();
  if (!str) return null;

  // 1. Strip outer single or double quotes if whole string is wrapped
  if ((str.startsWith("'") && str.endsWith("'")) || (str.startsWith('"') && str.endsWith('"'))) {
    str = str.slice(1, -1).trim();
  }

  // 2. Direct JSON check
  if (str.startsWith('{')) {
    try {
      const parsed = JSON.parse(str);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      try {
        const unescaped = str.replace(/\\"/g, '"').replace(/\\\\n/g, '\\n');
        const parsed = JSON.parse(unescaped);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch {}
    }
  }

  // 3. File path check
  if (str.startsWith('/') || str.startsWith('./') || str.endsWith('.json')) {
    try {
      if (fs.existsSync(str)) {
        const fileContent = fs.readFileSync(str, 'utf-8');
        return parseServiceAccountInput(fileContent);
      }
    } catch {}
  }

  // 4. Base64 decode check
  try {
    const decoded = Buffer.from(str, 'base64').toString('utf-8').trim();
    if (decoded.startsWith('{')) {
      const parsed = JSON.parse(decoded);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {}

  // 5. Embedded substring JSON check
  const firstBrace = str.indexOf('{');
  const lastBrace = str.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const subStr = str.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(subStr);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {}
  }

  return null;
}

function getServiceAccountCredential() {
  const envCandidates = [
    process.env.FIREBASE_SERVICE_ACCOUNT,
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    process.env.FIREBASE_ADMIN_CREDENTIALS,
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    process.env.GCP_SERVICE_ACCOUNT,
    process.env.FIREBASE_ADMIN_SDK_CONFIG,
  ];

  for (const candidate of envCandidates) {
    const parsed = parseServiceAccountInput(candidate);
    if (parsed) {
      const pId = parsed.project_id || parsed.projectId || projectId;
      const clientEmail = parsed.client_email || parsed.clientEmail;
      let privateKey = parsed.private_key || parsed.privateKey;

      if (clientEmail && privateKey) {
        if (typeof privateKey === 'string') {
          privateKey = privateKey.replace(/\\n/g, '\n');
        }
        serviceAccountProjectId = pId;
        return cert({
          projectId: pId,
          clientEmail,
          privateKey,
        });
      }
    }
  }

  // Fallback: Check individual client email & private key env vars
  let clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL ||
    process.env.GCP_CLIENT_EMAIL ||
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

  let privateKey =
    process.env.FIREBASE_PRIVATE_KEY ||
    process.env.GCP_PRIVATE_KEY ||
    process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    clientEmail = clientEmail.trim();
    privateKey = privateKey.trim();

    if ((clientEmail.startsWith("'") && clientEmail.endsWith("'")) || (clientEmail.startsWith('"') && clientEmail.endsWith('"'))) {
      clientEmail = clientEmail.slice(1, -1).trim();
    }
    if ((privateKey.startsWith("'") && privateKey.endsWith("'")) || (privateKey.startsWith('"') && privateKey.endsWith('"'))) {
      privateKey = privateKey.slice(1, -1).trim();
    }

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
    if (credential) {
      adminAppInstance = initializeApp({ credential, projectId });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
      adminAppInstance = initializeApp({ projectId });
    } else {
      console.warn('[Firebase Admin] No service account credentials found in environment variables. Server fallback active.');
    }
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
    serviceAccountProjectId: serviceAccountProjectId || (process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'ADC configured' : 'None / Server Fallback Active'),
    firestoreDatabaseId: FIRESTORE_DATABASE_ID,
    adminAppName: currentApp?.name || 'none',
    isInitialized: getApps().length > 0,
  };
}
