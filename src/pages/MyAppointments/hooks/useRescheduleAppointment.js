import { useState, useCallback, useEffect } from 'react';
import { apiService } from '../../../services/apiService';
import { ENDPOINTS, APPOINTMENT_TYPE, DEPT_CODE } from '../../../constants';

export function useRescheduleAppointment({ showToast, onRefresh }) {
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  
  const [showRescheduleConfirm, setShowRescheduleConfirm] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  
  const [activeAppointment, setActiveAppointment] = useState(null);
  
  const [opdSessionsList, setOpdSessionsList] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [rawTimeSlots, setRawTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [isTimeSlotsLoading, setIsTimeSlotsLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    const fetchSessions = async () => {
      try {
        const res = await apiService.get(ENDPOINTS.MASTER.GET_OPD_SESSIONS);
        if (!ignore && res && res.status === 200 && res.response) {
          setOpdSessionsList(res.response);
          if (res.response.length > 0) {
            setSelectedSessionId(res.response[0].id);
          }
        }
      } catch (e) {
        console.error("Failed to fetch OPD sessions", e);
      }
    };
    fetchSessions();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    let ignore = false;
    const fetchSlots = async () => {
      if (!activeAppointment || activeAppointment.type !== APPOINTMENT_TYPE.OPD) return;
      if (!rescheduleDate || !selectedSessionId) {
        setAvailableTimeSlots([]);
        return;
      }

      setIsTimeSlotsLoading(true);
      try {
        const rawDoctorId = activeAppointment.doctorId;
        const deptId = activeAppointment.departmentId; 
        if (!rawDoctorId || !deptId) {
            setAvailableTimeSlots([]);
            return;
        }

        const url = `${ENDPOINTS.APPOINTMENTS.GET_APPOINTMENT_SLOTS}?deptId=${deptId}&doctorId=${rawDoctorId}&appointmentDate=${rescheduleDate}&sessionId=${selectedSessionId}`;
        const res = await apiService.get(url);
        
        if (!ignore && res && res.status === 200 && res.response) {
          const availableSlots = res.response.filter(slot => slot.available);
          setRawTimeSlots(availableSlots);
          const slots = availableSlots.map(slot => {
              let start = new Date(`1970-01-01T${slot.startTime}`);
              return start.toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' });
            });
          
          setAvailableTimeSlots(slots);
          if (slots.length > 0) {
            setSelectedTimeSlot(slots[0]);
          } else {
            setSelectedTimeSlot('');
          }
        }
      } catch (err) {
        console.error("Failed to fetch slots:", err);
        if (!ignore) {
          setAvailableTimeSlots([]);
          setRawTimeSlots([]);
          setSelectedTimeSlot('');
        }
      } finally {
        if (!ignore) {
          setIsTimeSlotsLoading(false);
        }
      }
    };
    fetchSlots();
    return () => { ignore = true; };
  }, [activeAppointment, rescheduleDate, selectedSessionId]);

  const initReschedule = useCallback((app) => {
    setActiveAppointment(app);
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
      let payloadVisitDate = `${rescheduleDate}T00:00:00Z`;
      let payloadSessionId = null;
      let payloadTokenNumber = selectedAppointment.tokenNo && selectedAppointment.tokenNo !== '-' ? Number(selectedAppointment.tokenNo) : null;
      
      if (moduleType === DEPT_CODE.OPD) {
          if (!rescheduleDate || !selectedTimeSlot || !selectedSessionId) {
             showToast("Please select a date, session, and time slot.", "error");
             setIsRescheduling(false);
             return false;
          }
          payloadSessionId = selectedSessionId;
          
          const timeSlotIndex = availableTimeSlots.indexOf(selectedTimeSlot);
          if (timeSlotIndex !== -1 && rawTimeSlots[timeSlotIndex]) {
             const raw = rawTimeSlots[timeSlotIndex];
             apiStartTime = `${rescheduleDate}T${raw.startTime}Z`;
             apiEndTime = `${rescheduleDate}T${raw.endTime}Z`;
             if (raw.tokenNo) payloadTokenNumber = raw.tokenNo;
          } else {
             apiStartTime = `${rescheduleDate}T00:00:00Z`;
             apiEndTime = `${rescheduleDate}T00:00:00Z`;
          }
      } else {
         apiStartTime = null;
         apiEndTime = null;
         payloadTokenNumber = null;
      }

      const payload = {
        visitId: selectedAppointment.id,
        moduleType: moduleType,
        tokenNumber: payloadTokenNumber,
        visitDate: payloadVisitDate,
        appointmentStartTime: apiStartTime,
        appointmentEndTime: apiEndTime,
        sessionId: payloadSessionId
      };

      const response = await apiService.post(ENDPOINTS.APPOINTMENTS.RESCHEDULE_APPOINTMENT, payload);

      if (response && response.status === 200) {
        if (onRefresh) onRefresh();
        showToast(`Appointment rescheduled for ${displayName}!`);
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
  }, [rescheduleDate, rescheduleTime, showToast, onRefresh, selectedTimeSlot, selectedSessionId, availableTimeSlots, rawTimeSlots]);

  return {
    rescheduleDate,
    setRescheduleDate,
    rescheduleTime,
    setRescheduleTime,
    showRescheduleConfirm,
    setShowRescheduleConfirm,
    isRescheduling,
    initReschedule,
    handleApproveReschedule,
    
    opdSessionsList,
    selectedSessionId,
    setSelectedSessionId,
    availableTimeSlots,
    selectedTimeSlot,
    setSelectedTimeSlot,
    isTimeSlotsLoading
  };
}
