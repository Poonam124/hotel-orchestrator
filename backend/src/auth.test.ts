import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app";
import { AuthService, User, UserRepo } from "./services/authService";
import type { HotelServicePort } from "./services/hotelService";

const memoryRepo = (): UserRepo => {
  const m = new Map<string, User>();
  return {
    create: async (u) => (m.has(u.email) ? false : (m.set(u.email, u), true)),
    findByEmail: async (e) => m.get(e) ?? null,
  };
};

const unused = {} as HotelServicePort;
const health = async () => ({
  status: "ok" as const, uptimeSec: 1,
  suppliers: { supplierA: { status: "up" as const, latencyMs: 1 }, supplierB: { status: "up" as const, latencyMs: 1 } },
  redis: "up" as const, temporal: "up" as const,
});
const build = () => createApp({ hotelService: unused, auth: new AuthService(memoryRepo()), getHealth: health, enableAdmin: true });

const creds = { name: "Poonam", email: "poonam@example.com", password: "password123" };

describe("register", () => {
  it("creates an account and returns a token without the password hash", async () => {
    const res = await request(build()).post("/auth/register").send(creds);
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: creds.email, name: creds.name });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|password123/);
  });

  it("normalizes the email (case / spaces)", async () => {
    const app = build();
    await request(app).post("/auth/register").send({ ...creds, email: "  POONAM@Example.com " }).expect(201);
    await request(app).post("/auth/login").send({ email: creds.email, password: creds.password }).expect(200);
  });

  it("rejects a duplicate email with 409", async () => {
    const app = build();
    await request(app).post("/auth/register").send(creds).expect(201);
    await request(app).post("/auth/register").send(creds).expect(409);
  });

  it("validates input", async () => {
    const app = build();
    await request(app).post("/auth/register").send({ ...creds, password: "short" }).expect(400);
    await request(app).post("/auth/register").send({ ...creds, email: "nope" }).expect(400);
    await request(app).post("/auth/register").send({ email: creds.email, password: creds.password }).expect(400);
  });
});

describe("login", () => {
  it("returns a token for correct credentials", async () => {
    const app = build();
    await request(app).post("/auth/register").send(creds);
    const res = await request(app).post("/auth/login").send({ email: creds.email, password: creds.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it("gives the same 401 for a wrong password and an unknown email", async () => {
    const app = build();
    await request(app).post("/auth/register").send(creds);
    const wrong = await request(app).post("/auth/login").send({ email: creds.email, password: "wrong-password" });
    const unknown = await request(app).post("/auth/login").send({ email: "nobody@example.com", password: "password123" });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error).toBe(unknown.body.error);
  });
});

describe("protected routes", () => {
  it("/auth/me returns the current user", async () => {
    const app = build();
    const { body } = await request(app).post("/auth/register").send(creds);
    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(creds.email);
  });

  it("rejects missing, malformed and tampered tokens", async () => {
    const app = build();
    const { body } = await request(app).post("/auth/register").send(creds);
    await request(app).get("/auth/me").expect(401);
    await request(app).get("/auth/me").set("Authorization", "Bearer garbage").expect(401);
    await request(app).get("/auth/me").set("Authorization", `Bearer ${body.token}x`).expect(401);
  });

  it("/api/hotels/search and /admin need a token, /api/hotels and /health do not", async () => {
    const app = build();
    await request(app).get("/api/hotels/search?city=delhi").expect(401);
    await request(app).get("/admin/suppliers").expect(401);
    await request(app).get("/health").expect(200);
    await request(app).get("/supplierA/hotels?city=delhi").expect(200);
  });
});
