// src/components/Sidebar.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  isSidebarOpen,
  onCloseSidebar,
  isCreatingChat,
  isLoading,
  onDeleteChat,
}) {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem('email');
    navigate('/');
    window.location.reload();
  };

  return (
    <>
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 border-r border-gray-800
          transform transition-transform duration-300 ease-in-out
          lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Chats</h2>
            <button
              onClick={onCloseSidebar}
              className="lg:hidden text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <button
              onClick={onNewChat}
              disabled={isCreatingChat || isLoading}
              className={`w-full py-2.5 px-4 rounded font-medium transition ${
                isCreatingChat || isLoading
                  ? 'bg-blue-800 opacity-50 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isCreatingChat ? 'Creating...' : '+ New Chat'}
            </button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {chats.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No chats yet</p>
            ) : (
              <ul className="space-y-1">
                {chats.map((chat) => (
                  <li
                    key={chat._id}
                    onClick={() => onSelectChat(chat._id)}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition ${
                      currentChatId === chat._id
                        ? 'bg-gray-700 text-white'
                        : 'hover:bg-gray-800 text-gray-300'
                    }`}
                  >
                    <span className="truncate flex-1">
                      {chat.title || `Chat ${new Date(chat.createdAt).toLocaleDateString()}`}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat._id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition p-1 text-sm"
                      title="Delete chat"
                    >
                      🗑
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Bottom section: Settings + Logout */}
          <div className="p-4 border-t border-gray-800 mt-auto">
            <button
              onClick={() => navigate('/settings')}   // instead of modal
              className="w-full flex items-center justify-center gap-2 py-3 px-4 mb-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition text-gray-200"
            >
              ⚙️ Settings
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-600/80 hover:bg-red-700 rounded-lg transition text-white font-medium"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseSidebar}
        />
      )}

    </>
  );
}