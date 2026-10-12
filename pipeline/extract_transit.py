"""
Klang Valley Bus Mobility & Transit Infrastructure Pipeline
-----------------------------------------------------------
1. Pulls KRI's bus stop object detection & scoring dataset (Klang Valley)
2. Extracts official Kuala Lumpur ADM2 boundary polygon
3. Generates vector transit corridors for MRT & LRT lines
4. Compiles high-performance GeoJSON assets for the frontend
"""

import json
import urllib.request
import csv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = BASE_DIR / "public" / "data"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

ADM1_INPUT = Path("C:/Users/DataMicron/Desktop/kri/data/boundaries/geoBoundaries-MYS-ADM1.geojson")
ADM2_INPUT = Path("C:/Users/DataMicron/Desktop/kri/data/boundaries/geoBoundaries-MYS-ADM2.geojson")
KRI_CSV_URL = "https://raw.githubusercontent.com/KRI-Data/GKLMOB-anatomy-of-busstops/main/busstop_quality_with_coordinates.csv"

def extract_kl_boundary():
    print("1. Extracting Kuala Lumpur, Putrajaya, and 9 Selangor District boundaries...")
    selangor_districts = {
        "petaling": {"name": "Daerah Petaling", "councils": "MBPJ, MBSA, MBSJ (Petaling Jaya, Shah Alam, Subang Jaya)"},
        "gombak": {"name": "Daerah Gombak", "councils": "MPS, MPAJ (Selayang, Rawang, Batu Caves)"},
        "ulu langat": {"name": "Daerah Hulu Langat", "councils": "MPKj, MPAJ (Kajang, Ampang, Cheras, Bangi)"},
        "klang": {"name": "Daerah Klang", "councils": "MBDK (Klang, Port Klang, Kapar)"},
        "sepang": {"name": "Daerah Sepang", "councils": "MP Sepang (Cyberjaya, KLIA, Dengkil)"},
        "kuala langat": {"name": "Daerah Kuala Langat", "councils": "MPKL (Banting, Telok Panglima Garang)"},
        "kuala selangor": {"name": "Daerah Kuala Selangor", "councils": "MPKS (Kuala Selangor, Ijok)"},
        "ulu selangor": {"name": "Daerah Hulu Selangor", "councils": "MPHS (Kuala Kubu Bharu, Serendah)"},
        "sabak bernam": {"name": "Daerah Sabak Bernam", "councils": "MDSB (Sabak Bernam, Sungai Besar)"},
    }

    features = []

    # 1. Load ADM2 for Kuala Lumpur & individual Selangor Districts
    if ADM2_INPUT.exists():
        with open(ADM2_INPUT, "r", encoding="utf-8") as f:
            adm2_data = json.load(f)
        for feat in adm2_data["features"]:
            raw_name = feat["properties"].get("shapeName", "").strip()
            nl = raw_name.lower()
            if nl == "kuala lumpur":
                feat["properties"]["displayName"] = "Dewan Bandaraya Kuala Lumpur (DBKL)"
                feat["properties"]["category"] = "kuala_lumpur"
                feat["properties"]["jurisdiction"] = "Federal Territory / DBKL"
                features.append(feat)
            elif nl in selangor_districts:
                meta = selangor_districts[nl]
                feat["properties"]["displayName"] = meta["name"]
                feat["properties"]["category"] = "selangor_district"
                feat["properties"]["jurisdiction"] = f"Selangor • {meta['councils']}"
                features.append(feat)

    # 2. Load ADM1 for Putrajaya
    if ADM1_INPUT.exists():
        with open(ADM1_INPUT, "r", encoding="utf-8") as f:
            adm1_data = json.load(f)
        for feat in adm1_data["features"]:
            raw_name = feat["properties"].get("shapeName", "").strip()
            if raw_name.lower() == "putrajaya":
                feat["properties"]["displayName"] = "Perbadanan Putrajaya"
                feat["properties"]["category"] = "putrajaya"
                feat["properties"]["jurisdiction"] = "Federal Territory / Putrajaya"
                features.append(feat)

    out_boundary = {
        "type": "FeatureCollection",
        "metadata": {
            "title": "Kuala Lumpur, Putrajaya & Selangor District Boundaries",
            "total_districts": len(features)
        },
        "features": features
    }

    out_path = OUTPUT_DIR / "kl_boundary.geojson"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out_boundary, f, ensure_ascii=False)
    print(f"   Saved boundaries: {out_path} ({len(features)} features: KL, Putrajaya, 9 Selangor Districts)")

