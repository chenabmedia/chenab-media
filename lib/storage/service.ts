import { getAdminDb } from '@/lib/firebase/admin';
import {
  StorageCategory,
  StorageFileRecord,
  StorageOwnerType,
  StorageVisibility,
  UploadSignedUrlRequest,
  UploadSignedUrlResponse,
} from '@/types/storage';
import {
  STORAGE_SIZE_LIMITS,
  FORBIDDEN_EXTENSIONS,
  CATEGORY_ALLOWED_MIMES,
  sanitizeFilename,
  generateObjectKey,
} from './config';
import {
  isR2Configured,
  uploadObject,
  deleteObject,
  createSignedDownloadUrl,
  createSignedUploadUrl,
  getPublicUrl,
} from './r2';
import { recordAuditLog } from '@/lib/firebase/audit';
import crypto from 'crypto';

const STORAGE_COLLECTION = 'storage_files';

export class StorageValidationError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
    this.name = 'StorageValidationError';
  }
}

/**
 * Validates file parameters against security rules, limits, and MIME constraints
 */
export function validateUploadParams(params: {
  filename: string;
  mimeType: string;
  size: number;
  category: StorageCategory;
  visibility: StorageVisibility;
}): { safeFilename: string; extension: string } {
  const { filename, mimeType, size, category, visibility } = params;

  if (!filename || typeof filename !== 'string') {
    throw new StorageValidationError('Filename is required and must be a valid string.');
  }

  const { safeName, extension } = sanitizeFilename(filename);

  if (!safeName || safeName.length === 0) {
    throw new StorageValidationError('Invalid or empty sanitized filename.');
  }

  if (extension && FORBIDDEN_EXTENSIONS.has(extension.toLowerCase())) {
    throw new StorageValidationError(
      `File extension ".${extension}" is strictly prohibited for security reasons.`
    );
  }

  // Reject executable or script MIME types
  const lowerMime = (mimeType || '').toLowerCase().trim();
  if (
    lowerMime.includes('javascript') ||
    lowerMime.includes('x-sh') ||
    lowerMime.includes('x-msdownload') ||
    lowerMime.includes('x-executable') ||
    lowerMime.includes('x-bat')
  ) {
    throw new StorageValidationError(`Prohibited MIME type: ${lowerMime}`);
  }

  // Validate size limits
  const maxLimit = STORAGE_SIZE_LIMITS[category] || STORAGE_SIZE_LIMITS.other;
  if (!size || size <= 0) {
    throw new StorageValidationError('File size must be greater than 0 bytes.');
  }
  if (size > maxLimit) {
    const mbLimit = Math.round(maxLimit / (1024 * 1024));
    const mbActual = (size / (1024 * 1024)).toFixed(2);
    throw new StorageValidationError(
      `File size exceeds the allowed limit for category "${category}". Maximum allowed: ${mbLimit} MB (provided: ${mbActual} MB).`
    );
  }

  // Validate category-specific allowed MIME types if defined
  const allowedMimes = CATEGORY_ALLOWED_MIMES[category];
  if (allowedMimes && allowedMimes.length > 0) {
    const isMimeAllowed = allowedMimes.some((allowed) => {
      if (allowed.endsWith('/*')) {
        const prefix = allowed.slice(0, -2);
        return lowerMime.startsWith(prefix);
      }
      return lowerMime === allowed;
    });

    if (!isMimeAllowed) {
      throw new StorageValidationError(
        `MIME type "${lowerMime}" is not permitted for category "${category}". Allowed types: ${allowedMimes.join(', ')}`
      );
    }
  }

  if (visibility !== 'PUBLIC' && visibility !== 'PRIVATE') {
    throw new StorageValidationError('Visibility must be either "PUBLIC" or "PRIVATE".');
  }

  return { safeFilename: safeName, extension };
}

/**
 * Creates a pre-signed upload URL and reserves metadata for direct browser-to-R2 upload
 */
