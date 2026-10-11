import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Music, Calendar, HardDrive, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function MusicLibraryManager() {
  const { currentUser } = useAuth();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchTracks = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const records = await pb.collection('music_library').getList(1, 50, {
        filter: `user_id="${currentUser.id}"`,
        sort: '-created',
        $autoCancel: false
      });
      setTracks(records.items);
    } catch (error) {
      console.error('Error fetching music library:', error);
      toast.error('Failed to load your music library.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();

    const handleUpdate = () => fetchTracks();
    window.addEventListener('music-library-updated', handleUpdate);
    return () => window.removeEventListener('music-library-updated', handleUpdate);
  }, [currentUser]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this track?')) return;

    setDeletingId(id);
    try {
      await pb.collection('music_library').delete(id, { $autoCancel: false });
      toast.success('Track deleted successfully.');
      setTracks(tracks.filter(t => t.id !== id));
      window.dispatchEvent(new Event('music-library-updated'));
    } catch (error) {
      console.error('Error deleting track:', error);
      toast.error('Failed to delete track.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!currentUser) return null;

  return (
    <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Music className="w-5 h-5 text-primary" />
          Your Music Library
        </CardTitle>
        <CardDescription>
          Manage your custom uploaded background music tracks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed rounded-xl border-muted-foreground/20 bg-muted/10">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Music className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No custom music yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Upload your own audio files to use them as background music for your stories.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tracks.map((track) => (
              <div 
                key={track.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Music className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-foreground truncate">{track.title}</h4>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {formatBytes(track.file_size)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(track.created), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(track.id)}
                  disabled={deletingId === track.id}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 self-end sm:self-auto"
                >
                  {deletingId === track.id ? (
                    <AlertCircle className="w-4 h-4 animate-pulse" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}