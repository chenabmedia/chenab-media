'use client';

import React, { useEffect, useState, use } from 'react';
import { Disc, ExternalLink, Music, Share2, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { SmartLink, Release, DSPLinks } from '@/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const PLATFORM_CONFIGS: {
  key: keyof DSPLinks;
  label: string;
  badge: string;
  bgHover: string;
  iconBg: string;
}[] = [
  { key: 'spotify', label: 'Spotify', badge: 'STREAM', bgHover: 'hover:border-emerald-500/50', iconBg: 'bg-emerald-500/10 text-emerald-400' },
  { key: 'appleMusic', label: 'Apple Music', badge: 'STREAM', bgHover: 'hover:border-pink-500/50', iconBg: 'bg-pink-500/10 text-pink-400' },
  { key: 'youtubeMusic', label: 'YouTube Music', badge: 'STREAM', bgHover: 'hover:border-red-500/50', iconBg: 'bg-red-500/10 text-red-400' },
  { key: 'youtube', label: 'YouTube', badge: 'WATCH', bgHover: 'hover:border-red-600/50', iconBg: 'bg-red-600/10 text-red-500' },
  { key: 'amazonMusic', label: 'Amazon Music', badge: 'STREAM / BUY', bgHover: 'hover:border-cyan-500/50', iconBg: 'bg-cyan-500/10 text-cyan-400' },
  { key: 'deezer', label: 'Deezer', badge: 'STREAM', bgHover: 'hover:border-purple-500/50', iconBg: 'bg-purple-500/10 text-purple-400' },
  { key: 'soundcloud', label: 'SoundCloud', badge: 'STREAM', bgHover: 'hover:border-orange-500/50', iconBg: 'bg-orange-500/10 text-orange-400' },
  { key: 'soundCloud', label: 'SoundCloud', badge: 'STREAM', bgHover: 'hover:border-orange-500/50', iconBg: 'bg-orange-500/10 text-orange-400' },
  { key: 'tidal', label: 'Tidal', badge: 'HI-RES STREAM', bgHover: 'hover:border-blue-500/50', iconBg: 'bg-blue-500/10 text-blue-400' },
  { key: 'bandcamp', label: 'Bandcamp', badge: 'BUY / LOSSLESS', bgHover: 'hover:border-teal-500/50', iconBg: 'bg-teal-500/10 text-teal-400' },
  { key: 'other', label: 'Official Store / Web', badge: 'BUY', bgHover: 'hover:border-amber-500/50', iconBg: 'bg-amber-500/10 text-amber-400' },
];

