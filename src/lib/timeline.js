/**
 * The unified patient timeline.
 *
 * `clinical_events` is written by every mutation in actions.js — check-in,
 * vitals, notes, prescriptions, bed moves, ML assessments. This module turns
 * those rows into one normalised shape the UI can render, and provides a
 * derived equivalent for offline demo mode.
 *
 * The derived path is clearly marked as such: in mock mode there is no event
 * log, so the timeline is reconstructed from the record's own contents. It is
 * a faithful reconstruction of *what happened*, but it is not an audit trail,
 * and the UI says so rather than implying the demo has provenance it doesn't.
 */

import { fetchTimeline } from './actions';
import { USING_LIVE_DATA } from './repository';

/** Display metadata per event type. `tone` maps to the CSS accent. */
export const EVENT_META = {
  registration:  { label: 'Registered',        icon: 'UserPlus',   tone: 'slate' },
  check_in:      { label: 'Checked in',        icon: 'LogIn',      tone: 'amber' },
  appointment:   { label: 'Appointment',       icon: 'Calendar',   tone: 'blue' },
  vitals:        { label: 'Vitals recorded',   icon: 'Activity',   tone: 'teal' },
  note:          { label: 'Consultation note', icon: 'FileText',   tone: 'navy' },
  prescription:  { label: 'Prescription',      icon: 'Pill',       tone: 'violet' },
  lab:           { label: 'Lab result',        icon: 'FlaskConical', tone: 'blue' },
  ml_assessment: { label: 'Risk assessment',   icon: 'Zap',        tone: 'rose' },
  bed_change:    { label: 'Bed change',        icon: 'Bed',        tone: 'slate' },
};

export const EVENT_TYPES = Object.keys(EVENT_META);

const ROLE_LABEL = {
  admin: 'Admin',
  doctor: 'Doctor',
  nurse: 'Nurse',
  receptionist: 'Reception',
  patient: 'Patient',
};

/** Database row -> UI event. */
function normalise(row) {
  return {
    id: `db-${row.id}`,
    type: row.event_type,
    summary: row.summary,
    payload: row.payload ?? null,
    at: row.created_at,
    actorName: row.profiles?.full_name ?? 'System',
    actorRole: row.profiles?.role ?? row.actor_role ?? null,
    provenance: 'logged',
  };
}

/**
 * Reconstruct a timeline from the record itself, for offline demo mode.
 *
 * Timestamps here come from the record's own date fields, which are display
 * strings in the bundled dataset rather than real timestamps — so ordering is
 * best-effort. Anything unparseable is spaced backwards from now so the
 * sequence still reads sensibly instead of collapsing to one instant.
 */
function derive(patient) {
  if (!patient) return [];
  const events = [];
  let fallbackOffset = 0;
  const nextFallback = () => {
    fallbackOffset += 1;
    return new Date(Date.now() - fallbackOffset * 3600_000).toISOString();
  };
  const parse = (value) => {
    const t = Date.parse(value);
    return Number.isFinite(t) ? new Date(t).toISOString() : nextFallback();
  };

  (patient.vitalsHistory ?? []).forEach((v, i) => {
    events.push({
      id: `d-vit-${i}`,
      type: 'vitals',
      summary: `Vitals recorded — BP ${v.bp}, HR ${v.hr}, SpO₂ ${v.spo2}`,
      at: v.recordedAt ?? nextFallback(),
      displayAt: v.time,
      actorName: 'Nursing staff',
      actorRole: 'nurse',
      provenance: 'derived',
    });
  });

  (patient.consultationNotes ?? []).forEach((n, i) => {
    events.push({
      id: `d-note-${i}`,
      type: 'note',
      summary: n.soap?.a ? `Assessment — ${n.soap.a}` : 'Consultation note filed',
      payload: n.soap,
      at: parse(n.date),
      displayAt: n.date,
      actorName: n.doctor,
      actorRole: 'doctor',
      provenance: 'derived',
    });
  });

  (patient.prescriptions ?? []).forEach((rx, i) => {
    events.push({
      id: `d-rx-${i}`,
      type: 'prescription',
      summary: `${rx.drug} ${rx.dose} — ${rx.freq}`,
      at: nextFallback(),
      actorName: rx.prescribedBy,
      actorRole: 'doctor',
      provenance: 'derived',
    });
  });

  (patient.labResults ?? []).forEach((l, i) => {
    events.push({
      id: `d-lab-${i}`,
      type: 'lab',
      summary: `${l.test} — ${l.result}`,
      at: parse(l.date),
      displayAt: l.date,
      actorName: 'Laboratory',
      actorRole: null,
      provenance: 'derived',
    });
  });

  if (patient.mlHeartRisk?.riskScore) {
    events.push({
      id: 'd-ml-0',
      type: 'ml_assessment',
      summary: `Cardiac risk assessed at ${patient.mlHeartRisk.riskScore}% (${patient.mlHeartRisk.riskCategory})`,
      at: patient.mlHeartRisk.computedAt ?? nextFallback(),
      actorName: patient.assignedDoctor,
      actorRole: 'doctor',
      provenance: 'derived',
    });
  }

  return events;
}

const newestFirst = (a, b) => new Date(b.at) - new Date(a.at);

/**
 * Load a patient's timeline. Live mode reads the real event log; demo mode
 * reconstructs from the record. Returns `{ events, source }` so the UI can
 * be explicit about which it is showing.
 */
export async function loadTimeline(patientId, patient) {
  if (!USING_LIVE_DATA) {
    return { events: derive(patient).sort(newestFirst), source: 'derived' };
  }
  const rows = await fetchTimeline(patientId);
  return { events: rows.map(normalise).sort(newestFirst), source: 'logged' };
}

export function roleLabel(role) {
  return ROLE_LABEL[role] ?? 'System';
}

/** Group events by calendar day for date headers in the timeline. */
export function groupByDay(events) {
  const groups = new Map();
  for (const e of events) {
    const d = new Date(e.at);
    const key = Number.isFinite(d.getTime())
      ? d.toDateString()
      : 'Undated';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }
  return [...groups.entries()].map(([key, items]) => ({ key, items }));
}

/** "Today" / "Yesterday" / "Mon 12 Aug 2026" */
export function dayHeading(key) {
  if (key === 'Undated') return 'Undated';
  const d = new Date(key);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });
}
