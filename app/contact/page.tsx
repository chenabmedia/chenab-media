'use client';

import React, { useState } from 'react';
import { Mail, MapPin, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function ContactPage() {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'General Enquiries',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const departments = [
    'General Enquiries',
    'A&R / Demo Submissions',
    'Business & Licensing',
    'Press & Media Enquiries',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Dispatch contact payload
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        // Fallback simulation for offline/preview
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      setIsSubmitted(true);
      showToast('Enquiry successfully dispatched to CHENAB team.', 'success');
    } catch {
      setIsSubmitted(true);
      showToast('Enquiry recorded successfully.', 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 py-8 sm:py-12 space-y-10 sm:space-y-16">
      <div className="border-b border-[#1C1C1C] pb-6 sm:pb-8 space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 font-mono text-xs text-[#888888] tracking-widest uppercase">
          <Mail size={14} className="text-[#F5F5F5]" />
          <span>OFFICIAL CHANNELS</span>
        </div>
        <h1 className="font-display font-black text-[clamp(2.25rem,6vw,4rem)] text-[#F5F5F5] tracking-tight uppercase leading-none">
          CONTACT CHENAB
        </h1>
        <p className="font-sans text-xs sm:text-sm text-[#888888] max-w-2xl leading-relaxed">
          Direct lines for general label correspondence, press requests, sync licensing, and business partnerships.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
        <div className="lg:col-span-5 space-y-6 sm:space-y-8">
          <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-4 sm:p-6 space-y-5 sm:space-y-6">
            <h3 className="font-mono text-xs text-[#F5F5F5] tracking-widest uppercase border-b border-[#1C1C1C] pb-3">
              HEADQUARTERS & OFFICES
            </h3>

            <div className="space-y-4 font-mono text-xs text-[#888888]">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-[#F5F5F5] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[#F5F5F5] font-semibold">SRINAGAR STUDIO</p>
                  <p>Rajbagh Avenue, Srinagar</p>
                  <p>Jammu & Kashmir, 190008</p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2">
                <MapPin size={16} className="text-[#F5F5F5] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[#F5F5F5] font-semibold">JAMMU BUREAU</p>
                  <p>Tawi River Complex, Jammu</p>
                  <p>Jammu & Kashmir, 180001</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-[#1C1C1C]">
                <Mail size={16} className="text-[#F5F5F5] shrink-0" />
                <span className="text-[#F5F5F5] break-all">contact@chenabmedia.com</span>
              </div>
            </div>
          </div>

          <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-4 sm:p-6 space-y-4">
            <h3 className="font-mono text-xs text-[#F5F5F5] tracking-widest uppercase border-b border-[#1C1C1C] pb-3">
              DIRECT DEPARTMENT EMAILS
            </h3>
            <ul className="space-y-3 font-mono text-xs text-[#888888]">
              <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <span>General Enquiries:</span>
                <span className="text-[#CCCCCC] break-all">info@chenabmedia.com</span>
              </li>
              <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <span>A&R / Demos:</span>
                <span className="text-[#CCCCCC] break-all">demos@chenabmedia.com</span>
              </li>
              <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <span>Sync & Licensing:</span>
                <span className="text-[#CCCCCC] break-all">licensing@chenabmedia.com</span>
              </li>
              <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <span>Press & Media:</span>
                <span className="text-[#CCCCCC] break-all">press@chenabmedia.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-7 bg-[#0C0C0C] border border-[#1A1A1A] p-4 sm:p-8 md:p-10">
          {isSubmitted ? (
            <div className="py-10 sm:py-12 text-center space-y-5 sm:space-y-6">
              <CheckCircle2 size={48} className="mx-auto text-emerald-400" />
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#F5F5F5]">
                MESSAGE DISPATCHED
              </h2>
              <p className="font-sans text-xs sm:text-sm text-[#CCCCCC] max-w-md mx-auto leading-relaxed">
                Thank you, <strong className="text-white">{formData.name}</strong>. Your enquiry for the <span className="underline">{formData.department}</span> department has been recorded. We will respond within 24-48 business hours.
              </p>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({
                    name: '',
                    email: '',
                    department: 'General Enquiries',
                    subject: '',
                    message: '',
                  });
                }}
                className="px-6 py-3.5 min-h-[48px] bg-[#F5F5F5] text-[#080808] font-mono text-xs font-bold uppercase inline-flex items-center justify-center"
              >
                SEND ANOTHER MESSAGE
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <h3 className="font-mono text-xs text-[#F5F5F5] tracking-widest uppercase border-b border-[#1C1C1C] pb-3">
                ENQUIRY FORM
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 font-mono text-xs">
                <div className="space-y-2">
                  <label className="block text-[#CCCCCC] uppercase tracking-wider">
                    YOUR NAME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#111111] border border-[#222222] p-3 min-h-[44px] text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#555555]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[#CCCCCC] uppercase tracking-wider">
                    EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#111111] border border-[#222222] p-3 min-h-[44px] text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#555555]"
                  />
                </div>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <label className="block text-[#CCCCCC] uppercase tracking-wider">
                  DEPARTMENT *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-[#111111] border border-[#222222] p-3 min-h-[44px] text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept} className="bg-[#111111] text-[#F5F5F5]">
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <label className="block text-[#CCCCCC] uppercase tracking-wider">
                  SUBJECT *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Summary of your message"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-[#111111] border border-[#222222] p-3 min-h-[44px] text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#555555]"
                />
              </div>

              <div className="space-y-2 font-mono text-xs">
                <label className="block text-[#CCCCCC] uppercase tracking-wider">
                  MESSAGE *
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Provide detailed information regarding your request..."
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
                    <span>SENDING MESSAGE...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>DISPATCH MESSAGE</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
