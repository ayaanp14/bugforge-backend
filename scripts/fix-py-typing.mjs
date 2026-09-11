/**
 * Adds the `from typing import List` prelude to catalog Python solutions that
 * annotate with List[...] but do not import it.
 *
 *   node scripts/fix-py-typing.mjs scripts/catalog/arrays3.ts [...more files]
 *
 * Judge0 runs the solution verbatim, so an un-imported `List` is a NameError on
 * the very first case — this is the one systematic mistake worth automating.
 */
import { readFileSync, writeFileSync } from "node:fs";

let touched = 0;
for (const file of process.argv.slice(2)) {
  const src = readFileSync(file, "utf8");
  let count = 0;
  const out = src.replace(/python: `((?:\\.|[^`\\])*)`/g, (whole, body) => {
    if (!body.includes("List[")) return whole;
    if (body.includes("from typing import List")) return whole;
    count++;
    return "python: `from typing import List\\n\\n" + body + "`";
  });
  if (count > 0) {
    writeFileSync(file, out);
    console.log(`${file}: added typing import to ${count} solution(s)`);
    touched += count;
  } else {
    console.log(`${file}: nothing to do`);
  }
}
console.log(`total: ${touched}`);
