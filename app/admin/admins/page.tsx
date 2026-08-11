'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { UserProfile } from '@/types/auth';
import { auth } from '@/lib/firebase/auth';
import {
  ShieldCheck,
  Plus,
  Search,
  UserCheck,
  UserX,
  Edit,
  Eye,
  X,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Lock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function AdminsListPage() {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'admin' | 'executive'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED'>('ALL');

  // Selected user detail modal
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [togglingUid, setTogglingUid] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch user profiles');
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Error fetching admins:', err);
      setError(err.message || 'Failed to fetch administration users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (targetUser: UserProfile) => {
    if (targetUser.email.toLowerCase() === 'zaazze@chenabmedia.in') {
      alert('The super admin account (zaazze@chenabmedia.in) is protected and cannot be disabled.');
      return;
    }

    const newStatus = targetUser.status === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
    const actionText = newStatus === 'DISABLED' ? 'disable' : 'reactivate';

    if (targetUser.uid === userProfile?.uid) {
      alert('You cannot disable your own active session.');
      return;
    }

    if (!confirm(`Are you sure you want to ${actionText} administrative account for ${targetUser.displayName || targetUser.email}?`)) {
      return;
    }

    setTogglingUid(targetUser.uid);
    setError(null);
    setActionSuccess(null);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/users/${targetUser.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          uid: targetUser.uid,
          displayName: targetUser.displayName,
          email: targetUser.email,
          role: targetUser.role,
          status: newStatus,
          permissions: targetUser.permissions || [],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${actionText} user`);
      }

      setActionSuccess(`Account for ${targetUser.displayName} has been set to [${newStatus}].`);
      await fetchUsers();
    } catch (err: any) {
      console.error(`Error toggling status:`, err);
      setError(err.message || `Failed to update status for ${targetUser.email}`);
    } finally {
      setTogglingUid(null);
    }
  };

  // Filter users logic
  const filteredUsers = users.filter((u) => {
    // Only show admin or executive roles
    if (u.role !== 'admin' && u.role !== 'executive') return false;

    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = u.displayName?.toLowerCase().includes(q);
      const emailMatch = u.email.toLowerCase().includes(q);
      return nameMatch || emailMatch;
    }

    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="border-b border-[#1A1A1A] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 mb-1">
            <ShieldCheck size={14} />
            <span>ADMINISTRATIVE ROSTER DIRECTORY</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#F5F5F5] uppercase tracking-wider">
            ADMIN & EXECUTIVE MANAGEMENT
          </h1>
          <p className="font-mono text-xs text-[#888888] mt-1">
            Provision, inspect, and update privileged accounts and authorization scopes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2.5 border border-[#222222] bg-[#111111] text-[#CCCCCC] hover:text-white hover:border-[#444444] transition-colors font-mono text-xs uppercase flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">REFRESH</span>
          </button>

          <Link
            href="/admin/admins/new"
            className="px-4 py-2.5 bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/80 transition-colors font-mono text-xs uppercase font-bold flex items-center gap-2"
          >
            <Plus size={14} />
            <span>PROVISION NEW ADMIN</span>
          </Link>
        </div>
      </div>

      {/* Action Messages */}
      {error && (
        <div className="p-4 bg-red-950/30 border border-red-900/50 text-red-400 font-mono text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline text-[10px] uppercase">
            DISMISS
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 font-mono text-xs flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="underline text-[10px] uppercase">
            DISMISS
          </button>
        </div>
      )}

      {/* Controls & Filter Bar */}
      <div className="p-4 bg-[#0C0C0C] border border-[#1C1C1C] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2 bg-[#080808] border border-[#222222] text-[#F5F5F5] font-mono text-xs focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <select
            value={roleFilter}
            onChange={(e: any) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-[#080808] border border-[#222222] text-[#CCCCCC] focus:outline-none focus:border-emerald-500 uppercase"
          >
            <option value="ALL">ALL ROLES</option>
            <option value="admin">ADMINS ONLY</option>
            <option value="executive">EXECUTIVES ONLY</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#080808] border border-[#222222] text-[#CCCCCC] focus:outline-none focus:border-emerald-500 uppercase"
          >
            <option value="ALL">ALL STATUSES</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DISABLED">DISABLED</option>
          </select>
        </div>
      </div>

      {/* Users Table Container */}
      <div className="border border-[#1C1C1C] bg-[#0C0C0C] overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center space-y-3 font-mono text-xs text-[#888888]">
            <Loader2 size={24} className="animate-spin mx-auto text-emerald-400" />
            <p className="uppercase tracking-wider">RETRIEVING ADMINISTRATIVE USERS...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center space-y-3 font-mono text-xs text-[#888888]">
            <ShieldCheck size={28} className="mx-auto text-[#444444]" />
            <p className="uppercase font-bold text-[#CCCCCC]">NO MATCHING USERS FOUND</p>
            <p className="text-[11px] text-[#666666]">
              Try adjusting your search criteria or provision a new admin account.
            </p>
          </div>
        ) : (
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[#1C1C1C] bg-[#080808] text-[#888888] text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">USER / NAME</th>
                <th className="py-3 px-4">ROLE</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">PERMISSIONS</th>
                <th className="py-3 px-4">CREATED</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#181818]">
              {filteredUsers.map((u) => {
                const isCurrentUser = u.uid === userProfile?.uid;
                const isSuperAdmin = u.email.toLowerCase() === 'zaazze@chenabmedia.in';
                const isDisabled = u.status === 'DISABLED';

                return (
                  <tr
                    key={u.uid}
                    className={`hover:bg-[#111111] transition-colors ${
                      isDisabled ? 'opacity-60 bg-red-950/10' : ''
                    }`}
                  >
                    {/* Name & Email */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#F5F5F5] flex items-center gap-2">
                        <span>{u.displayName || u.email.split('@')[0]}</span>
                        {isSuperAdmin && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-purple-950 border border-purple-800 text-purple-300 uppercase font-mono font-bold">
                            SUPER ADMIN
                          </span>
                        )}
                        {isCurrentUser && !isSuperAdmin && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 uppercase font-mono">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#777777]">{u.email}</div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] uppercase font-bold border ${
                          u.role === 'admin'
                            ? 'bg-purple-950/50 border-purple-800/80 text-purple-300'
                            : 'bg-sky-950/50 border-sky-800/80 text-sky-300'
                        }`}
                      >
                        [{u.role.toUpperCase()}]
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase font-bold border ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300'
                            : 'bg-red-950/50 border-red-800/80 text-red-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-red-500'
                          }`}
                        />
                        {u.status}
                      </span>
                    </td>

                    {/* Permissions summary */}
                    <td className="py-3.5 px-4 text-[#888888] text-[11px]">
                      {u.role === 'admin' ? (
                        <span className="text-purple-300 font-bold">FULL ACCESS</span>
                      ) : (
                        <span>
                          {u.permissions?.length || 0} PERMISSIONS ASSIGNED
                        </span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 text-[#777777] text-[11px]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedUser(u)}
                          title="View Details"
                          className="p-1.5 border border-[#222222] bg-[#141414] text-[#CCCCCC] hover:text-white hover:border-[#444444] transition-colors"
                        >
                          <Eye size={14} />
                        </button>

                        <Link
                          href={`/admin/admins/${u.uid}/edit`}
                          title="Edit Account"
                          className="p-1.5 border border-[#222222] bg-[#141414] text-[#CCCCCC] hover:text-white hover:border-[#444444] transition-colors"
                        >
                          <Edit size={14} />
                        </Link>

                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={togglingUid === u.uid || isCurrentUser || isSuperAdmin}
                          title={isSuperAdmin ? 'Super admin account cannot be disabled' : isDisabled ? 'Reactivate Account' : 'Disable Account'}
                          className={`p-1.5 border transition-colors disabled:opacity-30 ${
                            isDisabled
                              ? 'border-emerald-800 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60'
                              : 'border-red-900/50 bg-red-950/30 text-red-300 hover:bg-red-900/50'
                          }`}
                        >
                          {togglingUid === u.uid ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : isDisabled ? (
                            <UserCheck size={14} />
                          ) : (
                            <UserX size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0C0C0C] border border-[#222222] max-w-lg w-full p-6 space-y-6 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#1C1C1C] pb-4">
              <div className="space-y-1">
                <span className="text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                  USER PROFILE DETAILS
                </span>
                <h3 className="text-base font-bold text-[#F5F5F5]">
                  {selectedUser.displayName || selectedUser.email}
                </h3>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 text-[#888888] hover:text-white border border-[#222222] bg-[#111111]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#080808] border border-[#181818]">
                <div>
                  <span className="text-[#666666] text-[10px] block uppercase">EMAIL</span>
                  <span className="text-[#F5F5F5] font-bold">{selectedUser.email}</span>
                </div>
                <div>
                  <span className="text-[#666666] text-[10px] block uppercase">ROLE</span>
                  <span className="text-purple-300 font-bold uppercase">[{selectedUser.role}]</span>
                </div>
                <div>
                  <span className="text-[#666666] text-[10px] block uppercase">STATUS</span>
                  <span className="text-emerald-400 font-bold uppercase">{selectedUser.status}</span>
                </div>
                <div>
                  <span className="text-[#666666] text-[10px] block uppercase">CREATED AT</span>
                  <span className="text-[#CCCCCC]">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[#888888] text-[10px] uppercase font-bold block mb-2">
                  ASSIGNED PERMISSIONS
                </span>
                <div className="p-3 bg-[#080808] border border-[#181818] max-h-40 overflow-y-auto space-y-1.5 scrollbar-thin">
                  {selectedUser.role === 'admin' ? (
                    <p className="text-purple-300 font-bold text-[11px]">
                      ALL ADMINISTRATIVE PERMISSIONS (FULL ACCESS)
                    </p>
                  ) : selectedUser.permissions && selectedUser.permissions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUser.permissions.map((p) => (
                        <span
                          key={p}
                          className="px-2 py-0.5 bg-[#141414] border border-[#222222] text-[#CCCCCC] text-[10px]"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#666666]">No explicit permissions assigned.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#1C1C1C] flex justify-end gap-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 border border-[#222222] bg-[#111111] text-[#CCCCCC] hover:text-white uppercase font-bold"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
