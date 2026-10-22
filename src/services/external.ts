import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { ai, AIStreamError } from "../lib/ai/provider.js";
import { PROMPT_VERSIONS, promptFor } from "../lib/ai/prompts.js";
import { analyzeFailure, type DeterministicAnalysis } from "../lib/failure-analysis.js";
import { buildReviewMessages, coerceReview, guardReview, ReviewSchema, type AiReview } from "../lib/submission-review.js";
import { RUNGS, TUTOR_LIMITS, buildTutorMessages, codeGate, rungFor, rungOf, type TutorTurnText } from "../lib/tutor.js";
import { recommendFor } from "../lib/skill-profile.js";
import { skillsForProblemTags } from "../lib/skill-graph.js";
import { lessonForHub } from "../lib/roadmap-lessons.js";
import {
  PROBLEM_LIMITS,
  RANKED_MESSAGE,
  SOLVE_LIMITS,
  externalUrl,
  isDue,
  languageOf,
  matchProblem,
  normaliseTags,
  rankedPath,
  revise,
  verdictOf,
  type ExternalSource,
  type PageProblem,
  type ReportedSolve,
  type RevisionEvent,
  type RevisionState,
} from "../lib/external.js";
import { getCatalogue, invalidateDashboard } from "./dashboard.js";
import { hubsForTags } from "./problem-hubs.js";
import { roadDefinition } from "./roadmap.js";
import { skillProfileFor } from "./skill-profile.js";
import { solutionFor, tutorProblem } from "./tutor.js";

/**
 * The browser extension's half of the API (routes/extension.ts at /api/ext;
 * the rules are lib/external.ts). Everything it answers is something the
 * site already computes for its own pages, pointed at a LeetCode problem:
 *
 *   problem    the matching catalogue problem's companies, topics, lessons,
 *              roadmap stage — and the account's record of it
 *   solves     an accept seen on LeetCode, or the whole solved list imported,
 *              into ExternalSolve — read by the skill profile, the mission's
 *              reviews and cohort progress like any solve, at half credit
 *   reviews    the per-problem revision ladder
 *   next       the problem's weakest skill and what to do for it
 *   tutor      the workbench tutor's ladder on the page's own statement
 *   failures   "Why it failed" on LeetCode's verdict, answered while waiting
 */

export class ExternalError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ExternalError";
  }
}

const json = (v: unknown) => v as Prisma.InputJsonValue;

// ── The problem panel ─────────────────────────────────────────────

export interface ExternalProblemView {
  /** The same problem in our catalogue, or null. */
  match: { slug: string; title: string; number: number | null; difficulty: string; href: string } | null;
  /** Companies that ask it (our company tags), with their hub — the panel's "Asked at". */
  companies: Array<{ label: string; slug: string; href: string; count: number; readinessHref: string }>;
  /** Its topics: the hub, and the roadmap lesson that teaches it. */
  topics: Array<{ label: string; slug: string; href: string; lesson: { slug: string; title: string; minutes: number; href: string } | null }>;
  /** The roadmap stage it sits in, and how far the account is through that stage. */
  roadmap: { key: string; title: string; href: string; required: number; solved: number | null; total: number } | null;
  /** The account's record of it on the other site; null for a visitor or a problem never solved. */
  solve: SolveView | null;
}

export interface SolveView {
  slug: string;
  title: string;
  difficulty: string;
  url: string;
  firstSolvedAt: string;
  lastSolvedAt: string;
  imported: boolean;
  track: boolean;
  stage: number;
  nextReviewAt: string | null;
  due: boolean;
  /** CodeKairo's copy, when there is one. */
  match: { slug: string; href: string } | null;
}

type SolveRow = {
  slug: string;
  title: string;
  difficulty: string;
  problemId: string | null;
  firstSolvedAt: Date;
  lastSolvedAt: Date;
  imported: boolean;
  track: boolean;
  reviewStage: number;
  nextReviewAt: Date | null;
  lastReviewedAt: Date | null;
};

const SOLVE_SELECT = {
  slug: true,
  title: true,
  difficulty: true,
  problemId: true,
  firstSolvedAt: true,
  lastSolvedAt: true,
  imported: true,
  track: true,
  reviewStage: true,
  nextReviewAt: true,
  lastReviewedAt: true,
} as const;

