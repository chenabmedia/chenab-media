'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  Play,
  Pause,
  Disc,
  MapPin,
  Share2,
  Check,
  Sparkles,
  Music2,
  Calendar,
  Radio,
  Mail,
  Globe,
} from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { Artist, Release, DSPLinks, SocialLinks } from '@/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Custom brand icons for DSPs and Social Platforms
function PlatformIcon({ platform, className = 'w-5 h-5' }: { platform: string; className?: string }) {
  const p = platform.toLowerCase();

  if (p === 'spotify') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 5.524 4.477 10 10 10 5.524 0 10-4.476 10-10 0-5.523-4.476-10-10-10zm4.586 14.424a.625.625 0 01-.86.208c-2.353-1.437-5.316-1.762-8.805-.964a.625.625 0 11-.277-1.219c3.816-.874 7.08-.504 9.734 1.115a.625.625 0 01.208.86zm1.226-2.724a.782.782 0 01-1.077.258c-2.695-1.657-6.804-2.136-9.99-1.168a.783.783 0 01-.462-1.496c3.638-1.104 8.18-.574 11.27 1.328a.782.782 0 01.26 1.078zm.105-2.835C14.69 8.94 8.39 8.73 4.73 9.842a.938.938 0 01-.548-1.794c4.195-1.274 11.144-1.03 15.01 1.265a.938.938 0 11-.975 1.608z" />
      </svg>
    );
  }

  if (p === 'applemusic' || p === 'apple music' || p === 'apple') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.66-1.08 1.73-.95 2.76 1.01.08 2.05-.51 2.68-1.26z" />
      </svg>
    );
  }

  if (p === 'youtubemusic' || p === 'youtube music') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-7.2c-1.49 0-2.7 1.21-2.7 2.7s1.21 2.7 2.7 2.7 2.7-1.21 2.7-2.7-1.21-2.7-2.7-2.7zm-1.8 4.2V9.5l3.6 1.5-3.6 1.5z" />
      </svg>
    );
  }

  if (p === 'youtube') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }

  if (p === 'instagram') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    );
  }

  if (p === 'tiktok') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    );
  }

  if (p === 'x' || p === 'twitter') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }

  if (p === 'soundcloud') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M1.175 12.225c-.05 0-.095.042-.1.094l-.325 3.303.325 3.232c.005.052.05.094.1.094s.094-.042.1-.094l.35-3.232-.35-3.303c-.006-.052-.05-.094-.1-.094zm1.05-1.18c-.06 0-.108.048-.112.107l-.338 4.484.338 4.388c.004.06.052.107.113.107.06 0 .108-.048.112-.107l.363-4.388-.363-4.484c-.004-.06-.052-.107-.113-.107zm1.175-.82c-.07 0-.125.056-.13.125l-.337 5.304.338 5.19c.004.07.06.125.13.125.07 0 .125-.056.13-.125l.362-5.19-.362-5.304c-.005-.07-.06-.125-.13-.125zm1.175-.24c-.08 0-.144.064-.148.143l-.337 5.544.337 5.426c.004.08.068.144.148.144.08 0 .144-.064.148-.144l.363-5.426-.363-5.544c-.004-.08-.068-.144-.148-.144zm1.175.46c-.09 0-.16.07-.165.16l-.335 5.084.335 4.975c.004.09.075.16.165.16.09 0 .16-.07.165-.16l.36-4.975-.36-5.084c-.004-.09-.075-.16-.165-.16zm1.175-.82c-.1 0-.18.08-.183.18l-.334 5.904.334 5.795c.004.1.083.18.183.18.1 0 .18-.08.183-.18l.36-5.795-.36-5.904c-.004-.1-.083-.18-.183-.18zm1.175-.58c-.11 0-.2.09-.2.2l-.33 6.484.33 6.375c0 .11.09.2.2.2s.2-.09.2-.2l.36-6.375-.36-6.484c0-.11-.09-.2-.2-.2zm1.175-.34c-.12 0-.21.1-.21.22l-.33 6.824.33 6.715c0 .12.09.22.21.22.12 0 .21-.1.21-.22l.36-6.715-.36-6.824c0-.12-.09-.22-.21-.22zm1.175-.34c-.13 0-.23.1-.23.23l-.33 7.164.33 7.055c0 .13.1.23.23.23.13 0 .23-.1.23-.23l.36-7.055-.36-7.164c0-.13-.1-.23-.23-.23zm8.9 2.45c-.47 0-.92.1-1.33.28-.31-2.48-2.43-4.4-5-4.4-.64 0-1.25.13-1.81.36-.28.12-.42.43-.3.71.12.28.43.42.71.3.43-.17.9-.27 1.4-.27 2.05 0 3.75 1.54 3.96 3.56.03.3.28.53.58.53.03 0 .07 0 .1-.01.44-.09.9-.14 1.37-.14 2.87 0 5.2 2.33 5.2 5.2s-2.33 5.2-5.2 5.2h-7.8c-.33 0-.6.27-.6.6s.27.6.6.6h7.8c3.53 0 6.4-2.87 6.4-6.4s-2.87-6.4-6.4-6.4z" />
      </svg>
    );
  }

  if (p === 'amazonmusic' || p === 'amazon music' || p === 'amazon') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M14.54 13.06c-.16-.09-.43-.07-.63.07-.66.47-1.37.8-2.22.8-1.52 0-2.26-.84-2.26-2.07 0-1.37.91-2.14 2.38-2.14.77 0 1.54.25 2.15.65.23.15.52.12.67-.09l.48-.68c.14-.2.1-.47-.1-.63-.82-.6-1.92-.95-3.21-.95-2.52 0-4.14 1.52-4.14 3.84 0 2.21 1.48 3.73 3.96 3.73 1.25 0 2.36-.45 3.23-1.12.23-.18.25-.49.08-.71l-.39-.4-.01-.01zM21.5 17.5c-4.8 2.9-10.7 3.4-16.5 1.2-.4-.15-.7.24-.36.56 4.97 4.6 12.39 4.1 17.43-.88.45-.45.02-1.07-.57-.88z" />
      </svg>
    );
  }

  if (p === 'tidal') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.012 3.992L8.008 7.996l4.004 4.004 4.004-4.004zm-8.02 8.02L0 8.008l4.004-4.004 3.992 4.008zm8.02 0l-4.004 4.004 4.004 4.004 4.004-4.004zm8.008-8.02l-4.004 4.004 4.004 4.004 4.004-4.004z" />
      </svg>
    );
  }

  if (p === 'deezer') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.8 3.8h4.2v2.8h-4.2zm0 4.2h4.2v2.8h-4.2zm0 4.2h4.2V15h-4.2zm0 4.2h4.2v2.8h-4.2zm0 4.2h4.2v2.8h-4.2zM13.2 8h4.2v2.8h-4.2zm0 4.2h4.2V15h-4.2zm0 4.2h4.2v2.8h-4.2zm0 4.2h4.2v2.8h-4.2zm-5.6-4.2h4.2v2.8H7.6zm0 4.2h4.2v2.8H7.6zm-5.6 0h4.2v2.8H2z" />
      </svg>
    );
  }

  if (p === 'bandcamp') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M0 18.75l7.437-13.5h16.563l-7.438 13.5z" />
      </svg>
    );
  }

  if (p === 'facebook') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }

  if (p === 'threads') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.186 24C5.558 24 0 18.665 0 12.062 0 5.485 5.512 0 12.186 0c6.649 0 12.015 5.28 12.015 11.838 0 4.19-2.228 7.91-5.753 9.77-.384.202-.857.06-1.06-.324-.202-.385-.06-.857.324-1.06 3.092-1.63 5.045-4.893 5.045-8.386 0-5.727-4.69-10.394-10.571-10.394-5.856 0-10.74 4.808-10.74 10.618 0 5.783 4.858 10.494 10.74 10.494 2.802 0 5.474-1.096 7.525-3.087.319-.31.834-.301 1.144.018.31.319.301.834-.018 1.144C18.472 22.753 15.424 24 12.186 24z" />
      </svg>
    );
  }

  return <Globe className={className} />;
}

