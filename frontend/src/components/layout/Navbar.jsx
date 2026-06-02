import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import useUiStore from '../../app/store/uiStore';
import useAuthStore from '../../app/store/authStore';
import UserDropdown from './UserDropdown';
import AuthModal from '../auth/AuthModal';
import { Activity, BarChart3, FileSpreadsheet, Sliders, Droplet, Mail, Sun, Moon, Home } from 'lucide-react';

const Navbar = () => {
  const theme = useUiStore(s => s.theme);
  const toggleTheme = useUiStore(s => s.toggleTheme);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const navLinks = [
    { label: 'Home', to: '/', icon: <Home style={{ width: 14, height: 14 }} /> },
    { label: 'AI Analysis', to: '/analysis', icon: <BarChart3 style={{ width: 14, height: 14 }} /> },
    { label: 'Reports', to: '/reports', icon: <FileSpreadsheet style={{ width: 14, height: 14 }} /> },
    { label: 'Sensors', to: '/sensors', icon: <Sliders style={{ width: 14, height: 14 }} /> },
    { label: 'Colorimetric', to: '/colorimetric', icon: <Droplet style={{ width: 14, height: 14 }} /> },
    { label: 'Contact', to: '/contact', icon: <Mail style={{ width: 14, height: 14 }} /> },
  ];

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 backdrop-blur-[20px] ${scrolled ? 'bg-white/95 dark:bg-dark-surface/95 border-b border-emerald-700/10 dark:border-dark-border shadow-[0_2px_24px_rgba(0,0,0,0.07)] dark:shadow-black/20' : 'bg-white/88 dark:bg-dark-bg/88 border-b border-emerald-700/5 dark:border-dark-border/50 shadow-none'}`}>
        <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm bg-gradient-to-br from-[#047857] to-[#014d40]">M</div>
            <span className="font-black text-[1.1rem] tracking-[0.12em] uppercase text-gray-900 dark:text-dark-text-primary">MilkoSense</span>
          </Link>

          {/* Centre nav pill */}
          <nav className="flex items-center gap-1 py-1.5 px-2 rounded-full border border-gray-200 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80">
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} className={`flex items-center gap-1.5 py-[0.45rem] px-[0.85rem] rounded-full text-[0.85rem] font-semibold transition-all duration-200 no-underline ${location.pathname === l.to ? 'text-brand-primary bg-emerald-50 dark:bg-brand-primary/10' : 'text-gray-500 dark:text-dark-text-muted hover:text-brand-primary dark:hover:text-brand-primary hover:bg-emerald-50 dark:hover:bg-brand-primary/10'}`}>
                {l.icon}{l.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <UserDropdown />
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer transition-all bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg"
              >
                Sign In
              </button>
            )}
            
            <button onClick={toggleTheme} className="p-2 rounded-full border border-gray-200 dark:border-dark-border bg-transparent text-gray-500 dark:text-dark-text-muted hover:bg-gray-100 dark:hover:bg-dark-elevated transition-colors flex items-center justify-center cursor-pointer">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>
      
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  );
};

export default Navbar;
