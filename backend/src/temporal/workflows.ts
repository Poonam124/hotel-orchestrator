import { ApplicationFailure, log, proxyActivities } from "@temporalio/workflow";
import { dedupeBestOffers } from "../domain/dedupe";
import type { Hotel, SupplierStatus, WorkflowResult } from "../domain/types";
import type { Activities } from "./activities";

const { fetchSupplierA, fetchSupplierB, saveResult } = proxyActivities<Activities>({
  startToCloseTimeout: "10 seconds",
  retry: { maximumAttempts: 3, initialInterval: "500ms", backoffCoefficient: 2 },
});

function settle(code: string, r: PromiseSettledResult<Hotel[]>): { status: SupplierStatus; offers: Hotel[] } {
  if (r.status === "fulfilled") {
    return { status: { status: "ok", count: r.value.length }, offers: r.value };
  }
  const reason = r.reason as { message?: string; cause?: { message?: string } };
  const error = reason?.cause?.message ?? reason?.message ?? String(r.reason);
  log.warn(`Supplier ${code} failed after retries`, { error });
  return { status: { status: "failed", count: 0, error }, offers: [] };
}

export async function hotelOfferWorkflow(city: string): Promise<WorkflowResult> {
  // 1. Call both suppliers in parallel; one supplier failing must not fail the request
  const [a, b] = await Promise.allSettled([fetchSupplierA(city), fetchSupplierB(city)]);
  const A = settle("A", a);
  const B = settle("B", b);

  if (A.status.status === "failed" && B.status.status === "failed") {
    throw ApplicationFailure.nonRetryable("All suppliers failed", "AllSuppliersFailed");
  }

  // 2. Dedupe by hotel name, cheapest wins
  const offers = [...A.offers, ...B.offers];
  const { hotels, savings } = dedupeBestOffers(offers);

  const result: WorkflowResult = {
    hotels,
    meta: {
      city,
      suppliers: { A: A.status, B: B.status },
      totalOffers: offers.length,
      savings,
      generatedAt: new Date().toISOString(),
    },
  };

  // 3. Save to Redis (sorted set by price)
  await saveResult(city, result);
  return result;
}
