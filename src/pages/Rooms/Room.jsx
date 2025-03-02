// Room.jsx
// import { useEffect, useState, useRef } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import io from "socket.io-client";

// const Room = () => {
//   const { id: roomId } = useParams();
//   const navigate = useNavigate();
//   const [room, setRoom] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [peers, setPeers] = useState({});
//   const [muted, setMuted] = useState(false);
//   const [connected, setConnected] = useState(false);
//   const socketRef = useRef(null);
//   const localStreamRef = useRef(null);
//   const audioContainerRef = useRef(null);
//   const peerConnectionsRef = useRef({});

//   // Debug state to show in UI
//   const [debugInfo, setDebugInfo] = useState({
//     activePeers: 0,
//     remoteStreams: 0,
//     localTracks: 0,
//     socketConnected: false
//   });

//   useEffect(() => {
//     // Create audio container
//     audioContainerRef.current = document.createElement("div");
//     audioContainerRef.current.id = "audio-container";
//     audioContainerRef.current.style.display = "none";
//     document.body.appendChild(audioContainerRef.current);

//     const token = localStorage.getItem("authToken");
//     const user = JSON.parse(sessionStorage.getItem("user"));

//     if (!user?._id) {
//       setError("User authentication required");
//       setLoading(false);
//       return;
//     }

//     // Initialize socket connection
//     socketRef.current = io("http://localhost:5000", {
//       auth: { userId: user._id },
//       reconnection: true,
//       reconnectionAttempts: 5,
//       reconnectionDelay: 1000,
//     });

//     // Handle socket connection status
//     socketRef.current.on("connect", () => {
//       console.log("Socket connected:", socketRef.current.id);
//       setConnected(true);
//       setDebugInfo(prev => ({...prev, socketConnected: true}));

//       // Once connected, get media and join room
//       initializeLocalStream();
//     });

//     socketRef.current.on("connect_error", (err) => {
//       console.error("Socket connection error:", err.message);
//       setError(`Socket connection error: ${err.message}`);
//     });

//     socketRef.current.on("disconnect", (reason) => {
//       console.log("Socket disconnected:", reason);
//       setConnected(false);
//       setDebugInfo(prev => ({...prev, socketConnected: false}));
//     });

//     // Fetch room details
//     fetchRoomDetails(token, roomId);

//     // Cleanup on component unmount
//     return () => {
//       cleanupResources();
//     };
//   }, [roomId]);

//   // Function to get user media and join room
//   const initializeLocalStream = async () => {
//     try {
//       console.log("Getting user media...");
//       const stream = await navigator.mediaDevices.getUserMedia({
//         audio: {
//           echoCancellation: true,
//           noiseSuppression: true,
//           autoGainControl: true,
//         },
//         video: false
//       });

//       console.log("🎤 Local audio track acquired:", stream.getAudioTracks());
//       localStreamRef.current = stream;
//       setDebugInfo(prev => ({...prev, localTracks: stream.getAudioTracks().length}));

//       // Create local audio preview
//       const localAudio = document.createElement("audio");
//       localAudio.id = "local-audio-preview";
//       localAudio.srcObject = stream;
//       localAudio.muted = true; // Prevent feedback
//       localAudio.autoplay = true;
//       audioContainerRef.current.appendChild(localAudio);

//       // Set up socket event listeners
//       setupSocketEvents();

//       // Join the room now that we have local media
//       console.log("Emitting join-room event for room:", roomId);
//       socketRef.current.emit("join-room", roomId);
//     } catch (err) {
//       console.error("Error accessing microphone:", err);
//       setError(`Microphone access failed: ${err.message}`);
//     }
//   };

//   // Setup socket event listeners for WebRTC signaling
//   const setupSocketEvents = () => {
//     // Handle users already in the room
//     socketRef.current.on("all-users", (users) => {
//       console.log(`📋 ${users.length} users already in room:`, users);
//       Object.keys(peerConnectionsRef.current).forEach(removePeer);

//       users.forEach((socketId) => {
//         addPeer(socketId, true);
//       });

//       // Update debug info
//       setDebugInfo(prev => ({...prev, activePeers: users.length}));
//     });

//     // Handle new user joining
//     socketRef.current.on("user-joined", (socketId) => {
//       console.log("👋 New user joined:", socketId);
//       addPeer(socketId, false);
//       setDebugInfo(prev => ({...prev, activePeers: prev.activePeers + 1}));
//     });

//     // Handle WebRTC offer
//     socketRef.current.on("offer", async ({ sender, offer }) => {
//       console.log("📥 Received offer from:", sender);
//       try {
//         // Create peer connection if it doesn't exist
//         if (!peerConnectionsRef.current[sender]) {
//           addPeer(sender, false);
//         }

//         const pc = peerConnectionsRef.current[sender];

//         // Set remote description (offer)
//         await pc.setRemoteDescription(new RTCSessionDescription(offer));

//         // Create answer
//         const answer = await pc.createAnswer();
//         await pc.setLocalDescription(answer);

//         // Send answer back
//         console.log("Sending answer to:", sender);
//         socketRef.current.emit("answer", { 
//           target: sender, 
//           answer: pc.localDescription 
//         });
//       } catch (err) {
//         console.error("Error handling offer:", err);
//       }
//     });

//     // Handle WebRTC answer
//     socketRef.current.on("answer", async ({ sender, answer }) => {
//       console.log("📤 Received answer from:", sender);
//       try {
//         const pc = peerConnectionsRef.current[sender];
//         if (pc) {
//           await pc.setRemoteDescription(new RTCSessionDescription(answer));
//         } else {
//           console.warn("Received answer for unknown peer:", sender);
//         }
//       } catch (err) {
//         console.error("Error handling answer:", err);
//       }
//     });

//     // Handle ICE candidates
//     socketRef.current.on("ice-candidate", ({ sender, candidate }) => {
//       console.log("❄️ Received ICE candidate from:", sender);
//       try {
//         const pc = peerConnectionsRef.current[sender];
//         if (pc) {
//           pc.addIceCandidate(new RTCIceCandidate(candidate))
//             .catch(e => console.error("Failed to add ICE candidate:", e));
//         }
//       } catch (err) {
//         console.error("Error handling ICE candidate:", err);
//       }
//     });

//     // Handle user leaving
//     socketRef.current.on("user-left", (socketId) => {
//       console.log("👋 User left:", socketId);
//       removePeer(socketId);
//       setDebugInfo(prev => ({...prev, activePeers: Math.max(0, prev.activePeers - 1)}));
//     });

//     // Handle errors from server
//     socketRef.current.on("error", (errorData) => {
//       console.error("Server error:", errorData);
//       setError(`Server error: ${errorData.message}`);
//     });
//   };

//   // Create and setup a new peer connection
//   const addPeer = (socketId, isInitiator) => {
//     console.log(`Creating ${isInitiator ? 'initiator' : 'receiver'} peer connection for ${socketId}`);

//     // Check if we already have a connection
//     if (peerConnectionsRef.current[socketId]) {
//       console.log("Connection already exists for:", socketId);
//       return;
//     }

//     // Create new RTCPeerConnection with STUN/TURN servers
//     const peerConnection = new RTCPeerConnection({
//       iceServers: [
//         { urls: 'stun:stun.l.google.com:19302' },
//         { urls: 'stun:stun1.l.google.com:19302' },
//         { urls: 'stun:stun2.l.google.com:19302' },
//         // Add TURN servers in production for better NAT traversal
//       ]
//     });

//     // Add local audio tracks to the connection
//     if (localStreamRef.current) {
//       localStreamRef.current.getAudioTracks().forEach(track => {
//         console.log("Adding track to peer connection:", track.id);
//         peerConnection.addTrack(track, localStreamRef.current);
//       });
//     } else {
//       console.error("No local stream available when creating peer connection!");
//     }

//     // Set up ICE candidate handler
//     peerConnection.onicecandidate = (event) => {
//       if (event.candidate) {
//         console.log("Generated ICE candidate for:", socketId);
//         socketRef.current.emit("ice-candidate", {
//           target: socketId,
//           candidate: event.candidate,
//         });
//       }
//     };

//     // Set up track handler for incoming audio
//     peerConnection.ontrack = (event) => {
//       console.log("🔊 Received track from:", socketId, event.streams);

//       if (event.streams && event.streams[0]) {
//         const remoteStream = event.streams[0];

//         // Debug remote track info
//         remoteStream.getAudioTracks().forEach(track => {
//           console.log(`Remote track ${track.id} enabled:`, track.enabled);
//         });

//         // Create or update audio element
//         let audioEl = document.getElementById(`audio-${socketId}`);
//         if (!audioEl) {
//           audioEl = document.createElement("audio");
//           audioEl.id = `audio-${socketId}`;
//           audioEl.autoplay = true;
//           audioEl.controls = true; // Helpful for debugging
//           audioContainerRef.current.appendChild(audioEl);
//         }

