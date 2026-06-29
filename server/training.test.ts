import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock db helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getTrainingProgress: vi.fn(),
  upsertTrainingProgress: vi.fn(),
  createRoleplayAttempt: vi.fn(),
  getRoleplayAttempts: vi.fn(),
  countRoleplayAttempts: vi.fn(),
}));

// ─── Mock LLM ─────────────────────────────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
  listLLMModels: vi.fn(),
}));

import {
  getTrainingProgress,
  upsertTrainingProgress,
  countRoleplayAttempts,
  createRoleplayAttempt,
} from "./db";
import { invokeLLM } from "./_core/llm";

// ─── Auth context factory ─────────────────────────────────────────────────────
function makeCtx(overrides: Partial<TrpcContext["user"]> = {}): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "test-open-id",
      email: "test@example.com",
      name: "Test Ambassador",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── training.getProgress ─────────────────────────────────────────────────────
describe("training.getProgress", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns default progress when no DB row exists", async () => {
    vi.mocked(getTrainingProgress).mockResolvedValue(null);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.training.getProgress();

    expect(result.completedModules).toEqual([]);
    expect(result.completedQuizzes).toEqual([]);
    expect(result.completedAssignments).toEqual([]);
    expect(result.safetyCompleted).toBe(false);
    expect(result.passedFinalTest).toBe(false);
    expect(result.finalTestScore).toBeNull();
  });

  it("returns stored progress when DB row exists", async () => {
    const stored = {
      id: 1,
      userId: 42,
      completedModules: ["day1"],
      completedQuizzes: ["day1"],
      completedAssignments: ["day1"],
      assignmentsData: { day1: "My answer" },
      safetyCompleted: true,
      passedFinalTest: false,
      finalTestScore: null,
      shift1DebriefData: null,
      supervisorReleased: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(getTrainingProgress).mockResolvedValue(stored as any);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.training.getProgress();

    expect(result.completedModules).toEqual(["day1"]);
    expect(result.safetyCompleted).toBe(true);
    expect(result.passedFinalTest).toBe(false);
  });
});

// ─── training.saveProgress ────────────────────────────────────────────────────
describe("training.saveProgress", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls upsertTrainingProgress with the provided data and returns success", async () => {
    vi.mocked(upsertTrainingProgress).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(makeCtx());

    const result = await caller.training.saveProgress({
      completedModules: ["day1", "day2"],
      safetyCompleted: true,
      passedFinalTest: true,
      finalTestScore: 10,
    });

    expect(result.success).toBe(true);
    expect(upsertTrainingProgress).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        completedModules: ["day1", "day2"],
        safetyCompleted: true,
        passedFinalTest: true,
        finalTestScore: 10,
      })
    );
  });

  it("accepts partial updates (only safetyCompleted)", async () => {
    vi.mocked(upsertTrainingProgress).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(makeCtx());

    const result = await caller.training.saveProgress({ safetyCompleted: true });

    expect(result.success).toBe(true);
    expect(upsertTrainingProgress).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ safetyCompleted: true })
    );
  });
});

// ─── roleplay.getAttemptCount ─────────────────────────────────────────────────
describe("roleplay.getAttemptCount", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns count 0 when no attempts exist", async () => {
    vi.mocked(countRoleplayAttempts).mockResolvedValue(0);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.roleplay.getAttemptCount();
    expect(result.count).toBe(0);
  });

  it("returns correct count when attempts exist", async () => {
    vi.mocked(countRoleplayAttempts).mockResolvedValue(5);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.roleplay.getAttemptCount();
    expect(result.count).toBe(5);
  });
});

// ─── roleplay.chat ────────────────────────────────────────────────────────────
describe("roleplay.chat", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns assistant message and sceneComplete=false for normal reply", async () => {
    vi.mocked(invokeLLM).mockResolvedValue({
      choices: [{ message: { content: "Hello, how can I help you?" } }],
    } as any);

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.roleplay.chat({
      persona: "friendly_curious",
      messages: [{ role: "user", content: "Hi, I'm from Top of Temecula." }],
    });

    expect(result.content).toBe("Hello, how can I help you?");
    expect(result.sceneComplete).toBe(false);
  });

  it("detects [SCENE COMPLETE] and strips it from content", async () => {
    vi.mocked(invokeLLM).mockResolvedValue({
      choices: [{ message: { content: "Sure, I'll claim it. [SCENE COMPLETE]" } }],
    } as any);

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.roleplay.chat({
      persona: "busy",
      messages: [{ role: "user", content: "We already created a free listing for you." }],
    });

    expect(result.content).toBe("Sure, I'll claim it.");
    expect(result.sceneComplete).toBe(true);
  });
});

// ─── roleplay.evaluate ────────────────────────────────────────────────────────
describe("roleplay.evaluate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("parses scorecard JSON and saves attempt to DB", async () => {
    const mockScorecard = {
      compliance_pass: true,
      compliance_flags: [],
      scores: {
        led_with_claim: 2,
        used_dashboard_hook: 2,
        objection_handling: 2,
        secured_outcome: 2,
        professional_lowpressure: 2,
        clean_close: 2,
      },
      total: 12,
      result: "PASS",
      what_went_well: ["Great opening", "Clean close"],
      coaching: [],
      one_thing_to_try_next_time: "Keep it up!",
    };

    vi.mocked(invokeLLM).mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(mockScorecard) } }],
    } as any);
    vi.mocked(createRoleplayAttempt).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.roleplay.evaluate({
      persona: "friendly_curious",
      transcript: [
        { role: "user", content: "We already created a free listing for you." },
        { role: "assistant", content: "Oh really? That's great!" },
      ],
    });

    expect((result as any).result).toBe("PASS");
    expect((result as any).total).toBe(12);
    expect(createRoleplayAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 42,
        persona: "friendly_curious",
        result: "PASS",
        totalScore: 12,
        compliancePass: true,
      })
    );
  });

  it("handles malformed JSON from LLM gracefully", async () => {
    vi.mocked(invokeLLM).mockResolvedValue({
      choices: [{ message: { content: "not valid json {{{" } }],
    } as any);
    vi.mocked(createRoleplayAttempt).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.roleplay.evaluate({
      persona: "hostile",
      transcript: [{ role: "user", content: "Hi" }],
    });

    expect((result as any).result).toBe("RETRY");
    expect((result as any).compliance_pass).toBe(false);
  });
});

// ─── auth.logout ──────────────────────────────────────────────────────────────
describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});
