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

export const projectId = 'chenabmedia-in';
export const FIRESTORE_DATABASE_ID = '(default)';

let serviceAccountProjectId: string | null = null;
let credentialParseSuccess = false;

const envCandidatesList = [
  process.env.FIREBASE_SERVICE_ACCOUNT,
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  process.env.FIREBASE_ADMIN_CREDENTIALS,
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
  process.env.GOOGLE_APPLICATION_CREDENTIALS,
  process.env.GCP_SERVICE_ACCOUNT,
  process.env.FIREBASE_ADMIN_SDK_CONFIG,
];

const serviceAccountCandidatePresent = envCandidatesList.some(c => Boolean(c && c.trim()));
const clientEmailPresent = Boolean(
  process.env.FIREBASE_CLIENT_EMAIL ||
  process.env.GCP_CLIENT_EMAIL ||
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL
);
const privateKeyPresent = Boolean(
  process.env.FIREBASE_PRIVATE_KEY ||
  process.env.GCP_PRIVATE_KEY ||
  process.env.FIREBASE_ADMIN_PRIVATE_KEY
);

function parseServiceAccountInput(rawInput: string | undefined): any {
  if (!rawInput || typeof rawInput !== 'string') return null;
  let str = rawInput.trim().replace(/^\uFEFF/, '');
  if (!str) return null;

  // Strip outer quotes repeatedly
  while (
    (str.startsWith("'") && str.endsWith("'")) ||
    (str.startsWith('"') && str.endsWith('"')) ||
    (str.startsWith('`') && str.endsWith('`'))
  ) {
    str = str.slice(1, -1).trim().replace(/^\uFEFF/, '');
  }

  // 1. Direct JSON check
  if (str.startsWith('{') || str.endsWith('}')) {
    try {
      const parsed = JSON.parse(str);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {}

    try {
      const unescaped = str
        .replace(/\\"/g, '"')
        .replace(/\\\\n/g, '\\n')
        .replace(/\\n/g, '\n');
      const parsed = JSON.parse(unescaped);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {}

    try {
      const sanitized = str.replace(/\r\n/g, '\\n').replace(/\n/g, '\\n');
      const parsed = JSON.parse(sanitized);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {}
  }

  // 2. Base64 decode check
  try {
    const decoded = Buffer.from(str, 'base64').toString('utf-8').trim().replace(/^\uFEFF/, '');
    if (decoded.includes('{')) {
      const recursiveParsed = parseServiceAccountInput(decoded);
      if (recursiveParsed) return recursiveParsed;
    }
  } catch {}

  // 3. Embedded JSON substring check
  const firstBrace = str.indexOf('{');
  const lastBrace = str.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const subStr = str.substring(firstBrace, lastBrace + 1);
    try {
      const parsed = JSON.parse(subStr);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {}
    try {
      const unescapedSub = subStr.replace(/\\"/g, '"').replace(/\\\\n/g, '\\n');
      const parsed = JSON.parse(unescapedSub);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {}
  }

  // 4. File path check
  if (str.startsWith('/') || str.startsWith('./') || str.endsWith('.json')) {
    try {
      if (fs.existsSync(str)) {
        const fileContent = fs.readFileSync(str, 'utf-8');
        return parseServiceAccountInput(fileContent);
      }
    } catch {}
  }

  return null;
}

function getServiceAccountCredential() {
  for (const candidate of envCandidatesList) {
    if (!candidate || !candidate.trim()) continue;
    const parsed = parseServiceAccountInput(candidate);
    if (parsed) {
      const pId = parsed.project_id || parsed.projectId || projectId;
      const clientEmail = parsed.client_email || parsed.clientEmail || parsed.client_email_address;
      let privateKey = parsed.private_key || parsed.privateKey;

      if (clientEmail && privateKey) {
        if (typeof privateKey === 'string') {
          privateKey = privateKey.replace(/\\n/g, '\n').replace(/\r/g, '');
        }
        try {
          const credential = cert({
            projectId: pId,
            clientEmail: clientEmail.trim(),
            privateKey,
          });
          serviceAccountProjectId = pId;
          credentialParseSuccess = true;
          return credential;
        } catch (e) {
          console.warn('[Firebase Admin] cert creation error from JSON candidate:', e);
        }
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

    while (
      (clientEmail.startsWith("'") && clientEmail.endsWith("'")) ||
      (clientEmail.startsWith('"') && clientEmail.endsWith('"'))
    ) {
      clientEmail = clientEmail.slice(1, -1).trim();
    }
    while (
      (privateKey.startsWith("'") && privateKey.endsWith("'")) ||
      (privateKey.startsWith('"') && privateKey.endsWith('"'))
    ) {
      privateKey = privateKey.slice(1, -1).trim();
    }

    try {
      const formattedKey = privateKey.replace(/\\n/g, '\n').replace(/\r/g, '');
      const credential = cert({
        projectId,
        clientEmail,
        privateKey: formattedKey,
      });
      serviceAccountProjectId = projectId;
      credentialParseSuccess = true;
      return credential;
    } catch (e) {
      console.warn('[Firebase Admin] cert creation error from split env vars:', e);
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
    }
  } catch (error) {
    console.error('[Firebase Admin] SDK initialization error:', error);
  }
} else {
  adminAppInstance = getApp();
}

console.log('[Firebase Admin Diagnostics]', {
  serviceAccountCandidatePresent,
  clientEmailPresent,
  privateKeyPresent,
  credentialParseSuccess,
  projectId,
  adminInitialized: getApps().length > 0,
});

export const adminApp = adminAppInstance;

export const adminAuth: Auth | null = getApps().length ? getAuth(getApp()) : null;

export const adminDb: Firestore | null = (() => {
  if (!getApps().length) return null;
  try {
    const app = getApp();
    return getFirestore(app);
  } catch (err) {
    console.error('[Firebase Admin] getFirestore error:', err);
    return null;
  }
})();

export interface FirebaseRuntimeDiagnostics {
  clientFirebaseProjectId: string;
  serverAdminProjectId: string;
  serviceAccountProjectId: string;
  firestoreDatabaseId: string;
  adminAppName: string;
  isInitialized: boolean;
  serviceAccountCandidatePresent: boolean;
  clientEmailPresent: boolean;
  privateKeyPresent: boolean;
  credentialParseSuccess: boolean;
}

export function getAdminDiagnostics(): FirebaseRuntimeDiagnostics {
  const currentApp = getApps().length ? getApp() : null;
  return {
    clientFirebaseProjectId: projectId,
    serverAdminProjectId: currentApp?.options?.projectId || projectId,
    serviceAccountProjectId: serviceAccountProjectId || (credentialParseSuccess ? 'parsed' : 'none'),
    firestoreDatabaseId: FIRESTORE_DATABASE_ID,
    adminAppName: currentApp?.name || 'none',
    isInitialized: getApps().length > 0,
    serviceAccountCandidatePresent,
    clientEmailPresent,
    privateKeyPresent,
    credentialParseSuccess,
  };
}

