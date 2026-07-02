import "dotenv/config";
import { Pool } from "pg";
const url = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: url,
  ssl: url?.includes("supabase") || process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

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
