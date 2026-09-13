const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export interface DistrictPrediction {
  district_id: string;
  district_name: string;
  risk_class: "Low" | "Medium" | "High";
  confidence: number;
  probabilities: { Low: number; Medium: number; High: number };
  raw_features: {
    rain_24h: number;
    rain_72h: number;
    river_level_ratio: number;
    reservoir_pct: number;
    reservoir_pct_is_live: boolean;
    soil_saturation: number;
    elevation: number;
    drainage_density: number;
    antecedent_rain_7d: number;
    distance_to_river: number;
    urban_fraction: number;
    slope: number;
  };
  top_risk_drivers: string[];
  recommended_actions: string[];
  timestamp: string;
}

export interface DashboardResponse {
  generated_at: string;
  summary: {
    high_risk_count: number;
    medium_risk_count: number;
    low_risk_count: number;
  };
  districts: DistrictPrediction[];
}

export interface District {
  id: string;
  name: string;
  river: string;
  risk_factor: string;
  lat: number;
  lon: number;
  elevation_m: number;
  slope_deg: number;
  drainage_density: number;
  urban_fraction: number;
  distance_to_river_m: number;
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await fetch(`${BACKEND_URL}/dashboard`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch dashboard");
  return res.json();
}

export async function fetchLocations(): Promise<{ districts: District[] }> {
  const res = await fetch(`${BACKEND_URL}/locations`);
  if (!res.ok) throw new Error("Failed to fetch locations");
  return res.json();
}

export async function fetchAlerts() {
  const res = await fetch(`${BACKEND_URL}/alerts`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

export async function fetchHistorical(districtId: string, days = 7) {
  const res = await fetch(
    `${BACKEND_URL}/historical/${districtId}?days=${days}`
  );
  if (!res.ok) throw new Error("Failed to fetch historical data");
  return res.json();
}

export interface DamInfo {
  name: string;
  official_name: string;
  storage_pct: number | null;
  water_level: number | null;
  date: string | null;
  remarks: string;
}

export interface DistrictDamData {
  reservoir_pct: number | null;
  dams: DamInfo[];
}

export async function fetchDams(): Promise<{
  generated_at: string;
  by_district: Record<string, DistrictDamData>;
}> {
  const res = await fetch(`${BACKEND_URL}/dams`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch dam data");
  return res.json();
}

export interface RainfallGridPoint {
  lat: number;
  lon: number;
  rain_24h: number;
}

export async function fetchRainfallGrid(): Promise<{
  generated_at: string;
  points: RainfallGridPoint[];
}> {
  const res = await fetch(`${BACKEND_URL}/rainfall-grid`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch rainfall grid");
  return res.json();
}

export function getReportUrl(districtId: string): string {
  return `${BACKEND_URL}/report/${districtId}`;
}

export { BACKEND_URL };