//         // Set the stream as source and play
//         audioEl.srcObject = remoteStream;
//         audioEl.play().catch(err => {
//           console.error("Failed to play audio:", err);
//         });

//         // Update debug counters
//         setDebugInfo(prev => ({
//           ...prev, 
//           remoteStreams: prev.remoteStreams + 1
//         }));
//       }
//     };

//     // Monitor connection state
//     peerConnection.oniceconnectionstatechange = () => {
//       console.log(`ICE state (${socketId}):`, peerConnection.iceConnectionState);

//       // If failed, try to restart ICE
//       if (peerConnection.iceConnectionState === 'failed') {
//         console.log("Attempting to restart ICE for:", socketId);
//         peerConnection.restartIce();
//       }
//     };

//     peerConnection.onconnectionstatechange = () => {
//       console.log(`Connection state (${socketId}):`, peerConnection.connectionState);
//     };

//     // If we're the initiator, create and send offer
//     if (isInitiator) {
//       console.log("Creating offer as initiator for:", socketId);
//       peerConnection.createOffer({
//         offerToReceiveAudio: true,
//         voiceActivityDetection: false
//       }).then(offer => {
//         return peerConnection.setLocalDescription(offer);
//       }).then(() => {
//         console.log("Sending offer to:", socketId);
//         socketRef.current.emit("offer", {
//           target: socketId,
//           offer: peerConnection.localDescription
//         });
//       }).catch(err => {
//         console.error("Error creating offer:", err);
//       });
//     }

//     // Store the connection
//     peerConnectionsRef.current[socketId] = peerConnection;
//     setPeers(prev => ({...prev, [socketId]: peerConnection}));
//   };

//   // Remove and cleanup a peer connection
//   const removePeer = (socketId) => {
//     const pc = peerConnectionsRef.current[socketId];
//     if (pc) {
//       pc.close();

//       // Remove audio element
//       const audioEl = document.getElementById(`audio-${socketId}`);
//       if (audioEl) {
//         audioEl.srcObject = null;
//         audioEl.remove();
//       }

//       // Remove from refs and state
//       delete peerConnectionsRef.current[socketId];
//       setPeers(prev => {
//         const updated = {...prev};
//         delete updated[socketId];
//         return updated;
//       });

//       console.log("Peer connection closed and removed:", socketId);
//     }
//   };

//   // Fetch room details from server
//   const fetchRoomDetails = async (token, roomId) => {
//     try {
//       const response = await fetch(`http://localhost:5000/api/get-room/${roomId}`, {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) throw new Error("Failed to fetch room");

//       const data = await response.json();
//       setRoom(data);
//       setLoading(false);
//     } catch (err) {
//       console.error("Error fetching room:", err);
//       setError(err.message);
//       setLoading(false);
//     }
//   };

//   // Clean up all resources on unmount
//   const cleanupResources = () => {
//     console.log("Cleaning up WebRTC resources...");

//     // Close all peer connections
//     Object.keys(peerConnectionsRef.current).forEach(socketId => {
//       peerConnectionsRef.current[socketId].close();
//     });
//     peerConnectionsRef.current = {};

//     // Stop all media tracks
//     if (localStreamRef.current) {
//       localStreamRef.current.getTracks().forEach(track => {
//         track.stop();
//       });
//       localStreamRef.current = null;
//     }

//     // Remove audio container
//     if (audioContainerRef.current) {
//       while (audioContainerRef.current.firstChild) {
//         audioContainerRef.current.removeChild(audioContainerRef.current.firstChild);
//       }
//       document.body.removeChild(audioContainerRef.current);
//       audioContainerRef.current = null;
//     }

//     // Disconnect socket
//     if (socketRef.current) {
//       socketRef.current.disconnect();
//       socketRef.current = null;
//     }
//   };

//   // Toggle microphone mute state
//   const toggleMute = () => {
//     if (localStreamRef.current) {
//       const audioTracks = localStreamRef.current.getAudioTracks();
//       audioTracks.forEach(track => {
//         track.enabled = !track.enabled;
//         console.log(`Microphone ${track.enabled ? 'unmuted' : 'muted'}`);
//       });
//       setMuted(prev => !prev);
//     }
//   };

//   // Debug audio connections
//   const debugAudio = () => {
//     // Log local stream status
//     console.log("Local stream:", localStreamRef.current);
//     if (localStreamRef.current) {
//       const tracks = localStreamRef.current.getAudioTracks();
//       console.log("Local audio tracks:", tracks);
//       tracks.forEach(track => {
//         console.log(`Track ${track.id} enabled:`, track.enabled);
//       });
//     }

//     // Log peer connections
//     console.log("Peer connections:", peerConnectionsRef.current);
//     Object.entries(peerConnectionsRef.current).forEach(([socketId, pc]) => {
//       console.log(`Peer ${socketId} state:`, pc.connectionState, pc.iceConnectionState);
//     });

//     // Log audio elements
//     const audioElements = document.querySelectorAll('audio');
//     console.log(`Found ${audioElements.length} audio elements:`, audioElements);

//     // Force reconnect all peers
//     if (confirm("Do you want to try reconnecting to all peers?")) {
//       console.log("Reconnecting to all peers...");

//       // Close existing connections
//       Object.keys(peerConnectionsRef.current).forEach(socketId => {
//         removePeer(socketId);
//       });

//       // Rejoin room
//       socketRef.current.emit("join-room", roomId);
//     }
//   };

//   // Handle user leaving the room
//   const handleLeaveRoom = async () => {
//     const token = localStorage.getItem("authToken");
//     const user = JSON.parse(sessionStorage.getItem("user"));

//     if (!token || !user?._id) {
//       alert("Authentication required to leave room");
//       return;
//     }

//     try {
//       const response = await fetch(`http://localhost:5000/api/room/leave-room/${roomId}`, {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ userId: user._id }),
//       });

//       if (!response.ok) throw new Error("Failed to leave room");

//       // Clean up resources before navigating
//       cleanupResources();

//       alert("You have left the room successfully");
//       navigate("/");
//     } catch (err) {
//       alert("Error: " + err.message);
//     }
//   };

//   if (loading) return <p>Loading room details...</p>;
//   if (error) return <p>Error: {error}</p>;

//   return (
//     <div className="room-container">
//       <h2 className="room-title">{room?.name} Participants</h2>

//       <div className="room-controls">
//         <button onClick={handleLeaveRoom} className="leave-btn">Leave Room</button>
//         <button onClick={toggleMute} className="mute-btn">
//           {muted ? "Unmute Microphone" : "Mute Microphone"}
//         </button>
//         <button onClick={debugAudio} className="debug-btn">Debug Audio</button>
//       </div>

//       <div className="connection-status">
//         <p>Your connection: {connected ? "Connected" : "Disconnected"}</p>
//         <p>Active peers: {Object.keys(peers).length}</p>
//         <p>Local audio: {debugInfo.localTracks > 0 ? "Available" : "Not available"}</p>
//         <p>Remote streams: {debugInfo.remoteStreams}</p>
//       </div>

//       <div className="participants-grid">
//         {room?.participants.map((participant) => (
//           <div key={participant.userId._id} className="participant-card">
//             <img
//               src={participant.userId.profileImage || "/default-profile.png"}
//               alt={participant.userId.fullname}
//               className="profile-pic"
//             />
//             <p className="participant-name">{participant.userId.fullname}</p>
//             {JSON.parse(sessionStorage.getItem("user"))?._id === participant.userId._id && (
//               <span className="audio-status">{muted ? "🔇 Muted" : "🎤 Speaking"}</span>
//             )}
//           </div>
//         ))}
//       </div>

//       {/* Audio elements container */}
//       <div style={{ marginTop: "20px" }}>
//         <p>Debug: Audio Elements</p>
//         <div id="visible-audio-container" style={{ padding: "10px", border: "1px solid #ccc" }}>
//           {/* This will be populated with clones of the audio elements for debugging */}
//           {Array.from({ length: debugInfo.remoteStreams }).map((_, i) => (
//             <div key={i} style={{ margin: "5px 0" }}>
//               Remote Audio Stream {i+1} (should be playing)
//             </div>
//           ))}
//           {debugInfo.remoteStreams === 0 && <p>No remote audio streams detected</p>}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Room;


















// import { useEffect, useState, useRef } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import io from "socket.io-client";

// const Room = () => {
//   const { id: roomId } = useParams();
//   const navigate = useNavigate();
//   const [room, setRoom] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [peers, setPeers] = useState({});
//   const [muted, setMuted] = useState(false);
//   const [connected, setConnected] = useState(false);
//   const [screenSharingPeers, setScreenSharingPeers] = useState({});
//   const [isScreenSharing, setIsScreenSharing] = useState(false);

//   const socketRef = useRef(null);
//   const localStreamRef = useRef(null);
//   const screenStreamRef = useRef(null);
//   const audioContainerRef = useRef(null);
//   const peerConnectionsRef = useRef({});
//   const screenPeerConnectionsRef = useRef({});
//   const socketToUserMap = useRef({});

