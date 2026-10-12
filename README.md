# 🚏 GKL Bus Mobility & Infrastructure Audit (GKL-Pulse)

> **A crowdsourced geospatial audit platform evaluating bus stop quality, accessibility, and multimodal rail transit connectivity across 2,565 stops in Greater Kuala Lumpur.**

[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900.svg?logo=leaflet&logoColor=white)](https://leafletjs.com)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![KRI Research](https://img.shields.io/badge/Research_Base-KRI_GKLMOB-8b5cf6.svg)](https://github.com/KRI-Data/GKLMOB-anatomy-of-busstops)

---

## 🎯 Executive Summary & Context

First-mile and last-mile connectivity remains the critical barrier to public transportation adoption across the Klang Valley. While billions have been invested in mega-rail lines (LRT, MRT, Monorail), neighborhood bus infrastructure suffers from chronic under-maintenance: missing rain shelters, broken seating, unlit walkways at night, and absent route timetables.

This project directly builds upon and levels up research initiated by the **Khazanah Research Institute (KRI)** under [GKLMOB-anatomy-of-busstops](https://github.com/KRI-Data/GKLMOB-anatomy-of-busstops):
* **From Model to Ground Truth:** Transforming KRI's static YOLOv8 computer-vision object detection dataset into a living, high-performance, interactive geospatial audit application.
* **Multimodal Integration:** Overlaying bus stops against Klang Valley **LRT & MRT rail transit corridors** and official **Kuala Lumpur city boundaries** to evaluate intermodal connectivity.
* **Human-in-the-Loop Crowdsourcing:** Empowering daily commuters to verify physical conditions, rate stops, submit ground-truth commentary, and generate actionable advocacy dossiers for local authorities (**DBKL, MBPJ, MBSA**) and **Prasarana Malaysia**.

---

## 🏗️ Architecture

```
Open Transit Data (KRI YOLOv8 + Rapid KL GTFS + geoBoundaries)
                       │
                       ▼
        Python Data Ingestion Pipeline
         (pipeline/extract_transit.py)
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
kl_bus_stops.geojson  kl_rail_lines   kl_boundary
  (2,565 stops)          (5 lines)     (DBKL ADM2)
       │               │               │
       └───────────────┼───────────────┘
                       ▼
       React 18 + Leaflet Interactive Geoportal
         • Multi-Basemap (Dark, Streets, Satellite)
         • Council & Quality Tier Filters
         • Crowdsourced Audit & Storage Engine
         • DBKL / Prasarana Complaint Slip Generator
```

---

## 📊 Core Features

1. **Multimodal Cartography:** Seamlessly visualizes 2,565 bus stops alongside MRT Kajang, MRT Putrajaya, LRT Kelana Jaya, LRT Ampang/Sri Petaling, and KL Monorail corridors.
2. **KRI Infrastructure Quality Scoring:** Every stop reflects presence-based scoring (0 to 9) across 9 physical elements (shelter, night lighting, bench, trash bin, zebra crossing, signage, rumble strips, road markings).
3. **Crowdsourced Condition Auditor:** Citizens can rate stop conditions (1–5 stars), flag broken amenities, and leave ground-reality notes persisted via local storage.
4. **Council Action Dossier:** One-click generation of structured complaint reports highlighting priority deficit stops for submission to DBKL, Prasarana, and APAD.

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Compile spatial data pipeline
python pipeline/extract_transit.py

# 3. Start local development server
npm run dev
```

Navigate to `http://localhost:8081` in your browser.
