import { CONVERSATION_KINDS, type SimRound, type Simulation } from "./simulations/types.js";

/**
 * A simulation run as it stands (pure; services/simulations.ts reads the
 * rows). The run row keeps only what no other row can say — which rounds
 * were opened and when, and each interview round's saved setup — and every
 * result is read from the rows the rounds produced:
 *
 *  - the assessment round is the first sitting of its pattern started after
 *    the round was opened (a sitting started before it is someone else's
 *    practice, not this run);
 *  - an interview round is the newest session of the setup the round made.
 *
 * Rounds open in order: one is ready only when the round before it is done,
 * as a real drive moves on only after each round. No cut-off is applied — no
 * company publishes one this could honestly use — so "done" means sat, and
 * the report shows the scores beside each other.
 */

/** Clock skew allowed between the open and a sitting's start (the SPA opens, then navigates). */
const OPEN_SKEW_MS = 60_000;

export interface RunRound {
  key: string;
  openedAt: number;
  savedInterviewId?: string | null;
}

export interface SittingFact {
  id: string;
  slug: string;
  startedAt: number;
  status: string;
  /** Percentage, when graded. */
  pct: number | null;
}

export interface SessionFact {
  id: string;
  savedInterviewId: string;
  createdAt: number;
  status: string;
  mode: string;
  /** 0–100, written when the round closes. */
  overallScore: number | null;
}

export type RoundState = "locked" | "ready" | "open" | "in-progress" | "done";

export interface RoundView {
  key: string;
  kind: SimRound["kind"];
  name: string;
  covers: string;
  state: RoundState;
  /** 0–100 once done (an interview closed without a score reads null). */
  score: number | null;
  /** The sitting was closed by the proctor: it counts as sat, and says so. */
  disqualified: boolean;
  /** How the round is held: "test", "written" or "voice". */
  format: "test" | "written" | "voice";
  /** The sitting or session behind the round, when there is one. */
  attemptId: string | null;
  sessionId: string | null;
}

export interface RunView {
  id: string;
  slug: string;
  hrMode: "written" | "voice";
  startedAt: string;
  endedAt: string | null;
  rounds: RoundView[];
  /** The round to do now: the first that is not done, or null. */
  current: string | null;
  complete: boolean;
  /** Once complete: the mean of the scored rounds, and the weakest. */
  summary: { score: number | null; weakest: string | null } | null;
}

export interface StoredRun {
  id: string;
  slug: string;
  hrMode: string;
  rounds: unknown;
  endedAt: Date | null;
  createdAt: Date;
}

/** Read the stored rounds defensively: a hand edit or an older shape must not break the page. */
export function readRunRounds(raw: unknown): RunRound[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (r): r is RunRound => !!r && typeof r === "object" && typeof (r as RunRound).key === "string" && typeof (r as RunRound).openedAt === "number",
  );
}

export const hrModeOf = (raw: string): "written" | "voice" => (raw === "voice" ? "voice" : "written");

export function formatOf(round: SimRound, hrMode: "written" | "voice"): RoundView["format"] {
  if (round.kind === "assessment") return "test";
  return CONVERSATION_KINDS.has(round.kind) ? hrMode : "written";
}

const GRADED = new Set(["submitted", "expired", "terminated"]);

export function runView(sim: Simulation, run: StoredRun, facts: { sittings: readonly SittingFact[]; sessions: readonly SessionFact[] }): RunView {
  const opened = new Map(readRunRounds(run.rounds).map((r) => [r.key, r]));
  const hrMode = hrModeOf(run.hrMode);
  const views: RoundView[] = [];
  let previousDone = true;

  for (const round of sim.rounds) {
    const o = opened.get(round.key);
    const base = { key: round.key, kind: round.kind, name: round.name, covers: round.covers, format: formatOf(round, hrMode), score: null, disqualified: false, attemptId: null, sessionId: null };
    let view: RoundView;
    if (!o) {
      view = { ...base, state: previousDone ? "ready" : "locked" };
    } else if (round.kind === "assessment") {
      const sitting = facts.sittings
        .filter((s) => s.slug === round.test && s.startedAt >= o.openedAt - OPEN_SKEW_MS)
        .sort((a, b) => a.startedAt - b.startedAt)[0];
      if (!sitting) view = { ...base, state: "open" };
      else if (GRADED.has(sitting.status)) view = { ...base, state: "done", score: sitting.pct == null ? null : Math.round(sitting.pct), disqualified: sitting.status === "terminated", attemptId: sitting.id };
      else view = { ...base, state: "in-progress", attemptId: sitting.id };
    } else {
      const session = facts.sessions
        .filter((s) => o.savedInterviewId && s.savedInterviewId === o.savedInterviewId)
        .sort((a, b) => b.createdAt - a.createdAt)[0];
      // An abandoned round can be held again: the setup stays, a new session starts.
      if (!session || session.status === "abandoned") view = { ...base, state: "open" };
      else if (session.status === "completed") view = { ...base, state: "done", score: session.overallScore, sessionId: session.id };
      else view = { ...base, state: "in-progress", sessionId: session.id };
    }
    views.push(view);
    previousDone = view.state === "done";
  }

  const complete = views.length > 0 && views.every((v) => v.state === "done");
  const scored = views.filter((v) => v.score != null);
  const weakest = [...scored].sort((a, b) => a.score! - b.score!)[0];
  return {
    id: run.id,
    slug: run.slug,
    hrMode,
    startedAt: run.createdAt.toISOString(),
    endedAt: run.endedAt?.toISOString() ?? null,
    rounds: views,
    current: views.find((v) => v.state !== "done")?.key ?? null,
    complete,
    summary: complete ? { score: scored.length ? Math.round(scored.reduce((a, v) => a + v.score!, 0) / scored.length) : null, weakest: weakest?.key ?? null } : null,
  };
}

/** Whether a round may be opened now: it exists, the run is live, and every round before it is done. */
export function canOpen(sim: Simulation, view: RunView, key: string): "ok" | "missing" | "ended" | "locked" | "done" {
  const i = sim.rounds.findIndex((r) => r.key === key);
  if (i < 0) return "missing";
  if (view.endedAt) return "ended";
  const round = view.rounds[i]!;
  if (round.state === "done") return "done";
  if (round.state === "locked") return "locked";
  return "ok";
}
