import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Lock, User, Mail, Shield } from 'lucide-react';
import useUiStore from '../../app/store/uiStore';
import useAuthStore from '../../app/store/authStore';
import authService from '../../services/authService';

const AuthModal = ({ onClose }) => {
  const [tab, setTab] = useState('login');
  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp' | 'success'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const theme = useUiStore(s => s.theme);
  const addToast = useUiStore(s => s.addToast);
  const setUser = useAuthStore(s => s.setUser);
  const navigate = useNavigate();

  // Reset state when switching tabs
  const switchTab = (t) => {
    setTab(t);
    setStep('credentials');
    setOtp('');
    setError('');
    setSuccessMsg('');
  };

  // Step 1 — Submit credentials (register or login)
  const handleCredentials = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'register') {
        if (!form.name.trim()) { setError('Name is required.'); setLoading(false); return; }
        if (form.password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }
        const res = await authService.register({ name: form.name, email: form.email, password: form.password });
        if (res.success) {
          setStep('otp');
          setSuccessMsg(res.message || 'OTP sent to your email.');
          addToast('OTP sent to your email successfully.', 'success');
        }
      } else {
        const res = await authService.login({ email: form.email, password: form.password });
        if (res.success) {
          setStep('otp');
          setSuccessMsg(res.message || 'OTP sent to your email.');
          addToast('OTP sent to your email successfully.', 'success');
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      addToast(err.message || 'Authentication request failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) { setError('Enter the 6-digit code from your email.'); return; }
    setLoading(true);
    try {
      let res;
      if (tab === 'register') {
        res = await authService.verifyRegisterOtp({ email: form.email, otp });
      } else {
        res = await authService.verifyLoginOtp({ email: form.email, otp });
      }
      if (res.success && res.data) {
        // Core fix: Update Zustand auth state so the Navbar & application reactive states synchronize immediately!
        setUser(res.data.user);
        
        setStep('success');
        setSuccessMsg(tab === 'register' ? 'Account created successfully!' : 'Login successful!');
        addToast(tab === 'register' ? 'Account created successfully!' : 'Signed in successfully!', 'success');
        
        setTimeout(() => {
          onClose();
          navigate('/analysis');
        }, 1800);
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP. Please try again.');
      addToast(err.message || 'OTP verification failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setError('');
    setOtp('');
    setLoading(true);
    try {
      if (tab === 'register') {
        await authService.register({ name: form.name, email: form.email, password: form.password });
      } else {
        await authService.login({ email: form.email, password: form.password });
      }
      setSuccessMsg('A new OTP has been sent to your email.');
      addToast('A new OTP has been sent to your email.', 'info');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
      addToast('Failed to resend OTP.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem',
    borderRadius: '0.75rem', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e5e7eb',
    background: theme === 'dark' ? '#09090B' : '#fff', color: theme === 'dark' ? '#F8FAFC' : '#111827',
    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={e => e.stopPropagation()}
          style={{ position: 'relative', width: '100%', maxWidth: '384px', margin: '0 1rem', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.2)', background: theme === 'dark' ? '#141A18' : '#fff', padding: '2rem' }}
        >
          <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.375rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', background: 'transparent', color: '#9ca3af' }}><X style={{ width: 16, height: 16 }} /></button>

          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1.25rem', marginBottom: '0.5rem', background: 'linear-gradient(135deg,#047857,#014d40)' }}>M</div>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'monospace' }}>MilkoSense Intelligence Platform</p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ padding: '0.625rem 0.875rem', borderRadius: '0.625rem', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 600, background: theme === 'dark' ? 'rgba(239,68,68,0.1)' : '#fef2f2', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          {/* ── Step: Credentials ── */}
          {step === 'credentials' && (
            <>
              {/* Tabs */}
              <div style={{ display: 'flex', background: theme === 'dark' ? '#09090B' : '#f3f4f6', borderRadius: '0.75rem', padding: '0.25rem', marginBottom: '1.25rem' }}>
                {['login', 'register'].map(t => (
                  <button key={t} onClick={() => switchTab(t)} style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: '0.625rem', border: 'none', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s', background: tab === t ? (theme === 'dark' ? '#141A18' : '#fff') : 'transparent', color: tab === t ? '#047857' : '#9ca3af', boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                    {t === 'login' ? 'Sign In' : 'Register'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {tab === 'register' && (
                  <div style={{ position: 'relative' }}>
                    <User style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#d1d5db' }} />
                    <input type="text" placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
                  </div>
                )}
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#d1d5db' }} />
                  <input required type="email" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#d1d5db' }} />
                  <input required type={showPass ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    style={{ ...inputStyle, paddingRight: '2.5rem' }} />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#d1d5db' }}>
                    {showPass ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: 'none', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, background: 'linear-gradient(135deg,#047857,#014d40)', transition: 'opacity 0.2s' }}>
                  {loading ? 'Please wait...' : tab === 'login' ? 'Sign In →' : 'Create Account →'}
                </button>
              </form>
            </>
          )}

          {/* ── Step: OTP Verification ── */}
          {step === 'otp' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: theme === 'dark' ? 'rgba(4,120,87,0.15)' : '#ecfdf5', display: 'flex', alignItems: 'center', justify: 'center', margin: '0 auto 0.75rem', fontSize: '1.75rem', justifyContent: 'center' }}>
                  📧
                </div>
                <h3 style={{ color: theme === 'dark' ? '#F8FAFC' : '#111827', fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.375rem' }}>
                  Check Your Email
                </h3>
                <p style={{ color: '#9ca3af', fontSize: '0.8rem', lineHeight: 1.5, margin: 0 }}>
                  We sent a 6-digit code to <strong style={{ color: theme === 'dark' ? '#34D399' : '#047857' }}>{form.email}</strong>
                </p>
              </div>

              {successMsg && (
                <div style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', marginBottom: '0.75rem', fontSize: '0.75rem', fontWeight: 600, background: theme === 'dark' ? 'rgba(16,185,129,0.1)' : '#ecfdf5', color: '#10b981', textAlign: 'center' }}>
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ position: 'relative' }}>
                  <Shield style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#d1d5db' }} />
                  <input required type="text" inputMode="numeric" maxLength={6} placeholder="Enter 6-digit OTP" value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    style={{ ...inputStyle, textAlign: 'center', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.5em', fontFamily: 'monospace', paddingLeft: '1rem' }} />
                </div>
                <button type="submit" disabled={loading || otp.length !== 6}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: 'none', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: (loading || otp.length !== 6) ? 'not-allowed' : 'pointer', opacity: (loading || otp.length !== 6) ? 0.5 : 1, background: 'linear-gradient(135deg,#047857,#014d40)', transition: 'opacity 0.2s' }}>
                  {loading ? 'Verifying...' : 'Verify OTP →'}
                </button>
              </form>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <button onClick={() => { setStep('credentials'); setError(''); setOtp(''); setSuccessMsg(''); }}
                  style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  ← Back
                </button>
                <button onClick={handleResendOtp} disabled={loading}
                  style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', background: 'transparent', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
                  Resend Code
                </button>
              </div>
            </>
          )}

          {/* ── Step: Success ── */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: theme === 'dark' ? 'rgba(16,185,129,0.15)' : '#ecfdf5', display: 'flex', alignItems: 'center', justify: 'center', margin: '0 auto 1rem', fontSize: '2rem', justifyContent: 'center' }}>
                ✅
              </div>
              <h3 style={{ color: theme === 'dark' ? '#F8FAFC' : '#111827', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
                {successMsg}
              </h3>
              <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: 0 }}>
                Redirecting to dashboard...
              </p>
            </div>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;
