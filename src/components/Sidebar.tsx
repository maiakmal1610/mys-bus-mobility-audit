import React, { useMemo } from "react";
import { Search, AlertOctagon, ChevronRight, ChevronLeft, Building, PanelLeftClose } from "lucide-react";
import { BusStopProperties } from "../types";

interface SidebarProps {
  stops: BusStopProperties[];
  selectedCouncil: string;
  onSelectCouncil: (council: string) => void;
  selectedTier: string;
  onSelectTier: (tier: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStopId: string | null;
  onSelectStop: (stopId: string) => void;
  councils: string[];
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  stops,
  selectedCouncil,
  onSelectCouncil,
  selectedTier,
  onSelectTier,
  searchQuery,
  onSearchChange,
  selectedStopId,
  onSelectStop,
  councils,
  isOpen,
  onToggle,
}) => {
  const filteredStops = useMemo(() => {
    return stops.filter((s) => {
      const matchCouncil = selectedCouncil === "All" || s.council.includes(selectedCouncil);
      const matchTier =
        selectedTier === "All"
          ? true
          : selectedTier === "Deficient"
          ? s.quality_score < 3
          : selectedTier === "Moderate"
          ? s.quality_score >= 3 && s.quality_score < 6
          : s.quality_score >= 6;
      const matchSearch =
        searchQuery.trim() === "" ||
        s.stop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.stop_id.includes(searchQuery);

      return matchCouncil && matchTier && matchSearch;
    });
  }, [stops, selectedCouncil, selectedTier, searchQuery]);

  const criticalDeficitCount = useMemo(() => {
    return stops.filter((s) => s.quality_score < 3).length;
  }, [stops]);

  return (
    <aside
      className={`bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 flex flex-col h-[calc(100vh-4rem)] z-20 flex-shrink-0 text-xs transition-all duration-300 ease-in-out ${
        isOpen
          ? "w-96 opacity-100"
          : "w-0 opacity-0 overflow-hidden border-r-0 pointer-events-none"
      }`}
    >
      {/* Directory Title & Collapse Button */}
      <div className="p-3.5 border-b border-slate-700 flex items-center justify-between bg-slate-800/60">
        <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs min-w-0">
          <Building className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span className="truncate">Bus Stops Audit Directory</span>
        </div>
        <button
          onClick={onToggle}
          title="Collapse sidebar to explore map"
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1 text-[11px]"
        >
          <PanelLeftClose className="w-4 h-4 text-cyan-400" />
        </button>
      </div>

      {/* Search Bar & Filters */}
      <div className="p-4 border-b border-slate-750 space-y-3 flex-shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search stop name or ID (e.g. KL199, 1000004)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-xs transition-all"
          />
        </div>

        {/* Filter Selectors */}
        <div className="grid grid-cols-2 gap-2">
          {/* Council Dropdown */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">
              Local Authority
            </label>
            <select
              value={selectedCouncil}
              onChange={(e) => onSelectCouncil(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="All">All Councils</option>
              {councils.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Infrastructure Tier */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">
              Quality Tier
            </label>
            <select
              value={selectedTier}
              onChange={(e) => onSelectTier(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="All">All Quality (0-9)</option>
              <option value="Deficient">🔴 Deficient (&lt;3)</option>
              <option value="Moderate">🟡 Moderate (3-5)</option>
              <option value="Good">🟢 Good (≥6)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-750 flex items-center justify-between text-[11px] text-slate-400">
        <span>
          Showing <strong className="text-white">{filteredStops.length}</strong> stops
        </span>
        <span className="text-[10px] text-red-400 font-medium">
          {criticalDeficitCount} Critical Deficits
        </span>
      </div>

      {/* Stop List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
        {filteredStops.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <AlertOctagon className="w-8 h-8 mx-auto text-slate-600" />
            <p>No bus stops match your search criteria.</p>
          </div>
        ) : (
          filteredStops.slice(0, 100).map((stop) => {
            const isSelected = selectedStopId === stop.stop_id;
            return (
              <div
                key={stop.stop_id}
                onClick={() => onSelectStop(stop.stop_id)}
                className={`p-3.5 cursor-pointer transition-all hover:bg-slate-800 flex items-center justify-between gap-3 ${
                  isSelected
                    ? "bg-cyan-500/15 border-l-4 border-cyan-400"
                    : "border-l-4 border-transparent"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-mono text-slate-300 bg-slate-750 px-1.5 py-0.2 rounded border border-slate-700">
                      #{stop.stop_id}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">
                      {stop.council.split(" ")[0]}
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-100 truncate text-xs mb-1">
                    {stop.stop_name}
                  </h3>

                  {/* Amenity Indicators */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span
                      className={`flex items-center gap-1 ${
                        stop.amenities.shelter ? "text-emerald-400" : "text-red-400/80"
                      }`}
                    >
                      {stop.amenities.shelter ? "✓ Shelter" : "✗ No Shelter"}
                    </span>
                    <span>•</span>
                    <span
                      className={`flex items-center gap-1 ${
                        stop.amenities.street_light ? "text-emerald-400" : "text-amber-400/80"
                      }`}
                    >
                      {stop.amenities.street_light ? "💡 Light" : "Dark"}
                    </span>
                  </div>
                </div>

                {/* Score Pill */}
                <div className="flex flex-col items-end flex-shrink-0">
                  <div
                    className="px-2.5 py-1 rounded-lg font-bold font-mono text-xs shadow-sm"
                    style={{
                      backgroundColor: `${stop.color}20`,
                      color: stop.color,
                      border: `1px solid ${stop.color}40`,
                    }}
                  >
                    {stop.quality_score.toFixed(0)} <span className="text-[9px] font-normal">/ 9</span>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1">
                    {stop.quality_score >= 6
                      ? "Good"
                      : stop.quality_score >= 3
                      ? "Moderate"
                      : "Deficient"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