export default function SmartLinkPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<{ smartLink: SmartLink; release: Release } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    async function fetchSmartLink() {
      try {
        setLoading(true);
        const res = await fetch(`/api/listen/${slug}`);
        if (!res.ok) {
          throw new Error('Smart Link not found');
        }
        const json = await res.json();
        setData(json);
        if (json.release) {
          document.title = `${json.release.title} — ${json.release.artistName} | CHENAB MEDIA`;
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load Smart Link');
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchSmartLink();
  }, [slug]);

  const handlePlatformClick = (platformKey: string, url: string) => {
    if (!url) return;

    // Record analytics click event fire-and-forget
    fetch(`/api/listen/${slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: platformKey,
        smartLinkId: data?.smartLink?.id,
        releaseId: data?.release?.id,
      }),
    }).catch(() => {});

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 border-2 border-[#333333] border-t-[#F5F5F5] rounded-full animate-spin" />
        <p className="font-mono text-xs text-[#888888] tracking-widest uppercase animate-pulse">
          RESOLVING SMART LINK...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto px-6 py-28 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full border border-[#222222] bg-[#0C0C0C] flex items-center justify-center text-[#888888]">
          <Disc size={28} className="text-[#444444]" />
        </div>
        <h2 className="font-display font-black text-3xl text-[#F5F5F5] uppercase">
          SMART LINK NOT FOUND
        </h2>
        <p className="font-mono text-xs text-[#888888]">
          The requested Smart Link slug "/listen/{slug}" does not exist or has been deactivated.
        </p>
        <Link
          href="/releases"
          className="inline-block px-6 py-3 bg-[#F5F5F5] text-[#080808] font-mono text-xs font-bold uppercase hover:bg-white transition-colors"
        >
          EXPLORE CATALOGUE
        </Link>
      </div>
    );
  }

  const { release, smartLink } = data;
  const dspLinks = smartLink.dspLinks || release.dspLinks || release.streamingLinks || {};

  // Filter out platforms that have non-empty URLs and deduplicate key aliases like soundCloud / soundcloud
  const activePlatforms = PLATFORM_CONFIGS.filter((p) => {
    const url = dspLinks[p.key];
    return url && typeof url === 'string' && url.trim().length > 0;
  });

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-lg bg-[#0A0A0A] border border-[#1F1F1F] p-6 sm:p-8 space-y-8 shadow-2xl relative overflow-hidden">
        {/* Ambient backdrop glow */}
        <div
          className="absolute -top-24 -left-24 w-72 h-72 bg-gradient-to-br from-neutral-800/20 to-transparent rounded-full blur-3xl pointer-events-none"
        />

        {/* Top bar with catalogue tag and share */}
        <div className="flex items-center justify-between text-xs font-mono text-[#888888] border-b border-[#181818] pb-4">
          <Link
            href={`/release/${release.slug}`}
            className="inline-flex items-center gap-1.5 hover:text-[#F5F5F5] transition-colors uppercase"
          >
            <ArrowLeft size={12} />
            <span>{release.catalogueNumber || 'CHENAB'}</span>
          </Link>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#141414] border border-[#222222] hover:border-[#444444] text-[#CCCCCC] transition-colors"
            title="Share Smart Link"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-400" />
                <span className="text-emerald-400">COPIED</span>
              </>
            ) : (
              <>
                <Share2 size={12} />
                <span>SHARE</span>
              </>
            )}
          </button>
        </div>

        {/* Release Artwork & Info Header */}
        <div className="text-center space-y-4">
          <div className="relative aspect-square max-w-[280px] sm:max-w-[320px] mx-auto border border-[#262626] shadow-2xl overflow-hidden group">
            <img
              src={release.coverImage || release.cover || smartLink.artwork}
              alt={release.title}
              className="w-full h-full object-cover"
            />
            {release.catalogueNumber && (
              <div className="absolute top-3 left-3 bg-[#080808]/90 backdrop-blur-md px-2.5 py-1 font-mono text-[10px] text-[#F5F5F5] border border-[#222222]">
                {release.catalogueNumber}
              </div>
            )}
          </div>

          <div className="space-y-1 pt-2">
            <h1 className="font-display font-black text-2xl sm:text-3xl text-[#F5F5F5] uppercase tracking-tight">
              {release.title}
            </h1>
            <p className="font-serif italic text-lg text-[#CCCCCC]">
              by {release.artistName}
            </p>
            <p className="font-mono text-[11px] text-[#777777] uppercase tracking-wider">
              {release.type || release.releaseType} &bull; {release.genres ? release.genres.join(' / ') : release.genre}
            </p>
          </div>
        </div>

        {/* DSP Platform Buttons */}
        <div className="space-y-3">
          <div className="flex items-center justify-between font-mono text-[11px] text-[#888888] uppercase tracking-widest px-1">
            <span className="flex items-center gap-1.5">
              <Music size={12} className="text-[#F5F5F5]" />
              <span>SELECT PLATFORM</span>
            </span>
            <span>{activePlatforms.length} AVAILABLE</span>
          </div>

          {activePlatforms.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-[#222222] bg-[#0F0F0F]">
              <p className="font-mono text-xs text-[#888888]">
                Streaming links will be activated shortly.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activePlatforms.map((p) => {
                const url = dspLinks[p.key]!;
                return (
                  <button
                    key={p.key}
                    onClick={() => handlePlatformClick(p.key, url)}
                    className={`w-full p-3.5 bg-[#121212] border border-[#222222] ${p.bgHover} transition-all flex items-center justify-between group text-left cursor-pointer`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${p.iconBg}`}>
                        {p.label.charAt(0)}
                      </div>
                      <div>
                        <p className="font-sans font-semibold text-sm text-[#F5F5F5] group-hover:text-white">
                          {p.label}
                        </p>
                        <p className="font-mono text-[10px] text-[#777777] uppercase">
                          {p.badge}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs text-[#F5F5F5] group-hover:translate-x-0.5 transition-transform">
                      <span className="hidden sm:inline text-[11px] text-[#A0A0A0] uppercase font-bold">PLAY</span>
                      <ExternalLink size={14} className="text-[#888888] group-hover:text-white" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-[#181818] text-center font-mono text-[10px] text-[#666666] uppercase space-y-1">
          <p>© CHENAB MEDIA ARCHIVES &bull; OFFICIAL RELEASE PAGE</p>
          <p>RELEASE DATE: {release.releaseDate}</p>
        </div>
      </div>
    </div>
  );
}
