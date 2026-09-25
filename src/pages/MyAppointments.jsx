import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { ENDPOINTS } from '../constants/apiEndpoints';
import PdfViewer from '../components/PdfViewer';
import { VISIT_STATUS, APPOINTMENT_TYPE, MODAL_TYPE } from '../constants';

import { 
  useToast, useStoredSession, useMasterData, useAppointmentModal, 
  usePdfViewer, useCancelAppointment, useRescheduleAppointment, useAppointments,
  usePayment
} from './MyAppointments/hooks';

import LabCard from './MyAppointments/components/LabCard';
import RadiologyCard from './MyAppointments/components/RadiologyCard';
import { DiagnosticsTabs } from './MyAppointments/components/DiagnosticsTabs';
import { FilterBar } from './MyAppointments/components/FilterBar';
import { UpcomingOpdCard } from './MyAppointments/components/UpcomingOpdCard';
import { PastOpdCard } from './MyAppointments/components/PastOpdCard';
import { AppointmentModals } from './MyAppointments/components/AppointmentModals';

export default function MyAppointments() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Navigation State
  const [activeMenu, setActiveMenu] = useState(APPOINTMENT_TYPE.OPD);
  const [activeSubTab, setActiveSubTab] = useState('upcoming');
  const [historyFilter, setHistoryFilter] = useState('all_history');
  const [diagnosticTab, setDiagnosticTab] = useState(APPOINTMENT_TYPE.RADIOLOGY);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Refund Details State
  const [refundDetailsData, setRefundDetailsData] = useState(null);
  const [loadingRefundDetails, setLoadingRefundDetails] = useState(false);

  // Extracted Hooks
  const { toastMessage, showToast, hideToast } = useToast();
  const { patientDetails: parsedPatient, selectedHospital: parsedHospital } = useStoredSession();
  const { cancelReasonsList, paymentGateways, initialCancelReasonId, initialPaymentMethod } = useMasterData();
  const { modalType, selectedAppointment, openModal, closeModal } = useAppointmentModal();
  const { pdfUrl, pdfName, showPdfViewer, loadingPdfId, openPdf, closePdfViewer } = usePdfViewer({ showToast });

  const { cancelReasonId, setCancelReasonId, isCancelling, handleConfirmCancel } = useCancelAppointment({ 
    showToast, 
    onRefresh: () => setRefreshTrigger(prev => prev + 1) 
  });

  const {
    rescheduleDate, setRescheduleDate,
    rescheduleTime, setRescheduleTime,
    showRescheduleConfirm, setShowRescheduleConfirm,
    isRescheduling, initReschedule, handleApproveReschedule,
    opdSessionsList, selectedSessionId, setSelectedSessionId,
    availableTimeSlots, selectedTimeSlot, setSelectedTimeSlot,
    isTimeSlotsLoading
  } = useRescheduleAppointment({ 
    showToast, 
    onRefresh: () => setRefreshTrigger(prev => prev + 1) 
  });

  const {
    upcomingAppointments, pastAppointments,
    labAppointments, setLabAppointments,
    radiologyAppointments, setRadiologyAppointments,
    isLoading
  } = useAppointments({
    activeMenu, activeSubTab, diagnosticTab, historyFilter, refreshTrigger,
    parsedPatient, parsedHospital
  });

  // Payment Method Hook
  const {
    isProcessingPayment,
    paymentMethod,
    setPaymentMethod,
    handleProcessPayment
  } = usePayment({
    patientDetails: parsedPatient,
    showToast,
    closeModal,
    onPaymentSuccess: () => setRefreshTrigger(prev => prev + 1)
  });

  // Diagnostic Test Booking State
  const [newBookingTest, setNewBookingTest] = useState('X-Ray Chest (PA View)');
  const [newBookingHospital, setNewBookingHospital] = useState('ARI Hospital, Delhi');
  const [newBookingDate, setNewBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [newBookingTime, setNewBookingTime] = useState('Tue, 02:00 PM');
  const [isBookingTest, setIsBookingTest] = useState(false);

  useEffect(() => {
    if (initialPaymentMethod && !paymentMethod) {
      setPaymentMethod(initialPaymentMethod);
    }
  }, [initialPaymentMethod, paymentMethod, setPaymentMethod]);

  // URL Parameter Listener
  useEffect(() => {
    const tab = searchParams.get('tab') || searchParams.get('menu');
    const action = searchParams.get('action');

    if (tab === 'radiology') {
      setActiveMenu(APPOINTMENT_TYPE.RADIOLOGY);
      setDiagnosticTab(APPOINTMENT_TYPE.RADIOLOGY);
    } else if (tab === 'lab') {
      setActiveMenu(APPOINTMENT_TYPE.LAB);
      setDiagnosticTab(APPOINTMENT_TYPE.LAB);
    } else if (tab === 'all' || tab === 'diagnostics') {
      setActiveMenu('diagnostics');
      setDiagnosticTab('all');
    }

    if (action === 'book-radiology') {
      handleOpenBookModal(APPOINTMENT_TYPE.RADIOLOGY);
    } else if (action === 'book-lab') {
      handleOpenBookModal(APPOINTMENT_TYPE.LAB);
    }
  }, [searchParams]);

  // Action handlers
  const handleOpenPayModal = (app) => {
    openModal(MODAL_TYPE.PAY, app);
  };

  const handleOpenPrescriptionSlip = (app) => {
    if (!app.prescriptionHdId) {
      showToast("No prescription available", "error");
      return;
    }
    const url = `${ENDPOINTS.APPOINTMENTS.OPD_PRESCRIPTION_SLIP}?prescriptionId=${app.prescriptionHdId}&flag=D`;
    openPdf(url, `Prescription - ${app.date}`, `${app.id}_prescription`);
  };

  const handleOpenOpdSlip = (app) => {
    const url = `${ENDPOINTS.APPOINTMENTS.OPD_CASE_SHEET_REPORT}?visitId=${app.id}&flag=d`;
    openPdf(url, `OPD Slip - ${app.date}`, `${app.id}_opd`);
  };



  const handleOpenReschedule = (app) => {
    openModal('reschedule', app);
    initReschedule(app);
  };

  const handleConfirmReschedule = () => {
    setShowRescheduleConfirm(true);
  };

  const handleApproveRescheduleWrapper = async () => {
    const success = await handleApproveReschedule(selectedAppointment);
    if (success) {
      closeModal();
    }
  };

  const handleOpenCancel = (app) => {
    openModal('cancel', app);
    if (cancelReasonsList.length > 0) {
      setCancelReasonId(cancelReasonsList[0].reasonId);
    }
  };

  const handleConfirmCancelWrapper = async () => {
    const success = await handleConfirmCancel(selectedAppointment);
    if (success) {
      closeModal();
    }
  };

  const handleOpenInvoice = (app) => {
    if (!app.billHdId) {
      showToast("No invoice available", "error");
      return;
    }
    const url = `${ENDPOINTS.APPOINTMENTS.OPD_INVOICE}?billHdId=${app.billHdId}&flag=D`;
    openPdf(url, `Invoice - ${app.date}`, `${app.id}_invoice`);
  };

  const handleOpenReport = (app) => {
    openModal(MODAL_TYPE.REPORT, app);
  };

  const handleOpenDetails = async (app) => {
    setRefundDetailsData(null);
    openModal(MODAL_TYPE.DETAILS, app);

    if (app.status === 'Cancelled' || app.status === 'cancelled') {
      if (app.refundId) {
        setLoadingRefundDetails(true);
        try {
          const response = await apiService.get(`${ENDPOINTS.BILLING.REFUND_DETAILS}/${app.refundId}`);
          if (response.status === 200 && response.response) {
            setRefundDetailsData(response.response);
          }
        } catch (error) {
          console.error("Failed to fetch refund details:", error);
        } finally {
          setLoadingRefundDetails(false);
        }
      }
    }
  };

  const handleOpenBookModal = (type) => {
    const today = new Date().toISOString().split('T')[0];
    if (type === APPOINTMENT_TYPE.LAB) {
      setNewBookingTest('Complete Blood Count (CBC)');
      setNewBookingHospital('ARI Hospital, Delhi');
      setNewBookingDate(today);
      setNewBookingTime('Fri, 08:00 AM');
      openModal(MODAL_TYPE.BOOK_LAB);
    } else {
      setNewBookingTest('X-Ray Chest (PA View)');
      setNewBookingHospital('ARI Hospital, Delhi');
      setNewBookingDate(today);
      setNewBookingTime('Tue, 02:00 PM');
      openModal(MODAL_TYPE.BOOK_RADIOLOGY);
    }
  };

  const handleConfirmBookTest = async (type, selectedTestsList = []) => {
    if (type === 'lab') {
      if (!selectedTestsList || selectedTestsList.length === 0) {
        showToast('Please select at least one test', 'error');
        return;
      }
      
      setIsBookingTest(true);
      try {
        const payload = {
          patient: null,
          patientId: parsedPatient?.id || parsedPatient?.patientId || 1131,
          investigationReq: selectedTestsList.map(test => ({
            id: test.investigationId,
            appointmentDate: newBookingDate,
            checkStatus: true,
            actualAmount: test.price || 1,
            discountedAmount: 0,
            type: "i"
          }))
        };
        
        const response = await apiService.post(ENDPOINTS.APPOINTMENTS.BOOK_LAB_TEST, payload);
        
        if (response) {
          showToast(`Booked ${newBookingTest} successfully!`);
          setRefreshTrigger(prev => prev + 1);
          closeModal();
          setActiveMenu('lab');
          setDiagnosticTab('lab');
        }
      } catch (error) {
        console.error("Booking lab test failed", error);
        showToast('Error booking lab test', 'error');
      } finally {
        setIsBookingTest(false);
      }
    } else {
      if (!selectedTestsList || selectedTestsList.length === 0) {
        showToast('Please select at least one test', 'error');
        return;
      }
      
      setIsBookingTest(true);
      try {
        const payload = {
          patient: parsedPatient || { id: parsedPatient?.id || parsedPatient?.patientId || 1131 },
          patientId: parsedPatient?.id || parsedPatient?.patientId || 1131,
          investigationReq: selectedTestsList.map(test => ({
            id: test.investigationId,
            appointmentDate: newBookingDate,
            checkStatus: true,
            actualAmount: test.price || 1,
            discountedAmount: 0,
            type: "i"
          }))
        };
        
        const response = await apiService.put(ENDPOINTS.APPOINTMENTS.BOOK_RADIOLOGY_TEST, payload);
        
        if (response) {
          showToast(`Booked ${selectedTestsList.length} radiology test(s) successfully!`);
          setRefreshTrigger(prev => prev + 1);
          closeModal();
          setActiveMenu('radiology');
          setDiagnosticTab('radiology');
        }
      } catch (error) {
        console.error("Booking radiology test failed", error);
        showToast('Error booking radiology test', 'error');
      } finally {
        setIsBookingTest(false);
      }
    }
  };



  // ========================================================
  // REUSABLE DIAGNOSTIC COMPONENT: LAB APPOINTMENTS CARD
  // ========================================================
  const renderLabCard = () => (
    <LabCard
      labAppointments={labAppointments}
      isLoading={isLoading}
      loadingPdfId={loadingPdfId}
      handleOpenBookModal={handleOpenBookModal}
      handleOpenInvoice={handleOpenInvoice}
      handleOpenReschedule={handleOpenReschedule}
      handleOpenCancel={handleOpenCancel}
      handleOpenPayModal={handleOpenPayModal}
      handleOpenReport={handleOpenReport}
      handleOpenDetails={handleOpenDetails}
    />
  );

  // ========================================================
  // REUSABLE DIAGNOSTIC COMPONENT: RADIOLOGY APPOINTMENTS CARD
  // ========================================================
  const renderRadiologyCard = () => (
    <RadiologyCard
      radiologyAppointments={radiologyAppointments}
      isLoading={isLoading}
      loadingPdfId={loadingPdfId}
      handleOpenBookModal={handleOpenBookModal}
      handleOpenInvoice={handleOpenInvoice}
      handleOpenReschedule={handleOpenReschedule}
      handleOpenCancel={handleOpenCancel}
      handleOpenPayModal={handleOpenPayModal}
      handleOpenReport={handleOpenReport}
      handleOpenDetails={handleOpenDetails}
    />
  );

  return (
    <div className="appointments-page flex-grow-1">
      {/* Main Container */}
      <div className="appointments-container">
        <div className="appointments-layout-grid">
          {/* Left Menu Sidebar */}
          <div className="appointments-sidebar-card">
            <h2 className="sidebar-heading">
              <i className="fas fa-calendar-check text-primary"></i> My Appointments
            </h2>
            <ul className="sidebar-nav-list">
              <li>
                <button
                  className={`sidebar-nav-btn ${activeMenu === 'opd' ? 'active' : ''}`}
                  onClick={() => setActiveMenu('opd')}
                  type="button"
                >
                  <span className="sidebar-item-left">
                    <span className="sidebar-item-icon">
                      <i className="fas fa-stethoscope"></i>
                    </span>
                    <span>OPD Consultations</span>
                  </span>
                  <span className="sidebar-badge">{upcomingAppointments.length}</span>
                </button>
              </li>
              <li>
                <button
                  className={`sidebar-nav-btn ${activeMenu === 'radiology' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveMenu('radiology');
                    setDiagnosticTab('radiology');
                  }}
                  type="button"
                >
                  <span className="sidebar-item-left">
                    <span className="sidebar-item-icon" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                      <i className="fas fa-x-ray"></i>
                    </span>
                    <span>Radiology Appointments</span>
                  </span>
                  <span className="sidebar-badge" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                    {radiologyAppointments.length}
                  </span>
                </button>
              </li>
              <li>
                <button
                  className={`sidebar-nav-btn ${activeMenu === 'lab' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveMenu('lab');
                    setDiagnosticTab('lab');
                  }}
                  type="button"
                >
                  <span className="sidebar-item-left">
                    <span className="sidebar-item-icon" style={{ background: '#D1FAE5', color: '#059669' }}>
                      <i className="fas fa-flask"></i>
                    </span>
                    <span>Lab Appointments</span>
                  </span>
                  <span className="sidebar-badge" style={{ background: '#D1FAE5', color: '#059669' }}>
                    {labAppointments.length}
                  </span>
                </button>
              </li>
            </ul>
          </div>

          {/* Right Main Content Area */}
          <div className="appointments-main-content">
            {/* Top Category Navigation Pills Bar */}
         

            {/* VIEW 1: OPD CONSULTATIONS */}
            {activeMenu === 'opd' && (
              <>
                {/* Header and Sub-tabs */}
                <FilterBar
                  title="OPD Consultations"
                  activeSubTab={activeSubTab}
                  setActiveSubTab={setActiveSubTab}
                  upcomingCount={upcomingAppointments.length}
                />

                {/* Quick Banner for Diagnostics */}
            

                {/* Section 1: Upcoming Appointments (Token No. REMOVED as requested) */}
                {activeSubTab === 'upcoming' && (
                  <UpcomingOpdCard
                    upcomingAppointments={upcomingAppointments}
                    isLoading={isLoading}
                    loadingPdfId={loadingPdfId}
                    handleOpenPayModal={handleOpenPayModal}
                    handleOpenInvoice={handleOpenInvoice}
                    handleOpenReschedule={handleOpenReschedule}
                    handleOpenCancel={handleOpenCancel}
                    handleOpenPrescriptionSlip={handleOpenPrescriptionSlip}
                    handleOpenOpdSlip={handleOpenOpdSlip}
                    handleOpenDetails={handleOpenDetails}
                  />
                )}

                {/* Section 2: Past Appointments (Token No. preserved) */}
                {activeSubTab !== 'upcoming' && (
                  <PastOpdCard
                    pastAppointments={pastAppointments}
                    activeSubTab={activeSubTab}
                    historyFilter={historyFilter}
                    setHistoryFilter={setHistoryFilter}
                    isLoading={isLoading}
                    loadingPdfId={loadingPdfId}
                    handleOpenOpdSlip={handleOpenOpdSlip}
                    handleOpenPrescriptionSlip={handleOpenPrescriptionSlip}
                    handleOpenInvoice={handleOpenInvoice}
                    handleOpenDetails={handleOpenDetails}
                  />
                )}
              </>
            )}

            {/* VIEW 2: RADIOLOGY APPOINTMENTS (Primary view when clicking Radiology Appointments) */}
            {activeMenu === 'radiology' && (
              <div className="diagnostics-view-container">
                {/* Header and Filter Sub-tabs */}
                <FilterBar
                  title="Radiology Appointments"
                  subtitle="View, manage and take action on your radiology appointments."
                  activeSubTab={activeSubTab}
                  setActiveSubTab={setActiveSubTab}
                  showCompleted={false}
                />

                {/* Primary Card: Radiology Card (Lavender Banner) */}
                {renderRadiologyCard()}

                {/* If user clicked View Both Stacked, show Lab below */}
                {diagnosticTab === 'all' && renderLabCard()}
              </div>
            )}

            {/* VIEW 3: LAB APPOINTMENTS */}
            {activeMenu === 'lab' && (
              <div className="diagnostics-view-container">
                {/* Header and Filter Sub-tabs */}
                <FilterBar
                  title="Lab Appointments"
                  subtitle="View, manage and take action on your lab test appointments."
                  activeSubTab={activeSubTab}
                  setActiveSubTab={setActiveSubTab}
                  showCompleted={false}
                />

                {/* Primary Card: Lab Card (Mint Green Banner) */}
                {renderLabCard()}

                {/* If user clicked View Both Stacked, show Radiology below */}
                {diagnosticTab === 'all' && renderRadiologyCard()}
              </div>
            )}

            {/* VIEW 4: BOTH LAB & RADIOLOGY STACKED (Matching Mockup Screenshot 100%) */}
            {activeMenu === 'diagnostics' && (
              <div className="diagnostics-view-container">
                <DiagnosticsTabs 
                  labCount={labAppointments.length}
                  radiologyCount={radiologyAppointments.length}
                  setActiveMenu={setActiveMenu}
                  setDiagnosticTab={setDiagnosticTab}
                  handleOpenBookModal={handleOpenBookModal}
                />

                {/* Lab Card on top */}
                {renderLabCard()}

                {/* Radiology Card below (Exact mockup layout) */}
                {renderRadiologyCard()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          MODALS
         ======================================================== */}

      <AppointmentModals
          modalType={modalType}
          selectedAppointment={selectedAppointment}
          closeModal={closeModal}
          paymentGateways={paymentGateways}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          handleProcessPayment={handleProcessPayment}
          isProcessingPayment={isProcessingPayment}
          showRescheduleConfirm={showRescheduleConfirm}
          setShowRescheduleConfirm={setShowRescheduleConfirm}
          rescheduleDate={rescheduleDate}
          setRescheduleDate={setRescheduleDate}
          rescheduleTime={rescheduleTime}
          setRescheduleTime={setRescheduleTime}
          isRescheduling={isRescheduling}
          handleApproveRescheduleWrapper={handleApproveRescheduleWrapper}
          handleConfirmReschedule={handleConfirmReschedule}
          opdSessionsList={opdSessionsList}
          selectedSessionId={selectedSessionId}
          setSelectedSessionId={setSelectedSessionId}
          availableTimeSlots={availableTimeSlots}
          selectedTimeSlot={selectedTimeSlot}
          setSelectedTimeSlot={setSelectedTimeSlot}
          isTimeSlotsLoading={isTimeSlotsLoading}
          cancelReasonId={cancelReasonId}
          setCancelReasonId={setCancelReasonId}
          cancelReasonsList={cancelReasonsList}
          handleConfirmCancelWrapper={handleConfirmCancelWrapper}
          isCancelling={isCancelling}
          showToast={showToast}
          refundDetailsData={refundDetailsData}
          loadingRefundDetails={loadingRefundDetails}
          newBookingTest={newBookingTest}
          setNewBookingTest={setNewBookingTest}
          newBookingHospital={newBookingHospital}
          setNewBookingHospital={setNewBookingHospital}
          newBookingDate={newBookingDate}
          setNewBookingDate={setNewBookingDate}
          newBookingTime={newBookingTime}
          setNewBookingTime={setNewBookingTime}
          handleConfirmBookTest={handleConfirmBookTest}
          isBookingTest={isBookingTest}
        />

      {showPdfViewer && (
        <PdfViewer
          pdfUrl={pdfUrl}
          name={pdfName}
          onClose={closePdfViewer}
        />
      )}

      {/* Floating Action Toast */}
      {toastMessage && (
        <div className={`ari-toast ${toastMessage.type}`}>
          <div className="d-flex align-items-center gap-2">
            <i className={`fas fa-${toastMessage.type === 'success' ? 'check-circle' : toastMessage.type === 'error' ? 'exclamation-circle' : 'info-circle'} fs-4`}></i>
            <span className="fw-medium">{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
