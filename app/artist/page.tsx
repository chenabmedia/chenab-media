'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Music2,
  Disc,
  Bell,
  UserCheck,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Loader2,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import { Artist, Notification, Release } from '@/types';

export default function ArtistDashboardPage() {
  const { userProfile } = useAuth();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadArtistPortalData() {
      try {
        setLoading(true);
        setError(null);

        const [profRes, relRes, notifRes] = await Promise.all([
          fetch('/api/artist/profile'),
          fetch('/api/artist/releases'),
          fetch('/api/artist/notifications'),
        ]);

        if (profRes.ok) {
          const profData = await profRes.json();
          setArtist(profData.artist);
        }

        if (relRes.ok) {
          const relData = await relRes.json();
          setReleases(relData.releases || []);
        }

        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setNotifications(notifData.notifications || []);
        }
      } catch (err: any) {
        console.error('Error loading portal data:', err);
        setError('Failed to load portal data. Please refresh.');
      } finally {
        setLoading(false);
      }
    }

    loadArtistPortalData();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const latestRelease = releases.length > 0 ? releases[0] : null;

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4 font-mono text-xs">
        <Loader2 size={28} className="animate-spin text-[#F5F5F5]" />
        <p className="text-[#888888] tracking-widest uppercase">
          SYNCHRONIZING ARTIST ROSTER PROFILE...
        </p>
      </div>
    );
  }

  const stageName = artist?.stageName || artist?.name || userProfile?.displayName || 'ROSTER ARTIST';

  return (
    <div className="space-y-10 font-mono">
      {/* Header Banner */}
      <div className="border border-[#1C1C1C] bg-[#0A0A0A] p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-950/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-sky-400">
              <Music2 size={14} />
              <span className="tracking-widest uppercase">OFFICIAL ROSTER ARTIST</span>
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-[#F5F5F5] uppercase tracking-wider">
              {stageName}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#888888] pt-1">
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-[#666666]" />
                {artist?.location || 'Srinagar, J&K'}
              </span>
              <span>&bull;</span>
              <span>ACCOUNT ID: {artist?.id || 'ART-PENDING'}</span>
              <span>&bull;</span>
              <span className="px-2 py-0.5 bg-[#151515] border border-[#222222] text-emerald-400 font-bold uppercase text-[10px]">
                {artist?.status || 'ACTIVE'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/artist/profile"
              className="px-5 py-2.5 bg-[#F5F5F5] text-[#080808] font-bold text-xs uppercase hover:bg-white transition-all flex items-center gap-2"
            >
              <span>EDIT PROFILE</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {artist?.bio && (
          <p className="text-xs text-[#AAAAAA] max-w-3xl font-sans leading-relaxed pt-2 border-t border-[#181818]">
            {artist.bio}
          </p>
        )}
      </div>

      {error && (
        <div className="p-4 border border-red-900/40 bg-red-950/20 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-5 space-y-2">
          <div className="flex items-center justify-between text-[#888888] text-[11px] uppercase">
            <span>CATALOGUE RELEASES</span>
            <Disc size={16} className="text-sky-400" />
          </div>
          <div className="text-3xl font-bold font-display text-[#F5F5F5]">
            {releases.length}
          </div>
          <div className="text-[10px] text-[#666666]">PUBLISHED MUSIC ENTRIES</div>
        </div>

        <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-5 space-y-2">
          <div className="flex items-center justify-between text-[#888888] text-[11px] uppercase">
            <span>NOTIFICATIONS</span>
            <Bell size={16} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-bold font-display text-[#F5F5F5]">
            {unreadCount}
          </div>
          <div className="text-[10px] text-[#666666]">UNREAD LABEL MESSAGES</div>
        </div>

        <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-5 space-y-2">
          <div className="flex items-center justify-between text-[#888888] text-[11px] uppercase">
            <span>CATALOGUE PREFIX</span>
            <Sparkles size={16} className="text-amber-400" />
          </div>
          <div className="text-xl font-bold font-display text-[#F5F5F5] uppercase">
            {artist?.catalogueNumberPrefix || 'CHNB-ART-01'}
          </div>
          <div className="text-[10px] text-[#666666]">LABEL CODE ID</div>
        </div>

        <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-5 space-y-2">
          <div className="flex items-center justify-between text-[#888888] text-[11px] uppercase">
            <span>SECURITY STATUS</span>
            <ShieldCheck size={16} className="text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-emerald-400 uppercase pt-1">
            VERIFIED ROSTER
          </div>
          <div className="text-[10px] text-[#666666]">FIREBASE AUTH INTEGRATED</div>
        </div>
      </div>

      {/* Main Grid: Latest Release & Recent Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Latest Release Card */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1C1C1C] pb-3">
            <h2 className="font-display font-bold text-lg text-[#F5F5F5] uppercase flex items-center gap-2">
              <Disc size={18} className="text-sky-400" />
              <span>FEATURED CATALOGUE RELEASE</span>
            </h2>
            <Link
              href="/artist/releases"
              className="text-xs text-[#888888] hover:text-[#F5F5F5] underline uppercase"
            >
              ALL RELEASES ({releases.length}) &rarr;
            </Link>
          </div>

          {latestRelease ? (
            <div className="border border-[#1C1C1C] bg-[#0C0C0C] p-6 space-y-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="w-32 h-32 bg-[#151515] border border-[#222222] shrink-0 overflow-hidden relative">
                  <img
                    src={latestRelease.cover}
                    alt={latestRelease.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-[#080808]/90 text-[10px] text-[#F5F5F5] border border-[#222222]">
                    {latestRelease.catalogueNumber}
                  </span>
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between text-[11px] text-[#777777]">
                    <span>{latestRelease.type}</span>
                    <span>RELEASED {latestRelease.releaseDate}</span>
                  </div>
                  <h3 className="font-display font-bold text-2xl text-[#F5F5F5] uppercase">
                    {latestRelease.title}
                  </h3>
                  <p className="text-xs text-[#888888]">
                    ARTIST: <span className="text-[#CCCCCC]">{latestRelease.artistName}</span>
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {latestRelease.genres?.map((g, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 bg-[#141414] border border-[#222222] text-[#888888]"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#181818] flex items-center justify-between text-xs">
                <span className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 font-bold uppercase text-[10px]">
                  STATUS: {latestRelease.status}
                </span>
                <Link
                  href={`/artist/releases/${latestRelease.id}`}
                  className="px-4 py-2 border border-[#222222] bg-[#111111] hover:border-[#444444] text-[#F5F5F5] uppercase font-bold flex items-center gap-1.5"
                >
                  <span>VIEW DETAILS</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 border border-dashed border-[#222222] bg-[#0A0A0A] text-center text-xs text-[#666666] space-y-2">
              <p>NO CATALOGUE RELEASES CURRENTLY LINKED TO THIS ARTIST PROFILE.</p>
              <p className="text-[11px] text-[#555555]">
                Contact CHENAB Media A&R administration to register new release masters.
              </p>
            </div>
          )}
        </div>

        {/* Notifications & Announcements Box */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1C1C1C] pb-3">
            <h2 className="font-display font-bold text-lg text-[#F5F5F5] uppercase flex items-center gap-2">
              <Bell size={18} className="text-emerald-400" />
              <span>ROSTER NOTIFICATIONS</span>
            </h2>
            <Link
              href="/artist/notifications"
              className="text-xs text-[#888888] hover:text-[#F5F5F5] underline uppercase"
            >
              VIEW ALL ({notifications.length})
            </Link>
          </div>

          <div className="space-y-3">
            {notifications.slice(0, 3).map((notif) => (
              <div
                key={notif.id}
                className={`p-4 border text-xs space-y-2 transition-all ${
                  !notif.read
                    ? 'border-sky-900/50 bg-sky-950/10'
                    : 'border-[#1C1C1C] bg-[#0C0C0C]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-sky-400 uppercase">{notif.type}</span>
                  <span className="text-[#666666]">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-bold text-[#F5F5F5] uppercase">{notif.title}</h4>
                <p className="text-[#A0A0A0] text-[11px] leading-relaxed">{notif.message}</p>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="p-6 border border-[#1A1A1A] bg-[#0A0A0A] text-center text-xs text-[#666666]">
                NO NOTIFICATIONS FOUND.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
