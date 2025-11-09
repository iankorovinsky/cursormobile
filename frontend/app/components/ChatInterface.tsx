'use client';

import { useState } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

export default function ChatInterface() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState('1');

  // Hardcoded chat data for now
  const chats = [
    { id: '1', title: 'React Component Help', lastMessage: 'How do I use useEffect?', timestamp: '2m ago' },
    { id: '2', title: 'TypeScript Types', lastMessage: 'Help with generic types', timestamp: '1h ago' },
    { id: '3', title: 'API Integration', lastMessage: 'Fetching data from REST API', timestamp: '3h ago' },
    { id: '4', title: 'CSS Styling', lastMessage: 'Tailwind responsive design', timestamp: '1d ago' },
  ];

  const currentChat = chats.find(chat => chat.id === currentChatId);

  return (
    <div className="flex h-screen bg-[#1C1C1C] overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={(id) => {
          setCurrentChatId(id);
          setIsSidebarOpen(false);
        }}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#333333] bg-[#1C1C1C]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-1.5 hover:bg-[#2A2A2A] rounded transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg
                className="w-5 h-5 text-[#CCCCCC]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-sm text-[#CCCCCC] truncate">
              {currentChat?.title || 'New Chat'}
            </h1>
          </div>

          <div className="flex items-center gap-1">
            <button
              className="p-1.5 hover:bg-[#2A2A2A] rounded transition-colors text-[#808080] hover:text-[#CCCCCC]"
              aria-label="New chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              className="p-1.5 hover:bg-[#2A2A2A] rounded transition-colors text-[#808080] hover:text-[#CCCCCC]"
              aria-label="History"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              className="p-1.5 hover:bg-[#2A2A2A] rounded transition-colors text-[#808080] hover:text-[#CCCCCC]"
              aria-label="More options"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <ChatMessages chatId={currentChatId} />

        {/* Input Area */}
        <ChatInput />
      </div>
    </div>
  );
}
