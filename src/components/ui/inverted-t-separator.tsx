import React from 'react';

interface InvertedTSeparatorProps {
  className?: string;
}

const InvertedTSeparator: React.FC<InvertedTSeparatorProps> = ({ className = "" }) => {
  return (
    <svg 
      viewBox="0 0 12 80" 
      className={`w-3 sm:w-4 md:w-5 lg:w-6 h-32 sm:h-40 md:h-48 lg:h-56 ${className}`}
      fill="none"
    >
      {/* Vertical support beam - full height from bottom to top of shelf */}
      <rect 
        x="3" 
        y="0" 
        width="6" 
        height="80" 
        fill="url(#orangeGradientVertical)" 
        rx="2"
      />
      
      {/* Shadow effect for depth */}
      <rect 
        x="5" 
        y="0" 
        width="2" 
        height="80" 
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
      </defs>
    </svg>
  );
};

export default InvertedTSeparator;