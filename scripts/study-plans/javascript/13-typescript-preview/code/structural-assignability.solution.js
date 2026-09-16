"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const schema = JSON.parse(lines[0]);      // { "name": "string", "email?": "string", "tags": "string[]" }
function matchesType(value, type) {
  if (type.endsWith("[]")) return Array.isArray(value) && value.every((v) => matchesType(v, type.slice(0, -2)));
  if (type === "null") return value === null;
  return typeof value === type;
}
function check(value, schema, { fresh }) {
  const problems = [];
  const known = new Set();
  for (const [rawKey, type] of Object.entries(schema)) {
    const optional = rawKey.endsWith("?");
    const key = optional ? rawKey.slice(0, -1) : rawKey;
    known.add(key);
    if (!(key in value)) { if (!optional) problems.push(`Property '${key}' is missing`); continue; }
    if (!matchesType(value[key], type)) problems.push(`Type '${typeOfValue(value[key])}' is not assignable to type '${type}' at '${key}'`);
  }
  if (fresh) for (const key of Object.keys(value)) if (!known.has(key)) problems.push(`Object literal may only specify known properties, and '${key}' does not exist`);   // excess property check: fresh literals only
  return problems;
}
const typeOfValue = (v) => (v === null ? "null" : Array.isArray(v) ? `${[...new Set(v.map(typeOfValue))].join(" | ") || "never"}[]` : typeof v);
for (const line of lines.slice(1)) {
  const [mode, ...rest] = line.trim().split(/\s+/);
  const value = JSON.parse(rest.join(" "));
  const problems = check(value, schema, { fresh: mode === "fresh" });
  console.log(`${mode} ${JSON.stringify(value)}: ${problems.length ? `not assignable - ${problems.join("; ")}` : "ok"}`);
}
