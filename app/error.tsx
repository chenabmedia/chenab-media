'use client';

import React from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 sm:px-6 py-12 text-center space-y-6 font-mono">
      <div className="text-xs text-red-400 tracking-widest uppercase">
        [SYSTEM EXCEPTION &bull; TRANSMISSION ERROR]
      </div>
      <h1 className="font-display font-extrabold text-[clamp(1.75rem,5vw,3rem)] text-[#F5F5F5] uppercase tracking-wider leading-none">
        SYSTEM ANOMALY
      </h1>
      <p className="text-xs text-[#888888] max-w-md leading-relaxed">
        {error.message || 'An unexpected error occurred in the media pipeline.'}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-3.5 min-h-[44px] border border-[#333333] bg-[#1A1A1A] text-[#F5F5F5] hover:border-[#555555] transition-colors text-xs uppercase font-bold inline-flex items-center justify-center"
        >
          RETRY SIGNAL
        </button>
        <Link
          href="/"
          className="px-6 py-3.5 min-h-[44px] border border-[#222222] bg-[#111111] text-[#CCCCCC] hover:text-white transition-colors text-xs uppercase font-bold inline-flex items-center justify-center"
        >
          RETURN HOME
        </Link>
      </div>
    </div>
  );
}
