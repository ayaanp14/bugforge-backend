"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const rows = lines.map((l) => { const [name, amount] = l.trim().split(/\s+/); return { name, amount: Number(amount) }; });
// TODO: aligned table with padEnd/padStart, total, share of total as a percentage, compact notation
