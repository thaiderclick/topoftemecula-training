import { readFileSync } from "node:fs";
import { Pool } from "pg";
const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
for (const l of env.split("\n")) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function q(label, sql) {
  try {
    const { rows } = await pool.query(sql);
    console.log(`OK   ${label}: ${rows.length} row(s)`);
    return rows;
  } catch (e) {
    console.log(`FAIL ${label}: ${e.message}`);
    return null;
  }
}

// Replicates getAllTrainees() in server/db.ts
await q("users", 'select * from users order by "createdAt"');
await q("training_progress", "select * from training_progress");
await q("roleplay counts", 'select "userId", count(*) from roleplay_attempts group by "userId"');
await q("roleplay pass counts", `select "userId", count(*) from roleplay_attempts where result = 'PASS' group by "userId"`);

await pool.end();
