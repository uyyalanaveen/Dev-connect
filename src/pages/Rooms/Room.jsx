import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, PhoneOff, UserCircle } from "lucide-react";
import io from "socket.io-client";

// Socket connection
const socket = io("https://dev-conncet-backend.onrender.com", {
  transports: ["websocket"],
  reconnection: true
});

const Room = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();

  // User information
  const userInfo = useRef(JSON.parse(sessionStorage.getItem("user")) || {});
  
  // Media states
  const [participants, setParticipants] = useState(new Map());
  const [mediaState, setMediaState] = useState({
    isMuted: true,
    isVideoOff: true, // Start with video off
  });
  const [error, setError] = useState(null);
  
  // Refs
  const localStreamRef = useRef(null);
  const connectionsRef = useRef({});
  const videoRefsRef = useRef({});

  // Debug media tracks
  const debugMediaTracks = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      const audioTracks = localStreamRef.current.getAudioTracks();
      
      console.log("--- MEDIA TRACKS DEBUG ---");
      console.log("Video tracks:", videoTracks.length);
      videoTracks.forEach((track, i) => {
        console.log(`Video track ${i}:`, {
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          id: track.id
        });
      });
      
      console.log("Audio tracks:", audioTracks.length);
      audioTracks.forEach((track, i) => {
        console.log(`Audio track ${i}:`, {
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          id: track.id
        });
      });
      console.log("-------------------------");
    } else {
      console.log("No local stream available");
    }
  }, []);

  // Initialize media stream
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      
      // Set initial state - audio muted, video OFF
      stream.getAudioTracks()[0].enabled = false;
      
      // Stop video track immediately since we want to start with video off
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = false; // Just disable instead of stopping
      }
      
      return stream;
    } catch (err) {
      console.error("Error accessing media devices:", err);
      setError("Could not access camera or microphone. Please check your permissions.");
      throw err;
    }
  }, []);

  // Fetch room data to get all participants
  const token = localStorage.getItem('authToken');
  const fetchRoomData = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/get-room/${roomId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch room data');
      }
      
      const roomData = await response.json();
      console.log("Room data fetched:", roomData.participants);
      
      // Initialize participants with data from the API
      roomData.participants.forEach(participant => {
        setParticipants(prev => {
          const updated = new Map(prev);
          
          // Only add if not already in our map and not ourselves
          if (!updated.has(participant.userId._id) && participant.userId._id !== userInfo.current._id) {
            updated.set(participant.userId._id, {
              name: participant.userId.fullname || "Anonymous",
              profileImage: participant.userId.profileImage || null,
              mediaState: { isMuted: true, isVideoOff: true }, // Assume muted/video off initially
              stream: null // No stream yet
            });
          }
          
          return updated;
        });
      });
    } catch (error) {
      console.error("Error fetching room data:", error);
      setError("Failed to fetch room data");
    }
  }, [roomId]);

  // Create a peer connection
  const createPeerConnection = useCallback((peerId, peerInfo, isInitiator) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" }
        ]
      });

      // Add our local tracks to the connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Handle incoming tracks (remote user's video/audio)
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        
        // Update the participant with their stream
        setParticipants(prev => {
          const updated = new Map(prev);
          const participant = updated.get(peerId) || { 
            name: peerInfo?.name || "Anonymous",
            profileImage: peerInfo?.profileImage || null,
            mediaState: peerInfo?.mediaState || { isMuted: true, isVideoOff: true }
          };
          
          updated.set(peerId, { 
            ...participant, 
            stream: remoteStream 
          });
          return updated;
        });
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            roomId,
            candidate: event.candidate,
            to: peerId
          });
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          pc.restartIce();
        }
        
        if (pc.connectionState === "closed") {
          cleanupPeerConnection(peerId);
        }
      };

      // Store the connection
      connectionsRef.current[peerId] = pc;

      // If we're the initiator, create and send an offer
      if (isInitiator) {
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .then(() => {
            socket.emit("offer", {
              roomId,
              offer: pc.localDescription,
              to: peerId,
              from: userInfo.current._id,
              userData: {
                name: userInfo.current.fullname || userInfo.current.name || "Anonymous",
                profileImage: userInfo.current.profileImage,
                mediaState: mediaState
              }
            });
          })
          .catch(err => {
            console.error("Error creating offer:", err);
            setError("Failed to connect to peer");
          });
      }

      return pc;
    } catch (err) {
      console.error("Error creating peer connection:", err);
      return null;
    }
  }, [roomId, mediaState]);

  // Clean up a peer connection
  const cleanupPeerConnection = useCallback((peerId) => {
    if (connectionsRef.current[peerId]) {
      connectionsRef.current[peerId].close();
      delete connectionsRef.current[peerId];
    }
    
    setParticipants(prev => {
      const updated = new Map(prev);
      updated.delete(peerId);
      return updated;
    });
  }, []);

  // Toggle audio on/off
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const audioTrack = audioTracks[0];
        audioTrack.enabled = !audioTrack.enabled;
        
        const newMediaState = {
          ...mediaState,
          isMuted: !audioTrack.enabled
        };
        
        setMediaState(newMediaState);
        
        // Log the audio state for debugging
        console.log("Audio track enabled:", audioTrack.enabled);
        
        // Broadcast media state change to all peers
        socket.emit("media-state-change", {
          roomId,
          userId: userInfo.current._id,
          mediaState: newMediaState
        });
      }
    }
  }, [roomId, mediaState]);

  // Toggle video on/off
  const toggleVideo = useCallback(() => {
    // Get current video state
    const isCurrentlyOff = mediaState.isVideoOff;
    console.log("Current video state:", isCurrentlyOff ? "OFF" : "ON");
    
    if (isCurrentlyOff) {
      // Turn video ON
      console.log("Attempting to turn video ON");
      
      if (localStreamRef.current) {
        const videoTracks = localStreamRef.current.getVideoTracks();
        
        if (videoTracks.length > 0) {
          // Enable existing video track
          videoTracks[0].enabled = true;
          console.log("Enabled existing video track:", videoTracks[0].id);
        } else {
          // Get new video track if none exists
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(newStream => {
              const newVideoTrack = newStream.getVideoTracks()[0];
              
              // Add to local stream
              localStreamRef.current.addTrack(newVideoTrack);
              
              // Add to all peer connections
              Object.values(connectionsRef.current).forEach(pc => {
                pc.addTrack(newVideoTrack, localStreamRef.current);
              });
            })
            .catch(err => {
              console.error("Error acquiring video:", err);
              setError("Failed to turn camera on. Please check permissions and refresh.");
              return;
            });
        }
      } else {
        // Initialize media if no local stream exists
        initializeMedia()
          .then(stream => {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
              videoTrack.enabled = true;
            }
          })
          .catch(err => {
            console.error("Error initializing media:", err);
            setError("Failed to turn camera on. Please check permissions and refresh.");
            return;
          });
      }
      
      // Update UI state
      const newMediaState = {
        ...mediaState,
        isVideoOff: false
      };
      
      setMediaState(newMediaState);
      
      // Broadcast media state change
      socket.emit("media-state-change", {
        roomId,
        userId: userInfo.current._id,
        mediaState: newMediaState
      });
      
    } else {
      // Turn video OFF
      console.log("Turning video OFF");
      
      if (localStreamRef.current) {
        const videoTracks = localStreamRef.current.getVideoTracks();
        
        // Disable all video tracks instead of stopping them
        videoTracks.forEach(track => {
          track.enabled = false;
          console.log("Disabled video track:", track.id);
        });
      }
      
      // Update UI state
      const newMediaState = {
        ...mediaState,
        isVideoOff: true
      };
      
      setMediaState(newMediaState);
      
      // Broadcast media state change
      socket.emit("media-state-change", {
        roomId,
        userId: userInfo.current._id,
        mediaState: newMediaState
      });
    }
  }, [roomId, mediaState, initializeMedia]);

  // Setup socket listeners
  const setupSocketListeners = useCallback(() => {
    // Handle list of existing peers when joining
    socket.on("peers", ({ peers }) => {
      console.log("Received peers list:", peers);
      peers.forEach(peer => {
        const { userId, userData } = peer;
        
        // Skip ourselves
        if (userId === userInfo.current._id) return;
        
        // Add participant to our state
        setParticipants(prev => {
          const updated = new Map(prev);
          // Fix: Correctly access user data properties
          updated.set(userId, {
            name: userData?.name || "Anonymous",
            profileImage: userData?.profileImage || null,
            mediaState: userData?.mediaState || { isMuted: true, isVideoOff: true },
            stream: null
          });
          return updated;
        });
        
        // Create connection to this peer
        createPeerConnection(userId, userData, true);
      });
    });

    // Handle new peer joining
    socket.on("peer-joined", ({ peerId, userData }) => {
      console.log("Peer joined:", peerId, userData);
      
      // Skip if it's us
      if (peerId === userInfo.current._id) return;
      
      // Add new participant to our state
      setParticipants(prev => {
        const updated = new Map(prev);
        updated.set(peerId, {
          name: userData?.name || "Anonymous",
          profileImage: userData?.profileImage || null,
          mediaState: userData?.mediaState || { isMuted: true, isVideoOff: true },
          stream: null
        });
        return updated;
      });
    });

    // Handle peer leaving
    socket.on("peer-left", ({ peerId }) => {
      cleanupPeerConnection(peerId);
    });

    // Handle incoming offer
    socket.on("offer", async ({ offer, from, userData }) => {
      try {
        console.log("Received offer from:", from, userData);
        
        // Skip if it's from ourselves
        if (from === userInfo.current._id) return;
        
        // Update participant info
        setParticipants(prev => {
          const updated = new Map(prev);
          updated.set(from, {
            name: userData?.name || "Anonymous",
            profileImage: userData?.profileImage || null,
            mediaState: userData?.mediaState || { isMuted: true, isVideoOff: true },
            stream: null
          });
          return updated;
        });
        
        // Create or get connection
        const pc = connectionsRef.current[from] || createPeerConnection(from, userData, false);
        if (!pc) return;
        
        // Set remote description (their offer)
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        
        // Create and set our answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        // Send our answer back
        socket.emit("answer", {
          roomId,
          answer,
          to: from,
          from: userInfo.current._id,
          userData: {
            name: userInfo.current.fullname || userInfo.current.name || "Anonymous",
            profileImage: userInfo.current.profileImage,
            mediaState: mediaState
          }
        });
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    });

    // Handle incoming answer
    socket.on("answer", async ({ answer, from, userData }) => {
      try {
        console.log("Received answer from:", from, userData);
        
        // Skip if it's from ourselves
        if (from === userInfo.current._id) return;
        
        // Update participant info
        setParticipants(prev => {
          const updated = new Map(prev);
          const existing = updated.get(from) || {};
          updated.set(from, {
            ...existing,
            name: userData?.name || existing.name || "Anonymous",
            profileImage: userData?.profileImage || existing.profileImage || null,
            mediaState: userData?.mediaState || existing.mediaState || { isMuted: true, isVideoOff: true }
          });
          return updated;
        });
        
        // Get connection
        const pc = connectionsRef.current[from];
        if (pc) {
          // Set remote description (their answer)
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (err) {
        console.error("Error handling answer:", err);
      }
    });

    // Handle ICE candidates
    socket.on("ice-candidate", async ({ candidate, from }) => {
      try {
        // Skip if it's from ourselves
        if (from === userInfo.current._id) return;
        
        const pc = connectionsRef.current[from];
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error("Error handling ICE candidate:", err);
      }
    });
    
    // Handle media state changes from other participants
    socket.on("media-state-change", ({ userId, mediaState: newMediaState }) => {
      console.log("Media state change from:", userId, newMediaState);
      
      // Skip if it's from ourselves
      if (userId === userInfo.current._id) return;
      
      setParticipants(prev => {
        const updated = new Map(prev);
        const participant = updated.get(userId);
        
        if (participant) {
          updated.set(userId, {
            ...participant,
            mediaState: newMediaState
          });
        }
        
        return updated;
      });
    });
  }, [roomId, createPeerConnection, cleanupPeerConnection, mediaState]);

  // Main effect to setup the room
  useEffect(() => {
    // Validate user
    if (!userInfo.current || !userInfo.current._id) {
      navigate("/");
      return;
    }

    // Setup everything
    const setupRoom = async () => {
      try {
        // Initialize media
        await initializeMedia();
        
        // Add ourselves to participants
        setParticipants(prev => {
          const updated = new Map(prev);
          updated.set(userInfo.current._id, {
            name: userInfo.current.fullname || userInfo.current.name || "You",
            profileImage: userInfo.current.profileImage,
            mediaState,
            isLocal: true,
            stream: localStreamRef.current
          });
          return updated;
        });
        
        // Setup socket listeners
        setupSocketListeners();
        
        // Join the room
        socket.emit("join", {
          roomId,
          userId: userInfo.current._id,
          userData: {
            name: userInfo.current.fullname || userInfo.current.name || "Anonymous",
            profileImage: userInfo.current.profileImage,
            mediaState
          }
        });
        
        // Fetch room data to display all participants
        fetchRoomData();
      } catch (err) {
        console.error("Error setting up room:", err);
      }
    };

    setupRoom();

    // Cleanup when leaving
    return () => {
      // Stop all tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Close all peer connections
      Object.values(connectionsRef.current).forEach(pc => pc.close());
      
      // Leave the room
      socket.emit("leave", { roomId, userId: userInfo.current._id });
      
      // Remove all socket listeners
      socket.off();
    };
  }, [roomId, navigate, initializeMedia, setupSocketListeners, mediaState, fetchRoomData]);

  // Handle errors
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="bg-red-500 text-white p-4 rounded-lg max-w-md">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => navigate("/")}
            className="mt-4 bg-white text-red-500 py-2 px-4 rounded"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Room header */}
      <div className="bg-gray-800 p-4 shadow-md">
        <h1 className="text-xl font-semibold">Room: {roomId}</h1>
        <p className="text-sm text-gray-400">
          {participants.size} participant{participants.size !== 1 ? 's' : ''}
        </p>
      </div>
      
      {/* Video grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`}>
          {Array.from(participants.entries()).map(([id, participant]) => (
            <div 
              key={id} 
              className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video shadow-lg"
            >
              {participant.stream ? (
                <video
                  ref={el => {
                    if (el) {
                      el.srcObject = participant.stream;
                      videoRefsRef.current[id] = el;
                    }
                  }}
                  autoPlay
                  playsInline
                  muted={participant.isLocal}
                  className={`w-full h-full object-cover ${
                    participant.mediaState?.isVideoOff ? 'hidden' : ''
                  }`}
                />
              ) : null}
              
              {/* Placeholder when video is off */}
              {!participant.stream || participant.mediaState?.isVideoOff ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                  {participant.profileImage ? (
                    <img 
                      src={participant.profileImage} 
                      alt={participant.name}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircle size={80} className="text-gray-500" />
                  )}
                </div>
              ) : null}
              
              {/* User info bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-2 flex items-center justify-between">
                <span className="font-medium truncate">
                  {participant.isLocal ? 'You' : participant.name}
                </span>
                <div className="flex space-x-2">
                  {participant.mediaState?.isMuted ? (
                    <MicOff size={16} className="text-red-500" />
                  ) : (
                    <Mic size={16} className="text-green-500" />
                  )}
                  {participant.mediaState?.isVideoOff ? (
                    <VideoOff size={16} className="text-red-500" />
                  ) : (
                    <Video size={16} className="text-green-500" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Control bar */}
      <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 flex gap-6 bg-gray-800 px-6 py-3 rounded-full shadow-lg">
        <button 
          onClick={toggleMute}
          className={`p-4 rounded-full ${mediaState.isMuted ? "bg-red-500" : "bg-blue-500"}`}
          title={mediaState.isMuted ? "Unmute" : "Mute"}
        >
          {mediaState.isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        <button 
          onClick={toggleVideo}
          className={`p-4 rounded-full ${mediaState.isVideoOff ? "bg-red-500" : "bg-blue-500"}`}
          title={mediaState.isVideoOff ? "Turn Video On" : "Turn Video Off"}
        >
          {mediaState.isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </button>
        <button 
          onClick={() => navigate("/")}
          className="p-4 rounded-full bg-red-500"
          title="Leave Room"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
};

export default Room;