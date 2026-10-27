import { finish, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { label } from "../../lesson-figures/kit.js";
import { rowsTable, rowTag, type Row } from "./kit.js";

/**
 * Composite indexes: the lesson's idx_orders_cust_date (customer_id, placed_on) → id.
 *
 *  - leftmost-prefix: the entries sorted by both columns (sorted here from
 *    the orders, not typed in), then three searches on them. A search can
 *    seek only when its matches form one contiguous run of entries — checked
 *    for each search: customer_id = 3 does, customer_id = 3 with a date
 *    range does (a shorter run), placed_on alone does not.
 */

const ORDERS: Row[] = [
  { id: 4, customer_id: 5, placed_on: "2024-01-07" },
  { id: 17, customer_id: 3, placed_on: "2024-02-14" },
  { id: 21, customer_id: 3, placed_on: "2024-03-02" },
  { id: 22, customer_id: 7, placed_on: "2024-03-02" },
  { id: 26, customer_id: 5, placed_on: "2024-03-11" },
  { id: 30, customer_id: 3, placed_on: "2024-03-19" },
];

function leftmostPrefix(): Walkthrough {
  const entries = [...ORDERS].sort((a, b) => (a.customer_id as number) - (b.customer_id as number) || String(a.placed_on).localeCompare(String(b.placed_on)));
  if (entries.map((e) => e.id).join() !== "17,21,30,4,26,22") throw new Error("leftmost-prefix: the sorted entries disagree with the lesson's listing");

  const matches = (f: (r: Row) => boolean) => entries.map((r, i) => (f(r) ? i : -1)).filter((i) => i >= 0);
  const contiguous = (ix: number[]) => ix.length > 0 && ix[ix.length - 1]! - ix[0]! === ix.length - 1;
  const q1 = matches((r) => r.customer_id === 3);
  const q2 = matches((r) => r.customer_id === 3 && String(r.placed_on) >= "2024-03-01");
  const q3 = matches((r) => r.placed_on === "2024-03-02");
  if (!contiguous(q1) || !contiguous(q2) || contiguous(q3)) throw new Error("leftmost-prefix: contiguity is not what the lesson claims");

  const draw = (hit: number[] | null, seek: boolean, note: string): Item[] => {
    const t = rowsTable("i", "idx_orders_cust_date", ["customer_id", "placed_on", "id"], entries, {
      key: (r) => entries[r]!.id as number,
      tone: (r) => (hit === null ? "plain" : hit.includes(r) ? (seek ? "strong" : "accent") : seek ? "muted" : "plain"),
      w: { customer_id: 92, placed_on: 92, id: 44 },
    });
    const items: Item[] = [...t.items];
    if (hit === null) {
      // The customer groups.
      for (const c of [...new Set(entries.map((e) => e.customer_id as number))]) {
        const rows = matches((r) => r.customer_id === c);
        items.push({ k: "band", id: `g${c}`, x: t.left - 5, y: t.rowY(rows[0]!) - 3, w: t.right - t.left + 10, h: t.rowY(rows[rows.length - 1]!) + t.h - t.rowY(rows[0]!) + 6, tone: "ghost" });
        items.push(rowTag(`gl${c}`, t, rows[0]!, `customer ${c}: dates in order`, { tone: "soft" }));
      }
    } else if (seek) {
      items.push({ k: "band", id: "run", x: t.left - 5, y: t.rowY(hit[0]!) - 3, w: t.right - t.left + 10, h: t.rowY(hit[hit.length - 1]!) + t.h - t.rowY(hit[0]!) + 6, tone: "accent" });
      items.push(rowTag("gl3", t, hit[0]!, `one run of ${hit.length}: seek, read, stop`, { tone: "accent", weight: 600 }));
    } else {
      hit.forEach((r, k) => items.push(rowTag(`m${k}`, t, r, "match", { tone: "accent", weight: 600 })));
    }
    items.push(label("q", note, t.left, t.bottom + 22, { anchor: "start", tone: "ink", size: 12, mono: true, weight: 600 }));
    // Bands sit behind the cells.
    return [...items.filter((it) => it.k === "band"), ...items.filter((it) => it.k !== "band")];
  };

  return finish({
    title: "A composite index is sorted by its first column, then its second",
    input: "INDEX (customer_id, placed_on) → id",
    frames: [
      { caption: "The entries are sorted by customer_id, and among equal customer_ids by placed_on — a phone book by surname, then first name. Each customer's dates are in order; across customers they are not.", items: draw(null, true, "6 entries, sorted on (customer_id, placed_on)") },
      { caption: `WHERE customer_id = 3: customer 3's entries sit together, so the search descends once to the first and reads ${q1.length} in a row. The leftmost column can always seek.`, items: draw(q1, true, "WHERE customer_id = 3") },
      {
        caption: `Add placed_on >= '2024-03-01': within customer 3 the dates are sorted, so the run just starts later — ${q2.length} entries. Equality on the first column, then a range on the second, both narrow the seek.`,
        items: draw(q2, true, "… AND placed_on >= '2024-03-01'"),
      },
      {
        caption: `WHERE placed_on = '2024-03-02' alone: the two matches are rows ${q3.map((i) => i + 1).join(" and ")}, under different customers, with others between them. No single run holds them, so the index cannot seek on its second column.`,
        items: draw(q3, false, "WHERE placed_on = '2024-03-02' → scan"),
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "leftmost-prefix": leftmostPrefix,
};
