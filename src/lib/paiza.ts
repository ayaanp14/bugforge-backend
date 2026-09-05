import axios from "axios";
import { wrapCode, type Judge0Result, type Judge0Submission } from "./judge0.js";
import { ExecutionEngineError } from "./engine-error.js";

/**
 * Free execution engine: the public Paiza.IO API (https://api.paiza.io).
 *
 * No key and no signup — `api_key=guest` is the documented public credential.
 * Community-run with no SLA, so every call goes through a courtesy throttle,
 * exactly like the Wandbox client. Paiza is asynchronous (create → poll →
 * details), which maps straight onto the Judge0 token/poll interface: the
 * runner id *is* the token.
 *
 * Paiza does not judge expected output, so this module compares stdout itself
 * and synthesizes Judge0-shaped results. Unlike Wandbox it does have a Kotlin
 * toolchain, so it covers all thirteen languages the platform offers.
 */

const PAIZA_BASE_URL = process.env["PAIZA_URL"] || "https://api.paiza.io";
const PAIZA_API_KEY = process.env["PAIZA_API_KEY"] || "guest";
// Courtesy throttle for a free community service. 500ms ≈ 2 req/s.
const PAIZA_MIN_INTERVAL_MS = Math.max(
  0,
  parseInt(process.env["PAIZA_MIN_INTERVAL_MS"] ?? "500", 10) || 500
);
const PAIZA_REQUEST_TIMEOUT_MS = Math.max(
  10000,
  parseInt(process.env["PAIZA_REQUEST_TIMEOUT_MS"] ?? "45000", 10) || 45000
);
const PAIZA_POLL_INTERVAL_MS = Math.max(
  150,
  parseInt(process.env["PAIZA_POLL_INTERVAL_MS"] ?? "450", 10) || 450
);
const PAIZA_DEBUG_LOGS = process.env["PAIZA_DEBUG_LOGS"] === "true";

/** Our language keys → Paiza language ids. */
const PAIZA_LANGUAGES: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python3",
  java: "java",
  cpp: "cpp",
  c: "c",
  go: "go",
  csharp: "csharp",
  swift: "swift",
  rust: "rust",
  php: "php",
  ruby: "ruby",
  kotlin: "kotlin",
};

// ── Global throttle: each caller reserves the next free time slot ──
let nextSlot = 0;
async function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const slot = Math.max(now, nextSlot);
  nextSlot = slot + PAIZA_MIN_INTERVAL_MS;
  if (slot > now) {
    await new Promise((resolve) => setTimeout(resolve, slot - now));
  }
  return fn();
}

interface PaizaCreated {
  id?: string;
  status?: string;
  error?: string;
}

interface PaizaDetails {
  build_result?: string | null; // "success" | "failure" | "error" | null (interpreted languages)
  build_stdout?: string | null;
  build_stderr?: string | null;
  result?: string | null; // "success" | "failure" | "error" | "timeout"
  stdout?: string | null;
  stderr?: string | null;
  exit_code?: number | string | null;
  time?: string | null; // seconds, e.g. "0.04"
  memory?: number | null; // bytes
  error?: string | null;
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

async function requestWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      // Retry only transient failures (rate limiting / server hiccups)
      if (status !== 429 && (status === undefined || status < 500)) throw err;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  // Three 5xx or three timeouts in a row is not a hiccup — the engine is out.
  throw new ExecutionEngineError("paiza", describeFailure(lastError));
}

function toJudge0Result(data: PaizaDetails, submission: Judge0Submission): Judge0Result {
  const stdout = data.stdout ?? null;
  const stderr = data.stderr || null;
  const buildError = (data.build_stderr || "").trim();
  const exitCode = data.exit_code === null || data.exit_code === undefined ? null : Number(data.exit_code);

  const base = {
    stdout,
    stderr,
    compile_output: null as string | null,
    message: null as string | null,
    time: data.time ?? "0",
    // Paiza reports bytes; Judge0's contract is kilobytes.
    memory: typeof data.memory === "number" ? Math.round(data.memory / 1024) : 0,
  };

  // The compiler refused it: nothing ran.
  if (data.build_result && data.build_result !== "success") {
    return {
      ...base,
      stdout: null,
      compile_output: buildError || data.build_stdout || "Compilation failed",
      status: { id: 6, description: "Compilation Error" },
    };
  }

  if (data.result === "timeout") {
    return { ...base, status: { id: 5, description: "Time Limit Exceeded" } };
  }

  if (exitCode !== null && exitCode !== 0) {
    return { ...base, status: { id: 11, description: "Runtime Error (NZEC)" } };
  }

  // Paiza doesn't judge output — replicate Judge0's expected_output check.
  if (typeof submission.expected_output === "string" && submission.expected_output.length > 0) {
    const passed = (stdout ?? "").trim() === submission.expected_output.trim();
    return passed
      ? { ...base, status: { id: 3, description: "Accepted" } }
      : { ...base, status: { id: 4, description: "Wrong Answer" } };
  }

  return { ...base, status: { id: 3, description: "Accepted" } };
}

