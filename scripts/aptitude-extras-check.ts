/**
 * The gate for the aptitude bank's shortcuts and traps (aptitude-data/
 * extras/*.json, merged by aptitude-data/extras.ts).
 *
 *   npx tsx scripts/aptitude-extras-check.ts                         # every extras file, and coverage of the bank
 *   npx tsx scripts/aptitude-extras-check.ts --source bank-ages.ts   # coverage of one question file (repeatable)
 *
 * Errors (exit 1): an extras slug the bank does not have, a missing or empty
 * shortcut or trap, one over EXTRA_MAX_CHARS, a judge sentinel, and a trap
 * that names only the correct option. Warnings: a trap that quotes none of
 * the question's wrong options (it should name the one a hurried candidate
 * picks), and questions in the chosen source files with no extras yet.
 */
import fs from "node:fs";
import { EXTRA_MAX_CHARS, type AptitudeSeed } from "./aptitude-data/types.js";
import { loadExtras } from "./aptitude-data/extras.js";

const args = process.argv.slice(2);
const sources = args.flatMap((a, i) => (args[i - 1] === "--source" ? [a] : []));
const DATA = new URL("./aptitude-data/", import.meta.url);

/** Every question array a data file exports. */
async function questionsIn(file: string): Promise<AptitudeSeed[]> {
  const mod = (await import(new URL(file, DATA).href)) as Record<string, unknown>;
  return Object.values(mod).filter((v): v is AptitudeSeed[] => Array.isArray(v) && v.length > 0 && typeof (v[0] as AptitudeSeed).slug === "string").flat();
}

const files = fs.readdirSync(DATA).filter((n) => n.endsWith(".ts") && !["index.ts", "types.ts", "extras.ts"].includes(n));
const bySlug = new Map<string, AptitudeSeed>();
const fileOf = new Map<string, string>();
for (const f of files) for (const q of await questionsIn(f)) {
  bySlug.set(q.slug, q);
  fileOf.set(q.slug, f);
}

const plain = (s: string) => s.replace(/[*_`$\\]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
const errors: string[] = [];
const warnings: string[] = [];
const extras = loadExtras((name, err) => errors.push(`extras/${name}: not valid JSON — ${String(err).slice(0, 160)}`));

for (const [slug, x] of extras) {
  const q = bySlug.get(slug);
  if (!q) {
    errors.push(`${slug}: no such question`);
    continue;
  }
  for (const [field, value] of [["shortcut", x.shortcut], ["trap", x.trap]] as const) {
    if (typeof value !== "string" || !value.trim()) errors.push(`${slug}: empty ${field}`);
    else if (value.length > EXTRA_MAX_CHARS) errors.push(`${slug}: ${field} is ${value.length} characters (max ${EXTRA_MAX_CHARS})`);
    else if (value.includes("__CODEKAIRO_")) errors.push(`${slug}: ${field} contains a judge sentinel`);
  }
  if (typeof x.trap !== "string") continue;
  const trap = plain(x.trap);
  // An option is "quoted" when its text appears in the trap; short numbers must stand alone, not inside a longer one.
  const quotes = (option: string) => {
    const o = plain(option);
    if (!o) return false;
    if (/^[\d.,/%−-]+$/.test(o)) return new RegExp(`(^|[^\\d.])${o.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}([^\\d]|$)`).test(trap);
    return trap.includes(o);
  };
  const wrong = q.options.filter((_, i) => i !== q.answer);
  const namesWrong = wrong.some(quotes);
  if (!namesWrong && quotes(q.options[q.answer])) errors.push(`${slug}: trap names the correct option (${q.options[q.answer]}) and no wrong one`);
  else if (!namesWrong) warnings.push(`${slug}: trap quotes none of the wrong options (${wrong.join(" | ")})`);
}

const wanted = sources.length ? sources : files;
for (const f of wanted) {
  if (!files.includes(f)) {
    errors.push(`--source ${f}: no such data file`);
    continue;
  }
  const missing = [...fileOf.entries()].filter(([slug, file]) => file === f && !extras.has(slug)).map(([slug]) => slug);
  if (missing.length) (sources.length ? errors : warnings).push(`${f}: ${missing.length} question(s) without extras — ${missing.slice(0, 8).join(", ")}${missing.length > 8 ? " …" : ""}`);
}

for (const w of warnings) console.log(`warn  ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);
console.log(`\n${extras.size} of ${bySlug.size} questions have extras; ${errors.length} error(s), ${warnings.length} warning(s).`);
process.exitCode = errors.length ? 1 : 0;
