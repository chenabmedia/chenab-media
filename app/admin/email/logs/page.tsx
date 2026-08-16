'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { EmailLog } from '@/types/site';
import { History, CheckCircle, AlertCircle, Menu, Mail, RefreshCw } from 'lucide-react';

export default function AdminEmailLogsPage() {
  const { user, userProfile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let token = '';
      if (user) {
        try {
          token = await user.getIdToken();
        } catch (e) {
          console.warn('Could not get token:', e);
        }
      }

      const res = await fetch('/api/admin/email/logs', {
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

      if (data && data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      setErrorMsg('Failed to load email logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

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
                <History size={14} className="text-emerald-400" />
                <span>AUDIT & DISPATCH LOGS</span>
              </div>
              <h1 className="font-display font-bold text-xl text-[#F5F5F5] tracking-wide mt-0.5">
                Email Dispatch History
              </h1>
            </div>
          </div>

          <button
            onClick={fetchLogs}
            className="px-4 py-2 bg-[#141414] border border-[#222222] hover:border-[#444444] font-mono text-xs flex items-center gap-2 text-[#CCCCCC]"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </header>

        <div className="p-6 sm:p-10 max-w-7xl mx-auto w-full space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-950/40 border border-red-900/50 text-red-300 font-mono text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Status Overview Card */}
          <div className="p-6 bg-[#0D0D0D] border border-[#1C1C1C] grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono text-xs">
            <div className="space-y-1">
              <span className="text-[#666666] uppercase">Resend Status</span>
              <p className="font-bold text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>OPERATIONAL / CONFIGURED</span>
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[#666666] uppercase">Domain Verification</span>
              <p className="font-bold text-[#F5F5F5]">chenabmedia.in (Active)</p>
            </div>
            <div className="space-y-1">
              <span className="text-[#666666] uppercase">Total Dispatches Logged</span>
              <p className="font-bold text-[#F5F5F5]">{logs.length}</p>
            </div>
          </div>

          {/* Logs Table / List */}
          <div className="space-y-4">
            <h3 className="font-mono text-xs text-[#888888] tracking-widest uppercase">
              Recent Dispatches
            </h3>

            {loading ? (
              <div className="py-12 text-center font-mono text-xs text-[#777777]">Loading dispatch logs...</div>
            ) : logs.length === 0 ? (
              <div className="p-8 bg-[#0D0D0D] border border-[#1C1C1C] text-center font-mono text-xs text-[#777777]">
                No email dispatches recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="p-5 bg-[#0D0D0D] border border-[#1C1C1C] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 text-[10px] uppercase font-bold border ${log.status === 'SENT' ? 'border-emerald-900 bg-emerald-950/30 text-emerald-400' : 'border-red-900 bg-red-950/30 text-red-400'}`}>
                          {log.status}
                        </span>
                        <span className="font-bold text-[#F5F5F5] text-sm">{log.subject}</span>
                      </div>
                      <p className="text-[#888888]">From: <strong className="text-[#CCCCCC]">{log.from}</strong> &rarr; To: <strong className="text-[#CCCCCC]">{log.to}</strong></p>
                      <p className="text-[#666666]">Dispatched by: {log.sentBy} at {new Date(log.createdAt).toLocaleString()}</p>
                      {log.error && <p className="text-red-400 italic text-[11px]">Error: {log.error}</p>}
                    </div>

                    <div className="text-right text-[10px] text-[#555555]">
                      {log.resendId ? `Resend ID: ${log.resendId}` : 'No Resend ID'}
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
