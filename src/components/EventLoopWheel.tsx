import React from 'react';
import { RefreshCw, CheckCircle, ArrowRightCircle } from 'lucide-react';
import type { EventLoopPhase } from '../types/simulation';


interface EventLoopWheelProps {
  phase: EventLoopPhase;
  phaseTitle: string;
  phaseDescription: string;
}

export const EventLoopWheel: React.FC<EventLoopWheelProps> = ({
  phase,
  phaseTitle,
  phaseDescription,
}) => {
  const getPhaseColor = () => {
    switch (phase) {
      case 'SYNC_EXECUTION':
        return {
          border: 'border-blue-500',
          bg: 'bg-blue-500/10',
          text: 'text-blue-400',
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          indicator: 'Call Stack Band',
        };
      case 'CHECK_STACK':
        return {
          border: 'border-cyan-500',
          bg: 'bg-cyan-500/10',
          text: 'text-cyan-400',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
          indicator: 'Stack Bo‘shatildi',
        };
      case 'CHECK_MICROTASKS':
      case 'EXECUTE_MICROTASK':
        return {
          border: 'border-emerald-500',
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          indicator: 'Microtask Qayta Ishlash',
        };
      case 'CHECK_MACROTASKS':
      case 'EXECUTE_MACROTASK':
        return {
          border: 'border-amber-500',
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          indicator: 'Macrotask Qayta Ishlash',
        };
      case 'COMPLETED':
        return {
          border: 'border-teal-500',
          bg: 'bg-teal-500/10',
          text: 'text-teal-400',
          badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
          indicator: 'Idle (Tinch holat)',
        };
      default:
        return {
          border: 'border-slate-600',
          bg: 'bg-slate-850',
          text: 'text-slate-400',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          indicator: 'Kutish',
        };
    }
  };

  const theme = getPhaseColor();
  const isSpinning = phase !== 'COMPLETED';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Central Visual Orb */}
      <div className="flex items-center gap-3.5">
        <div className="relative flex items-center justify-center">
          {/* Animated Glow Halo */}
          <div
            className={`w-14 h-14 rounded-full border-2 ${theme.border} ${theme.bg} flex items-center justify-center transition-colors duration-300 ${
              isSpinning ? 'animate-pulse-glow shadow-lg' : ''
            }`}
          >
            {phase === 'COMPLETED' ? (
              <CheckCircle className="w-7 h-7 text-teal-400" />
            ) : (
              <RefreshCw
                className={`w-7 h-7 ${theme.text} ${isSpinning ? 'animate-spin-slow' : ''}`}
              />
            )}
          </div>
        </div>

        {/* Phase Details */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
              Event Loop Holati:
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${theme.badge}`}
            >
              {theme.indicator}
            </span>
          </div>
          <h2 className="text-sm font-bold text-white mt-0.5 tracking-tight">
            {phaseTitle}
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mt-0.5 leading-snug">
            {phaseDescription}
          </p>
        </div>
      </div>

      {/* Decision Summary Pill */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
        <ArrowRightCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <div>
          <span className="font-semibold text-white">Prinsip:</span> Stack bo‘sh bo‘lsa → Microtasklar to‘liq → 1 ta Macrotask
        </div>
      </div>
    </div>
  );
};
