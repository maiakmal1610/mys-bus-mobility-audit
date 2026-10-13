# 🚏 GKL Bus Mobility & Infrastructure Audit

> **An interactive geospatial audit platform evaluating bus stop infrastructure quality, commuter accessibility, and multimodal transit connectivity across 2,565 stops in Greater Kuala Lumpur and Selangor.**

[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900.svg?logo=leaflet&logoColor=white)](https://leafletjs.com)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

---

## 🎯 Overview

First-mile and last-mile connectivity is a decisive factor in public transportation adoption across the Klang Valley. While significant investments have expanded the regional rail network (LRT, MRT, Monorail), neighborhood bus stops frequently lack essential commuter infrastructure: weather-proof rain shelters, adequate night lighting, accessible seating, and safe pedestrian crossings.

This platform provides an open, interactive spatial audit benchmark covering **2,565 bus stops** across Greater Kuala Lumpur and Selangor, categorizing infrastructure quality and empowering commuters and advocates with evidence-based reporting tools.

---

## 🗺️ Current Methodology & Data Pipeline

The current platform operates as an edge-optimized, offline-first geospatial application. Spatial datasets are pre-processed into lightweight GeoJSON format and served directly to the client:

### 1. Spatial Datasets
* **Bus Stop Quality & Inventory:** 2,565 bus stops with coordinate geometries, local authority assignments, and presence-based scoring across 9 physical infrastructure indicators.
* **Administrative Boundaries:** GeoJSON boundaries covering **Kuala Lumpur (DBKL)**, **Putrajaya**, and all **9 Selangor Administrative Districts** (*Petaling, Gombak, Hulu Langat, Klang, Sepang, Kuala Langat, Kuala Selangor, Hulu Selangor, Sabak Bernam*).
* **Multimodal Rail Corridors:** Spatial alignments for major rapid transit lines (MRT Kajang, MRT Putrajaya, LRT Kelana Jaya, LRT Ampang/Sri Petaling, KL Monorail) to evaluate bus-rail feeder integration.

### 2. Infrastructure Quality Metric (0 to 9 Scale)
Each bus stop is scored on a 0–9 benchmark based on verified physical amenities:
* ☔ **Rain Shelter**
* 💡 **Night Street Lighting**
* 🪑 **Seating Bench**
* 🗑️ **Waste Bin**
* 🚸 **Safe Pedestrian Crossing / Zebra Crossing**
* 🛑 **Bus Stop Signboard / Pole**
* 🦯 **Tactile Paving**
* 〰️ **Rumble Strips**
* 🛣️ **Road Markings**

Stops are grouped into three quality tiers:
* 🔴 **Critical Deficit (< 3 / 9):** Severe infrastructure deficit; missing basic shelter or lighting.
* 🟡 **Moderate (3 – 5 / 9):** Partial amenities present; basic pole or partial canopy.
* 🟢 **Good (≥ 6 / 9):** Compliant, well-equipped transit stop.

---

## 🏗️ System Architecture

<!-- Architecture Diagram Placeholder: draw.io diagram to be inserted here -->
*(Architecture diagram will be inserted here)*

### Current Technical Implementation:
* **Frontend:** React 18 SPA built with Vite and TypeScript.
* **Cartography:** Leaflet.js with custom vector overlays, dynamic tile caching (`keepBuffer: 8`), and 6 selectable base maps (Google Streets, CARTO Positron, CARTO Dark Matter, Esri World Imagery, OpenStreetMap, Waze).
* **Scale-Dependent Generalization:** High-density point layers automatically declutter at overview zoom levels and reveal dynamically upon zooming in, searching, or selecting specific stations.
* **Real-Time Geocoding:** Dual-source spatial search combining instant local station matching with Photon OpenStreetMap geocoding biased to Greater KL coordinates.
* **Client-Side Persistence:** Commuter ratings and field notes persist locally in browser storage (`localStorage`), requiring zero backend setup for local evaluation.

---

## 📊 Core Features

1. **Interactive Cartography:** Explore 2,565 bus stops with color-coded quality indicators, administrative district perimeters, and optional rail corridors.
2. **Real-Time Neighborhood Search:** Search by station name, stop ID, or neighborhood (e.g., Bangsar, Mont Kiara, Cheras) to pan and activate station markers.
3. **Collapsible Stop Directory:** Filter stops by governing local council (DBKL, MBPJ, MBSJ, MBSA, etc.) and quality tier with responsive drawer controls.
4. **Commuter Field Audit:** View detailed amenity checklists per stop, record 1–5 star condition ratings, and submit field notes.
5. **Council Action Dossier:** One-click generation of structured complaint briefs and formal advocacy text for submission to local municipal councils and transport agencies.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18 or higher)
* **npm** or **yarn**

### Installation & Run

```bash
# 1. Clone repository
git clone https://github.com/maiakmal1610/mys-bus-mobility-audit.git
cd mys-bus-mobility-audit

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

The application will be running at `http://localhost:8081`.

### Build for Production

```bash
npm run build
```

Production output is generated in the `dist/` directory, ready for deployment to GitHub Pages or any static CDN host.
