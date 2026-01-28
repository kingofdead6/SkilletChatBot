// src/Chat.jsx
import { useState, useRef, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { NODE_API, PYTHON_API } from "../../api.js"; // assuming these are correct

export default function Chat() {
  const token = localStorage.getItem('token');

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false); // prevent multiple clicks

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Speech recognition
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
    if (!isLoading && !listening && currentChatId) {
      inputRef.current?.focus();
    }
  }, [isLoading, listening, currentChatId]);

  // Load chats on mount
  useEffect(() => {
    if (!token) {
      console.warn('No token found — user not logged in');
      return;
    }
    fetchChats();
  }, [token]);

  const fetchChats = async () => {
    try {
      const res = await fetch(`${NODE_API}/chats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch chats (${res.status})`);
      }

      const data = await res.json();
      setChats(data);

      // Auto-load most recent or create new
      if (data.length > 0) {
        loadChat(data[0]._id);
      } else {
        createNewChat();
      }
    } catch (err) {
      console.error('Fetch chats error:', err);
      setError(err.message);
    }
  };

  const createNewChat = async () => {
    if (isCreatingChat) return; // prevent spam
    setIsCreatingChat(true);
    setError(null);

    try {
      const res = await fetch(`${NODE_API}/chats/new`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to create chat (${res.status})`);
      }

      const data = await res.json();
      setCurrentChatId(data.chatId);
      setMessages([]);

      // Refresh list
      const updatedRes = await fetch(`${NODE_API}/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = await updatedRes.json();
      setChats(updated);
    } catch (err) {
      console.error('Create chat error:', err);
      setError(err.message);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const loadChat = async (chatId) => {
    try {
      const res = await fetch(`${NODE_API}/chats/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to load chat (${res.status})`);
      }

      const data = await res.json();
      setMessages(data.messages || []);
      setCurrentChatId(chatId);
      setIsSidebarOpen(false);
      setError(null);
    } catch (err) {
      console.error('Load chat error:', err);
      setError(err.message);
    }
  };

  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      if (!browserSupportsSpeechRecognition || !isMicrophoneAvailable) {
        alert('Voice input not supported or mic blocked.');
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
      const res = await fetch(`${PYTHON_API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          session_id: currentChatId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
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
      console.error(err);
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

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Chats</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={createNewChat}
            disabled={isCreatingChat || isLoading}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mb-4 transition ${
              isCreatingChat ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isCreatingChat ? 'Creating...' : '+ New Chat'}
          </button>

          <ul className="space-y-2 max-h-[70vh] overflow-y-auto">
            {chats.length === 0 && (
              <li className="text-gray-500 p-3">No chats yet</li>
            )}
            {chats.map((chat) => (
              <li
                key={chat._id}
                onClick={() => loadChat(chat._id)}
                className={`p-3 rounded cursor-pointer transition ${
                  currentChatId === chat._id
                    ? 'bg-gray-700 text-white'
                    : 'hover:bg-gray-800 text-gray-300'
                }`}
              >
                {chat.title || `Chat ${new Date(chat.createdAt).toLocaleDateString()}`}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden text-2xl mr-4"
          >
            ☰
          </button>
          <h1 className="text-xl font-semibold flex-1 text-center lg:text-left">
            Chat with AI
          </h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-24">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="text-lg mb-2">Start a conversation</p>
              <p className="text-sm opacity-70">Type or speak your message</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex mb-5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-800 text-gray-100 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className="text-xs opacity-50 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start mb-5">
              <div className="bg-gray-800 rounded-2xl px-5 py-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}

          {error && <div className="text-center text-red-400 py-4">{error}</div>}

          {listening && (
            <div className="text-center text-blue-400 py-2 animate-pulse">
              Listening... {transcript && `(${transcript})`}
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        <footer className="bg-gray-900 border-t border-gray-800 p-4 fixed bottom-0 left-0 right-0 lg:left-72">
          <div className="max-w-4xl mx-auto flex gap-3 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={listening ? 'Listening...' : 'Type or speak your message...'}
              disabled={isLoading || listening || !currentChatId}
              className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-full px-5 py-3 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />

            <button
              type="button"
              onClick={toggleListening}
              disabled={isLoading || !currentChatId}
              className={`p-3 rounded-full transition-colors ${
                listening ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              title={listening ? 'Stop listening' : 'Start voice input'}
            >
              {listening ? '⏹' : '🎤'}
            </button>

            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim() || !currentChatId}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}