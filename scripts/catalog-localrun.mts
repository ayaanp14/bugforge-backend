/**
 * Local gate for one catalog file, before the remote validator.
 *
 *   npx tsx scripts/catalog-localrun.mts --file arrays6 [--only slug,slug] [--lang typescript,java,rust|none] [--count 5000]
 *
 * Imports only `scripts/catalog/<file>.ts` (the whole catalogue is ~10 MB of
 * source and costs a few hundred MB to load), then for every problem:
 *
 *  1. Lints the entry: all thirteen solutions present, parameter names that
 *     compile in every language, Node 12-safe JavaScript, tags drawn from the
 *     catalogue's existing vocabulary (a new topic tag makes a hub page with no
 *     blurb or walkthrough), no `=` in an input (parseArgs reads `<ident>=` as a
 *     named argument), no `__CODEXA_` anywhere, int32-safe outputs.
 *  2. Generates the very suite the seeder writes (examples + `--count` cases
 *     from the slug-seeded RNG) and checks it fits the batch caps.
 *  3. Runs the JavaScript solution in-process against every case, with the
 *     wrapCode parse/print contract (as catalog-selfcheck does).
 *  4. Compiles the real `applyDriver` output for TypeScript (ES5 lib, the
 *     judge's TS 3.7 has nothing newer), Java (`--release 13`, the judge's JDK)
 *     and Rust (edition 2018, plus a lint for APIs newer than the judge's 1.40)
 *     and runs it locally over the same batch stdin the judge would get,
 *     comparing each case exactly as batch-judge does (trimmed equality).
 *
 * Python, C, C++, C#, Go, Kotlin, Swift, PHP and Ruby have no toolchain here;
 * `seed-catalog.ts --validate --lang all` stays the authoritative gate for all
 * thirteen. This makes the common failures cost seconds instead of a round trip.
 *
 * Several authors may run this at once, so compile+run is serialised through a
 * lock directory in the OS temp dir (three slots): javac and rustc are the
 * memory-hungry part and the box also hosts MySQL and Judge0.
 */

import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";
import ts from "typescript";
import { ALL_LANGUAGES, applyDriver, type Language } from "../src/lib/driver-codegen.js";
import { buildBatchStdin, decodeBatchStdout, encodeBatchStdin, isolateDriverOutput, splitBatchStdout } from "../src/lib/batch.js";
import { makeRng, type Case, type CatalogProblem } from "./catalog/types.js";

const args = process.argv.slice(2);
const opt = (n: string) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
};
const FILE = opt("file");
if (!FILE) {
  console.log("usage: tsx scripts/catalog-localrun.mts --file <catalog file without .ts> [--only slug,slug] [--lang typescript,java,rust|none] [--count 5000]");
  process.exit(2);
}
const ONLY = opt("only")?.split(",").map((s) => s.trim()).filter(Boolean) ?? null;
const COUNT = parseInt(opt("count") ?? "5000", 10);
const LANG_ARG = opt("lang") ?? "typescript,java,rust";
const LANGS = (LANG_ARG === "none" ? [] : LANG_ARG.split(",").map((s) => s.trim())) as Language[];

