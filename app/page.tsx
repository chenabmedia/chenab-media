'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Play, ChevronRight } from 'lucide-react';
import { getAllReleases } from '@/data/releases';
import { getAllArtists } from '@/data/artists';
import { getAllJournalPosts } from '@/data/journal';
import { useAudio } from '@/context/AudioContext';
import { Artist, Release } from '@/types';

export default function HomePage() {
  const { playTrack } = useAudio();
  const [releases, setReleases] = useState<Release[]>(getAllReleases());
  const [artists, setArtists] = useState<Artist[]>(getAllArtists());
  const posts = getAllJournalPosts();

  useEffect(() => {
    async function loadPublicLiveCatalog() {
      try {
        const [relRes, artRes] = await Promise.all([
          fetch('/api/releases'),
          fetch('/api/artists'),
        ]);

        if (relRes.ok) {
          const relData = await relRes.json();
          if (relData.releases && relData.releases.length > 0) {
            setReleases(relData.releases);
          }
        }

        if (artRes.ok) {
          const artData = await artRes.json();
          if (artData.artists && artData.artists.length > 0) {
            setArtists(artData.artists);
          }
        }
      } catch (err) {
        console.warn('Failed to load dynamic catalog on home page, using fallback:', err);
      }
    }

    loadPublicLiveCatalog();
  }, []);

  const featuredReleases = releases.slice(0, 4);
  const featuredArtists = artists.slice(0, 4);
  const featuredArticle = posts[0];

  return (
    <div className="space-y-32 pb-24">
      {/* Hero Section */}
      <section className="relative min-h-[85svh] flex flex-col justify-between px-5 sm:px-6 md:px-8 max-w-7xl mx-auto pt-8 sm:pt-12 md:pt-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#181818]/60 via-[#080808] to-[#080808] opacity-80" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 border-b border-[#1C1C1C] pb-4 sm:pb-6 font-mono text-[11px] sm:text-xs text-[#888888] tracking-widest w-full">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5F5F5] animate-ping shrink-0" />
            <span className="uppercase text-[#CCCCCC]">INDEPENDENT MUSIC LABEL</span>
          </div>
          <span className="text-[#666666] sm:text-[#888888]">EST. 2024 &bull; JAMMU & KASHMIR</span>
        </div>

        <div className="my-auto py-8 sm:py-12 space-y-6 sm:space-y-8 max-w-5xl w-full">
          <h1 className="font-display font-black text-[clamp(2.1rem,10.8vw,3.5rem)] sm:text-[clamp(3.5rem,11.2vw,5.5rem)] lg:text-[clamp(5.5rem,11vw,8.5rem)] tracking-tight sm:tracking-[0.04em] md:tracking-[0.08em] lg:tracking-[0.12em] text-[#F5F5F5] leading-none uppercase select-none max-w-full">
            CHENAB
          </h1>

          <p className="font-serif italic text-[clamp(1.15rem,3.8vw,2.25rem)] text-[#D0D0D0] leading-snug font-normal max-w-3xl">
            An independent creative platform exploring the intersection of traditional soundscapes and avant-garde electronics. Curated between the mountains and the pulse of the city.
          </p>

          <p className="font-sans text-sm sm:text-base text-[#888888] max-w-2xl leading-relaxed">
            Rooted in the mountain landscapes of Jammu & Kashmir and international underground electronic culture, CHENAB releases physical artefacts and lossless digital audio archives.
          </p>

          <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6 font-mono text-xs tracking-widest w-full max-w-full">
            <Link
              href="/releases"
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-[#F5F5F5] text-[#080808] font-bold hover:bg-white transition-all uppercase flex items-center justify-center gap-3 rounded-xs group min-h-[48px]"
            >
              <span>EXPLORE CATALOGUE</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/story"
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 border border-[#333333] text-[#F5F5F5] hover:border-[#666666] hover:bg-[#111111] transition-all uppercase rounded-xs flex items-center justify-center min-h-[48px]"
            >
              THE STORY
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-[#1C1C1C] font-mono text-xs text-[#888888] w-full">
          <div className="space-y-0.5">
            <p className="text-[10px] text-[#555555] uppercase tracking-widest">ARCHIVE</p>
            <p className="text-[#F5F5F5] font-semibold text-xs sm:text-sm truncate">CHNB-001 — CHNB-006</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-[#555555] uppercase tracking-widest">GENRES</p>
            <p className="text-[#F5F5F5] font-semibold text-xs sm:text-sm truncate">Drone / Ambient / Folk</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-[#555555] uppercase tracking-widest">FORMATS</p>
            <p className="text-[#F5F5F5] font-semibold text-xs sm:text-sm truncate">180g Vinyl &bull; 24-Bit</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-[#555555] uppercase tracking-widest">LOCATION</p>
            <p className="text-[#F5F5F5] font-semibold text-xs sm:text-sm truncate">Himalayas &bull; Global</p>
          </div>
        </div>
      </section>

      {/* Featured Releases Section */}
      <section className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 space-y-8 sm:space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#1C1C1C] pb-6">
          <div>
            <span className="font-mono text-xs text-[#888888] tracking-widest uppercase">
              // RECENT PRESSINGS
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-wide mt-2">
              LATEST RELEASES
            </h2>
          </div>
          <Link
            href="/releases"
            className="font-mono text-xs text-[#999999] hover:text-[#F5F5F5] transition-colors inline-flex items-center gap-2 py-1 min-h-[44px]"
          >
            <span>VIEW FULL CATALOGUE &rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {featuredReleases.map((release) => (
            <div
              key={release.id}
              className="group flex flex-col justify-between border border-[#1A1A1A] bg-[#0C0C0C] p-4 hover:border-[#333333] transition-all duration-300"
            >
              <div>
                <div className="relative aspect-square overflow-hidden bg-[#151515] mb-4">
                  <img
                    src={release.cover || release.coverImage}
                    alt={release.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute top-3 left-3 bg-[#080808]/90 backdrop-blur-md px-2 py-1 font-mono text-[10px] text-[#F5F5F5] border border-[#222222]">
                    {release.catalogueNumber}
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
                      className="absolute bottom-3 right-3 p-3 bg-[#F5F5F5] text-[#080808] rounded-full sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-xl hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Play Preview"
                      aria-label="Play Preview Track"
                    >
                      <Play size={16} fill="currentColor" />
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[11px] text-[#777777] block">
                    {release.releaseType || release.type} &bull; {release.genre || (release.genres && release.genres[0]) || 'Music'}
                  </span>
                  <h3 className="font-display font-bold text-lg text-[#F5F5F5] group-hover:text-white transition-colors line-clamp-1">
                    <Link href={`/release/${release.slug || release.id}`}>{release.title}</Link>
                  </h3>
                  <p className="font-sans text-xs text-[#999999] line-clamp-1">
                    {release.artistName}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#181818] flex items-center justify-between font-mono text-[11px] text-[#666666]">
                <span>{release.releaseDate}</span>
                <Link
                  href={`/release/${release.slug || release.id}`}
                  className="text-[#888888] hover:text-[#F5F5F5] transition-colors py-1 min-h-[36px] inline-flex items-center"
                >
                  LISTEN / ORDER &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Roster Showcase Section */}
      <section className="bg-[#0C0C0C] border-y border-[#1C1C1C] py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 space-y-8 sm:space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#1C1C1C] pb-6">
            <div>
              <span className="font-mono text-xs text-[#888888] tracking-widest uppercase">
                // ARTIST ROSTER
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-wide mt-2">
                CURRENT ARTIST ROSTER
              </h2>
            </div>
            <Link
              href="/artists"
              className="font-mono text-xs text-[#999999] hover:text-[#F5F5F5] transition-colors inline-flex items-center gap-2 py-1 min-h-[44px]"
            >
              <span>VIEW ALL ARTISTS &rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {featuredArtists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artist/${artist.slug || artist.id}`}
                className="group border border-[#1A1A1A] bg-[#080808] p-5 sm:p-6 hover:border-[#333333] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-square overflow-hidden bg-[#151515] mb-5 sm:mb-6 grayscale group-hover:grayscale-0 transition-all duration-500">
                    <img
                      src={artist.profileImage || artist.image}
                      alt={artist.stageName || artist.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <span className="font-mono text-[10px] text-[#666666] tracking-widest uppercase block">
                    {artist.location}
                  </span>
                  <h3 className="font-display font-bold text-xl text-[#F5F5F5] group-hover:text-white transition-colors mt-1">
                    {artist.stageName || artist.name}
                  </h3>
                  <p className="font-sans text-xs text-[#888888] line-clamp-2 mt-2 leading-relaxed">
                    {artist.bio}
                  </p>
                </div>

                <div className="pt-5 mt-5 border-t border-[#181818] flex items-center justify-between font-mono text-[11px] text-[#666666]">
                  <span>STATUS: {artist.status || 'ACTIVE'}</span>
                  <span className="text-[#888888] group-hover:text-[#F5F5F5] transition-colors">
                    PROFILE &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial Statement / Story Banner */}
      <section className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8">
        <div className="border border-[#222222] bg-gradient-to-b from-[#111111] to-[#080808] p-6 sm:p-12 md:p-16 space-y-6 sm:space-y-8 relative overflow-hidden">
          <div className="font-mono text-xs text-[#888888] tracking-widest uppercase">
            // LABEL MANIFESTO
          </div>

          <h2 className="font-serif italic text-2xl sm:text-4xl md:text-5xl text-[#F5F5F5] leading-snug font-normal max-w-4xl">
            “Music is not ephemeral digital noise to be discarded. It is physical resonance, memory, and geographic identity.”
          </h2>

          <p className="font-sans text-sm sm:text-base text-[#999999] max-w-2xl leading-relaxed">
            CHENAB MEDIA operates out of Jammu & Kashmir as an artist-first ecosystem. Every record in our catalogue is produced with total artistic autonomy, transparent distribution, and archival physical releases.
          </p>

          <div className="pt-2 sm:pt-4 font-mono text-xs">
            <Link
              href="/story"
              className="inline-flex items-center gap-3 text-[#F5F5F5] hover:text-white border-b border-[#F5F5F5] pb-1 uppercase tracking-widest transition-colors min-h-[44px]"
            >
              <span>READ OUR FULL STORY & ETHOS</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Journal Highlight Section */}
      {featuredArticle && (
        <section className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 space-y-8 sm:space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#1C1C1C] pb-6">
            <div>
              <span className="font-mono text-xs text-[#888888] tracking-widest uppercase">
                // FROM THE JOURNAL
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-wide mt-2">
                EDITORIAL & FIELD NOTES
              </h2>
            </div>
            <Link
              href="/journal"
              className="font-mono text-xs text-[#999999] hover:text-[#F5F5F5] transition-colors inline-flex items-center gap-2 py-1 min-h-[44px]"
            >
              <span>EXPLORE ALL JOURNAL ENTRIES</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center border border-[#1A1A1A] bg-[#0C0C0C] p-5 sm:p-8">
            <div className="lg:col-span-7 aspect-[16/9] overflow-hidden bg-[#151515]">
              <img
                src={featuredArticle.coverUrl}
                alt={featuredArticle.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>

            <div className="lg:col-span-5 space-y-4 sm:space-y-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-mono text-xs">
                <span className="px-2 py-0.5 border border-[#333333] text-[#F5F5F5] bg-[#111111]">
                  {featuredArticle.category}
                </span>
                <span className="text-[#666666]">{featuredArticle.date}</span>
                <span className="text-[#666666]">&bull; {featuredArticle.readTime}</span>
              </div>

              <h3 className="font-display font-bold text-xl sm:text-2xl md:text-3xl text-[#F5F5F5] leading-tight">
                <Link href={`/journal/${featuredArticle.slug}`} className="hover:text-white transition-colors">
                  {featuredArticle.title}
                </Link>
              </h3>

              <p className="font-sans text-xs sm:text-sm text-[#888888] leading-relaxed">
                {featuredArticle.shortExcerpt}
              </p>

              <div className="pt-2 font-mono text-xs">
                <Link
                  href={`/journal/${featuredArticle.slug}`}
                  className="text-[#F5F5F5] hover:underline inline-flex items-center gap-2 uppercase tracking-widest min-h-[44px]"
                >
                  <span>READ ARTICLE</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
