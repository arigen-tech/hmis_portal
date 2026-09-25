import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../../services/apiService';
import { ENDPOINTS } from '../../../constants/apiEndpoints';
import { useStoredSession } from '../hooks/useStoredSession';
export function AppointmentModals({
  modalType,
  selectedAppointment,
  closeModal,
  
  // Pay Modal
  paymentGateways,
  paymentMethod,
  setPaymentMethod,
  handleProcessPayment,
  isProcessingPayment,

  // Reschedule Modal
  showRescheduleConfirm,
  setShowRescheduleConfirm,
  rescheduleDate,
  setRescheduleDate,
  rescheduleTime,
  setRescheduleTime,
  isRescheduling,
  handleApproveRescheduleWrapper,
  handleConfirmReschedule,
  opdSessionsList,
  selectedSessionId,
  setSelectedSessionId,
  availableTimeSlots,
  selectedTimeSlot,
  setSelectedTimeSlot,
  isTimeSlotsLoading,

  // Cancel Modal
  cancelReasonId,
  setCancelReasonId,
  cancelReasonsList,
  handleConfirmCancelWrapper,
  isCancelling,

  // Invoice / Report Modal
  showToast,

  // Details Modal
  refundDetailsData,
  loadingRefundDetails,

  // Book Test Modal
  newBookingTest,
  setNewBookingTest,
  newBookingHospital,
  setNewBookingHospital,
  newBookingDate,
  setNewBookingDate,
  newBookingTime,
  setNewBookingTime,
  handleConfirmBookTest,
  isBookingTest
}) {
  const { patientDetails: parsedPatient, selectedHospital: parsedHospital } = useStoredSession();
  
  const [investigationList, setInvestigationList] = useState([]);
  const [investigationSearch, setInvestigationSearch] = useState('');
  const [filteredInvestigations, setFilteredInvestigations] = useState([]);
  const [selectedInvestigation, setSelectedInvestigation] = useState(null);
  const [selectedTestsList, setSelectedTestsList] = useState([]);
  const [hospitalList, setHospitalList] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (modalType === 'book-lab' || modalType === 'book-radiology') {
      setSelectedTestsList([]);
      setInvestigationSearch('');
      setSelectedInvestigation(null);
      const fetchInvestigations = async () => {
        try {
          let genderCode = 'm';
          if (parsedPatient) {
            const genderName = (parsedPatient.genderName || parsedPatient.gender || '').toLowerCase();
            if (genderName.startsWith('f')) {
              genderCode = 'f';
            } else if (genderName.startsWith('m')) {
              genderCode = 'm';
            }
          }
          const url = modalType === 'book-radiology' 
            ? `${ENDPOINTS.MASTER.GET_INVESTIGATIONS_PRICE}?genderApplicable=${genderCode}&radioFlag=true`
            : `${ENDPOINTS.MASTER.GET_INVESTIGATIONS_PRICE}?genderApplicable=${genderCode}`;
          const res = await apiService.get(url);
          if (res?.response) {
            setInvestigationList(res.response);
            setFilteredInvestigations(res.response);
          }
        } catch (error) {
          console.error("Failed to load investigations", error);
        }
      };
      const fetchHospitals = async () => {
        try {
          const res = await apiService.get(ENDPOINTS.MASTER.GET_ALL_HOSPITALS);
          if (res?.response) {
            setHospitalList(res.response);
          }
        } catch (error) {
          console.error("Failed to load hospitals", error);
        }
      };
      fetchInvestigations();
      fetchHospitals();

      if (parsedHospital && parsedHospital.hospitalName) {
        setNewBookingHospital(parsedHospital.hospitalName);
      }
    }
  }, [modalType, parsedPatient, parsedHospital, setNewBookingHospital]);

  useEffect(() => {
    if (investigationSearch) {
      setFilteredInvestigations(
        investigationList.filter(item => 
          item.investigationName.toLowerCase().includes(investigationSearch.toLowerCase())
        )
      );
    } else {
      setFilteredInvestigations(investigationList);
    }
  }, [investigationSearch, investigationList]);

  const handleSelectInvestigation = (item) => {
    setSelectedInvestigation(item);
    setInvestigationSearch(item.investigationName);
    setIsSearchOpen(false);
  };

  const handleAddTest = () => {
    if (selectedInvestigation && !selectedTestsList.find(t => t.investigationId === selectedInvestigation.investigationId)) {
      const newList = [...selectedTestsList, selectedInvestigation];
      setSelectedTestsList(newList);
      setNewBookingTest(newList.map(t => t.investigationName).join(', '));
      setSelectedInvestigation(null);
      setInvestigationSearch('');
    }
  };

  const handleRemoveTest = (idToRemove) => {
    const newList = selectedTestsList.filter(t => t.investigationId !== idToRemove);
    setSelectedTestsList(newList);
    setNewBookingTest(newList.map(t => t.investigationName).join(', '));
  };

  return (
    <>
      {/* MODAL 1: PAY NOW */}
            {modalType === 'pay' && selectedAppointment && (
              <div className="modal-backdrop-custom" onClick={() => closeModal()}>
                <div className="modal-dialog-custom" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header-custom">
                    <h5>Complete Payment</h5>
                    <button className="modal-close-btn" onClick={() => closeModal()}>
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
                    <button className="btn btn-light" onClick={() => closeModal()}>
                      Cancel
                    </button>
                    <button className="btn btn-primary px-4 fw-bold" onClick={() => handleProcessPayment(selectedAppointment)} disabled={isProcessingPayment}>
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
              <div className="modal-backdrop-custom" onClick={() => closeModal()}>
                <div className="modal-dialog-custom" style={{ maxWidth: '600px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header-custom">
                    <h5>Reschedule Appointment</h5>
                    <button className="modal-close-btn" onClick={() => closeModal()}>
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
                          {selectedAppointment.type === 'opd' ? ` at ${selectedTimeSlot}` : (selectedAppointment.type !== 'lab' && selectedAppointment.type !== 'radiology' ? ` at ${rescheduleTime}` : '')}.
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

                        {selectedAppointment.type === 'opd' ? (
                          <>
                            <div className="mb-3">
                              <label className="form-label fw-bold">Select Session</label>
                              <select
                                className="form-select border text-dark"
                                value={selectedSessionId}
                                onChange={(e) => setSelectedSessionId(e.target.value)}
                              >
                                {opdSessionsList && opdSessionsList.map((session) => (
                                  <option key={session.id} value={session.id}>
                                    {session.sessionName} ({session.fromTime ? session.fromTime.substring(0, 5) : ''} - {session.endTime ? session.endTime.substring(0, 5) : ''})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="mb-3">
                              <label className="form-label fw-bold">Select Time Slot</label>
                              {isTimeSlotsLoading ? (
                                <div className="text-muted small">Loading time slots...</div>
                              ) : availableTimeSlots && availableTimeSlots.length > 0 ? (
                                <div className="row g-2">
                                  {availableTimeSlots.map((slot) => (
                                    <div className="col-4" key={slot}>
                                      <button
                                        type="button"
                                        className={`btn w-100 btn-sm ${selectedTimeSlot === slot ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        onClick={() => setSelectedTimeSlot(slot)}
                                      >
                                        {slot}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-muted small">No time slots available for selected date/session.</div>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                          </>
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
                        <button className="btn btn-primary px-4 fw-bold" onClick={handleApproveRescheduleWrapper} disabled={isRescheduling}>
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
                        <button className="btn btn-light" onClick={() => closeModal()}>
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
              <div className="modal-backdrop-custom" onClick={() => closeModal()}>
                <div className="modal-dialog-custom" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header-custom">
                    <h5 className="text-danger">
                      <i className="fas fa-exclamation-triangle me-2"></i> Cancel Appointment
                    </h5>
                    <button className="modal-close-btn" onClick={() => closeModal()}>
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
                    <button className="btn btn-light" onClick={() => closeModal()}>
                      Keep Appointment
                    </button>
                    <button className="btn btn-danger px-4 fw-bold" onClick={handleConfirmCancelWrapper} disabled={isCancelling}>
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
              <div className="modal-backdrop-custom" onClick={() => closeModal()}>
                <div className="modal-dialog-custom" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header-custom">
                    <h5>Medical Invoice &amp; Receipt</h5>
                    <button className="modal-close-btn" onClick={() => closeModal()}>
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
                    <button className="btn btn-light" onClick={() => closeModal()}>
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
              <div className="modal-backdrop-custom" onClick={() => closeModal()}>
                <div className="modal-dialog-custom" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header-custom">
                    <div className="d-flex align-items-center gap-2">
                      <i className="fas fa-file-medical text-primary fs-5"></i>
                      <h5 className="mb-0">Diagnostic Medical Report</h5>
                    </div>
                    <button className="modal-close-btn" onClick={() => closeModal()}>
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
                    <button className="btn btn-light" onClick={() => closeModal()}>
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
              <div className="modal-backdrop-custom" onClick={() => closeModal()}>
                <div className="modal-dialog-custom" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header-custom">
                    <h5>Appointment Details</h5>
                    <button className="modal-close-btn" onClick={() => closeModal()}>
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
                    <button className="btn btn-primary px-4" onClick={() => closeModal()}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
      
            {/* MODAL 7: BOOK RADIOLOGY TEST (Interactive Modal) */}
            {modalType === 'book-radiology' && (
              <div className="modal-backdrop-custom" onClick={() => closeModal()}>
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
                    <button className="modal-close-btn" onClick={() => closeModal()}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <div className="modal-body-custom" style={{ overflow: 'visible' }}>
                    <div className="mb-3 position-relative" ref={searchRef}>
                      <label className="form-label fw-bold">Search & Select Procedure / Test</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search for test (e.g. X-Ray, USG...)"
                          value={investigationSearch}
                          onChange={(e) => {
                             setInvestigationSearch(e.target.value);
                             setIsSearchOpen(true);
                             setSelectedInvestigation(null);
                          }}
                          onFocus={() => setIsSearchOpen(true)}
                        />
                        <button 
                          className="btn btn-primary" 
                          type="button"
                          onClick={handleAddTest}
                          disabled={!selectedInvestigation}
                        >
                          <i className="fas fa-plus"></i> Add
                        </button>
                      </div>
                      {isSearchOpen && filteredInvestigations.length > 0 && (
                        <ul className="list-group position-absolute w-100 mt-1 shadow-sm" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                          {filteredInvestigations.map((item) => (
                            <li 
                              key={item.investigationId} 
                              className="list-group-item list-group-item-action"
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleSelectInvestigation(item)}
                            >
                              {item.investigationName} - ₹{item.price}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    
                    {selectedTestsList.length > 0 && (
                      <div className="mb-3">
                        <label className="form-label fw-bold small text-muted mb-2">Tests Added:</label>
                        <ul className="list-group">
                          {selectedTestsList.map(test => (
                            <li key={test.investigationId} className="list-group-item d-flex justify-content-between align-items-center py-2">
                              <div>
                                <div className="fw-semibold text-dark">{test.investigationName}</div>
                                <div className="small text-muted">₹{test.price} {test.container ? `• ${test.container}` : ''}</div>
                              </div>
                              <button 
                                className="btn btn-sm btn-outline-danger border-0" 
                                onClick={() => handleRemoveTest(test.investigationId)}
                                title="Remove Test"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
      
                    <div className="mb-3">
                      <label className="form-label fw-bold">Select Hospital / Diagnostic Facility</label>
                      <select
                        className="form-select"
                        value={newBookingHospital}
                        onChange={(e) => setNewBookingHospital(e.target.value)}
                      >
                        <option value="">-- Select Hospital --</option>
                        {hospitalList.map((hosp) => (
                          <option key={hosp.hospitalId} value={hosp.hospitalName}>{hosp.hospitalName}</option>
                        ))}
                      </select>
                    </div>
      
                    <div className="row g-3 mb-3">
                      <div className="col-md-12">
                        <label className="form-label fw-bold">Appointment Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={newBookingDate}
                          onChange={(e) => setNewBookingDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
      
                    <div className="p-3 bg-light rounded-3 mb-3 border">
                      <div className="d-flex justify-content-between mb-1 small">
                        <span className="text-muted">Total Tests:</span>
                        <strong className="text-dark">{selectedTestsList.length}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-1 small">
                        <span className="text-muted">Facility:</span>
                        <span>{newBookingHospital || 'None Selected'}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-1 small">
                        <span className="text-muted">Radiologist Consultation:</span>
                        <span className="text-success fw-semibold">Included (Report included)</span>
                      </div>
                      <div className="d-flex justify-content-between pt-2 border-top fw-bold text-dark">
                        <span>Estimated Total:</span>
                        <span className="text-primary fs-6">
                          ₹{selectedTestsList.reduce((acc, test) => acc + test.price, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
      
                   
                  </div>
                  <div className="modal-footer-custom">
                    <button className="btn btn-light" onClick={() => closeModal()}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-book-radiology"
                      onClick={() => handleConfirmBookTest('radiology', selectedTestsList)}
                      disabled={isBookingTest}
                    >
                      {isBookingTest ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Booking...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check-circle"></i> Confirm &amp; Book Radiology Test
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
      
            {/* MODAL 8: BOOK LAB TEST (Interactive Modal) */}
            {modalType === 'book-lab' && (
              <div className="modal-backdrop-custom" onClick={() => closeModal()}>
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
                    <button className="modal-close-btn" onClick={() => closeModal()}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <div className="modal-body-custom" style={{ overflow: 'visible' }}>
                    <div className="mb-3 position-relative" ref={searchRef}>
                      <label className="form-label fw-bold">Search & Select Test</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search for test (e.g. Sodium, ESR...)"
                          value={investigationSearch}
                          onChange={(e) => {
                             setInvestigationSearch(e.target.value);
                             setIsSearchOpen(true);
                             setSelectedInvestigation(null);
                          }}
                          onFocus={() => setIsSearchOpen(true)}
                        />
                        <button 
                          className="btn btn-primary" 
                          type="button"
                          onClick={handleAddTest}
                          disabled={!selectedInvestigation}
                        >
                          <i className="fas fa-plus"></i> Add
                        </button>
                      </div>
                      {isSearchOpen && filteredInvestigations.length > 0 && (
                        <ul className="list-group position-absolute w-100 mt-1 shadow-sm" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                          {filteredInvestigations.map((item) => (
                            <li 
                              key={item.investigationId} 
                              className="list-group-item list-group-item-action"
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleSelectInvestigation(item)}
                            >
                              {item.investigationName} - ₹{item.price}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    
                    {selectedTestsList.length > 0 && (
                      <div className="mb-3">
                        <label className="form-label fw-bold small text-muted mb-2">Tests Added:</label>
                        <ul className="list-group">
                          {selectedTestsList.map(test => (
                            <li key={test.investigationId} className="list-group-item d-flex justify-content-between align-items-center py-2">
                              <div>
                                <div className="fw-semibold text-dark">{test.investigationName}</div>
                                <div className="small text-muted">₹{test.price} • {test.container}</div>
                              </div>
                              <button 
                                className="btn btn-sm btn-outline-danger border-0" 
                                onClick={() => handleRemoveTest(test.investigationId)}
                                title="Remove Test"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
      
                    <div className="mb-3">
                      <label className="form-label fw-bold">Select Hospital / Diagnostic Lab</label>
                      <select
                        className="form-select"
                        value={newBookingHospital}
                        onChange={(e) => setNewBookingHospital(e.target.value)}
                      >
                        <option value="">-- Select Hospital --</option>
                        {hospitalList.map((hosp) => (
                          <option key={hosp.hospitalId} value={hosp.hospitalName}>{hosp.hospitalName}</option>
                        ))}
                      </select>
                    </div>
      
                    <div className="row g-3 mb-3">
                      <div className="col-md-12">
                        <label className="form-label fw-bold">Appointment Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={newBookingDate}
                          onChange={(e) => setNewBookingDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
      
                    <div className="p-3 bg-light rounded-3 mb-3 border">
                      <div className="d-flex justify-content-between mb-1 small">
                        <span className="text-muted">Total Tests:</span>
                        <strong className="text-dark">{selectedTestsList.length}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-1 small">
                        <span className="text-muted">Sample Collection:</span>
                        <span className="text-success fw-semibold">Hospital Walk-In / Free Collection</span>
                      </div>
                      <div className="d-flex justify-content-between pt-2 border-top fw-bold text-dark">
                        <span>Estimated Total:</span>
                        <span className="text-success fs-6">
                          ₹{selectedTestsList.reduce((acc, test) => acc + test.price, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
      
                   
                  </div>
                  <div className="modal-footer-custom">
                    <button className="btn btn-light" onClick={() => closeModal()}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-book-lab"
                      onClick={() => handleConfirmBookTest('lab', selectedTestsList)}
                      disabled={isBookingTest}
                    >
                      {isBookingTest ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Booking...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check-circle"></i> Confirm &amp; Book Lab Test
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
    </>
  );
}
