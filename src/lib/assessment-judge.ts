/**
 * Judging a coding answer inside a timed assessment — a placement test
 * (routes/mock-tests.ts) or a skill test (routes/skill-tests.ts).
 *
 * The same problem judge the practice workbench uses (driver + batch), with
 * the bounds every execution route applies. Lifted out of the placement
 * route when the skill tests arrived, so the two cannot drift: a bound
 * added to one and forgotten in the other is exactly how the placement
 * routes went without the code cap and the limiter until 2026-09-30.
 */
import { runBatch } from "./batch-judge.js";
import { containsReservedMarker } from "./batch.js";
import { buildDriver, remapDiagnostics, type Language as DriverLanguage, type Signature } from "./driver-codegen.js";
import { getJudgeProblem, getJudgeSuite, type JudgeProblem } from "./test-suite-cache.js";

/**
 * What one Run or Submit may hand the engine, the same bounds /api/run and
 * /api/submit apply. A sitting's Submit runs the whole ~5,000-case suite,
 * and without these one account could send hundreds a minute into the
 * single paced queue every judge on the site shares (lib/paiza.ts), 512 KB
 * of source apiece.
 */
export const MAX_CODE_CHARS = 65_536;

/** The refusal for code the judge will not take, or null for code it will. */
export function codeProblem(code: unknown): string | null {
  if (typeof code !== "string" || code.length > MAX_CODE_CHARS) return "Code must be a string of at most 64 KB";
  if (containsReservedMarker(code)) return "Code must not contain the reserved marker __CODEXA_";
  return null;
}

/**
 * The problem as the judge sees it — limits and signature — with its suite,
 * both from the in-process cache (lib/test-suite-cache.ts). Callers fetch it
 * alongside the sitting rather than after it: neither depends on the other.
 */
export async function judgeArena(problemId: string) {
  if (!problemId) return null;
  const [problem, cases] = await Promise.all([getJudgeProblem(problemId), getJudgeSuite(problemId)]);
  return problem ? { problem, cases } : null;
}

/** Compiles and runs one submission against the given cases, in one batch. */
export async function judgeCode(problem: JudgeProblem, code: string, language: string, cases: Array<{ input: string; expectedOutput: string }>) {
  const driver = problem.signature ? buildDriver(language as DriverLanguage, problem.signature as Signature, code) : null;
  const batch = await runBatch(
    driver ? driver.code : code,
    language,
    cases.map((c) => ({ input: c.input, expectedOutput: c.expectedOutput })),
    { timeLimitMs: problem.timeLimitMs, memoryLimitMb: problem.memoryLimitMb }
  );
  const passed = batch.perCase.filter((r) => r.passed).length;
  const firstFailure = batch.perCase.find((r) => !r.passed);
  return {
    batch,
    passed,
    verdict: firstFailure ? firstFailure.verdict : "ACCEPTED",
    error: firstFailure
      ? remapDiagnostics((firstFailure.compile_output || firstFailure.stderr || "").trim() || null, driver ? driver.toEditorLine : null)
      : null,
  };
}
