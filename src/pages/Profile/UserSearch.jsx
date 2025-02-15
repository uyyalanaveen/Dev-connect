import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { UserPlus, UserMinus } from "lucide-react"; // Icons
import { FaSpinner } from "react-icons/fa"; // Loading spinner
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const UserSearch = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null); // Logged-in user
  const [processing, setProcessing] = useState(false); // Prevent multiple clicks

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          console.error("No auth token found.");
          return;
        }

        const response = await axios.get("https://dev-conncet-backend.onrender.com/api/userslist", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setUsers(response.data.users || []);
          console.log(response.data.users)
          setCurrentUser(response.data.currentUser); // Store logged-in user
          console.log(response.data.currentUser)
        } else {
          console.error("API did not return success.");
        }
      } catch (error) {
        console.error("Error fetching users:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // 📌 Follow a User
  const handleFollow = async (userId) => {
    if (processing) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return console.error("No auth token found.");

      await axios.post(
        "https://dev-conncet-backend.onrender.com/api/users/add-friend",
        { followId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, followers: [...user.followers, currentUser._id] } : user
        )
      );
      toast.success("User followed successfully!");
    } catch (error) {
      console.error("Error following user:", error.message);
      toast.error("Error following user!");
    } finally {
      setProcessing(false);
    }
  };

  // 📌 Unfollow a User
  const handleUnfollow = async (userId) => {
    if (processing) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return console.error("No auth token found.");

      await axios.delete("https://dev-conncet-backend.onrender.com/api/users/remove-friend", {
        data: { unfollowId: userId },
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId
            ? { ...user, followers: user.followers.filter((id) => id !== currentUser._id) }
            : user
        )
      );
      toast.success("User unfollowed successfully!");
    } catch (error) {
      console.error("Error unfollowing user:", error.message);
      toast.error("Error unfollowing user!");
    } finally {
      setProcessing(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.fullname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">User Search</h1>
      <input
        type="text"
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-80 p-3 mb-6 text-black border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="flex items-center gap-2 text-gray-400">
            <FaSpinner className="animate-spin" />
            Loading users...
          </div>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user._id}
              className="flex flex-col items-center p-6 bg-gray-800 rounded-lg shadow-md hover:bg-gray-700 transition"
            >
              <img
                src={user.profileImage || "/uploads/profileImages/default-profile.png"}
                alt="Profile"
                className="w-16 h-16 rounded-full border-2 border-blue-500 mb-3"
              />
              <h2 className="text-lg font-semibold">{user.fullname || "No Name"}</h2>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {user.techStack && user.techStack.length > 0 ? (
                  user.techStack.map((tech, index) => (
                    <span key={index} className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">
                      {tech}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm">No Tech Stack</span>
                )}
              </div>

              {/* Follow / Unfollow Button with Icons */}
              {currentUser && user._id !== currentUser._id && (
                user.followers.includes(currentUser._id) ? (
                  <button
                    onClick={() => handleUnfollow(user._id)}
                    disabled={processing}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                  >
                    <UserMinus size={28} color="red"/>
                    {processing ? "Unfollowing..." : "Unfollow"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleFollow(user._id)}
                    disabled={processing}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-green-500 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                  >
                    <UserPlus size={18} />
                    {processing ? "Following..." : "Follow"}
                  </button>
                )
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-400">No users found.</p>
        )}
      </div>
      <Link to="/" className="mt-6 px-5 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition">
        Back to Home
      </Link>
    </div>
  );
};

export default UserSearch;
