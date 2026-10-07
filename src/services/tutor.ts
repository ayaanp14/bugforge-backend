import { prisma } from "../lib/prisma.js";
import { cached } from "../lib/cache.js";
import { ai, AIStreamError } from "../lib/ai/provider.js";
import { promptFor } from "../lib/ai/prompts.js";
import { findLiveDuelFor } from "../lib/duels.js";
import { RUNGS, TUTOR_LIMITS, buildTutorMessages, codeGate, rungFor, rungOf, type TutorTurnText } from "../lib/tutor.js";
import { todayContest } from "./daily-contest.js";
import { invalidateSkillProfile } from "./skill-profile.js";

/**
 * The Socratic tutor on the workbench (Phase 4 of ADAPTIVE_COACH.md; the
 * rules are lib/tutor.ts). A conversation per (account, problem), answered
 * at the rung the student has reached, streamed, and stored once written.
 *
 * Reads only what a student could see — the statement, the visible examples,
 * their own code and last submission — plus, as the rung allows, the
 * problem's hints, editorial and a reference solution, all of which the
 * workbench already shows on request. Hidden test cases are never selected.
 *
 * Unlimited on every plan, like the assistant and the failure reviews (the
 * owner's standing decision); the route's burst limiter is the only brake.
 * Never in ranked play: today's contest problem, a live duel, a live
 * Battles round or knockout match on this problem — help the other side
 * does not get.
 */

export class TutorError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "TutorError";
  }
}

export type TutorBlock = "contest" | "duel" | "battles";

export const BLOCK_MESSAGE: Record<TutorBlock, string> = {
  contest: "The tutor is off on today's contest problem — it would be help nobody else in the contest gets. It is back tomorrow.",
  duel: "The tutor is off while you are in a live duel on this problem.",
  battles: "The tutor is off while this problem is part of a live Battles round you are in.",
};

const OUTPUT_TOKENS = 1_200;
/** The stored thread the page shows: the newest this many lines. */
const THREAD_SHOWN = 60;

/** The problem as the tutor reads it, by slug — public material only. */
function tutorProblem(slug: string) {
  return cached(`tutor:problem:${slug}`, 10 * 60_000, async () => {
    const p = await prisma.problem.findFirst({
      where: { slug, isPublished: true },
      select: { id: true, title: true, slug: true, description: true, hints: true, editorial: true, solutions: true },
    });
    if (!p) return null;
    const examples = await prisma.testCase.findMany({
      // Visible cases only — the workbench's Testcase panel shows these.
      where: { problemId: p.id, isHidden: false },
      orderBy: { orderIndex: "asc" },
      take: TUTOR_LIMITS.examples,
      select: { input: true, expectedOutput: true },
    });
    const hints = (Array.isArray(p.hints) ? p.hints : [])
      .map((h) => (typeof h === "string" ? h : h && typeof h === "object" && typeof (h as { text?: unknown }).text === "string" ? (h as { text: string }).text : ""))
      .filter((h) => h.trim());
    const solutions =
      p.solutions && typeof p.solutions === "object" && !Array.isArray(p.solutions)
        ? Object.fromEntries(Object.entries(p.solutions as Record<string, unknown>).filter((e): e is [string, string] => typeof e[1] === "string" && e[1].trim() !== ""))
        : {};
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      hints,
      editorial: p.editorial?.trim() ? p.editorial : null,
      solutions,
      examples: examples.map((e) => ({ input: e.input, output: e.expectedOutput })),
    };
  });
}

/** The reference in the student's language, else the nearest one there is. */
function solutionFor(solutions: Record<string, string>, language: string | null): { language: string; code: string } | null {
  const order = [language, "python", "javascript", "java", "cpp"].filter((l): l is string => Boolean(l));
  for (const l of order) if (solutions[l]) return { language: l, code: solutions[l]! };
  const first = Object.entries(solutions)[0];
  return first ? { language: first[0], code: first[1] } : null;
}

/**
 * Ranked play, where the tutor stays out. The Battles checks mirror how
 * /submit files an attempt into a live round (services/contest.ts
 * recordTournamentSubmission, services/knockout.ts) — the same catalogue
 * problem can be open on the main workbench while the round runs.
 */
