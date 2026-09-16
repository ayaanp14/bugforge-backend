"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// A model of an <input>: attributes (the markup) and properties (live state), with the dirty-value flag the real DOM uses.
const el = { attributes: new Map(), value: "", dirty: false, checked: false, className: "", dataset: {} };
for (const line of lines) {
  const [cmd, a, ...rest] = line.trim().split(/\s+/);
  // TODO: setAttr | type | setProp | addClass | removeClass | toggleClass | data | get
}
