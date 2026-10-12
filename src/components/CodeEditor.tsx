import React, { useRef } from 'react';
import { Play, Code2, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChangeCode: (newCode: string) => void;
  activeLine: number | null;
  onRun: () => void;
  parseError?: string;
  isSimulating: boolean;
  expectedOutput?: string[];
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChangeCode,
  activeLine,
  onRun,
  parseError,
  isSimulating,
  expectedOutput,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lines = code.split('\n');

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/70 border-b border-slate-800 flex-shrink-0 gap-2">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Code2 className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-xs font-semibold text-slate-200 tracking-wide">
            JavaScript Muharriri
          </span>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            ({lines.length} qator)
          </span>
        </div>

        {/* Expected Output Preview for Learners */}
        {expectedOutput && expectedOutput.length > 0 && (
          <div className="hidden md:flex items-center gap-1 text-[10px] bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800 text-slate-300 max-w-[280px] truncate">
            <span className="text-amber-400 font-bold flex-shrink-0">Kutilgan:</span>
            <span className="font-mono text-slate-400 truncate">
              {expectedOutput.join(' → ')}
            </span>
          </div>
        )}

        <button
          onClick={onRun}
          disabled={isSimulating}
          className="flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium text-xs rounded-md shadow-sm active:scale-95 transition flex-shrink-0"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Run</span>
        </button>
      </div>

      {/* Parse Error Notification */}
      {parseError && (
        <div className="px-2.5 py-1 bg-red-950/60 border-b border-red-500/30 flex items-start gap-1.5 text-[11px] text-red-300 flex-shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 truncate">
            <span className="font-semibold">Xatolik:</span> {parseError}
          </div>
        </div>
      )}

      {/* Editor & Line Numbers */}
      <div className="relative flex-1 min-h-0 flex overflow-hidden font-mono text-[11px] bg-slate-950/50">
        {/* Line Numbers with Active Line Highlight & Pointer Arrow */}
        <div className="w-8 py-1 bg-slate-950/90 text-slate-500 select-none border-r border-slate-850 flex flex-col items-center">
          {lines.map((_, idx) => {
            const lineNum = idx + 1;
            const isActive = activeLine === lineNum;
            return (
              <div
                key={lineNum}
                className={`h-5 w-full flex items-center justify-center transition-colors text-[10px] relative ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-500'
                }`}
              >
                {isActive && (
                  <span className="absolute -left-0.5 text-[8px] text-amber-300 font-bold animate-pulse">
                    ▶
                  </span>
                )}
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Code Content Container */}
        <div className="relative flex-1 overflow-auto py-1">
          {/* Active line background highlight backdrop */}
          {activeLine !== null && activeLine <= lines.length && (
            <div
              className="absolute left-0 right-0 h-5 bg-blue-500/20 border-y border-blue-500/40 pointer-events-none transition-all duration-150 flex items-center justify-end pr-2"
              style={{ top: `${(activeLine - 1) * 20 + 4}px` }}
            >
              <span className="text-[9px] text-blue-300 font-sans font-bold flex items-center gap-0.5 bg-blue-900/60 px-1 rounded">
                <CheckCircle2 className="w-2.5 h-2.5" /> Q{activeLine}
              </span>
            </div>
          )}

          <textarea
            ref={textareaRef}
            aria-label="JavaScript kodi"
            spellCheck={false}
            value={code}
            onChange={(e) => onChangeCode(e.target.value)}
            className="w-full h-full bg-transparent text-slate-200 outline-none resize-none leading-5 px-2.5 selection:bg-blue-600/30 font-mono text-[11px] whitespace-pre tab-size-2"
          />
        </div>
      </div>
    </div>
  );
};
