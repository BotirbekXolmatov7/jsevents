import React from 'react';
import { Timer } from 'lucide-react';
import type { QueueItem } from '../types/simulation';


interface MacrotaskQueueProps {
  queue: QueueItem[];
  isActive?: boolean;
}

export const MacrotaskQueue: React.FC<MacrotaskQueueProps> = ({ queue, isActive }) => {
  return (
    <div
      className={`flex flex-col h-full bg-slate-900 rounded-xl border transition-all duration-300 overflow-hidden ${
        isActive
          ? 'border-amber-500 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/20'
          : 'border-amber-900/40 shadow-md'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-amber-950/40 border-b border-amber-900/40 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="p-0.5 rounded bg-amber-500/20 text-amber-400">
            <Timer className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-amber-200 tracking-wide">
            Macrotask Queue
          </span>
          <span
            title="setTimeout va setInterval callbacklari navbati. Har bir aylanmada faqat bitta macrotask olinadi va yana Microtasklar tekshiriladi!"
            className="text-[9px] uppercase font-semibold text-amber-400 bg-amber-900/50 px-1 py-0.2 rounded border border-amber-700/50 cursor-help"
          >
            Har Tsiklda 1 ta
          </span>
        </div>

        <span className="text-[10px] font-mono text-amber-300 font-semibold">
          {queue.length} navbatda
        </span>
      </div>

      {/* Queue Body */}
      <div className="flex-1 min-h-0 p-2 overflow-y-auto flex flex-col gap-1.5 bg-gradient-to-b from-slate-900 to-slate-950">
        {queue.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 p-2 border border-dashed border-slate-800 rounded-lg">
            <Timer className="w-6 h-6 text-slate-600 mb-1 opacity-60" />
            <p className="text-[11px] font-semibold text-slate-400">Macrotask navbati bo‘sh</p>
          </div>
        ) : (
          queue.map((task, idx) => {
            const isFirst = idx === 0;
            return (
              <div
                key={task.id}
                className={`p-2 rounded-lg border transition-all ${
                  isFirst
                    ? 'bg-amber-900/30 border-amber-500 text-amber-100 ring-1 ring-amber-500/30'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 mb-0.5">
                  <div className="flex items-center gap-1 truncate">
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-950 px-1 rounded border border-amber-800">
                      #{idx + 1}
                    </span>
                    <span className="font-mono text-xs font-bold text-white truncate">
                      {task.name}
                    </span>
                  </div>

                  {task.originLine !== null && (
                    <span className="text-[9px] font-mono bg-amber-950/80 text-amber-300 px-1 py-0.2 rounded border border-amber-800/60">
                      Q{task.originLine}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[10px] text-slate-300">
                  <span className="text-slate-400">Manba:</span>
                  <span className="font-mono text-amber-300">{task.source}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
