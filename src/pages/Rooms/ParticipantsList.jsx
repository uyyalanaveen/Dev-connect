// ParticipantsList.jsx
import React from "react";

const ParticipantsList = ({ participants, screenSharingPeers, muted }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">
        Participants ({participants.length})
      </h2>
      <ul className="space-y-3">
        {participants.map((participant, index) => {
          const userId = participant.userId;
          const isSharing = screenSharingPeers[userId?._id];
          return (
            <li key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                  {userId?.profileImage ? (
                    <img 
                      src={userId.profileImage} 
                      alt={userId?.fullname || "User"} 
                      className="w-8 h-8 rounded-full" 
                    />
                  ) : (
                    <span>{userId?.fullname?.charAt(0) || "U"}</span>
                  )}
                </div>
                <span>
                  {userId?.fullname || "Unknown User"} 
                  {participant.isLocal && " (You)"}
                </span>
              </div>
              <div className="flex space-x-2">
                {isSharing && (
                  <span className="bg-blue-600 text-xs px-2 py-1 rounded">
                    Sharing
                  </span>
                )}
                {participant.isLocal ? (
                  <span 
                    className={`${muted ? "bg-red-600" : "bg-green-600"} text-xs px-2 py-1 rounded`}
                  >
                    {muted ? "Muted" : "Speaking"}
                  </span>
                ) : (
                  <span className="bg-green-600 text-xs px-2 py-1 rounded">
                    Connected
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ParticipantsList;