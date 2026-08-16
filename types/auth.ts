export type UserRole = 'admin' | 'executive' | 'artist';

export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DISABLED';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  permissions?: string[];
  artistId?: string;
  createdBy?: string;
}

export interface AuthError {
  code: string;
  message: string;
}

