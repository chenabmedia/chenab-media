import { Resend } from 'resend';
import { adminDb } from '@/lib/firebase/admin';
import { recordAuditLog } from '@/lib/firebase/audit';
import {
  EMAIL_TEMPLATES,
  EMAIL_TEMPLATE_CONFIGS,
  DEFAULT_GLOBAL_VARS,
  EmailTemplateKey,
  EmailTemplateConfig,
} from './templates';

export interface SendTemplateEmailOptions {
  templateKey: EmailTemplateKey;
  to: string | string[];
  from?: string;
  replyTo?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject?: string;
  variables?: Record<string, any>;
  actorEmail?: string;
  actorUid?: string;
  relatedId?: string;
  eventType?: string;
}

export interface SendTemplateEmailResult {
  success: boolean;
  resendId?: string;
  error?: string;
  statusCode?: number;
}

function normalizeEmailList(input?: string | string[]): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((e) => e.trim()).filter(Boolean);
  }
  return input
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
}

function formatSenderAddress(rawFrom?: string): string {
  const DEFAULT_SENDER = 'CHENAB MEDIA <admin@chenabmedia.in>';
  if (!rawFrom) return DEFAULT_SENDER;

  const trimmed = rawFrom.trim();

  // Extract email address if enclosed in < >
  const match = trimmed.match(/<([^>]+)>/);
  const emailPart = match ? match[1].trim() : (trimmed.includes('@') ? trimmed : `${trimmed}@chenabmedia.in`);

  // Verify domain ends with @chenabmedia.in
  const lowerEmail = emailPart.toLowerCase();
  if (!lowerEmail.endsWith('@chenabmedia.in')) {
    console.warn(`[sendTemplateEmail] Invalid sender domain ${emailPart}. Falling back to admin@chenabmedia.in`);
    return DEFAULT_SENDER;
  }

  // If already formatted like "Display Name <email@chenabmedia.in>"
  if (trimmed.includes('<') && trimmed.includes('>')) {
    return trimmed;
  }

  return `CHENAB MEDIA <${emailPart}>`;
}

