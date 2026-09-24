import React from 'react';

export function PastOpdCard({
  pastAppointments,
  activeSubTab,
  historyFilter,
  setHistoryFilter,
  isLoading,
  loadingPdfId,
  handleOpenOpdSlip,
  handleOpenPrescriptionSlip,
  handleOpenInvoice,
  handleOpenDetails
}) {
  return (
    <div className="appointments-section-card">
      <div className="section-card-header">
        <div className="section-header-info">
          <div className="section-icon-badge">
            <i className="fas fa-history"></i>
          </div>
          <div>
            <h3 className="section-title">
              {activeSubTab === 'cancelled' ? 'Cancelled' : 'Completed'} Appointments ({pastAppointments.length})
            </h3>
            <p className="section-subtitle">
              View your {activeSubTab} OPD appointments.
            </p>
          </div>
        </div>

        {/* History Filter */}
        {activeSubTab !== 'completed' && (
          <div>
            <select
              className="status-filter-select"
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
            >
              <option value="all_history">All History</option>
              <option value="present">Present</option>
            </select>
          </div>
        )}
      </div>

      <div className="ari-table-responsive">
        <table className="ari-appointments-table">
          <thead>
            <tr>
              <th>Date &amp; Time</th>
              <th>Doctor</th>
              <th>Specialty</th>
              <th>Hospital / Location</th>
              <th>Token No.</th>
              <th>Payment Status</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : pastAppointments.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-5 text-muted">
                  No {activeSubTab} appointments found.
                </td>
              </tr>
            ) : (
              pastAppointments.map((app) => (
                <tr key={app.id}>
                  <td>
                    <div className="table-date-cell">
                      <span className="table-date-main">{app.date}</span>
                      <span className="table-date-sub">{app.dayTime}</span>
                      {app.status === 'Cancelled' && app.cancellationDateTime && (
                        <div className="text-danger mt-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                          Cancelled: {new Date(app.cancellationDateTime).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', hour12: true
                          })}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="table-doctor-name">{app.doctor}</div>
                  </td>
                  <td>
                    <span className="table-specialty-badge">{app.specialty}</span>
                  </td>
                  <td>
                    <div className="table-location-cell">
                      <span className="table-hospital-name">{app.hospital}</span>
                      <span className="table-room-no">{app.room}</span>
                    </div>
                  </td>
                  <td>
                    {app.tokenNo && app.tokenNo !== '-' ? (
                      <span className="table-token-pill">{app.tokenNo}</span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    <div className="table-payment-cell">
                      {app.paymentStatus === 'Paid' ? (
                        <span className="payment-badge payment-badge-paid">Paid</span>
                      ) : app.paymentStatus === 'Pending' ? (
                        <span className="payment-badge payment-badge-pending">Pending</span>
                      ) : app.paymentStatus === 'Not paid' ? (
                        <span className="payment-badge bg-secondary text-white border-0">Not paid</span>
                      ) : app.paymentStatus === 'Cash collect' ? (
                        <span className="payment-badge bg-primary text-white border-0">Cash collect</span>
                      ) : app.paymentStatus === 'PROCESSED' ? (
                        <span className="payment-badge bg-info text-white border-0">Processed</span>
                      ) : app.paymentStatus === 'REFUNDED' ? (
                        <span className="payment-badge bg-success text-white border-0">Refunded</span>
                      ) : app.paymentStatus === 'PENDING' ? (
                        <span className="payment-badge bg-warning text-dark border-0">Refund Pending</span>
                      ) : (
                        <span className="payment-badge bg-light text-dark border-0">{app.paymentStatus}</span>
                      )}
                      <span className="payment-amount">₹{app.amount.toLocaleString ? app.amount.toLocaleString() : app.amount}</span>
                    </div>
                  </td>
                  <td>
                    {app.status === 'completed' ? (
                      <span className="status-pill status-pill-completed">Completed</span>
                    ) : (
                      <span className="status-pill status-pill-cancelled">Cancelled</span>
                    )}
                  </td>
                  <td>
                    {app.status === 'completed' ? (
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn-action-outline"
                          onClick={() => handleOpenOpdSlip(app)}
                          disabled={loadingPdfId === `${app.id}_opd`}
                        >
                          {loadingPdfId === `${app.id}_opd` ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          ) : (
                            'OPD Slip'
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn-action-outline"
                          onClick={() => app.prescriptionHdId ? handleOpenPrescriptionSlip(app) : handleOpenInvoice(app)}
                          disabled={loadingPdfId === `${app.id}_prescription` || loadingPdfId === `${app.id}_invoice`}
                        >
                          {(loadingPdfId === `${app.id}_prescription` || loadingPdfId === `${app.id}_invoice`) ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          ) : (
                            app.prescriptionHdId ? 'Prescription Slip' : 'View Invoice'
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn-action-outline"
                        onClick={() => handleOpenDetails(app)}
                      >
                        View Details
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="section-card-footer">
        <div className="pagination-info">
          Showing 1 to {pastAppointments.length} of {pastAppointments.length} appointments
        </div>
        <div className="pagination-controls">
          <button type="button" className="pagination-btn" disabled>
            <i className="fas fa-chevron-left"></i>
          </button>
          <button type="button" className="pagination-btn active">
            1
          </button>
          <button type="button" className="pagination-btn" disabled>
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
