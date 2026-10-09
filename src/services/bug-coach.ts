import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { cached, invalidate } from "../lib/cache.js";
import { ai, AIStreamError } from "../lib/ai/provider.js";
import { PROMPT_VERSIONS, promptFor } from "../lib/ai/prompts.js";
import { judgeBugProject, type BugLanguage } from "../lib/bug-judge.js";
import { findLiveDuelFor } from "../lib/duels.js";
import { SYMPTOM_DETAIL_CHARS, diagnosisOf, patchOf, patchText, symptomsOf, type Diagnosis, type Patch } from "../lib/bug-incident.js";
import { analyzeBugFailure, type BugCheck, type BugDeterministic } from "../lib/bug-failure.js";
import { BugReviewSchema, buildBugReviewMessages, coerceBugReview, guardBugReview, type BugAiReview } from "../lib/bug-review.js";
import { RUBRIC, RootCauseSchema, buildRootCauseMessages, coerceRootCause, guardRootCause, validateRootCause, type RootCauseReview } from "../lib/root-cause.js";
import { BUG_RUNGS, buildBugTutorMessages } from "../lib/bug-tutor.js";
import { TUTOR_LIMITS, codeGate, rungFor, rungOf, type TutorTurnText } from "../lib/tutor.js";
import { bugDetailKey, bugIdFor } from "./bug-hunts.js";
import { invalidateSkillProfile } from "./skill-profile.js";

/**
 * The debugging coach — Phase 6 of ADAPTIVE_COACH.md (§14) — around the bug
 * hunts the site already had. Four things, each the bug-hunt twin of a
 * problem-side feature, reading the rules in src/lib:
 *
 *  1. The incident clock (lib/bug-incident): BugEngagement's first open and
 *     the hand-started incident, from which the diagnosis time is derived.
 *  2. The shipped build's symptoms: the visible tests run once against the
 *     buggy files, stored on BugChallenge.symptoms the first time a hunt is
 *     read without them. One engine run per hunt, ever — serialised, and
 *     never retried within the hour after a failure.
 *  3. "Why it failed" (lib/bug-failure + lib/bug-review) on every failed
 *     submit and the postmortem's score (lib/root-cause) on every write-up:
 *     one small in-process queue, the runner pattern of
 *     services/submission-analysis.ts. Nobody waits; the workspace polls.
 *  4. The tutor (lib/bug-tutor): the problem tutor's service over a hunt.
 *
 * Unlimited by the owner's standing decision, like every coach feature; the
 * routes' limiters are the brake. No model in a live duel. Nothing here pays
 * XP: a hunt's PASS can be forged, and a write-up can be anything.
 */

const CONCURRENCY = Number(process.env["BUG_REVIEW_CONCURRENCY"] ?? 2);
const QUEUE_CAP = 300;
const RECOVER_WITHIN_MS = 60 * 60_000;
const PENDING_WINDOW_MS = 2 * 60_000;
const REVIEW_TOKENS = 1_400;
const ROOT_CAUSE_TOKENS = 1_000;
const TUTOR_TOKENS = 1_200;
const THREAD_SHOWN = 60;

const json = (v: unknown) => v as Prisma.InputJsonValue;

/** A failure the routes turn into a status; anything else is a 500. */
export class CoachError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "CoachError";
  }
}

// ── The hunt as the coach reads it ────────────────────────────────

interface CoachHunt {
  id: string;
  slug: string | null;
  title: string;
  description: string;
  bugReport: string;
  logs: string | null;
  language: string;
  difficulty: string;
  symptoms: unknown;
  files: Array<{ filePath: string; content: string; isEditable: boolean }>;
  /** Visible tests only; the tutor reads their source from Locate up. */
  visibleTests: Array<{ name: string; source: string }>;
}

const huntKey = (id: string) => `bug-coach:hunt:v1:${id}`;

/** Seeded content, the same for everyone: ten minutes in memory. Never a hidden test. */
function huntFor(challengeId: string): Promise<CoachHunt | null> {
  return cached(huntKey(challengeId), 10 * 60_000, async () => {
    const h = await prisma.bugChallenge.findFirst({
      where: { id: challengeId, isPublished: true },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        bugReport: true,
        logs: true,
        language: true,
        difficulty: true,
        symptoms: true,
        files: { select: { filePath: true, content: true, isEditable: true }, orderBy: { filePath: "asc" } },
        tests: { where: { isHidden: false }, select: { name: true, runCommand: true } },
      },
    });
    if (!h) return null;
    const { tests, ...rest } = h;
    return { ...rest, visibleTests: tests.map((t) => ({ name: t.name, source: t.runCommand })) };
  });
}

