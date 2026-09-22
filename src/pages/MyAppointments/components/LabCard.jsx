import React from 'react';

export default function LabCard({
  labAppointments,
  isLoading,
  loadingPdfId,
  handleOpenBookModal,
  handleOpenInvoice,
  handleOpenReschedule,
  handleOpenCancel,
  handleOpenPayModal,
  handleOpenReport,
  handleOpenDetails
}) {
  return (
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
            onClick={() => handleOpenBookModal('lab')}
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

                  {/* Actions */}
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
}
