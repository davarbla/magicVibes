import { useState, useEffect, useRef, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';

export function useBackgroundMusic(initialTrackId = 'none', initialVolume = 30) {
  const [selectedMusicId, setSelectedMusicId] = useState(initialTrackId || 'none');
  const [volume, setVolumeState] = useState(initialVolume ?? 30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [customTracks, setCustomTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use a separate native Audio element for background music
  const audioRef = useRef(new Audio());
  const fadeIntervalRef = useRef(null);

  // (1) Fetch audio_library collection records with type='background_music'
  useEffect(() => {
    const fetchCustomTracks = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const records = await pb.collection('audio_library').getFullList({
          filter: 'type="background_music"',
          sort: '-created',
          $autoCancel: false
        });
        
        setCustomTracks(records);
      } catch (err) {
        console.error(`[useBackgroundMusic] Fetch Error:`, err);
        setError(err);
        toast.error('Failed to load background music library.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCustomTracks();
  }, []);

  // Initialize and (8) Handle cleanup of the audio element
  useEffect(() => {
    const audio = audioRef.current;
    
    // (5) Implement continuous looping
    audio.loop = true;

    const handleEnded = () => setIsPlaying(false);
    const handleError = (e) => {
      if (selectedMusicId !== 'none' && audio.src) {
        console.error('Audio playback error:', e);
        // (9) Add error handling for missing/corrupted audio files
        toast.error('Error playing background music file. It may be missing or corrupted.');
        setIsPlaying(false);
      }
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      // Stop music and clear audio element when component unmounts
      audio.pause();
      audio.src = '';
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    };
  }, [selectedMusicId]);

  // Handle track source changes
  useEffect(() => {
    const audio = audioRef.current;
    
    if (selectedMusicId === 'none' || !selectedMusicId) {
      pauseMusic();
      return;
    }

    const track = customTracks.find(t => t.id === selectedMusicId);
    if (track) {
      try {
        // (10) Ensure music file URLs are generated correctly
        const url = pb.files.getURL(track, track.audio_file);
        
        // Prevent unnecessary reloads if the URL is the same
        if (audio.src !== url && audio.src !== window.location.origin + url) {
          const wasPlaying = isPlaying;
          audio.src = url;
          audio.load();
          if (wasPlaying) playMusic();
        }
      } catch (e) {
        console.error('Failed to resolve audio URL:', e);
        toast.error('Failed to load the selected track.');
      }
    }
  }, [selectedMusicId, customTracks]);

  // (5) Function to update volume seamlessly
  useEffect(() => {
    // Only set raw volume if we aren't currently fading
    if (!fadeIntervalRef.current && audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Provide a safe volume setter for the UI component
  const setVolume = useCallback((newVolume) => {
    const clamped = Math.max(0, Math.min(100, newVolume));

    // Apply slider changes immediately, even while a play/pause fade is running.
    // Otherwise the fade timer can keep overwriting the user's selected volume.
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.volume = clamped / 100;
    }

    setVolumeState(clamped);
  }, []);

  // (3) Function to play selected music with fade-in effect (0.5s)
  const playMusic = useCallback(() => {
    if (selectedMusicId === 'none' || !audioRef.current.src) return;
    
    const audio = audioRef.current;
    
    // Clear any existing fade intervals
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }
    
    const targetVolume = volume / 100;
    
    // Start playback at volume 0
    audio.volume = 0;
    audio.play().then(() => {
      setIsPlaying(true);
      
      // Gradually fade in
      let currentVol = 0;
      fadeIntervalRef.current = setInterval(() => {
        currentVol += 0.1;
        if (currentVol >= targetVolume) {
          audio.volume = targetVolume;
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        } else {
          audio.volume = currentVol;
        }
      }, 50); // 10 steps of 50ms = 0.5s fade
      
    }).catch(err => {
      console.error('Play error:', err);
      if (err.name !== 'AbortError') {
        toast.error('Playback was interrupted.');
      }
      setIsPlaying(false);
    });
  }, [selectedMusicId, volume]);

  // (4) Function to pause/stop music with fade-out effect (0.5s)
  const pauseMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    // Gradually fade out
    let currentVol = audio.volume;
    fadeIntervalRef.current = setInterval(() => {
      currentVol -= 0.1;
      if (currentVol <= 0) {
        audio.volume = 0;
        audio.pause();
        setIsPlaying(false);
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      } else {
        audio.volume = currentVol;
      }
    }, 50); // 10 steps of 50ms = 0.5s fade
  }, []);

  // (3 & 4) Function to play/pause wrapper
  const togglePlay = useCallback(() => {
    if (selectedMusicId === 'none' || !audioRef.current.src) return;
    
    if (isPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  }, [isPlaying, playMusic, pauseMusic, selectedMusicId]);

  return {
    selectedMusicId,
    setSelectedMusicId,
    volume,
    setVolume,
    isPlaying,
    togglePlay,
    customTracks,
    isLoading,
    error
  };
}
