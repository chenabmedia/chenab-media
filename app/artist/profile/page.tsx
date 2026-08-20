'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ArtistPortalLayout } from '@/components/artist/ArtistPortalLayout';
import {
  User,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
  Instagram,
  Music,
  Twitter,
  Youtube,
  Lock,
  Image as ImageIcon,
  MapPin,
  Tag,
} from 'lucide-react';
import { Artist } from '@/types';

export default function ArtistProfilePage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Form State for Artist-Editable Fields ONLY
  const [profileImage, setProfileImage] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [genres, setGenres] = useState('');
  const [featuredQuote, setFeaturedQuote] = useState('');

  // Social & Streaming Links
  const [socialSpotify, setSocialSpotify] = useState('');
  const [socialApple, setSocialApple] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('');
  const [socialSoundcloud, setSocialSoundcloud] = useState('');
  const [socialWebsite, setSocialWebsite] = useState('');

  useEffect(() => {
    if (authLoading) return;

    async function fetchProfile() {
      try {
        setLoading(true);
        let headers: Record<string, string> = {};
        if (user) {
          const token = await user.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch('/api/artist/profile', { headers });
        if (res.ok) {
          const data = await res.json();
          const art: Artist = data.artist;
          setArtist(art);

          // Populate form fields
          setProfileImage(art.profileImage || art.image || '');
          setCoverImage(art.coverImage || '');
          setBio(art.bio || '');
          setLocation(art.location || '');
          setGenres(art.genres ? art.genres.join(', ') : '');
          setFeaturedQuote(art.featuredQuote || '');

          if (art.socialLinks) {
            setSocialSpotify(art.socialLinks.spotify || '');
            setSocialApple(art.socialLinks.appleMusic || '');
            setSocialInstagram(art.socialLinks.instagram || '');
            setSocialYoutube(art.socialLinks.youtube || '');
            setSocialTwitter(art.socialLinks.twitter || '');
            setSocialSoundcloud(art.socialLinks.soundcloud || '');
          }
        }
      } catch (err: any) {
        console.error('Error fetching artist profile:', err);
        setErrorNotice('Failed to load artist profile details.');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessNotice(null);
    setErrorNotice(null);

    try {
      if (!user) throw new Error('Authentication required');
      const token = await user.getIdToken();

      const parsedGenres = genres
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean);

      const payload = {
        profileImage,
        coverImage,
        bio,
        location,
        genres: parsedGenres,
        featuredQuote,
        socialLinks: {
          spotify: socialSpotify,
          appleMusic: socialApple,
          instagram: socialInstagram,
          youtube: socialYoutube,
          twitter: socialTwitter,
          soundcloud: socialSoundcloud,
          website: socialWebsite,
        },
        streamingLinks: {
          spotify: socialSpotify,
          appleMusic: socialApple,
          youtubeMusic: socialYoutube,
          soundcloud: socialSoundcloud,
        },
      };

      const res = await fetch('/api/artist/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update profile');
      }

      const resData = await res.json();
      setArtist(resData.artist);
      setSuccessNotice('ARTIST PROFILE UPDATED SUCCESSFULLY IN CHENAB CATALOGUE.');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setErrorNotice(err.message || 'An error occurred while saving profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4 font-mono text-xs">
        <Loader2 size={28} className="animate-spin text-[#F5F5F5]" />
        <p className="text-[#888888] tracking-widest uppercase">
          FETCHING ARTIST PROFILE METADATA...
        </p>
      </div>
    );
  }

  return (
    <ArtistPortalLayout>
      <div className="space-y-10 font-mono">
        {/* Page Header */}
      <div className="border-b border-[#1C1C1C] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-sky-400 mb-1">
            <User size={14} />
            <span className="uppercase tracking-widest">PORTAL PROFILE MANAGEMENT</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-4xl text-[#F5F5F5] uppercase">
            MY ARTIST PROFILE
          </h1>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-3 bg-[#F5F5F5] text-[#080808] font-bold text-xs uppercase hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>SAVING PROFILE...</span>
            </>
          ) : (
            <>
              <Save size={14} />
              <span>SAVE CHANGES</span>
            </>
          )}
        </button>
      </div>

      {successNotice && (
        <div className="p-4 border border-emerald-900/50 bg-emerald-950/30 text-xs text-emerald-300 flex items-center gap-3">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="p-4 border border-red-900/50 bg-red-950/30 text-xs text-red-300 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Label-Controlled Read-Only Section */}
      <div className="border border-[#1A1A1A] bg-[#0A0A0A] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#181818] pb-3 text-xs">
          <div className="flex items-center gap-2 text-[#888888] font-bold uppercase">
            <Lock size={14} className="text-amber-400" />
            <span>LABEL-CONTROLLED IDENTITY DATA (READ-ONLY)</span>
          </div>
          <span className="text-[10px] text-[#666666]">RESERVED FOR A&R ADMINISTRATION</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
          <div className="space-y-1 bg-[#111111] p-3 border border-[#1A1A1A]">
            <span className="text-[10px] text-[#666666] uppercase">STAGE / ROSTER NAME</span>
            <p className="font-bold text-[#F5F5F5]">{artist?.stageName || artist?.name || 'Unassigned'}</p>
          </div>

          <div className="space-y-1 bg-[#111111] p-3 border border-[#1A1A1A]">
            <span className="text-[10px] text-[#666666] uppercase">LEGAL NAME</span>
            <p className="font-bold text-[#F5F5F5]">{artist?.legalName || 'Confidential / On File'}</p>
          </div>

          <div className="space-y-1 bg-[#111111] p-3 border border-[#1A1A1A]">
            <span className="text-[10px] text-[#666666] uppercase">ACCOUNT EMAIL</span>
            <p className="font-bold text-[#F5F5F5]">{artist?.email || userProfile?.email}</p>
          </div>

          <div className="space-y-1 bg-[#111111] p-3 border border-[#1A1A1A]">
            <span className="text-[10px] text-[#666666] uppercase">CATALOGUE PREFIX</span>
            <p className="font-bold text-sky-400">{artist?.catalogueNumberPrefix || 'CHNB-ART-01'}</p>
          </div>
        </div>
      </div>

      {/* Artist Editable Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Visual Imagery */}
        <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-6 space-y-6">
          <h3 className="font-display font-bold text-lg text-[#F5F5F5] uppercase border-b border-[#1A1A1A] pb-3 flex items-center gap-2">
            <ImageIcon size={18} className="text-sky-400" />
            <span>ARTIST IMAGERY & MEDIA</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase">PROFILE IMAGE URL (SQUARE)</label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#555555]"
              />
              {profileImage && (
                <div className="w-20 h-20 bg-[#151515] border border-[#222222] overflow-hidden mt-2">
                  <img src={profileImage} alt="Profile Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase">COVER BANNER URL (LANDSCAPE)</label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#555555]"
              />
              {coverImage && (
                <div className="w-full h-20 bg-[#151515] border border-[#222222] overflow-hidden mt-2">
                  <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bio & Details */}
        <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-6 space-y-6">
          <h3 className="font-display font-bold text-lg text-[#F5F5F5] uppercase border-b border-[#1A1A1A] pb-3 flex items-center gap-2">
            <Tag size={18} className="text-emerald-400" />
            <span>ARTIST STATEMENT & DETAILS</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[#CCCCCC] uppercase flex items-center gap-1.5">
                  <MapPin size={12} className="text-[#888888]" />
                  <span>PRIMARY LOCATION</span>
                </label>
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
              <label className="block text-[#CCCCCC] uppercase">BIOGRAPHY / ARTIST STATEMENT</label>
              <textarea
                rows={5}
                placeholder="Write artist biography..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555] font-sans text-sm leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase">FEATURED QUOTE / SLOGAN</label>
              <input
                type="text"
                placeholder="e.g. We allow the mountains to reverberate through modern voltage."
                value={featuredQuote}
                onChange={(e) => setFeaturedQuote(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555] font-serif italic text-sm"
              />
            </div>
          </div>
        </div>

        {/* Social & Streaming Profiles */}
        <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-6 space-y-6">
          <h3 className="font-display font-bold text-lg text-[#F5F5F5] uppercase border-b border-[#1A1A1A] pb-3 flex items-center gap-2">
            <Globe size={18} className="text-amber-400" />
            <span>STREAMING & SOCIAL PLATFORMS</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="space-y-1.5">
              <label className="block text-[#888888] uppercase">SPOTIFY PROFILE URL</label>
              <input
                type="url"
                placeholder="https://open.spotify.com/artist/..."
                value={socialSpotify}
                onChange={(e) => setSocialSpotify(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[#888888] uppercase">APPLE MUSIC URL</label>
              <input
                type="url"
                placeholder="https://music.apple.com/..."
                value={socialApple}
                onChange={(e) => setSocialApple(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[#888888] uppercase">INSTAGRAM PROFILE</label>
              <input
                type="url"
                placeholder="https://instagram.com/..."
                value={socialInstagram}
                onChange={(e) => setSocialInstagram(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[#888888] uppercase">YOUTUBE CHANNEL</label>
              <input
                type="url"
                placeholder="https://youtube.com/..."
                value={socialYoutube}
                onChange={(e) => setSocialYoutube(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[#888888] uppercase">TWITTER / X</label>
              <input
                type="url"
                placeholder="https://x.com/..."
                value={socialTwitter}
                onChange={(e) => setSocialTwitter(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[#888888] uppercase">SOUNDCLOUD PROFILE</label>
              <input
                type="url"
                placeholder="https://soundcloud.com/..."
                value={socialSoundcloud}
                onChange={(e) => setSocialSoundcloud(e.target.value)}
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
                <span>SAVE PROFILE CHANGES</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
    </ArtistPortalLayout>
  );
}
