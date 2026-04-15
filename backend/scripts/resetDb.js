import { fileURLToPath } from "url";

import { pool } from "../src/config/database.js";
import { runMigrations } from "./migrate.js";

const execute = async () => {
  const client = await pool.connect();

  try {
    await client.query("DROP SCHEMA public CASCADE");
    await client.query("CREATE SCHEMA public");
    await client.query("GRANT ALL ON SCHEMA public TO current_user");
    await client.query("GRANT ALL ON SCHEMA public TO public");
    console.log("Database schema reset.");
  } finally {
    client.release();
  }

  await runMigrations();
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  execute()
    .then(async () => {
      await pool.end();
    })
    .catch(async (error) => {
      console.error(error);
      await pool.end();
      process.exit(1);
    });
}
