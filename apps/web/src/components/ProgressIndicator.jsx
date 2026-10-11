import React from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const ProgressIndicator = ({ 
  currentTime = 0, 
  duration = 0, 
  isPlaying = false, 
  onPlayPause, 
  className 
}) => {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const safeDuration = duration > 0 ? duration : 1;
  const progress = Math.min(100, Math.max(0, (currentTime / safeDuration) * 100));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative flex items-center justify-center group">
        <svg className="w-32 h-32 transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
          {/* Background Ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-[hsl(var(--progress-ring))] fill-[hsl(var(--progress-background))]"
            strokeWidth="6"
          />
          {/* Progress Ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-[hsl(var(--progress-fill))] fill-none progress-ring-circle"
            strokeWidth="6"
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
            }}
          />
        </svg>
        
        {/* Center Button */}
        <button
          onClick={onPlayPause}
          className="absolute flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-7 h-7 fill-current" />
          ) : (
            <Play className="w-7 h-7 fill-current ml-1" />
          )}
        </button>
      </div>
      
      {/* Time Display */}
      <div className="text-sm font-medium text-muted-foreground tabular-nums tracking-wide bg-muted/50 px-3 py-1 rounded-full">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  );
};

export default ProgressIndicator;