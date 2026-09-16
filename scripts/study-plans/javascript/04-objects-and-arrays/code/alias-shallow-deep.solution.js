"use strict";
const original = JSON.parse(require("fs").readFileSync(0, "utf8"));
const alias = original;
const shallow = { ...original };
function deepClone(v) {
  if (Array.isArray(v)) return v.map(deepClone);
  if (v !== null && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deepClone(x)]));
  return v;
}
const deep = deepClone(original);
original.n = 99;
original.inner.x = 99;
original.list.push(99);
for (const [label, o] of [["alias", alias], ["shallow", shallow], ["deep", deep]]) {
  console.log(`${label}: n=${o.n} inner.x=${o.inner.x} list=${JSON.stringify(o.list)}`);
}
console.log(`shallowSharesInner=${shallow.inner === original.inner} deepSharesInner=${deep.inner === original.inner}`);
