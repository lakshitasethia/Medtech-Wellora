/**
 * Write operations.
 *
 * Every mutation here also appends one row to `clinical_events`. That table
 * is the unified patient timeline — the thing that makes "Single Source of
 * Truth" a feature rather than a slogan — and it only stays truthful if
 * writes cannot bypass it. Keeping the event write next to the domain write,
 * in one place, is what enforces that.
 *
 * In mock mode these are no-ops that report success, so the offline demo
 * still responds to interaction without pretending to have persisted.
 */

import { supabase } from './supabase';
import { USING_LIVE_DATA } from './repository';
import { numeric, parseBp } from './format';

const MOCK_OK = { ok: true, mocked: true };

/** Append to the append-only timeline. Never throws — a failed audit write
 *  must not roll back the clinical write that already succeeded, but it
 *  must be visible in the console. */
async function logEvent({ patientId, actorId, actorRole, type, summary, payload }) {
  const { error } = await supabase.from('clinical_events').insert({
    patient_id: patientId,
    actor_id: actorId ?? null,
    actor_role: actorRole,
    event_type: type,
    summary,
    payload: payload ?? null,
  });
  if (error) console.error('[Wellora] timeline write failed', error);
}

function fail(error) {
  console.error('[Wellora] write failed', error);
  return { ok: false, error: error.message ?? 'Write failed' };
}

