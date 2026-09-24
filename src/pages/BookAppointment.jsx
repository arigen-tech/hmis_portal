import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { ENDPOINTS } from '../constants/apiEndpoints';
import AlertNotification from '../components/AlertNotification';
import { loadRazorpayScript } from '../utils/loadRazorpay';

export default function BookAppointment({ defaultView = 'listing' }) {
  const navigate = useNavigate();

  // View mode: 'listing' (Find a Doctor + Doctors list) or 'details' (Book OPD Consultation page)
  const [viewMode, setViewMode] = useState(defaultView);

  // Currently selected doctor for detailed booking
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Find a Doctor Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const [displayedDoctors, setDisplayedDoctors] = useState([]);
  const [specialtiesList, setSpecialtiesList] = useState([]);
  const [locationsList, setLocationsList] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [opdSessionsList, setOpdSessionsList] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await apiService.get(ENDPOINTS.MASTER.GET_ALL_HOSPITALS);
        if (res && res.status === 200 && res.response) {
          setLocationsList(res.response);
        }
      } catch (err) {
        console.error("Failed to fetch locations:", err);
      }
    };
    fetchLocations();
    
    // Fetch patient info from local storage
    const activeData = localStorage.getItem('patientDetails');
    const listData = localStorage.getItem('patientList');
    
    let parsedActive = null;
    let mappedPatients = [];

    if (activeData) {
      try {
        parsedActive = JSON.parse(activeData);
      } catch (e) {
        console.error("Failed to parse active patient data", e);
      }
    }

    if (listData) {
      try {
        const parsedList = JSON.parse(listData);
        mappedPatients = parsedList.map(p => ({
          id: p.patientId,
          name: p.patientName,
          relation: p.relation || 'Self',
          gender: p.gender || 'N/A',
          age: p.age || 'N/A',
          mobileNo: p.mobileNo || parsedActive?.mobileNo || 'N/A'
        }));
      } catch (e) {
        console.error("Failed to parse patient list data", e);
      }
    } else if (parsedActive) {
      mappedPatients = [{
        id: parsedActive.patientId,
        name: parsedActive.patientName || 'User',
        relation: parsedActive.relation || 'Self',
        gender: parsedActive.gender || 'N/A',
        age: parsedActive.age || 'N/A',
        mobileNo: parsedActive.mobileNo || 'N/A'
      }];
    }
    
    setFamilyMembers(mappedPatients);
    if (parsedActive && mappedPatients.length > 0) {
      const current = mappedPatients.find(p => p.id === (parsedActive.patientId || parsedActive.id)) || mappedPatients[0];
      setSelectedPatient(current);
    } else if (mappedPatients.length > 0) {
      setSelectedPatient(mappedPatients[0]);
    }
  }, []);

  useEffect(() => {
    if (viewMode === 'details') {
      const fetchOpdSessions = async () => {
        try {
          const res = await apiService.get(ENDPOINTS.MASTER.GET_OPD_SESSIONS);
          if (res && res.status === 200 && res.response) {
            setOpdSessionsList(res.response);
          }
        } catch (err) {
          console.error("Failed to fetch OPD sessions:", err);
        }
      };
      fetchOpdSessions();
    }
  }, [viewMode]);

  useEffect(() => {
    const fetchDoctorsAndSpecialties = async () => {
      setIsSearching(true);
      setHasSearched(true);
      try {
        const hospitalStr = localStorage.getItem('selectedHospital');
        let hospitalId = 12;
        if (hospitalStr) {
          try {
            const parsed = JSON.parse(hospitalStr);
            if (parsed && parsed.id) hospitalId = parsed.id;
          } catch(e) {}
        }

        const url = `${ENDPOINTS.APPOINTMENTS.SEARCH_DOCTOR}?search=${encodeURIComponent(searchQuery)}&hospitalId=${hospitalId}`;
        const res = await apiService.get(url);
        
        if (res && res.status === 200 && res.response && res.response.length > 0) {
          const responseData = res.response[0];
          const doctorsData = responseData.doctorResponseList || [];
          const specialitiesData = responseData.specialitiesResponseList || [];
          
          const mappedDoctors = doctorsData.map((doc) => ({
            id: `doc-${doc.doctorId}`,
            name: doc.doctorName,
            specialty: 'Specialist',
            degrees: '', 
            location: doc.hospitalName,
            rating: 4.5,
            fee: doc.consultancyFee || 0,
            avatar: 'https://i.postimg.cc/k47Z6t44/default-doctor.png',
            gender: 'unknown',
            experience: doc.yearOfExperience || 'N/A',
            about: '',
            expertise: [],
            education: [],
            memberships: [],
            languages: ['English', 'Hindi'],
            sessions: doc.sessionResponseLists || []
          }));
          
          setDisplayedDoctors(mappedDoctors);
          setSpecialtiesList(specialitiesData);
        } else {
          setDisplayedDoctors([]);
          setSpecialtiesList([]);
        }
      } catch (err) {
        console.error("Search failed:", err);
        setDisplayedDoctors([]);
        setSpecialtiesList([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(() => {
      fetchDoctorsAndSpecialties();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchDoctorsBySpecialty = async () => {
      if (!selectedSpecialty) return;
      setIsSearching(true);
      setHasSearched(true);
      try {
        const url = `${ENDPOINTS.APPOINTMENTS.DOCTORS_BY_SPECIALTY}?specialityId=${selectedSpecialty}`;
        const res = await apiService.get(url);
        
        if (res && res.status === 200 && res.response && res.response.length > 0) {
          const responseData = res.response[0];
          const doctorsData = responseData.doctorResponseListList || [];
          
          const mappedDoctors = doctorsData.map((doc) => ({
            id: `doc-${doc.doctorId}`,
            name: doc.doctorName,
            specialty: doc.specialityName || 'Specialist',
            degrees: '', 
            location: responseData.hospitalName || 'Hospital',
            rating: 4.5,
            fee: doc.consultancyFee || 0,
            avatar: 'https://i.postimg.cc/k47Z6t44/default-doctor.png',
            gender: doc.gender || 'unknown',
            experience: doc.yearsOfExperience ? `${doc.yearsOfExperience} years` : 'N/A',
            about: '',
            expertise: [],
            education: [],
            memberships: [],
            languages: ['English', 'Hindi'],
            sessions: doc.sessionResponseLists || []
          }));
          
          setDisplayedDoctors(mappedDoctors);
        } else {
          setDisplayedDoctors([]);
        }
      } catch (err) {
        console.error("Specialty search failed:", err);
        setDisplayedDoctors([]);
      } finally {
        setIsSearching(false);
      }
    };

    fetchDoctorsBySpecialty();
  }, [selectedSpecialty]);

  const handleSearchButtonClick = () => {
    // This will hit a different API based on user's future requirement
    console.log("Search button clicked - placeholder for different API");
  };

  // Booking details state
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmedPaymentType, setConfirmedPaymentType] = useState('Pay Now');

  const [dateOptions, setDateOptions] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [rawTimeSlots, setRawTimeSlots] = useState([]);
  const [isDoctorDetailsLoading, setIsDoctorDetailsLoading] = useState(false);
  const [isTimeSlotsLoading, setIsTimeSlotsLoading] = useState(false);
  const [loadingPaymentType, setLoadingPaymentType] = useState(null);
  const [bookedDetails, setBookedDetails] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [alert, setAlert] = useState(null);

  const generateDateOptions = (sessions) => {
    if (!sessions || sessions.length === 0) return [];
    const availableDays = [...new Set(sessions.map(s => s.day))];
    const options = [];
    let date = new Date();
    let daysAdded = 0;
    while(options.length < 14 && daysAdded < 30) {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      if (availableDays.includes(dayName)) {
        const shortDay = date.toLocaleDateString('en-US', { weekday: 'short' });
        const monthStr = date.toLocaleDateString('en-US', { month: 'short' });
        const dateNum = date.getDate();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        options.push({
          day: shortDay,
          date: `${dateNum} ${monthStr}`,
          full: `${shortDay}, ${dateNum} ${monthStr}`,
          dayName: dayName,
          apiDate: `${year}-${month}-${day}`
        });
      }
      date.setDate(date.getDate() + 1);
      daysAdded++;
    }
    return options;
  };

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!selectedDoctor || !selectedDate || !selectedSessionId) {
        setAvailableTimeSlots([]);
        return;
      }
      
      const selectedOption = dateOptions.find(d => d.full === selectedDate);
      if (!selectedOption) return;
      
      setIsTimeSlotsLoading(true);
      try {
        const rawDoctorId = selectedDoctor.id.toString().replace('doc-', '');
        const deptId = selectedSpecialty || selectedDoctor.departmentId; 
        
        const url = `${ENDPOINTS.APPOINTMENTS.GET_APPOINTMENT_SLOTS}?deptId=${deptId}&doctorId=${rawDoctorId}&appointmentDate=${selectedOption.apiDate}&sessionId=${selectedSessionId}`;
        const res = await apiService.get(url);
        
        if (res && res.status === 200 && res.response) {
          const availableSlots = res.response.filter(slot => slot.available);
          setRawTimeSlots(availableSlots);
          const slots = availableSlots.map(slot => {
              let start = new Date(`1970-01-01T${slot.startTime}`);
              return start.toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' });
            });
          
          setAvailableTimeSlots(slots);
          if (slots.length > 0) {
            setSelectedTimeSlot(slots[0]);
          } else {
            setSelectedTimeSlot('');
          }
        } else {
          setAvailableTimeSlots([]);
          setRawTimeSlots([]);
          setSelectedTimeSlot('');
        }
      } catch (err) {
        console.error("Failed to fetch slots:", err);
        setAvailableTimeSlots([]);
        setRawTimeSlots([]);
        setSelectedTimeSlot('');
      } finally {
        setIsTimeSlotsLoading(false);
      }
    };

    fetchAvailableSlots();
  }, [selectedDate, selectedDoctor, dateOptions, selectedSessionId, selectedSpecialty]);

  const timeSlotsRow1 = availableTimeSlots.slice(0, Math.ceil(availableTimeSlots.length / 2));
  const timeSlotsRow2 = availableTimeSlots.slice(Math.ceil(availableTimeSlots.length / 2));

  // Filter logic
  const filteredDoctors = displayedDoctors.filter((doc) => {
  const q = searchQuery.toLowerCase().trim();

  const matchesSearch =
    !q ||
    doc.name?.toLowerCase().includes(q) ||
    doc.specialty?.toLowerCase().includes(q) ||
    doc.location?.toLowerCase().includes(q);

  const matchesLocation =
    !selectedLocation ||
    doc.location?.includes(selectedLocation);

  return matchesSearch && matchesLocation;
});

  const handleSelectDoctorForBooking = async (doc) => {
    setSelectedDoctor(doc);
    setViewMode('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsDoctorDetailsLoading(true);

    try {
      const rawId = doc.id.toString().replace('doc-', '');
      const url = `${ENDPOINTS.APPOINTMENTS.DOCTOR_DETAIL}?doctorId=${rawId}`;
      const res = await apiService.get(url);
      
      if (res && res.status === 200 && res.response) {
        const details = res.response;
        const basicInfo = details.basicInfo || {};
        
        const enhancedDoc = {
          ...doc,
          name: basicInfo.doctorName || doc.name,
          fee: basicInfo.consultancyFee !== null && basicInfo.consultancyFee !== undefined ? basicInfo.consultancyFee : doc.fee,
          experience: basicInfo.yearsOfExperience ? `${basicInfo.yearsOfExperience} Years` : doc.experience,
          about: basicInfo.profileDescription || doc.about,
          gender: basicInfo.gender || doc.gender,
          education: details.education && details.education.length > 0 ? details.education : doc.education,
          memberships: details.memberships && details.memberships.length > 0 ? details.memberships : doc.memberships,
          expertise: details.specialtyInterests && details.specialtyInterests.length > 0 ? details.specialtyInterests : doc.expertise,
          languages: details.languages && details.languages.length > 0 ? details.languages : doc.languages,
          sessions: details.sessionResponseList || [],
          specialty: details.specialitiesResponseList?.map(s => s.specialityName).join(', ') || doc.specialty,
          departmentId: details.specialitiesResponseList?.[0]?.specialityId,
        };
        
        setSelectedDoctor(enhancedDoc);
        
        const options = generateDateOptions(details.sessionResponseList);
        setDateOptions(options);
        if (options.length > 0) {
          setSelectedDate(options[0].full);
        } else {
          setSelectedDate('');
          setAvailableTimeSlots([]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch doctor details:", err);
    } finally {
      setIsDoctorDetailsLoading(false);
    }
  };

  const handleOpenPayment = async (paymentType) => {
    const errors = {};
    if (!selectedDate) errors.date = true;
    if (!selectedSessionId) errors.session = true;
    if (!selectedTimeSlot) errors.timeSlot = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      
      if (errors.date) {
        document.getElementById('appointment-date-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (errors.session) {
        document.getElementById('appointment-session-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (errors.timeSlot) {
        document.getElementById('appointment-timeslot-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setValidationErrors({});

    if (paymentType === 'Pay at Hospital' || paymentType === 'Pay Now') {
      setLoadingPaymentType(paymentType);
      try {
        const rawDoctorId = selectedDoctor.id.toString().replace('doc-', '');
        const deptId = selectedSpecialty || selectedDoctor.departmentId || 5;
        const selectedOption = dateOptions.find(d => d.full === selectedDate);
        
        const rawSlot = rawTimeSlots.find(slot => {
           let start = new Date(`1970-01-01T${slot.startTime}`);
           let timeStr = start.toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' });
           return timeStr === selectedTimeSlot;
        });

        const hospitalStr = localStorage.getItem('selectedHospital');
        let hospitalId = 12;
        if (hospitalStr) {
           try {
              const parsed = JSON.parse(hospitalStr);
              if (parsed && parsed.id) hospitalId = parsed.id;
           } catch(e) {}
        }
        
        const activeData = localStorage.getItem('patientDetails');
        let lastChgBy = "9080438141";
        if (activeData) {
            try {
               const parsedActive = JSON.parse(activeData);
               lastChgBy = parsedActive.mobileNo || lastChgBy;
            } catch(e) {}
        }

        const payload = {
          appointmentFlag: true,
          patientDetails: {
            patient: null,
            opdPatientDetail: null,
            visits: [
              {
                id: null,
                tokenNo: rawSlot ? rawSlot.tokenNo.toString() : "0",
                tokenStartTime: `${selectedOption?.apiDate}T${rawSlot ? rawSlot.startTime : '00:00:00'}Z`,
                tokenEndTime: `${selectedOption?.apiDate}T${rawSlot ? rawSlot.endTime : '00:00:00'}Z`,
                visitDate: `${selectedOption?.apiDate}T00:00:00Z`,
                departmentId: deptId,
                doctorId: parseInt(rawDoctorId) || 0,
                doctorName: selectedDoctor.name,
                sessionId: parseInt(selectedSessionId) || 0,
                hospitalId: hospitalId,
                priority: null,
                billingStatus: "Pending",
                patientId: selectedPatient ? selectedPatient.id : null,
                iniDoctorId: parseInt(rawDoctorId) || 0,
                visitType: "F",
                lastChgBy: lastChgBy
              }
            ]
          }
        };

        const res = await apiService.post(ENDPOINTS.APPOINTMENTS.UPDATE_PATIENT, payload);
        if (res && res.status === 200) {
           setBookedDetails(res.response);

           if (paymentType === 'Pay Now') {
             try {
               const patientId = res.response?.patient?.id;
               if (!patientId) throw new Error("Patient ID not found in response.");
               
               // Fetch OPD Patient Bill Details
               const billRes = await apiService.get(`${ENDPOINTS.BILLING.OPD_PATIENT_BILL_DETAILS}/${patientId}`);
               if (!billRes || !billRes.response || !billRes.response.appointments || billRes.response.appointments.length === 0) {
                 throw new Error("Billing details not found.");
               }
               const billingData = billRes.response.appointments[0];
               const billHdId = billingData.billingHdId;
               const amount = billingData.netAmount;
               
               // Create Order
               const createOrderPayload = {
                 billingItems: [{ billingHdId: billHdId, amount: amount }],
                 billingType: "OPD_SC",
                 patientId: patientId
               };
               const orderRes = await apiService.post(ENDPOINTS.PAYMENTS.CREATE_ORDER, createOrderPayload);
               if (!orderRes || !orderRes.orderId) {
                 throw new Error("Failed to create Razorpay order.");
               }
               
               // Load Razorpay script
               const isLoaded = await loadRazorpayScript();
               if (!isLoaded) {
                 throw new Error("Razorpay SDK failed to load. Are you online?");
               }
               
               // Prefill Data from Bill Details
               const prefill = {
                 name: billRes.response.patientName || "",
                 email: "", // Not provided in bill details
                 contact: billRes.response.mobileNo || ""
               };
               
               // Open Razorpay
               const options = {
                 key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_YourTestKeyHere",
                 amount: orderRes.amount,
                 currency: orderRes.currency,
                 name: "ARI Hospital",
                 description: `Payment for OPD Consultation - ${selectedDoctor.name}`,
                 order_id: orderRes.orderId,
                 prefill: prefill,
                 handler: async function (response) {
                   try {
                     setAlert({ type: 'info', message: "Verifying payment..." });
                     const verifyPayload = {
                       razorpayOrderId: response.razorpay_order_id,
                       razorpayPaymentId: response.razorpay_payment_id,
                       razorpaySignature: response.razorpay_signature
                     };
                     const verifyRes = await apiService.post(ENDPOINTS.PAYMENTS.VERIFY, verifyPayload);
                     
                     if (verifyRes && verifyRes.status === "success") {
                        const paymentId = orderRes.paymentIds[0];
                        let isPaid = false;
                        for (let i = 0; i < 10; i++) {
                          try {
                            const statusRes = await apiService.get(`${ENDPOINTS.PAYMENTS.STATUS}/${paymentId}`);
                            if (statusRes && statusRes.paymentStatus === "PAID") {
                              isPaid = true;
                              break;
                            }
                          } catch (e) {}
                          await new Promise(r => setTimeout(r, 3000));
                        }
                        
                        if (!isPaid) {
                          setAlert({ type: 'warning', message: "Payment verification timed out. Please check later." });
                          return;
                        }
                        
                        try {
                          const processOpdPaymentPayload = {
                            billingType: "OPD_SC",
                            billingHeaderIds: [billHdId],
                            opdBillPayments: [{ billHeaderId: billHdId, netAmount: amount }],
                            amount: amount,
                            mode: "online",
                            isPaymentUpdate: true,
                            shouldNotCreateNewBilling: true,
                            useExistingBillingHeader: true,
                            paymentReferenceNo: response.razorpay_payment_id,
                            timestamp: new Date().toISOString(),
                            operationType: "payment_update_only"
                          };
                          await apiService.post(ENDPOINTS.BILLING.PROCESS_OPD_PAYMENT, processOpdPaymentPayload);
                        } catch (err) {
                          console.error("Failed to process OPD payment in backend", err);
                        }
                        
                        setConfirmedPaymentType('Pay Now');
                        setShowConfirmationModal(true);
                        setAlert(null);
                     } else {
                        setAlert({ type: 'danger', message: "Payment verification failed." });
                     }
                   } catch (err) {
                     console.error("Verification error:", err);
                     setAlert({ type: 'danger', message: "Error during payment verification." });
                   } finally {
                     setLoadingPaymentType(null);
                   }
                 },
                 theme: { color: "#3399cc" }
               };
               
               const rzp = new window.Razorpay(options);
               rzp.on('payment.failed', function(response) {
                 console.error("Payment failed", response.error);
                 setAlert({ type: 'danger', message: response.error.description || "Payment failed" });
                 setLoadingPaymentType(null);
               });
               
               rzp.open();
             } catch(err) {
               console.error("Razorpay integration error:", err);
               setAlert({ type: 'danger', message: err.message || "An error occurred during payment initialization." });
               setLoadingPaymentType(null);
             }
           } else {
             setConfirmedPaymentType(paymentType);
             setShowConfirmationModal(true);
             setLoadingPaymentType(null);
           }
        } else {
           setAlert({ type: 'danger', message: "Booking failed. Please try again." });
           setLoadingPaymentType(null);
        }
      } catch(err) {
        console.error("Booking error:", err);
        if (err.status === 409) {
          setAlert({ type: 'warning', message: err.data?.detail || "Patient already has an appointment with the same doctor on this day." });
        } else {
          setAlert({ type: 'danger', message: "An error occurred while booking." });
        }
        setLoadingPaymentType(null);
      }
    } else {
      setConfirmedPaymentType(paymentType);
      setShowConfirmationModal(true);
    }
  };

  return (
    <div className="bg-light flex-grow-1 d-flex flex-column" style={{ backgroundColor: '#f8fafc', position: 'relative' }}>
      <AlertNotification alert={alert} onClose={() => setAlert(null)} />
      
      {/* VIEW 1: FIND A DOCTOR (LISTING WITH PREVIOUS LEFT FILTER CARD) */}
      {viewMode === 'listing' && (
        <div className="book-appointment-container flex-grow-1 py-4">
          <div className="book-appointment-grid">
            {/* ========================================================
                LEFT COLUMN: FIND A DOCTOR FILTER CARD (REVERTED AS REQUESTED)
               ======================================================== */}
            <aside className="find-doctor-card">
              <div className="find-doctor-header">
                <h2 className="find-doctor-title">
                  Find a Doctor <span className="find-doctor-indicator"></span>
                </h2>
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="find-doctor-form">
                {/* Search by doctor name or condition */}
                <div className="find-doctor-group">
                  <label className="find-doctor-label">Search</label>
                  <input
                    type="text"
                    className="find-doctor-input"
                    placeholder="Doctor name or condition..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Specialty Dropdown */}
                <div className="find-doctor-group">
                  <label className="find-doctor-label">Specialty</label>
                  <select
                    className="find-doctor-select"
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    disabled={isSearching}
                  >
                    <option value="">{isSearching ? 'Loading...' : 'All Specialties'}</option>
                    {specialtiesList.length > 0 && (
                      specialtiesList.map(spec => (
                        <option key={spec.specialityId} value={spec.specialityId}>
                          {spec.specialityName}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Location Dropdown */}
                <div className="find-doctor-group">
                  <label className="find-doctor-label">Location</label>
                  <select
                    className="find-doctor-select"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                  >
                    <option value="">All Locations</option>
                    {locationsList.map(loc => (
                      <option key={loc.id} value={loc.hospitalName}>
                        {loc.hospitalName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search Button */}
                <button
                  type="button"
                  className="btn-search-doctors"
                  onClick={handleSearchButtonClick}
                  disabled={isSearching}
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>

                {/* Clear filters if any filter is active */}
                {(searchQuery || selectedSpecialty || selectedLocation) && (
                  <button
                    type="button"
                    className="btn-reset-filters"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedSpecialty('');
                      setSelectedLocation('');
                    }}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: '#64748B',
                      fontSize: '0.88rem',
                      fontWeight: '600',
                      marginTop: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Reset all filters
                  </button>
                )}
              </form>
            </aside>

            {/* ========================================================
                RIGHT COLUMN: DOCTOR CARDS LIST
               ======================================================== */}
            <main className="doctors-list-section">
              <div className="doctors-list-header">
                <span className="doctors-count-text">
                  Showing {filteredDoctors.length} available {filteredDoctors.length === 1 ? 'specialist' : 'specialists'}
                </span>
              </div>

              {isSearching ? (
                <div className="card border-0 p-5 text-center bg-white rounded-4">
                  <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <h5 className="fw-bold text-muted">Searching doctors...</h5>
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="card border-0 p-5 text-center bg-white rounded-4">
                  <i className="fas fa-user-md fs-1 text-muted mb-3"></i>
                  <h5 className="fw-bold">No doctors found</h5>
                  <p className="text-muted small mb-3">Try adjusting your search criteria, specialty, or location.</p>
                  <button
                    className="btn btn-outline-primary mx-auto"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedSpecialty('');
                      setSelectedLocation('');
                    }}
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                filteredDoctors.map((doc) => (
                  <div className="doctor-card" key={doc.id}>
                    {/* Doctor Left Info: Avatar + Details */}
                    <div className="doctor-card-left">
                      <div className="doctor-avatar-wrapper">
                        <img
                          src={doc.avatar}
                          alt={doc.name}
                          className="doctor-avatar-img"
                          onError={(e) => {
                            e.target.src = 'https://i.postimg.cc/k47Z6t44/default-doctor.png';
                          }}
                        />
                        <span className="doctor-online-badge" title="Available for appointments"></span>
                      </div>

                      <div className="doctor-primary-details">
                        <h3 className="doctor-name-title">{doc.name}</h3>
                        <p className="doctor-specialty-link">{doc.specialty} • {doc.degrees}</p>
                        <p className="doctor-location-text">
                          <i className="fas fa-map-marker-alt text-muted"></i> {doc.location} • {doc.experience}
                        </p>
                    
                      </div>
                    </div>

                    {/* Doctor Right Info: Fee + Book Appointment Button */}
                    <div className="doctor-card-right">
                      <div className="doctor-fee-box">
                        <div className="doctor-fee-amount">₹{doc.fee.toLocaleString()}</div>
                        <div className="doctor-fee-label">Consultation Fee</div>
                      </div>

                      {/* CHANGED FROM "View Slots" to "Book Appointment" */}
                      <button
                        type="button"
                        className="btn-view-slots"
                        onClick={() => handleSelectDoctorForBooking(doc)}
                      >
                        Book Appointment
                      </button>
                    </div>
                  </div>
                ))
              )}
            </main>
          </div>
        </div>
      )}

      {/* VIEW 2: BOOK OPD CONSULTATION (MATCHING THE REFERENCE DESIGN EXACTLY) */}
      {viewMode === 'details' && (
        <main className="container-fluid px-3 px-xl-5 py-3 py-lg-4 flex-grow-1">
          <div className="row g-3 g-lg-4">
            {/* Left Sidebar: Search Doctor Filter Card */}
            <div className="col-12 col-md-4 col-lg-3">
              <aside className="find-doctor-card">
                <div className="find-doctor-header">
                  <h2 className="find-doctor-title">
                    Find a Doctor <span className="find-doctor-indicator"></span>
                  </h2>
                </div>

                <form onSubmit={(e) => e.preventDefault()} className="find-doctor-form">
                  {/* Search by doctor name or condition */}
                  <div className="find-doctor-group">
                    <label className="find-doctor-label">Search</label>
                    <input
                      type="text"
                      className="find-doctor-input"
                      placeholder="Doctor name or condition..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Specialty Dropdown */}
                  <div className="find-doctor-group">
                    <label className="find-doctor-label">Specialty</label>
                    <select
                      className="find-doctor-select"
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value)}
                      disabled={isSearching}
                    >
                      <option value="">{isSearching ? 'Loading...' : 'All Specialties'}</option>
                      {specialtiesList.length > 0 && (
                        specialtiesList.map(spec => (
                          <option key={spec.specialityId} value={spec.specialityId}>
                            {spec.specialityName}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Location Dropdown */}
                  <div className="find-doctor-group">
                    <label className="find-doctor-label">Location</label>
                    <select
                      className="find-doctor-select"
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                      <option value="">All Locations</option>
                      {locationsList.map(loc => (
                        <option key={loc.id} value={loc.hospitalName}>
                          {loc.hospitalName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Search Button */}
                  <button
                    type="button"
                    className="btn-search-doctors"
                    onClick={() => {
                      handleSearchButtonClick();
                      setViewMode('listing');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={isSearching}
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>

                  {/* Clear filters if any filter is active */}
                  {(searchQuery || selectedSpecialty || selectedLocation) && (
                    <button
                      type="button"
                      className="btn-reset-filters"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedSpecialty('');
                        setSelectedLocation('');
                      }}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        color: '#64748B',
                        fontSize: '0.88rem',
                        fontWeight: '600',
                        marginTop: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Reset all filters
                    </button>
                  )}
                </form>
              </aside>
            </div>

            {/* Right Section: Doctor Profile + Booking Details */}
            <div className="col-12 col-md-8 col-lg-9">
              {/* Header with Title and "Change Doctor" link */}
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold text-dark mb-1">Book OPD Consultation</h5>
                  <p className="text-secondary small mb-0">Find a doctor, select your appointment details and proceed to payment.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode('listing')}
                  className="btn btn-link text-primary text-decoration-none fw-semibold p-0 d-inline-flex align-items-center gap-1 shadow-none"
                  style={{ fontSize: '0.9rem' }}
                >
                  <i className="fa-solid fa-arrow-left me-1"></i> Change Doctor
                </button>
              </div>

              {isDoctorDetailsLoading ? (
                <div className="card border border-light-subtle rounded-3 bg-white p-5 shadow-sm h-100 d-flex justify-content-center align-items-center text-center">
                  <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <h5 className="fw-bold text-muted">Fetching doctor details...</h5>
                </div>
              ) : (
              <div className="row g-3">
                {/* Left Column: Doctor Profile & Details */}
                <div className="col-12 col-lg-6">
                  <div className="card border border-light-subtle rounded-3 bg-white p-4 shadow-sm h-100">
                    {/* Doctor Top Header Info */}
                    <div className="d-flex gap-3 mb-3">
                      <img
                        src={selectedDoctor.avatar}
                        alt={selectedDoctor.name}
                        className="rounded-3 shadow-sm border border-light-subtle"
                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src = 'https://i.postimg.cc/k47Z6t44/default-doctor.png';
                        }}
                      />
                      <div className="flex-grow-1">
                        <h5 className="fw-bold text-dark mb-1">{selectedDoctor.name}</h5>
                        <div className="text-secondary fw-semibold small mb-1">{selectedDoctor.specialty}</div>
                        <div className="text-muted small mb-2">{selectedDoctor.degrees}</div>

                        <div className="d-flex flex-column gap-1 small text-muted">
                          <div className="d-flex align-items-center gap-1 text-secondary">
                            <i className="fa-solid fa-briefcase text-primary small"></i>
                            <span>{selectedDoctor.experience}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Doctor Attributes Grid */}
                    <div className="row g-3 py-2 border-top border-bottom border-light-subtle my-2">
                      {/* Specialty */}
                      <div className="col-6">
                        <div className="d-flex align-items-start gap-2">
                          <i className="fa-regular fa-hospital text-primary mt-1"></i>
                          <div>
                            <span className="text-muted small d-block" style={{ fontSize: '0.78rem' }}>Specialty</span>
                            <strong className="text-dark small">{selectedDoctor.specialty.replace(' Specialist', '')}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="col-6">
                        <div className="d-flex align-items-start gap-2">
                          <i className="fa-solid fa-location-dot text-primary mt-1"></i>
                          <div>
                            <span className="text-muted small d-block" style={{ fontSize: '0.78rem' }}>Location</span>
                            <strong className="text-dark small">{selectedDoctor.location}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Languages Spoken */}
                      <div className="col-12">
                        <div className="d-flex align-items-start gap-2">
                          <i className="fa-regular fa-comments text-primary mt-1"></i>
                          <div>
                            <span className="text-muted small d-block mb-1" style={{ fontSize: '0.78rem' }}>Languages Spoken</span>
                            <div className="d-flex flex-wrap gap-1">
                              {(selectedDoctor.languages || ['English', 'Hindi']).map((lang) => (
                                <span key={lang} className="badge bg-primary bg-opacity-10 text-primary fw-normal px-2.5 py-1 rounded-pill" style={{ fontSize: '0.78rem' }}>
                                  {lang}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Consultation Fee */}
                      <div className="col-6">
                        <div className="d-flex align-items-start gap-2">
                          <i className="fa-solid fa-indian-rupee-sign text-primary mt-1"></i>
                          <div>
                            <span className="text-muted small d-block" style={{ fontSize: '0.78rem' }}>Consultation Fee</span>
                            <h5 className="fw-bold text-dark mb-0">₹{selectedDoctor.fee.toLocaleString()}</h5>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* About Section */}
                    <div className="mt-3">
                      <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '0.92rem' }}>About</h6>
                      <p className="text-secondary small lh-base mb-3">
                        {selectedDoctor.about || 'Experienced medical specialist committed to providing compassionate care and evidence-based treatment to patients of all age groups.'}
                      </p>

                      {/* Areas of Expertise */}
                      <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '0.92rem' }}>Areas of Expertise</h6>
                      <ul className="text-secondary small ps-3 mb-3">
                        {(selectedDoctor.expertise || ['Head & Neck Surgery', 'Sinus Disorders', 'Pediatric Care', 'Hearing Disorders']).map((item, idx) => (
                          <li key={idx} className="mb-0.5">{item}</li>
                        ))}
                      </ul>

                      {/* Education */}
                      <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '0.92rem' }}>Education</h6>
                      <ul className="text-secondary small ps-3 mb-3">
                        {(selectedDoctor.education || ['MBBS – AIIMS, New Delhi', 'MD – AIIMS, New Delhi']).map((item, idx) => (
                          <li key={idx} className="mb-0.5">{item}</li>
                        ))}
                      </ul>

                      {/* Memberships */}
                      <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '0.92rem' }}>Memberships</h6>
                      <ul className="text-secondary small ps-3 mb-0">
                        {(selectedDoctor.memberships || ['Association of Otolaryngologists of India (AOI)', 'Indian Medical Association (IMA)']).map((item, idx) => (
                          <li key={idx} className="mb-0.5">{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Right Column: Appointment Booking & Payment */}
                <div className="col-12 col-lg-6">
                  <div className="card border border-light-subtle rounded-3 bg-white p-4 shadow-sm h-100 d-flex flex-column justify-content-between">
                    <div>
                      {/* 1. Select Appointment Date & Time */}
                      <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '0.95rem' }}>Select Appointment Date & Time</h6>

                      {/* Date Carousel Row */}
                      <div id="appointment-date-section" className={`d-flex align-items-center gap-1 mb-3 ${validationErrors.date ? 'border border-danger rounded p-1' : ''}`}>
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
                                onClick={() => {
                                  setSelectedDate(item.full);
                                  setValidationErrors(prev => ({...prev, date: false}));
                                }}
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

                      {/* Session Dropdown */}
                      <div id="appointment-session-section" className="mb-3">
                        <label className={`form-label small mb-1 ${validationErrors.session ? 'text-danger fw-bold' : 'text-muted'}`}>Select Session</label>
                        <select
                          className={`form-select text-dark fw-medium ${validationErrors.session ? 'is-invalid border-danger' : 'border-light-subtle'}`}
                          value={selectedSessionId}
                          onChange={(e) => {
                            setSelectedSessionId(e.target.value);
                            setValidationErrors(prev => ({...prev, session: false}));
                          }}
                          style={{ fontSize: '0.88rem' }}
                        >
                          <option value="">All Sessions</option>
                          {opdSessionsList.map(session => (
                            <option key={session.id} value={session.id}>
                              {session.sessionName} ({session.fromTime ? session.fromTime.substring(0, 5) : ''} - {session.endTime ? session.endTime.substring(0, 5) : ''})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Available Time Slots Header */}
                      <div className="small fw-semibold text-dark mb-2">
                        Available Time Slots – {selectedDate} 2026
                      </div>

                      {/* Time Slots Grid */}
                      <div id="appointment-timeslot-section" className={`d-flex flex-wrap gap-2 mb-2 ${validationErrors.timeSlot ? 'border border-danger rounded p-2' : ''}`}>
                        {isTimeSlotsLoading ? (
                          <div className="w-100 text-center py-3">
                            <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                            <span className="small text-muted">Fetching time slots...</span>
                          </div>
                        ) : timeSlotsRow1.length > 0 || timeSlotsRow2.length > 0 ? (
                          <>
                            {timeSlotsRow1.map((slot) => {
                              const isSelected = selectedTimeSlot === slot;
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => {
                                    setSelectedTimeSlot(slot);
                                    setValidationErrors(prev => ({...prev, timeSlot: false}));
                                  }}
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
                            {timeSlotsRow2.length > 0 && (
                              <div className="w-100 m-0"></div> // line break if needed, but flex-wrap handles it
                            )}
                            {timeSlotsRow2.map((slot) => {
                              const isSelected = selectedTimeSlot === slot;
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => {
                                    setSelectedTimeSlot(slot);
                                    setValidationErrors(prev => ({...prev, timeSlot: false}));
                                  }}
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
                          </>
                        ) : (
                          <div className="text-muted small">No time slots available for this date.</div>
                        )}
                      </div>

                      <hr className="my-3 border-light-subtle" />

                      {/* 2. Patient Details */}
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.95rem' }}>Patient Details</h6>
                        <button
                          type="button"
                          className="btn btn-link text-primary text-decoration-none fw-semibold p-0 small"
                          onClick={() => alert('Add Family Member')}
                        >
                          + Add New Patient
                        </button>
                      </div>

                      <div className="mb-2">
                        <label className="form-label small text-muted mb-1">Select Patient</label>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text bg-white border-end-0 text-muted">
                            <i className="fa-regular fa-user"></i>
                          </span>
                          <select
                            className="form-select border-start-0 text-dark fw-medium"
                            value={selectedPatient ? selectedPatient.id : ''}
                            onChange={(e) => {
                              const p = familyMembers.find(f => f.id == e.target.value);
                              if (p) setSelectedPatient(p);
                            }}
                            style={{ fontSize: '0.88rem' }}
                          >
                            {familyMembers.map(member => (
                              <option key={member.id} value={member.id}>
                                {member.name} ({member.relation})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Patient info strip */}
                      <div className="row g-2 py-2 border-bottom border-light-subtle mb-3 text-secondary small">
                        <div className="col-4">
                          <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Patient Name</span>
                          <strong className="text-dark">{selectedPatient ? selectedPatient.name : 'N/A'}</strong>
                        </div>
                        <div className="col-4">
                          <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Age / Gender</span>
                          <strong className="text-dark">{selectedPatient ? `${selectedPatient.age} / ${selectedPatient.gender}` : 'N/A'}</strong>
                        </div>
                        <div className="col-4">
                          <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Mobile Number</span>
                          <strong className="text-dark">{selectedPatient ? selectedPatient.mobileNo : 'N/A'}</strong>
                        </div>
                      </div>

                      <hr className="my-3 border-light-subtle" />

                      {/* 3. Appointment Summary */}
                      <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '0.95rem' }}>Appointment Summary</h6>
                      <div className="border border-light-subtle rounded-3 p-3 bg-light bg-opacity-50 small mb-3">
                        <div className="row g-2">
                          <div className="col-6">
                            <div className="d-flex align-items-center gap-2">
                              <i className="fa-solid fa-user-doctor text-primary"></i>
                              <div>
                                <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Doctor</span>
                                <strong className="text-dark">{selectedDoctor.name}</strong>
                              </div>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="d-flex align-items-center gap-2">
                              <i className="fa-solid fa-stethoscope text-primary"></i>
                              <div>
                                <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Specialty</span>
                                <strong className="text-dark">{selectedDoctor.specialty.replace(' Specialist', '')}</strong>
                              </div>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="d-flex align-items-center gap-2">
                              <i className="fa-regular fa-calendar-days text-primary"></i>
                              <div>
                                <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Date &amp; Time</span>
                                <strong className="text-dark">{selectedDate} 2026, {selectedTimeSlot}</strong>
                              </div>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="d-flex align-items-center gap-2">
                              <i className="fa-regular fa-user text-primary"></i>
                              <div>
                                <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Patient Name</span>
                                <strong className="text-dark">{selectedPatient ? selectedPatient.name : 'N/A'}</strong>
                              </div>
                            </div>
                          </div>
                          <div className="col-12 pt-2 border-top border-light-subtle d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-2">
                              <i className="fa-solid fa-receipt text-primary"></i>
                              <span className="text-muted">Consultation Fee</span>
                            </div>
                            <h5 className="fw-bold text-dark mb-0">₹{selectedDoctor.fee.toLocaleString()}</h5>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 4. Action Buttons */}
                    <div className="d-flex gap-3 pt-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary py-2.5 px-3 flex-grow-1 fw-semibold d-flex align-items-center justify-content-center gap-2"
                        onClick={() => handleOpenPayment('Pay at Hospital')}
                        disabled={loadingPaymentType !== null}
                      >
                        {loadingPaymentType === 'Pay at Hospital' ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            <span>Booking...</span>
                          </>
                        ) : (
                          <>
                            <i className="fa-regular fa-file-lines"></i>
                            <span>Pay at Hospital</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary py-2.5 px-3 flex-grow-1 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
                        onClick={() => handleOpenPayment('Pay Now')}
                        disabled={loadingPaymentType !== null}
                      >
                        {loadingPaymentType === 'Pay Now' ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <i className="fa-regular fa-credit-card"></i>
                            <span>Pay Now</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* Confirmation & Payment Modal */}
      {showConfirmationModal && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom py-3 px-4 bg-light rounded-top-4">
                <h5 className="modal-title fw-bold text-dark mb-0">
                  Appointment Confirmed!
                </h5>
                <button
                  type="button"
                  className="btn-close shadow-none"
                  aria-label="Close"
                  onClick={() => setShowConfirmationModal(false)}
                ></button>
              </div>

              <div className="modal-body p-4 text-center">
                <div
                  className="mx-auto rounded-circle d-flex align-items-center justify-content-center text-white mb-3"
                  style={{ width: '60px', height: '60px', background: '#10B981', fontSize: '1.5rem' }}
                >
                  <i className="fa-solid fa-check"></i>
                </div>
                <h5 className="fw-bold text-dark mb-1">Booking Successful</h5>
                <p className="text-secondary small mb-3">
                  Your appointment has been registered with <strong>{selectedDoctor.name}</strong>.
                </p>

                <div className="border border-light-subtle rounded-3 p-3 bg-light text-start small mb-3">
                  <div className="d-flex justify-content-between py-1 border-bottom border-light-subtle">
                    <span className="text-muted">Appointment ID:</span>
                    <strong className="text-primary">{bookedDetails?.visits?.[0]?.id ? `ARI-OPD-${bookedDetails.visits[0].id}` : 'ARI-OPD-2026-9842'}</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom border-light-subtle">
                    <span className="text-muted">Token No:</span>
                    <strong className="text-dark">{bookedDetails?.visits?.[0]?.tokenNo || '#14'}</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom border-light-subtle">
                    <span className="text-muted">Department:</span>
                    <strong className="text-dark">{bookedDetails?.visits?.[0]?.departmentName || 'N/A'}</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom border-light-subtle">
                    <span className="text-muted">Date &amp; Time:</span>
                    <strong className="text-dark">{selectedDate} 2026, {bookedDetails?.visits?.[0]?.startTime ? bookedDetails.visits[0].startTime.substring(11,16) : selectedTimeSlot}</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom border-light-subtle">
                    <span className="text-muted">Doctor:</span>
                    <span className="text-dark">{bookedDetails?.visits?.[0]?.doctorName || selectedDoctor.name} ({selectedDoctor.specialty})</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom border-light-subtle">
                    <span className="text-muted">Patient Name</span>
                    <span className="text-dark">{bookedDetails?.patient?.fullName || (selectedPatient ? selectedPatient.name : 'N/A')}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1">
                    <span className="text-muted">Payment Mode:</span>
                    <strong className="text-success">{confirmedPaymentType} (₹{selectedDoctor.fee.toLocaleString()})</strong>
                  </div>
                </div>

                <div className="alert alert-info bg-info bg-opacity-10 border-0 text-dark small py-2 px-3 text-start mb-0">
                  <i className="fa-solid fa-circle-info text-info me-1"></i> An SMS and WhatsApp notification with your OPD Token #{bookedDetails?.visits?.[0]?.tokenNo || '14'} has been sent.
                </div>
              </div>

              <div className="modal-footer border-top py-3 px-4 bg-light rounded-bottom-4 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-light border px-3"
                  onClick={() => setShowConfirmationModal(false)}
                >
                  Close
                </button>
                <div className="d-flex gap-2">

                  <button
                    type="button"
                    className="btn btn-primary px-3"
                    onClick={() => {
                      setShowConfirmationModal(false);
                      navigate('/appointments');
                    }}
                  >
                    My Appointments
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
