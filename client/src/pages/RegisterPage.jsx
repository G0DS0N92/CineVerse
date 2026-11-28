import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { sendVerificationOTP } from '../services/emailService';
import Toast from '../components/Toast';

const RegisterPage = () => {
  // Step: 'form' (initial details) or 'otp' (verify 6-digit code)
  const [step, setStep] = useState('form');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // OTP State
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [demoNotice, setDemoNotice] = useState('');

  // UI State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const otpInputRef = useRef(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Focus OTP input when switching to OTP step
  useEffect(() => {
    if (step === 'otp' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  // Generate a random 6-digit code
  const generateNewOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Step 1: Validate Details and Send OTP
  const handleInitiateOtp = async (e) => {
    e.preventDefault();
    setError('');
    setDemoNotice('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    const numAge = Number(age);
    if (!age || isNaN(numAge) || numAge < 1 || numAge > 120) {
      setError('Please provide a valid age between 1 and 120.');
      return;
    }

    setLoading(true);

    try {
      // 1. Verify email is not already registered in MongoDB
      const { data: checkData } = await API.post('/auth/check-email', { email });
      if (!checkData.success) {
        setError(checkData.message || 'An account with this email already exists.');
        setLoading(false);
        return;
      }

      // 2. Generate new 6-digit OTP valid for 5 minutes
      const newOtp = generateNewOtp();
      setGeneratedOtp(newOtp);
      setOtpExpiry(Date.now() + 5 * 60 * 1000); // 5 minutes

      // 3. Dispatch email via EmailJS
      const emailResult = await sendVerificationOTP(email, name, newOtp);

      if (emailResult.mode === 'demo') {
        setDemoNotice(
          `EmailJS keys not detected in .env yet. Your test OTP is: ${newOtp}`
        );
      }

      setStep('otp');
      setResendCooldown(60); // 60s cooldown for resending
      setToast({ message: `Verification code sent to ${email}`, type: 'success' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setDemoNotice('');
    setLoading(true);

    try {
      const newOtp = generateNewOtp();
      setGeneratedOtp(newOtp);
      setOtpExpiry(Date.now() + 5 * 60 * 1000);

      const emailResult = await sendVerificationOTP(email, name, newOtp);

      if (emailResult.mode === 'demo') {
        setDemoNotice(
          `EmailJS keys not detected in .env yet. Your test OTP is: ${newOtp}`
        );
      }

      setResendCooldown(60);
      setToast({ message: 'A new verification code has been sent!', type: 'success' });
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Validate OTP and Complete Registration
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEntered = enteredOtp.trim();

    if (!cleanEntered || cleanEntered.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    if (Date.now() > otpExpiry) {
      setError('Verification code has expired. Please click Resend Code below.');
      return;
    }

    if (cleanEntered !== generatedOtp) {
      setError('Invalid verification code. Please check your email and try again.');
      return;
    }

    setLoading(true);

    try {
      // Create user account in MongoDB
      await register(name, email, password, Number(age));
      setToast({ message: 'Account verified and created successfully!', type: 'success' });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '36px 30px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* ============================================================ */}
        {/* STEP 1: REGISTRATION DETAILS FORM                            */}
        {/* ============================================================ */}
        {step === 'form' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '26px' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Create Account</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '6px' }}>
                Join CineVerse to track movies and schedule reminders
              </p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleInitiateOtp}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Alex Mercer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Age</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 21"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                  Used to personalize content and apply age ratings (18+ filters).
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Password (min 6 characters)</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', marginTop: '10px' }}
                disabled={loading}
              >
                {loading ? 'Sending Verification Code...' : 'Continue to Email Verification'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--accent-hover)', fontWeight: 600 }}>
                Sign in here
              </Link>
            </p>
          </>
        )}

        {/* ============================================================ */}
        {/* STEP 2: EMAIL OTP VERIFICATION                               */}
        {/* ============================================================ */}
        {step === 'otp' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              {/* Shield / Mail Icon */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(var(--accent-rgb), 0.15)',
                  border: '2px solid rgba(var(--accent-rgb), 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 0 20px rgba(var(--accent-rgb), 0.3)',
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent-primary)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>

              <h1 style={{ fontSize: '1.7rem', fontWeight: 800 }}>Verify Your Email</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px' }}>
                We sent a 6-digit verification code to
              </p>
              <p style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.96rem', marginTop: '2px' }}>
                {email}
              </p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {demoNotice && (
              <div
                className="alert alert-warning"
                style={{
                  fontSize: '0.84rem',
                  background: 'rgba(234, 179, 8, 0.12)',
                  borderColor: 'rgba(234, 179, 8, 0.4)',
                  color: '#facc15',
                }}
              >
                {demoNotice}
              </div>
            )}

            <form onSubmit={handleVerifyAndRegister}>
              <div className="form-group" style={{ textAlign: 'center', marginBottom: '22px' }}>
                <label className="form-label" style={{ fontSize: '0.84rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Enter 6-Digit OTP Code
                </label>
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setEnteredOtp(val);
                  }}
                  className="form-control"
                  placeholder="------"
                  style={{
                    fontSize: '2rem',
                    letterSpacing: '14px',
                    textAlign: 'center',
                    fontWeight: 800,
                    padding: '14px 10px',
                    color: '#ffffff',
                    background: '#0a0e17',
                    border: '2px solid rgba(var(--accent-rgb), 0.5)',
                    boxShadow: '0 0 16px rgba(var(--accent-rgb), 0.2)',
                    borderRadius: 'var(--radius-md)',
                  }}
                  required
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '8px', display: 'block' }}>
                  The code expires in 5 minutes.
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 700 }}
                disabled={loading || enteredOtp.length !== 6}
              >
                {loading ? 'Creating Your Account...' : 'Verify & Create Account'}
              </button>

              {/* Resend and Back Controls */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '22px',
                  fontSize: '0.86rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setError('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  &larr; Change Details
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? 'var(--text-dim)' : 'var(--accent-hover)',
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    padding: 0,
                  }}
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default RegisterPage;
