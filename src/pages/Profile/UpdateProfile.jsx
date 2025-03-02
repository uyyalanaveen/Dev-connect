import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { isAuthenticated } from '../../utility/auth';
import { toast } from 'react-toastify';

const UpdateProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ 
    fullname: '', 
    email: '', 
    profileImage: '', 
    techStack: [],
    bio: '',
    followers: [],
    following: []
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [followersData, setFollowersData] = useState([]);
  const [followingData, setFollowingData] = useState([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      setFetchLoading(true);
      axios
        .get('https://devconnect-backend-6opy.onrender.com/api/users/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        })
        .then((response) => {
          if (response.data.status) {
            const userData = response.data.data.user;
            // Ensure techStack is always an array
            if (!userData.techStack) userData.techStack = [];
            // Ensure bio exists
            if (userData.bio === undefined || userData.bio === null) userData.bio = '';
            setUser(userData);
            
            // Load followers and following data
            if (userData.followers && userData.followers.length > 0) {
              loadFollowersData(userData.followers);
            }
            
            if (userData.following && userData.following.length > 0) {
              loadFollowingData(userData.following);
            }
          }
        })
        .catch((error) => {
          console.error('Error fetching user data:', error);
          toast.error('Failed to load profile data');
        })
        .finally(() => {
          setFetchLoading(false);
        });
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const loadFollowersData = async (followerIds) => {
    try {
      const token = localStorage.getItem("authToken");
      const followers = [];
      
      for (const id of followerIds) {
        const response = await axios.get(
          `https://devconnect-backend-6opy.onrender.com/api/users/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data) {
          console.log(response.data)
          followers.push({
            _id: response.data.id,
            fullname: response.data.fullname,
            profileImage: response.data.profileImage
          });
        }
      }
      
      setFollowersData(followers);
    } catch (error) {
      console.error("Error loading followers data:", error);
    }
  };

  const loadFollowingData = async (followingIds) => {
    try {
      const token = localStorage.getItem("authToken");
      const following = [];
      
      for (const id of followingIds) {
        const response = await axios.get(
          `https://devconnect-backend-6opy.onrender.com/api/users/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data) {
          // console.log(response.data)
          following.push({
            _id: response.data.id,
            fullname: response.data.fullname,
            profileImage: response.data.profileImage
          });
        }
      }
      
      setFollowingData(following);
    } catch (error) {
      console.error("Error loading following data:", error);
    }
  };

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setImage(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleTechStackChange = (e) => {
    const techStackArray = e.target.value
      .split(',')
      .map(tech => tech.trim())
      .filter(tech => tech !== '');
    setUser({ ...user, techStack: techStackArray });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('fullname', user.fullname);
    formData.append('techStack', JSON.stringify(user.techStack));
    // Explicitly add bio field, even if empty
    formData.append('bio', user.bio || '');
    if (image) {
      formData.append('profileImage', image);
    }

    try {
      const response = await axios.put('https://devconnect-backend-6opy.onrender.com/api/users/me/update-profile', formData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.message === "Profile updated successfully") {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        // Refresh user data instead of reloading the page
        const updatedUser = await axios.get('https://devconnect-backend-6opy.onrender.com/api/users/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        });
        if (updatedUser.data.status) {
          const userData = updatedUser.data.data.user;
          setUser(userData);
          
          // Refresh followers and following data
          if (userData.followers && userData.followers.length > 0) {
            loadFollowersData(userData.followers);
          }
          
          if (userData.following && userData.following.length > 0) {
            loadFollowingData(userData.following);
          }
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mr-3"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Profile Header */}
        <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600"></div>
        
        {/* Profile Content */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center">
            {/* Profile Image */}
            <div className="relative -mt-20 mb-4 md:mb-0 md:mr-6">
              <img 
                src={preview || user.profileImage || "https://via.placeholder.com/150"} 
                alt={user.fullname || "User"} 
                className="w-24 h-24 rounded-full border-4 border-gray-800 object-cover"
              />
            </div>
            
            {/* User Info */}
            <div className="text-center md:text-left flex-grow">
              <h1 className="text-2xl font-bold">{user.fullname || "Anonymous User"}</h1>
              <p className="text-gray-400">{user.email || "No email provided"}</p>
              
              {/* Tech Stack */}
              {user.techStack && user.techStack.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {user.techStack.map((tech, index) => (
                    <span 
                      key={index} 
                      className="bg-gray-700 text-blue-400 text-xs px-2 py-1 rounded-full"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Edit Button */}
            <div className="mt-4 md:mt-0">
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                Edit Profile
              </button>
            </div>
          </div>
          
          {/* Bio Section */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">About</h2>
            <p className="text-gray-300">{user.bio || "No bio provided yet."}</p>
          </div>
          
          {/* Stats Section with clickable counters */}
          <div className="mt-6 flex justify-start gap-8">
            <div className="text-center cursor-pointer" onClick={() => setShowFollowers(true)}>
              <span className="block text-2xl font-bold">{user.followers?.length || 0}</span>
              <span className="text-gray-400 text-sm hover:text-blue-400 transition-colors">Followers</span>
            </div>
            <div className="text-center cursor-pointer" onClick={() => setShowFollowing(true)}>
              <span className="block text-2xl font-bold">{user.following?.length || 0}</span>
              <span className="text-gray-400 text-sm hover:text-blue-400 transition-colors">Following</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Back Button */}
      <div className="mt-6 text-center">
        <Link to="/" className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullname"
                  value={user.fullname || ''}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className="w-full p-2 border border-gray-700 rounded bg-gray-700 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tech Stack (comma-separated)</label>
                <input
                  type="text"
                  name="techStack"
                  value={user.techStack?.join(', ') || ''}
                  onChange={handleTechStackChange}
                  placeholder="React, Node.js, MongoDB, etc."
                  className="w-full p-2 border border-gray-700 rounded bg-gray-700 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Bio</label>
                <textarea
                  name="bio"
                  value={user.bio || ''}
                  onChange={handleChange}
                  placeholder="Tell us about yourself"
                  rows="3"
                  className="w-full p-2 border border-gray-700 rounded bg-gray-700 text-white"
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Profile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-sm text-gray-400"
                />
              </div>
              
              {preview && (
                <div className="mt-2 flex justify-center">
                  <img src={preview} alt="Preview" className="w-20 h-20 rounded-full object-cover" />
                </div>
              )}
              
              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`py-2 px-4 rounded font-semibold ${
                    loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Followers Modal */}
     {showFollowers && (
             <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
               <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md max-h-96 overflow-y-auto">
                 <div className="flex justify-between items-center mb-4">
                   <h2 className="text-xl font-bold">Followers ({followersData.length})</h2>
                   <button onClick={() => setShowFollowers(false)} className="text-gray-400 hover:text-white">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                     </svg>
                   </button>
                 </div>
                 
                 {followersData.length === 0 ? (
                   <p className="text-gray-400 text-center py-4">No followers yet</p>
                 ) : (
                   <div className="space-y-3">
                     {followersData.map(follower => (
                       <Link 
                         key={follower._id} 
                         to={`/profile/${follower._id}`}
                         className="flex items-center p-2 rounded hover:bg-gray-700 transition-colors"
                       >
                         <img
                           src={follower.profileImage || "https://via.placeholder.com/40"}
                           alt={follower.fullname}
                           className="w-10 h-10 rounded-full object-cover mr-3"
                         />
                         <span>{follower.fullname}</span>
                       </Link>
                     ))}
                   </div>
                 )}
               </div>
             </div>
           )}
     
           {/* Following Modal */}
           {showFollowing && (
             <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
               <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md max-h-96 overflow-y-auto">
                 <div className="flex justify-between items-center mb-4">
                   <h2 className="text-xl font-bold">Following ({followingData.length})</h2>
                   <button onClick={() => setShowFollowing(false)} className="text-gray-400 hover:text-white">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                     </svg>
                   </button>
                 </div>
                 
                 {followingData.length === 0 ? (
                   <p className="text-gray-400 text-center py-4">Not following anyone yet</p>
                 ) : (
                   <div className="space-y-3">
                     {followingData.map(following => (
                       <Link 
                         key={following._id} 
                         to={`/profile/${following._id}`}
                         className="flex items-center p-2 rounded hover:bg-gray-700 transition-colors"
                       >
                         <img
                           src={following.profileImage || "https://via.placeholder.com/40"}
                           alt={following.fullname}
                           className="w-10 h-10 rounded-full object-cover mr-3"
                         />
                         <span>{following.fullname}</span>
                       </Link>
                     ))}
                   </div>
                 )}
               </div>
             </div>
           )}
         </div>
       );
     };
     
     export default UpdateProfilePage