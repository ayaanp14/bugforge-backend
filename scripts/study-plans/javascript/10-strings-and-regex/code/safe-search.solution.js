"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const [query, ...rest] = lines;
const texts = rest.filter((l) => !l.startsWith("pattern "));
const patterns = rest.filter((l) => l.startsWith("pattern ")).map((l) => l.slice(8).trim());
const safe = new RegExp(escapeRegExp(query.trim()), "giu");
for (const t of texts) {
  const hits = t.match(safe) ?? [];
  console.log(`${t.replace(safe, (m) => `[${m}]`)} (${hits.length})`);
}
let raw;
try { const re = new RegExp(query.trim(), "giu"); raw = `matches ${texts.reduce((n, t) => n + (t.match(re) ?? []).length, 0)} (${re.source})`; }
catch (err) { raw = `${err.constructor.name}`; }
console.log(`unescaped: ${raw}`);
// A heuristic, not a proof: a quantified group whose body is itself quantified, or two adjacent open-ended quantifiers.
const suspicious = (p) => /\([^()]*[+*][^()]*\)[+*{]/.test(p) || /[+*]\)?\s*\(?[^()\[\]]*[+*]/.test(p.replace(/\\./g, "")) && /(\\w|\.|\\s)[+*].*(\\w|\.|\\s)[+*]/.test(p);
for (const p of patterns) console.log(`pattern ${p}: ${suspicious(p) ? "suspicious" : "ok"}`);
