import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Settings, Download, Volume2, PenTool, BrainCircuit, Search } from 'lucide-react';
import * as StorageService from './services/storageService';
import * as GeminiService from './services/geminiService';
import { Word, ExerciseType, QuizQuestion, ListeningQuestion } from './types';

// --- Components ---

const Navbar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? "text-red-600 font-bold border-b-2 border-red-600" : "text-gray-500 hover:text-red-500 font-medium";
  
  return (
    <nav className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 z-50">
      <div className="container mx-auto max-w-5xl px-4 md:px-8 h-16 flex justify-between items-center">
        <div className="text-xl md:text-2xl text-red-700 font-bold tracking-tight">
          わたしの日本語学習帳
        </div>
        <div className="flex gap-6 md:gap-8 text-sm md:text-base">
          <Link to="/" className={`py-1 transition-all ${isActive('/')}`}>
            HOME
          </Link>
          <Link to="/add" className={`py-1 transition-all ${isActive('/add')}`}>
            ADD
          </Link>
          <Link to="/dictionary" className={`py-1 transition-all ${isActive('/dictionary')}`}>
            DICTIONARY
          </Link>
          <Link to="/exercise" className={`py-1 transition-all ${isActive('/exercise')}`}>
            EXERCISE
          </Link>
        </div>
      </div>
    </nav>
  );
};

const Flashcard = ({ word, onNext }: { word: Word; onNext: () => void }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
  }, [word]);

  return (
    <div className="w-full max-w-sm mx-auto h-80 cursor-pointer perspective-1000 group" onClick={() => setIsFlipped(!isFlipped)}>
      <div className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
        {/* Front */}
        <div className="absolute w-full h-full bg-white border border-gray-200 rounded-xl shadow-sm p-8 flex flex-col items-center justify-center backface-hidden">
          <div className="text-6xl font-bold text-gray-800 mb-4">{word.kanji || word.hiragana}</div>
          <div className="text-xl text-gray-500">{word.original !== word.kanji ? word.original : ''}</div>
          <div className="absolute bottom-6 text-xs text-red-400 font-bold uppercase tracking-widest">Tap to flip</div>
        </div>

        {/* Back */}
        <div className="absolute w-full h-full bg-red-600 text-white rounded-xl shadow-lg p-8 flex flex-col items-center justify-center rotate-y-180 backface-hidden">
          <div className="text-3xl font-bold mb-4 text-center">{word.meaning}</div>
          <div className="text-lg opacity-90 mb-2">{word.hiragana}</div>
          <div className="inline-block px-3 py-1 border border-white/30 rounded-full text-xs mt-4">
            {word.type}
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute bottom-6 px-4 py-2 bg-white text-red-600 rounded-full text-sm font-bold shadow-sm hover:bg-gray-100"
          >
            Next Card
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Pages ---

const HomePage = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loaded = StorageService.getWords();
    // Shuffle for flashcards
    setWords(loaded.sort(() => 0.5 - Math.random()));
  }, []);

  if (words.length === 0) return <div className="p-8 text-center text-gray-500">No words learned yet. Go add some!</div>;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-3">
        <span className="w-1.5 h-6 bg-red-600 block"></span>
        Daily Review
      </h2>
      <Flashcard 
        word={words[currentIndex]} 
        onNext={() => setCurrentIndex((prev) => (prev + 1) % words.length)} 
      />
      <p className="mt-8 text-sm text-gray-400 font-medium">Card {currentIndex + 1} of {words.length}</p>
    </div>
  );
};

