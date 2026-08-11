import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Server-side Firebase Admin Initialization
 * 
 * Used strictly in Next.js Server Components, Server Actions, and API Routes.
 * Never imported or exposed in client components.
 */

if (!getApps().length) {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'chenabmedia-in';
    initializeApp({
      projectId,
    });
  } catch (error) {
    console.error('Firebase Admin SDK initialization warning:', error);
  }
}

export const adminAuth = getApps().length ? getAuth() : null;
export const adminDb = getApps().length ? getFirestore() : null;