async function catalogueSlugById(): Promise<Map<string, string>> {
  return new Map((await getCatalogue()).map((p) => [p.id, p.slug]));
}

function solveView(source: ExternalSource, row: SolveRow, slugOf: ReadonlyMap<string, string>, now = Date.now()): SolveView {
  const matched = row.problemId ? slugOf.get(row.problemId) : undefined;
  return {
    slug: row.slug,
    title: row.title,
    difficulty: row.difficulty,
    url: externalUrl(source, row.slug),
    firstSolvedAt: row.firstSolvedAt.toISOString(),
    lastSolvedAt: row.lastSolvedAt.toISOString(),
    imported: row.imported,
    track: row.track,
    stage: row.reviewStage,
    nextReviewAt: row.nextReviewAt?.toISOString() ?? null,
    due: isDue({ track: row.track, nextReviewAt: row.nextReviewAt?.getTime() ?? null }, now),
    match: matched ? { slug: matched, href: `/problems/${matched}` } : null,
  };
}

/** The catalogue problem behind a LeetCode slug (and the title the page shows). */
export async function matchFor(slug: string, title: string | null) {
  return matchProblem(await getCatalogue(), slug, title);
}

export async function problemInfo(source: ExternalSource, slug: string, title: string | null, userId: string | null): Promise<ExternalProblemView> {
  const [match, road, row] = await Promise.all([
    matchFor(slug, title),
    roadDefinition().catch(() => null),
    userId ? prisma.externalSolve.findUnique({ where: { userId_source_slug: { userId, source, slug } }, select: SOLVE_SELECT }) : Promise.resolve(null),
  ]);
  const tags = match && Array.isArray(match.tags) ? (match.tags as string[]) : [];
  const hubs = match ? await hubsForTags(tags) : { topics: [], companies: [] };
  const stageOrder = road?.stages.map((s) => s.id) ?? [];
  const stage = match ? (road?.stages.find((s) => s.problems.some((p) => p.id === match.id)) ?? null) : null;

  let stageSolved: number | null = null;
  if (stage && userId) {
    const ids = stage.problems.map((p) => p.id);
    const solved = await prisma.submission.groupBy({ by: ["problemId"], where: { userId, problemId: { in: ids }, verdict: "ACCEPTED" } });
    stageSolved = solved.length;
  }

  return {
    match: match ? { slug: match.slug, title: match.title, number: match.number ?? null, difficulty: match.difficulty, href: `/problems/${match.slug}` } : null,
    companies: hubs.companies.map((c) => ({
      label: c.label,
      slug: c.slug,
      href: `/challenges/company/${c.slug}`,
      count: c.count,
      readinessHref: `/readiness?company=${encodeURIComponent(c.label)}`,
    })),
    topics: hubs.topics.map((t) => {
      const lesson = lessonForHub(t.slug, stageOrder);
      return {
        label: t.label,
        slug: t.slug,
        href: `/challenges/${t.slug}`,
        lesson: lesson ? { slug: lesson.slug, title: lesson.title, minutes: lesson.minutes, href: `/roadmap/${lesson.slug}` } : null,
      };
    }),
    roadmap: stage
      ? { key: stage.key, title: stage.title, href: `/roadmap?stage=${encodeURIComponent(stage.key)}`, required: stage.required, solved: stageSolved, total: stage.problems.length }
      : null,
    solve: row ? solveView(source, row, await catalogueSlugById()) : null,
  };
}

// ── Solves ────────────────────────────────────────────────────────

const stateOf = (row: Pick<SolveRow, "track" | "reviewStage" | "nextReviewAt" | "lastReviewedAt">): RevisionState => ({
  track: row.track,
  stage: row.reviewStage,
  nextReviewAt: row.nextReviewAt?.getTime() ?? null,
  lastReviewedAt: row.lastReviewedAt?.getTime() ?? null,
});

const columnsOf = (s: RevisionState) => ({
  track: s.track,
  reviewStage: s.stage,
  nextReviewAt: s.nextReviewAt != null ? new Date(s.nextReviewAt) : null,
  lastReviewedAt: s.lastReviewedAt != null ? new Date(s.lastReviewedAt) : null,
});

/**
 * An accept the extension saw on the page. The first one creates the row;
 * a later one moves `lastSolvedAt` and, on a tracked problem, is a review —
 * on or after its due day it climbs the ladder.
 */
