export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_CUSTOMER'
  | 'WAITING_FOR_CHENAB'
  | 'RESOLVED'
  | 'CLOSED';

export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type TicketCategory =
  | 'GENERAL'
  | 'A&R'
  | 'LEGAL'
  | 'BILLING'
  | 'DISTRIBUTION'
  | 'SUPPORT'
  | 'PRESS';

export type TicketDepartment =
  | 'A&R'
  | 'Finance'
  | 'Legal'
  | 'Distribution'
  | 'Support'
  | 'General';

export interface TicketAssignee {
  uid: string;
  name: string;
  email: string;
}

export interface TicketAttachment {
  id: string;
  storageFileId?: string;
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
  signedUrl?: string;
  category?: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string; // e.g. "CHN-0001042"
  threadId: string;
  subject: string;
  canonicalSubject: string;
  requesterName: string;
  requesterEmail: string;
  requesterUserId?: string | null;
  artistId?: string | null;
  artistName?: string | null;

  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;

  assignedTo?: TicketAssignee | null;
  assignedDepartment?: TicketDepartment | null;

  sourceEmailIdentity: string; // e.g. "support@chenabmedia.in" or identity id

  lastMessageAt: string;
  lastMessageDirection: 'INBOUND' | 'OUTBOUND';
  lastSnippet: string;
  messageCount?: number;

  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  closedBy?: TicketAssignee | null;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  threadId: string;

  direction: 'INBOUND' | 'OUTBOUND';
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];

  subject: string;
  text: string;
  html?: string;

  messageId: string;
  inReplyTo?: string | null;
  references?: string[];

  senderName: string;
  isInternalNote?: boolean;

  attachments?: TicketAttachment[];

  createdAt: string;
  providerEventId?: string | null;
  sentByStaffUid?: string | null;
  sentByStaffName?: string | null;
}

export type TicketEventType =
  | 'TICKET_CREATED'
  | 'MESSAGE_RECEIVED'
  | 'MESSAGE_SENT'
  | 'NOTE_ADDED'
  | 'STATUS_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'ASSIGNED'
  | 'UNASSIGNED'
  | 'CATEGORY_CHANGED'
  | 'ATTACHMENT_ADDED'
  | 'TICKET_RESOLVED'
  | 'TICKET_CLOSED'
  | 'REOPENED'
  | 'ARTIST_LINKED'
  | 'ARTIST_UNLINKED';

export interface TicketEvent {
  id: string;
  ticketId: string;
  type: TicketEventType;
  actorUid: string;
  actorName: string;
  actorEmail: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
