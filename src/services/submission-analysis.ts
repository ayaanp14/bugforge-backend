import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { cached } from "../lib/cache.js";
import { ai } from "../lib/ai/provider.js";
import { PROMPT_VERSIONS, promptFor } from "../lib/ai/prompts.js";
import { analyzeFailure, type DeterministicAnalysis } from "../lib/failure-analysis.js";
import { buildReviewMessages, coerceReview, guardReview, ReviewSchema, type AiReview } from "../lib/submission-review.js";
import { recommendFor } from "../lib/skill-profile.js";
import { skillsForProblemTags } from "../lib/skill-graph.js";
import { lessonForHub } from "../lib/roadmap-lessons.js";
import { todayContest } from "./daily-contest.js";
import { findLiveDuelFor } from "../lib/duels.js";
import { invalidateSkillProfile, skillProfileFor } from "./skill-profile.js";
import { roadDefinition } from "./roadmap.js";

/**
 * "Why it failed" for every submission that was not accepted (the owner's
 * call, 2026-10-07: on every failure, unlimited for everyone).
 *
 * Two layers, one row (SubmissionAnalysis):
 *  1. The deterministic explanation (lib/failure-analysis.ts) — written right
 *     after the verdict goes out, from what the judge reported and the
 *     statement's constraints. Free, and there within a moment.
 *  2. The model's review (lib/submission-review.ts through lib/ai) — queued
 *     and run by a small in-process runner, CONCURRENCY at a time, the way the
 *     resume analyses are (services/resumes.ts). Nobody waits on it: the
 *     workbench polls and fills the panel when it lands.
 *
 * Never the model in a ranked event: a submission on today's contest
 * problem, in a live duel, or in a Battles contest or knockout is explained
 * by the deterministic layer only (`reason: "contest" | "duel"`) — a review
 * of your code mid-match is help nobody else got. The rest is unlimited; the
 * judge's own executionLimiter is the only brake, and the same code
 * resubmitted reuses the earlier review instead of asking again (`codeHash`).
 *
 * Both layers end with what to do next: the problem's weakest skill in the
 * account's profile, one problem for it and its tutorial
 * (`recommendation`). A failure here is logged and never reaches the judge's
 * answer — the submit has already been answered when any of this runs.
 */

const CONCURRENCY = Number(process.env["SUBMISSION_REVIEW_CONCURRENCY"] ?? 3);
/** Waiting reviews held in memory; past this the oldest waiting row is failed rather than the process growing without bound. */
const QUEUE_CAP = 500;
/** A queued or running row younger than this is picked up again at boot; older ones are failed. */
const RECOVER_WITHIN_MS = 60 * 60_000;
const MAX_OUTPUT_TOKENS = 1_400;
const ERROR_KEPT = 2_000;
/** A failed submission with no row yet is "pending" for this long after it was judged; past it, it never had one. */
const PENDING_WINDOW_MS = 2 * 60_000;

export type AnalysisStatus = "pending" | "queued" | "running" | "done" | "failed" | "skipped";

export interface Recommendation {
  skill: { key: string; label: string; mastery: number };
  problem: { slug: string; title: string; difficulty: string; href: string } | null;
  lesson: { slug: string; title: string; minutes: number } | null;
}

export interface AnalysisView {
  submissionId: string;
  status: AnalysisStatus;
  reason: string | null;
  category: string | null;
  deterministic: DeterministicAnalysis | null;
  ai: AiReview | null;
  recommendation: Recommendation | null;
}

export interface FailedSubmission {
  submissionId: string;
  userId: string;
  problemId: string;
  verdict: string;
  passedCases: number;
  totalCases: number;
  runtimeMs: number | null;
  timeLimitMs: number;
  code: string;
  language: string;
  errorDetail: string | null;
  /** Already known to be a ranked event by the submit route (a Battles contest or knockout). */
  ranked: boolean;
}

const json = (v: unknown) => v as Prisma.InputJsonValue;
const hashOf = (language: string, code: string) => createHash("sha256").update(`${language}\n${code}`).digest("hex");

/** A problem's statement, tags and visible examples — content, the same for everyone, held ten minutes. */
function problemForReview(problemId: string) {
  return cached(`review:problem:${problemId}`, 10 * 60_000, async () => {
    const [problem, examples] = await Promise.all([
      prisma.problem.findUnique({ where: { id: problemId }, select: { title: true, slug: true, description: true, tags: true } }),
      prisma.testCase.findMany({ where: { problemId, isHidden: false }, orderBy: { orderIndex: "asc" }, take: 3, select: { input: true, expectedOutput: true } }),
    ]);
    if (!problem) return null;
    return {
      title: problem.title,
      slug: problem.slug,
      description: problem.description,
      tags: Array.isArray(problem.tags) ? (problem.tags as string[]) : [],
      examples: examples.map((e) => ({ input: e.input, output: e.expectedOutput })),
    };
  });
}

