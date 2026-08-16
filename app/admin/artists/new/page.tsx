'use client';

import React, { useState } from 'react';
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
  Mail,
  User,
  Key,
  MapPin,
  Tag,
  ImageIcon,
  Globe,
  Lock,
} from 'lucide-react';

export default function AdminNewArtistPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [saving, setSaving] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Form State
  const [stageName, setStageName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('ChenabArtist2026!');
  const [location, setLocation] = useState('Srinagar, J&K');
  const [bio, setBio] = useState('');
  const [genres, setGenres] = useState('Contemporary');
  const [catalogueNumberPrefix, setCatalogueNumberPrefix] = useState('CHNB-ART-01');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [profileImage, setProfileImage] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Social links
  const [socialSpotify, setSocialSpotify] = useState('');
  const [socialApple, setSocialApple] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('');
  const [socialSoundcloud, setSocialSoundcloud] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    try {
      if (!stageName || !email) {
        throw new Error('Stage Name and Email address are required fields.');
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
        password,
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

      const res = await fetch('/api/admin/artists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create artist profile');
      }

      const resData = await res.json();
      setSuccessNotice(`ARTIST ACCOUNT "${stageName}" PROVISIONED SUCCESSFULLY.`);
      setTimeout(() => {
        router.push('/admin/artists');
      }, 1200);
    } catch (err: any) {
      console.error('Error creating artist:', err);
      setErrorNotice(err.message || 'An error occurred while provisioning artist.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-mono text-xs">
      {/* Header */}
      <div className="border-b border-[#1C1C1C] pb-6 flex items-center justify-between">
        <Link
          href="/admin/artists"
          className="inline-flex items-center gap-2 text-[#888888] hover:text-[#F5F5F5] uppercase"
        >
          <ArrowLeft size={14} />
          <span>RETURN TO ROSTER DIRECTORY</span>
        </Link>

        <span className="text-[10px] text-[#666666] uppercase">ADMINISTRATIVE PROVISIONING</span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-emerald-400">
          <Users size={14} />
          <span className="uppercase tracking-widest">ROSTER ACCOUNT CREATION</span>
        </div>
        <h1 className="font-display font-black text-2xl sm:text-4xl text-[#F5F5F5] uppercase">
          PROVISION NEW ARTIST ACCOUNT
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
        {/* Section 1: Authentication & Identity */}
        <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-6 space-y-6">
          <h3 className="font-display font-bold text-lg text-[#F5F5F5] uppercase border-b border-[#1A1A1A] pb-3 flex items-center gap-2">
            <User size={18} className="text-emerald-400" />
            <span>1. ARTIST IDENTITY & AUTHENTICATION CREDENTIALS</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase">STAGE / ROSTER NAME *</label>
              <input
                type="text"
                required
                placeholder="e.g. Kashmir Wave Collective"
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase">LEGAL NAME (CONFIDENTIAL)</label>
              <input
                type="text"
                placeholder="e.g. Tariq Ahmad Shah"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase">PORTAL EMAIL ADDRESS *</label>
              <input
                type="email"
                required
                placeholder="artist@chenabmedia.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase">INITIAL SECURITY KEY / PASSWORD</label>
              <input
                type="text"
                required
                placeholder="ChenabArtist2026!"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase">PHONE NUMBER</label>
              <input
                type="text"
                placeholder="+91 99060 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase">CATALOGUE NUMBER PREFIX</label>
              <input
                type="text"
                placeholder="CHNB-ART-01"
                value={catalogueNumberPrefix}
                onChange={(e) => setCatalogueNumberPrefix(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] p-3 text-sky-400 font-bold focus:outline-none focus:border-[#555555]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Profile Metadata */}
        <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-6 space-y-6">
          <h3 className="font-display font-bold text-lg text-[#F5F5F5] uppercase border-b border-[#1A1A1A] pb-3 flex items-center gap-2">
            <Tag size={18} className="text-sky-400" />
            <span>2. PROFILE METADATA & STATEMENT</span>
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[#CCCCCC] uppercase">LOCATION</label>
                <input
                  type="text"
                  placeholder="e.g. Srinagar, J&K"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[#CCCCCC] uppercase">GENRES (COMMA SEPARATED)</label>
                <input
                  type="text"
                  placeholder="e.g. Ambient, Folk Fusion, Drone"
                  value={genres}
                  onChange={(e) => setGenres(e.target.value)}
                  className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase">BIOGRAPHY / STATEMENT</label>
              <textarea
                rows={4}
                placeholder="Write artist biography..."
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
                  placeholder="https://images.unsplash.com/..."
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                  className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[#CCCCCC] uppercase">COVER BANNER URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Status & Internal Notes */}
        <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-6 space-y-6">
          <h3 className="font-display font-bold text-lg text-[#F5F5F5] uppercase border-b border-[#1A1A1A] pb-3 flex items-center gap-2">
            <Lock size={18} className="text-amber-400" />
            <span>3. ACCOUNT STATUS & INTERNAL NOTES</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase">INTERNAL A&R NOTES</label>
              <input
                type="text"
                placeholder="Internal label notes..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-4 bg-[#F5F5F5] text-[#080808] font-bold text-xs uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>PROVISIONING ACCOUNT...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>PROVISION ARTIST ACCOUNT</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
