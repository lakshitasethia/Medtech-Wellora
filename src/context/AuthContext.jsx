import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { WELLORA_DATA } from '../data/mockData';

const AuthContext = createContext(null);

/** Roles the app understands. The database enforces the same set. */
export const ROLES = ['admin', 'doctor', 'nurse', 'receptionist', 'patient'];

/**
 * Auth runs in one of two modes.
 *
 *   live — Supabase session drives everything. The role comes from the
 *          `profiles` row, never from the client, so a user cannot pick
 *          their own privileges.
 *   mock — no credentials configured (VITE_USE_MOCK=true, or no .env.local).
 *          Falls back to the bundled dataset so the app still runs and
 *          demos offline. Role is chosen at the login screen.
 *
 * Components consume the same shape either way.
 */
export const AUTH_MODE = isSupabaseConfigured ? 'live' : 'mock';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  // `loading` starts true in live mode so guards can wait for the initial
  // session check instead of flashing the login screen on every refresh.
  const [loading, setLoading] = useState(AUTH_MODE === 'live');
  const [authError, setAuthError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Mock-mode state. Persisted to sessionStorage so a page refresh behaves
  // the way live mode does (Supabase restores its own session) — otherwise
  // testing route guards means re-logging in after every reload.
  const [mockRole, setMockRole] = useState(() => {
    if (AUTH_MODE !== 'mock') return null;
    try {
      return sessionStorage.getItem('wellora.demoRole');
    } catch {
      return null;
    }
  });

  const setMockRolePersisted = useCallback((role) => {
    setMockRole(role);
    try {
      if (role) sessionStorage.setItem('wellora.demoRole', role);
      else sessionStorage.removeItem('wellora.demoRole');
    } catch {
      /* private browsing — fall back to in-memory only */
    }
  }, []);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, department, shift, email')
      .eq('id', userId)
      .single();

    if (error) {
      // A session without a profile row means the user exists in auth but
      // was never given a role. Treat as unauthenticated rather than
      // guessing a default — guessing would be a privilege decision.
      //
      // PGRST116 = "no rows returned" from .single(). Anything else is a
      // different failure (network, RLS misconfiguration, missing table),
      // and conflating them sends you debugging the wrong thing.
      console.error('[Wellora] profile lookup failed', {
        userId,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      setAuthError(
        error.code === 'PGRST116'
          ? `No profile row exists for this account (user id ${userId}). ` +
            'Run supabase/profiles.sql, then sign in again.'
          : `Could not read your profile: ${error.message}` +
            (error.code ? ` [${error.code}]` : '')
      );
      setProfile(null);
      return null;
    }
    setProfile(data);
    return data;
  }, []);

  useEffect(() => {
    if (AUTH_MODE !== 'live') return;

    let active = true;

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!active) return;
      setSession(s);
      if (s?.user) await fetchProfile(s.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        if (!active) return;
        setSession(s);
        if (s?.user) {
          await fetchProfile(s.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  /**
   * @param {string} email
   * @param {string} password
   * @param {string} demoRole  used only in mock mode
   */
  const signIn = useCallback(async (email, password, demoRole = 'doctor') => {
    setAuthError(null);

    if (AUTH_MODE === 'mock') {
      setMockRolePersisted(demoRole);
      showToast(`Signed in as ${demoRole.toUpperCase()} (demo mode)`);
      return { ok: true };
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setAuthError(error.message);
      return { ok: false, error: error.message };
    }

    const p = await fetchProfile(data.user.id);
    setLoading(false);
    if (!p) return { ok: false, error: 'No role assigned to this account.' };

    showToast(`Welcome back, ${p.full_name}`);
    return { ok: true, role: p.role };
  }, [fetchProfile, showToast, setMockRolePersisted]);

  const signOut = useCallback(async () => {
    if (AUTH_MODE === 'live') await supabase.auth.signOut();
    setMockRolePersisted(null);
    setProfile(null);
    setSession(null);
    showToast('Signed out of Wellora');
  }, [showToast, setMockRolePersisted]);

  /**
   * Demo-only role switcher. Deliberately unavailable in live mode: the
   * role is a database fact there, and letting the client reassign it
   * would defeat the RLS boundary it is supposed to mirror.
   */
  const switchRole = useCallback((newRole) => {
    if (AUTH_MODE === 'live') {
      showToast('Role switching is disabled — your role comes from your account.');
      return;
    }
    setMockRolePersisted(newRole);
    showToast(`Switched view to ${newRole.toUpperCase()} dashboard`);
  }, [showToast, setMockRolePersisted]);

  const userRole = AUTH_MODE === 'live' ? (profile?.role ?? null) : mockRole;
  const isLoggedIn = AUTH_MODE === 'live' ? Boolean(session && profile) : Boolean(mockRole);

  // Which patient record the portal shows. In live mode this is resolved
  // by RLS — the patient can only read their own row — so the id is only
  // a convenience for the mock dataset.
  const activePatientId = useMemo(() => {
    if (AUTH_MODE === 'live') return profile?.id ?? null;
    return WELLORA_DATA.patients[0].id;
  }, [profile]);

  const displayName = AUTH_MODE === 'live' ? profile?.full_name : null;

  const value = useMemo(() => ({
    mode: AUTH_MODE,
    isLoggedIn,
    loading,
    userRole,
    profile,
    session,
    displayName,
    activePatientId,
    authError,
    signIn,
    signOut,
    switchRole,
    toastMessage,
    showToast,
    // Backwards-compatible aliases used by existing components.
    login: signIn,
    logout: signOut,
  }), [
    isLoggedIn, loading, userRole, profile, session, displayName,
    activePatientId, authError, signIn, signOut, switchRole,
    toastMessage, showToast,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
