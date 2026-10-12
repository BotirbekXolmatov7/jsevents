import * as acorn from 'acorn';
import type {
  CallStackItem,
  ConsoleLogItem,
  EventLoopPhase,
  QueueItem,
  SimulationStep,
  StepExplanation,
  WebApiItem,
} from '../types/simulation';

interface InternalQueueTask {
  item: QueueItem;
  execute: () => void;
  timerMs?: number;
}

export interface SimulationResult {
  steps: SimulationStep[];
  error?: string;
}

export function simulateJavaScript(code: string): SimulationResult {
  let ast: any;
  try {
    ast = acorn.parse(code, {
      ecmaVersion: 2022,
      locations: true,
      sourceType: 'script',
    });
  } catch (err: any) {
    return {
      steps: [],
      error: `Sintaktik xatolik (Qator ${err.loc?.line || '?'}, ustun ${err.loc?.column || '?'}): ${err.message}`,
    };
  }

  const steps: SimulationStep[] = [];

  let callStack: CallStackItem[] = [];
  let webApis: WebApiItem[] = [];
  let microtaskQueue: InternalQueueTask[] = [];
  let macrotaskQueue: InternalQueueTask[] = [];
  let consoleLogs: ConsoleLogItem[] = [];
  let stepCounter = 0;
  let currentExecutionContext: 'sync' | 'microtask' | 'macrotask' = 'sync';

  // Environment storage for variables and functions
  const scope: Record<string, any> = {};

  function cloneCallStack(): CallStackItem[] {
    return callStack.map((f) => ({ ...f }));
  }
  function cloneWebApis(): WebApiItem[] {
    return webApis.map((w) => ({ ...w }));
  }
  function cloneMicrotasks(): QueueItem[] {
    return microtaskQueue.map((m) => ({ ...m.item }));
  }
  function cloneMacrotasks(): QueueItem[] {
    return macrotaskQueue.map((m) => ({ ...m.item }));
  }
  function cloneConsoleLogs(): ConsoleLogItem[] {
    return consoleLogs.map((c) => ({ ...c }));
  }

  function getBeginnerTip(phase: EventLoopPhase): string {
    switch (phase) {
      case 'SYNC_EXECUTION':
        return 'Sinxron kod har doim Call Stack’da darhol bajariladi. Bu vaqtda asinxron timer yoki Promiselar kutib turadi.';
      case 'CHECK_STACK':
        return 'Call Stack to‘liq bo‘shadi! Event Loop qoidasi: stack bo‘shashi bilan birinchi bo‘lib Microtasklar tekshiriladi.';
      case 'CHECK_MICROTASKS':
      case 'EXECUTE_MICROTASK':
        return 'Microtasklar (Promise, await, queueMicrotask) oliy ustuvorlikka ega. Barcha microtasklar tugamaguncha bitta ham timer ishlamaydi!';
      case 'CHECK_MACROTASKS':
      case 'EXECUTE_MACROTASK':
        return 'Timer callbacklari Macrotask hisoblanadi. Event Loop har aylanmada ulardan faqat 1 tasini oladi va yana Microtasklarni tekshiradi!';
      case 'COMPLETED':
        return 'Barcha sinxron va asinxron amallar muvaffaqiyatli yakunlandi. Dastur to‘xtadi.';
      default:
        return 'Event Loop navbatlarni tekshirishda davom etmoqda.';
    }
  }

  function recordStep(params: {
    activeLine: number | null;
    phase: EventLoopPhase;
    phaseTitle: string;
    phaseDescription: string;
    summary: string;
    currentAction: string;
    codeLine?: number | null;
    queueReason?: string;
    eventLoopDecision?: string;
    nextStepPreview?: string;
    beginnerTip?: string;
    actionBadge?: {
      type: 'stack' | 'webapi' | 'microtask' | 'macrotask' | 'loop' | 'console';
      text: string;
    };
  }) {
    stepCounter++;
    const explanation: StepExplanation = {
      summary: params.summary,
      currentAction: params.currentAction,
      codeLine: params.codeLine !== undefined ? params.codeLine : params.activeLine,
      queueReason:
        params.queueReason ||
        (params.phase === 'SYNC_EXECUTION'
          ? "Sinxron kod to‘g‘ridan-to‘g‘ri Call Stack’da ishlaydi, hech qanday navbatga tushmaydi."
          : "—"),
      eventLoopDecision:
        params.eventLoopDecision ||
        (params.phase === 'SYNC_EXECUTION'
          ? "Call Stack band bo‘lgani sababli Event Loop kutish holatida."
          : "Event Loop navbatdagi vazifani qidirmoqda."),
      nextStepPreview: params.nextStepPreview || 'Keyingi qator yoki vazifa tekshiriladi.',
      beginnerTip: params.beginnerTip || getBeginnerTip(params.phase),
    };

    steps.push({
      stepIndex: stepCounter,
      activeLine: params.activeLine,
      callStack: cloneCallStack(),
      webApis: cloneWebApis(),
      microtaskQueue: cloneMicrotasks(),
      macrotaskQueue: cloneMacrotasks(),
      consoleLogs: cloneConsoleLogs(),
      phase: params.phase,
      phaseTitle: params.phaseTitle,
      phaseDescription: params.phaseDescription,
      explanation,
      actionBadge: params.actionBadge,
    });
  }

  // Evaluate simple AST expressions
  function evaluateExpression(node: any, localScope = scope): any {
    if (!node) return undefined;
    switch (node.type) {
      case 'Literal':
        return node.value;
      case 'Identifier':
        return localScope[node.name] !== undefined ? localScope[node.name] : node.name;
      case 'BinaryExpression': {
        const left = evaluateExpression(node.left, localScope);
        const right = evaluateExpression(node.right, localScope);
        if (node.operator === '+') return left + right;
        if (node.operator === '-') return left - right;
        if (node.operator === '*') return left * right;
        if (node.operator === '/') return left / right;
        return left + right;
      }
      case 'TemplateLiteral': {
        let result = '';
        for (let i = 0; i < node.quasis.length; i++) {
          result += node.quasis[i].value.raw;
          if (i < node.expressions.length) {
            result += evaluateExpression(node.expressions[i], localScope);
          }
        }
        return result;
      }
      case 'MemberExpression': {
        const obj = evaluateExpression(node.object, localScope);
        const prop = node.property.name || node.property.value;
        if (obj && typeof obj === 'object') {
          return obj[prop];
        }
        return undefined;
      }
      default:
        return undefined;
    }
  }

  let nextTaskId = 1;

  // Execute a block of statements
  function executeStatements(statements: any[], localScope = scope) {
    for (const stmt of statements) {
      executeStatement(stmt, localScope);
    }
  }

  function executeStatement(stmt: any, localScope = scope) {
    if (!stmt) return;
    const line = stmt.loc?.start.line ?? null;

    if (stmt.type === 'VariableDeclaration') {
      for (const decl of stmt.declarations) {
        const varName = decl.id.name;
        if (decl.init) {
          if (
            decl.init.type === 'ArrowFunctionExpression' ||
            decl.init.type === 'FunctionExpression'
          ) {
            localScope[varName] = {
              type: 'function',
              name: varName,
              params: decl.init.params.map((p: any) => p.name),
              body: decl.init.body,
              isAsync: decl.init.async || false,
            };
          } else {
            localScope[varName] = evaluateExpression(decl.init, localScope);
          }
        }
      }
      recordStep({
        activeLine: line,
        phase: 'SYNC_EXECUTION',
        phaseTitle: 'Sinxron O‘zgaruvchi E’loni',
        phaseDescription: 'O‘zgaruvchi xotirada saqlandi.',
        summary: `O‘zgaruvchi e’lon qilindi (Qator ${line})`,
        currentAction: `O‘zgaruvchi e’loni bajarildi va xotiraga yozildi.`,
        actionBadge: { type: 'stack', text: 'Variable Declaration' },
      });
      return;
    }

    if (stmt.type === 'FunctionDeclaration') {
      const funcName = stmt.id.name;
      localScope[funcName] = {
        type: 'function',
        name: funcName,
        params: stmt.params.map((p: any) => p.name),
        body: stmt.body,
        isAsync: stmt.async || false,
      };
      recordStep({
        activeLine: line,
        phase: 'SYNC_EXECUTION',
        phaseTitle: 'Funksiya E’loni (Hoisting)',
        phaseDescription: `"${funcName}()" funksiyasi xotiraga yuklandi.`,
        summary: `Funksiya "${funcName}()" e’lon qilindi (Qator ${line})`,
        currentAction: `"${funcName}" funksiyasi e’lon qilindi va foydalanishga tayyorlandi.`,
        actionBadge: { type: 'stack', text: 'Function Declaration' },
      });
      return;
    }

    if (stmt.type === 'ExpressionStatement') {
      executeExpression(stmt.expression, line, localScope);
      return;
    }

    if (stmt.type === 'ReturnStatement') {
      recordStep({
        activeLine: line,
        phase: 'SYNC_EXECUTION',
        phaseTitle: 'Return Ifodasi',
        phaseDescription: 'Funksiya qiymat qaytardi.',
        summary: `Return bajarildi (Qator ${line})`,
        currentAction: 'Funksiya yakunlandi va natija qaytarildi.',
      });
      return;
    }
  }

  function executeExpression(expr: any, line: number | null, localScope = scope) {
    if (!expr) return;

    if (expr.type === 'CallExpression') {
      handleCallExpression(expr, line, localScope);
      return;
    }

    if (expr.type === 'NewExpression' && expr.callee?.name === 'Promise') {
      const executorArg = expr.arguments[0];
      const execLine = executorArg?.loc?.start.line ?? line;

      callStack.push({
        id: `stack-promise-new-${nextTaskId++}`,
        name: 'new Promise(executor)',
        line,
        description: 'Promise konstruktori sinxron tarzda executor funksiyasini chaqiradi',
      });

      recordStep({
        activeLine: line,
        phase: 'SYNC_EXECUTION',
        phaseTitle: 'Call Stack: new Promise()',
        phaseDescription: 'new Promise konstruktori chaqirildi va uning executori sinxron ishlaydi.',
        summary: `new Promise(executor) chaqirildi (Qator ${line})`,
        currentAction: 'Promise ichidagi executor funksiya sinxron tarzda darhol ijro etiladi.',
        actionBadge: { type: 'stack', text: 'new Promise()' },
      });

      if (executorArg) {
        executeCallbackNode(executorArg, execLine, 'Promise Executor', localScope);
      }

      callStack.pop();
      return;
    }
  }

  function handleCallExpression(call: any, line: number | null, localScope = scope) {
    const callee = call.callee;

    // 1. console.log / console.info / console.warn / console.error
    if (
      callee.type === 'MemberExpression' &&
      callee.object.type === 'Identifier' &&
      callee.object.name === 'console'
    ) {
      const method = callee.property.name || 'log';
      const argsValues = call.arguments.map((arg: any) => {
        const val = evaluateExpression(arg, localScope);
        return val !== undefined ? String(val) : 'undefined';
      });
      const outputText = argsValues.join(' ');

      const stackId = `stack-console-${Date.now()}-${Math.random()}`;
      callStack.push({
        id: stackId,
        name: `console.${method}()`,
        line,
        description: `Matn chiqarish: "${outputText}"`,
      });

      recordStep({
        activeLine: line,
        phase: 'SYNC_EXECUTION',
        phaseTitle: 'Call Stack: console.log()',
        phaseDescription: `console.${method}("${outputText}") Call Stack’ka kirdi.`,
        summary: `console.${method}("${outputText}") chaqirildi (Qator ${line})`,
        currentAction: `console.${method}() Call Stack’ka yuklandi. Argumentlar hisoblandi.`,
        actionBadge: { type: 'stack', text: `console.${method}()` },
      });

      consoleLogs.push({
        id: `log-${Date.now()}-${Math.random()}`,
        value: outputText,
        type: method as any,
        line,
        stepIndex: stepCounter + 1,
        originType: currentExecutionContext,
      });

      recordStep({
        activeLine: line,
        phase: 'SYNC_EXECUTION',
        phaseTitle: 'Console Chiqarish',
        phaseDescription: `"${outputText}" konsolga chop etildi.`,
        summary: `Konsolga yozildi: "${outputText}"`,
        currentAction: `Terminalda natija paydo bo‘ldi: "${outputText}".`,
        actionBadge: { type: 'console', text: `Console: "${outputText}"` },
      });

      callStack.pop();

      recordStep({
        activeLine: line,
        phase: 'SYNC_EXECUTION',
        phaseTitle: 'Call Stack: Pop',
        phaseDescription: `console.${method}() tugab, Call Stack’dan chiqdi.`,
        summary: `console.${method}() Call Stack’dan chiqdi`,
        currentAction: `Funksiya bajarilib bo‘ldi va Call Stack bo‘shatildi.`,
        actionBadge: { type: 'stack', text: 'Stack Pop' },
      });
      return;
    }

    // 2. setTimeout(callback, delay) & setInterval(callback, delay)
    if (
      callee.type === 'Identifier' &&
      (callee.name === 'setTimeout' || callee.name === 'setInterval')
    ) {
      const isInterval = callee.name === 'setInterval';
      const fnName = isInterval ? 'setInterval' : 'setTimeout';
      const cbArg = call.arguments[0];
      const delayArg = call.arguments[1];
      let delayMs = 0;
      if (delayArg) {
        const evaluated = evaluateExpression(delayArg, localScope);
        if (typeof evaluated === 'number') delayMs = evaluated;
      }

      const cbLine = cbArg?.loc?.start.line ?? line;
      const taskId = `task-timer-${nextTaskId++}`;
      const webApiId = `webapi-timer-${taskId}`;

      callStack.push({
        id: `stack-${taskId}`,
        name: `${fnName}(..., ${delayMs}ms)`,
        line,
        description: `Timer Web API’ga topshiriladi (${delayMs}ms)`,
      });

      recordStep({
        activeLine: line,
        phase: 'SYNC_EXECUTION',
        phaseTitle: `Call Stack: ${fnName}()`,
        phaseDescription: `${fnName}() chaqirildi va Web APIs moduliga uzatilmoqda.`,
        summary: `${fnName}(callback, ${delayMs}ms) Call Stack’ka tushdi (Qator ${line})`,
        currentAction: `Browser Web APIs timers bo‘limiga ${delayMs}ms kechikishli timer qo‘shilmoqda.`,
        actionBadge: { type: 'stack', text: `${fnName}(${delayMs}ms)` },
      });

      webApis.push({
        id: webApiId,
        type: 'timer',
        name: `${fnName} (${delayMs}ms)`,
        timerMs: delayMs,
        remainingMs: delayMs,
        status: 'running',
        callbackName: `${fnName} callback (${delayMs}ms)`,
        detail: `${delayMs}ms sanalmoqda... Vaqt tugagach Macrotask Queue’ga tushadi.`,
      });

      recordStep({
        activeLine: line,
        phase: 'SYNC_EXECUTION',
        phaseTitle: 'Web APIs: Timer Ro‘yxatga Olindi',
        phaseDescription: `Browser fonda timer hisoblashni boshladi (${delayMs}ms).`,
        summary: `Timer Web APIs’da ishga tushdi`,
        currentAction: `Web APIs ${delayMs}ms hisoblashni boshladi. Callback hali bajarilmaydi!`,
        queueReason: `${fnName} browser (Web API) mexanizmi bo‘lgani uchun fon rejimida vaqt sanaydi.`,
        actionBadge: { type: 'webapi', text: `Web APIs: Timer (${delayMs}ms)` },
      });

      callStack.pop();

      recordStep({
        activeLine: line,
        phase: 'SYNC_EXECUTION',
        phaseTitle: `Call Stack: ${fnName}() Pop`,
        phaseDescription: `${fnName}() qaytdi va Call Stack’dan chiqdi.`,
        summary: `${fnName}() Call Stack’dan chiqdi`,
        currentAction: `Sinxron ${fnName} chaqiruvi yakunlandi. Asosiy oqim to‘xtab qolmaydi.`,
        actionBadge: { type: 'stack', text: 'Stack Pop' },
      });

      // Timer completes in Web API and callback moves to Macrotask Queue
      const targetApi = webApis.find((w) => w.id === webApiId);
      if (targetApi) {
        targetApi.status = 'completed';
        targetApi.detail = 'Vaqt tugadi! Callback Macrotask Queue’ga uzatildi.';
      }

      const queueItem: QueueItem = {
        id: taskId,
        type: 'timer_callback',
        name: `${fnName} Callback (${delayMs}ms)`,
        originLine: cbLine,
        source: `${fnName} (${delayMs}ms)`,
        status: 'waiting',
      };

      const executeCallback = () => {
        executeCallbackNode(cbArg, cbLine, `${fnName} Callback (${delayMs}ms)`, localScope);
      };

      macrotaskQueue.push({
        item: queueItem,
        execute: executeCallback,
        timerMs: delayMs,
      });

      // Remove from Web APIs
      webApis = webApis.filter((w) => w.id !== webApiId);

      recordStep({
        activeLine: cbLine,
        phase: 'SYNC_EXECUTION',
        phaseTitle: 'Macrotask Queue: Callback Qo‘shildi',
        phaseDescription: `Timer tugadi. Uning callbacki Macrotask Queue’ga joylashtirildi.`,
        summary: `Timer callback Macrotask Queue’ga tushdi`,
        currentAction: `Web APIs timer hisoblab bo‘ldi va uning callbackini Macrotask (Callback) Queue’ga uzatdi.`,
        queueReason:
          'setTimeout va setInterval callbacklari qoidaga ko‘ra har doim Macrotask Queue’ga tushadi.',
        eventLoopDecision:
          'Macrotask darhol bajarilmaydi. Call Stack va barcha Microtasklar tugashini kutadi.',
        actionBadge: { type: 'macrotask', text: 'Macrotask Enqueued' },
      });
      return;
    }

    // 3. queueMicrotask(callback)
    if (callee.type === 'Identifier' && callee.name === 'queueMicrotask') {
      const cbArg = call.arguments[0];
      const cbLine = cbArg?.loc?.start.line ?? line;
      const taskId = `task-micro-${nextTaskId++}`;

      callStack.push({
        id: `stack-${taskId}`,
        name: `queueMicrotask(...)`,
        line,
        description: `Microtask to‘g‘ridan-to‘g‘ri Microtask Queue’ga yuborilmoqda`,
      });

      recordStep({
        activeLine: line,
        phase: 'SYNC_EXECUTION',
        phaseTitle: 'Call Stack: queueMicrotask()',
        phaseDescription: 'queueMicrotask() Call Stack’ka kirdi.',
        summary: `queueMicrotask() chaqirildi (Qator ${line})`,
        currentAction: 'queueMicrotask() chaqiruvi bajarilmoqda.',
        actionBadge: { type: 'stack', text: 'queueMicrotask()' },
      });

      const queueItem: QueueItem = {
        id: taskId,
        type: 'queueMicrotask',
        name: 'queueMicrotask Callback',
        originLine: cbLine,
        source: 'queueMicrotask()',
        status: 'waiting',
      };

      const executeCallback = () => {
        executeCallbackNode(cbArg, cbLine, 'queueMicrotask Callback', localScope);
      };

      microtaskQueue.push({
        item: queueItem,
        execute: executeCallback,
      });

      recordStep({
        activeLine: cbLine,
        phase: 'SYNC_EXECUTION',
        phaseTitle: 'Microtask Queue: Vazifa Qo‘shildi',
        phaseDescription: 'Callback Microtask Queue’ga muvaffaqiyatli joylashtirildi.',
        summary: `Microtask navbatga qo‘shildi`,
        currentAction: 'queueMicrotask orqali Microtask Queue’ga yangi yuqori ustuvorlikdagi vazifa tushdi.',
        queueReason:
          'queueMicrotask() funksiyasi vazifalarni to‘g‘ridan-to‘g‘ri Microtask Queue’ga qo‘shish uchun maxsus yaratilgan.',
        actionBadge: { type: 'microtask', text: 'Microtask Enqueued' },
      });

      callStack.pop();

      recordStep({
        activeLine: line,
        phase: 'SYNC_EXECUTION',
        phaseTitle: 'Call Stack: Pop',
        phaseDescription: 'queueMicrotask() bajarilib bo‘ldi.',
        summary: 'queueMicrotask() Call Stack’dan chiqdi',
        currentAction: 'Call Stack bo‘shatildi, sinxron ijro davom etadi.',
        actionBadge: { type: 'stack', text: 'Stack Pop' },
      });
      return;
    }

    // 4. Promise.resolve(...).then(...) / new Promise(...).then(...) / Promise chaining
    if (
      callee.type === 'MemberExpression' &&
      (callee.property.name === 'then' ||
        callee.property.name === 'catch' ||
        callee.property.name === 'finally')
    ) {
      handlePromiseThenChain(call, line, localScope);
      return;
    }

    // 5. User-defined function call or async function call
    if (callee.type === 'Identifier') {
      const funcName = callee.name;
      const fnDef = localScope[funcName];

      if (fnDef && fnDef.type === 'function') {
        const stackId = `stack-fn-${funcName}-${nextTaskId++}`;
        const newLocalScope: Record<string, any> = { ...localScope };

        // Bind parameters
        if (fnDef.params) {
          for (let i = 0; i < fnDef.params.length; i++) {
            const pName = fnDef.params[i];
            const argNode = call.arguments[i];
            newLocalScope[pName] = evaluateExpression(argNode, localScope);
          }
        }

        callStack.push({
          id: stackId,
          name: `${funcName}()`,
          line,
          description: fnDef.isAsync ? 'Asinxron funksiya bajarilmoqda' : 'Funksiya chaqiruvi',
          isAsync: fnDef.isAsync,
        });

        recordStep({
          activeLine: line,
          phase: 'SYNC_EXECUTION',
          phaseTitle: `Call Stack: ${funcName}()`,
          phaseDescription: `"${funcName}()" chaqirildi va Call Stack’ning yuqorisiga joylashtirildi.`,
          summary: `${funcName}() chaqirildi (Qator ${line})`,
          currentAction: `Funksiya Call Stack’ka kirdi va uning ichki qismini bajarish boshlanadi.`,
          actionBadge: { type: 'stack', text: `${funcName}() Push` },
        });

        if (fnDef.body) {
          if (fnDef.isAsync) {
            handleAsyncFunctionBody(fnDef.body, funcName, line, newLocalScope);
          } else if (fnDef.body.type === 'BlockStatement') {
            executeStatements(fnDef.body.body, newLocalScope);
          } else {
            executeExpression(fnDef.body, line, newLocalScope);
          }
        }

        // Pop function if it wasn't already suspended
        if (callStack.some((f) => f.id === stackId)) {
          callStack = callStack.filter((f) => f.id !== stackId);
          recordStep({
            activeLine: line,
            phase: 'SYNC_EXECUTION',
            phaseTitle: `Call Stack: ${funcName}() Pop`,
            phaseDescription: `"${funcName}()" o‘z ishini yakunladi va Call Stack’dan chiqdi.`,
            summary: `${funcName}() Call Stack’dan chiqdi`,
            currentAction: `Funksiya doirasidagi amallar tugadi.`,
            actionBadge: { type: 'stack', text: `${funcName}() Pop` },
          });
        }
        return;
      }
    }
  }

  // Handle Promise chaining (resolve / reject / new Promise)
  function handlePromiseThenChain(call: any, line: number | null, localScope = scope) {
    const thenCalls: any[] = [];
    let curr = call;

    while (
      curr &&
      curr.type === 'CallExpression' &&
      curr.callee?.type === 'MemberExpression' &&
      (curr.callee.property.name === 'then' ||
        curr.callee.property.name === 'catch' ||
        curr.callee.property.name === 'finally')
    ) {
      thenCalls.unshift(curr);
      curr = curr.callee.object;
    }

    // Initial Promise expression: e.g. Promise.resolve() or new Promise(...)
    const promiseObj = curr;
    const promiseLine = promiseObj?.loc?.start.line ?? line;

    if (promiseObj?.type === 'NewExpression' && promiseObj.callee?.name === 'Promise') {
      const executorArg = promiseObj.arguments[0];
      const execLine = executorArg?.loc?.start.line ?? promiseLine;

      callStack.push({
        id: `stack-promise-new-${nextTaskId++}`,
        name: 'new Promise(executor)',
        line: promiseLine,
        description: 'Promise konstruktori sinxron tarzda executor funksiyasini chaqiradi',
      });

      recordStep({
        activeLine: promiseLine,
        phase: 'SYNC_EXECUTION',
        phaseTitle: 'Call Stack: new Promise()',
        phaseDescription: 'new Promise konstruktori chaqirildi va uning executori sinxron ishlaydi.',
        summary: `new Promise(executor) chaqirildi (Qator ${promiseLine})`,
        currentAction: 'Muhim qoida: Promise executori sinxron tarzda darhol ijro etiladi!',
        actionBadge: { type: 'stack', text: 'new Promise()' },
      });

      if (executorArg) {
        executeCallbackNode(executorArg, execLine, 'Promise Executor', localScope);
      }

      callStack.pop();

      recordStep({
        activeLine: promiseLine,
        phase: 'SYNC_EXECUTION',
        phaseTitle: 'Call Stack: new Promise() Pop',
        phaseDescription: 'new Promise() konstruktori executor yakunlangach Stack’dan chiqdi.',
        summary: 'new Promise() yakunlandi',
        currentAction: 'Sinxron executor tugadi. Endi uning zanjirlangan callbacklari Microtask Queue’ga qo‘yiladi.',
        actionBadge: { type: 'stack', text: 'Stack Pop' },
      });
    } else {
      callStack.push({
        id: `stack-promise-res-${nextTaskId++}`,
        name: 'Promise.resolve()',
        line: promiseLine,
        description: 'Promise darhol muvaffaqiyatli (fulfilled) holatga keltirildi',
      });

      recordStep({
        activeLine: promiseLine,
        phase: 'SYNC_EXECUTION',
        phaseTitle: 'Call Stack: Promise.resolve()',
        phaseDescription: 'Promise darhol yechildi (resolved).',
        summary: `Promise.resolve() chaqirildi (Qator ${promiseLine})`,
        currentAction: 'Promise sinxron tarzda darhol bajarildi (fulfilled bo‘ldi).',
        actionBadge: { type: 'stack', text: 'Promise.resolve()' },
      });

      callStack.pop();

      recordStep({
        activeLine: promiseLine,
        phase: 'SYNC_EXECUTION',
        phaseTitle: 'Call Stack: Pop',
        phaseDescription: 'Promise.resolve() Call Stack’dan chiqdi.',
        summary: 'Promise.resolve() tugadi',
        currentAction: 'Endi zanjirlangan handlerlar ro‘yxatga olinadi.',
        actionBadge: { type: 'stack', text: 'Stack Pop' },
      });
    }

    // Schedule the first .then() callback as a Microtask!
    if (thenCalls.length > 0) {
      scheduleThenCallback(thenCalls, 0, localScope);
    }
  }

  function scheduleThenCallback(thenCalls: any[], index: number, localScope = scope) {
    if (index >= thenCalls.length) return;
    const callNode = thenCalls[index];
    const cbArg = callNode.arguments[0];
    const cbLine = cbArg?.loc?.start.line ?? callNode.loc?.start.line;
    const taskId = `task-promise-${nextTaskId++}`;
    const methodProp = callNode.callee?.property?.name || 'then';
    const stepLabel = `Promise.${methodProp} Callback ${index + 1}`;

    const queueItem: QueueItem = {
      id: taskId,
      type: 'promise_callback',
      name: stepLabel,
      originLine: cbLine,
      source: index === 0 ? 'Promise zanjiri' : 'Oldingi Promise zanjiri',
      status: 'waiting',
    };

    const executeCallback = () => {
      executeCallbackNode(cbArg, cbLine, stepLabel, localScope);
      // Chained .then
      if (index + 1 < thenCalls.length) {
        scheduleThenCallback(thenCalls, index + 1, localScope);
      }
    };

    microtaskQueue.push({
      item: queueItem,
      execute: executeCallback,
    });

    recordStep({
      activeLine: cbLine,
      phase: 'SYNC_EXECUTION',
      phaseTitle: 'Microtask Queue: Promise Callback',
      phaseDescription: `"${stepLabel}" Microtask Queue’ga qo‘shildi.`,
      summary: `${stepLabel} Microtask Queue’ga tushdi (Qator ${cbLine})`,
      currentAction: `Promise yechilgani sababli uning .then() callbacki Microtask Queue’ga kiritildi.`,
      queueReason:
        'JavaScript spetsifikatsiyasiga ko‘ra, barcha Promise reaksiyalari (.then/.catch) Microtask hisoblanadi.',
      eventLoopDecision:
        'Sinxron kod tugagach, Event Loop birinchi bo‘lib Microtask Queue’ni to‘liq bo‘shatadi.',
      actionBadge: { type: 'microtask', text: 'Promise Microtask Enqueued' },
    });
  }

  // Handle async function body with await
  function handleAsyncFunctionBody(
    bodyNode: any,
    funcName: string,
    originLine: number | null,
    localScope = scope
  ) {
    const stmts: any[] = bodyNode.type === 'BlockStatement' ? bodyNode.body : [bodyNode];
    const awaitIndex = stmts.findIndex(
      (s) =>
        (s.type === 'ExpressionStatement' && s.expression?.type === 'AwaitExpression') ||
        (s.type === 'VariableDeclaration' &&
          s.declarations?.some((d: any) => d.init?.type === 'AwaitExpression'))
    );

    if (awaitIndex === -1) {
      executeStatements(stmts, localScope);
      return;
    }

    // Execute synchronous statements up to await
    const beforeAwait = stmts.slice(0, awaitIndex);
    executeStatements(beforeAwait, localScope);

    // Now handle await
    const awaitStmt = stmts[awaitIndex];
    const awaitLine = awaitStmt.loc?.start.line ?? originLine;

    recordStep({
      activeLine: awaitLine,
      phase: 'SYNC_EXECUTION',
      phaseTitle: `Call Stack: await Promise`,
      phaseDescription: `await kutish operatori duch keldi. "${funcName}()" pauza qilinadi.`,
      summary: `await bajarildi (Qator ${awaitLine})`,
      currentAction: `await ifodasi Promise yechilishini kutmoqda. Async funksiya vaqtincha to‘xtatiladi va Call Stack’dan chiqadi.`,
      queueReason: 'await dan keyingi qism avtomatik ravishda Promise Microtask sifatida rejalashtiriladi.',
      actionBadge: { type: 'stack', text: 'await Suspended' },
    });

    // Pop the async function from Call Stack
    callStack = callStack.filter((f) => !f.name.includes(funcName));

    recordStep({
      activeLine: awaitLine,
      phase: 'SYNC_EXECUTION',
      phaseTitle: `Call Stack: ${funcName}() To‘xtatildi`,
      phaseDescription: `"${funcName}()" asinxron kutish holatiga o‘tdi va Stack bo‘shadi.`,
      summary: `${funcName}() Call Stack’dan chiqdi (pauza)`,
      currentAction: `Sinxron oqim davom etishi uchun Call Stack bo‘shatildi.`,
      actionBadge: { type: 'stack', text: 'Async Suspended' },
    });

    // Schedule remaining statements as Microtask
    const afterAwait = stmts.slice(awaitIndex + 1);
    const taskId = `task-async-${nextTaskId++}`;
    const afterLine = afterAwait[0]?.loc?.start.line ?? awaitLine;

    const queueItem: QueueItem = {
      id: taskId,
      type: 'async_continuation',
      name: `async resume: ${funcName}()`,
      originLine: afterLine,
      source: `await (Qator ${awaitLine})`,
      status: 'waiting',
    };

    const executeContinuation = () => {
      const resumeStackId = `stack-resume-${taskId}`;
      callStack.push({
        id: resumeStackId,
        name: `${funcName}() [resumed]`,
        line: afterLine,
        description: `await’dan keyingi qism davom ettirilmoqda`,
        isAsync: true,
      });

      recordStep({
        activeLine: afterLine,
        phase: 'EXECUTE_MICROTASK',
        phaseTitle: `Call Stack: ${funcName}() Tiklandi`,
        phaseDescription: `await tugadi. "${funcName}()" davomi Call Stack’ga yuklandi.`,
        summary: `${funcName}() davomi Call Stack’ka kirdi`,
        currentAction: `Async funksiyaning await’dan keyingi qatorlari bajarilmoqda.`,
        actionBadge: { type: 'stack', text: `${funcName}() Resumed` },
      });

      const hasAnotherAwait = afterAwait.some(
        (s) =>
          (s.type === 'ExpressionStatement' && s.expression?.type === 'AwaitExpression') ||
          (s.type === 'VariableDeclaration' &&
            s.declarations?.some((d: any) => d.init?.type === 'AwaitExpression'))
      );

      if (hasAnotherAwait) {
        handleAsyncFunctionBody(
          { type: 'BlockStatement', body: afterAwait },
          funcName,
          afterLine,
          localScope
        );
      } else {
        executeStatements(afterAwait, localScope);
      }

      callStack = callStack.filter((f) => f.id !== resumeStackId);
      recordStep({
        activeLine: afterLine,
        phase: 'EXECUTE_MICROTASK',
        phaseTitle: `Call Stack: ${funcName}() Tugadi`,
        phaseDescription: `"${funcName}()" to‘liq yakunlandi va Stack’dan chiqdi.`,
        summary: `${funcName}() to‘liq yakunlandi`,
        currentAction: `Asinxron funksiyaning barcha qismlari bajarib bo‘lindi.`,
        actionBadge: { type: 'stack', text: 'Async Finished' },
      });
    };

    microtaskQueue.push({
      item: queueItem,
      execute: executeContinuation,
    });

    recordStep({
      activeLine: afterLine,
      phase: 'SYNC_EXECUTION',
      phaseTitle: 'Microtask Queue: Async Davomi Qo‘shildi',
      phaseDescription: `"${funcName}()" ning davomi Microtask Queue’ga rejalashtirildi.`,
      summary: `Async davomi Microtask Queue’ga tushdi`,
      currentAction: `await bajarilishi yakunlangach, uning qolgan kodi Microtask sifatida navbatga qo‘yildi.`,
      queueReason: 'Har qanday await dan keyingi kod qatori Promise.then microtaski sifatida ishlaydi.',
      actionBadge: { type: 'microtask', text: 'Async Microtask Enqueued' },
    });
  }

  // Helper to execute any callback function node
  function executeCallbackNode(
    cbNode: any,
    fallbackLine: number | null,
    label: string,
    localScope = scope
  ) {
    if (!cbNode) return;
    const cbLine = cbNode.loc?.start.line ?? fallbackLine;

    const stackId = `stack-cb-${nextTaskId++}`;
    callStack.push({
      id: stackId,
      name: `${label}`,
      line: cbLine,
      description: `Callback bajarilmoqda`,
    });

    recordStep({
      activeLine: cbLine,
      phase: 'SYNC_EXECUTION',
      phaseTitle: `Call Stack: ${label}`,
      phaseDescription: `"${label}" Call Stack’ka tushdi va bajarilmoqda.`,
      summary: `${label} Call Stack’ka kirdi (Qator ${cbLine})`,
      currentAction: `Callback funksiyasi Call Stack ichida o‘z qatorlarini ijro etishni boshladi.`,
      actionBadge: { type: 'stack', text: `${label} Push` },
    });

    if (cbNode.type === 'ArrowFunctionExpression' || cbNode.type === 'FunctionExpression') {
      if (cbNode.body.type === 'BlockStatement') {
        executeStatements(cbNode.body.body, localScope);
      } else {
        executeExpression(cbNode.body, cbLine, localScope);
      }
    } else if (cbNode.type === 'Identifier') {
      const fn = localScope[cbNode.name];
      if (fn && fn.body) {
        if (fn.body.type === 'BlockStatement') {
          executeStatements(fn.body.body, localScope);
        } else {
          executeExpression(fn.body, cbLine, localScope);
        }
      }
    }

    callStack = callStack.filter((f) => f.id !== stackId);

    recordStep({
      activeLine: cbLine,
      phase: 'SYNC_EXECUTION',
      phaseTitle: `Call Stack: ${label} Pop`,
      phaseDescription: `"${label}" o‘z ishini yakunladi va Call Stack’dan chiqdi.`,
      summary: `${label} Call Stack’dan chiqdi`,
      currentAction: `Callback kodi to‘liq bajarildi va xotiradan tozalandi.`,
      actionBadge: { type: 'stack', text: `${label} Pop` },
    });
  }

  // ==========================================
  // PHASE 1: Synchronous Script Execution
  // ==========================================

  callStack.push({
    id: 'stack-main',
    name: 'main() / <script>',
    line: 1,
    description: 'Asosiy sinxron JavaScript kodi bajarilmoqda',
  });

  recordStep({
    activeLine: 1,
    phase: 'SYNC_EXECUTION',
    phaseTitle: 'Sinxron Kod Boshlandi',
    phaseDescription: 'Skript yuklandi va Call Stack’ka "main()" joylashtirildi.',
    summary: 'Dastur sinxron bajarilishi boshlandi',
    currentAction: 'JavaScript dvijogi birinchi navbatda barcha sinxron qatorlarni Call Stack’da bajaradi.',
    eventLoopDecision: 'Call Stack band bo‘lgani sababli Event Loop faqat kuzatmoqda.',
    nextStepPreview: 'Skriptdagi birinchi ifoda bajariladi.',
    actionBadge: { type: 'stack', text: 'Script Start' },
  });

  if (ast.body && Array.isArray(ast.body)) {
    executeStatements(ast.body, scope);
  }

  // Pop main()
  callStack = callStack.filter((f) => f.id !== 'stack-main');

  recordStep({
    activeLine: null,
    phase: 'CHECK_STACK',
    phaseTitle: 'Sinxron Kod Yakunlandi',
    phaseDescription: 'Call Stack to‘liq bo‘shadi. Event Loop nazoratni qo‘lga oladi.',
    summary: 'Call Stack bo‘shadi (main() tugadi)',
    currentAction: 'Barcha sinxron buyruqlar tugadi. Call Stack bo‘shaganini Event Loop payqadi.',
    eventLoopDecision:
      'Event Loop qoidasi: Call Stack bo‘shagan zahoti, birinchi navbatda Microtask Queue tekshiriladi!',
    nextStepPreview: 'Microtask Queue’da vazifalar bor-yo‘qligi tekshiriladi.',
    actionBadge: { type: 'loop', text: 'Call Stack Bo‘sh' },
  });

  // ==========================================
  // PHASE 2 & 3: Event Loop Cycles
  // ==========================================

  let maxIterations = 50; // Guard against infinite loop
  while ((microtaskQueue.length > 0 || macrotaskQueue.length > 0) && maxIterations-- > 0) {
    // 1. Drain all microtasks first!
    while (microtaskQueue.length > 0 && maxIterations-- > 0) {
      currentExecutionContext = 'microtask';
      const currentTask = microtaskQueue.shift()!;
      currentTask.item.status = 'moving';

      recordStep({
        activeLine: currentTask.item.originLine,
        phase: 'CHECK_MICROTASKS',
        phaseTitle: 'Event Loop: Microtask Tanlandi',
        phaseDescription: `Event Loop Microtask Queue’dan "${currentTask.item.name}" vazifasini Call Stack’ka ko‘chirmoqda.`,
        summary: `Microtask tanlandi: ${currentTask.item.name}`,
        currentAction: `Event Loop Microtask Queue’dan navbatdagi elementni Call Stack’ka uzatmoqda.`,
        queueReason:
          'Microtasklar Macrotasklardan mutlaq ustunlikka (priority) ega. Barcha microtasklar tugamaguncha bitta ham macrotask ishlamaydi.',
        eventLoopDecision: `Call Stack bo‘sh va Microtask Queue’da hali ${microtaskQueue.length + 1} ta vazifa bor. Event Loop ularni FIFO tartibida bajaradi.`,
        nextStepPreview: 'Ushbu microtask Call Stack’ka kirib bajariladi.',
        actionBadge: { type: 'microtask', text: 'Microtask Tanlandi' },
      });

      // Execute microtask
      currentTask.execute();

      // Check if more microtasks were spawned during execution
      if (microtaskQueue.length > 0) {
        recordStep({
          activeLine: null,
          phase: 'CHECK_MICROTASKS',
          phaseTitle: 'Microtask Checkpoint',
          phaseDescription: `Microtask Queue’da yana ${microtaskQueue.length} ta microtask qoldi. Ular ham hozir tugatilishi kerak!`,
          summary: `Navbatdagi Microtasklar kutilmoqda (${microtaskQueue.length} ta)`,
          currentAction: `Event Loop qoidasi: Har qanday yangi hosil bo‘lgan microtask ham shu aylanmada darhol bajariladi.`,
          eventLoopDecision: 'Microtask Queue to‘liq bo‘shamaguncha Macrotask Queue’ga o‘tilmaydi.',
          nextStepPreview: 'Keyingi microtask olinadi.',
          actionBadge: { type: 'microtask', text: 'Microtask Checkpoint' },
        });
      }
    }

    // Now Microtask Queue is completely empty
    if (macrotaskQueue.length > 0) {
      currentExecutionContext = 'macrotask';
      // Sort or pick the earliest macrotask (FIFO)
      const currentMacro = macrotaskQueue.shift()!;
      currentMacro.item.status = 'moving';

      recordStep({
        activeLine: currentMacro.item.originLine,
        phase: 'CHECK_MACROTASKS',
        phaseTitle: 'Event Loop: Macrotask Tanlandi',
        phaseDescription: `Microtask Queue bo‘shadi! Event Loop Macrotask Queue’dan 1 ta vazifani ("${currentMacro.item.name}") oldi.`,
        summary: `Macrotask tanlandi: ${currentMacro.item.name}`,
        currentAction: `Event Loop Macrotask Queue boshidagi 1 ta vazifani Call Stack’ka uzatmoqda.`,
        queueReason:
          'Microtask Queue to‘liq bo‘shatilgach, Event Loop faqat BITTA macrotaskni tanlaydi.',
        eventLoopDecision: `Microtask Queue bo‘sh ekanligi tasdiqlandi. Navbatdagi Macrotask ("${currentMacro.item.name}") bajarish uchun tanlandi.`,
        nextStepPreview: 'Macrotask Call Stack’da bajariladi. So‘ngra yana Microtask Queue tekshiriladi!',
        actionBadge: { type: 'macrotask', text: 'Macrotask Tanlandi' },
      });

      // Execute single macrotask
      currentMacro.execute();

      // After this macrotask, Event Loop will immediately loop back and check Microtask Queue!
      if (microtaskQueue.length > 0) {
        recordStep({
          activeLine: null,
          phase: 'CHECK_MICROTASKS',
          phaseTitle: 'Macrotaskdan Keyingi Microtask Tekshiruvi',
          phaseDescription: `Ushbu macrotask ichida yangi Microtask hosil bo‘ldi! Event Loop yangi macrotaskka o‘tishdan oldin Microtasklarni tozalaydi.`,
          summary: 'Macrotaskdan so‘ng Microtask Queue tekshirildi',
          currentAction: `Event Loop qoidasi: Har bir macrotaskdan keyin darhol Microtask Queue to‘liq drenaj qilinadi.`,
          eventLoopDecision: 'Keyingi macrotaskka o‘tish to‘xtatildi. Avval yangi microtasklar bajariladi.',
          nextStepPreview: 'Yangi microtask Call Stack’ka olinadi.',
          actionBadge: { type: 'microtask', text: 'Nested Microtask Priority' },
        });
      }
    }
  }

  // Final Step: Completed
  recordStep({
    activeLine: null,
    phase: 'COMPLETED',
    phaseTitle: 'Barcha Jarayonlar Muvaffaqiyatli Yakunlandi',
    phaseDescription: 'Call Stack, Microtask Queue va Macrotask Queue to‘liq bo‘sh. Event Loop kutish rejimida.',
    summary: 'Event Loop tsikli yakunlandi (Barcha vazifalar bajarildi)',
    currentAction: 'Barcha sinxron va asinxron amallar muvaffaqiyatli ijro etildi.',
    queueReason: 'Hech qanday kutilayotgan task qolmadi.',
    eventLoopDecision: 'Event Loop tinch (idle) holatga o‘tdi, yangi hodisalarni kutmoqda.',
    nextStepPreview: 'Simulyatsiya yakuniga yetdi. Boshidan ko‘rish uchun "Restart" tugmasini bosing.',
    actionBadge: { type: 'loop', text: 'Bajarildi ✓' },
  });

  // Assign totalSteps to all steps
  const total = steps.length;
  steps.forEach((s) => {
    s.totalSteps = total;
  });

  return { steps };
}