export async function prepareDirectUpload(
  request: UploadSignedUrlRequest,
  uploader: { uid: string; email: string; displayName?: string | null }
): Promise<UploadSignedUrlResponse> {
  if (!isR2Configured()) {
    throw new StorageValidationError(
      'Cloudflare R2 Storage is not configured on this server. Contact administrator.',
      503
    );
  }

  const { safeFilename, extension } = validateUploadParams({
    filename: request.filename,
    mimeType: request.mimeType,
    size: request.size,
    category: request.category,
    visibility: request.visibility,
  });

  const fileId = `cfile_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  const objectKey = generateObjectKey({
    category: request.category,
    fileId,
    extension,
    ownerId: request.ownerId,
    subType: request.subType,
  });

  const expiresInSeconds = 900; // 15 minutes
  const uploadUrl = await createSignedUploadUrl(objectKey, request.mimeType, expiresInSeconds);

  const now = new Date().toISOString();
  const publicUrl = request.visibility === 'PUBLIC' ? getPublicUrl(objectKey) : null;

  const fileRecordDraft: StorageFileRecord = {
    id: fileId,
    objectKey,
    filename: safeFilename,
    mimeType: request.mimeType,
    size: request.size,
    category: request.category,
    visibility: request.visibility,
    ownerType: request.ownerType,
    ownerId: request.ownerId,
    uploadedBy: {
      uid: uploader.uid,
      email: uploader.email,
      displayName: uploader.displayName,
    },
    createdAt: now,
    updatedAt: now,
    description: request.description?.trim(),
    tags: request.tags || [],
    publicUrl,
  };

  return {
    fileId,
    objectKey,
    uploadUrl,
    expiresInSeconds,
    fileRecordDraft,
  };
}

/**
 * Persists file metadata in Firestore after an upload succeeds
 */
export async function finalizeFileRecord(record: StorageFileRecord): Promise<StorageFileRecord> {
  const db = getAdminDb();
  if (!db) {
    throw new Error('Firestore database service is unavailable.');
  }

  const cleanRecord = {
    ...record,
    updatedAt: new Date().toISOString(),
  };

  await db.collection(STORAGE_COLLECTION).doc(record.id).set(cleanRecord);

  // Audit log
  await recordAuditLog({
    actorUid: record.uploadedBy.uid,
    actorName: record.uploadedBy.displayName || record.uploadedBy.email.split('@')[0],
    actorEmail: record.uploadedBy.email,
    action: 'STORAGE_UPLOAD',
    targetType: 'storage_file',
    targetId: record.id,
    description: `Uploaded storage file: ${record.filename} (${record.category}, ${record.visibility})`,
    metadata: {
      objectKey: record.objectKey,
      size: record.size,
      mimeType: record.mimeType,
      category: record.category,
      visibility: record.visibility,
    },
  });

  return cleanRecord;
}

export const uploadDirectBuffer = uploadServerFile;

/**
 * Direct server upload handler (e.g. for API routes with multipart or buffers)
 */
export async function uploadServerFile(params: {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  category: StorageCategory;
  visibility: StorageVisibility;
  ownerType?: StorageOwnerType;
  ownerId?: string;
  subType?: string;
  description?: string;
  tags?: string[];
  uploader: { uid: string; email: string; displayName?: string | null };
}): Promise<StorageFileRecord> {
  if (!isR2Configured()) {
    throw new StorageValidationError(
      'Cloudflare R2 Storage is not configured on this server. Contact administrator.',
      503
    );
  }

  const { safeFilename, extension } = validateUploadParams({
    filename: params.filename,
    mimeType: params.mimeType,
    size: params.buffer.length,
    category: params.category,
    visibility: params.visibility,
  });

  const fileId = `cfile_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  const objectKey = generateObjectKey({
    category: params.category,
    fileId,
    extension,
    ownerId: params.ownerId,
    subType: params.subType,
  });

  // Calculate sha256 checksum
  const checksum = crypto.createHash('sha256').update(params.buffer).digest('hex');

  // Upload to R2
  await uploadObject({
    key: objectKey,
    body: params.buffer,
    contentType: params.mimeType,
    metadata: {
      fileId,
      filename: safeFilename,
      category: params.category,
      visibility: params.visibility,
      uploadedBy: params.uploader.email,
    },
  });

  const now = new Date().toISOString();
  const publicUrl = params.visibility === 'PUBLIC' ? getPublicUrl(objectKey) : null;

  const record: StorageFileRecord = {
    id: fileId,
    objectKey,
    filename: safeFilename,
    mimeType: params.mimeType,
    size: params.buffer.length,
    category: params.category,
    visibility: params.visibility,
    ownerType: params.ownerType,
    ownerId: params.ownerId,
    uploadedBy: params.uploader,
    createdAt: now,
    updatedAt: now,
    checksum,
    description: params.description?.trim(),
    tags: params.tags || [],
    publicUrl,
  };

  return await finalizeFileRecord(record);
}

