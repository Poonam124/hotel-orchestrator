import { z } from "zod";

const optionalNumber = z.preprocess(
  (v) => (v === undefined || v === "" ? undefined : v),
  z.coerce.number().min(0).optional()
);

const city = z
  .string({ required_error: "city is required" })
  .trim()
  .min(1, "city is required")
  .max(60)
  .transform((s) => s.toLowerCase());

const rangeOk = (q: { minPrice?: number; maxPrice?: number }) =>
  q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice;
const rangeError = { message: "minPrice cannot be greater than maxPrice", path: ["minPrice"] };

const base = z.object({ city, minPrice: optionalNumber, maxPrice: optionalNumber });

// GET /api/hotels
export const hotelsQuery = base.refine(rangeOk, rangeError);

// GET /api/hotels/search (used by the frontend)
export const searchQuery = base
  .extend({
    sort: z.enum(["price_asc", "price_desc"]).default("price_asc"),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    refresh: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
  })
  .refine(rangeOk, rangeError);

// PUT /admin/suppliers/:code
export const supplierPatch = z
  .object({
    down: z.boolean().optional(),
    delayMs: z.number().int().min(0).max(10000).optional(),
    failureRate: z.number().min(0).max(100).optional(),
  })
  .strict();

// ---- auth ----
const email = z
  .string({ required_error: "email is required" })
  .trim()
  .toLowerCase()
  .email("Enter a valid email")
  .max(120);

// bcrypt only uses the first 72 bytes, so cap the length
const password = z
  .string({ required_error: "password is required" })
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long");

export const registerBody = z.object({
  name: z.string({ required_error: "name is required" }).trim().min(1, "Name is required").max(60),
  email,
  password,
});

export const loginBody = z.object({
  email,
  password: z.string({ required_error: "password is required" }).min(1, "password is required").max(72),
});
