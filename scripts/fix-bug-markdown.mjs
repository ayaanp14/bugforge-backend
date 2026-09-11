/**
 * Converts markdown context files in a bug wave into comment-only .js files.
 *
 *   node scripts/fix-bug-markdown.mjs scripts/bugs-wave10.ts [...more]
 *
 * src/lib/bug-judge.ts wraps EVERY project file in a CommonJS module function,
 * so a .md file is parsed as JavaScript and the whole project fails to load.
 * Locked context files must therefore be valid JS — a block comment carries the
 * same information and still shows up in the file tree.
 */
import { readFileSync, writeFileSync } from "node:fs";

let total = 0;
for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, "utf8");
  let count = 0;

  // filePath: "....md"  →  "....js"
  src = src.replace(/filePath: "([^"]+)\.md"/g, (_m, base) => {
    count++;
    return `filePath: "${base}.js"`;
  });

  // language: "markdown" → "javascript"
  src = src.replace(/language: "markdown"/g, 'language: "javascript"');

  // Wrap the content of those entries in a block comment. Matches the
  // `content: \`…\`` that follows a javascript-converted context entry whose
  // body is prose (no `exports.` and no `function`).
  src = src.replace(/content: `((?:\\.|[^`\\])*)`/g, (whole, body) => {
    if (body.includes("exports.") || body.includes("function ") || body.startsWith("/*")) return whole;
    const commented = "/*\\n" + body.replace(/\*\//g, "*\\/") + "\\n*/\\n";
    return "content: `" + commented + "`";
  });

  writeFileSync(file, src);
  console.log(`${file}: converted ${count} markdown context file(s)`);
  total += count;
}
console.log(`total: ${total}`);
