import React from 'react';
import { Terminal, Trash2 } from 'lucide-react';
import type { ConsoleLogItem } from '../types/simulation';


interface ConsoleOutputProps {
  logs: ConsoleLogItem[];
  onClear?: () => void;
}

export const ConsoleOutput: React.FC<ConsoleOutputProps> = ({ logs, onClear }) => {
  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-slate-800 shadow-md overflow-hidden font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          {/* Mac-style window dots */}
          <div className="flex items-center gap-1 mr-1">
            <span className="w-2 h-2 rounded-full bg-red-500/80" />
            <span className="w-2 h-2 rounded-full bg-amber-500/80" />
            <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
          </div>

          <Terminal className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-200 tracking-wide font-sans">
            Console Output
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-sans">
            {logs.length} yozuv
          </span>
          {onClear && (
            <button
              onClick={onClear}
              title="Konsolni tozalash"
              className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 min-h-0 p-2 overflow-y-auto bg-slate-950 flex flex-col gap-1 text-[11px]">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 font-sans text-[11px] italic">
            Konsol bo‘sh...
          </div>
        ) : (
          logs.map((log) => {
            const isWarn = log.type === 'warn';
            const isError = log.type === 'error';
            return (
              <div
                key={log.id}
                className={`flex items-start gap-1.5 py-0.5 px-1.5 rounded border transition-colors ${
                  isError
                    ? 'bg-red-950/30 border-red-900/50 text-red-300'
                    : isWarn
                    ? 'bg-amber-950/30 border-amber-900/50 text-amber-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-200'
                }`}
              >
                <span className="text-slate-500 select-none font-bold">&gt;</span>
                <span className="flex-1 whitespace-pre-wrap break-all font-mono font-medium">
                  {log.value}
                </span>

                {/* Origin Source Badge for Learners */}
                {log.originType === 'sync' && (
                  <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60 font-sans flex-shrink-0">
                    Sinxron
                  </span>
                )}
                {log.originType === 'microtask' && (
                  <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-sans flex-shrink-0">
                    Microtask
                  </span>
                )}
                {log.originType === 'macrotask' && (
                  <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 font-sans flex-shrink-0">
                    Macrotask
                  </span>
                )}

                {log.line !== null && (
                  <span className="text-[9px] text-slate-500 select-none font-sans whitespace-nowrap ml-1 flex-shrink-0">
                    Q{log.line}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
