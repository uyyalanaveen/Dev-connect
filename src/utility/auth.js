export const isAuthenticated = () => {
  const token = localStorage.getItem('authToken');
  console.log("Auth Token Exists:", token !== null); // Debugging
  return token !== null;
};

export const setAuthToken = (token) => {
  localStorage.setItem('authToken', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
};
