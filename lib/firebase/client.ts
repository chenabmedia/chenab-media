import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';

/**
 * Centralized Next.js Firebase Client Initialization
 * 
 * Uses Next.js NEXT_PUBLIC_ environment variables for credentials with safe fallback
 * to prevent module-level crashes during build or initial startup.
 */

const getFirebaseConfig = () => {
  const apiKey =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    'AIzaSyDemoPlaceholderKeyForChenabMediaApp';

  const authDomain =
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    'chenabmedia-in.firebaseapp.com';

  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    'chenabmedia-in';

  const storageBucket =
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    'chenabmedia-in.appspot.com';

  const messagingSenderId =
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    '1234567890';

  const appId =
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    '1:1234567890:web:chenabmediaapp';

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
};

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  const config = getFirebaseConfig();
  return initializeApp(config);
}

export const firebaseApp = getFirebaseApp();
