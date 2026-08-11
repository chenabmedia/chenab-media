'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/auth';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, userProfile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || '/')}`);
    }
  }, [loading, user, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="w-8 h-8 text-[#F5F5F5] animate-spin" />
        <p className="font-mono text-xs uppercase tracking-widest text-[#888888]">
          VERIFYING CHENAB AUTHORIZATION...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!userProfile) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 border border-red-900/30 bg-[#0C0C0C] text-center space-y-6 font-mono text-xs">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-950/40 border border-red-900/50 flex items-center justify-center text-red-400">
          <ShieldAlert size={20} />
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-red-400">
            ACCOUNT NOT PROVISIONED
          </h2>
          <p className="text-[#A0A0A0] leading-relaxed">
            Your CHENAB portal account has not been activated. Contact CHENAB administration.
          </p>
        </div>
        <div className="pt-4 flex flex-col gap-3">
          <a
            href="/"
            className="py-2.5 px-4 bg-[#111111] border border-[#222222] text-[#F5F5F5] hover:border-[#444444] transition-colors uppercase font-bold"
          >
            RETURN TO MAIN SITE
          </a>
          <button
            onClick={() => signOut()}
            className="py-2.5 px-4 bg-transparent border border-red-900/40 text-red-400 hover:bg-red-950/30 transition-colors uppercase font-bold"
          >
            LOG OUT
          </button>
        </div>
      </div>
    );
  }

  if (userProfile?.status === 'DISABLED' || userProfile?.status === 'SUSPENDED') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 border border-red-900/30 bg-[#0C0C0C] text-center space-y-6 font-mono text-xs">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-950/40 border border-red-900/50 flex items-center justify-center text-red-400">
          <ShieldAlert size={20} />
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-red-400">
            ACCOUNT SUSPENDED / DISABLED
          </h2>
          <p className="text-[#A0A0A0] leading-relaxed">
            Your account ({userProfile?.email}) has been disabled or suspended. Administrative privileges are currently revoked.
          </p>
        </div>
        <div className="pt-4 flex flex-col gap-3">
          <a
            href="/"
            className="py-2.5 px-4 bg-[#111111] border border-[#222222] text-[#F5F5F5] hover:border-[#444444] transition-colors uppercase font-bold"
          >
            RETURN TO MAIN SITE
          </a>
          <button
            onClick={() => signOut()}
            className="py-2.5 px-4 bg-transparent border border-red-900/40 text-red-400 hover:bg-red-950/30 transition-colors uppercase font-bold"
          >
            LOG OUT
          </button>
        </div>
      </div>
    );
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = userProfile?.role || 'artist';
    const isAuthorized = allowedRoles.includes(userRole);

    if (!isAuthorized) {
      return (
        <div className="max-w-md mx-auto my-16 p-8 border border-red-900/30 bg-[#0C0C0C] text-center space-y-6 font-mono text-xs">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-950/40 border border-red-900/50 flex items-center justify-center text-red-400">
            <ShieldAlert size={20} />
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-red-400">
              RESTRICTED PORTAL AREA
            </h2>
            <p className="text-[#A0A0A0] leading-relaxed">
              Your account ({userProfile?.email}) is configured as{' '}
              <span className="text-[#F5F5F5] uppercase font-bold">[{userRole}]</span> role. You
              do not possess the required credentials for this portal section.
            </p>
          </div>
          <div className="pt-4 flex flex-col gap-3">
            <a
              href="/"
              className="py-2.5 px-4 bg-[#111111] border border-[#222222] text-[#F5F5F5] hover:border-[#444444] transition-colors uppercase font-bold"
            >
              RETURN TO MAIN SITE
            </a>
            <button
              onClick={() => signOut()}
              className="py-2.5 px-4 bg-transparent border border-red-900/40 text-red-400 hover:bg-red-950/30 transition-colors uppercase font-bold"
            >
              SWITCH ACCOUNT / LOG OUT
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
