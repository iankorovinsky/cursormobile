'use client';

import { useEffect, useRef } from 'react';
import ThinkingBlock from './ThinkingBlock';
import CodeBlock from './CodeBlock';
import TodoList from './TodoList';
import type { Message } from '../hooks/useWebSocket';

interface ChatMessagesProps {
  chatId: string;
  messages: Message[];
  pendingPrompts: Set<string>;
}

// Utility function to parse code blocks from text (if embedded)
function parseCodeBlocksFromText(text: string): Array<{ filename: string; code: string; language?: string }> {
  const codeBlocks: Array<{ filename: string; code: string; language?: string }> = [];
  const codeBlockRegex = /\[CODE:\s*([^\]]+)\]\s*\n([\s\S]*?)(?=\n\n\[CODE:|$)/g;
  
  let match;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const filename = match[1].trim();
    const code = match[2].trim();
    // Infer language from filename extension
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
      'py': 'python', 'rb': 'ruby', 'go': 'go', 'rs': 'rust', 'java': 'java',
      'cpp': 'cpp', 'c': 'c', 'cs': 'csharp', 'php': 'php', 'swift': 'swift',
      'kt': 'kotlin', 'scala': 'scala', 'sh': 'bash', 'bash': 'bash', 'zsh': 'bash',
      'sql': 'sql', 'html': 'html', 'css': 'css', 'scss': 'scss', 'json': 'json',
      'xml': 'xml', 'yaml': 'yaml', 'yml': 'yaml', 'md': 'markdown', 'txt': 'text'
    };
    const language = languageMap[extension] || 'text';
    
    codeBlocks.push({ filename, code, language });
  }
  
  return codeBlocks;
}

// Utility function to remove code blocks from text
function removeCodeBlocksFromText(text: string): string {
  return text.replace(/\[CODE:\s*[^\]]+\]\s*\n[\s\S]*?(?=\n\n\[CODE:|$)/g, '').trim();
}

export default function ChatMessages({ chatId, messages, pendingPrompts }: ChatMessagesProps) {
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
              <>
              {/* User Message */}
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
              {/* Show thinking indicator for pending prompts */}
              {pendingPrompts.has(message.id) && (
                <div className="mt-2">
                  <ThinkingBlock
                    icon="🤔"
                    text="Cursor is thinking..."
                    isAnimating={true}
                  />
                </div>
              )}
              </>
            ) : (
              <>
              {/* Assistant Response */}
              <div className="space-y-3">
                {/* Get code blocks from metadata or parse from text */}
                {(() => {
                  const codeBlocksFromMetadata = message.metadata?.code_blocks || [];
                  const codeBlocksFromText = parseCodeBlocksFromText(message.text);
                  const allCodeBlocks = codeBlocksFromMetadata.length > 0 
                    ? codeBlocksFromMetadata 
                    : codeBlocksFromText;
                  
                  // Remove code blocks from text if they were embedded
                  const displayText = codeBlocksFromMetadata.length > 0 
                    ? message.text 
                    : removeCodeBlocksFromText(message.text);
                  
                  return (
                    <>
                      {displayText && (
                        <div className="text-[#CCCCCC] text-sm leading-relaxed whitespace-pre-wrap">
                          {displayText}
                        </div>
                      )}
                      {allCodeBlocks.map((block: any, idx: number) => {
                        const filename = block.filename || `code-${idx + 1}`;
                        const code = block.code || block;
                        const language = block.language || 
                          (typeof block === 'string' ? 'text' : 
                           filename.split('.').pop()?.toLowerCase() || 'text');
                        
                        return (
                          <CodeBlock
                            key={`${message.id}-code-${idx}`}
                            title={filename}
                            code={typeof code === 'string' ? code : JSON.stringify(code, null, 2)}
                            language={language}
                          />
                        );
                      })}
                    </>
                  );
                })()}
                {message.metadata?.thinking && (
                  <ThinkingBlock
                    icon="🤔"
                    text={message.metadata.thinking}
                  />
                )}
              </div>
              </>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
