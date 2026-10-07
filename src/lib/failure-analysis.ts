import { mistakeOf, outcomeOf, NEAR_MISS_RATIO, type MistakeClass } from "./skill-score.js";

/**
 * "Why it failed", the part that needs no model: what the judge's own
 * report already says about a failed submission, said plainly. It is the
 * first thing the workbench shows under a verdict (services/submission-
 * analysis.ts writes it within a moment of the submit), and the facts it
 * establishes are handed to the model as facts (lib/submission-review.ts),
 * so the model's reading starts from what is known rather than guessing it.
 *
 * Every sentence here is either a fact the judge reported (a verdict, a
 * count, a time, an error line) or an inference labelled as one — "most
 * cases pass, so an edge case is likely" — never a claim about a hidden
 * test, which this layer cannot see either. Pure; failure-analysis.test.ts.
 */

export type FindingKind = "fact" | "inference" | "suggestion";

export interface Finding {
  kind: FindingKind;
  text: string;
  /** A line of the learner's code, when the judge's output names one. */
  line?: number | null;
}

export interface FailureInput {
  verdict: string;
  passedCases: number;
  totalCases: number;
  runtimeMs: number | null;
  timeLimitMs: number;
  /** The compiler output or stderr the workbench showed, mapped to the editor's lines. */
  errorDetail: string | null;
  language: string;
  /** The statement's Markdown, for its constraints. */
  description: string;
}

export interface Constraints {
  /** The largest size bound (an array's length, n, m), when the statement gives one. */
  maxSize: number | null;
  /** The largest bound on a value (nums[i], k), when the statement gives one. */
  maxValue: number | null;
}

export interface DeterministicAnalysis {
  category: MistakeClass;
  headline: string;
  findings: Finding[];
  /** What the input sizes allow, from the constraints. */
  complexity: { target: string | null; basis: string | null };
  error: { kind: string | null; line: number | null; message: string | null };
}

// ── Constraints ───────────────────────────────────────────────────

const SUPERSCRIPT: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };

/** "10^5", "10⁵", "2 * 10^5", "2×10^5", "100000", "10**9", "2^31 - 1" → a number. */
export function boundValue(expr: string): number | null {
  const s = expr.replace(/[⁰-⁹]+/g, (m) => "^" + [...m].map((c) => SUPERSCRIPT[c]).join("")).replace(/\*\*/g, "^").replace(/[,_\s]/g, "");
  const m = s.match(/^(\d+(?:\.\d+)?)(?:[*×x·](\d+)\^(\d+)|\^(\d+))?(?:-1)?$/);
  if (!m) return null;
  if (m[2] && m[3]) return Number(m[1]) * Math.pow(Number(m[2]), Number(m[3]));
  if (m[4]) return Math.pow(Number(m[1]), Number(m[4]));
  return Number(m[1]);
}

/** Whether a constrained name is a size (how many) rather than a value (how big). */
const isSize = (name: string): boolean =>
  /length|size|\.len\b|number of|count of/i.test(name) ||
  // "n", "n == nums.length", and a grid's "m, n": single-letter dimensions. "l, w" are values.
  (name.split(/==|=/)[0] ?? "").split(",").every((t) => /^\s*[nmNM]\s*$/.test(t));

/**
 * The statement's bounds, from its "Constraints" list: lines like
 * `1 <= nums.length <= 10^5` (a size) and `-10^9 <= nums[i] <= 10^9` (a
 * value). Lines without a numeric upper bound (`1 <= k <= n`) say nothing.
 */
