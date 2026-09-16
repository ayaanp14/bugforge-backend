"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const sales = lines.map((l) => {
  const [region, product, qty, price] = l.trim().split(/\s+/);
  return { region, product, qty: Number(qty), price: Number(price), revenue: Number(qty) * Number(price) };
});
// TODO
