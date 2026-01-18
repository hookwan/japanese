export interface Word {
  id: string;
  original: string;
  hiragana: string;
  kanji: string;
  meaning: string;
  type: string; // e.g., Godan verb, Ichidan verb, I-adjective
  dictionaryForm: string;
  naiForm: string;
  taForm: string;
  negativePastForm: string; // Nakatta
  teForm: string;
  potentialForm: string;
  volitionalForm: string;
  dateAdded: number;
}

export enum ExerciseType {
  NONE = 'NONE',
  QUIZ = 'QUIZ',
  WRITING = 'WRITING',
  LISTENING = 'LISTENING'
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface ListeningQuestion {
  audioData: string; // base64
  options: string[];
  correctAnswerIndex: number;
  transcript: string; // For review after answering
}
