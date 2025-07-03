import React from 'react';

interface InvertedTSeparatorProps {
  className?: string;
}

const InvertedTSeparator: React.FC<InvertedTSeparatorProps> = ({ className = "" }) => {
  return (
    <svg 
      viewBox="0 0 48 84" 
      className={`w-12 sm:w-16 md:w-20 lg:w-24 h-32 sm:h-40 md:h-48 lg:h-56 ${className}`}
      fill="none"
    >
      {/* Vertical support beam - full height from bottom to top of shelf */}
      <rect 
        x="21" 
        y="0" 
        width="6" 
        height="80" 
        fill="url(#orangeGradientVertical)" 
        rx="2"
      />
      
      {/* Horizontal base beam that spans under both shelves */}
      <rect 
        x="0" 
        y="80" 
        width="48" 
        height="4" 
        fill="url(#orangeGradientHorizontal)" 
        rx="2"
      />
      
      {/* Shadow effects for depth */}
      <rect 
        x="23" 
        y="0" 
        width="2" 
        height="80" 
        fill="hsl(32 70% 30%)" 
        rx="1"
        opacity="0.4"
      />
      <rect 
        x="2" 
        y="82" 
        width="44" 
        height="2" 
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
      </defs>
    </svg>
  );
};

export default InvertedTSeparator;