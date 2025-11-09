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
          w-72 bg-[#1C1C1C] border-r border-[#333333]
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#333333]">
          <h2 className="text-sm text-[#CCCCCC]">Chats</h2>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 hover:bg-[#2A2A2A] rounded transition-colors text-[#808080] hover:text-[#CCCCCC]"
            aria-label="Close sidebar"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 border-b border-[#333333]">
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-[#333333] hover:bg-[#2A2A2A] rounded transition-colors text-xs text-[#CCCCCC]">
            <svg
              className="w-3.5 h-3.5"
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
                w-full px-3 py-2.5 text-left
                hover:bg-[#2A2A2A] transition-colors
                ${currentChatId === chat.id ? 'bg-[#2D2D2D]' : ''}
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm text-[#CCCCCC] truncate">
                    {chat.title}
                  </h3>
                  <p className="text-xs text-[#6B6B6B] truncate mt-0.5">
                    {chat.lastMessage}
                  </p>
                </div>
                <span className="text-xs text-[#6B6B6B] whitespace-nowrap mt-0.5">
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
