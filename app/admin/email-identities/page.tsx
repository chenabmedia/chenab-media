'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { EmailIdentity } from '@/types/site';
import { Mail, Plus, CheckCircle, AlertCircle, Menu, Trash2, Edit3, Shield } from 'lucide-react';

export default function AdminEmailIdentitiesPage() {
  const { user, userProfile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [identities, setIdentities] = useState<EmailIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [newSuffix, setNewSuffix] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newReplyTo, setNewReplyTo] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchIdentities = async () => {
    try {
      let token = '';
      if (user) {
        try {
          token = await user.getIdToken();
        } catch (e) {
          console.warn('Could not get token:', e);
        }
      }

      const res = await fetch('/api/admin/email-identities', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await res.json();
      }

      if (data && data.identities) {
        setIdentities(data.identities);
      }
    } catch (err) {
      setErrorMsg('Failed to load email identities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdentities();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      let token = '';
      if (user) {
        try {
          token = await user.getIdToken();
        } catch (e) {
          console.warn('Could not get token:', e);
        }
      }

      const res = await fetch('/api/admin/email-identities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          suffix: newSuffix,
          displayName: newDisplayName,
          replyTo: newReplyTo,
          description: newDescription,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        throw new Error(`Server returned unexpected response (${res.status})`);
      }

      if (!res.ok) throw new Error(data.error || 'Failed to create identity');

      setSuccessMsg(`Successfully created identity: ${data.identity?.email || newSuffix}`);
      setNewSuffix('');
      setNewDisplayName('');
      setNewReplyTo('');
      setNewDescription('');
      fetchIdentities();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create identity');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleEnable = async (id: string, currentEnabled: boolean) => {
    try {
      let token = '';
      if (user) {
        try {
          token = await user.getIdToken();
        } catch (e) {
          console.warn('Could not get token:', e);
        }
      }

      const res = await fetch(`/api/admin/email-identities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      if (!res.ok) throw new Error('Failed to update identity');
      fetchIdentities();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this email identity?')) return;
    try {
      let token = '';
      if (user) {
        try {
          token = await user.getIdToken();
        } catch (e) {
          console.warn('Could not get token:', e);
        }
      }

      const res = await fetch(`/api/admin/email-identities/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to delete identity');
      fetchIdentities();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

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
                <Mail size={14} className="text-emerald-400" />
                <span>MANAGED EMAIL SYSTEM</span>
              </div>
              <h1 className="font-display font-bold text-xl text-[#F5F5F5] tracking-wide mt-0.5">
                Sender Identities (@chenabmedia.in)
              </h1>
            </div>
          </div>
        </header>

        <div className="p-6 sm:p-10 max-w-5xl mx-auto w-full space-y-8">
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

          {/* Create New Identity Form */}
          <div className="bg-[#0D0D0D] border border-[#1C1C1C] p-6 sm:p-8 space-y-6">
            <h3 className="font-mono text-xs text-[#888888] tracking-widest uppercase border-b border-[#1C1C1C] pb-3 flex items-center gap-2">
              <Plus size={14} className="text-emerald-400" />
              <span>Create New Sender Identity</span>
            </h3>

            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              <div className="space-y-2">
                <label className="block text-[#CCCCCC] uppercase">Sender Suffix (e.g. demos, press)</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="suffix"
                    value={newSuffix}
                    onChange={(e) => setNewSuffix(e.target.value)}
                    className="flex-1 bg-[#141414] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none"
                  />
                  <span className="bg-[#1C1C1C] border border-l-0 border-[#222222] p-3 text-[#888888]">
                    @chenabmedia.in
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[#CCCCCC] uppercase">Display Name</label>
                <input
                  type="text"
                  placeholder="Chenab Demos"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="w-full bg-[#141414] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[#CCCCCC] uppercase">Reply-To Address (Optional)</label>
                <input
                  type="email"
                  placeholder="support@chenabmedia.in"
                  value={newReplyTo}
                  onChange={(e) => setNewReplyTo(e.target.value)}
                  className="w-full bg-[#141414] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[#CCCCCC] uppercase">Description</label>
                <input
                  type="text"
                  placeholder="Purpose of this sender address"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-[#141414] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none"
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-3 bg-[#F5F5F5] hover:bg-white text-[#080808] font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {creating ? 'Creating Identity...' : 'Provision Sender Identity'}
                </button>
              </div>
            </form>
          </div>

          {/* Identities List */}
          <div className="space-y-4">
            <h3 className="font-mono text-xs text-[#888888] tracking-widest uppercase">
              Active Sender Identities ({identities.length})
            </h3>

            {loading ? (
              <div className="py-12 text-center font-mono text-xs text-[#777777]">Loading identities...</div>
            ) : identities.length === 0 ? (
              <div className="p-8 bg-[#0D0D0D] border border-[#1C1C1C] text-center font-mono text-xs text-[#777777]">
                No sender identities configured.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {identities.map((item) => (
                  <div key={item.id} className="p-5 bg-[#0D0D0D] border border-[#1C1C1C] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#F5F5F5] text-sm">{item.email}</span>
                        <span className={`px-2 py-0.5 text-[10px] uppercase font-bold border ${item.enabled ? 'border-emerald-900 bg-emerald-950/30 text-emerald-400' : 'border-red-900 bg-red-950/30 text-red-400'}`}>
                          {item.enabled ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </div>
                      <p className="text-[#888888]">Display Name: <strong className="text-[#CCCCCC]">{item.displayName}</strong> | Reply-To: <strong className="text-[#CCCCCC]">{item.replyTo || item.email}</strong></p>
                      {item.description && <p className="text-[#666666] italic">{item.description}</p>}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleToggleEnable(item.id, item.enabled)}
                        className={`px-3 py-1.5 border font-semibold uppercase ${item.enabled ? 'border-yellow-900/50 bg-yellow-950/20 text-yellow-400' : 'border-emerald-900/50 bg-emerald-950/20 text-emerald-400'}`}
                      >
                        {item.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 border border-red-900/40 bg-red-950/20 text-red-400 hover:bg-red-900/40"
                        title="Delete Identity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
