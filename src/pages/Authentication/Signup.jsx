import React, { useState, useEffect } from 'react';
import Input from '../../components/Input';
import { signupUser, sendOtp, verifyOtp } from '../../utility/api.js';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import profileimage from '../../assets/profile.png'


const Signup = () => {
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await sendOtp(email);
      if (response.message === 'OTP sent successfully') {
        setOtpSent(true);
        toast.success('OTP sent successfully!');
      } else {
        toast.error('Failed to send OTP. Please try again.');
      }
    } catch (err) {
      toast.error('User already existed with this email');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await verifyOtp(email, otp);
      if (response.message === 'OTP validated successfully') {
        setOtpVerified(true);
        toast.success('OTP verified successfully!');
      } else {
        toast.error('Invalid OTP. Please try again.');
      }
    } catch (err) {
      toast.error('Something went wrong during OTP verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otpVerified) {
      toast.error('Please verify OTP first.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords doesn't match.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await signupUser(fullname, email, password);
      if (data.token) {
        toast.success('Signup successful! Redirecting...');
        navigate('/login');
      } else {
        toast.error('Signup failed. Please try again.');
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="flex mt-36 items-center justify-center h-full md:text-lg bg-black">
      <form
        onSubmit={handleSubmit}
        className="bg-transparent border border-gray-700 p-8 rounded-lg shadow-lg md:w-full max-w-md "
      >
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Sign Up</h2>

        <div className='mb-5 mt-10 w-full flex justify-center relative'>
          <img
            src={profileimage}
            alt="Profile"
            className='w-16 h-16 md:w-24 md:h-24 rounded-full'
          />
        </div>


        <div className="mb-5 w-full">
          <Input
            type="text"
            name="Full Name"
            onChange={(e) => setFullname(e.target.value)}
          />
        </div>

        <div className="mb-5 w-full">
          <Input
            type="email"
            name="Email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

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
      <ToastContainer />
    </div>
  );
};

export default Signup;
