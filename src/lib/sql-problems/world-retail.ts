import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, atTime, chance, dateBetween, maybeNull, pick, ri, sample, shuffle } from "./kit.js";

/**
 * Retail stores, inventory and supply chain: the questions a store-operations
 * analyst, a category manager or a warehouse lead at an Indian grocery and
 * household chain is asked every week — what is below its reorder point, which
 * purchase orders are late, how long suppliers really take, what was received
 * against what was ordered, stock-outs and their streaks, shrinkage found at a
 * cycle count, transfers between warehouses, FIFO valuation of what is left on
 * the shelf, and which products leave the store in the same basket. Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);

const SKUS = [
  ["GRO-1001", "Basmati Rice 5kg", 640],
  ["GRO-1002", "Toor Dal 1kg", 165],
  ["GRO-1003", "Atta 10kg", 455],
  ["DAI-2001", "Table Butter 500g", 275],
  ["DAI-2002", "Paneer 200g", 90],
  ["BEV-3001", "Masala Chai 250g", 140],
  ["BEV-3002", "Filter Coffee 500g", 310],
  ["PER-4001", "Neem Soap 4-pack", 120],
  ["PER-4002", "Coconut Hair Oil 500ml", 210],
  ["HOM-5001", "Dishwash Gel 500ml", 99],
  ["HOM-5002", "Floor Cleaner 1L", 185],
  ["SNK-6001", "Masala Chips 90g", 30],
  ["SNK-6002", "Salted Peanuts 200g", 60],
  ["SNK-6003", "Khakhra Methi 200g", 75],
] as const;
const SKU_CODES = SKUS.map((s) => s[0]);
const STORE_NAMES = ["Indiranagar", "Andheri West", "Salt Lake", "Banjara Hills", "Anna Nagar", "Kothrud", "Vaishali Nagar", "Navrangpura", "Kakkanad", "Saket"] as const;
const SUPPLIER_NAMES = [
  "Sharma Traders", "Annapurna Foods", "Deccan Distributors", "Gupta Agencies", "Coastal Consumer Goods",
  "Shree Balaji Wholesale", "Malabar Spices Co", "Nandi Dairy Supplies", "Ganesh Packaging", "Royal FMCG Partners",
] as const;
const CITY_LIST = ["Bengaluru", "Mumbai", "Kolkata", "Hyderabad", "Chennai", "Pune", "Jaipur", "Ahmedabad", "Kochi", "Delhi"] as const;

export const WORLD_RETAIL: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "store-skus-at-or-below-reorder-point",
    title: "Store SKUs At or Below Their Reorder Point",
    difficulty: "EASY",
    topics: ["Basics"],
    description: [
      "Every evening the replenishment team pulls the shelf positions that need a fresh order. A position needs one when its stock on hand is **at or below** its reorder point. Some positions have no reorder point configured yet (`reorder_point` NULL); they are never flagged.",
      "",
      "Return `store_id`, `sku`, `on_hand`, `reorder_point` and `units_short` (the reorder point minus the stock on hand, 0 when they are equal) for every flagged position. Order the rows by `units_short` **highest first**, then by `store_id`, then by `sku`.",
    ].join("\n"),
    tables: [
      {
        name: "StockLevel",
        columns: [
          { name: "store_id", type: "int" },
          { name: "sku", type: "varchar" },
          { name: "on_hand", type: "int" },
          { name: "reorder_point", type: "int" },
        ],
        primaryKey: ["store_id", "sku"],
        note: "One row per product per store. `reorder_point` is NULL where the planner has not set one.",
      },
    ],
    examples: [
      {
        StockLevel: [
          [1, "GRO-1001", 12, 20],
          [1, "DAI-2002", 30, 30],
          [1, "SNK-6001", 140, 60],
          [2, "GRO-1001", 4, 20],
          [2, "BEV-3001", 0, null],
          [2, "HOM-5001", 9, 12],
          [3, "PER-4001", 25, 15],
        ],
      },
    ],
    gen: (rng) => {
      const stores = seq(1, ri(rng, 1, 4));
      const rows: Cell[][] = [];
      for (const s of stores) {
        for (const sku of sample(rng, SKU_CODES, ri(rng, 0, 6))) {
          const rp = maybeNull(rng, 0.15, ri(rng, 2, 8) * 5);
          const on = rp !== null && chance(rng, 0.2) ? rp : ri(rng, 0, 60);
          rows.push([s, sku, on, rp]);
        }
      }
      return { StockLevel: shuffle(rng, rows) };
    },
    solution: [
      "SELECT store_id, sku, on_hand, reorder_point,",
      "       reorder_point - on_hand AS units_short",
      "FROM StockLevel",
      "WHERE on_hand <= reorder_point",
      "ORDER BY units_short DESC, store_id, sku",
    ].join("\n"),
    alternatives: [
      "SELECT store_id, sku, on_hand, reorder_point, reorder_point - on_hand AS units_short FROM StockLevel WHERE reorder_point IS NOT NULL AND NOT (on_hand > reorder_point) ORDER BY reorder_point - on_hand DESC, store_id, sku",
      "SELECT store_id, sku, on_hand, reorder_point, reorder_point - on_hand AS units_short FROM StockLevel WHERE reorder_point - on_hand >= 0 ORDER BY 5 DESC, 1, 2",
    ],
    ordered: true,
    hints: [
      "\"At or below\" is a comparison that includes equality.",
      "What does a comparison with a NULL reorder point evaluate to, and does WHERE keep such a row?",
      "You can sort by the alias of a computed column.",
    ],
    editorial: [
      "This is a single-table filter with one computed column. A position needs an order when `on_hand <= reorder_point`; the `<=` matters, because a shelf sitting exactly on its reorder point is the moment the planner wants to order, and `units_short` is then 0.",
      "",
      "Positions with a NULL reorder point drop out by themselves: `12 <= NULL` is *unknown*, not true, and `WHERE` keeps only rows whose condition is true. Writing `reorder_point IS NOT NULL` explicitly, as one alternative does, says the same thing more loudly. Beware the opposite trick — `NOT (on_hand > reorder_point)` is also unknown for NULL, so it is safe here too, but a `COALESCE(reorder_point, 0)` would wrongly flag empty unconfigured shelves.",
      "",
      "The order needs three keys so that two positions with the same shortfall come out in a fixed order. The query reads the table once; with an index on `(store_id, sku)` the sort is the only extra cost.",
    ].join("\n"),
  },

  {
    slug: "suppliers-with-no-purchase-order-in-2024",
    title: "Suppliers With No Purchase Order in 2024",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "Procurement is cleaning up the vendor master before the next financial audit. A supplier is dormant when **no purchase order dated in calendar year 2024** was raised on them — orders from 2023 or 2025 do not keep a supplier active.",
      "",
      "Return `supplier_id` and `supplier_name` for every dormant supplier, including suppliers that never received any order at all. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Supplier",
        columns: [
          { name: "supplier_id", type: "int" },
          { name: "supplier_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["supplier_id"],
        note: "One row per registered supplier.",
      },
      {
        name: "PurchaseOrder",
        columns: [
          { name: "po_id", type: "int" },
          { name: "supplier_id", type: "int" },
          { name: "order_date", type: "date" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["po_id"],
        note: "One row per purchase order; `amount` is in rupees. `supplier_id` is always in `Supplier`.",
      },
    ],
    examples: [
      {
        Supplier: [
          [1, "Sharma Traders", "Delhi"],
          [2, "Annapurna Foods", "Pune"],
          [3, "Deccan Distributors", "Hyderabad"],
          [4, "Gupta Agencies", "Jaipur"],
          [5, "Malabar Spices Co", "Kochi"],
        ],
        PurchaseOrder: [
          [101, 1, "2024-03-12", 48000],
          [102, 2, "2023-12-30", 21500],
          [103, 2, "2025-01-04", 33000],
          [104, 3, "2024-12-31", 9000],
          [105, 1, "2024-07-19", 56000],
          [106, 5, "2024-01-01", 12500],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const sups = sample(rng, SUPPLIER_NAMES, n).map((name, i) => [i + 1, name, pick(rng, CITY_LIST)]);
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 16);
      const pos = seq(101, m).map((id) => {
        const d = chance(rng, 0.25) ? pick(rng, ["2023-12-31", "2024-01-01", "2024-12-31", "2025-01-01"]) : dateBetween(rng, "2023-06-01", "2025-06-30");
        return [id, ri(rng, 1, n), d, ri(rng, 10, 90) * 500];
      });
      return { Supplier: sups, PurchaseOrder: pos };
    },
    solution: [
      "SELECT s.supplier_id, s.supplier_name",
      "FROM Supplier s",
      "LEFT JOIN PurchaseOrder po",
      "  ON po.supplier_id = s.supplier_id",
      " AND po.order_date BETWEEN '2024-01-01' AND '2024-12-31'",
      "WHERE po.po_id IS NULL",
    ].join("\n"),
    alternatives: [
      "SELECT supplier_id, supplier_name FROM Supplier s WHERE NOT EXISTS (SELECT 1 FROM PurchaseOrder po WHERE po.supplier_id = s.supplier_id AND YEAR(po.order_date) = 2024)",
      "SELECT supplier_id, supplier_name FROM Supplier WHERE supplier_id NOT IN (SELECT supplier_id FROM PurchaseOrder WHERE order_date >= '2024-01-01' AND order_date < '2025-01-01')",
    ],
    hints: [
      "Start from `Supplier`: every row of the answer is a supplier, including ones with no orders anywhere.",
      "If you LEFT JOIN the orders, where must the 2024 condition go — the ON clause or the WHERE clause?",
      "A supplier with orders only in 2023 must still be returned.",
    ],
    editorial: [
      "This is an anti join with a condition on the *other* table. The LEFT JOIN brings in each supplier's 2024 orders only, because the year test sits in the `ON` clause; a supplier with no 2024 order then appears once with NULLs in every order column, and `po.po_id IS NULL` keeps exactly those rows.",
      "",
      "The classic mistake is to put the date test in `WHERE`. Then the join brings in all of a supplier's orders, and the filter `order_date BETWEEN …` removes the NULL rows of suppliers with no orders while `po_id IS NULL` removes everything else — the answer comes back empty. Conditions on the optional side of an outer join belong in `ON`.",
      "",
      "`NOT EXISTS` with the year test in the subquery reads more directly and is what most optimisers do with the join anyway. `NOT IN` is safe here only because `supplier_id` is never NULL in `PurchaseOrder`. The boundary dates 2024-01-01 and 2024-12-31 are both in the year, so `BETWEEN` is inclusive at both ends as needed.",
    ].join("\n"),
  },

  {
    slug: "stores-crossing-paid-bill-revenue-mark",
    title: "Stores Crossing ₹20,000 in Paid POS Bills",
    difficulty: "EASY",
    topics: ["Aggregation"],
    description: [
      "The POS system records every bill rung up at a till; a bill is later `VOIDED` if the cashier cancelled it or `REFUNDED` if the customer returned the goods. Only `PAID` bills count as revenue.",
      "",
      "Return `store_id`, `paid_bills` (the number of paid bills) and `revenue` (the sum of their amounts) for every store whose paid revenue is **at least 20000** rupees. Order the rows by `revenue` **highest first**, then by `store_id`.",
    ].join("\n"),
    tables: [
      {
        name: "PosBill",
        columns: [
          { name: "bill_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "bill_date", type: "date" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["PAID", "VOIDED", "REFUNDED"] },
        ],
        primaryKey: ["bill_id"],
        note: "One row per bill rung up at a till; `amount` is the bill total in rupees.",
      },
    ],
    examples: [
      {
        PosBill: [
          [1, 1, "2025-03-01", 12500, "PAID"],
          [2, 1, "2025-03-01", 9000, "PAID"],
          [3, 2, "2025-03-02", 18000, "PAID"],
          [4, 2, "2025-03-02", 7000, "VOIDED"],
          [5, 3, "2025-03-03", 20000, "PAID"],
          [6, 4, "2025-03-03", 26000, "REFUNDED"],
          [7, 3, "2025-03-04", 1500, "REFUNDED"],
        ],
      },
    ],
    gen: (rng) => {
      const stores = ri(rng, 1, 5);
      const m = chance(rng, 0.05) ? 0 : ri(rng, 2, 22);
      const rows = seq(1, m).map((id) => [
        id,
        ri(rng, 1, stores),
        dateBetween(rng, "2025-03-01", "2025-03-31"),
        chance(rng, 0.15) ? 20000 : ri(rng, 2, 30) * 500,
        pick(rng, ["PAID", "PAID", "PAID", "VOIDED", "REFUNDED"]),
      ]);
      return { PosBill: rows };
    },
    solution: [
      "SELECT store_id, COUNT(*) AS paid_bills, SUM(amount) AS revenue",
      "FROM PosBill",
      "WHERE status = 'PAID'",
      "GROUP BY store_id",
      "HAVING SUM(amount) >= 20000",
      "ORDER BY revenue DESC, store_id",
    ].join("\n"),
    alternatives: [
      "SELECT store_id, paid_bills, revenue FROM (SELECT store_id, COUNT(*) AS paid_bills, SUM(amount) AS revenue FROM PosBill WHERE status = 'PAID' GROUP BY store_id) t WHERE revenue >= 20000 ORDER BY revenue DESC, store_id",
      "SELECT store_id, SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) AS paid_bills, SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END) AS revenue FROM PosBill GROUP BY store_id HAVING SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END) >= 20000 ORDER BY revenue DESC, store_id",
    ],
    ordered: true,
    hints: [
      "Remove voided and refunded bills before you add anything up.",
      "A condition on a sum cannot go in WHERE — WHERE runs before the groups exist.",
      "\"At least\" includes a store whose revenue is exactly 20000.",
    ],
    editorial: [
      "Two filters happen at two different moments. The status test is about individual bills, so it goes in `WHERE` and runs before grouping — voided and refunded bills never enter a store's count or sum. The revenue threshold is about a whole store, so it can only be tested after `GROUP BY store_id` has formed the groups, which is what `HAVING` is for.",
      "",
      "A store whose bills are all voided or refunded has no paid rows, so it forms no group and is not in the answer, which is right: its revenue is 0. The threshold is inclusive, so a store at exactly ₹20,000 is listed.",
      "",
      "The same answer comes from grouping in a derived table and filtering its `revenue` column outside, or from conditional sums over all bills with the test inside `CASE`. The first form is the cheapest: an index on `(status, store_id)` lets the database read only the paid bills.",
    ].join("\n"),
  },

  {
    slug: "category-codes-from-sku-prefixes",
    title: "Category Codes From SKU Prefixes",
    difficulty: "EASY",
    topics: ["Strings", "Aggregation"],
    description: [
      "Product SKUs are built as `<category code>-<number>`, and a pack-size variant adds one more part, as in `SNK-6001-L`. The category code is always the part **before the first hyphen**.",
      "",
      "Return one row per category code with the columns `category_code`, `product_count` (how many products carry it) and `max_mrp` (the highest MRP among them). Order the rows by `category_code`.",
    ].join("\n"),
    tables: [
      {
        name: "Product",
        columns: [
          { name: "sku", type: "varchar" },
          { name: "product_name", type: "varchar" },
          { name: "mrp", type: "int" },
        ],
        primaryKey: ["sku"],
        note: "One row per product in the chain's catalogue; `mrp` is the printed maximum retail price in rupees. SKUs are upper case.",
      },
    ],
    examples: [
      {
        Product: [
          ["GRO-1001", "Basmati Rice 5kg", 640],
          ["GRO-1002", "Toor Dal 1kg", 165],
          ["SNK-6001", "Masala Chips 90g", 30],
          ["SNK-6001-L", "Masala Chips 180g", 55],
          ["DAI-2002", "Paneer 200g", 90],
          ["HOM-5001", "Dishwash Gel 500ml", 99],
          ["HOM-5001-R", "Dishwash Gel Refill 1L", 165],
        ],
      },
    ],
    gen: (rng) => {
      const base = sample(rng, SKUS, ri(rng, 1, 10));
      const rows: Cell[][] = [];
      for (const [sku, name, mrp] of base) {
        rows.push([sku, name, mrp]);
        if (chance(rng, 0.3)) rows.push([`${sku}-${pick(rng, ["L", "R", "XL"])}`, `${name} (variant)`, mrp + ri(rng, 1, 20) * 5]);
      }
      return { Product: shuffle(rng, rows) };
    },
    solution: [
      "SELECT SUBSTRING_INDEX(sku, '-', 1) AS category_code,",
      "       COUNT(*) AS product_count,",
      "       MAX(mrp) AS max_mrp",
      "FROM Product",
      "GROUP BY SUBSTRING_INDEX(sku, '-', 1)",
      "ORDER BY category_code",
    ].join("\n"),
    alternatives: [
      "SELECT LEFT(sku, LOCATE('-', sku) - 1) AS category_code, COUNT(*) AS product_count, MAX(mrp) AS max_mrp FROM Product GROUP BY LEFT(sku, LOCATE('-', sku) - 1) ORDER BY category_code",
      "SELECT category_code, COUNT(*) AS product_count, MAX(mrp) AS max_mrp FROM (SELECT SUBSTRING(sku, 1, INSTR(sku, '-') - 1) AS category_code, mrp FROM Product) p GROUP BY category_code ORDER BY category_code",
    ],
    ordered: true,
    hints: [
      "You need the text before the first `-`; a variant SKU has two hyphens, so \"everything up to the last hyphen\" is wrong.",
      "`SUBSTRING_INDEX(s, '-', 1)` or `LEFT(s, LOCATE('-', s) - 1)` both cut at the first hyphen.",
      "Group by the extracted code, not by the full SKU.",
    ],
    editorial: [
      "The category is not a column — it is hidden inside the SKU, so the query first derives it and then groups on the derived value. `SUBSTRING_INDEX(sku, '-', 1)` returns everything before the first occurrence of the delimiter, which is exactly the code for both `SNK-6001` and the variant `SNK-6001-L`. `LEFT(sku, LOCATE('-', sku) - 1)` computes the same thing from the hyphen's position.",
      "",
      "Once each row has its code, the rest is a plain `GROUP BY` with `COUNT(*)` and `MAX(mrp)`. Grouping by the same expression that is selected keeps MySQL's ONLY_FULL_GROUP_BY mode happy; computing the code in a derived table first, as the last alternative does, avoids repeating the expression.",
      "",
      "Two pitfalls: cutting at the *last* hyphen (`SUBSTRING_INDEX(sku, '-', -1)` takes the tail instead), and grouping by `sku`, which would give one row per product. Every SKU here contains a hyphen; if some did not, `LOCATE` would return 0 and the `LEFT` version would give an empty code while `SUBSTRING_INDEX` would give the whole SKU.",
    ].join("\n"),
  },

  {
    slug: "open-purchase-orders-past-promised-date",
    title: "Open Purchase Orders Past Their Promised Date",
    difficulty: "EASY",
    topics: ["Dates", "Basics"],
    description: [
      "The buying desk reviews late deliveries every Saturday; today is **2025-03-15**. A purchase order is overdue when it is still `OPEN` and its promised delivery date is **before** today. Received and cancelled orders are never overdue, even if they have no received date.",
      "",
      "Return `po_id`, `supplier_id`, `promised_date` and `days_overdue` (the number of days from the promised date to 2025-03-15). Order the rows by `days_overdue` **highest first**, then by `po_id`.",
    ].join("\n"),
    tables: [
      {
        name: "PurchaseOrder",
        columns: [
          { name: "po_id", type: "int" },
          { name: "supplier_id", type: "int" },
          { name: "order_date", type: "date" },
          { name: "promised_date", type: "date" },
          { name: "received_date", type: "date" },
          { name: "status", type: "enum", values: ["OPEN", "RECEIVED", "CANCELLED"] },
        ],
        primaryKey: ["po_id"],
        note: "`received_date` is set only when the goods arrived; it is NULL for open and for cancelled orders.",
      },
    ],
    examples: [
      {
        PurchaseOrder: [
          [201, 1, "2025-02-20", "2025-03-01", null, "OPEN"],
          [202, 2, "2025-02-25", "2025-03-05", "2025-03-04", "RECEIVED"],
          [203, 2, "2025-03-01", "2025-03-14", null, "OPEN"],
          [204, 3, "2025-03-02", "2025-03-15", null, "OPEN"],
          [205, 4, "2025-02-10", "2025-02-20", null, "CANCELLED"],
          [206, 3, "2025-02-15", "2025-03-01", null, "OPEN"],
        ],
      },
    ],
    gen: (rng) => {
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 16);
      const rows = seq(201, m).map((id) => {
        const promised = chance(rng, 0.2) ? pick(rng, ["2025-03-14", "2025-03-15", "2025-03-16"]) : dateBetween(rng, "2025-01-20", "2025-03-30");
        const status = pick(rng, ["OPEN", "OPEN", "OPEN", "RECEIVED", "CANCELLED"]);
        const received = status === "RECEIVED" ? addDays(promised, ri(rng, -3, 6)) : null;
        return [id, ri(rng, 1, 6), addDays(promised, -ri(rng, 5, 20)), promised, received, status];
      });
      return { PurchaseOrder: rows };
    },
    solution: [
      "SELECT po_id, supplier_id, promised_date,",
      "       DATEDIFF('2025-03-15', promised_date) AS days_overdue",
      "FROM PurchaseOrder",
      "WHERE status = 'OPEN'",
      "  AND promised_date < '2025-03-15'",
      "ORDER BY days_overdue DESC, po_id",
    ].join("\n"),
    alternatives: [
      "SELECT po_id, supplier_id, promised_date, DATEDIFF('2025-03-15', promised_date) AS days_overdue FROM PurchaseOrder WHERE status = 'OPEN' AND DATEDIFF('2025-03-15', promised_date) > 0 ORDER BY days_overdue DESC, po_id",
      "SELECT po_id, supplier_id, promised_date, TIMESTAMPDIFF(DAY, promised_date, '2025-03-15') AS days_overdue FROM PurchaseOrder WHERE status = 'OPEN' AND promised_date <= DATE_SUB('2025-03-15', INTERVAL 1 DAY) ORDER BY days_overdue DESC, po_id",
    ],
    ordered: true,
    hints: [
      "A NULL `received_date` alone does not mean the order is open — look at the status.",
      "An order promised for today itself is not late yet.",
      "`DATEDIFF(later, earlier)` gives a positive number of days.",
    ],
    editorial: [
      "Two conditions decide whether an order is overdue: it must still be open, and its promised date must be strictly before the review date. The status test is the one people skip — they filter on `received_date IS NULL`, which also catches cancelled orders that will never arrive and should not be chased.",
      "",
      "The date test is strict: an order promised for 2025-03-15 is due today, not late. Dates are stored as `YYYY-MM-DD`, so comparing them as values (or as text) orders them correctly. `DATEDIFF('2025-03-15', promised_date)` then counts the days of delay — the later date goes first so the number is positive. `TIMESTAMPDIFF(DAY, promised_date, '2025-03-15')` gives the same count with the arguments the other way round.",
      "",
      "Because many orders can be equally late, `po_id` is the final sort key. The query is one pass over the table; an index on `(status, promised_date)` would serve it directly.",
    ].join("\n"),
  },

  {
    slug: "net-stock-change-per-sku-from-movements",
    title: "Net Stock Change per SKU From the Movement Log",
    difficulty: "EASY",
    topics: ["Conditional Logic", "Aggregation"],
    description: [
      "The warehouse logs every stock movement with a positive `qty` and a `move_type`. Goods receipts (`GRN`) and customer returns (`RETURN`) **add** stock; sales picks (`PICK`), damaged write-offs (`DAMAGE`) and transfers out (`TRANSFER_OUT`) **remove** it.",
      "",
      "Return one row per SKU that has movements, with the columns `sku`, `units_in`, `units_out` and `net_change` (`units_in` minus `units_out`; negative when more left than came in). Order the rows by `sku`.",
    ].join("\n"),
    tables: [
      {
        name: "StockMovement",
        columns: [
          { name: "move_id", type: "int" },
          { name: "sku", type: "varchar" },
          { name: "move_type", type: "enum", values: ["GRN", "RETURN", "PICK", "DAMAGE", "TRANSFER_OUT"] },
          { name: "qty", type: "int" },
          { name: "moved_at", type: "datetime" },
        ],
        primaryKey: ["move_id"],
        note: "`qty` is always positive; the direction comes from `move_type`.",
      },
    ],
    examples: [
      {
        StockMovement: [
          [1, "GRO-1001", "GRN", 100, "2025-04-01 09:10:00"],
          [2, "GRO-1001", "PICK", 35, "2025-04-01 13:45:00"],
          [3, "GRO-1001", "RETURN", 2, "2025-04-02 11:00:00"],
          [4, "DAI-2002", "GRN", 40, "2025-04-01 07:30:00"],
          [5, "DAI-2002", "DAMAGE", 6, "2025-04-02 18:20:00"],
          [6, "DAI-2002", "PICK", 38, "2025-04-03 12:05:00"],
          [7, "SNK-6001", "TRANSFER_OUT", 24, "2025-04-03 16:40:00"],
        ],
      },
    ],
    gen: (rng) => {
      const skus = sample(rng, SKU_CODES, ri(rng, 1, 5));
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 20);
      const rows = seq(1, m).map((id) => [
        id,
        pick(rng, skus),
        pick(rng, ["GRN", "GRN", "RETURN", "PICK", "PICK", "DAMAGE", "TRANSFER_OUT"]),
        ri(rng, 1, 60),
        atTime(rng, dateBetween(rng, "2025-04-01", "2025-04-10")),
      ]);
      return { StockMovement: rows };
    },
    solution: [
      "SELECT sku,",
      "       SUM(CASE WHEN move_type IN ('GRN', 'RETURN') THEN qty ELSE 0 END) AS units_in,",
      "       SUM(CASE WHEN move_type IN ('PICK', 'DAMAGE', 'TRANSFER_OUT') THEN qty ELSE 0 END) AS units_out,",
      "       SUM(CASE WHEN move_type IN ('GRN', 'RETURN') THEN qty ELSE -qty END) AS net_change",
      "FROM StockMovement",
      "GROUP BY sku",
      "ORDER BY sku",
    ].join("\n"),
    alternatives: [
      "SELECT sku, units_in, units_out, units_in - units_out AS net_change FROM (SELECT sku, SUM(IF(move_type = 'GRN' OR move_type = 'RETURN', qty, 0)) AS units_in, SUM(IF(move_type = 'GRN' OR move_type = 'RETURN', 0, qty)) AS units_out FROM StockMovement GROUP BY sku) t ORDER BY sku",
    ],
    ordered: true,
    hints: [
      "The sign of a movement is not stored — derive it from `move_type` with CASE.",
      "A sum over a CASE that yields `qty` or 0 counts only the rows you care about.",
      "Group by SKU so each product gets one row.",
    ],
    editorial: [
      "The log stores quantities without a direction, so the query supplies the direction itself. **Conditional aggregation** does it in one pass: inside `SUM`, a `CASE` returns `qty` for the movement types that belong to the column and 0 for the rest. One sum collects the inbound types, another the outbound ones, and a third adds `qty` or `-qty` to get the net change directly.",
      "",
      "Every SKU in the answer has at least one movement, so no sum is NULL — a SKU with only outbound moves gets `units_in` 0, because the `ELSE 0` turns its non-matching rows into zeros rather than leaving the sum empty. A negative `net_change` is a real situation (stock that was on the shelf before the log began left this week).",
      "",
      "The alternative computes the two totals with `IF` in a derived table and subtracts outside; it is the same single scan of the table. A `UNION ALL` of signed rows would also work but reads the table twice.",
    ].join("\n"),
  },

  {
    slug: "march-pos-bills-by-weekday",
    title: "March POS Bills by Day of the Week",
    difficulty: "EASY",
    topics: ["Dates", "Aggregation"],
    description: [
      "Store managers plan cashier shifts from the weekday pattern of the till. Consider only bills rung up in **March 2025** (any store).",
      "",
      "Return one row per weekday that had bills, with the columns `weekday` (the full English day name, e.g. `Saturday`), `bills` (the number of bills) and `revenue` (their total amount). Order the rows by `bills` **highest first**, then by `weekday` alphabetically.",
    ].join("\n"),
    tables: [
      {
        name: "TillBill",
        columns: [
          { name: "bill_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "billed_at", type: "datetime" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["bill_id"],
        note: "One row per paid bill; `billed_at` is the local time the bill was closed.",
      },
    ],
    examples: [
      {
        TillBill: [
          [1, 1, "2025-03-01 10:15:00", 840],
          [2, 2, "2025-03-01 19:40:00", 1260],
          [3, 1, "2025-03-02 11:05:00", 455],
          [4, 1, "2025-03-08 18:30:00", 2190],
          [5, 3, "2025-03-03 09:50:00", 310],
          [6, 2, "2025-03-31 23:59:00", 600],
          [7, 2, "2025-04-01 00:05:00", 990],
          [8, 3, "2025-02-28 20:10:00", 1500],
        ],
      },
    ],
    gen: (rng) => {
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      const rows = seq(1, m).map((id) => {
        const d = chance(rng, 0.15) ? pick(rng, ["2025-02-28", "2025-04-01"]) : dateBetween(rng, "2025-03-01", "2025-03-31");
        return [id, ri(rng, 1, 4), atTime(rng, d), ri(rng, 3, 60) * 30];
      });
      return { TillBill: rows };
    },
    solution: [
      "SELECT DAYNAME(billed_at) AS weekday,",
      "       COUNT(*) AS bills,",
      "       SUM(amount) AS revenue",
      "FROM TillBill",
      "WHERE billed_at >= '2025-03-01' AND billed_at < '2025-04-01'",
      "GROUP BY DAYNAME(billed_at)",
      "ORDER BY bills DESC, weekday",
    ].join("\n"),
    alternatives: [
      "SELECT DATE_FORMAT(billed_at, '%W') AS weekday, COUNT(*) AS bills, SUM(amount) AS revenue FROM TillBill WHERE YEAR(billed_at) = 2025 AND MONTH(billed_at) = 3 GROUP BY DATE_FORMAT(billed_at, '%W') ORDER BY bills DESC, weekday",
    ],
    ordered: true,
    hints: [
      "Keep the month boundary half-open: from 2025-03-01 up to, but not including, 2025-04-01 — a bill at 23:59 on the 31st counts.",
      "`DAYNAME()` (or `DATE_FORMAT(d, '%W')`) turns a date into its weekday name.",
      "Group by the weekday name, then sort by the count.",
    ],
    editorial: [
      "Two date operations make this query: a range filter for the month and a weekday extraction for the grouping. For the month, a half-open range `billed_at >= '2025-03-01' AND billed_at < '2025-04-01'` is the safest form for datetimes — `BETWEEN '2025-03-01' AND '2025-03-31'` would silently drop every bill after midnight on the 31st, because `'2025-03-31 23:59:00'` is greater than `'2025-03-31'`. Testing `YEAR()` and `MONTH()` is equally correct but cannot use an index on `billed_at`.",
      "",
      "`DAYNAME(billed_at)` maps each bill to its weekday name; grouping on it gives at most seven rows, each with `COUNT(*)` and `SUM(amount)`. Weekdays with no bill simply do not appear. Several weekdays can have the same number of bills, so the name is the second sort key.",
      "",
      "The cost is one scan of the month plus a tiny grouping step.",
    ].join("\n"),
  },

  {
    slug: "warehouse-stock-value-including-empty-sites",
    title: "Warehouse Stock Value Including Empty Sites",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "Finance wants the value of stock held at each warehouse, at cost: the sum over its inventory rows of `qty × unit_cost`. A newly opened warehouse with no inventory rows must still be listed, with a value of **0**.",
      "",
      "Return `warehouse_id`, `city` and `stock_value` (rounded to 2 decimal places). Order the rows by `stock_value` **highest first**, then by `warehouse_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Warehouse",
        columns: [
          { name: "warehouse_id", type: "int" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["warehouse_id"],
        note: "One row per warehouse of the chain.",
      },
      {
        name: "Inventory",
        columns: [
          { name: "warehouse_id", type: "int" },
          { name: "sku", type: "varchar" },
          { name: "qty", type: "int" },
        ],
        primaryKey: ["warehouse_id", "sku"],
        note: "Units of a SKU on hand at a warehouse.",
      },
      {
        name: "ProductCost",
        columns: [
          { name: "sku", type: "varchar" },
          { name: "unit_cost", type: "decimal" },
        ],
        primaryKey: ["sku"],
        note: "The landed cost per unit in rupees. Every SKU in `Inventory` has a row here.",
      },
    ],
    examples: [
      {
        Warehouse: [
          [1, "Bengaluru"],
          [2, "Pune"],
          [3, "Kolkata"],
          [4, "Jaipur"],
        ],
        Inventory: [
          [1, "GRO-1001", 50],
          [1, "DAI-2002", 120],
          [2, "GRO-1001", 20],
          [2, "SNK-6001", 400],
          [3, "HOM-5001", 10],
        ],
        ProductCost: [
          ["GRO-1001", 512.5],
          ["DAI-2002", 68.25],
          ["SNK-6001", 21.4],
          ["HOM-5001", 72],
        ],
      },
    ],
    gen: (rng) => {
      const wh = sample(rng, CITY_LIST, ri(rng, 1, 6)).map((c, i) => [i + 1, c]);
      const skus = sample(rng, SKUS, ri(rng, 1, 8));
      const costs = skus.map(([s, , mrp]) => [s, Math.round(mrp * (0.55 + rng() * 0.3) * 4) / 4]);
      const inv: Cell[][] = [];
      for (const w of wh) {
        if (chance(rng, 0.25)) continue;
        for (const [s] of sample(rng, skus, ri(rng, 0, 4))) inv.push([w[0]!, s, ri(rng, 0, 200)]);
      }
      return { Warehouse: wh, Inventory: inv, ProductCost: costs };
    },
    solution: [
      "SELECT w.warehouse_id, w.city,",
      "       ROUND(COALESCE(SUM(i.qty * c.unit_cost), 0), 2) AS stock_value",
      "FROM Warehouse w",
      "LEFT JOIN Inventory i ON i.warehouse_id = w.warehouse_id",
      "LEFT JOIN ProductCost c ON c.sku = i.sku",
      "GROUP BY w.warehouse_id, w.city",
      "ORDER BY stock_value DESC, w.warehouse_id",
    ].join("\n"),
    alternatives: [
      "SELECT w.warehouse_id, w.city, ROUND(COALESCE((SELECT SUM(i.qty * c.unit_cost) FROM Inventory i JOIN ProductCost c ON c.sku = i.sku WHERE i.warehouse_id = w.warehouse_id), 0), 2) AS stock_value FROM Warehouse w ORDER BY stock_value DESC, w.warehouse_id",
      "SELECT w.warehouse_id, w.city, ROUND(IFNULL(v.val, 0), 2) AS stock_value FROM Warehouse w LEFT JOIN (SELECT i.warehouse_id, SUM(i.qty * c.unit_cost) AS val FROM Inventory i JOIN ProductCost c ON c.sku = i.sku GROUP BY i.warehouse_id) v ON v.warehouse_id = w.warehouse_id ORDER BY stock_value DESC, w.warehouse_id",
    ],
    ordered: true,
    hints: [
      "Start from `Warehouse` so empty warehouses survive, and outer-join the inventory to it.",
      "The cost table has to join to the inventory row, not to the warehouse.",
      "SUM over no rows is NULL, not 0 — turn it into 0.",
    ],
    editorial: [
      "The answer has one row per **warehouse**, so the query starts from `Warehouse` and LEFT JOINs the inventory; a warehouse with no stock then appears once with NULLs on the inventory side. The cost must also be joined with a LEFT JOIN (or inside a subquery) — an inner join to `ProductCost` after the outer join would throw away the empty warehouse again, because its NULL `sku` matches no cost row.",
      "",
      "Grouping by warehouse, `SUM(i.qty * c.unit_cost)` is the value at cost. For the empty warehouse every product in the sum is NULL, so the sum is NULL; `COALESCE(…, 0)` reports it as 0 as the statement asks. Rounding to two places keeps the money value identical across engines.",
      "",
      "The alternatives compute the value per warehouse first — in a correlated scalar subquery or in a grouped derived table joined back with a LEFT JOIN — and default missing values to 0. All three read each inventory row once.",
    ].join("\n"),
  },

  // ──────────────────────────── MEDIUM ────────────────────────────
  {
    slug: "supplier-average-lead-time-in-days",
    title: "Supplier Average Lead Time in Days",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Dates"],
    description: [
      "A supplier's **lead time** on a purchase order is the number of days from `order_date` to `received_date`. Orders not yet received (`received_date` NULL) have no lead time and are ignored. To avoid judging a supplier on a single delivery, only suppliers with **at least 2 received orders** are ranked.",
      "",
      "Return `supplier_name`, `received_pos` (the number of received orders) and `avg_lead_days` (the average lead time, **rounded to 2 decimal places**). Order the rows by `avg_lead_days` **lowest first**, then by `supplier_name`.",
    ].join("\n"),
    tables: [
      {
        name: "Supplier",
        columns: [
          { name: "supplier_id", type: "int" },
          { name: "supplier_name", type: "varchar" },
        ],
        primaryKey: ["supplier_id"],
        note: "Supplier names are unique.",
      },
      {
        name: "PurchaseOrder",
        columns: [
          { name: "po_id", type: "int" },
          { name: "supplier_id", type: "int" },
          { name: "order_date", type: "date" },
          { name: "received_date", type: "date" },
        ],
        primaryKey: ["po_id"],
        note: "`received_date` is NULL while the goods have not arrived.",
      },
    ],
    examples: [
      {
        Supplier: [
          [1, "Sharma Traders"],
          [2, "Annapurna Foods"],
          [3, "Nandi Dairy Supplies"],
          [4, "Ganesh Packaging"],
        ],
        PurchaseOrder: [
          [11, 1, "2025-01-02", "2025-01-09"],
          [12, 1, "2025-01-20", "2025-01-25"],
          [13, 1, "2025-02-03", null],
          [14, 2, "2025-01-05", "2025-01-11"],
          [15, 2, "2025-01-28", "2025-02-03"],
          [16, 3, "2025-01-10", "2025-01-11"],
          [17, 3, "2025-01-14", "2025-01-16"],
          [18, 3, "2025-01-30", "2025-01-31"],
          [19, 4, "2025-01-08", "2025-01-12"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 6);
      const sups = sample(rng, SUPPLIER_NAMES, n).map((name, i) => [i + 1, name]);
      const pos: Cell[][] = [];
      let id = 11;
      for (const [sid] of sups) {
        const k = ri(rng, 0, 6);
        const typical = ri(rng, 2, 9);
        for (let j = 0; j < k; j++) {
          const od = dateBetween(rng, "2024-10-01", "2025-03-31");
          const rd = chance(rng, 0.2) ? null : addDays(od, Math.max(0, typical + ri(rng, -2, 3)));
          pos.push([id++, sid!, od, rd]);
        }
      }
      return { Supplier: sups, PurchaseOrder: shuffle(rng, pos) };
    },
    solution: [
      "SELECT s.supplier_name,",
      "       COUNT(*) AS received_pos,",
      "       ROUND(AVG(DATEDIFF(po.received_date, po.order_date)), 2) AS avg_lead_days",
      "FROM PurchaseOrder po",
      "JOIN Supplier s ON s.supplier_id = po.supplier_id",
      "WHERE po.received_date IS NOT NULL",
      "GROUP BY s.supplier_id, s.supplier_name",
      "HAVING COUNT(*) >= 2",
      "ORDER BY avg_lead_days, s.supplier_name",
    ].join("\n"),
    alternatives: [
      "SELECT s.supplier_name, COUNT(po.received_date) AS received_pos, ROUND(SUM(DATEDIFF(po.received_date, po.order_date)) / COUNT(po.received_date), 2) AS avg_lead_days FROM Supplier s JOIN PurchaseOrder po ON po.supplier_id = s.supplier_id GROUP BY s.supplier_id, s.supplier_name HAVING COUNT(po.received_date) >= 2 ORDER BY avg_lead_days, s.supplier_name",
      "SELECT s.supplier_name, t.received_pos, t.avg_lead_days FROM Supplier s JOIN (SELECT supplier_id, COUNT(*) AS received_pos, ROUND(AVG(TIMESTAMPDIFF(DAY, order_date, received_date)), 2) AS avg_lead_days FROM PurchaseOrder WHERE received_date IS NOT NULL GROUP BY supplier_id) t ON t.supplier_id = s.supplier_id WHERE t.received_pos >= 2 ORDER BY t.avg_lead_days, s.supplier_name",
    ],
    ordered: true,
    hints: [
      "`DATEDIFF(received_date, order_date)` is the lead time of one order.",
      "Drop open orders before counting, or `COUNT(*)` will include them.",
      "The \"at least 2\" rule is about a group — use HAVING.",
    ],
    editorial: [
      "Each received order contributes one number, `DATEDIFF(received_date, order_date)`; the supplier's figure is the average of those numbers. The query filters out open orders in `WHERE`, joins the supplier for its name, groups by supplier, and keeps only groups with at least two rows in `HAVING`.",
      "",
      "The NULL handling deserves care. `AVG` already skips NULL lead times, so an open order would not distort the average — but `COUNT(*)` counts rows, not lead times, so without the `WHERE` filter a supplier with one received and one open order would wrongly pass the two-order rule. The first alternative shows the other fix: `COUNT(received_date)` counts only non-NULL values, and `SUM / COUNT` reproduces the average.",
      "",
      "The average is rounded to two places because MySQL's `AVG` returns a four-decimal value while other engines return a float. Grouping by `supplier_id` as well as the name keeps two suppliers apart even if names were ever reused. The sort breaks equal averages by name. Cost: one pass over the orders and a hash join to suppliers.",
    ].join("\n"),
  },

  {
    slug: "purchase-order-lines-received-short",
    title: "Purchase Order Lines Received Short",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Subqueries"],
    description: [
      "Suppliers often deliver a purchase order line in several goods receipts (GRNs). A line is **short** when the total quantity received across all its GRNs is **less than** the quantity ordered; a line with no GRN at all is short by its whole quantity. Over-deliveries are not short.",
      "",
      "Return `po_id`, `line_no`, `sku`, `qty_ordered`, `qty_received` (0 when nothing arrived) and `shortfall` (`qty_ordered` minus `qty_received`) for every short line. Order the rows by `po_id`, then by `line_no`.",
    ].join("\n"),
    tables: [
      {
        name: "PoLine",
        columns: [
          { name: "po_id", type: "int" },
          { name: "line_no", type: "int" },
          { name: "sku", type: "varchar" },
          { name: "qty_ordered", type: "int" },
        ],
        primaryKey: ["po_id", "line_no"],
        note: "One row per line of a purchase order.",
      },
      {
        name: "GoodsReceipt",
        columns: [
          { name: "grn_id", type: "int" },
          { name: "po_id", type: "int" },
          { name: "line_no", type: "int" },
          { name: "qty_received", type: "int" },
          { name: "received_on", type: "date" },
        ],
        primaryKey: ["grn_id"],
        note: "One row per delivery against a PO line; (`po_id`, `line_no`) always exists in `PoLine`.",
      },
    ],
    examples: [
      {
        PoLine: [
          [501, 1, "GRO-1001", 100],
          [501, 2, "GRO-1002", 60],
          [502, 1, "DAI-2001", 40],
          [502, 2, "SNK-6001", 200],
          [503, 1, "HOM-5002", 30],
        ],
        GoodsReceipt: [
          [1, 501, 1, 60, "2025-02-03"],
          [2, 501, 1, 40, "2025-02-06"],
          [3, 501, 2, 45, "2025-02-03"],
          [4, 502, 1, 44, "2025-02-05"],
          [5, 502, 2, 120, "2025-02-05"],
          [6, 502, 2, 50, "2025-02-09"],
        ],
      },
    ],
    gen: (rng) => {
      const lines: Cell[][] = [];
      const grns: Cell[][] = [];
      let g = 1;
      const pos = ri(rng, 0, 5);
      for (let p = 0; p < pos; p++) {
        const po = 501 + p;
        const k = ri(rng, 1, 3);
        const skus = sample(rng, SKU_CODES, k);
        for (let l = 1; l <= k; l++) {
          const ordered = ri(rng, 2, 20) * 10;
          lines.push([po, l, skus[l - 1]!, ordered]);
          const mode = pick(rng, ["none", "full", "short", "over", "split"]);
          if (mode === "none") continue;
          const total = mode === "full" ? ordered : mode === "short" ? ordered - ri(rng, 1, ordered / 2) : mode === "over" ? ordered + ri(rng, 1, 10) : ordered - ri(rng, 0, 1) * 10;
          const first = ri(rng, 0, total);
          const day = dateBetween(rng, "2025-02-01", "2025-02-20");
          if (first > 0) grns.push([g++, po, l, first, day]);
          if (total - first > 0) grns.push([g++, po, l, total - first, addDays(day, ri(rng, 1, 5))]);
        }
      }
      return { PoLine: lines, GoodsReceipt: grns };
    },
    solution: [
      "SELECT l.po_id, l.line_no, l.sku, l.qty_ordered,",
      "       COALESCE(r.received, 0) AS qty_received,",
      "       l.qty_ordered - COALESCE(r.received, 0) AS shortfall",
      "FROM PoLine l",
      "LEFT JOIN (",
      "  SELECT po_id, line_no, SUM(qty_received) AS received",
      "  FROM GoodsReceipt",
      "  GROUP BY po_id, line_no",
      ") r ON r.po_id = l.po_id AND r.line_no = l.line_no",
      "WHERE COALESCE(r.received, 0) < l.qty_ordered",
      "ORDER BY l.po_id, l.line_no",
    ].join("\n"),
    alternatives: [
      [
        "SELECT l.po_id, l.line_no, l.sku, l.qty_ordered,",
        "       COALESCE(SUM(g.qty_received), 0) AS qty_received,",
        "       l.qty_ordered - COALESCE(SUM(g.qty_received), 0) AS shortfall",
        "FROM PoLine l",
        "LEFT JOIN GoodsReceipt g ON g.po_id = l.po_id AND g.line_no = l.line_no",
        "GROUP BY l.po_id, l.line_no, l.sku, l.qty_ordered",
        "HAVING COALESCE(SUM(g.qty_received), 0) < l.qty_ordered",
        "ORDER BY l.po_id, l.line_no",
      ].join("\n"),
      [
        "SELECT po_id, line_no, sku, qty_ordered, qty_received, qty_ordered - qty_received AS shortfall FROM (",
        "  SELECT l.po_id, l.line_no, l.sku, l.qty_ordered,",
        "         (SELECT IFNULL(SUM(g.qty_received), 0) FROM GoodsReceipt g WHERE g.po_id = l.po_id AND g.line_no = l.line_no) AS qty_received",
        "  FROM PoLine l) t",
        "WHERE qty_received < qty_ordered",
        "ORDER BY po_id, line_no",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Add up the receipts of each line before comparing with the ordered quantity.",
      "A line with no receipt must still appear — which join keeps it?",
      "The line's key is two columns; join on both.",
    ],
    editorial: [
      "The comparison is between one ordered quantity and the **sum** of any number of receipts, so the receipts are aggregated first: a derived table groups `GoodsReceipt` by `(po_id, line_no)` and sums the quantities. That table is LEFT JOINed to `PoLine` on both key columns, so every line stays — a line nothing was delivered against gets a NULL sum, which `COALESCE` turns into 0.",
      "",
      "With one row per line, the filter `received < qty_ordered` keeps the short lines and drops exact and over-deliveries. The shortfall is a subtraction on the same row.",
      "",
      "Joining the raw receipts and grouping afterwards (the first alternative) gives the same numbers because each line's group then holds exactly its own receipts; the `HAVING` clause does the filtering. A correlated scalar subquery per line works too. The common bug is joining on `po_id` alone, which multiplies every line by every receipt of the whole order and inflates the sums. All forms are linear in the two tables with an index on `GoodsReceipt(po_id, line_no)`.",
    ].join("\n"),
  },

  {
    slug: "store-stockout-rate-from-daily-closing-stock",
    title: "Store Stock-Out Rate From Daily Closing Stock",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Aggregation"],
    description: [
      "Each store records the closing stock of every tracked SKU at the end of the day. A **stock-out day** is a SKU-day whose `closing_qty` is 0. When the handheld scanner failed, `closing_qty` was saved as NULL; those SKU-days are left out of both the numerator and the denominator.",
      "",
      "For every store with at least one recorded (non-NULL) closing, return `store_id`, `sku_days` (recorded SKU-days), `stockout_days` and `stockout_pct` = 100 × stockout_days / sku_days, **rounded to 2 decimal places**. Order the rows by `stockout_pct` **highest first**, then by `store_id`.",
    ].join("\n"),
    tables: [
      {
        name: "DailyClosing",
        columns: [
          { name: "store_id", type: "int" },
          { name: "sku", type: "varchar" },
          { name: "stock_date", type: "date" },
          { name: "closing_qty", type: "int" },
        ],
        primaryKey: ["store_id", "sku", "stock_date"],
        note: "One row per store, SKU and day; `closing_qty` is NULL where the count failed.",
      },
    ],
    examples: [
      {
        DailyClosing: [
          [1, "GRO-1001", "2025-05-01", 14],
          [1, "GRO-1001", "2025-05-02", 0],
          [1, "DAI-2002", "2025-05-01", 0],
          [1, "DAI-2002", "2025-05-02", null],
          [2, "GRO-1001", "2025-05-01", 8],
          [2, "GRO-1001", "2025-05-02", 3],
          [2, "SNK-6001", "2025-05-01", 0],
          [3, "BEV-3001", "2025-05-01", null],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const s of seq(1, ri(rng, 1, 4))) {
        const zeroRate = pick(rng, [0, 0.2, 0.4, 0.7]);
        for (const sku of sample(rng, SKU_CODES, ri(rng, 1, 3))) {
          const days = ri(rng, 1, 4);
          for (let d = 0; d < days; d++) {
            const q = chance(rng, 0.12) ? null : chance(rng, zeroRate) ? 0 : ri(rng, 1, 40);
            rows.push([s, sku, addDays("2025-05-01", d), q]);
          }
        }
      }
      return { DailyClosing: shuffle(rng, rows) };
    },
    solution: [
      "SELECT store_id,",
      "       COUNT(closing_qty) AS sku_days,",
      "       SUM(CASE WHEN closing_qty = 0 THEN 1 ELSE 0 END) AS stockout_days,",
      "       ROUND(100 * SUM(CASE WHEN closing_qty = 0 THEN 1 ELSE 0 END) / COUNT(closing_qty), 2) AS stockout_pct",
      "FROM DailyClosing",
      "GROUP BY store_id",
      "HAVING COUNT(closing_qty) > 0",
      "ORDER BY stockout_pct DESC, store_id",
    ].join("\n"),
    alternatives: [
      "SELECT store_id, COUNT(*) AS sku_days, SUM(IF(closing_qty = 0, 1, 0)) AS stockout_days, ROUND(100 * SUM(IF(closing_qty = 0, 1, 0)) / COUNT(*), 2) AS stockout_pct FROM DailyClosing WHERE closing_qty IS NOT NULL GROUP BY store_id ORDER BY stockout_pct DESC, store_id",
      "SELECT store_id, sku_days, stockout_days, ROUND(100 * stockout_days / NULLIF(sku_days, 0), 2) AS stockout_pct FROM (SELECT store_id, COUNT(closing_qty) AS sku_days, COUNT(CASE WHEN closing_qty = 0 THEN 1 END) AS stockout_days FROM DailyClosing GROUP BY store_id) t WHERE sku_days > 0 ORDER BY stockout_pct DESC, store_id",
    ],
    ordered: true,
    hints: [
      "`COUNT(column)` skips NULLs, while `COUNT(*)` does not.",
      "Count stock-out days with a CASE inside SUM (or COUNT).",
      "A store whose every reading is NULL would divide by zero — leave it out.",
    ],
    editorial: [
      "This is a ratio of two counts over the same group, computed with **conditional aggregation**. `SUM(CASE WHEN closing_qty = 0 THEN 1 ELSE 0 END)` counts the stock-out days; `COUNT(closing_qty)` counts the recorded days, skipping the scanner failures by itself because `COUNT` of a column ignores NULLs. A NULL closing is also never `= 0`, so it does not enter the numerator either.",
      "",
      "A store whose rows are all NULL has a denominator of 0; the statement leaves it out, and `HAVING COUNT(closing_qty) > 0` does that before the division could fail. Filtering NULLs in `WHERE` first, as the first alternative does, removes such a store automatically because it then has no rows left to group.",
      "",
      "Multiplying by 100 before dividing and rounding to two places keeps MySQL's four-decimal division and other engines' floats in agreement. `NULLIF(sku_days, 0)` is the general guard against division by zero when you cannot filter. One scan of the table does it all.",
    ].join("\n"),
  },

  {
    slug: "top-selling-sku-in-each-store-with-ties",
    title: "Top-Selling SKU in Each Store, Ties Included",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "Category managers want each store's best seller for the festival week: the SKU with the **most units sold** across all of that store's sale lines. When two or more SKUs tie for the most units in a store, **all of them** are returned.",
      "",
      "Return `store_id`, `sku` and `units_sold`. Order the rows by `store_id`, then by `sku`.",
    ].join("\n"),
    tables: [
      {
        name: "SaleLine",
        columns: [
          { name: "line_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "sku", type: "varchar" },
          { name: "qty", type: "int" },
          { name: "sold_on", type: "date" },
        ],
        primaryKey: ["line_id"],
        note: "One row per line of a POS bill; `qty` is the units of that SKU on the bill.",
      },
    ],
    examples: [
      {
        SaleLine: [
          [1, 1, "SNK-6001", 6, "2024-10-28"],
          [2, 1, "GRO-1001", 2, "2024-10-28"],
          [3, 1, "SNK-6001", 3, "2024-10-29"],
          [4, 1, "DAI-2002", 9, "2024-10-30"],
          [5, 2, "BEV-3001", 4, "2024-10-29"],
          [6, 2, "HOM-5001", 5, "2024-10-30"],
          [7, 2, "BEV-3001", 1, "2024-10-31"],
          [8, 3, "PER-4001", 2, "2024-10-31"],
        ],
      },
    ],
    gen: (rng) => {
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 24);
      const stores = ri(rng, 1, 4);
      const skus = sample(rng, SKU_CODES, ri(rng, 2, 5));
      const rows = seq(1, m).map((id) => [id, ri(rng, 1, stores), pick(rng, skus), ri(rng, 1, 4), dateBetween(rng, "2024-10-28", "2024-11-03")]);
      return { SaleLine: rows };
    },
    solution: [
      "WITH totals AS (",
      "  SELECT store_id, sku, SUM(qty) AS units_sold,",
      "         RANK() OVER (PARTITION BY store_id ORDER BY SUM(qty) DESC) AS rnk",
      "  FROM SaleLine",
      "  GROUP BY store_id, sku",
      ")",
      "SELECT store_id, sku, units_sold",
      "FROM totals",
      "WHERE rnk = 1",
      "ORDER BY store_id, sku",
    ].join("\n"),
    alternatives: [
      [
        "SELECT store_id, sku, SUM(qty) AS units_sold",
        "FROM SaleLine s",
        "GROUP BY store_id, sku",
        "HAVING SUM(qty) = (SELECT MAX(t.u) FROM (SELECT store_id, SUM(qty) AS u FROM SaleLine GROUP BY store_id, sku) t WHERE t.store_id = s.store_id)",
        "ORDER BY store_id, sku",
      ].join("\n"),
      [
        "WITH totals AS (SELECT store_id, sku, SUM(qty) AS units_sold FROM SaleLine GROUP BY store_id, sku)",
        "SELECT t.store_id, t.sku, t.units_sold FROM totals t",
        "JOIN (SELECT store_id, MAX(units_sold) AS best FROM totals GROUP BY store_id) b ON b.store_id = t.store_id AND b.best = t.units_sold",
        "ORDER BY t.store_id, t.sku",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First total the units per (store, SKU); a SKU appears on many lines.",
      "Then you need the best total within each store — a ranking partitioned by store.",
      "`ROW_NUMBER()` would keep only one SKU of a tie; which ranking function keeps all of them?",
    ],
    editorial: [
      "Two steps: aggregate, then pick the maximum per group. `GROUP BY store_id, sku` turns sale lines into one total per product per store. A window function then ranks those totals inside each store: `RANK() OVER (PARTITION BY store_id ORDER BY SUM(qty) DESC)`. Window functions run after grouping, so they can order by the aggregate directly. Keeping `rnk = 1` returns every SKU tied for the top, because tied rows share rank 1.",
      "",
      "`ROW_NUMBER()` is the classic mistake here: it gives tied rows different numbers in an order the engine chooses, so one of the tied SKUs would vanish — and which one could change from run to run. `DENSE_RANK()` would work as well as `RANK()` since only rank 1 is kept.",
      "",
      "Without windows, compute the per-store maximum of the totals and join it back (or compare in `HAVING` with a correlated subquery). These read the sales twice but give the same rows. The final order by store and SKU makes ties appear in a fixed order.",
    ].join("\n"),
  },

  {
    slug: "cycle-count-shrinkage-value-by-month",
    title: "Cycle Count Shrinkage Value by Store and Month",
    difficulty: "MEDIUM",
    topics: ["Dates", "Conditional Logic", "Aggregation"],
    description: [
      "During a cycle count a store's staff count a shelf and compare it with the system quantity. When fewer units are found than the system expects, the gap is **shrinkage** (theft, damage, admin error) and is valued at `unit_cost`. Counts that find **more** units than the system, or exactly the same, are not shrinkage and add nothing.",
      "",
      "For every store and calendar month with at least one short count, return `store_id`, `count_month` (as `YYYY-MM`), `short_counts` (the number of counts that found fewer units) and `shrinkage_value` (the total of `(system_qty - counted_qty) × unit_cost` over those counts, **rounded to 2 decimal places**). Order the rows by `store_id`, then by `count_month`.",
    ].join("\n"),
    tables: [
      {
        name: "CycleCount",
        columns: [
          { name: "count_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "sku", type: "varchar" },
          { name: "count_date", type: "date" },
          { name: "system_qty", type: "int" },
          { name: "counted_qty", type: "int" },
          { name: "unit_cost", type: "decimal" },
        ],
        primaryKey: ["count_id"],
        note: "One row per shelf counted; `unit_cost` is the landed cost per unit in rupees.",
      },
    ],
    examples: [
      {
        CycleCount: [
          [1, 1, "GRO-1001", "2025-01-08", 40, 37, 512.5],
          [2, 1, "SNK-6001", "2025-01-22", 120, 120, 21.4],
          [3, 1, "PER-4001", "2025-01-29", 30, 32, 88],
          [4, 1, "DAI-2002", "2025-02-03", 25, 21, 68.25],
          [5, 2, "HOM-5001", "2025-01-15", 18, 16, 72],
          [6, 2, "BEV-3002", "2025-01-31", 12, 9, 240],
          [7, 2, "GRO-1003", "2025-02-27", 50, 55, 350],
        ],
      },
    ],
    gen: (rng) => {
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 18);
      const stores = ri(rng, 1, 3);
      const rows = seq(1, m).map((id) => {
        const [sku, , mrp] = pick(rng, SKUS);
        const sys = ri(rng, 5, 120);
        const diff = pick(rng, [-3, -2, -1, 0, 0, 1, 2, 4, 6]);
        return [id, ri(rng, 1, stores), sku, dateBetween(rng, "2024-12-15", "2025-03-10"), sys, Math.max(0, sys - diff), Math.round(mrp * 0.7 * 4) / 4];
      });
      return { CycleCount: rows };
    },
    solution: [
      "SELECT store_id,",
      "       DATE_FORMAT(count_date, '%Y-%m') AS count_month,",
      "       COUNT(*) AS short_counts,",
      "       ROUND(SUM((system_qty - counted_qty) * unit_cost), 2) AS shrinkage_value",
      "FROM CycleCount",
      "WHERE counted_qty < system_qty",
      "GROUP BY store_id, DATE_FORMAT(count_date, '%Y-%m')",
      "ORDER BY store_id, count_month",
    ].join("\n"),
    alternatives: [
      [
        "SELECT store_id, count_month, SUM(is_short) AS short_counts, ROUND(SUM(loss), 2) AS shrinkage_value FROM (",
        "  SELECT store_id, LEFT(count_date, 7) AS count_month,",
        "         CASE WHEN counted_qty < system_qty THEN 1 ELSE 0 END AS is_short,",
        "         CASE WHEN counted_qty < system_qty THEN (system_qty - counted_qty) * unit_cost ELSE 0 END AS loss",
        "  FROM CycleCount) t",
        "GROUP BY store_id, count_month",
        "HAVING SUM(is_short) > 0",
        "ORDER BY store_id, count_month",
      ].join("\n"),
      "SELECT store_id, count_month, COUNT(*) AS short_counts, ROUND(SUM(gap * unit_cost), 2) AS shrinkage_value FROM (SELECT store_id, CONCAT(YEAR(count_date), '-', LPAD(MONTH(count_date), 2, '0')) AS count_month, system_qty - counted_qty AS gap, unit_cost FROM CycleCount) c WHERE gap > 0 GROUP BY store_id, count_month ORDER BY store_id, count_month",
    ],
    ordered: true,
    hints: [
      "Overs must not cancel out shortages — filter or zero them before summing.",
      "`DATE_FORMAT(d, '%Y-%m')` gives the month bucket as text that also sorts correctly.",
      "Group by the store and the month bucket.",
    ],
    editorial: [
      "Two decisions shape the query. First, only short counts are shrinkage: if overs were included, a shelf with three extra units would cancel three missing units elsewhere and hide a real loss. Filtering `counted_qty < system_qty` in `WHERE` keeps only the shortages (equal counts drop out because the comparison is strict).",
      "",
      "Second, the month bucket. `DATE_FORMAT(count_date, '%Y-%m')` turns every date into its month label, and grouping by store and that label gives one row per store per month; a month with no shortage has no rows left after the filter and is therefore absent, as the statement asks. The label sorts chronologically because the year comes first and the month is zero-padded.",
      "",
      "The value is `(system_qty - counted_qty) × unit_cost` summed and rounded to two places. The alternatives zero out non-short rows with `CASE` and drop shortage-free months in `HAVING`, or build the label from `YEAR` and `MONTH` with `LPAD`. All are one pass over the counts.",
    ].join("\n"),
  },

  {
    slug: "store-revenue-against-previous-calendar-month",
    title: "Store Revenue Against the Previous Calendar Month",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates"],
    description: [
      "The regional manager reviews each store's month against **the calendar month just before it**. A store that had no sales in that previous month (a renovation shutdown, say) has nothing to compare with — its previous figure is NULL, even if it sold in an earlier month.",
      "",
      "For every store and month with sales, return `store_id`, `sales_month` (`YYYY-MM`), `revenue`, `prev_revenue` (the store's revenue in the previous calendar month, or NULL) and `change_pct` = 100 × (revenue − prev_revenue) / prev_revenue **rounded to 2 decimal places** (NULL when `prev_revenue` is NULL). Order the rows by `store_id`, then by `sales_month`.",
    ].join("\n"),
    tables: [
      {
        name: "StoreSale",
        columns: [
          { name: "sale_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "sale_date", type: "date" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["sale_id"],
        note: "One row per day's banked takings of a store; `amount` in rupees, always positive.",
      },
    ],
    examples: [
      {
        StoreSale: [
          [1, 1, "2024-11-04", 182400],
          [2, 1, "2024-11-21", 96300],
          [3, 1, "2024-12-09", 301250],
          [4, 1, "2025-01-15", 250875],
          [5, 2, "2024-11-11", 120000],
          [6, 2, "2025-01-06", 141500],
          [7, 2, "2025-02-02", 99050],
        ],
      },
    ],
    gen: (rng) => {
      const months = ["2024-10", "2024-11", "2024-12", "2025-01", "2025-02", "2025-03"];
      const rows: Cell[][] = [];
      let id = 1;
      for (const s of seq(1, ri(rng, 1, 3))) {
        for (const m of months) {
          if (chance(rng, 0.35)) continue;
          for (let k = ri(rng, 1, 2); k > 0; k--) rows.push([id++, s, `${m}-${String(ri(rng, 1, 28)).padStart(2, "0")}`, ri(rng, 40000, 320000)]);
        }
      }
      return { StoreSale: shuffle(rng, rows) };
    },
    solution: [
      "WITH monthly AS (",
      "  SELECT store_id,",
      "         DATE_FORMAT(sale_date, '%Y-%m') AS sales_month,",
      "         MIN(YEAR(sale_date) * 12 + MONTH(sale_date)) AS month_no,",
      "         SUM(amount) AS revenue",
      "  FROM StoreSale",
      "  GROUP BY store_id, DATE_FORMAT(sale_date, '%Y-%m')",
      ")",
      "SELECT m.store_id, m.sales_month, m.revenue,",
      "       p.revenue AS prev_revenue,",
      "       ROUND(100 * (m.revenue - p.revenue) / p.revenue, 2) AS change_pct",
      "FROM monthly m",
      "LEFT JOIN monthly p ON p.store_id = m.store_id AND p.month_no = m.month_no - 1",
      "ORDER BY m.store_id, m.sales_month",
    ].join("\n"),
    alternatives: [
      [
        "WITH monthly AS (",
        "  SELECT store_id, DATE_FORMAT(sale_date, '%Y-%m') AS sales_month, MIN(YEAR(sale_date) * 12 + MONTH(sale_date)) AS month_no, SUM(amount) AS revenue",
        "  FROM StoreSale GROUP BY store_id, DATE_FORMAT(sale_date, '%Y-%m')",
        "), lagged AS (",
        "  SELECT store_id, sales_month, revenue,",
        "         LAG(month_no) OVER (PARTITION BY store_id ORDER BY month_no) AS prev_no,",
        "         LAG(revenue) OVER (PARTITION BY store_id ORDER BY month_no) AS prev_rev,",
        "         month_no",
        "  FROM monthly",
        ")",
        "SELECT store_id, sales_month, revenue,",
        "       CASE WHEN prev_no = month_no - 1 THEN prev_rev END AS prev_revenue,",
        "       CASE WHEN prev_no = month_no - 1 THEN ROUND(100 * (revenue - prev_rev) / prev_rev, 2) END AS change_pct",
        "FROM lagged",
        "ORDER BY store_id, sales_month",
      ].join("\n"),
      [
        "SELECT m.store_id, m.sales_month, m.revenue,",
        "       (SELECT SUM(x.amount) FROM StoreSale x WHERE x.store_id = m.store_id AND DATE_FORMAT(x.sale_date, '%Y-%m') = DATE_FORMAT(DATE_SUB(m.first_day, INTERVAL 1 MONTH), '%Y-%m')) AS prev_revenue,",
        "       ROUND(100 * (m.revenue - (SELECT SUM(x.amount) FROM StoreSale x WHERE x.store_id = m.store_id AND DATE_FORMAT(x.sale_date, '%Y-%m') = DATE_FORMAT(DATE_SUB(m.first_day, INTERVAL 1 MONTH), '%Y-%m')))",
        "             / (SELECT SUM(x.amount) FROM StoreSale x WHERE x.store_id = m.store_id AND DATE_FORMAT(x.sale_date, '%Y-%m') = DATE_FORMAT(DATE_SUB(m.first_day, INTERVAL 1 MONTH), '%Y-%m')), 2) AS change_pct",
        "FROM (SELECT store_id, DATE_FORMAT(sale_date, '%Y-%m') AS sales_month, CONCAT(DATE_FORMAT(sale_date, '%Y-%m'), '-01') AS first_day, SUM(amount) AS revenue",
        "      FROM StoreSale GROUP BY store_id, DATE_FORMAT(sale_date, '%Y-%m'), CONCAT(DATE_FORMAT(sale_date, '%Y-%m'), '-01')) m",
        "ORDER BY m.store_id, m.sales_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Total each store's sales per month first.",
      "`LAG()` gives the previous row — but the previous row is not always the previous calendar month.",
      "A month number such as `YEAR * 12 + MONTH` makes \"the month before\" a subtraction of 1.",
    ],
    editorial: [
      "First collapse the daily takings into one row per store per month. The label `DATE_FORMAT(sale_date, '%Y-%m')` is what is shown; alongside it the query keeps a **month number** `YEAR * 12 + MONTH`, which turns calendar arithmetic into integer arithmetic — the previous calendar month is simply `month_no - 1`, across year boundaries too (December 2024 is one less than January 2025).",
      "",
      "Joining the monthly table to itself on `p.month_no = m.month_no - 1` (a LEFT JOIN, so months with no predecessor stay) puts the previous month's revenue next to each month. When that month had no sales the join finds nothing and `prev_revenue` is NULL; the percentage is then NULL automatically, because arithmetic with NULL is NULL.",
      "",
      "`LAG()` is the tempting shortcut, but it returns the previous *row*, so after a gap it would compare January with November. The window alternative uses `LAG` and accepts its value only when the lagged month number is exactly one less. Rounding to two places keeps the ratio the same in every engine. Each version groups the sales once.",
    ].join("\n"),
  },

  {
    slug: "slow-moving-skus-still-holding-stock",
    title: "Slow-Moving SKUs Still Holding Stock",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Dates", "Joins"],
    description: [
      "Before the end-of-season markdown, merchandisers want the products that are tying up shelf space: SKUs with stock on hand (`on_hand` **greater than 0**) that have **not sold since 30 April 2025**, meaning no sale on or after `2025-05-01`. A SKU that has never sold at all is slow-moving too.",
      "",
      "Return `sku`, `product_name`, `on_hand` and `last_sold_on` (the date of its most recent sale ever, NULL if it never sold). Order the rows with never-sold SKUs first, then by `last_sold_on` oldest first, then by `sku`.",
    ].join("\n"),
    tables: [
      {
        name: "Product",
        columns: [
          { name: "sku", type: "varchar" },
          { name: "product_name", type: "varchar" },
        ],
        primaryKey: ["sku"],
        note: "One row per product in the range.",
      },
      {
        name: "StockOnHand",
        columns: [
          { name: "sku", type: "varchar" },
          { name: "on_hand", type: "int" },
        ],
        primaryKey: ["sku"],
        note: "Current chain-wide stock of every product; every product has exactly one row.",
      },
      {
        name: "Sale",
        columns: [
          { name: "sale_id", type: "int" },
          { name: "sku", type: "varchar" },
          { name: "sold_on", type: "date" },
          { name: "qty", type: "int" },
        ],
        primaryKey: ["sale_id"],
        note: "One row per sale line; `sku` is always in `Product`.",
      },
    ],
    examples: [
      {
        Product: [
          ["GRO-1003", "Atta 10kg"],
          ["BEV-3002", "Filter Coffee 500g"],
          ["PER-4002", "Coconut Hair Oil 500ml"],
          ["HOM-5002", "Floor Cleaner 1L"],
          ["SNK-6003", "Khakhra Methi 200g"],
        ],
        StockOnHand: [
          ["GRO-1003", 42],
          ["BEV-3002", 15],
          ["PER-4002", 0],
          ["HOM-5002", 60],
          ["SNK-6003", 8],
        ],
        Sale: [
          [1, "GRO-1003", "2025-04-30", 3],
          [2, "GRO-1003", "2025-03-11", 2],
          [3, "BEV-3002", "2025-05-01", 1],
          [4, "PER-4002", "2025-01-20", 4],
          [5, "SNK-6003", "2025-02-14", 6],
        ],
      },
    ],
    gen: (rng) => {
      const items = sample(rng, SKUS, ri(rng, 1, 9));
      const prod = items.map(([s, n]) => [s, n]);
      const soh = items.map(([s]) => [s, chance(rng, 0.2) ? 0 : ri(rng, 1, 80)]);
      const sales: Cell[][] = [];
      let id = 1;
      for (const [s] of items) {
        const k = ri(rng, 0, 3);
        for (let j = 0; j < k; j++) {
          const d = chance(rng, 0.2) ? pick(rng, ["2025-04-30", "2025-05-01"]) : dateBetween(rng, "2025-01-01", "2025-06-30");
          sales.push([id++, s, d, ri(rng, 1, 6)]);
        }
      }
      return { Product: prod, StockOnHand: soh, Sale: shuffle(rng, sales) };
    },
    solution: [
      "SELECT p.sku, p.product_name, h.on_hand,",
      "       (SELECT MAX(s.sold_on) FROM Sale s WHERE s.sku = p.sku) AS last_sold_on",
      "FROM Product p",
      "JOIN StockOnHand h ON h.sku = p.sku",
      "WHERE h.on_hand > 0",
      "  AND NOT EXISTS (SELECT 1 FROM Sale s WHERE s.sku = p.sku AND s.sold_on >= '2025-05-01')",
      "ORDER BY CASE WHEN last_sold_on IS NULL THEN 0 ELSE 1 END, last_sold_on, p.sku",
    ].join("\n"),
    alternatives: [
      [
        "SELECT p.sku, p.product_name, h.on_hand, l.last_sold_on",
        "FROM Product p",
        "JOIN StockOnHand h ON h.sku = p.sku",
        "LEFT JOIN (SELECT sku, MAX(sold_on) AS last_sold_on FROM Sale GROUP BY sku) l ON l.sku = p.sku",
        "WHERE h.on_hand > 0 AND (l.last_sold_on IS NULL OR l.last_sold_on < '2025-05-01')",
        "ORDER BY l.last_sold_on IS NOT NULL, l.last_sold_on, p.sku",
      ].join("\n"),
      [
        "SELECT p.sku, p.product_name, h.on_hand, MAX(s.sold_on) AS last_sold_on",
        "FROM Product p JOIN StockOnHand h ON h.sku = p.sku LEFT JOIN Sale s ON s.sku = p.sku",
        "WHERE h.on_hand > 0",
        "GROUP BY p.sku, p.product_name, h.on_hand",
        "HAVING MAX(s.sold_on) IS NULL OR MAX(s.sold_on) < '2025-05-01'",
        "ORDER BY COALESCE(MAX(s.sold_on), '0000-01-01'), p.sku",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "\"Not sold since\" is a NOT EXISTS over recent sales, or a test on the latest sale date.",
      "A SKU with no sales has no latest sale — make sure it is kept, not dropped.",
      "Sorting NULLs first is easiest with an explicit sort key such as a CASE.",
    ],
    editorial: [
      "A SKU is slow-moving when two facts hold: it has stock, and **no** sale falls on or after the cut-off. The second fact is an absence, so `NOT EXISTS (… s.sold_on >= '2025-05-01')` states it directly; it is also automatically true for a SKU that never sold. The last sale date is a separate, informational column — a correlated `MAX(sold_on)` that is NULL for never-sold SKUs.",
      "",
      "The equivalent formulation computes each SKU's latest sale once (a grouped derived table) and keeps SKUs whose latest sale is NULL **or** before the cut-off. Forgetting the `IS NULL` branch is the classic bug: `NULL < '2025-05-01'` is unknown, so never-sold products — the slowest movers of all — would vanish. The third version groups a LEFT JOIN and tests the same condition in `HAVING`.",
      "",
      "Zero-stock SKUs are dropped because there is nothing to mark down. For the order, MySQL and most engines sort NULL first in ascending order, but spelling it out with a CASE (or `IS NOT NULL` as a sort key) makes the intent explicit. Each approach scans the sales once per SKU at most; an index on `Sale(sku, sold_on)` makes the probes cheap.",
    ].join("\n"),
  },

  {
    slug: "duplicate-vendors-after-name-cleanup",
    title: "Duplicate Vendors After Cleaning Up Their Names",
    difficulty: "MEDIUM",
    topics: ["Strings", "Aggregation"],
    description: [
      "The vendor master was keyed in by different branches, so one distributor can appear several times: with stray spaces around the name, or with a ` Pvt Ltd` or ` Ltd` suffix that another branch left out. The **clean name** of a vendor is its name with every ` Pvt Ltd` and then every ` Ltd` removed, and surrounding spaces trimmed.",
      "",
      "Return every clean name shared by **two or more** vendors, with the columns `clean_name`, `vendor_count` and `vendor_ids` (the vendor ids in ascending order, joined with commas and no spaces, e.g. `3,7,12`). Order the rows by `clean_name`.",
    ].join("\n"),
    tables: [
      {
        name: "VendorMaster",
        columns: [
          { name: "vendor_id", type: "int" },
          { name: "vendor_name", type: "varchar" },
          { name: "gstin", type: "char" },
        ],
        primaryKey: ["vendor_id"],
        note: "One row per vendor record. Names always use the same capitalisation; only spacing and the company suffix vary. `gstin` is NULL where it was never captured.",
      },
    ],
    examples: [
      {
        VendorMaster: [
          [1, "Sharma Traders Pvt Ltd", "29ABCDE1234F1Z5"],
          [2, "Annapurna Foods", "27FGHIJ5678K1Z2"],
          [3, "  Sharma Traders", null],
          [4, "Deccan Distributors Ltd", "36KLMNO9012P1Z8"],
          [5, "Sharma Traders Ltd ", null],
          [6, "Deccan Distributors", "36KLMNO9012P1Z8"],
          [7, "Gupta Agencies", "08QRSTU3456V1Z1"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const base = sample(rng, SUPPLIER_NAMES, ri(rng, 1, 5));
      const rows = seq(1, n).map((id) => {
        const name = pick(rng, base);
        const suffix = pick(rng, ["", "", " Pvt Ltd", " Ltd"]);
        const pre = chance(rng, 0.2) ? "  " : "";
        const post = chance(rng, 0.2) ? " " : "";
        return [id, `${pre}${name}${suffix}${post}`, maybeNull(rng, 0.3, `${ri(rng, 10, 36)}ABCDE${ri(rng, 1000, 9999)}F1Z${ri(rng, 1, 9)}`)];
      });
      return { VendorMaster: shuffle(rng, rows) };
    },
    solution: [
      "SELECT clean_name,",
      "       COUNT(*) AS vendor_count,",
      "       GROUP_CONCAT(vendor_id ORDER BY vendor_id SEPARATOR ',') AS vendor_ids",
      "FROM (",
      "  SELECT vendor_id, TRIM(REPLACE(REPLACE(vendor_name, ' Pvt Ltd', ''), ' Ltd', '')) AS clean_name",
      "  FROM VendorMaster",
      ") v",
      "GROUP BY clean_name",
      "HAVING COUNT(*) >= 2",
      "ORDER BY clean_name",
    ].join("\n"),
    alternatives: [
      [
        "WITH t AS (SELECT vendor_id, TRIM(vendor_name) AS nm FROM VendorMaster),",
        "c AS (",
        "  SELECT vendor_id,",
        "         CASE WHEN nm LIKE '% Pvt Ltd' THEN LEFT(nm, CHAR_LENGTH(nm) - 8)",
        "              WHEN nm LIKE '% Ltd' THEN LEFT(nm, CHAR_LENGTH(nm) - 4)",
        "              ELSE nm END AS clean_name",
        "  FROM t",
        ")",
        "SELECT clean_name, COUNT(*) AS vendor_count, GROUP_CONCAT(vendor_id ORDER BY vendor_id SEPARATOR ',') AS vendor_ids",
        "FROM c GROUP BY clean_name HAVING COUNT(*) > 1 ORDER BY clean_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Build the clean name in a derived table first, then group on it.",
      "Remove ` Pvt Ltd` before ` Ltd` — otherwise ` Pvt Ltd` leaves ` Pvt` behind.",
      "`GROUP_CONCAT(x ORDER BY x SEPARATOR ',')` controls both the order and the separator.",
    ],
    editorial: [
      "De-duplicating master data is mostly string work: define a **normal form** of the name and group on it. Here the normal form removes the company suffix and the surrounding whitespace. The order of the replacements matters — removing ` Ltd` first would turn `Sharma Traders Pvt Ltd` into `Sharma Traders Pvt` — and `TRIM` comes last so that both leading spaces and a space left before a removed suffix disappear.",
      "",
      "Once each record has its clean name, `GROUP BY clean_name HAVING COUNT(*) >= 2` keeps the names with duplicates. `GROUP_CONCAT` lists the ids that collapse together; giving it `ORDER BY vendor_id` makes the list deterministic and `SEPARATOR ','` removes the default's ambiguity. The GSTIN plays no part (it is often missing) but would be the natural next check for a reviewer.",
      "",
      "The alternative trims first and strips a suffix only at the end of the name, using `LIKE` and `LEFT` with `CHAR_LENGTH`. On names where the suffix is a true suffix both forms agree; `REPLACE` would also remove a ` Ltd` in the middle of a name, which this data never has. The cost is one pass and one grouping.",
    ].join("\n"),
  },

  {
    slug: "warehouse-transfers-still-in-transit",
    title: "Warehouse Transfers Still in Transit",
    difficulty: "MEDIUM",
    topics: ["Joins", "Dates", "Conditional Logic"],
    description: [
      "Stock moves between the chain's warehouses by truck. A transfer is **in transit** while `received_at` is NULL. The control tower checks the board at **2025-04-10 18:00:00**: a transfer that has been on the road **more than 48 full hours** is `DELAYED`, otherwise it is `ON_TIME`.",
      "",
      "For every transfer in transit, return `transfer_id`, `from_city`, `to_city`, `sku`, `hours_in_transit` (whole hours from `dispatched_at` to the check time, partial hours dropped) and `transit_status`. Order the rows by `hours_in_transit` **highest first**, then by `transfer_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Warehouse",
        columns: [
          { name: "warehouse_id", type: "int" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["warehouse_id"],
        note: "One warehouse per city.",
      },
      {
        name: "StockTransfer",
        columns: [
          { name: "transfer_id", type: "int" },
          { name: "from_wh", type: "int" },
          { name: "to_wh", type: "int" },
          { name: "sku", type: "varchar" },
          { name: "qty", type: "int" },
          { name: "dispatched_at", type: "datetime" },
          { name: "received_at", type: "datetime" },
        ],
        primaryKey: ["transfer_id"],
        note: "`from_wh` and `to_wh` are warehouse ids (never equal); every transfer was dispatched before the check time.",
      },
    ],
    examples: [
      {
        Warehouse: [
          [1, "Bengaluru"],
          [2, "Chennai"],
          [3, "Hyderabad"],
        ],
        StockTransfer: [
          [801, 1, 2, "GRO-1001", 120, "2025-04-07 09:30:00", null],
          [802, 2, 3, "SNK-6001", 400, "2025-04-08 18:00:00", null],
          [803, 3, 1, "DAI-2001", 60, "2025-04-08 17:59:00", null],
          [804, 1, 3, "HOM-5001", 90, "2025-04-06 11:00:00", "2025-04-08 10:00:00"],
          [805, 2, 1, "BEV-3001", 75, "2025-04-10 06:45:00", null],
        ],
      },
    ],
    gen: (rng) => {
      const wh = sample(rng, CITY_LIST, ri(rng, 2, 5)).map((c, i) => [i + 1, c]);
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 12);
      const rows = seq(801, m).map((id) => {
        const [a, b] = sample(rng, wh, 2);
        let disp: string;
        if (chance(rng, 0.25)) disp = pick(rng, ["2025-04-08 18:00:00", "2025-04-08 17:59:30", "2025-04-08 18:00:01"]);
        else disp = atTime(rng, dateBetween(rng, "2025-04-05", "2025-04-09"));
        const received = chance(rng, 0.3) ? `${dateBetween(rng, "2025-04-09", "2025-04-10")} 08:00:00` : null;
        return [id, a![0]!, b![0]!, pick(rng, SKU_CODES), ri(rng, 1, 40) * 10, disp, received];
      });
      return { Warehouse: wh, StockTransfer: rows };
    },
    solution: [
      "SELECT t.transfer_id, f.city AS from_city, d.city AS to_city, t.sku,",
      "       TIMESTAMPDIFF(HOUR, t.dispatched_at, '2025-04-10 18:00:00') AS hours_in_transit,",
      "       CASE WHEN TIMESTAMPDIFF(HOUR, t.dispatched_at, '2025-04-10 18:00:00') > 48 THEN 'DELAYED' ELSE 'ON_TIME' END AS transit_status",
      "FROM StockTransfer t",
      "JOIN Warehouse f ON f.warehouse_id = t.from_wh",
      "JOIN Warehouse d ON d.warehouse_id = t.to_wh",
      "WHERE t.received_at IS NULL",
      "ORDER BY hours_in_transit DESC, t.transfer_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT transfer_id, from_city, to_city, sku, hrs AS hours_in_transit, IF(hrs > 48, 'DELAYED', 'ON_TIME') AS transit_status FROM (",
        "  SELECT t.transfer_id, t.sku, TIMESTAMPDIFF(HOUR, t.dispatched_at, '2025-04-10 18:00:00') AS hrs,",
        "         (SELECT w.city FROM Warehouse w WHERE w.warehouse_id = t.from_wh) AS from_city,",
        "         (SELECT w.city FROM Warehouse w WHERE w.warehouse_id = t.to_wh) AS to_city",
        "  FROM StockTransfer t WHERE t.received_at IS NULL) x",
        "ORDER BY hrs DESC, transfer_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Each transfer has two warehouses, so the `Warehouse` table is needed twice under two aliases.",
      "`TIMESTAMPDIFF(HOUR, start, end)` counts whole hours and drops the remainder.",
      "Exactly 48 hours is not \"more than 48\".",
    ],
    editorial: [
      "A transfer row carries two foreign keys into the same table, so the city names come from **two joins to `Warehouse`** under different aliases — one matched on `from_wh`, the other on `to_wh`. Joining once with `warehouse_id IN (from_wh, to_wh)` would instead produce two rows per transfer.",
      "",
      "The time on the road is `TIMESTAMPDIFF(HOUR, dispatched_at, '2025-04-10 18:00:00')`, which counts complete hours: a truck dispatched at 17:59 two days earlier has been out 48 hours and one minute, which is 48 whole hours and therefore still `ON_TIME`; the status flips only at 49. A `CASE` (or `IF`) turns the number into the label. Received transfers are excluded with `received_at IS NULL`.",
      "",
      "The alternative looks the city names up with scalar subqueries and computes the hours once in a derived table so the label does not repeat the expression. Both read each transfer once and probe the warehouses by primary key.",
    ].join("\n"),
  },

  {
    slug: "stores-beating-their-city-average-in-q1",
    title: "Stores Beating Their City's Average in Q1",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation", "Window Functions"],
    description: [
      "For the quarterly review, a store's **Q1 2025 revenue** is the sum of its takings dated from 2025-01-01 to 2025-03-31. Compare each store with the **average Q1 revenue of the stores in the same city** — averaged over the stores of that city that have any Q1 takings.",
      "",
      "Return `store_name`, `city` and `q1_revenue` for every store whose Q1 revenue is **strictly greater** than its city's average. A store alone in its city equals the average and is never returned. Order the rows by `city`, then by `q1_revenue` **highest first**, then by `store_name`.",
    ].join("\n"),
    tables: [
      {
        name: "Store",
        columns: [
          { name: "store_id", type: "int" },
          { name: "store_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["store_id"],
        note: "Store names are unique.",
      },
      {
        name: "DailyTakings",
        columns: [
          { name: "store_id", type: "int" },
          { name: "takings_date", type: "date" },
          { name: "takings", type: "int" },
        ],
        primaryKey: ["store_id", "takings_date"],
        note: "A store's banked takings for one day, in rupees.",
      },
    ],
    examples: [
      {
        Store: [
          [1, "Indiranagar", "Bengaluru"],
          [2, "Jayanagar", "Bengaluru"],
          [3, "Whitefield", "Bengaluru"],
          [4, "Andheri West", "Mumbai"],
          [5, "Powai", "Mumbai"],
          [6, "Kothrud", "Pune"],
        ],
        DailyTakings: [
          [1, "2025-01-14", 210000],
          [1, "2025-03-02", 95000],
          [2, "2025-02-10", 180000],
          [3, "2025-03-31", 150000],
          [3, "2025-04-01", 400000],
          [4, "2025-01-20", 260000],
          [5, "2025-02-25", 260000],
          [6, "2025-03-18", 120000],
        ],
      },
    ],
    gen: (rng) => {
      const cities = sample(rng, ["Bengaluru", "Mumbai", "Pune", "Chennai"], ri(rng, 1, 2));
      const stores = sample(rng, STORE_NAMES, chance(rng, 0.1) ? 1 : ri(rng, 3, 9)).map((n, i) => [i + 1, n, pick(rng, cities)]);
      const rows: Cell[][] = [];
      const pool = [100000, 150000, 200000, 250000];
      for (const [sid] of stores) {
        if (chance(rng, 0.15)) continue;
        const days = sample(rng, ["2024-12-31", "2025-01-01", "2025-01-18", "2025-02-07", "2025-03-12", "2025-03-31", "2025-04-01"], ri(rng, 1, 3));
        for (const d of days) rows.push([sid!, d, chance(rng, 0.25) ? pick(rng, pool) : ri(rng, 20, 300) * 1000]);
      }
      return { Store: stores, DailyTakings: shuffle(rng, rows) };
    },
    solution: [
      "WITH q1 AS (",
      "  SELECT s.store_id, s.store_name, s.city, SUM(t.takings) AS q1_revenue",
      "  FROM Store s",
      "  JOIN DailyTakings t ON t.store_id = s.store_id",
      "  WHERE t.takings_date BETWEEN '2025-01-01' AND '2025-03-31'",
      "  GROUP BY s.store_id, s.store_name, s.city",
      ")",
      "SELECT store_name, city, q1_revenue",
      "FROM q1 a",
      "WHERE q1_revenue > (SELECT AVG(b.q1_revenue) FROM q1 b WHERE b.city = a.city)",
      "ORDER BY city, q1_revenue DESC, store_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT store_name, city, q1_revenue FROM (",
        "  SELECT s.store_name, s.city, SUM(t.takings) AS q1_revenue,",
        "         AVG(SUM(t.takings)) OVER (PARTITION BY s.city) AS city_avg",
        "  FROM Store s JOIN DailyTakings t ON t.store_id = s.store_id",
        "  WHERE t.takings_date >= '2025-01-01' AND t.takings_date < '2025-04-01'",
        "  GROUP BY s.store_id, s.store_name, s.city) x",
        "WHERE q1_revenue > city_avg",
        "ORDER BY city, q1_revenue DESC, store_name",
      ].join("\n"),
      [
        "WITH q1 AS (SELECT store_id, SUM(takings) AS rev FROM DailyTakings WHERE QUARTER(takings_date) = 1 AND YEAR(takings_date) = 2025 GROUP BY store_id),",
        "c AS (SELECT s.city, AVG(q.rev) AS avg_rev FROM q1 q JOIN Store s ON s.store_id = q.store_id GROUP BY s.city)",
        "SELECT s.store_name, s.city, q.rev AS q1_revenue FROM q1 q JOIN Store s ON s.store_id = q.store_id JOIN c ON c.city = s.city",
        "WHERE q.rev > c.avg_rev ORDER BY s.city, q.rev DESC, s.store_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Start by computing one Q1 total per store; only then is there something to average.",
      "The city average is an average of store totals, not of daily takings.",
      "A correlated subquery, a window `AVG(...) OVER (PARTITION BY city)` or a join to a per-city table all work.",
    ],
    editorial: [
      "The comparison is between a store's quarter and its city's typical store, so the work is layered. Step one: total each store's takings inside the quarter (the date filter is in `WHERE`, so takings on 2024-12-31 or 2025-04-01 never count). Step two: average those **store totals** per city — averaging the raw daily rows instead would weight stores by how many days they banked.",
      "",
      "The solution names step one as a CTE and compares each row with a correlated `AVG` over the same city. A store with no Q1 takings has no row in the CTE, so it neither appears nor drags its city's average down, as the statement specifies. A store alone in its city equals its own average and fails the strict `>`.",
      "",
      "The window alternative nests the aggregate in a window, `AVG(SUM(takings)) OVER (PARTITION BY city)`, which computes the city average right next to each store's total in a single grouping pass. The third version builds a per-city table and joins it back. All are linear after the initial grouping.",
    ].join("\n"),
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "fifo-valuation-of-stock-left-on-hand",
    title: "FIFO Valuation of the Stock Left on Hand",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation", "Joins"],
    description: [
      "The chain values inventory **first in, first out**: units issued from a SKU are taken from its oldest receipt first (earliest `received_on`, then lowest `receipt_id`), so what is left on hand is the newest stock, valued at the cost of the receipts it came from. `UnitsIssued` holds each SKU's total issued since the receipts began; a SKU with no row there has issued nothing. Issues never exceed receipts.",
      "",
      "For every SKU with units left, return `sku`, `units_left` and `fifo_value` (the sum over its receipts of the units still left from that receipt × its `unit_cost`, **rounded to 2 decimal places**). SKUs with nothing left are not returned. Order the rows by `sku`.",
    ].join("\n"),
    tables: [
      {
        name: "StockReceipt",
        columns: [
          { name: "receipt_id", type: "int" },
          { name: "sku", type: "varchar" },
          { name: "received_on", type: "date" },
          { name: "qty", type: "int" },
          { name: "unit_cost", type: "decimal" },
        ],
        primaryKey: ["receipt_id"],
        note: "One row per goods receipt (a FIFO layer); `unit_cost` in rupees per unit.",
      },
      {
        name: "UnitsIssued",
        columns: [
          { name: "sku", type: "varchar" },
          { name: "qty_issued", type: "int" },
        ],
        primaryKey: ["sku"],
        note: "Total units sold or transferred out of each SKU so far.",
      },
    ],
    examples: [
      {
        StockReceipt: [
          [1, "GRO-1001", "2025-01-03", 50, 500],
          [2, "GRO-1001", "2025-01-17", 40, 520],
          [3, "GRO-1001", "2025-02-02", 30, 515.5],
          [4, "DAI-2002", "2025-01-10", 100, 62],
          [5, "DAI-2002", "2025-01-10", 60, 64.25],
          [6, "SNK-6001", "2025-01-05", 200, 19.8],
          [7, "BEV-3001", "2025-01-21", 25, 98],
        ],
        UnitsIssued: [
          ["GRO-1001", 70],
          ["DAI-2002", 100],
          ["SNK-6001", 200],
        ],
      },
    ],
    gen: (rng) => {
      const skus = sample(rng, SKUS, ri(rng, 1, 4));
      const rec: Cell[][] = [];
      const iss: Cell[][] = [];
      let id = 1;
      for (const [sku, , mrp] of skus) {
        const k = ri(rng, 1, 4);
        let total = 0;
        const sameDay = chance(rng, 0.3);
        let day = dateBetween(rng, "2025-01-01", "2025-01-20");
        for (let j = 0; j < k; j++) {
          const q = ri(rng, 1, 12) * 10;
          total += q;
          rec.push([id++, sku, day, q, Math.round(mrp * (0.6 + rng() * 0.25) * 4) / 4]);
          if (!(sameDay && j === 0)) day = addDays(day, ri(rng, 3, 15));
        }
        const r = rng();
        if (r < 0.2) continue;
        const issued = r < 0.35 ? total : r < 0.45 ? 0 : ri(rng, 1, total);
        iss.push([sku, issued]);
      }
      return { StockReceipt: shuffle(rng, rec), UnitsIssued: iss };
    },
    solution: [
      "WITH layers AS (",
      "  SELECT r.sku, r.qty, r.unit_cost,",
      "         SUM(r.qty) OVER (PARTITION BY r.sku ORDER BY r.received_on, r.receipt_id",
      "                          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cum_qty,",
      "         COALESCE(u.qty_issued, 0) AS issued",
      "  FROM StockReceipt r",
      "  LEFT JOIN UnitsIssued u ON u.sku = r.sku",
      "), remaining AS (",
      "  SELECT sku, unit_cost,",
      "         CASE WHEN cum_qty <= issued THEN 0",
      "              WHEN cum_qty - qty >= issued THEN qty",
      "              ELSE cum_qty - issued END AS units_left",
      "  FROM layers",
      ")",
      "SELECT sku, SUM(units_left) AS units_left,",
      "       ROUND(SUM(units_left * unit_cost), 2) AS fifo_value",
      "FROM remaining",
      "GROUP BY sku",
      "HAVING SUM(units_left) > 0",
      "ORDER BY sku",
    ].join("\n"),
    alternatives: [
      [
        "SELECT sku, SUM(left_qty) AS units_left, ROUND(SUM(left_qty * unit_cost), 2) AS fifo_value FROM (",
        "  SELECT r.sku, r.unit_cost,",
        "         GREATEST(0, LEAST(r.qty,",
        "           (SELECT SUM(r2.qty) FROM StockReceipt r2 WHERE r2.sku = r.sku",
        "              AND (r2.received_on < r.received_on OR (r2.received_on = r.received_on AND r2.receipt_id <= r.receipt_id)))",
        "           - IFNULL((SELECT u.qty_issued FROM UnitsIssued u WHERE u.sku = r.sku), 0))) AS left_qty",
        "  FROM StockReceipt r) t",
        "GROUP BY sku",
        "HAVING SUM(left_qty) > 0",
        "ORDER BY sku",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Order each SKU's receipts oldest first and keep a running total of the quantity received.",
      "Compare each layer's running total with the units issued: a layer is fully used, untouched, or partly used.",
      "Units left in a layer = clamp(running total − issued, 0, layer qty).",
      "Don't forget SKUs that issued nothing — their issued quantity is 0, not NULL.",
    ],
    editorial: [
      "FIFO valuation is a **running-total** problem. Sort each SKU's receipts by `received_on, receipt_id` and compute `cum_qty`, the units received up to and including each layer (`SUM(qty) OVER (PARTITION BY sku ORDER BY … ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` — the explicit `ROWS` frame and the `receipt_id` tie-break make two receipts on the same day consume in a fixed order).",
      "",
      "Issues eat the layers from the oldest, so with `issued` units gone each layer is in one of three states. If `cum_qty <= issued`, the layer is fully consumed. If the units before it (`cum_qty - qty`) already cover the issues, it is untouched and all `qty` remain. Otherwise it is the layer the issues stopped in, and `cum_qty - issued` units remain. That is the same as clamping `cum_qty - issued` between 0 and `qty`, which is how the alternative writes it with `GREATEST`/`LEAST`.",
      "",
      "The value is the sum of remaining units × their layer's cost, rounded to 2 places; SKUs whose layers are all consumed are dropped in `HAVING`. A SKU missing from `UnitsIssued` gets 0 through the LEFT JOIN and `COALESCE`. The window version sorts each SKU once (O(n log n)); the correlated running total is quadratic in receipts per SKU but shows the definition directly.",
    ].join("\n"),
  },

  {
    slug: "longest-consecutive-stockout-run-per-sku",
    title: "Longest Consecutive Stock-Out Run per SKU",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "A flagship store logs each SKU's closing stock per day. A **stock-out run** is a sequence of consecutive calendar days on which the SKU closed at 0. A day that closed above 0, a day with no closing recorded (`closing_qty` NULL), or a day missing from the log (the store was shut) ends the run.",
      "",
      "For every SKU that had at least one stock-out day, return its **longest** run: `sku`, `run_days`, `run_start` and `run_end`. If two runs are equally long, report the **earlier** one. Order the rows by `sku`.",
    ].join("\n"),
    tables: [
      {
        name: "ShelfClosing",
        columns: [
          { name: "sku", type: "varchar" },
          { name: "stock_date", type: "date" },
          { name: "closing_qty", type: "int" },
        ],
        primaryKey: ["sku", "stock_date"],
        note: "One row per SKU per trading day; `closing_qty` is NULL where the count was not taken.",
      },
    ],
    examples: [
      {
        ShelfClosing: [
          ["DAI-2002", "2025-06-01", 0],
          ["DAI-2002", "2025-06-02", 0],
          ["DAI-2002", "2025-06-03", 5],
          ["DAI-2002", "2025-06-04", 0],
          ["DAI-2002", "2025-06-05", 0],
          ["DAI-2002", "2025-06-06", 0],
          ["SNK-6001", "2025-06-01", 0],
          ["SNK-6001", "2025-06-03", 0],
          ["GRO-1001", "2025-06-02", 12],
          ["GRO-1001", "2025-06-03", null],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const sku of sample(rng, SKU_CODES, ri(rng, 1, 3))) {
        const zeroRate = pick(rng, [0.3, 0.55, 0.8]);
        for (let d = 0; d < 12; d++) {
          if (chance(rng, 0.12)) continue;
          const q = chance(rng, 0.08) ? null : chance(rng, zeroRate) ? 0 : ri(rng, 1, 30);
          rows.push([sku, addDays("2025-06-01", d), q]);
        }
      }
      return { ShelfClosing: shuffle(rng, rows) };
    },
    solution: [
      "WITH zero_days AS (",
      "  SELECT sku, stock_date,",
      "         DATEDIFF(stock_date, '2025-01-01')",
      "           - ROW_NUMBER() OVER (PARTITION BY sku ORDER BY stock_date) AS island",
      "  FROM ShelfClosing",
      "  WHERE closing_qty = 0",
      "), runs AS (",
      "  SELECT sku, MIN(stock_date) AS run_start, MAX(stock_date) AS run_end, COUNT(*) AS run_days",
      "  FROM zero_days",
      "  GROUP BY sku, island",
      "), ranked AS (",
      "  SELECT sku, run_days, run_start, run_end,",
      "         ROW_NUMBER() OVER (PARTITION BY sku ORDER BY run_days DESC, run_start) AS rn",
      "  FROM runs",
      ")",
      "SELECT sku, run_days, run_start, run_end",
      "FROM ranked",
      "WHERE rn = 1",
      "ORDER BY sku",
    ].join("\n"),
    alternatives: [
      [
        "WITH z AS (",
        "  SELECT sku, stock_date,",
        "         CASE WHEN DATEDIFF(stock_date, LAG(stock_date) OVER (PARTITION BY sku ORDER BY stock_date)) = 1 THEN 0 ELSE 1 END AS starts_run",
        "  FROM ShelfClosing WHERE closing_qty = 0",
        "), g AS (",
        "  SELECT sku, stock_date, SUM(starts_run) OVER (PARTITION BY sku ORDER BY stock_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS run_no FROM z",
        "), runs AS (",
        "  SELECT sku, run_no, COUNT(*) AS run_days, MIN(stock_date) AS run_start, MAX(stock_date) AS run_end FROM g GROUP BY sku, run_no",
        ")",
        "SELECT r.sku, r.run_days, r.run_start, r.run_end FROM runs r",
        "WHERE NOT EXISTS (SELECT 1 FROM runs o WHERE o.sku = r.sku AND (o.run_days > r.run_days OR (o.run_days = r.run_days AND o.run_start < r.run_start)))",
        "ORDER BY r.sku",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Keep only the stock-out days first; the runs are islands of consecutive dates among them.",
      "Along consecutive dates, the date minus the row number is constant — use that as an island key.",
      "Then pick one island per SKU: longest first, earliest start on a tie.",
    ],
    editorial: [
      "This is **gaps and islands**. Filter the log to stock-out days only. Within one SKU, number those days in date order with `ROW_NUMBER()`. For consecutive dates the day count (`DATEDIFF(stock_date, <any fixed date>)`) and the row number both go up by one, so their difference is constant; as soon as a day is missing — because it closed above zero, was not counted, or is absent from the log — the day count jumps and the difference changes. That difference is the island key.",
      "",
      "Grouping by `(sku, island)` gives each run's first day, last day and length. Choosing the longest per SKU is a top-1-per-group problem with an explicit tie rule, so `ROW_NUMBER() OVER (PARTITION BY sku ORDER BY run_days DESC, run_start)` picks exactly one run, the earlier of equal ones.",
      "",
      "The alternative marks the start of each run with `LAG` (a day is a start unless the previous stock-out day is exactly one day earlier), numbers runs with a running sum of those flags, and keeps the run no other run beats with `NOT EXISTS`. Both are a couple of sorts per SKU. NULL closings drop out of the filter, so they break a run just like a missing day.",
    ].join("\n"),
  },

  {
    slug: "first-day-stock-falls-below-reorder-point",
    title: "First Day a SKU's Stock Falls Below Its Reorder Point",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins"],
    description: [
      "Planning starts each SKU at an opening balance and applies its daily net movement (receipts minus issues, so it can be negative). The **closing balance** on a movement day is the opening balance plus every net movement up to and including that day.",
      "",
      "For every SKU whose closing balance ever goes **strictly below** its reorder point on a movement day, return the first such day: `sku`, `breach_date`, `closing_balance` (on that day) and `reorder_point`. Days without a movement row are not checked, and the opening balance on its own never counts as a breach. Order the rows by `breach_date`, then by `sku`.",
    ].join("\n"),
    tables: [
      {
        name: "ReorderRule",
        columns: [
          { name: "sku", type: "varchar" },
          { name: "opening_qty", type: "int" },
          { name: "reorder_point", type: "int" },
        ],
        primaryKey: ["sku"],
        note: "One row per planned SKU: its balance before the first movement and its reorder point.",
      },
      {
        name: "DailyNetMovement",
        columns: [
          { name: "sku", type: "varchar" },
          { name: "move_date", type: "date" },
          { name: "net_qty", type: "int" },
        ],
        primaryKey: ["sku", "move_date"],
        note: "The net units added (positive) or removed (negative) on a day; every `sku` is in `ReorderRule`.",
      },
    ],
    examples: [
      {
        ReorderRule: [
          ["GRO-1001", 80, 30],
          ["DAI-2002", 50, 20],
          ["SNK-6001", 15, 25],
          ["HOM-5001", 40, 10],
        ],
        DailyNetMovement: [
          ["GRO-1001", "2025-07-01", -30],
          ["GRO-1001", "2025-07-02", -20],
          ["GRO-1001", "2025-07-03", -5],
          ["GRO-1001", "2025-07-04", -10],
          ["DAI-2002", "2025-07-01", -35],
          ["DAI-2002", "2025-07-02", 40],
          ["SNK-6001", "2025-07-02", 20],
          ["SNK-6001", "2025-07-03", -15],
          ["HOM-5001", "2025-07-02", -30],
        ],
      },
    ],
    gen: (rng) => {
      const items = sample(rng, SKU_CODES, ri(rng, 1, 5));
      const rules = items.map((s) => {
        const rp = ri(rng, 2, 8) * 5;
        return [s, rp + ri(rng, -2, 8) * 5, rp];
      });
      const moves: Cell[][] = [];
      for (const [s] of rules) {
        for (let d = 0; d < 8; d++) {
          if (chance(rng, 0.35)) continue;
          moves.push([s!, addDays("2025-07-01", d), chance(rng, 0.25) ? ri(rng, 1, 6) * 5 : -ri(rng, 0, 4) * 5]);
        }
      }
      return { ReorderRule: rules, DailyNetMovement: shuffle(rng, moves) };
    },
    solution: [
      "WITH balances AS (",
      "  SELECT m.sku, m.move_date, r.reorder_point,",
      "         r.opening_qty + SUM(m.net_qty) OVER (PARTITION BY m.sku ORDER BY m.move_date",
      "                                             ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS closing_balance",
      "  FROM DailyNetMovement m",
      "  JOIN ReorderRule r ON r.sku = m.sku",
      "), breaches AS (",
      "  SELECT sku, move_date, closing_balance, reorder_point,",
      "         ROW_NUMBER() OVER (PARTITION BY sku ORDER BY move_date) AS nth",
      "  FROM balances",
      "  WHERE closing_balance < reorder_point",
      ")",
      "SELECT sku, move_date AS breach_date, closing_balance, reorder_point",
      "FROM breaches",
      "WHERE nth = 1",
      "ORDER BY breach_date, sku",
    ].join("\n"),
    alternatives: [
      [
        "WITH balances AS (",
        "  SELECT m.sku, m.move_date, r.reorder_point,",
        "         r.opening_qty + (SELECT SUM(x.net_qty) FROM DailyNetMovement x WHERE x.sku = m.sku AND x.move_date <= m.move_date) AS closing_balance",
        "  FROM DailyNetMovement m JOIN ReorderRule r ON r.sku = m.sku",
        ")",
        "SELECT b.sku, b.move_date AS breach_date, b.closing_balance, b.reorder_point",
        "FROM balances b",
        "WHERE b.closing_balance < b.reorder_point",
        "  AND b.move_date = (SELECT MIN(c.move_date) FROM balances c WHERE c.sku = b.sku AND c.closing_balance < c.reorder_point)",
        "ORDER BY breach_date, b.sku",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "A running `SUM(net_qty)` per SKU, ordered by date, plus the opening quantity gives the closing balance of each day.",
      "Window results cannot be filtered in the same SELECT's WHERE — compute them in a CTE first.",
      "Of the breach days, keep the earliest per SKU.",
    ],
    editorial: [
      "The balance is not stored; it is a **running total** that has to be rebuilt. For each SKU, `SUM(net_qty) OVER (PARTITION BY sku ORDER BY move_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` adds up the movements to date, and adding `opening_qty` from the joined rule turns it into the closing balance. Dates are unique per SKU, so the frame is unambiguous.",
      "",
      "Window functions are evaluated after `WHERE`, so the breach test `closing_balance < reorder_point` must happen one level up, in a second CTE. There, a `ROW_NUMBER()` in date order (or a `MIN(move_date)` per SKU) singles out the first breach. A balance that touches the reorder point exactly is not a breach, and a SKU that dips and recovers is reported at its first dip only. SKUs that are below their reorder point before any movement are not breaches by the statement's rule; they are reported only if a movement day closes below it.",
      "",
      "The alternative computes the running balance with a correlated `SUM` over earlier days and then keeps the minimum breach date per SKU — quadratic per SKU, but the window version needs one sort. Filtering the movements before computing the running total would be wrong: every day's movement must enter the balance, breach or not.",
    ].join("\n"),
  },

  {
    slug: "median-supplier-lead-time-from-goods-inward",
    title: "Median Supplier Lead Time From Goods Inward",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation", "Dates"],
    description: [
      "Averages are pulled about by one stuck delivery, so the supply-chain team quotes each supplier's **median** lead time instead. A delivery's lead time is the number of days from `po_date` to `grn_date`. With an odd number of deliveries the median is the middle value; with an even number it is the average of the two middle values.",
      "",
      "Return `supplier_id`, `deliveries` and `median_lead_days` (**rounded to 1 decimal place**) for every supplier with at least one delivery. Order the rows by `supplier_id`.",
    ].join("\n"),
    tables: [
      {
        name: "GoodsInward",
        columns: [
          { name: "grn_id", type: "int" },
          { name: "supplier_id", type: "int" },
          { name: "po_date", type: "date" },
          { name: "grn_date", type: "date" },
        ],
        primaryKey: ["grn_id"],
        note: "One row per goods-received note; `grn_date` is never before `po_date`.",
      },
    ],
    examples: [
      {
        GoodsInward: [
          [1, 10, "2025-02-01", "2025-02-04"],
          [2, 10, "2025-02-05", "2025-02-12"],
          [3, 10, "2025-02-10", "2025-03-02"],
          [4, 20, "2025-02-03", "2025-02-08"],
          [5, 20, "2025-02-06", "2025-02-08"],
          [6, 20, "2025-02-11", "2025-02-20"],
          [7, 20, "2025-02-14", "2025-02-17"],
          [8, 30, "2025-02-09", "2025-02-13"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      for (const s of sample(rng, [10, 20, 30, 40, 50], ri(rng, 1, 4))) {
        const k = ri(rng, 1, 7);
        const typical = ri(rng, 2, 8);
        for (let j = 0; j < k; j++) {
          const po = dateBetween(rng, "2025-01-01", "2025-03-31");
          const lead = chance(rng, 0.15) ? ri(rng, 15, 30) : Math.max(0, typical + ri(rng, -2, 2));
          rows.push([id++, s, po, addDays(po, lead)]);
        }
      }
      return { GoodsInward: shuffle(rng, rows) };
    },
    solution: [
      "WITH leads AS (",
      "  SELECT supplier_id, DATEDIFF(grn_date, po_date) AS lead_days,",
      "         ROW_NUMBER() OVER (PARTITION BY supplier_id ORDER BY DATEDIFF(grn_date, po_date), grn_id) AS rn,",
      "         COUNT(*) OVER (PARTITION BY supplier_id) AS cnt",
      "  FROM GoodsInward",
      ")",
      "SELECT supplier_id, MAX(cnt) AS deliveries, ROUND(AVG(lead_days), 1) AS median_lead_days",
      "FROM leads",
      "WHERE rn IN ((cnt + 1) DIV 2, (cnt + 2) DIV 2)",
      "GROUP BY supplier_id",
      "ORDER BY supplier_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH leads AS (SELECT grn_id, supplier_id, DATEDIFF(grn_date, po_date) AS lead_days FROM GoodsInward),",
        "counts AS (SELECT supplier_id, COUNT(*) AS cnt FROM leads GROUP BY supplier_id)",
        "SELECT c.supplier_id, c.cnt AS deliveries,",
        "       ROUND((SELECT AVG(DISTINCT a.lead_days) FROM leads a",
        "              WHERE a.supplier_id = c.supplier_id",
        "                AND (SELECT COUNT(*) FROM leads b WHERE b.supplier_id = a.supplier_id AND b.lead_days <= a.lead_days) >= c.cnt / 2",
        "                AND (SELECT COUNT(*) FROM leads b WHERE b.supplier_id = a.supplier_id AND b.lead_days >= a.lead_days) >= c.cnt / 2), 1) AS median_lead_days",
        "FROM counts c",
        "ORDER BY c.supplier_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Number each supplier's lead times in ascending order and count them in the same pass with window functions.",
      "For n values the middle positions are (n + 1) DIV 2 and (n + 2) DIV 2 — the same position when n is odd.",
      "Averaging the one or two middle values gives the median in both cases.",
    ],
    editorial: [
      "MySQL has no `MEDIAN()` aggregate, so the median is built from its definition: sort the values, find the middle. `ROW_NUMBER() OVER (PARTITION BY supplier_id ORDER BY lead_days, grn_id)` gives each delivery its position in sorted order (the `grn_id` tie-break only fixes which of equal values gets which number; the values themselves are what matter), and `COUNT(*) OVER (PARTITION BY supplier_id)` puts the supplier's total next to every row.",
      "",
      "With `n` values the middle positions are `(n + 1) DIV 2` and `(n + 2) DIV 2`: for n = 3 both are 2, for n = 4 they are 2 and 3. Keeping the rows at those positions and averaging them yields the middle value for an odd count and the mean of the two middle values for an even one — one formula for both cases. The average of two whole numbers ends in .0 or .5, which rounds to one decimal place exactly.",
      "",
      "The alternative uses the counting definition: a value is a median candidate when at least half the values are ≤ it and at least half are ≥ it. For an odd count only the middle value qualifies; for an even count the two middle values do, and `AVG(DISTINCT …)` averages them (or returns the single value when they are equal). It is quadratic per supplier, while the window version is one sort.",
    ].join("\n"),
  },

  {
    slug: "supplier-otif-rate-by-order-quarter",
    title: "Supplier On-Time-In-Full Rate by Order Quarter",
    difficulty: "HARD",
    topics: ["Joins", "Conditional Logic", "Dates"],
    description: [
      "A purchase order is **OTIF** (on time, in full) when **every** one of its lines had received at least its ordered quantity by the order's `promised_date` — receipts dated on the promised date count, later receipts do not. A line with no on-time receipt makes the whole order miss.",
      "",
      "For each supplier and quarter of `order_date` (labelled like `2024-Q4`), return `supplier_id`, `order_quarter`, `orders`, `otif_orders` and `otif_pct` = 100 × otif_orders / orders, **rounded to 2 decimal places**. Order the rows by `supplier_id`, then by `order_quarter`.",
    ].join("\n"),
    tables: [
      {
        name: "SupplierPo",
        columns: [
          { name: "po_id", type: "int" },
          { name: "supplier_id", type: "int" },
          { name: "order_date", type: "date" },
          { name: "promised_date", type: "date" },
        ],
        primaryKey: ["po_id"],
        note: "One row per purchase order; every order has at least one line.",
      },
      {
        name: "SupplierPoLine",
        columns: [
          { name: "po_id", type: "int" },
          { name: "line_no", type: "int" },
          { name: "qty_ordered", type: "int" },
        ],
        primaryKey: ["po_id", "line_no"],
        note: "The lines of each purchase order.",
      },
      {
        name: "LineReceipt",
        columns: [
          { name: "receipt_id", type: "int" },
          { name: "po_id", type: "int" },
          { name: "line_no", type: "int" },
          { name: "received_on", type: "date" },
          { name: "qty", type: "int" },
        ],
        primaryKey: ["receipt_id"],
        note: "Partial deliveries against a line; a line can have several.",
      },
    ],
    examples: [
      {
        SupplierPo: [
          [1, 7, "2024-11-04", "2024-11-12"],
          [2, 7, "2024-12-10", "2024-12-18"],
          [3, 7, "2025-01-06", "2025-01-14"],
          [4, 9, "2024-10-21", "2024-10-30"],
        ],
        SupplierPoLine: [
          [1, 1, 100],
          [1, 2, 40],
          [2, 1, 60],
          [3, 1, 25],
          [4, 1, 80],
          [4, 2, 20],
        ],
        LineReceipt: [
          [1, 1, 1, "2024-11-10", 60],
          [2, 1, 1, "2024-11-12", 40],
          [3, 1, 2, "2024-11-11", 40],
          [4, 2, 1, "2024-12-17", 50],
          [5, 2, 1, "2024-12-20", 10],
          [6, 3, 1, "2025-01-13", 30],
          [7, 4, 1, "2024-10-29", 80],
        ],
      },
    ],
    gen: (rng) => {
      const pos: Cell[][] = [];
      const lines: Cell[][] = [];
      const recs: Cell[][] = [];
      let rid = 1;
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 9);
      for (let p = 1; p <= n; p++) {
        const od = dateBetween(rng, "2024-08-01", "2025-03-31");
        const promised = addDays(od, ri(rng, 5, 12));
        pos.push([p, pick(rng, [7, 9, 12]), od, promised]);
        const k = ri(rng, 1, 3);
        for (let l = 1; l <= k; l++) {
          const q = ri(rng, 2, 10) * 10;
          lines.push([p, l, q]);
          const mode = pick(rng, ["ok", "ok", "ok", "late", "short", "none", "split"]);
          if (mode === "none") continue;
          if (mode === "split") {
            recs.push([rid++, p, l, addDays(promised, -ri(rng, 1, 3)), q / 2]);
            recs.push([rid++, p, l, addDays(promised, ri(rng, 0, 1)), q / 2]);
          } else {
            recs.push([rid++, p, l, addDays(promised, mode === "late" ? ri(rng, 1, 3) : -ri(rng, 0, 3)), mode === "short" ? q - 10 : q]);
          }
        }
      }
      return { SupplierPo: pos, SupplierPoLine: lines, LineReceipt: recs };
    },
    solution: [
      "WITH line_status AS (",
      "  SELECT l.po_id,",
      "         CASE WHEN COALESCE(SUM(CASE WHEN r.received_on <= p.promised_date THEN r.qty ELSE 0 END), 0) >= l.qty_ordered",
      "              THEN 1 ELSE 0 END AS line_ok",
      "  FROM SupplierPoLine l",
      "  JOIN SupplierPo p ON p.po_id = l.po_id",
      "  LEFT JOIN LineReceipt r ON r.po_id = l.po_id AND r.line_no = l.line_no",
      "  GROUP BY l.po_id, l.line_no, l.qty_ordered",
      "), po_status AS (",
      "  SELECT po_id, MIN(line_ok) AS is_otif FROM line_status GROUP BY po_id",
      ")",
      "SELECT p.supplier_id,",
      "       CONCAT(YEAR(p.order_date), '-Q', QUARTER(p.order_date)) AS order_quarter,",
      "       COUNT(*) AS orders,",
      "       SUM(s.is_otif) AS otif_orders,",
      "       ROUND(100 * SUM(s.is_otif) / COUNT(*), 2) AS otif_pct",
      "FROM SupplierPo p",
      "JOIN po_status s ON s.po_id = p.po_id",
      "GROUP BY p.supplier_id, CONCAT(YEAR(p.order_date), '-Q', QUARTER(p.order_date))",
      "ORDER BY p.supplier_id, order_quarter",
    ].join("\n"),
    alternatives: [
      [
        "SELECT supplier_id, order_quarter, COUNT(*) AS orders, SUM(is_otif) AS otif_orders, ROUND(100 * SUM(is_otif) / COUNT(*), 2) AS otif_pct FROM (",
        "  SELECT p.supplier_id, CONCAT(YEAR(p.order_date), '-Q', QUARTER(p.order_date)) AS order_quarter,",
        "         CASE WHEN EXISTS (",
        "           SELECT 1 FROM SupplierPoLine l",
        "           WHERE l.po_id = p.po_id",
        "             AND l.qty_ordered > (SELECT IFNULL(SUM(r.qty), 0) FROM LineReceipt r",
        "                                  WHERE r.po_id = l.po_id AND r.line_no = l.line_no AND r.received_on <= p.promised_date)",
        "         ) THEN 0 ELSE 1 END AS is_otif",
        "  FROM SupplierPo p) t",
        "GROUP BY supplier_id, order_quarter",
        "ORDER BY supplier_id, order_quarter",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Work bottom-up: first decide for each line whether it was complete by the promised date, then for each order, then aggregate by quarter.",
      "Only receipts on or before the promised date count towards a line — put that test inside the sum, not in WHERE, so lines with only late receipts survive.",
      "An order is OTIF when its worst line is OK: `MIN` of a 0/1 flag.",
      "`QUARTER()` gives 1–4; build the label with CONCAT.",
    ],
    editorial: [
      "OTIF is an \"all lines\" condition, and the cleanest way to evaluate one is to aggregate **upwards in levels**. At the line level, LEFT JOIN the receipts and sum only those dated on or before the order's promised date — the date test sits inside a `CASE` within the `SUM`, because putting it in `WHERE` would delete lines whose only receipts were late and make them disappear instead of fail. A line is OK when that on-time quantity reaches the ordered quantity; a line with no receipts at all gets 0 through `COALESCE` and fails.",
      "",
      "At the order level, the order is OTIF exactly when every line is OK, which is `MIN(line_ok) = 1`. Finally the orders are grouped by supplier and a quarter label `CONCAT(YEAR(order_date), '-Q', QUARTER(order_date))`, and the rate is `100 × OTIF orders / orders`, rounded to two places so MySQL's four-decimal division agrees with other engines.",
      "",
      "The alternative states the order-level rule as its negation: an order misses if **there exists** a line whose on-time receipts fall short. A correlated subquery sums the on-time receipts per line. It reads naturally but probes receipts per line per order; the staged version is a few hash aggregations.",
    ].join("\n"),
  },

  {
    slug: "daily-stock-carried-forward-from-last-count",
    title: "Daily Stock Carried Forward From the Last Count",
    difficulty: "HARD",
    topics: ["Dates", "Subqueries", "Joins"],
    description: [
      "A dark store counts SKUs only now and then, but the dashboard needs a figure for **every day from 2025-05-01 to 2025-05-07**. Each day shows the **most recent count taken on or before that day** (a count from April carries into May). A SKU has no row for days before its first count ever.",
      "",
      "Return `sku`, `stock_day`, `qty` (the carried-forward count) and `counted_on` (the date of that count) for every SKU in `StockCount` and every day of the window on which it has a count to carry. Counts after the window change nothing. Order the rows by `sku`, then by `stock_day`.",
    ].join("\n"),
    tables: [
      {
        name: "StockCount",
        columns: [
          { name: "sku", type: "varchar" },
          { name: "count_date", type: "date" },
          { name: "counted_qty", type: "int" },
        ],
        primaryKey: ["sku", "count_date"],
        note: "One row per physical count of a SKU (at most one a day).",
      },
    ],
    examples: [
      {
        StockCount: [
          ["GRO-1001", "2025-04-28", 34],
          ["GRO-1001", "2025-05-03", 18],
          ["GRO-1001", "2025-05-06", 52],
          ["DAI-2002", "2025-05-05", 11],
          ["DAI-2002", "2025-05-09", 40],
          ["SNK-6001", "2025-05-12", 75],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const sku of sample(rng, SKU_CODES, ri(rng, 1, 3))) {
        const days = sample(rng, ["2025-04-20", "2025-04-30", "2025-05-01", "2025-05-02", "2025-05-04", "2025-05-05", "2025-05-07", "2025-05-08", "2025-05-15"], ri(rng, 1, 4));
        for (const d of days) rows.push([sku, d, ri(rng, 0, 90)]);
      }
      return { StockCount: shuffle(rng, rows) };
    },
    solution: [
      "WITH RECURSIVE calendar (stock_day) AS (",
      "  SELECT CAST('2025-05-01' AS DATE)",
      "  UNION ALL",
      "  SELECT DATE_ADD(stock_day, INTERVAL 1 DAY) FROM calendar WHERE stock_day < '2025-05-07'",
      "), latest AS (",
      "  SELECT k.sku, c.stock_day,",
      "         (SELECT MAX(s.count_date) FROM StockCount s WHERE s.sku = k.sku AND s.count_date <= c.stock_day) AS counted_on",
      "  FROM (SELECT DISTINCT sku FROM StockCount) k",
      "  CROSS JOIN calendar c",
      ")",
      "SELECT l.sku, l.stock_day, s.counted_qty AS qty, l.counted_on",
      "FROM latest l",
      "JOIN StockCount s ON s.sku = l.sku AND s.count_date = l.counted_on",
      "ORDER BY l.sku, l.stock_day",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE calendar (stock_day) AS (",
        "  SELECT CAST('2025-05-01' AS DATE) UNION ALL SELECT DATE_ADD(stock_day, INTERVAL 1 DAY) FROM calendar WHERE stock_day < '2025-05-07'",
        "), candidates AS (",
        "  SELECT s.sku, c.stock_day, s.counted_qty, s.count_date,",
        "         ROW_NUMBER() OVER (PARTITION BY s.sku, c.stock_day ORDER BY s.count_date DESC) AS rn",
        "  FROM calendar c JOIN StockCount s ON s.count_date <= c.stock_day",
        ")",
        "SELECT sku, stock_day, counted_qty AS qty, count_date AS counted_on FROM candidates WHERE rn = 1 ORDER BY sku, stock_day",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "There is no table of days — generate the seven dates with a recursive CTE.",
      "Pair every SKU with every day, then find the latest count on or before that day.",
      "An inner join back to the counts drops the days before a SKU's first count automatically.",
    ],
    editorial: [
      "Two things are missing from the data: the days themselves, and a value on days nobody counted. A **recursive CTE** supplies the first — it starts at `2025-05-01` and adds a day with `DATE_ADD(…, INTERVAL 1 DAY)` until `2025-05-07`, a bounded seven-row series. `CAST(… AS DATE)` in the anchor fixes the column's type so MySQL does not treat it as a seven-character string.",
      "",
      "Every SKU is then paired with every day (`CROSS JOIN` of the distinct SKUs and the calendar), and a correlated `MAX(count_date) … WHERE count_date <= stock_day` finds the count that applies — the **last observation carried forward**. Joining back to `StockCount` on that date fetches the quantity; on days before a SKU's first count the `MAX` is NULL, the join finds nothing and the row disappears, exactly as the statement asks. Counts after the window can never be ≤ a window day, so they are ignored.",
      "",
      "The alternative joins every day to every earlier count and keeps the newest with `ROW_NUMBER() … ORDER BY count_date DESC`. Both are small here: seven days × the counts per SKU.",
    ].join("\n"),
  },

  {
    slug: "products-most-often-in-the-same-basket",
    title: "Products Most Often Bought in the Same Basket",
    difficulty: "HARD",
    topics: ["Joins", "Aggregation", "Strings"],
    description: [
      "For the next planogram, the category team wants product pairs that customers buy **together on the same bill**. A pair is two different SKUs on one bill (quantities do not matter), counted once per bill. Only pairs seen together on **at least 2 bills** are interesting.",
      "",
      "Return, for each such pair, `pair` (the two product names joined as `<name of the smaller SKU> + <name of the larger SKU>`, comparing the SKU codes), `bills_together` and `support_pct` = 100 × bills_together / (number of distinct bills in `BillLine`), **rounded to 2 decimal places**. Order the rows by `bills_together` **highest first**, then by `pair`.",
    ].join("\n"),
    tables: [
      {
        name: "BasketProduct",
        columns: [
          { name: "sku", type: "varchar" },
          { name: "product_name", type: "varchar" },
        ],
        primaryKey: ["sku"],
        note: "Product names are unique.",
      },
      {
        name: "BillLine",
        columns: [
          { name: "bill_id", type: "int" },
          { name: "sku", type: "varchar" },
          { name: "qty", type: "int" },
        ],
        primaryKey: ["bill_id", "sku"],
        note: "One row per SKU on a bill; every `sku` is in `BasketProduct`.",
      },
    ],
    examples: [
      {
        BasketProduct: [
          ["BEV-3001", "Masala Chai 250g"],
          ["DAI-2002", "Paneer 200g"],
          ["GRO-1002", "Toor Dal 1kg"],
          ["SNK-6001", "Masala Chips 90g"],
          ["GRO-1001", "Basmati Rice 5kg"],
        ],
        BillLine: [
          [1, "BEV-3001", 1],
          [1, "SNK-6001", 2],
          [1, "GRO-1002", 1],
          [2, "BEV-3001", 2],
          [2, "SNK-6001", 1],
          [3, "GRO-1001", 1],
          [3, "GRO-1002", 2],
          [4, "GRO-1002", 1],
          [4, "GRO-1001", 1],
          [5, "DAI-2002", 3],
        ],
      },
    ],
    gen: (rng) => {
      const items = sample(rng, SKUS, ri(rng, 2, 5));
      const prod = items.map(([s, n]) => [s, n]);
      const lines: Cell[][] = [];
      const bills = chance(rng, 0.05) ? 0 : ri(rng, 2, 9);
      for (let b = 1; b <= bills; b++) {
        for (const [s] of sample(rng, items, ri(rng, 1, Math.min(4, items.length)))) lines.push([b, s, ri(rng, 1, 3)]);
      }
      return { BasketProduct: prod, BillLine: shuffle(rng, lines) };
    },
    solution: [
      "SELECT CONCAT(pa.product_name, ' + ', pb.product_name) AS pair,",
      "       COUNT(*) AS bills_together,",
      "       ROUND(100 * COUNT(*) / (SELECT COUNT(DISTINCT bill_id) FROM BillLine), 2) AS support_pct",
      "FROM BillLine a",
      "JOIN BillLine b ON b.bill_id = a.bill_id AND a.sku < b.sku",
      "JOIN BasketProduct pa ON pa.sku = a.sku",
      "JOIN BasketProduct pb ON pb.sku = b.sku",
      "GROUP BY a.sku, b.sku, pa.product_name, pb.product_name",
      "HAVING COUNT(*) >= 2",
      "ORDER BY bills_together DESC, pair",
    ].join("\n"),
    alternatives: [
      [
        "WITH pairs AS (",
        "  SELECT a.sku AS sku_a, b.sku AS sku_b, COUNT(DISTINCT a.bill_id) AS n",
        "  FROM BillLine a CROSS JOIN BillLine b",
        "  WHERE a.bill_id = b.bill_id AND a.sku < b.sku",
        "  GROUP BY a.sku, b.sku",
        "), total AS (SELECT COUNT(*) AS bills FROM (SELECT DISTINCT bill_id FROM BillLine) d)",
        "SELECT CONCAT((SELECT product_name FROM BasketProduct WHERE sku = p.sku_a), ' + ', (SELECT product_name FROM BasketProduct WHERE sku = p.sku_b)) AS pair,",
        "       p.n AS bills_together, ROUND(100 * p.n / t.bills, 2) AS support_pct",
        "FROM pairs p CROSS JOIN total t",
        "WHERE p.n >= 2",
        "ORDER BY bills_together DESC, pair",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Join `BillLine` to itself on the bill to see every two products on one bill.",
      "`a.sku < b.sku` keeps each unordered pair once and drops a product paired with itself.",
      "The denominator is the number of distinct bills overall — a scalar subquery.",
    ],
    editorial: [
      "Market-basket pairs come from a **self join on the bill**: every two lines of the same bill form a candidate pair. Without a condition on the SKUs each pair would appear twice (A–B and B–A) and every product would pair with itself; `a.sku < b.sku` keeps exactly one orientation, the smaller SKU first, which is also the order the label needs.",
      "",
      "Since a SKU appears at most once per bill (it is part of the key), each bill contributes at most one row per pair, so `COUNT(*)` after grouping by the two SKUs is the number of bills they share. `HAVING COUNT(*) >= 2` keeps the recurring pairs. The label joins `BasketProduct` twice — once per side — and is built with `CONCAT`. Support is that count over the number of distinct bills, computed once in a scalar subquery and rounded to two places.",
      "",
      "The alternative counts `DISTINCT bill_id` (safe even if a SKU could repeat on a bill), looks the names up with scalar subqueries, and cross-joins a one-row total. The self join is the cost: a bill with k lines produces k(k−1)/2 pairs, fine for baskets of normal size.",
    ].join("\n"),
  },
];
