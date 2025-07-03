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
      {/* Main horizontal connecting beam - thicker and more structural */}
      <rect 
        x="0" 
        y="0" 
        width="48" 
        height="12" 
        fill="url(#orangeGradient)" 
        rx="3"
      />
      
      {/* Central vertical support pillar - wider and more robust */}
      <rect 
        x="18" 
        y="12" 
        width="12" 
        height="56" 
        fill="url(#orangeGradientVertical)" 
        rx="3"
      />
      
      {/* Solid base platform that connects to shelf bases */}
      <rect 
        x="12" 
        y="68" 
        width="24" 
        height="12" 
        fill="url(#orangeGradientDark)" 
        rx="4"
      />
      
      {/* Shadow effects for depth */}
      <rect 
        x="2" 
        y="2" 
        width="44" 
        height="4" 
        fill="hsl(32 70% 30%)" 
        rx="2"
        opacity="0.4"
      />
      <rect 
        x="20" 
        y="12" 
        width="4" 
        height="56" 
        fill="hsl(32 70% 30%)" 
        rx="2"
        opacity="0.4"
      />
      <rect 
        x="14" 
        y="70" 
        width="20" 
        height="4" 
        fill="hsl(32 70% 30%)" 
        rx="2"
        opacity="0.4"
      />
      
      {/* Gradient definitions */}
      <defs>
        <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(32 95% 50%)" />
          <stop offset="100%" stopColor="hsl(32 85% 42%)" />
        </linearGradient>
        <linearGradient id="orangeGradientVertical" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(32 90% 48%)" />
          <stop offset="50%" stopColor="hsl(32 95% 52%)" />
          <stop offset="100%" stopColor="hsl(32 85% 44%)" />
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