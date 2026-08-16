import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import appletConfig from '@/firebase-applet-config.json';

/**
 * Centralized Next.js Firebase Client Initialization
 * 
 * Uses exact chenabmedia-in configuration with fallback to environment variables
 */

export const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    (appletConfig as Record<string, string>)?.apiKey ||
    'AIzaSyArplTTGJvajOU7Rm8gXWeHc70WGeOcaE4',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    (appletConfig as Record<string, string>)?.authDomain ||
    'chenabmedia-in.firebaseapp.com',
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    (appletConfig as Record<string, string>)?.projectId ||
    'chenabmedia-in',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    (appletConfig as Record<string, string>)?.storageBucket ||
    'chenabmedia-in.firebasestorage.app',
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    (appletConfig as Record<string, string>)?.messagingSenderId ||
    '957334149598',
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    (appletConfig as Record<string, string>)?.appId ||
    '1:957334149598:web:085352a18f8ece0437254f',
  measurementId:
    (appletConfig as Record<string, string>)?.measurementId ||
    'G-WML0K7N15T',
};

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

export const firebaseApp = getFirebaseApp();

let analyticsInstance: Analytics | null = null;
export const initAnalytics = async (): Promise<Analytics | null> => {
  if (typeof window !== 'undefined' && !analyticsInstance) {
    const supported = await isSupported();
    if (supported) {
      analyticsInstance = getAnalytics(firebaseApp);
    }
  }
  return analyticsInstance;
};

