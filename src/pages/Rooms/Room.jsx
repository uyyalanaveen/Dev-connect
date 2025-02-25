// Import dependencies
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("https://dev-conncet-backend.onrender.com"); // Change to your backend URL

const Room = () => {
  const [peers, setPeers] = useState({});
  const myVideoRef = useRef();
  const videoGridRef = useRef();
  const peerConnections = useRef({});
  const myStream = useRef(null);
  
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      myStream.current = stream;
      if (myVideoRef.current) myVideoRef.current.srcObject = stream;
      socket.emit("join", { roomId: "room1", userId: socket.id }); // Replace with dynamic room ID
    });

    socket.on("peer-joined", ({ peerId }) => {
      const peer = createPeer(peerId);
      peerConnections.current[peerId] = peer;
    });

    socket.on("peers", ({ peers }) => {
      peers.forEach(({ id }) => {
        const peer = createPeer(id);
        peerConnections.current[id] = peer;
      });
    });

    socket.on("offer", ({ from, offer }) => {
      const peer = new RTCPeerConnection();
      peerConnections.current[from] = peer;
      myStream.current.getTracks().forEach((track) => peer.addTrack(track, myStream.current));
      peer.setRemoteDescription(new RTCSessionDescription(offer));
      peer.createAnswer().then((answer) => {
        peer.setLocalDescription(answer);
        socket.emit("answer", { roomId: "room1", to: from, answer });
      });
      handleTrackEvent(peer, from);
    });

    socket.on("answer", ({ from, answer }) => {
      peerConnections.current[from].setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("ice-candidate", ({ from, candidate }) => {
      peerConnections.current[from].addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.on("peer-left", ({ peerId }) => {
      if (peerConnections.current[peerId]) {
        peerConnections.current[peerId].close();
        delete peerConnections.current[peerId];
      }
    });
  }, []);

  const createPeer = (userId) => {
    const peer = new RTCPeerConnection();
    myStream.current.getTracks().forEach((track) => peer.addTrack(track, myStream.current));
    peer.createOffer().then((offer) => {
      peer.setLocalDescription(offer);
      socket.emit("offer", { roomId: "room1", to: userId, offer });
    });
    handleTrackEvent(peer, userId);
    return peer;
  };

  const handleTrackEvent = (peer, userId) => {
    peer.ontrack = (event) => {
      let video = document.createElement("video");
      video.srcObject = event.streams[0];
      video.autoplay = true;
      video.playsInline = true;
      videoGridRef.current.appendChild(video);
    };
    peer.onicecandidate = (event) => {
      if (event.candidate) socket.emit("ice-candidate", { roomId: "room1", to: userId, candidate: event.candidate });
    };
  };

  const shareScreen = () => {
    navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).then((screenStream) => {
      Object.values(peerConnections.current).forEach((peer) => {
        peer.getSenders().forEach((sender) => {
          if (sender.track.kind === "video") sender.replaceTrack(screenStream.getVideoTracks()[0]);
          if (sender.track.kind === "audio") sender.replaceTrack(screenStream.getAudioTracks()[0]);
        });
      });
      myVideoRef.current.srcObject = screenStream;
      socket.emit("stream-started", { roomId: "room1", kind: "screen" });
      screenStream.getVideoTracks()[0].onended = () => stopSharingScreen();
    });
  };

  const stopSharingScreen = () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      myStream.current = stream;
      Object.values(peerConnections.current).forEach((peer) => {
        peer.getSenders().forEach((sender) => {
          if (sender.track.kind === "video") sender.replaceTrack(stream.getVideoTracks()[0]);
          if (sender.track.kind === "audio") sender.replaceTrack(stream.getAudioTracks()[0]);
        });
      });
      myVideoRef.current.srcObject = stream;
      socket.emit("stream-stopped", { roomId: "room1", kind: "screen" });
    });
  };

  return (
    <div>
      <h2>DevConnect Room</h2>
      <video ref={myVideoRef} autoPlay playsInline muted></video>
      <button onClick={shareScreen}>Share Screen</button>
      <div ref={videoGridRef}></div>
    </div>
  );
};

export default Room;