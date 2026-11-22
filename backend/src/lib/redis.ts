import Redis from "ioredis";
import { normalizeName } from "../domain/dedupe";
import type { Hotel, WorkflowMeta, WorkflowResult } from "../domain/types";

export const createRedis = (url: string) => new Redis(url, { maxRetriesPerRequest: 3 });

export type PriceSort = "price_asc" | "price_desc";

export interface QueryOptions {
  min?: number;
  max?: number;
  sort: PriceSort;
  limit: number;
  offset: number;
}

/**
 * Redis layout (per city):
 *   hotels:<city>        Sorted Set  score = price, member = hotel JSON
 *   hotels:<city>:meta   String      JSON (supplier status, savings...)
 * Price filtering/sorting/paging all happen INSIDE Redis (ZRANGEBYSCORE).
 */
export class HotelStore {
  constructor(private redis: ReturnType<typeof createRedis>, private ttlSec: number) {}

  private key = (city: string) => `hotels:${normalizeName(city)}`;
  private metaKey = (city: string) => `${this.key(city)}:meta`;

  async save(city: string, result: WorkflowResult): Promise<void> {
    const key = this.key(city);
    const tx = this.redis.multi().del(key).del(this.metaKey(city));
    if (result.hotels.length > 0) {
      const args: (string | number)[] = [];
      for (const h of result.hotels) args.push(h.price, JSON.stringify(h));
      tx.zadd(key, ...args).expire(key, this.ttlSec);
    }
    tx.set(this.metaKey(city), JSON.stringify(result.meta), "EX", this.ttlSec);
    await tx.exec();
  }

  // The meta key exists even for "no hotels" results, so empty cities are cached too
  async has(city: string): Promise<boolean> {
    return (await this.redis.exists(this.metaKey(city))) === 1;
  }

  async getMeta(city: string): Promise<WorkflowMeta | null> {
    const raw = await this.redis.get(this.metaKey(city));
    return raw ? (JSON.parse(raw) as WorkflowMeta) : null;
  }

  async query(city: string, o: QueryOptions): Promise<{ hotels: Hotel[]; total: number }> {
    const key = this.key(city);
    const lo = o.min ?? "-inf";
    const hi = o.max ?? "+inf";
    const [total, rows] = await Promise.all([
      this.redis.zcount(key, lo, hi),
      o.sort === "price_desc"
        ? this.redis.zrevrangebyscore(key, hi, lo, "LIMIT", o.offset, o.limit)
        : this.redis.zrangebyscore(key, lo, hi, "LIMIT", o.offset, o.limit),
    ]);
    return { total, hotels: rows.map((r) => JSON.parse(r) as Hotel) };
  }
}
