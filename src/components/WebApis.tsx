import React from 'react';
import { Globe, Clock, CheckCircle2 } from 'lucide-react';
import type { WebApiItem } from '../types/simulation';


interface WebApisProps {
  items: WebApiItem[];
  isActive?: boolean;
}

export const WebApis: React.FC<WebApisProps> = ({ items, isActive }) => {
  return (
    <div
      className={`flex flex-col h-full bg-slate-900 rounded-xl border transition-all duration-300 overflow-hidden ${
        isActive
          ? 'border-purple-500 ring-2 ring-purple-500/40 shadow-lg shadow-purple-500/20'
          : 'border-purple-900/40 shadow-md'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-purple-950/40 border-b border-purple-900/40 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="p-0.5 rounded bg-purple-500/20 text-purple-400">
            <Globe className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-purple-200 tracking-wide">Web APIs</span>
          <span
            title="Browser: setTimeout, interval va tashqi asinxron APIlar fon rejimida shu yerda hisoblanadi"
            className="text-[9px] uppercase font-semibold text-purple-400 bg-purple-900/50 px-1 py-0.2 rounded border border-purple-700/50 cursor-help"
          >
            Fonda (Browser)
          </span>
        </div>

        <span className="text-[10px] font-mono text-purple-300 font-semibold">
          {items.length} aktiv
        </span>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 p-2 overflow-y-auto flex flex-col gap-1.5 bg-gradient-to-b from-slate-900 to-slate-950">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 p-2 border border-dashed border-slate-800 rounded-lg">
            <Clock className="w-6 h-6 text-slate-600 mb-1 opacity-60" />
            <p className="text-[11px] font-semibold text-slate-400">Aktiv Web API yo‘q</p>
          </div>
        ) : (
          items.map((api) => {
            const isCompleted = api.status === 'completed';
            return (
              <div
                key={api.id}
                className="p-2 rounded-lg border bg-purple-900/20 border-purple-500/40 text-purple-100 shadow-sm"
              >
                <div className="flex items-center justify-between gap-1.5 mb-0.5">
                  <div className="flex items-center gap-1">
                    {isCompleted ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Clock className="w-3 h-3 text-purple-400 animate-spin flex-shrink-0" />
                    )}
                    <span className="font-mono text-xs font-bold text-white truncate">
                      {api.name}
                    </span>
                  </div>

                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-mono border ${
                      isCompleted
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50'
                        : 'bg-purple-950/80 text-purple-300 border-purple-700/50'
                    }`}
                  >
                    {isCompleted ? 'Tayyor' : 'Kutilmoqda'}
                  </span>
                </div>

                <p className="text-[10px] text-slate-300 leading-tight">
                  {api.detail}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
