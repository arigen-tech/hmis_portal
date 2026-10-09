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
  parsedHospital,
  page = 0
}) {
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [labAppointments, setLabAppointments] = useState([]);
  const [radiologyAppointments, setRadiologyAppointments] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingCounts, setPendingCounts] = useState({ opd: 0, lab: 0, rad: 0 });

  // Fetch pending counts globally for the sidebar
  useEffect(() => {
    if (!parsedPatient || !parsedHospital) return;
    
    const fetchPendingCount = async (deptCode) => {
      const queryParams = new URLSearchParams({
        hospitalId: parsedHospital.id,
        patientId: parsedPatient.patientId,
        deptTypeCode: deptCode,
        includeAllHistory: historyFilter === 'all_history' ? 'true' : 'false',
        page: 0,
        size: 1,
        visitStatus: API_VISIT_STATUS.NO
      });
      try {
        const res = await apiService.get(`${ENDPOINTS.APPOINTMENTS.HISTORY_LIST}?${queryParams.toString()}`);
        if (res.status === 200 && res.response) {
          if (res.response.totalElements !== undefined) return res.response.totalElements;
          if (res.response.content) return res.response.totalElements || res.response.content.length || 0;
          return res.response.length || 0;
        }
      } catch (e) {
        console.error("Error fetching pending count for " + deptCode, e);
      }
      return 0;
    };

    Promise.all([
      fetchPendingCount(DEPT_CODE.OPD),
      fetchPendingCount(DEPT_CODE.LAB),
      fetchPendingCount(DEPT_CODE.RAD)
    ]).then(([opd, lab, rad]) => {
      setPendingCounts({ opd, lab, rad });
    });
  }, [parsedPatient, parsedHospital, refreshTrigger, historyFilter]);

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
            page: page,
            size: 5
          });
          
          const response = await apiService.get(`${ENDPOINTS.APPOINTMENTS.OPD_REPORTS_LIST}?${queryParams.toString()}`);
          
          if (!ignore && response.status === 200 && response.response && response.response.content) {
            const mapped = response.response.content.map(app => mapOpdCompletedItem(app, parsedHospital));
            setPastAppointments(mapped);
            setTotalPages(response.response.totalPages || 0);
            setTotalElements(response.response.totalElements || 0);
          }
        } else if (activeSubTab === 'cancelled') {
          const queryParams = new URLSearchParams({
            hospitalId: parsedHospital.id,
            patientId: parsedPatient.patientId,
            departmentType: deptCode,
            page: page,
            size: 5
          });
          
          const response = await apiService.get(`${ENDPOINTS.APPOINTMENTS.CANCELLED_REFUND_LIST}?${queryParams.toString()}`);
          
          if (!ignore && response.status === 200 && response.response && response.response.content) {
            const mapped = response.response.content.map(app => mapCancelledItem(app, parsedHospital));
            setTotalPages(response.response.totalPages || 0);
            setTotalElements(response.response.totalElements || 0);

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
            page: page,
            size: 5
          };
          
          if (activeSubTab === 'upcoming') {
            paramsObj.includeAllHistory = historyFilter === 'all_history' ? 'true' : 'false';
          }

          const queryParams = new URLSearchParams(paramsObj);
          
          if (activeSubTab === 'upcoming') {
            queryParams.append('visitStatus', API_VISIT_STATUS.NO);
          } else if (activeSubTab === 'completed' && activeMenu !== APPOINTMENT_TYPE.OPD) {
            queryParams.append('visitStatus', API_VISIT_STATUS.YES);
          }
          
          const response = await apiService.get(`${ENDPOINTS.APPOINTMENTS.HISTORY_LIST}?${queryParams.toString()}`);
          
          if (!ignore && response.status === 200 && response.response) {
            let dataToMap;
            let responseTotal = 0;
            if (response.response.content) {
               dataToMap = response.response.content;
               responseTotal = response.response.totalElements || 0;
               setTotalPages(response.response.totalPages || 0);
               setTotalElements(responseTotal);
            } else {
               const fullArray = response.response;
               responseTotal = fullArray.length;
               setTotalPages(Math.ceil(fullArray.length / 5));
               setTotalElements(responseTotal);
               dataToMap = fullArray.slice(page * 5, (page + 1) * 5);
            }
            
            const mapped = dataToMap.map(app => mapHistoryItem(app, parsedHospital));
            
            if (deptCode === DEPT_CODE.OPD) {
               if (activeSubTab === 'upcoming') {
                 setUpcomingAppointments(mapped);
                 setPendingCounts(prev => ({ ...prev, opd: responseTotal }));
               } else {
                 setPastAppointments(mapped);
               }
            } else if (deptCode === DEPT_CODE.LAB) {
               setLabAppointments(mapped);
               if (activeSubTab === 'upcoming') {
                 setPendingCounts(prev => ({ ...prev, lab: responseTotal }));
               }
            } else if (deptCode === DEPT_CODE.RAD) {
               setRadiologyAppointments(mapped);
               if (activeSubTab === 'upcoming') {
                 setPendingCounts(prev => ({ ...prev, rad: responseTotal }));
               }
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
  }, [activeMenu, activeSubTab, diagnosticTab, historyFilter, refreshTrigger, parsedPatient, parsedHospital, page]);

  return {
    upcomingAppointments,
    pastAppointments,
    labAppointments,
    setLabAppointments,
    radiologyAppointments,
    setRadiologyAppointments,
    isLoading,
    totalPages,
    totalElements,
    pendingCounts
  };
}
