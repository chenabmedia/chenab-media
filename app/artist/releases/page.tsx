'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Disc,
  Play,
  ExternalLink,
  Search,
  Filter,
  Loader2,
  Lock,
} from 'lucide-react';
import { Release } from '@/types';
import { useAudio } from '@/context/AudioContext';

export default function ArtistReleasesPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const { playTrack } = useAudio();

  useEffect(() => {
    async function fetchReleases() {
      try {
        setLoading(true);
        const res = await fetch('/api/artist/releases');
        if (res.ok) {
          const data = await res.json();
          setReleases(data.releases || []);
        }
      } catch (err) {
        console.error('Error fetching artist releases:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchReleases();
  }, []);

  const filteredReleases = releases.filter((release) => {
    const matchesSearch =
      release.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      release.catalogueNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      release.artistName.toLowerCase().includes(searchQuery.toLowerCase());

    const relType = (release.releaseType || release.type || '').toUpperCase();
    const matchesType =
      typeFilter === 'ALL' || relType === typeFilter.toUpperCase();

    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4 font-mono text-xs">
        <Loader2 size={28} className="animate-spin text-[#F5F5F5]" />
        <p className="text-[#888888] tracking-widest uppercase">
          LOADING ARTIST DISCOGRAPHY...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-mono">
      {/* Header */}
      <div className="border-b border-[#1C1C1C] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-sky-400 mb-1">
            <Disc size={14} />
            <span className="uppercase tracking-widest">DISCOGRAPHY CATALOGUE</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-4xl text-[#F5F5F5] uppercase">
            MY RELEASES ({releases.length})
          </h1>
        </div>

        <div className="px-3 py-1.5 border border-[#222222] bg-[#0C0C0C] text-[11px] text-[#888888] flex items-center gap-2">
          <Lock size={12} className="text-amber-400" />
          <span>LABEL READ-ONLY CATALOGUE RECORDS</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="SEARCH RELEASES..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-[#222222] p-2.5 pl-9 text-xs text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#555555]"
          />
          <Search size={14} className="absolute left-3 top-3 text-[#666666]" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
          <Filter size={14} className="text-[#666666]" />
          <span className="text-[#888888] uppercase">FORMAT:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#111111] border border-[#222222] p-2 text-[#F5F5F5] focus:outline-none focus:border-[#555555] uppercase"
          >
            <option value="ALL">ALL FORMATS</option>
            <option value="SINGLE">SINGLE</option>
            <option value="EP">EP</option>
            <option value="ALBUM">ALBUM</option>
            <option value="COMPILATION">COMPILATION</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {filteredReleases.length === 0 ? (
        <div className="p-12 border border-dashed border-[#222222] bg-[#0A0A0A] text-center text-xs text-[#666666]">
          NO RELEASES MATCHING SPECIFIED FILTERS.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredReleases.map((release) => (
            <div
              key={release.id}
              className="border border-[#1A1A1A] bg-[#0C0C0C] p-5 hover:border-[#333333] transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-square bg-[#151515] border border-[#222222] overflow-hidden mb-5">
                  <img
                    src={release.cover}
                    alt={release.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-[#080808]/90 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-[#F5F5F5] border border-[#222222]">
                    {release.catalogueNumber}
                  </span>
                  <span className="absolute bottom-3 right-3 bg-emerald-950/90 text-emerald-400 border border-emerald-900/60 px-2 py-0.5 text-[10px] font-bold uppercase">
                    {release.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[#777777]">
                    <span>{release.type}</span>
                    <span>{release.releaseDate}</span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-[#F5F5F5] uppercase">
                    {release.title}
                  </h3>
                  <p className="text-xs text-[#888888]">
                    ARTIST: <span className="text-[#CCCCCC]">{release.artistName}</span>
                  </p>
                </div>
              </div>

              <div className="pt-5 mt-5 border-t border-[#181818] flex items-center justify-between text-xs">
                {release.tracks && release.tracks.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      playTrack(
                        release.tracks![0],
                        release.title,
                        release.artistName,
                        release.cover || release.coverImage || ''
                      )
                    }
                    className="text-[#888888] hover:text-[#F5F5F5] flex items-center gap-1.5"
                  >
                    <Play size={12} fill="currentColor" />
                    <span>PREVIEW TRACK</span>
                  </button>
                )}

                <Link
                  href={`/artist/releases/${release.id}`}
                  className="px-3 py-1.5 border border-[#222222] bg-[#111111] hover:border-[#444444] text-[#F5F5F5] font-bold uppercase text-[11px] flex items-center gap-1"
                >
                  <span>DETAILS</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
