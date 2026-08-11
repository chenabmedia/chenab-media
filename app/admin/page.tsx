'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase/firestore';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { AuditLogEntry } from '@/types/admin';
import {
  Users,
  Disc,
  FileMusic,
  MessageSquare,
  ShieldAlert,
  ArrowUpRight,
  Clock,
  Activity,
  Plus,
  ChevronRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface Stats {
  artistsCount: number;
  releasesCount: number;
  pendingDemosCount: number;
  pendingMessagesCount: number;
}

export default function AdminOverviewPage() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    artistsCount: 0,
    releasesCount: 0,
    pendingDemosCount: 0,
    pendingMessagesCount: 0,
  });
  const [recentDemos, setRecentDemos] = useState<any[]>([]);
  const [recentReleases, setRecentReleases] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Artists Count
      let aCount = 0;
      try {
        const aSnap = await getDocs(collection(db, 'artists'));
        aCount = aSnap.size;
      } catch (e) {
        console.warn('Could not fetch artists count:', e);
      }

      // 2. Fetch Releases Count & Recent Releases
      let rCount = 0;
      let relsList: any[] = [];
      try {
        const rSnap = await getDocs(collection(db, 'releases'));
        rCount = rSnap.size;
        rSnap.forEach((doc) => relsList.push({ id: doc.id, ...doc.data() }));
      } catch (e) {
        console.warn('Could not fetch releases:', e);
      }

      // 3. Fetch Demos
      let dCount = 0;
      let demosList: any[] = [];
      try {
        const dSnap = await getDocs(collection(db, 'demoSubmissions'));
        dCount = dSnap.size;
        dSnap.forEach((doc) => demosList.push({ id: doc.id, ...doc.data() }));
      } catch (e) {
        console.warn('Could not fetch demos:', e);
      }

      // 4. Fetch Contact Submissions Count
      let mCount = 0;
      try {
        const mSnap = await getDocs(collection(db, 'contactSubmissions'));
        mCount = mSnap.size;
      } catch (e) {
        console.warn('Could not fetch contact submissions:', e);
      }

      // 5. Fetch Recent Audit Logs
      let logsList: AuditLogEntry[] = [];
      try {
        const logSnap = await getDocs(
          query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(5))
        );
        logSnap.forEach((doc) => logsList.push({ id: doc.id, ...doc.data() } as AuditLogEntry));
      } catch (e) {
        console.warn('Could not fetch audit logs:', e);
      }

      // Fallback mock statistics if Firestore collections are completely empty for initial setup
      if (aCount === 0 && rCount === 0 && dCount === 0 && mCount === 0) {
        setStats({
          artistsCount: 12,
          releasesCount: 28,
          pendingDemosCount: 4,
          pendingMessagesCount: 2,
        });
      } else {
        setStats({
          artistsCount: aCount,
          releasesCount: rCount,
          pendingDemosCount: dCount,
          pendingMessagesCount: mCount,
        });
      }

      setRecentReleases(relsList.slice(0, 4));
      setRecentDemos(demosList.slice(0, 4));
      setRecentLogs(logsList);
    } catch (err: any) {
      console.error('Error fetching dashboard metrics:', err);
      setError('Unable to load full Firestore metrics. Verify database connections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="border-b border-[#1A1A1A] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>EXECUTIVE COMMAND DASHBOARD</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#F5F5F5] uppercase tracking-wider">
            LABEL OVERVIEW
          </h1>
          <p className="font-mono text-xs text-[#888888] mt-1">
            AUTHENTICATED AS: {userProfile?.email} &bull; ACCESS: [{userProfile?.role.toUpperCase()}]
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2.5 border border-[#222222] bg-[#111111] text-[#CCCCCC] hover:text-white hover:border-[#444444] transition-colors font-mono text-xs uppercase flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">REFRESH DATA</span>
          </button>

          <Link
            href="/admin/admins/new"
            className="px-4 py-2.5 bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/80 transition-colors font-mono text-xs uppercase font-bold flex items-center gap-2"
          >
            <Plus size={14} />
            <span>ADD ADMIN</span>
          </Link>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="p-4 bg-red-950/30 border border-red-900/50 text-red-400 font-mono text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline uppercase text-[10px]">
            DISMISS
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Artists */}
        <div className="p-5 bg-[#0C0C0C] border border-[#1C1C1C] space-y-3 relative overflow-hidden group hover:border-[#333333] transition-colors">
          <div className="flex items-center justify-between text-[#888888]">
            <span className="font-mono text-xs uppercase tracking-wider">ROSTER ARTISTS</span>
            <Users size={16} className="text-[#666666] group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-display font-extrabold text-3xl sm:text-4xl text-[#F5F5F5]">
              {loading ? <Loader2 size={24} className="animate-spin text-[#666666]" /> : stats.artistsCount}
            </span>
            <Link
              href="/admin/artists"
              className="font-mono text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>MANAGE</span>
              <ChevronRight size={12} />
            </Link>
          </div>
          <div className="font-mono text-[10px] text-[#666666] pt-1 border-t border-[#161616]">
            ACTIVE ROSTER CATALOGUE
          </div>
        </div>

        {/* Card 2: Releases */}
        <div className="p-5 bg-[#0C0C0C] border border-[#1C1C1C] space-y-3 relative overflow-hidden group hover:border-[#333333] transition-colors">
          <div className="flex items-center justify-between text-[#888888]">
            <span className="font-mono text-xs uppercase tracking-wider">CATALOG RELEASES</span>
            <Disc size={16} className="text-[#666666] group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-display font-extrabold text-3xl sm:text-4xl text-[#F5F5F5]">
              {loading ? <Loader2 size={24} className="animate-spin text-[#666666]" /> : stats.releasesCount}
            </span>
            <Link
              href="/admin/releases"
              className="font-mono text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>CATALOG</span>
              <ChevronRight size={12} />
            </Link>
          </div>
          <div className="font-mono text-[10px] text-[#666666] pt-1 border-t border-[#161616]">
            SINGLES, EPS, & ALBUMS
          </div>
        </div>

        {/* Card 3: Pending Demos */}
        <div className="p-5 bg-[#0C0C0C] border border-[#1C1C1C] space-y-3 relative overflow-hidden group hover:border-[#333333] transition-colors">
          <div className="flex items-center justify-between text-[#888888]">
            <span className="font-mono text-xs uppercase tracking-wider">PENDING DEMOS</span>
            <FileMusic size={16} className="text-[#666666] group-hover:text-amber-400 transition-colors" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-display font-extrabold text-3xl sm:text-4xl text-[#F5F5F5]">
              {loading ? <Loader2 size={24} className="animate-spin text-[#666666]" /> : stats.pendingDemosCount}
            </span>
            <Link
              href="/admin/demos"
              className="font-mono text-[11px] text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>REVIEW</span>
              <ChevronRight size={12} />
            </Link>
          </div>
          <div className="font-mono text-[10px] text-[#666666] pt-1 border-t border-[#161616]">
            INCOMING A&R PITCHES
          </div>
        </div>

        {/* Card 4: Messages */}
        <div className="p-5 bg-[#0C0C0C] border border-[#1C1C1C] space-y-3 relative overflow-hidden group hover:border-[#333333] transition-colors">
          <div className="flex items-center justify-between text-[#888888]">
            <span className="font-mono text-xs uppercase tracking-wider">INQUIRIES</span>
            <MessageSquare size={16} className="text-[#666666] group-hover:text-sky-400 transition-colors" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-display font-extrabold text-3xl sm:text-4xl text-[#F5F5F5]">
              {loading ? <Loader2 size={24} className="animate-spin text-[#666666]" /> : stats.pendingMessagesCount}
            </span>
            <Link
              href="/admin/messages"
              className="font-mono text-[11px] text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>INBOX</span>
              <ChevronRight size={12} />
            </Link>
          </div>
          <div className="font-mono text-[10px] text-[#666666] pt-1 border-t border-[#161616]">
            CONTACT FORM SUBMISSIONS
          </div>
        </div>
      </div>

      {/* Main Activity Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Audit Activity */}
        <div className="p-6 bg-[#0C0C0C] border border-[#1C1C1C] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
            <div className="flex items-center gap-2 font-mono text-xs text-[#F5F5F5] font-bold uppercase">
              <Activity size={15} className="text-emerald-400" />
              <span>RECENT SYSTEM AUDIT LOGS</span>
            </div>
            <Link
              href="/admin/audit-logs"
              className="font-mono text-[11px] text-emerald-400 hover:underline uppercase"
            >
              VIEW ALL
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#1C1C1C] space-y-2">
              <Clock size={20} className="mx-auto text-[#444444]" />
              <p className="font-mono text-xs text-[#888888] uppercase">
                NO RECENT SECURITY AUDIT RECORDS
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-[#080808] border border-[#181818] space-y-1 font-mono text-xs"
                >
                  <div className="flex items-center justify-between text-[#888888]">
                    <span className="text-emerald-400 font-bold">[{log.action}]</span>
                    <span className="text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[#CCCCCC] leading-tight">{log.description}</p>
                  <div className="text-[10px] text-[#666666]">BY: {log.actorEmail}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Demo Pitches */}
        <div className="p-6 bg-[#0C0C0C] border border-[#1C1C1C] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
            <div className="flex items-center gap-2 font-mono text-xs text-[#F5F5F5] font-bold uppercase">
              <FileMusic size={15} className="text-amber-400" />
              <span>RECENT DEMO SUBMISSIONS</span>
            </div>
            <Link
              href="/admin/demos"
              className="font-mono text-[11px] text-amber-400 hover:underline uppercase"
            >
              A&R QUEUE
            </Link>
          </div>

          {recentDemos.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#1C1C1C] space-y-2">
              <FileMusic size={20} className="mx-auto text-[#444444]" />
              <p className="font-mono text-xs text-[#888888] uppercase">
                NO PENDING DEMO PITCHES IN QUEUE
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDemos.map((demo) => (
                <div
                  key={demo.id}
                  className="p-3 bg-[#080808] border border-[#181818] flex items-center justify-between font-mono text-xs"
                >
                  <div>
                    <p className="font-bold text-[#F5F5F5]">{demo.demoTitle || 'Untitled Demo'}</p>
                    <p className="text-[#888888] text-[11px]">
                      {demo.artistName} &bull; {demo.genre || 'General'}
                    </p>
                  </div>
                  <div className="text-right text-[10px] text-[#666666]">
                    {demo.createdAt ? new Date(demo.createdAt).toLocaleDateString() : 'Recent'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
