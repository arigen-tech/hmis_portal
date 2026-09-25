/**
 * API Endpoints Constants
 * 
 * Centralized file to maintain all application API routes.
 * Using this prevents hardcoded strings throughout the application.
 */

const base_url = 'http://localhost:8080';
// const base_url= 'https://api.arigenhmis.com/hims';

export const API_BASE_URL = import.meta.env.VITE_HIMS_API_BASE_URL || base_url;

export const ENDPOINTS = {
  AUTH: {
    SEND_OTP: '/mobileController/mLogin',
    VERIFY_OTP: '/mobileController/verifyOtp',
    SWITCH_PATIENT: '/mobileController/switchPatient',
    // LOGOUT: '/auth/logout',
  },
  MASTER: {
    GET_ALL_HOSPITALS: '/master/hospitalResponse/getAll/1',
    CANCEL_REASON_MASTER: '/master/cancel-payment-reason/1',
    PAYMENT_GATEWAY: '/master/paymentGateway/getAll/1',
    GET_OPD_SESSIONS: '/master/opd-session/getAll/1',
    GET_INVESTIGATIONS_PRICE: '/DgMasInvestigation/price-details',
  },
  APPOINTMENTS: {
    HISTORY_LIST: '/mobileController/getAppointmentHistoryList',
    OPD_REPORTS_LIST: '/opd/getOpdReportsList',
    OPD_PRESCRIPTION_SLIP: '/report/opdPrescriptionSlip',
    OPD_CASE_SHEET_REPORT: '/report/opdCaseSheetReport',
    OPD_INVOICE: '/report/opdInvoice',
    CANCELLED_REFUND_LIST: '/mobileController/getCancelledRefundAppointments',
    RESCHEDULE_APPOINTMENT: '/registration/rescheduleAppointment',
    CANCEL_APPOINTMENT: '/registration/cancelAppointment',
    SEARCH_DOCTOR: '/mobileController/searchBySpecialityAndDoctor',
    DOCTORS_BY_SPECIALTY: '/mobileController/getAllDoctorBySpecialityWise',
    DOCTOR_DETAIL: '/mobileController/getDoctorDetailById',
    GET_APPOINTMENT_SLOTS: '/registration/getAppointmentSlots/1',
    UPDATE_PATIENT: '/registration/updatePatient',
    BOOK_LAB_TEST: '/lab/updateDetailsAndBookingLaboratory',
    BOOK_RADIOLOGY_TEST: '/radiology/updateDetailsAndBookingRadiology',
  },
  // USERS: {
  //   PROFILE: '/users/profile',
  //   UPDATE: '/users/update',
  // },
  BILLING: {
    REFUND_DETAILS: '/billing/refundDetails',
    REFUND: '/api/payments/refund',
    PROCESS_LAB_PAYMENT: '/billing/processLabPayment',
    PROCESS_RADIOLOGY_PAYMENT: '/billing/processRadiologyPayment',
    OPD_PATIENT_BILL_DETAILS: '/billing/OPDPatientBillDetails',
    PROCESS_OPD_PAYMENT: '/billing/processOpdPayment',
    GET_LAB_RADIOLOGY_BILLING_DETAILS: '/billing/getLabRadiologyBillingDetails',
  },
  PAYMENTS: {
    RAZORPAY_PREFILL: '/api/payments/razorpay-prefill',
    CREATE_ORDER: '/api/payments/create-order',
    VERIFY: '/api/payments/verify',
    STATUS: '/api/payments/status',
  },
  // Add other modules here like PATIENTS, DOCTORS, APPOINTMENTS etc.
};
