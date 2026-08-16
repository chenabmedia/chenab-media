'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Play, ArrowLeft, Disc, ExternalLink, Music, Info, Sparkles } from 'lucide-react';
import { getReleaseBySlug } from '@/data/releases';
import { getArtistById, ARTISTS } from '@/data/artists';
import { useAudio } from '@/context/AudioContext';
import { Release } from '@/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ReleaseDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();
  const { playTrack, currentTrack, isPlaying, togglePlay } = useAudio();

  const [release, setRelease] = useState<Release | undefined>(
    slug ? getReleaseBySlug(slug) : undefined
  );
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadRelease() {
      try {
        setLoading(true);
        const res = await fetch(`/api/releases/${slug}`);
        if (res.ok) {
          const json = await res.json();
          if (json.release) {
            setRelease(json.release);
          }
        }
      } catch (e) {
        console.error('Failed to load release from API:', e);
      } finally {
        setLoading(false);
      }
    }
    if (slug) loadRelease();
  }, [slug]);

  useEffect(() => {
    if (release) {
      document.title = `${release.title} — ${release.artistName} | CHENAB MEDIA`;
    } else if (!loading) {
      document.title = 'Release Not Found | CHENAB MEDIA';
    }
  }, [release, loading]);

  if (!release) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-28 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full border border-[#222222] bg-[#0C0C0C] flex items-center justify-center text-[#888888]">
          <Disc size={28} className="text-[#444444]" />
        </div>
        <h2 className="font-display font-black text-3xl sm:text-4xl text-[#F5F5F5] uppercase">
          RELEASE NOT FOUND
        </h2>
        <p className="font-mono text-xs text-[#888888] max-w-md mx-auto">
          The requested release code or slug does not exist in the CHENAB digital catalogue.
        </p>
        <button
          onClick={() => router.push('/releases')}
          className="px-6 py-3 bg-[#F5F5F5] text-[#080808] font-mono text-xs font-bold uppercase hover:bg-white transition-colors"
        >
          RETURN TO CATALOGUE
        </button>
      </div>
    );
  }

  const primaryArtist =
    release.artistIds.length > 0 ? getArtistById(release.artistIds[0]) : undefined;
  const artistSlug = primaryArtist
    ? primaryArtist.slug
    : ARTISTS.find((a) => (a.stageName || a.name || '').toLowerCase() === release.artistName.toLowerCase())?.slug;

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 py-8 sm:py-12 space-y-10 sm:space-y-16">
      <div className="flex items-center justify-between border-b border-[#1C1C1C] pb-4 sm:pb-6">
        <button
          onClick={() => router.push('/releases')}
          className="inline-flex items-center gap-2 font-mono text-xs text-[#888888] hover:text-[#F5F5F5] transition-colors uppercase tracking-widest min-h-[44px]"
        >
          <ArrowLeft size={14} />
          <span>CATALOGUE</span>
        </button>
        <div className="font-mono text-xs text-[#666666] tracking-widest uppercase">
          {release.catalogueNumber} // {release.type}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
        <div className="lg:col-span-5 space-y-6 sm:space-y-8">
          <div className="relative aspect-square overflow-hidden bg-[#151515] border border-[#222222] shadow-2xl group">
            <img
              src={release.cover}
              alt={release.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-[#080808]/90 backdrop-blur-md px-2.5 sm:px-3 py-1 font-mono text-xs text-[#F5F5F5] border border-[#222222]">
              {release.catalogueNumber}
            </div>
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-[#080808]/90 backdrop-blur-md px-2 sm:px-2.5 py-1 font-mono text-[10px] text-[#888888] border border-[#222222] uppercase">
              {release.status}
            </div>
          </div>

          {release.credits && release.credits.length > 0 && (
            <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-4 sm:p-6 space-y-4">
              <h3 className="font-mono text-xs text-[#888888] tracking-widest uppercase border-b border-[#1C1C1C] pb-3 flex items-center gap-2">
                <Info size={14} className="text-[#F5F5F5]" />
                <span>CREDITS & PRODUCTION</span>
              </h3>
              <dl className="space-y-2.5 font-mono text-xs">
                {release.credits.map((cred, idx) => (
                  <div key={idx} className="flex justify-between items-baseline gap-4">
                    <dt className="text-[#888888] shrink-0">{cred.role}:</dt>
                    <dd className="text-[#F5F5F5] text-right truncate">{cred.name}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 space-y-8 sm:space-y-10">
          <div className="space-y-3 sm:space-y-4 border-b border-[#1C1C1C] pb-6 sm:pb-8">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-mono text-xs text-[#888888]">
              <span className="px-2.5 py-0.5 border border-[#333333] text-[#F5F5F5] bg-[#111111] font-semibold">
                {release.catalogueNumber}
              </span>
              <span>{release.releaseType || release.type}</span>
              <span>&bull;</span>
              <span>{(release.genres || [release.genre || 'Music']).join(' / ')}</span>
              <span>&bull;</span>
              <span>RELEASE DATE: {release.releaseDate}</span>
            </div>

            <h1 className="font-display font-black text-[clamp(2.25rem,6vw,4.5rem)] text-[#F5F5F5] tracking-tight uppercase leading-none">
              {release.title}
            </h1>

            <h2 className="font-serif italic text-[clamp(1.25rem,3.5vw,2rem)] text-[#D0D0D0]">
              by{' '}
              {artistSlug ? (
                <Link href={`/artist/${artistSlug}`} className="underline hover:text-white transition-colors">
                  {release.artistName}
                </Link>
              ) : (
                <span>{release.artistName}</span>
              )}
            </h2>
          </div>

          <div className="space-y-3">
            <h3 className="font-mono text-xs text-[#888888] tracking-widest uppercase">
              ABOUT THIS RELEASE
            </h3>
            <p className="font-sans text-sm sm:text-base text-[#CCCCCC] leading-relaxed">
              {release.description}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1C1C1C] pb-2 font-mono text-xs text-[#888888]">
              <span>TRACKLIST ({(release.tracks && release.tracks.length) || 0})</span>
              <span>DURATION</span>
            </div>

            <div className="divide-y divide-[#181818] border border-[#1A1A1A] bg-[#0C0C0C]">
              {release.tracks && release.tracks.map((tr) => {
                const isThisPlaying =
                  currentTrack?.track.title === tr.title && isPlaying;

                return (
                  <div
                    key={tr.id}
                    className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-[#111111] transition-colors group"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <button
                        onClick={() =>
                          isThisPlaying
                            ? togglePlay()
                            : playTrack(
                                tr,
                                release.title,
                                release.artistName,
                                release.cover || release.coverImage || ''
                              )
                        }
                        className="w-10 h-10 min-w-[40px] rounded-full border border-[#333333] flex items-center justify-center text-[#F5F5F5] hover:border-[#666666] hover:bg-[#1A1A1A] transition-all"
                        title="Play Track Preview"
                        aria-label={`Play preview of ${tr.title}`}
                      >
                        {isThisPlaying ? (
                          <span className="w-2.5 h-2.5 bg-emerald-400 rounded-xs animate-pulse" />
                        ) : (
                          <Play size={14} fill="currentColor" className="ml-0.5" />
                        )}
                      </button>
                      <div>
                        <p className="font-sans font-semibold text-sm text-[#F5F5F5] group-hover:text-white flex items-center gap-2">
                          <span>
                            {String(tr.number).padStart(2, '0')} — {tr.title}
                          </span>
                        </p>
                        {tr.featuredArtists && tr.featuredArtists.length > 0 && (
                          <p className="font-mono text-[11px] text-[#888888]">
                            ft. {tr.featuredArtists.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-xs text-[#777777] shrink-0 ml-2">{tr.duration}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-[#1C1C1C]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-mono text-xs text-[#F5F5F5] tracking-widest uppercase flex items-center gap-2">
                <Music size={14} />
                <span>LISTEN / STREAM</span>
              </h3>

              <Link
                href={`/listen/${release.smartLink?.slug || release.slug}`}
                target="_blank"
                className="px-3.5 py-2 min-h-[44px] bg-[#181818] border border-[#333333] hover:border-[#666666] text-[#F5F5F5] font-mono text-xs uppercase inline-flex items-center justify-center gap-1.5"
              >
                <Sparkles size={12} className="text-amber-400" />
                <span>OPEN SMART LINK</span>
              </Link>
            </div>
            <p className="font-sans text-xs text-[#888888]">
              Stream or purchase {release.title} on official digital service providers:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3 font-mono text-xs">
              {(release.streamingLinks?.spotify || release.dspLinks?.spotify) && (
                <a
                  href={release.streamingLinks?.spotify || release.dspLinks?.spotify}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-3 min-h-[48px] border border-[#222222] bg-[#0C0C0C] hover:border-[#666666] hover:bg-[#111111] text-[#F5F5F5] flex items-center justify-between transition-all"
                >
                  <span>SPOTIFY</span>
                  <ExternalLink size={12} className="text-[#888888]" />
                </a>
              )}
              {(release.streamingLinks?.appleMusic || release.dspLinks?.appleMusic) && (
                <a
                  href={release.streamingLinks?.appleMusic || release.dspLinks?.appleMusic}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-3 min-h-[48px] border border-[#222222] bg-[#0C0C0C] hover:border-[#666666] hover:bg-[#111111] text-[#F5F5F5] flex items-center justify-between transition-all"
                >
                  <span>APPLE MUSIC</span>
                  <ExternalLink size={12} className="text-[#888888]" />
                </a>
              )}
              {(release.streamingLinks?.youtubeMusic || release.dspLinks?.youtubeMusic) && (
                <a
                  href={release.streamingLinks?.youtubeMusic || release.dspLinks?.youtubeMusic}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-3 min-h-[48px] border border-[#222222] bg-[#0C0C0C] hover:border-[#666666] hover:bg-[#111111] text-[#F5F5F5] flex items-center justify-between transition-all"
                >
                  <span>YOUTUBE MUSIC</span>
                  <ExternalLink size={12} className="text-[#888888]" />
                </a>
              )}
              {(release.streamingLinks?.soundcloud || release.dspLinks?.soundcloud) && (
                <a
                  href={release.streamingLinks?.soundcloud || release.dspLinks?.soundcloud}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-3 min-h-[48px] border border-[#222222] bg-[#0C0C0C] hover:border-[#666666] hover:bg-[#111111] text-[#F5F5F5] flex items-center justify-between transition-all"
                >
                  <span>SOUNDCLOUD</span>
                  <ExternalLink size={12} className="text-[#888888]" />
                </a>
              )}
              {(release.streamingLinks?.bandcamp || release.dspLinks?.bandcamp) && (
                <a
                  href={release.streamingLinks?.bandcamp || release.dspLinks?.bandcamp}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-3 min-h-[48px] border border-[#222222] bg-[#0C0C0C] hover:border-[#666666] hover:bg-[#111111] text-[#F5F5F5] flex items-center justify-between transition-all"
                >
                  <span>BANDCAMP</span>
                  <ExternalLink size={12} className="text-[#888888]" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
