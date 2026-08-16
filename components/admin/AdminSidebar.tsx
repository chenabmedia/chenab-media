'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { canAccess } from '@/lib/auth/permissions';
import {
  LayoutDashboard,
  Users,
  Disc,
  FileMusic,
  FileText,
  DollarSign,
  ArrowUpRight,
  MessageSquare,
  ShieldCheck,
  UserCog,
  Bell,
  Mail,
  FolderArchive,
  History,
  Settings,
  User,
  LogOut,
  X,
  Menu,
  Lock,
  ChevronRight,
  Shield,
  Globe,
  Send,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
  badge?: string;
  permission?: string;
}

interface SidebarGroup {
  category: string;
  items: SidebarItem[];
}

export function AdminSidebar({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const { userProfile, signOut } = useAuth();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, setMobileOpen]);

  React.useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const navigationGroups: SidebarGroup[] = [
    {
      category: 'OVERVIEW',
      items: [
        { label: 'Overview', href: '/admin', icon: LayoutDashboard, permission: 'dashboard.view' },
        { label: 'Artists', href: '/admin/artists', icon: Users, permission: 'artists.view' },
        { label: 'Releases', href: '/admin/releases', icon: Disc, permission: 'releases.view' },
        { label: 'Demos', href: '/admin/demos', icon: FileMusic, permission: 'demos.view' },
        { label: 'Agreements', href: '#', icon: FileText, disabled: true, badge: 'SOON' },
        { label: 'Royalties', href: '#', icon: DollarSign, disabled: true, badge: 'SOON' },
        { label: 'Withdrawals', href: '#', icon: ArrowUpRight, disabled: true, badge: 'SOON' },
        { label: 'Messages', href: '/admin/messages', icon: MessageSquare, permission: 'messages.view' },
      ],
    },
    {
      category: 'MANAGEMENT',
      items: [
        { label: 'Site CMS', href: '/admin/site', icon: Globe, permission: 'site.manage' },
        { label: 'Admins', href: '/admin/admins', icon: ShieldCheck, permission: 'admins.view' },
        { label: 'Executives', href: '/admin/executives', icon: UserCog, permission: 'admins.view' },
        { label: 'Email Identities', href: '/admin/email-identities', icon: Mail, permission: 'email.identities.manage' },
        { label: 'Compose Email', href: '/admin/email/compose', icon: Send, permission: 'email.send' },
        { label: 'Email Logs', href: '/admin/email/logs', icon: History, permission: 'email.logs.view' },
        { label: 'Media Vault', href: '#', icon: FolderArchive, disabled: true, badge: 'SOON' },
      ],
    },
    {
      category: 'SYSTEM',
      items: [
        { label: 'Audit Logs', href: '/admin/audit-logs', icon: History, permission: 'audit.view' },
        { label: 'Profile', href: '/admin/profile', icon: User },
        { label: 'Settings', href: '/admin/settings', icon: Settings, permission: 'settings.view' },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0A0A0A] border-r border-[#1C1C1C] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Branding */}
        <div className="p-6 border-b border-[#1A1A1A] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-emerald-400 tracking-widest uppercase">
              <Shield size={12} />
              <span>CHENAB SYSTEM</span>
            </div>
            <h2 className="font-display font-black text-xl text-[#F5F5F5] tracking-wider uppercase mt-1">
              COMMAND
            </h2>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-[#888888] hover:text-[#F5F5F5] border border-[#222222] bg-[#111111]"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Nav Items */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-thin scrollbar-thumb-[#222222]">
          {navigationGroups.map((group) => (
            <div key={group.category} className="space-y-2">
              <h3 className="px-3 font-mono text-[10px] uppercase tracking-widest text-[#666666]">
                {group.category}
              </h3>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;

                  if (item.disabled) {
                    return (
                      <div
                        key={item.label}
                        className="flex items-center justify-between px-3 py-2 text-[#444444] cursor-not-allowed font-mono text-xs select-none rounded-none"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={15} className="text-[#333333]" />
                          <span>{item.label}</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 border border-[#222222] bg-[#111111] text-[#555555]">
                          {item.badge || 'SOON'}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 font-mono text-xs transition-all ${
                        active
                          ? 'bg-[#181818] text-[#F5F5F5] border-l-2 border-emerald-400 font-bold'
                          : 'text-[#999999] hover:text-[#F5F5F5] hover:bg-[#111111]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          size={15}
                          className={active ? 'text-emerald-400' : 'text-[#777777]'}
                        />
                        <span>{item.label}</span>
                      </div>
                      {active && <ChevronRight size={14} className="text-emerald-400" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer User Profile Summary */}
        <div className="p-4 border-t border-[#1C1C1C] bg-[#080808] space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#181818] border border-[#282828] flex items-center justify-center font-mono text-xs text-[#F5F5F5] font-bold">
              {userProfile?.displayName?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs font-bold text-[#F5F5F5] truncate">
                {userProfile?.displayName || userProfile?.email?.split('@')[0]}
              </p>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>[{userProfile?.role || 'ADMIN'}]</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="w-full py-2 px-3 bg-red-950/20 hover:bg-red-900/40 border border-red-900/30 text-red-300 font-mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut size={13} />
            <span>EXIT SESSION</span>
          </button>
        </div>
      </aside>
    </>
  );
}
