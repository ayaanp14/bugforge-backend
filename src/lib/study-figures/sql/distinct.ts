import { finish, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { rowsTable, rowTag, sqlCompare } from "./kit.js";

/**
 * DISTINCT: the lesson's city list collapsing.
 *
 *  - collapse: `SELECT city FROM customers ORDER BY city` gives Chennai and
 *    three Punes; DISTINCT compares whole result rows, finds the identical
 *    ones, slides each duplicate onto the first copy and keeps one — the
 *    two rows the lesson prints.
 */

/** The lesson's first result, one row per customer (keyed by position). */
const CITIES = ["Chennai", "Pune", "Pune", "Pune"];

/** A result row with its position as its key. */
type CityRow = { city: string; k: number };

function collapse(): Walkthrough {
  const rows: CityRow[] = CITIES.map((city, k) => ({ city, k }));
  const firstOf = (r: CityRow) => rows.findIndex((o) => o.city === r.city);
  const kept = rows.filter((r) => firstOf(r) === r.k).sort((a, b) => sqlCompare(a.city, b.city));
  if (kept.map((r) => r.city).join() !== "Chennai,Pune") throw new Error("collapse: the lesson's DISTINCT result is Chennai, Pune");
  const dupes = rows.length - kept.length;

  const draw = (stage: "all" | "mark" | "merge" | "done"): Item[] => {
    // While merging, duplicates are drawn first so the kept copy lands on top of them.
    const shown = stage === "done" ? kept : stage === "merge" ? [...rows.filter((r) => firstOf(r) !== r.k), ...rows.filter((r) => firstOf(r) === r.k)] : rows;
    const t = rowsTable("c", stage === "done" ? "SELECT DISTINCT city" : "SELECT city", ["city"], shown, {
      key: (r) => shown[r]!.k,
      // Merging: every duplicate is drawn in its first copy's slot, so it glides up onto it.
      slot: (r) => (stage === "merge" ? firstOf(shown[r]!) : r),
      tone: (r) => {
        const dup = firstOf(shown[r]!) !== shown[r]!.k;
        if (stage === "mark" || stage === "merge") return dup ? "accent" : shown[r]!.city === "Pune" ? "strong" : "plain";
        return stage === "done" ? "strong" : "plain";
      },
      w: { city: 96 },
    });
    const items: Item[] = [...t.items];
    if (stage === "mark") rows.forEach((r, i) => firstOf(r) !== r.k && items.push(rowTag(`d${r.k}`, t, i, `same as row ${firstOf(r) + 1}`, { tone: "accent" })));
    if (stage === "merge") items.push(rowTag("m", t, firstOf(rows[1]!), `${rows.filter((r) => r.city === "Pune").length} rows → 1`, { tone: "accent", weight: 600 }));
    return items;
  };

  return finish({
    title: "DISTINCT keeps one copy of each identical result row",
    input: "SELECT DISTINCT city FROM customers ORDER BY city",
    frames: [
      { caption: `Without DISTINCT the query returns one row per customer: ${rows.length} rows, and Pune repeats for every customer who lives there.`, items: draw("all") },
      { caption: `DISTINCT runs after SELECT has computed the columns and compares whole result rows. ${dupes} rows are identical to an earlier one.`, items: draw("mark") },
      { caption: "Each duplicate is folded into the first copy. Rows only merge when every selected column matches — add name to the select list and the Punes would all differ again.", items: draw("merge") },
      { caption: `${kept.length} distinct rows remain, sorted by ORDER BY, which runs after DISTINCT. How many customers each city had is gone; COUNT with GROUP BY keeps it.`, items: draw("done") },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  collapse,
};
