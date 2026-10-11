import React, { useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, Square, Music, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic.js';
import { musicTracks as defaultTracks } from '@/lib/musicTracks.js';
import { cn } from '@/lib/utils.js';
import { useToast } from '@/hooks/use-toast.js';

export default function MusicPlayer({ className }) {
  const { 
    trackId, 
    setTrackId, 
    volume, 
    setVolume, 
    isMuted, 
    setIsMuted, 
    isPlaying, 
    setIsPlaying,
    togglePlay,
    customTracks,
    currentTrackData,
    audioRef,
    isLoading,
    error
  } = useBackgroundMusic();
  
  const { toast } = useToast();

  const handleTrackChange = (newTrackId) => {
    setTrackId(newTrackId);
  };

  const handleEnded = () => {
    // Loop the track or stop playing
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((e) => {
        console.error('[MusicPlayer] Loop play failed:', e.message || 'Unknown playback error');
        setIsPlaying(false);
      });
    } else {
      setIsPlaying(false);
    }
  };

  const handleAudioError = (e) => {
    console.error('[MusicPlayer] Audio playback error:', e.message || 'Unknown audio error');
    setIsPlaying(false);
    
    if (trackId !== 'none') {
      toast({
        title: "Playback Error",
        description: "Failed to load the selected audio track. It may be unavailable.",
        variant: "destructive"
      });
      // Optionally fallback to none if the track is completely broken
      setTrackId('none');
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-3 sm:gap-4 bg-card border border-primary/10 shadow-md rounded-2xl px-4 sm:px-6 py-3 transition-all duration-300 hover:shadow-lg", className)}>
      
      {/* Hidden Audio Element with Source Tags */}
      <audio 
        ref={audioRef} 
        controls={false}
        autoPlay={false} 
        onEnded={handleEnded}
        onError={handleAudioError}
        className="hidden"
      >
        {currentTrackData?.sources?.map((source, index) => (
          <source key={index} src={source.url} type={source.format} />
        ))}
        
        {/* Use the explicitly mapped url property */}
        {currentTrackData?.url && !currentTrackData?.sources && (
          <source 
            src={currentTrackData.url} 
            type={currentTrackData.file_format || 'audio/mpeg'} 
          />
        )}
      </audio>

      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-[200px]">
        {error ? (
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
        ) : (
          <Music className={cn("w-5 h-5 shrink-0", isLoading ? "text-primary animate-pulse" : "text-primary")} />
        )}
        
        <Select value={trackId} onValueChange={handleTrackChange}>
          <SelectTrigger className="w-full h-10 bg-background border-primary/20">
            <SelectValue placeholder={isLoading ? "Loading music..." : "Select background music"} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel className="text-xs text-muted-foreground">Default Tracks</SelectLabel>
              <SelectItem value="none">No Background Music</SelectItem>
              {defaultTracks.map(track => (
                <SelectItem key={track.id} value={track.id}>
                  {track.name}
                </SelectItem>
              ))}
            </SelectGroup>
            
            {customTracks && customTracks.length > 0 && (
              <>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel className="text-xs text-muted-foreground">Library Tracks</SelectLabel>
                  {customTracks.map(track => {
                    const displayTitle = track.title || track.name || 'Untitled Track';
                    return (
                      <SelectItem key={track.id} value={track.id}>
                        {displayTitle}
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="hidden sm:block w-px h-8 bg-border mx-2" />

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="secondary"
          size="icon"
          className={cn(
            "h-10 w-10 rounded-full transition-all shadow-sm",
            isPlaying ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105" : "bg-muted text-muted-foreground hover:text-foreground"
          )}
          onClick={togglePlay}
          disabled={trackId === 'none' || !currentTrackData || isLoading}
          aria-label={isPlaying ? "Pause background music" : "Play background music"}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          onClick={stopPlayback}
          disabled={trackId === 'none' || !currentTrackData || isLoading || (!isPlaying && (!audioRef.current || audioRef.current.currentTime === 0))}
          aria-label="Stop background music"
        >
          <Square className="w-4 h-4 fill-current" />
        </Button>
      </div>

      <div className="hidden sm:block w-px h-8 bg-border mx-2" />

      <div className="flex items-center gap-3 w-full sm:w-32 shrink-0 bg-secondary/30 px-3 py-1.5 rounded-full border border-border/50">
        <button
          className="text-muted-foreground hover:text-primary transition-colors focus:outline-none shrink-0"
          onClick={() => setIsMuted(!isMuted)}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <Slider
          value={[isMuted ? 0 : volume * 100]}
          max={100}
          step={1}
          onValueChange={(vals) => {
            setIsMuted(false);
            setVolume(vals[0] / 100);
          }}
          className="w-full cursor-pointer"
          aria-label="Volume"
        />
      </div>
    </div>
  );
}