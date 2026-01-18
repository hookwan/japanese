import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GEMINI_MODEL_TEXT, GEMINI_MODEL_TTS } from "../constants";
import { Word, QuizQuestion, ListeningQuestion } from "../types";

// Helper to get client. Note: In a real app, handle API key securely. 
// Here we assume it's in env or user provides it via a context (handled in App.tsx)
const getAiClient = (apiKey: string) => new GoogleGenAI({ apiKey });

export const analyzeWordWithGemini = async (inputWord: string, apiKey: string): Promise<Partial<Word>> => {
  if (!apiKey) throw new Error("API Key is missing");
  const ai = getAiClient(apiKey);
  
  const prompt = `
    Analyze this Japanese word: "${inputWord}".
    Return a JSON object with the following fields:
    - hiragana
    - kanji (if the input is hiragana, provide the most common kanji. if input is kanji, use that)
    - meaning (English definition)
    - type (e.g. Godan verb, Ichidan verb, Suru verb, I-adjective, Na-adjective, Noun, etc.)
    - dictionaryForm (辞書形)
    - naiForm (ない形)
    - taForm (た形)
    - negativePastForm (did not... / nakatta form)
    - teForm (て形)
    - potentialForm (可能形 - if not applicable put "N/A")
    - volitionalForm (意向形 - if not applicable put "N/A")
  `;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_TEXT,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hiragana: { type: Type.STRING },
          kanji: { type: Type.STRING },
          meaning: { type: Type.STRING },
          type: { type: Type.STRING },
          dictionaryForm: { type: Type.STRING },
          naiForm: { type: Type.STRING },
          taForm: { type: Type.STRING },
          negativePastForm: { type: Type.STRING },
          teForm: { type: Type.STRING },
          potentialForm: { type: Type.STRING },
          volitionalForm: { type: Type.STRING },
        }
      }
    }
  });

  if (!response.text) throw new Error("Failed to generate analysis");
  
  return JSON.parse(response.text);
};

export const generateQuizQuestion = async (words: Word[], apiKey: string): Promise<QuizQuestion> => {
  if (!apiKey) throw new Error("API Key is missing");
  const ai = getAiClient(apiKey);
  
  // Pick a random word to test
  const targetWord = words[Math.floor(Math.random() * words.length)];
  
  const prompt = `Create a 4-choice multiple choice question to test the meaning or usage of the Japanese word "${targetWord.original}" (${targetWord.meaning}).
  The question should ask for the correct meaning, or correct reading, or correct usage in a sentence.
  Return JSON.
  `;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_TEXT,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctAnswerIndex: { type: Type.INTEGER },
          explanation: { type: Type.STRING },
        }
      }
    }
  });

   if (!response.text) throw new Error("Failed to generate quiz");
   return JSON.parse(response.text);
};

export const generateListeningTest = async (words: Word[], apiKey: string): Promise<ListeningQuestion> => {
    if (!apiKey) throw new Error("API Key is missing");
    const ai = getAiClient(apiKey);
    
    // 1. Generate a sentence using a target word
    const targetWord = words[Math.floor(Math.random() * words.length)];
    
    const textPrompt = `Create a simple Japanese sentence using the word "${targetWord.original}". 
    Also provide 3 distractor words that are similar or related, and the target word itself as options for a question "Which word was used?".
    Return JSON with 'sentence', 'options' (array of 4 strings, one is the target word), 'correctIndex'.`;
    
    const textResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: textPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    sentence: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctIndex: { type: Type.INTEGER }
                }
            }
        }
    });

    if(!textResponse.text) throw new Error("Failed to generate text for listening");
    const textData = JSON.parse(textResponse.text);

    // 2. Convert sentence to Speech
    const speechResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_TTS,
        contents: { parts: [{ text: textData.sentence }] },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        }
    });

    const audioData = speechResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!audioData) throw new Error("Failed to generate audio");

    return {
        audioData,
        options: textData.options,
        correctAnswerIndex: textData.correctIndex,
        transcript: textData.sentence
    };
}

export const checkWriting = async (promptText: string, userAnswer: string, apiKey: string) => {
    if (!apiKey) throw new Error("API Key is missing");
    const ai = getAiClient(apiKey);

    const prompt = `
    Task: Translate/Write Japanese.
    Prompt: "${promptText}"
    User Answer: "${userAnswer}"
    
    Evaluate the user's Japanese answer. 
    1. Is it correct? (true/false)
    2. Provide a better or more natural way to say it if applicable.
    3. Explanation of the correction.
    
    Return JSON.
    `;

    const response = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    isCorrect: { type: Type.BOOLEAN },
                    betterAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                }
            }
        }
    });

    if (!response.text) throw new Error("Failed to grading");
    return JSON.parse(response.text);
}

export const generateWritingPrompt = async (words: Word[], apiKey: string) => {
    if (!apiKey) throw new Error("API Key is missing");
    const ai = getAiClient(apiKey);
    const targetWord = words[Math.floor(Math.random() * words.length)];

    const prompt = `Create a sentence in English that would naturally use the Japanese word "${targetWord.meaning}" (${targetWord.original}).
    Return JSON with 'englishSentence' and 'targetJapaneseWord'.
    `;

    const response = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    englishSentence: { type: Type.STRING },
                    targetJapaneseWord: { type: Type.STRING }
                }
            }
        }
    });

    if (!response.text) throw new Error("Failed to generate prompt");
    return JSON.parse(response.text);
}
