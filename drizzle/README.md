# Database schema & migrations

The schema is applied with **plain SQL files in this directory**, not with
drizzle-kit. `drizzle/schema.ts` is the hand-maintained ORM mirror of those
files — keep the two in sync when you change either.

## Applying a migration

```bash
node scripts/apply-migration.mjs drizzle/crm_0002_fixes.sql
# or: pnpm db:migrate drizzle/crm_0002_fixes.sql
```

Targets `DATABASE_URL` (the CRM/training Supabase project). Every file here is
written to be **idempotent** (`IF NOT EXISTS` / guarded `DO` blocks) — safe to
re-run. Write new migrations the same way and number them (`crm_0003_...`).

## Why `db:push` is disabled

`drizzle/meta/` is a stale artifact from an old mysql-dialect setup and
`drizzle/migrations/` is empty: drizzle-kit's snapshots know nothing about the
tables that actually exist. Running `drizzle-kit generate && drizzle-kit
migrate` would emit fresh `CREATE TABLE`s for every table in `schema.ts` and
fail with "relation already exists" (or worse, run partially). The `db:push`
script now exits with an error pointing here.

## CRM files

- `crm_0001_init.sql` — Phase 1 data model (10 tables + citext extension).
- `crm_0002_fixes.sql` — index fixes from the Phase 1 code review.
- `credentials.sql` — training-app credentials table (`scripts/apply-credentials.mjs`).

The website Supabase project (`WEBSITE_DATABASE_URL`) is **read-only** — never
point migrations at it.
