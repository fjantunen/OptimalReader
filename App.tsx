import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Theme, ReaderFont, ReaderSettings } from './types';
import { PRELOAD_CONTENT } from './constants';
import Reader from './components/Reader';
import SettingsPanel from './components/SettingsPanel';
import InputArea from './components/InputArea';
import { Settings, Play, Pause, Edit2, Plus, Minus, SkipBack, SkipForward } from 'lucide-react';

const App: React.FC = () => {
  const [content, setContent] = useState(PRELOAD_CONTENT);
  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  
  const [settings, setSettings] = useState<ReaderSettings>({
    theme: Theme.Amber,
    font: ReaderFont.Clean,
    fontSize: 22,
    lineHeight: 1.6,
    ttsSpeed: 1.0,
  });

  const sentencesRef = useRef<string[]>([]);
  const blockStartIndicesRef = useRef<number[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  const stopPlayback = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentWordIndex(-1);
  }, []);

  const startPlayback = useCallback((startIndex: number) => {
    if (!synthRef.current || sentencesRef.current.length === 0) return;
    
    synthRef.current.cancel();
    isPlayingRef.current = true;
    setIsPlaying(true);

    const speak = (sIdx: number) => {
      if (!isPlayingRef.current) return;
      if (sIdx >= sentencesRef.current.length) {
        stopPlayback();
        return;
      }

      const sentence = sentencesRef.current[sIdx];
      setCurrentSentenceIndex(sIdx);
      setCurrentWordIndex(0);

      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.rate = settings.ttsSpeed;

      utterance.onboundary = (event) => {
        if (event.name === 'word' && isPlayingRef.current) {
          const textBefore = sentence.substring(0, event.charIndex);
          const wordCount = textBefore.trim().split(/\s+/).filter(w => w.length > 0).length;
          setCurrentWordIndex(wordCount);
        }
      };

      utterance.onend = () => {
        if (isPlayingRef.current) {
          speak(sIdx + 1);
        }
      };

      utterance.onerror = (event) => {
        if (event.error !== 'interrupted' && isPlayingRef.current) {
          isPlayingRef.current = false;
          setIsPlaying(false);
          setCurrentWordIndex(-1);
        }
      };

      synthRef.current?.speak(utterance);
    };

    speak(startIndex);
  }, [settings.ttsSpeed, stopPlayback]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else {
      const sIdx = currentSentenceIndex === -1 ? 0 : currentSentenceIndex;
      startPlayback(sIdx);
    }
  }, [isPlaying, currentSentenceIndex, stopPlayback, startPlayback]);

  const handleSkipBlock = useCallback((direction: 'next' | 'prev') => {
    if (blockStartIndicesRef.current.length === 0) return;
    
    const currentIdx = currentSentenceIndex === -1 ? 0 : currentSentenceIndex;
    
    let currentBlockIdx = 0;
    for (let i = 0; i < blockStartIndicesRef.current.length; i++) {
      if (blockStartIndicesRef.current[i] <= currentIdx) {
        currentBlockIdx = i;
      } else {
        break;
      }
    }

    let targetIdx: number;
    if (direction === 'next') {
      if (currentBlockIdx < blockStartIndicesRef.current.length - 1) {
        targetIdx = blockStartIndicesRef.current[currentBlockIdx + 1];
      } else {
        return;
      }
    } else {
      if (currentIdx === blockStartIndicesRef.current[currentBlockIdx] && currentBlockIdx > 0) {
        targetIdx = blockStartIndicesRef.current[currentBlockIdx - 1];
      } else {
        targetIdx = blockStartIndicesRef.current[currentBlockIdx];
      }
    }

    setCurrentSentenceIndex(targetIdx);
    setCurrentWordIndex(0);
    
    if (isPlayingRef.current) {
      startPlayback(targetIdx);
    }
  }, [currentSentenceIndex, startPlayback]);

  const updateSettings = useCallback((newSettings: Partial<ReaderSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in the input area
      if (isEditing) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSkipBlock('prev');
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSkipBlock('next');
          break;
        case 'ArrowUp': {
          e.preventDefault();
          const nextUp = Math.round((settings.ttsSpeed + 0.2) * 10) / 10;
          if (nextUp <= 3.0) updateSettings({ ttsSpeed: nextUp });
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          const nextDown = Math.round((settings.ttsSpeed - 0.2) * 10) / 10;
          if (nextDown >= 0.5) updateSettings({ ttsSpeed: nextDown });
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, handlePlayPause, handleSkipBlock, settings.ttsSpeed, updateSettings]);

  useEffect(() => {
    if (isPlaying) {
      const sIdx = currentSentenceIndex === -1 ? 0 : currentSentenceIndex;
      startPlayback(sIdx);
    }
  }, [settings.ttsSpeed]);

  const progressPercent = useMemo(() => {
    if (sentencesRef.current.length === 0) return 0;
    const current = currentSentenceIndex === -1 ? 0 : currentSentenceIndex;
    return Math.round((current / (sentencesRef.current.length - 1)) * 100);
  }, [currentSentenceIndex, content]);

  const themeClasses = {
    [Theme.Light]: 'bg-white text-gray-900',
    [Theme.Sepia]: 'bg-[#f4ecd8] text-[#5b4636] sepia',
    [Theme.Dark]: 'bg-gray-950 text-gray-200 dark',
    [Theme.Amber]: 'bg-[#ffcc80] text-[#4e342e] amber',
  };

  const barBgClasses = {
    [Theme.Light]: 'bg-white border-t border-gray-200',
    [Theme.Sepia]: 'bg-[#f4ecd8] border-t border-[#e0d6c0]',
    [Theme.Dark]: 'bg-gray-950 border-t border-gray-800',
    [Theme.Amber]: 'bg-[#ffb74d] border-t border-[#f57c00]',
  }[settings.theme];

  const iconColor = {
    [Theme.Amber]: 'text-[#bf360c]',
    [Theme.Light]: 'text-indigo-600',
    [Theme.Sepia]: 'text-indigo-600',
    [Theme.Dark]: 'text-indigo-400',
  }[settings.theme];

  const playBtnColor = {
    [Theme.Amber]: 'bg-[#d84315]',
    [Theme.Light]: 'bg-indigo-600',
    [Theme.Sepia]: 'bg-indigo-600',
    [Theme.Dark]: 'bg-indigo-600',
  }[settings.theme];

  return (
    <div className={`min-h-screen transition-colors duration-500 flex flex-col ${themeClasses[settings.theme]}`}>
      <main className="max-w-3xl mx-auto px-6 pt-12 pb-32 md:pt-20 relative flex-grow w-full">
        {isEditing ? (
          <InputArea 
            value={content} 
            onChange={(val) => { setContent(val); stopPlayback(); }} 
            onClose={() => setIsEditing(false)}
            theme={settings.theme}
          />
        ) : (
          <Reader 
            content={content} 
            settings={settings} 
            currentSentenceIndex={currentSentenceIndex}
            currentWordIndex={currentWordIndex}
            onSentenceClick={(index) => {
              setCurrentSentenceIndex(index);
              setCurrentWordIndex(0);
              if (isPlaying) startPlayback(index);
            }}
            onSentencesParsed={(sentences, blockIndices) => {
              sentencesRef.current = sentences;
              blockStartIndicesRef.current = blockIndices;
            }}
          />
        )}
      </main>

      <div className={`reader-bottom-bar ${barBgClasses}`}>
        <div className="w-full h-1 bg-black/5 overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ease-out rounded-r-full ${{
              [Theme.Light]: 'bg-indigo-600',
              [Theme.Sepia]: 'bg-indigo-600',
              [Theme.Dark]: 'bg-indigo-500',
              [Theme.Amber]: 'bg-[#d84315]',
            }[settings.theme]}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 h-20 md:h-24 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 sm:gap-4 shrink-0">
            <div className="flex flex-col items-start px-2">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Progress</span>
              <div className="flex items-baseline gap-1.5 leading-none">
                <span className="font-mono font-bold text-sm">{progressPercent}%</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 flex-1 max-w-sm">
            <div className="flex items-center gap-1 sm:gap-4 w-full justify-center">
              <button 
                onClick={() => handleSkipBlock('prev')}
                className={`p-2 rounded-full hover:bg-black/5 transition-colors ${iconColor}`}
                title="Previous Paragraph (Left Arrow)"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              <button 
                onClick={() => {
                  const newSpeed = Math.round((settings.ttsSpeed - 0.2) * 10) / 10;
                  if (newSpeed >= 0.5) updateSettings({ ttsSpeed: newSpeed });
                }}
                className={`p-2 rounded-full hover:bg-black/5 transition-colors ${iconColor}`}
                title="Decrease Speed (Down Arrow)"
              >
                <Minus className="w-5 h-5" />
              </button>

              <button
                onClick={handlePlayPause}
                className={`p-3.5 md:p-4 rounded-2xl text-white shadow-lg transition-all active:scale-90 ${playBtnColor}`}
                title={isPlaying ? "Pause (Space)" : "Play (Space)"}
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </button>

              <button 
                onClick={() => {
                  const newSpeed = Math.round((settings.ttsSpeed + 0.2) * 10) / 10;
                  if (newSpeed <= 3.0) updateSettings({ ttsSpeed: newSpeed });
                }}
                className={`p-2 rounded-full hover:bg-black/5 transition-colors ${iconColor}`}
                title="Increase Speed (Up Arrow)"
              >
                <Plus className="w-5 h-5" />
              </button>

              <button 
                onClick={() => handleSkipBlock('next')}
                className={`p-2 rounded-full hover:bg-black/5 transition-colors ${iconColor}`}
                title="Next Paragraph (Right Arrow)"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
            </div>
            
            <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest opacity-50">
              <span>{settings.ttsSpeed.toFixed(1)}x Speed</span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2.5 rounded-xl hover:bg-black/5 transition-colors"
              title="Edit Content"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-2.5 rounded-xl hover:bg-black/5"
              title="Appearance Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsSettingsOpen(false)}></div>
          <div className="relative w-full max-sm:w-full max-w-sm h-full shadow-2xl animate-in slide-in-from-right duration-300">
            <SettingsPanel 
              settings={settings} 
              onUpdate={updateSettings} 
              onClose={() => setIsSettingsOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;