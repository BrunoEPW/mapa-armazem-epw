import React from 'react';

interface InvertedTSeparatorProps {
  className?: string;
}

const InvertedTSeparator: React.FC<InvertedTSeparatorProps> = ({ className = "" }) => {
  return (
    <svg 
      viewBox="0 0 48 80" 
      className={`w-6 sm:w-8 md:w-10 lg:w-12 h-20 sm:h-24 md:h-32 lg:h-40 mb-2 sm:mb-3 ${className}`}
      fill="none"
    >
      {/* Central vertical support beam between shelves */}
      <rect 
        x="21" 
        y="0" 
        width="6" 
        height="68" 
        fill="url(#orangeGradientVertical)" 
        rx="2"
      />
      
      {/* Horizontal connecting base beam */}
      <rect 
        x="0" 
        y="68" 
        width="48" 
        height="8" 
        fill="url(#orangeGradientHorizontal)" 
        rx="3"
      />
      
      {/* Additional base support for stability */}
      <rect 
        x="0" 
        y="76" 
        width="48" 
        height="4" 
        fill="url(#orangeGradientDark)" 
        rx="2"
      />
      
      {/* Shadow effects for depth */}
      <rect 
        x="23" 
        y="0" 
        width="2" 
        height="68" 
        fill="hsl(32 70% 30%)" 
        rx="1"
        opacity="0.4"
      />
      <rect 
        x="2" 
        y="70" 
        width="44" 
        height="3" 
        fill="hsl(32 70% 30%)" 
        rx="1"
        opacity="0.4"
      />
      
      {/* Gradient definitions */}
      <defs>
        <linearGradient id="orangeGradientVertical" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(32 90% 48%)" />
          <stop offset="50%" stopColor="hsl(32 95% 52%)" />
          <stop offset="100%" stopColor="hsl(32 85% 44%)" />
        </linearGradient>
        <linearGradient id="orangeGradientHorizontal" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(32 95% 50%)" />
          <stop offset="100%" stopColor="hsl(32 85% 42%)" />
        </linearGradient>
        <linearGradient id="orangeGradientDark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(32 85% 46%)" />
          <stop offset="100%" stopColor="hsl(32 75% 38%)" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default InvertedTSeparator;