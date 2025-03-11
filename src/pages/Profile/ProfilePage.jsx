import React, { useEffect, useState } from 'react';
import { isAuthenticated } from '../../utility/auth';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const API_BASE_URL = 'https://devconnect-backend-6opy.onrender.com';

const ProfilePage = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [followersData, setFollowersData] = useState([]);
  const [followingData, setFollowingData] = useState([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const loadProfileData = async () => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`${API_BASE_URL}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Get the current user data
      const userDataStr = sessionStorage.getItem('user');
      let currentUserData = null;
      if (userDataStr) {
        try {
          currentUserData = JSON.parse(userDataStr);
          setCurrentUser(currentUserData);
        } catch (error) {
          console.error("Error parsing user data:", error);
          sessionStorage.removeItem('user');
        }
      }
      
      // Process followers and following data from the populated response
      const userData = {
        _id: response.data.id,
        fullname: response.data.fullname || "Anonymous User",
        email: response.data.email || "",
        profileImage: response.data.profileImage || "",
        followers: Array.isArray(response.data.followers) ? response.data.followers : [],
        following: Array.isArray(response.data.following) ? response.data.following : [],
        techStack: Array.isArray(response.data.techStack) ? response.data.techStack : [],
        bio: response.data.bio || "" // Ensure bio is properly extracted from response
      };
      
      console.log("User bio from API:", response.data.bio); // Debug log
      setUser(userData);
      
      // Set followers and following data directly from the populated response
      if (Array.isArray(response.data.followers)) {
        setFollowersData(response.data.followers.map(follower => ({
          _id: follower._id || follower.id,
          fullname: follower.fullname || "User",
          profileImage: follower.profileImage || ""
        })));
      } else {
        setFollowersData([]);
      }
      
      if (Array.isArray(response.data.following)) {
        setFollowingData(response.data.following.map(following => ({
          _id: following._id || following.id,
          fullname: following.fullname || "User",
          profileImage: following.profileImage || ""
        })));
      } else {
        setFollowingData([]);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast.error(error.response?.data?.message || "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset data when id changes
    setUser(null);
    setFollowersData([]);
    setFollowingData([]);
    setLoading(true);
    
    loadProfileData();
  }, [id]); // Re-run when id parameter changes

  const handleFollow = async () => {
    if (processing || !user || !currentUser) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem("authToken");
      await axios.post(
        `${API_BASE_URL}/api/users/add-friend`, 
        { followId: id }, 
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      // Add current user to the profile's followers
      const currentUserInfo = {
        _id: currentUser._id,
        fullname: currentUser.fullname || "User",
        profileImage: currentUser.profileImage || ""
      };
      
      // Update UI immediately
      setUser(prevUser => ({
        ...prevUser,
        followers: [...prevUser.followers, { 
          _id: currentUser._id, 
          id: currentUser._id 
        }]
      }));
      
      setFollowersData(prevData => [...prevData, currentUserInfo]);
      
      toast.success("User followed successfully!");
    } catch (error) {
      console.error("Follow error:", error);
      toast.error(error.response?.data?.message || "Error following user!");
    } finally {
      setProcessing(false);
    }
  };

  const handleUnfollow = async () => {
    if (processing || !user || !currentUser) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(`${API_BASE_URL}/api/users/remove-friend`, {
        data: { unfollowId: id },
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update UI immediately - remove current user from followers
      setUser(prevUser => ({
        ...prevUser,
        followers: prevUser.followers.filter(follower => 
          (follower._id || follower.id) !== currentUser._id
        )
      }));
      
      setFollowersData(prevData => 
        prevData.filter(follower => follower._id !== currentUser._id)
      );

      toast.success("User unfollowed successfully!");
    } catch (error) {
      console.error("Unfollow error:", error);
      toast.error(error.response?.data?.message || "Error unfollowing user!");
    } finally {
      setProcessing(false);
    }
  };

  const isFollowing = () => {
    if (!user?.followers || !currentUser?._id) return false;
    
    // Check if current user is in the followers array
    return user.followers.some(follower => 
      (follower._id || follower.id) === currentUser._id
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mr-3"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">User not found</h2>
        <Link to="/" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600"></div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center">
            <div className="relative -mt-20 mb-4 md:mb-0 md:mr-6">
              <img 
                src={user.profileImage || "https://via.placeholder.com/150"} 
                alt={user.fullname} 
                className="w-24 h-24 rounded-full border-4 border-gray-800 object-cover"
              />
            </div>
            <div className="text-center md:text-left flex-grow">
              <h1 className="text-2xl font-bold">{user.fullname}</h1>
              <p className="text-gray-400">{user.email || "No email provided"}</p>
              {user.techStack && user.techStack.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {user.techStack.map((tech, index) => (
                    <span key={index} className="bg-gray-700 text-blue-400 text-xs px-2 py-1 rounded-full">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {currentUser && currentUser._id !== id && (
              <div className="mt-4 md:mt-0">
                {isFollowing() ? (
                  <button 
                    onClick={handleUnfollow} 
                    disabled={processing}
                    className="px-4 py-2 bg-gray-700 hover:bg-red-600 rounded transition-colors disabled:opacity-50"
                  >
                    {processing ? "Processing..." : "Unfollow"}
                  </button>
                ) : (
                  <button 
                    onClick={handleFollow} 
                    disabled={processing}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
                  >
                    {processing ? "Processing..." : "Follow"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bio Section - Always show the container but conditionally show content or a placeholder */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">About</h2>
            <p className="text-gray-300">
              {user.bio ? user.bio : "No bio provided"}
            </p>
          </div>

          <div className="mt-6 flex justify-start gap-8">
            <div className="text-center cursor-pointer" onClick={() => setShowFollowers(true)}>
              <span className="block text-2xl font-bold">{user.followers.length}</span>
              <span className="text-gray-400 text-sm hover:text-blue-400 transition-colors">Followers</span>
            </div>
            <div className="text-center cursor-pointer" onClick={() => setShowFollowing(true)}>
              <span className="block text-2xl font-bold">{user.following.length}</span>
              <span className="text-gray-400 text-sm hover:text-blue-400 transition-colors">Following</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 text-center">
        <Link to="/" className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>

      {/* Followers Modal */}
      {showFollowers && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Followers ({followersData.length})</h2>
              <button onClick={() => setShowFollowers(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                    onClick={() => setShowFollowers(false)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                    onClick={() => setShowFollowing(false)}
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

export default ProfilePage;