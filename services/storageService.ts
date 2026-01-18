import { Word } from '../types';
import { INITIAL_WORDS } from '../constants';

const STORAGE_KEY = 'sensei_notes_words';

export const getWords = (): Word[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_WORDS));
    return INITIAL_WORDS;
  }
  return JSON.parse(stored);
};

export const saveWord = (word: Word): void => {
  const words = getWords();
  const existingIndex = words.findIndex(w => w.original === word.original);
  
  if (existingIndex >= 0) {
    words[existingIndex] = word;
  } else {
    words.unshift(word); // Add to top
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
};

export const updateWordMeaning = (id: string, newMeaning: string): void => {
  const words = getWords();
  const word = words.find(w => w.id === id);
  if (word) {
    word.meaning = newMeaning;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  }
};

export const deleteWord = (id: string): void => {
  const words = getWords().filter(w => w.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
};

export const exportToCSV = (): string => {
  const words = getWords();
  if (words.length === 0) return '';

  const headers = [
    'Original', 'Hiragana', 'Kanji', 'Meaning', 'Type', 
    'Dictionary Form', 'Nai Form', 'Ta Form', 'Neg. Past Form', 
    'Te Form', 'Potential Form', 'Volitional Form'
  ];

  const rows = words.map(w => [
    w.original, w.hiragana, w.kanji, w.meaning, w.type,
    w.dictionaryForm, w.naiForm, w.taForm, w.negativePastForm,
    w.teForm, w.potentialForm, w.volitionalForm
  ].map(field => `"${field}"`).join(','));

  return [headers.join(','), ...rows].join('\n');
};
