import { UserProfile, UserRole } from '@/types/auth';

export type AdminPermission =
  | 'dashboard.view'
  | 'artists.view'
  | 'artists.create'
  | 'artists.edit'
  | 'artists.delete'
  | 'releases.view'
  | 'releases.create'
  | 'releases.edit'
  | 'releases.delete'
  | 'releases.publish'
  | 'smartlinks.view'
  | 'smartlinks.create'
  | 'smartlinks.edit'
  | 'smartlinks.delete'
  | 'demos.view'
  | 'demos.review'
  | 'agreements.view'
  | 'agreements.create'
  | 'agreements.edit'
  | 'royalties.view'
  | 'royalties.manage'
  | 'withdrawals.view'
  | 'withdrawals.approve'
  | 'withdrawals.reject'
  | 'withdrawals.markPaid'
  | 'messages.view'
  | 'messages.reply'
  | 'admins.view'
  | 'admins.create'
  | 'admins.edit'
  | 'admins.disable'
  | 'audit.view'
  | 'settings.view'
  | 'settings.manage'
  | 'site.manage'
  | 'email.send'
  | 'email.identities.manage'
  | 'email.logs.view';

export interface PermissionGroup {
  category: string;
  permissions: {
    key: AdminPermission;
    label: string;
    description: string;
  }[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    category: 'Dashboard & Core',
    permissions: [
      { key: 'dashboard.view', label: 'View Dashboard', description: 'Access main administrative metrics & activity overview' },
      { key: 'settings.view', label: 'View Settings', description: 'Access system configuration and administrative profile settings' },
      { key: 'settings.manage', label: 'Manage Settings', description: 'Modify global label settings and operational configurations' },
      { key: 'site.manage', label: 'Manage Site CMS', description: 'Configure global website settings, navigation, and page visibility' },
    ],
  },
  {
    category: 'Roster & Catalog',
    permissions: [
      { key: 'artists.view', label: 'View Artists', description: 'Browse roster artists and detail profiles' },
      { key: 'artists.create', label: 'Create Artists', description: 'Add new roster artist records' },
      { key: 'artists.edit', label: 'Edit Artists', description: 'Modify artist metadata and status' },
      { key: 'artists.delete', label: 'Delete Artists', description: 'Archive or remove artist catalogue records' },
      { key: 'releases.view', label: 'View Releases', description: 'Browse catalogue music publications' },
      { key: 'releases.create', label: 'Create Releases', description: 'Create single, EP, or album releases' },
      { key: 'releases.edit', label: 'Edit Releases', description: 'Update release tracks, art, and metadata' },
      { key: 'releases.publish', label: 'Publish Releases', description: 'Publish or unpublish catalogue releases' },
      { key: 'releases.delete', label: 'Delete Releases', description: 'Archive or remove catalogue publications' },
      { key: 'smartlinks.view', label: 'View Smart Links', description: 'Inspect release Smart Links' },
      { key: 'smartlinks.create', label: 'Create Smart Links', description: 'Create custom release landing pages' },
      { key: 'smartlinks.edit', label: 'Edit Smart Links', description: 'Modify Smart Link slugs and platform URLs' },
      { key: 'smartlinks.delete', label: 'Delete Smart Links', description: 'Remove Smart Links' },
    ],
  },
  {
    category: 'A&R & Submissions',
    permissions: [
      { key: 'demos.view', label: 'View Demos', description: 'Access incoming A&R demo pitches and audio links' },
      { key: 'demos.review', label: 'Review Demos', description: 'Accept, reject, or comment on demo submissions' },
      { key: 'messages.view', label: 'View Messages', description: 'Read contact form submissions and inquiries' },
      { key: 'messages.reply', label: 'Reply Messages', description: 'Respond to incoming label contact inquiries' },
    ],
  },
  {
    category: 'Administration & Security',
    permissions: [
      { key: 'admins.view', label: 'View Admins', description: 'Browse administrative user list and role details' },
      { key: 'admins.create', label: 'Create Admins', description: 'Provision new admin or executive accounts' },
      { key: 'admins.edit', label: 'Edit Admins', description: 'Modify roles, permissions, and account profiles' },
      { key: 'admins.disable', label: 'Disable Admins', description: 'Suspend or reactivate administrative accounts' },
      { key: 'audit.view', label: 'View Audit Logs', description: 'Inspect system security logs and audit history' },
    ],
  },
  {
    category: 'Financials & Contracts (Upcoming)',
    permissions: [
      { key: 'agreements.view', label: 'View Agreements', description: 'Access contract documentation and licensing deals' },
      { key: 'agreements.create', label: 'Create Agreements', description: 'Draft new licensing or artist agreements' },
      { key: 'agreements.edit', label: 'Edit Agreements', description: 'Modify existing contract metadata' },
      { key: 'royalties.view', label: 'View Royalties', description: 'Inspect royalty statements and calculations' },
      { key: 'royalties.manage', label: 'Manage Royalties', description: 'Process royalty payouts and statement imports' },
      { key: 'withdrawals.view', label: 'View Withdrawals', description: 'Monitor artist payout requests' },
      { key: 'withdrawals.approve', label: 'Approve Withdrawals', description: 'Approve artist earnings withdrawal requests' },
      { key: 'withdrawals.reject', label: 'Reject Withdrawals', description: 'Decline earnings withdrawal requests' },
      { key: 'withdrawals.markPaid', label: 'Mark Paid', description: 'Flag approved payouts as settled' },
      { key: 'email.send', label: 'Dispatch Emails', description: 'Send automated email notifications via Resend' },
      { key: 'email.identities.manage', label: 'Manage Email Identities', description: 'Create and configure domain sender suffixes' },
      { key: 'email.logs.view', label: 'View Email Logs', description: 'Inspect sent email audit records and statuses' },
    ],
  },
];

