/* Wellora — derived dashboard metrics.
 *
 * Every number shown on a dashboard is computed here from the dataset.
 * Nothing in a `.metric-value` may be a literal: if a figure cannot be
 * derived from real records, the card should not exist.
 */

const HIGH_RISK_THRESHOLD = 75;

/** Parse a "09:00 AM" / "02:15 PM" label into minutes past midnight for sorting. */
export function parseClockLabel(label) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec((label ?? '').trim());
  if (!m) return Number.MAX_SAFE_INTEGER;
  let hours = parseInt(m[1], 10) % 12;
  if (m[3].toUpperCase() === 'PM') hours += 12;
  return hours * 60 + parseInt(m[2], 10);
}

/** Patients ordered by their appointment slot — the order a clinic runs in. */
export function patientsByAppointment(data) {
  return [...(data.patients ?? [])].sort(
    (a, b) => parseClockLabel(a.appointmentTime) - parseClockLabel(b.appointmentTime)
  );
}

/** Latest vitals reading for a patient (vitalsHistory is newest-first). */
export function latestVitals(patient) {
  return patient?.vitalsHistory?.[0] ?? null;
}

/** Count of lab results flagged as abnormal across a patient record. */
export function flaggedLabCount(patient) {
  return (patient?.labResults ?? []).filter(l => l.status === 'Flagged').length;
}

/* ------------------------------------------------------------------ */
/* Doctor                                                              */
/* ------------------------------------------------------------------ */
export function computeDoctorMetrics(data) {
  const patients = data.patients ?? [];
  const appointments = data.appointments ?? [];

  const completed = appointments.filter(a => a.status === 'Completed').length;
  const waiting = appointments.filter(
    a => a.status === 'Checked-In' || a.status === 'Scheduled'
  ).length;
  const inConsultation = appointments.filter(a => a.status === 'In Consultation').length;

  const highRisk = patients.filter(p => p.mlHeartRisk?.riskScore > HIGH_RISK_THRESHOLD);

  const activePrescriptions = patients.reduce(
    (sum, p) => sum + (p.prescriptions ?? []).filter(rx => rx.status === 'Active').length,
    0
  );

  const patientsWithAllergies = patients.filter(
    p => (p.allergies ?? []).some(a => a !== 'None Known')
  ).length;

  return {
    queueTotal: appointments.length,
    completed,
    waiting,
    inConsultation,
    queueTrend: `${completed} completed | ${waiting} waiting`,
    highRiskCount: highRisk.length,
    highRiskNames: highRisk.map(p => p.name),
    riskThresholdLabel: `ML risk score > ${HIGH_RISK_THRESHOLD}%`,
    activePrescriptions,
    patientsWithAllergies,
  };
}

/* ------------------------------------------------------------------ */
/* Nurse                                                               */
/* ------------------------------------------------------------------ */
export function computeNurseMetrics(data) {
  const beds = data.beds ?? [];
  const patients = data.patients ?? [];

  const occupied = beds.filter(b => b.status === 'occupied' || b.status === 'critical').length;
  const available = beds.filter(b => b.status === 'available').length;
  const cleaning = beds.filter(b => b.status === 'cleaning').length;
  const critical = beds.filter(b => b.status === 'critical').length;

  const occupancyRate = beds.length ? Math.round((occupied / beds.length) * 100) : 0;

  // Doses due = every active prescription on an admitted (bedded) patient.
  const admittedIds = new Set(beds.map(b => b.patientId).filter(Boolean));
  const dosesDue = patients
    .filter(p => admittedIds.has(p.id))
    .reduce((sum, p) => sum + (p.prescriptions ?? []).filter(rx => rx.status === 'Active').length, 0);

  const wards = [...new Set(beds.map(b => b.ward))];

  return {
    totalBeds: beds.length,
    occupied,
    available,
    cleaning,
    critical,
    occupancyRate,
    occupancyLabel: `${occupied}/${beds.length} Beds`,
    dosesDue,
    wards,
    wardCount: wards.length,
  };
}

/* ------------------------------------------------------------------ */
/* Receptionist                                                        */
/* ------------------------------------------------------------------ */
export function computeReceptionistMetrics(data) {
  const appointments = data.appointments ?? [];

  const checkedIn = appointments.filter(a => a.status === 'Checked-In').length;
  const scheduled = appointments.filter(a => a.status === 'Scheduled').length;
  const completed = appointments.filter(a => a.status === 'Completed').length;
  const inConsultation = appointments.filter(a => a.status === 'In Consultation').length;
  const urgent = appointments.filter(a => a.type === 'Urgent').length;

  return {
    totalBookings: appointments.length,
    checkedIn,
    scheduled,
    completed,
    inConsultation,
    urgent,
    awaitingCheckIn: scheduled,
    registeredPatients: (data.patients ?? []).length,
  };
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */
export function computeAdminMetrics(data) {
  const beds = computeNurseMetrics(data);
  const staff = data.staff ?? [];
  const patients = data.patients ?? [];
  const appointments = data.appointments ?? [];

  const onDuty = staff.filter(s => s.status === 'On Duty').length;
  const departments = [...new Set(staff.map(s => s.department))];

  const avgRisk = patients.length
    ? Math.round(
        patients.reduce((sum, p) => sum + (p.mlHeartRisk?.riskScore ?? 0), 0) / patients.length
      )
    : 0;

  const criticalPatients = patients.filter(p => p.triagePriority === 'Critical').length;

  const completionRate = appointments.length
    ? Math.round(
        (appointments.filter(a => a.status === 'Completed').length / appointments.length) * 100
      )
    : 0;

  return {
    bedOccupancyRate: beds.occupancyRate,
    occupancyLabel: beds.occupancyLabel,
    totalStaff: staff.length,
    onDutyStaff: onDuty,
    departmentCount: departments.length,
    departments,
    activePatients: patients.length,
    criticalPatients,
    avgRisk,
    appointmentsToday: appointments.length,
    completionRate,
  };
}

/* ------------------------------------------------------------------ */
/* Patient portal                                                      */
/* ------------------------------------------------------------------ */
export function computePatientMetrics(patient, data) {
  const activeMeds = (patient?.prescriptions ?? []).filter(rx => rx.status === 'Active');

  const nextAppointment =
    (data?.appointments ?? []).find(
      a => a.patientId === patient?.id && a.status !== 'Completed'
    ) ?? null;

  return {
    activeMedCount: activeMeds.length,
    activeMeds,
    nextAppointmentTime: nextAppointment ? nextAppointment.time : 'None scheduled',
    nextAppointmentReason: nextAppointment ? nextAppointment.reason : '—',
    riskScore: patient?.mlHeartRisk?.riskScore ?? null,
    riskCategory: patient?.mlHeartRisk?.riskCategory ?? 'Not assessed',
    flaggedLabs: flaggedLabCount(patient),
    totalLabs: (patient?.labResults ?? []).length,
  };
}
