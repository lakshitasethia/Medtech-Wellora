/**
 * The single boundary between the database and the UI.
 *
 * Everything above this file consumes one shape — the shape `mockData.js`
 * already defined. That was a deliberate choice: it meant Phase 2 could
 * swap the data source without touching `metrics.js` or any dashboard's
 * rendering logic. The mappers below are the cost of that decision, and
 * they are worth it.
 *
 * In mock mode this returns the bundled dataset unchanged, so the app
 * still demos with no network at all.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { WELLORA_DATA } from '../data/mockData';
import { bpLabel, clockLabel, dateLabel, relativeStamp } from './format';

export const USING_LIVE_DATA = isSupabaseConfigured;

/* ------------------------------------------------------------------ */
/* Mappers: database row -> UI shape                                    */
/* ------------------------------------------------------------------ */

function mapStaff(profile) {
  return {
    id: profile.id,
    name: profile.full_name,
    role: profile.role
      ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
      : 'Unknown',
    department: profile.department ?? '—',
    status: profile.status ?? 'On Duty',
    shift: profile.shift ?? '—',
    email: profile.email ?? '—',
  };
}

function mapVitals(row) {
  return {
    id: row.id,
    time: relativeStamp(row.recorded_at),
    recordedAt: row.recorded_at,
    bp: bpLabel(row.bp_systolic, row.bp_diastolic),
    hr: row.heart_rate,
    temp: row.temperature_f != null ? `${row.temperature_f}°F` : '—',
    spo2: row.spo2 != null ? `${row.spo2}%` : '—',
    rr: row.respiratory_rate,
  };
}

function mapPrescription(row, staffById) {
  return {
    id: row.id,
    drug: row.drug,
    dose: row.dose,
    freq: row.frequency,
    duration: row.duration ?? '—',
    status: row.status,
    prescribedBy: staffById.get(row.prescribed_by)?.name ?? 'Care team',
  };
}

function mapLab(row) {
  return {
    id: row.id,
    date: dateLabel(row.resulted_at),
    test: row.test_name,
    result: row.result,
    status: row.status,
  };
}

function mapNote(row, staffById) {
  return {
    id: row.id,
    date: `${dateLabel(row.created_at)} - ${clockLabel(row.created_at)}`,
    doctor: staffById.get(row.author_id)?.name ?? 'Care team',
    soap: {
      s: row.subjective ?? '',
      o: row.objective ?? '',
      a: row.assessment ?? '',
      p: row.plan ?? '',
    },
  };
}

function mapAssessment(row) {
  if (!row) return null;
  return {
    riskScore: row.risk_score,
    riskCategory: row.risk_category,
    modelVersion: row.model_version,
    computedAt: row.computed_at,
    parameters: row.input_snapshot ?? {},
    keyContributors: row.key_factors ?? [],
    aiRecommendation: row.recommendation ?? '',
  };
}

/** Newest first, matching the ordering the UI assumes throughout. */
const byNewest = (key) => (a, b) => new Date(b[key]) - new Date(a[key]);

function mapPatient(row, staffById) {
  const vitals = [...(row.vitals ?? [])].sort(byNewest('recorded_at'));
  const notes = [...(row.consultation_notes ?? [])].sort(byNewest('created_at'));
  const labs = [...(row.lab_results ?? [])].sort(byNewest('resulted_at'));
  const assessments = [...(row.ml_assessments ?? [])].sort(byNewest('computed_at'));

  return {
    id: row.id,
    name: row.full_name,
    age: row.age,
    gender: row.gender,
    bloodType: row.blood_type,
    phone: row.phone,
    email: row.email,
    address: row.address,
    emergencyContact: row.emergency_contact,
    allergies: row.allergies?.length ? row.allergies : ['None Known'],
    chronicConditions: row.chronic_conditions ?? [],
    assignedDoctor: staffById.get(row.assigned_doctor_id)?.name ?? 'Unassigned',
    assignedDoctorId: row.assigned_doctor_id,
    roomBed: row.room_bed ?? 'Outpatient',
    triagePriority: row.triage_priority,
    appointmentTime: row.appointment_time,
    portalUserId: row.portal_user_id,
    vitalsHistory: vitals.map(mapVitals),
    prescriptions: (row.prescriptions ?? []).map((p) => mapPrescription(p, staffById)),
    labResults: labs.map(mapLab),
    consultationNotes: notes.map((n) => mapNote(n, staffById)),
    // The UI treats this as a single current score; the table keeps the
    // full history, so the newest row is the current one.
    mlHeartRisk: mapAssessment(assessments[0]) ?? {
      riskScore: 0,
      riskCategory: 'Not assessed',
      parameters: {},
      keyContributors: [],
      aiRecommendation: '',
    },
  };
}

function mapBed(row) {
  return {
    id: row.id,
    ward: row.ward,
    bedNumber: row.bed_number,
    status: row.status,
    patientId: row.patient_id,
    patientName: row.patients?.full_name ?? (row.patient_id ? 'Unknown' : 'Unassigned'),
    condition: row.condition ?? '—',
  };
}

function mapAppointment(row, staffById) {
  return {
    id: row.id,
    time: clockLabel(row.scheduled_at),
    scheduledAt: row.scheduled_at,
    patientName: row.patients?.full_name ?? 'Unknown',
    patientId: row.patient_id,
    doctor: staffById.get(row.doctor_id)?.name ?? 'Unassigned',
    doctorId: row.doctor_id,
    dept: row.department ?? '—',
    reason: row.reason ?? '—',
    status: row.status,
    type: row.appt_type ?? 'Routine',
  };
}

/* ------------------------------------------------------------------ */
/* Fetch                                                               */
/* ------------------------------------------------------------------ */

const PATIENT_SELECT =
  '*,vitals(*),prescriptions(*),lab_results(*),consultation_notes(*),ml_assessments(*)';

/**
 * Loads everything the dashboards need in one pass.
 *
 * Row-level security does the filtering, so this same query returns the
 * whole ward for a doctor and exactly one record for a patient. The UI
 * does not branch on role to decide what to request — that would put the
 * access decision in the client, which is the thing RLS exists to avoid.
 */
export async function fetchHospitalData() {
  if (!USING_LIVE_DATA) {
    return { ...WELLORA_DATA, source: 'mock' };
  }

  const [profilesRes, patientsRes, bedsRes, apptsRes] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('patients').select(PATIENT_SELECT),
    supabase.from('beds').select('*,patients(id,full_name)').order('id'),
    supabase
      .from('appointments')
      .select('*,patients(id,full_name)')
      .order('scheduled_at'),
  ]);

  // A denied table is not an error — RLS returning nothing is the system
  // working. Only a genuine failure (network, bad query) should surface.
  const firstError = [profilesRes, patientsRes, bedsRes, apptsRes]
    .map((r) => r.error)
    .find((e) => e && e.code !== 'PGRST116');

  if (firstError) {
    const err = new Error(firstError.message);
    err.code = firstError.code;
    err.hint = firstError.hint;
    throw err;
  }

  const staff = (profilesRes.data ?? []).map(mapStaff);
  const staffById = new Map(staff.map((s) => [s.id, s]));

  const patients = (patientsRes.data ?? []).map((p) => mapPatient(p, staffById));

  return {
    source: 'supabase',
    staff,
    patients,
    beds: (bedsRes.data ?? []).map(mapBed),
    appointments: (apptsRes.data ?? []).map((a) => mapAppointment(a, staffById)),
  };
}
