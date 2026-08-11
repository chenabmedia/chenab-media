'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Search, ArrowRight } from 'lucide-react';
import { getAllJournalPosts } from '@/data/journal';

export default function JournalPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['ALL', 'EDITORIAL', 'INTERVIEW', 'FIELD NOTES', 'ANNOUNCEMENT'];

  const allPosts = getAllJournalPosts();

  const filteredPosts = allPosts.filter((post) => {
    const matchesCategory = selectedCategory === 'ALL' || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.shortExcerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12 space-y-12">
      <div className="border-b border-[#1C1C1C] pb-8 space-y-4">
        <div className="flex items-center gap-2 font-mono text-xs text-[#888888] tracking-widest uppercase">
          <BookOpen size={14} className="text-[#F5F5F5]" />
          <span>CHENAB MEDIA PUBLICATION</span>
        </div>
        <h1 className="font-display font-black text-4xl sm:text-6xl text-[#F5F5F5] tracking-tight uppercase">
          LABEL JOURNAL
        </h1>
        <p className="font-sans text-sm text-[#888888] max-w-2xl leading-relaxed">
          Essays, acoustic field studies, artist interviews, and archival studio logs documenting the creative process behind CHENAB MEDIA.
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 bg-[#0C0C0C] border border-[#1C1C1C] p-4">
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 border transition-colors uppercase ${
                selectedCategory === cat
                  ? 'bg-[#F5F5F5] text-[#080808] border-[#F5F5F5] font-bold'
                  : 'bg-[#111111] text-[#888888] border-[#222222] hover:text-[#F5F5F5]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative md:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
          <input
            type="text"
            placeholder="Search journal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-[#222222] pl-9 pr-4 py-1.5 font-mono text-xs text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#555555]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredPosts.map((post) => (
          <article
            key={post.id}
            className="group border border-[#1A1A1A] bg-[#0C0C0C] hover:border-[#333333] transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="aspect-[16/9] overflow-hidden bg-[#151515] relative">
                <img
                  src={post.coverUrl}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#080808]/90 backdrop-blur-md px-2.5 py-1 font-mono text-[10px] text-[#F5F5F5] border border-[#222222] uppercase">
                  {post.category}
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between font-mono text-xs text-[#666666]">
                  <span>BY {post.author}</span>
                  <span>{post.date} &bull; {post.readTime}</span>
                </div>

                <h2 className="font-display font-bold text-2xl text-[#F5F5F5] group-hover:text-white transition-colors leading-snug">
                  <Link href={`/journal/${post.slug}`}>{post.title}</Link>
                </h2>

                <p className="font-sans text-xs text-[#888888] line-clamp-3 leading-relaxed">
                  {post.shortExcerpt}
                </p>
              </div>
            </div>

            <div className="p-6 pt-0 font-mono text-xs">
              <Link
                href={`/journal/${post.slug}`}
                className="text-[#F5F5F5] hover:underline inline-flex items-center gap-2 uppercase"
              >
                <span>READ ARTICLE</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
