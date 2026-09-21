import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Cloudflare R2 Storage Service Abstraction
 * 
 * S3-compatible, server-only client for Cloudflare R2 object storage.
 * Fails closed when required credentials are missing.
 */

let cachedClient: S3Client | null = null;
let cachedAccountId: string | null = null;

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

export function getR2Client(): { client: S3Client; bucketName: string } {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = process.env.R2_BUCKET_NAME?.trim();

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      'Cloudflare R2 Storage service is not configured. Missing required server environment variables: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME.'
    );
  }

  if (!cachedClient || cachedAccountId !== accountId) {
    cachedClient = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    cachedAccountId = accountId;
  }

  return { client: cachedClient, bucketName };
}

export interface UploadObjectParams {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface UploadObjectResult {
  key: string;
  etag?: string;
}

/**
 * Direct Server Upload to Cloudflare R2
 */
export async function uploadObject(params: UploadObjectParams): Promise<UploadObjectResult> {
  const { client, bucketName } = getR2Client();
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType,
    Metadata: params.metadata,
  });

  const response = await client.send(command);
  return {
    key: params.key,
    etag: response.ETag,
  };
}

/**
 * Downloads an object from Cloudflare R2
 */
export async function downloadObject(key: string) {
  const { client, bucketName } = getR2Client();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await client.send(command);
  return {
    body: response.Body,
    contentType: response.ContentType,
    contentLength: response.ContentLength,
    etag: response.ETag,
    lastModified: response.LastModified,
    metadata: response.Metadata,
  };
}

/**
 * Deletes an object from Cloudflare R2
 */
export async function deleteObject(key: string): Promise<void> {
  const { client, bucketName } = getR2Client();
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await client.send(command);
}

/**
 * Retrieves metadata for an object without downloading body
 */
export async function headObject(key: string) {
  const { client, bucketName } = getR2Client();
  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    const response = await client.send(command);
    return {
      contentLength: response.ContentLength,
      contentType: response.ContentType,
      etag: response.ETag,
      lastModified: response.LastModified,
      metadata: response.Metadata,
    };
  } catch (err: any) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * Lists objects in Cloudflare R2 bucket with prefix
 */
export async function listObjects(prefix?: string, maxKeys = 100, continuationToken?: string) {
  const { client, bucketName } = getR2Client();
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
    MaxKeys: Math.min(maxKeys, 1000),
    ContinuationToken: continuationToken,
  });

  const response = await client.send(command);
  return {
    objects: (response.Contents || []).map((item) => ({
      key: item.Key || '',
      size: item.Size || 0,
      lastModified: item.LastModified,
      etag: item.ETag,
    })),
    nextContinuationToken: response.NextContinuationToken,
    isTruncated: response.IsTruncated,
  };
}

/**
 * Generates a temporary pre-signed download URL for private R2 assets.
 * Default expiration: 3600 seconds (1 hour).
 */
export async function createSignedDownloadUrl(
  key: string,
  expiresInSeconds = 3600,
  responseContentDisposition?: string
): Promise<string> {
  const { client, bucketName } = getR2Client();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
    ...(responseContentDisposition ? { ResponseContentDisposition: responseContentDisposition } : {}),
  });

  return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Generates a pre-signed upload URL for direct browser-to-R2 uploads.
 * Default expiration: 900 seconds (15 minutes).
 */
export async function createSignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 900
): Promise<string> {
  const { client, bucketName } = getR2Client();
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Returns public CDN or custom-domain URL for public R2 assets if R2_PUBLIC_URL is configured.
 */
export function getPublicUrl(key: string): string | null {
  const publicBase = process.env.R2_PUBLIC_URL?.trim();
  if (!publicBase) return null;
  const sanitizedBase = publicBase.replace(/\/+$/, '');
  const sanitizedKey = key.replace(/^\/+/, '');
  return `${sanitizedBase}/${sanitizedKey}`;
}
