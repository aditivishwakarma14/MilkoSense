import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loader from '../../components/ui/Loader';

// Lazy-loaded basic information components
const Home = lazy(() => import('../../pages/Home'));
const About = lazy(() => import('../../pages/About'));
const Team = lazy(() => import('../../pages/Team'));
const Contact = lazy(() => import('../../pages/Contact'));
const Colorimetric = lazy(() => import('../../pages/Colorimetric'));

// Lazy-loaded advanced engineering features
const AnalysisPage = lazy(() => import('../../features/analytics/pages/AnalysisPage'));
const ReportsPage = lazy(() => import('../../features/reports/pages/ReportsPage'));
const SensorsPage = lazy(() => import('../../features/sensors/pages/SensorsPage'));

const AppRouter = () => {
  return (
    <Suspense fallback={<Loader fullPage />}>
      <Routes>
        {/* Landing Page (Public Navigation) */}
        <Route path="/" element={<Home />} />

        {/* Dashboard Environment (Consolidated under common layout) */}
        <Route element={<DashboardLayout />}>
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/sensors" element={<SensorsPage />} />
          <Route path="/colorimetric" element={<Colorimetric />} />
          <Route path="/about" element={<About />} />
          <Route path="/team" element={<Team />} />
          <Route path="/contact" element={<Contact />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
