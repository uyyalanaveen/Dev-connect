import React from 'react';
import Ai from "../../assets/Ai.png";
import whiteboard from "../../assets/whiteboard.png";
import auth from "../../assets/Authentication.png"
import sharing from "../../assets/sharing.png";
import webrtc from "../../assets/webrtc.png";
const features = [
  {
    title: "Real-Time Assistance",
    description: "Get instant help through chat, voice calls, and screen sharing, ensuring seamless problem-solving.",
    image: Ai,
  },
  {
    title: "Technology-Specific Rooms",
    description: "Collaborate in dedicated rooms for HTML, CSS, React, and more. Share resources and interact with peers.",
    image: whiteboard,
  },
  {
    title: "Interactive Whiteboard",
    description: "Use a collaborative whiteboard to visualize ideas, share drawings, and enhance learning.",
    image: whiteboard,
  },
  {
    title: "Secure Authentication",
    description: "Log in securely using Gmail and enjoy a personalized experience with your custom avatar.",
    image: auth,
  },
  {
    title: "File Sharing & Multimedia",
    description: "Share files, images, and videos seamlessly to enhance collaboration during discussions.",
    image: sharing,
  },
  {
    title: "WebRTC Integration",
    description: "Experience real-time communication, including video, audio, and screen sharing powered by WebRTC.",
    image: webrtc,
  },
];

const FeaturePage = () => {
  return (
    <div className="bg-black min-h-screen w-full py-10 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-16">
          Our Features
        </h1>

        {/* Features Section */}
        <div className="space-y-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`flex flex-wrap items-center ${
                index % 2 === 0 ? "flex-row" : "flex-row-reverse"
              }`}
            >
              {/* Image Section */}
              <div className="w-full md:w-1/2">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover rounded-lg shadow-lg"
                />
              </div>

              {/* Content Section */}
              <div className="w-full md:w-1/2 p-8">
                <h2 className="text-3xl font-bold text-white mb-4">
                  {feature.title}
                </h2>
                <p className="text-gray-300 text-lg mb-6">{feature.description}</p>
                <button className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-all duration-200">
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturePage;
