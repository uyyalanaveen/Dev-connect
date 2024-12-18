const API_URL = 'https://dev-conncet-backend.onrender.com/api'; // Backend URL

// Signup API Call
export const signupUser = async (fullname, number, email, password) => {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fullname, number, email, password }),
    });

    // Log response for debugging
    console.log('API Response:', response);

    if (!response.ok) {
      const errorData = await response.json(); // Get the error message from backend
      throw new Error(errorData.message || 'Failed to register user');
    }

    const data = await response.json();
    console.log('Response Data:', data);
    return data;
  } catch (error) {
    console.error('Error in signupUser:', error);
    throw new Error(error.message);
  }
};

// Send OTP API Call
export const sendOtp = async (email) => {
  try {
    const response = await fetch(`${API_URL}/request-otp-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    // Log response for debugging
    const responseData = await response.json();
    console.log('OTP Response:', responseData);

    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to send OTP');
    }

    return responseData; // Returning success response
  } catch (error) {
    console.error('Error in sendOtp:', error);
    throw new Error(error.message);
  }
};

// Verify OTP API Call
export const verifyOtp = async (email, otp) => {
  try {
    const response = await fetch(`${API_URL}/validate-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    // Log response for debugging
    const responseData = await response.json();
    console.log('OTP Verification Response:', responseData);

    if (!response.ok) {
      throw new Error(responseData.message || 'Invalid OTP');
    }

    return responseData; // Returning success response
  } catch (error) {
    console.error('Error in verifyOtp:', error);
    throw new Error(error.message);
  }
};