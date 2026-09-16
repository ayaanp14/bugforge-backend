"use strict";
const input = require("fs").readFileSync(0, "utf8");
// Exports described as JSON: primitives/arrays/objects are values; {"fn": <arity>} is a function; {"class": [fields], "methods": [names]} is a class.
const exportsMap = JSON.parse(input);
function inferType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    const members = [...new Set(value.map(inferType))];
    return members.length === 0 ? "unknown[]" : members.length === 1 ? `${members[0]}[]` : `(${members.join(" | ")})[]`;
  }
  if (typeof value === "object") return `{ ${Object.entries(value).map(([k, v]) => `${k}: ${inferType(v)}`).join("; ")} }`;
  return typeof value;
}
const out = [];
for (const [name, value] of Object.entries(exportsMap)) {
  if (value && typeof value === "object" && !Array.isArray(value) && typeof value.fn === "number") {
    const params = Array.from({ length: value.fn }, (_, i) => `arg${i}: unknown`).join(", ");
    out.push(`export declare function ${name}(${params}): unknown;`);
  } else if (value && typeof value === "object" && Array.isArray(value.class)) {
    const fields = value.class.map((f) => `  ${f}: unknown;`);
    const methods = (value.methods ?? []).map((m) => `  ${m}(): unknown;`);
    const members = [...fields, ...methods];
    out.push(members.length ? `export declare class ${name} {\n${members.join("\n")}\n}` : `export declare class ${name} {}`);
  } else {
    out.push(`export declare const ${name}: ${inferType(value)};`);
  }
}
console.log(out.join("\n"));
