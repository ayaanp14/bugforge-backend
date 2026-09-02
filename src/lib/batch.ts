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

import { gzipSync, gunzipSync } from "zlib";

export const CASE_SENTINEL = "__CODEXA_CASE__";
export const ERROR_MARKER = "__CODEXA_ERROR__:";
export const GZIP_MARKER = "__CODEXA_GZ__";
export const GZIN_MARKER = "__CODEXA_GZIN__";
export const STATS_MARKER = "__CODEXA_STATS__";

/**
 * Drivers self-report "STATS_MARKER <runtimeMs> <peakMemoryKb>" as their last
 * output line (engines like Wandbox report no time/memory of their own).
 * Extracts and strips that line; either value may be 0 when unmeasurable.
 */
export function extractBatchStats(stdout: string | null): {
  stdout: string | null;
  runtimeMs: number | null;
  memoryKb: number | null;
} {
  if (!stdout) return { stdout, runtimeMs: null, memoryKb: null };
  const re = new RegExp(`^${STATS_MARKER} (\\d+) (\\d+)\\s*$`, "m");
  const m = stdout.match(re);
  if (!m) return { stdout, runtimeMs: null, memoryKb: null };
  return {
    stdout: stdout.replace(re, ""),
    runtimeMs: parseInt(m[1], 10),
    memoryKb: parseInt(m[2], 10),
  };
}

/**
 * Languages whose drivers/harnesses gzip large outputs (stdlib gzip exists).
 * Their suites never need output-size chunking — compressed answers always
 * fit the engine's stdout cap. c/cpp/rust/swift stay plain (no stdlib gzip).
 */
export const GZIP_OUTPUT_LANGS = new Set([
  // php excluded: Judge0's PHP build lacks the zlib extension (no gzencode);
  // its driver still compresses opportunistically where zlib exists.
  "javascript", "typescript", "python", "java", "kotlin", "csharp", "go", "ruby",
]);

/** If stdout is GZIP_MARKER + base64(gzip(...)), decode it; else return as-is. */
export function decodeBatchStdout(stdout: string | null): string | null {
  if (!stdout) return stdout;
  const trimmed = stdout.trimStart();
  if (!trimmed.startsWith(GZIP_MARKER)) return stdout;
  const b64 = trimmed.slice(GZIP_MARKER.length).replace(/\s+/g, "");
  try {
    return gunzipSync(Buffer.from(b64, "base64")).toString("utf8");
  } catch {
    // Truncated/corrupt compressed payload: fall through to raw so the
    // missing-chunk handling reports it honestly.
    return stdout;
  }
}

/** Join raw per-case inputs into the single batch stdin. */
export function buildBatchStdin(inputs: string[]): string {
  return inputs.map((i) => i.replace(/\s+$/, "")).join(`\n${CASE_SENTINEL}\n`) + "\n";
}

/**
 * Compress large stdin for languages whose drivers can decompress it
 * (GZIN_MARKER line + base64(gzip)); big uploads shrink ~70x, which is most
 * of the remaining wall time on remote engines.
 */
export function encodeBatchStdin(stdin: string, language: string): string {
  if (!GZIP_OUTPUT_LANGS.has(language) || stdin.length <= 65536) return stdin;
  return `${GZIN_MARKER}\n${gzipSync(Buffer.from(stdin)).toString("base64")}\n`;
}

/** Split a batch run's stdout back into per-case output chunks. */
export function splitBatchStdout(stdout: string | null): string[] {
  if (!stdout) return [];
  const parts = stdout.split(CASE_SENTINEL).map((p) => p.trim());
  // The driver prints a sentinel after every case, so the final piece is empty.
  if (parts.length > 0 && parts[parts.length - 1] === "") parts.pop();
  return parts;
}