async function huntOr404(idOrSlug: string): Promise<CoachHunt> {
  const id = await bugIdFor(idOrSlug);
  const hunt = id ? await huntFor(id) : null;
  if (!hunt) throw new CoachError("No such bug hunt.", 404);
  return hunt;
}

// ── 1. The incident clock ─────────────────────────────────────────

export interface IncidentStanding {
  openedAt: Date | null;
  incidentAt: Date | null;
  diagnosis: Diagnosis | null;
}

/** A member opened the hunt: the first time is kept, nothing else moves. */
export async function recordBugOpen(userId: string, challengeId: string): Promise<void> {
  await prisma.bugEngagement.createMany({ data: [{ userId, challengeId }], skipDuplicates: true });
}

/** The incident clock, for the hunter's side of the page (routes' hunterStanding). */
export async function incidentStanding(userId: string, challengeId: string, difficulty: string): Promise<IncidentStanding> {
  const [engagement, subs] = await Promise.all([
    prisma.bugEngagement.findUnique({ where: { userId_challengeId: { userId, challengeId } }, select: { openedAt: true, incidentAt: true } }),
    prisma.bugSubmission.findMany({ where: { userId, challengeId }, select: { verdict: true, submittedAt: true }, orderBy: { submittedAt: "asc" }, take: 200 }),
  ]);
  return { openedAt: engagement?.openedAt ?? null, incidentAt: engagement?.incidentAt ?? null, diagnosis: diagnosisOf(engagement, subs, difficulty) };
}

/**
 * "Start incident": the clock the diagnosis runs from. Started once — a
 * second press leaves it where it is, as a rung once reached stays — so the
 * time cannot be reset to flatter a slow fix.
 */
export async function startIncident(userId: string, idOrSlug: string): Promise<IncidentStanding> {
  const hunt = await huntOr404(idOrSlug);
  const now = new Date();
  const created = await prisma.bugEngagement.createMany({ data: [{ userId, challengeId: hunt.id, openedAt: now, incidentAt: now }], skipDuplicates: true });
  if (!created.count) await prisma.bugEngagement.updateMany({ where: { userId, challengeId: hunt.id, incidentAt: null }, data: { incidentAt: now } });
  invalidateSkillProfile(userId);
  return incidentStanding(userId, hunt.id, hunt.difficulty);
}

// ── 2. The shipped build's symptoms ───────────────────────────────

const symptomTried = new Map<string, number>();
const SYMPTOM_RETRY_MS = 60 * 60_000;
let symptomChain: Promise<void> = Promise.resolve();

/**
 * Called by the content read when a hunt has no symptoms yet: queue the one
 * run that records them. Serialised (one engine run at a time, whatever the
 * crawl rate) and remembered per process, so a failure is not retried for
 * an hour. `BUG_SYMPTOMS=off` turns it off (tests, a judge-less dev box).
 */
export function ensureSymptoms(challengeId: string): void {
  if (process.env["BUG_SYMPTOMS"] === "off") return;
  const last = symptomTried.get(challengeId);
  if (last && Date.now() - last < SYMPTOM_RETRY_MS) return;
  symptomTried.set(challengeId, Date.now());
  symptomChain = symptomChain.then(() => fillSymptoms(challengeId)).catch((err) => console.error("bug symptoms: run failed:", (err as Error).message));
}

/** Record one hunt's symptoms now (scripts/bug-symptoms.ts runs it over the catalogue). */
export async function fillSymptoms(challengeId: string): Promise<void> {
  const h = await prisma.bugChallenge.findUnique({
    where: { id: challengeId },
    select: { language: true, symptoms: true, files: { select: { filePath: true, content: true } }, tests: { where: { isHidden: false }, select: { name: true, runCommand: true } } },
  });
  if (!h || h.symptoms != null) return;
  const symptoms = h.tests.length
    ? (await judgeBugProject(h.files, h.tests.map((t) => ({ name: t.name, source: t.runCommand })), h.language as BugLanguage)).results.map((r) => ({
        name: r.name,
        passed: r.passed,
        detail: r.detail.length > SYMPTOM_DETAIL_CHARS ? `${r.detail.slice(0, SYMPTOM_DETAIL_CHARS - 1)}…` : r.detail,
      }))
    : [];
  await prisma.bugChallenge.update({ where: { id: challengeId }, data: { symptoms: json(symptoms) } });
  invalidate(bugDetailKey(challengeId));
  invalidate(huntKey(challengeId));
}

