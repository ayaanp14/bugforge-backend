/**
 * Seed + validate every problem in one catalog file, in all 13 languages.
 *
 *   node scripts/check-file.mjs scripts/catalog/arrays3.ts [caseCount]
 *
 * Authoring loop helper: seeds a small hidden-case suite (default 120) so a
 * whole file validates in minutes rather than hours, then runs the authored
 * solutions for every language through the real judge path. Prints only the
 * failures plus a tally — the full 5000-case seed happens once at the end.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const file = process.argv[2];
const count = process.argv[3] ?? "120";
if (!file) throw new Error("usage: node scripts/check-file.mjs <catalog file> [caseCount]");

const slugs = [...readFileSync(file, "utf8").matchAll(/slug: "([^"]+)"/g)].map((m) => m[1]);
if (slugs.length === 0) throw new Error(`no slugs found in ${file}`);
console.log(`${file}: ${slugs.length} problems`);

const run = (args) =>
  spawnSync("npx", ["tsx", "scripts/seed-catalog.ts", ...args], { encoding: "utf8", shell: true, maxBuffer: 1 << 28 });

const only = slugs.join(",");
const seeded = run(["--seed", "--count", count, "--only", only]);
if (seeded.status !== 0) {
  console.log(seeded.stdout?.slice(-3000));
  console.log(seeded.stderr?.slice(-3000));
  process.exit(1);
}

const res = run(["--validate", "--lang", "all", "--only", only]);
const lines = (res.stdout ?? "").split("\n");
const fails = lines.filter((l) => l.startsWith("FAIL") || l.startsWith("SKIP"));
const tally = lines.filter((l) => l.startsWith("=="));
for (const f of fails) console.log(f);
console.log(tally.join("\n") || res.stderr?.slice(-2000));
process.exit(fails.length ? 1 : 0);
