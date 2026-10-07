import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { DEFAULT_FOCUS, SIMULATIONS, builderRoundOf, simulationBySlug, type SimRound, type Simulation } from "../lib/simulations/index.js";
import { canOpen, formatOf, hrModeOf, readRunRounds, runView, type RunRound, type RunView, type SessionFact, type SittingFact, type StoredRun } from "../lib/simulation-run.js";

/**
 * Company simulations (lib/simulations, lib/simulation-run; Phase 7 of
 * ADAPTIVE_COACH.md). The templates are code; the one table is
 * SimulationRun, which keeps which rounds were opened and each interview
 * round's saved setup. A round's result is read from the sitting or the
 * session it produced, so nothing here copies a score.
 *
 * An interview round is an ordinary mock interview: opening it makes a
 * SavedInterview for the run (its role names the company, so both the
 * written and the voice interviewer brief from it), and the SPA starts it
 * through the existing room, where the weekly allowance applies to each
 * round as usual — the owner's call, 2026-10-07.
 */

export class SimulationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** A voice round's length: the shortest the builder offers, which every plan may hold. */
const VOICE_MINUTES = 10;
/** The interview builder's band for someone hiring as a fresher or new grad (interview-options seniorityLevels). */
const EXPERIENCE_BAND = "Junior (0-2 years)";
const STYLE: Record<SimRound["kind"], string> = {
  assessment: "Mixed",
  technical: "Technical Heavy",
  coding: "Technical Heavy",
  "system-design": "Technical Heavy",
  managerial: "Behavioral + Technical",
  hr: "Mixed",
  behavioral: "Mixed",
  case: "Mixed",
};

/** A template as the SPA reads it: everything but the builder plumbing. */
function publicSimulation(sim: Simulation) {
  return {
    slug: sim.slug,
    company: sim.company,
    family: sim.family,
    role: sim.role,
    rounds: sim.rounds.map((r) => ({ key: r.key, kind: r.kind, name: r.name, covers: r.covers, test: r.test ?? null })),
    firmness: sim.firmness,
    sourceNote: sim.sourceNote,
    sources: sim.sources,
  };
}

const RUN_SELECT = { id: true, slug: true, hrMode: true, rounds: true, endedAt: true, createdAt: true } as const;

/** The sittings and sessions behind some runs, in two reads for any number of them. */
async function factsFor(userId: string, runs: readonly StoredRun[]): Promise<{ sittings: SittingFact[]; sessions: SessionFact[] }> {
  if (!runs.length) return { sittings: [], sessions: [] };
  const tests = new Set<string>();
  const setups = new Set<string>();
  for (const run of runs) {
    const sim = simulationBySlug(run.slug);
    for (const r of sim?.rounds ?? []) if (r.test) tests.add(r.test);
    for (const r of readRunRounds(run.rounds)) if (r.savedInterviewId) setups.add(r.savedInterviewId);
  }
  const since = new Date(Math.min(...runs.map((r) => r.createdAt.getTime())) - 60_000);
  const [attempts, sessions] = await Promise.all([
    tests.size
      ? prisma.mockAttempt.findMany({
          where: { userId, startedAt: { gte: since }, test: { slug: { in: [...tests] } } },
          select: { id: true, startedAt: true, status: true, score: true, maxScore: true, test: { select: { slug: true } } },
          take: 200,
        })
      : Promise.resolve([]),
    setups.size
      ? prisma.mockInterviewSession.findMany({
          where: { userId, savedInterviewId: { in: [...setups] } },
          select: { id: true, savedInterviewId: true, createdAt: true, status: true, mode: true, overallScore: true },
          take: 200,
        })
      : Promise.resolve([]),
  ]);
  return {
    sittings: attempts.map((a) => ({
      id: a.id,
      slug: a.test.slug,
      startedAt: a.startedAt.getTime(),
      status: a.status,
      pct: a.score != null && a.maxScore ? (100 * a.score) / a.maxScore : null,
    })),
    sessions: sessions.map((s) => ({ id: s.id, savedInterviewId: s.savedInterviewId, createdAt: s.createdAt.getTime(), status: s.status, mode: s.mode, overallScore: s.overallScore })),
  };
}

/** The live run of one simulation: neither ended nor complete. */
function liveOf(views: readonly RunView[]): RunView | null {
  return views.find((v) => !v.endedAt && !v.complete) ?? null;
}