/** Today's contest problem, a live duel, or a Battles match: the model stays out. */
async function rankedReason(f: FailedSubmission): Promise<"contest" | "duel" | null> {
  if (f.ranked) return "contest";
  const [contest, duel] = await Promise.all([todayContest().catch(() => null), findLiveDuelFor(f.userId, { problemId: f.problemId }).catch(() => null)]);
  if (contest && contest.problemId === f.problemId) return "contest";
  return duel ? "duel" : null;
}

/**
 * What to do next: the problem's weakest skill in the account's profile,
 * one other problem for it and its tutorial. Null when the problem's tags
 * name no measured skill.
 */
async function recommendationFor(userId: string, slug: string, tags: readonly string[]): Promise<Recommendation | null> {
  const [profile, road] = await Promise.all([skillProfileFor(userId), roadDefinition().catch(() => null)]);
  const skills = skillsForProblemTags(tags)
    .map((k) => profile.scored.get(k))
    .filter((s) => s != null)
    .sort((a, b) => a.score.mastery - b.score.mastery);
  const weakest = skills[0];
  if (!weakest) return null;
  const next = recommendFor(weakest.node.key, profile.scored, profile.input, 4).find((r) => r.slug !== slug) ?? null;
  const lesson = weakest.node.key.startsWith("dsa:") ? lessonForHub(weakest.node.key.slice(4), road?.stages.map((s) => s.id) ?? []) : null;
  return {
    skill: { key: weakest.node.key, label: weakest.node.label, mastery: weakest.score.mastery },
    problem: next ? { slug: next.slug, title: next.title, difficulty: next.difficulty, href: next.href } : null,
    lesson: lesson ? { slug: lesson.slug, title: lesson.title, minutes: lesson.minutes } : null,
  };
}

/**
 * After a submission that was not accepted: write its deterministic
 * explanation at once, and queue the model's review unless it was ranked.
 * Called by the submit route after the response; never throws.
 */
export async function noteFailedSubmission(f: FailedSubmission): Promise<void> {
  try {
    const problem = await problemForReview(f.problemId);
    if (!problem) return;
    const deterministic = analyzeFailure({ ...f, description: problem.description });
    const ranked = await rankedReason(f);
    const status: AnalysisStatus = ranked || !ai.available() ? "skipped" : "queued";
    const reason = ranked ?? (ai.available() ? null : "unavailable");
    const created = await prisma.submissionAnalysis.createMany({
      data: [
        {
          submissionId: f.submissionId,
          userId: f.userId,
          problemId: f.problemId,
          status,
          reason,
          category: deterministic.category,
          context: json({ errorDetail: f.errorDetail ? f.errorDetail.slice(0, ERROR_KEPT) : null, timeLimitMs: f.timeLimitMs, runtimeMs: f.runtimeMs }),
          deterministic: json(deterministic),
          codeHash: hashOf(f.language, f.code),
        },
      ],
      skipDuplicates: true,
    });
    if (!created.count) return;
    if (status === "queued") enqueue(f.submissionId);
    else await attachRecommendation(f.submissionId, f.userId, problem.slug, problem.tags);
  } catch (err) {
    console.error("submission analysis: note failed:", (err as Error).message);
  }
}

async function attachRecommendation(submissionId: string, userId: string, slug: string, tags: readonly string[]): Promise<void> {
  const recommendation = await recommendationFor(userId, slug, tags).catch(() => null);
  if (recommendation) await prisma.submissionAnalysis.update({ where: { submissionId }, data: { recommendation: json(recommendation) } });
}

// ── The runner ────────────────────────────────────────────────────

const queue: string[] = [];
const running = new Set<string>();

function enqueue(id: string): void {
  if (queue.includes(id) || running.has(id)) return;
  if (queue.length >= QUEUE_CAP) {
    const dropped = queue.shift()!;
    void prisma.submissionAnalysis.updateMany({ where: { submissionId: dropped, status: "queued" }, data: { status: "failed", reason: "busy" } }).catch(() => undefined);
  }
  queue.push(id);
  pump();
}

function pump(): void {
  while (running.size < CONCURRENCY && queue.length) {
    const id = queue.shift()!;
    running.add(id);
    void review(id)
      .catch((err) => console.error("submission analysis: review failed:", (err as Error).message))
      .finally(() => {
        running.delete(id);
        pump();
      });
  }
}

