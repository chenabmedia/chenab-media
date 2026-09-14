'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { JournalEditor } from '@/components/admin/JournalEditor';
import { JournalPost } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function EditJournalPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const id = params?.id as string;

  const [post, setPost] = useState<JournalPost | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || authLoading) return;

    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        let headers: Record<string, string> = {};
        if (user) {
          const token = await user.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`/api/admin/journal/${id}`, { headers });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to load journal entry');
        }

        const json = await res.json();
        setPost(json.post);
      } catch (err: any) {
        setError(err.message || 'Unable to retrieve journal entry.');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, user, authLoading]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-mono text-xs">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/journal"
          className="p-2 border border-[#222222] bg-[#121212] hover:bg-[#1C1C1C] text-[#888888] hover:text-[#F5F5F5] transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <div className="text-[10px] text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <BookOpen size={12} />
            <span>JOURNAL CMS / EDITING</span>
          </div>
          <h1 className="font-display font-black text-2xl text-[#F5F5F5] uppercase">
            {post ? post.title : 'EDIT JOURNAL ENTRY'}
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="p-16 border border-[#1C1C1C] bg-[#0C0C0C] flex flex-col items-center justify-center gap-4 text-[#888888]">
          <Loader2 size={24} className="animate-spin text-emerald-400" />
          <span>FETCHING ARTICLE DATA...</span>
        </div>
      ) : error ? (
        <div className="p-8 border border-red-900/50 bg-red-950/20 text-red-400 space-y-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} />
            <span className="font-bold text-sm">{error}</span>
          </div>
          <Link
            href="/admin/journal"
            className="inline-block px-4 py-2 bg-[#121212] border border-[#333333] text-[#F5F5F5] hover:bg-[#202020] uppercase"
          >
            RETURN TO DIRECTORY
          </Link>
        </div>
      ) : post ? (
        <JournalEditor initialPost={post} isEditMode={true} />
      ) : null}
    </div>
  );
}
