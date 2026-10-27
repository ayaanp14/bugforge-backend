import { finish, type Item, type Tone, type Walkthrough } from "../../walkthroughs/core.js";
import { box, label } from "../../lesson-figures/kit.js";
import { cmp, show, type Row } from "./kit.js";
import { expectRows, joinPairs, joinWalk, resultRows } from "./join-walk.js";

/**
 * INNER JOIN, on the joins module's own tables: Chen (3) has no orders and
 * order 13 points at customer 9, who does not exist.
 *
 *  - match-orders: each order looked up in customers one row at a time; the
 *    matched pairs become the result, order 13 and Chen never appear;
 *  - cross-product: the 4 × 3 pairs the "Cartesian product, then filter"
 *    model builds, ON keeping the TRUE cells.
 */

export const CUSTOMERS: Row[] = [
  { id: 1, name: "Asha", city: "Pune" },
  { id: 2, name: "Ben", city: "Delhi" },
  { id: 3, name: "Chen", city: "Pune" },
];
export const ORDERS: Row[] = [
  { id: 10, customer_id: 1, order_date: "2024-01-05", amount: 250 },
  { id: 11, customer_id: 1, order_date: "2024-02-11", amount: 100 },
  { id: 12, customer_id: 2, order_date: "2024-02-20", amount: 400 },
  { id: 13, customer_id: 9, order_date: "2024-03-01", amount: 75 },
];
const on = (o: Row, c: Row) => cmp(c.id ?? null, "=", o.customer_id ?? null);

function matchOrders(): Walkthrough {
  const value = (o: Row | null, c: Row | null, col: string) => (col === "order_id" ? (o?.id ?? null) : col === "customer" ? (c?.name ?? null) : (o?.amount ?? null));
  const cols = ["order_id", "customer", "amount"];
  const { frames, pairs } = joinWalk({
    left: { title: "orders o", cols: ["id", "customer_id", "amount"], rows: ORDERS, w: { id: 40, customer_id: 96, amount: 62 } },
    right: { title: "customers c", cols: ["id", "name"], rows: CUSTOMERS, w: { id: 40, name: 62 } },
    on,
    kind: "inner",
    out: { title: "", cols, value, w: { order_id: 76, customer: 80, amount: 62 } },
    intro: "ON c.id = o.customer_id is tested for each order against every customer. Each pair that comes out TRUE becomes one result row; nothing else does.",
    step: (o, m) =>
      m.length
        ? `Order ${show(o.id)} has customer_id ${show(o.customer_id)}, which equals ${show(m[0]!.name)}'s id: one result row, order ${show(o.id)} with ${show(m[0]!.name)}.`
        : `Order ${show(o.id)} has customer_id ${show(o.customer_id)}, and no customer has id ${show(o.customer_id)}. No pair is TRUE, so an inner join adds nothing for it — the order disappears.`,
  });
  expectRows("match-orders", resultRows(pairs, ORDERS, CUSTOMERS, value, cols), [
    [10, "Asha", 250],
    [11, "Asha", 100],
    [12, "Ben", 400],
  ]);
  const chen = CUSTOMERS.find((c) => !pairs.some(([, j]) => j !== null && CUSTOMERS[j] === c))!;
  frames.push({
    caption: `${pairs.length} rows. ${show(chen.name)} was never anyone's match, so ${show(chen.name)} is missing too: an inner join keeps only rows that found a partner, on both sides.`,
    items: frames[frames.length - 1]!.items.map((it) => (it.id.startsWith("r") && it.k === "cell" && it.id.startsWith(`r${CUSTOMERS.indexOf(chen)}-`) ? { ...it, tone: "error" as Tone } : it)),
  });
  return finish({ title: "INNER JOIN: each order looks for its customer", input: "orders o JOIN customers c ON c.id = o.customer_id", frames });
}

function crossProduct(): Walkthrough {
  const W = 92;
  const H = 30;
  const G = 4;
  const cx = (c: number) => c * (W + G);
  const cy = (r: number) => r * (H + G);
  const kept = joinPairs(ORDERS, CUSTOMERS, on, "inner");
  if (ORDERS.length * CUSTOMERS.length !== 12 || kept.length !== 3) throw new Error("cross-product: the lesson says 12 pairs, 3 kept");

  const draw = (stage: "pairs" | "test" | "kept"): Item[] => {
    const items: Item[] = [];
    CUSTOMERS.forEach((c, j) => items.push(label(`ch${j}`, `${show(c.name)} (id ${show(c.id)})`, cx(j) + W / 2, -14, { tone: "soft", size: 11, mono: true })));
    ORDERS.forEach((o, i) => items.push(label(`rh${i}`, `order ${show(o.id)} → ${show(o.customer_id)}`, -10, cy(i) + H / 2, { anchor: "end", tone: "soft", size: 11, mono: true })));
    let n = 0;
    ORDERS.forEach((o, i) =>
      CUSTOMERS.forEach((c, j) => {
        n++;
        const t = on(o, c) === true;
        const text = stage === "pairs" ? `pair ${n}` : stage === "test" ? `${show(c.id)} = ${show(o.customer_id)}` : t ? `${show(o.id)} + ${show(c.name)}` : "";
        const tone: Tone = stage === "pairs" ? "plain" : t ? "strong" : stage === "test" ? "muted" : "ghost";
        items.push(box(`c${i}-${j}`, cx(j), cy(i), text, { w: W, h: H, size: 12, tone }));
      }),
    );
    if (stage === "kept") items.push(label("sum", `${kept.length} of ${ORDERS.length * CUSTOMERS.length} pairs survive`, 0, cy(ORDERS.length) + 14, { anchor: "start", tone: "ink", size: 12, mono: true, weight: 600 }));
    return items;
  };
  const emptyRow = ORDERS.find((o) => !CUSTOMERS.some((c) => on(o, c) === true))!;
  const emptyCol = CUSTOMERS.find((c) => !ORDERS.some((o) => on(o, c) === true))!;
  return finish({
    title: "The model: every pair, then keep where ON is TRUE",
    input: `${ORDERS.length} orders × ${CUSTOMERS.length} customers`,
    frames: [
      { caption: `Logically a join starts from the Cartesian product: every order paired with every customer, ${ORDERS.length} × ${CUSTOMERS.length} = ${ORDERS.length * CUSTOMERS.length} pairs. The engine never builds them all, but the answer is always as if it had.`, items: draw("pairs") },
      { caption: "ON is evaluated for every pair. Only three cells are TRUE: the pairs where the customer's id equals the order's customer_id.", items: draw("test") },
      {
        caption: `The TRUE cells are the result. Order ${show(emptyRow.id)}'s row has no TRUE cell and ${show(emptyCol.name)}'s column has none, so neither appears anywhere in an inner join.`,
        items: draw("kept"),
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "match-orders": matchOrders,
  "cross-product": crossProduct,
};
