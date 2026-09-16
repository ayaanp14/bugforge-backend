"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Schema DSL on line 1:  name:string age:number email?:string tags:string[] role:"admin"|"user"
function compileType(text) {
  if (text.endsWith("[]")) return { kind: "array", of: compileType(text.slice(0, -2)) };
  if (text.startsWith("\"")) return { kind: "literal", values: text.split("|").map((v) => JSON.parse(v)) };
  if (["string", "number", "boolean"].includes(text)) return { kind: text };
  throw new SyntaxError(`unknown type '${text}'`);
}
function compile(dsl) {
  return dsl.trim().split(/\s+/).map((field) => {
    const [rawKey, type] = field.split(":");
    return { key: rawKey.replace(/\?$/, ""), optional: rawKey.endsWith("?"), type: compileType(type) };
  });
}
function typeText(t) {
  if (t.kind === "array") return `${t.of.kind === "literal" ? `(${typeText(t.of)})` : typeText(t.of)}[]`;
  if (t.kind === "literal") return t.values.map((v) => JSON.stringify(v)).join(" | ");
  return t.kind;
}
const toType = (schema) => `{ ${schema.map((f) => `${f.key}${f.optional ? "?" : ""}: ${typeText(f.type)}`).join("; ")} }`;
function checkType(value, t, path, errors) {
  if (t.kind === "array") { if (!Array.isArray(value)) errors.push(`${path}: expected ${typeText(t)}`); else value.forEach((v, i) => checkType(v, t.of, `${path}[${i}]`, errors)); return; }
  if (t.kind === "literal") { if (!t.values.includes(value)) errors.push(`${path}: expected ${typeText(t)}, got ${JSON.stringify(value)}`); return; }
  if (typeof value !== t.kind) errors.push(`${path}: expected ${t.kind}, got ${value === null ? "null" : Array.isArray(value) ? "array" : typeof value}`);
}
function parse(schema, value) {
  const errors = [];
  if (value === null || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: ["<root>: expected an object"] };
  for (const f of schema) {
    if (!(f.key in value)) { if (!f.optional) errors.push(`${f.key}: required`); continue; }
    checkType(value[f.key], f.type, f.key, errors);
  }
  return errors.length ? { ok: false, errors } : { ok: true, value };
}
const schema = compile(lines[0]);
console.log(`type = ${toType(schema)}`);
for (const line of lines.slice(1)) {
  let value;
  try { value = JSON.parse(line); } catch { console.log("error <root>: invalid JSON"); continue; }
  const r = parse(schema, value);
  console.log(r.ok ? `ok ${JSON.stringify(r.value)}` : `error ${r.errors.join(" | ")}`);
}
