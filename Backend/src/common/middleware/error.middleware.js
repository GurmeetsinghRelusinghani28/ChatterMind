import { logger } from "../../config/logger.js";

export function errorMiddleware(err, req, res, next) {
  logger.error(err.message, {
    path: req.originalUrl,
    method: req.method,
    stack: err.stack,
  });

  res.status(err.statusCode || 500).json({
    message: err.message || "Internal Server Error",
    code: err.code || "INTERNAL_ERROR",
  });
}
