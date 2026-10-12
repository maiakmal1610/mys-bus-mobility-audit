import React, { useEffect, useRef, useState, useTransition } from "react";
import L from "leaflet";
import {
  Layers,
  Train,
  Bus,
  Check,
  SlidersHorizontal,
  Map as MapIcon,
  Search,
  MapPin,
  X,
  ZoomIn,
  Loader2,
  Navigation,
} from "lucide-react";
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
  onAreaSearch?: (query: string) => void;
  isSidebarOpen?: boolean;
}

interface BasemapOption {
  id: string;
  name: string;
  category: "Google" | "Satellite" | "Vector / Clean";
  url: string;
  options: L.TileLayerOptions;
}

interface SearchResultItem {
  id: string;
  type: "stop" | "place";
  title: string;
  subtitle: string;
  coords: [number, number]; // [lat, lon]
  stopData?: BusStopProperties;
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

// Quick Area Presets for Floating Search
const POPULAR_AREAS = [
  { name: "KLCC / City", coords: [3.1578, 101.7118], zoom: 15 },
  { name: "Bukit Bintang", coords: [3.1466, 101.711], zoom: 15 },
  { name: "Bangsar", coords: [3.1292, 101.6705], zoom: 15 },
  { name: "Mont Kiara", coords: [3.1699, 101.6521], zoom: 15 },
  { name: "Mid Valley", coords: [3.1185, 101.6768], zoom: 15 },
  { name: "Petaling Jaya", coords: [3.1189, 101.6214], zoom: 14 },
  { name: "Cheras", coords: [3.1068, 101.7258], zoom: 14 },
  { name: "Subang Jaya", coords: [3.076, 101.5878], zoom: 14 },
  { name: "Shah Alam", coords: [3.0738, 101.5183], zoom: 14 },
  { name: "Putrajaya", coords: [2.9264, 101.6964], zoom: 14 },
];

export const MapView: React.FC<MapViewProps> = ({
  busStops,
  railLines,
  klBoundary,
  selectedStopId,
  onSelectStop,
  filteredStopsIds,
  onAreaSearch,
  isSidebarOpen = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const boundaryLayerRef = useRef<L.GeoJSON | null>(null);
  const railLayerRef = useRef<L.GeoJSON | null>(null);
  const busStopsLayerRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const prevSelectedIdRef = useRef<string | null>(null);

  // Default basemap is Google Streets
  const [activeBasemapId, setActiveBasemapId] = useState<string>("google_streets");
  const [showBasemapMenu, setShowBasemapMenu] = useState<boolean>(false);
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);

  // Dynamic Scale-Dependent Zoom & Generalization State
  const [currentZoom, setCurrentZoom] = useState<number>(12);
  const [forceShowAllPoints, setForceShowAllPoints] = useState<boolean>(false);

  // 1) Rail lines DISABLED by default upon opening/reloading the app
  const [showRailLines, setShowRailLines] = useState<boolean>(false);

  // Boundaries active by default
  const [showKlBoundary, setShowKlBoundary] = useState<boolean>(true);
  const [showSelangorBoundary, setShowSelangorBoundary] = useState<boolean>(true);

  // Independent Bus Stop Quality Color Layers
  const [showDeficientStops, setShowDeficientStops] = useState<boolean>(true); // Red (<3)
  const [showModerateStops, setShowModerateStops] = useState<boolean>(true); // Amber (3-5)
  const [showGoodStops, setShowGoodStops] = useState<boolean>(true); // Green (≥6)

  // 2) Geocoder & Search State
  const [floatingSearch, setFloatingSearch] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const activeBasemap = BASEMAP_OPTIONS.find((b) => b.id === activeBasemapId) || BASEMAP_OPTIONS[0];

  // Scale generalization: Points only reveal when zoom >= 14, an individual stop is selected, or forced
  const isZoomSufficient = currentZoom >= 14 || Boolean(selectedStopId) || forceShowAllPoints;

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

    // Track zoom level for scale-dependent generalization
    map.on("zoomend", () => {
      setCurrentZoom(map.getZoom());
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Invalidate map dimensions when sidebar collapses or expands
  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 320);
    return () => clearTimeout(timer);
  }, [isSidebarOpen]);

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

