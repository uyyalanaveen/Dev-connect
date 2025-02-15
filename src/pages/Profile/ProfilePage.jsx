import React, { useEffect, useState } from 'react';
import { isAuthenticated } from '../../utility/auth';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const ProfilePage = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      const token = localStorage.getItem("authToken");
      
      axios.get(`https://dev-conncet-backend.onrender.com/api/users/${id}`)
        .then((response) => {
          setUser(response.data);
          setLoading(false);
        })
        .catch((error) => {
          console.log('Error:', error);
          setLoading(false);
        });
      
      axios.get("https://dev-conncet-backend.onrender.com/api/current-user", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((response) => {
        setCurrentUser(response.data);
      }).catch((error) => console.error("Error fetching current user:", error));
    }
  }, [id]);

  const handleFollow = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem("authToken");
      await axios.post("https://dev-conncet-backend.onrender.com/api/users/add-friend", { followId: id }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser((prev) => ({ ...prev, followers: [...prev.followers, currentUser._id] }));
      toast.success("User followed successfully!");
    } catch (error) {
      toast.error("Error following user!");
    } finally {
      setProcessing(false);
    }
  };

  const handleUnfollow = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem("authToken");
      await axios.delete("https://dev-conncet-backend.onrender.com/api/users/remove-friend", {
        data: { unfollowId: id },
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser((prev) => ({
        ...prev,
        followers: prev.followers.filter((userId) => userId !== currentUser._id),
      }));
      toast.success("User unfollowed successfully!");
    } catch (error) {
      toast.error("Error unfollowing user!");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{user.fullname}</h1>
      <img src={user.profileImage} alt="user profile" />
      <h2>{user.email}</h2>
      {currentUser && user._id !== currentUser._id && (
        user.followers.includes(currentUser._id) ? (
          <button onClick={handleUnfollow} disabled={processing}>
            {processing ? "Unfollowing..." : "Unfollow"}
          </button>
        ) : (
          <button onClick={handleFollow} disabled={processing}>
            {processing ? "Following..." : "Follow"}
          </button>
        )
      )}
    </div>
  );
};

export default ProfilePage;
