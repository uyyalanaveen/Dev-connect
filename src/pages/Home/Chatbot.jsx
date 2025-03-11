import React, { useState, useRef } from 'react';
import { flushSync } from 'react-dom';
import axios from 'axios';
import { Send, X, Minus } from 'lucide-react';
import Markdown from 'react-markdown';
import './chatbot.css'
// Placeholder for user and bot avatars - replace with actual imports
import UserIcon  from '../../assets/Profile.png';
import chatbotIcon from '../../assets/Logo.png'

// Sub-components
const ConversationDisplayArea = ({ data, streamdiv, answer }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4  text-white">
      {data?.length <= 0 ? (
        <div className="flex flex-col items-start mt-16">
          <p className="text-3xl font-bold text-gray-400">Hi,</p>
          <p className="text-3xl font-bold text-gray-400">How can I help you today?</p>
        </div>
      ) : null}

      {data.map((element, index) => (
        <div 
          key={index} 
          className={`flex items-start mb-4 ${element.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {element.role !== "user" && (
            <div className="flex-shrink-0 mr-3">
              <img 
                src={chatbotIcon} 
                alt="Bot" 
                className="w-8 h-8 rounded-full bg-blue-600"
              />
            </div>
          )}
          
          <div 
            className={`rounded-lg px-4 py-2 max-w-3/4 ${
              element.role === "user" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-800 text-white border border-gray-700"
            }`}
          >
            <div className="prose prose-invert">
              <Markdown>{element.parts[0].text}</Markdown>
            </div>
          </div>
          
          {element.role === "user" && (
            <div className="flex-shrink-0 ml-3">
              <img 
                src={UserIcon} 
                alt="User" 
                className="w-8 h-8 rounded-full " 
              />
            </div>
          )}
        </div>
      ))}

      <div id="checkpoint" className="h-1"></div>
    </div>
  );
};

const Header = ({ toggled, setToggled, onMinimize, onClose }) => {
  return (
    <div className="flex justify-between items-center p-3 text-white">
      {/* <h2 className="text-lg font-semibold">DevConnect Assistant</h2> */}
      
      <div className="flex items-center space-x-4 ">
        <h1 className='text-center font-bold  text-blue-700 text-[3rem] '>ChatBot</h1>
      </div>
    </div>
  );
};

const MessageInput = ({ inputRef, waiting, handleClick }) => {
  return (
    <div className="p-3 border-t border-gray-700 bg-gray-800">
      <div className="flex items-center bg-gray-700 rounded-lg overflow-hidden">
        <input
          type="text"
          className="flex-1 px-4 py-2 bg-gray-700 text-white focus:outline-none placeholder-gray-400"
          placeholder={waiting ? "Waiting for response..." : "Type a message..."}
          ref={inputRef}
          disabled={waiting}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !waiting) handleClick();
          }}
        />
        
        <button 
          className={`p-2 text-gray-400 hover:text-white ${waiting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          onClick={handleClick}
          disabled={waiting}
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};



function Chatbot({ onMinimize, onClose }) {
  const inputRef = useRef();
  const host = "https://devconnect-backend-6opy.onrender.com";
  const url = host + "/chat";
  const streamUrl = host + "/stream";
  const [data, setData] = useState([]);
  const [answer, setAnswer] = useState("");
  const [streamdiv, showStreamdiv] = useState(false);
  const [toggled, setToggled] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const is_stream = toggled;

  function executeScroll() {
    const element = document.getElementById('checkpoint');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function validationCheck(str) {
    return str === null || str.match(/^\s*$/) !== null;
  }

  const handleClick = () => {
    if (validationCheck(inputRef.current.value)) {
      console.log("Empty or invalid entry");
    } else {
      if (!is_stream) {
        handleNonStreamingChat();
      } else {
        handleStreamingChat();
      }
    }
  };

  const handleNonStreamingChat = async () => {
    const chatData = {
      chat: inputRef.current.value,
      history: data
    };

    const ndata = [...data,
      {"role": "user", "parts":[{"text": inputRef.current.value}]}];

    flushSync(() => {
      setData(ndata);
      inputRef.current.value = "";
      setWaiting(true);
    });

    executeScroll();

    let headerConfig = {
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        "Access-Control-Allow-Origin": "*",
      }
    };

    const fetchData = async() => {
      var modelResponse = "";
      try {
        const response = await axios.post(url, chatData, headerConfig);
        modelResponse = response.data.text;
      } catch (error) {
        modelResponse = "Error occurred";
      } finally {
        const updatedData = [...ndata,
          {"role": "model", "parts":[{"text": modelResponse}]}];

        flushSync(() => {
          setData(updatedData);
          setWaiting(false);
        });
        
        executeScroll();
      }
    };

    fetchData();
  };

  const handleStreamingChat = async () => {
    const chatData = {
      chat: inputRef.current.value,
      history: data
    };

    const ndata = [...data,
      {"role": "user", "parts":[{"text": inputRef.current.value}]}];

    flushSync(() => {
      setData(ndata);
      inputRef.current.value = "";
      setWaiting(true);
    });

    executeScroll();

    let headerConfig = {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    };

    const fetchStreamData = async() => {
      try {
        setAnswer("");
        const response = await fetch(streamUrl, {
          method: "post",
          headers: headerConfig,
          body: JSON.stringify(chatData),
        });

        if (!response.ok || !response.body) {
          throw response.statusText;
        }

        const reader = response.body.getReader();
        const txtdecoder = new TextDecoder();
        const loop = true;
        var modelResponse = "";
        
        showStreamdiv(true);

        while (loop) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          
          const decodedTxt = txtdecoder.decode(value, { stream: true });
          setAnswer((answer) => answer + decodedTxt);
          modelResponse = modelResponse + decodedTxt;
          executeScroll();
        }
      } catch (err) {
        modelResponse = "Error occurred";
      } finally {
        setAnswer("");
        
        const updatedData = [...ndata,
          {"role": "model", "parts":[{"text": modelResponse}]}];
          
        flushSync(() => {
          setData(updatedData);
          setWaiting(false);
        });
        
        showStreamdiv(false);
        executeScroll();
      }
    };
    
    fetchStreamData();
  };

  return (
    <div className="flex flex-col h-full  w-full overflow-hidden">
      <Header 
        toggled={toggled} 
        setToggled={setToggled} 
        onMinimize={onMinimize}
        onClose={onClose}
      />
      
      <ConversationDisplayArea 
        data={data} 
        streamdiv={streamdiv} 
        answer={answer} 
      />
      
      <MessageInput 
        inputRef={inputRef} 
        waiting={waiting} 
        handleClick={handleClick} 
      />
    </div>
  );
}

export default Chatbot;