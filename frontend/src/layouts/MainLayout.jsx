import React from 'react';
import { Outlet } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import Footer from '../components/Footer';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Header */}
      <AppNavbar />

      {/* Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MainLayout;