  // 3. Render KL, Selangor Districts, & Putrajaya Boundaries
  useEffect(() => {
    if (!mapRef.current) return;
    if (boundaryLayerRef.current) {
      mapRef.current.removeLayer(boundaryLayerRef.current);
      boundaryLayerRef.current = null;
    }

    if (!klBoundary) return;

    const boundary = L.geoJSON(klBoundary, {
      interactive: false,
      filter: (feature) => {
        const cat = feature?.properties?.category;
        const name = (feature?.properties?.displayName || feature?.properties?.shapeName || "").toLowerCase();
        if (cat === "kuala_lumpur" || name.includes("kuala lumpur")) {
          return showKlBoundary;
        }
        return showSelangorBoundary;
      },
      style: (feature) => {
        const cat = feature?.properties?.category;
        const name = (feature?.properties?.displayName || feature?.properties?.shapeName || "").toLowerCase();

        if (cat === "kuala_lumpur" || name.includes("kuala lumpur")) {
          return {
            color: "#0284c7", // Bold deep cyan/blue DBKL border
            weight: 3.5,
            opacity: 1,
            fillColor: "#0284c7",
            fillOpacity: 0.08,
            interactive: false,
          };
        } else if (cat === "putrajaya" || name.includes("putrajaya")) {
          return {
            color: "#6366f1", // Indigo Putrajaya boundary
            weight: 3,
            opacity: 0.95,
            fillColor: "#6366f1",
            fillOpacity: 0.08,
            interactive: false,
          };
        } else {
          // Selangor District (Petaling, Gombak, Hulu Langat, Klang, Sepang, etc.)
          return {
            color: "#0ea5e9", // Vivid cyan district perimeter
            weight: 2,
            dashArray: "5, 5",
            opacity: 0.85,
            fillColor: "#38bdf8",
            fillOpacity: 0.04,
            interactive: false,
          };
        }
      },
    }).addTo(mapRef.current);

    boundaryLayerRef.current = boundary;
  }, [klBoundary, showKlBoundary, showSelangorBoundary]);

