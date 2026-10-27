import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1 = Mobile input, 2 = OTP + New Password
  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedCode, setSelectedCode] = useState('+91');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [alert, setAlert] = useState(null);

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

  const handleSendResetOtp = async (e) => {
    if (e) e.preventDefault();
    if (!validateMobile()) return;

    setIsSendingOtp(true);
    setAlert({ message: `Sending reset OTP to ${selectedCode} ${mobileNumber}...`, type: 'info' });

    try {
      const data = await apiService.post(
        ENDPOINTS.AUTH.FORGOT_PASSWORD,
        { mobileNo: mobileNumber },
        { requireAuth: false }
      );

      if (data.status === 200) {
        setSessionId(data.response.sessionId);
        setOtp(['', '', '', '', '', '']);
        setStep(2);
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
    }
  };

  const isPasswordMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const isPasswordMismatch = newPassword && confirmPassword && newPassword !== confirmPassword;
  const isSubmitDisabled = 
    isResetting || 
    otp.join('').length !== 6 || 
    !newPassword.trim() || 
    !confirmPassword.trim() || 
    !isPasswordMatch;

  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitDisabled) return;

    setIsResetting(true);
    setAlert({ message: 'Updating password...', type: 'info' });

    try {
      const data = await apiService.post(
        ENDPOINTS.AUTH.RESET_PASSWORD,
        {
          mobileNo: mobileNumber,
          sessionId: sessionId,
          otp: otp.join(''),
          newPassword: newPassword,
        },
        { requireAuth: false }
      );

      if (data.status === 200) {
        setAlert({
          message: typeof data.response === 'string' ? data.response : 'Password updated successfully! Redirecting to login...',
          type: 'success',
        });
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setAlert({ message: data.message || 'Failed to update password', type: 'error' });
      }
    } catch (error) {
      setAlert({ message: error?.message || 'Network Error. Failed to reset password.', type: 'error' });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="container-fluid px-0">
      <AlertNotification alert={alert} onClose={() => setAlert(null)} />

      <div className="row g-0">
        {/* Left Medical Section */}
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

        {/* Right Section */}
        <div className="col-md-5 col-12">
          <div className="login-section">
            <div className="login-card">
              <div className="welcome-text">Account Recovery</div>
              <h2 className="login-title">
                {step === 1 ? 'Forgot Password' : 'Reset Password'}
              </h2>

              <form onSubmit={(e) => e.preventDefault()}>
                {step === 1 ? (
                  <>
                    <div className="mb-4">
                      <label htmlFor="mobileNumber" className="form-label">Registered Mobile Number</label>
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
                              handleSendResetOtp(e);
                            }
                          }}
                          required
                        />
                      </div>
                      <div className="form-text mt-2">
                        Enter your 10-digit mobile number to receive a verification OTP.
                      </div>
                    </div>

                    <div className="d-grid gap-3">
                      <button
                        type="button"
                        className="btn btn-login btn-pin"
                        onClick={handleSendResetOtp}
                        disabled={isSendingOtp}
                      >
                        {isSendingOtp ? (
                          <>
                            <span className="spinner me-2"></span> Sending OTP...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane me-2"></i> Send Reset OTP
                          </>
                        )}
                      </button>

                      <Link
                        to="/login"
                        className="btn btn-login btn-otp text-decoration-none"
                      >
                        <i className="fas fa-arrow-left me-2"></i> Back to Login
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Step 2: OTP + New Password + Confirm Password */}
                    <div className="mb-3">
                      <label className="form-label">Enter 6-digit OTP</label>
                      <div className="d-flex justify-content-between mb-2" style={{ gap: '8px' }}>
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => (otpRefs.current[index] = el)}
                            type="text"
                            className="form-control text-center mobile-input"
                            style={{
                              width: '45px',
                              height: '50px',
                              fontSize: '22px',
                              padding: '0',
                              borderRadius: '8px',
                              border: '1px solid #ced4da',
                              fontWeight: '600',
                              color: '#495057',
                            }}
                            maxLength={6}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            autoFocus={index === 0}
                          />
                        ))}
                      </div>
                      <div className="form-text">
                        OTP sent to {selectedCode} {mobileNumber}{' '}
                        <button
                          type="button"
                          className="btn btn-link p-0 text-decoration-none"
                          onClick={() => {
                            setStep(1);
                            setOtp(['', '', '', '', '', '']);
                          }}
                        >
                          Change Number
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="mb-3">
                      <label htmlFor="newPassword" className="form-label">New Password</label>
                      <div className="auth-input-group">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          className="form-control auth-input"
                          id="newPassword"
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          tabIndex="-1"
                          aria-label={showNewPassword ? "Hide password" : "Show password"}
                        >
                          <i className={`fas ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="mb-4">
                      <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                      <div className="auth-input-group">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="form-control auth-input"
                          id="confirmPassword"
                          placeholder="Re-enter new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isSubmitDisabled) {
                              handleResetPassword(e);
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          tabIndex="-1"
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                      {isPasswordMismatch && (
                        <div className="text-danger small mt-1">
                          <i className="fas fa-times-circle me-1"></i> Passwords do not match
                        </div>
                      )}
                      {isPasswordMatch && (
                        <div className="text-success small mt-1">
                          <i className="fas fa-check-circle me-1"></i> Passwords match
                        </div>
                      )}
                    </div>

                    <div className="d-grid gap-3">
                      <button
                        type="button"
                        className="btn btn-login btn-pin"
                        onClick={handleResetPassword}
                        disabled={isSubmitDisabled}
                      >
                        {isResetting ? (
                          <>
                            <span className="spinner me-2"></span> Updating Password...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-check-circle me-2"></i> Update Password
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        className="btn btn-login btn-outline-secondary"
                        onClick={handleSendResetOtp}
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

                      <div className="text-center mt-2">
                        <Link to="/login" className="forgot-password-link">
                          <i className="fas fa-arrow-left me-1"></i> Back to Login
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </form>

              <div className="footer-info mt-4">
                <p className="text-muted mb-0 text-center">
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
