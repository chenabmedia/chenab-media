'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Disc,
  Save,
  Send,
  Eye,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Music,
  Upload,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Copy,
  Check,
  Info,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { Release, ReleaseStatus, ReleaseType, Track, Credit, DSPLinks, Artist } from '@/types';
import { dspDiscoveryService } from '@/lib/dsp';

interface ReleaseEditorProps {
  initialRelease?: Partial<Release>;
  isEditMode?: boolean;
}

export function ReleaseEditor({ initialRelease, isEditMode = false }: ReleaseEditorProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, loading: authLoading } = useAuth();

  // Form State
  const [id, setId] = useState<string>(initialRelease?.id || '');
  const [title, setTitle] = useState<string>(initialRelease?.title || '');
  const [catalogueNumber, setCatalogueNumber] = useState<string>(
    initialRelease?.catalogueNumber || 'CHNB-001'
  );
  const [releaseType, setReleaseType] = useState<ReleaseType>(
    (initialRelease?.releaseType || initialRelease?.type || 'SINGLE') as ReleaseType
  );
  const [primaryArtistIds, setPrimaryArtistIds] = useState<string[]>(
    initialRelease?.primaryArtistIds || (initialRelease?.artistIds ? [initialRelease.artistIds[0]] : [])
  );
  const [featuredArtistIds, setFeaturedArtistIds] = useState<string[]>(
    initialRelease?.featuredArtistIds || []
  );
  const [artistName, setArtistName] = useState<string>(initialRelease?.artistName || '');
  const [coverImage, setCoverImage] = useState<string>(
    initialRelease?.coverImage || initialRelease?.cover || ''
  );
  const [backCoverImage, setBackCoverImage] = useState<string>(
    initialRelease?.backCoverImage || ''
  );
  const [description, setDescription] = useState<string>(initialRelease?.description || '');
  const [genre, setGenre] = useState<string>(
    initialRelease?.genre || (initialRelease?.genres && initialRelease.genres[0]) || 'Electronic'
  );
  const [subgenres, setSubgenres] = useState<string[]>(
    initialRelease?.subgenres || (initialRelease?.genres ? initialRelease.genres.slice(1) : ['Ambient'])
  );
  const [subgenreInput, setSubgenreInput] = useState<string>('');
  const [releaseDate, setReleaseDate] = useState<string>(
    initialRelease?.releaseDate || new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<ReleaseStatus | string>(
    initialRelease?.status || 'DRAFT'
  );
  const [explicit, setExplicit] = useState<boolean>(initialRelease?.explicit || false);
  const [copyright, setCopyright] = useState<string>(
    initialRelease?.copyright || '© CHENAB MEDIA'
  );
  const [publisher, setPublisher] = useState<string>(
    initialRelease?.publisher || 'CHENAB MEDIA Publishing'
  );
  const [label, setLabel] = useState<string>(initialRelease?.label || 'CHENAB MEDIA');

  const [tracks, setTracks] = useState<Track[]>(
    initialRelease?.tracks || [
      {
        id: 'tr-1',
        trackNumber: 1,
        title: '',
        version: 'Original Mix',
        duration: '03:30',
        isrc: '',
        explicit: false,
      },
    ]
  );

  const [credits, setCredits] = useState<Credit[]>(
    initialRelease?.credits || [
      { role: 'Executive Producer', name: 'CHENAB A&R' },
      { role: 'Mixing & Mastering', name: 'CHENAB Audio Lab' },
    ]
  );

  const [dspLinks, setDspLinks] = useState<DSPLinks>(
    initialRelease?.dspLinks || initialRelease?.streamingLinks || {}
  );

  const [smartLinkSlug, setSmartLinkSlug] = useState<string>(
    initialRelease?.smartLink?.slug || initialRelease?.slug || ''
  );

  // Aux state
  const [artists, setArtists] = useState<Artist[]>([]);
  const [activeTab, setActiveTab] = useState<'basic' | 'artwork' | 'tracks' | 'credits' | 'dsp'>(
    'basic'
  );
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dspMessage, setDspMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Uniqueness checks
  const [checkingUnique, setCheckingUnique] = useState<boolean>(false);
  const [catNumExists, setCatNumExists] = useState<boolean>(false);
  const [slugExists, setSlugExists] = useState<boolean>(false);
  const [smartLinkExists, setSmartLinkExists] = useState<boolean>(false);

  // Auto-generate slug when title changes if user hasn't typed custom smart link slug
  useEffect(() => {
    if (title && !isEditMode && !smartLinkSlug) {
      const generated = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-');
      setSmartLinkSlug(generated);
    }
  }, [title, isEditMode]);

  // Fetch roster artists for selector
  useEffect(() => {
    if (authLoading) return;
    async function loadArtists() {
      try {
        let headers: Record<string, string> = {};
        if (user) {
          const token = await user.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch('/api/admin/artists', { headers });
        if (res.ok) {
          const data = await res.json();
          setArtists(data.artists || []);
        }
      } catch (e) {
        console.error('Failed to load roster artists:', e);
      }
    }
    loadArtists();
  }, [user, authLoading]);

  // Update artist display name when primaryArtistIds change
  useEffect(() => {
    if (primaryArtistIds.length > 0 && artists.length > 0) {
      const primaryNames = primaryArtistIds
        .map((id) => {
          const match = artists.find((a) => a.id === id);
          return match?.stageName || match?.name || id;
        })
        .filter(Boolean);
      if (primaryNames.length > 0) {
        setArtistName(primaryNames.join(' & '));
      }
    }
  }, [primaryArtistIds, artists]);

  // Check unique constraints debounced
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (catalogueNumber || title || smartLinkSlug) {
        try {
          setCheckingUnique(true);
          const slugCandidate =
            title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
          const query = new URLSearchParams({
            catalogueNumber,
            slug: slugCandidate,
            smartLinkSlug,
            ...(id ? { excludeId: id } : {}),
          });
          let headers: Record<string, string> = {};
          if (user) {
            const token = await user.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
          }
          const res = await fetch(`/api/admin/releases/check-unique?${query.toString()}`, { headers });
          if (res.ok) {
            const data = await res.json();
            setCatNumExists(data.catNumExists);
            setSlugExists(data.slugExists);
            setSmartLinkExists(data.smartLinkSlugExists);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setCheckingUnique(false);
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [catalogueNumber, title, smartLinkSlug, id, user]);

  // Validation rules for Publishing
  const isTitleValid = title.trim().length > 0;
  const isCatNumValid = catalogueNumber.trim().length > 0 && !catNumExists;
  const isPrimaryArtistValid = primaryArtistIds.length > 0;
  const isCoverValid = coverImage.trim().length > 0;
  const isTracksValid =
    tracks.length > 0 && tracks.every((t) => t.title && t.title.trim().length > 0);
  const isReleaseDateValid = releaseDate.length > 0;

  const canPublish =
    isTitleValid &&
    isCatNumValid &&
    isPrimaryArtistValid &&
    isCoverValid &&
    isTracksValid &&
    isReleaseDateValid;

  // Track actions
  const addTrack = () => {
    const nextNum = tracks.length + 1;
    setTracks([
      ...tracks,
      {
        id: `tr-${Date.now()}`,
        trackNumber: nextNum,
        title: '',
        version: 'Original Mix',
        duration: '03:30',
        isrc: '',
        explicit: false,
      },
    ]);
  };

  const updateTrack = (index: number, field: keyof Track, value: any) => {
    const updated = [...tracks];
    updated[index] = { ...updated[index], [field]: value };
    setTracks(updated);
  };

  const removeTrack = (index: number) => {
    const updated = tracks.filter((_, i) => i !== index);
    // Renumber
    const renumbered = updated.map((t, idx) => ({ ...t, trackNumber: idx + 1, number: idx + 1 }));
    setTracks(renumbered);
  };

  const moveTrack = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === tracks.length - 1)) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...tracks];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    // Renumber
    const renumbered = updated.map((t, idx) => ({ ...t, trackNumber: idx + 1, number: idx + 1 }));
    setTracks(renumbered);
  };

  // Credit actions
  const addCredit = () => {
    setCredits([...credits, { role: '', name: '' }]);
  };

  const updateCredit = (index: number, field: 'role' | 'name', value: string) => {
    const updated = [...credits];
    updated[index] = { ...updated[index], [field]: value };
    setCredits(updated);
  };

  const removeCredit = (index: number) => {
    setCredits(credits.filter((_, i) => i !== index));
  };

  // Subgenres actions
  const addSubgenre = () => {
    if (subgenreInput.trim() && !subgenres.includes(subgenreInput.trim())) {
      setSubgenres([...subgenres, subgenreInput.trim()]);
      setSubgenreInput('');
    }
  };

  const removeSubgenre = (tag: string) => {
    setSubgenres(subgenres.filter((s) => s !== tag));
  };

  // Trigger DSP Discovery
  const handleAutoDiscoverDSP = async () => {
    const res = await dspDiscoveryService.discoverLinks({ title, artistName });
    setDspMessage(res.message || 'Automatic DSP discovery is not configured.');
    setTimeout(() => setDspMessage(null), 5000);
  };

  // Save / Publish
  const handleSave = async (targetStatus?: string) => {
    if (saving) return;
    setError(null);
    setSuccessMessage(null);

    const finalStatus = targetStatus || status;

    if (finalStatus === 'PUBLISHED' && !canPublish) {
      const errMsg = 'Cannot publish: Please complete all mandatory metadata requirements in the checklist.';
      setError(errMsg);
      showToast(errMsg, 'error');
      return;
    }

    try {
      setSaving(true);
      showToast(finalStatus === 'PUBLISHED' ? 'Publishing release package...' : 'Saving release draft...', 'info');

      const payload = {
        title,
        catalogueNumber,
        releaseType,
        primaryArtistIds,
        featuredArtistIds,
        artistName: artistName || 'CHENAB Artist',
        coverImage,
        cover: coverImage,
        backCoverImage,
        description,
        genre,
        subgenres,
        genres: Array.from(new Set([genre, ...subgenres])).filter(Boolean),
        releaseDate,
        status: finalStatus,
        explicit,
        copyright,
        publisher,
        label,
        tracks,
        credits,
        dspLinks,
        smartLinkSlug,
      };

      const url = isEditMode && id ? `/api/admin/releases/${id}` : '/api/admin/releases';
      const method = isEditMode && id ? 'PATCH' : 'POST';

      let token = '';
      if (user) {
        token = await user.getIdToken();
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to save release');
      }

      setStatus(finalStatus);
      if (!isEditMode && json.release?.id) {
        setId(json.release.id);
      }

      const msg = `Release successfully ${finalStatus === 'PUBLISHED' ? 'published' : 'saved'}!`;
      setSuccessMessage(msg);
      showToast(msg, 'success');
      setTimeout(() => {
        router.push('/admin/releases');
      }, 1000);
    } catch (err: any) {
      const errMsg = err.message || 'Error occurred while saving release';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCopySmartLink = () => {
    if (smartLinkSlug) {
      const fullUrl = `${window.location.origin}/listen/${smartLinkSlug}`;
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      showToast('Smart Link URL copied to clipboard.', 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner Action Header */}
      <div className="bg-[#0C0C0C] border border-[#1C1C1C] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="px-2.5 py-0.5 bg-[#181818] border border-[#333333] text-[#F5F5F5] font-bold uppercase">
              {catalogueNumber || 'CHNB-000'}
            </span>
            <span
              className={`px-2.5 py-0.5 border font-bold uppercase text-[10px] ${
                status === 'PUBLISHED'
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'
                  : status === 'SCHEDULED'
                  ? 'bg-amber-950/40 text-amber-400 border-amber-900/50'
                  : status === 'UNPUBLISHED'
                  ? 'bg-purple-950/40 text-purple-400 border-purple-900/50'
                  : status === 'ARCHIVED'
                  ? 'bg-red-950/40 text-red-400 border-red-900/50'
                  : 'bg-[#181818] text-[#888888] border-[#2A2A2A]'
              }`}
            >
              [{status}]
            </span>
            <span className="text-[#666666]">&bull;</span>
            <span className="text-[#888888] uppercase">{releaseType}</span>
          </div>

          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#F5F5F5] uppercase tracking-tight">
            {title || 'UNTITLED RELEASE'}
          </h1>
          <p className="font-mono text-xs text-[#888888]">
            {artistName ? `Artist: ${artistName}` : 'Select Primary Artist to set credit'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          {isEditMode && smartLinkSlug && (
            <Link
              href={`/listen/${smartLinkSlug}`}
              target="_blank"
              className="px-3 py-2 bg-[#141414] border border-[#222222] hover:border-[#444444] text-[#CCCCCC] flex items-center gap-1.5 transition-colors"
            >
              <Eye size={13} />
              <span>SMART LINK</span>
              <ExternalLink size={11} className="text-[#666666]" />
            </Link>
          )}

          <button
            onClick={() => handleSave('DRAFT')}
            disabled={saving}
            aria-busy={saving}
            className="px-4 py-2 bg-[#181818] border border-[#2D2D2D] hover:border-[#555555] text-[#F5F5F5] font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin text-[#F5F5F5]" />
            ) : (
              <Save size={14} />
            )}
            <span>{saving ? 'SAVING...' : 'SAVE DRAFT'}</span>
          </button>

          <button
            onClick={() => handleSave('PUBLISHED')}
            disabled={saving || (!canPublish && status !== 'PUBLISHED')}
            aria-busy={saving}
            className={`px-5 py-2 font-bold flex items-center gap-2 uppercase tracking-wider transition-all shadow-lg ${
              canPublish || status === 'PUBLISHED'
                ? 'bg-[#F5F5F5] text-[#080808] hover:bg-white cursor-pointer'
                : 'bg-[#222222] text-[#555555] cursor-not-allowed border border-[#2E2E2E]'
            }`}
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin text-[#080808]" />
            ) : (
              <Send size={14} />
            )}
            <span>
              {saving
                ? 'PROCESSING...'
                : status === 'PUBLISHED'
                ? 'UPDATE PUBLISHED'
                : 'PUBLISH RELEASE'}
            </span>
          </button>

          {status === 'PUBLISHED' && (
            <button
              onClick={() => handleSave('UNPUBLISHED')}
              disabled={saving}
              aria-busy={saving}
              className="px-3 py-2 bg-purple-950/20 border border-purple-900/40 text-purple-300 font-mono text-[11px] hover:bg-purple-900/30 flex items-center gap-1.5"
            >
              {saving && <Loader2 size={12} className="animate-spin" />}
              <span>UNPUBLISH</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-950/30 border border-red-900/50 p-4 font-mono text-xs text-red-400 flex items-center gap-3">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-950/30 border border-emerald-900/50 p-4 font-mono text-xs text-emerald-400 flex items-center gap-3">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Live Publication Criteria Checklist Panel */}
      <div className="bg-[#090909] border border-[#1A1A1A] p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-[#181818] pb-3">
          <div className="flex items-center gap-2 font-mono text-xs text-[#F5F5F5] font-bold uppercase tracking-wider">
            <CheckCircle2 size={14} className={canPublish ? 'text-emerald-400' : 'text-amber-400'} />
            <span>RELEASE PUBLICATION CHECKLIST</span>
          </div>
          <span
            className={`font-mono text-[11px] font-bold uppercase ${
              canPublish ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {canPublish ? 'READY FOR PUBLISHING' : 'INCOMPLETE REQUIREMENTS'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
          <div
            className={`p-2.5 border ${
              isTitleValid
                ? 'border-emerald-900/40 bg-emerald-950/10 text-emerald-400'
                : 'border-[#222222] bg-[#111111] text-[#666666]'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase">
              {isTitleValid ? <Check size={12} /> : <AlertCircle size={12} />}
              <span>TITLE</span>
            </div>
            <p className="text-[10px] text-[#777777] mt-0.5 truncate">
              {title || 'Missing title'}
            </p>
          </div>

          <div
            className={`p-2.5 border ${
              isCatNumValid
                ? 'border-emerald-900/40 bg-emerald-950/10 text-emerald-400'
                : 'border-red-900/40 bg-red-950/10 text-red-400'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase">
              {isCatNumValid ? <Check size={12} /> : <AlertCircle size={12} />}
              <span>CAT #</span>
            </div>
            <p className="text-[10px] text-[#777777] mt-0.5 truncate">
              {catNumExists ? 'DUPLICATE CAT #' : catalogueNumber || 'Missing Cat #'}
            </p>
          </div>

          <div
            className={`p-2.5 border ${
              isPrimaryArtistValid
                ? 'border-emerald-900/40 bg-emerald-950/10 text-emerald-400'
                : 'border-[#222222] bg-[#111111] text-[#666666]'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase">
              {isPrimaryArtistValid ? <Check size={12} /> : <AlertCircle size={12} />}
              <span>PRIMARY ARTIST</span>
            </div>
            <p className="text-[10px] text-[#777777] mt-0.5 truncate">
              {primaryArtistIds.length} Selected
            </p>
          </div>

          <div
            className={`p-2.5 border ${
              isCoverValid
                ? 'border-emerald-900/40 bg-emerald-950/10 text-emerald-400'
                : 'border-[#222222] bg-[#111111] text-[#666666]'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase">
              {isCoverValid ? <Check size={12} /> : <AlertCircle size={12} />}
              <span>COVER ARTWORK</span>
            </div>
            <p className="text-[10px] text-[#777777] mt-0.5 truncate">
              {isCoverValid ? 'Attached' : 'Missing Image'}
            </p>
          </div>

          <div
            className={`p-2.5 border ${
              isTracksValid
                ? 'border-emerald-900/40 bg-emerald-950/10 text-emerald-400'
                : 'border-[#222222] bg-[#111111] text-[#666666]'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase">
              {isTracksValid ? <Check size={12} /> : <AlertCircle size={12} />}
              <span>TRACKLIST</span>
            </div>
            <p className="text-[10px] text-[#777777] mt-0.5 truncate">
              {tracks.length} Tracks
            </p>
          </div>

          <div
            className={`p-2.5 border ${
              isReleaseDateValid
                ? 'border-emerald-900/40 bg-emerald-950/10 text-emerald-400'
                : 'border-[#222222] bg-[#111111] text-[#666666]'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase">
              {isReleaseDateValid ? <Check size={12} /> : <AlertCircle size={12} />}
              <span>RELEASE DATE</span>
            </div>
            <p className="text-[10px] text-[#777777] mt-0.5 truncate">
              {releaseDate || 'Missing Date'}
            </p>
          </div>
        </div>
      </div>

      {/* Editor Section Navigation Tabs */}
      <div className="flex flex-wrap items-center border-b border-[#1C1C1C] font-mono text-xs">
        {[
          { key: 'basic', label: '1. BASIC METADATA' },
          { key: 'artwork', label: '2. ARTWORK & MEDIA' },
          { key: 'tracks', label: `3. TRACKLIST (${tracks.length})` },
          { key: 'credits', label: `4. CREDITS (${credits.length})` },
          { key: 'dsp', label: '5. DSP LINKS & SMART LINK' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-5 py-3 border-b-2 font-bold tracking-wider transition-all uppercase ${
              activeTab === tab.key
                ? 'border-emerald-400 text-[#F5F5F5] bg-[#111111]'
                : 'border-transparent text-[#777777] hover:text-[#CCCCCC] hover:bg-[#0A0A0A]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: BASIC METADATA */}
      {activeTab === 'basic' && (
        <div className="bg-[#0C0C0C] border border-[#1C1C1C] p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block font-mono text-xs text-[#888888] uppercase">
                Release Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Echoes Over Zanskar"
                className="w-full bg-[#121212] border border-[#222222] px-4 py-2.5 font-sans text-sm text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-xs text-[#888888] uppercase">
                Catalogue Number <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={catalogueNumber}
                  onChange={(e) => setCatalogueNumber(e.target.value.toUpperCase())}
                  placeholder="CHNB-001"
                  className={`w-full bg-[#121212] border px-4 py-2.5 font-mono text-sm text-[#F5F5F5] uppercase focus:outline-none ${
                    catNumExists ? 'border-red-500' : 'border-[#222222] focus:border-[#555555]'
                  }`}
                />
                {catNumExists && (
                  <p className="font-mono text-[11px] text-red-400 mt-1">
                    Catalogue number already exists in Firestore!
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-xs text-[#888888] uppercase">
                Release Type <span className="text-red-400">*</span>
              </label>
              <select
                value={releaseType}
                onChange={(e) => setReleaseType(e.target.value as ReleaseType)}
                className="w-full bg-[#121212] border border-[#222222] px-4 py-2.5 font-mono text-xs text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
              >
                <option value="SINGLE">SINGLE</option>
                <option value="EP">EP</option>
                <option value="ALBUM">ALBUM</option>
                <option value="COMPILATION">COMPILATION</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-xs text-[#888888] uppercase">
                Official Release Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="w-full bg-[#121212] border border-[#222222] px-4 py-2.5 font-mono text-xs text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block font-mono text-xs text-[#888888] uppercase">
                Primary Roster Artist(s) <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-[#222222] bg-[#121212] p-3 max-h-48 overflow-y-auto">
                {artists.length === 0 ? (
                  <p className="font-mono text-xs text-[#666666] col-span-full">
                    Loading roster artists...
                  </p>
                ) : (
                  artists.map((a) => {
                    const isSelected = primaryArtistIds.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setPrimaryArtistIds(primaryArtistIds.filter((p) => p !== a.id));
                          } else {
                            setPrimaryArtistIds([...primaryArtistIds, a.id]);
                          }
                        }}
                        className={`p-2 border font-mono text-xs text-left truncate transition-colors ${
                          isSelected
                            ? 'bg-[#222222] text-white border-emerald-500 font-bold'
                            : 'bg-[#181818] text-[#888888] border-[#2A2A2A] hover:text-[#CCCCCC]'
                        }`}
                      >
                        {a.stageName || a.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block font-mono text-xs text-[#888888] uppercase">
                Primary Artist Display Line
              </label>
              <input
                type="text"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                placeholder="e.g. Kashmir Soundscape & Guest"
                className="w-full bg-[#121212] border border-[#222222] px-4 py-2.5 font-sans text-sm text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-xs text-[#888888] uppercase">
                Primary Genre
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g. Ambient, Folk, Electronic"
                className="w-full bg-[#121212] border border-[#222222] px-4 py-2.5 font-mono text-xs text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-xs text-[#888888] uppercase">
                Subgenres / Tags
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={subgenreInput}
                  onChange={(e) => setSubgenreInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubgenre())}
                  placeholder="Add tag and press Enter"
                  className="flex-1 bg-[#121212] border border-[#222222] px-4 py-2 font-mono text-xs text-[#F5F5F5] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addSubgenre}
                  className="px-3 py-2 bg-[#1A1A1A] border border-[#333333] text-[#F5F5F5] font-mono text-xs"
                >
                  ADD
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {subgenres.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-1 bg-[#181818] border border-[#2B2B2B] text-[#CCCCCC] font-mono text-[10px] flex items-center gap-1 uppercase"
                  >
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => removeSubgenre(s)}
                      className="text-[#666666] hover:text-red-400"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block font-mono text-xs text-[#888888] uppercase">
                Editorial Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write release synopsis, curatorial notes, recording history..."
                className="w-full bg-[#121212] border border-[#222222] p-4 font-sans text-sm text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-xs text-[#888888] uppercase">
                Copyright Line
              </label>
              <input
                type="text"
                value={copyright}
                onChange={(e) => setCopyright(e.target.value)}
                className="w-full bg-[#121212] border border-[#222222] px-4 py-2.5 font-mono text-xs text-[#F5F5F5]"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-xs text-[#888888] uppercase">
                Publisher
              </label>
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                className="w-full bg-[#121212] border border-[#222222] px-4 py-2.5 font-mono text-xs text-[#F5F5F5]"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ARTWORK & MEDIA */}
      {activeTab === 'artwork' && (
        <div className="bg-[#0C0C0C] border border-[#1C1C1C] p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Front Cover */}
            <div className="space-y-4">
              <label className="block font-mono text-xs text-[#888888] uppercase">
                Front Cover Artwork URL / Image Path <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://... or /images/releases/..."
                className="w-full bg-[#121212] border border-[#222222] px-4 py-2.5 font-mono text-xs text-[#F5F5F5] focus:outline-none"
              />

              <div className="aspect-square bg-[#121212] border border-[#222222] overflow-hidden flex items-center justify-center relative group">
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as any).src = 'https://picsum.photos/seed/chenabcover/600/600';
                    }}
                  />
                ) : (
                  <div className="text-center p-6 space-y-2 text-[#555555]">
                    <Upload size={32} className="mx-auto" />
                    <p className="font-mono text-xs uppercase">NO COVER ARTWORK ATTACHED</p>
                    <p className="font-sans text-xs text-[#444444]">
                      Minimum 3000x3000px 1:1 square JPEG/PNG required for DSP distribution.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Back Cover */}
            <div className="space-y-4">
              <label className="block font-mono text-xs text-[#888888] uppercase">
                Back Cover / Packaging Artwork URL (Optional)
              </label>
              <input
                type="text"
                value={backCoverImage}
                onChange={(e) => setBackCoverImage(e.target.value)}
                placeholder="https://... or /images/releases/..."
                className="w-full bg-[#121212] border border-[#222222] px-4 py-2.5 font-mono text-xs text-[#F5F5F5] focus:outline-none"
              />

              <div className="aspect-square bg-[#121212] border border-[#222222] overflow-hidden flex items-center justify-center relative group">
                {backCoverImage ? (
                  <img
                    src={backCoverImage}
                    alt="Back cover preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2 text-[#555555]">
                    <Upload size={32} className="mx-auto" />
                    <p className="font-mono text-xs uppercase">NO BACK COVER ATTACHED</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRACKLIST */}
      {activeTab === 'tracks' && (
        <div className="bg-[#0C0C0C] border border-[#1C1C1C] p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#181818] pb-4">
            <div>
              <h3 className="font-mono text-xs font-bold text-[#F5F5F5] uppercase">
                RELEASE TRACKLIST MANAGER
              </h3>
              <p className="font-sans text-xs text-[#777777]">
                Manage track order, titles, versions, ISRCs, audio previews, and explicit flags.
              </p>
            </div>
            <button
              type="button"
              onClick={addTrack}
              className="px-4 py-2 bg-[#F5F5F5] text-[#080808] font-mono text-xs font-bold uppercase flex items-center gap-1.5 hover:bg-white"
            >
              <Plus size={14} />
              <span>ADD TRACK</span>
            </button>
          </div>

          <div className="space-y-4">
            {tracks.map((track, idx) => (
              <div
                key={track.id}
                className="bg-[#121212] border border-[#222222] p-4 space-y-4 hover:border-[#333333] transition-colors"
              >
                <div className="flex items-center justify-between font-mono text-xs text-[#888888] border-b border-[#1A1A1A] pb-3">
                  <div className="flex items-center gap-3 font-bold text-[#F5F5F5]">
                    <span className="w-6 h-6 rounded bg-[#222222] flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    <span>TRACK #{idx + 1}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveTrack(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 border border-[#222222] text-[#888888] hover:text-white disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTrack(idx, 'down')}
                      disabled={idx === tracks.length - 1}
                      className="p-1 border border-[#222222] text-[#888888] hover:text-white disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTrack(idx)}
                      className="p-1 border border-red-900/40 text-red-400 hover:bg-red-950/30 ml-2"
                      title="Remove Track"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block font-mono text-[10px] text-[#777777] uppercase">
                      Track Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={track.title}
                      onChange={(e) => updateTrack(idx, 'title', e.target.value)}
                      placeholder="e.g. Zanskar Sunrise"
                      className="w-full bg-[#181818] border border-[#282828] px-3 py-2 font-sans text-sm text-[#F5F5F5] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-mono text-[10px] text-[#777777] uppercase">
                      Version / Mix
                    </label>
                    <input
                      type="text"
                      value={track.version || ''}
                      onChange={(e) => updateTrack(idx, 'version', e.target.value)}
                      placeholder="e.g. Original Mix"
                      className="w-full bg-[#181818] border border-[#282828] px-3 py-2 font-mono text-xs text-[#F5F5F5] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-mono text-[10px] text-[#777777] uppercase">
                      Duration (mm:ss)
                    </label>
                    <input
                      type="text"
                      value={track.duration}
                      onChange={(e) => updateTrack(idx, 'duration', e.target.value)}
                      placeholder="03:45"
                      className="w-full bg-[#181818] border border-[#282828] px-3 py-2 font-mono text-xs text-[#F5F5F5] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="block font-mono text-[10px] text-[#777777] uppercase">
                      ISRC Code
                    </label>
                    <input
                      type="text"
                      value={track.isrc || ''}
                      onChange={(e) => updateTrack(idx, 'isrc', e.target.value.toUpperCase())}
                      placeholder="IN-CHN-26-00001"
                      className="w-full bg-[#181818] border border-[#282828] px-3 py-2 font-mono text-xs text-[#F5F5F5] uppercase focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="block font-mono text-[10px] text-[#777777] uppercase">
                      Audio Preview URL (MP3/Lossless)
                    </label>
                    <input
                      type="text"
                      value={track.audioPreviewUrl || track.audioUrl || ''}
                      onChange={(e) => updateTrack(idx, 'audioPreviewUrl', e.target.value)}
                      placeholder="https://... audio file link"
                      className="w-full bg-[#181818] border border-[#282828] px-3 py-2 font-mono text-xs text-[#F5F5F5] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CREDITS & PRODUCTION */}
      {activeTab === 'credits' && (
        <div className="bg-[#0C0C0C] border border-[#1C1C1C] p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#181818] pb-4">
            <div>
              <h3 className="font-mono text-xs font-bold text-[#F5F5F5] uppercase">
                RELEASE CREDITS & LINER NOTES
              </h3>
              <p className="font-sans text-xs text-[#777777]">
                Record liner notes, producers, engineers, vocalists, and instrumental contributors.
              </p>
            </div>
            <button
              type="button"
              onClick={addCredit}
              className="px-4 py-2 bg-[#F5F5F5] text-[#080808] font-mono text-xs font-bold uppercase flex items-center gap-1.5 hover:bg-white"
            >
              <Plus size={14} />
              <span>ADD CREDIT</span>
            </button>
          </div>

          <div className="space-y-3">
            {credits.map((cred, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="text"
                  value={cred.role}
                  onChange={(e) => updateCredit(idx, 'role', e.target.value)}
                  placeholder="Role (e.g. Mastered By)"
                  className="w-1/3 bg-[#121212] border border-[#222222] px-4 py-2 font-mono text-xs text-[#F5F5F5] focus:outline-none"
                />
                <input
                  type="text"
                  value={cred.name}
                  onChange={(e) => updateCredit(idx, 'name', e.target.value)}
                  placeholder="Name (e.g. John Doe)"
                  className="flex-1 bg-[#121212] border border-[#222222] px-4 py-2 font-sans text-sm text-[#F5F5F5] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeCredit(idx)}
                  className="p-2 border border-red-900/40 text-red-400 hover:bg-red-950/30"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: DSP LINKS & SMART LINK */}
      {activeTab === 'dsp' && (
        <div className="bg-[#0C0C0C] border border-[#1C1C1C] p-6 space-y-8">
          {/* Automatic DSP Discovery Bar */}
          <div className="bg-[#111111] border border-[#222222] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-mono text-xs text-[#F5F5F5] font-bold uppercase">
                <Sparkles size={14} className="text-amber-400" />
                <span>AUTOMATED DSP LINK DISCOVERY ENGINE</span>
              </div>
              <p className="font-sans text-xs text-[#888888]">
                Attempts automatic API resolution across global streaming services by ISRC or Title.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAutoDiscoverDSP}
              className="px-4 py-2 bg-[#1F1F1F] border border-[#333333] hover:border-[#666666] text-[#F5F5F5] font-mono text-xs uppercase flex items-center gap-2 shrink-0"
            >
              <Sparkles size={12} className="text-amber-400" />
              <span>RUN AUTOMATED DISCOVERY</span>
            </button>
          </div>

          {dspMessage && (
            <div className="bg-amber-950/20 border border-amber-900/40 p-3 font-mono text-xs text-amber-300 flex items-center gap-2">
              <Info size={14} />
              <span>{dspMessage}</span>
            </div>
          )}

          {/* Smart Link Landing Customizer */}
          <div className="border-t border-[#1C1C1C] pt-6 space-y-4">
            <h3 className="font-mono text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">
              SMART LINK SLUG & LANDING PAGE
            </h3>

            <div className="space-y-2">
              <label className="block font-mono text-xs text-[#888888] uppercase">
                Smart Link Custom Slug (/listen/[slug])
              </label>
              <div className="flex items-center gap-2">
                <div className="px-3 py-2 bg-[#181818] border border-[#2A2A2A] font-mono text-xs text-[#777777]">
                  /listen/
                </div>
                <input
                  type="text"
                  value={smartLinkSlug}
                  onChange={(e) =>
                    setSmartLinkSlug(
                      e.target.value
                        .toLowerCase()
                        .trim()
                        .replace(/[^\w\s-]/g, '')
                        .replace(/[\s_-]+/g, '-')
                    )
                  }
                  placeholder="custom-release-slug"
                  className="flex-1 bg-[#121212] border border-[#222222] px-4 py-2 font-mono text-xs text-[#F5F5F5] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopySmartLink}
                  className="px-3 py-2 bg-[#181818] border border-[#2D2D2D] text-[#CCCCCC] font-mono text-xs flex items-center gap-1.5"
                >
                  {copiedLink ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedLink ? 'COPIED' : 'COPY LINK'}</span>
                </button>
              </div>

              {smartLinkExists && (
                <p className="font-mono text-[11px] text-red-400">
                  Smart Link slug "/listen/{smartLinkSlug}" is already taken by another release!
                </p>
              )}
            </div>
          </div>

          {/* DSP URLs Inputs */}
          <div className="space-y-4 border-t border-[#1C1C1C] pt-6">
            <h3 className="font-mono text-xs font-bold text-[#F5F5F5] uppercase">
              DSP STREAMING PLATFORM URLS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {[
                { key: 'spotify', label: 'Spotify' },
                { key: 'appleMusic', label: 'Apple Music' },
                { key: 'youtubeMusic', label: 'YouTube Music' },
                { key: 'youtube', label: 'YouTube Video' },
                { key: 'amazonMusic', label: 'Amazon Music' },
                { key: 'deezer', label: 'Deezer' },
                { key: 'soundcloud', label: 'SoundCloud' },
                { key: 'tidal', label: 'Tidal' },
                { key: 'bandcamp', label: 'Bandcamp' },
                { key: 'other', label: 'Official Store / Other' },
              ].map((platform) => (
                <div key={platform.key} className="space-y-1">
                  <label className="block text-[#888888] uppercase">{platform.label}</label>
                  <input
                    type="text"
                    value={(dspLinks as any)[platform.key] || ''}
                    onChange={(e) =>
                      setDspLinks({ ...dspLinks, [platform.key]: e.target.value })
                    }
                    placeholder={`https://${platform.key}.com/...`}
                    className="w-full bg-[#121212] border border-[#222222] px-3 py-2 text-[#F5F5F5] focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
