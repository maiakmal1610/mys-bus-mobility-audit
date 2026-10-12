import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Layers, Train, Bus, Check } from "lucide-react";
import {
  BusStopProperties,
  BusStopGeoJSON,
  RailLineGeoJSON,
  BoundaryGeoJSON,
} from "../types";

interface MapViewProps {
  busStops: BusStopGeoJSON | null;
  railLines: RailLineGeoJSON | null;
  klBoundary: BoundaryGeoJSON | null;
  selectedStopId: string | null;
  onSelectStop: (stop: BusStopProperties) => void;
  filteredStopsIds: Set<string>;
}

interface BasemapOption {
  id: string;
  name: string;
  url: string;
  options: L.TileLayerOptions;
}

const BASEMAP_OPTIONS: BasemapOption[] = [
  {
    id: "carto_dark",
    name: "Carto Dark Matter",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png",
    options: {
      subdomains: ["a", "b", "c", "d"],
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    },
  },
  {
    id: "google_streets",
    name: "Google Streets",
    url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=en",
    options: {
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      maxZoom: 20,
      attribution: "&copy; Google Maps",
    },
  },
  {
    id: "google_hybrid",
    name: "Google Satellite",
    url: "https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}&hl=en",
    options: {
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      maxZoom: 20,
      attribution: "&copy; Google Maps",
    },
  },
  {
    id: "osm",
    name: "OpenStreetMap",
    url: "https://tile.openstreetmap.de/{z}/{x}/{y}.png",
    options: {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    },
  },
];

