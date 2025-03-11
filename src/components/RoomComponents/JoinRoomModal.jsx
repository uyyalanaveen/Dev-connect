import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const JoinRoomModal = ({ room, onClose, onJoinSuccess }) => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinRoom = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    setIsLoading(true);
    try {
      // For private rooms, send the password in the request
      const payload = room.isPrivate ? { password } : {};
      
      const response = await axios.post(
        `https://devconnect-backend-6opy.onrender.com/api/join-room/${room._id}`, 
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Successfully joined the room");
      onJoinSuccess(response.data.room);
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to join room";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-black border border-white p-8 rounded-md shadow-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl mb-4 text-white">Join Room: {room.name}</h2>
        
        {room.isPrivate ? (
          <>
            <p className="text-white mb-4">This is a private room. Please enter the password to join.</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border text-white border-gray-300 rounded outline-none bg-black mb-4"
              placeholder="Room Password"
            />
          </>
        ) : (
          <p className="text-white mb-4">Click Join to enter this public room.</p>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-white rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleJoinRoom}
            className="px-4 py-2 bg-blue-500 text-white rounded"
            disabled={isLoading || (room.isPrivate && !password)}
          >
            {isLoading ? "Joining..." : "Join Room"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinRoomModal;