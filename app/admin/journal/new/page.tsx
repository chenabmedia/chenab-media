'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { JournalEditor } from '@/components/admin/JournalEditor';

export default function NewJournalPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/journal"
          className="p-2 border border-[#222222] bg-[#121212] hover:bg-[#1C1C1C] text-[#888888] hover:text-[#F5F5F5] transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <BookOpen size={12} />
            <span>JOURNAL CMS / CREATION</span>
          </div>
          <h1 className="font-display font-black text-2xl text-[#F5F5F5] uppercase">
            CREATE NEW JOURNAL ENTRY
          </h1>
        </div>
      </div>

      <JournalEditor isEditMode={false} />
    </div>
  );
}
