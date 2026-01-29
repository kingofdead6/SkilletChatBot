// src/Chat.jsx
import { useState, useRef, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { NODE_API } from "../../../api.js";
import Sidebar from './sideBar.jsx';
import { TypeAnimation } from 'react-type-animation';

export default function Chat() {
  const email = sessionStorage.getItem('email');

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript && listening) setInput(transcript);
  }, [transcript, listening]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isLoading && !listening && currentChatId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading, listening, currentChatId]);

  // Mobile-only keyboard handling
  useEffect(() => {
    // Only run on mobile/touch devices
    if (!('visualViewport' in window) || window.innerWidth >= 1024) return;

    const handleResize = () => {
      const vh = window.visualViewport.height;
      document.documentElement.style.setProperty('--vh-mobile', `${vh}px`);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    handleResize();

    return () => {
      window.visualViewport.removeEventListener('resize', handleResize);
      window.visualViewport.removeEventListener('scroll', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!email) {
      setError("Please log in first");
      return;
    }
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const res = await fetch(`${NODE_API}/chats`, {
        headers: { 'x-user-email': email },
      });

      if (!res.ok) throw new Error(await res.text() || 'Failed to load chats');

      const data = await res.json();
      setChats(data);

      if (data.length > 0) {
        loadChat(data[0]._id);
      } else {
        createNewChat();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Couldn't load chats");
    }
  };

  const createNewChat = async () => {
    if (isCreatingChat) return;
    setIsCreatingChat(true);
    setError(null);

    try {
      const res = await fetch(`${NODE_API}/chats/new`, {
        method: 'POST',
        headers: { 'x-user-email': email },
      });

      if (!res.ok) throw new Error(await res.text() || 'Failed to create chat');

      const { chatId } = await res.json();
      setCurrentChatId(chatId);
      setMessages([]);

      await fetchChats();
    } catch (err) {
      setError(err.message || 'Failed to create new chat');
    } finally {
      setIsCreatingChat(false);
    }
  };

  const loadChat = async (chatId) => {
    try {
      const res = await fetch(`${NODE_API}/chats/${chatId}`, {
        headers: { 'x-user-email': email },
      });

      if (!res.ok) throw new Error(await res.text() || 'Failed to load chat');

      const data = await res.json();
      setMessages(data.messages || []);
      setCurrentChatId(chatId);
      setIsSidebarOpen(false);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load chat');
    }
  };

  const deleteChat = async (chatId) => {
    if (!window.confirm('Delete this chat permanently?')) return;

    try {
      const res = await fetch(`${NODE_API}/chats/${chatId}`, {
        method: 'DELETE',
        headers: { 'x-user-email': email },
      });

      if (!res.ok) throw new Error(await res.text() || 'Delete failed');

      setChats((prev) => prev.filter((c) => c._id !== chatId));

      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
        createNewChat();
      }
    } catch (err) {
      setError('Could not delete chat: ' + err.message);
    }
  };

  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      if (!browserSupportsSpeechRecognition || !isMicrophoneAvailable) {
        alert('Voice input not supported or microphone access denied.');
        return;
      }
      resetTranscript();
      setInput('');
      SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
    }
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !currentChatId) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const hfToken = localStorage.getItem('hf_api_token');

      const res = await fetch(`${NODE_API}/chats/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': email,
        },
        body: JSON.stringify({
          chatId: currentChatId,
          message: trimmed,
          hf_token: hfToken || undefined,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Server error ${res.status}`);
      }

      const data = await res.json();

      const botMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response || 'No response received',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('sendMessage error:', err);
      const errorMsg = err.message || 'Something went wrong';
      setError(errorMsg);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `⚠️ ${errorMsg}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <h2 className="text-2xl mb-4">Please log in to continue</h2>
          <a href="/login" className="text-blue-500 underline">Go to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className=" bg-gray-950 text-gray-100 flex flex-col">
      {/* Sidebar */}
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={loadChat}
        onNewChat={createNewChat}
        isSidebarOpen={isSidebarOpen}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        isCreatingChat={isCreatingChat}
        isLoading={isLoading}
        onDeleteChat={deleteChat}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-72 mb-20 lg:-mt-210">
        {/* Header */}
        <header className="bg-gray-900/90 backdrop-blur-md border-b border-blue-800/50 px-5 py-4 flex items-center sticky top-0 z-40">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-3xl mr-5 lg:hidden text-blue-400 hover:text-blue-300 transition"
          >
            ☰
          </button>
          <h2 className="text-2xl font-bold text-center tracking-tight bg-gradient-to-r from-blue-400 to-red-500 bg-clip-text text-transparent">
              Skillet
            </h2>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
              <p className="text-xl mb-3">Start typing or speak to begin</p>
              <p className="text-sm opacity-70">Your conversation will appear here</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3.5
                  border border-opacity-50 backdrop-blur-sm shadow-lg
                  ${msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-800/70 to-blue-600/70 border-blue-400/60 text-white rounded-br-none shadow-blue-500/30'
                    : 'bg-gradient-to-br from-gray-900/85 to-black/85 border-red-500/40 text-gray-100 rounded-bl-none shadow-red-600/20'
                  }
                `}
              >
                {msg.role === 'assistant' ? (
                  <TypeAnimation
                    sequence={[msg.content, () => {}]}
                    wrapper="div"
                    speed={82}
                    cursor={true}
                    repeat={0}
                    className="whitespace-pre-wrap break-words leading-relaxed"
                  />
                ) : (
                  <div className="whitespace-pre-wrap break-words leading-relaxed">
                    {msg.content}
                  </div>
                )}

                <div className="text-xs opacity-60 mt-2 text-right font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl px-6 py-4 border border-blue-700/40 shadow-blue-600/20">
                <div className="flex space-x-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-red-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center text-red-400 py-5 font-medium">
              ⚠️ {error}
            </div>
          )}

          {listening && (
            <div className="text-center text-blue-400 py-4 font-medium">
              Listening... {transcript && `(${transcript})`}
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        {/* Input Footer - mobile keyboard aware */}
        <footer
          className={`
            bg-gray-900/90 backdrop-blur-xl border-t border-blue-800/50 p-4
            fixed bottom-0 left-0 right-0 lg:left-72 z-50
            transition-all duration-200
          `}
          
        >
          <div className="md:max-w-5xl max-w-lg mx-auto flex gap-3 items-center z-20">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={listening ? 'Listening...' : 'Type your message...'}
              disabled={isLoading || listening || !currentChatId}
              className="
                flex-1 bg-gray-800/70 text-white border border-blue-700/50 rounded-full
                px-6 py-4 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600/40
                disabled:opacity-50 transition-all shadow-inner
              "
            />

            <button
              type="button"
              onClick={toggleListening}
              disabled={isLoading || !currentChatId}
              className={`
                p-4 rounded-full transition-all transform cursor-pointer 
                ${listening
                  ? 'bg-red-600 hover:bg-red-700 scale-105 shadow-red-600/50'
                  : 'bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 shadow-blue-600/40'
                }
                text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
              `}
              title={listening ? 'Stop listening' : 'Voice input'}
            >
              {listening ? '⏹' : '🎤'}
            </button>

            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim() || !currentChatId}
              className="
                bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 cursor-pointer 
                text-white px-4 py-4 rounded-full font-semibold transition-all shadow-lg shadow-red-600/40
                disabled:opacity-50 disabled:cursor-not-allowed 
              "
            >
              ✔️
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}