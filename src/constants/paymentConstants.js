import { ENDPOINTS } from './apiEndpoints';
import { APPOINTMENT_TYPE } from './appointmentConstants';

export const PAYMENT_MODE = Object.freeze({
  ONLINE: 'online',
  CASH: 'cash',
  UPI: 'upi',
  CARD: 'card',
  NETBANKING: 'netbanking'
});

export const GATEWAY_CODE = Object.freeze({
  RAZORPAY: 'RAZORPAY',
  CASH: 'CASH'
});

export const BILLING_TYPE = Object.freeze({
  LAB: 'LAB_SC',
  RAD: 'RAD_SC'
});

export const PAYMENT_CONFIG = Object.freeze({
  [APPOINTMENT_TYPE.LAB]: {
    billingType: BILLING_TYPE.LAB,
    endpoint: ENDPOINTS.BILLING.PROCESS_LAB_PAYMENT,
    buildExtraPayload: () => ({})
  },
  [APPOINTMENT_TYPE.RADIOLOGY]: {
    billingType: BILLING_TYPE.RAD,
    endpoint: ENDPOINTS.BILLING.PROCESS_RADIOLOGY_PAYMENT,
    buildExtraPayload: (billHdId) => ({ billingHeaderIds: [billHdId] })
  }
});
