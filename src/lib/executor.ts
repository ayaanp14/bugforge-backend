import {
  LANGUAGE_MAP,
  submitToJudge0,
  submitBatchToJudge0,
  pollJudge0,
  pollBatchJudge0,
  type Judge0Result,
  type Judge0Submission,
} from "./judge0.js";
import {
  submitToPiston,
  submitBatchToPiston,
  pollPiston,
  pollBatchPiston,
} from "./piston.js";
import {
  submitToWandbox,
  submitBatchToWandbox,
  pollWandbox,
  pollBatchWandbox,
} from "./wandbox.js";
import {
  submitToPaiza,
  submitBatchToPaiza,
  pollPaiza,
  pollBatchPaiza,
} from "./paiza.js";
import { ExecutionEngineError, isEngineDown } from "./engine-error.js";

/**
 * Execution-engine switch, with failover.
 *
 *   EXECUTOR=judge0 (default) — self-hosted Judge0 (local docker compose)
 *   EXECUTOR=wandbox          — free public Wandbox API (wandbox.org), no key
 *                               (no kotlin, no time/memory metrics)
 *   EXECUTOR=paiza            — free public Paiza.IO API, no key or signup
 *                               (all thirteen languages, reports time/memory)
 *   EXECUTOR=piston           — Piston API (self-hosted via PISTON_URL; the
 *                               public emkc.org instance is whitelist only)
 *
 * EXECUTOR takes a comma-separated chain — `EXECUTOR=wandbox,paiza` runs on
 * Wandbox and falls through to Paiza when Wandbox is down. That failover is the
 * whole point: these are free community services with no SLA, and on 2026-09-05
 * Wandbox's sandbox stopped starting containers and answered every language
 * with a 500, taking all code execution down with it.
 *
 * Only an ExecutionEngineError — the engine unreachable or refusing everything —
 * moves to the next engine. A compile error or a wrong answer is a real result
 * and never fails over.
 *
 * All engines share the Judge0 token/poll interface and result shape. Tokens are
 * tagged with the engine that issued them ("wandbox#abc"), so polling always
 * returns to the engine actually running that submission.
 */
type Engine = {
  submit: (submission: Judge0Submission, rawLanguage: string) => Promise<string>;
  submitBatch: (submissions: Judge0Submission[], rawLanguage: string) => Promise<string[]>;
  poll: (token: string, maxAttempts?: number) => Promise<Judge0Result>;
  pollBatch: (tokens: string[], maxAttempts?: number) => Promise<Array<Judge0Result & { token: string }>>;
};

const ENGINES: Record<string, Engine> = {
  judge0: { submit: submitToJudge0, submitBatch: submitBatchToJudge0, poll: pollJudge0, pollBatch: pollBatchJudge0 },
  piston: { submit: submitToPiston, submitBatch: submitBatchToPiston, poll: pollPiston, pollBatch: pollBatchPiston },
  wandbox: { submit: submitToWandbox, submitBatch: submitBatchToWandbox, poll: pollWandbox, pollBatch: pollBatchWandbox },
  paiza: { submit: submitToPaiza, submitBatch: submitBatchToPaiza, poll: pollPaiza, pollBatch: pollBatchPaiza },
};

/** How long a failed engine is skipped before it gets another chance. */
const COOLDOWN_MS = Math.max(
  5000,
  parseInt(process.env["EXECUTOR_COOLDOWN_MS"] ?? "60000", 10) || 60000
);

const requested = (process.env["EXECUTOR"] ?? "judge0")
  .toLowerCase()
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean);

const CHAIN = requested.filter((name) => ENGINES[name]);
const unknown = requested.filter((name) => !ENGINES[name]);
if (CHAIN.length === 0) CHAIN.push("judge0");

console.log(
  `[Executor] Engine chain: ${CHAIN.join(" → ")}` +
    (unknown.length ? ` (ignored unknown: ${unknown.join(", ")})` : ""),
);

/** The engine tried first — what the batch sizer reasons about. */
export const EXECUTOR_ENGINE = CHAIN[0] as string;
/** True when every engine in the chain is the local Judge0. */
export const EXECUTOR_CHAIN = [...CHAIN];

// ── Circuit breaker ────────────────────────────────────────────────
// A dead engine costs three retries with backoff (~9s) before it gives up.
// Paying that on every request would make the whole platform crawl, so an
// engine that just failed is skipped for a cooldown and then tried again.
const failedUntil = new Map<string, number>();

const healthyFirst = (): string[] => {
  const now = Date.now();
  const healthy = CHAIN.filter((name) => (failedUntil.get(name) ?? 0) <= now);
  // Everything is cooling down: try them all anyway rather than refuse outright,
  // since a cooldown is a guess and the engine may well be back.
  return healthy.length > 0 ? healthy : [...CHAIN];
};

function markDown(name: string, err: unknown): void {
  failedUntil.set(name, Date.now() + COOLDOWN_MS);
  const detail = err instanceof Error ? err.message : String(err);
  console.error(`[Executor] ${name} is down, skipping it for ${Math.round(COOLDOWN_MS / 1000)}s — ${detail}`);
}

/** Tokens carry their engine so poll returns to whoever is running the code. */
const tag = (engine: string, token: string) => `${engine}#${token}`;
const untag = (tagged: string): { engine: string; token: string } => {
  const at = tagged.indexOf("#");
  if (at === -1) return { engine: EXECUTOR_ENGINE, token: tagged };
  return { engine: tagged.slice(0, at), token: tagged.slice(at + 1) };
};

