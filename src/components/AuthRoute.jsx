import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, removeAuthToken } from '../utility/auth';

const AuthRoute = ({ children }) => {
  if (!isAuthenticated()) {
    removeAuthToken(); 
    return <Navigate to="/login" />;
  }
  return children;
};

export default AuthRoute;
