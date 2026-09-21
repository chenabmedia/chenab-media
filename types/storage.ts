/**
 * Cloudflare R2 Storage Type Definitions
 * CHENAB MEDIA Platform
 */

export type StorageCategory =
  | 'artists'
  | 'releases'
  | 'audio'
  | 'artwork'
  | 'demos'
  | 'agreements'
  | 'contracts'
  | 'mail_attachments'
  | 'royalty_documents'
  | 'site_assets'
  | 'tickets'
  | 'other';

export type StorageVisibility = 'PUBLIC' | 'PRIVATE';

export type StorageOwnerType =
  | 'artist'
  | 'release'
  | 'demo'
  | 'agreement'
  | 'ticket'
  | 'user'
  | 'system';

export interface StorageFileRecord {
  id: string;
  objectKey: string;
  filename: string;
  mimeType: string;
  size: number;
  category: StorageCategory;
  visibility: StorageVisibility;
  ownerType?: StorageOwnerType;
  ownerId?: string;
  uploadedBy: {
    uid: string;
    email: string;
    displayName?: string | null;
  };
  createdAt: string;
  updatedAt: string;
  checksum?: string;
  description?: string;
  tags?: string[];
  publicUrl?: string | null;
  downloadUrl?: string | null;
}

/**
 * Universal Media Asset Reference Abstraction
 * Allows seamless coexistence of legacy direct external URLs and R2 storage references
 */
export type MediaAssetSource =
  | { type: 'external'; url: string }
  | { type: 'storage'; fileId: string; cachedUrl?: string }
  | string;

export interface UploadSignedUrlRequest {
  filename: string;
  mimeType: string;
  size: number;
  category: StorageCategory;
  visibility: StorageVisibility;
  ownerType?: StorageOwnerType;
  ownerId?: string;
  description?: string;
  tags?: string[];
  subType?: string;
}

export interface UploadSignedUrlResponse {
  fileId: string;
  objectKey: string;
  uploadUrl: string;
  headers?: Record<string, string>;
  expiresInSeconds: number;
  fileRecordDraft: StorageFileRecord;
}