//   // Debug state to show in UI
//   const [debugInfo, setDebugInfo] = useState({
//     activePeers: 0,
//     remoteStreams: 0,
//     localTracks: 0,
//     socketConnected: false,
//     screenSharesActive: 0
//   });

//   useEffect(() => {
//     // Create audio container
//     audioContainerRef.current = document.createElement("div");
//     audioContainerRef.current.id = "audio-container";
//     audioContainerRef.current.style.display = "none";
//     document.body.appendChild(audioContainerRef.current);

//     const token = localStorage.getItem("authToken");
//     const user = JSON.parse(sessionStorage.getItem("user"));

//     if (!user?._id) {
//       setError("User authentication required");
//       setLoading(false);
//       return;
//     }

//     // Initialize socket connection
//     socketRef.current = io("https://devconnect-backend-6opy.onrender.com", {
//       auth: { userId: user._id },
//       reconnection: true,
//       reconnectionAttempts: 5,
//       reconnectionDelay: 1000,
//     });

//     // Handle socket connection status
//     socketRef.current.on("connect", () => {
//       console.log("Socket connected:", socketRef.current.id);
//       setConnected(true);
//       setDebugInfo(prev => ({ ...prev, socketConnected: true }));

//       // Once connected, get media and join room
//       initializeLocalStream();
//     });

//     socketRef.current.on("connect_error", (err) => {
//       console.error("Socket connection error:", err.message);
//       setError(`Socket connection error: ${err.message}`);
//     });

//     socketRef.current.on("disconnect", (reason) => {
//       console.log("Socket disconnected:", reason);
//       setConnected(false);
//       setDebugInfo(prev => ({ ...prev, socketConnected: false }));
//     });

//     // Fetch room details
//     fetchRoomDetails(token, roomId);

//     // Cleanup on component unmount
//     return () => {
//       cleanupResources();
//     };
//   }, [roomId]);

//   // Function to get user media and join room
//   const initializeLocalStream = async () => {
//     try {
//       console.log("Getting user media...");
//       const stream = await navigator.mediaDevices.getUserMedia({
//         audio: {
//           echoCancellation: true,
//           noiseSuppression: true,
//           autoGainControl: true,
//         },
//         video: false
//       });

//       console.log("🎤 Local audio track acquired:", stream.getAudioTracks());
//       localStreamRef.current = stream;
//       setDebugInfo(prev => ({ ...prev, localTracks: stream.getAudioTracks().length }));

//       // Create local audio preview
//       const localAudio = document.createElement("audio");
//       localAudio.id = "local-audio-preview";
//       localAudio.srcObject = stream;
//       localAudio.muted = true; // Prevent feedback
//       localAudio.autoplay = true;
//       audioContainerRef.current.appendChild(localAudio);

//       // Set up socket event listeners
//       setupSocketEvents();

//       // Join the room now that we have local media
//       console.log("Emitting join-room event for room:", roomId);
//       socketRef.current.emit("join-room", roomId);
//     } catch (err) {
//       console.error("Error accessing microphone:", err);
//       setError(`Microphone access failed: ${err.message}`);
//     }
//   };

//   // Setup socket event listeners for WebRTC signaling
//   const setupSocketEvents = () => {
//     // Handle users already in the room
//     socketRef.current.on("all-users", (users) => {
//       console.log(`📋 ${users.length} users already in room:`, users);
//       Object.keys(peerConnectionsRef.current).forEach(removePeer);

//       users.forEach((socketId) => {
//         addPeer(socketId, true);
//       });

//       // Update debug info
//       setDebugInfo(prev => ({ ...prev, activePeers: users.length }));
//     });

//     // Handle new user joining
//     socketRef.current.on("user-joined", (socketId) => {
//       console.log("👋 New user joined:", socketId);
//       addPeer(socketId, false);
//       setDebugInfo(prev => ({ ...prev, activePeers: prev.activePeers + 1 }));
//     });

//     // Handle WebRTC offer
//     socketRef.current.on("offer", async ({ sender, offer }) => {
//       console.log("📥 Received offer from:", sender);
//       try {
//         // Create peer connection if it doesn't exist
//         if (!peerConnectionsRef.current[sender]) {
//           addPeer(sender, false);
//         }

//         const pc = peerConnectionsRef.current[sender];

//         // Set remote description (offer)
//         await pc.setRemoteDescription(new RTCSessionDescription(offer));

//         // Create answer
//         const answer = await pc.createAnswer();
//         await pc.setLocalDescription(answer);

//         // Send answer back
//         console.log("Sending answer to:", sender);
//         socketRef.current.emit("answer", {
//           target: sender,
//           answer: pc.localDescription
//         });
//       } catch (err) {
//         console.error("Error handling offer:", err);
//       }
//     });

//     // Handle WebRTC answer
//     socketRef.current.on("answer", async ({ sender, answer }) => {
//       console.log("📤 Received answer from:", sender);
//       try {
//         const pc = peerConnectionsRef.current[sender];
//         if (pc) {
//           await pc.setRemoteDescription(new RTCSessionDescription(answer));
//         } else {
//           console.warn("Received answer for unknown peer:", sender);
//         }
//       } catch (err) {
//         console.error("Error handling answer:", err);
//       }
//     });

//     // Handle ICE candidates
//     socketRef.current.on("ice-candidate", ({ sender, candidate }) => {
//       console.log("❄️ Received ICE candidate from:", sender);
//       try {
//         const pc = peerConnectionsRef.current[sender];
//         if (pc) {
//           pc.addIceCandidate(new RTCIceCandidate(candidate))
//             .catch(e => console.error("Failed to add ICE candidate:", e));
//         }
//       } catch (err) {
//         console.error("Error handling ICE candidate:", err);
//       }
//     });

//     // Handle user leaving
//     socketRef.current.on("user-left", (socketId) => {
//       console.log("👋 User left:", socketId);
//       removePeer(socketId);
//       setDebugInfo(prev => ({ ...prev, activePeers: Math.max(0, prev.activePeers - 1) }));
//     });

//     // Handle errors from server
//     socketRef.current.on("error", (errorData) => {
//       console.error("Server error:", errorData);
//       setError(`Server error: ${errorData.message}`);
//     });

//     // Handle user ID mappings
//     socketRef.current.on("user-socket-map", (mappings) => {
//       console.log("Received user-socket map:", mappings);
//       socketToUserMap.current = mappings;
//     });

//     // Handle screen sharing started
//     socketRef.current.on("user-screen-sharing-started", ({ socketId, userId }) => {
//       console.log(`User ${userId} started screen sharing`);
//       handleIncomingScreenShare(socketId, userId);
//     });

//     // Handle screen sharing stopped
//     socketRef.current.on("user-screen-sharing-stopped", ({ userId }) => {
//       console.log(`User ${userId} stopped screen sharing`);
//       handlePeerStoppedScreenShare(userId);
//     });

//     // Handle screen share offer
//     socketRef.current.on("screen-offer", async ({ sender, offer }) => {
//       console.log("📥 Received screen share offer from:", sender);
//       try {
//         // Create peer connection if it doesn't exist
//         const peerConnection = new RTCPeerConnection({
//           iceServers: [
//             { urls: 'stun:stun.l.google.com:19302' },
//             { urls: 'stun:stun1.google.com:19302' },
//             { urls: 'stun:stun2.l.google.com:19302' },
//           ]
//         });

//         // Set up track handler for incoming video
//         peerConnection.ontrack = (event) => {
//           console.log("🎬 Received screen share track from:", sender);

//           if (event.streams && event.streams[0]) {
//             const remoteStream = event.streams[0];
//             const userId = socketToUserMap.current[sender];

//             if (!userId) {
//               console.error("Cannot find user ID for socket:", sender);
//               return;
//             }

//             // Create or update video element
//             let videoEl = document.getElementById(`screen-${userId}`);
//             if (!videoEl) {
//               videoEl = document.createElement("video");
//               videoEl.id = `screen-${userId}`;
//               videoEl.autoplay = true;
//               videoEl.className = "w-full border border-gray-800";

//               // Find the screen share container for this user
//               const container = document.getElementById(`screen-container-${userId}`);
//               if (container) {
//                 container.appendChild(videoEl);
//                 container.style.display = "block";
//               } else {
//                 console.error("No screen container found for user:", userId);
//               }
//             }

//             // Set the stream as source and play
//             videoEl.srcObject = remoteStream;
//             videoEl.play().catch(err => {
//               console.error("Failed to play screen share:", err);
//             });
//           }
//         };

//         // Set up ICE candidate handler
//         peerConnection.onicecandidate = (event) => {
//           if (event.candidate) {
//             console.log("Generated ICE candidate for screen share:", sender);
//             socketRef.current.emit("screen-ice-candidate", {
//               target: sender,
//               candidate: event.candidate,
//             });
//           }
//         };

//         // Set remote description (offer)
//         await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

//         // Create answer
//         const answer = await peerConnection.createAnswer();
//         await peerConnection.setLocalDescription(answer);

