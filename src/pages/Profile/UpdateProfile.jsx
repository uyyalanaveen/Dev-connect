import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../../utility/auth';

const UpdateProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ fullname: '', email: '', profileImage: '', techStack: [] });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      axios
        .get('https://dev-conncet-backend.onrender.com/api/users/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        })
        .then((response) => {
          if (response.data.status) {
            setUser(response.data.data.user);
          }
        })
        .catch((error) => console.error('Error fetching user data:', error));
    }
  }, []);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    setImage(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('fullname', user.fullname);
    formData.append('techStack', JSON.stringify(user.techStack));
    if (image) {
      formData.append('profileImage', image);
    }

    try {
      const response = await axios.put('https://dev-conncet-backend.onrender.com/api/users/me/update-profile', formData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.message === "Profile updated successfully") {
        alert('Profile updated successfully!');
        setIsEditing(false);
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-6 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={user.profileImage || '/default-profile.png'}
            alt="Profile"
            className="w-16 h-16 rounded-full border border-gray-500"
          />
          <div>
            <h2 className="text-lg font-semibold">{user.fullname}</h2>
            <p className="text-gray-400">{user.email}</p>
            <p className="mt-2 text-sm text-gray-400">
              {user.techStack.length ? user.techStack.join(', ') : 'Add Tech Stack'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          Edit
        </button>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                name="fullname"
                value={user.fullname}
                onChange={handleChange}
                placeholder="Full Name"
                className="p-2 border border-gray-500 rounded bg-gray-700 text-white"
              />
              <input
                type="text"
                name="techStack"
                value={user.techStack.join(', ')}
                onChange={(e) => setUser({ ...user, techStack: e.target.value.split(', ') })}
                placeholder="Tech Stack (comma-separated)"
                className="p-2 border border-gray-500 rounded bg-gray-700 text-white"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="text-sm text-gray-400"
              />
              {preview && <img src={preview} alt="Preview" className="w-16 h-16 rounded-full mx-auto" />}
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-2 px-4 bg-gray-600 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`py-2 px-4 rounded font-semibold transition-colors duration-200 ${
                    loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateProfilePage;
