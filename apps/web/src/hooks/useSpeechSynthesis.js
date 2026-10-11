import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export const VOICE_PROFILES = {
  female: { 
    id: 'female',
    label: 'Voz femenina', 
    pitch: 1.2, 
    rate: 0.9, 
    keywords: ['female', 'mujer', 'woman', 'girl', 'monica', 'conchita', 'lucia', 'mia', 'samantha', 'victoria', 'amelie', 'elena', 'laura'] 
  },
  male: { 
    id: 'male',
    label: 'Voz masculina', 
    pitch: 0.8, 
    rate: 0.85, 
    keywords: ['male', 'hombre', 'man', 'boy', 'jorge', 'diego', 'carlos', 'david', 'thomas', 'pablo'] 
  },
  child: { 
    id: 'child',
    label: 'Voz infantil', 
    pitch: 1.5, 
    rate: 1.1, 
    keywords: ['female', 'mujer', 'girl', 'child', 'monica', 'lucia', 'ana'] 
  },
  robot: { 
    id: 'robot',
    label: 'Voz robótica', 
    pitch: 1.0, 
    rate: 1.2, 
    keywords: ['robot', 'synthetic', 'google', 'microsoft', 'male', 'hombre'] 
  },
  elder: { 
    id: 'elder',
    label: 'Voz de anciano', 
    pitch: 0.6, 
    rate: 0.75, 
    keywords: ['male', 'hombre', 'man', 'jorge', 'carlos', 'antonio'] 
  },
  epic: { 
    id: 'epic',
    label: 'Narrador épico', 
    pitch: 0.9, 
    rate: 0.8, 
    keywords: ['male', 'hombre', 'man', 'jorge', 'diego', 'microsoft'] 
  }
};

// Global state to sync across all hook instances
const listeners = new Set();
let globalState = {
  isSpeaking: false,
  isPaused: false,
  currentTime: 0,
  duration: 0,
  charIndex: 0,
  currentText: '',
  currentLang: 'es-ES'
};

function updateGlobalState(updates) {
  globalState = { ...globalState, ...updates };
  listeners.forEach(listener => listener(globalState));
}

let progressInterval = null;

const startTimer = () => {
  if (progressInterval) clearInterval(progressInterval);
  progressInterval = setInterval(() => {
    if (globalState.isSpeaking && !globalState.isPaused && globalState.currentTime < globalState.duration) {
      updateGlobalState({ currentTime: Math.min(globalState.currentTime + 0.1, globalState.duration) });
    }
  }, 100);
};

const stopTimer = () => {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
};

