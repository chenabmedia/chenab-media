'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Search, Grid, List, Disc, ArrowUpDown } from 'lucide-react';
import { RELEASES, searchReleases } from '@/data/releases';
import { useAudio } from '@/context/AudioContext';
import { Release } from '@/types';

export default function ReleasesPage() {
  const { playTrack } = useAudio();
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<'NEWEST' | 'OLDEST' | 'AZ'>('NEWEST');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [releasesList, setReleasesList] = useState<Release[]>(RELEASES);

  const releaseTypes = ['ALL', 'SINGLES', 'EPs', 'ALBUMS', 'COMPILATIONS'];

  useEffect(() => {
    async function loadPublicReleases() {
      try {
        const res = await fetch('/api/releases');
        if (res.ok) {
          const json = await res.json();
          if (json.releases && json.releases.length > 0) {
            setReleasesList(json.releases);
          }
        }
      } catch (e) {
        console.error('Failed to load Firestore releases, falling back to static:', e);
      }
    }
    loadPublicReleases();
  }, []);

  const filteredReleases = releasesList.filter((rel) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      rel.title.toLowerCase().includes(query) ||
      rel.catalogueNumber.toLowerCase().includes(query) ||
      rel.artistName.toLowerCase().includes(query) ||
      (rel.genres && rel.genres.some((g) => g.toLowerCase().includes(query)));

    const typeUpper = selectedType.toUpperCase();
    const relTypeUpper = (rel.releaseType || rel.type || '').toUpperCase();
    const matchesType =
      typeUpper === 'ALL' ||
      (typeUpper === 'SINGLES' && relTypeUpper === 'SINGLE') ||
      (typeUpper === 'EPS' && relTypeUpper === 'EP') ||
      (typeUpper === 'ALBUMS' && relTypeUpper === 'ALBUM') ||
      (typeUpper === 'COMPILATIONS' && relTypeUpper === 'COMPILATION');

    return matchesSearch && matchesType;
  });

  filteredReleases.sort((a, b) => {
    if (sortOption === 'NEWEST') {
      return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
    }
    if (sortOption === 'OLDEST') {
      return new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime();
    }
    if (sortOption === 'AZ') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 py-8 sm:py-12 space-y-8 sm:space-y-12">
      <div className="border-b border-[#1C1C1C] pb-6 sm:pb-8 space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 font-mono text-xs text-[#888888] tracking-widest uppercase">
          <Disc size={14} className="text-[#F5F5F5]" />
          <span>OFFICIAL DISCOGRAPHY</span>
        </div>
        <h1 className="font-display font-black text-[clamp(2.25rem,6vw,4rem)] text-[#F5F5F5] tracking-tight uppercase leading-none">
          CHENAB CATALOGUE
        </h1>
        <p className="font-sans text-xs sm:text-sm text-[#888888] max-w-2xl leading-relaxed">
          Archival 180g vinyl pressings, hand-numbered cassettes, and 24-bit 96kHz lossless audio masters curated across mountain passes and urban studios.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 sm:gap-6 bg-[#0C0C0C] border border-[#1C1C1C] p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 font-mono text-xs">
          {releaseTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-2 min-h-[44px] border transition-all uppercase flex items-center justify-center ${
                selectedType === type
                  ? 'bg-[#F5F5F5] text-[#080808] border-[#F5F5F5] font-bold'
                  : 'bg-[#111111] text-[#888888] border-[#222222] hover:text-[#F5F5F5] hover:border-[#444444]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
            <input
              type="text"
              placeholder="Search title, artist, cat #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111111] border border-[#222222] pl-9 pr-4 py-2 min-h-[44px] font-mono text-xs text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#555555]"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-[#111111] border border-[#222222] px-3 py-2 min-h-[44px] font-mono text-xs text-[#888888] flex-1 sm:flex-initial">
              <ArrowUpDown size={12} className="text-[#F5F5F5]" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as 'NEWEST' | 'OLDEST' | 'AZ')}
                className="bg-transparent text-[#F5F5F5] focus:outline-none uppercase cursor-pointer text-xs"
              >
                <option value="NEWEST" className="bg-[#111111]">
                  NEWEST
                </option>
                <option value="OLDEST" className="bg-[#111111]">
                  OLDEST
                </option>
                <option value="AZ" className="bg-[#111111]">
                  A–Z
                </option>
              </select>
            </div>

            <div className="flex items-center border border-[#222222] bg-[#111111] min-h-[44px]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 min-h-[44px] min-w-[44px] flex items-center justify-center ${viewMode === 'grid' ? 'text-[#F5F5F5] bg-[#222222]' : 'text-[#666666]'}`}
                title="Grid View"
                aria-label="Grid View"
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 min-h-[44px] min-w-[44px] flex items-center justify-center ${viewMode === 'list' ? 'text-[#F5F5F5] bg-[#222222]' : 'text-[#666666]'}`}
                title="List View"
                aria-label="List View"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {filteredReleases.length === 0 ? (
        <div className="py-20 sm:py-24 text-center border border-dashed border-[#222222] bg-[#0C0C0C] p-6 space-y-3">
          <Disc size={32} className="mx-auto text-[#444444]" />
          <p className="font-mono text-xs text-[#888888] tracking-widest uppercase">
            NO RESULTS FOUND
          </p>
          <p className="font-sans text-xs text-[#666666]">
            Try adjusting your search terms or clearing current catalogue filters.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredReleases.map((release) => (
            <div
              key={release.id}
              className="group border border-[#1A1A1A] bg-[#0C0C0C] p-4 sm:p-5 hover:border-[#333333] transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-square overflow-hidden bg-[#151515] mb-4 sm:mb-5">
                  <img
                    src={release.cover}
                    alt={release.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-[#080808]/90 backdrop-blur-md px-2.5 py-1 font-mono text-xs text-[#F5F5F5] border border-[#222222]">
                    {release.catalogueNumber}
                  </div>
                  <div className="absolute top-3 right-3 bg-[#080808]/90 backdrop-blur-md px-2 py-0.5 font-mono text-[10px] text-[#888888] border border-[#222222] uppercase">
                    {release.status}
                  </div>
                  {release.tracks && release.tracks.length > 0 && (
                    <button
                      onClick={() =>
                        playTrack(
                          release.tracks![0],
                          release.title,
                          release.artistName,
                          release.cover || release.coverImage || ''
                        )
                      }
                      className="absolute bottom-3 right-3 p-3 bg-[#F5F5F5] text-[#080808] rounded-full sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-2xl hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Play Preview"
                      aria-label="Play Preview Track"
                    >
                      <Play size={16} fill="currentColor" />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between font-mono text-[11px] text-[#777777]">
                    <span>{release.releaseType || release.type}</span>
                    <span>{(release.genres || [release.genre || 'Music']).join(' / ')}</span>
                  </div>
                  <h3 className="font-display font-bold text-lg sm:text-xl text-[#F5F5F5] group-hover:text-white transition-colors">
                    <Link href={`/release/${release.slug}`}>{release.title}</Link>
                  </h3>
                  <p className="font-sans text-sm text-[#999999]">
                    {release.artistName}
                  </p>
                  <p className="font-sans text-xs text-[#777777] line-clamp-2 mt-2 leading-relaxed">
                    {release.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 sm:pt-5 mt-4 sm:mt-5 border-t border-[#181818] flex items-center justify-between font-mono text-xs text-[#666666]">
                <span>RELEASED: {release.releaseDate}</span>
                <Link
                  href={`/release/${release.slug}`}
                  className="text-[#F5F5F5] hover:underline py-1 min-h-[36px] inline-flex items-center"
                >
                  VIEW RELEASE &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-[#1C1C1C] border border-[#1C1C1C] bg-[#0C0C0C]">
          {filteredReleases.map((release) => (
            <div
              key={release.id}
              className="p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 hover:bg-[#111111] transition-colors group"
            >
              <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                <img
                  src={release.cover || release.coverImage || ''}
                  alt={release.title}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover border border-[#222222] shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] sm:text-xs text-[#888888]">
                    <span className="text-[#F5F5F5] font-semibold">{release.catalogueNumber}</span>
                    <span>&bull;</span>
                    <span>{release.releaseType || release.type}</span>
                    <span>&bull;</span>
                    <span>{(release.genres || [release.genre || 'Music']).join(' / ')}</span>
                  </div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-[#F5F5F5] group-hover:text-white">
                    <Link href={`/release/${release.slug}`}>{release.title}</Link>
                  </h3>
                  <p className="font-sans text-xs text-[#888888]">{release.artistName}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 sm:gap-6 font-mono text-xs pt-2 md:pt-0 border-t md:border-t-0 border-[#181818]">
                {release.tracks && release.tracks.length > 0 && (
                  <button
                    onClick={() =>
                      playTrack(
                        release.tracks![0],
                        release.title,
                        release.artistName,
                        release.cover || release.coverImage || ''
                      )
                    }
                    className="flex items-center gap-2 px-3.5 py-2 min-h-[44px] border border-[#333333] hover:border-[#666666] text-[#F5F5F5]"
                  >
                    <Play size={12} fill="currentColor" />
                    <span>PREVIEW</span>
                  </button>
                )}
                <span className="text-[#666666] hidden sm:inline">{release.releaseDate}</span>
                <Link
                  href={`/release/${release.slug}`}
                  className="px-4 py-2.5 min-h-[44px] flex items-center justify-center bg-[#F5F5F5] text-[#080808] font-bold hover:bg-white uppercase text-[11px]"
                >
                  RELEASE PAGE
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
