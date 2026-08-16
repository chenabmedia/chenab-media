'use client';

import React, { useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Filter,
  Loader2,
  ExternalLink,
  CheckCheck,
} from 'lucide-react';
import Link from 'next/link';
import { Notification } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function ArtistNotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');

  useEffect(() => {
    if (authLoading) return;

    async function fetchNotifs() {
      try {
        setLoading(true);
        let headers: Record<string, string> = {};
        if (user) {
          const token = await user.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch('/api/artist/notifications', { headers });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error('Error loading notifications:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchNotifs();
  }, [user, authLoading]);

  const handleMarkAsRead = async (id: string) => {
    try {
      let headers: Record<string, string> = {};
      if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/artist/notifications/${id}`, {
        method: 'PATCH',
        headers,
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.read;
    if (filter === 'READ') return n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4 font-mono text-xs">
        <Loader2 size={28} className="animate-spin text-[#F5F5F5]" />
        <p className="text-[#888888] tracking-widest uppercase">
          FETCHING ROSTER NOTIFICATIONS...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-mono">
      {/* Page Header */}
      <div className="border-b border-[#1C1C1C] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 mb-1">
            <Bell size={14} />
            <span className="uppercase tracking-widest">SYSTEM & A&R COMMUNICATIONS</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-4xl text-[#F5F5F5] uppercase">
            NOTIFICATIONS ({notifications.length})
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 bg-[#111111] border border-[#222222] text-[#888888]">
            UNREAD: <strong className="text-emerald-400">{unreadCount}</strong>
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-[#1C1C1C] text-xs">
        {(['ALL', 'UNREAD', 'READ'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-6 py-3 uppercase font-bold border-b-2 transition-all ${
              filter === tab
                ? 'border-[#F5F5F5] text-[#F5F5F5] bg-[#111111]'
                : 'border-transparent text-[#666666] hover:text-[#CCCCCC]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="p-12 border border-dashed border-[#222222] bg-[#0A0A0A] text-center text-xs text-[#666666]">
          NO NOTIFICATIONS RECORDED UNDER THIS FILTER CATEGORY.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-6 border text-xs space-y-3 transition-all ${
                !notif.read
                  ? 'border-sky-900/60 bg-sky-950/15'
                  : 'border-[#1C1C1C] bg-[#0C0C0C]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-[#151515] border border-[#222222] text-[10px] font-bold text-sky-400 uppercase">
                    {notif.type}
                  </span>
                  {!notif.read && (
                    <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-[9px] font-bold uppercase">
                      NEW UNREAD
                    </span>
                  )}
                </div>

                <span className="text-[#666666] text-[11px]">
                  {new Date(notif.createdAt).toLocaleString()}
                </span>
              </div>

              <h3 className="font-display font-bold text-lg text-[#F5F5F5] uppercase">
                {notif.title}
              </h3>

              <p className="text-[#CCCCCC] font-sans leading-relaxed text-sm">
                {notif.message}
              </p>

              <div className="pt-3 border-t border-[#181818] flex items-center justify-between">
                <div>
                  {notif.link && (
                    <Link
                      href={notif.link}
                      className="text-sky-400 hover:underline uppercase text-[11px] flex items-center gap-1"
                    >
                      <span>ACTION LINK</span>
                      <ExternalLink size={12} />
                    </Link>
                  )}
                </div>

                {!notif.read ? (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="px-3 py-1.5 bg-[#151515] border border-[#222222] hover:border-[#444444] text-[#F5F5F5] font-bold uppercase text-[11px] flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    <span>MARK READ</span>
                  </button>
                ) : (
                  <span className="text-[#666666] text-[10px] uppercase flex items-center gap-1">
                    <CheckCheck size={12} className="text-emerald-500" />
                    <span>READ</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
