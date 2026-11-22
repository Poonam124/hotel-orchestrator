import { randomUUID } from "crypto";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import type { HealthReport } from "./lib/health";
import { logger } from "./lib/logger";
import { requireAuth } from "./middleware/auth";
import { errorHandler, notFound } from "./middleware/error";
import { createAdminRouter } from "./routes/admin";
import { createAuthRouter } from "./routes/auth";
import { createHealthRouter } from "./routes/health";
import { createHotelRouter } from "./routes/hotels";
import type { AuthServicePort } from "./services/authService";
import type { HotelServicePort } from "./services/hotelService";
import { createSupplierRouter } from "./suppliers/router";

interface Deps {
  hotelService: HotelServicePort;
  auth: AuthServicePort;
  getHealth: () => Promise<HealthReport>;
  enableAdmin: boolean;
}

export function createApp({ hotelService, auth, getHealth, enableAdmin }: Deps) {
  const app = express();
  app.disable("x-powered-by");

  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const id = (req.headers["x-request-id"] as string) || randomUUID();
        res.setHeader("x-request-id", id);
        return id;
      },
      autoLogging: { ignore: (req) => req.url === "/health" || req.url === "/live" },
    })
  );
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",") }));
  app.use(rateLimit({ windowMs: 60_000, limit: env.RATE_LIMIT_PER_MIN, standardHeaders: "draft-7", legacyHeaders: false }));
  app.use(express.json());

  // Public
  app.use(createHealthRouter(getHealth));
  app.use(createSupplierRouter());
  app.use(createAuthRouter(auth));

  // Needs login: everything under /admin  (and /api/hotels/search, see routes/hotels.ts)
  if (enableAdmin) {
    app.use("/admin", requireAuth);
    app.use(createAdminRouter());
  }

  app.use(createHotelRouter(hotelService));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
