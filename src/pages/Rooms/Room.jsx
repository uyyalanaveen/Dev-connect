import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { motion } from "framer-motion";
import io from "socket.io-client";

const socket = io("https://dev-conncet-backend.onrender.com");

const Room = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [users, setUsers] = useState([]);

  const peerConnections = useRef({});

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const userId = user?._id;
    if (!userId) {
      setError("User not authenticated");
      return;
    }

    socket.emit("join-room", { roomId, userId });

    socket.on("new-user", ({ userId }) => {
      setUsers((prev) => [...prev, { userId }]);
      initiateWebRTCConnection(userId);
    });

    socket.on("user-left", ({ userId }) => {
      setUsers((prev) => prev.filter((user) => user.userId !== userId));
      if (peerConnections.current[userId]) {
        peerConnections.current[userId].close();
        delete peerConnections.current[userId];
      }
    });

    fetchRoomDetails();
    initializeAudio();

    return () => {
      socket.emit("leave-room", { roomId, userId });
      Object.values(peerConnections.current).forEach((peer) => peer.close());
    };
  }, [roomId]);

  // ✅ Fetch Room Details (with Debugging)
  const fetchRoomDetails = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`https://dev-conncet-backend.onrender.com/api/get-room/${roomId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      console.log("Room Data:", data);  // ✅ Debugging API Response

      setRoom(data);
      setUsers(data.participants || []);
    } catch (error) {
      setError("Error fetching room details");
    }
  };

  const initializeAudio = async () => {
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      userStream.getAudioTracks()[0].enabled = false;
      setStream(userStream);
    } catch (error) {
      setError("Could not access microphone");
    }
  };

  const initiateWebRTCConnection = (peerId) => {
    const userId = JSON.parse(sessionStorage.getItem("user"))?._id;
    if (!userId || peerId === userId) return;

    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnections.current[peerId] = peer;

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
        socket.emit("ice-candidate", { roomId, candidate: event.candidate, senderId: userId });
      }
    };

    peer.createOffer().then((offer) => {
      peer.setLocalDescription(offer);
      socket.emit("offer", { roomId, offer, senderId: userId });
    });
  };

  socket.on("offer", async ({ offer, senderId }) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnections.current[senderId] = peer;

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
        socket.emit("ice-candidate", { roomId, candidate: event.candidate, senderId: localStorage.getItem("userId") });
      }
    };

    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socket.emit("answer", { roomId, answer, senderId: localStorage.getItem("userId") });
  });

  socket.on("answer", ({ answer, senderId }) => {
    if (peerConnections.current[senderId]) {
      peerConnections.current[senderId].setRemoteDescription(new RTCSessionDescription(answer));
    }
  });

  socket.on("ice-candidate", ({ candidate, senderId }) => {
    if (peerConnections.current[senderId]) {
      peerConnections.current[senderId].addIceCandidate(new RTCIceCandidate(candidate));
    }
  });

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white items-center justify-center p-6">
      {error && <p className="text-red-500 text-center">Error: {error}</p>}
      {room ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-2xl">
          <h2 className="text-3xl font-bold mt-4">{room.name}</h2>
          
          {/* ✅ Displaying User Profile and Full Name */}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {Array.isArray(users) && users.length > 0 ? (
              users.map((participant) => (
                <motion.div key={participant.userId._id} className="p-3 rounded-lg bg-gray-800 border-2 border-white">
                  <img 
                    src={participant.userId.profileImage || "https://via.placeholder.com/50"} 
                    alt="Profile" 
                    className="w-12 h-12 rounded-full mx-auto"
                  />
                  <p className="text-sm text-center">{participant.userId.fullname || "Unknown User"}</p>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-400">No participants yet</p>
            )}
          </div>

          <div className="fixed bottom-5 flex gap-6 bg-gray-800 px-6 py-3 rounded-full">
            <button onClick={toggleAudio} className={`p-4 rounded-full ${isAudioEnabled ? "bg-blue-500" : "bg-red-500"}`}>
              {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
            </button>
            <button onClick={() => navigate("/")} className="p-4 rounded-full bg-red-500">
              <PhoneOff size={24} />
            </button>
          </div>
        </motion.div>
      ) : (
        <p className="text-center text-lg font-semibold">Loading...</p>
      )}
    </div>
  );
};

export default Room;
