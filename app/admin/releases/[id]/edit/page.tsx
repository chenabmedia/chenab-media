'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Disc, Loader2 } from 'lucide-react';
import { ReleaseEditor } from '@/components/admin/ReleaseEditor';
import { Release } from '@/types';
import { RELEASES } from '@/data/releases';
import { useAuth } from '@/context/AuthContext';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditReleasePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [release, setRelease] = useState<Release | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    async function fetchRelease() {
      try {
        setLoading(true);
        let headers: Record<string, string> = {};
        if (user) {
          const token = await user.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`/api/admin/releases/${id}`, { headers });
        if (res.ok) {
          const json = await res.json();
          setRelease(json.release);
        } else {
          // Fallback to static release if present
          const staticMatch = RELEASES.find((r) => r.id === id);
          if (staticMatch) {
            setRelease(staticMatch as any);
          } else {
            setError('Release not found in Firestore or static archive.');
          }
        }
      } catch (err: any) {
        console.error('Error fetching release for editing:', err);
        const staticMatch = RELEASES.find((r) => r.id === id);
        if (staticMatch) {
          setRelease(staticMatch as any);
        } else {
          setError('Failed to load release record.');
        }
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchRelease();
  }, [id, user, authLoading]);

  if (loading) {
    return (
      <div className="py-24 text-center text-[#888888] space-y-3 font-mono text-xs">
        <Loader2 size={24} className="animate-spin mx-auto text-emerald-400" />
        <p className="uppercase">LOADING RELEASE EDITOR DATA...</p>
      </div>
    );
  }

  if (error || !release) {
    return (
      <div className="py-24 text-center text-red-400 space-y-4 font-mono text-xs max-w-md mx-auto">
        <Disc size={32} className="mx-auto text-red-500" />
        <p className="font-bold uppercase text-sm">{error || 'Release Not Found'}</p>
        <Link
          href="/admin/releases"
          className="inline-block px-4 py-2 bg-[#181818] border border-[#333333] text-[#F5F5F5] uppercase font-bold"
        >
          RETURN TO DIRECTORY
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-mono text-xs">
      <div className="border-b border-[#1A1A1A] pb-6">
        <Link
          href="/admin/releases"
          className="inline-flex items-center gap-2 text-[#888888] hover:text-[#F5F5F5] uppercase tracking-widest mb-2 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>BACK TO RELEASES DIRECTORY</span>
        </Link>
        <div className="flex items-center gap-2 text-emerald-400 mb-1">
          <Disc size={14} />
          <span>EDIT CATALOGUE RECORD [{release.catalogueNumber}]</span>
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-[#F5F5F5] uppercase tracking-wider">
          EDIT: {release.title}
        </h1>
      </div>

      <ReleaseEditor initialRelease={release} isEditMode={true} />
    </div>
  );
}
