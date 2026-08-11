'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Disc,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Edit,
  Eye,
  ExternalLink,
  Trash2,
  Grid,
  List,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { Release, ReleaseStatus, ReleaseType } from '@/types';
import { RELEASES } from '@/data/releases';

export default function AdminReleasesCMSDirectory() {
  const router = useRouter();

  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<'NEWEST' | 'OLDEST' | 'CATNUM' | 'AZ'>('NEWEST');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchReleases = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/releases');
      if (res.ok) {
        const json = await res.json();
        let fetched: Release[] = json.releases || [];

        // Fallback to static catalog if database has 0 items
        if (fetched.length === 0) {
          fetched = RELEASES as any;
        }

        setReleases(fetched);
      } else {
        setReleases(RELEASES as any);
      }
    } catch (err) {
      console.error('Error loading admin releases:', err);
      setReleases(RELEASES as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  const handleArchive = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to archive "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/releases/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setActionSuccess(`Release "${title}" archived.`);
        setTimeout(() => setActionSuccess(null), 3000);
        fetchReleases();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtering logic
  const filtered = releases.filter((rel) => {
    // Search query
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      rel.title.toLowerCase().includes(query) ||
      rel.catalogueNumber.toLowerCase().includes(query) ||
      rel.artistName.toLowerCase().includes(query) ||
      (rel.genre && rel.genre.toLowerCase().includes(query));

    // Status filter
    const matchesStatus =
      selectedStatus === 'ALL' ||
      rel.status === selectedStatus ||
      (selectedStatus === 'PUBLISHED' && (rel.status as any) === 'OUT NOW');

    // Type filter
    const matchesType =
      selectedType === 'ALL' || rel.releaseType === selectedType || rel.type === selectedType;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Sorting logic
  filtered.sort((a, b) => {
    if (sortOption === 'NEWEST') {
      return new Date(b.releaseDate || '2026-01-01').getTime() - new Date(a.releaseDate || '2026-01-01').getTime();
    }
    if (sortOption === 'OLDEST') {
      return new Date(a.releaseDate || '2026-01-01').getTime() - new Date(b.releaseDate || '2026-01-01').getTime();
    }
    if (sortOption === 'AZ') {
      return a.title.localeCompare(b.title);
    }
    if (sortOption === 'CATNUM') {
      return a.catalogueNumber.localeCompare(b.catalogueNumber);
    }
    return 0;
  });

  return (
    <div className="space-y-8 font-mono text-xs">
      {/* Top Header */}
      <div className="border-b border-[#1A1A1A] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 mb-1 tracking-widest uppercase">
            <Disc size={14} />
            <span>CHENAB CATALOGUE CMS</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#F5F5F5] uppercase tracking-wider">
            RELEASE MANAGEMENT
          </h1>
          <p className="font-sans text-xs text-[#888888] mt-1">
            Create, edit, validate, publish, and manage multi-DSP Smart Links for label releases.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReleases}
            className="p-2.5 border border-[#222222] bg-[#111111] text-[#CCCCCC] hover:text-white uppercase flex items-center gap-2"
            title="Refresh Directory"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <Link
            href="/admin/releases/new"
            className="px-5 py-2.5 bg-[#F5F5F5] text-[#080808] font-bold uppercase flex items-center gap-2 hover:bg-white transition-all shadow-lg"
          >
            <Plus size={16} />
            <span>CREATE NEW RELEASE</span>
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-950/30 border border-emerald-900/50 p-4 text-emerald-400">
          {actionSuccess}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#0C0C0C] border border-[#1C1C1C] p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
          <input
            type="text"
            placeholder="Search title, cat #, artist name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121212] border border-[#222222] pl-9 pr-4 py-2 text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#555555]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Dropdown */}
          <div className="flex items-center gap-2 bg-[#121212] border border-[#222222] px-3 py-1.5">
            <span className="text-[#666666]">STATUS:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-[#F5F5F5] focus:outline-none uppercase cursor-pointer"
            >
              <option value="ALL" className="bg-[#121212]">ALL</option>
              <option value="DRAFT" className="bg-[#121212]">DRAFT</option>
              <option value="SCHEDULED" className="bg-[#121212]">SCHEDULED</option>
              <option value="PUBLISHED" className="bg-[#121212]">PUBLISHED</option>
              <option value="UNPUBLISHED" className="bg-[#121212]">UNPUBLISHED</option>
              <option value="ARCHIVED" className="bg-[#121212]">ARCHIVED</option>
            </select>
          </div>

          {/* Type Dropdown */}
          <div className="flex items-center gap-2 bg-[#121212] border border-[#222222] px-3 py-1.5">
            <span className="text-[#666666]">TYPE:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-[#F5F5F5] focus:outline-none uppercase cursor-pointer"
            >
              <option value="ALL" className="bg-[#121212]">ALL</option>
              <option value="SINGLE" className="bg-[#121212]">SINGLE</option>
              <option value="EP" className="bg-[#121212]">EP</option>
              <option value="ALBUM" className="bg-[#121212]">ALBUM</option>
              <option value="COMPILATION" className="bg-[#121212]">COMPILATION</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 bg-[#121212] border border-[#222222] px-3 py-1.5">
            <ArrowUpDown size={12} className="text-[#666666]" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="bg-transparent text-[#F5F5F5] focus:outline-none uppercase cursor-pointer"
            >
              <option value="NEWEST" className="bg-[#121212]">NEWEST FIRST</option>
              <option value="OLDEST" className="bg-[#121212]">OLDEST FIRST</option>
              <option value="CATNUM" className="bg-[#121212]">CATALOGUE #</option>
              <option value="AZ" className="bg-[#121212]">TITLE A–Z</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-[#222222] bg-[#121212]">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 ${viewMode === 'table' ? 'text-[#F5F5F5] bg-[#222222]' : 'text-[#666666]'}`}
              title="Table View"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'text-[#F5F5F5] bg-[#222222]' : 'text-[#666666]'}`}
              title="Grid View"
            >
              <Grid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Release List / Grid */}
      <div className="border border-[#1C1C1C] bg-[#0C0C0C]">
        {loading ? (
          <div className="p-16 text-center text-[#888888] space-y-2">
            <Loader2 size={24} className="animate-spin mx-auto text-emerald-400" />
            <p className="uppercase">LOADING CATALOGUE RELEASES...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-[#888888] space-y-3">
            <Disc size={32} className="mx-auto text-[#444444]" />
            <p className="uppercase font-bold text-[#F5F5F5]">NO RELEASES FOUND</p>
            <p className="font-sans text-xs text-[#666666]">
              Try adjusting search terms or status filters.
            </p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1C1C1C] text-[#666666] bg-[#090909]">
                  <th className="p-4">CAT #</th>
                  <th className="p-4">ARTWORK & TITLE</th>
                  <th className="p-4">ARTIST</th>
                  <th className="p-4">TYPE</th>
                  <th className="p-4">STATUS</th>
                  <th className="p-4">RELEASE DATE</th>
                  <th className="p-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181818]">
                {filtered.map((rel) => {
                  const smartSlug = rel.smartLink?.slug || rel.slug;
                  return (
                    <tr key={rel.id} className="hover:bg-[#111111] transition-colors">
                      <td className="p-4 font-bold text-emerald-400">
                        {rel.catalogueNumber || 'CHNB-000'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={rel.coverImage || rel.cover || 'https://picsum.photos/100/100'}
                            alt={rel.title}
                            className="w-10 h-10 object-cover border border-[#222222] shrink-0"
                          />
                          <div>
                            <p className="font-bold text-[#F5F5F5] font-sans text-sm">{rel.title}</p>
                            <p className="text-[10px] text-[#666666]">
                              {rel.tracks?.length || 0} Tracks &bull; {rel.genre || 'Music'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-[#CCCCCC] font-sans text-xs">{rel.artistName}</td>
                      <td className="p-4 text-[#888888]">{rel.releaseType || rel.type}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 border text-[10px] font-bold uppercase ${
                            rel.status === 'PUBLISHED' || rel.status === ('OUT NOW' as any)
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'
                              : rel.status === 'SCHEDULED' || rel.status === ('PRE-ORDER' as any)
                              ? 'bg-amber-950/40 text-amber-400 border-amber-900/50'
                              : rel.status === 'UNPUBLISHED'
                              ? 'bg-purple-950/40 text-purple-400 border-purple-900/50'
                              : rel.status === 'ARCHIVED'
                              ? 'bg-red-950/40 text-red-400 border-red-900/50'
                              : 'bg-[#181818] text-[#888888] border-[#2A2A2A]'
                          }`}
                        >
                          {rel.status}
                        </span>
                      </td>
                      <td className="p-4 text-[#777777]">{rel.releaseDate}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/listen/${smartSlug}`}
                            target="_blank"
                            className="p-1.5 border border-[#222222] bg-[#121212] text-[#888888] hover:text-[#F5F5F5]"
                            title="View Smart Link"
                          >
                            <Sparkles size={13} className="text-amber-400" />
                          </Link>

                          <Link
                            href={`/release/${rel.slug}`}
                            target="_blank"
                            className="p-1.5 border border-[#222222] bg-[#121212] text-[#888888] hover:text-[#F5F5F5]"
                            title="View Public Catalogue Page"
                          >
                            <ExternalLink size={13} />
                          </Link>

                          <Link
                            href={`/admin/releases/${rel.id}/edit`}
                            className="px-2.5 py-1.5 bg-[#181818] border border-[#2D2D2D] text-[#F5F5F5] hover:bg-[#222222] font-bold flex items-center gap-1"
                          >
                            <Edit size={12} />
                            <span>EDIT</span>
                          </Link>

                          <button
                            onClick={() => handleArchive(rel.id, rel.title)}
                            className="p-1.5 border border-red-900/30 text-red-400 hover:bg-red-950/30"
                            title="Archive Release"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((rel) => {
              const smartSlug = rel.smartLink?.slug || rel.slug;
              return (
                <div
                  key={rel.id}
                  className="bg-[#090909] border border-[#1C1C1C] p-5 space-y-4 hover:border-[#333333] transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="relative aspect-square overflow-hidden bg-[#121212] border border-[#222222]">
                      <img
                        src={rel.coverImage || rel.cover || 'https://picsum.photos/400/400'}
                        alt={rel.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-[#080808]/90 px-2 py-0.5 border border-[#222222] text-emerald-400 font-bold text-[11px]">
                        {rel.catalogueNumber}
                      </div>
                      <div className="absolute top-2 right-2">
                        <span
                          className={`px-2 py-0.5 border text-[9px] font-bold uppercase ${
                            rel.status === 'PUBLISHED' || rel.status === ('OUT NOW' as any)
                              ? 'bg-emerald-950/90 text-emerald-400 border-emerald-900'
                              : 'bg-black/80 text-[#888888] border-[#333333]'
                          }`}
                        >
                          {rel.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-lg text-[#F5F5F5] uppercase">
                        {rel.title}
                      </h3>
                      <p className="font-sans text-xs text-[#888888]">{rel.artistName}</p>
                      <p className="font-mono text-[10px] text-[#666666] mt-1">
                        {rel.releaseType || rel.type} &bull; RELEASE: {rel.releaseDate}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#181818] flex items-center justify-between gap-2">
                    <Link
                      href={`/listen/${smartSlug}`}
                      target="_blank"
                      className="px-2 py-1 bg-[#121212] border border-[#222222] text-amber-400 flex items-center gap-1 text-[10px]"
                    >
                      <Sparkles size={11} />
                      <span>SMART LINK</span>
                    </Link>

                    <Link
                      href={`/admin/releases/${rel.id}/edit`}
                      className="px-3 py-1.5 bg-[#F5F5F5] text-[#080808] font-bold text-[11px] uppercase hover:bg-white"
                    >
                      EDIT RELEASE
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
