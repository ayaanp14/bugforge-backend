import { isJudgeLanguage } from "./judge0.js";
import { MAX_SOURCE_BYTES, MAX_STDIN_BYTES } from "./program-judge.js";

/**
 * The online compiler's rules (routes/compiler): what a run request may hold,
 * and the budget visitors share.
 *
 * A run is a whole program and its stdin through the study plans' program
 * judge (lib/program-judge runProgram: no driver, no sentinel protocol, the
 * same 64 KB / 16 KB caps), in any of the thirteen judge languages — or SQL
 * (since 2026-11-17, /compiler/sql), which runProgram answers on the SQL
 * problems' own engine in this process (lib/sql/program: the stdin is the
 * setup script, the source the queries) and never on the shared remote one.
 */

/** The compiler's SQL: run here, so it draws nothing from the visitors' engine budget. */
export const LOCAL_LANGUAGES: ReadonlySet<string> = new Set(["sql"]);

export interface RunRequest {
  language: string;
  code: string;
  stdin: string;
}

export type ParsedRun = { ok: true; run: RunRequest } | { ok: false; status: number; error: string };

export function parseRunRequest(body: unknown): ParsedRun {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const language = b["language"];
  if (!(isJudgeLanguage(language) || (typeof language === "string" && LOCAL_LANGUAGES.has(language)))) return { ok: false, status: 400, error: "Pick one of the compiler's languages." };
  const code = b["code"];
  if (typeof code !== "string" || !code.trim()) return { ok: false, status: 400, error: "Write some code to run." };
  const stdin = b["stdin"] ?? "";
  if (typeof stdin !== "string") return { ok: false, status: 400, error: "The input must be text." };
  if (Buffer.byteLength(code, "utf8") > MAX_SOURCE_BYTES) return { ok: false, status: 413, error: `Programs are limited to ${MAX_SOURCE_BYTES / 1024} KB.` };
  if (Buffer.byteLength(stdin, "utf8") > MAX_STDIN_BYTES) return { ok: false, status: 413, error: `Input is limited to ${MAX_STDIN_BYTES / 1024} KB.` };
  return { ok: true, run: { language, code, stdin } };
}

/**
 * What every visitor together may spend on the engine. The per-address
 * limiters cap one network; this caps the sum, because the engine is a free
 * community API (lib/paiza) behind one courtesy throttle that members'
 * Run and Submit queue behind too — a crowd of visitors, or a script on many
 * addresses, must never slow a member's judging. Two numbers: runs in flight
 * at once (each holds a place in that throttle for a second or more) and
 * runs started in the current clock hour. Members never draw on it.
 *
 * In process, like the rate limiters: one API instance today
 * (backend/deploy). Move it to Redis with them if that changes.
 */
export class VisitorBudget {
  private inFlight = 0;
  private hour = -1;
  private started = 0;

  constructor(
    private readonly perHour: number,
    private readonly maxInFlight: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** Take a place for one run: "ok" (call release() when it ends), "busy" (too many at once) or "spent" (the hour's runs are used). */
  take(): "ok" | "busy" | "spent" {
    const hour = Math.floor(this.now() / 3_600_000);
    if (hour !== this.hour) {
      this.hour = hour;
      this.started = 0;
    }
    if (this.started >= this.perHour) return "spent";
    if (this.inFlight >= this.maxInFlight) return "busy";
    this.started += 1;
    this.inFlight += 1;
    return "ok";
  }

  release(): void {
    this.inFlight = Math.max(0, this.inFlight - 1);
  }

  /** Seconds until the hour's budget refills. */
  secondsToRefill(): number {
    return Math.max(1, Math.ceil((3_600_000 - (this.now() % 3_600_000)) / 1000));
  }
}

function envInt(name: string, fallback: number): number {
  const value = parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/** The process's one budget. COMPILER_VISITOR_RUNS_PER_HOUR / COMPILER_VISITOR_IN_FLIGHT override the defaults. */
export const visitorBudget = new VisitorBudget(envInt("COMPILER_VISITOR_RUNS_PER_HOUR", 600), envInt("COMPILER_VISITOR_IN_FLIGHT", 2));
