import React from 'react';

export function UpcomingOpdCard({
  upcomingAppointments,
  isLoading,
  loadingPdfId,
  handleOpenPayModal,
  handleOpenInvoice,
  handleOpenReschedule,
  handleOpenCancel
}) {
  return (
    <div className="appointments-section-card">
      <div className="section-card-header">
        <div className="section-header-info">
          <div className="section-icon-badge">
            <i className="far fa-clock"></i>
          </div>
          <div>
            <h3 className="section-title">Pending Appointments ({upcomingAppointments.length})</h3>
            <p className="section-subtitle">Manage your upcoming OPD appointments.</p>
          </div>
        </div>
      </div>

      <div className="ari-table-responsive">
        <table className="ari-appointments-table">
          <thead>
            <tr>
              <th>Date &amp; Time</th>
              <th>Doctor</th>
              <th>Specialty</th>
              <th>Hospital / Location</th>
              <th>Payment Status</th>
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
            ) : upcomingAppointments.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-5 text-muted">
                  No upcoming appointments found.
                </td>
              </tr>
            ) : (
              upcomingAppointments.map((app) => (
                <tr key={app.id}>
                  <td>
                    <div className="table-date-cell">
                      <span className="table-date-main">{app.date}</span>
                      <span className="table-date-sub">{app.dayTime}</span>
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
                    <div className="table-payment-cell">
                      {app.paymentStatus === 'Paid' ? (
                        <span className="payment-badge payment-badge-paid">Paid</span>
                      ) : (
                        <span className="payment-badge payment-badge-pending">Pending</span>
                      )}
                      <span className="payment-amount">₹{app.amount}</span>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons-group">
                      {app.paymentStatus === 'Pending' ? (
                        <button
                          type="button"
                          className="btn-action-pay"
                          onClick={() => handleOpenPayModal(app)}
                        >
                          Pay Now
                        </button>
                      ) : (
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
                      )}
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
