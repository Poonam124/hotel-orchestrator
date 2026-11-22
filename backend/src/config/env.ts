import "dotenv/config";
import { z } from "zod";

const DEV_SECRET = "dev-only-secret-change-me";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().default(3000),
  LOG_LEVEL: z.string().default("info"),
  CORS_ORIGIN: z.string().default("*"),
  RATE_LIMIT_PER_MIN: z.coerce.number().int().default(300),
  ENABLE_ADMIN: z.enum(["true", "false"]).default("true"),

  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters").default(DEV_SECRET),
  JWT_EXPIRES_IN: z.string().default("8h"),

  REDIS_URL: z.string().default("redis://localhost:6379"),
  CACHE_TTL_SEC: z.coerce.number().int().default(300),

  TEMPORAL_ADDRESS: z.string().default("localhost:7233"),
  TEMPORAL_NAMESPACE: z.string().default("default"),
  TASK_QUEUE: z.string().default("hotel-queue"),

  SUPPLIER_BASE_URL: z.string().default("http://localhost:3000"),
  SUPPLIER_TIMEOUT_MS: z.coerce.number().int().default(5000),
});

const parsed = schema.parse(process.env);
if (parsed.NODE_ENV === "production" && parsed.JWT_SECRET === DEV_SECRET) {
  throw new Error("JWT_SECRET must be set in production");
}
export const env = parsed;
