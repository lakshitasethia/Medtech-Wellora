import React, { useEffect, useState } from 'react';
import { AlertTriangle, Calendar, Check, Plus, TrendingUp, User, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHospitalData } from '../../context/DataContext';
import { computeReceptionistMetrics } from '../../utils/metrics';
import { bookAppointment, checkInAppointment, registerPatient } from '../../lib/actions';
import { DataSection, EmptyState } from '../common/States';

/** Next free id in the WEL-#### series, so registration never collides. */
function nextPatientId(patients) {
  const numbers = patients
    .map((p) => Number(/WEL-(\d+)/.exec(p.id)?.[1]))
    .filter(Number.isFinite);
  const next = numbers.length ? Math.max(...numbers) + 1 : 8942;
  return `WEL-${next}`;
}

const BLANK_PATIENT = {
  name: '', age: '', gender: 'Female', bloodType: 'A+', phone: '', email: '',
  address: '', emergencyContact: '', allergiesText: '', conditionsText: '',
  triagePriority: 'Routine',
};

export default function ReceptionistDashboard({ onOpenEMR }) {
  const { showToast } = useAuth();
  const data = useHospitalData();
  const { patients, appointments, staff, loading, error, refresh, actor, isLive } = data;

  const [activeTab, setActiveTab] = useState('schedule');
  const [submitting, setSubmitting] = useState(false);
  const metrics = computeReceptionistMetrics(data);

  const doctors = staff.filter((s) => s.role === 'Doctor');

  /* --- Booking ---------------------------------------------------- */
  const [booking, setBooking] = useState({
    patientId: '', doctorId: '', time: '09:00', department: 'Cardiology',
    reason: '', type: 'Routine',
  });

  useEffect(() => {
    if (patients.length) setBooking((b) => ({ ...b, patientId: b.patientId || patients[0].id }));
    if (doctors.length) setBooking((b) => ({ ...b, doctorId: b.doctorId || doctors[0].id }));
  }, [patients, doctors]);

  /* --- Registration ----------------------------------------------- */
  const [newPatient, setNewPatient] = useState(BLANK_PATIENT);

  const handleCheckIn = async (appt) => {
    setSubmitting(true);
    const result = await checkInAppointment({
      appointmentId: appt.id,
      patientId: appt.patientId,
      patientName: appt.patientName,
      actor,
    });
    setSubmitting(false);
    if (!result.ok) {
      showToast(`Check-in failed: ${result.error}`);
      return;
    }
    showToast(`${appt.patientName} checked in`);
    refresh();
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!booking.patientId || !booking.reason.trim()) {
      showToast('Choose a patient and enter a reason for the visit');
      return;
    }
    // Times are entered as wall-clock for today; stored as a timestamptz.
    const [h, m] = booking.time.split(':').map(Number);
    const when = new Date();
    when.setHours(h, m, 0, 0);

    setSubmitting(true);
    const result = await bookAppointment({
      patientId: booking.patientId,
      doctorId: booking.doctorId,
      scheduledAt: when.toISOString(),
      department: booking.department,
      reason: booking.reason.trim(),
      type: booking.type,
      actor,
    });
    setSubmitting(false);
    if (!result.ok) {
      showToast(`Booking failed: ${result.error}`);
      return;
    }
    showToast('Appointment booked');
    setBooking((b) => ({ ...b, reason: '' }));
    setActiveTab('schedule');
    refresh();
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!newPatient.name.trim() || !newPatient.age) {
      showToast('Name and age are required');
      return;
    }
    const id = nextPatientId(patients);
    setSubmitting(true);
    const result = await registerPatient({
      patient: {
        id,
        name: newPatient.name.trim(),
        age: newPatient.age,
        gender: newPatient.gender,
        bloodType: newPatient.bloodType,
        phone: newPatient.phone,
        email: newPatient.email,
        address: newPatient.address,
        emergencyContact: newPatient.emergencyContact,
        allergies: newPatient.allergiesText.split(',').map((s) => s.trim()).filter(Boolean),
        chronicConditions: newPatient.conditionsText.split(',').map((s) => s.trim()).filter(Boolean),
        triagePriority: newPatient.triagePriority,
      },
      actor,
    });
    setSubmitting(false);
    if (!result.ok) {
      showToast(`Registration failed: ${result.error}`);
      return;
    }
    showToast(`${newPatient.name} registered as ${id}`);
    setNewPatient(BLANK_PATIENT);
    refresh();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
      <div className="dashboard-header-banner">
        <div className="header-banner-text">
          <span className="role-badge-pill" style={{ color: '#FCD34D' }}>Front Desk &amp; Patient Intake</span>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Calendar style={{ width: '28px', height: '28px' }} />
            Reception Workstation
          </h1>
          <p>Appointment scheduling, patient check-in, and new registrations</p>
        </div>
      </div>

      <div className="sub-nav-tabs">
        <button className={`sub-nav-tab-btn ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
          Appointments &amp; Check-In ({metrics.totalBookings})
        </button>
        <button className={`sub-nav-tab-btn ${activeTab === 'booking' ? 'active' : ''}`} onClick={() => setActiveTab('booking')}>
          Book Appointment
        </button>
        <button className={`sub-nav-tab-btn ${activeTab === 'register' ? 'active' : ''}`} onClick={() => setActiveTab('register')}>
          Register New Patient
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Today's Appointments</span>
            <span className="metric-value">{metrics.totalBookings} Bookings</span>
            <span className="metric-trend up"><TrendingUp className="trend-icon" /> {metrics.urgent} flagged urgent</span>
          </div>
          <div className="metric-icon-box"><Calendar style={{ width: '24px', height: '24px' }} /></div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Checked-In Patients</span>
            <span className="metric-value">{metrics.checkedIn} Waiting</span>
            <span className="metric-trend up"><Check className="trend-icon" /> {metrics.inConsultation} in consultation now</span>
          </div>
          <div className="metric-icon-box"><User style={{ width: '24px', height: '24px' }} /></div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Awaiting Check-In</span>
            <span className="metric-value">{metrics.awaitingCheckIn} Pending</span>
            <span className="metric-trend down"><AlertTriangle className="trend-icon" /> {metrics.completed} already completed</span>
          </div>
          <div className="metric-icon-box"><UserPlus style={{ width: '24px', height: '24px' }} /></div>
        </div>
      </div>

      {/* Tab 1: Schedule */}
      {activeTab === 'schedule' && (
        <div className="glass-card">
          <div className="card-header-row">
            <div>
              <h2 className="card-title"><Calendar style={{ width: '20px', height: '20px' }} /> Schedule Queue &amp; Check-In</h2>
              <p className="card-subtitle">
                Reception sees demographics and scheduling only — clinical notes and lab results are not accessible to this role.
              </p>
            </div>
          </div>

          <DataSection
            loading={loading}
            error={error}
            isEmpty={!appointments.length}
            onRetry={refresh}
            skeletonRows={6}
            empty={<EmptyState title="No appointments booked" message="Use Book Appointment to add one." />}
          >
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Patient</th>
                    <th>Assigned Doctor</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a.id}>
                      <td><strong>{a.time}</strong></td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{a.patientName}</div>
                        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--slate-500)' }}>{a.reason}</div>
                      </td>
                      <td>{a.doctor}</td>
                      <td><span className="badge badge-info">{a.dept}</span></td>
                      <td>
                        <span className={`badge ${
                          a.status === 'Completed' ? 'badge-success'
                          : a.status === 'In Consultation' ? 'badge-info'
                          : a.status === 'Checked-In' ? 'badge-warning'
                          : 'badge-info'
                        }`}><span className="status-dot" /> {a.status}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button
                            className="btn-pill btn-pill-teal"
                            style={{ padding: '0.35rem 0.8rem', fontSize: 'var(--fs-xs)' }}
                            disabled={a.status !== 'Scheduled' || submitting}
                            onClick={() => handleCheckIn(a)}
                          >
                            {a.status === 'Scheduled' ? 'Check-In' : 'Checked In'}
                          </button>
                          <button
                            className="btn-pill btn-pill-secondary"
                            style={{ padding: '0.35rem 0.8rem', fontSize: 'var(--fs-xs)' }}
                            onClick={() => onOpenEMR(a.patientId)}
                          >
                            Record
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataSection>
        </div>
      )}

      {/* Tab 2: Booking */}
      {activeTab === 'booking' && (
        <div className="glass-card" style={{ maxWidth: '620px' }}>
          <h2 className="card-title"><Plus style={{ width: '20px', height: '20px' }} /> Book Appointment</h2>
          <p className="card-subtitle" style={{ marginBottom: '1.25rem' }}>Scheduled for today at the chosen time.</p>

          <form onSubmit={handleBook}>
            <div className="form-group">
              <label className="form-label">Patient</label>
              <select className="form-select" value={booking.patientId} onChange={(e) => setBooking({ ...booking, patientId: e.target.value })}>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Doctor</label>
              <select className="form-select" value={booking.doctorId} onChange={(e) => setBooking({ ...booking, doctorId: e.target.value })}>
                {doctors.length
                  ? doctors.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.department}</option>)
                  : <option value="">No doctors on file</option>}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Time</label>
                <input type="time" className="form-input" value={booking.time} onChange={(e) => setBooking({ ...booking, time: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={booking.type} onChange={(e) => setBooking({ ...booking, type: e.target.value })}>
                  <option>Routine</option><option>Follow-up</option><option>Urgent</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-input" value={booking.department} onChange={(e) => setBooking({ ...booking, department: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Reason for visit</label>
              <input className="form-input" placeholder="e.g. Chest pain workup" value={booking.reason} onChange={(e) => setBooking({ ...booking, reason: e.target.value })} />
            </div>

            <button type="submit" className="btn-pill btn-pill-teal" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Booking…' : 'Confirm Booking'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Registration */}
      {activeTab === 'register' && (
        <div className="glass-card" style={{ maxWidth: '680px' }}>
          <h2 className="card-title"><UserPlus style={{ width: '20px', height: '20px' }} /> Register New Patient</h2>
          <p className="card-subtitle" style={{ marginBottom: '1.25rem' }}>
            Creates the single source record every other role reads. Next id: <strong>{nextPatientId(patients)}</strong>
          </p>

          <form onSubmit={handleRegister}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full name *</label>
                <input className="form-input" value={newPatient.name} onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Age *</label>
                <input className="form-input" inputMode="numeric" value={newPatient.age} onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-select" value={newPatient.gender} onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}>
                  <option>Female</option><option>Male</option><option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Blood type</label>
                <select className="form-select" value={newPatient.bloodType} onChange={(e) => setNewPatient({ ...newPatient, bloodType: e.target.value })}>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Triage</label>
                <select className="form-select" value={newPatient.triagePriority} onChange={(e) => setNewPatient({ ...newPatient, triagePriority: e.target.value })}>
                  <option>Routine</option><option>Urgent</option><option>Critical</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={newPatient.phone} onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={newPatient.email} onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" value={newPatient.address} onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Emergency contact</label>
              <input className="form-input" placeholder="Name (relationship) - phone" value={newPatient.emergencyContact} onChange={(e) => setNewPatient({ ...newPatient, emergencyContact: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Known allergies</label>
              <input className="form-input" placeholder="Comma separated, e.g. Penicillin, Latex" value={newPatient.allergiesText} onChange={(e) => setNewPatient({ ...newPatient, allergiesText: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Chronic conditions</label>
              <input className="form-input" placeholder="Comma separated, e.g. Hypertension" value={newPatient.conditionsText} onChange={(e) => setNewPatient({ ...newPatient, conditionsText: e.target.value })} />
            </div>

            {!isLive && (
              <div className="rx-check rx-check-warning">
                Demo mode — this form validates and reports success but does not persist.
              </div>
            )}

            <button type="submit" className="btn-pill btn-pill-teal" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Registering…' : 'Register Patient'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
