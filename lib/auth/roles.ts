import { UserProfile, UserRole } from '@/types/auth';
import { canAccess as canAccessWithPermission } from './permissions';

export function isAccountActive(profile?: UserProfile | null): boolean {
  if (!profile) return false;
  return profile.status === 'ACTIVE' || profile.status === 'PENDING';
}

export function isAdmin(profile?: UserProfile | null): boolean {
  if (!isAccountActive(profile)) return false;
  return profile?.role === 'admin';
}

export function isExecutive(profile?: UserProfile | null): boolean {
  if (!isAccountActive(profile)) return false;
  return profile?.role === 'executive';
}

export function isArtist(profile?: UserProfile | null): boolean {
  if (!isAccountActive(profile)) return false;
  return profile?.role === 'artist';
}

export function hasRole(profile: UserProfile | null, allowedRoles: UserRole[]): boolean {
  if (!isAccountActive(profile)) return false;
  return allowedRoles.includes(profile!.role);
}

export function canAccessAdminPanel(profile?: UserProfile | null): boolean {
  if (!isAccountActive(profile)) return false;
  return isAdmin(profile) || canAccessWithPermission(profile, 'dashboard.view');
}

export function canAccessExecutivePanel(profile?: UserProfile | null): boolean {
  if (!isAccountActive(profile)) return false;
  return isAdmin(profile) || isExecutive(profile);
}

export function canAccessArtistPortal(profile?: UserProfile | null): boolean {
  if (!isAccountActive(profile)) return false;
  return isAdmin(profile) || isExecutive(profile) || isArtist(profile);
}

