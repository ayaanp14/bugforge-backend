import axios from "axios";
import { wrapCode, type Judge0Result, type Judge0Submission } from "./judge0.js";
import { ExecutionEngineError } from "./engine-error.js";

/**
 * Free execution engine: the public Wandbox API (https://wandbox.org).
 * No key, no signup, no cost. Community-run (no SLA), so every call goes
 * through a conservative global throttle. Wandbox runs synchronously and
 * does not judge expected output or report time/memory, so this module
 * compares stdout itself and synthesizes Judge0-shaped results.
 *
 * Not supported here: kotlin (Wandbox has no Kotlin toolchain).
 */

const WANDBOX_BASE_URL = process.env["WANDBOX_URL"] || "https://wandbox.org/api";
// Courtesy throttle for a free community service. 500ms ≈ 2 req/s.
const WANDBOX_MIN_INTERVAL_MS = Math.max(
  0,
  parseInt(process.env["WANDBOX_MIN_INTERVAL_MS"] ?? "500", 10) || 500
);
const WANDBOX_REQUEST_TIMEOUT_MS = Math.max(
  10000,
  parseInt(process.env["WANDBOX_REQUEST_TIMEOUT_MS"] ?? "45000", 10) || 45000
);
const WANDBOX_DEBUG_LOGS = process.env["WANDBOX_DEBUG_LOGS"] === "true";

/** Our language keys → Wandbox compiler ids (from GET /api/list.json). */
const WANDBOX_COMPILERS: Record<string, string> = {
  javascript: "nodejs-20.17.0",
  typescript: "typescript-5.6.2",
  python: "cpython-3.13.8",
  java: "openjdk-jdk-22+36",
  cpp: "gcc-13.2.0",
  c: "gcc-13.2.0-c",
  go: "go-1.23.2",
  csharp: "mono-6.12.0.199",
  swift: "swift-6.0.1",
  rust: "rust-1.82.0",
  php: "php-8.3.12",
  ruby: "ruby-3.4.9",
  // kotlin: not available on Wandbox
};

// ── Global throttle: each caller reserves the next free time slot ──
let nextSlot = 0;
async function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const slot = Math.max(now, nextSlot);
  nextSlot = slot + WANDBOX_MIN_INTERVAL_MS;
  if (slot > now) {
    await new Promise((resolve) => setTimeout(resolve, slot - now));
  }
  return fn();
}

interface WandboxResponse {
  status?: string; // exit code as string ("0" on success)
  signal?: string; // e.g. "Killed" when the run was cut off
  compiler_output?: string;
  compiler_error?: string;
  program_output?: string;
  program_error?: string;
}

async function postCompileWithRetry(body: Record<string, unknown>): Promise<WandboxResponse> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await axios.post<WandboxResponse>(`${WANDBOX_BASE_URL}/compile.json`, body, {
        headers: { "Content-Type": "application/json" },
        timeout: WANDBOX_REQUEST_TIMEOUT_MS,
        proxy: false,
      });
      return response.data;
    } catch (err: unknown) {
      lastError = err;
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      // Retry transient failures (rate limiting / server hiccups) with backoff
      if (status !== 429 && (status === undefined || status < 500)) throw err;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  // Three 5xx or three timeouts in a row is not a hiccup: Wandbox is a free
  // community service with no SLA, and when its sandbox falls over it answers
  // every language with the same 500. Say so, rather than blaming the code.
  throw new ExecutionEngineError("wandbox", describeFailure(lastError));
}

/** The engine's own words, trimmed to something worth logging. */
function describeFailure(err: unknown): string | undefined {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const body = err.response?.data;
    const text = typeof body === "string" ? body : body ? JSON.stringify(body) : err.code || err.message;
    return `${status ?? "no response"} ${String(text).replace(/\s+/g, " ").slice(0, 200)}`.trim();
  }
  return err instanceof Error ? err.message.slice(0, 200) : undefined;
}