/**
 * What each outstanding token is running, so a failed engine can be replaced
 * mid-flight. This is not bookkeeping for its own sake: Wandbox hands back a
 * token instantly and only reveals the outage when polled, so failing over on
 * submit alone would never fire for the exact engine that went down.
 */
interface Inflight {
  submission: Judge0Submission;
  rawLanguage: string;
  tried: Set<string>;
  at: number;
}
const inflight = new Map<string, Inflight>();

/** A caller that never polls would otherwise leak; drop anything long dead. */
function pruneInflight(): void {
  if (inflight.size < 2000) return;
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [token, entry] of inflight) {
    if (entry.at < cutoff) inflight.delete(token);
  }
}

export { LANGUAGE_MAP };
export type { Judge0Result, Judge0Submission };

export const submitCode = async (submission: Judge0Submission, rawLanguage: string): Promise<string> => {
  const order = healthyFirst();
  const tried = new Set<string>();
  let last: unknown = new ExecutionEngineError(order[0] ?? "none", "no engine available");

  for (const name of order) {
    const engine = ENGINES[name];
    if (!engine) continue;
    try {
      const tagged = tag(name, await engine.submit(submission, rawLanguage));
      failedUntil.delete(name);
      tried.add(name);
      pruneInflight();
      inflight.set(tagged, { submission, rawLanguage, tried, at: Date.now() });
      return tagged;
    } catch (err) {
      // Only an engine outage is worth another engine's time; a compile error
      // or an unsupported language is a genuine answer.
      if (!isEngineDown(err)) throw err;
      last = err;
      tried.add(name);
      markDown(name, err);
      const next = order[order.indexOf(name) + 1];
      if (next) console.warn(`[Executor] failing submit over to ${next}`);
    }
  }
  throw last;
};

export const submitCodeBatch = async (
  submissions: Judge0Submission[],
  rawLanguage: string,
): Promise<string[]> => {
  const order = healthyFirst();
  let last: unknown = new ExecutionEngineError(order[0] ?? "none", "no engine available");

  for (const name of order) {
    const engine = ENGINES[name];
    if (!engine) continue;
    try {
      const tokens = (await engine.submitBatch(submissions, rawLanguage)).map((token) => tag(name, token));
      failedUntil.delete(name);
      pruneInflight();
      tokens.forEach((tagged, i) => {
        const submission = submissions[i];
        if (submission) {
          inflight.set(tagged, { submission, rawLanguage, tried: new Set([name]), at: Date.now() });
        }
      });
      return tokens;
    } catch (err) {
      if (!isEngineDown(err)) throw err;
      last = err;
      markDown(name, err);
      const next = order[order.indexOf(name) + 1];
      if (next) console.warn(`[Executor] failing batch submit over to ${next}`);
    }
  }
  throw last;
};

/**
 * Poll, and if the engine running this submission turns out to be dead, hand
 * the same code to the next engine and poll that instead. The caller never
 * learns which engine answered — it just gets its verdict.
 */
export const pollResult = async (tagged: string, maxAttempts?: number): Promise<Judge0Result> => {
  const info = inflight.get(tagged);
  let current = tagged;

  for (;;) {
    const { engine: name, token } = untag(current);
    const engine = ENGINES[name] ?? ENGINES[EXECUTOR_ENGINE];
    if (!engine) {
      inflight.delete(tagged);
      throw new ExecutionEngineError(name, "engine not configured");
    }

    try {
      const result = await engine.poll(token, maxAttempts);
      failedUntil.delete(name);
      inflight.delete(tagged);
      inflight.delete(current);
      return result;
    } catch (err) {
      // A real verdict (or an unknown token) is not something another engine
      // can improve on, and without the original submission there is nothing
      // to re-run anyway.
      if (!isEngineDown(err) || !info) {
        inflight.delete(tagged);
        inflight.delete(current);
        throw err;
      }
      markDown(name, err);
      info.tried.add(name);

      const next = healthyFirst().find((candidate) => !info.tried.has(candidate));
      if (!next) {
        inflight.delete(tagged);
        throw err;
      }

      console.warn(`[Executor] ${name} died mid-run; re-running this submission on ${next}`);
      info.tried.add(next);
      try {
        const nextEngine = ENGINES[next];
        if (!nextEngine) throw new ExecutionEngineError(next, "engine not configured");
        current = tag(next, await nextEngine.submit(info.submission, info.rawLanguage));
      } catch (resubmitErr) {
        if (!isEngineDown(resubmitErr)) {
          inflight.delete(tagged);
          throw resubmitErr;
        }
        markDown(next, resubmitErr);
        // Loop again: `current` still points at the dead engine, whose poll
        // fails immediately, and the search moves on to the next candidate.
      }
    }
  }
};

export const pollResultBatch = async (
  tagged: string[],
  maxAttempts?: number,
): Promise<Array<Judge0Result & { token: string }>> => {
  if (tagged.length === 0) return [];
  // Per-token polling so each one can fail over on its own.
  const results = await Promise.all(tagged.map((token) => pollResult(token, maxAttempts)));
  return results.map((result, i) => ({ ...result, token: tagged[i] as string }));
};
