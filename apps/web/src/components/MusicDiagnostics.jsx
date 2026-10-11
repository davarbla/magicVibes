import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Activity, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';

export default function MusicDiagnostics() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState({});
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
    setLogs(prev => [`[${new Date().toISOString().split('T')[1].slice(0, -1)}] ${msg}`, ...prev].slice(0, 50));
  };

  useEffect(() => {
    const fetchTracks = async () => {
      addLog('Fetching music_library collection...');
      try {
        const records = await pb.collection('music_library').getFullList({
          $autoCancel: false
        });
        setTracks(records);
        addLog(`Found ${records.length} tracks.`);
      } catch (err) {
        addLog(`Error fetching tracks: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchTracks();
  }, []);

  const getTrackUrl = (track) => {
    if (!track || !track.audio_file) return '';
    const fileUrl = pb.files.getURL(track, track.audio_file);
    const origin = window.location.origin;
    if (fileUrl.startsWith('http')) return fileUrl;
    return `${origin}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
  };

  const testHttpStatus = async (track) => {
    const url = getTrackUrl(track);
    addLog(`Testing HTTP status for: ${track.title}`);
    try {
      const response = await fetch(url, { method: 'HEAD' });
      addLog(`HTTP Status for ${track.title}: ${response.status} ${response.statusText}`);
      setTestResults(prev => ({
        ...prev,
        [track.id]: { ...prev[track.id], status: response.status, ok: response.ok }
      }));
    } catch (err) {
      addLog(`Fetch error for ${track.title}: ${err.message}`);
      setTestResults(prev => ({
        ...prev,
        [track.id]: { ...prev[track.id], status: 'Error', ok: false, error: err.message }
      }));
    }
  };

  const testPlay = (track) => {
    const url = getTrackUrl(track);
    addLog(`Testing playback for: ${track.title}`);
    const audio = new Audio(url);
    
    audio.addEventListener('loadstart', () => addLog(`[${track.title}] Event: loadstart`));
    audio.addEventListener('canplay', () => addLog(`[${track.title}] Event: canplay`));
    audio.addEventListener('error', (e) => {
      addLog(`[${track.title}] Event: error - ${audio.error?.message || 'Unknown error'}`);
      setTestResults(prev => ({
        ...prev,
        [track.id]: { ...prev[track.id], playError: audio.error?.message || 'Playback failed' }
      }));
    });

    audio.play().then(() => {
      addLog(`[${track.title}] Playback started successfully.`);
      setTestResults(prev => ({
        ...prev,
        [track.id]: { ...prev[track.id], playing: true }
      }));
      setTimeout(() => {
        audio.pause();
        addLog(`[${track.title}] Playback stopped after 2s test.`);
        setTestResults(prev => ({
          ...prev,
          [track.id]: { ...prev[track.id], playing: false }
        }));
      }, 2000);
    }).catch(err => {
      addLog(`[${track.title}] Playback error: ${err.message}`);
      setTestResults(prev => ({
        ...prev,
        [track.id]: { ...prev[track.id], playError: err.message }
      }));
    });
  };

  return (
    <Card className="mt-8 border-primary/20 shadow-md">
      <CardHeader className="bg-muted/50 pb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <CardTitle>Music Diagnostics</CardTitle>
        </div>
        <CardDescription>Debug panel for audio playback and PocketBase connectivity</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 p-4 bg-card border rounded-lg">
            <h3 className="font-semibold text-sm text-muted-foreground">PocketBase Config</h3>
            <div className="text-sm break-all">
              <span className="font-medium">URL:</span> {pb.baseUrl}
            </div>
            <div className="text-sm">
              <span className="font-medium">Auth Valid:</span> 
              <Badge variant={pb.authStore.isValid ? "default" : "destructive"} className="ml-2">
                {pb.authStore.isValid ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="text-sm">
              <span className="font-medium">User ID:</span> {pb.authStore.model?.id || 'None'}
            </div>
          </div>

          <div className="space-y-2 p-4 bg-card border rounded-lg flex flex-col">
            <h3 className="font-semibold text-sm text-muted-foreground">Diagnostic Logs</h3>
            <ScrollArea className="h-24 w-full rounded-md border bg-muted/30 p-2 text-xs font-mono">
              {logs.map((log, i) => (
                <div key={i} className="mb-1 text-muted-foreground">{log}</div>
              ))}
              {logs.length === 0 && <div className="text-muted-foreground/50 italic">No logs yet...</div>}
            </ScrollArea>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Library Tracks ({tracks.length})</h3>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading tracks...</div>
          ) : tracks.length === 0 ? (
            <div className="text-sm text-muted-foreground">No tracks found in music_library.</div>
          ) : (
            <div className="space-y-3">
              {tracks.map(track => {
                const url = getTrackUrl(track);
                const result = testResults[track.id] || {};
                
                return (
                  <div key={track.id} className="p-4 border rounded-lg bg-card space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium">{track.title}</div>
                        <div className="text-xs text-muted-foreground break-all mt-1 font-mono bg-muted/50 p-1 rounded">
                          {url}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => testHttpStatus(track)}>
                          Test HTTP
                        </Button>
                        <Button size="sm" onClick={() => testPlay(track)} disabled={result.playing}>
                          <Play className="w-4 h-4 mr-1" /> Test Play
                        </Button>
                      </div>
                    </div>
                    
                    {(result.status || result.playError) && (
                      <div className="flex items-center gap-4 text-sm pt-2 border-t">
                        {result.status && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">HTTP:</span>
                            {result.ok ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1"/> {result.status}</Badge>
                            ) : (
                              <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1"/> {result.status}</Badge>
                            )}
                          </div>
                        )}
                        {result.playError && (
                          <div className="flex items-center gap-1 text-destructive">
                            <AlertCircle className="w-4 h-4" />
                            <span>Play Error: {result.playError}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );
}