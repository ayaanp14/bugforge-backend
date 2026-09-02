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

/**
 * Execution-engine switch.
 *   EXECUTOR=judge0 (default) — self-hosted Judge0 (local docker compose)
 *   EXECUTOR=wandbox          — free public Wandbox API (wandbox.org), no key,
 *                               for zero-cost production (no kotlin, no
 *                               time/memory metrics)
 *   EXECUTOR=piston           — Piston API (self-hosted via PISTON_URL; the
 *                               public emkc.org instance is whitelist-only)
 * All engines share the Judge0 token/poll interface and result shape.
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
};

const ENGINE_NAME = (process.env["EXECUTOR"] ?? "judge0").toLowerCase();
const engine = ENGINES[ENGINE_NAME] ?? ENGINES.judge0;
console.log(`[Executor] Engine: ${ENGINES[ENGINE_NAME] ? ENGINE_NAME : `unknown "${ENGINE_NAME}", falling back to judge0`}`);

/** The resolved engine name ("judge0" | "piston" | "wandbox"). */
export const EXECUTOR_ENGINE = ENGINES[ENGINE_NAME] ? ENGINE_NAME : "judge0";

export { LANGUAGE_MAP };
export type { Judge0Result, Judge0Submission };

export const submitCode = engine.submit;
export const submitCodeBatch = engine.submitBatch;
export const pollResult = engine.poll;
export const pollResultBatch = engine.pollBatch;
