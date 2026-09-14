'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Shield, Flame, Mountain } from 'lucide-react';

export default function StoryPage() {
  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-6 md:px-8 py-10 sm:py-16 space-y-12 sm:space-y-20">
      <div className="space-y-4 sm:space-y-6 border-b border-[#1C1C1C] pb-8 sm:pb-12">
        <div className="font-mono text-xs text-[#888888] tracking-widest uppercase flex items-center gap-2">
          <Compass size={14} className="text-[#F5F5F5]" />
          <span>ABOUT & ETHOS</span>
        </div>
        <h1 className="font-display font-black text-[clamp(2.5rem,8vw,5.5rem)] text-[#F5F5F5] tracking-tight uppercase leading-none">
          THE CHENAB MANIFESTO
        </h1>
        <p className="font-serif italic text-[clamp(1.25rem,3.5vw,2rem)] text-[#D0D0D0] leading-snug">
          An independent record label, creative sanctuary, and publishing platform born from the high altitudes of Jammu & Kashmir.
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-8 items-start">
        <div className="md:col-span-4 font-mono text-xs text-[#888888] uppercase tracking-widest">
          01 // IDENTITY & ORIGINS
        </div>
        <div className="md:col-span-8 space-y-4 sm:space-y-6 font-sans text-sm sm:text-base text-[#CCCCCC] leading-relaxed">
          <p>
            Named after the ancient river that flows through the rugged gorges of the Western Himalayas, <strong className="text-[#F5F5F5]">CHENAB MEDIA</strong> was established to give voice to uncompromising sonic exploration.
          </p>
          <p>
            We operate at the intersection of traditional acoustic heritage and cutting-edge electronic experimentation. From century-old Santoor string vibrations to modular synthesizer feedback loops and sub-zero field recordings, our catalogue reflects the physical weight of our surroundings.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-8 items-start border-t border-[#1A1A1A] pt-10 sm:pt-16">
        <div className="md:col-span-4 font-mono text-xs text-[#888888] uppercase tracking-widest">
          02 // GEOGRAPHIC RESONANCE
        </div>
        <div className="md:col-span-8 space-y-4 sm:space-y-6 font-sans text-sm sm:text-base text-[#CCCCCC] leading-relaxed">
          <p>
            Jammu & Kashmir is not merely a geographic backdrop for us; it is a living sonic landscape. The high mountain passes, glacier-fed streams, pine forests, and historic architectural courtyards provide a distinct acoustic identity that cannot be synthesized in standard city studios.
          </p>
          <p>
            By establishing an independent recording and publishing hub directly within the region, CHENAB provides local artists with world-class mastering, physical vinyl production, and global distribution without requiring them to abandon their native roots.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-8 items-start border-t border-[#1A1A1A] pt-10 sm:pt-16">
        <div className="md:col-span-4 font-mono text-xs text-[#888888] uppercase tracking-widest">
          03 // ARTISTIC AUTONOMY
        </div>
        <div className="md:col-span-8 space-y-4 sm:space-y-6 font-sans text-sm sm:text-base text-[#CCCCCC] leading-relaxed">
          <p>
            The mainstream music industry is driven by rapid turnover, algorithmic formulas, and metric vanity. CHENAB stands in direct opposition to this model.
          </p>
          <p>
            We guarantee complete creative freedom to every artist in our collective. No A&R team demands commercial concessions. Every master recording, lyric line, and cover art design is approved entirely by the creator.
          </p>
          <ul className="space-y-3 font-mono text-xs text-[#999999] pt-2">
            <li className="flex items-center gap-3">
              <Shield size={14} className="text-[#F5F5F5] shrink-0" />
              <span>100% Artist Ownership of Primary Intellectual Property</span>
            </li>
            <li className="flex items-center gap-3">
              <Flame size={14} className="text-[#F5F5F5] shrink-0" />
              <span>Transparent 50/50 Revenue Partitioning Across All Platforms</span>
            </li>
            <li className="flex items-center gap-3">
              <Mountain size={14} className="text-[#F5F5F5] shrink-0" />
              <span>Permanent Archival Physical Pressings & Lossless Master Storage</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-8 items-start border-t border-[#1A1A1A] pt-10 sm:pt-16">
        <div className="md:col-span-4 font-mono text-xs text-[#888888] uppercase tracking-widest">
          04 // THE FUTURE VISION
        </div>
        <div className="md:col-span-8 space-y-4 sm:space-y-6 font-sans text-sm sm:text-base text-[#CCCCCC] leading-relaxed">
          <p>
            As CHENAB expands, our objective remains steadfast: build a globally recognized independent record label and media house that bridge the Himalayan underground with avant-garde listener communities worldwide.
          </p>
          <p>
            Through physical vinyl pressings, journal essays, film scoring, site-specific sound installations, and international artist residencies, CHENAB MEDIA is crafting an enduring cultural archive for generations to come.
          </p>

          <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 font-mono text-xs">
            <Link
              href="/releases"
              className="px-6 py-3.5 bg-[#F5F5F5] text-[#080808] font-bold uppercase hover:bg-white transition-colors text-center min-h-[48px] flex items-center justify-center"
            >
              EXPLORE CATALOGUE
            </Link>
            <Link
              href="/demo"
              className="px-6 py-3.5 border border-[#333333] text-[#F5F5F5] uppercase hover:border-[#666666] transition-colors text-center min-h-[48px] flex items-center justify-center"
            >
              SUBMIT DEMO
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
