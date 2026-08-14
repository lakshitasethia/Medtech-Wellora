import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HOME_FOR_ROLE } from '../routes/guards';

export default function NotFound() {
  const { isLoggedIn, userRole } = useAuth();
  return (
    <div className="glass-card" style={{ maxWidth: '520px', margin: '3rem auto', textAlign: 'center' }}>
      <h2 className="card-title" style={{ justifyContent: 'center' }}>Page not found</h2>
      <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>
        That route does not exist in Wellora.
      </p>
      <Link className="btn-pill btn-pill-teal" to={isLoggedIn ? (HOME_FOR_ROLE[userRole] ?? '/') : '/'}>
        Go back
      </Link>
    </div>
  );
}
