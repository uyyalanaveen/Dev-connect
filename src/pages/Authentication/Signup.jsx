import React, { useState, useEffect } from 'react';
import Input from '../../components/Input';
import { signupUser, sendOtp, verifyOtp } from '../../../api.js'; // Import verifyOtp
import { useNavigate, Link } from 'react-router-dom'; // Link for navigation
import { setAuthToken } from '../../utility/auth.js'; // Token utility

const Signup = () => {
  const [fullname, setFullname] = useState('');
  const [number, setNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState(''); // State for OTP
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false); // Flag to check if OTP is sent
  const [otpVerified, setOtpVerified] = useState(false); // Flag to check if OTP is verified
  const navigate = useNavigate();

  // Function to send OTP
  const handleSendOtp = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await sendOtp(email); // API call to send OTP

      if (response.message === 'OTP sent successfully') { // Check for message in response
        setOtpSent(true); // OTP sent successfully
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong while sending OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle OTP validation
  const handleVerifyOtp = async () => {
    setLoading(true);
    setError('');
    console.log("OTP before verify: ", otpVerified);

    try {
      const response = await verifyOtp(email, otp); // API call to verify OTP
      if (response.message === 'OTP validated successfully') {
        setOtpVerified(true); // OTP verified successfully
        console.log("OTP verified successfully.");
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong during OTP verification.');
    } finally {
      setLoading(false);
    }
    console.log("OTP after verify: ", otpVerified);
  };

  // Handle the final form submission after OTP verification
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otpVerified) {
      setError('Please verify OTP first.');
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await signupUser(fullname, number, email, password);
      if (data.token) {
        setAuthToken(data.token);
        navigate('/login');
      } else {
        setError('Signup failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // This effect will watch the OTP verification state and trigger the form submission logic accordingly
  useEffect(() => {
    console.log("OTP Verified changed to: ", otpVerified);
  }, [otpVerified]); // Log whenever otpVerified changes

  return (
    <div className="flex items-center justify-center h-full md:text-lg">
      <form
        onSubmit={handleSubmit}
        className="bg-transparent border border-gray-700 p-8 rounded-lg shadow-lg md:w-full max-w-md"
      >
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Sign Up</h2>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <div className="mb-5 w-full">
          <Input
            type="text"
            name="Full Name"
            onChange={(e) => setFullname(e.target.value)}
          />
        </div>

        <div className="mb-5 w-full">
          <Input
            type="number"
            name="Phone Number"
            onChange={(e) => setNumber(e.target.value)}
          />
        </div>

        <div className="mb-5 w-full">
          <Input
            type="email"
            name="Email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* OTP section */}
        <div className="mb-5 w-full">
          {otpSent ? (
            <>
              <Input
                type="text"
                name="OTP"
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md mt-2"
                disabled={loading}
              >
                {loading ? 'Verifying OTP...' : 'Verify OTP'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSendOtp}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md mt-2"
              disabled={loading}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          )}
        </div>

        {/* Password and Confirm Password */}
        {otpVerified && (
          <>
            <div className="mb-6 w-full">
              <Input
                type="password"
                name="Password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="mb-6 w-full">
              <Input
                type="password"
                name="Confirm Password"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
              disabled={loading}
            >
              {loading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </>
        )}

        <div className="mt-6 w-full flex justify-center">
          <h2>
            Already have an account?{' '}
            <span>
              <Link to="/login" className="text-blue-500 font-medium">
                Sign in
              </Link>
            </span>
          </h2>
        </div>
      </form>
    </div>
  );
};

export default Signup;
