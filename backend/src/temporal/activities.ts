import { ApplicationFailure, Context } from "@temporalio/activity";
import type { HotelStore } from "../lib/redis";
import type { Hotel, SupplierCode, SupplierHotel, WorkflowResult } from "../domain/types";

interface Deps {
  store: HotelStore;
  baseUrl: string;
  timeoutMs: number;
}

// Activities do all the I/O (HTTP, Redis). Workflows must stay deterministic.
export function createActivities(deps: Deps) {
  async function fetchSupplier(code: SupplierCode, city: string): Promise<Hotel[]> {
    const log = Context.current().log;
    const url = `${deps.baseUrl}/supplier${code}/hotels?city=${encodeURIComponent(city)}`;
    const startedAt = Date.now();

    let res: Response;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(deps.timeoutMs) });
    } catch (err) {
      throw new Error(`Supplier ${code} unreachable: ${(err as Error).message}`);
    }

    // 4xx = our request is wrong, retrying will not help
    if (res.status >= 400 && res.status < 500) {
      throw ApplicationFailure.nonRetryable(`Supplier ${code} rejected the request (${res.status})`);
    }
    if (!res.ok) throw new Error(`Supplier ${code} responded with ${res.status}`);

    const data = (await res.json()) as SupplierHotel[];
    log.info(`Supplier ${code} returned ${data.length} hotels in ${Date.now() - startedAt}ms`, { city });

    return data.map((h) => ({
      name: h.name,
      price: h.price,
      supplier: `Supplier ${code}`,
      commissionPct: h.commissionPct,
    }));
  }

  return {
    fetchSupplierA: (city: string) => fetchSupplier("A", city),
    fetchSupplierB: (city: string) => fetchSupplier("B", city),

    async saveResult(city: string, result: WorkflowResult): Promise<void> {
      await deps.store.save(city, result);
      Context.current().log.info(`Saved ${result.hotels.length} hotels to Redis`, { city });
    },
  };
}

export type Activities = ReturnType<typeof createActivities>;
