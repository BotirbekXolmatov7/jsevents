export type EventLoopPhase =
  | 'SYNC_EXECUTION'
  | 'CHECK_STACK'
  | 'CHECK_MICROTASKS'
  | 'EXECUTE_MICROTASK'
  | 'CHECK_MACROTASKS'
  | 'EXECUTE_MACROTASK'
  | 'IDLE_WAIT'
  | 'COMPLETED';

export interface CallStackItem {
  id: string;
  name: string;
  line: number | null;
  description: string;
  isAsync?: boolean;
}

export interface WebApiItem {
  id: string;
  type: 'timer' | 'fetch' | 'microtask';
  name: string;
  timerMs?: number;
  remainingMs?: number;
  status: 'running' | 'completed';
  callbackName: string;
  detail: string;
}

export interface QueueItem {
  id: string;
  type: 'promise_callback' | 'async_continuation' | 'queueMicrotask' | 'timer_callback';
  name: string;
  originLine: number | null;
  source: string;
  status: 'waiting' | 'moving' | 'executing';
}

export interface ConsoleLogItem {
  id: string;
  value: string;
  type: 'log' | 'info' | 'warn' | 'error';
  line: number | null;
  stepIndex: number;
}

export interface StepExplanation {
  summary: string;
  currentAction: string;
  codeLine: number | null;
  queueReason: string;
  eventLoopDecision: string;
  nextStepPreview: string;
}

export interface SimulationStep {
  stepIndex: number;
  totalSteps?: number;
  activeLine: number | null;
  callStack: CallStackItem[];
  webApis: WebApiItem[];
  microtaskQueue: QueueItem[];
  macrotaskQueue: QueueItem[];
  consoleLogs: ConsoleLogItem[];
  phase: EventLoopPhase;
  phaseTitle: string;
  phaseDescription: string;
  explanation: StepExplanation;
  actionBadge?: {
    type: 'stack' | 'webapi' | 'microtask' | 'macrotask' | 'loop' | 'console';
    text: string;
  };
}

export interface PresetCode {
  id: string;
  title: string;
  description: string;
  difficulty: 'Oson' | 'O‘rta' | 'Qiyin';
  category: string;
  code: string;
}
