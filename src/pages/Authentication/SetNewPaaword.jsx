// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Input from '../../components/Input'; // Assuming you have a reusable Input component

// const SetNewPassword = () => {
//     const [password, setPassword] = useState('');
//     const [confirmPassword, setConfirmPassword] = useState('');
//     const [error, setError] = useState('');
//     const [loading, setLoading] = useState(false);
//     const navigate = useNavigate();

//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         // Basic validation
//         if (password !== confirmPassword) {
//             setError('Passwords do not match');
//             return;
//         }

//         if (!password || !confirmPassword) {
//             setError('Password and Confirm Password are required');
//             return;
//         }

//         setLoading(true);
//         setError(''); // Clear previous error

//         try {
//             const token = localStorage.getItem('token'); // Example of how you might retrieve the token
//             const response = await fetch('http://localhost:5000/api/set-new-password', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${token}`, // Include the token
//                 },
//                 body: JSON.stringify({ password}),
//             });


//         const data = await response.json();

//         if (response.ok) {
//             // Successful password update, navigate to login or home page
//             console.log('Password updated successfully');
//             navigate('/login'); // Redirect to login page after success
//         } else {
//             // Handle error from the backend
//             setError(data.message || 'Failed to update password');
//         }
//     } catch (err) {
//         console.error('Error during password update:', err);
//         setError('Something went wrong. Please try again.');
//     } finally {
//         setLoading(false);
//     }
// };

// return (
//     <div className="flex items-center justify-center h-full md:text-lg">
//         <form
//             onSubmit={handleSubmit}
//             className="bg-transparent border border-gray-700 p-8 rounded-lg shadow-lg md:w-full max-w-md"
//         >
//             <h2 className="text-3xl font-bold text-white mb-6 text-center">Set New Password</h2>

//             {error && <div className="text-red-500 mb-4">{error}</div>} {/* Show error message */}

//             <div className="mb-5 w-full">
//                 <label htmlFor="password" className="text-white mb-2 block">New Password</label>
//                 <Input
//                     type="password"
//                     id="password"
//                     name="password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     required
//                     minLength="6"
//                 />
//             </div>

//             <div className="mb-5 w-full">
//                 <label htmlFor="confirmPassword" className="text-white mb-2 block">Confirm Password</label>
//                 <Input
//                     type="password"
//                     id="confirmPassword"
//                     name="confirmPassword"
//                     value={confirmPassword}
//                     onChange={(e) => setConfirmPassword(e.target.value)}
//                     required
//                     minLength="6"
//                 />
//             </div>

//             <button
//                 type="submit"
//                 className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
//                 disabled={loading}
//             >
//                 {loading ? 'Processing...' : 'Set New Password'}
//             </button>

//             <div className="mt-6 w-full flex justify-center">
//                 <h2>
//                     Don't have an account?{' '}
//                     <span>
//                         <a href="/signup" className="text-blue-500 font-medium">
//                             Sign Up
//                         </a>
//                     </span>
//                 </h2>
//             </div>
//         </form>
//     </div>
// );
// };

// export default SetNewPassword;
