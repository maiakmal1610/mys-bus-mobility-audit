import React, { useState, useEffect, useMemo } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { MapView } from "./components/MapView";
import { BusStopDrawer } from "./components/BusStopDrawer";
import { AdvocacyModal } from "./components/AdvocacyModal";
import {
  BusStopGeoJSON,
  RailLineGeoJSON,
  BoundaryGeoJSON,
  BusStopProperties,
} from "./types";
import { Loader2, PanelLeftOpen } from "lucide-react";

export function App() {
  const [busStops, setBusStops] = useState<BusStopGeoJSON | null>(null);
  const [railLines, setRailLines] = useState<RailLineGeoJSON | null>(null);
  const [klBoundary, setKlBoundary] = useState<BoundaryGeoJSON | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedStop, setSelectedStop] = useState<BusStopProperties | null>(null);
  const [selectedCouncil, setSelectedCouncil] = useState<string>("All");
  const [selectedTier, setSelectedTier] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAdvocacyOpen, setIsAdvocacyOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Load Spatial Data Assets
  useEffect(() => {
    const basePath = import.meta.env.BASE_URL || "./";
    const normalizePath = (rel: string) => `${basePath.endsWith("/") ? basePath : basePath + "/"}${rel}`;

    Promise.all([
      fetch(normalizePath("data/kl_bus_stops.geojson"))
        .then((r) => (r.ok ? r.json() : fetch("./data/kl_bus_stops.geojson").then((res) => res.json()))),
      fetch(normalizePath("data/kl_rail_lines.geojson"))
        .then((r) => (r.ok ? r.json() : fetch("./data/kl_rail_lines.geojson").then((res) => res.json()))),
      fetch(normalizePath("data/kl_boundary.geojson"))
        .then((r) => (r.ok ? r.json() : fetch("./data/kl_boundary.geojson").then((res) => res.json()))),
    ])
      .then(([stopsData, railData, boundaryData]) => {
        setBusStops(stopsData);
        setRailLines(railData);
        setKlBoundary(boundaryData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load transit assets:", err);
        setLoading(false);
      });
  }, []);

  const allStops = useMemo(() => {
    if (!busStops) return [];
    return busStops.features.map((f) => f.properties);
  }, [busStops]);

  // Distinct local councils
  const councils = useMemo(() => {
    const set = new Set<string>();
    allStops.forEach((s) => {
      if (s.council) set.add(s.council);
    });
    return Array.from(set).sort();
  }, [allStops]);

  // Filtered Stop IDs for Map Rendering
  const filteredStopsIds = useMemo(() => {
    const ids = new Set<string>();
    allStops.forEach((s) => {
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

      if (matchCouncil && matchTier && matchSearch) {
        ids.add(s.stop_id);
      }
    });

    // Explicitly selected stop is always visible regardless of active sidebar filters
    if (selectedStop?.stop_id) {
      ids.add(selectedStop.stop_id);
    }

    return ids;
  }, [allStops, selectedCouncil, selectedTier, searchQuery, selectedStop]);

  // Aggregate Stats
  const deficientCount = useMemo(() => {
    return allStops.filter((s) => s.quality_score < 3).length;
  }, [allStops]);

  const averageScore = useMemo(() => {
    if (!allStops.length) return 0;
    const sum = allStops.reduce((acc, s) => acc + s.quality_score, 0);
    return sum / allStops.length;
  }, [allStops]);

  const handleSelectStopById = (stopId: string) => {
    const found = allStops.find((s) => s.stop_id === stopId);
    if (found) {
      setSelectedStop(found);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300 gap-3">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <div className="text-sm font-semibold tracking-tight">
          Loading Klang Valley Bus Mobility & Infrastructure Audit...
        </div>
        <div className="text-xs text-slate-500">
          Querying 2,565 bus stops & multimodal rail network
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-900 flex flex-col overflow-hidden font-sans">
      <Header
        totalStops={allStops.length}
        deficientCount={deficientCount}
        averageScore={averageScore}
        onOpenAdvocacyModal={() => setIsAdvocacyOpen(true)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          stops={allStops}
          selectedCouncil={selectedCouncil}
          onSelectCouncil={setSelectedCouncil}
          selectedTier={selectedTier}
          onSelectTier={setSelectedTier}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStopId={selectedStop?.stop_id || null}
          onSelectStop={handleSelectStopById}
          councils={councils}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 relative h-full overflow-hidden">
          <MapView
            busStops={busStops}
            railLines={railLines}
            klBoundary={klBoundary}
            selectedStopId={selectedStop?.stop_id || null}
            onSelectStop={(stop) => setSelectedStop(stop)}
            filteredStopsIds={filteredStopsIds}
            isSidebarOpen={isSidebarOpen}
          />

          {/* Floating Expand Sidebar Button when sidebar is collapsed */}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-800/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700 shadow-2xl text-xs font-semibold text-slate-200 hover:text-white hover:border-cyan-500/50 hover:bg-slate-750 transition-all group"
            >
              <PanelLeftOpen className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Show Stops Directory</span>
              <span className="text-[10px] bg-slate-700 text-cyan-300 px-1.5 py-0.5 rounded font-mono border border-slate-600">
                {filteredStopsIds.size}
              </span>
            </button>
          )}

          <BusStopDrawer
            stop={selectedStop}
            onClose={() => setSelectedStop(null)}
            isSidebarCollapsed={!isSidebarOpen}
          />
        </main>
      </div>

      <AdvocacyModal
        isOpen={isAdvocacyOpen}
        onClose={() => setIsAdvocacyOpen(false)}
        stops={allStops}
      />
    </div>
  );
}
