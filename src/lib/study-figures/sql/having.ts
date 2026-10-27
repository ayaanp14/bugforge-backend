import { finish, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { cmp, rowsTable, rowTag } from "./kit.js";
import { groupBy, ORDERS, pileSlots } from "./group-by.js";
import { pipeline } from "./how-a-query-runs.js";

/**
 * HAVING: WHERE filters rows before grouping, HAVING filters groups after.
 *
 *  - where-vs-having: the group-by lesson's five orders through
 *    `WHERE amount >= 20 GROUP BY category HAVING SUM(amount) > 60`, with the
 *    logical pipeline lit at each step. WHERE drops the toys row on its own
 *    amount; GROUP BY piles what is left; HAVING sees each pile's SUM and
 *    drops books (55); one group survives. Every verdict is computed.
 */

const MIN_AMOUNT = 20;
const MIN_SUM = 60;

function whereVsHaving(): Walkthrough {
  const rowOk = (amount: number) => cmp(amount, ">=", MIN_AMOUNT) === true;
  const kept = ORDERS.filter((r) => rowOk(r.amount as number));
  const groups = groupBy(kept, "category");
  const passing = groups.filter((g) => cmp(g.sum, ">", MIN_SUM) === true);
  const dropped = ORDERS.filter((r) => !kept.includes(r));
  if (dropped.length !== 1 || passing.length !== 1 || groups.length - passing.length !== 1) throw new Error("where-vs-having: expected WHERE and HAVING each to drop one thing");
  const at = pileSlots(groups);
  const unused = ["DISTINCT", "LIMIT", "ORDER BY"];
  const TY = 56;

  const draw = (step: "FROM" | "WHERE" | "GROUP BY" | "HAVING" | "SELECT"): Item[] => {
    const items: Item[] = [...pipeline(step, unused)];
    if (step === "SELECT") {
      const r = rowsTable("r", "result", ["category", "revenue"], passing.map((g) => ({ category: g.key, revenue: g.sum })), {
        y: TY,
        key: (i) => passing[i]!.key,
        tone: () => "strong",
        w: { category: 80, revenue: 66 },
      });
      items.push(...r.items, rowTag("n", r, 0, `${ORDERS.length} rows → ${kept.length} rows → ${groups.length} groups → ${passing.length} row`, { tone: "soft" }));
      return items;
    }
    const piled = step === "GROUP BY" || step === "HAVING";
    const rows = step === "FROM" || step === "WHERE" ? ORDERS : kept;
    const t = rowsTable("o", "orders", ["id", "category", "amount"], rows, {
      y: TY,
      key: (r) => rows[r]!.id as number,
      slot: (r) => (piled ? at.get(rows[r]!)! : r),
      tone: (r, c) => {
        const row = rows[r]!;
        if (step === "WHERE") return rowOk(row.amount as number) ? (c === 2 ? "accent" : "plain") : "error";
        if (step === "HAVING") return passing.some((g) => g.rows.includes(row)) ? (c === 2 ? "strong" : "plain") : "muted";
        return piled && c === 1 ? "accent" : "plain";
      },
      w: { id: 40, category: 80, amount: 64 },
    });
    items.push(...t.items);
    if (step === "WHERE")
      ORDERS.forEach((r, i) => {
        const ok = rowOk(r.amount as number);
        items.push(rowTag(`w${r.id}`, t, i, `${r.amount} >= ${MIN_AMOUNT}: ${ok ? "TRUE" : "FALSE, dropped"}`, { tone: ok ? "soft" : "error", weight: ok ? undefined : 600 }));
      });
    if (piled)
      groups.forEach((g) => {
        const first = at.get(g.rows[0]!)!;
        items.unshift({ k: "band", id: `g${g.key}`, x: t.left - 6, y: t.rowY(first) - 4, w: t.right - t.left + 12, h: g.rows.length * (t.h + 3) + 5, tone: "ghost" });
        if (step === "HAVING") {
          const ok = passing.includes(g);
          items.push(rowTag(`h${g.key}`, t, first, `SUM = ${g.sum} > ${MIN_SUM}: ${ok ? "TRUE, kept" : "FALSE, dropped"}`, { tone: ok ? "accent" : "error", weight: 600 }));
        }
      });
    return items;
  };

  const lone = dropped[0]!;
  const lost = groups.find((g) => !passing.includes(g))!;
  return finish({
    title: "WHERE filters rows before grouping; HAVING filters groups after",
    input: `WHERE amount >= ${MIN_AMOUNT} GROUP BY category HAVING SUM(amount) > ${MIN_SUM}`,
    frames: [
      { caption: `FROM hands on all ${ORDERS.length} orders. Two filters follow, and the pipeline across the top says when each one runs.`, items: draw("FROM") },
      {
        caption: `WHERE runs before any grouping and sees one row at a time, so it can only test that row's own columns. The ${lone.category} order of ${lone.amount} fails and never reaches a group.`,
        items: draw("WHERE"),
      },
      { caption: `GROUP BY piles the ${kept.length} surviving rows by category. Only now do totals exist — which is why WHERE SUM(amount) > ${MIN_SUM} would be an error.`, items: draw("GROUP BY") },
      {
        caption: `HAVING runs after grouping and sees each finished group with its aggregates. ${lost.key} adds up to ${lost.sum}, not more than ${MIN_SUM}, so the whole group goes.`,
        items: draw("HAVING"),
      },
      { caption: `SELECT prints one row per surviving group. Row conditions belong in WHERE, where they shrink the work early; HAVING is for conditions only a group can answer.`, items: draw("SELECT") },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "where-vs-having": whereVsHaving,
};
