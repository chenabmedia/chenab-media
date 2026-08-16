import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 sm:px-6 py-12 text-center space-y-6 font-mono">
      <div className="text-xs text-red-400 tracking-widest uppercase">
        [ERROR 404 &bull; SIGNAL LOST]
      </div>
      <h1 className="font-display font-extrabold text-[clamp(2rem,6vw,3.75rem)] text-[#F5F5F5] uppercase tracking-wider leading-none">
        PAGE NOT FOUND
      </h1>
      <p className="text-xs text-[#888888] max-w-md leading-relaxed">
        The requested record or portal location does not exist in the CHENAB MEDIA catalogue system.
      </p>
      <Link
        href="/"
        className="px-6 py-3.5 min-h-[44px] border border-[#222222] bg-[#111111] text-[#CCCCCC] hover:text-white transition-colors text-xs uppercase font-bold inline-flex items-center justify-center"
      >
        RETURN TO MAIN TRANSMISSION
      </Link>
    </div>
  );
}
