import { UserRole } from '@/types/auth';

const BOOTSTRAP_ADMIN_EMAILS: string[] = [
  'zaazze@chenabmedia.in',
  'admin@chenabmedia.com',
  'shahtohid722@gmail.com',
  'aandr@chenabmedia.com'
];

export function determineInitialUserRole(email: string | null | undefined): UserRole {
  if (!email) return 'artist';
  
  const normalizedEmail = email.toLowerCase().trim();
  
  if (BOOTSTRAP_ADMIN_EMAILS.includes(normalizedEmail)) {
    return 'admin';
  }
  
  return 'artist';
}
