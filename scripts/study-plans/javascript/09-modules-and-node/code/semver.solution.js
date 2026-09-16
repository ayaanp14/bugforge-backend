"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const parse = (v) => v.split(".").map(Number);   // [major, minor, patch]
const cmp = (a, b) => { for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; };
function satisfiesOne(v, part) {
  if (part === "*" || part === "x") return true;
  const m = /^(\^|~|>=|<=|>|<)?(\d+)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?$/.exec(part);
  if (!m) throw new SyntaxError(`bad range part '${part}'`);
  const [, op = "", maj, min, pat] = m;
  const wild = min === undefined || min === "x" || min === "*" || pat === undefined || pat === "x" || pat === "*";
  const lower = [Number(maj), min === undefined || /x|\*/.test(min) ? 0 : Number(min), pat === undefined || /x|\*/.test(pat) ? 0 : Number(pat)];
  let upper;                                          // exclusive
  if (op === "^") upper = lower[0] > 0 ? [lower[0] + 1, 0, 0] : lower[1] > 0 ? [0, lower[1] + 1, 0] : [0, 0, lower[2] + 1];
  else if (op === "~") upper = [lower[0], lower[1] + 1, 0];
  else if (op === "") upper = wild ? (min === undefined || /x|\*/.test(min) ? [lower[0] + 1, 0, 0] : [lower[0], lower[1] + 1, 0]) : null;
  if (op === ">=") return cmp(v, lower) >= 0;
  if (op === ">") return cmp(v, lower) > 0;
  if (op === "<=") return cmp(v, lower) <= 0;
  if (op === "<") return cmp(v, lower) < 0;
  if (upper === null) return cmp(v, lower) === 0;     // exact
  return cmp(v, lower) >= 0 && cmp(v, upper) < 0;
}
function satisfies(version, range) {
  const v = parse(version);
  return range.split(/\s+/).every((part) => satisfiesOne(v, part));
}
for (const line of lines) {
  const [cmd, ...rest] = line.trim().split(/\s+/);
  if (cmd === "check") { const [version, ...range] = rest; console.log(`${range.join(" ")} vs ${version}: ${satisfies(version, range.join(" "))}`); }
  else if (cmd === "max") {
    const [range, ...versions] = rest;
    const ok = versions.filter((v) => satisfies(v, range)).sort((a, b) => cmp(parse(a), parse(b)));
    console.log(`max ${range}: ${ok.length ? ok[ok.length - 1] : "none"}`);
  }
}