async function blockFor(userId: string, problemId: string): Promise<TutorBlock | null> {
  const now = new Date();
  const [contest, duel, entries, match] = await Promise.all([
    todayContest().catch(() => null),
    findLiveDuelFor(userId, { problemId }).catch(() => null),
    prisma.tournamentEntry
      .findMany({
        where: { userId, status: "approved", tournament: { status: "published", startsAt: { lte: now }, problems: { some: { problemId } } } },
        select: { tournament: { select: { startsAt: true, durationMinutes: true } } },
      })
      .catch(() => []),
    prisma.tournamentMatch
      .findFirst({ where: { status: "live", problemId, endsAt: { gt: now }, OR: [{ playerAId: userId }, { playerBId: userId }] }, select: { id: true } })
      .catch(() => null),
  ]);
  if (contest && contest.problemId === problemId) return "contest";
  if (duel) return "duel";
  if (match || entries.some((e) => now.getTime() < e.tournament.startsAt.getTime() + e.tournament.durationMinutes * 60_000)) return "battles";
  return null;
}

export interface TutorTurnView {
  id: string;
  role: "student" | "tutor";
  rung: number;
  content: string;
  createdAt: Date;
}

export interface TutorState {
  /** The highest rung reached on this problem (0 = Questions). */
  rung: number;
  turns: TutorTurnView[];
  /** Why the tutor is off here, or null. */
  blocked: TutorBlock | null;
  /** A model is configured on this deployment. */
  available: boolean;
}

async function problemOr404(slug: string) {
  const problem = await tutorProblem(slug);
  if (!problem) throw new TutorError("No such problem.", 404);
  return problem;
}

export async function tutorState(userId: string, slug: string): Promise<TutorState> {
  const problem = await problemOr404(slug);
  const [engagement, rows, blocked] = await Promise.all([
    prisma.problemEngagement.findUnique({ where: { userId_problemId: { userId, problemId: problem.id } }, select: { tutorRung: true } }),
    prisma.tutorTurn.findMany({
      where: { userId, problemId: problem.id },
      orderBy: { createdAt: "desc" },
      take: THREAD_SHOWN,
      select: { id: true, role: true, rung: true, content: true, createdAt: true },
    }),
    blockFor(userId, problem.id),
  ]);
  return {
    rung: rungOf(engagement?.tutorRung ?? 0),
    turns: rows.reverse().map((r) => ({ ...r, role: r.role === "tutor" ? "tutor" : "student" })),
    blocked,
    available: ai.available(),
  };
}

export async function clearTutor(userId: string, slug: string): Promise<void> {
  const problem = await problemOr404(slug);
  // The rows go; the rung and the help it counted stay on ProblemEngagement.
  await prisma.tutorTurn.deleteMany({ where: { userId, problemId: problem.id } });
}

/**
 * A climb, once its answer has been shown: the rung reached and, the first
 * time a rung gives that much help, when — the skill profile folds these
 * into its hints/editorial times (services/skill-profile.ts loadEvidence).
 * Each column moves once, like recordEngagement's.
 */
async function recordClimb(userId: string, problemId: string, rung: number, at: Date): Promise<void> {
  const help = RUNGS[rung]!.help;
  const firstHelp = help === "hints" ? { tutorHintAt: at } : help === "solution" ? { tutorSolutionAt: at } : {};
  const created = await prisma.problemEngagement.createMany({ data: [{ userId, problemId, openedAt: at, tutorRung: rung, ...firstHelp }], skipDuplicates: true });
  if (!created.count) {
    await prisma.problemEngagement.updateMany({ where: { userId, problemId, OR: [{ tutorRung: null }, { tutorRung: { lt: rung } }] }, data: { tutorRung: rung } });
    if (help === "hints") await prisma.problemEngagement.updateMany({ where: { userId, problemId, tutorHintAt: null }, data: { tutorHintAt: at } });
    if (help === "solution") await prisma.problemEngagement.updateMany({ where: { userId, problemId, tutorSolutionAt: null }, data: { tutorSolutionAt: at } });
  }
  if (help !== "none") invalidateSkillProfile(userId);
}

export interface TutorAsk {
  message: string;
  /** The editor's current buffer, when the student shares it. */
  code: string | null;
  language: string | null;
  /** The rung to answer at: the one reached, or the next to climb. */
  rung: number | null;
}

