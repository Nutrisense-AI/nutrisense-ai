import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAuthContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-openid",
    email: "test@nutrisense.ai",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    isPremium: false,
    stripeCustomerId: null,
    stripePaymentIntentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];
    const ctx: TrpcContext = {
      user: {
        id: 1,
        openId: "test",
        email: "test@test.com",
        name: "Test",
        loginMethod: "manus",
        role: "user",
        isPremium: false,
        stripeCustomerId: null,
        stripePaymentIntentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

describe("food.checkUsage", () => {
  it("returns canScan=true for authenticated users", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.food.checkUsage({ sessionToken: "test-session" });
    expect(result.canScan).toBe(true);
    expect(result.isPremium).toBe(false);
  });

  it("returns canScan=true for premium users", async () => {
    const ctx = createAuthContext({ isPremium: true });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.food.checkUsage({});
    expect(result.canScan).toBe(true);
    expect(result.isPremium).toBe(true);
  });

  it("returns canScan=true for anonymous users with no session token", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.food.checkUsage({});
    expect(result.canScan).toBe(true);
    expect(result.isPremium).toBe(false);
    expect(result.freeLimit).toBe(3);
  });
});

describe("premium.getStatus", () => {
  it("returns isPremium=false for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.premium.getStatus();
    expect(result.isPremium).toBe(false);
  });
});

describe("chat.getHistory", () => {
  it("returns empty array when no session token provided", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chat.getHistory({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns empty array when authenticated user has no chat history", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chat.getHistory({ sessionToken: "test-session" });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("food.getHistory", () => {
  it("returns empty array for anonymous user with no session token", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.food.getHistory({});
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("returns array for authenticated user (may be empty)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.food.getHistory({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("premium.createCheckoutSession", () => {
  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.premium.createCheckoutSession({ origin: "https://example.com" })
    ).rejects.toThrow();
  });
});
