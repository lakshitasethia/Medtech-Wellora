import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useAuth, AUTH_MODE, ROLES } from '../context/AuthContext';
import { HOME_FOR_ROLE } from '../routes/guards';

/**
 * Login screen.
 *
 * In live mode the role selector is NOT shown — the role is read from the
 * user's `profiles` row after authentication. A client-side role picker
 * would let anyone choose their own privileges, which is exactly what the
 * RLS policies exist to prevent. The picker only appears in mock mode,
 * where there is no database to protect.
 */
export default function LoginPage() {
  const { signIn, signInWithGoogle, authError, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [demoRole, setDemoRole] = useState('doctor');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  const isLive = AUTH_MODE === 'live';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (isLive && (!email.trim() || !password)) {
      setLocalError('Enter your email and password.');
      return;
    }

    setSubmitting(true);
    const result = await signIn(email.trim(), password, demoRole);
    setSubmitting(false);

    if (!result.ok) {
      setLocalError(result.error ?? 'Sign-in failed.');
      return;
    }

    const role = result.role ?? demoRole;
    const home = HOME_FOR_ROLE[role] ?? '/';

    // Only honour the originally-requested route if this role can actually
    // reach it — otherwise a nurse who was bounced from /doctor would log
    // in and land straight on "Access restricted".
    const from = location.state?.from?.pathname;
    const target = from && from.startsWith(home) ? from : home;

    navigate(target, { replace: true });
  };

  const handleGoogle = async () => {
    setLocalError(null);
    setSubmitting(true);
    const result = await signInWithGoogle();
    // On success the browser navigates to Google, so this only runs on failure.
    if (!result.ok) setSubmitting(false);
  };

  const error = localError ?? authError;
  const busy = submitting || loading;

  return (
    <div className="modal-overlay" style={{ opacity: 1, pointerEvents: 'auto' }}>
      <div className="glass-login-card">
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, var(--navy-900), var(--teal-700))',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 25px var(--cyan-glow)',
          }}>
            <Activity style={{ width: '32px', height: '32px', stroke: '#ffffff' }} />
          </div>
        </div>

        <h2 style={{
          textAlign: 'center',
          fontSize: 'var(--fs-lg)',
          fontWeight: 800,
          color: 'var(--navy-900)',
          marginBottom: '0.35rem',
        }}>
          Wellora Single Source Portal
        </h2>
        <p style={{
          textAlign: 'center',
          fontSize: 'var(--fs-sm)',
          color: 'var(--teal-700)',
          fontWeight: 600,
          marginBottom: '1.5rem',
        }}>
          Authorized Hospital Personnel &amp; Patient Access
        </p>

        {!isLive && (
          <>
            <div style={{
              fontSize: 'var(--fs-xs)',
              fontWeight: 700,
              color: 'var(--slate-500)',
              textAlign: 'center',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              Demo mode — choose a role
            </div>
            <div className="login-role-select-bar">
              {ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`login-role-tab ${demoRole === role ? 'active' : ''}`}
                  onClick={() => setDemoRole(role)}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </>
        )}

        {isLive && (
          <>
            <button
              type="button"
              className="google-signin-btn"
              onClick={handleGoogle}
              disabled={busy}
            >
              <svg viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"/>
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
              </svg>
              Continue with Google
            </button>

            <div className="auth-divider"><span>or sign in with credentials</span></div>
          </>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            className="login-pill-input"
            placeholder={isLive ? 'Email address' : 'Email (optional in demo mode)'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            disabled={busy}
          />
          <input
            type="password"
            className="login-pill-input"
            placeholder={isLive ? 'Password' : 'Password (optional in demo mode)'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={busy}
          />

          {error && (
            <div
              role="alert"
              style={{
                padding: '0.7rem 1rem',
                marginBottom: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--risk-high-bg)',
                border: '1px solid rgba(225, 29, 72, 0.35)',
                color: 'var(--risk-high)',
                fontSize: 'var(--fs-sm)',
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-pill btn-pill-primary"
            style={{ width: '100%', padding: '0.9rem', fontSize: 'var(--fs-md)', marginTop: '0.5rem' }}
            disabled={busy}
          >
            {busy ? 'Signing in…' : 'Secure Access'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '1.1rem',
          fontSize: 'var(--fs-xs)',
          color: 'var(--slate-400)',
        }}>
          {isLive
            ? 'Patients: sign in with the email your hospital registered. Staff: use your issued credentials.'
            : 'Offline demo — no database configured.'}
        </div>
      </div>
    </div>
  );
}
