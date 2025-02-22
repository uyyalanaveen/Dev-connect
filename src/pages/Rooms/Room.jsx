// import { useEffect, useState, useRef } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { Mic, MicOff, PhoneOff } from "lucide-react";
// import io from "socket.io-client";

// const socket = io("http://localhost:5000");

// const Room = () => {
//   const { id: roomId } = useParams();
//   const navigate = useNavigate();
//   const [isAudioEnabled, setIsAudioEnabled] = useState(false);
//   const [participants, setParticipants] = useState(new Set());
//   const localStreamRef = useRef(null);
//   const peerConnectionsRef = useRef({});
//   const currentUserRef = useRef(null);
//   const remoteAudioRefs = useRef({});

//   useEffect(() => {
//     const user = JSON.parse(sessionStorage.getItem("user"));
//     if (!user?._id) {
//       navigate("/");
//       return;
//     }
//     currentUserRef.current = user._id;

//     const initializeAudio = async () => {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({
//           audio: true,
//           video: false
//         });
//         stream.getAudioTracks()[0].enabled = false;
//         localStreamRef.current = stream;
//         console.log("📢 Audio stream initialized");
//       } catch (error) {
//         console.error("🚫 Error getting audio stream:", error);
//         alert("Please enable microphone access");
//       }
//     };

//     const createPeer = (targetUserId) => {
//       console.log("🔄 Creating peer for:", targetUserId);
      
//       const peer = new RTCPeerConnection({
//         iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
//       });

//       // Add our stream
//       if (localStreamRef.current) {
//         localStreamRef.current.getTracks().forEach((track) => {
//           peer.addTrack(track, localStreamRef.current);
//         });
//       }

//       // Create audio element for this peer
//       const audio = new Audio();
//       audio.autoplay = true;
//       remoteAudioRefs.current[targetUserId] = audio;

//       // Handle incoming stream
//       peer.ontrack = (event) => {
//         console.log("🎵 Received remote track");
//         remoteAudioRefs.current[targetUserId].srcObject = event.streams[0];
//       };

//       // Send ICE candidates
//       peer.onicecandidate = (event) => {
//         if (event.candidate) {
//           socket.emit("ice-candidate", {
//             roomId,
//             candidate: event.candidate,
//             senderId: currentUserRef.current,
//             receiverId: targetUserId
//           });
//         }
//       };

//       peer.onconnectionstatechange = () => {
//         console.log("Connection state:", peer.connectionState);
//       };

//       peerConnectionsRef.current[targetUserId] = peer;
//       return peer;
//     };

//     socket.on("user-joined", async ({ userId }) => {
//       console.log("👋 User joined:", userId);
//       setParticipants(prev => new Set([...prev, userId]));

//       // Create and send offer
//       const peer = createPeer(userId);
//       const offer = await peer.createOffer();
//       await peer.setLocalDescription(offer);
      
//       socket.emit("offer", {
//         roomId,
//         offer,
//         senderId: currentUserRef.current,
//         receiverId: userId
//       });
//     });

//     socket.on("offer", async ({ senderId, offer }) => {
//       console.log("📨 Received offer from:", senderId);
//       const peer = createPeer(senderId);
      
//       await peer.setRemoteDescription(new RTCSessionDescription(offer));
//       const answer = await peer.createAnswer();
//       await peer.setLocalDescription(answer);
      
//       socket.emit("answer", {
//         roomId,
//         answer,
//         senderId: currentUserRef.current,
//         receiverId: senderId
//       });
//     });

//     socket.on("answer", async ({ senderId, answer }) => {
//       console.log("📨 Received answer from:", senderId);
//       const peer = peerConnectionsRef.current[senderId];
//       if (peer) {
//         await peer.setRemoteDescription(new RTCSessionDescription(answer));
//       }
//     });

//     socket.on("ice-candidate", async ({ senderId, candidate }) => {
//       console.log("❄️ Received ICE candidate from:", senderId);
//       const peer = peerConnectionsRef.current[senderId];
//       if (peer) {
//         await peer.addIceCandidate(new RTCIceCandidate(candidate));
//       }
//     });

//     socket.on("user-left", ({ userId }) => {
//       console.log("👋 User left:", userId);
//       if (peerConnectionsRef.current[userId]) {
//         peerConnectionsRef.current[userId].close();
//         delete peerConnectionsRef.current[userId];
//       }
//       if (remoteAudioRefs.current[userId]) {
//         delete remoteAudioRefs.current[userId];
//       }
//       setParticipants(prev => {
//         const updated = new Set(prev);
//         updated.delete(userId);
//         return updated;
//       });
//     });

//     // Start
//     const init = async () => {
//       await initializeAudio();
//       socket.emit("join-room", { roomId, userId: currentUserRef.current });
//     };