export function constraintsOf(description: string): Constraints {
  const at = description.search(/#+\s*Constraints|\*\*Constraints\*\*/i);
  if (at < 0) return { maxSize: null, maxValue: null };
  const block = description.slice(at).split(/\n#+\s|\n\*\*Follow/)[0]!;
  let maxSize: number | null = null;
  let maxValue: number | null = null;
  for (const raw of block.split("\n")) {
    const line = raw.replace(/`/g, "").replace(/^\s*[-*]\s*/, "").trim();
    const parts = line.split(/<=|≤|</);
    if (parts.length < 3) continue;
    const name = parts.slice(1, -1).join("<=").trim();
    const bound = boundValue(parts[parts.length - 1]!.trim());
    if (bound == null || !name) continue;
    if (isSize(name)) maxSize = Math.max(maxSize ?? 0, bound);
    else maxValue = Math.max(maxValue ?? 0, bound);
  }
  return { maxSize, maxValue };
}

const pow10 = (n: number): string => {
  const e = Math.log10(n);
  return Number.isInteger(e) ? `10^${e}` : n.toLocaleString("en-US");
};

/** A case count as a reader writes it: 5,003, not 5003. */
const num = (n: number): string => n.toLocaleString("en-US");

/**
 * What a size bound allows inside a time limit of a second or two — the
 * usual competitive-programming rule of thumb (~10^8 simple steps).
 */
export function targetComplexity(maxSize: number | null): string | null {
  if (maxSize == null) return null;
  if (maxSize <= 12) return "O(n!) or O(2^n · n)";
  if (maxSize <= 25) return "O(2^n)";
  if (maxSize <= 500) return "O(n^3)";
  if (maxSize <= 5_000) return "O(n^2)";
  if (maxSize <= 1_000_000) return "O(n log n)";
  if (maxSize <= 100_000_000) return "O(n)";
  return "O(log n) or O(1)";
}

// ── The judge's error output ──────────────────────────────────────


/** Recognised failures, by what they say in any of the judge's languages. First match wins. */
const ERRORS: ReadonlyArray<{ re: RegExp; kind: string; hint: string }> = [
  { re: /RecursionError|StackOverflowError|stack overflow|Maximum call stack size exceeded|stack level too deep/i, kind: "Stack overflow", hint: "Recursion went too deep: the base case may never be reached, or the input needs an iterative version." },
  { re: /IndexError|IndexOutOfBounds|index out of range|out_of_range|RangeError: Index|slice bounds out of range|ArgumentOutOfRange/i, kind: "Index out of range", hint: "An index went past the end of an array or string. Check the loop bounds and what happens with an empty or one-element input." },
  { re: /NullPointerException|NoneType|Cannot read propert(?:y|ies)(?: '[^']*')? of (?:undefined|null)|undefined is not|nil pointer|NullReferenceException|null pointer/i, kind: "Null or missing value", hint: "Something was null, None or undefined where a value was expected: a missing key, an empty structure, or a node that does not exist." },
  { re: /KeyError|NoSuchElement|key not found/i, kind: "Missing key", hint: "A key was read before it was set. Check membership first, or use a lookup with a default." },
  { re: /ZeroDivisionError|ArithmeticException|division by zero|divide by zero|Floating point exception|SIGFPE/i, kind: "Division by zero", hint: "A division or modulo by zero. Guard the case where the divisor can be 0." },
  { re: /Segmentation fault|SIGSEGV|segfault/i, kind: "Segmentation fault", hint: "Memory was read outside its bounds, usually an out-of-range index or a pointer to nothing." },
  { re: /OutOfMemory|MemoryError|out of memory|heap out of memory|std::bad_alloc|Memory Limit/i, kind: "Out of memory", hint: "The program used too much memory: a structure grew far beyond the input's size, or recursion kept too much on the stack." },
  { re: /NumberFormatException|ValueError|invalid literal|ParseInt/i, kind: "Bad conversion", hint: "A value could not be converted (text to number, or the wrong type). Check what the input actually holds." },
  { re: /TypeError|ClassCastException|InvalidCast/i, kind: "Type error", hint: "A value was used as the wrong type. Check what each variable holds at that point." },
  { re: /ReferenceError|NameError|is not defined/i, kind: "Undefined name", hint: "A name was used that was never defined, often a typo or a variable out of scope." },
];

/**
 * The error's kind and its line in the learner's code, when the judge's
 * output names them: the first line a compiler names (the later errors
 * often follow from it), the last a crash names (the innermost frame).
 */
export function readError(detail: string | null, which: "first" | "last" = "last"): { kind: string | null; line: number | null; message: string | null; hint: string | null } {
  if (!detail?.trim()) return { kind: null, line: null, message: null, hint: null };
  const found = ERRORS.find((e) => e.re.test(detail));
  // The last line reference is the innermost frame; the workbench's output
  // is already mapped to the editor's lines (routes/execution remapDiagnostics).
  // The forms lib/driver-codegen remapDiagnostics rewrites: `main.cpp:17:5`
  // (the line, never the column after it), `Main.cs(17,5)`, "line 17".
  const refs = [...detail.matchAll(/\.[a-z]{1,6}[:(](\d{1,5})|\bline (\d{1,5})/gi)].map((m) => Number(m[1] ?? m[2])).filter((n) => n > 0 && n < 100_000);
  const message = detail.split("\n").map((l) => l.trim()).filter(Boolean).find((l) => (found ? found.re.test(l) : true)) ?? null;
  return { kind: found?.kind ?? null, line: refs.length ? (which === "first" ? refs[0]! : refs[refs.length - 1]!) : null, message: message ? message.slice(0, 240) : null, hint: found?.hint ?? null };
}

/** The first line of compiler output that says what is wrong. */
export function firstCompileError(detail: string | null): string | null {
  if (!detail) return null;
  const lines = detail.split("\n").map((l) => l.trim()).filter(Boolean);
  return (lines.find((l) => /error/i.test(l)) ?? lines[0] ?? null)?.slice(0, 240) ?? null;
}

/** Inputs at most this large fit any algorithm in time: a time limit there means something never stops. */
const TINY_INPUT = 25;
/** Below this the constraints' complexity is not worth a line under a wrong answer. */
const COMPLEXITY_MATTERS = 1_000;

/** Languages whose plain integer is 32 bits — where a sum of large values overflows silently. */
const FIXED_INT = new Set(["java", "cpp", "c++", "c", "csharp", "c#", "go", "kotlin", "swift", "rust"]);

// ── The analysis ──────────────────────────────────────────────────

const HEADLINE: Record<MistakeClass, string> = {
  EDGE_CASE: "Most cases pass: likely a missed edge case",
  CONCEPTUAL: "Most cases fail: the approach itself is likely wrong",
  COMPLEXITY: "Too slow for the input sizes",
  IMPLEMENTATION: "The program crashed",
  SYNTAX: "It did not compile",
};

export function analyzeFailure(input: FailureInput): DeterministicAnalysis {
  const outcome = outcomeOf(input.verdict);
  const total = Math.max(0, input.totalCases);
  const passed = Math.min(Math.max(0, input.passedCases), total);
  const passRatio = total ? passed / total : null;
  const category: MistakeClass = mistakeOf({ outcome, passRatio }) ?? "CONCEPTUAL";
  const { maxSize, maxValue } = constraintsOf(input.description);
  const target = targetComplexity(maxSize);
  const basis = maxSize != null ? `n up to ${pow10(maxSize)}` : null;
  const findings: Finding[] = [];
  let error: DeterministicAnalysis["error"] = { kind: null, line: null, message: null };

  if (outcome === "compile") {
    const first = firstCompileError(input.errorDetail);
    const read = readError(input.errorDetail, "first");
    error = { kind: "Compile error", line: read.line, message: first };
    findings.push({ kind: "fact", text: first ? `The compiler stopped at: ${first}` : "The code did not compile.", line: read.line });
    findings.push({ kind: "suggestion", text: "Fix the first error first: the ones after it often follow from it." });
  } else if (outcome === "runtime") {
    const read = readError(input.errorDetail);
    error = { kind: read.kind, line: read.line, message: read.message };
    findings.push({
      kind: "fact",
      text: `It crashed${read.kind ? ` with ${read.kind.toLowerCase()}` : ""}${total ? ` after passing ${num(passed)} of ${num(total)} cases` : ""}.`,
      line: read.line,
    });
    if (read.hint) findings.push({ kind: "inference", text: read.hint, line: read.line });
  } else if (outcome === "timeout") {
    findings.push({
      kind: "fact",
      text: `It ran past the time limit${input.timeLimitMs ? ` of ${input.timeLimitMs} ms` : ""}${total ? ` after passing ${num(passed)} of ${num(total)} cases` : ""}.`,
    });
    findings.push({
      kind: "inference",
      // Inputs this small fit any algorithm, even an exponential one, so
      // running out of time is not a complexity problem: something never
      // stops. Telling a student "needs O(2^n) or better" over an infinite
      // loop (Two Sum, n ≤ 20, 2026-10-07) pointed them the wrong way.
      text:
        maxSize != null && maxSize <= TINY_INPUT
          ? `With ${basis}, even a slow approach finishes in time, so this is most likely a loop that never ends or recursion that never stops.`
          : target
            ? `With ${basis}, the solution needs to be about ${target} or better; the current approach is likely slower than that.`
            : "The approach is likely slower than the input sizes allow: look for repeated work inside a loop.",
    });
  } else {
    findings.push({ kind: "fact", text: total ? `It returned a wrong answer on ${num(total - passed)} of ${num(total)} cases.` : "It returned a wrong answer." });
    if (passRatio === 0) {
      findings.push({ kind: "inference", text: "No case passed: check the examples by hand, and that the function returns the answer in the form the statement asks for." });
    } else if (passRatio != null && passRatio >= NEAR_MISS_RATIO) {
      findings.push({ kind: "inference", text: "Most cases pass, so the idea is probably right and a special case is missed: an empty or one-element input, duplicates, negatives, or the largest values." });
    } else {
      findings.push({ kind: "inference", text: "Most cases fail, so the approach itself is probably not what this problem needs. Re-read the statement and work an example through by hand." });
    }
    if (maxValue != null && maxValue >= 1e9 && FIXED_INT.has(input.language.toLowerCase())) {
      findings.push({ kind: "inference", text: `Values go up to ${pow10(maxValue)}: a sum or product of two can pass 2^31 − 1 and overflow a 32-bit int. A 64-bit type (long) avoids it.` });
    }
  }
  // The bound only matters once inputs are big enough for complexity to
  // decide anything; "O(2^n) fits" under a wrong answer on n ≤ 20 is noise.
  if (target && maxSize != null && maxSize >= COMPLEXITY_MATTERS && outcome !== "timeout" && outcome !== "compile") {
    findings.push({ kind: "inference", text: `The constraints allow ${basis}, so an ${target} solution fits the time limit.` });
  }

  return { category, headline: HEADLINE[category], findings, complexity: { target, basis }, error };
}