const AddWordPage = ({ apiKey }: { apiKey: string }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Partial<Word> | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (!apiKey) {
      alert("Please enter a valid Gemini API Key in Settings (or environment)");
      return;
    }

    setLoading(true);
    try {
      const result = await GeminiService.analyzeWordWithGemini(input, apiKey);
      setAnalysis({ ...result, original: input });
    } catch (err) {
      console.error(err);
      alert("Failed to analyze word. Check API key or connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (analysis) {
      const newWord: Word = {
        id: crypto.randomUUID(),
        dateAdded: Date.now(),
        ...(analysis as any) // Type assertion for brevity in demo
      };
      StorageService.saveWord(newWord);
      alert("Word saved!");
      setInput('');
      setAnalysis(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <span className="w-1.5 h-6 bg-red-600 block"></span>
        New Note
      </h2>
      <form onSubmit={handleAnalyze} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter Japanese Word (e.g. 食べる)"
            className="flex-1 p-4 text-lg border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all bg-white shadow-sm"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-gray-800 text-white px-8 py-4 rounded-lg font-bold hover:bg-black disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? "..." : "Analyze"}
          </button>
        </div>
      </form>

      {analysis && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
          <div className="bg-gray-50 p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-800">{analysis.kanji}</h3>
              <p className="text-red-600 font-medium">{analysis.hiragana}</p>
            </div>
            <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-gray-600 border border-gray-200 uppercase tracking-wide">
              {analysis.type}
            </span>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2 mb-2">
              <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Meaning</label>
              <p className="text-lg text-gray-800 font-medium">{analysis.meaning}</p>
            </div>
            
            {[
              ['Dictionary', analysis.dictionaryForm],
              ['Nai Form', analysis.naiForm],
              ['Ta Form', analysis.taForm],
              ['Nakatta Form', analysis.negativePastForm],
              ['Te Form', analysis.teForm],
              ['Potential', analysis.potentialForm],
              ['Volitional', analysis.volitionalForm],
            ].map(([label, val]) => (
              <div key={label} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <label className="text-xs text-gray-400 uppercase block mb-1 font-bold">{label}</label>
                <span className="font-medium text-gray-700">{val as string}</span>
              </div>
            ))}
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
             <button 
              onClick={() => setAnalysis(null)}
              className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium mr-4"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-sm transition-colors"
            >
              Save to Notebook
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const DictionaryPage = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  useEffect(() => {
    setWords(StorageService.getWords());
  }, []);

  const handleExport = () => {
    const csv = StorageService.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sensei-notes-backup.csv';
    a.click();
  };

  const startEdit = (w: Word) => {
    setEditId(w.id);
    setEditVal(w.meaning);
  };

  const saveEdit = (id: string) => {
    StorageService.updateWordMeaning(id, editVal);
    setWords(words.map(w => w.id === id ? { ...w, meaning: editVal } : w));
    setEditId(null);
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <span className="w-1.5 h-6 bg-red-600 block"></span>
          My Dictionary <span className="text-gray-400 font-normal text-lg">({words.length})</span>
        </h2>
        <button onClick={handleExport} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-gray-200">
          <Download size={16} /> Export CSV
        </button>
      </div>
      
      <div className="flex-1 overflow-auto border border-gray-200 rounded-xl shadow-sm bg-white">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {['Word', 'Reading', 'Meaning', 'Type', '辞書形', 'ない形', 'た形', 'Nakatta', 'て形', '可能形', '意向形'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {words.map((w) => (
              <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-lg font-bold text-gray-900 whitespace-nowrap">{w.kanji || w.original}</td>
                <td className="px-4 py-3 text-sm text-gray-600 font-medium whitespace-nowrap">{w.hiragana}</td>
                <td className="px-4 py-3 text-sm text-gray-700 min-w-[200px]">
                  {editId === w.id ? (
                    <div className="flex items-center gap-2">
                      <input 
                        className="border rounded px-2 py-1 w-full text-sm"
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        autoFocus
                      />
                      <button onClick={() => saveEdit(w.id)} className="text-green-600 text-xs font-bold">Save</button>
                    </div>
                  ) : (
                    <div onClick={() => startEdit(w)} className="cursor-pointer hover:text-red-600 flex items-center gap-1 group">
                      {w.meaning}
                      <PenTool size={10} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap font-medium">{w.type}</td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{w.dictionaryForm}</td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{w.naiForm}</td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{w.taForm}</td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{w.negativePastForm}</td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{w.teForm}</td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{w.potentialForm}</td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{w.volitionalForm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ExercisePage = ({ apiKey }: { apiKey: string }) => {
  const [activeMode, setActiveMode] = useState<ExerciseType>(ExerciseType.NONE);
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState<QuizQuestion | null>(null);
  const [listeningData, setListeningData] = useState<ListeningQuestion | null>(null);
  
  // Writing state
  const [writingPrompt, setWritingPrompt] = useState<{englishSentence: string, targetJapaneseWord: string} | null>(null);
  const [writingInput, setWritingInput] = useState('');
  const [writingFeedback, setWritingFeedback] = useState<any>(null);

  const words = StorageService.getWords();

  const startQuiz = async () => {
    if (words.length < 3) return alert("Need at least 3 words to start!");
    setLoading(true);
    setActiveMode(ExerciseType.QUIZ);
    try {
      const q = await GeminiService.generateQuizQuestion(words, apiKey);
      setQuizData(q);
    } catch (e) { alert("Error generating quiz"); setActiveMode(ExerciseType.NONE); }
    setLoading(false);
  };

  const startListening = async () => {
    if (words.length < 3) return alert("Need at least 3 words!");
    setLoading(true);
    setActiveMode(ExerciseType.LISTENING);
    try {
      const l = await GeminiService.generateListeningTest(words, apiKey);
      setListeningData(l);
    } catch (e) { 
        console.error(e);
        alert("Error generating listening test"); 
        setActiveMode(ExerciseType.NONE); 
    }
    setLoading(false);
  };

  const startWriting = async () => {
     if (words.length < 1) return alert("Need words!");
     setLoading(true);
     setActiveMode(ExerciseType.WRITING);
     setWritingInput('');
     setWritingFeedback(null);
     try {
         const p = await GeminiService.generateWritingPrompt(words, apiKey);
         setWritingPrompt(p);
     } catch (e) { alert("Error"); setActiveMode(ExerciseType.NONE); }
     setLoading(false);
  }

  const submitWriting = async () => {
      if(!writingPrompt) return;
      setLoading(true);
      try {
          const feedback = await GeminiService.checkWriting(writingPrompt.englishSentence, writingInput, apiKey);
          setWritingFeedback(feedback);
      } catch(e) { alert("Error checking"); }
      setLoading(false);
  }

  // --- Render Sub-components for exercises ---

  if (activeMode === ExerciseType.NONE) {
    return (
      <div className="max-w-4xl mx-auto p-8 grid gap-6 grid-cols-1 md:grid-cols-3">
        <div onClick={startQuiz} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md cursor-pointer border border-gray-100 hover:border-red-200 transition-all flex flex-col items-center gap-4 group">
          <div className="bg-red-50 p-4 rounded-full text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
            <BrainCircuit size={32} />
          </div>
          <h3 className="text-xl font-bold">Quiz</h3>
          <p className="text-center text-gray-500 text-sm">Multiple choice questions on meaning and usage.</p>
        </div>

        <div onClick={startListening} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md cursor-pointer border border-gray-100 hover:border-red-200 transition-all flex flex-col items-center gap-4 group">
          <div className="bg-red-50 p-4 rounded-full text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
            <Volume2 size={32} />
          </div>
          <h3 className="text-xl font-bold">Listening</h3>
          <p className="text-center text-gray-500 text-sm">Listen to AI pronunciation and identify the word.</p>
        </div>

        <div onClick={startWriting} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md cursor-pointer border border-gray-100 hover:border-red-200 transition-all flex flex-col items-center gap-4 group">
          <div className="bg-red-50 p-4 rounded-full text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
            <PenTool size={32} />
          </div>
          <h3 className="text-xl font-bold">Writing</h3>
          <p className="text-center text-gray-500 text-sm">Translate sentences and get AI feedback.</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="flex h-[50vh] items-center justify-center"><div className="animate-pulse text-red-600 font-bold text-xl">Thinking...</div></div>;

  // QUIZ VIEW
  if (activeMode === ExerciseType.QUIZ && quizData) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-8 border border-gray-100">
        <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-4">Quiz</h3>
        <p className="text-xl font-bold mb-8 text-gray-800">{quizData.question}</p>
        <div className="grid gap-3">
            {quizData.options.map((opt, i) => (
                <button 
                    key={i}
                    onClick={() => {
                        if (i === quizData.correctAnswerIndex) {
                            alert("Correct!");
                            setActiveMode(ExerciseType.NONE);
                        } else {
                            alert("Incorrect, try again.");
                        }
                    }}
                    className="p-4 text-left border-2 border-gray-100 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all font-medium"
                >
                    {opt}
                </button>
            ))}
        </div>
        <button onClick={() => setActiveMode(ExerciseType.NONE)} className="mt-6 text-gray-400 text-sm underline hover:text-gray-600">Exit</button>
      </div>
    );
  }

  // LISTENING VIEW
  if (activeMode === ExerciseType.LISTENING && listeningData) {
      const playAudio = () => {
        const snd = new Audio("data:audio/wav;base64," + listeningData.audioData);
        snd.play();
      };
      
      return (
        <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-8 border border-gray-100 flex flex-col items-center">
            <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-8">Listening Test</h3>
            <button onClick={playAudio} className="mb-8 w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                <Volume2 size={32} />
            </button>
            <p className="mb-4 text-gray-600 text-sm font-medium">Which word did you hear?</p>
            <div className="grid grid-cols-2 gap-4 w-full">
                {listeningData.options.map((opt, i) => (
                    <button 
                        key={i}
                        onClick={() => {
                             if (i === listeningData.correctAnswerIndex) {
                                alert(`Correct! Sentence: ${listeningData.transcript}`);
                                setActiveMode(ExerciseType.NONE);
                            } else {
                                alert("Incorrect.");
                            }
                        }}
                        className="p-4 bg-gray-50 rounded-lg font-bold text-gray-800 hover:bg-red-100 transition-colors"
                    >
                        {opt}
                    </button>
                ))}
            </div>
            <button onClick={() => setActiveMode(ExerciseType.NONE)} className="mt-6 text-gray-400 text-sm underline hover:text-gray-600">Exit</button>
        </div>
      );
  }

  // WRITING VIEW
  if (activeMode === ExerciseType.WRITING && writingPrompt) {
      return (
          <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-8 border border-gray-100">
             <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-4">Writing Practice</h3>
             <p className="text-gray-500 text-sm mb-2 font-medium">Translate this into Japanese using the word "{writingPrompt.targetJapaneseWord}":</p>
             <p className="text-2xl font-bold text-gray-800 mb-6">{writingPrompt.englishSentence}</p>
             
             {!writingFeedback ? (
                 <>
                    <textarea 
                        className="w-full border-2 border-gray-200 rounded-lg p-4 mb-4 focus:border-red-500 outline-none transition-colors"
                        rows={3}
                        placeholder="Type Japanese here..."
                        value={writingInput}
                        onChange={(e) => setWritingInput(e.target.value)}
                    />
                    <button onClick={submitWriting} className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors">Check</button>
                 </>
             ) : (
                 <div className={`p-6 rounded-lg ${writingFeedback.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                     <h4 className={`font-bold mb-2 ${writingFeedback.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                         {writingFeedback.isCorrect ? 'Correct / Natural' : 'Needs Improvement'}
                     </h4>
                     <p className="mb-4 text-gray-700">{writingFeedback.explanation}</p>
                     <div className="bg-white/50 p-3 rounded">
                         <span className="text-xs uppercase font-bold text-gray-500">Better way to say it:</span>
                         <p className="text-lg font-medium">{writingFeedback.betterAnswer}</p>
                     </div>
                     <button onClick={() => setActiveMode(ExerciseType.NONE)} className="mt-4 px-4 py-2 bg-white rounded shadow text-sm font-bold">Next</button>
                 </div>
             )}
              <button onClick={() => setActiveMode(ExerciseType.NONE)} className="mt-6 text-gray-400 text-sm underline block hover:text-gray-600">Exit</button>
          </div>
      )
  }

  return <div>Unknown State</div>;
};

const SettingsModal = ({ isOpen, onClose, apiKey, setApiKey }: any) => {
    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Settings</h2>
                <label className="block text-sm font-bold mb-2 text-gray-600">Gemini API Key</label>
                <input 
                    type="password" 
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full border p-2 rounded mb-4 focus:border-red-500 focus:outline-none" 
                    placeholder="Enter key..."
                />
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                    Key is stored in browser memory only.
                    <br/>
                    Data is stored in LocalStorage (simulating Google Sheets).
                </p>
                <div className="flex justify-end">
                    <button onClick={onClose} className="bg-gray-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-black transition-colors">Done</button>
                </div>
            </div>
        </div>
    )
}

// --- Main App ---

export default function App() {
  const [apiKey, setApiKey] = useState(process.env.API_KEY || '');
  const [showSettings, setShowSettings] = useState(false);

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#f5f5f4] text-gray-800 font-sans">
        <Navbar />
        
        {/* Settings Button */}
        <button 
            onClick={() => setShowSettings(true)}
            className="fixed bottom-6 right-6 z-[60] p-3 bg-white rounded-full shadow-lg text-gray-400 hover:text-red-600 transition-all hover:scale-110 border border-gray-100"
        >
            <Settings size={24} />
        </button>

        <SettingsModal 
            isOpen={showSettings} 
            onClose={() => setShowSettings(false)}
            apiKey={apiKey}
            setApiKey={setApiKey}
        />

        <main className="container mx-auto max-w-5xl pt-8 pb-20">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/add" element={<AddWordPage apiKey={apiKey} />} />
            <Route path="/dictionary" element={<DictionaryPage />} />
            <Route path="/exercise" element={<ExercisePage apiKey={apiKey} />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}