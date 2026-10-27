import { finish, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { label } from "../../lesson-figures/kit.js";
import { and3, cmp, rowsTable, rowTag, show, showTruth, type Row, type Truth, type Val } from "./kit.js";
import { expectRows, joinPairs, joinWalk, resultRows } from "./join-walk.js";
import { CUSTOMERS, ORDERS } from "./inner-join.js";

/**
 * LEFT JOIN, on the joins module's tables (customers 1–3, orders 10–13).
 *
 *  - keep-every-customer: customers read one at a time, each customer's
 *    orders paired with it, Chen kept once with NULLs for the order columns;
 *  - on-vs-where: the February report — the date test in WHERE meets Chen's
 *    NULL date, is UNKNOWN and drops Chen; the same test in ON only decides
 *    what matches, and Chen stays with a count of 0.
 */

const byCustomer = (c: Row, o: Row) => cmp(o.customer_id ?? null, "=", c.id ?? null);

function keepEveryCustomer(): Walkthrough {
  const cols = ["name", "order_id", "amount"];
  const value = (c: Row | null, o: Row | null, col: string): Val => (col === "name" ? (c?.name ?? null) : col === "order_id" ? (o?.id ?? null) : (o?.amount ?? null));
  const { frames, pairs } = joinWalk({
    left: { title: "customers c", cols: ["id", "name"], rows: CUSTOMERS, w: { id: 40, name: 62 } },
    right: { title: "orders o", cols: ["id", "customer_id", "amount"], rows: ORDERS, w: { id: 40, customer_id: 96, amount: 62 } },
    on: byCustomer,
    kind: "left",
    out: { title: "", cols, value, w: { name: 62, order_id: 76, amount: 62 } },
    intro: "LEFT JOIN guarantees every row of the table written first, customers. Each customer is paired with its matching orders, exactly as in an inner join.",
    step: (c, m) =>
      m.length
        ? `${show(c.name)} (id ${show(c.id)}) matches ${m.length === 1 ? `order ${show(m[0]!.id)}` : `orders ${m.map((o) => show(o.id)).join(" and ")}`}: ${m.length} result row${m.length === 1 ? "" : "s"}, one per match.`
        : `${show(c.name)} matches no order. An inner join would drop ${show(c.name)}; a left join keeps one row with NULL in every column that comes from orders.`,
  });
  expectRows("keep-every-customer", resultRows(pairs, CUSTOMERS, ORDERS, value, cols), [
    ["Asha", 10, 250],
    ["Asha", 11, 100],
    ["Ben", 12, 400],
    ["Chen", null, null],
  ]);
  const orphan = ORDERS.find((o) => !pairs.some(([, j]) => j !== null && ORDERS[j] === o))!;
  frames.push({
    caption: `Order ${show(orphan.id)}, for the missing customer ${show(orphan.customer_id)}, is still absent: the right side keeps only matched rows. Swap the tables with RIGHT JOIN and it would be the one kept with a NULL name.`,
    items: frames[frames.length - 1]!.items.map((it) => (it.k === "cell" && it.id.startsWith(`r${ORDERS.indexOf(orphan)}-`) ? { ...it, tone: "error" as const } : it)),
  });
  return finish({ title: "LEFT JOIN: every customer, matched or not", input: "customers c LEFT JOIN orders o ON o.customer_id = c.id", frames });
}

const inFeb = (o: Row | null): Truth => {
  const d = o ? (o.order_date ?? null) : null;
  return and3(cmp(d, ">=", "2024-02-01"), cmp(d, "<", "2024-03-01"));
};

function onVsWhere(): Walkthrough {
  // Filter in WHERE: join first, then test each joined row's date.
  const joined = joinPairs(CUSTOMERS, ORDERS, byCustomer, "left");
  const verdict = joined.map(([, j]) => inFeb(j === null ? null : ORDERS[j]!));
  const whereKept = joined.filter((_, k) => verdict[k] === true);
  // Filter in ON: the date is part of what counts as a match.
  const onJoined = joinPairs(CUSTOMERS, ORDERS, (c, o) => and3(byCustomer(c, o), inFeb(o)), "left");
  const count = (rows: typeof joined) =>
    CUSTOMERS.map((c, i) => ({ c, n: rows.filter(([a, b]) => a === i && b !== null).length, present: rows.some(([a]) => a === i) })).filter((x) => x.present);
  const whereCounts = count(whereKept);
  const onCounts = count(onJoined);
  expectRows("on-vs-where WHERE", whereCounts.map((x) => [x.c.name ?? null, x.n]), [["Asha", 1], ["Ben", 1]]);
  expectRows("on-vs-where ON", onCounts.map((x) => [x.c.name ?? null, x.n]), [["Asha", 1], ["Ben", 1], ["Chen", 0]]);

  const COLS = ["name", "order_id", "order_date"];
  const asRow = ([i, j]: [number | null, number | null]): Row => ({ name: CUSTOMERS[i!]!.name ?? null, order_id: j === null ? null : (ORDERS[j]!.id ?? null), order_date: j === null ? null : (ORDERS[j]!.order_date ?? null) });
  const W = { name: 62, order_id: 76, order_date: 100 };
  const keyOf = ([i, j]: [number | null, number | null]) => `${i}.${j ?? "n"}`;
  const GX = 340;

  const counts = (rows: { c: Row; n: number }[], y: number, title: string, lost: boolean): Item[] => {
    const t = rowsTable("g", title, ["name", "feb_orders"], rows.map((x) => ({ name: x.c.name ?? null, feb_orders: x.n })), {
      x: GX,
      y,
      key: (r) => String(rows[r]!.c.name),
      w: { name: 62, feb_orders: 86 },
      tone: (r) => (rows[r]!.n === 0 ? "accent" : "strong"),
    });
    const items = [...t.items];
    if (lost) items.push(label("lost", "Chen is gone", GX, t.bottom + 18, { anchor: "start", tone: "error", size: 11.5, mono: true, weight: 600 }));
    return items;
  };

  const whereFrame = (stage: "join" | "test" | "result"): Item[] => {
    const t = rowsTable("j", "LEFT JOIN, then WHERE", COLS, joined.map(asRow), {
      key: (r) => keyOf(joined[r]!),
      w: W,
      tone: (r) => (stage === "join" ? (joined[r]![1] === null ? "accent" : "plain") : verdict[r] === true ? "strong" : verdict[r] === null ? "error" : "muted"),
    });
    const items: Item[] = [...t.items];
    if (stage !== "join") joined.forEach((_, r) => items.push(rowTag(`v${keyOf(joined[r]!)}`, t, r, showTruth(verdict[r]!), { tone: verdict[r] === true ? "accent" : verdict[r] === null ? "error" : "faint", weight: 600 })));
    if (stage === "result") items.push(...counts(whereCounts, t.bottom + 26, "GROUP BY → result", true));
    return items;
  };
  const onFrame = (stage: "join" | "result"): Item[] => {
    const t = rowsTable("j", "LEFT JOIN … ON id AND date", COLS, onJoined.map(asRow), {
      key: (r) => keyOf(onJoined[r]!),
      w: W,
      tone: (r) => (onJoined[r]![1] === null ? "accent" : "strong"),
    });
    const items: Item[] = [...t.items];
    if (stage === "result") items.push(...counts(onCounts, t.bottom + 26, "GROUP BY → result", false));
    return items;
  };

  const chen = CUSTOMERS[2]!;
  return finish({
    title: "The trap: a right-table filter in WHERE undoes the left join",
    input: "count February orders, but list every customer",
    frames: [
      { caption: `The left join runs first and keeps ${show(chen.name)} as promised, with NULL for every order column, order_date included.`, items: whereFrame("join") },
      {
        caption: `WHERE then tests each joined row. January's order is FALSE; ${show(chen.name)}'s NULL date makes NULL >= '2024-02-01' UNKNOWN, and WHERE keeps only TRUE.`,
        items: whereFrame("test"),
      },
      { caption: `Only the two TRUE rows reach GROUP BY, so ${show(chen.name)} has vanished — the WHERE condition quietly turned the left join into an inner join.`, items: whereFrame("result") },
      {
        caption: `Move the date test into ON and it only decides which orders count as a match. January's order no longer matches Asha, and ${show(chen.name)}, matching nothing, is kept with NULLs.`,
        items: onFrame("join"),
      },
      { caption: `Counting o.id now gives every customer a row: ${onCounts.map((x) => `${show(x.c.name)} ${x.n}`).join(", ")}. Right-table filters go in ON; left-table filters go in WHERE.`, items: onFrame("result") },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "keep-every-customer": keepEveryCustomer,
  "on-vs-where": onVsWhere,
};
