import { SiteConfig, DEFAULT_SITE_CONFIG } from '@/types/site';
import { adminDb } from './firebase/admin';
import { db } from './firebase/firestore';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    if (adminDb) {
      const docRef = adminDb.collection('siteConfig').doc('global');
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        return { ...DEFAULT_SITE_CONFIG, ...(docSnap.data() as SiteConfig) };
      }
    } else if (db) {
      const docRef = doc(db, 'siteConfig', 'global');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { ...DEFAULT_SITE_CONFIG, ...(docSnap.data() as SiteConfig) };
      }
    }
  } catch (error) {
    console.warn('Failed to fetch site config from Firestore, falling back to defaults:', error);
  }
  return DEFAULT_SITE_CONFIG;
}

export async function saveSiteConfig(config: SiteConfig): Promise<void> {
  try {
    if (adminDb) {
      await adminDb.collection('siteConfig').doc('global').set({
        ...config,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } else if (db) {
      const docRef = doc(db, 'siteConfig', 'global');
      await setDoc(docRef, {
        ...config,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }
  } catch (error) {
    console.error('Failed to save site config:', error);
    throw error;
  }
}
