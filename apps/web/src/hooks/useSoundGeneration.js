import { useState } from 'react';
import apiServerClient from '@/lib/apiServerClient';

export const useSoundGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const generateSound = async (keyword, language) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      console.log(`Requesting sound for: ${keyword} in ${language}`);
      const response = await apiServerClient.fetch('/sound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, language })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate sound');
      }

      const data = await response.json();
      console.log(`Sound generated successfully for: ${keyword}`);
      return data.soundUrl;
    } catch (err) {
      console.error('Error generating sound:', err);
      setError(err.message || 'Failed to load sound');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateSound, isGenerating, error };
};