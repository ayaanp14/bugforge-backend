import { finish, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { label } from "../../lesson-figures/kit.js";
import { rowsTable, rowTag, sqlCompare, sqlLine, type Row, type Val } from "./kit.js";

/**
 * ORDER BY: the lesson's three products, sorted four ways.
 *
 *  - sort-rows: rows in storage order, then `ORDER BY price`, `price DESC`,
 *    `discount` (MySQL puts NULL first ascending) and `discount IS NULL,
 *    discount` (the hidden key that sends NULLs to the end). Every order is
 *    the real sort, and each is checked against the table the lesson prints.
 *    Rows are keyed by name, so they glide to their new places.
 */

const PRODUCTS: Row[] = [
  { name: "notebook", price: 40, discount: 10 },
  { name: "backpack", price: 900, discount: 5 },
  { name: "pencil", price: 5, discount: null },
];

type Key = { by: (r: Row) => Val; desc?: boolean };
const sortBy = (keys: Key[]) => [...PRODUCTS].sort((a, b) => {
  for (const k of keys) {
    const c = sqlCompare(k.by(a), k.by(b));
    if (c) return k.desc ? -c : c;
  }
  return 0;
});

function sortRows(): Walkthrough {
  const price = (r: Row) => r.price ?? null;
  const discount = (r: Row) => r.discount ?? null;
  const isNull = (r: Row) => (r.discount === null ? 1 : 0);
  const asc = sortBy([{ by: price }]);
  const desc = sortBy([{ by: price, desc: true }]);
  const nullFirst = sortBy([{ by: discount }]);
  const nullLast = sortBy([{ by: isNull }, { by: discount }]);
  const names = (rs: Row[]) => rs.map((r) => r.name).join();
  const lesson: Array<[Row[], string]> = [
    [asc, "pencil,notebook,backpack"],
    [desc, "backpack,notebook,pencil"],
    [nullFirst, "pencil,backpack,notebook"],
    [nullLast, "backpack,notebook,pencil"],
  ];
  for (const [got, want] of lesson) if (names(got) !== want) throw new Error(`sort-rows: got ${names(got)}, the lesson prints ${want}`);

  const COLS = ["name", "price", "discount"];
  const draw = (rows: Row[], clause: string, keyCol: number | null, o: { hidden?: boolean } = {}): Item[] => {
    const at = (r: Row) => rows.indexOf(r);
    // Drawn in the fixed PRODUCTS order with a slot per row: ids never move between frames, only places.
    const t = rowsTable("p", "products", COLS, PRODUCTS, {
      y: 22,
      key: (r) => PRODUCTS[r]!.name as string,
      slot: (r) => at(PRODUCTS[r]!),
      tone: (r, c) => (c === keyCol ? (PRODUCTS[r]!.discount === null && keyCol === 2 ? "accent" : "strong") : "plain"),
      w: { name: 84, price: 60, discount: 74 },
    });
    const items: Item[] = [sqlLine("q", clause, 0, 0, { weight: 600 }), ...t.items];
    if (o.hidden) PRODUCTS.forEach((r) => items.push(rowTag(`h${r.name}`, t, at(r), `discount IS NULL = ${isNull(r)}`, { tone: isNull(r) ? "accent" : "soft" })));
    if (keyCol !== null) rows.forEach((r, i) => items.push(label(`n${r.name}`, String(i + 1), t.left - 12, t.rowY(i) + t.h / 2, { tone: "faint", size: 10.5, mono: true })));
    return items;
  };

  return finish({
    title: "ORDER BY moves rows into place; without it there is no order",
    input: "SELECT name, price, discount FROM products ORDER BY …",
    frames: [
      { caption: "Without ORDER BY the rows come back in whatever order is cheapest for the database — here, say, the order they happen to be stored in. That order is not a promise.", items: draw(PRODUCTS, "SELECT … FROM products", null) },
      { caption: `ORDER BY price sorts on the key, ascending by default: ${asc.map((r) => `${r.name} ${r.price}`).join(", ")}.`, items: draw(asc, "ORDER BY price", 1) },
      { caption: "DESC after a key reverses that key: the most expensive first. DESC belongs to the one key it follows, not to the whole clause.", items: draw(desc, "ORDER BY price DESC", 1) },
      {
        caption: "Sorting on discount, MySQL treats NULL as smaller than every value, so the product with no discount comes first ascending (and would come last descending).",
        items: draw(nullFirst, "ORDER BY discount", 2),
      },
      {
        caption: "To send NULLs to the end, sort first on the hidden key discount IS NULL — 0 for a value, 1 for NULL — and then on discount within each group.",
        items: draw(nullLast, "ORDER BY discount IS NULL, discount", 2, { hidden: true }),
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "sort-rows": sortRows,
};
