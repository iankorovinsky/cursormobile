'use client';

import { useEffect, useRef } from 'react';
import ThinkingBlock from './ThinkingBlock';
import CodeBlock from './CodeBlock';
import TodoList from './TodoList';

interface ChatMessagesProps {
  chatId: string;
}

export default function ChatMessages({ chatId }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-[#1C1C1C]">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* User Message */}
        <div className="space-y-2">
          <div className="text-[#CCCCCC] font-medium text-base">
            testing
          </div>
        </div>

        {/* Assistant Response */}
        <div className="space-y-4">
          {/* Thinking Section */}
          <div>
            <p className="text-[#CCCCCC] text-sm leading-relaxed mb-3">
              Reviewing the project structure and existing setup to determine what to test.
            </p>
            <ThinkingBlock
              icon="📁"
              text="Explored 2 files 2 searches"
            />
          </div>

          <p className="text-[#CCCCCC] text-sm leading-relaxed">
            No test files found. Checking components to understand what we're working with:
          </p>

          <ThinkingBlock
            icon="📁"
            text="Explored 3 files"
          />

          <p className="text-[#CCCCCC] text-sm leading-relaxed">
            Setting up Jest and React Testing Library, and adding basic tests for the components.
          </p>

          {/* Todo List */}
          <TodoList
            items={[
              { id: '1', text: 'Install testing dependencies (Jest, React Testing Library, etc.)', completed: true },
              { id: '2', text: 'Configure Jest for Next.js', completed: false },
              { id: '3', text: 'Create test files for components', completed: false },
              { id: '4', text: 'Add test script to package.json', completed: false },
            ]}
          />

          <ThinkingBlock
            icon="��"
            text="Explored 2 files"
          />

          <p className="text-[#CCCCCC] text-sm leading-relaxed">
            Installing testing dependencies and setting up the testing framework:
          </p>

          {/* Code Block */}
          <CodeBlock
            title="Running command: cd, npm install"
            code={`$ cd /Users/yfengz/Coding/cursormobile/frontend && npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom @types/jest`}
            language="bash"
            showCancel={true}
          />
        </div>

        {/* Streaming message example */}
        <div className="space-y-3 mt-6 pb-4 border-t border-[#333333] pt-6">
          <div className="text-[#CCCCCC] font-medium text-base">
            Add a login page
          </div>

          <div className="space-y-3">
            <p className="text-[#CCCCCC] text-sm leading-relaxed">
              Creating a login page with authentication form
            </p>

            <ThinkingBlock
              icon="🔍"
              text="Exploring authentication patterns"
              isAnimating={true}
            />
          </div>
        </div>

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
