import { useState, useEffect, useRef, useCallback } from 'react';

export const useAudioPlayer = (initialVolume = 75) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(initialVolume);
  const [currentTrackUrl, setCurrentTrackUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const audioRef = useRef(null);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }
    
    const audio = audioRef.current;
    audio.volume = volume / 100;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = (e) => {
      console.error('Audio error:', e);
      setError('Failed to load audio file');
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, []); // Empty dependency array to run once

  // Handle track URL changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrackUrl) {
      setIsLoading(true);
      setError(null);
      const wasPlaying = isPlaying;
      audio.src = currentTrackUrl;
      audio.load();
      if (wasPlaying) {
        audio.play().catch(err => {
          console.error('Playback error:', err);
          setIsPlaying(false);
        });
      }
    } else {
      audio.pause();
      audio.src = '';
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setIsLoading(false);
      setError(null);
    }
  }, [currentTrackUrl]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => {
        console.error('Playback error:', err);
        setIsPlaying(false);
      });
    }
  }, [isPlaying]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  }, []);

  const seek = useCallback((time) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const changeVolume = useCallback((newVolume) => {
    setVolume(newVolume);
  }, []);

  const changeTrack = useCallback((url) => {
    setCurrentTrackUrl(url);
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    isLoading,
    error,
    togglePlay,
    stop,
    seek,
    changeVolume,
    changeTrack
  };
};