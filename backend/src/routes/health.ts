import { Router } from "express";
import type { HealthReport } from "../lib/health";
import { asyncHandler } from "../middleware/error";

export function createHealthRouter(getHealth: () => Promise<HealthReport>) {
  const router = Router();

  // Liveness: is the process up? (used by Docker)
  router.get("/live", (_req, res) => res.json({ status: "ok" }));

  // Readiness: are suppliers, Redis and Temporal reachable?
  router.get(
    "/health",
    asyncHandler(async (_req, res) => {
      const report = await getHealth();
      res.status(report.status === "ok" ? 200 : 503).json(report);
    })
  );

  return router;
}
