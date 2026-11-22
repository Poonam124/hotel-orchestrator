import { NativeConnection, Worker } from "@temporalio/worker";
import { env } from "../config/env";
import { createRedis, HotelStore } from "../lib/redis";
import { logger } from "../lib/logger";
import { retry } from "../lib/retry";
import { createActivities } from "./activities";

async function run() {
  const connection = await retry("Temporal", () => NativeConnection.connect({ address: env.TEMPORAL_ADDRESS }));
  const redis = createRedis(env.REDIS_URL);
  const store = new HotelStore(redis, env.CACHE_TTL_SEC);

  const worker = await Worker.create({
    connection,
    namespace: env.TEMPORAL_NAMESPACE,
    taskQueue: env.TASK_QUEUE,
    workflowsPath: require.resolve("./workflows"),
    activities: createActivities({ store, baseUrl: env.SUPPLIER_BASE_URL, timeoutMs: env.SUPPLIER_TIMEOUT_MS }),
  });

  logger.info(`Worker started on task queue "${env.TASK_QUEUE}"`);
  await worker.run(); // stops gracefully on SIGINT/SIGTERM
  await redis.quit();
  await connection.close();
  logger.info("Worker stopped");
}

run().catch((err) => {
  logger.error({ err }, "Worker crashed");
  process.exit(1);
});
