import express from 'express';
import OpenAI from 'openai';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

function getStoryGuidelines(childAge) {
  if (childAge >= 2 && childAge <= 4) {
    return {
      wordCount: '100-150 words',
      vocabulary: 'very simple, short sentences',
      style: 'repetitive elements, rhyming patterns, simple actions',
    };
  } else if (childAge >= 5 && childAge <= 7) {
    return {
      wordCount: '200-300 words',
      vocabulary: 'simple but engaging',
      style: 'engaging plot with clear beginning, middle, and end, clear moral lesson',
    };
  } else if (childAge >= 8 && childAge <= 10) {
    return {
      wordCount: '400-500 words',
      vocabulary: 'age-appropriate with some descriptive language',
      style: 'complex narrative with character development, deeper lesson about the value',
    };
  } else {
    return {
      wordCount: '600+ words',
      vocabulary: 'sophisticated and descriptive',
      style: 'sophisticated plot with multiple characters, meaningful value lesson, emotional depth',
    };
  }
}

async function translateLocation(openai, location, targetLanguage) {
  logger.info('[translateLocation] Starting translation', {
    location,
    targetLanguage,
  });

  const translationMessage = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a translator. Translate the given location to the specified language. Respond with ONLY the translated location name, nothing else. No explanations, no quotes, just the translated word or phrase.`,
      },
      {
        role: 'user',
        content: `Translate "${location}" to ${targetLanguage}. Respond with only the translated location.`,
      },
    ],
  });

  const translatedLocation = translationMessage.choices[0].message.content.trim();
  logger.info('[translateLocation] Translation completed', {
    originalLocation: location,
    translatedLocation,
    targetLanguage,
  });

  return translatedLocation;
}

function parseStoryResponse(responseText) {
  logger.info('[parseStoryResponse] Starting response parsing', {
    responseLength: responseText ? responseText.length : 0,
    responseType: typeof responseText,
  });

  // Validate response text exists
  if (!responseText || typeof responseText !== 'string') {
    logger.error('[parseStoryResponse] Response text is not a valid string', {
      responseText,
      type: typeof responseText,
    });
    throw new Error(`Invalid response from OpenAI: expected string, got ${typeof responseText}`);
  }

  // Step 1: Trim whitespace
  let cleanedResponse = responseText.trim();
  logger.debug('[parseStoryResponse] After trim', {
    length: cleanedResponse.length,
    preview: cleanedResponse.substring(0, 100),
  });

  if (cleanedResponse === '') {
    logger.error('[parseStoryResponse] Response text is empty after trimming');
    throw new Error('OpenAI returned an empty response');
  }

  // Step 2: Handle markdown code blocks (```json ... ``` or ``` ... ```)
  if (cleanedResponse.startsWith('```')) {
    logger.info('[parseStoryResponse] Detected markdown code block, extracting JSON');
    
    // Remove opening backticks (```json or ```)
    let jsonContent = cleanedResponse.replace(/^```(?:json)?\s*/, '');
    
    // Remove closing backticks
    jsonContent = jsonContent.replace(/\s*```$/, '');
    
    cleanedResponse = jsonContent.trim();
    
    logger.debug('[parseStoryResponse] After markdown extraction', {
      length: cleanedResponse.length,
      preview: cleanedResponse.substring(0, 100),
    });
  }

  // Step 3: Validate JSON structure before parsing
  if (!cleanedResponse.startsWith('{')) {
    logger.error('[parseStoryResponse] Response does not start with { - likely not JSON', {
      firstChar: cleanedResponse.charAt(0),
      firstTenChars: cleanedResponse.substring(0, 10),
      preview: cleanedResponse.substring(0, 100),
      fullResponse: cleanedResponse,
    });
    throw new Error(`OpenAI response is not valid JSON. Response starts with: "${cleanedResponse.substring(0, 50)}..."`);
  }

  // Step 4: Attempt to parse JSON with detailed error logging
  let storyData;
  try {
    storyData = JSON.parse(cleanedResponse);
    logger.info('[parseStoryResponse] Successfully parsed JSON response', {
      hasTitle: !!storyData.title,
      hasStory: !!storyData.story,
      titleLength: storyData.title ? storyData.title.length : 0,
      storyLength: storyData.story ? storyData.story.length : 0,
      allKeys: Object.keys(storyData),
    });
  } catch (err) {
    logger.error('[parseStoryResponse] JSON parsing failed', {
      errorMessage: err.message,
      errorName: err.name,
      errorPosition: err.message.match(/position (\d+)/) ? err.message.match(/position (\d+)/)[1] : 'unknown',
      responseLength: cleanedResponse.length,
      responsePreview: cleanedResponse.substring(0, 300),
      fullResponse: cleanedResponse,
    });
    throw new Error(`Failed to parse OpenAI response as JSON: ${err.message}. Raw response: ${cleanedResponse.substring(0, 200)}...`);
  }

  // Step 5: Validate response structure
  logger.info('[parseStoryResponse] Validating response structure');

  if (!storyData || typeof storyData !== 'object') {
    logger.error('[parseStoryResponse] Parsed data is not an object', {
      type: typeof storyData,
      value: storyData,
    });
    throw new Error(`Invalid response structure: expected object, got ${typeof storyData}`);
  }

  // Check for required fields
  const hasTitle = 'title' in storyData && storyData.title !== null && storyData.title !== undefined;
  const hasStory = 'story' in storyData && storyData.story !== null && storyData.story !== undefined;

  logger.info('[parseStoryResponse] Response field validation', {
    hasTitle,
    hasStory,
    titleType: typeof storyData.title,
    storyType: typeof storyData.story,
    allKeys: Object.keys(storyData),
  });

  if (!hasTitle) {
    logger.error('[parseStoryResponse] Missing or invalid title field', {
      title: storyData.title,
      titleType: typeof storyData.title,
      allKeys: Object.keys(storyData),
    });
    throw new Error('OpenAI response missing required field: title');
  }

  if (!hasStory) {
    logger.error('[parseStoryResponse] Missing or invalid story field', {
      story: storyData.story,
      storyType: typeof storyData.story,
      allKeys: Object.keys(storyData),
    });
    throw new Error('OpenAI response missing required field: story');
  }

  // Validate that title and story are strings
  if (typeof storyData.title !== 'string' || storyData.title.trim() === '') {
    logger.error('[parseStoryResponse] Title is not a valid non-empty string', {
      title: storyData.title,
      type: typeof storyData.title,
      isEmpty: storyData.title.trim() === '',
    });
    throw new Error('OpenAI response: title must be a non-empty string');
  }

  if (typeof storyData.story !== 'string' || storyData.story.trim() === '') {
    logger.error('[parseStoryResponse] Story is not a valid non-empty string', {
      storyLength: storyData.story ? storyData.story.length : 0,
      type: typeof storyData.story,
      isEmpty: storyData.story.trim() === '',
    });
    throw new Error('OpenAI response: story must be a non-empty string');
  }

  logger.info('[parseStoryResponse] Response validation successful', {
    titleLength: storyData.title.length,
    storyLength: storyData.story.length,
  });

  return storyData;
}

