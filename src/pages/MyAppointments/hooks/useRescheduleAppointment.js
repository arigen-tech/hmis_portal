import { useState, useCallback } from 'react';
import { apiService } from '../../../services/apiService';
import { ENDPOINTS, APPOINTMENT_TYPE, DEPT_CODE } from '../../../constants';

export function useRescheduleAppointment({ showToast, onRefresh }) {
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [showRescheduleConfirm, setShowRescheduleConfirm] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Initialize dates with safe defaults when opening the form
  const initReschedule = useCallback(() => {
    // default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setRescheduleDate(tomorrow.toISOString().split('T')[0]);
    setRescheduleTime('11:00 AM');
    setShowRescheduleConfirm(false);
  }, []);

  const handleApproveReschedule = useCallback(async (selectedAppointment) => {
    if (!selectedAppointment) return;
    const displayName = selectedAppointment.testName || selectedAppointment.doctor;
    
    setIsRescheduling(true);
    try {
      let moduleType = DEPT_CODE.OPD;
      if (selectedAppointment.type === APPOINTMENT_TYPE.LAB) moduleType = DEPT_CODE.LAB;
      if (selectedAppointment.type === APPOINTMENT_TYPE.RADIOLOGY) moduleType = DEPT_CODE.RAD;

      let apiStartTime = null;
      let apiEndTime = null;

      if (moduleType === DEPT_CODE.OPD) {
        apiStartTime = rescheduleTime;
      }

      const payload = {
        visitId: selectedAppointment.id,
        moduleType: moduleType,
        tokenNumber: null,
        visitDate: `${rescheduleDate}T00:00:00Z`,
        appointmentStartTime: apiStartTime,
        appointmentEndTime: apiEndTime
      };

      const response = await apiService.post(ENDPOINTS.APPOINTMENTS.RESCHEDULE_APPOINTMENT, payload);

      if (response && response.status === 200) {
        if (onRefresh) onRefresh();
        showToast(`Appointment rescheduled for ${displayName} to ${rescheduleDate}!`);
        return true;
      } else {
        showToast(response?.message || "Failed to reschedule appointment", "error");
        return false;
      }
    } catch (error) {
      console.error(error);
      showToast("An error occurred while rescheduling.", "error");
      return false;
    } finally {
      setIsRescheduling(false);
    }
  }, [rescheduleDate, rescheduleTime, showToast, onRefresh]);

  return {
    rescheduleDate,
    setRescheduleDate,
    rescheduleTime,
    setRescheduleTime,
    showRescheduleConfirm,
    setShowRescheduleConfirm,
    isRescheduling,
    initReschedule,
    handleApproveReschedule
  };
}
