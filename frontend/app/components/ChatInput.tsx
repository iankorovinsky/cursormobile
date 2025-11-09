'use client';

import { useState, useRef, useEffect } from 'react';

export default function ChatInput() {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-[#333] bg-[#1e1e1e] p-4">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="relative bg-[#2d2d30] rounded-lg border border-[#3e3e42] focus-within:border-[#0e639c] transition-colors">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question or type '/' for commands..."
            className="
              w-full px-4 py-3 pr-12 bg-transparent text-[#cccccc]
              placeholder-[#858585] resize-none outline-none
              max-h-48 min-h-[44px] text-sm leading-6
            "
            rows={1}
          />

          <button
            type="submit"
            disabled={!message.trim()}
            className={`
              absolute right-2 bottom-2 p-2 rounded-md transition-colors
              ${message.trim()
                ? 'bg-[#0e639c] hover:bg-[#1177bb] text-white'
                : 'bg-[#3e3e42] text-[#656565] cursor-not-allowed'
              }
            `}
            aria-label="Send message"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 mt-2 px-1">
          <button
            type="button"
            className="text-xs text-[#888888] hover:text-[#cccccc] transition-colors"
          >
            <svg
              className="w-4 h-4 inline-block mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
            Attach
          </button>
          <span className="text-xs text-[#656565]">
            Shift + Enter for new line
          </span>
        </div>
      </form>
    </div>
  );
}