/**
 * One turn. `onRung` hears a climb before the first token, so the ladder
 * moves as the answer starts; `onToken` gets the answer through the code
 * gate. Nothing is stored until the answer is whole — except a climb whose
 * answer had started to show when the stream broke: that help was seen.
 */
export async function tutorReply(
  userId: string,
  slug: string,
  ask: TutorAsk,
  onRung: (rung: number) => void,
  onToken: (text: string) => void,
): Promise<{ turnId: string; content: string; rung: number }> {
  const problem = await problemOr404(slug);
  if (!ai.available()) throw new TutorError("The tutor is not available right now.", 503);
  const blocked = await blockFor(userId, problem.id);
  if (blocked) throw new TutorError(BLOCK_MESSAGE[blocked], 403);

  const [engagement, recent, last] = await Promise.all([
    prisma.problemEngagement.findUnique({ where: { userId_problemId: { userId, problemId: problem.id } }, select: { tutorRung: true } }),
    prisma.tutorTurn.findMany({
      where: { userId, problemId: problem.id },
      orderBy: { createdAt: "desc" },
      take: TUTOR_LIMITS.history,
      select: { role: true, content: true },
    }),
    prisma.submission.findFirst({
      where: { userId, problemId: problem.id },
      orderBy: { submittedAt: "desc" },
      select: { verdict: true, passedCases: true, totalCases: true, analysis: { select: { deterministic: true, ai: true } } },
    }),
  ]);
  const reached = rungOf(engagement?.tutorRung ?? 0);
  const step = rungFor(reached, ask.rung);
  if (!step) throw new TutorError("The tutor climbs one rung at a time, and a rung once reached stays.", 400);
  const message = ask.message.trim().slice(0, TUTOR_LIMITS.message) || (step.climbed ? RUNGS[step.rung]!.ask : "");
  if (!message) throw new TutorError("Write a message first.", 400);
  const language = ask.language && /^[a-z0-9+#-]{1,20}$/i.test(ask.language) ? ask.language.toLowerCase() : null;

  const det = (last?.analysis?.deterministic ?? null) as { headline?: unknown } | null;
  const review = (last?.analysis?.ai ?? null) as { summary?: unknown } | null;
  const { text: system, version } = promptFor("tutor");
  const messages = buildTutorMessages(
    {
      title: problem.title,
      statement: problem.description,
      examples: problem.examples,
      rung: step.rung,
      hints: problem.hints,
      editorial: problem.editorial,
      solution: solutionFor(problem.solutions, language),
      code: ask.code,
      language,
      lastSubmission: last
        ? {
            verdict: last.verdict,
            passed: last.passedCases ?? 0,
            total: last.totalCases ?? 0,
            headline: typeof det?.headline === "string" ? det.headline : null,
            review: typeof review?.summary === "string" ? review.summary : null,
          }
        : null,
      history: recent.reverse().map((t): TutorTurnText => ({ role: t.role === "tutor" ? "tutor" : "student", content: t.content })),
      message,
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
    ({ model } = await ai.stream(messages, { maxTokens: OUTPUT_TOKENS, temperature: 0.3, model: process.env["TUTOR_MODEL"] || undefined }, (t) => emit(gate.push(t))));
    emit(gate.end());
  } catch (err) {
    if (step.climbed && shown.trim()) await recordClimb(userId, problem.id, step.rung, new Date()).catch(() => {});
    if (err instanceof AIStreamError) throw new TutorError(err.status === 504 ? "The tutor took too long to answer — try again." : "The tutor could not answer just now — try again.", err.status >= 500 ? 503 : err.status);
    throw err;
  }

  const content = shown.trim();
  const now = new Date();
  // A millisecond apart so the pair always reads back in order.
  const [, row] = await prisma.$transaction([
    prisma.tutorTurn.create({ data: { userId, problemId: problem.id, role: "student", rung: step.rung, content: message, createdAt: new Date(now.getTime() - 1) }, select: { id: true } }),
    prisma.tutorTurn.create({ data: { userId, problemId: problem.id, role: "tutor", rung: step.rung, content, model, promptVersion: version, createdAt: now }, select: { id: true } }),
  ]);
  if (step.climbed) await recordClimb(userId, problem.id, step.rung, now);
  return { turnId: row.id, content, rung: step.rung };
}
