import { finish, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { box, label } from "../../lesson-figures/kit.js";
import { cmp, rowsTable, show, type Row, type Val } from "./kit.js";
import { expectRows, joinWalk, resultRows } from "./join-walk.js";

/**
 * FULL OUTER and CROSS joins, on the lesson's own tables.
 *
 *  - full-outer: bank against books by ref — matched references once with
 *    both amounts, P4 only at the bank, P3 only in the books, each padded
 *    with NULL on the side it is missing from;
 *  - cross-grid: two colours × three sizes, every pair with no ON, the grid
 *    read off row by row into the six result rows.
 */

const BANK: Row[] = [
  { ref: "P1", amount: 100 },
  { ref: "P2", amount: 250 },
  { ref: "P4", amount: 80 },
];
const BOOKS: Row[] = [
  { ref: "P1", amount: 100 },
  { ref: "P2", amount: 205 },
  { ref: "P3", amount: 60 },
];

function fullOuter(): Walkthrough {
  const cols = ["ref", "bank_amount", "books_amount"];
  const value = (b: Row | null, k: Row | null, col: string): Val =>
    col === "ref" ? (b?.ref ?? k?.ref ?? null) : col === "bank_amount" ? (b?.amount ?? null) : (k?.amount ?? null);
  const { frames, pairs } = joinWalk({
    left: { title: "bank b", cols: ["ref", "amount"], rows: BANK, w: { ref: 44, amount: 62 } },
    right: { title: "books k", cols: ["ref", "amount"], rows: BOOKS, w: { ref: 44, amount: 62 } },
    on: (b, k) => cmp(k.ref ?? null, "=", b.ref ?? null),
    kind: "full",
    gap: 110,
    out: { title: "", cols, value, w: { ref: 44, bank_amount: 96, books_amount: 104 } },
    intro: "A full outer join keeps matched pairs once, plus the unmatched rows of both sides. Bank rows are read first, as a left join reads them.",
    step: (b, m) =>
      m.length
        ? `Bank ${show(b.ref)} finds ${show(m[0]!.ref)} in the books: one row with both amounts, ${show(b.amount)} and ${show(m[0]!.amount)}.${b.amount !== m[0]!.amount ? " They differ — a discrepancy the report surfaces." : ""}`
        : `Bank ${show(b.ref)} has no row in the books. The left half keeps it, with NULL for books_amount: money received but never recorded.`,
    end: (un) =>
      `Last, the books rows no bank row matched — ${un.map((k) => show(k.ref)).join(", ")} — are added with NULL for bank_amount. In MySQL that is the second half of LEFT JOIN … UNION ALL … WHERE b.ref IS NULL.`,
  });
  expectRows("full-outer", resultRows(pairs, BANK, BOOKS, value, cols), [
    ["P1", 100, 100],
    ["P2", 250, 205],
    ["P3", null, 60],
    ["P4", 80, null],
  ]);
  return finish({ title: "FULL OUTER JOIN: matched pairs, plus the leftovers of both sides", input: "bank b FULL OUTER JOIN books k ON k.ref = b.ref", frames });
}

const COLOURS = ["black", "white"];
const SIZES = ["S", "M", "L"];

function crossGrid(): Walkthrough {
  const product = COLOURS.flatMap((c) => SIZES.map((s) => [c, s] as [string, string]));
  if (product.length !== COLOURS.length * SIZES.length || product.length !== 6) throw new Error("cross-grid: the lesson prints six rows");
  const W = 70;
  const H = 30;
  const G = 4;
  const X0 = 60;
  const cx = (j: number) => X0 + j * (W + G);
  const cy = (i: number) => 30 + i * (H + G);
  const RX = cx(SIZES.length) + 40;

  const draw = (filled: number, result: boolean): Item[] => {
    const items: Item[] = [label("st", "sizes →", cx(0) - 8, 8, { anchor: "end", tone: "faint", size: 10.5 })];
    SIZES.forEach((s, j) => items.push(label(`sh${j}`, s, cx(j) + W / 2, 14, { tone: "soft", size: 12, mono: true, weight: 600 })));
    COLOURS.forEach((c, i) => {
      items.push(label(`ch${i}`, c, X0 - 10, cy(i) + H / 2, { anchor: "end", tone: "soft", size: 12, mono: true, weight: 600 }));
      SIZES.forEach((s, j) => {
        const on = i < filled;
        items.push(box(`g${i}-${j}`, cx(j), cy(i), on ? `${c} ${s}` : "", { w: W, h: H, size: 11.5, tone: on ? (i === filled - 1 && !result ? "accent" : "strong") : "ghost" }));
      });
    });
    if (result) {
      const t = rowsTable(
        "o",
        "result",
        ["colour", "size"],
        product.map(([c, s]) => ({ colour: c, size: s })),
        { x: RX, y: 0, key: (r) => `${product[r]![0]}${product[r]![1]}`, tone: () => "strong", w: { colour: 70, size: 50 } },
      );
      items.push(...t.items);
    }
    items.push(label("n", `${COLOURS.length} × ${SIZES.length} = ${COLOURS.length * SIZES.length} rows`, X0, cy(COLOURS.length) + 12, { anchor: "start", tone: "ink", size: 12, mono: true, weight: 600 }));
    return items;
  };

  return finish({
    title: "CROSS JOIN: every colour with every size",
    input: "colours c CROSS JOIN sizes s",
    frames: [
      { caption: `A cross join has no ON. Its result is the whole grid: one row for every pairing of a colour with a size, ${COLOURS.length} × ${SIZES.length} cells.`, items: draw(0, false) },
      { caption: `The first colour, ${COLOURS[0]}, is paired with each of the ${SIZES.length} sizes: three rows.`, items: draw(1, false) },
      { caption: `Then ${COLOURS[1]} with each size again. Every row of one table meets every row of the other; if either table were empty, so would be the result.`, items: draw(2, false) },
      {
        caption: `Read off row by row, ordered by colour then size position, the grid is the six-row result. This is also what an accidental join without ON returns, on tables far bigger than these.`,
        items: draw(2, true),
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "full-outer": fullOuter,
  "cross-grid": crossGrid,
};