export async function recordSolve(userId: string, source: ExternalSource, solve: ReportedSolve, track: boolean | null): Promise<SolveView> {
  const match = await matchFor(solve.slug, solve.title);
  const existing = await prisma.externalSolve.findUnique({ where: { userId_source_slug: { userId, source, slug: solve.slug } }, select: SOLVE_SELECT });
  const at = new Date(solve.at);
  let row: SolveRow;
  if (!existing) {
    let state: RevisionState = { track: false, stage: -1, nextReviewAt: null, lastReviewedAt: null };
    if (track) state = revise(state, { kind: "track", at: solve.at, solvedAt: solve.at });
    row = await prisma.externalSolve.create({
      data: {
        userId,
        source,
        slug: solve.slug,
        title: solve.title,
        difficulty: solve.difficulty,
        tags: json(normaliseTags(solve.tags)),
        problemId: match?.id ?? null,
        firstSolvedAt: at,
        lastSolvedAt: at,
        ...columnsOf(state),
      },
      select: SOLVE_SELECT,
    });
  } else {
    let state = revise(stateOf(existing), { kind: "accepted", at: solve.at });
    if (track === true) state = revise(state, { kind: "track", at: solve.at, solvedAt: solve.at });
    if (track === false) state = revise(state, { kind: "untrack" });
    row = await prisma.externalSolve.update({
      where: { userId_source_slug: { userId, source, slug: solve.slug } },
      data: {
        title: solve.title,
        difficulty: solve.difficulty,
        ...(solve.tags.length ? { tags: json(normaliseTags(solve.tags)) } : {}),
        problemId: match?.id ?? existing.problemId,
        lastSolvedAt: at > existing.lastSolvedAt ? at : existing.lastSolvedAt,
        // An import may carry an accept older than the one first seen.
        firstSolvedAt: at < existing.firstSolvedAt ? at : existing.firstSolvedAt,
        imported: false,
        ...columnsOf(state),
      },
      select: SOLVE_SELECT,
    });
  }
  invalidateDashboard(userId);
  return solveView(source, row, await catalogueSlugById());
}

/**
 * The account's solved list from the other site, as one batch (the
 * extension's "Import my solved list"). New problems are created; known ones
 * only gain an earlier first accept. `trackSince` (epoch ms) puts the solves
 * accepted since then on the revision ladder — the recent ones are the ones
 * worth bringing back; a whole history on it would be a wall of reviews.
 */
export async function importSolves(userId: string, source: ExternalSource, solves: ReportedSolve[], trackSince: number | null): Promise<{ added: number; known: number; tracked: number }> {
  const unique = [...new Map(solves.map((s) => [s.slug, s])).values()].slice(0, SOLVE_LIMITS.import);
  const [catalogue, existing] = await Promise.all([
    getCatalogue(),
    prisma.externalSolve.findMany({ where: { userId, source }, select: { slug: true, firstSolvedAt: true } }),
  ]);
  const known = new Map(existing.map((r) => [r.slug, r.firstSolvedAt]));
  const fresh = unique.filter((s) => !known.has(s.slug));
  let tracked = 0;
  const rows = fresh.map((s) => {
    const match = matchProblem(catalogue, s.slug, s.title);
    let state: RevisionState = { track: false, stage: -1, nextReviewAt: null, lastReviewedAt: null };
    if (trackSince != null && s.at >= trackSince) {
      state = revise(state, { kind: "track", at: Date.now(), solvedAt: s.at });
      tracked++;
    }
    return {
      userId,
      source,
      slug: s.slug,
      title: s.title,
      difficulty: s.difficulty,
      tags: json(normaliseTags(s.tags)),
      problemId: match?.id ?? null,
      firstSolvedAt: new Date(s.at),
      lastSolvedAt: new Date(s.at),
      imported: true,
      ...columnsOf(state),
    };
  });
  for (let i = 0; i < rows.length; i += 500) await prisma.externalSolve.createMany({ data: rows.slice(i, i + 500), skipDuplicates: true });
  // A known problem keeps its row; only an earlier first accept is news.
  const earlier = unique.filter((s) => known.has(s.slug) && s.at < known.get(s.slug)!.getTime());
  for (const s of earlier) {
    await prisma.externalSolve.updateMany({ where: { userId, source, slug: s.slug, firstSolvedAt: { gt: new Date(s.at) } }, data: { firstSolvedAt: new Date(s.at) } });
  }
  invalidateDashboard(userId);
  return { added: rows.length, known: unique.length - fresh.length, tracked };
}

