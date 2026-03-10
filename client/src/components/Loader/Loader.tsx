import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 bg-zinc-900/10 rounded-full animate-ping blur-xl"></div>
        {/* Inner spinner */}
        <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-zinc-200 border-t-zinc-900 relative z-10"></div>
        {/* Center dot */}
        <div className="absolute w-2 h-2 bg-zinc-900 rounded-full animate-pulse z-20"></div>
      </div>
      <p className="text-zinc-600 mt-6 font-medium tracking-wide flex items-center gap-2">
        Synthesizing variations
        <span className="flex space-x-1">
          <span className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </span>
      </p>
    </div>
  );
};