/* ------------------------------------------------------------------ */
/* Nurse — vitals                                                      */
/* ------------------------------------------------------------------ */
export async function recordVitals({ patientId, patientName, form, actor }) {
  if (!USING_LIVE_DATA) return MOCK_OK;

  const { systolic, diastolic } = parseBp(form.bp);
  const { error } = await supabase.from('vitals').insert({
    patient_id: patientId,
    recorded_by: actor?.id ?? null,
    bp_systolic: systolic,
    bp_diastolic: diastolic,
    heart_rate: numeric(form.hr),
    temperature_f: numeric(form.temp),
    spo2: numeric(form.spo2),
    respiratory_rate: numeric(form.rr),
  });
  if (error) return fail(error);

  await logEvent({
    patientId,
    actorId: actor?.id,
    actorRole: actor?.role ?? 'nurse',
    type: 'vitals',
    summary: `Vitals recorded for ${patientName}: BP ${form.bp}, HR ${form.hr}`,
    payload: form,
  });
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Doctor — SOAP notes                                                 */
/* ------------------------------------------------------------------ */
export async function saveConsultationNote({ patientId, patientName, soap, actor }) {
  if (!USING_LIVE_DATA) return MOCK_OK;

  const { error } = await supabase.from('consultation_notes').insert({
    patient_id: patientId,
    author_id: actor?.id ?? null,
    subjective: soap.s,
    objective: soap.o,
    assessment: soap.a,
    plan: soap.p ?? '',
  });
  if (error) return fail(error);

  await logEvent({
    patientId,
    actorId: actor?.id,
    actorRole: actor?.role ?? 'doctor',
    type: 'note',
    summary: `Consultation note filed for ${patientName}`,
  });
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Doctor — prescriptions                                              */
/* ------------------------------------------------------------------ */
export async function createPrescription({ patientId, patientName, rx, actor }) {
  if (!USING_LIVE_DATA) return MOCK_OK;

  const { error } = await supabase.from('prescriptions').insert({
    patient_id: patientId,
    drug: rx.drug,
    dose: rx.dose,
    frequency: rx.freq,
    duration: rx.duration ?? '30 Days',
    status: 'Active',
    prescribed_by: actor?.id ?? null,
  });
  if (error) return fail(error);

  await logEvent({
    patientId,
    actorId: actor?.id,
    actorRole: actor?.role ?? 'doctor',
    type: 'prescription',
    summary: `${rx.drug} ${rx.dose} prescribed to ${patientName} (${rx.freq})`,
    payload: rx,
  });
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Doctor — ML assessment                                              */
/* ------------------------------------------------------------------ */
export async function saveAssessment({ patientId, patientName, result, actor }) {
  if (!USING_LIVE_DATA) return MOCK_OK;

  const { error } = await supabase.from('ml_assessments').insert({
    patient_id: patientId,
    risk_score: result.riskScore,
    risk_category: result.riskCategory,
    model_version: result.modelVersion ?? 'rule-based-v0.1',
    input_snapshot: result.parameters ?? {},
    key_factors: result.keyFactors ?? [],
    computed_by: actor?.id ?? null,
  });
  if (error) return fail(error);

  await logEvent({
    patientId,
    actorId: actor?.id,
    actorRole: actor?.role ?? 'doctor',
    type: 'ml_assessment',
    summary: `Heart risk assessed for ${patientName}: ${result.riskScore}% (${result.riskCategory})`,
    payload: { score: result.riskScore, model: result.modelVersion },
  });
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Receptionist — appointments                                         */
/* ------------------------------------------------------------------ */
export async function checkInAppointment({ appointmentId, patientId, patientName, actor }) {
  if (!USING_LIVE_DATA) return MOCK_OK;

  const { error } = await supabase
    .from('appointments')
    .update({ status: 'Checked-In' })
    .eq('id', appointmentId);
  if (error) return fail(error);

  await logEvent({
    patientId,
    actorId: actor?.id,
    actorRole: actor?.role ?? 'receptionist',
    type: 'check_in',
    summary: `${patientName} checked in at reception`,
  });
  return { ok: true };
}

export async function bookAppointment({ patientId, doctorId, scheduledAt, department, reason, type, actor }) {
  if (!USING_LIVE_DATA) return MOCK_OK;

  const { error } = await supabase.from('appointments').insert({
    patient_id: patientId,
    doctor_id: doctorId || null,
    scheduled_at: scheduledAt,
    department,
    reason,
    appt_type: type,
    status: 'Scheduled',
  });
  if (error) return fail(error);

  await logEvent({
    patientId,
    actorId: actor?.id,
    actorRole: actor?.role ?? 'receptionist',
    type: 'appointment',
    summary: `Appointment booked — ${reason}`,
  });
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Nurse — beds                                                        */
/* ------------------------------------------------------------------ */
export async function updateBedStatus({ bedId, status, patientId, actor }) {
  if (!USING_LIVE_DATA) return MOCK_OK;

  const patch = { status, updated_at: new Date().toISOString() };
  // Freeing a bed must clear its occupant, or the ward map keeps showing a
  // discharged patient in an "available" bed.
  if (status === 'available' || status === 'cleaning') patch.patient_id = null;

  const { error } = await supabase.from('beds').update(patch).eq('id', bedId);
  if (error) return fail(error);

  if (patientId) {
    await logEvent({
      patientId,
      actorId: actor?.id,
      actorRole: actor?.role ?? 'nurse',
      type: 'bed_change',
      summary: `Bed ${bedId} set to ${status}`,
    });
  }
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Receptionist — registration                                         */
/* ------------------------------------------------------------------ */
export async function registerPatient({ patient, actor }) {
  if (!USING_LIVE_DATA) return MOCK_OK;

  const { error } = await supabase.from('patients').insert({
    id: patient.id,
    full_name: patient.name,
    age: Number(patient.age),
    gender: patient.gender,
    blood_type: patient.bloodType,
    phone: patient.phone,
    email: patient.email,
    address: patient.address,
    emergency_contact: patient.emergencyContact,
    allergies: patient.allergies ?? [],
    chronic_conditions: patient.chronicConditions ?? [],
    triage_priority: patient.triagePriority ?? 'Routine',
    room_bed: 'Outpatient',
  });
  if (error) return fail(error);

  await logEvent({
    patientId: patient.id,
    actorId: actor?.id,
    actorRole: actor?.role ?? 'receptionist',
    type: 'registration',
    summary: `${patient.name} registered (${patient.id})`,
  });
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Timeline read                                                       */
/* ------------------------------------------------------------------ */
export async function fetchTimeline(patientId) {
  if (!USING_LIVE_DATA) return [];
  const { data, error } = await supabase
    .from('clinical_events')
    .select('*,profiles(full_name,role)')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    console.error('[Wellora] timeline read failed', error);
    return [];
  }
  return data ?? [];
}
