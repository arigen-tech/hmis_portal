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
    REFRESH_TOKEN: '/mobileController/refreshToken',
    // LOGOUT: '/auth/logout',
  },
  MASTER: {
    GET_ALL_HOSPITALS: '/master/hospitalResponse/getAll/1',
    CANCEL_REASON_MASTER: '/master/cancel-payment-reason/1',
    PAYMENT_GATEWAY: '/master/paymentGateway/getAll/1',
    GET_OPD_SESSIONS: '/master/opd-session/getAll/1',
    GET_INVESTIGATIONS_PRICE: '/DgMasInvestigation/price-details',
    GET_PACKAGES: '/package-investigation-mapping/getAllPackageMap/1',
    GET_ALL_GENDER: '/master/gender/getAll/1',
    GET_ALL_RELATION: '/master/relation/getAll/1',
    GET_ALL_COUNTRY: '/master/country/getAll/1',
    GET_STATE_BY_COUNTRY_ID: '/master/state/getByCountryId',
    GET_DISTRICT_BY_STATE_ID: '/master/district/getByState',
    GET_ALL_BLOOD_GROUP: '/master/blood-group/getAll/1',
    GET_ALL_MARITAL_STATUS: '/master/marital-status/getAll/1',
  },
  APPOINTMENTS: {
    HISTORY_LIST: '/mobileController/getAppointmentHistoryList',
    OPD_REPORTS_LIST: '/opd/getOpdReportsList',
    OPD_REPORT_DEPARTMENT_LIST: '/opd/getOpdReportDepartmentList',
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
    VISIT_STATUS_COUNTS: '/mobileController/getPatientVisitStatusCounts',
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
    GET_LAB_RADIOLOGY_BILLING_DETAILS: '/billing/getLabRadiologyBillingDetailsAll',
  },
  PAYMENTS: {
    RAZORPAY_PREFILL: '/api/payments/razorpay-prefill',
    CREATE_ORDER: '/api/payments/create-order',
    VERIFY: '/api/payments/verify',
    STATUS: '/api/payments/status',
  },
  LAB: {
    INVESTIGATIONS_REPORT: '/lab/investigationsReport/all',
    PDF_REPORT: '/report/labInvestigationReport',
  },
  RADIOLOGY: {
    PACS_MODALITY_LIST: '/radiology/getPACSModalityList',
    PACS_STUDY_LIST: '/radiology/getPACSStudyList',
    PDF_REPORT: '/report/radiologyReport',
    PACS_LAUNCH_URL: '/api/pacs/launch-url',
  },
  IPD: {
    ADMISSION_DISCHARGE_LIST: '/ipd/activeAdmissionAndDischargeAdmissionList',
    DISCHARGE_SUMMARY_REPORT: '/report/dischageSummary',
    BILL_SUMMARY_REPORT: '/report/ipSummaryBill',
    DETAILED_BILL_REPORT: '/report/ipDetailedBill',
  },
  PATIENTS: {
    ADD_FAMILY_MEMBER: '/patient/register/family-member',
  }
};