//         // Send answer back
//         console.log("Sending screen share answer to:", sender);
//         socketRef.current.emit("screen-answer", {
//           target: sender,
//           answer: peerConnection.localDescription
//         });

//         // Store the connection
//         screenPeerConnectionsRef.current[sender] = peerConnection;

//       } catch (err) {
//         console.error("Error handling screen share offer:", err);
//       }
//     });

//     // Handle screen share answer
//     socketRef.current.on("screen-answer", async ({ sender, answer }) => {
//       console.log("📤 Received screen share answer from:", sender);
//       try {
//         const pc = screenPeerConnectionsRef.current[sender];
//         if (pc) {
//           await pc.setRemoteDescription(new RTCSessionDescription(answer));
//         } else {
//           console.warn("Received screen share answer for unknown peer:", sender);
//         }
//       } catch (err) {
//         console.error("Error handling screen share answer:", err);
//       }
//     });

//     // Handle screen share ICE candidates
//     socketRef.current.on("screen-ice-candidate", ({ sender, candidate }) => {
//       console.log("❄️ Received screen share ICE candidate from:", sender);
//       try {
//         const pc = screenPeerConnectionsRef.current[sender];
//         if (pc) {
//           pc.addIceCandidate(new RTCIceCandidate(candidate))
//             .catch(e => console.error("Failed to add screen share ICE candidate:", e));
//         }
//       } catch (err) {
//         console.error("Error handling screen share ICE candidate:", err);
//       }
//     });
//   };

//   // Create and setup a new peer connection
//   const addPeer = (socketId, isInitiator) => {
//     console.log(`Creating ${isInitiator ? 'initiator' : 'receiver'} peer connection for ${socketId}`);

//     // Check if we already have a connection
//     if (peerConnectionsRef.current[socketId]) {
//       console.log("Connection already exists for:", socketId);
//       return;
//     }

//     // Create new RTCPeerConnection with STUN/TURN servers
//     const peerConnection = new RTCPeerConnection({
//       iceServers: [
//         { urls: 'stun:stun.l.google.com:19302' },
//         { urls: 'stun:stun1.l.google.com:19302' },
//         { urls: 'stun:stun2.l.google.com:19302' },
//         // Add TURN servers in production for better NAT traversal
//       ]
//     });

//     // Add local audio tracks to the connection
//     if (localStreamRef.current) {
//       localStreamRef.current.getAudioTracks().forEach(track => {
//         console.log("Adding track to peer connection:", track.id);
//         peerConnection.addTrack(track, localStreamRef.current);
//       });
//     } else {
//       console.error("No local stream available when creating peer connection!");
//     }

//     // Set up ICE candidate handler
//     peerConnection.onicecandidate = (event) => {
//       if (event.candidate) {
//         console.log("Generated ICE candidate for:", socketId);
//         socketRef.current.emit("ice-candidate", {
//           target: socketId,
//           candidate: event.candidate,
//         });
//       }
//     };

//     // Set up track handler for incoming audio
//     peerConnection.ontrack = (event) => {
//       console.log("🔊 Received track from:", socketId, event.streams);

//       if (event.streams && event.streams[0]) {
//         const remoteStream = event.streams[0];

//         // Debug remote track info
//         remoteStream.getAudioTracks().forEach(track => {
//           console.log(`Remote track ${track.id} enabled:`, track.enabled);
//         });

//         // Create or update audio element
//         let audioEl = document.getElementById(`audio-${socketId}`);
//         if (!audioEl) {
//           audioEl = document.createElement("audio");
//           audioEl.id = `audio-${socketId}`;
//           audioEl.autoplay = true;
//           audioEl.controls = true; // Helpful for debugging
//           audioContainerRef.current.appendChild(audioEl);
//         }

//         // Set the stream as source and play
//         audioEl.srcObject = remoteStream;
//         audioEl.play().catch(err => {
//           console.error("Failed to play audio:", err);
//         });

//         // Update debug counters
//         setDebugInfo(prev => ({
//           ...prev,
//           remoteStreams: prev.remoteStreams + 1
//         }));
//       }
//     };

//     // Monitor connection state
//     peerConnection.oniceconnectionstatechange = () => {
//       console.log(`ICE state (${socketId}):`, peerConnection.iceConnectionState);

//       // If failed, try to restart ICE
//       if (peerConnection.iceConnectionState === 'failed') {
//         console.log("Attempting to restart ICE for:", socketId);
//         peerConnection.restartIce();
//       }
//     };

//     peerConnection.onconnectionstatechange = () => {
//       console.log(`Connection state (${socketId}):`, peerConnection.connectionState);
//     };

//     // If we're the initiator, create and send offer
//     if (isInitiator) {
//       console.log("Creating offer as initiator for:", socketId);
//       peerConnection.createOffer({
//         offerToReceiveAudio: true,
//         voiceActivityDetection: false
//       }).then(offer => {
//         return peerConnection.setLocalDescription(offer);
//       }).then(() => {
//         console.log("Sending offer to:", socketId);
//         socketRef.current.emit("offer", {
//           target: socketId,
//           offer: peerConnection.localDescription
//         });
//       }).catch(err => {
//         console.error("Error creating offer:", err);
//       });
//     }

//     // Store the connection
//     peerConnectionsRef.current[socketId] = peerConnection;
//     setPeers(prev => ({ ...prev, [socketId]: peerConnection }));
//   };

//   // Remove and cleanup a peer connection
//   const removePeer = (socketId) => {
//     const pc = peerConnectionsRef.current[socketId];
//     if (pc) {
//       pc.close();

//       // Remove audio element
//       const audioEl = document.getElementById(`audio-${socketId}`);
//       if (audioEl) {
//         audioEl.srcObject = null;
//         audioEl.remove();
//       }

//       // Remove from refs and state
//       delete peerConnectionsRef.current[socketId];
//       setPeers(prev => {
//         const updated = { ...prev };
//         delete updated[socketId];
//         return updated;
//       });

//       console.log("Peer connection closed and removed:", socketId);
//     }
//   };

//   // Function to start sharing screen
//   const startScreenShare = async () => {
//     try {
//       // Check if already sharing
//       if (isScreenSharing) {
//         alert("You're already sharing your screen");
//         return;
//       }

//       console.log("Getting screen media...");
//       const stream = await navigator.mediaDevices.getDisplayMedia({
//         video: true,
//         audio: false // Screen share without audio for simplicity
//       });

//       // Handle user canceling the screen share dialog
//       stream.getVideoTracks()[0].onended = () => {
//         stopScreenShare();
//       };

//       screenStreamRef.current = stream;
//       setIsScreenSharing(true);

//       // Inform others that we're sharing screen
//       socketRef.current.emit("screen-sharing-started", roomId);

//       // Create connections for screen sharing to all peers
//       Object.keys(peerConnectionsRef.current).forEach((socketId) => {
//         createScreenShareConnection(socketId);
//       });

//       // Update UI
//       const user = JSON.parse(sessionStorage.getItem("user"));
//       if (user) {
//         setScreenSharingPeers(prev => ({
//           ...prev,
//           [user._id]: true
//         }));
//       }

//     } catch (err) {
//       console.error("Error starting screen share:", err);
//       alert(`Screen sharing failed: ${err.message}`);
//     }
//   };

//   // Function to stop sharing screen
//   const stopScreenShare = () => {
//     if (!isScreenSharing || !screenStreamRef.current) return;

//     // Stop all tracks
//     screenStreamRef.current.getTracks().forEach(track => {
//       track.stop();
//     });

//     // Close all screen sharing peer connections
//     Object.keys(screenSharingPeers).forEach(userId => {
//       const socketId = Object.keys(peerConnectionsRef.current).find(
//         id => socketToUserMap.current[id] === userId
//       );
//       if (socketId && screenPeerConnectionsRef.current[socketId]) {
//         screenPeerConnectionsRef.current[socketId].close();
//         delete screenPeerConnectionsRef.current[socketId];
//       }
//     });

//     // Reset state
//     screenStreamRef.current = null;
//     setIsScreenSharing(false);

//     // Inform others we stopped sharing
//     socketRef.current.emit("screen-sharing-stopped", roomId);

//     // Update UI
//     const user = JSON.parse(sessionStorage.getItem("user"));
//     if (user) {
//       setScreenSharingPeers(prev => {
//         const updated = { ...prev };
//         delete updated[user._id];
//         return updated;
//       });
//     }
//   };

//   // Function to create a peer connection for screen sharing
//   const createScreenShareConnection = (socketId) => {
//     console.log(`Creating screen share connection for ${socketId}`);

//     // Create new RTCPeerConnection with STUN/TURN servers
//     const peerConnection = new RTCPeerConnection({
//       iceServers: [
//         { urls: 'stun:stun.l.google.com:19302' },
//         { urls: 'stun:stun1.google.com:19302' },
//         { urls: 'stun:stun2.l.google.com:19302' },
//       ]
//     });

