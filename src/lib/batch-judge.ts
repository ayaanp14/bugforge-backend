import { LANGUAGE_MAP } from "./judge0.js";
import { EXECUTOR_ENGINE, pollResult, submitCode } from "./executor.js";
import { ERROR_MARKER, buildBatchStdin, splitBatchStdout } from "./batch.js";

/**
 * Runs user code against ALL test cases in a single engine execution
 * (1 compile + 1 run regardless of case count) and judges the outputs
 * server-side. See src/lib/batch.ts for the stdin/stdout protocol.
 */

export interface BatchCase {
  input: string;
  expectedOutput: string;
}

export interface CaseVerdict {
  passed: boolean;
  /** Human-readable per-case status shown in the UI. */
  status: string;
  /** Machine verdict: ACCEPTED | WRONG_ANSWER | RUNTIME_ERROR | TIME_LIMIT_EXCEEDED | COMPILATION_ERROR */
  verdict: string;
  actualOutput: string | null;
  stderr: string | null;
  compile_output: string | null;
}

export interface BatchRunResult {
  perCase: CaseVerdict[];
  runtimeMs: number;
  memoryKb: number;
}

const normalize = (v: string | null | undefined) => (v ?? "").trim();

// ── Auto-chunking (Wandbox/Piston only) ────────────────────────────
// The public engines cap how much stdout they return (Wandbox truncates
// ~145KB), so a huge suite is split into a few runs sized to stay safely
// under the caps. Judge0 is exempt: its ~4MB output ceiling handles even
// 100k-case suites in a single run, and chunking would only add compiles.
// Expected outputs are the size proxy; if a wrong solution still overflows a
// chunk, the Output Limit detection below reports it honestly.
const CHUNK_MAX_OUTPUT_BYTES = 130_000; // observed Wandbox stdout cap ≈ 145KB
const CHUNK_MAX_INPUT_BYTES = 200_000;
const CHUNK_MAX_CASES = 5000;

function chunkCases(cases: BatchCase[]): BatchCase[][] {
  const chunks: BatchCase[][] = [];
  let current: BatchCase[] = [];
  let inputBytes = 0;
  let outputBytes = 0;
  for (const c of cases) {
    const inB = c.input.length + 20;
    const outB = Math.max(c.expectedOutput.length, 32) + 20;
    if (
      current.length > 0 &&
      (current.length >= CHUNK_MAX_CASES ||
        inputBytes + inB > CHUNK_MAX_INPUT_BYTES ||
        outputBytes + outB > CHUNK_MAX_OUTPUT_BYTES)
    ) {
      chunks.push(current);
      current = [];
      inputBytes = 0;
      outputBytes = 0;
    }
    current.push(c);
    inputBytes += inB;
    outputBytes += outB;
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

export async function runBatch(
  code: string,
  language: string,
  cases: BatchCase[],
  limits: { timeLimitMs: number; memoryLimitMb: number }
): Promise<BatchRunResult> {
  const chunks = EXECUTOR_ENGINE === "judge0" ? [cases] : chunkCases(cases);
  if (chunks.length <= 1) {
    return runSingleBatch(code, language, cases, limits);
  }

  // All chunks in parallel (the engine client's throttle paces the requests).
  // A compile error just fails every chunk cheaply — no run phase happens.
  const all = await Promise.all(
    chunks.map((chunk) => runSingleBatch(code, language, chunk, limits))
  );
  return {
    perCase: all.flatMap((b) => b.perCase),
    runtimeMs: all.reduce((sum, b) => sum + b.runtimeMs, 0),
    memoryKb: Math.max(...all.map((b) => b.memoryKb)),
  };
}

async function runSingleBatch(
  code: string,
  language: string,
  cases: BatchCase[],
  limits: { timeLimitMs: number; memoryLimitMb: number }
): Promise<BatchRunResult> {
  const n = cases.length;
  // One budget for the whole run: generous enough for N quick cases, capped
  // at the engines' ceiling (Judge0 MAX_CPU_TIME / Wandbox run_timeout: 15s).
  const cpuSeconds = Math.min(15, Math.max(limits.timeLimitMs / 1000, Math.ceil(n * 0.1) + 2));

  const token = await submitCode(
    {
      source_code: code,
      language_id: LANGUAGE_MAP[language],
      stdin: buildBatchStdin(cases.map((c) => c.input)),
      // No expected_output: judging happens here, per case.
      cpu_time_limit: cpuSeconds,
      memory_limit: limits.memoryLimitMb * 1024,
    },
    language
  );
  const result = await pollResult(token, 120);

  const totalRuntimeMs = result.time ? Math.round(parseFloat(result.time) * 1000) : 0;
  const memoryKb = result.memory ?? 0;

  // Whole-run compile failure → every case is a compilation error.
  // (Only status 6: compile_output alone can be mere compiler warnings.)
  if (result.status.id === 6) {
    // Some setups report compiler diagnostics on stderr instead of compile_output
    const compileOutput = (result.compile_output || result.stderr || result.message || "Compilation failed").trim();
    return {
      perCase: cases.map(() => ({
        passed: false,
        status: "Compilation Error",
        verdict: "COMPILATION_ERROR",
        actualOutput: null,
        stderr: null,
        compile_output: compileOutput,
      })),
      runtimeMs: totalRuntimeMs,
      memoryKb,
    };
  }

  const chunks = splitBatchStdout(result.stdout);
  const wholeRunTimedOut = result.status.id === 5;
  const stderrText = normalize(result.stderr) || null;

  const perCase: CaseVerdict[] = cases.map((tc, i) => {
    if (i >= chunks.length) {
      // The run ended before this case produced output: timeout, crash — or,
      // if the run itself exited cleanly, the engine truncated stdout
      // (too much output for one batch; seen on Wandbox past ~150KB).
      if (wholeRunTimedOut) {
        return { passed: false, status: "Time Limit Exceeded", verdict: "TIME_LIMIT_EXCEEDED", actualOutput: null, stderr: stderrText, compile_output: null };
      }
      if (result.status.id === 3) {
        return { passed: false, status: "Output Limit Exceeded", verdict: "RUNTIME_ERROR", actualOutput: null, stderr: "The execution engine truncated the output — too many test cases for a single batch", compile_output: null };
      }
      return { passed: false, status: "Runtime Error", verdict: "RUNTIME_ERROR", actualOutput: null, stderr: stderrText || "Execution ended before this test case ran", compile_output: null };
    }
    const chunk = chunks[i];
    if (chunk.startsWith(ERROR_MARKER)) {
      return {
        passed: false,
        status: "Runtime Error",
        verdict: "RUNTIME_ERROR",
        actualOutput: null,
        stderr: chunk.slice(ERROR_MARKER.length).trim(),
        compile_output: null,
      };
    }
    const passed = normalize(chunk) === normalize(tc.expectedOutput);
    return {
      passed,
      status: passed ? "Accepted" : "Wrong Answer",
      verdict: passed ? "ACCEPTED" : "WRONG_ANSWER",
      actualOutput: chunk,
      stderr: null,
      compile_output: null,
    };
  });

  return { perCase, runtimeMs: totalRuntimeMs, memoryKb };
}
