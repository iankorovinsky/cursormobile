'use client';

import AuthButton from './AuthButton';

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

        {/* Upgrade to Pro Section */}
        <div className="p-3 border-t border-[#333333] bg-gradient-to-b from-transparent to-[#1A1A1A]">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-3 mb-2">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-semibold text-white">Pro Features</span>
            </div>
            <p className="text-xs text-blue-100 mb-2">
              Unlock unlimited conversations and premium features
            </p>
            <button
              onClick={() => {
                const event = new CustomEvent('openStripeCheckout');
                window.dispatchEvent(event);
              }}
              className="w-full bg-white text-blue-700 font-semibold py-2 px-3 rounded text-xs hover:bg-blue-50 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </div>

        {/* Auth Button at bottom */}
        <AuthButton />
      </div>
    </>
  );
}
