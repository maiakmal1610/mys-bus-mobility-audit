import React from "react";
import { Bus, Train, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";

interface HeaderProps {
  totalStops: number;
  deficientCount: number;
  averageScore: number;
  onOpenAdvocacyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalStops,
  deficientCount,
  averageScore,
  onOpenAdvocacyModal,
}) => {
  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between z-30 flex-shrink-0">
      {/* Brand & Project Identity */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-400/30">
          <Bus className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-white tracking-tight">
              GKL Bus Mobility & Infrastructure Audit
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Crowdsourced Civic Tech
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <span>Evaluating 2,565 stops across DBKL & Klang Valley</span>
            <span>•</span>
            <span className="text-slate-500">Based on KRI AI Computer Vision Research</span>
          </p>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="hidden lg:flex items-center gap-4">
        <div className="bg-slate-800/60 border border-slate-700/50 px-3.5 py-1.5 rounded-xl flex items-center gap-2.5">
          <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400">
            <Bus className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Stops Monitored</div>
            <div className="text-sm font-bold text-white font-mono">
              {totalStops.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 px-3.5 py-1.5 rounded-xl flex items-center gap-2.5">
          <div className="p-1 rounded-lg bg-red-500/10 text-red-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Deficient Stops (&lt;3)</div>
            <div className="text-sm font-bold text-red-400 font-mono">
              {deficientCount.toLocaleString()} ({totalStops > 0 ? ((deficientCount / totalStops) * 100).toFixed(1) : 0}%)
            </div>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 px-3.5 py-1.5 rounded-xl flex items-center gap-2.5">
          <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Avg Quality Score</div>
            <div className="text-sm font-bold text-white font-mono">
              {averageScore.toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ 9</span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenAdvocacyModal}
          className="px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center gap-2"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Council Action Report</span>
        </button>
      </div>
    </header>
  );
};
