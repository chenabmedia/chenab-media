'use client';

import React, { useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Play, Disc, MapPin } from 'lucide-react';
import { getArtistBySlug } from '@/data/artists';
import { getReleasesByArtistId } from '@/data/releases';
import { useAudio } from '@/context/AudioContext';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ArtistDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();
  const { playTrack } = useAudio();

  const artist = slug ? getArtistBySlug(slug) : undefined;

  useEffect(() => {
    if (artist) {
      document.title = `${artist.name} | CHENAB MEDIA Artist Roster`;
    } else {
      document.title = 'Artist Not Found | CHENAB MEDIA';
    }
  }, [artist]);

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

  const artistReleases = getReleasesByArtistId(artist.id);

  return (
    <div className="space-y-16 pb-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 pt-8 flex items-center justify-between border-b border-[#1C1C1C] pb-6">
        <button
          onClick={() => router.push('/artists')}
          className="inline-flex items-center gap-2 font-mono text-xs text-[#888888] hover:text-[#F5F5F5] transition-colors uppercase tracking-widest"
        >
          <ArrowLeft size={14} />
          <span>ARTIST DIRECTORY</span>
        </button>
        <div className="font-mono text-xs text-[#666666] tracking-widest uppercase">
          STATUS: {artist.status}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5 aspect-square bg-[#151515] border border-[#222222] overflow-hidden shadow-2xl relative">
          <img
            src={artist.image}
            alt={artist.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 bg-[#080808]/90 backdrop-blur-md px-3 py-1 font-mono text-xs text-[#F5F5F5] border border-[#222222] uppercase">
            {artist.status}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs text-[#888888]">
              <MapPin size={14} className="text-[#F5F5F5]" />
              <span className="text-[#F5F5F5] uppercase font-semibold">{artist.location}</span>
            </div>

            <h1 className="font-display font-black text-4xl sm:text-6xl text-[#F5F5F5] tracking-tight uppercase leading-none">
              {artist.name}
            </h1>

            <div className="flex flex-wrap gap-2 pt-2">
              {artist.genres.map((genre, idx) => (
                <span
                  key={idx}
                  className="font-mono text-xs text-[#CCCCCC] px-3 py-1 bg-[#111111] border border-[#222222]"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>

          <p className="font-sans text-base text-[#CCCCCC] leading-relaxed">
            {artist.bio}
          </p>

          {artist.featuredQuote && (
            <div className="border-l-2 border-[#F5F5F5] pl-6 py-2 my-4">
              <blockquote className="font-serif italic text-lg sm:text-xl text-[#F5F5F5]">
                “{artist.featuredQuote}”
              </blockquote>
            </div>
          )}

          <div className="space-y-3 pt-4 border-t border-[#1C1C1C]">
            <h3 className="font-mono text-xs text-[#888888] tracking-widest uppercase">
              STREAMING & SOCIAL PROFILES
            </h3>
            <div className="flex flex-wrap gap-3 font-mono text-xs">
              {artist.socialLinks.spotify && (
                <a
                  href={artist.socialLinks.spotify}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 border border-[#222222] bg-[#0C0C0C] hover:border-[#555555] text-[#F5F5F5] flex items-center gap-2"
                >
                  <span>SPOTIFY</span>
                  <ExternalLink size={12} className="text-[#888888]" />
                </a>
              )}
              {artist.socialLinks.appleMusic && (
                <a
                  href={artist.socialLinks.appleMusic}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 border border-[#222222] bg-[#0C0C0C] hover:border-[#555555] text-[#F5F5F5] flex items-center gap-2"
                >
                  <span>APPLE MUSIC</span>
                  <ExternalLink size={12} className="text-[#888888]" />
                </a>
              )}
              {artist.socialLinks.instagram && (
                <a
                  href={artist.socialLinks.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 border border-[#222222] bg-[#0C0C0C] hover:border-[#555555] text-[#F5F5F5] flex items-center gap-2"
                >
                  <span>INSTAGRAM</span>
                  <ExternalLink size={12} className="text-[#888888]" />
                </a>
              )}
              {artist.socialLinks.youtube && (
                <a
                  href={artist.socialLinks.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 border border-[#222222] bg-[#0C0C0C] hover:border-[#555555] text-[#F5F5F5] flex items-center gap-2"
                >
                  <span>YOUTUBE</span>
                  <ExternalLink size={12} className="text-[#888888]" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-8 pt-8 border-t border-[#1C1C1C]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs text-[#888888] tracking-widest uppercase">
            <Disc size={16} className="text-[#F5F5F5]" />
            <span>DISCOGRAPHY / RELEASES ({artistReleases.length})</span>
          </div>
          <Link
            href="/releases"
            className="font-mono text-xs text-[#888888] hover:text-[#F5F5F5] transition-colors"
          >
            VIEW FULL LABEL CATALOGUE &rarr;
          </Link>
        </div>

        {artistReleases.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-[#222222] font-mono text-xs text-[#666666]">
            NO RELEASES FOUND FOR THIS ARTIST IN THE ARCHIVE.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {artistReleases.map((release) => (
              <div
                key={release.id}
                className="group border border-[#1A1A1A] bg-[#0C0C0C] p-5 hover:border-[#333333] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square overflow-hidden bg-[#151515] mb-5">
                    <img
                      src={release.cover}
                      alt={release.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-[#080808]/90 backdrop-blur-md px-2.5 py-1 font-mono text-xs text-[#F5F5F5] border border-[#222222]">
                      {release.catalogueNumber}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-mono text-[11px] text-[#777777]">
                      <span>{release.type}</span>
                      <span>{release.releaseDate.split('-')[0]}</span>
                    </div>
                    <h3 className="font-display font-bold text-xl text-[#F5F5F5] group-hover:text-white transition-colors">
                      <Link href={`/release/${release.slug}`}>{release.title}</Link>
                    </h3>
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-[#181818] flex items-center justify-between font-mono text-xs">
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
                      className="text-[#888888] hover:text-[#F5F5F5] flex items-center gap-1"
                    >
                      <Play size={12} fill="currentColor" />
                      <span>PREVIEW</span>
                    </button>
                  )}
                  <Link
                    href={`/release/${release.slug}`}
                    className="text-[#F5F5F5] hover:underline"
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
