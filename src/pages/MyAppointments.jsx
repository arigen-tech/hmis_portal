import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PdfViewer from '../components/PdfViewer';
import { apiService } from '../services/apiService';
import { ENDPOINTS } from '../constants/apiEndpoints';
import { loadRazorpayScript } from '../utils/loadRazorpay';

export default function MyAppointments() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Navigation State
  const [activeMenu, setActiveMenu] = useState('opd'); // 'opd', 'radiology', 'lab', 'diagnostics'
  const [activeSubTab, setActiveSubTab] = useState('upcoming'); // 'upcoming', 'completed', 'cancelled'
  const [historyFilter, setHistoryFilter] = useState('all_history'); // 'all_history', 'present'
  const [diagnosticTab, setDiagnosticTab] = useState('radiology'); // 'radiology', 'lab', 'all'

  // Modal States
  const [modalType, setModalType] = useState(null); // 'pay', 'reschedule', 'cancel', 'invoice', 'details', 'report', 'book-radiology', 'book-lab'
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [refundDetailsData, setRefundDetailsData] = useState(null);
  const [loadingRefundDetails, setLoadingRefundDetails] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfName, setPdfName] = useState('');
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [loadingPdfId, setLoadingPdfId] = useState(null);

  // Reschedule Form State
  const [rescheduleDate, setRescheduleDate] = useState('2026-10-20');
  const [rescheduleTime, setRescheduleTime] = useState('11:00 AM');
  const [showRescheduleConfirm, setShowRescheduleConfirm] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Cancel Form State
  const [cancelReasonsList, setCancelReasonsList] = useState([]);
  const [cancelReasonId, setCancelReasonId] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentGateways, setPaymentGateways] = useState([]);

  // Diagnostic Test Booking State
  const [newBookingTest, setNewBookingTest] = useState('X-Ray Chest (PA View)');
  const [newBookingHospital, setNewBookingHospital] = useState('ARI Hospital, Delhi');
  const [newBookingDate, setNewBookingDate] = useState('2026-10-18');
  const [newBookingTime, setNewBookingTime] = useState('Tue, 02:00 PM');

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const cancelRes = await apiService.get(ENDPOINTS.MASTER.CANCEL_REASON_MASTER);
        if (cancelRes?.status === 200 && cancelRes?.response) {
          setCancelReasonsList(cancelRes.response);
          if (cancelRes.response.length > 0) {
            setCancelReasonId(cancelRes.response[0].reasonId);
          }
        }
      } catch (err) {
        console.error("Failed to fetch cancel reasons", err);
      }

      try {
        const gatewayRes = await apiService.get(ENDPOINTS.MASTER.PAYMENT_GATEWAY);
        if (gatewayRes?.status === 200 && gatewayRes?.response) {
          setPaymentGateways(gatewayRes.response);
          if (gatewayRes.response.length > 0) {
            setPaymentMethod(gatewayRes.response[0].gatewayCode);
          }
        }
      } catch (err) {
        console.error("Failed to fetch payment gateways", err);
      }
    };
    fetchMasterData();
  }, []);

  // URL Parameter Listener (e.g. ?tab=radiology or ?tab=lab or ?action=book-radiology)
  useEffect(() => {
    const tab = searchParams.get('tab') || searchParams.get('menu');
    const action = searchParams.get('action');

    if (tab === 'radiology') {
      setActiveMenu('radiology');
      setDiagnosticTab('radiology');
    } else if (tab === 'lab') {
      setActiveMenu('lab');
      setDiagnosticTab('lab');
    } else if (tab === 'all' || tab === 'diagnostics') {
      setActiveMenu('diagnostics');
      setDiagnosticTab('all');
    }

    if (action === 'book-radiology') {
      handleOpenBookModal('radiology');
    } else if (action === 'book-lab') {
      navigate('/book-lab-test');
    }
  }, [searchParams]);

  // Appointments Data
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [labAppointments, setLabAppointments] = useState([]);
  const [radiologyAppointments, setRadiologyAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem('patientDetails');
    const hospitalData = localStorage.getItem('selectedHospital');
    let parsedPatient = null;
    let parsedHospital = null;
    if (data) {
      try { parsedPatient = JSON.parse(data); } catch (e) {}
    }
    if (hospitalData) {
      try { parsedHospital = JSON.parse(hospitalData); } catch (e) {}
    }

    const fetchAppointments = async () => {
      if (!parsedPatient || !parsedHospital) return;
      
      let deptCode = 'OPD';
      if (activeMenu === 'radiology') deptCode = 'RAD';
      if (activeMenu === 'lab') deptCode = 'LAB';
      if (activeMenu === 'diagnostics') {
         if (diagnosticTab === 'radiology') deptCode = 'RAD';
         else if (diagnosticTab === 'lab') deptCode = 'LAB';
         else deptCode = 'LAB,RAD';
      }
      
      setIsLoading(true);
      try {
        if (activeMenu === 'opd' && activeSubTab === 'completed') {
          const queryParams = new URLSearchParams({
            patientId: parsedPatient.patientId,
            page: 0,
            size: 10
          });
          
          const response = await apiService.get(`${ENDPOINTS.APPOINTMENTS.OPD_REPORTS_LIST}?${queryParams.toString()}`);
          
          if (response.status === 200 && response.response && response.response.content) {
            const mapped = response.response.content.map(app => {
              let when = app.visitDateTime || 'N/A';
              let time = 'N/A';
              if (when && when.includes(' ')) {
                const parts = when.split(' ');
                when = parts[0];
                time = parts[1];
              }
              
              return {
                id: app.visitId,
                date: when,
                dayTime: time,
                doctor: app.doctorName || 'Not Assigned',
                specialty: app.specialty,
                testName: '',
                department: app.specialty,
                hospital: parsedHospital.hospitalName,
                location: parsedHospital.hospitalName,
                room: 'Room Not Assigned',
                tokenNo: '-',
                paymentStatus: 'Paid',
                amount: 0,
                status: 'completed',
                type: 'opd',
                prescriptionHdId: app.prescriptionHdId,
                prescriptionStatus: app.prescriptionStatus,
                billHdId: app.billingHeaderId,
                paymentGatewayModeName: app.paymentGatewayModeName
              };
            });
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
          
          if (response.status === 200 && response.response && response.response.content) {
            const mapped = response.response.content.map(app => {
              let when = app.appointmentDate || 'N/A';
              let time = app.appointmentTime && app.appointmentTime !== ' to ' ? app.appointmentTime : 'N/A';
              
              const isDiagnostic = app.departmentName?.toLowerCase().includes('lab') || app.departmentName?.toLowerCase().includes('rad') || app.departmentName === 'Laboratory' || app.departmentName === 'Radiology';
              
              return {
                id: app.visitId,
                date: when,
                dayTime: time,
                doctor: app.doctorName || 'Not Assigned',
                specialty: app.departmentName,
                testName: app.doctorName ? '' : (app.departmentName || 'Diagnostic Test'),
                department: app.departmentName,
                hospital: parsedHospital.hospitalName,
                location: parsedHospital.hospitalName,
                room: 'Room Not Assigned',
                tokenNo: '-',
                paymentStatus: app.refundDate ? 'Refund Complete' : (app.refundStatus ? app.refundStatus : 'Refund Pending'),
                amount: app.billingAmount || 0,
                status: isDiagnostic ? 'Cancelled' : 'cancelled',
                type: app.departmentName?.toLowerCase().includes('lab') || app.departmentName === 'Laboratory' ? 'lab' : (app.departmentName?.toLowerCase().includes('rad') || app.departmentName === 'Radiology' ? 'radiology' : 'opd'),
                cancellationDateTime: app.cancellationDateTime,
                cancelledBy: app.cancelledBy,
                cancellationReason: app.cancellationReason,
                refundId: app.refundId,
                refundDate: app.refundDate,
                billHdId: app.billingHeaderId,
                paymentGatewayModeName: app.paymentGatewayModeName
              };
            });
            
            if (deptCode === 'OPD') {
               setPastAppointments(mapped);
            } else if (deptCode === 'LAB') {
               setLabAppointments(mapped);
            } else if (deptCode === 'RAD') {
               setRadiologyAppointments(mapped);
            } else {
               setLabAppointments(mapped.filter(a => a.type === 'lab'));
               setRadiologyAppointments(mapped.filter(a => a.type === 'radiology'));
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
            queryParams.append('visitStatus', 'n');
          } else if (activeSubTab === 'completed' && activeMenu !== 'opd') {
            queryParams.append('visitStatus', 'y');
          }
          
          const response = await apiService.get(`${ENDPOINTS.APPOINTMENTS.HISTORY_LIST}?${queryParams.toString()}`);
          
          if (response.status === 200 && response.response) {
            const mapped = response.response.map(app => {
              let when = app.appointmentDate || 'N/A';
              let time = app.appointmentStartTime || (app.appointmentDate && app.appointmentDate.includes(' ') ? app.appointmentDate.split(' ')[1] : 'N/A');
              if (when && when.includes(' ')) {
                when = when.split(' ')[0];
              }
              
              let opdStatus = 'pending';
              let diagStatus = 'Scheduled';
              
              if (app.visitStatus === 'y') {
                opdStatus = 'completed';
                diagStatus = 'Completed';
              } else if (app.visitStatus === 'c') {
                opdStatus = 'cancelled';
                diagStatus = 'Cancelled';
              } else if (app.visitStatus === 'n') {
                opdStatus = app.visitPaymentStatus === 'y' ? 'confirmed' : 'pending';
                diagStatus = 'Scheduled';
              }
              
              const isDiagnostic = deptCode.includes('LAB') || deptCode.includes('RAD');
              
              return {
                id: app.visitId,
                date: when,
                dayTime: time,
                doctor: app.doctorName || 'Not Assigned',
                specialty: app.departmentName,
                testName: app.doctorName ? '' : (app.departmentName || 'Diagnostic Test'),
                department: app.departmentName,
                hospital: parsedHospital.hospitalName,
                location: parsedHospital.hospitalName,
                room: 'Room Not Assigned',
                tokenNo: '-',
                paymentStatus: app.visitPaymentStatus === 'y' ? 'Paid' : 'Pending',
                amount: app.billedAmount || 0,
                status: isDiagnostic ? diagStatus : opdStatus,
                type: app.departmentName?.toLowerCase().includes('lab') ? 'lab' : (app.departmentName?.toLowerCase().includes('rad') ? 'radiology' : 'opd'),
                billHdId: app.billingHeaderId,
                paymentGatewayModeName: app.paymentGatewayModeName
              };
            });
            
            if (deptCode === 'OPD') {
               if (activeSubTab === 'upcoming') {
                 setUpcomingAppointments(mapped);
               } else {
                 setPastAppointments(mapped);
               }
            } else if (deptCode === 'LAB') {
               setLabAppointments(mapped);
            } else if (deptCode === 'RAD') {
               setRadiologyAppointments(mapped);
            } else {
               setLabAppointments(mapped.filter(a => a.type === 'lab'));
               setRadiologyAppointments(mapped.filter(a => a.type === 'radiology'));
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAppointments();
  }, [activeMenu, diagnosticTab, activeSubTab, historyFilter, refreshTrigger]);

  const showToast = (message, type = 'success') => {
    setToastMessage({ text: message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Action handlers
  const handleOpenPayModal = (app) => {
    setSelectedAppointment(app);
    setModalType('pay');
  };

  const handleOpenPrescriptionSlip = async (app) => {
    if (!app.prescriptionHdId) {
      showToast("No prescription available", "error");
      return;
    }
    
    try {
      setLoadingPdfId(`${app.id}_prescription`);
      const url = `${ENDPOINTS.APPOINTMENTS.OPD_PRESCRIPTION_SLIP}?prescriptionId=${app.prescriptionHdId}&flag=D`;
      const blob = await apiService.getPdf(url);
      const objUrl = URL.createObjectURL(blob);
      setPdfUrl(objUrl);
      setPdfName(`Prescription - ${app.date}`);
      setShowPdfViewer(true);
    } catch (error) {
      console.error(error);
      showToast("Failed to load prescription", "error");
    } finally {
      setLoadingPdfId(null);
    }
  };

  const handleOpenOpdSlip = async (app) => {
    try {
      setLoadingPdfId(`${app.id}_opd`);
      const url = `${ENDPOINTS.APPOINTMENTS.OPD_CASE_SHEET_REPORT}?visitId=${app.id}&flag=d`;
      const blob = await apiService.getPdf(url);
      const objUrl = URL.createObjectURL(blob);
      setPdfUrl(objUrl);
      setPdfName(`OPD Slip - ${app.date}`);
      setShowPdfViewer(true);
    } catch (error) {
      console.error(error);
      showToast("Failed to load OPD Slip", "error");
    } finally {
      setLoadingPdfId(null);
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedAppointment) return;
    const displayName = selectedAppointment.testName || selectedAppointment.doctor;

    if (selectedAppointment.type === 'lab') {
      setIsProcessingPayment(true);
      try {
        const data = localStorage.getItem('patientDetails');
        let patientId = null;
        if (data) {
          try {
            patientId = JSON.parse(data).patientId;
          } catch(e) {}
        }

        if (!patientId || !selectedAppointment.billHdId) {
          showToast("Missing patient or billing details.", "error");
          setIsProcessingPayment(false);
          return;
        }

        const createOrderPayload = {
          billingItems: [{ billingHdId: selectedAppointment.billHdId, amount: selectedAppointment.amount }],
          billingType: "LAB_SC",
          patientId: patientId
        };
        const orderRes = await apiService.post(ENDPOINTS.PAYMENTS.CREATE_ORDER, createOrderPayload);
        if (!orderRes || !orderRes.orderId) {
          showToast("Failed to create Razorpay order.", "error");
          setIsProcessingPayment(false);
          return;
        }

        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          showToast("Razorpay SDK failed to load. Are you online?", "error");
          setIsProcessingPayment(false);
          return;
        }

        let prefill = {};
        try {
          const prefillRes = await apiService.get(`${ENDPOINTS.PAYMENTS.RAZORPAY_PREFILL}/${patientId}`);
          if (prefillRes && prefillRes.response) {
            prefill = {
              name: prefillRes.response.patientFullName || "",
              email: prefillRes.response.email || "",
              contact: prefillRes.response.phoneNumber || ""
            };
          }
        } catch(e) {
          console.error("Failed to fetch prefill", e);
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_YourTestKeyHere",
          amount: orderRes.amount,
          currency: orderRes.currency,
          name: "ARI Hospital",
          description: `Payment for ${displayName}`,
          order_id: orderRes.orderId,
          prefill: prefill,
          handler: async function (response) {
            try {
              const verifyPayload = {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              };
              const verifyRes = await apiService.post(ENDPOINTS.PAYMENTS.VERIFY, verifyPayload);

              if (verifyRes && verifyRes.status === "success") {
                const paymentId = orderRes.paymentIds[0];
                let isPaid = false;
                for (let i = 0; i < 10; i++) {
                  try {
                    const statusRes = await apiService.get(`${ENDPOINTS.PAYMENTS.STATUS}/${paymentId}`);
                    if (statusRes && statusRes.paymentStatus === "PAID") {
                      isPaid = true;
                      break;
                    }
                  } catch (e) {
                    console.error("Status polling error", e);
                  }
                  await new Promise(r => setTimeout(r, 3000));
                }

                if (!isPaid) {
                  showToast("Payment verification timed out. Please check later.", "error");
                  setIsProcessingPayment(false);
                  return;
                }

                const finalPayload = {
                  billingType: "LAB_SC",
                  billHeaderId: selectedAppointment.billHdId,
                  amount: selectedAppointment.amount,
                  mode: "online",
                  investigationandPackegBillStatus: [],
                  isPaymentUpdate: true,
                  shouldNotCreateNewBilling: true,
                  useExistingBillingHeader: true,
                  patientId: patientId,
                  paymentReferenceNo: response.razorpay_payment_id,
                  timestamp: new Date().toISOString(),
                  operationType: "payment_update_only"
                };

                await apiService.post(ENDPOINTS.BILLING.PROCESS_LAB_PAYMENT, finalPayload);

                setLabAppointments(prev =>
                  prev.map(item =>
                    item.id === selectedAppointment.id
                      ? { ...item, paymentStatus: 'Paid' }
                      : item
                  )
                );
                setModalType(null);
                showToast(`Payment of ₹${selectedAppointment.amount.toLocaleString()} successful!`);
              } else {
                showToast("Payment verification failed.", "error");
              }
            } catch (err) {
              console.error(err);
              showToast("Error during payment verification.", "error");
            } finally {
              setIsProcessingPayment(false);
            }
          },
          theme: {
            color: "#3399cc"
          }
        };

        const rzp1 = new window.Razorpay(options);
        rzp1.on('payment.failed', function (response){
          console.error("Payment failed", response.error);
          showToast(response.error.description || "Payment failed", "error");
          setIsProcessingPayment(false);
        });
        rzp1.open();
      } catch (err) {
        console.error(err);
        showToast("An error occurred while initiating payment.", "error");
        setIsProcessingPayment(false);
      }
    } else if (selectedAppointment.type === 'radiology') {
      setRadiologyAppointments(prev =>
        prev.map(item =>
          item.id === selectedAppointment.id
            ? { ...item, paymentStatus: 'Paid' }
            : item
        )
      );
      setModalType(null);
      showToast(`Payment of ₹${selectedAppointment.amount.toLocaleString()} successful for ${displayName}!`);
    } else {
      setUpcomingAppointments(prev =>
        prev.map(item =>
          item.id === selectedAppointment.id
            ? { ...item, paymentStatus: 'Paid', status: 'confirmed' }
            : item
        )
      );
      setModalType(null);
      showToast(`Payment of ₹${selectedAppointment.amount.toLocaleString()} successful for ${displayName}!`);
    }
  };

  const handleOpenReschedule = (app) => {
    setSelectedAppointment(app);
    setRescheduleDate('2026-10-25');
    setRescheduleTime('11:00 AM');
    setShowRescheduleConfirm(false);
    setModalType('reschedule');
  };

  const handleConfirmReschedule = () => {
    setShowRescheduleConfirm(true);
  };

  const handleApproveReschedule = async () => {
    if (!selectedAppointment) return;
    const displayName = selectedAppointment.testName || selectedAppointment.doctor;
    
    setIsRescheduling(true);
    try {
      let moduleType = 'OPD';
      if (selectedAppointment.type === 'lab') moduleType = 'LAB';
      if (selectedAppointment.type === 'radiology') moduleType = 'RAD';

      let apiStartTime = null;
      let apiEndTime = null;

      if (moduleType === 'OPD') {
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
        setRefreshTrigger(prev => prev + 1);

        setModalType(null);
        showToast(`Appointment rescheduled for ${displayName} to ${rescheduleDate}!`);
      } else {
        showToast(response?.message || "Failed to reschedule appointment", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("An error occurred while rescheduling.", "error");
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleOpenCancel = (app) => {
    setSelectedAppointment(app);
    if (cancelReasonsList.length > 0) {
      setCancelReasonId(cancelReasonsList[0].reasonId);
    }
    setModalType('cancel');
  };

  const handleConfirmCancel = async () => {
    if (!selectedAppointment) return;
    const displayName = selectedAppointment.testName || selectedAppointment.doctor;

    setIsCancelling(true);
    try {
      let paymentMode = "CASH";
      const refundAmt = selectedAppointment.paymentStatus === 'Paid' ? (selectedAppointment.amount || 0) : 0;

      if (selectedAppointment.paymentGatewayModeName === "Online") {
        paymentMode = "RAZORPAY";
        const refundPayload = {
          billingHeaderId: selectedAppointment.billHdId,
          refundAmount: refundAmt,
          refundReasonId: cancelReasonId
        };
        try {
          await apiService.post(ENDPOINTS.BILLING.REFUND, refundPayload);
        } catch (error) {
          console.error("Refund failed:", error);
          showToast(error?.message || "Failed to initiate refund", "error");
          setIsCancelling(false);
          return;
        }
      }

      const payload = {
        visitId: selectedAppointment.id,
        cancelReasonId: cancelReasonId,
        paymentMode: paymentMode,
        refundAmount: refundAmt
      };

      const response = await apiService.post(ENDPOINTS.APPOINTMENTS.CANCEL_APPOINTMENT, payload);
      
      if (response && response.status === 200) {
        setRefreshTrigger(prev => prev + 1);
        setModalType(null);
        showToast(`Appointment for ${displayName} has been cancelled.`, 'info');
      } else {
        showToast(response?.message || "Failed to cancel appointment", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("An error occurred while cancelling.", "error");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleOpenInvoice = async (app) => {
    if (!app.billHdId) {
      showToast("No invoice available", "error");
      return;
    }
    
    try {
      setLoadingPdfId(`${app.id}_invoice`);
      const url = `${ENDPOINTS.APPOINTMENTS.OPD_INVOICE}?billHdId=${app.billHdId}&flag=D`;
      const blob = await apiService.getPdf(url);
      const objUrl = URL.createObjectURL(blob);
      setPdfUrl(objUrl);
      setPdfName(`Invoice - ${app.date}`);
      setShowPdfViewer(true);
    } catch (error) {
      console.error(error);
      showToast("Failed to load invoice", "error");
    } finally {
      setLoadingPdfId(null);
    }
  };

  const handleOpenReport = (app) => {
    setSelectedAppointment(app);
    setModalType('report');
  };

  const handleOpenDetails = async (app) => {
    setSelectedAppointment(app);
    setRefundDetailsData(null);
    setModalType('details');

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
    if (type === 'lab') {
      navigate('/book-lab-test');
      return;
    }
    setNewBookingTest('X-Ray Chest (PA View)');
    setNewBookingHospital('ARI Hospital, Delhi');
    setNewBookingDate('2026-10-18');
    setNewBookingTime('Tue, 02:00 PM');
    setModalType('book-radiology');
  };

  const handleConfirmBookTest = (type) => {
    if (type === 'lab') {
      const priceMap = {
        'Complete Blood Count (CBC)': { price: 350, dept: 'Pathology Lab' },
        'Thyroid Profile (T3, T4, TSH)': { price: 500, dept: 'Endocrinology Lab' },
        'Health Checkup Package': { price: 1499, dept: 'Comprehensive Health' },
        'Lipid Profile': { price: 750, dept: 'Biochemistry Lab' },
        'HbA1c Diabetes Screen': { price: 450, dept: 'Pathology Lab' },
        'Liver Function Test (LFT)': { price: 650, dept: 'Biochemistry Lab' }
      };
      const info = priceMap[newBookingTest] || { price: 500, dept: 'Pathology Lab' };
      const newApp = {
        id: `lab-${Date.now()}`,
        date: newBookingDate,
        dayTime: newBookingTime,
        testName: newBookingTest,
        department: info.dept,
        hospital: newBookingHospital,
        location: 'Lab - 1st Floor',
        paymentStatus: 'Pending',
        amount: info.price,
        status: 'Scheduled',
        type: 'lab'
      };
      setLabAppointments(prev => [newApp, ...prev]);
      setModalType(null);
      setActiveMenu('lab');
      setDiagnosticTab('lab');
      showToast(`Booked ${newBookingTest} at ${newBookingHospital}!`);
    } else {
      const priceMap = {
        'X-Ray Chest (PA View)': { price: 600, dept: 'Radiology Dept' },
        'Ultrasound Abdomen': { price: 1200, dept: 'USG Department' },
        'MRI Brain': { price: 4500, dept: 'Advanced Imaging' },
        'CT Scan Thorax': { price: 2800, dept: 'Computed Tomography' },
        'Spine MRI (Lumbar)': { price: 4200, dept: 'Advanced Imaging' },
        'Digital Mammography': { price: 1800, dept: "Women's Imaging" }
      };
      const info = priceMap[newBookingTest] || { price: 1000, dept: 'Radiology Dept' };
      const newApp = {
        id: `rad-${Date.now()}`,
        date: newBookingDate,
        dayTime: newBookingTime,
        testName: newBookingTest,
        department: info.dept,
        hospital: newBookingHospital,
        location: 'Radiology - Ground Floor',
        paymentStatus: 'Pending',
        amount: info.price,
        status: 'Scheduled',
        type: 'radiology'
      };
      setRadiologyAppointments(prev => [newApp, ...prev]);
      setModalType(null);
      setActiveMenu('radiology');
      setDiagnosticTab('radiology');
      showToast(`Booked ${newBookingTest} at ${newBookingHospital}!`);
    }
  };



  // ========================================================
  // REUSABLE DIAGNOSTIC COMPONENT: LAB APPOINTMENTS CARD
  // ========================================================
  const renderLabCard = () => (
    <div className="appointments-section-card mb-4" id="lab-appointments-section">
      {/* Mint Green Banner */}
      <div className="section-banner-lab">
        <div className="section-header-info d-flex align-items-center gap-3">
          <div className="banner-icon-lab">
            <i className="fas fa-flask"></i>
          </div>
          <div>
            <h3 className="section-title">Lab Appointments</h3>
            <p className="section-subtitle">View, manage and take action on your lab test appointments.</p>
          </div>
        </div>
        <div>
          <button
            type="button"
            className="btn-book-lab"
            onClick={() => navigate('/book-lab-test')}
          >
            <i className="fas fa-flask"></i> Book Lab Test
          </button>
        </div>
      </div>

      {/* Lab Appointments Table */}
      <div className="ari-table-responsive">
        <table className="ari-appointments-table">
          <thead>
            <tr>
              <th>Date &amp; Time</th>
              <th>Test / Package</th>
              <th>Hospital / Location</th>
              <th>Payment Status</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : labAppointments.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-5 text-muted">
                  No lab test appointments found.
                </td>
              </tr>
            ) : (
              labAppointments.map((app) => (
                <tr key={app.id}>
                  {/* Date & Time */}
                  <td>
                    <div className="table-date-cell">
                      <span className="table-date-main">{app.date}</span>
                      <span className="table-date-sub">{app.dayTime}</span>
                    </div>
                  </td>

                  {/* Test / Package */}
                  <td>
                    <div className="fw-bold text-dark">{app.testName}</div>
                    <small className="text-muted">{app.department}</small>
                  </td>

                  {/* Hospital / Location */}
                  <td>
                    <div className="table-location-cell">
                      <span className="table-hospital-name">{app.hospital}</span>
                      <span className="table-room-no">{app.location}</span>
                    </div>
                  </td>

                  {/* Payment Status */}
                  <td>
                    <div className="table-payment-cell">
                      {app.paymentStatus === 'Paid' ? (
                        <span className="payment-badge payment-badge-paid">Paid</span>
                      ) : app.paymentStatus === 'Pending' ? (
                        <span className="payment-badge payment-badge-pending">Pending</span>
                      ) : (
                        <span className={`payment-badge ${app.paymentStatus === 'Refund Complete' || app.paymentStatus === 'Refunded' ? 'bg-info text-white border-0' : 'bg-warning text-dark border-0'}`}>{app.paymentStatus}</span>
                      )}
                      <span className="payment-amount">₹{app.amount.toLocaleString()}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    {app.status === 'Completed' ? (
                      <span className="status-pill status-pill-completed">Completed</span>
                    ) : app.status === 'Cancelled' ? (
                      <span className="status-pill status-pill-cancelled">Cancelled</span>
                    ) : (
                      <span className="status-pill status-pill-scheduled">Scheduled</span>
                    )}
                  </td>

                  {/* Actions (Clean text matching user mockup) */}
                  <td>
                    <div className="action-buttons-group">
                      {app.status === 'Scheduled' && app.paymentStatus === 'Paid' && (
                        <>
                          <button
                            type="button"
                            className="btn-action-outline"
                            onClick={() => handleOpenInvoice(app)}
                            disabled={loadingPdfId === `${app.id}_invoice`}
                          >
                            {loadingPdfId === `${app.id}_invoice` ? (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                              'View Invoice'
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn-action-outline"
                            onClick={() => handleOpenReschedule(app)}
                          >
                            Reschedule
                          </button>
                          <button
                            type="button"
                            className="btn-action-cancel"
                            onClick={() => handleOpenCancel(app)}
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {app.status === 'Scheduled' && app.paymentStatus === 'Pending' && (
                        <>
                          <button
                            type="button"
                            className="btn-action-pay"
                            onClick={() => handleOpenPayModal(app)}
                          >
                            Pay Now
                          </button>
                          <button
                            type="button"
                            className="btn-action-outline"
                            onClick={() => handleOpenReschedule(app)}
                          >
                            Reschedule
                          </button>
                          <button
                            type="button"
                            className="btn-action-cancel"
                            onClick={() => handleOpenCancel(app)}
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {app.status === 'Completed' && (
                        <>
                          <button
                            type="button"
                            className="btn-action-outline"
                            onClick={() => handleOpenReport(app)}
                          >
                            View Report
                          </button>
                          <button
                            type="button"
                            className="btn-action-outline"
                            onClick={() => handleOpenInvoice(app)}
                            disabled={loadingPdfId === `${app.id}_invoice`}
                          >
                            {loadingPdfId === `${app.id}_invoice` ? (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                              'View Invoice'
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn-action-disabled"
                            disabled
                            title="Completed tests cannot be cancelled"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {app.status === 'Cancelled' && (
                        <button
                          type="button"
                          className="btn-action-outline"
                          onClick={() => handleOpenDetails(app)}
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ========================================================
  // REUSABLE DIAGNOSTIC COMPONENT: RADIOLOGY APPOINTMENTS CARD
  // ========================================================
  const renderRadiologyCard = () => (
    <div className="appointments-section-card mb-4" id="radiology-appointments-section">
      {/* Lavender Banner */}
      <div className="section-banner-radiology">
        <div className="section-header-info d-flex align-items-center gap-3">
          <div className="banner-icon-radiology">
            <i className="fas fa-x-ray"></i>
          </div>
          <div>
            <h3 className="section-title">Radiology Appointments</h3>
            <p className="section-subtitle">View, manage and take action on your radiology appointments.</p>
          </div>
        </div>
        <div>
          <button
            type="button"
            className="btn-book-radiology"
            onClick={() => handleOpenBookModal('radiology')}
          >
            <i className="fas fa-x-ray"></i> Book Radiology Test
          </button>
        </div>
      </div>

      {/* Radiology Appointments Table */}
      <div className="ari-table-responsive">
        <table className="ari-appointments-table">
          <thead>
            <tr>
              <th>Date &amp; Time</th>
              <th>Test / Procedure</th>
              <th>Hospital / Location</th>
              <th>Payment Status</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : radiologyAppointments.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-5 text-muted">
                  No radiology appointments found.
                </td>
              </tr>
            ) : (
              radiologyAppointments.map((app) => (
                <tr key={app.id}>
                  {/* Date & Time */}
                  <td>
                    <div className="table-date-cell">
                      <span className="table-date-main">{app.date}</span>
                      <span className="table-date-sub">{app.dayTime}</span>
                    </div>
                  </td>

                  {/* Test / Procedure */}
                  <td>
                    <div className="fw-bold text-dark">{app.testName}</div>
                    <small className="text-muted">{app.department}</small>
                  </td>

                  {/* Hospital / Location */}
                  <td>
                    <div className="table-location-cell">
                      <span className="table-hospital-name">{app.hospital}</span>
                      <span className="table-room-no">{app.location}</span>
                    </div>
                  </td>

                  {/* Payment Status */}
                  <td>
                    <div className="table-payment-cell">
                      {app.paymentStatus === 'Paid' ? (
                        <span className="payment-badge payment-badge-paid">Paid</span>
                      ) : app.paymentStatus === 'Pending' ? (
                        <span className="payment-badge payment-badge-pending">Pending</span>
                      ) : (
                        <span className={`payment-badge ${app.paymentStatus === 'Refund Complete' || app.paymentStatus === 'Refunded' ? 'bg-info text-white border-0' : 'bg-warning text-dark border-0'}`}>{app.paymentStatus}</span>
                      )}
                      <span className="payment-amount">₹{app.amount.toLocaleString()}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    {app.status === 'Completed' ? (
                      <span className="status-pill status-pill-completed">Completed</span>
                    ) : app.status === 'Cancelled' ? (
                      <span className="status-pill status-pill-cancelled">Cancelled</span>
                    ) : (
                      <span className="status-pill status-pill-scheduled">Scheduled</span>
                    )}
                  </td>

                  {/* Actions (Clean text matching user mockup) */}
                  <td>
                    <div className="action-buttons-group">
                      {app.status === 'Scheduled' && app.paymentStatus === 'Paid' && (
                        <>
                          <button
                            type="button"
                            className="btn-action-outline"
                            onClick={() => handleOpenInvoice(app)}
                            disabled={loadingPdfId === `${app.id}_invoice`}
                          >
                            {loadingPdfId === `${app.id}_invoice` ? (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                              'View Invoice'
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn-action-outline"
                            onClick={() => handleOpenReschedule(app)}
                          >
                            Reschedule
                          </button>
                          <button
                            type="button"
                            className="btn-action-cancel"
                            onClick={() => handleOpenCancel(app)}
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {app.status === 'Scheduled' && app.paymentStatus === 'Pending' && (
                        <>
                          <button
                            type="button"
                            className="btn-action-pay"
                            onClick={() => handleOpenPayModal(app)}
                          >
                            Pay Now
                          </button>
                          <button
                            type="button"
                            className="btn-action-outline"
                            onClick={() => handleOpenReschedule(app)}
                          >
                            Reschedule
                          </button>
                          <button
                            type="button"
                            className="btn-action-cancel"
                            onClick={() => handleOpenCancel(app)}
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {app.status === 'Completed' && (
                        <>
                          <button
                            type="button"
                            className="btn-action-outline"
                            onClick={() => handleOpenReport(app)}
                          >
                            View Report
                          </button>
                          <button
                            type="button"
                            className="btn-action-outline"
                            onClick={() => handleOpenInvoice(app)}
                            disabled={loadingPdfId === `${app.id}_invoice`}
                          >
                            {loadingPdfId === `${app.id}_invoice` ? (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                              'View Invoice'
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn-action-disabled"
                            disabled
                            title="Completed tests cannot be cancelled"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {app.status === 'Cancelled' && (
                        <button
                          type="button"
                          className="btn-action-outline"
                          onClick={() => handleOpenDetails(app)}
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
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
                <div className="appointments-header-row mb-3">
                  <h1 className="appointments-page-title">OPD Consultations</h1>
                  <div className="appointment-subtabs">
                    <button
                      className={`subtab-btn ${activeSubTab === 'upcoming' ? 'active' : ''}`}
                      onClick={() => setActiveSubTab('upcoming')}
                      type="button"
                    >
                      <i className="fas fa-calendar-alt"></i>
                      Pending ({upcomingAppointments.length})
                    </button>
                    <button
                      className={`subtab-btn ${activeSubTab === 'completed' ? 'active' : ''}`}
                      onClick={() => setActiveSubTab('completed')}
                      type="button"
                    >
                      <i className="fas fa-check-circle"></i>
                      Completed
                    </button>
                    <button
                      className={`subtab-btn ${activeSubTab === 'cancelled' ? 'active' : ''}`}
                      onClick={() => setActiveSubTab('cancelled')}
                      type="button"
                    >
                      <i className="fas fa-ban"></i>
                      Cancelled
                    </button>
                  </div>
                </div>

                {/* Quick Banner for Diagnostics */}
            

                {/* Section 1: Upcoming Appointments (Token No. REMOVED as requested) */}
                {activeSubTab === 'upcoming' && (
                  <div className="appointments-section-card">
                    <div className="section-card-header">
                      <div className="section-header-info">
                        <div className="section-icon-badge">
                          <i className="far fa-clock"></i>
                        </div>
                        <div>
                          <h3 className="section-title">Pending Appointments ({upcomingAppointments.length})</h3>
                          <p className="section-subtitle">Manage your upcoming OPD appointments.</p>
                        </div>
                      </div>
                    </div>

                    <div className="ari-table-responsive">
                      <table className="ari-appointments-table">
                        <thead>
                          <tr>
                            <th>Date &amp; Time</th>
                            <th>Doctor</th>
                            <th>Specialty</th>
                            <th>Hospital / Location</th>
                            <th>Payment Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isLoading ? (
                            <tr>
                              <td colSpan="6" className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                              </td>
                            </tr>
                          ) : upcomingAppointments.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="text-center py-5 text-muted">
                                No upcoming appointments found.
                              </td>
                            </tr>
                          ) : (
                            upcomingAppointments.map((app) => (
                              <tr key={app.id}>
                                <td>
                                  <div className="table-date-cell">
                                    <span className="table-date-main">{app.date}</span>
                                    <span className="table-date-sub">{app.dayTime}</span>
                                  </div>
                                </td>
                                <td>
                                  <div className="table-doctor-name">{app.doctor}</div>
                                </td>
                                <td>
                                  <span className="table-specialty-badge">{app.specialty}</span>
                                </td>
                                <td>
                                  <div className="table-location-cell">
                                    <span className="table-hospital-name">{app.hospital}</span>
                                    <span className="table-room-no">{app.room}</span>
                                  </div>
                                </td>
                                <td>
                                  <div className="table-payment-cell">
                                    {app.paymentStatus === 'Paid' ? (
                                      <span className="payment-badge payment-badge-paid">Paid</span>
                                    ) : (
                                      <span className="payment-badge payment-badge-pending">Pending</span>
                                    )}
                                    <span className="payment-amount">₹{app.amount}</span>
                                  </div>
                                </td>
                                <td>
                                  <div className="action-buttons-group">
                                    {app.paymentStatus === 'Pending' ? (
                                      <button
                                        type="button"
                                        className="btn-action-pay"
                                        onClick={() => handleOpenPayModal(app)}
                                      >
                                        Pay Now
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        className="btn-action-outline"
                                        onClick={() => handleOpenInvoice(app)}
                                        disabled={loadingPdfId === `${app.id}_invoice`}
                                      >
                                        {loadingPdfId === `${app.id}_invoice` ? (
                                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                        ) : (
                                          'View Invoice'
                                        )}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="btn-action-outline"
                                      onClick={() => handleOpenReschedule(app)}
                                    >
                                      Reschedule
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-action-cancel"
                                      onClick={() => handleOpenCancel(app)}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Section 2: Past Appointments (Token No. preserved) */}
                {activeSubTab !== 'upcoming' && (
                  <div className="appointments-section-card">
                    <div className="section-card-header">
                      <div className="section-header-info">
                        <div className="section-icon-badge">
                          <i className="fas fa-history"></i>
                        </div>
                        <div>
                          <h3 className="section-title">
                            {activeSubTab === 'cancelled' ? 'Cancelled' : 'Completed'} Appointments ({pastAppointments.length})
                          </h3>
                          <p className="section-subtitle">
                            View your {activeSubTab} OPD appointments.
                          </p>
                        </div>
                      </div>

                      {/* History Filter */}
                      {activeSubTab !== 'completed' && (
                        <div>
                          <select
                            className="status-filter-select"
                            value={historyFilter}
                            onChange={(e) => setHistoryFilter(e.target.value)}
                          >
                            <option value="all_history">All History</option>
                            <option value="present">Present</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="ari-table-responsive">
                      <table className="ari-appointments-table">
                        <thead>
                          <tr>
                            <th>Date &amp; Time</th>
                            <th>Doctor</th>
                            <th>Specialty</th>
                            <th>Hospital / Location</th>
                            <th>Token No.</th>
                            <th>Payment Status</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isLoading ? (
                            <tr>
                              <td colSpan="8" className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                              </td>
                            </tr>
                          ) : pastAppointments.length === 0 ? (
                            <tr>
                              <td colSpan="8" className="text-center py-5 text-muted">
                                No {activeSubTab} appointments found.
                              </td>
                            </tr>
                          ) : (
                            pastAppointments.map((app) => (
                              <tr key={app.id}>
                                <td>
                                  <div className="table-date-cell">
                                    <span className="table-date-main">{app.date}</span>
                                    <span className="table-date-sub">{app.dayTime}</span>
                                  </div>
                                </td>
                                <td>
                                  <div className="table-doctor-name">{app.doctor}</div>
                                </td>
                                <td>
                                  <span className="table-specialty-badge">{app.specialty}</span>
                                </td>
                                <td>
                                  <div className="table-location-cell">
                                    <span className="table-hospital-name">{app.hospital}</span>
                                    <span className="table-room-no">{app.room}</span>
                                  </div>
                                </td>
                                <td>
                                  {app.tokenNo && app.tokenNo !== '-' ? (
                                    <span className="table-token-pill">{app.tokenNo}</span>
                                  ) : (
                                    <span className="text-muted">-</span>
                                  )}
                                </td>
                                <td>
                                  <div className="table-payment-cell">
                                    {app.paymentStatus === 'Paid' ? (
                                      <span className="payment-badge payment-badge-paid">Paid</span>
                                    ) : app.paymentStatus === 'Pending' ? (
                                      <span className="payment-badge payment-badge-pending">Pending</span>
                                    ) : (
                                      <span className={`payment-badge ${app.paymentStatus === 'Refund Complete' || app.paymentStatus === 'Refunded' ? 'bg-info text-white border-0' : 'bg-warning text-dark border-0'}`}>{app.paymentStatus}</span>
                                    )}
                                    <span className="payment-amount">₹{app.amount.toLocaleString ? app.amount.toLocaleString() : app.amount}</span>
                                  </div>
                                </td>
                                <td>
                                  {app.status === 'completed' ? (
                                    <span className="status-pill status-pill-completed">Completed</span>
                                  ) : (
                                    <span className="status-pill status-pill-cancelled">Cancelled</span>
                                  )}
                                </td>
                                <td>
                                  {app.status === 'completed' ? (
                                    <div className="d-flex gap-2">
                                      <button
                                        type="button"
                                        className="btn-action-outline"
                                        onClick={() => handleOpenOpdSlip(app)}
                                        disabled={loadingPdfId === `${app.id}_opd`}
                                      >
                                        {loadingPdfId === `${app.id}_opd` ? (
                                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                        ) : (
                                          'OPD Slip'
                                        )}
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-action-outline"
                                        onClick={() => app.prescriptionHdId ? handleOpenPrescriptionSlip(app) : handleOpenInvoice(app)}
                                        disabled={loadingPdfId === `${app.id}_prescription` || loadingPdfId === `${app.id}_invoice`}
                                      >
                                        {(loadingPdfId === `${app.id}_prescription` || loadingPdfId === `${app.id}_invoice`) ? (
                                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                        ) : (
                                          app.prescriptionHdId ? 'Prescription Slip' : 'View Invoice'
                                        )}
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn-action-outline"
                                      onClick={() => handleOpenDetails(app)}
                                    >
                                      View Details
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="section-card-footer">
                      <div className="pagination-info">
                        Showing 1 to {pastAppointments.length} of {pastAppointments.length} appointments
                      </div>
                      <div className="pagination-controls">
                        <button type="button" className="pagination-btn" disabled>
                          <i className="fas fa-chevron-left"></i>
                        </button>
                        <button type="button" className="pagination-btn active">
                          1
                        </button>
                        <button type="button" className="pagination-btn" disabled>
                          <i className="fas fa-chevron-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* VIEW 2: RADIOLOGY APPOINTMENTS (Primary view when clicking Radiology Appointments) */}
            {activeMenu === 'radiology' && (
              <div className="diagnostics-view-container">
                {/* Header and Filter Sub-tabs */}
                <div className="appointments-header-row mb-4">
                  <div>
                    <h1 className="appointments-page-title">Radiology Appointments</h1>
                    <p className="text-muted small mb-0">
                      View, manage and take action on your radiology appointments.
                    </p>
                  </div>
                  <div className="appointment-subtabs">
                    <button
                      className={`subtab-btn ${activeSubTab === 'upcoming' ? 'active' : ''}`}
                      onClick={() => setActiveSubTab('upcoming')}
                      type="button"
                    >
                      <i className="fas fa-calendar-alt"></i>
                      Pending
                    </button>

                    <button
                      className={`subtab-btn ${activeSubTab === 'cancelled' ? 'active' : ''}`}
                      onClick={() => setActiveSubTab('cancelled')}
                      type="button"
                    >
                      <i className="fas fa-ban"></i>
                      Cancelled
                    </button>
                  </div>
                </div>

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
                <div className="appointments-header-row mb-4">
                  <div>
                    <h1 className="appointments-page-title">Lab Appointments</h1>
                    <p className="text-muted small mb-0">
                      View, manage and take action on your lab test appointments.
                    </p>
                  </div>
                  <div className="appointment-subtabs">
                    <button
                      className={`subtab-btn ${activeSubTab === 'upcoming' ? 'active' : ''}`}
                      onClick={() => setActiveSubTab('upcoming')}
                      type="button"
                    >
                      <i className="fas fa-calendar-alt"></i>
                      Pending
                    </button>

                    <button
                      className={`subtab-btn ${activeSubTab === 'cancelled' ? 'active' : ''}`}
                      onClick={() => setActiveSubTab('cancelled')}
                      type="button"
                    >
                      <i className="fas fa-ban"></i>
                      Cancelled
                    </button>
                  </div>
                </div>

                {/* Primary Card: Lab Card (Mint Green Banner) */}
                {renderLabCard()}

                {/* If user clicked View Both Stacked, show Radiology below */}
                {diagnosticTab === 'all' && renderRadiologyCard()}
              </div>
            )}

            {/* VIEW 4: BOTH LAB & RADIOLOGY STACKED (Matching Mockup Screenshot 100%) */}
            {activeMenu === 'diagnostics' && (
              <div className="diagnostics-view-container">
                {/* Header and Sub-tabs */}
                <div className="appointments-header-row mb-4">
                  <div>
                    <h1 className="appointments-page-title">Diagnostic Appointments (Lab &amp; Radiology)</h1>
                    <p className="text-muted small mb-0">
                      Complete overview of all laboratory pathology and radiology imaging investigations.
                    </p>
                  </div>
                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    <div className="appointment-subtabs">
                      <button
                        className="subtab-btn active"
                        type="button"
                      >
                        <i className="fas fa-layer-group"></i> View Both Stacked ({labAppointments.length + radiologyAppointments.length})
                      </button>
                      <button
                        className="subtab-btn"
                        onClick={() => {
                          setActiveMenu('radiology');
                          setDiagnosticTab('radiology');
                        }}
                        type="button"
                      >
                        <i className="fas fa-x-ray"></i> Radiology Only ({radiologyAppointments.length})
                      </button>
                      <button
                        className="subtab-btn"
                        onClick={() => {
                          setActiveMenu('lab');
                          setDiagnosticTab('lab');
                        }}
                        type="button"
                      >
                        <i className="fas fa-flask"></i> Lab Only ({labAppointments.length})
                      </button>
                    </div>
                    <button
                      type="button"
                      className="btn-book-radiology"
                      onClick={() => handleOpenBookModal('radiology')}
                    >
                      <i className="fas fa-x-ray"></i> Book Radiology Test
                    </button>
                    <button
                      type="button"
                      className="btn-book-lab"
                      onClick={() => navigate('/book-lab-test')}
                    >
                      <i className="fas fa-flask"></i> Book Lab Test
                    </button>
                  </div>
                </div>

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

      {/* MODAL 1: PAY NOW */}
      {modalType === 'pay' && selectedAppointment && (
        <div className="modal-backdrop-custom" onClick={() => setModalType(null)}>
          <div className="modal-dialog-custom" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h5>Complete Payment</h5>
              <button className="modal-close-btn" onClick={() => setModalType(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body-custom">
              <div className="alert alert-primary d-flex align-items-center mb-4">
                <i className="fas fa-lock me-3 fs-4"></i>
                <div>
                  <strong>Secure 256-Bit Encrypted Payment</strong>
                  <div className="small">ARI-Health Gateway</div>
                </div>
              </div>

              <div className="card mb-4 bg-light border-0">
                <div className="card-body">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">{selectedAppointment.doctor ? 'Doctor:' : 'Test / Procedure:'}</span>
                    <strong>{selectedAppointment.doctor || selectedAppointment.testName}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">{selectedAppointment.specialty ? 'Specialty:' : 'Department:'}</span>
                    <span>{selectedAppointment.specialty || selectedAppointment.department}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Hospital / Facility:</span>
                    <span>{selectedAppointment.hospital} ({selectedAppointment.location || selectedAppointment.room})</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Appointment Slot:</span>
                    <span>{selectedAppointment.date} ({selectedAppointment.dayTime})</span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between mb-2">
                    <span>{selectedAppointment.doctor ? 'Consultation Fee:' : 'Diagnostic Fee:'}</span>
                    <span>₹{selectedAppointment.amount.toLocaleString()}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Hospital Convenience Fee:</span>
                    <span className="text-success">FREE</span>
                  </div>
                  <div className="d-flex justify-content-between fs-5 fw-bold text-dark pt-2 border-top">
                    <span>Total Amount:</span>
                    <span className="text-primary">₹{selectedAppointment.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Select Payment Method</label>
                <div className="d-flex flex-column gap-2">
                  {paymentGateways.length > 0 ? (
                    paymentGateways.map(gateway => (
                      <label 
                        key={gateway.gatewayId} 
                        className={`p-3 border rounded-3 d-flex align-items-center justify-content-between cursor-pointer ${paymentMethod === gateway.gatewayCode ? 'border-primary bg-light' : ''}`}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <input
                            type="radio"
                            name="payMethod"
                            checked={paymentMethod === gateway.gatewayCode}
                            onChange={() => setPaymentMethod(gateway.gatewayCode)}
                          />
                          <i className={`fas ${gateway.gatewayCode === 'RAZORPAY' ? 'fa-credit-card' : gateway.gatewayCode === 'CASH' ? 'fa-money-bill-wave' : 'fa-wallet'} text-primary fs-5`}></i>
                          <span>{gateway.gatewayName}</span>
                        </div>
                        {gateway.gatewayCode === 'RAZORPAY' && <span className="badge bg-success">Instant</span>}
                      </label>
                    ))
                  ) : (
                    <div className="text-muted small">Loading payment methods...</div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer-custom">
              <button className="btn btn-light" onClick={() => setModalType(null)}>
                Cancel
              </button>
              <button className="btn btn-primary px-4 fw-bold" onClick={handleProcessPayment} disabled={isProcessingPayment}>
                {isProcessingPayment ? (
                  <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Processing...</>
                ) : (
                  <><i className="fas fa-lock me-2"></i> Pay ₹{selectedAppointment.amount.toLocaleString()}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RESCHEDULE */}
      {modalType === 'reschedule' && selectedAppointment && (
        <div className="modal-backdrop-custom" onClick={() => setModalType(null)}>
          <div className="modal-dialog-custom" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h5>Reschedule Appointment</h5>
              <button className="modal-close-btn" onClick={() => setModalType(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body-custom">
              {showRescheduleConfirm ? (
                <div className="text-center py-4">
                  <div className="mb-3 text-warning">
                    <i className="fas fa-exclamation-triangle fa-3x"></i>
                  </div>
                  <h5 className="mb-3">Are you sure you want to reschedule?</h5>
                  <p className="text-muted mb-0">
                    The appointment for <strong>{selectedAppointment.doctor || selectedAppointment.testName}</strong> will be moved to <strong>{rescheduleDate}</strong>
                    {selectedAppointment.type !== 'lab' && selectedAppointment.type !== 'radiology' && ` at ${rescheduleTime}`}.
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-light rounded-3 mb-4">
                    <div className="fw-bold text-dark">{selectedAppointment.doctor || selectedAppointment.testName}</div>
                    <div className="text-muted small">
                      {selectedAppointment.specialty || selectedAppointment.department} • {selectedAppointment.hospital}
                    </div>
                    <div className="mt-2 small text-primary">
                      Current slot: <strong>{selectedAppointment.date}, {selectedAppointment.dayTime}</strong>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Select New Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      min="2026-09-01"
                    />
                  </div>

                  {selectedAppointment.type !== 'lab' && selectedAppointment.type !== 'radiology' && (
                    <div className="mb-3">
                      <label className="form-label fw-bold">Select Available Time Slot</label>
                      <div className="row g-2">
                        {['08:30 AM', '09:00 AM', '10:15 AM', '11:00 AM', '02:30 PM', '04:00 PM'].map((slot) => (
                          <div className="col-4" key={slot}>
                            <button
                              type="button"
                              className={`btn w-100 btn-sm ${rescheduleTime === slot ? 'btn-primary' : 'btn-outline-secondary'}`}
                              onClick={() => setRescheduleTime(slot)}
                            >
                              {slot}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer-custom">
              {showRescheduleConfirm ? (
                <>
                  <button className="btn btn-light" onClick={() => setShowRescheduleConfirm(false)} disabled={isRescheduling}>
                    Back
                  </button>
                  <button className="btn btn-primary px-4 fw-bold" onClick={handleApproveReschedule} disabled={isRescheduling}>
                    {isRescheduling ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="fas fa-check me-2"></i>
                    )}
                    Confirm
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-light" onClick={() => setModalType(null)}>
                    Close
                  </button>
                  <button className="btn btn-primary px-4 fw-bold" onClick={handleConfirmReschedule}>
                    Confirm Reschedule
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CANCEL */}
      {modalType === 'cancel' && selectedAppointment && (
        <div className="modal-backdrop-custom" onClick={() => setModalType(null)}>
          <div className="modal-dialog-custom" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h5 className="text-danger">
                <i className="fas fa-exclamation-triangle me-2"></i> Cancel Appointment
              </h5>
              <button className="modal-close-btn" onClick={() => setModalType(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body-custom">
              <p>
                Are you sure you want to cancel your appointment for <strong>{selectedAppointment.doctor || selectedAppointment.testName}</strong> scheduled for <strong>{selectedAppointment.date} ({selectedAppointment.dayTime})</strong>?
              </p>

              <div className="mb-3">
                <label className="form-label fw-bold">Reason for cancellation</label>
                <select
                  className="form-select"
                  value={cancelReasonId}
                  onChange={(e) => setCancelReasonId(Number(e.target.value))}
                >
                  {cancelReasonsList.map(reason => (
                    <option key={reason.reasonId} value={reason.reasonId}>
                      {reason.reasonName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAppointment.paymentStatus === 'Paid' && (
                <div className="alert alert-info small mb-0">
                  <i className="fas fa-info-circle me-1"></i> Since this appointment was already paid, a full refund of <strong>₹{selectedAppointment.amount.toLocaleString()}</strong> will be initiated back to your original payment method within 2-3 business days.
                </div>
              )}
            </div>
            <div className="modal-footer-custom">
              <button className="btn btn-light" onClick={() => setModalType(null)}>
                Keep Appointment
              </button>
              <button className="btn btn-danger px-4 fw-bold" onClick={handleConfirmCancel} disabled={isCancelling}>
                {isCancelling ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : null}
                Yes, Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: INVOICE */}
      {modalType === 'invoice' && selectedAppointment && (
        <div className="modal-backdrop-custom" onClick={() => setModalType(null)}>
          <div className="modal-dialog-custom" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h5>Medical Invoice &amp; Receipt</h5>
              <button className="modal-close-btn" onClick={() => setModalType(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body-custom">
              <div className="invoice-sheet">
                <div className="invoice-header">
                  <div>
                    <div className="invoice-brand-title">
                      <i className="fas fa-plus-square me-2"></i>ARI-HEALTH
                    </div>
                    <div className="invoice-meta-item">Hospital &amp; Healthcare Network</div>
                    <div className="invoice-meta-item">{selectedAppointment.hospital}</div>
                    <div className="invoice-meta-item">GSTIN: 07AAACH1234F1Z8</div>
                  </div>
                  <div className="text-end">
                    <span className="badge bg-success mb-2 px-3 py-2">PAID IN FULL</span>
                    <div className="invoice-meta-item">
                      Invoice: <strong>#INV-{selectedAppointment.type ? selectedAppointment.type.toUpperCase() : 'OPD'}-2026-{selectedAppointment.id}</strong>
                    </div>
                    <div className="invoice-meta-item">Date: {selectedAppointment.date}</div>
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-6">
                    <div className="text-muted small">Billed To:</div>
                    <strong>Nitin Dinkar</strong>
                    <div className="small text-muted">+91 9876543210</div>
                    <div className="small text-muted">Patient ID: ARI-PT-8842</div>
                  </div>
                  <div className="col-6 text-end">
                    <div className="text-muted small">{selectedAppointment.doctor ? 'Consulting Specialist:' : 'Service / Facility:'}</div>
                    <strong>{selectedAppointment.doctor || selectedAppointment.testName}</strong>
                    <div className="small text-muted">{selectedAppointment.specialty || selectedAppointment.department}</div>
                    <div className="small text-muted">{selectedAppointment.hospital} • {selectedAppointment.location || selectedAppointment.room}</div>
                  </div>
                </div>

                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th>Service Description</th>
                      <th>Qty</th>
                      <th className="text-end">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>{selectedAppointment.doctor ? 'Outpatient Consultation (OPD)' : selectedAppointment.testName}</strong>
                        <div className="text-muted small">
                          {selectedAppointment.doctor ? 'Specialist OPD visit fee' : `${selectedAppointment.department} Diagnostic Investigation`}
                        </div>
                      </td>
                      <td>1</td>
                      <td className="text-end">₹{selectedAppointment.amount.toLocaleString()}.00</td>
                    </tr>
                    <tr>
                      <td>Electronic Health Record &amp; Vitals Capture</td>
                      <td>1</td>
                      <td className="text-end text-success">₹0.00</td>
                    </tr>
                  </tbody>
                </table>

                <div className="invoice-total-row">
                  <span>Total Amount Paid:</span>
                  <span>₹{selectedAppointment.amount.toLocaleString()}.00</span>
                </div>
              </div>
            </div>
            <div className="modal-footer-custom">
              <button className="btn btn-light" onClick={() => setModalType(null)}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  window.print();
                  showToast('Invoice sent to print preview.');
                }}
              >
                <i className="fas fa-print me-2"></i> Print / Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: DIAGNOSTIC REPORT MODAL */}
      {modalType === 'report' && selectedAppointment && (
        <div className="modal-backdrop-custom" onClick={() => setModalType(null)}>
          <div className="modal-dialog-custom" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <div className="d-flex align-items-center gap-2">
                <i className="fas fa-file-medical text-primary fs-5"></i>
                <h5 className="mb-0">Diagnostic Medical Report</h5>
              </div>
              <button className="modal-close-btn" onClick={() => setModalType(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body-custom">
              <div className="report-sheet">
                <div className="report-header">
                  <div>
                    <div className="invoice-brand-title">
                      <i className="fas fa-plus-square me-2"></i>ARI-HEALTH DIAGNOSTICS
                    </div>
                    <div className="invoice-meta-item">{selectedAppointment.hospital}</div>
                    <div className="invoice-meta-item">NABL Accredited Medical Testing Laboratory</div>
                  </div>
                  <div className="text-end">
                    <span className="badge bg-success mb-2 px-3 py-2">VERIFIED &amp; FINAL</span>
                    <div className="invoice-meta-item">Report ID: <strong>#REP-2026-{selectedAppointment.id}</strong></div>
                    <div className="invoice-meta-item">Report Date: {selectedAppointment.date}</div>
                  </div>
                </div>

                <div className="row mb-3 bg-light p-3 rounded-3">
                  <div className="col-6">
                    <div className="text-muted small">Patient Name:</div>
                    <strong>Nitin Dinkar</strong> (34 Yrs / Male)
                    <div className="small text-muted">UHID: ARI-PT-8842</div>
                  </div>
                  <div className="col-6 text-end">
                    <div className="text-muted small">Referred By:</div>
                    <strong>Dr. Priya Sharma (MD)</strong>
                    <div className="small text-muted">{selectedAppointment.department}</div>
                  </div>
                </div>

                <div className="mb-3">
                  <h6 className="fw-bold text-dark border-bottom pb-2">
                    <i className="fas fa-microscope text-primary me-2"></i>
                    Investigation: {selectedAppointment.testName}
                  </h6>
                </div>

                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Test Parameter</th>
                      <th>Observed Value</th>
                      <th>Reference Interval</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAppointment.testName.includes('Blood') || selectedAppointment.testName.includes('CBC') ? (
                      <>
                        <tr>
                          <td>Hemoglobin (Hb)</td>
                          <td><strong>14.6 g/dL</strong></td>
                          <td>13.0 - 17.0 g/dL</td>
                          <td><span className="badge bg-success">Normal</span></td>
                        </tr>
                        <tr>
                          <td>Total Leukocyte Count (TLC)</td>
                          <td><strong>7,200 /cumm</strong></td>
                          <td>4,000 - 11,000</td>
                          <td><span className="badge bg-success">Normal</span></td>
                        </tr>
                        <tr>
                          <td>Platelet Count</td>
                          <td><strong>245,000 /cumm</strong></td>
                          <td>150,000 - 450,000</td>
                          <td><span className="badge bg-success">Normal</span></td>
                        </tr>
                      </>
                    ) : selectedAppointment.testName.includes('Lipid') ? (
                      <>
                        <tr>
                          <td>Total Cholesterol</td>
                          <td><strong>182 mg/dL</strong></td>
                          <td>&lt; 200 mg/dL</td>
                          <td><span className="badge bg-success">Desirable</span></td>
                        </tr>
                        <tr>
                          <td>Triglycerides</td>
                          <td><strong>138 mg/dL</strong></td>
                          <td>&lt; 150 mg/dL</td>
                          <td><span className="badge bg-success">Normal</span></td>
                        </tr>
                        <tr>
                          <td>HDL Cholesterol (Good)</td>
                          <td><strong>48 mg/dL</strong></td>
                          <td>&gt; 40 mg/dL</td>
                          <td><span className="badge bg-success">Optimal</span></td>
                        </tr>
                      </>
                    ) : selectedAppointment.testName.includes('Thyroid') ? (
                      <>
                        <tr>
                          <td>Total T3 (Triiodothyronine)</td>
                          <td><strong>1.15 ng/mL</strong></td>
                          <td>0.80 - 2.00 ng/mL</td>
                          <td><span className="badge bg-success">Normal</span></td>
                        </tr>
                        <tr>
                          <td>Total T4 (Thyroxine)</td>
                          <td><strong>7.8 μg/dL</strong></td>
                          <td>5.1 - 14.1 μg/dL</td>
                          <td><span className="badge bg-success">Normal</span></td>
                        </tr>
                        <tr>
                          <td>TSH (Ultrasensitive)</td>
                          <td><strong>2.45 μIU/mL</strong></td>
                          <td>0.27 - 4.20 μIU/mL</td>
                          <td><span className="badge bg-success">Euthyroid</span></td>
                        </tr>
                      </>
                    ) : (
                      <>
                        <tr>
                          <td>Organ / Region Examined</td>
                          <td><strong>{selectedAppointment.testName}</strong></td>
                          <td>Standard Protocol</td>
                          <td><span className="badge bg-success">Complete</span></td>
                        </tr>
                        <tr>
                          <td>Radiological Impression</td>
                          <td><strong>Normal anatomical structure with no acute abnormalities noted</strong></td>
                          <td>Normal Study</td>
                          <td><span className="badge bg-success">Normal</span></td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>

                <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top text-muted small">
                  <div>
                    <i className="fas fa-check-double text-success me-1"></i> Digitally Signed by Chief Medical Specialist
                  </div>
                  <div>ARI Health Systems</div>
                </div>
              </div>
            </div>
            <div className="modal-footer-custom">
              <button className="btn btn-light" onClick={() => setModalType(null)}>
                Close
              </button>
              <button
                className="btn btn-primary px-4 fw-bold"
                onClick={() => {
                  window.print();
                  showToast('Diagnostic Report downloaded / sent to print.');
                }}
              >
                <i className="fas fa-download me-2"></i> Download PDF Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: DETAILS */}
      {modalType === 'details' && selectedAppointment && (
        <div className="modal-backdrop-custom" onClick={() => setModalType(null)}>
          <div className="modal-dialog-custom" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h5>Appointment Details</h5>
              <button className="modal-close-btn" onClick={() => setModalType(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body-custom">
              <div className="p-3 bg-light rounded-3 mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold text-dark fs-5">{selectedAppointment.doctor || selectedAppointment.testName}</span>
                  <span className={`status-pill ${selectedAppointment.status === 'completed' || selectedAppointment.status === 'Completed' ? 'status-pill-completed' : 'status-pill-cancelled'}`}>
                    {selectedAppointment.status}
                  </span>
                </div>
                <div className="text-primary fw-medium">{selectedAppointment.specialty || selectedAppointment.department}</div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-6">
                  <div className="text-muted small">Date &amp; Time</div>
                  <div className="fw-bold">{selectedAppointment.date}</div>
                  <div className="small text-muted">{selectedAppointment.dayTime}</div>
                </div>
                <div className="col-6">
                  <div className="text-muted small">Hospital &amp; Location</div>
                  <div className="fw-bold">{selectedAppointment.hospital}</div>
                  <div className="small text-muted">{selectedAppointment.location || selectedAppointment.room}</div>
                </div>
                {selectedAppointment.tokenNo && (
                  <div className="col-6">
                    <div className="text-muted small">Token Number</div>
                    <div className="fw-bold">{selectedAppointment.tokenNo}</div>
                  </div>
                )}
                <div className="col-6">
                  <div className="text-muted small">Amount</div>
                  <div className="fw-bold">₹{selectedAppointment.amount.toLocaleString()}</div>
                </div>
              </div>

              {(selectedAppointment.status === 'Cancelled' || selectedAppointment.status === 'cancelled') && (
                <div className="alert alert-warning small mb-0">
                  <i className="fas fa-info-circle me-1"></i> This appointment was cancelled. If you still need medical attention, please book a new test or contact hospital support.
                  {selectedAppointment.cancellationDateTime && (
                    <div className="mt-2">
                      <strong>Cancelled On:</strong> {new Date(selectedAppointment.cancellationDateTime).toLocaleString()} <br />
                      <strong>Cancelled By:</strong> {selectedAppointment.cancelledBy || 'N/A'} <br />
                      <strong>Reason:</strong> {selectedAppointment.cancellationReason || 'N/A'}
                    </div>
                  )}

                  {selectedAppointment.refundDate && selectedAppointment.refundId && (
                    <div className="mt-3 pt-3 border-top border-warning">
                      <h6 className="fw-bold mb-2 text-dark"><i className="fas fa-receipt me-1"></i> Gateway Refund Details</h6>
                      {loadingRefundDetails ? (
                        <div className="d-flex align-items-center text-muted">
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Loading refund details...
                        </div>
                      ) : refundDetailsData ? (
                        <div className="row g-2 mt-2">
                          <div className="col-12 col-md-6">
                            <span className="text-muted">Gateway Refund ID:</span><br/><strong className="text-dark">{refundDetailsData.gatewayRefundId}</strong>
                          </div>
                          <div className="col-12 col-md-6">
                            <span className="text-muted">Refund Amount:</span><br/><strong className="text-dark">₹{refundDetailsData.refundAmount}</strong>
                          </div>
                          <div className="col-12 col-md-6">
                            <span className="text-muted">Refund Reason:</span><br/><strong className="text-dark">{refundDetailsData.refundReason || 'N/A'}</strong>
                          </div>
                          <div className="col-12 col-md-6">
                            <span className="text-muted">Payment Amount:</span><br/><strong className="text-dark">₹{refundDetailsData.paymentAmount}</strong>
                          </div>
                          <div className="col-12 col-md-6">
                            <span className="text-muted">Initiated On:</span><br/><strong className="text-dark">{new Date(refundDetailsData.initiatedOn).toLocaleString()}</strong>
                          </div>
                          <div className="col-12 col-md-6">
                            <span className="text-muted">Gateway Payment ID:</span><br/><strong className="text-dark">{refundDetailsData.gatewayPaymentId}</strong>
                          </div>
                          <div className="col-12 col-md-6">
                            <span className="text-muted">Payment Mode:</span><br/><strong className="text-dark">{refundDetailsData.paymentMode}</strong>
                          </div>
                          <div className="col-12 col-md-6">
                            <span className="text-muted">Payment Via:</span><br/><strong className="text-dark">{refundDetailsData.paymentVia}</strong>
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted mt-2">Refund details not available.</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer-custom">
              <button className="btn btn-primary px-4" onClick={() => setModalType(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: BOOK RADIOLOGY TEST (Interactive Modal) */}
      {modalType === 'book-radiology' && (
        <div className="modal-backdrop-custom" onClick={() => setModalType(null)}>
          <div className="modal-dialog-custom" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom" style={{ background: '#F3E8FF', borderBottom: '1px solid #DDD6FE' }}>
              <div className="d-flex align-items-center gap-2">
                <div className="banner-icon-radiology" style={{ width: '38px', height: '38px', fontSize: '1.1rem' }}>
                  <i className="fas fa-x-ray"></i>
                </div>
                <div>
                  <h5 className="mb-0 text-dark fw-bold">Book Radiology Test</h5>
                  <small className="text-muted">Diagnostic Scans, X-Rays, Ultrasound &amp; MRIs</small>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setModalType(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body-custom">
              <div className="mb-3">
                <label className="form-label fw-bold">Select Procedure / Test</label>
                <select
                  className="form-select"
                  value={newBookingTest}
                  onChange={(e) => setNewBookingTest(e.target.value)}
                >
                  <option value="X-Ray Chest (PA View)">X-Ray Chest (PA View) — ₹600 (Radiology Dept)</option>
                  <option value="Ultrasound Abdomen">Ultrasound Abdomen — ₹1,200 (USG Department)</option>
                  <option value="MRI Brain">MRI Brain (with Contrast) — ₹4,500 (Advanced Imaging)</option>
                  <option value="CT Scan Thorax">CT Scan Thorax — ₹2,800 (Computed Tomography)</option>
                  <option value="Spine MRI (Lumbar)">Spine MRI (Lumbar) — ₹4,200 (Advanced Imaging)</option>
                  <option value="Digital Mammography">Digital Mammography — ₹1,800 (Women's Imaging)</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Select Hospital / Diagnostic Facility</label>
                <select
                  className="form-select"
                  value={newBookingHospital}
                  onChange={(e) => setNewBookingHospital(e.target.value)}
                >
                  <option value="ARI Hospital, Delhi">ARI Hospital, Delhi (Radiology - Ground Floor)</option>
                  <option value="ARI Diagnostic Center, Delhi">ARI Diagnostic Center, Delhi (Ultrasound Suite 2)</option>
                  <option value="City Scan Center, Delhi">City Scan Center, Delhi (Advanced MRI/CT Wing)</option>
                  <option value="Apollo Hospital, Delhi">Apollo Hospital, Delhi (Diagnostic Block)</option>
                </select>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Appointment Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={newBookingDate}
                    onChange={(e) => setNewBookingDate(e.target.value)}
                    min="2026-09-01"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Preferred Time Slot</label>
                  <select
                    className="form-select"
                    value={newBookingTime}
                    onChange={(e) => setNewBookingTime(e.target.value)}
                  >
                    <option value="Tue, 02:00 PM">02:00 PM (Afternoon)</option>
                    <option value="Wed, 11:00 AM">11:00 AM (Morning)</option>
                    <option value="Mon, 10:00 AM">10:00 AM (Morning)</option>
                    <option value="09:00 AM">09:00 AM (Early Slot)</option>
                    <option value="03:30 PM">03:30 PM (Evening)</option>
                    <option value="05:00 PM">05:00 PM (Evening)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-light rounded-3 mb-3 border">
                <div className="d-flex justify-content-between mb-1 small">
                  <span className="text-muted">Selected Scan:</span>
                  <strong className="text-dark">{newBookingTest}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1 small">
                  <span className="text-muted">Facility:</span>
                  <span>{newBookingHospital}</span>
                </div>
                <div className="d-flex justify-content-between mb-1 small">
                  <span className="text-muted">Radiologist Consultation:</span>
                  <span className="text-success fw-semibold">Included (Report included)</span>
                </div>
                <div className="d-flex justify-content-between pt-2 border-top fw-bold text-dark">
                  <span>Estimated Total:</span>
                  <span className="text-primary fs-6">
                    ₹{(newBookingTest.includes('MRI') ? 4500 : newBookingTest.includes('CT') ? 2800 : newBookingTest.includes('Ultrasound') ? 1200 : newBookingTest.includes('Mammography') ? 1800 : 600).toLocaleString()}
                  </span>
                </div>
              </div>

             
            </div>
            <div className="modal-footer-custom">
              <button className="btn btn-light" onClick={() => setModalType(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-book-radiology"
                onClick={() => handleConfirmBookTest('radiology')}
              >
                <i className="fas fa-check-circle"></i> Confirm &amp; Book Radiology Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: BOOK LAB TEST (Interactive Modal) */}
      {modalType === 'book-lab' && (
        <div className="modal-backdrop-custom" onClick={() => setModalType(null)}>
          <div className="modal-dialog-custom" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom" style={{ background: '#E8F8F0', borderBottom: '1px solid #D1FAE5' }}>
              <div className="d-flex align-items-center gap-2">
                <div className="banner-icon-lab" style={{ width: '38px', height: '38px', fontSize: '1.1rem' }}>
                  <i className="fas fa-flask"></i>
                </div>
                <div>
                  <h5 className="mb-0 text-dark fw-bold">Book Lab Test</h5>
                  <small className="text-muted">Pathology, Blood Tests, &amp; Health Profiles</small>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setModalType(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body-custom">
              <div className="mb-3">
                <label className="form-label fw-bold">Select Test / Health Package</label>
                <select
                  className="form-select"
                  value={newBookingTest}
                  onChange={(e) => setNewBookingTest(e.target.value)}
                >
                  <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC) — ₹350 (Pathology Lab)</option>
                  <option value="Thyroid Profile (T3, T4, TSH)">Thyroid Profile (T3, T4, TSH) — ₹500 (Endocrinology Lab)</option>
                  <option value="Health Checkup Package">Health Checkup Package (Full Body) — ₹1,499</option>
                  <option value="Lipid Profile">Lipid Profile (Heart Health) — ₹750 (Biochemistry)</option>
                  <option value="HbA1c Diabetes Screen">HbA1c Diabetes Screen — ₹450 (Pathology Lab)</option>
                  <option value="Liver Function Test (LFT)">Liver Function Test (LFT) — ₹650 (Biochemistry)</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Select Hospital / Diagnostic Lab</label>
                <select
                  className="form-select"
                  value={newBookingHospital}
                  onChange={(e) => setNewBookingHospital(e.target.value)}
                >
                  <option value="ARI Hospital, Delhi">ARI Hospital, Delhi (Lab - 1st Floor)</option>
                  <option value="ARI Diagnostic Center, Delhi">ARI Diagnostic Center, Delhi (Pathology Wing)</option>
                  <option value="City Labs, Delhi">City Labs, Delhi (Central Diagnostic Unit)</option>
                  <option value="Apollo Hospital, Delhi">Apollo Hospital, Delhi (Clinical Lab)</option>
                </select>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Appointment Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={newBookingDate}
                    onChange={(e) => setNewBookingDate(e.target.value)}
                    min="2026-09-01"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Preferred Time Slot</label>
                  <select
                    className="form-select"
                    value={newBookingTime}
                    onChange={(e) => setNewBookingTime(e.target.value)}
                  >
                    <option value="Fri, 08:00 AM">08:00 AM (Fasting Slot)</option>
                    <option value="Fri, 09:00 AM">09:00 AM (Morning)</option>
                    <option value="Fri, 08:30 AM">08:30 AM (Morning)</option>
                    <option value="10:00 AM">10:00 AM (Morning)</option>
                    <option value="11:30 AM">11:30 AM (Noon)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-light rounded-3 mb-3 border">
                <div className="d-flex justify-content-between mb-1 small">
                  <span className="text-muted">Selected Test:</span>
                  <strong className="text-dark">{newBookingTest}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1 small">
                  <span className="text-muted">Sample Collection:</span>
                  <span className="text-success fw-semibold">Hospital Walk-In / Free Collection</span>
                </div>
                <div className="d-flex justify-content-between mb-1 small">
                  <span className="text-muted">Digital Report Delivery:</span>
                  <span>Within 24 hours online</span>
                </div>
                <div className="d-flex justify-content-between pt-2 border-top fw-bold text-dark">
                  <span>Estimated Total:</span>
                  <span className="text-success fs-6">
                    ₹{(newBookingTest.includes('Health Checkup') ? 1499 : newBookingTest.includes('Lipid') ? 750 : newBookingTest.includes('Thyroid') ? 500 : newBookingTest.includes('Liver') ? 650 : newBookingTest.includes('HbA1c') ? 450 : 350).toLocaleString()}
                  </span>
                </div>
              </div>

             
            </div>
            <div className="modal-footer-custom">
              <button className="btn btn-light" onClick={() => setModalType(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-book-lab"
                onClick={() => handleConfirmBookTest('lab')}
              >
                <i className="fas fa-check-circle"></i> Confirm &amp; Book Lab Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Toast */}
      {toastMessage && (
        <div className={`ari-toast ${toastMessage.type}`}>
          <i className="fas fa-info-circle"></i>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* PDF Viewer */}
      {showPdfViewer && (
        <PdfViewer 
          pdfUrl={pdfUrl} 
          name={pdfName}
          onClose={() => {
            setShowPdfViewer(false);
            setPdfUrl(null);
          }} 
        />
      )}
    </div>
  );
}
