import React from "react";
import {
  Bus,
  Train,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface HeaderProps {
  totalStops: number;
  deficientCount: number;
  averageScore: number;
  onOpenAdvocacyModal: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalStops,
  deficientCount,
  averageScore,
  onOpenAdvocacyModal,
  isSidebarOpen = true,
  onToggleSidebar,
}) => {
  return (
    <header className="h-14 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 md:px-6 flex items-center justify-between z-30 flex-shrink-0 gap-3 select-none">
      {/* Brand & Project Identity */}
      <div className="flex items-center gap-2.5 min-w-0 flex-shrink-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={isSidebarOpen ? "Collapse directory sidebar (maximize map space)" : "Expand directory sidebar"}
            className={`p-1.5 rounded-xl border transition-all ${
              isSidebarOpen
                ? "bg-slate-800 text-cyan-400 border-cyan-500/30 hover:bg-slate-700 shadow-sm"
                : "bg-slate-800/60 text-slate-300 border-slate-700/60 hover:text-white hover:bg-slate-700"
            }`}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>
        )}
        <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center border border-cyan-400/40 flex-shrink-0">
          <Bus className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm md:text-base font-bold text-white tracking-tight truncate">
              GKL Bus Mobility Audit
            </h1>
            <span className="hidden sm:inline text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex-shrink-0">
              Civic Audit
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate hidden md:block">
            2,565 Bus Stops • RapidKL / DBKL / Selangor
          </p>
        </div>
      </div>

      {/* Aggregate KPI Strip & Action Button */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Compact KPI Pills */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs">
          {/* Stops Count */}
          <div className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Stops:</span>
            <span className="font-bold text-white font-mono">{totalStops.toLocaleString()}</span>
          </div>

          {/* Deficient Count */}
          <div className="bg-red-950/40 border border-red-850/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-slate-300 text-[11px]">Deficits:</span>
            <span className="font-bold text-red-400 font-mono">
              {deficientCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-red-300/80">
              ({totalStops > 0 ? Math.round((deficientCount / totalStops) * 100) : 0}%)
            </span>
          </div>

          {/* Avg Score */}
          <div className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Avg Score:</span>
            <span className="font-bold text-amber-400 font-mono">
              {averageScore.toFixed(1)}/9
            </span>
          </div>
        </div>

        {/* Action Button (Solid cohesive color, no gradient) */}
        <button
          onClick={onOpenAdvocacyModal}
          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Council Dossier</span>
          <span className="sm:hidden">Report</span>
        </button>
      </div>
    </header>
  );
};
