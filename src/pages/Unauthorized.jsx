import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { HOME_FOR_ROLE } from '../routes/guards';

export default function Unauthorized() {
  const { userRole } = useAuth();
  const location = useLocation();
  const attempted = location.state?.attempted;

  return (
    <div className="glass-card" style={{ maxWidth: '560px', margin: '3rem auto', textAlign: 'center' }}>
      <div className="metric-icon-box" style={{ margin: '0 auto 1rem', color: 'var(--risk-high)' }}>
        <ShieldAlert style={{ width: '26px', height: '26px' }} />
      </div>
      <h2 className="card-title" style={{ justifyContent: 'center' }}>Access restricted</h2>
      <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>
        Your role (<strong>{userRole ?? 'unknown'}</strong>) does not have permission to view
        this area{attempted ? ` — it is limited to ${attempted.join(', ')}.` : '.'}
      </p>
      <Link className="btn-pill btn-pill-teal" to={HOME_FOR_ROLE[userRole] ?? '/'}>
        Return to my dashboard
      </Link>
    </div>
  );
}
