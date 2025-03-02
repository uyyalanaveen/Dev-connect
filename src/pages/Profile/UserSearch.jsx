import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { UserPlus, UserMinus } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const UserSearch = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [processingId, setProcessingId] = useState(null); // Track which user is being processed

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          toast.error("Not authenticated. Please log in.");
          return;
        }

        const response = await axios.get("https://devconnect-backend-6opy.onrender.com/api/userslist", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setUsers(response.data.users || []);
          setCurrentUser(response.data.currentUser);
        } else {
          toast.error("Failed to load users.");
        }
      } catch (error) {
        toast.error("Error loading users: " + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Follow a User
  const handleFollow = async (userId) => {
    if (processingId) return;
    setProcessingId(userId);
    
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Not authenticated. Please log in.");
        return;
      }

      const response = await axios.post(
        "https://devconnect-backend-6opy.onrender.com/api/users/add-friend",
        { followId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId ? { ...user, followers: [...user.followers, currentUser._id] } : user
          )
        );
        toast.success("User followed successfully!");
      } else {
        toast.error("Failed to follow user.");
      }
    } catch (error) {
      toast.error("Error following user: " + (error.response?.data?.message || error.message));
    } finally {
      setProcessingId(null);
    }
  };

  // Unfollow a User
  const handleUnfollow = async (userId) => {
    if (processingId) return;
    setProcessingId(userId);
    
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Not authenticated. Please log in.");
        return;
      }

      const response = await axios.delete(
        "https://devconnect-backend-6opy.onrender.com/api/users/remove-friend",
        {
          data: { unfollowId: userId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId
              ? { ...user, followers: user.followers.filter((id) => id !== currentUser._id) }
              : user
          )
        );
        toast.success("User unfollowed successfully!");
      } else {
        toast.error("Failed to unfollow user.");
      }
    } catch (error) {
      toast.error("Error unfollowing user: " + (error.response?.data?.message || error.message));
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.fullname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to determine if current user is following a user
  const isFollowing = (user) => {
    return currentUser && user.followers.includes(currentUser._id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-6 text-white">
      {/* Header Section */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-4xl font-bold mb-4 md:mb-0 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Discover Developers
          </h1>
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 bg-gray-800 border border-gray-700 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg 
              className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-xl text-blue-500">Loading developers...</span>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className="group relative bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Card Header with Gradient */}
                <div className="h-20 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                
                {/* Profile Image */}
                <div className="flex justify-center -mt-10">
                  <img
                    src={user.profileImage || "https://via.placeholder.com/150"}
                    alt={user.fullname || "Developer"}
                    className="w-20 h-20 rounded-full border-4 border-gray-800 object-cover"
                  />
                </div>
                
                {/* User Info */}
                <div className="p-6 text-center">
                  <h2 className="text-xl font-bold mb-2">{user.fullname || "Anonymous Developer"}</h2>
                  
                  {/* Tech Stack Tags */}
                  <div className="flex flex-wrap justify-center gap-2 mb-4 min-h-10">
                    {user.techStack && user.techStack.length > 0 ? (
                      user.techStack.slice(0, 3).map((tech, index) => (
                        <span 
                          key={index} 
                          className="bg-gray-700 text-blue-400 text-xs font-medium px-3 py-1 rounded-full"
                        >
                          {tech}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No Tech Stack</span>
                    )}
                    {user.techStack && user.techStack.length > 3 && (
                      <span className="text-gray-500 text-xs">+{user.techStack.length - 3} more</span>
                    )}
                  </div>
                  
                  {/* Follow/Unfollow Button */}
                  {currentUser && user._id !== currentUser._id && (
                    <button
                      onClick={() => isFollowing(user) ? handleUnfollow(user._id) : handleFollow(user._id)}
                      disabled={processingId === user._id}
                      className={`
                        w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                        transition-all duration-300
                        ${isFollowing(user) 
                          ? 'bg-gray-700 hover:bg-red-600 text-white' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }
                        ${processingId === user._id ? 'opacity-70 cursor-not-allowed' : ''}
                      `}
                    >
                      {processingId === user._id ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : isFollowing(user) ? (
                        <>
                          <UserMinus size={16} />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus size={16} />
                          Follow
                        </>
                      )}
                    </button>
                  )}
                  
                  {/* View Profile Link */}
                  <Link 
                    to={`/profile/${user._id}`} 
                    className="block mt-3 text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    View Full Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-400">No developers found</h3>
            <p className="mt-2 text-gray-500">Try adjusting your search query</p>
          </div>
        )}
        
        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <Link 
            to="/" 
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserSearch;