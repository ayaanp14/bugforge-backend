import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { FIRST_NAMES, LAST_NAMES, addDays, chance, dateBetween, names, pick, ri, roundTo, sample } from "./kit.js";

/**
 * Uber: the questions an analyst or data engineer at a ride-hailing and
 * delivery company is asked in an ordinary week — late-cancel fees, surge
 * share by hour, pickup ETA accuracy, airport queues, Uber One break-even and
 * win-backs, promo abuse and attribution, UberX Share matching, Uber Eats
 * batching, Uber Freight rate spikes, fare splits to the paisa. The schemas
 * and the data are invented for practice; nothing here is Uber's real schema
 * or any real figure. Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
const pad = (n: number) => String(n).padStart(2, "0");
/** 'YYYY-MM-DD HH:MM:SS' from a date and seconds after its midnight (may run into later days). */
const atS = (date: string, seconds: number): string => {
  const d = addDays(date, Math.floor(seconds / 86400));
  const s = ((seconds % 86400) + 86400) % 86400;
  return `${d} ${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};
/** 'YYYY-MM-DD HH:MM:00' from a date and minutes after its midnight. */
const at = (date: string, minutes: number): string => atS(date, minutes * 60);

const PROMO_CODES = [
  "RIDE50", "EATS100", "MONSOON25", "AIRPORT75", "CAMPUS30", "DIWALI40", "NIGHT20",
  "FIRSTRIDE", "WEEKEND20", "METRO15", "RAINY35", "OFFICE10",
] as const;
const CARRIERS = ["Bharat Roadlines", "Deccan Haulers", "Sahyadri Freight", "Ganga Logistics", "Western Express Carriers", "Northline Trucking"] as const;
const LANES = ["Mumbai-Pune", "Delhi-Jaipur", "Chennai-Bengaluru", "Ahmedabad-Mumbai", "Hyderabad-Bengaluru", "Kolkata-Patna"] as const;
const UBER_CITIES = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai"] as const;
const ZONES = ["Koramangala", "Indiranagar", "HSR Layout", "Whitefield", "MG Road", "Airport"] as const;
const RESTAURANTS = ["Meghana Foods", "Truffles", "Empire", "Nagarjuna", "CTR", "Leon Grill"] as const;

export const COMPANY_UBER: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "uber-one-trials-ending-without-auto-renew",
    title: "Uber: Uber One Trials Ending Without Auto-Renew",
    difficulty: "EASY",
    topics: ["Basics", "Dates"],
    description: [
      "The Uber One lifecycle team sends a \"your free trial is ending\" nudge to members who have not switched auto-renew on, so that they do not lose their benefits by surprise.",
      "",
      "Return every membership on the **`trial`** plan whose `ends_on` falls **between 2024-07-01 and 2024-07-07 inclusive** and whose `auto_renew` is **0**. Return the columns `membership_id`, `rider_name` and `ends_on`, ordered by `ends_on` and then by `membership_id`.",
    ].join("\n"),
    tables: [
      {
        name: "UberOneMembership",
        columns: [
          { name: "membership_id", type: "int" },
          { name: "rider_name", type: "varchar" },
          { name: "plan", type: "enum", values: ["trial", "monthly", "annual"] },
          { name: "started_on", type: "date" },
          { name: "ends_on", type: "date" },
          { name: "auto_renew", type: "bool" },
        ],
        primaryKey: ["membership_id"],
        note: "One row per membership. `auto_renew` is 1 when the rider has agreed to be charged when the current plan ends, 0 otherwise.",
      },
    ],
    examples: [
      {
        UberOneMembership: [
          [1, "Aarav", "trial", "2024-06-01", "2024-07-01", 0],
          [2, "Diya", "trial", "2024-06-05", "2024-07-05", 1],
          [3, "Kabir", "monthly", "2024-06-03", "2024-07-03", 0],
          [4, "Meera", "trial", "2024-06-07", "2024-07-07", 0],
          [5, "Rohan", "trial", "2024-06-08", "2024-07-08", 0],
          [6, "Zara", "trial", "2024-05-31", "2024-06-30", 0],
          [7, "Ishaan", "trial", "2024-06-02", "2024-07-02", 0],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 4, 18);
      const who = names(rng, n);
      const rows: Cell[][] = seq(1, n).map((id, i) => {
        const plan = pick(rng, ["trial", "trial", "trial", "monthly", "annual"]);
        const ends = chance(rng, 0.3) ? pick(rng, ["2024-06-30", "2024-07-01", "2024-07-07", "2024-07-08"]) : dateBetween(rng, "2024-06-25", "2024-07-12");
        const started = addDays(ends, plan === "annual" ? -365 : -30);
        return [id, who[i]!, plan, started, ends, chance(rng, 0.45) ? 1 : 0];
      });
      return { UberOneMembership: rows };
    },
    solution: [
      "SELECT membership_id, rider_name, ends_on",
      "FROM UberOneMembership",
      "WHERE plan = 'trial'",
      "  AND auto_renew = 0",
      "  AND ends_on BETWEEN '2024-07-01' AND '2024-07-07'",
      "ORDER BY ends_on, membership_id",
    ].join("\n"),
    alternatives: [
      "SELECT membership_id, rider_name, ends_on FROM UberOneMembership WHERE plan IN ('trial') AND NOT auto_renew AND ends_on >= '2024-07-01' AND ends_on < '2024-07-08' ORDER BY 3, 1",
    ],
    ordered: true,
    hints: [
      "Three conditions must hold together: the plan, the auto-renew flag and the end date.",
      "\"Inclusive\" means a trial ending on 2024-07-01 or on 2024-07-07 is in.",
      "The order has two keys: the end date first, the id to break ties.",
    ],
    editorial: [
      "This is a single-table filter with a fixed order. A membership qualifies only when all three facts are true at once, so the conditions are joined with `AND`: the plan is `trial` (a monthly member whose plan ends is renewing, not converting), `auto_renew` is 0 (members who already opted in need no nudge), and `ends_on` lies in the first week of July.",
      "",
      "`BETWEEN '2024-07-01' AND '2024-07-07'` is inclusive at both ends, which is what the statement asks for. Dates in `YYYY-MM-DD` form compare correctly, so the alternative's half-open range `>= '2024-07-01' AND < '2024-07-08'` is the same test — a form that stays right even if the column later gains a time of day.",
      "",
      "Several trials can end on the same day, so ordering by `ends_on` alone would leave their order to the engine; adding `membership_id` as the second key makes the output fully determined. The query is one scan, or a range read with an index on `ends_on`.",
    ].join("\n"),
  },

  {
    slug: "uber-rider-late-cancellation-fees",
    title: "Uber: Rider Cancellations That Earn a Late-Cancel Fee",
    difficulty: "EASY",
    topics: ["Dates", "Basics"],
    description: [
      "Riders may cancel for free for a short while after a driver accepts; after that the driver has already started driving over, so the rider is charged a cancellation fee. The payments team wants the list of trips to charge.",
      "",
      "A trip is charged when its `status` is **`rider_cancelled`**, a driver **had accepted** it (`accepted_at` is not NULL), and the rider cancelled **more than 120 seconds** after the acceptance. Return `trip_id`, `rider_id` and `seconds_after_accept` (whole seconds from `accepted_at` to `cancelled_at`), ordered by `trip_id`.",
    ].join("\n"),
    tables: [
      {
        name: "TripRequest",
        columns: [
          { name: "trip_id", type: "int" },
          { name: "rider_id", type: "int" },
          { name: "requested_at", type: "datetime" },
          { name: "accepted_at", type: "datetime" },
          { name: "cancelled_at", type: "datetime" },
          { name: "status", type: "enum", values: ["completed", "rider_cancelled", "driver_cancelled", "no_driver"] },
        ],
        primaryKey: ["trip_id"],
        note: "One row per ride request. `accepted_at` is NULL when no driver accepted; `cancelled_at` is NULL unless the request was cancelled.",
      },
    ],
    examples: [
      {
        TripRequest: [
          [101, 11, "2024-05-10 08:00:00", "2024-05-10 08:00:40", "2024-05-10 08:04:10", "rider_cancelled"],
          [102, 12, "2024-05-10 08:05:00", "2024-05-10 08:05:20", "2024-05-10 08:07:20", "rider_cancelled"],
          [103, 13, "2024-05-10 08:10:00", null, "2024-05-10 08:16:00", "rider_cancelled"],
          [104, 11, "2024-05-10 09:00:00", "2024-05-10 09:01:00", null, "completed"],
          [105, 14, "2024-05-10 09:30:00", "2024-05-10 09:30:30", "2024-05-10 09:40:00", "driver_cancelled"],
          [106, 15, "2024-05-10 10:00:00", "2024-05-10 10:00:15", "2024-05-10 10:02:16", "rider_cancelled"],
          [107, 16, "2024-05-10 10:20:00", null, null, "no_driver"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 4, 20);
      const rows: Cell[][] = seq(101, n).map((id) => {
        const day = dateBetween(rng, "2024-05-01", "2024-05-31");
        const req = ri(rng, 6 * 3600, 23 * 3600);
        const status = pick(rng, ["completed", "rider_cancelled", "rider_cancelled", "rider_cancelled", "driver_cancelled", "no_driver"]);
        const acc = status === "no_driver" || (status === "rider_cancelled" && chance(rng, 0.25)) ? null : req + ri(rng, 5, 120);
        let can: number | null = null;
        if (status === "rider_cancelled") can = (acc ?? req) + (chance(rng, 0.3) ? pick(rng, [119, 120, 121]) : ri(rng, 20, 420));
        if (status === "driver_cancelled") can = (acc ?? req) + ri(rng, 30, 600);
        return [id, ri(rng, 11, 20), atS(day, req), acc === null ? null : atS(day, acc), can === null ? null : atS(day, can), status];
      });
      return { TripRequest: rows };
    },
    solution: [
      "SELECT trip_id, rider_id, TIMESTAMPDIFF(SECOND, accepted_at, cancelled_at) AS seconds_after_accept",
      "FROM TripRequest",
      "WHERE status = 'rider_cancelled'",
      "  AND accepted_at IS NOT NULL",
      "  AND TIMESTAMPDIFF(SECOND, accepted_at, cancelled_at) > 120",
      "ORDER BY trip_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT trip_id, rider_id, TIMESTAMPDIFF(SECOND, accepted_at, cancelled_at) AS seconds_after_accept",
        "FROM TripRequest",
        "WHERE status = 'rider_cancelled' AND cancelled_at > DATE_ADD(accepted_at, INTERVAL 2 MINUTE)",
        "ORDER BY trip_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Only rider cancellations can be charged — a driver cancelling or no driver found is never the rider's fault.",
      "`TIMESTAMPDIFF(SECOND, earlier, later)` gives the gap in whole seconds.",
      "\"More than 120 seconds\" is strict: a cancellation at exactly 120 seconds is still free.",
      "A request nobody accepted has a NULL `accepted_at`; think about what a comparison with NULL returns.",
    ],
    editorial: [
      "The fee rule is three conditions on one row, so the whole query is a filter. The status must be `rider_cancelled`; a driver had to accept first, because the fee pays for a driver who was already on the way; and the cancellation must come after the free window, measured from acceptance, not from the request.",
      "",
      "`TIMESTAMPDIFF(SECOND, accepted_at, cancelled_at)` is the length of that wait. It appears in both the `WHERE` clause and the select list, where it becomes `seconds_after_accept`. The comparison is strict (`> 120`), so trip 102, cancelled exactly two minutes after acceptance, is not charged.",
      "",
      "When `accepted_at` is NULL the difference is NULL and `NULL > 120` is not true, so the explicit `IS NOT NULL` is belt and braces — the alternative relies on that NULL behaviour and compares `cancelled_at` with `DATE_ADD(accepted_at, INTERVAL 2 MINUTE)` instead. Both are one pass over the table.",
    ].join("\n"),
  },

  {
    slug: "uber-freight-loads-booked-below-posted-rate",
    title: "Uber: Freight Loads Booked Below the Posted Rate",
    difficulty: "EASY",
    topics: ["Joins", "Basics"],
    description: [
      "On Uber Freight a shipper's load is posted at a rate, and a carrier books it — sometimes after negotiating the price down. The pricing team wants to see where carriers accepted less than the posted rate.",
      "",
      "Return every load that has been booked at a `booked_rate` **strictly lower** than its `posted_rate`, with the columns `load_id`, `carrier_name` and `saving` (`posted_rate - booked_rate`). Loads not yet booked have a NULL `booked_rate` and `carrier_id` and are never in the answer. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Carrier",
        columns: [
          { name: "carrier_id", type: "int" },
          { name: "carrier_name", type: "varchar" },
        ],
        primaryKey: ["carrier_id"],
        note: "One row per trucking company on the platform.",
      },
      {
        name: "FreightLoad",
        columns: [
          { name: "load_id", type: "int" },
          { name: "lane", type: "varchar" },
          { name: "posted_rate", type: "int" },
          { name: "booked_rate", type: "int" },
          { name: "carrier_id", type: "int" },
        ],
        primaryKey: ["load_id"],
        note: "Rates are in rupees for the whole load. A booked load always names an existing carrier; an unbooked one has NULL `booked_rate` and `carrier_id`.",
      },
    ],
    examples: [
      {
        Carrier: [
          [1, "Bharat Roadlines"],
          [2, "Deccan Haulers"],
          [3, "Sahyadri Freight"],
        ],
        FreightLoad: [
          [501, "Mumbai-Pune", 42000, 39500, 1],
          [502, "Delhi-Jaipur", 56000, 56000, 2],
          [503, "Chennai-Bengaluru", 61000, null, null],
          [504, "Ahmedabad-Mumbai", 48000, 51000, 3],
          [505, "Hyderabad-Bengaluru", 73000, 68000, 2],
          [506, "Kolkata-Patna", 30000, 27500, 1],
        ],
      },
    ],
    gen: (rng) => {
      const carriers: Cell[][] = sample(rng, CARRIERS, ri(rng, 1, 5)).map((name, i) => [i + 1, name]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 18);
      const loads: Cell[][] = seq(501, n).map((id) => {
        const posted = roundTo(rng, 20000, 90000, 500);
        const booked = chance(rng, 0.8);
        return [id, pick(rng, LANES), posted, booked ? posted + roundTo(rng, -5000, 4000, 500) : null, booked ? ri(rng, 1, carriers.length) : null];
      });
      return { Carrier: carriers, FreightLoad: loads };
    },
    solution: [
      "SELECT l.load_id, c.carrier_name, l.posted_rate - l.booked_rate AS saving",
      "FROM FreightLoad l",
      "JOIN Carrier c ON c.carrier_id = l.carrier_id",
      "WHERE l.booked_rate < l.posted_rate",
    ].join("\n"),
    alternatives: [
      "SELECT load_id, (SELECT carrier_name FROM Carrier c WHERE c.carrier_id = l.carrier_id) AS carrier_name, posted_rate - booked_rate AS saving FROM FreightLoad l WHERE posted_rate - booked_rate > 0",
    ],
    hints: [
      "The carrier's name lives in another table — join on `carrier_id`.",
      "Strictly lower: a load booked at exactly the posted rate saved nothing.",
      "What does `NULL < 42000` evaluate to? You may not need an extra condition for unbooked loads.",
    ],
    editorial: [
      "Each qualifying load needs one fact from `FreightLoad` (the two rates) and one from `Carrier` (the name), so the query joins the two on `carrier_id` and filters on the rates.",
      "",
      "The condition `booked_rate < posted_rate` is strict, so load 502, booked at exactly its posted price, is out, and so is load 504, where the carrier negotiated the price **up**. The saving is simply the difference of the two rates, computed in the select list.",
      "",
      "Unbooked loads need no special handling: their `booked_rate` is NULL, the comparison with NULL is unknown, and `WHERE` keeps only rows where it is true; their NULL `carrier_id` would also fail the inner join. The alternative fetches the name with a correlated scalar subquery instead of a join and writes the test as a positive difference — the same rows, since a booked load always names a carrier. Either way it is one pass over the loads with a primary-key lookup per row.",
    ].join("\n"),
  },

  {
    slug: "uber-promo-codes-nobody-redeemed",
    title: "Uber: Promo Codes Nobody Has Redeemed",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "Growth marketing is cleaning up the promo catalogue: a code that has been live for a while and was never used is retired.",
      "",
      "Return the `promo_code` and `campaign` of every code **created before 2024-06-01** that has **no redemption at all** in `PromoRedemption`. Codes created on or after 2024-06-01 are too new to judge and are left out. Order the result by `promo_code`.",
    ].join("\n"),
    tables: [
      {
        name: "PromoCode",
        columns: [
          { name: "promo_code", type: "varchar" },
          { name: "campaign", type: "varchar" },
          { name: "created_on", type: "date" },
        ],
        primaryKey: ["promo_code"],
        note: "One row per promo code. Codes are upper-case.",
      },
      {
        name: "PromoRedemption",
        columns: [
          { name: "redemption_id", type: "int" },
          { name: "promo_code", type: "varchar" },
          { name: "rider_id", type: "int" },
          { name: "redeemed_on", type: "date" },
        ],
        primaryKey: ["redemption_id"],
        note: "One row each time a rider applied a code to a trip or order; `promo_code` always names an existing code.",
      },
    ],
    examples: [
      {
        PromoCode: [
          ["EATS100", "Eats launch", "2024-05-02"],
          ["MONSOON25", "Monsoon rides", "2024-05-20"],
          ["RIDE50", "New rider", "2024-04-11"],
          ["AIRPORT75", "Airport drops", "2024-05-28"],
          ["DIWALI40", "Festive", "2024-06-03"],
          ["CAMPUS30", "Campus", "2024-05-31"],
        ],
        PromoRedemption: [
          [1, "RIDE50", 201, "2024-04-20"],
          [2, "RIDE50", 202, "2024-05-01"],
          [3, "MONSOON25", 203, "2024-06-02"],
          [4, "AIRPORT75", 204, "2024-06-10"],
        ],
      },
    ],
    gen: (rng) => {
      const codes = sample(rng, PROMO_CODES, ri(rng, 1, 9));
      const promo: Cell[][] = codes.map((c) => [c, pick(rng, ["New rider", "Eats launch", "Festive", "Airport drops", "Campus", "Monsoon rides"]), chance(rng, 0.2) ? pick(rng, ["2024-05-31", "2024-06-01"]) : dateBetween(rng, "2024-04-01", "2024-06-15")]);
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 14);
      const red: Cell[][] = seq(1, m).map((id) => [id, pick(rng, codes.slice(0, Math.max(1, codes.length - ri(rng, 0, 3)))), ri(rng, 201, 230), dateBetween(rng, "2024-04-15", "2024-06-30")]);
      return { PromoCode: promo, PromoRedemption: red };
    },
    solution: [
      "SELECT p.promo_code, p.campaign",
      "FROM PromoCode p",
      "LEFT JOIN PromoRedemption r ON r.promo_code = p.promo_code",
      "WHERE r.redemption_id IS NULL",
      "  AND p.created_on < '2024-06-01'",
      "ORDER BY p.promo_code",
    ].join("\n"),
    alternatives: [
      "SELECT promo_code, campaign FROM PromoCode p WHERE created_on < '2024-06-01' AND NOT EXISTS (SELECT 1 FROM PromoRedemption r WHERE r.promo_code = p.promo_code) ORDER BY promo_code",
      "SELECT promo_code, campaign FROM PromoCode WHERE created_on < '2024-06-01' AND promo_code NOT IN (SELECT promo_code FROM PromoRedemption) ORDER BY promo_code",
    ],
    ordered: true,
    hints: [
      "You are looking for codes with **no** matching row in another table — an anti join.",
      "A LEFT JOIN keeps every code; the codes with no redemption have NULLs in the redemption columns.",
      "\"Before 2024-06-01\" is strict: a code created on that day is too new.",
    ],
    editorial: [
      "The question is about absence: codes for which no redemption row exists. That is an **anti join**, and SQL offers three common spellings of it.",
      "",
      "The solution uses `LEFT JOIN`: every code is kept, matched to each of its redemptions, and a code with none gets a single row whose redemption columns are NULL. Filtering on `r.redemption_id IS NULL` keeps exactly those. A code redeemed many times produces many joined rows, but none of them survive the filter, so no duplicates appear. The age condition `created_on < '2024-06-01'` is then an ordinary filter on the code itself.",
      "",
      "`NOT EXISTS` states the idea most directly and stops at the first redemption found. `NOT IN` works too here because `PromoRedemption.promo_code` is never NULL — if it could be, a single NULL would make `NOT IN` return no rows at all, which is why `NOT EXISTS` is the safer habit. With an index on `PromoRedemption.promo_code` all three are a lookup per code.",
    ].join("\n"),
  },

  {
    slug: "uber-driver-display-names-in-rider-app",
    title: "Uber: Driver Names as Shown in the Rider App",
    difficulty: "EASY",
    topics: ["Strings"],
    description: [
      "For privacy the rider app never shows a driver's full name: it shows the first name, a space, the **first letter of the last name** and a full stop — `Rahul Kumar Sharma` appears as `Rahul S.`. A driver registered with a single name is shown exactly as registered.",
      "",
      "Return `driver_id` and `display_name` for every driver, ordered by `driver_id`. Names are words separated by single spaces, with no leading or trailing spaces.",
    ].join("\n"),
    tables: [
      {
        name: "Driver",
        columns: [
          { name: "driver_id", type: "int" },
          { name: "full_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["driver_id"],
        note: "One row per driver partner; `full_name` is as written on the driving licence.",
      },
    ],
    examples: [
      {
        Driver: [
          [1, "Rahul Kumar Sharma", "Bengaluru"],
          [2, "Priya Nair", "Kochi"],
          [3, "Zara", "Mumbai"],
          [4, "Mohammed Farhan Khan", "Hyderabad"],
          [5, "Anjali Rao", "Delhi"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const words: string[] = [pick(rng, FIRST_NAMES)];
        const extra = pick(rng, [0, 1, 1, 1, 2]);
        if (extra === 2) words.push(pick(rng, ["Kumar", "Devi", "Mohan", "Lal", "Prasad"]));
        if (extra >= 1) words.push(pick(rng, LAST_NAMES));
        return [id, words.join(" "), pick(rng, UBER_CITIES)];
      });
      return { Driver: rows };
    },
    solution: [
      "SELECT driver_id,",
      "       CASE WHEN LOCATE(' ', full_name) = 0 THEN full_name",
      "            ELSE CONCAT(SUBSTRING_INDEX(full_name, ' ', 1), ' ', LEFT(SUBSTRING_INDEX(full_name, ' ', -1), 1), '.')",
      "       END AS display_name",
      "FROM Driver",
      "ORDER BY driver_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT driver_id,",
        "       IF(INSTR(full_name, ' ') = 0, full_name,",
        "          CONCAT(LEFT(full_name, INSTR(full_name, ' ') - 1), ' ',",
        "                 SUBSTRING(full_name, CHAR_LENGTH(full_name) - LOCATE(' ', REVERSE(full_name)) + 2, 1), '.')) AS display_name",
        "FROM Driver",
        "ORDER BY driver_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The first name is everything before the first space; the last name is everything after the last space.",
      "`SUBSTRING_INDEX(s, ' ', 1)` and `SUBSTRING_INDEX(s, ' ', -1)` give those two pieces.",
      "A one-word name has no space at all — handle it before building the short form.",
    ],
    editorial: [
      "The display name is assembled from two pieces of the full name: the first word, and the first letter of the last word. `SUBSTRING_INDEX(full_name, ' ', 1)` returns everything before the first space, and `SUBSTRING_INDEX(full_name, ' ', -1)` everything after the last space; `LEFT(…, 1)` takes that word's initial. `CONCAT` glues them together with a space and a full stop. Middle names fall away naturally, because only the first and the last words are read.",
      "",
      "A single-word name needs its own branch. Without it, both `SUBSTRING_INDEX` calls would return the whole name and `Zara` would become `Zara Z.`. `LOCATE(' ', full_name) = 0` detects the missing space, and the `CASE` returns the name unchanged.",
      "",
      "The alternative does the same with positions: `INSTR` finds the first space for the first name, and the last space is found by searching the **reversed** string, then converting that position back. Both are a constant amount of string work per row.",
    ].join("\n"),
  },

  {
    slug: "uber-airport-queue-dispatches-per-terminal",
    title: "Uber: Airport Queue Dispatches per Terminal",
    difficulty: "EASY",
    topics: ["Aggregation"],
    description: [
      "At airports, drivers wait in a virtual queue and are dispatched to arriving passengers in turn. The airport operations team reviews each terminal's queue every morning.",
      "",
      "For every terminal with **at least one dispatched** queue entry, return `terminal`, `dispatched` (the number of dispatched entries) and `longest_wait` (the largest `wait_minutes` among the **dispatched** entries only). Entries that left the queue or expired count for nothing. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "AirportQueue",
        columns: [
          { name: "entry_id", type: "int" },
          { name: "driver_id", type: "int" },
          { name: "terminal", type: "varchar" },
          { name: "joined_at", type: "datetime" },
          { name: "outcome", type: "enum", values: ["dispatched", "left_queue", "expired"] },
          { name: "wait_minutes", type: "int" },
        ],
        primaryKey: ["entry_id"],
        note: "One row each time a driver joined a terminal's queue; `wait_minutes` is the time from joining until the outcome.",
      },
    ],
    examples: [
      {
        AirportQueue: [
          [1, 7, "BLR T1", "2024-08-01 05:10:00", "dispatched", 42],
          [2, 8, "BLR T1", "2024-08-01 05:20:00", "dispatched", 55],
          [3, 9, "BLR T2", "2024-08-01 05:25:00", "left_queue", 80],
          [4, 10, "BLR T2", "2024-08-01 05:40:00", "dispatched", 35],
          [5, 7, "BLR T1", "2024-08-01 07:00:00", "expired", 120],
          [6, 11, "DEL T3", "2024-08-01 06:00:00", "left_queue", 15],
        ],
      },
    ],
    gen: (rng) => {
      const terminals = sample(rng, ["BLR T1", "BLR T2", "DEL T1", "DEL T3", "BOM T2"], ri(rng, 1, 4));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 20);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 1, 12),
        pick(rng, terminals),
        at("2024-08-01", ri(rng, 240, 720)),
        pick(rng, ["dispatched", "dispatched", "left_queue", "expired"]),
        ri(rng, 5, 130),
      ]);
      return { AirportQueue: rows };
    },
    solution: [
      "SELECT terminal, COUNT(*) AS dispatched, MAX(wait_minutes) AS longest_wait",
      "FROM AirportQueue",
      "WHERE outcome = 'dispatched'",
      "GROUP BY terminal",
    ].join("\n"),
    alternatives: [
      [
        "SELECT terminal,",
        "       COUNT(CASE WHEN outcome = 'dispatched' THEN 1 END) AS dispatched,",
        "       MAX(CASE WHEN outcome = 'dispatched' THEN wait_minutes END) AS longest_wait",
        "FROM AirportQueue",
        "GROUP BY terminal",
        "HAVING COUNT(CASE WHEN outcome = 'dispatched' THEN 1 END) > 0",
      ].join("\n"),
    ],
    hints: [
      "Both numbers are about dispatched entries only — filter before you group.",
      "`COUNT(*)` and `MAX(…)` per `terminal` give the two columns.",
      "A terminal whose entries were all filtered out never forms a group.",
    ],
    editorial: [
      "Both requested numbers describe dispatched entries, so the simplest plan is to filter first and aggregate second. `WHERE outcome = 'dispatched'` drops the drivers who gave up or whose entry expired; `GROUP BY terminal` then forms one group per terminal, and `COUNT(*)` and `MAX(wait_minutes)` read off the two columns.",
      "",
      "Filtering before grouping matters for `longest_wait`: in the example, BLR T1's expired entry waited 120 minutes, but that wait never led to a passenger, so the answer is 55. A terminal with no dispatched entry, like DEL T3, loses all its rows in `WHERE` and so never appears — exactly what the statement wants.",
      "",
      "The alternative keeps every row and moves the condition into the aggregates (`COUNT(CASE …)`, `MAX(CASE …)` — a CASE without ELSE yields NULL, which both functions skip), then removes terminals with no dispatch in `HAVING`. That form is handy when one query must report several outcomes side by side. Both are a single pass over the queue.",
    ].join("\n"),
  },

  {
    slug: "uber-riders-who-rated-every-trip-five-stars",
    title: "Uber: Riders Who Gave Every Rated Trip Five Stars",
    difficulty: "EASY",
    topics: ["Aggregation"],
    description: [
      "The ratings-integrity team treats a rider's ratings as less informative when they always give five stars; it wants to know who those riders are before weighting them.",
      "",
      "Return the riders who rated **at least 3 trips** and gave **5 stars on every trip they rated**. A trip the rider did not rate has a NULL `rating_given` and is ignored — it neither counts towards the 3 nor breaks the run of fives. Return `rider_id` and `rated_trips` (the number of trips the rider rated), in any order.",
    ].join("\n"),
    tables: [
      {
        name: "RiderTrip",
        columns: [
          { name: "trip_id", type: "int" },
          { name: "rider_id", type: "int" },
          { name: "driver_id", type: "int" },
          { name: "trip_date", type: "date" },
          { name: "rating_given", type: "int" },
        ],
        primaryKey: ["trip_id"],
        note: "One row per completed trip. `rating_given` is the 1–5 star rating the rider gave the driver, or NULL if they skipped it.",
      },
    ],
    examples: [
      {
        RiderTrip: [
          [1, 1, 50, "2024-04-01", 5],
          [2, 1, 51, "2024-04-03", 5],
          [3, 1, 52, "2024-04-07", 5],
          [4, 2, 50, "2024-04-02", 5],
          [5, 2, 53, "2024-04-04", null],
          [6, 2, 54, "2024-04-05", 5],
          [7, 2, 51, "2024-04-09", 5],
          [8, 3, 52, "2024-04-02", 5],
          [9, 3, 50, "2024-04-06", 4],
          [10, 3, 55, "2024-04-08", 5],
          [11, 4, 53, "2024-04-03", 5],
          [12, 4, 54, "2024-04-04", 5],
          [13, 5, 50, "2024-04-05", 5],
          [14, 5, 52, "2024-04-06", 5],
          [15, 5, 51, "2024-04-07", null],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      const riders = ri(rng, 1, 8);
      for (let r = 1; r <= riders; r++) {
        const picky = chance(rng, 0.35);
        for (let k = ri(rng, 1, 5); k > 0; k--) {
          const stars = picky ? pick(rng, [3, 4, 5, 5]) : 5;
          rows.push([id++, r, ri(rng, 50, 60), dateBetween(rng, "2024-04-01", "2024-04-30"), chance(rng, 0.2) ? null : stars]);
        }
      }
      return { RiderTrip: rows };
    },
    solution: [
      "SELECT rider_id, COUNT(rating_given) AS rated_trips",
      "FROM RiderTrip",
      "GROUP BY rider_id",
      "HAVING COUNT(rating_given) >= 3 AND MIN(rating_given) = 5",
    ].join("\n"),
    alternatives: [
      "SELECT rider_id, COUNT(*) AS rated_trips FROM RiderTrip WHERE rating_given IS NOT NULL GROUP BY rider_id HAVING COUNT(*) >= 3 AND SUM(CASE WHEN rating_given <> 5 THEN 1 ELSE 0 END) = 0",
      "SELECT t.rider_id, COUNT(*) AS rated_trips FROM RiderTrip t WHERE t.rating_given IS NOT NULL AND NOT EXISTS (SELECT 1 FROM RiderTrip x WHERE x.rider_id = t.rider_id AND x.rating_given < 5) GROUP BY t.rider_id HAVING COUNT(*) >= 3",
    ],
    hints: [
      "Group by rider; the conditions are about the whole group, so they belong in HAVING.",
      "`COUNT(column)` counts only non-NULL values.",
      "\"Every rating is 5\" is the same as \"the smallest rating is 5\".",
    ],
    editorial: [
      "Both conditions describe a rider's whole history, so the query groups by `rider_id` and tests the groups in `HAVING`.",
      "",
      "Two aggregate facts do the work. `COUNT(rating_given)` counts only the trips that carry a rating — unlike `COUNT(*)`, it skips the NULLs, which is exactly the \"ignored\" rule — so rider 5, with two fives and a skipped rating, has only 2 rated trips and is out. And \"every rating is five\" is the same as \"the minimum rating is five\": `MIN` also skips NULLs, so rider 2's skipped trip does not break the run, while rider 3's single 4 does.",
      "",
      "The first alternative filters out unrated trips in `WHERE` and counts the non-five ratings, requiring zero of them. The second uses `NOT EXISTS` to reject any rider who has a rating below five. All three read the table once (the `NOT EXISTS` version with a lookup per rider), and none depends on row order.",
    ].join("\n"),
  },

  {
    slug: "uber-cities-with-repeat-critical-safety-reports",
    title: "Uber: Cities With Two or More Critical Safety Reports",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation", "Dates"],
    description: [
      "The safety team escalates to a city's operations lead when riders or drivers file repeated critical safety reports there in a month.",
      "",
      "Count the reports with severity **`critical`** filed (by `reported_on`) in **June 2024**, per city of the trip they concern. Return `city` and `critical_reports` for every city with **at least 2** of them, ordered by `critical_reports` descending and then by `city`. Each report counts once, even when two reports concern the same trip.",
    ].join("\n"),
    tables: [
      {
        name: "Trip",
        columns: [
          { name: "trip_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "trip_date", type: "date" },
        ],
        primaryKey: ["trip_id"],
        note: "One row per trip.",
      },
      {
        name: "SafetyReport",
        columns: [
          { name: "report_id", type: "int" },
          { name: "trip_id", type: "int" },
          { name: "severity", type: "enum", values: ["low", "medium", "high", "critical"] },
          { name: "reported_on", type: "date" },
        ],
        primaryKey: ["report_id"],
        note: "One row per safety report; `trip_id` always names an existing trip.",
      },
    ],
    examples: [
      {
        Trip: [
          [1, "Bengaluru", "2024-06-01"],
          [2, "Bengaluru", "2024-06-17"],
          [3, "Mumbai", "2024-06-29"],
          [4, "Mumbai", "2024-06-30"],
          [5, "Delhi", "2024-06-09"],
          [6, "Pune", "2024-06-11"],
        ],
        SafetyReport: [
          [1, 1, "critical", "2024-06-03"],
          [2, 2, "critical", "2024-06-18"],
          [3, 3, "critical", "2024-06-30"],
          [4, 4, "critical", "2024-07-01"],
          [5, 5, "critical", "2024-06-10"],
          [6, 5, "critical", "2024-06-11"],
          [7, 6, "high", "2024-06-12"],
          [8, 6, "high", "2024-06-13"],
          [9, 1, "critical", "2024-06-25"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 2, 14);
      const trips: Cell[][] = seq(1, n).map((id) => [id, pick(rng, UBER_CITIES.slice(0, 4)), dateBetween(rng, "2024-05-25", "2024-06-30")]);
      const m = chance(rng, 0.05) ? 0 : ri(rng, 3, 24);
      const reports: Cell[][] = seq(1, m).map((id) => [
        id,
        ri(rng, 1, n),
        pick(rng, ["critical", "critical", "critical", "high", "medium", "low"]),
        chance(rng, 0.2) ? pick(rng, ["2024-05-31", "2024-06-01", "2024-06-30", "2024-07-01"]) : dateBetween(rng, "2024-05-28", "2024-07-03"),
      ]);
      return { Trip: trips, SafetyReport: reports };
    },
    solution: [
      "SELECT t.city, COUNT(*) AS critical_reports",
      "FROM SafetyReport s",
      "JOIN Trip t ON t.trip_id = s.trip_id",
      "WHERE s.severity = 'critical'",
      "  AND s.reported_on BETWEEN '2024-06-01' AND '2024-06-30'",
      "GROUP BY t.city",
      "HAVING COUNT(*) >= 2",
      "ORDER BY critical_reports DESC, t.city",
    ].join("\n"),
    alternatives: [
      [
        "SELECT city, critical_reports FROM (",
        "  SELECT t.city, SUM(CASE WHEN s.severity = 'critical' AND YEAR(s.reported_on) = 2024 AND MONTH(s.reported_on) = 6 THEN 1 ELSE 0 END) AS critical_reports",
        "  FROM Trip t JOIN SafetyReport s ON s.trip_id = t.trip_id",
        "  GROUP BY t.city",
        ") c WHERE critical_reports >= 2",
        "ORDER BY critical_reports DESC, city",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The city is on the trip, the severity and date are on the report — join them.",
      "Filter to critical June reports before counting.",
      "A threshold on a count goes in HAVING, after GROUP BY.",
    ],
    editorial: [
      "Each report needs its trip's city, so the query joins `SafetyReport` to `Trip` on `trip_id`. Only critical reports filed in June count, which is a row filter in `WHERE`: severity equal to `critical` and `reported_on` between the first and the last day of June. Note the date that matters is the **report's**, not the trip's — Mumbai's trip on 30 June was reported on 1 July and falls outside.",
      "",
      "`GROUP BY t.city` then counts the surviving reports per city, and `HAVING COUNT(*) >= 2` keeps only repeat cities. Because the count is of report rows, two reports on Delhi's one trip count as two, as the statement asks.",
      "",
      "The order is by count descending with the city name as a tie-breaker, which makes the output unique. The alternative counts with a conditional `SUM` over all reports and applies the threshold in an outer query — the same result. Both are one join and one aggregation.",
    ].join("\n"),
  },
  // ──────────────────────────── MEDIUM ────────────────────────────
  {
    slug: "uber-surge-share-by-hour-of-day",
    title: "Uber: Surge Share of Bengaluru Trips by Hour of Day",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Aggregation", "Dates"],
    description: [
      "The marketplace team wants to know at which hours Bengaluru riders most often pay surge pricing, to plan driver incentives for those hours.",
      "",
      "Consider only completed trips in **`Bengaluru`**. For every hour of the day (0–23, from `pickup_at`) that has at least one such trip, return `hour_of_day`, `trips` (the number of trips) and `surge_pct` — the percentage of those trips whose `surge_multiplier` is **greater than 1.0**, rounded to 2 decimal places. Order the rows by `hour_of_day`.",
    ].join("\n"),
    tables: [
      {
        name: "CompletedTrip",
        columns: [
          { name: "trip_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "pickup_at", type: "datetime" },
          { name: "surge_multiplier", type: "decimal" },
        ],
        primaryKey: ["trip_id"],
        note: "One row per completed trip. A `surge_multiplier` of 1.0 means the normal fare; 1.5 means 50% above it.",
      },
    ],
    examples: [
      {
        CompletedTrip: [
          [1, "Bengaluru", "2024-07-01 08:05:00", 1.0],
          [2, "Bengaluru", "2024-07-01 08:40:00", 1.5],
          [3, "Bengaluru", "2024-07-02 08:55:00", 1.2],
          [4, "Bengaluru", "2024-07-02 09:10:00", 1.0],
          [5, "Bengaluru", "2024-07-01 18:20:00", 2.0],
          [6, "Bengaluru", "2024-07-01 18:45:00", 1.8],
          [7, "Bengaluru", "2024-07-02 18:59:00", 1.0],
          [8, "Bengaluru", "2024-07-03 18:30:00", 1.0],
          [9, "Mumbai", "2024-07-01 08:10:00", 2.0],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 28);
      const hours = sample(rng, [0, 7, 8, 9, 13, 17, 18, 19, 22, 23], ri(rng, 2, 5));
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        chance(rng, 0.75) ? "Bengaluru" : pick(rng, ["Mumbai", "Delhi"]),
        at(dateBetween(rng, "2024-07-01", "2024-07-07"), pick(rng, hours) * 60 + ri(rng, 0, 59)),
        pick(rng, [1.0, 1.0, 1.0, 1.2, 1.5, 1.8, 2.3]),
      ]);
      return { CompletedTrip: rows };
    },
    solution: [
      "SELECT HOUR(pickup_at) AS hour_of_day,",
      "       COUNT(*) AS trips,",
      "       ROUND(100 * SUM(CASE WHEN surge_multiplier > 1 THEN 1 ELSE 0 END) / COUNT(*), 2) AS surge_pct",
      "FROM CompletedTrip",
      "WHERE city = 'Bengaluru'",
      "GROUP BY HOUR(pickup_at)",
      "ORDER BY hour_of_day",
    ].join("\n"),
    alternatives: [
      [
        "SELECT h AS hour_of_day, COUNT(*) AS trips, ROUND(AVG(IF(surge_multiplier > 1, 100, 0)), 2) AS surge_pct",
        "FROM (SELECT HOUR(pickup_at) AS h, surge_multiplier FROM CompletedTrip WHERE city = 'Bengaluru') t",
        "GROUP BY h",
        "ORDER BY h",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`HOUR(pickup_at)` turns a timestamp into its hour of the day — group by it.",
      "A share is a conditional count divided by the total count of the group.",
      "Surge means strictly above 1.0; a multiplier of exactly 1.0 is the normal fare.",
      "The average of a 0/100 flag is already a percentage.",
    ],
    editorial: [
      "The grouping key is not a stored column but a value computed from one: `HOUR(pickup_at)` folds every day's trips at, say, 08:xx into the same bucket. After filtering to Bengaluru, `GROUP BY HOUR(pickup_at)` forms one group per hour that has trips, and `COUNT(*)` is the `trips` column.",
      "",
      "The share is a **conditional aggregate**: `SUM(CASE WHEN surge_multiplier > 1 THEN 1 ELSE 0 END)` counts the surged trips in the group; multiplying by 100 before dividing by `COUNT(*)` gives a percentage, and `ROUND(…, 2)` the requested precision. The comparison is strict, so a trip at exactly 1.0 is normal fare. Multiply before dividing, and with `/` (decimal division) — integer division would truncate a third to zero.",
      "",
      "The alternative computes the hour in a derived table and averages a flag that is 100 for a surged trip and 0 otherwise: the mean of that flag is the same percentage. Hours with no Bengaluru trips simply have no group, which is what the statement asks. Both are one scan and one aggregation.",
    ].join("\n"),
  },

  {
    slug: "uber-eats-orders-handed-to-another-courier",
    title: "Uber: Uber Eats Orders Handed to Another Courier",
    difficulty: "MEDIUM",
    topics: ["Window Functions"],
    description: [
      "When an Uber Eats courier drops an order (a flat tyre, a long wait at the restaurant), dispatch reassigns it. The delivery-experience team wants the orders that ended up with a different courier from the one first assigned, because those are the late, cold ones.",
      "",
      "An order's **first courier** is the one on its earliest assignment and its **final courier** the one on its latest (`assigned_at`). Return `order_id`, `first_courier`, `final_courier` and `assignments` (the number of assignment rows of the order) for every order whose final courier is **different** from its first courier. An order that went away and came back to its first courier is not in the answer. Order by `order_id`.",
    ].join("\n"),
    tables: [
      {
        name: "CourierAssignment",
        columns: [
          { name: "assignment_id", type: "int" },
          { name: "order_id", type: "int" },
          { name: "courier_id", type: "int" },
          { name: "assigned_at", type: "datetime" },
        ],
        primaryKey: ["assignment_id"],
        note: "One row each time dispatch gave an order to a courier. No order has two assignments at the same second.",
      },
    ],
    examples: [
      {
        CourierAssignment: [
          [1, 5001, 71, "2024-10-04 19:00:00"],
          [2, 5002, 72, "2024-10-04 19:02:00"],
          [3, 5001, 73, "2024-10-04 19:09:00"],
          [4, 5003, 74, "2024-10-04 19:05:00"],
          [5, 5003, 75, "2024-10-04 19:12:00"],
          [6, 5003, 74, "2024-10-04 19:20:00"],
          [7, 5004, 76, "2024-10-04 19:15:00"],
          [8, 5004, 71, "2024-10-04 19:18:00"],
          [9, 5004, 72, "2024-10-04 19:26:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      const orders = chance(rng, 0.05) ? 0 : ri(rng, 2, 9);
      for (let o = 0; o < orders; o++) {
        let t = ri(rng, 1080, 1260);
        for (let k = pick(rng, [1, 1, 2, 2, 3, 4]); k > 0; k--) {
          rows.push([id++, 5001 + o, ri(rng, 71, 76), at("2024-10-04", t)]);
          t += ri(rng, 1, 12);
        }
      }
      return { CourierAssignment: rows };
    },
    solution: [
      "WITH framed AS (",
      "  SELECT order_id,",
      "         FIRST_VALUE(courier_id) OVER (PARTITION BY order_id ORDER BY assigned_at",
      "           ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS first_courier,",
      "         LAST_VALUE(courier_id) OVER (PARTITION BY order_id ORDER BY assigned_at",
      "           ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS final_courier,",
      "         COUNT(*) OVER (PARTITION BY order_id) AS assignments",
      "  FROM CourierAssignment",
      ")",
      "SELECT DISTINCT order_id, first_courier, final_courier, assignments",
      "FROM framed",
      "WHERE first_courier <> final_courier",
      "ORDER BY order_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT b.order_id, f.courier_id AS first_courier, l.courier_id AS final_courier, b.assignments",
        "FROM (SELECT order_id, MIN(assigned_at) AS first_at, MAX(assigned_at) AS last_at, COUNT(*) AS assignments",
        "      FROM CourierAssignment GROUP BY order_id) b",
        "JOIN CourierAssignment f ON f.order_id = b.order_id AND f.assigned_at = b.first_at",
        "JOIN CourierAssignment l ON l.order_id = b.order_id AND l.assigned_at = b.last_at",
        "WHERE f.courier_id <> l.courier_id",
        "ORDER BY b.order_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "You need two values from specific rows of each order — the earliest and the latest assignment.",
      "`FIRST_VALUE` and `LAST_VALUE` read them, but mind the window frame: by default `LAST_VALUE` stops at the current row.",
      "Window functions keep every row; collapse to one row per order afterwards.",
      "Compare the couriers, not the number of assignments — an order can travel and come home.",
    ],
    editorial: [
      "Each order needs two values taken from particular rows: the courier on its earliest assignment and the courier on its latest. `FIRST_VALUE(courier_id)` and `LAST_VALUE(courier_id)` over `PARTITION BY order_id ORDER BY assigned_at` read exactly those, and `COUNT(*) OVER (PARTITION BY order_id)` adds the size of the order's history to every row.",
      "",
      "The frame is the trap. With an `ORDER BY` and no explicit frame, a window runs from the start of the partition **to the current row**, so `LAST_VALUE` would just return the current row's courier. Writing `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` makes every row see the whole order, so all rows of one order carry the same three values, and `SELECT DISTINCT` folds them into one.",
      "",
      "The filter compares couriers, not counts. Order 5003 was assigned three times but ended with courier 74, who also had it first, so it is not a handover; order 5002, assigned once, cannot differ from itself. The alternative finds the first and last times with `MIN`/`MAX` per order and joins back to the two assignment rows — safe because no order has two assignments at the same second. The window version sorts each order once; the join version needs an index on `(order_id, assigned_at)` to stay cheap.",
    ].join("\n"),
  },

  {
    slug: "uber-pickup-eta-accuracy-by-city",
    title: "Uber: Pickup ETA Accuracy by City",
    difficulty: "MEDIUM",
    topics: ["Dates", "Conditional Logic", "Aggregation"],
    description: [
      "When a driver accepts, the rider app quotes a pickup ETA in minutes. The maps team measures how often that promise is kept, city by city.",
      "",
      "A pickup is **on time** when the driver arrived within the quoted ETA **plus a 2-minute grace**, measured in seconds from `accepted_at` to `arrived_at` (arriving exactly at the edge is on time). It is **badly late** when it took **more than** the quoted ETA plus 5 minutes. Ignore requests where the driver never arrived (`arrived_at` NULL).",
      "",
      "For each city return `city`, `pickups`, `on_time_pct` (percentage on time, rounded to 2 decimals) and `badly_late` (a count). Order by `on_time_pct` ascending, then `city`.",
    ].join("\n"),
    tables: [
      {
        name: "Pickup",
        columns: [
          { name: "trip_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "accepted_at", type: "datetime" },
          { name: "quoted_eta_min", type: "int" },
          { name: "arrived_at", type: "datetime" },
        ],
        primaryKey: ["trip_id"],
        note: "One row per accepted request. `arrived_at` is NULL when the trip was cancelled before the driver arrived.",
      },
    ],
    examples: [
      {
        Pickup: [
          [1, "Bengaluru", "2024-07-01 09:00:00", 5, "2024-07-01 09:07:00"],
          [2, "Bengaluru", "2024-07-01 09:10:00", 4, "2024-07-01 09:16:01"],
          [3, "Bengaluru", "2024-07-01 09:20:00", 3, "2024-07-01 09:30:00"],
          [4, "Bengaluru", "2024-07-01 09:40:00", 6, null],
          [5, "Mumbai", "2024-07-01 10:00:00", 8, "2024-07-01 10:05:00"],
          [6, "Mumbai", "2024-07-01 10:10:00", 5, "2024-07-01 10:17:30"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 26);
      const cities = sample(rng, UBER_CITIES, ri(rng, 1, 4));
      const rows: Cell[][] = seq(1, n).map((id) => {
        const day = dateBetween(rng, "2024-07-01", "2024-07-05");
        const acc = ri(rng, 6 * 3600, 22 * 3600);
        const eta = ri(rng, 2, 10);
        const off = chance(rng, 0.3) ? pick(rng, [120, 121, 300, 301]) : roundTo(rng, -180, 540, 30);
        return [id, pick(rng, cities), atS(day, acc), eta, chance(rng, 0.1) ? null : atS(day, acc + Math.max(30, eta * 60 + off))];
      });
      return { Pickup: rows };
    },
    solution: [
      "SELECT city,",
      "       COUNT(*) AS pickups,",
      "       ROUND(100 * SUM(CASE WHEN TIMESTAMPDIFF(SECOND, accepted_at, arrived_at) <= (quoted_eta_min + 2) * 60 THEN 1 ELSE 0 END) / COUNT(*), 2) AS on_time_pct,",
      "       SUM(CASE WHEN TIMESTAMPDIFF(SECOND, accepted_at, arrived_at) > (quoted_eta_min + 5) * 60 THEN 1 ELSE 0 END) AS badly_late",
      "FROM Pickup",
      "WHERE arrived_at IS NOT NULL",
      "GROUP BY city",
      "ORDER BY on_time_pct, city",
    ].join("\n"),
    alternatives: [
      [
        "SELECT city, COUNT(*) AS pickups,",
        "       ROUND(100 * SUM(IF(late_s <= 120, 1, 0)) / COUNT(*), 2) AS on_time_pct,",
        "       SUM(IF(late_s > 300, 1, 0)) AS badly_late",
        "FROM (SELECT city, TIMESTAMPDIFF(SECOND, accepted_at, arrived_at) - quoted_eta_min * 60 AS late_s",
        "      FROM Pickup WHERE arrived_at IS NOT NULL) p",
        "GROUP BY city",
        "ORDER BY on_time_pct, city",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Measure every pickup in seconds — `TIMESTAMPDIFF(SECOND, accepted_at, arrived_at)` — and compare with the ETA converted to seconds.",
      "Each label is a conditional count: `SUM(CASE WHEN … THEN 1 ELSE 0 END)`.",
      "Rows with no arrival should not be in the denominator either; drop them before grouping.",
      "On time uses `<=`, badly late uses `>`.",
    ],
    editorial: [
      "Each pickup is reduced to one number, its actual wait in seconds, `TIMESTAMPDIFF(SECOND, accepted_at, arrived_at)`. Working in seconds avoids a trap: `TIMESTAMPDIFF(MINUTE, …)` truncates, so a driver 7 minutes 59 seconds out would look like 7 minutes. The quoted ETA is converted to seconds too, so the two thresholds are `(quoted_eta_min + 2) * 60` and `(quoted_eta_min + 5) * 60`.",
      "",
      "Requests where the driver never arrived have no wait at all; they are removed in `WHERE` so they count neither as pickups nor in the percentage. Grouping by city, two conditional sums do the labelling: one counts waits at or under the on-time edge (inclusive — trip 1 arrived exactly at 5 + 2 minutes), the other waits strictly over the badly-late edge. The on-time count times 100 divided by `COUNT(*)`, rounded, is the percentage.",
      "",
      "The alternative first computes each pickup's lateness against the quote in a derived table, which makes the thresholds the constants 120 and 300 seconds. Sorting by the percentage with the city as a tie-breaker gives a fixed order. One scan, one aggregation.",
    ].join("\n"),
  },

  {
    slug: "uber-drivers-gone-quiet-before-the-festive-rush",
    title: "Uber: Drivers Gone Quiet Before the Festive Rush",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Dates", "Conditional Logic"],
    description: [
      "Before the festive season the driver-supply team calls drivers who used to drive regularly but have stopped, with a reactivation bonus. The trip log runs up to the report date, **2024-10-15**.",
      "",
      "A driver is **gone quiet** when they had **at least 3 completed trips dated before 2024-09-01** and **no completed trip on or after 2024-09-16** (the last 30 days). Cancelled trips count for nothing either way. Return `driver_id`, `driver_name`, `last_trip_date` (their latest completed trip) and `days_idle` (days from that trip to 2024-10-15), ordered by `days_idle` descending, then `driver_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Driver",
        columns: [
          { name: "driver_id", type: "int" },
          { name: "driver_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["driver_id"],
        note: "One row per driver partner.",
      },
      {
        name: "DriverTrip",
        columns: [
          { name: "trip_id", type: "int" },
          { name: "driver_id", type: "int" },
          { name: "trip_date", type: "date" },
          { name: "status", type: "enum", values: ["completed", "cancelled"] },
        ],
        primaryKey: ["trip_id"],
        note: "One row per trip a driver accepted; no row is dated after 2024-10-15.",
      },
    ],
    examples: [
      {
        Driver: [
          [1, "Aarav", "Pune"],
          [2, "Diya", "Pune"],
          [3, "Kabir", "Mumbai"],
          [4, "Meera", "Pune"],
          [5, "Rohan", "Mumbai"],
        ],
        DriverTrip: [
          [1, 1, "2024-07-02", "completed"],
          [2, 1, "2024-07-19", "completed"],
          [3, 1, "2024-08-31", "completed"],
          [4, 1, "2024-09-10", "completed"],
          [5, 1, "2024-10-01", "cancelled"],
          [6, 2, "2024-08-01", "completed"],
          [7, 2, "2024-08-02", "completed"],
          [8, 2, "2024-08-03", "completed"],
          [9, 2, "2024-09-16", "completed"],
          [10, 3, "2024-06-11", "completed"],
          [11, 3, "2024-07-14", "completed"],
          [12, 3, "2024-08-20", "cancelled"],
          [13, 3, "2024-09-01", "completed"],
          [14, 4, "2024-05-05", "completed"],
          [15, 4, "2024-06-06", "completed"],
          [16, 4, "2024-07-07", "completed"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 2, 8);
      const who = names(rng, n);
      const drivers: Cell[][] = seq(1, n).map((id, i) => [id, who[i]!, pick(rng, UBER_CITIES)]);
      const trips: Cell[][] = [];
      let tid = 1;
      if (!chance(rng, 0.05)) {
        for (let d = 1; d <= n; d++) {
          for (let k = pick(rng, [1, 2, 3, 3, 4, 5]); k > 0; k--) trips.push([tid++, d, chance(rng, 0.15) ? pick(rng, ["2024-08-31", "2024-09-01"]) : dateBetween(rng, "2024-05-01", "2024-09-10"), chance(rng, 0.85) ? "completed" : "cancelled"]);
          if (chance(rng, 0.4)) trips.push([tid++, d, chance(rng, 0.3) ? pick(rng, ["2024-09-15", "2024-09-16"]) : dateBetween(rng, "2024-09-11", "2024-10-15"), pick(rng, ["completed", "completed", "cancelled"])]);
        }
      }
      return { Driver: drivers, DriverTrip: trips };
    },
    solution: [
      "SELECT d.driver_id, d.driver_name, MAX(t.trip_date) AS last_trip_date,",
      "       DATEDIFF('2024-10-15', MAX(t.trip_date)) AS days_idle",
      "FROM Driver d",
      "JOIN DriverTrip t ON t.driver_id = d.driver_id AND t.status = 'completed'",
      "GROUP BY d.driver_id, d.driver_name",
      "HAVING SUM(CASE WHEN t.trip_date < '2024-09-01' THEN 1 ELSE 0 END) >= 3",
      "   AND MAX(t.trip_date) < '2024-09-16'",
      "ORDER BY days_idle DESC, d.driver_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT d.driver_id, d.driver_name, x.last_trip_date, DATEDIFF('2024-10-15', x.last_trip_date) AS days_idle",
        "FROM Driver d",
        "JOIN (SELECT driver_id, MAX(trip_date) AS last_trip_date FROM DriverTrip WHERE status = 'completed' GROUP BY driver_id) x",
        "  ON x.driver_id = d.driver_id",
        "WHERE (SELECT COUNT(*) FROM DriverTrip e WHERE e.driver_id = d.driver_id AND e.status = 'completed' AND e.trip_date < '2024-09-01') >= 3",
        "  AND NOT EXISTS (SELECT 1 FROM DriverTrip r WHERE r.driver_id = d.driver_id AND r.status = 'completed' AND r.trip_date >= '2024-09-16')",
        "ORDER BY days_idle DESC, d.driver_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Two conditions on a driver's whole history: enough activity before one date, none after another.",
      "Keep only completed trips, then group by driver.",
      "\"No completed trip on or after 2024-09-16\" is the same as \"the latest completed trip is before 2024-09-16\".",
      "Count the early trips with a conditional SUM inside HAVING.",
    ],
    editorial: [
      "A dormant account is defined by two facts about the **same** history: it was active before a cut-off, and it has been silent recently. Both are aggregates over a driver's completed trips, so the query filters to completed trips in the join, groups by driver, and tests both in `HAVING`.",
      "",
      "\"At least 3 completed trips before 2024-09-01\" is a conditional count, `SUM(CASE WHEN trip_date < '2024-09-01' THEN 1 ELSE 0 END) >= 3`. \"No completed trip on or after 2024-09-16\" needs no second count: it is equivalent to the latest completed trip being earlier than that day, `MAX(trip_date) < '2024-09-16'`. The same `MAX` is the `last_trip_date`, and `DATEDIFF('2024-10-15', …)` turns it into days idle.",
      "",
      "The edges in the example: Aarav's 31 August trip counts as early, his 10 September trip is inside the gap but before the silent window, and his October trip was cancelled — he is quiet, idle 35 days. Diya drove on 16 September, the first day of the window, so she is active. Kabir has only two early completed trips (1 September is not before the cut-off, and the August trip was cancelled). Drivers with no completed trip never form a group.",
      "",
      "The alternative states each condition separately — a correlated count of early trips and a `NOT EXISTS` for recent ones — over a derived table of last trip dates. The aggregate version reads each driver's trips once.",
    ].join("\n"),
  },

  {
    slug: "uber-promo-abuse-on-shared-devices",
    title: "Uber: Promo Abuse — One Device, Many Accounts, Same Campaign",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation"],
    description: [
      "New-rider promos can be farmed by creating several accounts on one phone. The fraud team flags a phone when several accounts registered on it redeemed the same campaign.",
      "",
      "Return every pair of `device_id` and `campaign` for which **3 or more different rider accounts** on that device redeemed that campaign, with the number of such accounts as `accounts`. An account that redeemed the same campaign twice counts once. Order by `accounts` descending, then `device_id`, then `campaign`.",
    ].join("\n"),
    tables: [
      {
        name: "RiderAccount",
        columns: [
          { name: "rider_id", type: "int" },
          { name: "device_id", type: "varchar" },
          { name: "signed_up_on", type: "date" },
        ],
        primaryKey: ["rider_id"],
        note: "One row per rider account, with the device it was registered on.",
      },
      {
        name: "Redemption",
        columns: [
          { name: "redemption_id", type: "int" },
          { name: "rider_id", type: "int" },
          { name: "campaign", type: "varchar" },
          { name: "redeemed_on", type: "date" },
        ],
        primaryKey: ["redemption_id"],
        note: "One row per promo redemption; `rider_id` always names an account.",
      },
    ],
    examples: [
      {
        RiderAccount: [
          [1, "dev-a1f0", "2024-03-01"],
          [2, "dev-a1f0", "2024-03-02"],
          [3, "dev-a1f0", "2024-03-02"],
          [4, "dev-b27c", "2024-03-05"],
          [5, "dev-b27c", "2024-03-06"],
          [6, "dev-c3d9", "2024-03-07"],
          [7, "dev-b27c", "2024-03-09"],
        ],
        Redemption: [
          [1, 1, "FIRSTRIDE", "2024-03-01"],
          [2, 2, "FIRSTRIDE", "2024-03-02"],
          [3, 3, "FIRSTRIDE", "2024-03-03"],
          [4, 3, "FIRSTRIDE", "2024-03-10"],
          [5, 1, "WEEKEND20", "2024-03-09"],
          [6, 2, "WEEKEND20", "2024-03-09"],
          [7, 4, "FIRSTRIDE", "2024-03-05"],
          [8, 5, "FIRSTRIDE", "2024-03-06"],
          [9, 6, "FIRSTRIDE", "2024-03-07"],
          [10, 7, "FIRSTRIDE", "2024-03-09"],
        ],
      },
    ],
    gen: (rng) => {
      const devices = seq(0, ri(rng, 2, 5)).map(() => `dev-${ri(rng, 4096, 65535).toString(16)}`);
      const uniq = [...new Set(devices)];
      const n = ri(rng, 3, 14);
      const accounts: Cell[][] = seq(1, n).map((id) => [id, chance(rng, 0.5) ? uniq[0]! : pick(rng, uniq), dateBetween(rng, "2024-03-01", "2024-03-20")]);
      const campaigns = sample(rng, ["FIRSTRIDE", "WEEKEND20", "EATS100", "NIGHT20"], ri(rng, 1, 3));
      const m = chance(rng, 0.05) ? 0 : ri(rng, 4, 28);
      const red: Cell[][] = seq(1, m).map((id) => [id, ri(rng, 1, n), pick(rng, campaigns), dateBetween(rng, "2024-03-01", "2024-03-31")]);
      return { RiderAccount: accounts, Redemption: red };
    },
    solution: [
      "SELECT a.device_id, r.campaign, COUNT(DISTINCT r.rider_id) AS accounts",
      "FROM Redemption r",
      "JOIN RiderAccount a ON a.rider_id = r.rider_id",
      "GROUP BY a.device_id, r.campaign",
      "HAVING COUNT(DISTINCT r.rider_id) >= 3",
      "ORDER BY accounts DESC, a.device_id, r.campaign",
    ].join("\n"),
    alternatives: [
      [
        "SELECT device_id, campaign, COUNT(*) AS accounts",
        "FROM (SELECT DISTINCT a.device_id, r.campaign, r.rider_id",
        "      FROM Redemption r JOIN RiderAccount a ON a.rider_id = r.rider_id) x",
        "GROUP BY device_id, campaign",
        "HAVING COUNT(*) >= 3",
        "ORDER BY accounts DESC, device_id, campaign",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The device is on the account, the campaign on the redemption — join them first.",
      "Group by the pair (device, campaign).",
      "Count accounts, not redemptions: `COUNT(DISTINCT …)`.",
    ],
    editorial: [
      "The signal combines facts from two tables — the campaign from `Redemption`, the device from `RiderAccount` — so the query joins them on `rider_id`. Each joined row says \"this account on this device redeemed this campaign once\".",
      "",
      "The unit being judged is a **(device, campaign) pair**, so that is the `GROUP BY`. Within a group, the number that matters is how many different accounts took part, not how many redemptions there were: rider 3 redeeming FIRSTRIDE twice is still one account. `COUNT(DISTINCT r.rider_id)` counts accounts, and `HAVING` keeps groups with at least three. A plain `COUNT(*)` would wrongly flag a device where two accounts redeemed four times.",
      "",
      "The alternative removes duplicate (device, campaign, account) triples with `SELECT DISTINCT` in a derived table and then counts rows — the same thing in two steps. Three sort keys (accounts, device, campaign) make the order total, since two pairs can tie on the count. The cost is one join and one aggregation.",
    ].join("\n"),
  },

  {
    slug: "uber-airport-queue-position-on-arrival",
    title: "Uber: Airport Queue Position When Each Driver Arrived",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Joins", "Dates"],
    description: [
      "The airport app tells a driver their place in the queue the moment they enter the holding lot. The operations team wants to rebuild that number from the queue log to audit it.",
      "",
      "A driver's `queue_position` on arrival is **1 plus the number of drivers at the same airport who joined earlier and were still waiting** at that moment — that is, whose `left_at` is **after** this driver's `joined_at` (a driver leaving at the very same second is already gone). Return `entry_id`, `driver_id` and `queue_position` for every entry, ordered by `entry_id`.",
    ].join("\n"),
    tables: [
      {
        name: "QueueEntry",
        columns: [
          { name: "entry_id", type: "int" },
          { name: "driver_id", type: "int" },
          { name: "airport", type: "varchar" },
          { name: "joined_at", type: "datetime" },
          { name: "left_at", type: "datetime" },
        ],
        primaryKey: ["entry_id"],
        note: "One row per time a driver entered an airport queue; `left_at` is when they were dispatched or gave up, always after `joined_at`. No two entries at the same airport share a `joined_at`.",
      },
    ],
    examples: [
      {
        QueueEntry: [
          [1, 21, "BLR", "2024-08-01 05:00:00", "2024-08-01 05:40:00"],
          [2, 22, "BLR", "2024-08-01 05:10:00", "2024-08-01 05:30:00"],
          [3, 23, "BLR", "2024-08-01 05:20:00", "2024-08-01 06:10:00"],
          [4, 24, "BLR", "2024-08-01 05:30:00", "2024-08-01 05:50:00"],
          [5, 25, "BLR", "2024-08-01 06:00:00", "2024-08-01 06:20:00"],
          [6, 31, "DEL", "2024-08-01 05:15:00", "2024-08-01 05:45:00"],
        ],
      },
    ],
    gen: (rng) => {
      const airports = sample(rng, ["BLR", "DEL", "BOM"], ri(rng, 1, 2));
      const rows: Cell[][] = [];
      let id = 1;
      for (const ap of airports) {
        const starts = sample(rng, seq(0, 49).map((x) => x * 5), ri(rng, 1, 12));
        for (const s of starts) rows.push([id++, ri(rng, 20, 60), ap, at("2024-08-01", 300 + s), at("2024-08-01", 300 + s + roundTo(rng, 5, 90, 5))]);
      }
      return { QueueEntry: rows };
    },
    solution: [
      "SELECT q.entry_id, q.driver_id,",
      "       1 + (SELECT COUNT(*) FROM QueueEntry o",
      "            WHERE o.airport = q.airport",
      "              AND o.joined_at < q.joined_at",
      "              AND o.left_at > q.joined_at) AS queue_position",
      "FROM QueueEntry q",
      "ORDER BY q.entry_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT q.entry_id, q.driver_id, 1 + COUNT(o.entry_id) AS queue_position",
        "FROM QueueEntry q",
        "LEFT JOIN QueueEntry o",
        "  ON o.airport = q.airport AND o.joined_at < q.joined_at AND o.left_at > q.joined_at",
        "GROUP BY q.entry_id, q.driver_id",
        "ORDER BY q.entry_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "For each entry you need to count other rows of the same table that satisfy a condition relative to it.",
      "\"Still waiting at time T\" means joined before T and left after T.",
      "A correlated subquery, or a LEFT self join with GROUP BY, both work — make sure the first driver gets position 1, not 0.",
    ],
    editorial: [
      "The position depends on the **state of the queue at one instant**, the moment this driver joined. A driver `o` is ahead in the queue at that instant if they joined earlier (`o.joined_at < q.joined_at`) and had not yet left (`o.left_at > q.joined_at`), at the same airport. Counting those drivers and adding one gives the position.",
      "",
      "The solution does the count in a correlated scalar subquery, evaluated once per entry. `COUNT(*)` over no rows is 0, so a driver who arrives to an empty lot is position 1. The strict `>` on `left_at` implements the rule that a driver dispatched at the very second another arrives is already gone — in the example, driver 22 left at 05:30, exactly when driver 24 joined, so driver 24 is third, behind 21 and 23, not fourth.",
      "",
      "The alternative is a `LEFT JOIN` of the table to itself on the same condition, grouped per entry: `COUNT(o.entry_id)` counts only real matches, never the NULL row an unmatched entry keeps. Both are quadratic in the entries of one airport, which is fine for a day's log; an index on `(airport, joined_at)` narrows each lookup.",
    ].join("\n"),
  },

  {
    slug: "uber-rider-referrals-that-qualified",
    title: "Uber: Rider Referrals That Qualified for the Bonus",
    difficulty: "MEDIUM",
    topics: ["Joins", "Subqueries", "Dates"],
    description: [
      "Under the rider referral programme a rider earns ₹100 for each friend they invited who **completed a trip within 14 days of signing up** — a trip on the sign-up day itself counts, and so does one exactly 14 days later. Cancelled trips never count, and a friend with several qualifying trips earns the bonus once.",
      "",
      "Return `referrer_id`, `referrer_name`, `qualified` (the number of friends who qualified) and `bonus` (100 × `qualified`) for every rider with at least one qualified referral, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Rider",
        columns: [
          { name: "rider_id", type: "int" },
          { name: "rider_name", type: "varchar" },
          { name: "signed_up_on", type: "date" },
          { name: "referred_by", type: "int" },
        ],
        primaryKey: ["rider_id"],
        note: "`referred_by` is the `rider_id` of the rider whose invite they used, or NULL.",
      },
      {
        name: "Trip",
        columns: [
          { name: "trip_id", type: "int" },
          { name: "rider_id", type: "int" },
          { name: "trip_date", type: "date" },
          { name: "status", type: "enum", values: ["completed", "cancelled"] },
        ],
        primaryKey: ["trip_id"],
        note: "One row per trip. A trip is never dated before its rider signed up.",
      },
    ],
    examples: [
      {
        Rider: [
          [1, "Aarav", "2024-01-05", null],
          [2, "Diya", "2024-02-01", null],
          [3, "Kabir", "2024-03-01", 1],
          [4, "Meera", "2024-03-03", 1],
          [5, "Rohan", "2024-03-10", 2],
          [6, "Zara", "2024-03-12", 2],
          [7, "Ishaan", "2024-03-15", 3],
        ],
        Trip: [
          [101, 3, "2024-03-15", "completed"],
          [102, 4, "2024-03-17", "completed"],
          [103, 4, "2024-03-10", "cancelled"],
          [104, 5, "2024-03-10", "completed"],
          [105, 5, "2024-03-11", "completed"],
          [106, 6, "2024-03-20", "cancelled"],
          [107, 7, "2024-03-20", "completed"],
          [108, 6, "2024-03-27", "completed"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 3, 12);
      const who = names(rng, n);
      const riders: Cell[][] = seq(1, n).map((id, i) => [id, who[i]!, dateBetween(rng, "2024-03-01", "2024-03-20"), id > 1 && chance(rng, 0.7) ? ri(rng, 1, id - 1) : null]);
      const m = chance(rng, 0.05) ? 0 : ri(rng, 3, 22);
      const trips: Cell[][] = seq(101, m).map((id) => {
        const r = ri(rng, 1, n);
        const off = chance(rng, 0.3) ? pick(rng, [0, 14, 15]) : ri(rng, 0, 22);
        return [id, r, addDays(riders[r - 1]![2] as string, off), pick(rng, ["completed", "completed", "cancelled"])];
      });
      return { Rider: riders, Trip: trips };
    },
    solution: [
      "SELECT r.rider_id AS referrer_id, r.rider_name AS referrer_name,",
      "       COUNT(*) AS qualified, 100 * COUNT(*) AS bonus",
      "FROM Rider r",
      "JOIN Rider f ON f.referred_by = r.rider_id",
      "WHERE EXISTS (",
      "  SELECT 1 FROM Trip t",
      "  WHERE t.rider_id = f.rider_id",
      "    AND t.status = 'completed'",
      "    AND DATEDIFF(t.trip_date, f.signed_up_on) <= 14",
      ")",
      "GROUP BY r.rider_id, r.rider_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT r.rider_id AS referrer_id, r.rider_name AS referrer_name,",
        "       COUNT(DISTINCT f.rider_id) AS qualified, 100 * COUNT(DISTINCT f.rider_id) AS bonus",
        "FROM Rider r",
        "JOIN Rider f ON f.referred_by = r.rider_id",
        "JOIN Trip t ON t.rider_id = f.rider_id AND t.status = 'completed'",
        "           AND t.trip_date <= DATE_ADD(f.signed_up_on, INTERVAL 14 DAY)",
        "GROUP BY r.rider_id, r.rider_name",
      ].join("\n"),
    ],
    hints: [
      "The referrer and the friend are both rows of `Rider` — a self join on `referred_by`.",
      "A friend qualifies if **some** completed trip falls in the window — EXISTS, or a join with DISTINCT.",
      "`DATEDIFF(trip_date, signed_up_on) <= 14` includes day 14.",
    ],
    editorial: [
      "Referrer and friend live in the same table, linked by `referred_by`, so the query self-joins `Rider`: `r` is the referrer, `f` each friend they brought in. Riders who referred nobody never join and so never appear.",
      "",
      "A friend qualifies when **at least one** of their trips is completed and dated within 14 days of their sign-up. `EXISTS` expresses \"at least one\" exactly and counts each friend once however many trips they took — Rohan's two early trips earn Diya one bonus. `DATEDIFF(t.trip_date, f.signed_up_on) <= 14` puts both edges in: a trip on the sign-up day gives 0, one fourteen days later gives 14 (Meera), and fifteen days (Zara's completed trip) is too late. Cancelled trips are excluded by the status test.",
      "",
      "After the filter each surviving row is one qualified friend, so `COUNT(*)` per referrer is `qualified` and the bonus is a multiple of it. The alternative joins the trips directly and uses `COUNT(DISTINCT f.rider_id)` to undo the duplication the join introduces. With indexes on `referred_by` and `Trip.rider_id` both run in roughly linear time.",
    ].join("\n"),
  },

  {
    slug: "uber-pro-leaderboard-around-driver-107",
    title: "Uber: Uber Pro Leaderboard Around Driver 107 in Pune",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "The Uber Pro screen does not show a driver the whole city leaderboard — only the drivers just above and just below them, which is more motivating. Build that view for driver **107** in **Pune**.",
      "",
      "A driver's score is the sum of their `points` from Pune rows of `ProPoints`; drivers with no Pune rows are not on the board. Rank by points **descending**, ties broken by the **smaller `driver_id`**, so every rank is distinct (1, 2, 3, …). Return `leaderboard_rank`, `driver_id` and `points` for every driver whose rank is **within 2** of driver 107's (driver 107 included), ordered by `leaderboard_rank`. If driver 107 has no Pune points, return no rows.",
    ].join("\n"),
    tables: [
      {
        name: "ProPoints",
        columns: [
          { name: "event_id", type: "int" },
          { name: "driver_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "earned_on", type: "date" },
          { name: "points", type: "int" },
        ],
        primaryKey: ["event_id"],
        note: "One row per points award this season (a completed trip, a peak-hour bonus, a five-star rating).",
      },
    ],
    examples: [
      {
        ProPoints: [
          [1, 101, "Pune", "2024-10-01", 120],
          [2, 102, "Pune", "2024-10-01", 90],
          [3, 103, "Pune", "2024-10-02", 75],
          [4, 104, "Pune", "2024-10-02", 60],
          [5, 104, "Pune", "2024-10-03", 15],
          [6, 105, "Pune", "2024-10-03", 70],
          [7, 107, "Pune", "2024-10-04", 50],
          [8, 107, "Pune", "2024-10-05", 20],
          [9, 106, "Pune", "2024-10-05", 40],
          [10, 108, "Pune", "2024-10-06", 10],
          [11, 109, "Mumbai", "2024-10-06", 72],
          [12, 107, "Mumbai", "2024-10-07", 500],
        ],
      },
    ],
    gen: (rng) => {
      const drivers = sample(rng, seq(101, 12), ri(rng, 2, 9));
      if (chance(rng, 0.9) && !drivers.includes(107)) drivers.push(107);
      const n = ri(rng, drivers.length, 26);
      const rows: Cell[][] = seq(1, n).map((id, i) => [
        id,
        i < drivers.length ? drivers[i]! : pick(rng, drivers),
        chance(rng, 0.85) ? "Pune" : "Mumbai",
        dateBetween(rng, "2024-10-01", "2024-10-20"),
        roundTo(rng, 5, 60, 5),
      ]);
      return { ProPoints: rows };
    },
    solution: [
      "WITH board AS (",
      "  SELECT driver_id, SUM(points) AS points,",
      "         ROW_NUMBER() OVER (ORDER BY SUM(points) DESC, driver_id) AS leaderboard_rank",
      "  FROM ProPoints",
      "  WHERE city = 'Pune'",
      "  GROUP BY driver_id",
      ")",
      "SELECT b.leaderboard_rank, b.driver_id, b.points",
      "FROM board b",
      "JOIN board me ON me.driver_id = 107",
      "WHERE b.leaderboard_rank + 2 >= me.leaderboard_rank",
      "  AND b.leaderboard_rank <= me.leaderboard_rank + 2",
      "ORDER BY b.leaderboard_rank",
    ].join("\n"),
    alternatives: [
      [
        "WITH totals AS (",
        "  SELECT driver_id, SUM(points) AS points FROM ProPoints WHERE city = 'Pune' GROUP BY driver_id",
        "), board AS (",
        "  SELECT t.driver_id, t.points,",
        "         1 + (SELECT COUNT(*) FROM totals o",
        "              WHERE o.points > t.points OR (o.points = t.points AND o.driver_id < t.driver_id)) AS leaderboard_rank",
        "  FROM totals t",
        ")",
        "SELECT leaderboard_rank, driver_id, points",
        "FROM board",
        "WHERE ABS(leaderboard_rank - (SELECT leaderboard_rank FROM board WHERE driver_id = 107)) <= 2",
        "ORDER BY leaderboard_rank",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First build the whole Pune leaderboard: total points per driver, then a rank.",
      "Ties are broken by `driver_id`, so the rank never repeats — `ROW_NUMBER()` with two sort keys.",
      "Find driver 107's rank, then keep ranks from 2 above to 2 below it.",
      "Near the top of the board there may be fewer than two drivers above — the window just gets shorter.",
    ],
    editorial: [
      "The task is a **window around one entity**: rank everyone, locate the entity's rank, keep the neighbouring ranks. Ranking needs the whole board, so the filter on driver 107 must come *after* the ranking — filtering first would leave 107 alone at rank 1.",
      "",
      "The `board` CTE totals Pune points per driver and ranks them in the same step: a window function may order by an aggregate, so `ROW_NUMBER() OVER (ORDER BY SUM(points) DESC, driver_id)` ranks the grouped rows. Mumbai rows are filtered out before grouping, so driver 107's 500 Mumbai points do not lift them in Pune. In the example, 103 and 104 both have 75 points and the smaller id, 103, ranks third; 105 and 107 both have 70, so 105 is fifth and 107 sixth. The answer is ranks 4 to 8.",
      "",
      "Joining the board to driver 107's own row (`me`) puts 107's rank on every row, and the neighbours are the ranks between `me − 2` and `me + 2`. The condition is written as `b.leaderboard_rank + 2 >= me.leaderboard_rank` rather than `>= me.leaderboard_rank - 2`: MySQL's `ROW_NUMBER()` is unsigned, and subtracting 2 from rank 1 would overflow. If 107 has no Pune points the join finds no `me` row and the result is empty.",
      "",
      "The alternative ranks with a correlated count (drivers with more points, or equal points and a smaller id) and compares distances with `ABS` — safe there because the counted rank is signed. Both read the points once; the window version sorts the board once.",
    ].join("\n"),
  },

  {
    slug: "uber-x-share-match-rate-by-city",
    title: "Uber: UberX Share Requests Matched With a Co-Rider",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation", "Conditional Logic"],
    description: [
      "UberX Share puts riders going the same way in one car. Each request is assigned a `shared_trip_id` when it is dispatched; a request is **matched** only if at least one **other** request was assigned the same shared trip. A request with a NULL `shared_trip_id` was never dispatched and is unmatched.",
      "",
      "For each city return `city`, `requests` (all Share requests), `matched` and `match_pct` (matched as a percentage of requests, rounded to 2 decimals). Order by `match_pct` descending, then `city`.",
    ].join("\n"),
    tables: [
      {
        name: "ShareRequest",
        columns: [
          { name: "request_id", type: "int" },
          { name: "rider_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "requested_at", type: "datetime" },
          { name: "shared_trip_id", type: "int" },
        ],
        primaryKey: ["request_id"],
        note: "One row per UberX Share request. All requests on one shared trip are in the same city.",
      },
    ],
    examples: [
      {
        ShareRequest: [
          [1, 101, "Bengaluru", "2024-09-02 08:01:00", 900],
          [2, 102, "Bengaluru", "2024-09-02 08:03:00", 900],
          [3, 103, "Bengaluru", "2024-09-02 08:10:00", 901],
          [4, 104, "Bengaluru", "2024-09-02 08:12:00", null],
          [5, 105, "Pune", "2024-09-02 09:00:00", 902],
          [6, 106, "Pune", "2024-09-02 09:02:00", 902],
          [7, 107, "Pune", "2024-09-02 09:04:00", 902],
          [8, 108, "Pune", "2024-09-02 09:30:00", null],
          [9, 109, "Delhi", "2024-09-02 10:00:00", null],
        ],
      },
    ],
    gen: (rng) => {
      const cities = sample(rng, UBER_CITIES, ri(rng, 1, 3));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 28);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const ci = ri(rng, 0, cities.length - 1);
        return [id, 100 + id, cities[ci]!, at("2024-09-02", ri(rng, 420, 1260)), chance(rng, 0.25) ? null : 900 + ci * 10 + ri(rng, 0, 4)];
      });
      return { ShareRequest: rows };
    },
    solution: [
      "WITH trip_size AS (",
      "  SELECT shared_trip_id, COUNT(*) AS riders",
      "  FROM ShareRequest",
      "  WHERE shared_trip_id IS NOT NULL",
      "  GROUP BY shared_trip_id",
      ")",
      "SELECT r.city,",
      "       COUNT(*) AS requests,",
      "       SUM(CASE WHEN s.riders >= 2 THEN 1 ELSE 0 END) AS matched,",
      "       ROUND(100 * SUM(CASE WHEN s.riders >= 2 THEN 1 ELSE 0 END) / COUNT(*), 2) AS match_pct",
      "FROM ShareRequest r",
      "LEFT JOIN trip_size s ON s.shared_trip_id = r.shared_trip_id",
      "GROUP BY r.city",
      "ORDER BY match_pct DESC, r.city",
    ].join("\n"),
    alternatives: [
      [
        "SELECT city, COUNT(*) AS requests, SUM(is_matched) AS matched, ROUND(100 * SUM(is_matched) / COUNT(*), 2) AS match_pct",
        "FROM (SELECT city, IF(COUNT(shared_trip_id) OVER (PARTITION BY shared_trip_id) >= 2, 1, 0) AS is_matched FROM ShareRequest) x",
        "GROUP BY city",
        "ORDER BY match_pct DESC, city",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Whether a request is matched depends on the other rows with the same `shared_trip_id`.",
      "Count requests per shared trip first; a trip with 2 or more requests means every one of them matched.",
      "NULL never equals NULL — undispatched requests must not be treated as one big shared trip.",
    ],
    editorial: [
      "\"Matched\" is a property of a request that depends on **other** rows: request 1 is matched because request 2 has the same `shared_trip_id`. So the solution first measures every shared trip — `COUNT(*)` per `shared_trip_id` in a CTE — and then labels each request by the size of its trip.",
      "",
      "Undispatched requests deserve care. If they were grouped, all the NULL `shared_trip_id`s of a city would form one group and look like a crowded shared ride. The CTE excludes them, and the `LEFT JOIN` cannot match them anyway (NULL equals nothing), so they keep a NULL size and fall into the `ELSE 0` branch. Request 3, alone on trip 901, has size 1 and is unmatched too.",
      "",
      "Per city, `COUNT(*)` counts every request and the conditional sum the matched ones; the percentage is rounded to two places. The alternative computes the trip size with a window, `COUNT(shared_trip_id) OVER (PARTITION BY shared_trip_id)` — counting the column rather than `*` makes it 0 for the NULL partition. Both are linear after the grouping.",
    ].join("\n"),
  },

  {
    slug: "uber-back-to-back-trips-from-drop-zone",
    title: "Uber: Back-to-Back Trips Starting in the Last Drop Zone",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates", "Conditional Logic"],
    description: [
      "Dispatch tries to give a driver their next trip close to where the last one ended, cutting the empty kilometres. The marketplace team measures how often that works.",
      "",
      "Take each driver's trips in order of `pickup_at`. A trip is **chained** when the driver's **previous** trip dropped off in the zone where this trip picks up, and this pickup came **at most 15 minutes** (900 seconds) after that drop-off. A driver's first trip is never chained. For every driver return `driver_id`, `trips` and `chained_trips`, ordered by `chained_trips` descending, then `driver_id`.",
    ].join("\n"),
    tables: [
      {
        name: "DriverTrip",
        columns: [
          { name: "trip_id", type: "int" },
          { name: "driver_id", type: "int" },
          { name: "pickup_zone", type: "varchar" },
          { name: "drop_zone", type: "varchar" },
          { name: "pickup_at", type: "datetime" },
          { name: "dropoff_at", type: "datetime" },
        ],
        primaryKey: ["trip_id"],
        note: "One row per completed trip. A driver's trips never overlap, so no two of them share a `pickup_at`.",
      },
    ],
    examples: [
      {
        DriverTrip: [
          [1, 1, "Koramangala", "Indiranagar", "2024-09-05 08:00:00", "2024-09-05 08:25:00"],
          [2, 1, "Indiranagar", "MG Road", "2024-09-05 08:35:00", "2024-09-05 08:55:00"],
          [3, 1, "MG Road", "Whitefield", "2024-09-05 09:10:00", "2024-09-05 09:50:00"],
          [4, 1, "HSR Layout", "Koramangala", "2024-09-05 10:00:00", "2024-09-05 10:20:00"],
          [5, 2, "Airport", "Whitefield", "2024-09-05 06:00:00", "2024-09-05 06:50:00"],
          [6, 2, "Whitefield", "Airport", "2024-09-05 07:06:00", "2024-09-05 07:50:00"],
          [7, 3, "MG Road", "HSR Layout", "2024-09-05 11:00:00", "2024-09-05 11:30:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      const drivers = ri(rng, 1, 4);
      for (let d = 1; d <= drivers; d++) {
        let t = ri(rng, 360, 480);
        let zone: string = pick(rng, ZONES);
        for (let k = ri(rng, 1, 6); k > 0; k--) {
          const from = chance(rng, 0.65) ? zone : pick(rng, ZONES);
          const to = pick(rng, ZONES.filter((z) => z !== from));
          const len = ri(rng, 10, 50);
          rows.push([id++, d, from, to, at("2024-09-05", t), at("2024-09-05", t + len)]);
          t += len + pick(rng, [5, 10, 15, 15, 16, 20, 40]);
          zone = to;
        }
      }
      return { DriverTrip: rows };
    },
    solution: [
      "WITH seq AS (",
      "  SELECT driver_id, pickup_zone, pickup_at,",
      "         LAG(drop_zone) OVER (PARTITION BY driver_id ORDER BY pickup_at) AS prev_drop_zone,",
      "         LAG(dropoff_at) OVER (PARTITION BY driver_id ORDER BY pickup_at) AS prev_dropoff_at",
      "  FROM DriverTrip",
      ")",
      "SELECT driver_id, COUNT(*) AS trips,",
      "       SUM(CASE WHEN pickup_zone = prev_drop_zone",
      "                 AND TIMESTAMPDIFF(SECOND, prev_dropoff_at, pickup_at) <= 900 THEN 1 ELSE 0 END) AS chained_trips",
      "FROM seq",
      "GROUP BY driver_id",
      "ORDER BY chained_trips DESC, driver_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT t.driver_id, COUNT(*) AS trips, COUNT(p.trip_id) AS chained_trips",
        "FROM DriverTrip t",
        "LEFT JOIN DriverTrip p",
        "  ON p.driver_id = t.driver_id",
        " AND p.pickup_at < t.pickup_at",
        " AND NOT EXISTS (SELECT 1 FROM DriverTrip m WHERE m.driver_id = t.driver_id AND m.pickup_at > p.pickup_at AND m.pickup_at < t.pickup_at)",
        " AND p.drop_zone = t.pickup_zone",
        " AND t.pickup_at <= DATE_ADD(p.dropoff_at, INTERVAL 15 MINUTE)",
        "GROUP BY t.driver_id",
        "ORDER BY chained_trips DESC, t.driver_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "You need each trip side by side with the same driver's previous trip.",
      "`LAG(column) OVER (PARTITION BY driver_id ORDER BY pickup_at)` fetches the previous trip's values.",
      "Both conditions must hold — same zone **and** a gap of at most 900 seconds.",
      "On a driver's first trip the LAG values are NULL; make sure that row is counted as a trip but not as chained.",
    ],
    editorial: [
      "The rule compares each trip with the **previous** trip of the same driver, which is what `LAG` is for. Partitioned by driver and ordered by `pickup_at`, `LAG(drop_zone)` and `LAG(dropoff_at)` put the last trip's end zone and end time on the current row.",
      "",
      "A trip is chained when both conditions hold: its pickup zone equals the previous drop zone, and `TIMESTAMPDIFF(SECOND, prev_dropoff_at, pickup_at)` is at most 900. The bound is inclusive, so trip 3 — picked up exactly 15 minutes after trip 2 dropped off at MG Road — is chained, while driver 2's second trip, 16 minutes later, is not. Trip 4 is quick but starts in another zone. On a first trip both LAG values are NULL, the comparisons are unknown, and the `CASE` falls to 0; the trip still counts in `COUNT(*)`.",
      "",
      "The alternative finds the previous trip without window functions: a self join on earlier trips of the same driver, with `NOT EXISTS` ruling out any trip in between, plus the zone and time conditions in the `ON` clause; `COUNT(p.trip_id)` then counts the trips that found a chaining predecessor. The window version is one sort per driver; the join version is quadratic, which is why `LAG` is the tool of choice here.",
    ].join("\n"),
  },
  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "uber-fleet-vehicles-on-two-drivers-shifts-at-once",
    title: "Uber: Fleet Vehicles on Two Drivers' Shifts at Once",
    difficulty: "HARD",
    topics: ["Joins", "Dates", "Conditional Logic"],
    description: [
      "Fleet partners rent their cars to Uber drivers shift by shift. A car can only be driven by one person at a time, so two different drivers holding the same car at the same moment means a booking error — or an unregistered driver. The fleet-compliance team pulled the shift log at **2024-10-21 00:00:00** and wants every conflict.",
      "",
      "Ignore `cancelled` shifts. A shift with a NULL `end_at` is still running and counts as lasting until **2024-10-21 00:00:00**. Two shifts **conflict** when they are on the **same vehicle**, belong to **different drivers** and overlap for a positive length of time — a shift ending at the exact moment another starts is not a conflict. Return each conflicting pair once as `plate`, `first_shift` (the smaller `shift_id`), `second_shift` and `overlap_minutes` (whole minutes during which both shifts were running), ordered by `plate`, `first_shift`, `second_shift`.",
    ].join("\n"),
    tables: [
      {
        name: "Vehicle",
        columns: [
          { name: "vehicle_id", type: "int" },
          { name: "plate", type: "varchar" },
        ],
        primaryKey: ["vehicle_id"],
        note: "One row per fleet car; plates are upper-case.",
      },
      {
        name: "VehicleShift",
        columns: [
          { name: "shift_id", type: "int" },
          { name: "vehicle_id", type: "int" },
          { name: "driver_id", type: "int" },
          { name: "start_at", type: "datetime" },
          { name: "end_at", type: "datetime" },
          { name: "status", type: "enum", values: ["completed", "active", "cancelled"] },
        ],
        primaryKey: ["shift_id"],
        note: "One row per shift a driver booked on a car. `end_at` is NULL only for an `active` shift; every shift starts before the log was pulled.",
      },
    ],
    examples: [
      {
        Vehicle: [
          [1, "MH12AB1234"],
          [2, "MH14CD5678"],
          [3, "KA01EF9012"],
        ],
        VehicleShift: [
          [1, 1, 11, "2024-10-20 06:00:00", "2024-10-20 14:00:00", "completed"],
          [2, 1, 12, "2024-10-20 13:30:00", "2024-10-20 21:30:00", "completed"],
          [3, 1, 13, "2024-10-20 21:30:00", null, "active"],
          [4, 1, 14, "2024-10-20 22:00:00", "2024-10-20 23:00:00", "completed"],
          [5, 2, 15, "2024-10-20 08:00:00", "2024-10-20 12:00:00", "completed"],
          [6, 2, 16, "2024-10-20 09:00:00", "2024-10-20 10:00:00", "cancelled"],
          [7, 2, 15, "2024-10-20 11:00:00", "2024-10-20 15:00:00", "completed"],
          [8, 3, 17, "2024-10-20 07:00:00", "2024-10-20 09:00:00", "completed"],
          [9, 3, 18, "2024-10-20 05:00:00", "2024-10-20 10:00:00", "completed"],
        ],
      },
    ],
    gen: (rng) => {
      const plates = sample(rng, ["MH12AB1234", "MH14CD5678", "KA01EF9012", "DL3CAB4321", "TS09XY7766"], ri(rng, 1, 2));
      const vehicles: Cell[][] = plates.map((p, i) => [i + 1, p]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 5, 16);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const start = ri(rng, 0, 44) * 30;
        const end = Math.min(1440, start + ri(rng, 2, 18) * 30);
        const status = pick(rng, ["completed", "completed", "completed", "active", "cancelled"]);
        return [id, ri(rng, 1, vehicles.length), ri(rng, 11, 15), at("2024-10-20", start), status === "active" ? null : at("2024-10-20", end), status];
      });
      return { Vehicle: vehicles, VehicleShift: rows };
    },
    solution: [
      "WITH s AS (",
      "  SELECT shift_id, vehicle_id, driver_id, start_at, COALESCE(end_at, '2024-10-21 00:00:00') AS end_at",
      "  FROM VehicleShift",
      "  WHERE status <> 'cancelled'",
      ")",
      "SELECT v.plate, a.shift_id AS first_shift, b.shift_id AS second_shift,",
      "       TIMESTAMPDIFF(MINUTE, GREATEST(a.start_at, b.start_at), LEAST(a.end_at, b.end_at)) AS overlap_minutes",
      "FROM s a",
      "JOIN s b",
      "  ON b.vehicle_id = a.vehicle_id",
      " AND a.shift_id < b.shift_id",
      " AND a.driver_id <> b.driver_id",
      " AND a.start_at < b.end_at",
      " AND b.start_at < a.end_at",
      "JOIN Vehicle v ON v.vehicle_id = a.vehicle_id",
      "ORDER BY v.plate, first_shift, second_shift",
    ].join("\n"),
    alternatives: [
      [
        "SELECT plate, first_shift, second_shift, TIMESTAMPDIFF(MINUTE, from_at, to_at) AS overlap_minutes FROM (",
        "  SELECT v.plate, a.shift_id AS first_shift, b.shift_id AS second_shift,",
        "         CASE WHEN a.start_at > b.start_at THEN a.start_at ELSE b.start_at END AS from_at,",
        "         CASE WHEN IFNULL(a.end_at, '2024-10-21 00:00:00') < IFNULL(b.end_at, '2024-10-21 00:00:00')",
        "              THEN IFNULL(a.end_at, '2024-10-21 00:00:00') ELSE IFNULL(b.end_at, '2024-10-21 00:00:00') END AS to_at",
        "  FROM VehicleShift a, VehicleShift b, Vehicle v",
        "  WHERE a.vehicle_id = b.vehicle_id AND v.vehicle_id = a.vehicle_id",
        "    AND a.shift_id < b.shift_id AND a.driver_id <> b.driver_id",
        "    AND a.status IN ('completed', 'active') AND b.status IN ('completed', 'active')",
        ") x",
        "WHERE from_at < to_at",
        "ORDER BY plate, first_shift, second_shift",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Compare every shift with every other shift on the same vehicle — a self join.",
      "`a.shift_id < b.shift_id` lists each pair once and never pairs a shift with itself.",
      "Two intervals overlap when each one starts before the other ends; strict comparisons rule out shifts that only touch.",
      "Replace a NULL end with the pull time before comparing, and the overlap runs from the later start to the earlier end.",
    ],
    editorial: [
      "Conflicts are **pairs of rows**, so the table is joined to itself: `a` and `b` are two shifts on the same vehicle. `a.shift_id < b.shift_id` keeps each unordered pair exactly once and puts the smaller id first, as the output asks, and `a.driver_id <> b.driver_id` drops a driver's own double-logged shifts, which do not put a second person in the car.",
      "",
      "Before pairing, a CTE removes cancelled shifts and closes the open ones: `COALESCE(end_at, '2024-10-21 00:00:00')` treats a running shift as lasting until the log was pulled. Shift 3, still active, therefore overlaps shift 4 from 22:00 to 23:00.",
      "",
      "Two intervals overlap exactly when each starts before the other ends: `a.start_at < b.end_at AND b.start_at < a.end_at`. This one test covers every arrangement — partial overlap, one shift inside the other (shifts 8 and 9), either one first — and the strict `<` excludes shifts that only touch, like shift 2 ending at 21:30 and shift 3 starting then. Their shared time runs from the later start to the earlier end, `TIMESTAMPDIFF(MINUTE, GREATEST(starts), LEAST(ends))`.",
      "",
      "The alternative computes the shared interval first with `CASE` expressions and keeps pairs where it has positive length — the overlap test rewritten as `later start < earlier end`. A self join is quadratic per vehicle; an index on `(vehicle_id, start_at)` keeps it to the shifts of one car.",
    ].join("\n"),
  },

  {
    slug: "uber-hourly-supply-gap-requests-vs-drivers",
    title: "Uber: Evening Hours Where Requests Outran Online Drivers",
    difficulty: "HARD",
    topics: ["Subqueries", "Dates", "Aggregation"],
    description: [
      "The supply team plans driver incentives for the hours when demand overwhelms supply. It looks at the evening of **2024-08-09**, the five hour slots starting at 17:00, 18:00, 19:00, 20:00 and 21:00.",
      "",
      "For each city and slot, `requests` is the number of ride requests made in the slot (`requested_at` at or after the slot start and before the next slot), and `drivers_online` is the number of **different drivers** of that city whose shift **overlapped the slot** — online before the slot ended and offline after it began (a shift ending exactly at the slot start, or beginning exactly at its end, does not overlap). Return `city`, `hour_start` (as `'2024-08-09 HH:00:00'`), `requests` and `drivers_online` for every slot with **requests greater than twice** `drivers_online`, ordered by `city`, then `hour_start`.",
    ].join("\n"),
    tables: [
      {
        name: "RideRequest",
        columns: [
          { name: "request_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "requested_at", type: "datetime" },
        ],
        primaryKey: ["request_id"],
        note: "One row per ride request, whatever happened to it.",
      },
      {
        name: "DriverShift",
        columns: [
          { name: "shift_id", type: "int" },
          { name: "driver_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "online_from", type: "datetime" },
          { name: "online_to", type: "datetime" },
        ],
        primaryKey: ["shift_id"],
        note: "One row per stretch of time a driver was online; a driver may have several shifts in a day.",
      },
    ],
    examples: [
      {
        RideRequest: [
          [1, "Bengaluru", "2024-08-09 17:05:00"],
          [2, "Bengaluru", "2024-08-09 17:10:00"],
          [3, "Bengaluru", "2024-08-09 17:20:00"],
          [4, "Bengaluru", "2024-08-09 17:40:00"],
          [5, "Bengaluru", "2024-08-09 17:59:59"],
          [6, "Bengaluru", "2024-08-09 18:10:00"],
          [7, "Bengaluru", "2024-08-09 18:30:00"],
          [8, "Bengaluru", "2024-08-09 21:00:00"],
          [9, "Bengaluru", "2024-08-09 21:30:00"],
          [10, "Bengaluru", "2024-08-09 22:00:00"],
          [11, "Mumbai", "2024-08-09 19:15:00"],
          [12, "Mumbai", "2024-08-09 16:59:00"],
        ],
        DriverShift: [
          [1, 501, "Bengaluru", "2024-08-09 16:00:00", "2024-08-09 17:30:00"],
          [2, 502, "Bengaluru", "2024-08-09 17:00:00", "2024-08-09 18:00:00"],
          [3, 502, "Bengaluru", "2024-08-09 18:30:00", "2024-08-09 19:00:00"],
          [4, 503, "Bengaluru", "2024-08-09 20:00:00", "2024-08-09 21:00:00"],
          [5, 601, "Mumbai", "2024-08-09 16:00:00", "2024-08-09 17:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const cities = sample(rng, ["Bengaluru", "Mumbai", "Delhi"], ri(rng, 1, 3));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 4, 30);
      const req: Cell[][] = seq(1, n).map((id) => [
        id,
        pick(rng, cities),
        chance(rng, 0.06) ? at("2024-08-10", ri(rng, 1020, 1300)) : atS("2024-08-09", chance(rng, 0.2) ? pick(rng, [17, 18, 19, 20, 21, 22]) * 3600 + pick(rng, [-1, 0]) : ri(rng, 16 * 3600 + 1800, 22 * 3600 + 1800)),
      ]);
      const m = ri(rng, 0, 9);
      const shifts: Cell[][] = seq(1, m).map((id) => {
        const from = roundTo(rng, 900, 1290, 10);
        return [id, 500 + ri(rng, 1, 6), pick(rng, cities), at("2024-08-09", from), at("2024-08-09", from + roundTo(rng, 30, 180, 30))];
      });
      return { RideRequest: req, DriverShift: shifts };
    },
    solution: [
      "WITH RECURSIVE slots AS (",
      "  SELECT '2024-08-09 17:00:00' AS hour_start",
      "  UNION ALL",
      "  SELECT DATE_ADD(hour_start, INTERVAL 1 HOUR) FROM slots WHERE hour_start < '2024-08-09 21:00:00'",
      "), demand AS (",
      "  SELECT r.city, s.hour_start, COUNT(*) AS requests",
      "  FROM slots s",
      "  JOIN RideRequest r ON r.requested_at >= s.hour_start AND r.requested_at < DATE_ADD(s.hour_start, INTERVAL 1 HOUR)",
      "  GROUP BY r.city, s.hour_start",
      "), supply AS (",
      "  SELECT d.city, d.hour_start, COUNT(DISTINCT sh.driver_id) AS drivers_online",
      "  FROM demand d",
      "  LEFT JOIN DriverShift sh",
      "    ON sh.city = d.city AND sh.online_from < DATE_ADD(d.hour_start, INTERVAL 1 HOUR) AND sh.online_to > d.hour_start",
      "  GROUP BY d.city, d.hour_start",
      ")",
      "SELECT d.city, d.hour_start, d.requests, s.drivers_online",
      "FROM demand d",
      "JOIN supply s ON s.city = d.city AND s.hour_start = d.hour_start",
      "WHERE d.requests > 2 * s.drivers_online",
      "ORDER BY d.city, d.hour_start",
    ].join("\n"),
    alternatives: [
      [
        "SELECT city, hour_start, requests, drivers_online FROM (",
        "  SELECT b.city, b.hour_start, b.requests,",
        "         (SELECT COUNT(DISTINCT sh.driver_id) FROM DriverShift sh",
        "          WHERE sh.city = b.city AND sh.online_from < DATE_ADD(b.hour_start, INTERVAL 1 HOUR) AND sh.online_to > b.hour_start) AS drivers_online",
        "  FROM (SELECT city, DATE_FORMAT(requested_at, '%Y-%m-%d %H:00:00') AS hour_start, COUNT(*) AS requests",
        "        FROM RideRequest",
        "        WHERE requested_at >= '2024-08-09 17:00:00' AND requested_at < '2024-08-09 22:00:00'",
        "        GROUP BY city, DATE_FORMAT(requested_at, '%Y-%m-%d %H:00:00')) b",
        ") x",
        "WHERE requests > 2 * drivers_online",
        "ORDER BY city, hour_start",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Work slot by slot: first count requests per city and slot, then count drivers for each of those slots.",
      "Two intervals [a, b) and [c, d) overlap when a < d and c < b.",
      "Count **distinct** drivers — a driver with two shifts in one slot is still one driver.",
      "A slot with requests but no drivers at all must keep a driver count of 0, not disappear.",
    ],
    editorial: [
      "The answer is per (city, slot), with two measures from two unrelated tables, so they are computed separately and then put side by side.",
      "",
      "The solution builds the five slots with a recursive CTE (anchor 17:00, add an hour until 21:00) and joins requests into them with a half-open range, `>= start AND < start + 1 hour`, so a request at 17:59:59 belongs to 17:00 and one at exactly 22:00 to no slot. Only slots with requests can satisfy `requests > 2 × drivers`, so `demand` is the list of candidates.",
      "",
      "For supply, a shift overlaps the slot when it began before the slot ended and ended after the slot began — the standard interval-overlap test, strict on both sides, so driver 502's shift ending at 18:00 does not count in the 18:00 slot and driver 503's ending at 21:00 not in the 21:00 slot. `COUNT(DISTINCT driver_id)` counts people, not shifts. The join is a `LEFT JOIN` grouped per demand row, so a slot with no overlapping shift still appears with 0 — Bengaluru at 21:00 and Mumbai at 19:00 are exactly the cases where supply was zero.",
      "",
      "The alternative buckets requests with `DATE_FORMAT(requested_at, '%Y-%m-%d %H:00:00')` inside the window and counts drivers with a correlated subquery per bucket. Both are small joins over one evening's data; with indexes on `(city, requested_at)` and `(city, online_from)` they stay cheap at scale.",
    ].join("\n"),
  },

  {
    slug: "uber-longest-surge-episode-per-zone",
    title: "Uber: Longest Surge Episode in Each Zone",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "Surge pricing is recalculated every 5 minutes per zone. A pricing analyst wants each zone's longest uninterrupted spell of high surge on the evening of 2024-09-14.",
      "",
      "A slot is **hot** when its `multiplier` is **at least 1.5**. An **episode** is a maximal run of hot slots of one zone in which each slot starts exactly 5 minutes after the previous one (a missing reading breaks the run). For each zone with at least one hot slot, return its longest episode: `zone`, `episode_start` (the first slot's start), `episode_end` (the last slot's start **plus 5 minutes**), `slots` and `peak_multiplier`. If two episodes tie on length, return the **earlier** one. Order by `zone`.",
    ].join("\n"),
    tables: [
      {
        name: "SurgeReading",
        columns: [
          { name: "zone", type: "varchar" },
          { name: "slot_start", type: "datetime" },
          { name: "multiplier", type: "decimal" },
        ],
        primaryKey: ["zone", "slot_start"],
        note: "One row per zone per 5-minute slot that had a reading; `slot_start` is always on a 5-minute mark of 2024-09-14.",
      },
    ],
    examples: [
      {
        SurgeReading: [
          ["Indiranagar", "2024-09-14 18:00:00", 1.2],
          ["Indiranagar", "2024-09-14 18:05:00", 1.5],
          ["Indiranagar", "2024-09-14 18:10:00", 1.8],
          ["Indiranagar", "2024-09-14 18:15:00", 2.1],
          ["Indiranagar", "2024-09-14 18:20:00", 1.4],
          ["Indiranagar", "2024-09-14 18:25:00", 1.6],
          ["Indiranagar", "2024-09-14 18:30:00", 1.9],
          ["Indiranagar", "2024-09-14 18:40:00", 1.7],
          ["Indiranagar", "2024-09-14 18:45:00", 1.7],
          ["Indiranagar", "2024-09-14 18:50:00", 1.5],
          ["Whitefield", "2024-09-14 18:00:00", 1.0],
          ["Whitefield", "2024-09-14 18:05:00", 1.3],
          ["Koramangala", "2024-09-14 19:00:00", 1.5],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const zone of sample(rng, ZONES, ri(rng, 1, 3))) {
        const len = ri(rng, 3, 14);
        const from = ri(rng, 0, 10);
        for (let s = from; s < from + len; s++) {
          if (chance(rng, 0.12)) continue;
          rows.push([zone, at("2024-09-14", 18 * 60 + s * 5), pick(rng, [1.0, 1.2, 1.4, 1.5, 1.5, 1.6, 1.8, 2.0, 2.3])]);
        }
      }
      return { SurgeReading: rows };
    },
    solution: [
      "WITH hot AS (",
      "  SELECT zone, slot_start, multiplier,",
      "         TIMESTAMPDIFF(MINUTE, '2024-09-14 00:00:00', slot_start) DIV 5",
      "           - ROW_NUMBER() OVER (PARTITION BY zone ORDER BY slot_start) AS grp",
      "  FROM SurgeReading",
      "  WHERE multiplier >= 1.5",
      "), episodes AS (",
      "  SELECT zone, MIN(slot_start) AS episode_start,",
      "         DATE_ADD(MAX(slot_start), INTERVAL 5 MINUTE) AS episode_end,",
      "         COUNT(*) AS slots, MAX(multiplier) AS peak_multiplier",
      "  FROM hot",
      "  GROUP BY zone, grp",
      "), ranked AS (",
      "  SELECT e.*, ROW_NUMBER() OVER (PARTITION BY zone ORDER BY slots DESC, episode_start) AS pos",
      "  FROM episodes e",
      ")",
      "SELECT zone, episode_start, episode_end, slots, peak_multiplier",
      "FROM ranked",
      "WHERE pos = 1",
      "ORDER BY zone",
    ].join("\n"),
    alternatives: [
      [
        "WITH marked AS (",
        "  SELECT zone, slot_start, multiplier,",
        "         CASE WHEN LAG(slot_start) OVER (PARTITION BY zone ORDER BY slot_start) = DATE_SUB(slot_start, INTERVAL 5 MINUTE)",
        "              THEN 0 ELSE 1 END AS is_start",
        "  FROM SurgeReading",
        "  WHERE multiplier >= 1.5",
        "), numbered AS (",
        "  SELECT zone, slot_start, multiplier,",
        "         SUM(is_start) OVER (PARTITION BY zone ORDER BY slot_start ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS ep",
        "  FROM marked",
        "), episodes AS (",
        "  SELECT zone, MIN(slot_start) AS episode_start, DATE_ADD(MAX(slot_start), INTERVAL 5 MINUTE) AS episode_end,",
        "         COUNT(*) AS slots, MAX(multiplier) AS peak_multiplier",
        "  FROM numbered GROUP BY zone, ep",
        ")",
        "SELECT e.zone, e.episode_start, e.episode_end, e.slots, e.peak_multiplier",
        "FROM episodes e",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM episodes o",
        "  WHERE o.zone = e.zone",
        "    AND (o.slots > e.slots OR (o.slots = e.slots AND o.episode_start < e.episode_start))",
        ")",
        "ORDER BY e.zone",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Keep only the hot slots first; the gaps-and-islands work happens on those.",
      "Turn each slot into a slot number (minutes since midnight divided by 5). Within one episode, slot number minus row number is constant.",
      "Group by that constant to get one row per episode, then rank episodes per zone by length, earliest first on ties.",
      "The end of an episode is the start of its last slot plus 5 minutes.",
    ],
    editorial: [
      "This is **gaps and islands**: the islands are runs of consecutive hot slots, and the gaps are cool slots or missing readings. Filtering to `multiplier >= 1.5` first leaves only hot slots, and a gap in time now marks the end of an island.",
      "",
      "The classic trick numbers the slots twice. `TIMESTAMPDIFF(MINUTE, midnight, slot_start) DIV 5` is the slot's position in the day; `ROW_NUMBER()` per zone is its position among the hot slots. Inside one island both advance by one per row, so their difference is constant; a gap makes the slot number jump while the row number does not, so the difference changes. Grouping by `(zone, difference)` gives one row per episode with its first slot, last slot plus 5 minutes, length and peak. (The slot number is always far larger than the row number, so the subtraction never goes negative — MySQL's unsigned `ROW_NUMBER` would otherwise complain.)",
      "",
      "Finally `ROW_NUMBER() OVER (PARTITION BY zone ORDER BY slots DESC, episode_start)` ranks the episodes and the first is kept: in Indiranagar the 18:05 and 18:40 episodes both have three slots, and the earlier wins. The missing 18:35 reading ends the 18:25 episode at two slots. The alternative marks island starts with `LAG` and a running `SUM`, and picks the winner with `NOT EXISTS` — no longer episode, and no equally long earlier one.",
    ].join("\n"),
  },

  {
    slug: "uber-split-fare-shares-to-the-paisa",
    title: "Uber: Split Fare Shares to the Paisa",
    difficulty: "HARD",
    topics: ["Window Functions", "Conditional Logic", "Strings"],
    description: [
      "With Split Fare, a rider invites friends to share a trip's cost. Payments must add up to the fare exactly, so the amount is shared out in **paise** (1 rupee = 100 paise): each of the `n` riders who **accepted** pays `fare_paise DIV n`, and the remaining `fare_paise MOD n` paise are charged **one each** to the riders who accepted **first** (earliest `responded_at`; on a tie, the smaller `rider_id` goes first). Riders who declined or never answered pay nothing.",
      "",
      "Return `trip_id`, `rider_id`, `share_paise` and `share_rupees` — the share written as rupees with exactly two decimals, such as `'83.34'` or `'45.00'` — for every rider who accepted, ordered by `trip_id`, then `rider_id`.",
    ].join("\n"),
    tables: [
      {
        name: "FareSplit",
        columns: [
          { name: "trip_id", type: "int" },
          { name: "fare_paise", type: "int" },
        ],
        primaryKey: ["trip_id"],
        note: "One row per trip whose fare is being split, with the final fare in paise.",
      },
      {
        name: "SplitMember",
        columns: [
          { name: "trip_id", type: "int" },
          { name: "rider_id", type: "int" },
          { name: "status", type: "enum", values: ["accepted", "declined", "pending"] },
          { name: "responded_at", type: "datetime" },
        ],
        primaryKey: ["trip_id", "rider_id"],
        note: "One row per rider in a split, including the rider who started it (always `accepted`). `trip_id` always names a row of `FareSplit`.",
      },
    ],
    examples: [
      {
        FareSplit: [
          [1, 25001],
          [2, 10001],
          [3, 4500],
          [4, 8000],
        ],
        SplitMember: [
          [1, 11, "accepted", "2024-09-20 10:00:00"],
          [1, 13, "accepted", "2024-09-20 10:01:00"],
          [1, 12, "accepted", "2024-09-20 10:01:00"],
          [2, 21, "accepted", "2024-09-20 11:00:00"],
          [2, 22, "declined", "2024-09-20 10:59:00"],
          [2, 23, "accepted", "2024-09-20 11:02:00"],
          [2, 24, "pending", "2024-09-20 11:03:00"],
          [3, 31, "accepted", "2024-09-20 12:00:00"],
          [4, 41, "declined", "2024-09-20 13:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const trips = ri(rng, 1, 5);
      const fares: Cell[][] = seq(1, trips).map((t) => [t, ri(rng, 3000, 90000)]);
      const members: Cell[][] = [];
      for (let t = 1; t <= trips; t++) {
        const riders = sample(rng, seq(t * 10 + 1, 6), ri(rng, 1, 5));
        for (const r of riders) members.push([t, r, pick(rng, ["accepted", "accepted", "accepted", "declined", "pending"]), at("2024-09-20", 600 + ri(rng, 0, 4))]);
      }
      return { FareSplit: fares, SplitMember: members };
    },
    solution: [
      "WITH accepted AS (",
      "  SELECT m.trip_id, m.rider_id, f.fare_paise,",
      "         ROW_NUMBER() OVER (PARTITION BY m.trip_id ORDER BY m.responded_at, m.rider_id) AS seat,",
      "         COUNT(*) OVER (PARTITION BY m.trip_id) AS riders",
      "  FROM SplitMember m",
      "  JOIN FareSplit f ON f.trip_id = m.trip_id",
      "  WHERE m.status = 'accepted'",
      "), shares AS (",
      "  SELECT trip_id, rider_id,",
      "         fare_paise DIV riders + CASE WHEN seat <= fare_paise MOD riders THEN 1 ELSE 0 END AS share_paise",
      "  FROM accepted",
      ")",
      "SELECT trip_id, rider_id, share_paise,",
      "       CONCAT(share_paise DIV 100, '.', LPAD(share_paise MOD 100, 2, '0')) AS share_rupees",
      "FROM shares",
      "ORDER BY trip_id, rider_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT trip_id, rider_id, share_paise,",
        "       CONCAT(FLOOR(share_paise / 100), '.', RIGHT(CONCAT('0', MOD(share_paise, 100)), 2)) AS share_rupees",
        "FROM (",
        "  SELECT m.trip_id, m.rider_id,",
        "         FLOOR(f.fare_paise / c.n) + IF(",
        "           1 + (SELECT COUNT(*) FROM SplitMember e",
        "                WHERE e.trip_id = m.trip_id AND e.status = 'accepted'",
        "                  AND (e.responded_at < m.responded_at OR (e.responded_at = m.responded_at AND e.rider_id < m.rider_id)))",
        "           <= MOD(f.fare_paise, c.n), 1, 0) AS share_paise",
        "  FROM SplitMember m",
        "  JOIN FareSplit f ON f.trip_id = m.trip_id",
        "  JOIN (SELECT trip_id, COUNT(*) AS n FROM SplitMember WHERE status = 'accepted' GROUP BY trip_id) c ON c.trip_id = m.trip_id",
        "  WHERE m.status = 'accepted'",
        ") s",
        "ORDER BY trip_id, rider_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Only accepted riders take part; count them per trip and give each a seat number in acceptance order.",
      "`ROW_NUMBER() OVER (PARTITION BY trip_id ORDER BY responded_at, rider_id)` is the seat; `COUNT(*) OVER (PARTITION BY trip_id)` is n.",
      "Every rider pays `fare DIV n`; seats 1 … `fare MOD n` pay one paisa more.",
      "Format with integer arithmetic: rupees are `share DIV 100`, paise `share MOD 100` padded to two digits.",
    ],
    editorial: [
      "Splitting money exactly is a classic **largest-remainder** problem: divide in the smallest unit, then hand out the leftover units one at a time in a fixed order. Here the unit is the paisa and the order is acceptance time with `rider_id` as the tie-breaker, which makes every result deterministic.",
      "",
      "The first CTE keeps accepted riders only and attaches two window values per row: `seat`, the rider's position in acceptance order within the trip, and `riders`, the number of accepted riders. Each share is then `fare_paise DIV riders`, plus one paisa when `seat <= fare_paise MOD riders`. Because the remainder is smaller than the number of riders, exactly the remainder's worth of riders get the extra paisa, and the shares add back to the fare. On trip 1, 25,001 paise among three riders leaves 2 paise: rider 11 accepted first, and of the tied riders 12 and 13 the smaller id takes the second paisa.",
      "",
      "Formatting stays in integers too: `share_paise DIV 100` is the rupee part and `LPAD(share_paise MOD 100, 2, '0')` the paise, so 4,500 becomes `45.00` without any floating-point rounding. Trip 4, where nobody accepted, produces no rows.",
      "",
      "The alternative computes the seat with a correlated count of riders who accepted earlier (or at the same moment with a smaller id) and the rider count with a grouped derived table, using `FLOOR`, `MOD` and `RIGHT` for the same arithmetic.",
    ].join("\n"),
  },

  {
    slug: "uber-freight-lane-rate-spikes",
    title: "Uber: Freight Lane Rates Spiking Over the 28-Day Average",
    difficulty: "HARD",
    topics: ["Joins", "Dates", "Aggregation"],
    description: [
      "Uber Freight's pricing desk watches for loads booked far above what the same lane has been costing lately, a sign of a capacity crunch on that lane.",
      "",
      "A load is a **spike** when its `rate_per_km` is **more than 25% above** the average `rate_per_km` of the loads on the **same lane** booked in the **28 days before it** — `booked_on` from 28 days earlier up to the day before, inclusive; loads on the same day do not count — and there were **at least 3** such earlier loads. Return `load_id`, `lane`, `booked_on`, `rate_per_km` and `prior_loads` (the number of loads in its window), ordered by `booked_on`, then `load_id`.",
    ].join("\n"),
    tables: [
      {
        name: "LoadBooking",
        columns: [
          { name: "load_id", type: "int" },
          { name: "lane", type: "varchar" },
          { name: "booked_on", type: "date" },
          { name: "rate_per_km", type: "int" },
        ],
        primaryKey: ["load_id"],
        note: "One row per booked truckload; `rate_per_km` is in whole rupees.",
      },
    ],
    examples: [
      {
        LoadBooking: [
          [1, "Mumbai-Pune", "2024-03-01", 40],
          [2, "Mumbai-Pune", "2024-03-05", 44],
          [3, "Mumbai-Pune", "2024-03-10", 36],
          [4, "Mumbai-Pune", "2024-03-15", 50],
          [5, "Mumbai-Pune", "2024-03-20", 52],
          [6, "Mumbai-Pune", "2024-03-29", 58],
          [7, "Delhi-Jaipur", "2024-03-02", 30],
          [8, "Delhi-Jaipur", "2024-03-04", 31],
          [9, "Delhi-Jaipur", "2024-03-20", 45],
          [10, "Delhi-Jaipur", "2024-04-10", 60],
          [11, "Delhi-Jaipur", "2024-03-25", 46],
        ],
      },
    ],
    gen: (rng) => {
      const lanes = sample(rng, LANES, ri(rng, 1, 3));
      const rows: Cell[][] = [];
      let id = 1;
      for (const lane of lanes) {
        const base = ri(rng, 30, 45);
        for (let k = ri(rng, 3, 10); k > 0; k--) rows.push([id++, lane, dateBetween(rng, "2024-03-01", "2024-04-05"), base + ri(rng, -5, 5) + (chance(rng, 0.35) ? ri(rng, 8, 20) : 0)]);
      }
      return { LoadBooking: rows };
    },
    solution: [
      "SELECT l.load_id, l.lane, l.booked_on, l.rate_per_km, COUNT(*) AS prior_loads",
      "FROM LoadBooking l",
      "JOIN LoadBooking p",
      "  ON p.lane = l.lane",
      " AND p.booked_on >= DATE_SUB(l.booked_on, INTERVAL 28 DAY)",
      " AND p.booked_on < l.booked_on",
      "GROUP BY l.load_id, l.lane, l.booked_on, l.rate_per_km",
      "HAVING COUNT(*) >= 3 AND 4 * l.rate_per_km * COUNT(*) > 5 * SUM(p.rate_per_km)",
      "ORDER BY l.booked_on, l.load_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT load_id, lane, booked_on, rate_per_km, prior_loads FROM (",
        "  SELECT l.*,",
        "         (SELECT COUNT(*) FROM LoadBooking p WHERE p.lane = l.lane AND DATEDIFF(l.booked_on, p.booked_on) BETWEEN 1 AND 28) AS prior_loads,",
        "         (SELECT SUM(p.rate_per_km) FROM LoadBooking p WHERE p.lane = l.lane AND DATEDIFF(l.booked_on, p.booked_on) BETWEEN 1 AND 28) AS prior_total",
        "  FROM LoadBooking l",
        ") x",
        "WHERE prior_loads >= 3 AND rate_per_km * prior_loads * 4 > prior_total * 5",
        "ORDER BY booked_on, load_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Each load needs a summary of other rows of the same table in a date window relative to it — a self join or a correlated subquery.",
      "The window is `[booked_on - 28 days, booked_on - 1 day]`; mind both ends.",
      "\"More than 25% above the average\" is rate > 1.25 × sum / count. Multiply it out to stay in integers.",
      "Require at least three loads in the window before judging.",
    ],
    editorial: [
      "Every load is compared with a **trailing window** of its own lane's history, so the table is joined to itself: `l` is the load being judged and `p` ranges over the same lane's loads booked from 28 days before up to the day before. The lower edge is inclusive — load 6 on 29 March still sees load 1 from 1 March, exactly 28 days earlier — and the upper edge is strict, so loads booked the same day are not part of the baseline.",
      "",
      "Grouping by the judged load gives `COUNT(*)` (the prior loads) and `SUM(p.rate_per_km)` for its window. The inner join means a load with no history has no group at all, and `HAVING COUNT(*) >= 3` drops thin windows such as Delhi-Jaipur's 20 March load, which had only two predecessors.",
      "",
      "The spike test `rate > 1.25 × SUM / COUNT` is rewritten as `4 × rate × COUNT > 5 × SUM`. That keeps the comparison in exact integers: averages like 42.5 or 35.33… then never pass through decimal or floating-point rounding, and a boundary case such as load 4 (rate 50 against an average of 40 — exactly 25% above, not more) is decided correctly.",
      "",
      "The alternative computes the window's count and total with two correlated subqueries using `DATEDIFF … BETWEEN 1 AND 28`. Window functions with a date-based `RANGE` frame would also work in engines that support them; the self join is the portable choice, and with an index on `(lane, booked_on)` each window is a short range scan.",
    ].join("\n"),
  },

  {
    slug: "uber-trip-event-logs-breaking-the-state-machine",
    title: "Uber: Trip Event Logs That Break the State Machine",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins", "Subqueries"],
    description: [
      "Every trip moves through states — requested, accepted, arrived, started, completed, or cancelled along the way — and the app logs one event per state. A trip whose log skips or reverses a state points to a client bug or a lost event, so the data-quality team audits the logs against the allowed moves in `AllowedStep`.",
      "",
      "Read each trip's events in order of `event_at`. Every consecutive pair of events is a **step** from the earlier `event_type` to the later one; the trip's first event is a step **from `'start'`**. A step is invalid when `(from_state, to_state)` is not a row of `AllowedStep`. For every trip with at least one invalid step, return its **first** invalid step: `trip_id`, `from_state`, `to_state` and `broken_at` (the `event_at` of the step's later event). Order by `trip_id`.",
    ].join("\n"),
    tables: [
      {
        name: "TripEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "trip_id", type: "int" },
          { name: "event_type", type: "varchar" },
          { name: "event_at", type: "datetime" },
        ],
        primaryKey: ["event_id"],
        note: "One row per logged state change, `event_type` in lower case. No trip has two events at the same second.",
      },
      {
        name: "AllowedStep",
        columns: [
          { name: "from_state", type: "varchar" },
          { name: "to_state", type: "varchar" },
        ],
        primaryKey: ["from_state", "to_state"],
        note: "Every allowed move; `'start'` stands for \"before the first event\".",
      },
    ],
    examples: [
      {
        TripEvent: [
          [1, 1, "requested", "2024-10-11 08:00:00"],
          [2, 1, "accepted", "2024-10-11 08:00:30"],
          [3, 1, "arrived", "2024-10-11 08:06:00"],
          [4, 1, "started", "2024-10-11 08:07:00"],
          [5, 1, "completed", "2024-10-11 08:30:00"],
          [6, 2, "requested", "2024-10-11 09:00:00"],
          [7, 2, "arrived", "2024-10-11 09:08:00"],
          [8, 2, "started", "2024-10-11 09:09:00"],
          [9, 3, "requested", "2024-10-11 09:30:00"],
          [10, 3, "accepted", "2024-10-11 09:31:00"],
          [11, 3, "cancelled", "2024-10-11 09:33:00"],
          [12, 3, "accepted", "2024-10-11 09:35:00"],
          [13, 4, "accepted", "2024-10-11 10:00:00"],
          [14, 4, "arrived", "2024-10-11 10:05:00"],
          [15, 5, "requested", "2024-10-11 10:30:00"],
          [16, 5, "cancelled", "2024-10-11 10:31:00"],
          [17, 6, "requested", "2024-10-11 11:00:00"],
          [18, 6, "accepted", "2024-10-11 11:01:00"],
          [19, 6, "started", "2024-10-11 11:06:00"],
          [20, 6, "arrived", "2024-10-11 11:07:00"],
          [21, 6, "completed", "2024-10-11 11:25:00"],
        ],
        AllowedStep: [
          ["start", "requested"],
          ["requested", "accepted"],
          ["requested", "cancelled"],
          ["accepted", "arrived"],
          ["accepted", "cancelled"],
          ["arrived", "started"],
          ["arrived", "cancelled"],
          ["started", "completed"],
        ],
      },
    ],
    gen: (rng) => {
      const allowed: Cell[][] = [
        ["start", "requested"], ["requested", "accepted"], ["requested", "cancelled"], ["accepted", "arrived"],
        ["accepted", "cancelled"], ["arrived", "started"], ["arrived", "cancelled"], ["started", "completed"],
      ];
      const paths = [
        ["requested", "cancelled"],
        ["requested", "accepted", "cancelled"],
        ["requested", "accepted", "arrived", "cancelled"],
        ["requested", "accepted", "arrived", "started", "completed"],
        ["requested", "accepted", "arrived", "started", "completed"],
      ];
      const states = ["requested", "accepted", "arrived", "started", "completed", "cancelled"];
      const rows: Cell[][] = [];
      let id = 1;
      const trips = chance(rng, 0.05) ? 0 : ri(rng, 2, 7);
      for (let t = 1; t <= trips; t++) {
        const path = [...pick(rng, paths)];
        if (chance(rng, 0.6)) {
          const how = ri(rng, 0, 3);
          const i = ri(rng, 0, path.length - 1);
          if (how === 0 && path.length > 1) path.splice(i, 1);
          else if (how === 1 && i + 1 < path.length) [path[i], path[i + 1]] = [path[i + 1]!, path[i]!];
          else if (how === 2) path.splice(i, 0, pick(rng, states));
          else path.push(pick(rng, states));
        }
        let s = ri(rng, 7 * 3600, 20 * 3600);
        for (const e of path) {
          rows.push([id++, t, e, atS("2024-10-11", s)]);
          s += ri(rng, 20, 600);
        }
      }
      return { TripEvent: rows, AllowedStep: allowed };
    },
    solution: [
      "WITH steps AS (",
      "  SELECT trip_id, event_at,",
      "         LAG(event_type, 1, 'start') OVER (PARTITION BY trip_id ORDER BY event_at) AS from_state,",
      "         event_type AS to_state",
      "  FROM TripEvent",
      "), bad AS (",
      "  SELECT s.trip_id, s.from_state, s.to_state, s.event_at,",
      "         ROW_NUMBER() OVER (PARTITION BY s.trip_id ORDER BY s.event_at) AS rn",
      "  FROM steps s",
      "  LEFT JOIN AllowedStep a ON a.from_state = s.from_state AND a.to_state = s.to_state",
      "  WHERE a.from_state IS NULL",
      ")",
      "SELECT trip_id, from_state, to_state, event_at AS broken_at",
      "FROM bad",
      "WHERE rn = 1",
      "ORDER BY trip_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH steps AS (",
        "  SELECT e.trip_id, e.event_at, e.event_type AS to_state,",
        "         COALESCE((SELECT p.event_type FROM TripEvent p",
        "                   WHERE p.trip_id = e.trip_id AND p.event_at < e.event_at",
        "                   ORDER BY p.event_at DESC LIMIT 1), 'start') AS from_state",
        "  FROM TripEvent e",
        "), bad AS (",
        "  SELECT * FROM steps s",
        "  WHERE NOT EXISTS (SELECT 1 FROM AllowedStep a WHERE a.from_state = s.from_state AND a.to_state = s.to_state)",
        ")",
        "SELECT b.trip_id, b.from_state, b.to_state, b.event_at AS broken_at",
        "FROM bad b",
        "WHERE b.event_at = (SELECT MIN(x.event_at) FROM bad x WHERE x.trip_id = b.trip_id)",
        "ORDER BY b.trip_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Turn the log into steps: each event paired with the event before it in the same trip.",
      "`LAG(event_type, 1, 'start')` gives the previous state, with `'start'` for the first event.",
      "An invalid step is one with **no** matching row in `AllowedStep` — an anti join.",
      "Several steps of one trip can be invalid; rank them by time and keep the first.",
    ],
    editorial: [
      "The audit compares the log with a **state machine** stored as data, so the work is to put the log in the same shape as `AllowedStep` — pairs of (from, to) — and look for pairs the table does not contain.",
      "",
      "**Steps.** `LAG(event_type, 1, 'start') OVER (PARTITION BY trip_id ORDER BY event_at)` places each event next to the previous event of the same trip. Its third argument is the default for the first row, so the first event becomes a step from `'start'`. That is how trip 4, whose log opens with `accepted`, is caught: `('start', 'accepted')` is not an allowed move.",
      "",
      "**Invalid steps.** A `LEFT JOIN` to `AllowedStep` on both columns, keeping rows where the join found nothing, is the anti join. Trip 2 skips `accepted` (`requested → arrived`); trip 3 comes back to life after a cancellation (`cancelled → accepted`); trip 6 starts before arriving and then arrives after starting — two invalid steps.",
      "",
      "**First one.** `ROW_NUMBER()` per trip over the invalid steps, ordered by time, keeps only the earliest, so trip 6 reports `accepted → started`. Trips 1 and 5 have no invalid step and do not appear.",
      "",
      "The alternative finds each previous event with a correlated `ORDER BY … LIMIT 1` subquery, uses `NOT EXISTS` for the anti join, and keeps the invalid step whose time is the trip's minimum. Keeping the rules in a table rather than in a long `CASE` means a new state needs a new row, not a new query.",
    ].join("\n"),
  },

  {
    slug: "uber-promo-credited-for-first-trip",
    title: "Uber: Which Promo Gets Credit for a Rider's First Trip",
    difficulty: "HARD",
    topics: ["Window Functions", "Subqueries", "Dates"],
    description: [
      "Growth marketing attributes each rider's **first completed trip** to the promo that brought them in, using a last-touch rule.",
      "",
      "A rider's first completed trip is the one with the earliest `completed_at` among their trips with status `completed`. It is credited to the promo the rider **touched most recently at or before** that trip's `completed_at`, provided the touch was **no more than 7 days earlier** (a touch exactly 7 × 24 hours before still counts). Ties on `touched_at` go to the larger `touch_id`. A first trip with no such touch is credited to `'ORGANIC'`. Riders with no completed trip are left out.",
      "",
      "Return `credited_code` and `first_trips` (the number of first trips credited to it), ordered by `first_trips` descending, then `credited_code`.",
    ].join("\n"),
    tables: [
      {
        name: "Trip",
        columns: [
          { name: "trip_id", type: "int" },
          { name: "rider_id", type: "int" },
          { name: "completed_at", type: "datetime" },
          { name: "status", type: "enum", values: ["completed", "cancelled"] },
        ],
        primaryKey: ["trip_id"],
        note: "One row per trip; for a cancelled trip `completed_at` is the time it was called off.",
      },
      {
        name: "PromoTouch",
        columns: [
          { name: "touch_id", type: "int" },
          { name: "rider_id", type: "int" },
          { name: "promo_code", type: "varchar" },
          { name: "touched_at", type: "datetime" },
        ],
        primaryKey: ["touch_id"],
        note: "One row each time a rider opened or applied a promo; codes are upper-case.",
      },
    ],
    examples: [
      {
        Trip: [
          [1, 1, "2024-06-10 09:00:00", "completed"],
          [2, 2, "2024-06-01 08:00:00", "cancelled"],
          [3, 2, "2024-06-12 18:00:00", "completed"],
          [4, 3, "2024-06-15 08:00:00", "completed"],
          [5, 4, "2024-06-20 21:00:00", "completed"],
          [6, 4, "2024-06-25 21:00:00", "completed"],
          [7, 1, "2024-06-18 10:00:00", "completed"],
        ],
        PromoTouch: [
          [1, 1, "RIDE50", "2024-06-05 10:00:00"],
          [2, 1, "AIRPORT75", "2024-06-09 20:00:00"],
          [3, 2, "RIDE50", "2024-06-05 18:00:00"],
          [4, 3, "RIDE50", "2024-06-15 08:30:00"],
          [5, 3, "MONSOON25", "2024-06-01 08:00:00"],
          [6, 4, "RIDE50", "2024-06-19 12:00:00"],
          [7, 4, "AIRPORT75", "2024-06-24 12:00:00"],
          [8, 5, "RIDE50", "2024-06-02 12:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const trips: Cell[][] = [];
      const touches: Cell[][] = [];
      const codes = sample(rng, ["RIDE50", "AIRPORT75", "MONSOON25", "NIGHT20"], ri(rng, 2, 4));
      let tid = 1;
      let pid = 1;
      const riders = ri(rng, 2, 9);
      for (let r = 1; r <= riders; r++) {
        let first: number | null = null;
        for (let k = ri(rng, 0, 3); k > 0; k--) {
          const m = ri(rng, 5, 25) * 1440 + ri(rng, 360, 1380);
          const done = chance(rng, 0.75);
          trips.push([tid++, r, at("2024-06-01", m - 1440), done ? "completed" : "cancelled"]);
          if (done && (first === null || m < first)) first = m;
        }
        for (let k = ri(rng, 0, 3); k > 0; k--) {
          const m = first !== null && chance(rng, 0.75) ? first - (chance(rng, 0.25) ? pick(rng, [0, 10080, 10081]) : ri(rng, -600, 12000)) : ri(rng, 1, 25) * 1440 + ri(rng, 0, 1439);
          touches.push([pid++, r, pick(rng, codes), at("2024-06-01", m - 1440)]);
        }
      }
      return { Trip: trips, PromoTouch: touches };
    },
    solution: [
      "WITH first_trip AS (",
      "  SELECT rider_id, completed_at",
      "  FROM (SELECT rider_id, completed_at,",
      "               ROW_NUMBER() OVER (PARTITION BY rider_id ORDER BY completed_at, trip_id) AS rn",
      "        FROM Trip WHERE status = 'completed') t",
      "  WHERE rn = 1",
      "), touch AS (",
      "  SELECT f.rider_id, p.promo_code,",
      "         ROW_NUMBER() OVER (PARTITION BY f.rider_id ORDER BY p.touched_at DESC, p.touch_id DESC) AS rn",
      "  FROM first_trip f",
      "  JOIN PromoTouch p",
      "    ON p.rider_id = f.rider_id",
      "   AND p.touched_at <= f.completed_at",
      "   AND p.touched_at >= DATE_SUB(f.completed_at, INTERVAL 7 DAY)",
      ")",
      "SELECT COALESCE(t.promo_code, 'ORGANIC') AS credited_code, COUNT(*) AS first_trips",
      "FROM first_trip f",
      "LEFT JOIN touch t ON t.rider_id = f.rider_id AND t.rn = 1",
      "GROUP BY COALESCE(t.promo_code, 'ORGANIC')",
      "ORDER BY first_trips DESC, credited_code",
    ].join("\n"),
    alternatives: [
      [
        "SELECT credited_code, COUNT(*) AS first_trips FROM (",
        "  SELECT f.rider_id,",
        "         COALESCE((SELECT p.promo_code FROM PromoTouch p",
        "                   WHERE p.rider_id = f.rider_id",
        "                     AND p.touched_at <= f.first_at",
        "                     AND TIMESTAMPDIFF(SECOND, p.touched_at, f.first_at) <= 7 * 86400",
        "                   ORDER BY p.touched_at DESC, p.touch_id DESC",
        "                   LIMIT 1), 'ORGANIC') AS credited_code",
        "  FROM (SELECT rider_id, MIN(completed_at) AS first_at FROM Trip WHERE status = 'completed' GROUP BY rider_id) f",
        ") x",
        "GROUP BY credited_code",
        "ORDER BY first_trips DESC, credited_code",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Break it into steps: each rider's first completed trip, then the qualifying touches for that trip, then the winning touch, then the counts.",
      "Cancelled trips are not first trips — filter before ranking.",
      "Rank the touches inside the window by `touched_at DESC, touch_id DESC` and keep rank 1.",
      "A LEFT JOIN from first trips keeps riders with no qualifying touch; COALESCE names them `'ORGANIC'`.",
    ],
    editorial: [
      "Attribution questions are multi-step, and each step is a CTE.",
      "",
      "**First trips.** Among completed trips only, `ROW_NUMBER()` per rider ordered by `completed_at` (with `trip_id` to break a tie) picks one first trip per rider. Rider 2's cancelled trip on 1 June is ignored, so their first trip is on 12 June. Riders with no completed trip, like rider 5, have no row and drop out of the whole computation.",
      "",
      "**Candidate touches.** Each first trip is joined to the rider's touches in the window `[completed_at − 7 days, completed_at]`, both ends inclusive: rider 2's RIDE50 touch exactly seven days earlier qualifies; rider 3's touch half an hour **after** the trip and their two-week-old touch do not. `ROW_NUMBER()` ordered by `touched_at DESC, touch_id DESC` ranks the candidates, so rank 1 is the last touch with ties resolved as the statement says — rider 1's AIRPORT75 beats the older RIDE50, and rider 4's later AIRPORT75 touch is after their first trip and plays no part.",
      "",
      "**Counting.** The first trips are `LEFT JOIN`ed to the rank-1 touches, so a first trip with no qualifying touch keeps NULL and `COALESCE` labels it `ORGANIC`. Grouping by that label gives the counts; the order uses the count and then the code. The alternative finds the first trip with `MIN(completed_at)` and the winning touch with a correlated `ORDER BY … LIMIT 1` subquery — clear, and cheap with an index on `(rider_id, touched_at)`.",
    ].join("\n"),
  },
];
