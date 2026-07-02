// Apply a SQL migration file to the CRM database (DATABASE_URL).
// Usage: node scripts/apply-migration.mjs drizzle/crm_0002_fixes.sql
// Migration files in drizzle/ are idempotent — safe to re-run.
import "dotenv/config";
import { readFileSync } from "node:fs";
import { Pool } from "pg";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/apply-migration.mjs <path/to/file.sql>");
  process.exit(1);
}
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env or export it.");
  process.exit(1);
}

const sql = readFileSync(file, "utf8");
const pool = new Pool({
  connectionString: url,
  ssl: url.includes("supabase") || process.env.DATABASE_SSL === "true"
    ? { rejectUnauthorized: false }
    : false,
});

try {
  await pool.query(sql);
  console.log(`applied ${file}`);
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
