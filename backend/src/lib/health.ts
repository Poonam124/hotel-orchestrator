import type { NativeConnection } from "@temporalio/worker";
import type { Connection } from "@temporalio/client";
import type { createRedis } from "./redis";

type Up = "up" | "down";
export interface Probe { status: Up; latencyMs: number }
export interface HealthReport {
  status: "ok" | "degraded";
  uptimeSec: number;
  suppliers: { supplierA: Probe; supplierB: Probe };
  redis: Up;
  temporal: Up;
}

interface Deps {
  redis: ReturnType<typeof createRedis>;
  temporal: Connection | NativeConnection;
  supplierBaseUrl: string;
}

export function buildHealthCheck({ redis, temporal, supplierBaseUrl }: Deps) {
  const probe = async (code: "A" | "B"): Promise<Probe> => {
    const startedAt = Date.now();
    try {
      const res = await fetch(`${supplierBaseUrl}/supplier${code}/hotels?city=delhi`, {
        signal: AbortSignal.timeout(3000),
      });
      return { status: res.ok ? "up" : "down", latencyMs: Date.now() - startedAt };
    } catch {
      return { status: "down", latencyMs: Date.now() - startedAt };
    }
  };

  return async (): Promise<HealthReport> => {
    const [supplierA, supplierB, redisStatus, temporalStatus] = await Promise.all([
      probe("A"),
      probe("B"),
      redis.ping().then((): Up => "up").catch((): Up => "down"),
      (temporal as Connection).workflowService
        .getSystemInfo({})
        .then((): Up => "up")
        .catch((): Up => "down"),
    ]);
    const healthy = [supplierA.status, supplierB.status, redisStatus, temporalStatus].every((s) => s === "up");
    return {
      status: healthy ? "ok" : "degraded",
      uptimeSec: Math.round(process.uptime()),
      suppliers: { supplierA, supplierB },
      redis: redisStatus,
      temporal: temporalStatus,
    };
  };
}
