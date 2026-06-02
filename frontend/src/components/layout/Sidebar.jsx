import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import useUiStore from '../../app/store/uiStore';
import {
  Activity,
  BarChart3,
  FileSpreadsheet,
  Sliders,
  Droplet,
  Home,
  BookOpen,
  Users,
  Mail,
  X
} from 'lucide-react';

const Sidebar = () => {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const setSidebar = useUiStore((state) => state.setSidebar);

  const links = [
    { to: '/', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { to: '/analysis', label: 'AI Analysis', icon: <BarChart3 className="w-5 h-5" /> }
  ];

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-800 bg-dark-panel p-5 
    transition-all duration-300 md:sticky md:z-30 md:translate-x-0
    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <>
      {/* Background dimmer overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebar(false)}
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden backdrop-blur-xs"
        />
      )}

      <aside className={sidebarClasses}>
        {/* Logo and branding */}
        <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-iot-cyan to-iot-blue flex items-center justify-center text-white font-bold text-xl shadow-[0_0_15px_rgba(6,182,212,0.45)]">
              M
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-wider text-gray-100 font-sans">MILKOSENSE</h1>
              <span className="text-[9px] font-mono tracking-widest text-iot-cyan uppercase">IoT Analytics 2.0</span>
            </div>
          </Link>

          <button
            onClick={() => setSidebar(false)}
            className="p-1 rounded-lg text-gray-400 hover:bg-gray-800 md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Dashboard Navigation */}
        <nav className="flex-1 space-y-1.5">
          <p className="text-[10px] font-bold tracking-widest text-gray-500 dark:text-dark-text-muted uppercase px-3 mb-2 font-mono">Telemetry Nodes</p>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setSidebar(false)}
              className={({ isActive }) => `
                flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200
                ${isActive
                  ? 'bg-iot-cyan/10 text-iot-cyan border border-iot-cyan/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900 border border-transparent'}
              `}
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}

        </nav>

        {/* Sidebar footer badge */}
        <div className="mt-auto border-t border-gray-800 pt-4 flex flex-col gap-1 text-[10px] text-gray-500 dark:text-dark-text-muted font-mono">
          <p>DOCKER CLUSTER: Active</p>
          <p>ENGINE: Node v20.10.0</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
