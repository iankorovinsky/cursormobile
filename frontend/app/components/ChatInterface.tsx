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
    <div className="flex h-screen bg-[#1e1e1e] overflow-hidden">
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
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#333] bg-[#252526]">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-[#3e3e42] rounded-md transition-colors"
            aria-label="Toggle sidebar"
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="text-sm font-medium text-[#cccccc] truncate flex-1">
            {currentChat?.title || 'New Chat'}
          </h1>
        </div>

        {/* Messages Area */}
        <ChatMessages chatId={currentChatId} />

        {/* Input Area */}
        <ChatInput />
      </div>
    </div>
  );
}
