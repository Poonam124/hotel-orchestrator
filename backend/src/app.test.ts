import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./app";
import { AuthService, User, UserRepo } from "./services/authService";
import type { HotelServicePort } from "./services/hotelService";
import { resetSuppliers } from "./suppliers/state";

const hotel = { name: "Holtin", price: 5340, supplier: "Supplier B", commissionPct: 20 };
const meta = {
  city: "delhi",
  suppliers: { A: { status: "ok" as const, count: 1 }, B: { status: "ok" as const, count: 1 } },
  totalOffers: 2,
  savings: [],
  generatedAt: new Date().toISOString(),
};

const fakeService: HotelServicePort = {
  bestOffers: async () => ({ hotels: [hotel], meta }),
  search: async () => ({ hotels: [hotel], total: 1, source: "cache", meta }),
};

const healthy = {
  status: "ok" as const,
  uptimeSec: 1,
  suppliers: { supplierA: { status: "up" as const, latencyMs: 1 }, supplierB: { status: "up" as const, latencyMs: 1 } },
  redis: "up" as const,
  temporal: "up" as const,
};

const memoryRepo = (): UserRepo => {
  const m = new Map<string, User>();
  return {
    create: async (u) => (m.has(u.email) ? false : (m.set(u.email, u), true)),
    findByEmail: async (e) => m.get(e) ?? null,
  };
};

const build = (getHealth = async () => healthy) =>
  createApp({ hotelService: fakeService, auth: new AuthService(memoryRepo()), getHealth, enableAdmin: true });

// Registers a user and returns the Authorization header value
async function login(app: ReturnType<typeof build>) {
  const res = await request(app)
    .post("/auth/register")
    .send({ name: "Test", email: "test@example.com", password: "password123" });
  return `Bearer ${res.body.token}`;
}

beforeEach(() => resetSuppliers());

describe("GET /api/hotels (public, from the assignment)", () => {
  it("returns a plain array", async () => {
    const res = await request(build()).get("/api/hotels?city=Delhi");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([hotel]);
  });

  it("uses Redis path when a price filter is given", async () => {
    const res = await request(build()).get("/api/hotels?city=delhi&minPrice=5000&maxPrice=6000");
    expect(res.status).toBe(200);
    expect(res.headers["x-data-source"]).toBe("cache");
  });

  it("requires city", async () => {
    const res = await request(build()).get("/api/hotels");
    expect(res.status).toBe(400);
  });

  it("rejects minPrice > maxPrice", async () => {
    const res = await request(build()).get("/api/hotels?city=delhi&minPrice=9000&maxPrice=5000");
    expect(res.status).toBe(400);
    expect(res.body.details[0].message).toMatch(/minPrice/);
  });

  it("rejects non-numeric prices", async () => {
    const res = await request(build()).get("/api/hotels?city=delhi&minPrice=abc");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/hotels/search (needs login)", () => {
  it("returns hotels with total, source and meta", async () => {
    const app = build();
    const auth = await login(app);
    const res = await request(app).get("/api/hotels/search?city=delhi&sort=price_desc&limit=10").set("Authorization", auth);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 1, source: "cache" });
  });

  it("validates sort", async () => {
    const app = build();
    const auth = await login(app);
    const res = await request(app).get("/api/hotels/search?city=delhi&sort=random").set("Authorization", auth);
    expect(res.status).toBe(400);
  });
});

describe("mock suppliers + failure simulation", () => {
  it("serves hotels per city", async () => {
    const res = await request(build()).get("/supplierA/hotels?city=delhi");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((h: { city: string }) => h.city === "delhi")).toBe(true);
  });

  it("returns [] for an unknown city", async () => {
    const res = await request(build()).get("/supplierB/hotels?city=atlantis");
    expect(res.body).toEqual([]);
  });

  it("can be switched down and restored (admin needs login)", async () => {
    const app = build();
    const auth = await login(app);
    await request(app).put("/admin/suppliers/A").set("Authorization", auth).send({ down: true }).expect(200);
    await request(app).get("/supplierA/hotels?city=delhi").expect(503);
    await request(app).post("/admin/suppliers/reset").set("Authorization", auth).expect(200);
    await request(app).get("/supplierA/hotels?city=delhi").expect(200);
  });

  it("validates admin input", async () => {
    const app = build();
    const auth = await login(app);
    await request(app).put("/admin/suppliers/A").set("Authorization", auth).send({ delayMs: -5 }).expect(400);
    await request(app).put("/admin/suppliers/Z").set("Authorization", auth).send({ down: true }).expect(400);
  });
});

describe("health", () => {
  it("live is always 200", async () => {
    await request(build()).get("/live").expect(200);
  });

  it("health is 503 when degraded", async () => {
    const app = build(async () => ({ ...healthy, status: "degraded" as const, redis: "down" as const }));
    const res = await request(app).get("/health");
    expect(res.status).toBe(503);
    expect(res.body.redis).toBe("down");
  });

  it("unknown route gives JSON 404", async () => {
    const res = await request(build()).get("/nope");
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});
