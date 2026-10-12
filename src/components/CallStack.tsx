import React from 'react';
import { Layers, ArrowDown, Activity } from 'lucide-react';
import type { CallStackItem } from '../types/simulation';


interface CallStackProps {
  stack: CallStackItem[];
  isActive?: boolean;
}

export const CallStack: React.FC<CallStackProps> = ({ stack, isActive }) => {
  return (
    <div
      className={`flex flex-col h-full bg-slate-900 rounded-xl border transition-all duration-300 overflow-hidden ${
        isActive
          ? 'border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/20'
          : 'border-blue-900/40 shadow-md'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-blue-950/40 border-b border-blue-900/40 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="p-0.5 rounded bg-blue-500/20 text-blue-400">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-blue-200 tracking-wide">Call Stack</span>
          <span
            title="LIFO: Last In First Out — eng oxirgi kirgan funksiya eng birinchi chiqadi"
            className="text-[9px] uppercase font-semibold text-blue-400 bg-blue-900/50 px-1 py-0.2 rounded border border-blue-700/50 cursor-help"
          >
            LIFO (Stack)
          </span>
        </div>

        <span className="text-[10px] font-mono text-blue-300 font-semibold">
          {stack.length} frame{stack.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Stack Body - Rendered bottom-to-top */}
      <div className="flex-1 min-h-0 p-2 overflow-y-auto flex flex-col-reverse justify-start gap-1.5 bg-gradient-to-b from-slate-900 to-slate-950">
        {stack.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 p-2 border border-dashed border-slate-800 rounded-lg">
            <Layers className="w-6 h-6 text-slate-600 mb-1 opacity-60" />
            <p className="text-[11px] font-semibold text-slate-400">Stack bo‘sh</p>
          </div>
        ) : (
          stack.map((frame, index) => {
            const isTop = index === stack.length - 1;
            return (
              <div
                key={frame.id}
                className={`p-2 rounded-lg border transition-all ${
                  isTop
                    ? 'bg-blue-900/40 border-blue-500 text-blue-100 shadow-sm ring-1 ring-blue-500/30'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 mb-0.5">
                  <div className="flex items-center gap-1 truncate">
                    {isTop ? (
                      <Activity className="w-3 h-3 text-blue-400 animate-pulse flex-shrink-0" />
                    ) : (
                      <ArrowDown className="w-3 h-3 text-slate-500 flex-shrink-0" />
                    )}
                    <span className="font-mono text-xs font-bold text-white truncate">
                      {frame.name}
                    </span>
                  </div>

                  {frame.line !== null && (
                    <span className="text-[9px] font-mono bg-blue-950/80 text-blue-300 px-1 py-0.2 rounded border border-blue-800/60">
                      Q{frame.line}
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-slate-300 leading-tight">
                  {frame.description}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
