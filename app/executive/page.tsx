'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Briefcase, ArrowLeft } from 'lucide-react';

function ExecutiveContent() {
  const { userProfile, signOut } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-10 font-mono">
      <div className="border-b border-[#1A1A1A] pb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 mb-2">
            <Briefcase size={14} />
            <span>A&R EXECUTIVE PORTAL</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#F5F5F5] uppercase tracking-wider">
            LABEL EXECUTIVE DASHBOARD
          </h1>
          <p className="text-xs text-[#888888] mt-1">
            AUTHENTICATED AS: {userProfile?.email} &bull; ROLE: [{userProfile?.role.toUpperCase()}]
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <Link
            href="/"
            className="px-4 py-2 border border-[#222222] bg-[#111111] text-[#CCCCCC] hover:text-white transition-colors uppercase flex items-center gap-2"
          >
            <ArrowLeft size={14} />
            <span>MAIN SITE</span>
          </Link>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-950/40 border border-red-900/50 text-red-300 hover:bg-red-900/50 transition-colors uppercase font-bold"
          >
            SIGN OUT
          </button>
        </div>
      </div>

      <div className="border border-[#1C1C1C] bg-[#0C0C0C] p-8 text-xs text-[#A0A0A0] space-y-4">
        <h3 className="text-sm font-bold text-[#F5F5F5] uppercase">EXECUTIVE MODULE FOUNDATION READY</h3>
        <p>
          This section is secured for A&R Executives and Label Management. Future analytics, master agreements, and contract pipelines will integrate into this view.
        </p>
      </div>
    </div>
  );
}

export default function ExecutivePage() {
  return (
    <ProtectedRoute allowedRoles={['executive', 'admin']}>
      <ExecutiveContent />
    </ProtectedRoute>
  );
}
