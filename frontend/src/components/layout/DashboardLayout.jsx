import React from 'react';
import { Outlet } from 'react-router-dom';
import SocketProvider from '../../app/providers/SocketProvider';
import ErrorBoundary from '../ui/ErrorBoundary';
import ToastContainer from '../ui/Toast';
import Navbar from './Navbar';
import Footer from './Footer';

const DashboardLayout = () => {
  return (
    <SocketProvider>
      <div className="min-h-screen w-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-dark-text-primary flex flex-col">
        <Navbar />
        
        <main className="flex-1 bg-gray-50 dark:bg-dark-bg p-6 pt-24">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
        
        <Footer />
        <ToastContainer />
      </div>
    </SocketProvider>
  );
};

export default DashboardLayout;
