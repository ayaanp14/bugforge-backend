"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const reads = Number(lines[0]);
let builds = 0;
const buildLogger = () => { builds++; return { level: "info" }; };
const once = (fn) => {
  // TODO
};
// TODO: eager default vs thunk default; once; a lazy getter; a LazyList with map/filter/take/toArray counting evaluations
