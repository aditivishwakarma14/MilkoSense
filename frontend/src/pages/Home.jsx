import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, BarChart3, FileSpreadsheet, Sliders, Droplet, Mail, ArrowRight, Sun, Moon, X, Eye, EyeOff, Lock, User, Shield, Cloud, Thermometer, Home as HomeIcon } from 'lucide-react';
import useUiStore from '../app/store/uiStore';
import useAuthStore from '../app/store/authStore';
import authService from '../services/authService';
import AuthModal from '../components/auth/AuthModal';
import Navbar from '../components/layout/Navbar';

/* ── Main Home ── */
export default function Home() {
  const location = useLocation();
  const theme = useUiStore(s => s.theme);
  const toggleTheme = useUiStore(s => s.toggleTheme);
  const initTheme = useUiStore(s => s.initTheme);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    initTheme();
  }, []);

  const features = [
    { icon: <Activity style={{ width: 20, height: 20 }} />, color: '#047857', bg: '#ecfdf5', title: 'Live Telemetry', desc: 'Monitor real-time data from sensors on your farm.', to: '/' },
    { icon: <BarChart3 style={{ width: 20, height: 20 }} />, color: '#7c3aed', bg: '#f5f3ff', title: 'AI Analysis', desc: 'AI-powered insights to classify milk quality and detect anomalies.', to: '/analysis' },
    { icon: <Shield style={{ width: 20, height: 20 }} />, color: '#dc2626', bg: '#fef2f2', title: 'Compliance Reports', desc: 'Generate and download compliance reports in one click.', to: '/reports' },
    { icon: <Droplet style={{ width: 20, height: 20 }} />, color: '#7c3aed', bg: '#f5f3ff', title: 'Colorimetric Analysis', desc: 'Advanced milk color analysis for quality assurance.', to: '/colorimetric' },
    { icon: <Sliders style={{ width: 20, height: 20 }} />, color: '#047857', bg: '#ecfdf5', title: 'Sensor Dashboard', desc: 'Calibrate and configure all hardware nodes remotely.', to: '/sensors' },
    { icon: <Cloud style={{ width: 20, height: 20 }} />, color: '#0369a1', bg: '#f0f9ff', title: 'Secure Cloud Storage', desc: 'All telemetry and reports stored securely with 100% uptime.', to: '/' },
  ];

  const stats = [
    { icon: '🐄', value: '10,000+', label: 'Cows Monitored' },
    { icon: '📡', value: '50,000+', label: 'Sensors Connected' },
    { icon: '📈', value: '99.8%', label: 'Uptime' },
    { icon: '🔒', value: '100%', label: 'Data Secure' },
  ];

  return (
    <div className="bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text-primary" style={{ minHeight: '100vh', overflowX: 'hidden', fontFamily: "'Outfit','Inter',sans-serif" }}>
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      {/* ── NAVBAR ── */}
      <Navbar />

      <section className="bg-white dark:bg-dark-bg" style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>

        <div style={{ position: 'absolute', inset: 0, backgroundColor: theme === 'dark' ? '#09090B' : '#fff' }}>
          <img
            src="/cow.png"
            alt="MilkoSense IoT sensor device with dairy cows on farm"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              filter: theme === 'dark' ? 'brightness(1.12) contrast(1.08)' : 'none',
              transition: 'filter 0.3s ease',
            }}
          />
          {/* Cinematic readability overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: theme === 'dark'
              ? 'linear-gradient(90deg, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.94) 12%, rgba(0,0,0,0.88) 24%, rgba(0,0,0,0.75) 38%, rgba(0,0,0,0.58) 52%, rgba(0,0,0,0.35) 68%, rgba(0,0,0,0.15) 82%, transparent 100%)'
              : 'linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 15%, rgba(255,255,255,0.65) 30%, rgba(255,255,255,0.35) 45%, rgba(255,255,255,0.10) 60%, transparent 75%)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* Content on left white space */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, display: 'flex', alignItems: 'center' }}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            style={{ paddingLeft: 'clamp(1.5rem, 6vw, 5rem)', paddingRight: '2rem', maxWidth: 650, paddingTop: 72 }}
          >
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', border: theme === 'dark' ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(4,120,87,0.2)', background: theme === 'dark' ? 'rgba(16,185,129,0.15)' : 'rgba(4,120,87,0.05)', color: theme === 'dark' ? '#34D399' : '#047857', marginBottom: '1.25rem', backdropFilter: 'blur(4px)' }}>
              🚀 NEXT-GENERATION DAIRY INTELLIGENCE PLATFORM
            </div>

            {/* Headline */}
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, lineHeight: 1.08, color: theme === 'dark' ? '#F8FAFC' : '#0F172A', margin: '0 0 1rem 0' }}>
              Dairy Quality,{' '}
              <span style={{ color: theme === 'dark' ? '#34D399' : '#059669' }}>Reimagined.</span>
            </h1>

            {/* Sub-text */}
            <p style={{ fontSize: '1.1rem', color: theme === 'dark' ? '#E2E8F0' : '#334155', lineHeight: 1.7, marginBottom: '1.75rem', maxWidth: 450 }}>
              Stream live sensor telemetry, classify milk quality with AI,
              and generate compliance reports — all from one unified platform.
            </p>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {isAuthenticated ? (
                <Link to="/analysis" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.9rem 1.8rem', borderRadius: '14px', fontSize: '0.95rem',
                  fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', border: 'none',
                  textDecoration: 'none',
                  background: '#047857',
                  boxShadow: '0 10px 25px -5px rgba(4,120,87,0.4), 0 8px 10px -6px rgba(4,120,87,0.1)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#065F46'}
                onMouseLeave={e => e.currentTarget.style.background = '#047857'}>
                  Go to Dashboard <ArrowRight style={{ width: 16, height: 16 }} />
                </Link>
              ) : (
                <button onClick={() => setAuthOpen(true)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.9rem 1.8rem', borderRadius: '14px', fontSize: '0.95rem',
                  fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', border: 'none',
                  background: '#047857',
                  boxShadow: '0 10px 25px -5px rgba(4,120,87,0.4), 0 8px 10px -6px rgba(4,120,87,0.1)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#065F46'}
                onMouseLeave={e => e.currentTarget.style.background = '#047857'}>
                  <User style={{ width: 16, height: 16, color: theme === 'dark' ? '#a7f3d0' : '#FFFFFF' }} /> Sign In / Register
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES (Infinite Marquee) ── */}
      <section className="bg-gray-50 dark:bg-dark-surface" style={{ padding: '5rem 0', overflow: 'hidden' }}>
        <style>
          {`
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .marquee-track {
              display: flex;
              gap: 1.5rem;
              width: max-content;
              animation: marquee 35s linear infinite;
              padding: 1rem 1.5rem;
            }
            .marquee-track:hover {
              animation-play-state: paused;
            }
            .feature-card {
              width: 320px;
              flex-shrink: 0;
              background: #fff;
              border-radius: 1.5rem;
              padding: 1.75rem;
              border: 1px solid #f3f4f6;
              text-decoration: none;
              transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
              box-shadow: 0 4px 12px rgba(0,0,0,0.02);
              white-space: normal;
            }
            .feature-card:hover {
              box-shadow: 0 20px 40px rgba(0,0,0,0.08);
              transform: translateY(-6px);
              border-color: #a7f3d0;
            }
            .dark .feature-card {
              background: #141A18;
              border-color: rgba(255,255,255,0.06);
            }
            .dark .feature-card:hover {
              box-shadow: 0 20px 40px rgba(0,0,0,0.4);
              border-color: #34D399;
            }
          `}
        </style>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', fontWeight: 900, color: theme === 'dark' ? '#F8FAFC' : '#111827', margin: '0 0 1rem 0', letterSpacing: '-0.03em', lineHeight: 1.1 }}>Everything you need.</h2>
            <p style={{ color: theme === 'dark' ? '#94A3B8' : '#4b5563', fontSize: 'clamp(1.1rem, 2vw, 1.25rem)', margin: 0, fontWeight: 500 }}>Click any module to jump directly into that section of the platform.</p>
          </div>
        </div>

        {/* Infinite scrolling track */}
        <div style={{ display: 'flex', overflow: 'hidden' }}>
          <div className="marquee-track">
            {[...features, ...features, ...features].map((f, i) => (
              <Link key={f.title + i} to={f.to} className="feature-card">
                <div style={{ width: 48, height: 48, borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', background: theme === 'dark' ? `${f.color}22` : f.bg, color: f.color }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: theme === 'dark' ? '#F8FAFC' : '#111827', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>{f.title}</h3>
                <p style={{ fontSize: '0.95rem', color: theme === 'dark' ? '#94A3B8' : '#4b5563', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-white dark:bg-dark-bg border-t border-gray-100 dark:border-dark-border" style={{ padding: '3.5rem 1.5rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', textAlign: 'center' }}>
          {stats.map(s => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
              <div style={{ fontSize: '2.5rem' }}>{s.icon}</div>
              <p style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: theme === 'dark' ? '#F8FAFC' : '#111827', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{s.value}</p>
              <p style={{ fontSize: '1rem', color: theme === 'dark' ? '#94A3B8' : '#4b5563', fontWeight: 600, margin: 0, letterSpacing: '0.02em' }}>{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-gradient-to-br from-green-50 to-white dark:from-dark-surface dark:to-dark-bg" style={{ padding: '5rem 1.5rem' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center', borderRadius: '2rem', padding: '3rem', border: '1px solid #d1fae5', backgroundColor: theme === 'dark' ? '#141A18' : '#fff', boxShadow: theme === 'dark' ? '0 20px 60px rgba(0,0,0,0.4)' : '0 20px 60px rgba(4,120,87,0.1)' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 900, color: theme === 'dark' ? '#F8FAFC' : '#111827', margin: '0 0 0.75rem 0' }}>Ready to monitor?</h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '2rem' }}>Create your operator account and get live access to the MilkoSense intelligence platform.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {isAuthenticated ? (
              <Link to="/analysis" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 2rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', textDecoration: 'none', background: 'linear-gradient(135deg,#047857,#014d40)', boxShadow: '0 8px 24px rgba(4,120,87,0.25)' }}>
                Go to Dashboard <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
            ) : (
              <button onClick={() => setAuthOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 2rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#047857,#014d40)', boxShadow: '0 8px 24px rgba(4,120,87,0.25)' }}>
                Create Free Account <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
            )}
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white dark:bg-dark-bg border-t border-gray-100 dark:border-dark-border" style={{ padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 24, height: 24, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '0.75rem', background: 'linear-gradient(135deg,#047857,#014d40)' }}>M</div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280' }}>MilkoSense</span>
          </div>
          <p style={{ fontSize: '0.6875rem', color: '#9ca3af', fontFamily: 'monospace', margin: 0 }}>© 2025 MilkoSense IoT Platform. All rights reserved.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.6875rem', fontWeight: 600, color: '#9ca3af' }}>
            <Link to="/contact" style={{ color: '#9ca3af', textDecoration: 'none' }}>Contact</Link>
            <button onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '0.6875rem', fontWeight: 600 }}>
              {theme === 'dark' ? <Sun style={{ width: 12, height: 12 }} /> : <Moon style={{ width: 12, height: 12 }} />}
              {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