// ── Judge0-compatible token/poll interface ─────────────────────────
// Paiza is already asynchronous, so the runner id serves as the token. The
// submission is kept alongside it because the expected-output comparison
// happens here, at poll time.
const pendingSubmissions = new Map<string, Judge0Submission>();

export async function submitToPaiza(submission: Judge0Submission, rawLanguage: string): Promise<string> {
  const language = PAIZA_LANGUAGES[rawLanguage];
  if (!language) throw new Error(`Paiza: unsupported language "${rawLanguage}"`);

  const source = wrapCode(submission.source_code, rawLanguage);

  if (PAIZA_DEBUG_LOGS) {
    console.log(`[Paiza] Creating ${language} runner (${source.length} bytes)`);
  }

  const created = await throttled(() =>
    requestWithRetry(async () => {
      const response = await axios.post<PaizaCreated>(
        `${PAIZA_BASE_URL}/runners/create`,
        { source_code: source, language, input: submission.stdin ?? "", api_key: PAIZA_API_KEY },
        { headers: { "Content-Type": "application/json" }, timeout: PAIZA_REQUEST_TIMEOUT_MS, proxy: false },
      );
      return response.data;
    }),
  );

  if (!created?.id) {
    throw new ExecutionEngineError("paiza", created?.error || "create returned no runner id");
  }

  pendingSubmissions.set(created.id, submission);
  return created.id;
}

export async function submitBatchToPaiza(
  submissions: Judge0Submission[],
  rawLanguage: string
): Promise<string[]> {
  // Sequential on purpose: the throttle paces them anyway, and a free guest
  // key answers a burst with 429s.
  const tokens: string[] = [];
  for (const submission of submissions) {
    tokens.push(await submitToPaiza(submission, rawLanguage));
  }
  return tokens;
}

export async function pollPaiza(token: string, maxAttempts = 120): Promise<Judge0Result> {
  const submission = pendingSubmissions.get(token) ?? ({ source_code: "", language_id: 0 } as Judge0Submission);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await requestWithRetry(async () => {
      const response = await axios.get<{ status?: string; error?: string }>(
        `${PAIZA_BASE_URL}/runners/get_status`,
        { params: { id: token, api_key: PAIZA_API_KEY }, timeout: PAIZA_REQUEST_TIMEOUT_MS, proxy: false },
      );
      return response.data;
    });

    if (status?.status === "completed") {
      const details = await requestWithRetry(async () => {
        const response = await axios.get<PaizaDetails>(`${PAIZA_BASE_URL}/runners/get_details`, {
          params: { id: token, api_key: PAIZA_API_KEY },
          timeout: PAIZA_REQUEST_TIMEOUT_MS,
          proxy: false,
        });
        return response.data;
      });
      pendingSubmissions.delete(token);

      if (PAIZA_DEBUG_LOGS) {
        console.log(`[Paiza] Result: result=${details.result} build=${details.build_result} exit=${details.exit_code}`);
      }
      return toJudge0Result(details, submission);
    }

    await new Promise((resolve) => setTimeout(resolve, PAIZA_POLL_INTERVAL_MS));
  }

  pendingSubmissions.delete(token);
  throw new ExecutionEngineError("paiza", `runner ${token} never completed`);
}

export async function pollBatchPaiza(
  tokens: string[],
  maxAttempts?: number
): Promise<Array<Judge0Result & { token: string }>> {
  return Promise.all(
    tokens.map(async (token) => ({ ...(await pollPaiza(token, maxAttempts)), token }))
  );
}
