import type { PresetCode } from '../types/simulation';

export const PRESETS: PresetCode[] = [
  {
    id: 'sync-basic',
    title: '1. Oddiy Sinxron Kod',
    category: 'Asoslar',
    difficulty: 'Oson',
    description: 'Sinxron kod to‘g‘ridan-to‘g‘ri Call Stack’da LIFO tartibida bajariladi va Event Loop navbatlariga tushmaydi.',
    expectedOutput: ['Start', 'Salom, JavaScript', 'Jarayon davom etmoqda', 'End'],
    code: `console.log("Start");

function greet(name) {
  console.log("Salom, " + name);
}

function process() {
  greet("JavaScript");
  console.log("Jarayon davom etmoqda");
}

process();
console.log("End");`,
  },
  {
    id: 'set-timeout',
    title: '2. setTimeout (Macrotask)',
    category: 'Timerlar',
    difficulty: 'Oson',
    description: 'setTimeout chaqirilganda Web APIs timer hisoblaydi, vaqt tugagach uning callbacki Macrotask Queue’ga joylashadi.',
    expectedOutput: ['1: Boshlanishi', '4: Tugashi', '2: 0ms timer callback', '3: 100ms timer callback'],
    code: `console.log("1: Boshlanishi");

setTimeout(() => {
  console.log("2: 0ms timer callback");
}, 0);

setTimeout(() => {
  console.log("3: 100ms timer callback");
}, 100);

console.log("4: Tugashi");`,
  },
  {
    id: 'promise-basic',
    title: '3. Promise (Microtask)',
    category: 'Asinxron',
    difficulty: 'O‘rta',
    description: 'Promise executor funksiyasi sinxron ishlaydi, ammo .then() callbacki Microtask Queue’ga tushadi va sinxron kod tugashi bilanoq bajariladi.',
    expectedOutput: ['1: Boshlanish', '4: Tugash', '2: Promise microtask 1', '3: Promise microtask 2 (zanjir)'],
    code: `console.log("1: Boshlanish");

Promise.resolve().then(() => {
  console.log("2: Promise microtask 1");
}).then(() => {
  console.log("3: Promise microtask 2 (zanjir)");
});

console.log("4: Tugash");`,
  },
  {
    id: 'async-await',
    title: '4. async / await',
    category: 'Asinxron',
    difficulty: 'O‘rta',
    description: 'await ifodasi kelgan zahoti async funksiya to‘xtatiladi, kutishdan keyingi qism Microtask sifatida navbatga qo‘yiladi.',
    expectedOutput: ['1: Script start', '2: Async funksiya ichi (sinxron)', '4: Script end', '3: Await’dan keyingi qism (microtask)'],
    code: `console.log("1: Script start");

async function fetchData() {
  console.log("2: Async funksiya ichi (sinxron)");
  await Promise.resolve();
  console.log("3: Await’dan keyingi qism (microtask)");
}

fetchData();
console.log("4: Script end");`,
  },
  {
    id: 'promise-and-timeout',
    title: '5. Promise va setTimeout Birgalikda',
    category: 'Kombinatsiya',
    difficulty: 'O‘rta',
    description: 'Microtask Queue har doim Macrotask Queue’dan ustun turadi! Stack bo‘shagach, avval barcha Microtasklar tugatiladi, so‘ngra 1 ta Macrotask olinadi.',
    expectedOutput: ['1: Sinxron boshlanish', '4: Sinxron yakun', '3: Promise.then (microtask)', '2: setTimeout (macrotask)'],
    code: `console.log("1: Sinxron boshlanish");

setTimeout(() => {
  console.log("2: setTimeout (macrotask)");
}, 0);

Promise.resolve().then(() => {
  console.log("3: Promise.then (microtask)");
});

console.log("4: Sinxron yakun");`,
  },
  {
    id: 'nested-tasks',
    title: '6. Nested Callback va Microtasklar',
    category: 'Murakkab',
    difficulty: 'Qiyin',
    description: 'Macrotask ichida yangi Promise yaratilsa, u darhol o‘sha macrotask tugashi bilan navbatdagi macrotaskdan OLDIN bajariladi!',
    expectedOutput: ['Start', 'End', 'Initial Microtask', 'Timeout 1', 'Nested Microtask (Timeout 1 ichida)', 'Timeout 2'],
    code: `console.log("Start");

setTimeout(() => {
  console.log("Timeout 1");
  Promise.resolve().then(() => {
    console.log("Nested Microtask (Timeout 1 ichida)");
  });
}, 0);

setTimeout(() => {
  console.log("Timeout 2");
}, 0);

Promise.resolve().then(() => {
  console.log("Initial Microtask");
});

console.log("End");`,
  },
  {
    id: 'queue-microtask',
    title: '7. queueMicrotask va Promise Zanjiri',
    category: 'Microtasklar',
    difficulty: 'O‘rta',
    description: 'queueMicrotask() to‘g‘ridan-to‘g‘ri Microtask Queue’ga vazifa qo‘shadi va Promise zanjiri bilan bir xil navbatda turadi.',
    expectedOutput: ['A', 'E', 'B: queueMicrotask 1', 'D: Promise.then', 'C: Ichma-ich queueMicrotask'],
    code: `console.log("A");

queueMicrotask(() => {
  console.log("B: queueMicrotask 1");
  queueMicrotask(() => {
    console.log("C: Ichma-ich queueMicrotask");
  });
});

Promise.resolve().then(() => {
  console.log("D: Promise.then");
});

console.log("E");`,
  },
];
