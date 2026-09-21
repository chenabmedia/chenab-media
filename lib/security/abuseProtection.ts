import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebase/admin';

// In-memory fallback cache for rate-limiting when persistent store is unreachable
interface MemoryRateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryRateLimitStore = new Map<string, MemoryRateLimitRecord>();
const memoryEmailCooldownStore = new Map<string, number>();

/**
 * Extract client IP from trusted headers and hash it for privacy (GDPR compliant).
 */
export function getClientIp(req: NextRequest): string {
  // Check Vercel trusted edge headers, fallback to X-Forwarded-For, X-Real-IP, CF-Connecting-IP
  const forwardedFor =
    req.headers.get('x-vercel-forwarded-for') ||
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    '';

  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
  return clientIp || '127.0.0.1';
}

export function hashIdentifier(input: string): string {
  return crypto.createHash('sha256').update(input.trim().toLowerCase()).digest('hex');
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Persistent distributed rate limiter using Firestore transactions.
 * Supported target: 3 requests per IP per 10 minutes (600 seconds).
 */
export async function checkPersistentRateLimit(
  endpointKey: string,
  clientIp: string,
  limit: number = 3,
  windowSeconds: number = 600
): Promise<RateLimitResult> {
  const ipHash = hashIdentifier(clientIp);
  const docId = `rl_${endpointKey}_${ipHash}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  // 1. Try Upstash Redis REST if configured
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (upstashUrl && upstashToken) {
    try {
      const redisKey = `ratelimit:${endpointKey}:${ipHash}`;
      const incrRes = await fetch(`${upstashUrl}/incr/${redisKey}`, {
        headers: { Authorization: `Bearer ${upstashToken}` },
      });
      if (incrRes.ok) {
        const data = await incrRes.json();
        const currentCount = typeof data.result === 'number' ? data.result : 1;
        if (currentCount === 1) {
          await fetch(`${upstashUrl}/expire/${redisKey}/${windowSeconds}`, {
            headers: { Authorization: `Bearer ${upstashToken}` },
          });
        }
        if (currentCount <= limit) {
          return { allowed: true, remaining: limit - currentCount, resetAt: now + windowMs };
        }
        return { allowed: false, remaining: 0, resetAt: now + windowMs };
      }
    } catch (redisErr) {
      console.warn('[AbuseProtection] Upstash Redis check failed, falling back to Firestore:', redisErr);
    }
  }

  // 2. Persistent Firestore Store
  const db = getAdminDb();
  if (db) {
    try {
      const docRef = db.collection('rate_limits').doc(docId);
      const result = await db.runTransaction(async (t) => {
        const snap = await t.get(docRef);
        if (!snap.exists) {
          t.set(docRef, {
            count: 1,
            resetAt: now + windowMs,
            updatedAt: new Date().toISOString(),
          });
          return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
        }

        const data = snap.data() || {};
        const resetAt = typeof data.resetAt === 'number' ? data.resetAt : 0;
        const currentCount = typeof data.count === 'number' ? data.count : 0;

        if (now >= resetAt) {
          t.set(docRef, {
            count: 1,
            resetAt: now + windowMs,
            updatedAt: new Date().toISOString(),
          });
          return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
        }

        if (currentCount < limit) {
          t.update(docRef, {
            count: currentCount + 1,
            updatedAt: new Date().toISOString(),
          });
          return { allowed: true, remaining: limit - (currentCount + 1), resetAt };
        }

        return { allowed: false, remaining: 0, resetAt };
      });

      return result;
    } catch (firestoreErr) {
      console.warn('[AbuseProtection] Firestore transaction rate limit error, using memory fallback:', firestoreErr);
    }
  }

  // 3. In-memory fallback
  const memKey = `${endpointKey}:${ipHash}`;
  const existing = memoryRateLimitStore.get(memKey);
  if (!existing || now >= existing.resetAt) {
    memoryRateLimitStore.set(memKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count < limit) {
    existing.count += 1;
    return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
  }

  return { allowed: false, remaining: 0, resetAt: existing.resetAt };
}

export interface EmailCooldownResult {
  allowed: boolean;
  nextAllowedAt?: number;
}

/**
 * Persistent distributed cooldown for confirmation emails (max 1 per recipient per hour).
 */
export async function checkAndApplyEmailCooldown(
  email: string,
  cooldownSeconds: number = 3600
): Promise<EmailCooldownResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const emailHash = hashIdentifier(normalizedEmail);
  const docId = `ec_${emailHash}`;
  const now = Date.now();
  const cooldownMs = cooldownSeconds * 1000;

  const db = getAdminDb();
  if (db) {
    try {
      const docRef = db.collection('email_cooldowns').doc(docId);
      const result = await db.runTransaction(async (t) => {
        const snap = await t.get(docRef);
        if (!snap.exists) {
          t.set(docRef, {
            emailHash,
            lastSentAt: now,
            nextAllowedAt: now + cooldownMs,
            updatedAt: new Date().toISOString(),
          });
          return { allowed: true };
        }

        const data = snap.data() || {};
        const nextAllowedAt = typeof data.nextAllowedAt === 'number' ? data.nextAllowedAt : 0;

        if (now >= nextAllowedAt) {
          t.update(docRef, {
            lastSentAt: now,
            nextAllowedAt: now + cooldownMs,
            updatedAt: new Date().toISOString(),
          });
          return { allowed: true };
        }

        return { allowed: false, nextAllowedAt };
      });

      return result;
    } catch (err) {
      console.warn('[AbuseProtection] Firestore email cooldown error, using memory fallback:', err);
    }
  }

  // In-memory fallback
  const nextAllowed = memoryEmailCooldownStore.get(emailHash);
  if (!nextAllowed || now >= nextAllowed) {
    memoryEmailCooldownStore.set(emailHash, now + cooldownMs);
    return { allowed: true };
  }

  return { allowed: false, nextAllowedAt: nextAllowed };
}

/**
 * Strict URL validator.
 * Accepts only http:// and https:// URLs.
 * Rejects javascript:, data:, file:, vbscript:, and protocol-relative (//evil.com).
 */
export function validateUrlString(rawUrl: string | undefined, fieldName: string): { valid: boolean; error?: string } {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return { valid: true };
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length > 2048) {
    return { valid: false, error: `${fieldName} exceeds maximum length of 2048 characters.` };
  }

  // Tokenize multiple URLs / links (separated by comma, semicolon, newline, or whitespace)
  const tokens = trimmed.split(/[\s,;\n]+/).filter(Boolean);

  for (const token of tokens) {
    const lowerToken = token.toLowerCase();

    // Check for banned dangerous schemes and protocol-relative prefixes
    if (
      lowerToken.startsWith('javascript:') ||
      lowerToken.startsWith('data:') ||
      lowerToken.startsWith('file:') ||
      lowerToken.startsWith('vbscript:') ||
      lowerToken.startsWith('blob:') ||
      lowerToken.startsWith('//')
    ) {
      return { valid: false, error: `${fieldName} contains an unsafe URL scheme or protocol-relative link.` };
    }

    // If it looks like a URL with scheme or www, parse and validate
    if (lowerToken.includes('://') || lowerToken.startsWith('http') || lowerToken.startsWith('www.')) {
      const urlToTest = lowerToken.startsWith('www.') ? `https://${token}` : token;
      try {
        const parsed = new URL(urlToTest);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return { valid: false, error: `${fieldName} contains an invalid URL protocol. Only HTTP and HTTPS are permitted.` };
        }
        if (!parsed.hostname || parsed.hostname.length < 3 || !parsed.hostname.includes('.')) {
          return { valid: false, error: `${fieldName} contains an invalid domain name.` };
        }
      } catch {
        return { valid: false, error: `${fieldName} contains a malformed URL.` };
      }
    }
  }

  return { valid: true };
}

