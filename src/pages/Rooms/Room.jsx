import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { motion } from "framer-motion";
import io from "socket.io-client";

const socket = io("https://dev-conncet-backend.onrender.com");

const Room = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stream, setStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const peerConnections = useRef({});
  const audioElements = useRef({});

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user || !user._id) return;
    const userId = user._id;

    socket.emit("join-room", { roomId, userId });

    // Get user media (audio only)
    navigator.mediaDevices.getUserMedia({ audio: true }).then((userStream) => {
      userStream.getAudioTracks()[0].enabled = false; // Start muted
      setStream(userStream);
      socket.emit("request-existing-users", { roomId, newUserId: userId });
    });

    // New user joins
    socket.on("new-user", ({ userId }) => {
      setUsers((prev) => [...prev, { userId }]);
      createPeerConnection(userId, true);
    });

    // Existing users
    socket.on("existing-users", ({ existingUsers }) => {
      existingUsers.forEach(({ userId }) => {
        createPeerConnection(userId, true);
      });
    });

    // User leaves
    socket.on("user-left", ({ userId }) => {
      if (peerConnections.current[userId]) {
        peerConnections.current[userId].close();
        delete peerConnections.current[userId];
      }
      if (audioElements.current[userId]) {
        document.body.removeChild(audioElements.current[userId]);
        delete audioElements.current[userId];
      }
      setUsers((prev) => prev.filter((user) => user.userId !== userId));
    });

    return () => {
      socket.emit("leave-room", { roomId, userId });
      Object.values(peerConnections.current).forEach((peer) => peer.close());
      socket.off("new-user");
      socket.off("user-left");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("existing-users");
    };
  }, [roomId]);

  // 🔹 Create WebRTC Connection
  const createPeerConnection = (peerId, isOfferer) => {
    if (peerConnections.current[peerId]) return;

    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnections.current[peerId] = peer;

    if (stream) {
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    }

    peer.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        console.log(`🎙️ Audio received from ${peerId}`);
        let remoteAudio = document.createElement("audio");
        remoteAudio.srcObject = event.streams[0];
        remoteAudio.autoplay = true;
        remoteAudio.play().catch((e) => console.error("Audio playback error:", e));

        document.body.appendChild(remoteAudio);
        audioElements.current[peerId] = remoteAudio;
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { roomId, candidate: event.candidate, senderId: JSON.parse(sessionStorage.getItem("user"))._id });
      }
    };

    if (isOfferer) {
      peer.createOffer().then((offer) => {
        peer.setLocalDescription(offer);
        socket.emit("offer", { roomId, offer, senderId: JSON.parse(sessionStorage.getItem("user"))._id });
      });
    }
  };

  // 🔹 Handle WebRTC Offers
  socket.on("offer", async ({ offer, senderId }) => {
    if (!peerConnections.current[senderId]) {
      createPeerConnection(senderId, false);
    }

    const peer = peerConnections.current[senderId];

    if (peer.signalingState !== "stable") {
      console.warn("Skipping offer, already stable.");
      return;
    }

    try {
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("answer", { roomId, answer, senderId: JSON.parse(sessionStorage.getItem("user"))._id });
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  });

  socket.on("answer", ({ answer, senderId }) => {
    const peer = peerConnections.current[senderId];

    if (!peer) return;

    if (peer.signalingState === "stable") {
      console.warn("Skipping answer, already stable.");
      return;
    }

    peer.setRemoteDescription(new RTCSessionDescription(answer)).catch(console.error);
  });

  // 🔹 Handle ICE Candidates
  socket.on("ice-candidate", ({ candidate, senderId }) => {
    const peer = peerConnections.current[senderId];
    if (peer) {
      peer.addIceCandidate(new RTCIceCandidate(candidate));
    }
  });

  // 🔹 Toggle Audio
  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-2xl">
        <h2 className="text-3xl font-bold mt-4">Room ID: {roomId}</h2>

        <div className="fixed bottom-5 flex gap-6 bg-gray-800 px-6 py-3 rounded-full">
          <button onClick={toggleAudio} className={`p-4 rounded-full ${isAudioEnabled ? "bg-blue-500" : "bg-red-500"}`}>
            {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
          </button>
          <button onClick={() => navigate("/")} className="p-4 rounded-full bg-red-500">
            <PhoneOff size={24} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Room;
