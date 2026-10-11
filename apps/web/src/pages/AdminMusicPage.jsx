import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Music, Upload, Trash2, Play, Pause, Loader2, LogOut, LayoutDashboard } from 'lucide-react';

const FileDropzone = ({ type, title, description, uploading, onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files[0], type);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files[0], type);
    }
    e.target.value = '';
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[200px] ${
        isDragging 
          ? 'border-primary bg-primary/5 scale-[1.02]' 
          : 'border-border bg-card hover:bg-muted/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".mp3,.wav,.ogg,.m4a,audio/mpeg,audio/wav,audio/ogg,audio/mp4" 
        onChange={handleFileSelect} 
        disabled={uploading}
      />
      
      {uploading ? (
        <div className="flex flex-col items-center justify-center text-primary">
          <Loader2 className="w-8 h-8 mb-4 animate-spin" />
          <p className="font-medium animate-pulse">Uploading...</p>
        </div>
      ) : (
        <>
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Upload className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-lg mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">{description}</p>
        </>
      )}
    </div>
  );
};

const AdminMusicPage = () => {
  const { logout, currentAdmin } = useAdminAuth();
  const navigate = useNavigate();
  
  const [bgMusic, setBgMusic] = useState([]);
  const [sfx, setSfx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  
  const audioRef = useRef(new Audio());

  const fetchFiles = async () => {
    try {
      const [bgResult, sfxResult] = await Promise.all([
        pb.collection('audio_library').getList(1, 100, {
          filter: 'type="background_music"',
          sort: '-created',
          $autoCancel: false
        }),
        pb.collection('audio_library').getList(1, 100, {
          filter: 'type="sound_effect"',
          sort: '-created',
          $autoCancel: false
        })
      ]);
      
      setBgMusic(bgResult.items);
      setSfx(sfxResult.items);
    } catch (error) {
      console.error('Error fetching audio files:', error);
      toast.error('Failed to load audio library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    
    const audio = audioRef.current;
    const handleEnded = () => setPlayingId(null);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, []);

  const handleFileUpload = async (file, type) => {
    // File validation
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'];
    const validExtensions = /\.(mp3|wav|ogg|m4a|mp4)$/i;
    
    if (!validTypes.includes(file.type) && !file.name.match(validExtensions)) {
      toast.error(`Invalid file type. Please upload MP3, WAV, OGG, or M4A files. Detected: ${file.type}`);
      return;
    }

    setUploadingType(type);
    try {
      // Use filename as title, strip extension
      const title = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
      
      const formData = new FormData();
      formData.append('title', title);
      formData.append('type', type);
      formData.append('audio_file', file);

      await pb.collection('audio_library').create(formData, { $autoCancel: false });
      toast.success('Audio file uploaded successfully');
      
      await fetchFiles();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploadingType(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this audio file?')) return;
    
    setDeletingId(id);
    try {
      if (playingId === id) {
        audioRef.current.pause();
        setPlayingId(null);
      }
      
      await pb.collection('audio_library').delete(id, { $autoCancel: false });
      toast.success('File deleted successfully');
      await fetchFiles();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
    } finally {
      setDeletingId(null);
    }
  };

  const togglePlay = (record) => {
    const audio = audioRef.current;
    
    if (playingId === record.id) {
      audio.pause();
      setPlayingId(null);
    } else {
      const url = pb.files.getUrl(record, record.audio_file);
      audio.src = url;
      audio.play().catch(err => {
        console.error('Playback error:', err);
        toast.error('Could not play audio file');
        setPlayingId(null);
      });
      setPlayingId(record.id);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  const renderFileList = (list, emptyMessage) => {
    if (loading) {
      return (
        <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p>Loading files...</p>
        </div>
      );
    }
    
    if (list.length === 0) {
      return (
        <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed flex flex-col items-center justify-center">
          <Music className="w-8 h-8 mb-3 opacity-20" />
          <p>{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {list.map(file => (
          <div key={file.id} className="flex items-center justify-between p-4 bg-card border rounded-xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30 group">
            <div className="flex items-center gap-4">
              <Button
                variant={playingId === file.id ? "default" : "secondary"}
                size="icon"
                className="h-10 w-10 rounded-full shrink-0 transition-colors"
                onClick={() => togglePlay(file)}
              >
                {playingId === file.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </Button>
              <div>
                <p className="font-medium text-sm text-foreground">{file.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs font-normal">
                    {file.type === 'background_music' ? 'Background Music' : 'Sound Effect'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(file.created).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
              onClick={() => handleDelete(file.id)}
              disabled={deletingId === file.id}
            >
              {deletingId === file.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Audio Library Management - Admin</title>
      </Helmet>
      
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
        <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b sticky top-0 z-30">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Music className="w-4 h-4 text-primary" />
              </div>
              <h1 className="font-semibold text-lg tracking-tight">Audio Library</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/admin/dashboard')}
                className="hidden sm:flex text-muted-foreground hover:text-foreground"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <span className="text-sm text-muted-foreground hidden md:inline-block">{currentAdmin?.email}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Background Music Column */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Background Music</h2>
                <p className="text-muted-foreground text-sm mb-6">Continuous ambient tracks that play behind stories.</p>
                <FileDropzone 
                  type="background_music"
                  title="Drop Background Music"
                  description="Drag & drop MP3, WAV, or OGG files here, or click to browse."
                  uploading={uploadingType === 'background_music'}
                  onUpload={handleFileUpload}
                />
              </div>

              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Uploaded Tracks</span>
                    <Badge variant="secondary">{bgMusic.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderFileList(bgMusic, "No background music uploaded yet.")}
                </CardContent>
              </Card>
            </div>

            {/* Sound Effects Column */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Sound Effects</h2>
                <p className="text-muted-foreground text-sm mb-6">Short, specific sounds triggered by story keywords.</p>
                <FileDropzone 
                  type="sound_effect"
                  title="Drop Sound Effects"
                  description="Drag & drop MP3, WAV, or OGG files here, or click to browse."
                  uploading={uploadingType === 'sound_effect'}
                  onUpload={handleFileUpload}
                />
              </div>

              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Uploaded Effects</span>
                    <Badge variant="secondary">{sfx.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderFileList(sfx, "No sound effects uploaded yet.")}
                </CardContent>
              </Card>
            </div>
            
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminMusicPage;