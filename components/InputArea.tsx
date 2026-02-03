import React from 'react';
import { Theme } from '../types';
import { FileText, Save, X } from 'lucide-react';
import { PRELOAD_CONTENT } from '../constants';

interface InputAreaProps {
  value: string;
  onChange: (val: string) => void;
  onClose: () => void;
  theme: Theme;
}

const InputArea: React.FC<InputAreaProps> = ({ value, onChange, onClose, theme }) => {
  const inputBg = {
    [Theme.Light]: 'bg-gray-50 text-gray-900 border-gray-200',
    [Theme.Sepia]: 'bg-[#efe5cd] text-[#5b4636] border-[#e0d6c0]',
    [Theme.Dark]: 'bg-gray-900 text-gray-200 border-gray-800',
    [Theme.Amber]: 'bg-[#ffcc80] text-[#4e342e] border-[#f57c00]',
  }[theme];

  const btnBg = {
    [Theme.Amber]: 'bg-[#d84315] hover:bg-[#bf360c]',
    [Theme.Light]: 'bg-indigo-600 hover:bg-indigo-700',
    [Theme.Sepia]: 'bg-indigo-600 hover:bg-indigo-700',
    [Theme.Dark]: 'bg-indigo-600 hover:bg-indigo-700',
  }[theme];

  return (
    <div className="space-y-4 animate-in fade-in zoom-in duration-300">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 opacity-60" />
          <h2 className="text-lg font-bold">Content Editor</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange(PRELOAD_CONTENT)}
            className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-black/5 hover:bg-black/10 transition-colors"
          >
            Reset to Default
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your markdown or text here..."
        className={`w-full h-[60vh] p-8 rounded-2xl border-2 focus:ring-4 focus:ring-orange-500/20 focus:outline-none font-mono text-sm leading-relaxed transition-all resize-none shadow-inner ${inputBg}`}
      />

      <div className="flex justify-end">
        <button
          onClick={onClose}
          className={`flex items-center gap-2 px-8 py-3 text-white font-bold rounded-2xl shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 ${btnBg}`}
        >
          <Save className="w-5 h-5" />
          Save & Read
        </button>
      </div>
      
      <p className="text-xs opacity-50 text-center mt-4">
        Supports basic Markdown formatting: # Headers, - Lists, --- Horizontal rules.
      </p>
    </div>
  );
};

export default InputArea;