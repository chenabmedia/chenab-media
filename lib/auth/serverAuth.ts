import { NextRequest } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { UserProfile } from '@/types/auth';
import { AdminPermission, hasPermission, ALL_PERMISSIONS } from './permissions';
import { isSuperAdminEmail, createSuperAdminProfile } from './bootstrap';

export interface ServerAuthResult {
  authenticated: boolean;
  user: {
    uid: string;
    email: string;
  } | null;
  profile: UserProfile | null;
  error?: string;
}

export async function verifyServerAuth(
  req: NextRequest,
  requiredPermission?: AdminPermission
): Promise<ServerAuthResult> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, user: null, profile: null, error: 'Missing or malformed Authorization header' };
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return { authenticated: false, user: null, profile: null, error: 'Empty token string' };
    }

    let uid = '';
    let email = '';

    const auth = getAdminAuth();
    if (!auth) {
      return {
        authenticated: false,
        user: null,
        profile: null,
        error: 'Firebase Admin Auth service is unavailable',
      };
    }

    try {
      const decoded = await auth.verifyIdToken(token);
      uid = decoded.uid;
      email = decoded.email || '';
    } catch (authErr: any) {
      return {
        authenticated: false,
        user: null,
        profile: null,
        error: `Authentication token verification failed: ${authErr?.message || 'Invalid token'}`,
      };
    }

    if (!uid) {
      return {
        authenticated: false,
        user: null,
        profile: null,
        error: 'Token did not contain a valid user ID',
      };
    }

    const isSuperAdmin = isSuperAdminEmail(email);

    // Fetch Firestore user profile
    let profile: UserProfile | null = null;
    const db = getAdminDb();

    if (db) {
      try {
        const snap = await db.collection('users').doc(uid).get();
        if (snap.exists) {
          profile = snap.data() as UserProfile;
        }
      } catch (err) {
        console.warn('[ServerAuth] Could not fetch user doc in Firestore:', err);
      }
    }

    // Auto-upgrade or fallback for bootstrap admin email if doc not found or incomplete
    if (isSuperAdmin) {
      if (!profile || profile.role !== 'admin' || profile.status !== 'ACTIVE') {
        profile = createSuperAdminProfile(uid, email, profile?.displayName, profile?.photoURL);
        if (db) {
          try {
            db.collection('users').doc(uid).set(profile, { merge: true }).catch(err => {
              console.warn('[ServerAuth] Auto-sync of super admin failed:', err);
            });
          } catch (err) {
            console.warn('[ServerAuth] Auto-sync of super admin threw:', err);
          }
        }
      }
    } else if (!profile) {
      // Fail closed: Missing Firestore profile for non-superadmin accounts is denied
      return {
        authenticated: false,
        user: { uid, email },
        profile: null,
        error: 'User profile record not found in database. Access denied.',
      };
    }

    if (profile.status === 'DISABLED' || profile.status === 'SUSPENDED') {
      return { authenticated: false, user: { uid, email }, profile, error: 'Account is disabled or suspended' };
    }

    if (requiredPermission && !hasPermission(profile, requiredPermission) && profile.role !== 'admin') {
      return { authenticated: false, user: { uid, email }, profile, error: `Insufficient administrative permissions for action (${requiredPermission})` };
    }

    return { authenticated: true, user: { uid, email }, profile };
  } catch (fatalErr: any) {
    console.error('[ServerAuth] Fatal error in verifyServerAuth:', fatalErr);
    return {
      authenticated: false,
      user: null,
      profile: null,
      error: `Server authentication check failed: ${fatalErr?.message || String(fatalErr)}`,
    };
  }
}
