import React, { useState } from 'react';
import { Link, Navigate, Outlet } from 'react-router-dom';
import Navbar from './src/components/Navbar/Navbar';
import { isAuthenticated } from './src/utility/auth';
import Footer from './src/pages/Footer/Footer.jsx';
import Chatbot from './src/pages/Home/Chatbot.jsx';
import { Plus, Loader2, Search, MessageCircle, X, MinusIcon } from 'lucide-react';


const Layout = () => {
  const isLoggedIn = isAuthenticated();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  const toggleChatbot = () => {
    if (isChatMinimized) {
      setIsChatMinimized(false);
      Navigate('/chatbot')
    } else {
      setIsChatbotOpen(!isChatbotOpen);
    }
  };

  const minimizeChatbot = () => {
    setIsChatMinimized(true);
  };

  return (
    <div className={`flex flex-col min-h-screen bg-gray-900 w-full items-center justify-between`}>
      <div className={`flex flex-col min-h-screen bg-black w-full`}>
        <Navbar />
        <div
          className={`flex-grow flex items-center justify-between text-white w-full h-full px-4`}>
          <div className="max-w-screen-lg w-full">
            <Outlet />
            {/* {!isChatbotOpen && !isChatMinimized && (
              <div className="fixed bottom-6 right-6 z-50">
                <button
                  onClick={toggleChatbot}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg flex items-center justify-center transition-colors"
                  aria-label="Open chatbot"
                >
                  <MessageCircle className="h-6 w-6" />
                </button>
              </div>
            )} */}

            {/* Minimized Chatbot */}
            {/* {isChatMinimized && (
              <div className="fixed bottom-6 right-6 z-50 w-72">
                <div className="bg-blue-600 p-3 rounded-t-lg shadow-lg flex items-center justify-between">
                  <span className="text-white font-medium">DevConnect Assistant</span>
                  <div className="flex space-x-1">
                    <button
                      onClick={toggleChatbot}
                      className="text-white p-1 hover:bg-blue-700 rounded"
                      aria-label="Expand chatbot"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setIsChatbotOpen(false)}
                      className="text-white p-1 hover:bg-blue-700 rounded"
                      aria-label="Close chatbot"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )} */}

            {/* Full Chatbot Panel */}
            {/* {isChatbotOpen && !isChatMinimized && (
              <div className="fixed bottom-6 right-6 z-50 w-96 shadow-xl rounded-lg overflow-hidden flex flex-col border border-gray-700">
                <div className="flex justify-between items-center p-3 border-b border-gray-700 bg-gray-800 text-white">
                  <h2 className="text-lg font-semibold">DevConnect Assistant</h2>
                  <div className="flex space-x-1">
                    <button
                      onClick={minimizeChatbot}
                      className="text-gray-400 hover:text-white p-1 rounded"
                      aria-label="Minimize chatbot"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setIsChatbotOpen(false)}
                      className="text-gray-400 hover:text-white p-1 rounded"
                      aria-label="Close chatbot"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="h-96 bg-gray-900 overflow-hidden">
                  <Chatbot />
                </div>
              </div>
            )} */}
             <Link
                  className="fixed bottom-6 righthome-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition"
                  to={'/chat'}
                  aria-label="Open Chat"
                >
                  <MessageCircle className="w-6 h-6" />
                </Link>
          </div>
        </div>
        <div className='w-full'>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Layout;
