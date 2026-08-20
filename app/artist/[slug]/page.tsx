'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Play, Disc, MapPin, Loader2 } from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { Artist, Release } from '@/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ArtistDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();
  const { playTrack } = useAudio();

  const [artist, setArtist] = useState<Artist | null | undefined>(undefined);
  const [artistReleases, setArtistReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

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
          document.title = `${loadedArtist.stageName || loadedArtist.name} | CHENAB MEDIA Artist Roster`;

          if (releasesRes.ok) {
            const rData = await releasesRes.json();
            if (rData.releases && Array.isArray(rData.releases)) {
              const matched = rData.releases.filter(
                (r: Release) =>
                  (r.artistIds && r.artistIds.includes(loadedArtist!.id)) ||
                  (r.artistName &&
                    r.artistName.toLowerCase().includes((loadedArtist!.stageName || loadedArtist!.name || '').toLowerCase()))
              );
              setArtistReleases(matched);
            }
          } else {
            setArtistReleases([]);
          }
        } else {
          document.title = 'Artist Not Found | CHENAB MEDIA';
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-28 text-center space-y-4">
        <Loader2 size={32} className="mx-auto text-[#666666] animate-spin" />
        <p className="font-mono text-xs text-[#888888] tracking-widest uppercase">
          LOADING ARTIST PROFILE...
        </p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-28 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full border border-[#222222] bg-[#0C0C0C] flex items-center justify-center text-[#888888]">
          <Disc size={28} className="text-[#444444]" />
        </div>
        <h2 className="font-display font-black text-3xl sm:text-4xl text-[#F5F5F5] uppercase">
          ARTIST NOT FOUND
        </h2>
        <p className="font-mono text-xs text-[#888888] max-w-md mx-auto">
          The requested artist profile does not exist in the CHENAB roster directory.
        </p>
        <button
          onClick={() => router.push('/artists')}
          className="px-6 py-3 bg-[#F5F5F5] text-[#080808] font-mono text-xs font-bold uppercase hover:bg-white transition-colors"
        >
          RETURN TO DIRECTORY
        </button>
      </div>
    );
  }

  const stageName = artist.stageName || artist.name;
  const image = artist.profileImage || artist.image;
  const genres = artist.genres || [];
  const socialLinks = artist.socialLinks || {};

  return (
    <div className="space-y-10 sm:space-y-16 pb-16 sm:pb-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 pt-4 sm:pt-8 flex items-center justify-between border-b border-[#1C1C1C] pb-4 sm:pb-6">
        <button
          onClick={() => router.push('/artists')}
          className="inline-flex items-center gap-2 font-mono text-xs text-[#888888] hover:text-[#F5F5F5] transition-colors uppercase tracking-widest min-h-[44px]"
        >
          <ArrowLeft size={14} />
          <span>ARTIST DIRECTORY</span>
        </button>
        <div className="font-mono text-xs text-[#666666] tracking-widest uppercase">
          STATUS: {artist.status || 'ACTIVE'}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
        <div className="lg:col-span-5 aspect-square bg-[#151515] border border-[#222222] overflow-hidden shadow-2xl relative">
          <img
            src={image}
            alt={stageName}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-[#080808]/90 backdrop-blur-md px-2.5 sm:px-3 py-1 font-mono text-xs text-[#F5F5F5] border border-[#222222] uppercase">
            {artist.status || 'ACTIVE'}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-5 sm:space-y-6">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 font-mono text-xs text-[#888888]">
              <MapPin size={14} className="text-[#F5F5F5]" />
              <span className="text-[#F5F5F5] uppercase font-semibold">{artist.location || 'Jammu & Kashmir'}</span>
            </div>

            <h1 className="font-display font-black text-[clamp(2.25rem,6vw,4.5rem)] text-[#F5F5F5] tracking-tight uppercase leading-none">
              {stageName}
            </h1>

            <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1 sm:pt-2">
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

          <p className="font-sans text-sm sm:text-base text-[#CCCCCC] leading-relaxed">
            {artist.bio}
          </p>

          {artist.featuredQuote && (
            <div className="border-l-2 border-[#F5F5F5] pl-4 sm:pl-6 py-2 my-4">
              <blockquote className="font-serif italic text-base sm:text-xl text-[#F5F5F5] leading-snug">
                “{artist.featuredQuote}”
              </blockquote>
            </div>
          )}

          <div className="space-y-3 pt-4 border-t border-[#1C1C1C]">
            <h3 className="font-mono text-xs text-[#888888] tracking-widest uppercase">
              STREAMING & SOCIAL PROFILES
            </h3>
            <div className="flex flex-wrap gap-2.5 sm:gap-3 font-mono text-xs">
              {socialLinks.spotify && (
                <a
                  href={socialLinks.spotify}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 min-h-[44px] border border-[#222222] bg-[#0C0C0C] hover:border-[#555555] text-[#F5F5F5] flex items-center gap-2"
                >
                  <span>SPOTIFY</span>
                  <ExternalLink size={12} className="text-[#888888]" />
                </a>
              )}
              {socialLinks.appleMusic && (
                <a
                  href={socialLinks.appleMusic}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 min-h-[44px] border border-[#222222] bg-[#0C0C0C] hover:border-[#555555] text-[#F5F5F5] flex items-center gap-2"
                >
                  <span>APPLE MUSIC</span>
                  <ExternalLink size={12} className="text-[#888888]" />
                </a>
              )}
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 min-h-[44px] border border-[#222222] bg-[#0C0C0C] hover:border-[#555555] text-[#F5F5F5] flex items-center gap-2"
                >
                  <span>INSTAGRAM</span>
                  <ExternalLink size={12} className="text-[#888888]" />
                </a>
              )}
              {socialLinks.youtube && (
                <a
                  href={socialLinks.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 min-h-[44px] border border-[#222222] bg-[#0C0C0C] hover:border-[#555555] text-[#F5F5F5] flex items-center gap-2"
                >
                  <span>YOUTUBE</span>
                  <ExternalLink size={12} className="text-[#888888]" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 space-y-6 sm:space-y-8 pt-6 sm:pt-8 border-t border-[#1C1C1C]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono text-xs text-[#888888] tracking-widest uppercase">
            <Disc size={16} className="text-[#F5F5F5]" />
            <span>DISCOGRAPHY / RELEASES ({artistReleases.length})</span>
          </div>
          <Link
            href="/releases"
            className="font-mono text-xs text-[#888888] hover:text-[#F5F5F5] transition-colors py-1 min-h-[36px] inline-flex items-center"
          >
            VIEW FULL LABEL CATALOGUE &rarr;
          </Link>
        </div>

        {artistReleases.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-[#222222] font-mono text-xs text-[#666666]">
            NO RELEASES FOUND FOR THIS ARTIST IN THE ARCHIVE.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {artistReleases.map((release) => (
              <div
                key={release.id}
                className="group border border-[#1A1A1A] bg-[#0C0C0C] p-4 sm:p-5 hover:border-[#333333] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square overflow-hidden bg-[#151515] mb-4 sm:mb-5">
                    <img
                      src={release.cover || release.coverImage}
                      alt={release.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-[#080808]/90 backdrop-blur-md px-2.5 py-1 font-mono text-xs text-[#F5F5F5] border border-[#222222]">
                      {release.catalogueNumber}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-mono text-[11px] text-[#777777]">
                      <span>{release.type || release.releaseType}</span>
                      <span>{(release.releaseDate || '').split('-')[0]}</span>
                    </div>
                    <h3 className="font-display font-bold text-lg sm:text-xl text-[#F5F5F5] group-hover:text-white transition-colors">
                      <Link href={`/release/${release.slug || release.id}`}>{release.title}</Link>
                    </h3>
                  </div>
                </div>

                <div className="pt-4 sm:pt-5 mt-4 sm:mt-5 border-t border-[#181818] flex items-center justify-between font-mono text-xs">
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
                      className="text-[#888888] hover:text-[#F5F5F5] flex items-center gap-1.5 min-h-[36px] py-1"
                    >
                      <Play size={12} fill="currentColor" />
                      <span>PREVIEW</span>
                    </button>
                  )}
                  <Link
                    href={`/release/${release.slug || release.id}`}
                    className="text-[#F5F5F5] hover:underline min-h-[36px] py-1 inline-flex items-center"
                  >
                    DETAILS &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
