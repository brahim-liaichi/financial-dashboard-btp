import React from 'react';
import { cn } from '@/utils/cn';

interface ProgressBarProps {
  value: number;
  label?: string;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  className,
  variant = 'default'
}) => {
  // Ensure value is between 0 and 100
  const clampedValue = Math.min(Math.max(value, 0), 100);

  // Determine color based on variant and value
  const getVariantClass = () => {
    if (variant !== 'default') return `bg-${variant}-500`;
    
    // Custom color logic based on percentage
    if (clampedValue < 25) return 'bg-red-500';
    if (clampedValue < 50) return 'bg-yellow-500';
    if (clampedValue < 75) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className={cn('w-full bg-gray-200 rounded-full h-2.5', className)}>
      <div 
        className={cn(
          'h-2.5 rounded-full transition-all duration-300 ease-in-out',
          getVariantClass()
        )}
        style={{ width: `${clampedValue}%` }}
      >
        {label && (
          <span className="text-xs text-gray-700 ml-2">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};