import React, { useState } from 'react';
import Logo from '../../assets/Logo.png';
import { FaBars, FaTimes } from 'react-icons/fa';

const NavItems = [
  { name: 'Home', href: '/' },
  { name: 'Features', href: '/features' },
  { name: 'Contact', href: '/contact' },
];

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white">
      {/* Logo Section */}
      <div className="flex items-center gap-3">
        <img src={Logo} alt="Logo" className="h-10 w-10 rounded-full" />
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">DevConnect</h1>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex gap-8 items-center">
        {NavItems.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className="text-sm sm:text-base hover:text-blue-500 transition-colors duration-300"
          >
            {item.name}
          </a>
        ))}
      </div>

      {/* Mobile Menu Toggle */}
      <div className="md:hidden">
        {isMobileMenuOpen ? (
          <FaTimes
            size={24}
            className="cursor-pointer hover:text-blue-500 transition duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        ) : (
          <FaBars
            size={24}
            className="cursor-pointer hover:text-blue-500 transition duration-300"
            onClick={() => setIsMobileMenuOpen(true)}
          />
        )}
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="fixed top-0 left-0 w-3/4 h-full bg-gray-800 p-6 z-50 flex flex-col gap-6 text-lg shadow-lg">
          <FaTimes
            size={24}
            className="self-end mb-4 cursor-pointer hover:text-blue-500 transition duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {NavItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="hover:text-blue-500 transition-colors duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.name}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
