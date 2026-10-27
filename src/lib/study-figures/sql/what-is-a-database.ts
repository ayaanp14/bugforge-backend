import { finish, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { arrow, label, region } from "../../lesson-figures/kit.js";
import { rowEdge, rowsTable, rowTag, show, type Row } from "./kit.js";

/**
 * What a database is: the lesson's two tables drawn as tables.
 *
 *  - table-anatomy: the `students` table read the database's way — the
 *    heading is the schema, a row a record, a column an attribute, and the
 *    primary key the one column whose values are all different;
 *  - foreign-key: `orders.customer_id` pointing into `customers.id`, a rename
 *    reaching every order through the pointer, and an order for a customer
 *    who does not exist refused.
 */

const STUDENTS: Row[] = [
  { id: 1, name: "Asha", year: 2, city: "Pune" },
  { id: 2, name: "Ravi", year: 1, city: "Chennai" },
  { id: 3, name: "Meera", year: 3, city: "Pune" },
];
const S_COLS = ["id", "name", "year", "city"];

function tableAnatomy(): Walkthrough {
  // The primary key is the column with no repeated and no NULL value — checked, not asserted.
  const unique = S_COLS.filter((c) => {
    const vs = STUDENTS.map((r) => r[c] ?? null);
    return vs.every((v) => v !== null) && new Set(vs).size === vs.length;
  });
  if (unique[0] !== "id") throw new Error(`table-anatomy: expected id to be the first unique column, got ${unique.join(",")}`);
  const pune = STUDENTS.filter((r) => r.city === "Pune").length;

  const draw = (focus: "all" | "schema" | "row" | "column" | "key"): Item[] => {
    const cityCol = S_COLS.indexOf("city");
    const t = rowsTable("s", "students", S_COLS, STUDENTS, {
      tone: (r, c) => {
        if (focus === "row") return r === 1 ? "accent" : "muted";
        if (focus === "column") return c === cityCol ? "accent" : "muted";
        if (focus === "key") return c === 0 ? "strong" : "muted";
        return "plain";
      },
      w: { id: 44, name: 74, year: 52, city: 86 },
    });
    const items: Item[] = [...t.items];
    if (focus === "schema") {
      items.push(...region("sch", t.left - 6, t.rowY(0) - 22, t.right - t.left + 12, 20, undefined, { tone: "accent" }));
      items.push(label("tag", "the schema: names and types", t.right + 12, t.rowY(0) - 12, { anchor: "start", tone: "accent", size: 11.5, weight: 600 }));
    }
    if (focus === "row") items.push(rowTag("tag", t, 1, "one row = one record (Ravi)", { tone: "accent", weight: 600 }));
    if (focus === "column") {
      const x = t.colX[cityCol]! + t.colW[cityCol]! / 2;
      items.push(label("tag", `one column = one attribute: ${pune} of ${STUDENTS.length} live in Pune`, t.left, t.bottom + 22, { anchor: "start", tone: "accent", size: 11.5, weight: 600 }));
      items.push(arrow("pt", { x, y: t.bottom + 10 }, { x, y: t.bottom + 2 }, { tone: "accent" }));
    }
    if (focus === "key") items.push(label("tag", "id: unique, never NULL — the primary key", t.left, t.bottom + 22, { anchor: "start", tone: "accent", size: 11.5, weight: 600 }));
    return items;
  };

  return finish({
    title: "A table: a fixed heading over a set of rows",
    input: "students(id, name, year, city)",
    frames: [
      { caption: `A relational table has a name, students, a fixed list of columns and a set of rows. This one holds ${STUDENTS.length} rows; the database keeps them in no particular order.`, items: draw("all") },
      { caption: "The heading — each column's name and type — is the schema. It changes rarely and on purpose; rows are inserted, updated and deleted all day.", items: draw("schema") },
      { caption: "Read across and a row is one record: everything the table knows about one student, here Ravi in year 1 from Chennai.", items: draw("row") },
      { caption: `Read down and a column is one attribute of every row. A query names it, city, never "the fourth column", and every value in it has the column's type.`, items: draw("column") },
      { caption: "id has a different value in every row and none is NULL, so it identifies exactly one row: the primary key. Two students may share a name and a city, never an id.", items: draw("key") },
    ],
  });
}

const CUSTOMERS: Row[] = [
  { id: 1, name: "Asha" },
  { id: 2, name: "Ravi" },
];
const ORDERS: Row[] = [
  { order_id: 101, customer_id: 1, amount: 450 },
  { order_id: 102, customer_id: 1, amount: 120 },
  { order_id: 103, customer_id: 2, amount: 900 },
];

function foreignKey(): Walkthrough {
  const target = (o: Row) => CUSTOMERS.findIndex((c) => c.id === o.customer_id);
  if (ORDERS.some((o) => target(o) < 0)) throw new Error("foreign-key: every order must point at a customer");
  const ashaOrders = ORDERS.filter((o) => o.customer_id === 1).length;
  const bad: Row = { order_id: 104, customer_id: 99, amount: 75 };
  if (CUSTOMERS.some((c) => c.id === bad.customer_id)) throw new Error("foreign-key: the refused order must point nowhere");

  const OX = 0;
  const CX = 330;
  const draw = (stage: "link" | "rename" | "refuse"): Item[] => {
    const customers = stage === "rename" ? CUSTOMERS.map((c) => (c.id === 1 ? { ...c, name: "Asha Rao" } : c)) : CUSTOMERS;
    const orders = stage === "refuse" ? [...ORDERS, bad] : ORDERS;
    const o = rowsTable("o", "orders", ["order_id", "customer_id", "amount"], orders, {
      x: OX,
      key: (r) => orders[r]!.order_id as number,
      tone: (r, c) => (orders[r] === bad ? "error" : c === 1 ? (stage === "rename" && orders[r]!.customer_id === 1 ? "accent" : "plain") : stage === "link" ? "plain" : "muted"),
      w: { order_id: 74, customer_id: 92, amount: 64 },
    });
    const c = rowsTable("c", "customers", ["id", "name"], customers, {
      x: CX,
      key: (r) => customers[r]!.id as number,
      tone: (r, col) => (stage === "rename" && r === 0 && col === 1 ? "strong" : col === 0 ? "accent" : "plain"),
      w: { id: 40, name: 84 },
    });
    const items: Item[] = [...o.items, ...c.items];
    ORDERS.forEach((ord, r) => {
      const hot = stage === "rename" && ord.customer_id === 1;
      items.push(arrow(`l${ord.order_id}`, rowEdge(o, r, "right"), rowEdge(c, target(ord), "left"), { tone: hot ? "accent" : stage === "link" ? "accent" : "line" }));
    });
    items.push(label("fk", "customer_id → customers.id", (o.right + CX) / 2, o.bottom + 22, { tone: "soft", size: 11, mono: true }));
    if (stage === "refuse") items.push(rowTag("no", o, orders.length - 1, `no customer ${show(bad.customer_id)}: refused`, { tone: "error", weight: 600 }));
    return items;
  };

  return finish({
    title: "A foreign key points at another table's primary key",
    input: "orders.customer_id REFERENCES customers(id)",
    frames: [
      {
        caption: `Each order stores only its customer's id. Every customer_id is a value of customers.id, so each order points at exactly one customer — ${ashaOrders} of them at Asha.`,
        items: draw("link"),
      },
      {
        caption: `The name is stored once, in customers. Rename Asha and both of her orders read the new name through the pointer; nothing was copied, so nothing is left stale.`,
        items: draw("rename"),
      },
      {
        caption: `Order ${show(bad.order_id)} names customer ${show(bad.customer_id)}, and no row of customers has that id. With the foreign key declared, the database refuses the insert instead of storing an order for nobody.`,
        items: draw("refuse"),
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "table-anatomy": tableAnatomy,
  "foreign-key": foreignKey,
};