// Map platform key to friendly display name
function getPlatformDisplayName(key: string): string {
  const map: Record<string, string> = {
    spotify: 'Spotify',
    appleMusic: 'Apple Music',
    applemusic: 'Apple Music',
    youtubeMusic: 'YouTube Music',
    youtubemusic: 'YouTube Music',
    youtube: 'YouTube',
    soundcloud: 'SoundCloud',
    soundCloud: 'SoundCloud',
    amazonMusic: 'Amazon Music',
    amazonmusic: 'Amazon Music',
    tidal: 'TIDAL',
    deezer: 'Deezer',
    bandcamp: 'Bandcamp',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    twitter: 'X / Twitter',
    x: 'X (Twitter)',
    facebook: 'Facebook',
    threads: 'Threads',
    snapchat: 'Snapchat',
    website: 'Official Website',
  };
  return map[key] || key.toUpperCase();
}

// Action label by platform
function getPlatformActionLabel(key: string): string {
  const k = key.toLowerCase();
  if (k.includes('spotify') || k.includes('apple') || k.includes('music') || k.includes('deezer') || k.includes('tidal') || k.includes('sound') || k.includes('bandcamp')) {
    return 'STREAM';
  }
  if (k.includes('youtube')) {
    return 'WATCH';
  }
  if (k.includes('instagram') || k.includes('tiktok') || k.includes('twitter') || k.includes('x') || k.includes('threads') || k.includes('facebook')) {
    return 'FOLLOW';
  }
  return 'VISIT';
}

