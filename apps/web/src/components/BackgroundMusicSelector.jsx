import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Music } from 'lucide-react';

const BackgroundMusicSelector = ({ storyId, value, onValueChange, disabled }) => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      try {
        const records = await pb.collection('audio_library').getList(1, 100, {
          filter: 'type="background_music"',
          sort: '-created',
          $autoCancel: false
        });
        setTracks(records.items);
        setError(null);
      } catch (err) {
        console.error('[BackgroundMusicSelector] Error fetching tracks:', err);
        setError('Failed to load music tracks');
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, []);

  const handleChange = async (newValue) => {
    const trackId = newValue === 'none' ? '' : newValue;
    
    if (storyId) {
      setIsUpdating(true);
      try {
        await pb.collection('stories').update(storyId, {
          background_music_id: trackId
        }, { $autoCancel: false });
        toast.success('Background music updated successfully');
      } catch (err) {
        console.error('[BackgroundMusicSelector] Error updating story:', err);
        toast.error('Failed to update background music');
        setIsUpdating(false);
        return; // Stop here if update fails
      }
      setIsUpdating(false);
    }
    
    if (onValueChange) {
      onValueChange(trackId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center h-10 px-3 text-sm text-muted-foreground bg-muted/50 rounded-md border border-input">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 
        Loading tracks...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center h-10 px-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
        {error}
      </div>
    );
  }

  return (
    <Select 
      value={value || 'none'} 
      onValueChange={handleChange} 
      disabled={disabled || isUpdating}
    >
      <SelectTrigger className="w-full bg-background">
        <div className="flex items-center gap-2 truncate">
          {isUpdating ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
          ) : (
            <Music className="w-4 h-4 text-primary shrink-0" />
          )}
          <SelectValue placeholder="Select background music" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No Background Music</SelectItem>
        {tracks.map(track => (
          <SelectItem key={track.id} value={track.id}>
            {track.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default BackgroundMusicSelector;