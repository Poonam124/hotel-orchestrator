import { randomUUID } from "crypto";
import type { Client } from "@temporalio/client";
import type { Hotel, WorkflowMeta, WorkflowResult } from "../domain/types";
import type { HotelStore, PriceSort } from "../lib/redis";
import { hotelOfferWorkflow } from "../temporal/workflows";

export interface SearchOptions {
  minPrice?: number;
  maxPrice?: number;
  sort: PriceSort;
  limit: number;
  offset: number;
  refresh: boolean;
}

export interface SearchResult {
  hotels: Hotel[];
  total: number;
  source: "temporal" | "cache";
  meta: WorkflowMeta | null;
}

// The routes only depend on this interface, so tests can pass a fake
export interface HotelServicePort {
  bestOffers(city: string): Promise<WorkflowResult>;
  search(city: string, options: SearchOptions): Promise<SearchResult>;
}

export class HotelService implements HotelServicePort {
  constructor(private client: Client, private store: HotelStore, private taskQueue: string) {}

  // Always runs the Temporal workflow
  bestOffers(city: string): Promise<WorkflowResult> {
    return this.client.workflow.execute(hotelOfferWorkflow, {
      taskQueue: this.taskQueue,
      workflowId: `hotel-offers-${city}-${randomUUID()}`,
      workflowExecutionTimeout: "30 seconds",
      args: [city],
    });
  }

  // Runs the workflow only when Redis has no data yet (or refresh=true), then filters INSIDE Redis
  async search(city: string, o: SearchOptions): Promise<SearchResult> {
    let source: SearchResult["source"] = "cache";
    let meta: WorkflowMeta | null = null;

    if (o.refresh || !(await this.store.has(city))) {
      meta = (await this.bestOffers(city)).meta;
      source = "temporal";
    }

    const { hotels, total } = await this.store.query(city, {
      min: o.minPrice,
      max: o.maxPrice,
      sort: o.sort,
      limit: o.limit,
      offset: o.offset,
    });
    return { hotels, total, source, meta: meta ?? (await this.store.getMeta(city)) };
  }
}
