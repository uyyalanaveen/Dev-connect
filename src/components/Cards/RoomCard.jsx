import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, AlertCircle, Lock } from 'lucide-react';

const RoomCard = ({
  roomName,
  roomDescription,
  roomId,
  maxParticipants,
  ispublic,
  createdBy,
  onJoinSuccess
}) => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [users, setUsers] = useState([]);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [password, setPassword] = useState('');

  // Fetch room details to get participants
  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const response = await fetch(`https://devconnect-backend-6opy.onrender.com/api/get-room/${roomId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to fetch room details');

        const data = await response.json();
        setUsers(data.participants || []);
      } catch (err) {
        console.error('Error fetching room:', err);
      }
    };

    fetchRoomDetails();
  }, [roomId]);

  const handleJoinRoom = async () => {
    if (!ispublic && !passwordModalOpen) {
      // Show password modal for private rooms
      setPasswordModalOpen(true);
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      // Only for private rooms - send password to the API
      if (!ispublic) {
        const response = await fetch(`http://localhost:5000/api/room/${roomId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({ password }),
          credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || 'Failed to join room');
        }
      }

      // Navigate to room page
      navigate(`/room/${roomId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  const cancelPasswordEntry = () => {
    setPasswordModalOpen(false);
    setPassword('');
    setError('');
  };

  const isRoomFull = users.length >= maxParticipants;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-md">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">{roomName}</h3>
          {/* <Settings className="h-5 w-5 text-gray-400 hover:text-gray-300 cursor-pointer transition-colors duration-200" /> */}
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-500">{roomDescription}</p>
          <p className="text-gray-400 text-sm">
            Participants: {users.length}/{maxParticipants}
          </p>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded flex items-center ${ispublic ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
              {!ispublic && <Lock className="h-3 w-3 mr-1" />}
              {ispublic ? 'Public' : 'Private'}
            </span>
            <span className="text-gray-400 text-sm">
              Created by: <strong>{createdBy || 'Unknown'}</strong>
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 mt-2 bg-red-600 text-white text-sm rounded flex items-center space-x-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {users.length === 0 ? (
            <p className="text-sm text-gray-500 col-span-2">No users in this room yet.</p>
          ) : (
            users.map((participant, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 rounded-lg bg-gray-800/50">
                <img
                  src={participant?.userId?.profileImage || '../../assests/profile.png'}
                  alt={participant?.fullname || 'User'}
                  className="h-8 w-8 rounded-full object-cover"
                />

                <span className="text-sm text-gray-300 truncate">
                  {participant?.userId?.fullname || "Unknown"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={handleJoinRoom}
          disabled={isJoining || isRoomFull}
          className={`w-full p-4 font-semibold rounded-lg text-center transition-colors duration-200
            ${isRoomFull
              ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
              : isJoining
                ? 'bg-blue-700 text-gray-200 cursor-wait'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
          {isRoomFull
            ? 'Room Full'
            : isJoining
              ? 'Joining...'
              : `Join Room${!ispublic ? ' (Password Required)' : ''}`}
        </button>
      </div>

      {/* Password Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Enter Room Password
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              This room requires a password to join.
            </p>
            
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            
            <div className="flex space-x-3">
              <button
                onClick={cancelPasswordEntry}
                className="flex-1 p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinRoom}
                disabled={!password.trim()}
                className={`flex-1 p-3 rounded-lg transition-colors ${
                  !password.trim() 
                    ? 'bg-blue-800 text-gray-300 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomCard;