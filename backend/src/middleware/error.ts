import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Express 4 does not catch rejected promises by itself
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = String(req.id ?? "");

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Invalid request",
      details: err.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      requestId,
    });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, requestId });
  }
  // Temporal workflow failed (e.g. all suppliers down)
  if (err?.name === "WorkflowFailedError") {
    req.log?.warn({ err: err.cause?.message }, "workflow failed");
    return res.status(502).json({ error: err.cause?.message ?? "Workflow failed", requestId });
  }
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON body", requestId });
  }

  req.log?.error({ err }, "unhandled error");
  res.status(500).json({ error: "Internal server error", requestId });
};
