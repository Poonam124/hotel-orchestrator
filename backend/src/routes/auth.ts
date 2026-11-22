import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../middleware/error";
import { requireAuth } from "../middleware/auth";
import type { AuthServicePort } from "../services/authService";
import { loginBody, registerBody } from "./schemas";

export function createAuthRouter(auth: AuthServicePort) {
  const router = Router();

  // Slows down password guessing
  const limiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many attempts, please try again later" },
  });

  router.post(
    "/auth/register",
    limiter,
    asyncHandler(async (req, res) => {
      res.status(201).json(await auth.register(registerBody.parse(req.body)));
    })
  );

  router.post(
    "/auth/login",
    limiter,
    asyncHandler(async (req, res) => {
      res.json(await auth.login(loginBody.parse(req.body)));
    })
  );

  // Frontend calls this on page load to check that the saved token is still valid
  router.get(
    "/auth/me",
    requireAuth,
    asyncHandler(async (_req, res) => {
      res.json(await auth.me(res.locals.user.email));
    })
  );

  return router;
}
