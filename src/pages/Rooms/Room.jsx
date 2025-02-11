import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const Room = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(null);

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
      } catch (error) {
        setError(error.message);
        console.error("Error fetching room:", error);
      }
    };

    fetchRoomDetails();
  }, [roomId]);

  const leaveRoom = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`https://dev-conncet-backend.onrender.com/api/room/leave-room/${roomId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomId }),
      });

      if (!response.ok) throw new Error("Failed to leave the room");

      navigate("/"); // Redirect to homepage after leaving
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
            {room.participants?.length > 0 ? (
              room.participants.map((participant) => (
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
