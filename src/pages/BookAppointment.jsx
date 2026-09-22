import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { ENDPOINTS } from '../constants/apiEndpoints';

export default function BookAppointment({ defaultView = 'listing' }) {
  const navigate = useNavigate();

  // View mode: 'listing' (Find a Doctor + Doctors list) or 'details' (Book OPD Consultation page)
  const [viewMode, setViewMode] = useState(defaultView);

  // Doctors Database
  const allDoctors = [
    {
      id: 'doc-101',
      name: 'Dr. Rajeshwar Singhal',
      specialty: 'ENT Specialist',
      degrees: 'MBBS, MS (Otorhinolaryngology), DNB',
      location: 'Health Care Center, Noida',
      rating: 4.9,
      fee: 1100,
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400&h=400',
      gender: 'male',
      experience: '15 Years Experience',
      about: 'Dr. Rajeshwar Singhal is a distinguished Otorhinolaryngologist specializing in advanced endoscopic sinus surgery, micro-ear reconstruction, pediatric airway issues, and allergy-induced breathing disorders.',
      expertise: [
        'Endoscopic Sinus Surgery (FESS)',
        'Micro-Ear Surgery & Tympanoplasty',
        'Snoring & Sleep Apnea Care',
        'Allergy & Rhinitis Management'
      ],
      education: [
        'MBBS – Christian Medical College (CMC), Vellore',
        'MS (ENT) – Post Graduate Institute of Medical Education (PGIMER), Chandigarh',
        'Fellowship in Advanced Rhinology – University of Zurich'
      ],
      memberships: [
        'Association of Otolaryngologists of India (AOI)',
        'Indian Academy of Otolaryngology Head & Neck Surgery',
        'European Rhinologic Society'
      ],
      languages: ['English', 'Hindi']
    },
    {
      id: 'doc-102',
      name: 'Dr. Ananya Mukherjee',
      specialty: 'Cardiologist',
      degrees: 'MBBS, MD (Medicine), DM (Cardiology), FACC',
      location: 'ARI Hospital, Delhi',
      rating: 4.9,
      fee: 1500,
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400&h=400',
      gender: 'female',
      experience: '18 Years Experience',
      about: 'Dr. Ananya Mukherjee is a renowned senior interventional cardiologist with deep expertise in non-invasive clinical cardiology, transradial angioplasty, heart failure therapies, and advanced 3D echocardiography.',
      expertise: [
        'Coronary Angioplasty & Stenting',
        'Valvular Heart Disease Treatment',
        'Refractory Hypertension Management',
        'Preventive Cardiovascular Care'
      ],
      education: [
        'MBBS – Maulana Azad Medical College (MAMC), New Delhi',
        'MD (Medicine) – Lady Hardinge Medical College, New Delhi',
        'DM (Cardiology) – AIIMS, New Delhi'
      ],
      memberships: [
        'Fellow of the American College of Cardiology (FACC)',
        'Cardiological Society of India (CSI)',
        'Indian College of Cardiology'
      ],
      languages: ['English', 'Hindi', 'Bengali']
    },
    {
      id: 'doc-103',
      name: 'Dr. Vikramaditya Rathore',
      specialty: 'Dermatologist',
      degrees: 'MBBS, MD (Dermatology, Venereology & Leprosy)',
      location: 'Skin Care Clinic, Mumbai',
      rating: 4.8,
      fee: 950,
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400&h=400',
      gender: 'male',
      experience: '11 Years Experience',
      about: 'Dr. Vikramaditya Rathore is an expert consultant dermatologist specializing in clinical dermatology, targeted laser procedures, PRP hair restoration therapy, and biologics for chronic autoimmune skin conditions.',
      expertise: [
        'Clinical Dermatology & Eczema',
        'Laser Skin Resurfacing',
        'PRP Hair Restoration Therapy',
        'Pigmentation & Severe Acne Protocols'
      ],
      education: [
        'MBBS – Grant Government Medical College & Sir JJ Group of Hospitals, Mumbai',
        'MD (DVL) – King Edward Memorial (KEM) Hospital, Mumbai'
      ],
      memberships: [
        'Indian Association of Dermatologists, Venereologists and Leprologists (IADVL)',
        'Cosmetic Dermatology Society of India (CDSI)'
      ],
      languages: ['English', 'Hindi', 'Marathi']
    },
    {
      id: 'doc-104',
      name: 'Dr. Meenakshi Sundaram',
      specialty: 'General Physician',
      degrees: 'MBBS, MD (General Medicine), Dip. Diabetology',
      location: 'Noida',
      rating: 4.8,
      fee: 650,
      avatar: 'https://images.unsplash.com/photo-1594824813686-25f0e1f7c1d7?auto=format&fit=crop&q=80&w=400&h=400',
      gender: 'female',
      experience: '14 Years Experience',
      about: 'Dr. Meenakshi Sundaram is an accomplished physician focused on comprehensive adult medicine, diabetes reversal protocols, chronic lifestyle disorders, and infectious disease management.',
      expertise: [
        'Type 2 Diabetes & Insulin Therapy',
        'Hypertension & Lipid Disorders',
        'Thyroid Disorder Management',
        'Infectious Diseases & Fever Protocols'
      ],
      education: [
        'MBBS – Madras Medical College, Chennai',
        'MD (General Medicine) – JIPMER, Puducherry',
        'Diploma in Diabetology – Royal College of Physicians, UK'
      ],
      memberships: [
        'Association of Physicians of India (API)',
        'Research Society for the Study of Diabetes in India (RSSDI)',
        'Indian Medical Association (IMA)'
      ],
      languages: ['English', 'Hindi', 'Tamil']
    },
    {
      id: 'doc-105',
      name: 'Dr. Harpreet Singh Anand',
      specialty: 'Orthopedic',
      degrees: 'MBBS, MS (Orthopaedics), MCh (Ortho, UK)',
      location: 'City Hospital, Delhi',
      rating: 4.9,
      fee: 1250,
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400&h=400',
      gender: 'male',
      experience: '20 Years Experience',
      about: 'Dr. Harpreet Singh Anand is a senior orthopedic surgeon internationally recognized for robotic total joint replacements, arthroscopic sports surgeries, and spinal reconstructive procedures.',
      expertise: [
        'Robotic Knee & Hip Arthroplasty',
        'Arthroscopic ACL & Meniscus Repair',
        'Cervical & Lumbar Spine Disorders',
        'Complex Traumatic Fracture Fixation'
      ],
      education: [
        'MBBS – Government Medical College, Amritsar',
        'MS (Orthopedics) – AIIMS, New Delhi',
        'MCh (Orthopaedics) – University of Dundee, UK'
      ],
      memberships: [
        'Indian Orthopaedic Association (IOA)',
        'International Society of Arthroscopy, Knee Surgery and Orthopaedic Sports Medicine (ISAKOS)',
        'Delhi Orthopaedic Association (DOA)'
      ],
      languages: ['English', 'Hindi', 'Punjabi']
    }
  ];

  // Currently selected doctor for detailed booking
  const [selectedDoctor, setSelectedDoctor] = useState(allDoctors[0]);

  // Find a Doctor Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const [displayedDoctors, setDisplayedDoctors] = useState(allDoctors);
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
  const [isDoctorDetailsLoading, setIsDoctorDetailsLoading] = useState(false);

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
        options.push({
          day: shortDay,
          date: `${dateNum} ${monthStr}`,
          full: `${shortDay}, ${dateNum} ${monthStr}`,
          dayName: dayName
        });
      }
      date.setDate(date.getDate() + 1);
      daysAdded++;
    }
    return options;
  };

  useEffect(() => {
    if (!selectedDoctor || !selectedDoctor.sessions || !selectedDate) {
      setAvailableTimeSlots([]);
      return;
    }
    const selectedOption = dateOptions.find(d => d.full === selectedDate);
    if (!selectedOption) return;
    
    const daySessions = selectedDoctor.sessions.filter(s => {
      const matchDay = s.day === selectedOption.dayName;
      const matchSession = selectedSessionId ? s.sessionId === parseInt(selectedSessionId) : true;
      return matchDay && matchSession;
    });
    const slots = [];
    daySessions.forEach(session => {
       let start = new Date(`1970-01-01T${session.startTime}:00`);
       let end = new Date(`1970-01-01T${session.endTime}:00`);
       while(start < end) {
         let timeString = start.toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' });
         if (!slots.includes(timeString)) slots.push(timeString);
         start.setMinutes(start.getMinutes() + 30);
       }
    });
    
    slots.sort((a, b) => new Date(`1970-01-01 ${a}`) - new Date(`1970-01-01 ${b}`));
    setAvailableTimeSlots(slots);
    
    if (slots.length > 0) {
      setSelectedTimeSlot(slots[0]);
    } else {
      setSelectedTimeSlot('');
    }
  }, [selectedDate, selectedDoctor, dateOptions]);

  const timeSlotsRow1 = availableTimeSlots.slice(0, Math.ceil(availableTimeSlots.length / 2));
  const timeSlotsRow2 = availableTimeSlots.slice(Math.ceil(availableTimeSlots.length / 2));

  // Filter logic
  const filteredDoctors = hasSearched ? displayedDoctors.filter(doc => {
    const matchesLocation = !selectedLocation || doc.location.includes(selectedLocation);
    return matchesLocation;
  }) : allDoctors.filter(doc => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      doc.name.toLowerCase().includes(q) ||
      doc.specialty.toLowerCase().includes(q) ||
      doc.location.toLowerCase().includes(q);
    const matchesSpecialty = !selectedSpecialty || doc.specialty === selectedSpecialty;
    const matchesLocation = !selectedLocation || doc.location.includes(selectedLocation);
    return matchesSearch && matchesSpecialty && matchesLocation;
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

  const handleOpenPayment = (paymentType) => {
    setConfirmedPaymentType(paymentType);
    setShowConfirmationModal(true);
  };

  return (
    <div className="bg-light flex-grow-1 d-flex flex-column" style={{ backgroundColor: '#f8fafc' }}>
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
                  >
                    <option value="">All Specialties</option>
                    {specialtiesList.length > 0 ? (
                      specialtiesList.map(spec => (
                        <option key={spec.specialityId} value={spec.specialityId}>
                          {spec.specialityName}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="ENT Specialist">ENT Specialist</option>
                        <option value="Cardiologist">Cardiologist</option>
                        <option value="Dermatologist">Dermatologist</option>
                        <option value="General Physician">General Physician</option>
                        <option value="Orthopedic">Orthopedic</option>
                      </>
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

              {filteredDoctors.length === 0 ? (
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
                    >
                      <option value="">All Specialties</option>
                      {specialtiesList.length > 0 ? (
                        specialtiesList.map(spec => (
                          <option key={spec.specialityId} value={spec.specialityId}>
                            {spec.specialityName}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="ENT Specialist">ENT Specialist</option>
                          <option value="Cardiologist">Cardiologist</option>
                          <option value="Dermatologist">Dermatologist</option>
                          <option value="General Physician">General Physician</option>
                          <option value="Orthopedic">Orthopedic</option>
                        </>
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

              {/* Two Column Layout */}
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
                      <div className="d-flex align-items-center gap-1 mb-3">
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

                      {/* Session Dropdown */}
                      <div className="mb-3">
                        <label className="form-label small text-muted mb-1">Select Session</label>
                        <select
                          className="form-select border-light-subtle text-dark fw-medium"
                          value={selectedSessionId}
                          onChange={(e) => setSelectedSessionId(e.target.value)}
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
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        {timeSlotsRow1.length > 0 || timeSlotsRow2.length > 0 ? (
                          <>
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
                            {timeSlotsRow2.length > 0 && (
                              <div className="w-100 m-0"></div> // line break if needed, but flex-wrap handles it
                            )}
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
                      >
                        <i className="fa-regular fa-file-lines"></i>
                        <span>Pay at Hospital</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary py-2.5 px-3 flex-grow-1 fw-semibold d-flex align-items-center justify-content-center gap-2"
                        onClick={() => handleOpenPayment('Pay Now')}
                      >
                        <i className="fa-regular fa-credit-card"></i>
                        <span>Pay Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
                    <strong className="text-primary">ARI-OPD-2026-9842</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom border-light-subtle">
                    <span className="text-muted">Date &amp; Time:</span>
                    <strong className="text-dark">{selectedDate} 2026, {selectedTimeSlot}</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom border-light-subtle">
                    <span className="text-muted">Doctor:</span>
                    <span className="text-dark">{selectedDoctor.name} ({selectedDoctor.specialty})</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom border-light-subtle">
                    <span className="text-muted">Patient Name</span>
                    <span className="text-dark">{selectedPatient ? selectedPatient.name : 'N/A'}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1">
                    <span className="text-muted">Payment Mode:</span>
                    <strong className="text-success">{confirmedPaymentType} (₹{selectedDoctor.fee.toLocaleString()})</strong>
                  </div>
                </div>

                <div className="alert alert-info bg-info bg-opacity-10 border-0 text-dark small py-2 px-3 text-start mb-0">
                  <i className="fa-solid fa-circle-info text-info me-1"></i> An SMS and WhatsApp notification with your OPD Token #14 has been sent.
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
                    className="btn btn-outline-primary px-3"
                    onClick={() => window.print()}
                  >
                    <i className="fa-solid fa-print me-1"></i> Print Slip
                  </button>
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
