import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import appletConfig from '@/firebase-applet-config.json';

/**
 * Server-side Firebase Admin Initialization
 * 
 * Used strictly in Next.js Server Components, Server Actions, and API Routes.
 * Never imported or exposed in client components.
 */

const cfg = appletConfig as Record<string, string>;
const projectId = cfg.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'collective-serenity-56shk';
const databaseId = cfg.firestoreDatabaseId || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID;

if (!getApps().length) {
  try {
    initializeApp({
      projectId,
    });
  } catch (error) {
    console.error('Firebase Admin SDK initialization warning:', error);
  }
}

export const adminAuth = getApps().length ? getAuth() : null;
export const adminDb = getApps().length
  ? (databaseId && databaseId !== '(default)' ? getFirestore(databaseId) : getFirestore())
  : null;