def extract_bus_stops():
    print("2. Downloading & processing KRI bus stop detection dataset...")
    req = urllib.request.urlopen(KRI_CSV_URL)
    csv_text = req.read().decode("utf-8")
    lines = csv_text.splitlines()

    reader = csv.DictReader(lines)
    features = []

    for row in reader:
        try:
            lon = float(row.get("final_lon", 0))
            lat = float(row.get("final_lat", 0))
            if lat == 0 or lon == 0:
                continue

            score = float(row.get("quality_score", 0))
            stop_id = row.get("stop_id", "").strip()
            stop_name = row.get("stop_name", "").strip()

            # Identify local jurisdiction council from prefix
            prefix = stop_name[:2].upper()
            if prefix == "KL":
                council = "DBKL (Kuala Lumpur)"
            elif prefix == "PJ":
                council = "MBPJ (Petaling Jaya)"
            elif prefix == "SA":
                council = "MBSA (Shah Alam)"
            elif prefix == "SJ":
                council = "MBSJ (Subang Jaya)"
            elif prefix == "AJ":
                council = "MPAJ (Ampang Jaya)"
            elif prefix == "SL":
                council = "MPS (Selayang)"
            elif prefix == "KJ":
                council = "MPKj (Kajang)"
            else:
                council = "Greater Klang Valley"

            amenities = {
                "shelter": int(row.get("shelter", 0)) > 0,
                "bench": int(row.get("bench", 0)) > 0,
                "street_light": int(row.get("street_light", 0)) > 0,
                "trash_bin": int(row.get("trash_bin", 0)) > 0,
                "zebra_crossing": int(row.get("zebra_crossing", 0)) > 0,
                "stop_sign": int(row.get("stop_sign", 0)) > 0,
                "board_sign": int(row.get("board_sign", 0)) > 0,
                "rumble_strips": int(row.get("rumble_strips", 0)) > 0,
                "bas_road_marking": int(row.get("bas_road_marking", 0)) > 0,
            }

            # Quality Tier
            if score >= 6.0:
                tier = "Good Infrastructure (≥6)"
                color = "#10b981"  # Emerald
            elif score >= 3.0:
                tier = "Moderate Infrastructure (3-5)"
                color = "#f59e0b"  # Amber
            else:
                tier = "Deficient / Critical (<3)"
                color = "#ef4444"  # Red

            props = {
                "stop_id": stop_id,
                "stop_name": stop_name,
                "council": council,
                "quality_score": score,
                "tier": tier,
                "color": color,
                "amenities": amenities,
                # Default crowdsource counters
                "community_verified": False,
                "complaints_count": 0,
                "verified_rating": score,
            }

            features.append({
                "type": "Feature",
                "id": stop_id,
                "properties": props,
                "geometry": {
                    "type": "Point",
                    "coordinates": [lon, lat]
                }
            })
        except Exception as e:
            continue

    out_stops = {
        "type": "FeatureCollection",
        "metadata": {
            "source": "KRI Data (GKLMOB-anatomy-of-busstops)",
            "total_stops": len(features)
        },
        "features": features
    }

    out_path = OUTPUT_DIR / "kl_bus_stops.geojson"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out_stops, f, ensure_ascii=False)
    print(f"   Saved {len(features)} bus stops to: {out_path}")

def generate_rail_lines():
    print("3. Generating Klang Valley Rail Transit Corridors...")
    # Major rail alignment coordinate vertices (Key corridors across Klang Valley)
    rail_lines = [
        {
            "name": "LRT Kelana Jaya Line",
            "line_code": "KJ",
            "color": "#da291c",
            "mode": "Light Rapid Transit",
            "coords": [
                [101.591, 3.113], [101.603, 3.111], [101.621, 3.107], [101.644, 3.112],
                [101.666, 3.115], [101.686, 3.134], [101.694, 3.142], [101.696, 3.152],
                [101.711, 3.158], [101.725, 3.174], [101.737, 3.205], [101.734, 3.237]
            ]
        },
        {
            "name": "MRT Kajang Line",
            "line_code": "KG",
            "color": "#007a3d",
            "mode": "Mass Rapid Transit",
            "coords": [
                [101.583, 3.149], [101.615, 3.149], [101.644, 3.146], [101.666, 3.144],
                [101.686, 3.144], [101.708, 3.146], [101.725, 3.133], [101.745, 3.103],
                [101.762, 3.064], [101.776, 3.018], [101.791, 2.993]
            ]
        },
        {
            "name": "MRT Putrajaya Line",
            "line_code": "PY",
            "color": "#eab308",
            "mode": "Mass Rapid Transit",
            "coords": [
                [101.597, 3.197], [101.642, 3.210], [101.670, 3.205], [101.687, 3.176],
                [101.705, 3.171], [101.718, 3.157], [101.708, 3.134], [101.698, 3.115],
                [101.706, 3.048], [101.695, 2.975], [101.680, 2.926]
            ]
        },
        {
            "name": "LRT Ampang & Sri Petaling Line",
            "line_code": "AG/SP",
            "color": "#f97316",
            "mode": "Light Rapid Transit",
            "coords": [
                [101.695, 3.171], [101.694, 3.153], [101.696, 3.149], [101.712, 3.125],
                [101.710, 3.072], [101.697, 3.057], [101.661, 3.023], [101.584, 3.028]
            ]
        },
        {
            "name": "KL Monorail",
            "line_code": "MR",
            "color": "#84bd00",
            "mode": "Monorail",
            "coords": [
                [101.686, 3.134], [101.694, 3.141], [101.709, 3.146], [101.712, 3.157],
                [101.703, 3.167], [101.696, 3.172]
            ]
        }
    ]

    features = []
    for r in rail_lines:
        features.append({
            "type": "Feature",
            "properties": {
                "name": r["name"],
                "line_code": r["line_code"],
                "color": r["color"],
                "mode": r["mode"],
            },
            "geometry": {
                "type": "LineString",
                "coordinates": r["coords"]
            }
        })

    out_rail = {
        "type": "FeatureCollection",
        "features": features
    }

    out_path = OUTPUT_DIR / "kl_rail_lines.geojson"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out_rail, f, ensure_ascii=False)
    print(f"   Saved {len(features)} rail lines to: {out_path}")

if __name__ == "__main__":
    extract_kl_boundary()
    extract_bus_stops()
    generate_rail_lines()
    print("Done! All spatial assets compiled.")