export const useSpeechSynthesis = () => {
  const [state, setState] = useState(globalState);
  const [voices, setVoices] = useState([]);
  const [supported, setSupported] = useState(true);
  
  const utteranceRef = useRef(null);

  useEffect(() => {
    listeners.add(setState);
    return () => listeners.delete(setState);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setSupported(false);
      return;
    }

    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      stopTimer();
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
        utteranceRef.current.onboundary = null;
      }
      window.speechSynthesis.cancel();
      updateGlobalState({
        isSpeaking: false,
        isPaused: false,
        charIndex: 0,
        currentTime: 0,
        duration: 0,
        currentText: ''
      });
      utteranceRef.current = null;
      window.dispatchEvent(new Event('speech-stopped'));
    }
  }, []);

  const pause = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.pause();
      stopTimer();
      updateGlobalState({ isPaused: true, isSpeaking: false });
      window.dispatchEvent(new Event('speech-paused'));
    }
  }, []);

  const resume = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.resume();
      startTimer();
      updateGlobalState({ isPaused: false, isSpeaking: true });
      window.dispatchEvent(new Event('speech-resumed'));
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (globalState.isPaused) {
      resume();
    } else if (globalState.isSpeaking) {
      pause();
    }
  }, [pause, resume]);

  const getVoiceForProfile = useCallback((profileId, lang) => {
    const profile = VOICE_PROFILES[profileId] || VOICE_PROFILES.female;
    const langPrefix = lang.split('-')[0].toLowerCase();
    const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));
    
    let selectedVoice = null;
    if (langVoices.length > 0) {
      selectedVoice = langVoices.find(v => {
        const name = v.name.toLowerCase();
        return profile.keywords.some(keyword => name.includes(keyword));
      });
      if (!selectedVoice) selectedVoice = langVoices[0];
    }
    return { voice: selectedVoice, profile };
  }, [voices]);

  const setupUtteranceHandlers = useCallback((utterance, offset) => {
    utterance.onstart = () => {
      updateGlobalState({ isSpeaking: true, isPaused: false });
      startTimer();
      window.dispatchEvent(new Event('speech-playing'));
    };

    utterance.onend = () => {
      stopTimer();
      updateGlobalState({
        isSpeaking: false,
        isPaused: false,
        charIndex: 0,
        currentTime: globalState.duration, // Snap to end
        currentText: ''
      });
      utteranceRef.current = null;
      window.dispatchEvent(new Event('speech-stopped'));
    };

    utterance.onerror = (event) => {
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        console.error('[SpeechSynthesis] Error:', event);
        toast.error('Error al reproducir el audio.');
      }
      stopTimer();
      updateGlobalState({ isSpeaking: false, isPaused: false });
      window.dispatchEvent(new Event('speech-stopped'));
    };

    utterance.onpause = () => {
      stopTimer();
      updateGlobalState({ isPaused: true, isSpeaking: false });
      window.dispatchEvent(new Event('speech-paused'));
    };

    utterance.onresume = () => {
      startTimer();
      updateGlobalState({ isPaused: false, isSpeaking: true });
      window.dispatchEvent(new Event('speech-resumed'));
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const exactTime = ((offset + event.charIndex) / globalState.currentText.length) * globalState.duration;
        updateGlobalState({ 
          charIndex: offset + event.charIndex,
          // Soft sync to prevent timer drift
          currentTime: Math.abs(globalState.currentTime - exactTime) > 1 ? exactTime : globalState.currentTime
        });
      }
    };
  }, []);

  const speak = useCallback((text, lang = 'es-ES', voiceProfileId = 'female') => {
    if (!supported || !window.speechSynthesis) {
      toast.error('Tu navegador no soporta lectura en voz alta.');
      return;
    }

    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current.onboundary = null;
    }
    window.speechSynthesis.cancel();
    stopTimer();

    if (!text) return;

    const { voice, profile } = getVoiceForProfile(voiceProfileId, lang);
    
    // Estimate duration: ~15 characters per second adjusted by rate
    const estimatedDuration = text.length / (15 * profile.rate);

    updateGlobalState({
      currentText: text,
      currentLang: lang,
      charIndex: 0,
      currentTime: 0,
      duration: estimatedDuration
    });

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    
    if (voice) utterance.voice = voice;
    utterance.rate = profile.rate; 
    utterance.pitch = profile.pitch; 

    setupUtteranceHandlers(utterance, 0);
    window.speechSynthesis.speak(utterance);
  }, [supported, getVoiceForProfile, setupUtteranceHandlers]);

  const switchVoice = useCallback((newProfileId) => {
    if (!globalState.currentText || (!globalState.isSpeaking && !globalState.isPaused)) return;

    const wasPaused = globalState.isPaused;
    const currentOffset = globalState.charIndex;

    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current.onboundary = null;
    }
    window.speechSynthesis.cancel();
    stopTimer();

    const remainingText = globalState.currentText.slice(currentOffset);
    if (!remainingText.trim()) {
      stop();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(remainingText);
    utteranceRef.current = utterance;

    const { voice, profile } = getVoiceForProfile(newProfileId, globalState.currentLang);
    if (voice) utterance.voice = voice;
    utterance.rate = profile.rate;
    utterance.pitch = profile.pitch;

    setupUtteranceHandlers(utterance, currentOffset);

    utterance.onstart = () => {
      updateGlobalState({
        isSpeaking: !wasPaused,
        isPaused: wasPaused
      });
      if (!wasPaused) startTimer();
      window.dispatchEvent(new Event(wasPaused ? 'speech-paused' : 'speech-playing'));
      if (wasPaused) {
        window.speechSynthesis.pause();
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [getVoiceForProfile, setupUtteranceHandlers, stop]);

  return { 
    speak, 
    pause, 
    resume, 
    stop,
    togglePlayPause,
    switchVoice,
    isSpeaking: state.isSpeaking, 
    isPaused: state.isPaused, 
    currentTime: state.currentTime,
    duration: state.duration,
    charIndex: state.charIndex,
    currentText: state.currentText,
    supported
  };
};