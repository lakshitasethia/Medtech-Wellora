import React, { useState } from 'react';
import { Activity, AlertTriangle, Bed, Check, FileText, Plus, Shield, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { computeAdminMetrics } from '../../utils/metrics';
import { useHospitalData } from '../../context/DataContext';
import { DataSection, EmptyState } from '../common/States';

export default function AdminDashboard() {
  const { showToast } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const data = useHospitalData();
  const { staff, loading, error, refresh } = data;
  const metrics = computeAdminMetrics(data);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
      {/* Role Header Banner */}
      <div className="dashboard-header-banner">
        <div className="header-banner-text">
          <span className="role-badge-pill" style={{ color: '#60A5FA' }}>Executive Admin Workspace</span>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Shield style={{ width: '28px', height: '28px' }} />
            Hospital Operations & Governance
          </h1>
          <p>Single Source EMR Compliance, Staff Rosters, & Department Load Index</p>
        </div>
        <div className="header-banner-actions">
          <button className="btn-pill btn-pill-primary" onClick={() => showToast('Access Control Matrix Updated')}>
            <Shield style={{ width: '16px', height: '16px' }} /> Access Controls
          </button>
        </div>
      </div>

      {/* Progressive Disclosure Sub-Nav Tabs (De-cluttered layout!) */}
      <div className="sub-nav-tabs">
        <button className={`sub-nav-tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Overview & Metrics
        </button>
        <button className={`sub-nav-tab-btn ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab('staff')}>
          Staff Directory ({metrics.totalStaff})
        </button>
        <button className={`sub-nav-tab-btn ${activeTab === 'capacity' ? 'active' : ''}`} onClick={() => setActiveTab('capacity')}>
          Ward & Capacity Load
        </button>
        <button className={`sub-nav-tab-btn ${activeTab === 'permissions' ? 'active' : ''}`} onClick={() => setActiveTab('permissions')}>
          Security & Permissions
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-info">
                <span className="metric-label">Hospital Bed Occupancy</span>
                <span className="metric-value">{metrics.bedOccupancyRate}%</span>
                <span className="metric-trend up"><TrendingUp className="trend-icon" /> {metrics.occupancyLabel} occupied</span>
              </div>
              <div className="metric-icon-box"><Bed style={{ width: '24px', height: '24px' }} /></div>
            </div>

            <div className="metric-card">
              <div className="metric-info">
                <span className="metric-label">Active Patient Records</span>
                <span className="metric-value">{metrics.activePatients}</span>
                <span className="metric-trend down"><AlertTriangle className="trend-icon" /> {metrics.criticalPatients} triaged critical</span>
              </div>
              <div className="metric-icon-box" style={{ color: 'var(--teal-600)' }}><FileText style={{ width: '24px', height: '24px' }} /></div>
            </div>

            <div className="metric-card">
              <div className="metric-info">
                <span className="metric-label">Active Personnel</span>
                <span className="metric-value">{metrics.totalStaff}</span>
                <span className="metric-trend up"><Check className="trend-icon" /> {metrics.onDutyStaff} on duty across {metrics.departmentCount} departments</span>
              </div>
              <div className="metric-icon-box"><Users style={{ width: '24px', height: '24px' }} /></div>
            </div>

            <div className="metric-card">
              <div className="metric-info">
                <span className="metric-label">Mean Cardiac Risk Index</span>
                <span className="metric-value">{metrics.avgRisk}%</span>
                <span className="metric-trend down"><AlertTriangle className="trend-icon" /> Across all active records</span>
              </div>
              <div className="metric-icon-box"><Activity style={{ width: '24px', height: '24px' }} /></div>
            </div>
          </div>

          <div className="glass-card">
            <div className="card-header-row">
              <div>
                <h2 className="card-title"><Activity style={{ width: '20px', height: '20px' }} /> Appointment Throughput</h2>
                <p className="card-subtitle">Derived from today's live appointment ledger — no projected figures</p>
              </div>
            </div>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-info">
                  <span className="metric-label">Booked Today</span>
                  <span className="metric-value">{metrics.appointmentsToday}</span>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-info">
                  <span className="metric-label">Completion Rate</span>
                  <span className="metric-value">{metrics.completionRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Staff Directory */}
      {activeTab === 'staff' && (
        <div className="glass-card">
          <div className="card-header-row">
            <div>
              <h2 className="card-title"><Users style={{ width: '20px', height: '20px' }} /> Hospital Personnel Roster</h2>
              <p className="card-subtitle">Manage medical staff, roles, and shift assignments</p>
            </div>
            <button className="btn-pill btn-pill-teal" onClick={() => showToast('Add Staff Modal Triggered')}>
              <Plus style={{ width: '16px', height: '16px' }} /> Add Staff Member
            </button>
          </div>

          <DataSection
            loading={loading}
            error={error}
            isEmpty={!staff.length}
            onRetry={refresh}
            skeletonRows={5}
            empty={<EmptyState title="No staff on file" message="Personnel appear here once their profiles are created." />}
          >
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Name & Role</th>
                  <th>Department</th>
                  <th>Shift Schedule</th>
                  <th>Duty Status</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id}>
                    <td><strong>{String(s.id).slice(0, 8)}</strong></td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{s.name}</div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--slate-500)' }}>{s.role}</div>
                    </td>
                    <td><span className="badge badge-info">{s.department}</span></td>
                    <td><span style={{ fontSize: 'var(--fs-sm)' }}>{s.shift}</span></td>
                    <td><span className="badge badge-success"><Check className="badge-icon" /> {s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </DataSection>
        </div>
      )}

      {/* Tab 3: Ward Capacity */}
      {activeTab === 'capacity' && (
        <div className="glass-card">
          <h2 className="card-title"><Activity style={{ width: '20px', height: '20px' }} /> Department Capacity Analysis</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', fontWeight: 700, marginBottom: '0.4rem' }}>
                <span>ICU Critical Care Unit</span>
                <span style={{ color: 'var(--teal-700)' }}>90% Capacity (18/20 Beds)</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: 'var(--slate-200)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: '90%', height: '100%', background: 'linear-gradient(90deg, var(--teal-600), #E11D48)' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', fontWeight: 700, marginBottom: '0.4rem' }}>
                <span>Cardiology Ward</span>
                <span style={{ color: 'var(--teal-700)' }}>85% Capacity (34/40 Beds)</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: 'var(--slate-200)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: '85%', height: '100%', background: 'linear-gradient(90deg, var(--cyan-500), var(--teal-600))' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Permissions */}
      {activeTab === 'permissions' && (
        <div className="glass-card">
          <h2 className="card-title"><Shield style={{ width: '20px', height: '20px' }} /> System Access & HIPAA Compliance</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem', background: 'rgba(255,255,255,0.7)', borderRadius: '12px' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>Doctor Role EMR Access</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--slate-500)' }}>Full read/write EMR, ML predictor execution</div>
              </div>
              <span className="badge badge-success"><Check className="badge-icon" /> Enabled</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem', background: 'rgba(255,255,255,0.7)', borderRadius: '12px' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>Nurse Role Vitals Log</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--slate-500)' }}>Vitals entry, MAR checklist sign-off</div>
              </div>
              <span className="badge badge-success"><Check className="badge-icon" /> Enabled</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