export type RevisionAction = "track" | "untrack" | "remembered" | "forgot";

/** Track, untrack, or mark a review by hand ("I remembered it" / "I forgot it"). */
export async function setRevision(userId: string, source: ExternalSource, slug: string, action: RevisionAction): Promise<SolveView> {
  const row = await prisma.externalSolve.findUnique({ where: { userId_source_slug: { userId, source, slug } }, select: SOLVE_SELECT });
  if (!row) throw new ExternalError("Solve this problem first — its revisions start from an accepted submission.", 404);
  const now = Date.now();
  const event: RevisionEvent =
    action === "track" ? { kind: "track", at: now, solvedAt: row.lastSolvedAt.getTime() } : action === "untrack" ? { kind: "untrack" } : { kind: action, at: now };
  const before = stateOf(row);
  const next = revise(before, event);
  if (action === "remembered" && next === before) throw new ExternalError("This one is not due yet.", 409);
  const updated = await prisma.externalSolve.update({ where: { userId_source_slug: { userId, source, slug } }, data: columnsOf(next), select: SOLVE_SELECT });
  invalidateDashboard(userId);
  return solveView(source, updated, await catalogueSlugById());
}

export interface ReviewsView {
  due: SolveView[];
  /** Due within the next seven days, soonest first. */
  upcoming: SolveView[];
  tracked: number;
  solved: number;
}

const UPCOMING_DAYS = 7;
const REVIEWS_SHOWN = 50;

export async function reviewsFor(userId: string, source: ExternalSource): Promise<ReviewsView> {
  const now = Date.now();
  const horizon = new Date(now + UPCOMING_DAYS * 86_400_000);
  const [rows, tracked, solved, slugOf] = await Promise.all([
    prisma.externalSolve.findMany({
      where: { userId, source, track: true, nextReviewAt: { lte: horizon } },
      orderBy: { nextReviewAt: "asc" },
      take: REVIEWS_SHOWN * 2,
      select: SOLVE_SELECT,
    }),
    prisma.externalSolve.count({ where: { userId, source, track: true } }),
    prisma.externalSolve.count({ where: { userId, source } }),
    catalogueSlugById(),
  ]);
  const views = rows.map((r) => solveView(source, r, slugOf, now));
  return { due: views.filter((v) => v.due).slice(0, REVIEWS_SHOWN), upcoming: views.filter((v) => !v.due).slice(0, REVIEWS_SHOWN), tracked, solved };
}

/** The toolbar badge: reviews due today. One indexed count. */
export async function badgeFor(userId: string): Promise<{ reviewsDue: number }> {
  // Due = the due day has started (lib/external isDue); every nextReviewAt is a day start, so "≤ now" is the same test.
  const reviewsDue = await prisma.externalSolve.count({ where: { userId, track: true, nextReviewAt: { lte: new Date() } } });
  return { reviewsDue };
}

// ── What next ─────────────────────────────────────────────────────

export interface NextView {
  /** The problem's weakest skill in the account's profile, and what to do for it. */
  skill: { key: string; label: string; mastery: number } | null;
  problems: Array<{ slug: string; title: string; difficulty: string; href: string; leetcodeSearch: string }>;
  lesson: { slug: string; title: string; minutes: number; href: string } | null;
}

/**
 * After an accept on the page: of the skills this problem works, the
 * weakest, then a problem for it at the difficulty its mastery calls for —
 * the failure review's recommendation, from a solve instead. Problems are
 * ours; each carries a LeetCode search too, because the same problem
 * usually exists there under its own name.
 */
