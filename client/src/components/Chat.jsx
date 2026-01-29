// src/Chat.jsx
import { useState, useRef, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { NODE_API } from "../../api.js";
import Sidebar from './sideBar.jsx';

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
    if (!isLoading && !listening && currentChatId) {
      inputRef.current?.focus();
    }
  }, [isLoading, listening, currentChatId]);

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
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      {/* Sidebar Component */}
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col transition-all duration-300">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center sticky top-0 z-40">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-2xl mr-4 lg:hidden"
          >
            ☰
          </button>
          <h1 className="text-xl font-semibold flex-1 text-center lg:text-left">
            Chat with AI
          </h1>
        </header>

        {/* Messages */}
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
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                <div className="text-xs opacity-50 mt-1 text-right">
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
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-200"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-400"></div>
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

        {/* Input Footer */}
        <footer className="bg-gray-900 border-t border-gray-800 p-4 fixed bottom-0 left-0 right-0 lg:left-72">
          <div className="max-w-4xl mx-auto flex gap-3 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={listening ? 'Listening...' : 'Type your message...'}
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
              title={listening ? 'Stop listening' : 'Voice input'}
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