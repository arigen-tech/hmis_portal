import React from 'react';

export function FilterBar({ 
  title, 
  subtitle, 
  activeSubTab, 
  setActiveSubTab, 
  upcomingCount,
  showCompleted = true
}) {
  return (
    <div className="appointments-header-row mb-3">
      <div>
        <h1 className="appointments-page-title">{title}</h1>
        {subtitle && <p className="text-muted small mb-0">{subtitle}</p>}
      </div>
      <div className="appointment-subtabs">
        <button
          className={`subtab-btn ${activeSubTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('upcoming')}
          type="button"
        >
          <i className="fas fa-calendar-alt"></i>
          Pending {upcomingCount !== undefined ? `(${upcomingCount})` : ''}
        </button>

        {showCompleted && (
          <button
            className={`subtab-btn ${activeSubTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('completed')}
            type="button"
          >
            <i className="fas fa-check-circle"></i>
            Completed
          </button>
        )}

        <button
          className={`subtab-btn ${activeSubTab === 'cancelled' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('cancelled')}
          type="button"
        >
          <i className="fas fa-ban"></i>
          Cancelled
        </button>
      </div>
    </div>
  );
}
