import { MediaAssetSource } from '@/types/storage';
import { getStorageFile } from './service';

/**
 * Universal Media Asset Resolver
 * 
 * Safely resolves any image, audio, or document source whether it is:
 * 1. A legacy plain URL string (e.g. "https://picsum.photos/...")
 * 2. An explicit external source object: { type: 'external', url: '...' }
 * 3. An R2 storage reference object: { type: 'storage', fileId: '...' }
 * 
 * Guarantees 100% backward compatibility with all existing database records.
 */
export async function resolveMediaUrl(
  source?: MediaAssetSource | null,
  fallback = ''
): Promise<string> {
  if (!source) return fallback;

  // 1. Direct string URL (legacy format)
  if (typeof source === 'string') {
    return source.trim() || fallback;
  }

  // 2. External URL object
  if (source.type === 'external') {
    return source.url?.trim() || fallback;
  }

  // 3. Storage reference
  if (source.type === 'storage' && source.fileId) {
    if (source.cachedUrl) {
      return source.cachedUrl;
    }

    try {
      const file = await getStorageFile(source.fileId);
      if (file) {
        return file.publicUrl || file.downloadUrl || fallback;
      }
    } catch (err) {
      console.warn(`[MediaResolver] Failed to resolve storage file ${source.fileId}:`, err);
    }
  }

  return fallback;
}

/**
 * Synchronous resolver for client-side rendering where immediate URL is needed.
 * Returns either the URL directly or any pre-cached/public URL embedded.
 */
export function getMediaUrlSync(
  source?: MediaAssetSource | null,
  fallback = ''
): string {
  if (!source) return fallback;

  if (typeof source === 'string') {
    return source.trim() || fallback;
  }

  if (source.type === 'external') {
    return source.url?.trim() || fallback;
  }

  if (source.type === 'storage') {
    return source.cachedUrl || fallback;
  }

  return fallback;
}
