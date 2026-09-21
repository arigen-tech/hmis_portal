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
    // LOGOUT: '/auth/logout',
  },
  MASTER: {
    GET_ALL_HOSPITALS: '/master/hospitalResponse/getAll/1',
    CANCEL_REASON_MASTER: '/master/cancel-payment-reason/1',
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
  },
  // USERS: {
  //   PROFILE: '/users/profile',
  //   UPDATE: '/users/update',
  // },
  BILLING: {
    REFUND_DETAILS: '/billing/refundDetails',
    REFUND: '/api/payments/refund',
  },
  // Add other modules here like PATIENTS, DOCTORS, APPOINTMENTS etc.
};
