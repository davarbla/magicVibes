/**
 * BACKGROUND MUSIC CONFIGURATION
 * 
 * Updated to include multiple format sources (OGG and MP3 fallbacks)
 * to ensure broad browser compatibility.
 */

export const musicTracks = [
  { 
    id: 'none', 
    name: 'No Music', 
    sources: [],
    duration: 0
  },
  { 
    id: 'ambient-piano', 
    name: 'Ambient Piano', 
    sources: [
      { url: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Moonlight_Sonata_Op._27_No._2_-_I._Adagio_sostenuto.ogg', format: 'audio/ogg' },
      { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', format: 'audio/mpeg' }
    ],
    duration: 360
  },
  { 
    id: 'soft-strings', 
    name: 'Soft Strings', 
    sources: [
      { url: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Vivaldi_-_Spring_mvt_1_Allegro_-_John_Harrison_violin.ogg', format: 'audio/ogg' },
      { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', format: 'audio/mpeg' }
    ],
    duration: 210
  },
  { 
    id: 'nature-sounds', 
    name: 'Nature Sounds', 
    sources: [
      { url: 'https://upload.wikimedia.org/wikipedia/commons/7/74/River_stream_in_the_forest.ogg', format: 'audio/ogg' },
      { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', format: 'audio/mpeg' }
    ],
    duration: 120
  },
  { 
    id: 'lofi-hiphop', 
    name: 'Lo-fi Hip Hop', 
    sources: [
      { url: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Kevin_MacLeod_-_Local_Forecast_-_Slower.ogg', format: 'audio/ogg' },
      { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', format: 'audio/mpeg' }
    ],
    duration: 180
  },
  { 
    id: 'peaceful-meditation', 
    name: 'Peaceful Meditation', 
    sources: [
      { url: 'https://upload.wikimedia.org/wikipedia/commons/9/99/Gymnop%C3%A9die_No._1.ogg', format: 'audio/ogg' },
      { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', format: 'audio/mpeg' }
    ],
    duration: 190
  },
  { 
    id: 'gentle-rain', 
    name: 'Gentle Rain', 
    sources: [
      { url: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Rain_sounds_on_a_tin_roof.ogg', format: 'audio/ogg' },
      { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', format: 'audio/mpeg' }
    ],
    duration: 150
  }
];