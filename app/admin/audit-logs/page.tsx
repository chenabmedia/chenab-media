'use client';

import React, { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/auth';
import { AuditLogEntry } from '@/types/admin';
import {
  History,
  Search,
  RefreshCw,
  Loader2,
  ShieldAlert,
  Clock,
  User,
  Activity,
  Filter,
} from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/audit-logs', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch audit records');
      }

      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      setError(err.message || 'Could not load system audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const descMatch = log.description.toLowerCase().includes(q);
      const actorMatch = log.actorEmail.toLowerCase().includes(q) || log.actorName?.toLowerCase().includes(q);
      const targetMatch = log.targetId.toLowerCase().includes(q);
      return descMatch || actorMatch || targetMatch;
    }

    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="border-b border-[#1A1A1A] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 mb-1">
            <History size={14} />
            <span>SYSTEM AUDIT TRAIL</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#F5F5F5] uppercase tracking-wider">
            ADMINISTRATIVE AUDIT LOGS
          </h1>
          <p className="font-mono text-xs text-[#888888] mt-1">
            Immutable log of privilege escalations, account provisioning, permission updates, and operational mutations.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="p-2.5 border border-[#222222] bg-[#111111] text-[#CCCCCC] hover:text-white transition-colors font-mono text-xs uppercase flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>REFRESH LOGS</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/30 border border-red-900/50 text-red-400 font-mono text-xs flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-[#0C0C0C] border border-[#1C1C1C] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 font-mono text-xs">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs by actor, description, or target UID..."
            className="w-full pl-9 pr-4 py-2 bg-[#080808] border border-[#222222] text-[#F5F5F5] focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[#666666]" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-[#080808] border border-[#222222] text-[#CCCCCC] focus:outline-none focus:border-emerald-500 uppercase"
          >
            <option value="ALL">ALL ACTIONS</option>
            <option value="ADMIN_CREATED">ADMIN_CREATED</option>
            <option value="ADMIN_UPDATED">ADMIN_UPDATED</option>
            <option value="ADMIN_DISABLED">ADMIN_DISABLED</option>
            <option value="ADMIN_REACTIVATED">ADMIN_REACTIVATED</option>
            <option value="ROLE_CHANGED">ROLE_CHANGED</option>
            <option value="PERMISSIONS_CHANGED">PERMISSIONS_CHANGED</option>
          </select>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="border border-[#1C1C1C] bg-[#0C0C0C] font-mono text-xs">
        {loading ? (
          <div className="p-12 text-center text-[#888888] space-y-3">
            <Loader2 size={24} className="animate-spin mx-auto text-emerald-400" />
            <p className="uppercase">LOADING SYSTEM AUDIT LOGS...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-[#888888] space-y-2">
            <Clock size={28} className="mx-auto text-[#444444]" />
            <p className="uppercase font-bold text-[#CCCCCC]">NO AUDIT LOG ENTRIES FOUND</p>
            <p className="text-[11px] font-mono text-[#666666]">
              Administrative actions will automatically generate audit entries here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#181818]">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-[#101010] transition-colors space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-[10px] uppercase font-bold">
                      [{log.action}]
                    </span>
                    <span className="text-[#888888] text-[11px]">
                      TARGET: <code className="text-[#CCCCCC]">{log.targetId}</code>
                    </span>
                  </div>

                  <span className="text-[#666666] text-[11px] flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                <p className="text-[#F5F5F5] font-sans text-sm">{log.description}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-[#777777] border-t border-[#141414]">
                  <div className="flex items-center gap-1.5">
                    <User size={12} className="text-emerald-400" />
                    <span>PERFORMED BY:</span>
                    <span className="text-[#CCCCCC] font-bold">{log.actorEmail}</span>
                    <span className="text-[#555555]">({log.actorUid})</span>
                  </div>

                  <div className="text-[10px] text-[#555555]">
                    IP: {log.ipAddress || '127.0.0.1'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
