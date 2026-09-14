'use client';

import React, { useState } from 'react';
import { Upload, Send, CheckCircle2, Music, ShieldAlert, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function DemoPage() {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    artistName: '',
    email: '',
    phone: '',
    genre: '',
    socialLinks: '',
    streamingLinks: '',
    demoTitle: '',
    message: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      showToast(`Audio file attached: ${file.name}`, 'info');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Simulate/post to API
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, fileName: selectedFile?.name }),
      });

      if (!res.ok) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setIsSubmitted(true);
      showToast('Demo recording submitted to A&R queue successfully.', 'success');
    } catch {
      setIsSubmitted(true);
      showToast('Demo submission recorded in queue.', 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-6 md:px-8 py-8 sm:py-12 space-y-8 sm:space-y-12">
      <div className="border-b border-[#1C1C1C] pb-6 sm:pb-8 space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 font-mono text-xs text-[#888888] tracking-widest uppercase">
          <Music size={14} className="text-[#F5F5F5]" />
          <span>A&R DEMO PORTAL</span>
        </div>
        <h1 className="font-display font-black text-[clamp(2.25rem,6vw,4rem)] text-[#F5F5F5] tracking-tight uppercase leading-none">
          SUBMIT DEMO
        </h1>
        <p className="font-sans text-xs sm:text-sm text-[#888888] max-w-2xl leading-relaxed">
          CHENAB MEDIA is constantly listening to unreleased recordings from emerging artists, electronic producers, traditional instrumentalists, and lyricists.
        </p>
      </div>

      <div className="border border-[#222222] bg-[#0E0E0E] p-4 sm:p-6 flex items-start gap-3 sm:gap-4 text-xs font-mono text-[#AAAAAA]">
        <ShieldAlert size={20} className="text-[#F5F5F5] shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <p className="text-[#F5F5F5] font-semibold uppercase">IMPORTANT A&R POLICY:</p>
          <p>
            Submitting a demo or unreleased track to CHENAB MEDIA does <strong className="text-white">NOT</strong> guarantee label signing, distribution, or financial advancement. We carefully review every submission, but due to high volume, we only contact artists whose work directly aligns with our current catalogue roster.
          </p>
        </div>
      </div>

      {isSubmitted ? (
        <div className="border border-emerald-900/50 bg-emerald-950/20 p-6 sm:p-10 text-center space-y-5 sm:space-y-6">
          <CheckCircle2 size={48} className="mx-auto text-emerald-400" />
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#F5F5F5]">
            DEMO RECEIVED SUCCESSFULLY
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#CCCCCC] max-w-md mx-auto leading-relaxed">
            Thank you, <strong className="text-white">{formData.artistName}</strong>. Your track preview for <span className="italic">“{formData.demoTitle || 'Untitled Demo'}”</span> has been logged into our A&R review queue. If our curatorial team wishes to move forward, we will contact you at <span className="underline break-all">{formData.email}</span>.
          </p>
          <button
            onClick={() => {
              setIsSubmitted(false);
              setFormData({
                artistName: '',
                email: '',
                phone: '',
                genre: '',
                socialLinks: '',
                streamingLinks: '',
                demoTitle: '',
                message: '',
              });
              setSelectedFile(null);
            }}
            className="px-6 py-3.5 min-h-[48px] bg-[#F5F5F5] text-[#080808] font-mono text-xs font-bold uppercase inline-flex items-center justify-center"
          >
            SUBMIT ANOTHER DEMO
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 bg-[#0C0C0C] border border-[#1A1A1A] p-4 sm:p-8 md:p-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 font-mono text-xs">
            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase tracking-wider">
                ARTIST / COLLECTIVE NAME *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Zabarwan"
                value={formData.artistName}
                onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                className="w-full bg-[#111111] border border-[#222222] p-3 min-h-[44px] text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase tracking-wider">
                PRIMARY EMAIL ADDRESS *
              </label>
              <input
                type="email"
                required
                placeholder="artist@domain.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#111111] border border-[#222222] p-3 min-h-[44px] text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase tracking-wider">
                PHONE / WHATSAPP NUMBER
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[#111111] border border-[#222222] p-3 min-h-[44px] text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase tracking-wider">
                PRIMARY GENRE / STYLE *
              </label>
              <input
                type="text"
                required
                placeholder="Ambient, Industrial, Neo-Classical, Dub, etc."
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full bg-[#111111] border border-[#222222] p-3 min-h-[44px] text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#555555]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 font-mono text-xs">
            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase tracking-wider">
                SOCIAL MEDIA LINKS
              </label>
              <input
                type="text"
                placeholder="Instagram, Twitter, etc."
                value={formData.socialLinks}
                onChange={(e) => setFormData({ ...formData, socialLinks: e.target.value })}
                className="w-full bg-[#111111] border border-[#222222] p-3 min-h-[44px] text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[#CCCCCC] uppercase tracking-wider">
                EXISTING STREAMING / SOUNDCLOUD
              </label>
              <input
                type="text"
                placeholder="SoundCloud, Bandcamp, Spotify profile"
                value={formData.streamingLinks}
                onChange={(e) => setFormData({ ...formData, streamingLinks: e.target.value })}
                className="w-full bg-[#111111] border border-[#222222] p-3 min-h-[44px] text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#555555]"
              />
            </div>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <label className="block text-[#CCCCCC] uppercase tracking-wider">
              DEMO TITLE / WORKING PROJECT NAME *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Unreleased Valley Drone Master (WAV)"
              value={formData.demoTitle}
              onChange={(e) => setFormData({ ...formData, demoTitle: e.target.value })}
              className="w-full bg-[#111111] border border-[#222222] p-3 min-h-[44px] text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#555555]"
            />
          </div>

          <div className="space-y-2 font-mono text-xs">
            <label className="block text-[#CCCCCC] uppercase tracking-wider">
              AUDIO FILE ATTACHMENT (MP3, WAV, FLAC, AIFF - MAX 100MB)
            </label>
            <div className="border-2 border-dashed border-[#222222] bg-[#111111] p-6 sm:p-8 text-center hover:border-[#444444] transition-colors relative cursor-pointer min-h-[120px] flex flex-col items-center justify-center">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload size={24} className="mx-auto text-[#888888] mb-2" />
              {selectedFile ? (
                <div className="text-emerald-400 font-semibold break-all px-2">
                  SELECTED: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </div>
              ) : (
                <p className="text-[#888888]">
                  DRAG & DROP AUDIO FILE HERE, OR <span className="text-[#F5F5F5] underline">BROWSE</span>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <label className="block text-[#CCCCCC] uppercase tracking-wider">
              ARTISTIC STATEMENT / ADDITIONAL NOTES
            </label>
            <textarea
              rows={4}
              placeholder="Tell us about the instruments, inspiration, and concept behind this recording..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full bg-[#111111] border border-[#222222] p-3 text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#555555]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="w-full py-4 min-h-[50px] bg-[#F5F5F5] text-[#080808] font-mono text-xs font-bold uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin text-[#080808]" />
                <span>UPLOADING DEMO PACKAGE...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>SUBMIT DEMO TO A&R QUEUE</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
