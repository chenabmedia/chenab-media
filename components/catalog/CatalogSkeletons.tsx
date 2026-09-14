import React from 'react';

export const ReleaseCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col justify-between border border-[#1A1A1A] bg-[#0C0C0C] p-4 animate-pulse">
      <div>
        <div className="relative aspect-square bg-[#151515] mb-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#222222]/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          <div className="absolute top-3 left-3 w-16 h-4 bg-[#1F1F1F] border border-[#2A2A2A]" />
        </div>

        <div className="space-y-2">
          <div className="w-24 h-3 bg-[#1A1A1A]" />
          <div className="w-3/4 h-5 bg-[#1F1F1F]" />
          <div className="w-1/2 h-3 bg-[#1A1A1A]" />
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-[#181818] flex items-center justify-between">
        <div className="w-16 h-3 bg-[#1A1A1A]" />
        <div className="w-20 h-3 bg-[#1A1A1A]" />
      </div>
    </div>
  );
};

export const ArtistCardSkeleton: React.FC = () => {
  return (
    <div className="border border-[#1A1A1A] bg-[#080808] p-5 sm:p-6 flex flex-col justify-between animate-pulse">
      <div>
        <div className="aspect-square bg-[#151515] mb-5 sm:mb-6 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#222222]/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
        <div className="w-20 h-2.5 bg-[#1A1A1A] mb-2" />
        <div className="w-3/4 h-6 bg-[#1F1F1F] mb-3" />
        <div className="space-y-1.5">
          <div className="w-full h-3 bg-[#161616]" />
          <div className="w-4/5 h-3 bg-[#161616]" />
        </div>
      </div>

      <div className="pt-5 mt-5 border-t border-[#181818] flex items-center justify-between">
        <div className="w-20 h-3 bg-[#1A1A1A]" />
        <div className="w-16 h-3 bg-[#1A1A1A]" />
      </div>
    </div>
  );
};

export const ReleaseRowSkeleton: React.FC = () => {
  return (
    <div className="p-4 border border-[#1A1A1A] bg-[#0C0C0C] flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-[#161616] shrink-0" />
        <div className="space-y-2">
          <div className="w-40 h-4 bg-[#1F1F1F]" />
          <div className="w-28 h-3 bg-[#161616]" />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="w-20 h-3 bg-[#161616] hidden md:block" />
        <div className="w-16 h-3 bg-[#161616]" />
        <div className="w-24 h-8 bg-[#1A1A1A] border border-[#262626]" />
      </div>
    </div>
  );
};
