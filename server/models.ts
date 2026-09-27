/**
 * server/models.ts
 * Data structures, constants, and types for AiRa India Airfare Intelligence.
 */

export interface CorridorInfo {
  name: string;
  weight: number;
  airports: Set<string>;
}

export const DGCA_CORRIDORS: Record<string, CorridorInfo> = {
  'DEL-BOM': {
    name: 'Delhi – Mumbai',
    weight: 0.2958,
    airports: new Set(['DEL', 'BOM']),
  },
  'DEL-BLR': {
    name: 'Delhi – Bengaluru',
    weight: 0.2021,
    airports: new Set(['DEL', 'BLR']),
  },
  'BOM-BLR': {
    name: 'Mumbai – Bengaluru',
    weight: 0.1776,
    airports: new Set(['BOM', 'BLR']),
  },
  'DEL-CCU': {
    name: 'Delhi – Kolkata',
    weight: 0.1196,
    airports: new Set(['DEL', 'CCU']),
  },
  'MAA-DEL': {
    name: 'Chennai – Delhi',
    weight: 0.1059,
    airports: new Set(['MAA', 'DEL']),
  },
  'BLR-HYD': {
    name: 'Bengaluru – Hyderabad',
    weight: 0.0990,
    airports: new Set(['BLR', 'HYD']),
  },
};

export const CITIES: Record<string, string> = {
  DEL: 'Delhi',
  BOM: 'Mumbai',
  MAA: 'Chennai',
  BLR: 'Bengaluru',
  HYD: 'Hyderabad',
  CCU: 'Kolkata',
  COK: 'Kochi',
  GOI: 'Goa',
  AMD: 'Ahmedabad',
  PNQ: 'Pune',
  JAI: 'Jaipur',
  LKO: 'Lucknow',
  IXC: 'Chandigarh',
  ATQ: 'Amritsar',
  VTZ: 'Visakhapatnam',
  IXB: 'Bagdogra',
  GAU: 'Guwahati',
  BBI: 'Bhubaneswar',
  PAT: 'Patna',
  IDR: 'Indore',
  NAG: 'Nagpur',
  SXR: 'Srinagar',
  TRV: 'Thiruvananthapuram',
  RPR: 'Raipur',
  VNS: 'Varanasi',
};

export function normalizeCorridor(origin: string, destination: string): string {
  const o = origin.trim().toUpperCase();
  const d = destination.trim().toUpperCase();
  for (const [code, info] of Object.entries(DGCA_CORRIDORS)) {
    if (info.airports.has(o) && info.airports.has(d)) {
      return code;
    }
  }
  return [o, d].sort().join('-');
}

export interface FlightFare {
  provider: string;
  search_timestamp: string;
  origin: string;
  destination: string;
  travel_date: string;
  advance_purchase_days?: number;
  airline: string;
  flight_number: string;
  departure_datetime: string;
  arrival_datetime: string;
  duration_minutes?: number;
  stops: number;
  cabin_class?: string;
  base_fare?: number | null;
  taxes?: number | null;
  udf?: number | null;
  user_development_fee?: number | null;
  convenience_fee?: number | null;
  total_fare: number;
  availability_status?: string;
  currency?: string;
  retrieval_method?: string;
  validation_status?: string;
  platform?: string;
  source?: string;
}

export interface DailyFareTrend {
  provider: string;
  search_timestamp: string;
  origin: string;
  destination: string;
  travel_date: string;
  advance_purchase_days: number;
  lowest_fare: number;
  airline?: string;
  currency?: string;
}

export interface ScrapeRequest {
  origin: string;
  destination: string;
  dates: string[];
  time_from?: string;
  time_to?: string;
  cabin_class?: string;
}

export interface CalendarRequest {
  origin: string;
  destination: string;
  months_ahead?: number;
}

export interface SimulateRequest {
  fuel_delta_pct?: number;
  demand_delta_pct?: number;
  capacity_delta_pct?: number;
}
