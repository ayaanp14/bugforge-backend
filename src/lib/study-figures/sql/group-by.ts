import { finish, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { arrow } from "../../lesson-figures/kit.js";
import { rowsTable, rowTag, sqlCompare, type Row, type Table } from "./kit.js";

/**
 * GROUP BY: the lesson's five orders put into piles and collapsed.
 *
 *  - piles: `SELECT category, COUNT(*) AS orders, SUM(amount) AS revenue
 *    FROM orders GROUP BY category ORDER BY category`. The rows glide into
 *    one pile per category (a gap between piles), each pile's COUNT and SUM
 *    are computed from its rows, and the piles collapse to the three result
 *    rows the lesson prints (checked).
 */

export const ORDERS: Row[] = [
  { id: 1, category: "books", amount: 20 },
  { id: 2, category: "games", amount: 60 },
  { id: 3, category: "books", amount: 35 },
  { id: 4, category: "toys", amount: 15 },
  { id: 5, category: "games", amount: 40 },
];

export interface Group {
  key: string;
  rows: Row[];
  count: number;
  sum: number;
}

/** GROUP BY one column, groups in ascending key order, each with COUNT(*) and SUM(amount). */
export function groupBy(rows: readonly Row[], col: string): Group[] {
  const keys = [...new Set(rows.map((r) => r[col] as string))].sort((a, b) => sqlCompare(a, b));
  return keys.map((key) => {
    const rs = rows.filter((r) => r[col] === key);
    return { key, rows: rs, count: rs.length, sum: rs.reduce((s, r) => s + (r.amount as number), 0) };
  });
}

/** Rows laid out pile by pile: each row's slot, with one empty slot between piles. */
export function pileSlots(groups: readonly Group[]): Map<Row, number> {
  const at = new Map<Row, number>();
  let s = 0;
  groups.forEach((g, gi) => {
    if (gi > 0) s++;
    for (const r of g.rows) at.set(r, s++);
  });
  return at;
}

function piles(): Walkthrough {
  const groups = groupBy(ORDERS, "category");
  const printed = "books 2 55,games 2 100,toys 1 15";
  if (groups.map((g) => `${g.key} ${g.count} ${g.sum}`).join() !== printed) throw new Error(`piles: groups ${JSON.stringify(groups)} disagree with the lesson`);
  const at = pileSlots(groups);
  const firstSlot = (g: Group) => at.get(g.rows[0]!)!;

  const input = (stage: "rows" | "piles" | "sums"): { t: Table; items: Item[] } => {
    const t = rowsTable("o", "orders", ["id", "category", "amount"], ORDERS, {
      key: (r) => ORDERS[r]!.id as number,
      slot: (r) => (stage === "rows" ? r : at.get(ORDERS[r]!)!),
      tone: (_, c) => (stage !== "rows" && c === 1 ? "accent" : stage === "sums" && c === 2 ? "strong" : "plain"),
      w: { id: 40, category: 80, amount: 64 },
    });
    return { t, items: [...t.items] };
  };

  const draw = (stage: "rows" | "piles" | "sums" | "result"): Item[] => {
    const { t, items } = input(stage === "result" ? "sums" : stage);
    if (stage === "rows") return items;
    if (stage === "piles" || stage === "sums")
      groups.forEach((g) => {
        const top = t.rowY(firstSlot(g)) - 4;
        const h = g.rows.length * (t.h + 3) + 5;
        items.unshift({ k: "band", id: `g${g.key}`, x: t.left - 6, y: top, w: t.right - t.left + 12, h, tone: "ghost" });
        if (stage === "sums")
          items.push(rowTag(`s${g.key}`, t, firstSlot(g), `COUNT ${g.count} · SUM ${g.rows.map((r) => r.amount).join(" + ")} = ${g.sum}`, { tone: "accent", weight: 600 }));
      });
    if (stage === "result") {
      // The input fades to the background; the result sits to its right, one row per pile.
      const RX = t.right + 70;
      const r = rowsTable(
        "r",
        "result",
        ["category", "orders", "revenue"],
        groups.map((g) => ({ category: g.key, orders: g.count, revenue: g.sum })),
        { x: RX, key: (i) => groups[i]!.key, tone: () => "strong", w: { category: 80, orders: 58, revenue: 66 } },
      );
      const muted: Item[] = items.map((it) => (it.k === "cell" ? { ...it, tone: "muted" } : it));
      muted.push(...r.items);
      groups.forEach((g, i) => muted.push(arrow(`a${g.key}`, { x: t.right + 6, y: t.rowY(firstSlot(g)) + t.h / 2 }, { x: RX - 6, y: r.rowY(i) + r.h / 2 }, { tone: "accent" })));
      return muted;
    }
    return items;
  };

  return finish({
    title: "GROUP BY: one pile per value, one row per pile",
    input: "SELECT category, COUNT(*) AS orders, SUM(amount) AS revenue FROM orders GROUP BY category",
    frames: [
      { caption: `The ${ORDERS.length} orders as FROM and WHERE hand them on: each row on its own, categories mixed.`, items: draw("rows") },
      {
        caption: `GROUP BY category puts the rows into piles, one per distinct category: ${groups.map((g) => `${g.key} (${g.count})`).join(", ")}. A category no order has makes no pile.`,
        items: draw("piles"),
      },
      { caption: "The aggregates run once inside each pile: COUNT(*) counts its rows and SUM(amount) adds its amounts.", items: draw("sums") },
      {
        caption: `Each pile becomes one result row: ${ORDERS.length} rows in, ${groups.length} out. Only the grouping column and the aggregates have one value per pile, so only they can be selected.`,
        items: draw("result"),
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  piles,
};
