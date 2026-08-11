'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, Search, ArrowUpRight, Disc } from 'lucide-react';
import { searchArtists } from '@/data/artists';
import { RELEASES } from '@/data/releases';

export default function ArtistsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredArtists = searchArtists(searchQuery, statusFilter);

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12 space-y-12">
      <div className="border-b border-[#1C1C1C] pb-8 space-y-4">
        <div className="flex items-center gap-2 font-mono text-xs text-[#888888] tracking-widest uppercase">
          <Users size={14} className="text-[#F5F5F5]" />
          <span>CHENAB MEDIA ROSTER</span>
        </div>
        <h1 className="font-display font-black text-4xl sm:text-6xl text-[#F5F5F5] tracking-tight uppercase">
          ARTIST DIRECTORY
        </h1>
        <p className="font-sans text-sm text-[#888888] max-w-2xl leading-relaxed">
          A curated roster of sound designers, classical virtuosos, high-altitude field recording artists, and lyricists pushing the boundaries of contemporary soundscapes.
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 bg-[#0C0C0C] border border-[#1C1C1C] p-4">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[#666666] mr-2 hidden sm:inline uppercase">STATUS:</span>
          {['ALL', 'ACTIVE', 'ALUMNI'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 border transition-all uppercase ${
                statusFilter === st
                  ? 'bg-[#F5F5F5] text-[#080808] border-[#F5F5F5] font-bold'
                  : 'bg-[#111111] text-[#888888] border-[#222222] hover:text-[#F5F5F5] hover:border-[#444444]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative md:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
          <input
            type="text"
            placeholder="Search artist, location, or genre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-[#222222] pl-9 pr-4 py-1.5 font-mono text-xs text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#555555]"
          />
        </div>
      </div>

      {filteredArtists.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-[#222222] bg-[#0C0C0C] space-y-3">
          <Users size={32} className="mx-auto text-[#444444]" />
          <p className="font-mono text-xs text-[#888888] tracking-widest uppercase">
            NO ARTISTS FOUND
          </p>
          <p className="font-sans text-xs text-[#666666]">
            Try adjusting your search query or status filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArtists.map((artist) => {
            const releaseCount = RELEASES.filter(
              (r) =>
                r.artistIds.includes(artist.id) ||
                r.artistName.toLowerCase().includes((artist.stageName || artist.name || '').toLowerCase())
            ).length;

            return (
              <div
                key={artist.id}
                className="group border border-[#1A1A1A] bg-[#0C0C0C] p-6 hover:border-[#333333] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-square overflow-hidden bg-[#151515] mb-6 grayscale group-hover:grayscale-0 transition-all duration-500 relative">
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-[#080808]/90 backdrop-blur-md px-2.5 py-1 font-mono text-[10px] text-[#F5F5F5] border border-[#222222] uppercase">
                      {artist.status}
                    </div>
                    <div className="absolute top-3 right-3 p-2 bg-[#080808]/80 backdrop-blur-md text-[#F5F5F5] border border-[#222222] opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight size={16} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between font-mono text-[10px] text-[#666666]">
                      <span className="uppercase">{artist.location}</span>
                      <span className="flex items-center gap-1 text-[#888888]">
                        <Disc size={12} />
                        {releaseCount} {releaseCount === 1 ? 'RELEASE' : 'RELEASES'}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-2xl text-[#F5F5F5] group-hover:text-white transition-colors">
                      <Link href={`/artist/${artist.slug}`}>{artist.name}</Link>
                    </h3>

                    <div className="flex flex-wrap gap-1.5 py-1">
                      {artist.genres.map((g, i) => (
                        <span
                          key={i}
                          className="font-mono text-[10px] text-[#888888] px-2 py-0.5 border border-[#222222] bg-[#111111]"
                        >
                          {g}
                        </span>
                      ))}
                    </div>

                    <p className="font-sans text-xs text-[#888888] line-clamp-3 pt-2 leading-relaxed">
                      {artist.bio}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-[#181818] flex items-center justify-between font-mono text-xs">
                  <span className="text-[#666666]">ROSTER PROFILE</span>
                  <Link
                    href={`/artist/${artist.slug}`}
                    className="text-[#F5F5F5] hover:underline"
                  >
                    VIEW DISCOGRAPHY &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
