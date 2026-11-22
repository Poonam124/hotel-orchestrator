import type { Hotel, Saving } from "./types";

export const normalizeName = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase();

/**
 * Pure business logic (easy to unit test, safe to use inside a Temporal workflow).
 * Groups offers by normalized hotel name and keeps the cheapest one.
 * On equal price the supplier name decides, so the result is always stable.
 * Change the sort below if you want a different tie-break (e.g. lower commission).
 */
export function dedupeBestOffers(offers: Hotel[]): { hotels: Hotel[]; savings: Saving[] } {
  const groups = new Map<string, Hotel[]>();
  for (const offer of offers) {
    const key = normalizeName(offer.name);
    const group = groups.get(key);
    if (group) group.push(offer);
    else groups.set(key, [offer]);
  }

  const hotels: Hotel[] = [];
  const savings: Saving[] = [];

  for (const group of groups.values()) {
    const sorted = [...group].sort((a, b) => a.price - b.price || a.supplier.localeCompare(b.supplier));
    const best = sorted[0];
    hotels.push(best);

    const other = sorted.find((o) => o.supplier !== best.supplier);
    if (other) {
      savings.push({
        name: best.name,
        chosenSupplier: best.supplier,
        chosenPrice: best.price,
        otherSupplier: other.supplier,
        otherPrice: other.price,
        saved: other.price - best.price,
      });
    }
  }

  hotels.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
  return { hotels, savings };
}
