import { createApp } from "./app";
import { env } from "./config/env";
import { buildHealthCheck } from "./lib/health";
import { logger } from "./lib/logger";
import { createRedis, HotelStore } from "./lib/redis";
import { createTemporalClient } from "./lib/temporal";
import { UserStore } from "./lib/userStore";
import { AuthService } from "./services/authService";
import { HotelService } from "./services/hotelService";

async function main() {
  const { client, connection } = await createTemporalClient();
  const redis = createRedis(env.REDIS_URL);
  const store = new HotelStore(redis, env.CACHE_TTL_SEC);

  const app = createApp({
    hotelService: new HotelService(client, store, env.TASK_QUEUE),
    auth: new AuthService(new UserStore(redis)),
    getHealth: buildHealthCheck({ redis, temporal: connection, supplierBaseUrl: env.SUPPLIER_BASE_URL }),
    enableAdmin: env.ENABLE_ADMIN === "true",
  });

  const server = app.listen(env.PORT, () => logger.info(`API listening on http://localhost:${env.PORT}`));

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    server.close();
    await redis.quit().catch(() => undefined);
    await connection.close().catch(() => undefined);
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error({ err }, "API failed to start");
  process.exit(1);
});
