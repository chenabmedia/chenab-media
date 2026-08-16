'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Disc } from 'lucide-react';
import { ReleaseEditor } from '@/components/admin/ReleaseEditor';

export default function CreateReleasePage() {
  return (
    <div className="space-y-8 font-mono text-xs">
      <div className="border-b border-[#1A1A1A] pb-6 flex items-center justify-between">
        <div>
          <Link
            href="/admin/releases"
            className="inline-flex items-center gap-2 text-[#888888] hover:text-[#F5F5F5] uppercase tracking-widest mb-2 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>BACK TO RELEASES DIRECTORY</span>
          </Link>
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Disc size={14} />
            <span>NEW CATALOGUE ITEM</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#F5F5F5] uppercase tracking-wider">
            CREATE MUSIC RELEASE
          </h1>
        </div>
      </div>

      <ReleaseEditor isEditMode={false} />
    </div>
  );
}
