import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import { ENDPOINTS } from '../constants/apiEndpoints';

export default function PatientActivation({
  initialMobile = '',
  initialPatientId = null,
  patientName = '',
  onClose,
  onSuccess
}) {
  const isDirectActivation = initialPatientId != null;
  const [mobileNo, setMobileNo] = useState(initialMobile.replace(/\D/g, '').slice(0, 10));
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(
    initialPatientId == null ? '' : String(initialPatientId)
  );
  const [sessionId, setSessionId] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(isDirectActivation ? 'send' : 'find');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleFindPatients = async (event) => {
    event.preventDefault();
    if (!/^[6-9]\d{9}$/.test(mobileNo)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await apiService.get(
        `${ENDPOINTS.PATIENTS.FOR_ACTIVATION}?mobileNo=${encodeURIComponent(mobileNo)}`,
        { requireAuth: false }
      );
      if (data.status !== 200 || !Array.isArray(data.response)) {
        setError(data.message || 'Unable to find patients for this mobile number.');
        return;
      }

      const inactivePatients = data.response.filter(
        patient => String(patient.status || '').toUpperCase() === 'INACTIVE'
      );
      setPatients(inactivePatients);
      setSelectedPatientId(inactivePatients[0] ? String(inactivePatients[0].patientId) : '');
      if (inactivePatients.length === 0) {
        setError('No inactive patient accounts were found for this mobile number.');
      }
    } catch (requestError) {
      setError(requestError?.message || 'Unable to find patients. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!selectedPatientId) {
      setError('Select the patient account you want to activate.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(mobileNo)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await apiService.post(
        ENDPOINTS.PATIENTS.SEND_ACTIVATION_OTP,
        { patientId: Number(selectedPatientId), mobileNo },
        { requireAuth: false }
      );
      if (data.status !== 200 || !data.response?.sessionId) {
        setError(data.message || data.response?.message || 'Unable to send OTP.');
        return;
      }

      setSessionId(data.response.sessionId);
      setStep('otp');
      setMessage(data.response.message || 'OTP sent successfully.');
    } catch (requestError) {
      setError(requestError?.message || 'Unable to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit OTP.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const data = await apiService.post(
        ENDPOINTS.PATIENTS.VERIFY_ACTIVATION_OTP,
        {
          patientId: Number(selectedPatientId),
          mobileNo,
          sessionId,
          otp
        },
        { requireAuth: false }
      );
      if (data.status !== 200) {
        setError(data.message || 'OTP verification failed.');
        return;
      }

      onSuccess?.({
        patientId: Number(selectedPatientId),
        message: data.response || data.message || 'Patient activated successfully.'
      });
    } catch (requestError) {
      setError(requestError?.message || 'OTP verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop-custom" style={{ zIndex: 1080 }} onClick={onClose}>
      <div className="modal-dialog-custom" style={{ maxWidth: '520px' }} onClick={event => event.stopPropagation()}>
        <div className="modal-header-custom">
          <h5 className="fw-bold">
            <i className="fas fa-user-check text-primary me-2"></i> Activate Patient Account
          </h5>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body-custom">
          {step === 'find' ? (
            <form onSubmit={handleFindPatients}>
              <p className="text-muted">Enter the registered mobile number to find inactive patient accounts.</p>
              <label htmlFor="activationMobileNo" className="form-label">Mobile No.</label>
              <input
                id="activationMobileNo"
                className="form-control mb-3"
                type="tel"
                value={mobileNo}
                maxLength={10}
                onChange={event => setMobileNo(event.target.value.replace(/\D/g, '').slice(0, 10))}
                required
              />
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Searching...' : 'Find Patient'}
              </button>

              {patients.length > 0 && (
                <div className="mt-4">
                  <label htmlFor="activationPatient" className="form-label">Select patient account</label>
                  <select
                    id="activationPatient"
                    className="form-select"
                    value={selectedPatientId}
                    onChange={event => setSelectedPatientId(event.target.value)}
                  >
                    {patients.map(patient => (
                      <option key={patient.patientId} value={patient.patientId}>
                        {patient.patientName} ({patient.relation}) - ID: {patient.patientId}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-primary mt-3"
                    onClick={handleSendOtp}
                    disabled={isLoading || !selectedPatientId}
                  >
                    {isLoading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </div>
              )}
            </form>
          ) : step === 'send' ? (
            <div>
              <p className="text-muted">
                Send an activation OTP for {patientName || `patient ID ${selectedPatientId}`}.
              </p>
              <div className="mb-3">
                <label htmlFor="activationMobileNo" className="form-label">Registered Mobile No.</label>
                <input
                  id="activationMobileNo"
                  className="form-control"
                  type="tel"
                  value={mobileNo}
                  maxLength={10}
                  onChange={event => setMobileNo(event.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                />
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSendOtp}
                disabled={isLoading || !selectedPatientId}
              >
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <p className="text-muted">
                Enter the 6-digit OTP sent to {mobileNo} to activate {patientName || `patient ID ${selectedPatientId}`}.
              </p>
              <label htmlFor="activationOtp" className="form-label">OTP</label>
              <input
                id="activationOtp"
                className="form-control mb-3"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify OTP & Activate'}
              </button>
              <button
                type="button"
                className="btn btn-link ms-2"
                onClick={() => {
                  setStep(isDirectActivation ? 'send' : 'find');
                  setOtp('');
                  setSessionId('');
                  setError('');
                }}
                disabled={isLoading}
              >
                Back
              </button>
            </form>
          )}

          {message && <div className="alert alert-success mt-3 mb-0" role="status">{message}</div>}
          {error && <div className="alert alert-danger mt-3 mb-0" role="alert">{error}</div>}
        </div>
      </div>
    </div>
  );
}
