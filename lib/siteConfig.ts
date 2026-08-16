import { SiteConfig, DEFAULT_SITE_CONFIG } from '@/types/site';
import { adminDb } from './firebase/admin';
import appletConfig from '@/firebase-applet-config.json';

export async function getSiteConfig(): Promise<SiteConfig> {
  if (adminDb) {
    try {
      const docRef = adminDb.collection('siteConfig').doc('global');
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        return { ...DEFAULT_SITE_CONFIG, ...(docSnap.data() as SiteConfig) };
      }
    } catch (e: any) {
      console.warn('adminDb siteConfig lookup notice:', e?.message || e);
    }
  }

  // REST API Fallback for client/unauthenticated environments
  try {
    const cfg = appletConfig as Record<string, string>;
    const projectId = cfg.projectId || 'chenabmedia-in';
    const dbId = cfg.firestoreDatabaseId || '(default)';
    const apiKey = cfg.apiKey;

    if (apiKey) {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/siteConfig/global?key=${apiKey}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.fields) {
          // Flatten simple string fields from Firestore REST format
          const parsedConfig: Partial<SiteConfig> = {};
          for (const [key, val] of Object.entries<any>(json.fields)) {
            if (val.stringValue !== undefined) {
              (parsedConfig as any)[key] = val.stringValue;
            } else if (val.booleanValue !== undefined) {
              (parsedConfig as any)[key] = val.booleanValue;
            } else if (val.integerValue !== undefined || val.doubleValue !== undefined) {
              (parsedConfig as any)[key] = Number(val.integerValue ?? val.doubleValue);
            }
          }
          return { ...DEFAULT_SITE_CONFIG, ...parsedConfig };
        }
      }
    }
  } catch (err) {
    // Silent catch, return DEFAULT_SITE_CONFIG
  }

  return DEFAULT_SITE_CONFIG;
}

export async function saveSiteConfig(config: SiteConfig): Promise<void> {
  if (!adminDb) {
    throw new Error('Firebase Admin SDK is not initialized.');
  }

  try {
    await adminDb.collection('siteConfig').doc('global').set({
      ...config,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Failed to save site config via adminDb:', error);
    throw error;
  }
}


