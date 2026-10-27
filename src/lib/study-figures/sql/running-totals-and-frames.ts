import { finish, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { label } from "../../lesson-figures/kit.js";
import { rowsTable, show, type Row, type Table } from "./kit.js";

/**
 * Running totals and frames: the lesson's three tables.
 *
 *  - running-total: ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW — the
 *    frame (a band) grows one row at a time and the SUM over it is the
 *    running total;
 *  - moving-average: ROWS BETWEEN 2 PRECEDING AND CURRENT ROW — a three-row
 *    frame sliding down, clipped at the partition's start;
 *  - rows-vs-range: the default RANGE frame against ROWS on a tied day — a
 *    bracket on each side shows which rows each frame holds.
 *
 * Every SUM and AVG is taken over the frame's own rows and checked against
 * the numbers the lesson prints.
 */

const SALES: Row[] = [
  { day: "2024-03-01", amount: 100 },
  { day: "2024-03-02", amount: 40 },
  { day: "2024-03-03", amount: 60 },
  { day: "2024-03-04", amount: 25 },
];
const VISITS: Row[] = [
  { day: "2024-03-01", visits: 30 },
  { day: "2024-03-02", visits: 60 },
  { day: "2024-03-03", visits: 90 },
  { day: "2024-03-04", visits: 30 },
  { day: "2024-03-05", visits: 0 },
];
const TIED: Row[] = [
  { id: 1, day: "2024-03-01", amount: 100 },
  { id: 2, day: "2024-03-02", amount: 40 },
  { id: 3, day: "2024-03-02", amount: 50 },
  { id: 4, day: "2024-03-03", amount: 10 },
];

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const round2 = (x: number) => Math.round(x * 100) / 100;

/** A translucent band behind table slots [from, to]: the frame. */
const frameBand = (id: string, t: Table, from: number, to: number): Item => ({
  k: "band",
  id,
  x: t.left - 5,
  y: t.rowY(from) - 3,
  w: t.right - t.left + 10,
  h: t.rowY(to) + t.h - t.rowY(from) + 6,
  tone: "accent",
});

/** A vertical bracket beside slots [from, to] of a table, opening towards it, with a label. */
function bracket(id: string, t: Table, from: number, to: number, side: "left" | "right", text: string): Item[] {
  const y1 = t.rowY(from) + 2;
  const y2 = t.rowY(to) + t.h - 2;
  const x = side === "left" ? t.left - 10 : t.right + 10;
  const tip = side === "left" ? 5 : -5;
  return [
    { k: "path", id, pts: [[x + tip, y1], [x, y1], [x, y2], [x + tip, y2]], tone: "accent", width: 2 },
    label(`${id}l`, text, side === "left" ? x - 8 : x + 8, (y1 + y2) / 2, { anchor: side === "left" ? "end" : "start", tone: "accent", size: 11, weight: 700, mono: true }),
  ];
}

function runningTotal(): Walkthrough {
  const amounts = SALES.map((r) => r.amount as number);
  const totals = amounts.map((_, i) => sum(amounts.slice(0, i + 1)));
  if (totals.join() !== "100,140,200,225") throw new Error("running-total: disagrees with the lesson's table");

  const draw = (cur: number | null): Item[] => {
    const rows = SALES.map((r, i) => ({ ...r, running_total: cur !== null && i <= cur ? totals[i]! : "" }));
    const t = rowsTable("s", "ORDER BY day", ["day", "amount", "running_total"], rows, {
      key: (r) => String(SALES[r]!.day),
      tone: (r, c) => (cur === null ? (c === 2 ? "ghost" : "plain") : c === 2 ? (r === cur ? "strong" : r < cur ? "plain" : "ghost") : r <= cur ? "accent" : "plain"),
      w: { day: 92, amount: 64, running_total: 104 },
    });
    const items: Item[] = [];
    if (cur !== null) items.push(frameBand("f", t, 0, cur));
    items.push(...t.items);
    if (cur !== null) {
      items.push(label("cur", "← current row", t.right + 12, t.rowY(cur) + t.h / 2, { anchor: "start", tone: "accent", size: 11, weight: 600, mono: true }));
      items.push(label("sum", `SUM(${amounts.slice(0, cur + 1).join(" + ")}) = ${totals[cur]}`, t.left, t.bottom + 22, { anchor: "start", tone: "ink", size: 12, mono: true, weight: 600 }));
    }
    return items;
  };

  return finish({
    title: "A running total: the frame grows by one row each step",
    input: "SUM(amount) OVER (ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)",
    frames: [
      { caption: "The window orders the rows by day. The frame is every row from the partition's first through the current one, so it starts at one row and grows.", items: draw(null) },
      ...SALES.map((r, i) => ({
        caption:
          i === 0
            ? `On ${r.day} the frame is that row alone, so the running total is its own amount, ${totals[0]}.`
            : `On ${r.day} the frame holds ${i + 1} rows, the first through this one; their sum, ${totals[i]}, is the running total so far.`,
        items: draw(i),
      })),
    ],
  });
}

function movingAverage(): Walkthrough {
  const visits = VISITS.map((r) => r.visits as number);
  const frameOf = (i: number) => [Math.max(0, i - 2), i] as const;
  const avgs = visits.map((_, i) => {
    const [a, b] = frameOf(i);
    const xs = visits.slice(a, b + 1);
    return round2(sum(xs) / xs.length);
  });
  if (avgs.join() !== "30,45,60,60,40") throw new Error(`moving-average: got ${avgs.join()}, the lesson prints 30,45,60,60,40`);

  const draw = (cur: number): Item[] => {
    const [a, b] = frameOf(cur);
    const rows = VISITS.map((r, i) => ({ ...r, moving_avg_3: i <= cur ? avgs[i]! : "" }));
    const t = rowsTable("v", "ORDER BY day", ["day", "visits", "moving_avg_3"], rows, {
      key: (r) => String(VISITS[r]!.day),
      tone: (r, c) => (c === 2 ? (r === cur ? "strong" : r < cur ? "plain" : "ghost") : r >= a && r <= b ? "accent" : "muted"),
      w: { day: 92, visits: 60, moving_avg_3: 100 },
    });
    const xs = visits.slice(a, b + 1);
    return [
      frameBand("f", t, a, b),
      ...t.items,
      label("n", `frame: ${xs.length} row${xs.length === 1 ? "" : "s"}`, t.right + 12, t.rowY(cur) + t.h / 2, { anchor: "start", tone: "accent", size: 11, weight: 600, mono: true }),
      label("avg", `AVG(${xs.join(", ")}) = ${show(avgs[cur]!)}`, t.left, t.bottom + 22, { anchor: "start", tone: "ink", size: 12, mono: true, weight: 600 }),
    ];
  };

  return finish({
    title: "A moving average: a three-row frame slides down",
    input: "AVG(visits) OVER (ORDER BY day ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)",
    frames: VISITS.map((r, i) => {
      const n = Math.min(3, i + 1);
      return {
        caption:
          i < 2
            ? `On ${r.day} there ${i === 0 ? "is no row" : "is only one row"} before it, so the frame is clipped at the partition's start: ${n} row${n === 1 ? "" : "s"}, average ${show(avgs[i]!)}. Early values average fewer rows.`
            : `On ${r.day} the frame is the full three rows, this one and the two before it; their average is ${show(avgs[i]!)}. The frame moves down one row each step.`,
        items: draw(i),
      };
    }),
  });
}

function rowsVsRange(): Walkthrough {
  const ordered = [...TIED].sort((a, b) => String(a.day).localeCompare(String(b.day)) || (a.id as number) - (b.id as number));
  // RANGE … CURRENT ROW: every row whose day is at most this one's (peers included).
  const rangeFrame = (i: number) => [0, ordered.reduce((last, r, j) => (r.day! <= ordered[i]!.day! ? j : last), 0)] as const;
  const rowsFrame = (i: number) => [0, i] as const;
  const total = (f: readonly [number, number]) => sum(ordered.slice(f[0], f[1] + 1).map((r) => r.amount as number));
  const range = ordered.map((_, i) => total(rangeFrame(i)));
  const rows = ordered.map((_, i) => total(rowsFrame(i)));
  if (range.join() !== "100,190,190,200" || rows.join() !== "100,140,190,200") throw new Error("rows-vs-range: disagrees with the lesson's table");

  const draw = (cur: number | null): Item[] => {
    const data = ordered.map((r, i) => ({ ...r, range_sum: cur !== null && i <= cur ? range[i]! : "", rows_sum: cur !== null && i <= cur ? rows[i]! : "" }));
    const t = rowsTable("t", "ORDER BY day (ties on 03-02)", ["id", "day", "amount", "range_sum", "rows_sum"], data, {
      key: (r) => ordered[r]!.id as number,
      tone: (r, c) => {
        if (cur === null) return c >= 3 ? "ghost" : ordered[r]!.day === "2024-03-02" && c === 1 ? "accent" : "plain";
        if (c >= 3) return r === cur ? "strong" : r < cur ? "plain" : "ghost";
        return r === cur ? "accent" : "plain";
      },
      w: { id: 36, day: 92, amount: 64, range_sum: 82, rows_sum: 76 },
    });
    const items: Item[] = [...t.items];
    if (cur !== null) {
      const [ra, rb] = rangeFrame(cur);
      const [wa, wb] = rowsFrame(cur);
      items.push(...bracket("rg", t, ra, rb, "left", "RANGE"));
      items.push(...bracket("rw", t, wa, wb, "right", "ROWS"));
    }
    return items;
  };

  return finish({
    title: "ROWS counts rows; RANGE takes every peer of the current row",
    input: "SUM(amount) OVER (ORDER BY day)  vs  … ROWS UNBOUNDED PRECEDING",
    frames: [
      { caption: "Rows 2 and 3 share the day 2024-03-02. With ORDER BY day and no frame, the default is RANGE up to the current row — which means up to its last peer.", items: draw(null) },
      { caption: `On row 1 there are no ties: both frames hold just that row, and both sums are ${range[0]}.`, items: draw(0) },
      {
        caption: `On row 2 the ROWS frame stops at row 2 itself: ${rows[1]}. The RANGE frame takes every row with the same day, so it reaches row 3 too: ${range[1]}.`,
        items: draw(1),
      },
      { caption: `On row 3 both frames hold rows 1 to 3 and agree on ${rows[2]} — so under RANGE the two tied rows show the same total, the total as of the end of that day.`, items: draw(2) },
      { caption: `On row 4 the tie is behind it and both frames are the whole table: ${range[3]}. For a balance after each transaction, add a unique tie-breaker and say ROWS.`, items: draw(3) },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "running-total": runningTotal,
  "moving-average": movingAverage,
  "rows-vs-range": rowsVsRange,
};