export const ALL_PERMISSIONS: AdminPermission[] = PERMISSION_GROUPS.flatMap(g =>
  g.permissions.map(p => p.key)
);

export const DEFAULT_EXECUTIVE_PERMISSIONS: AdminPermission[] = [
  'dashboard.view',
  'artists.view',
  'artists.create',
  'artists.edit',
  'releases.view',
  'releases.create',
  'releases.edit',
  'releases.publish',
  'smartlinks.view',
  'smartlinks.create',
  'smartlinks.edit',
  'demos.view',
  'demos.review',
  'messages.view',
  'messages.reply',
];

/**
 * Checks if a user profile possesses a specific permission.
 * Admins possess ALL permissions by default unless explicitly overridden.
 */
export function hasPermission(profile: UserProfile | null | undefined, permission: AdminPermission): boolean {
  if (!profile || profile.status === 'DISABLED' || profile.status === 'SUSPENDED') {
    return false;
  }

  // Admins have full access
  if (profile.role === 'admin') {
    return true;
  }

  // Executives use explicit permissions array or fallback defaults if none defined
  if (profile.role === 'executive') {
    const userPerms = profile.permissions && profile.permissions.length > 0
      ? profile.permissions
      : DEFAULT_EXECUTIVE_PERMISSIONS;
    return userPerms.includes(permission);
  }

  // Artists have no administrative permissions
  return false;
}

export function hasAnyPermission(profile: UserProfile | null | undefined, permissions: AdminPermission[]): boolean {
  return permissions.some(p => hasPermission(profile, p));
}

export function hasAllPermissions(profile: UserProfile | null | undefined, permissions: AdminPermission[]): boolean {
  return permissions.every(p => hasPermission(profile, p));
}

export function canAccess(profile: UserProfile | null | undefined, requiredPermission?: AdminPermission): boolean {
  if (!profile || profile.status === 'DISABLED' || profile.status === 'SUSPENDED') {
    return false;
  }

  if (profile.role === 'artist') {
    return false;
  }

  if (!requiredPermission) {
    return profile.role === 'admin' || profile.role === 'executive';
  }

  return hasPermission(profile, requiredPermission);
}
