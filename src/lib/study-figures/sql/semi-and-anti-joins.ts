import { finish, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { arrow } from "../../lesson-figures/kit.js";
import { cmp, rowEdge, rowsTable, rowTag, show, type Row } from "./kit.js";
import { expectRows, joinPairs } from "./join-walk.js";
import { CUSTOMERS, ORDERS } from "./inner-join.js";

/**
 * Semi and anti joins on the joins module's tables: a plain JOIN repeats
 * Asha once per order, EXISTS asks only whether a first matching order
 * exists — so each customer appears at most once and the search stops at
 * that first match — and NOT EXISTS keeps the customers with none.
 */

const match = (c: Row, o: Row) => cmp(o.customer_id ?? null, "=", c.id ?? null);

function existsVsJoin(): Walkthrough {
  const pairs = joinPairs(CUSTOMERS, ORDERS, match, "inner").map(([i, j]) => [i!, j!] as [number, number]);
  const firstMatch = CUSTOMERS.map((c) => ORDERS.findIndex((o) => match(c, o) === true));
  const semi = CUSTOMERS.filter((_, i) => firstMatch[i]! >= 0);
  const anti = CUSTOMERS.filter((_, i) => firstMatch[i]! < 0);
  expectRows("exists-vs-join JOIN", pairs.map(([i]) => [CUSTOMERS[i]!.id ?? null, CUSTOMERS[i]!.name ?? null]), [[1, "Asha"], [1, "Asha"], [2, "Ben"]]);
  expectRows("exists-vs-join EXISTS", semi.map((c) => [c.id ?? null, c.name ?? null]), [[1, "Asha"], [2, "Ben"]]);
  if (anti.length !== 1 || anti[0]!.name !== "Chen") throw new Error("exists-vs-join: the anti join keeps only Chen");
  const asha = CUSTOMERS[0]!;
  const ashaOrders = pairs.filter(([i]) => i === 0).map(([, j]) => ORDERS[j]!);
  const OX = 220;

  const draw = (stage: "join" | "probe" | "exists" | "not"): Item[] => {
    const c = rowsTable("c", "customers c", ["id", "name"], CUSTOMERS, {
      w: { id: 34, name: 60 },
      tone: (r) => (stage === "probe" ? (r === 0 ? "accent" : "plain") : stage === "exists" ? (firstMatch[r]! >= 0 ? "accent" : "muted") : stage === "not" ? (firstMatch[r]! < 0 ? "accent" : "muted") : "plain"),
    });
    const o = rowsTable("o", "orders o", ["id", "customer_id"], ORDERS, {
      x: OX,
      w: { id: 40, customer_id: 96 },
      tone: (r) => (stage === "probe" ? (r === firstMatch[0] ? "accent" : ORDERS[r]!.customer_id === asha.id ? "ghost" : "plain") : "plain"),
    });
    const items: Item[] = [...c.items, ...o.items];
    const lines = stage === "join" ? pairs : stage === "probe" ? pairs.filter(([i, j]) => i === 0 && j === firstMatch[0]) : stage === "exists" ? CUSTOMERS.flatMap((_, i) => (firstMatch[i]! >= 0 ? [[i, firstMatch[i]!] as [number, number]] : [])) : [];
    lines.forEach(([i, j]) => items.push(arrow(`m${i}-${j}`, rowEdge(c, i, "right"), rowEdge(o, j, "left"), { tone: "accent", head: false })));
    if (stage === "probe") items.push(rowTag("skip", o, ORDERS.indexOf(ashaOrders[1]!), "never looked at", { tone: "faint" }));
    if (stage === "not") items.push(rowTag("none", c, 2, "no order: kept", { tone: "accent", weight: 600, dx: 8 }));
    const y = Math.max(c.bottom, o.bottom) + 30;
    if (stage === "probe") return items;
    const rows = stage === "join" ? pairs.map(([i, j]) => ({ key: `${i}.${j}`, row: CUSTOMERS[i]! })) : (stage === "exists" ? semi : anti).map((r) => ({ key: `${r.id}`, row: r }));
    const t = rowsTable("r", stage === "join" ? "JOIN: one row per pair" : stage === "exists" ? "WHERE EXISTS (…)" : "WHERE NOT EXISTS (…)", ["id", "name"], rows.map((x) => x.row), {
      y,
      key: (r) => rows[r]!.key,
      w: { id: 34, name: 60 },
      tone: (r) => (stage === "join" && rows[r]!.row === asha ? "error" : "strong"),
    });
    items.push(...t.items);
    if (stage === "join") items.push(rowTag("dup", t, 1, `${show(asha.name)} again: a second order`, { tone: "error", weight: 600 }));
    return items;
  };

  return finish({
    title: "Semi and anti joins: does a match exist?",
    input: "customers c WHERE [NOT] EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)",
    frames: [
      {
        caption: `A plain JOIN answers "list the (customer, order) pairs": ${show(asha.name)} has ${ashaOrders.length} orders, so she appears ${ashaOrders.length} times. The question was "list the customers".`,
        items: draw("join"),
      },
      {
        caption: `EXISTS asks only whether one matching row exists. For ${show(asha.name)} the search stops at order ${show(ashaOrders[0]!.id)}; order ${show(ashaOrders[1]!.id)} is never needed.`,
        items: draw("probe"),
      },
      { caption: `So each customer appears at most once: ${semi.map((r) => show(r.name)).join(" and ")}. ${anti.map((r) => show(r.name)).join(", ")}, with no order, is left out. That is a semi join.`, items: draw("exists") },
      { caption: `NOT EXISTS keeps exactly the customers the semi join left out: ${anti.map((r) => show(r.name)).join(", ")}. That is the anti join, and unlike NOT IN it is safe when orders.customer_id holds a NULL.`, items: draw("not") },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "exists-vs-join": existsVsJoin,
};