router.post('/', async (req, res) => {
  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
    throw new Error('The story generation service is not yet configured. Please contact support.');
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const { childAge, location, mainCharacter, valueLesson, childName, language = 'Español' } = req.body;

  // ===== DETAILED LOGGING AT START OF ENDPOINT =====
  logger.info('[POST /story] Endpoint called');
  logger.info('[POST /story] req.body.language (exact value from frontend):', { language, type: typeof language });
  logger.info('[POST /story] All request parameters:', {
    childAge,
    location,
    mainCharacter,
    valueLesson,
    childName,
    language,
  });

  if (!childAge || !location || !mainCharacter || !valueLesson || !childName) {
    logger.warn('[POST /story] Missing required fields', {
      hasChildAge: !!childAge,
      hasLocation: !!location,
      hasMainCharacter: !!mainCharacter,
      hasValueLesson: !!valueLesson,
      hasChildName: !!childName,
    });
    return res.status(400).json({
      error: 'Missing required fields: childAge, location, mainCharacter, valueLesson, childName',
    });
  }

  // Validate language parameter
  if (!language || typeof language !== 'string' || language.trim() === '') {
    logger.warn('[POST /story] Invalid language parameter', { language, type: typeof language });
    return res.status(400).json({
      error: 'Invalid language parameter. Must be a non-empty string.',
    });
  }

  // ===== TRANSLATE LOCATION TO TARGET LANGUAGE =====
  logger.info('[POST /story] Starting location translation step');
  const translatedLocation = await translateLocation(openai, location, language);
  logger.info('[POST /story] Location translation completed', {
    originalLocation: location,
    translatedLocation,
  });

  const guidelines = getStoryGuidelines(childAge);

  // ===== BUILD SYSTEM PROMPT WITH STRICT LANGUAGE ENFORCEMENT =====
  const systemPrompt = `You are a creative children's story writer. Always respond with valid JSON only.

LANGUAGE ENFORCEMENT (CRITICAL - MUST FOLLOW EXACTLY):
- You MUST generate the story title ONLY in ${language}.
- You MUST generate the entire story ONLY in ${language}.
- Do NOT mix languages.
- Do NOT use French, Spanish, or English unless ${language} is the selected language.
- Generate ONLY in the specified language - no translations, no code-switching, no language mixing whatsoever.
- The story title must be a single phrase or sentence ONLY in ${language}. Every single word must be in ${language}.
- If you do not know how to write in ${language}, ask for clarification rather than mixing languages.

RESPONSE FORMAT:
Always respond with valid JSON in this exact format:
{"title": "Story Title Here", "story": "The full story text here..."}

No markdown, no code blocks, no explanations - ONLY the JSON object.`;

  logger.info('[POST /story] System prompt being sent to OpenAI:', { systemPrompt });

  const userPrompt = `Create a personalized children's story with the following details:

Language: ${language} (CRITICAL: The entire story and title MUST be written in ${language})
Child's Name: ${childName}
Child's Age: ${childAge} years old
Story Location: ${translatedLocation}
Main Character: ${mainCharacter}
Value Lesson: ${valueLesson}

Story Guidelines:
- Word Count: ${guidelines.wordCount}
- Vocabulary Level: ${guidelines.vocabulary}
- Style: ${guidelines.style}
- Sound Keywords: Include at least 4 sound-triggering keywords naturally woven into the story. Choose from: bird/pájaro, dog/perro, cat/gato, horse/caballo, rain/lluvia, thunder/trueno, wind/viento, water/agua, bell/campana, door/puerta, footsteps/pasos, fire/fuego, etc. These words should fit naturally into the narrative so that readers can click sound buttons to hear the corresponding sounds.

Create an engaging, age-appropriate story that teaches the value of "${valueLesson}" through the adventures of ${mainCharacter} in ${translatedLocation}. Make sure to include ${childName} in the story in a meaningful way.

Respond with ONLY a JSON object in this exact format (no markdown, no code blocks):
{"title": "Story Title Here", "story": "The full story text here..."}`;

  logger.info('[POST /story] User prompt being sent to OpenAI:', { userPrompt });
  logger.info(`[POST /story] Generating story for ${childName}, age ${childAge}, language ${language}, location ${translatedLocation}`);

  // ===== CALL OPENAI API =====
  const message = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  // ===== LOG COMPLETE OPENAI RESPONSE =====
  logger.info('[POST /story] Complete OpenAI API response received:', {
    model: message.model,
    usage: message.usage,
    finishReason: message.choices[0].finish_reason,
    choicesLength: message.choices.length,
  });

  // ===== EXTRACT RAW RESPONSE TEXT =====
  if (!message.choices || !message.choices[0]) {
    logger.error('[POST /story] Invalid OpenAI response structure - no choices array', {
      messageKeys: Object.keys(message),
      choicesExists: !!message.choices,
    });
    throw new Error('Invalid response structure from OpenAI API: missing choices array');
  }

  if (!message.choices[0].message) {
    logger.error('[POST /story] Invalid OpenAI response structure - no message in choice', {
      choiceKeys: Object.keys(message.choices[0]),
      messageExists: !!message.choices[0].message,
    });
    throw new Error('Invalid response structure from OpenAI API: missing message in choice');
  }

  const responseText = message.choices[0].message.content;

  // ===== DETAILED LOGGING OF RAW RESPONSE BEFORE PARSING =====
  logger.info('[POST /story] Raw AI response text (before parsing):', {
    responseLength: responseText ? responseText.length : 0,
    responseType: typeof responseText,
    responsePreview: responseText ? responseText.substring(0, 200) : 'null/undefined',
    fullResponse: responseText,
  });

  // ===== PARSE RESPONSE USING DEDICATED FUNCTION =====
  const storyData = parseStoryResponse(responseText);

  logger.info(`[POST /story] Story generated successfully for ${childName} in language ${language}`, {
    title: storyData.title,
    storyLength: storyData.story.length,
    childName,
    language,
  });

  res.json({
    title: storyData.title,
    story: storyData.story,
  });
});

