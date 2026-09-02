import { LANGUAGE_MAP } from "./judge0.js";
import { pollResult, submitCode } from "./executor.js";
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

export async function runBatch(
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
      // The run ended (crash or timeout) before this case produced output.
      return wholeRunTimedOut
        ? { passed: false, status: "Time Limit Exceeded", verdict: "TIME_LIMIT_EXCEEDED", actualOutput: null, stderr: stderrText, compile_output: null }
        : { passed: false, status: "Runtime Error", verdict: "RUNTIME_ERROR", actualOutput: null, stderr: stderrText || "Execution ended before this test case ran", compile_output: null };
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
