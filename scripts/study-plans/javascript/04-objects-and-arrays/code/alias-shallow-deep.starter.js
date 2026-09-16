"use strict";
const original = JSON.parse(require("fs").readFileSync(0, "utf8"));
const alias = original;
const shallow = { ...original };
function deepClone(v) {
  // TODO: arrays and plain objects recursively, primitives as-is
  return v;
}
const deep = deepClone(original);
// TODO: mutate original.n and original.inner.x and push to original.list, then report
