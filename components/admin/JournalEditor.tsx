'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { JournalPost, JournalCategory, JournalStatus } from '@/types';
import { slugify } from '@/lib/utils';
import {
  Save,
  Eye,
  Trash2,
  ArrowLeft,
  Check,
  AlertCircle,
  Clock,
  Calendar,
  User,
  Tag,
  ImageIcon,
  Sparkles,
  BookOpen,
  ExternalLink,
  Lock,
  Unlock,
  Layers,
  FileText,
} from 'lucide-react';

const CATEGORIES: JournalCategory[] = [
  'FIELD NOTES',
  'EDITORIAL',
  'INTERVIEW',
  'ANNOUNCEMENT',
  'STUDIO LOG',
];

const PRESET_COVERS = [
  { label: 'Mountain Ridge (High Altitude)', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Analogue Studio / Synths', url: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Acoustic Architecture', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Vinyl / Pressing Artifacts', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Kashmir Misty Valley', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80' },
];

interface JournalEditorProps {
  initialPost?: JournalPost | null;
  isEditMode?: boolean;
}

export function JournalEditor({ initialPost, isEditMode = false }: JournalEditorProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [id, setId] = useState<string>(initialPost?.id || '');
  const [title, setTitle] = useState<string>(initialPost?.title || '');
  const [slug, setSlug] = useState<string>(initialPost?.slug || '');
  const [isSlugCustom, setIsSlugCustom] = useState<boolean>(Boolean(initialPost?.slug));
  const [category, setCategory] = useState<JournalCategory>(initialPost?.category || 'FIELD NOTES');
  const [status, setStatus] = useState<JournalStatus>(initialPost?.status || 'PUBLISHED');
  const [author, setAuthor] = useState<string>(initialPost?.author || 'A&R Editorial Team');
  const [date, setDate] = useState<string>(
    initialPost?.date || initialPost?.publishedAt || new Date().toISOString().split('T')[0]
  );
  const [coverUrl, setCoverUrl] = useState<string>(
    initialPost?.coverUrl || initialPost?.image || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80'
  );
  const [shortExcerpt, setShortExcerpt] = useState<string>(
    initialPost?.shortExcerpt || initialPost?.excerpt || ''
  );
  
  // Content as raw string (paragraphs separated by double newlines)
  const [rawContent, setRawContent] = useState<string>(() => {
    if (initialPost?.rawContent) return initialPost.rawContent;
    if (Array.isArray(initialPost?.content)) return initialPost.content.join('\n\n');
    return '';
  });

  const [readTime, setReadTime] = useState<string>(initialPost?.readTime || '6 min read');
  const [tags, setTags] = useState<string[]>(
    initialPost?.tags || ['Field Recording', 'Acoustics', 'Sound Architecture']
  );
  const [tagInput, setTagInput] = useState<string>('');
  const [featured, setFeatured] = useState<boolean>(initialPost?.featured || false);

  const [activeTab, setActiveTab] = useState<'content' | 'preview' | 'meta'>('content');
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug when title changes (unless unlocked/customized)
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!isSlugCustom) {
      setSlug(slugify(val));
    }
  };

  // Calculate estimated reading time automatically from content
  const calculateReadingTime = (text: string) => {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 180));
    return `${minutes} min read`;
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawContent(val);
    if (val) {
      setReadTime(calculateReadingTime(val));
    }
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    const clean = tagInput.trim().replace(/^#/, '');
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async (targetStatus?: JournalStatus) => {
    const finalStatus = targetStatus || status;
    setError(null);

    if (!title.trim()) {
      setError('Article title is mandatory.');
      showToast('Article title is mandatory.', 'error');
      return;
    }

    const finalSlug = slugify(slug || title);
    if (!finalSlug) {
      setError('A valid slug is required.');
      showToast('A valid slug is required.', 'error');
      return;
    }

    try {
      setSaving(true);
      showToast(finalStatus === 'PUBLISHED' ? 'Publishing journal entry...' : 'Saving draft...', 'info');

      let token = '';
      if (user) {
        token = await user.getIdToken();
      }

      const contentParagraphs = rawContent
        .split('\n\n')
        .map((p) => p.trim())
        .filter(Boolean);

      const payload = {
        title: title.trim(),
        slug: finalSlug,
        category,
        status: finalStatus,
        author: author.trim(),
        date,
        publishedAt: date,
        coverUrl,
        image: coverUrl,
        shortExcerpt: shortExcerpt.trim(),
        excerpt: shortExcerpt.trim(),
        content: contentParagraphs,
        readTime,
        tags,
        featured,
      };

      const url = isEditMode && id ? `/api/admin/journal/${id}` : '/api/admin/journal';
      const method = isEditMode && id ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save journal entry');
      }

      setStatus(finalStatus);
      if (!isEditMode && data.id) {
        setId(data.id);
      }

      const msg = `Journal entry successfully ${finalStatus === 'PUBLISHED' ? 'published' : 'saved'}!`;
      showToast(msg, 'success');
      setTimeout(() => {
        router.push('/admin/journal');
      }, 1000);
    } catch (err: any) {
      const errMsg = err.message || 'Error occurred while saving journal entry';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;

    try {
      setDeleting(true);
      let token = '';
      if (user) {
        token = await user.getIdToken();
      }

      const res = await fetch(`/api/admin/journal/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete journal entry');
      }

      showToast(`Entry "${title}" deleted.`, 'info');
      router.push('/admin/journal');
    } catch (err: any) {
      showToast(err.message || 'Error deleting journal entry', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const paragraphs = rawContent.split('\n\n').filter(Boolean);
  const wordCount = rawContent.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-8 font-mono text-xs">
      {/* Top Banner Action Header */}
      <div className="bg-[#0C0C0C] border border-[#1C1C1C] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-2.5 py-0.5 bg-[#181818] border border-[#333333] text-[#F5F5F5] font-bold uppercase">
              {category}
            </span>
            <span
              className={`px-2.5 py-0.5 border font-bold uppercase text-[10px] ${
                status === 'PUBLISHED'
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'
                  : status === 'DRAFT'
                  ? 'bg-amber-950/40 text-amber-400 border-amber-900/50'
                  : 'bg-red-950/40 text-red-400 border-red-900/50'
              }`}
            >
              {status}
            </span>
            {featured && (
              <span className="px-2 py-0.5 bg-purple-950/40 text-purple-300 border border-purple-800/50 font-bold uppercase text-[10px] flex items-center gap-1">
                <Sparkles size={10} />
                <span>FEATURED ON HOMEPAGE</span>
              </span>
            )}
          </div>
          <h2 className="font-display font-black text-xl sm:text-2xl text-[#F5F5F5] uppercase tracking-wide truncate max-w-2xl mt-1">
            {title || 'UNTITLED JOURNAL ENTRY'}
          </h2>
          <div className="text-[11px] text-[#777777] flex items-center gap-2">
            <span>/journal/{slug || '...'}</span>
            <span>&bull;</span>
            <span>{readTime}</span>
            <span>&bull;</span>
            <span>{wordCount} words</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {slug && (
            <Link
              href={`/journal/${slug}`}
              target="_blank"
              className="px-3.5 py-2.5 bg-[#141414] hover:bg-[#1C1C1C] border border-[#2B2B2B] text-[#CCCCCC] hover:text-white uppercase flex items-center gap-2 transition-colors min-h-[44px]"
            >
              <Eye size={14} />
              <span>PREVIEW LIVE</span>
            </Link>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('DRAFT')}
            className="px-4 py-2.5 bg-[#141414] hover:bg-[#1E1E1E] border border-[#333333] text-[#F5F5F5] font-bold uppercase flex items-center gap-2 transition-colors min-h-[44px]"
          >
            <Save size={14} />
            <span>SAVE DRAFT</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('PUBLISHED')}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-colors min-h-[44px]"
          >
            <Check size={14} />
            <span>{status === 'PUBLISHED' ? 'UPDATE PUBLISHED' : 'PUBLISH ENTRY'}</span>
          </button>

          {isEditMode && id && (
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="px-3 py-2.5 bg-red-950/30 hover:bg-red-900/50 border border-red-900/50 text-red-400 uppercase flex items-center gap-1.5 transition-colors min-h-[44px]"
              title="Delete Article"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/30 border border-red-900/50 text-red-400 flex items-center gap-3">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Editor Tabs Navigation */}
      <div className="flex border-b border-[#222222] gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`px-4 py-3 border-b-2 font-bold uppercase flex items-center gap-2 transition-colors min-h-[44px] ${
            activeTab === 'content'
              ? 'border-[#F5F5F5] text-[#F5F5F5] bg-[#121212]'
              : 'border-transparent text-[#777777] hover:text-[#CCCCCC]'
          }`}
        >
          <FileText size={14} />
          <span>ARTICLE CONTENT & DRAFTING</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('meta')}
          className={`px-4 py-3 border-b-2 font-bold uppercase flex items-center gap-2 transition-colors min-h-[44px] ${
            activeTab === 'meta'
              ? 'border-[#F5F5F5] text-[#F5F5F5] bg-[#121212]'
              : 'border-transparent text-[#777777] hover:text-[#CCCCCC]'
          }`}
        >
          <Layers size={14} />
          <span>METADATA & ARTWORK</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-3 border-b-2 font-bold uppercase flex items-center gap-2 transition-colors min-h-[44px] ${
            activeTab === 'preview'
              ? 'border-[#F5F5F5] text-[#F5F5F5] bg-[#121212]'
              : 'border-transparent text-[#777777] hover:text-[#CCCCCC]'
          }`}
        >
          <Eye size={14} />
          <span>LIVE PREVIEW</span>
        </button>
      </div>

      {/* TAB 1: ARTICLE CONTENT & CORE FIELDS */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Primary Meta Grid */}
          <div className="bg-[#0C0C0C] border border-[#1C1C1C] p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Title */}
            <div className="md:col-span-8 space-y-2">
              <label className="block text-[#888888] uppercase font-bold">
                Article Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g. The Sonic Geography of Pir Panjal: Field Recording in High Altitude"
                className="w-full bg-[#121212] border border-[#222222] px-4 py-3 font-sans text-base text-[#F5F5F5] focus:outline-none focus:border-[#666666]"
              />
            </div>

            {/* Category */}
            <div className="md:col-span-4 space-y-2">
              <label className="block text-[#888888] uppercase font-bold">
                Editorial Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as JournalCategory)}
                className="w-full bg-[#121212] border border-[#222222] px-4 py-3 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#666666] uppercase"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Slug */}
            <div className="md:col-span-6 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[#888888] uppercase font-bold">
                  URL Slug (/journal/[slug]) *
                </label>
                <button
                  type="button"
                  onClick={() => setIsSlugCustom(!isSlugCustom)}
                  className="text-[10px] text-[#666666] hover:text-[#AAAAAA] flex items-center gap-1 uppercase"
                >
                  {isSlugCustom ? <Lock size={11} /> : <Unlock size={11} />}
                  <span>{isSlugCustom ? 'Custom Slug Locked' : 'Auto-generating'}</span>
                </button>
              </div>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(slugify(e.target.value));
                  setIsSlugCustom(true);
                }}
                placeholder="sonic-geography-of-pir-panjal"
                className="w-full bg-[#121212] border border-[#222222] px-4 py-2.5 font-mono text-xs text-[#F5F5F5] focus:outline-none focus:border-[#666666]"
              />
            </div>

            {/* Status & Featured */}
            <div className="md:col-span-6 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[#888888] uppercase font-bold">
                  Publication Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as JournalStatus)}
                  className="w-full bg-[#121212] border border-[#222222] px-4 py-2.5 text-xs text-[#F5F5F5] focus:outline-none uppercase"
                >
                  <option value="PUBLISHED">PUBLISHED (Live on site)</option>
                  <option value="DRAFT">DRAFT (Admin only)</option>
                  <option value="ARCHIVED">ARCHIVED (Hidden)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[#888888] uppercase font-bold">
                  Homepage Feature
                </label>
                <label className="flex items-center gap-2 h-[38px] px-3 bg-[#121212] border border-[#222222] cursor-pointer hover:border-[#333333]">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="accent-emerald-500 w-4 h-4"
                  />
                  <span className="text-[11px] text-[#CCCCCC]">Feature on Home</span>
                </label>
              </div>
            </div>

            {/* Excerpt */}
            <div className="md:col-span-12 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[#888888] uppercase font-bold">
                  Lead Excerpt / Synopsis (Shown on cards & article header)
                </label>
                <span className="text-[10px] text-[#666666]">
                  {shortExcerpt.length} characters
                </span>
              </div>
              <textarea
                rows={3}
                value={shortExcerpt}
                onChange={(e) => setShortExcerpt(e.target.value)}
                placeholder="An in-depth expedition diary detailing how sub-zero wind currents and acoustic mountain passes shape CHENAB MEDIA’s sound palette..."
                className="w-full bg-[#121212] border border-[#222222] p-4 font-serif italic text-sm text-[#F5F5F5] focus:outline-none focus:border-[#666666]"
              />
            </div>
          </div>

          {/* Body Content Editor */}
          <div className="bg-[#0C0C0C] border border-[#1C1C1C] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#181818] pb-3">
              <div>
                <h3 className="font-bold text-[#F5F5F5] uppercase">
                  ARTICLE BODY TEXT
                </h3>
                <p className="font-sans text-xs text-[#777777]">
                  Separate paragraphs by double returns (blank lines). Quotes, interviews, and field notes format automatically.
                </p>
              </div>
              <div className="text-[11px] text-[#777777]">
                {paragraphs.length} Paragraphs &bull; {wordCount} Words &bull; {readTime}
              </div>
            </div>

            <textarea
              rows={14}
              value={rawContent}
              onChange={handleContentChange}
              placeholder="Standing at an elevation of 3,800 meters in the Pir Panjal range, sound behaves differently. The air density alters acoustic velocity, and natural stone concavities form natural resonant chambers.

During our autumn field expedition with artist Zabarwan, our objective was clear: record raw wind friction against basalt cliff faces and capture hydrophone impulses from glacial streams.

These high-altitude field tapes serve as the structural backbone for catalogue releases..."
              className="w-full bg-[#121212] border border-[#222222] p-5 font-sans text-sm sm:text-base text-[#E0E0E0] leading-relaxed focus:outline-none focus:border-[#666666]"
            />
          </div>
        </div>
      )}

      {/* TAB 2: METADATA & ARTWORK */}
      {activeTab === 'meta' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Author, Date, Read Time, Tags */}
          <div className="lg:col-span-6 bg-[#0C0C0C] border border-[#1C1C1C] p-6 space-y-6">
            <h3 className="font-bold text-[#F5F5F5] uppercase border-b border-[#181818] pb-3">
              AUTHORSHIP & SCHEDULING
            </h3>

            <div className="space-y-2">
              <label className="block text-[#888888] uppercase font-bold">
                Author Byline
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="A&R Editorial Team, Noor Ali, Farooq Wani..."
                className="w-full bg-[#121212] border border-[#222222] px-4 py-2.5 font-sans text-xs text-[#F5F5F5] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[#888888] uppercase font-bold">
                  Publication Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#121212] border border-[#222222] px-4 py-2.5 font-mono text-xs text-[#F5F5F5] focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[#888888] uppercase font-bold">
                  Read Time
                </label>
                <input
                  type="text"
                  value={readTime}
                  onChange={(e) => setReadTime(e.target.value)}
                  placeholder="6 min read"
                  className="w-full bg-[#121212] border border-[#222222] px-4 py-2.5 font-mono text-xs text-[#F5F5F5] focus:outline-none"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-3 pt-2 border-t border-[#181818]">
              <label className="block text-[#888888] uppercase font-bold">
                Tags & Descriptors
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="e.g. Field Recording, Acoustics..."
                  className="flex-1 bg-[#121212] border border-[#222222] px-4 py-2 text-xs text-[#F5F5F5] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-[#1E1E1E] border border-[#333333] text-[#F5F5F5] font-bold uppercase hover:bg-[#2A2A2A]"
                >
                  ADD TAG
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 bg-[#161616] border border-[#282828] text-[#CCCCCC] text-[11px] flex items-center gap-1.5"
                  >
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="text-[#666666] hover:text-red-400 font-bold"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Cover Artwork */}
          <div className="lg:col-span-6 bg-[#0C0C0C] border border-[#1C1C1C] p-6 space-y-6">
            <h3 className="font-bold text-[#F5F5F5] uppercase border-b border-[#181818] pb-3">
              COVER ARTWORK & VISUALS
            </h3>

            <div className="space-y-2">
              <label className="block text-[#888888] uppercase font-bold">
                Cover Image URL (16:9 Landscape)
              </label>
              <input
                type="text"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-[#121212] border border-[#222222] px-4 py-2.5 font-mono text-xs text-[#F5F5F5] focus:outline-none"
              />
            </div>

            {/* Quick Preset Picker */}
            <div className="space-y-2">
              <span className="text-[10px] text-[#666666] uppercase">
                Quick Label Photography Presets:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_COVERS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCoverUrl(preset.url)}
                    className="text-left px-2.5 py-1.5 bg-[#141414] hover:bg-[#1E1E1E] border border-[#222222] text-[#AAAAAA] hover:text-white text-[10px] truncate"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Preview Box */}
            <div className="aspect-[16/9] bg-[#121212] border border-[#222222] overflow-hidden relative group">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as any).src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80';
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#555555] gap-2">
                  <ImageIcon size={32} />
                  <span>NO COVER ATTACHED</span>
                </div>
              )}
              <div className="absolute top-3 left-3 bg-[#080808]/90 px-2.5 py-1 text-[10px] text-[#F5F5F5] border border-[#222222] uppercase">
                {category}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE PREVIEW */}
      {activeTab === 'preview' && (
        <div className="bg-[#080808] border border-[#1C1C1C] p-6 sm:p-12 space-y-8 max-w-4xl mx-auto">
          <div className="space-y-4 border-b border-[#1C1C1C] pb-6">
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#888888]">
              <span className="px-2.5 py-0.5 border border-[#333333] text-[#F5F5F5] bg-[#111111] uppercase font-semibold">
                {category}
              </span>
              <div className="flex items-center gap-1.5">
                <Calendar size={12} />
                <span>{date}</span>
              </div>
              <span>&bull;</span>
              <div className="flex items-center gap-1.5">
                <Clock size={12} />
                <span>{readTime}</span>
              </div>
              <span>&bull;</span>
              <div className="flex items-center gap-1.5">
                <User size={12} />
                <span>BY {author}</span>
              </div>
            </div>

            <h1 className="font-display font-black text-2xl sm:text-4xl text-[#F5F5F5] leading-tight">
              {title || 'Article Title Preview'}
            </h1>

            {shortExcerpt && (
              <p className="font-serif italic text-base sm:text-xl text-[#CCCCCC] leading-snug">
                {shortExcerpt}
              </p>
            )}
          </div>

          <div className="aspect-[16/9] overflow-hidden bg-[#151515] border border-[#222222]">
            <img
              src={coverUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-6 font-sans text-base text-[#CCCCCC] leading-relaxed max-w-3xl">
            {paragraphs.length > 0 ? (
              paragraphs.map((para, i) => <p key={i}>{para}</p>)
            ) : (
              <p className="text-[#666666] italic font-mono text-xs">
                No body text has been entered yet. Return to the "Content" tab to compose paragraphs.
              </p>
            )}
          </div>

          <div className="pt-6 border-t border-[#1C1C1C] flex flex-wrap items-center gap-2">
            <span className="text-[#666666]">TAGS:</span>
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 border border-[#222222] bg-[#111111] text-[#888888]"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