export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export interface ValidatedContactData {
  name: string;
  email: string;
  department: string;
  subject: string;
  message: string;
}

export function validateContactPayload(body: any): { valid: boolean; error?: string; data?: ValidatedContactData } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body.' };
  }

  // 1. Honeypot check: reject immediately if website_confirm is filled
  const honeypot = body.website_confirm || body.hp_website_confirm || body.websiteConfirm;
  if (typeof honeypot === 'string' && honeypot.trim().length > 0) {
    return { valid: false, error: 'Invalid submission' };
  }

  const { name, email, department, subject, message } = body;

  // 2. Type and presence checks
  if (typeof name !== 'string' || typeof email !== 'string' || typeof subject !== 'string' || typeof message !== 'string') {
    return { valid: false, error: 'Missing or invalid required fields (name, email, subject, message).' };
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedSubject = subject.trim();
  const trimmedMessage = message.trim();
  const trimmedDept = typeof department === 'string' ? department.trim() : 'General Enquiries';

  // 3. Length limits
  if (trimmedName.length === 0 || trimmedName.length > 100) {
    return { valid: false, error: 'Name must be between 1 and 100 characters.' };
  }

  if (trimmedEmail.length === 0 || trimmedEmail.length > 254 || !EMAIL_REGEX.test(trimmedEmail)) {
    return { valid: false, error: 'Please provide a valid email address (maximum 254 characters).' };
  }

  if (trimmedSubject.length === 0 || trimmedSubject.length > 150) {
    return { valid: false, error: 'Subject must be between 1 and 150 characters.' };
  }

  if (trimmedMessage.length === 0 || trimmedMessage.length > 2000) {
    return { valid: false, error: 'Message must be between 1 and 2000 characters.' };
  }

  if (trimmedDept.length > 100) {
    return { valid: false, error: 'Department name cannot exceed 100 characters.' };
  }

  return {
    valid: true,
    data: {
      name: trimmedName,
      email: trimmedEmail,
      department: trimmedDept || 'General Enquiries',
      subject: trimmedSubject,
      message: trimmedMessage,
    },
  };
}

