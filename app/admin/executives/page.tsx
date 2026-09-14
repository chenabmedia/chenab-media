'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/firebase/auth';
import { UserProfile } from '@/types/auth';
import { UserCog, Plus, Search, Edit, Eye, RefreshCw, Loader2, Shield } from 'lucide-react';

export default function ExecutivesPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch executive users');
      }

      const data = await res.json();
      const execs = (data.users || []).filter((u: UserProfile) => u.role === 'executive');
      setUsers(execs);
    } catch (err: any) {
      console.error('Error fetching executives:', err);
      setError(err.message || 'Failed to fetch executive staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return u.displayName?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="border-b border-[#1A1A1A] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-sky-400 mb-1">
            <UserCog size={14} />
            <span>OPERATIONAL MANAGEMENT</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#F5F5F5] uppercase tracking-wider">
            LABEL EXECUTIVE STAFF
          </h1>
          <p className="font-mono text-xs text-[#888888] mt-1">
            Executives hold delegated operational scopes across artists, catalog releases, and A&R demo reviews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2.5 border border-[#222222] bg-[#111111] text-[#CCCCCC] hover:text-white transition-colors font-mono text-xs uppercase flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">REFRESH</span>
          </button>

          <Link
            href="/admin/admins/new"
            className="px-4 py-2.5 bg-sky-950/60 border border-sky-800/80 text-sky-300 hover:bg-sky-900/80 transition-colors font-mono text-xs uppercase font-bold flex items-center gap-2"
          >
            <Plus size={14} />
            <span>ADD EXECUTIVE</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/30 border border-red-900/50 text-red-400 font-mono text-xs">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 bg-[#0C0C0C] border border-[#1C1C1C]">
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search executive team by name or email..."
            className="w-full pl-9 pr-4 py-2 bg-[#080808] border border-[#222222] text-[#F5F5F5] font-mono text-xs focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>
      </div>

      {/* Grid of Executives */}
      {loading ? (
        <div className="p-12 text-center font-mono text-xs text-[#888888] space-y-3">
          <Loader2 size={24} className="animate-spin mx-auto text-sky-400" />
          <p className="uppercase">LOADING EXECUTIVE DIRECTORY...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-[#1C1C1C] bg-[#0C0C0C] font-mono text-xs text-[#888888] space-y-2">
          <UserCog size={28} className="mx-auto text-[#444444]" />
          <p className="uppercase font-bold text-[#CCCCCC]">NO EXECUTIVE ACCOUNTS FOUND</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((exec) => (
            <div
              key={exec.uid}
              className="p-5 bg-[#0C0C0C] border border-[#1C1C1C] space-y-4 hover:border-[#333333] transition-colors font-mono text-xs"
            >
              <div className="flex items-start justify-between border-b border-[#181818] pb-3">
                <div>
                  <h3 className="font-bold text-[#F5F5F5] text-sm">
                    {exec.displayName || exec.email.split('@')[0]}
                  </h3>
                  <p className="text-[#888888] text-[11px]">{exec.email}</p>
                </div>

                <span
                  className={`px-2 py-0.5 text-[10px] uppercase font-bold border ${
                    exec.status === 'ACTIVE'
                      ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                      : 'bg-red-950/50 border-red-800 text-red-300'
                  }`}
                >
                  {exec.status}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#666666] uppercase block mb-1">
                  AUTHORIZED SCOPES
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {exec.permissions && exec.permissions.length > 0 ? (
                    exec.permissions.map((p) => (
                      <span
                        key={p}
                        className="px-2 py-0.5 bg-[#141414] border border-[#222222] text-[#CCCCCC] text-[10px]"
                      >
                        {p}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#555555]">Default Executive Scopes</span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#181818] flex items-center justify-between text-[11px]">
                <span className="text-[#666666]">
                  CREATED: {exec.createdAt ? new Date(exec.createdAt).toLocaleDateString() : 'N/A'}
                </span>
                <Link
                  href={`/admin/admins/${exec.uid}/edit`}
                  className="px-3 py-1 bg-[#141414] border border-[#222222] text-[#CCCCCC] hover:text-white uppercase font-bold flex items-center gap-1.5"
                >
                  <Edit size={12} />
                  <span>EDIT SCOPES</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
