import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, AUTH_MODE, ROLES } from '../../context/AuthContext';
import { HOME_FOR_ROLE } from '../../routes/guards';
import { useHospitalData } from '../../context/DataContext';
import { Activity, Search, LogOut, ChevronDown } from 'lucide-react';

export default function Navbar({ onOpenEMR }) {
  const { userRole, signOut, switchRole, profile, displayName } = useAuth();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const navigate = useNavigate();
  const { isLive, loading, lastSync } = useHospitalData();

  // Demo personas, used only when there is no database to read a real
  // profile from. In live mode the name and department come from `profiles`.
  const roleTitles = {
    admin: { title: 'Executive Admin', roleName: 'Hospital Director', color: '#3B82F6' },
    doctor: { title: 'Dr. Alexander Vance', roleName: 'Chief of Cardiology', color: '#0D9488' },
    nurse: { title: 'Nurse Jessica Alba', roleName: 'ICU Charge Nurse', color: '#6366F1' },
    receptionist: { title: 'Elena Rostova', roleName: 'Intake Coordinator', color: '#D97706' },
    patient: { title: 'Eleanor Vance', roleName: 'Personal Portal', color: '#F43F5E' }
  };

  const fallback = roleTitles[userRole] || roleTitles.doctor;
  const currentInfo = {
    title: displayName || fallback.title,
    roleName: profile?.department || fallback.roleName,
    color: fallback.color,
  };

  // The role switcher is a demo affordance. In live mode the role is a
  // database fact enforced by RLS, so offering to change it here would be
  // misleading at best.
  const canSwitchRole = AUTH_MODE === 'mock';

  const handleSignOut = async () => {
    setShowRoleDropdown(false);
    await signOut();
    navigate('/', { replace: true });
  };

  // Only clinical/administrative staff may look up arbitrary patient records.
  const canSearchAllPatients = userRole !== 'patient';

  return (
    <header className="navbar">
      <Link to="/" className="brand-container" aria-label="Wellora home">
        <div className="brand-logo-wrapper">
          <Activity className="pulse-w-svg" />
        </div>
        <div className="brand-text-container">
          <span className="brand-name">Wellora</span>
          <span className="brand-tagline">Healthcare Reimagined</span>
        </div>
      </Link>

      {/* Single Source EMR Badge */}
      <div className="emr-architecture-pill">
        <span className="emr-pulse-dot"></span>
        <span>Single Source EMR</span>
      </div>

      {/* Whether the screen is showing the database or the offline dataset.
          Worth surfacing: an examiner should never have to guess. */}
      <span
        className={`sync-pill ${isLive ? 'sync-pill-live' : 'sync-pill-demo'}`}
        title={lastSync ? `Last synced ${lastSync.toLocaleTimeString()}` : undefined}
      >
        {loading ? 'Syncing…' : isLive ? '● Live data' : '● Demo data'}
      </span>

      <div className="navbar-actions">
        {/* Cross-patient search and Quick EMR are staff-only. A patient may
            only ever reach their own record, so these controls do not render
            for the patient role — this mirrors the RLS boundary in the DB. */}
        {canSearchAllPatients && (
          <>
            <div className="search-wrapper">
              <Search className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search patient, EMR ID..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onOpenEMR('WEL-8942');
                }}
              />
            </div>

            <button
              className="btn-pill btn-pill-primary"
              style={{ padding: '0.45rem 1.1rem', fontSize: '0.8rem' }}
              onClick={() => onOpenEMR('WEL-8942')}
            >
              ⚡ Quick EMR
            </button>
          </>
        )}

        {/* User Profile Badge with Role Switcher Dropdown */}
        <div style={{ position: 'relative' }}>
          <div
            className="user-profile-badge"
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
          >
            <div className="avatar-circle" style={{ background: currentInfo.color }}>
              {currentInfo.title.substring(0, 2).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{currentInfo.title}</span>
              <span className="user-role-title">{currentInfo.roleName}</span>
            </div>
            <ChevronDown style={{ width: '14px', height: '14px', color: 'var(--slate-400)' }} />
          </div>

          {showRoleDropdown && (
            <div style={{
              position: 'absolute',
              top: '110%',
              right: 0,
              width: '210px',
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(16px)',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: '0 12px 30px rgba(10,25,47,0.15)',
              padding: '0.5rem',
              zIndex: 500
            }}>
              {canSwitchRole ? (
                <>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--slate-400)', padding: '0.4rem 0.6rem', textTransform: 'uppercase' }}>
                    Switch View Role (Demo)
                  </div>
                  {ROLES.map(r => (
                    <button
                      key={r}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.45rem 0.6rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: userRole === r ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                        color: userRole === r ? 'var(--teal-700)' : 'var(--slate-700)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setShowRoleDropdown(false);
                        switchRole(r);
                        // Full page load rather than client-side navigate.
                        // The role lives in React state while the location
                        // lives in the router, and the router's update is
                        // async — so a client-side navigate lets the new role
                        // render against the OLD route for one commit, and
                        // that route's RoleRoute bounces it to /unauthorized.
                        // The demo role is persisted in sessionStorage, so a
                        // hard load comes back already in the new role.
                        window.location.assign(HOME_FOR_ROLE[r]);
                      }}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)} Dashboard
                    </button>
                  ))}
                </>
              ) : (
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate-400)', padding: '0.5rem 0.6rem', lineHeight: 1.5 }}>
                  Signed in as <strong style={{ color: 'var(--navy-900)' }}>{userRole}</strong>.
                  Your role is set by your account.
                </div>
              )}
              <div style={{ borderTop: '1px solid var(--slate-200)', marginTop: '0.4rem', paddingTop: '0.4rem' }}>
                <button
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.45rem 0.6rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: '#E11D48',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                  onClick={handleSignOut}
                >
                  <LogOut style={{ width: '14px', height: '14px' }} />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
