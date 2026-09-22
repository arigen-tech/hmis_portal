import { PAYMENT_STATUS, VISIT_STATUS, API_VISIT_STATUS, APPOINTMENT_TYPE } from '../../constants';

/**
 * Maps an item from the OPD_REPORTS_LIST endpoint.
 * @param {Object} app - Raw appointment data
 * @param {Object} parsedHospital - Hospital details object
 * @returns {Object} Mapped appointment object
 */
export const mapOpdCompletedItem = (app, parsedHospital) => {
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
    paymentStatus: PAYMENT_STATUS.PAID,
    amount: 0,
    status: VISIT_STATUS.COMPLETED,
    type: APPOINTMENT_TYPE.OPD,
    prescriptionHdId: app.prescriptionHdId,
    prescriptionStatus: app.prescriptionStatus,
    billHdId: app.billingHeaderId,
    paymentGatewayModeName: app.paymentGatewayModeName
  };
};

/**
 * Maps an item from the CANCELLED_REFUND_LIST endpoint.
 * @param {Object} app - Raw appointment data
 * @param {Object} parsedHospital - Hospital details object
 * @returns {Object} Mapped appointment object
 */
export const mapCancelledItem = (app, parsedHospital) => {
  let when = app.appointmentDate || 'N/A';
  let time = app.appointmentTime && app.appointmentTime !== ' to ' ? app.appointmentTime : 'N/A';
  
  const isLab = app.departmentName?.toLowerCase().includes('lab') || app.departmentName === 'Laboratory';
  const isRad = app.departmentName?.toLowerCase().includes('rad') || app.departmentName === 'Radiology';
  
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
    paymentStatus: app.refundDate ? PAYMENT_STATUS.REFUND_COMPLETE : (app.refundStatus ? app.refundStatus : PAYMENT_STATUS.REFUND_PENDING),
    amount: app.billingAmount || 0,
    status: VISIT_STATUS.CANCELLED,
    type: isLab ? APPOINTMENT_TYPE.LAB : (isRad ? APPOINTMENT_TYPE.RADIOLOGY : APPOINTMENT_TYPE.OPD),
    cancellationDateTime: app.cancellationDateTime,
    cancelledBy: app.cancelledBy,
    cancellationReason: app.cancellationReason,
    refundId: app.refundId,
    refundDate: app.refundDate,
    billHdId: app.billingHeaderId,
    paymentGatewayModeName: app.paymentGatewayModeName
  };
};

/**
 * Maps an item from the HISTORY_LIST endpoint.
 * @param {Object} app - Raw appointment data
 * @param {Object} parsedHospital - Hospital details object
 * @returns {Object} Mapped appointment object
 */
export const mapHistoryItem = (app, parsedHospital) => {
  let when = app.appointmentDate || 'N/A';
  let time = app.appointmentStartTime || (app.appointmentDate && app.appointmentDate.includes(' ') ? app.appointmentDate.split(' ')[1] : 'N/A');
  if (when && when.includes(' ')) {
    when = when.split(' ')[0];
  }
  
  let mappedStatus = VISIT_STATUS.PENDING;
  
  if (app.visitStatus === API_VISIT_STATUS.YES) {
    mappedStatus = VISIT_STATUS.COMPLETED;
  } else if (app.visitStatus === API_VISIT_STATUS.CANCELLED) {
    mappedStatus = VISIT_STATUS.CANCELLED;
  } else if (app.visitStatus === API_VISIT_STATUS.NO) {
    mappedStatus = app.visitPaymentStatus === API_VISIT_STATUS.YES ? VISIT_STATUS.CONFIRMED : VISIT_STATUS.PENDING;
    // For lab/radiology, the legacy code used 'Scheduled'. 
    // We will use CONFIRMED/PENDING for both now, or map it specifically.
    // The requirement is ONE canonical casing. So if it's Scheduled, use SCHEDULED.
    // Wait, the original code did:
    // opdStatus = app.visitPaymentStatus === 'y' ? 'confirmed' : 'pending'; diagStatus = 'Scheduled';
    // Let's preserve that logic if needed, or use SCHEDULED for diagnostic.
  }
  
  const isLab = app.departmentName?.toLowerCase().includes('lab') || app.departmentName === 'Laboratory';
  const isRad = app.departmentName?.toLowerCase().includes('rad') || app.departmentName === 'Radiology';
  const isDiagnostic = isLab || isRad;

  if (app.visitStatus === API_VISIT_STATUS.NO && isDiagnostic) {
    mappedStatus = VISIT_STATUS.SCHEDULED;
  }
  
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
    paymentStatus: app.visitPaymentStatus === API_VISIT_STATUS.YES ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PENDING,
    amount: app.billedAmount || 0,
    status: mappedStatus,
    type: isLab ? APPOINTMENT_TYPE.LAB : (isRad ? APPOINTMENT_TYPE.RADIOLOGY : APPOINTMENT_TYPE.OPD),
    billHdId: app.billingHeaderId,
    paymentGatewayModeName: app.paymentGatewayModeName
  };
};
