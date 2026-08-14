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
  const { signIn, authError, loading } = useAuth();
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
          fontSize: '1.4rem',
          fontWeight: 800,
          color: 'var(--navy-900)',
          marginBottom: '0.35rem',
        }}>
          Wellora Single Source Portal
        </h2>
        <p style={{
          textAlign: 'center',
          fontSize: '0.82rem',
          color: 'var(--teal-700)',
          fontWeight: 600,
          marginBottom: '1.5rem',
        }}>
          Authorized Hospital Personnel &amp; Patient Access
        </p>

        {!isLive && (
          <>
            <div style={{
              fontSize: '0.72rem',
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
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-pill btn-pill-primary"
            style={{ width: '100%', padding: '0.9rem', fontSize: '1.1rem', marginTop: '0.5rem' }}
            disabled={busy}
          >
            {busy ? 'Signing in…' : 'Secure Access'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '1.1rem',
          fontSize: '0.7rem',
          color: 'var(--slate-400)',
        }}>
          {isLive
            ? 'Your role is determined by your account, not selected here.'
            : 'Offline demo — no database configured.'}
        </div>
      </div>
    </div>
  );
}
