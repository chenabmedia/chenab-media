'use client';

import React, { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Calendar, Clock, User } from 'lucide-react';
import { getJournalPostBySlug } from '@/data/journal';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function JournalDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();

  const post = slug ? getJournalPostBySlug(slug) : undefined;

  useEffect(() => {
    if (post) {
      document.title = `${post.title} | CHENAB MEDIA Journal`;
    } else {
      document.title = 'Article Not Found | CHENAB MEDIA';
    }
  }, [post]);

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center space-y-6">
        <h2 className="font-display font-bold text-3xl text-[#F5F5F5]">ARTICLE NOT FOUND</h2>
        <p className="font-mono text-xs text-[#888888]">The requested journal entry does not exist.</p>
        <button
          onClick={() => router.push('/journal')}
          className="px-6 py-3 bg-[#F5F5F5] text-[#080808] font-mono text-xs font-bold uppercase hover:bg-white"
        >
          RETURN TO JOURNAL
        </button>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-6 sm:px-8 py-12 space-y-12">
      <button
        onClick={() => router.push('/journal')}
        className="inline-flex items-center gap-2 font-mono text-xs text-[#888888] hover:text-[#F5F5F5] transition-colors uppercase tracking-widest"
      >
        <ArrowLeft size={14} />
        <span>JOURNAL INDEX</span>
      </button>

      <div className="space-y-6 border-b border-[#1C1C1C] pb-8">
        <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-[#888888]">
          <span className="px-2.5 py-0.5 border border-[#333333] text-[#F5F5F5] bg-[#111111] uppercase font-semibold">
            {post.category}
          </span>
          <div className="flex items-center gap-1.5">
            <Calendar size={12} />
            <span>{post.date}</span>
          </div>
          <span>&bull;</span>
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span>{post.readTime}</span>
          </div>
          <span>&bull;</span>
          <div className="flex items-center gap-1.5">
            <User size={12} />
            <span>BY {post.author}</span>
          </div>
        </div>

        <h1 className="font-display font-black text-3xl sm:text-5xl text-[#F5F5F5] leading-tight">
          {post.title}
        </h1>

        <p className="font-serif italic text-xl text-[#CCCCCC] leading-snug">
          {post.shortExcerpt}
        </p>
      </div>

      <div className="aspect-[16/9] overflow-hidden bg-[#151515] border border-[#222222]">
        <img
          src={post.coverUrl}
          alt={post.title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="space-y-6 font-sans text-base sm:text-lg text-[#CCCCCC] leading-relaxed max-w-3xl">
        {post.content.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <div className="pt-8 border-t border-[#1C1C1C] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[#666666]">TAGS:</span>
          {post.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 border border-[#222222] bg-[#111111] text-[#888888]"
            >
              #{tag}
            </span>
          ))}
        </div>

        <button
          onClick={() => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(window.location.href);
              alert('Article link copied to clipboard!');
            }
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#333333] hover:border-[#666666] text-[#F5F5F5] transition-colors"
        >
          <Share2 size={12} />
          <span>SHARE LINK</span>
        </button>
      </div>
    </article>
  );
}
