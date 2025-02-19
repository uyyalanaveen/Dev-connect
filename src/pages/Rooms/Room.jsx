import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";

const socket = io("https://dev-conncet-backend.onrender.com"); // Backend URL

const Room = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [remoteStreams, setRemoteStreams] = useState({});

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnections = useRef({});

  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("User is not authenticated.");

        const response = await fetch(`https://dev-conncet-backend.onrender.com/api/get-room/${roomId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);

        const data = await response.json();
        setRoom(data);
        setParticipants(data.participants || []);
      } catch (error) {
        console.error("Error fetching room:", error);
      }
    };

    fetchRoomDetails();
  }, [roomId]);

  useEffect(() => {
    const setupWebRTC = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        socket.emit("join-room", roomId);

        socket.on("user-joined", (userId) => {
          console.log(`New user joined: ${userId}`);
          createPeerConnection(userId, stream);
          sendOffer(userId);
        });

        socket.on("receive-offer", handleReceiveOffer);
        socket.on("receive-answer", handleReceiveAnswer);
        socket.on("receive-ice-candidate", handleNewICECandidate);
      } catch (error) {
        console.error("Error setting up WebRTC:", error);
      }
    };

    setupWebRTC();

    return () => {
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      socket.disconnect();
    };
  }, [roomId]);

  const createPeerConnection = (userId, stream) => {
    const peerConnection = new RTCPeerConnection();

    stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { candidate: event.candidate, to: userId, roomId });
      }
    };

    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setRemoteStreams((prev) => ({
        ...prev,
        [userId]: remoteStream,
      }));
    };

    peerConnections.current[userId] = peerConnection;
  };

  const sendOffer = async (userId) => {
    const peerConnection = peerConnections.current[userId];
    if (!peerConnection) return;

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit("offer", { offer, to: userId, roomId });
  };

  const handleReceiveOffer = async ({ offer, from }) => {
    const peerConnection = new RTCPeerConnection();

    localStreamRef.current.getTracks().forEach((track) => peerConnection.addTrack(track, localStreamRef.current));

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { candidate: event.candidate, to: from, roomId });
      }
    };

    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setRemoteStreams((prev) => ({
        ...prev,
        [from]: remoteStream,
      }));
    };

    peerConnections.current[from] = peerConnection;

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit("answer", { answer, to: from, roomId });
  };

  const handleReceiveAnswer = async ({ answer, from }) => {
    const peerConnection = peerConnections.current[from];
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleNewICECandidate = async ({ candidate, from }) => {
    const peerConnection = peerConnections.current[from];
    if (peerConnection && candidate) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const toggleMute = () => {
    const audioTracks = localStreamRef.current.getAudioTracks();
    audioTracks.forEach((track) => (track.enabled = !track.enabled));
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    const videoTracks = localStreamRef.current.getVideoTracks();
    videoTracks.forEach((track) => (track.enabled = !track.enabled));
    setIsVideoOn(!isVideoOn);
  };

  const leaveRoom = async () => {
    try {
      const token = localStorage.getItem("authToken");
      await fetch(`https://dev-conncet-backend.onrender.com/api/room/leave-room/${roomId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      navigate("/");
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", justifyContent: "space-between", padding: "20px" }}>
      <h2 style={{ textAlign: "center" }}>{room?.name || "Loading..."}</h2>

      {/* Video Section */}
      <div style={{ display: "flex", justifyContent: "center", gap: "20px", padding: "20px" }}>
        <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "300px", borderRadius: "10px", backgroundColor: "black" }} />
        {Object.keys(remoteStreams).map((userId) => (
          <video key={userId} ref={(el) => { if (el) el.srcObject = remoteStreams[userId]; }} autoPlay playsInline style={{ width: "300px", borderRadius: "10px", backgroundColor: "black" }} />
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "center", gap: "15px", padding: "15px" }}>
        <button onClick={toggleMute} style={{ padding: "10px", backgroundColor: isMuted ? "gray" : "blue", color: "white", border: "none", borderRadius: "5px" }}>
          {isMuted ? "Unmute" : "Mute"}
        </button>
        <button onClick={toggleVideo} style={{ padding: "10px", backgroundColor: isVideoOn ? "blue" : "gray", color: "white", border: "none", borderRadius: "5px" }}>
          {isVideoOn ? "Turn Off Video" : "Turn On Video"}
        </button>
        <button onClick={leaveRoom} style={{ padding: "10px", backgroundColor: "red", color: "white", border: "none", borderRadius: "5px" }}>
          End Call
        </button>
      </div>
    </div>
  );
};

export default Room;
