import { adminDb } from './admin';
import { db, handleFirestoreError, OperationType } from './firestore';
import { collection, addDoc } from 'firebase/firestore';
import { AuditLogEntry } from '@/types/admin';

export interface RecordAuditLogParams {
  actorUid?: string;
  actorName?: string;
  actorEmail?: string;
  actor?: { uid: string; name?: string; email: string };
  action: AuditLogEntry['action'];
  targetType: AuditLogEntry['targetType'];
  targetId: string;
  description: string;
  metadata?: Record<string, any>;
  requestHeaders?: { ip?: string; userAgent?: string };
}

export async function recordAuditLog(
  actorOrParams: RecordAuditLogParams | { uid: string; name?: string; email: string },
  actionArg?: AuditLogEntry['action'],
  targetTypeArg?: AuditLogEntry['targetType'],
  targetIdArg?: string,
  descriptionArg?: string,
  metadataArg?: Record<string, any>,
  requestHeadersArg?: { ip?: string; userAgent?: string }
): Promise<string> {
  let actorUid = 'system';
  let actorName = 'System';
  let actorEmail = 'system@chenabmedia.com';
  let action: AuditLogEntry['action'] = 'RELEASE_MODIFIED';
  let targetType: AuditLogEntry['targetType'] = 'release';
  let targetId = '';
  let description = '';
  let metadata: Record<string, any> = {};
  let requestHeaders: { ip?: string; userAgent?: string } | undefined = undefined;

  if (typeof actorOrParams === 'object' && 'action' in actorOrParams) {
    // Object signature
    const params = actorOrParams as RecordAuditLogParams;
    actorUid = params.actorUid || params.actor?.uid || 'system';
    actorName = params.actorName || params.actor?.name || 'System';
    actorEmail = params.actorEmail || params.actor?.email || 'system@chenabmedia.com';
    action = params.action;
    targetType = params.targetType;
    targetId = params.targetId;
    description = params.description;
    metadata = params.metadata || {};
    requestHeaders = params.requestHeaders;
  } else {
    // Positional signature
    const actor = actorOrParams as { uid: string; name?: string; email: string };
    actorUid = actor.uid;
    actorName = actor.name || actor.email?.split('@')[0] || 'User';
    actorEmail = actor.email || '';
    action = actionArg!;
    targetType = targetTypeArg!;
    targetId = targetIdArg!;
    description = descriptionArg!;
    metadata = metadataArg || {};
    requestHeaders = requestHeadersArg;
  }

  const now = new Date().toISOString();
  const logData = {
    actorUid,
    actorName,
    actorEmail,
    action,
    targetType,
    targetId,
    description,
    metadata,
    timestamp: now,
    ipAddress: requestHeaders?.ip || '127.0.0.1',
    userAgent: requestHeaders?.userAgent || 'Internal-Server',
  };

  try {
    if (adminDb) {
      const docRef = await adminDb.collection('auditLogs').add(logData);
      return docRef.id;
    } else {
      const docRef = await addDoc(collection(db, 'auditLogs'), logData);
      return docRef.id;
    }
  } catch (error) {
    console.error('Failed to record audit log:', error);
    try {
      handleFirestoreError(error, OperationType.CREATE, 'auditLogs');
    } catch (e) {
      // Return fallback ID rather than crashing caller
    }
    return `local-log-${Date.now()}`;
  }
}
