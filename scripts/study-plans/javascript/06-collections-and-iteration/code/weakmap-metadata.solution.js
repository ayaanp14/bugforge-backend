"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const registry = new Map();     // name -> object (strong: the program owns these)
const meta = new WeakMap();     // object -> tags (weak: goes away with the object)
for (const line of lines) {
  const [cmd, a, b] = line.trim().split(/\s+/);
  try {
    if (cmd === "make") registry.set(a, { name: a });
    else if (cmd === "tag") {
      const obj = registry.get(a);
      if (!meta.has(obj)) meta.set(obj, []);
      meta.get(obj).push(b);
    } else if (cmd === "untag") console.log(`untag ${a} -> ${meta.delete(registry.get(a))}`);
    else if (cmd === "info") {
      const obj = registry.get(a);
      console.log(`${a}: tags=${meta.has(obj) ? meta.get(obj).join(",") : "none"} keys=${Object.keys(obj).join(",")}`);
    } else if (cmd === "tagprim") meta.set(Number(a), [b]);
  } catch (e) {
    console.log(`error: ${e.message}`);
  }
}
