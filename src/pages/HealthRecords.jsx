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

  const [labData, setLabData] = useState([]);
  const [labPage, setLabPage] = useState(0);
  const [labTotalElements, setLabTotalElements] = useState(0);
  const [labTotalPages, setLabTotalPages] = useState(0);
  const [labLoading, setLabLoading] = useState(false);
  const labPageSize = 5;

  const [ipdLabData, setIpdLabData] = useState([]);
  const [ipdLabPage, setIpdLabPage] = useState(0);
  const [ipdLabTotalElements, setIpdLabTotalElements] = useState(0);
  const [ipdLabTotalPages, setIpdLabTotalPages] = useState(0);
  const [ipdLabLoading, setIpdLabLoading] = useState(false);
  const ipdLabPageSize = 5;

  const [radData, setRadData] = useState([]);
  const [radPage, setRadPage] = useState(0);
  const [radTotalElements, setRadTotalElements] = useState(0);
  const [radTotalPages, setRadTotalPages] = useState(0);
  const [radLoading, setRadLoading] = useState(false);
  const radPageSize = 5;

  const [dischargeData, setDischargeData] = useState([]);
  const [dischargePage, setDischargePage] = useState(0);
  const [dischargeTotalElements, setDischargeTotalElements] = useState(0);
  const [dischargeLoading, setDischargeLoading] = useState(false);
  const dischargePageSize = 5;

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

  // 2. Lab Reports Logic
  useEffect(() => {
    if (activeTab === 'lab-reports') {
      const fetchLabReports = async () => {
        setLabLoading(true);
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
             setLabLoading(false);
             return;
          }

          const res = await apiService.get(`${ENDPOINTS.LAB.INVESTIGATIONS_REPORT}?page=${labPage}&size=${labPageSize}&hospitalId=${hospitalId}&patientId=${patientId}`);
          
          if (res && res.response && res.response.content) {
            setLabData(res.response.content);
            setLabTotalElements(res.response.totalElements || res.response.content.length);
            setLabTotalPages(res.response.totalPages || Math.ceil((res.response.totalElements || res.response.content.length) / 5));
          } else {
             setLabData([]);
             setLabTotalElements(0);
             setLabTotalPages(0);
          }
        } catch (error) {
          console.error("Failed to fetch Lab reports:", error);
        } finally {
          setLabLoading(false);
        }
      };
      fetchLabReports();
    }
  }, [activeTab, labPage]);

  // 2b. IPD Lab Reports Logic
  useEffect(() => {
    if (activeTab === 'ipd-lab-reports') {
      const fetchIpdLabReports = async () => {
        setIpdLabLoading(true);
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
             setIpdLabLoading(false);
             return;
          }

          const res = await apiService.get(`${ENDPOINTS.LAB.INVESTIGATIONS_REPORT}?page=${ipdLabPage}&size=${ipdLabPageSize}&hospitalId=${hospitalId}&patientId=${patientId}&IPD=true`);
          
          if (res && res.response && res.response.content) {
            setIpdLabData(res.response.content);
            setIpdLabTotalElements(res.response.totalElements || res.response.content.length);
            setIpdLabTotalPages(res.response.totalPages || Math.ceil((res.response.totalElements || res.response.content.length) / 5));
          } else {
             setIpdLabData([]);
             setIpdLabTotalElements(0);
             setIpdLabTotalPages(0);
          }
        } catch (error) {
          console.error("Failed to fetch IPD Lab reports:", error);
        } finally {
          setIpdLabLoading(false);
        }
      };
      fetchIpdLabReports();
    }
  }, [activeTab, ipdLabPage]);

  const handleDownloadLabReport = async (record) => {
    if (!record.orderHdId) {
      alert("Order ID not found for this report.");
      return;
    }
    setDownloadingId(`${record.resultEntryDetailsId}-lab`);
    try {
      const endpoint = `${ENDPOINTS.LAB.PDF_REPORT}?orderHdId=${record.orderHdId}&flag=d`;
      const blob = await apiService.getPdf(endpoint);
      
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfName(`${record.investigationName} - ${record.orderDate}`);
    } catch (error) {
      console.error("Failed to fetch Lab Report PDF", error);
      alert("Failed to load PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadRadReport = async (record) => {
    if (!record.radOrderDtId) {
      alert("Order ID not found for this report.");
      return;
    }
    setDownloadingId(`${record.radOrderDtId}-rad`);
    try {
      const endpoint = `${ENDPOINTS.RADIOLOGY.PDF_REPORT}?radOrderDtId=${record.radOrderDtId}&flag=d`;
      const blob = await apiService.getPdf(endpoint);
      
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfName(`${record.investigationName} - ${record.orderDate || record.studyDate}`);
    } catch (error) {
      console.error("Failed to fetch Radiology Report PDF", error);
      alert("Failed to load PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleViewStudy = async (record) => {
    if (!record.uhidNo || !record.accessionNo) {
      alert("Missing patient or order details to view study.");
      return;
    }
    
    setDownloadingId(`${record.radOrderDtId}-study`);
    try {
      const orderNoEncoded = encodeURIComponent(record.accessionNo);
      const endpoint = `${ENDPOINTS.RADIOLOGY.PACS_LAUNCH_URL}?uhid=${record.uhidNo}&orderNo=${orderNoEncoded}`;
      
      const res = await apiService.get(endpoint);
      if (res && res.response && res.response.weasisUrl) {
        window.open(res.response.weasisUrl, '_blank');
      } else {
        alert("Study details not available yet.");
      }
    } catch (error) {
      console.error("Failed to launch study", error);
      if (error.data && error.data.detail) {
        alert(error.data.detail);
      } else {
        alert("Failed to open study. Please try again.");
      }
    } finally {
      setDownloadingId(null);
    }
  };

  // 3. Radiology Reports Logic
  useEffect(() => {
    if (activeTab === 'radiology-reports') {
      const fetchRadReports = async () => {
        setRadLoading(true);
        try {
          const activeData = localStorage.getItem('patientDetails');
          let patientId = null;
          if (activeData) {
             const parsedActive = JSON.parse(activeData);
             if (parsedActive && parsedActive.patientId) patientId = parsedActive.patientId;
          }
          
          if (!patientId) {
             setRadLoading(false);
             return;
          }

          const res = await apiService.get(`${ENDPOINTS.RADIOLOGY.PACS_STUDY_LIST}?patientId=${patientId}&page=${radPage}&size=${radPageSize}`);
          
          if (res && res.response && res.response.content) {
            setRadData(res.response.content);
            setRadTotalElements(res.response.totalElements || res.response.content.length);
            setRadTotalPages(res.response.totalPages || Math.ceil((res.response.totalElements || res.response.content.length) / 5));
          } else {
             setRadData([]);
             setRadTotalElements(0);
             setRadTotalPages(0);
          }
        } catch (error) {
          console.error("Failed to fetch Radiology reports:", error);
        } finally {
          setRadLoading(false);
        }
      };
      fetchRadReports();
    }
  }, [activeTab, radPage]);

  // 4. IPD Lab Reports is now handled via API state  // 5. Discharge Summaries API Data
  useEffect(() => {
    if (activeTab === 'discharge-summaries') {
      const fetchDischargeSummaries = async () => {
        setDischargeLoading(true);
        try {
          const activeData = localStorage.getItem('patientDetails');
          let patientId = null;
          if (activeData) {
             const parsedActive = JSON.parse(activeData);
             if (parsedActive && parsedActive.patientId) patientId = parsedActive.patientId;
          }
          
          if (!patientId) {
             setDischargeLoading(false);
             return;
          }

          const res = await apiService.get(`${ENDPOINTS.IPD.ADMISSION_DISCHARGE_LIST}?page=${dischargePage}&size=${dischargePageSize}&patientId=${patientId}&admissionStatus=2`);
          
          if (res && res.response && res.response.content) {
            setDischargeData(res.response.content);
            setDischargeTotalElements(res.response.totalElements || res.response.content.length);
          } else {
             setDischargeData([]);
             setDischargeTotalElements(0);
          }
        } catch (error) {
          console.error("Failed to fetch Discharge summaries:", error);
        } finally {
          setDischargeLoading(false);
        }
      };
      fetchDischargeSummaries();
    }
  }, [activeTab, dischargePage]);

  // Filtering helpers
  const filteredOpd = opdData.filter(item => {
    if (opdSpecialtyFilter === 'All Specialties') return true;
    return item.specialty.toLowerCase() === opdSpecialtyFilter.toLowerCase();
  });

  const filteredLab = labData.filter(item => {
    if (!labSearchQuery.trim()) return true;
    return item.investigationName && item.investigationName.toLowerCase().includes(labSearchQuery.toLowerCase());
  });

  const displayedLab = filteredLab;

  const filteredRadiology = radData.filter(item => {
    const matchModality = radModalityFilter === 'All Modalities' || (item.modality && item.modality.toLowerCase().includes(radModalityFilter.toLowerCase()));
    
    let reportStatusStr = 'Drafted';
    if (item.reportStatus === 'y') reportStatusStr = 'Completed';
    else if (item.reportStatus === 'n') reportStatusStr = 'Pending';

    const matchStatus = radStatusFilter === 'All' || reportStatusStr.toLowerCase() === radStatusFilter.toLowerCase();
    return matchModality && matchStatus;
  });

  const filteredIpdLab = ipdLabData.filter(item => {
    if (!ipdLabSearchQuery.trim()) return true;
    return item.investigationName && item.investigationName.toLowerCase().includes(ipdLabSearchQuery.toLowerCase());
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

  const handleDownloadDischargeSummary = async (record) => {
    if (!record.inpatientId) {
      alert("Inpatient ID not found for this admission.");
      return;
    }
    setDownloadingId(`${record.inpatientId}-discharge`);
    try {
      const endpoint = `${ENDPOINTS.IPD.DISCHARGE_SUMMARY_REPORT}?inPatientId=${record.inpatientId}&flag=d`;
      const blob = await apiService.getPdf(endpoint);
      
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfName(`Discharge Summary - ${record.admissionNo}`);
    } catch (error) {
      console.error("Failed to fetch Discharge Summary PDF", error);
      alert("Failed to load PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadBillSummary = async (record) => {
    if (!record.inpatientId) {
      alert("Inpatient ID not found for this admission.");
      return;
    }
    setDownloadingId(`${record.inpatientId}-bill`);
    try {
      const endpoint = `${ENDPOINTS.IPD.BILL_SUMMARY_REPORT}?inpatientId=${record.inpatientId}&flag=d`;
      const blob = await apiService.getPdf(endpoint);
      
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfName(`Bill Summary - ${record.admissionNo}`);
    } catch (error) {
      console.error("Failed to fetch Bill Summary PDF", error);
      alert("Failed to load PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadDetailedBill = async (record) => {
    if (!record.inpatientId) {
      alert("Inpatient ID not found for this admission.");
      return;
    }
    setDownloadingId(`${record.inpatientId}-detailed-bill`);
    try {
      const endpoint = `${ENDPOINTS.IPD.DETAILED_BILL_REPORT}?inpatientId=${record.inpatientId}&flag=d`;
      const blob = await apiService.getPdf(endpoint);
      
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfName(`Detailed Bill - ${record.admissionNo}`);
    } catch (error) {
      console.error("Failed to fetch Detailed Bill PDF", error);
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
                      {opdLoading ? (
                        <tr>
                          <td colSpan="5" className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredOpd.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-4 text-muted">
                            No OPD prescriptions found.
                          </td>
                        </tr>
                      ) : (
                        filteredOpd.map((item) => (
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
                        ))
                      )}
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
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Result Date</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labLoading ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </td>
                        </tr>
                      ) : displayedLab.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4 text-muted">
                            No lab reports found.
                          </td>
                        </tr>
                      ) : (
                        displayedLab.map((item, index) => (
                          <tr key={item.resultEntryDetailsId}>
                            <td className="  " style={{ fontSize: '0.88rem' }}>{item.orderDate}</td>
                            <td className="  " style={{ fontSize: '0.88rem' }}>{item.investigationName}</td>
                            <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.result}</td>
                            <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.unit}</td>
                            <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.range}</td>
                            <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.investigationDate}</td>
                            <td className="py-2.5 px-3 text-nowrap">
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm px-2.5 py-1 rounded-2 d-inline-flex align-items-center gap-1.5 fw-medium"
                                style={{ fontSize: '0.8rem' }}
                                onClick={() => handleDownloadLabReport(item)}
                                disabled={downloadingId === `${item.resultEntryDetailsId}-lab`}
                              >
                                {downloadingId === `${item.resultEntryDetailsId}-lab` ? (
                                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                ) : (
                                  <i className="fa-regular fa-file-lines"></i>
                                )}
                                <span>View Report</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer / Pagination */}
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-1">
                  <div className="text-secondary small">
                    Showing {Math.min(labPage * labPageSize + 1, labTotalElements)} to {Math.min((labPage + 1) * labPageSize, labTotalElements)} of {labTotalElements} reports
                  </div>
                  <nav aria-label="Lab table pagination">
                    <ul className="pagination pagination-sm mb-0 align-items-center gap-1">
                      <li className={`page-item ${labPage === 0 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link border rounded text-secondary py-1 px-2" 
                          aria-label="Previous"
                          onClick={() => setLabPage(Math.max(0, labPage - 1))}
                          disabled={labPage === 0}
                        >
                          &lt;
                        </button>
                      </li>
                      <li className="page-item active">
                        <button className="page-link border-0 rounded bg-primary text-white py-1 px-2">
                          {labPage + 1}
                        </button>
                      </li>
                      <li className={`page-item ${(labPage + 1) * labPageSize >= labTotalElements ? 'disabled' : ''}`}>
                        <button 
                          className="page-link border rounded text-secondary py-1 px-2" 
                          aria-label="Next"
                          onClick={() => setLabPage(labPage + 1)}
                          disabled={(labPage + 1) * labPageSize >= labTotalElements}
                        >
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
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Accession No.</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Modality</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Investigation Name</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Order Date/Time</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Study Date/Time</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Report Status</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {radLoading ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredRadiology.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4 text-muted">
                            No radiology reports found.
                          </td>
                        </tr>
                      ) : (
                        filteredRadiology.map((item) => (
                          <tr key={item.radOrderDtId || item.accessionNo || Math.random()}>
                            <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.accessionNo || '-'}</td>
                            <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.modality}</td>
                            <td className="  " style={{ fontSize: '0.88rem' }}>{item.investigationName}</td>
                            <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>
                              {item.orderDate || '-'} <br/>
                              <small className="text-muted">{item.orderTime && item.orderTime.includes('T') ? item.orderTime.split('T')[1].substring(0, 5) : item.orderTime}</small>
                            </td>
                            <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>
                              {item.studyDate || '-'} <br/>
                              <small className="text-muted">{item.studyTime && item.studyTime.includes('T') ? item.studyTime.split('T')[1].substring(0, 5) : item.studyTime}</small>
                            </td>
                            <td className="py-2.5 px-3 text-nowrap">
                              {item.reportStatus === 'y' && (
                                <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-2.5 py-1 fw-medium" style={{ fontSize: '0.78rem' }}>
                                  Completed
                                </span>
                              )}
                              {item.reportStatus === 'n' && (
                                <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2.5 py-1 fw-medium" style={{ fontSize: '0.78rem' }}>
                                  Pending
                                </span>
                              )}
                              {(!item.reportStatus || (item.reportStatus !== 'y' && item.reportStatus !== 'n')) && (
                                <span className="badge rounded-pill bg-secondary-subtle text-secondary border border-secondary-subtle px-2.5 py-1 fw-medium" style={{ fontSize: '0.78rem' }}>
                                  Drafted
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-nowrap">
                              <div className="d-flex gap-2">
                                {item.reportStatus === 'y' && (
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm px-2.5 py-1 rounded-2 d-inline-flex align-items-center gap-1.5 fw-medium"
                                    style={{ fontSize: '0.8rem' }}
                                    onClick={() => handleDownloadRadReport(item)}
                                    disabled={downloadingId === `${item.radOrderDtId}-rad`}
                                  >
                                    {downloadingId === `${item.radOrderDtId}-rad` ? (
                                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    ) : (
                                      <i className="fa-regular fa-file-lines"></i>
                                    )}
                                    <span>View Report</span>
                                  </button>
                                )}
                                {item.studyStatus === 'y' && (
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm px-2.5 py-1 rounded-2 d-inline-flex align-items-center gap-1.5 fw-medium"
                                    style={{ fontSize: '0.8rem' }}
                                    onClick={() => handleViewStudy(item)}
                                    disabled={downloadingId === `${item.radOrderDtId}-study`}
                                  >
                                    {downloadingId === `${item.radOrderDtId}-study` ? (
                                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    ) : (
                                      <i className="fa-regular fa-image"></i>
                                    )}
                                    <span>View Study</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer / Pagination */}
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-1">
                  <div className="text-secondary small">
                    Showing {Math.min(radPage * radPageSize + 1, radTotalElements)} to {Math.min((radPage + 1) * radPageSize, radTotalElements)} of {radTotalElements} reports
                  </div>
                  <nav aria-label="Radiology table pagination">
                    <ul className="pagination pagination-sm mb-0 align-items-center gap-1">
                      <li className={`page-item ${radPage === 0 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link border rounded text-secondary py-1 px-2" 
                          aria-label="Previous"
                          onClick={() => setRadPage(Math.max(0, radPage - 1))}
                          disabled={radPage === 0}
                        >
                          &lt;
                        </button>
                      </li>
                      <li className="page-item active">
                        <button className="page-link border-0 rounded bg-primary text-white py-1 px-2">
                          {radPage + 1}
                        </button>
                      </li>
                      <li className={`page-item ${(radPage + 1) * radPageSize >= radTotalElements ? 'disabled' : ''}`}>
                        <button 
                          className="page-link border rounded text-secondary py-1 px-2" 
                          aria-label="Next"
                          onClick={() => setRadPage(radPage + 1)}
                          disabled={(radPage + 1) * radPageSize >= radTotalElements}
                        >
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
                      {ipdLabLoading ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredIpdLab.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4 text-muted">
                            No IPD lab reports found.
                          </td>
                        </tr>
                      ) : (
                        filteredIpdLab.map((item) => (
                          <tr key={item.resultEntryDetailsId}>
                            <td className="  " style={{ fontSize: '0.88rem' }}>{item.orderDate}</td>
                            <td className="  " style={{ fontSize: '0.88rem' }}>{item.investigationName}</td>
                            <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.result}</td>
                            <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.unit}</td>
                            <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.range}</td>
                            <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.investigationDate}</td>
                            <td className="py-2.5 px-3 text-nowrap">
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm px-2.5 py-1 rounded-2 d-inline-flex align-items-center gap-1.5 fw-medium"
                                style={{ fontSize: '0.8rem' }}
                                onClick={() => handleDownloadLabReport(item)}
                                disabled={downloadingId === `${item.resultEntryDetailsId}-lab`}
                              >
                                {downloadingId === `${item.resultEntryDetailsId}-lab` ? (
                                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                ) : (
                                  <i className="fa-regular fa-file-lines"></i>
                                )}
                                <span>View Report</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer / Pagination */}
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-1">
                  <div className="text-secondary small">
                    Showing {ipdLabTotalElements === 0 ? 0 : ipdLabPage * ipdLabPageSize + 1} to {Math.min((ipdLabPage + 1) * ipdLabPageSize, ipdLabTotalElements)} of {ipdLabTotalElements} reports
                  </div>
                  <nav aria-label="IPD Lab table pagination">
                    <ul className="pagination pagination-sm mb-0 align-items-center gap-1">
                      <li className={`page-item ${ipdLabPage === 0 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link border rounded text-secondary py-1 px-2" 
                          aria-label="Previous"
                          onClick={() => setIpdLabPage(Math.max(0, ipdLabPage - 1))}
                          disabled={ipdLabPage === 0}
                        >
                          &lt;
                        </button>
                      </li>
                      <li className="page-item active">
                        <button className="page-link border-0 rounded bg-primary text-white py-1 px-2">
                          {ipdLabPage + 1}
                        </button>
                      </li>
                      <li className={`page-item ${(ipdLabPage + 1) * ipdLabPageSize >= ipdLabTotalElements ? 'disabled' : ''}`}>
                        <button 
                          className="page-link border rounded text-secondary py-1 px-2" 
                          aria-label="Next"
                          onClick={() => setIpdLabPage(ipdLabPage + 1)}
                          disabled={(ipdLabPage + 1) * ipdLabPageSize >= ipdLabTotalElements}
                        >
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
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Category Name</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Treating Doctor</th>
                        <th scope="col" className=" " style={{ fontSize: '0.85rem' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dischargeLoading ? (
                        <tr>
                          <td colSpan="6" className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </td>
                        </tr>
                      ) : dischargeData.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-4 text-muted">
                            No discharge summaries found.
                          </td>
                        </tr>
                      ) : (
                        dischargeData.map((item) => {
                          let admDate = item.admissionDateTime || '-';
                          if (admDate.includes('T')) admDate = admDate.replace('T', ' ').substring(0, 16);
                          
                          let disDate = item.dischargeDate || '-';
                          if (disDate.includes('T')) disDate = disDate.replace('T', ' ').substring(0, 16);
                          
                          return (
                            <tr key={item.inpatientId || Math.random()}>
                              <td className="  " style={{ fontSize: '0.88rem' }}>{item.admissionNo}</td>
                              <td className="  " style={{ fontSize: '0.88rem' }}>{admDate}</td>
                              <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{disDate}</td>
                              <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.categoryName}</td>
                              <td className="py-2.5 px-3 text-dark text-nowrap" style={{ fontSize: '0.88rem' }}>{item.doctorName}</td>
                              <td className="py-2.5 px-3 text-nowrap">
                                <div className="d-flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm px-2.5 py-1 rounded-2 d-inline-flex align-items-center gap-1.5 fw-medium"
                                    style={{ fontSize: '0.8rem' }}
                                    onClick={() => handleDownloadDischargeSummary(item)}
                                    disabled={downloadingId === `${item.inpatientId}-discharge`}
                                  >
                                    {downloadingId === `${item.inpatientId}-discharge` ? (
                                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    ) : (
                                      <i className="fa-regular fa-file-lines"></i>
                                    )}
                                    <span>Discharge Summary</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm px-2.5 py-1 rounded-2 d-inline-flex align-items-center gap-1.5 fw-medium"
                                    style={{ fontSize: '0.8rem' }}
                                    onClick={() => handleDownloadBillSummary(item)}
                                    disabled={downloadingId === `${item.inpatientId}-bill`}
                                  >
                                    {downloadingId === `${item.inpatientId}-bill` ? (
                                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    ) : (
                                      <i className="fa-regular fa-file-lines"></i>
                                    )}
                                    <span>Bill Summary</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm px-2.5 py-1 rounded-2 d-inline-flex align-items-center gap-1.5 fw-medium"
                                    style={{ fontSize: '0.8rem' }}
                                    onClick={() => handleDownloadDetailedBill(item)}
                                    disabled={downloadingId === `${item.inpatientId}-detailed-bill`}
                                  >
                                    {downloadingId === `${item.inpatientId}-detailed-bill` ? (
                                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    ) : (
                                      <i className="fa-regular fa-file-lines"></i>
                                    )}
                                    <span>Detailed Bill</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer / Pagination */}
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-1">
                  <div className="text-secondary small">
                    Showing {dischargeTotalElements === 0 ? 0 : dischargePage * dischargePageSize + 1} to {Math.min((dischargePage + 1) * dischargePageSize, dischargeTotalElements)} of {dischargeTotalElements} admissions
                  </div>
                  <nav aria-label="Discharge summary table pagination">
                    <ul className="pagination pagination-sm mb-0 align-items-center gap-1">
                      <li className={`page-item ${dischargePage === 0 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link border rounded text-secondary py-1 px-2" 
                          aria-label="Previous"
                          onClick={() => setDischargePage(Math.max(0, dischargePage - 1))}
                          disabled={dischargePage === 0}
                        >
                          &lt;
                        </button>
                      </li>
                      <li className="page-item active">
                        <button className="page-link border-0 rounded bg-primary text-white py-1 px-2">
                          {dischargePage + 1}
                        </button>
                      </li>
                      <li className={`page-item ${(dischargePage + 1) * dischargePageSize >= dischargeTotalElements ? 'disabled' : ''}`}>
                        <button 
                          className="page-link border rounded text-secondary py-1 px-2" 
                          aria-label="Next"
                          onClick={() => setDischargePage(dischargePage + 1)}
                          disabled={(dischargePage + 1) * dischargePageSize >= dischargeTotalElements}
                        >
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
                        <strong className="text-dark">{selectedDoc.record.investigationName || selectedDoc.record.investigation}</strong>
                      </div>
                      <div className="col-md-3">
                        <span className="small text-muted d-block">Modality</span>
                        <strong className="text-dark">{selectedDoc.record.modality}</strong>
                      </div>
                      <div className="col-md-3">
                        <span className="small text-muted d-block">Status</span>
                        <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle">
                          {selectedDoc.record.reportStatus === 'y' ? 'Completed' : selectedDoc.record.reportStatus === 'n' ? 'Pending' : 'Drafted'}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <h6 className="fw-bold text-dark mb-1">Clinical Findings</h6>
                      <p className="text-secondary small bg-light p-3 rounded-3 mb-0 border border-light-subtle">
                        {selectedDoc.record.findings || 'Report findings are available in the attached file.'}
                      </p>
                    </div>

                    <div className="mb-3">
                      <h6 className="fw-bold text-dark mb-1">Impression</h6>
                      <div className="alert alert-primary bg-white bg-opacity-10 border-0 text-primary small py-2 px-3 mb-0">
                        {selectedDoc.record.impression || 'Final report under review.'}
                      </div>
                    </div>

                    <div className="p-2 bg-light rounded text-center small text-muted">
                      <i className="fa-solid fa-circle-check text-success me-1"></i> Digitally Signed by Authorized Radiologist
                    </div>
                  </div>
                )}

                {selectedDoc.type === 'Radiology Study' && (
                  <div className="text-center py-4 bg-dark rounded-3 text-white">
                    <i className="fa-solid fa-x-ray fs-1 text-info mb-3"></i>
                    <h5 className="fw-bold mb-1">DICOM Study Viewer</h5>
                    <p className="small text-secondary mb-3">{selectedDoc.record.investigationName || selectedDoc.record.investigation} • Study ID: #{selectedDoc.record.accessionNo || selectedDoc.record.id}</p>
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
                        <strong className="text-dark">
                          {selectedDoc.record.admissionDateTime ? selectedDoc.record.admissionDateTime.replace('T', ' ').substring(0, 16) : selectedDoc.record.admissionDate} to {selectedDoc.record.dischargeDate ? selectedDoc.record.dischargeDate.replace('T', ' ').substring(0, 16) : ''}
                        </strong>
                      </div>
                      <div className="col-md-6">
                        <span className="small text-muted d-block">Category & Room</span>
                        <strong className="text-dark">{selectedDoc.record.categoryName || selectedDoc.record.department}</strong> ({selectedDoc.record.room || selectedDoc.record.roomType})
                      </div>
                      <div className="col-md-6">
                        <span className="small text-muted d-block">Treating Consultant</span>
                        <strong className="text-dark">{selectedDoc.record.doctorName || selectedDoc.record.doctor}</strong>
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