export interface ValidatedDemoData {
  artistName: string;
  email: string;
  phone: string;
  genre: string;
  socialLinks: string;
  streamingLinks: string;
  demoTitle: string;
  message: string;
  fileName: string;
}

export function validateDemoPayload(body: any): { valid: boolean; error?: string; data?: ValidatedDemoData } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body.' };
  }

  // 1. Honeypot check
  const honeypot = body.website_confirm || body.hp_website_confirm || body.websiteConfirm;
  if (typeof honeypot === 'string' && honeypot.trim().length > 0) {
    return { valid: false, error: 'Invalid submission' };
  }

  const {
    artistName,
    name,
    email,
    phone,
    genre,
    socialLinks,
    streamingLinks,
    demoTitle,
    message,
    fileName,
  } = body;

  const rawArtistName = typeof artistName === 'string' ? artistName : (typeof name === 'string' ? name : '');
  const trimmedArtistName = rawArtistName.trim();

  if (!trimmedArtistName || trimmedArtistName.length > 100) {
    return { valid: false, error: 'Artist/Collective Name must be between 1 and 100 characters.' };
  }

  if (typeof email !== 'string' || !email.trim()) {
    return { valid: false, error: 'Primary email address is required.' };
  }
  const trimmedEmail = email.trim().toLowerCase();
  if (trimmedEmail.length > 254 || !EMAIL_REGEX.test(trimmedEmail)) {
    return { valid: false, error: 'Please provide a valid email address (maximum 254 characters).' };
  }

  if (typeof demoTitle !== 'string' || !demoTitle.trim()) {
    return { valid: false, error: 'Demo title / working project name is required.' };
  }
  const trimmedDemoTitle = demoTitle.trim();
  if (trimmedDemoTitle.length > 150) {
    return { valid: false, error: 'Demo title cannot exceed 150 characters.' };
  }

  if (typeof genre !== 'string' || !genre.trim()) {
    return { valid: false, error: 'Primary genre/style is required.' };
  }
  const trimmedGenre = genre.trim();
  if (trimmedGenre.length > 100) {
    return { valid: false, error: 'Genre description cannot exceed 100 characters.' };
  }

  const trimmedPhone = typeof phone === 'string' ? phone.trim() : '';
  if (trimmedPhone.length > 50) {
    return { valid: false, error: 'Phone number cannot exceed 50 characters.' };
  }

  const trimmedMessage = typeof message === 'string' ? message.trim() : '';
  if (trimmedMessage.length > 2000) {
    return { valid: false, error: 'Artistic statement/message cannot exceed 2000 characters.' };
  }

  const trimmedFileName = typeof fileName === 'string' ? fileName.trim() : '';
  if (trimmedFileName.length > 255) {
    return { valid: false, error: 'Audio file name cannot exceed 255 characters.' };
  }

  const trimmedSocial = typeof socialLinks === 'string' ? socialLinks.trim() : '';
  if (trimmedSocial.length > 2048) {
    return { valid: false, error: 'Social media links cannot exceed 2048 characters.' };
  }
  const socialUrlValidation = validateUrlString(trimmedSocial, 'Social media links');
  if (!socialUrlValidation.valid) {
    return { valid: false, error: socialUrlValidation.error };
  }

  const trimmedStreaming = typeof streamingLinks === 'string' ? streamingLinks.trim() : '';
  if (trimmedStreaming.length > 2048) {
    return { valid: false, error: 'Streaming links cannot exceed 2048 characters.' };
  }
  const streamingUrlValidation = validateUrlString(trimmedStreaming, 'Streaming links');
  if (!streamingUrlValidation.valid) {
    return { valid: false, error: streamingUrlValidation.error };
  }

  return {
    valid: true,
    data: {
      artistName: trimmedArtistName,
      email: trimmedEmail,
      phone: trimmedPhone,
      genre: trimmedGenre,
      socialLinks: trimmedSocial,
      streamingLinks: trimmedStreaming,
      demoTitle: trimmedDemoTitle,
      message: trimmedMessage,
      fileName: trimmedFileName,
    },
  };
}
