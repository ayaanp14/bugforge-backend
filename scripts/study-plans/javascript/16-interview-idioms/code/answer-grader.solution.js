"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Line 1: `keywords: a, b, c`; line 2: `misconceptions: x, y`; then `<candidate>: <answer>` lines.
const list = (line) => line.split(":").slice(1).join(":").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const keywords = list(lines[0]), misconceptions = list(lines[1]);
const normalise = (s) => ` ${s.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim()} `;   // padded so phrase matches respect word edges
const graded = lines.slice(2).map((line) => {
  const [name, ...rest] = line.split(":");
  const answer = rest.join(":").trim(), text = normalise(answer);
  const hit = keywords.filter((k) => text.includes(` ${k} `)), missing = keywords.filter((k) => !hit.includes(k));
  const flagged = misconceptions.filter((m) => text.includes(` ${m} `));
  const words = answer.split(/\s+/).filter(Boolean).length;
  const coverage = Math.round((hit.length / keywords.length) * 100);
  const score = Math.max(0, coverage - 25 * flagged.length);
  const grade = flagged.length ? (coverage >= 50 ? "partial (misconception)" : "weak (misconception)") : coverage >= 80 ? "strong" : coverage >= 50 ? "partial" : "weak";
  return { name: name.trim(), hit, missing, flagged, words, coverage, score, grade };
}).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
for (const g of graded) console.log(`${g.name}: coverage=${g.hit.length}/${keywords.length} (${g.coverage}%) missing=[${g.missing.join(", ")}] flagged=[${g.flagged.join(", ")}] words=${g.words}${g.words > 60 ? " (long)" : ""} -> ${g.grade}`);
console.log(`best: ${graded[0]?.name ?? "-"}`);
