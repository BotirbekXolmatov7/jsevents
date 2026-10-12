import React from 'react';
import { Sparkles, BookOpen, RotateCcw, Cpu } from 'lucide-react';
import { PRESETS } from '../engine/presets';

interface HeaderProps {
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  onOpenGuide: () => void;
  onResetCode: () => void;
  isModified: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  selectedPresetId,
  onSelectPreset,
  onOpenGuide,
  onResetCode,
  isModified,
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-3 py-1.5 flex-shrink-0 z-40">
      <div className="w-full flex items-center justify-between gap-2">
        {/* Logo and Title */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
            <Cpu className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-white m-0">
              Event Loop Visualizer
            </h1>
            <span className="hidden sm:inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Interactive
            </span>
          </div>
        </div>

        {/* Preset Selector & Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 ml-1.5 flex-shrink-0" />
            <select
              aria-label="Misollarni tanlash"
              value={selectedPresetId}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="bg-transparent text-slate-200 font-medium text-xs py-0.5 px-1.5 rounded focus:outline-none cursor-pointer max-w-[200px] sm:max-w-[280px] truncate"
            >
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200 py-1">
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {isModified && (
            <button
              onClick={onResetCode}
              title="Kodni asl holatiga qaytarish"
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Tiklash</span>
            </button>
          )}

          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 rounded-lg border border-emerald-500/30 transition shadow-sm"
          >
            <BookOpen className="w-3 h-3" />
            <span>Qoidalar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
