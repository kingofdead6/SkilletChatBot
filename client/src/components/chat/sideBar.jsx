// src/components/Sidebar.jsx
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

  const handleLogout = () => {
    sessionStorage.removeItem('email');
    navigate('/');
    window.location.reload();
  };

  return (
    <>
      <aside
        className={`
          fixed inset-y-0 left-0 z-200 w-72 
          bg-gradient-to-b from-gray-950 via-black to-gray-900
          border-r border-blue-900/40
          transform transition-transform duration-300 ease-out
          lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          shadow-2xl shadow-black/60
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-5 border-b border-blue-900/30 flex items-center justify-between bg-black/40 backdrop-blur-sm">
            <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-red-500 bg-clip-text text-transparent">
              Skillet
            </h2>
            <button
              onClick={onCloseSidebar}
              className="lg:hidden text-red-400 hover:text-red-300 text-2xl transition-transform hover:scale-110"
            >
              ✕
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-5 border-b border-blue-900/20">
            <button
              onClick={onNewChat}
              disabled={isCreatingChat || isLoading}
              className={`
                w-full py-3.5 px-5 rounded-xl font-semibold text-lg tracking-wide transition-all duration-200
                shadow-lg cursor-pointer 
                ${isCreatingChat || isLoading
                  ? 'bg-blue-950/50 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-600 hover:to-blue-800 text-white shadow-blue-900/40 hover:shadow-blue-700/60 hover:scale-[1.02]'
                }
              `}
            >
              {isCreatingChat ? 'Creating...' : '+ New Chat'}
            </button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-2">
            {chats.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm italic">
                No chats yet — start a new one
              </div>
            ) : (
              <ul className="space-y-1.5">
                {chats.map((chat) => (
                  <li
                    key={chat._id}
                    onClick={() => onSelectChat(chat._id)}
                    className={`
                      group flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200
                      border border-transparent
                      ${currentChatId === chat._id
                        ? 'bg-gradient-to-r from-blue-950/70 to-indigo-950/70 border-blue-600/40 text-white shadow-md shadow-blue-900/30'
                        : 'hover:bg-gray-900/70 hover:border-blue-800/40 text-gray-200 hover:shadow-lg'
                      }
                    `}
                  >
                    <span className="truncate flex-1 font-medium">
                      {chat.title || `Chat ${new Date(chat.createdAt).toLocaleDateString()}`}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat._id);
                      }}
                      className="
                        opacity-0 group-hover:opacity-100 
                        text-red-500 hover:text-red-400 
                        transition-all duration-200 p-2 rounded-full
                        hover:bg-red-950/40
                      "
                      title="Delete chat"
                    >
                      🗑
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="p-5 border-t border-blue-900/30 bg-black/40 backdrop-blur-sm mt-auto">
            <button
              onClick={() => navigate('/settings')}
              className="
                w-full flex items-center justify-center gap-3 py-3.5 px-5 mb-3 cursor-pointer 
                bg-gradient-to-r from-gray-800 to-gray-900 
                hover:from-gray-700 hover:to-gray-800
                border border-blue-800/40 hover:border-blue-600/60
                rounded-xl text-blue-300 font-medium transition-all duration-200
                shadow-inner hover:shadow-blue-900/30
              "
            >
              <span className="text-lg">⚙️</span> Settings
            </button>

            <button
              onClick={handleLogout}
              className="
                w-full flex items-center justify-center gap-3 py-3.5 px-5 cursor-pointer 
                bg-gradient-to-r from-red-900/80 to-red-800/80
                hover:from-red-800 hover:to-red-700
                border border-red-700/40 hover:border-red-500/60
                rounded-xl text-white font-semibold transition-all duration-200
                shadow-inner hover:shadow-red-900/40
              "
            >
              <span className="text-lg">🚪</span> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseSidebar}
        />
      )}
    </>
  );
}