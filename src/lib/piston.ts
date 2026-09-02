import axios from "axios";
import { wrapCode, type Judge0Result, type Judge0Submission } from "./judge0.js";

/**
 * Free execution engine: the public Piston API (https://emkc.org).
 * No key, no cost — but rate-limited (~5 req/s per IP), so every call goes
 * through a global throttle. Piston runs synchronously and does not judge
 * expected output, so this module compares stdout itself and synthesizes
 * Judge0-shaped results (same status ids) to stay drop-in compatible.
 */

const PISTON_BASE_URL = process.env["PISTON_URL"] || "https://emkc.org/api/v2/piston";
// Minimum gap between requests. 250ms ≈ 4 req/s, safely under emkc's limit.
const PISTON_MIN_INTERVAL_MS = Math.max(
  0,
  parseInt(process.env["PISTON_MIN_INTERVAL_MS"] ?? "250", 10) || 250
);
const PISTON_REQUEST_TIMEOUT_MS = Math.max(
  5000,
  parseInt(process.env["PISTON_REQUEST_TIMEOUT_MS"] ?? "30000", 10) || 30000
);
const PISTON_DEBUG_LOGS = process.env["PISTON_DEBUG_LOGS"] === "true";

/** Our language keys → Piston language name + entry file name. */
const PISTON_LANGUAGES: Record<string, { language: string; file: string }> = {
  javascript: { language: "javascript", file: "main.js" },
  typescript: { language: "typescript", file: "main.ts" },
  python: { language: "python", file: "main.py" },
  java: { language: "java", file: "Main.java" },
  cpp: { language: "c++", file: "main.cpp" },
  c: { language: "c", file: "main.c" },
  go: { language: "go", file: "main.go" },
  csharp: { language: "csharp", file: "Main.cs" },
  kotlin: { language: "kotlin", file: "main.kt" },
  swift: { language: "swift", file: "main.swift" },
  rust: { language: "rust", file: "main.rs" },
  php: { language: "php", file: "main.php" },
  ruby: { language: "ruby", file: "main.rb" },
};

// ── Global throttle: each caller reserves the next free time slot ──
let nextSlot = 0;
async function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const slot = Math.max(now, nextSlot);
  nextSlot = slot + PISTON_MIN_INTERVAL_MS;
  if (slot > now) {
    await new Promise((resolve) => setTimeout(resolve, slot - now));
  }
  return fn();
}

// ── Runtime versions (fetched once, cached) ────────────────────────
let runtimesPromise: Promise<Map<string, string>> | null = null;

async function fetchRuntimes(): Promise<Map<string, string>> {
  const response = await axios.get<Array<{ language: string; version: string; aliases?: string[] }>>(
    `${PISTON_BASE_URL}/runtimes`,
    { timeout: PISTON_REQUEST_TIMEOUT_MS, proxy: false }
  );
  const map = new Map<string, string>();
  for (const runtime of response.data) {
    map.set(runtime.language, runtime.version);
    for (const alias of runtime.aliases ?? []) {
      if (!map.has(alias)) map.set(alias, runtime.version);
    }
  }
  return map;
}

async function resolveVersion(language: string): Promise<string> {
  if (!runtimesPromise) runtimesPromise = fetchRuntimes();
  try {
    const runtimes = await runtimesPromise;
    return runtimes.get(language) ?? "*";
  } catch (err) {
    runtimesPromise = null; // retry on the next call
    console.error("Piston runtimes fetch failed, using version '*':", (err as Error).message);
    return "*";
  }
}

// ── Execution ──────────────────────────────────────────────────────
interface PistonStageResult {
  stdout?: string;
  stderr?: string;
  output?: string;
  code: number | null;
  signal: string | null;
  cpu_time?: number;
  wall_time?: number;
  memory?: number;
}

interface PistonResponse {
  language: string;
  version: string;
  compile?: PistonStageResult;
  run: PistonStageResult;
}

async function postExecuteWithRetry(body: Record<string, unknown>): Promise<PistonResponse> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await axios.post<PistonResponse>(`${PISTON_BASE_URL}/execute`, body, {
        headers: { "Content-Type": "application/json" },
        timeout: PISTON_REQUEST_TIMEOUT_MS,
        proxy: false,
      });
      return response.data;
    } catch (err: unknown) {
      lastError = err;
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      // 429 = rate limited: back off and retry; anything else fails fast
      if (status !== 429) throw err;
      await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  throw lastError;
}

