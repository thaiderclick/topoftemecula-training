// One-off: create the credentials table on the remote Postgres/Supabase DB.
// Reads DATABASE_URL from the environment (or a local .env file). Idempotent.
import { readFileSync } from "node:fs";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  try {
    const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
    for (const line of env.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* no .env file — rely on process env */
  }
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env or export it.");
  process.exit(1);
}

const sql = readFileSync(new URL("../drizzle/credentials.sql", import.meta.url), "utf8");

const pool = new Pool({
  connectionString: url,
  ssl: url.includes("supabase") || process.env.DATABASE_SSL === "true"
    ? { rejectUnauthorized: false }
    : false,
});

try {
  await pool.query(sql);
  const { rows } = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'credentials' ORDER BY ordinal_position`,
  );
  console.log("credentials table ready:");
  for (const r of rows) console.log(`  - ${r.column_name} (${r.data_type})`);
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
