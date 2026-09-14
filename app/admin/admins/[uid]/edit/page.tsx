'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/auth';
import {
  PERMISSION_GROUPS,
  ALL_PERMISSIONS,
  DEFAULT_EXECUTIVE_PERMISSIONS,
  AdminPermission,
} from '@/lib/auth/permissions';
import { UserProfile } from '@/types/auth';
import {
  ShieldCheck,
  ArrowLeft,
  Save,
  Loader2,
  CheckSquare,
  Square,
  User,
  Shield,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function EditAdminPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = use(params);
  const router = useRouter();

  const [displayName, setDisplayName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<'admin' | 'executive'>('executive');
  const [status, setStatus] = useState<'ACTIVE' | 'DISABLED'>('ACTIVE');
  const [selectedPermissions, setSelectedPermissions] = useState<AdminPermission[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    setLoading(true);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/users/${uid}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch user details');
      }

      const data = await res.json();
      const user: UserProfile = data.user;

      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setRole((user.role as 'admin' | 'executive') || 'executive');
      setStatus((user.status as 'ACTIVE' | 'DISABLED') || 'ACTIVE');
      setSelectedPermissions((user.permissions as AdminPermission[]) || DEFAULT_EXECUTIVE_PERMISSIONS);
    } catch (err: any) {
      console.error('Error loading user profile:', err);
      setError(err.message || 'Could not load user profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [uid]);

  const handleRoleChange = (newRole: 'admin' | 'executive') => {
    setRole(newRole);
    if (newRole === 'admin') {
      setSelectedPermissions(ALL_PERMISSIONS);
    } else if (selectedPermissions.length === 0) {
      setSelectedPermissions(DEFAULT_EXECUTIVE_PERMISSIONS);
    }
  };

  const togglePermission = (perm: AdminPermission) => {
    if (role === 'admin') return;
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  const selectAllGroup = (groupPermissions: AdminPermission[]) => {
    if (role === 'admin') return;
    const allSelected = groupPermissions.every((p) => selectedPermissions.includes(p));
    if (allSelected) {
      setSelectedPermissions(selectedPermissions.filter((p) => !groupPermissions.includes(p)));
    } else {
      const combined = new Set([...selectedPermissions, ...groupPermissions]);
      setSelectedPermissions(Array.from(combined));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !email.trim()) {
      setError('Please provide both Full Name and Email address.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/users/${uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          uid,
          displayName: displayName.trim(),
          email: email.trim(),
          role,
          status,
          permissions: role === 'admin' ? ALL_PERMISSIONS : selectedPermissions,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update administrative user profile');
      }

      router.push('/admin/admins');
    } catch (err: any) {
      console.error('Error updating admin user:', err);
      setError(err.message || 'Error occurred while updating user account.');
    } finally {
      setSubmitting(false);
    }
  };

  const isSuperAdmin = email.toLowerCase() === 'zaazze@chenabmedia.in';

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4 font-mono text-xs">
        <Loader2 size={24} className="animate-spin text-emerald-400" />
        <span className="text-[#888888] uppercase tracking-wider">
          LOADING USER PROFILE DETAILS...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-[#1A1A1A] pb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 mb-1">
            <ShieldCheck size={14} />
            <span>ADMIN MANAGEMENT</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#F5F5F5] uppercase tracking-wider">
            MODIFY ACCOUNT: {displayName || email}
          </h1>
        </div>

        <Link
          href="/admin/admins"
          className="px-4 py-2 border border-[#222222] bg-[#111111] text-[#CCCCCC] hover:text-white transition-colors font-mono text-xs uppercase flex items-center gap-2"
        >
          <ArrowLeft size={14} />
          <span>RETURN TO LIST</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-950/30 border border-red-900/50 text-red-400 font-mono text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchUserData}
            className="underline font-bold uppercase text-[10px]"
          >
            RETRY
          </button>
        </div>
      )}

      {isSuperAdmin && (
        <div className="p-4 bg-purple-950/30 border border-purple-900/50 text-purple-300 font-mono text-xs flex items-center gap-3">
          <ShieldCheck size={18} className="text-purple-400 shrink-0" />
          <span>
            SUPER ADMIN ACCOUNT: Role, status, and email address are locked to protect system administration.
          </span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-8 font-mono text-xs">
        {/* Identity & Status */}
        <div className="p-6 bg-[#0C0C0C] border border-[#1C1C1C] space-y-6">
          <h3 className="font-display font-bold text-sm text-[#F5F5F5] uppercase border-b border-[#181818] pb-3 flex items-center gap-2">
            <User size={15} className="text-emerald-400" />
            <span>ACCOUNT IDENTITY & ACCESS CONFIGURATION</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-[#888888] text-[11px] uppercase font-bold block">
                FULL NAME *
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#080808] border border-[#222222] text-[#F5F5F5] focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[#888888] text-[11px] uppercase font-bold block">
                EMAIL ADDRESS *
              </label>
              <input
                type="email"
                required
                disabled={isSuperAdmin}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#080808] border border-[#222222] text-[#F5F5F5] focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-[#888888] text-[11px] uppercase font-bold block">
                ROLE ASSIGNMENT *
              </label>
              <select
                value={role}
                disabled={isSuperAdmin}
                onChange={(e: any) => handleRoleChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#080808] border border-[#222222] text-[#F5F5F5] focus:outline-none focus:border-emerald-500 uppercase font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="executive">EXECUTIVE (Granular Permissions)</option>
                <option value="admin">ADMINISTRATOR (Full System Access)</option>
              </select>
            </div>

            {/* Status Selection */}
            <div className="space-y-2">
              <label className="text-[#888888] text-[11px] uppercase font-bold block">
                ACCOUNT STATUS *
              </label>
              <select
                value={status}
                disabled={isSuperAdmin}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#080808] border border-[#222222] text-[#F5F5F5] focus:outline-none focus:border-emerald-500 uppercase font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="DISABLED">DISABLED (SUSPENDED)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Permissions Configuration Checklist */}
        <div className="p-6 bg-[#0C0C0C] border border-[#1C1C1C] space-y-6">
          <div className="flex items-center justify-between border-b border-[#181818] pb-3">
            <h3 className="font-display font-bold text-sm text-[#F5F5F5] uppercase flex items-center gap-2">
              <Shield size={15} className="text-emerald-400" />
              <span>GRANULAR PERMISSION ASSIGNMENTS</span>
            </h3>
            {role === 'admin' && (
              <span className="text-purple-300 font-bold text-[10px] uppercase">
                [ADMINISTRATOR: ALL PERMISSIONS ENABLED]
              </span>
            )}
          </div>

          <div className="space-y-6">
            {PERMISSION_GROUPS.map((group) => {
              const groupKeys = group.permissions.map((p) => p.key);
              const allGroupSelected =
                role === 'admin' || groupKeys.every((k) => selectedPermissions.includes(k));

              return (
                <div key={group.category} className="space-y-3 bg-[#080808] p-4 border border-[#181818]">
                  <div className="flex items-center justify-between border-b border-[#161616] pb-2">
                    <span className="font-bold text-emerald-400 text-[11px] uppercase tracking-wider">
                      {group.category}
                    </span>

                    {role !== 'admin' && (
                      <button
                        type="button"
                        onClick={() => selectAllGroup(groupKeys)}
                        className="text-[10px] text-[#888888] hover:text-[#F5F5F5] uppercase underline"
                      >
                        {allGroupSelected ? 'DESELECT ALL' : 'SELECT ALL'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {group.permissions.map((perm) => {
                      const isChecked =
                        role === 'admin' || selectedPermissions.includes(perm.key);

                      return (
                        <div
                          key={perm.key}
                          onClick={() => togglePermission(perm.key)}
                          className={`p-2.5 border transition-colors flex items-start gap-3 cursor-pointer select-none ${
                            isChecked
                              ? 'bg-[#121212] border-emerald-900/60 text-[#F5F5F5]'
                              : 'bg-[#0A0A0A] border-[#1A1A1A] text-[#777777] hover:border-[#333333]'
                          } ${role === 'admin' ? 'cursor-not-allowed opacity-90' : ''}`}
                        >
                          <div className="mt-0.5">
                            {isChecked ? (
                              <CheckSquare size={15} className="text-emerald-400" />
                            ) : (
                              <Square size={15} className="text-[#444444]" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-xs uppercase">{perm.label}</div>
                            <div className="text-[10px] text-[#666666] leading-tight">
                              {perm.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#1C1C1C]">
          <Link
            href="/admin/admins"
            className="px-6 py-3 border border-[#222222] bg-[#111111] text-[#CCCCCC] hover:text-white uppercase font-bold"
          >
            CANCEL
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 hover:bg-emerald-900 font-bold uppercase flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>SAVING CHANGES...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>SAVE CHANGES</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
