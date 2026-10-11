import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, RefreshCw, ArrowLeft, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

const StoryDisplay = ({ title, content, childName, childAge, onSave, onRegenerate, onBack, isSaving }) => {
  const { t } = useLanguage();
  
  // Determine formatting based on age
  let textClass = "text-base leading-relaxed";
  if (childAge <= 4) {
    textClass = "text-2xl leading-loose font-medium";
  } else if (childAge <= 7) {
    textClass = "text-xl leading-relaxed";
  } else if (childAge <= 10) {
    textClass = "text-lg leading-relaxed";
  }

  const paragraphs = content.split('\n').filter(p => p.trim() !== '');

  return (
    <Card className="rounded-2xl magical-shadow border-primary/20 overflow-hidden bg-card">
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
      </CardHeader>
      <CardContent className="pt-8 px-6 md:px-10">
        <div className={`space-y-6 text-foreground/90 ${textClass}`}>
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center pt-6 pb-8 bg-muted/30 border-t border-border">
        <Button
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
          variant="outline"
          onClick={onRegenerate}
          disabled={isSaving}
          className="w-full sm:w-auto transition-all duration-200 active:scale-[0.98]"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> 
          {t('createStory.regenerateBtn')}
        </Button>
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isSaving}
          className="w-full sm:w-auto transition-all duration-200 active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> 
          {t('createStory.returnDashboardBtn')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StoryDisplay;