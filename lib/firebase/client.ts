import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import appletConfig from '@/firebase-applet-config.json';

/**
 * Centralized Next.js Firebase Client Initialization
 * 
 * Uses firebase-applet-config.json or Next.js NEXT_PUBLIC_ environment variables
 * for credentials with safe fallback to prevent module-level crashes during build or initial startup.
 */

const getFirebaseConfig = () => {
  const cfg = appletConfig as Record<string, string>;

  const apiKey =
    cfg.apiKey ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    'AIzaSyDemoPlaceholderKeyForChenabMediaApp';

  const authDomain =
    cfg.authDomain ||
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    'collective-serenity-56shk.firebaseapp.com';

  const projectId =
    cfg.projectId ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    'collective-serenity-56shk';

  const storageBucket =
    cfg.storageBucket ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    'collective-serenity-56shk.firebasestorage.app';

  const messagingSenderId =
    cfg.messagingSenderId ||
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    '1081053147389';

  const appId =
    cfg.appId ||
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    '1:1081053147389:web:42aaeb0414e0539490ce94';

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
