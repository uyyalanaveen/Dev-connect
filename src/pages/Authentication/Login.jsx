import React, { useState } from 'react';
import Input from '../../components/Input';
import { useNavigate,Link } from 'react-router-dom'; // Import useNavigate
import { setAuthToken } from '../../utility/auth'; // Import auth utility
import { ToastContainer, toast } from 'react-toastify';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission

    setLoading(true); // Show loading indicator
    setError(''); // Reset error message

    try {
      const response = await fetch('https://devconnect-backend-6opy.onrender.com/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.token ) {
        setAuthToken(data.token); 
        toast.success('Login successful!');
        console.log('Login successful:', data);
        navigate('/home'); // Redirect to homepage ("/")
      } else {
        // Handle server error
        toast.error(data.message || 'Login failed. Please check your credentials.');
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      // Handle network error or other issues
      toast.error('Something went wrong. Please try again.');
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="flex items-center justify-center h-full bg-black md:text-lg mt-36">
      <form
        onSubmit={handleSubmit}
        className="bg-transparent border border-gray-700 p-8 rounded-lg shadow-lg md:w-full max-w-md"
      >
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Login</h2>

        {error && <div className="text-red-500 mb-4">{error}</div>} {/* Display error if any */}

        <div className="mb-5 w-full">
          <Input
            type="email"
            name="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-6 w-full">
          <Input
            type="password"
            name="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="mb-4 w-full flex justify-end">
          <Link to="/reset-password" className="text-blue-500 underline">
            Forget Password?
          </Link>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          disabled={loading} 
        >
          {loading ? 'Logging in...' : 'Login'}
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
      <ToastContainer />
    </div>
  );
};

export default Login;