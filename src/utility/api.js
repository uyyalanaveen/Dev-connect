const API_URL = 'https://devconnect-backend-6opy.onrender.com/api'; // Backend URL


export const signupUser = async (fullname, email, password) => {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullname, email, password }),
    });

    const data = await response.json(); // Consume once

    if (!response.ok) {
      throw new Error(data.message || "Failed to register user");
    }

    console.log("Response Data:", data);
    return data;
  } catch (error) {
    console.error("Signup Error:", error.message);
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