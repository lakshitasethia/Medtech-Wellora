import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useEMR } from '../components/common/emrContext';

import HeroSection from '../components/landing/HeroSection';
import LoginPage from '../pages/LoginPage';
import Unauthorized from '../pages/Unauthorized';
import NotFound from '../pages/NotFound';
import AppShell from '../components/common/AppShell';
import { ProtectedRoute, RoleRoute, RedirectIfAuthed } from './guards';

import AdminDashboard from '../components/admin/AdminDashboard';
import DoctorDashboard from '../components/doctor/DoctorDashboard';
import NurseDashboard from '../components/nurse/NurseDashboard';
import ReceptionistDashboard from '../components/receptionist/ReceptionistDashboard';
import PatientDashboard from '../components/patient/PatientDashboard';

/**
 * Dashboards still take onOpenEMR/onOpenML props. These thin wrappers feed
 * them from AppShell so the dashboard components did not need rewriting
 * when routing was introduced.
 *
 * This reads from EMRContext rather than `useOutletContext`: RoleRoute
 * sits between AppShell and the dashboard and renders a bare <Outlet />,
 * which resets the outlet context to undefined. A plain React context is
 * unaffected by that nesting.
 */
const withModals = (Component) => function Routed() {
  const { openEMR, openML } = useEMR();
  return <Component onOpenEMR={openEMR} onOpenML={openML} />;
};

const AdminRoute = withModals(AdminDashboard);
const DoctorRoute = withModals(DoctorDashboard);
const NurseRoute = withModals(NurseDashboard);
const ReceptionRoute = withModals(ReceptionistDashboard);
const PortalRoute = withModals(PatientDashboard);

export const router = createBrowserRouter([
  {
    // Deliberately NOT wrapped in RedirectIfAuthed. The landing page is
    // public marketing content with no patient data on it, and the navbar
    // logo links here — bouncing a signed-in user straight back to their
    // dashboard would make that link look broken. HeroSection swaps its
    // own call-to-action for "Back to dashboard" when a session exists.
    path: '/',
    element: <HeroSection />,
  },
  {
    path: '/login',
    element: (
      <RedirectIfAuthed>
        <LoginPage />
      </RedirectIfAuthed>
    ),
  },
  {
    // Everything below requires a session.
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/unauthorized', element: <Unauthorized /> },

          {
            element: <RoleRoute allow={['admin']} />,
            children: [{ path: '/admin', element: <AdminRoute /> }],
          },
          {
            element: <RoleRoute allow={['doctor']} />,
            children: [{ path: '/doctor', element: <DoctorRoute /> }],
          },
          {
            element: <RoleRoute allow={['nurse']} />,
            children: [{ path: '/nurse', element: <NurseRoute /> }],
          },
          {
            element: <RoleRoute allow={['receptionist']} />,
            children: [{ path: '/reception', element: <ReceptionRoute /> }],
          },
          {
            element: <RoleRoute allow={['patient']} />,
            children: [{ path: '/portal', element: <PortalRoute /> }],
          },

          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
