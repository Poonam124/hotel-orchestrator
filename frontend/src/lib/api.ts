import type { Health, Hotel, SearchParams, SearchResult } from "./types";

const BASE = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export const api = {
  // The assignment endpoint: GET /api/hotels?city=delhi&minPrice=..&maxPrice=..  (plain array)
  hotels: async (p: SearchParams, signal?: AbortSignal): Promise<SearchResult> => {
    const q = new URLSearchParams({ city: p.city });
    if (p.minPrice !== undefined) q.set("minPrice", String(p.minPrice));
    if (p.maxPrice !== undefined) q.set("maxPrice", String(p.maxPrice));

    const res = await fetch(`${BASE}/api/hotels?${q}`, { signal });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const detail = body?.details?.[0]?.message;
      throw new ApiError(detail ?? body?.error ?? `Request failed (${res.status})`, res.status);
    }
    return {
      hotels: body as Hotel[],
      source: res.headers.get("X-Data-Source") === "cache" ? "cache" : "temporal",
    };
  },

  // /health answers 503 when something is down but the body is still useful
  health: async (): Promise<Health> => {
    const res = await fetch(`${BASE}/health`);
    return (await res.json()) as Health;
  },
};

