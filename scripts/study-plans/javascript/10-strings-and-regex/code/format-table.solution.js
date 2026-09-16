"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact" });
const rows = lines.map((l) => { const [name, amount] = l.trim().split(/\s+/); return { name, amount: Number(amount) }; });
const total = rows.reduce((s, r) => s + r.amount, 0);
const nameWidth = Math.max(4, ...rows.map((r) => r.name.length));
const amounts = rows.map((r) => money.format(r.amount));
const amountWidth = Math.max(...amounts.map((a) => a.length), money.format(total).length, 6);
console.log(`${"Name".padEnd(nameWidth)} | ${"Amount".padStart(amountWidth)} | Share`);
console.log(`${"-".repeat(nameWidth)}-+-${"-".repeat(amountWidth)}-+------`);
rows.forEach((r, i) => console.log(`${r.name.padEnd(nameWidth)} | ${amounts[i].padStart(amountWidth)} | ${percent.format(total ? r.amount / total : 0).padStart(5)}`));
console.log(`${"Total".padEnd(nameWidth)} | ${money.format(total).padStart(amountWidth)} | ${percent.format(total ? 1 : 0).padStart(5)}`);
const de = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(total).replace(/[\u00a0\u202f]/g, " ");   // Intl separates number and symbol with a no-break space
console.log(`compact=${compact.format(total)} de=${de} toFixed=${total.toFixed(2)}`);
