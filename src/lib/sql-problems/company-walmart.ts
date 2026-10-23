import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, chance, dateBetween, names, pick, ri, roundTo, sample, shuffle } from "./kit.js";

/**
 * Walmart: the questions a data analyst or data engineer at a big-box
 * retailer is handed — rollbacks and clearance markdowns, Walmart+ members
 * and their savings, online grocery pickup slots, shelf gaps and refills,
 * distribution-centre trailers and store deliveries, associates' shifts and
 * staffing, Sam's Club members, price-match claims, receiptless returns and
 * item-master clean-up. The schemas and every figure are invented for
 * practice; nothing here describes Walmart's real systems or numbers.
 * Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
const pad = (n: number) => String(n).padStart(2, "0");
/** 'YYYY-MM-DD HH:MM:00' from a date and minutes after its midnight (may run into later days). */
const at = (date: string, minutes: number): string => {
  const d = addDays(date, Math.floor(minutes / 1440));
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${d} ${pad(Math.floor(m / 60))}:${pad(m % 60)}:00`;
};
/** A price rounded to cents (binary floats otherwise carry noise like 3.4799999). */
const round2 = (x: number): number => Math.round(x * 100) / 100;

const ROLLBACK_ITEMS = [
  ["Whole Milk 1 gal", "Dairy"], ["50-inch 4K TV", "Electronics"], ["Ibuprofen 200 ct", "Pharmacy"],
  ["Bath Towel Set", "Home"], ["Camping Cooler 48 qt", "Outdoor"], ["Die-Cast Cars 20-pack", "Toys"],
  ["Sandwich Bread", "Bakery"], ["Paper Towels 12 roll", "Household"], ["Wireless Earbuds", "Electronics"],
  ["Kids' Sneakers", "Apparel"], ["Ground Coffee 30 oz", "Grocery"], ["Motor Oil 5 qt", "Automotive"],
] as const;
const GROCERY_DEPTS = ["Grocery", "Produce", "Dairy", "Bakery"] as const;
const GM_DEPTS = ["Electronics", "Apparel", "Home", "Toys", "Pharmacy", "Automotive"] as const;
const COMPETITORS = ["Northgate Grocers", "ValueKing", "FreshCo Market", "MegaSave", "Corner Dollar"] as const;
const STATES = ["AR", "TX", "SC", "OK", "NM", "MO", "GA"] as const;
const TOWNS = ["Bentonville", "Rogers", "Tulsa", "Austin", "Dallas", "Columbia", "Albuquerque", "Springfield", "Macon", "Norman"] as const;
const REGIONS = ["North", "South", "East", "West"] as const;
const PRODUCT_DESCS = ["Peanut Butter 40 oz", "Paper Plates 100 ct", "AA Batteries 24 pk", "Dish Soap 28 oz", "Ground Coffee 30 oz", "Trash Bags 45 ct"] as const;

export const COMPANY_WALMART: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "walmart-active-rollbacks-and-their-savings",
    title: "Walmart: Active Rollbacks and the Savings on Each",
    difficulty: "EASY",
    topics: ["Basics"],
    description: [
      "A store's pricing team at Walmart walks the aisles on **2025-03-15** to check that every rollback sign on the shelf matches the price file, and wants the list of rollbacks they should find.",
      "",
      "A rollback is **active** on that date when `start_date <= '2025-03-15' <= end_date` (both ends inclusive). The price file also holds a few bad rows where the rollback price is not actually lower than the was-price; leave those out. Return `rollback_id`, `item_name` and `savings` (the was-price minus the rollback price, rounded to 2 decimals), ordered by `savings` **descending**, then `rollback_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "RollbackPrice",
        columns: [
          { name: "rollback_id", type: "int" },
          { name: "item_name", type: "varchar" },
          { name: "department", type: "varchar" },
          { name: "was_price", type: "decimal" },
          { name: "rollback_price", type: "decimal" },
          { name: "start_date", type: "date" },
          { name: "end_date", type: "date" },
        ],
        primaryKey: ["rollback_id"],
        note: "One row per rollback in the price file. Prices are in dollars; `end_date` is the last day the rollback price applies.",
      },
    ],
    examples: [
      {
        RollbackPrice: [
          [1, "Whole Milk 1 gal", "Dairy", 3.98, 3.48, "2025-03-01", "2025-03-31"],
          [2, "50-inch 4K TV", "Electronics", 298.0, 248.0, "2025-03-10", "2025-03-15"],
          [3, "Ibuprofen 200 ct", "Pharmacy", 8.97, 8.97, "2025-03-01", "2025-03-20"],
          [4, "Bath Towel Set", "Home", 6.97, 4.97, "2025-03-16", "2025-04-15"],
          [5, "Camping Cooler 48 qt", "Outdoor", 49.97, 29.97, "2025-02-01", "2025-03-14"],
          [6, "Die-Cast Cars 20-pack", "Toys", 21.97, 19.97, "2025-03-15", "2025-03-29"],
          [7, "Sandwich Bread", "Bakery", 2.48, 1.98, "2025-03-05", "2025-03-25"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.06) ? 0 : ri(rng, 2, 14);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const [item, dept] = pick(rng, ROLLBACK_ITEMS);
        const was = round2(ri(rng, 1, 120) + pick(rng, [0.97, 0.48, 0.98, 0]));
        const cut = pick(rng, [0, 0.5, 0.5, 1, 2, 3, 5, 10, -1]);
        const rb = was - cut > 0.2 ? round2(was - cut) : was;
        const start = chance(rng, 0.2) ? pick(rng, ["2025-03-15", "2025-03-16"]) : dateBetween(rng, "2025-02-15", "2025-03-20");
        let end = chance(rng, 0.25) ? pick(rng, ["2025-03-15", "2025-03-14"]) : addDays(start, ri(rng, 0, 30));
        if (end < start) end = start;
        return [id, item, dept, was, rb, start, end];
      });
      return { RollbackPrice: rows };
    },
    solution: [
      "SELECT rollback_id, item_name, ROUND(was_price - rollback_price, 2) AS savings",
      "FROM RollbackPrice",
      "WHERE rollback_price < was_price",
      "  AND '2025-03-15' BETWEEN start_date AND end_date",
      "ORDER BY savings DESC, rollback_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT rollback_id, item_name, ROUND(was_price - rollback_price, 2) AS savings",
        "FROM RollbackPrice",
        "WHERE was_price - rollback_price > 0 AND start_date <= '2025-03-15' AND end_date >= '2025-03-15'",
        "ORDER BY ROUND(was_price - rollback_price, 2) DESC, rollback_id ASC",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Two separate conditions: the date falls inside the rollback, and the price really went down.",
      "`x BETWEEN a AND b` is inclusive at both ends, and the constant can sit on the left.",
      "Sort by the computed savings first and break ties with the id, so equal savings come out in a fixed order.",
    ],
    editorial: [
      "Everything the pricing team needs is on one row, so this is a filter, a computed column and a sort.",
      "",
      "A rollback is live on the audit day when the day lies between its start and end dates, both included — `'2025-03-15' BETWEEN start_date AND end_date` says exactly that, and it keeps a rollback that starts or ends on the 15th. The bad rows are the ones where `rollback_price` is equal to or above `was_price`; the strict comparison `rollback_price < was_price` drops both kinds.",
      "",
      "The savings is the difference of the two prices. Prices with cents are not always exact in binary floating point, so rounding the difference to two decimals both tidies the output and makes two equal savings compare equal in the sort. The order is fully specified — savings descending, then `rollback_id` — so the answer is the same however the rows are stored.",
      "",
      "The alternative writes the date test as two comparisons and the price test as a positive difference. Either way it is one scan of the table.",
    ].join("\n"),
  },

  {
    slug: "walmart-grocery-pickup-slots-nobody-booked",
    title: "Walmart: Grocery Pickup Slots Nobody Booked",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "The online grocery team at Walmart opens hourly pickup slots at each store and wants to see which slots went completely unused, so it can trim the slot calendar.",
      "",
      "Return every slot that has **no order other than cancelled ones** — a slot with no orders at all counts, and so does a slot whose only orders were cancelled. Return `slot_id`, `store_id`, `slot_date` and `start_hour`, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "PickupSlot",
        columns: [
          { name: "slot_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "slot_date", type: "date" },
          { name: "start_hour", type: "int" },
        ],
        primaryKey: ["slot_id"],
        note: "One row per one-hour pickup slot; `start_hour` is 0–23 in store time.",
      },
      {
        name: "PickupOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "slot_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "status", type: "enum", values: ["scheduled", "picked_up", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per online grocery order; `slot_id` is the slot the customer chose.",
      },
    ],
    examples: [
      {
        PickupSlot: [
          [1, 1204, "2025-04-12", 9],
          [2, 1204, "2025-04-12", 10],
          [3, 1204, "2025-04-12", 11],
          [4, 1204, "2025-04-12", 12],
          [5, 3318, "2025-04-12", 9],
          [6, 3318, "2025-04-12", 10],
        ],
        PickupOrder: [
          [501, 1, 71, "picked_up"],
          [502, 2, 72, "cancelled"],
          [503, 3, 73, "cancelled"],
          [504, 3, 74, "scheduled"],
          [505, 5, 75, "scheduled"],
          [506, 5, 76, "picked_up"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.06) ? 0 : ri(rng, 1, 10);
      const stores = [1204, 3318, 5260];
      const slots: Cell[][] = seq(1, n).map((id) => [id, pick(rng, stores), dateBetween(rng, "2025-04-11", "2025-04-13"), ri(rng, 8, 20)]);
      const m = n === 0 || chance(rng, 0.08) ? 0 : ri(rng, 1, 14);
      const orders: Cell[][] = seq(501, m).map((id) => [id, ri(rng, 1, n), ri(rng, 60, 90), pick(rng, ["scheduled", "picked_up", "cancelled", "cancelled"])]);
      return { PickupSlot: slots, PickupOrder: orders };
    },
    solution: [
      "SELECT s.slot_id, s.store_id, s.slot_date, s.start_hour",
      "FROM PickupSlot s",
      "WHERE NOT EXISTS (",
      "  SELECT 1 FROM PickupOrder o",
      "  WHERE o.slot_id = s.slot_id AND o.status <> 'cancelled'",
      ")",
    ].join("\n"),
    alternatives: [
      [
        "SELECT s.slot_id, s.store_id, s.slot_date, s.start_hour",
        "FROM PickupSlot s",
        "LEFT JOIN PickupOrder o ON o.slot_id = s.slot_id AND o.status <> 'cancelled'",
        "WHERE o.order_id IS NULL",
      ].join("\n"),
      "SELECT slot_id, store_id, slot_date, start_hour FROM PickupSlot WHERE slot_id NOT IN (SELECT slot_id FROM PickupOrder WHERE status IN ('scheduled', 'picked_up'))",
    ],
    hints: [
      "You want the slots for which a certain kind of order does **not** exist — an anti join.",
      "Cancelled orders should not count as using the slot, so filter them out inside the check, not after it.",
      "With a LEFT JOIN, put the status condition in the `ON` clause; in `WHERE` it would turn the join back into an inner join.",
    ],
    editorial: [
      "An unused slot is one for which no live order exists, which is the shape of an **anti join**: keep a slot when a matching row is absent.",
      "",
      "`NOT EXISTS` states it directly. For each slot the subquery looks for an order on that slot whose status is not `cancelled`; if it finds none, the slot is kept. That covers both cases the team cares about — a slot nobody chose, and a slot whose every order was cancelled — without any special handling.",
      "",
      "The LEFT JOIN version pairs each slot with its live orders and keeps the slots that found none (`o.order_id IS NULL`). The status test must be part of the join condition: placed in `WHERE` it would reject the NULL-extended rows and the query would return nothing useful. `NOT IN` works too because `slot_id` is never NULL in the orders; with a nullable column it would silently return no rows, which is why `NOT EXISTS` is the safer habit. With an index on `PickupOrder(slot_id)` each check is a short index probe.",
    ].join("\n"),
  },

  {
    slug: "walmart-plus-active-members-by-plan",
    title: "Walmart: Active Walmart+ Members on 30 June by Plan",
    difficulty: "EASY",
    topics: ["Aggregation", "Dates"],
    description: [
      "The Walmart+ membership team reports its member base at the end of each quarter, split by how members pay.",
      "",
      "A membership is **active on 2025-06-30** when it started on or before that day and either has no `end_date` yet or its `end_date` is on or after that day. For each billing plan with at least one active membership, return `plan` and `active_members`. Plans with no active membership do not appear. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "PlusMembership",
        columns: [
          { name: "member_id", type: "int" },
          { name: "plan", type: "enum", values: ["monthly", "annual"] },
          { name: "start_date", type: "date" },
          { name: "end_date", type: "date" },
        ],
        primaryKey: ["member_id"],
        note: "One row per membership. `end_date` is the last day of benefits, or NULL while the membership is still running.",
      },
    ],
    examples: [
      {
        PlusMembership: [
          [1, "annual", "2024-08-01", null],
          [2, "monthly", "2025-01-15", "2025-06-30"],
          [3, "monthly", "2025-03-01", "2025-06-29"],
          [4, "annual", "2025-06-30", null],
          [5, "monthly", "2025-07-01", null],
          [6, "monthly", "2025-05-10", null],
          [7, "annual", "2024-02-01", "2025-01-31"],
        ],
      },
      {
        PlusMembership: [
          [1, "monthly", "2025-04-01", null],
          [2, "annual", "2025-08-01", null],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.06) ? 0 : ri(rng, 1, 18);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const start = chance(rng, 0.2) ? pick(rng, ["2025-06-30", "2025-07-01"]) : dateBetween(rng, "2024-06-01", "2025-07-20");
        let end: string | null = chance(rng, 0.4) ? null : chance(rng, 0.3) ? pick(rng, ["2025-06-30", "2025-06-29", "2025-07-01"]) : addDays(start, ri(rng, 0, 300));
        if (end !== null && end < start) end = start;
        return [id, pick(rng, ["monthly", "monthly", "annual"]), start, end];
      });
      return { PlusMembership: rows };
    },
    solution: [
      "SELECT plan, COUNT(*) AS active_members",
      "FROM PlusMembership",
      "WHERE start_date <= '2025-06-30'",
      "  AND (end_date IS NULL OR end_date >= '2025-06-30')",
      "GROUP BY plan",
    ].join("\n"),
    alternatives: [
      "SELECT plan, COUNT(*) AS active_members FROM PlusMembership WHERE '2025-06-30' BETWEEN start_date AND COALESCE(end_date, '9999-12-31') GROUP BY plan",
      [
        "SELECT plan, SUM(CASE WHEN start_date <= '2025-06-30' AND (end_date IS NULL OR end_date >= '2025-06-30') THEN 1 ELSE 0 END) AS active_members",
        "FROM PlusMembership GROUP BY plan",
        "HAVING SUM(CASE WHEN start_date <= '2025-06-30' AND (end_date IS NULL OR end_date >= '2025-06-30') THEN 1 ELSE 0 END) > 0",
      ].join("\n"),
    ],
    hints: [
      "Decide first, row by row, whether a membership was active on the day; then count per plan.",
      "A NULL `end_date` means the membership is still running — a plain `end_date >= …` is not true for NULL.",
      "Filtering before grouping means a plan with no active member forms no group at all.",
    ],
    editorial: [
      "The count is per plan, but whether a row counts is a question about that row alone, so the work splits cleanly: filter, then group.",
      "",
      "A membership is active on the day when the day sits between its start and its end. The end is open while `end_date` is NULL, and a comparison with NULL is never true, so the condition must say so explicitly: `end_date IS NULL OR end_date >= '2025-06-30'`. The parentheses matter — without them `AND` binds first and every open-ended membership would count, even one that starts in July. Both boundaries are inclusive: a membership that started or ended on 30 June was active that day.",
      "",
      "Because the filter runs before `GROUP BY`, a plan whose memberships all fail it simply never forms a group, which is what the statement asks. The first alternative replaces the NULL with a far-future date using `COALESCE` and uses one `BETWEEN`; the second counts with a conditional `SUM` and removes empty plans with `HAVING`. All are a single scan.",
    ].join("\n"),
  },

  {
    slug: "walmart-grocery-vs-general-merchandise-sales-by-store",
    title: "Walmart: Grocery vs General Merchandise Sales per Store",
    difficulty: "EASY",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "Walmart's store operations team compares how much of each store's March business is food against everything else on the floor.",
      "",
      "Departments `Grocery`, `Produce`, `Dairy` and `Bakery` are **grocery**; every other department is **general merchandise**. Looking only at sales dated in **March 2025**, return one row per store that has at least one March row: `store_id`, `grocery_sales` and `general_merch_sales` (each the sum of `net_sales`, 0 when the store sold nothing in that group). Order the rows by `store_id`.",
    ].join("\n"),
    tables: [
      {
        name: "DeptDailySales",
        columns: [
          { name: "store_id", type: "int" },
          { name: "sale_date", type: "date" },
          { name: "department", type: "varchar" },
          { name: "net_sales", type: "int" },
        ],
        primaryKey: ["store_id", "sale_date", "department"],
        note: "One row per store, day and department: the day's net sales in dollars after returns.",
      },
    ],
    examples: [
      {
        DeptDailySales: [
          [100, "2025-03-01", "Grocery", 5200],
          [100, "2025-03-01", "Electronics", 3100],
          [100, "2025-03-31", "Produce", 1800],
          [100, "2025-04-01", "Grocery", 9900],
          [205, "2025-03-14", "Toys", 700],
          [205, "2025-03-15", "Apparel", 950],
          [318, "2025-02-28", "Dairy", 1200],
          [318, "2025-03-02", "Bakery", 400],
        ],
      },
    ],
    gen: (rng) => {
      const stores = sample(rng, [100, 205, 318, 427, 512], ri(rng, 1, 4));
      const seen = new Set<string>();
      const rows: Cell[][] = [];
      const n = chance(rng, 0.06) ? 0 : ri(rng, 1, 22);
      for (let i = 0; i < n; i++) {
        const s = pick(rng, stores);
        const d = chance(rng, 0.25) ? pick(rng, ["2025-02-28", "2025-03-01", "2025-03-31", "2025-04-01"]) : dateBetween(rng, "2025-02-20", "2025-04-05");
        const dept = chance(rng, 0.5) ? pick(rng, GROCERY_DEPTS) : pick(rng, GM_DEPTS);
        const k = `${s}|${d}|${dept}`;
        if (seen.has(k)) continue;
        seen.add(k);
        rows.push([s, d, dept, roundTo(rng, 100, 9000, 50)]);
      }
      return { DeptDailySales: rows };
    },
    solution: [
      "SELECT store_id,",
      "       SUM(CASE WHEN department IN ('Grocery', 'Produce', 'Dairy', 'Bakery') THEN net_sales ELSE 0 END) AS grocery_sales,",
      "       SUM(CASE WHEN department IN ('Grocery', 'Produce', 'Dairy', 'Bakery') THEN 0 ELSE net_sales END) AS general_merch_sales",
      "FROM DeptDailySales",
      "WHERE sale_date BETWEEN '2025-03-01' AND '2025-03-31'",
      "GROUP BY store_id",
      "ORDER BY store_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT store_id,",
        "       SUM(IF(department IN ('Grocery', 'Produce', 'Dairy', 'Bakery'), net_sales, 0)) AS grocery_sales,",
        "       SUM(net_sales) - SUM(IF(department IN ('Grocery', 'Produce', 'Dairy', 'Bakery'), net_sales, 0)) AS general_merch_sales",
        "FROM DeptDailySales",
        "WHERE YEAR(sale_date) = 2025 AND MONTH(sale_date) = 3",
        "GROUP BY store_id ORDER BY store_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "One row per store with two totals side by side is conditional aggregation: a `SUM` over a `CASE`.",
      "Each `CASE` adds the row's sales when it belongs to that group and 0 otherwise, so a missing group sums to 0, not NULL.",
      "Filter to March before grouping; the last day of the month is part of March.",
    ],
    editorial: [
      "The output pivots one column of the data — the department — into two totals per store. That is **conditional aggregation**: group by store, and inside each group add up `net_sales` twice, once counting only grocery rows and once counting only the rest.",
      "",
      "`SUM(CASE WHEN department IN (…) THEN net_sales ELSE 0 END)` adds a row's sales when it is a grocery department and 0 otherwise. Using `ELSE 0` rather than leaving the `ELSE` out matters: a store that sold no general merchandise in March would otherwise get NULL, and the statement asks for 0. General merchandise is just the complement — everything not in the list — so its `CASE` flips the branches.",
      "",
      "The date filter runs in `WHERE`, so February and April rows never reach a group; a store whose only rows are outside March forms no group and is left out, as asked. `BETWEEN '2025-03-01' AND '2025-03-31'` keeps both the first and the last day. The alternative uses `IF`, takes the general-merchandise figure as the total minus grocery, and filters with `YEAR`/`MONTH`. One scan either way.",
    ].join("\n"),
  },

  {
    slug: "walmart-associate-shifts-clocked-over-ten-hours",
    title: "Walmart: Associate Shifts Clocked Over Ten Hours",
    difficulty: "EASY",
    topics: ["Dates", "Basics"],
    description: [
      "A store's people lead at Walmart reviews long shifts every week, because a shift over ten hours needs a manager's sign-off.",
      "",
      "For every **completed** shift (one with a `clock_out`), work out the minutes between `clock_in` and `clock_out`. Return the shifts that ran **more than 600 minutes** — exactly ten hours is fine — with `shift_id`, `associate_id` and `minutes_worked`. Shifts can run past midnight. Order by `minutes_worked` descending, then `shift_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "TimeClockShift",
        columns: [
          { name: "shift_id", type: "int" },
          { name: "associate_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "clock_in", type: "datetime" },
          { name: "clock_out", type: "datetime" },
        ],
        primaryKey: ["shift_id"],
        note: "One row per shift punched at the time clock. `clock_out` is NULL while the associate is still on the clock.",
      },
    ],
    examples: [
      {
        TimeClockShift: [
          [1, 41, 1204, "2025-05-05 08:00:00", "2025-05-05 18:30:00"],
          [2, 42, 1204, "2025-05-05 22:00:00", "2025-05-06 08:30:00"],
          [3, 43, 1204, "2025-05-06 07:00:00", "2025-05-06 17:00:00"],
          [4, 41, 1204, "2025-05-07 06:00:00", null],
          [5, 44, 3318, "2025-05-06 06:00:00", "2025-05-06 12:00:00"],
          [6, 45, 3318, "2025-05-06 09:15:00", "2025-05-06 20:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.06) ? 0 : ri(rng, 1, 15);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const day = dateBetween(rng, "2025-05-05", "2025-05-11");
        const start = ri(rng, 20, 92) * 15;
        const dur = chance(rng, 0.5) ? pick(rng, [585, 600, 600, 615, 630, 660]) : ri(rng, 16, 52) * 15;
        return [id, ri(rng, 40, 48), pick(rng, [1204, 3318]), at(day, start), chance(rng, 0.15) ? null : at(day, start + dur)];
      });
      return { TimeClockShift: rows };
    },
    solution: [
      "SELECT shift_id, associate_id, TIMESTAMPDIFF(MINUTE, clock_in, clock_out) AS minutes_worked",
      "FROM TimeClockShift",
      "WHERE clock_out IS NOT NULL",
      "  AND TIMESTAMPDIFF(MINUTE, clock_in, clock_out) > 600",
      "ORDER BY minutes_worked DESC, shift_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT shift_id, associate_id, minutes_worked",
        "FROM (SELECT shift_id, associate_id, TIMESTAMPDIFF(SECOND, clock_in, clock_out) DIV 60 AS minutes_worked FROM TimeClockShift) t",
        "WHERE minutes_worked > 600",
        "ORDER BY minutes_worked DESC, shift_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`TIMESTAMPDIFF(MINUTE, start, end)` counts minutes between two datetimes, across midnight too.",
      "An open shift has no length yet; `TIMESTAMPDIFF` with a NULL argument is NULL, and NULL > 600 is not true.",
      "\"More than\" ten hours is strictly greater than 600 minutes.",
    ],
    editorial: [
      "The length of a shift is the distance between two full datetimes, so subtracting clock times alone would break for the overnight shift that starts at 22:00 and ends at 08:30 the next day. `TIMESTAMPDIFF(MINUTE, clock_in, clock_out)` compares the complete timestamps, so it handles crossing midnight without any special case.",
      "",
      "Open shifts have a NULL `clock_out`. The difference is then NULL and the comparison `> 600` is unknown, so the row is filtered out even without the explicit `clock_out IS NOT NULL`; spelling it out keeps the intent readable. The threshold is strict: a shift of exactly 600 minutes needs no sign-off.",
      "",
      "Sorting by the computed minutes and then by `shift_id` makes the order total, so two shifts of the same length always come out the same way. The alternative measures seconds and integer-divides by 60, filtering in an outer query on the alias. Both are a single pass over the table.",
    ].join("\n"),
  },

  {
    slug: "walmart-supercenters-per-state-from-store-codes",
    title: "Walmart: Supercenters per State From Store Codes",
    difficulty: "EASY",
    topics: ["Strings", "Aggregation"],
    description: [
      "Walmart's real-estate analytics team only has a store code for each location and wants a count of Supercenters by state.",
      "",
      "A `store_code` looks like `SC-AR-0100`: a two-letter **format** (`SC` Supercenter, `NM` Neighborhood Market, `DS` Discount Store), a hyphen, the two-letter **state**, a hyphen and a four-digit number. Count only stores whose **format** is `SC` — careful, `SC` is also a state. Return `state` and `supercenters` for each state with at least one Supercenter, ordered by `supercenters` descending, then `state` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "StoreLocation",
        columns: [
          { name: "store_code", type: "varchar" },
          { name: "city", type: "varchar" },
          { name: "opened_on", type: "date" },
        ],
        primaryKey: ["store_code"],
        note: "One row per store. Every code follows the pattern `XX-YY-NNNN` in upper case.",
      },
    ],
    examples: [
      {
        StoreLocation: [
          ["SC-AR-0100", "Bentonville", "1988-03-01"],
          ["SC-AR-0412", "Rogers", "1992-07-15"],
          ["NM-SC-0042", "Columbia", "2010-05-20"],
          ["SC-SC-0207", "Columbia", "1995-09-09"],
          ["DS-TX-0310", "Austin", "1985-01-30"],
          ["SC-TX-1188", "Dallas", "2001-11-02"],
          ["SC-TX-2231", "Austin", "2006-04-18"],
          ["NM-AR-5260", "Rogers", "2015-08-01"],
          ["SC-OK-0731", "Tulsa", "1999-06-12"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.06) ? 0 : ri(rng, 1, 16);
      const seen = new Set<string>();
      const rows: Cell[][] = [];
      for (let i = 0; i < n; i++) {
        const code = `${pick(rng, ["SC", "SC", "NM", "DS"])}-${pick(rng, STATES)}-${String(ri(rng, 1, 5999)).padStart(4, "0")}`;
        if (seen.has(code)) continue;
        seen.add(code);
        rows.push([code, pick(rng, TOWNS), dateBetween(rng, "1980-01-01", "2020-12-31")]);
      }
      return { StoreLocation: rows };
    },
    solution: [
      "SELECT SUBSTRING(store_code, 4, 2) AS state, COUNT(*) AS supercenters",
      "FROM StoreLocation",
      "WHERE LEFT(store_code, 2) = 'SC'",
      "GROUP BY state",
      "ORDER BY supercenters DESC, state",
    ].join("\n"),
    alternatives: [
      [
        "SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(store_code, '-', 2), '-', -1) AS state, COUNT(*) AS supercenters",
        "FROM StoreLocation",
        "WHERE store_code LIKE 'SC-%'",
        "GROUP BY SUBSTRING_INDEX(SUBSTRING_INDEX(store_code, '-', 2), '-', -1)",
        "ORDER BY COUNT(*) DESC, state ASC",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The format is the first two characters; the state is characters 4 and 5.",
      "`store_code LIKE '%SC%'` would also catch every Neighborhood Market in South Carolina — anchor the test to the start.",
      "Group by the extracted state and count.",
    ],
    editorial: [
      "The code packs two facts into fixed positions, so both can be read with plain string functions. `LEFT(store_code, 2)` is the format and `SUBSTRING(store_code, 4, 2)` is the state, since the format and its hyphen take the first three characters.",
      "",
      "The trap is the letters `SC`, which are a format and a state. A loose test such as `LIKE '%SC%'` would count `NM-SC-0042`, a Neighborhood Market in South Carolina, as a Supercenter. Testing the **first two characters** — or `LIKE 'SC-%'`, anchored at the start — counts only the format. Note that `SC-SC-0207` is a Supercenter in South Carolina and rightly counts once.",
      "",
      "After filtering, group by the extracted state and count. The order is total: count descending, then state alphabetically. The alternative reads the second hyphen-separated field with nested `SUBSTRING_INDEX`, which would still work if the formats ever grew to three letters. One scan of the table.",
    ].join("\n"),
  },

  {
    slug: "walmart-dc-trailers-dispatched-under-80-percent-full",
    title: "Walmart: DC Trailers Dispatched Under 80% Full",
    difficulty: "EASY",
    topics: ["Basics", "Dates"],
    description: [
      "The transportation team at a Walmart distribution centre tracks trailer fill, because a trailer that leaves light costs nearly as much to drive as a full one.",
      "",
      "For trailers dispatched in **April 2025**, return the loads whose `loaded_pallets` is **strictly below 80%** of `capacity_pallets`. Return `load_id`, `dc_id` and `empty_pallets` (capacity minus loaded), ordered by `empty_pallets` descending, then `load_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "TrailerLoad",
        columns: [
          { name: "load_id", type: "int" },
          { name: "dc_id", type: "int" },
          { name: "dispatch_date", type: "date" },
          { name: "capacity_pallets", type: "int" },
          { name: "loaded_pallets", type: "int" },
        ],
        primaryKey: ["load_id"],
        note: "One row per outbound trailer from a distribution centre. `loaded_pallets` never exceeds `capacity_pallets`.",
      },
    ],
    examples: [
      {
        TrailerLoad: [
          [9001, 6011, "2025-04-01", 26, 20],
          [9002, 6011, "2025-04-03", 26, 21],
          [9003, 6011, "2025-04-07", 30, 24],
          [9004, 6094, "2025-04-12", 30, 23],
          [9005, 6094, "2025-04-30", 30, 30],
          [9006, 6094, "2025-03-31", 26, 8],
          [9007, 6011, "2025-04-18", 26, 10],
          [9008, 6094, "2025-04-22", 53, 46],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.06) ? 0 : ri(rng, 1, 15);
      const rows: Cell[][] = seq(9001, n).map((id) => {
        const cap = pick(rng, [26, 30, 53]);
        const near = cap === 26 ? pick(rng, [20, 21]) : cap === 30 ? pick(rng, [23, 24, 25]) : pick(rng, [42, 43]);
        const loaded = chance(rng, 0.5) ? near : ri(rng, 4, cap);
        const day = chance(rng, 0.2) ? pick(rng, ["2025-03-31", "2025-04-01", "2025-04-30", "2025-05-01"]) : dateBetween(rng, "2025-03-25", "2025-05-05");
        return [id, pick(rng, [6011, 6094]), day, cap, loaded];
      });
      return { TrailerLoad: rows };
    },
    solution: [
      "SELECT load_id, dc_id, capacity_pallets - loaded_pallets AS empty_pallets",
      "FROM TrailerLoad",
      "WHERE dispatch_date BETWEEN '2025-04-01' AND '2025-04-30'",
      "  AND loaded_pallets * 100 < capacity_pallets * 80",
      "ORDER BY empty_pallets DESC, load_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT load_id, dc_id, capacity_pallets - loaded_pallets AS empty_pallets",
        "FROM TrailerLoad",
        "WHERE YEAR(dispatch_date) = 2025 AND MONTH(dispatch_date) = 4",
        "  AND loaded_pallets / capacity_pallets < 0.8",
        "ORDER BY capacity_pallets - loaded_pallets DESC, load_id ASC",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "80% of 26 pallets is 20.8 — compare without rounding anything.",
      "Multiplying both sides by 100 keeps the test in whole numbers: `loaded * 100 < capacity * 80`.",
      "A trailer loaded to exactly 80% is not under 80%.",
    ],
    editorial: [
      "Each trailer is judged on its own row, so the query is a filter plus a computed column. The fill test compares a count with a percentage of another count, and the cleanest way to do that is to keep it in integers: `loaded_pallets * 100 < capacity_pallets * 80` is the same inequality as `loaded / capacity < 0.8`, with no division and no rounding.",
      "",
      "The boundary is strict. A 30-pallet trailer with 24 pallets is exactly 80% full and stays off the list, while a 26-pallet trailer with 20 pallets (76.9%) is on it and one with 21 (80.8%) is not. Rounding the percentage first would blur exactly these cases.",
      "",
      "The month filter keeps 1 and 30 April and drops 31 March. The order — most empty slots first, then `load_id` — is total, so ties come out the same every time. The alternative divides (decimal division, so 24/30 is exactly 0.8) and reads the month with `YEAR`/`MONTH`. One scan either way.",
    ].join("\n"),
  },

  {
    slug: "walmart-sams-club-members-shopping-away-from-home",
    title: "Walmart: Sam's Club Members Who Shopped Away From Home",
    difficulty: "EASY",
    topics: ["Joins"],
    description: [
      "Sam's Club's membership analytics team wants to know which members also shop at clubs other than the one they signed up at, for a travelling-member campaign.",
      "",
      "Return each member with **at least one visit to a club other than their `home_club_id`**, as `member_id` and `member_name`. Each member appears once, however many such visits they made. Members with no visits, or only home-club visits, are left out. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "ClubMember",
        columns: [
          { name: "member_id", type: "int" },
          { name: "member_name", type: "varchar" },
          { name: "home_club_id", type: "int" },
        ],
        primaryKey: ["member_id"],
        note: "One row per Sam's Club member; `home_club_id` is the club where the membership was bought.",
      },
      {
        name: "ClubVisit",
        columns: [
          { name: "visit_id", type: "int" },
          { name: "member_id", type: "int" },
          { name: "club_id", type: "int" },
          { name: "visit_date", type: "date" },
          { name: "spend", type: "decimal" },
        ],
        primaryKey: ["visit_id"],
        note: "One row per checkout at a club, scanned with the member's card.",
      },
    ],
    examples: [
      {
        ClubMember: [
          [1, "Maria", 8101],
          [2, "David", 8101],
          [3, "Priya", 8240],
          [4, "John", 8240],
          [5, "Emma", 8355],
        ],
        ClubVisit: [
          [10, 1, 8101, "2025-02-01", 182.4],
          [11, 1, 8101, "2025-02-15", 96.1],
          [12, 2, 8240, "2025-02-03", 240.0],
          [13, 2, 8355, "2025-02-20", 75.5],
          [14, 2, 8240, "2025-03-01", 130.25],
          [15, 3, 8240, "2025-02-07", 61.0],
          [16, 4, 8101, "2025-02-09", 410.9],
        ],
      },
    ],
    gen: (rng) => {
      const clubs = [8101, 8240, 8355, 8417];
      const n = chance(rng, 0.06) ? 0 : ri(rng, 1, 10);
      const who = names(rng, n);
      const members: Cell[][] = seq(1, n).map((id, i) => [id, who[i]!, pick(rng, clubs)]);
      const m = n === 0 ? 0 : ri(rng, 0, 18);
      const visits: Cell[][] = seq(10, m).map((id) => {
        const mem = members[ri(rng, 0, n - 1)]!;
        const club = chance(rng, 0.6) ? (mem[2] as number) : pick(rng, clubs);
        return [id, mem[0]!, club, dateBetween(rng, "2025-02-01", "2025-03-31"), round2(ri(rng, 2000, 50000) / 100)];
      });
      return { ClubMember: members, ClubVisit: visits };
    },
    solution: [
      "SELECT DISTINCT m.member_id, m.member_name",
      "FROM ClubMember m",
      "JOIN ClubVisit v ON v.member_id = m.member_id",
      "WHERE v.club_id <> m.home_club_id",
    ].join("\n"),
    alternatives: [
      "SELECT m.member_id, m.member_name FROM ClubMember m WHERE EXISTS (SELECT 1 FROM ClubVisit v WHERE v.member_id = m.member_id AND v.club_id <> m.home_club_id)",
      [
        "SELECT m.member_id, m.member_name",
        "FROM ClubMember m",
        "JOIN ClubVisit v ON v.member_id = m.member_id",
        "GROUP BY m.member_id, m.member_name",
        "HAVING SUM(v.club_id <> m.home_club_id) > 0",
      ].join("\n"),
    ],
    hints: [
      "Pair each visit with the member who made it, then compare the visit's club with the member's home club.",
      "A member with three away visits would appear three times after the join — remove the repeats.",
      "`EXISTS` asks the yes/no question directly and never produces duplicates.",
    ],
    editorial: [
      "The question is a yes/no one per member: does at least one away visit exist? That is a **semi join**.",
      "",
      "Joining members to their visits puts the home club and the visited club on the same row, and `v.club_id <> m.home_club_id` keeps the away visits. A member with several away visits produces several rows, so `DISTINCT` collapses them to one. Members with no visits never join, and members whose visits were all at home lose every row in the filter — both drop out without extra work.",
      "",
      "`EXISTS` expresses the same idea without creating duplicates in the first place: for each member it stops at the first away visit it finds. The third version groups each member's visits and keeps those where the count of away visits is positive. All three read each visit once; an index on `ClubVisit(member_id)` makes the `EXISTS` probe cheap.",
    ].join("\n"),
  },
  // ──────────────────────────── MEDIUM ────────────────────────────
  {
    slug: "walmart-price-match-approval-rate-by-competitor",
    title: "Walmart: Price Match Approval Rate by Competitor",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "Walmart's pricing analysts look at price-match claims by competitor: a competitor whose advertised prices are often approved for a match is one whose prices the stores are not keeping up with.",
      "",
      "A claim is **decided** when its status is `approved` or `denied`; `pending` claims are ignored entirely. For every competitor with **at least 3 decided claims**, return `competitor`, `decided_claims` and `approval_pct` — the approved share of its decided claims as a percentage, rounded to 2 decimals. Order by `approval_pct` descending, then `competitor` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "PriceMatchClaim",
        columns: [
          { name: "claim_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "competitor", type: "varchar" },
          { name: "claim_date", type: "date" },
          { name: "status", type: "enum", values: ["approved", "denied", "pending"] },
        ],
        primaryKey: ["claim_id"],
        note: "One row per price-match request raised at a register; `competitor` is the rival whose advertised price the customer showed.",
      },
    ],
    examples: [
      {
        PriceMatchClaim: [
          [1, 1204, "Northgate Grocers", "2025-05-02", "approved"],
          [2, 1204, "Northgate Grocers", "2025-05-03", "denied"],
          [3, 3318, "Northgate Grocers", "2025-05-03", "approved"],
          [4, 3318, "Northgate Grocers", "2025-05-04", "pending"],
          [5, 1204, "ValueKing", "2025-05-02", "approved"],
          [6, 1204, "ValueKing", "2025-05-05", "approved"],
          [7, 3318, "ValueKing", "2025-05-06", "denied"],
          [8, 1204, "MegaSave", "2025-05-02", "approved"],
          [9, 1204, "MegaSave", "2025-05-03", "approved"],
          [10, 3318, "MegaSave", "2025-05-08", "pending"],
          [11, 3318, "FreshCo Market", "2025-05-09", "denied"],
          [12, 3318, "FreshCo Market", "2025-05-09", "denied"],
          [13, 1204, "FreshCo Market", "2025-05-10", "denied"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.06) ? 0 : ri(rng, 1, 30);
      const rivals = sample(rng, COMPETITORS, ri(rng, 1, 4));
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        pick(rng, [1204, 3318, 5260]),
        pick(rng, rivals),
        dateBetween(rng, "2025-05-01", "2025-05-31"),
        pick(rng, ["approved", "approved", "denied", "pending"]),
      ]);
      return { PriceMatchClaim: rows };
    },
    solution: [
      "SELECT competitor,",
      "       COUNT(*) AS decided_claims,",
      "       ROUND(100 * SUM(status = 'approved') / COUNT(*), 2) AS approval_pct",
      "FROM PriceMatchClaim",
      "WHERE status IN ('approved', 'denied')",
      "GROUP BY competitor",
      "HAVING COUNT(*) >= 3",
      "ORDER BY approval_pct DESC, competitor",
    ].join("\n"),
    alternatives: [
      [
        "SELECT competitor,",
        "       SUM(CASE WHEN status <> 'pending' THEN 1 ELSE 0 END) AS decided_claims,",
        "       ROUND(100 * SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) / SUM(CASE WHEN status <> 'pending' THEN 1 ELSE 0 END), 2) AS approval_pct",
        "FROM PriceMatchClaim",
        "GROUP BY competitor",
        "HAVING SUM(CASE WHEN status <> 'pending' THEN 1 ELSE 0 END) >= 3",
        "ORDER BY approval_pct DESC, competitor",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Pending claims are neither in the numerator nor in the denominator — filter them out first.",
      "The approved count is a conditional count: `SUM` of a condition that is 1 when true.",
      "The \"at least 3\" test is on a group, so it belongs in `HAVING`.",
    ],
    editorial: [
      "The rate is approved ÷ decided, so the first decision is what the denominator holds. Pending claims have no outcome yet; counting them would drag every competitor's rate down by however many claims happen to be in the queue. Filtering them in `WHERE` leaves only decided claims, and then `COUNT(*)` per competitor *is* the denominator.",
      "",
      "The numerator is a conditional count. In MySQL a comparison is 1 or 0, so `SUM(status = 'approved')` counts approvals; `SUM(CASE WHEN … THEN 1 ELSE 0 END)` is the portable spelling. Multiply by 100 before dividing so the percentage keeps its decimals, then round to two places.",
      "",
      "The minimum of three decided claims is a condition on the group, so it goes in `HAVING` — a competitor with two decisions and five pending claims is still out. Ordering by the rounded percentage and then the name is total. The alternative keeps the pending rows and counts decided ones with a `CASE` instead, which shows why filtering first is simpler. A single grouped scan.",
    ].join("\n"),
  },

  {
    slug: "walmart-shelf-gaps-still-open-at-afternoon-walk",
    title: "Walmart: Shelf Gaps Still Open at the Afternoon Walk",
    difficulty: "MEDIUM",
    topics: ["Joins"],
    description: [
      "Associates at Walmart stores scan the shelves on a morning walk and again on an afternoon walk. The replenishment team wants every item that was missing from the shelf in the morning and **still missing in the afternoon** of the same day — a gap the back room did not fill.",
      "",
      "Return `store_id`, `item_id` and `walk_date` for each store, item and day where the `morning` scan has `on_shelf = 0` **and** the `afternoon` scan of the same store, item and day also has `on_shelf = 0`. If either walk has no scan for that item that day, it is not reported. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "ShelfWalk",
        columns: [
          { name: "walk_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "item_id", type: "int" },
          { name: "walk_date", type: "date" },
          { name: "walk", type: "enum", values: ["morning", "afternoon"] },
          { name: "on_shelf", type: "bool" },
        ],
        primaryKey: ["walk_id"],
        note: "One row per item scanned on a walk; there is at most one scan per store, item, day and walk. `on_shelf` is 1 when the item was on the shelf.",
      },
    ],
    examples: [
      {
        ShelfWalk: [
          [1, 1204, 501, "2025-06-02", "morning", 0],
          [2, 1204, 501, "2025-06-02", "afternoon", 0],
          [3, 1204, 502, "2025-06-02", "morning", 0],
          [4, 1204, 502, "2025-06-02", "afternoon", 1],
          [5, 1204, 503, "2025-06-02", "morning", 1],
          [6, 1204, 503, "2025-06-02", "afternoon", 0],
          [7, 1204, 504, "2025-06-02", "morning", 0],
          [8, 3318, 501, "2025-06-02", "morning", 0],
          [9, 3318, 501, "2025-06-03", "afternoon", 0],
          [10, 3318, 501, "2025-06-03", "morning", 0],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const combos = chance(rng, 0.06) ? 0 : ri(rng, 1, 12);
      const seen = new Set<string>();
      let id = 1;
      for (let i = 0; i < combos; i++) {
        const store = pick(rng, [1204, 3318]);
        const item = ri(rng, 501, 506);
        const day = pick(rng, ["2025-06-02", "2025-06-03"]);
        const k = `${store}|${item}|${day}`;
        if (seen.has(k)) continue;
        seen.add(k);
        if (chance(rng, 0.9)) rows.push([id++, store, item, day, "morning", chance(rng, 0.6) ? 0 : 1]);
        if (chance(rng, 0.75)) rows.push([id++, store, item, day, "afternoon", chance(rng, 0.6) ? 0 : 1]);
      }
      return { ShelfWalk: shuffle(rng, rows) };
    },
    solution: [
      "SELECT m.store_id, m.item_id, m.walk_date",
      "FROM ShelfWalk m",
      "JOIN ShelfWalk a",
      "  ON a.store_id = m.store_id AND a.item_id = m.item_id",
      " AND a.walk_date = m.walk_date AND a.walk = 'afternoon'",
      "WHERE m.walk = 'morning' AND m.on_shelf = 0 AND a.on_shelf = 0",
    ].join("\n"),
    alternatives: [
      [
        "SELECT store_id, item_id, walk_date",
        "FROM ShelfWalk",
        "GROUP BY store_id, item_id, walk_date",
        "HAVING SUM(walk = 'morning' AND on_shelf = 0) = 1 AND SUM(walk = 'afternoon' AND on_shelf = 0) = 1",
      ].join("\n"),
      [
        "SELECT m.store_id, m.item_id, m.walk_date FROM ShelfWalk m",
        "WHERE m.walk = 'morning' AND m.on_shelf = 0",
        "  AND EXISTS (SELECT 1 FROM ShelfWalk a WHERE a.store_id = m.store_id AND a.item_id = m.item_id",
        "              AND a.walk_date = m.walk_date AND a.walk = 'afternoon' AND a.on_shelf = 0)",
      ].join("\n"),
    ],
    hints: [
      "The two scans you need to compare are two rows of the same table.",
      "Join the table to itself: one copy is the morning scan, the other the afternoon scan of the same store, item and day.",
      "An inner join drops the days where one of the walks has no scan, which is what the statement wants.",
    ],
    editorial: [
      "Each fact the question needs — the morning result and the afternoon result — lives on a different row, so the rows must be lined up side by side. A **self join** does that: alias `m` reads only morning scans, alias `a` only afternoon scans, and the join matches them on store, item and date. With at most one scan per walk, each morning row meets at most one afternoon row, so there are no duplicates.",
      "",
      "Once paired, the condition is simply that both say `on_shelf = 0`. A morning gap that was filled by the afternoon, an item that went missing only in the afternoon, and a day where one walk never scanned the item all fall away — the last because the inner join finds no partner.",
      "",
      "The grouped alternative collapses each store-item-day into one group and counts the two kinds of empty scan with conditional sums; it never compares rows directly. The `EXISTS` version keeps morning gaps that have a matching empty afternoon scan. With an index on `(store_id, item_id, walk_date)` all three are a single pass plus cheap lookups.",
    ].join("\n"),
  },

  {
    slug: "walmart-clearance-items-marked-down-three-times-unsold",
    title: "Walmart: Clearance Items Marked Down Three Times With No Sale",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation"],
    description: [
      "When clearance stock does not move, a Walmart merchandising analyst flags it for a final markdown or a return to vendor. The flag is: **three or more markdowns** and **no sale on or after the first markdown**.",
      "",
      "For each item meeting both conditions, return `item_id`, `markdowns` (how many markdowns it had) and `last_price` (the `new_price` of its most recent markdown). Sales before the first markdown do not matter. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Markdown",
        columns: [
          { name: "markdown_id", type: "int" },
          { name: "item_id", type: "int" },
          { name: "markdown_date", type: "date" },
          { name: "new_price", type: "decimal" },
        ],
        primaryKey: ["markdown_id"],
        note: "One row per price cut on a clearance item. An item never has two markdowns on the same date.",
      },
      {
        name: "ClearanceSale",
        columns: [
          { name: "sale_id", type: "int" },
          { name: "item_id", type: "int" },
          { name: "sale_date", type: "date" },
          { name: "units", type: "int" },
        ],
        primaryKey: ["sale_id"],
        note: "One row per register line for the item.",
      },
    ],
    examples: [
      {
        Markdown: [
          [1, 701, "2025-01-05", 19.0],
          [2, 701, "2025-01-19", 14.0],
          [3, 701, "2025-02-02", 9.0],
          [4, 702, "2025-01-05", 40.0],
          [5, 702, "2025-01-20", 30.0],
          [6, 702, "2025-02-04", 22.0],
          [7, 702, "2025-02-18", 15.0],
          [8, 703, "2025-01-10", 12.0],
          [9, 703, "2025-01-24", 8.0],
          [10, 703, "2025-02-07", 5.0],
          [11, 704, "2025-01-12", 6.0],
          [12, 704, "2025-01-26", 4.0],
        ],
        ClearanceSale: [
          [100, 701, "2025-01-02", 3],
          [101, 703, "2025-01-10", 1],
          [102, 704, "2025-03-01", 2],
        ],
      },
    ],
    gen: (rng) => {
      const items = sample(rng, [701, 702, 703, 704, 705, 706], ri(rng, 1, 6));
      const md: Cell[][] = [];
      const firsts = new Map<number, string>();
      for (const it of items) {
        const k = pick(rng, [2, 3, 3, 4, 4]);
        let d = dateBetween(rng, "2025-01-01", "2025-01-20");
        let price = ri(rng, 20, 60);
        for (let j = 0; j < k; j++) {
          if (j === 0) firsts.set(it, d);
          md.push([0, it, d, price]);
          d = addDays(d, ri(rng, 7, 15));
          price = Math.max(1, price - ri(rng, 2, 8));
        }
      }
      shuffle(rng, md).forEach((r, i) => (r[0] = i + 1));
      const sales: Cell[][] = [];
      const m = items.length === 0 ? 0 : ri(rng, 0, 5);
      for (let i = 0; i < m; i++) {
        const it = pick(rng, items);
        const f = firsts.get(it);
        const d = !f || chance(rng, 0.5) ? dateBetween(rng, "2024-12-10", "2024-12-31") : pick(rng, [addDays(f, -1), f, addDays(f, 20)]);
        sales.push([100 + i, it, d, ri(rng, 1, 4)]);
      }
      return { Markdown: md, ClearanceSale: sales };
    },
    solution: [
      "WITH md AS (",
      "  SELECT item_id, COUNT(*) AS markdowns, MIN(markdown_date) AS first_md, MAX(markdown_date) AS last_md",
      "  FROM Markdown",
      "  GROUP BY item_id",
      "  HAVING COUNT(*) >= 3",
      ")",
      "SELECT md.item_id, md.markdowns, m.new_price AS last_price",
      "FROM md",
      "JOIN Markdown m ON m.item_id = md.item_id AND m.markdown_date = md.last_md",
      "WHERE NOT EXISTS (",
      "  SELECT 1 FROM ClearanceSale s",
      "  WHERE s.item_id = md.item_id AND s.sale_date >= md.first_md",
      ")",
    ].join("\n"),
    alternatives: [
      [
        "WITH r AS (",
        "  SELECT item_id, new_price,",
        "         ROW_NUMBER() OVER (PARTITION BY item_id ORDER BY markdown_date DESC) AS rn,",
        "         COUNT(*) OVER (PARTITION BY item_id) AS markdowns,",
        "         MIN(markdown_date) OVER (PARTITION BY item_id) AS first_md",
        "  FROM Markdown",
        ")",
        "SELECT r.item_id, r.markdowns, r.new_price AS last_price",
        "FROM r",
        "LEFT JOIN ClearanceSale s ON s.item_id = r.item_id AND s.sale_date >= r.first_md",
        "WHERE r.rn = 1 AND r.markdowns >= 3 AND s.sale_id IS NULL",
      ].join("\n"),
    ],
    hints: [
      "Start with one row per item: how many markdowns, and the dates of the first and the last.",
      "The last price is on the markdown row whose date is the item's latest — join back to fetch it.",
      "\"No sale since the first markdown\" is an anti join with a date condition.",
    ],
    editorial: [
      "Three facts about each item are needed: its markdown count, the date of its first markdown (to test sales against) and the price of its last markdown. The count and both dates come from one `GROUP BY item_id`, with `HAVING COUNT(*) >= 3` keeping only items cut at least three times.",
      "",
      "The last price cannot be taken with an aggregate — `MIN(new_price)` would usually match, but nothing guarantees a later markdown is cheaper — so the query joins back to `Markdown` on the item and its latest date. Because an item has at most one markdown per date, that join finds exactly one row.",
      "",
      "The sales condition is an **anti join**: keep the item when no sale exists dated on or after `first_md`. A sale before clearance began does not save the item, and a sale on the very day of the first markdown does, since \"on or after\" includes it.",
      "",
      "The alternative does it in one pass with window functions — `ROW_NUMBER` descending marks the latest markdown, `COUNT` and `MIN` over the item supply the rest — and expresses the anti join as a LEFT JOIN that found nothing.",
    ].join("\n"),
  },

  {
    slug: "walmart-substitutions-made-against-the-customers-wishes",
    title: "Walmart: Substitutions Made Against the Customer's Wishes",
    difficulty: "MEDIUM",
    topics: ["Joins", "Conditional Logic", "Aggregation"],
    description: [
      "When an item in an online grocery order is out of stock, a Walmart personal shopper may pick a substitute — but customers can say no. The online grocery quality team wants to coach the pickers who substitute when the customer asked them not to.",
      "",
      "Each customer has a default setting (`allow_subs`), and may override it for particular items in `SubPreference`. For an order line, the **item-level preference wins when one exists**; otherwise the customer's default applies. A line with outcome `substituted` is **unwanted** when that setting is 0. For each picker with at least one unwanted substitution, return `picker_id`, `unwanted_subs` (such lines) and `orders_affected` (distinct orders containing one). Order by `unwanted_subs` descending, then `picker_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "PickupCustomer",
        columns: [
          { name: "customer_id", type: "int" },
          { name: "allow_subs", type: "bool" },
        ],
        primaryKey: ["customer_id"],
        note: "One row per online grocery customer; `allow_subs` is 1 when substitutions are allowed by default.",
      },
      {
        name: "SubPreference",
        columns: [
          { name: "customer_id", type: "int" },
          { name: "item_id", type: "int" },
          { name: "allow_sub", type: "bool" },
        ],
        primaryKey: ["customer_id", "item_id"],
        note: "A customer's override for one item: 1 allows a substitute for it, 0 forbids one.",
      },
      {
        name: "GroceryOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "picker_id", type: "int" },
        ],
        primaryKey: ["order_id"],
        note: "One row per online grocery order and the associate who picked it.",
      },
      {
        name: "OrderLine",
        columns: [
          { name: "order_id", type: "int" },
          { name: "line_no", type: "int" },
          { name: "item_id", type: "int" },
          { name: "outcome", type: "enum", values: ["picked", "substituted", "out_of_stock"] },
        ],
        primaryKey: ["order_id", "line_no"],
        note: "One row per item the customer ordered and what the picker did with it.",
      },
    ],
    examples: [
      {
        PickupCustomer: [
          [71, 1],
          [72, 0],
          [73, 1],
        ],
        SubPreference: [
          [71, 9001, 0],
          [72, 9002, 1],
        ],
        GroceryOrder: [
          [1001, 71, 41],
          [1002, 72, 41],
          [1003, 73, 42],
          [1004, 72, 42],
          [1005, 73, 43],
        ],
        OrderLine: [
          [1001, 1, 9001, "substituted"],
          [1001, 2, 9002, "substituted"],
          [1002, 1, 9002, "substituted"],
          [1002, 2, 9003, "substituted"],
          [1002, 3, 9004, "out_of_stock"],
          [1003, 1, 9001, "substituted"],
          [1004, 1, 9005, "substituted"],
          [1004, 2, 9006, "substituted"],
          [1004, 3, 9007, "picked"],
          [1005, 1, 9003, "picked"],
        ],
      },
    ],
    gen: (rng) => {
      const custIds = sample(rng, [71, 72, 73, 74, 75], ri(rng, 1, 5));
      const customers: Cell[][] = custIds.map((c) => [c, chance(rng, 0.5) ? 1 : 0]);
      const items = [9001, 9002, 9003, 9004, 9005, 9006];
      const prefs: Cell[][] = [];
      for (const c of custIds) for (const it of sample(rng, items, ri(rng, 0, 2))) prefs.push([c, it, chance(rng, 0.5) ? 1 : 0]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 7);
      const orders: Cell[][] = seq(1001, n).map((id) => [id, pick(rng, custIds), pick(rng, [41, 42, 43])]);
      const lines: Cell[][] = [];
      for (const o of orders) {
        sample(rng, items, ri(rng, 1, 4)).forEach((it, i) =>
          lines.push([o[0]!, i + 1, it, pick(rng, ["substituted", "substituted", "picked", "out_of_stock"])]),
        );
      }
      return { PickupCustomer: customers, SubPreference: prefs, GroceryOrder: orders, OrderLine: lines };
    },
    solution: [
      "SELECT o.picker_id,",
      "       COUNT(*) AS unwanted_subs,",
      "       COUNT(DISTINCT o.order_id) AS orders_affected",
      "FROM OrderLine l",
      "JOIN GroceryOrder o ON o.order_id = l.order_id",
      "JOIN PickupCustomer c ON c.customer_id = o.customer_id",
      "LEFT JOIN SubPreference p ON p.customer_id = o.customer_id AND p.item_id = l.item_id",
      "WHERE l.outcome = 'substituted'",
      "  AND COALESCE(p.allow_sub, c.allow_subs) = 0",
      "GROUP BY o.picker_id",
      "ORDER BY unwanted_subs DESC, o.picker_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT picker_id, COUNT(*) AS unwanted_subs, COUNT(DISTINCT order_id) AS orders_affected",
        "FROM (",
        "  SELECT o.picker_id, o.order_id",
        "  FROM OrderLine l",
        "  JOIN GroceryOrder o ON o.order_id = l.order_id",
        "  JOIN SubPreference p ON p.customer_id = o.customer_id AND p.item_id = l.item_id",
        "  WHERE l.outcome = 'substituted' AND p.allow_sub = 0",
        "  UNION ALL",
        "  SELECT o.picker_id, o.order_id",
        "  FROM OrderLine l",
        "  JOIN GroceryOrder o ON o.order_id = l.order_id",
        "  JOIN PickupCustomer c ON c.customer_id = o.customer_id",
        "  WHERE l.outcome = 'substituted' AND c.allow_subs = 0",
        "    AND NOT EXISTS (SELECT 1 FROM SubPreference p WHERE p.customer_id = o.customer_id AND p.item_id = l.item_id)",
        ") u",
        "GROUP BY picker_id",
        "ORDER BY unwanted_subs DESC, picker_id",
      ].join("\n"),
      [
        "SELECT o.picker_id, COUNT(*) AS unwanted_subs, COUNT(DISTINCT o.order_id) AS orders_affected",
        "FROM OrderLine l",
        "JOIN GroceryOrder o ON o.order_id = l.order_id",
        "JOIN PickupCustomer c ON c.customer_id = o.customer_id",
        "LEFT JOIN SubPreference p ON p.customer_id = o.customer_id AND p.item_id = l.item_id",
        "WHERE l.outcome = 'substituted'",
        "  AND (CASE WHEN p.customer_id IS NOT NULL THEN p.allow_sub ELSE c.allow_subs END) = 0",
        "GROUP BY o.picker_id",
        "ORDER BY COUNT(*) DESC, o.picker_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Bring together each substituted line, its order (for the picker and customer), the customer's default, and any item-level override.",
      "The override may not exist — that join has to be a LEFT JOIN.",
      "The effective setting is the override when there is one, else the default: `COALESCE(override, default)`.",
      "Count lines with `COUNT(*)` and orders with `COUNT(DISTINCT order_id)`.",
    ],
    editorial: [
      "The heart of the problem is a **precedence rule** between two settings stored in different tables: an item-level override, when the customer set one, beats their account default. Joining each substituted line to its order gives the picker and the customer; joining the customer gives the default; and a **LEFT JOIN** to `SubPreference` on customer and item gives the override or NULL. An inner join there would silently drop every line without an override — most of them.",
      "",
      "`COALESCE(p.allow_sub, c.allow_subs)` then reads as the rule itself: the override if present, otherwise the default. Because `allow_sub` is never NULL in a stored override, a NULL can only mean \"no override\", so the coalesce is exact. A line is unwanted when the effective setting is 0. Note the two directions: an override of 1 makes a substitution fine for a customer whose default is 0, and an override of 0 makes it unwanted for a customer who otherwise allows them.",
      "",
      "Grouping by picker counts the lines and, with `COUNT(DISTINCT order_id)`, the orders they touched; pickers with no unwanted substitution never form a group. The first alternative splits the rule into its two cases — a forbidding override, or no override and a forbidding default (`NOT EXISTS`) — and adds them with `UNION ALL`; the second spells the precedence with `CASE`. Each is a handful of key lookups per order line.",
    ].join("\n"),
  },

  {
    slug: "walmart-pickup-slot-fill-rate-by-hour",
    title: "Walmart: Pickup Slot Fill Rate by Hour of Day",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Subqueries"],
    description: [
      "The online grocery planning team at Walmart sizes pickup capacity by hour of day: hours that fill up need more associates picking, hours that sit empty can lose windows.",
      "",
      "For every `start_hour` that has at least one pickup window, return `start_hour`, `capacity` (the total capacity of the windows at that hour), `booked` (the number of their bookings with status `booked`; cancelled ones do not count) and `fill_pct` (`booked` as a percentage of `capacity`, rounded to 2 decimals). Hours with windows but no bookings show `booked` 0. Order by `start_hour`.",
    ].join("\n"),
    tables: [
      {
        name: "PickupWindow",
        columns: [
          { name: "window_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "window_date", type: "date" },
          { name: "start_hour", type: "int" },
          { name: "capacity", type: "int" },
        ],
        primaryKey: ["window_id"],
        note: "One row per pickup window a store offered; `capacity` is how many orders it can hand over.",
      },
      {
        name: "PickupBooking",
        columns: [
          { name: "booking_id", type: "int" },
          { name: "window_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "status", type: "enum", values: ["booked", "cancelled"] },
        ],
        primaryKey: ["booking_id"],
        note: "One row per customer booking of a window.",
      },
    ],
    examples: [
      {
        PickupWindow: [
          [1, 1204, "2025-04-12", 9, 4],
          [2, 3318, "2025-04-12", 9, 2],
          [3, 1204, "2025-04-12", 12, 5],
          [4, 1204, "2025-04-13", 12, 3],
          [5, 3318, "2025-04-12", 17, 6],
        ],
        PickupBooking: [
          [100, 1, 71, "booked"],
          [101, 1, 72, "booked"],
          [102, 1, 73, "cancelled"],
          [103, 2, 74, "booked"],
          [104, 3, 75, "booked"],
          [105, 5, 76, "cancelled"],
          [106, 2, 77, "booked"],
        ],
      },
    ],
    gen: (rng) => {
      const hours = [8, 10, 12, 14, 17];
      const perHour = new Map<number, number>();
      const windows: Cell[][] = [];
      const n = chance(rng, 0.06) ? 0 : ri(rng, 1, 7);
      for (let i = 0; i < n; i++) {
        const h = pick(rng, hours);
        // At most five windows of at most six slots an hour keeps every hour's capacity ≤ 30,
        // so no percentage rounded to 2 decimals can land exactly on a 5 (that needs a factor 32).
        if ((perHour.get(h) ?? 0) >= 5) continue;
        perHour.set(h, (perHour.get(h) ?? 0) + 1);
        windows.push([windows.length + 1, pick(rng, [1204, 3318]), pick(rng, ["2025-04-12", "2025-04-13"]), h, ri(rng, 1, 6)]);
      }
      const bookings: Cell[][] = [];
      for (const w of windows) {
        const k = ri(rng, 0, Math.min(4, w[4] as number));
        for (let j = 0; j < k; j++) bookings.push([100 + bookings.length, w[0]!, ri(rng, 60, 99), chance(rng, 0.75) ? "booked" : "cancelled"]);
      }
      return { PickupWindow: windows, PickupBooking: shuffle(rng, bookings) };
    },
    solution: [
      "WITH cap AS (",
      "  SELECT start_hour, SUM(capacity) AS capacity",
      "  FROM PickupWindow",
      "  GROUP BY start_hour",
      "), bk AS (",
      "  SELECT w.start_hour, COUNT(*) AS booked",
      "  FROM PickupBooking b",
      "  JOIN PickupWindow w ON w.window_id = b.window_id",
      "  WHERE b.status = 'booked'",
      "  GROUP BY w.start_hour",
      ")",
      "SELECT c.start_hour, c.capacity, COALESCE(bk.booked, 0) AS booked,",
      "       ROUND(100 * COALESCE(bk.booked, 0) / c.capacity, 2) AS fill_pct",
      "FROM cap c",
      "LEFT JOIN bk ON bk.start_hour = c.start_hour",
      "ORDER BY c.start_hour",
    ].join("\n"),
    alternatives: [
      [
        "SELECT start_hour, SUM(capacity) AS capacity, SUM(n) AS booked, ROUND(100 * SUM(n) / SUM(capacity), 2) AS fill_pct",
        "FROM (",
        "  SELECT w.start_hour, w.capacity,",
        "         (SELECT COUNT(*) FROM PickupBooking b WHERE b.window_id = w.window_id AND b.status = 'booked') AS n",
        "  FROM PickupWindow w",
        ") t",
        "GROUP BY start_hour",
        "ORDER BY start_hour",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Joining windows to bookings and then summing `capacity` counts a window's capacity once per booking — check the totals by hand.",
      "Add up capacity and count bookings separately, each per hour, and only then put the two side by side.",
      "A LEFT JOIN plus `COALESCE` keeps hours that have windows but no bookings.",
    ],
    editorial: [
      "The trap here is **join fan-out**. If you join windows to bookings and group by hour, a window with three bookings appears three times, and `SUM(capacity)` adds its capacity three times — the fill rate comes out far too low. A window with no bookings disappears altogether under an inner join.",
      "",
      "The fix is to aggregate each side at the right grain *before* combining them. One CTE sums capacity per hour straight from `PickupWindow`, where every window is one row. Another counts live bookings per hour by joining bookings to their window just to learn the hour. The final LEFT JOIN from capacity to bookings keeps every hour that has a window, and `COALESCE(booked, 0)` turns a missing count into 0.",
      "",
      "Multiply by 100 before dividing so the percentage keeps its decimals, then round to two places. The alternative avoids the fan-out differently: a correlated subquery counts the bookings of each window, so each window is still exactly one row when the outer query groups by hour.",
    ].join("\n"),
  },

  {
    slug: "walmart-close-then-open-shifts-under-ten-hours-rest",
    title: "Walmart: Close-Then-Open Shifts With Under Ten Hours' Rest",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates"],
    description: [
      "Walmart's store scheduling team watches for \"clopens\" — an associate who closes the store at night and is back to open it in the morning — because too little rest between shifts hurts both people and safety.",
      "",
      "For each shift, the **rest** before it is the minutes between the end of the same associate's **previous shift** (the one with the latest `clock_in` before this shift's) and this shift's `clock_in`. Return `associate_id`, `shift_id` and `rest_minutes` for every shift with a previous shift and **less than 600 minutes** of rest. An associate's shifts never overlap. Order by `associate_id`, then `shift_id`.",
    ].join("\n"),
    tables: [
      {
        name: "AssociateShift",
        columns: [
          { name: "shift_id", type: "int" },
          { name: "associate_id", type: "int" },
          { name: "clock_in", type: "datetime" },
          { name: "clock_out", type: "datetime" },
        ],
        primaryKey: ["shift_id"],
        note: "One row per completed shift. Shift ids are not in time order — they were assigned when the schedule was entered.",
      },
    ],
    examples: [
      {
        AssociateShift: [
          [11, 41, "2025-06-02 14:00:00", "2025-06-02 23:00:00"],
          [12, 41, "2025-06-03 07:00:00", "2025-06-03 15:00:00"],
          [13, 41, "2025-06-04 08:00:00", "2025-06-04 16:00:00"],
          [10, 41, "2025-06-05 02:00:00", "2025-06-05 10:00:00"],
          [20, 42, "2025-06-02 13:00:00", "2025-06-02 22:00:00"],
          [21, 42, "2025-06-03 08:00:00", "2025-06-03 16:00:00"],
          [30, 43, "2025-06-03 06:00:00", "2025-06-03 14:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const people = sample(rng, [41, 42, 43, 44, 45], ri(rng, 0, 4));
      for (const a of people) {
        const k = ri(rng, 1, 5);
        let start = ri(rng, 20, 64) * 15;
        for (let j = 0; j < k; j++) {
          const dur = ri(rng, 16, 40) * 15;
          rows.push([0, a, at("2025-06-01", start), at("2025-06-01", start + dur)]);
          start += dur + pick(rng, [480, 570, 585, 599, 600, 615, 660, 720, 900, 1440]);
        }
      }
      const ids = shuffle(rng, seq(10, rows.length));
      rows.forEach((r, i) => (r[0] = ids[i]!));
      return { AssociateShift: rows };
    },
    solution: [
      "WITH s AS (",
      "  SELECT associate_id, shift_id, clock_in,",
      "         LAG(clock_out) OVER (PARTITION BY associate_id ORDER BY clock_in) AS prev_out",
      "  FROM AssociateShift",
      ")",
      "SELECT associate_id, shift_id, TIMESTAMPDIFF(MINUTE, prev_out, clock_in) AS rest_minutes",
      "FROM s",
      "WHERE prev_out IS NOT NULL",
      "  AND TIMESTAMPDIFF(MINUTE, prev_out, clock_in) < 600",
      "ORDER BY associate_id, shift_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT associate_id, shift_id, rest_minutes FROM (",
        "  SELECT a.associate_id, a.shift_id,",
        "         TIMESTAMPDIFF(MINUTE, (SELECT MAX(p.clock_out) FROM AssociateShift p",
        "                                WHERE p.associate_id = a.associate_id AND p.clock_in < a.clock_in), a.clock_in) AS rest_minutes",
        "  FROM AssociateShift a",
        ") t",
        "WHERE rest_minutes < 600",
        "ORDER BY associate_id, shift_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "\"Previous shift\" means previous in time for the same associate, not the previous id.",
      "`LAG(clock_out) OVER (PARTITION BY associate_id ORDER BY clock_in)` brings the previous shift's end onto the current row.",
      "The first shift of each associate has no previous shift — its `LAG` is NULL.",
    ],
    editorial: [
      "Rest is measured between two rows — the end of one shift and the start of the next — so the previous row's `clock_out` has to be brought onto the current row. `LAG(clock_out)` does exactly that, partitioned by associate so one person's shift is never compared with another's, and ordered by `clock_in` so \"previous\" means previous in time. The ids are deliberately out of time order, so ordering the window by `shift_id` would pair the wrong shifts.",
      "",
      "`TIMESTAMPDIFF(MINUTE, prev_out, clock_in)` measures the rest across midnight. Each associate's first shift has no predecessor; its `prev_out` is NULL and it is filtered out. The threshold is strict — exactly ten hours of rest is acceptable.",
      "",
      "The alternative finds the previous end with a correlated subquery: the latest `clock_out` among the associate's shifts that started earlier. That is the previous shift's end only because shifts never overlap — with overlaps the two queries would disagree. The window version is one sort per associate; the subquery version is a probe per row, fine with an index on `(associate_id, clock_in)`.",
    ].join("\n"),
  },

  {
    slug: "walmart-store-sales-gap-to-region-leader",
    title: "Walmart: Each Store's Sales Gap to Its Region's Leader",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation", "Joins"],
    description: [
      "A Walmart regional general manager reviews the week starting **2025-05-05** by asking each store manager how far they sit behind the best store in the region.",
      "",
      "A store's weekly sales are the sum of `net_sales` over all its department rows for `week_start = '2025-05-05'`. For every store with at least one row that week, return `store_id`, `region`, `net_sales` (that total) and `gap_to_leader` — the highest store total in the same region that week minus this store's total (0 for the leader, and for every store tied with it). Stores with no rows that week are left out. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Store",
        columns: [
          { name: "store_id", type: "int" },
          { name: "region", type: "varchar" },
        ],
        primaryKey: ["store_id"],
        note: "One row per store and the operating region it reports into.",
      },
      {
        name: "DeptWeekSales",
        columns: [
          { name: "store_id", type: "int" },
          { name: "week_start", type: "date" },
          { name: "department", type: "varchar" },
          { name: "net_sales", type: "int" },
        ],
        primaryKey: ["store_id", "week_start", "department"],
        note: "One row per store, week (starting Monday) and department: net sales in dollars.",
      },
    ],
    examples: [
      {
        Store: [
          [1204, "South"],
          [3318, "South"],
          [5260, "South"],
          [4100, "West"],
          [4177, "West"],
          [4200, "West"],
        ],
        DeptWeekSales: [
          [1204, "2025-05-05", "Grocery", 52000],
          [1204, "2025-05-05", "Electronics", 18000],
          [3318, "2025-05-05", "Grocery", 61000],
          [5260, "2025-05-05", "Grocery", 40000],
          [5260, "2025-05-05", "Home", 21000],
          [5260, "2025-04-28", "Grocery", 90000],
          [4100, "2025-05-05", "Grocery", 30000],
          [4177, "2025-05-05", "Grocery", 30000],
          [4200, "2025-05-12", "Grocery", 45000],
        ],
      },
    ],
    gen: (rng) => {
      const ids = sample(rng, [1204, 3318, 5260, 4100, 4177, 4200, 6006], ri(rng, 1, 6));
      const stores: Cell[][] = ids.map((id) => [id, pick(rng, REGIONS.slice(0, 3))]);
      const rows: Cell[][] = [];
      const seen = new Set<string>();
      for (const s of ids) {
        const k = ri(rng, 0, 4);
        for (let j = 0; j < k; j++) {
          const wk = pick(rng, ["2025-05-05", "2025-05-05", "2025-04-28", "2025-05-12"]);
          const dept = pick(rng, [...GROCERY_DEPTS, ...GM_DEPTS]);
          const key = `${s}|${wk}|${dept}`;
          if (seen.has(key)) continue;
          seen.add(key);
          rows.push([s, wk, dept, roundTo(rng, 5000, 40000, 5000)]);
        }
      }
      return { Store: stores, DeptWeekSales: rows };
    },
    solution: [
      "WITH t AS (",
      "  SELECT s.store_id, s.region, SUM(d.net_sales) AS net_sales",
      "  FROM Store s",
      "  JOIN DeptWeekSales d ON d.store_id = s.store_id",
      "  WHERE d.week_start = '2025-05-05'",
      "  GROUP BY s.store_id, s.region",
      ")",
      "SELECT store_id, region, net_sales,",
      "       MAX(net_sales) OVER (PARTITION BY region) - net_sales AS gap_to_leader",
      "FROM t",
    ].join("\n"),
    alternatives: [
      [
        "WITH t AS (",
        "  SELECT s.store_id, s.region, SUM(d.net_sales) AS net_sales",
        "  FROM Store s JOIN DeptWeekSales d ON d.store_id = s.store_id",
        "  WHERE d.week_start = '2025-05-05'",
        "  GROUP BY s.store_id, s.region",
        "), best AS (",
        "  SELECT region, MAX(net_sales) AS top_sales FROM t GROUP BY region",
        ")",
        "SELECT t.store_id, t.region, t.net_sales, b.top_sales - t.net_sales AS gap_to_leader",
        "FROM t JOIN best b ON b.region = t.region",
      ].join("\n"),
    ],
    hints: [
      "First get one total per store for the week — the department rows must be added up before anything is compared.",
      "The leader's total is the maximum over the stores of the same region: a window `MAX(...) OVER (PARTITION BY region)`.",
      "A window function keeps every store's row, unlike a `GROUP BY region`.",
    ],
    editorial: [
      "Two levels of aggregation are stacked here. The data is per department, so the first step is a store's weekly total: join stores to their rows, keep the week of 5 May, and `GROUP BY` store. A store whose rows are all from other weeks never forms a group, which is what the statement asks for.",
      "",
      "The second step compares each store with the best total in its region. A `GROUP BY region` would collapse the stores into one row per region; a window function computes the regional maximum **without** collapsing, so `MAX(net_sales) OVER (PARTITION BY region)` sits next to every store's own total and the gap is a subtraction. The leader gets 0, and so does any store tied with it — no tie-breaking is needed because nothing is ranked.",
      "",
      "Window functions are evaluated after `GROUP BY`, which is why the totals are computed in a CTE first. The alternative computes each region's maximum in a second CTE and joins it back — the classic pre-window pattern. Both are a sort or hash per region on top of one scan.",
    ].join("\n"),
  },

  {
    slug: "walmart-repeat-receiptless-returns-across-stores",
    title: "Walmart: Repeat Receiptless Returns Across Stores",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Dates"],
    description: [
      "Walmart's asset protection team looks for return patterns that can signal fraud: the same customer bringing back items **without a receipt** again and again, at **more than one store**.",
      "",
      "Considering only receiptless returns (`has_receipt = 0`) made in **2025** by an identified customer (returns with a NULL `customer_id` are ignored), return each customer with **at least 3** such returns at **at least 2 different stores**: `customer_id`, `receiptless_returns`, `stores` (distinct stores among those returns) and `refunded` (their total `refund_amount`). Order by `refunded` descending, then `customer_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "ReturnTxn",
        columns: [
          { name: "return_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "return_date", type: "date" },
          { name: "has_receipt", type: "bool" },
          { name: "refund_amount", type: "int" },
        ],
        primaryKey: ["return_id"],
        note: "One row per return at a service desk. `customer_id` is NULL when the shopper gave no ID; `refund_amount` is in whole dollars.",
      },
    ],
    examples: [
      {
        ReturnTxn: [
          [1, 21, 1204, "2025-01-04", 0, 60],
          [2, 21, 3318, "2025-01-11", 0, 45],
          [3, 21, 1204, "2025-02-02", 0, 80],
          [4, 22, 1204, "2025-01-05", 0, 30],
          [5, 22, 1204, "2025-01-19", 0, 30],
          [6, 22, 1204, "2025-02-09", 0, 30],
          [7, 23, 1204, "2024-12-28", 0, 90],
          [8, 23, 3318, "2025-01-03", 0, 20],
          [9, 23, 5260, "2025-01-10", 0, 25],
          [10, 23, 5260, "2025-01-12", 1, 300],
          [11, null, 1204, "2025-01-07", 0, 70],
          [12, 24, 3318, "2025-01-08", 0, 50],
          [13, 24, 5260, "2025-01-21", 0, 70],
          [14, 24, 1204, "2025-03-01", 0, 65],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 4, 26);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        chance(rng, 0.1) ? null : ri(rng, 21, 24),
        pick(rng, [1204, 3318, 5260]),
        chance(rng, 0.15) ? pick(rng, ["2024-12-31", "2025-01-01", "2025-12-31", "2026-01-01"]) : dateBetween(rng, "2024-12-01", "2025-03-31"),
        chance(rng, 0.2) ? 1 : 0,
        roundTo(rng, 10, 150, 5),
      ]);
      return { ReturnTxn: rows };
    },
    solution: [
      "SELECT customer_id,",
      "       COUNT(*) AS receiptless_returns,",
      "       COUNT(DISTINCT store_id) AS stores,",
      "       SUM(refund_amount) AS refunded",
      "FROM ReturnTxn",
      "WHERE has_receipt = 0",
      "  AND customer_id IS NOT NULL",
      "  AND return_date BETWEEN '2025-01-01' AND '2025-12-31'",
      "GROUP BY customer_id",
      "HAVING COUNT(*) >= 3 AND COUNT(DISTINCT store_id) >= 2",
      "ORDER BY refunded DESC, customer_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT customer_id, receiptless_returns, stores, refunded FROM (",
        "  SELECT customer_id, COUNT(*) AS receiptless_returns, COUNT(DISTINCT store_id) AS stores, SUM(refund_amount) AS refunded",
        "  FROM ReturnTxn",
        "  WHERE NOT has_receipt AND YEAR(return_date) = 2025",
        "  GROUP BY customer_id",
        ") t",
        "WHERE customer_id IS NOT NULL AND receiptless_returns >= 3 AND stores >= 2",
        "ORDER BY refunded DESC, customer_id ASC",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Throw away everything that is not a 2025 receiptless return by a known customer before you count.",
      "`COUNT(DISTINCT store_id)` counts stores, `COUNT(*)` counts returns.",
      "Both thresholds are about a customer's group, so both go in `HAVING`.",
    ],
    editorial: [
      "The pattern is defined on a set of returns, so the first job is to decide which returns are in that set: no receipt, dated in 2025, and tied to a customer. All three are row-level tests and belong in `WHERE`. A receipted return by the same customer, or one from late December 2024, must not count towards either threshold — filtering first guarantees that.",
      "",
      "NULL customers need a decision of their own. `GROUP BY` puts every NULL `customer_id` into one group, which would lump anonymous shoppers together into a fake \"customer\"; excluding them explicitly keeps them out.",
      "",
      "Then the two thresholds are aggregates of each customer's group: `COUNT(*) >= 3` returns and `COUNT(DISTINCT store_id) >= 2` stores, combined with `AND` in `HAVING`. A customer who made three receiptless returns at one store is not on the list, however much was refunded. The alternative groups first and applies the thresholds (and the NULL test) in an outer query. One grouped scan either way.",
    ].join("\n"),
  },

  {
    slug: "walmart-item-records-sharing-a-upc-after-cleanup",
    title: "Walmart: Item Records Sharing a UPC After Cleanup",
    difficulty: "MEDIUM",
    topics: ["Strings", "Aggregation"],
    description: [
      "A Walmart data engineer cleaning the item master finds UPCs typed in different ways — with spaces, with hyphens, and with leading zeros dropped — so one product can sit under two item records.",
      "",
      "Clean each non-NULL `upc` by removing every space and every hyphen and then **left-padding it with zeros to 12 digits**. Return each cleaned UPC that belongs to **two or more** items, as `upc` (the cleaned value) and `item_ids` (the item ids in ascending order, joined by commas with no spaces, e.g. `3,7,12`). Items with a NULL `upc` are ignored. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "ItemMaster",
        columns: [
          { name: "item_id", type: "int" },
          { name: "item_desc", type: "varchar" },
          { name: "upc", type: "varchar" },
        ],
        primaryKey: ["item_id"],
        note: "One row per item record. Once spaces and hyphens are removed every `upc` is 10 to 12 digits.",
      },
    ],
    examples: [
      {
        ItemMaster: [
          [3, "Peanut Butter 40 oz", "0 51500 24008 3"],
          [5, "Peanut Butter 40oz", "051500240083"],
          [7, "PEANUT BUTTER CRMY 40", "51500240083"],
          [8, "Paper Plates 100 ct", "0-78742-37078-5"],
          [9, "Paper Plates 100ct", "078742370785"],
          [12, "AA Batteries 24 pk", "039800013613"],
          [14, "Dish Soap 28 oz", null],
          [15, "Dish Soap", null],
        ],
      },
    ],
    gen: (rng) => {
      const bases = ["051500240083", "078742370785", "039800013613", "681131234567", "004900000634", "123456789012"];
      const variant = (u: string): string => {
        const v = ri(rng, 0, 3);
        if (v === 0) return u;
        if (v === 1) return `${u[0]} ${u.slice(1, 6)} ${u.slice(6, 11)} ${u[11]}`;
        if (v === 2) return `${u[0]}-${u.slice(1, 6)}-${u.slice(6, 11)}-${u[11]}`;
        return u.replace(/^0{1,2}/, "");
      };
      const n = chance(rng, 0.06) ? 0 : ri(rng, 1, 14);
      const ids = sample(rng, seq(1, 30), n).sort((a, b) => a - b);
      const rows: Cell[][] = ids.map((id) => [id, pick(rng, PRODUCT_DESCS), chance(rng, 0.12) ? null : variant(pick(rng, bases))]);
      return { ItemMaster: shuffle(rng, rows) };
    },
    solution: [
      "WITH c AS (",
      "  SELECT item_id, LPAD(REPLACE(REPLACE(upc, ' ', ''), '-', ''), 12, '0') AS upc",
      "  FROM ItemMaster",
      "  WHERE upc IS NOT NULL",
      ")",
      "SELECT upc, GROUP_CONCAT(item_id ORDER BY item_id SEPARATOR ',') AS item_ids",
      "FROM c",
      "GROUP BY upc",
      "HAVING COUNT(*) >= 2",
    ].join("\n"),
    alternatives: [
      [
        "SELECT clean AS upc, GROUP_CONCAT(item_id ORDER BY item_id) AS item_ids",
        "FROM (SELECT item_id, RIGHT(CONCAT('000000000000', REPLACE(REPLACE(upc, '-', ''), ' ', '')), 12) AS clean FROM ItemMaster) t",
        "WHERE clean IS NOT NULL",
        "GROUP BY clean",
        "HAVING COUNT(DISTINCT item_id) > 1",
      ].join("\n"),
    ],
    hints: [
      "Normalise first, compare second: build the cleaned UPC in a CTE and group by it.",
      "`REPLACE` removes one kind of character at a time — nest two of them.",
      "`LPAD(x, 12, '0')` puts the dropped leading zeros back; `GROUP_CONCAT(... ORDER BY ... SEPARATOR ',')` builds the list.",
    ],
    editorial: [
      "Duplicates can only be found once every UPC is written the same way, so the query cleans first and groups second. Two nested `REPLACE` calls strip the spaces and the hyphens; what remains is a run of digits, sometimes short because a spreadsheet dropped its leading zeros. `LPAD(…, 12, '0')` restores them, so `51500240083` and `051500240083` become the same 12-character string.",
      "",
      "Grouping by the cleaned value then puts all records of one product together, and `HAVING COUNT(*) >= 2` keeps the products with more than one record. NULL UPCs are removed before grouping — otherwise all of them would form one group and be reported as a \"duplicate\" of each other, which says nothing about the products.",
      "",
      "`GROUP_CONCAT(item_id ORDER BY item_id SEPARATOR ',')` produces the list in a fixed order, so the output does not depend on storage order. The alternative pads differently — prefix twelve zeros and keep the rightmost twelve characters — and relies on the default comma separator and on `CONCAT` returning NULL for a NULL UPC. Both are one scan plus a group-by.",
    ].join("\n"),
  },

  {
    slug: "walmart-late-store-deliveries-by-day-of-week",
    title: "Walmart: Late Store Deliveries by Day of the Week",
    difficulty: "MEDIUM",
    topics: ["Dates", "Aggregation", "Conditional Logic"],
    description: [
      "Walmart's transportation planners suspect certain days of the week are harder for the truck fleet. They want, per weekday, how many deliveries were scheduled and how many were late.",
      "",
      "A delivery is **late** when it arrived **more than 30 minutes** after `scheduled_at`, or never arrived (`arrived_at` is NULL). Group deliveries by the weekday of `scheduled_at` and return `day_name` (e.g. `Monday`), `deliveries` and `late_deliveries`, for weekdays with at least one delivery, ordered **Monday first through Sunday**.",
    ].join("\n"),
    tables: [
      {
        name: "StoreDelivery",
        columns: [
          { name: "delivery_id", type: "int" },
          { name: "dc_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "scheduled_at", type: "datetime" },
          { name: "arrived_at", type: "datetime" },
        ],
        primaryKey: ["delivery_id"],
        note: "One row per truck delivery from a distribution centre to a store. `arrived_at` is NULL when the delivery never arrived.",
      },
    ],
    examples: [
      {
        StoreDelivery: [
          [1, 6011, 1204, "2025-06-02 05:00:00", "2025-06-02 05:30:00"],
          [2, 6011, 3318, "2025-06-02 06:00:00", "2025-06-02 06:31:00"],
          [3, 6011, 1204, "2025-06-04 05:00:00", "2025-06-04 04:45:00"],
          [4, 6094, 5260, "2025-06-04 07:00:00", null],
          [5, 6094, 5260, "2025-06-08 05:00:00", "2025-06-08 09:00:00"],
          [6, 6011, 1204, "2025-06-09 05:00:00", "2025-06-09 05:10:00"],
          [7, 6094, 3318, "2025-06-07 23:50:00", "2025-06-08 00:30:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.06) ? 0 : ri(rng, 1, 20);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const day = dateBetween(rng, "2025-06-02", "2025-06-15");
        const start = ri(rng, 16, 95) * 15;
        const delta = pick(rng, [-20, 0, 10, 30, 31, 45, 90, 240, null]);
        return [id, pick(rng, [6011, 6094]), pick(rng, [1204, 3318, 5260]), at(day, start), delta === null ? null : at(day, start + delta)];
      });
      return { StoreDelivery: rows };
    },
    solution: [
      "SELECT DAYNAME(scheduled_at) AS day_name,",
      "       COUNT(*) AS deliveries,",
      "       SUM(CASE WHEN arrived_at IS NULL OR TIMESTAMPDIFF(MINUTE, scheduled_at, arrived_at) > 30 THEN 1 ELSE 0 END) AS late_deliveries",
      "FROM StoreDelivery",
      "GROUP BY DAYNAME(scheduled_at)",
      "ORDER BY MIN(WEEKDAY(scheduled_at))",
    ].join("\n"),
    alternatives: [
      [
        "SELECT day_name, COUNT(*) AS deliveries, SUM(late) AS late_deliveries",
        "FROM (",
        "  SELECT WEEKDAY(scheduled_at) AS wd, DAYNAME(scheduled_at) AS day_name,",
        "         IF(arrived_at IS NULL, 1, IF(TIMESTAMPDIFF(MINUTE, scheduled_at, arrived_at) > 30, 1, 0)) AS late",
        "  FROM StoreDelivery",
        ") t",
        "GROUP BY wd, day_name",
        "ORDER BY wd",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`DAYNAME` gives the label, but sorting by it puts Friday first — you need a number to order by.",
      "`WEEKDAY(d)` is 0 for Monday through 6 for Sunday.",
      "A delivery that never arrived has a NULL difference, so test for it explicitly when counting late ones.",
    ],
    editorial: [
      "The grouping key is the weekday of the scheduled time, and the order must follow the calendar, not the alphabet. `DAYNAME` gives the label to show, while `WEEKDAY` (Monday = 0 … Sunday = 6) gives the number to sort by. Since every row in a `DAYNAME` group has the same `WEEKDAY`, ordering by `MIN(WEEKDAY(scheduled_at))` is a legal aggregate that sorts the groups correctly.",
      "",
      "Lateness is a conditional count. A delivery that never arrived has `arrived_at` NULL, and `TIMESTAMPDIFF` with a NULL is NULL — it would be counted as on time unless the `CASE` tests for NULL first. The threshold is strict: arriving exactly 30 minutes after the slot is on time, 31 minutes is late. Early arrivals give a negative difference and are on time.",
      "",
      "Note the delivery scheduled at 23:50 on a Saturday belongs to Saturday even though it arrived on Sunday — the weekday comes from `scheduled_at`. The alternative computes the weekday number, label and late flag per row in a derived table and groups by both the number and the label. One scan either way.",
    ].join("\n"),
  },
  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "walmart-did-the-rollback-lift-daily-unit-sales",
    title: "Walmart: Did the Rollback Lift Daily Unit Sales?",
    difficulty: "HARD",
    topics: ["Joins", "Dates", "Conditional Logic"],
    description: [
      "Walmart's merchandising analysts judge each rollback by comparing an item's sales rate while the rollback ran with its rate in the week just before it.",
      "",
      "For every rollback, compute at its store and item: `units_before`, the units sold in the **7 days before** `start_date` (from `start_date - 7` to `start_date - 1`), and `units_during`, the units sold from `start_date` to `end_date` inclusive. A day with no sales row sold 0 units. The rollback **lifted** sales when its average units per day during the rollback is strictly higher than the average per day over the 7 days before. Return `rollback_id`, `units_before`, `units_during` and `lifted` (`'yes'` or `'no'`) for every rollback, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "ItemRollback",
        columns: [
          { name: "rollback_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "item_id", type: "int" },
          { name: "start_date", type: "date" },
          { name: "end_date", type: "date" },
        ],
        primaryKey: ["rollback_id"],
        note: "One row per rollback of one item at one store; both dates are inclusive and `end_date >= start_date`.",
      },
      {
        name: "DailyItemSales",
        columns: [
          { name: "store_id", type: "int" },
          { name: "item_id", type: "int" },
          { name: "sale_date", type: "date" },
          { name: "units", type: "int" },
        ],
        primaryKey: ["store_id", "item_id", "sale_date"],
        note: "Units of the item sold at the store that day. Days with no sales have no row.",
      },
    ],
    examples: [
      {
        ItemRollback: [
          [1, 1204, 801, "2025-05-08", "2025-05-11"],
          [2, 1204, 802, "2025-05-15", "2025-05-21"],
          [3, 1204, 803, "2025-05-20", "2025-05-20"],
          [4, 3318, 801, "2025-05-08", "2025-05-11"],
        ],
        DailyItemSales: [
          [1204, 801, "2025-04-30", 20],
          [1204, 801, "2025-05-01", 5],
          [1204, 801, "2025-05-03", 4],
          [1204, 801, "2025-05-07", 3],
          [1204, 801, "2025-05-08", 6],
          [1204, 801, "2025-05-10", 5],
          [1204, 801, "2025-05-11", 4],
          [1204, 801, "2025-05-12", 9],
          [1204, 802, "2025-05-09", 10],
          [1204, 802, "2025-05-14", 8],
          [1204, 802, "2025-05-15", 3],
          [1204, 802, "2025-05-20", 2],
          [3318, 801, "2025-05-09", 2],
        ],
      },
    ],
    gen: (rng) => {
      const items = [801, 802, 803];
      const seen = new Set<string>();
      const sales: Cell[][] = [];
      const m = ri(rng, 0, 26);
      for (let i = 0; i < m; i++) {
        const store = pick(rng, [1204, 1204, 3318]);
        const it = pick(rng, items);
        const d = dateBetween(rng, "2025-04-28", "2025-05-31");
        const k = `${store}|${it}|${d}`;
        if (seen.has(k)) continue;
        seen.add(k);
        sales.push([store, it, d, ri(rng, 1, 12)]);
      }
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 4);
      const rbs: Cell[][] = seq(1, n).map((id) => {
        const start = dateBetween(rng, "2025-05-05", "2025-05-24");
        return [id, pick(rng, [1204, 1204, 3318]), pick(rng, items), start, addDays(start, pick(rng, [0, 2, 3, 6]))];
      });
      return { ItemRollback: rbs, DailyItemSales: sales };
    },
    solution: [
      "WITH t AS (",
      "  SELECT r.rollback_id,",
      "         DATEDIFF(r.end_date, r.start_date) + 1 AS days,",
      "         COALESCE(SUM(CASE WHEN d.sale_date < r.start_date THEN d.units END), 0) AS units_before,",
      "         COALESCE(SUM(CASE WHEN d.sale_date >= r.start_date THEN d.units END), 0) AS units_during",
      "  FROM ItemRollback r",
      "  LEFT JOIN DailyItemSales d",
      "    ON d.store_id = r.store_id AND d.item_id = r.item_id",
      "   AND d.sale_date BETWEEN DATE_SUB(r.start_date, INTERVAL 7 DAY) AND r.end_date",
      "  GROUP BY r.rollback_id, r.start_date, r.end_date",
      ")",
      "SELECT rollback_id, units_before, units_during,",
      "       CASE WHEN units_during * 7 > units_before * days THEN 'yes' ELSE 'no' END AS lifted",
      "FROM t",
    ].join("\n"),
    alternatives: [
      [
        "SELECT rollback_id, units_before, units_during,",
        "       IF(units_during / (DATEDIFF(end_date, start_date) + 1) > units_before / 7, 'yes', 'no') AS lifted",
        "FROM (",
        "  SELECT r.rollback_id, r.start_date, r.end_date,",
        "         (SELECT COALESCE(SUM(d.units), 0) FROM DailyItemSales d",
        "          WHERE d.store_id = r.store_id AND d.item_id = r.item_id",
        "            AND d.sale_date >= DATE_SUB(r.start_date, INTERVAL 7 DAY) AND d.sale_date < r.start_date) AS units_before,",
        "         (SELECT COALESCE(SUM(d.units), 0) FROM DailyItemSales d",
        "          WHERE d.store_id = r.store_id AND d.item_id = r.item_id",
        "            AND d.sale_date BETWEEN r.start_date AND r.end_date) AS units_during",
        "  FROM ItemRollback r",
        ") t",
      ].join("\n"),
    ],
    hints: [
      "Each rollback has its own two windows; join the sales on store, item and a date range that covers both.",
      "Split the joined rows with conditional sums: before the start, and from the start on.",
      "Missing days are zeros, so the averages divide by the number of calendar days (7, and `DATEDIFF(end, start) + 1`), not by the number of rows.",
      "Comparing `during / days > before / 7` is the same as `during * 7 > before * days`, with no division.",
    ],
    editorial: [
      "Each rollback defines its own windows, so the sales are joined with a **range condition**: same store and item, and a `sale_date` between `start_date - 7` and `end_date`. One LEFT JOIN brings both windows; a `CASE` inside `SUM` then splits the rows into those before the start and those from the start on. The LEFT JOIN keeps a rollback whose item sold nothing, and `COALESCE` turns its NULL sums into 0.",
      "",
      "The subtle part is the averages. Days without sales have no row, so `AVG(units)` would average only the days that sold something and overstate both rates. The right denominators are calendar days: 7 for the week before, and `DATEDIFF(end_date, start_date) + 1` for the rollback (the +1 because both ends count). Rather than divide, compare `units_during * 7 > units_before * days` — the same inequality, in integers, with no rounding question. When both totals are 0 the comparison is false, so a rollback that sold nothing at all did not lift sales.",
      "",
      "Sales at another store, or of another item, never enter the windows thanks to the join keys. The alternative computes the two totals with correlated scalar subqueries and compares the decimal averages directly. Both cost one range lookup per rollback with an index on `(store_id, item_id, sale_date)`.",
    ].join("\n"),
  },

  {
    slug: "walmart-plus-membership-spells-bridging-short-lapses",
    title: "Walmart: Walmart+ Membership Spells, Bridging Short Lapses",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "The Walmart+ retention team counts a member who lapses briefly and comes back as one continuous relationship. It wants each member's history as **spells**: runs of membership terms where every lapse between consecutive terms was short.",
      "",
      "A member's terms never overlap. Taking a member's terms in `start_date` order, a term **continues** the previous term's spell when the days with no membership in between — `DATEDIFF(start_date, previous end_date) - 1` — are **30 or fewer**; otherwise it starts a new spell. Return `member_id`, `spell_start` (first term's `start_date`), `spell_end` (last term's `end_date`) and `terms` (how many terms the spell holds), ordered by `member_id`, then `spell_start`.",
    ].join("\n"),
    tables: [
      {
        name: "PlusTerm",
        columns: [
          { name: "term_id", type: "int" },
          { name: "member_id", type: "int" },
          { name: "start_date", type: "date" },
          { name: "end_date", type: "date" },
        ],
        primaryKey: ["term_id"],
        note: "One row per paid term (a month or a year). Both dates are inclusive; a member's terms never overlap. Term ids are not in date order.",
      },
    ],
    examples: [
      {
        PlusTerm: [
          [7, 1001, "2023-01-01", "2023-01-31"],
          [3, 1001, "2023-02-01", "2023-02-28"],
          [9, 1001, "2023-03-31", "2023-04-29"],
          [1, 1001, "2023-05-31", "2023-06-29"],
          [5, 1002, "2023-03-10", "2024-03-09"],
          [2, 1002, "2024-05-01", "2025-04-30"],
          [4, 1003, "2024-01-15", "2024-02-14"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const members = sample(rng, [1001, 1002, 1003, 1004], ri(rng, 1, 4));
      for (const mid of members) {
        let start = dateBetween(rng, "2023-01-01", "2023-06-30");
        const k = ri(rng, 1, 6);
        for (let j = 0; j < k; j++) {
          const end = addDays(start, pick(rng, [29, 30, 30, 364]));
          rows.push([0, mid, start, end]);
          start = addDays(end, pick(rng, [1, 1, 15, 31, 31, 32, 45, 120]));
        }
      }
      const ids = shuffle(rng, seq(1, rows.length));
      rows.forEach((r, i) => (r[0] = ids[i]!));
      return { PlusTerm: rows };
    },
    solution: [
      "WITH t AS (",
      "  SELECT member_id, start_date, end_date,",
      "         LAG(end_date) OVER (PARTITION BY member_id ORDER BY start_date) AS prev_end",
      "  FROM PlusTerm",
      "), f AS (",
      "  SELECT member_id, start_date, end_date,",
      "         CASE WHEN prev_end IS NOT NULL AND DATEDIFF(start_date, prev_end) - 1 <= 30 THEN 0 ELSE 1 END AS is_new",
      "  FROM t",
      "), g AS (",
      "  SELECT member_id, start_date, end_date,",
      "         SUM(is_new) OVER (PARTITION BY member_id ORDER BY start_date ROWS UNBOUNDED PRECEDING) AS spell",
      "  FROM f",
      ")",
      "SELECT member_id, MIN(start_date) AS spell_start, MAX(end_date) AS spell_end, COUNT(*) AS terms",
      "FROM g",
      "GROUP BY member_id, spell",
      "ORDER BY member_id, spell_start",
    ].join("\n"),
    alternatives: [
      [
        "WITH s AS (",
        "  SELECT a.member_id, a.start_date",
        "  FROM PlusTerm a",
        "  WHERE NOT EXISTS (",
        "    SELECT 1 FROM PlusTerm b",
        "    WHERE b.member_id = a.member_id AND b.end_date < a.start_date",
        "      AND DATEDIFF(a.start_date, b.end_date) <= 31",
        "  )",
        "), b AS (",
        "  SELECT s.member_id, s.start_date AS spell_start,",
        "         (SELECT MIN(s2.start_date) FROM s s2 WHERE s2.member_id = s.member_id AND s2.start_date > s.start_date) AS next_start",
        "  FROM s",
        ")",
        "SELECT b.member_id, b.spell_start, MAX(p.end_date) AS spell_end, COUNT(*) AS terms",
        "FROM b",
        "JOIN PlusTerm p ON p.member_id = b.member_id AND p.start_date >= b.spell_start",
        "               AND (b.next_start IS NULL OR p.start_date < b.next_start)",
        "GROUP BY b.member_id, b.spell_start",
        "ORDER BY b.member_id, b.spell_start",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "This is gaps-and-islands with a tolerance: first decide, for each term, whether it starts a new spell.",
      "`LAG(end_date)` over the member's terms in date order gives the previous term's end; the lapse is `DATEDIFF(start, prev_end) - 1` days.",
      "A running `SUM` of the \"starts a new spell\" flag numbers the spells; then group by member and that number.",
      "Watch the boundary: a lapse of exactly 30 days is still bridged.",
    ],
    editorial: [
      "Spells are **islands** of terms, but the islands are not separated by any gap at all — only by a gap longer than 30 days — so the usual \"value minus row number\" trick does not apply. The general method does: mark where each island starts, then number the islands with a running total.",
      "",
      "`LAG(end_date)` over each member's terms, ordered by `start_date`, puts the previous term's end on every row (the term ids are deliberately out of date order, so ordering by id would be wrong). A term with no previous term, or with more than 30 lapsed days — `DATEDIFF(start_date, prev_end) - 1 > 30` — starts a spell and gets flag 1; every other term gets 0. Back-to-back terms have a lapse of 0 days; a lapse of exactly 30 days is bridged and 31 is not.",
      "",
      "`SUM(is_new) OVER (… ROWS UNBOUNDED PRECEDING)` turns the flags into spell numbers 1, 1, 1, 2, …, and grouping by member and spell number gives each spell's first start, last end and term count.",
      "",
      "The alternative finds spell starts with `NOT EXISTS` (no earlier term ended within 31 days), then assigns every term to the latest spell start at or before it, using the next spell's start as the upper bound. That works because terms do not overlap; the window version is a single sort per member.",
    ].join("\n"),
  },

  {
    slug: "walmart-truck-routes-rebuilt-from-store-geofence-pings",
    title: "Walmart: Truck Routes Rebuilt From Store Geofence Pings",
    difficulty: "HARD",
    topics: ["Strings", "Window Functions", "Aggregation"],
    description: [
      "Walmart's transportation analytics team rebuilds the route each delivery truck actually drove from its telematics: every time a truck enters a store's geofence, a ping is logged. A truck idling or shunting in a store's yard can enter the same geofence several times in a row.",
      "",
      "For each run with at least one ping, list the stores in the order the truck **entered** them (`entered_at`), with **consecutive pings at the same store collapsed into one visit**. A store the truck comes back to later, after another store, is a new visit and appears again. Return `run_id`, `dc_id`, `route` (the visited `store_id`s joined by `' > '`, e.g. `1204 > 3318 > 1204`) and `store_visits` (the number of visits in the route). Runs with no pings are left out. Order by `run_id`.",
    ].join("\n"),
    tables: [
      {
        name: "TruckRun",
        columns: [
          { name: "run_id", type: "int" },
          { name: "dc_id", type: "int" },
          { name: "run_date", type: "date" },
        ],
        primaryKey: ["run_id"],
        note: "One row per outbound truck run from a distribution centre.",
      },
      {
        name: "GeofencePing",
        columns: [
          { name: "ping_id", type: "int" },
          { name: "run_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "entered_at", type: "datetime" },
        ],
        primaryKey: ["ping_id"],
        note: "One row each time the run's truck entered a store's geofence. Within a run no two pings share a time; ping ids are not in time order.",
      },
    ],
    examples: [
      {
        TruckRun: [
          [501, 6011, "2025-09-15"],
          [502, 6094, "2025-09-15"],
          [503, 6011, "2025-09-15"],
          [504, 6094, "2025-09-16"],
        ],
        GeofencePing: [
          [7, 501, 1204, "2025-09-15 06:10:00"],
          [2, 501, 1204, "2025-09-15 06:25:00"],
          [9, 501, 3318, "2025-09-15 07:40:00"],
          [4, 501, 5260, "2025-09-15 09:05:00"],
          [1, 501, 5260, "2025-09-15 09:07:00"],
          [8, 501, 3318, "2025-09-15 10:30:00"],
          [3, 502, 4100, "2025-09-15 05:50:00"],
          [6, 504, 3318, "2025-09-16 07:00:00"],
          [5, 504, 1204, "2025-09-16 08:15:00"],
        ],
      },
    ],
    gen: (rng) => {
      const runs: Cell[][] = seq(501, ri(rng, 1, 4)).map((id) => [id, pick(rng, [6011, 6094]), pick(rng, ["2025-09-15", "2025-09-16"])]);
      const pings: Cell[][] = [];
      for (const r of runs) {
        const k = chance(rng, 0.15) ? 0 : ri(rng, 1, 7);
        let minute = ri(rng, 20, 28) * 15;
        let store = pick(rng, [1204, 3318, 5260, 4100]);
        for (let j = 0; j < k; j++) {
          // Repeats of the store just pinged are the yard shunts the query must collapse.
          if (j > 0 && !chance(rng, 0.35)) store = pick(rng, [1204, 3318, 5260, 4100]);
          pings.push([0, r[0]!, store, at(r[2] as string, minute)]);
          minute += ri(rng, 1, 18) * 5;
        }
      }
      const ids = shuffle(rng, seq(1, pings.length));
      pings.forEach((p, i) => (p[0] = ids[i]!));
      return { TruckRun: runs, GeofencePing: pings };
    },
    solution: [
      "WITH p AS (",
      "  SELECT run_id, store_id, entered_at,",
      "         LAG(store_id) OVER (PARTITION BY run_id ORDER BY entered_at) AS prev_store",
      "  FROM GeofencePing",
      "), visits AS (",
      "  SELECT run_id, store_id, entered_at",
      "  FROM p",
      "  WHERE prev_store IS NULL OR prev_store <> store_id",
      ")",
      "SELECT r.run_id, r.dc_id,",
      "       GROUP_CONCAT(v.store_id ORDER BY v.entered_at SEPARATOR ' > ') AS route,",
      "       COUNT(*) AS store_visits",
      "FROM TruckRun r",
      "JOIN visits v ON v.run_id = r.run_id",
      "GROUP BY r.run_id, r.dc_id",
      "ORDER BY r.run_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT r.run_id, r.dc_id,",
        "       GROUP_CONCAT(g.store_id ORDER BY g.entered_at SEPARATOR ' > ') AS route,",
        "       COUNT(*) AS store_visits",
        "FROM TruckRun r",
        "JOIN GeofencePing g ON g.run_id = r.run_id",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM GeofencePing q",
        "  WHERE q.run_id = g.run_id AND q.store_id = g.store_id",
        "    AND q.entered_at = (SELECT MAX(z.entered_at) FROM GeofencePing z",
        "                        WHERE z.run_id = g.run_id AND z.entered_at < g.entered_at)",
        ")",
        "GROUP BY r.run_id, r.dc_id",
        "ORDER BY r.run_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Build the route string with `GROUP_CONCAT(store_id ORDER BY entered_at SEPARATOR ' > ')` — the `ORDER BY` inside the aggregate is what makes it a route.",
      "Before concatenating, drop every ping whose previous ping on the same run was at the same store.",
      "`LAG(store_id)` over the run's pings in time order gives the previous store; the first ping of a run has none and always stays.",
      "Don't use `DISTINCT` inside the concatenation — a store revisited later must appear twice.",
    ],
    editorial: [
      "The output is a **sequence string**, and `GROUP_CONCAT` builds one — but only if it is told the order. An aggregate otherwise sees rows in whatever order the engine reads them, and here the ping ids are deliberately out of time order, so `GROUP_CONCAT(store_id ORDER BY entered_at SEPARATOR ' > ')` is the essential spelling. Without the `ORDER BY` the route could come out shuffled; without the separator MySQL uses a bare comma.",
      "",
      "The pings are not the visits yet. A truck shunting in a yard enters the same geofence two or three times in a row, and those must count once. That is a **collapse of consecutive duplicates**: keep a ping only when the previous ping of the same run was at a different store. `LAG(store_id) OVER (PARTITION BY run_id ORDER BY entered_at)` brings the previous store onto each row; the first ping of a run has NULL there and is kept. Note what this does *not* do: a store revisited after another stop is a new visit and stays in the route. `DISTINCT` inside `GROUP_CONCAT` would wrongly erase that second visit, and it would also lose the order.",
      "",
      "After the collapse, grouping by run gives the route and, with `COUNT(*)`, the number of visits; the inner join to `TruckRun` supplies the DC and leaves out runs with no pings. The alternative finds the previous ping with a correlated `MAX(entered_at)` and drops a ping when that previous ping was at the same store (`NOT EXISTS`), then concatenates in the same way. The window version is one sort per run.",
    ].join("\n"),
  },

  {
    slug: "walmart-department-pairs-bought-together-more-than-by-chance",
    title: "Walmart: Department Pairs Bought Together More Than by Chance",
    difficulty: "HARD",
    topics: ["Joins", "Aggregation", "Subqueries"],
    description: [
      "A Walmart store planner deciding which departments to place near each other wants the department pairs that shoppers buy together **more often than chance would predict** — a lift above 1.",
      "",
      "Let `N` be the number of baskets, `n(A)` the number of baskets containing department `A`, and `n(A,B)` the number containing both. A pair has **lift above 1** when `n(A,B) * N > n(A) * n(B)`. Considering pairs bought together in **at least 2 baskets**, return `dept_a`, `dept_b` (with `dept_a` alphabetically before `dept_b`) and `together` (`n(A,B)`) for every pair with lift above 1. A basket with several lines from one department counts once for it. Order by `together` descending, then `dept_a`, then `dept_b`.",
    ].join("\n"),
    tables: [
      {
        name: "BasketLine",
        columns: [
          { name: "basket_id", type: "int" },
          { name: "line_no", type: "int" },
          { name: "department", type: "varchar" },
        ],
        primaryKey: ["basket_id", "line_no"],
        note: "One row per line on a register receipt; `department` is the line's department. Department names are single capitalised words.",
      },
    ],
    examples: [
      {
        BasketLine: [
          [1, 1, "Grocery"], [1, 2, "Dairy"], [1, 3, "Produce"],
          [2, 1, "Grocery"], [2, 2, "Dairy"],
          [3, 1, "Grocery"], [3, 2, "Electronics"],
          [4, 1, "Dairy"], [4, 2, "Produce"], [4, 3, "Produce"],
          [5, 1, "Electronics"], [5, 2, "Toys"],
          [6, 1, "Grocery"], [6, 2, "Dairy"], [6, 3, "Bakery"],
          [7, 1, "Grocery"], [7, 2, "Produce"],
        ],
      },
    ],
    gen: (rng) => {
      const depts = sample(rng, ["Bakery", "Dairy", "Electronics", "Grocery", "Pharmacy", "Produce", "Toys"], ri(rng, 3, 6));
      const combo = sample(rng, depts, 2);
      const rows: Cell[][] = [];
      const others = depts.filter((d) => !combo.includes(d));
      const baskets = chance(rng, 0.05) ? 0 : ri(rng, 3, 9);
      for (let b = 1; b <= baskets && rows.length < 28; b++) {
        const lines: string[] = chance(rng, 0.5) ? [...combo] : [];
        const extra = ri(rng, lines.length ? 0 : 1, 2);
        // Mostly other departments, so the planted pair often (not always) beats chance.
        for (let j = 0; j < extra; j++) lines.push(chance(rng, 0.75) ? pick(rng, others) : pick(rng, depts));
        shuffle(rng, lines).forEach((d, i) => rows.push([b, i + 1, d]));
      }
      return { BasketLine: rows };
    },
    solution: [
      "WITH bd AS (",
      "  SELECT DISTINCT basket_id, department FROM BasketLine",
      "), total AS (",
      "  SELECT COUNT(DISTINCT basket_id) AS baskets FROM BasketLine",
      "), dc AS (",
      "  SELECT department, COUNT(*) AS cnt FROM bd GROUP BY department",
      "), pairs AS (",
      "  SELECT a.department AS dept_a, b.department AS dept_b, COUNT(*) AS together",
      "  FROM bd a",
      "  JOIN bd b ON b.basket_id = a.basket_id AND a.department < b.department",
      "  GROUP BY a.department, b.department",
      ")",
      "SELECT p.dept_a, p.dept_b, p.together",
      "FROM pairs p",
      "JOIN dc da ON da.department = p.dept_a",
      "JOIN dc db ON db.department = p.dept_b",
      "CROSS JOIN total t",
      "WHERE p.together >= 2",
      "  AND p.together * t.baskets > da.cnt * db.cnt",
      "ORDER BY p.together DESC, p.dept_a, p.dept_b",
    ].join("\n"),
    alternatives: [
      [
        "SELECT dept_a, dept_b, together FROM (",
        "  SELECT a.department AS dept_a, b.department AS dept_b, COUNT(DISTINCT a.basket_id) AS together",
        "  FROM BasketLine a",
        "  JOIN BasketLine b ON b.basket_id = a.basket_id AND a.department < b.department",
        "  GROUP BY a.department, b.department",
        ") p",
        "WHERE together >= 2",
        "  AND together * (SELECT COUNT(DISTINCT basket_id) FROM BasketLine)",
        "      > (SELECT COUNT(DISTINCT basket_id) FROM BasketLine x WHERE x.department = p.dept_a)",
        "      * (SELECT COUNT(DISTINCT basket_id) FROM BasketLine y WHERE y.department = p.dept_b)",
        "ORDER BY together DESC, dept_a, dept_b",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Reduce the lines to one row per basket and department before counting anything.",
      "Pairs come from a self join on `basket_id` with `a.department < b.department`, which lists each pair once.",
      "You need three counts: all baskets, baskets per department, and baskets per pair. Compute each at its own grain and join them.",
      "Compare `together * N > n(A) * n(B)` — no division, no rounding.",
    ],
    editorial: [
      "Market-basket questions are all about counting at the right grain. A receipt with two Produce lines must count once for Produce, so the first step is `SELECT DISTINCT basket_id, department` — one row per basket and department. Every later count is a count of baskets, not of lines.",
      "",
      "Pairs come from joining that set to itself on `basket_id`. The condition `a.department < b.department` keeps each unordered pair once (Dairy–Grocery, never also Grocery–Dairy) and drops a department paired with itself; grouping by the pair counts `n(A,B)`. Separately, a grouped count gives `n(A)` per department, and one more count gives `N`. Joining the three puts all four numbers on one row.",
      "",
      "Lift is `n(A,B)·N / (n(A)·n(B))`, and lift above 1 is the cross-multiplied test `together * N > n(A) * n(B)` — integers only, so there is no rounding to argue about. A pair that occurs in two baskets can still fail it when both departments are in most baskets anyway, which is exactly what lift is for.",
      "",
      "The alternative pairs raw lines and uses `COUNT(DISTINCT basket_id)` to undo the duplicates, with the department and total counts as scalar subqueries. The self join is quadratic in the departments of a basket, which stays small for real receipts.",
    ].join("\n"),
  },

  {
    slug: "walmart-understaffed-stretches-on-the-sales-floor",
    title: "Walmart: Understaffed Stretches on the Sales Floor",
    difficulty: "HARD",
    topics: ["Joins", "Window Functions", "Aggregation"],
    description: [
      "A Walmart store manager compares the staffing plan for **2025-07-12** with the associates who actually clocked in, and wants the stretches of the day when the floor was short.",
      "",
      "An associate's shift **covers** a plan hour `h` when it clocked in at or before `h:00` on 2025-07-12 and clocked out at or after `(h+1):00` the same day. An hour is **understaffed** when fewer shifts cover it than `required`. Merge each store's understaffed hours into stretches of **consecutive clock hours** (12 and 13 are consecutive; 11 and 13 are not, even if 12 is not in the plan). Return `store_id`, `from_hour`, `to_hour` (the stretch's first and last understaffed hour) and `shortfall` (the sum over its hours of `required` minus covering shifts), ordered by `store_id`, then `from_hour`.",
    ].join("\n"),
    tables: [
      {
        name: "StaffingPlan",
        columns: [
          { name: "store_id", type: "int" },
          { name: "plan_hour", type: "int" },
          { name: "required", type: "int" },
        ],
        primaryKey: ["store_id", "plan_hour"],
        note: "The plan for 2025-07-12: how many associates each store needs on the floor in the hour starting at `plan_hour` (6 to 21).",
      },
      {
        name: "FloorShift",
        columns: [
          { name: "shift_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "associate_id", type: "int" },
          { name: "clock_in", type: "datetime" },
          { name: "clock_out", type: "datetime" },
        ],
        primaryKey: ["shift_id"],
        note: "One row per completed shift; the table also holds shifts from other days.",
      },
    ],
    examples: [
      {
        StaffingPlan: [
          [1204, 8, 2], [1204, 9, 2], [1204, 10, 3], [1204, 11, 3], [1204, 12, 3], [1204, 13, 3],
          [3318, 8, 1], [3318, 9, 1], [3318, 11, 1],
        ],
        FloorShift: [
          [1, 1204, 41, "2025-07-12 07:00:00", "2025-07-12 12:00:00"],
          [2, 1204, 42, "2025-07-12 08:30:00", "2025-07-12 16:00:00"],
          [3, 1204, 43, "2025-07-12 10:00:00", "2025-07-12 14:00:00"],
          [4, 1204, 44, "2025-07-11 09:00:00", "2025-07-11 17:00:00"],
          [5, 3318, 51, "2025-07-12 07:30:00", "2025-07-12 09:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const stores = sample(rng, [1204, 3318], ri(rng, 1, 2));
      const plan: Cell[][] = [];
      const shifts: Cell[][] = [];
      for (const s of stores) {
        const h0 = ri(rng, 6, 9);
        const h1 = Math.min(21, h0 + ri(rng, 3, 10));
        for (let h = h0; h <= h1; h++) if (!chance(rng, 0.1)) plan.push([s, h, ri(rng, 1, 3)]);
        const k = ri(rng, 0, 5);
        for (let j = 0; j < k; j++) {
          const day = pick(rng, ["2025-07-12", "2025-07-12", "2025-07-12", "2025-07-11"]);
          const start = ri(rng, 10, 36) * 30;
          shifts.push([shifts.length + 1, s, ri(rng, 40, 60), at(day, start), at(day, Math.min(start + ri(rng, 4, 18) * 30, 23 * 60))]);
        }
      }
      return { StaffingPlan: plan, FloorShift: shifts };
    },
    solution: [
      "WITH cover AS (",
      "  SELECT p.store_id, p.plan_hour, p.required, COUNT(f.shift_id) AS staffed",
      "  FROM StaffingPlan p",
      "  LEFT JOIN FloorShift f",
      "    ON f.store_id = p.store_id",
      "   AND f.clock_in <= CONCAT('2025-07-12 ', LPAD(p.plan_hour, 2, '0'), ':00:00')",
      "   AND f.clock_out >= CONCAT('2025-07-12 ', LPAD(p.plan_hour + 1, 2, '0'), ':00:00')",
      "  GROUP BY p.store_id, p.plan_hour, p.required",
      "), short AS (",
      "  SELECT store_id, plan_hour, required - staffed AS gap,",
      "         plan_hour - ROW_NUMBER() OVER (PARTITION BY store_id ORDER BY plan_hour) AS grp",
      "  FROM cover",
      "  WHERE staffed < required",
      ")",
      "SELECT store_id, MIN(plan_hour) AS from_hour, MAX(plan_hour) AS to_hour, SUM(gap) AS shortfall",
      "FROM short",
      "GROUP BY store_id, grp",
      "ORDER BY store_id, from_hour",
    ].join("\n"),
    alternatives: [
      [
        "WITH cover AS (",
        "  SELECT p.store_id, p.plan_hour,",
        "         p.required - (SELECT COUNT(*) FROM FloorShift f",
        "                       WHERE f.store_id = p.store_id",
        "                         AND f.clock_in <= DATE_ADD('2025-07-12 00:00:00', INTERVAL p.plan_hour HOUR)",
        "                         AND f.clock_out >= DATE_ADD('2025-07-12 00:00:00', INTERVAL p.plan_hour + 1 HOUR)) AS gap",
        "  FROM StaffingPlan p",
        "), flagged AS (",
        "  SELECT store_id, plan_hour, gap,",
        "         CASE WHEN LAG(plan_hour) OVER (PARTITION BY store_id ORDER BY plan_hour) = plan_hour - 1 THEN 0 ELSE 1 END AS starts",
        "  FROM cover WHERE gap > 0",
        "), numbered AS (",
        "  SELECT store_id, plan_hour, gap,",
        "         SUM(starts) OVER (PARTITION BY store_id ORDER BY plan_hour ROWS UNBOUNDED PRECEDING) AS stretch",
        "  FROM flagged",
        ")",
        "SELECT store_id, MIN(plan_hour) AS from_hour, MAX(plan_hour) AS to_hour, SUM(gap) AS shortfall",
        "FROM numbered",
        "GROUP BY store_id, stretch",
        "ORDER BY store_id, from_hour",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Start from the plan, not the shifts: every plan hour needs a covering count, even when it is 0 — a LEFT JOIN.",
      "Build the hour's boundaries as datetimes on 2025-07-12 and compare the shift's clock-in and clock-out with them.",
      "Keep only the understaffed hours, then `plan_hour - ROW_NUMBER()` is constant along a run of consecutive hours.",
      "Group by store and that difference for each stretch's first hour, last hour and total shortfall.",
    ],
    editorial: [
      "The problem has two stages: count coverage per plan hour, then merge the short hours into runs.",
      "",
      "Coverage starts from `StaffingPlan`, because an hour that nobody covered is the most understaffed of all and must still produce a row; a LEFT JOIN to the shifts and `COUNT(f.shift_id)` gives 0 there. The join condition encodes \"covers\": the shift began at or before the hour's start and ended at or after its end, both as datetimes on 2025-07-12, so a shift from the previous day — same store, same clock times — never counts. A shift that clocks out at exactly 09:00 covers the 8 o'clock hour but not the 9 o'clock one.",
      "",
      "The understaffed hours are then a **gaps-and-islands** problem. Along a run of consecutive hours, `plan_hour` and `ROW_NUMBER()` both rise by 1, so their difference is constant; a missing hour — whether staffed or simply not in the plan — changes it. Grouping by store and that difference gives each stretch, with `MIN`/`MAX` for its ends and `SUM` for the shortfall. Plan hours start at 6, so the difference never goes negative (MySQL's `ROW_NUMBER` is unsigned).",
      "",
      "The alternative counts coverage with a correlated subquery and `DATE_ADD` for the hour boundaries, and finds stretch starts with `LAG` — a new stretch whenever the previous short hour is not exactly one hour earlier — numbered by a running sum.",
    ].join("\n"),
  },

  {
    slug: "walmart-median-minutes-from-shelf-gap-to-refill",
    title: "Walmart: Median Minutes From Shelf Gap to Refill by Department",
    difficulty: "HARD",
    topics: ["Window Functions", "Subqueries", "Dates"],
    description: [
      "Walmart's replenishment analytics team measures how fast each department puts stock back once a shelf goes empty. Handheld scans record each item's shelf as `empty` or `stocked` through the day.",
      "",
      "For each store and item, take its scans in time order. A **gap** begins at an `empty` scan whose previous scan of the same store and item is not `empty` (or that has no previous scan); later consecutive `empty` scans belong to the same gap. The gap is **refilled** at the first `stocked` scan of that store and item after it began; its length is the minutes from the gap's first scan to that refill. Gaps never refilled are ignored. For each department with at least one refilled gap, return `department`, `refilled_gaps` and `median_minutes` (the median gap length; with an even count, the average of the two middle values). Order by `department`.",
    ].join("\n"),
    tables: [
      {
        name: "ShelfScan",
        columns: [
          { name: "scan_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "item_id", type: "int" },
          { name: "department", type: "varchar" },
          { name: "scanned_at", type: "datetime" },
          { name: "status", type: "enum", values: ["empty", "stocked"] },
        ],
        primaryKey: ["scan_id"],
        note: "One row per shelf scan. An item always belongs to the same department, and a store never scans one item twice at the same moment.",
      },
    ],
    examples: [
      {
        ShelfScan: [
          [1, 1204, 501, "Dairy", "2025-08-04 06:00:00", "stocked"],
          [2, 1204, 501, "Dairy", "2025-08-04 08:00:00", "empty"],
          [3, 1204, 501, "Dairy", "2025-08-04 09:00:00", "empty"],
          [4, 1204, 501, "Dairy", "2025-08-04 10:30:00", "stocked"],
          [5, 1204, 501, "Dairy", "2025-08-04 14:00:00", "empty"],
          [6, 1204, 501, "Dairy", "2025-08-04 15:00:00", "stocked"],
          [7, 1204, 502, "Dairy", "2025-08-04 07:00:00", "empty"],
          [8, 1204, 502, "Dairy", "2025-08-04 11:00:00", "stocked"],
          [9, 1204, 601, "Produce", "2025-08-04 08:00:00", "empty"],
          [10, 3318, 602, "Produce", "2025-08-04 09:00:00", "empty"],
          [11, 3318, 602, "Produce", "2025-08-04 09:45:00", "stocked"],
          [12, 3318, 602, "Produce", "2025-08-04 12:00:00", "empty"],
          [13, 3318, 602, "Produce", "2025-08-04 13:30:00", "stocked"],
        ],
      },
    ],
    gen: (rng) => {
      const DEPT_OF: Record<number, string> = { 501: "Dairy", 502: "Dairy", 601: "Produce", 602: "Produce", 701: "Frozen" };
      const rows: Cell[][] = [];
      const seen = new Set<string>();
      const combos = chance(rng, 0.05) ? 0 : ri(rng, 1, 5);
      for (let c = 0; c < combos; c++) {
        const store = pick(rng, [1204, 3318]);
        const item = pick(rng, [501, 502, 601, 602, 701]);
        if (seen.has(`${store}|${item}`)) continue;
        seen.add(`${store}|${item}`);
        let minute = ri(rng, 20, 30) * 15;
        const k = ri(rng, 2, 7);
        for (let j = 0; j < k; j++) {
          rows.push([0, store, item, DEPT_OF[item]!, at("2025-08-04", minute), chance(rng, 0.5) ? "empty" : "stocked"]);
          minute += ri(rng, 1, 16) * 15;
        }
      }
      const ids = shuffle(rng, seq(1, rows.length));
      rows.forEach((r, i) => (r[0] = ids[i]!));
      return { ShelfScan: rows };
    },
    solution: [
      "WITH s AS (",
      "  SELECT store_id, item_id, department, scanned_at, status,",
      "         LAG(status) OVER (PARTITION BY store_id, item_id ORDER BY scanned_at) AS prev_status",
      "  FROM ShelfScan",
      "), gaps AS (",
      "  SELECT g.department,",
      "         TIMESTAMPDIFF(MINUTE, g.scanned_at,",
      "           (SELECT MIN(r.scanned_at) FROM ShelfScan r",
      "            WHERE r.store_id = g.store_id AND r.item_id = g.item_id",
      "              AND r.status = 'stocked' AND r.scanned_at > g.scanned_at)) AS minutes",
      "  FROM s g",
      "  WHERE g.status = 'empty' AND (g.prev_status IS NULL OR g.prev_status <> 'empty')",
      "), ranked AS (",
      "  SELECT department, minutes,",
      "         ROW_NUMBER() OVER (PARTITION BY department ORDER BY minutes) AS rn,",
      "         COUNT(*) OVER (PARTITION BY department) AS cnt",
      "  FROM gaps",
      "  WHERE minutes IS NOT NULL",
      ")",
      "SELECT department, MAX(cnt) AS refilled_gaps, AVG(minutes) AS median_minutes",
      "FROM ranked",
      "WHERE rn IN ((cnt + 1) DIV 2, (cnt + 2) DIV 2)",
      "GROUP BY department",
      "ORDER BY department",
    ].join("\n"),
    alternatives: [
      [
        "WITH starts AS (",
        "  SELECT g.store_id, g.item_id, g.department, g.scanned_at",
        "  FROM ShelfScan g",
        "  WHERE g.status = 'empty'",
        "    AND NOT EXISTS (",
        "      SELECT 1 FROM ShelfScan p",
        "      WHERE p.store_id = g.store_id AND p.item_id = g.item_id AND p.status = 'empty'",
        "        AND p.scanned_at = (SELECT MAX(q.scanned_at) FROM ShelfScan q",
        "                            WHERE q.store_id = g.store_id AND q.item_id = g.item_id AND q.scanned_at < g.scanned_at)",
        "    )",
        "), gaps AS (",
        "  SELECT st.department, TIMESTAMPDIFF(MINUTE, st.scanned_at, MIN(r.scanned_at)) AS minutes",
        "  FROM starts st",
        "  JOIN ShelfScan r ON r.store_id = st.store_id AND r.item_id = st.item_id",
        "                  AND r.status = 'stocked' AND r.scanned_at > st.scanned_at",
        "  GROUP BY st.store_id, st.item_id, st.department, st.scanned_at",
        ")",
        "SELECT g1.department,",
        "       (SELECT COUNT(*) FROM gaps x WHERE x.department = g1.department) AS refilled_gaps,",
        "       AVG(DISTINCT g1.minutes) AS median_minutes",
        "FROM gaps g1",
        "WHERE (SELECT COUNT(*) FROM gaps a WHERE a.department = g1.department AND a.minutes <= g1.minutes) * 2",
        "        >= (SELECT COUNT(*) FROM gaps x WHERE x.department = g1.department)",
        "  AND (SELECT COUNT(*) FROM gaps b WHERE b.department = g1.department AND b.minutes >= g1.minutes) * 2",
        "        >= (SELECT COUNT(*) FROM gaps x WHERE x.department = g1.department)",
        "GROUP BY g1.department",
        "ORDER BY g1.department",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Three steps: find where each gap starts, find when it was refilled, then take a median per department.",
      "A gap starts at an `empty` scan whose previous scan — `LAG(status)` per store and item — is not `empty`.",
      "The refill is the earliest `stocked` scan of the same store and item after the start; if there is none, the gap does not count.",
      "For the median, number the lengths with `ROW_NUMBER` and keep positions `(cnt + 1) DIV 2` and `(cnt + 2) DIV 2` — one position when `cnt` is odd, two when even.",
    ],
    editorial: [
      "The scans describe states, not events, so the gaps have to be reconstructed. Ordering each store-item's scans by time, a gap starts where the status turns to `empty`: an `empty` scan whose previous status (from `LAG`) is `stocked` or missing. A run of several `empty` scans is one gap, measured from its first scan — counting each empty scan as a new gap would add shorter, overlapping gaps and pull the median down.",
      "",
      "Each gap ends at the first `stocked` scan after it starts, found by a correlated `MIN`. If the item was never restocked, the subquery returns NULL, the length is NULL, and the gap is dropped — it has no refill time to report. `TIMESTAMPDIFF(MINUTE, …)` gives the length.",
      "",
      "The median uses positions. With `cnt` lengths per department ranked by `ROW_NUMBER`, the middle positions are `(cnt + 1) DIV 2` and `(cnt + 2) DIV 2`: the same position for an odd count, the two middle ones for an even count, and `AVG` of the kept rows is the median either way. Equal lengths can take either rank without changing the answer, because their values are equal.",
      "",
      "The alternative finds starts with `NOT EXISTS` on the latest earlier scan, refills with a grouped join, and takes the median without ranking: a value is a middle value when at least half the lengths are ≤ it and at least half are ≥ it; `AVG(DISTINCT …)` of those values is the median even when the middle value repeats.",
    ].join("\n"),
  },

  {
    slug: "walmart-assigning-pallets-to-trailers-under-a-weight-limit",
    title: "Walmart: Assigning Pallets to Trailers Under a Weight Limit",
    difficulty: "HARD",
    topics: ["Subqueries", "Aggregation"],
    description: [
      "A Walmart distribution centre loads outbound pallets onto trailers strictly in loading order, and the transport planners want to know how the pallets will split across trailers before the trucks are booked. A trailer may carry at most **10,000 kg** in this exercise.",
      "",
      "Within each DC, pallets are loaded in `load_seq` order. The first pallet goes on trailer 1. Each following pallet goes on the **current** trailer if the trailer's weight plus the pallet's stays **at most 10,000 kg**; otherwise the current trailer leaves and the pallet starts the next trailer. Trailers are numbered from 1 in each DC. Return `dc_id`, `trailer_no`, `pallets` and `total_kg` for every trailer, ordered by `dc_id`, then `trailer_no`.",
    ].join("\n"),
    tables: [
      {
        name: "OutboundPallet",
        columns: [
          { name: "pallet_id", type: "int" },
          { name: "dc_id", type: "int" },
          { name: "load_seq", type: "int" },
          { name: "weight_kg", type: "int" },
        ],
        primaryKey: ["pallet_id"],
        note: "One row per pallet staged at a DC's dock. `load_seq` is unique within a DC but has gaps; every pallet weighs at most 10,000 kg.",
      },
    ],
    examples: [
      {
        OutboundPallet: [
          [1, 6011, 3, 4000],
          [2, 6011, 7, 3500],
          [3, 6011, 10, 2500],
          [4, 6011, 12, 3000],
          [5, 6011, 15, 6000],
          [6, 6011, 20, 1500],
          [7, 6094, 1, 9500],
          [8, 6094, 2, 800],
          [9, 6094, 5, 700],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const dcs = chance(rng, 0.05) ? [] : sample(rng, [6011, 6094], ri(rng, 1, 2));
      for (const dc of dcs) {
        const k = ri(rng, 1, 12);
        const seqs = sample(rng, seq(1, 40), k).sort((a, b) => a - b);
        let load = 0;
        for (const s of seqs) {
          // Now and then a pallet that fills the trailer to exactly 10,000 kg — the "at most" boundary.
          const w = load > 0 && load < 10000 && chance(rng, 0.25) ? 10000 - load : roundTo(rng, 500, 4500, 500);
          rows.push([0, dc, s, w]);
          load = load + w > 10000 ? w : load + w;
        }
      }
      const ids = shuffle(rng, seq(1, rows.length));
      rows.forEach((r, i) => (r[0] = ids[i]!));
      return { OutboundPallet: rows };
    },
    solution: [
      "WITH RECURSIVE ordered AS (",
      "  SELECT dc_id, weight_kg,",
      "         ROW_NUMBER() OVER (PARTITION BY dc_id ORDER BY load_seq) AS rn",
      "  FROM OutboundPallet",
      "), fill AS (",
      "  SELECT dc_id, rn, weight_kg, 1 AS trailer_no, weight_kg AS load_kg",
      "  FROM ordered",
      "  WHERE rn = 1",
      "  UNION ALL",
      "  SELECT o.dc_id, o.rn, o.weight_kg,",
      "         CASE WHEN f.load_kg + o.weight_kg > 10000 THEN f.trailer_no + 1 ELSE f.trailer_no END,",
      "         CASE WHEN f.load_kg + o.weight_kg > 10000 THEN o.weight_kg ELSE f.load_kg + o.weight_kg END",
      "  FROM fill f",
      "  JOIN ordered o ON o.dc_id = f.dc_id AND o.rn = f.rn + 1",
      ")",
      "SELECT dc_id, trailer_no, COUNT(*) AS pallets, SUM(weight_kg) AS total_kg",
      "FROM fill",
      "GROUP BY dc_id, trailer_no",
      "ORDER BY dc_id, trailer_no",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE walk AS (",
        "  SELECT p.dc_id, p.load_seq, p.weight_kg, 1 AS trailer_no, p.weight_kg AS room_used",
        "  FROM OutboundPallet p",
        "  WHERE p.load_seq = (SELECT MIN(q.load_seq) FROM OutboundPallet q WHERE q.dc_id = p.dc_id)",
        "  UNION ALL",
        "  SELECT n.dc_id, n.load_seq, n.weight_kg,",
        "         w.trailer_no + IF(w.room_used + n.weight_kg <= 10000, 0, 1),",
        "         IF(w.room_used + n.weight_kg <= 10000, w.room_used + n.weight_kg, n.weight_kg)",
        "  FROM walk w",
        "  JOIN OutboundPallet n",
        "    ON n.dc_id = w.dc_id",
        "   AND n.load_seq = (SELECT MIN(q.load_seq) FROM OutboundPallet q WHERE q.dc_id = w.dc_id AND q.load_seq > w.load_seq)",
        ")",
        "SELECT dc_id, trailer_no, COUNT(*) AS pallets, SUM(weight_kg) AS total_kg",
        "FROM walk",
        "GROUP BY dc_id, trailer_no",
        "ORDER BY dc_id, trailer_no",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "A running total that resets is not a window function: whether a pallet starts a new trailer depends on how the previous trailer was filled.",
      "Carry state from one pallet to the next with a recursive CTE: the current trailer number and its weight so far.",
      "Number the pallets 1, 2, 3 … per DC first (`load_seq` has gaps), so the recursive step can join to `rn + 1`.",
      "Once every pallet has a trailer number, a plain `GROUP BY` gives the counts and weights.",
    ],
    editorial: [
      "It is tempting to use a running `SUM` and divide by 10,000, but that answers a different question: it would split pallets across trailer boundaries as if weight were liquid. Here a trailer leaves *before* it would go over the limit, so the next trailer starts with the leftover space unused, and every later boundary depends on where the earlier ones fell. That chain of decisions needs **state carried from row to row**, which is what a recursive CTE does.",
      "",
      "First, `ROW_NUMBER()` numbers each DC's pallets 1, 2, 3 … in `load_seq` order, because the sequence has gaps. The anchor of the recursion is pallet 1 on trailer 1, carrying its own weight as the trailer's load. Each recursive step joins the previous pallet's state to the next pallet (`rn + 1`, same DC) and decides: if the load plus this pallet exceeds 10,000 kg, start trailer `trailer_no + 1` with this pallet's weight; otherwise stay on the trailer and add the weight. A load of exactly 10,000 kg still fits. The recursion runs per DC in parallel because the anchor has one row per DC.",
      "",
      "With a trailer number on every pallet, `GROUP BY dc_id, trailer_no` gives the pallet count and total weight. The alternative walks `load_seq` directly, finding each next pallet with a correlated `MIN`, and tracks the same state with `IF`. Both visit each pallet once, so the work is linear in the number of pallets per DC.",
    ].join("\n"),
  },
];
