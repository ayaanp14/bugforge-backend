import type { Cell } from "../sql/types.js";
import type { Rng, SqlProblemSpec } from "./types.js";
import { addDays, chance, dateBetween, pick, ri, roundTo, sample, shuffle } from "./kit.js";

/**
 * Amazon: the questions an analyst or data engineer at a large marketplace
 * and cloud company is handed — Prime Day lightning deals, the Buy Box,
 * marketplace seller fees and account health, fulfilment-centre pick rates
 * and commingled bins, delivery-station routes and van loads, package
 * tracking scans, Alexa and Kindle usage, Subscribe & Save, sponsored-ads
 * auctions and AWS billing (per-second EC2, Savings Plans, promotional
 * credits). Every schema and every figure here is invented for practice; none
 * of it is Amazon's real data model or numbers. Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
const pad = (n: number) => String(n).padStart(2, "0");
/** 'YYYY-MM-DD HH:MM:SS' from a date and seconds after its midnight (may run past it). */
const atSec = (date: string, seconds: number): string => {
  const d = addDays(date, Math.floor(seconds / 86400));
  const s = ((seconds % 86400) + 86400) % 86400;
  return `${d} ${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};
/** 'YYYY-MM-DD HH:MM:00' from a date and minutes after its midnight. */
const atMin = (date: string, minutes: number): string => atSec(date, minutes * 60);

const ASIN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
/** A made-up ASIN-shaped id: B0 and eight letters/digits. */
const asinOf = (rng: Rng): string => "B0" + Array.from({ length: 8 }, () => ASIN_CHARS[ri(rng, 0, ASIN_CHARS.length - 1)]).join("");
/** `n` distinct ASIN-shaped ids. */
const asins = (rng: Rng, n: number): string[] => {
  const out = new Set<string>();
  while (out.size < n) out.add(asinOf(rng));
  return [...out];
};

const SELLER_NAMES = [
  "Sunrise Traders", "Kaveri Retail", "Blue Peak Store", "Mehta Electronics", "Deccan Deals",
  "Indus Mart", "Lotus Goods", "Coastal Supply", "Nilgiri Naturals", "Urban Basket",
] as const;
const STATIONS = ["DBL1", "DHY2", "DMU4", "DDE7", "DCH3", "DPN1"] as const;

export const COMPANY_AMAZON: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "amazon-lightning-deals-that-sold-out-early",
    title: "Amazon: Lightning Deals That Sold Out Before Ending",
    difficulty: "EASY",
    topics: ["Basics", "Dates"],
    description: [
      "The Prime Day deals team wants to know which lightning deals were under-stocked: the ones that **sold out before their window closed**, and how much selling time was left on the clock.",
      "",
      "A deal sold out when `units_claimed` reached `units_offered`. Return every deal that sold out with its last claim **strictly before** `ends_at` — a deal whose last unit went at the exact closing second is not early. Return `deal_id`, `asin` and `minutes_left`, the whole minutes from `last_claim_at` to `ends_at` (partial minutes dropped, as `TIMESTAMPDIFF` does). Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "LightningDeal",
        columns: [
          { name: "deal_id", type: "int" },
          { name: "asin", type: "varchar" },
          { name: "starts_at", type: "datetime" },
          { name: "ends_at", type: "datetime" },
          { name: "units_offered", type: "int" },
          { name: "units_claimed", type: "int" },
          { name: "last_claim_at", type: "datetime" },
        ],
        primaryKey: ["deal_id"],
        note: "One row per lightning deal. `units_claimed` never exceeds `units_offered`; `last_claim_at` is the time of the latest claim, NULL when nothing was claimed.",
      },
    ],
    examples: [
      {
        LightningDeal: [
          [1, "B0C1XK7Q2M", "2025-07-08 08:00:00", "2025-07-08 14:00:00", 500, 500, "2025-07-08 11:42:30"],
          [2, "B09V3HN1KD", "2025-07-08 09:00:00", "2025-07-08 15:00:00", 300, 287, "2025-07-08 14:58:00"],
          [3, "B0BSHF7WHW", "2025-07-08 10:00:00", "2025-07-08 16:00:00", 200, 200, "2025-07-08 16:00:00"],
          [4, "B0D5HQ2LJ9", "2025-07-08 12:00:00", "2025-07-08 18:00:00", 150, 0, null],
          [5, "B0CHX1W2Y8", "2025-07-08 12:00:00", "2025-07-08 18:00:00", 1000, 1000, "2025-07-08 17:59:20"],
          [6, "B0C1XK7Q2M", "2025-07-09 08:00:00", "2025-07-09 20:00:00", 400, 400, "2025-07-09 09:15:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 14);
      const ids = asins(rng, 6);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const day = pick(rng, ["2025-07-08", "2025-07-09"]);
        const start = ri(rng, 6, 12) * 3600;
        const end = start + ri(rng, 4, 12) * 3600;
        const offered = roundTo(rng, 50, 1000, 50);
        const claimed = chance(rng, 0.55) ? offered : chance(rng, 0.2) ? 0 : ri(rng, 1, offered - 1);
        const last = claimed === 0 ? null : chance(rng, 0.15) ? end : ri(rng, start + 60, end);
        return [id, pick(rng, ids), atSec(day, start), atSec(day, end), offered, claimed, last === null ? null : atSec(day, last)];
      });
      return { LightningDeal: rows };
    },
    solution: [
      "SELECT deal_id, asin, TIMESTAMPDIFF(MINUTE, last_claim_at, ends_at) AS minutes_left",
      "FROM LightningDeal",
      "WHERE units_claimed = units_offered",
      "  AND last_claim_at < ends_at",
    ].join("\n"),
    alternatives: [
      "SELECT deal_id, asin, TIMESTAMPDIFF(SECOND, last_claim_at, ends_at) DIV 60 AS minutes_left FROM LightningDeal WHERE units_claimed >= units_offered AND TIMESTAMPDIFF(SECOND, last_claim_at, ends_at) > 0",
    ],
    hints: [
      "Two conditions: every unit was claimed, and the last claim happened before the deal ended.",
      "\"Strictly before\" means a last claim at exactly `ends_at` is left out.",
      "`TIMESTAMPDIFF(MINUTE, earlier, later)` counts whole minutes and drops the remainder.",
    ],
    editorial: [
      "This is a filter on one table plus one computed column. A deal sold out when `units_claimed = units_offered`; because claims never exceed the offer, `>=` says the same thing. A deal that sold out has at least one claim, so its `last_claim_at` is never NULL — and for deals that did not sell out the time is irrelevant because the first condition already drops them.",
      "",
      "The second condition, `last_claim_at < ends_at`, is strict on purpose: a deal whose last unit went at the closing second used its whole window and was not under-stocked. Datetimes stored as `YYYY-MM-DD HH:MM:SS` compare correctly.",
      "",
      "`TIMESTAMPDIFF(MINUTE, last_claim_at, ends_at)` returns the whole minutes between the two times, truncating any leftover seconds — a deal that sold out 40 seconds before the end shows 0 minutes but is still early. The alternative counts seconds and divides with `DIV 60`, which truncates the same way, and states the \"before\" test as a positive second count. Either is one scan of the table.",
    ].join("\n"),
  },

  {
    slug: "amazon-search-queries-mentioning-each-brand",
    title: "Amazon: Search Queries Mentioning Each Brand",
    difficulty: "EASY",
    topics: ["Strings", "Joins", "Aggregation"],
    description: [
      "The search relevance team is sizing branded demand: how often shoppers type a brand's name into the search box.",
      "",
      "For every brand that appears in at least one query, return `brand_name` and `searches`, the number of search queries whose `query_text` **contains the brand name anywhere** (as a substring). A query that names two brands counts once for each of them. Brands no query mentions are left out. All text is stored in lower case. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Brand",
        columns: [
          { name: "brand_id", type: "int" },
          { name: "brand_name", type: "varchar" },
        ],
        primaryKey: ["brand_id"],
        note: "One row per brand sold on the store; names are lower case and contain only letters.",
      },
      {
        name: "SearchQuery",
        columns: [
          { name: "query_id", type: "int" },
          { name: "query_text", type: "varchar" },
          { name: "searched_on", type: "date" },
        ],
        primaryKey: ["query_id"],
        note: "One row per search typed by a shopper, lower-cased.",
      },
    ],
    examples: [
      {
        Brand: [
          [1, "echo"],
          [2, "boat"],
          [3, "kindle"],
          [4, "prestige"],
          [5, "puma"],
        ],
        SearchQuery: [
          [101, "echo dot 5th gen", "2025-03-01"],
          [102, "boat airdopes 141", "2025-03-01"],
          [103, "kindle paperwhite cover", "2025-03-02"],
          [104, "echo show vs kindle for kids", "2025-03-02"],
          [105, "usb c fast charger", "2025-03-03"],
          [106, "boat smartwatch", "2025-03-03"],
          [107, "echo", "2025-03-04"],
        ],
      },
    ],
    gen: (rng) => {
      const pool = ["echo", "boat", "kindle", "prestige", "puma", "philips", "lakme", "noise"];
      const brands = sample(rng, pool, ri(rng, 1, 6));
      const words = ["dot", "cover", "charger", "shoes", "trimmer", "lipstick", "cooker", "speaker", "case", "men", "kids", "deal"];
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 18);
      const rows: Cell[][] = seq(101, n).map((id) => {
        const parts: string[] = [];
        const k = ri(rng, 0, 2);
        for (let i = 0; i < k; i++) parts.push(pick(rng, pool));
        parts.push(pick(rng, words));
        if (chance(rng, 0.5)) parts.push(pick(rng, words));
        return [id, shuffle(rng, parts).join(" "), dateBetween(rng, "2025-03-01", "2025-03-10")];
      });
      return { Brand: brands.map((b, i) => [i + 1, b]), SearchQuery: rows };
    },
    solution: [
      "SELECT b.brand_name, COUNT(*) AS searches",
      "FROM Brand b",
      "JOIN SearchQuery q ON q.query_text LIKE CONCAT('%', b.brand_name, '%')",
      "GROUP BY b.brand_id, b.brand_name",
    ].join("\n"),
    alternatives: [
      "SELECT b.brand_name, COUNT(q.query_id) AS searches FROM Brand b JOIN SearchQuery q ON LOCATE(b.brand_name, q.query_text) > 0 GROUP BY b.brand_id, b.brand_name",
      "SELECT brand_name, searches FROM (SELECT b.brand_name, (SELECT COUNT(*) FROM SearchQuery q WHERE INSTR(q.query_text, b.brand_name) > 0) AS searches FROM Brand b) t WHERE searches > 0",
    ],
    hints: [
      "A join condition does not have to be an equality — it can be any test between the two rows.",
      "Build the pattern from the brand's own name: `'%' + name + '%'`.",
      "An inner join drops brands that match nothing; count per brand afterwards.",
    ],
    editorial: [
      "Each (brand, query) pair either matches or it does not, so the natural shape is a join whose condition is a **substring test** rather than an equality: `q.query_text LIKE CONCAT('%', b.brand_name, '%')`. The pattern is built per brand row, so every brand is tested against every query.",
      "",
      "After the join, each surviving row is one brand mentioned in one query; grouping by the brand and counting gives the number of searches. A query naming two brands joins to both brand rows and so counts once for each, as the statement asks. A brand that no query mentions has no joined rows and drops out of the inner join on its own.",
      "",
      "`LOCATE(needle, haystack) > 0` and `INSTR(haystack, needle) > 0` are equivalent tests (note the reversed argument order) and appear in the alternatives; the second one counts with a correlated subquery and filters out the zero rows. All of these compare every brand with every query — fine for a dimension table this size; at scale a search index or tokenised table would replace the substring scan.",
    ].join("\n"),
  },

  {
    slug: "amazon-delivery-routes-loaded-beyond-van-capacity",
    title: "Amazon: Delivery Routes Loaded Beyond Their Van's Capacity",
    difficulty: "EASY",
    topics: ["Joins"],
    description: [
      "Before vans leave a delivery station, the station's dispatch lead checks that no route was planned with more packages than its van can carry.",
      "",
      "Return every route whose `packages` is **strictly greater** than the `capacity` of the van assigned to it, with the columns `route_id`, `station_code` and `overflow` (packages minus capacity). Routes with no van assigned yet (`van_id` is NULL) are not checked. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Van",
        columns: [
          { name: "van_id", type: "int" },
          { name: "van_type", type: "enum", values: ["Standard", "Cargo XL", "Electric"] },
          { name: "capacity", type: "int" },
        ],
        primaryKey: ["van_id"],
        note: "One row per delivery van; `capacity` is the most packages it can carry on one route.",
      },
      {
        name: "Route",
        columns: [
          { name: "route_id", type: "int" },
          { name: "route_date", type: "date" },
          { name: "station_code", type: "varchar" },
          { name: "van_id", type: "int" },
          { name: "packages", type: "int" },
        ],
        primaryKey: ["route_id"],
        note: "One row per planned delivery route; `van_id` is NULL until a van is assigned and otherwise always names a van.",
      },
    ],
    examples: [
      {
        Van: [
          [1, "Standard", 180],
          [2, "Cargo XL", 260],
          [3, "Electric", 150],
        ],
        Route: [
          [501, "2025-05-12", "DBL1", 1, 192],
          [502, "2025-05-12", "DBL1", 2, 260],
          [503, "2025-05-12", "DHY2", 3, 151],
          [504, "2025-05-12", "DHY2", null, 300],
          [505, "2025-05-13", "DBL1", 1, 175],
          [506, "2025-05-13", "DHY2", 2, 288],
        ],
      },
    ],
    gen: (rng) => {
      const vans: Cell[][] = seq(1, ri(rng, 1, 5)).map((id) => [id, pick(rng, ["Standard", "Cargo XL", "Electric"]), roundTo(rng, 120, 280, 10)]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 16);
      const rows: Cell[][] = seq(501, n).map((id) => {
        const van = chance(rng, 0.15) ? null : ri(rng, 1, vans.length);
        const cap = van === null ? 200 : (vans[van - 1]![2] as number);
        const pk = chance(rng, 0.2) ? cap : cap + ri(rng, -40, 40);
        return [id, dateBetween(rng, "2025-05-12", "2025-05-15"), pick(rng, STATIONS), van, pk];
      });
      return { Van: vans, Route: rows };
    },
    solution: [
      "SELECT r.route_id, r.station_code, r.packages - v.capacity AS overflow",
      "FROM Route r",
      "JOIN Van v ON v.van_id = r.van_id",
      "WHERE r.packages > v.capacity",
    ].join("\n"),
    alternatives: [
      "SELECT route_id, station_code, overflow FROM (SELECT route_id, station_code, packages - (SELECT capacity FROM Van v WHERE v.van_id = r.van_id) AS overflow FROM Route r) t WHERE overflow > 0",
    ],
    hints: [
      "The capacity lives on the van, the load on the route — bring them onto one row.",
      "An inner join on `van_id` drops routes with no van, because NULL matches nothing.",
      "Keep only rows where the load is strictly above capacity; a full van is fine.",
    ],
    editorial: [
      "The check compares a column of `Route` with a column of `Van`, so the first step is an inner join on `van_id`, which puts each route next to the van it was given. The filter `packages > capacity` keeps the overloaded ones and `packages - capacity` is the overflow the dispatcher has to move to another route.",
      "",
      "Routes still waiting for a van have `van_id` NULL. `NULL = v.van_id` is never true, so the inner join leaves them out, which is what the statement asks — there is no capacity to check them against yet. A route loaded to exactly its van's capacity is full, not over, so the comparison is strict.",
      "",
      "The alternative looks the capacity up with a scalar subquery instead of a join; for an unassigned route the subquery returns NULL, the overflow is NULL, and `overflow > 0` drops it the same way. With the van table keyed on `van_id` both are a single pass over the routes.",
    ].join("\n"),
  },

  {
    slug: "amazon-associates-meeting-the-pick-rate-target",
    title: "Amazon: Associates Meeting the 100 Units-per-Hour Pick Target",
    difficulty: "EASY",
    topics: ["Aggregation"],
    description: [
      "A fulfilment centre's area manager reviews pickers' productivity across the week. For this exercise the target is **100 units per hour**, measured over all of an associate's shifts together, not shift by shift.",
      "",
      "Return every associate who worked **at least 3 shifts** and whose total units picked is **at least 100 times** their total hours worked. Return `associate_id`, `shifts`, `total_units` and `total_hours`, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "PickShift",
        columns: [
          { name: "shift_id", type: "int" },
          { name: "associate_id", type: "int" },
          { name: "shift_date", type: "date" },
          { name: "units_picked", type: "int" },
          { name: "hours_worked", type: "decimal" },
        ],
        primaryKey: ["shift_id"],
        note: "One row per shift an associate spent picking; `hours_worked` is in half-hour steps.",
      },
    ],
    examples: [
      {
        PickShift: [
          [1, 11, "2025-06-02", 820, 8],
          [2, 11, "2025-06-03", 760, 7.5],
          [3, 11, "2025-06-04", 920, 8],
          [4, 12, "2025-06-02", 1000, 10],
          [5, 12, "2025-06-03", 600, 6],
          [6, 12, "2025-06-05", 400, 4],
          [7, 13, "2025-06-02", 1500, 10],
          [8, 13, "2025-06-03", 1400, 10],
          [9, 14, "2025-06-02", 700, 8],
          [10, 14, "2025-06-03", 950, 8],
          [11, 14, "2025-06-04", 900, 8],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 24);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const hours = pick(rng, [4, 6, 7.5, 8, 10]);
        const units = chance(rng, 0.25) ? hours * 100 : Math.round(hours * ri(rng, 80, 125));
        return [id, ri(rng, 11, 16), dateBetween(rng, "2025-06-02", "2025-06-08"), units, hours];
      });
      return { PickShift: rows };
    },
    solution: [
      "SELECT associate_id, COUNT(*) AS shifts, SUM(units_picked) AS total_units, SUM(hours_worked) AS total_hours",
      "FROM PickShift",
      "GROUP BY associate_id",
      "HAVING COUNT(*) >= 3 AND SUM(units_picked) >= 100 * SUM(hours_worked)",
    ].join("\n"),
    alternatives: [
      "SELECT associate_id, shifts, total_units, total_hours FROM (SELECT associate_id, COUNT(shift_id) AS shifts, SUM(units_picked) AS total_units, SUM(hours_worked) AS total_hours FROM PickShift GROUP BY associate_id) t WHERE shifts >= 3 AND total_units / total_hours >= 100",
    ],
    hints: [
      "The rate is measured over all shifts together, so add up units and hours per associate first.",
      "Conditions on totals belong in `HAVING`, after the grouping.",
      "\"At least\" includes an associate at exactly 100 units an hour.",
    ],
    editorial: [
      "The rate is defined over an associate's whole week, so the query groups by `associate_id` and computes the three totals: `COUNT(*)` shifts, `SUM(units_picked)` and `SUM(hours_worked)`. Averaging each shift's own rate would be a different (and wrong) number, because a short shift would weigh as much as a ten-hour one.",
      "",
      "Both conditions are about the groups, so they go in `HAVING`: at least three shifts, and units at least 100 times hours. Writing the test as a multiplication avoids division altogether; the alternative divides in a derived table instead, which gives the same answer because hours are always positive. The boundary is inclusive — an associate at exactly 100 an hour meets the target.",
      "",
      "Associates with fewer than three shifts are left out however fast they were, since a single strong shift says little. The query is one grouped scan of the shift table.",
    ].join("\n"),
  },

  {
    slug: "amazon-return-requests-with-no-delivered-order",
    title: "Amazon: Return Requests With No Delivered Order Behind Them",
    difficulty: "EASY",
    topics: ["Joins", "Conditional Logic"],
    description: [
      "The returns-abuse team audits return requests that should not exist: a return can only be raised against an order that was delivered.",
      "",
      "Return every return request whose order is **missing** from `CustomerOrder`, or exists but is **not delivered**. Return `return_id`, `order_id` and `problem`, which is `'missing order'` when no order with that id exists and `'not delivered'` otherwise. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "CustomerOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "ordered_on", type: "date" },
          { name: "order_status", type: "enum", values: ["placed", "shipped", "delivered", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per customer order with its current status.",
      },
      {
        name: "ReturnRequest",
        columns: [
          { name: "return_id", type: "int" },
          { name: "order_id", type: "int" },
          { name: "requested_on", type: "date" },
          { name: "reason", type: "enum", values: ["damaged", "wrong_item", "not_needed", "defective"] },
        ],
        primaryKey: ["return_id"],
        note: "One row per return request. `order_id` is never NULL, but it may name an order that does not exist.",
      },
    ],
    examples: [
      {
        CustomerOrder: [
          [9001, 41, "2025-04-01", "delivered"],
          [9002, 42, "2025-04-02", "shipped"],
          [9003, 43, "2025-04-02", "cancelled"],
          [9004, 41, "2025-04-03", "delivered"],
        ],
        ReturnRequest: [
          [1, 9001, "2025-04-06", "damaged"],
          [2, 9002, "2025-04-05", "not_needed"],
          [3, 9010, "2025-04-07", "wrong_item"],
          [4, 9003, "2025-04-08", "defective"],
          [5, 9004, "2025-04-09", "not_needed"],
        ],
      },
    ],
    gen: (rng) => {
      const nOrders = ri(rng, 0, 10);
      const orders: Cell[][] = seq(9001, nOrders).map((id) => [id, ri(rng, 41, 46), dateBetween(rng, "2025-04-01", "2025-04-10"), pick(rng, ["placed", "shipped", "delivered", "delivered", "cancelled"])]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 12);
      const rows: Cell[][] = seq(1, n).map((id) => [id, chance(rng, 0.2) || nOrders === 0 ? ri(rng, 9010, 9020) : ri(rng, 9001, 9000 + nOrders), dateBetween(rng, "2025-04-05", "2025-04-15"), pick(rng, ["damaged", "wrong_item", "not_needed", "defective"])]);
      return { CustomerOrder: orders, ReturnRequest: rows };
    },
    solution: [
      "SELECT r.return_id, r.order_id,",
      "       CASE WHEN o.order_id IS NULL THEN 'missing order' ELSE 'not delivered' END AS problem",
      "FROM ReturnRequest r",
      "LEFT JOIN CustomerOrder o ON o.order_id = r.order_id",
      "WHERE o.order_id IS NULL OR o.order_status <> 'delivered'",
    ].join("\n"),
    alternatives: [
      [
        "SELECT return_id, order_id, 'missing order' AS problem FROM ReturnRequest r",
        "WHERE NOT EXISTS (SELECT 1 FROM CustomerOrder o WHERE o.order_id = r.order_id)",
        "UNION ALL",
        "SELECT r.return_id, r.order_id, 'not delivered' FROM ReturnRequest r JOIN CustomerOrder o ON o.order_id = r.order_id WHERE o.order_status <> 'delivered'",
      ].join("\n"),
    ],
    hints: [
      "A request whose order does not exist still has to appear, so the join cannot drop it.",
      "After a LEFT JOIN, a missing order shows up as NULLs in every order column.",
      "Use the same NULL test to choose the label.",
    ],
    editorial: [
      "Two kinds of bad request are wanted, and one of them — an order id that matches nothing — would vanish in an inner join. A **LEFT JOIN** from `ReturnRequest` to `CustomerOrder` keeps every request; where no order matched, the order columns are NULL.",
      "",
      "The filter then keeps a row if `o.order_id IS NULL` (missing) or the matched order's status is anything but `delivered`. Note that the NULL check must come first in the reasoning: for a missing order `o.order_status <> 'delivered'` is NULL, not true, so without the explicit `IS NULL` those requests would be lost. The same test drives the `CASE` that writes the label.",
      "",
      "The alternative splits the two cases: an anti join with `NOT EXISTS` for the missing orders and an inner join for the undelivered ones, glued with `UNION ALL` (the two sets cannot overlap, so no duplicates arise). Both read each table once with an index on `order_id`.",
    ].join("\n"),
  },

  {
    slug: "amazon-alexa-requests-and-households-by-device-family",
    title: "Amazon: Alexa Requests and Households by Device Family",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation", "Dates"],
    description: [
      "The Alexa devices team compares engagement across device families for the monthly business review.",
      "",
      "For **March 2025**, return one row per device family that received at least one request: `family`, `requests` (the number of requests made in March from devices of that family) and `households` (the number of **distinct** households that made them). Families with no March requests are left out. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "EchoDevice",
        columns: [
          { name: "device_id", type: "int" },
          { name: "household_id", type: "int" },
          { name: "family", type: "enum", values: ["Echo Dot", "Echo Show", "Echo Studio", "Fire TV"] },
        ],
        primaryKey: ["device_id"],
        note: "One row per registered device; a household may own several devices, of the same family or different ones.",
      },
      {
        name: "AlexaRequest",
        columns: [
          { name: "request_id", type: "int" },
          { name: "device_id", type: "int" },
          { name: "requested_at", type: "datetime" },
          { name: "intent", type: "varchar" },
        ],
        primaryKey: ["request_id"],
        note: "One row per voice request; `device_id` always names a device.",
      },
    ],
    examples: [
      {
        EchoDevice: [
          [1, 100, "Echo Dot"],
          [2, 100, "Echo Dot"],
          [3, 101, "Echo Show"],
          [4, 102, "Echo Dot"],
          [5, 103, "Fire TV"],
        ],
        AlexaRequest: [
          [1, 1, "2025-03-01 07:10:00", "weather"],
          [2, 2, "2025-03-02 21:30:00", "music"],
          [3, 3, "2025-03-05 18:00:00", "recipe"],
          [4, 4, "2025-03-31 23:59:59", "alarm"],
          [5, 5, "2025-04-01 00:00:00", "video"],
          [6, 3, "2025-02-28 20:00:00", "music"],
          [7, 1, "2025-03-15 06:45:00", "news"],
        ],
      },
    ],
    gen: (rng) => {
      const fams = ["Echo Dot", "Echo Show", "Echo Studio", "Fire TV"];
      const nd = ri(rng, 1, 8);
      const devices: Cell[][] = seq(1, nd).map((id) => [id, ri(rng, 100, 104), pick(rng, fams)]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 20);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const edge = chance(rng, 0.15);
        const ts = edge ? pick(rng, ["2025-03-01 00:00:00", "2025-03-31 23:59:59", "2025-02-28 23:59:59", "2025-04-01 00:00:00"]) : atSec(dateBetween(rng, "2025-02-25", "2025-04-04"), ri(rng, 0, 86399));
        return [id, ri(rng, 1, nd), ts, pick(rng, ["weather", "music", "timer", "news", "shopping", "lights"])];
      });
      return { EchoDevice: devices, AlexaRequest: rows };
    },
    solution: [
      "SELECT d.family, COUNT(*) AS requests, COUNT(DISTINCT d.household_id) AS households",
      "FROM AlexaRequest r",
      "JOIN EchoDevice d ON d.device_id = r.device_id",
      "WHERE r.requested_at >= '2025-03-01' AND r.requested_at < '2025-04-01'",
      "GROUP BY d.family",
    ].join("\n"),
    alternatives: [
      "SELECT d.family, COUNT(r.request_id) AS requests, COUNT(DISTINCT d.household_id) AS households FROM EchoDevice d JOIN AlexaRequest r ON r.device_id = d.device_id AND YEAR(r.requested_at) = 2025 AND MONTH(r.requested_at) = 3 GROUP BY d.family",
    ],
    hints: [
      "The family and the household live on the device, the timestamp on the request — join them.",
      "A half-open range `>= '2025-03-01' AND < '2025-04-01'` covers every second of March.",
      "A household with two devices of one family must be counted once: `COUNT(DISTINCT …)`.",
    ],
    editorial: [
      "Each request needs its device's family and household, so the query starts with an inner join from `AlexaRequest` to `EchoDevice`. The March filter is a half-open range on the timestamp: `>= '2025-03-01'` and `< '2025-04-01'` keeps a request at 23:59:59 on the 31st and drops one at midnight on 1 April, with no need to know how many days March has.",
      "",
      "Grouping by family, `COUNT(*)` counts requests while `COUNT(DISTINCT household_id)` counts households: a household with two Echo Dots talking all month is one household but many requests. Families with no March requests produce no joined rows and so no group — the statement wants them left out, so an inner join is right.",
      "",
      "The alternative filters with `YEAR()` and `MONTH()` inside the join condition. It gives the same answer but cannot use an index on `requested_at`, which the range form can.",
    ].join("\n"),
  },

  {
    slug: "amazon-subscribe-and-save-discount-tier",
    title: "Amazon: Subscribe & Save Discount Tier per Delivery Month",
    difficulty: "EASY",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "In this exercise's version of Subscribe & Save, a customer gets **15%** off every subscription item in a month when **5 or more** of their subscription items are delivered that month, and **5%** otherwise.",
      "",
      "For every customer and month with at least one **delivered** item, return `customer_id`, `delivery_month`, `items` (the delivered items that month) and `discount_pct` (15 or 5). Skipped and cancelled deliveries do not count towards the five. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "SnsDelivery",
        columns: [
          { name: "delivery_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "delivery_month", type: "char" },
          { name: "asin", type: "varchar" },
          { name: "status", type: "enum", values: ["delivered", "skipped", "cancelled"] },
        ],
        primaryKey: ["delivery_id"],
        note: "One row per subscribed item per month, `delivery_month` as 'YYYY-MM'. A customer has at most one row per item per month.",
      },
    ],
    examples: [
      {
        SnsDelivery: [
          [1, 7, "2025-05", "B0DIAPER01", "delivered"],
          [2, 7, "2025-05", "B0WIPES002", "delivered"],
          [3, 7, "2025-05", "B0COFFEE03", "delivered"],
          [4, 7, "2025-05", "B0SOAP0004", "delivered"],
          [5, 7, "2025-05", "B0TEA00005", "delivered"],
          [6, 7, "2025-06", "B0DIAPER01", "delivered"],
          [7, 7, "2025-06", "B0WIPES002", "skipped"],
          [8, 8, "2025-05", "B0COFFEE03", "delivered"],
          [9, 8, "2025-05", "B0TEA00005", "skipped"],
          [10, 9, "2025-05", "B0SOAP0004", "cancelled"],
        ],
      },
    ],
    gen: (rng) => {
      const items = ["B0DIAPER01", "B0WIPES002", "B0COFFEE03", "B0SOAP0004", "B0TEA00005", "B0RICE0006", "B0OIL00007"];
      const rows: Cell[][] = [];
      let id = 1;
      if (chance(rng, 0.05)) return { SnsDelivery: [] };
      for (const c of sample(rng, [7, 8, 9, 10], ri(rng, 1, 4))) {
        for (const m of sample(rng, ["2025-05", "2025-06"], ri(rng, 1, 2))) {
          for (const a of sample(rng, items, ri(rng, 1, 7))) {
            rows.push([id++, c, m, a, pick(rng, ["delivered", "delivered", "delivered", "skipped", "cancelled"])]);
          }
        }
      }
      return { SnsDelivery: rows };
    },
    solution: [
      "SELECT customer_id, delivery_month, COUNT(*) AS items,",
      "       CASE WHEN COUNT(*) >= 5 THEN 15 ELSE 5 END AS discount_pct",
      "FROM SnsDelivery",
      "WHERE status = 'delivered'",
      "GROUP BY customer_id, delivery_month",
    ].join("\n"),
    alternatives: [
      "SELECT customer_id, delivery_month, items, IF(items >= 5, 15, 5) AS discount_pct FROM (SELECT customer_id, delivery_month, SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS items FROM SnsDelivery GROUP BY customer_id, delivery_month) t WHERE items > 0",
    ],
    hints: [
      "One row per customer and month — that is the grouping.",
      "Filter out skipped and cancelled rows before counting.",
      "A `CASE` on the count picks the tier; five items is already the higher tier.",
    ],
    editorial: [
      "The tier is decided per customer per month, so the query groups by `customer_id, delivery_month`. Only delivered items count, and filtering them in `WHERE` before grouping means a month in which everything was skipped or cancelled forms no group at all — exactly the \"at least one delivered item\" rule.",
      "",
      "With the delivered count in hand, `CASE WHEN COUNT(*) >= 5 THEN 15 ELSE 5 END` assigns the tier. The boundary matters: five delivered items earn the higher discount. Since a customer has at most one row per item per month, counting rows is counting items.",
      "",
      "The alternative counts conditionally instead — `SUM(CASE WHEN status = 'delivered' …)` over all rows — and then has to drop the months whose count is zero, which the `WHERE` version never creates. Either is a single grouped scan.",
    ].join("\n"),
  },

  {
    slug: "amazon-ec2-charges-with-the-one-minute-minimum",
    title: "Amazon: EC2 Billable Seconds With the One-Minute Minimum",
    difficulty: "EASY",
    topics: ["Dates", "Aggregation", "Conditional Logic"],
    description: [
      "A cloud billing engineer is checking per-second compute charges. Each run of an instance is billed by the second, but **every run is billed for at least 60 seconds** — a run of 25 seconds is billed as 60.",
      "",
      "For every instance with at least one **finished** run, return `instance_id` and `billable_seconds`, the sum over its finished runs of the run's length in seconds, raised to 60 where shorter. Runs still going (`stopped_at` is NULL) are not billed yet. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "InstanceRun",
        columns: [
          { name: "run_id", type: "int" },
          { name: "instance_id", type: "varchar" },
          { name: "started_at", type: "datetime" },
          { name: "stopped_at", type: "datetime" },
        ],
        primaryKey: ["run_id"],
        note: "One row per start-to-stop run of an instance; `stopped_at` is NULL while it is still running.",
      },
    ],
    examples: [
      {
        InstanceRun: [
          [1, "i-0a17", "2025-09-01 10:00:00", "2025-09-01 10:00:25"],
          [2, "i-0a17", "2025-09-01 11:00:00", "2025-09-01 11:30:00"],
          [3, "i-0b42", "2025-09-01 09:00:00", "2025-09-01 09:01:00"],
          [4, "i-0b42", "2025-09-01 12:00:00", null],
          [5, "i-0c99", "2025-09-01 13:00:00", null],
          [6, "i-0d05", "2025-09-01 08:00:00", "2025-09-01 08:00:59"],
        ],
      },
    ],
    gen: (rng) => {
      const ids = ["i-0a17", "i-0b42", "i-0c99", "i-0d05", "i-0e31"];
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 15);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const start = ri(rng, 0, 80000);
        const len = pick(rng, [0, 1, 25, 59, 60, 61, ri(rng, 30, 7200), ri(rng, 300, 20000)]);
        return [id, pick(rng, ids), atSec("2025-09-01", start), chance(rng, 0.2) ? null : atSec("2025-09-01", start + len)];
      });
      return { InstanceRun: rows };
    },
    solution: [
      "SELECT instance_id,",
      "       SUM(GREATEST(60, TIMESTAMPDIFF(SECOND, started_at, stopped_at))) AS billable_seconds",
      "FROM InstanceRun",
      "WHERE stopped_at IS NOT NULL",
      "GROUP BY instance_id",
    ].join("\n"),
    alternatives: [
      "SELECT instance_id, SUM(CASE WHEN TIMESTAMPDIFF(SECOND, started_at, stopped_at) < 60 THEN 60 ELSE TIMESTAMPDIFF(SECOND, started_at, stopped_at) END) AS billable_seconds FROM InstanceRun WHERE stopped_at > started_at OR stopped_at = started_at GROUP BY instance_id",
    ],
    hints: [
      "Work out each run's billed seconds first, then add them up per instance.",
      "`TIMESTAMPDIFF(SECOND, start, stop)` gives a run's length.",
      "Raising a value to a floor is `GREATEST(floor, value)`.",
    ],
    editorial: [
      "The minimum applies **per run**, not per instance, so it has to be applied before summing: `GREATEST(60, TIMESTAMPDIFF(SECOND, started_at, stopped_at))` is a run's billed seconds, and `SUM` of that per `instance_id` is the instance's total. Applying the minimum to the instance total instead would undercharge an instance with many tiny runs.",
      "",
      "Runs still in progress have `stopped_at` NULL. They are filtered out in `WHERE` before grouping; an instance whose only run is still going therefore forms no group and does not appear, as the statement asks. (Without the filter, `TIMESTAMPDIFF` would be NULL, and `GREATEST` with a NULL argument is NULL too, which `SUM` ignores — but the instance would still show up with a NULL total.)",
      "",
      "The alternative writes the floor as a `CASE`. A run of exactly 60 seconds is billed 60 either way. The query is one grouped pass over the runs.",
    ].join("\n"),
  },

  // ──────────────────────────── MEDIUM ────────────────────────────
  {
    slug: "amazon-buy-box-winner-for-each-asin",
    title: "Amazon: Buy Box Winner for Each ASIN",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Joins"],
    description: [
      "Several marketplace sellers can offer the same product, but the product page shows one offer in the Buy Box. This exercise uses a simplified rule to pick it.",
      "",
      "Among the **in-stock** offers of each ASIN, the winner has the **lowest landed price** (`price + shipping`); a tie goes to the seller with the **higher rating**, and a remaining tie to the **lower `seller_id`**. Return `asin`, `seller_name` and `landed_price` for every ASIN with at least one in-stock offer, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Seller",
        columns: [
          { name: "seller_id", type: "int" },
          { name: "seller_name", type: "varchar" },
          { name: "rating", type: "decimal" },
        ],
        primaryKey: ["seller_id"],
        note: "One row per marketplace seller; `rating` is the seller's feedback score out of 5.",
      },
      {
        name: "Offer",
        columns: [
          { name: "offer_id", type: "int" },
          { name: "asin", type: "varchar" },
          { name: "seller_id", type: "int" },
          { name: "price", type: "int" },
          { name: "shipping", type: "int" },
          { name: "in_stock", type: "bool" },
        ],
        primaryKey: ["offer_id"],
        note: "One row per seller's offer on a product, in rupees; a seller has at most one offer per ASIN.",
      },
    ],
    examples: [
      {
        Seller: [
          [1, "Sunrise Traders", 4.8],
          [2, "Kaveri Retail", 4.5],
          [3, "Blue Peak Store", 4.8],
          [4, "Deccan Deals", 4.1],
        ],
        Offer: [
          [1, "B0AUDIO001", 1, 1499, 0, 1],
          [2, "B0AUDIO001", 2, 1399, 100, 1],
          [3, "B0AUDIO001", 4, 1299, 0, 0],
          [4, "B0KETTLE02", 2, 899, 40, 1],
          [5, "B0KETTLE02", 3, 939, 0, 1],
          [6, "B0KETTLE02", 1, 939, 0, 1],
          [7, "B0LAMP0003", 4, 650, 0, 0],
        ],
      },
    ],
    gen: (rng) => {
      const ns = ri(rng, 1, 6);
      const sellers: Cell[][] = seq(1, ns).map((id) => [id, SELLER_NAMES[id - 1]!, pick(rng, [4.1, 4.5, 4.5, 4.8, 4.8, 4.9])]);
      const products = asins(rng, ri(rng, 1, 5));
      const rows: Cell[][] = [];
      let id = 1;
      for (const a of products) {
        let last: [number, number] | null = null;
        for (const s of sample(rng, seq(1, ns), ri(rng, 1, ns))) {
          let price = roundTo(rng, 500, 1500, 50) - 1;
          let ship = pick(rng, [0, 0, 40, 100]);
          if (last && chance(rng, 0.4)) [price, ship] = chance(rng, 0.5) ? last : [last[0] + last[1], 0];
          last = [price, ship];
          rows.push([id++, a, s, price, ship, chance(rng, 0.8) ? 1 : 0]);
        }
      }
      return { Seller: sellers, Offer: shuffle(rng, rows) };
    },
    solution: [
      "WITH ranked AS (",
      "  SELECT o.asin, s.seller_name, o.price + o.shipping AS landed_price,",
      "         ROW_NUMBER() OVER (PARTITION BY o.asin",
      "                            ORDER BY o.price + o.shipping, s.rating DESC, s.seller_id) AS pos",
      "  FROM Offer o",
      "  JOIN Seller s ON s.seller_id = o.seller_id",
      "  WHERE o.in_stock = 1",
      ")",
      "SELECT asin, seller_name, landed_price FROM ranked WHERE pos = 1",
    ].join("\n"),
    alternatives: [
      [
        "SELECT o.asin, s.seller_name, o.price + o.shipping AS landed_price",
        "FROM Offer o JOIN Seller s ON s.seller_id = o.seller_id",
        "WHERE o.in_stock = 1 AND NOT EXISTS (",
        "  SELECT 1 FROM Offer o2 JOIN Seller s2 ON s2.seller_id = o2.seller_id",
        "  WHERE o2.asin = o.asin AND o2.in_stock = 1 AND (",
        "    o2.price + o2.shipping < o.price + o.shipping",
        "    OR (o2.price + o2.shipping = o.price + o.shipping AND s2.rating > s.rating)",
        "    OR (o2.price + o2.shipping = o.price + o.shipping AND s2.rating = s.rating AND s2.seller_id < s.seller_id)))",
      ].join("\n"),
    ],
    hints: [
      "Out-of-stock offers never compete — drop them first.",
      "The rating is on the seller, so join it in before ranking.",
      "Rank the offers of each ASIN by the three rules in order and keep the first.",
      "Make the tie-breaks complete so exactly one offer ranks first.",
    ],
    editorial: [
      "The winner is the first offer of each ASIN under a three-level ordering, which is exactly what `ROW_NUMBER() OVER (PARTITION BY asin ORDER BY landed price, rating DESC, seller_id)` computes. The rating lives on `Seller`, so it is joined in first; out-of-stock offers are removed in `WHERE` so they never take position 1 — an ASIN whose offers are all out of stock then has no rows and is left out.",
      "",
      "The last tie-break on `seller_id` matters: two sellers with the same landed price and the same rating would otherwise make the winner depend on storage order. Because a seller has at most one offer per ASIN, `seller_id` is unique within the partition and the order is total, so `ROW_NUMBER` picks one offer deterministically. `RANK` would not — it would return both tied offers.",
      "",
      "The alternative says the same thing without windows: keep an offer when **no other in-stock offer of the same ASIN beats it** under the three rules, written as a `NOT EXISTS` with the comparison spelled out level by level. It is easy to get wrong (each later level must repeat the equalities of the earlier ones), which is why the window form is preferred. Both are linear-ish with an index on `(asin)`.",
    ].join("\n"),
  },

  {
    slug: "amazon-star-rating-breakdown-for-each-product",
    title: "Amazon: Star Rating Breakdown for Each Product",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Conditional Logic", "Joins"],
    description: [
      "The customer reviews team draws the familiar five-bar histogram on every product page and wants the counts behind it from one query.",
      "",
      "For **every product** — including products with no published reviews — return `asin`, `five_star`, `four_star`, `three_star`, `two_star`, `one_star` (the number of **published** reviews with that many stars) and `verified_reviews` (published reviews from a verified purchase). Removed reviews count nowhere. A product with no published reviews shows **0** in every count, not NULL. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Product",
        columns: [
          { name: "asin", type: "varchar" },
          { name: "title", type: "varchar" },
        ],
        primaryKey: ["asin"],
        note: "One row per product in the catalogue.",
      },
      {
        name: "Review",
        columns: [
          { name: "review_id", type: "int" },
          { name: "asin", type: "varchar" },
          { name: "stars", type: "int" },
          { name: "verified", type: "bool" },
          { name: "status", type: "enum", values: ["published", "removed"] },
        ],
        primaryKey: ["review_id"],
        note: "One row per customer review; `stars` is 1 to 5 and `asin` always names a product.",
      },
    ],
    examples: [
      {
        Product: [
          ["B0FAN00001", "Tower fan 48 inch"],
          ["B0MUG00002", "Steel travel mug"],
          ["B0YOGA0003", "Yoga mat 6 mm"],
        ],
        Review: [
          [1, "B0FAN00001", 5, 1, "published"],
          [2, "B0FAN00001", 5, 0, "published"],
          [3, "B0FAN00001", 2, 1, "published"],
          [4, "B0FAN00001", 1, 1, "removed"],
          [5, "B0MUG00002", 4, 1, "published"],
          [6, "B0MUG00002", 3, 0, "published"],
          [7, "B0YOGA0003", 1, 0, "removed"],
        ],
      },
    ],
    gen: (rng) => {
      const products = asins(rng, ri(rng, 1, 5));
      const n = chance(rng, 0.1) ? 0 : ri(rng, 1, 25);
      const rows: Cell[][] = seq(1, n).map((id) => [id, pick(rng, products), ri(rng, 1, 5), chance(rng, 0.6) ? 1 : 0, chance(rng, 0.8) ? "published" : "removed"]);
      return { Product: products.map((a, i) => [a, `Item ${i + 1}`]), Review: rows };
    },
    solution: [
      "SELECT p.asin,",
      "       COUNT(CASE WHEN r.stars = 5 THEN 1 END) AS five_star,",
      "       COUNT(CASE WHEN r.stars = 4 THEN 1 END) AS four_star,",
      "       COUNT(CASE WHEN r.stars = 3 THEN 1 END) AS three_star,",
      "       COUNT(CASE WHEN r.stars = 2 THEN 1 END) AS two_star,",
      "       COUNT(CASE WHEN r.stars = 1 THEN 1 END) AS one_star,",
      "       COUNT(CASE WHEN r.verified = 1 THEN 1 END) AS verified_reviews",
      "FROM Product p",
      "LEFT JOIN Review r ON r.asin = p.asin AND r.status = 'published'",
      "GROUP BY p.asin",
    ].join("\n"),
    alternatives: [
      [
        "SELECT p.asin, COALESCE(t.f5, 0) AS five_star, COALESCE(t.f4, 0) AS four_star, COALESCE(t.f3, 0) AS three_star,",
        "       COALESCE(t.f2, 0) AS two_star, COALESCE(t.f1, 0) AS one_star, COALESCE(t.v, 0) AS verified_reviews",
        "FROM Product p LEFT JOIN (",
        "  SELECT asin, SUM(IF(stars = 5, 1, 0)) AS f5, SUM(IF(stars = 4, 1, 0)) AS f4, SUM(IF(stars = 3, 1, 0)) AS f3,",
        "         SUM(IF(stars = 2, 1, 0)) AS f2, SUM(IF(stars = 1, 1, 0)) AS f1, SUM(verified) AS v",
        "  FROM Review WHERE status = 'published' GROUP BY asin) t ON t.asin = p.asin",
      ].join("\n"),
    ],
    hints: [
      "Every product must appear, so start from `Product` and LEFT JOIN the reviews.",
      "Put the `published` test in the join condition — in `WHERE` it would drop the products with none.",
      "One column per star count: a conditional aggregate counts only the rows that match.",
      "`COUNT` of an expression that is NULL for every row is 0; `SUM` of no rows is NULL.",
    ],
    editorial: [
      "This is a pivot: one output row per product, one column per star value. A **conditional aggregate** does it in one pass — `COUNT(CASE WHEN r.stars = 5 THEN 1 END)` counts the rows where the `CASE` is not NULL, i.e. the five-star ones, and so on for each column, plus one for verified purchases.",
      "",
      "The trap is the products with nothing to count. A LEFT JOIN from `Product` keeps them, with NULL review columns. The `status = 'published'` condition must sit in the **ON clause**: in `WHERE` it would throw away the NULL-extended rows and with them every product that has only removed reviews or none. And `COUNT(expression)` returns 0 for a group where the expression is always NULL, which gives the required zeros for free — `SUM(CASE … THEN 1 ELSE 0 END)` would also give 0 here, because the joined NULL row still exists, but `SUM` over a product with no rows at all would be NULL.",
      "",
      "The alternative aggregates the published reviews first in a derived table and LEFT JOINs that to `Product`, so it must turn the missing rows into zeros with `COALESCE`. Both are a single scan of the reviews.",
    ].join("\n"),
  },

  {
    slug: "amazon-echo-buyers-who-added-a-smart-plug",
    title: "Amazon: Echo Buyers Who Added a Smart Plug Within 60 Days",
    difficulty: "MEDIUM",
    topics: ["Joins", "Subqueries", "Dates"],
    description: [
      "The smart-home team measures attach rate: how many Echo buyers go on to build a connected home. The first step they track is a smart plug.",
      "",
      "Return the `customer_id` of every customer who bought an **Echo** and then a **Smart Plug** on the **same day or up to 60 days after** that Echo purchase (60 days inclusive). Purchases that were returned do not count, neither as the Echo nor as the plug. A plug bought before every Echo of the customer does not count. Each customer appears once; any order.",
    ].join("\n"),
    tables: [
      {
        name: "DevicePurchase",
        columns: [
          { name: "purchase_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "product_line", type: "enum", values: ["Echo", "Smart Plug", "Fire TV Stick", "Kindle"] },
          { name: "purchased_on", type: "date" },
          { name: "returned", type: "bool" },
        ],
        primaryKey: ["purchase_id"],
        note: "One row per device bought; `returned` is 1 when the customer sent it back.",
      },
    ],
    examples: [
      {
        DevicePurchase: [
          [1, 21, "Echo", "2025-01-10", 0],
          [2, 21, "Smart Plug", "2025-03-11", 0],
          [3, 22, "Echo", "2025-01-10", 0],
          [4, 22, "Smart Plug", "2025-03-12", 0],
          [5, 23, "Smart Plug", "2025-01-05", 0],
          [6, 23, "Echo", "2025-01-06", 0],
          [7, 24, "Echo", "2025-02-01", 1],
          [8, 24, "Smart Plug", "2025-02-02", 0],
          [9, 25, "Echo", "2025-02-14", 0],
          [10, 25, "Smart Plug", "2025-02-14", 0],
          [11, 25, "Smart Plug", "2025-02-20", 0],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 22);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const line = pick(rng, ["Echo", "Echo", "Smart Plug", "Smart Plug", "Fire TV Stick", "Kindle"]);
        return [id, ri(rng, 21, 28), line, dateBetween(rng, "2025-01-01", "2025-05-31"), chance(rng, 0.15) ? 1 : 0];
      });
      // Now and then a plug exactly 60 or 61 days after an Echo.
      let next = n + 1;
      for (const echo of rows.filter((r) => r[2] === "Echo").slice(0, 3)) {
        if (chance(rng, 0.6)) rows.push([next++, echo[1]!, "Smart Plug", addDays(echo[3] as string, pick(rng, [-3, 0, 10, 45, 60, 61])), chance(rng, 0.1) ? 1 : 0]);
      }
      return { DevicePurchase: rows };
    },
    solution: [
      "SELECT DISTINCT e.customer_id",
      "FROM DevicePurchase e",
      "JOIN DevicePurchase p",
      "  ON p.customer_id = e.customer_id",
      " AND p.product_line = 'Smart Plug' AND p.returned = 0",
      " AND DATEDIFF(p.purchased_on, e.purchased_on) BETWEEN 0 AND 60",
      "WHERE e.product_line = 'Echo' AND e.returned = 0",
    ].join("\n"),
    alternatives: [
      [
        "SELECT DISTINCT customer_id FROM DevicePurchase e",
        "WHERE product_line = 'Echo' AND returned = 0 AND EXISTS (",
        "  SELECT 1 FROM DevicePurchase p WHERE p.customer_id = e.customer_id AND p.product_line = 'Smart Plug' AND p.returned = 0",
        "    AND p.purchased_on >= e.purchased_on AND p.purchased_on <= DATE_ADD(e.purchased_on, INTERVAL 60 DAY))",
      ].join("\n"),
      [
        "SELECT customer_id FROM DevicePurchase p WHERE product_line = 'Smart Plug' AND returned = 0",
        "  AND EXISTS (SELECT 1 FROM DevicePurchase e WHERE e.customer_id = p.customer_id AND e.product_line = 'Echo' AND e.returned = 0",
        "              AND e.purchased_on BETWEEN DATE_SUB(p.purchased_on, INTERVAL 60 DAY) AND p.purchased_on)",
        "GROUP BY customer_id",
      ].join("\n"),
    ],
    hints: [
      "Compare two purchases of the same customer — a self join, or EXISTS.",
      "The plug's date minus the Echo's date must be between 0 and 60.",
      "Filter out returned purchases on both sides.",
      "A customer with several qualifying pairs must still appear once.",
    ],
    editorial: [
      "The question pairs two purchases of one customer: an Echo and a later plug. A **self join** of `DevicePurchase` — `e` for the Echo, `p` for the plug, matched on `customer_id` — puts every candidate pair on one row; the window is then `DATEDIFF(p.purchased_on, e.purchased_on) BETWEEN 0 AND 60`. Zero covers the same-day plug, 60 the last day of the window, and a negative difference (plug first) is excluded.",
      "",
      "Returned devices are filtered on **both** sides, since a returned Echo did not start a smart home and a returned plug did not extend one. A customer with two Echos may have a plug that is late for the first but within 60 days of the second — the pairwise join handles that automatically. Because one customer can produce several matching pairs, `DISTINCT` collapses them to one row.",
      "",
      "The alternatives use `EXISTS` instead of a join, so no duplicates arise in the subquery — one starts from the Echo and looks forward with `DATE_ADD`, the other starts from the plug and looks back with `DATE_SUB`. All three are semi joins; with an index on `(customer_id, product_line)` each purchase probes only that customer's rows.",
    ].join("\n"),
  },

  {
    slug: "amazon-warehouse-bins-shared-by-several-sellers",
    title: "Amazon: Warehouse Bins Shared by Several Sellers",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Strings"],
    description: [
      "In a fulfilment centre, a storage bin can hold stock belonging to different marketplace sellers. The inventory-control team lists those shared bins so that a picker scanning the wrong seller's unit is caught.",
      "",
      "Return every bin that currently holds stock (`units > 0`) of **at least two different sellers**: `bin_id`, `seller_count` (distinct sellers with stock in it) and `sellers`, their names **in alphabetical order, separated by `', '`**, each name once. Rows with 0 units are ignored. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Seller",
        columns: [
          { name: "seller_id", type: "int" },
          { name: "seller_name", type: "varchar" },
        ],
        primaryKey: ["seller_id"],
        note: "One row per seller; names are unique.",
      },
      {
        name: "BinStock",
        columns: [
          { name: "bin_id", type: "varchar" },
          { name: "fnsku", type: "varchar" },
          { name: "seller_id", type: "int" },
          { name: "units", type: "int" },
        ],
        primaryKey: ["bin_id", "fnsku"],
        note: "One row per product label (`fnsku`) stored in a bin; each `fnsku` belongs to one seller, and a seller may have several in one bin.",
      },
    ],
    examples: [
      {
        Seller: [
          [1, "Sunrise Traders"],
          [2, "Kaveri Retail"],
          [3, "Blue Peak Store"],
          [4, "Indus Mart"],
        ],
        BinStock: [
          ["P1-A101", "X001KAV1", 2, 4],
          ["P1-A101", "X001SUN1", 1, 2],
          ["P1-A101", "X001SUN2", 1, 6],
          ["P1-A102", "X001BLU1", 3, 3],
          ["P1-A102", "X001IND1", 4, 0],
          ["P1-A103", "X001IND2", 4, 1],
          ["P1-A103", "X001BLU2", 3, 5],
          ["P1-A103", "X001KAV2", 2, 2],
        ],
      },
    ],
    gen: (rng) => {
      const ns = ri(rng, 2, 6);
      const sellers: Cell[][] = seq(1, ns).map((id) => [id, SELLER_NAMES[id - 1]!]);
      const rows: Cell[][] = [];
      let label = 1;
      for (const b of sample(rng, ["P1-A101", "P1-A102", "P1-A103", "P1-B201", "P1-B202", "P2-C301"], ri(rng, chance(rng, 0.05) ? 0 : 1, 6))) {
        for (let k = ri(rng, 1, 5); k > 0; k--) {
          rows.push([b, `X00${String(label++).padStart(4, "0")}`, ri(rng, 1, ns), chance(rng, 0.2) ? 0 : ri(rng, 1, 9)]);
        }
      }
      return { Seller: sellers, BinStock: shuffle(rng, rows) };
    },
    solution: [
      "SELECT b.bin_id,",
      "       COUNT(DISTINCT b.seller_id) AS seller_count,",
      "       GROUP_CONCAT(DISTINCT s.seller_name ORDER BY s.seller_name SEPARATOR ', ') AS sellers",
      "FROM BinStock b",
      "JOIN Seller s ON s.seller_id = b.seller_id",
      "WHERE b.units > 0",
      "GROUP BY b.bin_id",
      "HAVING COUNT(DISTINCT b.seller_id) >= 2",
    ].join("\n"),
    alternatives: [
      [
        "SELECT bin_id, COUNT(*) AS seller_count, GROUP_CONCAT(seller_name ORDER BY seller_name SEPARATOR ', ') AS sellers",
        "FROM (SELECT DISTINCT b.bin_id, s.seller_name FROM BinStock b JOIN Seller s ON s.seller_id = b.seller_id WHERE b.units > 0) t",
        "GROUP BY bin_id HAVING COUNT(*) > 1",
      ].join("\n"),
    ],
    hints: [
      "Drop the empty rows first; a seller with 0 units in a bin is not in it.",
      "A seller can have several labels in one bin — count sellers with `DISTINCT`.",
      "`GROUP_CONCAT` can de-duplicate, sort and choose its separator.",
    ],
    editorial: [
      "Per bin, the question is how many different sellers own stock in it and who they are. Filtering `units > 0` in `WHERE` removes labels that are recorded but empty, so a seller whose only row in a bin has zero units is not counted there. Grouping by `bin_id` then gives one row per bin.",
      "",
      "A seller can have several labels (`fnsku`) in one bin, so both the count and the list must be **distinct**: `COUNT(DISTINCT seller_id)` and `GROUP_CONCAT(DISTINCT seller_name ORDER BY seller_name SEPARATOR ', ')`. The `ORDER BY` inside `GROUP_CONCAT` fixes the order of the names, which otherwise depends on how rows happen to be read. `HAVING` keeps the bins with two or more sellers.",
      "",
      "The alternative first reduces the data to distinct (bin, seller name) pairs in a derived table; after that a plain `COUNT(*)` and a plain `GROUP_CONCAT` are already distinct. Since seller names are unique, counting names equals counting ids. Both are one grouped scan.",
    ].join("\n"),
  },

  {
    slug: "amazon-kindle-sessions-that-jumped-back",
    title: "Amazon: Kindle Reading Sessions That Ended Behind the Last One",
    difficulty: "MEDIUM",
    topics: ["Window Functions"],
    description: [
      "The Kindle team studies re-reading. Each reading session records the furthest location the reader was at when it ended; a session that ends **behind** the previous session of the same reader in the same book means the reader went back.",
      "",
      "For each reader and book, take the sessions in order of `ended_at`. Return every session whose `last_location` is **strictly lower** than that of the **previous session** of the same reader and book, with `session_id`, `reader_id`, `book_id` and `locations_back` (previous location minus this one). A reader's first session in a book has no previous session and is never returned. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "ReadingSession",
        columns: [
          { name: "session_id", type: "int" },
          { name: "reader_id", type: "int" },
          { name: "book_id", type: "varchar" },
          { name: "ended_at", type: "datetime" },
          { name: "last_location", type: "int" },
        ],
        primaryKey: ["session_id"],
        note: "One row per reading session; no two sessions of one reader in one book end at the same moment.",
      },
    ],
    examples: [
      {
        ReadingSession: [
          [1, 7, "B0NOVEL001", "2025-02-01 22:00:00", 1200],
          [2, 7, "B0NOVEL001", "2025-02-02 22:10:00", 2500],
          [3, 7, "B0NOVEL001", "2025-02-03 21:40:00", 1800],
          [4, 7, "B0NOVEL001", "2025-02-04 22:30:00", 1800],
          [5, 7, "B0STUDY002", "2025-02-02 08:00:00", 300],
          [6, 8, "B0NOVEL001", "2025-02-01 23:00:00", 2600],
          [7, 8, "B0NOVEL001", "2025-02-05 23:00:00", 900],
          [8, 7, "B0STUDY002", "2025-02-03 08:00:00", 250],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 20);
      const used = new Set<string>();
      const rows: Cell[][] = [];
      for (let id = 1; rows.length < n && id < 200; id++) {
        const reader = ri(rng, 7, 9);
        const book = pick(rng, ["B0NOVEL001", "B0STUDY002", "B0THRIL003"]);
        const minute = ri(rng, 0, 14 * 24) * 60;
        const key = `${reader}|${book}|${minute}`;
        if (used.has(key)) continue;
        used.add(key);
        rows.push([rows.length + 1, reader, book, atMin("2025-02-01", minute), roundTo(rng, 100, 3000, 100)]);
      }
      return { ReadingSession: rows };
    },
    solution: [
      "WITH s AS (",
      "  SELECT session_id, reader_id, book_id, last_location,",
      "         LAG(last_location) OVER (PARTITION BY reader_id, book_id ORDER BY ended_at) AS prev_location",
      "  FROM ReadingSession",
      ")",
      "SELECT session_id, reader_id, book_id, prev_location - last_location AS locations_back",
      "FROM s",
      "WHERE last_location < prev_location",
    ].join("\n"),
    alternatives: [
      [
        "SELECT session_id, reader_id, book_id, prev_location - last_location AS locations_back FROM (",
        "  SELECT s.session_id, s.reader_id, s.book_id, s.last_location,",
        "         (SELECT p.last_location FROM ReadingSession p WHERE p.reader_id = s.reader_id AND p.book_id = s.book_id AND p.ended_at < s.ended_at",
        "          ORDER BY p.ended_at DESC LIMIT 1) AS prev_location",
        "  FROM ReadingSession s) t",
        "WHERE last_location < prev_location",
      ].join("\n"),
    ],
    hints: [
      "Each session is compared with one other row: the previous session of the same reader and book.",
      "`LAG` reads a value from the previous row of a window partition.",
      "Partition by reader and book, order by `ended_at`.",
      "The first session's previous value is NULL, and a comparison with NULL is never true.",
    ],
    editorial: [
      "\"Previous session of the same reader in the same book\" is a window: partition by `(reader_id, book_id)` and order by `ended_at`. `LAG(last_location)` over that window puts the previous session's location on each row, after which the question is a row filter: keep sessions where `last_location < prev_location`, and report the difference.",
      "",
      "The filter cannot go in the same `SELECT` as the window function, because `WHERE` runs before windows are computed — hence the CTE. A reader's first session in a book has `prev_location` NULL; `x < NULL` is NULL, so it is filtered out without any special case. A session that ends at the same location as the previous one did not go back, so the comparison is strict. Sessions of other books by the same reader are in other partitions and never interfere.",
      "",
      "The alternative finds the previous session with a correlated subquery — the latest earlier `ended_at` for the same reader and book, via `ORDER BY … DESC LIMIT 1`. It is correct because end times within a partition are distinct, but it probes the table once per row, while `LAG` needs one sort of the partition.",
    ].join("\n"),
  },

  {
    slug: "amazon-savings-plan-coverage-of-each-aws-account",
    title: "Amazon: Savings Plan Coverage of Each AWS Account",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Joins", "Conditional Logic"],
    description: [
      "A cloud FinOps analyst is reviewing compute Savings Plans. A plan commits an account to a fixed spend **per hour**: in each hour, eligible spend up to the commitment is covered by the plan, and anything above it is billed on demand. Unused commitment in one hour does not carry to another.",
      "",
      "For every account in `ComputeUsage`, return `account_id`, `covered_spend` (the sum over its hours of the spend the plan covered) and `on_demand_spend` (the sum of the spend above the commitment). An account with no Savings Plan has a commitment of 0. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "SavingsPlan",
        columns: [
          { name: "account_id", type: "int" },
          { name: "hourly_commitment", type: "int" },
        ],
        primaryKey: ["account_id"],
        note: "At most one active plan per account; the commitment is in dollars per hour.",
      },
      {
        name: "ComputeUsage",
        columns: [
          { name: "account_id", type: "int" },
          { name: "usage_hour", type: "datetime" },
          { name: "eligible_spend", type: "int" },
        ],
        primaryKey: ["account_id", "usage_hour"],
        note: "One row per account per hour with plan-eligible compute spend, in whole dollars.",
      },
    ],
    examples: [
      {
        SavingsPlan: [
          [1001, 10],
          [1002, 5],
          [1004, 8],
        ],
        ComputeUsage: [
          [1001, "2025-09-01 00:00:00", 12],
          [1001, "2025-09-01 01:00:00", 7],
          [1001, "2025-09-01 02:00:00", 10],
          [1002, "2025-09-01 00:00:00", 3],
          [1002, "2025-09-01 01:00:00", 9],
          [1003, "2025-09-01 00:00:00", 6],
        ],
      },
    ],
    gen: (rng) => {
      const accounts = [1001, 1002, 1003, 1004, 1005];
      const plans: Cell[][] = sample(rng, accounts, ri(rng, 0, 5)).map((a) => [a, ri(rng, 2, 12)]);
      const rows: Cell[][] = [];
      for (const a of sample(rng, accounts, ri(rng, 0, 5))) {
        const commit = (plans.find((p) => p[0] === a)?.[1] as number | undefined) ?? 0;
        for (const h of sample(rng, seq(0, 8), ri(rng, 1, 5))) {
          rows.push([a, atMin("2025-09-01", h * 60), chance(rng, 0.2) ? commit : ri(rng, 0, 16)]);
        }
      }
      return { SavingsPlan: plans, ComputeUsage: rows };
    },
    solution: [
      "SELECT u.account_id,",
      "       SUM(LEAST(u.eligible_spend, COALESCE(p.hourly_commitment, 0))) AS covered_spend,",
      "       SUM(GREATEST(u.eligible_spend - COALESCE(p.hourly_commitment, 0), 0)) AS on_demand_spend",
      "FROM ComputeUsage u",
      "LEFT JOIN SavingsPlan p ON p.account_id = u.account_id",
      "GROUP BY u.account_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT account_id, SUM(CASE WHEN eligible_spend < c THEN eligible_spend ELSE c END) AS covered_spend,",
        "       SUM(CASE WHEN eligible_spend > c THEN eligible_spend - c ELSE 0 END) AS on_demand_spend",
        "FROM (SELECT u.account_id, u.eligible_spend, IFNULL((SELECT hourly_commitment FROM SavingsPlan p WHERE p.account_id = u.account_id), 0) AS c FROM ComputeUsage u) t",
        "GROUP BY account_id",
      ].join("\n"),
    ],
    hints: [
      "Coverage is decided hour by hour, so compute it per usage row before summing.",
      "In one hour the covered part is the smaller of the spend and the commitment.",
      "An account without a plan must still appear — LEFT JOIN and treat the missing commitment as 0.",
    ],
    editorial: [
      "Because the commitment resets every hour, coverage must be computed **per hour** and only then summed: `LEAST(spend, commitment)` is what the plan paid for in that hour and `GREATEST(spend - commitment, 0)` is the on-demand overflow. Summing spend first and comparing it with the total commitment would let a quiet hour's unused commitment cover a busy hour, which a plan does not do.",
      "",
      "The commitment comes from `SavingsPlan` with a **LEFT JOIN**, because accounts with no plan still have usage to report; `COALESCE(…, 0)` turns their missing commitment into 0, so all their spend is on demand and their covered spend is 0. An hour with spend exactly equal to the commitment is fully covered with nothing on demand. For every row, covered plus on-demand equals the hour's spend, a quick self-check.",
      "",
      "The alternative fetches the commitment with a scalar subquery and splits the spend with `CASE` expressions instead of `LEAST`/`GREATEST`. Both make a single grouped pass over the usage table.",
    ].join("\n"),
  },

  {
    slug: "amazon-route-stops-delivered-out-of-planned-order",
    title: "Amazon: Route Stops Delivered Out of the Planned Order",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "Route planners give each delivery route a stop sequence. The last-mile analytics team wants to know how often drivers deviate from it.",
      "",
      "Consider only the **delivered** stops of a route (`delivered_at` not NULL). A delivered stop is **out of order** when its position among the route's delivered stops by `stop_seq` differs from its position by `delivered_at`. Return `route_id` and `out_of_order` (the number of such stops) for every route with at least one; any order.",
    ].join("\n"),
    tables: [
      {
        name: "RouteStop",
        columns: [
          { name: "route_id", type: "varchar" },
          { name: "stop_seq", type: "int" },
          { name: "delivered_at", type: "datetime" },
        ],
        primaryKey: ["route_id", "stop_seq"],
        note: "One row per planned stop; `delivered_at` is NULL when the stop was not delivered. No two stops of a route are delivered at the same moment.",
      },
    ],
    examples: [
      {
        RouteStop: [
          ["DBL1-A", 1, "2025-05-12 09:05:00"],
          ["DBL1-A", 2, "2025-05-12 09:40:00"],
          ["DBL1-A", 3, "2025-05-12 09:20:00"],
          ["DBL1-A", 4, "2025-05-12 10:00:00"],
          ["DBL1-B", 1, "2025-05-12 09:10:00"],
          ["DBL1-B", 2, null],
          ["DBL1-B", 3, "2025-05-12 09:50:00"],
          ["DHY2-C", 1, "2025-05-12 11:00:00"],
          ["DHY2-C", 2, null],
          ["DHY2-C", 3, "2025-05-12 10:30:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const r of sample(rng, ["DBL1-A", "DBL1-B", "DHY2-C", "DMU4-D", "DPN1-E"], ri(rng, chance(rng, 0.05) ? 0 : 1, 5))) {
        const k = ri(rng, 2, 6);
        const minutes = shuffle(rng, seq(0, 40)).slice(0, k).map((m) => 540 + m * 7);
        if (chance(rng, 0.3)) minutes.sort((a, b) => a - b);
        seq(1, k).forEach((s, i) => rows.push([r, s, chance(rng, 0.15) ? null : atMin("2025-05-12", minutes[i]!)]));
      }
      return { RouteStop: rows };
    },
    solution: [
      "WITH d AS (",
      "  SELECT route_id,",
      "         ROW_NUMBER() OVER (PARTITION BY route_id ORDER BY stop_seq) AS planned_pos,",
      "         ROW_NUMBER() OVER (PARTITION BY route_id ORDER BY delivered_at) AS actual_pos",
      "  FROM RouteStop",
      "  WHERE delivered_at IS NOT NULL",
      ")",
      "SELECT route_id, COUNT(*) AS out_of_order",
      "FROM d",
      "WHERE planned_pos <> actual_pos",
      "GROUP BY route_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT s.route_id, COUNT(*) AS out_of_order FROM RouteStop s",
        "WHERE s.delivered_at IS NOT NULL",
        "  AND (SELECT COUNT(*) FROM RouteStop t WHERE t.route_id = s.route_id AND t.delivered_at IS NOT NULL AND t.stop_seq <= s.stop_seq)",
        "   <> (SELECT COUNT(*) FROM RouteStop t WHERE t.route_id = s.route_id AND t.delivered_at <= s.delivered_at)",
        "GROUP BY s.route_id",
      ].join("\n"),
    ],
    hints: [
      "Throw away undelivered stops before numbering anything — they would shift the positions.",
      "Two numberings of the same rows: one by plan, one by time.",
      "`ROW_NUMBER()` with two different `ORDER BY`s gives both in one SELECT.",
    ],
    editorial: [
      "A stop's planned position and actual position are two **rankings of the same rows** under different orders. `ROW_NUMBER() OVER (PARTITION BY route_id ORDER BY stop_seq)` numbers the delivered stops by plan, and the same function ordered by `delivered_at` numbers them by time; a stop is out of order exactly where the two numbers differ. Counting those per route and grouping gives the answer, and routes with no deviation form no group.",
      "",
      "Undelivered stops are removed **before** numbering. If they stayed, a skipped stop would push every later stop's planned position up by one while not appearing in the delivery order at all, flagging stops the driver actually took in sequence. Because delivery times are distinct within a route, the time ordering is total and the numbering deterministic.",
      "",
      "The alternative computes each position as a count — delivered stops with a sequence number at or below this one, and stops delivered at or before this one (a NULL time never satisfies `<=`). That is the definition of a row number spelled out with correlated subqueries; it is quadratic per route, whereas the window version sorts each route twice.",
    ].join("\n"),
  },

  {
    slug: "amazon-deals-not-below-the-30-day-low-price",
    title: "Amazon: Prime Day Deals Not Below the 30-Day Low Price",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Dates", "Joins"],
    description: [
      "Before Prime Day, the deals compliance team checks that every deal is a real discount. For this exercise the rule is: a deal price must be **strictly below the lowest price** the product sold at during the **30 days before the deal starts** (the 30 calendar days ending the day before `starts_on`).",
      "",
      "Return every deal that breaks the rule — its `deal_price` is **greater than or equal to** that 30-day low — with `deal_id`, `asin`, `deal_price` and `low_price`. A deal whose product has no price recorded in its 30-day window cannot be checked and is not returned. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "DailyPrice",
        columns: [
          { name: "asin", type: "varchar" },
          { name: "price_date", type: "date" },
          { name: "price", type: "int" },
        ],
        primaryKey: ["asin", "price_date"],
        note: "The product's selling price on a day, in rupees; days without a row had no recorded price.",
      },
      {
        name: "PrimeDayDeal",
        columns: [
          { name: "deal_id", type: "int" },
          { name: "asin", type: "varchar" },
          { name: "starts_on", type: "date" },
          { name: "deal_price", type: "int" },
        ],
        primaryKey: ["deal_id"],
        note: "One row per submitted deal.",
      },
    ],
    examples: [
      {
        DailyPrice: [
          ["B0HEADSET1", "2025-06-01", 1999],
          ["B0HEADSET1", "2025-06-10", 1699],
          ["B0HEADSET1", "2025-07-01", 1899],
          ["B0BLENDER2", "2025-06-20", 3499],
          ["B0BLENDER2", "2025-07-11", 2999],
          ["B0SHOES003", "2025-05-01", 2499],
        ],
        PrimeDayDeal: [
          [1, "B0HEADSET1", "2025-07-11", 1699],
          [2, "B0HEADSET1", "2025-07-01", 1599],
          [3, "B0BLENDER2", "2025-07-11", 3499],
          [4, "B0SHOES003", "2025-07-11", 1999],
          [5, "B0HEADSET1", "2025-07-12", 1999],
        ],
      },
    ],
    gen: (rng) => {
      const products = asins(rng, ri(rng, 1, 4));
      const prices: Cell[][] = [];
      for (const a of products) {
        for (const d of sample(rng, seq(0, 50), ri(rng, 0, 6))) prices.push([a, addDays("2025-05-25", d), roundTo(rng, 1000, 3000, 100) - 1]);
      }
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 8);
      const deals: Cell[][] = seq(1, n).map((id) => {
        const a = pick(rng, products);
        const start = addDays("2025-06-20", ri(rng, 0, 25));
        const near = prices.filter((p) => p[0] === a);
        const base = near.length && chance(rng, 0.5) ? (pick(rng, near)[2] as number) : roundTo(rng, 1000, 3000, 100) - 1;
        return [id, a, start, base + pick(rng, [-100, 0, 0, 100])];
      });
      return { DailyPrice: prices, PrimeDayDeal: deals };
    },
    solution: [
      "SELECT d.deal_id, d.asin, d.deal_price, MIN(p.price) AS low_price",
      "FROM PrimeDayDeal d",
      "JOIN DailyPrice p",
      "  ON p.asin = d.asin",
      " AND p.price_date >= DATE_SUB(d.starts_on, INTERVAL 30 DAY)",
      " AND p.price_date < d.starts_on",
      "GROUP BY d.deal_id, d.asin, d.deal_price",
      "HAVING d.deal_price >= MIN(p.price)",
    ].join("\n"),
    alternatives: [
      [
        "SELECT deal_id, asin, deal_price, low_price FROM (",
        "  SELECT d.deal_id, d.asin, d.deal_price,",
        "         (SELECT MIN(p.price) FROM DailyPrice p WHERE p.asin = d.asin",
        "            AND DATEDIFF(d.starts_on, p.price_date) BETWEEN 1 AND 30) AS low_price",
        "  FROM PrimeDayDeal d) t",
        "WHERE deal_price >= low_price",
      ].join("\n"),
    ],
    hints: [
      "Each deal needs the minimum of a set of rows that depends on the deal's own date.",
      "The window is `starts_on - 30 days` up to the day before `starts_on`.",
      "A deal with no prices in its window has no minimum — make sure it drops out.",
      "Equal to the low is not a discount, so `>=` breaks the rule.",
    ],
    editorial: [
      "Every deal has its own window, so the low price is a per-deal aggregate. Joining each deal to the price rows of its product whose `price_date` lies in `[starts_on − 30 days, starts_on)` and grouping by the deal gives `MIN(p.price)` as that deal's 30-day low. The comparison with the deal price is a condition on the group, so it goes in `HAVING`.",
      "",
      "The window's ends: `DATE_SUB(starts_on, INTERVAL 30 DAY)` is included and the start day itself is excluded, which together are exactly the 30 days before the deal. A deal priced **at** the low is not a discount, so `deal_price >= low` flags it. A deal with no price rows in its window joins to nothing and so never forms a group — it is skipped, as the statement requires.",
      "",
      "The alternative computes the low with a correlated scalar subquery, expressing the window as `DATEDIFF(starts_on, price_date) BETWEEN 1 AND 30`. When nothing is in the window the subquery is NULL and `deal_price >= NULL` filters the deal out the same way. With an index on `(asin, price_date)` each deal reads at most 30 rows either way.",
    ].join("\n"),
  },

  {
    slug: "amazon-referral-and-fba-fees-per-seller",
    title: "Amazon: Referral and FBA Fees per Seller for October",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "Seller Central sends every marketplace seller a monthly fee statement. This exercise uses a simplified fee card: a **referral fee** of the category's `referral_pct` percent on every unit's sale price, and a **fulfilment (FBA) fee** per unit shipped by the fulfilment network — 40 rupees for a product of at most 500 g, 70 for at most 2000 g, and 120 above that. Units the seller ships themselves (`MFN`) pay no FBA fee.",
      "",
      "For sales made in **October 2025**, return `seller_id`, `referral_fees` (rounded to 2 decimals) and `fba_fees` for every seller with at least one October sale. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Category",
        columns: [
          { name: "category", type: "varchar" },
          { name: "referral_pct", type: "int" },
        ],
        primaryKey: ["category"],
        note: "The referral fee percentage of a category.",
      },
      {
        name: "Listing",
        columns: [
          { name: "asin", type: "varchar" },
          { name: "seller_id", type: "int" },
          { name: "category", type: "varchar" },
          { name: "weight_grams", type: "int" },
        ],
        primaryKey: ["asin"],
        note: "One row per product, sold by one seller; `category` always names a category.",
      },
      {
        name: "Sale",
        columns: [
          { name: "sale_id", type: "int" },
          { name: "asin", type: "varchar" },
          { name: "sold_on", type: "date" },
          { name: "quantity", type: "int" },
          { name: "unit_price", type: "int" },
          { name: "channel", type: "enum", values: ["FBA", "MFN"] },
        ],
        primaryKey: ["sale_id"],
        note: "One row per order line; `unit_price` is in rupees and `asin` always names a listing.",
      },
    ],
    examples: [
      {
        Category: [
          ["Books", 5],
          ["Kitchen", 12],
          ["Electronics", 8],
        ],
        Listing: [
          ["B0BOOK0001", 31, "Books", 450],
          ["B0PAN00002", 31, "Kitchen", 2000],
          ["B0SPEAKER3", 32, "Electronics", 2600],
          ["B0CABLE004", 33, "Electronics", 80],
        ],
        Sale: [
          [1, "B0BOOK0001", "2025-10-02", 3, 299, "FBA"],
          [2, "B0PAN00002", "2025-10-15", 1, 1249, "FBA"],
          [3, "B0PAN00002", "2025-10-31", 2, 1249, "MFN"],
          [4, "B0SPEAKER3", "2025-10-20", 1, 3999, "FBA"],
          [5, "B0SPEAKER3", "2025-11-01", 1, 3999, "FBA"],
          [6, "B0CABLE004", "2025-09-30", 4, 199, "FBA"],
        ],
      },
    ],
    gen: (rng) => {
      const cats: Cell[][] = [["Books", 5], ["Kitchen", 12], ["Electronics", 8], ["Toys", 10]];
      const products = asins(rng, ri(rng, 1, 6));
      const listings: Cell[][] = products.map((a) => [a, ri(rng, 31, 34), pick(rng, cats)[0]!, pick(rng, [80, 450, 500, 501, 1200, 2000, 2001, 2600])]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 14);
      const sales: Cell[][] = seq(1, n).map((id) => [
        id,
        pick(rng, products),
        chance(rng, 0.2) ? pick(rng, ["2025-09-30", "2025-10-01", "2025-10-31", "2025-11-01"]) : dateBetween(rng, "2025-09-25", "2025-11-05"),
        ri(rng, 1, 4),
        roundTo(rng, 100, 4000, 50) - 1,
        chance(rng, 0.7) ? "FBA" : "MFN",
      ]);
      return { Category: cats, Listing: listings, Sale: sales };
    },
    solution: [
      "SELECT l.seller_id,",
      "       ROUND(SUM(s.quantity * s.unit_price * c.referral_pct / 100), 2) AS referral_fees,",
      "       SUM(CASE WHEN s.channel <> 'FBA' THEN 0",
      "                WHEN l.weight_grams <= 500 THEN 40 * s.quantity",
      "                WHEN l.weight_grams <= 2000 THEN 70 * s.quantity",
      "                ELSE 120 * s.quantity END) AS fba_fees",
      "FROM Sale s",
      "JOIN Listing l ON l.asin = s.asin",
      "JOIN Category c ON c.category = l.category",
      "WHERE s.sold_on BETWEEN '2025-10-01' AND '2025-10-31'",
      "GROUP BY l.seller_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT l.seller_id,",
        "       ROUND(SUM(s.quantity * s.unit_price * (SELECT c.referral_pct FROM Category c WHERE c.category = l.category)) / 100, 2) AS referral_fees,",
        "       SUM(IF(s.channel = 'FBA', s.quantity * IF(l.weight_grams <= 500, 40, IF(l.weight_grams <= 2000, 70, 120)), 0)) AS fba_fees",
        "FROM Sale s JOIN Listing l ON l.asin = s.asin",
        "WHERE YEAR(s.sold_on) = 2025 AND MONTH(s.sold_on) = 10",
        "GROUP BY l.seller_id",
      ].join("\n"),
    ],
    hints: [
      "The seller and the weight are on the listing, the percentage on the category — two joins.",
      "Compute each order line's referral fee and FBA fee, then sum per seller.",
      "The FBA fee is per unit: multiply the weight band's fee by the quantity, and use 0 for MFN.",
      "Check the weight boundaries: 500 g and 2000 g fall in the lower band.",
    ],
    editorial: [
      "Each order line contributes two fees, computed from three tables: the sale (quantity, price, channel), the listing (seller and weight) and the category (percentage). Two inner joins bring them together, the October filter keeps the month's sales, and grouping by `seller_id` sums each fee.",
      "",
      "The referral fee of a line is `quantity × unit_price × referral_pct / 100`; summing first and rounding once at the end avoids rounding errors piling up. The FBA fee is a `CASE` over the channel and the weight band, multiplied by the quantity because the fee is per unit. The order of the `WHEN`s matters: MFN lines are caught first, then `<= 500`, then `<= 2000`, so a 500 g product pays 40 and a 2000 g one pays 70 — the boundaries belong to the lower band.",
      "",
      "Sellers without October sales produce no joined rows and do not appear. The alternative looks up the percentage with a scalar subquery, writes the bands with nested `IF`s and filters the month with `YEAR`/`MONTH`; the date-range form is preferable when `sold_on` is indexed.",
    ].join("\n"),
  },

  {
    slug: "amazon-distance-driven-on-each-delivery-route",
    title: "Amazon: Straight-Line Distance Driven on Each Delivery Route",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "Last-mile planners estimate a route's length from its stops' coordinates before real road data comes in. Each route starts at the delivery station, at the origin `(0, 0)`, and visits its stops in increasing `stop_seq` (sequence numbers may have gaps); the van does not return to the station.",
      "",
      "For every route, return `route_id` and `distance_km`: the sum of the **straight-line distances** from the station to the first stop and between each pair of consecutive stops, **rounded to 2 decimals**. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "DeliveryStop",
        columns: [
          { name: "route_id", type: "varchar" },
          { name: "stop_seq", type: "int" },
          { name: "x_km", type: "int" },
          { name: "y_km", type: "int" },
        ],
        primaryKey: ["route_id", "stop_seq"],
        note: "One row per stop; `x_km` and `y_km` are the stop's position in kilometres east and north of the station.",
      },
    ],
    examples: [
      {
        DeliveryStop: [
          ["DBL1-A", 1, 3, 4],
          ["DBL1-A", 2, 3, 0],
          ["DBL1-A", 5, 0, 0],
          ["DBL1-B", 10, -2, 1],
          ["DBL1-B", 20, 1, 5],
          ["DHY2-C", 3, 6, 8],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const r of sample(rng, ["DBL1-A", "DBL1-B", "DHY2-C", "DMU4-D", "DPN1-E"], ri(rng, 0, 5))) {
        const seqs = sample(rng, seq(1, 30), ri(rng, 1, 6));
        for (const s of seqs) rows.push([r, s, ri(rng, -10, 10), ri(rng, -10, 10)]);
      }
      return { DeliveryStop: shuffle(rng, rows) };
    },
    solution: [
      "WITH legs AS (",
      "  SELECT route_id, x_km, y_km,",
      "         LAG(x_km, 1, 0) OVER (PARTITION BY route_id ORDER BY stop_seq) AS px,",
      "         LAG(y_km, 1, 0) OVER (PARTITION BY route_id ORDER BY stop_seq) AS py",
      "  FROM DeliveryStop",
      ")",
      "SELECT route_id,",
      "       ROUND(SUM(SQRT((x_km - px) * (x_km - px) + (y_km - py) * (y_km - py))), 2) AS distance_km",
      "FROM legs",
      "GROUP BY route_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT route_id, ROUND(SUM(SQRT(POW(x_km - px, 2) + POW(y_km - py, 2))), 2) AS distance_km FROM (",
        "  SELECT s.route_id, s.x_km, s.y_km,",
        "         COALESCE((SELECT p.x_km FROM DeliveryStop p WHERE p.route_id = s.route_id AND p.stop_seq < s.stop_seq ORDER BY p.stop_seq DESC LIMIT 1), 0) AS px,",
        "         COALESCE((SELECT p.y_km FROM DeliveryStop p WHERE p.route_id = s.route_id AND p.stop_seq < s.stop_seq ORDER BY p.stop_seq DESC LIMIT 1), 0) AS py",
        "  FROM DeliveryStop s) t",
        "GROUP BY route_id",
      ].join("\n"),
    ],
    hints: [
      "Each leg joins a stop to the stop before it in the route — `LAG` fetches that one.",
      "The first stop's \"previous point\" is the station at (0, 0): `LAG` takes a default value.",
      "Sequence numbers have gaps, so `stop_seq - 1` is not the previous stop.",
      "Distance is `SQRT(dx² + dy²)`; round only the total.",
    ],
    editorial: [
      "A route's length is the sum of its legs, and each leg runs from one stop to the stop before it. `LAG(x_km, 1, 0)` and `LAG(y_km, 1, 0)` over `PARTITION BY route_id ORDER BY stop_seq` put the previous stop's coordinates on each row; the third argument supplies `0` when there is no previous row, which is exactly the station at the origin, so the first leg needs no special case.",
      "",
      "Each leg's length is the Euclidean distance `SQRT(dx² + dy²)`, summed per route and rounded once at the end — rounding every leg first would make the total drift. Because the window orders by `stop_seq` rather than assuming consecutive numbers, gaps in the sequence are harmless; a join on `stop_seq = prev + 1` would silently drop legs. A one-stop route is just the distance from the station.",
      "",
      "The alternative finds the previous stop with correlated subqueries (`ORDER BY stop_seq DESC LIMIT 1` among the lower sequence numbers) and defaults to the origin with `COALESCE`; it squares with `POW`. It reads the route once per stop, whereas `LAG` needs one sort per route.",
    ].join("\n"),
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "amazon-clearing-price-of-each-sponsored-ads-auction",
    title: "Amazon: Clearing Price of Each Sponsored Products Auction",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins", "Conditional Logic"],
    description: [
      "Sponsored ads are sold in auctions. This exercise uses a textbook generalised second-price rule. A bid is **eligible** when `bid >= reserve_price`. Each eligible bid's **ad rank** is `bid × quality_score`. The winner has the **highest ad rank**; a tie goes to the **lower `advertiser_id`**.",
      "",
      "The winner pays just enough to keep its position: if there is a runner-up (the best ad rank among the **other** eligible bids), the price is `FLOOR(runner_up_rank / winner_quality_score) + 1`, but **never more than the winner's own bid** and **never less than the reserve price**. A winner with no other eligible bid pays the reserve price. Return `auction_id`, `advertiser_id` (the winner) and `price_paid` for every auction with at least one eligible bid, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Auction",
        columns: [
          { name: "auction_id", type: "int" },
          { name: "keyword", type: "varchar" },
          { name: "reserve_price", type: "int" },
        ],
        primaryKey: ["auction_id"],
        note: "One row per ad slot auction; prices are in paise per click.",
      },
      {
        name: "AdBid",
        columns: [
          { name: "auction_id", type: "int" },
          { name: "advertiser_id", type: "int" },
          { name: "bid", type: "int" },
          { name: "quality_score", type: "int" },
        ],
        primaryKey: ["auction_id", "advertiser_id"],
        note: "One bid per advertiser per auction; `quality_score` runs from 1 to 10.",
      },
    ],
    examples: [
      {
        Auction: [
          [1, "wireless earbuds", 500],
          [2, "running shoes", 800],
          [3, "steel bottle", 300],
          [4, "yoga mat", 1000],
        ],
        AdBid: [
          [1, 11, 1200, 6],
          [1, 12, 1500, 4],
          [1, 13, 450, 10],
          [2, 11, 900, 5],
          [2, 14, 1000, 5],
          [2, 15, 1000, 5],
          [3, 12, 700, 3],
          [3, 16, 280, 9],
          [4, 13, 900, 8],
        ],
      },
    ],
    gen: (rng) => {
      const na = ri(rng, 1, 5);
      const auctions: Cell[][] = seq(1, na).map((id) => [id, pick(rng, ["earbuds", "shoes", "bottle", "mat", "charger", "kettle"]), roundTo(rng, 200, 1000, 100)]);
      const bids: Cell[][] = [];
      for (const a of auctions) {
        let prev: [number, number] | null = null;
        for (const adv of sample(rng, seq(11, 8), ri(rng, 0, 5))) {
          let bid = roundTo(rng, 100, 2000, 50);
          let q = ri(rng, 1, 10);
          if (prev && chance(rng, 0.3)) [bid, q] = prev;
          if (chance(rng, 0.1)) bid = a[2] as number;
          prev = [bid, q];
          bids.push([a[0]!, adv, bid, q]);
        }
      }
      return { Auction: auctions, AdBid: shuffle(rng, bids) };
    },
    solution: [
      "WITH eligible AS (",
      "  SELECT b.auction_id, b.advertiser_id, b.bid, b.quality_score, a.reserve_price,",
      "         b.bid * b.quality_score AS ad_rank,",
      "         ROW_NUMBER() OVER (PARTITION BY b.auction_id",
      "                            ORDER BY b.bid * b.quality_score DESC, b.advertiser_id) AS pos",
      "  FROM AdBid b",
      "  JOIN Auction a ON a.auction_id = b.auction_id",
      "  WHERE b.bid >= a.reserve_price",
      ")",
      "SELECT w.auction_id, w.advertiser_id,",
      "       CASE WHEN r.ad_rank IS NULL THEN w.reserve_price",
      "            ELSE LEAST(w.bid, GREATEST(w.reserve_price, r.ad_rank DIV w.quality_score + 1)) END AS price_paid",
      "FROM eligible w",
      "LEFT JOIN eligible r ON r.auction_id = w.auction_id AND r.pos = 2",
      "WHERE w.pos = 1",
    ].join("\n"),
    alternatives: [
      [
        "SELECT w.auction_id, w.advertiser_id,",
        "       COALESCE(LEAST(w.bid, GREATEST(a.reserve_price, FLOOR((",
        "         SELECT MAX(o.bid * o.quality_score) FROM AdBid o",
        "         WHERE o.auction_id = w.auction_id AND o.advertiser_id <> w.advertiser_id AND o.bid >= a.reserve_price",
        "       ) / w.quality_score) + 1)), a.reserve_price) AS price_paid",
        "FROM AdBid w JOIN Auction a ON a.auction_id = w.auction_id",
        "WHERE w.bid >= a.reserve_price",
        "  AND NOT EXISTS (",
        "    SELECT 1 FROM AdBid o WHERE o.auction_id = w.auction_id AND o.bid >= a.reserve_price",
        "      AND (o.bid * o.quality_score > w.bid * w.quality_score",
        "           OR (o.bid * o.quality_score = w.bid * w.quality_score AND o.advertiser_id < w.advertiser_id)))",
      ].join("\n"),
    ],
    hints: [
      "Remove the bids below the reserve before ranking anything — they neither win nor set the price.",
      "Rank the eligible bids of each auction by ad rank, breaking ties by advertiser id.",
      "The runner-up is position 2 of the same ranking; a LEFT JOIN keeps auctions without one.",
      "Clamp the price with `GREATEST` (the reserve floor) and `LEAST` (the bid ceiling).",
    ],
    editorial: [
      "Three things are needed per auction: the eligible bids, the winner and the runner-up. A CTE joins each bid to its auction, drops bids under the reserve (an ineligible bid must not become the runner-up and inflate the price) and numbers the rest with `ROW_NUMBER()` ordered by ad rank descending and then `advertiser_id`. That tie-break makes position 1 the winner the rules name, and position 2 the runner-up — even when the two have equal ad rank.",
      "",
      "Self-joining the CTE — position 1 as `w`, position 2 as `r` with a **LEFT JOIN** — puts the winner and the runner-up on one row, and an auction with a single eligible bid keeps a NULL runner-up, which the `CASE` maps to the reserve price. Otherwise the price is the smallest bid that would still beat the runner-up, `runner_rank DIV winner_quality + 1`, then clamped: `GREATEST` with the reserve and `LEAST` with the winner's bid. When the runner-up's rank equals the winner's, the formula exceeds the bid by one and the clamp brings it back to the bid.",
      "",
      "The alternative finds the winner with `NOT EXISTS` (no eligible bid beats it under the same two-level rule) and the runner-up's rank with a correlated `MAX` over the other eligible bids; a NULL `MAX` makes the whole clamped expression NULL (both `GREATEST` and `LEAST` return NULL when an argument is NULL), and `COALESCE` turns it into the reserve price. Both read each auction's bids a constant number of times.",
    ].join("\n"),
  },

  {
    slug: "amazon-sellers-breaching-the-rolling-order-defect-rate",
    title: "Amazon: First Day Each Seller Breached the 60-Day Order Defect Rate",
    difficulty: "HARD",
    topics: ["Joins", "Dates", "Window Functions"],
    description: [
      "Seller account health tracks an **order defect rate**: the share of a seller's orders that drew a defect (negative feedback, a guarantee claim or a chargeback) over a rolling window. For this exercise, a seller **breaches** on a day `d` when the orders placed in the 60 days ending on `d` (from `d` minus 59 days to `d`, both inclusive) number **at least 5** and **more than 10%** of them have a defect. Only days on which the seller received at least one order are checked.",
      "",
      "For every seller that ever breaches, return `seller_id`, `first_breach_on` (the earliest such day), and `orders_in_window` and `defects_in_window` for that day's window. Sellers that never breach are left out. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "SellerOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "seller_id", type: "int" },
          { name: "ordered_on", type: "date" },
          { name: "defect", type: "enum", values: ["none", "negative_feedback", "a_to_z_claim", "chargeback"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per order a seller received; `defect` is `none` for a clean order and otherwise names the defect it drew.",
      },
    ],
    examples: [
      {
        SellerOrder: [
          [1, 31, "2025-01-05", "none"],
          [2, 31, "2025-01-20", "a_to_z_claim"],
          [3, 31, "2025-02-10", "none"],
          [4, 31, "2025-02-25", "none"],
          [5, 31, "2025-03-01", "none"],
          [6, 31, "2025-03-06", "none"],
          [7, 32, "2025-01-01", "chargeback"],
          [8, 32, "2025-01-02", "none"],
          [9, 32, "2025-01-03", "none"],
          [10, 32, "2025-01-04", "none"],
          [11, 32, "2025-01-05", "none"],
          [12, 32, "2025-01-06", "none"],
          [13, 32, "2025-01-06", "none"],
          [14, 32, "2025-01-06", "none"],
          [15, 32, "2025-01-06", "none"],
          [16, 32, "2025-01-06", "none"],
          [17, 33, "2025-01-10", "negative_feedback"],
          [18, 33, "2025-01-11", "chargeback"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 30);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 31, 34),
        dateBetween(rng, "2025-01-01", "2025-05-31"),
        chance(rng, 0.8) ? "none" : pick(rng, ["negative_feedback", "a_to_z_claim", "chargeback"]),
      ]);
      // A burst of orders on one seller, so windows reach five orders often.
      if (n > 0 && chance(rng, 0.85)) {
        const s = ri(rng, 31, 34);
        const d0 = dateBetween(rng, "2025-01-01", "2025-04-30");
        const burst = ri(rng, 4, 9);
        for (let k = 0; k < burst; k++) rows.push([n + 1 + k, s, addDays(d0, ri(rng, 0, 70)), chance(rng, 0.75) ? "none" : "chargeback"]);
      }
      return { SellerOrder: rows };
    },
    solution: [
      "WITH days AS (",
      "  SELECT DISTINCT seller_id, ordered_on AS d FROM SellerOrder",
      "), win AS (",
      "  SELECT x.seller_id, x.d,",
      "         COUNT(*) AS orders_in_window,",
      "         SUM(CASE WHEN o.defect <> 'none' THEN 1 ELSE 0 END) AS defects_in_window",
      "  FROM days x",
      "  JOIN SellerOrder o",
      "    ON o.seller_id = x.seller_id",
      "   AND o.ordered_on BETWEEN DATE_SUB(x.d, INTERVAL 59 DAY) AND x.d",
      "  GROUP BY x.seller_id, x.d",
      "), breach AS (",
      "  SELECT seller_id, d, orders_in_window, defects_in_window,",
      "         ROW_NUMBER() OVER (PARTITION BY seller_id ORDER BY d) AS rn",
      "  FROM win",
      "  WHERE orders_in_window >= 5 AND defects_in_window * 10 > orders_in_window",
      ")",
      "SELECT seller_id, d AS first_breach_on, orders_in_window, defects_in_window",
      "FROM breach",
      "WHERE rn = 1",
    ].join("\n"),
    alternatives: [
      [
        "WITH win AS (",
        "  SELECT x.seller_id, x.ordered_on AS d,",
        "         (SELECT COUNT(*) FROM SellerOrder o WHERE o.seller_id = x.seller_id AND DATEDIFF(x.ordered_on, o.ordered_on) BETWEEN 0 AND 59) AS orders_in_window,",
        "         (SELECT COUNT(*) FROM SellerOrder o WHERE o.seller_id = x.seller_id AND o.defect <> 'none' AND DATEDIFF(x.ordered_on, o.ordered_on) BETWEEN 0 AND 59) AS defects_in_window",
        "  FROM (SELECT DISTINCT seller_id, ordered_on FROM SellerOrder) x",
        "), breach AS (",
        "  SELECT * FROM win WHERE orders_in_window >= 5 AND defects_in_window / orders_in_window > 0.1",
        ")",
        "SELECT b.seller_id, b.d AS first_breach_on, b.orders_in_window, b.defects_in_window",
        "FROM breach b",
        "WHERE b.d = (SELECT MIN(b2.d) FROM breach b2 WHERE b2.seller_id = b.seller_id)",
      ].join("\n"),
    ],
    hints: [
      "The days to check are the distinct (seller, order date) pairs.",
      "For each such day, join back to the seller's orders that fall in the 60 days ending that day.",
      "\"More than 10%\" is `defects × 10 > orders` — no division needed.",
      "Among a seller's breaching days, keep the earliest.",
    ],
    editorial: [
      "A rolling window over dates is a **self join with a date range**: take each day the seller had an order (the distinct `(seller_id, ordered_on)` pairs) and join it to every order of the same seller placed between `d − 59 days` and `d`. Grouping by `(seller, d)` then gives that day's window — `COUNT(*)` orders and a conditional `SUM` of the defective ones. A window function with a `RANGE` frame would need a numeric ordering key; the join works directly on dates and handles days with several orders and long gaps naturally.",
      "",
      "The breach rule is applied to those windows: at least 5 orders, and defects strictly above 10%, written `defects * 10 > orders` to stay in integers (exactly 10% is not a breach). The earliest breaching day per seller is picked with `ROW_NUMBER()` ordered by date; since each `(seller, d)` appears once, there are no ties. Sellers with no breaching day have no rows in `breach` and drop out, and the window's counts are reported for the day found.",
      "",
      "The alternative counts each window with two correlated subqueries using `DATEDIFF(d, ordered_on) BETWEEN 0 AND 59`, tests the rate by division, and keeps the day equal to the seller's `MIN` breaching day. Both cost about (days × orders per window); with an index on `(seller_id, ordered_on)` each window is a range read.",
    ].join("\n"),
  },

  {
    slug: "amazon-package-dwell-time-at-each-facility-visit",
    title: "Amazon: Package Dwell Time at Each Facility Visit",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Aggregation"],
    description: [
      "A package is scanned many times as it moves through sort centres, fulfilment centres and delivery stations — and it can pass through the same facility twice (for example after a missort). The network team measures how long packages sit at each stop.",
      "",
      "For each package, take its scans in time order. A **visit** is a maximal run of consecutive scans at the same `facility_code`; a later return to the same facility is a new visit. Return one row per visit: `package_id`, `visit_no` (1 for the package's first visit, then 2, 3, …), `facility_code`, `arrived_at` (the visit's first scan) and `dwell_minutes` (whole minutes from the visit's first scan to its last, 0 for a single scan). Order the rows by `package_id`, then `visit_no`.",
    ].join("\n"),
    tables: [
      {
        name: "TrackingScan",
        columns: [
          { name: "package_id", type: "varchar" },
          { name: "scanned_at", type: "datetime" },
          { name: "facility_code", type: "varchar" },
        ],
        primaryKey: ["package_id", "scanned_at"],
        note: "One row per scan of a package; a package is never scanned twice at the same moment.",
      },
    ],
    examples: [
      {
        TrackingScan: [
          ["TBA101", "2025-08-01 08:00:00", "BLR7"],
          ["TBA101", "2025-08-01 09:30:00", "BLR7"],
          ["TBA101", "2025-08-01 14:00:00", "SBLA"],
          ["TBA101", "2025-08-01 18:10:00", "BLR7"],
          ["TBA101", "2025-08-02 07:00:00", "DBL1"],
          ["TBA101", "2025-08-02 07:45:30", "DBL1"],
          ["TBA202", "2025-08-01 10:00:00", "HYD3"],
          ["TBA202", "2025-08-01 12:00:00", "HYD3"],
          ["TBA202", "2025-08-01 16:20:00", "DHY2"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const p of sample(rng, ["TBA101", "TBA202", "TBA303", "TBA404"], ri(rng, 0, 4))) {
        let t = ri(rng, 0, 600) * 60 + ri(rng, 0, 59);
        let fac = pick(rng, ["BLR7", "SBLA", "DBL1", "HYD3"]);
        for (let k = ri(rng, 1, 7); k > 0; k--) {
          rows.push([p, atSec("2025-08-01", t), fac]);
          t += ri(rng, 5, 300) * 60 + ri(rng, 0, 59);
          if (chance(rng, 0.5)) fac = pick(rng, ["BLR7", "SBLA", "DBL1", "HYD3"]);
        }
      }
      return { TrackingScan: shuffle(rng, rows) };
    },
    solution: [
      "WITH r AS (",
      "  SELECT package_id, scanned_at, facility_code,",
      "         ROW_NUMBER() OVER (PARTITION BY package_id ORDER BY scanned_at)",
      "       - ROW_NUMBER() OVER (PARTITION BY package_id, facility_code ORDER BY scanned_at) AS grp",
      "  FROM TrackingScan",
      "), v AS (",
      "  SELECT package_id, facility_code, grp,",
      "         MIN(scanned_at) AS arrived_at, MAX(scanned_at) AS left_at",
      "  FROM r",
      "  GROUP BY package_id, facility_code, grp",
      ")",
      "SELECT package_id,",
      "       ROW_NUMBER() OVER (PARTITION BY package_id ORDER BY arrived_at) AS visit_no,",
      "       facility_code, arrived_at,",
      "       TIMESTAMPDIFF(MINUTE, arrived_at, left_at) AS dwell_minutes",
      "FROM v",
      "ORDER BY package_id, visit_no",
    ].join("\n"),
    alternatives: [
      [
        "WITH f AS (",
        "  SELECT package_id, scanned_at, facility_code,",
        "         CASE WHEN LAG(facility_code) OVER (PARTITION BY package_id ORDER BY scanned_at) = facility_code THEN 0 ELSE 1 END AS new_visit",
        "  FROM TrackingScan",
        "), n AS (",
        "  SELECT package_id, scanned_at, facility_code,",
        "         SUM(new_visit) OVER (PARTITION BY package_id ORDER BY scanned_at ROWS UNBOUNDED PRECEDING) AS visit_no",
        "  FROM f",
        ")",
        "SELECT package_id, visit_no, MIN(facility_code) AS facility_code, MIN(scanned_at) AS arrived_at,",
        "       TIMESTAMPDIFF(MINUTE, MIN(scanned_at), MAX(scanned_at)) AS dwell_minutes",
        "FROM n",
        "GROUP BY package_id, visit_no",
        "ORDER BY package_id, visit_no",
      ].join("\n"),
    ],
    hints: [
      "Grouping by package and facility alone would merge two separate visits to the same facility.",
      "This is gaps and islands: number the scans per package, and separately per package and facility.",
      "Within one visit, the difference of those two numbers stays constant.",
      "Or: flag each scan whose facility differs from the previous scan's, and take a running sum of the flags.",
    ],
    editorial: [
      "The tempting `GROUP BY package_id, facility_code` is wrong: a package that leaves BLR7 and comes back is two visits, and grouping would merge them into one with a huge dwell. The visits are **islands** — maximal runs of consecutive scans with the same facility — and need an identifier of their own.",
      "",
      "The row-number trick builds one. Number each package's scans in time order (`rn_all`), and number them again within each facility (`rn_fac`). Inside one run both counters advance together, so `rn_all − rn_fac` is constant; when the package goes elsewhere and returns, `rn_all` has advanced past the scans at other facilities while `rn_fac` has not, so the difference jumps. Grouping by `(package_id, facility_code, grp)` gives each visit with its first and last scan; `rn_all ≥ rn_fac` always, so the difference never goes negative. A second `ROW_NUMBER()` by arrival time numbers the visits, and `TIMESTAMPDIFF(MINUTE, …)` measures the dwell, truncating partial minutes.",
      "",
      "The alternative marks a scan as the start of a visit when `LAG(facility_code)` differs (or is NULL for the first scan), and a running `SUM` of those marks is the visit number directly. Both sort each package's scans a few times — O(n log n) — and are the standard ways to collapse runs.",
    ].join("\n"),
    ordered: true,
  },

  {
    slug: "amazon-five-star-review-bursts-from-new-accounts",
    title: "Amazon: Five-Star Review Bursts From Brand-New Accounts",
    difficulty: "HARD",
    topics: ["Joins", "Dates", "Aggregation", "Subqueries"],
    description: [
      "The review-integrity team hunts for paid-review campaigns, which tend to look like a cluster of five-star reviews from freshly created accounts. A review is **suspect** when it has **5 stars** and was posted **fewer than 30 days** after the reviewer's account was created (compare calendar days, `DATEDIFF(posted_at, created_on) < 30`).",
      "",
      "For each product, find the largest number of suspect reviews posted within **any 24-hour span** (a review posted exactly 24 hours after the first one still counts as inside it). Return `asin` and `burst_size` for every product whose largest burst is **at least 3**; any order.",
    ].join("\n"),
    tables: [
      {
        name: "Customer",
        columns: [
          { name: "customer_id", type: "int" },
          { name: "created_on", type: "date" },
        ],
        primaryKey: ["customer_id"],
        note: "One row per shopper account.",
      },
      {
        name: "ProductReview",
        columns: [
          { name: "review_id", type: "int" },
          { name: "asin", type: "varchar" },
          { name: "customer_id", type: "int" },
          { name: "stars", type: "int" },
          { name: "posted_at", type: "datetime" },
        ],
        primaryKey: ["review_id"],
        note: "One row per review; a customer reviews a product at most once, and `customer_id` always names a customer.",
      },
    ],
    examples: [
      {
        Customer: [
          [1, "2025-03-01"],
          [2, "2025-03-02"],
          [3, "2025-03-03"],
          [4, "2024-06-01"],
          [5, "2025-02-04"],
        ],
        ProductReview: [
          [1, "B0SERUM001", 1, 5, "2025-03-05 10:00:00"],
          [2, "B0SERUM001", 2, 5, "2025-03-05 22:00:00"],
          [3, "B0SERUM001", 3, 5, "2025-03-06 10:00:00"],
          [4, "B0SERUM001", 4, 5, "2025-03-05 12:00:00"],
          [5, "B0SERUM001", 5, 5, "2025-03-06 09:00:00"],
          [6, "B0CHARGER2", 1, 5, "2025-03-10 08:00:00"],
          [7, "B0CHARGER2", 2, 5, "2025-03-10 09:00:00"],
          [8, "B0CHARGER2", 3, 5, "2025-03-11 09:00:01"],
          [9, "B0CHARGER2", 5, 4, "2025-03-10 10:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const nc = ri(rng, 3, 12);
      const customers: Cell[][] = seq(1, nc).map((id) => [id, chance(rng, 0.15) ? dateBetween(rng, "2024-01-01", "2024-12-31") : dateBetween(rng, "2025-02-12", "2025-03-08")]);
      const products = asins(rng, ri(rng, 1, 3));
      const rows: Cell[][] = [];
      let id = 1;
      for (const a of products) {
        const base = ri(rng, 0, 10) * 86400 + ri(rng, 0, 86399);
        for (const c of sample(rng, seq(1, nc), ri(rng, 1, nc))) {
          const offset = chance(rng, 0.1) ? 86400 : chance(rng, 0.75) ? ri(rng, 0, 80000) : ri(rng, 0, 400000);
          rows.push([id++, a, c, chance(rng, 0.85) ? 5 : ri(rng, 1, 4), atSec("2025-03-01", base + offset)]);
        }
      }
      return { Customer: customers, ProductReview: shuffle(rng, rows) };
    },
    solution: [
      "WITH suspect AS (",
      "  SELECT r.review_id, r.asin, r.posted_at",
      "  FROM ProductReview r",
      "  JOIN Customer c ON c.customer_id = r.customer_id",
      "  WHERE r.stars = 5 AND DATEDIFF(r.posted_at, c.created_on) < 30",
      "), bursts AS (",
      "  SELECT a.review_id, a.asin, COUNT(*) AS in_span",
      "  FROM suspect a",
      "  JOIN suspect b",
      "    ON b.asin = a.asin",
      "   AND b.posted_at >= a.posted_at",
      "   AND b.posted_at <= DATE_ADD(a.posted_at, INTERVAL 24 HOUR)",
      "  GROUP BY a.review_id, a.asin",
      ")",
      "SELECT asin, MAX(in_span) AS burst_size",
      "FROM bursts",
      "GROUP BY asin",
      "HAVING MAX(in_span) >= 3",
    ].join("\n"),
    alternatives: [
      [
        "SELECT asin, burst_size FROM (",
        "  SELECT s.asin, MAX((SELECT COUNT(*) FROM ProductReview r2 JOIN Customer c2 ON c2.customer_id = r2.customer_id",
        "                      WHERE r2.asin = s.asin AND r2.stars = 5 AND DATEDIFF(r2.posted_at, c2.created_on) < 30",
        "                        AND TIMESTAMPDIFF(SECOND, s.posted_at, r2.posted_at) BETWEEN 0 AND 86400)) AS burst_size",
        "  FROM ProductReview s JOIN Customer c ON c.customer_id = s.customer_id",
        "  WHERE s.stars = 5 AND DATEDIFF(s.posted_at, c.created_on) < 30",
        "  GROUP BY s.asin) t",
        "WHERE burst_size >= 3",
      ].join("\n"),
    ],
    hints: [
      "First reduce the reviews to the suspect ones: five stars, from an account under 30 days old.",
      "The busiest 24-hour span can always be taken to start at one of the suspect reviews.",
      "For each suspect review, count the suspect reviews of the same product in the 24 hours from it — a self join with a time range.",
      "The product's burst size is the largest of those counts.",
    ],
    editorial: [
      "Start by narrowing the data: a review is suspect when it has five stars and the account was under 30 days old when it was posted. `DATEDIFF` compares calendar days and ignores the time of day, so a review on day 29 qualifies and one on day 30 does not.",
      "",
      "The key observation for the sliding window is that a busiest 24-hour span can always be shifted to **begin at a suspect review** without losing any review from it. So it suffices to try every suspect review as a span start: self-join the suspect set to itself on the same `asin` with `b.posted_at` between `a.posted_at` and `a.posted_at + 24 hours` (both ends inclusive), and count the matches per starting review — the start counts itself. The product's burst size is the `MAX` of those counts, and `HAVING` keeps products reaching 3.",
      "",
      "The alternative does the same count as a correlated subquery per suspect review, using `TIMESTAMPDIFF(SECOND, …) BETWEEN 0 AND 86400` for the span. The self join is quadratic in the suspect reviews of a product, which is small in practice; a window function over a numeric timestamp with a `RANGE` frame is the scalable version on engines that allow it.",
    ].join("\n"),
  },

  {
    slug: "amazon-aws-promotional-credits-applied-month-by-month",
    title: "Amazon: AWS Promotional Credits Applied Month by Month",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins", "Conditional Logic"],
    description: [
      "Start-ups on a cloud credits programme get one promotional credit grant. Credits are applied to the account's monthly bills **oldest month first**, as much of each bill as the remaining credit covers, until the credit runs out. Bills for months **after** the grant's `expires_month` get no credit, even if some is left. Accounts with no grant get no credit.",
      "",
      "For every bill, return `account_id`, `bill_month`, `credit_applied` and `amount_due` (the bill minus the credit applied). Order the rows by `account_id`, then `bill_month`.",
    ].join("\n"),
    tables: [
      {
        name: "CreditGrant",
        columns: [
          { name: "account_id", type: "int" },
          { name: "credit_amount", type: "int" },
          { name: "expires_month", type: "char" },
        ],
        primaryKey: ["account_id"],
        note: "At most one grant per account, in dollars; `expires_month` ('YYYY-MM') is the last month the credit can be used.",
      },
      {
        name: "MonthlyBill",
        columns: [
          { name: "account_id", type: "int" },
          { name: "bill_month", type: "char" },
          { name: "bill_amount", type: "int" },
        ],
        primaryKey: ["account_id", "bill_month"],
        note: "One row per account per billed month ('YYYY-MM'), in dollars; months with no usage have no row.",
      },
    ],
    examples: [
      {
        CreditGrant: [
          [201, 1000, "2025-06"],
          [202, 500, "2025-03"],
        ],
        MonthlyBill: [
          [201, "2025-02", 300],
          [201, "2025-03", 450],
          [201, "2025-05", 400],
          [201, "2025-07", 200],
          [202, "2025-02", 120],
          [202, "2025-04", 300],
          [203, "2025-02", 90],
        ],
      },
    ],
    gen: (rng) => {
      const accounts = [201, 202, 203, 204];
      const months = ["2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06", "2025-07"];
      const grants: Cell[][] = sample(rng, accounts, ri(rng, 0, 4)).map((a) => [a, roundTo(rng, 100, 1500, 50), pick(rng, months)]);
      const bills: Cell[][] = [];
      for (const a of sample(rng, accounts, ri(rng, 0, 4))) {
        for (const m of sample(rng, months, ri(rng, 1, 6))) bills.push([a, m, roundTo(rng, 50, 600, 10)]);
      }
      return { CreditGrant: grants, MonthlyBill: shuffle(rng, bills) };
    },
    solution: [
      "WITH b AS (",
      "  SELECT m.account_id, m.bill_month, m.bill_amount, g.credit_amount, g.expires_month,",
      "         COALESCE(SUM(m.bill_amount) OVER (PARTITION BY m.account_id ORDER BY m.bill_month",
      "                                          ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0) AS billed_before",
      "  FROM MonthlyBill m",
      "  LEFT JOIN CreditGrant g ON g.account_id = m.account_id",
      "), c AS (",
      "  SELECT account_id, bill_month, bill_amount,",
      "         CASE WHEN credit_amount IS NULL OR bill_month > expires_month THEN 0",
      "              ELSE LEAST(bill_amount, GREATEST(credit_amount - billed_before, 0)) END AS credit_applied",
      "  FROM b",
      ")",
      "SELECT account_id, bill_month, credit_applied, bill_amount - credit_applied AS amount_due",
      "FROM c",
      "ORDER BY account_id, bill_month",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE ordered AS (",
        "  SELECT m.account_id, m.bill_month, m.bill_amount, COALESCE(g.credit_amount, 0) AS credit_amount, g.expires_month,",
        "         ROW_NUMBER() OVER (PARTITION BY m.account_id ORDER BY m.bill_month) AS k",
        "  FROM MonthlyBill m LEFT JOIN CreditGrant g ON g.account_id = m.account_id",
        "), walk AS (",
        "  SELECT account_id, bill_month, bill_amount, k,",
        "         CASE WHEN expires_month IS NULL OR bill_month > expires_month THEN 0 ELSE LEAST(bill_amount, credit_amount) END AS applied,",
        "         credit_amount - CASE WHEN expires_month IS NULL OR bill_month > expires_month THEN 0 ELSE LEAST(bill_amount, credit_amount) END AS remaining",
        "  FROM ordered WHERE k = 1",
        "  UNION ALL",
        "  SELECT o.account_id, o.bill_month, o.bill_amount, o.k,",
        "         CASE WHEN o.expires_month IS NULL OR o.bill_month > o.expires_month THEN 0 ELSE LEAST(o.bill_amount, w.remaining) END,",
        "         w.remaining - CASE WHEN o.expires_month IS NULL OR o.bill_month > o.expires_month THEN 0 ELSE LEAST(o.bill_amount, w.remaining) END",
        "  FROM walk w JOIN ordered o ON o.account_id = w.account_id AND o.k = w.k + 1",
        ")",
        "SELECT account_id, bill_month, applied AS credit_applied, bill_amount - applied AS amount_due",
        "FROM walk ORDER BY account_id, bill_month",
      ].join("\n"),
      [
        "SELECT m.account_id, m.bill_month,",
        "       IF(g.account_id IS NULL OR m.bill_month > g.expires_month, 0,",
        "          LEAST(m.bill_amount, GREATEST(g.credit_amount - COALESCE((SELECT SUM(p.bill_amount) FROM MonthlyBill p",
        "                WHERE p.account_id = m.account_id AND p.bill_month < m.bill_month), 0), 0))) AS credit_applied,",
        "       m.bill_amount - IF(g.account_id IS NULL OR m.bill_month > g.expires_month, 0,",
        "          LEAST(m.bill_amount, GREATEST(g.credit_amount - COALESCE((SELECT SUM(p.bill_amount) FROM MonthlyBill p",
        "                WHERE p.account_id = m.account_id AND p.bill_month < m.bill_month), 0), 0))) AS amount_due",
        "FROM MonthlyBill m LEFT JOIN CreditGrant g ON g.account_id = m.account_id",
        "ORDER BY m.account_id, m.bill_month",
      ].join("\n"),
    ],
    hints: [
      "Before the credit runs out, every earlier bill was paid in full by it.",
      "So the credit left when a month is billed is the grant minus the sum of all earlier bills (but not below 0).",
      "A running sum over the earlier months only: a window frame ending at `1 PRECEDING`.",
      "Apply `LEAST(bill, remaining)` — and 0 after expiry or with no grant.",
    ],
    editorial: [
      "Burning a balance down looks like it needs a loop, but here it does not. Until the credit is exhausted, it pays every bill **in full**; so when a month is billed, the credit left is simply the grant minus the total of all earlier bills, floored at 0. That total is a running sum over the earlier rows only — `SUM(bill_amount) OVER (PARTITION BY account_id ORDER BY bill_month ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING)` — which is NULL for the first month, hence the `COALESCE`.",
      "",
      "The credit applied to a month is then `LEAST(bill, GREATEST(grant − billed_before, 0))`: the whole bill while credit lasts, the remainder in the month it runs out, 0 afterwards. Expiry only cuts the tail: the months up to `expires_month` are a prefix of the account's months, so the running sum over earlier months is still the right amount spent, and months after expiry are forced to 0 by the `CASE`. Accounts without a grant come through the LEFT JOIN with a NULL credit and get 0. 'YYYY-MM' strings sort and compare in calendar order.",
      "",
      "The first alternative does it the literal way: a **recursive CTE** walks each account's bills in order, carrying the remaining balance from one month to the next. The second computes the earlier bills' total with a correlated subquery. The window version sorts each account once; the recursive one does a join per month step.",
    ].join("\n"),
    ordered: true,
  },

  {
    slug: "amazon-suggested-subscribe-and-save-cadence",
    title: "Amazon: Suggested Subscribe & Save Cadence From Reorder Gaps",
    difficulty: "HARD",
    topics: ["Aggregation", "Subqueries", "Dates", "Window Functions"],
    description: [
      "The Subscribe & Save team wants to nudge customers who keep reordering the same consumable to subscribe, pre-filled with a delivery cadence that matches their habit.",
      "",
      "Look at **delivered** orders only, and count each customer–ASIN pair's **distinct order dates** (two delivered orders on one day count once). For every pair with **at least 3** distinct dates, let `orders` be that count and `span_days` the days from the first date to the last. The pair reorders every `span_days / (orders − 1)` days on average; suggest the cadence `cadence_months` from **1, 2, 3, 4 or 6** months (a month counted as 30 days) whose length is **closest** to that average, choosing the **shorter** cadence on a tie. Return `customer_id`, `asin`, `orders`, `span_days` and `cadence_months`, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "ConsumableOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "asin", type: "varchar" },
          { name: "ordered_on", type: "date" },
          { name: "status", type: "enum", values: ["delivered", "cancelled", "returned"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per order of a single product.",
      },
    ],
    examples: [
      {
        ConsumableOrder: [
          [1, 51, "B0DETERG01", "2025-01-05", "delivered"],
          [2, 51, "B0DETERG01", "2025-02-03", "delivered"],
          [3, 51, "B0DETERG01", "2025-03-08", "delivered"],
          [4, 51, "B0DETERG01", "2025-03-08", "delivered"],
          [5, 52, "B0RAZOR002", "2025-01-01", "delivered"],
          [6, 52, "B0RAZOR002", "2025-02-15", "delivered"],
          [7, 52, "B0RAZOR002", "2025-04-01", "delivered"],
          [8, 53, "B0PETFOOD3", "2025-01-10", "delivered"],
          [9, 53, "B0PETFOOD3", "2025-02-10", "cancelled"],
          [10, 53, "B0PETFOOD3", "2025-03-10", "delivered"],
          [11, 54, "B0VITAMIN4", "2025-01-01", "delivered"],
          [12, 54, "B0VITAMIN4", "2025-04-30", "delivered"],
          [13, 54, "B0VITAMIN4", "2025-09-15", "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      if (chance(rng, 0.05)) return { ConsumableOrder: [] };
      for (const c of sample(rng, [51, 52, 53, 54, 55], ri(rng, 1, 4))) {
        for (const a of sample(rng, ["B0DETERG01", "B0RAZOR002", "B0PETFOOD3", "B0VITAMIN4"], ri(rng, 1, 2))) {
          const gap = pick(rng, [20, 30, 45, 60, 75, 90, 105, 120, 150, 180, 200]);
          let d = dateBetween(rng, "2024-06-01", "2024-12-31");
          for (let k = ri(rng, 1, 6); k > 0; k--) {
            rows.push([id++, c, a, d, chance(rng, 0.8) ? "delivered" : pick(rng, ["cancelled", "returned"])]);
            if (chance(rng, 0.1)) rows.push([id++, c, a, d, "delivered"]);
            d = addDays(d, chance(rng, 0.5) ? gap : gap + ri(rng, -10, 10));
          }
        }
      }
      return { ConsumableOrder: shuffle(rng, rows) };
    },
    solution: [
      "WITH d AS (",
      "  SELECT DISTINCT customer_id, asin, ordered_on FROM ConsumableOrder WHERE status = 'delivered'",
      "), s AS (",
      "  SELECT customer_id, asin, COUNT(*) AS orders, DATEDIFF(MAX(ordered_on), MIN(ordered_on)) AS span_days",
      "  FROM d GROUP BY customer_id, asin HAVING COUNT(*) >= 3",
      "), c AS (",
      "  SELECT 1 AS m UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 6",
      "), r AS (",
      "  SELECT s.customer_id, s.asin, s.orders, s.span_days, c.m,",
      "         ROW_NUMBER() OVER (PARTITION BY s.customer_id, s.asin",
      "                            ORDER BY ABS(s.span_days - 30 * c.m * (s.orders - 1)), c.m) AS rn",
      "  FROM s CROSS JOIN c",
      ")",
      "SELECT customer_id, asin, orders, span_days, m AS cadence_months FROM r WHERE rn = 1",
    ].join("\n"),
    alternatives: [
      [
        "WITH s AS (",
        "  SELECT customer_id, asin, COUNT(DISTINCT ordered_on) AS orders, DATEDIFF(MAX(ordered_on), MIN(ordered_on)) AS span_days",
        "  FROM ConsumableOrder WHERE status = 'delivered' GROUP BY customer_id, asin HAVING COUNT(DISTINCT ordered_on) >= 3",
        "), c AS (",
        "  SELECT 1 AS m UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 6",
        ")",
        "SELECT s.customer_id, s.asin, s.orders, s.span_days, c1.m AS cadence_months",
        "FROM s JOIN c c1",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM c c2",
        "  WHERE ABS(s.span_days / (s.orders - 1) - 30 * c2.m) < ABS(s.span_days / (s.orders - 1) - 30 * c1.m)",
        "     OR (ABS(s.span_days / (s.orders - 1) - 30 * c2.m) = ABS(s.span_days / (s.orders - 1) - 30 * c1.m) AND c2.m < c1.m))",
      ].join("\n"),
    ],
    hints: [
      "De-duplicate the delivered dates per customer and ASIN before counting anything.",
      "The average gap is the span divided by the number of gaps, `orders − 1`.",
      "Put the five cadences in a small derived table and pair every customer–ASIN with each of them.",
      "Rank the pairs by distance to the average gap, then by cadence, and keep the first.",
      "Multiplying both sides by `orders − 1` keeps the comparison in integers.",
    ],
    editorial: [
      "There are three steps. First, reduce the orders to **distinct delivered dates** per customer and ASIN, so a duplicate order on one day does not count as a reorder with a zero-day gap; cancelled and returned orders never happened from the habit's point of view. Grouping those gives `orders` and `span_days = DATEDIFF(last, first)`, and `HAVING COUNT(*) >= 3` keeps pairs with at least two gaps — enough to call it a habit.",
      "",
      "Second, the candidate cadences are a five-row **inline table** built with `UNION ALL`. Cross-joining it with the pairs gives every (pair, cadence) combination, scored by how far the cadence's length is from the average gap. The average is `span / (orders − 1)`; multiplying both sides by `orders − 1` compares `|span − 30·m·(orders − 1)|` instead, which is exact integer arithmetic with the same ordering, so ties are detected exactly.",
      "",
      "Third, keep the best cadence per pair: `ROW_NUMBER()` ordered by the distance and then by `m` puts the closest first and the shorter one first among equals. The alternative states the same choice as an anti join — keep cadence `c1` when no `c2` is strictly closer, or equally close and shorter — and compares the decimal averages directly. Both cost five rows per pair after one grouped scan.",
    ].join("\n"),
  },

  {
    slug: "amazon-packing-backlog-carried-hour-to-hour",
    title: "Amazon: Packing Station Backlog Carried Hour to Hour",
    difficulty: "HARD",
    topics: ["Window Functions", "Subqueries"],
    description: [
      "Each hour, orders arrive at a fulfilment centre's packing station and the station can pack up to its `capacity` that hour. Orders not packed wait in a **backlog** for the next hour. Spare capacity cannot be banked: when the station empties its backlog, the backlog is 0, never negative.",
      "",
      "So the backlog at the end of an hour is `previous backlog + arrivals − capacity`, or 0 if that is negative; before the first slot the backlog is 0. Every station has a row for each `slot` from 1 up to its last, with no gaps. Return `station_id`, `slot` and `backlog` for every row, ordered by `station_id`, then `slot`.",
    ].join("\n"),
    tables: [
      {
        name: "PackingHour",
        columns: [
          { name: "station_id", type: "varchar" },
          { name: "slot", type: "int" },
          { name: "arrivals", type: "int" },
          { name: "capacity", type: "int" },
        ],
        primaryKey: ["station_id", "slot"],
        note: "One row per station per hour of a shift; `slot` 1 is the shift's first hour.",
      },
    ],
    examples: [
      {
        PackingHour: [
          ["PK-01", 1, 120, 100],
          ["PK-01", 2, 90, 100],
          ["PK-01", 3, 40, 100],
          ["PK-01", 4, 150, 100],
          ["PK-01", 5, 100, 100],
          ["PK-02", 1, 60, 80],
          ["PK-02", 2, 130, 80],
          ["PK-02", 3, 80, 80],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const s of sample(rng, ["PK-01", "PK-02", "PK-03", "PK-04"], ri(rng, 0, 4))) {
        const cap = roundTo(rng, 60, 120, 10);
        for (const slot of seq(1, ri(rng, 1, 8))) {
          const c = chance(rng, 0.2) ? cap - 20 : cap;
          rows.push([s, slot, chance(rng, 0.2) ? c : Math.max(0, c + ri(rng, -60, 60)), c]);
        }
      }
      return { PackingHour: shuffle(rng, rows) };
    },
    solution: [
      "WITH RECURSIVE q AS (",
      "  SELECT station_id, slot, GREATEST(arrivals - capacity, 0) AS backlog",
      "  FROM PackingHour",
      "  WHERE slot = 1",
      "  UNION ALL",
      "  SELECT h.station_id, h.slot, GREATEST(q.backlog + h.arrivals - h.capacity, 0)",
      "  FROM q",
      "  JOIN PackingHour h ON h.station_id = q.station_id AND h.slot = q.slot + 1",
      ")",
      "SELECT station_id, slot, backlog",
      "FROM q",
      "ORDER BY station_id, slot",
    ].join("\n"),
    alternatives: [
      [
        "WITH s AS (",
        "  SELECT station_id, slot,",
        "         SUM(arrivals - capacity) OVER (PARTITION BY station_id ORDER BY slot ROWS UNBOUNDED PRECEDING) AS net",
        "  FROM PackingHour",
        ")",
        "SELECT station_id, slot,",
        "       net - LEAST(0, MIN(net) OVER (PARTITION BY station_id ORDER BY slot ROWS UNBOUNDED PRECEDING)) AS backlog",
        "FROM s",
        "ORDER BY station_id, slot",
      ].join("\n"),
    ],
    hints: [
      "A plain running sum of `arrivals − capacity` goes negative after a quiet hour; the backlog cannot.",
      "Each hour's value depends on the previous hour's result — that is a recursion.",
      "`WITH RECURSIVE`: start at slot 1, then join slot n + 1 to the row computed for slot n.",
      "Or: the backlog equals the running net minus the lowest running net so far (counting 0 as a candidate).",
    ],
    editorial: [
      "If spare capacity could be banked, the backlog would be a running sum of `arrivals − capacity`. It cannot: an hour with idle capacity empties the queue to 0 and the rest of that capacity is lost, so the next hour starts from 0, not from a negative number. That **clamp** makes each hour depend on the previous hour's *result*, which a plain running sum cannot express.",
      "",
      "A **recursive CTE** follows the definition literally. The anchor computes slot 1 from a backlog of 0; the recursive member joins each computed row to the same station's next slot (`h.slot = q.slot + 1`, which is safe because slots have no gaps) and applies `GREATEST(previous + arrivals − capacity, 0)`. The recursion stops when no next slot exists, and all stations advance in parallel.",
      "",
      "There is also a closed form, used by the alternative. Let `net` be the running sum of `arrivals − capacity`. Each time the clamp fires it discards exactly the amount by which `net` dips below its previous low, so the backlog is `net − min(0, lowest net so far)`: a running `SUM` and a running `MIN` over window frames. This is the queueing recursion known as Lindley's equation. The window form sorts each station once; the recursive form does one join per slot.",
    ].join("\n"),
    ordered: true,
  },
];
