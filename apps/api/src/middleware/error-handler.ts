import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  next,
) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  // Body-parser errors must not expose the submitted body or parser details.
  const type =
    error !== null && typeof error === "object" && "type" in error
      ? error.type
      : undefined;

  if (type === "entity.parse.failed") {
    res.status(400).json({ error: { message: "Invalid JSON request body" } });
    return;
  }

  if (type === "entity.too.large") {
    res.status(413).json({ error: { message: "Request body is too large" } });
    return;
  }

  console.error("Unhandled request error:", error);
  res.status(500).json({ error: { message: "Internal server error" } });
};
