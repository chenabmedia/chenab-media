'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  RefreshCw,
  Loader2,
  Search,
  Filter,
  Eye,
  Edit,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MapPin,
  Disc,
} from 'lucide-react';
import { Artist } from '@/types';
import { ARTISTS } from '@/data/artists';

export default function AdminArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchArtists = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await fetch('/api/admin/artists');
      if (res.ok) {
        const data = await res.json();
        const firestoreList: Artist[] = data.artists || [];

        // Merge or fallback to static ARTISTS if Firestore list is sparse
        if (firestoreList.length > 0) {
          setArtists(firestoreList);
        } else {
          setArtists(ARTISTS);
        }
      } else {
        setArtists(ARTISTS);
      }
    } catch (err: any) {
      console.warn('Error loading artists from API:', err);
      setArtists(ARTISTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtists();
  }, []);

  const handleToggleStatus = async (artistId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/artists/${artistId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setArtists((prev) =>
          prev.map((a) => (a.id === artistId ? { ...a, status: newStatus as any } : a))
        );
        setActionSuccess(`ARTIST STATUS UPDATED TO ${newStatus}.`);
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update status');
      }
    } catch (err: any) {
      setActionError(err.message || 'Status update failed');
    }
  };

  const filteredArtists = artists.filter((artist) => {
    const q = searchQuery.toLowerCase().trim();
    const nameStr = (artist.stageName || artist.name || '').toLowerCase();
    const legalStr = (artist.legalName || '').toLowerCase();
    const emailStr = (artist.email || '').toLowerCase();
    const locationStr = (artist.location || '').toLowerCase();
    const genreStr = (artist.genres || []).join(' ').toLowerCase();

    const matchesSearch =
      !q ||
      nameStr.includes(q) ||
      legalStr.includes(q) ||
      emailStr.includes(q) ||
      locationStr.includes(q) ||
      genreStr.includes(q);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (artist.status || 'ACTIVE').toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  const totalCount = artists.length;
  const activeCount = artists.filter((a) => a.status === 'ACTIVE').length;
  const suspendedCount = artists.filter((a) => a.status === 'SUSPENDED').length;

  return (
    <div className="space-y-8 font-mono text-xs">
      {/* Header */}
      <div className="border-b border-[#1A1A1A] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Users size={14} />
            <span className="uppercase tracking-widest">CHENAB ROSTER DIRECTORY</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-4xl text-[#F5F5F5] uppercase tracking-wider">
            ARTIST MANAGEMENT
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchArtists}
            className="p-2.5 border border-[#222222] bg-[#111111] text-[#CCCCCC] hover:text-white uppercase flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">REFRESH</span>
          </button>

          <Link
            href="/admin/artists/new"
            className="px-4 py-2.5 bg-[#F5F5F5] text-[#080808] font-bold uppercase hover:bg-white transition-all flex items-center gap-2"
          >
            <Plus size={14} />
            <span>PROVISION NEW ARTIST</span>
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 border border-emerald-900/50 bg-emerald-950/30 text-emerald-300 flex items-center gap-3">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 border border-red-900/50 bg-red-950/30 text-red-300 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="border border-[#1C1C1C] bg-[#0C0C0C] p-5 space-y-1">
          <span className="text-[#888888] uppercase text-[10px]">TOTAL ROSTER ARTISTS</span>
          <div className="text-3xl font-display font-bold text-[#F5F5F5]">{totalCount}</div>
        </div>

        <div className="border border-[#1C1C1C] bg-[#0C0C0C] p-5 space-y-1">
          <span className="text-[#888888] uppercase text-[10px]">ACTIVE ARTISTS</span>
          <div className="text-3xl font-display font-bold text-emerald-400">{activeCount}</div>
        </div>

        <div className="border border-[#1C1C1C] bg-[#0C0C0C] p-5 space-y-1">
          <span className="text-[#888888] uppercase text-[10px]">SUSPENDED / INACTIVE</span>
          <div className="text-3xl font-display font-bold text-red-400">{suspendedCount}</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="SEARCH ARTIST ROSTER..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-[#222222] p-2.5 pl-9 text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#555555]"
          />
          <Search size={14} className="absolute left-3 top-3 text-[#666666]" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-[#666666]" />
          <span className="text-[#888888] uppercase">STATUS:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#111111] border border-[#222222] p-2 text-[#F5F5F5] focus:outline-none focus:border-[#555555] uppercase"
          >
            <option value="ALL">ALL STATUSES</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#1C1C1C] bg-[#0C0C0C] overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-[#888888] space-y-2">
            <Loader2 size={24} className="animate-spin mx-auto text-emerald-400" />
            <p className="uppercase">LOADING ROSTER ARTISTS...</p>
          </div>
        ) : filteredArtists.length === 0 ? (
          <div className="p-12 text-center text-[#888888] space-y-2">
            <Users size={28} className="mx-auto text-[#444444]" />
            <p className="uppercase font-bold text-[#CCCCCC]">NO ROSTER ARTISTS FOUND</p>
            <p className="text-[11px] text-[#666666]">
              Try adjusting search terms or filters.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1C1C1C] bg-[#080808] text-[#888888] text-[10px] uppercase tracking-wider">
                <th className="p-4">ARTIST / STAGE NAME</th>
                <th className="p-4">LOCATION & GENRES</th>
                <th className="p-4">CONTACT EMAIL</th>
                <th className="p-4">PREFIX / ID</th>
                <th className="p-4">STATUS</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#181818]">
              {filteredArtists.map((artist) => {
                const isSuspended = artist.status === 'SUSPENDED';
                const displayName = artist.stageName || artist.name || 'Unnamed Artist';
                const avatar = artist.profileImage || artist.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80';

                return (
                  <tr key={artist.id} className="hover:bg-[#111111] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#151515] border border-[#222222] overflow-hidden shrink-0">
                          <img
                            src={avatar}
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-[#F5F5F5] uppercase text-sm">
                            {displayName}
                          </p>
                          {artist.legalName && (
                            <p className="text-[10px] text-[#777777]">LEGAL: {artist.legalName}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-[#CCCCCC]">
                      <div className="space-y-1">
                        <p className="flex items-center gap-1 text-[11px]">
                          <MapPin size={11} className="text-[#666666]" />
                          <span>{artist.location || 'Srinagar, J&K'}</span>
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {artist.genres?.slice(0, 2).map((g, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] px-1.5 py-0.5 bg-[#151515] border border-[#222222] text-[#888888]"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-[#CCCCCC]">
                      <p className="font-mono text-[11px]">{artist.email || 'On File'}</p>
                      {artist.phone && (
                        <p className="text-[10px] text-[#666666]">{artist.phone}</p>
                      )}
                    </td>

                    <td className="p-4 text-sky-400 font-bold">
                      {artist.catalogueNumberPrefix || artist.id}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold border uppercase ${
                          isSuspended
                            ? 'bg-red-950/40 border-red-900/50 text-red-400'
                            : 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400'
                        }`}
                      >
                        {artist.status || 'ACTIVE'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/artists/${artist.id}`}
                          className="p-2 border border-[#222222] bg-[#111111] hover:border-[#444444] text-[#CCCCCC] hover:text-white"
                          title="View Profile Details"
                        >
                          <Eye size={13} />
                        </Link>

                        <Link
                          href={`/admin/artists/${artist.id}/edit`}
                          className="p-2 border border-[#222222] bg-[#111111] hover:border-[#444444] text-[#CCCCCC] hover:text-white"
                          title="Edit Artist Metadata"
                        >
                          <Edit size={13} />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(artist.id, artist.status || 'ACTIVE')}
                          className={`p-2 border uppercase font-bold text-[10px] ${
                            isSuspended
                              ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-300 hover:bg-emerald-900/50'
                              : 'bg-red-950/30 border-red-900/40 text-red-300 hover:bg-red-900/50'
                          }`}
                          title={isSuspended ? 'Reactivate Artist Account' : 'Suspend Artist Account'}
                        >
                          {isSuspended ? 'REACTIVATE' : 'SUSPEND'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
