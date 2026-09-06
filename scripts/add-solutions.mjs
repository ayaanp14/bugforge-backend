/**
 * Inserts editorials and per-language reference solutions into the catalog.
 *
 *   node scripts/add-solutions.mjs <payload.json>
 *
 * Payload shape, per problem slug:
 *   {
 *     "<slug>": {
 *       "editorial": { idea, steps[], why?, time, space, pitfalls?[] },
 *       "solutions": { "<language>": "<source>", … }
 *     }
 *   }
 * A bare `{ "<slug>": { "<language>": "<source>" } }` is also accepted and
 * treated as solutions-only.
 *
 * Both go into scripts/catalog/*.ts as TypeScript source — solutions as
 * template literals, editorials as an explain({…}) call. Escaping that by hand
 * across 13 languages × 148 problems is a reliable way to introduce silent
 * corruption, so it happens here instead. Existing entries are replaced in
 * place; new ones are inserted.
 */
import fs from "node:fs";
import path from "node:path";

const CATALOG_DIR = path.join(import.meta.dirname, "catalog");

/** Escape a raw source string for embedding in a TS template literal. */
function toTemplateLiteral(code) {
  const escaped = code
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${")
    .replace(/\r?\n/g, "\\n");
  return "`" + escaped + "`";
}

/** JSON.stringify already emits a valid double-quoted TS string literal. */
const tsString = (s) => JSON.stringify(s);

/** Render an `editorial: explain({…}),` property at the catalog's indentation. */
function editorialCode(e) {
  const lines = [`        idea: ${tsString(e.idea)},`, "        steps: ["];
  for (const s of e.steps) lines.push(`          ${tsString(s)},`);
  lines.push("        ],");
  if (e.why) lines.push(`        why: ${tsString(e.why)},`);
  lines.push(`        time: ${tsString(e.time)},`);
  lines.push(`        space: ${tsString(e.space)},`);
  if (e.pitfalls && e.pitfalls.length) {
    lines.push("        pitfalls: [");
    for (const p of e.pitfalls) lines.push(`          ${tsString(p)},`);
    lines.push("        ],");
  }
  return `      editorial: explain({\n${lines.join("\n")}\n      }),`;
}

/** Span of a balanced {...} starting at the first { after `from`. */
function balancedBraces(src, from) {
  const open = src.indexOf("{", from);
  if (open < 0) return null;
  let depth = 0;
  let inStr = null;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (ch === inStr && src[i - 1] !== "\\") inStr = null;
      continue;
    }
    if (ch === "`" || ch === '"' || ch === "'") { inStr = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return { start: open, end: i };
    }
  }
  return null;
}

function findSolutionsBlock(src, slug) {
  const slugAt = src.indexOf(`slug: "${slug}"`);
  if (slugAt < 0) return null;
  const key = src.indexOf("solutions: {", slugAt);
  if (key < 0) return null;
  return { keyAt: key, ...balancedBraces(src, key) };
}

/** Language keys already present in a solutions block, with their spans. */
function existingEntries(block) {
  const out = new Map();
  const re = /^(\s*)([a-z]+):\s*`/gm;
  let m;
  while ((m = re.exec(block)) !== null) {
    let i = m.index + m[0].length;
    for (; i < block.length; i++) {
      if (block[i] === "`" && block[i - 1] !== "\\") break;
    }
    let end = i + 1;
    if (block[end] === ",") end++;
    out.set(m[2], { start: m.index, end });
  }
  return out;
}

const payloadPath = process.argv[2];
if (!payloadPath) {
  console.error("usage: node scripts/add-solutions.mjs <payload.json>");
  process.exit(1);
}
const payload = JSON.parse(fs.readFileSync(payloadPath, "utf8"));

const files = fs.readdirSync(CATALOG_DIR).filter((f) => f.endsWith(".ts") && f !== "types.ts" && f !== "index.ts");
let added = 0;
let replaced = 0;
let editorials = 0;
const missing = [];

for (const [slug, entry] of Object.entries(payload)) {
  const editorial = entry.editorial && entry.editorial.idea ? entry.editorial : null;
  const langs = entry.solutions ?? (editorial ? {} : entry);

  let done = false;
  for (const file of files) {
    const full = path.join(CATALOG_DIR, file);
    let src = fs.readFileSync(full, "utf8");
    if (src.indexOf(`slug: "${slug}"`) < 0) continue;

    // ── solutions ────────────────────────────────────────────────
    if (Object.keys(langs).length > 0) {
      const span = findSolutionsBlock(src, slug);
      if (!span) throw new Error(`no solutions block for ${slug}`);
      let block = src.slice(span.start, span.end + 1);
      for (const [lang, code] of Object.entries(langs)) {
        const entries = existingEntries(block);
        const literal = toTemplateLiteral(code);
        const prev = entries.get(lang);
        if (prev) {
          block = block.slice(0, prev.start) + `\n        ${lang}: ${literal},` + block.slice(prev.end);
          replaced++;
        } else {
          const closeAt = block.lastIndexOf("}");
          block = block.slice(0, closeAt) + `        ${lang}: ${literal},\n      ` + block.slice(closeAt);
          added++;
        }
      }
      src = src.slice(0, span.start) + block + src.slice(span.end + 1);
    }

    // ── editorial ────────────────────────────────────────────────
    if (editorial) {
      const code = editorialCode(editorial);
      const slugAt = src.indexOf(`slug: "${slug}"`);
      const existingAt = src.indexOf("editorial: explain({", slugAt);
      const solAt = src.indexOf("solutions: {", slugAt);
      if (existingAt >= 0 && existingAt < solAt) {
        const brace = balancedBraces(src, existingAt);
        // Swallow the trailing "})," of the explain call.
        let end = brace.end;
        while (end < src.length && src[end] !== ",") end++;
        const lineStart = src.lastIndexOf("\n", existingAt) + 1;
        src = src.slice(0, lineStart) + code + src.slice(end + 1);
      } else {
        const lineStart = src.lastIndexOf("\n", solAt) + 1;
        src = src.slice(0, lineStart) + code + "\n" + src.slice(lineStart);
      }
      editorials++;
    }

    // The editorial helper must be imported wherever it is now used.
    if (editorial && !/\bexplain\b[^\n]*from "\.\/types\.js"/.test(src)) {
      src = src.replace(/import \{ ([^}]*?) \} from "\.\/types\.js";/, (m0, names) => {
        if (/\bexplain\b/.test(names)) return m0;
        const parts = names.split(",").map((s) => s.trim()).filter(Boolean);
        parts.push("explain");
        // Keep value imports before `type` imports, alphabetical within each.
        const values = parts.filter((p) => !p.startsWith("type ")).sort();
        const types = parts.filter((p) => p.startsWith("type ")).sort();
        return `import { ${[...values, ...types].join(", ")} } from "./types.js";`;
      });
    }

    fs.writeFileSync(full, src);
    done = true;
    break;
  }
  if (!done) missing.push(slug);
}

console.log(`solutions: +${added} new, ${replaced} replaced | editorials: ${editorials}${missing.length ? ` | NOT FOUND: ${missing.join(", ")}` : ""}`);
if (missing.length) process.exitCode = 1;
