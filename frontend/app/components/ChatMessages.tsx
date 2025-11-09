'use client';

import { useEffect, useRef } from 'react';
import ThinkingBlock from './ThinkingBlock';
import CodeBlock from './CodeBlock';
import TodoList from './TodoList';
import type { Message } from '../hooks/useWebSocket';

interface ChatMessagesProps {
  chatId: string;
  messages: Message[];
}

export default function ChatMessages({ chatId, messages }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#1C1C1C]">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-[#808080] text-sm">
            <div className="text-center space-y-2">
              <p>No messages yet.</p>
              <p className="text-xs">Send a message to get started!</p>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={message.id} className="space-y-2">
            {message.type === 'prompt' ? (
              /* User Message */
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <div className="text-[#CCCCCC] font-medium text-base flex-1">
                    {message.text}
                  </div>
                  <span className="text-[#808080] text-xs">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
              </div>
            ) : (
              /* Assistant Response */
              <div className="space-y-3">
                <div className="text-[#CCCCCC] text-sm leading-relaxed whitespace-pre-wrap">
                  {message.text}
                </div>
                {message.metadata?.thinking && (
                  <ThinkingBlock
                    icon="🤔"
                    text={message.metadata.thinking}
                  />
                )}
                {message.metadata?.code && (
                  <CodeBlock
                    title={message.metadata.codeTitle || 'Code'}
                    code={message.metadata.code}
                    language={message.metadata.language || 'text'}
                  />
                )}
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
