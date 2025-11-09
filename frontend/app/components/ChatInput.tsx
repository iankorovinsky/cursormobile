'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isConnected: boolean;
}

export default function ChatInput({ onSendMessage, isConnected }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState('Auto');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isSending) {
      setIsSending(true);
      try {
        await onSendMessage(message.trim());
        setMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-[#333333] bg-[#1C1C1C] pb-[env(safe-area-inset-bottom)]">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
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
              text-sm sm:text-base leading-6
            "
            rows={1}
            style={{ minHeight: '42px', maxHeight: '200px' }}
          />

          <button
            type="submit"
            disabled={!message.trim() || !isConnected || isSending}
            className={`
              absolute right-2 bottom-2 p-2 rounded-md transition-all
              ${message.trim() && isConnected && !isSending
                ? 'bg-white hover:bg-gray-200 text-black'
                : 'text-[#656565] cursor-not-allowed'
              }
            `}
            aria-label={isSending ? 'Sending...' : 'Send message'}
            title={!isConnected ? 'Not connected to server' : ''}
          >
            {isSending ? (
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="60" strokeDashoffset="20" />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
              </svg>
            )}
          </button>
        </div>

        {/* Bottom toolbar - simplified for mobile */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Agent selector - hidden on small screens */}
            <button
              type="button"
              className="hidden sm:flex items-center gap-1 text-xs text-[#808080] hover:text-[#CCCCCC] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="hidden md:inline">Agent</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Mode selector */}
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-[#808080] hover:text-[#CCCCCC] transition-colors"
            >
              <span className="hidden sm:inline">{mode}</span>
              <span className="sm:hidden">Auto</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Action buttons - reduced on mobile */}
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
