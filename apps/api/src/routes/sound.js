import express from 'express';
import { GoogleGenAI } from '@google/genai';
import logger from '../utils/logger.js';

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/sound', async (req, res) => {
  const { keyword, language } = req.body;

  if (!keyword) {
    return res.status(400).json({ error: 'Missing required field: keyword' });
  }

  logger.info(`Generating sound for keyword: ${keyword} in language: ${language || 'unknown'}`);

  const prompt = `Generate a short, high-quality sound effect for the word "${keyword}". The sound should be suitable for a children's story. Duration: 3-5 seconds.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseModalities: ['AUDIO'],
    },
  });

  if (!response.candidates || !response.candidates[0]) {
    throw new Error('No response from Gemini audio generation');
  }

  const candidate = response.candidates[0];
  if (!candidate.content || !candidate.content.parts) {
    throw new Error('Invalid response structure from Gemini');
  }

  let audioData = null;
  let mimeType = 'audio/wav';

  for (const part of candidate.content.parts) {
    if (part.inlineData) {
      audioData = part.inlineData.data;
      mimeType = part.inlineData.mimeType || 'audio/wav';
      break;
    }
  }

  if (!audioData) {
    throw new Error('No audio data in Gemini response');
  }

  const soundUrl = `data:${mimeType};base64,${audioData}`;

  logger.info(`Sound generated successfully for: ${keyword}`);

  res.json({
    soundUrl,
    keyword,
    mimeType,
  });
});

export default router;