router.post('/generate-story', async (req, res) => {
  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
    throw new Error('The story generation service is not yet configured. Please contact support.');
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const { childAge, location, mainCharacter, valueLesson, childName, language = 'Español' } = req.body;

  // ===== DETAILED LOGGING AT START OF ENDPOINT =====
  logger.info('[POST /generate-story] Endpoint called');
  logger.info('[POST /generate-story] req.body.language (exact value from frontend):', { language, type: typeof language });
  logger.info('[POST /generate-story] All request parameters:', {
    childAge,
    location,
    mainCharacter,
    valueLesson,
    childName,
    language,
  });

  if (!childAge || !location || !mainCharacter || !valueLesson || !childName) {
    logger.warn('[POST /generate-story] Missing required fields', {
      hasChildAge: !!childAge,
      hasLocation: !!location,
      hasMainCharacter: !!mainCharacter,
      hasValueLesson: !!valueLesson,
      hasChildName: !!childName,
    });
    return res.status(400).json({
      error: 'Missing required fields: childAge, location, mainCharacter, valueLesson, childName',
    });
  }

  // Validate language parameter
  if (!language || typeof language !== 'string' || language.trim() === '') {
    logger.warn('[POST /generate-story] Invalid language parameter', { language, type: typeof language });
    return res.status(400).json({
      error: 'Invalid language parameter. Must be a non-empty string.',
    });
  }

  // ===== TRANSLATE LOCATION TO TARGET LANGUAGE =====
  logger.info('[POST /generate-story] Starting location translation step');
  const translatedLocation = await translateLocation(openai, location, language);
  logger.info('[POST /generate-story] Location translation completed', {
    originalLocation: location,
    translatedLocation,
  });

  const guidelines = getStoryGuidelines(childAge);

  // ===== BUILD SYSTEM PROMPT WITH STRICT LANGUAGE ENFORCEMENT =====
  const systemPrompt = `You are a creative children's story writer. Always respond with valid JSON only.

LANGUAGE ENFORCEMENT (CRITICAL - MUST FOLLOW EXACTLY):
- You MUST generate the story title ONLY in ${language}.
- You MUST generate the entire story ONLY in ${language}.
- Do NOT mix languages.
- Do NOT use French, Spanish, or English unless ${language} is the selected language.
- Generate ONLY in the specified language - no translations, no code-switching, no language mixing whatsoever.
- The story title must be a single phrase or sentence ONLY in ${language}. Every single word must be in ${language}.
- If you do not know how to write in ${language}, ask for clarification rather than mixing languages.

RESPONSE FORMAT:
Always respond with valid JSON in this exact format:
{"title": "Story Title Here", "story": "The full story text here..."}

No markdown, no code blocks, no explanations - ONLY the JSON object.`;

  logger.info('[POST /generate-story] System prompt being sent to OpenAI:', { systemPrompt });

  const userPrompt = `Create a personalized children's story with the following details:

Language: ${language} (CRITICAL: The entire story and title MUST be written in ${language})
Child's Name: ${childName}
Child's Age: ${childAge} years old
Story Location: ${translatedLocation}
Main Character: ${mainCharacter}
Value Lesson: ${valueLesson}

Story Guidelines:
- Word Count: ${guidelines.wordCount}
- Vocabulary Level: ${guidelines.vocabulary}
- Style: ${guidelines.style}
- Sound Keywords: Include at least 4 sound-triggering keywords naturally woven into the story. Choose from: bird/pájaro, dog/perro, cat/gato, horse/caballo, rain/lluvia, thunder/trueno, wind/viento, water/agua, bell/campana, door/puerta, footsteps/pasos, fire/fuego, etc. These words should fit naturally into the narrative so that readers can click sound buttons to hear the corresponding sounds.

Create an engaging, age-appropriate story that teaches the value of "${valueLesson}" through the adventures of ${mainCharacter} in ${translatedLocation}. Make sure to include ${childName} in the story in a meaningful way.

Respond with ONLY a JSON object in this exact format (no markdown, no code blocks):
{"title": "Story Title Here", "story": "The full story text here..."}`;

  logger.info('[POST /generate-story] User prompt being sent to OpenAI:', { userPrompt });
  logger.info(`[POST /generate-story] Generating story for ${childName}, age ${childAge}, language ${language}, location ${translatedLocation}`);

  // ===== CALL OPENAI API =====
  const message = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  // ===== LOG COMPLETE OPENAI RESPONSE =====
  logger.info('[POST /generate-story] Complete OpenAI API response received:', {
    model: message.model,
    usage: message.usage,
    finishReason: message.choices[0].finish_reason,
    choicesLength: message.choices.length,
  });

  // ===== EXTRACT RAW RESPONSE TEXT =====
  if (!message.choices || !message.choices[0]) {
    logger.error('[POST /generate-story] Invalid OpenAI response structure - no choices array', {
      messageKeys: Object.keys(message),
      choicesExists: !!message.choices,
    });
    throw new Error('Invalid response structure from OpenAI API: missing choices array');
  }

  if (!message.choices[0].message) {
    logger.error('[POST /generate-story] Invalid OpenAI response structure - no message in choice', {
      choiceKeys: Object.keys(message.choices[0]),
      messageExists: !!message.choices[0].message,
    });
    throw new Error('Invalid response structure from OpenAI API: missing message in choice');
  }

  const responseText = message.choices[0].message.content;

  // ===== DETAILED LOGGING OF RAW RESPONSE BEFORE PARSING =====
  logger.info('[POST /generate-story] Raw AI response text (before parsing):', {
    responseLength: responseText ? responseText.length : 0,
    responseType: typeof responseText,
    responsePreview: responseText ? responseText.substring(0, 200) : 'null/undefined',
    fullResponse: responseText,
  });

  // ===== PARSE RESPONSE USING DEDICATED FUNCTION =====
  const storyData = parseStoryResponse(responseText);

  logger.info(`[POST /generate-story] Story generated successfully for ${childName} in language ${language}`, {
    title: storyData.title,
    storyLength: storyData.story.length,
    childName,
    language,
  });

  res.json({
    title: storyData.title,
    story: storyData.story,
  });
});

export default router;