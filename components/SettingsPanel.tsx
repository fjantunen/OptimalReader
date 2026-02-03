import React from 'react';
import { ReaderSettings, Theme, ReaderFont } from '../types';
import { X, Sun, Moon, Coffee, Layout, Palette } from 'lucide-react';

interface SettingsPanelProps {
  settings: ReaderSettings;
  onUpdate: (settings: Partial<ReaderSettings>) => void;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onUpdate, onClose }) => {
  const themes = [
    { id: Theme.Light, icon: Sun, label: 'Light' },
    { id: Theme.Sepia, icon: Coffee, label: 'Sepia' },
    { id: Theme.Dark, icon: Moon, label: 'Dark' },
    { id: Theme.Amber, icon: Palette, label: 'Amber' },
  ];

  const panelBg = {
    [Theme.Light]: 'bg-white text-gray-900 border-l border-gray-100',
    [Theme.Sepia]: 'bg-[#f4ecd8] text-[#5b4636] border-l border-[#e0d6c0]',
    [Theme.Dark]: 'bg-gray-950 text-gray-200 border-l border-gray-800',
    [Theme.Amber]: 'bg-[#ffcc80] text-[#4e342e] border-l border-[#f57c00]',
  }[settings.theme];

  const accentColor = {
    [Theme.Amber]: 'border-[#d84315] bg-[#fff3e0]',
    [Theme.Light]: 'border-indigo-600 bg-indigo-50/50',
    [Theme.Sepia]: 'border-indigo-600 bg-indigo-50/50',
    [Theme.Dark]: 'border-indigo-600 bg-indigo-50/50',
  }[settings.theme];

  const accentText = {
    [Theme.Amber]: 'text-[#d84315]',
    [Theme.Light]: 'text-indigo-600',
    [Theme.Sepia]: 'text-indigo-600',
    [Theme.Dark]: 'text-indigo-600',
  }[settings.theme];

  const rangeAccent = {
    [Theme.Amber]: 'accent-[#d84315]',
    [Theme.Light]: 'accent-indigo-600',
    [Theme.Sepia]: 'accent-indigo-600',
    [Theme.Dark]: 'accent-indigo-600',
  }[settings.theme];

  return (
    <div className={`h-full p-8 flex flex-col ${panelBg}`}>
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Layout className="w-5 h-5" />
          Appearance
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-12 overflow-y-auto pr-2 no-scrollbar pb-12">
        <section>
          <label className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4 block">Reading Mode</label>
          <div className="grid grid-cols-2 gap-2">
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => onUpdate({ theme: t.id })}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  settings.theme === t.id 
                    ? accentColor 
                    : 'border-transparent hover:bg-black/5'
                }`}
              >
                <t.icon className={`w-5 h-5 ${settings.theme === t.id ? accentText : ''}`} />
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <label className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4 block">Typeface</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onUpdate({ font: ReaderFont.Clean })}
              className={`p-4 rounded-xl border-2 transition-all text-center flex flex-col items-center justify-center ${
                settings.font === ReaderFont.Clean 
                  ? accentColor 
                  : 'border-transparent bg-black/5 hover:bg-black/10'
              }`}
            >
              <span className="block text-2xl font-sans leading-none mb-1 font-bold">Clean</span>
              <span className="text-[10px] font-bold uppercase opacity-60">Sans Serif</span>
            </button>
            <button
              onClick={() => onUpdate({ font: ReaderFont.Classic })}
              className={`p-4 rounded-xl border-2 transition-all text-center flex flex-col items-center justify-center ${
                settings.font === ReaderFont.Classic 
                  ? accentColor 
                  : 'border-transparent bg-black/5 hover:bg-black/10'
              }`}
            >
              <span className="block text-2xl font-serif leading-none mb-1 font-bold">Classic</span>
              <span className="text-[10px] font-bold uppercase opacity-60">Modern Serif</span>
            </button>
          </div>
        </section>

        <section className="space-y-8">
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="text-xs font-bold uppercase tracking-widest opacity-50 block">Text Size</label>
              <span className="text-sm font-bold">{settings.fontSize}px</span>
            </div>
            <div className="py-2">
              <input 
                type="range" min="16" max="42" step="1" 
                value={settings.fontSize}
                onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
                className={`w-full h-1.5 bg-black/10 rounded-lg appearance-none cursor-pointer ${rangeAccent}`}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="text-xs font-bold uppercase tracking-widest opacity-50 block">Line Spacing</label>
              <span className="text-sm font-bold">{settings.lineHeight}</span>
            </div>
            <div className="py-2">
              <input 
                type="range" min="1.2" max="2.8" step="0.1" 
                value={settings.lineHeight}
                onChange={(e) => onUpdate({ lineHeight: Number(e.target.value) })}
                className={`w-full h-1.5 bg-black/10 rounded-lg appearance-none cursor-pointer ${rangeAccent}`}
              />
            </div>
          </div>
        </section>
      </div>

      <div className="mt-auto pt-8 border-t border-black/5 flex flex-col items-center gap-2 opacity-30">
        <span className="text-[10px] tracking-[0.2em] font-black uppercase">Lumina Reader v2.6</span>
      </div>
    </div>
  );
};

export default SettingsPanel;