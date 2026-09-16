"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class DataCloneError extends Error { constructor(msg) { super(msg); this.name = "DataCloneError"; } }
function structuredClonePolyfill(value, seen = new Map()) {
  // TODO: primitives; functions/symbols -> DataCloneError; cycles via `seen`; Date, RegExp, Map, Set, Array, plain objects (class instances become plain objects)
}
