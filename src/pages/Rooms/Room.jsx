import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";

const socket = io("https://dev-conncet-backend.onrender.com"); // Adjust backend URL

const Room = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(null);
  const [participants, setParticipants] = useState([]);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("User is not authenticated.");

        const response = await fetch(`https://dev-conncet-backend.onrender.com/api/get-room/${roomId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);

        const data = await response.json();
        setRoom(data);
        setParticipants(data.participants || []);
      } catch (error) {
        setError(error.message);
        console.error("Error fetching room:", error);
      }
    };

    fetchRoomDetails();
  }, [roomId]);

  useEffect(() => {
    const setupWebRTC = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        peerConnectionRef.current = new RTCPeerConnection();

        stream.getTracks().forEach(track => peerConnectionRef.current.addTrack(track, stream));

        peerConnectionRef.current.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        socket.emit("join-room", roomId);

        socket.on("user-joined", async (otherUserId) => {
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          socket.emit("offer", { offer, to: otherUserId, roomId });
        });

        socket.on("receive-offer", async ({ offer, from }) => {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          socket.emit("answer", { answer, to: from, roomId });
        });

        socket.on("receive-answer", async ({ answer }) => {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on("receive-ice-candidate", async ({ candidate }) => {
          if (candidate) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });

        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", { candidate: event.candidate, roomId });
          }
        };
      } catch (error) {
        console.error("Error setting up WebRTC:", error);
      }
    };

    setupWebRTC();

    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      socket.disconnect();
    };
  }, [roomId]);

  const leaveRoom = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`http://localhost:5000/api/room/leave-room/${roomId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to leave the room");

      navigate("/"); 
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", justifyContent: "space-between", padding: "20px" }}>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {room ? (
        <div style={{ flex: 1 }}>
          <h2 style={{ textAlign: "center" }}>{room.name}</h2>
          <h3 style={{ marginBottom: "10px" }}>Participants:</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
            {participants.length > 0 ? (
              participants.map((participant) => (
                <div key={participant.userId._id} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px" }}>
                  <img 
                    src={participant.userId.profileImage || "/default-profile.png"} 
                    alt={`${participant.userId.fullname}'s profile`} 
                    style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover" }} 
                  />
                  <p>{participant.userId.fullname}</p>
                </div>
              ))
            ) : (
              <p>No participants yet.</p>
            )}
          </div>
        </div>
      ) : (
        <p style={{ textAlign: "center" }}>Loading...</p>
      )}

      {/* Video Section */}
      <div style={{ display: "flex", justifyContent: "center", gap: "20px", padding: "20px", borderTop: "1px solid #ddd" }}>
        <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "300px", borderRadius: "10px", backgroundColor: "black" }} />
        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "300px", borderRadius: "10px", backgroundColor: "black" }} />
      </div>

      <div style={{ display: "flex", justifyContent: "center", padding: "15px", borderTop: "1px solid #ddd" }}>
        <button 
          onClick={leaveRoom} 
          style={{ padding: "10px 20px", backgroundColor: "red", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
        >
          End Call
        </button>
      </div>
    </div>
  );
};

export default Room;
