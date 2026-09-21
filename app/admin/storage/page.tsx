'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  StorageCategory,
  StorageFileRecord,
  StorageVisibility,
} from '@/types/storage';
import {
  FolderArchive,
  UploadCloud,
  Search,
  RefreshCw,
  Trash2,
  Copy,
  ExternalLink,
  Download,
  Eye,
  FileText,
  Music,
  Image as ImageIcon,
  File,
  Lock,
  Globe,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
  Key,
  Shield,
  Filter,
} from 'lucide-react';
import { hasPermission } from '@/lib/auth/permissions';

const CATEGORIES: { id: StorageCategory | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All Files' },
  { id: 'artwork', label: 'Artwork' },
  { id: 'audio', label: 'Audio Masters' },
  { id: 'releases', label: 'Releases' },
  { id: 'artists', label: 'Artists' },
  { id: 'demos', label: 'Demos' },
  { id: 'agreements', label: 'Agreements' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'royalty_documents', label: 'Royalties' },
  { id: 'site_assets', label: 'Site Assets' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'other', label: 'Other' },
];

function formatBytes(bytes: number, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatDate(isoString: string) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export default function AdminStoragePage() {
  const { user, userProfile } = useAuth();
  const { showToast } = useToast();

  const [files, setFiles] = useState<StorageFileRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [r2Configured, setR2Configured] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<StorageCategory | 'ALL'>('ALL');
  const [selectedVisibility, setSelectedVisibility] = useState<StorageVisibility | 'ALL'>('ALL');

  // Modals & Panels
  const [uploadOpen, setUploadOpen] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<StorageFileRecord | null>(null);
  const [previewFile, setPreviewFile] = useState<StorageFileRecord | null>(null);
  const [signedUrlFile, setSignedUrlFile] = useState<{
    file: StorageFileRecord;
    url?: string;
    loading: boolean;
  } | null>(null);

  // Upload Form State
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadCategory, setUploadCategory] = useState<StorageCategory>('artwork');
  const [uploadVisibility, setUploadVisibility] = useState<StorageVisibility>('PUBLIC');
  const [uploadOwnerId, setUploadOwnerId] = useState<string>('');
  const [uploadSubType, setUploadSubType] = useState<string>('');
  const [uploadDescription, setUploadDescription] = useState<string>('');
  const [uploadTags, setUploadTags] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  const [useDirectR2, setUseDirectR2] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUpload = hasPermission(userProfile, 'storage.upload');
  const canDelete = hasPermission(userProfile, 'storage.delete');

  const fetchFiles = async () => {
    setLoading(true);
    try {
      let token = '';
      if (user) {
        try {
          token = await user.getIdToken();
        } catch (e) {
          console.warn('Failed to get user token:', e);
        }
      }

      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
      if (selectedVisibility !== 'ALL') params.set('visibility', selectedVisibility);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/storage?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load storage files (${res.status})`);
      }

      const data = await res.json();
      setFiles(data.files || []);
      setR2Configured(Boolean(data.r2Configured));
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch storage items', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user, selectedCategory, selectedVisibility]);

  // Search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFiles();
  };

  // Upload handler
  const handleStartUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) {
      showToast('Please select at least one file to upload.', 'error');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      let token = '';
      if (user) {
        token = await user.getIdToken();
      }

      const targetFile = uploadFiles[0];

      if (useDirectR2) {
        // Step 1: Request pre-signed upload URL from server
        setUploadProgress(20);
        const signRes = await fetch('/api/admin/storage/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            mode: 'request_signed_url',
            filename: targetFile.name,
            mimeType: targetFile.type || 'application/octet-stream',
            size: targetFile.size,
            category: uploadCategory,
            visibility: uploadVisibility,
            ownerId: uploadOwnerId.trim() || undefined,
            subType: uploadSubType.trim() || undefined,
            description: uploadDescription.trim() || undefined,
            tags: uploadTags
              ? uploadTags.split(',').map((t) => t.trim()).filter(Boolean)
              : [],
          }),
        });

        if (!signRes.ok) {
          const errData = await signRes.json();
          throw new Error(errData.error || 'Failed to initiate R2 upload.');
        }

        const signData = await signRes.json();
        setUploadProgress(40);

        // Step 2: Upload binary directly from browser to Cloudflare R2
        const r2UploadRes = await fetch(signData.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': targetFile.type || 'application/octet-stream',
          },
          body: targetFile,
        });

        if (!r2UploadRes.ok) {
          throw new Error(`Direct R2 upload failed with status ${r2UploadRes.status}`);
        }

        setUploadProgress(80);

        // Step 3: Finalize metadata in Firestore
        const finalizeRes = await fetch('/api/admin/storage/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            mode: 'finalize_direct_upload',
            record: signData.fileRecordDraft,
          }),
        });

        if (!finalizeRes.ok) {
          const finalizeErr = await finalizeRes.json();
          throw new Error(finalizeErr.error || 'Failed to finalize file metadata.');
        }

        setUploadProgress(100);
        showToast(`Uploaded ${targetFile.name} successfully to R2!`, 'success');
      } else {
        // Step alternative: Server multipart upload
        const formData = new FormData();
        formData.append('file', targetFile);
        formData.append('filename', targetFile.name);
        formData.append('category', uploadCategory);
        formData.append('visibility', uploadVisibility);
        if (uploadOwnerId.trim()) formData.append('ownerId', uploadOwnerId.trim());
        if (uploadSubType.trim()) formData.append('subType', uploadSubType.trim());
        if (uploadDescription.trim()) formData.append('description', uploadDescription.trim());
        if (uploadTags.trim()) formData.append('tags', uploadTags.trim());

        setUploadProgress(50);
        const res = await fetch('/api/admin/storage/upload', {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to upload file.');
        }

        setUploadProgress(100);
        showToast(`Uploaded ${targetFile.name} successfully!`, 'success');
      }

      // Reset form
      setUploadFiles([]);
      setUploadOpen(false);
      setUploadDescription('');
      setUploadTags('');
      setUploadOwnerId('');
      setUploadSubType('');
      fetchFiles();
    } catch (err: any) {
      console.error('Upload failed:', err);
      showToast(err.message || 'Upload process failed', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Delete file handler
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      let token = '';
      if (user) {
        token = await user.getIdToken();
      }

      const res = await fetch(`/api/admin/storage/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete file.');
      }

      showToast(`Deleted ${deleteTarget.filename} permanently.`, 'success');
      setDeleteTarget(null);
      fetchFiles();
    } catch (err: any) {
      showToast(err.message || 'Could not delete storage file', 'error');
    }
  };

  // Generate on-demand signed URL for private file
  const handleGenerateSignedUrl = async (file: StorageFileRecord, expiresInSeconds = 3600) => {
    setSignedUrlFile({ file, loading: true });

    try {
      let token = '';
      if (user) {
        token = await user.getIdToken();
      }

      const res = await fetch(`/api/admin/storage/${file.id}/signed-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ expiresInSeconds }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate signed download link.');
      }

      const data = await res.json();
      setSignedUrlFile({ file, url: data.downloadUrl, loading: false });
      showToast('Generated secure temporary download URL.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error generating signed URL', 'error');
      setSignedUrlFile(null);
    }
  };

  // Copy URL to clipboard
  const handleCopy = (text: string, label: string) => {
    if (!text) {
      showToast('No URL available to copy.', 'error');
      return;
    }
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, 'success');
  };

  // File type icon resolver
  const getFileIcon = (mimeType: string, category: StorageCategory) => {
    if (mimeType.startsWith('image/')) return <ImageIcon size={16} className="text-emerald-400" />;
    if (mimeType.startsWith('audio/')) return <Music size={16} className="text-cyan-400" />;
    if (mimeType === 'application/pdf' || category === 'agreements' || category === 'contracts') {
      return <FileText size={16} className="text-amber-400" />;
    }
    return <File size={16} className="text-[#888888]" />;
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#888888]">
            <FolderArchive size={14} className="text-emerald-400" />
            <span>CENTRALIZED OBJECT STORAGE</span>
            <span className="text-[#444444]">|</span>
            <span className="text-emerald-400 font-bold uppercase">CLOUDFLARE R2</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#F5F5F5] tracking-wide uppercase mt-1">
            Media & Object Storage
          </h1>
          <p className="text-xs sm:text-sm text-[#888888] mt-1">
            Secure asset repository with deterministic object keying, public CDN distribution, and signed access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* R2 status badge */}
          <div
            className={`px-2.5 py-1 text-[11px] font-mono border flex items-center gap-1.5 ${
              r2Configured
                ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-300'
                : 'border-amber-900/50 bg-amber-950/30 text-amber-300'
            }`}
            title={r2Configured ? 'Cloudflare R2 is connected' : 'R2 environment variables pending'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                r2Configured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>{r2Configured ? 'R2 ONLINE' : 'R2 CONFIG PENDING'}</span>
          </div>

          <button
            onClick={fetchFiles}
            disabled={loading}
            className="p-2 border border-[#222222] bg-[#111111] hover:bg-[#181818] text-[#888888] hover:text-[#F5F5F5] transition-colors"
            title="Refresh list"
            aria-label="Refresh storage list"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-emerald-400' : ''} />
          </button>

          {canUpload && (
            <button
              onClick={() => setUploadOpen(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors"
            >
              <UploadCloud size={16} />
              <span>UPLOAD ASSET</span>
            </button>
          )}
        </div>
      </div>

      {/* Notice if R2 is not configured */}
      {!r2Configured && (
        <div className="p-4 border border-amber-900/50 bg-amber-950/20 text-amber-300 text-xs font-mono flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Cloudflare R2 server environment variables are not yet configured.</p>
            <p className="text-[#AAAAAA]">
              Set <code className="text-amber-200">R2_ACCOUNT_ID</code>, <code className="text-amber-200">R2_ACCESS_KEY_ID</code>, <code className="text-amber-200">R2_SECRET_ACCESS_KEY</code>, and <code className="text-amber-200">R2_BUCKET_NAME</code> in your server deployment environment to enable active uploads and signed link creation.
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="md:col-span-6 flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
            <input
              type="text"
              placeholder="Search filename, object key, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111111] border border-[#222222] text-[#E5E5E5] placeholder-[#555555] text-xs font-mono pl-9 pr-3 py-2.5 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 border border-[#222222] bg-[#141414] hover:bg-[#1C1C1C] text-xs font-mono text-[#CCCCCC] transition-colors"
          >
            SEARCH
          </button>
        </form>

        {/* Visibility Filter */}
        <div className="md:col-span-6 flex items-center justify-end gap-2 font-mono text-xs">
          <span className="text-[#666666] uppercase text-[11px]">Visibility:</span>
          {(['ALL', 'PUBLIC', 'PRIVATE'] as const).map((vis) => (
            <button
              key={vis}
              onClick={() => setSelectedVisibility(vis)}
              className={`px-3 py-1.5 border text-[11px] uppercase transition-colors ${
                selectedVisibility === vis
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-bold'
                  : 'border-[#222222] bg-[#111111] text-[#777777] hover:text-[#CCCCCC]'
              }`}
            >
              {vis}
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin border-b border-[#1C1C1C]">
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 font-mono text-xs whitespace-nowrap transition-all border ${
                active
                  ? 'border-emerald-400 bg-[#161616] text-[#F5F5F5] font-bold'
                  : 'border-transparent text-[#777777] hover:text-[#CCCCCC] hover:bg-[#111111]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* File List Table */}
      <div className="border border-[#1C1C1C] bg-[#0E0E0E]">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#777777] font-mono text-xs">
            <Loader2 size={24} className="animate-spin text-emerald-400" />
            <span>Scanning storage records...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="py-20 text-center font-mono text-xs text-[#777777] space-y-2">
            <FolderArchive size={32} className="mx-auto text-[#333333]" />
            <p className="text-[#AAAAAA] font-bold uppercase">No files found</p>
            <p className="text-[11px] text-[#555555]">
              {selectedCategory !== 'ALL' || searchQuery
                ? 'Try broadening your search or category filter.'
                : 'Upload your first audio, artwork, or document to Cloudflare R2.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-[#1C1C1C] bg-[#141414] text-[#888888] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">File / Key</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Visibility</th>
                  <th className="py-3 px-4">Uploader</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181818]">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-[#121212] transition-colors">
                    {/* Filename and objectKey */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 max-w-[320px]">
                        <div className="p-2 border border-[#222222] bg-[#111111] shrink-0">
                          {getFileIcon(file.mimeType, file.category)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[#F5F5F5] font-bold truncate text-xs" title={file.filename}>
                            {file.filename}
                          </p>
                          <p className="text-[#555555] text-[10px] truncate" title={file.objectKey}>
                            {file.objectKey}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-[10px] border border-[#222222] bg-[#141414] text-[#AAAAAA] uppercase">
                        {file.category}
                      </span>
                    </td>

                    {/* Size */}
                    <td className="py-3 px-4 text-[#888888] text-[11px]">
                      {formatBytes(file.size)}
                    </td>

                    {/* Visibility */}
                    <td className="py-3 px-4">
                      {file.visibility === 'PUBLIC' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/30 border border-emerald-900/40 px-2 py-0.5">
                          <Globe size={11} />
                          <span>PUBLIC</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-950/30 border border-amber-900/40 px-2 py-0.5">
                          <Lock size={11} />
                          <span>PRIVATE</span>
                        </span>
                      )}
                    </td>

                    {/* Uploader */}
                    <td className="py-3 px-4 text-[#888888] text-[11px] truncate max-w-[150px]">
                      {file.uploadedBy?.displayName || file.uploadedBy?.email?.split('@')[0] || 'System'}
                    </td>

                    {/* Created */}
                    <td className="py-3 px-4 text-[#666666] text-[10px] whitespace-nowrap">
                      {formatDate(file.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Preview button */}
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="p-1.5 border border-[#222222] bg-[#111111] hover:bg-[#1A1A1A] text-[#888888] hover:text-[#F5F5F5] transition-colors"
                          title="Preview asset"
                        >
                          <Eye size={13} />
                        </button>

                        {/* Copy Link / Signed URL */}
                        {file.visibility === 'PUBLIC' && file.publicUrl ? (
                          <button
                            onClick={() => handleCopy(file.publicUrl!, 'Public URL')}
                            className="p-1.5 border border-[#222222] bg-[#111111] hover:bg-[#1A1A1A] text-[#888888] hover:text-emerald-400 transition-colors"
                            title="Copy Public CDN Link"
                          >
                            <Copy size={13} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleGenerateSignedUrl(file)}
                            className="p-1.5 border border-[#222222] bg-[#111111] hover:bg-[#1A1A1A] text-[#888888] hover:text-amber-400 transition-colors"
                            title="Generate Signed Access Link"
                          >
                            <Key size={13} />
                          </button>
                        )}

                        {/* Direct Download */}
                        {file.downloadUrl && (
                          <a
                            href={file.downloadUrl}
                            download={file.filename}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 border border-[#222222] bg-[#111111] hover:bg-[#1A1A1A] text-[#888888] hover:text-[#F5F5F5] transition-colors"
                            title="Download file"
                          >
                            <Download size={13} />
                          </a>
                        )}

                        {/* Delete button */}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteTarget(file)}
                            className="p-1.5 border border-[#222222] bg-[#111111] hover:bg-red-950/40 text-[#666666] hover:text-red-400 hover:border-red-900/50 transition-colors"
                            title="Delete file permanently"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UPLOAD MODAL */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl border border-[#222222] bg-[#0C0C0C] text-[#F5F5F5] font-mono shadow-2xl">
            <div className="p-5 border-b border-[#1C1C1C] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud size={18} className="text-emerald-400" />
                <h3 className="font-bold uppercase tracking-wider text-sm">Upload Storage Asset</h3>
              </div>
              <button
                onClick={() => !uploading && setUploadOpen(false)}
                className="text-[#666666] hover:text-[#F5F5F5]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStartUpload} className="p-6 space-y-5">
              {/* File Drop / Select Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#282828] hover:border-emerald-500/60 bg-[#111111] p-6 text-center cursor-pointer transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFiles([e.target.files[0]]);
                    }
                  }}
                />
                <UploadCloud size={32} className="mx-auto text-[#666666] mb-2" />
                {uploadFiles.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-emerald-400 font-bold text-xs">{uploadFiles[0].name}</p>
                    <p className="text-[11px] text-[#888888]">{formatBytes(uploadFiles[0].size)}</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs text-[#CCCCCC]">Click or drag a file to stage for upload</p>
                    <p className="text-[10px] text-[#666666]">
                      Images up to 10MB • Documents up to 25MB • Audio up to 500MB
                    </p>
                  </div>
                )}
              </div>

              {/* Category & Visibility Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-[#888888] uppercase mb-1.5">
                    Storage Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as StorageCategory)}
                    className="w-full bg-[#141414] border border-[#222222] text-[#E5E5E5] text-xs px-3 py-2 focus:border-emerald-500 focus:outline-none"
                  >
                    {CATEGORIES.filter((c) => c.id !== 'ALL').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[#888888] uppercase mb-1.5">
                    Access Visibility
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setUploadVisibility('PUBLIC')}
                      className={`py-2 px-3 border text-xs flex items-center justify-center gap-1.5 ${
                        uploadVisibility === 'PUBLIC'
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-bold'
                          : 'border-[#222222] bg-[#141414] text-[#666666]'
                      }`}
                    >
                      <Globe size={12} />
                      <span>PUBLIC</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadVisibility('PRIVATE')}
                      className={`py-2 px-3 border text-xs flex items-center justify-center gap-1.5 ${
                        uploadVisibility === 'PRIVATE'
                          ? 'border-amber-500 bg-amber-950/40 text-amber-300 font-bold'
                          : 'border-[#222222] bg-[#141414] text-[#666666]'
                      }`}
                    >
                      <Lock size={12} />
                      <span>PRIVATE</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Owner ID & Subtype */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-[#888888] uppercase mb-1.5">
                    Owner / Entity ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. artist-123 or rel-456"
                    value={uploadOwnerId}
                    onChange={(e) => setUploadOwnerId(e.target.value)}
                    className="w-full bg-[#141414] border border-[#222222] text-[#E5E5E5] text-xs px-3 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#888888] uppercase mb-1.5">
                    Sub-folder / Type (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. profile, artwork, masters"
                    value={uploadSubType}
                    onChange={(e) => setUploadSubType(e.target.value)}
                    className="w-full bg-[#141414] border border-[#222222] text-[#E5E5E5] text-xs px-3 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description & Tags */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] text-[#888888] uppercase mb-1.5">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Brief description of this asset..."
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    className="w-full bg-[#141414] border border-[#222222] text-[#E5E5E5] text-xs px-3 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#888888] uppercase mb-1.5">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2026, master, punjabi, final"
                    value={uploadTags}
                    onChange={(e) => setUploadTags(e.target.value)}
                    className="w-full bg-[#141414] border border-[#222222] text-[#E5E5E5] text-xs px-3 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Direct R2 Mode Toggle */}
              <div className="p-3 border border-[#222222] bg-[#111111] flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#E5E5E5]">Direct Browser-to-R2 Upload</span>
                  <p className="text-[10px] text-[#777777]">
                    Uses pre-signed PUT URLs to stream large files without server timeouts.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={useDirectR2}
                  onChange={(e) => setUseDirectR2(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Progress bar */}
              {uploading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-[#888888]">
                    <span>Uploading object to R2...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1C1C1C] overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1C1C1C]">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => setUploadOpen(false)}
                  className="px-4 py-2 border border-[#222222] bg-[#141414] hover:bg-[#1C1C1C] text-xs text-[#888888] uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || uploadFiles.length === 0}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-xs uppercase flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>STREAMING...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={14} />
                      <span>COMMIT UPLOAD</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-2xl border border-[#222222] bg-[#0C0C0C] text-[#F5F5F5] font-mono shadow-2xl">
            <div className="p-4 border-b border-[#1C1C1C] flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {getFileIcon(previewFile.mimeType, previewFile.category)}
                <h3 className="font-bold text-xs uppercase truncate max-w-md">
                  {previewFile.filename}
                </h3>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-[#666666] hover:text-[#F5F5F5]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Media viewer */}
              <div className="bg-[#111111] border border-[#222222] p-4 flex items-center justify-center min-h-[220px]">
                {previewFile.mimeType.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewFile.publicUrl || previewFile.downloadUrl || ''}
                    alt={previewFile.filename}
                    className="max-h-[350px] max-w-full object-contain"
                  />
                ) : previewFile.mimeType.startsWith('audio/') ? (
                  <div className="w-full space-y-3 text-center">
                    <Music size={40} className="mx-auto text-emerald-400" />
                    <audio
                      controls
                      src={previewFile.publicUrl || previewFile.downloadUrl || ''}
                      className="w-full mt-2"
                    >
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                ) : (
                  <div className="text-center space-y-2 text-[#777777]">
                    <FileText size={48} className="mx-auto text-amber-400" />
                    <p className="text-xs text-[#CCCCCC]">Document / Binary Asset</p>
                    <p className="text-[11px] text-[#666666]">{previewFile.mimeType}</p>
                  </div>
                )}
              </div>

              {/* Metadata Details */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-[#141414] p-4 border border-[#222222]">
                <div>
                  <span className="text-[#666666] block text-[10px] uppercase">Object Key</span>
                  <span className="text-[#CCCCCC] break-all">{previewFile.objectKey}</span>
                </div>
                <div>
                  <span className="text-[#666666] block text-[10px] uppercase">File Size</span>
                  <span className="text-[#CCCCCC]">{formatBytes(previewFile.size)}</span>
                </div>
                <div>
                  <span className="text-[#666666] block text-[10px] uppercase">Visibility</span>
                  <span className="text-emerald-400">{previewFile.visibility}</span>
                </div>
                <div>
                  <span className="text-[#666666] block text-[10px] uppercase">Created</span>
                  <span className="text-[#CCCCCC]">{formatDate(previewFile.createdAt)}</span>
                </div>
              </div>

              {/* Action row */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {previewFile.publicUrl && (
                  <button
                    onClick={() => handleCopy(previewFile.publicUrl!, 'Public URL')}
                    className="px-3 py-1.5 border border-[#222222] bg-[#141414] hover:bg-[#1C1C1C] text-xs text-[#CCCCCC] flex items-center gap-1.5"
                  >
                    <Copy size={13} />
                    <span>Copy Public URL</span>
                  </button>
                )}

                {(previewFile.downloadUrl || previewFile.publicUrl) && (
                  <a
                    href={previewFile.downloadUrl || previewFile.publicUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={previewFile.filename}
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1.5"
                  >
                    <Download size={13} />
                    <span>Download File</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIGNED URL MODAL */}
      {signedUrlFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg border border-[#222222] bg-[#0C0C0C] text-[#F5F5F5] font-mono shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1C1C1C] pb-3">
              <div className="flex items-center gap-2">
                <Key size={16} className="text-amber-400" />
                <h3 className="font-bold text-xs uppercase">Temporary Signed Access Link</h3>
              </div>
              <button
                onClick={() => setSignedUrlFile(null)}
                className="text-[#666666] hover:text-[#F5F5F5]"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#AAAAAA]">
              Private assets are protected by default. This temporary pre-signed URL allows authorized download directly from Cloudflare R2.
            </p>

            {signedUrlFile.loading ? (
              <div className="py-8 flex items-center justify-center gap-2 text-xs text-[#888888]">
                <Loader2 size={16} className="animate-spin text-amber-400" />
                <span>Signing access token...</span>
              </div>
            ) : signedUrlFile.url ? (
              <div className="space-y-3">
                <div className="p-3 bg-[#111111] border border-[#222222] break-all text-[11px] text-amber-200 max-h-28 overflow-y-auto">
                  {signedUrlFile.url}
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#777777]">
                  <span>Valid for: 1 hour (3600s)</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(signedUrlFile.url!, 'Signed URL')}
                      className="px-3 py-1.5 border border-[#222222] bg-[#161616] hover:bg-[#202020] text-xs text-[#CCCCCC] flex items-center gap-1.5"
                    >
                      <Copy size={13} />
                      <span>Copy Link</span>
                    </button>
                    <a
                      href={signedUrlFile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5"
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md border border-red-900/50 bg-[#0C0C0C] text-[#F5F5F5] font-mono shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-400 border-b border-red-900/30 pb-3">
              <Trash2 size={18} />
              <h3 className="font-bold text-xs uppercase tracking-wider">Confirm Permanent Deletion</h3>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-[#CCCCCC]">
                Are you sure you want to permanently delete this object from Cloudflare R2 and the database?
              </p>
              <div className="p-3 bg-[#141414] border border-[#222222] text-[11px] space-y-1">
                <p className="text-white font-bold">{deleteTarget.filename}</p>
                <p className="text-[#666666]">{deleteTarget.objectKey}</p>
              </div>
              <p className="text-red-400 text-[11px]">
                This action is irreversible and will remove the file from all CDN caches.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-[#222222] bg-[#141414] hover:bg-[#1C1C1C] text-xs text-[#888888] uppercase"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Delete Object</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
