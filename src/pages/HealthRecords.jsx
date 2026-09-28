import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { ENDPOINTS } from '../constants/apiEndpoints';
import PdfViewer from '../components/PdfViewer';

export default function HealthRecords() {
  const [activeTab, setActiveTab] = useState('opd-prescriptions');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfName, setPdfName] = useState('');

  // Filters state
  const [opdSpecialtyFilter, setOpdSpecialtyFilter] = useState('All Specialties');
  const [labSearchQuery, setLabSearchQuery] = useState('');
  const [radModalityFilter, setRadModalityFilter] = useState('All Modalities');
  const [radStatusFilter, setRadStatusFilter] = useState('All');
  const [ipdLabSearchQuery, setIpdLabSearchQuery] = useState('');

  // Sidebar Menu Items matching the reference design
  const menuItems = [
    { id: 'opd-prescriptions', label: 'OPD & Prescriptions', icon: 'fa-regular fa-clipboard' },
    { id: 'lab-reports', label: 'Lab Reports', icon: 'fa-solid fa-flask' },
    { id: 'radiology-reports', label: 'Radiology Reports', icon: 'fa-solid fa-x-ray' },
    { id: 'ipd-lab-reports', label: 'IPD Lab Reports', icon: 'fa-regular fa-calendar-check' },
    { id: 'discharge-summaries', label: 'Discharge Summaries', icon: 'fa-regular fa-file-lines' },
  ];

  // 1. OPD & Prescriptions State
  const [opdData, setOpdData] = useState([]);
  const [opdPage, setOpdPage] = useState(0);
  const [opdTotalElements, setOpdTotalElements] = useState(0);
  const [opdLoading, setOpdLoading] = useState(false);
  const opdPageSize = 5;

  useEffect(() => {
    if (activeTab === 'opd-prescriptions') {
      const fetchOpdReports = async () => {
        setOpdLoading(true);
        try {
          const hospitalStr = localStorage.getItem('selectedHospital');
          let hospitalId = 12;
          if (hospitalStr) {
             const parsed = JSON.parse(hospitalStr);
             if (parsed && parsed.id) hospitalId = parsed.id;
          }
          
          const activeData = localStorage.getItem('patientDetails');
          let patientId = null;
          if (activeData) {
             const parsedActive = JSON.parse(activeData);
             if (parsedActive && parsedActive.patientId) patientId = parsedActive.patientId;
          }
          
          if (!patientId || !hospitalId) {
             setOpdLoading(false);
             return;
          }

          const res = await apiService.get(`${ENDPOINTS.APPOINTMENTS.OPD_REPORTS_LIST}?page=${opdPage}&size=${opdPageSize}&hospitalId=${hospitalId}&patientId=${patientId}`);
          
          if (res && res.response && res.response.content) {
            const mappedData = res.response.content.map(item => {
              let date = item.visitDateTime || 'N/A';
              if (date.includes(' ')) date = date.split(' ')[0];
              
              return {
                id: item.visitId || Math.random().toString(),
                date: date,
                doctor: item.doctorName || 'Not Assigned',
                specialty: item.specialty || 'General',
                reason: item.departmentName || 'Consultation',
                vitals: { bp: 'N/A', pulse: 'N/A', temp: 'N/A', spo2: 'N/A' },
                medicines: [],
                instructions: 'N/A',
                nisNo: item.nisNo,
                prescriptionStatus: item.prescriptionStatus,
                prescriptionHdId: item.prescriptionHdId,
                raw: item
              };
            });
            setOpdData(mappedData);
            setOpdTotalElements(res.response.totalElements || mappedData.length);
          } else {
             setOpdData([]);
             setOpdTotalElements(0);
          }
        } catch (error) {
          console.error("Failed to fetch OPD reports:", error);
        } finally {
          setOpdLoading(false);
        }
      };
      fetchOpdReports();
    }
  }, [activeTab, opdPage]);

  // 2. Lab Reports Mock Data
  const labData = [
    {
      id: 'lab-1',
      date: '25 Sep 2026',
      investigation: 'Complete Blood Count (CBC)',
      result: '12.5',
      unit: 'g/dL',
      range: '12.0 - 16.0',
      reportDate: '25 Sep 2026',
      status: 'Normal',
      subTests: [
        { name: 'Hemoglobin', value: '12.5', unit: 'g/dL', range: '12.0 - 16.0', status: 'Normal' },
        { name: 'Total Leucocyte Count (TLC)', value: '6,800', unit: '/cu mm', range: '4,000 - 11,000', status: 'Normal' },
        { name: 'Platelet Count', value: '2.4', unit: 'Lakh/cu mm', range: '1.5 - 4.5', status: 'Normal' },
        { name: 'RBC Count', value: '4.3', unit: 'mill/cu mm', range: '3.8 - 5.2', status: 'Normal' }
      ]
    },
    {
      id: 'lab-2',
      date: '18 Aug 2026',
      investigation: 'Thyroid Profile (T3, T4, TSH)',
      result: '2.8',
      unit: 'µIU/mL',
      range: '0.4 - 4.0',
      reportDate: '19 Aug 2026',
      status: 'Normal',
      subTests: [
        { name: 'Total Triiodothyronine (T3)', value: '1.2', unit: 'ng/mL', range: '0.8 - 2.0', status: 'Normal' },
        { name: 'Total Thyroxine (T4)', value: '7.9', unit: 'µg/dL', range: '5.1 - 14.1', status: 'Normal' },
        { name: 'Thyroid Stimulating Hormone (TSH)', value: '2.8', unit: 'µIU/mL', range: '0.4 - 4.0', status: 'Normal' }
      ]
    },
    {
      id: 'lab-3',
      date: '05 Jul 2026',
      investigation: 'Liver Function Test (LFT)',
      result: '42',
      unit: 'U/L',
      range: '10 - 50',
      reportDate: '06 Jul 2026',
      status: 'Normal',
      subTests: [
        { name: 'SGOT / AST', value: '34', unit: 'U/L', range: '10 - 45', status: 'Normal' },
        { name: 'SGPT / ALT', value: '42', unit: 'U/L', range: '10 - 50', status: 'Normal' },
        { name: 'Bilirubin Total', value: '0.8', unit: 'mg/dL', range: '0.2 - 1.2', status: 'Normal' },
        { name: 'Serum Alkaline Phosphatase', value: '92', unit: 'U/L', range: '30 - 120', status: 'Normal' }
      ]
    },
    {
      id: 'lab-4',
      date: '12 Jun 2026',
      investigation: 'Kidney Function Test (KFT)',
      result: '1.3',
      unit: 'mg/dL',
      range: '0.6 - 1.2',
      reportDate: '13 Jun 2026',
      status: 'Borderline High',
      subTests: [
        { name: 'Blood Urea', value: '28', unit: 'mg/dL', range: '15 - 40', status: 'Normal' },
        { name: 'Serum Creatinine', value: '1.3', unit: 'mg/dL', range: '0.6 - 1.2', status: 'High' },
        { name: 'Serum Uric Acid', value: '5.4', unit: 'mg/dL', range: '3.5 - 7.2', status: 'Normal' }
      ]
    },
    {
      id: 'lab-5',
      date: '15 Mar 2026',
      investigation: 'Lipid Profile',
      result: '210',
      unit: 'mg/dL',
      range: '< 200',
      reportDate: '16 Mar 2026',
      status: 'Borderline High',
      subTests: [
        { name: 'Total Cholesterol', value: '210', unit: 'mg/dL', range: '< 200', status: 'High' },
        { name: 'HDL Cholesterol', value: '46', unit: 'mg/dL', range: '> 40', status: 'Normal' },
        { name: 'LDL Cholesterol', value: '132', unit: 'mg/dL', range: '< 100', status: 'High' },
        { name: 'Triglycerides', value: '158', unit: 'mg/dL', range: '< 150', status: 'Borderline' }
      ]
    },
  ];

  // 3. Radiology Reports Mock Data
  const radiologyData = [
    {
      id: 'rad-1',
      studyDate: '22 Sep 2026',
      investigation: 'X-Ray Chest (PA View)',
      modality: 'X-Ray',
      reportDate: '22 Sep 2026',
      status: 'Completed',
      findings: 'Both lung fields are clear. No focal consolidation, pneumothorax, or pleural effusion. Cardiac silhouette is within normal limits. Both costophrenic angles are sharp.',
      impression: 'Normal study of chest (PA View).'
    },
    {
      id: 'rad-2',
      studyDate: '30 Jul 2026',
      investigation: 'Ultrasound Abdomen',
      modality: 'Ultrasound',
      reportDate: '31 Jul 2026',
      status: 'Completed',
      findings: 'Liver is normal in size and echotexture. Gall bladder is normal without calculi. Spleen, pancreas, and both kidneys appear normal in size, shape, and parenchymal echogenicity.',
      impression: 'No significant intra-abdominal pathology detected.'
    },
    {
      id: 'rad-3',
      studyDate: '15 May 2026',
      investigation: 'MRI Brain',
      modality: 'MRI',
      reportDate: '16 May 2026',
      status: 'Pending',
      findings: 'Scans acquired under protocol T1, T2, FLAIR, and DWI sequences. Awaiting final senior consultant radiologist sign-off.',
      impression: 'Report under review and validation.'
    },
    {
      id: 'rad-4',
      studyDate: '02 Mar 2026',
      investigation: 'CT Scan - Chest',
      modality: 'CT',
      reportDate: '03 Mar 2026',
      status: 'Completed',
      findings: 'HRCT chest sections show normal bronchovascular markings. No ground-glass opacities, cavitation, or mediastinal lymphadenopathy noted.',
      impression: 'Unremarkable HRCT chest examination.'
    },
    {
      id: 'rad-5',
      studyDate: '10 Jan 2026',
      investigation: 'Mammography',
      modality: 'Mammography',
      reportDate: '11 Jan 2026',
      status: 'Drafted',
      findings: 'Bilateral digital mammography views obtained. Preliminary observations drafted.',
      impression: 'BI-RADS Category 1 - Negative.'
    },
  ];

  // 4. IPD Lab Reports Mock Data
  const ipdLabData = [
    {
      id: 'ipd-lab-1',
      date: '14 Aug 2026',
      investigation: 'Complete Blood Count (CBC)',
      result: '11.8',
      unit: 'g/dL',
      range: '12.0 - 16.0',
      reportDate: '14 Aug 2026',
      status: 'Borderline Low',
      subTests: [
        { name: 'Hemoglobin', value: '11.8', unit: 'g/dL', range: '12.0 - 16.0', status: 'Borderline Low' },
        { name: 'Total Leucocyte Count (TLC)', value: '7,400', unit: '/cu mm', range: '4,000 - 11,000', status: 'Normal' },
        { name: 'Platelet Count', value: '2.1', unit: 'Lakh/cu mm', range: '1.5 - 4.5', status: 'Normal' }
      ]
    },
    {
      id: 'ipd-lab-2',
      date: '14 Aug 2026',
      investigation: 'Serum Creatinine',
      result: '1.5',
      unit: 'mg/dL',
      range: '0.6 - 1.2',
      reportDate: '14 Aug 2026',
      status: 'Elevated',
      subTests: [
        { name: 'Serum Creatinine', value: '1.5', unit: 'mg/dL', range: '0.6 - 1.2', status: 'Elevated' }
      ]
    },
    {
      id: 'ipd-lab-3',
      date: '15 Aug 2026',
      investigation: 'Serum Sodium',
      result: '138',
      unit: 'mEq/L',
      range: '135 - 145',
      reportDate: '15 Aug 2026',
      status: 'Normal',
      subTests: [
        { name: 'Serum Sodium (Na+)', value: '138', unit: 'mEq/L', range: '135 - 145', status: 'Normal' }
      ]
    },
    {
      id: 'ipd-lab-4',
      date: '15 Aug 2026',
      investigation: 'Serum Potassium',
      result: '4.2',
      unit: 'mEq/L',
      range: '3.5 - 5.0',
      reportDate: '15 Aug 2026',
      status: 'Normal',
      subTests: [
        { name: 'Serum Potassium (K+)', value: '4.2', unit: 'mEq/L', range: '3.5 - 5.0', status: 'Normal' }
      ]
    },
    {
      id: 'ipd-lab-5',
      date: '16 Aug 2026',
      investigation: 'C-Reactive Protein (CRP)',
      result: '8.2',
      unit: 'mg/L',
      range: '< 5.0',
      reportDate: '16 Aug 2026',
      status: 'Elevated',
      subTests: [
        { name: 'Quantitative CRP', value: '8.2', unit: 'mg/L', range: '< 5.0', status: 'Elevated' }
      ]
    },
  ];

  // 5. Discharge Summaries Mock Data
  const dischargeData = [
    {
      id: 'ds-1',
      admissionNo: 'IPD20260078',
      admissionDate: '10 Aug 2026',
      dischargeDate: '16 Aug 2026',
      department: 'General Medicine',
      doctor: 'Dr. Priya Sharma',
      diagnosis: 'Acute Enteric Infection with Moderate Dehydration',
      totalBill: '₹ 48,250',
      insurancePaid: '₹ 42,000',
      patientPaid: '₹ 6,250',
      roomType: 'Semi-Private Deluxe (Room 304)',
      procedure: 'IV fluid hydration, broad-spectrum antibiotic coverage, electrolyte correction'
    },
    {
      id: 'ds-2',
      admissionNo: 'IPD20260056',
      admissionDate: '12 Mar 2026',
      dischargeDate: '18 Mar 2026',
      department: 'Orthopedics',
      doctor: 'Dr. Rajesh Kumar',
      diagnosis: 'Right Knee Arthroscopic Meniscal Repair',
      totalBill: '₹ 86,400',
      insurancePaid: '₹ 75,000',
      patientPaid: '₹ 11,400',
      roomType: 'Private Room (Room 212)',
      procedure: 'Diagnostic and operative knee arthroscopy, partial meniscectomy'
    },
    {
      id: 'ds-3',
      admissionNo: 'IPD20260021',
      admissionDate: '05 Jan 2026',
      dischargeDate: '12 Jan 2026',
      department: 'Urology',
      doctor: 'Dr. Amit Kumar',
      diagnosis: 'Left Ureteric Calculus (8mm) - Hydronephrosis',
      totalBill: '₹ 72,100',
      insurancePaid: '₹ 65,000',
      patientPaid: '₹ 7,100',
      roomType: 'Private Room (Room 118)',
      procedure: 'Left Ureterorenoscopy (URS) with Laser Lithotripsy & DJ Stenting'
    },
    {
      id: 'ds-4',
      admissionNo: 'IPD20250098',
      admissionDate: '20 Nov 2025',
      dischargeDate: '28 Nov 2025',
      department: 'Cardiology',
      doctor: 'Dr. Sarah Johnson',
      diagnosis: 'Unstable Angina - Coronary Artery Disease',
      totalBill: '₹ 1,35,000',
      insurancePaid: '₹ 1,20,000',
      patientPaid: '₹ 15,000',
      roomType: 'ICU (3 Days) + Deluxe Room (5 Days)',
      procedure: 'Coronary Angiography followed by PTCA with DES to LAD'
    },
  ];

  // Filtering helpers
  const filteredOpd = opdData.filter(item => {
    if (opdSpecialtyFilter === 'All Specialties') return true;
    return item.specialty.toLowerCase() === opdSpecialtyFilter.toLowerCase();
  });

  const filteredLab = labData.filter(item => {
    if (!labSearchQuery.trim()) return true;
    return item.investigation.toLowerCase().includes(labSearchQuery.toLowerCase());
  });

  const filteredRadiology = radiologyData.filter(item => {
    const matchModality = radModalityFilter === 'All Modalities' || item.modality.toLowerCase() === radModalityFilter.toLowerCase();
    const matchStatus = radStatusFilter === 'All' || item.status.toLowerCase() === radStatusFilter.toLowerCase();
    return matchModality && matchStatus;
  });

  const filteredIpdLab = ipdLabData.filter(item => {
    if (!ipdLabSearchQuery.trim()) return true;
    return item.investigation.toLowerCase().includes(ipdLabSearchQuery.toLowerCase());
  });

  // Modal open trigger
  const handleOpenDoc = (type, record) => {
    setSelectedDoc({ type, record });
    setShowModal(true);
  };

  const handleDownloadOpdSlip = async (record) => {
    setDownloadingId(`${record.id}-opd`);
    try {
      const visitId = record.id;
      const endpoint = `${ENDPOINTS.APPOINTMENTS.OPD_CASE_SHEET_REPORT}?visitId=${visitId}&flag=D`;
      const blob = await apiService.getPdf(endpoint);
      
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfName(`OPD Slip - ${record.date}`);
    } catch (error) {
      console.error("Failed to fetch OPD Slip PDF", error);
      alert("Failed to load PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadPrescriptionSlip = async (record) => {
    if (!record.prescriptionHdId) {
      alert("Prescription ID not found for this visit.");
      return;
    }
    setDownloadingId(`${record.id}-rx`);
    try {
      const endpoint = `${ENDPOINTS.APPOINTMENTS.OPD_PRESCRIPTION_SLIP}?prescriptionId=${record.prescriptionHdId}&flag=D`;
      const blob = await apiService.getPdf(endpoint);
      
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfName(`Prescription - ${record.date}`);
    } catch (error) {
      console.error("Failed to fetch Prescription Slip PDF", error);
      alert("Failed to load PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadNisSlip = async (record) => {
    if (!record.nisNo) {
      alert("NIS Number not found for this visit.");
      return;
    }
    setDownloadingId(`${record.id}-nis`);
    try {
      const hospitalStr = localStorage.getItem('selectedHospital');
      let hospitalId = 12;
      if (hospitalStr) {
         const parsed = JSON.parse(hospitalStr);
         if (parsed && parsed.id) hospitalId = parsed.id;
      }
      
      const endpoint = `${ENDPOINTS.APPOINTMENTS.NIS_MEDICINE_REPORT}?hospitalId=${hospitalId}&visitId=${record.id}&flag=D`;
      const blob = await apiService.getPdf(endpoint);
      
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfName(`NIS Slip - ${record.date}`);
    } catch (error) {
      console.error("Failed to fetch NIS Slip PDF", error);
      alert("Failed to load PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownload = async () => {
    if (!selectedDoc) return;
    setIsDownloading(true);
    // Simulate generic download for modal
    setTimeout(() => {
      setIsDownloading(false);
      setDownloadSuccessToast(true);
      setTimeout(() => {
        setDownloadSuccessToast(false);
      }, 3000);
    }, 1000);
  };

  return (
    <div className="bg-light flex-grow-1 d-flex flex-column" style={{ backgroundColor: '#f8fafc' }}>
      {/* Main Content Area */}
      <main className="container-fluid px-3 px-xl-5 py-3 py-lg-4 flex-grow-1">
        <div className="row g-3 g-lg-4">
          {/* Left Menu Sidebar */}
          <div className="col-12 col-md-4 col-lg-3">
            <div className="card border border-light-subtle shadow-sm rounded-3 bg-white p-2 mb-3">
              <div className="d-flex align-items-center gap-2 p-2 border-bottom border-light-subtle text-dark">
                <i className="fa-regular fa-clipboard fs-5 text-primary"></i>
                <h6 className="fw-bold mb-0">Health Records</h6>
              </div>

              <div className="nav flex-column gap-1 pt-2">
                {menuItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`btn d-flex align-items-center w-100 text-start py-2.5 px-3 rounded-2 ${
                        isActive
                          ? 'bg-primary text-white fw-semibold rounded-2 shadow-sm'
                          : 'text-secondary bg-transparent fw-medium border-0'
                      }`}
                      style={{
                        transition: 'all 0.15s ease',
                        fontSize: '0.92rem'
                      }}
                    >
                      <i className={`${item.icon} fs-6 me-3`} style={{ width: '20px', textAlign: 'center' }}></i>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Section / Table Content */}
          <div className="col-12 col-md-8 col-lg-9">
            {/* 1. OPD & Prescriptions View */}
            {activeTab === 'opd-prescriptions' && (
              <div>
                <div className="mb-3">
                  <h5 className="fw-bold text-dark mb-1">OPD & Prescriptions</h5>
                </div>

                {/* Filter Section */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark mb-1">Specialty</label>
                  <div className="input-group input-group-sm" style={{ maxWidth: '260px' }}>
                    <span className="input-group-text bg-white border-end-0 text-muted">
                      <i className="fa-regular fa-calendar"></i>
                    </span>
                    <select
                      className="form-select border-start-0 text-dark"
                      value={opdSpecialtyFilter}
                      onChange={(e) => setOpdSpecialtyFilter(e.target.value)}
                      style={{ fontSize: '0.88rem' }}
                    >
                      <option value="All Specialties">All Specialties</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="General Medicine">General Medicine</option>
                      <option value="ENT">ENT</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="Orthopedics">Orthopedics</option>
                    </select>
                  </div>
                </div>

                {/* Table with table-bordered, table-hover, align-middle */}
                <div className="table-responsive packagelist mb-2">
                  <table className="table table-bordered table-hover align-middle mb-0 bg-white">
                    <thead className="table-light">
                      <tr>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Visit Date</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Doctor</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Specialty</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Reason / Diagnosis</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOpd.map((item) => (
                        <tr key={item.id}>
                          <td className="  " style={{ fontSize: '0.88rem' }}>{item.date}</td>
                          <td className="  " style={{ fontSize: '0.88rem' }}>{item.doctor}</td>
                          <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.specialty}</td>
                          <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.reason}</td>
                          <td className="py-2.5 px-3 text-nowrap">
                            <div className="d-flex gap-2">
                              {item.nisNo && (
                                <button
                                  type="button"
                                  className="btn btn-outline-info btn-sm px-2.5 py-1 rounded-2 d-inline-flex align-items-center gap-1.5 fw-medium"
                                  style={{ fontSize: '0.8rem' }}
                                  onClick={() => handleDownloadNisSlip(item)}
                                  disabled={downloadingId === `${item.id}-nis`}
                                >
                                  {downloadingId === `${item.id}-nis` ? (
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                  ) : (
                                    <i className="fa-solid fa-file-invoice"></i>
                                  )}
                                  <span>NIS Slip</span>
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm px-2.5 py-1 rounded-2 d-inline-flex align-items-center gap-1.5 fw-medium"
                                style={{ fontSize: '0.8rem' }}
                                onClick={() => handleDownloadOpdSlip(item)}
                                disabled={downloadingId === `${item.id}-opd`}
                              >
                                {downloadingId === `${item.id}-opd` ? (
                                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                ) : (
                                  <i className="fa-regular fa-file-lines"></i>
                                )}
                                <span>OPD Slip</span>
                              </button>
                              {(item.prescriptionStatus === 'y' || item.prescriptionHdId) && (
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-sm px-2.5 py-1 rounded-2 d-inline-flex align-items-center gap-1.5 fw-medium"
                                  style={{ fontSize: '0.8rem' }}
                                  onClick={() => handleDownloadPrescriptionSlip(item)}
                                  disabled={downloadingId === `${item.id}-rx`}
                                >
                                  {downloadingId === `${item.id}-rx` ? (
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                  ) : (
                                    <i className="fa-solid fa-file-prescription"></i>
                                  )}
                                  <span>Prescription</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer / Pagination */}
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-1">
                  <div className="text-secondary small">
                    Showing {Math.min(opdPage * opdPageSize + 1, opdTotalElements)} to {Math.min((opdPage + 1) * opdPageSize, opdTotalElements)} of {opdTotalElements} visits
                  </div>
                  <nav aria-label="OPD table pagination">
                    <ul className="pagination pagination-sm mb-0 align-items-center gap-1">
                      <li className={`page-item ${opdPage === 0 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link border rounded text-secondary py-1 px-2" 
                          aria-label="Previous"
                          onClick={() => setOpdPage(Math.max(0, opdPage - 1))}
                          disabled={opdPage === 0}
                        >
                          &lt;
                        </button>
                      </li>
                      <li className="page-item active">
                        <button className="page-link border-0 rounded bg-primary text-white py-1 px-2">
                          {opdPage + 1}
                        </button>
                      </li>
                      <li className={`page-item ${(opdPage + 1) * opdPageSize >= opdTotalElements ? 'disabled' : ''}`}>
                        <button 
                          className="page-link border rounded text-secondary py-1 px-2" 
                          aria-label="Next"
                          onClick={() => setOpdPage(opdPage + 1)}
                          disabled={(opdPage + 1) * opdPageSize >= opdTotalElements}
                        >
                          &gt;
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            )}

            {/* 2. Lab Reports View */}
            {activeTab === 'lab-reports' && (
              <div>
                <div className="mb-3">
                  <h5 className="fw-bold text-dark mb-1">Lab Reports</h5>
                </div>

                {/* Filter Section */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark mb-1">Investigation</label>
                  <div className="input-group input-group-sm" style={{ maxWidth: '440px' }}>
                    <span className="input-group-text bg-white border-end-0 text-muted">
                      <i className="fa-regular fa-file-lines"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 text-dark"
                      placeholder="Type to search investigation (e.g. CBC, Thyroid, Sugar)..."
                      value={labSearchQuery}
                      onChange={(e) => setLabSearchQuery(e.target.value)}
                      style={{ fontSize: '0.88rem' }}
                    />
                  </div>
                </div>

                {/* Table with table-bordered, table-hover, align-middle */}
                <div className="table-responsive packagelist mb-2">
                  <table className="table table-bordered table-hover align-middle mb-0 bg-white">
                    <thead className="table-light">
                      <tr>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Investigation Date</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Investigation Name</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Result</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Unit</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Range</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Report Date</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLab.map((item) => (
                        <tr key={item.id}>
                          <td className="  " style={{ fontSize: '0.88rem' }}>{item.date}</td>
                          <td className="  " style={{ fontSize: '0.88rem' }}>{item.investigation}</td>
                          <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.result}</td>
                          <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.unit}</td>
                          <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.range}</td>
                          <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.reportDate}</td>
                          <td className="py-2.5 px-3 text-nowrap">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm px-2.5 py-1 rounded-2 d-inline-flex align-items-center gap-1.5 fw-medium"
                              style={{ fontSize: '0.8rem' }}
                              onClick={() => handleOpenDoc('Lab Report', item)}
                            >
                              <i className="fa-regular fa-file-lines"></i>
                              <span>View Report</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer / Pagination */}
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-1">
                  <div className="text-secondary small">
                    Showing 1 to {filteredLab.length} of 18 reports
                  </div>
                  <nav aria-label="Lab table pagination">
                    <ul className="pagination pagination-sm mb-0 align-items-center gap-1">
                      <li className="page-item">
                        <button className="page-link border rounded text-secondary py-1 px-2" aria-label="Previous">
                          &lt;
                        </button>
                      </li>
                      <li className="page-item active">
                        <button className="page-link border-0 rounded bg-primary text-white py-1 px-2">
                          1
                        </button>
                      </li>
                      <li className="page-item">
                        <button className="page-link border rounded text-secondary py-1 px-2">
                          2
                        </button>
                      </li>
                      <li className="page-item">
                        <button className="page-link border rounded text-secondary py-1 px-2">
                          3
                        </button>
                      </li>
                      <li className="page-item">
                        <button className="page-link border rounded text-secondary py-1 px-2" aria-label="Next">
                          &gt;
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            )}

            {/* 3. Radiology Reports View */}
            {activeTab === 'radiology-reports' && (
              <div>
                <div className="mb-3">
                  <h5 className="fw-bold text-dark mb-1">Radiology Reports</h5>
                </div>

                {/* Filter Section */}
                <div className="d-flex flex-wrap gap-3 mb-3">
                  <div style={{ minWidth: '200px' }}>
                    <label className="form-label small fw-semibold text-dark mb-1">Modality</label>
                    <select
                      className="form-select form-select-sm text-dark"
                      value={radModalityFilter}
                      onChange={(e) => setRadModalityFilter(e.target.value)}
                      style={{ fontSize: '0.88rem' }}
                    >
                      <option value="All Modalities">All Modalities</option>
                      <option value="X-Ray">X-Ray</option>
                      <option value="Ultrasound">Ultrasound</option>
                      <option value="MRI">MRI</option>
                      <option value="CT">CT</option>
                      <option value="Mammography">Mammography</option>
                    </select>
                  </div>
                  <div style={{ minWidth: '180px' }}>
                    <label className="form-label small fw-semibold text-dark mb-1">Report Status</label>
                    <select
                      className="form-select form-select-sm text-dark"
                      value={radStatusFilter}
                      onChange={(e) => setRadStatusFilter(e.target.value)}
                      style={{ fontSize: '0.88rem' }}
                    >
                      <option value="All">All</option>
                      <option value="Completed">Completed</option>
                      <option value="Pending">Pending</option>
                      <option value="Drafted">Drafted</option>
                    </select>
                  </div>
                </div>

                {/* Table with table-bordered, table-hover, align-middle */}
                <div className="table-responsive packagelist mb-2">
                  <table className="table table-bordered table-hover align-middle mb-0 bg-white">
                    <thead className="table-light">
                      <tr>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Study Date</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Investigation Name</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Modality</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Report Date</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Report Status</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRadiology.map((item) => (
                        <tr key={item.id}>
                          <td className="  " style={{ fontSize: '0.88rem' }}>{item.studyDate}</td>
                          <td className="  " style={{ fontSize: '0.88rem' }}>{item.investigation}</td>
                          <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.modality}</td>
                          <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.reportDate}</td>
                          <td className="py-2.5 px-3 text-nowrap">
                            {item.status === 'Completed' && (
                              <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-2.5 py-1 fw-medium" style={{ fontSize: '0.78rem' }}>
                                Completed
                              </span>
                            )}
                            {item.status === 'Pending' && (
                              <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2.5 py-1 fw-medium" style={{ fontSize: '0.78rem' }}>
                                Pending
                              </span>
                            )}
                            {item.status === 'Drafted' && (
                              <span className="badge rounded-pill bg-secondary-subtle text-secondary border border-secondary-subtle px-2.5 py-1 fw-medium" style={{ fontSize: '0.78rem' }}>
                                Drafted
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-nowrap">
                            <div className="d-flex gap-2">
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm px-2.5 py-1 rounded-2 d-inline-flex align-items-center gap-1.5 fw-medium"
                                style={{ fontSize: '0.8rem' }}
                                onClick={() => handleOpenDoc('Radiology Report', item)}
                              >
                                <i className="fa-regular fa-file-lines"></i>
                                <span>View Report</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm px-2.5 py-1 rounded-2 d-inline-flex align-items-center gap-1.5 fw-medium"
                                style={{ fontSize: '0.8rem' }}
                                onClick={() => handleOpenDoc('Radiology Study', item)}
                              >
                                <i className="fa-regular fa-image"></i>
                                <span>View Study</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer / Pagination */}
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-1">
                  <div className="text-secondary small">
                    Showing 1 to {filteredRadiology.length} of 10 reports
                  </div>
                  <nav aria-label="Radiology table pagination">
                    <ul className="pagination pagination-sm mb-0 align-items-center gap-1">
                      <li className="page-item">
                        <button className="page-link border rounded text-secondary py-1 px-2" aria-label="Previous">
                          &lt;
                        </button>
                      </li>
                      <li className="page-item active">
                        <button className="page-link border-0 rounded bg-primary text-white py-1 px-2">
                          1
                        </button>
                      </li>
                      <li className="page-item">
                        <button className="page-link border rounded text-secondary py-1 px-2">
                          2
                        </button>
                      </li>
                      <li className="page-item">
                        <button className="page-link border rounded text-secondary py-1 px-2">
                          3
                        </button>
                      </li>
                      <li className="page-item">
                        <button className="page-link border rounded text-secondary py-1 px-2" aria-label="Next">
                          &gt;
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            )}

            {/* 4. IPD Lab Reports View */}
            {activeTab === 'ipd-lab-reports' && (
              <div>
                <div className="mb-3">
                  <h5 className="fw-bold text-dark mb-1">IPD Lab Reports</h5>
                </div>

                {/* Filter Section */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark mb-1">Investigation</label>
                  <div className="input-group input-group-sm" style={{ maxWidth: '440px' }}>
                    <span className="input-group-text bg-white border-end-0 text-muted">
                      <i className="fa-regular fa-file-lines"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 text-dark"
                      placeholder="Type to search investigation (e.g. CBC, Creatinine, Sodium)..."
                      value={ipdLabSearchQuery}
                      onChange={(e) => setIpdLabSearchQuery(e.target.value)}
                      style={{ fontSize: '0.88rem' }}
                    />
                  </div>
                </div>

                {/* Table with table-bordered, table-hover, align-middle */}
                <div className="table-responsive packagelist mb-2">
                  <table className="table table-bordered table-hover align-middle mb-0 bg-white">
                    <thead className="table-light">
                      <tr>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Investigation Date</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Investigation Name</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Result</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Unit</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Range</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Report Date</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIpdLab.map((item) => (
                        <tr key={item.id}>
                          <td className="  " style={{ fontSize: '0.88rem' }}>{item.date}</td>
                          <td className="  " style={{ fontSize: '0.88rem' }}>{item.investigation}</td>
                          <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.result}</td>
                          <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.unit}</td>
                          <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.range}</td>
                          <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.reportDate}</td>
                          <td className="py-2.5 px-3 text-nowrap">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm px-2.5 py-1 rounded-2 d-inline-flex align-items-center gap-1.5 fw-medium"
                              style={{ fontSize: '0.8rem' }}
                              onClick={() => handleOpenDoc('IPD Lab Report', item)}
                            >
                              <i className="fa-regular fa-file-lines"></i>
                              <span>View Report</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer / Pagination */}
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-1">
                  <div className="text-secondary small">
                    Showing 1 to {filteredIpdLab.length} of 24 reports
                  </div>
                  <nav aria-label="IPD Lab table pagination">
                    <ul className="pagination pagination-sm mb-0 align-items-center gap-1">
                      <li className="page-item">
                        <button className="page-link border rounded text-secondary py-1 px-2" aria-label="Previous">
                          &lt;
                        </button>
                      </li>
                      <li className="page-item active">
                        <button className="page-link border-0 rounded bg-primary text-white py-1 px-2">
                          1
                        </button>
                      </li>
                      <li className="page-item">
                        <button className="page-link border rounded text-secondary py-1 px-2">
                          2
                        </button>
                      </li>
                      <li className="page-item">
                        <button className="page-link border rounded text-secondary py-1 px-2">
                          3
                        </button>
                      </li>
                      <li className="page-item">
                        <button className="page-link border rounded text-secondary py-1 px-2" aria-label="Next">
                          &gt;
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            )}

            {/* 5. Discharge Summaries View */}
            {activeTab === 'discharge-summaries' && (
              <div>
                <div className="mb-3">
                  <h5 className="fw-bold text-dark mb-1">Discharge Summaries</h5>
                </div>

                {/* Table with table-bordered, table-hover, align-middle */}
                <div className="table-responsive packagelist mb-2">
                  <table className="table table-bordered table-hover align-middle mb-0 bg-white">
                    <thead className="table-light">
                      <tr>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Admission No.</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Admission Date</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Discharge Date</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Department</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Treating Doctor</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dischargeData.map((item) => (
                        <tr key={item.id}>
                          <td className="  " style={{ fontSize: '0.88rem' }}>{item.admissionNo}</td>
                          <td className="  " style={{ fontSize: '0.88rem' }}>{item.admissionDate}</td>
                          <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.dischargeDate}</td>
                          <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.department}</td>
                          <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.doctor}</td>
                          <td className="py-2.5 px-3 text-nowrap">
                            <div className="d-flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm px-2.5 py-1 rounded-2 d-inline-flex align-items-center gap-1.5 fw-medium"
                                style={{ fontSize: '0.8rem' }}
                                onClick={() => handleOpenDoc('Discharge Summary', item)}
                              >
                                <i className="fa-regular fa-file-lines"></i>
                                <span>Discharge Summary</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm px-2.5 py-1 rounded-2 d-inline-flex align-items-center gap-1.5 fw-medium"
                                style={{ fontSize: '0.8rem' }}
                                onClick={() => handleOpenDoc('Bill Summary', item)}
                              >
                                <i className="fa-regular fa-file-lines"></i>
                                <span>Bill Summary</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm px-2.5 py-1 rounded-2 d-inline-flex align-items-center gap-1.5 fw-medium"
                                style={{ fontSize: '0.8rem' }}
                                onClick={() => handleOpenDoc('Detailed Bill', item)}
                              >
                                <i className="fa-regular fa-file-lines"></i>
                                <span>Detailed Bill</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer / Pagination */}
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-1">
                  <div className="text-secondary small">
                    Showing 1 to {dischargeData.length} of 4 admissions
                  </div>
                  <nav aria-label="Discharge summary table pagination">
                    <ul className="pagination pagination-sm mb-0 align-items-center gap-1">
                      <li className="page-item">
                        <button className="page-link border rounded text-secondary py-1 px-2" aria-label="Previous">
                          &lt;
                        </button>
                      </li>
                      <li className="page-item active">
                        <button className="page-link border-0 rounded bg-primary text-white py-1 px-2">
                          1
                        </button>
                      </li>
                      <li className="page-item">
                        <button className="page-link border rounded text-secondary py-1 px-2" aria-label="Next">
                          &gt;
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Document Preview Modal */}
      {showModal && selectedDoc && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content rounded-4 border-0 shadow">
              {/* Modal Header */}
              <div className="modal-header border-bottom py-3 px-4 bg-light rounded-top-4">
                <div className="d-flex align-items-center gap-2">
                  <i className="fa-solid fa-file-waveform text-primary fs-5"></i>
                  <h5 className="modal-title fw-bold text-dark mb-0">
                    {selectedDoc.type} Preview
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close shadow-none"
                  aria-label="Close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4">
                {/* Hospital & Verification Header */}
                <div className="p-3 bg-light rounded-3 mb-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
                  <div>
                    <h6 className="fw-bold text-dark mb-1">ARI Super Specialty Hospital</h6>
                    <p className="small text-muted mb-0">Ayushman Bharat Digital Mission (ABDM) Compliant Facility</p>
                  </div>
                  <div className="text-sm-end">
                    <span className="badge bg-primary-subtle text-primary px-3 py-1 mb-1 d-inline-block">
                      {selectedDoc.type}
                    </span>
                    <div className="small text-muted">
                      Date: <strong>{selectedDoc.record.date || selectedDoc.record.studyDate || selectedDoc.record.admissionDate}</strong>
                    </div>
                  </div>
                </div>

                {/* Patient Summary Strip */}
                <div className="border border-light-subtle rounded-3 p-3 mb-3 bg-white">
                  <div className="row g-2 small">
                    <div className="col-6 col-md-3">
                      <span className="text-muted d-block">Patient Name</span>
                      <strong className="text-dark">John Doe</strong>
                    </div>
                    <div className="col-6 col-md-3">
                      <span className="text-muted d-block">Age / Gender</span>
                      <strong className="text-dark">34 Yrs / Male</strong>
                    </div>
                    <div className="col-6 col-md-3">
                      <span className="text-muted d-block">Patient ID</span>
                      <strong className="text-dark">ARI-PT-8842</strong>
                    </div>
                    <div className="col-6 col-md-3">
                      <span className="text-muted d-block">ABHA ID</span>
                      <strong className="text-primary">91-8842-4912-5812</strong>
                    </div>
                  </div>
                </div>

                {/* Dynamic Content based on selected document */}
                {selectedDoc.type === 'OPD Slip' && (
                  <div>
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <div className="border border-light-subtle rounded-3 p-3 bg-light bg-opacity-50">
                          <span className="small text-muted d-block">Consulting Doctor</span>
                          <strong className="text-dark">{selectedDoc.record.doctor}</strong>
                          <div className="small text-secondary">{selectedDoc.record.specialty} Dept</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="border border-light-subtle rounded-3 p-3 bg-light bg-opacity-50">
                          <span className="small text-muted d-block">Reason / Diagnosis</span>
                          <strong className="text-dark">{selectedDoc.record.reason}</strong>
                          <div className="small text-success">Token #14 (Room 102)</div>
                        </div>
                      </div>
                    </div>

                    <h6 className="fw-bold text-dark mb-2">Recorded Vitals</h6>
                    <div className="row g-2 mb-3">
                      <div className="col-3">
                        <div className="p-2 border border-light-subtle rounded text-center bg-white">
                          <span className="small text-muted d-block">Blood Pressure</span>
                          <strong className="text-dark">{selectedDoc.record.vitals?.bp}</strong>
                        </div>
                      </div>
                      <div className="col-3">
                        <div className="p-2 border border-light-subtle rounded text-center bg-white">
                          <span className="small text-muted d-block">Pulse</span>
                          <strong className="text-dark">{selectedDoc.record.vitals?.pulse}</strong>
                        </div>
                      </div>
                      <div className="col-3">
                        <div className="p-2 border border-light-subtle rounded text-center bg-white">
                          <span className="small text-muted d-block">Temperature</span>
                          <strong className="text-dark">{selectedDoc.record.vitals?.temp}</strong>
                        </div>
                      </div>
                      <div className="col-3">
                        <div className="p-2 border border-light-subtle rounded text-center bg-white">
                          <span className="small text-muted d-block">SpO2</span>
                          <strong className="text-dark">{selectedDoc.record.vitals?.spo2}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="alert alert-info bg-info bg-opacity-10 border-0 text-dark small py-2 px-3 mb-0">
                      <strong>Doctor's Remarks:</strong> {selectedDoc.record.instructions}
                    </div>
                  </div>
                )}

                {selectedDoc.type === 'Prescription' && (
                  <div>
                    <div className="mb-3">
                      <span className="small text-muted d-block">Prescribed by</span>
                      <strong className="text-dark">{selectedDoc.record.doctor}</strong> ({selectedDoc.record.specialty})
                      <div className="small text-secondary mt-1">Diagnosis: <strong>{selectedDoc.record.reason}</strong></div>
                    </div>

                    <h6 className="fw-bold text-dark mb-2">Prescribed Medications (Rx)</h6>
                    <div className="table-responsive border border-light-subtle rounded-3 mb-3">
                      <table className="table table-sm table-striped align-middle mb-0">
                        <thead className="table-light border-bottom border-light-subtle">
                          <tr>
                            <th className="py-2 px-3 small border-bottom">Medicine Name</th>
                            <th className="py-2 px-3 small border-bottom">Dosage</th>
                            <th className="py-2 px-3 small border-bottom">Frequency</th>
                            <th className="py-2 px-3 small border-bottom">Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDoc.record.medicines?.map((med, idx) => (
                            <tr key={idx} className="border-bottom border-light-subtle">
                              <td className="py-2 px-3 fw-medium text-dark">{med.name}</td>
                              <td className="py-2 px-3 text-secondary">{med.dosage}</td>
                              <td className="py-2 px-3 text-secondary">{med.frequency}</td>
                              <td className="py-2 px-3 text-secondary">{med.duration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="alert alert-primary bg-primary bg-opacity-10 border-0 text-primary small py-2 px-3 mb-0">
                      <strong>Instructions: </strong>{selectedDoc.record.instructions}
                    </div>
                  </div>
                )}

                {(selectedDoc.type === 'Lab Report' || selectedDoc.type === 'IPD Lab Report') && (
                  <div>
                    <div className="mb-3 d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="fw-bold text-dark mb-0">{selectedDoc.record.investigation}</h6>
                        <span className="small text-muted">Specimen: Blood • Sample Date: {selectedDoc.record.date}</span>
                      </div>
                      <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1">
                        Reported: {selectedDoc.record.reportDate}
                      </span>
                    </div>

                    <div className="table-responsive border border-light-subtle rounded-3 mb-3">
                      <table className="table table-sm align-middle mb-0">
                        <thead className="table-light border-bottom border-light-subtle">
                          <tr>
                            <th className="py-2 px-3 small border-bottom">Test Parameter</th>
                            <th className="py-2 px-3 small border-bottom">Result</th>
                            <th className="py-2 px-3 small border-bottom">Unit</th>
                            <th className="py-2 px-3 small border-bottom">Reference Interval</th>
                            <th className="py-2 px-3 small border-bottom">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDoc.record.subTests ? (
                            selectedDoc.record.subTests.map((sub, idx) => (
                              <tr key={idx} className="border-bottom border-light-subtle">
                                <td className="py-2 px-3 fw-medium text-dark">{sub.name}</td>
                                <td className="py-2 px-3 fw-bold text-dark">{sub.value}</td>
                                <td className="py-2 px-3 text-secondary">{sub.unit}</td>
                                <td className="py-2 px-3 text-secondary">{sub.range}</td>
                                <td className="py-2 px-3">
                                  <span className={`badge rounded-pill ${sub.status === 'Normal' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'}`}>
                                    {sub.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr className="border-bottom border-light-subtle">
                              <td className="py-2 px-3 fw-medium text-dark">{selectedDoc.record.investigation}</td>
                              <td className="py-2 px-3 fw-bold text-dark">{selectedDoc.record.result}</td>
                              <td className="py-2 px-3 text-secondary">{selectedDoc.record.unit}</td>
                              <td className="py-2 px-3 text-secondary">{selectedDoc.record.range}</td>
                              <td className="py-2 px-3">
                                <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle">
                                  {selectedDoc.record.status || 'Completed'}
                                </span>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-2 bg-light rounded text-center small text-muted">
                      <i className="fa-solid fa-circle-check text-success me-1"></i> Verified by Dr. M. Iyer, MD (Pathology), Lead Pathologist
                    </div>
                  </div>
                )}

                {selectedDoc.type === 'Radiology Report' && (
                  <div>
                    <div className="row g-2 mb-3">
                      <div className="col-md-6">
                        <span className="small text-muted d-block">Investigation</span>
                        <strong className="text-dark">{selectedDoc.record.investigation}</strong>
                      </div>
                      <div className="col-md-3">
                        <span className="small text-muted d-block">Modality</span>
                        <strong className="text-dark">{selectedDoc.record.modality}</strong>
                      </div>
                      <div className="col-md-3">
                        <span className="small text-muted d-block">Status</span>
                        <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle">{selectedDoc.record.status}</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <h6 className="fw-bold text-dark mb-1">Clinical Findings</h6>
                      <p className="text-secondary small bg-light p-3 rounded-3 mb-0 border border-light-subtle">
                        {selectedDoc.record.findings}
                      </p>
                    </div>

                    <div className="mb-3">
                      <h6 className="fw-bold text-dark mb-1">Impression</h6>
                      <div className="alert alert-primary bg-white bg-opacity-10 border-0 text-primary small py-2 px-3 mb-0">
                        {selectedDoc.record.impression}
                      </div>
                    </div>

                    <div className="p-2 bg-light rounded text-center small text-muted">
                      <i className="fa-solid fa-circle-check text-success me-1"></i> Digitally Signed by Dr. K. Raman, MD (Radiodiagnosis)
                    </div>
                  </div>
                )}

                {selectedDoc.type === 'Radiology Study' && (
                  <div className="text-center py-4 bg-dark rounded-3 text-white">
                    <i className="fa-solid fa-x-ray fs-1 text-info mb-3"></i>
                    <h5 className="fw-bold mb-1">DICOM Study Viewer</h5>
                    <p className="small text-secondary mb-3">{selectedDoc.record.investigation} • Study ID: #RAD-STUDY-{selectedDoc.record.id}</p>
                    <div className="d-inline-flex gap-2">
                      <button type="button" className="btn btn-outline-light btn-sm px-3">
                        <i className="fa-solid fa-magnifying-glass-plus me-1"></i> Zoom
                      </button>
                      <button type="button" className="btn btn-outline-light btn-sm px-3">
                        <i className="fa-solid fa-circle-half-stroke me-1"></i> Contrast
                      </button>
                      <button type="button" className="btn btn-outline-light btn-sm px-3">
                        <i className="fa-solid fa-arrows-rotate me-1"></i> Rotate
                      </button>
                    </div>
                  </div>
                )}

                {selectedDoc.type === 'Discharge Summary' && (
                  <div>
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <span className="small text-muted d-block">Admission No</span>
                        <strong className="text-dark">{selectedDoc.record.admissionNo}</strong>
                      </div>
                      <div className="col-md-6">
                        <span className="small text-muted d-block">Duration</span>
                        <strong className="text-dark">{selectedDoc.record.admissionDate} to {selectedDoc.record.dischargeDate}</strong>
                      </div>
                      <div className="col-md-6">
                        <span className="small text-muted d-block">Department & Room</span>
                        <strong className="text-dark">{selectedDoc.record.department}</strong> ({selectedDoc.record.roomType})
                      </div>
                      <div className="col-md-6">
                        <span className="small text-muted d-block">Treating Consultant</span>
                        <strong className="text-dark">{selectedDoc.record.doctor}</strong>
                      </div>
                    </div>

                    <div className="mb-3">
                      <h6 className="fw-bold text-dark mb-1">Final Discharge Diagnosis</h6>
                      <p className="text-secondary small bg-light p-2 rounded mb-0 border border-light-subtle">
                        {selectedDoc.record.diagnosis}
                      </p>
                    </div>

                    <div className="mb-3">
                      <h6 className="fw-bold text-dark mb-1">Hospital Course & Procedures</h6>
                      <p className="text-secondary small bg-light p-2 rounded mb-0 border border-light-subtle">
                        {selectedDoc.record.procedure}
                      </p>
                    </div>

                    <div className="alert alert-success bg-success bg-opacity-10 border-0 text-success small py-2 px-3 mb-0">
                      <strong>Condition at Discharge:</strong> Hemodynamically stable, afebrile, wound clean and healing well.
                    </div>
                  </div>
                )}

                {selectedDoc.type === 'Bill Summary' && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <span className="small text-muted d-block">Admission IPD No</span>
                        <strong className="text-dark">{selectedDoc.record.admissionNo}</strong>
                      </div>
                      <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1">Payment Status: Settled</span>
                    </div>

                    <div className="border border-light-subtle rounded-3 p-3 mb-3 bg-light">
                      <div className="d-flex justify-content-between py-1 border-bottom border-light-subtle">
                        <span className="text-muted small">Total Hospital Bill</span>
                        <strong className="text-dark">{selectedDoc.record.totalBill}</strong>
                      </div>
                      <div className="d-flex justify-content-between py-1 border-bottom border-light-subtle">
                        <span className="text-muted small">TPA / Insurance Approved</span>
                        <strong className="text-success">{selectedDoc.record.insurancePaid}</strong>
                      </div>
                      <div className="d-flex justify-content-between py-1">
                        <span className="text-muted small">Patient Co-Payment</span>
                        <strong className="text-primary">{selectedDoc.record.patientPaid}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {selectedDoc.type === 'Detailed Bill' && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <span className="small text-muted d-block">Itemized Tax Invoice</span>
                        <strong className="text-dark">INV-{selectedDoc.record.admissionNo}</strong>
                      </div>
                      <span className="text-muted small">GSTIN: 07AAAAC1234F1Z5</span>
                    </div>

                    <div className="table-responsive border border-light-subtle rounded-3 mb-3">
                      <table className="table table-sm align-middle mb-0">
                        <thead className="table-light border-bottom border-light-subtle">
                          <tr>
                            <th className="py-2 px-3 small border-bottom">Service / Item</th>
                            <th className="py-2 px-3 small border-bottom">Qty</th>
                            <th className="py-2 px-3 small text-end border-bottom">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-bottom border-light-subtle">
                            <td className="py-2 px-3 text-dark">Room & Nursing Charges</td>
                            <td className="py-2 px-3 text-secondary">6 Days</td>
                            <td className="py-2 px-3 text-end text-dark">₹ 18,000</td>
                          </tr>
                          <tr className="border-bottom border-light-subtle">
                            <td className="py-2 px-3 text-dark">Consultant / Doctor Visits</td>
                            <td className="py-2 px-3 text-secondary">6 Visits</td>
                            <td className="py-2 px-3 text-end text-dark">₹ 9,000</td>
                          </tr>
                          <tr className="border-bottom border-light-subtle">
                            <td className="py-2 px-3 text-dark">Lab Diagnostics & Radiology</td>
                            <td className="py-2 px-3 text-secondary">Multiple</td>
                            <td className="py-2 px-3 text-end text-dark">₹ 12,250</td>
                          </tr>
                          <tr className="border-bottom border-light-subtle">
                            <td className="py-2 px-3 text-dark">Pharmacy & Consumables</td>
                            <td className="py-2 px-3 text-secondary">As per chart</td>
                            <td className="py-2 px-3 text-end text-dark">₹ 9,000</td>
                          </tr>
                          <tr className="table-light fw-bold">
                            <td colSpan="2" className="py-2 px-3 text-dark">Net Payable</td>
                            <td className="py-2 px-3 text-end text-primary">{selectedDoc.record.totalBill}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer border-top py-3 px-4 bg-light rounded-bottom-4 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-light border px-4"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-primary px-3 fw-medium"
                    onClick={() => window.print()}
                  >
                    <i className="fa-solid fa-print me-2"></i> Print
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary px-4 fw-medium"
                    onClick={handleDownload}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-download me-2"></i> Download PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Download Success Toast */}
      {downloadSuccessToast && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1100 }}>
          <div className="toast show align-items-center text-bg-success border-0 shadow-lg rounded-3" role="alert" aria-live="assertive" aria-atomic="true">
            <div className="d-flex">
              <div className="toast-body d-flex align-items-center gap-2">
                <i className="fa-solid fa-circle-check fs-5"></i>
                <span>Medical record PDF downloaded successfully!</span>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                aria-label="Close"
                onClick={() => setDownloadSuccessToast(false)}
              ></button>
            </div>
          </div>
        </div>
      )}
      
      {/* PDF Viewer */}
      <PdfViewer
        pdfUrl={pdfUrl}
        name={pdfName}
        onClose={() => {
          if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
          }
        }}
      />
    </div>
  );
}
