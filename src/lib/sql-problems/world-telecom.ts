import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, chance, dateBetween, names, pick, ri, roundTo, sample } from "./kit.js";

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
/** A ten-digit Indian mobile number as text. */
const mobile = (rng: () => number): string => `${ri(rng, 6, 9)}${String(ri(rng, 0, 999_999_999)).padStart(9, "0")}`;
const pad2 = (n: number) => String(n).padStart(2, "0");
/** 'YYYY-MM-DD HH:00:00' or with minutes. */
const stamp = (date: string, h: number, m = 0, s = 0): string => `${date} ${pad2(h)}:${pad2(m)}:${pad2(s)}`;
/** Whole minutes after a 'YYYY-MM-DD HH:MM:SS' stamp. */
function addMinutes(ts: string, minutes: number): string {
  const d = new Date(Date.parse(`${ts.replace(" ", "T")}Z`) + minutes * 60_000);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`;
}

const CIRCLES = ["Karnataka", "Maharashtra", "Delhi NCR", "Tamil Nadu", "Kerala", "Gujarat"] as const;
const OPERATORS = ["Nimbus Mobile", "Tara Telecom", "Vega Wireless", "Sanchar One", "Kiran Cellular"] as const;
const PLANS = [
  [14, "Data Sachet 14", 98], [28, "Unlimited 28", 299], [56, "Unlimited 56", 579], [84, "Unlimited 84", 719],
] as const;
const SITES = ["Koramangala", "Whitefield", "HSR Layout", "Indiranagar", "Jayanagar", "Marathahalli", "Yelahanka", "Hebbal"] as const;
const FEEDERS = ["BLR-F11", "BLR-F12", "BLR-F27", "MYS-F04", "HBL-F09"] as const;

/**
 * Telecom & utilities: the questions an analyst at a mobile operator or an
 * electricity distribution company is asked — prepaid recharges and plan
 * validity, call detail records, data usage per circle, dropped calls per
 * tower, number porting, cumulative meter readings and slab tariffs, bill
 * payments with late fees and partial instalments, and outage reports.
 * Easiest first.
 */
export const WORLD_TELECOM: SqlProblemSpec[] = [
  {
    slug: "prepaid-plans-expiring-first-week-of-june",
    title: "Prepaid Plans Expiring in the First Week of June",
    difficulty: "EASY",
    topics: ["Basics", "Dates"],
    description: [
      "The retention team sends a renewal SMS to every prepaid number whose plan runs out soon. A plan bought on `recharge_date` with a validity of `validity_days` days **expires on `recharge_date` plus `validity_days` days**.",
      "",
      "Return every recharge whose expiry date falls between **2024-06-01 and 2024-06-07, both included**, with the columns `recharge_id`, `mobile_number` and `expiry_date`. Order the rows by `expiry_date`, then by `recharge_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Recharge",
        columns: [
          { name: "recharge_id", type: "int" },
          { name: "mobile_number", type: "varchar" },
          { name: "plan_name", type: "varchar" },
          { name: "amount", type: "int" },
          { name: "recharge_date", type: "date" },
          { name: "validity_days", type: "int" },
        ],
        primaryKey: ["recharge_id"],
        note: "One row per prepaid recharge; `amount` is in rupees. A number can recharge more than once.",
      },
    ],
    examples: [
      {
        Recharge: [
          [1, "9845012345", "Unlimited 28", 299, "2024-05-04", 28],
          [2, "9900123456", "Unlimited 84", 719, "2024-03-15", 84],
          [3, "9731122334", "Data Sachet 14", 98, "2024-05-17", 14],
          [4, "9845012345", "Unlimited 56", 579, "2024-04-08", 56],
          [5, "8123456789", "Unlimited 28", 299, "2024-05-11", 28],
          [6, "7019988776", "Unlimited 28", 299, "2024-05-08", 28],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 15);
      const numbers = Array.from({ length: 6 }, () => mobile(rng));
      const rows = seq(1, n).map((id) => {
        const [validity, plan, amount] = pick(rng, PLANS);
        // Half the plans are aimed at the window's edges so the boundaries matter.
        const date = chance(rng, 0.55)
          ? addDays(dateBetween(rng, "2024-05-30", "2024-06-09"), -validity)
          : dateBetween(rng, "2024-03-01", "2024-06-07");
        return [id, pick(rng, numbers), plan, amount, date, validity];
      });
      return { Recharge: rows };
    },
    solution: [
      "SELECT recharge_id, mobile_number,",
      "       DATE_ADD(recharge_date, INTERVAL validity_days DAY) AS expiry_date",
      "FROM Recharge",
      "WHERE DATE_ADD(recharge_date, INTERVAL validity_days DAY) BETWEEN '2024-06-01' AND '2024-06-07'",
      "ORDER BY expiry_date, recharge_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT recharge_id, mobile_number, ADDDATE(recharge_date, validity_days) AS expiry_date",
        "FROM Recharge",
        "WHERE DATEDIFF('2024-06-01', recharge_date) <= validity_days",
        "  AND DATEDIFF('2024-06-07', recharge_date) >= validity_days",
        "ORDER BY expiry_date, recharge_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The table has no expiry column — compute it from the recharge date and the validity.",
      "`DATE_ADD(date, INTERVAL n DAY)` accepts a column as `n`.",
      "Both ends of the window are included, which is exactly what BETWEEN does.",
    ],
    editorial: [
      "The expiry date is derived, not stored: it is the recharge date moved forward by the plan's validity. `DATE_ADD(recharge_date, INTERVAL validity_days DAY)` computes it per row, and because the interval amount may be a column, one expression serves every plan length — 14, 28, 56 or 84 days.",
      "",
      "The filter is then a closed range on that expression. `BETWEEN '2024-06-01' AND '2024-06-07'` includes both ends, so a plan expiring on the 1st or the 7th is reminded and one expiring on 31 May or 8 June is not. The order is fixed by the statement, with `recharge_id` breaking ties between plans that expire on the same day.",
      "",
      "An equivalent filter avoids computing the date in the WHERE clause: the expiry is on or after the 1st exactly when `DATEDIFF('2024-06-01', recharge_date) <= validity_days`, and on or before the 7th when `DATEDIFF('2024-06-07', recharge_date) >= validity_days`. Either way it is one scan of the table; an index on `recharge_date` cannot help directly, because the condition depends on two columns.",
    ].join("\n"),
  },

  {
    slug: "dormant-prepaid-subscribers-since-march",
    title: "Dormant Prepaid Subscribers Since March",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "A prepaid subscriber who has not recharged for a while is about to be disconnected. The operator calls a subscriber **dormant** when they have **no recharge on or after 2024-03-01** — including subscribers who never recharged at all.",
      "",
      "Return every dormant subscriber with the columns `subscriber_id` and `name`. Recharges made before March do not make anyone active. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Subscriber",
        columns: [
          { name: "subscriber_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "mobile_number", type: "varchar" },
          { name: "circle", type: "varchar" },
        ],
        primaryKey: ["subscriber_id"],
        note: "One row per prepaid connection; `circle` is the telecom circle the number belongs to.",
      },
      {
        name: "Recharge",
        columns: [
          { name: "recharge_id", type: "int" },
          { name: "subscriber_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "recharge_date", type: "date" },
        ],
        primaryKey: ["recharge_id"],
        note: "Every `subscriber_id` here is in `Subscriber`. `amount` is in rupees.",
      },
    ],
    examples: [
      {
        Subscriber: [
          [1, "Aarav", "9845012345", "Karnataka"],
          [2, "Diya", "9900123456", "Kerala"],
          [3, "Farhan", "9731122334", "Karnataka"],
          [4, "Meera", "8123456789", "Tamil Nadu"],
          [5, "Rohan", "7019988776", "Gujarat"],
        ],
        Recharge: [
          [1, 1, 299, "2024-03-01"],
          [2, 2, 299, "2024-02-28"],
          [3, 4, 579, "2024-01-10"],
          [4, 4, 299, "2024-04-02"],
          [5, 5, 98, "2024-02-10"],
          [6, 2, 98, "2024-01-15"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const who = names(rng, n);
      const subs = seq(1, n).map((id, i) => [id, who[i]!, mobile(rng), pick(rng, CIRCLES)]);
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 18);
      const recharges = seq(1, m).map((id) => {
        const date = chance(rng, 0.3) ? pick(rng, ["2024-02-29", "2024-03-01"]) : dateBetween(rng, "2024-01-01", "2024-05-31");
        return [id, ri(rng, 1, n), pick(rng, [98, 299, 579, 719]), date];
      });
      return { Subscriber: subs, Recharge: recharges };
    },
    solution: [
      "SELECT s.subscriber_id, s.name",
      "FROM Subscriber s",
      "LEFT JOIN Recharge r",
      "  ON r.subscriber_id = s.subscriber_id AND r.recharge_date >= '2024-03-01'",
      "WHERE r.recharge_id IS NULL",
    ].join("\n"),
    alternatives: [
      "SELECT subscriber_id, name FROM Subscriber s WHERE NOT EXISTS (SELECT 1 FROM Recharge r WHERE r.subscriber_id = s.subscriber_id AND r.recharge_date >= '2024-03-01')",
      "SELECT subscriber_id, name FROM Subscriber WHERE subscriber_id NOT IN (SELECT subscriber_id FROM Recharge WHERE recharge_date >= '2024-03-01')",
    ],
    hints: [
      "Start from `Subscriber`: someone who never recharged must still be in the answer.",
      "Look for a recharge on or after 1 March; the subscribers for whom none exists are the answer.",
      "If you use a LEFT JOIN, the date condition belongs in the ON clause — in WHERE it would throw away the unmatched rows you are looking for.",
    ],
    editorial: [
      "This is an anti join with a condition on the other side: keep a subscriber when **no** recharge of theirs is dated 1 March or later.",
      "",
      "With a LEFT JOIN, the date test has to sit in the `ON` clause. There it restricts which recharges may match, and a subscriber with only February recharges (or none) is kept once with NULLs on the recharge side; `WHERE r.recharge_id IS NULL` then keeps exactly those. Putting the date test in `WHERE` instead would discard every NULL-extended row — the dormant subscribers — and turn the query into a plain inner join.",
      "",
      "`NOT EXISTS` with the same correlated condition says it directly and stops at the first qualifying recharge. `NOT IN` works here too because `subscriber_id` is never NULL in `Recharge`; with a nullable column it would silently return nothing. A recharge on exactly 2024-03-01 counts as activity, so `>=` is the right comparison. With an index on `(subscriber_id, recharge_date)` each subscriber costs one index probe.",
    ].join("\n"),
  },

  {
    slug: "august-data-usage-by-telecom-circle",
    title: "August Data Usage by Telecom Circle",
    difficulty: "EASY",
    topics: ["Aggregation", "Dates"],
    description: [
      "Each row of `DataUsage` is one day's mobile data for one subscriber, recorded against the circle where the data was used (a roaming subscriber shows up in another circle).",
      "",
      "For **August 2024** only, return one row per circle with the columns `circle`, `active_subscribers` (the number of different subscribers with a usage row in that circle) and `total_mb` (the sum of `mb_used`). Order by `total_mb` from highest to lowest, then by `circle` alphabetically.",
    ].join("\n"),
    tables: [
      {
        name: "DataUsage",
        columns: [
          { name: "usage_id", type: "int" },
          { name: "subscriber_id", type: "int" },
          { name: "circle", type: "varchar" },
          { name: "usage_date", type: "date" },
          { name: "mb_used", type: "int" },
        ],
        primaryKey: ["usage_id"],
        note: "`mb_used` is megabytes used that day in that circle.",
      },
    ],
    examples: [
      {
        DataUsage: [
          [1, 101, "Karnataka", "2024-08-01", 1500],
          [2, 101, "Karnataka", "2024-08-14", 700],
          [3, 102, "Karnataka", "2024-08-20", 500],
          [4, 103, "Kerala", "2024-07-31", 4000],
          [5, 103, "Kerala", "2024-08-31", 2500],
          [6, 104, "Delhi NCR", "2024-08-05", 2500],
          [7, 105, "Delhi NCR", "2024-09-01", 900],
        ],
      },
    ],
    gen: (rng) => {
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      const circles = sample(rng, CIRCLES, ri(rng, 1, 4));
      const rows = seq(1, m).map((id) => {
        const date = chance(rng, 0.25) ? pick(rng, ["2024-07-31", "2024-08-01", "2024-08-31", "2024-09-01"]) : dateBetween(rng, "2024-07-25", "2024-09-05");
        return [id, ri(rng, 101, 108), pick(rng, circles), date, roundTo(rng, 0, 3000, 250)];
      });
      return { DataUsage: rows };
    },
    solution: [
      "SELECT circle, COUNT(DISTINCT subscriber_id) AS active_subscribers, SUM(mb_used) AS total_mb",
      "FROM DataUsage",
      "WHERE usage_date BETWEEN '2024-08-01' AND '2024-08-31'",
      "GROUP BY circle",
      "ORDER BY total_mb DESC, circle",
    ].join("\n"),
    alternatives: [
      [
        "SELECT circle, COUNT(DISTINCT subscriber_id) AS active_subscribers, SUM(mb_used) AS total_mb",
        "FROM DataUsage",
        "WHERE YEAR(usage_date) = 2024 AND MONTH(usage_date) = 8",
        "GROUP BY circle",
        "ORDER BY SUM(mb_used) DESC, circle",
      ].join("\n"),
      [
        "SELECT circle, COUNT(DISTINCT subscriber_id) AS active_subscribers, SUM(mb_used) AS total_mb",
        "FROM DataUsage",
        "WHERE DATE_FORMAT(usage_date, '%Y-%m') = '2024-08'",
        "GROUP BY circle",
        "ORDER BY total_mb DESC, circle ASC",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Filter to August before grouping, so other months never reach the totals.",
      "One subscriber can have several rows in a circle; count them once.",
      "Two circles can have the same total — the second sort key settles them.",
    ],
    editorial: [
      "Filter, group, aggregate. The WHERE clause keeps August 2024 — `BETWEEN '2024-08-01' AND '2024-08-31'` includes the first and last day, and rows from 31 July or 1 September fall outside. The rows that remain are grouped by `circle`.",
      "",
      "Per circle, `SUM(mb_used)` is the volume and `COUNT(DISTINCT subscriber_id)` the number of subscribers: a subscriber with ten usage days still counts once, which plain `COUNT(*)` would get wrong. A roaming subscriber counts in every circle they used data in, because the grouping is by the usage row's circle.",
      "",
      "Circles with no August rows simply have no group and do not appear. The order is by the total descending with the circle's name breaking ties. `YEAR()`/`MONTH()` or `DATE_FORMAT(…, '%Y-%m')` express the same filter, though a plain range on the column is the one an index on `usage_date` can serve. The cost is one pass plus a small sort of the circles.",
    ].join("\n"),
  },

  {
    slug: "cell-tower-dropped-call-health",
    title: "Cell Tower Dropped-Call Health Check",
    difficulty: "EASY",
    topics: ["Basics", "Conditional Logic"],
    description: [
      "The network operations centre grades each cell tower on last month's dropped calls. The drop rate is `100 * dropped_calls / total_calls`.",
      "",
      "Return every tower with the columns `tower_id`, `site_name`, `drop_rate` (the rate **rounded to 2 decimals**, or NULL for a tower with no calls) and `health`: `'no traffic'` when `total_calls` is 0, `'critical'` when the rate is **3 or more**, `'watch'` when it is **1.5 or more**, otherwise `'healthy'`. Grade on the exact, unrounded rate. Order by `tower_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Tower",
        columns: [
          { name: "tower_id", type: "int" },
          { name: "site_name", type: "varchar" },
          { name: "total_calls", type: "int" },
          { name: "dropped_calls", type: "int" },
        ],
        primaryKey: ["tower_id"],
        note: "Last month's call counts per tower; `dropped_calls` is never more than `total_calls`.",
      },
    ],
    examples: [
      {
        Tower: [
          [1, "Koramangala-01", 2000, 70],
          [2, "Whitefield-04", 1500, 45],
          [3, "HSR Layout-02", 800, 12],
          [4, "Indiranagar-03", 1200, 17],
          [5, "Jayanagar-05", 0, 0],
          [6, "Marathahalli-02", 950, 20],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const rows = seq(1, n).map((id) => {
        const total = chance(rng, 0.12) ? 0 : roundTo(rng, 100, 3000, 50);
        let dropped = ri(rng, 0, Math.floor(total * 0.05));
        // Aim at the grade boundaries when they land on whole calls.
        if (chance(rng, 0.25) && (total * 3) % 100 === 0) dropped = (total * 3) / 100;
        else if (chance(rng, 0.25) && (total * 3) % 200 === 0) dropped = (total * 3) / 200;
        return [id, `${pick(rng, SITES)}-${pad2(ri(rng, 1, 9))}`, total, dropped];
      });
      return { Tower: rows };
    },
    solution: [
      "SELECT tower_id, site_name,",
      "       ROUND(100 * dropped_calls / NULLIF(total_calls, 0), 2) AS drop_rate,",
      "       CASE",
      "         WHEN total_calls = 0 THEN 'no traffic'",
      "         WHEN dropped_calls * 100 >= total_calls * 3 THEN 'critical'",
      "         WHEN dropped_calls * 200 >= total_calls * 3 THEN 'watch'",
      "         ELSE 'healthy'",
      "       END AS health",
      "FROM Tower",
      "ORDER BY tower_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT tower_id, site_name,",
        "       IF(total_calls = 0, NULL, ROUND(100 * dropped_calls / total_calls, 2)) AS drop_rate,",
        "       IF(total_calls = 0, 'no traffic',",
        "          IF(100 * dropped_calls / total_calls >= 3, 'critical',",
        "             IF(100 * dropped_calls / total_calls >= 1.5, 'watch', 'healthy'))) AS health",
        "FROM Tower",
        "ORDER BY tower_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "A tower with zero calls would divide by zero — handle it first, and let `NULLIF` turn the divisor into NULL.",
      "CASE tests its branches in order, so put the strictest grade first.",
      "Grading on the rounded number can put a 2.996% tower in the wrong band; compare the exact rate.",
    ],
    editorial: [
      "Two derived columns over one table, so no join or grouping is needed.",
      "",
      "`drop_rate` divides dropped by total calls. `NULLIF(total_calls, 0)` turns a zero divisor into NULL, and any arithmetic with NULL is NULL, so a silent tower gets a NULL rate rather than an error or a misleading 0. The rate is rounded to two decimals only for display.",
      "",
      "`health` is a CASE whose branches are tried top to bottom: the zero-traffic case first, then critical (rate ≥ 3), then watch (rate ≥ 1.5), and healthy as the fallback. Because the first true branch wins, the watch test does not need an upper bound. The reference compares in integers — `dropped_calls * 100 >= total_calls * 3` is the rate ≥ 3 without any division — so a tower at exactly 3.00% or 1.50% lands in the higher band and no rounding can move it. Comparing the exact quotient, as the IF version does, gives the same grades. One pass over the table.",
    ].join("\n"),
  },

  {
    slug: "masked-mobile-numbers-on-bill-statements",
    title: "Masked Mobile Numbers on Bill Statements",
    difficulty: "EASY",
    topics: ["Strings"],
    description: [
      "Printed bill statements must not show a customer's full mobile number. The CRM stores numbers in three shapes: ten digits (`9845012345`), with a trunk prefix (`09845012345`) or with the country code (`+919845012345`). The last ten characters are always the number itself.",
      "",
      "Return `customer_id`, `name` and `masked_mobile`: the **first two and last two digits of the ten-digit number with the six digits between replaced by `XXXXXX`**, e.g. `98XXXXXX45`. Order by `customer_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Customer",
        columns: [
          { name: "customer_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "mobile_number", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["customer_id"],
        note: "`mobile_number` is ten digits, optionally preceded by `0` or `+91`.",
      },
    ],
    examples: [
      {
        Customer: [
          [1, "Ananya", "9845012345", "Bengaluru"],
          [2, "Kabir", "+919900123456", "Mumbai"],
          [3, "Sneha", "08123456789", "Pune"],
          [4, "Vikram", "+917019988776", "Delhi"],
          [5, "Zara", "9731122309", "Kochi"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const who = names(rng, n);
      const rows = seq(1, n).map((id, i) => {
        const prefix = pick(rng, ["", "", "0", "+91"]);
        return [id, who[i]!, prefix + mobile(rng), pick(rng, ["Bengaluru", "Mumbai", "Delhi", "Pune", "Kochi", "Jaipur"])];
      });
      return { Customer: rows };
    },
    solution: [
      "SELECT customer_id, name,",
      "       CONCAT(LEFT(RIGHT(mobile_number, 10), 2), 'XXXXXX', RIGHT(mobile_number, 2)) AS masked_mobile",
      "FROM Customer",
      "ORDER BY customer_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT customer_id, name,",
        "       CONCAT(SUBSTRING(mobile_number, CHAR_LENGTH(mobile_number) - 9, 2), REPEAT('X', 6),",
        "              SUBSTRING(mobile_number, CHAR_LENGTH(mobile_number) - 1, 2)) AS masked_mobile",
        "FROM Customer",
        "ORDER BY customer_id",
      ].join("\n"),
      [
        "SELECT customer_id, name,",
        "       CASE",
        "         WHEN mobile_number LIKE '+91%' THEN CONCAT(SUBSTRING(mobile_number, 4, 2), 'XXXXXX', RIGHT(mobile_number, 2))",
        "         WHEN CHAR_LENGTH(mobile_number) = 11 THEN CONCAT(SUBSTRING(mobile_number, 2, 2), 'XXXXXX', RIGHT(mobile_number, 2))",
        "         ELSE CONCAT(LEFT(mobile_number, 2), 'XXXXXX', RIGHT(mobile_number, 2))",
        "       END AS masked_mobile",
        "FROM Customer",
        "ORDER BY customer_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The prefixes differ, but the last ten characters are always the bare number.",
      "`RIGHT(s, 10)` strips any prefix; take the first two characters of that.",
      "Glue the pieces together with `CONCAT`.",
    ],
    editorial: [
      "The trick is to normalise before masking. Whatever prefix a number carries — none, `0` or `+91` — its last ten characters are the subscriber's number, so `RIGHT(mobile_number, 10)` gives a clean ten-digit string for every row.",
      "",
      "From there the mask is three pieces: the first two digits of the clean number (`LEFT(…, 2)`), the literal `XXXXXX`, and the last two digits, which are also the last two of the raw value (`RIGHT(mobile_number, 2)`). `CONCAT` joins them.",
      "",
      "Positions counted from the end work just as well: the clean number starts at character `CHAR_LENGTH(mobile_number) - 9`. A CASE on the three shapes is the most literal reading of the statement, but it has to know every format in advance, while the RIGHT version keeps working if a fourth prefix ever appears. Every form is a per-row string operation, so the cost is one pass.",
    ].join("\n"),
  },
  {
    slug: "completed-port-outs-by-recipient-operator",
    title: "Completed Port-Outs by Recipient Operator",
    difficulty: "EASY",
    topics: ["Basics", "Aggregation"],
    description: [
      "Nimbus Mobile tracks every mobile number portability request in which it is either the donor (the number leaves) or the recipient (the number joins). The churn team wants to know who is winning its customers.",
      "",
      "Count the **completed** requests in **2024** (by `requested_on`) where `donor_operator` is `'Nimbus Mobile'`, per recipient. Return `recipient_operator` and `port_outs`, ordered by `port_outs` from highest to lowest, then by `recipient_operator` alphabetically. Operators that took no completed port-out do not appear.",
    ].join("\n"),
    tables: [
      {
        name: "PortRequest",
        columns: [
          { name: "request_id", type: "int" },
          { name: "mobile_number", type: "varchar" },
          { name: "donor_operator", type: "varchar" },
          { name: "recipient_operator", type: "varchar" },
          { name: "requested_on", type: "date" },
          { name: "status", type: "enum", values: ["completed", "rejected", "pending", "withdrawn"] },
        ],
        primaryKey: ["request_id"],
        note: "One row per porting request. The donor is the operator the number is leaving, the recipient the one it moves to.",
      },
    ],
    examples: [
      {
        PortRequest: [
          [1, "9845012345", "Nimbus Mobile", "Tara Telecom", "2024-02-11", "completed"],
          [2, "9900123456", "Nimbus Mobile", "Vega Wireless", "2024-03-02", "completed"],
          [3, "9731122334", "Tara Telecom", "Nimbus Mobile", "2024-03-05", "completed"],
          [4, "8123456789", "Nimbus Mobile", "Tara Telecom", "2024-04-19", "rejected"],
          [5, "7019988776", "Nimbus Mobile", "Vega Wireless", "2024-05-23", "completed"],
          [6, "9611223344", "Nimbus Mobile", "Sanchar One", "2023-12-30", "completed"],
          [7, "9886655443", "Nimbus Mobile", "Tara Telecom", "2024-06-01", "completed"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      const rows = seq(1, n).map((id) => {
        const donor = chance(rng, 0.7) ? "Nimbus Mobile" : pick(rng, OPERATORS.slice(1));
        const recipient = donor === "Nimbus Mobile" ? pick(rng, OPERATORS.slice(1)) : chance(rng, 0.6) ? "Nimbus Mobile" : pick(rng, OPERATORS.slice(1).filter((o) => o !== donor));
        const date = chance(rng, 0.2) ? pick(rng, ["2023-12-31", "2024-01-01", "2024-12-31", "2025-01-01"]) : dateBetween(rng, "2023-11-01", "2025-01-31");
        return [id, mobile(rng), donor, recipient, date, pick(rng, ["completed", "completed", "completed", "rejected", "pending", "withdrawn"])];
      });
      return { PortRequest: rows };
    },
    solution: [
      "SELECT recipient_operator, COUNT(*) AS port_outs",
      "FROM PortRequest",
      "WHERE donor_operator = 'Nimbus Mobile'",
      "  AND status = 'completed'",
      "  AND requested_on BETWEEN '2024-01-01' AND '2024-12-31'",
      "GROUP BY recipient_operator",
      "ORDER BY port_outs DESC, recipient_operator",
    ].join("\n"),
    alternatives: [
      [
        "SELECT recipient_operator, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS port_outs",
        "FROM PortRequest",
        "WHERE donor_operator = 'Nimbus Mobile' AND YEAR(requested_on) = 2024",
        "GROUP BY recipient_operator",
        "HAVING SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) > 0",
        "ORDER BY port_outs DESC, recipient_operator",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Three conditions narrow the rows: who the donor is, the status, and the year.",
      "Group what is left by the recipient and count the rows.",
      "Two recipients can take the same number of customers — sort by name after the count.",
    ],
    editorial: [
      "The question is a filtered count per group. The WHERE clause keeps only the rows that are a port-out from Nimbus Mobile (`donor_operator = 'Nimbus Mobile'` — a port-in has Nimbus as the recipient instead), that actually completed (rejected, pending and withdrawn requests did not move a customer), and that were requested in 2024 (`BETWEEN '2024-01-01' AND '2024-12-31'`, both ends included).",
      "",
      "The remaining rows are grouped by `recipient_operator` and counted. Because the filter runs before grouping, an operator whose only requests were rejected has no row left and no group, which is what the statement asks for.",
      "",
      "Counting with conditional aggregation — `SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)` — and dropping the zero groups with HAVING gives the same answer and is the pattern to reach for when several statuses need their own columns. The cost is one scan and a sort of a handful of operators.",
    ].join("\n"),
  },

  {
    slug: "electricity-bills-paid-after-due-date",
    title: "Electricity Bills Paid After the Due Date",
    difficulty: "EASY",
    topics: ["Joins", "Dates"],
    description: [
      "The distribution company's collections desk reviews bills that were settled late. Each bill is paid in full by at most one payment; some bills are still unpaid.",
      "",
      "Return every bill **paid strictly after its `due_date`**, with the columns `bill_id`, `consumer_no`, `due_date`, `paid_on` and `days_late` (the number of days between the due date and the payment). A payment on the due date is on time; unpaid bills are not in the answer. Order by `days_late` from highest to lowest, then by `bill_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Bill",
        columns: [
          { name: "bill_id", type: "int" },
          { name: "consumer_no", type: "int" },
          { name: "bill_month", type: "date" },
          { name: "amount", type: "int" },
          { name: "due_date", type: "date" },
        ],
        primaryKey: ["bill_id"],
        note: "One monthly electricity bill; `bill_month` is the first day of the month billed, `amount` is in rupees.",
      },
      {
        name: "Payment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "bill_id", type: "int" },
          { name: "paid_on", type: "date" },
          { name: "amount_paid", type: "int" },
        ],
        primaryKey: ["payment_id"],
        note: "A bill has at most one payment, and every `bill_id` here is in `Bill`.",
      },
    ],
    examples: [
      {
        Bill: [
          [1, 50011, "2024-05-01", 1240, "2024-05-20"],
          [2, 50011, "2024-06-01", 1385, "2024-06-20"],
          [3, 50027, "2024-05-01", 860, "2024-05-20"],
          [4, 50027, "2024-06-01", 910, "2024-06-20"],
          [5, 50034, "2024-06-01", 2210, "2024-06-20"],
          [6, 50034, "2024-05-01", 1990, "2024-05-20"],
        ],
        Payment: [
          [1, 1, "2024-05-18", 1240],
          [2, 2, "2024-06-25", 1385],
          [3, 3, "2024-05-20", 860],
          [4, 4, "2024-06-27", 910],
          [5, 6, "2024-06-01", 1990],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const consumers = sample(rng, seq(50001, 60), ri(rng, 1, 5));
      const bills: Cell[][] = [];
      const pays: Cell[][] = [];
      for (const id of seq(1, n)) {
        const month = `2024-${pad2(ri(rng, 1, 9))}-01`;
        const due = addDays(month, 19);
        const amount = roundTo(rng, 400, 3500, 5);
        bills.push([id, pick(rng, consumers), month, amount, due]);
        if (chance(rng, 0.8)) {
          const offset = chance(rng, 0.2) ? pick(rng, [0, 1]) : ri(rng, -10, 15);
          pays.push([pays.length + 1, id, addDays(due, offset), amount]);
        }
      }
      return { Bill: bills, Payment: pays };
    },
    solution: [
      "SELECT b.bill_id, b.consumer_no, b.due_date, p.paid_on,",
      "       DATEDIFF(p.paid_on, b.due_date) AS days_late",
      "FROM Bill b",
      "JOIN Payment p ON p.bill_id = b.bill_id",
      "WHERE p.paid_on > b.due_date",
      "ORDER BY days_late DESC, b.bill_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT b.bill_id, b.consumer_no, b.due_date, p.paid_on, DATEDIFF(p.paid_on, b.due_date) AS days_late",
        "FROM Bill b, Payment p",
        "WHERE p.bill_id = b.bill_id AND DATEDIFF(p.paid_on, b.due_date) > 0",
        "ORDER BY DATEDIFF(p.paid_on, b.due_date) DESC, b.bill_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The due date lives on the bill and the payment date on the payment — join them on `bill_id`.",
      "An inner join leaves unpaid bills out by itself.",
      "`DATEDIFF(later, earlier)` gives the days between two dates.",
    ],
    editorial: [
      "The two dates that decide lateness are in different tables, so the first step is an inner join of `Bill` and `Payment` on `bill_id`. Each payment finds its one bill; a bill with no payment has no partner and drops out, which is what the statement wants for unpaid bills.",
      "",
      "Lateness is then a strict comparison, `paid_on > due_date`: a payment on the due date itself is on time. `DATEDIFF(paid_on, due_date)` gives the delay in days — note the argument order, later date first, or the numbers come out negative. Filtering on `DATEDIFF(…) > 0` is the same test.",
      "",
      "The order is by the delay, longest first, with `bill_id` deciding between bills that are equally late. With an index on `Payment.bill_id` the join is one lookup per payment, and the sort is over the late bills only.",
    ].join("\n"),
  },

  {
    slug: "power-outages-lasting-four-hours",
    title: "Power Outages Lasting Four Hours or More",
    difficulty: "EASY",
    topics: ["Dates", "Basics"],
    description: [
      "Under the state regulator's supply code, an outage of **four hours or more** on a feeder has to be explained in the monthly reliability report. Outages still in progress have `restored_at` NULL.",
      "",
      "Return every **restored** outage whose duration is at least 240 minutes, with the columns `outage_id`, `feeder_code` and `duration_minutes` — the whole minutes from `started_at` to `restored_at`, a partial minute dropped. Order by `duration_minutes` from longest to shortest, then by `outage_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Outage",
        columns: [
          { name: "outage_id", type: "int" },
          { name: "feeder_code", type: "varchar" },
          { name: "started_at", type: "datetime" },
          { name: "restored_at", type: "datetime" },
        ],
        primaryKey: ["outage_id"],
        note: "One row per supply interruption on an 11 kV feeder; `restored_at` is NULL while the outage continues.",
      },
    ],
    examples: [
      {
        Outage: [
          [1, "BLR-F11", "2024-07-02 09:15:00", "2024-07-02 13:15:00"],
          [2, "BLR-F12", "2024-07-02 22:40:00", "2024-07-03 04:05:00"],
          [3, "BLR-F27", "2024-07-03 11:00:00", "2024-07-03 14:59:30"],
          [4, "MYS-F04", "2024-07-04 06:00:00", null],
          [5, "HBL-F09", "2024-07-05 15:20:00", "2024-07-05 16:05:00"],
          [6, "BLR-F11", "2024-07-06 01:00:00", "2024-07-06 06:25:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const rows = seq(1, n).map((id) => {
        const start = stamp(dateBetween(rng, "2024-07-01", "2024-07-31"), ri(rng, 0, 23), ri(rng, 0, 59), pick(rng, [0, 0, 30]));
        const minutes = chance(rng, 0.3) ? pick(rng, [239, 240, 241]) : ri(rng, 10, 600);
        const seconds = pick(rng, [0, 0, 0, 30, 59]);
        const end = chance(rng, 0.12) ? null : addMinutes(start, minutes).slice(0, 17) + pad2(seconds);
        return [id, pick(rng, FEEDERS), start, end];
      });
      return { Outage: rows };
    },
    solution: [
      "SELECT outage_id, feeder_code, TIMESTAMPDIFF(MINUTE, started_at, restored_at) AS duration_minutes",
      "FROM Outage",
      "WHERE restored_at IS NOT NULL",
      "  AND TIMESTAMPDIFF(MINUTE, started_at, restored_at) >= 240",
      "ORDER BY duration_minutes DESC, outage_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT outage_id, feeder_code, FLOOR(TIMESTAMPDIFF(SECOND, started_at, restored_at) / 60) AS duration_minutes",
        "FROM Outage",
        "WHERE restored_at >= DATE_ADD(started_at, INTERVAL 240 MINUTE)",
        "ORDER BY duration_minutes DESC, outage_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`TIMESTAMPDIFF(MINUTE, start, end)` counts whole minutes and drops the remainder.",
      "An outage with no restoration time has no duration yet — make sure it cannot slip in.",
      "Four hours is 240 minutes, and exactly 240 qualifies.",
    ],
    editorial: [
      "`TIMESTAMPDIFF(MINUTE, started_at, restored_at)` returns the number of complete minutes between the two timestamps, so an outage of 3 hours 59 minutes 30 seconds is 239 minutes and stays out, while one of exactly four hours is 240 and is reported — the `>=` matters.",
      "",
      "Ongoing outages have `restored_at` NULL. Any function of NULL is NULL and a NULL comparison is never true, so they would drop out even without the explicit `IS NOT NULL`; writing it anyway documents the intent.",
      "",
      "The second query reaches the same rows without computing a duration in the filter: `restored_at >= DATE_ADD(started_at, INTERVAL 240 MINUTE)` is exactly \"at least four hours later\", and whole seconds divided by 60 and rounded down with `FLOOR` gives the same truncated minutes. Equal durations are ordered by `outage_id`. One pass over the table.",
    ].join("\n"),
  },

  {
    slug: "slab-tariff-electricity-energy-charges",
    title: "Slab Tariff Energy Charges",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Basics"],
    description: [
      "The electricity board bills domestic consumers on a **telescopic slab tariff**: the first 100 units of a month cost ₹3 each, units 101 to 200 cost ₹5 each, and every unit above 200 costs ₹8. Commercial connections pay a flat ₹9 for every unit.",
      "",
      "For every row of `Consumption`, return `consumer_no`, `bill_month` and `energy_charge` in rupees. A domestic consumer using 160 units pays 100 × 3 + 60 × 5 = ₹600. Order by `consumer_no`, then `bill_month`.",
    ].join("\n"),
    tables: [
      {
        name: "Consumption",
        columns: [
          { name: "consumer_no", type: "int" },
          { name: "bill_month", type: "date" },
          { name: "category", type: "enum", values: ["domestic", "commercial"] },
          { name: "units", type: "int" },
        ],
        primaryKey: ["consumer_no", "bill_month"],
        note: "Units (kWh) consumed by one connection in one month; `bill_month` is the first day of that month.",
      },
    ],
    examples: [
      {
        Consumption: [
          [50011, "2024-06-01", "domestic", 85],
          [50011, "2024-07-01", "domestic", 100],
          [50027, "2024-06-01", "domestic", 160],
          [50027, "2024-07-01", "domestic", 200],
          [50034, "2024-06-01", "domestic", 275],
          [50034, "2024-07-01", "domestic", 0],
          [61002, "2024-06-01", "commercial", 150],
        ],
      },
    ],
    gen: (rng) => {
      const consumers = sample(rng, seq(50001, 40), ri(rng, 1, 6));
      const rows: Cell[][] = [];
      for (const c of consumers) {
        const category = chance(rng, 0.25) ? "commercial" : "domestic";
        for (const month of sample(rng, ["2024-05-01", "2024-06-01", "2024-07-01", "2024-08-01"], ri(rng, 1, 4))) {
          const units = chance(rng, 0.3) ? pick(rng, [0, 100, 101, 200, 201]) : ri(rng, 0, 450);
          rows.push([c, month, category, units]);
        }
      }
      return { Consumption: rows };
    },
    solution: [
      "SELECT consumer_no, bill_month,",
      "       CASE",
      "         WHEN category = 'commercial' THEN units * 9",
      "         WHEN units <= 100 THEN units * 3",
      "         WHEN units <= 200 THEN 300 + (units - 100) * 5",
      "         ELSE 800 + (units - 200) * 8",
      "       END AS energy_charge",
      "FROM Consumption",
      "ORDER BY consumer_no, bill_month",
    ].join("\n"),
    alternatives: [
      [
        "SELECT consumer_no, bill_month,",
        "       IF(category = 'commercial', units * 9,",
        "          LEAST(units, 100) * 3",
        "          + LEAST(GREATEST(units - 100, 0), 100) * 5",
        "          + GREATEST(units - 200, 0) * 8) AS energy_charge",
        "FROM Consumption",
        "ORDER BY consumer_no, bill_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Telescopic means each slab's rate applies only to the units inside that slab, not to the whole consumption.",
      "Work out the charge for a full first slab (₹300) and full first two slabs (₹800) once; the rest is the remainder at the next rate.",
      "Alternatively, the units in each slab are `LEAST`/`GREATEST` of the total and the slab's bounds.",
    ],
    editorial: [
      "A telescopic tariff charges each slice of consumption at its own slab's rate. The CASE version picks the slab the total falls in and adds the fixed cost of all the full slabs below it: up to 100 units it is `units * 3`; up to 200 it is ₹300 for the first slab plus `(units - 100) * 5`; above 200 it is ₹300 + ₹500 = ₹800 plus `(units - 200) * 8`. Commercial rows are caught by the first branch and pay the flat rate. Because CASE stops at the first true branch, the later conditions need no lower bounds.",
      "",
      "The boundary units matter: 100 units is ₹300 and 101 is ₹305, 200 is ₹800 and 201 is ₹808 — the hidden data tests these.",
      "",
      "The alternative computes the units in each slab directly — `LEAST(units, 100)` in the first, `LEAST(GREATEST(units - 100, 0), 100)` in the second, `GREATEST(units - 200, 0)` in the third — and sums slab units times rates. It generalises nicely to many slabs. Both are a per-row calculation, one pass over the table.",
    ].join("\n"),
  },

  {
    slug: "units-consumed-from-cumulative-meter-readings",
    title: "Units Consumed From Cumulative Meter Readings",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates"],
    description: [
      "A smart meter reports a **cumulative** kWh register: each reading is the total since installation, so the units used in a billing cycle are the difference between a reading and the same meter's previous reading.",
      "",
      "For every reading that has an earlier reading of the same meter, return `meter_id`, `reading_date`, `days_in_cycle` (days since the previous reading) and `units_used` (this reading minus the previous one). A meter's first reading has nothing to compare with and is left out. Order by `meter_id`, then `reading_date`.",
    ].join("\n"),
    tables: [
      {
        name: "MeterReading",
        columns: [
          { name: "meter_id", type: "varchar" },
          { name: "reading_date", type: "date" },
          { name: "reading_kwh", type: "int" },
        ],
        primaryKey: ["meter_id", "reading_date"],
        note: "One reading per meter per day at most; the register never goes down.",
      },
    ],
    examples: [
      {
        MeterReading: [
          ["M-1001", "2024-04-01", 15230],
          ["M-1001", "2024-05-02", 15418],
          ["M-1001", "2024-06-01", 15620],
          ["M-1002", "2024-04-03", 8890],
          ["M-1002", "2024-05-03", 9001],
          ["M-1003", "2024-05-10", 410],
          ["M-1002", "2024-06-04", 9001],
        ],
      },
    ],
    gen: (rng) => {
      const meters = sample(rng, ["M-1001", "M-1002", "M-1003", "M-1004", "M-1005", "M-1006"], ri(rng, 1, 5));
      const rows: Cell[][] = [];
      for (const m of meters) {
        let date = dateBetween(rng, "2024-01-01", "2024-02-15");
        let kwh = ri(rng, 100, 20000);
        for (let k = ri(rng, 1, 6); k > 0; k--) {
          rows.push([m, date, kwh]);
          date = addDays(date, ri(rng, 26, 35));
          kwh += chance(rng, 0.1) ? 0 : ri(rng, 20, 450);
        }
      }
      return { MeterReading: rows };
    },
    solution: [
      "WITH r AS (",
      "  SELECT meter_id, reading_date, reading_kwh,",
      "         LAG(reading_date) OVER (PARTITION BY meter_id ORDER BY reading_date) AS prev_date,",
      "         LAG(reading_kwh) OVER (PARTITION BY meter_id ORDER BY reading_date) AS prev_kwh",
      "  FROM MeterReading",
      ")",
      "SELECT meter_id, reading_date,",
      "       DATEDIFF(reading_date, prev_date) AS days_in_cycle,",
      "       reading_kwh - prev_kwh AS units_used",
      "FROM r",
      "WHERE prev_date IS NOT NULL",
      "ORDER BY meter_id, reading_date",
    ].join("\n"),
    alternatives: [
      [
        "SELECT cur.meter_id, cur.reading_date,",
        "       DATEDIFF(cur.reading_date, prev.reading_date) AS days_in_cycle,",
        "       cur.reading_kwh - prev.reading_kwh AS units_used",
        "FROM MeterReading cur",
        "JOIN MeterReading prev",
        "  ON prev.meter_id = cur.meter_id",
        " AND prev.reading_date = (SELECT MAX(p.reading_date) FROM MeterReading p",
        "                          WHERE p.meter_id = cur.meter_id AND p.reading_date < cur.reading_date)",
        "ORDER BY cur.meter_id, cur.reading_date",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Each row needs a value from the row before it — of the same meter, in date order.",
      "`LAG(col) OVER (PARTITION BY … ORDER BY …)` hands you the previous row's value; it is NULL on the first row of each partition.",
      "Window functions cannot appear in WHERE, so compute them in a CTE and filter outside.",
    ],
    editorial: [
      "Consumption is a difference between consecutive readings, which is what `LAG` is for. Partitioning by `meter_id` keeps each meter's readings separate, and ordering by `reading_date` makes \"previous\" mean the reading just before in time. Two LAGs fetch the previous date and the previous register value on the same row.",
      "",
      "A meter's first reading has NULL for both, so the outer query drops it with `prev_date IS NOT NULL` — a window result can only be filtered after it is computed, hence the CTE. `DATEDIFF` gives the cycle length and the subtraction the units. A reading equal to the previous one is a real zero-consumption cycle (a locked house) and stays in the answer with `units_used` 0.",
      "",
      "Without window functions, a self join can find the previous reading as the latest date before the current one with a correlated `MAX`. It reads the table once per reading and is noticeably slower on long histories; the window version is one sort per meter.",
    ].join("\n"),
  },
  {
    slug: "most-recharged-plan-in-each-circle",
    title: "Most Recharged Prepaid Plan in Each Circle",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "Product managers decide which prepaid plan to feature on each circle's home screen by how often it is bought there.",
      "",
      "For each `circle`, return the plan or plans with the **most recharges** in that circle, with the columns `circle`, `plan_code` and `recharges` (the number of recharge rows for that plan in that circle). When several plans tie for the top count in a circle, return **all of them**. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Recharge",
        columns: [
          { name: "recharge_id", type: "int" },
          { name: "subscriber_id", type: "int" },
          { name: "circle", type: "varchar" },
          { name: "plan_code", type: "varchar" },
          { name: "amount", type: "int" },
          { name: "recharge_date", type: "date" },
        ],
        primaryKey: ["recharge_id"],
        note: "One row per recharge; `plan_code` names the plan (`P299` is the ₹299 plan).",
      },
    ],
    examples: [
      {
        Recharge: [
          [1, 1, "Karnataka", "P299", 299, "2024-04-02"],
          [2, 2, "Karnataka", "P299", 299, "2024-04-05"],
          [3, 3, "Karnataka", "P719", 719, "2024-04-07"],
          [4, 4, "Kerala", "P299", 299, "2024-04-08"],
          [5, 5, "Kerala", "P579", 579, "2024-04-09"],
          [6, 6, "Delhi NCR", "P98", 98, "2024-04-10"],
          [7, 6, "Delhi NCR", "P98", 98, "2024-04-20"],
          [8, 7, "Delhi NCR", "P299", 299, "2024-04-21"],
          [9, 8, "Delhi NCR", "P98", 98, "2024-04-22"],
          [10, 9, "Delhi NCR", "P299", 299, "2024-04-25"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 26);
      const circles = sample(rng, CIRCLES, ri(rng, 1, 4));
      const plans = sample(rng, ["P98", "P299", "P579", "P719", "P1799"], ri(rng, 2, 4));
      const rows = seq(1, n).map((id) => {
        const plan = pick(rng, plans);
        return [id, ri(rng, 1, 15), pick(rng, circles), plan, Number(plan.slice(1)), dateBetween(rng, "2024-04-01", "2024-06-30")];
      });
      return { Recharge: rows };
    },
    solution: [
      "WITH counts AS (",
      "  SELECT circle, plan_code, COUNT(*) AS recharges,",
      "         RANK() OVER (PARTITION BY circle ORDER BY COUNT(*) DESC) AS rk",
      "  FROM Recharge",
      "  GROUP BY circle, plan_code",
      ")",
      "SELECT circle, plan_code, recharges",
      "FROM counts",
      "WHERE rk = 1",
    ].join("\n"),
    alternatives: [
      [
        "WITH counts AS (",
        "  SELECT circle, plan_code, COUNT(*) AS recharges FROM Recharge GROUP BY circle, plan_code",
        "), best AS (",
        "  SELECT circle, MAX(recharges) AS top FROM counts GROUP BY circle",
        ")",
        "SELECT c.circle, c.plan_code, c.recharges",
        "FROM counts c JOIN best b ON b.circle = c.circle AND b.top = c.recharges",
      ].join("\n"),
      [
        "WITH counts AS (",
        "  SELECT circle, plan_code, COUNT(*) AS recharges FROM Recharge GROUP BY circle, plan_code",
        ")",
        "SELECT circle, plan_code, recharges FROM counts c",
        "WHERE NOT EXISTS (SELECT 1 FROM counts o WHERE o.circle = c.circle AND o.recharges > c.recharges)",
      ].join("\n"),
    ],
    hints: [
      "First count recharges per (circle, plan).",
      "Then, inside each circle, find the counts that equal the circle's highest count.",
      "`RANK()` gives every tied row the same rank, so rank 1 keeps all the leaders; `ROW_NUMBER()` would keep just one.",
    ],
    editorial: [
      "Two steps: aggregate, then pick the top of each group. Grouping by `(circle, plan_code)` and counting gives each plan's popularity per circle.",
      "",
      "To keep the leaders, rank the counts within each circle — a window over the grouped rows, `RANK() OVER (PARTITION BY circle ORDER BY COUNT(*) DESC)`, is allowed in the same SELECT because window functions run after GROUP BY. `RANK` gives tied counts the same rank, so every plan sharing the top count gets rank 1, as the statement requires; `ROW_NUMBER` would pick one of them arbitrarily and make the answer depend on storage order.",
      "",
      "Without windows, compute each circle's maximum count in a second CTE and join it back, or keep a count when no other plan of the same circle has a higher one (`NOT EXISTS`). All three read the table once to aggregate; the remaining work is over the small table of counts.",
    ].join("\n"),
  },

  {
    slug: "data-users-above-their-circle-average",
    title: "Data Users Above Their Circle's Average",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation"],
    description: [
      "Marketing wants to upsell a bigger data pack to subscribers who use more than is typical where they live. A subscriber's August usage is the sum of their `mb_used` in **August 2024**; the typical figure for a circle is the **average August usage of that circle's subscribers who used any data in August**.",
      "",
      "Return the subscribers whose August usage is **strictly greater** than the average for their own `circle`, with the columns `subscriber_id`, `name`, `circle` and `total_mb`. Subscribers with no August usage take no part. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Subscriber",
        columns: [
          { name: "subscriber_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "circle", type: "varchar" },
        ],
        primaryKey: ["subscriber_id"],
        note: "`circle` is the subscriber's home circle.",
      },
      {
        name: "DataUsage",
        columns: [
          { name: "usage_id", type: "int" },
          { name: "subscriber_id", type: "int" },
          { name: "usage_date", type: "date" },
          { name: "mb_used", type: "int" },
        ],
        primaryKey: ["usage_id"],
        note: "Mobile data used by a subscriber in one session; every `subscriber_id` is in `Subscriber`.",
      },
    ],
    examples: [
      {
        Subscriber: [
          [1, "Aarav", "Karnataka"],
          [2, "Diya", "Karnataka"],
          [3, "Ishaan", "Karnataka"],
          [4, "Kavya", "Kerala"],
          [5, "Neha", "Kerala"],
          [6, "Rahul", "Gujarat"],
          [7, "Riya", "Karnataka"],
          [8, "Sneha", "Gujarat"],
        ],
        DataUsage: [
          [1, 1, "2024-08-03", 3000],
          [2, 1, "2024-08-20", 1200],
          [3, 2, "2024-08-10", 1500],
          [4, 3, "2024-08-11", 2100],
          [5, 3, "2024-07-30", 9000],
          [6, 4, "2024-08-15", 2000],
          [7, 5, "2024-08-31", 2000],
          [8, 6, "2024-08-01", 800],
          [9, 7, "2024-09-01", 5000],
          [10, 8, "2024-08-09", 300],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const who = names(rng, n);
      const circles = sample(rng, CIRCLES, ri(rng, 1, 3));
      const subs = seq(1, n).map((id, i) => [id, who[i]!, pick(rng, circles)]);
      const m = ri(rng, 1, 25);
      const usage = seq(1, m).map((id) => {
        const date = chance(rng, 0.2) ? pick(rng, ["2024-07-31", "2024-08-01", "2024-08-31", "2024-09-01"]) : dateBetween(rng, "2024-07-20", "2024-09-10");
        return [id, ri(rng, 1, n), date, roundTo(rng, 100, 4000, 500)];
      });
      return { Subscriber: subs, DataUsage: usage };
    },
    solution: [
      "WITH totals AS (",
      "  SELECT s.subscriber_id, s.name, s.circle, SUM(d.mb_used) AS total_mb",
      "  FROM Subscriber s",
      "  JOIN DataUsage d ON d.subscriber_id = s.subscriber_id",
      "  WHERE d.usage_date BETWEEN '2024-08-01' AND '2024-08-31'",
      "  GROUP BY s.subscriber_id, s.name, s.circle",
      ")",
      "SELECT subscriber_id, name, circle, total_mb",
      "FROM totals t",
      "WHERE total_mb > (SELECT AVG(o.total_mb) FROM totals o WHERE o.circle = t.circle)",
    ].join("\n"),
    alternatives: [
      [
        "SELECT subscriber_id, name, circle, total_mb FROM (",
        "  SELECT s.subscriber_id, s.name, s.circle, SUM(d.mb_used) AS total_mb,",
        "         AVG(SUM(d.mb_used)) OVER (PARTITION BY s.circle) AS circle_avg",
        "  FROM Subscriber s JOIN DataUsage d ON d.subscriber_id = s.subscriber_id",
        "  WHERE d.usage_date >= '2024-08-01' AND d.usage_date < '2024-09-01'",
        "  GROUP BY s.subscriber_id, s.name, s.circle",
        ") x",
        "WHERE total_mb > circle_avg",
      ].join("\n"),
    ],
    hints: [
      "Build each subscriber's August total first — a CTE keeps it readable.",
      "The average is over subscribers' totals, not over individual usage rows: average the totals.",
      "A correlated subquery on the totals, matched on `circle`, gives each subscriber their own circle's average.",
    ],
    editorial: [
      "The comparison is between two aggregates at different levels, so build them in order. The CTE joins subscribers to their August usage — the date range drops July and September rows — and sums per subscriber. Subscribers with no August rows vanish in the inner join, so they are neither returned nor part of any average, as the statement says.",
      "",
      "The circle's typical usage is the average of those **totals**. Averaging the raw usage rows instead would weight a subscriber with ten sessions ten times and give a different number — a common mistake. The correlated subquery `(SELECT AVG(o.total_mb) FROM totals o WHERE o.circle = t.circle)` computes it per circle, and `>` is strict, so a circle where everyone used the same amount, or a circle of one, returns nobody.",
      "",
      "A window does the same in one level: `AVG(SUM(mb_used)) OVER (PARTITION BY circle)` averages the grouped sums per circle, and an outer query filters on it. Both read the usage once; the subquery version re-reads the small totals table per row, which is cheap here.",
    ].join("\n"),
  },

  {
    slug: "monthly-recharge-revenue-by-pack-type",
    title: "Monthly Recharge Revenue by Pack Type",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Dates", "Aggregation"],
    description: [
      "Finance wants a month-by-month revenue sheet with one column per kind of prepaid pack. Only recharges with `status = 'success'` earn revenue; failed and refunded ones count for nothing.",
      "",
      "Return one row per month that has at least one successful recharge, with the columns `month` (as `'YYYY-MM'`), `data_revenue`, `combo_revenue`, `talktime_revenue` and `total_revenue` — sums of `amount` in rupees, **0 (not NULL)** for a pack type with no successful recharge that month. Order by `month`.",
    ].join("\n"),
    tables: [
      {
        name: "Recharge",
        columns: [
          { name: "recharge_id", type: "int" },
          { name: "mobile_number", type: "varchar" },
          { name: "pack_type", type: "enum", values: ["data", "combo", "talktime"] },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["success", "failed", "refunded"] },
          { name: "recharge_date", type: "date" },
        ],
        primaryKey: ["recharge_id"],
        note: "One recharge attempt; `amount` is the pack's price in rupees.",
      },
    ],
    examples: [
      {
        Recharge: [
          [1, "9845012345", "combo", 299, "success", "2024-01-05"],
          [2, "9900123456", "data", 98, "success", "2024-01-17"],
          [3, "9731122334", "combo", 579, "failed", "2024-01-20"],
          [4, "9845012345", "talktime", 50, "success", "2024-01-31"],
          [5, "8123456789", "data", 19, "failed", "2024-02-03"],
          [6, "9900123456", "combo", 299, "success", "2024-03-01"],
          [7, "7019988776", "combo", 719, "refunded", "2024-03-09"],
          [8, "8123456789", "data", 98, "success", "2024-03-15"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      const numbers = Array.from({ length: 6 }, () => mobile(rng));
      const prices: Record<string, number[]> = { data: [19, 29, 98, 181], combo: [299, 579, 719], talktime: [10, 20, 50, 100] };
      const rows = seq(1, n).map((id) => {
        const type = pick(rng, ["data", "combo", "talktime"]);
        const date = chance(rng, 0.2) ? pick(rng, ["2024-01-31", "2024-02-01", "2024-02-29", "2024-03-01"]) : dateBetween(rng, "2023-12-15", "2024-04-30");
        return [id, pick(rng, numbers), type, pick(rng, prices[type]!), pick(rng, ["success", "success", "success", "failed", "refunded"]), date];
      });
      return { Recharge: rows };
    },
    solution: [
      "SELECT DATE_FORMAT(recharge_date, '%Y-%m') AS month,",
      "       SUM(CASE WHEN pack_type = 'data' THEN amount ELSE 0 END) AS data_revenue,",
      "       SUM(CASE WHEN pack_type = 'combo' THEN amount ELSE 0 END) AS combo_revenue,",
      "       SUM(CASE WHEN pack_type = 'talktime' THEN amount ELSE 0 END) AS talktime_revenue,",
      "       SUM(amount) AS total_revenue",
      "FROM Recharge",
      "WHERE status = 'success'",
      "GROUP BY DATE_FORMAT(recharge_date, '%Y-%m')",
      "ORDER BY month",
    ].join("\n"),
    alternatives: [
      [
        "SELECT LEFT(recharge_date, 7) AS month,",
        "       SUM(IF(status = 'success' AND pack_type = 'data', amount, 0)) AS data_revenue,",
        "       SUM(IF(status = 'success' AND pack_type = 'combo', amount, 0)) AS combo_revenue,",
        "       SUM(IF(status = 'success' AND pack_type = 'talktime', amount, 0)) AS talktime_revenue,",
        "       SUM(IF(status = 'success', amount, 0)) AS total_revenue",
        "FROM Recharge",
        "GROUP BY LEFT(recharge_date, 7)",
        "HAVING SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) > 0",
        "ORDER BY month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Group by the month, written as text with `DATE_FORMAT(date, '%Y-%m')`.",
      "Turn one column into three by summing a CASE that keeps the amount only for one pack type.",
      "`ELSE 0` is what makes an empty pack type 0 instead of NULL.",
    ],
    editorial: [
      "This is a pivot written with **conditional aggregation**. After keeping only successful recharges, the rows are grouped by month — `DATE_FORMAT(recharge_date, '%Y-%m')` turns a date into the `'2024-01'` key, so every day of a month lands in one group.",
      "",
      "Each revenue column is a `SUM` over a CASE that passes the amount through for its pack type and 0 for the others. The `ELSE 0` matters: without it the CASE yields NULL for other rows, and a month with no talktime sale would sum to NULL rather than 0. The total is just `SUM(amount)` of the successful rows.",
      "",
      "Because the filter runs before grouping, a month whose recharges all failed has no group and is absent. The alternative moves the status test into each IF and drops all-failed months with HAVING instead — equivalent, and the form you need if failed attempts should also be counted in another column. One pass over the table plus a sort of the months.",
    ].join("\n"),
  },

  {
    slug: "consumers-with-repeated-late-payment-fees",
    title: "Consumers With Repeated Late Payment Fees",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation"],
    description: [
      "When an electricity bill is paid after its due date, the payment carries a `late_fee`. The vigilance team follows up with consumers who keep paying late.",
      "",
      "Considering only payments made in **2024** (by `paid_on`), return each consumer with **at least two payments carrying a late fee greater than 0**, with the columns `consumer_no`, `late_payments` (how many such payments) and `total_late_fee` (the sum of those fees in rupees). Order by `total_late_fee` from highest to lowest, then by `consumer_no`.",
    ].join("\n"),
    tables: [
      {
        name: "Bill",
        columns: [
          { name: "bill_id", type: "int" },
          { name: "consumer_no", type: "int" },
          { name: "due_date", type: "date" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["bill_id"],
        note: "One electricity bill of one consumer.",
      },
      {
        name: "Payment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "bill_id", type: "int" },
          { name: "paid_on", type: "date" },
          { name: "amount_paid", type: "int" },
          { name: "late_fee", type: "int" },
        ],
        primaryKey: ["payment_id"],
        note: "`late_fee` is 0 for a payment made on time. Every `bill_id` is in `Bill`.",
      },
    ],
    examples: [
      {
        Bill: [
          [1, 50011, "2024-01-20", 1200],
          [2, 50011, "2024-02-20", 1300],
          [3, 50011, "2024-03-20", 1100],
          [4, 50027, "2024-01-20", 900],
          [5, 50027, "2024-02-20", 950],
          [6, 50034, "2023-12-20", 2000],
          [7, 50034, "2024-02-20", 2100],
          [8, 50042, "2024-02-20", 700],
        ],
        Payment: [
          [1, 1, "2024-01-25", 1200, 24],
          [2, 2, "2024-02-28", 1300, 26],
          [3, 3, "2024-03-18", 1100, 0],
          [4, 4, "2024-01-29", 900, 25],
          [5, 5, "2024-02-26", 950, 25],
          [6, 6, "2023-12-28", 2000, 40],
          [7, 7, "2024-02-24", 2100, 42],
          [8, 8, "2024-02-22", 700, 14],
        ],
      },
    ],
    gen: (rng) => {
      const consumers = sample(rng, seq(50001, 50), ri(rng, 1, 5));
      const n = ri(rng, 1, 16);
      const bills: Cell[][] = [];
      const pays: Cell[][] = [];
      for (const id of seq(1, n)) {
        const due = pick(rng, ["2023-11-20", "2023-12-20", "2024-01-20", "2024-02-20", "2024-03-20", "2024-04-20", "2024-12-20"]);
        const amount = roundTo(rng, 500, 2500, 50);
        bills.push([id, pick(rng, consumers), due, amount]);
        if (chance(rng, 0.9)) {
          const late = chance(rng, 0.6);
          const paid = addDays(due, late ? ri(rng, 1, 15) : ri(rng, -8, 0));
          pays.push([pays.length + 1, id, paid, amount, late ? pick(rng, [10, 20, 25, amount / 50]) : 0]);
        }
      }
      return { Bill: bills, Payment: pays };
    },
    solution: [
      "SELECT b.consumer_no, COUNT(*) AS late_payments, SUM(p.late_fee) AS total_late_fee",
      "FROM Payment p",
      "JOIN Bill b ON b.bill_id = p.bill_id",
      "WHERE p.late_fee > 0",
      "  AND p.paid_on BETWEEN '2024-01-01' AND '2024-12-31'",
      "GROUP BY b.consumer_no",
      "HAVING COUNT(*) >= 2",
      "ORDER BY total_late_fee DESC, b.consumer_no",
    ].join("\n"),
    alternatives: [
      [
        "SELECT b.consumer_no,",
        "       SUM(CASE WHEN p.late_fee > 0 THEN 1 ELSE 0 END) AS late_payments,",
        "       SUM(p.late_fee) AS total_late_fee",
        "FROM Bill b JOIN Payment p ON p.bill_id = b.bill_id",
        "WHERE YEAR(p.paid_on) = 2024",
        "GROUP BY b.consumer_no",
        "HAVING SUM(CASE WHEN p.late_fee > 0 THEN 1 ELSE 0 END) >= 2",
        "ORDER BY SUM(p.late_fee) DESC, b.consumer_no",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The fee is on the payment but the consumer is on the bill — join them.",
      "Filter rows (year, fee > 0) in WHERE; filter groups (at least two) in HAVING.",
      "Two consumers can owe the same total — sort by `consumer_no` after it.",
    ],
    editorial: [
      "The consumer number lives on `Bill` and the fee on `Payment`, so the payments are joined to their bills on `bill_id`. WHERE then keeps the rows that matter: payments dated in 2024 that carry a fee. A payment from December 2023 does not count even though the consumer is the same, and an on-time payment (fee 0) is no late payment.",
      "",
      "Grouping by `consumer_no` gives each consumer's late payments; `COUNT(*)` counts them and `SUM(late_fee)` totals them. The \"at least two\" condition is about a group, so it goes in `HAVING COUNT(*) >= 2` — WHERE runs before grouping and cannot see counts.",
      "",
      "The alternative keeps on-time 2024 payments in the groups and counts the late ones with a conditional SUM; the fee total is the same because on-time fees are 0. Equal totals are ordered by consumer number. The cost is one join over the payments plus grouping.",
    ].join("\n"),
  },

  {
    slug: "busiest-calling-hour-per-cell-tower",
    title: "Busiest Calling Hour per Cell Tower",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates"],
    description: [
      "Radio planners size each tower's capacity for its busiest hour of the day. Calls are grouped by the hour of the day they started (0–23), across all dates.",
      "",
      "For every tower in `CallRecord`, return `tower_id`, `peak_hour` (the hour of the day with the **most calls started**) and `calls` (the number of calls in that hour). If several hours tie, report the **earliest** of them. Order by `tower_id`.",
    ].join("\n"),
    tables: [
      {
        name: "CallRecord",
        columns: [
          { name: "call_id", type: "int" },
          { name: "tower_id", type: "int" },
          { name: "caller_number", type: "varchar" },
          { name: "started_at", type: "datetime" },
          { name: "duration_sec", type: "int" },
        ],
        primaryKey: ["call_id"],
        note: "A call detail record: the tower that carried the call and when it started.",
      },
    ],
    examples: [
      {
        CallRecord: [
          [1, 101, "9845012345", "2024-07-01 09:05:00", 120],
          [2, 101, "9900123456", "2024-07-01 09:48:10", 45],
          [3, 101, "9731122334", "2024-07-01 18:00:00", 300],
          [4, 101, "9845012345", "2024-07-02 18:59:59", 60],
          [5, 101, "8123456789", "2024-07-02 20:15:00", 30],
          [6, 102, "7019988776", "2024-07-01 19:10:00", 200],
          [7, 102, "9611223344", "2024-07-02 19:20:00", 90],
          [8, 102, "9886655443", "2024-07-03 19:45:00", 75],
          [9, 102, "9845012345", "2024-07-03 08:30:00", 15],
          [10, 103, "9900123456", "2024-07-03 23:59:00", 40],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 28);
      const towers = sample(rng, [101, 102, 103, 104, 105], ri(rng, 1, 4));
      const numbers = Array.from({ length: 8 }, () => mobile(rng));
      const hours = sample(rng, [0, 7, 8, 9, 12, 18, 19, 20, 21, 23], ri(rng, 2, 5));
      const rows = seq(1, n).map((id) => [
        id, pick(rng, towers), pick(rng, numbers),
        stamp(dateBetween(rng, "2024-07-01", "2024-07-07"), pick(rng, hours), ri(rng, 0, 59), ri(rng, 0, 59)),
        ri(rng, 5, 900),
      ]);
      return { CallRecord: rows };
    },
    solution: [
      "WITH hourly AS (",
      "  SELECT tower_id, HOUR(started_at) AS peak_hour, COUNT(*) AS calls",
      "  FROM CallRecord",
      "  GROUP BY tower_id, HOUR(started_at)",
      "), ranked AS (",
      "  SELECT tower_id, peak_hour, calls,",
      "         ROW_NUMBER() OVER (PARTITION BY tower_id ORDER BY calls DESC, peak_hour) AS rn",
      "  FROM hourly",
      ")",
      "SELECT tower_id, peak_hour, calls FROM ranked WHERE rn = 1 ORDER BY tower_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH hourly AS (",
        "  SELECT tower_id, HOUR(started_at) AS peak_hour, COUNT(*) AS calls FROM CallRecord GROUP BY tower_id, HOUR(started_at)",
        ")",
        "SELECT h.tower_id, h.peak_hour, h.calls FROM hourly h",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM hourly o WHERE o.tower_id = h.tower_id",
        "    AND (o.calls > h.calls OR (o.calls = h.calls AND o.peak_hour < h.peak_hour))",
        ")",
        "ORDER BY h.tower_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`HOUR(started_at)` turns a timestamp into its hour of the day, whatever the date.",
      "Count calls per (tower, hour) first.",
      "Number each tower's hours by calls descending, then hour ascending, and keep the first.",
    ],
    editorial: [
      "The busy hour is a property of the time of day, not of a date, so the first step strips the date: `HOUR(started_at)` maps 09:05 on Monday and 09:48 on Tuesday to the same bucket, 9. Grouping by tower and hour and counting gives each tower's hourly profile. A call at 18:59:59 is still hour 18.",
      "",
      "Then each tower keeps one row. `ROW_NUMBER()` over each tower's hours, ordered by `calls DESC, peak_hour`, puts the busiest hour first and — because the hour is part of the order — the earliest of several tied hours first, so exactly one deterministic row has `rn = 1`. Using `RANK` here would return every tied hour, which the statement rules out.",
      "",
      "The NOT EXISTS version expresses the same rule as a comparison: keep an hour if no other hour of the tower has more calls, or as many calls and an earlier hour. Both scan the records once; the remaining work is over at most 24 rows per tower.",
    ].join("\n"),
  },
  {
    slug: "international-voice-call-share-per-caller",
    title: "International Voice Call Share per Caller",
    difficulty: "MEDIUM",
    topics: ["Strings", "Conditional Logic", "Aggregation"],
    description: [
      "The fraud team watches for prepaid numbers whose calling suddenly turns international. Numbers in the call detail records carry their country code, so an Indian number starts with `+91` and **any callee number that does not start with `+91` is international**.",
      "",
      "Considering **voice calls only** (`call_type = 'voice'`; SMS rows are ignored), return each caller with at least one voice call, with the columns `caller_number`, `voice_calls` and `intl_share_pct` — the percentage of their voice calls that went to international numbers, **rounded to 2 decimals**. Order by `intl_share_pct` from highest to lowest, then by `caller_number`.",
    ].join("\n"),
    tables: [
      {
        name: "Cdr",
        columns: [
          { name: "cdr_id", type: "int" },
          { name: "caller_number", type: "varchar" },
          { name: "callee_number", type: "varchar" },
          { name: "call_type", type: "enum", values: ["voice", "sms"] },
          { name: "started_at", type: "datetime" },
          { name: "duration_sec", type: "int" },
        ],
        primaryKey: ["cdr_id"],
        note: "One call detail record. Numbers are stored in E.164 form, e.g. `+919845012345`, `+14155550123`.",
      },
    ],
    examples: [
      {
        Cdr: [
          [1, "+919845012345", "+919900123456", "voice", "2024-08-01 10:00:00", 120],
          [2, "+919845012345", "+14155550123", "voice", "2024-08-01 22:15:00", 600],
          [3, "+919845012345", "+971501234567", "voice", "2024-08-02 23:40:00", 840],
          [4, "+919845012345", "+447700900123", "sms", "2024-08-02 23:45:00", 0],
          [5, "+919731122334", "+919845012345", "voice", "2024-08-03 09:10:00", 60],
          [6, "+919731122334", "+918123456789", "voice", "2024-08-03 13:00:00", 30],
          [7, "+919731122334", "+6591234567", "voice", "2024-08-04 08:20:00", 300],
          [8, "+918123456789", "+14155550123", "sms", "2024-08-04 12:00:00", 0],
          [9, "+917019988776", "+919845012345", "voice", "2024-08-05 19:00:00", 95],
        ],
      },
    ],
    gen: (rng) => {
      const callers = Array.from({ length: ri(rng, 1, 5) }, () => `+91${mobile(rng)}`);
      const abroad = ["+14155550123", "+447700900123", "+971501234567", "+6591234567", "+61412345678", "+9779812345678"];
      const n = ri(rng, 1, 26);
      const rows = seq(1, n).map((id) => {
        const intl = chance(rng, 0.35);
        const type = chance(rng, 0.2) ? "sms" : "voice";
        return [id, pick(rng, callers), intl ? pick(rng, abroad) : `+91${mobile(rng)}`, type,
          stamp(dateBetween(rng, "2024-08-01", "2024-08-10"), ri(rng, 0, 23), ri(rng, 0, 59)), type === "sms" ? 0 : ri(rng, 5, 1800)];
      });
      return { Cdr: rows };
    },
    solution: [
      "SELECT caller_number, COUNT(*) AS voice_calls,",
      "       ROUND(100 * SUM(CASE WHEN callee_number LIKE '+91%' THEN 0 ELSE 1 END) / COUNT(*), 2) AS intl_share_pct",
      "FROM Cdr",
      "WHERE call_type = 'voice'",
      "GROUP BY caller_number",
      "ORDER BY intl_share_pct DESC, caller_number",
    ].join("\n"),
    alternatives: [
      [
        "SELECT caller_number, COUNT(*) AS voice_calls,",
        "       ROUND(AVG(IF(LEFT(callee_number, 3) = '+91', 0, 100)), 2) AS intl_share_pct",
        "FROM Cdr",
        "WHERE call_type = 'voice'",
        "GROUP BY caller_number",
        "ORDER BY intl_share_pct DESC, caller_number",
      ].join("\n"),
      [
        "SELECT caller_number,",
        "       SUM(CASE WHEN call_type = 'voice' THEN 1 ELSE 0 END) AS voice_calls,",
        "       ROUND(100 * SUM(CASE WHEN call_type = 'voice' AND SUBSTRING(callee_number, 1, 3) <> '+91' THEN 1 ELSE 0 END)",
        "             / SUM(CASE WHEN call_type = 'voice' THEN 1 ELSE 0 END), 2) AS intl_share_pct",
        "FROM Cdr",
        "GROUP BY caller_number",
        "HAVING SUM(CASE WHEN call_type = 'voice' THEN 1 ELSE 0 END) > 0",
        "ORDER BY intl_share_pct DESC, caller_number",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "International is a test on the start of a string: `LIKE '+91%'` or `LEFT(number, 3)`.",
      "Count international calls with a SUM over a CASE that yields 1 or 0.",
      "Multiply by 100 before dividing, and round only the final percentage.",
    ],
    editorial: [
      "The rule that classifies a call is a prefix test on a string: a callee is domestic when the number starts with `+91`. `callee_number LIKE '+91%'` expresses it (the `%` matches the rest), as does `LEFT(callee_number, 3) = '+91'`. A UAE number like `+971…` starts with `+97`, not `+91`, so it is correctly international.",
      "",
      "After `WHERE call_type = 'voice'` throws away SMS rows, the rows are grouped per caller. `COUNT(*)` is the number of voice calls and `SUM(CASE WHEN … THEN 0 ELSE 1 END)` the number of international ones — conditional aggregation. Their ratio times 100, rounded to two decimals, is the share. Because the filter runs first, a caller who only sent SMS has no group and is not reported, and the division never sees a zero count.",
      "",
      "Averaging an indicator that is 100 for international and 0 for domestic computes the same percentage in one step. Keeping SMS rows and filtering inside the CASEs works too, with HAVING dropping SMS-only callers. Each is one scan with a group per caller.",
    ].join("\n"),
  },

  {
    slug: "number-port-requests-breaching-72-hour-sla",
    title: "Number Port Requests Breaching the 72-Hour SLA",
    difficulty: "MEDIUM",
    topics: ["Joins", "Dates"],
    description: [
      "The regulator expects a mobile number port to complete within **72 hours** of the request. The compliance report is run as of **2024-09-30 00:00:00**.",
      "",
      "For every request that is not `'rejected'`, the time open is the whole hours from `requested_at` to `completed_at` — or, for a request still `'pending'` (`completed_at` NULL), to 2024-09-30 00:00:00. Return the requests open **more than 72 hours**, with the columns `request_id`, `mobile_number`, `donor` and `recipient` (the operators' names) and `hours_open`. Order by `hours_open` from highest to lowest, then by `request_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Operator",
        columns: [
          { name: "operator_id", type: "int" },
          { name: "operator_name", type: "varchar" },
        ],
        primaryKey: ["operator_id"],
      },
      {
        name: "PortRequest",
        columns: [
          { name: "request_id", type: "int" },
          { name: "mobile_number", type: "varchar" },
          { name: "donor_id", type: "int" },
          { name: "recipient_id", type: "int" },
          { name: "requested_at", type: "datetime" },
          { name: "completed_at", type: "datetime" },
          { name: "status", type: "enum", values: ["completed", "pending", "rejected"] },
        ],
        primaryKey: ["request_id"],
        note: "`donor_id` and `recipient_id` are operators. `completed_at` is set only for completed requests; every request was made before the report time.",
      },
    ],
    examples: [
      {
        Operator: [
          [1, "Nimbus Mobile"],
          [2, "Tara Telecom"],
          [3, "Vega Wireless"],
        ],
        PortRequest: [
          [1, "9845012345", 1, 2, "2024-09-20 10:00:00", "2024-09-22 18:00:00", "completed"],
          [2, "9900123456", 2, 1, "2024-09-21 09:00:00", "2024-09-24 10:00:00", "completed"],
          [3, "9731122334", 1, 3, "2024-09-25 12:00:00", null, "pending"],
          [4, "8123456789", 3, 1, "2024-09-28 08:00:00", null, "pending"],
          [5, "7019988776", 1, 2, "2024-09-10 11:00:00", null, "rejected"],
          [6, "9611223344", 2, 3, "2024-09-15 06:00:00", "2024-09-18 06:00:00", "completed"],
          [7, "9886655443", 3, 2, "2024-09-26 00:00:00", null, "pending"],
        ],
      },
    ],
    gen: (rng) => {
      const ops = sample(rng, OPERATORS, ri(rng, 2, 4));
      const operators = ops.map((name, i) => [i + 1, name]);
      const n = ri(rng, 1, 16);
      const rows = seq(1, n).map((id) => {
        const donor = ri(rng, 1, ops.length);
        let recipient = ri(rng, 1, ops.length - 1);
        if (recipient >= donor) recipient++;
        const requested = stamp(dateBetween(rng, "2024-09-12", "2024-09-29"), ri(rng, 0, 23));
        const status = pick(rng, ["completed", "completed", "pending", "pending", "rejected"]);
        const hours = chance(rng, 0.3) ? pick(rng, [71, 72, 73]) : ri(rng, 6, 140);
        return [id, mobile(rng), donor, recipient, requested, status === "completed" ? addMinutes(requested, hours * 60) : null, status];
      });
      return { Operator: operators, PortRequest: rows };
    },
    solution: [
      "SELECT r.request_id, r.mobile_number, d.operator_name AS donor, c.operator_name AS recipient,",
      "       TIMESTAMPDIFF(HOUR, r.requested_at, COALESCE(r.completed_at, '2024-09-30 00:00:00')) AS hours_open",
      "FROM PortRequest r",
      "JOIN Operator d ON d.operator_id = r.donor_id",
      "JOIN Operator c ON c.operator_id = r.recipient_id",
      "WHERE r.status <> 'rejected'",
      "  AND TIMESTAMPDIFF(HOUR, r.requested_at, COALESCE(r.completed_at, '2024-09-30 00:00:00')) > 72",
      "ORDER BY hours_open DESC, r.request_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT * FROM (",
        "  SELECT r.request_id, r.mobile_number,",
        "         (SELECT operator_name FROM Operator o WHERE o.operator_id = r.donor_id) AS donor,",
        "         (SELECT operator_name FROM Operator o WHERE o.operator_id = r.recipient_id) AS recipient,",
        "         CASE WHEN r.status = 'completed' THEN TIMESTAMPDIFF(HOUR, r.requested_at, r.completed_at)",
        "              ELSE TIMESTAMPDIFF(HOUR, r.requested_at, '2024-09-30 00:00:00') END AS hours_open",
        "  FROM PortRequest r",
        "  WHERE r.status IN ('completed', 'pending')",
        ") x",
        "WHERE hours_open > 72",
        "ORDER BY hours_open DESC, request_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`Operator` has to be joined twice — once for the donor, once for the recipient — under two aliases.",
      "`COALESCE(completed_at, '2024-09-30 00:00:00')` gives one end time for both completed and pending requests.",
      "`TIMESTAMPDIFF(HOUR, a, b)` counts whole hours; exactly 72 is within the SLA.",
    ],
    editorial: [
      "Two independent ideas meet here. First, each request names two operators, so `Operator` is joined **twice** under different aliases — `d` matched on `donor_id`, `c` on `recipient_id` — and each copy contributes one name. A single join could only ever give one of them.",
      "",
      "Second, the clock: a completed request is measured to its completion, a pending one to the report time. `COALESCE(completed_at, '2024-09-30 00:00:00')` picks the right end for both in one expression, and `TIMESTAMPDIFF(HOUR, requested_at, end)` gives whole hours. Rejected requests are excluded explicitly — they never complete, and without the filter the COALESCE would age them like pending ones. The SLA allows 72 hours, so the breach test is `> 72`: a port finished in exactly 72 hours is compliant.",
      "",
      "The alternative branches on `status` with a CASE and fetches the names with scalar subqueries, which reads naturally but repeats a lookup per row. Both versions are one pass over the requests with primary-key lookups into `Operator`.",
    ].join("\n"),
  },

  {
    slug: "prepaid-service-lapses-between-recharges",
    title: "Prepaid Service Lapses Between Recharges",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates"],
    description: [
      "When a prepaid plan expires before the next recharge, the number is without service for a while. A plan bought on `recharge_date` expires on `recharge_date` plus `validity_days` days. Using the operator's simple rule, **compare every recharge only with the next recharge of the same number**: if the next recharge is **strictly after** the expiry date, the number lapsed.",
      "",
      "Return every lapse with the columns `mobile_number`, `expired_on` (the expiry date), `recharged_on` (the next recharge's date) and `lapse_days` (days between them). The last recharge of a number has no next one and is never a lapse. Order by `mobile_number`, then `expired_on`, then `recharged_on`.",
    ].join("\n"),
    tables: [
      {
        name: "Recharge",
        columns: [
          { name: "recharge_id", type: "int" },
          { name: "mobile_number", type: "varchar" },
          { name: "recharge_date", type: "date" },
          { name: "validity_days", type: "int" },
        ],
        primaryKey: ["recharge_id"],
        note: "A number recharges at most once a day.",
      },
    ],
    examples: [
      {
        Recharge: [
          [1, "9845012345", "2024-01-01", 28],
          [2, "9845012345", "2024-01-29", 28],
          [3, "9845012345", "2024-03-04", 56],
          [4, "9900123456", "2024-01-10", 84],
          [5, "9900123456", "2024-02-15", 28],
          [6, "9900123456", "2024-03-20", 28],
          [7, "8123456789", "2024-02-01", 28],
          [8, "7019988776", "2024-01-05", 14],
          [9, "7019988776", "2024-01-20", 28],
        ],
      },
    ],
    gen: (rng) => {
      const numbers = Array.from({ length: ri(rng, 1, 5) }, () => mobile(rng));
      const rows: Cell[][] = [];
      for (const num of numbers) {
        let date = dateBetween(rng, "2024-01-01", "2024-01-31");
        for (let k = ri(rng, 1, 5); k > 0; k--) {
          const validity = pick(rng, [14, 28, 28, 56, 84]);
          rows.push([0, num, date, validity]);
          const gap = chance(rng, 0.25) ? validity + pick(rng, [0, 1]) : validity + ri(rng, -20, 15);
          date = addDays(date, Math.max(1, gap));
        }
      }
      return { Recharge: sample(rng, rows, rows.length).map((r, i) => [i + 1, r[1]!, r[2]!, r[3]!]) };
    },
    solution: [
      "WITH seq AS (",
      "  SELECT mobile_number,",
      "         DATE_ADD(recharge_date, INTERVAL validity_days DAY) AS expired_on,",
      "         LEAD(recharge_date) OVER (PARTITION BY mobile_number ORDER BY recharge_date) AS recharged_on",
      "  FROM Recharge",
      ")",
      "SELECT mobile_number, expired_on, recharged_on, DATEDIFF(recharged_on, expired_on) AS lapse_days",
      "FROM seq",
      "WHERE recharged_on > expired_on",
      "ORDER BY mobile_number, expired_on, recharged_on",
    ].join("\n"),
    alternatives: [
      [
        "SELECT mobile_number, expired_on, recharged_on, DATEDIFF(recharged_on, expired_on) AS lapse_days FROM (",
        "  SELECT r.mobile_number, ADDDATE(r.recharge_date, r.validity_days) AS expired_on,",
        "         (SELECT MIN(n.recharge_date) FROM Recharge n",
        "           WHERE n.mobile_number = r.mobile_number AND n.recharge_date > r.recharge_date) AS recharged_on",
        "  FROM Recharge r",
        ") x",
        "WHERE recharged_on IS NOT NULL AND DATEDIFF(recharged_on, expired_on) > 0",
        "ORDER BY mobile_number, expired_on, recharged_on",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Each recharge needs the date of the following recharge of the same number — `LEAD` looks one row ahead.",
      "Compute the expiry with `DATE_ADD(recharge_date, INTERVAL validity_days DAY)`.",
      "A recharge on the expiry day itself is not a lapse; the last recharge has a NULL next date.",
    ],
    editorial: [
      "Each recharge is compared with its successor, which is what `LEAD` gives: partitioned by `mobile_number` and ordered by `recharge_date`, `LEAD(recharge_date)` is the next recharge of the same number, or NULL on the number's last row. The expiry is computed on the same row with `DATE_ADD(recharge_date, INTERVAL validity_days DAY)`.",
      "",
      "A lapse is `recharged_on > expired_on`. The strict comparison keeps a recharge made on the expiry day out of the answer, and the last recharge drops out on its own because a comparison with NULL is never true. `DATEDIFF(recharged_on, expired_on)` is then the number of days without service. A recharge made while the earlier plan was still running simply produces no lapse for that pair — the rule compares neighbours only.",
      "",
      "Without windows, the next recharge is `MIN(recharge_date)` among the same number's later recharges, a correlated subquery that costs a lookup per row; with an index on `(mobile_number, recharge_date)` both approaches are fast, but the window version reads the table once.",
    ].join("\n"),
  },

  {
    slug: "longest-heavy-data-usage-streak",
    title: "Longest Streak of Heavy Data Days",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "A subscriber has a **heavy day** when they use at least 1024 MB (1 GB) of data. The analytics team wants each heavy user's longest run of heavy days on **consecutive calendar dates**; a day without a row, or a day under 1024 MB, breaks the run.",
      "",
      "For every subscriber with at least one heavy day, return `subscriber_id`, `longest_streak` (the number of days in their longest run) and `streak_start` (the first date of that run). If two runs are equally long, report the **earlier** one. Order by `subscriber_id`.",
    ].join("\n"),
    tables: [
      {
        name: "DailyData",
        columns: [
          { name: "subscriber_id", type: "int" },
          { name: "usage_date", type: "date" },
          { name: "mb_used", type: "int" },
        ],
        primaryKey: ["subscriber_id", "usage_date"],
        note: "One row per subscriber per day with any data use.",
      },
    ],
    examples: [
      {
        DailyData: [
          [1, "2024-07-01", 1500],
          [1, "2024-07-02", 2048],
          [1, "2024-07-03", 900],
          [1, "2024-07-04", 1100],
          [1, "2024-07-05", 1024],
          [1, "2024-07-06", 3000],
          [2, "2024-07-01", 1200],
          [2, "2024-07-03", 1300],
          [3, "2024-07-01", 500],
          [4, "2024-07-30", 1024],
          [4, "2024-07-31", 1024],
          [4, "2024-08-01", 2000],
        ],
      },
    ],
    gen: (rng) => {
      const subs = sample(rng, [1, 2, 3, 4, 5, 6], ri(rng, 1, 4));
      const rows: Cell[][] = [];
      for (const s of subs) {
        let date = dateBetween(rng, "2024-07-01", "2024-07-31");
        for (let k = ri(rng, 1, 8); k > 0; k--) {
          rows.push([s, date, pick(rng, [300, 1000, 1023, 1024, 1024, 1500, 2200, 4000])]);
          date = addDays(date, chance(rng, 0.75) ? 1 : ri(rng, 2, 3));
        }
      }
      return { DailyData: rows };
    },
    solution: [
      "WITH heavy AS (",
      "  SELECT subscriber_id, usage_date,",
      "         DATEDIFF(usage_date, '2024-01-01')",
      "           - ROW_NUMBER() OVER (PARTITION BY subscriber_id ORDER BY usage_date) AS grp",
      "  FROM DailyData",
      "  WHERE mb_used >= 1024",
      "), runs AS (",
      "  SELECT subscriber_id, MIN(usage_date) AS start_date, COUNT(*) AS len",
      "  FROM heavy",
      "  GROUP BY subscriber_id, grp",
      "), ranked AS (",
      "  SELECT subscriber_id, start_date, len,",
      "         ROW_NUMBER() OVER (PARTITION BY subscriber_id ORDER BY len DESC, start_date) AS rn",
      "  FROM runs",
      ")",
      "SELECT subscriber_id, len AS longest_streak, start_date AS streak_start",
      "FROM ranked",
      "WHERE rn = 1",
      "ORDER BY subscriber_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH heavy AS (",
        "  SELECT subscriber_id, usage_date,",
        "         LAG(usage_date) OVER (PARTITION BY subscriber_id ORDER BY usage_date) AS prev_day",
        "  FROM DailyData WHERE mb_used >= 1024",
        "), marked AS (",
        "  SELECT subscriber_id, usage_date,",
        "         SUM(CASE WHEN prev_day IS NOT NULL AND DATEDIFF(usage_date, prev_day) = 1 THEN 0 ELSE 1 END)",
        "           OVER (PARTITION BY subscriber_id ORDER BY usage_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS run_no",
        "  FROM heavy",
        "), runs AS (",
        "  SELECT subscriber_id, run_no, MIN(usage_date) AS start_date, COUNT(*) AS len FROM marked GROUP BY subscriber_id, run_no",
        ")",
        "SELECT r.subscriber_id, r.len AS longest_streak, r.start_date AS streak_start",
        "FROM runs r",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM runs o WHERE o.subscriber_id = r.subscriber_id",
        "    AND (o.len > r.len OR (o.len = r.len AND o.start_date < r.start_date))",
        ")",
        "ORDER BY r.subscriber_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Throw away the light days first; only heavy days can belong to a run.",
      "On consecutive dates, the date minus the row's position in date order stays constant — that difference names the run.",
      "Once each run has a length and a start, pick the longest per subscriber, earliest start first.",
    ],
    editorial: [
      "This is the **gaps-and-islands** pattern. Keep only heavy days, number each subscriber's heavy days in date order with `ROW_NUMBER()`, and subtract that number from the date (as a day count, `DATEDIFF(usage_date, '2024-01-01')`). Inside a run of consecutive dates both the date and the row number go up by one each day, so the difference is constant; any break — a missing day or a light day that was filtered out — makes the date jump further than the row number, and the difference changes. Grouping by `(subscriber_id, grp)` therefore yields one row per run, with `MIN(usage_date)` as its start and `COUNT(*)` as its length. Runs cross month ends naturally, because the arithmetic is on day counts.",
      "",
      "A second `ROW_NUMBER()`, ordered by length descending and start ascending, picks one run per subscriber and applies the tie rule. Subscribers with no heavy days never enter `heavy`, so they are absent.",
      "",
      "The alternative marks the start of each run with `LAG` (a row whose previous heavy day is not exactly yesterday starts a run), turns the marks into run numbers with a running SUM, and picks the winner with NOT EXISTS. Both are a couple of sorts over the heavy days.",
    ].join("\n"),
  },

  {
    slug: "feeder-downtime-after-merging-overlapping-outages",
    title: "Feeder Downtime After Merging Overlapping Outages",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "Outages on a feeder are logged from several sources — the SCADA system, the call centre, the line crew — so the reports overlap. For the reliability index, the overlapping reports of a feeder must be **merged**: two reports belong to one incident when their time ranges overlap or **touch** (one is restored exactly when the next starts), directly or through a chain of other reports.",
      "",
      "Return one row per feeder with the columns `feeder_code`, `incidents` (the number of merged incidents) and `downtime_minutes` (the total minutes the feeder was down, each minute counted once). Order by `feeder_code`.",
    ].join("\n"),
    tables: [
      {
        name: "OutageReport",
        columns: [
          { name: "report_id", type: "int" },
          { name: "feeder_code", type: "varchar" },
          { name: "started_at", type: "datetime" },
          { name: "restored_at", type: "datetime" },
        ],
        primaryKey: ["report_id"],
        note: "One reported outage; times are whole minutes and `restored_at` is always after `started_at`.",
      },
    ],
    examples: [
      {
        OutageReport: [
          [1, "BLR-F11", "2024-07-02 08:00:00", "2024-07-02 10:00:00"],
          [2, "BLR-F11", "2024-07-02 09:30:00", "2024-07-02 11:15:00"],
          [3, "BLR-F11", "2024-07-02 11:15:00", "2024-07-02 12:00:00"],
          [4, "BLR-F11", "2024-07-02 14:00:00", "2024-07-02 14:45:00"],
          [5, "BLR-F12", "2024-07-02 10:00:00", "2024-07-02 13:00:00"],
          [6, "BLR-F12", "2024-07-02 10:30:00", "2024-07-02 11:00:00"],
          [7, "BLR-F12", "2024-07-02 23:30:00", "2024-07-03 01:10:00"],
          [8, "BLR-F27", "2024-07-03 09:00:00", "2024-07-03 09:20:00"],
        ],
      },
    ],
    gen: (rng) => {
      const feeders = sample(rng, FEEDERS, ri(rng, 1, 3));
      const rows: Cell[][] = [];
      for (const f of feeders) {
        let last = stamp(dateBetween(rng, "2024-07-01", "2024-07-03"), ri(rng, 0, 12));
        for (let k = ri(rng, 1, 6); k > 0; k--) {
          const start = chance(rng, 0.2) ? last : addMinutes(last, ri(rng, -120, 90));
          const end = addMinutes(start, ri(rng, 5, 150));
          rows.push([0, f, start, end]);
          last = end;
        }
      }
      return { OutageReport: sample(rng, rows, rows.length).map((r, i) => [i + 1, r[1]!, r[2]!, r[3]!]) };
    },
    solution: [
      "WITH ordered AS (",
      "  SELECT report_id, feeder_code, started_at, restored_at,",
      "         MAX(restored_at) OVER (PARTITION BY feeder_code ORDER BY started_at, report_id",
      "                                ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS prev_end",
      "  FROM OutageReport",
      "), grouped AS (",
      "  SELECT feeder_code, started_at, restored_at,",
      "         SUM(CASE WHEN prev_end IS NULL OR started_at > prev_end THEN 1 ELSE 0 END)",
      "           OVER (PARTITION BY feeder_code ORDER BY started_at, report_id",
      "                 ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS incident",
      "  FROM ordered",
      "), merged AS (",
      "  SELECT feeder_code, incident, MIN(started_at) AS s, MAX(restored_at) AS e",
      "  FROM grouped",
      "  GROUP BY feeder_code, incident",
      ")",
      "SELECT feeder_code, COUNT(*) AS incidents, SUM(TIMESTAMPDIFF(MINUTE, s, e)) AS downtime_minutes",
      "FROM merged",
      "GROUP BY feeder_code",
      "ORDER BY feeder_code",
    ].join("\n"),
    alternatives: [
      [
        "WITH starts AS (",
        "  SELECT DISTINCT a.feeder_code, a.started_at",
        "  FROM OutageReport a",
        "  WHERE NOT EXISTS (",
        "    SELECT 1 FROM OutageReport b",
        "    WHERE b.feeder_code = a.feeder_code AND b.started_at < a.started_at AND b.restored_at >= a.started_at",
        "  )",
        "), tagged AS (",
        "  SELECT r.feeder_code, r.restored_at,",
        "         (SELECT MAX(s.started_at) FROM starts s",
        "           WHERE s.feeder_code = r.feeder_code AND s.started_at <= r.started_at) AS incident_start",
        "  FROM OutageReport r",
        "), merged AS (",
        "  SELECT feeder_code, incident_start, MAX(restored_at) AS incident_end",
        "  FROM tagged GROUP BY feeder_code, incident_start",
        ")",
        "SELECT feeder_code, COUNT(*) AS incidents,",
        "       SUM(TIMESTAMPDIFF(MINUTE, incident_start, incident_end)) AS downtime_minutes",
        "FROM merged GROUP BY feeder_code ORDER BY feeder_code",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Sort each feeder's reports by start time. A report starts a new incident only if it begins after every earlier report has ended.",
      "The latest end among the earlier reports is a running MAX over the previous rows.",
      "Turn the \"starts a new incident\" flags into incident numbers with a running SUM, then group.",
      "Sum each merged incident's length — summing the raw reports would count overlapping minutes twice.",
    ],
    editorial: [
      "Merging overlapping intervals is a gaps-and-islands problem on ranges. Order each feeder's reports by `started_at` (with `report_id` making the order total). A report belongs to the incident in progress when it starts no later than the **latest restoration among all earlier reports** — not just the previous one, because a long report can cover several short ones after it. `MAX(restored_at) OVER (… ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING)` computes that latest end; it is NULL for the first report.",
      "",
      "A report opens a new incident exactly when `prev_end` is NULL or `started_at > prev_end`. The comparison is strict, so a report starting at the very minute another is restored joins it — the touching rule. A running SUM of those 0/1 flags numbers the incidents, and grouping by it gives each incident's first start and last restoration. Its length is `TIMESTAMPDIFF(MINUTE, s, e)`; summing those per feeder counts every minute once, whereas summing the raw reports would double-count overlaps.",
      "",
      "The alternative finds the start times that no earlier report covers (`NOT EXISTS`), assigns each report to the latest such start at or before it, and measures from there. It is quadratic per feeder; the window version is one sort.",
    ].join("\n"),
  },
  {
    slug: "median-completed-call-duration-per-tower",
    title: "Median Completed Call Duration per Tower",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "Average call length is skewed by a few marathon calls, so the capacity team reports the **median** instead. Only calls that ended normally count; dropped calls are left out.",
      "",
      "For every tower with at least one normally ended call, return `tower_id`, `completed_calls` (how many such calls) and `median_duration_sec`: the middle duration when the count is odd, or the **average of the two middle durations** when it is even, **rounded to 1 decimal**. Order by `tower_id`.",
    ].join("\n"),
    tables: [
      {
        name: "CallRecord",
        columns: [
          { name: "call_id", type: "int" },
          { name: "tower_id", type: "int" },
          { name: "duration_sec", type: "int" },
          { name: "end_reason", type: "enum", values: ["normal", "dropped"] },
        ],
        primaryKey: ["call_id"],
        note: "One voice call carried by a tower and how it ended.",
      },
    ],
    examples: [
      {
        CallRecord: [
          [1, 101, 30, "normal"],
          [2, 101, 120, "normal"],
          [3, 101, 600, "dropped"],
          [4, 101, 45, "normal"],
          [5, 101, 300, "normal"],
          [6, 102, 60, "normal"],
          [7, 102, 90, "normal"],
          [8, 102, 60, "normal"],
          [9, 103, 200, "normal"],
          [10, 104, 75, "dropped"],
        ],
      },
    ],
    gen: (rng) => {
      const towers = sample(rng, [101, 102, 103, 104, 105], ri(rng, 1, 4));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 28);
      const rows = seq(1, n).map((id) => [id, pick(rng, towers), roundTo(rng, 5, 900, 5), chance(rng, 0.2) ? "dropped" : "normal"]);
      return { CallRecord: rows };
    },
    solution: [
      "WITH ranked AS (",
      "  SELECT tower_id, duration_sec,",
      "         ROW_NUMBER() OVER (PARTITION BY tower_id ORDER BY duration_sec, call_id) AS rn,",
      "         COUNT(*) OVER (PARTITION BY tower_id) AS cnt",
      "  FROM CallRecord",
      "  WHERE end_reason = 'normal'",
      ")",
      "SELECT tower_id, MAX(cnt) AS completed_calls, ROUND(AVG(duration_sec), 1) AS median_duration_sec",
      "FROM ranked",
      "WHERE rn IN (FLOOR((cnt + 1) / 2), FLOOR((cnt + 2) / 2))",
      "GROUP BY tower_id",
      "ORDER BY tower_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH ranked AS (",
        "  SELECT tower_id, duration_sec,",
        "         ROW_NUMBER() OVER (PARTITION BY tower_id ORDER BY duration_sec, call_id) AS rn,",
        "         COUNT(*) OVER (PARTITION BY tower_id) AS cnt",
        "  FROM CallRecord WHERE end_reason = 'normal'",
        ")",
        "SELECT tower_id, MIN(cnt) AS completed_calls, ROUND(SUM(duration_sec) / COUNT(*), 1) AS median_duration_sec",
        "FROM ranked",
        "WHERE rn BETWEEN cnt / 2 AND cnt / 2 + 1",
        "GROUP BY tower_id",
        "ORDER BY tower_id",
      ].join("\n"),
      [
        "WITH c AS (SELECT call_id, tower_id, duration_sec FROM CallRecord WHERE end_reason = 'normal'),",
        "pos AS (",
        "  SELECT a.tower_id, a.duration_sec,",
        "         (SELECT COUNT(*) FROM c b WHERE b.tower_id = a.tower_id",
        "            AND (b.duration_sec < a.duration_sec OR (b.duration_sec = a.duration_sec AND b.call_id <= a.call_id))) AS rn,",
        "         (SELECT COUNT(*) FROM c b WHERE b.tower_id = a.tower_id) AS cnt",
        "  FROM c a",
        ")",
        "SELECT tower_id, MAX(cnt) AS completed_calls, ROUND(AVG(duration_sec), 1) AS median_duration_sec",
        "FROM pos WHERE 2 * rn IN (cnt, cnt + 1, cnt + 2)",
        "GROUP BY tower_id ORDER BY tower_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Number each tower's completed calls by duration, and count them, with two window functions.",
      "For n calls the middle positions are ⌊(n+1)/2⌋ and ⌊(n+2)/2⌋ — the same position when n is odd.",
      "Averaging the one or two middle rows gives the median in both cases.",
    ],
    editorial: [
      "MySQL has no MEDIAN aggregate, so the median is built from positions. After dropping the dropped calls, `ROW_NUMBER()` orders each tower's durations (with `call_id` breaking equal durations, so every row has a unique position) and `COUNT(*) OVER (PARTITION BY tower_id)` puts the tower's count on every row.",
      "",
      "For `n` rows the middle positions are `FLOOR((n + 1) / 2)` and `FLOOR((n + 2) / 2)`: for n = 4 that is 2 and 3, for n = 5 both are 3. Keeping the rows at those positions and averaging them yields the median either way — one row averaged is itself. Equal durations do not disturb this: tied values sit next to each other in the order, and whichever of them lands in the middle has the same value. The result is rounded to one decimal, and halves such as 82.5 are exact.",
      "",
      "`rn BETWEEN n/2 AND n/2 + 1` selects the same middle rows with decimal division. Without window functions, a correlated count of the calls that sort before each call gives its position — correct but quadratic per tower. The window version costs one sort per tower.",
    ].join("\n"),
  },

  {
    slug: "prepaid-recharge-next-month-retention-by-cohort",
    title: "Prepaid Recharge Next-Month Retention by Cohort",
    difficulty: "HARD",
    topics: ["Dates", "Subqueries", "Aggregation"],
    description: [
      "Growth tracks how many new prepaid subscribers come back. A subscriber's **cohort** is the calendar month of their first recharge; they are **retained** if they recharge again at any time in the **calendar month right after** that first month (a second recharge later in the same month, or only two months later, does not count).",
      "",
      "Return one row per cohort with the columns `cohort_month` (as `'YYYY-MM'`), `cohort_size`, `retained` and `retention_pct` (`100 * retained / cohort_size`, **rounded to 2 decimals**). Order by `cohort_month`.",
    ].join("\n"),
    tables: [
      {
        name: "Recharge",
        columns: [
          { name: "recharge_id", type: "int" },
          { name: "subscriber_id", type: "int" },
          { name: "recharge_date", type: "date" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["recharge_id"],
        note: "Every recharge ever made; a subscriber's earliest row is their first recharge.",
      },
    ],
    examples: [
      {
        Recharge: [
          [1, 1, "2024-01-05", 299],
          [2, 1, "2024-02-10", 299],
          [3, 2, "2024-01-31", 579],
          [4, 2, "2024-03-01", 579],
          [5, 3, "2024-01-20", 98],
          [6, 3, "2024-01-28", 98],
          [7, 4, "2024-02-29", 299],
          [8, 4, "2024-03-31", 299],
          [9, 5, "2024-02-15", 719],
          [10, 6, "2023-12-30", 299],
          [11, 6, "2024-01-02", 299],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const rows: Cell[][] = [];
      for (const s of seq(1, n)) {
        let date = dateBetween(rng, "2023-11-20", "2024-03-10");
        for (let k = ri(rng, 1, 4); k > 0; k--) {
          rows.push([0, s, date, pick(rng, [98, 299, 579, 719])]);
          date = addDays(date, chance(rng, 0.2) ? pick(rng, [1, 29, 31]) : ri(rng, 5, 60));
        }
      }
      return { Recharge: sample(rng, rows, rows.length).map((r, i) => [i + 1, r[1]!, r[2]!, r[3]!]) };
    },
    solution: [
      "WITH firsts AS (",
      "  SELECT subscriber_id, MIN(recharge_date) AS first_date",
      "  FROM Recharge",
      "  GROUP BY subscriber_id",
      "), cohort AS (",
      "  SELECT subscriber_id,",
      "         DATE_FORMAT(first_date, '%Y-%m') AS cohort_month,",
      "         DATE_FORMAT(DATE_ADD(DATE_FORMAT(first_date, '%Y-%m-01'), INTERVAL 1 MONTH), '%Y-%m') AS next_month",
      "  FROM firsts",
      "), flagged AS (",
      "  SELECT c.cohort_month,",
      "         CASE WHEN EXISTS (SELECT 1 FROM Recharge r",
      "                           WHERE r.subscriber_id = c.subscriber_id",
      "                             AND DATE_FORMAT(r.recharge_date, '%Y-%m') = c.next_month)",
      "              THEN 1 ELSE 0 END AS kept",
      "  FROM cohort c",
      ")",
      "SELECT cohort_month, COUNT(*) AS cohort_size, SUM(kept) AS retained,",
      "       ROUND(100 * SUM(kept) / COUNT(*), 2) AS retention_pct",
      "FROM flagged",
      "GROUP BY cohort_month",
      "ORDER BY cohort_month",
    ].join("\n"),
    alternatives: [
      [
        "WITH m AS (",
        "  SELECT DISTINCT subscriber_id, YEAR(recharge_date) * 12 + MONTH(recharge_date) AS mi FROM Recharge",
        "), firsts AS (",
        "  SELECT subscriber_id, MIN(mi) AS first_mi FROM m GROUP BY subscriber_id",
        ")",
        "SELECT CONCAT(FLOOR((f.first_mi - 1) / 12), '-', LPAD((f.first_mi - 1) % 12 + 1, 2, '0')) AS cohort_month,",
        "       COUNT(*) AS cohort_size,",
        "       COUNT(n.subscriber_id) AS retained,",
        "       ROUND(100 * COUNT(n.subscriber_id) / COUNT(*), 2) AS retention_pct",
        "FROM firsts f",
        "LEFT JOIN m n ON n.subscriber_id = f.subscriber_id AND n.mi = f.first_mi + 1",
        "GROUP BY f.first_mi",
        "ORDER BY f.first_mi",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Find each subscriber's first recharge date with MIN per subscriber; its month is the cohort.",
      "The next month is safest computed from the first day of the cohort month — adding a month to 31 January is ambiguous.",
      "Numbering months as `YEAR * 12 + MONTH` makes \"the next month\" simply +1, across year ends too.",
      "Retained is a yes/no per subscriber; average or sum it per cohort.",
    ],
    editorial: [
      "Retention cohorts are built in three steps. First, each subscriber's first recharge: `MIN(recharge_date)` grouped by subscriber, whose month is the cohort. Second, a yes/no per subscriber: did they recharge in the month after? Third, aggregate per cohort.",
      "",
      "The month arithmetic is where it goes wrong. Adding one month to 31 January is not well defined, so the reference first snaps the date to the first of its month (`DATE_FORMAT(first_date, '%Y-%m-01')`) and adds a month to that — 1 January becomes 1 February, 1 December 2023 becomes 1 January 2024. An `EXISTS` then asks whether the subscriber has any recharge whose `'YYYY-MM'` equals that next month. A second recharge in the same month or one two months later does not match, which is exactly the statement's rule. The flags are summed for `retained`, and the percentage is rounded to two decimals.",
      "",
      "The alternative numbers months as `YEAR * 12 + MONTH`, so the next month is the first month plus one, and finds retained subscribers with a LEFT JOIN against the distinct months each subscriber was active; `COUNT(n.subscriber_id)` counts only the matches. It rebuilds the `'YYYY-MM'` label from the month number. Both read the table a couple of times.",
    ].join("\n"),
  },

  {
    slug: "daily-network-drop-rate-with-silent-days",
    title: "Daily Network Drop Rate Including Silent Days",
    difficulty: "HARD",
    topics: ["Dates", "Joins", "Conditional Logic"],
    description: [
      "The NOC dashboard shows the dropped-call rate for **every day from 2024-07-01 to 2024-07-10**, even a day on which no call connected. A call **connected** if it ended `'normal'` or `'dropped'`; `'failed'` attempts never connected. The day's drop rate is `100 * dropped / connected`.",
      "",
      "Return exactly ten rows with the columns `call_date`, `connected_calls`, `dropped_calls` and `drop_rate_pct` (**rounded to 2 decimals**). On a day with no connected calls the counts are 0 and the rate is NULL. Attempts outside the window are ignored. Order by `call_date`.",
    ].join("\n"),
    tables: [
      {
        name: "CallAttempt",
        columns: [
          { name: "call_id", type: "int" },
          { name: "tower_id", type: "int" },
          { name: "started_at", type: "datetime" },
          { name: "end_reason", type: "enum", values: ["normal", "dropped", "failed"] },
        ],
        primaryKey: ["call_id"],
        note: "One call attempt across the whole network, dated by when it started.",
      },
    ],
    examples: [
      {
        CallAttempt: [
          [1, 101, "2024-06-30 23:59:00", "dropped"],
          [2, 101, "2024-07-01 08:00:00", "normal"],
          [3, 102, "2024-07-01 09:30:00", "dropped"],
          [4, 101, "2024-07-01 21:10:00", "normal"],
          [5, 103, "2024-07-02 00:00:00", "normal"],
          [6, 102, "2024-07-02 13:45:00", "failed"],
          [7, 103, "2024-07-04 18:20:00", "dropped"],
          [8, 101, "2024-07-05 07:15:00", "failed"],
          [9, 102, "2024-07-08 11:00:00", "normal"],
          [10, 101, "2024-07-11 00:00:00", "dropped"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 0, 26);
      const days = sample(rng, seq(0, 12).map((k) => addDays("2024-06-30", k)), ri(rng, 1, 8));
      const rows = seq(1, n).map((id) => [
        id, pick(rng, [101, 102, 103, 104]), stamp(pick(rng, days), ri(rng, 0, 23), ri(rng, 0, 59)),
        pick(rng, ["normal", "normal", "normal", "dropped", "failed"]),
      ]);
      return { CallAttempt: rows };
    },
    solution: [
      "WITH RECURSIVE days AS (",
      "  SELECT CAST('2024-07-01' AS DATE) AS d",
      "  UNION ALL",
      "  SELECT DATE_ADD(d, INTERVAL 1 DAY) FROM days WHERE d < '2024-07-10'",
      "), daily AS (",
      "  SELECT CAST(started_at AS DATE) AS d,",
      "         SUM(CASE WHEN end_reason IN ('normal', 'dropped') THEN 1 ELSE 0 END) AS connected,",
      "         SUM(CASE WHEN end_reason = 'dropped' THEN 1 ELSE 0 END) AS dropped",
      "  FROM CallAttempt",
      "  GROUP BY CAST(started_at AS DATE)",
      ")",
      "SELECT days.d AS call_date,",
      "       COALESCE(daily.connected, 0) AS connected_calls,",
      "       COALESCE(daily.dropped, 0) AS dropped_calls,",
      "       ROUND(100 * daily.dropped / NULLIF(daily.connected, 0), 2) AS drop_rate_pct",
      "FROM days",
      "LEFT JOIN daily ON daily.d = days.d",
      "ORDER BY call_date",
    ].join("\n"),
    alternatives: [
      [
        "WITH n AS (",
        "  SELECT 0 AS k UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4",
        "  UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9",
        "), days AS (",
        "  SELECT DATE_ADD('2024-07-01', INTERVAL k DAY) AS d, DATE_ADD('2024-07-01', INTERVAL k + 1 DAY) AS next_d FROM n",
        "), counted AS (",
        "  SELECT d,",
        "         (SELECT COUNT(*) FROM CallAttempt a WHERE a.started_at >= days.d AND a.started_at < days.next_d",
        "            AND a.end_reason <> 'failed') AS connected,",
        "         (SELECT COUNT(*) FROM CallAttempt a WHERE a.started_at >= days.d AND a.started_at < days.next_d",
        "            AND a.end_reason = 'dropped') AS dropped",
        "  FROM days",
        ")",
        "SELECT d AS call_date, connected AS connected_calls, dropped AS dropped_calls,",
        "       IF(connected = 0, NULL, ROUND(100 * dropped / connected, 2)) AS drop_rate_pct",
        "FROM counted",
        "ORDER BY call_date",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Days with no rows cannot come out of `CallAttempt` — generate the ten dates yourself.",
      "A recursive CTE that starts at 2024-07-01 and adds a day until 2024-07-10 builds the calendar.",
      "LEFT JOIN the per-day counts onto the calendar, turn missing counts into 0 and guard the division with NULLIF.",
    ],
    editorial: [
      "A report that must show days with no data cannot be driven by the data table: a day without rows has no group. So the query starts from a **calendar**. The recursive CTE seeds 2024-07-01 and adds one day while the date is before 2024-07-10, producing exactly the ten dates; the bound keeps the recursion short.",
      "",
      "Separately, the attempts are grouped by their date — `CAST(started_at AS DATE)` drops the time, so 00:00:00 and 23:59:00 belong to their own day — with two conditional counts: connected (normal or dropped) and dropped. Failed attempts add to neither. The calendar is then LEFT JOINed to these counts, which keeps every date and also discards attempts outside the window, such as 30 June or 11 July.",
      "",
      "On a date with no attempts the joined counts are NULL; `COALESCE(…, 0)` turns them into 0. The rate divides by `NULLIF(connected, 0)`, so a silent day — or one with only failed attempts — gets NULL instead of a division error. Instead of recursion, a ten-row numbers table works as the calendar, with correlated counts over each day's half-open time range.",
    ].join("\n"),
  },

  {
    slug: "top-two-data-consumers-per-circle-with-ties",
    title: "Top Two Data Consumers per Circle, Ties Included",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation", "Joins"],
    description: [
      "For the September loyalty campaign, each circle rewards the subscribers whose September 2024 data usage is among the **two highest distinct totals** of that circle. Equal totals share a place, so a circle with totals 9000, 9000, 7500, 6000 rewards three subscribers (two at place 1, one at place 2).",
      "",
      "A subscriber's total is the sum of their `mb_used` dated in September 2024; subscribers with no September usage take no part. Return `circle`, `subscriber_id`, `name`, `total_mb` and `circle_rank` (1 or 2). Order by `circle`, then `circle_rank`, then `subscriber_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Subscriber",
        columns: [
          { name: "subscriber_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "circle", type: "varchar" },
        ],
        primaryKey: ["subscriber_id"],
        note: "`circle` is the subscriber's home circle.",
      },
      {
        name: "DataUsage",
        columns: [
          { name: "usage_id", type: "int" },
          { name: "subscriber_id", type: "int" },
          { name: "usage_date", type: "date" },
          { name: "mb_used", type: "int" },
        ],
        primaryKey: ["usage_id"],
        note: "Data used in one session; every `subscriber_id` is in `Subscriber`.",
      },
    ],
    examples: [
      {
        Subscriber: [
          [1, "Aarav", "Karnataka"],
          [2, "Diya", "Karnataka"],
          [3, "Ishaan", "Karnataka"],
          [4, "Kavya", "Karnataka"],
          [5, "Neha", "Kerala"],
          [6, "Rahul", "Kerala"],
          [7, "Riya", "Kerala"],
        ],
        DataUsage: [
          [1, 1, "2024-09-02", 6000],
          [2, 1, "2024-09-15", 3000],
          [3, 2, "2024-09-30", 9000],
          [4, 3, "2024-09-10", 7500],
          [5, 4, "2024-09-12", 6000],
          [6, 4, "2024-08-31", 8000],
          [7, 5, "2024-09-01", 4000],
          [8, 6, "2024-10-01", 9500],
          [9, 7, "2024-09-20", 2500],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const who = names(rng, n);
      const circles = sample(rng, CIRCLES, ri(rng, 1, 3));
      const subs = seq(1, n).map((id, i) => [id, who[i]!, pick(rng, circles)]);
      const m = ri(rng, 1, 26);
      const usage = seq(1, m).map((id) => {
        const date = chance(rng, 0.2) ? pick(rng, ["2024-08-31", "2024-09-01", "2024-09-30", "2024-10-01"]) : dateBetween(rng, "2024-08-25", "2024-10-05");
        return [id, ri(rng, 1, n), date, roundTo(rng, 500, 4000, 500)];
      });
      return { Subscriber: subs, DataUsage: usage };
    },
    solution: [
      "WITH totals AS (",
      "  SELECT s.circle, s.subscriber_id, s.name, SUM(d.mb_used) AS total_mb",
      "  FROM Subscriber s",
      "  JOIN DataUsage d ON d.subscriber_id = s.subscriber_id",
      "  WHERE d.usage_date BETWEEN '2024-09-01' AND '2024-09-30'",
      "  GROUP BY s.circle, s.subscriber_id, s.name",
      "), ranked AS (",
      "  SELECT circle, subscriber_id, name, total_mb,",
      "         DENSE_RANK() OVER (PARTITION BY circle ORDER BY total_mb DESC) AS circle_rank",
      "  FROM totals",
      ")",
      "SELECT circle, subscriber_id, name, total_mb, circle_rank",
      "FROM ranked",
      "WHERE circle_rank <= 2",
      "ORDER BY circle, circle_rank, subscriber_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH totals AS (",
        "  SELECT s.circle, s.subscriber_id, s.name, SUM(d.mb_used) AS total_mb",
        "  FROM Subscriber s JOIN DataUsage d ON d.subscriber_id = s.subscriber_id",
        "  WHERE d.usage_date >= '2024-09-01' AND d.usage_date < '2024-10-01'",
        "  GROUP BY s.circle, s.subscriber_id, s.name",
        "), placed AS (",
        "  SELECT t.*, 1 + (SELECT COUNT(DISTINCT o.total_mb) FROM totals o",
        "                   WHERE o.circle = t.circle AND o.total_mb > t.total_mb) AS circle_rank",
        "  FROM totals t",
        ")",
        "SELECT circle, subscriber_id, name, total_mb, circle_rank FROM placed",
        "WHERE circle_rank <= 2",
        "ORDER BY circle, circle_rank, subscriber_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Total each subscriber's September usage first, keeping their circle.",
      "\"Two highest distinct totals\" with shared places is what `DENSE_RANK` numbers; `RANK` would skip place 2 after a tie.",
      "A subscriber's place is also 1 + the number of distinct totals above theirs in the circle.",
    ],
    editorial: [
      "First aggregate: join subscribers to their usage, keep September 2024 (`BETWEEN '2024-09-01' AND '2024-09-30'` — the 31 August and 1 October rows stay out), and sum per subscriber, carrying the home circle along in the GROUP BY.",
      "",
      "Then rank inside each circle. The choice of ranking function is the whole problem. `DENSE_RANK()` gives equal totals the same number and continues with the next integer, so ranks 1 and 2 are exactly the two highest distinct totals, however many subscribers share them. `RANK()` would jump from 1 to 3 after a tie at the top and lose the second place; `ROW_NUMBER()` would break ties arbitrarily and drop a winner. Window results cannot be filtered in the same SELECT, so the rank is computed in a CTE and `circle_rank <= 2` is applied outside.",
      "",
      "The correlated alternative computes the place directly — one plus the number of distinct totals in the same circle that are higher — which is the definition of a dense rank. It is quadratic in a circle's size but needs no window functions.",
    ].join("\n"),
  },

  {
    slug: "electricity-bill-settlement-from-instalments",
    title: "Electricity Bill Settlement From Part Payments",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins", "Conditional Logic"],
    description: [
      "Consumers may pay an electricity bill in several parts. A bill is **settled** on the date its payments, added up in payment order (by `paid_on`, then `payment_id`), **first reach or exceed** the bill `amount`; overpayment is possible.",
      "",
      "Return every bill with the columns `bill_id`, `consumer_no`, `settled_on` (NULL if the payments never reach the amount, or there are none) and `settlement_status`: `'on time'` when settled on or before `due_date`, `'late'` when settled after it, `'unsettled'` otherwise. Order by `bill_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Bill",
        columns: [
          { name: "bill_id", type: "int" },
          { name: "consumer_no", type: "int" },
          { name: "amount", type: "int" },
          { name: "due_date", type: "date" },
        ],
        primaryKey: ["bill_id"],
        note: "One monthly bill; `amount` is in rupees.",
      },
      {
        name: "Payment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "bill_id", type: "int" },
          { name: "paid_on", type: "date" },
          { name: "amount_paid", type: "int" },
        ],
        primaryKey: ["payment_id"],
        note: "A part payment towards one bill; `amount_paid` is always positive.",
      },
    ],
    examples: [
      {
        Bill: [
          [1, 50011, 1200, "2024-05-20"],
          [2, 50011, 1500, "2024-06-20"],
          [3, 50027, 900, "2024-05-20"],
          [4, 50034, 2000, "2024-05-20"],
          [5, 50042, 700, "2024-05-20"],
        ],
        Payment: [
          [1, 1, "2024-05-10", 500],
          [2, 1, "2024-05-20", 700],
          [3, 2, "2024-06-15", 1000],
          [4, 2, "2024-06-25", 300],
          [5, 2, "2024-07-02", 400],
          [6, 3, "2024-05-25", 1000],
          [7, 4, "2024-05-15", 1500],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const bills: Cell[][] = [];
      const pays: Cell[][] = [];
      for (const id of seq(1, n)) {
        const amount = roundTo(rng, 500, 3000, 100);
        const due = pick(rng, ["2024-05-20", "2024-06-20", "2024-07-20"]);
        bills.push([id, ri(rng, 50001, 50008), amount, due]);
        let left = amount + pick(rng, [0, 0, 0, 100, -100, -300]);
        let date = addDays(due, ri(rng, -15, 3));
        for (let k = ri(rng, 0, 4); k > 0 && left > 0; k--) {
          const part = k === 1 ? left : Math.min(left, roundTo(rng, 100, amount, 100));
          pays.push([0, id, date, part]);
          left -= part;
          date = addDays(date, chance(rng, 0.25) ? 0 : ri(rng, 1, 10));
        }
      }
      return { Bill: bills, Payment: sample(rng, pays, pays.length).map((p, i) => [i + 1, p[1]!, p[2]!, p[3]!]) };
    },
    solution: [
      "WITH running AS (",
      "  SELECT bill_id, paid_on,",
      "         SUM(amount_paid) OVER (PARTITION BY bill_id ORDER BY paid_on, payment_id",
      "                                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS paid_so_far",
      "  FROM Payment",
      "), settled AS (",
      "  SELECT r.bill_id, MIN(r.paid_on) AS settled_on",
      "  FROM running r",
      "  JOIN Bill b ON b.bill_id = r.bill_id",
      "  WHERE r.paid_so_far >= b.amount",
      "  GROUP BY r.bill_id",
      ")",
      "SELECT b.bill_id, b.consumer_no, s.settled_on,",
      "       CASE WHEN s.settled_on IS NULL THEN 'unsettled'",
      "            WHEN s.settled_on <= b.due_date THEN 'on time'",
      "            ELSE 'late' END AS settlement_status",
      "FROM Bill b",
      "LEFT JOIN settled s ON s.bill_id = b.bill_id",
      "ORDER BY b.bill_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT bill_id, consumer_no, settled_on,",
        "       IF(settled_on IS NULL, 'unsettled', IF(settled_on > due_date, 'late', 'on time')) AS settlement_status",
        "FROM (",
        "  SELECT b.bill_id, b.consumer_no, b.due_date,",
        "         (SELECT MIN(p.paid_on) FROM Payment p",
        "           WHERE p.bill_id = b.bill_id",
        "             AND (SELECT SUM(q.amount_paid) FROM Payment q",
        "                   WHERE q.bill_id = p.bill_id",
        "                     AND (q.paid_on < p.paid_on OR (q.paid_on = p.paid_on AND q.payment_id <= p.payment_id))) >= b.amount",
        "         ) AS settled_on",
        "  FROM Bill b",
        ") x",
        "ORDER BY bill_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "A running total of each bill's payments, in payment order, shows how much had been paid after every instalment.",
      "The settlement date is the earliest payment at which that running total is at least the bill amount.",
      "Start the final query from `Bill` with a LEFT JOIN, so bills that never settle — or have no payments — still appear.",
    ],
    editorial: [
      "The question \"when was it fully paid?\" is a **running total** question. `SUM(amount_paid) OVER (PARTITION BY bill_id ORDER BY paid_on, payment_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` gives, on each payment, the total paid towards that bill up to and including it. The explicit ROWS frame with a unique order matters: with RANGE, two payments on the same day would both see the day's combined total — harmless for the date here, but a habit worth keeping.",
      "",
      "Because payments are positive the running total only grows, so the first payment where it reaches the bill amount is simply the earliest `paid_on` among the rows with `paid_so_far >= amount` — a MIN after a join to `Bill` for the amount. Overpayments are fine: the threshold is reached, not matched.",
      "",
      "The final SELECT starts from `Bill` and LEFT JOINs the settlement dates, so a bill with too little or no money paid survives with `settled_on` NULL. The CASE grades it: NULL is unsettled, a date on or before the due date is on time, anything later is late. The correlated alternative recomputes the running total per payment with a nested SUM — quadratic, but window-free.",
    ].join("\n"),
  },
];
