import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, CITIES, chance, dateBetween, pick, ri, roundTo, sample, shuffle } from "./kit.js";

/**
 * Swiggy: the questions an analyst or data engineer at a food-and-grocery
 * delivery company is asked — Instamart dark stores and the ten-minute
 * promise, Swiggy One membership value, Genie pick-up-and-drop fares and
 * screening, Dineout reservations, delivery-partner batching, idle time,
 * online sessions and shift guarantees, rain surge fees, kitchen prep time
 * against the promise, coupon stacking, city-wide stock-outs and the Swiggy
 * Money wallet. The schemas and data are fictional — written for practice,
 * not Swiggy's own tables or figures. Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
const pad = (n: number) => String(n).padStart(2, "0");
/** 'YYYY-MM-DD HH:MM:SS' from a date and seconds after its midnight (may run into later days). */
const stamp = (date: string, secs: number): string => {
  const d = addDays(date, Math.floor(secs / 86400));
  const s = ((secs % 86400) + 86400) % 86400;
  return `${d} ${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
};
/** 'YYYY-MM-DD HH:MM:00' from a date and minutes after its midnight. */
const at = (date: string, minutes: number): string => stamp(date, minutes * 60);

const RESTAURANTS = [
  "Udupi Upahar", "Biryani Bowl House", "Tandoor Tales", "Dosa Corner", "Chaat Junction",
  "Wok Express", "Kerala Kitchen", "Momo Hub", "Paratha Point", "Rolls Republic",
] as const;
const STORES: readonly (readonly [string, string])[] = [
  ["HSR Layout", "Bengaluru"], ["Koramangala", "Bengaluru"], ["Indiranagar", "Bengaluru"],
  ["Powai", "Mumbai"], ["Andheri East", "Mumbai"], ["Bandra West", "Mumbai"],
  ["Gachibowli", "Hyderabad"], ["Madhapur", "Hyderabad"], ["Saket", "Delhi"], ["Dwarka", "Delhi"],
];
const SKUS = [
  "Aashirvaad Atta", "Amul Butter", "Banana Robusta", "Bread Loaf", "Coriander Bunch", "Curd Cup",
  "Eggs Tray", "Fresh Paneer", "Maggi Noodles", "Onion Pack", "Tomato Pack", "Toned Milk",
] as const;

export const COMPANY_SWIGGY: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "swiggy-instamart-orders-delivered-in-ten-minutes",
    title: "Swiggy: Instamart Orders Delivered Within 10 Minutes",
    difficulty: "EASY",
    topics: ["Basics", "Dates"],
    description: [
      "The Instamart operations team checks every morning which grocery orders actually kept the ten-minute promise made on the app.",
      "",
      "Return every **delivered** order whose delivery time is **at most 10 minutes**, with the columns `order_id`, `store_id` and `delivery_minutes`. `delivery_minutes` is the number of **whole minutes** between `placed_at` and `delivered_at`, rounded down — 10 minutes 40 seconds counts as 10, 11 minutes exactly counts as 11. Cancelled orders have no delivery time and are never in the answer. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "InstamartOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "placed_at", type: "datetime" },
          { name: "delivered_at", type: "datetime" },
          { name: "status", type: "enum", values: ["delivered", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per Instamart order. `delivered_at` is NULL for a cancelled order; an order may be delivered after midnight.",
      },
    ],
    examples: [
      {
        InstamartOrder: [
          [1001, 1, "2025-03-10 08:00:00", "2025-03-10 08:07:30", "delivered"],
          [1002, 1, "2025-03-10 08:05:00", "2025-03-10 08:15:40", "delivered"],
          [1003, 2, "2025-03-10 09:12:10", "2025-03-10 09:23:10", "delivered"],
          [1004, 2, "2025-03-10 09:30:00", null, "cancelled"],
          [1005, 3, "2025-03-10 23:55:00", "2025-03-11 00:04:59", "delivered"],
          [1006, 3, "2025-03-10 21:00:00", "2025-03-10 21:10:00", "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 18);
      const rows: Cell[][] = seq(1001, n).map((id) => {
        const day = dateBetween(rng, "2025-03-01", "2025-03-07");
        const start = ri(rng, 7 * 3600, 23 * 3600 + 3000);
        const cancelled = chance(rng, 0.15);
        const secs = chance(rng, 0.35) ? pick(rng, [599, 600, 659, 660, 661]) : ri(rng, 240, 1500);
        return [id, ri(rng, 1, 4), stamp(day, start), cancelled ? null : stamp(day, start + secs), cancelled ? "cancelled" : "delivered"];
      });
      return { InstamartOrder: rows };
    },
    solution: [
      "SELECT order_id, store_id, TIMESTAMPDIFF(MINUTE, placed_at, delivered_at) AS delivery_minutes",
      "FROM InstamartOrder",
      "WHERE status = 'delivered'",
      "  AND TIMESTAMPDIFF(MINUTE, placed_at, delivered_at) <= 10",
    ].join("\n"),
    alternatives: [
      "SELECT order_id, store_id, TIMESTAMPDIFF(SECOND, placed_at, delivered_at) DIV 60 AS delivery_minutes FROM InstamartOrder WHERE status = 'delivered' AND delivered_at < DATE_ADD(placed_at, INTERVAL 11 MINUTE)",
    ],
    hints: [
      "`TIMESTAMPDIFF(MINUTE, start, end)` counts whole minutes and drops the leftover seconds.",
      "Use the same expression in the SELECT list and in the filter — \"at most 10\" includes 10.",
      "A cancelled order has a NULL `delivered_at`; check the status anyway so the intent is plain.",
    ],
    editorial: [
      "Each order is judged on its own, so this is a filter on one table with one computed column. `TIMESTAMPDIFF(MINUTE, placed_at, delivered_at)` returns the number of complete minutes between the two timestamps — exactly the rounding the statement asks for, so 10 minutes 40 seconds gives 10 and stays in, while 11 minutes gives 11 and drops out. Working in timestamps rather than clock times also handles the order placed at 23:55 and delivered after midnight: the date part carries the day over.",
      "",
      "Cancelled orders have no `delivered_at`. The difference with NULL is NULL and `NULL <= 10` is not true, so they would be dropped anyway, but filtering on `status = 'delivered'` says what is meant.",
      "",
      "The alternative counts seconds and divides with `DIV 60`, which truncates the same way, and expresses the limit as \"delivered before placed_at plus 11 minutes\" — anything strictly earlier than the eleventh minute is at most 10 whole minutes. That form can use an index on the timestamps because the column is not wrapped in a function on one side. Either query is a single scan.",
    ].join("\n"),
  },

  {
    slug: "swiggy-rain-fee-collected-per-city",
    title: "Swiggy: Rain Fee Collected per City",
    difficulty: "EASY",
    topics: ["Aggregation"],
    description: [
      "When it rains, a small **rain fee** is added to food orders so delivery partners are paid more for riding in bad weather. Finance wants to know how much of it each city actually collected.",
      "",
      "For every city with at least one **delivered** order that carried a rain fee (`rain_fee > 0`), return `city`, `rain_orders` (the number of such orders) and `rain_fee_total` (the sum of their rain fees). Cancelled orders collect nothing; a `rain_fee` of 0 or NULL means no fee. Order the rows by `rain_fee_total` from highest to lowest, then by `city` alphabetically.",
    ].join("\n"),
    tables: [
      {
        name: "FoodOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "order_date", type: "date" },
          { name: "rain_fee", type: "int" },
          { name: "status", type: "enum", values: ["delivered", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per food order. `rain_fee` is in rupees; it is NULL on orders logged before the fee was recorded.",
      },
    ],
    examples: [
      {
        FoodOrder: [
          [1, "Bengaluru", "2025-07-01", 25, "delivered"],
          [2, "Bengaluru", "2025-07-01", 25, "cancelled"],
          [3, "Mumbai", "2025-07-01", 30, "delivered"],
          [4, "Mumbai", "2025-07-02", 20, "delivered"],
          [5, "Bengaluru", "2025-07-02", 25, "delivered"],
          [6, "Chennai", "2025-07-02", 0, "delivered"],
          [7, "Pune", "2025-07-03", null, "delivered"],
          [8, "Kolkata", "2025-07-03", 50, "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      const cities = sample(rng, CITIES, ri(rng, 1, 4));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 20);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        pick(rng, cities),
        dateBetween(rng, "2025-07-01", "2025-07-07"),
        pick(rng, [0, 0, 15, 20, 25, 25, 30, null]),
        pick(rng, ["delivered", "delivered", "delivered", "cancelled"]),
      ]);
      return { FoodOrder: rows };
    },
    solution: [
      "SELECT city, COUNT(*) AS rain_orders, SUM(rain_fee) AS rain_fee_total",
      "FROM FoodOrder",
      "WHERE status = 'delivered' AND rain_fee > 0",
      "GROUP BY city",
      "ORDER BY rain_fee_total DESC, city",
    ].join("\n"),
    alternatives: [
      [
        "SELECT city,",
        "       SUM(CASE WHEN status = 'delivered' AND rain_fee > 0 THEN 1 ELSE 0 END) AS rain_orders,",
        "       SUM(CASE WHEN status = 'delivered' AND rain_fee > 0 THEN rain_fee ELSE 0 END) AS rain_fee_total",
        "FROM FoodOrder",
        "GROUP BY city",
        "HAVING SUM(CASE WHEN status = 'delivered' AND rain_fee > 0 THEN 1 ELSE 0 END) > 0",
        "ORDER BY rain_fee_total DESC, city",
      ].join("\n"),
    ],
    hints: [
      "Decide which rows count before grouping: delivered, and a fee above zero.",
      "`NULL > 0` is not true, so NULL fees drop out of a WHERE filter by themselves.",
      "Two cities can collect the same total — the second sort key settles their order.",
    ],
    editorial: [
      "Filter first, then group. The rows that matter are delivered orders with `rain_fee > 0`; everything else — cancelled orders, orders with a zero fee and orders whose fee is NULL — contributes nothing and should never reach the aggregate. `NULL > 0` evaluates to NULL, which `WHERE` treats as false, so NULL fees need no special handling.",
      "",
      "After the filter, `GROUP BY city` with `COUNT(*)` and `SUM(rain_fee)` gives both numbers. A city with no qualifying order has no rows left and simply does not form a group, which is what the statement wants.",
      "",
      "The order is fixed: highest total first, and cities tied on the total alphabetically. Without the second key the tied rows could come back in any order. The alternative keeps every row and moves the condition into conditional sums, then removes the empty cities with `HAVING` — a common pattern when one report needs several differently filtered totals per group. Both are one pass over the orders.",
    ].join("\n"),
  },

  {
    slug: "swiggy-genie-fare-by-distance-slab",
    title: "Swiggy: Genie Fare by Distance Slab",
    difficulty: "EASY",
    topics: ["Conditional Logic", "Basics"],
    description: [
      "Genie picks up a parcel from one address and drops it at another. The pricing team wants the fare of every completed task recomputed from the distance slabs to audit what customers were charged.",
      "",
      "The fare is **49** rupees for a distance up to and including 3 km, **79** for more than 3 km up to and including 8 km, and above 8 km it is **79 plus 12 for every started kilometre beyond 8** (8.2 km pays one extra kilometre, 10.0 km pays two). Return `task_id`, `distance_km` and `fare` for every **completed** task, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "GenieTask",
        columns: [
          { name: "task_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "distance_km", type: "decimal" },
          { name: "status", type: "enum", values: ["completed", "cancelled"] },
        ],
        primaryKey: ["task_id"],
        note: "One row per pick-up-and-drop task. `distance_km` is the route length with one decimal place.",
      },
    ],
    examples: [
      {
        GenieTask: [
          [501, 11, 2.4, "completed"],
          [502, 12, 3.0, "completed"],
          [503, 11, 3.1, "completed"],
          [504, 13, 8.0, "completed"],
          [505, 14, 8.2, "completed"],
          [506, 12, 11.0, "completed"],
          [507, 15, 6.5, "cancelled"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 15);
      const rows: Cell[][] = seq(501, n).map((id) => [
        id,
        ri(rng, 11, 20),
        chance(rng, 0.35) ? pick(rng, [2.9, 3.0, 3.1, 8.0, 8.1, 9.0, 12.0]) : ri(rng, 5, 150) / 10,
        pick(rng, ["completed", "completed", "completed", "cancelled"]),
      ]);
      return { GenieTask: rows };
    },
    solution: [
      "SELECT task_id, distance_km,",
      "       CASE",
      "         WHEN distance_km <= 3 THEN 49",
      "         WHEN distance_km <= 8 THEN 79",
      "         ELSE 79 + 12 * CEIL(distance_km - 8)",
      "       END AS fare",
      "FROM GenieTask",
      "WHERE status = 'completed'",
    ].join("\n"),
    alternatives: [
      "SELECT task_id, distance_km, IF(distance_km <= 3, 49, IF(distance_km <= 8, 79, 79 + 12 * (CEILING(distance_km) - 8))) AS fare FROM GenieTask WHERE status = 'completed'",
    ],
    hints: [
      "A searched `CASE` checks its conditions top to bottom and stops at the first true one.",
      "\"Up to and including\" means `<=` at each boundary.",
      "\"Every started kilometre\" is a ceiling: `CEIL(distance_km - 8)`.",
    ],
    editorial: [
      "The fare is a step function of the distance, which is exactly what a searched `CASE` expresses. Because `CASE` returns the first branch whose condition is true, the branches can be written as plain upper limits in increasing order: `distance_km <= 3` catches the first slab, `distance_km <= 8` only sees tasks that already failed the first test, and `ELSE` is everything above 8 km.",
      "",
      "The boundaries are inclusive, so 3.0 km pays 49 and 8.0 km pays 79. Above 8 km the extra charge is per *started* kilometre: `CEIL(distance_km - 8)` turns 0.2 km into 1 and 3.0 km into 3. Since 8 is a whole number, `CEIL(distance_km) - 8` is the same value, which is what the alternative uses together with nested `IF`s — MySQL's shorthand for a two-way `CASE`.",
      "",
      "Cancelled tasks were never charged, so the `WHERE` clause leaves them out. The query is a single scan with no grouping.",
    ].join("\n"),
  },

  {
    slug: "swiggy-saved-addresses-without-a-valid-pincode",
    title: "Swiggy: Saved Addresses Without a Valid Pincode",
    difficulty: "EASY",
    topics: ["Strings"],
    description: [
      "Orders sent to an address with a broken pincode get routed to the wrong delivery zone, so the address-quality team wants every bad saved address listed for a fix-it prompt in the app.",
      "",
      "A pincode is **valid** when it is exactly **six digits** and does **not start with 0** — no spaces, no letters. Return `address_id`, `customer_id` and `pincode` for every saved address whose pincode is not valid, including addresses with no pincode at all (NULL). Order the rows by `address_id`.",
    ].join("\n"),
    tables: [
      {
        name: "SavedAddress",
        columns: [
          { name: "address_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "label", type: "enum", values: ["Home", "Work", "Other"] },
          { name: "pincode", type: "varchar" },
        ],
        primaryKey: ["address_id"],
        note: "One row per address a customer saved. `pincode` is stored exactly as typed, or NULL when it was left empty.",
      },
    ],
    examples: [
      {
        SavedAddress: [
          [1, 101, "Home", "560034"],
          [2, 101, "Work", "56003"],
          [3, 102, "Home", "060034"],
          [4, 103, "Other", null],
          [5, 104, "Home", "400 076"],
          [6, 105, "Work", "5600341"],
          [7, 106, "Home", "110O17"],
          [8, 107, "Home", "500081"],
        ],
      },
    ],
    gen: (rng) => {
      const valid = () => `${ri(rng, 1, 9)}${String(ri(rng, 0, 99999)).padStart(5, "0")}`;
      const broken = () => {
        const v = valid();
        return pick(rng, [v.slice(0, 5), `0${v.slice(1)}`, `${v}${ri(rng, 0, 9)}`, `${v.slice(0, 3)} ${v.slice(3)}`, `${v.slice(0, 4)}O${v.slice(5)}`, ` ${v}`, ""]);
      };
      const n = ri(rng, 2, 16);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 101, 112),
        pick(rng, ["Home", "Home", "Work", "Other"]),
        chance(rng, 0.12) ? null : chance(rng, 0.45) ? broken() : valid(),
      ]);
      return { SavedAddress: rows };
    },
    solution: [
      "SELECT address_id, customer_id, pincode",
      "FROM SavedAddress",
      "WHERE pincode IS NULL",
      "   OR pincode NOT REGEXP '^[1-9][0-9]{5}$'",
      "ORDER BY address_id",
    ].join("\n"),
    alternatives: [
      "SELECT address_id, customer_id, pincode FROM SavedAddress WHERE pincode IS NULL OR CHAR_LENGTH(pincode) <> 6 OR LEFT(pincode, 1) = '0' OR pincode REGEXP '[^0-9]' ORDER BY address_id",
      "SELECT address_id, customer_id, pincode FROM SavedAddress WHERE COALESCE(pincode REGEXP '^[1-9][0-9]{5}$', 0) = 0 ORDER BY address_id",
    ],
    ordered: true,
    hints: [
      "Describe a *valid* pincode as a pattern, then keep the rows that do not match it.",
      "`^` and `$` anchor the pattern to the whole string, so extra characters fail it.",
      "`NOT REGEXP` on a NULL is NULL, not true — handle the missing pincodes explicitly.",
    ],
    editorial: [
      "It is easier to describe a good pincode than every way of breaking one, so write the valid shape as a regular expression and negate it. `^[1-9][0-9]{5}$` reads: the string starts, one digit from 1 to 9, exactly five more digits, the string ends. The anchors matter — without them `5600341` would contain a six-digit match and pass. A space (`400 076`), a letter O typed for a zero, a leading zero or a short code all fail the pattern.",
      "",
      "The NULL rows need their own test. `pincode NOT REGEXP …` on NULL yields NULL, and `WHERE` keeps only true, so without `pincode IS NULL` the empty addresses would silently vanish from a report that is supposed to find them. The second alternative folds that into one expression with `COALESCE(…, 0) = 0`.",
      "",
      "The first alternative spells the rule out without a full pattern: wrong length, a leading zero, or any non-digit character. It is longer but shows each failure mode separately. Every version is one scan of the table.",
    ].join("\n"),
  },

  {
    slug: "swiggy-one-plans-with-no-order-placed",
    title: "Swiggy: Swiggy One Plans With No Order Placed",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "The Swiggy One membership team wants to reach members who paid for a plan and then never used it — no delivered food order at any point while the plan was active.",
      "",
      "Return `membership_id` and `customer_id` for every membership during which its customer had **no delivered order** with `order_date` between the plan's `start_date` and `end_date`, **both days included**. Cancelled orders do not count as use. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "OneMembership",
        columns: [
          { name: "membership_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "start_date", type: "date" },
          { name: "end_date", type: "date" },
        ],
        primaryKey: ["membership_id"],
        note: "One row per plan bought. A customer can buy several plans over time; they never overlap.",
      },
      {
        name: "FoodOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "order_date", type: "date" },
          { name: "status", type: "enum", values: ["delivered", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per food order, by members and non-members alike.",
      },
    ],
    examples: [
      {
        OneMembership: [
          [1, 101, "2025-01-01", "2025-03-31"],
          [2, 102, "2025-01-15", "2025-02-14"],
          [3, 101, "2025-04-01", "2025-04-30"],
          [4, 103, "2025-02-01", "2025-04-30"],
          [5, 104, "2025-03-01", "2025-03-31"],
        ],
        FoodOrder: [
          [9001, 101, "2025-03-31", "delivered"],
          [9002, 102, "2025-02-20", "delivered"],
          [9003, 103, "2025-03-10", "cancelled"],
          [9004, 104, "2025-03-01", "delivered"],
          [9005, 101, "2025-05-02", "delivered"],
          [9006, 105, "2025-03-05", "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      const plans: Cell[][] = [];
      let mid = 1;
      for (const c of seq(101, ri(rng, 1, 5))) {
        let start = dateBetween(rng, "2025-01-01", "2025-02-15");
        for (let k = ri(rng, 1, 2); k > 0; k--) {
          const end = addDays(start, pick(rng, [29, 89]) as number);
          plans.push([mid++, c, start, end]);
          start = addDays(end, ri(rng, 1, 25));
        }
      }
      const orders: Cell[][] = [];
      let oid = 9001;
      for (let k = ri(rng, 0, 12); k > 0; k--) {
        const p = chance(rng, 0.4) && plans.length ? pick(rng, plans) : null;
        const date = p ? pick(rng, [p[2], p[3], addDays(p[2] as string, -1), addDays(p[3] as string, 1)]) : dateBetween(rng, "2024-12-20", "2025-09-30");
        orders.push([oid++, p ? p[1] : ri(rng, 101, 106), date, pick(rng, ["delivered", "delivered", "cancelled"])]);
      }
      return { OneMembership: shuffle(rng, plans), FoodOrder: orders };
    },
    solution: [
      "SELECT m.membership_id, m.customer_id",
      "FROM OneMembership m",
      "WHERE NOT EXISTS (",
      "  SELECT 1 FROM FoodOrder o",
      "  WHERE o.customer_id = m.customer_id",
      "    AND o.status = 'delivered'",
      "    AND o.order_date BETWEEN m.start_date AND m.end_date",
      ")",
    ].join("\n"),
    alternatives: [
      [
        "SELECT m.membership_id, m.customer_id",
        "FROM OneMembership m",
        "LEFT JOIN FoodOrder o ON o.customer_id = m.customer_id AND o.status = 'delivered'",
        "  AND o.order_date >= m.start_date AND o.order_date <= m.end_date",
        "WHERE o.order_id IS NULL",
      ].join("\n"),
      [
        "SELECT membership_id, customer_id FROM OneMembership",
        "WHERE membership_id NOT IN (",
        "  SELECT m.membership_id FROM OneMembership m JOIN FoodOrder o",
        "    ON o.customer_id = m.customer_id AND o.status = 'delivered' AND o.order_date BETWEEN m.start_date AND m.end_date",
        ")",
      ].join("\n"),
    ],
    hints: [
      "This is an anti join: keep a membership when *no* matching order exists.",
      "An order matches a membership when it is the same customer, delivered, and dated inside the plan.",
      "With a LEFT JOIN, every match condition must sit in the ON clause, not in WHERE.",
    ],
    editorial: [
      "The question is about absence: a membership qualifies when no order of a certain kind exists for it. `NOT EXISTS` states that directly. For each membership the subquery looks for a delivered order by the same customer whose date falls between `start_date` and `end_date`; `BETWEEN` is inclusive, so an order on the plan's first or last day counts as use, and an order one day outside does not.",
      "",
      "The `LEFT JOIN … IS NULL` alternative is the same idea in join form. Every condition that defines a match — status and the date window — must be inside `ON`. Put the status test in `WHERE` instead and the NULL-extended rows of unused plans would be thrown away, emptying the answer. The `NOT IN` version first collects the memberships that *were* used and keeps the rest; it is safe here because `membership_id` is never NULL.",
      "",
      "Cancelled orders and orders by customers who never joined are simply never matched. With an index on `FoodOrder(customer_id, order_date)` each membership is checked with a short range lookup.",
    ].join("\n"),
  },

  {
    slug: "swiggy-packaging-charges-above-the-per-item-cap",
    title: "Swiggy: Packaging Charges Above the Per-Item Cap",
    difficulty: "EASY",
    topics: ["Joins", "Basics"],
    description: [
      "Restaurants may add a packaging charge to an order, but each partner restaurant agreed to a cap **per item** in its contract. The restaurant-ops team wants every order that went over.",
      "",
      "An order's allowed charge is `packaging_cap_per_item × item_count`. Return `order_id`, `restaurant_name`, `packaging_charge` and `excess_charge` (the charge minus the allowed amount) for every order whose packaging charge is **strictly greater** than the allowed amount. Restaurants with no agreed cap (NULL) are never flagged. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Restaurant",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "restaurant_name", type: "varchar" },
          { name: "packaging_cap_per_item", type: "int" },
        ],
        primaryKey: ["restaurant_id"],
        note: "One row per partner restaurant. `packaging_cap_per_item` is in rupees, or NULL while the contract is being renegotiated.",
      },
      {
        name: "FoodOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "item_count", type: "int" },
          { name: "packaging_charge", type: "int" },
        ],
        primaryKey: ["order_id"],
        note: "One row per order; `item_count` is the number of items in it, always at least 1.",
      },
    ],
    examples: [
      {
        Restaurant: [
          [1, "Udupi Upahar", 10],
          [2, "Biryani Bowl House", 15],
          [3, "Wok Express", null],
          [4, "Momo Hub", 8],
        ],
        FoodOrder: [
          [201, 1, 3, 30],
          [202, 1, 2, 25],
          [203, 2, 4, 75],
          [204, 3, 5, 90],
          [205, 4, 1, 8],
          [206, 4, 3, 30],
          [207, 2, 1, 10],
        ],
      },
    ],
    gen: (rng) => {
      const rests: Cell[][] = sample(rng, RESTAURANTS, ri(rng, 1, 5)).map((name, i) => [i + 1, name, chance(rng, 0.2) ? null : pick(rng, [5, 8, 10, 12, 15])]);
      const orders: Cell[][] = seq(201, ri(rng, 1, 15)).map((id) => {
        const r = pick(rng, rests);
        const items = ri(rng, 1, 6);
        const cap = r[2] as number | null;
        const charge = cap === null ? roundTo(rng, 0, 90, 5) : Math.max(0, cap * items + pick(rng, [-5, 0, 0, 2, 5, 10]));
        return [id, r[0], items, charge];
      });
      return { Restaurant: rests, FoodOrder: orders };
    },
    solution: [
      "SELECT o.order_id, r.restaurant_name, o.packaging_charge,",
      "       o.packaging_charge - r.packaging_cap_per_item * o.item_count AS excess_charge",
      "FROM FoodOrder o",
      "JOIN Restaurant r ON r.restaurant_id = o.restaurant_id",
      "WHERE o.packaging_charge > r.packaging_cap_per_item * o.item_count",
    ].join("\n"),
    alternatives: [
      [
        "SELECT order_id, restaurant_name, packaging_charge, excess_charge FROM (",
        "  SELECT o.order_id, r.restaurant_name, o.packaging_charge,",
        "         o.packaging_charge - r.packaging_cap_per_item * o.item_count AS excess_charge",
        "  FROM FoodOrder o, Restaurant r WHERE r.restaurant_id = o.restaurant_id",
        ") t WHERE excess_charge > 0",
      ].join("\n"),
    ],
    hints: [
      "The cap lives on the restaurant and the charge on the order — join them.",
      "Compare the charge with the cap multiplied by the number of items.",
      "Arithmetic with NULL gives NULL, and a NULL comparison is never true.",
    ],
    editorial: [
      "Each order needs one value from its restaurant — the per-item cap — so an inner join on `restaurant_id` puts the two side by side. The allowed charge is the cap times `item_count`, and an order is flagged only when its packaging charge is strictly greater; charging exactly the allowed amount is within the contract.",
      "",
      "Restaurants with a NULL cap need no special case. `NULL * item_count` is NULL, `packaging_charge > NULL` is NULL, and `WHERE` keeps only true rows, so their orders are never flagged — the behaviour the statement asks for. Writing `COALESCE(cap, 0)` would be a bug here: it would flag every order of those restaurants.",
      "",
      "The excess is the same difference in the SELECT list. The alternative computes it once in a derived table and filters on `excess_charge > 0`, which is equivalent because `charge - allowed > 0` exactly when `charge > allowed`, and NULL excesses fail the test the same way. Both are a join through the restaurant's primary key, linear in the number of orders.",
    ].join("\n"),
  },

  {
    slug: "swiggy-dineout-restaurants-with-repeat-no-shows",
    title: "Swiggy: Dineout Restaurants With Repeat No-Shows",
    difficulty: "EASY",
    topics: ["Aggregation", "Joins"],
    description: [
      "A Dineout table reservation that the guests never turn up for leaves the restaurant with empty seats on a busy evening. The partnerships team wants the restaurants hit by no-shows more than once.",
      "",
      "For every restaurant with **at least two** reservations marked `no_show`, return `restaurant_name`, `city`, `no_show_bookings` (how many) and `no_show_guests` (the total `party_size` of those reservations). Honoured and cancelled reservations do not count. Order by `no_show_guests` from highest to lowest, then by `restaurant_name`.",
    ].join("\n"),
    tables: [
      {
        name: "DineoutRestaurant",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "restaurant_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["restaurant_id"],
        note: "One row per restaurant that takes table reservations. Names are unique.",
      },
      {
        name: "DineoutBooking",
        columns: [
          { name: "booking_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "slot_date", type: "date" },
          { name: "party_size", type: "int" },
          { name: "status", type: "enum", values: ["honoured", "no_show", "cancelled"] },
        ],
        primaryKey: ["booking_id"],
        note: "One row per table reservation; `party_size` is the number of guests booked.",
      },
    ],
    examples: [
      {
        DineoutRestaurant: [
          [1, "Tandoor Tales", "Delhi"],
          [2, "Kerala Kitchen", "Kochi"],
          [3, "Chaat Junction", "Jaipur"],
          [4, "Wok Express", "Pune"],
        ],
        DineoutBooking: [
          [1, 1, "2025-05-02", 4, "no_show"],
          [2, 1, "2025-05-03", 2, "honoured"],
          [3, 1, "2025-05-09", 6, "no_show"],
          [4, 2, "2025-05-02", 3, "no_show"],
          [5, 2, "2025-05-04", 2, "cancelled"],
          [6, 3, "2025-05-10", 5, "no_show"],
          [7, 3, "2025-05-11", 5, "no_show"],
          [8, 4, "2025-05-10", 8, "honoured"],
        ],
      },
    ],
    gen: (rng) => {
      const rests: Cell[][] = sample(rng, RESTAURANTS, ri(rng, 2, 5)).map((name, i) => [i + 1, name, pick(rng, CITIES)]);
      const bookings: Cell[][] = seq(1, ri(rng, 0, 22)).map((id) => [
        id,
        ri(rng, 1, rests.length),
        dateBetween(rng, "2025-05-01", "2025-05-31"),
        ri(rng, 2, 8),
        pick(rng, ["honoured", "honoured", "no_show", "no_show", "cancelled"]),
      ]);
      return { DineoutRestaurant: rests, DineoutBooking: bookings };
    },
    solution: [
      "SELECT r.restaurant_name, r.city, COUNT(*) AS no_show_bookings, SUM(b.party_size) AS no_show_guests",
      "FROM DineoutRestaurant r",
      "JOIN DineoutBooking b ON b.restaurant_id = r.restaurant_id",
      "WHERE b.status = 'no_show'",
      "GROUP BY r.restaurant_id, r.restaurant_name, r.city",
      "HAVING COUNT(*) >= 2",
      "ORDER BY no_show_guests DESC, r.restaurant_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT r.restaurant_name, r.city, t.no_show_bookings, t.no_show_guests",
        "FROM DineoutRestaurant r",
        "JOIN (SELECT restaurant_id, SUM(status = 'no_show') AS no_show_bookings,",
        "             SUM(CASE WHEN status = 'no_show' THEN party_size ELSE 0 END) AS no_show_guests",
        "      FROM DineoutBooking GROUP BY restaurant_id) t ON t.restaurant_id = r.restaurant_id",
        "WHERE t.no_show_bookings >= 2",
        "ORDER BY t.no_show_guests DESC, r.restaurant_name",
      ].join("\n"),
    ],
    hints: [
      "Keep only the no-show reservations, then group them by restaurant.",
      "A condition on a count belongs in HAVING, after the grouping.",
      "Two restaurants can lose the same number of guests — break the tie by name.",
    ],
    editorial: [
      "Filter, group, then filter the groups. `WHERE b.status = 'no_show'` keeps only the reservations the question is about, so `COUNT(*)` per restaurant is the number of no-shows and `SUM(party_size)` the guests who never came. The condition \"at least two\" is about a group, not a row, so it goes in `HAVING COUNT(*) >= 2`, which runs after the grouping; a restaurant with a single no-show forms a group of one and is dropped there.",
      "",
      "Grouping by `restaurant_id` as well as the name and city keeps the select list legal under MySQL's ONLY_FULL_GROUP_BY and would keep two restaurants apart even if they shared a name. The output order is total guests descending, and `restaurant_name` settles restaurants with the same total.",
      "",
      "The alternative aggregates every reservation first, counting no-shows with `SUM(status = 'no_show')` — a comparison is 1 or 0 in MySQL — and filters the derived table afterwards. Both read the reservations once.",
    ].join("\n"),
  },

  {
    slug: "swiggy-kitchens-that-overshot-promised-prep-time",
    title: "Swiggy: Kitchens That Overshot the Promised Prep Time",
    difficulty: "EASY",
    topics: ["Joins", "Dates"],
    description: [
      "Every restaurant promises a preparation time, which the app uses to time the delivery partner's arrival. When the kitchen runs late the partner waits at the counter, so the restaurant-ops team tracks each overshoot.",
      "",
      "An order's prep time is the minutes from `accepted_at` to `food_ready_at` (times are recorded to the minute). Return `order_id`, `restaurant_name`, `prep_minutes` and `overshoot_minutes` (prep time minus the restaurant's `promised_prep_minutes`) for every order whose prep time is **strictly longer** than promised. Orders never marked ready (`food_ready_at` NULL) are left out. Order by `overshoot_minutes` descending, then `order_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Restaurant",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "restaurant_name", type: "varchar" },
          { name: "promised_prep_minutes", type: "int" },
        ],
        primaryKey: ["restaurant_id"],
        note: "One row per restaurant, with the prep time it promises for every order.",
      },
      {
        name: "KitchenTicket",
        columns: [
          { name: "order_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "accepted_at", type: "datetime" },
          { name: "food_ready_at", type: "datetime" },
        ],
        primaryKey: ["order_id"],
        note: "One row per order the kitchen accepted. `food_ready_at` is NULL when staff never pressed \"food ready\".",
      },
    ],
    examples: [
      {
        Restaurant: [
          [1, "Dosa Corner", 12],
          [2, "Biryani Bowl House", 20],
          [3, "Rolls Republic", 10],
        ],
        KitchenTicket: [
          [301, 1, "2025-06-01 12:00:00", "2025-06-01 12:15:00"],
          [302, 1, "2025-06-01 12:10:00", "2025-06-01 12:22:00"],
          [303, 2, "2025-06-01 13:00:00", "2025-06-01 13:26:00"],
          [304, 2, "2025-06-01 13:05:00", null],
          [305, 3, "2025-06-01 23:55:00", "2025-06-02 00:08:00"],
          [306, 3, "2025-06-01 20:00:00", "2025-06-01 20:08:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rests: Cell[][] = sample(rng, RESTAURANTS, ri(rng, 1, 4)).map((name, i) => [i + 1, name, pick(rng, [10, 12, 15, 20])]);
      const tickets: Cell[][] = seq(301, ri(rng, 1, 15)).map((id) => {
        const r = pick(rng, rests);
        const day = dateBetween(rng, "2025-06-01", "2025-06-03");
        const start = ri(rng, 11 * 60, 23 * 60 + 50);
        const prep = (r[2] as number) + pick(rng, [-4, -1, 0, 0, 1, 3, 3, 7, 12]);
        return [id, r[0], at(day, start), chance(rng, 0.1) ? null : at(day, start + prep)];
      });
      return { Restaurant: rests, KitchenTicket: tickets };
    },
    solution: [
      "SELECT k.order_id, r.restaurant_name,",
      "       TIMESTAMPDIFF(MINUTE, k.accepted_at, k.food_ready_at) AS prep_minutes,",
      "       TIMESTAMPDIFF(MINUTE, k.accepted_at, k.food_ready_at) - r.promised_prep_minutes AS overshoot_minutes",
      "FROM KitchenTicket k",
      "JOIN Restaurant r ON r.restaurant_id = k.restaurant_id",
      "WHERE TIMESTAMPDIFF(MINUTE, k.accepted_at, k.food_ready_at) > r.promised_prep_minutes",
      "ORDER BY overshoot_minutes DESC, k.order_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT order_id, restaurant_name, prep_minutes, prep_minutes - promised_prep_minutes AS overshoot_minutes",
        "FROM (SELECT k.order_id, r.restaurant_name, r.promised_prep_minutes,",
        "             TIMESTAMPDIFF(MINUTE, k.accepted_at, k.food_ready_at) AS prep_minutes",
        "      FROM KitchenTicket k JOIN Restaurant r ON r.restaurant_id = k.restaurant_id",
        "      WHERE k.food_ready_at IS NOT NULL) t",
        "WHERE prep_minutes > promised_prep_minutes",
        "ORDER BY overshoot_minutes DESC, order_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`TIMESTAMPDIFF(MINUTE, a, b)` gives the minutes between two timestamps, even across midnight.",
      "The promise is on the restaurant row — join to it.",
      "Equal to the promise is on time; only strictly longer is an overshoot.",
    ],
    editorial: [
      "Two facts meet in each row: the order's actual prep time, computed from its two timestamps, and the restaurant's promise, stored on the restaurant. An inner join on `restaurant_id` brings them together, and `TIMESTAMPDIFF(MINUTE, accepted_at, food_ready_at)` measures the prep time. Using full timestamps rather than clock times matters for the ticket accepted at 23:55 and ready after midnight — the date rolls over and the difference stays correct.",
      "",
      "The filter keeps prep times strictly greater than the promise; a kitchen that is exactly on time is not late. Tickets never marked ready have a NULL `food_ready_at`, so the difference is NULL and the comparison fails, dropping them without an extra condition (the alternative states `IS NOT NULL` explicitly and computes the minutes once in a derived table).",
      "",
      "The output is ordered by the overshoot, biggest first, and `order_id` breaks ties so the order is fully determined. The work is one join through the restaurant's key.",
    ].join("\n"),
  },

  // ──────────────────────────── MEDIUM ────────────────────────────
  {
    slug: "swiggy-share-of-partner-orders-delivered-in-a-batch",
    title: "Swiggy: Share of Each Partner's Orders Delivered in a Batch",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Conditional Logic", "Subqueries"],
    description: [
      "To save rides, the dispatch system sometimes hands one delivery partner two or three nearby orders on a single trip — a **batched** trip. The fleet team wants to know how much of each partner's work came batched.",
      "",
      "A trip is batched when it carried **two or more** orders. For every partner, return `partner_id`, `total_orders`, `batched_orders` (orders that rode on a batched trip) and `batched_pct`, the batched share as a percentage of the partner's orders **rounded to one decimal place**. Order the rows by `partner_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Delivery",
        columns: [
          { name: "order_id", type: "int" },
          { name: "partner_id", type: "int" },
          { name: "trip_id", type: "int" },
          { name: "delivered_at", type: "datetime" },
        ],
        primaryKey: ["order_id"],
        note: "One row per delivered order. `trip_id` names the trip that carried it; every order of a trip has the same partner.",
      },
    ],
    examples: [
      {
        Delivery: [
          [1, 7, 1, "2025-04-01 12:20:00"],
          [2, 7, 1, "2025-04-01 12:26:00"],
          [3, 7, 2, "2025-04-01 13:05:00"],
          [4, 7, 3, "2025-04-01 13:40:00"],
          [5, 8, 4, "2025-04-01 19:10:00"],
          [6, 8, 4, "2025-04-01 19:14:00"],
          [7, 8, 4, "2025-04-01 19:21:00"],
          [8, 9, 5, "2025-04-01 09:30:00"],
          [9, 9, 6, "2025-04-01 10:15:00"],
          [10, 10, 7, "2025-04-01 20:00:00"],
          [11, 10, 7, "2025-04-01 20:09:00"],
          [12, 10, 8, "2025-04-01 21:02:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let oid = 1;
      let tid = 1;
      for (const partner of seq(7, ri(rng, 1, 5))) {
        for (let t = ri(rng, 1, 5); t > 0; t--) {
          const trip = tid++;
          const day = dateBetween(rng, "2025-04-01", "2025-04-03");
          let m = ri(rng, 9 * 60, 21 * 60);
          for (let k = pick(rng, [1, 1, 1, 2, 2, 3]); k > 0; k--) {
            m += ri(rng, 3, 12);
            rows.push([oid++, partner, trip, at(day, m)]);
          }
        }
      }
      return { Delivery: shuffle(rng, rows) };
    },
    solution: [
      "WITH trip_size AS (",
      "  SELECT trip_id, COUNT(*) AS orders_on_trip FROM Delivery GROUP BY trip_id",
      ")",
      "SELECT d.partner_id,",
      "       COUNT(*) AS total_orders,",
      "       SUM(CASE WHEN t.orders_on_trip >= 2 THEN 1 ELSE 0 END) AS batched_orders,",
      "       ROUND(100 * SUM(CASE WHEN t.orders_on_trip >= 2 THEN 1 ELSE 0 END) / COUNT(*), 1) AS batched_pct",
      "FROM Delivery d",
      "JOIN trip_size t ON t.trip_id = d.trip_id",
      "GROUP BY d.partner_id",
      "ORDER BY d.partner_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT partner_id, COUNT(*) AS total_orders, SUM(batched) AS batched_orders, ROUND(100 * SUM(batched) / COUNT(*), 1) AS batched_pct",
        "FROM (SELECT partner_id, IF(COUNT(*) OVER (PARTITION BY trip_id) >= 2, 1, 0) AS batched FROM Delivery) x",
        "GROUP BY partner_id",
        "ORDER BY partner_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Whether an order was batched depends on how many orders share its trip — count orders per trip first.",
      "Then each order row can carry a 1 or 0 for \"batched\", and the partner's numbers are sums.",
      "Multiply by 100 before dividing, and round only the final percentage.",
    ],
    editorial: [
      "The fact that decides each row — was this order batched? — lives one level up, on the trip. So the query works in two steps. First count orders per trip (`trip_size`); a trip with two or more is batched. Then join that count back to every order and aggregate per partner: `COUNT(*)` is the partner's orders, and a conditional sum `SUM(CASE WHEN orders_on_trip >= 2 THEN 1 ELSE 0 END)` counts the ones that rode on a batched trip.",
      "",
      "The percentage is `100 * batched / total`, rounded to one decimal at the end. MySQL's `/` is decimal division, so there is no integer truncation to guard against; rounding intermediate values would only add error. A partner who never batched gets 0.0 rather than disappearing, because the conditional sum adds zeros instead of filtering rows out.",
      "",
      "The alternative replaces the grouped CTE with a window: `COUNT(*) OVER (PARTITION BY trip_id)` attaches the trip's size to each order row without collapsing anything, and the outer query sums the flags. Both read the deliveries twice at most and are linear apart from the grouping sort.",
    ].join("\n"),
  },

  {
    slug: "swiggy-instamart-skus-out-of-stock-across-a-city",
    title: "Swiggy: Instamart SKUs Out of Stock Across a Whole City",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Subqueries", "Joins"],
    description: [
      "An item missing from one dark store is a local problem; an item missing from **every** dark store in a city means nobody there can order it, and the category team escalates it to the supplier.",
      "",
      "From the latest stock snapshot, return `city` and `sku_name` for every SKU that is **listed at every dark store of the city** (each store has a stock row for it) and has `qty_on_hand = 0` at **all** of them. A SKU some store of the city does not list at all is not a city-wide stock-out. Order the rows by `city`, then `sku_name`.",
    ].join("\n"),
    tables: [
      {
        name: "DarkStore",
        columns: [
          { name: "store_id", type: "int" },
          { name: "store_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["store_id"],
        note: "One row per Instamart dark store.",
      },
      {
        name: "Sku",
        columns: [
          { name: "sku_id", type: "int" },
          { name: "sku_name", type: "varchar" },
        ],
        primaryKey: ["sku_id"],
        note: "One row per catalogue item. Names are unique.",
      },
      {
        name: "StoreStock",
        columns: [
          { name: "store_id", type: "int" },
          { name: "sku_id", type: "int" },
          { name: "qty_on_hand", type: "int" },
        ],
        primaryKey: ["store_id", "sku_id"],
        note: "One row per SKU a store lists, with the units on its shelves at snapshot time.",
      },
    ],
    examples: [
      {
        DarkStore: [
          [1, "HSR Layout", "Bengaluru"],
          [2, "Koramangala", "Bengaluru"],
          [3, "Powai", "Mumbai"],
        ],
        Sku: [
          [1, "Amul Butter"],
          [2, "Toned Milk"],
          [3, "Fresh Paneer"],
          [4, "Eggs Tray"],
        ],
        StoreStock: [
          [1, 1, 0],
          [2, 1, 0],
          [1, 2, 0],
          [2, 2, 5],
          [1, 3, 0],
          [3, 1, 0],
          [3, 2, 4],
          [1, 4, 0],
          [2, 4, 0],
          [3, 4, 0],
        ],
      },
    ],
    gen: (rng) => {
      const stores: Cell[][] = sample(rng, STORES, ri(rng, 1, 5)).map(([name, city], i) => [i + 1, name, city]);
      const skus: Cell[][] = sample(rng, SKUS, ri(rng, 2, 5)).map((name, i) => [i + 1, name]);
      const stock: Cell[][] = [];
      const allZero = new Set(skus.filter(() => chance(rng, 0.35)).map((s) => s[0]));
      for (const s of stores) {
        for (const k of skus) {
          if (chance(rng, 0.15)) continue;
          stock.push([s[0], k[0], allZero.has(k[0]) || chance(rng, 0.5) ? 0 : ri(rng, 1, 20)]);
        }
      }
      return { DarkStore: stores, Sku: skus, StoreStock: shuffle(rng, stock) };
    },
    solution: [
      "SELECT d.city, k.sku_name",
      "FROM StoreStock s",
      "JOIN DarkStore d ON d.store_id = s.store_id",
      "JOIN Sku k ON k.sku_id = s.sku_id",
      "GROUP BY d.city, k.sku_id, k.sku_name",
      "HAVING MAX(s.qty_on_hand) = 0",
      "   AND COUNT(*) = (SELECT COUNT(*) FROM DarkStore d2 WHERE d2.city = d.city)",
      "ORDER BY d.city, k.sku_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT DISTINCT d.city, k.sku_name",
        "FROM DarkStore d CROSS JOIN Sku k",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM DarkStore s",
        "  WHERE s.city = d.city",
        "    AND NOT EXISTS (SELECT 1 FROM StoreStock st WHERE st.store_id = s.store_id AND st.sku_id = k.sku_id AND st.qty_on_hand = 0)",
        ")",
        "ORDER BY d.city, k.sku_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Group the stock rows by city and SKU — each group holds one row per store that lists the SKU.",
      "\"Zero everywhere\" is a statement about the largest quantity in the group.",
      "\"Every store\" means the group's size equals the number of stores in that city.",
    ],
    editorial: [
      "This is relational division: a (city, SKU) pair qualifies only if it holds for *every* store of the city. Joining the stock rows to their stores and grouping by city and SKU gives one group per pair, with one row per store that lists the SKU (the primary key guarantees no duplicates). Two conditions on the group finish the job: `MAX(qty_on_hand) = 0` says no store has a single unit, and `COUNT(*)` equal to the number of stores in the city says no store is missing from the group. A SKU listed at only some stores fails the count, even if it is zero wherever it appears.",
      "",
      "The alternative is the textbook double negation: keep a (city, SKU) pair when there is **no** store in the city for which there is **no** zero-quantity row of that SKU. It starts from every city crossed with every SKU, so it does not even need the SKU to appear in the stock table — the inner `NOT EXISTS` fails for any store without the row.",
      "",
      "The grouping version scans the stock once and runs the store count per group; the double negation does nested lookups and benefits from the `(store_id, sku_id)` key. Both return sorted by city, then name.",
    ].join("\n"),
  },

  {
    slug: "swiggy-one-plans-that-paid-for-themselves",
    title: "Swiggy: Swiggy One Plans That Paid for Themselves",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Dates"],
    description: [
      "A Swiggy One member gets free delivery, and each order records the delivery fee that was waived. The membership team calls a plan **paid off** when the fees waived during it reach the price of the plan.",
      "",
      "For every membership whose customer's **delivered** orders dated from `start_date` to `end_date` (both included) waived **at least** the plan's `plan_fee` in total, return `membership_id`, `customer_id`, `plan_fee` and `fees_waived`. Cancelled orders waive nothing. Order the rows by `membership_id`.",
    ].join("\n"),
    tables: [
      {
        name: "OneMembership",
        columns: [
          { name: "membership_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "start_date", type: "date" },
          { name: "end_date", type: "date" },
          { name: "plan_fee", type: "int" },
        ],
        primaryKey: ["membership_id"],
        note: "One row per plan bought; a customer's plans never overlap. `plan_fee` is what the customer paid, in rupees.",
      },
      {
        name: "FoodOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "order_date", type: "date" },
          { name: "status", type: "enum", values: ["delivered", "cancelled"] },
          { name: "fee_waived", type: "int" },
        ],
        primaryKey: ["order_id"],
        note: "One row per food order. `fee_waived` is the delivery fee the membership saved on it, in rupees.",
      },
    ],
    examples: [
      {
        OneMembership: [
          [1, 101, "2025-01-01", "2025-03-31", 299],
          [2, 102, "2025-01-01", "2025-01-31", 149],
          [3, 103, "2025-02-01", "2025-04-30", 299],
          [4, 101, "2025-04-01", "2025-06-30", 299],
        ],
        FoodOrder: [
          [1, 101, "2025-01-05", "delivered", 120],
          [2, 101, "2025-02-11", "delivered", 99],
          [3, 101, "2025-03-31", "delivered", 80],
          [4, 101, "2025-03-15", "cancelled", 70],
          [5, 101, "2025-04-20", "delivered", 45],
          [6, 102, "2025-01-05", "delivered", 49],
          [7, 102, "2025-01-20", "delivered", 59],
          [8, 102, "2025-01-31", "delivered", 45],
          [9, 102, "2025-02-01", "delivered", 50],
        ],
      },
    ],
    gen: (rng) => {
      const plans: Cell[][] = [];
      const orders: Cell[][] = [];
      let mid = 1;
      let oid = 1;
      for (const c of seq(101, ri(rng, 1, 4))) {
        let start = dateBetween(rng, "2025-01-01", "2025-02-10");
        for (let k = ri(rng, 1, 2); k > 0; k--) {
          const long = chance(rng, 0.4);
          const end = addDays(start, long ? 89 : 30);
          plans.push([mid++, c, start, end, long ? 299 : 149]);
          for (let j = ri(rng, 1, long ? 8 : 5); j > 0; j--) {
            const date = chance(rng, 0.2) ? pick(rng, [start, end, addDays(end, 1)]) : addDays(start, ri(rng, 0, long ? 89 : 30));
            orders.push([oid++, c, date, chance(rng, 0.15) ? "cancelled" : "delivered", pick(rng, [29, 39, 49, 59, 69, 99])]);
          }
          start = addDays(end, ri(rng, 1, 20));
        }
      }
      return { OneMembership: plans, FoodOrder: shuffle(rng, orders) };
    },
    solution: [
      "SELECT m.membership_id, m.customer_id, m.plan_fee, SUM(o.fee_waived) AS fees_waived",
      "FROM OneMembership m",
      "JOIN FoodOrder o ON o.customer_id = m.customer_id",
      "  AND o.status = 'delivered'",
      "  AND o.order_date BETWEEN m.start_date AND m.end_date",
      "GROUP BY m.membership_id, m.customer_id, m.plan_fee",
      "HAVING SUM(o.fee_waived) >= m.plan_fee",
      "ORDER BY m.membership_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT membership_id, customer_id, plan_fee, fees_waived FROM (",
        "  SELECT m.membership_id, m.customer_id, m.plan_fee,",
        "         (SELECT COALESCE(SUM(o.fee_waived), 0) FROM FoodOrder o",
        "          WHERE o.customer_id = m.customer_id AND o.status = 'delivered'",
        "            AND o.order_date >= m.start_date AND o.order_date <= m.end_date) AS fees_waived",
        "  FROM OneMembership m",
        ") t",
        "WHERE fees_waived >= plan_fee",
        "ORDER BY membership_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Each order belongs to the membership of the same customer whose window contains the order date.",
      "Put the date window and the status in the join condition, then group per membership.",
      "\"Reach the price\" includes being exactly equal to it.",
    ],
    editorial: [
      "An order is matched to a membership by a **range join**: same customer, and the order date between the plan's start and end. Adding `status = 'delivered'` to the same `ON` clause keeps cancelled orders out. After the join every membership row is repeated once per qualifying order, so grouping by membership and summing `fee_waived` gives the savings of that plan, and `HAVING SUM(fee_waived) >= plan_fee` keeps the plans that paid off — equality counts, as the statement says \"at least\".",
      "",
      "The plans of one customer never overlap, so no order can be counted towards two memberships. A membership with no delivered orders forms no group at all under the inner join; it could never have paid off anyway, since every plan costs something.",
      "",
      "The alternative computes the savings per membership with a correlated scalar subquery (with `COALESCE` so an unused plan shows 0 rather than NULL) and filters in an outer query. It is easier to read as \"for each plan, add up its savings\" and with an index on `FoodOrder(customer_id, order_date)` each lookup is a short range scan; the join-and-group version does the same work in one pass.",
    ].join("\n"),
  },

  {
    slug: "swiggy-orders-that-stacked-two-platform-coupons",
    title: "Swiggy: Orders That Stacked Two Platform Coupons",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Strings"],
    description: [
      "At checkout a customer may combine one **platform** coupon (funded by the app) with restaurant and bank-card offers, but never two platform coupons. A checkout bug let some orders through with more, and the growth team needs the list to recover the money.",
      "",
      "For every order that applied **two or more** coupons of type `platform`, return `order_id`, `platform_coupons` — the platform coupon codes in alphabetical order joined by a comma and a space (`', '`) — and `platform_discount`, the total discount of those platform coupons. Restaurant and payment coupons are ignored entirely. Order the rows by `order_id`.",
    ].join("\n"),
    tables: [
      {
        name: "CouponUse",
        columns: [
          { name: "order_id", type: "int" },
          { name: "coupon_code", type: "varchar" },
          { name: "coupon_type", type: "enum", values: ["platform", "restaurant", "payment"] },
          { name: "discount", type: "int" },
        ],
        primaryKey: ["order_id", "coupon_code"],
        note: "One row per coupon applied to an order, with the rupees it took off. Codes are upper-case letters and digits.",
      },
    ],
    examples: [
      {
        CouponUse: [
          [7001, "WELCOME50", "platform", 50],
          [7001, "HDFC150", "payment", 150],
          [7002, "SWIGGYIT", "platform", 60],
          [7002, "FLAT75", "platform", 75],
          [7002, "BIRYANI20", "restaurant", 20],
          [7003, "PARTY100", "platform", 100],
          [7003, "DOSA10", "restaurant", 10],
          [7004, "WELCOME50", "platform", 50],
          [7004, "ONEPLUS", "platform", 30],
          [7004, "FLAT75", "platform", 75],
        ],
      },
    ],
    gen: (rng) => {
      const coupons: [string, string, number][] = [
        ["WELCOME50", "platform", 50], ["SWIGGYIT", "platform", 60], ["FLAT75", "platform", 75], ["PARTY100", "platform", 100],
        ["ONEPLUS", "platform", 30], ["BIRYANI20", "restaurant", 20], ["DOSA10", "restaurant", 10], ["HDFC150", "payment", 150], ["AXIS100", "payment", 100],
      ];
      const rows: Cell[][] = [];
      for (const order of seq(7001, ri(rng, 1, 8))) {
        for (const [code, type, off] of sample(rng, coupons, pick(rng, [1, 2, 2, 3, 4]))) rows.push([order, code, type, off]);
      }
      return { CouponUse: shuffle(rng, rows) };
    },
    solution: [
      "SELECT order_id,",
      "       GROUP_CONCAT(coupon_code ORDER BY coupon_code SEPARATOR ', ') AS platform_coupons,",
      "       SUM(discount) AS platform_discount",
      "FROM CouponUse",
      "WHERE coupon_type = 'platform'",
      "GROUP BY order_id",
      "HAVING COUNT(*) >= 2",
      "ORDER BY order_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT order_id, GROUP_CONCAT(coupon_code ORDER BY coupon_code SEPARATOR ', ') AS platform_coupons, SUM(discount) AS platform_discount",
        "FROM (SELECT order_id, coupon_code, discount, COUNT(*) OVER (PARTITION BY order_id) AS n",
        "      FROM CouponUse WHERE coupon_type = 'platform') p",
        "WHERE n >= 2",
        "GROUP BY order_id",
        "ORDER BY order_id",
      ].join("\n"),
      [
        "SELECT c.order_id, GROUP_CONCAT(c.coupon_code ORDER BY c.coupon_code SEPARATOR ', ') AS platform_coupons, SUM(c.discount) AS platform_discount",
        "FROM CouponUse c",
        "WHERE c.coupon_type = 'platform'",
        "  AND c.order_id IN (SELECT order_id FROM CouponUse WHERE coupon_type = 'platform' GROUP BY order_id HAVING COUNT(*) > 1)",
        "GROUP BY c.order_id",
        "ORDER BY c.order_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Throw away the restaurant and payment coupons before grouping — they are never part of the answer.",
      "A condition on how many rows an order has belongs in HAVING.",
      "`GROUP_CONCAT` takes its own `ORDER BY` and `SEPARATOR`.",
    ],
    editorial: [
      "Only platform coupons matter, both for the rule and for the output, so the `WHERE` clause removes every other type first. What remains, grouped by order, is one group per order holding exactly its platform coupons. `HAVING COUNT(*) >= 2` keeps the orders that broke the one-coupon rule, and the same group provides both output columns: `SUM(discount)` for the money at stake and `GROUP_CONCAT(coupon_code ORDER BY coupon_code SEPARATOR ', ')` for the readable list.",
      "",
      "The order inside `GROUP_CONCAT` must be stated — without it the codes come out in whatever order the engine read the rows, and the string would differ from run to run. Filtering before grouping is also what makes the list and the sum correct: had the restaurant coupons been grouped in, they would appear in the string and inflate the discount.",
      "",
      "The alternatives reach the same set of orders differently: a window `COUNT(*) OVER (PARTITION BY order_id)` tags every platform row with its order's platform count, or an `IN` subquery finds the offending orders first. All three scan the coupon table once or twice.",
    ].join("\n"),
  },

  {
    slug: "swiggy-longest-idle-gap-in-a-partners-day",
    title: "Swiggy: Longest Idle Gap in a Partner's Day",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates"],
    description: [
      "Between dropping one order and picking up the next, a delivery partner earns nothing. The partner-experience team wants each partner's worst wait of the day to tune where idle riders are sent.",
      "",
      "Within one partner's day (the date of `picked_up_at`), the idle gap after a trip is the minutes from its `delivered_at` to the `picked_up_at` of the **next** trip of that partner on the same day. For every partner and day with **at least two trips**, return `partner_id`, `shift_date` and `longest_idle_minutes`, the largest such gap (0 when a trip started the moment the previous one ended). Times are recorded to the minute and a partner's trips never overlap or cross midnight. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "PartnerTrip",
        columns: [
          { name: "trip_id", type: "int" },
          { name: "partner_id", type: "int" },
          { name: "picked_up_at", type: "datetime" },
          { name: "delivered_at", type: "datetime" },
        ],
        primaryKey: ["trip_id"],
        note: "One row per trip: the food is picked up from the restaurant, then delivered. Trip ids are not in time order.",
      },
    ],
    examples: [
      {
        PartnerTrip: [
          [14, 21, "2025-04-01 13:05:00", "2025-04-01 13:30:00"],
          [11, 21, "2025-04-01 12:00:00", "2025-04-01 12:25:00"],
          [12, 21, "2025-04-01 12:40:00", "2025-04-01 13:05:00"],
          [17, 21, "2025-04-01 14:10:00", "2025-04-01 14:30:00"],
          [15, 21, "2025-04-02 09:00:00", "2025-04-02 09:20:00"],
          [16, 22, "2025-04-01 18:30:00", "2025-04-01 18:50:00"],
          [13, 22, "2025-04-01 18:00:00", "2025-04-01 18:30:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const partner of seq(21, ri(rng, 1, 3))) {
        for (const day of sample(rng, ["2025-04-01", "2025-04-02", "2025-04-03"], ri(rng, 1, 2))) {
          let m = ri(rng, 8 * 60, 15 * 60);
          for (let t = pick(rng, [1, 2, 3, 4, 4]); t > 0; t--) {
            const ride = ri(rng, 12, 40);
            rows.push([0, partner, at(day, m), at(day, m + ride)]);
            m += ride + pick(rng, [0, 0, 5, 12, 25, 40, ri(rng, 1, 90)]);
          }
        }
      }
      const ids = shuffle(rng, seq(11, rows.length));
      rows.forEach((r, i) => (r[0] = ids[i]!));
      return { PartnerTrip: rows };
    },
    solution: [
      "WITH gaps AS (",
      "  SELECT partner_id, DATE(picked_up_at) AS shift_date,",
      "         TIMESTAMPDIFF(MINUTE, delivered_at,",
      "           LEAD(picked_up_at) OVER (PARTITION BY partner_id, DATE(picked_up_at) ORDER BY picked_up_at)) AS idle",
      "  FROM PartnerTrip",
      ")",
      "SELECT partner_id, shift_date, MAX(idle) AS longest_idle_minutes",
      "FROM gaps",
      "WHERE idle IS NOT NULL",
      "GROUP BY partner_id, shift_date",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.partner_id, DATE(a.picked_up_at) AS shift_date,",
        "       MAX(TIMESTAMPDIFF(MINUTE, a.delivered_at,",
        "         (SELECT MIN(b.picked_up_at) FROM PartnerTrip b",
        "          WHERE b.partner_id = a.partner_id AND DATE(b.picked_up_at) = DATE(a.picked_up_at)",
        "            AND b.picked_up_at > a.picked_up_at))) AS longest_idle_minutes",
        "FROM PartnerTrip a",
        "GROUP BY a.partner_id, DATE(a.picked_up_at)",
        "HAVING COUNT(*) >= 2",
      ].join("\n"),
    ],
    hints: [
      "Order each partner's trips of a day by pickup time; the gap after a trip needs the *next* row's pickup.",
      "`LEAD()` reads a value from the following row of the same window partition.",
      "The last trip of a day has no next trip — its gap is NULL and should not count.",
    ],
    editorial: [
      "The gap is a relation between consecutive rows, which is what `LEAD` is for. Partition by partner and by the day of the pickup, order by `picked_up_at`, and `LEAD(picked_up_at)` gives each trip the start of the one after it. `TIMESTAMPDIFF(MINUTE, delivered_at, next_pickup)` is then the idle time after that trip; it is 0 when the partner picked up the next order the minute they dropped the last.",
      "",
      "The last trip of every day has no following row, so `LEAD` returns NULL and so does the gap. Filtering `idle IS NOT NULL` before grouping removes those rows, and as a side effect a day with a single trip has no rows left and drops out — exactly the \"at least two trips\" rule. `MAX(idle)` per partner and day is the answer. Trip ids are deliberately shuffled, so ordering by id would be wrong; only the timestamps give the sequence.",
      "",
      "The alternative finds the next pickup with a correlated `MIN(picked_up_at)` over later trips of the same partner and day, and uses `HAVING COUNT(*) >= 2` for the rule (`MAX` ignores the last trip's NULL). It is quadratic per partner-day without an index; the window version sorts once.",
    ].join("\n"),
  },

  {
    slug: "swiggy-food-customers-who-later-tried-instamart",
    title: "Swiggy: Food Customers Who Later Tried Instamart",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Conditional Logic", "Dates"],
    description: [
      "The cross-sell team measures how long it takes a food-delivery customer to try Instamart grocery for the first time.",
      "",
      "Using **delivered** orders only, find each customer's first food order date and first Instamart order date. Return `customer_id`, `first_food_date`, `first_instamart_date` and `days_to_instamart` (the days between the two) for every customer whose first Instamart order came **strictly after** their first food order. Customers who started with Instamart, tried both on the same day, or never used one of the two are left out. Genie tasks are ignored. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "SwiggyOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "business", type: "enum", values: ["food", "instamart", "genie"] },
          { name: "order_date", type: "date" },
          { name: "status", type: "enum", values: ["delivered", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per order across the app's businesses.",
      },
    ],
    examples: [
      {
        SwiggyOrder: [
          [1, 1, "food", "2025-01-03", "delivered"],
          [2, 1, "instamart", "2025-01-10", "delivered"],
          [3, 2, "instamart", "2025-01-02", "delivered"],
          [4, 2, "food", "2025-01-05", "delivered"],
          [5, 3, "food", "2025-01-04", "cancelled"],
          [6, 3, "food", "2025-01-08", "delivered"],
          [7, 3, "instamart", "2025-01-08", "delivered"],
          [8, 4, "food", "2025-01-01", "delivered"],
          [9, 4, "genie", "2025-01-02", "delivered"],
          [10, 4, "instamart", "2025-02-01", "cancelled"],
          [11, 4, "instamart", "2025-02-15", "delivered"],
          [12, 5, "food", "2025-01-06", "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let oid = 1;
      for (const c of seq(1, ri(rng, 3, 8))) {
        const base = dateBetween(rng, "2025-01-01", "2025-02-28");
        for (let k = ri(rng, 1, 4); k > 0; k--) {
          rows.push([oid++, c, pick(rng, ["food", "instamart", "instamart", "genie"]), chance(rng, 0.15) ? base : addDays(base, ri(rng, 0, 40)), chance(rng, 0.15) ? "cancelled" : "delivered"]);
        }
        // Most customers start on food, the journey the question is about.
        if (chance(rng, 0.7)) rows.push([oid++, c, "food", base, "delivered"]);
      }
      return { SwiggyOrder: shuffle(rng, rows) };
    },
    solution: [
      "SELECT customer_id, first_food_date, first_instamart_date,",
      "       DATEDIFF(first_instamart_date, first_food_date) AS days_to_instamart",
      "FROM (",
      "  SELECT customer_id,",
      "         MIN(CASE WHEN business = 'food' THEN order_date END) AS first_food_date,",
      "         MIN(CASE WHEN business = 'instamart' THEN order_date END) AS first_instamart_date",
      "  FROM SwiggyOrder",
      "  WHERE status = 'delivered'",
      "  GROUP BY customer_id",
      ") f",
      "WHERE first_instamart_date > first_food_date",
    ].join("\n"),
    alternatives: [
      [
        "WITH food AS (SELECT customer_id, MIN(order_date) AS d FROM SwiggyOrder WHERE status = 'delivered' AND business = 'food' GROUP BY customer_id),",
        "     im AS (SELECT customer_id, MIN(order_date) AS d FROM SwiggyOrder WHERE status = 'delivered' AND business = 'instamart' GROUP BY customer_id)",
        "SELECT food.customer_id, food.d AS first_food_date, im.d AS first_instamart_date, TIMESTAMPDIFF(DAY, food.d, im.d) AS days_to_instamart",
        "FROM food JOIN im ON im.customer_id = food.customer_id",
        "WHERE im.d > food.d",
      ].join("\n"),
    ],
    hints: [
      "Each customer needs two \"firsts\" — one per business — side by side in one row.",
      "`MIN(CASE WHEN business = 'food' THEN order_date END)` ignores every row that is not a food order.",
      "A customer missing one of the two gets NULL there, and a comparison with NULL is never true.",
    ],
    editorial: [
      "Two minimums per customer, each over a different subset of rows, is the classic job for **conditional aggregation**. After keeping only delivered orders, `MIN(CASE WHEN business = 'food' THEN order_date END)` looks at food rows only — the `CASE` yields NULL for every other row and `MIN` skips NULLs — and the same expression for `instamart` gives the other first date. Genie rows are NULL in both and change nothing.",
      "",
      "The outer filter `first_instamart_date > first_food_date` encodes the whole rule. Strictly greater drops same-day starters and those who began with Instamart, and a customer who never used one of the businesses has NULL on that side, so the comparison is unknown and the row is dropped too. Filtering cancelled orders first matters: a cancelled food order does not make the customer a food user that day. `DATEDIFF(later, earlier)` gives the days in between.",
      "",
      "The alternative builds the two firsts as separate grouped CTEs and inner-joins them, which drops one-business customers in the join. It reads the table twice; conditional aggregation reads it once.",
    ].join("\n"),
  },

  {
    slug: "swiggy-genie-tasks-flagged-by-blocked-keywords",
    title: "Swiggy: Genie Tasks Flagged by Blocked Keywords",
    difficulty: "MEDIUM",
    topics: ["Strings", "Joins", "Aggregation"],
    description: [
      "Genie will not carry some items — alcohol, cash, valuables. Customers describe the parcel in a free-text note, and the trust-and-safety team screens notes against a list of blocked keywords, sending matches to a human reviewer.",
      "",
      "A note **matches** a keyword when the keyword appears anywhere inside it as a substring, **ignoring letter case** (`cash` matches `Cash envelope` and also `Cashew packet` — the reviewer sorts out false alarms). Keywords are stored in lower case. Return `task_id` and `matched_keywords`, the distinct keywords the note matched in alphabetical order joined by `', '`, for every task whose note matched at least one. Tasks with no note (NULL) match nothing. Order the rows by `task_id`.",
    ].join("\n"),
    tables: [
      {
        name: "GenieTask",
        columns: [
          { name: "task_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "item_note", type: "varchar" },
        ],
        primaryKey: ["task_id"],
        note: "One row per pick-up-and-drop request; `item_note` is what the customer typed about the parcel, or NULL.",
      },
      {
        name: "BlockedKeyword",
        columns: [
          { name: "keyword", type: "varchar" },
          { name: "reason", type: "varchar" },
        ],
        primaryKey: ["keyword"],
        note: "One row per screened word, in lower case.",
      },
    ],
    examples: [
      {
        GenieTask: [
          [1, 11, "House keys and a lunch box"],
          [2, 12, "Return the BEER crate to the shop"],
          [3, 13, "Envelope with Cash and gold coins"],
          [4, 14, null],
          [5, 15, "Golden retriever food bag"],
          [6, 16, "Laptop charger"],
          [7, 17, "Cashew packet"],
        ],
        BlockedKeyword: [
          ["alcohol", "excise rules"],
          ["beer", "excise rules"],
          ["cash", "valuables"],
          ["cylinder", "hazardous"],
          ["gold", "valuables"],
        ],
      },
    ],
    gen: (rng) => {
      const parts = [
        "House keys", "lunch box", "Laptop charger", "Beer crate", "cash envelope", "Gold chain for repair", "Cashew packet",
        "Gas Cylinder", "medicine strip", "Alcohol-free sanitiser", "golden rice bag", "Documents folder", "Spare phone", "Kitchen knife set",
      ];
      const tasks: Cell[][] = seq(1, ri(rng, 2, 12)).map((id) => {
        if (chance(rng, 0.1)) return [id, ri(rng, 11, 30), null];
        let note = sample(rng, parts, ri(rng, 1, 2)).join(" and ");
        const style = ri(rng, 0, 3);
        if (style === 0) note = note.toUpperCase();
        else if (style === 1) note = note.toLowerCase();
        return [id, ri(rng, 11, 30), note];
      });
      const pool: [string, string][] = [
        ["alcohol", "excise rules"], ["beer", "excise rules"], ["cash", "valuables"], ["cylinder", "hazardous"],
        ["gold", "valuables"], ["knife", "sharp objects"], ["medicine", "needs prescription"],
      ];
      return { GenieTask: tasks, BlockedKeyword: sample(rng, pool, ri(rng, 1, 5)) };
    },
    solution: [
      "SELECT t.task_id,",
      "       GROUP_CONCAT(DISTINCT k.keyword ORDER BY k.keyword SEPARATOR ', ') AS matched_keywords",
      "FROM GenieTask t",
      "JOIN BlockedKeyword k ON LOWER(t.item_note) LIKE CONCAT('%', k.keyword, '%')",
      "GROUP BY t.task_id",
      "ORDER BY t.task_id",
    ].join("\n"),
    alternatives: [
      "SELECT t.task_id, GROUP_CONCAT(k.keyword ORDER BY k.keyword SEPARATOR ', ') AS matched_keywords FROM GenieTask t, BlockedKeyword k WHERE LOCATE(k.keyword, LOWER(t.item_note)) > 0 GROUP BY t.task_id ORDER BY t.task_id",
      "SELECT t.task_id, GROUP_CONCAT(k.keyword ORDER BY k.keyword SEPARATOR ', ') AS matched_keywords FROM GenieTask t JOIN BlockedKeyword k ON INSTR(LOWER(t.item_note), k.keyword) > 0 GROUP BY t.task_id ORDER BY t.task_id",
    ],
    ordered: true,
    hints: [
      "Pair every task with every keyword, and keep a pair when the keyword occurs in the note.",
      "Lower-case the note before testing, so case never decides a match.",
      "`LIKE CONCAT('%', keyword, '%')` is a substring test built from a column.",
    ],
    editorial: [
      "The keyword list is data, so the matching is a **join on a pattern** rather than a fixed `WHERE` clause: each task is paired with each keyword, and the pair survives when the keyword occurs inside the note. `LIKE CONCAT('%', k.keyword, '%')` builds the substring pattern from the column. Lower-casing the note first makes the test independent of case on every database — MySQL's default collation would ignore case anyway, but other engines and binary collations would not, and the keywords are already stored in lower case.",
      "",
      "After the join a task appears once per keyword it matched, so grouping by task and `GROUP_CONCAT(… ORDER BY keyword SEPARATOR ', ')` produces the list; the explicit order makes the string deterministic. A task that matched nothing has no joined rows and is absent, and a NULL note makes `LIKE` NULL, which also matches nothing.",
      "",
      "`LOCATE(needle, haystack)` and `INSTR(haystack, needle)` return the position of a substring (0 when absent) and are equivalent tests that avoid building a pattern — handy if a keyword could ever contain `%` or `_`, which `LIKE` would treat as wildcards. The cost is tasks × keywords comparisons; for a long keyword list a full-text index is the production answer.",
    ].join("\n"),
  },

  {
    slug: "swiggy-busiest-instamart-store-per-city-each-month",
    title: "Swiggy: Busiest Instamart Store per City Each Month",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation", "Dates"],
    description: [
      "Regional managers reward the busiest dark store of their city every month, so the Instamart analytics team needs the winner for each city and month.",
      "",
      "Count each store's **delivered** orders per calendar month. For every city and month, return the store (or stores, **if tied**) with the most delivered orders in that month: columns `city`, `order_month` (formatted `YYYY-MM`), `store_name` and `orders`. Only stores with at least one delivered order in the month compete. Order by `city`, `order_month`, then `store_name`.",
    ].join("\n"),
    tables: [
      {
        name: "DarkStore",
        columns: [
          { name: "store_id", type: "int" },
          { name: "store_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["store_id"],
        note: "One row per dark store; names are unique.",
      },
      {
        name: "InstamartOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "order_date", type: "date" },
          { name: "status", type: "enum", values: ["delivered", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per Instamart order, fulfilled by one store.",
      },
    ],
    examples: [
      {
        DarkStore: [
          [1, "HSR Layout", "Bengaluru"],
          [2, "Koramangala", "Bengaluru"],
          [3, "Powai", "Mumbai"],
          [4, "Andheri East", "Mumbai"],
        ],
        InstamartOrder: [
          [1, 1, "2025-03-02", "delivered"],
          [2, 1, "2025-03-15", "delivered"],
          [3, 2, "2025-03-03", "delivered"],
          [4, 2, "2025-03-21", "delivered"],
          [5, 2, "2025-03-22", "cancelled"],
          [6, 3, "2025-03-30", "delivered"],
          [7, 1, "2025-04-01", "delivered"],
          [8, 2, "2025-04-02", "delivered"],
          [9, 2, "2025-04-30", "delivered"],
          [10, 4, "2025-04-11", "delivered"],
          [11, 3, "2025-04-12", "cancelled"],
        ],
      },
    ],
    gen: (rng) => {
      const stores: Cell[][] = sample(rng, STORES.slice(0, 6), ri(rng, 2, 5)).map(([name, city], i) => [i + 1, name, city]);
      const orders: Cell[][] = seq(1, ri(rng, 0, 24)).map((id) => [
        id,
        ri(rng, 1, stores.length),
        dateBetween(rng, "2025-03-01", "2025-04-30"),
        chance(rng, 0.2) ? "cancelled" : "delivered",
      ]);
      return { DarkStore: stores, InstamartOrder: orders };
    },
    solution: [
      "WITH monthly AS (",
      "  SELECT d.city, DATE_FORMAT(o.order_date, '%Y-%m') AS order_month, d.store_name, COUNT(*) AS orders",
      "  FROM InstamartOrder o",
      "  JOIN DarkStore d ON d.store_id = o.store_id",
      "  WHERE o.status = 'delivered'",
      "  GROUP BY d.city, order_month, d.store_id, d.store_name",
      "), ranked AS (",
      "  SELECT city, order_month, store_name, orders,",
      "         RANK() OVER (PARTITION BY city, order_month ORDER BY orders DESC) AS pos",
      "  FROM monthly",
      ")",
      "SELECT city, order_month, store_name, orders",
      "FROM ranked",
      "WHERE pos = 1",
      "ORDER BY city, order_month, store_name",
    ].join("\n"),
    alternatives: [
      [
        "WITH monthly AS (",
        "  SELECT d.city, LEFT(o.order_date, 7) AS order_month, d.store_name, COUNT(*) AS orders",
        "  FROM InstamartOrder o JOIN DarkStore d ON d.store_id = o.store_id",
        "  WHERE o.status = 'delivered'",
        "  GROUP BY d.city, order_month, d.store_id, d.store_name",
        ")",
        "SELECT m.city, m.order_month, m.store_name, m.orders",
        "FROM monthly m",
        "WHERE m.orders = (SELECT MAX(m2.orders) FROM monthly m2 WHERE m2.city = m.city AND m2.order_month = m.order_month)",
        "ORDER BY m.city, m.order_month, m.store_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First count delivered orders per store and month; only then compare stores.",
      "`DATE_FORMAT(order_date, '%Y-%m')` turns a date into its month label.",
      "`RANK()` gives tied stores the same position, so all winners keep position 1.",
    ],
    editorial: [
      "The question has two levels of aggregation, so it takes two steps. The first, `monthly`, joins orders to their store, keeps delivered ones and counts them per store and month — the month label comes from `DATE_FORMAT(order_date, '%Y-%m')`, grouped by its alias so MySQL's ONLY_FULL_GROUP_BY is satisfied. Stores with no delivered order that month have no row and so never compete.",
      "",
      "The second step picks winners within each (city, month). `RANK() OVER (PARTITION BY city, order_month ORDER BY orders DESC)` numbers the stores from the busiest; stores with equal counts share a rank, so every tied winner has rank 1. `ROW_NUMBER` would be wrong here — it would keep one tied store arbitrarily.",
      "",
      "The alternative compares each store-month with the maximum of its own city and month through a correlated subquery, and labels the month with `LEFT(order_date, 7)`, which is the same text for a `YYYY-MM-DD` date. Both group the orders once; the window version then sorts each partition, the correlated one rescans the small `monthly` result per row.",
    ].join("\n"),
  },

  {
    slug: "swiggy-partner-top-up-to-the-shift-guarantee",
    title: "Swiggy: Partner Top-Up to the Shift Earnings Guarantee",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "To keep riders on the road during slow days, a delivery partner who stays logged in for a long enough shift is guaranteed a minimum payout; if the orders of the shift paid less, the company tops it up.",
      "",
      "A shift is **eligible** when `login_minutes` is **at least 420**. Its earnings are the sum of `payout` over its orders — **tips are excluded**, they belong to the partner on top of everything — and 0 for a shift with no orders. For every eligible shift whose earnings fall short of its `guarantee`, return `shift_id`, `partner_id`, `earnings` and `top_up` (guarantee minus earnings). Order the rows by `shift_id`.",
    ].join("\n"),
    tables: [
      {
        name: "PartnerShift",
        columns: [
          { name: "shift_id", type: "int" },
          { name: "partner_id", type: "int" },
          { name: "shift_date", type: "date" },
          { name: "login_minutes", type: "int" },
          { name: "guarantee", type: "int" },
        ],
        primaryKey: ["shift_id"],
        note: "One row per shift a partner worked; `guarantee` is the minimum payout promised for it, in rupees.",
      },
      {
        name: "ShiftOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "shift_id", type: "int" },
          { name: "payout", type: "int" },
          { name: "tip", type: "int" },
        ],
        primaryKey: ["order_id"],
        note: "One row per order delivered during a shift. `tip` is NULL when the customer left none.",
      },
    ],
    examples: [
      {
        PartnerShift: [
          [1, 31, "2025-08-01", 480, 900],
          [2, 32, "2025-08-01", 419, 900],
          [3, 33, "2025-08-01", 420, 800],
          [4, 31, "2025-08-02", 600, 900],
          [5, 34, "2025-08-02", 450, 700],
        ],
        ShiftOrder: [
          [1, 1, 300, null],
          [2, 1, 250, 20],
          [3, 1, 200, null],
          [4, 2, 100, null],
          [5, 3, 500, 0],
          [6, 3, 350, null],
          [7, 5, 400, 200],
        ],
      },
    ],
    gen: (rng) => {
      const shifts: Cell[][] = seq(1, ri(rng, 1, 8)).map((id) => [
        id,
        ri(rng, 31, 36),
        dateBetween(rng, "2025-08-01", "2025-08-05"),
        pick(rng, [419, 420, 480, 360, 600, ri(rng, 300, 660)]),
        pick(rng, [700, 800, 900]),
      ]);
      const orders: Cell[][] = [];
      let oid = 1;
      for (const s of shifts) {
        for (let k = pick(rng, [0, 1, 2, 3, 3, 4]); k > 0; k--) orders.push([oid++, s[0], roundTo(rng, 100, 400, 50), chance(rng, 0.5) ? null : roundTo(rng, 0, 200, 10)]);
      }
      return { PartnerShift: shifts, ShiftOrder: shuffle(rng, orders) };
    },
    solution: [
      "SELECT s.shift_id, s.partner_id,",
      "       COALESCE(SUM(o.payout), 0) AS earnings,",
      "       s.guarantee - COALESCE(SUM(o.payout), 0) AS top_up",
      "FROM PartnerShift s",
      "LEFT JOIN ShiftOrder o ON o.shift_id = s.shift_id",
      "WHERE s.login_minutes >= 420",
      "GROUP BY s.shift_id, s.partner_id, s.guarantee",
      "HAVING s.guarantee - COALESCE(SUM(o.payout), 0) > 0",
      "ORDER BY s.shift_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT shift_id, partner_id, earnings, guarantee - earnings AS top_up FROM (",
        "  SELECT s.shift_id, s.partner_id, s.guarantee,",
        "         (SELECT IFNULL(SUM(o.payout), 0) FROM ShiftOrder o WHERE o.shift_id = s.shift_id) AS earnings",
        "  FROM PartnerShift s WHERE s.login_minutes >= 420",
        ") t",
        "WHERE earnings < guarantee",
        "ORDER BY shift_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "A shift with no orders still needs a row — which kind of join keeps it?",
      "`SUM` over no rows is NULL; turn it into 0 before subtracting.",
      "Only `payout` counts towards the guarantee; leave `tip` alone.",
    ],
    editorial: [
      "Every eligible shift has to be judged, including a shift in which the partner stayed logged in all day and got no orders — that is the case the guarantee exists for. A `LEFT JOIN` from shifts to orders keeps such a shift with one NULL-extended row, and `COALESCE(SUM(o.payout), 0)` turns its NULL sum into 0 earnings, so its top-up is the full guarantee. An inner join would silently lose it.",
      "",
      "Eligibility is a property of the shift row, so it goes in `WHERE` (`login_minutes >= 420`, with 420 itself eligible). The shortfall test is a property of the group and goes in `HAVING`; writing the expression out rather than its alias keeps it portable. Only `payout` is summed: tips are the customer's gift to the rider and do not reduce what the company owes, and their NULLs never enter the arithmetic.",
      "",
      "The alternative computes earnings with a correlated scalar subquery per shift (`IFNULL` handling the empty case) and filters in an outer query. It reads more like the business rule; the join-and-group version does the same work in one grouped pass over the orders.",
    ].join("\n"),
  },

  {
    slug: "swiggy-money-debits-that-overdrew-the-wallet",
    title: "Swiggy: Swiggy Money Debits That Overdrew the Wallet",
    difficulty: "MEDIUM",
    topics: ["Window Functions"],
    description: [
      "Swiggy Money is the in-app wallet: refunds and top-ups credit it, payments debit it. A reconciliation job found that a race in the payment service let some debits go through without enough balance, and the payments team wants every one of them.",
      "",
      "Each customer's wallet starts at 0. Process the customer's transactions in order of `txn_at`, and for transactions at the same moment in order of `txn_id`; the balance after a transaction is the running total of credits minus debits up to and including it. Return `txn_id`, `customer_id` and `balance_after` for every **debit** that left the balance **below zero**. Order the rows by `txn_id`.",
    ].join("\n"),
    tables: [
      {
        name: "WalletTxn",
        columns: [
          { name: "txn_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "txn_at", type: "datetime" },
          { name: "kind", type: "enum", values: ["credit", "debit"] },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["txn_id"],
        note: "One row per wallet movement; `amount` is always positive, in rupees, and `kind` says which way it moved.",
      },
    ],
    examples: [
      {
        WalletTxn: [
          [1, 101, "2025-09-01 10:00:00", "credit", 500],
          [2, 101, "2025-09-01 12:00:00", "debit", 300],
          [3, 101, "2025-09-02 09:00:00", "debit", 250],
          [4, 101, "2025-09-02 09:00:00", "credit", 100],
          [5, 101, "2025-09-03 08:00:00", "debit", 80],
          [6, 102, "2025-09-01 09:00:00", "debit", 40],
          [7, 102, "2025-09-01 09:30:00", "credit", 40],
          [8, 103, "2025-09-01 11:00:00", "credit", 200],
          [9, 103, "2025-09-01 11:05:00", "debit", 200],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const c of seq(101, ri(rng, 1, 3))) {
        let t = ri(rng, 0, 600);
        for (let k = ri(rng, 0, 8); k > 0; k--) {
          t += pick(rng, [0, 0, 30, 90, 240, 600]);
          rows.push([0, c, at("2025-09-01", t), chance(rng, 0.45) ? "credit" : "debit", roundTo(rng, 20, 400, 20)]);
        }
      }
      const ids = shuffle(rng, seq(1, rows.length));
      rows.forEach((r, i) => (r[0] = ids[i]!));
      return { WalletTxn: rows };
    },
    solution: [
      "WITH running AS (",
      "  SELECT txn_id, customer_id, kind,",
      "         SUM(CASE WHEN kind = 'credit' THEN amount ELSE -amount END)",
      "           OVER (PARTITION BY customer_id ORDER BY txn_at, txn_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS balance_after",
      "  FROM WalletTxn",
      ")",
      "SELECT txn_id, customer_id, balance_after",
      "FROM running",
      "WHERE kind = 'debit' AND balance_after < 0",
      "ORDER BY txn_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT t.txn_id, t.customer_id,",
        "       (SELECT SUM(IF(p.kind = 'credit', p.amount, -p.amount)) FROM WalletTxn p",
        "        WHERE p.customer_id = t.customer_id",
        "          AND (p.txn_at < t.txn_at OR (p.txn_at = t.txn_at AND p.txn_id <= t.txn_id))) AS balance_after",
        "FROM WalletTxn t",
        "WHERE t.kind = 'debit'",
        "  AND (SELECT SUM(IF(p.kind = 'credit', p.amount, -p.amount)) FROM WalletTxn p",
        "       WHERE p.customer_id = t.customer_id",
        "         AND (p.txn_at < t.txn_at OR (p.txn_at = t.txn_at AND p.txn_id <= t.txn_id))) < 0",
        "ORDER BY t.txn_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Turn each row into a signed amount: credits positive, debits negative.",
      "A running total is `SUM(…) OVER (PARTITION BY … ORDER BY …)`.",
      "Two transactions at the same moment need a tie-breaker in the window's ORDER BY.",
    ],
    editorial: [
      "The balance after a transaction is a **running sum** of signed amounts, so a window function computes it in one pass: `SUM(CASE WHEN kind = 'credit' THEN amount ELSE -amount END)` over each customer's transactions ordered by `txn_at, txn_id`. The frame `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` makes \"up to and including this row\" exact. With the default `RANGE` frame, two transactions with the same `txn_at` and `txn_id` order would still be fine here because `txn_id` is unique, but spelling out `ROWS` avoids surprises when the order key has ties.",
      "",
      "The tie-breaker matters: in the example a debit and a credit share 09:00, and the statement processes the lower id first, so the debit lands at −50 before the credit restores the balance. Only debits are reported — a credit can never push a balance below zero — and a balance of exactly 0 is not overdrawn.",
      "",
      "The alternative recomputes the balance for each debit with a correlated sum over all earlier-or-equal transactions of that customer, ordered by the same (time, id) pair. It is quadratic per customer; the window version sorts each customer's transactions once.",
    ].join("\n"),
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "swiggy-third-delivered-order-of-each-new-customer",
    title: "Swiggy: Third Delivered Order of Each New Customer",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Conditional Logic"],
    description: [
      "New customers get free delivery on their first three delivered orders, but only if those orders come within **30 days of signing up**. The growth team wants the order on which each customer used up the offer — their **third delivered order** — and whether it landed inside the window.",
      "",
      "Count a customer's **delivered** orders in order of `ordered_at`; two orders placed at the same moment count in order of `order_id`. Cancelled orders are never counted. For every customer with **at least three** delivered orders, return `customer_id`, `third_order_id`, `third_ordered_at`, `days_to_third` (days from `signup_date` to the date of that order) and `within_offer` — 1 when `days_to_third` is **at most 30**, else 0. Customers with fewer than three delivered orders are left out. Order the rows by `customer_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Customer",
        columns: [
          { name: "customer_id", type: "int" },
          { name: "signup_date", type: "date" },
        ],
        primaryKey: ["customer_id"],
        note: "One row per account, with the day it signed up.",
      },
      {
        name: "SwiggyOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "ordered_at", type: "datetime" },
          { name: "status", type: "enum", values: ["delivered", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per order across food and Instamart, never before the customer's signup. Order ids are not in time order.",
      },
    ],
    examples: [
      {
        Customer: [
          [1, "2025-05-01"],
          [2, "2025-05-03"],
          [3, "2025-05-10"],
          [4, "2025-05-12"],
        ],
        SwiggyOrder: [
          [15, 1, "2025-05-02 13:10:00", "delivered"],
          [11, 1, "2025-05-09 20:00:00", "cancelled"],
          [18, 1, "2025-05-20 21:30:00", "delivered"],
          [12, 1, "2025-05-31 19:45:00", "delivered"],
          [20, 1, "2025-06-02 12:00:00", "delivered"],
          [13, 2, "2025-05-05 09:00:00", "delivered"],
          [21, 2, "2025-05-05 09:00:00", "delivered"],
          [14, 2, "2025-06-10 22:15:00", "delivered"],
          [16, 3, "2025-05-11 08:30:00", "delivered"],
          [17, 3, "2025-05-12 08:30:00", "delivered"],
          [19, 4, "2025-05-12 18:00:00", "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      const customers: Cell[][] = seq(1, ri(rng, 1, 5)).map((id) => [id, dateBetween(rng, "2025-05-01", "2025-05-20")]);
      const orders: Cell[][] = [];
      for (const [cid, signup] of customers) {
        const n = pick(rng, [1, 2, 3, 3, 4, 5, 6]);
        let last = "";
        for (let k = 0; k < n; k++) {
          // Now and then two orders at the same moment, the case the order_id rule settles.
          const when = last && chance(rng, 0.15) ? last : at(addDays(signup as string, chance(rng, 0.2) ? pick(rng, [30, 31]) : ri(rng, 0, 40)), ri(rng, 8 * 60, 23 * 60));
          last = when;
          orders.push([0, cid, when, chance(rng, 0.15) ? "cancelled" : "delivered"]);
        }
      }
      const ids = shuffle(rng, seq(11, orders.length));
      orders.forEach((o, i) => (o[0] = ids[i]!));
      return { Customer: customers, SwiggyOrder: orders };
    },
    solution: [
      "WITH numbered AS (",
      "  SELECT order_id, customer_id, ordered_at,",
      "         ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY ordered_at, order_id) AS nth",
      "  FROM SwiggyOrder",
      "  WHERE status = 'delivered'",
      ")",
      "SELECT n.customer_id, n.order_id AS third_order_id, n.ordered_at AS third_ordered_at,",
      "       DATEDIFF(n.ordered_at, c.signup_date) AS days_to_third,",
      "       CASE WHEN DATEDIFF(n.ordered_at, c.signup_date) <= 30 THEN 1 ELSE 0 END AS within_offer",
      "FROM numbered n",
      "JOIN Customer c ON c.customer_id = n.customer_id",
      "WHERE n.nth = 3",
      "ORDER BY n.customer_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT o.customer_id, o.order_id AS third_order_id, o.ordered_at AS third_ordered_at,",
        "       DATEDIFF(o.ordered_at, c.signup_date) AS days_to_third,",
        "       IF(DATE(o.ordered_at) <= DATE_ADD(c.signup_date, INTERVAL 30 DAY), 1, 0) AS within_offer",
        "FROM SwiggyOrder o",
        "JOIN Customer c ON c.customer_id = o.customer_id",
        "WHERE o.status = 'delivered'",
        "  AND (SELECT COUNT(*) FROM SwiggyOrder p",
        "       WHERE p.customer_id = o.customer_id AND p.status = 'delivered'",
        "         AND (p.ordered_at < o.ordered_at OR (p.ordered_at = o.ordered_at AND p.order_id <= o.order_id))) = 3",
        "ORDER BY o.customer_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Drop cancelled orders first — they must not take a position.",
      "`ROW_NUMBER()` per customer, ordered by time and then by id, numbers the delivered orders 1, 2, 3, …",
      "Keep the row numbered 3; a customer with fewer orders simply has no such row.",
      "`DATEDIFF(datetime, date)` compares the calendar days only.",
    ],
    editorial: [
      "\"The n-th event per key\" is a numbering problem. Filter to delivered orders, then `ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY ordered_at, order_id)` gives each customer's orders the positions 1, 2, 3, … in the order they happened. The second sort key is essential: two orders at the same instant would otherwise be numbered arbitrarily, and the answer could change from run to run. Order ids are deliberately not in time order, so sorting by id alone would be wrong. `ROW_NUMBER` is the right function rather than `RANK`, which would give tied orders the same position and could skip 3.",
      "",
      "Keeping `nth = 3` leaves exactly one row per customer who reached a third delivered order; customers with fewer have no third row and drop out without a `HAVING`. Filtering cancellations before numbering is what makes a cancelled order not use up a position — filtering after would leave holes in the numbering.",
      "",
      "`DATEDIFF(ordered_at, signup_date)` counts calendar days, ignoring the time of day, and the offer flag is a `CASE` on it: day 30 is inside, day 31 is not. The alternative finds the third order without window functions — an order is third when exactly three delivered orders of the customer come at or before it in (time, id) order. That is quadratic per customer; the window version sorts once.",
    ].join("\n"),
  },

  {
    slug: "swiggy-restaurant-offline-minutes-within-opening-hours",
    title: "Swiggy: Restaurant Offline Minutes Within Opening Hours",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Conditional Logic"],
    description: [
      "A restaurant partner can switch itself **offline** in the partner app when the kitchen is swamped, and customers then see it as \"not accepting orders\". City ops audits how long each restaurant was offline **during the hours it promised to be open**.",
      "",
      "Each status log row sets the restaurant's status from `changed_at` until its next log row (or indefinitely if there is none). Before its first row of the day a restaurant is online. A restaurant can log the same status twice in a row. Count, for the audited day, the minutes a restaurant was **offline between its `opens_at` (inclusive) and `closes_at` (exclusive)**. Time offline before opening or after closing does not count. Return `restaurant_name` and `offline_minutes` for **every** restaurant (0 when it was never offline in its hours), ordered by `offline_minutes` descending, then `restaurant_name`.",
    ].join("\n"),
    tables: [
      {
        name: "Restaurant",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "restaurant_name", type: "varchar" },
          { name: "opens_at", type: "datetime" },
          { name: "closes_at", type: "datetime" },
        ],
        primaryKey: ["restaurant_id"],
        note: "One row per restaurant, with its declared opening and closing time on the audited day. Names are unique.",
      },
      {
        name: "StatusLog",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "changed_at", type: "datetime" },
          { name: "status", type: "enum", values: ["online", "offline"] },
        ],
        primaryKey: ["restaurant_id", "changed_at"],
        note: "One row per status the restaurant set in the partner app on the audited day; times are recorded to the minute.",
      },
    ],
    examples: [
      {
        Restaurant: [
          [1, "Biryani Bowl House", "2025-06-14 11:00:00", "2025-06-14 23:00:00"],
          [2, "Dosa Corner", "2025-06-14 07:00:00", "2025-06-14 22:00:00"],
          [3, "Momo Hub", "2025-06-14 12:00:00", "2025-06-14 23:00:00"],
          [4, "Wok Express", "2025-06-14 11:00:00", "2025-06-14 23:00:00"],
        ],
        StatusLog: [
          [1, "2025-06-14 10:30:00", "offline"],
          [1, "2025-06-14 11:20:00", "online"],
          [1, "2025-06-14 19:00:00", "offline"],
          [1, "2025-06-14 19:45:00", "offline"],
          [1, "2025-06-14 20:10:00", "online"],
          [1, "2025-06-14 22:40:00", "offline"],
          [2, "2025-06-14 06:00:00", "offline"],
          [2, "2025-06-14 06:50:00", "online"],
          [2, "2025-06-14 21:30:00", "offline"],
          [3, "2025-06-14 12:00:00", "online"],
          [3, "2025-06-14 15:00:00", "offline"],
          [3, "2025-06-14 15:30:00", "online"],
          [3, "2025-06-14 23:10:00", "offline"],
        ],
      },
    ],
    gen: (rng) => {
      const day = "2025-06-14";
      const rests: Cell[][] = sample(rng, RESTAURANTS, ri(rng, 1, 4)).map((name, i) => {
        const open = pick(rng, [7 * 60, 11 * 60, 12 * 60]);
        return [i + 1, name, at(day, open), at(day, pick(rng, [22 * 60, 23 * 60, 23 * 60 + 30]))];
      });
      const logs: Cell[][] = [];
      for (const r of rests) {
        const open = Number((r[2] as string).slice(11, 13)) * 60;
        const close = Number((r[3] as string).slice(11, 13)) * 60 + Number((r[3] as string).slice(14, 16));
        const times = new Set<number>();
        for (let k = ri(rng, 0, 6); k > 0; k--) {
          times.add(chance(rng, 0.25) ? pick(rng, [open, close, open - 30, close + 15]) : ri(rng, 6 * 60, 23 * 60 + 50));
        }
        for (const m of [...times].sort((a, b) => a - b)) logs.push([r[0], at(day, m), chance(rng, 0.55) ? "offline" : "online"]);
      }
      return { Restaurant: rests, StatusLog: shuffle(rng, logs) };
    },
    solution: [
      "WITH spans AS (",
      "  SELECT restaurant_id, status, changed_at AS span_start,",
      "         LEAD(changed_at) OVER (PARTITION BY restaurant_id ORDER BY changed_at) AS span_end",
      "  FROM StatusLog",
      "), clipped AS (",
      "  SELECT s.restaurant_id,",
      "         GREATEST(s.span_start, r.opens_at) AS from_at,",
      "         LEAST(COALESCE(s.span_end, r.closes_at), r.closes_at) AS to_at",
      "  FROM spans s",
      "  JOIN Restaurant r ON r.restaurant_id = s.restaurant_id",
      "  WHERE s.status = 'offline'",
      ")",
      "SELECT r.restaurant_name,",
      "       COALESCE(SUM(CASE WHEN c.to_at > c.from_at THEN TIMESTAMPDIFF(MINUTE, c.from_at, c.to_at) ELSE 0 END), 0) AS offline_minutes",
      "FROM Restaurant r",
      "LEFT JOIN clipped c ON c.restaurant_id = r.restaurant_id",
      "GROUP BY r.restaurant_id, r.restaurant_name",
      "ORDER BY offline_minutes DESC, r.restaurant_name",
    ].join("\n"),
    alternatives: [
      [
        "WITH spans AS (",
        "  SELECT l.restaurant_id, l.status, l.changed_at AS span_start,",
        "         (SELECT MIN(n.changed_at) FROM StatusLog n WHERE n.restaurant_id = l.restaurant_id AND n.changed_at > l.changed_at) AS span_end",
        "  FROM StatusLog l",
        "), clipped AS (",
        "  SELECT s.restaurant_id,",
        "         CASE WHEN s.span_start > r.opens_at THEN s.span_start ELSE r.opens_at END AS from_at,",
        "         CASE WHEN s.span_end IS NOT NULL AND s.span_end < r.closes_at THEN s.span_end ELSE r.closes_at END AS to_at",
        "  FROM spans s JOIN Restaurant r ON r.restaurant_id = s.restaurant_id",
        "  WHERE s.status = 'offline'",
        "), per_restaurant AS (",
        "  SELECT restaurant_id, SUM(TIMESTAMPDIFF(MINUTE, from_at, to_at)) AS mins",
        "  FROM clipped WHERE to_at > from_at GROUP BY restaurant_id",
        ")",
        "SELECT r.restaurant_name, IFNULL(p.mins, 0) AS offline_minutes",
        "FROM Restaurant r LEFT JOIN per_restaurant p ON p.restaurant_id = r.restaurant_id",
        "ORDER BY offline_minutes DESC, r.restaurant_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Turn the log into spans: each row lasts until the next row of the same restaurant — `LEAD()`.",
      "The last row of a restaurant has no next row; for counting, it lasts until closing time.",
      "Clip each offline span to the opening window: start at the later of the two starts, end at the earlier of the two ends.",
      "A span that lies wholly outside the window clips to nothing — count only spans whose clipped end is after their clipped start.",
      "Every restaurant must appear, so start from the restaurants and LEFT JOIN the minutes.",
    ],
    editorial: [
      "A status log records *changes*, not durations, so the first step converts it into **spans**. `LEAD(changed_at)` over each restaurant's rows in time order gives every row the moment its status was replaced; the last row has no successor and gets NULL, which is read as \"until closing\". A repeated `offline` row is harmless: it just splits one offline stretch into two adjacent spans that add up to the same minutes.",
      "",
      "Next, **interval clipping**. Only the part of an offline span inside `[opens_at, closes_at)` counts, so the clipped span starts at `GREATEST(span_start, opens_at)` and ends at `LEAST(span_end, closes_at)`. An offline stretch that began before opening is cut at opening time; one still running at closing is cut there. A span that lies entirely before opening or after closing clips to an end that is not after its start, and the `CASE` adds 0 for it instead of a negative number. Online spans are dropped before clipping, and a restaurant whose only log rows are online, or that has none, has nothing to add.",
      "",
      "Finally the restaurants are the driving table, `LEFT JOIN`ed to the clipped spans, so every restaurant appears and `COALESCE` turns an empty sum into 0. The alternative finds each span's end with a correlated `MIN(changed_at)` and clips with `CASE` instead of `GREATEST`/`LEAST`, then sums in a grouped CTE. The window version sorts each restaurant's log once; the correlated one does a lookup per row.",
    ].join("\n"),
  },

  {
    slug: "swiggy-gmv-report-with-city-subtotals-and-grand-total",
    title: "Swiggy: GMV Report With City Subtotals and a Grand Total",
    difficulty: "HARD",
    topics: ["Aggregation", "Subqueries", "Conditional Logic"],
    description: [
      "The weekly business review opens with one table: delivered orders and GMV for every city and business line (food, Instamart, Genie), each city's subtotal under its lines, and one grand-total row at the bottom — the way finance lays it out in a spreadsheet.",
      "",
      "Using **delivered** orders only, return the columns `city`, `business`, `orders` (count) and `gmv` (sum of `order_value`) as three kinds of rows: one per city and business that had delivered orders; one **subtotal per city** with `business` = `'All businesses'`; and one **grand total** with `city` = `'All cities'` and `business` = `'All businesses'`. Order the rows by city alphabetically, within a city its business rows alphabetically and then its subtotal, and the grand total last.",
    ].join("\n"),
    tables: [
      {
        name: "SwiggyOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "business", type: "enum", values: ["food", "instamart", "genie"] },
          { name: "order_value", type: "int" },
          { name: "status", type: "enum", values: ["delivered", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per order of the week; `order_value` is the basket value in rupees. Every week has at least one delivered order.",
      },
    ],
    examples: [
      {
        SwiggyOrder: [
          [1, "Mumbai", "food", 450, "delivered"],
          [2, "Mumbai", "instamart", 820, "delivered"],
          [3, "Mumbai", "food", 300, "delivered"],
          [4, "Mumbai", "genie", 99, "cancelled"],
          [5, "Bengaluru", "instamart", 610, "delivered"],
          [6, "Bengaluru", "genie", 120, "delivered"],
          [7, "Bengaluru", "food", 510, "cancelled"],
          [8, "Pune", "food", 380, "cancelled"],
          [9, "Bengaluru", "instamart", 240, "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      const cities = sample(rng, CITIES, ri(rng, 1, 4));
      const rows: Cell[][] = seq(1, ri(rng, 1, 20)).map((id, i) => [
        id,
        pick(rng, cities),
        pick(rng, ["food", "food", "instamart", "genie"]),
        roundTo(rng, 80, 1200, 10),
        i === 0 || chance(rng, 0.8) ? "delivered" : "cancelled",
      ]);
      return { SwiggyOrder: shuffle(rng, rows) };
    },
    solution: [
      "SELECT city, business, orders, gmv FROM (",
      "  SELECT city, business, COUNT(*) AS orders, SUM(order_value) AS gmv, 0 AS city_level, 0 AS row_level",
      "  FROM SwiggyOrder WHERE status = 'delivered'",
      "  GROUP BY city, business",
      "  UNION ALL",
      "  SELECT city, 'All businesses', COUNT(*), SUM(order_value), 0, 1",
      "  FROM SwiggyOrder WHERE status = 'delivered'",
      "  GROUP BY city",
      "  UNION ALL",
      "  SELECT 'All cities', 'All businesses', COUNT(*), SUM(order_value), 1, 1",
      "  FROM SwiggyOrder WHERE status = 'delivered'",
      ") report",
      "ORDER BY city_level, city, row_level, business",
    ].join("\n"),
    alternatives: [
      [
        "SELECT city, business, orders, gmv FROM (",
        "  SELECT CASE WHEN lv.n = 3 THEN 'All cities' ELSE o.city END AS city,",
        "         CASE WHEN lv.n >= 2 THEN 'All businesses' ELSE o.business END AS business,",
        "         COUNT(*) AS orders, SUM(o.order_value) AS gmv,",
        "         MAX(CASE WHEN lv.n = 3 THEN 1 ELSE 0 END) AS city_level,",
        "         MAX(CASE WHEN lv.n >= 2 THEN 1 ELSE 0 END) AS row_level",
        "  FROM SwiggyOrder o",
        "  CROSS JOIN (SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3) lv",
        "  WHERE o.status = 'delivered'",
        "  GROUP BY lv.n, CASE WHEN lv.n = 3 THEN 'All cities' ELSE o.city END,",
        "           CASE WHEN lv.n >= 2 THEN 'All businesses' ELSE o.business END",
        ") report",
        "ORDER BY city_level, city, row_level, business",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The three kinds of rows are three GROUP BYs of the same filtered orders: by city and business, by city, and by nothing.",
      "Stack them with `UNION ALL`, filling the missing grouping column with a label.",
      "Alphabetical order would put \"All cities\" first — carry hidden sort columns that say what level a row is.",
      "Wrap the union in a derived table so the outer query can sort on those columns without returning them.",
    ],
    editorial: [
      "A report with subtotals is several aggregations of the same rows, stacked. The detail rows are `GROUP BY city, business`; the city subtotals are `GROUP BY city` with the business column filled by the label `'All businesses'`; the grand total is an aggregate with no `GROUP BY` at all, both columns labelled. `UNION ALL` stacks them — `UNION` would also work but pays for a pointless duplicate check. Each branch repeats the `status = 'delivered'` filter, so every level counts the same orders and the subtotals add up to the detail rows.",
      "",
      "The order is the subtle part. Sorting by `city` alone would put `'All cities'` before Bengaluru, and within a city `'All businesses'` before `food`. So each branch carries two hidden level columns — `city_level` is 1 only for the grand total, `row_level` is 1 for any total row — and the outer query sorts by `city_level, city, row_level, business`, which places every city's lines, then its subtotal, then the grand total at the very end. The union sits in a derived table so the outer `SELECT` can drop the sort columns.",
      "",
      "MySQL's `GROUP BY … WITH ROLLUP` produces such rows natively (with NULLs that `GROUPING()` identifies). The alternative builds the same rollup in one pass: it cross-joins the orders with three level numbers and groups by the level and by expressions that blank out the columns the level rolls up — each order is counted once per level.",
    ].join("\n"),
  },

  {
    slug: "swiggy-units-sold-per-item-from-instamart-combo-codes",
    title: "Swiggy: Units Sold per Item From Instamart Combo Codes",
    difficulty: "HARD",
    topics: ["Strings", "Subqueries", "Aggregation"],
    description: [
      "Instamart sells **combo packs** — a breakfast pack, a party pack — and the point-of-sale system logs each sale with a packed combo code instead of one row per item. The replenishment team needs plain item counts per store to reorder stock.",
      "",
      "A `combo_code` lists the items of one pack as `ITEM:units` entries separated by `|`, for example `MILK:2|BREAD:1|EGGS:6`; a code has one to four entries and never repeats an item. A sale of `packs` combo packs moves `units × packs` of every item in its code. Considering only sales with status `sold` (returns are ignored), return `store_id`, `item_code` and `units_sold`, the total units of each item that left each store. Order the rows by `store_id`, then `item_code`.",
    ].join("\n"),
    tables: [
      {
        name: "ComboSale",
        columns: [
          { name: "sale_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "combo_code", type: "varchar" },
          { name: "packs", type: "int" },
          { name: "status", type: "enum", values: ["sold", "returned"] },
        ],
        primaryKey: ["sale_id"],
        note: "One row per combo sale at a dark store. Item codes are upper-case letters; `units` is a whole number from 1 to 9.",
      },
    ],
    examples: [
      {
        ComboSale: [
          [1, 1, "MILK:2|BREAD:1|EGGS:6", 1, "sold"],
          [2, 1, "MILK:1|MAGGI:4", 2, "sold"],
          [3, 1, "BREAD:2", 3, "sold"],
          [4, 1, "EGGS:6|BUTTER:1", 1, "returned"],
          [5, 2, "ATTA:1|CURD:2|MILK:2|ONION:3", 2, "sold"],
          [6, 2, "CURD:1", 1, "sold"],
          [7, 3, "MILK:1", 4, "returned"],
        ],
      },
    ],
    gen: (rng) => {
      const items = ["MILK", "BREAD", "EGGS", "BUTTER", "ATTA", "CURD", "MAGGI", "ONION"] as const;
      const rows: Cell[][] = seq(1, ri(rng, 1, 12)).map((id) => [
        id,
        ri(rng, 1, 3),
        sample(rng, items, ri(rng, 1, 4)).map((it) => `${it}:${ri(rng, 1, 9)}`).join("|"),
        ri(rng, 1, 3),
        chance(rng, 0.15) ? "returned" : "sold",
      ]);
      return { ComboSale: rows };
    },
    solution: [
      "WITH RECURSIVE parts AS (",
      "  SELECT sale_id, store_id, packs,",
      "         SUBSTRING_INDEX(combo_code, '|', 1) AS part,",
      "         IF(LOCATE('|', combo_code) > 0, SUBSTRING(combo_code, LOCATE('|', combo_code) + 1), '') AS rest",
      "  FROM ComboSale",
      "  WHERE status = 'sold'",
      "  UNION ALL",
      "  SELECT sale_id, store_id, packs,",
      "         SUBSTRING_INDEX(rest, '|', 1),",
      "         IF(LOCATE('|', rest) > 0, SUBSTRING(rest, LOCATE('|', rest) + 1), '')",
      "  FROM parts",
      "  WHERE rest <> ''",
      ")",
      "SELECT store_id, SUBSTRING_INDEX(part, ':', 1) AS item_code,",
      "       SUM(CAST(SUBSTRING_INDEX(part, ':', -1) AS SIGNED) * packs) AS units_sold",
      "FROM parts",
      "GROUP BY store_id, item_code",
      "ORDER BY store_id, item_code",
    ].join("\n"),
    alternatives: [
      [
        "SELECT store_id, SUBSTRING_INDEX(part, ':', 1) AS item_code,",
        "       SUM(CAST(SUBSTRING_INDEX(part, ':', -1) AS SIGNED) * packs) AS units_sold",
        "FROM (",
        "  SELECT s.store_id, s.packs,",
        "         SUBSTRING_INDEX(SUBSTRING_INDEX(s.combo_code, '|', n.k), '|', -1) AS part",
        "  FROM ComboSale s",
        "  JOIN (SELECT 1 AS k UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4) n",
        "    ON n.k <= 1 + CHAR_LENGTH(s.combo_code) - CHAR_LENGTH(REPLACE(s.combo_code, '|', ''))",
        "  WHERE s.status = 'sold'",
        ") p",
        "GROUP BY store_id, item_code",
        "ORDER BY store_id, item_code",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First turn each sale into one row per `ITEM:units` entry; only then can items from different combos be added up.",
      "`SUBSTRING_INDEX(s, '|', 1)` is the first entry; the rest of the string starts after the first `|`.",
      "A recursive CTE can peel one entry off per step until nothing is left — or join each sale to the numbers 1 to 4 and pick the n-th entry.",
      "The number of entries is one more than the number of `|` characters.",
    ],
    editorial: [
      "The data is packed into one string per sale, so the work is to **unpack it into rows** and then aggregate normally. The recursive CTE does it one entry at a time: the anchor takes the first entry with `SUBSTRING_INDEX(combo_code, '|', 1)` and keeps everything after the first `|` as `rest` (or `''` when there is no `|`); the recursive step repeats the same on `rest` and stops when `rest` is empty. Every sale therefore produces exactly as many rows as its code has entries. Returned sales are filtered in the anchor, so they never enter the recursion.",
      "",
      "Each entry is then split on `:` — `SUBSTRING_INDEX(part, ':', 1)` is the item, `SUBSTRING_INDEX(part, ':', -1)` the units, cast to a number — and multiplied by `packs`. Grouping by store and item adds up the same item across different combos, which is the whole point: `MILK` from a breakfast pack and from a tea-time pack are one shelf.",
      "",
      "The alternative avoids recursion with a tiny **numbers table**: joining each sale to 1–4, keeping `k` up to its entry count (one more than the number of `|`, computed as a length difference after `REPLACE`), and taking the k-th entry with a nested `SUBSTRING_INDEX`. It relies on the four-entry limit; the recursive version works for any length. Both are linear in the total number of entries.",
    ].join("\n"),
  },

  {
    slug: "swiggy-kitchens-slowing-down-three-weeks-running",
    title: "Swiggy: Kitchens Slowing Down Three Weeks Running",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Aggregation"],
    description: [
      "One slow week can be a staff shortage; a kitchen whose average prep time rises week after week is a trend the account manager should call about.",
      "",
      "Weeks run **Monday to Sunday**. A restaurant's weekly prep time is the average, over its orders accepted that week, of the minutes from `accepted_at` to `ready_at`. Find every time a restaurant's weekly average went up **strictly** two weeks in a row across **three consecutive calendar weeks** — a week with no orders breaks the chain. Return `restaurant_name` and `week_start` (the Monday of the **third** week) for every such triple; overlapping triples are all reported. Order by `restaurant_name`, then `week_start`.",
    ].join("\n"),
    tables: [
      {
        name: "Restaurant",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "restaurant_name", type: "varchar" },
        ],
        primaryKey: ["restaurant_id"],
        note: "One row per restaurant; names are unique.",
      },
      {
        name: "KitchenTicket",
        columns: [
          { name: "order_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "accepted_at", type: "datetime" },
          { name: "ready_at", type: "datetime" },
        ],
        primaryKey: ["order_id"],
        note: "One row per order the kitchen prepared; times are recorded to the minute and an order is ready the same day it was accepted.",
      },
    ],
    examples: [
      {
        Restaurant: [
          [1, "Biryani Bowl House"],
          [2, "Dosa Corner"],
          [3, "Momo Hub"],
        ],
        KitchenTicket: [
          [1, 1, "2025-06-03 12:00:00", "2025-06-03 12:15:00"],
          [2, 1, "2025-06-09 12:00:00", "2025-06-09 12:16:00"],
          [3, 1, "2025-06-15 20:00:00", "2025-06-15 20:18:00"],
          [4, 1, "2025-06-18 13:00:00", "2025-06-18 13:20:00"],
          [5, 1, "2025-06-25 13:00:00", "2025-06-25 13:22:00"],
          [6, 2, "2025-06-04 09:00:00", "2025-06-04 09:10:00"],
          [7, 2, "2025-06-08 09:00:00", "2025-06-08 09:12:00"],
          [8, 2, "2025-06-24 09:00:00", "2025-06-24 09:14:00"],
          [9, 2, "2025-07-01 09:00:00", "2025-07-01 09:16:00"],
          [10, 3, "2025-06-02 18:00:00", "2025-06-02 18:12:00"],
          [11, 3, "2025-06-10 18:00:00", "2025-06-10 18:14:00"],
          [12, 3, "2025-06-17 18:00:00", "2025-06-17 18:14:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rests: Cell[][] = sample(rng, RESTAURANTS, ri(rng, 1, 3)).map((name, i) => [i + 1, name]);
      const tickets: Cell[][] = [];
      for (const r of rests) {
        let base = ri(rng, 8, 20);
        for (let w = 0; w < ri(rng, 3, 5); w++) {
          base += pick(rng, [-3, -1, 0, 1, 2, 2, 3, 4]);
          if (chance(rng, 0.12)) continue;
          for (let k = ri(rng, 1, 2); k > 0; k--) {
            const day = addDays("2025-06-02", w * 7 + ri(rng, 0, 6));
            const start = ri(rng, 11 * 60, 22 * 60);
            tickets.push([0, r[0], at(day, start), at(day, start + Math.max(4, base + ri(rng, -1, 1)))]);
          }
        }
      }
      const ids = shuffle(rng, seq(1, tickets.length));
      tickets.forEach((t, i) => (t[0] = ids[i]!));
      return { Restaurant: rests, KitchenTicket: tickets };
    },
    solution: [
      "WITH weekly AS (",
      "  SELECT restaurant_id,",
      "         DATE_SUB(DATE(accepted_at), INTERVAL WEEKDAY(accepted_at) DAY) AS week_start,",
      "         AVG(TIMESTAMPDIFF(MINUTE, accepted_at, ready_at)) AS avg_prep",
      "  FROM KitchenTicket",
      "  GROUP BY restaurant_id, week_start",
      "), lagged AS (",
      "  SELECT restaurant_id, week_start, avg_prep,",
      "         LAG(week_start, 1) OVER (PARTITION BY restaurant_id ORDER BY week_start) AS w1,",
      "         LAG(avg_prep, 1) OVER (PARTITION BY restaurant_id ORDER BY week_start) AS a1,",
      "         LAG(week_start, 2) OVER (PARTITION BY restaurant_id ORDER BY week_start) AS w2,",
      "         LAG(avg_prep, 2) OVER (PARTITION BY restaurant_id ORDER BY week_start) AS a2",
      "  FROM weekly",
      ")",
      "SELECT r.restaurant_name, l.week_start",
      "FROM lagged l",
      "JOIN Restaurant r ON r.restaurant_id = l.restaurant_id",
      "WHERE l.w1 = DATE_SUB(l.week_start, INTERVAL 7 DAY)",
      "  AND l.w2 = DATE_SUB(l.week_start, INTERVAL 14 DAY)",
      "  AND l.avg_prep > l.a1 AND l.a1 > l.a2",
      "ORDER BY r.restaurant_name, l.week_start",
    ].join("\n"),
    alternatives: [
      [
        "WITH weekly AS (",
        "  SELECT restaurant_id,",
        "         DATE_SUB(DATE(accepted_at), INTERVAL WEEKDAY(accepted_at) DAY) AS week_start,",
        "         AVG(TIMESTAMPDIFF(MINUTE, accepted_at, ready_at)) AS avg_prep",
        "  FROM KitchenTicket",
        "  GROUP BY restaurant_id, week_start",
        ")",
        "SELECT r.restaurant_name, c.week_start",
        "FROM weekly c",
        "JOIN weekly b ON b.restaurant_id = c.restaurant_id AND b.week_start = DATE_SUB(c.week_start, INTERVAL 7 DAY)",
        "JOIN weekly a ON a.restaurant_id = c.restaurant_id AND a.week_start = DATE_SUB(c.week_start, INTERVAL 14 DAY)",
        "JOIN Restaurant r ON r.restaurant_id = c.restaurant_id",
        "WHERE c.avg_prep > b.avg_prep AND b.avg_prep > a.avg_prep",
        "ORDER BY r.restaurant_name, c.week_start",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Map every order to the Monday of its week: subtract `WEEKDAY(date)` days.",
      "Aggregate to one row per restaurant and week before comparing anything.",
      "`LAG(…, 1)` and `LAG(…, 2)` bring the two previous weeks onto the current row — but check they really are the previous calendar weeks.",
      "Strictly rising means each average is greater than the one before; equal breaks it.",
    ],
    editorial: [
      "The first step is to give each order its week. `WEEKDAY(d)` is 0 for Monday through 6 for Sunday, so `DATE_SUB(DATE(accepted_at), INTERVAL WEEKDAY(accepted_at) DAY)` is the Monday that starts the order's week — a Sunday order belongs to the week that began six days earlier. Grouping by restaurant and that Monday gives one weekly average per restaurant and week. (MySQL's `WEEK()` and `YEARWEEK()` depend on a mode argument and are not portable; the Monday date is unambiguous and readable.)",
      "",
      "Then compare each week with the two before it. `LAG(…, 1)` and `LAG(…, 2)` over the restaurant's weeks bring the previous rows' Mondays and averages onto the current row. The previous *row* is not necessarily the previous *week*: if a restaurant had no orders one week, the row before is two weeks back. So the query also checks that the lagged Mondays are exactly 7 and 14 days earlier, and only then requires `avg_prep > a1 > a2`, strictly. Every week that ends such a triple is reported, so four rising weeks give two rows.",
      "",
      "The alternative self-joins the weekly table three times on the exact Mondays, which states the calendar condition directly. Both aggregate the tickets once; the window version then sorts each restaurant's weeks, the join version does three lookups per week.",
    ].join("\n"),
  },

  {
    slug: "swiggy-instamart-items-most-often-bought-together",
    title: "Swiggy: Instamart Items Most Often Bought Together",
    difficulty: "HARD",
    topics: ["Joins", "Aggregation", "Window Functions"],
    description: [
      "The Instamart merchandising team builds \"frequently bought together\" combos from basket data: which two items land in the same order most often.",
      "",
      "For every pair of different SKUs, count the orders that contain **both**. Consider only pairs bought together in **at least two** orders, and return the pairs whose count ranks in the **top 3** — rank by count with ties sharing a rank and the next rank skipping (as `RANK()` does), so every pair tied at rank 3 is included. Return `sku_a` and `sku_b` (the two names, `sku_a` alphabetically first) and `orders_together`. Order by `orders_together` descending, then `sku_a`, then `sku_b`.",
    ].join("\n"),
    tables: [
      {
        name: "Sku",
        columns: [
          { name: "sku_id", type: "int" },
          { name: "sku_name", type: "varchar" },
        ],
        primaryKey: ["sku_id"],
        note: "One row per catalogue item; names are unique.",
      },
      {
        name: "OrderLine",
        columns: [
          { name: "order_id", type: "int" },
          { name: "sku_id", type: "int" },
          { name: "qty", type: "int" },
        ],
        primaryKey: ["order_id", "sku_id"],
        note: "One row per item in an order — an item appears at most once per order, with its quantity.",
      },
    ],
    examples: [
      {
        Sku: [
          [1, "Amul Butter"],
          [2, "Bread Loaf"],
          [3, "Eggs Tray"],
          [4, "Maggi Noodles"],
          [5, "Onion Pack"],
        ],
        OrderLine: [
          [1, 1, 1], [1, 2, 1], [1, 3, 1],
          [2, 1, 2], [2, 2, 1],
          [3, 2, 1], [3, 3, 1],
          [4, 1, 1], [4, 2, 2], [4, 4, 3],
          [5, 3, 1], [5, 4, 2], [5, 5, 1],
          [6, 4, 1], [6, 5, 2],
          [7, 2, 1], [7, 3, 2],
          [8, 1, 1], [8, 3, 1],
        ],
      },
    ],
    gen: (rng) => {
      const names = sample(rng, SKUS, ri(rng, 3, 6));
      const skus: Cell[][] = names.map((name, i) => [i + 1, name]);
      const lines: Cell[][] = [];
      for (const order of seq(1, ri(rng, 2, 7))) {
        // The first SKUs are the staples, so some pairs come up again and again.
        const pool = chance(rng, 0.6) ? skus.slice(0, Math.min(3, skus.length)) : skus;
        for (const s of sample(rng, pool, ri(rng, 1, 3))) lines.push([order, s[0], ri(rng, 1, 3)]);
      }
      return { Sku: shuffle(rng, skus), OrderLine: shuffle(rng, lines) };
    },
    solution: [
      "WITH pairs AS (",
      "  SELECT a.sku_id AS x, b.sku_id AS y, COUNT(*) AS orders_together",
      "  FROM OrderLine a",
      "  JOIN OrderLine b ON b.order_id = a.order_id AND b.sku_id > a.sku_id",
      "  GROUP BY a.sku_id, b.sku_id",
      "  HAVING COUNT(*) >= 2",
      "), named AS (",
      "  SELECT CASE WHEN s1.sku_name < s2.sku_name THEN s1.sku_name ELSE s2.sku_name END AS sku_a,",
      "         CASE WHEN s1.sku_name < s2.sku_name THEN s2.sku_name ELSE s1.sku_name END AS sku_b,",
      "         p.orders_together,",
      "         RANK() OVER (ORDER BY p.orders_together DESC) AS pos",
      "  FROM pairs p",
      "  JOIN Sku s1 ON s1.sku_id = p.x",
      "  JOIN Sku s2 ON s2.sku_id = p.y",
      ")",
      "SELECT sku_a, sku_b, orders_together",
      "FROM named",
      "WHERE pos <= 3",
      "ORDER BY orders_together DESC, sku_a, sku_b",
    ].join("\n"),
    alternatives: [
      [
        "WITH pairs AS (",
        "  SELECT s1.sku_name AS sku_a, s2.sku_name AS sku_b, COUNT(*) AS orders_together",
        "  FROM OrderLine a",
        "  JOIN OrderLine b ON b.order_id = a.order_id",
        "  JOIN Sku s1 ON s1.sku_id = a.sku_id",
        "  JOIN Sku s2 ON s2.sku_id = b.sku_id",
        "  WHERE s1.sku_name < s2.sku_name",
        "  GROUP BY s1.sku_name, s2.sku_name",
        "  HAVING COUNT(*) >= 2",
        ")",
        "SELECT p.sku_a, p.sku_b, p.orders_together",
        "FROM pairs p",
        "WHERE (SELECT COUNT(*) FROM pairs q WHERE q.orders_together > p.orders_together) < 3",
        "ORDER BY p.orders_together DESC, p.sku_a, p.sku_b",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Join the order lines to themselves on `order_id` to see every pair of items in the same basket.",
      "Count each unordered pair once: keep only pairs where the first id (or name) is smaller than the second.",
      "\"Top 3 with ties\" is `RANK() <= 3`.",
      "A pair's rank under `RANK()` is one plus the number of pairs with a strictly larger count.",
    ],
    editorial: [
      "Pairs of items in the same basket come from a **self join** of `OrderLine` on `order_id`. Joining without a condition on the items would pair every item with itself and count every pair twice, (A, B) and (B, A); requiring `b.sku_id > a.sku_id` keeps each unordered pair exactly once. Grouping by the pair then counts the orders containing both — each order contributes one joined row per pair, because an item appears at most once per order — and `HAVING COUNT(*) >= 2` drops pairs seen in a single basket.",
      "",
      "The names are attached afterwards and put in alphabetical order with two `CASE` expressions, since the smaller id is not necessarily the alphabetically first name. Ranking uses `RANK()`, which gives tied counts the same rank and skips the next one, so `pos <= 3` returns every pair tied at the boundary — as asked — rather than an arbitrary three.",
      "",
      "The alternative pairs by name directly (`s1.sku_name < s2.sku_name`, which both deduplicates and orders the pair) and replaces the window with its definition: a pair is in the top 3 when fewer than three pairs have a strictly larger count. That correlated count is exactly `RANK() - 1`. The self join is the expensive part — quadratic in basket size — which is why real systems cap basket length or sample orders.",
    ].join("\n"),
  },

  {
    slug: "swiggy-instamart-picking-bags-from-order-lines",
    title: "Swiggy: Instamart Picking Bags From Order Lines",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins", "Aggregation"],
    description: [
      "In an Instamart dark store a picker walks the aisles for one order and drops every **unit** into a delivery bag; a bag holds **4 units**, and a new bag is opened when the current one is full. The store-ops team wants the bag-by-bag packing list printed for the picker.",
      "",
      "An order line of `qty` N is N separate units. Units are picked in order of the SKU's `aisle`, then `sku_name`, and the units of one line one after another. The 1st to 4th units picked go into bag 1, the 5th to 8th into bag 2, and so on. For every order and bag, return `order_id`, `bag_no`, `units` (units in the bag) and `bag_items`, the distinct SKU names in the bag in alphabetical order joined by `', '`. Order the rows by `order_id`, then `bag_no`.",
    ].join("\n"),
    tables: [
      {
        name: "Sku",
        columns: [
          { name: "sku_id", type: "int" },
          { name: "sku_name", type: "varchar" },
          { name: "aisle", type: "int" },
        ],
        primaryKey: ["sku_id"],
        note: "One row per catalogue item with the aisle it sits in. Names are unique.",
      },
      {
        name: "OrderLine",
        columns: [
          { name: "order_id", type: "int" },
          { name: "sku_id", type: "int" },
          { name: "qty", type: "int" },
        ],
        primaryKey: ["order_id", "sku_id"],
        note: "One row per item in an order; `qty` is between 1 and 12.",
      },
    ],
    examples: [
      {
        Sku: [
          [1, "Amul Butter", 2],
          [2, "Bread Loaf", 1],
          [3, "Eggs Tray", 2],
          [4, "Toned Milk", 3],
          [5, "Maggi Noodles", 1],
        ],
        OrderLine: [
          [101, 2, 1],
          [101, 4, 3],
          [101, 3, 2],
          [101, 5, 2],
          [102, 1, 4],
          [103, 4, 1],
        ],
      },
    ],
    gen: (rng) => {
      const skus: Cell[][] = sample(rng, SKUS, ri(rng, 2, 6)).map((name, i) => [i + 1, name, ri(rng, 1, 3)]);
      const lines: Cell[][] = [];
      for (const order of seq(101, ri(rng, 1, 4))) {
        for (const s of sample(rng, skus, ri(rng, 1, 4))) lines.push([order, s[0], pick(rng, [1, 1, 2, 3, 4, 5, 7])]);
      }
      return { Sku: skus, OrderLine: shuffle(rng, lines) };
    },
    solution: [
      "WITH RECURSIVE nums AS (",
      "  SELECT 1 AS k",
      "  UNION ALL",
      "  SELECT k + 1 FROM nums WHERE k < 12",
      "), units AS (",
      "  SELECT l.order_id, s.sku_name,",
      "         ROW_NUMBER() OVER (PARTITION BY l.order_id ORDER BY s.aisle, s.sku_name, n.k) AS pick_no",
      "  FROM OrderLine l",
      "  JOIN Sku s ON s.sku_id = l.sku_id",
      "  JOIN nums n ON n.k <= l.qty",
      ")",
      "SELECT order_id, (pick_no - 1) DIV 4 + 1 AS bag_no, COUNT(*) AS units,",
      "       GROUP_CONCAT(DISTINCT sku_name ORDER BY sku_name SEPARATOR ', ') AS bag_items",
      "FROM units",
      "GROUP BY order_id, bag_no",
      "ORDER BY order_id, bag_no",
    ].join("\n"),
    alternatives: [
      [
        "WITH cum AS (",
        "  SELECT l.order_id, s.sku_name, l.qty,",
        "         SUM(l.qty) OVER (PARTITION BY l.order_id ORDER BY s.aisle, s.sku_name ROWS UNBOUNDED PRECEDING) AS upto",
        "  FROM OrderLine l JOIN Sku s ON s.sku_id = l.sku_id",
        "), bags AS (",
        "  SELECT 1 AS b UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6",
        "  UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12",
        "), pieces AS (",
        "  SELECT c.order_id, g.b AS bag_no, c.sku_name,",
        "         LEAST(c.upto, g.b * 4) - GREATEST(c.upto - c.qty, (g.b - 1) * 4) AS n",
        "  FROM cum c JOIN bags g",
        "    ON (g.b - 1) * 4 < c.upto AND g.b * 4 > c.upto - c.qty",
        ")",
        "SELECT order_id, bag_no, SUM(n) AS units,",
        "       GROUP_CONCAT(sku_name ORDER BY sku_name SEPARATOR ', ') AS bag_items",
        "FROM pieces",
        "GROUP BY order_id, bag_no",
        "ORDER BY order_id, bag_no",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Make one row per unit: join each line to a list of numbers 1, 2, 3, … and keep the numbers up to its `qty`.",
      "Number the units of each order in picking order with `ROW_NUMBER()` — aisle, name, then the unit number.",
      "Units 1–4 are bag 1, 5–8 bag 2: integer-divide `pick_no − 1` by 4 and add 1.",
      "A recursive CTE is an easy way to produce the numbers 1 to 12.",
    ],
    editorial: [
      "The rule is stated per unit, but the data is per line, so the first step **expands quantities into rows**. A small numbers table — here `nums`, the numbers 1 to 12 from a recursive CTE — is joined to every line with `n.k <= l.qty`, which turns a line of quantity 3 into three rows and a line of quantity 1 into one. Any table with enough consecutive integers would do; the recursion just saves typing them.",
      "",
      "With one row per unit, the picking order is a `ROW_NUMBER()` per order over `aisle, sku_name, k` — the unit number keeps a line's units together and makes the numbering total, so it never depends on storage order. Bags then fall out of integer arithmetic: `(pick_no - 1) DIV 4 + 1` maps units 1–4 to bag 1, 5–8 to bag 2. Grouping by order and bag gives the unit count, and `GROUP_CONCAT(DISTINCT sku_name ORDER BY sku_name …)` lists each SKU once even when several of its units share a bag; a line split across two bags appears in both. `pick_no - 1` is never negative, so the subtraction is safe on MySQL's unsigned `ROW_NUMBER()`.",
      "",
      "The alternative never expands units. A running `SUM(qty)` gives each line the range of pick positions it occupies, `(upto − qty, upto]`; joining the lines to bag numbers whose range `((b − 1)·4, b·4]` overlaps it, and measuring the overlap with `LEAST`/`GREATEST`, gives the units of that line in that bag. It does less work for large quantities; the expansion is easier to read and to extend (for example to per-unit weights).",
    ].join("\n"),
  },
];