// ── 3. The queue: reviews and postmortems ─────────────────────────

type Job = { kind: "review" | "rootCause"; id: string };
const queue: Job[] = [];
const running = new Set<string>();
const jobKey = (j: Job) => `${j.kind}:${j.id}`;

function enqueue(job: Job): void {
  const key = jobKey(job);
  if (running.has(key) || queue.some((j) => jobKey(j) === key)) return;
  if (queue.length >= QUEUE_CAP) {
    const dropped = queue.shift()!;
    void (dropped.kind === "review"
      ? prisma.bugSubmissionAnalysis.updateMany({ where: { submissionId: dropped.id, status: "queued" }, data: { status: "failed", reason: "busy" } })
      : prisma.bugSubmission.updateMany({ where: { id: dropped.id, rootCauseStatus: "queued" }, data: { rootCauseStatus: "failed" } })
    ).catch(() => undefined);
  }
  queue.push(job);
  pump();
}

function pump(): void {
  while (running.size < CONCURRENCY && queue.length) {
    const job = queue.shift()!;
    const key = jobKey(job);
    running.add(key);
    void (job.kind === "review" ? runReview(job.id) : runRootCause(job.id))
      .catch((err) => console.error(`bug coach: ${job.kind} failed:`, (err as Error).message))
      .finally(() => {
        running.delete(key);
        pump();
      });
  }
}

/** At boot: young queued/running rows are picked up again; older ones are failed. */
export async function recoverBugCoach(): Promise<void> {
  try {
    const since = new Date(Date.now() - RECOVER_WITHIN_MS);
    await prisma.bugSubmissionAnalysis.updateMany({ where: { status: { in: ["queued", "running"] }, createdAt: { lt: since } }, data: { status: "failed", reason: "error" } });
    await prisma.bugSubmission.updateMany({ where: { rootCauseStatus: { in: ["queued", "running"] }, rootCauseAt: { lt: since } }, data: { rootCauseStatus: "failed" } });
    const [reviews, writeUps] = await Promise.all([
      prisma.bugSubmissionAnalysis.findMany({ where: { status: { in: ["queued", "running"] } }, select: { submissionId: true }, orderBy: { createdAt: "asc" } }),
      prisma.bugSubmission.findMany({ where: { rootCauseStatus: { in: ["queued", "running"] } }, select: { id: true }, orderBy: { rootCauseAt: "asc" } }),
    ]);
    if (reviews.length) await prisma.bugSubmissionAnalysis.updateMany({ where: { submissionId: { in: reviews.map((r) => r.submissionId) } }, data: { status: "queued" } });
    if (writeUps.length) await prisma.bugSubmission.updateMany({ where: { id: { in: writeUps.map((r) => r.id) } }, data: { rootCauseStatus: "queued" } });
    for (const r of reviews) enqueue({ kind: "review", id: r.submissionId });
    for (const r of writeUps) enqueue({ kind: "rootCause", id: r.id });
  } catch (err) {
    console.error("bug coach: recovery failed:", (err as Error).message);
  }
}

// ── 3a. Why it failed ─────────────────────────────────────────────

export interface FailedBugSubmission {
  submissionId: string;
  userId: string;
  challengeId: string;
  verdict: string;
  /** The judge's results as the hunter was shown them (hidden ones already reduced to "Hidden test failed"). */
  checks: BugCheck[];
  editedFiles: Record<string, string>;
}

/** The submitted editable files, in a fixed order — the same code hashes the same. */
const hashOf = (hunt: CoachHunt, edited: Record<string, unknown>) =>
  createHash("sha256")
    .update(hunt.files.filter((f) => f.isEditable).map((f) => `${f.filePath}\n${typeof edited[f.filePath] === "string" ? edited[f.filePath] : f.content}`).join("\n\u0000\n"))
    .digest("hex");

