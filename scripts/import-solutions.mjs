/**
 * Loads a raw multi-language solution bundle into the catalog.
 *
 *   node scripts/import-solutions.mjs scripts/solutions-src/numbers-a.txt
 *
 * Bundle format — plain source, no escaping anywhere:
 *
 *   @@@PROBLEM two-sum
 *   @@@LANG java
 *   public static int[] twoSum(int[] nums, int target) { … }
 *   @@@LANG go
 *   func twoSum(nums []int, target int) []int { … }
 *   @@@PROBLEM valid-parentheses
 *   …
 *
 * Hand-escaping thirteen languages into TypeScript template literals is where
 * silent corruption comes from — PHP's `$var` collides with `${`, Ruby's
 * `#{}` and every language's backslash escapes need doubling. So the source is
 * authored raw here and this converts it into the payload
 * scripts/add-solutions.mjs already knows how to splice in.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const LANGUAGES = new Set([
  "javascript", "typescript", "python", "java", "cpp", "c", "csharp",
  "go", "kotlin", "swift", "rust", "php", "ruby",
]);

/** Languages a finished catalog entry is expected to carry. */
const REQUIRED = [...LANGUAGES];

const bundlePath = process.argv[2];
if (!bundlePath) {
  console.error("usage: node scripts/import-solutions.mjs <bundle.txt> [--check]");
  process.exit(1);
}
const checkOnly = process.argv.includes("--check");

const text = fs.readFileSync(bundlePath, "utf8");
const lines = text.split(/\r?\n/);

/** @type {Record<string, Record<string, string>>} */
const payload = {};
let slug = null;
let lang = null;
let buf = [];

const flush = () => {
  if (slug === null || lang === null) return;
  // Trailing blank lines are an artefact of the bundle's own spacing.
  while (buf.length > 0 && buf[buf.length - 1].trim() === "") buf.pop();
  if (buf.length === 0) throw new Error(`${slug} [${lang}]: empty solution`);
  payload[slug][lang] = buf.join("\n");
  buf = [];
};

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith("@@@PROBLEM ")) {
    flush();
    slug = line.slice("@@@PROBLEM ".length).trim();
    lang = null;
    if (payload[slug]) throw new Error(`duplicate problem block: ${slug} (line ${i + 1})`);
    payload[slug] = {};
  } else if (line.startsWith("@@@LANG ")) {
    flush();
    if (slug === null) throw new Error(`@@@LANG before any @@@PROBLEM (line ${i + 1})`);
    lang = line.slice("@@@LANG ".length).trim();
    if (!LANGUAGES.has(lang)) throw new Error(`unknown language "${lang}" (line ${i + 1})`);
    if (payload[slug][lang]) throw new Error(`duplicate ${lang} for ${slug} (line ${i + 1})`);
  } else if (lang !== null) {
    buf.push(line);
  } else if (line.trim() !== "") {
    throw new Error(`stray text outside any @@@LANG block (line ${i + 1}): ${line.slice(0, 60)}`);
  }
}
flush();

const slugs = Object.keys(payload);
if (slugs.length === 0) throw new Error("bundle contains no problems");

console.log(`${path.basename(bundlePath)}: ${slugs.length} problems`);
for (const s of slugs) {
  const have = Object.keys(payload[s]);
  const missing = REQUIRED.filter((l) => !have.includes(l) && !hasInCatalog(s, l));
  if (missing.length) console.log(`  ${s}: missing ${missing.join(", ")}`);
}

/** True when the catalog source already carries this language inline. */
function hasInCatalog(problemSlug, language) {
  const dir = path.join(import.meta.dirname, "catalog");
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".ts")) continue;
    const src = fs.readFileSync(path.join(dir, f), "utf8");
    const at = src.indexOf(`slug: "${problemSlug}"`);
    if (at < 0) continue;
    const solAt = src.indexOf("solutions: {", at);
    const nextSlug = src.indexOf('slug: "', at + 10);
    const end = nextSlug < 0 ? src.length : nextSlug;
    return new RegExp(`^\\s*${language}:\\s*\``, "m").test(src.slice(solAt, end));
  }
  return false;
}

if (checkOnly) process.exit(0);

const out = path.join(path.dirname(bundlePath), `.${path.basename(bundlePath)}.payload.json`);
fs.writeFileSync(out, JSON.stringify(payload, null, 2));
execFileSync(process.execPath, [path.join(import.meta.dirname, "add-solutions.mjs"), out], { stdio: "inherit" });
fs.unlinkSync(out);
