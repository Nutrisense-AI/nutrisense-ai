import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isPremium: boolean("isPremium").default(false).notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Tracks anonymous usage by session token (for non-logged-in users)
export const anonymousUsage = mysqlTable("anonymous_usage", {
  id: int("id").autoincrement().primaryKey(),
  sessionToken: varchar("sessionToken", { length: 128 }).notNull().unique(),
  scanCount: int("scanCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AnonymousUsage = typeof anonymousUsage.$inferSelect;

// Each meal scan (one photo = one scan)
export const mealScans = mysqlTable("meal_scans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  sessionToken: varchar("sessionToken", { length: 128 }),
  imageUrl: text("imageUrl").notNull(),
  imageKey: text("imageKey").notNull(),
  mealName: varchar("mealName", { length: 255 }),
  totalCalories: float("totalCalories"),
  totalProtein: float("totalProtein"),
  totalCarbs: float("totalCarbs"),
  totalFat: float("totalFat"),
  totalFiber: float("totalFiber"),
  analysisJson: json("analysisJson"), // Full AI analysis result
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MealScan = typeof mealScans.$inferSelect;
export type InsertMealScan = typeof mealScans.$inferInsert;

// Individual food items within a scan
export const mealItems = mysqlTable("meal_items", {
  id: int("id").autoincrement().primaryKey(),
  scanId: int("scanId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: varchar("quantity", { length: 128 }),
  calories: float("calories"),
  protein: float("protein"),
  carbs: float("carbs"),
  fat: float("fat"),
  fiber: float("fiber"),
  sodium: float("sodium"),
  sugar: float("sugar"),
  vitaminC: float("vitaminC"),
  calcium: float("calcium"),
  iron: float("iron"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MealItem = typeof mealItems.$inferSelect;
export type InsertMealItem = typeof mealItems.$inferInsert;

// AI Nutritionist chat messages
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  sessionToken: varchar("sessionToken", { length: 128 }),
  scanId: int("scanId"), // Optional: linked to a specific scan
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// User daily nutrition goals
export const userGoals = mysqlTable("user_goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  calorieGoal: float("calorieGoal").default(2000),
  proteinGoal: float("proteinGoal").default(150),
  carbsGoal: float("carbsGoal").default(250),
  fatGoal: float("fatGoal").default(65),
  fiberGoal: float("fiberGoal").default(25),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserGoal = typeof userGoals.$inferSelect;
export type InsertUserGoal = typeof userGoals.$inferInsert;
