import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { apiService } from '../services/apiService';
import { ENDPOINTS } from '../constants/apiEndpoints';

export default function Dashboard() {
  const [filter, setFilter] = useState('all');
  const [activePatient, setActivePatient] = useState(null);

  const [appointments, setAppointments] = useState([]);
  const [counts, setCounts] = useState({
    totalAppointments: 0,
    upcoming: 0,
    prescriptions: 0,
    medicalRecords: 15
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem('patientDetails');
    const hospitalData = localStorage.getItem('selectedHospital');
    let parsedPatient = null;
    let parsedHospital = null;
    
    if (data) {
      try {
        parsedPatient = JSON.parse(data);
        setActivePatient(parsedPatient);
      } catch (e) {
        console.error("Failed to parse patient data", e);
      }
    }
    
    if (hospitalData) {
      try {
        parsedHospital = JSON.parse(hospitalData);
      } catch (e) {}
    }

    const fetchAppointments = async () => {
      if (!parsedPatient || !parsedHospital) return;
      
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams({
          hospitalId: parsedHospital.id,
          patientId: parsedPatient.patientId,
          deptTypeCode: 'OPD,LAB,RAD',
          includeAllHistory: 'false'
        }).toString();
        
        try {
          const countParams = new URLSearchParams({
            hospitalId: parsedHospital.id,
            patientId: parsedPatient.patientId
          }).toString();
          
          const countsResponse = await apiService.get(`${ENDPOINTS.APPOINTMENTS.VISIT_STATUS_COUNTS}?${countParams}`);
          
          if (countsResponse.status === 200 && countsResponse.response) {
            setCounts(prev => ({
              ...prev,
              totalAppointments: countsResponse.response.totalCompleteCount || 0,
              upcoming: countsResponse.response.totalPendingCount || 0,
              prescriptions: countsResponse.response.prescriptionCount || 0
            }));
          }
        } catch (error) {
          console.error("Failed to fetch counts:", error);
        }
        
        const response = await apiService.get(`${ENDPOINTS.APPOINTMENTS.HISTORY_LIST}?${queryParams}`);
        
        if (response.status === 200 && response.response) {
          const mapped = response.response.map(app => {
            let when = app.appointmentDate || 'N/A';
            let time = app.appointmentStartTime || (app.appointmentDate && app.appointmentDate.includes(' ') ? app.appointmentDate.split(' ')[1] : 'N/A');
            if (when && when.includes(' ')) {
              when = when.split(' ')[0];
            }
            
            let status = 'pending';
            if (app.visitStatus === 'y') status = 'completed';
            else if (app.visitStatus === 'c') status = 'cancelled';
            else if (app.visitStatus === 'n') {
              status = app.visitPaymentStatus === 'y' ? 'confirmed' : 'pending';
            }
            
            return {
              id: app.visitId,
              when: when,
              time: time,
              doctor: app.doctorName || 'Not Assigned',
              specialty: app.departmentName,
              location: parsedHospital.hospitalName,
              room: 'Room Not Assigned',
              status: status
            };
          });
          setAppointments(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const filteredAppointments = appointments.filter((app) => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return app.status === 'confirmed' || app.status === 'pending';
    return app.status === filter;
  });

  return (
    <div className="dashboard-page">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="container-custom">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="mb-3">Welcome back, {activePatient?.patientName || 'User'}!</h1>
              <p className="mb-0" style={{ opacity: 0.9 }}>
                Here's your health dashboard and upcoming appointments
              </p>
            </div>
            <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
              <Link to="/book-appointment" className="btn btn-ari-primary">
                <i className="fas fa-calendar-plus me-2"></i> Book New Appointment
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container-custom">
        {/* Stats Cards */}
        <div className="row g-4 mb-5">
          <div className="col-xl-3 col-md-6">
            <div className="stats-card">
              <div className="stats-icon icon-primary">
                <i className="fas fa-calendar-check"></i>
              </div>
              <h3 className="mt-3">{counts.totalAppointments}</h3>
              <p className="text-muted mb-0">Total Appointments</p>
            </div>
          </div>

          <div className="col-xl-3 col-md-6">
            <div className="stats-card">
              <div className="stats-icon icon-success">
                <i className="fas fa-clock"></i>
              </div>
              <h3 className="mt-3">{counts.upcoming}</h3>
              <p className="text-muted mb-0">Upcoming</p>
            </div>
          </div>

          <div className="col-xl-3 col-md-6">
            <div className="stats-card">
              <div className="stats-icon icon-warning">
                <i className="fas fa-prescription"></i>
              </div>
              <h3 className="mt-3">{counts.prescriptions}</h3>
              <p className="text-muted mb-0">Prescriptions</p>
            </div>
          </div>

          <div className="col-xl-3 col-md-6">
            <div className="stats-card">
              <div className="stats-icon icon-danger">
                <i className="fas fa-file-medical"></i>
              </div>
              <h3 className="mt-3">{counts.medicalRecords}</h3>
              <p className="text-muted mb-0">Medical Records</p>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments & Sidebar */}
        <div className="row mb-5" id="appointments">
          <div className="col-lg-8">
            <div className="card-ari mb-4">
              <div className="card-ari-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                <h5 className="mb-0">
                  <i className="fas fa-calendar-alt me-2"></i> Upcoming Appointments
                </h5>
                <div className="btn-group btn-group-sm">
                  <button 
                    type="button" 
                    className={`btn btn-light ${filter === 'all' ? 'active fw-bold' : ''}`}
                    onClick={() => setFilter('all')}
                  >
                    All
                  </button>
                  <button 
                    type="button" 
                    className={`btn btn-light ${filter === 'confirmed' ? 'active fw-bold' : ''}`}
                    onClick={() => setFilter('confirmed')}
                  >
                    Confirmed
                  </button>
                  <button 
                    type="button" 
                    className={`btn btn-light ${filter === 'pending' ? 'active fw-bold' : ''}`}
                    onClick={() => setFilter('pending')}
                  >
                    Pending
                  </button>
                </div>
              </div>
              <div className="card-ari-body">
                {isLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  <p className="text-muted text-center py-4 mb-0">No appointments found matching this filter.</p>
                ) : (
                  filteredAppointments.map((app) => (
                    <div className="appointment-card" key={app.id}>
                      <div className="row align-items-center">
                        <div className="col-md-2 mb-3 mb-md-0">
                          <div className="text-center">
                            <h6 className="mb-1 fw-bold">{app.when}</h6>
                            <small className="text-muted">{app.time}</small>
                          </div>
                        </div>
                        <div className="col-md-3 mb-3 mb-md-0">
                          <h6 className="mb-1 fw-bold">{app.doctor || app.specialty}</h6>
                          <small className="doctor-specialty">{app.doctor ? app.specialty : 'Diagnostic'}</small>
                        </div>
                        <div className="col-md-3 mb-3 mb-md-0">
                          <p className="mb-1 fw-medium">{app.location}</p>
                          <small className="text-muted">{app.room}</small>
                        </div>
                        <div className="col-md-2 mb-3 mb-md-0">
                          <span className={`status-badge status-${app.status}`}>
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                        </div>
                        <div className="col-md-2 text-md-end">
                          <button 
                            type="button"
                            className="btn btn-ari-outline btn-sm"
                            onClick={() => alert(`Details for appointment with ${app.doctor}`)}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Health Tips */}
          <div className="col-lg-4">
            <div className="card-ari mb-4">
              <div className="card-ari-header">
                <h5 className="mb-0">
                  <i className="fas fa-bolt me-2"></i> Quick Actions
                </h5>
              </div>
              <div className="card-ari-body">
                <div className="d-grid gap-3">
                  <a href="#doctors" className="btn btn-ari-primary">
                    <i className="fas fa-search me-2"></i> Find Doctor
                  </a>
                  <Link to="/appointments" className="btn btn-ari-outline">
                    <i className="fas fa-history me-2"></i> View All Appointments
                  </Link>
                  <Link to="/appointments?tab=radiology" className="btn btn-ari-outline" style={{ borderColor: '#7C3AED', color: '#7C3AED' }}>
                    <i className="fas fa-x-ray me-2"></i> Radiology Appointments &amp; Tests
                  </Link>
                  <Link to="/appointments?tab=lab" className="btn btn-ari-outline" style={{ borderColor: '#059669', color: '#059669' }}>
                    <i className="fas fa-flask me-2"></i> Lab Appointments &amp; Tests
                  </Link>
                  <Link to="/health-records" className="btn btn-ari-outline">
                    <i className="fas fa-prescription me-2"></i> Digital Prescriptions
                  </Link>
                  <Link to="/health-records" className="btn btn-ari-outline">
                    <i className="fas fa-file-medical me-2"></i> Medical Records
                  </Link>
                  <a href="#emergency" className="btn btn-ari-outline">
                    <i className="fas fa-ambulance me-2"></i> Emergency Services
                  </a>
                </div>
              </div>
            </div>

            {/* Health Tips */}
            <div className="card-ari">
              <div className="card-ari-header">
                <h5 className="mb-0">
                  <i className="fas fa-heartbeat me-2"></i> Health Tips
                </h5>
              </div>
              <div className="card-ari-body">
                <div className="d-flex align-items-start mb-3">
                  <div className="me-3 text-primary fs-4">
                    <i className="fas fa-glass-water"></i>
                  </div>
                  <div>
                    <h6 className="mb-1 fw-bold">Stay Hydrated</h6>
                    <p className="text-muted small mb-0">Drink at least 8 glasses of water daily.</p>
                  </div>
                </div>
                <div className="d-flex align-items-start mb-3">
                  <div className="me-3 text-success fs-4">
                    <i className="fas fa-walking"></i>
                  </div>
                  <div>
                    <h6 className="mb-1 fw-bold">Daily Exercise</h6>
                    <p className="text-muted small mb-0">30 minutes of moderate activity daily.</p>
                  </div>
                </div>
                <div className="d-flex align-items-start">
                  <div className="me-3 text-warning fs-4">
                    <i className="fas fa-bed"></i>
                  </div>
                  <div>
                    <h6 className="mb-1 fw-bold">Quality Sleep</h6>
                    <p className="text-muted small mb-0">Aim for 7-8 hours of sleep each night.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
