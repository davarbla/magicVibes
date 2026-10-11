import { useState, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';

export function useMusicLibrary() {
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getMusicTracks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const records = await pb.collection('music_library').getFullList({
        sort: '-created',
        $autoCancel: false
      });
      setTracks(records);
      return records;
    } catch (err) {
      console.error('Error fetching music tracks:', err);
      setError(err);
      toast.error('Failed to load music library.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadMusicTrack = async (inputData) => {
    setIsLoading(true);
    setError(null);
    
    console.log('--- [useMusicLibrary] UPLOAD START ---');
    console.log('1. Input Data:', inputData);
    console.log('2. Current User ID:', pb.authStore.model?.id);

    try {
      const submitData = new FormData();
      const allowedFields = [
        'title', 
        'audio_file', 
        'file_format', 
        'file_size', 
        'artist', 
        'duration', 
        'genre', 
        'description'
      ];

      if (inputData instanceof FormData) {
        for (const field of allowedFields) {
          if (inputData.has(field)) {
            submitData.append(field, inputData.get(field));
          }
        }
      } else {
        for (const field of allowedFields) {
          if (inputData[field] !== undefined && inputData[field] !== null) {
            submitData.append(field, inputData[field]);
          }
        }
      }

      if (pb.authStore.model?.id) {
        submitData.append('user_id', pb.authStore.model.id);
      } else {
        throw new Error('Authentication required to upload music.');
      }

      // 3. Log File Properties
      const fileObj = submitData.get('audio_file');
      if (fileObj instanceof File) {
        console.log('3. File Properties:', {
          name: fileObj.name,
          size: fileObj.size,
          type: fileObj.type,
          lastModified: fileObj.lastModified
        });
      } else {
        console.log('3. No valid File object found in audio_file field.');
      }

      // 4. Log FormData contents before sending
      console.log('4. Final FormData Contents:');
      for (let [key, value] of submitData.entries()) {
        console.log(`   - ${key}:`, value instanceof File ? `[File: ${value.name} (${value.size} bytes)]` : value);
      }

      const record = await pb.collection('music_library').create(submitData, {
        $autoCancel: false
      });
      
      console.log('--- [useMusicLibrary] UPLOAD SUCCESS ---', record);
      setTracks(prev => [record, ...prev]);
      toast.success('Music track uploaded successfully.');
      return record;
    } catch (err) {
      console.error('--- [useMusicLibrary] UPLOAD FAILED ---');
      console.error('Full Error Object:', err);
      console.error('Error Status:', err.status);
      console.error('Error Response Data:', err.response?.data);
      
      setError(err);
      
      let errorMessage = err.message || 'Failed to upload music track.';
      
      if (err.response?.data) {
        const data = err.response.data;
        const fieldErrors = [];
        
        for (const [field, details] of Object.entries(data)) {
          if (details?.message) {
            fieldErrors.push(`${field}: ${details.message}`);
          }
        }
        
        if (fieldErrors.length > 0) {
          errorMessage = `Validation failed: ${fieldErrors.join(' | ')}`;
        } else if (data.message) {
          errorMessage = data.message;
        }
      }
      
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMusicTrack = async (id) => {
    setIsLoading(true);
    setError(null);
    try {
      await pb.collection('music_library').delete(id, {
        $autoCancel: false
      });
      setTracks(prev => prev.filter(track => track.id !== id));
      toast.success('Music track deleted successfully.');
    } catch (err) {
      console.error('Error deleting music track:', err);
      setError(err);
      toast.error('Failed to delete music track.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    tracks,
    isLoading,
    error,
    getMusicTracks,
    uploadMusicTrack,
    deleteMusicTrack
  };
}