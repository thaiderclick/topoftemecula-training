import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { InsertUser, users, roleplayAttempts, trainingProgress, InsertRoleplayAttempt, InsertTrainingProgress } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL?.includes("supabase") || process.env.DATABASE_SSL === "true"
          ? { rejectUnauthorized: false }
          : false,
      });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // PostgreSQL upsert using onConflictDoUpdate
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet as Partial<InsertUser>,
    });
  } catch (error) {
    console.warn("[Database] Failed to upsert user (non-fatal):", (error as Error).message);
    // Non-fatal: login still succeeds via JWT cookie even if DB write fails
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Training Progress ────────────────────────────────────────────────────────

export async function getTrainingProgress(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(trainingProgress).where(eq(trainingProgress.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertTrainingProgress(userId: number, data: Partial<InsertTrainingProgress>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getTrainingProgress(userId);
  if (existing) {
    await db.update(trainingProgress).set({ ...data, updatedAt: new Date() }).where(eq(trainingProgress.userId, userId));
  } else {
    await db.insert(trainingProgress).values({
      userId,
      completedModules: [],
      completedQuizzes: [],
      completedAssignments: [],
      assignmentsData: {},
      safetyCompleted: false,
      passedFinalTest: false,
      ...data,
    });
  }
}

// ─── Roleplay Attempts ────────────────────────────────────────────────────────

export async function createRoleplayAttempt(data: InsertRoleplayAttempt) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(roleplayAttempts).values(data);
}

export async function getRoleplayAttempts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(roleplayAttempts).where(eq(roleplayAttempts.userId, userId));
}

export async function countRoleplayAttempts(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(roleplayAttempts).where(eq(roleplayAttempts.userId, userId));
  return Number(result[0]?.count ?? 0);
}
