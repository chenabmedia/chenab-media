'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUp } from 'lucide-react';
import { SiteConfig, DEFAULT_SITE_CONFIG } from '@/types/site';

export const Footer: React.FC = () => {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);

  useEffect(() => {
    fetch('/api/site-config')
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setConfig({ ...DEFAULT_SITE_CONFIG, ...data });
        }
      })
      .catch(() => {});
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const portalAccess = config.footer?.portalAccess || DEFAULT_SITE_CONFIG.footer.portalAccess;

  return (
    <footer className="bg-[#080808] border-t border-[#1C1C1C] pt-12 sm:pt-20 pb-8 sm:pb-12 text-[#999999] font-sans">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12 pb-10 sm:pb-16 border-b border-[#1A1A1A]">
          <div className="md:col-span-5 space-y-4 sm:space-y-6">
            <Link href="/" className="inline-block py-1">
              <span className="font-display font-extrabold text-xl sm:text-2xl tracking-[0.2em] sm:tracking-[0.25em] text-[#F5F5F5]">
                {config.siteName || 'CHENAB MEDIA'}
              </span>
            </Link>
            <p className="text-xs sm:text-sm leading-relaxed text-[#888888] max-w-md font-sans">
              {config.footer?.description || config.siteDescription}
            </p>
            <div className="flex items-center gap-2.5 font-mono text-[11px] sm:text-xs text-[#666666]">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Catalogues CHNB-001 through CHNB-006 active</span>
            </div>
          </div>

          <div className="md:col-span-3 space-y-3 sm:space-y-4">
            <h4 className="font-mono text-xs tracking-[0.2em] text-[#F5F5F5] uppercase">
              Navigation
            </h4>
            <ul className="space-y-2 sm:space-y-2.5 font-mono text-xs text-[#888888]">
              {config.navigation
                .filter((item) => item.enabled)
                .sort((a, b) => a.order - b.order)
                .map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      target={item.openInNewTab ? '_blank' : '_self'}
                      rel={item.openInNewTab ? 'noreferrer' : undefined}
                      className="hover:text-[#F5F5F5] transition-colors py-1 inline-block min-h-[32px] sm:min-h-0"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3 sm:space-y-4">
            <h4 className="font-mono text-xs tracking-[0.2em] text-[#F5F5F5] uppercase">
              Channels & Platforms
            </h4>
            <ul className="space-y-2 sm:space-y-2.5 font-mono text-xs text-[#888888]">
              {config.footer?.socialLinks?.spotify && (
                <li>
                  <a
                    href={config.footer.socialLinks.spotify}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#F5F5F5] transition-colors flex items-center justify-between py-1 min-h-[32px] sm:min-h-0"
                  >
                    <span>Spotify</span>
                    <span className="text-[10px] text-[#555555]">Official Discography</span>
                  </a>
                </li>
              )}
              {config.footer?.socialLinks?.appleMusic && (
                <li>
                  <a
                    href={config.footer.socialLinks.appleMusic}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#F5F5F5] transition-colors flex items-center justify-between py-1 min-h-[32px] sm:min-h-0"
                  >
                    <span>Apple Music</span>
                    <span className="text-[10px] text-[#555555]">Spatial Lossless</span>
                  </a>
                </li>
              )}
              {config.footer?.socialLinks?.youtube && (
                <li>
                  <a
                    href={config.footer.socialLinks.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#F5F5F5] transition-colors flex items-center justify-between py-1 min-h-[32px] sm:min-h-0"
                  >
                    <span>YouTube</span>
                    <span className="text-[10px] text-[#555555]">Visual Sessions</span>
                  </a>
                </li>
              )}
              {config.footer?.socialLinks?.instagram && (
                <li>
                  <a
                    href={config.footer.socialLinks.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#F5F5F5] transition-colors flex items-center justify-between py-1 min-h-[32px] sm:min-h-0"
                  >
                    <span>Instagram</span>
                    <span className="text-[10px] text-[#555555]">Archival Feed</span>
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Discreet Portal Access Buttons at the Very Bottom */}
        <div className="py-5 sm:py-6 border-b border-[#1A1A1A] flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[#777777]">
            <span className="text-[11px] uppercase tracking-wider text-[#555555]">Portals:</span>
            {portalAccess?.admin?.enabled && (
              <Link
                href="/login?portal=admin"
                className="hover:text-[#F5F5F5] transition-colors underline underline-offset-4 decoration-[#333333] py-1 min-h-[32px] inline-flex items-center"
              >
                {portalAccess.admin.label || 'ADMIN PORTAL'}
              </Link>
            )}
            {portalAccess?.artist?.enabled && (
              <Link
                href="/login?portal=artist"
                className="hover:text-[#F5F5F5] transition-colors underline underline-offset-4 decoration-[#333333] py-1 min-h-[32px] inline-flex items-center"
              >
                {portalAccess.artist.label || 'ARTIST PORTAL'}
              </Link>
            )}
          </div>
          <div className="text-[#555555] text-[11px]">SECURE PLATFORM AUTH</div>
        </div>

        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-[#666666] text-center sm:text-left">
          <p>{config.footer?.copyright || config.copyrightText}</p>
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="text-[11px] text-[#555555]">JAMMU & KASHMIR &bull; GLOBAL</span>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-2 hover:text-[#F5F5F5] transition-colors group min-h-[44px] py-1 px-2 cursor-pointer"
            >
              <span>BACK TO TOP</span>
              <ArrowUp size={14} className="group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
