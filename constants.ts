export const GEMINI_MODEL_TEXT = 'gemini-3-flash-preview';
export const GEMINI_MODEL_TTS = 'gemini-2.5-flash-preview-tts';

// Initial dummy data to populate the app if empty
export const INITIAL_WORDS = [
  {
    id: 'sample-1',
    original: '食べる',
    hiragana: 'たべる',
    kanji: '食べる',
    meaning: 'To eat',
    type: 'Ichidan Verb',
    dictionaryForm: '食べる',
    naiForm: '食べない',
    taForm: '食べた',
    negativePastForm: '食べなかった',
    teForm: '食べて',
    potentialForm: '食べられる',
    volitionalForm: '食べよう',
    dateAdded: Date.now()
  }
];
