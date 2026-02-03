import React, { useMemo, useEffect, useRef } from 'react';
import { ReaderSettings, ReaderFont } from '../types';

interface ReaderProps {
  content: string;
  settings: ReaderSettings;
  currentSentenceIndex: number;
  currentWordIndex: number;
  onSentenceClick: (index: number) => void;
  onSentencesParsed: (sentences: string[], blockIndices: number[]) => void;
}

/**
 * Clean text for TTS: Remove markdown symbols and emojis.
 */
const cleanForTTS = (text: string) => {
  return text
    .replace(/(\*\*|__|\*|_|`)/g, '')
    // Remove emojis using Unicode property escapes
    .replace(/\p{Extended_Pictographic}/gu, '')
    .trim();
};

/**
 * Enhanced markdown formatter that returns segments of text to be split into words.
 */
const formatMarkdownWithWords = (text: string, isSentenceActive: boolean, currentWordIndex: number, startWordCounter: number) => {
  const regex = /(\*\*.*?\*\*|__.*?__|(?<!\*)\*.*?\*(?!\*) |(?<!_)_.*?_(?!_)|`.*?`)/g;
  const parts = text.split(regex);
  let localWordCounter = startWordCounter;

  const renderWords = (content: string, className?: string) => {
    // Split by spaces but preserve them as part of the word tokens
    const words = content.split(/(\s+)/);
    return words.map((part, i) => {
      if (part.trim() === "") return <span key={i}>{part}</span>;
      
      // Check if this part is just an emoji
      // We use a simplified check here because it's usually one token in this split logic
      const isEmoji = /\p{Extended_Pictographic}/gu.test(part);
      
      // If it's an emoji, we DON'T increment the word counter
      // This allows the TTS word index (from emoji-free text) to stay in sync
      const wordIdx = isEmoji ? -1 : localWordCounter++;
      const isWordActive = isSentenceActive && wordIdx === currentWordIndex;
      
      return (
        <span 
          key={i} 
          className={`transition-all duration-75 rounded px-0.5 ${isWordActive ? 'highlight-active' : ''} ${className || ''}`}
        >
          {part}
        </span>
      );
    });
  };

  return {
    elements: parts.map((part, i) => {
      if (!part) return null;
      if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
        return <strong key={i} className="font-bold">{renderWords(part.slice(2, -2))}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="px-1.5 py-0.5 rounded bg-black/5 font-mono-custom text-[0.9em]">{renderWords(part.slice(1, -1))}</code>;
      }
      if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
        return <em key={i} className="italic">{renderWords(part.slice(1, -1))}</em>;
      }
      return <React.Fragment key={i}>{renderWords(part)}</React.Fragment>;
    }),
    nextWordCounter: localWordCounter
  };
};

const Reader: React.FC<ReaderProps> = ({ 
  content, 
  settings, 
  currentSentenceIndex,
  currentWordIndex, 
  onSentenceClick,
  onSentencesParsed
}) => {
  const sentenceRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const { blocks, allTtsSentences, blockIndices } = useMemo(() => {
    const lines = content.split('\n');
    const blocks: { type: string; tableRows?: string[][]; sentences: string[]; originalSentences: string[] }[] = [];
    const sentenceRegex = /(?<=[.!?])\s+/;
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();
      if (!trimmed && line !== '\n') {
        i++;
        continue;
      }

      if (trimmed.startsWith('|') && i + 1 < lines.length && lines[i+1].trim().match(/^\|?(\s*:?-+:?\s*\|?)+\s*$/)) {
        const tableRows: string[][] = [];
        const extractCells = (l: string) => l.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(s => s.trim());
        
        tableRows.push(extractCells(line));
        i += 2;
        
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          tableRows.push(extractCells(lines[i]));
          i++;
        }

        const allCells = tableRows.flat();
        blocks.push({
          type: 'table',
          tableRows,
          sentences: allCells.map(c => cleanForTTS(c)),
          originalSentences: allCells
        });
        continue;
      }

      if (trimmed.startsWith('>')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
          i++;
        }
        const fullText = quoteLines.join(' ');
        const sentences = fullText.split(sentenceRegex).filter(s => s.trim().length > 0);
        blocks.push({
          type: 'blockquote',
          sentences: sentences.map(s => cleanForTTS(s)),
          originalSentences: sentences
        });
        continue;
      }

      let type: string = 'p';
      let cleanText = trimmed;

      const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (headerMatch) {
        type = `h${headerMatch[1].length}`;
        cleanText = headerMatch[2];
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\./.test(trimmed)) { 
        type = 'li'; 
        cleanText = trimmed.replace(/^([-*] |\d+\. )/, ''); 
      } else if (trimmed === '---' || trimmed === '***') { 
        type = 'hr'; 
        cleanText = ''; 
      }

      const originalSentences = type === 'hr' ? [] : cleanText.split(sentenceRegex).filter(s => s.trim().length > 0);
      const ttsSentences = originalSentences.map(s => cleanForTTS(s));
      
      if (originalSentences.length > 0 || type === 'hr') {
        blocks.push({ type, sentences: ttsSentences, originalSentences });
      }
      i++;
    }

    const allTtsSentences = blocks.flatMap(b => b.sentences);
    let currentTotal = 0;
    const blockIndices = blocks.map(b => {
      const start = currentTotal;
      currentTotal += b.sentences.length;
      return start;
    });

    return { blocks, allTtsSentences, blockIndices };
  }, [content]);

  useEffect(() => {
    onSentencesParsed(allTtsSentences, blockIndices);
  }, [allTtsSentences, blockIndices, onSentencesParsed]);

  useEffect(() => {
    if (currentSentenceIndex >= 0 && sentenceRefs.current[currentSentenceIndex]) {
      sentenceRefs.current[currentSentenceIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentSentenceIndex]);

  const fontClass = settings.font === ReaderFont.Classic ? 'font-classic' : 'font-clean';
  let overallSentenceCounter = 0;

  return (
    <div 
      className={`prose max-w-none select-text transition-all duration-300 ${fontClass}`}
      style={{ 
        fontSize: `${settings.fontSize}px`, 
        lineHeight: settings.lineHeight,
      }}
    >
      {blocks.map((block, bIdx) => {
        if (block.type === 'hr') return <hr key={bIdx} className="my-10 border-current opacity-10" />;
        
        if (block.type === 'table' && block.tableRows) {
          const headerRow = block.tableRows[0];
          const bodyRows = block.tableRows.slice(1);
          return (
            <div key={bIdx} className="overflow-x-auto my-10 no-scrollbar">
              <table className="reader-table">
                <thead>
                  <tr>
                    {headerRow.map((cell, cIdx) => {
                      const currentIdx = overallSentenceCounter++;
                      const isSentenceActive = currentSentenceIndex === currentIdx;
                      const { elements } = formatMarkdownWithWords(cell, isSentenceActive, currentWordIndex, 0);
                      return (
                        <th key={cIdx}>
                          <span
                            ref={el => { sentenceRefs.current[currentIdx] = el; }}
                            onClick={() => onSentenceClick(currentIdx)}
                            className={`cursor-pointer transition-all rounded px-1 -mx-1 block ${isSentenceActive ? 'bg-black/5 dark:bg-white/5' : 'hover:opacity-70'}`}
                          >
                            {elements}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => {
                        const currentIdx = overallSentenceCounter++;
                        const isSentenceActive = currentSentenceIndex === currentIdx;
                        const { elements } = formatMarkdownWithWords(cell, isSentenceActive, currentWordIndex, 0);
                        return (
                          <td key={cIdx}>
                            <span
                              ref={el => { sentenceRefs.current[currentIdx] = el; }}
                              onClick={() => onSentenceClick(currentIdx)}
                              className={`cursor-pointer transition-all rounded px-1 -mx-1 block ${isSentenceActive ? 'bg-black/5 dark:bg-white/5' : 'hover:opacity-70'}`}
                            >
                              {elements}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        const blockStyles: Record<string, string> = {
          h1: 'text-4xl font-black mb-8 mt-12 tracking-tight markdown-h1',
          h2: 'text-3xl font-bold mb-6 mt-10 tracking-tight markdown-h2',
          h3: 'text-2xl font-bold mb-4 mt-8',
          h4: 'text-xl font-bold mb-4 mt-6',
          h5: 'text-lg font-bold mb-2 mt-4',
          h6: 'text-base font-bold mb-2 mt-4 opacity-70',
          blockquote: 'my-10 pl-6',
          li: 'ml-8 mb-2 list-disc',
          p: 'mb-6',
        };

        const Tag = (block.type.startsWith('h') ? block.type : block.type === 'li' ? 'li' : block.type === 'blockquote' ? 'blockquote' : 'p') as any;
        const tagClass = blockStyles[block.type] || 'mb-6';

        return (
          <Tag key={bIdx} className={tagClass}>
            {block.originalSentences.map((sentence, sIdx) => {
              const currentIdx = overallSentenceCounter++;
              const isSentenceActive = currentSentenceIndex === currentIdx;
              const { elements } = formatMarkdownWithWords(sentence, isSentenceActive, currentWordIndex, 0);
              
              return (
                <span
                  key={sIdx}
                  ref={el => { sentenceRefs.current[currentIdx] = el; }}
                  onClick={() => onSentenceClick(currentIdx)}
                  className={`cursor-pointer transition-all duration-300 rounded inline px-1 py-0.5 -mx-1 ${isSentenceActive ? 'bg-black/5 dark:bg-white/5' : 'hover:opacity-70'}`}
                >
                  {elements}{' '}
                </span>
              );
            })}
          </Tag>
        );
      })}
    </div>
  );
};

export default Reader;