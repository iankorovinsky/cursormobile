'use client';

import { useState } from 'react';

interface CodeBlockProps {
  title?: string;
  code: string;
  language?: string;
  showCancel?: boolean;
}

export default function CodeBlock({ title, code, language = 'bash', showCancel = false }: CodeBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="rounded-lg border border-[#333333] bg-[#242424] overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#2D2D2D] border-b border-[#333333]">
          <span className="text-xs text-[#808080]">{title}</span>
          <div className="flex items-center gap-2">
            {showCancel && (
              <button className="flex items-center gap-1 text-xs text-[#808080] hover:text-[#CCCCCC] transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[#808080] hover:text-[#CCCCCC] transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      )}
      {isExpanded && (
        <div className="p-4 overflow-x-auto">
          <pre className="text-sm">
            <code className={`language-${language} text-[#CCCCCC] font-mono`}>
              {code}
            </code>
          </pre>
        </div>
      )}
    </div>
  );
}
