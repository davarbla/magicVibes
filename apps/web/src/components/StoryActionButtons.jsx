import React from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReadAloudButton from '@/components/ReadAloudButton.jsx';
import VoiceSelector from '@/components/VoiceSelector.jsx';
import { useLanguage } from '@/contexts/LanguageContext.jsx';

const StoryActionButtons = ({ story, onSendEmail }) => {
  const { t } = useLanguage();

  const getLangCode = (lang) => {
    if (lang === 'English') return 'en-US';
    if (lang === 'Français') return 'fr-FR';
    return 'es-ES';
  };

  if (!story) return null;

  const content = story.content || story.story;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <VoiceSelector />
      
      <ReadAloudButton 
        storyText={content} 
        storyTitle={story.title} 
        language={getLangCode(story.language)} 
      />

      {onSendEmail && (
        <Button
          onClick={onSendEmail}
          disabled={!content}
          variant="outline"
          className="rounded-full px-6 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all duration-300"
        >
          <Mail className="w-4 h-4 mr-2" />
          <span className="font-medium">
            Enviar por correo
          </span>
        </Button>
      )}
    </div>
  );
};

export default StoryActionButtons;