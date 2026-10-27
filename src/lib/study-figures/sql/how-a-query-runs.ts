import { finish, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { box } from "../../lesson-figures/kit.js";
import { cmp, rowsTable, rowTag, sqlCompare, type Row } from "./kit.js";

/**
 * How a query runs: the lesson's worked trace, run step by step.
 *
 *  - logical-order: `SELECT name, price * qty AS line_total FROM order_items
 *    WHERE price * qty >= 100 ORDER BY line_total DESC, item_id` over the
 *    lesson's four items, with the eight-step pipeline across the top lit at
 *    the step being run. WHERE computes each row's product and drops pen;
 *    SELECT makes the alias; ORDER BY sorts by it, item_id breaking the tie.
 *    The result is checked against the lesson's printed table.
 */

const ITEMS: Row[] = [
  { item_id: 1, name: "pen", price: 10, qty: 5 },
  { item_id: 2, name: "lamp", price: 60, qty: 2 },
  { item_id: 3, name: "desk", price: 150, qty: 1 },
  { item_id: 4, name: "ink", price: 40, qty: 3 },
];
const STEPS = ["FROM", "WHERE", "GROUP BY", "HAVING", "SELECT", "DISTINCT", "ORDER BY", "LIMIT"];

/** The eight logical steps as a strip of boxes, the current one lit and the skipped ones faint. */
export function pipeline(current: string, unused: readonly string[], y = 0): Item[] {
  const w = 66;
  return STEPS.map((s, i) => box(`st${i}`, i * (w + 4), y, s, { w, h: 24, size: 10.5, tone: s === current ? "strong" : unused.includes(s) ? "ghost" : "plain" }));
}

function logicalOrder(): Walkthrough {
  const total = (r: Row) => (r.price as number) * (r.qty as number);
  const kept = ITEMS.filter((r) => cmp(total(r), ">=", 100) === true);
  const out = kept.map((r) => ({ item_id: r.item_id, name: r.name, line_total: total(r) }));
  const sorted = [...out].sort((a, b) => -sqlCompare(a.line_total, b.line_total) || sqlCompare(a.item_id, b.item_id));
  const printed = ["desk 150", "lamp 120", "ink 120"];
  if (sorted.map((r) => `${r.name} ${r.line_total}`).join() !== printed.join()) throw new Error(`logical-order: result ${JSON.stringify(sorted)} disagrees with the lesson`);

  const unused = ["GROUP BY", "HAVING", "DISTINCT", "LIMIT"];
  const TY = 56;
  const from = (stage: "from" | "where"): Item[] => {
    const t = rowsTable("f", "order_items", ["item_id", "name", "price", "qty"], ITEMS, {
      y: TY,
      key: (r) => ITEMS[r]!.item_id as number,
      tone: (r) => (stage === "where" ? (kept.includes(ITEMS[r]!) ? "plain" : "error") : "plain"),
      w: { item_id: 64, name: 60, price: 56, qty: 44 },
    });
    const items: Item[] = [...pipeline(stage === "from" ? "FROM" : "WHERE", unused), ...t.items];
    if (stage === "where")
      ITEMS.forEach((r, i) => {
        const ok = kept.includes(r);
        items.push(rowTag(`w${r.item_id}`, t, i, `${r.price} × ${r.qty} = ${total(r)} → ${ok ? "kept" : "dropped"}`, { tone: ok ? "accent" : "error", weight: ok ? undefined : 600 }));
      });
    return items;
  };
  const selected = (stage: "select" | "order"): Item[] => {
    const rows = stage === "select" ? out : sorted;
    // Keyed by item_id, drawn in the stage's order: ORDER BY makes the rows glide.
    const t = rowsTable("s", "result", ["name", "line_total", "item_id"], rows, {
      y: TY,
      key: (r) => rows[r]!.item_id as number,
      tone: (_, c) => (c === 2 ? "ghost" : stage === "order" && c === 1 ? "accent" : "plain"),
      w: { name: 60, line_total: 84, item_id: 64 },
    });
    const items: Item[] = [...pipeline(stage === "select" ? "SELECT" : "ORDER BY", unused), ...t.items];
    if (stage === "select") items.push(rowTag("note", t, 0, "item_id: not shown, still carried", { tone: "soft" }));
    else {
      const tie = sorted.filter((r) => r.line_total === sorted[1]!.line_total);
      items.push(rowTag("note", t, 1, `tie at ${sorted[1]!.line_total}: item_id ${tie.map((r) => r.item_id).join(" < ")}`, { tone: "accent", weight: 600 }));
    }
    return items;
  };

  return finish({
    title: "The logical order: each step hands its rows to the next",
    input: "SELECT name, price * qty AS line_total FROM order_items WHERE price * qty >= 100 ORDER BY line_total DESC, item_id",
    frames: [
      { caption: `FROM runs first and produces the input: all ${ITEMS.length} rows of order_items. The query has no GROUP BY, HAVING, DISTINCT or LIMIT, so those steps pass the rows straight through.`, items: from("from") },
      {
        caption: `WHERE tests each row on its own. The alias line_total does not exist yet, so the condition repeats price * qty: pen gives ${total(ITEMS[0]!)} and is dropped; the other ${kept.length} rows move on.`,
        items: from("where"),
      },
      { caption: "SELECT computes the output columns and names line_total. The rows still remember item_id even though the select list does not show it.", items: selected("select") },
      {
        caption: `ORDER BY runs after SELECT, so it can use the alias: desk's ${sorted[0]!.line_total} first, then lamp and ink tied at ${sorted[1]!.line_total}, which item_id puts in order. The hidden column is dropped from what is printed.`,
        items: selected("order"),
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "logical-order": logicalOrder,
};
