// Repoint a legacy name-keyed account's data onto a new email-keyed account.
// Usage: node scripts/link-legacy-user.mjs <legacyUserId> <newAccountEmail>
//
// Moves training_progress, roleplay_attempts, trainee_feedback, credentials,
// and ambassador rows from the legacy users.id to the account registered with
// the given email, then deletes the legacy users row. Idempotent-ish: rows that
// would collide (e.g. both accounts have training_progress) abort with a
// message instead of clobbering.
import "dotenv/config";
import { Pool } from "pg";

const [legacyIdArg, email] = process.argv.slice(2);
const legacyId = Number(legacyIdArg);
if (!legacyId || !email) {
  console.error("usage: node scripts/link-legacy-user.mjs <legacyUserId> <newAccountEmail>");
  process.exit(1);
}

const url = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: url,
  ssl: url?.includes("supabase") || process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const TABLES = [
  { table: "training_progress", col: "userId", uniquePerUser: true },
  { table: "roleplay_attempts", col: "userId", uniquePerUser: false },
  { table: "trainee_feedback", col: "userId", uniquePerUser: false },
  { table: "credentials", col: "userId", uniquePerUser: true },
  { table: "ambassador", col: "user_id", uniquePerUser: true },
];

try {
  const legacy = await pool.query(`select id, name, "openId" from users where id = $1`, [legacyId]);
  if (!legacy.rows[0]) throw new Error(`no users row with id ${legacyId}`);
  if (!legacy.rows[0].openId.startsWith("pwd_")) {
    throw new Error(`user ${legacyId} (${legacy.rows[0].openId}) is not a legacy name-keyed account`);
  }
  const target = await pool.query(`select id, name from users where lower(email) = lower($1)`, [email]);
  if (!target.rows[0]) throw new Error(`no account registered with ${email} — register it first`);
  const newId = target.rows[0].id;

  await pool.query("begin");
  for (const { table, col, uniquePerUser } of TABLES) {
    if (uniquePerUser) {
      const clash = await pool.query(`select 1 from ${table} where "${col}" = $1 limit 1`, [newId]);
      const has = await pool.query(`select 1 from ${table} where "${col}" = $1 limit 1`, [legacyId]);
      if (clash.rows[0] && has.rows[0]) {
        throw new Error(`${table}: both accounts have a row — resolve manually before linking`);
      }
    }
    const r = await pool.query(`update ${table} set "${col}" = $1 where "${col}" = $2`, [newId, legacyId]);
    if (r.rowCount) console.log(`${table}: moved ${r.rowCount} row(s)`);
  }
  await pool.query(`delete from users where id = $1`, [legacyId]);
  await pool.query("commit");
  console.log(`linked legacy user #${legacyId} (${legacy.rows[0].name}) → #${newId} (${email}); legacy row deleted`);
} catch (err) {
  await pool.query("rollback").catch(() => {});
  console.error("link failed:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
