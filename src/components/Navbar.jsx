import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { ENDPOINTS } from '../constants/apiEndpoints';

export default function Navbar() {
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showSwitchSubmenu, setShowSwitchSubmenu] = useState(false);
  const [showHospitalMenu, setShowHospitalMenu] = useState(false);
  const [patients, setPatients] = useState([]);
  const [activePatientId, setActivePatientId] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [activeHospital, setActiveHospital] = useState(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRelation, setNewMemberRelation] = useState('Spouse');
  const [newMemberDob, setNewMemberDob] = useState('');
  const [newMemberGender, setNewMemberGender] = useState('Female');
  const [toastMessage, setToastMessage] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const activeData = localStorage.getItem('patientDetails');
    const listData = localStorage.getItem('patientList');
    
    if (activeData) {
      try {
        const parsedActive = JSON.parse(activeData);
        setPatientData(parsedActive);
        setActivePatientId(parsedActive.patientId || 1);
        
        if (listData) {
          const parsedList = JSON.parse(listData);
          const mappedPatients = parsedList.map(p => ({
            id: p.patientId,
            name: p.patientName,
            relation: p.relation,
            gender: p.gender || 'N/A',
            age: p.age || 'N/A',
            dob: 'N/A',
            patientId: p.patientId,
            originalData: p
          }));
          setPatients(mappedPatients);
        } else {
          setPatients([{
            id: parsedActive.patientId || 1,
            name: parsedActive.patientName || 'User',
            relation: parsedActive.relation || 'Self',
            gender: parsedActive.gender || 'N/A',
            age: parsedActive.age || 'N/A',
            dob: 'N/A',
            patientId: parsedActive.patientId || 'N/A',
            originalData: parsedActive
          }]);
        }
      } catch (e) {
        console.error("Failed to parse patient data", e);
      }
    }

    const fetchHospitals = async () => {
      try {
        const data = await apiService.get(ENDPOINTS.MASTER.GET_ALL_HOSPITALS);
        if (data.status === 200 && data.response) {
          setHospitals(data.response);
          
          const storedHospital = localStorage.getItem('selectedHospital');
          if (storedHospital) {
            setActiveHospital(JSON.parse(storedHospital));
          } else if (data.response.length > 0) {
            setActiveHospital(data.response[0]);
            localStorage.setItem('selectedHospital', JSON.stringify(data.response[0]));
          }
        }
      } catch (error) {
        console.error("Failed to fetch hospitals:", error);
      }
    };

    if (localStorage.getItem('token')) {
      fetchHospitals();
    }
  }, []);

  const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed);

  const handleLogout = (e) => {
    e.preventDefault();
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      navigate('/login');
    }
  };

  const handleAddFamilyMember = (e) => {
    e.preventDefault();
    // To be implemented later
    alert('Add Family Member functionality coming soon!');
    setShowProfileMenu(false);
  };

  const handleSelectHospital = (hospital) => {
    setActiveHospital(hospital);
    localStorage.setItem('selectedHospital', JSON.stringify(hospital));
    setShowHospitalMenu(false);
    showToast(`Switched to ${hospital.hospitalName}`);
    
    window.dispatchEvent(new Event('hospitalSwitched'));
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleSelectPatient = async (patient) => {
    try {
      const activeData = localStorage.getItem('patientDetails');
      let mobileNumber = '';
      if (activeData) {
        const parsed = JSON.parse(activeData);
        mobileNumber = parsed.patientPhoneNumber || parsed.mobileNo || '';
      }

      const response = await apiService.post(`${ENDPOINTS.AUTH.SWITCH_PATIENT}?patientId=${patient.id}&mobileNumber=${mobileNumber}`, '');

      if (response.status === 200 && response.response) {
        const data = response.response;
        if (data.token) localStorage.setItem('token', data.token);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);

        let newPatientDetails = patient.originalData;
        if (data.patientIdResponseList && data.patientIdResponseList.length > 0) {
          newPatientDetails = data.patientIdResponseList[0];
        }

        setActivePatientId(patient.id);
        setPatientData(newPatientDetails);
        localStorage.setItem('patientDetails', JSON.stringify(newPatientDetails));
        
        window.dispatchEvent(new Event('patientSwitched'));
        showToast(`Switched to ${newPatientDetails.patientName || patient.name}`);
        setShowProfileMenu(false);

        setTimeout(() => {
          window.location.reload();
        }, 600);
      } else {
        showToast(response.message || 'Failed to switch patient');
      }
    } catch (error) {
      console.error("Failed to switch patient:", error);
      showToast('Error switching patient');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const getUserInitials = () => getInitials(patientData?.patientName);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Derive active patient from state
  const activePatient = patients.find(p => p.id === activePatientId) || {
    name: patientData?.patientName || 'User',
    relation: patientData?.relation || 'Self',
    gender: patientData?.gender || 'N/A',
    age: patientData?.age || 'N/A',
    patientId: patientData?.patientId || 'N/A',
    abhaId: 'ABHA-XXXX-XXXX-XXXX',
    address: 'Not provided'
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-ari bg-white border-bottom shadow-sm sticky-top">
        <div className="container-fluid px-3 px-lg-5">
          {/* Left side: Logo & Brand */}
          <Link className="navbar-brand d-flex align-items-center gap-2" to="/dashboard">
            <img 
              src="https://i.postimg.cc/K8xgWmqf/logo-hal.png" 
              alt="ARI-Health Logo" 
              style={{ height: '52px', width: 'auto' }}
            />
           
          </Link>
          
          {/* Center: Navigation Menu Toggle Button for Mobile */}
          <button 
            className="navbar-toggler border-0 shadow-none" 
            type="button" 
            onClick={handleNavCollapse}
            aria-expanded={!isNavCollapsed} 
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Navigation Links */}
          <div className={`${isNavCollapsed ? 'collapse' : ''} navbar-collapse`} id="navbarNav">
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <NavLink 
                  className={({ isActive }) => `nav-link px-2 py-2 fw-semibold ${isActive ? 'text-primary fw-bold active' : 'text-secondary'}`} 
                  to="/dashboard"
                  end
                >
                  Home
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink 
                  className={({ isActive }) => `nav-link px-2 py-2 fw-semibold ${isActive ? 'nav-link-pill-active' : 'text-secondary'}`} 
                  to="/book-appointment"
                >
                  Book Appointment
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink 
                  className={({ isActive }) => `nav-link px-2 py-2 fw-semibold ${isActive ? 'text-primary fw-bold active' : 'text-secondary'}`} 
                  to="/appointments?tab=radiology"
                >
                  <i className="fas fa-x-ray me-1" style={{ color: '#7C3AED' }}></i>
                  Book Radiology &amp; Lab
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink 
                  className={({ isActive }) => `nav-link px-2 py-2 fw-semibold ${isActive ? 'text-primary fw-bold active' : 'text-secondary'}`} 
                  to="/appointments"
                  style={({ isActive }) => isActive ? { borderBottom: '3px solid #1E60F4', color: '#1E60F4' } : {}}
                >
                  My Appointments
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink 
                  className={({ isActive }) => `nav-link px-2 py-2 fw-semibold ${isActive ? 'text-primary fw-bold active' : 'text-secondary'}`} 
                  to="/health-records"
                  style={({ isActive }) => isActive ? { backgroundColor: '#EBF3FF', borderRadius: '8px 8px 0 0', borderBottom: '3px solid #1E60F4', color: '#1E60F4' } : {}}
                >
                  Health Records
                </NavLink>
              </li>
            </ul>
            
            {/* Right side: Notifications & User Profile */}
            <div className="d-flex align-items-center gap-3">
              {/* Hospital Dropdown */}
              <div className="position-relative">
                <div 
                  className="d-flex align-items-center gap-2 p-1 pe-2 rounded-pill cursor-pointer border"
                  style={{ background: '#f8f9fa', cursor: 'pointer', transition: 'var(--transition)' }}
                  onClick={() => {
                    setShowHospitalMenu(!showHospitalMenu);
                    setShowProfileMenu(false);
                    setShowNotificationMenu(false);
                  }}
                  title="Select Hospital"
                >
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center text-white"
                    style={{ width: '36px', height: '36px', background: '#1E60F4', fontSize: '0.9rem' }}
                  >
                    <i className="far fa-hospital"></i>
                  </div>
                  <div className="d-none d-md-flex flex-column justify-content-center" style={{ lineHeight: '1.2' }}>
                    <span className="fw-semibold text-dark text-truncate" style={{ fontSize: '0.85rem', maxWidth: '120px' }}>
                      {activeHospital ? activeHospital.hospitalName : 'Select Location'}
                    </span>
                    <span className="text-muted" style={{ fontSize: '0.65rem' }}>Hospital</span>
                  </div>
                  <i className="fas fa-chevron-down text-muted d-none d-md-block ms-1" style={{ fontSize: '0.7rem' }}></i>
                </div>

                {showHospitalMenu && (
                  <div 
                    className="dropdown-menu dropdown-menu-end show position-absolute mt-2 shadow-lg border-0 rounded-3" 
                    style={{ right: 0, top: '100%', width: '280px', zIndex: 1050 }}
                  >
                    <div className="p-3 bg-light border-bottom">
                      <span className="fw-bold text-dark small text-uppercase">Select Location</span>
                    </div>
                    <div className="list-group list-group-flush" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {hospitals.map((hospital) => (
                        <button
                          key={hospital.id}
                          type="button"
                          className="list-group-item list-group-item-action p-3 d-flex align-items-center justify-content-between"
                          style={{ backgroundColor: activeHospital?.id === hospital.id ? '#f0f5ff' : 'transparent' }}
                          onClick={() => handleSelectHospital(hospital)}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div 
                              className="rounded-circle d-flex align-items-center justify-content-center text-white" 
                              style={{ width: '32px', height: '32px', background: activeHospital?.id === hospital.id ? '#1E60F4' : '#6c757d' }}
                            >
                              <i className="fas fa-building"></i>
                            </div>
                            <div>
                              <div className="fw-bold small text-dark">{hospital.hospitalName}</div>
                            </div>
                          </div>
                          {activeHospital?.id === hospital.id && (
                            <i className="fas fa-check-circle text-primary"></i>
                          )}
                        </button>
                      ))}
                      {hospitals.length === 0 && (
                        <div className="p-3 text-center text-muted small">No hospitals available</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Bell */}
              <div className="position-relative">
                <button 
                  type="button" 
                  className="btn btn-light rounded-circle p-2 position-relative d-flex align-items-center justify-content-center"
                  style={{ width: '40px', height: '40px', background: 'var(--light-color)', border: '1px solid var(--border-color)' }}
                  onClick={() => {
                    setShowNotificationMenu(!showNotificationMenu);
                    setShowProfileMenu(false);
                    setShowHospitalMenu(false);
                  }}
                  title="Notifications"
                >
                  <i className="fas fa-bell text-secondary fs-6"></i>
                  <span 
                    className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"
                    style={{ transform: 'translate(-30%, 30%) !important' }}
                  >
                    <span className="visually-hidden">New alerts</span>
                  </span>
                </button>

                {/* Notification Dropdown */}
                {showNotificationMenu && (
                  <div 
                    className="dropdown-menu dropdown-menu-end show position-absolute mt-2 shadow-lg border-0 rounded-3 p-0" 
                    style={{ right: 0, top: '100%', width: '320px', zIndex: 1050, overflow: 'hidden' }}
                  >
                    <div className="p-3 bg-primary text-white d-flex justify-content-between align-items-center">
                      <span className="fw-bold">Notifications</span>
                      <span className="badge bg-white text-primary">2 New</span>
                    </div>
                    <div className="list-group list-group-flush" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      <div className="list-group-item p-3 list-group-item-action">
                        <div className="d-flex w-100 justify-content-between mb-1">
                          <strong className="text-dark small">Upcoming Consultation</strong>
                          <small className="text-muted">In 9 days</small>
                        </div>
                        <p className="mb-1 small text-muted">Dr. Priya Sharma at ARI Hospital, Delhi (11:30 AM)</p>
                      </div>
                      <div className="list-group-item p-3 list-group-item-action">
                        <div className="d-flex w-100 justify-content-between mb-1">
                          <strong className="text-dark small">Lab Test Ready</strong>
                          <small className="text-muted">Yesterday</small>
                        </div>
                        <p className="mb-1 small text-muted">Lipid Profile test results are available to download.</p>
                      </div>
                    </div>
                    <div className="p-2 text-center bg-light border-top">
                      <Link to="/appointments" className="small text-primary fw-bold text-decoration-none" onClick={() => setShowNotificationMenu(false)}>
                        View All in Appointments
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="position-relative">
                <div 
                  className="d-flex align-items-center gap-2 p-1 pe-2 rounded-pill cursor-pointer border"
                  style={{ background: '#FFFFFF', cursor: 'pointer', transition: 'var(--transition)' }}
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotificationMenu(false);
                    setShowSwitchSubmenu(false);
                    setShowHospitalMenu(false);
                  }}
                  title="Account Menu"
                >
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                    style={{ width: '36px', height: '36px', background: 'var(--primary-gradient)', fontSize: '0.88rem' }}
                  >
                    {getInitials(activePatient.name)}
                  </div>
                  <div className="d-none d-md-flex align-items-center gap-1">
                    <span className="fw-semibold text-dark small">{activePatient.name}</span>
                    <i className="fas fa-chevron-down text-muted" style={{ fontSize: '0.7rem' }}></i>
                  </div>
                </div>

                {/* Enhanced Profile Dropdown */}
                {showProfileMenu && (
                  <div 
                    className="dropdown-menu dropdown-menu-end show position-absolute mt-2 shadow-lg border-0 patient-dropdown-menu" 
                    style={{ right: 0, top: '100%', zIndex: 1050 }}
                  >
                    {/* Active Patient Card Header */}
                    <div className="patient-dropdown-header">
                      <div className="patient-header-avatar">
                        {getInitials(activePatient.name)}
                      </div>
                      <div className="patient-header-info">
                        <div className="patient-header-name">{activePatient.name}</div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="patient-header-badge">{activePatient.relation}</span>
                          <small className="text-muted" style={{ fontSize: '0.72rem' }}>{activePatient.patientId}</small>
                        </div>
                      </div>
                    </div>

                    {/* MENU ITEM 1: SWITCH PATIENT (With Arrow Functionality) */}
                    <div>
                      <button
                        type="button"
                        className="patient-menu-item"
                        onClick={() => setShowSwitchSubmenu(!showSwitchSubmenu)}
                      >
                        <span className="patient-menu-item-icon">
                          <i className="fas fa-user-friends"></i>
                        </span>
                        <span>Switch Patient</span>
                        <i className={`fas fa-chevron-right menu-arrow-icon ${showSwitchSubmenu ? 'open' : ''}`}></i>
                      </button>

                      {/* Collapsible Switch Submenu */}
                      {showSwitchSubmenu && (
                        <div className="switch-patient-submenu">
                          {patients.map((pt) => (
                            <div
                              key={pt.id}
                              className={`switch-patient-row ${pt.id === activePatientId ? 'active' : ''}`}
                              onClick={() => handleSelectPatient(pt)}
                            >
                              <div className="switch-patient-info">
                                <div className="switch-avatar-mini">
                                  {getInitials(pt.name)}
                                </div>
                                <div>
                                  <div className="switch-name-text">
                                    {pt.name} <small className="text-muted">({pt.relation})</small>
                                  </div>
                                  <div className="switch-sub-text">{pt.gender}, {pt.age} yrs • {pt.patientId}</div>
                                </div>
                              </div>
                              {pt.id === activePatientId ? (
                                <i className="fas fa-check-circle text-primary fs-6"></i>
                              ) : (
                                <i className="far fa-circle text-muted" style={{ fontSize: '0.85rem' }}></i>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            className="switch-add-btn"
                            onClick={() => {
                              setShowProfileMenu(false);
                              setShowFamilyModal(true);
                            }}
                          >
                            <i className="fas fa-plus-circle"></i> + Add Family Member
                          </button>
                        </div>
                      )}
                    </div>

                    {/* MENU ITEM 2: MY PROFILE */}
                    <button
                      type="button"
                      className="patient-menu-item"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowProfileModal(true);
                      }}
                    >
                      <span className="patient-menu-item-icon">
                        <i className="fas fa-id-card"></i>
                      </span>
                      <span>My Profile</span>
                    </button>

                    {/* MENU ITEM 3: MANAGE FAMILY MEMBERS */}
                    <button
                      type="button"
                      className="patient-menu-item"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowFamilyModal(true);
                      }}
                    >
                      <span className="patient-menu-item-icon">
                        <i className="fas fa-users-cog"></i>
                      </span>
                      <span>Manage Family Members</span>
                    </button>

                    <div className="dropdown-divider my-1"></div>

                    {/* Navigation Items */}
                    <NavLink className="patient-menu-item" to="/dashboard" onClick={() => setShowProfileMenu(false)}>
                      <span className="patient-menu-item-icon">
                        <i className="fas fa-columns"></i>
                      </span>
                      <span>Dashboard</span>
                    </NavLink>

                    <NavLink className="patient-menu-item" to="/appointments" onClick={() => setShowProfileMenu(false)}>
                      <span className="patient-menu-item-icon">
                        <i className="fas fa-calendar-check"></i>
                      </span>
                      <span>My Appointments</span>
                    </NavLink>

                    <NavLink className="patient-menu-item" to="/health-records" onClick={() => setShowProfileMenu(false)}>
                      <span className="patient-menu-item-icon">
                        <i className="fas fa-file-medical"></i>
                      </span>
                      <span>Health Records</span>
                    </NavLink>

                    <div className="dropdown-divider my-1"></div>

                    <button 
                      className="patient-menu-item text-danger" 
                      onClick={handleLogout}
                    >
                      <span className="patient-menu-item-icon text-danger">
                        <i className="fas fa-sign-out-alt"></i>
                      </span>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ========================================================
          MODAL 1: MY PROFILE MODAL
         ======================================================== */}
      {showProfileModal && (
        <div className="modal-backdrop-custom" onClick={() => setShowProfileModal(false)}>
          <div className="modal-dialog-custom" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h5 className="fw-bold">
                <i className="fas fa-id-card text-primary me-2"></i> Patient Profile
              </h5>
              <button className="modal-close-btn" onClick={() => setShowProfileModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body-custom">
              {/* Profile Header Card */}
              <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-4">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-4"
                  style={{ width: '64px', height: '64px', background: 'var(--primary-gradient)' }}
                >
                  {getInitials(activePatient.name)}
                </div>
                <div>
                  <h5 className="mb-0 fw-bold">{activePatient.name}</h5>
                  <div className="text-muted small mb-2">{activePatient.gender}, {activePatient.age} yrs • {activePatient.patientId}</div>
                  
                  <div className="row g-2 mt-2">
                    <div className="col-6">
                      <div className="text-muted small">ABHA Health ID</div>
                      <div className="fw-bold text-primary">{activePatient.abhaId || 'N/A'}</div>
                    </div>
                    <div className="col-12">
                      <div className="text-muted small">Registered Address</div>
                      <div className="fw-medium text-dark">{activePatient.address || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="alert alert-light border mt-4 mb-0 d-flex align-items-center">
                <i className="fas fa-shield-alt text-success fs-4 me-3"></i>
                <div>
                  <strong>ABHA Verified Account</strong>
                  <div className="small text-muted">Your health records are digitally secured under Ayushman Bharat Digital Mission.</div>
                </div>
              </div>
            </div>

            <div className="modal-footer-custom">
              <button className="btn btn-light" onClick={() => setShowProfileModal(false)}>
                Close
              </button>
              <button 
                className="btn btn-primary px-4 fw-bold"
                onClick={() => {
                  showToast('Profile update feature available in account settings.');
                  setShowProfileModal(false);
                }}
              >
                <i className="fas fa-edit me-2"></i> Edit Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: MANAGE FAMILY MEMBERS MODAL
         ======================================================== */}
      {showFamilyModal && (
        <div className="modal-backdrop-custom" onClick={() => setShowFamilyModal(false)}>
          <div className="modal-dialog-custom" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h5 className="fw-bold">
                <i className="fas fa-users text-primary me-2"></i> Manage Family Members
              </h5>
              <button className="modal-close-btn" onClick={() => setShowFamilyModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body-custom">
              <p className="text-muted small mb-3">
                Link and manage medical appointments, prescriptions, and lab records for your family members under a single unified portal.
              </p>

              {/* Members List */}
              <h6 className="fw-bold text-dark mb-2">Linked Members ({patients.length})</h6>
              <div className="mb-4">
                {patients.map((pt) => (
                  <div 
                    key={pt.id} 
                    className={`family-member-card ${pt.id === activePatientId ? 'is-active' : ''}`}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                        style={{ width: '44px', height: '44px', background: pt.id === activePatientId ? 'var(--primary-color)' : '#64748B' }}
                      >
                        {getInitials(pt.name)}
                      </div>
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <strong className="text-dark fs-6">{pt.name}</strong>
                          <span className="badge bg-primary-subtle text-primary">{pt.relation}</span>
                          {pt.id === activePatientId && (
                            <span className="badge bg-success">Active Profile</span>
                          )}
                        </div>
                        <div className="small text-muted">
                          {pt.gender}, {pt.age} yrs • DOB: {pt.dob} • ID: {pt.patientId}
                        </div>
                      </div>
                    </div>

                    <div>
                      {pt.id !== activePatientId ? (
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm fw-bold"
                          onClick={() => {
                            handleSelectPatient(pt);
                            setShowFamilyModal(false);
                          }}
                        >
                          Switch to {pt.relation}
                        </button>
                      ) : (
                        <span className="text-success fw-bold small">
                          <i className="fas fa-check-circle me-1"></i> Current
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Member Form */}
              <div className="card bg-light border-0 p-3 rounded-3">
                <h6 className="fw-bold text-dark mb-3">
                  <i className="fas fa-user-plus text-primary me-2"></i> Add New Family Member
                </h6>
                <form onSubmit={handleAddFamilyMember}>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Full Name</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Ananya Doe"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Relationship</label>
                      <select
                        className="form-select form-select-select form-select-sm"
                        value={newMemberRelation}
                        onChange={(e) => setNewMemberRelation(e.target.value)}
                      >
                        <option value="Spouse">Spouse</option>
                        <option value="Child / Son">Child / Son</option>
                        <option value="Child / Daughter">Child / Daughter</option>
                        <option value="Parent / Father">Parent / Father</option>
                        <option value="Parent / Mother">Parent / Mother</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Date of Birth</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={newMemberDob}
                        onChange={(e) => setNewMemberDob(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Gender</label>
                      <select
                        className="form-select form-select-sm"
                        value={newMemberGender}
                        onChange={(e) => setNewMemberGender(e.target.value)}
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="col-12 mt-3 text-end">
                      <button type="submit" className="btn btn-primary btn-sm px-3 fw-bold">
                        <i className="fas fa-plus me-1"></i> Add Member
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div className="modal-footer-custom">
              <button className="btn btn-light" onClick={() => setShowFamilyModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Toast */}
      {toastMessage && (
        <div className="ari-toast success">
          <i className="fas fa-check-circle"></i>
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