/** Every simulation, with the reader's latest run of each when signed in. */
export async function simulationList(userId: string | null) {
  const runs = userId ? await prisma.simulationRun.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100, select: RUN_SELECT }) : [];
  const facts = userId ? await factsFor(userId, runs) : { sittings: [], sessions: [] };
  const latest = new Map<string, RunView>();
  for (const run of runs) {
    if (latest.has(run.slug)) continue;
    const sim = simulationBySlug(run.slug);
    if (sim) latest.set(run.slug, runView(sim, run, facts));
  }
  return {
    simulations: SIMULATIONS.map((sim) => {
      const run = latest.get(sim.slug);
      return {
        ...publicSimulation(sim),
        mine: run
          ? { runId: run.id, state: run.complete ? ("complete" as const) : run.endedAt ? ("ended" as const) : ("live" as const), done: run.rounds.filter((r) => r.state === "done").length, score: run.summary?.score ?? null }
          : null,
      };
    }),
  };
}

/** One simulation's page: the template, the reader's live run and the runs before it. */
export async function simulationPage(userId: string | null, slug: string) {
  const sim = simulationBySlug(slug);
  if (!sim) throw new SimulationError("No such simulation.", 404);
  const tests = await prisma.mockTest.findMany({
    where: { slug: { in: sim.rounds.flatMap((r) => (r.test ? [r.test] : [])) } },
    select: { slug: true, name: true, sections: { select: { durationSec: true, questionCount: true } } },
  });
  const assessment = tests.map((t) => ({
    slug: t.slug,
    name: t.name,
    minutes: Math.round(t.sections.reduce((a, s) => a + s.durationSec, 0) / 60),
    questions: t.sections.reduce((a, s) => a + s.questionCount, 0),
  }))[0] ?? null;
  if (!userId) return { simulation: publicSimulation(sim), assessment, run: null, past: [] };
  const runs = await prisma.simulationRun.findMany({ where: { userId, slug }, orderBy: { createdAt: "desc" }, take: 10, select: RUN_SELECT });
  const facts = await factsFor(userId, runs);
  const views = runs.map((r) => runView(sim, r, facts));
  const run = liveOf(views);
  return { simulation: publicSimulation(sim), assessment, run, past: views.filter((v) => v !== run) };
}

/**
 * Start a run, or hand back the live one: one run of a simulation at a time,
 * so a second click or a second tab does not open a parallel run.
 */
export async function startRun(userId: string, slug: string, hrModeRaw: unknown): Promise<RunView> {
  const sim = simulationBySlug(slug);
  if (!sim) throw new SimulationError("No such simulation.", 404);
  const existing = await prisma.simulationRun.findMany({ where: { userId, slug, endedAt: null }, orderBy: { createdAt: "desc" }, take: 5, select: RUN_SELECT });
  const facts = await factsFor(userId, existing);
  const live = liveOf(existing.map((r) => runView(sim, r, facts)));
  if (live) return live;
  const run = await prisma.simulationRun.create({
    data: { userId, slug, hrMode: hrModeOf(typeof hrModeRaw === "string" ? hrModeRaw : "written"), rounds: [] as unknown as Prisma.InputJsonValue },
    select: RUN_SELECT,
  });
  return runView(sim, run, { sittings: [], sessions: [] });
}

async function ownRun(userId: string, runId: string): Promise<StoredRun> {
  const run = await prisma.simulationRun.findUnique({ where: { id: runId }, select: { ...RUN_SELECT, userId: true } });
  // Someone else's run is answered like a missing one.
  if (!run || run.userId !== userId) throw new SimulationError("No such run.", 404);
  return run;
}

/**
 * Open a round and say where to go: the pattern's test page for the
 * assessment (its sitting is found by time — lib/simulation-run), the
 * interview room for an interview round, through a setup made for it on
 * first opening and kept for a retry.
 */
