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
  process.env.FIREBASE_CREDENTIALS,
  process.env.FIREBASE_CONFIG,
  process.env.FIREBASE_KEY,
  process.env.SERVICE_ACCOUNT_KEY,
  process.env.SERVICE_ACCOUNT_JSON,
  process.env.GCP_SA_KEY,
  process.env.GCP_SERVICE_ACCOUNT_KEY,
  process.env.GOOGLE_CREDENTIALS,
  process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
  process.env.FIREBASE_ADMIN_KEY,
  process.env.GCP_CREDENTIALS,
  process.env.RAILWAY_FIREBASE_SERVICE_ACCOUNT,
];

const serviceAccountCandidatePresent = envCandidatesList.some(c => Boolean(c && c.trim()));
const clientEmailPresent = Boolean(
  process.env.FIREBASE_CLIENT_EMAIL ||
  process.env.GCP_CLIENT_EMAIL ||
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
  process.env.CLIENT_EMAIL ||
  process.env.SA_CLIENT_EMAIL
);
const privateKeyPresent = Boolean(
  process.env.FIREBASE_PRIVATE_KEY ||
  process.env.GCP_PRIVATE_KEY ||
  process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
  process.env.PRIVATE_KEY ||
  process.env.SA_PRIVATE_KEY
);

function sanitizeRawJsonNewlines(str: string): string {
  let sanitized = '';
  let inString = false;
  let isEscaped = false;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"' && !isEscaped) {
      inString = !inString;
      sanitized += char;
    } else if (inString && (char === '\n' || char === '\r')) {
      if (char === '\r' && str[i + 1] === '\n') {
        i++;
      }
      sanitized += '\\n';
    } else {
      sanitized += char;
    }
    if (char === '\\' && !isEscaped) {
      isEscaped = true;
    } else {
      isEscaped = false;
    }
  }
  return sanitized;
}

function extractViaRegex(str: string): any {
  const clientEmailMatch = str.match(/"client_email"\s*:\s*"([^"]+)"/) || str.match(/"clientEmail"\s*:\s*"([^"]+)"/);
  const projectIdMatch = str.match(/"project_id"\s*:\s*"([^"]+)"/) || str.match(/"projectId"\s*:\s*"([^"]+)"/);
  const privateKeyMatch = str.match(/"private_key"\s*:\s*"([\s\S]*?)"(?=\s*[,}])/) || str.match(/"privateKey"\s*:\s*"([\s\S]*?)"(?=\s*[,}])/);

  if (clientEmailMatch && privateKeyMatch) {
    return {
      project_id: projectIdMatch ? projectIdMatch[1] : projectId,
      client_email: clientEmailMatch[1],
      private_key: privateKeyMatch[1],
    };
  }
  return null;
}

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

  // 1. File path check
  if (!str.includes('\n') && str.length < 500 && (str.startsWith('/') || str.startsWith('./') || str.endsWith('.json') || fs.existsSync(str))) {
    try {
      if (fs.existsSync(str)) {
        const fileContent = fs.readFileSync(str, 'utf-8');
        const parsedFile = parseServiceAccountInput(fileContent);
        if (parsedFile) return parsedFile;
      }
    } catch {}
  }

  // 2. Base64 decode check
  try {
    const decoded = Buffer.from(str, 'base64').toString('utf-8').trim().replace(/^\uFEFF/, '');
    if (decoded.includes('{') || decoded.includes('private_key')) {
      const recursiveParsed = parseServiceAccountInput(decoded);
      if (recursiveParsed) return recursiveParsed;
    }
  } catch {}

  // 3. Direct JSON check
  if (str.includes('{')) {
    try {
      const parsed = JSON.parse(str);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {}

    try {
      const sanitized = sanitizeRawJsonNewlines(str);
      const parsed = JSON.parse(sanitized);
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
  }

  // 4. Embedded JSON substring check
  const firstBrace = str.indexOf('{');
  const lastBrace = str.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const subStr = str.substring(firstBrace, lastBrace + 1);
    try {
      const parsed = JSON.parse(subStr);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {}
    try {
      const sanitized = sanitizeRawJsonNewlines(subStr);
      const parsed = JSON.parse(sanitized);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {}
    try {
      const unescapedSub = subStr.replace(/\\"/g, '"').replace(/\\\\n/g, '\\n');
      const parsed = JSON.parse(unescapedSub);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {}
  }

  // 5. Regex extraction fallback
  const regexResult = extractViaRegex(str);
  if (regexResult) return regexResult;

  return null;
}

function getServiceAccountCredential() {
  for (const candidate of envCandidatesList) {
    if (!candidate || !candidate.trim()) continue;
    const parsed = parseServiceAccountInput(candidate);
    if (parsed) {
      const pId = parsed.project_id || parsed.projectId || projectId;
      let clientEmail = parsed.client_email || parsed.clientEmail || parsed.client_email_address;
      let privateKey = parsed.private_key || parsed.privateKey;

      if (clientEmail && privateKey) {
        if (typeof clientEmail === 'string') {
          clientEmail = clientEmail.trim().replace(/^["']|["']$/g, '');
        }
        if (typeof privateKey === 'string') {
          privateKey = privateKey
            .trim()
            .replace(/^["']|["']$/g, '')
            .replace(/\\n/g, '\n')
            .replace(/\r/g, '');
        }
        try {
          const credential = cert({
            projectId: pId,
            clientEmail,
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
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
    process.env.CLIENT_EMAIL ||
    process.env.SA_CLIENT_EMAIL;

  let privateKey =
    process.env.FIREBASE_PRIVATE_KEY ||
    process.env.GCP_PRIVATE_KEY ||
    process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
    process.env.PRIVATE_KEY ||
    process.env.SA_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    clientEmail = clientEmail.trim().replace(/^["']|["']$/g, '');
    privateKey = privateKey.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n').replace(/\r/g, '');

    try {
      const credential = cert({
        projectId,
        clientEmail,
        privateKey,
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

function initAdminApp(): App | null {
  if (getApps().length > 0) {
    adminAppInstance = getApp();
    return adminAppInstance;
  }

  try {
    const credential = getServiceAccountCredential();
    if (credential) {
      adminAppInstance = initializeApp({ credential, projectId });
      return adminAppInstance;
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
      adminAppInstance = initializeApp({ projectId });
      return adminAppInstance;
    } else {
      console.warn('[Firebase Admin] No service account credentials found in environment variables.');
    }
  } catch (error) {
    console.error('[Firebase Admin] SDK initialization error:', error);
  }
  return null;
}

initAdminApp();

console.log('[Firebase Admin Diagnostics]', {
  serviceAccountCandidatePresent,
  clientEmailPresent,
  privateKeyPresent,
  credentialParseSuccess,
  projectId,
  adminInitialized: getApps().length > 0,
});

export const adminApp = adminAppInstance;

export function getAdminAuth(): Auth | null {
  const app = getApps().length ? getApp() : initAdminApp();
  return app ? getAuth(app) : null;
}

export const adminAuth: Auth | null = getApps().length ? getAuth(getApp()) : null;

export function getAdminDb(): Firestore | null {
  const app = getApps().length ? getApp() : initAdminApp();
  if (!app) return null;
  try {
    return getFirestore(app);
  } catch (err) {
    console.error('[Firebase Admin] getFirestore error:', err);
    return null;
  }
}

export const adminDb: Firestore | null = getAdminDb();

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

