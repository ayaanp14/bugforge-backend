import { finish, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { label } from "../../lesson-figures/kit.js";
import { rowsTable, show, type Row, type Val } from "./kit.js";

/**
 * LAG and LEAD: the lesson's `daily_sales`.
 *
 *  - lag-lead: the query read one row at a time — LAG looks one row back in
 *    the window's order (an arc on the left margin), LEAD one row ahead (an
 *    arc on the right), and the first row's previous and the last row's next
 *    do not exist, so they are NULL. Checked against the lesson's table.
 */

const SALES: Row[] = [
  { day: "2024-03-01", revenue: 120 },
  { day: "2024-03-02", revenue: 150 },
  { day: "2024-03-03", revenue: 90 },
  { day: "2024-03-04", revenue: 200 },
];

function lagLead(): Walkthrough {
  const ordered = [...SALES].sort((a, b) => String(a.day).localeCompare(String(b.day)));
  const lag = ordered.map((_, i): Val => (i > 0 ? ordered[i - 1]!.revenue! : null));
  const lead = ordered.map((_, i): Val => (i < ordered.length - 1 ? ordered[i + 1]!.revenue! : null));
  if (lag.map(show).join() !== "NULL,120,150,90" || lead.map(show).join() !== "150,90,200,NULL") throw new Error("lag-lead: disagrees with the lesson's table");

  const draw = (cur: number | null): Item[] => {
    const done = cur === null ? -1 : cur;
    const rows = ordered.map((r, i) => ({ ...r, prev_revenue: i <= done ? show(lag[i]!) : "", next_revenue: i <= done ? show(lead[i]!) : "" }));
    const t = rowsTable("s", "ORDER BY day", ["day", "revenue", "prev_revenue", "next_revenue"], rows, {
      key: (r) => String(ordered[r]!.day),
      tone: (r, c) => {
        if (cur === null) return c >= 2 ? "ghost" : "plain";
        if (r === cur) return c >= 2 ? "strong" : "accent";
        if (c === 1 && (r === cur - 1 || r === cur + 1)) return "accent";
        return c >= 2 && r > done ? "ghost" : "plain";
      },
      w: { day: 92, revenue: 66, prev_revenue: 100, next_revenue: 100 },
    });
    const items: Item[] = [...t.items];
    if (cur !== null) {
      const mid = (s: number) => t.rowY(s) + t.h / 2;
      if (cur > 0) {
        items.push({ k: "edge", id: "lag", x1: t.left - 4, y1: mid(cur - 1), x2: t.left - 4, y2: mid(cur), tone: "accent", arrow: true, bow: 18 });
        items.push(label("lagl", "LAG", t.left - 26, (mid(cur - 1) + mid(cur)) / 2, { anchor: "end", tone: "accent", size: 11, weight: 700, mono: true }));
      } else items.push(label("lagl", "LAG: no row before → NULL", t.left, t.bottom + 20, { anchor: "start", tone: "accent", size: 11, weight: 600, mono: true }));
      if (cur < ordered.length - 1) {
        items.push({ k: "edge", id: "lead", x1: t.right + 4, y1: mid(cur + 1), x2: t.right + 4, y2: mid(cur), tone: "accent", arrow: true, bow: 18 });
        items.push(label("leadl", "LEAD", t.right + 26, (mid(cur + 1) + mid(cur)) / 2, { anchor: "start", tone: "accent", size: 11, weight: 700, mono: true }));
      } else items.push(label("leadl", "LEAD: no row after → NULL", t.left, t.bottom + 20, { anchor: "start", tone: "accent", size: 11, weight: 600, mono: true }));
    }
    return items;
  };

  const say = (i: number) => {
    const r = ordered[i]!;
    const back = i > 0 ? `LAG reads the row before, ${ordered[i - 1]!.day}, and copies its revenue ${show(lag[i]!)}` : "there is no row before the first one, so LAG gives NULL";
    const ahead = i < ordered.length - 1 ? `LEAD reads the row after and copies ${show(lead[i]!)}` : "there is no row after the last one, so LEAD gives NULL";
    return `On ${r.day} (revenue ${show(r.revenue!)}): ${back}; ${ahead}.`;
  };

  return finish({
    title: "LAG looks one row back, LEAD one row ahead",
    input: "LAG(revenue) / LEAD(revenue) OVER (ORDER BY day)",
    frames: [
      { caption: "The window orders the rows by day; that order is what previous and next mean. The two new columns are filled one row at a time.", items: draw(null) },
      ...ordered.map((_, i) => ({ caption: say(i), items: draw(i) })),
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "lag-lead": lagLead,
};
