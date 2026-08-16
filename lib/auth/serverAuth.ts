import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { db, getUserDocRef } from '@/lib/firebase/firestore';
import { getDoc } from 'firebase/firestore';
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
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, user: null, profile: null, error: 'Missing or malformed Authorization header' };
  }

  const token = authHeader.split('Bearer ')[1];
  if (!token) {
    return { authenticated: false, user: null, profile: null, error: 'Empty token string' };
  }

  let uid: string;
  let email: string;

  try {
    if (adminAuth) {
      const decoded = await adminAuth.verifyIdToken(token);
      uid = decoded.uid;
      email = decoded.email || '';
    } else {
      // Basic fallback token decode for dev sandbox if adminAuth is uninitialized
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        uid = payload.user_id || payload.sub;
        email = payload.email || '';
      } else {
        return { authenticated: false, user: null, profile: null, error: 'Invalid ID token format' };
      }
    }
  } catch (err: any) {
    return { authenticated: false, user: null, profile: null, error: `Authentication token verification failed: ${err.message}` };
  }

  const isSuperAdmin = isSuperAdminEmail(email);

  // Fetch Firestore user profile
  let profile: UserProfile | null = null;

  try {
    if (adminDb) {
      const snap = await adminDb.collection('users').doc(uid).get();
      if (snap.exists) {
        profile = snap.data() as UserProfile;
      }
    } else {
      const snap = await getDoc(getUserDocRef(uid));
      if (snap.exists()) {
        profile = snap.data() as UserProfile;
      }
    }
  } catch (err) {
    console.warn('Could not fetch user doc in server auth check:', err);
  }

  // Auto-upgrade or fallback for bootstrap admin email if doc not found or incomplete
  if (isSuperAdmin) {
    if (!profile || profile.role !== 'admin' || profile.status !== 'ACTIVE') {
      profile = createSuperAdminProfile(uid, email, profile?.displayName, profile?.photoURL);
      if (adminDb) {
        adminDb.collection('users').doc(uid).set(profile, { merge: true }).catch(err => {
          console.warn('Server auth auto-sync of super admin failed:', err);
        });
      }
    }
  } else if (!profile) {
    profile = {
      uid,
      email,
      displayName: email.split('@')[0],
      photoURL: null,
      role: 'artist',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  if (profile.status === 'DISABLED' || profile.status === 'SUSPENDED') {
    return { authenticated: false, user: { uid, email }, profile, error: 'Account is disabled or suspended' };
  }

  if (requiredPermission && !hasPermission(profile, requiredPermission) && profile.role !== 'admin') {
    return { authenticated: false, user: { uid, email }, profile, error: `Insufficient administrative permissions for action (${requiredPermission})` };
  }

  return { authenticated: true, user: { uid, email }, profile };
}