/** After a fix that was not accepted: its deterministic reading now, the model's review queued. Never throws. */
export async function noteFailedBugSubmission(f: FailedBugSubmission): Promise<void> {
  try {
    const hunt = await huntFor(f.challengeId);
    if (!hunt) return;
    const patch = patchOf(hunt.files, f.editedFiles);
    const deterministic = analyzeBugFailure({ verdict: f.verdict, checks: f.checks, patch, symptoms: symptomsOf(hunt.symptoms) });
    const duel = await findLiveDuelFor(f.userId, { challengeId: f.challengeId }).catch(() => null);
    const status = duel || !ai.available() ? "skipped" : "queued";
    const created = await prisma.bugSubmissionAnalysis.createMany({
      data: [
        {
          submissionId: f.submissionId,
          userId: f.userId,
          challengeId: f.challengeId,
          status,
          reason: duel ? "duel" : ai.available() ? null : "unavailable",
          category: deterministic.category,
          deterministic: json(deterministic),
          codeHash: hashOf(hunt, f.editedFiles),
        },
      ],
      skipDuplicates: true,
    });
    if (created.count && status === "queued") enqueue({ kind: "review", id: f.submissionId });
  } catch (err) {
    console.error("bug coach: note failed:", (err as Error).message);
  }
}

async function runReview(submissionId: string): Promise<void> {
  const claimed = await prisma.bugSubmissionAnalysis.updateMany({ where: { submissionId, status: "queued" }, data: { status: "running" } });
  if (!claimed.count) return;
  const row = await prisma.bugSubmissionAnalysis.findUnique({
    where: { submissionId },
    select: { userId: true, challengeId: true, codeHash: true, deterministic: true, submission: { select: { verdict: true, editedFiles: true } } },
  });
  if (!row) return;
  try {
    const hunt = await huntFor(row.challengeId);
    if (!hunt) throw new Error("hunt gone");
    const earlier = await prisma.bugSubmissionAnalysis.findFirst({
      where: { userId: row.userId, challengeId: row.challengeId, codeHash: row.codeHash, status: "done", promptVersion: PROMPT_VERSIONS["bug-review"], submissionId: { not: submissionId } },
      orderBy: { createdAt: "desc" },
      select: { ai: true, category: true, model: true, promptVersion: true },
    });
    if (earlier?.ai) {
      await prisma.bugSubmissionAnalysis.update({ where: { submissionId }, data: { status: "done", reason: "reused", ai: json(earlier.ai), category: earlier.category, model: earlier.model, promptVersion: earlier.promptVersion } });
      return;
    }
    const edited = (row.submission.editedFiles ?? {}) as Record<string, unknown>;
    const files = hunt.files.map((f) => ({ ...f, content: f.isEditable && typeof edited[f.filePath] === "string" ? (edited[f.filePath] as string) : f.content }));
    const known = row.deterministic as unknown as BugDeterministic;
    const ctx = {
      title: hunt.title,
      description: hunt.description,
      bugReport: hunt.bugReport,
      logs: hunt.logs,
      language: hunt.language,
      files,
      patchText: patchText(patchOf(hunt.files, edited)),
      verdict: row.submission.verdict,
      known,
    };
    const prompt = promptFor("bug-review");
    const { parsed, usage } = await ai.json(buildBugReviewMessages(ctx, prompt.text), BugReviewSchema, "bug_review", { maxTokens: REVIEW_TOKENS, temperature: 0.2, coerce: coerceBugReview });
    const reviewed = guardBugReview(parsed, ctx);
    if (!reviewed) throw new Error("the model returned nothing usable");
    await prisma.bugSubmissionAnalysis.update({
      where: { submissionId },
      data: { status: "done", ai: json(reviewed), category: reviewed.category, model: ai.model(), promptVersion: prompt.version, tokens: usage.promptTokens + usage.completionTokens },
    });
  } catch (err) {
    console.error("bug coach: review failed:", (err as Error).message);
    await prisma.bugSubmissionAnalysis.update({ where: { submissionId }, data: { status: "failed", reason: "error" } });
  }
}

export interface BugAnalysisView {
  submissionId: string;
  status: "pending" | "queued" | "running" | "done" | "failed" | "skipped";
  reason: string | null;
  category: string | null;
  deterministic: BugDeterministic | null;
  ai: BugAiReview | null;
}

