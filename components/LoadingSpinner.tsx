import React from 'react';

export function LoadingSpinner({ size = 'md', color = 'border-white' }: { size?: 'sm' | 'md' | 'lg', color?: string }) {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-4',
  };
  
  return (
    <div className={`rounded-full animate-spin border-t-transparent ${color} ${sizeMap[size]}`}></div>
  );
}
