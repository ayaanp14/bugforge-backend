/**
 * The online compiler's starter programs, run on the real engine — the gate
 * before a change to them ships.
 *
 *   npx tsx scripts/compiler-starters.ts [--only python,java]
 *
 * The starters live in the SPA (frontend/src/content/compilers.ts): each is
 * the program a visitor's editor opens with on /compiler/<id>, and it must
 * compile, read the sample input and greet it. Each one is sent through the
 * same path a Run takes (lib/program-judge runProgram, STUDY_EXECUTOR —
 * Paiza by default) with the sample input, and must exit cleanly with
 * "Hello, <sample>!" as its first line. Exits 1 if any does not.
 *
 * The file is read at run time through a computed path, so the backend's
 * typecheck never follows it into the frontend's sources.
 */
import "dotenv/config";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { runProgram } from "../src/lib/program-judge.js";

interface Starter {
  id: string;
  name: string;
  starter: string;
}

const here = path.dirname(fileURLToPath(import.meta.url));
const contentUrl = pathToFileURL(path.resolve(here, "../../frontend/src/content/compilers.ts")).href;
const { COMPILERS, SAMPLE_INPUT } = (await import(contentUrl)) as { COMPILERS: Starter[]; SAMPLE_INPUT: string };

const onlyArg = process.argv.indexOf("--only");
const only = onlyArg >= 0 ? new Set((process.argv[onlyArg + 1] ?? "").split(",").filter(Boolean)) : null;
const expected = `Hello, ${SAMPLE_INPUT}!`;

let failed = 0;
for (const c of COMPILERS) {
  if (only && !only.has(c.id)) continue;
  const result = await runProgram(c.starter, c.id, `${SAMPLE_INPUT}\n`);
  const first = result.stdout.split("\n")[0]?.trim();
  const ok = result.status === "ACCEPTED" && first === expected;
  if (!ok) failed += 1;
  console.log(`${ok ? "ok  " : "FAIL"} ${c.name.padEnd(11)} ${result.status.padEnd(20)} ${result.timeMs} ms  ${JSON.stringify(result.stdout.trim())}`);
  if (!ok && (result.compileOutput || result.stderr)) console.log(`     ${(result.compileOutput ?? result.stderr ?? "").trim().split("\n").slice(0, 6).join("\n     ")}`);
}
console.log(failed ? `\n${failed} starter(s) failed.` : "\nEvery starter ran and greeted the sample input.");
process.exit(failed ? 1 : 0);
