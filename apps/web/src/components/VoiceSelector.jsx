import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Play, Square, ChevronDown, Check, Settings2 } from 'lucide-react';
import { useVoiceSelection } from '@/hooks/useVoiceSelection.js';
import { VOICE_PROFILES } from '@/hooks/useSpeechSynthesis.js';
import { cn } from '@/lib/utils';

const VoiceSelector = ({ className }) => {
  const { 
    selectedVoiceProfile, 
    setSelectedVoiceProfile
  } = useVoiceSelection();
  
  const [open, setOpen] = useState(false);
  const [previewingId, setPreviewingId] = useState(null);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  const handlePreview = (e, profileId) => {
    e.stopPropagation();
    
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    if (previewingId === profileId) {
      setPreviewingId(null);
      return;
    }

    const profile = VOICE_PROFILES[profileId];
    const utterance = new SpeechSynthesisUtterance("Hola, esta es una prueba de mi voz.");
    
    const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith('es'));
    let voice = null;
    
    if (langVoices.length > 0) {
      voice = langVoices.find(v => {
        const name = v.name.toLowerCase();
        return profile.keywords.some(keyword => name.includes(keyword));
      });
      if (!voice) voice = langVoices[0];
    }

    if (voice) utterance.voice = voice;
    utterance.pitch = profile.pitch;
    utterance.rate = profile.rate;

    utterance.onstart = () => setPreviewingId(profileId);
    utterance.onend = () => setPreviewingId(null);
    utterance.onerror = () => setPreviewingId(null);

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const currentProfile = VOICE_PROFILES[selectedVoiceProfile] || VOICE_PROFILES.female;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            role="combobox" 
            aria-expanded={open}
            className="w-[200px] justify-between rounded-full border-primary/20 hover:bg-primary/5 transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              <Settings2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="truncate">{currentProfile.label}</span>
            </div>
            <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-1 rounded-xl" align="end">
          <div className="flex flex-col gap-1">
            {Object.values(VOICE_PROFILES).map((profile) => (
              <div 
                key={profile.id}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm",
                  selectedVoiceProfile === profile.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                )}
                onClick={() => {
                  setSelectedVoiceProfile(profile.id);
                  setOpen(false);
                  if (typeof window !== 'undefined' && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                    setPreviewingId(null);
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  {selectedVoiceProfile === profile.id && <Check className="w-4 h-4" />}
                  <span className={cn(selectedVoiceProfile !== profile.id && "ml-6")}>
                    {profile.label}
                  </span>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className={cn(
                    "h-7 w-7 rounded-full hover:bg-primary/20",
                    previewingId === profile.id && "text-primary bg-primary/10"
                  )}
                  onClick={(e) => handlePreview(e, profile.id)}
                  title="Escuchar prueba"
                >
                  {previewingId === profile.id ? (
                    <Square className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5 ml-0.5" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default VoiceSelector;