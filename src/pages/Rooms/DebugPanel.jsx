// DebugPanel.jsx
import React, { useState } from "react";

const DebugPanel = ({ debugInfo, debugAudio }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-lg">
      <div 
        className="flex justify-between items-center cursor-pointer" 
        onClick={() => setExpanded(!expanded)}
      >
        <h2 className="text-xl font-bold">Debug Information</h2>
        <button className="text-gray-400">
          {expanded ? "▲ Hide" : "▼ Show"}
        </button>
      </div>
      
      {expanded && (
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700 p-3 rounded">
              <h3 className="font-medium mb-2">Connection Status</h3>
              <p className={`${debugInfo.socketConnected ? "text-green-400" : "text-red-400"}`}>
                {debugInfo.socketConnected ? "🟢 Socket Connected" : "🔴 Socket Disconnected"}
              </p>
            </div>
            
            <div className="bg-gray-700 p-3 rounded">
              <h3 className="font-medium mb-2">Audio</h3>
              <p>Local Tracks: {debugInfo.localTracks}</p>
              <p>Remote Streams: {debugInfo.remoteStreams}</p>
            </div>
            
            <div className="bg-gray-700 p-3 rounded">
              <h3 className="font-medium mb-2">Peers</h3>
              <p>Active Connections: {debugInfo.activePeers}</p>
              <p>Screen Shares: {debugInfo.screenSharesActive}</p>
            </div>
          </div>
          
          <div className="mt-4">
            <button 
              onClick={debugAudio}
              className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-700 transition"
            >
              Debug Audio Issues
            </button>
            
            <div className="mt-4 bg-gray-700 p-3 rounded">
              <h3 className="font-medium mb-2">Troubleshooting Tips</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>If you can't hear others, check your speaker settings</li>
                <li>If others can't hear you, check your microphone settings</li>
                <li>Try refreshing the page if connections are unstable</li>
                <li>Check browser permissions for microphone access</li>
                <li>Try using Chrome or Firefox for best WebRTC compatibility</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;