export async function openRound(userId: string, runId: string, key: string): Promise<{ href: string; run: RunView }> {
  const stored = await ownRun(userId, runId);
  const sim = simulationBySlug(stored.slug);
  if (!sim) throw new SimulationError("This simulation is no longer offered.", 410);
  const view = runView(sim, stored, await factsFor(userId, [stored]));
  const verdict = canOpen(sim, view, key);
  if (verdict === "missing") throw new SimulationError("No such round.", 404);
  if (verdict === "ended") throw new SimulationError("This run has ended. Start a new one.", 409);
  if (verdict === "locked") throw new SimulationError("Finish the round before this one first.", 409);
  if (verdict === "done") throw new SimulationError("This round is already done.", 409);

  const round = sim.rounds.find((r) => r.key === key)!;
  const state = view.rounds.find((r) => r.key === key)!;
  const rounds = readRunRounds(stored.rounds);
  let entry = rounds.find((r) => r.key === key);

  // A round already under way is resumed, never opened afresh (a new open
  // would move the assessment's window past the sitting in progress).
  if (!entry || state.state === "open") {
    let savedInterviewId = entry?.savedInterviewId ?? null;
    if (round.kind !== "assessment" && !savedInterviewId) {
      const setup = await prisma.savedInterview.create({
        data: {
          userId,
          // The role names the company: both interviewers brief from it as written (services/interview-ai configBlock, the voice route's roleLabel).
          roleId: `${sim.company} ${sim.role}`,
          roundId: builderRoundOf(round),
          difficulty: sim.difficulty,
          experienceBand: EXPERIENCE_BAND,
          interviewStyle: STYLE[round.kind],
          stackFocusIds: [],
          focusAreaIds: [...(round.focus ?? DEFAULT_FOCUS[round.kind as Exclude<SimRound["kind"], "assessment">])],
          company: sim.company,
          simulationRunId: stored.id,
        },
        select: { id: true },
      });
      savedInterviewId = setup.id;
    }
    // The assessment's window opens now; an interview round keeps its first opening.
    const next: RunRound = { key, openedAt: round.kind === "assessment" || !entry ? Date.now() : entry.openedAt, savedInterviewId };
    entry = next;
    const updated = [...rounds.filter((r) => r.key !== key), next];
    await prisma.simulationRun.update({ where: { id: stored.id }, data: { rounds: updated as unknown as Prisma.InputJsonValue } });
    stored.rounds = updated;
  }

  const href = hrefFor(round, formatOf(round, hrModeOf(stored.hrMode)), entry, state);
  return { href, run: runView(sim, stored, await factsFor(userId, [stored])) };
}

function hrefFor(round: SimRound, format: "test" | "written" | "voice", entry: RunRound, state: { state: string; attemptId: string | null; sessionId: string | null }): string {
  if (round.kind === "assessment") return state.state === "in-progress" && state.attemptId ? `/tests/attempt/${state.attemptId}` : `/tests/${round.test}`;
  if (state.state === "in-progress" && state.sessionId) return format === "voice" ? `/mock-interview/voice?sessionId=${state.sessionId}` : `/mock-interview/session?sessionId=${state.sessionId}`;
  const params = new URLSearchParams({ savedInterviewId: entry.savedInterviewId! });
  if (format === "voice") params.set("durationMin", String(VOICE_MINUTES));
  return `/mock-interview/${format === "voice" ? "voice" : "session"}?${params.toString()}`;
}

/** End a live run early. Its sittings and sessions stay where they are; a new run can start. */
export async function endRun(userId: string, runId: string): Promise<void> {
  const run = await ownRun(userId, runId);
  if (!run.endedAt) await prisma.simulationRun.update({ where: { id: run.id }, data: { endedAt: new Date() } });
}

/** The run a mock interview session belongs to, for its report's way back (null for a hand-built setup). */
export async function runOfSession(userId: string, sessionId: string): Promise<{ slug: string; company: string; runId: string } | null> {
  const s = await prisma.mockInterviewSession.findFirst({ where: { id: sessionId, userId }, select: { savedInterview: { select: { simulationRunId: true, simulationRun: { select: { slug: true } } } } } });
  const run = s?.savedInterview.simulationRun;
  const sim = run ? simulationBySlug(run.slug) : undefined;
  return run && sim && s?.savedInterview.simulationRunId ? { slug: sim.slug, company: sim.company, runId: s.savedInterview.simulationRunId } : null;
}


/**
 * The run a placement-test sitting is the assessment round of, for its
 * result page's way back: a run of a simulation on that pattern whose
 * assessment round was opened before the sitting started (the same rule
 * lib/simulation-run reads the round by). Null for an ordinary sitting.
 */
export async function runOfAttempt(userId: string, attempt: { startedAt: Date; testSlug: string }): Promise<{ slug: string; company: string; runId: string } | null> {
  const slugs = SIMULATIONS.filter((s) => s.rounds.some((r) => r.test === attempt.testSlug)).map((s) => s.slug);
  if (!slugs.length) return null;
  const runs = await prisma.simulationRun.findMany({ where: { userId, slug: { in: slugs }, createdAt: { lte: attempt.startedAt } }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, slug: true, rounds: true } });
  for (const run of runs) {
    const sim = simulationBySlug(run.slug)!;
    const round = sim.rounds.find((r) => r.test === attempt.testSlug);
    const opened = readRunRounds(run.rounds).find((r) => r.key === round?.key);
    if (opened && opened.openedAt - 60_000 <= attempt.startedAt.getTime()) return { slug: sim.slug, company: sim.company, runId: run.id };
  }
  return null;
}
