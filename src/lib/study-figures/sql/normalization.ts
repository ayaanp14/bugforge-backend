import { finish, type Item, type Tone, type Walkthrough } from "../../walkthroughs/core.js";
import { box, label } from "../../lesson-figures/kit.js";
import { show, type Row } from "./kit.js";

/**
 * Normalization: the lesson's wide orders table, split to 3NF.
 *
 *  - decompose: the wide table and its update anomaly, then the 2NF split
 *    (orders, products, order_lines) and the 3NF split (customers out of
 *    orders). The new tables are projections of the wide one with duplicates
 *    removed, computed here; a projection whose key maps to two different
 *    values throws (the dependency would not hold). Each fact keeps one id
 *    from the wide table to its new home, so the copy that survives glides
 *    there and the repeated copies fade — "stored once", drawn.
 */

const WIDE: Row[] = [
  { order_id: 1, date: "2024-05-01", email: "asha@x.io", name: "Asha", city: "Pune", sku: "P1", product: "Pen", price: "1.50", qty: 10 },
  { order_id: 1, date: "2024-05-01", email: "asha@x.io", name: "Asha", city: "Pune", sku: "P2", product: "Pad", price: "3.00", qty: 2 },
  { order_id: 2, date: "2024-05-03", email: "ben@x.io", name: "Ben", city: "Delhi", sku: "P1", product: "Pen", price: "1.50", qty: 4 },
];

const W: Record<string, number> = { order_id: 62, date: 84, email: 78, name: 50, city: 58, sku: 38, product: 60, price: 48, qty: 38 };
const H = 26;
const GAP = 3;

/** Which fact a wide-table cell states, so its id can follow it: a column of the entity its key names. */
const KEY_OF: Record<string, string> = { order_id: "order", date: "order", email: "customer", name: "customer", city: "customer", sku: "product", product: "product", price: "product", qty: "line" };
function factId(r: Row, col: string): string {
  const entity = KEY_OF[col]!;
  const key = entity === "order" ? r.order_id : entity === "customer" ? r.email : entity === "product" ? r.sku : `${r.order_id}.${r.sku}`;
  return `${entity}:${key}:${col}`;
}

/** A table whose cells carry ids of our choosing. */
function grid(p: string, title: string, cols: readonly string[], rows: ReadonlyArray<{ ids: string[]; texts: string[]; tone?: (c: number) => Tone | undefined }>, x: number, y: number): { items: Item[]; bottom: number; right: number } {
  const items: Item[] = [label(`${p}T`, title, x, y, { anchor: "start", tone: "ink", weight: 700, size: 12.5 })];
  let cx = x;
  const xs = cols.map((c) => {
    const at = cx;
    cx += W[c]! + GAP;
    return at;
  });
  cols.forEach((c, i) => items.push(label(`${p}H${c}`, c, xs[i]! + W[c]! / 2, y + 26, { tone: "soft", size: 11, mono: true })));
  rows.forEach((r, ri) => r.ids.forEach((id, i) => items.push(box(id, xs[i]!, y + 36 + ri * (H + GAP), r.texts[i]!, { w: W[cols[i]!]!, h: H, size: 12, tone: r.tone?.(i) ?? "plain" }))));
  return { items, bottom: y + 36 + rows.length * (H + GAP), right: cx - GAP };
}

/** A projection with duplicates removed: one row per key, the first row's cells keep the fact ids. Throws when the key does not determine the columns. */
function project(rows: readonly Row[], cols: readonly string[], key: readonly string[], rename?: (r: Row) => Row): Row[] {
  const seen = new Map<string, Row>();
  for (const r0 of rows) {
    const r = rename ? rename(r0) : r0;
    const k = key.map((c) => show(r[c] ?? null)).join("|");
    const prev = seen.get(k);
    if (prev) {
      for (const c of cols) if (prev[c] !== r[c]) throw new Error(`decompose: ${key.join(",")} = ${k} has two values of ${c}`);
    } else seen.set(k, r);
  }
  return [...seen.values()];
}

