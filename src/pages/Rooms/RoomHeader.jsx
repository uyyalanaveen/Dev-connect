// RoomHeader.jsx
import React from "react";

const RoomHeader = ({ 
  roomName, 
  roomId, 
  muted, 
  isScreenSharing, 
  toggleMute, 
  startScreenShare, 
  stopScreenShare,
  handleLeaveRoom 
}) => {
  return (
    <div className="mb-6 flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">{roomName || "Audio Room"}</h1>
        <p className="text-gray-400">Room ID: {roomId}</p>
      </div>
      <div className="flex space-x-3">
        <button
          onClick={toggleMute}
          className={`px-4 py-2 rounded-full flex items-center ${
            muted ? "bg-red-600" : "bg-green-600"
          }`}
        >
          {muted ? (
            <>
              <span className="mr-2">🔇</span> Unmute
            </>
          ) : (
            <>
              <span className="mr-2">🎙️</span> Mute
            </>
          )}
        </button>
        <button
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
          className={`px-4 py-2 rounded-full flex items-center ${
            isScreenSharing ? "bg-red-600" : "bg-blue-600"
          }`}
        >
          {isScreenSharing ? (
            <>
              <span className="mr-2">📺</span> Stop Sharing
            </>
          ) : (
            <>
              <span className="mr-2">📺</span> Share Screen
            </>
          )}
        </button>
        <button
          onClick={handleLeaveRoom}
          className="px-4 py-2 bg-red-600 rounded-full hover:bg-red-700 transition"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
};

export default RoomHeader;