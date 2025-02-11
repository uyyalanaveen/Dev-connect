import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const UserSearch = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true); // Loading state to indicate fetching

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("https://dev-conncet-backend.onrender.com/api/userslist");
        if (response.data.success) {
          setUsers(response.data.users || []);
          console.log(response.data.users); // Log users for debugging
        } else {
          console.error("Error: API did not return success.");
        }
      } catch (error) {
        console.error("Error fetching users:", error.message);
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search input
  const filteredUsers = users.filter((user) =>
    user.fullname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col items-center min-h-screen bg-black p-4">
      <h1 className="text-3xl font-bold text-white mb-4">User Search</h1>
      {loading ? ( // Show loading indicator
        <p className="text-gray-500">Loading users...</p>
      ) : (
        <>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-80 p-2 mb-4 border border-gray-400 rounded-lg"
          />
          <div className="w-full max-w-md">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <Link
                  to={`/profile/${user._id}`} // Link to user profile
                  key={user._id}
                  className="flex items-center gap-4 p-3 bg-gray-800 text-white rounded-lg mb-2 hover:bg-gray-700 transition"
                >
                  <img
                    src={user.profileImage || "Uploads/profileImages/default-profile.png"} // Fallback to default image if none provided
                    alt="Profile"
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h2 className="text-lg">{user.fullname || "No Name"}</h2>
                    <p className="text-gray-400">{user.email}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-500">No users found.</p>
            )}
          </div>
        </>
      )}
      <Link to="/" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
        Back to Home
      </Link>
    </div>
  );
};

export default UserSearch;
