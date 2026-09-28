import { PAYMENT_STATUS, VISIT_STATUS, API_VISIT_STATUS, APPOINTMENT_TYPE } from '../../constants';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  if (dateStr.includes(' ')) {
    return dateStr.split(' ')[0];
  }
  return dateStr;
};

const formatTime = (timeStr) => {
  if (!timeStr) return 'N/A';
  const trimmed = timeStr.replace(/to/gi, '').trim();
  if (trimmed === '') return 'N/A';
  return timeStr;
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  if (dateStr.includes(' ')) {
    const parts = dateStr.split(' ');
    const timeParts = parts[1].split(':');
    if (timeParts.length >= 2) {
      let hour = parseInt(timeParts[0], 10);
      const min = timeParts[1];
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12;
      hour = hour ? hour : 12;
      return `${parts[0]} ${hour.toString().padStart(2, '0')}:${min} ${ampm}`;
    }
  }
  return dateStr;
};

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
    time = formatTime(parts[1]);
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
    tokenNo: app.tokenNumber || '-',
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
  let when = formatDate(app.appointmentDate);
  let time = formatTime(app.appointmentTime);
  
  const isLab = app.departmentName?.toLowerCase().includes('lab') || app.departmentName === 'Laboratory';
  const isRad = app.departmentName?.toLowerCase().includes('rad') || app.departmentName === 'Radiology';
  
  let computedPaymentStatus = '';
  if (!app.paymentId) {
      computedPaymentStatus = 'Not paid';
  } else if (app.paymentModeCode === 'CASH' || app.paymentModeName === 'Cash') {
      computedPaymentStatus = 'Cash collect';
  } else {
      computedPaymentStatus = app.refundStatus || 'PENDING';
  }

  return {
    id: app.visitId,
    date: when,
    dayTime: time,
    doctor: app.doctorName || 'Not Assigned',
    doctorId: app.doctorId,
    specialty: app.departmentName,
    departmentId: app.departmentId,
    testName: app.doctorName ? '' : (app.departmentName || 'Diagnostic Test'),
    department: app.departmentName,
    hospital: parsedHospital.hospitalName,
    location: parsedHospital.hospitalName,
    room: 'Room Not Assigned',
    tokenNo: app.tokenNumber || '-',
    paymentStatus: computedPaymentStatus,
    amount: app.billingAmount || 0,
    status: VISIT_STATUS.CANCELLED,
    type: isLab ? APPOINTMENT_TYPE.LAB : (isRad ? APPOINTMENT_TYPE.RADIOLOGY : APPOINTMENT_TYPE.OPD),
    cancellationDateTime: formatDateTime(app.cancellationDateTime),
    cancelledBy: app.cancelledBy,
    cancellationReason: app.cancellationReason,
    refundId: app.refundId,
    refundDate: formatDate(app.refundDate),
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
  let when = formatDate(app.appointmentDate);
  let time = formatTime(app.appointmentStartTime);
  if (time === 'N/A' && app.appointmentDate && app.appointmentDate.includes(' ')) {
    time = formatTime(app.appointmentDate.split(' ')[1]);
  }
  
  let mappedStatus = VISIT_STATUS.PENDING;
  
  if (app.visitStatus === API_VISIT_STATUS.YES) {
    mappedStatus = VISIT_STATUS.COMPLETED;
  } else if (app.visitStatus === API_VISIT_STATUS.CANCELLED) {
    mappedStatus = VISIT_STATUS.CANCELLED;
  } else if (app.visitStatus === API_VISIT_STATUS.NO) {
    mappedStatus = app.visitPaymentStatus === API_VISIT_STATUS.YES ? VISIT_STATUS.CONFIRMED : VISIT_STATUS.PENDING;
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
    doctorId: app.doctorId,
    specialty: app.departmentName,
    departmentId: app.departmentId,
    testName: app.doctorName ? '' : (app.departmentName || 'Diagnostic Test'),
    department: app.departmentName,
    hospital: parsedHospital.hospitalName,
    location: parsedHospital.hospitalName,
    room: 'Room Not Assigned',
    tokenNo: app.tokenNumber || '-',
    paymentStatus: app.visitPaymentStatus === API_VISIT_STATUS.YES ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PENDING,
    amount: app.billedAmount || 0,
    status: mappedStatus,
    type: isLab ? APPOINTMENT_TYPE.LAB : (isRad ? APPOINTMENT_TYPE.RADIOLOGY : APPOINTMENT_TYPE.OPD),
    billHdId: app.billingHeaderId,
    paymentGatewayModeName: app.paymentGatewayModeName
  };
};
