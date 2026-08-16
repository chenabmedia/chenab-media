'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Disc,
  Play,
  ExternalLink,
  Lock,
  ListMusic,
  UserCheck,
  Globe,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Release } from '@/types';
import { RELEASES } from '@/data/releases';
import { useAudio } from '@/context/AudioContext';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ArtistReleaseDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const releaseId = resolvedParams.id;

  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const { playTrack } = useAudio();

  useEffect(() => {
    async function fetchRelease() {
      try {
        setLoading(true);
        const res = await fetch('/api/artist/releases');
        if (res.ok) {
          const data = await res.json();
          const match = (data.releases || []).find(
            (r: Release) => r.id === releaseId || r.slug === releaseId
          );
          if (match) {
            setRelease(match);
            return;
          }
        }

        // Fallback static match
        const staticMatch = RELEASES.find(
          (r) => r.id === releaseId || r.slug === releaseId
        );
        if (staticMatch) {
          setRelease(staticMatch);
        }
      } catch (err) {
        console.error('Error fetching release detail:', err);
      } fontFinally: {
        setLoading(false);
      }
    }

    fetchRelease();
  }, [releaseId]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4 font-mono text-xs">
        <Loader2 size={28} className="animate-spin text-[#F5F5F5]" />
        <p className="text-[#888888] tracking-widest uppercase">
          LOADING RELEASE ENTRY...
        </p>
      </div>
    );
  }

  if (!release) {
    return (
      <div className="py-20 text-center font-mono space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#111111] border border-[#222222] flex items-center justify-center text-[#888888]">
          <Disc size={28} />
        </div>
        <h2 className="font-display font-bold text-2xl text-[#F5F5F5] uppercase">
          RELEASE NOT FOUND
        </h2>
        <p className="text-xs text-[#888888]">
          THE REQUESTED CATALOGUE RELEASE ENTRY DOES NOT EXIST OR IS NOT ASSIGNED TO THIS ARTIST PROFILE.
        </p>
        <Link
          href="/artist/releases"
          className="inline-block px-6 py-3 bg-[#F5F5F5] text-[#080808] font-bold text-xs uppercase"
        >
          RETURN TO DISCOGRAPHY
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 font-mono">
      {/* Top Bar */}
      <div className="border-b border-[#1C1C1C] pb-6 flex items-center justify-between">
        <Link
          href="/artist/releases"
          className="inline-flex items-center gap-2 text-xs text-[#888888] hover:text-[#F5F5F5] uppercase"
        >
          <ArrowLeft size={14} />
          <span>BACK TO DISCOGRAPHY</span>
        </Link>

        <div className="px-3 py-1 bg-[#111111] border border-[#222222] text-[11px] text-[#888888] flex items-center gap-2">
          <Lock size={12} className="text-amber-400" />
          <span>A&R MANAGED MASTER ENTRY</span>
        </div>
      </div>

      {/* Main Release Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Cover Artwork */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-square bg-[#151515] border border-[#222222] overflow-hidden relative shadow-2xl">
            <img
              src={release.cover}
              alt={release.title}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-3 left-3 px-3 py-1 bg-[#080808]/90 text-xs font-bold text-[#F5F5F5] border border-[#222222]">
              {release.catalogueNumber}
            </span>
          </div>

          <div className="p-4 border border-[#1A1A1A] bg-[#0A0A0A] text-xs space-y-2 text-[#888888]">
            <p className="font-bold text-[#CCCCCC] uppercase">LABEL RECORD INFORMATION</p>
            <p>CATALOGUE NUMBER: {release.catalogueNumber}</p>
            <p>RELEASE TYPE: {release.type}</p>
            <p>RELEASE DATE: {release.releaseDate}</p>
            <p>STATUS: {release.status}</p>
          </div>
        </div>

        {/* Release Metadata */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-3">
            <div className="text-xs text-sky-400 uppercase tracking-widest flex items-center gap-2">
              <Disc size={14} />
              <span>{release.type} &bull; {release.releaseDate}</span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-5xl text-[#F5F5F5] uppercase">
              {release.title}
            </h1>
            <p className="text-sm text-[#CCCCCC]">
              PRIMARY ARTIST: <span className="text-[#F5F5F5] font-bold">{release.artistName}</span>
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {release.genres?.map((g, idx) => (
                <span
                  key={idx}
                  className="text-xs px-3 py-1 bg-[#111111] border border-[#222222] text-[#888888]"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs text-[#888888] uppercase tracking-wider">RELEASE STATEMENT</h3>
            <p className="text-xs text-[#CCCCCC] font-sans leading-relaxed">
              {release.description}
            </p>
          </div>

          {/* Tracklist */}
          <div className="space-y-4 border-t border-[#1C1C1C] pt-6">
            <h3 className="font-display font-bold text-lg text-[#F5F5F5] uppercase flex items-center gap-2">
              <ListMusic size={18} className="text-sky-400" />
              <span>MASTER TRACKLIST ({release.tracks?.length || 0})</span>
            </h3>

            <div className="space-y-2">
              {release.tracks?.map((track) => (
                <div
                  key={track.id}
                  className="p-3.5 border border-[#1A1A1A] bg-[#0C0C0C] hover:border-[#333333] flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-6 text-[#666666] font-bold">{track.number}.</span>
                    <div>
                      <p className="font-bold text-[#F5F5F5]">{track.title}</p>
                      {track.featuredArtists && track.featuredArtists.length > 0 && (
                        <p className="text-[10px] text-[#888888]">
                          FEAT. {track.featuredArtists.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-[#777777] text-[11px]">{track.duration}</span>
                    <button
                      type="button"
                      onClick={() =>
                        playTrack(
                          track,
                          release.title,
                          release.artistName,
                          release.cover || release.coverImage || ''
                        )
                      }
                      className="p-2 bg-[#151515] border border-[#222222] text-[#F5F5F5] hover:bg-[#222222] transition-colors"
                    >
                      <Play size={12} fill="currentColor" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Credits */}
          {release.credits && release.credits.length > 0 && (
            <div className="space-y-4 border-t border-[#1C1C1C] pt-6">
              <h3 className="font-display font-bold text-lg text-[#F5F5F5] uppercase flex items-center gap-2">
                <UserCheck size={18} className="text-emerald-400" />
                <span>LINER CREDITS & CONTRIBUTIONS</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {release.credits.map((credit, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-[#1A1A1A] bg-[#0C0C0C] space-y-1"
                  >
                    <span className="text-[10px] text-[#666666] uppercase">{credit.role}</span>
                    <p className="font-bold text-[#F5F5F5]">{credit.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
