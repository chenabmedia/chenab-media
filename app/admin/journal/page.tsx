'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Edit,
  Eye,
  Trash2,
  Grid,
  List,
  Sparkles,
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { JournalPost, JournalCategory, JournalStatus } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function AdminJournalDirectory() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [posts, setPosts] = useState<JournalPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<'NEWEST' | 'OLDEST' | 'AZ' | 'TITLE'>('NEWEST');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const fetchJournalPosts = async () => {
    setLoading(true);
    try {
      let headers: Record<string, string> = {};
      if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/admin/journal', { headers });
      if (res.ok) {
        const json = await res.json();
        setPosts(json.posts || []);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error('Error loading admin journal posts:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchJournalPosts();
    }
  }, [user, authLoading]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the journal entry "${title}"?`)) return;

    setDeletingId(id);
    try {
      let headers: Record<string, string> = {};
      if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/admin/journal/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        showToast(`Article "${title}" deleted.`, 'info');
        fetchJournalPosts();
      } else {
        showToast('Failed to delete journal post.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error deleting journal post.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (post: JournalPost) => {
    const nextStatus: JournalStatus = post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    setTogglingId(post.id);

    try {
      let headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/admin/journal/${post.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        showToast(`Status changed to ${nextStatus}`, 'success');
        setPosts((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, status: nextStatus } : p))
        );
      } else {
        showToast('Failed to update publication status', 'error');
      }
    } catch (err) {
      showToast('Error toggling status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // Filtered and sorted
  const filteredPosts = posts
    .filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.shortExcerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.tags && post.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesCategory =
        selectedCategory === 'ALL' || post.category === selectedCategory;

      const matchesStatus =
        selectedStatus === 'ALL' || post.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOption === 'NEWEST') {
        return new Date(b.date || b.publishedAt || '').getTime() - new Date(a.date || a.publishedAt || '').getTime();
      }
      if (sortOption === 'OLDEST') {
        return new Date(a.date || a.publishedAt || '').getTime() - new Date(b.date || b.publishedAt || '').getTime();
      }
      if (sortOption === 'AZ' || sortOption === 'TITLE') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

  const totalPublished = posts.filter((p) => p.status === 'PUBLISHED' || !p.status).length;
  const totalDrafts = posts.filter((p) => p.status === 'DRAFT').length;

  return (
    <div className="space-y-8 font-mono text-xs">
      {/* Top Banner Header */}
      <div className="border-b border-[#1A1A1A] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <BookOpen size={14} />
            <span>EDITORIAL & FIELD NOTES CMS</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#F5F5F5] uppercase tracking-wider">
            JOURNAL MANAGEMENT
          </h1>
          <p className="font-sans text-xs text-[#888888] mt-1">
            Publish essays, expedition field notes, artist interviews, and studio archives for CHENAB MEDIA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchJournalPosts}
            className="p-3 bg-[#111111] hover:bg-[#181818] border border-[#222222] text-[#888888] hover:text-[#F5F5F5] transition-colors"
            title="Refresh Directory"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <Link
            href="/admin/journal/new"
            className="px-5 py-3 bg-[#F5F5F5] text-[#080808] font-bold uppercase flex items-center gap-2 hover:bg-white transition-all shadow-lg min-h-[44px]"
          >
            <Plus size={16} />
            <span>NEW JOURNAL ENTRY</span>
          </Link>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0C0C0C] border border-[#1C1C1C] p-4 space-y-1">
          <span className="text-[#666666] uppercase text-[10px]">TOTAL POSTS</span>
          <div className="text-xl sm:text-2xl font-display font-black text-[#F5F5F5]">
            {posts.length}
          </div>
        </div>

        <div className="bg-[#0C0C0C] border border-[#1C1C1C] p-4 space-y-1">
          <span className="text-emerald-400 uppercase text-[10px]">PUBLISHED / LIVE</span>
          <div className="text-xl sm:text-2xl font-display font-black text-emerald-400">
            {totalPublished}
          </div>
        </div>

        <div className="bg-[#0C0C0C] border border-[#1C1C1C] p-4 space-y-1">
          <span className="text-amber-400 uppercase text-[10px]">DRAFTS</span>
          <div className="text-xl sm:text-2xl font-display font-black text-amber-400">
            {totalDrafts}
          </div>
        </div>

        <div className="bg-[#0C0C0C] border border-[#1C1C1C] p-4 space-y-1">
          <span className="text-[#666666] uppercase text-[10px]">CATEGORIES ACTIVE</span>
          <div className="text-xl sm:text-2xl font-display font-black text-[#F5F5F5]">
            5
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filter */}
      <div className="bg-[#0C0C0C] border border-[#1C1C1C] p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
          <input
            type="text"
            placeholder="Search by title, author, excerpt, or #tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121212] border border-[#222222] pl-10 pr-4 py-2.5 text-xs text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#555555] min-h-[44px]"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-[#121212] border border-[#222222] px-3 py-1.5">
            <span className="text-[#666666] text-[10px] uppercase">CAT:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs text-[#F5F5F5] focus:outline-none uppercase"
            >
              <option value="ALL">ALL CATEGORIES</option>
              <option value="FIELD NOTES">FIELD NOTES</option>
              <option value="EDITORIAL">EDITORIAL</option>
              <option value="INTERVIEW">INTERVIEW</option>
              <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
              <option value="STUDIO LOG">STUDIO LOG</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-[#121212] border border-[#222222] px-3 py-1.5">
            <span className="text-[#666666] text-[10px] uppercase">STATUS:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs text-[#F5F5F5] focus:outline-none uppercase"
            >
              <option value="ALL">ALL STATUSES</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 bg-[#121212] border border-[#222222] px-3 py-1.5">
            <span className="text-[#666666] text-[10px] uppercase">SORT:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="bg-transparent text-xs text-[#F5F5F5] focus:outline-none uppercase"
            >
              <option value="NEWEST">NEWEST FIRST</option>
              <option value="OLDEST">OLDEST FIRST</option>
              <option value="AZ">TITLE (A-Z)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex border border-[#222222] bg-[#121212]">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2.5 transition-colors ${
                viewMode === 'table' ? 'bg-[#222222] text-[#F5F5F5]' : 'text-[#666666] hover:text-[#CCCCCC]'
              }`}
              title="Table View"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 transition-colors ${
                viewMode === 'grid' ? 'bg-[#222222] text-[#F5F5F5]' : 'text-[#666666] hover:text-[#CCCCCC]'
              }`}
              title="Grid View"
            >
              <Grid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Directory Content List */}
      {loading ? (
        <div className="p-16 border border-[#1C1C1C] bg-[#0C0C0C] flex flex-col items-center justify-center gap-4 text-[#888888]">
          <Loader2 size={24} className="animate-spin text-emerald-400" />
          <span>LOADING JOURNAL ENTRIES...</span>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="p-16 border border-[#1C1C1C] bg-[#0C0C0C] text-center space-y-4">
          <BookOpen size={32} className="mx-auto text-[#444444]" />
          <p className="text-[#888888] uppercase">No matching journal articles found</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setSelectedStatus('ALL');
            }}
            className="px-4 py-2 border border-[#333333] text-[#F5F5F5] hover:bg-[#161616] uppercase"
          >
            CLEAR FILTERS
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="border border-[#1C1C1C] bg-[#0C0C0C] overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1A1A1A] bg-[#111111] text-[#777777] text-[10px] uppercase">
                <th className="py-3.5 px-4">ARTICLE / TITLE</th>
                <th className="py-3.5 px-4">CATEGORY</th>
                <th className="py-3.5 px-4">AUTHOR</th>
                <th className="py-3.5 px-4">DATE & READ TIME</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#161616]">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-[#121212] transition-colors group">
                  {/* Article Title & Cover Thumbnail */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-9 bg-[#151515] border border-[#222222] overflow-hidden shrink-0">
                        <img
                          src={post.coverUrl || post.image}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 max-w-md">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/journal/${post.id}/edit`}
                            className="font-bold text-[#F5F5F5] hover:underline truncate block"
                          >
                            {post.title}
                          </Link>
                          {post.featured && (
                            <span className="px-1.5 py-0.2 bg-purple-950/50 text-purple-300 border border-purple-800/60 text-[9px] uppercase">
                              FEATURED
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#666666] block truncate">
                          /journal/{post.slug}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-4 px-4">
                    <span className="px-2 py-0.5 bg-[#161616] border border-[#2A2A2A] text-[#CCCCCC] text-[10px] uppercase font-bold">
                      {post.category}
                    </span>
                  </td>

                  {/* Author */}
                  <td className="py-4 px-4 text-[#AAAAAA] whitespace-nowrap">
                    {post.author}
                  </td>

                  {/* Date & Read Time */}
                  <td className="py-4 px-4 text-[#888888] whitespace-nowrap">
                    <div>{post.date || post.publishedAt}</div>
                    <div className="text-[10px] text-[#555555]">{post.readTime}</div>
                  </td>

                  {/* Status Toggle Button */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(post)}
                      disabled={togglingId === post.id}
                      className={`px-2.5 py-1 border text-[10px] font-bold uppercase transition-all ${
                        post.status === 'PUBLISHED' || !post.status
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50 hover:bg-emerald-950/70'
                          : post.status === 'DRAFT'
                          ? 'bg-amber-950/40 text-amber-400 border-amber-900/50 hover:bg-amber-950/70'
                          : 'bg-red-950/40 text-red-400 border-red-900/50'
                      }`}
                      title="Click to toggle Draft / Published"
                    >
                      {togglingId === post.id ? 'UPDATING...' : post.status || 'PUBLISHED'}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/journal/${post.slug}`}
                        target="_blank"
                        className="p-2 border border-[#222222] bg-[#141414] hover:bg-[#202020] text-[#AAAAAA] hover:text-white transition-colors"
                        title="View Live Article"
                      >
                        <Eye size={13} />
                      </Link>

                      <Link
                        href={`/admin/journal/${post.id}/edit`}
                        className="p-2 border border-[#222222] bg-[#141414] hover:bg-[#202020] text-[#F5F5F5] transition-colors"
                        title="Edit Article"
                      >
                        <Edit size={13} />
                      </Link>

                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        disabled={deletingId === post.id}
                        className="p-2 border border-red-950/40 bg-red-950/20 hover:bg-red-900/40 text-red-400 transition-colors"
                        title="Delete Article"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="border border-[#1A1A1A] bg-[#0C0C0C] hover:border-[#333333] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[16/9] bg-[#151515] overflow-hidden relative">
                  <img
                    src={post.coverUrl || post.image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-[#080808]/90 px-2 py-0.5 text-[9px] text-[#F5F5F5] border border-[#222222] uppercase">
                    {post.category}
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`px-2 py-0.5 border text-[9px] font-bold uppercase ${
                        post.status === 'PUBLISHED' || !post.status
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                          : 'bg-amber-950/80 text-amber-300 border-amber-800'
                      }`}
                    >
                      {post.status || 'PUBLISHED'}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2.5">
                  <div className="text-[10px] text-[#777777] flex items-center justify-between">
                    <span>BY {post.author}</span>
                    <span>{post.date}</span>
                  </div>

                  <h3 className="font-display font-bold text-base text-[#F5F5F5] line-clamp-2 leading-snug">
                    <Link href={`/admin/journal/${post.id}/edit`}>{post.title}</Link>
                  </h3>

                  <p className="font-sans text-xs text-[#888888] line-clamp-2 leading-relaxed">
                    {post.shortExcerpt}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-[#181818] flex items-center justify-between mt-3 pt-3">
                <span className="text-[10px] text-[#666666]">{post.readTime}</span>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/journal/${post.slug}`}
                    target="_blank"
                    className="p-1.5 border border-[#222222] text-[#888888] hover:text-white"
                  >
                    <Eye size={13} />
                  </Link>
                  <Link
                    href={`/admin/journal/${post.id}/edit`}
                    className="px-3 py-1.5 bg-[#181818] border border-[#333333] text-[#F5F5F5] hover:bg-[#252525] font-bold"
                  >
                    EDIT
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
