'use client';

import React from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ArtistSidebar } from '@/components/artist/ArtistSidebar';
import { useAuth } from '@/context/AuthContext';
import { LogOut, ArrowLeft } from 'lucide-react';

export function ArtistPortalLayout({ children }: { children: React.ReactNode }) {
  const { userProfile, signOut } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['artist', 'executive', 'admin']}>
      <div className="min-h-screen bg-[#080808] text-[#F5F5F5] flex flex-col font-sans">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-[#1C1C1C] bg-[#0A0A0A] px-4 sm:px-6 flex items-center justify-between font-mono text-xs z-20 pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-[#F5F5F5] uppercase tracking-wider">
              CHENAB ARTIST PORTAL
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 bg-[#151515] border border-[#222222] text-[10px] text-sky-400 uppercase">
              {userProfile?.displayName || userProfile?.email}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3 py-1.5 min-h-[36px] border border-[#222222] bg-[#111111] hover:border-[#444444] text-[#CCCCCC] hover:text-white transition-colors uppercase flex items-center gap-2 text-[11px]"
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">MAIN WEBSITE</span>
            </Link>
            <button
              onClick={() => signOut()}
              className="px-3 py-1.5 min-h-[36px] border border-red-900/40 bg-red-950/30 text-red-300 hover:bg-red-900/40 transition-colors uppercase font-bold flex items-center gap-1.5 text-[11px]"
            >
              <LogOut size={13} />
              <span>SIGN OUT</span>
            </button>
          </div>
        </header>

        {/* Content Area with Sidebar */}
        <div className="flex-1 flex flex-col lg:flex-row">
          <ArtistSidebar />
          <main className="flex-1 p-6 sm:p-8 md:p-10 max-w-7xl w-full mx-auto overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
