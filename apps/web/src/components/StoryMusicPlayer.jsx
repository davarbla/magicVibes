import React, { useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic.js';

export default function StoryMusicPlayer({ 
  initialTrackId = 'none', 
  initialVolume = 30,
  onChange
}) {
  const {
    selectedMusicId,
    setSelectedMusicId,
    volume,
    setVolume,
    isPlaying,
    togglePlay,
    customTracks,
    isLoading,
    error
  } = useBackgroundMusic(initialTrackId, initialVolume);

  // Sync state changes back to parent component (StoryCreatorPage)
  useEffect(() => {
    if (onChange) {
      onChange({ trackId: selectedMusicId, volume });
    }
  }, [selectedMusicId, volume, onChange]);

  // Sync incoming props if parent sets them initially
  useEffect(() => {
    if (initialTrackId && initialTrackId !== selectedMusicId) {
      setSelectedMusicId(initialTrackId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTrackId]);

  const handleTrackSelect = (val) => {
    setSelectedMusicId(val);
  };

  const handleVolumeChange = (vals) => {
    setVolume(vals[0]);
  };

  const toggleMute = () => {
    setVolume(volume === 0 ? 30 : 0);
  };

  const getSelectedTrackTitle = () => {
    if (selectedMusicId === 'none') return "No Background Music";
    const track = customTracks.find(t => t.id === selectedMusicId);
    return track ? track.title : "Select Music";
  };

  if (error) {
    return (
      <Card className="w-full bg-destructive/5 border-destructive/20 rounded-2xl">
        <CardContent className="p-4 flex items-center gap-3 text-destructive">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">Failed to load background music library.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="music-player-container magical-shadow">
      
      {/* Left: Music Selector with animated indicator */}
      <div className="flex-1 min-w-[200px] flex items-center gap-3 w-full md:w-auto">
        <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 text-primary shrink-0 relative">
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : isPlaying ? (
            <div className="playing-bars">
              <span className="w-1 bg-primary bar-1 rounded-t-sm" />
              <span className="w-1 bg-primary bar-2 rounded-t-sm" />
              <span className="w-1 bg-primary bar-3 rounded-t-sm" />
            </div>
          ) : (
            <Music className="w-6 h-6" />
          )}
        </div>
        
        <div className="flex-1 w-full">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
            Background Music
          </label>
          <Select value={selectedMusicId} onValueChange={handleTrackSelect} disabled={isLoading}>
            <SelectTrigger className="w-full bg-background/80 border-primary/20 hover:border-primary/40 focus:ring-primary/30 h-10 transition-colors">
              <SelectValue>
                <span className="font-medium text-foreground truncate max-w-[200px] inline-block">
                  {getSelectedTrackTitle()}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Background Music</SelectItem>
              {customTracks.map((track) => (
                <SelectItem key={track.id} value={track.id}>
                  {track.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="music-player-controls">
        {/* Play/Pause Button */}
        <button 
          onClick={togglePlay}
          disabled={selectedMusicId === 'none' || isLoading}
          className={`music-player-btn ${selectedMusicId === 'none' || isLoading ? 'music-player-btn-disabled' : ''}`}
          aria-label={isPlaying ? "Pause background music" : "Play background music"}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 ml-1 fill-current" />
          )}
        </button>

        {/* Volume Slider */}
        <div className="flex items-center gap-3 min-w-[140px] bg-background/60 p-2 rounded-full border border-primary/10">
          <button 
            onClick={toggleMute} 
            className="text-muted-foreground hover:text-primary transition-colors focus:outline-none shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary/10"
            aria-label={volume === 0 ? "Unmute" : "Mute"}
            disabled={selectedMusicId === 'none'}
          >
            {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          
          <Slider 
            value={[volume]} 
            max={100} 
            step={1} 
            onValueChange={handleVolumeChange}
            className={`cursor-pointer w-full pr-3 ${selectedMusicId === 'none' ? 'opacity-50 pointer-events-none' : ''}`}
            aria-label="Background music volume"
            disabled={selectedMusicId === 'none'}
          />
        </div>
      </div>
      
    </div>
  );
}