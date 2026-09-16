"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function parseArgs(argv) {
  const opts = {}, positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") { positional.push(...argv.slice(i + 1)); break; }
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq !== -1) { opts[a.slice(2, eq)] = a.slice(eq + 1); continue; }
      const key = a.slice(2);
      if (key.startsWith("no-")) opts[key.slice(3)] = false;
      else if (i + 1 < argv.length && !argv[i + 1].startsWith("-")) opts[key] = argv[++i];
      else opts[key] = true;
    } else if (a.startsWith("-") && a.length > 1) {
      for (const ch of a.slice(1)) opts[ch] = true;      // -abc → a, b, c
    } else positional.push(a);
  }
  return { opts, positional };
}
console.log(JSON.stringify(parseArgs(lines[0].trim().split(/\s+/))));
