import React from 'react';
import { Zap } from 'lucide-react';
import type { QueueItem } from '../types/simulation';


interface MicrotaskQueueProps {
  queue: QueueItem[];
}

export const MicrotaskQueue: React.FC<MicrotaskQueueProps> = ({ queue }) => {
  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-emerald-900/40 shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-950/40 border-b border-emerald-900/40 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="p-0.5 rounded bg-emerald-500/20 text-emerald-400">
            <Zap className="w-3.5 h-3.5 fill-current" />
          </div>
          <span className="text-xs font-bold text-emerald-200 tracking-wide">
            Microtask Queue
          </span>
          <span className="text-[9px] uppercase font-semibold text-emerald-400 bg-emerald-900/50 px-1 py-0.2 rounded border border-emerald-700/50">
            Yuqori Ustuvorlik
          </span>
        </div>

        <span className="text-[10px] font-mono text-emerald-300 font-semibold">
          {queue.length} navbatda
        </span>
      </div>

      {/* Queue Body */}
      <div className="flex-1 min-h-0 p-2 overflow-y-auto flex flex-col gap-1.5 bg-gradient-to-b from-slate-900 to-slate-950">
        {queue.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 p-2 border border-dashed border-slate-800 rounded-lg">
            <Zap className="w-6 h-6 text-slate-600 mb-1 opacity-60" />
            <p className="text-[11px] font-semibold text-slate-400">Microtask navbati bo‘sh</p>
          </div>
        ) : (
          queue.map((task, idx) => {
            const isFirst = idx === 0;
            return (
              <div
                key={task.id}
                className={`p-2 rounded-lg border transition-all ${
                  isFirst
                    ? 'bg-emerald-900/30 border-emerald-500 text-emerald-100 ring-1 ring-emerald-500/30'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 mb-0.5">
                  <div className="flex items-center gap-1 truncate">
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950 px-1 rounded border border-emerald-800">
                      #{idx + 1}
                    </span>
                    <span className="font-mono text-xs font-bold text-white truncate">
                      {task.name}
                    </span>
                  </div>

                  {task.originLine !== null && (
                    <span className="text-[9px] font-mono bg-emerald-950/80 text-emerald-300 px-1 py-0.2 rounded border border-emerald-800/60">
                      Q{task.originLine}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[10px] text-slate-300">
                  <span className="text-slate-400">Manba:</span>
                  <span className="font-mono text-emerald-300">{task.source}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
