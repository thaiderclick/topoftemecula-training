-- Idempotent creation of the credentials table.
-- Run this in the Supabase SQL editor once. Safe to re-run.
CREATE TABLE IF NOT EXISTS "credentials" (
  "id" serial PRIMARY KEY,
  "userId" integer NOT NULL,
  "code" varchar(32) NOT NULL,
  "holderName" text,
  "program" varchar(128) NOT NULL,
  "finalTestScore" integer,
  "issuedAt" timestamp DEFAULT now() NOT NULL
);

-- Unique constraints (guarded so re-runs don't error).
DO $$ BEGIN
  ALTER TABLE "credentials" ADD CONSTRAINT "credentials_userId_unique" UNIQUE ("userId");
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "credentials" ADD CONSTRAINT "credentials_code_unique" UNIQUE ("code");
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL;
END $$;
