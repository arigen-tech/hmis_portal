import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BookLabTest() {
  const navigate = useNavigate();

  // Current Active Step: 1 = Select Tests, 2 = Patient & Time, 3 = Payment & Confirmation
  const [currentStep, setCurrentStep] = useState(1);

  // Screen 1: Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All Tests'); // 'All Tests', 'Popular Packages', 'Health Checkups'
  const [activeCategory, setActiveCategory] = useState('All');

  // Master Lab Tests Database (Exact matches from the design mockup + comprehensive categories)
  const masterTests = [
    {
      id: 't-cbc',
      name: 'Complete Blood Count (CBC)',
      price: 350,
      category: 'Routine Tests',
      tab: 'All Tests',
      description: 'Measures RBC, WBC, platelets, and hemoglobin levels.'
    },
    {
      id: 't-lipid',
      name: 'Lipid Profile',
      price: 600,
      category: 'Cardiac Markers',
      tab: 'All Tests',
      description: 'Complete cholesterol assessment including HDL, LDL, and Triglycerides.'
    },
    {
      id: 't-thyroid',
      name: 'Thyroid Profile (T3, T4, TSH)',
      price: 750,
      category: 'Hormones',
      tab: 'All Tests',
      description: 'Comprehensive thyroid function assessment.'
    },
    {
      id: 't-lft',
      name: 'Liver Function Test (LFT)',
      price: 650,
      category: 'Liver Function',
      tab: 'All Tests',
      description: 'Evaluates bilirubin, SGOT, SGPT, and liver enzymes.'
    },
    {
      id: 't-kft',
      name: 'Kidney Function Test (KFT)',
      price: 600,
      category: 'Kidney Function',
      tab: 'All Tests',
      description: 'Checks blood urea nitrogen, creatinine, and electrolytes.'
    },
    {
      id: 't-glucose',
      name: 'Blood Sugar (Fasting)',
      price: 120,
      category: 'Diabetes',
      tab: 'All Tests',
      description: 'Measures fasting plasma blood glucose levels.'
    },
    {
      id: 't-vitd',
      name: 'Vitamin D',
      price: 1200,
      category: 'Vitamins',
      tab: 'All Tests',
      description: 'Measures 25-hydroxy vitamin D level for bone and immune health.'
    },
    {
      id: 't-hba1c',
      name: 'HbA1c',
      price: 450,
      category: 'Diabetes',
      tab: 'All Tests',
      description: 'Evaluates average blood sugar control over the past 3 months.'
    },
    // Extra tests to enrich categories
    {
      id: 't-urine',
      name: 'Urine Routine Examination',
      price: 200,
      category: 'Routine Tests',
      tab: 'All Tests',
      description: 'Detects urinary tract infections, kidney disorders, and metabolic diseases.'
    },
    {
      id: 't-vitb12',
      name: 'Vitamin B12 (Cyanocobalamin)',
      price: 850,
      category: 'Vitamins',
      tab: 'All Tests',
      description: 'Essential for red blood cell formation and neurological function.'
    },
    {
      id: 't-cardiac-crp',
      name: 'hs-CRP (Cardiac Risk Marker)',
      price: 900,
      category: 'Cardiac Markers',
      tab: 'All Tests',
      description: 'High sensitivity C-reactive protein test for arterial inflammation.'
    },
    // Popular Packages Tab items
    {
      id: 'pkg-basic',
      name: 'Basic Health Package (CBC + Sugar + LFT)',
      price: 999,
      category: 'Profile Tests',
      tab: 'Popular Packages',
      description: 'Essential wellness package covering blood, liver, and sugar.'
    },
    {
      id: 'pkg-cardiac',
      name: 'Comprehensive Heart Check Package',
      price: 1499,
      category: 'Cardiac Markers',
      tab: 'Popular Packages',
      description: 'Includes Lipid profile, hs-CRP, ECG, and Blood Glucose.'
    },
    // Health Checkups Tab items
    {
      id: 'pkg-fullbody',
      name: 'Annual Master Full Body Health Checkup',
      price: 2499,
      category: 'Profile Tests',
      tab: 'Health Checkups',
      description: 'Covers 72 vital parameters including Vitamins, Thyroid, Liver, Kidney & CBC.'
    }
  ];

  // Selected Tests state (Default 3 selected matching the mockups: CBC, Lipid, Thyroid = ₹1,700)
  const [selectedTestIds, setSelectedTestIds] = useState(['t-cbc', 't-lipid', 't-thyroid']);

  // Screen 2: Patient & Appointment Details State
  const [selectedPatient, setSelectedPatient] = useState('John Doe (Self)');
  const [collectionLocation, setCollectionLocation] = useState('ARI Hospital, Delhi - Laboratory');
  const [selectedDate, setSelectedDate] = useState('Tue, 16 Sep');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('09:00 AM');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [showAllTestsModal, setShowAllTestsModal] = useState(false);

  // Screen 3: Payment State
  const [paymentOption, setPaymentOption] = useState('Pay Now'); // 'Pay at Hospital' or 'Pay Now'
  const [isConfirmed, setIsConfirmed] = useState(false); // Controls viewing payment options vs confirmed view

  // Categories list matching the design mockup exactly
  const categories = [
    'All',
    'Routine Tests',
    'Profile Tests',
    'Hormones',
    'Diabetes',
    'Liver Function',
    'Kidney Function',
    'Cardiac Markers',
    'Vitamins',
    'Others'
  ];

  // Date carousel items
  const dateOptions = [
    { day: 'Tue', date: '16 Sep', full: 'Tue, 16 Sep' },
    { day: 'Wed', date: '17 Sep', full: 'Wed, 17 Sep' },
    { day: 'Thu', date: '18 Sep', full: 'Thu, 18 Sep' },
    { day: 'Fri', date: '19 Sep', full: 'Fri, 19 Sep' },
    { day: 'Sat', date: '21 Sep', full: 'Sat, 21 Sep' },
    { day: 'Mon', date: '22 Sep', full: 'Mon, 22 Sep' }
  ];

  // Time Slots
  const timeSlotsRow1 = ['07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM'];
  const timeSlotsRow2 = ['10:00 AM', '10:30 AM', '11:00 AM'];

  // Toggle selection of test
  const toggleTest = (id) => {
    if (selectedTestIds.includes(id)) {
      setSelectedTestIds(selectedTestIds.filter(tId => tId !== id));
    } else {
      setSelectedTestIds([...selectedTestIds, id]);
    }
  };

  // Selected Tests objects
  const selectedTests = useMemo(() => {
    return masterTests.filter(test => selectedTestIds.includes(test.id));
  }, [selectedTestIds]);

  // Total Price calculation
  const totalPrice = useMemo(() => {
    return selectedTests.reduce((acc, curr) => acc + curr.price, 0);
  }, [selectedTests]);

  // Filtered tests for Screen 1
  const filteredTests = useMemo(() => {
    return masterTests.filter(test => {
      // Tab filter
      if (activeTab !== 'All Tests' && test.tab !== activeTab) {
        return false;
      }
      // Category filter
      if (activeCategory !== 'All' && test.category !== activeCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return test.name.toLowerCase().includes(query) || test.category.toLowerCase().includes(query);
      }
      return true;
    });
  }, [activeTab, activeCategory, searchQuery]);

  return (
    <div className="lab-booking-page flex-grow-1 bg-light py-4" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="container-fluid px-3 px-xl-5">

        {/* ========================================================
            TOP FLOW STEPPER HEADER (MATCHING THE 3 SCREENS HEADER)
           ======================================================== */}
        <div className="mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
            <div>
              <h4 className="fw-bolder text-dark mb-1">Book Lab Test</h4>
              <p className="text-secondary small mb-0">Search &amp; select tests &rarr; Patient details, date &amp; time &rarr; Payment &amp; confirmation</p>
            </div>
            
            {/* Quick Step Switcher for convenient review */}
            <div className="d-flex align-items-center gap-1 bg-white border border-light-subtle rounded-3 p-1 shadow-sm mt-2 mt-md-0">
              <button 
                type="button" 
                onClick={() => { setCurrentStep(1); setIsConfirmed(false); }}
                className={`btn btn-sm px-3 py-1.5 rounded-2 fw-semibold ${currentStep === 1 ? 'btn-primary' : 'btn-light text-secondary border-0'}`}
                style={{ fontSize: '0.82rem' }}
              >
                1. Select Tests
              </button>
              <button 
                type="button" 
                onClick={() => { setCurrentStep(2); setIsConfirmed(false); }}
                className={`btn btn-sm px-3 py-1.5 rounded-2 fw-semibold ${currentStep === 2 ? 'btn-primary' : 'btn-light text-secondary border-0'}`}
                style={{ fontSize: '0.82rem' }}
              >
                2. Details &amp; Slot
              </button>
              <button 
                type="button" 
                onClick={() => { setCurrentStep(3); }}
                className={`btn btn-sm px-3 py-1.5 rounded-2 fw-semibold ${currentStep === 3 ? 'btn-primary' : 'btn-light text-secondary border-0'}`}
                style={{ fontSize: '0.82rem' }}
              >
                3. Payment &amp; Confirm
              </button>
            </div>
          </div>

          {/* Stepper Cards Row */}
          <div className="row g-3 align-items-center">
            {/* Step 1 Card */}
            <div className="col-12 col-md-4">
              <div 
                onClick={() => { setCurrentStep(1); setIsConfirmed(false); }}
                className={`d-flex align-items-center gap-3 p-3 rounded-3 border transition-all cursor-pointer ${
                  currentStep === 1 
                    ? 'bg-white border-primary shadow-sm' 
                    : currentStep > 1 
                      ? 'bg-white border-success-subtle' 
                      : 'bg-white border-light-subtle opacity-75'
                }`}
                style={{ cursor: 'pointer' }}
              >
                <div 
                  className={`rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0 ${
                    currentStep === 1 ? 'bg-primary' : currentStep > 1 ? 'bg-success' : 'bg-secondary'
                  }`}
                  style={{ width: '36px', height: '36px', fontSize: '1rem' }}
                >
                  {currentStep > 1 ? <i className="fa-solid fa-check"></i> : '1'}
                </div>
                <div>
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.92rem' }}>Select Lab Tests</h6>
                  <p className="text-secondary small mb-0" style={{ fontSize: '0.78rem' }}>Choose the tests or package you need.</p>
                </div>
              </div>
            </div>

            {/* Step 2 Card */}
            <div className="col-12 col-md-4">
              <div 
                onClick={() => { setCurrentStep(2); setIsConfirmed(false); }}
                className={`d-flex align-items-center gap-3 p-3 rounded-3 border transition-all cursor-pointer ${
                  currentStep === 2 
                    ? 'bg-white border-primary shadow-sm' 
                    : currentStep > 2 
                      ? 'bg-white border-success-subtle' 
                      : 'bg-white border-light-subtle opacity-75'
                }`}
                style={{ cursor: 'pointer' }}
              >
                <div 
                  className={`rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0 ${
                    currentStep === 2 ? 'bg-primary' : currentStep > 2 ? 'bg-success' : 'bg-secondary'
                  }`}
                  style={{ width: '36px', height: '36px', fontSize: '1rem' }}
                >
                  {currentStep > 2 ? <i className="fa-solid fa-check"></i> : '2'}
                </div>
                <div>
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.92rem' }}>Patient Details, Date &amp; Time</h6>
                  <p className="text-secondary small mb-0" style={{ fontSize: '0.78rem' }}>Confirm your details and choose a convenient slot.</p>
                </div>
              </div>
            </div>

            {/* Step 3 Card */}
            <div className="col-12 col-md-4">
              <div 
                onClick={() => { setCurrentStep(3); }}
                className={`d-flex align-items-center gap-3 p-3 rounded-3 border transition-all cursor-pointer ${
                  currentStep === 3 
                    ? 'bg-white border-primary shadow-sm' 
                    : 'bg-white border-light-subtle opacity-75'
                }`}
                style={{ cursor: 'pointer' }}
              >
                <div 
                  className={`rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0 ${
                    currentStep === 3 ? 'bg-primary' : 'bg-secondary'
                  }`}
                  style={{ width: '36px', height: '36px', fontSize: '1rem' }}
                >
                  3
                </div>
                <div>
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.92rem' }}>Payment &amp; Confirmation</h6>
                  <p className="text-secondary small mb-0" style={{ fontSize: '0.78rem' }}>Complete a payment or choose to pay at hospital.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            MAIN LAYOUT: LEFT SIDEBAR + WORKSPACE SCREEN
           ======================================================== */}
        <div className="row g-4">
          
          {/* LEFT SIDEBAR MENU (IDENTICAL TO REFERENCE ACROSS ALL 3 SCREENS) */}
          <div className="col-12 col-md-4 col-lg-3">
            <div className="card border border-light-subtle shadow-sm rounded-3 bg-white p-3 mb-3">
              <h6 className="fw-bold text-dark mb-3 px-1" style={{ fontSize: '0.95rem' }}>Book Appointment</h6>

              <div className="nav flex-column gap-1">
                {/* OPD Consultation */}
                <button
                  type="button"
                  onClick={() => navigate('/book-appointment')}
                  className="btn d-flex align-items-center w-100 text-start py-2.5 px-3 rounded-2 text-secondary bg-transparent fw-medium border-0"
                  style={{ fontSize: '0.92rem' }}
                >
                  <i className="fa-regular fa-user fs-6 me-3" style={{ width: '20px', textAlign: 'center' }}></i>
                  <span>OPD Consultation</span>
                </button>

                {/* Book Lab Test (Active) */}
                <button
                  type="button"
                  onClick={() => { setCurrentStep(1); }}
                  className="btn d-flex align-items-center w-100 text-start py-2.5 px-3 rounded-2  bg-opacity-10  fw-semibold border-start border-4  rounded-start-0"
                  style={{ fontSize: '0.92rem' }}
                >
                  <i className="fa-solid fa-flask fs-6 me-3 " style={{ width: '20px', textAlign: 'center' }}></i>
                  <span>Book Lab Test</span>
                </button>

                {/* Book Radiology */}
                <button
                  type="button"
                  onClick={() => navigate('/appointments?tab=radiology')}
                  className="btn d-flex align-items-center w-100 text-start py-2.5 px-3 rounded-2 text-secondary bg-transparent fw-medium border-0"
                  style={{ fontSize: '0.92rem' }}
                >
                  <i className="fa-solid fa-x-ray fs-6 me-3" style={{ width: '20px', textAlign: 'center' }}></i>
                  <span>Book Radiology</span>
                </button>
              </div>
            </div>

            {/* Selected Tests Summary Quick Card on Sidebar */}
            {selectedTests.length > 0 && (
              <div className="card border border-light-subtle shadow-sm rounded-3 bg-white p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.88rem' }}>Cart Summary</h6>
                  <span className="badge bg-primary rounded-pill">{selectedTests.length} tests</span>
                </div>
                <div className="small text-secondary mb-3">
                  {selectedTests.slice(0, 3).map((t) => (
                    <div key={t.id} className="d-flex justify-content-between py-1 border-bottom border-light-subtle">
                      <span className="text-truncate me-2" style={{ maxWidth: '160px' }}>{t.name}</span>
                      <strong className="text-dark">₹{t.price}</strong>
                    </div>
                  ))}
                  {selectedTests.length > 3 && (
                    <div className="text-muted small pt-1">+{selectedTests.length - 3} more tests</div>
                  )}
                </div>
                <div className="d-flex justify-content-between align-items-center pt-1">
                  <span className="text-muted small">Total</span>
                  <h5 className="fw-bold text-primary mb-0">₹{totalPrice.toLocaleString()}</h5>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================
              RIGHT WORKSPACE: 3 SCREENS
             ======================================================== */}
          <div className="col-12 col-md-8 col-lg-9">

            {/* ----------------------------------------------------
                SCREEN 1: SELECT LAB TESTS
               ---------------------------------------------------- */}
            {currentStep === 1 && (
              <div className="card border border-light-subtle shadow-sm rounded-3 bg-white p-4">
                {/* Header */}
                <div className="mb-3">
                  <h5 className="fw-bold text-dark mb-1">Book Lab Test</h5>
                  <p className="text-secondary small mb-0">Search and select tests or packages.</p>
                </div>

                {/* Search Bar */}
                <div className="mb-3">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted">
                      <i className="fa-solid fa-magnifying-glass"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-1"
                      placeholder="Search for tests (e.g. CBC, Thyroid, Sugar, LFT...)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ fontSize: '0.92rem' }}
                    />
                    {searchQuery && (
                      <button 
                        className="btn btn-outline-light border border-start-0 text-muted" 
                        type="button"
                        onClick={() => setSearchQuery('')}
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Tabs: All Tests | Popular Packages | Health Checkups */}
                <div className="d-flex gap-2 border-bottom border-light-subtle pb-2 mb-4">
                  {['All Tests', 'Popular Packages', 'Health Checkups'].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => { setActiveTab(tab); setActiveCategory('All'); }}
                      className={`btn py-1.5 px-3 rounded-2 fw-semibold ${
                        activeTab === tab
                          ? 'btn-primary text-white shadow-sm'
                          : 'btn-light text-secondary border-0 bg-transparent'
                      }`}
                      style={{ fontSize: '0.88rem' }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Two-Column Tests Selector Layout */}
                <div className="row g-4">
                  
                  {/* Left Column: Categories List */}
                  <div className="col-12 col-md-4 col-lg-3">
                    <h6 className="fw-bold text-dark mb-2 px-2" style={{ fontSize: '0.9rem' }}>Categories</h6>
                    <div className="d-flex flex-column gap-1">
                      {categories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setActiveCategory(category)}
                          className={`btn text-start py-2 px-3 rounded-2 fw-medium border-0 transition-all ${
                            activeCategory === category
                              ? ' bg-opacity-10 text-primary fw-bold'
                              : 'text-secondary bg-transparent hover-bg-light'
                          }`}
                          style={{ fontSize: '0.86rem' }}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Tests Table / List */}
                  <div className="col-12 col-md-8 col-lg-9">
                    <div className="border border-light-subtle rounded-3 overflow-hidden mb-3">
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="table-light text-secondary small">
                            <tr>
                              <th style={{ width: '45px' }} className="ps-3">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={filteredTests.length > 0 && filteredTests.every(t => selectedTestIds.includes(t.id))}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      const allIds = Array.from(new Set([...selectedTestIds, ...filteredTests.map(t => t.id)]));
                                      setSelectedTestIds(allIds);
                                    } else {
                                      const currentIds = filteredTests.map(t => t.id);
                                      setSelectedTestIds(selectedTestIds.filter(id => !currentIds.includes(id)));
                                    }
                                  }}
                                />
                              </th>
                              <th className="fw-semibold">Test Name</th>
                              <th className="fw-semibold text-end pe-4">Price (₹)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredTests.length === 0 ? (
                              <tr>
                                <td colSpan="3" className="text-center py-5 text-muted">
                                  <i className="fa-solid fa-flask fs-2 text-secondary mb-2 d-block opacity-50"></i>
                                  No tests match your filter or search criteria.
                                </td>
                              </tr>
                            ) : (
                              filteredTests.map((test) => {
                                const isChecked = selectedTestIds.includes(test.id);
                                return (
                                  <tr
                                    key={test.id}
                                    onClick={() => toggleTest(test.id)}
                                    style={{ cursor: 'pointer' }}
                                    className={isChecked ? 'table-primary table-opacity-10' : ''}
                                  >
                                    <td className="ps-3" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={isChecked}
                                        onChange={() => toggleTest(test.id)}
                                      />
                                    </td>
                                    <td>
                                      <div className="fw-semibold text-dark" style={{ fontSize: '0.9rem' }}>{test.name}</div>
                                      <div className="text-muted small" style={{ fontSize: '0.78rem' }}>{test.description}</div>
                                    </td>
                                    <td className="text-end fw-bold text-dark pe-4" style={{ fontSize: '0.92rem' }}>
                                      {test.price.toLocaleString()}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Bottom Sticky Total & Continue Bar */}
                    <div className="p-3 bg-light rounded-3 border border-light-subtle d-flex flex-column gap-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold text-dark" style={{ fontSize: '1rem' }}>
                          Total ({selectedTests.length} tests)
                        </span>
                        <h4 className="fw-bolder text-dark mb-0">
                          ₹{totalPrice.toLocaleString()}
                        </h4>
                      </div>

                      <button
                        type="button"
                        disabled={selectedTests.length === 0}
                        onClick={() => setCurrentStep(2)}
                        className="btn btn-primary w-100 py-2.5 fw-semibold shadow-sm"
                        style={{ fontSize: '0.98rem' }}
                      >
                        Continue &rarr;
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            )}


            {/* ----------------------------------------------------
                SCREEN 2: PATIENT DETAILS, DATE & TIME
               ---------------------------------------------------- */}
            {currentStep === 2 && (
              <div className="card border border-light-subtle shadow-sm rounded-3 bg-white p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-dark mb-0">Patient Details, Date &amp; Time</h5>
                  <button 
                    type="button" 
                    onClick={() => setCurrentStep(1)}
                    className="btn btn-link text-primary text-decoration-none fw-semibold p-0 small"
                  >
                    &larr; Modify Tests
                  </button>
                </div>

                {/* 1. Select Patient */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small text-muted mb-0">Select Patient</label>
                    <button
                      type="button"
                      className="btn btn-link text-primary text-decoration-none fw-semibold p-0 small"
                      onClick={() => alert('Add family member modal')}
                    >
                      + Add New Patient
                    </button>
                  </div>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white border-end-0 text-muted">
                      <i className="fa-regular fa-user"></i>
                    </span>
                    <select
                      className="form-select border-start-0 text-dark fw-medium"
                      value={selectedPatient}
                      onChange={(e) => setSelectedPatient(e.target.value)}
                      style={{ fontSize: '0.88rem' }}
                    >
                      <option value="John Doe (Self)">John Doe (Self)</option>
                      <option value="Sarah Doe (Spouse)">Sarah Doe (Spouse)</option>
                      <option value="Leo Doe (Son)">Leo Doe (Son)</option>
                    </select>
                  </div>
                </div>

                {/* Patient Info Strip */}
                <div className="row g-2 py-2 px-3 bg-light rounded-2 border border-light-subtle mb-4 text-secondary small">
                  <div className="col-4">
                    <span className="text-muted d-block" style={{ fontSize: '0.74rem' }}>Age / Gender</span>
                    <strong className="text-dark">35 Years / Male</strong>
                  </div>
                  <div className="col-4">
                    <span className="text-muted d-block" style={{ fontSize: '0.74rem' }}>Mobile Number</span>
                    <strong className="text-dark">9876543210</strong>
                  </div>
                  <div className="col-4">
                    <span className="text-muted d-block" style={{ fontSize: '0.74rem' }}>UHID (if any)</span>
                    <strong className="text-dark">10001234</strong>
                  </div>
                </div>

                {/* 2. Collection Location */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small text-muted mb-0">Collection Location</label>
                    <button 
                      type="button" 
                      onClick={() => alert('ARI Hospital, 123 Health Street, Medical City, India')}
                      className="btn btn-link text-primary text-decoration-none small p-0 fw-semibold"
                    >
                      <i className="fa-solid fa-map-location-dot me-1"></i> View Address
                    </button>
                  </div>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white border-end-0 text-muted">
                      <i className="fa-regular fa-hospital"></i>
                    </span>
                    <select
                      className="form-select border-start-0 text-dark fw-medium"
                      value={collectionLocation}
                      onChange={(e) => setCollectionLocation(e.target.value)}
                      style={{ fontSize: '0.88rem' }}
                    >
                      <option value="ARI Hospital, Delhi - Laboratory">ARI Hospital, Delhi - Laboratory</option>
                      <option value="ARI Diagnostic Center, Noida - Laboratory">ARI Diagnostic Center, Noida - Laboratory</option>
                      <option value="City Labs Central Wing, Delhi">City Labs Central Wing, Delhi</option>
                    </select>
                  </div>
                </div>

                {/* 3. Preferred Date */}
                <div className="mb-4">
                  <label className="form-label small text-muted mb-2">Preferred Date</label>
                  <div className="d-flex align-items-center gap-1">
                    <button
                      type="button"
                      className="btn btn-outline-light border text-secondary px-2 py-2 rounded-2"
                      style={{ fontSize: '0.8rem' }}
                    >
                      <i className="fa-solid fa-chevron-left"></i>
                    </button>

                    <div className="d-flex gap-1 overflow-x-auto flex-grow-1 py-1">
                      {dateOptions.map((item) => {
                        const isSelected = selectedDate === item.full;
                        return (
                          <button
                            key={item.full}
                            type="button"
                            onClick={() => setSelectedDate(item.full)}
                            className={`btn p-2 rounded-2 text-center flex-grow-1 ${
                              isSelected
                                ? 'btn-primary text-white shadow-sm'
                                : 'btn-outline-light border text-dark bg-white'
                            }`}
                            style={{ minWidth: '58px' }}
                          >
                            <div className="small fw-normal" style={{ fontSize: '0.72rem' }}>{item.day}</div>
                            <div className="fw-bold" style={{ fontSize: '0.84rem' }}>{item.date}</div>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-light border text-secondary px-2 py-2 rounded-2"
                      style={{ fontSize: '0.8rem' }}
                    >
                      <i className="fa-solid fa-chevron-right"></i>
                    </button>
                  </div>
                </div>

                {/* 4. Available Time Slots */}
                <div className="mb-4">
                  <div className="small fw-semibold text-dark mb-2">
                    Available Time Slots – {selectedDate} 2026
                  </div>
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    {timeSlotsRow1.map((slot) => {
                      const isSelected = selectedTimeSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot)}
                          className={`btn btn-sm rounded-2 px-2.5 py-1.5 ${
                            isSelected
                              ? 'btn-primary text-white fw-bold shadow-sm'
                              : 'btn-outline-primary'
                          }`}
                          style={{ fontSize: '0.8rem' }}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {timeSlotsRow2.map((slot) => {
                      const isSelected = selectedTimeSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot)}
                          className={`btn btn-sm rounded-2 px-2.5 py-1.5 ${
                            isSelected
                              ? 'btn-primary text-white fw-bold shadow-sm'
                              : 'btn-outline-primary'
                          }`}
                          style={{ fontSize: '0.8rem' }}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Reason for Visit (Optional) */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between">
                    <label className="form-label small text-muted mb-1">Reason for Visit (Optional)</label>
                    <span className="small text-muted">{reasonForVisit.length}/200</span>
                  </div>
                  <input
                    type="text"
                    maxLength={200}
                    className="form-control form-control-sm"
                    placeholder="e.g. Follow up, routine checkup, etc."
                    value={reasonForVisit}
                    onChange={(e) => setReasonForVisit(e.target.value)}
                    style={{ fontSize: '0.88rem' }}
                  />
                </div>

                {/* 6. Appointment Summary Card */}
                <div className="card border border-light-subtle rounded-3 p-3 bg-light bg-opacity-50 mb-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                        <i className="fa-solid fa-flask"></i>
                      </div>
                      <div>
                        <strong className="text-dark d-block" style={{ fontSize: '0.9rem' }}>
                          {selectedTests.length} Tests
                        </strong>
                        <span className="text-secondary small text-truncate d-inline-block" style={{ maxWidth: '420px', fontSize: '0.78rem' }}>
                          {selectedTests.map(t => t.name).join(', ')}
                        </span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setShowAllTestsModal(true)}
                      className="btn btn-link text-primary p-0 small fw-semibold text-decoration-none"
                      style={{ fontSize: '0.8rem' }}
                    >
                      View All
                    </button>
                  </div>

                  <div className="row g-2 pt-2 border-top border-light-subtle small text-secondary">
                    <div className="col-md-6 d-flex align-items-center gap-2">
                      <i className="fa-solid fa-location-dot text-primary" style={{ width: '16px' }}></i>
                      <span>Location: <strong className="text-dark">{collectionLocation}</strong></span>
                    </div>
                    <div className="col-md-6 d-flex align-items-center gap-2">
                      <i className="fa-regular fa-calendar text-primary" style={{ width: '16px' }}></i>
                      <span>Date &amp; Time: <strong className="text-dark">{selectedDate} 2026, {selectedTimeSlot}</strong></span>
                    </div>
                    <div className="col-md-6 d-flex align-items-center gap-2">
                      <i className="fa-regular fa-user text-primary" style={{ width: '16px' }}></i>
                      <span>Patient: <strong className="text-dark">{selectedPatient}</strong></span>
                    </div>
                    <div className="col-md-6 d-flex align-items-center gap-2">
                      <i className="fa-solid fa-receipt text-primary" style={{ width: '16px' }}></i>
                      <span>Total Amount: <strong className="text-dark fs-6">₹{totalPrice.toLocaleString()}</strong></span>
                    </div>
                  </div>
                </div>

                {/* 7. Action Buttons */}
                <div className="d-flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="btn btn-outline-secondary px-4 py-2 fw-semibold"
                    style={{ minWidth: '110px' }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="btn btn-primary flex-grow-1 py-2 fw-semibold shadow-sm"
                  >
                    Proceed to Payment &rarr;
                  </button>
                </div>
              </div>
            )}


            {/* ----------------------------------------------------
                SCREEN 3: PAYMENT & CONFIRMATION
               ---------------------------------------------------- */}
            {currentStep === 3 && (
              <div>
                {/* 3A: PAYMENT OPTIONS (When not yet confirmed) */}
                {!isConfirmed ? (
                  <div className="card border border-light-subtle shadow-sm rounded-3 bg-white p-4">
                    {/* Header */}
                    <div className="mb-4">
                      <h5 className="fw-bold text-dark mb-1">Payment &amp; Confirmation</h5>
                      <p className="text-secondary small mb-0">Choose a payment option to confirm your booking.</p>
                    </div>

                    {/* Payment Options Section */}
                    <h6 className="fw-bold text-dark mb-3" style={{ fontSize: '0.95rem' }}>Payment Options</h6>
                    <div className="row g-3 mb-4">
                      
                      {/* Card 1: Pay at Hospital */}
                      <div className="col-12 col-md-6">
                        <div
                          onClick={() => setPaymentOption('Pay at Hospital')}
                          className={`p-3 rounded-3 border text-center transition-all cursor-pointer h-100 d-flex flex-column align-items-center justify-content-center ${
                            paymentOption === 'Pay at Hospital'
                              ? 'border-primary bg-primary bg-opacity-10 shadow-sm'
                              : 'border-light-subtle bg-white hover-shadow'
                          }`}
                          style={{ cursor: 'pointer', minHeight: '120px' }}
                        >
                          <div className="rounded-circle bg-light d-flex align-items-center justify-content-center text-primary mb-2" style={{ width: '42px', height: '42px', fontSize: '1.2rem' }}>
                            <i className="fa-solid fa-hospital"></i>
                          </div>
                          <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '0.95rem' }}>Pay at Hospital</h6>
                          <p className="text-secondary small mb-0" style={{ fontSize: '0.78rem' }}>Pay during sample collection at hospital</p>
                        </div>
                      </div>

                      {/* Card 2: Pay Now */}
                      <div className="col-12 col-md-6">
                        <div
                          onClick={() => setPaymentOption('Pay Now')}
                          className={`p-3 rounded-3 border text-center transition-all cursor-pointer h-100 d-flex flex-column align-items-center justify-content-center ${
                            paymentOption === 'Pay Now'
                              ? 'border-primary bg-primary text-white shadow'
                              : 'border-light-subtle bg-white hover-shadow'
                          }`}
                          style={{ cursor: 'pointer', minHeight: '120px' }}
                        >
                          <div className={`rounded-circle d-flex align-items-center justify-content-center mb-2 ${paymentOption === 'Pay Now' ? 'bg-white text-primary' : 'bg-light text-primary'}`} style={{ width: '42px', height: '42px', fontSize: '1.2rem' }}>
                            <i className="fa-regular fa-credit-card"></i>
                          </div>
                          <h6 className={`fw-bold mb-1 ${paymentOption === 'Pay Now' ? 'text-white' : 'text-dark'}`} style={{ fontSize: '0.95rem' }}>
                            Pay Now ₹{totalPrice.toLocaleString()}
                          </h6>
                          <p className={`small mb-0 ${paymentOption === 'Pay Now' ? 'text-white text-opacity-75' : 'text-secondary'}`} style={{ fontSize: '0.78rem' }}>
                            Pay online using UPI, Card, Netbanking
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Notice Banner */}
                    <div className="alert alert-success bg-success bg-opacity-10 border-0 text-success-emphasis d-flex align-items-center gap-2 small py-2.5 px-3 mb-4 rounded-3">
                      <i className="fa-solid fa-circle-info fs-6"></i>
                      <span>Please carry a valid ID at the time of sample collection.</span>
                    </div>

                    {/* Summary box before confirming */}
                    <div className="border border-light-subtle rounded-3 p-3 bg-light bg-opacity-50 small text-secondary mb-4">
                      <div className="d-flex justify-content-between py-1 border-bottom border-light-subtle">
                        <span>Selected Tests:</span>
                        <strong className="text-dark">{selectedTests.length} tests (₹{totalPrice.toLocaleString()})</strong>
                      </div>
                      <div className="d-flex justify-content-between py-1 border-bottom border-light-subtle">
                        <span>Slot:</span>
                        <strong className="text-dark">{selectedDate} 2026, {selectedTimeSlot}</strong>
                      </div>
                      <div className="d-flex justify-content-between py-1 border-bottom border-light-subtle">
                        <span>Location:</span>
                        <strong className="text-dark">{collectionLocation}</strong>
                      </div>
                      <div className="d-flex justify-content-between py-1">
                        <span>Payment Mode:</span>
                        <strong className="text-primary">{paymentOption}</strong>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex gap-3">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="btn btn-outline-secondary px-4 py-2 fw-semibold"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfirmed(true)}
                        className="btn btn-primary flex-grow-1 py-2.5 fw-bold shadow-sm"
                        style={{ fontSize: '0.98rem' }}
                      >
                        Confirm Booking ({paymentOption}) &rarr;
                      </button>
                    </div>
                  </div>
                ) : (

                  /* 3B: LAB APPOINTMENT CONFIRMED SCREEN (MATCHING THE BOTTOM ARROW IN DESIGN) */
                  <div className="card border border-light-subtle shadow-sm rounded-3 bg-white p-4 text-center">
                    
                    {/* Success Icon */}
                    <div 
                      className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center mx-auto mb-3 shadow"
                      style={{ width: '64px', height: '64px', fontSize: '1.8rem' }}
                    >
                      <i className="fa-solid fa-check"></i>
                    </div>

                    <h4 className="fw-bolder text-dark mb-1">Lab Appointment Confirmed!</h4>
                    <p className="text-secondary small mb-4">Your lab test booking has been created successfully.</p>

                    {/* Two Big Highlight Boxes: Appointment No. & Collection Date & Time */}
                    <div className="row g-3 mb-4">
                      <div className="col-12 col-md-6">
                        <div className="p-3 bg-light rounded-3 border border-light-subtle text-start">
                          <span className="text-muted small d-block mb-1" style={{ fontSize: '0.75rem' }}>Appointment No.</span>
                          <strong className="fs-5 text-primary fw-bolder">LAB20260916-00456</strong>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="p-3 bg-light rounded-3 border border-light-subtle text-start">
                          <span className="text-muted small d-block mb-1" style={{ fontSize: '0.75rem' }}>Collection Date &amp; Time</span>
                          <strong className="fs-5 text-dark fw-bolder">16 Sep 2026, 09:00 AM</strong>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Information Table / Card */}
                    <div className="border border-light-subtle rounded-3 p-3 bg-light bg-opacity-50 text-start small mb-4">
                      {/* Tests row */}
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light-subtle">
                        <div className="d-flex align-items-center gap-2">
                          <i className="fa-solid fa-flask text-primary" style={{ width: '18px' }}></i>
                          <span className="text-muted">Tests</span>
                        </div>
                        <div className="text-end">
                          <span className="text-dark fw-medium me-2">{selectedTests.map(t => t.name).join(', ')}</span>
                          <button 
                            type="button" 
                            onClick={() => setShowAllTestsModal(true)}
                            className="btn btn-link text-primary p-0 small fw-semibold text-decoration-none"
                          >
                            View All
                          </button>
                        </div>
                      </div>

                      {/* Location row */}
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light-subtle">
                        <div className="d-flex align-items-center gap-2">
                          <i className="fa-solid fa-location-dot text-primary" style={{ width: '18px' }}></i>
                          <span className="text-muted">Location</span>
                        </div>
                        <strong className="text-dark">{collectionLocation}</strong>
                      </div>

                      {/* Date & Time row */}
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light-subtle">
                        <div className="d-flex align-items-center gap-2">
                          <i className="fa-regular fa-calendar text-primary" style={{ width: '18px' }}></i>
                          <span className="text-muted">Date &amp; Time</span>
                        </div>
                        <strong className="text-dark">{selectedDate} 2026, {selectedTimeSlot}</strong>
                      </div>

                      {/* Patient row */}
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light-subtle">
                        <div className="d-flex align-items-center gap-2">
                          <i className="fa-regular fa-user text-primary" style={{ width: '18px' }}></i>
                          <span className="text-muted">Patient</span>
                        </div>
                        <strong className="text-dark">{selectedPatient}</strong>
                      </div>

                      {/* Amount row */}
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light-subtle">
                        <div className="d-flex align-items-center gap-2">
                          <i className="fa-solid fa-indian-rupee-sign text-primary" style={{ width: '18px' }}></i>
                          <span className="text-muted">Amount</span>
                        </div>
                        <strong className="text-dark fs-6">₹{totalPrice.toLocaleString()}</strong>
                      </div>

                      {/* Payment Status row */}
                      <div className="d-flex justify-content-between align-items-center py-2">
                        <div className="d-flex align-items-center gap-2">
                          <i className="fa-regular fa-credit-card text-primary" style={{ width: '18px' }}></i>
                          <span className="text-muted">Payment Status</span>
                        </div>
                        <span className={`badge ${paymentOption === 'Pay Now' ? 'bg-success text-white' : 'bg-warning text-dark'} px-2.5 py-1 rounded-pill`}>
                          {paymentOption === 'Pay Now' ? 'Paid Online' : 'Pay at Hospital'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Buttons matching the mockup */}
                    <div className="d-flex flex-column gap-2">
                      <div className="row g-2">
                        <div className="col-6">
                          <button
                            type="button"
                            onClick={() => {
                              setIsConfirmed(false);
                              setCurrentStep(2);
                            }}
                            className="btn btn-outline-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                            style={{ fontSize: '0.88rem' }}
                          >
                            <i className="fa-regular fa-calendar-check"></i>
                            <span>Reschedule</span>
                          </button>
                        </div>
                        <div className="col-6">
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to cancel this lab test booking?')) {
                                setIsConfirmed(false);
                                setCurrentStep(1);
                              }
                            }}
                            className="btn btn-outline-danger w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                            style={{ fontSize: '0.88rem' }}
                          >
                            <i className="fa-regular fa-circle-xmark"></i>
                            <span>Cancel Appointment</span>
                          </button>
                        </div>
                      </div>

                      {/* Go to My Appointments Button */}
                      <button
                        type="button"
                        onClick={() => navigate('/appointments?tab=lab')}
                        className="btn btn-primary w-100 py-2.5 fw-bold shadow-sm"
                        style={{ fontSize: '0.98rem' }}
                      >
                        Go to My Appointments
                      </button>
                    </div>

                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* View All Tests Modal */}
      {showAllTestsModal && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content rounded-3 border-0 shadow">
              <div className="modal-header border-bottom py-3 px-4 bg-light">
                <h6 className="modal-title fw-bold text-dark mb-0">Selected Tests ({selectedTests.length})</h6>
                <button
                  type="button"
                  className="btn-close shadow-none"
                  aria-label="Close"
                  onClick={() => setShowAllTestsModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="list-group list-group-flush">
                  {selectedTests.map((t) => (
                    <div key={t.id} className="list-group-item d-flex justify-content-between align-items-center px-0 py-2 border-bottom border-light-subtle">
                      <div>
                        <strong className="text-dark d-block" style={{ fontSize: '0.9rem' }}>{t.name}</strong>
                        <span className="text-muted small" style={{ fontSize: '0.78rem' }}>{t.category}</span>
                      </div>
                      <span className="fw-bold text-primary">₹{t.price}</span>
                    </div>
                  ))}
                </div>
                <div className="d-flex justify-content-between align-items-center pt-3 mt-2 border-top">
                  <span className="fw-bold text-dark">Total Amount</span>
                  <h5 className="fw-bolder text-primary mb-0">₹{totalPrice.toLocaleString()}</h5>
                </div>
              </div>
              <div className="modal-footer border-top py-2 px-4 bg-light">
                <button
                  type="button"
                  className="btn btn-primary btn-sm px-3"
                  onClick={() => setShowAllTestsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
