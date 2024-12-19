import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, removeAuthToken } from '../../utility/auth.js'; // Import auth utility
import RoomCard from '../../components/Cards/RoomCard.jsx';
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
    return <Navigate to="/home" replace />; // Redirect to login if logged out
  }

  return (
    <div className="flex flex-col items-center justify-center h-full  bg-black">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Home Page</h1>
      {/* Room Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {[...Array(12)].map((_, index) => (
          <RoomCard key={index} />
        ))}
      </div>
      
    </div>
  );
};

export default Home;