export async function sendTemplateEmail(
  options: SendTemplateEmailOptions
): Promise<SendTemplateEmailResult> {
  // Enforce server-side execution only
  if (typeof window !== 'undefined') {
    throw new Error('sendTemplateEmail can only be called in a server-side context.');
  }

  const {
    templateKey,
    to,
    from,
    replyTo,
    cc,
    bcc,
    subject,
    variables = {},
    actorEmail,
    actorUid,
    relatedId,
    eventType = 'TRANSACTIONAL_EMAIL',
  } = options;

  const recipients = normalizeEmailList(to);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (recipients.length === 0) {
    return { success: false, error: 'At least one valid recipient email address is required.' };
  }

  for (const r of recipients) {
    if (!emailRegex.test(r)) {
      return { success: false, error: `Invalid recipient email format: ${r}` };
    }
  }

  const templateId = EMAIL_TEMPLATES[templateKey];
  const templateConfig: EmailTemplateConfig | undefined = EMAIL_TEMPLATE_CONFIGS[templateKey];

  if (!templateId || !templateConfig) {
    return { success: false, error: `Unknown template key: ${templateKey}` };
  }

  const formattedSender = formatSenderAddress(from);
  const ccList = normalizeEmailList(cc);
  const bccList = normalizeEmailList(bcc);
  const replyToList = normalizeEmailList(replyTo);

  // Merge default global variables with caller variables
  const mergedVars: Record<string, any> = {
    ...DEFAULT_GLOBAL_VARS,
    companyName: 'Chenab Media',
    labelName: 'CHENAB MEDIA',
    website: 'https://chenabmedia.in',
    supportEmail: 'admin@chenabmedia.in',
    year: new Date().getFullYear().toString(),
    ...variables,
  };

  // Convert nulls/undefineds to clean string representations for Resend
  Object.keys(mergedVars).forEach((key) => {
    if (mergedVars[key] === undefined || mergedVars[key] === null) {
      mergedVars[key] = '';
    }
  });

  const finalSubject = subject || (mergedVars.emailSubject as string) || templateConfig.defaultSubject;

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error(`[sendTemplateEmail] RESEND_API_KEY missing while attempting to send ${templateKey}`);

    // Create log entry for unconfigured service
    const logEntry = {
      templateKey,
      templateName: templateConfig.name,
      templateId: templateConfig.id,
      from: formattedSender,
      to: recipients.join(', '),
      subject: finalSubject,
      status: 'FAILED',
      resendId: null,
      error: 'Email service is not configured (RESEND_API_KEY missing)',
      eventType,
      relatedId: relatedId || null,
      sentBy: actorEmail || 'system',
      createdAt: new Date().toISOString(),
    };

    try {
      if (adminDb) {
        await adminDb.collection('emailLogs').add(logEntry);
      }
    } catch (e) {
      console.error('[sendTemplateEmail] Error writing emailLog:', e);
    }

    return {
      success: false,
      error: 'Email service is not configured',
      statusCode: 503,
    };
  }

  let resendId: string | undefined = undefined;
  let sendStatus: 'SENT' | 'FAILED' = 'SENT';
  let errorMessage: string | undefined = undefined;

  try {
    const resend = new Resend(resendApiKey);

    // Call Resend API with template ID and variables
    const sendResponse = (await resend.emails.send({
      from: formattedSender,
      to: recipients,
      cc: ccList.length > 0 ? ccList : undefined,
      bcc: bccList.length > 0 ? bccList : undefined,
      replyTo: replyToList.length > 0 ? replyToList : undefined,
      subject: finalSubject,
      template: {
        id: templateConfig.id,
        variables: mergedVars,
      },
    })) as any;

    if (sendResponse.error) {
      sendStatus = 'FAILED';
      errorMessage =
        typeof sendResponse.error === 'string'
          ? sendResponse.error
          : sendResponse.error.message || JSON.stringify(sendResponse.error);
    } else {
      resendId = sendResponse.data?.id;
    }
  } catch (err: any) {
    sendStatus = 'FAILED';
    errorMessage = err.message || 'Resend API dispatch error';
  }

  // Redact passwords and credentials from logged variables
  const safeVars = { ...mergedVars };
  const sensitiveKeys = ['password', 'temporaryPassword', 'token', 'secret', 'apiKey', 'credential'];
  Object.keys(safeVars).forEach((key) => {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      safeVars[key] = '[REDACTED]';
    }
  });

  const logEntry = {
    templateKey,
    templateName: templateConfig.name,
    templateId: templateConfig.id,
    from: formattedSender,
    to: recipients.join(', '),
    subject: finalSubject,
    status: sendStatus,
    resendId: resendId || null,
    error: errorMessage || null,
    eventType,
    relatedId: relatedId || null,
    variables: safeVars,
    sentBy: actorEmail || 'system',
    createdAt: new Date().toISOString(),
  };

  try {
    if (adminDb) {
      await adminDb.collection('emailLogs').add(logEntry);
    }
  } catch (e) {
    console.error('[sendTemplateEmail] Firestore emailLog write error:', e);
  }

  if (actorEmail || actorUid) {
    await recordAuditLog({
      actorUid: actorUid || 'system',
      actorName: 'System',
      actorEmail: actorEmail || 'system@chenabmedia.in',
      action: 'EMAIL_SENT',
      targetType: 'email_template',
      targetId: resendId || templateConfig.id,
      description: `Dispatched template "${templateConfig.name}" to ${recipients.join(', ')} [Status: ${sendStatus}]`,
      metadata: { templateKey, recipients, resendId, status: sendStatus },
    });
  }

  if (sendStatus === 'FAILED') {
    return {
      success: false,
      error: errorMessage || 'Failed to dispatch email via Resend.',
    };
  }

  return {
    success: true,
    resendId,
  };
}
