'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase/auth';
import {
  User,
  ShieldCheck,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Key,
  Shield,
  Clock,
} from 'lucide-react';

export default function AdminProfilePage() {
  const { userProfile, refreshUserProfile } = useAuth();

  const [displayName, setDisplayName] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
    }
  }, [userProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !userProfile) return;

    setSubmitting(true);
    setSuccess(null);
    setError(null);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/users/${userProfile.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          uid: userProfile.uid,
          displayName: displayName.trim(),
          email: userProfile.email,
          role: userProfile.role,
          status: userProfile.status,
          permissions: userProfile.permissions || [],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update user profile');
      }

      setSuccess('Profile updated successfully.');
      if (refreshUserProfile) {
        await refreshUserProfile();
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Could not update profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 font-mono text-xs">
      {/* Header Banner */}
      <div className="border-b border-[#1A1A1A] pb-6">
        <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 mb-1">
          <User size={14} />
          <span>AUTHENTICATED ACCOUNT</span>
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-[#F5F5F5] uppercase tracking-wider">
          ADMIN PROFILE
        </h1>
        <p className="text-[#888888] mt-1">
          Inspect personal administrative status and permissions.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/30 border border-red-900/50 text-red-400 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Account Overview Card */}
      <div className="p-6 bg-[#0C0C0C] border border-[#1C1C1C] space-y-6">
        <h3 className="font-display font-bold text-sm text-[#F5F5F5] uppercase border-b border-[#181818] pb-3 flex items-center gap-2">
          <ShieldCheck size={15} className="text-emerald-400" />
          <span>SYSTEM PRIVILEGES & CREDENTIALS</span>
        </h3>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#080808] border border-[#181818]">
            <div>
              <span className="text-[#666666] text-[10px] block uppercase">EMAIL ADDRESS</span>
              <span className="text-[#F5F5F5] font-bold text-sm">{userProfile?.email}</span>
            </div>

            <div>
              <span className="text-[#666666] text-[10px] block uppercase">ROLE LEVEL</span>
              <span className="text-purple-300 font-bold uppercase text-sm">
                [{userProfile?.role.toUpperCase()}]
              </span>
            </div>

            <div>
              <span className="text-[#666666] text-[10px] block uppercase">STATUS</span>
              <span className="text-emerald-400 font-bold uppercase text-sm">
                {userProfile?.status}
              </span>
            </div>

            <div>
              <span className="text-[#666666] text-[10px] block uppercase">USER UID</span>
              <span className="text-[#CCCCCC] text-[11px] font-mono truncate block">
                {userProfile?.uid}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[#888888] text-[11px] uppercase font-bold block">
              DISPLAY NAME
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#080808] border border-[#222222] text-[#F5F5F5] focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 hover:bg-emerald-900 font-bold uppercase flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>SAVING...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>UPDATE DISPLAY NAME</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Permissions Breakdown Card */}
      <div className="p-6 bg-[#0C0C0C] border border-[#1C1C1C] space-y-4">
        <h3 className="font-display font-bold text-sm text-[#F5F5F5] uppercase border-b border-[#181818] pb-3 flex items-center gap-2">
          <Shield size={15} className="text-emerald-400" />
          <span>PERMISSIONS ASSIGNED TO THIS ACCOUNT</span>
        </h3>

        {userProfile?.role === 'admin' ? (
          <div className="p-4 bg-purple-950/20 border border-purple-900/40 text-purple-300 space-y-1">
            <p className="font-bold uppercase text-xs">UNRESTRICTED SYSTEM ACCESS</p>
            <p className="text-[11px] text-[#A0A0A0]">
              As a full Administrator, you hold unrestricted authority over all modules, catalogue items, user provisioning, and settings.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {userProfile?.permissions && userProfile.permissions.length > 0 ? (
              userProfile.permissions.map((p) => (
                <span
                  key={p}
                  className="px-2.5 py-1 bg-[#121212] border border-[#222222] text-[#CCCCCC] text-[11px]"
                >
                  {p}
                </span>
              ))
            ) : (
              <p className="text-[#666666]">No explicit granular permissions assigned.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
