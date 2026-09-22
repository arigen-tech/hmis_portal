import React from 'react';

export function DiagnosticsTabs({
  labCount,
  radiologyCount,
  setActiveMenu,
  setDiagnosticTab,
  handleOpenBookModal
}) {
  return (
    <div className="appointments-header-row mb-4">
      <div>
        <h1 className="appointments-page-title">Diagnostic Appointments (Lab &amp; Radiology)</h1>
        <p className="text-muted small mb-0">
          Complete overview of all laboratory pathology and radiology imaging investigations.
        </p>
      </div>
      <div className="d-flex align-items-center gap-3 flex-wrap">
        <div className="appointment-subtabs">
          <button
            className="subtab-btn active"
            type="button"
          >
            <i className="fas fa-layer-group"></i> View Both Stacked ({labCount + radiologyCount})
          </button>
          <button
            className="subtab-btn"
            onClick={() => {
              setActiveMenu('radiology');
              setDiagnosticTab('radiology');
            }}
            type="button"
          >
            <i className="fas fa-x-ray"></i> Radiology Only ({radiologyCount})
          </button>
          <button
            className="subtab-btn"
            onClick={() => {
              setActiveMenu('lab');
              setDiagnosticTab('lab');
            }}
            type="button"
          >
            <i className="fas fa-flask"></i> Lab Only ({labCount})
          </button>
        </div>
        <button
          type="button"
          className="btn-book-radiology"
          onClick={() => handleOpenBookModal('radiology')}
        >
          <i className="fas fa-x-ray"></i> Book Radiology Test
        </button>
        <button
          type="button"
          className="btn-book-lab"
          onClick={() => handleOpenBookModal('lab')}
        >
          <i className="fas fa-flask"></i> Book Lab Test
        </button>
      </div>
    </div>
  );
}
