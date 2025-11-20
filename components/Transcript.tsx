import React, { useEffect, useRef } from 'react';
import { TranscriptItem } from '../types';

interface TranscriptProps {
  items: TranscriptItem[];
}

export const Transcript: React.FC<TranscriptProps> = ({ items }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 italic">
        Transcript will appear here...
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {items.map((item) => (
        <div 
          key={item.id} 
          className={`flex flex-col ${item.speaker === 'user' ? 'items-end' : 'items-start'}`}
        >
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md
                ${item.speaker === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-slate-700 text-slate-200 rounded-bl-none border border-slate-600'
                }`}
            >
                {item.text}
            </div>
            <span className="text-xs text-slate-500 mt-1 px-1">
                {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};