export async function nextFor(userId: string, source: ExternalSource, slug: string, title: string | null): Promise<NextView> {
  const [match, row, profile, road] = await Promise.all([
    matchFor(slug, title),
    prisma.externalSolve.findUnique({ where: { userId_source_slug: { userId, source, slug } }, select: { tags: true } }),
    skillProfileFor(userId),
    roadDefinition().catch(() => null),
  ]);
  const tags = match && Array.isArray(match.tags) ? (match.tags as string[]) : Array.isArray(row?.tags) ? (row!.tags as string[]) : [];
  const weakest = skillsForProblemTags(tags)
    .map((k) => profile.scored.get(k))
    .filter((s) => s != null)
    .sort((a, b) => a.score.mastery - b.score.mastery)[0];
  if (!weakest) return { skill: null, problems: [], lesson: null };
  const problems = recommendFor(weakest.node.key, profile.scored, profile.input, 4)
    .filter((r) => r.slug !== match?.slug)
    .slice(0, 3)
    .map((r) => ({
      slug: r.slug,
      title: r.title,
      difficulty: r.difficulty,
      href: r.href,
      leetcodeSearch: `https://leetcode.com/problemset/?search=${encodeURIComponent(r.title)}`,
    }));
  const lesson = weakest.node.key.startsWith("dsa:") ? lessonForHub(weakest.node.key.slice(4), road?.stages.map((s) => s.id) ?? []) : undefined;
  return {
    skill: { key: weakest.node.key, label: weakest.node.label, mastery: weakest.score.mastery },
    problems,
    lesson: lesson ? { slug: lesson.slug, title: lesson.title, minutes: lesson.minutes, href: `/roadmap/${lesson.slug}` } : null,
  };
}

// ── The tutor ─────────────────────────────────────────────────────

const OUTPUT_TOKENS = 1_200;
/** services/tutor.ts TEMPERATURE, for the same reason. */
const TEMPERATURE = 0.7;
const THREAD_SHOWN = 60;

export interface ExternalTutorState {
  rung: number;
  turns: Array<{ id: string; role: "student" | "tutor"; rung: number; content: string; createdAt: Date }>;
  available: boolean;
}

export async function externalTutorState(userId: string, source: ExternalSource, slug: string): Promise<ExternalTutorState> {
  const [engagement, rows] = await Promise.all([
    prisma.externalEngagement.findUnique({ where: { userId_source_slug: { userId, source, slug } }, select: { tutorRung: true } }),
    prisma.externalTutorTurn.findMany({
      where: { userId, source, slug },
      orderBy: { createdAt: "desc" },
      take: THREAD_SHOWN,
      select: { id: true, role: true, rung: true, content: true, createdAt: true },
    }),
  ]);
  return {
    rung: rungOf(engagement?.tutorRung ?? 0),
    turns: rows.reverse().map((r) => ({ ...r, role: r.role === "tutor" ? "tutor" : "student" })),
    available: ai.available(),
  };
}

export async function clearExternalTutor(userId: string, source: ExternalSource, slug: string): Promise<void> {
  await prisma.externalTutorTurn.deleteMany({ where: { userId, source, slug } });
}

async function recordExternalClimb(userId: string, source: ExternalSource, slug: string, rung: number, at: Date): Promise<void> {
  const help = RUNGS[rung]!.help;
  const firstHelp = help === "hints" ? { tutorHintAt: at } : help === "solution" ? { tutorSolutionAt: at } : {};
  const created = await prisma.externalEngagement.createMany({ data: [{ userId, source, slug, openedAt: at, tutorRung: rung, ...firstHelp }], skipDuplicates: true });
  if (created.count) return;
  await prisma.externalEngagement.updateMany({ where: { userId, source, slug, OR: [{ tutorRung: null }, { tutorRung: { lt: rung } }] }, data: { tutorRung: rung } });
  if (help === "hints") await prisma.externalEngagement.updateMany({ where: { userId, source, slug, tutorHintAt: null }, data: { tutorHintAt: at } });
  if (help === "solution") await prisma.externalEngagement.updateMany({ where: { userId, source, slug, tutorSolutionAt: null }, data: { tutorSolutionAt: at } });
}

export interface ExternalTutorAsk {
  problem: PageProblem;
  /** The page the student is on — refused when it is a contest or an assessment. */
  url: string | null;
  message: string;
  code: string | null;
  language: string | null;
  rung: number | null;
}

/**
 * One turn on the page's problem — services/tutor.ts tutorReply, with the
 * statement read off the page rather than the catalogue. When the problem
 * is also ours, the rung's reference material (hints, editorial, reference
 * solution) is ours as well; otherwise the model has the statement alone at
 * every rung, which the ladder already allows for.
 */
