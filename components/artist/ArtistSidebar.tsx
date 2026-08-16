'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  Disc,
  Bell,
  Receipt,
  Wallet,
  FileText,
  Lock,
} from 'lucide-react';

export function ArtistSidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'OVERVIEW',
      href: '/artist',
      icon: LayoutDashboard,
      active: pathname === '/artist',
    },
    {
      label: 'MY PROFILE',
      href: '/artist/profile',
      icon: User,
      active: pathname === '/artist/profile',
    },
    {
      label: 'MY RELEASES',
      href: '/artist/releases',
      icon: Disc,
      active: pathname.startsWith('/artist/releases'),
    },
    {
      label: 'NOTIFICATIONS',
      href: '/artist/notifications',
      icon: Bell,
      active: pathname === '/artist/notifications',
    },
  ];

  const comingSoonItems = [
    {
      label: 'ROYALTY STATEMENTS',
      icon: Receipt,
    },
    {
      label: 'EARNINGS WITHDRAWALS',
      icon: Wallet,
    },
    {
      label: 'CONTRACTS & AGREEMENTS',
      icon: FileText,
    },
  ];

  return (
    <aside className="w-full lg:w-64 bg-[#0A0A0A] border-r border-[#1C1C1C] flex flex-col justify-between shrink-0 font-mono text-xs">
      <div className="p-5 space-y-8">
        <div className="border-b border-[#1A1A1A] pb-4">
          <div className="text-[10px] text-[#666666] tracking-widest uppercase mb-1">
            CHENAB PORTAL
          </div>
          <div className="font-display font-black text-lg text-[#F5F5F5] uppercase tracking-wider">
            ROSTER HUB
          </div>
        </div>

        <nav className="space-y-1">
          <div className="text-[10px] text-[#555555] tracking-widest uppercase mb-2 px-3">
            NAVIGATION
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-none border text-xs font-bold transition-all uppercase ${
                  item.active
                    ? 'bg-[#151515] border-[#333333] text-[#F5F5F5] shadow-inner'
                    : 'border-transparent text-[#888888] hover:text-[#CCCCCC] hover:bg-[#111111]'
                }`}
              >
                <Icon size={16} className={item.active ? 'text-sky-400' : 'text-[#666666]'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-[#1C1C1C] space-y-2">
          <div className="text-[10px] text-[#555555] tracking-widest uppercase mb-2 px-3 flex items-center justify-between">
            <span>FINANCIALS & DEALS</span>
            <Lock size={10} className="text-[#444444]" />
          </div>
          {comingSoonItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 border border-[#141414] bg-[#070707] text-[#555555] cursor-not-allowed select-none"
              >
                <div className="flex items-center gap-3">
                  <Icon size={15} className="text-[#444444]" />
                  <span className="text-[11px] uppercase font-medium">{item.label}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 bg-[#141414] text-[#777777] border border-[#222222] uppercase tracking-tighter">
                  SOON
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-5 border-t border-[#1C1C1C] bg-[#080808] text-[10px] text-[#555555] space-y-1">
        <p className="font-bold text-[#888888] uppercase">CHENAB MEDIA ROSTER</p>
        <p>ENCRYPTED PORTAL SESSION</p>
      </div>
    </aside>
  );
}
