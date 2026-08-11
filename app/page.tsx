'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Play, ChevronRight } from 'lucide-react';
import { getAllReleases } from '@/data/releases';
import { getAllArtists } from '@/data/artists';
import { getAllJournalPosts } from '@/data/journal';
import { useAudio } from '@/context/AudioContext';

export default function HomePage() {
  const { playTrack } = useAudio();
  const releases = getAllReleases();
  const artists = getAllArtists();
  const posts = getAllJournalPosts();

  const featuredReleases = releases.slice(0, 4);
  const featuredArtists = artists.slice(0, 4);
  const featuredArticle = posts[0];

  return (
    <div className="space-y-32 pb-24">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex flex-col justify-between px-6 sm:px-8 max-w-7xl mx-auto pt-12 md:pt-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#181818]/60 via-[#080808] to-[#080808] opacity-80" />

        <div className="flex items-center justify-between border-b border-[#1C1C1C] pb-6 font-mono text-xs text-[#888888] tracking-widest">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5F5F5] animate-ping" />
            <span className="uppercase text-[#CCCCCC]">INDEPENDENT MUSIC LABEL</span>
          </div>
          <span>EST. 2024 &bull; JAMMU & KASHMIR</span>
        </div>

        <div className="my-auto py-12 space-y-8 max-w-5xl">
          <h1 className="font-display font-black text-6xl sm:text-8xl lg:text-9xl tracking-[0.15em] text-[#F5F5F5] leading-none uppercase">
            CHENAB
          </h1>

          <p className="font-serif italic text-2xl sm:text-3xl lg:text-4xl text-[#D0D0D0] leading-snug font-normal max-w-3xl">
            An independent creative platform exploring the intersection of traditional soundscapes and avant-garde electronics. Curated between the mountains and the pulse of the city.
          </p>

          <p className="font-sans text-sm sm:text-base text-[#888888] max-w-2xl leading-relaxed">
            Rooted in the mountain landscapes of Jammu & Kashmir and international underground electronic culture, CHENAB releases physical artefacts and lossless digital audio archives.
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-6 font-mono text-xs tracking-widest">
            <Link
              href="/releases"
              className="px-8 py-4 bg-[#F5F5F5] text-[#080808] font-bold hover:bg-white transition-all uppercase flex items-center gap-3 rounded-xs group"
            >
              <span>EXPLORE CATALOGUE</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/story"
              className="px-8 py-4 border border-[#333333] text-[#F5F5F5] hover:border-[#666666] hover:bg-[#111111] transition-all uppercase rounded-xs"
            >
              THE STORY
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-[#1C1C1C] font-mono text-xs text-[#888888]">
          <div>
            <p className="text-[10px] text-[#555555] uppercase tracking-widest">ARCHIVE</p>
            <p className="text-[#F5F5F5] font-semibold mt-0.5">CHNB-001 — CHNB-006</p>
          </div>
          <div>
            <p className="text-[10px] text-[#555555] uppercase tracking-widest">GENRES</p>
            <p className="text-[#F5F5F5] font-semibold mt-0.5">Drone / Ambient / Folk Fusion</p>
          </div>
          <div>
            <p className="text-[10px] text-[#555555] uppercase tracking-widest">FORMATS</p>
            <p className="text-[#F5F5F5] font-semibold mt-0.5">180g Vinyl &bull; Cassette &bull; 24-Bit</p>
          </div>
          <div>
            <p className="text-[10px] text-[#555555] uppercase tracking-widest">LOCATION</p>
            <p className="text-[#F5F5F5] font-semibold mt-0.5">Srinagar &bull; Jammu &bull; Global</p>
          </div>
        </div>
      </section>

      {/* Featured Releases Section */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#1C1C1C] pb-6">
          <div>
            <span className="font-mono text-xs text-[#888888] tracking-widest uppercase">
              // RECENT PRESSINGS
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-wide mt-2">
              LATEST RELEASES
            </h2>
          </div>
          <Link
            href="/releases"
            className="font-mono text-xs text-[#999999] hover:text-[#F5F5F5] transition-colors flex items-center gap-2"
          >
            <span>VIEW FULL CATALOGUE &rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredReleases.map((release) => (
            <div
              key={release.id}
              className="group flex flex-col justify-between border border-[#1A1A1A] bg-[#0C0C0C] p-4 hover:border-[#333333] transition-all duration-300"
            >
              <div>
                <div className="relative aspect-square overflow-hidden bg-[#151515] mb-4">
                  <img
                    src={release.cover}
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
                      className="absolute bottom-3 right-3 p-3 bg-[#F5F5F5] text-[#080808] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-xl hover:scale-110"
                      title="Play Preview"
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
                    <Link href={`/release/${release.slug}`}>{release.title}</Link>
                  </h3>
                  <p className="font-sans text-xs text-[#999999] line-clamp-1">
                    {release.artistName}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#181818] flex items-center justify-between font-mono text-[11px] text-[#666666]">
                <span>{release.releaseDate}</span>
                <Link
                  href={`/release/${release.slug}`}
                  className="text-[#888888] hover:text-[#F5F5F5] transition-colors"
                >
                  LISTEN / ORDER &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Roster Showcase Section */}
      <section className="bg-[#0C0C0C] border-y border-[#1C1C1C] py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#1C1C1C] pb-6">
            <div>
              <span className="font-mono text-xs text-[#888888] tracking-widest uppercase">
                // ARTIST ROSTER
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-wide mt-2">
                CURRENT ARTIST ROSTER
              </h2>
            </div>
            <Link
              href="/artists"
              className="font-mono text-xs text-[#999999] hover:text-[#F5F5F5] transition-colors flex items-center gap-2"
            >
              <span>VIEW ALL ARTISTS &rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredArtists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artist/${artist.slug}`}
                className="group border border-[#1A1A1A] bg-[#080808] p-6 hover:border-[#333333] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-square overflow-hidden bg-[#151515] mb-6 grayscale group-hover:grayscale-0 transition-all duration-500">
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <span className="font-mono text-[10px] text-[#666666] tracking-widest uppercase block">
                    {artist.location}
                  </span>
                  <h3 className="font-display font-bold text-xl text-[#F5F5F5] group-hover:text-white transition-colors mt-1">
                    {artist.name}
                  </h3>
                  <p className="font-sans text-xs text-[#888888] line-clamp-2 mt-2 leading-relaxed">
                    {artist.bio}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-[#181818] flex items-center justify-between font-mono text-[11px] text-[#666666]">
                  <span>STATUS: {artist.status}</span>
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
      <section className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="border border-[#222222] bg-gradient-to-b from-[#111111] to-[#080808] p-8 sm:p-16 space-y-8 relative overflow-hidden">
          <div className="font-mono text-xs text-[#888888] tracking-widest uppercase">
            // LABEL MANIFESTO
          </div>

          <h2 className="font-serif italic text-3xl sm:text-5xl text-[#F5F5F5] leading-snug font-normal max-w-4xl">
            “Music is not ephemeral digital noise to be discarded. It is physical resonance, memory, and geographic identity.”
          </h2>

          <p className="font-sans text-sm sm:text-base text-[#999999] max-w-2xl leading-relaxed">
            CHENAB MEDIA operates out of Jammu & Kashmir as an artist-first ecosystem. Every record in our catalogue is produced with total artistic autonomy, transparent distribution, and archival physical releases.
          </p>

          <div className="pt-4 font-mono text-xs">
            <Link
              href="/story"
              className="inline-flex items-center gap-3 text-[#F5F5F5] hover:text-white border-b border-[#F5F5F5] pb-1 uppercase tracking-widest transition-colors"
            >
              <span>READ OUR FULL STORY & ETHOS</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Journal Highlight Section */}
      {featuredArticle && (
        <section className="max-w-7xl mx-auto px-6 sm:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#1C1C1C] pb-6">
            <div>
              <span className="font-mono text-xs text-[#888888] tracking-widest uppercase">
                // FROM THE JOURNAL
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-wide mt-2">
                EDITORIAL & FIELD NOTES
              </h2>
            </div>
            <Link
              href="/journal"
              className="font-mono text-xs text-[#999999] hover:text-[#F5F5F5] transition-colors flex items-center gap-2"
            >
              <span>EXPLORE ALL JOURNAL ENTRIES</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border border-[#1A1A1A] bg-[#0C0C0C] p-6 sm:p-8">
            <div className="lg:col-span-7 aspect-[16/9] overflow-hidden bg-[#151515]">
              <img
                src={featuredArticle.coverUrl}
                alt={featuredArticle.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="px-2 py-0.5 border border-[#333333] text-[#F5F5F5] bg-[#111111]">
                  {featuredArticle.category}
                </span>
                <span className="text-[#666666]">{featuredArticle.date}</span>
                <span className="text-[#666666]">&bull; {featuredArticle.readTime}</span>
              </div>

              <h3 className="font-display font-bold text-2xl sm:text-3xl text-[#F5F5F5] leading-tight">
                <Link href={`/journal/${featuredArticle.slug}`} className="hover:text-white transition-colors">
                  {featuredArticle.title}
                </Link>
              </h3>

              <p className="font-sans text-sm text-[#888888] leading-relaxed">
                {featuredArticle.shortExcerpt}
              </p>

              <div className="pt-2 font-mono text-xs">
                <Link
                  href={`/journal/${featuredArticle.slug}`}
                  className="text-[#F5F5F5] hover:underline flex items-center gap-2 uppercase tracking-widest"
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
