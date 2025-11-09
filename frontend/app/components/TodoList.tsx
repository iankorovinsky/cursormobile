'use client';

import { useState } from 'react';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoListProps {
  items: TodoItem[];
}

export default function TodoList({ items }: TodoListProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const completedCount = items.filter(item => item.completed).length;

  return (
    <div className="rounded-lg border border-[#333333] bg-[#242424] overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#2A2A2A] transition-colors"
      >
        <div className="flex items-center gap-2 text-sm text-[#808080]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>To-dos {completedCount}/{items.length}</span>
        </div>
        <svg
          className={`w-4 h-4 text-[#808080] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-3 space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 group">
              <div className="flex-shrink-0 mt-0.5">
                {item.completed ? (
                  <div className="w-4 h-4 rounded-full bg-[#007ACC] flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-[#808080] group-hover:border-[#CCCCCC] transition-colors" />
                )}
              </div>
              <span className={`text-sm flex-1 ${item.completed ? 'text-[#808080] line-through' : 'text-[#CCCCCC]'}`}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
