import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Volume2, Square, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis.js';
import { useVoiceSelection } from '@/hooks/useVoiceSelection.js';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { cn } from '@/lib/utils';

const ReadAloudButton = ({ storyText, storyTitle, language: speechLanguage = 'es-ES', className }) => {
  const { t, language } = useLanguage();
  const { 
    speak, 
    stop, 
    switchVoice,
    isSpeaking, 
    isPaused, 
    currentText,
    supported 
  } = useSpeechSynthesis();
  
  const { selectedVoiceProfile } = useVoiceSelection();
  const prevVoiceRef = useRef(selectedVoiceProfile);
  const [isSwitching, setIsSwitching] = useState(false);

  const cleanText = useMemo(() => {
    if (!storyText) return '';
    let text = storyText;
    text = text.replace(/[*_~]/g, '');
    text = text.replace(/<[^>]*>?/gm, '');
    return `${storyTitle ? storyTitle + '. ' : ''}${text}`;
  }, [storyText, storyTitle]);

  // Handle seamless voice switching when profile changes during playback
  useEffect(() => {
    if (prevVoiceRef.current !== selectedVoiceProfile) {
      prevVoiceRef.current = selectedVoiceProfile;
      
      // Only switch if we are currently reading this specific text
      if (currentText && (isSpeaking || isPaused)) {
        setIsSwitching(true);
        switchVoice(selectedVoiceProfile);
        
        // Remove the switching indicator after a brief moment
        const timer = setTimeout(() => {
          setIsSwitching(false);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedVoiceProfile, currentText, isSpeaking, isPaused, switchVoice]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const handleMainAction = () => {
    if (!isSpeaking && !isPaused) {
      speak(cleanText, speechLanguage, selectedVoiceProfile);
    } else {
      stop();
    }
  };

  if (!supported || !storyText) return null;

  const isActive = isSpeaking || isPaused;

  const getSwitchingText = () => {
    if (language === 'es') return 'Cambiando voz...';
    if (language === 'fr') return 'Changement de voix...';
    return 'Changing voice...';
  };

  const getReadAloudText = () => {
    if (language === 'es') return 'Leer en voz alta';
    if (language === 'fr') return 'Lire à haute voix';
    return 'Read Aloud';
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Button 
        onClick={handleMainAction} 
        variant={isActive ? "destructive" : "outline"}
        className={cn(
          "rounded-full px-6 transition-all duration-300",
          !isActive && "hover:bg-primary/10 hover:text-primary border-primary/20"
        )}
        disabled={isSwitching}
      >
        {isSwitching ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            {getSwitchingText()}
          </>
        ) : isActive ? (
          <>
            <Square className="w-4 h-4 mr-2" />
            {t('storyDetail.stopReading')}
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4 mr-2" />
            {getReadAloudText()}
          </>
        )}
      </Button>
    </div>
  );
};

export default ReadAloudButton;