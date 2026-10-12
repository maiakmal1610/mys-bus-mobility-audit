export interface BusStopAmenities {
  shelter: boolean;
  bench: boolean;
  street_light: boolean;
  trash_bin: boolean;
  zebra_crossing: boolean;
  stop_sign: boolean;
  board_sign: boolean;
  rumble_strips: boolean;
  bas_road_marking: boolean;
}

export interface BusStopProperties {
  stop_id: string;
  stop_name: string;
  council: string;
  quality_score: number;
  tier: string;
  color: string;
  amenities: BusStopAmenities;
  community_verified?: boolean;
  complaints_count?: number;
  verified_rating?: number;
  comments?: Array<{
    id: string;
    text: string;
    date: string;
    userRating: number;
  }>;
}

export interface BusStopFeature {
  type: "Feature";
  id: string;
  properties: BusStopProperties;
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lon, lat]
  };
}

export interface BusStopGeoJSON {
  type: "FeatureCollection";
  features: BusStopFeature[];
}

export interface RailLineProperties {
  name: string;
  line_code: string;
  color: string;
  mode: string;
}

export interface RailLineFeature {
  type: "Feature";
  properties: RailLineProperties;
  geometry: {
    type: "LineString";
    coordinates: number[][];
  };
}

export interface RailLineGeoJSON {
  type: "FeatureCollection";
  features: RailLineFeature[];
}

export interface BoundaryGeoJSON {
  type: "FeatureCollection";
  features: any[];
}
