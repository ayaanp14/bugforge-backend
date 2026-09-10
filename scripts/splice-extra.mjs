/**
 * Splices a hand-written `_<name>-extra.ts` fragment onto the end of a catalog
 * array. Authoring long TS through a shell heredoc keeps tripping over quoting,
 * so the fragment is written as its own file and appended here instead.
 *
 *   node scripts/splice-extra.mjs scripts/catalog/stacks2.ts scripts/catalog/_stacks2-extra.ts
 *
 * The fragment must start with a leading comment line (dropped) and end with
 * the array's closing `];`.
 */
import fs from "node:fs";

const [, , targetPath, fragmentPath] = process.argv;
if (!targetPath || !fragmentPath) {
  console.error("usage: node scripts/splice-extra.mjs <catalog.ts> <fragment.ts>");
  process.exit(1);
}

const target = fs.readFileSync(targetPath, "utf8");
const fragment = fs.readFileSync(fragmentPath, "utf8");

const body = fragment.slice(fragment.indexOf("\n") + 1).trimEnd();
if (!body.endsWith("];")) throw new Error("fragment must end with ];");
if (!target.trimEnd().endsWith("];")) throw new Error("target must end with ];");

const merged = target.replace(/\];\s*$/, "\n" + body + "\n");
fs.writeFileSync(targetPath, merged);

const count = (merged.match(/slug: "/g) ?? []).length;
console.log(`${targetPath}: ${count} problems`);
