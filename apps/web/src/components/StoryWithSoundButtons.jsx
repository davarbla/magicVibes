import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, ArrowLeft, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import SoundButton from '@/components/SoundButton.jsx';
import { extractSoundKeywords, reconstructStoryWithMetadata } from '@/lib/soundMetadata.js';

// Comprehensive dictionary mapping words to sound types
export const KEYWORD_MAP = {
  // English
  'bird': 'bird', 'birds': 'bird',
  'thunder': 'thunder', 'thunderstorm': 'thunder', 'storm': 'thunder',
  'rain': 'rain', 'raining': 'rain',
  'dog': 'dog', 'dogs': 'dog', 'bark': 'dog', 'barking': 'dog',
  'water': 'water', 'waters': 'water', 'splash': 'water',
  'wind': 'wind', 'windy': 'wind',
  'cricket': 'cricket', 'crickets': 'cricket',
  'ocean': 'ocean', 'waves': 'ocean', 'wave': 'ocean',
  'magic': 'magic', 'magical': 'magic',
  
  // Español
  'pájaro': 'bird', 'pájaros': 'bird',
  'trueno': 'thunder', 'tormenta': 'thunder',
  'lluvia': 'rain', 'lloviendo': 'rain',
  'perro': 'dog', 'perros': 'dog', 'ladrido': 'dog',
  'agua': 'water', 'salpicadura': 'water',
  'viento': 'wind', 'ventoso': 'wind',
  'grillo': 'cricket', 'grillos': 'cricket',
  'océano': 'ocean', 'ola': 'ocean', 'olas': 'ocean',
  'magia': 'magic', 'mágico': 'magic', 'mágica': 'magic',
  
  // Français
  'oiseau': 'bird', 'oiseaux': 'bird',
  'tonnerre': 'thunder', 'tempête': 'thunder',
  'pluie': 'rain', 'pleut': 'rain',
  'chien': 'dog', 'chiens': 'dog', 'aboiement': 'dog',
  'eau': 'water', 'éclaboussure': 'water',
  'vent': 'wind', 'venteux': 'wind',
  'grillon': 'cricket', 'grillons': 'cricket',
  'océan': 'ocean', 'vague': 'ocean', 'vagues': 'ocean',
  'magie': 'magic', 'magique': 'magic'
};

const StoryWithSoundButtons = ({ 
  story, 
  onSave, 
  onBack, 
  isSaving, 
  soundMetadata, 
  viewOnly = false, 
  hideHeader = false 
}) => {
  const { t } = useLanguage();
  
  // Extract properties from the story object
  const title = story?.title || '';
  const content = story?.content || story?.story || '';
  const childName = story?.childName || '';
  const childAge = story?.childAge || 6;

  // Determine formatting based on age
  let textClass = "text-base leading-relaxed";
  if (childAge <= 4) {
    textClass = "text-2xl leading-loose font-medium";
  } else if (childAge <= 7) {
    textClass = "text-xl leading-relaxed";
  } else if (childAge <= 10) {
    textClass = "text-lg leading-relaxed";
  }

  // Use provided metadata or extract on the fly
  const effectiveMetadata = soundMetadata || extractSoundKeywords(content, KEYWORD_MAP);
  const segments = reconstructStoryWithMetadata(content, effectiveMetadata);

  const renderSegmentsWithParagraphs = () => {
    const paragraphs = [];
    let currentParagraph = [];

    segments.forEach(seg => {
      if (seg.isKeyword) {
        currentParagraph.push(seg);
      } else {
        const parts = seg.split('\n');
        parts.forEach((part, index) => {
          if (index > 0) {
            paragraphs.push(currentParagraph);
            currentParagraph = [];
          }
          currentParagraph.push(part);
        });
      }
    });
    
    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph);
    }

    return paragraphs.map((p, i) => {
      // Filter out empty paragraphs
      const isEmpty = p.length === 0 || (p.length === 1 && typeof p[0] === 'string' && p[0].trim() === '');
      if (isEmpty) return null;

      return (
        <p key={i} className="leading-relaxed mb-6 last:mb-0">
          {p.map((item, j) =>
            item.isKeyword ? (
              <SoundButton key={j} keyword={item.keyword} soundType={item.soundType} />
            ) : (
              <React.Fragment key={j}>{item}</React.Fragment>
            )
          )}
        </p>
      );
    });
  };

  return (
    <Card className="rounded-2xl magical-shadow border-primary/20 overflow-hidden bg-card relative">
      {hideHeader && (
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary/40 via-secondary/40 to-primary/40"></div>
      )}
      
      {!hideHeader && (
        <CardHeader className="bg-primary/5 border-b border-primary/10 pb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
              {t('storyDetail.for')} {childName} {childAge ? `(${t('storyDetail.age')} ${childAge})` : ''}
            </span>
            <span className="text-sm text-muted-foreground">
              {format(new Date(), 'MMMM d, yyyy')}
            </span>
          </div>
          <CardTitle className="text-3xl md:text-4xl text-center magical-text py-2">
            {title}
          </CardTitle>
          <div className="text-center mt-2">
            <span className="inline-flex items-center text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
              <Sparkles className="w-3 h-3 mr-1 text-primary" />
              Interactive sounds! Click the highlighted words to play sounds.
            </span>
          </div>
        </CardHeader>
      )}

      <CardContent className={hideHeader ? "p-8 md:p-12 lg:p-16" : "pt-8 px-6 md:px-10"}>
        <div className={`text-foreground/90 ${textClass}`}>
          {renderSegmentsWithParagraphs()}
        </div>
      </CardContent>

      {!viewOnly && (
        <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center pt-6 pb-8 bg-muted/30 border-t border-border">
          <Button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="w-full sm:w-auto magical-gradient text-foreground hover:opacity-90 transition-all duration-200 active:scale-[0.98]"
          >
            {isSaving ? (
              <span className="flex items-center">
                <Sparkles className="w-4 h-4 mr-2 animate-spin" /> 
                {t('createStory.savingBtn')}
              </span>
            ) : (
              <span className="flex items-center">
                <Save className="w-4 h-4 mr-2" /> 
                {t('createStory.saveBtn')}
              </span>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            disabled={isSaving}
            className="w-full sm:w-auto transition-all duration-200 active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> 
            {t('createStory.returnDashboardBtn')}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default StoryWithSoundButtons;
