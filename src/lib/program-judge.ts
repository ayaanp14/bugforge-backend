import { submitCodeBatch, pollResultBatch, LANGUAGE_MAP, type Judge0Result, type Judge0Submission } from "./executor.js";
import { isEngineDown } from "./engine-error.js";

/**
 * Whole-program judging, for the study plans.
 *
 * The problem judge (lib/batch-judge.ts) wraps a function stub in a driver
 * and speaks the sentinel protocol; that is right for an algorithm with a
 * typed signature and wrong for a language lesson, whose exercise is "write
 * a program": a class with a main method that reads stdin and prints. Here
 * the learner's source is the whole file, each case is a stdin and the
 * stdout it should produce, and the verdict is a plain comparison — no
 * driver, no markers, so `__CODEXA_` never has to be reserved in it.
 *
 * Cases run as one batch submission per case (an engine cannot re-run one
 * process on several inputs), so an exercise keeps to a handful; the case
 * count is the content's discipline, not this module's.
 *
 * The engine order is the caller's: STUDY_EXECUTOR names it (default
 * `paiza`), because the toolchain matters here in a way it does not for
 * the problem judge — a Java lesson teaches records, sealed types and text
 * blocks, which Paiza's OpenJDK 18 compiles and the local Judge0's JDK 13
 * refuses. Falling over to Judge0 would turn an outage into a compile error
 * the learner would read as their own. When every engine in the order is
 * down the result is `ENGINE_ERROR`, which the route answers as a 503.
 */

export interface ProgramCase {
  stdin: string;
  expected: string;
  /** A hidden case shows only pass/fail, never its input or output. */
  hidden?: boolean;
}

export type ProgramVerdict =
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "COMPILE_ERROR"
  | "RUNTIME_ERROR"
  | "TIME_LIMIT_EXCEEDED"
  | "ENGINE_ERROR";

export interface ProgramCaseResult {
  index: number;
  passed: boolean;
  hidden: boolean;
  /** Withheld (null) for a hidden case. */
  stdin: string | null;
  expected: string | null;
  actual: string | null;
  status: string;
  stderr: string | null;
}

export interface ProgramJudgeResult {
  verdict: ProgramVerdict;
  passed: number;
  total: number;
  cases: ProgramCaseResult[];
  /** The compiler's complaint, when the verdict is COMPILE_ERROR. */
  compileOutput: string | null;
  /** Wall time of the slowest case, in ms. */
  timeMs: number;
}

export interface ProgramRunResult {
  status: ProgramVerdict;
  stdout: string;
  stderr: string | null;
  compileOutput: string | null;
  timeMs: number;
}

/** Engines the study judge may use, in order. */
export const STUDY_ENGINES: string[] = (process.env["STUDY_EXECUTOR"] ?? "paiza")
  .split(",")
  .map((name) => name.trim().toLowerCase())
  .filter(Boolean);

const CPU_LIMIT_S = 5;
const MEMORY_LIMIT_KB = 256 * 1024;
/** Exercises are small programs; anything larger is not a lesson answer. */
export const MAX_SOURCE_BYTES = 64 * 1024;
export const MAX_STDIN_BYTES = 16 * 1024;

/**
 * What "the same output" means: every line without its trailing spaces,
 * with no trailing blank lines, CRLF folded to LF. A learner who ends the
 * last line with `println` and one who does not have both answered; a
 * missing line or a stray word has not.
 */
export function normalizeOutput(text: string | null | undefined): string {
  return (text ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n+$/g, "");
}

function statusOf(result: Judge0Result): ProgramVerdict {
  const id = result.status?.id ?? 0;
  if (id === 6) return "COMPILE_ERROR";
  if (id === 5) return "TIME_LIMIT_EXCEEDED";
  if (id >= 7 && id <= 12) return "RUNTIME_ERROR";
  if (id === 13 || id === 14) return "ENGINE_ERROR";
  return "ACCEPTED";
}

function timeOf(result: Judge0Result): number {
  const seconds = parseFloat(result.time ?? "0");
  return Number.isFinite(seconds) ? Math.round(seconds * 1000) : 0;
}

