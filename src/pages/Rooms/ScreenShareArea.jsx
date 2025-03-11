// ScreenShareArea.jsx
import React from "react";

const ScreenShareArea = ({ 
  screenSharingPeers, 
  startScreenShare, 
  isScreenSharing,
  localUser,
  connectedParticipants
}) => {
  const hasActivePeers = Object.keys(screenSharingPeers).length > 0;

  return (
    <div className="lg:col-span-2 bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Screen Sharing</h2>

      {!hasActivePeers && !isScreenSharing ? (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-600 rounded-lg">
          <p className="text-gray-400 mb-4">No active screen shares</p>
          <button
            onClick={startScreenShare}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
          >
            Share Your Screen
          </button>
        </div>
      ) : (
        <div id="screens-area" className="space-y-4">
          {isScreenSharing && localUser && (
            <div className="bg-gray-900 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Your Screen (Preview)</span>
                <span className="bg-blue-600 text-xs px-2 py-1 rounded">Sharing</span>
              </div>
              <div className="bg-black aspect-video rounded flex items-center justify-center">
                <p className="text-gray-400">Your screen is being shared</p>
              </div>
            </div>
          )}

          {Object.keys(screenSharingPeers).map(userId => {
            if (localUser && userId === localUser._id) return null;
            
            const participant = connectedParticipants.find(p => p.userId?._id === userId);
            const userName = participant?.userId?.fullname || "Unknown User";
            
            return (
              <div key={userId} id={`screen-container-${userId}`} className="bg-gray-900 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{userName}'s Screen</span>
                  <span className="bg-blue-600 text-xs px-2 py-1 rounded">Sharing</span>
                </div>
                <div id={`screen-placeholder-${userId}`} className="aspect-video bg-black rounded flex items-center justify-center">
                  <p className="text-gray-400">Loading screen share...</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ScreenShareArea;