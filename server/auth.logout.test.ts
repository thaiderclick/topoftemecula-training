import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Auth tests for the password-based session system.
 * Logout is now handled by POST /api/auth/logout (Express route),
 * not a tRPC procedure. These tests verify the auth.me query behavior.
 */

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(user: AuthenticatedUser | null = null): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("auth.me", () => {
  it("returns null when no user is in context (unauthenticated)", async () => {
    const ctx = createAuthContext(null);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns the user when authenticated", async () => {
    const user: AuthenticatedUser = {
      id: 1,
      openId: "pwd_dylan",
      email: null,
      name: "Dylan",
      loginMethod: "password",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    const ctx = createAuthContext(user);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result?.openId).toBe("pwd_dylan");
    expect(result?.name).toBe("Dylan");
    expect(result?.loginMethod).toBe("password");
  });
});
