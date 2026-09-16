"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Tokens: integers, decimals, `_` for a hole, anything else is a non-number element.
function kindAfter(kind, token) {
  // TODO: PACKED_SMI -> PACKED_DOUBLE -> PACKED_ELEMENTS, and PACKED -> HOLEY on a hole; transitions never go back
}
for (const line of lines) {
  // TODO: print `[tokens] => KIND -> KIND -> ...` (only when the kind changes), starting from PACKED_SMI
}
