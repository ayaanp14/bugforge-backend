"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const ORDER = ["string", "number", "boolean", "null", "undefined"];
function typeOf(value, { literal = false, readonly = false } = {}) {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return literal ? JSON.stringify(value) : "string";
  if (typeof value === "number") return literal ? String(value) : "number";
  if (typeof value === "boolean") return literal ? String(value) : "boolean";
  if (Array.isArray(value)) {
    if (readonly) return `readonly [${value.map((v) => typeOf(v, { literal, readonly })).join(", ")}]`;   // as const: a readonly tuple
    const members = [...new Set(value.map((v) => typeOf(v, { literal: false, readonly })))].sort((a, b) => (ORDER.indexOf(a) === -1 ? 99 : ORDER.indexOf(a)) - (ORDER.indexOf(b) === -1 ? 99 : ORDER.indexOf(b)));
    if (members.length === 0) return "never[]";
    return members.length === 1 ? `${members[0]}[]` : `(${members.join(" | ")})[]`;
  }
  const props = Object.entries(value).map(([k, v]) => `${readonly ? "readonly " : ""}${k}: ${typeOf(v, { literal, readonly })}`);
  return props.length ? `{ ${props.join("; ")} }` : "{}";
}
for (const line of lines) {
  // TODO: parse `const|let <name> = <json-ish> [as const]`; const keeps literals for primitives, let widens; as const → readonly + literals
}