//     init();

//     // Cleanup
//     return () => {
//       // Stop all tracks
//       if (localStreamRef.current) {
//         localStreamRef.current.getTracks().forEach(track => track.stop());
//       }
      
//       // Close all peer connections
//       Object.values(peerConnectionsRef.current).forEach(peer => peer.close());
      
//       // Clear all audio elements
//       Object.values(remoteAudioRefs.current).forEach(audio => {
//         if (audio.srcObject) {
//           audio.srcObject.getTracks().forEach(track => track.stop());
//         }
//       });
      
//       socket.emit("leave-room", { roomId, userId: currentUserRef.current });
//       socket.off();
//     };
//   }, [roomId, navigate]);

//   const toggleAudio = () => {
//     if (localStreamRef.current) {
//       const audioTrack = localStreamRef.current.getAudioTracks()[0];
//       audioTrack.enabled = !audioTrack.enabled;
//       setIsAudioEnabled(audioTrack.enabled);
//       console.log("🎤 Microphone:", audioTrack.enabled ? "on" : "off");
//     }
//   };

//   return (
//     <div className="flex flex-col h-screen bg-gray-900 text-white items-center justify-center p-6">
//       <div className="w-full max-w-2xl">
//         <h2 className="text-3xl font-bold mb-4">Room: {roomId}</h2>
//         <p className="text-lg mb-4">
//           Participants: {participants.size + 1}
//           {participants.size > 0 && ` (You + ${participants.size} others)`}
//         </p>
        
//         <div className="fixed bottom-5 left-1/2 -translate-x-1/2 flex gap-6 bg-gray-800 px-6 py-3 rounded-full shadow-lg">
//           <button 
//             onClick={toggleAudio} 
//             className={`p-4 rounded-full transition-colors ${
//               isAudioEnabled ? "bg-blue-500 hover:bg-blue-600" : "bg-red-500 hover:bg-red-600"
//             }`}
//           >
//             {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
//           </button>
//           <button 
//             onClick={() => navigate("/")} 
//             className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
//           >
//             <PhoneOff size={24} />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Room;

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

const Room = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(true);
  const localStream = useRef();
  const connections = useRef({});
  
  useEffect(() => {
    const userId = JSON.parse(sessionStorage.getItem("user"))?._id;
    if (!userId) return navigate("/");

    async function setupMedia() {
      try {
        // Get audio stream
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true,
          video: false
        });
        localStream.current = stream;
        stream.getAudioTracks()[0].enabled = false; // Start muted

        // Join room
        socket.emit("join", { roomId, userId });

        // Handle existing peers
        socket.on("peers", ({ peers }) => {
          peers.forEach(peerId => createPeerConnection(peerId, true));
        });

        // Handle new peer
        socket.on("peer-joined", ({ peerId }) => {
          createPeerConnection(peerId, false);
        });

        // Handle offers
        socket.on("offer", async ({ offer, from }) => {
          const pc = connections.current[from] || createPeerConnection(from, false);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("answer", { roomId, answer, to: from });
        });

        // Handle answers
        socket.on("answer", async ({ answer, from }) => {
          const pc = connections.current[from];
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          }
        });

        // Handle ICE candidates
        socket.on("ice-candidate", async ({ candidate, from }) => {
          const pc = connections.current[from];
          if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });

      } catch (err) {
        console.error("Error setting up media:", err);
        alert("Could not access microphone");
      }
    }

    function createPeerConnection(peerId, isInitiator) {
      // Create new WebRTC connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });
      
      // Add our audio track
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => {
          pc.addTrack(track, localStream.current);
        });
      }

      // Handle incoming audio
      pc.ontrack = (event) => {
        const audio = new Audio();
        audio.srcObject = event.streams[0];
        audio.autoplay = true;
        document.body.appendChild(audio);
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

      // Store connection
      connections.current[peerId] = pc;

      // Create and send offer if we're the initiator
      if (isInitiator) {
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .then(() => {
            socket.emit("offer", {
              roomId,
              offer: pc.localDescription,
              to: peerId
            });
          });
      }

      return pc;
    }

    setupMedia();

    // Cleanup
    return () => {
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
      }
      Object.values(connections.current).forEach(pc => pc.close());
      socket.off();
    };
  }, [roomId, navigate]);

  const toggleMute = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white items-center justify-center p-6">
      <div className="fixed bottom-5 flex gap-6 bg-gray-800 px-6 py-3 rounded-full">
        <button 
          onClick={toggleMute} 
          className={`p-4 rounded-full ${isMuted ? "bg-red-500" : "bg-blue-500"}`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        <button 
          onClick={() => navigate("/")} 
          className="p-4 rounded-full bg-red-500"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
};

export default Room;