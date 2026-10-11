import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, Wand2, MapPin, User, Star, Heart, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import StoryWithSoundButtons from '@/components/StoryWithSoundButtons.jsx';
import { parseSoundMetadata } from '@/lib/soundMetadata.js';
import StarRating from '@/components/StarRating.jsx';
import StoryActionButtons from '@/components/StoryActionButtons.jsx';
import ProgressIndicator from '@/components/ProgressIndicator.jsx';
import SendEmailDialog from '@/components/SendEmailDialog.jsx';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis.js';
import StoryMusicPlayer from '@/components/StoryMusicPlayer.jsx';

const StoryDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const { isSpeaking, isPaused, currentTime, duration, togglePlayPause } = useSpeechSynthesis();

  const fetchStory = async () => {
    setLoading(true);
    setError(null);
    try {
      const record = await pb.collection('stories').getOne(id, {
        expand: 'child_id',
        $autoCancel: false
      });
      setStory(record);
    } catch (err) {
      console.error('[StoryDetailPage] Error fetching story:', err);
      if (err.status === 404) {
        setError(t('storyDetail.notFoundDesc'));
      } else {
        setError(t('storyDetail.loadError'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchStory();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!story?.id) return;
    if (!window.confirm(t('storyDetail.deleteConfirm'))) {
      return;
    }
    setIsDeleting(true);
    try {
      await pb.collection('stories').delete(story.id, {
        $autoCancel: false
      });
      toast.success(t('storyDetail.deleteSuccess'));
      setStory(null);
      setTimeout(() => {
        navigate('/stories');
      }, 500);
    } catch (err) {
      console.error('Error deleting story:', err);
      if (err.status === 404) {
        toast.error(t('storyDetail.alreadyDeleted'));
        setTimeout(() => {
          navigate('/stories');
        }, 1500);
      } else {
        toast.error(err.message || t('storyDetail.deleteFailed'));
        setIsDeleting(false);
      }
    }
  };

  const renderLoadingState = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
      <Skeleton className="h-16 w-3/4 rounded-xl mx-auto" />
      <div className="flex justify-center gap-4">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-32 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      <Card className="rounded-3xl border-none shadow-sm">
        <CardContent className="p-8 md:p-12 space-y-6">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-11/12" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    </div>
  );

  const renderErrorState = () => (
    <div className="max-w-2xl mx-auto text-center py-20">
      <Card className="rounded-3xl border-destructive/20 bg-destructive/5">
        <CardContent className="p-12 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-semibold mb-4">
            {error === t('storyDetail.notFoundDesc') ? t('storyDetail.notFoundTitle') : t('common.error')}
          </h2>
          <p className="text-muted-foreground mb-8">
            {error}
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/stories')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Button>
            {error !== t('storyDetail.notFoundDesc') && (
              <Button onClick={fetchStory}>
                {t('common.tryAgain')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStoryContent = () => {
    if (!story) return null;

    const storyText = story.story || story.content || '';
    const paragraphs = storyText.split('\n').filter(p => p.trim() !== '');
    const childName = story.child_name || story.expand?.child_id?.name;
    const parsedMetadata = parseSoundMetadata(story.sound_metadata).filter(m => m.type !== 'background_music');
    const hasMetadata = parsedMetadata.length > 0;
    const isActive = isSpeaking || isPaused;

    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate('/stories')} className="text-muted-foreground hover:text-foreground -ml-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('storyDetail.backToLibrary')}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isDeleting} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title={t('common.delete')}>
            {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
          </Button>
        </div>

        <div className="text-center mb-8 space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-balance leading-tight">
            {story.title}
          </h1>
          
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            {childName && (
              <Badge variant="secondary" className="px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 border-none text-sm font-medium">
                <User className="w-4 h-4 mr-2" />
                {t('storyDetail.for')} {childName} {story.child_age ? `(${t('storyDetail.age')} ${story.child_age})` : ''}
              </Badge>
            )}
            {story.location && (
              <Badge variant="outline" className="px-3 py-1.5 rounded-full text-sm font-medium">
                <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                {story.location}
              </Badge>
            )}
            {story.main_character && (
              <Badge variant="outline" className="px-3 py-1.5 rounded-full text-sm font-medium">
                <Star className="w-4 h-4 mr-2 text-muted-foreground" />
                {story.main_character}
              </Badge>
            )}
            {story.value_lesson && (
              <Badge variant="outline" className="px-3 py-1.5 rounded-full text-sm font-medium">
                <Heart className="w-4 h-4 mr-2 text-muted-foreground" />
                {story.value_lesson}
              </Badge>
            )}
            {story.created && (
              <Badge variant="outline" className="px-3 py-1.5 rounded-full text-sm font-medium border-dashed">
                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                {format(new Date(story.created), 'MMMM d, yyyy')}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 mb-8 flex-wrap">
          <StoryActionButtons story={story} onSendEmail={() => setIsEmailDialogOpen(true)} />
        </div>

        {/* Story Music Player */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <StoryMusicPlayer storyId={story.id} currentBackgroundMusicId={story.background_music_id} />
        </div>

        {isActive && (
          <div className="flex justify-center mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <ProgressIndicator currentTime={currentTime} duration={duration} isPlaying={isSpeaking && !isPaused} onPlayPause={togglePlayPause} />
          </div>
        )}

        {hasMetadata ? (
          <div className="mb-8">
            <StoryWithSoundButtons story={{
              title: story.title,
              content: storyText,
              childName: childName,
              childAge: story.child_age
            }} soundMetadata={parsedMetadata} viewOnly={true} hideHeader={true} />
          </div>
        ) : (
          <Card className="rounded-[2rem] border-none shadow-xl bg-card overflow-hidden relative mb-8">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary/40 via-secondary/40 to-primary/40"></div>
            <CardContent className="p-8 md:p-12 lg:p-16">
              <div className="prose prose-lg md:prose-xl dark:prose-invert max-w-none">
                {paragraphs.map((paragraph, index) => (
                  <p key={index} className="text-foreground/90 leading-relaxed mb-6 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <StarRating storyId={story.id} />

        <div className="mt-12 flex justify-center">
          <Button size="lg" onClick={() => navigate('/create-story')} className="rounded-full px-8 h-14 text-lg magical-gradient hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <Wand2 className="w-5 h-5 mr-2" />
            {t('storyDetail.createAnother')}
          </Button>
        </div>

        <SendEmailDialog 
          open={isEmailDialogOpen} 
          onOpenChange={setIsEmailDialogOpen} 
          story={story}
          storyTitle={story?.title}
        />
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return renderLoadingState();
    }
    if (error) {
      return renderErrorState();
    }
    return renderStoryContent();
  };

  return (
    <>
      <Helmet>
        <title>{story ? `${story.title} - Magicvibes` : t('common.loading')}</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background/50">
        <Header />

        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {renderContent()}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default StoryDetailPage;