export default function ArtistDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();
  const { playTrack, currentTrack, isPlaying } = useAudio();

  const [artist, setArtist] = useState<Artist | null | undefined>(undefined);
  const [artistReleases, setArtistReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadArtistData() {
      if (!slug) return;
      try {
        setLoading(true);
        const [artistRes, releasesRes] = await Promise.all([
          fetch(`/api/artists/${slug}`),
          fetch('/api/releases'),
        ]);

        let loadedArtist: Artist | null = null;

        if (artistRes.ok) {
          const aData = await artistRes.json();
          if (aData.artist) {
            loadedArtist = aData.artist;
          }
        }

        setArtist(loadedArtist);

        if (loadedArtist) {
          const name = loadedArtist.stageName || loadedArtist.name;
          document.title = `${name} — CHENAB MEDIA`;

          if (releasesRes.ok) {
            const rData = await releasesRes.json();
            if (rData.releases && Array.isArray(rData.releases)) {
              const matched = rData.releases.filter(
                (r: Release) =>
                  (r.artistIds && r.artistIds.includes(loadedArtist!.id)) ||
                  (r.artistName &&
                    r.artistName.toLowerCase().includes((loadedArtist!.stageName || loadedArtist!.name || '').toLowerCase()))
              );
              // Sort newest first
              matched.sort(
                (a: Release, b: Release) =>
                  new Date(b.releaseDate || '').getTime() - new Date(a.releaseDate || '').getTime()
              );
              setArtistReleases(matched);
            }
          } else {
            setArtistReleases([]);
          }
        } else {
          document.title = 'Artist Not Found — CHENAB MEDIA';
          setArtistReleases([]);
        }
      } catch (err) {
        console.warn('Error loading public artist details:', err);
        setArtist(null);
        setArtistReleases([]);
      } finally {
        setLoading(false);
      }
    }

    loadArtistData();
  }, [slug]);

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://chenabmedia.in/artist/${slug}`;
    const shareTitle = artist ? `${artist.stageName || artist.name} on Chenab Media` : 'Chenab Media Artist';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Check out ${artist?.stageName || 'this artist'} on Chenab Media.`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Loading skeleton layout
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060606] text-[#F5F5F5] font-sans pb-24 pt-6 px-4 sm:px-6">
        <div className="max-w-xl mx-auto space-y-8 animate-pulse">
          {/* Top Bar Skeleton */}
          <div className="flex items-center justify-between py-2">
            <div className="h-6 w-24 bg-[#141414] rounded" />
            <div className="h-6 w-8 bg-[#141414] rounded-full" />
          </div>

          {/* Hero Skeleton */}
          <div className="flex flex-col items-center text-center space-y-4 pt-4">
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-[#141414] border border-[#222222]" />
            <div className="h-8 w-48 bg-[#141414] rounded mt-2" />
            <div className="h-4 w-32 bg-[#141414] rounded" />
            <div className="h-12 w-full max-w-md bg-[#141414] rounded" />
          </div>

          {/* Social Row Skeleton */}
          <div className="flex justify-center gap-3 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full bg-[#141414] border border-[#222222]" />
            ))}
          </div>

          {/* Streaming Cards Skeleton */}
          <div className="space-y-3 pt-4">
            <div className="h-4 w-28 bg-[#141414] rounded mx-auto" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 w-full bg-[#111111] border border-[#1A1A1A] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!artist) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#060606] px-4">
        <div className="max-w-md w-full text-center space-y-6 border border-[#1C1C1C] bg-[#0A0A0A] p-8 sm:p-10">
          <div className="w-16 h-16 mx-auto rounded-full border border-[#222222] bg-[#111111] flex items-center justify-center text-[#888888]">
            <Disc size={28} className="text-[#555555]" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display font-black text-2xl sm:text-3xl text-[#F5F5F5] uppercase tracking-tight">
              ARTIST NOT FOUND
            </h1>
            <p className="font-mono text-xs text-[#888888] leading-relaxed">
              The requested artist profile does not exist or has been relocated within the CHENAB roster directory.
            </p>
          </div>
          <button
            onClick={() => router.push('/artists')}
            className="w-full min-h-[44px] px-6 py-3 bg-[#F5F5F5] text-[#080808] font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors"
          >
            EXPLORE ARTIST ROSTER
          </button>
        </div>
      </div>
    );
  }

  const stageName = artist.stageName || artist.name || 'Chenab Artist';
  const image =
    artist.profileImage ||
    artist.image ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80';
  const location = artist.location || 'Jammu & Kashmir';
  const genres = artist.genres || [];
  const bio = artist.bio || '';
  const socialLinks: Record<string, string | undefined> = artist.socialLinks || {};
  const streamingLinks: Record<string, string | undefined> = {
    ...(artist.streamingLinks || {}),
    ...(artist.socialLinks || {}),
  };

  // Compile valid streaming links with non-empty URLs
  const validDSPs: { key: string; name: string; url: string; action: string }[] = [];
  const dspPriority = [
    'spotify',
    'appleMusic',
    'youtubeMusic',
    'youtube',
    'amazonMusic',
    'soundcloud',
    'tidal',
    'deezer',
    'bandcamp',
  ];

  const addedKeys = new Set<string>();

  dspPriority.forEach((k) => {
    const url = streamingLinks[k];
    if (url && typeof url === 'string' && url.trim().length > 0 && !addedKeys.has(k.toLowerCase())) {
      validDSPs.push({
        key: k,
        name: getPlatformDisplayName(k),
        url: url.trim(),
        action: getPlatformActionLabel(k),
      });
      addedKeys.add(k.toLowerCase());
    }
  });

  // Also check any extra keys in streamingLinks
  Object.entries(streamingLinks).forEach(([k, v]) => {
    if (
      v &&
      typeof v === 'string' &&
      v.trim().length > 0 &&
      !addedKeys.has(k.toLowerCase()) &&
      !['instagram', 'twitter', 'x', 'facebook', 'tiktok', 'threads', 'snapchat'].includes(k.toLowerCase())
    ) {
      validDSPs.push({
        key: k,
        name: getPlatformDisplayName(k),
        url: v.trim(),
        action: getPlatformActionLabel(k),
      });
      addedKeys.add(k.toLowerCase());
    }
  });

  // Compile valid social links with non-empty URLs
  const socialPriority = ['instagram', 'youtube', 'tiktok', 'x', 'twitter', 'threads', 'facebook', 'soundcloud', 'website'];
  const validSocials: { key: string; name: string; url: string }[] = [];
  const addedSocials = new Set<string>();

  socialPriority.forEach((k) => {
    const url = socialLinks[k];
    if (url && typeof url === 'string' && url.trim().length > 0 && !addedSocials.has(k.toLowerCase())) {
      validSocials.push({
        key: k,
        name: getPlatformDisplayName(k),
        url: url.trim(),
      });
      addedSocials.add(k.toLowerCase());
    }
  });

  // Latest release
  const latestRelease: Release | undefined = artistReleases.length > 0 ? artistReleases[0] : undefined;

  return (
    <div className="min-h-screen bg-[#050505] text-[#EFEFEF] font-sans pb-28 relative selection:bg-white selection:text-black">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-sky-950/20 via-slate-900/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-emerald-950/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-purple-950/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 space-y-8 sm:space-y-10">
        {/* Top Floating Control Bar */}
        <header className="flex items-center justify-between border-b border-[#181818] pb-3">
          <Link
            href="/artists"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#888888] hover:text-[#FFFFFF] transition-colors uppercase tracking-widest min-h-[44px] px-2 -ml-2"
          >
            <ArrowLeft size={13} />
            <span>ROSTER</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-950/30 font-mono text-[10px] text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>OFFICIAL ROSTER</span>
            </div>

            <button
              onClick={handleShare}
              aria-label="Share Artist Profile"
              className="w-10 h-10 rounded-full border border-[#222222] bg-[#0F0F0F] hover:border-[#444444] text-[#CCCCCC] hover:text-white flex items-center justify-center transition-all relative"
            >
              {copied ? <Check size={15} className="text-emerald-400" /> : <Share2 size={15} />}
              {copied && (
                <span className="absolute -bottom-8 right-0 bg-[#151515] border border-[#2A2A2A] text-[10px] font-mono text-emerald-400 px-2 py-0.5 whitespace-nowrap shadow-xl">
                  LINK COPIED
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <div className="flex flex-col items-center text-center space-y-4 pt-2">
          {/* Artist Avatar */}
          <div className="relative group">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full p-1 border-2 border-[#242424] bg-gradient-to-b from-[#1C1C1C] to-[#0A0A0A] shadow-2xl overflow-hidden relative">
              <img
                src={image}
                alt={stageName}
                className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-7 h-7 rounded-full bg-[#0A0A0A] border border-[#262626] flex items-center justify-center text-sky-400 shadow-md">
              <Sparkles size={13} fill="currentColor" />
            </div>
          </div>

          {/* Artist Name & Meta */}
          <div className="space-y-1.5 max-w-lg">
            <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-[#FFFFFF] tracking-tight uppercase leading-tight">
              {stageName}
            </h1>

            <div className="flex items-center justify-center gap-2 font-mono text-xs text-[#888888]">
              <MapPin size={13} className="text-[#AAAAAA]" />
              <span className="text-[#CCCCCC] uppercase tracking-wider">{location}</span>
            </div>

            {genres.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                {genres.map((g, idx) => (
                  <span
                    key={idx}
                    className="font-mono text-[10px] sm:text-[11px] text-[#A0A0A0] px-2.5 py-0.5 bg-[#111111] border border-[#202020] rounded-full uppercase"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bio text */}
          {bio && (
            <p className="font-sans text-xs sm:text-sm text-[#B5B5B5] leading-relaxed max-w-lg pt-1 text-center font-normal">
              {bio}
            </p>
          )}

          {artist.featuredQuote && (
            <div className="border-l-2 border-[#555555] bg-[#0E0E0E]/60 border border-[#1A1A1A] p-3 max-w-lg text-left my-2">
              <p className="font-serif italic text-xs sm:text-sm text-[#D5D5D5] leading-snug">
                “{artist.featuredQuote}”
              </p>
            </div>
          )}

          {/* Compact Social Icon Row */}
          {validSocials.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              {validSocials.map((s) => (
                <a
                  key={s.key}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${stageName} on ${s.name}`}
                  className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl border border-[#222222] bg-[#0F0F0F] hover:bg-[#181818] hover:border-[#444444] text-[#CCCCCC] hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm"
                >
                  <PlatformIcon platform={s.key} className="w-5 h-5" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Featured / Latest Release Hero Card */}
        {latestRelease && (
          <section className="space-y-3 pt-2">
            <div className="flex items-center justify-between font-mono text-[11px] text-[#777777] uppercase tracking-widest px-1">
              <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
                <Music2 size={13} />
                LATEST RELEASE
              </span>
              <span>{(latestRelease.releaseDate || '').split('-')[0]}</span>
            </div>

            <div className="border border-[#202020] bg-gradient-to-br from-[#121212] via-[#0E0E0E] to-[#0A0A0A] p-4 sm:p-5 rounded-2xl hover:border-[#383838] transition-all duration-300 shadow-xl relative overflow-hidden group">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-[#181818] border border-[#242424] shrink-0 shadow-lg">
                  <img
                    src={latestRelease.cover || latestRelease.coverImage}
                    alt={latestRelease.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 bg-[#080808]/90 backdrop-blur-md px-2 py-0.5 font-mono text-[10px] text-white border border-[#252525] rounded">
                    {latestRelease.type || latestRelease.releaseType || 'SINGLE'}
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2 w-full">
                  <div className="space-y-0.5">
                    <span className="font-mono text-[10px] text-[#777777] uppercase tracking-wider block">
                      {latestRelease.catalogueNumber}
                    </span>
                    <h2 className="font-display font-bold text-xl sm:text-2xl text-white tracking-tight leading-tight">
                      {latestRelease.title}
                    </h2>
                    <p className="font-mono text-xs text-[#999999] uppercase">{stageName}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                    <Link
                      href={`/release/${latestRelease.slug || latestRelease.id}`}
                      className="px-4 py-2.5 min-h-[44px] rounded-xl bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#E5E5E5] transition-colors flex items-center gap-1.5 shadow-md"
                    >
                      <Disc size={14} />
                      <span>LISTEN / DETAILS</span>
                    </Link>

                    {latestRelease.tracks &&
                      latestRelease.tracks.length > 0 &&
                      Boolean(latestRelease.tracks[0]?.audioPreviewUrl) && (
                        (() => {
                          const firstTrack = latestRelease.tracks[0];
                          const isCurrentActive =
                            (currentTrack?.track?.id && currentTrack.track.id === firstTrack.id) ||
                            (currentTrack?.track?.title === firstTrack.title &&
                              currentTrack?.releaseTitle === latestRelease.title);
                          const isPlayingThis = isCurrentActive && isPlaying;

                          return (
                            <button
                              id="artist-latest-release-preview-btn"
                              onClick={() =>
                                playTrack(
                                  firstTrack,
                                  latestRelease.title,
                                  latestRelease.artistName || stageName,
                                  latestRelease.cover || latestRelease.coverImage || ''
                                )
                              }
                              aria-label={`${isPlayingThis ? 'Pause' : 'Play'} audio preview for ${firstTrack.title}`}
                              className="px-4 py-2.5 min-h-[44px] rounded-xl border border-[#2C2C2C] bg-[#141414] hover:bg-[#1E1E1E] text-white font-mono text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 focus-visible:ring-1 focus-visible:ring-white"
                            >
                              {isPlayingThis ? (
                                <>
                                  <Pause size={13} />
                                  <span>PAUSE</span>
                                </>
                              ) : (
                                <>
                                  <Play size={13} fill="currentColor" />
                                  <span>PREVIEW</span>
                                </>
                              )}
                            </button>
                          );
                        })()
                      )}

                    {latestRelease.smartLink?.slug && (
                      <Link
                        href={`/listen/${latestRelease.smartLink.slug}`}
                        className="px-3.5 py-2.5 min-h-[44px] rounded-xl border border-sky-900/40 bg-sky-950/20 hover:bg-sky-900/30 text-sky-300 font-mono text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                      >
                        <Radio size={13} />
                        <span>SMARTLINK</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Prominent LISTEN NOW / DSP Streaming Links */}
        {validDSPs.length > 0 && (
          <section className="space-y-3 pt-2">
            <div className="flex items-center justify-between font-mono text-[11px] text-[#777777] uppercase tracking-widest px-1">
              <span className="flex items-center gap-1.5 text-[#CCCCCC] font-semibold">
                <Radio size={13} className="text-white" />
                STREAMING PLATFORMS
              </span>
              <span>{validDSPs.length} PLATFORMS</span>
            </div>

            <div className="space-y-2.5">
              {validDSPs.map((dsp) => (
                <a
                  key={dsp.key}
                  href={dsp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[52px] p-3.5 sm:px-4 rounded-xl border border-[#202020] bg-gradient-to-r from-[#0F0F0F] via-[#121212] to-[#0D0D0D] hover:border-[#444444] hover:from-[#171717] hover:to-[#121212] text-[#F5F5F5] flex items-center justify-between transition-all duration-200 group shadow-md"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-[#181818] border border-[#262626] flex items-center justify-center text-white group-hover:border-[#555555] transition-colors shrink-0">
                      <PlatformIcon platform={dsp.key} className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-display font-bold text-sm sm:text-base text-white group-hover:text-sky-300 transition-colors">
                        {dsp.name}
                      </div>
                      <span className="font-mono text-[10px] text-[#777777] uppercase tracking-wider block sm:hidden">
                        {dsp.action}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-block font-mono text-xs font-semibold text-[#888888] group-hover:text-white uppercase tracking-wider transition-colors">
                      {dsp.action}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-[#151515] border border-[#222222] group-hover:border-[#444444] flex items-center justify-center text-[#888888] group-hover:text-white transition-colors">
                      <ExternalLink size={13} />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Discography / Releases Section */}
        {artistReleases.length > 0 && (
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between font-mono text-[11px] text-[#777777] uppercase tracking-widest px-1">
              <span className="flex items-center gap-1.5 text-[#CCCCCC] font-semibold">
                <Disc size={13} className="text-white" />
                DISCOGRAPHY ({artistReleases.length})
              </span>
              <Link href="/releases" className="text-[#888888] hover:text-white transition-colors">
                FULL CATALOG &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {artistReleases.map((rel) => (
                <div
                  key={rel.id}
                  className="border border-[#1E1E1E] bg-[#0D0D0D] p-3.5 rounded-xl hover:border-[#3A3A3A] transition-all duration-200 flex flex-col justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#161616] border border-[#242424] shrink-0 relative">
                      <img
                        src={rel.cover || rel.coverImage}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 font-mono text-[10px] text-[#777777]">
                        <span>{rel.type || rel.releaseType || 'SINGLE'}</span>
                        <span>•</span>
                        <span>{(rel.releaseDate || '').split('-')[0]}</span>
                      </div>
                      <h3 className="font-display font-bold text-sm sm:text-base text-white truncate group-hover:text-sky-300 transition-colors">
                        <Link href={`/release/${rel.slug || rel.id}`}>{rel.title}</Link>
                      </h3>
                      <span className="font-mono text-[10px] text-[#666666] truncate block">
                        {rel.catalogueNumber}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#181818] font-mono text-[11px]">
                    {rel.tracks && rel.tracks.length > 0 ? (
                      <button
                        onClick={() =>
                          playTrack(
                            rel.tracks![0],
                            rel.title,
                            rel.artistName || stageName,
                            rel.cover || rel.coverImage || ''
                          )
                        }
                        className="text-[#888888] hover:text-white flex items-center gap-1 min-h-[36px] py-1"
                      >
                        <Play size={12} fill="currentColor" />
                        <span>PLAY</span>
                      </button>
                    ) : (
                      <span className="text-[#555555]">PREVIEW</span>
                    )}

                    <Link
                      href={`/release/${rel.slug || rel.id}`}
                      className="text-white hover:underline min-h-[36px] py-1 inline-flex items-center gap-1 font-semibold"
                    >
                      <span>DETAILS</span>
                      <span>&rarr;</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Official Booking & Contact Inquiries */}
        <section className="pt-4 border-t border-[#181818]">
          <div className="border border-[#202020] bg-[#0A0A0A] p-5 rounded-2xl text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#141414] border border-[#242424] mx-auto flex items-center justify-center text-[#AAAAAA]">
              <Mail size={16} />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-bold text-base sm:text-lg text-white uppercase tracking-tight">
                BOOKING & PRESS INQUIRIES
              </h3>
              <p className="font-mono text-xs text-[#888888] max-w-sm mx-auto">
                For official show bookings, festival appearances, synchronization licensing, and press relations.
              </p>
            </div>
            <div className="pt-1">
              <Link
                href={`/contact?subject=${encodeURIComponent(`Booking Inquiry — ${stageName}`)}`}
                className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] bg-[#141414] border border-[#2E2E2E] hover:border-[#666666] hover:bg-[#1E1E1E] text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
              >
                <span>CONTACT CHENAB A&R / MGMT</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        </section>

        {/* Minimal Footer */}
        <footer className="text-center font-mono text-[11px] text-[#555555] space-y-2 pt-6 pb-12">
          <Link href="/" className="hover:text-[#CCCCCC] transition-colors uppercase tracking-widest block">
            CHENAB MEDIA • INDEPENDENT RECORD LABEL
          </Link>
          <p>© {new Date().getFullYear()} CHENAB MEDIA. ALL RIGHTS RESERVED.</p>
        </footer>
      </div>
    </div>
  );
}
