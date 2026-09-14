'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Play, ArrowLeft, Disc, ExternalLink, Music, Info, Sparkles, Loader2 } from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { Release, Artist } from '@/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ReleaseDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();
  const { playTrack, currentTrack, isPlaying, togglePlay } = useAudio();

  const [release, setRelease] = useState<Release | undefined>(undefined);
  const [primaryArtist, setPrimaryArtist] = useState<Artist | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadRelease() {
      if (!slug) return;
      try {
        setLoading(true);
        const [relRes, artistsRes] = await Promise.all([
          fetch(`/api/releases/${slug}`),
          fetch('/api/artists'),
        ]);

        let loadedRel: Release | undefined = undefined;

        if (relRes.ok) {
          const json = await relRes.json();
          if (json.release) {
            loadedRel = json.release;
          }
        }

        setRelease(loadedRel);

        if (loadedRel) {
          document.title = `${loadedRel.title} — ${loadedRel.artistName} | CHENAB MEDIA`;

          let artistList: Artist[] = [];
          if (artistsRes.ok) {
            const aJson = await artistsRes.json();
            if (aJson.artists && aJson.artists.length > 0) {
              artistList = aJson.artists;
            }
          }

          const matchedArtist =
            (loadedRel.artistIds && loadedRel.artistIds.length > 0
              ? artistList.find((a) => a.id === loadedRel!.artistIds[0])
              : undefined) ||
            artistList.find(
              (a) =>
                (a.stageName || a.name || '').toLowerCase() ===
                (loadedRel!.artistName || '').toLowerCase()
            );

          setPrimaryArtist(matchedArtist);
        } else {
          document.title = 'Release Not Found | CHENAB MEDIA';
        }
      } catch (e) {
        console.error('Failed to load release from API:', e);
        setRelease(undefined);
        setPrimaryArtist(undefined);
      } finally {
        setLoading(false);
      }
    }

    loadRelease();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-28 text-center space-y-4">
        <Loader2 size={32} className="mx-auto text-[#666666] animate-spin" />
        <p className="font-mono text-xs text-[#888888] tracking-widest uppercase">
          LOADING RELEASE...
        </p>
      </div>
    );
  }

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

  const artistSlug = primaryArtist ? (primaryArtist.slug || primaryArtist.id) : undefined;
  const streaming = release.streamingLinks || release.dspLinks || {};
  const tracks = release.tracks || [];
  const credits = release.credits || [];
  const genres = release.genres || (release.genre ? [release.genre] : ['Electronic']);

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
          {release.catalogueNumber} // {release.releaseType || release.type}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
        <div className="lg:col-span-5 space-y-6 sm:space-y-8">
          <div className="relative aspect-square overflow-hidden bg-[#151515] border border-[#222222] shadow-2xl group">
            <img
              src={release.cover || release.coverImage}
              alt={release.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-[#080808]/90 backdrop-blur-md px-2.5 sm:px-3 py-1 font-mono text-xs text-[#F5F5F5] border border-[#222222]">
              {release.catalogueNumber}
            </div>
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-[#080808]/90 backdrop-blur-md px-2.5 sm:px-3 py-1 font-mono text-xs text-[#F5F5F5] border border-[#222222] uppercase">
              {release.status}
            </div>
          </div>

          {/* Smart Link / Listen Hub Banner */}
          <div className="p-4 sm:p-5 bg-[#0C0C0C] border border-[#222222] space-y-3">
            <div className="flex items-center justify-between font-mono text-xs text-[#888888]">
              <span className="flex items-center gap-1.5 text-[#F5F5F5]">
                <Sparkles size={13} className="text-amber-400" />
                OFFICIAL SMART LINK
              </span>
              <span className="text-[10px] text-[#666666]">CHENAB DSP HUB</span>
            </div>
            <p className="font-sans text-xs text-[#888888] leading-relaxed">
              Listen, stream, and purchase lossless masters across all major streaming platforms.
            </p>
            <Link
              href={`/listen/${release.smartLink?.slug || release.slug || release.id}`}
              className="w-full py-2.5 px-4 bg-[#141414] hover:bg-[#1C1C1C] border border-[#333333] hover:border-[#666666] text-[#F5F5F5] font-mono text-xs uppercase flex items-center justify-between transition-colors min-h-[44px]"
            >
              <span>OPEN DSP LAUNCHPAD (/listen)</span>
              <ExternalLink size={13} />
            </Link>
          </div>

          {/* Streaming DSP Grid */}
          <div className="space-y-3 pt-2">
            <h3 className="font-mono text-xs text-[#888888] tracking-widest uppercase">
              DIRECT STREAMING PLATFORMS
            </h3>
            <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
              {streaming.spotify && (
                <a
                  href={streaming.spotify}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2.5 border border-[#222222] bg-[#0C0C0C] hover:border-[#444444] text-[#F5F5F5] flex items-center justify-between min-h-[44px]"
                >
                  <span>SPOTIFY</span>
                  <ExternalLink size={12} className="text-[#888888]" />
                </a>
              )}
              {streaming.appleMusic && (
                <a
                  href={streaming.appleMusic}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2.5 border border-[#222222] bg-[#0C0C0C] hover:border-[#444444] text-[#F5F5F5] flex items-center justify-between min-h-[44px]"
                >
                  <span>APPLE MUSIC</span>
                  <ExternalLink size={12} className="text-[#888888]" />
                </a>
              )}
              {streaming.youtubeMusic && (
                <a
                  href={streaming.youtubeMusic}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2.5 border border-[#222222] bg-[#0C0C0C] hover:border-[#444444] text-[#F5F5F5] flex items-center justify-between min-h-[44px]"
                >
                  <span>YOUTUBE</span>
                  <ExternalLink size={12} className="text-[#888888]" />
                </a>
              )}
              {streaming.bandcamp && (
                <a
                  href={streaming.bandcamp}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2.5 border border-[#222222] bg-[#0C0C0C] hover:border-[#444444] text-[#F5F5F5] flex items-center justify-between min-h-[44px]"
                >
                  <span>BANDCAMP</span>
                  <ExternalLink size={12} className="text-[#888888]" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-8 sm:space-y-10">
          <div className="space-y-3 sm:space-y-4 border-b border-[#1C1C1C] pb-6 sm:pb-8">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[#888888]">
              <span className="text-[#F5F5F5] uppercase font-bold">{release.releaseType || release.type}</span>
              <span>&bull;</span>
              <span>RELEASE DATE: {release.releaseDate}</span>
            </div>

            <h1 className="font-display font-black text-[clamp(2rem,5.5vw,3.75rem)] text-[#F5F5F5] tracking-tight uppercase leading-none">
              {release.title}
            </h1>

            <div className="flex items-center gap-3 pt-1">
              <span className="font-sans text-base sm:text-xl text-[#CCCCCC]">
                {artistSlug ? (
                  <Link href={`/artist/${artistSlug}`} className="hover:underline hover:text-white">
                    {release.artistName}
                  </Link>
                ) : (
                  release.artistName
                )}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-2">
              {genres.map((genre, idx) => (
                <span
                  key={idx}
                  className="font-mono text-xs text-[#CCCCCC] px-3 py-1 bg-[#111111] border border-[#222222]"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-mono text-xs text-[#888888] tracking-widest uppercase">
              // CURATORIAL STATEMENT
            </h3>
            <p className="font-sans text-sm sm:text-base text-[#CCCCCC] leading-relaxed">
              {release.description}
            </p>
          </div>

          {/* Tracklist */}
          {tracks.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#1C1C1C] pb-3">
                <h3 className="font-mono text-xs text-[#888888] tracking-widest uppercase">
                  TRACKLIST ({tracks.length} TRACKS)
                </h3>
                <span className="font-mono text-[11px] text-[#666666]">DIGITAL / PHYSICAL AUDIO</span>
              </div>

              <div className="divide-y divide-[#181818] border border-[#1C1C1C] bg-[#0C0C0C]">
                {tracks.map((track, idx) => {
                  const isCurrent =
                    currentTrack?.track?.id === track.id ||
                    (currentTrack?.track?.title === track.title &&
                      currentTrack?.releaseTitle === release.title);
                  const hasPreview = Boolean(track.audioPreviewUrl && track.audioPreviewUrl.trim().length > 0);

                  return (
                    <div
                      key={track.id || idx}
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-4 hover:bg-[#111111] transition-colors group"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        {hasPreview ? (
                          <button
                            id={`play-track-${track.id || idx}`}
                            onClick={() =>
                              playTrack(
                                track,
                                release.title,
                                release.artistName,
                                release.cover || release.coverImage || ''
                              )
                            }
                            className="w-8 h-8 rounded-full border border-[#333333] flex items-center justify-center text-[#888888] group-hover:border-[#666666] group-hover:text-[#F5F5F5] transition-colors shrink-0 focus-visible:ring-1 focus-visible:ring-white"
                            title={isCurrent && isPlaying ? 'Pause audio preview' : 'Play audio preview'}
                            aria-label={`${isCurrent && isPlaying ? 'Pause' : 'Play'} preview for ${track.title}`}
                          >
                            {isCurrent && isPlaying ? (
                              <div className="flex items-end gap-0.5 h-3">
                                <span className="w-0.5 h-3 bg-[#F5F5F5] animate-pulse" />
                                <span className="w-0.5 h-2 bg-[#F5F5F5] animate-pulse delay-75" />
                                <span className="w-0.5 h-3 bg-[#F5F5F5] animate-pulse delay-150" />
                              </div>
                            ) : (
                              <Play size={12} fill="currentColor" className="ml-0.5" />
                            )}
                          </button>
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full border border-[#222222] bg-[#141414] flex items-center justify-center text-[#444444] shrink-0"
                            title="Audio preview unavailable for this track"
                            aria-label="Audio preview unavailable"
                          >
                            <Music size={12} />
                          </div>
                        )}
                        <div className="font-mono text-xs text-[#666666] w-6 shrink-0">
                          {String(track.number || idx + 1).padStart(2, '0')}
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono text-xs sm:text-sm text-[#F5F5F5] truncate group-hover:text-white">
                            {track.title}
                          </p>
                          {track.featuredArtists && track.featuredArtists.length > 0 && (
                            <p className="font-sans text-[11px] text-[#777777] truncate">
                              feat. {track.featuredArtists.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {!hasPreview && (
                          <span className="font-mono text-[9px] text-[#666666] uppercase tracking-wider hidden sm:inline-block px-1.5 py-0.5 border border-[#222222] bg-[#141414]">
                            DSP ONLY
                          </span>
                        )}
                        <div className="font-mono text-xs text-[#666666]">
                          {track.duration || '--:--'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Credits */}
          {credits.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-[#1C1C1C]">
              <h3 className="font-mono text-xs text-[#888888] tracking-widest uppercase">
                PRODUCTION & RECORDING CREDITS
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                {credits.map((c, i) => (
                  <div
                    key={i}
                    className="p-3 bg-[#0C0C0C] border border-[#1A1A1A] flex justify-between gap-4"
                  >
                    <span className="text-[#666666]">{c.role}</span>
                    <span className="text-[#F5F5F5] font-medium text-right">{c.name}</span>
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
