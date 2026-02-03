
import React, { useRef, useEffect } from 'react';
import { Theme, ReaderSettings, ReaderFont } from '../types';
import { X } from 'lucide-react';

interface RSVPReaderProps {
  words: string[];
  currentIndex: number;
  settings: ReaderSettings;
  onClose: () => void;
}

const RSVPReader: React.FC<RSVPReaderProps> = ({ words, currentIndex, settings, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const activeWord = wordRefs.current[currentIndex];
    const container = containerRef.current;
    if (activeWord && container) {
      const containerCenter = container.offsetWidth / 2;
      const wordCenter = activeWord.offsetLeft + activeWord.offsetWidth / 2;
      const scrollPos = wordCenter - containerCenter;
      
      container.scrollTo({
        left: scrollPos,
        behavior: 'smooth'
      });
    }
  }, [currentIndex, words]);

  const themeBg = {
    [Theme.Light]: 'bg-white border-t border-gray-200',
    [Theme.Sepia]: 'bg-[#f4ecd8] border-t border-[#e0d6c0]',
    [Theme.Dark]: 'bg-gray-900 border-t border-gray-800',
    [Theme.ThisIsFine]: 'bg-[#ffb74d] border-t border-[#f57c00]',
  }[settings.theme];

  const orpColor = {
    [Theme.ThisIsFine]: 'text-[#d84315]',
    [Theme.Light]: 'text-indigo-600',
    [Theme.Sepia]: 'text-indigo-600',
    [Theme.Dark]: 'text-indigo-400',
  }[settings.theme];

  const fontClass = settings.font === ReaderFont.Classic ? 'font-classic' : 'font-clean';

  return (
    <div className={`fixed bottom-20 md:bottom-24 left-0 right-0 z-[45] h-16 md:h-20 flex items-center shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-4 ${themeBg}`}>
      {/* Ticker Container */}
      <div 
        ref={containerRef}
        className="flex-grow h-full overflow-hidden flex items-center relative no-scrollbar"
      >
        {/* Focus lines */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-current opacity-20 pointer-events-none -translate-x-1/2 z-10" />
        
        <div className="flex items-center px-[50vw] space-x-8">
          {words.map((word, idx) => {
            const isActive = idx === currentIndex;
            return (
              <span
                key={`${idx}-${word}`}
                // Fix: Wrapped assignment in braces so the arrow function returns void instead of the assigned element.
                ref={el => { wordRefs.current[idx] = el; }}
                className={`whitespace-nowrap transition-all duration-300 text-2xl md:text-3xl font-bold ${fontClass} ${
                  isActive ? orpColor + ' scale-125 opacity-100' : 'opacity-20 blur-[0.5px]'
                }`}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>
      
      <button 
        onClick={onClose}
        className="px-4 h-full flex items-center hover:bg-black/5 border-l border-current/10 opacity-40 hover:opacity-100 transition-all"
        title="Close Ticker"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default RSVPReader;
