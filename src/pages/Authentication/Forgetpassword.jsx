import React, { useState } from 'react';
import { useNavigate,Link } from 'react-router-dom';
import Input from '../../components/Input'; // Assuming a reusable Input component

const ForgetPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Validate OTP, 3: Set New Password
  const navigate = useNavigate();

  const API_URL = 'https://dev-conncet-backend.onrender.com/api';
  const handleRequestOTP = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const checkEmailResponse = await fetch(`${API_URL}/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const checkEmailData = await checkEmailResponse.json();

      if (!checkEmailResponse.ok) {
        setError(checkEmailData.message || 'Email not found');
        return;
      }

      const response = await fetch(`${API_URL}/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('OTP sent successfully:', data);
        setStep(2);
      } else {
        setError(data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateOTP = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/validate-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('OTP validated successfully:', data);
        setStep(3);
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Password and Confirm Password are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/set-new-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email, newPassword: password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Password updated successfully');
        navigate('/login');
      } else {
        setError(data.message || 'Failed to update password');
      }
    } catch (err) {
      console.error('Error during password update:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-full md:text-lg">
      <form
        onSubmit={
          step === 1
            ? handleRequestOTP
            : step === 2
            ? handleValidateOTP
            : handleSetNewPassword
        }
        className="bg-transparent border border-gray-700 p-8 rounded-lg shadow-lg md:w-full max-w-md"
      >
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          {step === 1
            ? 'Request OTP'
            : step === 2
            ? 'Validate OTP'
            : 'Set New Password'}
        </h2>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        {step === 1 && (
          <div className="mb-5 w-full">
            <Input
              type="email"
              name="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        )}

        {step === 2 && (
          <div className="mb-6 w-full">
            <Input
              type="number"
              name="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
        )}

        {step === 3 && (
          <>
            <div className="mb-5 w-full">
              <label htmlFor="password" className="text-white mb-2 block">
                New Password
              </label>
              <Input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
              />
            </div>

            <div className="mb-5 w-full">
              <label htmlFor="confirmPassword" className="text-white mb-2 block">
                Confirm Password
              </label>
              <Input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength="6"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          disabled={loading}
        >
          {loading
            ? 'Processing...'
            : step === 1
            ? 'Send OTP'
            : step === 2
            ? 'Validate OTP'
            : 'Set New Password'}
        </button>

        <div className="mt-6 w-full flex justify-center">
          <h2>
            Don't have an account?{' '}
            <span>
              <Link to="/signup" className="text-blue-500 font-medium">
                Sign Up
              </Link>
            </span>
          </h2>
        </div>
      </form>
    </div>
  );
};

export default ForgetPassword;
