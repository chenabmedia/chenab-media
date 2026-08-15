'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { getDoc, setDoc } from 'firebase/firestore';
import {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  firebaseSignOut,
  sendPasswordResetEmail,
} from '@/lib/firebase/auth';
import { getUserDocRef } from '@/lib/firebase/firestore';
import { UserProfile } from '@/types/auth';
import { determineInitialUserRole, isSuperAdminEmail, createSuperAdminProfile } from '@/lib/auth/bootstrap';
import { ALL_PERMISSIONS } from '@/lib/auth/permissions';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, pass: string) => Promise<UserProfile | null>;
  signUp: (email: string, pass: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<UserProfile | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  clearError: () => void;
  isAdmin: boolean;
  isExecutive: boolean;
  isArtist: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const syncUserProfile = async (firebaseUser: User): Promise<UserProfile | null> => {
    const userRef = getUserDocRef(firebaseUser.uid);
    const isSuperAdmin = isSuperAdminEmail(firebaseUser.email);

    try {
      const snapshot = await getDoc(userRef);

      if (snapshot.exists()) {
        const existingData = snapshot.data() as UserProfile;
        // If super admin email, guarantee admin role, active status and full permissions
        if (isSuperAdmin) {
          if (
            existingData.role !== 'admin' ||
            existingData.status !== 'ACTIVE' ||
            !existingData.permissions ||
            existingData.permissions.length === 0
          ) {
            const upgradedProfile: UserProfile = {
              ...existingData,
              role: 'admin',
              status: 'ACTIVE',
              permissions: ALL_PERMISSIONS,
              updatedAt: new Date().toISOString(),
            };
            try {
              await setDoc(userRef, upgradedProfile, { merge: true });
            } catch (upErr) {
              console.warn('Failed to upgrade super admin profile in Firestore:', upErr);
            }
            return upgradedProfile;
          }
        }
        return existingData;
      } else {
        // Auto-provision bootstrap admin profile if designated super admin
        if (isSuperAdmin && firebaseUser.email) {
          const adminProfile = createSuperAdminProfile(
            firebaseUser.uid,
            firebaseUser.email,
            firebaseUser.displayName,
            firebaseUser.photoURL
          );
          try {
            await setDoc(userRef, adminProfile, { merge: true });
          } catch (createErr) {
            console.warn('Failed to persist bootstrap admin profile to Firestore:', createErr);
          }
          return adminProfile;
        }
        // Public registration disabled: do not auto-create profile for unprovisioned users.
        return null;
      }
    } catch (err) {
      console.warn('Could not sync user profile with Firestore:', err);
      // Failsafe for designated super admins (e.g. zaazze@chenabmedia.in) - never block them
      if (isSuperAdmin && firebaseUser.email) {
        const fallbackProfile = createSuperAdminProfile(
          firebaseUser.uid,
          firebaseUser.email,
          firebaseUser.displayName,
          firebaseUser.photoURL
        );
        try {
          await setDoc(userRef, fallbackProfile, { merge: true });
        } catch (setErr) {
          console.warn('Fallback setDoc error:', setErr);
        }
        return fallbackProfile;
      }
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;

      if (currentUser) {
        setUser(currentUser);
        try {
          const profile = await syncUserProfile(currentUser);
          if (isMounted) setUserProfile(profile);
        } catch (err) {
          console.error('Error handling auth state change:', err);
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, pass: string): Promise<UserProfile | null> => {
    setError(null);
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const profile = await syncUserProfile(userCredential.user);
      setUser(userCredential.user);
      setUserProfile(profile);
      return profile;
    } catch (err: any) {
      console.error('Sign in error:', err);
      let userFriendlyMessage = 'Failed to authenticate. Please verify your credentials.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        userFriendlyMessage = 'Invalid email or security key. Please check your inputs.';
      } else if (err.code === 'auth/too-many-requests') {
        userFriendlyMessage = 'Access temporarily locked due to consecutive failed attempts. Try again later.';
      } else if (err.code === 'auth/user-disabled') {
        userFriendlyMessage = 'This portal user account has been suspended by CHENAB A&R administration.';
      }
      setError(userFriendlyMessage);
      throw new Error(userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, pass: string, displayName?: string) => {
    const msg = 'Public registration is disabled. CHENAB accounts must be provisioned internally by administration.';
    setError(msg);
    throw new Error(msg);
  };

  const signInWithGoogle = async (): Promise<UserProfile | null> => {
    setError(null);
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const profile = await syncUserProfile(userCredential.user);
      setUser(userCredential.user);
      setUserProfile(profile);
      return profile;
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google Sign-In prompt was cancelled before completion.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by the browser. Please allow popups for authentication.');
      } else {
        setError('Failed to authenticate via Google Sign-In.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setError(null);
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError('Failed to log out cleanly.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      console.error('Password reset error:', err);
      let msg = 'Failed to dispatch security key reset email.';
      if (err.code === 'auth/user-not-found') {
        msg = 'No portal record found matching this email address.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const refreshUserProfile = async () => {
    if (auth.currentUser) {
      try {
        const profile = await syncUserProfile(auth.currentUser);
        setUserProfile(profile);
      } catch (err) {
        console.warn('Could not refresh user profile:', err);
      }
    }
  };

  const isAdmin = userProfile?.role === 'admin';
  const isExecutive = userProfile?.role === 'executive';
  const isArtist = userProfile?.role === 'artist';

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        error,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
        refreshUserProfile,
        clearError,
        isAdmin,
        isExecutive,
        isArtist,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
