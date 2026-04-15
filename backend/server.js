import { app } from "./src/app.js";
import { env, validateRuntimeEnv } from "./src/config/env.js";
import { pool } from "./src/config/database.js";

validateRuntimeEnv();

const server = app.listen(env.port, "0.0.0.0", () => {
  console.log(`MedFlow API listening on 0.0.0.0:${env.port}`);
});

const shutdown = async (signal) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
