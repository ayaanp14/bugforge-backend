/**
 * Offline gate for the hand-authored catalog (scripts/catalog/*).
 *
 *   npx tsx scripts/catalog-selfcheck.ts [--only slug,slug] [--tag Amazon] [--count 300]
 *
 * Runs each problem's JavaScript solution in-process against its examples and
 * `--count` freshly generated cases, reproducing the judge's own contract:
 * the parseArgs + result-formatting rules from wrapCode() in src/lib/judge0.ts.
 * That catches the failure the remote validator is slowest to find — a `gen()`
 * reference implementation and an authored solution that disagree — in
 * milliseconds instead of a round trip per problem.
 *
 * It also lints the JavaScript for syntax the judge's Node 12 runtime rejects
 * (??, ?., .at(), replaceAll, flat) and checks that every seeded input parses
 * to exactly the arity the signature declares.
 */

import { spawnSync } from "node:child_process";
import { CATALOG } from "./catalog/index.js";
import { makeRng, type CatalogProblem } from "./catalog/types.js";
import { applyDriver } from "../src/lib/driver-codegen.js";
import { isStructured, type StructSignature } from "../src/lib/driver-structures.js";
import { buildBatchStdin, decodeBatchStdout, isolateDriverOutput, splitBatchStdout } from "../src/lib/batch.js";

const args = process.argv.slice(2);
const opt = (n: string) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
};
const COUNT = parseInt(opt("count") ?? "300", 10);
const ONLY = opt("only")?.split(",").map((s) => s.trim());
const TAG = opt("tag");

/** wrapCode's parser, verbatim in behaviour: "k=v" pairs, one JSON value per line, or a bare value. */
function parseArgs(rawInput: string): unknown[] {
  const varRegex = /([a-zA-Z_]\w*)\s*=/g;
  const matches: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  while ((match = varRegex.exec(rawInput)) !== null) matches.push(match);

  if (matches.length === 0) {
    try { return [JSON.parse(rawInput)]; } catch { /* fall through to line mode */ }
    return rawInput.split(/\r?\n/).filter((l) => l.trim() !== "").map((l) => {
      try { return JSON.parse(l); } catch { return l; }
    });
  }
  const out: unknown[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : rawInput.length;
    let raw = rawInput.substring(start, end).trim();
    if (raw.endsWith(",")) raw = raw.slice(0, -1).trim();
    try { out.push(JSON.parse(raw)); } catch { out.push(raw); }
  }
  return out;
}

/** wrapCode's printer: strings raw, everything else JSON. */
function formatResult(result: unknown): string {
  if (typeof result === "string") return result;
  if (typeof result === "bigint") return result.toString();
  return JSON.stringify(result);
}

