import React from 'react';
import { X, BookOpen, HelpCircle } from 'lucide-react';

interface RulesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesGuideModal: React.FC<RulesGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const rules = [
    {
      num: 1,
      title: 'Sinxron Kod Birinchi O‘rinda',
      desc: 'Dastlab barcha sinxron kod Call Stack’da LIFO tartibida boshidan oxirigacha bajariladi. Event Loop bu vaqtda kutish rejimida bo‘ladi.',
      badge: 'Call Stack',
      color: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
    },
    {
      num: 2,
      title: 'Call Stack Bo‘shashi va Microtasklar',
      desc: 'Call Stack to‘liq bo‘shagan zahoti, Event Loop birinchi bo‘lib Microtask Queue’ga qaraydi va barcha mavjud microtasklarni FIFO tartibida to‘liq bo‘shatadi.',
      badge: 'Microtask Queue',
      color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
    },
    {
      num: 3,
      title: 'Yagona Macrotask Ijrosi',
      desc: 'Faqat Microtask Queue to‘liq bo‘shagach, Macrotask Queue boshidan navbatdagi BITTA macrotask olinadi va Call Stack’ka yuklanadi.',
      badge: 'Macrotask Queue',
      color: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
    },
    {
      num: 4,
      title: 'Har bir Macrotaskdan So‘ng Microtask Tekshiruvi',
      desc: 'Har bir bitta macrotask tugaganidan keyin, Event Loop darhol Microtask Queue’ni qayta tekshiradi! Agar yangi microtask paydo bo‘lgan bo‘lsa, u keyingi macrotaskdan oldin bajariladi.',
      badge: 'Qat’iy Qoida',
      color: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
    },
    {
      num: 5,
      title: 'Promise va queueMicrotask — Microtasklar',
      desc: 'Promise.then(), catch(), finally() hamda queueMicrotask() orqali berilgan vazifalar har doim Microtask Queue’ga tushadi.',
      badge: 'Microtask',
      color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
    },
    {
      num: 6,
      title: 'setTimeout va setInterval — Macrotasklar',
      desc: 'Timer va interval callbacklari Web APIs tomonidan hisoblangach, Macrotask (Callback) Queue’ga uzatiladi.',
      badge: 'Macrotask',
      color: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
    },
    {
      num: 7,
      title: 'async / await Mexanizmi',
      desc: 'await ifodasi uchraganda, funksiya pauza qilinadi va Call Stack’dan chiqadi. Await’dan keyingi barcha qatorlar avtomatik ravishda Promise microtaski sifatida Microtask Queue’ga qo‘shiladi.',
      badge: 'Microtask',
      color: 'border-sky-500/50 bg-sky-500/10 text-sky-400',
    },
    {
      num: 8,
      title: 'Timer Kechikishi Kafolatli Vaqt Emas',
      desc: 'setTimeout(cb, 100) dagi 100ms — bu callback eng erta qachon Macrotask Queue’ga qo‘shilishi mumkinligini bildiradi. Agar Call Stack yoki Microtasklar band bo‘lsa, u ko‘proq vaqt kutishga majbur bo‘ladi.',
      badge: 'Muhim Nuqta',
      color: 'border-rose-500/50 bg-rose-500/10 text-rose-400',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Event Loop Qoidalari Qo‘llanmasi"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-white m-0">
                JavaScript Event Loop Asosiy Qoidalari
              </h2>
              <p className="text-xs text-slate-400 m-0">
                Spetsifikatsiya va brauzer modeli bo‘yicha 8 ta muhim tamoyil
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Yopish"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Diagram */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
              <span>Event Loop Tsikli Sxemasi:</span>
              <span className="text-blue-400 font-mono">Cheksiz Aylanma (Tick)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px] text-center font-medium">
              <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-800/80 text-blue-200">
                1. Sinxron Kod (Stack)
              </div>
              <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-200">
                2. BARCHA Microtasklar
              </div>
              <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-800/80 text-purple-200">
                3. Render / UI (ixtiyoriy)
              </div>
              <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-800/80 text-amber-200">
                4. BITTA Macrotask
              </div>
            </div>
          </div>

          {/* 8 Rules List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rules.map((r) => (
              <div
                key={r.num}
                className="bg-slate-950/50 border border-slate-800/90 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[11px] font-mono text-blue-400 border border-slate-700">
                        {r.num}
                      </span>
                      {r.title}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${r.color}`}
                    >
                      {r.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    {r.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Tip Alert */}
          <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/50 flex items-start gap-2.5 text-xs text-blue-200">
            <HelpCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-white">Foydali Maslahat:</strong> Interview yoki amaliyotda har doim esda tuting: <span className="text-emerald-400 font-semibold">Microtask Queue</span> doimo to‘liq bo‘shatiladi, ammo <span className="text-amber-400 font-semibold">Macrotask Queue</span>dan bir vaqtda faqat 1 ta task olinadi. Har bir macrotaskdan keyin yana microtasklar to‘liq tekshiriladi!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition"
          >
            Tushunarli, yopish
          </button>
        </div>
      </div>
    </div>
  );
};