/**
 * Retrieves a file metadata record and computes its current accessible URL
 */
export async function getStorageFile(
  id: string,
  generateSignedUrlForPrivate = true
): Promise<StorageFileRecord | null> {
  const db = getAdminDb();
  if (!db) return null;

  const doc = await db.collection(STORAGE_COLLECTION).doc(id).get();
  if (!doc.exists) return null;

  const data = doc.data() as StorageFileRecord;

  // Resolve download URL
  if (data.visibility === 'PUBLIC') {
    data.publicUrl = data.publicUrl || getPublicUrl(data.objectKey);
    data.downloadUrl = data.publicUrl;
  } else if (generateSignedUrlForPrivate && isR2Configured()) {
    try {
      data.downloadUrl = await createSignedDownloadUrl(data.objectKey, 3600);
    } catch (err) {
      console.warn(`[Storage] Could not generate signed URL for ${data.objectKey}:`, err);
      data.downloadUrl = null;
    }
  }

  return data;
}

/**
 * Queries storage file records with optional filtering
 */
export async function listStorageFiles(options?: {
  category?: StorageCategory;
  visibility?: StorageVisibility;
  ownerId?: string;
  search?: string;
  limit?: number;
}): Promise<StorageFileRecord[]> {
  const db = getAdminDb();
  if (!db) return [];

  let query: FirebaseFirestore.Query = db.collection(STORAGE_COLLECTION);

  if (options?.category) {
    query = query.where('category', '==', options.category);
  }
  if (options?.visibility) {
    query = query.where('visibility', '==', options.visibility);
  }
  if (options?.ownerId) {
    query = query.where('ownerId', '==', options.ownerId);
  }

  query = query.orderBy('createdAt', 'desc').limit(options?.limit || 100);

  const snapshot = await query.get();
  let records: StorageFileRecord[] = snapshot.docs.map((d) => d.data() as StorageFileRecord);

  // In-memory search filter if keyword provided
  if (options?.search) {
    const q = options.search.toLowerCase().trim();
    records = records.filter(
      (r) =>
        r.filename.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.objectKey.toLowerCase().includes(q) ||
        r.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }

  // Populate public URLs where applicable
  return records.map((r) => {
    if (r.visibility === 'PUBLIC') {
      r.publicUrl = r.publicUrl || getPublicUrl(r.objectKey);
      r.downloadUrl = r.publicUrl;
    }
    return r;
  });
}

/**
 * Deletes a file from both Cloudflare R2 and Firestore metadata
 */
export async function deleteStorageFile(
  id: string,
  actor: { uid: string; email: string; displayName?: string | null }
): Promise<boolean> {
  const db = getAdminDb();
  if (!db) return false;

  const doc = await db.collection(STORAGE_COLLECTION).doc(id).get();
  if (!doc.exists) {
    return false;
  }

  const record = doc.data() as StorageFileRecord;

  // Delete from Cloudflare R2 if configured
  if (isR2Configured() && record.objectKey) {
    try {
      await deleteObject(record.objectKey);
    } catch (err) {
      console.error(`[Storage] Failed to delete object from R2 (${record.objectKey}):`, err);
    }
  }

  // Delete from Firestore
  await db.collection(STORAGE_COLLECTION).doc(id).delete();

  // Audit log
  await recordAuditLog({
    actorUid: actor.uid,
    actorName: actor.displayName || actor.email.split('@')[0],
    actorEmail: actor.email,
    action: 'STORAGE_DELETE',
    targetType: 'storage_file',
    targetId: id,
    description: `Deleted storage file: ${record.filename} (${record.objectKey})`,
    metadata: {
      objectKey: record.objectKey,
      category: record.category,
      size: record.size,
    },
  });

  return true;
}
