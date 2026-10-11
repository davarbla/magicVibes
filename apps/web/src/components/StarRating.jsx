import React, { useState, useEffect } from 'react';
import { Star, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import pb from '@/lib/pocketbaseClient';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext.jsx';

const StarRating = ({ storyId }) => {
  const { t } = useLanguage();
  const [hoverValue, setHoverValue] = useState(0);
  const [selectedValue, setSelectedValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const fetchRatings = async () => {
    setIsLoadingStats(true);
    try {
      const records = await pb.collection('story_ratings').getFullList({
        filter: `story_id = "${storyId}"`,
        $autoCancel: false
      });
      
      if (records.length > 0) {
        const sum = records.reduce((acc, curr) => acc + curr.rating, 0);
        setAverageRating((sum / records.length).toFixed(1));
        setTotalRatings(records.length);
      } else {
        setAverageRating(0);
        setTotalRatings(0);
      }
    } catch (err) {
      console.error('Error fetching ratings:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (storyId) {
      fetchRatings();
    }
  }, [storyId]);

  const handleRate = async (rating) => {
    if (isSubmitting || isSuccess) return;
    
    setIsSubmitting(true);
    setError(null);
    setSelectedValue(rating);

    try {
      await pb.collection('story_ratings').create({
        story_id: storyId,
        rating: rating
      }, { $autoCancel: false });

      setIsSuccess(true);
      fetchRatings(); // Refresh stats

      // Reset success message after 2 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedValue(0); // Reset selection so they can rate again if they want, or leave it
      }, 2000);

    } catch (err) {
      console.error('Error submitting rating:', err);
      setError('Failed to submit rating. Please try again.');
      setSelectedValue(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 mt-8 border-t border-border/50">
      <h3 className="text-lg font-medium mb-4 text-foreground/80">
        Te ha gustado? Puntúa la historia
      </h3>
      
      <div className="flex items-center gap-2 mb-2 relative h-12">
        {isSubmitting ? (
          <div className="flex items-center justify-center w-full h-full absolute inset-0 bg-background/50 backdrop-blur-sm z-10 rounded-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : null}
        
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={isSubmitting || isSuccess}
            className="p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full disabled:opacity-50 disabled:hover:scale-100"
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            onClick={() => handleRate(star)}
            aria-label={`Rate ${star} stars`}
          >
            <Star
              className={cn(
                "w-8 h-8 transition-all duration-200",
                (hoverValue || selectedValue) >= star
                  ? "fill-yellow-400 text-yellow-400 drop-shadow-sm"
                  : "text-muted-foreground/40 hover:text-muted-foreground/60"
              )}
            />
          </button>
        ))}
      </div>

      <div className="h-6 mt-2 flex items-center justify-center">
        {isSuccess ? (
          <span className="text-sm font-medium text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-bottom-2">
            {t('storyDetail.ratingSuccess') || 'Thank you for rating!'}
          </span>
        ) : error ? (
          <div className="flex items-center text-sm text-destructive">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span>{error}</span>
            <Button 
              variant="link" 
              size="sm" 
              className="px-2 h-auto py-0 ml-1 text-destructive underline"
              onClick={() => setError(null)}
            >
              Retry
            </Button>
          </div>
        ) : isLoadingStats ? (
          <span className="text-sm text-muted-foreground animate-pulse">
            Loading ratings...
          </span>
        ) : totalRatings > 0 ? (
          <span className="text-sm text-muted-foreground font-medium">
            {averageRating} ⭐ based on {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">
            No ratings yet. Be the first!
          </span>
        )}
      </div>
    </div>
  );
};

export default StarRating;