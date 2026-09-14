'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { EmailIdentity } from '@/types/site';
import { Send, CheckCircle, AlertCircle, Menu, Eye, Mail, Link as LinkIcon, Loader2 } from 'lucide-react';

export default function AdminEmailComposePage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [identities, setIdentities] = useState<EmailIdentity[]>([]);
  const [identitiesLoading, setIdentitiesLoading] = useState(true);
  const [selectedIdentityId, setSelectedIdentityId] = useState('');
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [buttonEnabled, setButtonEnabled] = useState(false);
  const [buttonLabel, setButtonLabel] = useState('Open Release Portal');
  const [buttonUrl, setButtonUrl] = useState('https://chenabmedia.in');

  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [identityFetchError, setIdentityFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    async function loadIdentities() {
      setIdentitiesLoading(true);
      setIdentityFetchError(null);

      try {
        if (!user) {
          throw new Error('Authentication required. Please sign in as admin.');
        }

        const token = await user.getIdToken();

        const res = await fetch('/api/admin/email-identities', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const contentType = res.headers.get('content-type') || '';
        let data: any = {};
        if (contentType.includes('application/json')) {
          data = await res.json();
        } else {
          throw new Error(`Server returned status ${res.status}`);
        }

        if (!res.ok) {
          throw new Error(data.error || `Server authorization error (${res.status})`);
        }

        if (data && data.identities && Array.isArray(data.identities)) {
          const mappedIdentities: EmailIdentity[] = data.identities.map((item: any) => ({
            ...item,
            id: item.id || item.suffix || item.email,
          }));
          const enabledIds = mappedIdentities.filter((i: EmailIdentity) => i.enabled !== false);
          setIdentities(enabledIds);
          if (enabledIds.length > 0) {
            setSelectedIdentityId((prev) => {
              if (prev && enabledIds.some((i: EmailIdentity) => i.id === prev)) {
                return prev;
              }
              const firstActiveChenab = enabledIds.find((i: EmailIdentity) => i.email && i.email.includes('@chenabmedia.in'));
              return firstActiveChenab ? firstActiveChenab.id : enabledIds[0].id;
            });
          } else {
            setSelectedIdentityId('');
          }
        } else {
          setIdentities([]);
          setSelectedIdentityId('');
        }
      } catch (err: any) {
        setIdentityFetchError(err.message || 'Failed to load sender identities');
        setIdentities([]);
      } finally {
        setIdentitiesLoading(false);
      }
    }

    loadIdentities();
  }, [user, authLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    // Client-side validation check
    if (!selectedIdentityId) {
      setErrorMsg('Select a sender identity before sending.');
      setSending(false);
      return;
    }
    if (!to.trim()) {
      setErrorMsg('Recipient email is required.');
      setSending(false);
      return;
    }
    if (!subject.trim()) {
      setErrorMsg('Subject line is required.');
      setSending(false);
      return;
    }
    if (!message.trim()) {
      setErrorMsg('Message body is required.');
      setSending(false);
      return;
    }

    try {
      if (!user) {
        throw new Error('Authentication required. Please sign in.');
      }

      const token = await user.getIdToken();

      const res = await fetch('/api/admin/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senderIdentityId: selectedIdentityId,
          to: to.trim(),
          cc: cc.trim(),
          bcc: bcc.trim(),
          subject: subject.trim(),
          message: message.trim(),
          buttonEnabled,
          buttonLabel: buttonLabel.trim(),
          buttonUrl: buttonUrl.trim(),
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        throw new Error(`Server returned unexpected response (${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      setSuccessMsg(`Email successfully dispatched via Resend (ID: ${data.resendId})`);
      setTo('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch email');
    } finally {
      setSending(false);
    }
  };

  const selectedIdentity = identities.find((i) => i.id === selectedIdentityId);
  const isFormValid = !!selectedIdentityId && !!to.trim() && !!subject.trim() && !!message.trim();

  return (
    <div className="min-h-screen bg-[#080808] text-[#F5F5F5] flex font-sans">
      <AdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-[#080808]/90 backdrop-blur-md border-b border-[#1C1C1C] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-[#888888] hover:text-[#F5F5F5] border border-[#222222] bg-[#111111]"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-[#888888]">
                <Send size={14} className="text-emerald-400" />
                <span>RESEND TEMPLATE: CustomCommunication (customcommunication)</span>
              </div>
              <h1 className="font-display font-bold text-xl text-[#F5F5F5] tracking-wide mt-0.5">
                Secure Email Composer
              </h1>
            </div>
          </div>
        </header>

        <div className="p-6 sm:p-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form */}
          <div className="lg:col-span-7 space-y-6">
            {successMsg && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 font-mono text-xs flex items-center gap-2">
                <CheckCircle size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-red-950/40 border border-red-900/50 text-red-300 font-mono text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSend} className="bg-[#0D0D0D] border border-[#1C1C1C] p-6 sm:p-8 space-y-6 font-mono text-xs">
              <div className="space-y-2">
                <label className="block text-[#CCCCCC] uppercase">Sender Identity (Domain: @chenabmedia.in) *</label>
                {identitiesLoading ? (
                  <div className="p-3 bg-[#141414] border border-[#222222] text-[#888888] flex items-center gap-2 text-xs">
                    <Loader2 size={14} className="animate-spin text-emerald-400" />
                    <span>Loading sender identities…</span>
                  </div>
                ) : identityFetchError ? (
                  <div className="p-3 bg-red-950/20 border border-red-900/50 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0 text-red-400" />
                    <span>Authorization / API Error: {identityFetchError}</span>
                  </div>
                ) : identities.length === 0 ? (
                  <div className="p-3 bg-amber-950/20 border border-amber-900/50 text-amber-400 text-xs">
                    No verified CHENAB sender identities are configured.
                  </div>
                ) : (
                  <select
                    value={selectedIdentityId}
                    onChange={(e) => setSelectedIdentityId(e.target.value)}
                    className="w-full bg-[#141414] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none text-base sm:text-xs"
                  >
                    {identities.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.displayName} &lt;{item.email}&gt;
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-[#CCCCCC] uppercase">Recipient(s) (Comma separated) *</label>
                <input
                  type="text"
                  required
                  placeholder="artist@example.com, manager@example.com"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full bg-[#141414] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none text-base sm:text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[#777777] uppercase">CC (Optional)</label>
                  <input
                    type="text"
                    placeholder="cc@example.com"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    className="w-full bg-[#141414] border border-[#222222] p-2.5 text-[#F5F5F5] focus:outline-none text-base sm:text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[#777777] uppercase">BCC (Optional)</label>
                  <input
                    type="text"
                    placeholder="bcc@example.com"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    className="w-full bg-[#141414] border border-[#222222] p-2.5 text-[#F5F5F5] focus:outline-none text-base sm:text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[#CCCCCC] uppercase">Subject Line *</label>
                <input
                  type="text"
                  required
                  placeholder="Important updates regarding your catalogue release..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-[#141414] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none text-base sm:text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[#CCCCCC] uppercase">Message Body *</label>
                <textarea
                  rows={8}
                  required
                  placeholder="Write your email announcement or direct communication here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-[#141414] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none font-sans text-sm"
                />
              </div>

              {/* Action Button Toggle */}
              <div className="pt-4 border-t border-[#1C1C1C] space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-[#F5F5F5] uppercase">
                    <input
                      type="checkbox"
                      checked={buttonEnabled}
                      onChange={(e) => setButtonEnabled(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500"
                    />
                    <span>Include Call-to-Action Button</span>
                  </label>
                </div>

                {buttonEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#141414] border border-[#222222]">
                    <div className="space-y-1">
                      <label className="block text-[#888888] uppercase text-[10px]">Button Label</label>
                      <input
                        type="text"
                        value={buttonLabel}
                        onChange={(e) => setButtonLabel(e.target.value)}
                        className="w-full bg-[#0A0A0A] border border-[#333333] p-2 text-[#F5F5F5] text-base sm:text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[#888888] uppercase text-[10px]">Button URL (HTTPS)</label>
                      <input
                        type="url"
                        value={buttonUrl}
                        onChange={(e) => setButtonUrl(e.target.value)}
                        className="w-full bg-[#0A0A0A] border border-[#333333] p-2 text-[#F5F5F5] text-base sm:text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={sending || !isFormValid}
                  className="w-full py-3.5 bg-[#F5F5F5] hover:bg-white text-[#080808] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 size={15} className="animate-spin text-emerald-600" /> : <Send size={15} />}
                  <span>{sending ? 'Dispatched via Resend...' : 'Dispatch Secure Email'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Preview & Diagnostics */}
          <div className="lg:col-span-5 space-y-4">
            {/* Safe Diagnostics Panel */}
            <div className="bg-[#0D0D0D] border border-[#1C1C1C] p-4 font-mono text-[11px] text-[#888888] space-y-1.5">
              <div className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] flex items-center justify-between">
                <span>[SENDER IDENTITY DIAGNOSTICS]</span>
                <span className="text-[#555555]">PROD VERIFIED</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
                <div>
                  <span className="text-[#666666]">Identities Loaded:</span>{' '}
                  <span className="text-[#F5F5F5] font-bold">{identities.length}</span>
                </div>
                <div>
                  <span className="text-[#666666]">Selected ID:</span>{' '}
                  <span className="text-emerald-300 font-bold">{selectedIdentityId || 'NONE'}</span>
                </div>
              </div>
              <div className="text-[10px] pt-1 border-t border-[#181818] space-y-1">
                <p><span className="text-[#666666]">Identity IDs:</span> <span className="text-[#CCCCCC]">{identities.map((i) => i.id).join(', ') || 'None'}</span></p>
                <p><span className="text-[#666666]">Sender Emails:</span> <span className="text-[#CCCCCC]">{identities.map((i) => i.email).join(', ') || 'None'}</span></p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs text-[#888888]">
              <Eye size={14} className="text-emerald-400" />
              <span>LIVE HTML EMAIL PREVIEW</span>
            </div>

            <div className="bg-[#080808] border border-[#222222] p-6 space-y-6 font-sans">
              <div className="border-b border-[#222222] pb-4 space-y-1 font-mono text-xs">
                <p className="text-[#777777]">FROM: <strong className="text-[#CCCCCC]">{selectedIdentity ? `${selectedIdentity.displayName} <${selectedIdentity.email}>` : 'Chenab Media <hello@chenabmedia.in>'}</strong></p>
                <p className="text-[#777777]">TO: <strong className="text-[#CCCCCC]">{to || '[Recipient email]'}</strong></p>
                <p className="text-[#777777]">SUBJECT: <strong className="text-[#CCCCCC]">{subject || '[Email subject line]'}</strong></p>
              </div>

              <div className="bg-[#111111] border border-[#222222] p-6 space-y-4 text-sm text-[#CCCCCC]">
                <div className="font-mono text-[10px] text-[#666666] tracking-widest border-b border-[#222222] pb-2">
                  CHENAB MEDIA DISPATCH
                </div>
                <div className="whitespace-pre-wrap leading-relaxed min-h-[140px]">
                  {message || 'Email body content will appear here in real-time...'}
                </div>

                {buttonEnabled && (
                  <div className="pt-4">
                    <span className="inline-block bg-[#F5F5F5] text-[#080808] font-mono font-bold text-xs px-4 py-2.5">
                      {buttonLabel || 'Button Label'} &rarr;
                    </span>
                  </div>
                )}

                <div className="pt-6 border-t border-[#222222] font-mono text-[10px] text-[#555555]">
                  &copy; {new Date().getFullYear()} Chenab Media. Dispatched securely.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