function trimTail(text: string | null | undefined, max = 4000): string | null {
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max)}\n… (truncated)` : text;
}

function submissionFor(source: string, language: string, stdin: string): Judge0Submission {
  const languageId = LANGUAGE_MAP[language];
  if (!languageId) throw new Error(`program judge: unsupported language "${language}"`);
  // No expected_output: the comparison is ours (normalizeOutput), and an
  // engine's own exact-match verdict would only disagree with it.
  return { source_code: source, language_id: languageId, stdin, cpu_time_limit: CPU_LIMIT_S, memory_limit: MEMORY_LIMIT_KB, raw: true };
}

/** Run once on the learner's own input — the "Run" button. */
export async function runProgram(source: string, language: string, stdin: string): Promise<ProgramRunResult> {
  let results: Array<Judge0Result & { token: string }>;
  try {
    const tokens = await submitCodeBatch([submissionFor(source, language, stdin)], language, STUDY_ENGINES);
    results = await pollResultBatch(tokens);
  } catch (err) {
    if (isEngineDown(err)) return { status: "ENGINE_ERROR", stdout: "", stderr: null, compileOutput: null, timeMs: 0 };
    throw err;
  }
  const result = results[0]!;
  const status = statusOf(result);
  return {
    status,
    stdout: result.stdout ?? "",
    stderr: trimTail(result.stderr),
    compileOutput: status === "COMPILE_ERROR" ? trimTail(result.compile_output ?? result.message) : null,
    timeMs: timeOf(result),
  };
}

/** Judge the program against every case — the "Submit" button and the content validator. */
export async function judgeProgram(source: string, language: string, cases: ProgramCase[]): Promise<ProgramJudgeResult> {
  const total = cases.length;
  const empty = (verdict: ProgramVerdict, compileOutput: string | null = null): ProgramJudgeResult => ({
    verdict,
    passed: 0,
    total,
    cases: cases.map((c, index) => ({
      index,
      passed: false,
      hidden: Boolean(c.hidden),
      stdin: c.hidden ? null : c.stdin,
      expected: c.hidden ? null : c.expected,
      actual: null,
      status: verdict,
      stderr: null,
    })),
    compileOutput,
    timeMs: 0,
  });
  if (total === 0) return empty("ACCEPTED");

  let results: Array<Judge0Result & { token: string }>;
  try {
    const tokens = await submitCodeBatch(
      cases.map((c) => submissionFor(source, language, c.stdin)),
      language,
      STUDY_ENGINES,
    );
    results = await pollResultBatch(tokens);
  } catch (err) {
    if (isEngineDown(err)) return empty("ENGINE_ERROR");
    throw err;
  }

  // One compile error is every case's compile error; say it once.
  const compileFailure = results.find((r) => statusOf(r) === "COMPILE_ERROR");
  if (compileFailure) return empty("COMPILE_ERROR", trimTail(compileFailure.compile_output ?? compileFailure.message));

  let verdict: ProgramVerdict = "ACCEPTED";
  let passed = 0;
  let timeMs = 0;
  const judged = cases.map((c, index): ProgramCaseResult => {
    const result = results[index]!;
    const status = statusOf(result);
    timeMs = Math.max(timeMs, timeOf(result));
    const actual = result.stdout ?? "";
    const ok = status === "ACCEPTED" && normalizeOutput(actual) === normalizeOutput(c.expected);
    if (ok) passed += 1;
    else if (verdict === "ACCEPTED") verdict = status === "ACCEPTED" ? "WRONG_ANSWER" : status;
    const hidden = Boolean(c.hidden);
    return {
      index,
      passed: ok,
      hidden,
      stdin: hidden ? null : c.stdin,
      expected: hidden ? null : c.expected,
      actual: hidden ? null : trimTail(actual, 2000),
      status: ok ? "ACCEPTED" : status === "ACCEPTED" ? "WRONG_ANSWER" : status,
      stderr: hidden ? null : trimTail(result.stderr, 2000),
    };
  });

  return { verdict, passed, total, cases: judged, compileOutput: null, timeMs };
}
