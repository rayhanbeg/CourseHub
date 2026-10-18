import React from 'react';
import { Outlet } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import Footer from '../components/Footer';
import { PageTransition } from '../lib/motion';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Header */}
      <AppNavbar />
      {/* Page Content */}
      <main className="flex-1">
        <PageTransition><Outlet /></PageTransition>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MainLayout;