/** One failed fix's reading, for its owner; "pending" for a moment after judging, null when there will never be one. */
export async function bugAnalysisFor(userId: string, submissionId: string): Promise<BugAnalysisView | null> {
  const row = await prisma.bugSubmissionAnalysis.findUnique({ where: { submissionId }, select: { userId: true, status: true, reason: true, category: true, deterministic: true, ai: true } });
  if (row) {
    if (row.userId !== userId) return null;
    return {
      submissionId,
      status: row.status as BugAnalysisView["status"],
      reason: row.reason,
      category: row.category,
      deterministic: row.deterministic as unknown as BugDeterministic,
      ai: (row.ai as unknown as BugAiReview | null) ?? null,
    };
  }
  const sub = await prisma.bugSubmission.findFirst({ where: { id: submissionId, userId }, select: { verdict: true, submittedAt: true } });
  if (!sub || sub.verdict === "ACCEPTED" || Date.now() - sub.submittedAt.getTime() > PENDING_WINDOW_MS) return null;
  return { submissionId, status: "pending", reason: null, category: null, deterministic: null, ai: null };
}

// ── 3b. The postmortem ────────────────────────────────────────────

export interface PostmortemView {
  submissionId: string;
  challengeId: string;
  submittedAt: Date;
  text: string | null;
  writtenAt: Date | null;
  status: "none" | "queued" | "running" | "done" | "failed" | "skipped";
  score: number | null;
  review: RootCauseReview | null;
  /** The accepted patch, for "your fix" beside the write-up. */
  patch: Patch;
  rubric: typeof RUBRIC;
  diagnosis: Diagnosis | null;
}

/** An accepted fix's postmortem, for its owner; null for anyone else's or a fix that was not accepted. */
export async function postmortemFor(userId: string, submissionId: string): Promise<PostmortemView | null> {
  const s = await prisma.bugSubmission.findFirst({
    where: { id: submissionId, userId, verdict: "ACCEPTED" },
    select: { id: true, challengeId: true, submittedAt: true, editedFiles: true, rootCause: true, rootCauseAt: true, rootCauseStatus: true, rootCauseScore: true, rootCauseReview: true },
  });
  if (!s) return null;
  const hunt = await huntFor(s.challengeId);
  if (!hunt) return null;
  const standing = await incidentStanding(userId, s.challengeId, hunt.difficulty);
  return {
    submissionId: s.id,
    challengeId: s.challengeId,
    submittedAt: s.submittedAt,
    text: s.rootCause,
    writtenAt: s.rootCauseAt,
    status: (s.rootCauseStatus as PostmortemView["status"]) ?? "none",
    score: s.rootCauseScore,
    review: (s.rootCauseReview as unknown as RootCauseReview | null) ?? null,
    patch: patchOf(hunt.files, (s.editedFiles ?? {}) as Record<string, unknown>),
    rubric: RUBRIC,
    // The diagnosis is the first fix's; a later accepted resubmit shows the same clock.
    diagnosis: standing.diagnosis,
  };
}

/** Write (or rewrite) the root cause of an accepted fix and queue its score. */
export async function submitRootCause(userId: string, submissionId: string, raw: unknown): Promise<PostmortemView> {
  const valid = validateRootCause(raw);
  if ("error" in valid) throw new CoachError(valid.error, 400);
  const s = await prisma.bugSubmission.findFirst({ where: { id: submissionId, userId }, select: { verdict: true, rootCauseStatus: true } });
  if (!s) throw new CoachError("No such submission.", 404);
  if (s.verdict !== "ACCEPTED") throw new CoachError("Write the root cause once the fix is accepted.", 409);
  if (s.rootCauseStatus === "queued" || s.rootCauseStatus === "running") throw new CoachError("Your last write-up is still being scored.", 409);
  const status = ai.available() ? "queued" : "skipped";
  await prisma.bugSubmission.update({
    where: { id: submissionId },
    data: { rootCause: valid.text, rootCauseAt: new Date(), rootCauseStatus: status, rootCauseReview: Prisma.DbNull, rootCauseScore: null, rootCauseModel: null, rootCausePromptVersion: null },
  });
  if (status === "queued") enqueue({ kind: "rootCause", id: submissionId });
  return (await postmortemFor(userId, submissionId))!;
}

