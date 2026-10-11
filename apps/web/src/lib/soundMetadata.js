/**
 * Extracts sound keywords from story text based on a provided mapping.
 * @param {string} storyText - The full text of the story.
 * @param {Object} soundTriggersMap - A dictionary mapping words to sound types.
 * @returns {Array} Array of metadata objects {keyword, soundType, startIndex, endIndex}.
 */
export const extractSoundKeywords = (storyText, soundTriggersMap) => {
  if (!storyText || typeof storyText !== 'string') return [];
  const keywords = Object.keys(soundTriggersMap);
  if (keywords.length === 0) return [];

  // Sort by length descending to match longer phrases first (e.g., 'thunderstorm' before 'thunder')
  const sortedKeywords = keywords.sort((a, b) => b.length - a.length);
  const escapedKeywords = sortedKeywords.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`\\b(${escapedKeywords.join('|')})\\b`, 'gi');

  const metadata = [];
  let match;
  while ((match = regex.exec(storyText)) !== null) {
    metadata.push({
      keyword: match[0],
      soundType: soundTriggersMap[match[0].toLowerCase()],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }
  return metadata;
};

/**
 * Parses a JSON string of sound metadata back into an array.
 * @param {string} metadataString - The JSON string from the database.
 * @returns {Array} Parsed metadata array.
 */
export const parseSoundMetadata = (metadataString) => {
  if (!metadataString) return [];
  try {
    const parsed = JSON.parse(metadataString);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to parse sound metadata", e);
    return [];
  }
};

/**
 * Reconstructs the story text into an array of text segments and keyword objects.
 * @param {string} storyText - The full text of the story.
 * @param {Array} soundMetadata - The parsed metadata array.
 * @returns {Array} Array of strings and keyword objects.
 */
export const reconstructStoryWithMetadata = (storyText, soundMetadata) => {
  if (!storyText) return [];
  if (!soundMetadata || soundMetadata.length === 0) return [storyText];

  const result = [];
  let currentIndex = 0;

  // Ensure metadata is sorted by startIndex to process sequentially
  const sortedMeta = [...soundMetadata].sort((a, b) => a.startIndex - b.startIndex);

  sortedMeta.forEach(meta => {
    if (meta.startIndex > currentIndex) {
      result.push(storyText.substring(currentIndex, meta.startIndex));
    }
    // Only add if it's a valid forward progression (prevents overlapping matches)
    if (meta.startIndex >= currentIndex) {
      result.push({ ...meta, isKeyword: true });
      currentIndex = meta.endIndex;
    }
  });

  if (currentIndex < storyText.length) {
    result.push(storyText.substring(currentIndex));
  }

  return result;
};