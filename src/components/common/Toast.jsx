import React from 'react';
import { Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Toast() {
  const { toastMessage } = useAuth();
  if (!toastMessage) return null;

  return (
    <div className="toast-container">
      <div className="toast-message">
        <Activity style={{ width: '18px', height: '18px', stroke: 'var(--cyan-400)' }} />
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
