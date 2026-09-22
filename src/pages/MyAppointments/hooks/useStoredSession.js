import { useMemo } from 'react';
import { STORAGE_KEYS } from '../../../constants';

/**
 * Custom hook to safely parse and return stored session data.
 */
export function useStoredSession() {
  const patientDetails = useMemo(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PATIENT_DETAILS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Failed to parse patientDetails", e);
      return null;
    }
  }, []);

  const selectedHospital = useMemo(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SELECTED_HOSPITAL);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Failed to parse selectedHospital", e);
      return null;
    }
  }, []);

  return { patientDetails, selectedHospital };
}
