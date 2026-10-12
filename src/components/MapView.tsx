import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Layers, Train, Bus, Check, SlidersHorizontal, Map as MapIcon } from "lucide-react";
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
  category: "Google" | "Satellite" | "Vector / Clean";
  url: string;
  options: L.TileLayerOptions;
}

const BASEMAP_OPTIONS: BasemapOption[] = [
  {
    id: "google_streets",
    name: "Google Streets",
    category: "Google",
    url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=en",
    options: {
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      maxZoom: 20,
      attribution: "&copy; Google Maps",
    },
  },
  {
    id: "google_hybrid",
    name: "Google Hybrid",
    category: "Google",
    url: "https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}&hl=en",
    options: {
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      maxZoom: 20,
      attribution: "&copy; Google Maps",
    },
  },
  {
    id: "google_terrain",
    name: "Google Terrain",
    category: "Google",
    url: "https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}&hl=en",
    options: {
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      maxZoom: 20,
      attribution: "&copy; Google Maps",
    },
  },
  {
    id: "carto_dark",
    name: "Carto Dark Matter",
    category: "Vector / Clean",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png",
    options: {
      subdomains: ["a", "b", "c", "d"],
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    },
  },
  {
    id: "esri_imagery",
    name: "Esri World Imagery",
    category: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    options: {
      maxZoom: 19,
      attribution: "&copy; Esri &copy; Earthstar Geographics",
    },
  },
  {
    id: "waze",
    name: "Waze Map",
    category: "Vector / Clean",
    url: "https://worldtiles1.waze.com/tiles/{z}/{x}/{y}.png",
    options: {
      maxZoom: 19,
      attribution: "&copy; Waze Mobile",
    },
  },
  {
    id: "osm_de",
    name: "OpenStreetMap",
    category: "Vector / Clean",
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
  const prevSelectedIdRef = useRef<string | null>(null);

  // Set default basemap to Google Streets
  const [activeBasemapId, setActiveBasemapId] = useState<string>("google_streets");
  const [showBasemapMenu, setShowBasemapMenu] = useState<boolean>(false);
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);

  // Layer Toggles
  const [showRailLines, setShowRailLines] = useState<boolean>(true);
  const [showBusStops, setShowBusStops] = useState<boolean>(true);
  const [showKlBoundary, setShowKlBoundary] = useState<boolean>(true);
  const [showSelangorBoundary, setShowSelangorBoundary] = useState<boolean>(true);

  const activeBasemap = BASEMAP_OPTIONS.find((b) => b.id === activeBasemapId) || BASEMAP_OPTIONS[0];

  // 1. Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [3.140853, 101.693207],
      zoom: 12,
      minZoom: 9,
      maxZoom: 19,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const initialBasemap = BASEMAP_OPTIONS.find((b) => b.id === "google_streets") || BASEMAP_OPTIONS[0];
    const tileLayer = L.tileLayer(initialBasemap.url, initialBasemap.options).addTo(map);

    tileLayerRef.current = tileLayer;
    busStopsLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Switch Basemap Layer
  useEffect(() => {
    if (!mapRef.current) return;
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }
    const newTileLayer = L.tileLayer(activeBasemap.url, activeBasemap.options).addTo(mapRef.current);
    tileLayerRef.current = newTileLayer;
    if (tileLayerRef.current.bringToBack) {
      tileLayerRef.current.bringToBack();
    }
  }, [activeBasemapId]);

  // 3. Render KL, Selangor, & Putrajaya Boundaries
  useEffect(() => {
    if (!mapRef.current) return;
    if (boundaryLayerRef.current) {
      mapRef.current.removeLayer(boundaryLayerRef.current);
      boundaryLayerRef.current = null;
    }

    if (!klBoundary) return;

    const boundary = L.geoJSON(klBoundary, {
      filter: (feature) => {
        const name = feature?.properties?.shapeName?.toLowerCase() || "";
        if (name.includes("kuala lumpur")) {
          return showKlBoundary;
        }
        return showSelangorBoundary;
      },
      style: (feature) => {
        const name = feature?.properties?.shapeName?.toLowerCase() || "";
        if (name.includes("kuala lumpur")) {
          // KL City Boundary: prominent, darker, bold border
          return {
            color: "#0369a1", // Dark blue border
            weight: 3.5,
            opacity: 1,
            fillColor: "#0284c7",
            fillOpacity: 0.08,
          };
        } else if (name.includes("putrajaya")) {
          // Putrajaya Boundary
          return {
            color: "#4f46e5", // Indigo
            weight: 3,
            opacity: 0.95,
            fillColor: "#6366f1",
            fillOpacity: 0.08,
          };
        } else {
          // Selangor Boundary
          return {
            color: "#334155", // Slate dark stroke
            weight: 2.5,
            dashArray: "6, 6",
            opacity: 0.85,
            fillColor: "#64748b",
            fillOpacity: 0.03,
          };
        }
      },
      onEachFeature: (feature, layer) => {
        const name = feature?.properties?.displayName || feature?.properties?.shapeName || "Boundary";
        layer.bindTooltip(
          `<div style="font-family:Inter,sans-serif;font-size:11px;">
            <strong>${name}</strong><br/>
            <span style="color:#64748b;font-size:10px;">Administrative Boundary</span>
          </div>`,
          { className: "custom-transit-tooltip", sticky: true }
        );
      },
    }).addTo(mapRef.current);

    boundaryLayerRef.current = boundary;
  }, [klBoundary, showKlBoundary, showSelangorBoundary]);

  // 4. Render Rail Lines
  useEffect(() => {
    if (!mapRef.current) return;
    if (railLayerRef.current) {
      mapRef.current.removeLayer(railLayerRef.current);
      railLayerRef.current = null;
    }

    if (!showRailLines || !railLines) return;

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

  // 5. Create Bus Stop Markers ONCE (No flashing DOM rebuilds!)
  useEffect(() => {
    if (!mapRef.current || !busStops) return;

    if (!busStopsLayerRef.current) {
      busStopsLayerRef.current = L.layerGroup().addTo(mapRef.current);
    } else {
      busStopsLayerRef.current.clearLayers();
    }
    markersMapRef.current.clear();

    busStops.features.forEach((feat) => {
      const [lon, lat] = feat.geometry.coordinates;
      const props = feat.properties;

      const circle = L.circleMarker([lat, lon], {
        radius: 5,
        color: props.color,
        weight: 1,
        fillColor: props.color,
        fillOpacity: 0.65,
      });

      circle.bindTooltip(
        `<div style="font-family:Inter,sans-serif;font-size:11px;">
          <strong>${props.stop_name}</strong><br/>
          <span style="color:#0284c7;">Quality: ${props.quality_score.toFixed(0)}/9</span> • <span style="color:#64748b;">${props.council}</span>
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
  }, [busStops]);

  // 6. Smooth Style Update & Smooth FlyTo (Rock-solid, NO flashing)
  useEffect(() => {
    if (!markersMapRef.current.size) return;

    // Reset previous selected marker style
    if (prevSelectedIdRef.current && prevSelectedIdRef.current !== selectedStopId) {
      const prevMarker = markersMapRef.current.get(prevSelectedIdRef.current);
      if (prevMarker && busStops) {
        const feat = busStops.features.find((f) => f.properties.stop_id === prevSelectedIdRef.current);
        const col = feat?.properties.color || "#0284c7";
        prevMarker.setStyle({
          radius: 5,
          color: col,
          weight: 1,
          fillColor: col,
          fillOpacity: 0.65,
        });
      }
    }

    // Highlight active selected marker & smoothly zoom to it
    if (selectedStopId) {
      const currentMarker = markersMapRef.current.get(selectedStopId);
      if (currentMarker) {
        currentMarker.setStyle({
          radius: 9,
          color: "#0284c7",
          weight: 3.5,
          fillColor: "#38bdf8",
          fillOpacity: 1,
        });
        currentMarker.bringToFront();

        const latLng = currentMarker.getLatLng();
        mapRef.current?.flyTo(latLng, 16, { duration: 0.8 });
      }
    }
    prevSelectedIdRef.current = selectedStopId;

    // Filter visibility by updating opacity without destroying DOM nodes
    markersMapRef.current.forEach((marker, stopId) => {
      const isVisible = showBusStops && filteredStopsIds.has(stopId);
      const isSelected = stopId === selectedStopId;

      if (isVisible) {
        if (!isSelected) {
          marker.setStyle({
            opacity: 1,
            fillOpacity: 0.65,
          });
        }
      } else {
        marker.setStyle({
          opacity: 0,
          fillOpacity: 0,
        });
      }
    });
  }, [filteredStopsIds, selectedStopId, showBusStops, busStops]);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden">
      {/* Map Target */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Controls: Layer Switcher & Multi-Basemap Switcher */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Layer Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLayerMenu((prev) => !prev);
              setShowBasemapMenu(false);
            }}
            className={`flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-xl text-xs font-semibold transition-colors ${
              showLayerMenu
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                : "text-slate-200 hover:text-white hover:border-slate-700"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Layers</span>
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl p-2 z-30 divide-y divide-slate-800/60">
              <div className="p-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Toggle Map Layers
              </div>

              <div className="py-1 space-y-1">
                {/* KL Boundary Toggle */}
                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <MapIcon className="w-4 h-4 text-sky-400" />
                    <span>KL City Boundary (DBKL)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showKlBoundary}
                    onChange={(e) => setShowKlBoundary(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4 accent-cyan-500"
                  />
                </label>

                {/* Selangor & Putrajaya Boundary Toggle */}
                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <MapIcon className="w-4 h-4 text-indigo-400" />
                    <span>Selangor & Putrajaya</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showSelangorBoundary}
                    onChange={(e) => setShowSelangorBoundary(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4 accent-cyan-500"
                  />
                </label>

                {/* Rail Lines Toggle */}
                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <Train className="w-4 h-4 text-red-400" />
                    <span>Rail Corridors (MRT/LRT)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showRailLines}
                    onChange={(e) => setShowRailLines(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4 accent-cyan-500"
                  />
                </label>

                {/* Bus Stops Toggle */}
                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <Bus className="w-4 h-4 text-cyan-400" />
                    <span>Bus Stop Points</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showBusStops}
                    onChange={(e) => setShowBusStops(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4 accent-cyan-500"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Basemap Switcher (Default: Google Streets) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowBasemapMenu((prev) => !prev);
              setShowLayerMenu(false);
            }}
            className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-xl text-xs font-semibold text-slate-200 hover:text-white hover:border-slate-700 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Basemap: {activeBasemap.name}</span>
          </button>

          {showBasemapMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl p-1.5 z-30 divide-y divide-slate-800/60">
              <div className="p-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Base Layer
              </div>
              <div className="py-1 space-y-0.5">
                {BASEMAP_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setActiveBasemapId(opt.id);
                      setShowBasemapMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      activeBasemapId === opt.id
                        ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <div>
                      <div>{opt.name}</div>
                      <div className="text-[10px] text-slate-500">{opt.category}</div>
                    </div>
                    {activeBasemapId === opt.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Legend */}
      <div className="absolute bottom-6 left-6 z-10 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-3.5 shadow-2xl text-[11px] text-slate-300 space-y-2">
        <div className="font-semibold text-white flex items-center gap-1.5">
          <Bus className="w-3.5 h-3.5 text-cyan-400" />
          <span>Bus Stop Quality (KRI Score)</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20" />
            <span>Good (≥6)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/20" />
            <span>Moderate (3-5)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/20" />
            <span>Deficient (&lt;3)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
