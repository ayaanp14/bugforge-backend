"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// A schema is { key: type } with a trailing ? for optional and a leading `readonly ` for readonly.
const schema = JSON.parse(lines[0]);
const print = (s) => `{ ${Object.entries(s).map(([k, t]) => `${k}: ${t}`).join("; ")} }`;
const base = (k) => k.replace(/^readonly /, "").replace(/\?$/, "");
const utilities = {
  Partial: (s) => Object.fromEntries(Object.entries(s).map(([k, t]) => [k.endsWith("?") ? k : `${k}?`, t])),
  Required: (s) => Object.fromEntries(Object.entries(s).map(([k, t]) => [k.replace(/\?$/, ""), t])),
  Readonly: (s) => Object.fromEntries(Object.entries(s).map(([k, t]) => [k.startsWith("readonly ") ? k : `readonly ${k}`, t])),
  Pick: (s, keys) => {
    for (const key of keys) if (!Object.keys(s).some((k) => base(k) === key)) throw new TypeError(`Type '"${key}"' does not satisfy the constraint 'keyof T'`);
    return Object.fromEntries(Object.entries(s).filter(([k]) => keys.includes(base(k))));
  },
  Omit: (s, keys) => Object.fromEntries(Object.entries(s).filter(([k]) => !keys.includes(base(k)))),
  Record: (_s, [k, v]) => ({ [`[key in ${k}]`]: v }),
  keyof: (s) => Object.keys(s).map((k) => `"${base(k)}"`).join(" | ") || "never",
};
for (const line of lines.slice(1)) {
  try {
    let current = schema;
    for (const step of line.split("|").map((s) => s.trim()).filter(Boolean)) {
      const [name, ...args] = step.split(/\s+/);
      if (!utilities[name]) throw new TypeError(`unknown utility '${name}'`);
      current = utilities[name](current, args);
    }
    console.log(`${line.trim()} => ${typeof current === "string" ? current : print(current)}`);
  } catch (err) {
    console.log(`${line.trim()} => error: ${err.message}`);
  }
}