// ── Vocabulary ─────────────────────────────────────────────────────
/** Topic tags already in the catalogue — each has (or shares) a hub page. */
const TOPIC_TAGS = new Set([
  "Array", "String", "Math", "Hash Table", "Dynamic Programming", "Greedy", "Sorting", "Two Pointers",
  "Matrix", "Binary Search", "Simulation", "Bit Manipulation", "Sliding Window", "Counting",
  "Breadth-First Search", "Prefix Sum", "Stack", "Graph", "Depth-First Search", "Union Find",
  "Heap (Priority Queue)", "Number Theory", "Monotonic Stack", "Backtracking", "Divide and Conquer",
  "Enumeration", "Combinatorics", "Queue", "Game Theory", "Topological Sort", "Intervals", "Recursion",
  "Brainteaser", "Counting Sort", "Shortest Path", "Geometry", "Bitmask", "Trie", "Memoization", "Tree",
  "Monotonic Queue", "Binary Indexed Tree", "Rolling Hash", "Ordered Set", "String Matching",
  "Quickselect", "Segment Tree", "Merge Sort", "KMP", "Bucket Sort", "Biconnected Component",
  "Suffix Array", "Sieve of Eratosthenes", "Minimum Spanning Tree", "Digit DP",
]);
/** Mirrors backend/src/lib/companies.ts COMPANY_TAGS — a company outside it is filed as a topic. */
const COMPANY_TAGS = new Set([
  "Amazon", "Google", "Adobe", "Microsoft", "Meta", "Apple", "Bloomberg", "Uber", "Airbnb", "LinkedIn",
  "Goldman Sachs", "Palantir", "Two Sigma", "Twitter", "Snapchat", "Dropbox", "Walmart", "Yahoo", "Hulu",
  "Indeed", "Yelp", "LiveRamp", "Capital One", "Epic Systems", "Riot Games", "Mathworks", "Flipkart", "TCS",
  "Infosys", "Wipro", "Capgemini", "Cognizant", "Accenture", "Zoho", "HCL", "Tech Mahindra", "Mphasis",
  "Virtusa", "Mindtree", "Oracle", "Salesforce", "Samsung", "Atlassian", "Rubrik", "Intuit", "Arcesium",
  "Databricks", "Morgan Stanley", "Nutanix", "Sprinklr", "Spotify", "Paytm", "Swiggy", "Cred", "Zomato",
  "Directi", "Ola", "Razorpay", "Freshworks", "Myntra", "Dream11", "Hotstar", "PhonePe",
]);

/** Identifiers that are keywords in at least one target language (catalog-selfcheck's list). */
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

