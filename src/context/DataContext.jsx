import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { supabase } from '../lib/supabase';
import { fetchHospitalData, USING_LIVE_DATA } from '../lib/repository';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

const EMPTY = { patients: [], staff: [], beds: [], appointments: [] };

/**
 * One fetch for the whole authenticated app.
 *
 * Every dashboard reads the same snapshot, which is the point: when a nurse
 * records vitals, the doctor's queue is looking at the same rows, not a
 * separate departmental copy.
 *
 * Realtime subscriptions on vitals/beds/appointments/clinical_events trigger
 * a refetch, so a change made by one role appears in another role's window
 * without a reload.
 */
export function DataProvider({ children }) {
  const { isLoggedIn, profile, userRole } = useAuth();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  // Guards against a slow response from a previous session overwriting a
  // newer one after a role switch or sign-out.
  const requestId = useRef(0);

  const load = useCallback(async ({ quiet = false } = {}) => {
    const id = ++requestId.current;
    if (!quiet) setLoading(true);
    try {
      const next = await fetchHospitalData();
      if (id !== requestId.current) return;
      setData(next);
      setError(null);
      setLastSync(new Date());
    } catch (err) {
      if (id !== requestId.current) return;
      console.error('[Wellora] data load failed', err);
      setError(err);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setData(EMPTY);
      setLoading(false);
      return;
    }
    load();
  }, [isLoggedIn, userRole, load]);

  // Realtime — only meaningful against a live database.
  useEffect(() => {
    if (!USING_LIVE_DATA || !isLoggedIn) return;

    const channel = supabase
      .channel('wellora-clinical')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vitals' },
        () => load({ quiet: true }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'beds' },
        () => load({ quiet: true }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' },
        () => load({ quiet: true }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinical_events' },
        () => load({ quiet: true }))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isLoggedIn, load]);

  const value = useMemo(() => ({
    ...data,
    patients: data.patients ?? [],
    staff: data.staff ?? [],
    beds: data.beds ?? [],
    appointments: data.appointments ?? [],
    loading,
    error,
    lastSync,
    isLive: USING_LIVE_DATA,
    refresh: () => load({ quiet: true }),
    // Passed to write actions so every row records who did it.
    actor: profile ? { id: profile.id, role: profile.role } : { id: null, role: userRole },
  }), [data, loading, error, lastSync, load, profile, userRole]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useHospitalData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useHospitalData must be used inside <DataProvider>');
  return ctx;
}
