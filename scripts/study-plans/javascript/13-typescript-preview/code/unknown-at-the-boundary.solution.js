"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function assertNever(x) { throw new Error(`unhandled value: ${JSON.stringify(x)}`); }
function handle(data /* : unknown */) {
  if (data === null) return "null: nothing to do";
  if (typeof data === "string") return `string: ${data.length} chars, upper=${data.toUpperCase()}`;
  if (typeof data === "number") return Number.isFinite(data) ? `number: ${data.toFixed(2)}` : "number: not finite";
  if (typeof data === "boolean") return `boolean: ${data ? "yes" : "no"}`;
  if (Array.isArray(data)) return `array: ${data.length} items, first=${JSON.stringify(data[0])}`;
  if (typeof data === "object" && "kind" in data) {
    switch (data.kind) {
      case "circle": return `Shape circle: area=${(Math.PI * data.r ** 2).toFixed(2)}`;
      case "square": return `Shape square: area=${data.s ** 2}`;
      default: return assertNever(data);              // a kind the types did not anticipate
    }
  }
  return `object: keys=${Object.keys(data).join(",") || "(none)"}`;
}
for (const line of lines) {
  try {
    const data = JSON.parse(line);                     // any in the library types — treat it as unknown from here
    console.log(`narrowed to ${handle(data)}`);
  } catch (err) {
    console.log(`error: ${err instanceof SyntaxError ? "invalid JSON" : err.message}`);   // catch binds unknown: narrow before reading
  }
}
