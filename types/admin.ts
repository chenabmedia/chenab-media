import { UserRole, UserStatus } from './auth';
import { AdminPermission } from '@/lib/auth/permissions';

export interface AuditLogEntry {
  id: string;
  actorUid: string;
  actorName: string;
  actorEmail: string;
  action:
    | 'ADMIN_CREATED'
    | 'ADMIN_UPDATED'
    | 'ADMIN_DISABLED'
    | 'ADMIN_REACTIVATED'
    | 'ROLE_CHANGED'
    | 'PERMISSIONS_CHANGED'
    | 'LOGIN'
    | 'LOGOUT'
    | 'ARTIST_MODIFIED'
    | 'RELEASE_MODIFIED'
    | 'SETTINGS_UPDATED'
    | 'SITE_CONFIG_UPDATED'
    | 'NAVIGATION_UPDATED'
    | 'SECTION_ENABLED'
    | 'SECTION_DISABLED'
    | 'PAGE_ENABLED'
    | 'PAGE_DISABLED'
    | 'PORTAL_ACCESS_CHANGED'
    | 'EMAIL_IDENTITY_CREATED'
    | 'EMAIL_IDENTITY_UPDATED'
    | 'EMAIL_IDENTITY_DISABLED'
    | 'EMAIL_SENT';
  targetType: 'user' | 'artist' | 'release' | 'demo' | 'system';
  targetId: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateAdminInput {
  displayName: string;
  email: string;
  role: 'admin' | 'executive';
  status: UserStatus;
  permissions: AdminPermission[];
}

export interface UpdateAdminInput {
  uid: string;
  displayName: string;
  email: string;
  role: 'admin' | 'executive';
  status: UserStatus;
  permissions: AdminPermission[];
}
