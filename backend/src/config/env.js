import dotenv from "dotenv";

dotenv.config({ quiet: true });

const toBool = (value, fallback = false) => {
  if (value === undefined) {
    return fallback;
  }

  return value === "true";
};

const splitOrigins = (value) =>
  value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 10000),
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  openAiApiKey: (process.env.OPENAI_API_KEY ?? "").trim(),
  databaseUseSsl: toBool(
    process.env.DATABASE_USE_SSL,
    process.env.NODE_ENV === "production"
  ),
  corsOrigins: splitOrigins(
    process.env.CORS_ORIGINS ?? process.env.FRONTEND_URL ?? "http://localhost:5173"
  ),
};

export const validateRuntimeEnv = () => {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  if (!env.jwtSecret) {
    throw new Error("JWT_SECRET is required.");
  }
};
