import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, removeAuthToken } from '../../utility/auth.js'; // Import auth utility

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated()); // Initialize with auth status

  const handleLogout = () => {
    removeAuthToken(); // Remove auth token
    setIsLoggedIn(false); // Update state to trigger redirection
  };

  useEffect(() => {
    // Trigger a recheck when the component mounts or state changes
    if (!isAuthenticated()) {
      setIsLoggedIn(false);
    }
  }, []);

  if (!isLoggedIn) {
    return <Navigate to="/" replace />; // Redirect to login if logged out
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Home Page</h1>
      <button
        onClick={handleLogout}
        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition duration-200"
      >
        Logout
      </button>
    </div>
  );
};

export default Home;
