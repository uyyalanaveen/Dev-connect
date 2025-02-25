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