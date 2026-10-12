import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { CodeEditor } from './components/CodeEditor';
import { Controls } from './components/Controls';
import { CallStack } from './components/CallStack';
import { WebApis } from './components/WebApis';
import { MicrotaskQueue } from './components/MicrotaskQueue';
import { MacrotaskQueue } from './components/MacrotaskQueue';
import { ConsoleOutput } from './components/ConsoleOutput';
import { StepExplanationCard } from './components/StepExplanationCard';
import { RulesGuideModal } from './components/RulesGuideModal';
import { PRESETS } from './engine/presets';
import { simulateJavaScript } from './engine/interpreter';
import type { SimulationResult } from './engine/interpreter';
import type { SimulationStep } from './types/simulation';

export function App() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESETS[0].id);
  const [code, setCode] = useState<string>(PRESETS[0].code);
  const [simulation, setSimulation] = useState<SimulationResult>(() =>
    simulateJavaScript(PRESETS[0].code)
  );
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  const selectedPreset = PRESETS.find((p) => p.id === selectedPresetId);
  const isCodeModified = selectedPreset ? code !== selectedPreset.code : false;

  const totalSteps = simulation.steps.length;
  const currentStep: SimulationStep | undefined =
    simulation.steps[Math.max(0, Math.min(currentStepIndex - 1, totalSteps - 1))];

  // Run simulation on code
  const handleRunSimulation = useCallback((codeToRun = code) => {
    const result = simulateJavaScript(codeToRun);
    setSimulation(result);
    setCurrentStepIndex(1);
    setIsPlaying(false);
  }, [code]);

  // Handle preset selection
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setCode(preset.code);
      const result = simulateJavaScript(preset.code);
      setSimulation(result);
      setCurrentStepIndex(1);
      setIsPlaying(false);
    }
  };

  // Reset code to original preset
  const handleResetCode = () => {
    if (selectedPreset) {
      setCode(selectedPreset.code);
      const result = simulateJavaScript(selectedPreset.code);
      setSimulation(result);
      setCurrentStepIndex(1);
      setIsPlaying(false);
    }
  };

  // Step navigation
  const handleNextStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      if (prev < totalSteps) {
        return prev + 1;
      }
      setIsPlaying(false);
      return prev;
    });
  }, [totalSteps]);

  const handlePreviousStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(1, prev - 1));
  }, []);

  const handleRestart = useCallback(() => {
    setCurrentStepIndex(1);
    setIsPlaying(false);
  }, []);

  const handleSelectStep = useCallback((step: number) => {
    setCurrentStepIndex(step);
    setIsPlaying(false);
  }, []);

  // Auto-play interval
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.round(1000 / speed);
      playTimerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= totalSteps) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, speed, totalSteps]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing inside textarea or input
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextStep();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePreviousStep();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRestart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextStep, handlePreviousStep, handleRestart]);

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-white">
      {/* Top Header */}
      <Header
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        onOpenGuide={() => setIsGuideOpen(true)}
        onResetCode={handleResetCode}
        isModified={isCodeModified}
      />

      {/* Main Single-Window Container */}
      <main className="flex-1 min-h-0 w-full px-2.5 py-1.5 flex flex-col gap-1.5 overflow-hidden">
        {/* Controls Bar with Integrated Event Loop status */}
        <Controls
          currentStepIndex={currentStepIndex}
          totalSteps={totalSteps}
          isPlaying={isPlaying}
          speed={speed}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onPreviousStep={handlePreviousStep}
          onNextStep={handleNextStep}
          onRestart={handleRestart}
          onSelectStep={handleSelectStep}
          onChangeSpeed={setSpeed}
          phase={currentStep?.phase || 'SYNC_EXECUTION'}
          phaseTitle={currentStep?.phaseTitle || 'Sinxron Kod Bajarilmoqda'}
        />

        {/* Compact Step Explanation Bar */}
        {currentStep && (
          <StepExplanationCard
            explanation={currentStep.explanation}
            actionBadge={currentStep.actionBadge}
          />
        )}

        {/* Visual Dashboard Grid - Perfectly fits remainder of window */}
        <div className="flex-1 min-h-0 grid grid-cols-12 gap-2 overflow-hidden">
          {/* Left Side: Code Editor (flex-1) & Console Output (compact) */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-2 min-h-0 h-full">
            <div className="flex-1 min-h-0">
              <CodeEditor
                code={code}
                onChangeCode={setCode}
                activeLine={currentStep?.activeLine ?? null}
                onRun={() => handleRunSimulation(code)}
                parseError={simulation.error}
                isSimulating={isPlaying}
              />
            </div>

            <div className="h-[135px] flex-shrink-0">
              <ConsoleOutput
                logs={currentStep?.consoleLogs || []}
                onClear={() => handleRestart()}
              />
            </div>
          </div>

          {/* Right Side: 4 Event Loop Queue Blocks (2x2 Grid) */}
          <div className="col-span-12 lg:col-span-7 grid grid-cols-2 grid-rows-2 gap-2 min-h-0 h-full">
            {/* 1. Call Stack (Blue) */}
            <div className="h-full min-h-0 overflow-hidden">
              <CallStack stack={currentStep?.callStack || []} />
            </div>

            {/* 2. Web APIs (Purple) */}
            <div className="h-full min-h-0 overflow-hidden">
              <WebApis items={currentStep?.webApis || []} />
            </div>

            {/* 3. Microtask Queue (Green) */}
            <div className="h-full min-h-0 overflow-hidden">
              <MicrotaskQueue queue={currentStep?.microtaskQueue || []} />
            </div>

            {/* 4. Macrotask Queue (Amber / Orange) */}
            <div className="h-full min-h-0 overflow-hidden">
              <MacrotaskQueue queue={currentStep?.macrotaskQueue || []} />
            </div>
          </div>
        </div>
      </main>

      {/* 8 Rules Educational Modal */}
      <RulesGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
export default App;
