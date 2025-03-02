import React from "react";
import Logo from "../../assets/Logo.png";
import { Link } from "react-router-dom";
const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-between items-center">
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <h2 className="text-2xl font-bold">DEVCONNECT</h2>
            <p className="text-gray-400 mt-2">
              Empowering collaboration and learning with modern tools.
            </p>
          </div>

          {/* Links Section */}
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="hover:text-blue-400 transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-blue-400 transition">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-blue-400 transition">
                  Contact
                </Link>
              </li>
              
            </ul>
          </div>

          {/* Social Media */}
          <div className="w-full md:w-1/3">
            {/* <h3 className="text-lg font-semibold mb-4">Follow Us</h3> */}
            <div className="flex space-x-4">
              <Link
                to="#"
                className="text-gray-400 hover:text-blue-400 transition"
                aria-label="Facebook"
              >
                <i className="fab fa-facebook-f"></i>
              </Link>
              <Link
                href="#"
                className="text-gray-400 hover:text-blue-400 transition"
                aria-label="Twitter"
              >
                <i className="fab fa-twitter"></i>
              </Link>
              <Link
                href="#"
                className="text-gray-400 hover:text-blue-400 transition"
                aria-label="LinkedIn"
              >
                <i className="fab fa-linkedin-in"></i>
              </Link>
              <Link
                href="#"
                className="text-gray-400 hover:text-blue-400 transition"
                aria-label="GitHub"
              >
                <i className="fab fa-github"></i>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 border-t border-gray-700 pt-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} DevConnect. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
