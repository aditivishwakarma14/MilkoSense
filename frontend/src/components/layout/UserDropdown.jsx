import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Settings, Layout, ChevronDown, Shield, CheckCircle } from 'lucide-react';
import useUiStore from '../../app/store/uiStore';
import useAuthStore from '../../app/store/authStore';

export default function UserDropdown() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const theme = useUiStore(s => s.theme);
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  // Initial from user name
  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.375rem 0.75rem',
          borderRadius: '9999px',
          border: theme === 'dark' ? '1px solid rgba(4,120,87,0.2)' : '1px solid rgba(0,0,0,0.08)',
          background: theme === 'dark' ? 'rgba(10,15,13,0.6)' : 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(8px)',
          color: theme === 'dark' ? '#F8FAFC' : '#1F2937',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          outline: 'none',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = theme === 'dark' ? '#10b981' : '#047857';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(4,120,87,0.05)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = theme === 'dark' ? 'rgba(4,120,87,0.2)' : 'rgba(0,0,0,0.08)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{ position: 'relative', display: 'flex' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #047857)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              fontWeight: 800,
              fontSize: '0.8rem',
              letterSpacing: '0.05em',
              boxShadow: '0 2px 8px rgba(16,185,129,0.25)',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {initials}
          </div>
          {/* Status Indicator */}
          <span
            style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              border: `2px solid ${theme === 'dark' ? '#141A18' : '#FFFFFF'}`,
              boxShadow: '0 0 8px #10b981',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', marginRight: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.name}
          </span>
          <span style={{ fontSize: '0.65rem', color: theme === 'dark' ? '#a7f3d0' : '#047857', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
            <Shield style={{ width: 8, height: 8 }} /> Operator
          </span>
        </div>

        <ChevronDown style={{ width: 14, height: 14, color: '#9ca3af', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '260px',
              borderRadius: '1.25rem',
              border: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
              background: theme === 'dark' ? '#141A18' : '#FFFFFF',
              boxShadow: theme === 'dark' ? '0 20px 40px rgba(0,0,0,0.4)' : '0 20px 40px rgba(0,0,0,0.08)',
              backdropFilter: 'blur(20px)',
              overflow: 'hidden',
              zIndex: 100,
              padding: '0.5rem',
            }}
          >
            {/* User Details Header */}
            <div style={{ padding: '0.75rem 1rem', borderBottom: theme === 'dark' ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)', marginBottom: '0.375rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: theme === 'dark' ? '#F8FAFC' : '#111827' }}>
                  {user.name}
                </span>
                <span style={{ padding: '0.1rem 0.4rem', borderRadius: '9999px', fontSize: '0.6rem', fontWeight: 700, background: theme === 'dark' ? 'rgba(16,185,129,0.1)' : '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <CheckCircle style={{ width: 8, height: 8 }} /> Verified
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#9ca3af', wordBreak: 'break-all' }}>
                {user.email}
              </span>
            </div>

            {/* Menu Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <Link
                to="/analysis"
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: theme === 'dark' ? '#d1d5db' : '#4b5563',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
                  e.currentTarget.style.color = theme === 'dark' ? '#10b981' : '#047857';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = theme === 'dark' ? '#d1d5db' : '#4b5563';
                }}
              >
                <Layout style={{ width: 14, height: 14 }} />
                <span>Go to Dashboard</span>
              </Link>

              <Link
                to="/contact"
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: theme === 'dark' ? '#d1d5db' : '#4b5563',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
                  e.currentTarget.style.color = theme === 'dark' ? '#10b981' : '#047857';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = theme === 'dark' ? '#d1d5db' : '#4b5563';
                }}
              >
                <Settings style={{ width: 14, height: 14 }} />
                <span>Support & Settings</span>
              </Link>

              <div style={{ height: '1px', background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', margin: '0.375rem 0' }} />

              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#ef4444',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <LogOut style={{ width: 14, height: 14 }} />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