export async function externalTutorReply(
  userId: string,
  source: ExternalSource,
  slug: string,
  ask: ExternalTutorAsk,
  onRung: (rung: number) => void,
  onToken: (text: string) => void,
): Promise<{ turnId: string; rung: number }> {
  if (rankedPath(ask.url)) throw new ExternalError(RANKED_MESSAGE, 403);
  if (!ai.available()) throw new ExternalError("The tutor is not available right now.", 503);

  const [engagement, recent, match] = await Promise.all([
    prisma.externalEngagement.findUnique({ where: { userId_source_slug: { userId, source, slug } }, select: { tutorRung: true } }),
    prisma.externalTutorTurn.findMany({ where: { userId, source, slug }, orderBy: { createdAt: "desc" }, take: TUTOR_LIMITS.history, select: { role: true, content: true } }),
    matchFor(slug, ask.problem.title),
  ]);
  const reference = match ? await tutorProblem(match.slug) : null;
  const reached = rungOf(engagement?.tutorRung ?? 0);
  const step = rungFor(reached, ask.rung);
  if (!step) throw new ExternalError("The tutor climbs one rung at a time, and a rung once reached stays.", 400);
  const message = ask.message.trim().slice(0, TUTOR_LIMITS.message) || (step.climbed ? RUNGS[step.rung]!.ask : "");
  if (!message) throw new ExternalError("Write a message first.", 400);
  const language = ask.language ? languageOf(ask.language) : null;

  const { text: system, version } = promptFor("tutor");
  const messages = buildTutorMessages(
    {
      title: ask.problem.title,
      statement: ask.problem.statement,
      examples: ask.problem.examples,
      rung: step.rung,
      hints: reference?.hints ?? [],
      editorial: reference?.editorial ?? null,
      solution: reference ? solutionFor(reference.solutions, language) : null,
      code: ask.code,
      language,
      lastSubmission: null,
      codeChanged: null,
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
    ({ model } = await ai.stream(messages, { maxTokens: OUTPUT_TOKENS, temperature: TEMPERATURE, model: process.env["TUTOR_MODEL"] || undefined }, (t) => emit(gate.push(t))));
    emit(gate.end());
  } catch (err) {
    if (step.climbed && shown.trim()) await recordExternalClimb(userId, source, slug, step.rung, new Date()).catch(() => {});
    if (err instanceof AIStreamError) throw new ExternalError(err.status === 504 ? "The tutor took too long to answer — try again." : "The tutor could not answer just now — try again.", err.status >= 500 ? 503 : err.status);
    throw err;
  }

  const content = shown.trim();
  const now = new Date();
  const [, row] = await prisma.$transaction([
    prisma.externalTutorTurn.create({ data: { userId, source, slug, role: "student", rung: step.rung, content: message, createdAt: new Date(now.getTime() - 1) }, select: { id: true } }),
    prisma.externalTutorTurn.create({ data: { userId, source, slug, role: "tutor", rung: step.rung, content, model, promptVersion: version, createdAt: now }, select: { id: true } }),
  ]);
  if (step.climbed) await recordExternalClimb(userId, source, slug, step.rung, now);
  return { turnId: row.id, rung: step.rung };
}

// ── Why it failed ─────────────────────────────────────────────────

const REVIEW_TOKENS = 1_400;

export interface ExternalFailure {
  problem: PageProblem;
  url: string | null;
  verdict: string;
  code: string;
  language: string;
  passed: number | null;
  total: number | null;
  runtimeMs: number | null;
  errorDetail: string | null;
  shownCase: { input: string; output: string | null; expected: string | null } | null;
}

export interface ExternalReviewView {
  id: string;
  verdict: string;
  /** "done" with a model review; "basic" when only the deterministic layer could be had. */
  status: "done" | "basic";
  reason: "reused" | "unavailable" | "error" | null;
  deterministic: DeterministicAnalysis;
  ai: AiReview | null;
}

const clipText = (v: unknown, n: number): string | null => (typeof v === "string" && v.trim() ? v.slice(0, n) : null);

/** The report the extension sends, made safe; a sentence when it is unusable. */
export function parseFailure(raw: Record<string, unknown>, problem: PageProblem): ExternalFailure | string {
  const verdict = verdictOf(raw["verdict"]);
  if (!verdict) return "Only a failed submission can be reviewed (wrong answer, time limit, runtime or compile error).";
  const code = typeof raw["code"] === "string" ? raw["code"].slice(0, PROBLEM_LIMITS.code) : "";
  if (!code.trim()) return "The review needs the code that was submitted.";
  const count = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v < 1_000_000 ? v : null);
  const shown = raw["shownCase"] && typeof raw["shownCase"] === "object" ? (raw["shownCase"] as Record<string, unknown>) : null;
  const passed = count(raw["passed"]);
  const total = count(raw["total"]);
  return {
    problem,
    url: typeof raw["url"] === "string" ? raw["url"].slice(0, 500) : null,
    verdict,
    code,
    language: languageOf(raw["language"]),
    passed: passed != null && total != null && passed <= total ? passed : null,
    total: passed != null && total != null && passed <= total ? total : null,
    runtimeMs: count(raw["runtimeMs"]),
    errorDetail: clipText(raw["errorDetail"], PROBLEM_LIMITS.error),
    shownCase:
      shown && typeof shown["input"] === "string"
        ? { input: shown["input"].slice(0, PROBLEM_LIMITS.shown), output: clipText(shown["output"], PROBLEM_LIMITS.shown), expected: clipText(shown["expected"], PROBLEM_LIMITS.shown) }
        : null,
  };
}