const NODE12_BANNED: Array<[RegExp, string]> = [
  [/\?\?/, "?? (nullish coalescing)"],
  [/\?\./, "?. (optional chaining)"],
  [/\.at\s*\(/, ".at()"],
  [/\.replaceAll\s*\(/, ".replaceAll()"],
  [/\.flatMap\s*\(/, ".flatMap()"],
  [/\bObject\.fromEntries\s*\(/, "Object.fromEntries()"],
  [/\bstructuredClone\s*\(/, "structuredClone()"],
  [/\.flat\s*\(/, ".flat()"],
  [/\.findLast(Index)?\s*\(/, ".findLast()"],
  [/\.toSorted\s*\(|\.toReversed\s*\(/, ".toSorted()/.toReversed()"],
  [/#[a-zA-Z_]\w*\s*[=;(]/, "private class fields"],
  [/\b\d+n\b/, "BigInt literal"],
];

/** Rust APIs and syntax the judge's rustc 1.40 does not have. */
const RUST_TOO_NEW: Array<[RegExp, string]> = [
  [/(?<!::)\b(i8|i16|i32|i64|i128|isize|u8|u16|u32|u64|u128|usize)::(MAX|MIN|BITS)\b/, "associated consts like i32::MAX (1.43) — write std::i32::MAX"],
  [/\bmatches!\s*\(/, "matches! (1.42)"],
  [/\.abs_diff\s*\(/, "abs_diff (1.60)"],
  [/\.div_ceil\s*\(/, "div_ceil (1.73)"],
  [/\.ilog2\s*\(|\.ilog10\s*\(|\.isqrt\s*\(/, "ilog/isqrt (1.67+)"],
  [/\.then_some\s*\(/, "bool::then_some (1.62)"],
  [/\.then\s*\(\s*\|/, "bool::then (1.50)"],
  [/\.clamp\s*\(/, "clamp (1.50)"],
  [/\.fill\s*\(/, "slice::fill (1.50)"],
  [/\.unsigned_abs\s*\(/, "unsigned_abs (1.51)"],
  [/\.split_once\s*\(|\.rsplit_once\s*\(/, "split_once (1.52)"],
  [/\.partition_point\s*\(/, "partition_point (1.52)"],
  [/\.select_nth_unstable/, "select_nth_unstable (1.49)"],
  [/\.strip_prefix\s*\(|\.strip_suffix\s*\(/, "strip_prefix/strip_suffix (1.45)"],
  [/\.is_some_and\s*\(|\.is_ok_and\s*\(/, "is_some_and (1.70)"],
  [/\.first_key_value\s*\(|\.last_key_value\s*\(|\.pop_first\s*\(|\.pop_last\s*\(/, "BTreeMap first/last (1.66)"],
  [/\b(HashMap|HashSet|BTreeMap|BTreeSet|VecDeque|BinaryHeap)::from\s*\(\s*\[/, "Collection::from([..]) (1.56)"],
  [/std::iter::zip\s*\(/, "std::iter::zip (1.59)"],
  [/\.retain_mut\s*\(/, "retain_mut (1.61)"],
  [/\.make_contiguous\s*\(/, "make_contiguous (1.48)"],
  [/format!\s*\(\s*"[^"]*\{[a-z_][a-z0-9_]*[}:]/, "inline format args {x} (1.58)"],
  [/println!\s*\(\s*"[^"]*\{[a-z_][a-z0-9_]*[}:]/, "inline format args {x} (1.58)"],
  [/\.is_sorted\s*\(/, "is_sorted (1.82)"],
  [/\.as_chunks|\.array_chunks|\.array_windows/, "array chunks (unstable/new)"],
  [/\.is_ascii_octdigit|\.checked_ilog/, "too new"],
  [/\blet\s+[A-Z]\w*\s*\([^)]*\)\s*=\s*[^;{]+\belse\s*\{/, "let-else (1.65)"],
];

const MAX_INT = 2147483647, MIN_INT = -2147483648;

// ── Judge contract (wrapCode's parser and printer, as catalog-selfcheck) ──
function parseArgs(rawInput: string): unknown[] {
  const varRegex = /([a-zA-Z_]\w*)\s*=/g;
  const matches: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = varRegex.exec(rawInput)) !== null) matches.push(m);
  if (matches.length === 0) {
    try { return [JSON.parse(rawInput)]; } catch { /* line mode */ }
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
const formatResult = (r: unknown) => (typeof r === "string" ? r : typeof r === "bigint" ? r.toString() : JSON.stringify(r));

/** Checks a parsed argument matches its declared type (catches a generator emitting the wrong shape). */
function typeOk(v: unknown, t: string): boolean {
  const isInt = (x: unknown) => typeof x === "number" && Number.isInteger(x) && x >= MIN_INT && x <= MAX_INT;
  switch (t) {
    case "int": return isInt(v);
    case "int[]": return Array.isArray(v) && v.every(isInt);
    case "int[][]": return Array.isArray(v) && v.every((r) => Array.isArray(r) && r.every(isInt));
    case "string": return typeof v === "string";
    case "string[]": return Array.isArray(v) && v.every((s) => typeof s === "string");
    default: return false;
  }
}

/** Checks an expected output parses as the declared return kind and stays int32. */
function outputOk(out: string, kind: string): string | null {
  const ints = (x: unknown): boolean =>
    typeof x === "number" ? Number.isInteger(x) && x >= MIN_INT && x <= MAX_INT : Array.isArray(x) && x.every(ints);
  if (kind === "string") return null;
  if (kind === "bool") return out === "true" || out === "false" ? null : `bool output "${out.slice(0, 30)}"`;
  let v: unknown;
  try { v = JSON.parse(out); } catch { return `output is not JSON: ${out.slice(0, 40)}`; }
  if (kind === "int") return ints(v) && typeof v === "number" ? null : `int output out of int32 or not an int: ${out.slice(0, 40)}`;
  if (kind === "int[]") return Array.isArray(v) && v.every((x) => typeof x === "number") && ints(v) ? null : `int[] output malformed/out of range: ${out.slice(0, 40)}`;
  if (kind === "int[][]") return Array.isArray(v) && v.every((r) => Array.isArray(r)) && ints(v) ? null : `int[][] output malformed/out of range: ${out.slice(0, 40)}`;
  if (kind === "string[]") return Array.isArray(v) && v.every((s) => typeof s === "string") ? null : `string[] output malformed: ${out.slice(0, 40)}`;
  return `unknown return kind ${kind}`;
}

// ── Lock (three concurrent compile+run slots across processes) ────────
const LOCK_ROOT = path.join(os.tmpdir(), "codekairo-catalog-localrun-locks");
fs.mkdirSync(LOCK_ROOT, { recursive: true });
function acquireSlot(): string {
  for (;;) {
    for (let k = 0; k < 3; k++) {
      const dir = path.join(LOCK_ROOT, `slot-${k}`);
      try {
        fs.mkdirSync(dir);
        fs.writeFileSync(path.join(dir, "pid"), String(process.pid));
        return dir;
      } catch {
        try {
          // A slot held for over ten minutes belongs to a run that died.
          if (Date.now() - fs.statSync(dir).mtimeMs > 10 * 60_000) fs.rmSync(dir, { recursive: true, force: true });
        } catch { /* raced with its owner */ }
      }
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 750);
  }
}
const releaseSlot = (dir: string) => fs.rmSync(dir, { recursive: true, force: true });

// ── Local engines ───────────────────────────────────────────────────
const workRoot = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-localrun-"));
process.on("exit", () => { try { fs.rmSync(workRoot, { recursive: true, force: true }); } catch { /* ignore */ } });

interface RunOutcome { compileError?: string; runtimeError?: string; outputs?: string[]; ms?: number; typecheckOnly?: boolean }

function tsCompile(source: string, dir: string): { js?: string; error?: string } {
  const file = path.join(dir, "main.ts");
  fs.writeFileSync(file, source);
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES5,
    lib: ["lib.es5.d.ts", "lib.dom.d.ts"],
    module: ts.ModuleKind.None,
    strict: false,
    noEmitOnError: true,
    types: [],
    outDir: dir,
    ignoreDeprecations: "6.0",
  } as ts.CompilerOptions;
  const program = ts.createProgram([file], options);
  const diags = ts.getPreEmitDiagnostics(program).filter((d) => d.category === ts.DiagnosticCategory.Error);
  if (diags.length) {
    return { error: diags.slice(0, 5).map((d) => {
      const msg = ts.flattenDiagnosticMessageText(d.messageText, "\n");
      const pos = d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start) : null;
      return `TS${d.code}${pos ? ` (line ${pos.line + 1})` : ""}: ${msg}`;
    }).join("\n") };
  }
  const emitted = program.emit();
  if (emitted.emitSkipped) return { error: "emit skipped" };
  return { js: path.join(dir, "main.js") };
}

function runLocal(lang: Language, source: string, stdin: string): RunOutcome {
  const dir = fs.mkdtempSync(path.join(workRoot, `${lang}-`));
  const run = (cmd: string, argv: string[]) => {
    const t0 = Date.now();
    const r = spawnSync(cmd, argv, { input: stdin, cwd: dir, maxBuffer: 256 * 1024 * 1024, timeout: 120_000, encoding: "utf8" });
    return { r, ms: Date.now() - t0 };
  };
  try {
    let res: ReturnType<typeof run>;
    if (lang === "typescript") {
      const c = tsCompile(source, dir);
      if (c.error) return { compileError: c.error };
      res = run(process.execPath, [c.js!]);
    } else if (lang === "java") {
      fs.writeFileSync(path.join(dir, "Main.java"), source);
      try {
        execFileSync("javac", ["--release", "13", "-nowarn", "-encoding", "UTF-8", "-d", dir, path.join(dir, "Main.java")], { stdio: ["ignore", "ignore", "pipe"] });
      } catch (e) {
        return { compileError: ((e as { stderr?: Buffer }).stderr?.toString() ?? String(e)).split("\n").slice(0, 8).join("\n") };
      }
      res = run("java", ["-Xss64m", "-cp", dir, "Main"]);
    } else if (lang === "rust") {
      fs.writeFileSync(path.join(dir, "main.rs"), source);
      const exe = path.join(dir, process.platform === "win32" ? "main.exe" : "main");
      try {
        execFileSync("rustc", ["--edition", "2018", "-C", "opt-level=2", "-A", "warnings", "-o", exe, path.join(dir, "main.rs")], { stdio: ["ignore", "ignore", "pipe"] });
      } catch (e) {
        const err = (e as { stderr?: Buffer }).stderr?.toString() ?? String(e);
        // No MSVC linker on the machine (link.exe missing, or Git Bash's GNU
        // `link` found first): fall back to a type/borrow check, as
        // catalog-compilecheck does, rather than failing every Rust solution.
        if (/link\.exe|linker|LNK\d|link: (extra operand|missing)/i.test(err) && !/error\[E\d+\]/.test(err)) {
          try {
            execFileSync("rustc", ["--edition", "2018", "--emit=metadata", "-A", "warnings", "--out-dir", dir, path.join(dir, "main.rs")], { stdio: ["ignore", "ignore", "pipe"] });
            return { typecheckOnly: true };
          } catch (e2) {
            return { compileError: ((e2 as { stderr?: Buffer }).stderr?.toString() ?? String(e2)).split("\n").slice(0, 12).join("\n") };
          }
        }
        return { compileError: err.split("\n").slice(0, 12).join("\n") };
      }
      res = run(exe, []);
    } else {
      return { compileError: `no local engine for ${lang}` };
    }
    const { r, ms } = res;
    if (r.error) return { runtimeError: String(r.error) };
    const { driver } = isolateDriverOutput(r.stdout ?? "");
    const decoded = decodeBatchStdout(driver);
    if (r.status !== 0 && !decoded) return { runtimeError: `exit ${r.status}: ${(r.stderr ?? "").slice(0, 600)}` };
    const chunks = splitBatchStdout(decoded).filter((c) => !c.startsWith("__CODEXA_STATS__"));
    return { outputs: chunks, ms };
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* windows may hold the exe briefly */ }
  }
}

// ── Checks ──────────────────────────────────────────────────────────
interface Report { slug: string; ok: boolean; lines: string[] }

function lintEntry(spec: CatalogProblem, rep: Report) {
  const fail = (s: string) => { rep.ok = false; rep.lines.push(`  ✗ ${s}`); };
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(spec.slug)) fail(`slug "${spec.slug}" is not kebab-case`);
  if (!["EASY", "MEDIUM", "HARD"].includes(spec.difficulty)) fail(`difficulty ${spec.difficulty}`);
  for (const p of spec.signature.params) {
    if (RESERVED_PARAM_NAMES.has(p.name.toLowerCase())) fail(`parameter "${p.name}" is a keyword in a target language`);
  }
  if (!/^[a-z][A-Za-z0-9]*$/.test(spec.signature.funcName)) fail(`funcName "${spec.signature.funcName}" must be camelCase`);
  // The C# driver PascalCases funcName into a method of `class Program`, which
  // also calls System.Convert / Console / Math: a method of the same name
  // shadows the type (CS0119) — LeetCode's own `convert` (Zigzag) does this.
  const pascal = spec.signature.funcName.charAt(0).toUpperCase() + spec.signature.funcName.slice(1);
  if (["Convert", "Console", "Environment", "GC", "Math", "String", "Array", "Program", "Main", "Buffer", "Encoding", "Stopwatch"].includes(pascal)) fail(`funcName "${spec.signature.funcName}" becomes C# method ${pascal}, which shadows a System type the driver uses — rename it`);
  const missing = ALL_LANGUAGES.filter((l) => !(typeof spec.solutions[l] === "string" && spec.solutions[l]!.trim().length > 0));
  if (missing.length) fail(`missing solutions: ${missing.join(", ")}`);
  for (const [re, label] of NODE12_BANNED) if (re.test(spec.solutions.javascript ?? "")) fail(`javascript uses ${label} (Node 12 judge)`);
  for (const [re, label] of RUST_TOO_NEW) if (label && re.test(spec.solutions.rust ?? "")) fail(`rust uses ${label} — judge is rustc 1.40`);
  const tsCode = spec.solutions.typescript ?? "";
  if (/for\s*\(\s*(const|let|var)\s+\w+\s+of\s/.test(tsCode)) rep.lines.push("  ! typescript uses for…of — fine over arrays, a compile error over a string (TS2494)");
  const topics = spec.tags.filter((t) => !COMPANY_TAGS.has(t));
  const unknown = topics.filter((t) => !TOPIC_TAGS.has(t));
  if (unknown.length) fail(`unknown topic tags: ${unknown.join(", ")} (use the existing vocabulary)`);
  if (topics.length === 0) fail("no topic tag");
  if (!spec.tags.some((t) => COMPANY_TAGS.has(t))) fail("no company tag");
  if (spec.hints.length < 2) fail("fewer than 2 hints");
  if (!spec.editorial || spec.editorial.length < 200) fail("editorial missing or too short");
  if (!spec.description.includes("### Constraints")) fail("description has no Constraints section (use describe())");
  if (spec.examples.length < 2) fail("fewer than 2 visible examples");
  if (spec.hiddenCount !== undefined && (spec.hiddenCount < 100 || spec.hiddenCount > 5000)) fail(`hiddenCount ${spec.hiddenCount} outside 100..5000`);
  // wrapCode (src/lib/judge0.ts) runs JavaScript and Python without the
  // generated driver: it calls the FIRST top-level function it finds, by these
  // exact patterns. A helper declared above the entry function would be the one
  // called — and the in-process run below calls funcName by name, so it would
  // never notice. Keep the entry function first (helpers nested or after it).
  const js = spec.solutions.javascript ?? "";
  const jsEntry =
    js.match(/^(?:var|let|const)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?(?:function\s*\(|(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>)/m) ||
    js.match(/^(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(/m) ||
    js.match(/function\s+([a-zA-Z0-9_]+)\s*\(/) ||
    js.match(/(?:var|let|const)\s+([a-zA-Z0-9_]+)\s*=\s*(?:function\s*\(|(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>)/);
  if (!jsEntry || jsEntry[1] !== spec.signature.funcName) fail(`javascript: the judge's wrapper would call "${jsEntry ? jsEntry[1] : "nothing"}", not ${spec.signature.funcName} — declare the entry function first (as \`var ${spec.signature.funcName} = function\`), helpers after it or nested`);
  const py = spec.solutions.python ?? "";
  const pyEntry = py.match(/^def\s+([a-zA-Z0-9_]+)\s*\(/m) || py.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
  if (!pyEntry || pyEntry[1] !== spec.signature.funcName) fail(`python: the judge's wrapper calls the first top-level def ("${pyEntry ? pyEntry[1] : "none"}"), not ${spec.signature.funcName} — put the entry def first, helpers after it or nested`);
  const all = JSON.stringify(spec);
  if (all.includes("__CODEXA_")) fail("contains a __CODEXA_ sentinel");
}

function suiteFor(spec: CatalogProblem, rep: Report): Case[] | null {
  const fail = (s: string) => { rep.ok = false; rep.lines.push(`  ✗ ${s}`); };
  const cases: Case[] = [...spec.examples];
  const rng = makeRng(spec.slug);
  try {
    for (let i = 0; i < Math.min(COUNT, spec.hiddenCount ?? COUNT); i++) cases.push(spec.gen(rng));
  } catch (e) {
    fail(`gen() threw: ${(e as Error).message}`);
    return null;
  }
  const arity = spec.signature.params.length;
  let bad = 0;
  for (let i = 0; i < cases.length && bad < 3; i++) {
    const c = cases[i];
    const label = i < spec.examples.length ? `example ${i + 1}` : `hidden ${i + 1 - spec.examples.length}`;
    if (c.input.includes("=")) { fail(`${label}: input contains "=" — parseArgs reads it as a named argument`); bad++; continue; }
    const parsed = parseArgs(c.input);
    if (parsed.length !== arity) { fail(`${label}: input parses to ${parsed.length} args, signature declares ${arity} — in=${c.input.slice(0, 80)}`); bad++; continue; }
    for (let k = 0; k < arity; k++) {
      if (!typeOk(parsed[k], spec.signature.params[k].type)) { fail(`${label}: argument ${k + 1} is not a valid ${spec.signature.params[k].type} — in=${c.input.slice(0, 80)}`); bad++; break; }
    }
    const o = outputOk(c.expectedOutput, spec.signature.returns);
    if (o) { fail(`${label}: ${o}`); bad++; }
    if (c.expectedOutput.trim() !== c.expectedOutput) { fail(`${label}: expected output has surrounding whitespace`); bad++; }
  }
  const inGz = gzipSync(Buffer.from(cases.map((c) => c.input).join("\n"))).length;
  const outGz = gzipSync(Buffer.from(cases.map((c) => c.expectedOutput).join("\n"))).length;
  const maxIn = Math.max(...cases.map((c) => c.input.length));
  rep.lines.push(`  suite: ${cases.length} cases, input ${Math.round(inGz / 1024)} KB gz (max case ${maxIn} chars), output ${Math.round(outGz / 1024)} KB gz`);
  if (inGz > 900 * 1024) fail(`suite input ${Math.round(inGz / 1024)} KB gz exceeds the 900 KB cap — shrink gen()`);
  if (outGz > 300 * 1024) fail(`suite output ${Math.round(outGz / 1024)} KB gz exceeds the 300 KB cap — shrink gen()`);
  const distinct = new Set(cases.slice(spec.examples.length).map((c) => c.input)).size;
  if (COUNT >= 1000 && distinct < Math.min(200, COUNT / 10)) rep.lines.push(`  ! only ${distinct} distinct hidden inputs — widen gen() if the input space allows`);
  const outs = new Set(cases.map((c) => c.expectedOutput)).size;
  if (COUNT >= 1000 && outs < 2) fail("every case has the same expected output — gen() is degenerate");
  return cases;
}

function runJs(spec: CatalogProblem, cases: Case[], rep: Report) {
  let fn: (...a: unknown[]) => unknown;
  try {
    // eslint-disable-next-line no-new-func -- the catalog is first-party source.
    fn = new Function(`${spec.solutions.javascript}\nreturn ${spec.signature.funcName};`)() as (...a: unknown[]) => unknown;
  } catch (e) {
    rep.ok = false; rep.lines.push(`  ✗ javascript does not compile: ${(e as Error).message}`); return;
  }
  if (typeof fn !== "function") { rep.ok = false; rep.lines.push(`  ✗ javascript defines no ${spec.signature.funcName}`); return; }
  const t0 = Date.now();
  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    let got: string;
    try {
      got = formatResult(fn(...parseArgs(c.input).map((v) => (Array.isArray(v) ? JSON.parse(JSON.stringify(v)) : v))));
    } catch (e) {
      rep.ok = false; rep.lines.push(`  ✗ [javascript] case ${i + 1} threw ${(e as Error).message} — in=${c.input.slice(0, 100)}`); return;
    }
    if (got.trim() !== c.expectedOutput.trim()) {
      rep.ok = false;
      rep.lines.push(`  ✗ [javascript] case ${i + 1}: in=${c.input.slice(0, 120)} want=${c.expectedOutput.slice(0, 80)} got=${got.slice(0, 80)}`);
      return;
    }
  }
  const ms = Date.now() - t0;
  rep.lines.push(`  ✓ javascript ${cases.length}/${cases.length} (${ms} ms in-process)`);
  // Python, Ruby and PHP run ~30× slower than V8 on these loops, and the judge
  // gives the whole suite 15 CPU seconds — 400 ms here is ~12 s there.
  if (ms > 400) { rep.ok = false; rep.lines.push(`  ✗ javascript took ${ms} ms in-process; the slowest judge languages need this ≤ 400 ms — shrink gen() sizes or set hiddenCount`); }
  else if (ms > 200) rep.lines.push(`  ! javascript took ${ms} ms in-process — close to the slow-language budget (≤ 400 ms)`);
}

function runCompiled(spec: CatalogProblem, cases: Case[], lang: Language, rep: Report) {
  const code = spec.solutions[lang];
  if (!code) return;
  const source = applyDriver(lang, spec.signature, code);
  const stdin = encodeBatchStdin(buildBatchStdin(cases.map((c) => c.input)), lang);
  const slot = acquireSlot();
  let r: RunOutcome;
  try { r = runLocal(lang, source, stdin); } finally { releaseSlot(slot); }
  if (r.typecheckOnly) { rep.lines.push(`  ! [${lang}] type-checked only — no linker on this machine, the solution was not run`); return; }
  if (r.compileError) { rep.ok = false; rep.lines.push(`  ✗ [${lang}] compile error:\n${r.compileError.split("\n").map((l) => `      ${l}`).join("\n")}`); return; }
  if (r.runtimeError) { rep.ok = false; rep.lines.push(`  ✗ [${lang}] ${r.runtimeError.slice(0, 600)}`); return; }
  const outs = r.outputs ?? [];
  for (let i = 0; i < cases.length; i++) {
    const got = outs[i];
    if (got === undefined) { rep.ok = false; rep.lines.push(`  ✗ [${lang}] produced only ${outs.length} of ${cases.length} outputs`); return; }
    if (got.startsWith("__CODEXA_ERROR__:")) { rep.ok = false; rep.lines.push(`  ✗ [${lang}] case ${i + 1} runtime error: ${got.slice(17, 300)} — in=${cases[i].input.slice(0, 100)}`); return; }
    if (got.trim() !== cases[i].expectedOutput.trim()) {
      rep.ok = false;
      rep.lines.push(`  ✗ [${lang}] case ${i + 1}: in=${cases[i].input.slice(0, 120)} want=${cases[i].expectedOutput.slice(0, 80)} got=${got.slice(0, 80)}`);
      return;
    }
  }
  rep.lines.push(`  ✓ ${lang} ${cases.length}/${cases.length} (${r.ms} ms run)`);
}

// ── Main ────────────────────────────────────────────────────────────
const mod = (await import(`./catalog/${FILE}.ts`)) as Record<string, unknown>;
const exported = Object.values(mod).filter((v): v is CatalogProblem[] => Array.isArray(v));
if (exported.length !== 1) {
  console.log(`expected exactly one exported problem array in catalog/${FILE}.ts, found ${exported.length}`);
  process.exit(2);
}
const problems = exported[0];
const seen = new Set<string>();
for (const p of problems) {
  if (seen.has(p.slug)) console.log(`✗ duplicate slug inside the file: ${p.slug}`);
  seen.add(p.slug);
}
const list = problems.filter((p) => !ONLY || ONLY.includes(p.slug));
console.log(`catalog/${FILE}.ts: ${problems.length} problems; checking ${list.length} × (${COUNT} generated) with javascript${LANGS.length ? ", " + LANGS.join(", ") : ""}`);

let clean = 0;
const t0 = Date.now();
for (const spec of list) {
  const rep: Report = { slug: spec.slug, ok: true, lines: [] };
  lintEntry(spec, rep);
  const cases = suiteFor(spec, rep);
  if (cases) {
    runJs(spec, cases, rep);
    for (const lang of LANGS) runCompiled(spec, cases, lang, rep);
  }
  console.log(`${rep.ok ? "PASS" : "FAIL"} ${spec.slug} [${spec.difficulty}]`);
  for (const l of rep.lines) if (!rep.ok || l.includes("!")) console.log(l);
  if (rep.ok) clean++;
}
console.log(`\n== ${clean}/${list.length} clean (${Math.round((Date.now() - t0) / 1000)} s)`);
if (clean !== list.length) process.exitCode = 1;
