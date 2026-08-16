'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Edit,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Disc,
  MapPin,
  Lock,
  ExternalLink,
  Mail,
  Phone,
  UserCheck,
} from 'lucide-react';
import { Artist, Release } from '@/types';
import { ARTISTS } from '@/data/artists';
import { useAuth } from '@/context/AuthContext';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminArtistDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const artistId = resolvedParams.id;
  const { user, loading: authLoading } = useAuth();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [userAccount, setUserAccount] = useState<any | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    async function loadArtist() {
      try {
        setLoading(true);
        if (!user) {
          const staticArtist = ARTISTS.find((a) => a.id === artistId || a.slug === artistId);
          if (staticArtist) setArtist(staticArtist);
          setLoading(false);
          return;
        }

        const token = await user.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };

        const res = await fetch(`/api/admin/artists/${artistId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setArtist(data.artist);
          setUserAccount(data.userAccount);
        } else {
          const staticArtist = ARTISTS.find((a) => a.id === artistId || a.slug === artistId);
          if (staticArtist) setArtist(staticArtist);
        }

        const relRes = await fetch('/api/artist/releases', { headers });
        if (relRes.ok) {
          const relData = await relRes.json();
          setReleases(relData.releases || []);
        }
      } catch (err: any) {
        console.error('Error fetching artist detail:', err);
      } finally {
        setLoading(false);
      }
    }

    loadArtist();
  }, [artistId, user, authLoading]);

  const handleToggleStatus = async () => {
    if (!artist) return;
    const newStatus = artist.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    setActionSuccess(null);
    setActionError(null);

    try {
      if (!user) throw new Error('Authentication required');
      const token = await user.getIdToken();

      const res = await fetch(`/api/admin/artists/${artist.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setArtist((prev) => (prev ? { ...prev, status: newStatus as any } : null));
        setActionSuccess(`ARTIST STATUS SET TO ${newStatus}.`);
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Status update failed');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error updating status');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4 font-mono text-xs">
        <Loader2 size={28} className="animate-spin text-emerald-400" />
        <p className="text-[#888888] tracking-widest uppercase">
          FETCHING ROSTER ARTIST RECORD...
        </p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="py-20 text-center font-mono space-y-6 text-xs">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#111111] border border-[#222222] flex items-center justify-center text-[#888888]">
          <Users size={28} />
        </div>
        <h2 className="font-display font-bold text-2xl text-[#F5F5F5] uppercase">
          ARTIST PROFILE NOT FOUND
        </h2>
        <p className="text-[#888888]">
          THE REQUESTED ARTIST RECORD DOES NOT EXIST IN THE CHENAB DATABASE.
        </p>
        <Link
          href="/admin/artists"
          className="inline-block px-6 py-3 bg-[#F5F5F5] text-[#080808] font-bold uppercase"
        >
          RETURN TO DIRECTORY
        </Link>
      </div>
    );
  }

  const isSuspended = artist.status === 'SUSPENDED';
  const displayName = artist.stageName || artist.name || 'Roster Artist';
  const avatar = artist.profileImage || artist.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="space-y-8 font-mono text-xs">
      {/* Top Bar */}
      <div className="border-b border-[#1C1C1C] pb-6 flex items-center justify-between">
        <Link
          href="/admin/artists"
          className="inline-flex items-center gap-2 text-[#888888] hover:text-[#F5F5F5] uppercase"
        >
          <ArrowLeft size={14} />
          <span>BACK TO ROSTER DIRECTORY</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleStatus}
            className={`px-4 py-2 border uppercase font-bold text-xs ${
              isSuspended
                ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-300 hover:bg-emerald-900/50'
                : 'bg-red-950/40 border-red-900/50 text-red-300 hover:bg-red-900/50'
            }`}
          >
            {isSuspended ? 'REACTIVATE ACCOUNT' : 'SUSPEND ACCOUNT'}
          </button>

          <Link
            href={`/admin/artists/${artist.id}/edit`}
            className="px-4 py-2 bg-[#F5F5F5] text-[#080808] font-bold uppercase hover:bg-white flex items-center gap-2"
          >
            <Edit size={14} />
            <span>EDIT ARTIST</span>
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 border border-emerald-900/50 bg-emerald-950/30 text-emerald-300 flex items-center gap-3">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 border border-red-900/50 bg-red-950/30 text-red-300 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Profile Header */}
      <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-24 h-24 bg-[#151515] border border-[#222222] overflow-hidden shrink-0">
            <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-display font-black text-3xl sm:text-4xl text-[#F5F5F5] uppercase">
                {displayName}
              </h1>
              <span
                className={`px-3 py-1 text-[10px] font-bold border uppercase ${
                  isSuspended
                    ? 'bg-red-950/40 border-red-900/50 text-red-400'
                    : 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400'
                }`}
              >
                {artist.status || 'ACTIVE'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[#888888] text-[11px]">
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-[#666666]" />
                {artist.location || 'Srinagar, J&K'}
              </span>
              <span>&bull;</span>
              <span>PREFIX: <strong className="text-sky-400">{artist.catalogueNumberPrefix || artist.id}</strong></span>
              <span>&bull;</span>
              <span>UID: {artist.userId || 'Not Linked'}</span>
            </div>
          </div>
        </div>

        {artist.bio && (
          <p className="text-xs text-[#CCCCCC] font-sans leading-relaxed border-t border-[#181818] pt-4">
            {artist.bio}
          </p>
        )}
      </div>

      {/* Grid: Legal & Account Details & Linked Releases */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Private & Legal Account Details */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-6 space-y-4">
            <h3 className="font-display font-bold text-base text-[#F5F5F5] uppercase border-b border-[#181818] pb-3 flex items-center gap-2">
              <Lock size={16} className="text-amber-400" />
              <span>PRIVATE & LEGAL INFORMATION</span>
            </h3>

            <div className="space-y-3">
              <div className="space-y-1 bg-[#111111] p-3 border border-[#1A1A1A]">
                <span className="text-[10px] text-[#666666] uppercase">LEGAL NAME</span>
                <p className="font-bold text-[#F5F5F5]">{artist.legalName || 'Not Provided'}</p>
              </div>

              <div className="space-y-1 bg-[#111111] p-3 border border-[#1A1A1A]">
                <span className="text-[10px] text-[#666666] uppercase">CONTACT EMAIL</span>
                <p className="font-bold text-[#F5F5F5]">{artist.email || 'On File'}</p>
              </div>

              <div className="space-y-1 bg-[#111111] p-3 border border-[#1A1A1A]">
                <span className="text-[10px] text-[#666666] uppercase">PHONE NUMBER</span>
                <p className="font-bold text-[#F5F5F5]">{artist.phone || 'Not Provided'}</p>
              </div>

              {artist.internalNotes && (
                <div className="space-y-1 bg-[#111111] p-3 border border-[#1A1A1A]">
                  <span className="text-[10px] text-[#666666] uppercase">INTERNAL A&R NOTES</span>
                  <p className="text-[#CCCCCC]">{artist.internalNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Linked Auth User Status */}
          <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-6 space-y-3">
            <h3 className="font-display font-bold text-base text-[#F5F5F5] uppercase border-b border-[#181818] pb-3 flex items-center gap-2">
              <UserCheck size={16} className="text-emerald-400" />
              <span>LINKED FIREBASE USER ACCOUNT</span>
            </h3>

            <p className="text-[#888888]">
              AUTH UID: <strong className="text-[#F5F5F5]">{artist.userId || 'N/A'}</strong>
            </p>
            <p className="text-[#888888]">
              USER EMAIL: <strong className="text-[#F5F5F5]">{artist.email || userAccount?.email || 'N/A'}</strong>
            </p>
            <p className="text-[#888888]">
              ROLE: <strong className="text-sky-400">ARTIST</strong>
            </p>
          </div>
        </div>

        {/* Right Column: Catalogue Releases */}
        <div className="lg:col-span-7 space-y-6">
          <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#181818] pb-3">
              <h3 className="font-display font-bold text-base text-[#F5F5F5] uppercase flex items-center gap-2">
                <Disc size={16} className="text-sky-400" />
                <span>LINKED CATALOGUE RELEASES ({releases.length})</span>
              </h3>
            </div>

            {releases.length === 0 ? (
              <div className="p-8 border border-dashed border-[#222222] bg-[#0A0A0A] text-center text-[#666666]">
                NO RELEASES CURRENTLY ASSOCIATED WITH THIS ARTIST.
              </div>
            ) : (
              <div className="space-y-3">
                {releases.map((rel) => (
                  <div
                    key={rel.id}
                    className="p-4 border border-[#181818] bg-[#080808] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#151515] border border-[#222222] overflow-hidden">
                        <img src={rel.cover} alt={rel.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="text-[10px] text-sky-400 font-bold">{rel.catalogueNumber}</span>
                        <p className="font-bold text-[#F5F5F5] text-sm uppercase">{rel.title}</p>
                        <p className="text-[10px] text-[#777777]">{rel.type} &bull; {rel.releaseDate}</p>
                      </div>
                    </div>

                    <span className="px-2 py-1 bg-[#141414] border border-[#222222] text-[#888888] text-[10px] font-bold uppercase">
                      {rel.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
