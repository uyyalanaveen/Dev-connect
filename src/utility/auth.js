import {jwtDecode} from "jwt-decode"; 

export const isAuthenticated = () => {
  const token = localStorage.getItem("authToken");

  if (!token) return false; // No token, user is not authenticated

  try {
    const decoded = jwtDecode(token); // Decode the token
    const currentTime = Date.now() / 1000; // Get current time in seconds

    if (decoded.exp < currentTime) {
      removeAuthToken(); // Remove expired token
      return false;
    }

    return true; // Token is valid
  } catch (error) {
    removeAuthToken(); // Invalid token, remove it
    return false;
  }
};

export const setAuthToken = (token) => {
  localStorage.setItem("authToken", token);
};

export const removeAuthToken = () => {
  localStorage.removeItem("authToken");
};
