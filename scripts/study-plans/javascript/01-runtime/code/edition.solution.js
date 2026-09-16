"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const editions = new Map([
  ["let-const", 2015], ["arrow-functions", 2015], ["promises", 2015], ["async-await", 2017],
  ["flat", 2019], ["optional-chaining", 2020], ["nullish-coalescing", 2020], ["bigint", 2020],
  ["replaceAll", 2021], ["class-fields", 2022], ["at", 2022], ["top-level-await", 2022],
]);
const n = Number(tokens[0]);
let es6 = 0;
for (let i = 1; i <= n; i++) {
  const feature = tokens[i];
  const year = editions.get(feature);
  console.log(year === undefined ? `${feature}: unknown` : `${feature}: ES${year}`);
  if (year === 2015) es6++;
}
console.log(`es6=${es6}`);
