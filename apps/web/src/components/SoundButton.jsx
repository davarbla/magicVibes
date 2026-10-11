import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  generateBirdSound, 
  generateThunderSound, 
  generateRainSound, 
  generateDogSound, 
  generateWaterSound, 
  generateWindSound, 
  generateCricketSound, 
  generateOceanSound,
  generateMagicSound
} from '@/lib/soundGenerator';

const SoundButton = ({ keyword, soundType, onPlay }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const getSoundGenerator = (type) => {
    switch (type) {
      case 'bird': return generateBirdSound;
      case 'thunder': return generateThunderSound;
      case 'rain': return generateRainSound;
      case 'dog': return generateDogSound;
      case 'water': return generateWaterSound;
      case 'wind': return generateWindSound;
      case 'cricket': return generateCricketSound;
      case 'ocean': return generateOceanSound;
      case 'magic': return generateMagicSound;
      default: return generateMagicSound;
    }
  };

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPlaying) return;

    setIsPlaying(true);
    if (onPlay) onPlay();

    try {
      const generator = getSoundGenerator(soundType);
      await generator();
    } catch (error) {
      console.error('Error playing sound:', error);
    } finally {
      if (mounted.current) {
        setIsPlaying(false);
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPlaying}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 mx-1 rounded-md font-bold transition-all duration-200 cursor-pointer select-none",
        "bg-blue-100 border-2 border-blue-400 text-blue-900",
        "hover:bg-blue-200 hover:shadow-md hover:scale-105 active:scale-95",
        isPlaying && "opacity-80 cursor-wait scale-105 shadow-md bg-blue-200"
      )}
      title={isPlaying ? "Playing sound..." : `Play sound for "${keyword}"`}
      aria-label={`Play sound for ${keyword}`}
    >
      {isPlaying ? (
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
      ) : (
        <Volume2 className="w-4 h-4 text-blue-600" />
      )}
      <span>{keyword}</span>
    </button>
  );
};

export default SoundButton;