function decompose(): Walkthrough {
  const ALL = Object.keys(W);
  const orders2 = project(WIDE, ["order_id", "date", "email", "name", "city"], ["order_id"]);
  const products = project(WIDE, ["sku", "product", "price"], ["sku"]);
  const lines = project(WIDE, ["order_id", "sku", "qty"], ["order_id", "sku"]);
  const customers = project(WIDE, ["email", "name", "city"], ["email"]);
  const orders3 = project(WIDE, ["order_id", "date", "email"], ["order_id"]);
  if (orders2.length !== 2 || products.length !== 2 || lines.length !== 3 || customers.length !== 2) throw new Error("decompose: unexpected table sizes");
  const ashaRows = WIDE.filter((r) => r.email === "asha@x.io").length;

  // The wide table: a repeated fact (not the first row stating it) gets a suffixed id, so it fades when the split keeps one.
  const wide = (moved: "none" | "half"): Item[] => {
    const firstSeen = new Set<string>();
    const rows = WIDE.map((r) => {
      const ids = ALL.map((c) => {
        const id = factId(r, c);
        if (firstSeen.has(id)) return `${id}#${WIDE.indexOf(r)}`;
        firstSeen.add(id);
        return id;
      });
      const isAsha = r.email === "asha@x.io";
      const changed = moved === "half" && r === WIDE[0];
      const texts = ALL.map((c) => (c === "city" && changed ? "Mumbai" : show(r[c] ?? null)));
      return {
        ids,
        texts,
        tone: (c: number): Tone => {
          const col = ALL[c]!;
          if (moved === "half" && col === "city" && isAsha) return changed ? "strong" : "error";
          return KEY_OF[col] === "customer" && isAsha ? "accent" : "plain";
        },
      };
    });
    return grid("w", "orders_wide", ALL, rows, 0, 0).items;
  };

  const rowsOf = (rows: readonly Row[], cols: readonly string[], idCol: (r: Row, c: string) => string, tone?: (r: Row, c: string) => Tone | undefined) =>
    rows.map((r) => ({ ids: cols.map((c) => idCol(r, c)), texts: cols.map((c) => show(r[c] ?? null)), tone: (i: number) => tone?.(r, cols[i]!) }));

  const twoNF = (): Item[] => {
    const o = grid("o", "orders", ["order_id", "date", "email", "name", "city"], rowsOf(orders2, ["order_id", "date", "email", "name", "city"], factId), 0, 0);
    const p = grid("p", "products", ["sku", "product", "price"], rowsOf(products, ["sku", "product", "price"], factId, () => "accent"), o.right + 30, 0);
    const l = grid("l", "order_lines", ["order_id", "sku", "qty"], rowsOf(lines, ["order_id", "sku", "qty"], (r, c) => (c === "qty" ? factId(r, c) : `line:${r.order_id}.${r.sku}:${c}`)), 0, o.bottom + 22);
    return [...o.items, ...p.items, ...l.items];
  };

  const threeNF = (city?: string): Item[] => {
    const o = grid("o", "orders", ["order_id", "date", "email"], rowsOf(orders3, ["order_id", "date", "email"], (r, c) => (c === "email" ? `ofk:${r.order_id}` : factId(r, c))), 0, 0);
    const cu = grid("c", "customers", ["email", "name", "city"], customers.map((r) => ({
      ids: ["email", "name", "city"].map((c) => factId(r, c)),
      texts: ["email", "name", "city"].map((c) => (c === "city" && city && r.email === "asha@x.io" ? city : show(r[c] ?? null))),
      tone: (i: number): Tone => (city && r.email === "asha@x.io" && i === 2 ? "strong" : "accent"),
    })), 0, 0);
    // customers sits to the right of orders.
    const shift = o.right + 30;
    const cuItems = cu.items.map((it) => ("x" in it ? { ...it, x: it.x + shift } : it)) as Item[];
    const l = grid("l", "order_lines", ["order_id", "sku", "qty"], rowsOf(lines, ["order_id", "sku", "qty"], (r, c) => (c === "qty" ? factId(r, c) : `line:${r.order_id}.${r.sku}:${c}`)), 0, Math.max(o.bottom, cu.bottom) + 22);
    const p = grid("p", "products", ["sku", "product", "price"], rowsOf(products, ["sku", "product", "price"], factId), shift, Math.max(o.bottom, cu.bottom) + 22);
    return [...o.items, ...cuItems, ...l.items, ...p.items];
  };

  return finish({
    title: "Normalizing: each fact moves to the one table it belongs in",
    input: "orders_wide → 2NF → 3NF",
    frames: [
      { caption: `The wide table repeats facts about other things in rows about order lines: Asha's email, name and city are copied onto all ${ashaRows} of her rows, and the Pen's name and price onto both of its lines.`, items: wide("none") },
      { caption: "Update anomaly: Asha moves to Mumbai and only one of her rows is changed. The table now says she lives in two cities — the database disagrees with itself.", items: wide("half") },
      {
        caption: `2NF: the key is (order_id, sku), but the product columns depend on sku alone and the order columns on order_id alone. Split them out: each product and each order is now one row, and the repeated copies are gone.`,
        items: twoNF(),
      },
      {
        caption: "3NF: in orders, name and city depend on email, not on the key — a transitive dependency. Customers become their own table and orders keep only the pointer.",
        items: threeNF(),
      },
      { caption: "Now Asha's city is one cell. Moving her to Mumbai is one update, a product can exist before anyone orders it, and deleting an order no longer deletes its customer.", items: threeNF("Mumbai") },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  decompose,
};
