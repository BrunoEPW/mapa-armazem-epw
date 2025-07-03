import React from 'react';

interface InvertedTSeparatorProps {
  className?: string;
}

const InvertedTSeparator: React.FC<InvertedTSeparatorProps> = ({ className = "" }) => {
  return (
    <svg 
      viewBox="0 0 24 80" 
      className={`w-2 sm:w-3 h-20 sm:h-24 md:h-32 lg:h-40 mb-2 sm:mb-3 ${className}`}
      fill="none"
    >
      {/* Horizontal top bar of inverted T */}
      <rect 
        x="0" 
        y="0" 
        width="24" 
        height="6" 
        fill="hsl(32 95% 44%)" 
        rx="2"
      />
      {/* Vertical support beam */}
      <rect 
        x="9" 
        y="6" 
        width="6" 
        height="74" 
        fill="hsl(32 85% 50%)" 
        rx="2"
      />
      {/* Shadow/depth effect */}
      <rect 
        x="0" 
        y="1" 
        width="24" 
        height="2" 
        fill="hsl(32 90% 35%)" 
        rx="1"
        opacity="0.6"
      />
      <rect 
        x="10" 
        y="6" 
        width="2" 
        height="74" 
        fill="hsl(32 90% 35%)" 
        rx="1"
        opacity="0.6"
      />
    </svg>
  );
};

export default InvertedTSeparator;