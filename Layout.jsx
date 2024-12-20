import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './src/components/Navbar/Navbar';
import { isAuthenticated } from './src/utility/auth';
import Footer from './src/pages/Footer/Footer.jsx';

const Layout = () => {
  const isLoggedIn = isAuthenticated();

  return (
    <div className={`flex flex-col min-h-screen bg-gray-900 w-full items-center justify-between`}>
      <div className={`flex flex-col min-h-screen bg-black w-full`}>
        <Navbar />
        <div
          className={`flex-grow flex items-center justify-between text-white w-full h-full px-4`}>
          <div className="max-w-screen-lg w-full">
            <Outlet />
          </div>
        </div>
        <div className='w-full'>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Layout;