/** Syntax the judge's Node 12 runtime cannot parse or does not have. */
const NODE12_BANNED: Array<[RegExp, string]> = [
  [/\?\?/, "?? (nullish coalescing)"],
  [/\?\./, "?. (optional chaining)"],
  [/\.at\s*\(/, ".at()"],
  [/\.replaceAll\s*\(/, ".replaceAll()"],
  [/\.flatMap\s*\(/, ".flatMap()"],
  [/\bObject\.fromEntries\s*\(/, "Object.fromEntries()"],
  [/\bstructuredClone\s*\(/, "structuredClone()"],
  [/\.flat\s*\(/, ".flat()"],
];

/**
 * Parameter names that are keywords in at least one of the thirteen target
 * languages. `renderStub` puts the signature's names straight into every
 * starter file, so a name from this list produces starter code that does not
 * compile — LeetCode's own `val` breaks Kotlin exactly this way.
 */
const RESERVED_PARAM_NAMES = new Set([
  "val", "var", "let", "const", "fun", "func", "def", "class", "new", "this", "self", "super",
  "in", "is", "as", "object", "type", "out", "ref", "params", "base", "lock", "using",
  "namespace", "package", "import", "public", "private", "protected", "interface", "extends",
  "implements", "throw", "throws", "try", "catch", "finally", "return", "if", "else", "for",
  "while", "switch", "case", "default", "break", "continue", "goto", "struct", "union", "enum",
  "static", "do", "end", "then", "when", "where", "with", "lambda", "pass", "yield", "del",
  "global", "raise", "except", "elif", "not", "and", "or", "nil", "none", "null", "true",
  "false", "bool", "int", "char", "float", "double", "long", "short", "void", "string", "str",
  "list", "dict", "set", "map", "range", "next", "print", "echo", "unset", "isset", "array",
  "foreach", "function", "module", "begin", "ensure", "redo", "retry", "undef", "unless",
  "until", "alias", "defer", "chan", "go", "select", "fallthrough", "impl", "trait", "match",
  "mut", "move", "unsafe", "crate", "mod", "use", "pub", "dyn", "box", "async", "await",
  "operator", "template", "typename", "friend", "virtual", "inline", "sizeof", "typedef",
  "extern", "auto", "register", "volatile", "signed", "unsigned",
]);

function compile(spec: CatalogProblem): (...a: unknown[]) => unknown {
  const code = spec.solutions.javascript;
  // eslint-disable-next-line no-new-func -- the catalog is first-party source, not user input.
  return new Function(`${code}\nreturn ${spec.signature.funcName};`)() as (...a: unknown[]) => unknown;
}

interface Failure { slug: string; detail: string }

function checkOne(spec: CatalogProblem, failures: Failure[]): boolean {
  for (const p of spec.signature.params) {
    if (RESERVED_PARAM_NAMES.has(p.name.toLowerCase())) {
      failures.push({ slug: spec.slug, detail: `parameter "${p.name}" is a keyword in at least one target language — the generated starter code will not compile` });
      return false;
    }
  }
  // The judge's Rust is 1.40: `i32::MAX` (associated constants, Rust 1.43) does
  // not compile there, while `std::i32::MAX` works on every version — 23
  // wave-7 problems failed on exactly this.
  const rust = (spec.solutions as Record<string, string | undefined>).rust ?? "";
  const newConst = rust.match(/(?<![\w:])(?:i8|i16|i32|i64|i128|isize|u8|u16|u32|u64|u128|usize|f32|f64)::(?:MAX|MIN)\b/);
  if (newConst) {
    failures.push({ slug: spec.slug, detail: `rust uses ${newConst[0]}, which the judge's Rust 1.40 rejects — write std::${newConst[0]}` });
    return false;
  }
  for (const [re, label] of NODE12_BANNED) {
    if (re.test(spec.solutions.javascript)) {
      failures.push({ slug: spec.slug, detail: `javascript uses ${label}, which the Node 12 judge rejects` });
      return false;
    }
  }
  if (isStructured(spec.signature as unknown as StructSignature)) return checkStructured(spec, failures);
  // wrapCode (src/lib/judge0.ts) calls the FIRST top-level function it finds,
  // so a helper written above the entry point gets the test arguments — the
  // judge then fails every case ("_good() takes 3 positional arguments but 4
  // were given", wave 7). Mirror its regexes here.
  const pyFirst = spec.solutions.python.match(/^def\s+([a-zA-Z0-9_]+)\s*\(/m)?.[1];
  const jsFirst = (spec.solutions.javascript.match(/^(?:var|let|const)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?(?:function\s*\(|(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>)/m)
    ?? spec.solutions.javascript.match(/^(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(/m))?.[1];
  for (const [lang, first] of [["python", pyFirst], ["javascript", jsFirst]] as const) {
    if (first && first !== spec.signature.funcName) {
      failures.push({ slug: spec.slug, detail: `${lang}: the judge calls the first top-level function, ${first}, not ${spec.signature.funcName} — put the entry point first` });
      return false;
    }
  }
  let fn: (...a: unknown[]) => unknown;
  try {
    fn = compile(spec);
  } catch (e) {
    failures.push({ slug: spec.slug, detail: `javascript failed to compile: ${(e as Error).message}` });
    return false;
  }
  if (typeof fn !== "function") {
    failures.push({ slug: spec.slug, detail: `javascript defines no function named ${spec.signature.funcName}` });
    return false;
  }

  const arity = spec.signature.params.length;
  const run = (input: string, want: string, label: string): boolean => {
    const parsed = parseArgs(input);
    if (parsed.length !== arity) {
      failures.push({ slug: spec.slug, detail: `${label}: input parses to ${parsed.length} args, signature declares ${arity} — in=${input.slice(0, 80)}` });
      return false;
    }
    let got: string;
    try {
      got = formatResult(fn(...parsed.map((v) => (Array.isArray(v) ? JSON.parse(JSON.stringify(v)) : v))));
    } catch (e) {
      failures.push({ slug: spec.slug, detail: `${label}: threw ${(e as Error).message} — in=${input.slice(0, 80)}` });
      return false;
    }
    if (got !== want) {
      failures.push({ slug: spec.slug, detail: `${label}: in=${input.slice(0, 100)} want=${want.slice(0, 60)} got=${got.slice(0, 60)}` });
      return false;
    }
    return true;
  };

  if (spec.examples.length === 0) {
    failures.push({ slug: spec.slug, detail: "no visible examples" });
    return false;
  }
  for (let i = 0; i < spec.examples.length; i++) {
    if (!run(spec.examples[i].input, spec.examples[i].expectedOutput, `example ${i + 1}`)) return false;
  }
  // The seeder's RNG is seeded from the slug, so these are the very cases the
  // database will hold — a pass here is a pass on the real suite's prefix.
  const rng = makeRng(spec.slug);
  for (let i = 0; i < Math.min(COUNT, spec.hiddenCount ?? COUNT); i++) {
    const c = spec.gen(rng);
    if (!run(c.input, c.expectedOutput, `hidden ${i + 1}`)) return false;
  }
  return true;
}

/**
 * Trees, lists and design classes cannot go through the parseArgs mimic above —
 * turning `[1,null,2]` into nodes needs the signature — so their JavaScript
 * runs under the real generated driver (lib/driver-structures.ts) in one
 * `node` process over the very batch stdin the judge would get.
 */
function checkStructured(spec: CatalogProblem, failures: Failure[]): boolean {
  const sig = spec.signature;
  for (const m of sig.methods ?? []) {
    for (const p of m.params) {
      if (RESERVED_PARAM_NAMES.has(p.name.toLowerCase())) {
        failures.push({ slug: spec.slug, detail: `${m.name}: parameter "${p.name}" is a keyword in at least one target language` });
        return false;
      }
    }
  }
  if (spec.examples.length === 0) {
    failures.push({ slug: spec.slug, detail: "no visible examples" });
    return false;
  }
  const cases = [...spec.examples];
  const rng = makeRng(spec.slug);
  for (let i = 0; i < Math.min(COUNT, spec.hiddenCount ?? COUNT); i++) cases.push(spec.gen(rng));
  const arity = sig.methods ? 2 : sig.params.length;
  for (const [i, c] of cases.entries()) {
    const lines = c.input.split(/\r?\n/).filter((l) => l.trim() !== "");
    if (lines.length !== arity) {
      failures.push({ slug: spec.slug, detail: `case ${i + 1}: ${lines.length} input lines, the signature reads ${arity} — in=${c.input.slice(0, 80)}` });
      return false;
    }
  }
  let program: string;
  try {
    program = applyDriver("javascript", sig, spec.solutions.javascript);
  } catch (e) {
    failures.push({ slug: spec.slug, detail: `signature refused: ${(e as Error).message}` });
    return false;
  }
  const r = spawnSync(process.execPath, ["-e", program], { input: buildBatchStdin(cases.map((c) => c.input)), encoding: "utf8", maxBuffer: 1 << 28 });
  if (r.status !== 0) {
    failures.push({ slug: spec.slug, detail: `javascript exited ${r.status}: ${(r.stderr || "").slice(0, 300)}` });
    return false;
  }
  const outputs = splitBatchStdout(decodeBatchStdout(isolateDriverOutput(r.stdout).driver));
  for (let i = 0; i < cases.length; i++) {
    const got = (outputs[i] ?? "").trim();
    const label = i < spec.examples.length ? `example ${i + 1}` : `hidden ${i + 1 - spec.examples.length}`;
    if (got !== cases[i].expectedOutput.trim()) {
      failures.push({ slug: spec.slug, detail: `${label}: in=${cases[i].input.replace(/\n/g, " | ").slice(0, 100)} want=${cases[i].expectedOutput.slice(0, 60)} got=${got.slice(0, 80)}` });
      return false;
    }
  }
  return true;
}

const seen = new Set<string>();
const dupes: string[] = [];
for (const p of CATALOG) {
  if (seen.has(p.slug)) dupes.push(p.slug);
  seen.add(p.slug);
}
if (dupes.length) {
  console.log(`DUPLICATE SLUGS: ${dupes.join(", ")}`);
  process.exitCode = 1;
}

const list = CATALOG.filter((p) =>
  (!ONLY || ONLY.includes(p.slug)) && (!TAG || p.tags.includes(TAG)));

const failures: Failure[] = [];
let pass = 0;
const t0 = Date.now();
for (const spec of list) {
  if (checkOne(spec, failures)) pass++;
}
for (const f of failures) console.log(`FAIL ${f.slug} — ${f.detail}`);
console.log(`\n== ${pass}/${list.length} problems clean (${COUNT} generated cases each, ${Date.now() - t0}ms)`);
if (failures.length) process.exitCode = 1;
