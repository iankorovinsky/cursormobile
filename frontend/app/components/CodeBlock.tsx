'use client';

import { useState } from 'react';

interface CodeBlockProps {
  title?: string;
  code: string;
  language?: string;
  showCancel?: boolean;
}

export default function CodeBlock({ title, code, language = 'text', showCancel = false }: CodeBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Simple syntax highlighting for common patterns (basic implementation)
  const highlightCode = (code: string, lang: string): string => {
    if (lang === 'text' || !code) return code;
    
    // Basic keyword highlighting (very simple, could be enhanced with a library)
    const keywords: Record<string, RegExp[]> = {
      javascript: [
        /\b(const|let|var|function|return|if|else|for|while|class|extends|import|export|async|await|try|catch|finally|throw|new|this|super)\b/g,
        /(["'`])(?:(?=(\\?))\2.)*?\1/g, // strings
        /\/\/.*$/gm, // comments
        /\/\*[\s\S]*?\*\//g, // block comments
      ],
      python: [
        /\b(def|class|if|elif|else|for|while|try|except|finally|raise|return|import|from|as|with|async|await|lambda|None|True|False)\b/g,
        /(["'])(?:(?=(\\?))\2.)*?\1/g, // strings
        /#.*$/gm, // comments
      ],
      typescript: [
        /\b(const|let|var|function|return|if|else|for|while|class|extends|import|export|async|await|try|catch|finally|throw|new|this|super|interface|type|enum|namespace)\b/g,
        /(["'`])(?:(?=(\\?))\2.)*?\1/g, // strings
        /\/\/.*$/gm, // comments
        /\/\*[\s\S]*?\*\//g, // block comments
      ],
    };

    let highlighted = code;
    const langKeywords = keywords[lang];
    if (langKeywords) {
      // For now, just return the code as-is (proper highlighting would require a library)
      // This is a placeholder for future enhancement
      return code;
    }
    
    return highlighted;
  };

  return (
    <div className="rounded-lg border border-[#333333] bg-[#242424] overflow-hidden my-2">
      {title && (
        <div className="flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-2 bg-[#2D2D2D] border-b border-[#333333]">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
            <span className="text-xs text-[#808080] font-mono truncate">{title}</span>
            {language && language !== 'text' && (
              <span className="hidden sm:inline text-xs text-[#666666] px-2 py-0.5 rounded bg-[#1A1A1A]">
                {language}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-[#808080] hover:text-[#CCCCCC] transition-colors px-1.5 sm:px-2 py-1 rounded hover:bg-[#333333]"
              title="Copy code"
            >
              {copied ? (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>
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
              className="text-[#808080] hover:text-[#CCCCCC] transition-colors p-1"
              title={isExpanded ? 'Collapse' : 'Expand'}
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
        <div className="relative">
          <div className="p-2 sm:p-4 overflow-x-auto bg-[#1A1A1A]">
            <pre className="text-xs sm:text-sm leading-relaxed">
              <code className={`language-${language} text-[#E5E5E5] font-mono whitespace-pre`}>
                {code}
              </code>
            </pre>
          </div>
          {!title && (
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1.5 text-[#808080] hover:text-[#CCCCCC] hover:bg-[#333333] rounded transition-colors"
              title="Copy code"
            >
              {copied ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
