import React, { useEffect, useState } from 'react';
import { isAuthenticated } from '../../utility/auth';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const ProfilePage = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // For handling loading state

  useEffect(() => {
    if (isAuthenticated()) {
      axios
        .get(`https://dev-conncet-backend.onrender.com/api/users/${id}`)
        .then((response) => {
          console.log(response.data);
          setUser(response.data);
          setLoading(false); // Stop loading once data is fetched
        })
        .catch((error) => {
          console.log('error: ', error);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return <div>Loading...</div>; // Display loading text while data is being fetched
  }

  return (
    <div>
      Profile
      <div>
        {user && (
          <div>
            <h1>{user.fullname}</h1>
            <img src={user.profileImage} alt="user profile" />
            <h2>{user.email}</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