//     // Add screen track to the connection
//     if (screenStreamRef.current) {
//       screenStreamRef.current.getTracks().forEach(track => {
//         console.log("Adding screen track to peer connection:", track.id);
//         peerConnection.addTrack(track, screenStreamRef.current);
//       });
//     } else {
//       console.error("No screen stream available when creating peer connection!");
//       return;
//     }

//     // Set up ICE candidate handler
//     peerConnection.onicecandidate = (event) => {
//       if (event.candidate) {
//         console.log("Generated ICE candidate for screen share:", socketId);
//         socketRef.current.emit("screen-ice-candidate", {
//           target: socketId,
//           candidate: event.candidate,
//         });
//       }
//     };

//     // Monitor connection state
//     peerConnection.oniceconnectionstatechange = () => {
//       console.log(`Screen ICE state (${socketId}):`, peerConnection.iceConnectionState);
//     };

//     peerConnection.onconnectionstatechange = () => {
//       console.log(`Screen Connection state (${socketId}):`, peerConnection.connectionState);
//     };

//     // Create and send offer
//     console.log("Creating screen share offer for:", socketId);
//     peerConnection.createOffer().then(offer => {
//       return peerConnection.setLocalDescription(offer);
//     }).then(() => {
//       console.log("Sending screen share offer to:", socketId);
//       socketRef.current.emit("screen-offer", {
//         target: socketId,
//         offer: peerConnection.localDescription
//       });
//     }).catch(err => {
//       console.error("Error creating screen share offer:", err);
//     });

//     // Store the connection
//     screenPeerConnectionsRef.current[socketId] = peerConnection;
//   };

//   // Function to handle receiving a screen share
//   const handleIncomingScreenShare = (socketId, userId) => {
//     setScreenSharingPeers(prev => ({
//       ...prev,
//       [userId]: true
//     }));

//     setDebugInfo(prev => ({
//       ...prev,
//       screenSharesActive: prev.screenSharesActive + 1
//     }));
//   };

//   // Function to handle a peer stopping screen share
//   const handlePeerStoppedScreenShare = (userId) => {
//     setScreenSharingPeers(prev => {
//       const updated = { ...prev };
//       delete updated[userId];
//       return updated;
//     });

//     setDebugInfo(prev => ({
//       ...prev,
//       screenSharesActive: Math.max(0, prev.screenSharesActive - 1)
//     }));

//     // Remove video element if it exists
//     const videoEl = document.getElementById(`screen-${userId}`);
//     if (videoEl) {
//       videoEl.srcObject = null;
//       videoEl.remove();
//     }
//   };

//   // Fetch room details from server
//   const fetchRoomDetails = async (token, roomId) => {
//     try {
//       const response = await fetch(`https://devconnect-backend-6opy.onrender.com/api/get-room/${roomId}`, {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) throw new Error("Failed to fetch room");

//       const data = await response.json();
//       setRoom(data);
//       console.log(data)
//       setLoading(false);
//     } catch (err) {
//       console.error("Error fetching room:", err);
//       setError(err.message);
//       setLoading(false);
//     }
//   };

//   // Clean up all resources on unmount
//   const cleanupResources = () => {
//     console.log("Cleaning up WebRTC resources...");
//     // Close all peer connections
//     Object.keys(peerConnectionsRef.current).forEach(socketId => {
//       peerConnectionsRef.current[socketId].close();
//     });
//     peerConnectionsRef.current = {};

//     // Stop all media tracks
//     if (localStreamRef.current) {
//       localStreamRef.current.getTracks().forEach(track => {
//         track.stop();
//       });
//       localStreamRef.current = null;
//     }

//     // Stop screen sharing if active
//     if (isScreenSharing && screenStreamRef.current) {
//       screenStreamRef.current.getTracks().forEach(track => {
//         track.stop();
//       });
//       screenStreamRef.current = null;
//     }

//     // Close all screen sharing peer connections
//     Object.keys(screenPeerConnectionsRef.current).forEach(socketId => {
//       screenPeerConnectionsRef.current[socketId].close();
//     });
//     screenPeerConnectionsRef.current = {};

//     // Reset screen sharing state
//     setIsScreenSharing(false);
//     setScreenSharingPeers({});

//     // Remove audio container
//     if (audioContainerRef.current) {
//       while (audioContainerRef.current.firstChild) {
//         audioContainerRef.current.removeChild(audioContainerRef.current.firstChild);
//       }
//       document.body.removeChild(audioContainerRef.current);
//       audioContainerRef.current = null;
//     }

//     // Disconnect socket
//     if (socketRef.current) {
//       socketRef.current.disconnect();
//       socketRef.current = null;
//     }
//   };

//   // Toggle microphone mute state
//   const toggleMute = () => {
//     if (localStreamRef.current) {
//       const audioTracks = localStreamRef.current.getAudioTracks();
//       audioTracks.forEach(track => {
//         track.enabled = !track.enabled;
//         console.log(`Microphone ${track.enabled ? 'unmuted' : 'muted'}`);
//       });
//       setMuted(prev => !prev);
//     }
//   };

//   // Debug audio connections
//   const debugAudio = () => {
//     // Log local stream status
//     console.log("Local stream:", localStreamRef.current);
//     if (localStreamRef.current) {
//       const tracks = localStreamRef.current.getAudioTracks();
//       console.log("Local audio tracks:", tracks);
//       tracks.forEach(track => {
//         console.log(`Track ${track.id} enabled:`, track.enabled);
//       });
//     }

//     // Log peer connections
//     console.log("Peer connections:", peerConnectionsRef.current);
//     Object.entries(peerConnectionsRef.current).forEach(([socketId, pc]) => {
//       console.log(`Peer ${socketId} state:`, pc.connectionState, pc.iceConnectionState);
//     });

//     // Log audio elements
//     const audioElements = document.querySelectorAll('audio');
//     console.log(`Found ${audioElements.length} audio elements:`, audioElements);

//     // Force reconnect all peers
//     if (confirm("Do you want to try reconnecting to all peers?")) {
//       console.log("Reconnecting to all peers...");

//       // Close existing connections
//       Object.keys(peerConnectionsRef.current).forEach(socketId => {
//         removePeer(socketId);
//       });

//       // Rejoin room
//       socketRef.current.emit("join-room", roomId);
//     }
//   };

//   // Handle user leaving the room
//   const handleLeaveRoom = async () => {
//     const token = localStorage.getItem("authToken");
//     const user = JSON.parse(sessionStorage.getItem("user"));

//     if (!token || !user?._id) {
//       alert("Authentication required to leave room");
//       return;
//     }

//     try {
//       const response = await fetch(`https://devconnect-backend-6opy.onrender.com/api/room/leave-room/${roomId}`, {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ userId: user._id }),
//       });

//       if (!response.ok) throw new Error("Failed to leave room");

//       // Clean up resources before navigating
//       cleanupResources();

//       alert("You have left the room successfully");
//       navigate("/");
//     } catch (err) {
//       alert("Error: " + err.message);
//     }
//   };

//   if (loading) return <p className="p-4 text-center">Loading room details...</p>;
//   if (error) return <p className="p-4 text-center text-red-500">Error: {error}</p>;

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col items-center p-6">
//       <div className="w-full max-w-6xl">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
//             {room?.name} 
//           </h2>
//           <div className="flex items-center gap-2">
//             <span className={`inline-flex h-3 w-3 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}></span>
//             <span className="text-sm text-gray-300">{connected ? "Connected" : "Disconnected"}</span>
//             <span className="ml-4 px-3 py-1 bg-gray-700 rounded-full text-sm">
//               {Object.keys(peers).length} active
//             </span>
//           </div>
//         </div>
        
//         {/* Main Content Area */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Left: Participants List */}
//           <div className="lg:col-span-1 bg-gray-800 bg-opacity-50 rounded-xl shadow-lg overflow-hidden border border-gray-700">
//             <div className="p-4 bg-gray-800 border-b border-gray-700">
//               <h3 className="font-semibold text-xl">Participants</h3>
//             </div>
//             <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
//               {room?.participants.map((participant) => {
//                 const currentUser = JSON.parse(sessionStorage.getItem("user"));
//                 const isCurrentUser = currentUser && participant.userId &&
//                 console.log(currentUser._id)
//                   currentUser._id.toString() === participant.userId._id.toString();
//                 const isSharing = screenSharingPeers[participant.userId._id];
  
//                 return (
//                   <div key={participant.userId._id} 
//                     className="flex items-center p-3 rounded-lg bg-gray-800 bg-opacity-70 hover:bg-gray-700 transition">
//                     <div className="relative">
//                       <img
//                         src={participant.userId.profileImage || "/default-profile.png"}
//                         alt={participant.userId.fullname}
//                         className="w-12 h-12 rounded-full border-2 border-gray-600 object-cover"
//                       />
//                       {isCurrentUser && (
//                         <span className={`absolute -top-1 -right-1 h-4 w-4 rounded-full ${muted ? "bg-red-500" : "bg-green-500"} border-2 border-gray-800`}></span>
//                       )}
//                     </div>
                    
