import type { RequestHandler } from "express";
import { verifyToken } from "../lib/jwt";
import { AppError } from "./error";

// Put this before any route that needs a logged-in user.
// The user is then available as res.locals.user  ({ id, email })
export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const user = token ? verifyToken(token) : null;
  if (!user) return next(new AppError(401, "Authentication required"));
  res.locals.user = user;
  next();
};
