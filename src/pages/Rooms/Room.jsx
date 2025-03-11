// Main Room component
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import ParticipantsList from "./ParticipantsList";
import ScreenShareArea from "./ScreenShareArea";
import RoomHeader from "./RoomHeader";
import DebugPanel from "./DebugPanel";

const Room = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [muted, setMuted] = useState(false);
  const [connected, setConnected] = useState(false);
  const [screenSharingPeers, setScreenSharingPeers] = useState({});
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectedParticipants, setConnectedParticipants] = useState([]);
  const [localUser, setLocalUser] = useState(null);
  const [debugInfo, setDebugInfo] = useState({
    activePeers: 0,
    remoteStreams: 0,
    localTracks: 0,
    socketConnected: false,
    screenSharesActive: 0
  });

  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const audioContainerRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const screenPeerConnectionsRef = useRef({});
  const socketToUserMap = useRef({});

  useEffect(() => {
    // Create audio container
    audioContainerRef.current = document.createElement("div");
    audioContainerRef.current.id = "audio-container";
    audioContainerRef.current.style.display = "none";
    document.body.appendChild(audioContainerRef.current);

    const token = localStorage.getItem("authToken");
    const user = JSON.parse(sessionStorage.getItem("user"));
    setLocalUser(user);

    if (!user?._id) {
      setError("User authentication required");
      setLoading(false);
      return;
    }

    // Add yourself to participants list
    if (user) {
      setConnectedParticipants([{
        userId: user,
        isLocal: true
      }]);
    }

    // Initialize socket connection
    socketRef.current = io("https://devconnect-backend-6opy.onrender.com", {
      auth: { userId: user._id },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Socket connection events
    socketRef.current.on("connect", () => {
      setConnected(true);
      setDebugInfo(prev => ({ ...prev, socketConnected: true }));
      initializeLocalStream();
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      setError(`Socket connection error: ${err.message}`);
    });

    socketRef.current.on("disconnect", () => {
      setConnected(false);
      setDebugInfo(prev => ({ ...prev, socketConnected: false }));
    });

    // Fetch room name for display
    if (token && roomId) {
      fetchRoomDetails(token, roomId);
    } else {
      setLoading(false);
    }

    return () => {
      cleanupResources();
    };
  }, [roomId]);

  const initializeLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false
      });

      localStreamRef.current = stream;
      setDebugInfo(prev => ({ ...prev, localTracks: stream.getAudioTracks().length }));

      // Create local audio preview
      const localAudio = document.createElement("audio");
      localAudio.id = "local-audio-preview";
      localAudio.srcObject = stream;
      localAudio.muted = true;
      localAudio.autoplay = true;
      audioContainerRef.current.appendChild(localAudio);

      setupSocketEvents();
      socketRef.current.emit("join-room", roomId);
    } catch (err) {
      setError(`Microphone access failed: ${err.message}`);
    }
  };

  const setupSocketEvents = () => {
    // Handle existing users
    socketRef.current.on("all-users", (users) => {
      Object.keys(peerConnectionsRef.current).forEach(removePeer);

      users.forEach((socketId) => {
        addPeer(socketId, true);
      });

      // Update participants list
      const newParticipants = users.map(socketId => {
        const userId = socketToUserMap.current[socketId];
        return {
          socketId,
          userId: userId || { 
            _id: socketId, 
            fullname: `User ${socketId.substring(0, 5)}`,
            profileImage: null
          },
          isLocal: false
        };
      });
      
      setConnectedParticipants(prev => {
        const filteredPrev = prev.filter(p => p.isLocal);
        return [...filteredPrev, ...newParticipants];
      });

      setDebugInfo(prev => ({ ...prev, activePeers: users.length }));
    });

    // New user joined
    socketRef.current.on("user-joined", (socketId) => {
      addPeer(socketId, false);
      
      const userId = socketToUserMap.current[socketId];
      setConnectedParticipants(prev => [
        ...prev,
        {
          socketId,
          userId: userId || { 
            _id: socketId, 
            fullname: `User ${socketId.substring(0, 5)}`,
            profileImage: null
          },
          isLocal: false
        }
      ]);
      
      setDebugInfo(prev => ({ ...prev, activePeers: prev.activePeers + 1 }));
    });

    // User left
    socketRef.current.on("user-left", (socketId) => {
      removePeer(socketId);
      
      setConnectedParticipants(prev => 
        prev.filter(p => p.socketId !== socketId && !p.isLocal)
      );
      
      setDebugInfo(prev => ({ ...prev, activePeers: Math.max(0, prev.activePeers - 1) }));
    });

    // WebRTC signaling events
    socketRef.current.on("offer", async ({ sender, offer }) => {
      try {
        if (!peerConnectionsRef.current[sender]) {
          addPeer(sender, false);
        }

        const pc = peerConnectionsRef.current[sender];
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketRef.current.emit("answer", {
          target: sender,
          answer: pc.localDescription
        });
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    });

    socketRef.current.on("answer", async ({ sender, answer }) => {
      try {
        const pc = peerConnectionsRef.current[sender];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (err) {
        console.error("Error handling answer:", err);
      }
    });

    socketRef.current.on("ice-candidate", ({ sender, candidate }) => {
      try {
        const pc = peerConnectionsRef.current[sender];
        if (pc) {
          pc.addIceCandidate(new RTCIceCandidate(candidate))
            .catch(e => console.error("Failed to add ICE candidate:", e));
        }
      } catch (err) {
        console.error("Error handling ICE candidate:", err);
      }
    });

    // Map userIDs to socket IDs
    socketRef.current.on("user-socket-map", (mappings) => {
      socketToUserMap.current = mappings;
      
      setConnectedParticipants(prev => {
        return prev.map(participant => {
          if (participant.socketId && mappings[participant.socketId]) {
            const userId = mappings[participant.socketId];
            return {
              ...participant,
              userId: {
                _id: userId,
                fullname: `User ${userId.substring(0, 5)}`,
                profileImage: null
              }
            };
          }
          return participant;
        });
      });
    });

    // Screen sharing events
    socketRef.current.on("user-screen-sharing-started", ({ socketId, userId }) => {
      handleIncomingScreenShare(socketId, userId);
    });

    socketRef.current.on("user-screen-sharing-stopped", ({ userId }) => {
      handlePeerStoppedScreenShare(userId);
    });

    // Screen share signaling
    socketRef.current.on("screen-offer", async ({ sender, offer }) => {
      try {
        const peerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
          ]
        });

        peerConnection.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            const remoteStream = event.streams[0];
            const userId = socketToUserMap.current[sender];

            if (!userId) return;

            let videoEl = document.getElementById(`screen-${userId}`);
            if (!videoEl) {
              videoEl = document.createElement("video");
              videoEl.id = `screen-${userId}`;
              videoEl.autoplay = true;
              videoEl.className = "w-full border border-gray-800";

              const container = document.getElementById(`screen-container-${userId}`);
              if (container) {
                container.appendChild(videoEl);
                container.style.display = "block";
              } else {
                const newContainer = document.createElement("div");
                newContainer.id = `screen-container-${userId}`;
                newContainer.className = "mt-2 bg-gray-900 rounded-lg";
                newContainer.appendChild(videoEl);
                
                const screensArea = document.getElementById("screens-area");
                if (screensArea) {
                  screensArea.appendChild(newContainer);
                }
              }
            }

            videoEl.srcObject = remoteStream;
            videoEl.play().catch(err => {
              console.error("Failed to play screen share:", err);
            });
          }
        };

        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current.emit("screen-ice-candidate", {
              target: sender,
              candidate: event.candidate,
            });
          }
        };

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socketRef.current.emit("screen-answer", {
          target: sender,
          answer: peerConnection.localDescription
        });

        screenPeerConnectionsRef.current[sender] = peerConnection;
      } catch (err) {
        console.error("Error handling screen share offer:", err);
      }
    });

    socketRef.current.on("screen-answer", async ({ sender, answer }) => {
      try {
        const pc = screenPeerConnectionsRef.current[sender];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (err) {
        console.error("Error handling screen share answer:", err);
      }
    });

    socketRef.current.on("screen-ice-candidate", ({ sender, candidate }) => {
      try {
        const pc = screenPeerConnectionsRef.current[sender];
        if (pc) {
          pc.addIceCandidate(new RTCIceCandidate(candidate))
            .catch(e => console.error("Failed to add screen share ICE candidate:", e));
        }
      } catch (err) {
        console.error("Error handling screen share ICE candidate:", err);
      }
    });
  };

  const addPeer = (socketId, isInitiator) => {
    if (peerConnectionsRef.current[socketId]) return;

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ]
    });

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("ice-candidate", {
          target: socketId,
          candidate: event.candidate,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const remoteStream = event.streams[0];

        let audioEl = document.getElementById(`audio-${socketId}`);
        if (!audioEl) {
          audioEl = document.createElement("audio");
          audioEl.id = `audio-${socketId}`;
          audioEl.autoplay = true;
          audioEl.controls = true;
          audioContainerRef.current.appendChild(audioEl);
        }

        audioEl.srcObject = remoteStream;
        audioEl.play().catch(err => {
          console.error("Failed to play audio:", err);
        });

        setDebugInfo(prev => ({
          ...prev,
          remoteStreams: prev.remoteStreams + 1
        }));
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      if (peerConnection.iceConnectionState === 'failed') {
        peerConnection.restartIce();
      }
    };

    if (isInitiator) {
      peerConnection.createOffer({
        offerToReceiveAudio: true,
        voiceActivityDetection: false
      }).then(offer => {
        return peerConnection.setLocalDescription(offer);
      }).then(() => {
        socketRef.current.emit("offer", {
          target: socketId,
          offer: peerConnection.localDescription
        });
      }).catch(err => {
        console.error("Error creating offer:", err);
      });
    }

    peerConnectionsRef.current[socketId] = peerConnection;
  };

  const removePeer = (socketId) => {
    const pc = peerConnectionsRef.current[socketId];
    if (pc) {
      pc.close();

      const audioEl = document.getElementById(`audio-${socketId}`);
      if (audioEl) {
        audioEl.srcObject = null;
        audioEl.remove();
      }

      delete peerConnectionsRef.current[socketId];
    }
  };

  const startScreenShare = async () => {
    try {
      if (isScreenSharing) return;

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      screenStreamRef.current = stream;
      setIsScreenSharing(true);

      socketRef.current.emit("screen-sharing-started", roomId);

      Object.keys(peerConnectionsRef.current).forEach((socketId) => {
        createScreenShareConnection(socketId);
      });

      if (localUser) {
        setScreenSharingPeers(prev => ({
          ...prev,
          [localUser._id]: true
        }));
      }

    } catch (err) {
      console.error("Error starting screen share:", err);
      alert(`Screen sharing failed: ${err.message}`);
    }
  };

  const stopScreenShare = () => {
    if (!isScreenSharing || !screenStreamRef.current) return;

    screenStreamRef.current.getTracks().forEach(track => {
      track.stop();
    });

    Object.keys(screenPeerConnectionsRef.current).forEach(socketId => {
      if (screenPeerConnectionsRef.current[socketId]) {
        screenPeerConnectionsRef.current[socketId].close();
        delete screenPeerConnectionsRef.current[socketId];
      }
    });

    screenStreamRef.current = null;
    setIsScreenSharing(false);

    socketRef.current.emit("screen-sharing-stopped", roomId);

    if (localUser) {
      setScreenSharingPeers(prev => {
        const updated = { ...prev };
        delete updated[localUser._id];
        return updated;
      });
    }
  };

  const createScreenShareConnection = (socketId) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ]
    });

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, screenStreamRef.current);
      });
    } else {
      return;
    }

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("screen-ice-candidate", {
          target: socketId,
          candidate: event.candidate,
        });
      }
    };

    peerConnection.createOffer().then(offer => {
      return peerConnection.setLocalDescription(offer);
    }).then(() => {
      socketRef.current.emit("screen-offer", {
        target: socketId,
        offer: peerConnection.localDescription
      });
    }).catch(err => {
      console.error("Error creating screen share offer:", err);
    });

    screenPeerConnectionsRef.current[socketId] = peerConnection;
  };

  const handleIncomingScreenShare = (socketId, userId) => {
    setScreenSharingPeers(prev => ({
      ...prev,
      [userId]: true
    }));

    setDebugInfo(prev => ({
      ...prev,
      screenSharesActive: prev.screenSharesActive + 1
    }));
  };

  const handlePeerStoppedScreenShare = (userId) => {
    setScreenSharingPeers(prev => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });

    setDebugInfo(prev => ({
      ...prev,
      screenSharesActive: Math.max(0, prev.screenSharesActive - 1)
    }));

    const videoEl = document.getElementById(`screen-${userId}`);
    if (videoEl) {
      videoEl.srcObject = null;
      videoEl.remove();
    }

    const container = document.getElementById(`screen-container-${userId}`);
    if (container) {
      container.style.display = "none";
    }
  };

  const fetchRoomDetails = async (token, roomId) => {
    try {
      const response = await fetch(`https://devconnect-backend-6opy.onrender.com/api/get-room/${roomId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch room");

      const data = await response.json();
      setRoom(data);
      setLoading(false);
    } catch (err) {
      setError(`${err.message} (Room info may not be available, but you can still connect)`);
      setLoading(false);
    }
  };

  const cleanupResources = () => {
    Object.keys(peerConnectionsRef.current).forEach(socketId => {
      peerConnectionsRef.current[socketId].close();
    });
    peerConnectionsRef.current = {};

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      localStreamRef.current = null;
    }

    if (isScreenSharing && screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      screenStreamRef.current = null;
    }

    Object.keys(screenPeerConnectionsRef.current).forEach(socketId => {
      screenPeerConnectionsRef.current[socketId].close();
    });
    screenPeerConnectionsRef.current = {};

    setIsScreenSharing(false);
    setScreenSharingPeers({});

    if (audioContainerRef.current) {
      while (audioContainerRef.current.firstChild) {
        audioContainerRef.current.removeChild(audioContainerRef.current.firstChild);
      }
      document.body.removeChild(audioContainerRef.current);
      audioContainerRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setMuted(prev => !prev);
    }
  };

  const debugAudio = () => {
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getAudioTracks();
      console.log("Local audio tracks:", tracks);
    }

    const audioElements = document.querySelectorAll('audio');
    console.log(`Found ${audioElements.length} audio elements`);

    if (confirm("Do you want to try reconnecting to all peers?")) {
      Object.keys(peerConnectionsRef.current).forEach(socketId => {
        removePeer(socketId);
      });
      
      socketRef.current.emit("join-room", roomId);
    }
  };

  const handleLeaveRoom = async () => {
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(sessionStorage.getItem("user"));

    if (token && user?._id) {
      try {
        await fetch(`https://devconnect-backend-6opy.onrender.com/api/room/leave-room/${roomId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: user._id }),
        });
      } catch (err) {
        console.error("Error leaving room:", err);
      }
    }

    cleanupResources();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connecting to room...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-red-500">Error</h2>
          <p className="mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <RoomHeader 
        roomName={room?.name} 
        roomId={roomId} 
        muted={muted} 
        isScreenSharing={isScreenSharing}
        toggleMute={toggleMute}
        startScreenShare={startScreenShare}
        stopScreenShare={stopScreenShare}
        handleLeaveRoom={handleLeaveRoom}
      />

      <div className={`mb-4 p-2 rounded ${connected ? "bg-green-900" : "bg-red-900"}`}>
        <p>
          {connected ? "🟢 Connected to voice chat" : "🔴 Disconnected from voice chat"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ParticipantsList 
          participants={connectedParticipants} 
          screenSharingPeers={screenSharingPeers}
          muted={muted}
        />

        <ScreenShareArea 
          screenSharingPeers={screenSharingPeers}
          startScreenShare={startScreenShare}
          isScreenSharing={isScreenSharing}
          localUser={localUser}
          connectedParticipants={connectedParticipants}
        />
      </div>

      <DebugPanel 
        debugInfo={debugInfo} 
        debugAudio={debugAudio} 
      />
    </div>
  );
};

export default Room;