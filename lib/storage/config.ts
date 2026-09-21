import { StorageCategory } from '@/types/storage';

/**
 * Category-Specific File Size Limits (in bytes)
 */
export const STORAGE_SIZE_LIMITS: Record<StorageCategory, number> = {
  artwork: 10 * 1024 * 1024, // 10 MB
  artists: 10 * 1024 * 1024, // 10 MB
  site_assets: 50 * 1024 * 1024, // 50 MB
  agreements: 25 * 1024 * 1024, // 25 MB
  contracts: 25 * 1024 * 1024, // 25 MB
  royalty_documents: 25 * 1024 * 1024, // 25 MB
  mail_attachments: 25 * 1024 * 1024, // 25 MB
  tickets: 25 * 1024 * 1024, // 25 MB
  audio: 500 * 1024 * 1024, // 500 MB
  demos: 500 * 1024 * 1024, // 500 MB
  releases: 500 * 1024 * 1024, // 500 MB
  other: 50 * 1024 * 1024, // 50 MB
};

/**
 * Strictly prohibited executable, script, and dangerous file extensions
 */
export const FORBIDDEN_EXTENSIONS = new Set<string>([
  'exe', 'bat', 'cmd', 'sh', 'php', 'phtml', 'php3', 'php4', 'php5', 'phps',
  'py', 'pl', 'jsp', 'asp', 'aspx', 'cgi', 'js', 'ts', 'mjs', 'cjs', 'msi',
  'scr', 'vbs', 'com', 'hta', 'jar', 'elf', 'bin', 'so', 'dll', 'dmg', 'app',
  'ipa', 'apk', 'crx', 'xpi', 'wsf', 'reg', 'ps1', 'psm1', 'bash', 'zsh'
]);

/**
 * Permitted MIME type patterns per category
 */
export const CATEGORY_ALLOWED_MIMES: Partial<Record<StorageCategory, string[]>> = {
  artwork: [
    'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml'
  ],
  artists: [
    'image/jpeg', 'image/png', 'image/webp', 'image/avif'
  ],
  audio: [
    'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/aac',
    'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aiff', 'audio/x-aiff'
  ],
  demos: [
    'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/aac',
    'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aiff', 'audio/x-aiff'
  ],
  releases: [
    'image/jpeg', 'image/png', 'image/webp', 'image/avif',
    'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/aac',
    'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'application/zip'
  ],
  agreements: [
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  contracts: [
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  royalty_documents: [
    'application/pdf', 'text/csv', 'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  site_assets: [
    'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml',
    'image/x-icon', 'video/mp4', 'video/webm', 'application/pdf'
  ],
  mail_attachments: [
    'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
    'audio/mpeg', 'audio/wav', 'text/plain', 'text/csv',
    'application/zip', 'application/x-zip-compressed'
  ],
  tickets: [
    'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
    'text/plain', 'text/csv', 'application/zip', 'application/x-zip-compressed'
  ],
};

/**
 * Sanitizes an individual path component (folder, entity id, etc.)
 * Strictly blocks path traversal, null bytes, and non-printable characters.
 */
export function sanitizePathComponent(val?: string | null): string {
  if (!val) return 'general';
  // Remove null bytes and control chars
  let clean = val.replace(/\0/g, '').replace(/[\x00-\x1F\x7F]/g, '');
  // Remove traversal sequences and slashes
  clean = clean.replace(/\.\./g, '').replace(/[/\\]/g, '');
  // Keep only alphanumeric, dash, underscore
  clean = clean.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 80);
  return clean || 'general';
}

/**
 * Sanitizes a client-provided filename.
 */
export function sanitizeFilename(filename: string): { safeName: string; extension: string } {
  if (!filename || typeof filename !== 'string') {
    return { safeName: 'unnamed_file', extension: '' };
  }

  // Remove null bytes and control chars
  const raw = filename.replace(/\0/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim();
  // Strip any leading path components
  const base = raw.split(/[/\\]/).pop() || 'file';

  const lastDot = base.lastIndexOf('.');
  let namePart = lastDot > 0 ? base.slice(0, lastDot) : base;
  let extPart = lastDot > 0 ? base.slice(lastDot + 1).toLowerCase() : '';

  // Clean name part: replace unsafe characters with underscore
  namePart = namePart.replace(/[^a-zA-Z0-9_\-.]/g, '_').slice(0, 100) || 'file';
  // Clean ext part
  extPart = extPart.replace(/[^a-z0-9]/g, '').slice(0, 10);

  return {
    safeName: extPart ? `${namePart}.${extPart}` : namePart,
    extension: extPart,
  };
}

/**
 * Deterministic Object Key Generator
 */
export function generateObjectKey(params: {
  category: StorageCategory;
  fileId: string;
  extension: string;
  ownerId?: string | null;
  subType?: string | null;
}): string {
  const { category, fileId, extension, ownerId, subType } = params;
  const extSuffix = extension ? `.${extension}` : '';
  const cleanOwner = sanitizePathComponent(ownerId);
  const cleanSub = sanitizePathComponent(subType);

  switch (category) {
    case 'artists':
      return `artists/${cleanOwner}/${cleanSub || 'profile'}/${fileId}${extSuffix}`;
    case 'releases':
      return `releases/${cleanOwner}/${cleanSub || 'artwork'}/${fileId}${extSuffix}`;
    case 'audio':
      return `releases/${cleanOwner}/audio/${fileId}${extSuffix}`;
    case 'artwork':
      return `releases/${cleanOwner}/artwork/${fileId}${extSuffix}`;
    case 'demos':
      return `demos/${cleanOwner}/${fileId}${extSuffix}`;
    case 'agreements':
      return `agreements/${cleanOwner}/${cleanSub || 'general'}/${fileId}${extSuffix}`;
    case 'contracts':
      return `agreements/${cleanOwner}/contracts/${fileId}${extSuffix}`;
    case 'mail_attachments':
      return `tickets/${cleanOwner}/attachments/${fileId}${extSuffix}`;
    case 'tickets':
      return `tickets/${cleanOwner}/attachments/${fileId}${extSuffix}`;
    case 'royalty_documents':
      return `royalty_documents/${cleanOwner}/${fileId}${extSuffix}`;
    case 'site_assets':
      return `site_assets/${cleanSub || 'media'}/${fileId}${extSuffix}`;
    case 'other':
    default:
      return `other/${fileId}${extSuffix}`;
  }
}
