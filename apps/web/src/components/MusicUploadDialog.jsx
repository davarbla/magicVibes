import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';
import { Loader2, UploadCloud, Music, AlertCircle } from 'lucide-react';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function MusicUploadDialog({ open, onOpenChange, onSuccess }) {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error('File is too large. Maximum size is 50MB.');
      e.target.value = '';
      setFile(null);
      return;
    }

    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }
    setUploadError(null);
  };

  const resetForm = () => {
    setTitle('');
    setFile(null);
    setProgress(0);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = (newOpen) => {
    if (!isUploading) {
      onOpenChange(newOpen);
      if (!newOpen) resetForm();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title.trim() || !currentUser) return;

    setIsUploading(true);
    setProgress(10);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('audio_file', file);
      formData.append('user_id', currentUser.id);
      formData.append('file_format', file.type || 'audio/unknown');
      formData.append('file_size', file.size);

      console.log('--- [MusicUploadDialog] Submitting FormData ---');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `[File: ${value.name}]` : value);
      }

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 15, 90));
      }, 500);

      await pb.collection('music_library').create(formData, { $autoCancel: false });
      
      clearInterval(progressInterval);
      setProgress(100);
      
      toast.success('Music uploaded successfully!');
      window.dispatchEvent(new Event('music-library-updated'));
      
      if (onSuccess) onSuccess();
      
      setTimeout(() => {
        handleClose(false);
      }, 500);
    } catch (error) {
      console.error('--- [MusicUploadDialog] Upload Error ---');
      console.error('Full Error:', error);
      console.error('Response Data:', error.response?.data);
      
      setProgress(0);
      
      let detailedError = error.message || 'Failed to upload music. Please try again.';
      
      if (error.response?.data) {
        const data = error.response.data;
        const fieldErrors = [];
        
        for (const [field, details] of Object.entries(data)) {
          if (details?.message) {
            fieldErrors.push(`${field}: ${details.message}`);
          }
        }
        
        if (fieldErrors.length > 0) {
          detailedError = `Validation failed: ${fieldErrors.join(' | ')}`;
        } else if (data.message) {
          detailedError = data.message;
        }
      }
      
      setUploadError(detailedError);
      toast.error('Upload failed. See details in the dialog.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-primary" />
            Upload Custom Music
          </DialogTitle>
          <DialogDescription>
            Add your own background music. Supported formats: MP3, WAV, OGG, FLAC, M4A (Max 50MB).
          </DialogDescription>
        </DialogHeader>

        {uploadError && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm break-words">
              {uploadError}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="music-title">Track Title</Label>
            <Input
              id="music-title"
              placeholder="e.g., Magical Forest Theme"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
              required
              className="text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="music-file">Audio File</Label>
            <div className="flex items-center gap-3">
              <Input
                id="music-file"
                type="file"
                accept=".mp3,.wav,.ogg,.flac,.m4a,audio/*"
                onChange={handleFileChange}
                disabled={isUploading}
                ref={fileInputRef}
                required
                className="cursor-pointer text-foreground file:text-foreground file:bg-muted file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4 file:hover:bg-muted/80"
              />
            </div>
            {file && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                <Music className="w-3 h-3" />
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            )}
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!file || !title.trim() || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading
                </>
              ) : (
                'Upload Track'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}