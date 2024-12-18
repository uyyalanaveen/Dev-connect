import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './src/components/Navbar/Navbar';

const Layout = () => {
  return (
    <div className="flex flex-col bg-black">
      {/* Navbar */}
      
        <Navbar />

      {/* Main Content */}
      <div className="max-w-screen-lg mx-auto w-full  text-white max-h-full h-screen mt-1">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