  // 4. Render Rail Lines (Disabled by default upon loading)
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
    }).addTo(mapRef.current);

    railLayerRef.current = rail;
  }, [railLines, showRailLines]);

  // 5. Create Bus Stop Markers ONCE (No hover popups)
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

      circle.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectStop(props);
      });

      circle.addTo(busStopsLayerRef.current!);
      markersMapRef.current.set(props.stop_id, circle);
    });
  }, [busStops]);

  // 6. Scale-Dependent Generalization & Selection Styles
  useEffect(() => {
    if (!markersMapRef.current.size || !busStops) return;

    // Reset previous selected marker style
    if (prevSelectedIdRef.current && prevSelectedIdRef.current !== selectedStopId) {
      const prevMarker = markersMapRef.current.get(prevSelectedIdRef.current);
      if (prevMarker) {
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

    // Apply scale generalization: hide points when zoomed out unless zoom >= 14, stop selected, or forced
    busStops.features.forEach((feat) => {
      const stopId = feat.properties.stop_id;
      const score = feat.properties.quality_score;
      const marker = markersMapRef.current.get(stopId);
      if (!marker) return;

      const isTierActive =
        (score < 3 && showDeficientStops) ||
        (score >= 3 && score < 6 && showModerateStops) ||
        (score >= 6 && showGoodStops);

      const isVisible = isZoomSufficient && isTierActive && filteredStopsIds.has(stopId);
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
  }, [
    filteredStopsIds,
    selectedStopId,
    showDeficientStops,
    showModerateStops,
    showGoodStops,
    busStops,
    isZoomSufficient,
  ]);

  // Jump to Area
  const handleJumpToCoords = (lat: number, lon: number, zoom = 15) => {
    mapRef.current?.flyTo([lat, lon], zoom, { duration: 1.2 });
  };

  // Query OpenStreetMap Geocoder (Photon by Komoot with CORS & Greater KL spatial bias)
  const queryGeocoder = async (query: string): Promise<SearchResultItem[]> => {
    const trimmed = query.trim();
    if (!trimmed) return [];

    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(
          trimmed
        )}&lat=3.1390&lon=101.6869&limit=6`
      );

      if (res.ok) {
        const data = await res.json();
        if (data.features && Array.isArray(data.features)) {
          return data.features.map((feat: any, idx: number) => {
            const p = feat.properties || {};
            const title = p.name || p.street || p.district || p.city || trimmed;
            const subtitleParts = [
              p.street !== title ? p.street : null,
              p.district !== title ? p.district : null,
              p.city !== title ? p.city : null,
              p.state || "Malaysia",
            ].filter(Boolean);

            const subtitle =
              subtitleParts.length > 0 ? subtitleParts.join(", ") : "Greater Klang Valley";

            return {
              id: `place_${p.osm_id || idx}_${idx}`,
              type: "place" as const,
              title: title,
              subtitle: subtitle,
              coords: [feat.geometry.coordinates[1], feat.geometry.coordinates[0]] as [number, number],
            };
          });
        }
      }
    } catch (err) {
      console.warn("Photon geocoder error:", err);
    }

    // Fallback: Check POPULAR_AREAS presets
    const presetMatches = POPULAR_AREAS.filter((a) =>
      a.name.toLowerCase().includes(trimmed.toLowerCase())
    ).map((a) => ({
      id: `preset_${a.name}`,
      type: "place" as const,
      title: a.name,
      subtitle: "Klang Valley District",
      coords: [a.coords[0], a.coords[1]] as [number, number],
    }));

    return presetMatches;
  };

  // Perform Real-Time Geocoding (Local Bus Stops + OpenStreetMap Geocoder)
  const handleSearchInputChange = (val: string) => {
    setFloatingSearch(val);
    const query = val.trim();

    if (!query) {
      setSearchResults([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setShowDropdown(true);

    // 1. Instant local bus stops matching (stops, codes, councils)
    const localMatches: SearchResultItem[] = [];
    if (busStops) {
      const qLower = query.toLowerCase();
      for (const feat of busStops.features) {
        const name = feat.properties.stop_name.toLowerCase();
        const id = feat.properties.stop_id;
        const council = feat.properties.council?.toLowerCase() || "";
        if (name.includes(qLower) || id.includes(qLower) || council.includes(qLower)) {
          localMatches.push({
            id: `stop_${feat.properties.stop_id}`,
            type: "stop",
            title: feat.properties.stop_name,
            subtitle: `Bus Stop #${feat.properties.stop_id} • Score: ${feat.properties.quality_score}/9 • ${feat.properties.council}`,
            coords: [feat.geometry.coordinates[1], feat.geometry.coordinates[0]],
            stopData: feat.properties,
          });
          if (localMatches.length >= 4) break;
        }
      }
    }

    // Immediately present local matches while geocoder request resolves
    if (localMatches.length > 0) {
      setSearchResults(localMatches);
    }

    setIsSearching(true);

    // 2. Debounced OpenStreetMap Geocoder Query
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const geocoded = await queryGeocoder(query);
        setSearchResults([...localMatches, ...geocoded]);
      } catch {
        setSearchResults(localMatches);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  };

  // Handle Item Click in Search Dropdown
  const handleSelectSearchResult = (item: SearchResultItem) => {
    setShowDropdown(false);
    setFloatingSearch(item.title);

    if (item.type === "stop" && item.stopData) {
      onSelectStop(item.stopData);
    } else {
      handleJumpToCoords(item.coords[0], item.coords[1], 15);
    }
  };

  // Submit on Enter
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = floatingSearch.trim();
    if (!query) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // 1. If dropdown already has matching results, jump immediately
    if (searchResults.length > 0) {
      handleSelectSearchResult(searchResults[0]);
      return;
    }

    // 2. Otherwise execute immediate geocode lookup
    setIsSearching(true);
    try {
      const geocoded = await queryGeocoder(query);
      setIsSearching(false);
      if (geocoded.length > 0) {
        handleSelectSearchResult(geocoded[0]);
      } else {
        const matchArea = POPULAR_AREAS.find((a) =>
          a.name.toLowerCase().includes(query.toLowerCase())
        );
        if (matchArea) {
          handleJumpToCoords(matchArea.coords[0], matchArea.coords[1], matchArea.zoom);
          setShowDropdown(false);
        }
      }
    } catch {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden">
      {/* Map Target */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Scale Generalization Helper Pill when zoomed out */}
      {!isZoomSufficient && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-2.5 text-xs text-slate-300 pointer-events-auto transition-all">
          <ZoomIn className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Zoom in or search below to reveal local bus stops</span>
          <span className="text-slate-600">•</span>
          <button
            onClick={() => setForceShowAllPoints(true)}
            className="text-cyan-400 hover:text-cyan-300 font-semibold underline text-[11px]"
          >
            Show All Now
          </button>
        </div>
      )}

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
            <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl p-2.5 z-30 divide-y divide-slate-800/60 text-xs">
              {/* Generalization Scale Setting */}
              <div className="pb-2">
                <label className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 cursor-pointer">
                  <div className="flex items-center gap-2 text-slate-200">
                    <ZoomIn className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div>Force Show All Points</div>
                      <div className="text-[10px] text-slate-400">Ignore zoom threshold</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={forceShowAllPoints}
                    onChange={(e) => setForceShowAllPoints(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4 accent-cyan-500"
                  />
                </label>
              </div>

              {/* Bus Stop Color Layers */}
              <div className="py-2 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Bus Stop Layers (By Quality)
                </div>

                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/30 flex-shrink-0" />
                    <span className="text-slate-200 text-xs">Critical Deficit (&lt;3)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showDeficientStops}
                    onChange={(e) => setShowDeficientStops(e.target.checked)}
                    className="rounded border-slate-700 text-red-500 focus:ring-red-500 w-4 h-4 accent-red-500"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/30 flex-shrink-0" />
                    <span className="text-slate-200 text-xs">Moderate Quality (3-5)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showModerateStops}
                    onChange={(e) => setShowModerateStops(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4 accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30 flex-shrink-0" />
                    <span className="text-slate-200 text-xs">Good Quality (≥6)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showGoodStops}
                    onChange={(e) => setShowGoodStops(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 accent-emerald-500"
                  />
                </label>
              </div>

              {/* Transit & Boundaries */}
              <div className="pt-2 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Corridors & Boundaries
                </div>

                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <Train className="w-4 h-4 text-rose-400" />
                    <span>Rail Corridors (MRT/LRT)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showRailLines}
                    onChange={(e) => setShowRailLines(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4 accent-cyan-500"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
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

                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <MapIcon className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div>Selangor Districts & Putrajaya</div>
                      <div className="text-[10px] text-slate-400">9 Administrative Districts (Daerah)</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showSelangorBoundary}
                    onChange={(e) => setShowSelangorBoundary(e.target.checked)}
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

      {/* Floating Search & Real-time OSM Geocoder at Bottom Center */}
      <div
        ref={searchContainerRef}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-xl"
      >
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-3 shadow-2xl space-y-2 relative">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            {isSearching ? (
              <Loader2 className="w-4 h-4 text-cyan-400 absolute left-3 animate-spin pointer-events-none" />
            ) : (
              <Search className="w-4 h-4 text-cyan-400 absolute left-3 pointer-events-none" />
            )}
            <input
              type="text"
              placeholder="Search address, neighborhood or bus stop (e.g. Bangsar, Mont Kiara, KL199)..."
              value={floatingSearch}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0 || isSearching) setShowDropdown(true);
              }}
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
            {floatingSearch && (
              <button
                type="button"
                onClick={() => {
                  setFloatingSearch("");
                  setSearchResults([]);
                  setShowDropdown(false);
                }}
                className="absolute right-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Autocomplete Suggestions Dropdown (OSM Geocoder + GTFS Bus Stops) */}
          {showDropdown && (searchResults.length > 0 || isSearching) && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-950 border-2 border-slate-700 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden divide-y divide-slate-800 max-h-72 overflow-y-auto z-50">
              <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-white">
                  <Search className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Matching Stops & Places</span>
                </span>
                <span className="text-cyan-400 font-mono text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-cyan-500/30">
                  GTFS + OpenStreetMap
                </span>
              </div>

              {isSearching && searchResults.length === 0 && (
                <div className="px-4 py-4 flex items-center gap-2.5 text-xs text-cyan-300 font-medium bg-slate-950">
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />
                  <span>Searching locations for &ldquo;{floatingSearch}&rdquo;...</span>
                </div>
              )}

              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectSearchResult(item)}
                  className="px-4 py-3 bg-slate-950 hover:bg-slate-900 cursor-pointer flex items-center justify-between gap-3 transition-colors group border-l-4 border-transparent hover:border-cyan-400"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-xl bg-slate-900 group-hover:bg-slate-800 text-cyan-400 flex-shrink-0 border border-slate-800 transition-colors">
                      {item.type === "stop" ? (
                        <Bus className="w-4 h-4 text-amber-400" />
                      ) : (
                        <MapPin className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white group-hover:text-cyan-300 truncate transition-colors">
                          {item.title}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wider flex-shrink-0 shadow-sm ${
                            item.type === "stop"
                              ? "bg-amber-400 text-slate-950"
                              : "bg-cyan-400 text-slate-950"
                          }`}
                        >
                          {item.type === "stop" ? "Bus Stop" : "Place"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 group-hover:text-slate-200 truncate font-medium">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  <Navigation className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 flex-shrink-0 transition-colors" />
                </div>
              ))}
            </div>
          )}

          {/* Quick-Jump Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[10px]">
            <span className="text-slate-400 font-semibold flex items-center gap-1 flex-shrink-0">
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span>Presets:</span>
            </span>
            {POPULAR_AREAS.map((area) => (
              <button
                key={area.name}
                onClick={() => {
                  setFloatingSearch(area.name);
                  setShowDropdown(false);
                  handleJumpToCoords(area.coords[0], area.coords[1], area.zoom);
                }}
                className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700/60 font-medium transition-colors flex-shrink-0"
              >
                {area.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Legend */}
      <div className="absolute bottom-6 left-6 z-10 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-3 shadow-2xl text-[11px] text-slate-300 space-y-1.5 hidden md:block">
        <div className="font-semibold text-white flex items-center gap-1.5 text-xs">
          <Bus className="w-3.5 h-3.5 text-cyan-400" />
          <span>Quality Legend</span>
        </div>
        <div className="space-y-1 text-[10px]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20" />
            <span>Good (≥6)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/20" />
            <span>Moderate (3-5)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/20" />
            <span>Deficient (&lt;3)</span>
          </div>
        </div>
        <div className="pt-1 border-t border-slate-800/80 text-[9px] text-slate-500">
          {isZoomSufficient ? "● Points visible" : "○ Zoom in (≥14) to view"}
        </div>
      </div>
    </div>
  );
};
