'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useAuth } from '@/context/AuthContext';
import { Menu, ArrowLeft, Shield, Globe } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const { userProfile } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['admin', 'executive']}>
      <div className="min-h-screen bg-[#080808] text-[#E5E5E5] flex font-sans antialiased selection:bg-emerald-950 selection:text-emerald-200">
        {/* Sidebar */}
        <AdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
          {/* Top Bar Navigation Header */}
          <header className="h-16 border-b border-[#1A1A1A] bg-[#0A0A0A]/90 backdrop-blur sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between pt-[env(safe-area-inset-top,0px)]">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-[#999999] hover:text-[#F5F5F5] border border-[#222222] bg-[#111111]"
                aria-label="Open sidebar menu"
              >
                <Menu size={18} />
              </button>

              <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-[#888888]">
                <Shield size={14} className="text-emerald-400" />
                <span className="text-[#CCCCCC]">PORTAL:</span>
                <span className="text-emerald-400 uppercase font-bold">
                  /ADMIN
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <Link
                href="/"
                className="px-3.5 py-2 min-h-[40px] border border-[#222222] bg-[#111111] text-[#CCCCCC] hover:text-white hover:border-[#444444] transition-colors uppercase flex items-center gap-2 text-[11px]"
              >
                <Globe size={13} />
                <span className="hidden sm:inline">PUBLIC SITE</span>
              </Link>

              <div className="hidden sm:block px-3 py-1 bg-[#141414] border border-[#222222] text-[#888888] font-mono text-[11px] truncate max-w-[200px]">
                {userProfile?.email}
              </div>
            </div>
          </header>

          {/* Body Content */}
          <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
