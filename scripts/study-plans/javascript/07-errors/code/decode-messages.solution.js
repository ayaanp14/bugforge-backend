"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const rules = [
  [/Cannot read propert(?:y|ies) of (undefined|null) \(reading '(.+?)'\)/, "undefined-read", (m) => `the expression before .${m[2]} is ${m[1]}`],
  [/Cannot set propert(?:y|ies) of (undefined|null)/, "undefined-write", (m) => `assigning through ${m[1]} - the object was never created`],
  [/^(.+?) is not a function$/, "not-a-function", (m) => `${m[1]} holds data, a wrong import, or the wrong receiver`],
  [/^(.+?) is not defined$/, "not-defined", (m) => `no ${m[1]} in scope: typo or missing import`],
  [/Cannot access '(.+?)' before initialization/, "tdz", (m) => `${m[1]} is used before its let/const/class line runs`],
  [/Assignment to constant variable/, "const-assign", () => "you reassigned a const - use let, or mutate a property"],
  [/Maximum call stack size exceeded/, "stack-overflow", () => "unbounded recursion: check the base case"],
  [/Unexpected (?:token|end of JSON)|in JSON at position/, "json", () => "JSON.parse got text that is not JSON - log the raw text"],
  [/Converting circular structure to JSON/, "circular", () => "JSON.stringify met a cycle - break it or use a replacer"],
  [/Class constructor (.+?) cannot be invoked without 'new'/, "class-without-new", (m) => `call new ${m[1]}(...)`],
];
for (const line of lines) {
  const text = line.trim();
  const hit = rules.map(([re, category, hint]) => { const m = re.exec(text); return m && { category, hint: hint(m) }; }).find(Boolean);
  console.log(hit ? `${hit.category}: ${hit.hint}` : `unknown: read the top frame of the stack`);
}
