'use client';

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  chats: Chat[];
  currentChatId: string;
  onSelectChat: (id: string) => void;
}

export default function ChatSidebar({ isOpen, onClose, chats, currentChatId, onSelectChat }: ChatSidebarProps) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          w-72 bg-[#252526] border-r border-[#333]
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
          <h2 className="text-sm font-semibold text-[#cccccc]">Chats</h2>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-[#3e3e42] rounded-md transition-colors"
            aria-label="Close sidebar"
          >
            <svg
              className="w-5 h-5 text-[#cccccc]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-3 py-3 border-b border-[#333]">
          <button className="w-full flex items-center gap-2 px-3 py-2 bg-[#0e639c] hover:bg-[#1177bb] rounded-md transition-colors text-sm text-white font-medium">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Chat
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`
                w-full px-4 py-3 text-left border-b border-[#333]
                hover:bg-[#2a2d2e] transition-colors
                ${currentChatId === chat.id ? 'bg-[#37373d]' : ''}
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-[#cccccc] truncate">
                    {chat.title}
                  </h3>
                  <p className="text-xs text-[#888888] truncate mt-1">
                    {chat.lastMessage}
                  </p>
                </div>
                <span className="text-xs text-[#888888] whitespace-nowrap">
                  {chat.timestamp}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
