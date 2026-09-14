import { UserProfile, UserRole } from '@/types/auth';
import { ALL_PERMISSIONS } from './permissions';

export const BOOTSTRAP_ADMIN_EMAILS: string[] = [
  'zaazze@chenabmedia.in',
  'admin@chenabmedia.com',
  'shahtohid722@gmail.com',
  'aandr@chenabmedia.com'
];

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();
  return BOOTSTRAP_ADMIN_EMAILS.includes(normalizedEmail);
}

export function determineInitialUserRole(email: string | null | undefined): UserRole {
  if (isSuperAdminEmail(email)) {
    return 'admin';
  }
  
  return 'artist';
}

export function createSuperAdminProfile(
  uid: string,
  email: string,
  displayName?: string | null,
  photoURL?: string | null
): UserProfile {
  const now = new Date().toISOString();
  const normalizedEmail = email.toLowerCase().trim();
  const isZaazze = normalizedEmail === 'zaazze@chenabmedia.in';

  return {
    uid,
    email: normalizedEmail,
    displayName: displayName || (isZaazze ? 'Zaazze' : 'Super Admin'),
    photoURL: photoURL || null,
    role: 'admin',
    status: 'ACTIVE',
    permissions: ALL_PERMISSIONS,
    createdAt: now,
    updatedAt: now,
    createdBy: 'system_bootstrap',
  };
}