export const MapView: React.FC<MapViewProps> = ({
  busStops,
  railLines,
  klBoundary,
  selectedStopId,
  onSelectStop,
  filteredStopsIds,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const boundaryLayerRef = useRef<L.GeoJSON | null>(null);
  const railLayerRef = useRef<L.GeoJSON | null>(null);
  const busStopsLayerRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.CircleMarker>>(new Map());

  const [activeBasemap, setActiveBasemap] = useState<string>("carto_dark");
  const [showBasemapMenu, setShowBasemapMenu] = useState<boolean>(false);
  const [showRailLines, setShowRailLines] = useState<boolean>(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [3.140853, 101.693207],
      zoom: 12,
      minZoom: 9,
      maxZoom: 18,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const initialBasemap = BASEMAP_OPTIONS[0];
    const tileLayer = L.tileLayer(initialBasemap.url, initialBasemap.options).addTo(map);

    tileLayerRef.current = tileLayer;
    busStopsLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Switch Basemap
  useEffect(() => {
    if (!mapRef.current) return;
    const selected = BASEMAP_OPTIONS.find((b) => b.id === activeBasemap) || BASEMAP_OPTIONS[0];
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }
    const newTileLayer = L.tileLayer(selected.url, selected.options).addTo(mapRef.current);
    tileLayerRef.current = newTileLayer;
    if (tileLayerRef.current.bringToBack) {
      tileLayerRef.current.bringToBack();
    }
  }, [activeBasemap]);

  // Render KL Boundary
  useEffect(() => {
    if (!mapRef.current || !klBoundary) return;
    if (boundaryLayerRef.current) {
      mapRef.current.removeLayer(boundaryLayerRef.current);
    }

    const boundary = L.geoJSON(klBoundary, {
      style: {
        color: "#f59e0b",
        weight: 2,
        dashArray: "4, 4",
        fillColor: "#f59e0b",
        fillOpacity: 0.04,
      },
    }).addTo(mapRef.current);

    boundaryLayerRef.current = boundary;
  }, [klBoundary]);

  // Render Rail Lines
  useEffect(() => {
    if (!mapRef.current || !railLines) return;
    if (railLayerRef.current) {
      mapRef.current.removeLayer(railLayerRef.current);
    }

    if (!showRailLines) return;

    const rail = L.geoJSON(railLines, {
      style: (feature) => {
        const color = feature?.properties?.color || "#da291c";
        return {
          color: color,
          weight: 4,
          opacity: 0.85,
        };
      },
      onEachFeature: (feature, layer) => {
        const name = feature.properties?.name || "Rail Line";
        const mode = feature.properties?.mode || "Transit";
        layer.bindTooltip(
          `<strong>${name}</strong><br/><span style="font-size:10px;color:#94a3b8;">${mode}</span>`,
          {
            className: "custom-transit-tooltip",
            sticky: true,
          }
        );
      },
    }).addTo(mapRef.current);

    railLayerRef.current = rail;
  }, [railLines, showRailLines]);

  // Render Bus Stop Circle Markers
  useEffect(() => {
    if (!mapRef.current || !busStops || !busStopsLayerRef.current) return;

    busStopsLayerRef.current.clearLayers();
    markersMapRef.current.clear();

    busStops.features.forEach((feat) => {
      const [lon, lat] = feat.geometry.coordinates;
      const props = feat.properties;
      const isVisible = filteredStopsIds.has(props.stop_id);
      const isSelected = selectedStopId === props.stop_id;

      if (!isVisible) return;

      const circle = L.circleMarker([lat, lon], {
        radius: isSelected ? 8 : 5,
        color: isSelected ? "#38bdf8" : props.color,
        weight: isSelected ? 3 : 1,
        fillColor: props.color,
        fillOpacity: isSelected ? 0.95 : 0.65,
      });

      circle.bindTooltip(
        `<div style="font-family:Inter,sans-serif;">
          <strong>${props.stop_name}</strong><br/>
          <span style="color:#f59e0b;">Quality: ${props.quality_score.toFixed(0)}/9</span> • <span style="color:#94a3b8;">${props.council}</span>
        </div>`,
        {
          className: "custom-transit-tooltip",
          direction: "top",
          offset: [0, -6],
        }
      );

      circle.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectStop(props);
      });

      circle.addTo(busStopsLayerRef.current!);
      markersMapRef.current.set(props.stop_id, circle);
    });
  }, [busStops, filteredStopsIds, selectedStopId]);

  // Smooth Pan when stop is selected
  useEffect(() => {
    if (!mapRef.current || !selectedStopId) return;
    const marker = markersMapRef.current.get(selectedStopId);
    if (marker) {
      const latLng = marker.getLatLng();
      mapRef.current.panTo(latLng, { duration: 0.8 });
    }
  }, [selectedStopId]);

  return (
    <div className="relative flex-1 h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden">
      {/* Map Target */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Controls (Basemap Switcher & Rail Toggle) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Toggle Rail Lines */}
        <button
          onClick={() => setShowRailLines((prev) => !prev)}
          className={`px-3 py-2 rounded-xl text-xs font-semibold shadow-xl border flex items-center gap-2 transition-all ${
            showRailLines
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
              : "bg-slate-900/90 text-slate-400 border-slate-800"
          }`}
        >
          <Train className="w-4 h-4" />
          <span>Rail Corridors</span>
        </button>

        {/* Basemap Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowBasemapMenu((prev) => !prev)}
            className="px-3.5 py-2 bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-xl border border-slate-800 shadow-xl flex items-center gap-2 transition-colors"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Basemap</span>
          </button>

          {showBasemapMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl p-1.5 space-y-1 text-xs">
              {BASEMAP_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setActiveBasemap(opt.id);
                    setShowBasemapMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                    activeBasemap === opt.id
                      ? "bg-amber-500/10 text-amber-400 font-semibold"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span>{opt.name}</span>
                  {activeBasemap === opt.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Legend */}
      <div className="absolute bottom-6 left-6 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-xl text-[11px] text-slate-300 space-y-2">
        <div className="font-semibold text-white flex items-center gap-1.5">
          <Bus className="w-3.5 h-3.5 text-amber-400" />
          <span>Bus Stop Quality (KRI Score)</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Good (≥6)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Moderate (3-5)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Deficient (&lt;3)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
