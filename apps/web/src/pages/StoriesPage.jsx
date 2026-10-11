import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import StoryCard from '@/components/StoryCard.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { BookOpen, RefreshCw, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils.js';
import { toast } from 'sonner';

const StoriesPage = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [stories, setStories] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedChild, setSelectedChild] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [storiesData, childrenData] = await Promise.all([
        pb.collection('stories').getList(1, 50, {
          filter: `user_id = "${currentUser.id}"`,
          sort: '-created',
          expand: 'child_id',
          $autoCancel: false
        }),
        pb.collection('children').getFullList({
          filter: `parent_user_id = "${currentUser.id}"`,
          sort: 'name',
          $autoCancel: false
        })
      ]);

      setStories(storiesData.items || []);
      setChildren(childrenData);
    } catch (err) {
      console.error('Error loading stories:', err);
      setError(t('stories.loadError') || 'Failed to load stories. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Refetch when component mounts or when navigation state changes (e.g., returning from detail page)
  useEffect(() => {
    if (currentUser?.id) {
      loadData();
    }
  }, [location.key, currentUser?.id]);

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm(t('stories.confirmDelete') || 'Are you sure you want to delete this story?')) {
      return;
    }

    setDeletingId(storyId);
    try {
      // 1. Verify the record exists first
      await pb.collection('stories').getOne(storyId, { $autoCancel: false });
      
      // 2. Proceed with deletion
      await pb.collection('stories').delete(storyId, { $autoCancel: false });
      
      toast.success(t('stories.deleteSuccess') || 'Story deleted successfully');
      
      // 3. Refresh the list
      loadData(true);
    } catch (err) {
      console.error('Error deleting story:', err);
      
      if (err.status === 404) {
        toast.error(t('stories.notFoundError') || 'Story not found or already deleted');
        // Refresh list to remove the stale item
        loadData(true);
      } else if (err.status === 403) {
        toast.error(t('stories.permissionError') || 'Permission denied to delete this story');
      } else {
        toast.error(t('stories.deleteError') || 'Network error or failed to delete story');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const filteredStories = selectedChild === 'all'
    ? stories
    : stories.filter(story => story.child_id === selectedChild);

  if (loading && !isRefreshing) {
    return (
      <>
        <Header />
        <div className="min-h-screen py-12 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
              <Skeleton className="h-12 w-64 rounded-xl" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-64 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${t('stories.title') || 'My Stories'} - Magicvibes`}</title>
        <meta name="description" content={t('stories.subtitle') || 'View and manage your generated stories'} />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight mb-3">{t('stories.title') || 'My Stories'}</h1>
                  <p className="text-lg text-muted-foreground">{t('stories.subtitle') || 'View and manage your generated stories'}</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => loadData(true)}
                  disabled={isRefreshing || loading}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className={cn("w-4 h-4 mr-2", (isRefreshing || loading) && "animate-spin")} />
                  {t('common.refresh') || 'Refresh'}
                </Button>
              </div>

              {error ? (
                <div className="text-center py-24 bg-destructive/5 rounded-3xl border border-destructive/20 shadow-sm max-w-2xl mx-auto">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-6">
                    <AlertTriangle className="w-10 h-10 text-destructive" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">{t('common.error') || 'Error Loading Stories'}</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-8">
                    {error}
                  </p>
                  <Button 
                    onClick={() => loadData(true)}
                    size="lg"
                    className="rounded-xl font-medium"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('common.retry') || 'Retry'}
                  </Button>
                </div>
              ) : (
                <>
                  {children.length > 0 && (
                    <div className="mb-8 max-w-xs">
                      <Label htmlFor="child-filter" className="mb-2 block text-sm font-medium">{t('stories.filterLabel') || 'Filter by child'}</Label>
                      <Select value={selectedChild} onValueChange={setSelectedChild}>
                        <SelectTrigger id="child-filter" className="bg-card">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('stories.allChildren') || 'All Children'}</SelectItem>
                          {children.map((child) => (
                            <SelectItem key={child.id} value={child.id}>
                              {child.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {filteredStories.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredStories.map((story) => (
                        <StoryCard
                          key={story.id}
                          story={story}
                          childName={story.child_name || story.expand?.child_id?.name}
                          onClick={() => navigate(`/stories/${story.id}`)}
                          onDelete={() => handleDeleteStory(story.id)}
                          isDeleting={deletingId === story.id}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-24 bg-card rounded-3xl border border-border/50 shadow-sm">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                        <BookOpen className="w-10 h-10 text-primary" />
                      </div>
                      <h3 className="text-2xl font-semibold mb-3">{t('stories.emptyTitle') || 'No stories found'}</h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-8">
                        {t('stories.emptyDesc') || 'You haven\'t created any stories yet. Start your magical journey by creating one!'}
                      </p>
                      <Button 
                        onClick={() => navigate('/create-story')}
                        size="lg"
                        className="rounded-xl font-medium"
                      >
                        {t('stories.createBtn') || 'Create a Story'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default StoriesPage;