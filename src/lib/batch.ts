/**
 * Batch execution protocol: N test cases run in ONE program execution.
 *
 * stdin:  case inputs joined with a CASE_SENTINEL line between them.
 * stdout: each case's result followed by a CASE_SENTINEL line; a case that
 *         throws prints ERROR_MARKER + message as its output instead.
 *
 * The sentinel/marker strings must never occur in problem inputs or outputs.
 * Kept in sync with the generated drivers (scripts/problem-codegen.ts) and
 * the wrapCode harnesses (src/lib/judge0.ts).
 */

export const CASE_SENTINEL = "__CODEXA_CASE__";
export const ERROR_MARKER = "__CODEXA_ERROR__:";

/** Join raw per-case inputs into the single batch stdin. */
export function buildBatchStdin(inputs: string[]): string {
  return inputs.map((i) => i.replace(/\s+$/, "")).join(`\n${CASE_SENTINEL}\n`) + "\n";
}

/** Split a batch run's stdout back into per-case output chunks. */
export function splitBatchStdout(stdout: string | null): string[] {
  if (!stdout) return [];
  const parts = stdout.split(CASE_SENTINEL).map((p) => p.trim());
  // The driver prints a sentinel after every case, so the final piece is empty.
  if (parts.length > 0 && parts[parts.length - 1] === "") parts.pop();
  return parts;
}
