"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const orders = lines.map((l) => {
  const [customer, item, qty, price, paid] = l.trim().split(/\s+/);
  return { customer, item, qty: Number(qty), price: Number(price), paid: paid === "y" };
});
// TODO
