import React from 'react';
import { ReaderSettings, ReaderFont, Theme } from '../types';

interface RSVPReaderProps {
  words: string[];
  currentWordIndex: number;
  settings: ReaderSettings;
}

const RSVPReader: React.FC<RSVPReaderProps> = ({ words, currentWordIndex, settings }) => {
  const currentWord = words[currentWordIndex] || '';
  
  // Get more context words
  const prevWords = [
    words[currentWordIndex - 2] || '',
    words[currentWordIndex - 1] || ''
  ];
  const nextWords = [
    words[currentWordIndex + 1] || '',
    words[currentWordIndex + 2] || ''
  ];
  
  // Calculate ORP (Optimal Recognition Point)
  // Usually around the 25-30% mark of the word
  const getORPIndex = (word: string) => {
    if (word.length <= 1) return 0;
    if (word.length <= 5) return 1;
    if (word.length <= 9) return 2;
    if (word.length <= 13) return 3;
    return 4;
  };

  const orpIdx = getORPIndex(currentWord);
  const prefix = currentWord.substring(0, orpIdx);
  const pivot = currentWord.charAt(orpIdx);
  const suffix = currentWord.substring(orpIdx + 1);

  // WPM Calculation: Assuming 1.0x = ~200 WPM base
  const wpm = Math.round(settings.ttsSpeed * 200);

  const themeBg = {
    [Theme.Light]: 'bg-white border-y border-gray-200 shadow-[0_-20px_60px_rgba(0,0,0,0.1)]',
    [Theme.Sepia]: 'bg-[#f4ecd8] border-y border-[#d3c8af] shadow-[0_-20px_60px_rgba(0,0,0,0.1)]',
    [Theme.Dark]: 'bg-gray-950 border-y border-gray-800 shadow-[0_-20px_60px_rgba(0,0,0,0.8)]',
    [Theme.Amber]: 'bg-[#ffb74d] border-y border-[#e6a13c] shadow-[0_-20px_60px_rgba(0,0,0,0.2)]',
  }[settings.theme];

  const fontClass = settings.font === ReaderFont.Classic ? 'font-classic' : 'font-clean';

  return (
    <div className={`w-full h-36 md:h-52 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${themeBg}`}>
      {/* Visual Alignment Guides for Focus */}
      <div className="absolute left-1/2 top-4 bottom-4 w-[2px] bg-red-500/30 -translate-x-1/2 rounded-full" />
      <div className="absolute left-1/2 top-6 w-[8px] h-[8px] bg-red-600/60 -translate-x-1/2 rounded-full shadow-sm" />
      <div className="absolute left-1/2 bottom-6 w-[8px] h-[8px] bg-red-600/60 -translate-x-1/2 rounded-full shadow-sm" />

      <div className={`relative flex items-center justify-center w-full px-4 md:px-8 ${fontClass}`}>
        
        {/* Previous Words (Context) */}
        <div className="absolute right-[56%] flex items-center gap-4 justify-end transition-all duration-100 pointer-events-none">
          <span className="opacity-5 blur-[2px] text-lg md:text-xl lg:text-2xl hidden sm:inline">{prevWords[0]}</span>
          <span className="opacity-20 blur-[1px] text-xl md:text-2xl lg:text-3xl">{prevWords[1]}</span>
        </div>

        {/* Current Word with ORP */}
        <div className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight flex items-center shrink-0 z-10">
          <div className="flex justify-end w-[160px] md:w-[280px] lg:w-[350px] pr-[0.02em] whitespace-nowrap">
            <span className="opacity-60 transition-opacity duration-75">{prefix}</span>
          </div>
          <div className="flex justify-center shrink-0 min-w-[0.6em]">
            <span className="rsvp-orp scale-125 drop-shadow-md brightness-125 font-black">{pivot}</span>
          </div>
          <div className="flex justify-start w-[160px] md:w-[280px] lg:w-[350px] pl-[0.02em] whitespace-nowrap">
            <span className="opacity-60 transition-opacity duration-75">{suffix}</span>
          </div>
        </div>

        {/* Next Words (Context) */}
        <div className="absolute left-[56%] flex items-center gap-4 justify-start transition-all duration-100 pointer-events-none">
          <span className="opacity-20 blur-[1px] text-xl md:text-2xl lg:text-3xl">{nextWords[0]}</span>
          <span className="opacity-5 blur-[2px] text-lg md:text-xl lg:text-2xl hidden sm:inline">{nextWords[1]}</span>
        </div>
      </div>

      {/* Mode & WPM Indicators */}
      <div className="absolute top-4 left-8 md:left-12 opacity-60 text-[10px] font-black uppercase tracking-[0.4em] pointer-events-none flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        Focus Mode
      </div>
      <div className="absolute top-4 right-8 md:right-12 opacity-60 text-[10px] font-black uppercase tracking-[0.4em] pointer-events-none">
        {wpm} <span className="opacity-50">WPM</span>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-30 text-[9px] font-bold uppercase tracking-[0.2em] pointer-events-none">
        {settings.ttsSpeed.toFixed(1)}x Speed
      </div>
    </div>
  );
};

export default RSVPReader;