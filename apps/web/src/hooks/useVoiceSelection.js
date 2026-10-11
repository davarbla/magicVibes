import { useState, useEffect, useCallback } from 'react';

export const useVoiceSelection = () => {
  const [selectedVoiceProfile, setSelectedVoiceProfileState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedVoiceProfile') || 'female';
    }
    return 'female';
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const setSelectedVoiceProfile = useCallback((newVoice) => {
    setSelectedVoiceProfileState(newVoice);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedVoiceProfile', newVoice);
      window.dispatchEvent(new Event('voiceProfileChanged'));
    }
  }, []);

  const notifyVoiceChange = useCallback((newProfile) => {
    setSelectedVoiceProfile(newProfile);
  }, [setSelectedVoiceProfile]);

  const pausePlayback = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.pause();
      window.dispatchEvent(new Event('speech-paused'));
    }
  }, []);

  const resumePlayback = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.resume();
      window.dispatchEvent(new Event('speech-resumed'));
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('selectedVoiceProfile') || 'female';
        setSelectedVoiceProfileState(stored);
      }
    };

    const handlePlaying = () => { setIsPlaying(true); setIsPaused(false); };
    const handlePaused = () => { setIsPaused(true); setIsPlaying(false); };
    const handleResumed = () => { setIsPlaying(true); setIsPaused(false); };
    const handleStopped = () => { setIsPlaying(false); setIsPaused(false); };

    if (typeof window !== 'undefined') {
      window.addEventListener('voiceProfileChanged', handleStorageChange);
      window.addEventListener('storage', handleStorageChange);
      
      window.addEventListener('speech-playing', handlePlaying);
      window.addEventListener('speech-paused', handlePaused);
      window.addEventListener('speech-resumed', handleResumed);
      window.addEventListener('speech-stopped', handleStopped);

      return () => {
        window.removeEventListener('voiceProfileChanged', handleStorageChange);
        window.removeEventListener('storage', handleStorageChange);
        
        window.removeEventListener('speech-playing', handlePlaying);
        window.removeEventListener('speech-paused', handlePaused);
        window.removeEventListener('speech-resumed', handleResumed);
        window.removeEventListener('speech-stopped', handleStopped);
      };
    }
  }, []);

  return { 
    selectedVoiceProfile, 
    setSelectedVoiceProfile,
    notifyVoiceChange,
    isPlaying,
    isPaused,
    pausePlayback,
    resumePlayback
  };
};