'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Play, Pause, ShieldCheck, User } from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { useAuth } from '@/context/AuthContext';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pathname = usePathname();
  const { currentTrack, isPlaying, togglePlay } = useAudio();
  const { user, userProfile } = useAuth();

  const userDashboardPath =
    userProfile?.role === 'admin'
      ? '/admin'
      : userProfile?.role === 'executive'
      ? '/executive'
      : '/artist';

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      if (currentScrollY > lastScrollY && currentScrollY > 80 && !isMobileMenuOpen) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isMobileMenuOpen]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'CATALOGUE', path: '/releases' },
    { name: 'ARTISTS', path: '/artists' },
    { name: 'STORY', path: '/story' },
    { name: 'JOURNAL', path: '/journal' },
    { name: 'CONTACT', path: '/contact' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-500 ease-in-out ${
          isHidden ? '-translate-y-full' : 'translate-y-0'
        } ${
          isScrolled
            ? 'bg-[#080808]/90 backdrop-blur-md border-b border-[#1C1C1C]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none"
            aria-label="CHENAB MEDIA Home"
          >
            <span className="font-display font-extrabold text-xl tracking-[0.25em] text-[#F5F5F5] group-hover:text-white transition-colors">
              CHENAB
            </span>
            <span className="font-mono text-[10px] tracking-widest text-[#888888] px-1.5 py-0.5 border border-[#222222] rounded-xs uppercase hidden sm:inline-block">
              MEDIA
            </span>
          </Link>

          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`font-mono text-xs tracking-[0.2em] transition-colors uppercase relative py-1 ${
                    isActive
                      ? 'text-[#F5F5F5] font-semibold'
                      : 'text-[#999999] hover:text-[#F5F5F5]'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#F5F5F5]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center space-x-6">
            {currentTrack && (
              <button
                onClick={togglePlay}
                className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 border border-[#333333] hover:border-[#666666] transition-colors rounded-xs bg-[#111111]"
                title={`Now Playing: ${currentTrack.track.title}`}
              >
                {isPlaying ? <Pause size={12} className="text-emerald-400 animate-pulse" /> : <Play size={12} />}
                <span className="max-w-[120px] truncate text-[#CCCCCC]">{currentTrack.track.title}</span>
              </button>
            )}

            <Link
              href="/demo"
              className="font-mono text-xs tracking-widest px-4 py-2 bg-[#F5F5F5] text-[#080808] font-bold hover:bg-white transition-all uppercase rounded-xs"
            >
              SUBMIT DEMO
            </Link>

            {user ? (
              <Link
                href={userDashboardPath}
                className="flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1 border border-emerald-900/50 bg-[#0C0C0C] text-emerald-400 hover:border-emerald-700 transition-colors rounded-xs"
                title={`Logged in as ${userProfile?.email} [${userProfile?.role.toUpperCase()}]`}
              >
                <ShieldCheck size={14} />
                <span className="uppercase font-bold tracking-wider">[{userProfile?.role}]</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="p-2 text-[#999999] hover:text-[#F5F5F5] transition-colors"
                title="Portal Login"
              >
                <User size={18} />
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3 lg:hidden">
            <Link
              href="/demo"
              className="font-mono text-[11px] tracking-wider px-3 py-1.5 bg-[#F5F5F5] text-[#080808] font-bold rounded-xs"
            >
              DEMO
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-[#F5F5F5] hover:text-white focus:outline-none"
              aria-label="Open Mobile Menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#080808] flex flex-col justify-between p-6 sm:p-10 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-6">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="font-display font-extrabold text-2xl tracking-[0.2em] text-[#F5F5F5]"
            >
              CHENAB
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-[#888888] hover:text-[#F5F5F5] focus:outline-none"
              aria-label="Close Menu"
            >
              <X size={28} />
            </button>
          </div>

          <div className="my-auto py-8 space-y-6">
            {[
              { name: 'CATALOGUE', path: '/releases' },
              { name: 'ARTISTS', path: '/artists' },
              { name: 'STORY / ABOUT', path: '/story' },
              { name: 'JOURNAL', path: '/journal' },
              { name: 'CONTACT', path: '/contact' },
              { name: 'SUBMIT DEMO', path: '/demo' },
              { name: 'PORTAL LOGIN', path: '/login' },
            ].map((link, idx) => (
              <div key={link.path} className="overflow-hidden">
                <Link
                  href={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block font-display font-bold text-3xl sm:text-4xl tracking-wider hover:text-white transition-colors ${
                    pathname === link.path ? 'text-[#F5F5F5] underline underline-offset-8 decoration-1' : 'text-[#777777]'
                  }`}
                >
                  <span className="font-mono text-xs text-[#555555] mr-4 tracking-widest">
                    0{idx + 1}
                  </span>
                  {link.name}
                </Link>
              </div>
            ))}
          </div>

          <div className="border-t border-[#1A1A1A] pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs text-[#666666]">
            <div>
              <p className="text-[#999999]">CHENAB MEDIA — Independent Label</p>
              <p className="text-[11px] mt-1">Srinagar &bull; Jammu &bull; Global</p>
            </div>
            <div className="flex gap-4 tracking-widest text-[#999999]">
              <a href="https://spotify.com" target="_blank" rel="noreferrer" className="hover:text-white">SPOTIFY</a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white">INSTAGRAM</a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-white">YOUTUBE</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
