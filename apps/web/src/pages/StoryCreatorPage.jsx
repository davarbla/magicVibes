import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import StoryWithSoundButtons, { KEYWORD_MAP } from '@/components/StoryWithSoundButtons.jsx';
import StarRating from '@/components/StarRating.jsx';
import StoryActionButtons from '@/components/StoryActionButtons.jsx';
import ProgressIndicator from '@/components/ProgressIndicator.jsx';
import SendEmailDialog from '@/components/SendEmailDialog.jsx';
import StoryMusicPlayer from '@/components/StoryMusicPlayer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis.js';
import pb from '@/lib/pocketbaseClient.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { toast } from 'sonner';
import { Wand2, Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { extractSoundKeywords } from '@/lib/soundMetadata.js';

const LANGUAGES = [
  { id: 'Español', label: 'Español (Spanish)' },
  { id: 'English', label: 'English' },
  { id: 'Français', label: 'Français (French)' }
];

const LOCATION_KEYS = ['castle', 'forest', 'beach', 'space', 'garden', 'underwater', 'library', 'mountains'];
const VALUE_KEYS = ['friendship', 'courage', 'honesty', 'kindness', 'perseverance', 'creativity', 'teamwork', 'curiosity'];

const StoryCreatorPage = () => {
  const navigate = useNavigate();
  const { id: urlId } = useParams();
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const initialStoryId = (urlId && urlId !== 'null' && urlId !== 'undefined') ? urlId : null;
  const [storyId, setStoryId] = useState(initialStoryId);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [generatedStory, setGeneratedStory] = useState(null);

  const { isSpeaking, isPaused, currentTime, duration, togglePlayPause } = useSpeechSynthesis();

  const langMap = { es: 'Español', en: 'English', fr: 'Français' };

  const [formData, setFormData] = useState({
    language: langMap[language] || 'Español',
    child_id: 'todos',
    location: '',
    main_character: '',
    value_lesson: ''
  });

  useEffect(() => {
    console.log('[StoryCreatorPage] Mount/URL param extraction - storyId:', initialStoryId);
  }, [initialStoryId]);

  useEffect(() => {
    if (initialStoryId) {
      const fetchExistingStory = async () => {
        try {
          const record = await pb.collection('stories').getOne(initialStoryId, { $autoCancel: false });
          console.log('[StoryCreatorPage] Existing story fetched and verified:', record.id);
          
          setGeneratedStory({
            id: record.id,
            title: record.title,
            content: record.story,
            childName: record.child_name,
            childAge: record.child_age,
            language: record.language,
            // Restore background music settings when loading existing story
            background_music_id: record.background_music_id || 'none',
            background_music_volume: record.background_music_volume !== undefined ? record.background_music_volume : 30
          });
          setIsSaved(true);
        } catch (error) {
          console.error('[StoryCreatorPage] Invalid story ID or fetch error:', error);
          toast.error(t('storyDetail.notFoundTitle') || 'Invalid story ID. Redirecting to new story creation.');
          navigate('/create-story', { replace: true });
        }
      };
      fetchExistingStory();
    }
  }, [initialStoryId, navigate, t]);

  useEffect(() => {
    if (!generatedStory && !isGenerating) {
      setFormData(prev => ({ ...prev, language: langMap[language] || 'Español' }));
    }
  }, [language]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const childrenRecords = await pb.collection('children').getFullList({
          filter: `parent_user_id = "${currentUser.id}"`,
          sort: 'name',
          $autoCancel: false
        });
        setChildren(childrenRecords);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchData();
    }
  }, [currentUser, t]);

  const handleSelectChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Receive music state updates from StoryMusicPlayer
  const handleMusicChange = (musicState) => {
    if (!generatedStory) return;
    setGeneratedStory(prev => ({
      ...prev,
      background_music_id: musicState.trackId,
      background_music_volume: musicState.volume
    }));
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();

    if (!formData.location || !formData.main_character || !formData.value_lesson) {
      toast.error(t('createStory.fillRequired'));
      return;
    }

    setIsGenerating(true);

    try {
      let childName = 'Children';
      let childAge = 6;

      if (formData.child_id !== 'todos') {
        const selectedChild = children.find(c => c.id === formData.child_id);
        if (selectedChild) {
          childName = selectedChild.name;
          childAge = selectedChild.age || 6;
        }
      }

      const locationText = t(`createStory.locations.${formData.location}`);
      const valueText = t(`createStory.values.${formData.value_lesson}`);

      const payload = {
        childAge,
        location: locationText,
        mainCharacter: formData.main_character,
        valueLesson: valueText,
        childName,
        language: formData.language
      };

      const response = await apiServerClient.fetch('/story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('createStory.generateError'));
      }

      const data = await response.json();
      const metadataString = JSON.stringify(extractSoundKeywords(data.story, KEYWORD_MAP));
      
      const storyData = {
        title: data.title,
        story: data.story,
        user_id: currentUser.id,
        created_by: currentUser.name || 'Parent',
        sent_date: new Date().toISOString(),
        child_name: childName,
        child_age: childAge,
        location: locationText,
        main_character: formData.main_character,
        value_lesson: valueText,
        language: formData.language,
        sound_metadata: metadataString,
        background_music_id: "",
        background_music_volume: 30
      };

      if (formData.child_id !== 'todos') {
        storyData.child_id = formData.child_id;
      }

      const record = await pb.collection('stories').create(storyData, { $autoCancel: false });
      
      console.log('[StoryCreatorPage] STORY CREATED. Returned story ID:', record.id);

      setStoryId(record.id);
      setGeneratedStory({
        id: record.id,
        title: record.title,
        content: record.story,
        childName,
        childAge,
        language: formData.language,
        background_music_id: 'none',
        background_music_volume: 30
      });
      
      setIsSaved(true);
      toast.success(t('createStory.generateSuccess'));
      
      navigate(`/create-story/${record.id}`, { replace: true });

    } catch (error) {
      console.error('API/Network Error:', error);
      toast.error(error.message || t('createStory.generateError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (skipNavigation = false) => {
    if (!generatedStory) return false;
    
    console.log('[StoryCreatorPage] Before save/update operation - storyId:', storyId);
    
    if (!storyId || storyId === 'null' || storyId === 'undefined') {
      toast.error(t('common.error') || 'Story ID is missing. Cannot perform update operation.');
      return false;
    }
    
    if (!generatedStory.title || generatedStory.title.trim() === '') {
      toast.error(t('createStory.titleRequired') || 'Story title is required to save.');
      return false;
    }
    
    if (!generatedStory.content || generatedStory.content.trim() === '') {
      toast.error(t('createStory.contentRequired') || 'Story content is required to save.');
      return false;
    }
    
    setIsSaving(true);
    try {
      try {
        await pb.collection('stories').getOne(storyId, { $autoCancel: false });
        console.log('[StoryCreatorPage] Record verification successful for ID:', storyId);
      } catch (verifyError) {
        console.error('[StoryCreatorPage] Record verification failed:', verifyError);
        if (verifyError.status === 404) {
          toast.error('Story record not found. Please create a new story.');
          navigate('/create-story', { replace: true });
          return false;
        }
        throw verifyError;
      }

      const metadataString = JSON.stringify(extractSoundKeywords(generatedStory.content, KEYWORD_MAP));

      // Resolve 'none' to empty string for Pocketbase relation field
      const musicIdToSave = generatedStory.background_music_id === 'none' ? "" : generatedStory.background_music_id;

      await pb.collection('stories').update(storyId, {
        title: generatedStory.title,
        story: generatedStory.content,
        sound_metadata: metadataString,
        // Store background music selections in story record
        background_music_id: musicIdToSave,
        background_music_volume: generatedStory.background_music_volume
      }, { $autoCancel: false });

      setIsSaved(true);
      toast.success(t('createStory.saveSuccess') || 'Story saved successfully!');
      
      if (!skipNavigation) {
        navigate(`/stories/${storyId}`);
      }
      return true;
    } catch (error) {
      if (error.status === 404) {
        console.error('[StoryCreatorPage] 404 Error during update operation:', error);
        toast.error('Story record not found. Please create a new story.');
        navigate('/create-story', { replace: true });
        return false;
      }
      
      console.error('PocketBase Update Error:', error);
      toast.error(t('createStory.saveError') || 'Failed to save story. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const navigateToDashboard = () => {
    setShowUnsavedDialog(false);
    navigate('/dashboard', { replace: true });
  };

  const handleBackRequest = () => {
    if (generatedStory && !isSaved) {
      setShowUnsavedDialog(true);
    } else {
      navigateToDashboard();
    }
  };

  const handleConfirmSaveAndBack = async () => {
    const success = await handleSave(true);
    if (success) {
      navigateToDashboard();
    }
  };

  const handleConfirmDiscardAndBack = () => {
    navigateToDashboard();
  };

  const isActive = isSpeaking || isPaused;

  return (
    <>
      <Helmet>
        <title>{`${t('createStory.title')} - Magicvibes`}</title>
        <meta name="description" content={t('createStory.subtitle')} />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              
              {!generatedStory && (
                <div className="flex justify-between items-center mb-6">
                  <Button 
                    variant="ghost" 
                  onClick={navigateToDashboard}
                    className="-ml-4 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('createStory.backToDashboard')}
                  </Button>
                </div>
              )}

              {generatedStory ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="relative flex flex-col gap-6"
                >
                  <div className="flex flex-col lg:flex-row items-center justify-center gap-4 mb-2 flex-wrap">
                    <StoryActionButtons 
                      story={generatedStory} 
                      onSendEmail={() => setIsEmailDialogOpen(true)} 
                    />
                  </div>

                  {storyId && storyId !== 'null' && (
                    <div className="mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {/* Render background music player, connected to generatedStory state */}
                      <StoryMusicPlayer 
                        initialTrackId={generatedStory.background_music_id} 
                        initialVolume={generatedStory.background_music_volume}
                        onChange={handleMusicChange}
                      />
                    </div>
                  )}

                  {isActive && (
                    <div className="flex justify-center mb-2 animate-in fade-in slide-in-from-top-4 duration-500">
                      <ProgressIndicator 
                        currentTime={currentTime}
                        duration={duration}
                        isPlaying={isSpeaking && !isPaused}
                        onPlayPause={togglePlayPause}
                      />
                    </div>
                  )}

                  <StoryWithSoundButtons 
                    story={generatedStory}
                    onSave={() => handleSave(false)}
                    onBack={handleBackRequest}
                    isSaving={isSaving}
                  />
                  
                  {storyId && storyId !== 'null' && (
                    <div className="bg-card rounded-2xl magical-shadow border border-primary/10 overflow-hidden [&>div]:mt-0 [&>div]:border-t-0">
                      <StarRating storyId={storyId} />
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl magical-gradient mb-4 animate-pulse-glow">
                      <Wand2 className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="mb-2">{t('createStory.title')}</h1>
                    <p className="text-muted-foreground text-lg">{t('createStory.subtitle')}</p>
                  </div>

                  <Card className="rounded-2xl magical-shadow border-primary/10">
                    <form onSubmit={handleGenerate}>
                      <CardHeader>
                        <CardTitle>{t('createStory.ingredientsTitle')}</CardTitle>
                        <CardDescription>{t('createStory.ingredientsDesc')}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        
                        <div className="space-y-2">
                          <Label htmlFor="language" className="flex items-center gap-2">
                            {t('createStory.languageLabel')}
                          </Label>
                          <Select 
                            value={formData.language} 
                            onValueChange={(val) => handleSelectChange('language', val)}
                            disabled={isGenerating}
                          >
                            <SelectTrigger className="w-full text-foreground bg-primary/5 border-primary/20">
                              <SelectValue placeholder={t('createStory.languagePlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                              {LANGUAGES.map(lang => (
                                <SelectItem key={lang.id} value={lang.id}>
                                  {lang.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="child_id">{t('createStory.childLabel')}</Label>
                          <Select 
                            value={formData.child_id} 
                            onValueChange={(val) => handleSelectChange('child_id', val)}
                            disabled={loading || isGenerating}
                          >
                            <SelectTrigger className="w-full text-foreground">
                              <SelectValue placeholder={t('createStory.childPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todos">{t('common.allChildren')}</SelectItem>
                              {children.map(child => (
                                <SelectItem key={child.id} value={child.id}>
                                  {child.name} {child.age ? `(${t('storyDetail.age')} ${child.age})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="main_character">{t('createStory.characterLabel')}</Label>
                          <Input
                            id="main_character"
                            name="main_character"
                            value={formData.main_character}
                            onChange={handleInputChange}
                            placeholder={t('createStory.characterPlaceholder')}
                            required
                            disabled={isGenerating}
                            className="text-foreground"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="location">{t('createStory.locationLabel')}</Label>
                          <Select 
                            value={formData.location} 
                            onValueChange={(val) => handleSelectChange('location', val)}
                            disabled={isGenerating}
                          >
                            <SelectTrigger className="w-full text-foreground">
                              <SelectValue placeholder={t('createStory.locationPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                              {LOCATION_KEYS.map(loc => (
                                <SelectItem key={loc} value={loc}>
                                  {t(`createStory.locations.${loc}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="value_lesson">{t('createStory.valueLabel')}</Label>
                          <Select 
                            value={formData.value_lesson} 
                            onValueChange={(val) => handleSelectChange('value_lesson', val)}
                            disabled={isGenerating}
                          >
                            <SelectTrigger className="w-full text-foreground">
                              <SelectValue placeholder={t('createStory.valuePlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                              {VALUE_KEYS.map(val => (
                                <SelectItem key={val} value={val}>
                                  {t(`createStory.values.${val}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                      </CardContent>
                      <CardFooter className="pt-4 pb-6">
                        <Button
                          type="submit"
                          disabled={isGenerating}
                          className="w-full text-lg h-14 magical-gradient text-foreground hover:opacity-90 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]"
                        >
                          {isGenerating ? (
                            <span className="flex items-center">
                              <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                              {t('createStory.generatingBtn')} {formData.language}...
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <Wand2 className="w-5 h-5 mr-2" />
                              {t('createStory.generateBtn')}
                            </span>
                          )}
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </main>

        <Footer />

        <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {language === 'es' ? 'Historia no guardada' : language === 'fr' ? 'Histoire non enregistrée' : 'Unsaved Story'}
              </DialogTitle>
              <DialogDescription>
                {language === 'es' ? '¿Quieres guardar esta historia antes de salir?' : language === 'fr' ? 'Voulez-vous enregistrer cette histoire avant de quitter ?' : 'Do you want to save this story before leaving?'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
              <Button variant="outline" onClick={handleConfirmDiscardAndBack} className="w-full sm:w-auto">
                {language === 'es' ? 'Volver sin guardar' : language === 'fr' ? 'Retourner sans enregistrer' : 'Go back without saving'}
              </Button>
              <Button onClick={handleConfirmSaveAndBack} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {language === 'es' ? 'Guardar y volver' : language === 'fr' ? 'Enregistrer et retourner' : 'Save and go back'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <SendEmailDialog 
          open={isEmailDialogOpen} 
          onOpenChange={setIsEmailDialogOpen} 
          story={generatedStory}
          storyTitle={generatedStory?.title} 
          storyContent={generatedStory?.content}
          storyId={storyId}
        />
      </div>
    </>
  );
};

export default StoryCreatorPage;
