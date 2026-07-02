import { readFileSync } from "node:fs";
import { Pool } from "pg";
const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
for (const l of env.split("\n")) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const { rows } = await pool.query(
  'select id, name, "loginMethod", "createdAt", "lastSignedIn" from users order by "createdAt"'
);
for (const r of rows) {
  console.log(`#${r.id}  ${r.name}  | login=${r.loginMethod} | created=${r.createdAt?.toISOString?.() ?? r.createdAt} | last=${r.lastSignedIn?.toISOString?.() ?? r.lastSignedIn}`);
}
await pool.end();
