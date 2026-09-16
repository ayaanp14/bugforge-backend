"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const sales = lines.map((l) => {
  const [region, product, qty, price] = l.trim().split(/\s+/);
  return { region, product, qty: Number(qty), price: Number(price), revenue: Number(qty) * Number(price) };
});
const byRegion = sales.reduce((acc, s) => { (acc[s.region] ??= []).push(s); return acc; }, {});
for (const region of Object.keys(byRegion).sort()) {
  const rows = byRegion[region];
  const revenue = rows.reduce((a, s) => a + s.revenue, 0);
  const items = rows.reduce((a, s) => a + s.qty, 0);
  const byProduct = rows.reduce((acc, s) => { acc[s.product] = (acc[s.product] ?? 0) + s.revenue; return acc; }, {});
  const top = Object.entries(byProduct).sort(([pa, ra], [pb, rb]) => rb - ra || pa.localeCompare(pb))[0][0];
  console.log(`${region}: revenue=${revenue} items=${items} top=${top}`);
}
console.log(`regions=${Object.keys(byRegion).length}`);
