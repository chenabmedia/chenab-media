'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  Users,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  MapPin,
  Tag,
  Lock,
} from 'lucide-react';
import { Artist } from '@/types';
import { ARTISTS } from '@/data/artists';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminArtistEditPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const artistId = resolvedParams.id;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Form State
  const [stageName, setStageName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [genres, setGenres] = useState('');
  const [catalogueNumberPrefix, setCatalogueNumberPrefix] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [profileImage, setProfileImage] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Social
  const [socialSpotify, setSocialSpotify] = useState('');
  const [socialApple, setSocialApple] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('');
  const [socialSoundcloud, setSocialSoundcloud] = useState('');

  useEffect(() => {
    if (authLoading) return;

    async function fetchArtist() {
      try {
        setLoading(true);
        setErrorNotice(null);

        if (!user) {
          setErrorNotice('Authentication required. Please sign in as administrator.');
          setLoading(false);
          return;
        }

        const token = await user.getIdToken();
        const res = await fetch(`/api/admin/artists/${artistId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        let art: Artist | null = null;

        if (res.ok) {
          const data = await res.json();
          art = data.artist;
        } else {
          const errData = await res.json().catch(() => ({}));
          setErrorNotice(errData.error || 'Failed to load artist details from server.');
        }

        if (art) {
          setStageName(art.stageName || art.name || '');
          setLegalName(art.legalName || '');
          setEmail(art.email || '');
          setPhone(art.phone || '');
          setLocation(art.location || '');
          setBio(art.bio || '');
          setGenres(art.genres ? art.genres.join(', ') : '');
          setCatalogueNumberPrefix(art.catalogueNumberPrefix || art.id || '');
          setStatus((art.status as any) || 'ACTIVE');
          setProfileImage(art.profileImage || art.image || '');
          setCoverImage(art.coverImage || '');
          setInternalNotes(art.internalNotes || '');

          if (art.socialLinks) {
            setSocialSpotify(art.socialLinks.spotify || '');
            setSocialApple(art.socialLinks.appleMusic || '');
            setSocialInstagram(art.socialLinks.instagram || '');
            setSocialYoutube(art.socialLinks.youtube || '');
            setSocialTwitter(art.socialLinks.twitter || '');
            setSocialSoundcloud(art.socialLinks.soundcloud || '');
          }
        }
      } catch (err) {
        console.error('Error fetching artist for edit:', err);
        setErrorNotice('Failed to load artist details.');
      } finally {
        setLoading(false);
      }
    }

    fetchArtist();
  }, [artistId, user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    try {
      if (!stageName) {
        throw new Error('Stage Name is required.');
      }

      if (!user) {
        throw new Error('Authentication required. Please sign in as administrator.');
      }

      const token = await user.getIdToken();

      const parsedGenres = genres
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean);

      const payload = {
        stageName,
        legalName,
        email,
        phone,
        location,
        bio,
        genres: parsedGenres,
        catalogueNumberPrefix,
        status,
        profileImage,
        coverImage,
        internalNotes,
        socialLinks: {
          spotify: socialSpotify,
          appleMusic: socialApple,
          instagram: socialInstagram,
          youtube: socialYoutube,
          twitter: socialTwitter,
          soundcloud: socialSoundcloud,
        },
        streamingLinks: {
          spotify: socialSpotify,
          appleMusic: socialApple,
          youtubeMusic: socialYoutube,
          soundcloud: socialSoundcloud,
        },
      };

      const res = await fetch(`/api/admin/artists/${artistId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update artist profile');
      }

      setSuccessNotice(`ARTIST PROFILE "${stageName}" UPDATED SUCCESSFULLY.`);
      setTimeout(() => {
        router.push(`/admin/artists/${artistId}`);
      }, 1200);
    } catch (err: any) {
      console.error('Error updating artist:', err);
      setErrorNotice(err.message || 'An error occurred while updating profile.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4 font-mono text-xs">
        <Loader2 size={28} className="animate-spin text-emerald-400" />
        <p className="text-[#888888] tracking-widest uppercase">
          LOADING ARTIST EDIT FORM...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-mono text-xs">
      {/* Header */}
      <div className="border-b border-[#1C1C1C] pb-6 flex items-center justify-between">
        <Link
          href={`/admin/artists/${artistId}`}
          className="inline-flex items-center gap-2 text-[#888888] hover:text-[#F5F5F5] uppercase"
        >
          <ArrowLeft size={14} />
          <span>CANCEL & RETURN TO PROFILE</span>
        </Link>

        <span className="text-[10px] text-[#666666] uppercase">ADMIN EDIT MODE</span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-emerald-400">
          <Users size={14} />
          <span className="uppercase tracking-widest">ARTIST MANAGEMENT</span>
        </div>
        <h1 className="font-display font-black text-2xl sm:text-4xl text-[#F5F5F5] uppercase">
          EDIT ARTIST: {stageName}
        </h1>
      </div>

      {successNotice && (
        <div className="p-4 border border-emerald-900/50 bg-emerald-950/30 text-emerald-300 flex items-center gap-3">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="p-4 border border-red-900/50 bg-red-950/30 text-red-300 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Identity & Legal */}
        <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-6 space-y-6">
          <h3 className="font-display font-bold text-lg text-[#F5F5F5] uppercase border-b border-[#1A1A1A] pb-3 flex items-center gap-2">
            <User size={18} className="text-emerald-400" />
            <span>1. ARTIST IDENTITY & CONTACT INFORMATION</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase">STAGE / ROSTER NAME *</label>
              <input
                type="text"
                required
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase">LEGAL NAME (CONFIDENTIAL)</label>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase">CONTACT EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase">PHONE NUMBER</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase">CATALOGUE PREFIX ID</label>
              <input
                type="text"
                value={catalogueNumberPrefix}
                onChange={(e) => setCatalogueNumberPrefix(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] p-3 text-sky-400 font-bold focus:outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase">ACCOUNT STATUS</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555] uppercase"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Metadata */}
        <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-6 space-y-6">
          <h3 className="font-display font-bold text-lg text-[#F5F5F5] uppercase border-b border-[#1A1A1A] pb-3 flex items-center gap-2">
            <Tag size={18} className="text-sky-400" />
            <span>2. PROFILE STATEMENT & MEDIA</span>
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[#CCCCCC] uppercase">LOCATION</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[#CCCCCC] uppercase">GENRES (COMMA SEPARATED)</label>
                <input
                  type="text"
                  value={genres}
                  onChange={(e) => setGenres(e.target.value)}
                  className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase">BIOGRAPHY</label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555] font-sans text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[#CCCCCC] uppercase">PROFILE IMAGE URL</label>
                <input
                  type="url"
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                  className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[#CCCCCC] uppercase">COVER BANNER URL</label>
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase">INTERNAL A&R NOTES</label>
              <input
                type="text"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-4 bg-[#F5F5F5] text-[#080808] font-bold text-xs uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>SAVING CHANGES...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>UPDATE ARTIST PROFILE</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
