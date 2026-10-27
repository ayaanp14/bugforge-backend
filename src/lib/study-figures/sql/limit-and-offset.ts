import { finish, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { label } from "../../lesson-figures/kit.js";
import { rowsTable, rowTag, sqlCompare, sqlLine, type Row } from "./kit.js";

/**
 * LIMIT and OFFSET: a slice taken from the sorted result.
 *
 *  - pages: eight orders — the lesson's top three (Ravi 4200, Anita 3900,
 *    Sam 2750, checked) and five more for the later pages — sorted by
 *    `total DESC, id`, then a three-row window: LIMIT 3, LIMIT 3 OFFSET 3,
 *    LIMIT 3 OFFSET 6 (only two rows left: LIMIT is "at most") and an offset
 *    past the end (no rows, not an error). Rows are keyed by id and glide
 *    from storage order into the sort.
 */

const ORDERS: Row[] = [
  { id: 2, customer: "Dev", total: 1500 },
  { id: 3, customer: "Anita", total: 3900 },
  { id: 5, customer: "Meera", total: 2100 },
  { id: 7, customer: "Tara", total: 900 },
  { id: 9, customer: "Sam", total: 2750 },
  { id: 11, customer: "Kiran", total: 1800 },
  { id: 12, customer: "Omar", total: 650 },
  { id: 14, customer: "Ravi", total: 4200 },
];
const PAGE = 3;

function pages(): Walkthrough {
  const sorted = [...ORDERS].sort((a, b) => -sqlCompare(a.total ?? null, b.total ?? null) || sqlCompare(a.id ?? null, b.id ?? null));
  const top = sorted.slice(0, PAGE).map((r) => `${r.id} ${r.customer} ${r.total}`);
  if (top.join() !== "14 Ravi 4200,3 Anita 3900,9 Sam 2750") throw new Error(`pages: top three ${top.join()} disagree with the lesson`);
  const slice = (offset: number) => sorted.slice(offset, offset + PAGE);

  const draw = (stage: "stored" | "sorted" | number, clause: string): Item[] => {
    const rows = stage === "stored" ? ORDERS : sorted;
    const offset = typeof stage === "number" ? stage : null;
    const inWindow = (i: number) => offset !== null && i >= offset && i < offset + PAGE;
    const t = rowsTable("o", "orders", ["id", "customer", "total"], ORDERS, {
      y: 22,
      key: (r) => ORDERS[r]!.id as number,
      slot: (r) => rows.indexOf(ORDERS[r]!),
      tone: (r) => {
        const i = rows.indexOf(ORDERS[r]!);
        if (offset === null) return "plain";
        return inWindow(i) ? "strong" : i < offset ? "muted" : "plain";
      },
      w: { id: 44, customer: 80, total: 64 },
    });
    const items: Item[] = [sqlLine("q", clause, 0, 0, { weight: 600 }), ...t.items];
    if (offset !== null) {
      const got = slice(offset).length;
      // The window: a band behind the rows it keeps (or, past the end, the empty place where they would be).
      const from = Math.min(offset, sorted.length);
      const rowsIn = Math.max(got, 1);
      items.unshift({ k: "band", id: "win", x: t.left - 5, y: t.rowY(from) - 4, w: t.right - t.left + 10, h: rowsIn * (t.h + 3) + 5, tone: got ? "accent" : "ghost" });
      if (offset > 0 && offset <= sorted.length) items.push(rowTag("skip", t, offset - 1, `OFFSET ${offset}: ${offset} skipped`, { tone: "faint" }));
      items.push(
        got
          ? rowTag("take", t, from, `LIMIT ${PAGE}: rows ${offset + 1}–${offset + got}${got < PAGE ? ` (only ${got} left)` : ""}`, { tone: "accent", weight: 600 })
          : label("take", "no rows — an empty result, not an error", t.right + 12, t.rowY(sorted.length) + t.h / 2, { anchor: "start", tone: "accent", size: 11.5, mono: true, weight: 600 }),
      );
    }
    sorted.forEach((_, i) => stage !== "stored" && items.push(label(`n${i}`, String(i + 1), t.left - 12, t.rowY(i) + t.h / 2, { tone: "faint", size: 10.5, mono: true })));
    return items;
  };

  const past = sorted.length + 1;
  return finish({
    title: "LIMIT keeps a slice of the sorted rows; OFFSET says where it starts",
    input: "SELECT id, customer, total FROM orders ORDER BY total DESC, id LIMIT 3 OFFSET …",
    frames: [
      { caption: `The ${ORDERS.length} orders as storage hands them back. A LIMIT on this would take some three rows — whichever came first today.`, items: draw("stored", "SELECT id, customer, total FROM orders") },
      { caption: "ORDER BY total DESC, id runs before LIMIT and decides which rows are first. id breaks any tie, so the order is the same on every run.", items: draw("sorted", "ORDER BY total DESC, id") },
      { caption: `LIMIT 3 is the very last step: it keeps the first three sorted rows — the top three orders, led by ${sorted[0]!.customer} at ${sorted[0]!.total}.`, items: draw(0, "… LIMIT 3") },
      { caption: "OFFSET 3 skips three rows first, counting from zero, and LIMIT counts from there: rows 4 to 6, the second page.", items: draw(PAGE, "… LIMIT 3 OFFSET 3") },
      { caption: `OFFSET 6 leaves only ${slice(2 * PAGE).length} rows. LIMIT means at most, so the third page is short rather than padded or an error.`, items: draw(2 * PAGE, "… LIMIT 3 OFFSET 6") },
      { caption: `An offset past the end, OFFSET ${past} on ${sorted.length} rows, skips everything: the result is the column headings and no rows.`, items: draw(past, `… LIMIT 3 OFFSET ${past}`) },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  pages,
};
