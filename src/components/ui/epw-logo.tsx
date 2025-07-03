import { cn } from '@/lib/utils';

interface EPWLogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'horizontal' | 'vertical';
  className?: string;
}

const EPWLogo = ({ size = 'medium', variant = 'horizontal', className }: EPWLogoProps) => {
  const sizeClasses = {
    small: 'h-8 w-16',
    medium: 'h-12 w-24', 
    large: 'h-16 w-32'
  };

  const logoSizes = {
    small: { viewBox: "0 0 120 48", textSize: "12", subTextSize: "6" },
    medium: { viewBox: "0 0 120 48", textSize: "14", subTextSize: "8" },
    large: { viewBox: "0 0 120 48", textSize: "16", subTextSize: "10" }
  };

  const currentSize = logoSizes[size];

  if (variant === 'vertical') {
    return (
      <div className={cn('flex flex-col items-center', className)}>
        <svg viewBox="0 0 120 48" className={cn(sizeClasses[size])}>
          <rect x="0" y="8" width="40" height="8" fill="#FF6600" rx="2" />
          <rect x="0" y="20" width="60" height="8" fill="#FF6600" rx="2" />
          <rect x="0" y="32" width="35" height="8" fill="#FF6600" rx="2" />
          <text x="70" y="25" fill="white" fontSize={currentSize.textSize} fontWeight="bold" fontFamily="Arial">EPW</text>
        </svg>
        <span className="text-primary text-xs mt-1 font-medium">tecnologia de extrusão</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center', className)}>
      <svg viewBox={currentSize.viewBox} className={cn(sizeClasses[size])}>
        <rect x="0" y="8" width="40" height="8" fill="#FF6600" rx="2" />
        <rect x="0" y="20" width="60" height="8" fill="#FF6600" rx="2" />
        <rect x="0" y="32" width="35" height="8" fill="#FF6600" rx="2" />
        <text x="70" y="20" fill="white" fontSize={currentSize.textSize} fontWeight="bold" fontFamily="Arial">EPW</text>
        <text x="70" y="35" fill="#FF6600" fontSize={currentSize.subTextSize} fontFamily="Arial">tecnologia de extrusão</text>
      </svg>
    </div>
  );
};

export default EPWLogo;