function toJudge0Result(data: PistonResponse, submission: Judge0Submission): Judge0Result {
  const run = data.run ?? { code: null, signal: null };
  const compile = data.compile;

  const timeSeconds = ((run.cpu_time ?? run.wall_time ?? 0) / 1000).toFixed(3);
  const memoryKb = run.memory ? Math.round(run.memory / 1024) : 0;

  const base = {
    stdout: run.stdout ?? null,
    stderr: run.stderr ?? null,
    compile_output: null as string | null,
    message: null as string | null,
    time: timeSeconds,
    memory: memoryKb,
  };

  // Compilation failure
  if (compile && compile.code !== 0 && compile.code !== null) {
    return {
      ...base,
      stdout: null,
      compile_output: compile.stderr || compile.output || "Compilation failed",
      status: { id: 6, description: "Compilation Error" },
    };
  }

  // Piston kills timed-out runs with SIGKILL
  if (run.signal === "SIGKILL") {
    return { ...base, status: { id: 5, description: "Time Limit Exceeded" } };
  }

  // Non-zero exit
  if (run.code !== 0 && run.code !== null) {
    return { ...base, status: { id: 11, description: "Runtime Error (NZEC)" } };
  }

  // Piston doesn't judge output — replicate Judge0's expected_output check
  if (typeof submission.expected_output === "string" && submission.expected_output.length > 0) {
    const passed = (run.stdout ?? "").trim() === submission.expected_output.trim();
    return passed
      ? { ...base, status: { id: 3, description: "Accepted" } }
      : { ...base, status: { id: 4, description: "Wrong Answer" } };
  }

  return { ...base, status: { id: 3, description: "Accepted" } };
}

async function executePiston(submission: Judge0Submission, rawLanguage: string): Promise<Judge0Result> {
  const cfg = PISTON_LANGUAGES[rawLanguage];
  if (!cfg) throw new Error(`Piston: unsupported language "${rawLanguage}"`);

  const wrappedCode = wrapCode(submission.source_code, rawLanguage);
  const version = await resolveVersion(cfg.language);

  const body = {
    language: cfg.language,
    version,
    files: [{ name: cfg.file, content: wrappedCode }],
    stdin: submission.stdin ?? "",
    args: [],
    run_timeout: Math.min(Math.max((submission.cpu_time_limit ?? 5) * 1000, 1000), 15000),
    compile_timeout: 15000,
  };

  if (PISTON_DEBUG_LOGS) {
    console.log(`[Piston] Executing ${cfg.language}@${version} (${wrappedCode.length} bytes)`);
  }

  const data = await throttled(() => postExecuteWithRetry(body));

  if (PISTON_DEBUG_LOGS) {
    console.log(`[Piston] Result: run.code=${data.run?.code} signal=${data.run?.signal}`);
  }

  return toJudge0Result(data, submission);
}

// ── Judge0-compatible token/poll interface ─────────────────────────
// Piston is synchronous, so "tokens" are keys into a map of in-flight
// promises: submit starts execution immediately, poll awaits it.
const pending = new Map<string, Promise<Judge0Result>>();
let tokenCounter = 0;

export async function submitToPiston(submission: Judge0Submission, rawLanguage: string): Promise<string> {
  const token = `piston-${Date.now()}-${tokenCounter++}`;
  const promise = executePiston(submission, rawLanguage);
  promise.catch(() => {}); // handled at poll time; avoid unhandled rejection
  pending.set(token, promise);
  return token;
}

export async function submitBatchToPiston(
  submissions: Judge0Submission[],
  rawLanguage: string
): Promise<string[]> {
  return Promise.all(submissions.map((submission) => submitToPiston(submission, rawLanguage)));
}

export async function pollPiston(token: string, _maxAttempts?: number): Promise<Judge0Result> {
  const promise = pending.get(token);
  if (!promise) throw new Error(`Piston: unknown token ${token}`);
  try {
    return await promise;
  } finally {
    pending.delete(token);
  }
}

export async function pollBatchPiston(
  tokens: string[],
  _maxAttempts?: number
): Promise<Array<Judge0Result & { token: string }>> {
  return Promise.all(
    tokens.map(async (token) => ({ ...(await pollPiston(token)), token }))
  );
}
