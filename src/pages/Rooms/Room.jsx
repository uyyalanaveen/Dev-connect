import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

const Room = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [participants, setParticipants] = useState(new Set());
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const audioContextRef = useRef(null);
  const currentUserRef = useRef(null);

  useEffect(() => {
    // Initialize AudioContext
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user?._id) {
      navigate("/");
      return;
    }
    currentUserRef.current = user._id;

    const initializeAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        localStreamRef.current = stream;
        // Start muted
        stream.getAudioTracks()[0].enabled = false;
        
        // Create audio processing pipeline
        const sourceNode = audioContextRef.current.createMediaStreamSource(stream);
        const gainNode = audioContextRef.current.createGain();
        sourceNode.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        
        console.log("🎤 Audio initialized successfully");
      } catch (err) {
        console.error("❌ Error accessing microphone:", err);
        alert("Please ensure your microphone is connected and permissions are granted.");
      }
    };

    const createPeerConnection = (peerId) => {
      if (peerConnectionsRef.current[peerId]) return null;

      console.log(`📡 Creating peer connection for ${peerId}`);
      
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" }
        ]
      });

      // Add local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          console.log("➕ Adding track to peer connection", track.kind);
          peerConnection.addTrack(track, localStreamRef.current);
        });
      }

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log("🎵 Received remote track", event.track.kind);
        
        const audioEl = new Audio();
        audioEl.srcObject = event.streams[0];
        audioEl.autoplay = true;
        
        // Connect to audio context for processing
        const source = audioContextRef.current.createMediaStreamSource(event.streams[0]);
        const gainNode = audioContextRef.current.createGain();
        source.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        
        // Clean up when track ends
        event.track.onended = () => {
          source.disconnect();
          gainNode.disconnect();
        };
      };

      // ICE candidate handling
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("🧊 Sending ICE candidate");
          socket.emit("ice-candidate", {
            roomId,
            candidate: event.candidate,
            senderId: currentUserRef.current,
            receiverId: peerId
          });
        }
      };

      // Connection state monitoring
      peerConnection.onconnectionstatechange = () => {
        console.log(`Connection state for peer ${peerId}:`, peerConnection.connectionState);
      };

      peerConnectionsRef.current[peerId] = peerConnection;
      return peerConnection;
    };

    socket.on("room-users", ({ users }) => {
      users.forEach(userId => createPeerConnection(userId));
    });

    socket.on("user-joined", async ({ userId }) => {
      console.log(`👋 User joined: ${userId}`);
      setParticipants(prev => new Set([...prev, userId]));
      const peerConnection = createPeerConnection(userId);
      
      if (peerConnection && localStreamRef.current) {
        try {
          const offer = await peerConnection.createOffer({
            offerToReceiveAudio: true
          });
          await peerConnection.setLocalDescription(offer);
          socket.emit("offer", {
            roomId,
            offer,
            senderId: currentUserRef.current,
            receiverId: userId
          });
        } catch (err) {
          console.error("❌ Error creating offer:", err);
        }
      }
    });

    socket.on("offer", async ({ senderId, offer }) => {
      console.log(`📨 Received offer from ${senderId}`);
      const peerConnection = createPeerConnection(senderId);
      
      if (peerConnection) {
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          
          socket.emit("answer", {
            roomId,
            answer,
            senderId: currentUserRef.current,
            receiverId: senderId
          });
        } catch (err) {
          console.error("❌ Error handling offer:", err);
        }
      }
    });

    socket.on("answer", async ({ senderId, answer }) => {
      console.log(`📨 Received answer from ${senderId}`);
      const peerConnection = peerConnectionsRef.current[senderId];
      if (peerConnection) {
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error("❌ Error handling answer:", err);
        }
      }
    });

    socket.on("ice-candidate", ({ senderId, candidate }) => {
      console.log(`🧊 Received ICE candidate from ${senderId}`);
      const peerConnection = peerConnectionsRef.current[senderId];
      if (peerConnection) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
          .catch(err => console.error("❌ Error adding ICE candidate:", err));
      }
    });

    socket.on("user-left", ({ userId }) => {
      console.log(`👋 User left: ${userId}`);
      const peerConnection = peerConnectionsRef.current[userId];
      if (peerConnection) {
        peerConnection.close();
        delete peerConnectionsRef.current[userId];
      }
      setParticipants(prev => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    });

    // Initialize room connection
    const startRoom = async () => {
      await initializeAudio();
      socket.emit("join-room", { roomId, userId: currentUserRef.current });
    };

    startRoom();

    // Cleanup
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      Object.values(peerConnectionsRef.current).forEach(peer => peer.close());
      audioContextRef.current?.close();
      
      socket.emit("leave-room", { roomId, userId: currentUserRef.current });
      socket.off();
    };
  }, [roomId, navigate]);

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(!isAudioEnabled);
      
      // Resume AudioContext if it was suspended
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <h2 className="text-3xl font-bold mb-4">Room: {roomId}</h2>
        <p className="text-lg mb-4">
          Participants: {participants.size + 1}
          {participants.size > 0 && ` (You + ${participants.size} others)`}
        </p>
        
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 flex gap-6 bg-gray-800 px-6 py-3 rounded-full shadow-lg">
          <button 
            onClick={toggleAudio} 
            className={`p-4 rounded-full transition-colors ${
              isAudioEnabled ? "bg-blue-500 hover:bg-blue-600" : "bg-red-500 hover:bg-red-600"
            }`}
            title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
          >
            {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
          </button>
          <button 
            onClick={() => navigate("/")} 
            className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            title="Leave room"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Room;