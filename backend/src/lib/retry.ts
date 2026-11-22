import { logger } from "./logger";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Used at startup: Temporal can take a while to become ready in Docker
export async function retry<T>(name: string, fn: () => Promise<T>, attempts = 20, delayMs = 3000): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i >= attempts) throw err;
      logger.warn({ err: (err as Error).message }, `${name} not ready (attempt ${i}/${attempts}), retrying...`);
      await sleep(delayMs);
    }
  }
}
