import { createContext, useContext } from 'react';

/**
 * Access to the app-level EMR / ML modals from anywhere inside AppShell,
 * so a deeply nested component does not need props drilled through every
 * dashboard to open a patient record.
 */
export const EMRContext = createContext({ openEMR: () => {}, openML: () => {} });

export function useEMR() {
  return useContext(EMRContext);
}
