export const PAYMENT_STATUS = Object.freeze({
  PAID: 'Paid',
  PENDING: 'Pending',
  REFUND_PENDING: 'Refund Pending',
  REFUND_COMPLETE: 'Refund Complete',
});

export const VISIT_STATUS = Object.freeze({
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  SCHEDULED: 'Scheduled',
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
});

export const API_VISIT_STATUS = Object.freeze({
  YES: 'y',
  NO: 'n',
  CANCELLED: 'c',
});

export const APPOINTMENT_TYPE = Object.freeze({
  OPD: 'opd',
  LAB: 'lab',
  RADIOLOGY: 'radiology',
});

export const DEPT_CODE = Object.freeze({
  OPD: 'OPD',
  LAB: 'LAB',
  RAD: 'RAD',
});

export const MODAL_TYPE = Object.freeze({
  PAY: 'pay',
  RESCHEDULE: 'reschedule',
  CANCEL: 'cancel',
  DETAILS: 'details',
  REPORT: 'report',
  INVOICE: 'invoice',
  BOOK_LAB: 'book-lab',
  BOOK_RADIOLOGY: 'book-radiology',
});
