'use client';

import { useEffect, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatMessagesProps {
  chatId: string;
}

export default function ChatMessages({ chatId }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hardcoded messages for demo
  const messages: Message[] = [
    {
      id: '1',
      role: 'user',
      content: 'How do I use useEffect in React?',
      timestamp: '10:30 AM',
    },
    {
      id: '2',
      role: 'assistant',
      content: `The useEffect hook in React allows you to perform side effects in functional components. Here's a basic example:

\`\`\`javascript
import { useEffect, useState } from 'react';

function MyComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // This runs after render
    fetchData().then(setData);

    // Cleanup function (optional)
    return () => {
      // Cleanup code here
    };
  }, []); // Dependencies array

  return <div>{data}</div>;
}
\`\`\`

The dependency array controls when the effect runs:
- Empty array [] = runs once on mount
- No array = runs on every render
- [value] = runs when value changes`,
      timestamp: '10:31 AM',
    },
    {
      id: '3',
      role: 'user',
      content: 'Can you show me an example with cleanup?',
      timestamp: '10:32 AM',
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className={`
                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                ${message.role === 'user'
                  ? 'bg-[#0e639c] text-white'
                  : 'bg-[#3e3e42] text-[#cccccc]'
                }
              `}
            >
              {message.role === 'user' ? 'U' : 'AI'}
            </div>

            {/* Message Content */}
            <div
              className={`
                flex-1 min-w-0
                ${message.role === 'user' ? 'flex flex-col items-end' : ''}
              `}
            >
              <div
                className={`
                  px-4 py-3 rounded-lg max-w-[85%] sm:max-w-[75%]
                  ${message.role === 'user'
                    ? 'bg-[#0e639c] text-white'
                    : 'bg-[#2d2d30] text-[#cccccc]'
                  }
                `}
              >
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              </div>
              <div className="text-xs text-[#858585] mt-1 px-1">
                {message.timestamp}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
