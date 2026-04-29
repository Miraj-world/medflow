import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";

import { swaggerSpec } from "../swagger.js";
import { env } from "./config/env.js";
import { query } from "./config/database.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { apiRouter } from "./routes/index.js";

export const app = express();
const swaggerUiOptions = {
  explorer: true,
  customSiteTitle: "MedFlow API Docs",
  swaggerOptions: {
    url: "/api-docs.json",
  },
};
const swaggerUiAssets = swaggerUi.serveFiles(null, swaggerUiOptions);
const swaggerUiHtml = swaggerUi
  .generateHTML(null, swaggerUiOptions)
  .replaceAll("./swagger-ui.css", "/api-docs/swagger-ui.css")
  .replaceAll("./swagger-ui-bundle.js", "/api-docs/swagger-ui-bundle.js")
  .replaceAll(
    "./swagger-ui-standalone-preset.js",
    "/api-docs/swagger-ui-standalone-preset.js"
  )
  .replaceAll("./swagger-ui-init.js", "/api-docs/swagger-ui-init.js")
  .replaceAll("./favicon-32x32.png", "/api-docs/favicon-32x32.png")
  .replaceAll("./favicon-16x16.png", "/api-docs/favicon-16x16.png");

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/health", async (_req, res, next) => {
  try {
    await query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    next(error);
  }
});

app.get("/api-docs.json", (_req, res) => {
  res.json(swaggerSpec);
});

app.get("/api-docs", (_req, res) => {
  res.send(swaggerUiHtml);
});

app.get("/api-docs/", (_req, res) => {
  res.send(swaggerUiHtml);
});

app.use("/api-docs", ...swaggerUiAssets);

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
