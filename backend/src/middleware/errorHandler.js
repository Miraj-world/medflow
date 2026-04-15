import { AppError } from "../utils/AppError.js";

export const notFoundHandler = (_req, _res, next) => {
  next(new AppError("Route not found.", 404));
};

export const errorHandler = (error, _req, res, _next) => {
  if (error?.message === "Origin not allowed by CORS") {
    return res.status(403).json({ message: error.message });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error?.code === "23505") {
    return res.status(409).json({ message: "A record with that value already exists." });
  }

  if (error?.code === "23503") {
    return res.status(400).json({ message: "Referenced record does not exist." });
  }

  console.error(error);
  return res.status(500).json({ message: "Internal server error." });
};
