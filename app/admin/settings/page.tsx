'use client';

import React from 'react';
import { Settings, Shield, Globe, Lock } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 font-mono text-xs">
      <div className="border-b border-[#1A1A1A] pb-6">
        <div className="flex items-center gap-2 text-emerald-400 mb-1">
          <Settings size={14} />
          <span>SYSTEM CONFIGURATION</span>
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-[#F5F5F5] uppercase tracking-wider">
          LABEL & SYSTEM SETTINGS
        </h1>
      </div>

      <div className="p-6 bg-[#0C0C0C] border border-[#1C1C1C] space-y-4">
        <h3 className="font-display font-bold text-sm text-[#F5F5F5] uppercase border-b border-[#181818] pb-3 flex items-center gap-2">
          <Shield size={15} className="text-emerald-400" />
          <span>FIREBASE AUTHENTICATION ENVIRONMENT</span>
        </h3>

        <div className="space-y-3 text-[#888888]">
          <div className="flex justify-between border-b border-[#141414] pb-2">
            <span>PROJECT ID:</span>
            <code className="text-[#F5F5F5]">chenabmedia-in</code>
          </div>
          <div className="flex justify-between border-b border-[#141414] pb-2">
            <span>FIREBASE ADMIN SDK:</span>
            <span className="text-emerald-400 font-bold">INITIALIZED SERVER-SIDE</span>
          </div>
          <div className="flex justify-between border-b border-[#141414] pb-2">
            <span>FIRESTORE SECURITY RULES:</span>
            <span className="text-emerald-400 font-bold">ENFORCED (ROLE & STATUS)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