//                     <div className="ml-3 flex-1">
//                       <p className="font-medium">{participant.userId.fullname}</p>
//                       <div className="flex items-center text-xs text-gray-400 mt-1">
//                         {isSharing && (
//                           <span className="flex items-center mr-2">
//                             <span className="mr-1">🖥️</span> Sharing
//                           </span>
//                         )}
//                         {isCurrentUser && <span className="text-blue-400">You</span>}
//                       </div>
//                     </div>
                    
//                     {isCurrentUser && (
//                       <button
//                         onClick={isScreenSharing ? stopScreenShare : startScreenShare}
//                         className="text-xs px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 transition"
//                       >
//                         {isScreenSharing ? "Stop Share" : "Share"}
//                       </button>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
          
//           {/* Right: Screen Shares and Controls */}
//           <div className="lg:col-span-2 space-y-6">
//             {/* Screen Shares */}
//             <div className="bg-gray-800 bg-opacity-50 rounded-xl shadow-lg overflow-hidden border border-gray-700">
//               <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
//                 <h3 className="font-semibold text-xl">Active Shares</h3>
//                 <span className="px-3 py-1 bg-gray-700 rounded-full text-xs">
//                   {Object.keys(screenSharingPeers).length} active
//                 </span>
//               </div>
              
//               <div className="p-4">
//                 {Object.keys(screenSharingPeers).length > 0 ? (
//                   <div className="grid grid-cols-1 gap-4">
//                     {Object.keys(screenSharingPeers).map(userId => {
//                       const participant = room?.participants.find(p => p.userId._id === userId);
//                       return (
//                         <div key={userId} className="bg-gray-900 rounded-lg overflow-hidden">
//                           <div className="p-2 bg-gray-800 text-sm flex items-center">
//                             <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
//                             <p>{participant?.userId.fullname || "Unknown user"}'s Screen</p>
//                           </div>
//                           <div id={`screen-container-${userId}`} className="aspect-video bg-black rounded-b-lg">
//                             {/* Screen share video will be inserted here */}
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 ) : (
//                   <div className="text-center py-12 text-gray-400">
//                     <div className="text-4xl mb-2">🖥️</div>
//                     <p>No active screen shares</p>
//                     <p className="text-sm mt-2">Click "Share" next to your name to start sharing</p>
//                   </div>
//                 )}
//               </div>
//             </div>
            
//             {/* Controls and Debug */}
//             <div className="bg-gray-800 bg-opacity-50 rounded-xl shadow-lg overflow-hidden border border-gray-700">
//               <div className="p-4 bg-gray-800 border-b border-gray-700">
//                 <h3 className="font-semibold text-xl">Controls</h3>
//               </div>
              
//               <div className="p-6">
//                 <div className="flex flex-wrap gap-3 mb-6">
//                   <button
//                     onClick={toggleMute}
//                     className={`flex items-center px-4 py-2 rounded-lg font-medium shadow-md transition ${
//                       muted 
//                         ? "bg-gray-700 hover:bg-gray-600" 
//                         : "bg-green-600 hover:bg-green-700"
//                     }`}
//                   >
//                     <span className="mr-2">{muted ? "🔇" : "🎤"}</span>
//                     {muted ? "Unmute" : "Mute"}
//                   </button>
                  
//                   <button
//                     onClick={handleLeaveRoom}
//                     className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium shadow-md transition ml-auto"
//                   >
//                     <span className="mr-2">👋</span>
//                     Leave Room
//                   </button>
//                 </div>
                
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//                   <div className="bg-gray-900 p-3 rounded-lg">
//                     <h4 className="font-medium mb-2">Connection Status</h4>
//                     <div className="space-y-1">
//                       <p>Local Audio: <span className={debugInfo.localTracks > 0 ? "text-green-400" : "text-red-400"}>
//                         {debugInfo.localTracks > 0 ? "Available" : "Not Available"}
//                      </span> </p>
//                     </div>
//                   </div>
                  
                  
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Room;





import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";

const Room = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [peers, setPeers] = useState({});
  const [muted, setMuted] = useState(false);
  const [connected, setConnected] = useState(false);
  const [screenSharingPeers, setScreenSharingPeers] = useState({});
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  // New state for socket-based participants
  const [connectedParticipants, setConnectedParticipants] = useState([]);
  const [localUser, setLocalUser] = useState(null);

  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const audioContainerRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const screenPeerConnectionsRef = useRef({});
  const socketToUserMap = useRef({});

  // Debug state to show in UI
  const [debugInfo, setDebugInfo] = useState({
    activePeers: 0,
    remoteStreams: 0,
    localTracks: 0,
    socketConnected: false,
    screenSharesActive: 0
  });

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

    // Add yourself to participants list immediately
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

    // Handle socket connection status
    socketRef.current.on("connect", () => {
      console.log("Socket connected:", socketRef.current.id);
      setConnected(true);
      setDebugInfo(prev => ({ ...prev, socketConnected: true }));

      // Once connected, get media and join room
      initializeLocalStream();
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      setError(`Socket connection error: ${err.message}`);
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setConnected(false);
      setDebugInfo(prev => ({ ...prev, socketConnected: false }));
    });

    // Fetch room name for display purposes
    if (token && roomId) {
      fetchRoomDetails(token, roomId);
    } else {
      setLoading(false);
    }

    // Cleanup on component unmount
    return () => {
      cleanupResources();
    };
  }, [roomId]);

  // Function to get user media and join room
  const initializeLocalStream = async () => {
    try {
      console.log("Getting user media...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false
      });

      console.log("🎤 Local audio track acquired:", stream.getAudioTracks());
      localStreamRef.current = stream;
      setDebugInfo(prev => ({ ...prev, localTracks: stream.getAudioTracks().length }));

      // Create local audio preview
      const localAudio = document.createElement("audio");
      localAudio.id = "local-audio-preview";
      localAudio.srcObject = stream;
      localAudio.muted = true; // Prevent feedback
      localAudio.autoplay = true;
      audioContainerRef.current.appendChild(localAudio);

      // Set up socket event listeners
      setupSocketEvents();

      // Join the room now that we have local media
      console.log("Emitting join-room event for room:", roomId);
      socketRef.current.emit("join-room", roomId);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError(`Microphone access failed: ${err.message}`);
    }
  };

  // Setup socket event listeners for WebRTC signaling
  const setupSocketEvents = () => {
    // Handle users already in the room
    socketRef.current.on("all-users", (users) => {
      console.log(`📋 ${users.length} users already in room:`, users);
      Object.keys(peerConnectionsRef.current).forEach(removePeer);

      users.forEach((socketId) => {
        addPeer(socketId, true);
      });

      // Update participants list based on socket map
      const newParticipants = users.map(socketId => {
        const userId = socketToUserMap.current[socketId];
        return {
          socketId,
          userId: { 
            _id: userId, 
            fullname: userId ? `User ${userId.substring(0, 5)}` : `User ${socketId.substring(0, 5)}`,
            profileImage: null // Default or placeholder
          },
          isLocal: false
        };
      });
      
      // Keep local user in the list
      if (localUser) {
        setConnectedParticipants(prev => {
          // Filter out duplicates before adding new participants
          const filteredPrev = prev.filter(p => p.isLocal);
          return [...filteredPrev, ...newParticipants];
        });
      } else {
        setConnectedParticipants(newParticipants);
      }

      // Update debug info
      setDebugInfo(prev => ({ ...prev, activePeers: users.length }));
    });

    // Handle new user joining
    socketRef.current.on("user-joined", (socketId) => {
      console.log("👋 New user joined:", socketId);
      addPeer(socketId, false);
      
      // Add the new user to participants list
      const userId = socketToUserMap.current[socketId];
      setConnectedParticipants(prev => [
        ...prev,
        {
          socketId,
          userId: { 
            _id: userId, 
            fullname: userId ? `User ${userId.substring(0, 5)}` : `User ${socketId.substring(0, 5)}`,
            profileImage: null
          },
          isLocal: false
        }
      ]);
      
      setDebugInfo(prev => ({ ...prev, activePeers: prev.activePeers + 1 }));
    });

    // Handle user leaving
    socketRef.current.on("user-left", (socketId) => {
      console.log("👋 User left:", socketId);
      removePeer(socketId);
      
      // Remove the user from participants
      setConnectedParticipants(prev => 
        prev.filter(p => p.socketId !== socketId && !p.isLocal)
      );
      
      setDebugInfo(prev => ({ ...prev, activePeers: Math.max(0, prev.activePeers - 1) }));
    });

    // Handle WebRTC offer
    socketRef.current.on("offer", async ({ sender, offer }) => {
      console.log("📥 Received offer from:", sender);
      try {
        // Create peer connection if it doesn't exist
        if (!peerConnectionsRef.current[sender]) {
          addPeer(sender, false);
        }

        const pc = peerConnectionsRef.current[sender];

        // Set remote description (offer)
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Create answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // Send answer back
        console.log("Sending answer to:", sender);
        socketRef.current.emit("answer", {
          target: sender,
          answer: pc.localDescription
        });
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    });

    // Handle WebRTC answer
    socketRef.current.on("answer", async ({ sender, answer }) => {
      console.log("📤 Received answer from:", sender);
      try {
        const pc = peerConnectionsRef.current[sender];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } else {
          console.warn("Received answer for unknown peer:", sender);
        }
      } catch (err) {
        console.error("Error handling answer:", err);
      }
    });

    // Handle ICE candidates
    socketRef.current.on("ice-candidate", ({ sender, candidate }) => {
      console.log("❄️ Received ICE candidate from:", sender);
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

    // Handle user ID mappings
    socketRef.current.on("user-socket-map", (mappings) => {
      console.log("Received user-socket map:", mappings);
      socketToUserMap.current = mappings;
      
      // Update participant names based on the new mappings
      setConnectedParticipants(prev => {
        return prev.map(participant => {
          if (participant.socketId && mappings[participant.socketId]) {
            const userId = mappings[participant.socketId];
            return {
              ...participant,
              userId: {
                ...participant.userId,
                _id: userId,
                fullname: `User ${userId.substring(0, 5)}`
              }
            };
          }
          return participant;
        });
      });
    });

    // Handle screen sharing started
    socketRef.current.on("user-screen-sharing-started", ({ socketId, userId }) => {
      console.log(`User ${userId} started screen sharing`);
      handleIncomingScreenShare(socketId, userId);
    });

    // Handle screen sharing stopped
    socketRef.current.on("user-screen-sharing-stopped", ({ userId }) => {
      console.log(`User ${userId} stopped screen sharing`);
      handlePeerStoppedScreenShare(userId);
    });

    // Handle screen share offer
    socketRef.current.on("screen-offer", async ({ sender, offer }) => {
      console.log("📥 Received screen share offer from:", sender);
      try {
        // Create peer connection if it doesn't exist
        const peerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
          ]
        });

        // Set up track handler for incoming video
        peerConnection.ontrack = (event) => {
          console.log("🎬 Received screen share track from:", sender);

          if (event.streams && event.streams[0]) {
            const remoteStream = event.streams[0];
            const userId = socketToUserMap.current[sender];

            if (!userId) {
              console.error("Cannot find user ID for socket:", sender);
              return;
            }

            // Create or update video element
            let videoEl = document.getElementById(`screen-${userId}`);
            if (!videoEl) {
              videoEl = document.createElement("video");
              videoEl.id = `screen-${userId}`;
              videoEl.autoplay = true;
              videoEl.className = "w-full border border-gray-800";

              // Find the screen share container for this user
              const container = document.getElementById(`screen-container-${userId}`);
              if (container) {
                container.appendChild(videoEl);
                container.style.display = "block";
              } else {
                console.error("No screen container found for user:", userId);
                // Create a container if one doesn't exist
                const newContainer = document.createElement("div");
                newContainer.id = `screen-container-${userId}`;
                newContainer.className = "mt-2 bg-gray-900 rounded-lg";
                newContainer.appendChild(videoEl);
                
                const screensArea = document.getElementById("screens-area");
                if (screensArea) {
                  screensArea.appendChild(newContainer);
                } else {
                  document.body.appendChild(newContainer);
                }
              }
            }

            // Set the stream as source and play
            videoEl.srcObject = remoteStream;
            videoEl.play().catch(err => {
              console.error("Failed to play screen share:", err);
            });
          }
        };

        // Set up ICE candidate handler
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            console.log("Generated ICE candidate for screen share:", sender);
            socketRef.current.emit("screen-ice-candidate", {
              target: sender,
              candidate: event.candidate,
            });
          }
        };

        // Set remote description (offer)
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        // Create answer
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        // Send answer back
        console.log("Sending screen share answer to:", sender);
        socketRef.current.emit("screen-answer", {
          target: sender,
          answer: peerConnection.localDescription
        });

        // Store the connection
        screenPeerConnectionsRef.current[sender] = peerConnection;

      } catch (err) {
        console.error("Error handling screen share offer:", err);
      }
    });

    // Handle screen share answer
    socketRef.current.on("screen-answer", async ({ sender, answer }) => {
      console.log("📤 Received screen share answer from:", sender);
      try {
        const pc = screenPeerConnectionsRef.current[sender];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } else {
          console.warn("Received screen share answer for unknown peer:", sender);
        }
      } catch (err) {
        console.error("Error handling screen share answer:", err);
      }
    });

    // Handle screen share ICE candidates
    socketRef.current.on("screen-ice-candidate", ({ sender, candidate }) => {
      console.log("❄️ Received screen share ICE candidate from:", sender);
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

  // Create and setup a new peer connection
  const addPeer = (socketId, isInitiator) => {
    console.log(`Creating ${isInitiator ? 'initiator' : 'receiver'} peer connection for ${socketId}`);

    // Check if we already have a connection
    if (peerConnectionsRef.current[socketId]) {
      console.log("Connection already exists for:", socketId);
      return;
    }

    // Create new RTCPeerConnection with STUN/TURN servers
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        // Add TURN servers in production for better NAT traversal
      ]
    });

    // Add local audio tracks to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        console.log("Adding track to peer connection:", track.id);
        peerConnection.addTrack(track, localStreamRef.current);
      });
    } else {
      console.error("No local stream available when creating peer connection!");
    }

    // Set up ICE candidate handler
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Generated ICE candidate for:", socketId);
        socketRef.current.emit("ice-candidate", {
          target: socketId,
          candidate: event.candidate,
        });
      }
    };

    // Set up track handler for incoming audio
    peerConnection.ontrack = (event) => {
      console.log("🔊 Received track from:", socketId, event.streams);

      if (event.streams && event.streams[0]) {
        const remoteStream = event.streams[0];

        // Debug remote track info
        remoteStream.getAudioTracks().forEach(track => {
          console.log(`Remote track ${track.id} enabled:`, track.enabled);
        });

        // Create or update audio element
        let audioEl = document.getElementById(`audio-${socketId}`);
        if (!audioEl) {
          audioEl = document.createElement("audio");
          audioEl.id = `audio-${socketId}`;
          audioEl.autoplay = true;
          audioEl.controls = true; // Helpful for debugging
          audioContainerRef.current.appendChild(audioEl);
        }

        // Set the stream as source and play
        audioEl.srcObject = remoteStream;
        audioEl.play().catch(err => {
          console.error("Failed to play audio:", err);
        });

        // Update debug counters
        setDebugInfo(prev => ({
          ...prev,
          remoteStreams: prev.remoteStreams + 1
        }));
      }
    };

    // Monitor connection state
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE state (${socketId}):`, peerConnection.iceConnectionState);

      // If failed, try to restart ICE
      if (peerConnection.iceConnectionState === 'failed') {
        console.log("Attempting to restart ICE for:", socketId);
        peerConnection.restartIce();
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state (${socketId}):`, peerConnection.connectionState);
    };

    // If we're the initiator, create and send offer
    if (isInitiator) {
      console.log("Creating offer as initiator for:", socketId);
      peerConnection.createOffer({
        offerToReceiveAudio: true,
        voiceActivityDetection: false
      }).then(offer => {
        return peerConnection.setLocalDescription(offer);
      }).then(() => {
        console.log("Sending offer to:", socketId);
        socketRef.current.emit("offer", {
          target: socketId,
          offer: peerConnection.localDescription
        });
      }).catch(err => {
        console.error("Error creating offer:", err);
      });
    }

    // Store the connection
    peerConnectionsRef.current[socketId] = peerConnection;
    setPeers(prev => ({ ...prev, [socketId]: peerConnection }));
  };

  // Remove and cleanup a peer connection
  const removePeer = (socketId) => {
    const pc = peerConnectionsRef.current[socketId];
    if (pc) {
      pc.close();

      // Remove audio element
      const audioEl = document.getElementById(`audio-${socketId}`);
      if (audioEl) {
        audioEl.srcObject = null;
        audioEl.remove();
      }

      // Remove from refs and state
      delete peerConnectionsRef.current[socketId];
      setPeers(prev => {
        const updated = { ...prev };
        delete updated[socketId];
        return updated;
      });

      console.log("Peer connection closed and removed:", socketId);
    }
  };

  // Function to start sharing screen
  const startScreenShare = async () => {
    try {
      // Check if already sharing
      if (isScreenSharing) {
        alert("You're already sharing your screen");
        return;
      }

      console.log("Getting screen media...");
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false // Screen share without audio for simplicity
      });

      // Handle user canceling the screen share dialog
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      screenStreamRef.current = stream;
      setIsScreenSharing(true);

      // Inform others that we're sharing screen
      socketRef.current.emit("screen-sharing-started", roomId);

      // Create connections for screen sharing to all peers
      Object.keys(peerConnectionsRef.current).forEach((socketId) => {
        createScreenShareConnection(socketId);
      });

      // Update UI
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

  // Function to stop sharing screen
  const stopScreenShare = () => {
    if (!isScreenSharing || !screenStreamRef.current) return;

    // Stop all tracks
    screenStreamRef.current.getTracks().forEach(track => {
      track.stop();
    });

    // Close all screen sharing peer connections
    Object.keys(screenPeerConnectionsRef.current).forEach(socketId => {
      if (screenPeerConnectionsRef.current[socketId]) {
        screenPeerConnectionsRef.current[socketId].close();
        delete screenPeerConnectionsRef.current[socketId];
      }
    });

    // Reset state
    screenStreamRef.current = null;
    setIsScreenSharing(false);

    // Inform others we stopped sharing
    socketRef.current.emit("screen-sharing-stopped", roomId);

    // Update UI
    if (localUser) {
      setScreenSharingPeers(prev => {
        const updated = { ...prev };
        delete updated[localUser._id];
        return updated;
      });
    }
  };

  // Function to create a peer connection for screen sharing
  const createScreenShareConnection = (socketId) => {
    console.log(`Creating screen share connection for ${socketId}`);

    // Create new RTCPeerConnection with STUN/TURN servers
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ]
    });

    // Add screen track to the connection
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        console.log("Adding screen track to peer connection:", track.id);
        peerConnection.addTrack(track, screenStreamRef.current);
      });
    } else {
      console.error("No screen stream available when creating peer connection!");
      return;
    }

    // Set up ICE candidate handler
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Generated ICE candidate for screen share:", socketId);
        socketRef.current.emit("screen-ice-candidate", {
          target: socketId,
          candidate: event.candidate,
        });
      }
    };

    // Monitor connection state
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`Screen ICE state (${socketId}):`, peerConnection.iceConnectionState);
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(`Screen Connection state (${socketId}):`, peerConnection.connectionState);
    };

    // Create and send offer
    console.log("Creating screen share offer for:", socketId);
    peerConnection.createOffer().then(offer => {
      return peerConnection.setLocalDescription(offer);
    }).then(() => {
      console.log("Sending screen share offer to:", socketId);
      socketRef.current.emit("screen-offer", {
        target: socketId,
        offer: peerConnection.localDescription
      });
    }).catch(err => {
      console.error("Error creating screen share offer:", err);
    });

    // Store the connection
    screenPeerConnectionsRef.current[socketId] = peerConnection;
  };

  // Function to handle receiving a screen share
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

  // Function to handle a peer stopping screen share
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

    // Remove video element if it exists
    const videoEl = document.getElementById(`screen-${userId}`);
    if (videoEl) {
      videoEl.srcObject = null;
      videoEl.remove();
    }

    // Hide container
    const container = document.getElementById(`screen-container-${userId}`);
    if (container) {
      container.style.display = "none";
    }
  };

  // Fetch room details from server
  const fetchRoomDetails = async (token, roomId) => {
    try {
      const response = await fetch(`https://devconnect-backend-6opy.onrender.com/api/get-room/${roomId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch room");

      const data = await response.json();
      setRoom(data);
      console.log("Room details:", data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching room:", err);
      setError(`${err.message} (Room info may not be available, but you can still connect)`);
      setLoading(false);
    }
  };

  // Clean up all resources on unmount
  const cleanupResources = () => {
    console.log("Cleaning up WebRTC resources...");
    // Close all peer connections
    Object.keys(peerConnectionsRef.current).forEach(socketId => {
      peerConnectionsRef.current[socketId].close();
    });
    peerConnectionsRef.current = {};

    // Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      localStreamRef.current = null;
    }

    // Stop screen sharing if active
    if (isScreenSharing && screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      screenStreamRef.current = null;
    }

    // Close all screen sharing peer connections
    Object.keys(screenPeerConnectionsRef.current).forEach(socketId => {
      screenPeerConnectionsRef.current[socketId].close();
    });
    screenPeerConnectionsRef.current = {};

    // Reset screen sharing state
    setIsScreenSharing(false);
    setScreenSharingPeers({});

    // Remove audio container
    if (audioContainerRef.current) {
      while (audioContainerRef.current.firstChild) {
        audioContainerRef.current.removeChild(audioContainerRef.current.firstChild);
      }
      document.body.removeChild(audioContainerRef.current);
      audioContainerRef.current = null;
    }

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  // Toggle microphone mute state
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
        console.log(`Microphone ${track.enabled ? 'unmuted' : 'muted'}`);
      });
      setMuted(prev => !prev);
    }
  };

  // Debug audio connections
  const debugAudio = () => {
    // Log local stream status
    console.log("Local stream:", localStreamRef.current);
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getAudioTracks();
      console.log("Local audio tracks:", tracks);
      tracks.forEach(track => {
        console.log(`Track ${track.id} enabled:`, track.enabled);
      });
    }

    // Log peer connections
    console.log("Peer connections:", peerConnectionsRef.current);
    Object.entries(peerConnectionsRef.current).forEach(([socketId, pc]) => {
      console.log(`Peer ${socketId} state:`, pc.connectionState, pc.iceConnectionState);
    });

    // Log audio elements
    const audioElements = document.querySelectorAll('audio');
    console.log(`Found ${audioElements.length} audio elements:`, audioElements);

    // Force reconnect all peers
    if (confirm("Do you want to try reconnecting to all peers?")) {
      console.log("Reconnecting to all peers...");

      // Close existing connections
      Object.keys(peerConnectionsRef.current).forEach(socketId => {
        removePeer(socketId);
      });

      // Rejoin room
      socketRef.current.emit("join-room", roomId);
    }
  };

  // Handle user leaving the room
  const handleLeaveRoom = async () => {
    // Try to call API to leave room if we have connection
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(sessionStorage.getItem("user"));

    if (token && user?._id) {
      try {
        const response = await fetch(`https://devconnect-backend-6opy.onrender.com/api/room/leave-room/${roomId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: user._id }),
        });

        if (!response.ok) {
          console.warn("API call to leave room failed, but we'll disconnect anyway");
        }
      } catch (err) {
        console.error("Error leaving room:", err);
      }
    }

    // Clean up resources regardless of API call success
    cleanupResources();
    navigate("/");
  };

  // Render loading state
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

  // Render error state
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
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{room?.name || "Audio Room"}</h1>
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

      {/* Connection Status */}
      <div className={`mb-4 p-2 rounded ${connected ? "bg-green-900" : "bg-red-900"}`}>
        <p>
          {connected ? "🟢 Connected to voice chat" : "🔴 Disconnected from voice chat"}
        </p>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Participants Section */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">
            Participants ({connectedParticipants.length})
          </h2>
          <ul className="space-y-3">
            {connectedParticipants.map((participant, index) => {
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

        {/* Screen Sharing Area */}
        <div className="lg:col-span-2 bg-gray-800 p-4 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">
            Shared Screens ({Object.keys(screenSharingPeers).length})
          </h2>
          <div id="screens-area" className="space-y-4">
            {Object.keys(screenSharingPeers).length === 0 ? (
              <div className="text-center p-8 bg-gray-900 rounded-lg">
                <p className="text-gray-400">No active screen shares</p>
                {!isScreenSharing && (
                  <button
                    onClick={startScreenShare}
                    className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
                  >
                    Share Your Screen
                  </button>
                )}
              </div>
            ) : (
              Object.keys(screenSharingPeers).map(userId => (
                <div 
                  key={userId} 
                  id={`screen-container-${userId}`} 
                  className="p-2 bg-gray-900 rounded-lg"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">
                      {userId === localUser?._id 
                        ? "Your Screen" 
                        : `${
                            connectedParticipants.find(p => p.userId?._id === userId)?.userId?.fullname || 
                            "User"
                          }'s Screen`}
                    </h3>
                  </div>
                  {/* Video element will be added here dynamically */}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Debug Section (can be hidden in production) */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg">
        <div className="flex justify-between items-center">
          <h3 className="font-bold">Debug Information</h3>
          <button 
            onClick={debugAudio} 
            className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-700"
          >
            Debug Audio
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-2 bg-gray-700 rounded">
            <p className="text-sm font-medium">Active Peers</p>
            <p className="text-lg">{debugInfo.activePeers}</p>
          </div>
          <div className="p-2 bg-gray-700 rounded">
            <p className="text-sm font-medium">Remote Streams</p>
            <p className="text-lg">{debugInfo.remoteStreams}</p>
          </div>
          <div className="p-2 bg-gray-700 rounded">
            <p className="text-sm font-medium">Local Tracks</p>
            <p className="text-lg">{debugInfo.localTracks}</p>
          </div>
          <div className="p-2 bg-gray-700 rounded">
            <p className="text-sm font-medium">Socket</p>
            <p className="text-lg">{debugInfo.socketConnected ? "Connected" : "Disconnected"}</p>
          </div>
          <div className="p-2 bg-gray-700 rounded">
            <p className="text-sm font-medium">Screen Shares</p>
            <p className="text-lg">{debugInfo.screenSharesActive}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;