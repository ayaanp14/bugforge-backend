"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const [spec, ...recordLines] = lines;
const records = recordLines.map((l) => JSON.parse(l));
const OPS = { ">": (a, b) => a > b, "<": (a, b) => a < b, ">=": (a, b) => a >= b, "<=": (a, b) => a <= b, "==": (a, b) => a == b, "!=": (a, b) => a != b };
const literal = (text) => (/^-?\d+(\.\d+)?$/.test(text) ? Number(text) : text.replace(/^"|"$/g, ""));
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
function compile(step) {
  const [op, ...args] = step.trim().split(/\s+/);
  switch (op) {
    case "filter": {
      const m = /^(\w+)(>=|<=|==|!=|>|<)(.+)$/.exec(args.join(""));
      if (!m) throw new SyntaxError(`bad filter '${args.join(" ")}'`);
      const [, field, cmpOp, raw] = m;
      const value = literal(raw);
      return (xs) => xs.filter((x) => OPS[cmpOp](x[field], value));
    }
    case "map": return (xs) => xs.map((x) => x[args[0]]);
    case "sort": {
      const [field, dir] = args;
      const sign = dir === "desc" ? -1 : 1;
      return (xs) => [...xs].sort((a, b) => sign * (field ? cmp(a[field], b[field]) : cmp(a, b)));
    }
    case "take": return (xs) => xs.slice(0, Number(args[0]));
    case "uniq": return (xs) => [...new Set(xs)];
    case "count": return (xs) => xs.length;
    case "sum": return (xs) => xs.reduce((s, x) => s + (args[0] ? x[args[0]] : x), 0);
    default: throw new SyntaxError(`unknown step '${op}'`);
  }
}
const pipe = (...fns) => (x) => fns.reduce((acc, f) => f(acc), x);
try {
  const steps = spec.split("|").map(compile);
  console.log(`${spec.trim()} => ${JSON.stringify(pipe(...steps)(records))}`);
} catch (err) {
  console.log(`${err.name}: ${err.message}`);
}
