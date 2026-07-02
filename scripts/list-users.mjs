import "dotenv/config";
import { Pool } from "pg";
const url = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: url,
  ssl: url?.includes("supabase") || process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});
const { rows } = await pool.query(
  'select id, name, "loginMethod", "createdAt", "lastSignedIn" from users order by "createdAt"'
);
for (const r of rows) {
  console.log(`#${r.id}  ${r.name}  | login=${r.loginMethod} | created=${r.createdAt?.toISOString?.() ?? r.createdAt} | last=${r.lastSignedIn?.toISOString?.() ?? r.lastSignedIn}`);
}
await pool.end();