async function review(submissionId: string): Promise<void> {
  const claimed = await prisma.submissionAnalysis.updateMany({ where: { submissionId, status: "queued" }, data: { status: "running" } });
  if (!claimed.count) return;
  const row = await prisma.submissionAnalysis.findUnique({
    where: { submissionId },
    select: { userId: true, problemId: true, codeHash: true, context: true, deterministic: true, submission: { select: { code: true, language: true, verdict: true, passedCases: true, totalCases: true } } },
  });
  if (!row) return;
  const problem = await problemForReview(row.problemId);
  if (!problem) {
    await prisma.submissionAnalysis.update({ where: { submissionId }, data: { status: "failed", reason: "error" } });
    return;
  }

  try {
    // The same code, explained before under today's prompt: its review
    // stands for this one too. A review from an older prompt is written again.
    const earlier = await prisma.submissionAnalysis.findFirst({
      where: { userId: row.userId, problemId: row.problemId, codeHash: row.codeHash, status: "done", promptVersion: PROMPT_VERSIONS["submission-review"], submissionId: { not: submissionId } },
      orderBy: { createdAt: "desc" },
      select: { ai: true, category: true, model: true, promptVersion: true },
    });
    if (earlier?.ai) {
      await prisma.submissionAnalysis.update({
        where: { submissionId },
        data: { status: "done", reason: "reused", ai: json(earlier.ai), category: earlier.category, model: earlier.model, promptVersion: earlier.promptVersion },
      });
    } else {
      const context = (row.context ?? {}) as { errorDetail?: string | null; timeLimitMs?: number };
      const known = row.deterministic as unknown as DeterministicAnalysis;
      const ctx = {
        title: problem.title,
        statement: problem.description,
        examples: problem.examples,
        code: row.submission.code,
        language: row.submission.language,
        verdict: row.submission.verdict,
        passedCases: row.submission.passedCases,
        totalCases: row.submission.totalCases,
        timeLimitMs: context.timeLimitMs ?? 2000,
        errorDetail: context.errorDetail ?? null,
        known,
      };
      const prompt = promptFor("submission-review");
      const { parsed, usage } = await ai.json(buildReviewMessages(ctx, prompt.text), ReviewSchema, "submission_review", {
        maxTokens: MAX_OUTPUT_TOKENS,
        temperature: 0.2,
        coerce: coerceReview,
      });
      const reviewed = guardReview(parsed, ctx);
      if (!reviewed) throw new Error("the model returned nothing usable");
      await prisma.submissionAnalysis.update({
        where: { submissionId },
        data: {
          status: "done",
          ai: json(reviewed),
          category: reviewed.category,
          model: ai.model(),
          promptVersion: prompt.version,
          tokens: usage.promptTokens + usage.completionTokens,
        },
      });
    }
  } catch (err) {
    console.error("submission analysis: model review failed:", (err as Error).message);
    await prisma.submissionAnalysis.update({ where: { submissionId }, data: { status: "failed", reason: "error" } });
  }
  await attachRecommendation(submissionId, row.userId, problem.slug, problem.tags);
  // The skill profile reads the reviews' causes.
  invalidateSkillProfile(row.userId);
}

/** At boot: young rows left queued or running by the last process are picked up again; old ones are failed. */
export async function recoverSubmissionAnalyses(): Promise<void> {
  try {
    const since = new Date(Date.now() - RECOVER_WITHIN_MS);
    await prisma.submissionAnalysis.updateMany({ where: { status: { in: ["queued", "running"] }, createdAt: { lt: since } }, data: { status: "failed", reason: "error" } });
    const young = await prisma.submissionAnalysis.findMany({ where: { status: { in: ["queued", "running"] } }, select: { submissionId: true }, orderBy: { createdAt: "asc" } });
    if (young.length) await prisma.submissionAnalysis.updateMany({ where: { submissionId: { in: young.map((r) => r.submissionId) } }, data: { status: "queued" } });
    for (const r of young) enqueue(r.submissionId);
  } catch (err) {
    console.error("submission analysis: recovery failed:", (err as Error).message);
  }
}

// ── Reading ───────────────────────────────────────────────────────

/**
 * One submission's analysis, for its owner. "pending" when the submission
 * failed a moment ago and its row is not written yet; null when it is not
 * theirs, does not exist, was accepted, or failed before analyses existed
 * (no row and older than PENDING_WINDOW_MS) — a panel opened on one of
 * those must not wait for a review that will never come.
 */
export async function analysisFor(userId: string, submissionId: string): Promise<AnalysisView | null> {
  const row = await prisma.submissionAnalysis.findUnique({
    where: { submissionId },
    select: { userId: true, status: true, reason: true, category: true, deterministic: true, ai: true, recommendation: true },
  });
  if (row) {
    if (row.userId !== userId) return null;
    return {
      submissionId,
      status: row.status as AnalysisStatus,
      reason: row.reason,
      category: row.category,
      deterministic: row.deterministic as unknown as DeterministicAnalysis,
      ai: (row.ai as unknown as AiReview | null) ?? null,
      recommendation: (row.recommendation as unknown as Recommendation | null) ?? null,
    };
  }
  const submission = await prisma.submission.findFirst({ where: { id: submissionId, userId }, select: { verdict: true, submittedAt: true } });
  if (!submission || submission.verdict === "ACCEPTED" || Date.now() - submission.submittedAt.getTime() > PENDING_WINDOW_MS) return null;
  return { submissionId, status: "pending", reason: null, category: null, deterministic: null, ai: null, recommendation: null };
}
