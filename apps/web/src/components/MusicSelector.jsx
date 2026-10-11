import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle, Music } from 'lucide-react';

export default function MusicSelector({ onTrackSelect, initialTrackId }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedValue, setSelectedValue] = useState(initialTrackId || 'none');

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setLoading(true);
        const records = await pb.collection('audio_library').getList(1, 100, {
          $autoCancel: false,
          sort: '-created'
        });
        setTracks(records.items);
      } catch (err) {
        console.error('Error fetching audio library:', err);
        setError('Failed to load music library.');
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, []);

  // Sync selected value if initialTrackId changes (e.g., after story loads)
  useEffect(() => {
    if (initialTrackId) {
      setSelectedValue(initialTrackId);
    }
  }, [initialTrackId]);

  const handleSelectChange = (val) => {
    setSelectedValue(val);
    
    if (val === 'none') {
      onTrackSelect(null);
      return;
    }

    const track = tracks.find(t => t.id === val);
    if (track) {
      const fileUrl = pb.files.getUrl(track, track.audio_file);
      onTrackSelect({
        id: track.id,
        title: track.title,
        audio_file_url: fileUrl
      });
    }
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 w-full max-w-md">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Music className="w-5 h-5" />}
      </div>
      <Select value={selectedValue} onValueChange={handleSelectChange} disabled={loading}>
        <SelectTrigger className="w-full bg-background">
          <SelectValue placeholder="Select background music" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Background Music</SelectItem>
          {tracks.map((track) => (
            <SelectItem key={track.id} value={track.id}>
              {track.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}