const hashOf = (language: string, code: string) => createHash("sha256").update(`${language}\n${code}`).digest("hex");

/**
 * Both layers of "Why it failed", answered in one request: the extension
 * waits on it with a spinner (the workbench polls a queued job instead,
 * because it already has the verdict to show meanwhile). The same code under
 * the same prompt reuses its earlier review, as the workbench does.
 */
export async function reviewFailure(userId: string, source: ExternalSource, slug: string, f: ExternalFailure): Promise<ExternalReviewView> {
  if (rankedPath(f.url)) throw new ExternalError(RANKED_MESSAGE, 403);
  const deterministic = analyzeFailure({
    verdict: f.verdict,
    passedCases: f.passed ?? 0,
    totalCases: f.total ?? 0,
    runtimeMs: f.runtimeMs,
    timeLimitMs: 0,
    errorDetail: f.errorDetail,
    language: f.language,
    description: f.problem.statement,
  });
  const codeHash = hashOf(f.language, f.code);
  const base = { userId, source, slug, verdict: f.verdict, language: f.language, codeHash, deterministic: json(deterministic) };

  const earlier = await prisma.externalReview.findFirst({
    where: { userId, codeHash, source, slug, promptVersion: PROMPT_VERSIONS["submission-review"] },
    orderBy: { createdAt: "desc" },
    select: { ai: true, category: true, model: true, promptVersion: true },
  });
  if (earlier?.ai) {
    const row = await prisma.externalReview.create({ data: { ...base, ai: json(earlier.ai), category: earlier.category, model: earlier.model, promptVersion: earlier.promptVersion }, select: { id: true } });
    return { id: row.id, verdict: f.verdict, status: "done", reason: "reused", deterministic, ai: earlier.ai as unknown as AiReview };
  }

  let review: AiReview | null = null;
  let reason: ExternalReviewView["reason"] = null;
  let usage = 0;
  if (!ai.available()) {
    reason = "unavailable";
  } else {
    const ctx = {
      title: f.problem.title,
      statement: f.problem.statement,
      examples: f.problem.examples,
      code: f.code,
      language: f.language,
      verdict: f.verdict,
      passedCases: f.passed ?? 0,
      totalCases: f.total ?? 0,
      timeLimitMs: 0,
      errorDetail: f.errorDetail,
      known: deterministic,
      shownCase: f.shownCase,
    };
    try {
      const prompt = promptFor("submission-review");
      const out = await ai.json(buildReviewMessages(ctx, prompt.text), ReviewSchema, "submission_review", { maxTokens: REVIEW_TOKENS, temperature: 0.2, coerce: coerceReview });
      review = guardReview(out.parsed, ctx);
      usage = out.usage.promptTokens + out.usage.completionTokens;
      if (!review) reason = "error";
    } catch (err) {
      console.error("external review failed:", (err as Error).message);
      reason = "error";
    }
  }
  const row = await prisma.externalReview.create({
    data: {
      ...base,
      category: review?.category ?? deterministic.category,
      ai: review ? json(review) : undefined,
      model: review ? ai.model() : null,
      promptVersion: review ? PROMPT_VERSIONS["submission-review"] : null,
      tokens: review ? usage : null,
    },
    select: { id: true },
  });
  return { id: row.id, verdict: f.verdict, status: review ? "done" : "basic", reason, deterministic, ai: review };
}
