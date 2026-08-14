import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Calendar, FileText, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HOME_FOR_ROLE } from '../../routes/guards';

export default function HeroSection() {
  const navigate = useNavigate();
  const { isLoggedIn, userRole, displayName } = useAuth();

  const dashboardPath = HOME_FOR_ROLE[userRole] ?? '/';

  // Signed-in visitors reach this page via the navbar logo, so the primary
  // action is "go back", not "sign in".
  const goToLogin = () =>
    navigate(isLoggedIn ? dashboardPath : '/login');

  return (
    <div className="hero-landing-container">
      {/* Top Public Navbar (Matching Reference Image 1) */}
      <header className="hero-top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--navy-900), var(--teal-700))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px var(--cyan-glow)'
          }}>
            <Activity style={{ width: '26px', height: '26px', stroke: '#ffffff' }} />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--navy-900)', letterSpacing: '-0.02em' }}>
            Wellora
          </span>
        </div>

        <nav className="hero-nav-links">
          <a className="hero-nav-link" href="#healthcare">Healthcare</a>
          <a className="hero-nav-link" href="#resources">Resources</a>
          <a className="hero-nav-link" href="#analytics">Analytics</a>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isLoggedIn ? (
            <>
              <span className="hero-nav-link" style={{ cursor: 'default' }}>
                Signed in{displayName ? ` as ${displayName}` : ''}
              </span>
              <button
                className="btn-pill btn-pill-primary"
                style={{ padding: '0.55rem 1.4rem', fontSize: '0.88rem' }}
                onClick={() => navigate(dashboardPath)}
              >
                Back to dashboard
              </button>
            </>
          ) : (
            <>
              <button
                className="hero-nav-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => navigate('/login')}
              >
                Login
              </button>
              <button
                className="btn-pill btn-pill-primary"
                style={{ padding: '0.55rem 1.4rem', fontSize: '0.88rem' }}
                onClick={() => navigate('/login')}
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Hero Center Content (Matching Reference Image 1) */}
      <main className="hero-center-content">
        <h1 className="hero-title">Healthcare, Reimagined.</h1>
        
        <p className="hero-subtitle">
          Built on a Single Source of Truth EMR architecture. Unified patient records, real-time clinical care workflows, and ML heart disease risk intelligence for modern healthcare systems.
        </p>

        <button
          className="hero-cta-button"
          onClick={() => goToLogin()}
        >
          {isLoggedIn ? 'Go to my dashboard' : 'Get Started'}
        </button>
      </main>

      {/* Bottom Feature Pill Icons (Matching Reference Image 1) */}
      <footer className="hero-bottom-pills">
        <div className="hero-pill-feature" onClick={() => goToLogin()}>
          <div className="hero-pill-icon-box">
            <Calendar style={{ width: '28px', height: '28px' }} />
          </div>
          <span className="hero-pill-label">Appointments</span>
        </div>

        <div className="hero-pill-feature" onClick={() => goToLogin()}>
          <div className="hero-pill-icon-box">
            <FileText style={{ width: '28px', height: '28px' }} />
          </div>
          <span className="hero-pill-label">Patient Records</span>
        </div>

        <div className="hero-pill-feature" onClick={() => goToLogin()}>
          <div className="hero-pill-icon-box">
            <TrendingUp style={{ width: '28px', height: '28px' }} />
          </div>
          <span className="hero-pill-label">Analytics</span>
        </div>
      </footer>

    </div>
  );
}
