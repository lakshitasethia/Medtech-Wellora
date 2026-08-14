import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Home route for each role — used after login and to bounce '/' correctly. */
export const HOME_FOR_ROLE = {
  admin: '/admin',
  doctor: '/doctor',
  nurse: '/nurse',
  receptionist: '/reception',
  patient: '/portal',
};

function FullPageSpinner({ label = 'Loading…' }) {
  return (
    <div className="route-loader">
      <div className="route-loader-pulse" />
      <span>{label}</span>
    </div>
  );
}

/**
 * Blocks unauthenticated access.
 *
 * The `loading` check matters: on a hard refresh Supabase restores the
 * session asynchronously, so redirecting before it resolves would bounce
 * a signed-in user to the login screen on every reload.
 */
export function ProtectedRoute() {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner label="Restoring your session…" />;
  if (!isLoggedIn) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

/**
 * Blocks access by role.
 *
 * This is a UX guard, not a security boundary — it stops a nurse from
 * loading the admin screen, but the actual protection is the RLS policy
 * in supabase/rls.sql. A determined client can bypass this; it cannot
 * bypass Postgres.
 */
export function RoleRoute({ allow }) {
  const { userRole, loading } = useAuth();

  if (loading) return <FullPageSpinner />;
  if (!allow.includes(userRole)) {
    return <Navigate to="/unauthorized" replace state={{ attempted: allow }} />;
  }
  return <Outlet />;
}

/** Sends an already-authenticated user to their own dashboard. */
export function RedirectIfAuthed({ children }) {
  const { isLoggedIn, userRole, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (isLoggedIn) return <Navigate to={HOME_FOR_ROLE[userRole] ?? '/'} replace />;
  return children;
}
