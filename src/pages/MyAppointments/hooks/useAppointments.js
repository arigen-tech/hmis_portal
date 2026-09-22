import { useState, useEffect } from 'react';
import { apiService } from '../../../services/apiService';
import { ENDPOINTS, API_VISIT_STATUS, APPOINTMENT_TYPE, DEPT_CODE } from '../../../constants';
import { mapOpdCompletedItem, mapCancelledItem, mapHistoryItem } from '../mappers';

export function useAppointments({ 
  activeMenu, 
  activeSubTab, 
  diagnosticTab, 
  historyFilter, 
  refreshTrigger,
  parsedPatient,
  parsedHospital 
}) {
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [labAppointments, setLabAppointments] = useState([]);
  const [radiologyAppointments, setRadiologyAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    const fetchAppointments = async () => {
      if (!parsedPatient || !parsedHospital) return;
      
      let deptCode = DEPT_CODE.OPD;
      if (activeMenu === APPOINTMENT_TYPE.RADIOLOGY) deptCode = DEPT_CODE.RAD;
      if (activeMenu === APPOINTMENT_TYPE.LAB) deptCode = DEPT_CODE.LAB;
      if (activeMenu === 'diagnostics') {
         if (diagnosticTab === APPOINTMENT_TYPE.RADIOLOGY) deptCode = DEPT_CODE.RAD;
         else if (diagnosticTab === APPOINTMENT_TYPE.LAB) deptCode = DEPT_CODE.LAB;
         else deptCode = `${DEPT_CODE.LAB},${DEPT_CODE.RAD}`;
      }
      
      setIsLoading(true);
      try {
        if (activeMenu === APPOINTMENT_TYPE.OPD && activeSubTab === 'completed') {
          const queryParams = new URLSearchParams({
            patientId: parsedPatient.patientId,
            page: 0,
            size: 10
          });
          
          const response = await apiService.get(`${ENDPOINTS.APPOINTMENTS.OPD_REPORTS_LIST}?${queryParams.toString()}`);
          
          if (!ignore && response.status === 200 && response.response && response.response.content) {
            const mapped = response.response.content.map(app => mapOpdCompletedItem(app, parsedHospital));
            setPastAppointments(mapped);
          }
        } else if (activeSubTab === 'cancelled') {
          const queryParams = new URLSearchParams({
            hospitalId: parsedHospital.id,
            patientId: parsedPatient.patientId,
            departmentType: deptCode,
            page: 0,
            size: 10
          });
          
          const response = await apiService.get(`${ENDPOINTS.APPOINTMENTS.CANCELLED_REFUND_LIST}?${queryParams.toString()}`);
          
          if (!ignore && response.status === 200 && response.response && response.response.content) {
            const mapped = response.response.content.map(app => mapCancelledItem(app, parsedHospital));
            
            if (deptCode === DEPT_CODE.OPD) {
               setPastAppointments(mapped);
            } else if (deptCode === DEPT_CODE.LAB) {
               setLabAppointments(mapped);
            } else if (deptCode === DEPT_CODE.RAD) {
               setRadiologyAppointments(mapped);
            } else {
               setLabAppointments(mapped.filter(a => a.type === APPOINTMENT_TYPE.LAB));
               setRadiologyAppointments(mapped.filter(a => a.type === APPOINTMENT_TYPE.RADIOLOGY));
            }
          }
        } else {
          const paramsObj = {
            hospitalId: parsedHospital.id,
            patientId: parsedPatient.patientId,
            deptTypeCode: deptCode,
            includeAllHistory: historyFilter === 'all_history' ? 'true' : 'false'
          };
          const queryParams = new URLSearchParams(paramsObj);
          
          if (activeSubTab === 'upcoming') {
            queryParams.append('visitStatus', API_VISIT_STATUS.NO);
          } else if (activeSubTab === 'completed' && activeMenu !== APPOINTMENT_TYPE.OPD) {
            queryParams.append('visitStatus', API_VISIT_STATUS.YES);
          }
          
          const response = await apiService.get(`${ENDPOINTS.APPOINTMENTS.HISTORY_LIST}?${queryParams.toString()}`);
          
          if (!ignore && response.status === 200 && response.response) {
            const mapped = response.response.map(app => mapHistoryItem(app, parsedHospital));
            
            if (deptCode === DEPT_CODE.OPD) {
               if (activeSubTab === 'upcoming') {
                 setUpcomingAppointments(mapped);
               } else {
                 setPastAppointments(mapped);
               }
            } else if (deptCode === DEPT_CODE.LAB) {
               setLabAppointments(mapped);
            } else if (deptCode === DEPT_CODE.RAD) {
               setRadiologyAppointments(mapped);
            } else {
               setLabAppointments(mapped.filter(a => a.type === APPOINTMENT_TYPE.LAB));
               setRadiologyAppointments(mapped.filter(a => a.type === APPOINTMENT_TYPE.RADIOLOGY));
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch appointments", error);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchAppointments();

    return () => {
      ignore = true;
    };
  }, [activeMenu, activeSubTab, diagnosticTab, historyFilter, refreshTrigger, parsedPatient, parsedHospital]);

  return {
    upcomingAppointments,
    pastAppointments,
    labAppointments,
    setLabAppointments,
    radiologyAppointments,
    setRadiologyAppointments,
    isLoading
  };
}