async function runRootCause(submissionId: string): Promise<void> {
  const claimed = await prisma.bugSubmission.updateMany({ where: { id: submissionId, rootCauseStatus: "queued" }, data: { rootCauseStatus: "running" } });
  if (!claimed.count) return;
  const s = await prisma.bugSubmission.findUnique({ where: { id: submissionId }, select: { challengeId: true, editedFiles: true, rootCause: true } });
  if (!s?.rootCause) return;
  try {
    const hunt = await huntFor(s.challengeId);
    if (!hunt) throw new Error("hunt gone");
    const prompt = promptFor("root-cause");
    const messages = buildRootCauseMessages(
      {
        title: hunt.title,
        bugReport: hunt.bugReport,
        logs: hunt.logs,
        files: hunt.files.filter((f) => f.isEditable),
        patchText: patchText(patchOf(hunt.files, (s.editedFiles ?? {}) as Record<string, unknown>)),
        writeUp: s.rootCause,
      },
      prompt.text,
    );
    const { parsed } = await ai.json(messages, RootCauseSchema, "root_cause_score", { maxTokens: ROOT_CAUSE_TOKENS, temperature: 0.1, coerce: coerceRootCause });
    const review = guardRootCause(parsed);
    if (!review) throw new Error("the model scored nothing");
    // Only if the text scored is still the text stored: a rewrite while this ran queued its own score.
    await prisma.bugSubmission.updateMany({
      where: { id: submissionId, rootCause: s.rootCause, rootCauseStatus: "running" },
      data: { rootCauseStatus: "done", rootCauseReview: json(review), rootCauseScore: review.score, rootCauseModel: ai.model(), rootCausePromptVersion: prompt.version },
    });
  } catch (err) {
    console.error("bug coach: root cause failed:", (err as Error).message);
    await prisma.bugSubmission.updateMany({ where: { id: submissionId, rootCauseStatus: "running" }, data: { rootCauseStatus: "failed" } });
  }
}

// ── 4. The tutor ──────────────────────────────────────────────────

export interface BugTutorState {
  rung: number;
  turns: Array<{ id: string; role: "student" | "tutor"; rung: number; content: string; createdAt: Date }>;
  /** Off in a live duel on this hunt — help the other side does not get. */
  blocked: "duel" | null;
  available: boolean;
}

const duelBlock = async (userId: string, challengeId: string): Promise<"duel" | null> =>
  (await findLiveDuelFor(userId, { challengeId }).catch(() => null)) ? "duel" : null;

export async function bugTutorState(userId: string, idOrSlug: string): Promise<BugTutorState> {
  const hunt = await huntOr404(idOrSlug);
  const [engagement, rows, blocked] = await Promise.all([
    prisma.bugEngagement.findUnique({ where: { userId_challengeId: { userId, challengeId: hunt.id } }, select: { tutorRung: true } }),
    prisma.bugTutorTurn.findMany({ where: { userId, challengeId: hunt.id }, orderBy: { createdAt: "desc" }, take: THREAD_SHOWN, select: { id: true, role: true, rung: true, content: true, createdAt: true } }),
    duelBlock(userId, hunt.id),
  ]);
  return {
    rung: rungOf(engagement?.tutorRung ?? 0),
    turns: rows.reverse().map((r) => ({ ...r, role: r.role === "tutor" ? "tutor" : "student" })),
    blocked,
    available: ai.available(),
  };
}

export async function clearBugTutor(userId: string, idOrSlug: string): Promise<void> {
  const hunt = await huntOr404(idOrSlug);
  await prisma.bugTutorTurn.deleteMany({ where: { userId, challengeId: hunt.id } });
}

/** A climb, once its answer has shown: the rung, and the first time it gave hint- or fix-level help. */
async function recordClimb(userId: string, challengeId: string, rung: number, at: Date): Promise<void> {
  const help = BUG_RUNGS[rung]!.help;
  const firstHelp = help === "hints" ? { tutorHintAt: at } : help === "solution" ? { tutorSolutionAt: at } : {};
  const created = await prisma.bugEngagement.createMany({ data: [{ userId, challengeId, openedAt: at, tutorRung: rung, ...firstHelp }], skipDuplicates: true });
  if (!created.count) {
    await prisma.bugEngagement.updateMany({ where: { userId, challengeId, OR: [{ tutorRung: null }, { tutorRung: { lt: rung } }] }, data: { tutorRung: rung } });
    if (help === "hints") await prisma.bugEngagement.updateMany({ where: { userId, challengeId, tutorHintAt: null }, data: { tutorHintAt: at } });
    if (help === "solution") await prisma.bugEngagement.updateMany({ where: { userId, challengeId, tutorSolutionAt: null }, data: { tutorSolutionAt: at } });
  }
  if (help !== "none") invalidateSkillProfile(userId);
}

export interface BugTutorAsk {
  message: string;
  /** The hunter's edited files as one text, when shared. */
  code: string | null;
  rung: number | null;
}

