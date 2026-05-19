import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  anonymousUsage,
  chatMessages,
  InsertMealItem,
  InsertMealScan,
  InsertUser,
  InsertUserGoal,
  mealItems,
  mealScans,
  userGoals,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User helpers ──────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function setUserPremium(userId: number, stripePaymentIntentId: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(users)
    .set({ isPremium: true, stripePaymentIntentId })
    .where(eq(users.id, userId));
}

// ─── Anonymous usage helpers ───────────────────────────────────────────────────

export const FREE_SCAN_LIMIT = 3;

export async function getOrCreateAnonymousUsage(sessionToken: string) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db
    .select()
    .from(anonymousUsage)
    .where(eq(anonymousUsage.sessionToken, sessionToken))
    .limit(1);
  if (existing.length > 0) return existing[0];
  await db.insert(anonymousUsage).values({ sessionToken, scanCount: 0 });
  const created = await db
    .select()
    .from(anonymousUsage)
    .where(eq(anonymousUsage.sessionToken, sessionToken))
    .limit(1);
  return created[0] ?? null;
}

export async function incrementAnonymousScanCount(sessionToken: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(anonymousUsage)
    .set({ scanCount: sql`${anonymousUsage.scanCount} + 1` })
    .where(eq(anonymousUsage.sessionToken, sessionToken));
}

// ─── Meal scan helpers ─────────────────────────────────────────────────────────

export async function createMealScan(data: InsertMealScan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(mealScans).values(data);
  const insertId = (result as unknown as { insertId: number }[])[0]?.insertId ?? 0;
  return insertId;
}

export async function createMealItems(items: InsertMealItem[]) {
  const db = await getDb();
  if (!db) return;
  if (items.length === 0) return;
  await db.insert(mealItems).values(items);
}

export async function getMealScanById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const scans = await db.select().from(mealScans).where(eq(mealScans.id, id)).limit(1);
  if (scans.length === 0) return null;
  const items = await db.select().from(mealItems).where(eq(mealItems.scanId, id));
  return { scan: scans[0], items };
}

export async function getMealScansByUser(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(mealScans)
    .where(eq(mealScans.userId, userId))
    .orderBy(desc(mealScans.createdAt))
    .limit(limit);
}

export async function getMealScansBySession(sessionToken: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(mealScans)
    .where(eq(mealScans.sessionToken, sessionToken))
    .orderBy(desc(mealScans.createdAt))
    .limit(limit);
}

export async function deleteMealScan(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(mealScans)
    .where(and(eq(mealScans.id, id), eq(mealScans.userId, userId)));
}

// ─── Chat message helpers ──────────────────────────────────────────────────────

export async function saveChatMessage(data: {
  userId?: number;
  sessionToken?: string;
  scanId?: number;
  role: "user" | "assistant";
  content: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(chatMessages).values(data);
}

export async function getChatHistory(opts: {
  userId?: number;
  sessionToken?: string;
  scanId?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.userId) conditions.push(eq(chatMessages.userId, opts.userId));
  else if (opts.sessionToken)
    conditions.push(eq(chatMessages.sessionToken, opts.sessionToken));
  if (opts.scanId) conditions.push(eq(chatMessages.scanId, opts.scanId));

  return db
    .select()
    .from(chatMessages)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(chatMessages.createdAt)
    .limit(opts.limit ?? 50);
}

// ─── User Goals helpers ────────────────────────────────────────────────────────

export async function getUserGoals(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userGoals).where(eq(userGoals.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function upsertUserGoals(goals: InsertUserGoal) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(userGoals)
    .values(goals)
    .onDuplicateKeyUpdate({
      set: {
        calorieGoal: goals.calorieGoal,
        proteinGoal: goals.proteinGoal,
        carbsGoal: goals.carbsGoal,
        fatGoal: goals.fatGoal,
        fiberGoal: goals.fiberGoal,
      },
    });
}
