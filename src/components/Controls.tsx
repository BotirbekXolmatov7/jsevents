import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import type { EventLoopPhase } from '../types/simulation';

interface ControlsProps {
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onPreviousStep: () => void;
  onNextStep: () => void;
  onRestart: () => void;
  onSelectStep: (stepIndex: number) => void;
  onChangeSpeed: (speed: number) => void;
  phase?: EventLoopPhase;
  phaseTitle?: string;
}

export const Controls: React.FC<ControlsProps> = ({
  currentStepIndex,
  totalSteps,
  isPlaying,
  speed,
  onPlay,
  onPause,
  onPreviousStep,
  onNextStep,
  onRestart,
  onSelectStep,
  onChangeSpeed,
  phase = 'SYNC_EXECUTION',
  phaseTitle = 'Sinxron Kod Bajarilmoqda',
}) => {
  const isAtStart = currentStepIndex <= 1;
  const isAtEnd = currentStepIndex >= totalSteps;

  const getPhaseTheme = () => {
    switch (phase) {
      case 'SYNC_EXECUTION':
        return {
          border: 'border-blue-500/40',
          bg: 'bg-blue-500/10',
          text: 'text-blue-400',
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          label: 'Call Stack Band',
        };
      case 'CHECK_STACK':
        return {
          border: 'border-cyan-500/40',
          bg: 'bg-cyan-500/10',
          text: 'text-cyan-400',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
          label: 'Stack Bo‘sh',
        };
      case 'CHECK_MICROTASKS':
      case 'EXECUTE_MICROTASK':
        return {
          border: 'border-emerald-500/40',
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          label: 'Microtask Ijrosi',
        };
      case 'CHECK_MACROTASKS':
      case 'EXECUTE_MACROTASK':
        return {
          border: 'border-amber-500/40',
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          label: 'Macrotask Ijrosi',
        };
      case 'COMPLETED':
        return {
          border: 'border-teal-500/40',
          bg: 'bg-teal-500/10',
          text: 'text-teal-400',
          badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
          label: 'Tinch (Idle)',
        };
      default:
        return {
          border: 'border-slate-700',
          bg: 'bg-slate-800',
          text: 'text-slate-400',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          label: 'Kutish',
        };
    }
  };

  const theme = getPhaseTheme();
  const isSpinning = phase !== 'COMPLETED';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 shadow-md flex-shrink-0 flex flex-wrap items-center justify-between gap-2">
      {/* 1. Playback Controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onRestart}
          title="Qaytadan boshlash (R)"
          aria-label="Qaytadan boshlash"
          className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 active:scale-95 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onPreviousStep}
          disabled={isAtStart}
          title="Oldingi qadam (←)"
          aria-label="Oldingi qadam"
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200 border border-slate-700 active:scale-95 transition text-[11px] font-medium"
        >
          <SkipBack className="w-3 h-3" />
          <span className="hidden sm:inline">Oldingi</span>
        </button>

        {isPlaying ? (
          <button
            onClick={onPause}
            title="Pauza (Space)"
            aria-label="Pauza"
            className="flex items-center gap-1 px-3 py-1 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] shadow-sm active:scale-95 transition"
          >
            <Pause className="w-3 h-3 fill-current" />
            <span>Pauza</span>
          </button>
        ) : (
          <button
            onClick={onPlay}
            disabled={isAtEnd}
            title="Avto ijro (Space)"
            aria-label="Ijro etish"
            className="flex items-center gap-1 px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-[11px] shadow-sm active:scale-95 transition"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{isAtEnd ? 'Tugagan' : 'Auto Play'}</span>
          </button>
        )}

        <button
          onClick={onNextStep}
          disabled={isAtEnd}
          title="Keyingi qadam (→)"
          aria-label="Keyingi qadam"
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200 border border-slate-700 active:scale-95 transition text-[11px] font-medium"
        >
          <span className="hidden sm:inline">Keyingi</span>
          <SkipForward className="w-3 h-3" />
        </button>

        {/* Step indicator */}
        <div className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono font-medium text-slate-300 border border-slate-700/80">
          <span className="text-blue-400 font-bold">{currentStepIndex}</span>/{totalSteps}
        </div>
      </div>

      {/* 2. Timeline scrubber slider */}
      <div className="flex-1 min-w-[120px] max-w-[280px] flex items-center gap-2">
        <input
          type="range"
          min={1}
          max={Math.max(1, totalSteps)}
          value={currentStepIndex}
          onChange={(e) => onSelectStep(parseInt(e.target.value, 10))}
          aria-label="Qadamlar timeline"
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
        />
      </div>

      {/* 3. Speed Controls */}
      <div className="flex items-center gap-0.5 bg-slate-850 p-0.5 rounded border border-slate-800">
        {[0.5, 1, 1.5, 2].map((s) => (
          <button
            key={s}
            onClick={() => onChangeSpeed(s)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
              speed === s
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* 4. Event Loop Status Pill */}
      <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border ${theme.border} ${theme.bg}`}>
        {phase === 'COMPLETED' ? (
          <CheckCircle className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
        ) : (
          <RefreshCw
            className={`w-3.5 h-3.5 ${theme.text} flex-shrink-0 ${isSpinning ? 'animate-spin-slow' : ''}`}
          />
        )}
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hidden md:inline">
          Event Loop:
        </span>
        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${theme.badge}`}>
          {theme.label}
        </span>
        <span className="text-[11px] font-semibold text-slate-200 max-w-[150px] sm:max-w-[200px] truncate">
          {phaseTitle}
        </span>
      </div>
    </div>
  );
};