function toJudge0Result(data: WandboxResponse, submission: Judge0Submission): Judge0Result {
  const exitCode = data.status ?? "";
  const stdout = data.program_output || null;
  const stderr = data.program_error || null;
  const compileError = (data.compiler_error || "").trim();

  const base = {
    stdout,
    stderr,
    compile_output: null as string | null,
    message: null as string | null,
    time: "0", // Wandbox does not report time/memory
    memory: 0,
  };

  // Compiler wrote errors and nothing ran successfully → compilation error
  if (compileError.length > 0 && exitCode !== "0") {
    return {
      ...base,
      stdout: null,
      compile_output: compileError,
      status: { id: 6, description: "Compilation Error" },
    };
  }

  // Wandbox kills over-limit runs with a signal
  if (data.signal && data.signal.length > 0) {
    return { ...base, status: { id: 5, description: "Time Limit Exceeded" } };
  }

  if (exitCode !== "0") {
    return { ...base, status: { id: 11, description: "Runtime Error (NZEC)" } };
  }

  // Wandbox doesn't judge output — replicate Judge0's expected_output check
  if (typeof submission.expected_output === "string" && submission.expected_output.length > 0) {
    const passed = (stdout ?? "").trim() === submission.expected_output.trim();
    return passed
      ? { ...base, status: { id: 3, description: "Accepted" } }
      : { ...base, status: { id: 4, description: "Wrong Answer" } };
  }

  return { ...base, status: { id: 3, description: "Accepted" } };
}

async function executeWandbox(submission: Judge0Submission, rawLanguage: string): Promise<Judge0Result> {
  const compiler = WANDBOX_COMPILERS[rawLanguage];
  if (!compiler) throw new Error(`Wandbox: unsupported language "${rawLanguage}"`);

  let wrappedCode = wrapCode(submission.source_code, rawLanguage);

  // Wandbox stores the source as prog.java, so a public Main class won't
  // compile ("should be declared in a file named Main.java"). A non-public
  // Main is still found and run by the launcher.
  if (rawLanguage === "java") {
    wrappedCode = wrappedCode.replace(/public\s+(final\s+)?class\s+Main\b/, "$1class Main");
  }

  const body = {
    compiler,
    code: wrappedCode,
    stdin: submission.stdin ?? "",
  };

  if (WANDBOX_DEBUG_LOGS) {
    console.log(`[Wandbox] Executing ${compiler} (${wrappedCode.length} bytes)`);
  }

  const data = await throttled(() => postCompileWithRetry(body));

  if (WANDBOX_DEBUG_LOGS) {
    console.log(`[Wandbox] Result: status=${data.status} signal=${data.signal ?? ""}`);
  }

  return toJudge0Result(data, submission);
}

// ── Judge0-compatible token/poll interface ─────────────────────────
// Wandbox is synchronous, so "tokens" are keys into a map of in-flight
// promises: submit starts execution immediately, poll awaits it.
const pending = new Map<string, Promise<Judge0Result>>();
let tokenCounter = 0;

export async function submitToWandbox(submission: Judge0Submission, rawLanguage: string): Promise<string> {
  const token = `wandbox-${Date.now()}-${tokenCounter++}`;
  const promise = executeWandbox(submission, rawLanguage);
  promise.catch(() => {}); // handled at poll time; avoid unhandled rejection
  pending.set(token, promise);
  return token;
}

export async function submitBatchToWandbox(
  submissions: Judge0Submission[],
  rawLanguage: string
): Promise<string[]> {
  return Promise.all(submissions.map((submission) => submitToWandbox(submission, rawLanguage)));
}

export async function pollWandbox(token: string, _maxAttempts?: number): Promise<Judge0Result> {
  const promise = pending.get(token);
  if (!promise) throw new Error(`Wandbox: unknown token ${token}`);
  try {
    return await promise;
  } finally {
    pending.delete(token);
  }
}

export async function pollBatchWandbox(
  tokens: string[],
  _maxAttempts?: number
): Promise<Array<Judge0Result & { token: string }>> {
  return Promise.all(
    tokens.map(async (token) => ({ ...(await pollWandbox(token)), token }))
  );
}
