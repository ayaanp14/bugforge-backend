"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const evaluate = (src) => new Function(`return (${src});`)();   // the inputs are trusted JavaScript expressions
// Each line: `<expression> | <replacer expression or -> | <indent expression or ->`. Compare your stringify with the native one.
function stringify(value, replacer, indent) {
  const gap = typeof indent === "number" ? " ".repeat(Math.max(0, Math.min(10, indent))) : typeof indent === "string" ? indent.slice(0, 10) : "";
  const allow = Array.isArray(replacer) ? [...new Set(replacer.map(String))] : null;   // an array replacer is an allow-list, in ITS order
  const fn = typeof replacer === "function" ? replacer : null;
  const ESC = { '"': '\\"', "\\": "\\\\", "\b": "\\b", "\f": "\\f", "\n": "\\n", "\r": "\\r", "\t": "\\t" };
  const quote = (s) => '"' + s.replace(/[\\"\u0000-\u001f]/g, (c) => ESC[c] ?? "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")) + '"';
  const stack = [];
  const ser = (holder, key, value, depth) => {
    if (value !== null && typeof value === "object" && typeof value.toJSON === "function") value = value.toJSON(key);   // toJSON first (Dates)
    if (fn) value = fn.call(holder, key, value);                                // then the replacer
    if (value === null) return "null";
    if (value instanceof Number || value instanceof String || value instanceof Boolean) value = value.valueOf();
    switch (typeof value) {
      case "string": return quote(value);
      case "number": return Number.isFinite(value) ? String(value) : "null";
      case "boolean": return String(value);
      case "bigint": throw new TypeError("Do not know how to serialize a BigInt");
      case "undefined": case "function": case "symbol": return undefined;         // omitted from objects, null in arrays
    }
    if (stack.includes(value)) throw new TypeError("Converting circular structure to JSON");
    stack.push(value);
    const inner = gap.repeat(depth + 1), outer = gap.repeat(depth);
    let out;
    if (Array.isArray(value)) {
      const parts = value.map((v, i) => ser(value, String(i), v, depth + 1) ?? "null");
      out = parts.length === 0 ? "[]" : gap ? `[\n${inner}${parts.join(",\n" + inner)}\n${outer}]` : `[${parts.join(",")}]`;
    } else {
      const parts = [];
      for (const k of allow ?? Object.keys(value)) { const s = ser(value, k, value[k], depth + 1); if (s !== undefined) parts.push(`${quote(k)}:${gap ? " " : ""}${s}`); }
      out = parts.length === 0 ? "{}" : gap ? `{\n${inner}${parts.join(",\n" + inner)}\n${outer}}` : `{${parts.join(",")}}`;
    }
    stack.pop();
    return out;
  };
  return ser({ "": value }, "", value, 0);
}
const attempt = (f) => { try { return { out: f() }; } catch (e) { return { err: e.name }; } };
for (const line of lines) {
  const [src, replacerSrc = "-", indentSrc = "-"] = line.split("|").map((p) => p.trim());
  const value = evaluate(src), replacer = replacerSrc === "-" ? undefined : evaluate(replacerSrc), indent = indentSrc === "-" ? undefined : evaluate(indentSrc);
  const mine = attempt(() => stringify(value, replacer, indent)), native = attempt(() => JSON.stringify(value, replacer, indent));
  const same = "err" in mine ? mine.err === native.err : mine.out === native.out;
  console.log(`${"err" in mine ? `throws ${mine.err}` : `mine=${mine.out}`} match=${same}`);
}