/** One turn on a hunt, streamed through the code gate — services/tutor.ts tutorReply's shape. */
export async function bugTutorReply(
  userId: string,
  idOrSlug: string,
  ask: BugTutorAsk,
  onRung: (rung: number) => void,
  onToken: (text: string) => void,
): Promise<{ turnId: string; content: string; rung: number }> {
  const hunt = await huntOr404(idOrSlug);
  if (!ai.available()) throw new CoachError("The tutor is not available right now.", 503);
  if (await duelBlock(userId, hunt.id)) throw new CoachError("The tutor is off while you are in a live duel on this hunt.", 403);

  const [engagement, recent, last] = await Promise.all([
    prisma.bugEngagement.findUnique({ where: { userId_challengeId: { userId, challengeId: hunt.id } }, select: { tutorRung: true } }),
    prisma.bugTutorTurn.findMany({ where: { userId, challengeId: hunt.id }, orderBy: { createdAt: "desc" }, take: TUTOR_LIMITS.history, select: { role: true, content: true } }),
    prisma.bugSubmission.findFirst({
      where: { userId, challengeId: hunt.id },
      orderBy: { submittedAt: "desc" },
      select: { verdict: true, passedTests: true, totalTests: true, analysis: { select: { deterministic: true, ai: true } } },
    }),
  ]);
  const step = rungFor(rungOf(engagement?.tutorRung ?? 0), ask.rung);
  if (!step) throw new CoachError("The tutor climbs one rung at a time, and a rung once reached stays.", 400);
  const message = ask.message.trim().slice(0, TUTOR_LIMITS.message) || (step.climbed ? BUG_RUNGS[step.rung]!.ask : "");
  if (!message) throw new CoachError("Write a message first.", 400);

  const det = (last?.analysis?.deterministic ?? null) as { headline?: unknown } | null;
  const review = (last?.analysis?.ai ?? null) as { summary?: unknown } | null;
  const { text: system, version } = promptFor("bug-tutor");
  const messages = buildBugTutorMessages(
    {
      title: hunt.title,
      description: hunt.description,
      bugReport: hunt.bugReport,
      logs: hunt.logs,
      language: hunt.language,
      files: hunt.files,
      symptoms: symptomsOf(hunt.symptoms),
      visibleTests: hunt.visibleTests,
      rung: step.rung,
      code: ask.code,
      lastSubmission: last
        ? {
            verdict: last.verdict,
            passed: last.passedTests,
            total: last.totalTests,
            headline: typeof det?.headline === "string" ? det.headline : null,
            review: typeof review?.summary === "string" ? review.summary : null,
          }
        : null,
      history: recent.reverse().map((t): TutorTurnText => ({ role: t.role === "tutor" ? "tutor" : "student", content: t.content })),
      message,
      climbed: step.climbed,
    },
    system,
  );

  if (step.climbed) onRung(step.rung);
  const gate = codeGate(step.rung);
  let shown = "";
  const emit = (t: string) => {
    if (!t) return;
    shown += t;
    onToken(t);
  };
  let model: string;
  try {
    ({ model } = await ai.stream(messages, { maxTokens: TUTOR_TOKENS, temperature: 0.3, model: process.env["TUTOR_MODEL"] || undefined }, (t) => emit(gate.push(t))));
    emit(gate.end());
  } catch (err) {
    if (step.climbed && shown.trim()) await recordClimb(userId, hunt.id, step.rung, new Date()).catch(() => {});
    if (err instanceof AIStreamError) throw new CoachError(err.status === 504 ? "The tutor took too long to answer — try again." : "The tutor could not answer just now — try again.", err.status >= 500 ? 503 : err.status);
    throw err;
  }

  const content = shown.trim();
  const now = new Date();
  const [, row] = await prisma.$transaction([
    prisma.bugTutorTurn.create({ data: { userId, challengeId: hunt.id, role: "student", rung: step.rung, content: message, createdAt: new Date(now.getTime() - 1) }, select: { id: true } }),
    prisma.bugTutorTurn.create({ data: { userId, challengeId: hunt.id, role: "tutor", rung: step.rung, content, model, promptVersion: version, createdAt: now }, select: { id: true } }),
  ]);
  if (step.climbed) await recordClimb(userId, hunt.id, step.rung, now);
  return { turnId: row.id, content, rung: step.rung };
}
