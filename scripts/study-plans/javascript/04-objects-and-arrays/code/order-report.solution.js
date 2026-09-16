"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const orders = lines.map((l) => {
  const [customer, item, qty, price, paid] = l.trim().split(/\s+/);
  return { customer, item, qty: Number(qty), price: Number(price), paid: paid === "y" };
});
const paid = orders.filter((o) => o.paid);
const revenue = paid.reduce((sum, o) => sum + o.qty * o.price, 0);
const byCustomer = paid.reduce((acc, o) => { acc[o.customer] = (acc[o.customer] ?? 0) + o.qty * o.price; return acc; }, {});
console.log(`revenue=${revenue.toFixed(2)}`);
for (const [customer, total] of Object.entries(byCustomer).sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`${customer}: ${total.toFixed(2)}`);
}
const top = Object.entries(byCustomer).reduce((best, e) => (best === null || e[1] > best[1] ? e : best), null);
console.log(`top=${top ? top[0] : "none"} unpaid=${orders.length - paid.length}`);
