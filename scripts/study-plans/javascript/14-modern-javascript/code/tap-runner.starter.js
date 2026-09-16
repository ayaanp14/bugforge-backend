"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const assert = require("node:assert/strict");
const broken = new Set((lines[0] ?? "").trim().split(/[\s,]+/).filter(Boolean));
// The code under test; `broken` sabotages named functions so some tests fail.
const sum = (a, b) => (broken.has("sum") ? a - b : a + b);
const slug = (s) => (broken.has("slug") ? s.toLowerCase() : s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
const parsePort = (t) => { const n = Number(t); if (!Number.isInteger(n) || n < 1 || n > 65535) { if (broken.has("parse")) return NaN; throw new RangeError(`bad port ${t}`); } return n; };
// TODO: describe/test collect cases; run them; print TAP: `TAP version 13`, `ok N - name` / `not ok N - name` with a YAML diagnostic block, `1..N`, `# tests`, `# pass`, `# fail`
