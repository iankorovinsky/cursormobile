'use client';

import { useEffect, useState } from 'react';

interface ThinkingBlockProps {
  icon: string;
  text: string;
  isAnimating?: boolean;
}

export default function ThinkingBlock({ icon, text, isAnimating = false }: ThinkingBlockProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (isAnimating) {
      const interval = setInterval(() => {
        setDots(prev => {
          if (prev === '...') return '';
          return prev + '.';
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isAnimating]);

  return (
    <div className="flex items-center gap-2 text-[#808080] text-xs py-1">
      <span>{icon}</span>
      <span>
        {text}
        {isAnimating && <span className="inline-block w-6">{dots}</span>}
      </span>
    </div>
  );
}
