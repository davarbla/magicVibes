import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';

export default function AudioPlayer({ selectedTrack }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const [error, setError] = useState(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);
    const handleError = (e) => {
      console.error('Audio playback error:', e);
      setError('Failed to load or play the audio file.');
      setIsPlaying(false);
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current && selectedTrack?.audio_file_url) {
      audioRef.current.src = selectedTrack.audio_file_url;
      audioRef.current.load();
      setIsPlaying(false);
      setError(null);
    }
  }, [selectedTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current || !audioRef.current.src) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => {
        console.error('Play error:', err);
        setError('Playback was interrupted or blocked.');
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const stop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  const handleVolumeChange = (vals) => {
    setVolume(vals[0]);
  };

  const toggleMute = () => {
    setVolume(volume === 0 ? 75 : 0);
  };

  if (!selectedTrack) return null;

  return (
    <Card className="w-full bg-card border-primary/10 shadow-md overflow-hidden">
      <CardContent className="p-4 sm:p-6 flex flex-col gap-4">
        <audio ref={audioRef} className="hidden" preload="metadata" />
        
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-foreground truncate pr-4">
            {selectedTrack.title || 'Unknown Track'}
          </h4>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {/* Playback Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <Button 
              variant="secondary" 
              size="icon" 
              className="h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all shadow-sm"
              onClick={togglePlay}
              disabled={!!error || !selectedTrack.audio_file_url}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground transition-colors"
              onClick={stop}
              disabled={!!error || (!isPlaying && audioRef.current?.currentTime === 0)}
              aria-label="Stop"
            >
              <Square className="w-4 h-4 fill-current" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3 w-full sm:w-40 shrink-0 bg-secondary/30 p-2 rounded-full border border-border/50">
            <button 
              onClick={toggleMute} 
              className="text-muted-foreground hover:text-primary transition-colors focus:outline-none ml-2"
              aria-label={volume === 0 ? "Unmute" : "Mute"}
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <Slider 
              value={[volume]} 
              max={100} 
              step={1} 
              onValueChange={handleVolumeChange}
              className="cursor-pointer mr-2"
              aria-label="Volume"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}