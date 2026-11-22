// Same shape as the assignment's response: [{ name, price, supplier, commissionPct }]
export interface Hotel {
  name: string;
  price: number;
  supplier: string;
  commissionPct: number;
}

export interface SearchParams {
  city: string;
  minPrice?: number;
  maxPrice?: number;
}

// "temporal" = workflow ran, "cache" = answered from Redis (read from the X-Data-Source header)
export type Source = "temporal" | "cache";

export interface SearchResult {
  hotels: Hotel[];
  source: Source;
}

// /health (bonus): both suppliers + Redis + Temporal
export interface Probe {
  status: "up" | "down";
  latencyMs: number;
}

export interface Health {
  status: string;
  uptimeSec: number;
  suppliers: { supplierA: Probe; supplierB: Probe };
  redis: "up" | "down";
  temporal: "up" | "down";
}

// UI-only
export type SortKey = "price_asc" | "price_desc" | "commission_desc" | "name_asc";
export type ViewMode = "grid" | "list";
export interface HistoryItem {
  id: number;
  city: string;
  count: number;
  ms: number;
  source: Source;
  at: string;
}