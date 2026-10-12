import React from 'react';
import {
  HelpCircle,
  Code,
  Layers,
  Compass,
  ArrowRightCircle,
  Tag,
} from 'lucide-react';
import type { StepExplanation } from '../types/simulation';


interface StepExplanationCardProps {
  explanation: StepExplanation;
  actionBadge?: {
    type: 'stack' | 'webapi' | 'microtask' | 'macrotask' | 'loop' | 'console';
    text: string;
  };
}

export const StepExplanationCard: React.FC<StepExplanationCardProps> = ({
  explanation,
  actionBadge,
}) => {
  const getBadgeStyle = (type?: string) => {
    switch (type) {
      case 'stack':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'webapi':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'microtask':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'macrotask':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'console':
        return 'bg-slate-700/50 text-slate-200 border-slate-600';
      default:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 shadow-md flex-shrink-0 flex flex-col gap-1.5">
      {/* Title & Badge in 1 compact line */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 truncate">
          <HelpCircle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <h2 className="text-xs font-bold text-white tracking-tight truncate">
            {explanation.summary}
          </h2>
        </div>

        {actionBadge && (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 flex-shrink-0 ${getBadgeStyle(
              actionBadge.type
            )}`}
          >
            <Tag className="w-2.5 h-2.5" />
            {actionBadge.text}
          </span>
        )}
      </div>

      {/* 4 Core Educational Explanations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
        {/* 1. Hozir nima sodir bo'ldi? */}
        <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-800/80 flex flex-col gap-0.5">
          <div className="flex items-center justify-between text-blue-400 font-semibold text-[10px]">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 flex-shrink-0" />
              1. Hozirgi amal
            </span>
            {explanation.codeLine !== null && (
              <span className="text-slate-400 font-mono text-[9px] flex items-center gap-0.5">
                <Code className="w-2.5 h-2.5" /> Q{explanation.codeLine}
              </span>
            )}
          </div>
          <p className="text-slate-300 leading-snug line-clamp-2">
            {explanation.currentAction}
          </p>
        </div>

        {/* 2. Nima sababdan ushbu queue'ga tushdi? */}
        <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-800/80 flex flex-col gap-0.5">
          <div className="text-purple-400 font-semibold text-[10px] flex items-center gap-1">
            <Layers className="w-3 h-3 flex-shrink-0" />
            2. Nega bu navbatda?
          </div>
          <p className="text-slate-300 leading-snug line-clamp-2">
            {explanation.queueReason}
          </p>
        </div>

        {/* 3. Event Loop qarori */}
        <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-800/80 flex flex-col gap-0.5">
          <div className="text-amber-400 font-semibold text-[10px] flex items-center gap-1">
            <Compass className="w-3 h-3 flex-shrink-0" />
            3. Event Loop qarori
          </div>
          <p className="text-slate-300 leading-snug line-clamp-2">
            {explanation.eventLoopDecision}
          </p>
        </div>

        {/* 4. Keyingi qadam */}
        <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-800/80 flex flex-col gap-0.5">
          <div className="text-emerald-400 font-semibold text-[10px] flex items-center gap-1">
            <ArrowRightCircle className="w-3 h-3 flex-shrink-0" />
            4. Keyingi qadam
          </div>
          <p className="text-slate-300 leading-snug line-clamp-2">
            {explanation.nextStepPreview}
          </p>
        </div>
      </div>
    </div>
  );
};
