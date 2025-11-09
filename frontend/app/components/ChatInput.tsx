'use client';

import { useState, useRef, useEffect } from 'react';

export default function ChatInput() {
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState('Auto');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
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
    <div className="border-t border-[#333333] bg-[#1C1C1C]">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-3">
        <div className="relative rounded-lg border border-[#333333] bg-[#242424] focus-within:border-[#007ACC] transition-colors">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a follow-up..."
            className="
              w-full px-3 py-3 pr-12 bg-transparent text-[#CCCCCC]
              placeholder-[#6B6B6B] resize-none outline-none
              text-sm leading-6
            "
            rows={1}
            style={{ minHeight: '42px', maxHeight: '200px' }}
          />

          <button
            type="submit"
            disabled={!message.trim()}
            className={`
              absolute right-2 bottom-2 p-2 rounded-md transition-all
              ${message.trim()
                ? 'bg-white hover:bg-gray-200 text-black'
                : 'text-[#656565] cursor-not-allowed'
              }
            `}
            aria-label="Send message"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
            </svg>
          </button>
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-3">
            {/* Agent selector */}
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-[#808080] hover:text-[#CCCCCC] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Agent
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Mode selector */}
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-[#808080] hover:text-[#CCCCCC] transition-colors"
            >
              {mode}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Action buttons */}
            <button
              type="button"
              className="p-1.5 text-[#808080] hover:text-[#CCCCCC] transition-colors"
              aria-label="Mention"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </button>
            <button
              type="button"
              className="p-1.5 text-[#808080] hover:text-[#CCCCCC] transition-colors"
              aria-label="Web search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </button>
            <button
              type="button"
              className="p-1.5 text-[#808080] hover:text-[#CCCCCC] transition-colors"
              aria-label="Attach image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
