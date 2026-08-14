import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import UnifiedEMRModal from '../emr/UnifiedEMRModal';
import MLRiskModal from '../ml/MLRiskModal';
import Toast from './Toast';
import { EMRContext } from './emrContext';
import { DataProvider } from '../../context/DataContext';

/**
 * Authenticated layout: navbar, routed content, and the two global modals.
 *
 * The modals live here rather than inside each dashboard so any role can
 * open the same unified record by id — which is the Single Source of Truth
 * thesis expressed structurally, not just in a badge.
 */
export default function AppShell() {
  const [emrPatientId, setEmrPatientId] = useState(null);
  const [mlPatientId, setMlPatientId] = useState(null);

  const openEMR = (id) => setEmrPatientId(id);
  const openML = (id) => setMlPatientId(id);

  return (
    <DataProvider>
    <EMRContext.Provider value={{ openEMR, openML }}>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar onOpenEMR={openEMR} />

        <main
          style={{
            flex: 1,
            maxWidth: '1600px',
            width: '100%',
            margin: '0 auto',
            padding: '1.75rem 2rem',
          }}
        >
          <Outlet context={{ openEMR, openML }} />
        </main>

        {/* `key` forces fresh state per patient — without it the ML sliders
            keep the previous patient's values. */}
        <UnifiedEMRModal
          key={`emr-${emrPatientId}`}
          patientId={emrPatientId}
          isOpen={Boolean(emrPatientId)}
          onClose={() => setEmrPatientId(null)}
          onOpenML={openML}
        />

        <MLRiskModal
          key={`ml-${mlPatientId}`}
          patientId={mlPatientId}
          isOpen={Boolean(mlPatientId)}
          onClose={() => setMlPatientId(null)}
        />

        <Toast />
      </div>
    </EMRContext.Provider>
    </DataProvider>
  );
}
