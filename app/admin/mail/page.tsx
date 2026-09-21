'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import {
  Ticket,
  TicketMessage,
  TicketEvent,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketDepartment,
  TicketAttachment,
} from '@/types/tickets';
import { EmailIdentity } from '@/types/site';
import {
  Mail,
  Inbox,
  Send,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Tag,
  Paperclip,
  Lock,
  MessageSquare,
  Shield,
  Filter,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  FileText,
  Download,
  Eye,
  History,
  Trash2,
  X,
  ExternalLink,
  Menu,
  Sparkles,
} from 'lucide-react';

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'Open', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  WAITING_FOR_CUSTOMER: { label: 'Waiting on Customer', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  WAITING_FOR_CHENAB: { label: 'Action Required', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
  RESOLVED: { label: 'Resolved', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  CLOSED: { label: 'Closed', color: 'text-zinc-400', bg: 'bg-zinc-800/40 border-zinc-700/30' },
};

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; dot: string; color: string }> = {
  LOW: { label: 'Low', dot: 'bg-zinc-400', color: 'text-zinc-400' },
  NORMAL: { label: 'Normal', dot: 'bg-blue-400', color: 'text-blue-400' },
  HIGH: { label: 'High', dot: 'bg-amber-400', color: 'text-amber-400' },
  URGENT: { label: 'Urgent', dot: 'bg-rose-500 animate-pulse', color: 'text-rose-400' },
};

const DEPARTMENTS: TicketDepartment[] = ['A&R', 'Finance', 'Legal', 'Distribution', 'Support', 'General'];
const CATEGORIES: TicketCategory[] = ['GENERAL', 'A&R', 'LEGAL', 'BILLING', 'DISTRIBUTION', 'SUPPORT', 'PRESS'];

export default function AdminMailPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'LIST' | 'CONVERSATION'>('LIST');

  // Tickets List State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Filters State
  const [activeFolder, setActiveFolder] = useState<
    'inbox' | 'assigned_me' | 'unassigned' | 'waiting_chenab' | 'waiting_customer' | 'resolved' | 'closed'
  >('inbox');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Ticket Detail State
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Email Identities
  const [identities, setIdentities] = useState<EmailIdentity[]>([]);

  // Reply Composer State
  const [activeComposerTab, setActiveComposerTab] = useState<'REPLY' | 'NOTE'>('REPLY');
  const [replyIdentityId, setReplyIdentityId] = useState<string>('');
  const [replyText, setReplyText] = useState('');
  const [replyCc, setReplyCc] = useState('');
  const [replyBcc, setReplyBcc] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState<TicketAttachment[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  // Internal Note State
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Create Ticket Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newRecipientEmail, setNewRecipientEmail] = useState('');
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newPriority, setNewPriority] = useState<TicketPriority>('NORMAL');
  const [newCategory, setNewCategory] = useState<TicketCategory>('GENERAL');
  const [newDepartment, setNewDepartment] = useState<TicketDepartment>('Support');
  const [newIdentityId, setNewIdentityId] = useState('');
  const [newMessageText, setNewMessageText] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);

  // Artist linking modal
  const [showArtistModal, setShowArtistModal] = useState(false);
  const [artistsList, setArtistsList] = useState<{ id: string; name: string; email?: string }[]>([]);
  const [artistSearch, setArtistSearch] = useState('');
  const [loadingArtists, setLoadingArtists] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // 1. Fetch Email Identities
  useEffect(() => {
    const loadIdentities = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/admin/email-identities', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.identities) {
            setIdentities(data.identities);
            if (data.identities.length > 0 && !replyIdentityId) {
              setReplyIdentityId(data.identities[0].id);
              setNewIdentityId(data.identities[0].id);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load email identities:', err);
      }
    };
    loadIdentities();
  }, [user]);

  // 2. Fetch Tickets with active filters
  const fetchTickets = async () => {
    if (!user) return;
    setLoadingTickets(true);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams();

      if (activeFolder === 'assigned_me') {
        params.set('assignedTo', 'me');
      } else if (activeFolder === 'unassigned') {
        params.set('assignedTo', 'unassigned');
      } else if (activeFolder === 'waiting_chenab') {
        params.set('status', 'WAITING_FOR_CHENAB');
      } else if (activeFolder === 'waiting_customer') {
        params.set('status', 'WAITING_FOR_CUSTOMER');
      } else if (activeFolder === 'resolved') {
        params.set('status', 'RESOLVED');
      } else if (activeFolder === 'closed') {
        params.set('status', 'CLOSED');
      }

      if (selectedPriority !== 'ALL') {
        params.set('priority', selectedPriority);
      }
      if (selectedDepartment !== 'ALL') {
        params.set('department', selectedDepartment);
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const res = await fetch(`/api/admin/tickets?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        // Automatically select the first ticket if none is selected
        if (!selectedTicketId && data.tickets && data.tickets.length > 0) {
          setSelectedTicketId(data.tickets[0].id);
        }
      } else {
        showNotification('error', 'Failed to fetch tickets');
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      showNotification('error', 'Network error fetching tickets');
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user, activeFolder, selectedPriority, selectedDepartment]);

  // 3. Load Selected Ticket Details
  const loadTicketDetails = async (id: string) => {
    if (!user || !id) return;
    setLoadingDetail(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/tickets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data.ticket);
        setMessages(data.messages || []);
        setEvents(data.events || []);

        // Pick suitable identity for reply
        if (data.ticket?.sourceEmailIdentity && identities.length > 0) {
          const match = identities.find((i) => i.email === data.ticket.sourceEmailIdentity);
          if (match) {
            setReplyIdentityId(match.id);
          }
        }
      } else {
        showNotification('error', 'Could not load conversation details');
      }
    } catch (err) {
      console.error('Error loading ticket details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (selectedTicketId) {
      loadTicketDetails(selectedTicketId);
    }
  }, [selectedTicketId]);

  // Scroll to bottom of message thread on update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. Update Ticket Metadata (Status, Priority, Category, Assignee, Department)
  const updateTicketField = async (fields: Partial<Ticket>) => {
    if (!user || !selectedTicket) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fields),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data.ticket);
        setTickets((prev) =>
          prev.map((t) => (t.id === data.ticket.id ? { ...t, ...data.ticket } : t))
        );
        showNotification('success', 'Ticket updated');
        // Refresh events
        loadTicketDetails(selectedTicket.id);
      } else {
        const errData = await res.json();
        showNotification('error', errData.error || 'Failed to update ticket');
      }
    } catch (err) {
      showNotification('error', 'Network error updating ticket');
    }
  };

  // 5. Send Email Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTicket || !replyText.trim()) return;

    setSendingReply(true);
    try {
      const token = await user.getIdToken();
      const ccList = replyCc ? replyCc.split(',').map((e) => e.trim()).filter(Boolean) : [];
      const bccList = replyBcc ? replyBcc.split(',').map((e) => e.trim()).filter(Boolean) : [];
      const attachmentFileIds = replyAttachments
        .map((a) => a.storageFileId || a.id)
        .filter(Boolean);

      const res = await fetch(`/api/admin/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senderIdentityId: replyIdentityId || identities[0]?.id || selectedTicket.sourceEmailIdentity,
          bodyText: replyText,
          cc: ccList,
          bcc: bccList,
          attachmentFileIds,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReplyText('');
        setReplyCc('');
        setReplyBcc('');
        setReplyAttachments([]);
        setShowCcBcc(false);
        showNotification('success', 'Email reply dispatched via Resend');
        loadTicketDetails(selectedTicket.id);
        fetchTickets();
      } else {
        showNotification('error', data.error || 'Failed to send reply');
      }
    } catch (err) {
      showNotification('error', 'Network error sending reply');
    } finally {
      setSendingReply(false);
    }
  };

  // 6. Save Internal Staff Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTicket || !noteText.trim()) return;

    setSavingNote(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/tickets/${selectedTicket.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          noteText,
          attachments: replyAttachments,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNoteText('');
        setReplyAttachments([]);
        showNotification('success', 'Internal note added');
        loadTicketDetails(selectedTicket.id);
      } else {
        showNotification('error', data.error || 'Failed to save note');
      }
    } catch (err) {
      showNotification('error', 'Network error adding note');
    } finally {
      setSavingNote(false);
    }
  };

  // 7. Upload Attachment directly to R2 for Ticket
  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedTicket) return;

    setUploadingAttachment(true);
    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/admin/tickets/${selectedTicket.id}/attachments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.attachment) {
        setReplyAttachments((prev) => [...prev, data.attachment]);
        showNotification('success', `Uploaded ${data.attachment.filename} to Cloudflare R2`);
      } else {
        showNotification('error', data.error || 'Failed to upload attachment');
      }
    } catch (err) {
      showNotification('error', 'Attachment upload failed');
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 8. Create New Ticket Modal Submission
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newSubject.trim() || !newRecipientEmail.trim() || !newMessageText.trim()) return;

    setCreatingTicket(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: newSubject.trim(),
          requesterEmail: newRecipientEmail.trim(),
          requesterName: newRecipientName.trim() || newRecipientEmail.split('@')[0],
          priority: newPriority,
          category: newCategory,
          department: newDepartment,
          sourceEmailIdentity:
            identities.find((i) => i.id === newIdentityId)?.email || 'contact@chenabmedia.in',
          initialMessage: newMessageText.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.ticket) {
        showNotification('success', `Created ticket ${data.ticket.ticketNumber}`);
        setShowCreateModal(false);
        setNewSubject('');
        setNewRecipientEmail('');
        setNewRecipientName('');
        setNewMessageText('');
        fetchTickets();
        setSelectedTicketId(data.ticket.id);
      } else {
        showNotification('error', data.error || 'Failed to create ticket');
      }
    } catch (err) {
      showNotification('error', 'Network error creating ticket');
    } finally {
      setCreatingTicket(false);
    }
  };

  // 9. Load Artists for Linking Modal
  const loadArtists = async () => {
    if (!user) return;
    setLoadingArtists(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/artists', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setArtistsList(data.artists || []);
      }
    } catch (err) {
      console.warn('Could not load artists list:', err);
    } finally {
      setLoadingArtists(false);
    }
  };

  const handleLinkArtist = async (artist: { id: string; name: string }) => {
    await updateTicketField({ artistId: artist.id, artistName: artist.name });
    setShowArtistModal(false);
  };

  const handleUnlinkArtist = async () => {
    await updateTicketField({ artistId: null, artistName: null });
  };

  // Formatting helpers
  const formatTimeAgo = (isoDate?: string) => {
    if (!isoDate) return '';
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(isoDate).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex h-screen bg-black text-zinc-100 overflow-hidden font-sans antialiased">
      {/* Sidebar Navigation */}
      <AdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Mail Application Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Operational Bar */}
        <header className="h-14 border-b border-zinc-800 bg-zinc-950 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Inbox className="w-4 h-4" />
              </div>
              <h1 className="text-sm font-semibold tracking-wide text-zinc-100">CHENAB MAIL & TICKETS</h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {feedback && (
              <div
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {feedback.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{feedback.message}</span>
              </div>
            )}
            <button
              onClick={() => fetchTickets()}
              disabled={loadingTickets}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="Refresh inbox"
            >
              <RefreshCw className={`w-4 h-4 ${loadingTickets ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-400 text-black px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Ticket</span>
            </button>
          </div>
        </header>

        {/* 3-Pane Mail Workspace */}
        <div className="flex-1 flex min-h-0 relative">
          {/* PANE 1: Folder Navigation & Filters (Desktop only) */}
          <aside className="w-56 border-r border-zinc-800/80 bg-zinc-950/70 p-3 hidden md:flex flex-col justify-between shrink-0">
            <div className="space-y-4">
              {/* Primary Views */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase px-2 mb-1">
                  Mailboxes
                </div>
                {[
                  { id: 'inbox', label: 'All Inbound & Tickets', icon: Inbox },
                  { id: 'waiting_chenab', label: 'Action Required', icon: AlertCircle, countClass: 'text-rose-400' },
                  { id: 'assigned_me', label: 'Assigned to Me', icon: User },
                  { id: 'unassigned', label: 'Unassigned', icon: Shield },
                  { id: 'waiting_customer', label: 'Waiting on Customer', icon: Clock },
                  { id: 'resolved', label: 'Resolved', icon: CheckCircle },
                  { id: 'closed', label: 'Closed Archive', icon: FileText },
                ].map((folder) => {
                  const Icon = folder.icon;
                  const isActive = activeFolder === folder.id;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => setActiveFolder(folder.id as any)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                        isActive
                          ? 'bg-zinc-800 text-white font-semibold'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                        <span>{folder.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Department Filters */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase px-2 mb-1">
                  Departments
                </div>
                <button
                  onClick={() => setSelectedDepartment('ALL')}
                  className={`w-full text-left px-2.5 py-1 rounded text-xs transition ${
                    selectedDepartment === 'ALL'
                      ? 'text-white font-medium bg-zinc-900'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  All Departments
                </button>
                {DEPARTMENTS.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDepartment(dept)}
                    className={`w-full text-left px-2.5 py-1 rounded text-xs transition ${
                      selectedDepartment === dept
                        ? 'text-emerald-400 font-medium bg-emerald-500/10'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>

              {/* Priority Filters */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase px-2 mb-1">
                  Priority
                </div>
                <div className="flex flex-wrap gap-1 px-1">
                  {['ALL', 'URGENT', 'HIGH', 'NORMAL', 'LOW'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setSelectedPriority(p)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition border ${
                        selectedPriority === p
                          ? 'bg-zinc-800 text-white border-zinc-700'
                          : 'text-zinc-400 border-transparent hover:text-zinc-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Storage & Engine Note */}
            <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-400">
              <div className="flex items-center space-x-1.5 text-zinc-300 font-medium mb-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cloudflare R2 Object Storage</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-tight">
                Attachments encrypted & secured under isolated ticket prefixes.
              </p>
            </div>
          </aside>

          {/* PANE 2: Ticket List (Desktop always, Mobile when mobileView === 'LIST') */}
          <section
            className={`w-full md:w-80 lg:w-96 border-r border-zinc-800 flex flex-col bg-zinc-950 shrink-0 ${
              mobileView === 'CONVERSATION' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search Input */}
            <div className="p-3 border-b border-zinc-800/80 bg-zinc-950/90">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search subject, sender, #ticket..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') fetchTickets();
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* Tickets Count Header */}
            <div className="px-3 py-2 bg-zinc-900/30 border-b border-zinc-800/50 flex items-center justify-between text-[11px] text-zinc-400">
              <span>{tickets.length} conversation{tickets.length === 1 ? '' : 's'}</span>
              <span className="capitalize">{activeFolder.replace('_', ' ')}</span>
            </div>

            {/* Ticket Cards List */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/50">
              {loadingTickets ? (
                <div className="p-8 text-center text-zinc-400 text-xs flex flex-col items-center">
                  <RefreshCw className="w-5 h-5 animate-spin mb-2 text-zinc-400" />
                  Loading mail stream...
                </div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 text-xs">
                  <Inbox className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
                  No tickets found in this view.
                </div>
              ) : (
                tickets.map((t) => {
                  const isSelected = selectedTicketId === t.id;
                  const statusConf = STATUS_CONFIG[t.status] || STATUS_CONFIG.OPEN;
                  const priorityConf = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.NORMAL;

                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTicketId(t.id);
                        setMobileView('CONVERSATION');
                      }}
                      className={`p-3 cursor-pointer transition flex flex-col space-y-1.5 ${
                        isSelected
                          ? 'bg-zinc-900 border-l-2 border-emerald-500'
                          : 'hover:bg-zinc-900/50 border-l-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-zinc-400 font-semibold">{t.ticketNumber}</span>
                        <span className="text-[10px] text-zinc-400">{formatTimeAgo(t.lastMessageAt)}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-zinc-100 truncate">{t.requesterName}</span>
                        {t.artistName && (
                          <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.2 rounded font-medium truncate max-w-[100px]">
                            {t.artistName}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-zinc-300 font-medium truncate">{t.subject}</div>

                      <div className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {t.lastSnippet || 'No preview available'}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${statusConf.bg} ${statusConf.color}`}>
                          {statusConf.label}
                        </span>

                        <div className="flex items-center space-x-2 text-[10px] text-zinc-400">
                          {t.assignedTo && (
                            <span className="flex items-center space-x-1 text-zinc-300">
                              <User className="w-3 h-3" />
                              <span className="truncate max-w-[80px]">{t.assignedTo.name.split(' ')[0]}</span>
                            </span>
                          )}
                          <div className="flex items-center space-x-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${priorityConf.dot}`} />
                            <span>{priorityConf.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* PANE 3: Conversation View & Action Panel */}
          <main
            className={`flex-1 flex flex-col min-w-0 bg-black overflow-hidden ${
              mobileView === 'LIST' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {selectedTicket ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-zinc-800 bg-zinc-950/80 flex flex-col space-y-3 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setMobileView('LIST')}
                        className="p-1 rounded text-zinc-400 hover:text-white md:hidden"
                      >
                        <ChevronRight className="w-5 h-5 rotate-180" />
                      </button>
                      <span className="text-xs font-mono font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                        {selectedTicket.ticketNumber}
                      </span>
                      <h2 className="text-sm font-semibold text-zinc-100 truncate max-w-md">
                        {selectedTicket.subject}
                      </h2>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs transition border ${
                          showHistory
                            ? 'bg-zinc-800 text-white border-zinc-700'
                            : 'text-zinc-400 border-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Audit Log</span>
                      </button>
                    </div>
                  </div>

                  {/* Metadata & Controls Ribbon */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/60 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Status Dropdown */}
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => updateTicketField({ status: e.target.value as TicketStatus })}
                        className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                      >
                        {Object.entries(STATUS_CONFIG).map(([st, conf]) => (
                          <option key={st} value={st}>
                            Status: {conf.label}
                          </option>
                        ))}
                      </select>

                      {/* Priority Dropdown */}
                      <select
                        value={selectedTicket.priority}
                        onChange={(e) => updateTicketField({ priority: e.target.value as TicketPriority })}
                        className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                      >
                        {Object.entries(PRIORITY_CONFIG).map(([p, conf]) => (
                          <option key={p} value={p}>
                            Priority: {conf.label}
                          </option>
                        ))}
                      </select>

                      {/* Department Dropdown */}
                      <select
                        value={selectedTicket.assignedDepartment || ''}
                        onChange={(e) =>
                          updateTicketField({
                            assignedDepartment: (e.target.value || null) as TicketDepartment,
                          })
                        }
                        className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">Dept: None</option>
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            Dept: {dept}
                          </option>
                        ))}
                      </select>

                      {/* Assign to Me button */}
                      {userProfile && selectedTicket.assignedTo?.uid !== userProfile.uid ? (
                        <button
                          onClick={() =>
                            updateTicketField({
                              assignedTo: {
                                uid: userProfile.uid,
                                name: userProfile.displayName || userProfile.email,
                                email: userProfile.email,
                              },
                            })
                          }
                          className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium"
                        >
                          Assign to Me
                        </button>
                      ) : (
                        <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                          Assigned to You
                        </span>
                      )}
                    </div>

                    {/* Artist Link Pill */}
                    <div className="flex items-center space-x-2">
                      {selectedTicket.artistId ? (
                        <div className="flex items-center space-x-1.5 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full text-purple-300">
                          <Tag className="w-3 h-3 text-purple-400" />
                          <span>Artist: {selectedTicket.artistName || 'Linked'}</span>
                          <button
                            onClick={handleUnlinkArtist}
                            className="ml-1 hover:text-rose-400 text-zinc-400"
                            title="Unlink artist"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setShowArtistModal(true);
                            loadArtists();
                          }}
                          className="flex items-center space-x-1 text-zinc-400 hover:text-zinc-200 text-xs underline decoration-zinc-700"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Link Artist Profile</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Audit History Drawer / Section (Collapsible) */}
                {showHistory && (
                  <div className="p-3 bg-zinc-950 border-b border-zinc-800 max-h-48 overflow-y-auto text-xs space-y-1.5">
                    <div className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
                      Event Timeline & Audit Log
                    </div>
                    {events.map((ev) => (
                      <div key={ev.id} className="flex items-center justify-between text-[11px] text-zinc-400 py-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-zinc-200 font-mono text-[10px]">{ev.type}</span>
                          <span className="text-zinc-400">by {ev.actorName}</span>
                        </div>
                        <span className="text-zinc-400">{formatTimeAgo(ev.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/40">
                  {loadingDetail ? (
                    <div className="text-center py-12 text-zinc-400 text-xs">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                      Loading messages...
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isInternal = msg.isInternalNote;
                      const isOutbound = msg.direction === 'OUTBOUND' && !isInternal;
                      const isInbound = msg.direction === 'INBOUND';

                      if (isInternal) {
                        return (
                          <div
                            key={msg.id}
                            className="p-3 rounded-lg bg-amber-950/20 border border-amber-600/30 text-xs space-y-1.5 max-w-2xl mx-auto"
                          >
                            <div className="flex items-center justify-between text-amber-400 font-medium">
                              <div className="flex items-center space-x-1.5">
                                <Lock className="w-3.5 h-3.5" />
                                <span>INTERNAL STAFF NOTE — Visible only to CHENAB team</span>
                              </div>
                              <span className="text-amber-400/80 text-[10px]">{formatTimeAgo(msg.createdAt)}</span>
                            </div>
                            <div className="text-zinc-200 whitespace-pre-wrap leading-relaxed">
                              {msg.text}
                            </div>
                            <div className="text-[10px] text-amber-500/80">
                              By {msg.sentByStaffName || msg.senderName}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-2xl rounded-xl p-4 space-y-2 border text-xs shadow-sm ${
                              isOutbound
                                ? 'bg-zinc-900 border-zinc-700/60 text-zinc-100 rounded-br-none'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-200 rounded-bl-none'
                            }`}
                          >
                            {/* Message Header */}
                            <div className="flex items-center justify-between space-x-4 pb-2 border-b border-zinc-800/60 text-[11px] text-zinc-400">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-semibold text-zinc-200">
                                  {isOutbound ? `CHENAB (${msg.sentByStaffName || 'Staff'})` : msg.senderName}
                                </span>
                                <span className="text-zinc-400">&lt;{msg.from}&gt;</span>
                              </div>
                              <span className="text-[10px] text-zinc-400">{formatTimeAgo(msg.createdAt)}</span>
                            </div>

                            {/* Body Content */}
                            {msg.html ? (
                              <div
                                className="prose prose-invert prose-xs max-w-none break-words leading-relaxed text-zinc-200"
                                dangerouslySetInnerHTML={{ __html: msg.html }}
                              />
                            ) : (
                              <div className="whitespace-pre-wrap break-words leading-relaxed">
                                {msg.text}
                              </div>
                            )}

                            {/* Attachments Section */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="pt-2 border-t border-zinc-800/60 space-y-1.5">
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                  Attachments ({msg.attachments.length})
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {msg.attachments.map((att) => (
                                    <a
                                      key={att.id}
                                      href={att.signedUrl || att.url || '#'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center space-x-2 bg-zinc-900 border border-zinc-700/60 hover:border-emerald-500/50 px-2.5 py-1.5 rounded-md text-xs text-zinc-200 transition group"
                                    >
                                      <Paperclip className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-400" />
                                      <span className="font-medium truncate max-w-[140px]">{att.filename}</span>
                                      <span className="text-[10px] text-zinc-400">({formatFileSize(att.size)})</span>
                                      <Download className="w-3 h-3 text-zinc-400 group-hover:text-white" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Bottom Action / Composer Pane */}
                <div className="border-t border-zinc-800 bg-zinc-950 p-3 shrink-0">
                  {/* Tabs: Reply vs Internal Note */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                      <button
                        onClick={() => setActiveComposerTab('REPLY')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                          activeComposerTab === 'REPLY'
                            ? 'bg-zinc-800 text-white font-semibold shadow'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Reply to Customer
                      </button>
                      <button
                        onClick={() => setActiveComposerTab('NOTE')}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-medium transition ${
                          activeComposerTab === 'NOTE'
                            ? 'bg-amber-950/40 text-amber-300 font-semibold border border-amber-600/30'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <Lock className="w-3 h-3" />
                        <span>Internal Note</span>
                      </button>
                    </div>

                    {activeComposerTab === 'REPLY' && (
                      <div className="flex items-center space-x-2">
                        {/* Sender Identity Selector */}
                        <div className="flex items-center space-x-1.5 text-xs">
                          <span className="text-zinc-400">From:</span>
                          <select
                            value={replyIdentityId}
                            onChange={(e) => setReplyIdentityId(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-xs text-zinc-200 focus:outline-none"
                          >
                            {identities.map((id) => (
                              <option key={id.id} value={id.id}>
                                {id.displayName} &lt;{id.email}&gt;
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          onClick={() => setShowCcBcc(!showCcBcc)}
                          className="text-[11px] text-zinc-400 hover:text-zinc-200 underline"
                        >
                          CC/BCC
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CC / BCC fields if enabled */}
                  {activeComposerTab === 'REPLY' && showCcBcc && (
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="CC (comma separated)"
                        value={replyCc}
                        onChange={(e) => setReplyCc(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-100 placeholder-zinc-400"
                      />
                      <input
                        type="text"
                        placeholder="BCC (comma separated)"
                        value={replyBcc}
                        onChange={(e) => setReplyBcc(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-100 placeholder-zinc-400"
                      />
                    </div>
                  )}

                  {/* Composer Input Area */}
                  {activeComposerTab === 'REPLY' ? (
                    <form onSubmit={handleSendReply} className="space-y-2">
                      <textarea
                        rows={3}
                        placeholder={`Write reply to ${selectedTicket.requesterEmail}...`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-500/50 resize-y"
                      />

                      {/* Staged Attachments */}
                      {replyAttachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 py-1">
                          {replyAttachments.map((att, idx) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-1.5 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[11px] text-zinc-300"
                            >
                              <Paperclip className="w-3 h-3 text-emerald-400" />
                              <span className="truncate max-w-[120px]">{att.filename}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setReplyAttachments((prev) => prev.filter((_, i) => i !== idx))
                                }
                                className="text-zinc-400 hover:text-rose-400"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleUploadAttachment}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAttachment}
                            className="flex items-center space-x-1 text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>{uploadingAttachment ? 'Uploading to R2...' : 'Attach Storage File'}</span>
                          </button>
                          <span className="text-[10px] text-zinc-400">Max 25 MB</span>
                        </div>

                        <button
                          type="submit"
                          disabled={sendingReply || !replyText.trim()}
                          className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide disabled:opacity-50 transition"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{sendingReply ? 'Sending via Resend...' : 'Send Reply'}</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleAddNote} className="space-y-2">
                      <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center space-x-1.5">
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>This note is private to CHENAB MEDIA administrators. No email will be sent.</span>
                      </div>
                      <textarea
                        rows={3}
                        placeholder="Add internal notes, next action steps, or verification findings..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-amber-500/50 resize-y"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={savingNote || !noteText.trim()}
                          className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-black px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide disabled:opacity-50 transition"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{savingNote ? 'Saving...' : 'Save Internal Note'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 text-xs p-8">
                <Inbox className="w-12 h-12 text-zinc-800 mb-3" />
                <p className="font-semibold text-zinc-400 text-sm">No ticket selected</p>
                <p className="text-zinc-400 mt-1">Select an email thread from the inbox to inspect or reply.</p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* CREATE TICKET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-lg w-full p-5 space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-zinc-100">Create New Ticket / Outbound Thread</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div>
                <label className="block text-zinc-400 mb-1">Recipient Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. artist@example.com"
                  value={newRecipientEmail}
                  onChange={(e) => setNewRecipientEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    placeholder="Full name or company"
                    value={newRecipientName}
                    onChange={(e) => setNewRecipientName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100 placeholder-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Send From Identity</label>
                  <select
                    value={newIdentityId}
                    onChange={(e) => setNewIdentityId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                  >
                    {identities.map((id) => (
                      <option key={id.id} value={id.id}>
                        {id.displayName} ({id.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Subject Line *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royalty statement inquiry / Release scheduling"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-zinc-400 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                  >
                    {Object.keys(PRIORITY_CONFIG).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TicketCategory)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Department</label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value as TicketDepartment)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Initial Outbound Message *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write message..."
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 text-zinc-300 hover:bg-zinc-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold disabled:opacity-50"
                >
                  {creatingTicket ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LINK ARTIST MODAL */}
      {showArtistModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-md w-full p-5 space-y-3 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="font-semibold text-zinc-100">Link Artist to Ticket</h3>
              <button onClick={() => setShowArtistModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search roster artists..."
                value={artistSearch}
                onChange={(e) => setArtistSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-400"
              />
            </div>
            <div className="max-h-60 overflow-y-auto divide-y divide-zinc-800/60 border border-zinc-800 rounded-lg">
              {loadingArtists ? (
                <div className="p-4 text-center text-zinc-400">Loading artists...</div>
              ) : (
                artistsList
                  .filter((a) => a.name.toLowerCase().includes(artistSearch.toLowerCase()))
                  .map((art) => (
                    <div
                      key={art.id}
                      onClick={() => handleLinkArtist(art)}
                      className="p-2.5 flex items-center justify-between hover:bg-zinc-900 cursor-pointer transition"
                    >
                      <div>
                        <span className="font-medium text-zinc-100">{art.name}</span>
                        {art.email && <span className="block text-[10px] text-zinc-400">{art.email}</span>}
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold">Select</span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
