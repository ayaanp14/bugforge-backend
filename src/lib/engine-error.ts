/**
 * "The engine is down" is a different answer from "your code failed", and the
 * workspace should never confuse the two. Adapters throw this when the engine
 * itself could not be reached or refused to run anything; routes turn it into a
 * 503 with a message a person can act on, instead of a generic 500.
 *
 * Kept in its own module so the adapters can throw it without importing the
 * executor that imports them.
 */
export class ExecutionEngineError extends Error {
  /** Which engine failed — "wandbox", "judge0", "piston". */
  readonly engine: string;
  /** What the engine said, for the logs. */
  readonly detail: string | undefined;

  constructor(engine: string, detail?: string) {
    super(`Execution engine "${engine}" is unavailable${detail ? `: ${detail}` : ""}`);
    this.name = "ExecutionEngineError";
    this.engine = engine;
    this.detail = detail;
  }
}

export const isEngineDown = (err: unknown): err is ExecutionEngineError =>
  err instanceof ExecutionEngineError;

/** What the workspace shows when the engine, not the code, is the problem. */
export const ENGINE_DOWN_MESSAGE =
  "The code execution service is down right now — this is not your code. Nothing can be run or submitted until it recovers.";
