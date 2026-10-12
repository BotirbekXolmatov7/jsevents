import { describe, it, expect } from 'vitest';
import { simulateJavaScript } from '../engine/interpreter';
import { PRESETS } from '../engine/presets';

describe('Event Loop Simulation Engine', () => {
  it('correctly executes simple synchronous code in order', () => {
    const code = `
      console.log("Start");
      console.log("End");
    `;
    const result = simulateJavaScript(code);
    expect(result.error).toBeUndefined();
    expect(result.steps.length).toBeGreaterThan(0);

    const finalLogs = result.steps[result.steps.length - 1].consoleLogs.map((l) => l.value);
    expect(finalLogs).toEqual(['Start', 'End']);
  });

  it('correctly prioritizes Promise microtasks over setTimeout macrotasks', () => {
    const code = `
      console.log("1");
      setTimeout(() => {
        console.log("2");
      }, 0);
      Promise.resolve().then(() => {
        console.log("3");
      });
      console.log("4");
    `;
    const result = simulateJavaScript(code);
    expect(result.error).toBeUndefined();

    const finalLogs = result.steps[result.steps.length - 1].consoleLogs.map((l) => l.value);
    expect(finalLogs).toEqual(['1', '4', '3', '2']);
  });

  it('handles async/await continuation as microtask', () => {
    const code = `
      console.log("1");
      async function test() {
        console.log("2");
        await Promise.resolve();
        console.log("3");
      }
      test();
      console.log("4");
    `;
    const result = simulateJavaScript(code);
    expect(result.error).toBeUndefined();

    const finalLogs = result.steps[result.steps.length - 1].consoleLogs.map((l) => l.value);
    expect(finalLogs).toEqual(['1', '2', '4', '3']);
  });

  it('drains nested microtasks created inside a macrotask before the next macrotask', () => {
    const code = `
      console.log("Start");
      setTimeout(() => {
        console.log("Timeout 1");
        Promise.resolve().then(() => {
          console.log("Nested Microtask");
        });
      }, 0);
      setTimeout(() => {
        console.log("Timeout 2");
      }, 0);
      Promise.resolve().then(() => {
        console.log("Initial Microtask");
      });
      console.log("End");
    `;
    const result = simulateJavaScript(code);
    expect(result.error).toBeUndefined();

    const finalLogs = result.steps[result.steps.length - 1].consoleLogs.map((l) => l.value);
    expect(finalLogs).toEqual([
      'Start',
      'End',
      'Initial Microtask',
      'Timeout 1',
      'Nested Microtask',
      'Timeout 2',
    ]);
  });

  it('handles all pre-defined presets without syntax or simulation error', () => {
    for (const preset of PRESETS) {
      const result = simulateJavaScript(preset.code);
      expect(result.error).toBeUndefined();
      expect(result.steps.length).toBeGreaterThan(0);
      const lastStep = result.steps[result.steps.length - 1];
      expect(lastStep.phase).toBe('COMPLETED');
      expect(lastStep.callStack.length).toBe(0);
      expect(lastStep.microtaskQueue.length).toBe(0);
      expect(lastStep.macrotaskQueue.length).toBe(0);
    }
  });

  it('produces deterministic snapshots that allow time-travel scrubbing', () => {
    const code = `
      console.log("A");
      setTimeout(() => { console.log("B"); }, 0);
      Promise.resolve().then(() => { console.log("C"); });
    `;
    const result = simulateJavaScript(code);
    const steps = result.steps;

    // Verify stepIndex monotonically increases
    for (let i = 0; i < steps.length; i++) {
      expect(steps[i].stepIndex).toBe(i + 1);
    }

    // Check that earlier snapshot doesn't mutate when inspecting later snapshot
    const midStepIndex = Math.floor(steps.length / 2);
    const midStep = steps[midStepIndex];
    const lastStep = steps[steps.length - 1];

    expect(midStep.consoleLogs.length).toBeLessThanOrEqual(lastStep.consoleLogs.length);
  });

  it('correctly executes new Promise executor synchronously and then callback as microtask', () => {
    const code = `
      console.log("1");
      new Promise((resolve) => {
        console.log("2: executor sinxron");
        resolve();
      }).then(() => {
        console.log("4: then microtask");
      });
      console.log("3");
    `;
    const result = simulateJavaScript(code);
    expect(result.error).toBeUndefined();

    const finalLogs = result.steps[result.steps.length - 1].consoleLogs.map((l) => l.value);
    expect(finalLogs).toEqual(['1', '2: executor sinxron', '3', '4: then microtask']);
  });

  it('correctly handles queueMicrotask FIFO ordering with Promise.then', () => {
    const code = `
      queueMicrotask(() => {
        console.log("Microtask 1");
      });
      Promise.resolve().then(() => {
        console.log("Promise 1");
      });
      console.log("Sinxron");
    `;
    const result = simulateJavaScript(code);
    expect(result.error).toBeUndefined();

    const finalLogs = result.steps[result.steps.length - 1].consoleLogs.map((l) => l.value);
    expect(finalLogs).toEqual(['Sinxron', 'Microtask 1', 'Promise 1']);
  });

  it('handles multiple sequential awaits in an async function', () => {
    const code = `
      console.log("Start");
      async function run() {
        console.log("Before await 1");
        await Promise.resolve();
        console.log("Between awaits");
        await Promise.resolve();
        console.log("After await 2");
      }
      run();
      console.log("End");
    `;
    const result = simulateJavaScript(code);
    expect(result.error).toBeUndefined();

    const finalLogs = result.steps[result.steps.length - 1].consoleLogs.map((l) => l.value);
    expect(finalLogs).toEqual([
      'Start',
      'Before await 1',
      'End',
      'Between awaits',
      'After await 2',
    ]);
  });

  it('handles setInterval as a macrotask alongside setTimeout', () => {
    const code = `
      setInterval(() => {
        console.log("Interval task");
      }, 0);
      Promise.resolve().then(() => {
        console.log("Microtask");
      });
      console.log("Sync");
    `;
    const result = simulateJavaScript(code);
    expect(result.error).toBeUndefined();

    const finalLogs = result.steps[result.steps.length - 1].consoleLogs.map((l) => l.value);
    expect(finalLogs).toEqual(['Sync', 'Microtask', 'Interval task']);
  });
});
