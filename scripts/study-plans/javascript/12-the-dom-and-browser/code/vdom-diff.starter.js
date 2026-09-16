"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const [oldTree, newTree] = lines.map((l) => JSON.parse(l));
function diff(a, b, path, patches) {
  // TODO: REPLACE | TEXT | PROPS (+k=v, -k, ~k=v) | INSERT | REMOVE — recurse into children by index
}
const patches = [];
diff(oldTree, newTree, "root", patches);
console.log(patches.length ? patches.join("\n") : "no changes");
