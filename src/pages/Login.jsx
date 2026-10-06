import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertNotification from '../components/AlertNotification';
import { apiService } from '../services/apiService';
import { ENDPOINTS } from '../constants/apiEndpoints';

const COUNTRY_CODES = [
  { code: '+91', country: 'India' },
  { code: '+1', country: 'USA' },
  { code: '+44', country: 'UK' },
  { code: '+61', country: 'Australia' },
  { code: '+971', country: 'UAE' },
];

export default function Login() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedCode, setSelectedCode] = useState('+91');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [alert, setAlert] = useState(null);
  
  const [sessionId, setSessionId] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const otpRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMobileChange = (e) => {
    const cleanValue = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(cleanValue);
  };

  const validateMobile = () => {
    const trimmed = mobileNumber.trim();
    if (!trimmed) {
      setAlert({ message: 'Please enter your mobile number', type: 'warning' });
      inputRef.current?.focus();
      return false;
    }
    if (trimmed.length !== 10) {
      setAlert({ message: 'Please enter a valid 10-digit mobile number', type: 'warning' });
      inputRef.current?.focus();
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(trimmed)) {
      setAlert({ message: 'Mobile number should start with 6, 7, 8, or 9', type: 'warning' });
      inputRef.current?.focus();
      return false;
    }
    return true;
  };

  const handleLoginWithPin = (e) => {
    e.preventDefault();
    setAlert({ message: 'Login with PIN is currently not available.', type: 'warning' });
  };

  const handleGetOtp = async (e) => {
    e.preventDefault();
    if (!validateMobile()) return;

    setIsSendingOtp(true);
    setAlert({ message: `Sending OTP to ${selectedCode} ${mobileNumber}...`, type: 'info' });

    try {
      const data = await apiService.post(ENDPOINTS.AUTH.SEND_OTP, { mobileNo: mobileNumber }, { requireAuth: false });
      if (data.status === 200) {
        setSessionId(data.response.sessionId);
        setOtp(['', '', '', '', '', '']);
        setShowOtpInput(true);
        setAlert({ message: data.response.message || 'OTP sent successfully', type: 'success' });
      } else {
        setAlert({ message: data.message || 'Failed to send OTP', type: 'error' });
      }
    } catch (error) {
      setAlert({ message: error?.message || 'Network Error. Failed to send OTP.', type: 'error' });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpChange = (index, e) => {
    const value = e.target.value;
    const val = value.replace(/\D/g, '');
    const newOtp = [...otp];

    if (!val) {
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    if (val.length > 1) {
      const chars = val.split('').slice(0, 6 - index);
      chars.forEach((c, i) => {
        newOtp[index + i] = c;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + chars.length, 5);
      otpRefs.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = val;
    setOtp(newOtp);

    if (val && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      handleVerifyOtp(e);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setAlert({ message: 'Please enter a valid 6-digit OTP', type: 'warning' });
      return;
    }

    setIsVerifyingOtp(true);
    setAlert({ message: `Verifying OTP...`, type: 'info' });

    try {
      const data = await apiService.post(ENDPOINTS.AUTH.VERIFY_OTP, {
        otp: otpString,
        sessionId,
        mobileNo: mobileNumber
      }, { requireAuth: false });

      if (data.status === 200) {
        // Store the token
        localStorage.setItem('token', data.response.token);
        if (data.response.refreshToken) {
          localStorage.setItem('refreshToken', data.response.refreshToken);
        }
        // Store patient details if available
        if (data.response.patientIdResponseList && data.response.patientIdResponseList.length > 0) {
          localStorage.setItem('patientDetails', JSON.stringify(data.response.patientIdResponseList[0]));
          localStorage.setItem('patientList', JSON.stringify(data.response.patientIdResponseList));
        }
        
        setAlert({ message: data.response.message || 'Login successful! Redirecting...', type: 'success' });
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        setAlert({ message: data.message || 'Invalid OTP', type: 'error' });
      }
    } catch (error) {
      setAlert({ message: error?.message || 'Network Error. Failed to verify OTP.', type: 'error' });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="container-fluid px-0">
      <AlertNotification alert={alert} onClose={() => setAlert(null)} />
      
      <div className="row g-0">
        <div className="col-md-7 medical-theme-section">
          <div className="medical-background">
            <div className="medical-pattern"></div>
            
            {/* Logo */}
            <div className="logo-section">
              <img src="https://i.postimg.cc/K8xgWmqf/logo-hal.png" alt="ARI-Health Logo" />
            </div>
            
            {/* Medical Animated Illustration */}
            <div className="medical-illustration">
              <i className="fas fa-heartbeat medical-icon heart-icon"></i>
              <i className="fas fa-shield-alt medical-icon shield-icon"></i>
              <i className="fas fa-stethoscope medical-icon stethoscope-icon"></i>
            </div>
            
            {/* Content & Feature Badges */}
            <div className="medical-content">
              <h1 className="medical-title">Advanced Healthcare Platform</h1>
              <p className="medical-subtitle">
                Secure, efficient, and designed for modern healthcare needs. 
                Connecting patients with medical excellence.
              </p>
              
              <div className="features-grid">
                <div className="feature-item">
                  <div className="feature-icon">
                    <i className="fas fa-lock"></i>
                  </div>
                  <div className="feature-text">HIPAA Compliant</div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">
                    <i className="fas fa-bolt"></i>
                  </div>
                  <div className="feature-text">Instant Access</div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">
                    <i className="fas fa-user-md"></i>
                  </div>
                  <div className="feature-text">Doctor Verified</div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">
                    <i className="fas fa-chart-line"></i>
                  </div>
                  <div className="feature-text">Health Analytics</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Login Section */}
        <div className="col-md-5 col-12">
          <div className="login-section">
            <div className="login-card">
              <div className="welcome-text">Welcome Back</div>
              <h2 className="login-title">Login with your Mobile Number</h2>
              
              <form onSubmit={(e) => e.preventDefault()} id="loginForm">
                {!showOtpInput ? (
                  <>
                    <div className="mb-4">
                      <label htmlFor="mobileNumber" className="form-label">Mobile Number</label>
                      <div className="input-group position-relative" ref={dropdownRef}>
                        <div 
                          className="country-code-dropdown" 
                          id="countryCodeDropdown"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                          <span>{selectedCode}</span>
                          <span className="dropdown-arrow">
                            <i className="fas fa-chevron-down"></i>
                          </span>
                        </div>

                        {isDropdownOpen && (
                          <ul 
                            className="dropdown-menu show position-absolute" 
                            style={{ top: '100%', left: 0, zIndex: 1000, width: '180px' }}
                          >
                            {COUNTRY_CODES.map((item) => (
                              <li key={item.code}>
                                <button
                                  type="button"
                                  className="dropdown-item"
                                  onClick={() => {
                                    setSelectedCode(item.code);
                                    setIsDropdownOpen(false);
                                  }}
                                >
                                  <strong>{item.code}</strong> {item.country}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}

                        <input 
                          ref={inputRef}
                          type="tel" 
                          className="form-control mobile-input" 
                          id="mobileNumber" 
                          placeholder="Enter 10 digit mobile number" 
                          maxLength={10}
                          pattern="[0-9]{10}" 
                          value={mobileNumber}
                          onChange={handleMobileChange}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleGetOtp(e);
                            }
                          }}
                          required 
                        />
                      </div>
                      <div className="form-text mt-2">Please enter your 10-digit mobile number.</div>
                    </div>
                    
                    <div className="d-grid gap-3">
                      <button 
                        type="button" 
                        className="btn btn-login btn-pin" 
                        id="loginWithPin"
                        onClick={handleLoginWithPin}
                        disabled={isVerifyingPin || isSendingOtp}
                      >
                        {isVerifyingPin ? (
                          <>
                            <span className="spinner me-2"></span> Verifying PIN...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-key me-2"></i> Login With Pin
                          </>
                        )}
                      </button>
                      
                      <button 
                        type="button" 
                        className="btn btn-login btn-otp" 
                        id="getOtp"
                        onClick={handleGetOtp}
                        disabled={isVerifyingPin || isSendingOtp}
                      >
                        {isSendingOtp ? (
                          <>
                            <span className="spinner me-2"></span> Sending OTP...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-mobile-alt me-2"></i> Get OTP
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <label className="form-label">Enter 6-digit OTP</label>
                      <div className="d-flex justify-content-between mb-3" style={{ gap: '8px' }}>
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => (otpRefs.current[index] = el)}
                            type="text"
                            className="form-control text-center mobile-input"
                            style={{ 
                              width: '45px', 
                              height: '50px', 
                              fontSize: '24px',
                              padding: '0',
                              borderRadius: '8px',
                              border: '1px solid #ced4da',
                              fontWeight: '600',
                              color: '#495057'
                            }}
                            maxLength={6} // allow paste
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            autoFocus={index === 0}
                          />
                        ))}
                      </div>
                      <div className="form-text mt-2">
                        OTP sent to {selectedCode} {mobileNumber}{' '}
                        <button 
                          type="button" 
                          className="btn btn-link p-0 text-decoration-none" 
                          onClick={() => {
                            setShowOtpInput(false);
                            setOtp(['', '', '', '', '', '']);
                          }}
                        >
                          Change Number
                        </button>
                      </div>
                    </div>
                    
                    <div className="d-grid gap-3">
                      <button 
                        type="button" 
                        className="btn btn-login btn-otp" 
                        id="verifyOtp"
                        onClick={handleVerifyOtp}
                        disabled={isVerifyingOtp}
                      >
                        {isVerifyingOtp ? (
                          <>
                            <span className="spinner me-2"></span> Verifying OTP...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-check-circle me-2"></i> Verify OTP
                          </>
                        )}
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-login btn-outline-secondary" 
                        onClick={handleGetOtp}
                        disabled={isSendingOtp}
                        style={{ backgroundColor: 'transparent', border: '1px solid #dee2e6', color: '#6c757d' }}
                      >
                        {isSendingOtp ? (
                          <>
                            <span className="spinner me-2"></span> Resending...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-redo me-2"></i> Resend OTP
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>
              
              <div className="footer-info">
                <p className="text-muted mb-2">
                  By logging in, you agree to our{' '}
                  <a href="#terms" className="text-decoration-none">Terms & Conditions</a>{' '}
                  and{' '}
                  <a href="#privacy" className="text-decoration-none">Privacy Policy</a>
                </p>
                <p className="text-muted mb-0">
                  Need help?{' '}
                  <a href="#support" className="text-decoration-none">Contact Support</a>{' '}
                  or call 1800-300-9000
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
