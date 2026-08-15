'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserProfile } from '@/types/auth';
import {
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  LogOut,
  Mail,
  Loader2,
  Key,
} from 'lucide-react';

function resolveTargetPortal(userProfile: UserProfile | null, redirectParam?: string | null): string | null {
  if (!userProfile) return null;

  if (userProfile.status === 'DISABLED' || userProfile.status === 'SUSPENDED') {
    return null;
  }

  const role = userProfile.role;
  const defaultPortal = role === 'admin' ? '/admin' : role === 'executive' ? '/executive' : '/artist';

  if (!redirectParam) return defaultPortal;

  let decoded = redirectParam.trim();
  try {
    decoded = decodeURIComponent(redirectParam).trim();
  } catch {
    // fallback
  }

  // Ensure redirectParam is a safe relative path
  if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded === '/login' || decoded === '/') {
    return defaultPortal;
  }

  // Validate path permission based on role
  if (role === 'admin' && decoded.startsWith('/admin')) {
    return decoded;
  }
  if (role === 'executive' && (decoded.startsWith('/executive') || decoded.startsWith('/admin'))) {
    return decoded;
  }
  if (role === 'artist' && decoded.startsWith('/artist')) {
    return decoded;
  }

  return defaultPortal;
}

function LoginContent() {
  const {
    user,
    userProfile,
    loading,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    error: authError,
    clearError,
  } = useAuth();

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [mode, setMode] = useState<'signin' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Auto-redirect if user is already authenticated with an active profile
  useEffect(() => {
    if (!loading && user && userProfile && userProfile.status !== 'DISABLED' && userProfile.status !== 'SUSPENDED') {
      const destination = resolveTargetPortal(userProfile, redirectParam);
      if (destination) {
        router.replace(destination);
      }
    }
  }, [loading, user, userProfile, router, redirectParam]);

  const handleToggleMode = (newMode: 'signin' | 'forgot') => {
    setMode(newMode);
    clearError();
    setLocalError(null);
    setSuccessNotice(null);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleSubmitting(true);
    setLocalError(null);
    setSuccessNotice(null);
    clearError();

    try {
      const profile = await signInWithGoogle();
      if (profile && profile.status !== 'DISABLED' && profile.status !== 'SUSPENDED') {
        const destination = resolveTargetPortal(profile, redirectParam) || '/admin';
        router.replace(destination);
      }
    } catch (err: any) {
      setLocalError(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLocalError(null);
    setSuccessNotice(null);
    clearError();

    try {
      if (mode === 'signin') {
        const profile = await signIn(email, password);
        if (profile && profile.status !== 'DISABLED' && profile.status !== 'SUSPENDED') {
          const destination = resolveTargetPortal(profile, redirectParam) || '/admin';
          router.replace(destination);
        }
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessNotice(
          'Security key reset link has been dispatched to your email address.'
        );
      }
    } catch (err: any) {
      setLocalError(err.message || 'Operation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user && !userProfile) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 space-y-8 font-mono">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full border border-red-900/60 bg-[#0C0C0C] flex items-center justify-center text-red-400">
            <AlertCircle size={22} />
          </div>
          <h1 className="font-display font-extrabold text-3xl text-[#F5F5F5] tracking-tight uppercase">
            ACCOUNT NOT PROVISIONED
          </h1>
          <p className="text-xs text-[#888888]">
            Your CHENAB portal account has not been activated. Contact CHENAB administration.
          </p>
        </div>

        <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-6 space-y-6 text-xs">
          <p className="text-[#A0A0A0] leading-relaxed">
            Authenticated as <span className="text-[#F5F5F5] font-bold">{user.email}</span>, but no active role or profile has been provisioned in the CHENAB roster system.
          </p>
          <button
            onClick={() => signOut()}
            className="w-full py-3 bg-[#111111] border border-[#222222] text-red-400 font-bold uppercase tracking-widest hover:bg-red-950/20 hover:border-red-900/50 transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={14} />
            <span>SIGN OUT / TRY ANOTHER ACCOUNT</span>
          </button>
        </div>
      </div>
    );
  }

  if (user && (userProfile?.status === 'DISABLED' || userProfile?.status === 'SUSPENDED')) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 space-y-8 font-mono">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full border border-red-900/60 bg-[#0C0C0C] flex items-center justify-center text-red-400">
            <AlertCircle size={22} />
          </div>
          <h1 className="font-display font-extrabold text-3xl text-[#F5F5F5] tracking-tight uppercase">
            ACCOUNT SUSPENDED
          </h1>
          <p className="text-xs text-[#888888]">
            This portal account has been suspended or disabled by CHENAB administration.
          </p>
        </div>

        <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-6 space-y-6 text-xs">
          <button
            onClick={() => signOut()}
            className="w-full py-3 bg-[#111111] border border-[#222222] text-red-400 font-bold uppercase tracking-widest hover:bg-red-950/20 hover:border-red-900/50 transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={14} />
            <span>SIGN OUT</span>
          </button>
        </div>
      </div>
    );
  }

  if (user && userProfile) {
    const roleBadge = userProfile.role.toUpperCase();
    const portalLink = resolveTargetPortal(userProfile, redirectParam) || (
      userProfile.role === 'admin'
        ? '/admin'
        : userProfile.role === 'executive'
        ? '/executive'
        : '/artist'
    );

    return (
      <div className="max-w-md mx-auto px-6 py-16 space-y-8 font-mono">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full border border-emerald-900/60 bg-[#0C0C0C] flex items-center justify-center text-emerald-400">
            <UserCheck size={22} />
          </div>
          <h1 className="font-display font-extrabold text-3xl text-[#F5F5F5] tracking-tight uppercase">
            PORTAL AUTHENTICATED
          </h1>
          <p className="text-xs text-[#888888]">
            ACTIVE SESSION DETECTED FOR CHENAB MEDIA
          </p>
        </div>

        <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-6 space-y-6">
          <div className="space-y-3 border-b border-[#1C1C1C] pb-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#888888]">CURRENT USER</span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-[#1A1A1A] text-emerald-400 border border-emerald-900/50 uppercase rounded-xs">
                [{roleBadge}]
              </span>
            </div>
            <p className="text-sm font-bold text-[#F5F5F5] truncate">{userProfile.email}</p>
            {userProfile.displayName && (
              <p className="text-xs text-[#A0A0A0]">{userProfile.displayName}</p>
            )}
          </div>

          <div className="space-y-3">
            <Link
              href={portalLink}
              className="w-full py-3 bg-[#F5F5F5] text-[#080808] text-xs font-bold uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2"
            >
              <span>ACCESS {roleBadge} DASHBOARD</span>
              <ArrowRight size={14} />
            </Link>

            <button
              onClick={() => signOut()}
              className="w-full py-3 bg-[#111111] border border-[#222222] text-red-400 text-xs font-bold uppercase tracking-widest hover:bg-red-950/20 hover:border-red-900/50 transition-all flex items-center justify-center gap-2"
            >
              <LogOut size={14} />
              <span>TERMINATE SESSION / SIGN OUT</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeError = localError || authError;

  return (
    <div className="max-w-md mx-auto px-6 py-16 space-y-8 font-mono">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full border border-[#222222] bg-[#0C0C0C] flex items-center justify-center text-[#F5F5F5]">
          <Lock size={20} />
        </div>
        <h1 className="font-display font-extrabold text-3xl text-[#F5F5F5] tracking-tight uppercase">
          CHENAB PORTAL
        </h1>
        <p className="text-xs text-[#888888]">
          AUTHENTICATION FOR ROSTER ARTISTS, A&R & ADMINISTRATION
        </p>
      </div>

      {activeError && (
        <div className="border border-red-900/50 bg-red-950/30 p-4 text-xs text-red-300 flex items-start gap-3">
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <span>{activeError}</span>
        </div>
      )}

      {successNotice && (
        <div className="border border-emerald-900/50 bg-emerald-950/30 p-4 text-xs text-emerald-300 flex items-start gap-3">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
          <span>{successNotice}</span>
        </div>
      )}

      <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-6 space-y-6">
        {/* Google One-Click Authentication */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting || isGoogleSubmitting}
            className="w-full py-3.5 bg-[#151515] border border-[#2A2A2A] text-[#F5F5F5] text-xs font-bold uppercase tracking-widest hover:bg-[#1F1F1F] hover:border-[#3A3A3A] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isGoogleSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin text-[#F5F5F5]" />
                <span>AUTHENTICATING WITH GOOGLE...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>CONTINUE WITH GOOGLE</span>
              </>
            )}
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#1C1C1C] w-full" />
          <span className="bg-[#0C0C0C] px-3 text-[10px] uppercase text-[#666666] tracking-widest absolute">
            OR SECURITY CREDENTIALS
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2 text-xs">
            <label className="block text-[#CCCCCC] uppercase tracking-wider">
              PORTAL EMAIL ADDRESS
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="artist@chenabmedia.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] p-3 pl-10 text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#555555]"
              />
              <Mail size={14} className="absolute left-3.5 top-3.5 text-[#666666]" />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <label className="block text-[#CCCCCC] uppercase tracking-wider">
                  SECURITY KEY / PASSWORD
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => handleToggleMode('forgot')}
                    className="text-[11px] text-[#888888] hover:text-[#CCCCCC] underline"
                  >
                    FORGOT KEY?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#111111] border border-[#222222] p-3 pl-10 text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#555555]"
                />
                <Key size={14} className="absolute left-3.5 top-3.5 text-[#666666]" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isGoogleSubmitting}
            className="w-full py-3.5 bg-[#F5F5F5] text-[#080808] text-xs font-bold uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin text-[#080808]" />
                <span>
                  {mode === 'signin'
                    ? 'VERIFYING CREDENTIALS...'
                    : 'DISPATCHING RESET EMAIL...'}
                </span>
              </>
            ) : (
              <>
                <span>
                  {mode === 'signin'
                    ? 'AUTHENTICATE WITH KEY'
                    : 'DISPATCH RESET LINK'}
                </span>
                <ArrowRight size={14} />
              </>
            )}
          </button>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => handleToggleMode('signin')}
              className="w-full text-center text-xs text-[#888888] hover:text-[#F5F5F5] underline pt-2"
            >
              RETURN TO SIGN IN
            </button>
          )}
        </form>
      </div>

      <div className="border-t border-[#1C1C1C] pt-6 text-[11px] text-[#666666] text-center space-y-1">
        <p>CHENAB MEDIA INTERNAL SYSTEMS &bull; ENCRYPTED</p>
        <p>
          FOR UNAUTHENTICATED DEMO SUBMISSIONS, USE THE PUBLIC{' '}
          <Link href="/demo" className="text-[#999999] underline">
            DEMO PORTAL
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4 font-mono">
          <Loader2 className="w-8 h-8 text-[#F5F5F5] animate-spin" />
          <p className="text-xs uppercase tracking-widest text-[#888888]">
            VERIFYING CHENAB SESSION...
          </p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
