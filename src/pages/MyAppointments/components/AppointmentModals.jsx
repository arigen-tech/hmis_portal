import React from 'react';

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
  handleConfirmBookTest
}) {
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
                    <button className="btn btn-light" onClick={() => closeModal()}>
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
                    <button className="btn btn-light" onClick={() => closeModal()}>
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
    </>
  );
}
