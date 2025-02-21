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
  const peerConnections = useRef({}); // Store all peer connections

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const userId = user?._id;
    if (!userId) return;

    socket.emit("join-room", { roomId, userId });

    // Listen for new users
    socket.on("new-user", ({ userId }) => {
      setUsers((prev) => [...prev, { userId }]);
      createPeerConnection(userId, true);
    });

    // When a user leaves, remove them
    socket.on("user-left", ({ userId }) => {
      if (peerConnections.current[userId]) {
        peerConnections.current[userId].close();
        delete peerConnections.current[userId];
      }
      setUsers((prev) => prev.filter((user) => user.userId !== userId));
    });

    // Get media stream
    navigator.mediaDevices.getUserMedia({ audio: true }).then((userStream) => {
      userStream.getAudioTracks()[0].enabled = false;
      setStream(userStream);
    });

    return () => {
      socket.emit("leave-room", { roomId, userId });
      Object.values(peerConnections.current).forEach((peer) => peer.close());
      socket.off("new-user");
      socket.off("user-left");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, [roomId]);

  // 🔹 Create WebRTC Connection
  const createPeerConnection = (peerId, isOfferer) => {
    if (peerConnections.current[peerId]) return;

    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnections.current[peerId] = peer;

    // Add local audio track to the peer connection
    if (stream) {
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    }

    peer.ontrack = (event) => {
      const remoteAudio = new Audio();
      remoteAudio.srcObject = event.streams[0];
      remoteAudio.play();
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { roomId, candidate: event.candidate, senderId: sessionStorage.getItem("userId") });
      }
    };

    if (isOfferer) {
      peer.createOffer().then((offer) => {
        peer.setLocalDescription(offer);
        socket.emit("offer", { roomId, offer, senderId: sessionStorage.getItem("userId") });
      });
    }
  };

  // 🔹 Handle WebRTC Offers
  socket.on("offer", async ({ offer, senderId }) => {
    createPeerConnection(senderId, false);
    await peerConnections.current[senderId].setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnections.current[senderId].createAnswer();
    await peerConnections.current[senderId].setLocalDescription(answer);
    socket.emit("answer", { roomId, answer, senderId: sessionStorage.getItem("userId") });
  });

  // 🔹 Handle WebRTC Answers
  socket.on("answer", ({ answer, senderId }) => {
    if (peerConnections.current[senderId]) {
      peerConnections.current[senderId].setRemoteDescription(new RTCSessionDescription(answer));
    }
  });

  // 🔹 Handle ICE Candidates
  socket.on("ice-candidate", ({ candidate, senderId }) => {
    if (peerConnections.current[senderId]) {
      peerConnections.current[senderId].addIceCandidate(new RTCIceCandidate(candidate));
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
