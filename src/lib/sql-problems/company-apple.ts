import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, atTime, chance, dateBetween, names, pick, ri, roundTo, sample } from "./kit.js";

/**
 * Company set — Apple: the questions a data analyst or engineer at a company
 * shaped like Apple is asked about its own business — Genius Bar
 * appointments and retail sales, AppleCare claims and serial numbers,
 * trade-ins, iCloud storage plans and iCloud+ subscribers, App Store
 * submissions, in-app purchases, developer proceeds and billing retries,
 * Apple Pay volume and fraud, iOS adoption and updates, and the supply chain
 * (component yields, assembly-line runs, launch-day pre-orders). Every
 * schema and every number is invented for practice — none of it is Apple's
 * real data or real tables. Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
const pad = (n: number, w = 2) => String(n).padStart(w, "0");
/** 'YYYY-MM-DD HH:MM:00' from a date and minutes after midnight. */
const at = (date: string, minutes: number): string => {
  const d = addDays(date, Math.floor(minutes / 1440));
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${d} ${pad(Math.floor(m / 60))}:${pad(m % 60)}:00`;
};
/** The first day of the month `k` months after `ym` ('YYYY-MM'). */
const monthStart = (ym: string, k: number): string => {
  const [y, m] = ym.split("-").map(Number) as [number, number];
  const idx = y * 12 + (m - 1) + k;
  return `${Math.floor(idx / 12)}-${pad((idx % 12) + 1)}-01`;
};

const STORES = [
  "Apple BKC", "Apple Saket", "Apple Fifth Avenue", "Apple Regent Street",
  "Apple Marina Bay Sands", "Apple Union Square", "Apple Ginza", "Apple Michigan Avenue",
] as const;
const APPS = [
  "Pocket Tabla", "ChaiTime Journal", "Metro Mapper", "Kirana Ledger", "Raga Tuner", "Pixel Rangoli",
  "Cricket Scorer Pro", "Monsoon Weather", "Yoga Streak", "Tiffin Planner", "Sketch Studio", "Budget Bird",
] as const;
const CATEGORIES = ["Games", "Productivity", "Music", "Health & Fitness"] as const;
const TEAMS = ["Lotus Labs", "Banyan Apps", "Indigo Studio", "Peacock Games", "Saffron Soft", "Monsoon Works", "Ganga Digital", "Neem Tech"] as const;
const COUNTRIES = ["India", "Japan", "Singapore", "UK", "US"] as const;
const SERIAL_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"; // no O, no I
const serialOf = (rng: () => number, len = 12): string => Array.from({ length: len }, () => SERIAL_CHARS[ri(rng, 0, SERIAL_CHARS.length - 1)]!).join("");

export const COMPANY_APPLE: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "apple-genius-bar-no-shows-at-every-store",
    title: "Apple: Genius Bar No-Shows at Every Store",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "The retail operations team wants to know which stores lose the most Genius Bar slots to customers who book an appointment and never turn up.",
      "",
      "For **every** store, return `store_name` and `no_shows`, the number of its appointments whose status is `no_show`. A store with no no-shows — including a store with no appointments at all — appears with `0`. Return the rows in any order.",
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
        note: "One row per retail store.",
      },
      {
        name: "GeniusAppointment",
        columns: [
          { name: "appointment_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "slot_at", type: "datetime" },
          { name: "status", type: "enum", values: ["completed", "no_show", "cancelled"] },
        ],
        primaryKey: ["appointment_id"],
        note: "One row per booked Genius Bar slot; `store_id` always names a store.",
      },
    ],
    examples: [
      {
        Store: [
          [1, "Apple BKC", "Mumbai"],
          [2, "Apple Saket", "Delhi"],
          [3, "Apple Regent Street", "London"],
          [4, "Apple Ginza", "Tokyo"],
        ],
        GeniusAppointment: [
          [101, 1, 501, "2025-03-03 10:00:00", "no_show"],
          [102, 1, 502, "2025-03-03 10:30:00", "completed"],
          [103, 1, 503, "2025-03-04 11:00:00", "no_show"],
          [104, 2, 504, "2025-03-03 12:00:00", "cancelled"],
          [105, 2, 505, "2025-03-05 16:00:00", "completed"],
          [106, 3, 506, "2025-03-06 09:30:00", "no_show"],
        ],
      },
    ],
    gen: (rng) => {
      const stores = sample(rng, STORES, ri(rng, 1, 5)).map((s, i) => [i + 1, s, "City"]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 20);
      const appts: Cell[][] = seq(101, n).map((id) => [
        id,
        ri(rng, 1, stores.length),
        ri(rng, 500, 540),
        atTime(rng, dateBetween(rng, "2025-03-01", "2025-03-14")),
        pick(rng, ["completed", "completed", "no_show", "no_show", "cancelled"]),
      ]);
      return { Store: stores, GeniusAppointment: appts };
    },
    solution: [
      "SELECT s.store_name, COUNT(a.appointment_id) AS no_shows",
      "FROM Store s",
      "LEFT JOIN GeniusAppointment a ON a.store_id = s.store_id AND a.status = 'no_show'",
      "GROUP BY s.store_id, s.store_name",
    ].join("\n"),
    alternatives: [
      "SELECT s.store_name, (SELECT COUNT(*) FROM GeniusAppointment a WHERE a.store_id = s.store_id AND a.status = 'no_show') AS no_shows FROM Store s",
      "SELECT s.store_name, COALESCE(SUM(CASE WHEN a.status = 'no_show' THEN 1 ELSE 0 END), 0) AS no_shows FROM Store s LEFT JOIN GeniusAppointment a ON a.store_id = s.store_id GROUP BY s.store_id, s.store_name",
    ],
    hints: [
      "Every store must appear, so start from `Store` and keep its rows even when nothing matches.",
      "Put the status test in the `ON` clause of a LEFT JOIN, not in `WHERE` — a `WHERE` would throw away the stores with no no-shows.",
      "`COUNT(column)` skips NULLs, so a store that matched nothing counts 0.",
    ],
    editorial: [
      "The answer has one row per store, including stores with nothing to count, so the query starts from `Store` and **LEFT JOINs** the appointments. The subtle part is where the `status = 'no_show'` test goes. In the `ON` clause it decides which appointments attach to a store; a store with none still survives with NULLs on the appointment side. In `WHERE` it would run after the join and drop exactly those NULL rows, so stores with zero no-shows would vanish.",
      "",
      "After grouping by store, `COUNT(a.appointment_id)` counts only the attached appointments — `COUNT(*)` would count the single NULL row of an unmatched store as 1. Group by `store_id` as well as the name, so two stores that happened to share a name would stay apart.",
      "",
      "A correlated subquery per store gives the same numbers and reads naturally; conditional `SUM(CASE …)` over a plain LEFT JOIN works too, with `COALESCE` turning the NULL sum of an empty store into 0. All three are one pass over the appointments with an index on `store_id`.",
    ].join("\n"),
  },

  {
    slug: "apple-icloud-accounts-over-their-storage-plan",
    title: "Apple: iCloud Accounts Using More Than Their Plan",
    difficulty: "EASY",
    topics: ["Conditional Logic", "Basics"],
    description: [
      "The iCloud growth team wants to send an upgrade prompt to accounts that are already storing more than their plan allows.",
      "",
      "The plans hold `free_5gb` → 5 GB, `plus_50gb` → 50 GB, `plus_200gb` → 200 GB and `plus_2tb` → 2048 GB. Return every account whose `used_gb` is **strictly greater** than its plan's quota, with the columns `account_id`, `plan`, `used_gb` and `over_by_gb` (used minus quota, rounded to 1 decimal place). An account sitting exactly at its quota is not over. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "ICloudAccount",
        columns: [
          { name: "account_id", type: "int" },
          { name: "apple_id", type: "varchar" },
          { name: "plan", type: "enum", values: ["free_5gb", "plus_50gb", "plus_200gb", "plus_2tb"] },
          { name: "used_gb", type: "decimal" },
        ],
        primaryKey: ["account_id"],
        note: "One row per Apple Account with iCloud. `used_gb` is the storage in use today, to one decimal place.",
      },
    ],
    examples: [
      {
        ICloudAccount: [
          [1, "aarav@icloud.com", "free_5gb", 6.4],
          [2, "diya@icloud.com", "free_5gb", 5.0],
          [3, "kabir@icloud.com", "plus_50gb", 48.2],
          [4, "meera@icloud.com", "plus_50gb", 61.7],
          [5, "rohan@icloud.com", "plus_200gb", 199.9],
          [6, "zara@icloud.com", "plus_2tb", 2050.5],
          [7, "ishaan@icloud.com", "plus_2tb", 1200.0],
        ],
      },
    ],
    gen: (rng) => {
      const quota: Record<string, number> = { free_5gb: 5, plus_50gb: 50, plus_200gb: 200, plus_2tb: 2048 };
      const n = ri(rng, 1, 15);
      const who = names(rng, n);
      const rows: Cell[][] = seq(1, n).map((id, i) => {
        const plan = pick(rng, Object.keys(quota));
        const q = quota[plan]!;
        const used = chance(rng, 0.15) ? q : Math.round(q * (0.4 + rng() * 0.9) * 10) / 10;
        return [id, `${who[i]!.toLowerCase()}@icloud.com`, plan, used];
      });
      return { ICloudAccount: rows };
    },
    solution: [
      "SELECT account_id, plan, used_gb, ROUND(used_gb - quota_gb, 1) AS over_by_gb",
      "FROM (",
      "  SELECT account_id, plan, used_gb,",
      "         CASE plan WHEN 'free_5gb' THEN 5 WHEN 'plus_50gb' THEN 50 WHEN 'plus_200gb' THEN 200 ELSE 2048 END AS quota_gb",
      "  FROM ICloudAccount",
      ") a",
      "WHERE used_gb > quota_gb",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.account_id, a.plan, a.used_gb, ROUND(a.used_gb - q.quota_gb, 1) AS over_by_gb",
        "FROM ICloudAccount a",
        "JOIN (SELECT 'free_5gb' AS plan, 5 AS quota_gb UNION ALL SELECT 'plus_50gb', 50 UNION ALL SELECT 'plus_200gb', 200 UNION ALL SELECT 'plus_2tb', 2048) q ON q.plan = a.plan",
        "WHERE a.used_gb > q.quota_gb",
      ].join("\n"),
      "SELECT account_id, plan, used_gb, ROUND(used_gb - IF(plan = 'free_5gb', 5, IF(plan = 'plus_50gb', 50, IF(plan = 'plus_200gb', 200, 2048))), 1) AS over_by_gb FROM ICloudAccount WHERE used_gb > IF(plan = 'free_5gb', 5, IF(plan = 'plus_50gb', 50, IF(plan = 'plus_200gb', 200, 2048)))",
    ],
    hints: [
      "The quota is not stored — it follows from the plan name. Turn the plan into a number first.",
      "A `CASE plan WHEN … THEN … END` maps each plan to its quota.",
      "Compute the quota once in a derived table, then filter with a strict `>`.",
    ],
    editorial: [
      "The table holds the plan's *name*, not its size, so the first step is to translate each plan into its quota in gigabytes. A simple `CASE plan WHEN 'free_5gb' THEN 5 … END` does it; computing it inside a derived table lets the outer query both filter on it and subtract it without writing the CASE twice.",
      "",
      "The filter is strict: an account at exactly 5.0 GB on the free plan is full but not over, so `used_gb > quota_gb` excludes it. `over_by_gb` is the difference rounded to one decimal place — rounding matters because the stored values are decimals and a subtraction such as 6.4 − 5 is not always exact in floating point.",
      "",
      "Two other shapes give the same rows: a tiny lookup table built with `UNION ALL` and joined on the plan name (handy once the plan list grows), or nested `IF`s. All of them read the table once.",
    ].join("\n"),
  },

  {
    slug: "apple-developer-teams-with-no-approved-app",
    title: "Apple: Developer Teams With No Approved App Yet",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "App Review's developer-relations team reaches out to enrolled developer teams that have not yet shipped anything on the App Store.",
      "",
      "Return the `developer_id` and `team_name` of every team that has **no submission with status `approved`** — whether its submissions were all rejected or are still in review, or it has never submitted at all. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Developer",
        columns: [
          { name: "developer_id", type: "int" },
          { name: "team_name", type: "varchar" },
          { name: "country", type: "varchar" },
        ],
        primaryKey: ["developer_id"],
        note: "One row per enrolled developer team.",
      },
      {
        name: "AppSubmission",
        columns: [
          { name: "submission_id", type: "int" },
          { name: "developer_id", type: "int" },
          { name: "app_name", type: "varchar" },
          { name: "status", type: "enum", values: ["approved", "rejected", "in_review"] },
        ],
        primaryKey: ["submission_id"],
        note: "One row per build sent to App Review; `developer_id` always names a team.",
      },
    ],
    examples: [
      {
        Developer: [
          [1, "Lotus Labs", "India"],
          [2, "Banyan Apps", "India"],
          [3, "Indigo Studio", "Japan"],
          [4, "Peacock Games", "UK"],
          [5, "Saffron Soft", "US"],
        ],
        AppSubmission: [
          [11, 1, "Pocket Tabla", "rejected"],
          [12, 1, "Pocket Tabla", "approved"],
          [13, 2, "Kirana Ledger", "rejected"],
          [14, 2, "Kirana Ledger", "in_review"],
          [15, 3, "Raga Tuner", "approved"],
          [16, 5, "Yoga Streak", "rejected"],
        ],
      },
    ],
    gen: (rng) => {
      const devs = sample(rng, TEAMS, ri(rng, 1, 8)).map((t, i) => [i + 1, t, pick(rng, COUNTRIES)]);
      const n = ri(rng, 0, 15);
      const subs: Cell[][] = seq(11, n).map((id) => [id, ri(rng, 1, devs.length), pick(rng, APPS), pick(rng, ["approved", "rejected", "rejected", "in_review"])]);
      return { Developer: devs, AppSubmission: subs };
    },
    solution: [
      "SELECT d.developer_id, d.team_name",
      "FROM Developer d",
      "WHERE NOT EXISTS (",
      "  SELECT 1 FROM AppSubmission s",
      "  WHERE s.developer_id = d.developer_id AND s.status = 'approved'",
      ")",
    ].join("\n"),
    alternatives: [
      "SELECT d.developer_id, d.team_name FROM Developer d LEFT JOIN AppSubmission s ON s.developer_id = d.developer_id AND s.status = 'approved' WHERE s.submission_id IS NULL",
      "SELECT developer_id, team_name FROM Developer WHERE developer_id NOT IN (SELECT developer_id FROM AppSubmission WHERE status = 'approved')",
    ],
    hints: [
      "This is an anti join: keep a team when a certain kind of row does **not** exist for it.",
      "Ask \"is there an approved submission for this team?\" with `NOT EXISTS`.",
      "If you use a LEFT JOIN, the `status = 'approved'` test belongs in the `ON` clause.",
    ],
    editorial: [
      "The question is about the *absence* of a row: a team qualifies when no approved submission exists for it. That is an **anti join**, and `NOT EXISTS` states it directly — for each team, look for an approved submission with its id, and keep the team only when the lookup finds nothing. Teams with only rejected or in-review builds fail the lookup, and so do teams that never submitted, which is exactly the set asked for.",
      "",
      "The LEFT JOIN form attaches only the approved submissions (the status test sits in `ON`) and keeps the rows where nothing attached, i.e. `s.submission_id IS NULL`. Moving the status test to `WHERE` would be a bug: it would drop the unmatched teams instead of finding them.",
      "",
      "`NOT IN` works here because `developer_id` is never NULL in the subquery; with a nullable column, a single NULL would make `NOT IN` return nothing, which is why `NOT EXISTS` is the safer habit. Each form is one probe per team with an index on `(developer_id, status)`.",
    ].join("\n"),
  },

  {
    slug: "apple-applecare-claims-in-a-devices-first-30-days",
    title: "Apple: AppleCare Claims Filed in a Device's First 30 Days",
    difficulty: "EASY",
    topics: ["Dates", "Joins"],
    description: [
      "The AppleCare quality team treats a claim filed soon after purchase as a possible out-of-box failure and reviews those claims every week.",
      "",
      "Return every claim filed **within 30 days of the device's purchase** — that is, 0 to 30 days after the purchase date, both ends included — with the columns `claim_id`, `model` and `days_after_purchase`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "DeviceSale",
        columns: [
          { name: "serial_number", type: "varchar" },
          { name: "model", type: "varchar" },
          { name: "purchase_date", type: "date" },
        ],
        primaryKey: ["serial_number"],
        note: "One row per device sold.",
      },
      {
        name: "AppleCareClaim",
        columns: [
          { name: "claim_id", type: "int" },
          { name: "serial_number", type: "varchar" },
          { name: "claim_date", type: "date" },
          { name: "issue", type: "enum", values: ["display", "battery", "accidental_damage", "audio", "other"] },
        ],
        primaryKey: ["claim_id"],
        note: "`serial_number` always names a sold device, and a claim is never dated before its purchase.",
      },
    ],
    examples: [
      {
        DeviceSale: [
          ["DX7F2KQ91LMA", "iPhone 16", "2025-01-05"],
          ["F4PRT8XH2NQC", "MacBook Air", "2025-01-10"],
          ["G9WZ3K7PL0RD", "iPad Air", "2024-12-20"],
          ["H2KM8TQ4VX6E", "iPhone 16 Pro", "2025-02-01"],
        ],
        AppleCareClaim: [
          [1, "DX7F2KQ91LMA", "2025-02-04", "display"],
          [2, "DX7F2KQ91LMA", "2025-02-05", "battery"],
          [3, "F4PRT8XH2NQC", "2025-01-10", "audio"],
          [4, "G9WZ3K7PL0RD", "2025-03-01", "accidental_damage"],
          [5, "H2KM8TQ4VX6E", "2025-02-14", "other"],
        ],
      },
    ],
    gen: (rng) => {
      const models = ["iPhone 16", "iPhone 16 Pro", "iPhone 15", "iPad Air", "MacBook Air", "Apple Watch SE"];
      const n = ri(rng, 1, 10);
      const sales: Cell[][] = seq(0, n).map(() => [serialOf(rng), pick(rng, models), dateBetween(rng, "2024-11-01", "2025-02-28")]);
      const serials = new Set<string>();
      const uniq = sales.filter((s) => (serials.has(s[0] as string) ? false : (serials.add(s[0] as string), true)));
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 12);
      const claims: Cell[][] = seq(1, m).map((id) => {
        const s = pick(rng, uniq);
        const gap = chance(rng, 0.3) ? pick(rng, [0, 30, 31, 29]) : ri(rng, 0, 60);
        return [id, s[0]!, addDays(s[2] as string, gap), pick(rng, ["display", "battery", "accidental_damage", "audio", "other"])];
      });
      return { DeviceSale: uniq, AppleCareClaim: claims };
    },
    solution: [
      "SELECT c.claim_id, d.model, DATEDIFF(c.claim_date, d.purchase_date) AS days_after_purchase",
      "FROM AppleCareClaim c",
      "JOIN DeviceSale d ON d.serial_number = c.serial_number",
      "WHERE DATEDIFF(c.claim_date, d.purchase_date) <= 30",
    ].join("\n"),
    alternatives: [
      "SELECT c.claim_id, d.model, TIMESTAMPDIFF(DAY, d.purchase_date, c.claim_date) AS days_after_purchase FROM AppleCareClaim c JOIN DeviceSale d ON d.serial_number = c.serial_number WHERE c.claim_date <= DATE_ADD(d.purchase_date, INTERVAL 30 DAY)",
      "SELECT claim_id, model, days_after_purchase FROM (SELECT c.claim_id, d.model, DATEDIFF(c.claim_date, d.purchase_date) AS days_after_purchase FROM AppleCareClaim c, DeviceSale d WHERE d.serial_number = c.serial_number) t WHERE days_after_purchase BETWEEN 0 AND 30",
    ],
    hints: [
      "The purchase date lives in another table — join on the serial number.",
      "`DATEDIFF(later, earlier)` gives whole days between two dates.",
      "Day 30 counts; day 31 does not.",
    ],
    editorial: [
      "A claim only knows its serial number, so the first step is to join it to `DeviceSale` to fetch the model and the purchase date. Then `DATEDIFF(claim_date, purchase_date)` is the number of days the device had been owned when the claim came in: 0 for a claim on the day of purchase, 30 for a claim exactly thirty days later.",
      "",
      "The window is inclusive at both ends, so the filter is `<= 30` (claims are never before purchase, so the lower bound is automatic). A device can appear more than once — every qualifying claim is its own row. The boundary is the usual trap: a claim 31 days after purchase is outside, and a `< 30` filter would wrongly drop the claim on day 30.",
      "",
      "Equivalent forms compare the claim date with `DATE_ADD(purchase_date, INTERVAL 30 DAY)`, which can use an index on `claim_date`, or compute the difference with `TIMESTAMPDIFF(DAY, …)`. Each is a single join on the serial number's primary key.",
    ].join("\n"),
  },

  {
    slug: "apple-trade-in-credit-by-device-family",
    title: "Apple: Trade-In Credit Paid by Device Family",
    difficulty: "EASY",
    topics: ["Strings", "Aggregation"],
    description: [
      "The trade-in programme reports credit by device family — the **first word** of the traded model, so `iPhone 13 Pro` and `iPhone 12` are both `iPhone`, while `MacBook Air` is `MacBook`.",
      "",
      "Considering only trade-ins with status `accepted`, return `family`, `accepted_trades` (how many) and `total_credit` (the sum of `credit_usd`). Families with no accepted trade-in do not appear. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "TradeIn",
        columns: [
          { name: "trade_id", type: "int" },
          { name: "device_model", type: "varchar" },
          { name: "device_condition", type: "enum", values: ["good", "fair", "poor"] },
          { name: "credit_usd", type: "int" },
          { name: "status", type: "enum", values: ["accepted", "rejected", "pending"] },
        ],
        primaryKey: ["trade_id"],
        note: "One row per device sent in for credit. `device_model` is always at least two words separated by single spaces.",
      },
    ],
    examples: [
      {
        TradeIn: [
          [1, "iPhone 13 Pro", "good", 320, "accepted"],
          [2, "iPhone 12", "fair", 170, "accepted"],
          [3, "iPad Air", "good", 210, "rejected"],
          [4, "MacBook Air", "good", 450, "accepted"],
          [5, "MacBook Pro", "poor", 300, "accepted"],
          [6, "Watch SE", "fair", 60, "pending"],
          [7, "iPhone 14", "good", 400, "rejected"],
        ],
      },
    ],
    gen: (rng) => {
      const models = ["iPhone 12", "iPhone 13 Pro", "iPhone 14", "iPhone 15 Pro Max", "iPad Air", "iPad mini", "iPad Pro", "MacBook Air", "MacBook Pro", "Watch Series 7", "Watch SE"];
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 16);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        pick(rng, models),
        pick(rng, ["good", "fair", "poor"]),
        roundTo(rng, 40, 600, 10),
        pick(rng, ["accepted", "accepted", "rejected", "pending"]),
      ]);
      return { TradeIn: rows };
    },
    solution: [
      "SELECT SUBSTRING_INDEX(device_model, ' ', 1) AS family,",
      "       COUNT(*) AS accepted_trades,",
      "       SUM(credit_usd) AS total_credit",
      "FROM TradeIn",
      "WHERE status = 'accepted'",
      "GROUP BY SUBSTRING_INDEX(device_model, ' ', 1)",
    ].join("\n"),
    alternatives: [
      "SELECT family, COUNT(*) AS accepted_trades, SUM(credit_usd) AS total_credit FROM (SELECT LEFT(device_model, LOCATE(' ', device_model) - 1) AS family, credit_usd FROM TradeIn WHERE status = 'accepted') t GROUP BY family",
      "SELECT SUBSTRING(device_model, 1, INSTR(device_model, ' ') - 1) AS family, SUM(1) AS accepted_trades, SUM(credit_usd) AS total_credit FROM TradeIn WHERE status IN ('accepted') GROUP BY SUBSTRING(device_model, 1, INSTR(device_model, ' ') - 1)",
    ],
    hints: [
      "The family is everything before the first space of `device_model`.",
      "`SUBSTRING_INDEX(s, ' ', 1)` returns the part of `s` before the first space.",
      "Filter to accepted trade-ins before grouping.",
    ],
    editorial: [
      "The family is not a column — it is derived from the model's text. `SUBSTRING_INDEX(device_model, ' ', 1)` returns everything before the first space, which turns `iPhone 13 Pro` into `iPhone` and `MacBook Air` into `MacBook`. Grouping by that expression puts every model of a family into one group.",
      "",
      "The status filter runs in `WHERE`, before grouping, so rejected and pending trade-ins contribute nothing; a family whose trade-ins were all rejected never forms a group and is left out, as the statement asks. Inside each group `COUNT(*)` is the number of accepted trades and `SUM(credit_usd)` the credit paid.",
      "",
      "The same prefix can be cut with `LEFT(device_model, LOCATE(' ', device_model) - 1)` or `SUBSTRING(…, 1, INSTR(…) - 1)`; computing it in a derived table lets you group by a plain alias. The query is one scan of the table plus a small hash aggregate.",
    ].join("\n"),
  },

  {
    slug: "apple-app-store-apps-not-updated-since-mid-2023",
    title: "Apple: App Store Apps Not Updated Since Mid-2023",
    difficulty: "EASY",
    topics: ["Aggregation", "Dates", "Joins"],
    description: [
      "Before a store-wide clean-up, App Store editorial lists apps whose developers have stopped shipping updates.",
      "",
      "Return every app whose **most recent release** is dated **before 2023-07-01**, with the columns `app_name` and `last_release_on`. An app with any release on or after 2023-07-01 is still maintained and is not listed; every app has at least one release. Return the rows ordered by `last_release_on`, then `app_name`.",
    ].join("\n"),
    tables: [
      {
        name: "StoreApp",
        columns: [
          { name: "app_id", type: "int" },
          { name: "app_name", type: "varchar" },
          { name: "developer", type: "varchar" },
        ],
        primaryKey: ["app_id"],
        note: "One row per app on the store; names are unique.",
      },
      {
        name: "AppRelease",
        columns: [
          { name: "app_id", type: "int" },
          { name: "version", type: "varchar" },
          { name: "released_on", type: "date" },
        ],
        primaryKey: ["app_id", "version"],
        note: "One row per version an app shipped.",
      },
    ],
    examples: [
      {
        StoreApp: [
          [1, "Pocket Tabla", "Lotus Labs"],
          [2, "Metro Mapper", "Banyan Apps"],
          [3, "Raga Tuner", "Indigo Studio"],
          [4, "Tiffin Planner", "Neem Tech"],
        ],
        AppRelease: [
          [1, "1.0", "2022-03-10"],
          [1, "1.1", "2023-06-30"],
          [2, "2.0", "2022-11-01"],
          [2, "2.1", "2023-07-01"],
          [3, "1.0", "2021-08-15"],
          [4, "3.4", "2024-02-02"],
        ],
      },
    ],
    gen: (rng) => {
      const apps = sample(rng, APPS, ri(rng, 1, 8)).map((a, i) => [i + 1, a, pick(rng, TEAMS)]);
      const rel: Cell[][] = [];
      for (const a of apps) {
        const k = ri(rng, 1, 4);
        for (let v = 0; v < k; v++) {
          const d = chance(rng, 0.2) ? pick(rng, ["2023-06-30", "2023-07-01"]) : dateBetween(rng, "2021-01-01", "2024-06-30");
          rel.push([a[0]!, `1.${v}`, d]);
        }
      }
      return { StoreApp: apps, AppRelease: rel };
    },
    solution: [
      "SELECT a.app_name, MAX(r.released_on) AS last_release_on",
      "FROM StoreApp a",
      "JOIN AppRelease r ON r.app_id = a.app_id",
      "GROUP BY a.app_id, a.app_name",
      "HAVING MAX(r.released_on) < '2023-07-01'",
      "ORDER BY last_release_on, a.app_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.app_name, (SELECT MAX(r.released_on) FROM AppRelease r WHERE r.app_id = a.app_id) AS last_release_on",
        "FROM StoreApp a",
        "WHERE NOT EXISTS (SELECT 1 FROM AppRelease r WHERE r.app_id = a.app_id AND r.released_on >= '2023-07-01')",
        "  AND EXISTS (SELECT 1 FROM AppRelease r WHERE r.app_id = a.app_id)",
        "ORDER BY last_release_on, a.app_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First find each app's latest release date.",
      "A condition on an aggregate goes in `HAVING`, not `WHERE`.",
      "Dates stored as 'YYYY-MM-DD' compare correctly as text; mind that 2023-07-01 itself counts as maintained.",
    ],
    editorial: [
      "An app is stale when its *latest* release is old, so the question is about a per-app maximum. Join the apps to their releases, group by app, and take `MAX(released_on)`; the condition `MAX(released_on) < '2023-07-01'` then goes in `HAVING`, because it filters groups after they are formed. A `WHERE released_on < '2023-07-01'` would be wrong: it would throw away the new releases before grouping and make a maintained app look abandoned.",
      "",
      "The boundary is strict — a release on 2023-07-01 itself keeps the app off the list. The order is fixed by the statement: oldest last release first, ties by name.",
      "",
      "The alternative says the same thing as an anti join: keep apps for which no release on or after the cut-off exists, and fetch the latest date with a correlated subquery. Both scan the releases once with an index on `(app_id, released_on)`.",
    ].join("\n"),
  },

  {
    slug: "apple-music-family-plans-with-spare-seats",
    title: "Apple: Apple Music Family Plans With Spare Seats",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "The Apple Music team nudges family organisers who still have room to invite people. A `family` plan covers **six people: the organiser plus up to five members**; `individual` and `student` plans have no seats to share.",
      "",
      "For every `family` plan with at least one free seat, return `group_id`, `organizer_name` and `spare_seats` (5 minus the members already in the group). A family plan with no members has 5 spare seats. Order the rows by `spare_seats` descending, then `group_id`.",
    ].join("\n"),
    tables: [
      {
        name: "MusicPlan",
        columns: [
          { name: "group_id", type: "int" },
          { name: "organizer_name", type: "varchar" },
          { name: "plan", type: "enum", values: ["individual", "student", "family"] },
        ],
        primaryKey: ["group_id"],
        note: "One row per subscription; the organiser pays for it.",
      },
      {
        name: "PlanMember",
        columns: [
          { name: "group_id", type: "int" },
          { name: "member_name", type: "varchar" },
        ],
        primaryKey: ["group_id", "member_name"],
        note: "One row per person invited into a family plan — never the organiser, never more than five a group.",
      },
    ],
    examples: [
      {
        MusicPlan: [
          [1, "Aarav", "family"],
          [2, "Diya", "individual"],
          [3, "Kabir", "family"],
          [4, "Meera", "family"],
          [5, "Rohan", "student"],
          [6, "Zara", "family"],
        ],
        PlanMember: [
          [1, "Neha"],
          [1, "Vikram"],
          [3, "Priya"],
          [3, "Rahul"],
          [3, "Riya"],
          [3, "Sneha"],
          [3, "Tanvi"],
          [4, "Arjun"],
          [4, "Kavya"],
          [4, "Ira"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 8);
      const org = names(rng, n);
      const plans: Cell[][] = seq(1, n).map((id, i) => [id, org[i]!, pick(rng, ["individual", "student", "family", "family", "family"])]);
      const members: Cell[][] = [];
      for (const p of plans) {
        if (p[2] !== "family") continue;
        const k = chance(rng, 0.25) ? 5 : ri(rng, 0, 5);
        for (const m of names(rng, k)) members.push([p[0]!, m]);
      }
      return { MusicPlan: plans, PlanMember: members };
    },
    solution: [
      "SELECT p.group_id, p.organizer_name, 5 - COUNT(m.member_name) AS spare_seats",
      "FROM MusicPlan p",
      "LEFT JOIN PlanMember m ON m.group_id = p.group_id",
      "WHERE p.plan = 'family'",
      "GROUP BY p.group_id, p.organizer_name",
      "HAVING COUNT(m.member_name) < 5",
      "ORDER BY spare_seats DESC, p.group_id",
    ].join("\n"),
    alternatives: [
      "SELECT group_id, organizer_name, spare_seats FROM (SELECT p.group_id, p.organizer_name, 5 - (SELECT COUNT(*) FROM PlanMember m WHERE m.group_id = p.group_id) AS spare_seats FROM MusicPlan p WHERE p.plan = 'family') t WHERE spare_seats > 0 ORDER BY spare_seats DESC, group_id",
    ],
    ordered: true,
    hints: [
      "Count the members of each family group — and keep groups with no members at all.",
      "A LEFT JOIN plus `COUNT(m.member_name)` gives 0 for an empty group.",
      "A group with five members has no spare seat; filter on the count with `HAVING`.",
    ],
    editorial: [
      "Spare seats are `5 − members`, so the core is a member count per family group. A **LEFT JOIN** from the plans keeps family groups that have nobody in them yet, and `COUNT(m.member_name)` counts only real members, giving 0 — and so 5 spare seats — for an empty group. Filtering `plan = 'family'` in `WHERE` is safe here because it tests the plan table, which is the preserved side of the join.",
      "",
      "Full groups (five members) have nothing to offer, so `HAVING COUNT(m.member_name) < 5` removes them after counting. The order is fixed: most spare seats first, then by group id.",
      "",
      "A correlated subquery that counts members per family plan, wrapped in a derived table so the outer query can filter and sort on `spare_seats`, gives the same rows. Either way it is one pass over the members with an index on `group_id`.",
    ].join("\n"),
  },

  {
    slug: "apple-online-orders-with-an-iphone-and-airpods",
    title: "Apple: Online Orders With Both an iPhone and AirPods",
    difficulty: "EASY",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "The online store's merchandising team measures how often customers pair a new iPhone with AirPods in the same checkout.",
      "",
      "Return the `order_id` and `customer_name` of every order that has **at least one `iPhone` line and at least one `AirPods` line**. Orders with only one of the two, or neither, are not listed. Return the rows ordered by `order_id`.",
    ].join("\n"),
    tables: [
      {
        name: "OnlineOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_name", type: "varchar" },
          { name: "ordered_on", type: "date" },
        ],
        primaryKey: ["order_id"],
        note: "One row per checkout on the online store.",
      },
      {
        name: "OrderLine",
        columns: [
          { name: "order_id", type: "int" },
          { name: "line_no", type: "int" },
          { name: "product_family", type: "enum", values: ["iPhone", "AirPods", "iPad", "Mac", "Watch", "Accessory"] },
          { name: "qty", type: "int" },
        ],
        primaryKey: ["order_id", "line_no"],
        note: "One row per line of an order; an order can hold several lines of one family.",
      },
    ],
    examples: [
      {
        OnlineOrder: [
          [1, "Aarav", "2025-04-01"],
          [2, "Diya", "2025-04-01"],
          [3, "Kabir", "2025-04-02"],
          [4, "Meera", "2025-04-02"],
          [5, "Zara", "2025-04-03"],
        ],
        OrderLine: [
          [1, 1, "iPhone", 1],
          [1, 2, "AirPods", 1],
          [2, 1, "iPhone", 2],
          [2, 2, "Accessory", 1],
          [3, 1, "AirPods", 1],
          [3, 2, "AirPods", 1],
          [4, 1, "Mac", 1],
          [4, 2, "iPhone", 1],
          [4, 3, "AirPods", 2],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const who = names(rng, n);
      const orders: Cell[][] = seq(1, n).map((id, i) => [id, who[i]!, dateBetween(rng, "2025-04-01", "2025-04-10")]);
      const lines: Cell[][] = [];
      for (const o of orders) {
        const k = ri(rng, 0, 4);
        for (let l = 1; l <= k; l++) lines.push([o[0]!, l, pick(rng, ["iPhone", "iPhone", "AirPods", "AirPods", "iPad", "Mac", "Watch", "Accessory"]), ri(rng, 1, 3)]);
        // Now and then a checkout that pairs the two on purpose.
        if (chance(rng, 0.3)) {
          lines.push([o[0]!, k + 1, "iPhone", 1]);
          lines.push([o[0]!, k + 2, "AirPods", 1]);
        }
      }
      return { OnlineOrder: orders, OrderLine: lines };
    },
    solution: [
      "SELECT o.order_id, o.customer_name",
      "FROM OnlineOrder o",
      "JOIN OrderLine l ON l.order_id = o.order_id",
      "GROUP BY o.order_id, o.customer_name",
      "HAVING SUM(CASE WHEN l.product_family = 'iPhone' THEN 1 ELSE 0 END) > 0",
      "   AND SUM(CASE WHEN l.product_family = 'AirPods' THEN 1 ELSE 0 END) > 0",
      "ORDER BY o.order_id",
    ].join("\n"),
    alternatives: [
      "SELECT o.order_id, o.customer_name FROM OnlineOrder o WHERE EXISTS (SELECT 1 FROM OrderLine l WHERE l.order_id = o.order_id AND l.product_family = 'iPhone') AND EXISTS (SELECT 1 FROM OrderLine l WHERE l.order_id = o.order_id AND l.product_family = 'AirPods') ORDER BY o.order_id",
      "SELECT o.order_id, o.customer_name FROM OnlineOrder o JOIN (SELECT order_id FROM OrderLine WHERE product_family IN ('iPhone', 'AirPods') GROUP BY order_id HAVING COUNT(DISTINCT product_family) = 2) b ON b.order_id = o.order_id ORDER BY o.order_id",
    ],
    ordered: true,
    hints: [
      "A single line cannot be both an iPhone and AirPods — the test is about the whole order.",
      "Group the lines by order and count the iPhone lines and the AirPods lines separately.",
      "Two `EXISTS` tests, one per family, also work.",
    ],
    editorial: [
      "No single row answers the question: one line is an iPhone, another is AirPods. Writing `WHERE product_family = 'iPhone' AND product_family = 'AirPods'` finds nothing. The condition is about the *set* of lines in an order, so group the lines by order and test the group.",
      "",
      "**Conditional aggregation** counts each family inside the group — `SUM(CASE WHEN product_family = 'iPhone' THEN 1 ELSE 0 END)` — and `HAVING` keeps orders where both counts are positive. Several AirPods lines in one order (order 3 in the example) do not make up for a missing iPhone.",
      "",
      "Two other shapes work: two `EXISTS` probes, one per family, which read like the sentence; or keep only iPhone/AirPods lines and require `COUNT(DISTINCT product_family) = 2`. All are one pass over the order lines with an index on `order_id`.",
    ].join("\n"),
  },

  // ──────────────────────────── MEDIUM ────────────────────────────
  {
    slug: "apple-daily-share-of-devices-on-ios-18",
    title: "Apple: Daily Share of Checked-In Devices on iOS 18",
    difficulty: "MEDIUM",
    topics: ["Strings", "Aggregation", "Dates"],
    description: [
      "The iOS release team tracks adoption of the newest major version from the daily device check-ins.",
      "",
      "For each `checkin_date`, return `devices` (devices that checked in that day) and `pct_on_ios18`, the percentage of them whose `ios_version` has **major version 18** — the part before the first dot — rounded to 1 decimal place. Note that `1.8` style strings never occur, but `18.0`, `18.1.1` and `17.6.1` do. Order the rows by `checkin_date`.",
    ].join("\n"),
    tables: [
      {
        name: "DeviceCheckin",
        columns: [
          { name: "device_id", type: "int" },
          { name: "checkin_date", type: "date" },
          { name: "ios_version", type: "varchar" },
        ],
        primaryKey: ["device_id", "checkin_date"],
        note: "At most one check-in per device per day; `ios_version` is 'major.minor' or 'major.minor.patch'.",
      },
    ],
    examples: [
      {
        DeviceCheckin: [
          [1, "2024-09-20", "17.6.1"],
          [2, "2024-09-20", "18.0"],
          [3, "2024-09-20", "17.5"],
          [1, "2024-09-21", "18.0"],
          [2, "2024-09-21", "18.0"],
          [3, "2024-09-21", "17.5"],
          [4, "2024-09-21", "16.7.10"],
          [4, "2024-09-23", "18.0.1"],
        ],
      },
    ],
    gen: (rng) => {
      const versions = ["16.7.10", "17.5", "17.6.1", "17.7", "18.0", "18.0.1", "18.1", "18.1.1"];
      const rows: Cell[][] = [];
      const devices = ri(rng, 1, 8);
      const days = ri(rng, 1, 4);
      for (let d = 1; d <= devices; d++) for (let k = 0; k < days; k++) if (chance(rng, 0.65)) rows.push([d, addDays("2024-09-18", k * ri(rng, 1, 2)), pick(rng, versions)]);
      const seen = new Set<string>();
      return { DeviceCheckin: rows.filter((r) => (seen.has(`${r[0]}|${r[1]}`) ? false : (seen.add(`${r[0]}|${r[1]}`), true))) };
    },
    solution: [
      "SELECT checkin_date,",
      "       COUNT(*) AS devices,",
      "       ROUND(100 * SUM(CASE WHEN SUBSTRING_INDEX(ios_version, '.', 1) = '18' THEN 1 ELSE 0 END) / COUNT(*), 1) AS pct_on_ios18",
      "FROM DeviceCheckin",
      "GROUP BY checkin_date",
      "ORDER BY checkin_date",
    ].join("\n"),
    alternatives: [
      "SELECT checkin_date, COUNT(device_id) AS devices, ROUND(100 * COUNT(CASE WHEN ios_version LIKE '18.%' THEN 1 END) / COUNT(device_id), 1) AS pct_on_ios18 FROM DeviceCheckin GROUP BY checkin_date ORDER BY checkin_date",
      "SELECT checkin_date, COUNT(*) AS devices, ROUND(100 * SUM(IF(LEFT(ios_version, LOCATE('.', ios_version) - 1) = '18', 1, 0)) / COUNT(*), 1) AS pct_on_ios18 FROM DeviceCheckin GROUP BY checkin_date ORDER BY checkin_date",
    ],
    ordered: true,
    hints: [
      "The major version is the text before the first dot — `SUBSTRING_INDEX(v, '.', 1)`.",
      "Count the iOS 18 devices with a conditional SUM, and all devices with COUNT, per day.",
      "Multiply by 100 before dividing, then round.",
    ],
    editorial: [
      "Each day is one group, so the query is a `GROUP BY checkin_date` with two counts: all check-ins, and the check-ins on iOS 18. The second is a **conditional aggregate** — `SUM(CASE WHEN … THEN 1 ELSE 0 END)` — and the condition is a string test on the version.",
      "",
      "The major version is the text before the first dot, which `SUBSTRING_INDEX(ios_version, '.', 1)` extracts. Comparing it to `'18'` is exact; a looser test such as `LIKE '%18%'` would count `17.1.8`. `LIKE '18.%'` is also correct because every version has a dot after its major number.",
      "",
      "The percentage is `100 * on_18 / devices` rounded to one decimal. Because the table allows one check-in per device per day, `COUNT(*)` is the number of devices. The query reads the table once; the alternatives only swap the string function (`LEFT` + `LOCATE`, or `LIKE`) and the counting form (`COUNT(CASE …)`, `IF`).",
    ].join("\n"),
  },

  {
    slug: "apple-category-leaders-by-q4-net-app-revenue",
    title: "Apple: Category Leaders by Q4 Net App Revenue",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Joins", "Aggregation"],
    description: [
      "For the App Store's year-end story, the business team wants the top-earning app in each category for **Q4 2024** (purchases from 2024-10-01 to 2024-12-31 inclusive), counting only purchases that were **not refunded**.",
      "",
      "Return `category`, `app_name` and `net_revenue_cents` (the sum of `price_cents` of its counted purchases) for the app with the highest net revenue in each category. If several apps tie for the top, return all of them. Apps with no counted purchase are not considered. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "StoreApp",
        columns: [
          { name: "app_id", type: "int" },
          { name: "app_name", type: "varchar" },
          { name: "category", type: "varchar" },
        ],
        primaryKey: ["app_id"],
        note: "One row per app.",
      },
      {
        name: "AppPurchase",
        columns: [
          { name: "purchase_id", type: "int" },
          { name: "app_id", type: "int" },
          { name: "purchased_on", type: "date" },
          { name: "price_cents", type: "int" },
        ],
        primaryKey: ["purchase_id"],
        note: "One row per paid download or in-app purchase.",
      },
      {
        name: "Refund",
        columns: [
          { name: "purchase_id", type: "int" },
          { name: "refunded_on", type: "date" },
        ],
        primaryKey: ["purchase_id"],
        note: "A purchase that was refunded, whenever the refund happened.",
      },
    ],
    examples: [
      {
        StoreApp: [
          [1, "Pocket Tabla", "Music"],
          [2, "Raga Tuner", "Music"],
          [3, "Kirana Ledger", "Productivity"],
          [4, "Tiffin Planner", "Productivity"],
          [5, "Pixel Rangoli", "Games"],
        ],
        AppPurchase: [
          [1, 1, "2024-10-05", 499],
          [2, 1, "2024-11-11", 499],
          [3, 2, "2024-12-31", 999],
          [4, 2, "2025-01-01", 999],
          [5, 3, "2024-10-20", 299],
          [6, 4, "2024-11-02", 299],
          [7, 4, "2024-12-09", 199],
          [8, 5, "2024-09-30", 999],
        ],
        Refund: [
          [7, "2024-12-12"],
        ],
      },
    ],
    gen: (rng) => {
      const apps = sample(rng, APPS, ri(rng, 2, 8)).map((a, i) => [i + 1, a, pick(rng, CATEGORIES.slice(0, 3))]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 25);
      const purchases: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 1, apps.length),
        chance(rng, 0.15) ? pick(rng, ["2024-09-30", "2024-10-01", "2024-12-31", "2025-01-01"]) : dateBetween(rng, "2024-09-20", "2025-01-10"),
        pick(rng, [99, 199, 299, 499, 999]),
      ]);
      const refunds: Cell[][] = purchases.filter(() => chance(rng, 0.2)).map((p) => [p[0]!, addDays(p[2] as string, ri(rng, 0, 20))]);
      return { StoreApp: apps, AppPurchase: purchases, Refund: refunds };
    },
    solution: [
      "WITH net AS (",
      "  SELECT a.category, a.app_name, SUM(p.price_cents) AS net_revenue_cents",
      "  FROM AppPurchase p",
      "  JOIN StoreApp a ON a.app_id = p.app_id",
      "  WHERE p.purchased_on BETWEEN '2024-10-01' AND '2024-12-31'",
      "    AND NOT EXISTS (SELECT 1 FROM Refund r WHERE r.purchase_id = p.purchase_id)",
      "  GROUP BY a.app_id, a.category, a.app_name",
      "), ranked AS (",
      "  SELECT category, app_name, net_revenue_cents,",
      "         RANK() OVER (PARTITION BY category ORDER BY net_revenue_cents DESC) AS pos",
      "  FROM net",
      ")",
      "SELECT category, app_name, net_revenue_cents FROM ranked WHERE pos = 1",
    ].join("\n"),
    alternatives: [
      [
        "WITH net AS (",
        "  SELECT a.category, a.app_name, SUM(p.price_cents) AS net_revenue_cents",
        "  FROM AppPurchase p JOIN StoreApp a ON a.app_id = p.app_id",
        "  LEFT JOIN Refund r ON r.purchase_id = p.purchase_id",
        "  WHERE r.purchase_id IS NULL AND p.purchased_on >= '2024-10-01' AND p.purchased_on < '2025-01-01'",
        "  GROUP BY a.app_id, a.category, a.app_name",
        ")",
        "SELECT n.category, n.app_name, n.net_revenue_cents FROM net n",
        "WHERE n.net_revenue_cents = (SELECT MAX(m.net_revenue_cents) FROM net m WHERE m.category = n.category)",
      ].join("\n"),
    ],
    hints: [
      "First compute each app's Q4 net revenue: date filter plus an anti join against `Refund`.",
      "Then compare apps within their category — a window partitioned by category.",
      "`RANK()` gives tied apps the same position, so `= 1` keeps every tied leader.",
    ],
    editorial: [
      "Split the question in two. Step one is a per-app total: keep purchases dated inside Q4 (both 2024-10-01 and 2024-12-31 count) that have **no row in `Refund`** — an anti join, written with `NOT EXISTS` or a LEFT JOIN that keeps the unmatched rows — and sum their prices per app. A refund issued in January still removes a December purchase, because the statement counts purchases that were refunded at any time.",
      "",
      "Step two picks the leader of each category. `RANK() OVER (PARTITION BY category ORDER BY net_revenue_cents DESC)` numbers apps inside their category; equal revenue gets equal rank, so filtering `= 1` returns every tied leader, as asked. `ROW_NUMBER()` would silently pick one of them.",
      "",
      "The alternative compares each app's total with the category maximum via a correlated subquery on the same CTE. Both group the purchases once; the window version then sorts each category's apps, the subquery version scans them per app — fine at this size.",
    ].join("\n"),
  },

  {
    slug: "apple-developer-proceeds-after-commission-in-march",
    title: "Apple: Developer Proceeds After Commission in March 2025",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Aggregation", "Joins"],
    description: [
      "App Store finance closes the month by computing what each developer team is paid after the store's commission. In this exercise the commission on a sale is **15%** if the team is in the small-business programme (`small_business = 1`), or if the sale is a `subscription` in its **second year or later** (`subscriber_year >= 2`); every other sale pays **30%**.",
      "",
      "For every team with at least one sale in **March 2025**, return `team_name`, `sales` (the number of March sales) and `proceeds_cents`: the sum over its March sales of `price_cents × (100 − commission %) / 100`, **rounded down** to a whole cent after summing. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "DevTeam",
        columns: [
          { name: "developer_id", type: "int" },
          { name: "team_name", type: "varchar" },
          { name: "small_business", type: "bool" },
        ],
        primaryKey: ["developer_id"],
        note: "One row per developer team; `small_business` is 1 for members of the reduced-commission programme.",
      },
      {
        name: "StoreSale",
        columns: [
          { name: "sale_id", type: "int" },
          { name: "developer_id", type: "int" },
          { name: "sold_on", type: "date" },
          { name: "price_cents", type: "int" },
          { name: "kind", type: "enum", values: ["paid_app", "in_app", "subscription"] },
          { name: "subscriber_year", type: "int" },
        ],
        primaryKey: ["sale_id"],
        note: "`subscriber_year` is the subscriber's year of paid service for a `subscription` (1, 2, …) and NULL for any other kind.",
      },
    ],
    examples: [
      {
        DevTeam: [
          [1, "Lotus Labs", 1],
          [2, "Banyan Apps", 0],
          [3, "Indigo Studio", 0],
        ],
        StoreSale: [
          [1, 1, "2025-03-01", 499, "paid_app", null],
          [2, 1, "2025-03-15", 199, "in_app", null],
          [3, 2, "2025-03-10", 999, "subscription", 1],
          [4, 2, "2025-03-31", 999, "subscription", 2],
          [5, 2, "2025-04-01", 999, "paid_app", null],
          [6, 3, "2025-02-28", 1999, "paid_app", null],
          [7, 2, "2025-03-20", 299, "in_app", null],
        ],
      },
    ],
    gen: (rng) => {
      const teams = sample(rng, TEAMS, ri(rng, 1, 6)).map((t, i) => [i + 1, t, chance(rng, 0.4) ? 1 : 0]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 20);
      const sales: Cell[][] = seq(1, n).map((id) => {
        const kind = pick(rng, ["paid_app", "in_app", "subscription", "subscription"]);
        return [
          id,
          ri(rng, 1, teams.length),
          chance(rng, 0.2) ? pick(rng, ["2025-02-28", "2025-03-01", "2025-03-31", "2025-04-01"]) : dateBetween(rng, "2025-02-20", "2025-04-08"),
          pick(rng, [99, 199, 299, 499, 999, 1999]),
          kind,
          kind === "subscription" ? ri(rng, 1, 3) : null,
        ];
      });
      return { DevTeam: teams, StoreSale: sales };
    },
    solution: [
      "SELECT t.team_name,",
      "       COUNT(*) AS sales,",
      "       FLOOR(SUM(s.price_cents * (100 - CASE",
      "               WHEN t.small_business = 1 THEN 15",
      "               WHEN s.kind = 'subscription' AND s.subscriber_year >= 2 THEN 15",
      "               ELSE 30 END)) / 100) AS proceeds_cents",
      "FROM StoreSale s",
      "JOIN DevTeam t ON t.developer_id = s.developer_id",
      "WHERE s.sold_on BETWEEN '2025-03-01' AND '2025-03-31'",
      "GROUP BY t.developer_id, t.team_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT t.team_name, x.sales, x.kept DIV 100 AS proceeds_cents",
        "FROM DevTeam t",
        "JOIN (SELECT s.developer_id, COUNT(*) AS sales,",
        "             SUM(s.price_cents * IF(d.small_business = 1 OR (s.kind = 'subscription' AND s.subscriber_year > 1), 85, 70)) AS kept",
        "      FROM StoreSale s JOIN DevTeam d ON d.developer_id = s.developer_id",
        "      WHERE YEAR(s.sold_on) = 2025 AND MONTH(s.sold_on) = 3",
        "      GROUP BY s.developer_id) x ON x.developer_id = t.developer_id",
      ].join("\n"),
    ],
    hints: [
      "Decide each sale's commission first: a CASE with the two 15% rules ahead of the 30% default.",
      "`subscriber_year` is NULL for non-subscriptions; `NULL >= 2` is not true, so those sales fall through to the default.",
      "Keep the arithmetic in whole numbers: sum `price × (100 − rate)`, then divide by 100 and round down once.",
    ],
    editorial: [
      "Each sale carries its own commission rate, so the rate is a per-row `CASE`: 15 when the team is a small business, 15 when the sale is a subscription in year two or later, otherwise 30. Order the branches so the reduced rates are checked first; a sale that is not a subscription has `subscriber_year` NULL, and `NULL >= 2` is unknown rather than true, so it correctly falls to the 30% default.",
      "",
      "The proceeds are `price × (100 − rate) / 100`. Summing the integer numerators first and dividing once at the end keeps everything exact and matches the statement's \"rounded down after summing\": `FLOOR(SUM(…) / 100)`, or equivalently `SUM(…) DIV 100` for these positive amounts. Rounding each sale separately would lose up to a cent per sale.",
      "",
      "The March filter is a plain date range (or `YEAR` and `MONTH`), applied before grouping; teams without a March sale never form a group. The alternative swaps the CASE for one `IF` with an `OR`. Both are a single join and aggregate.",
    ].join("\n"),
  },

  {
    slug: "apple-genius-bar-repeat-visits-within-14-days",
    title: "Apple: Genius Bar Repeat Visits Within 14 Days",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates"],
    description: [
      "A repair that brings the customer back soon for the **same device** suggests the first fix did not hold. The retail service team tracks these repeat visits.",
      "",
      "Consider only `completed` appointments. For each completed appointment, its *previous visit* is the same customer's latest earlier completed appointment for the **same `device_serial`** (earlier by `visited_on`, then by `appointment_id`). Return every completed appointment whose previous visit was **at most 14 days** before it, with the columns `appointment_id`, `customer_id`, `device_serial` and `days_since_previous`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "GeniusVisit",
        columns: [
          { name: "appointment_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "device_serial", type: "varchar" },
          { name: "visited_on", type: "date" },
          { name: "status", type: "enum", values: ["completed", "no_show"] },
        ],
        primaryKey: ["appointment_id"],
        note: "One row per Genius Bar appointment for one device.",
      },
    ],
    examples: [
      {
        GeniusVisit: [
          [1, 7, "F4PRT8XH2NQC", "2025-05-01", "completed"],
          [2, 7, "F4PRT8XH2NQC", "2025-05-15", "completed"],
          [3, 7, "F4PRT8XH2NQC", "2025-06-10", "completed"],
          [4, 7, "DX7F2KQ91LMA", "2025-05-20", "completed"],
          [5, 9, "G9WZ3K7PL0RD", "2025-05-02", "completed"],
          [6, 9, "G9WZ3K7PL0RD", "2025-05-05", "no_show"],
          [7, 9, "G9WZ3K7PL0RD", "2025-05-17", "completed"],
        ],
      },
    ],
    gen: (rng) => {
      const pairs: [number, string][] = [];
      const customers = ri(rng, 1, 3);
      for (let c = 1; c <= customers; c++) for (let k = ri(rng, 1, 2); k > 0; k--) pairs.push([c, serialOf(rng)]);
      const n = ri(rng, 2, 15);
      const rows: Cell[][] = [];
      let prev = "2025-05-01";
      for (let id = 1; id <= n; id++) {
        const [c, s] = pick(rng, pairs);
        prev = chance(rng, 0.3) ? addDays(prev, pick(rng, [0, 14, 15])) : dateBetween(rng, "2025-05-01", "2025-06-10");
        rows.push([id, c, s, prev, chance(rng, 0.85) ? "completed" : "no_show"]);
      }
      return { GeniusVisit: rows };
    },
    solution: [
      "SELECT appointment_id, customer_id, device_serial, DATEDIFF(visited_on, prev_on) AS days_since_previous",
      "FROM (",
      "  SELECT appointment_id, customer_id, device_serial, visited_on,",
      "         LAG(visited_on) OVER (PARTITION BY customer_id, device_serial ORDER BY visited_on, appointment_id) AS prev_on",
      "  FROM GeniusVisit",
      "  WHERE status = 'completed'",
      ") v",
      "WHERE prev_on IS NOT NULL AND DATEDIFF(visited_on, prev_on) <= 14",
    ].join("\n"),
    alternatives: [
      [
        "SELECT appointment_id, customer_id, device_serial, DATEDIFF(visited_on, prev_on) AS days_since_previous",
        "FROM (",
        "  SELECT g.appointment_id, g.customer_id, g.device_serial, g.visited_on,",
        "         (SELECT MAX(p.visited_on) FROM GeniusVisit p",
        "          WHERE p.status = 'completed' AND p.customer_id = g.customer_id AND p.device_serial = g.device_serial",
        "            AND (p.visited_on < g.visited_on OR (p.visited_on = g.visited_on AND p.appointment_id < g.appointment_id))) AS prev_on",
        "  FROM GeniusVisit g",
        "  WHERE g.status = 'completed'",
        ") v",
        "WHERE DATEDIFF(visited_on, prev_on) <= 14",
      ].join("\n"),
    ],
    hints: [
      "Drop the no-shows first — they are neither repeat visits nor previous visits.",
      "`LAG(visited_on)` over a partition per customer *and* device gives the previous visit's date.",
      "The first visit has no previous one; its LAG is NULL and it must not be listed.",
    ],
    editorial: [
      "\"The previous visit\" is a question about row order within a group, which is what **`LAG`** answers. Filter to completed appointments first (a no-show neither counts as a visit nor as the previous one), then partition by `customer_id, device_serial` — the same customer's other devices are separate histories — and order by `visited_on, appointment_id` so two visits on one day still have a defined order.",
      "",
      "`LAG(visited_on)` is NULL for the first visit of each history, and `DATEDIFF` of NULL is NULL, so those rows fall out of the `<= 14` test; the explicit `IS NOT NULL` just says so. Fourteen days counts as a repeat, fifteen does not, and a same-day second visit is a repeat with 0 days.",
      "",
      "Without window functions, a correlated subquery takes the `MAX` earlier date among completed visits of the same pair; the tie rule for same-day visits has to be written out by hand there. The window version sorts each history once.",
    ].join("\n"),
  },

  {
    slug: "apple-pay-monthly-volume-change-by-country",
    title: "Apple: Apple Pay Monthly Volume Change by Country",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates", "Aggregation"],
    description: [
      "The Apple Pay business team reviews payment volume month by month in each market.",
      "",
      "For each `country` and each month in which it had transactions, return `country`, `month` (as `'YYYY-MM'`), `volume` (the sum of `amount_usd` that month) and `change_vs_prev`: this month's volume minus the volume of the **previous calendar month**. If the country had no transactions in the previous calendar month, `change_vs_prev` is NULL — even when it had volume in some earlier month. Order the rows by `country`, then `month`.",
    ].join("\n"),
    tables: [
      {
        name: "PayTransaction",
        columns: [
          { name: "txn_id", type: "int" },
          { name: "country", type: "varchar" },
          { name: "txn_date", type: "date" },
          { name: "amount_usd", type: "int" },
        ],
        primaryKey: ["txn_id"],
        note: "One row per Apple Pay transaction.",
      },
    ],
    examples: [
      {
        PayTransaction: [
          [1, "India", "2024-11-03", 120],
          [2, "India", "2024-11-20", 80],
          [3, "India", "2024-12-05", 260],
          [4, "India", "2025-02-14", 90],
          [5, "Japan", "2024-12-31", 300],
          [6, "Japan", "2025-01-01", 150],
          [7, "Japan", "2025-01-09", 50],
        ],
      },
    ],
    gen: (rng) => {
      const countries = sample(rng, COUNTRIES, ri(rng, 1, 3));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      const rows: Cell[][] = seq(1, n).map((id) => [id, pick(rng, countries), dateBetween(rng, "2024-10-01", "2025-03-31"), roundTo(rng, 10, 400, 10)]);
      return { PayTransaction: rows };
    },
    solution: [
      "WITH monthly AS (",
      "  SELECT country, DATE_FORMAT(txn_date, '%Y-%m') AS month,",
      "         YEAR(txn_date) * 12 + MONTH(txn_date) AS month_no,",
      "         SUM(amount_usd) AS volume",
      "  FROM PayTransaction",
      "  GROUP BY country, DATE_FORMAT(txn_date, '%Y-%m'), YEAR(txn_date) * 12 + MONTH(txn_date)",
      "), with_prev AS (",
      "  SELECT country, month, month_no, volume,",
      "         LAG(month_no) OVER (PARTITION BY country ORDER BY month_no) AS prev_no,",
      "         LAG(volume) OVER (PARTITION BY country ORDER BY month_no) AS prev_volume",
      "  FROM monthly",
      ")",
      "SELECT country, month, volume,",
      "       CASE WHEN prev_no = month_no - 1 THEN volume - prev_volume END AS change_vs_prev",
      "FROM with_prev",
      "ORDER BY country, month",
    ].join("\n"),
    alternatives: [
      [
        "WITH monthly AS (",
        "  SELECT country, month, MIN(month_no) AS month_no, SUM(amount_usd) AS volume",
        "  FROM (SELECT country, LEFT(txn_date, 7) AS month, YEAR(txn_date) * 12 + MONTH(txn_date) AS month_no, amount_usd FROM PayTransaction) t",
        "  GROUP BY country, month",
        ")",
        "SELECT c.country, c.month, c.volume, c.volume - p.volume AS change_vs_prev",
        "FROM monthly c",
        "LEFT JOIN monthly p ON p.country = c.country AND p.month_no = c.month_no - 1",
        "ORDER BY c.country, c.month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Aggregate to one row per country and month first.",
      "`LAG` returns the previous *row*, which is not always the previous calendar month — the country may have skipped a month.",
      "Number months as `YEAR * 12 + MONTH` so \"the month before\" is simply `n − 1`.",
    ],
    editorial: [
      "First collapse the transactions into one row per country and month: `DATE_FORMAT(txn_date, '%Y-%m')` gives the label, and a month number `YEAR * 12 + MONTH` gives something you can do arithmetic on (December 2024 and January 2025 are consecutive numbers, which the labels are not).",
      "",
      "The trap is that `LAG(volume)` returns the previous **row** of the country, and a country with no transactions in January has December as its previous row before February. The statement wants the previous **calendar** month, so the query also lags the month number and only subtracts when `prev_no = month_no − 1`; otherwise the CASE has no ELSE and yields NULL. The first month of each country is NULL for the same reason.",
      "",
      "The alternative avoids the window entirely: a LEFT JOIN of the monthly table to itself on `month_no − 1`. A missing previous month simply fails to match and the subtraction gives NULL. Both group the transactions once; the join version reads the monthly rows twice.",
    ].join("\n"),
  },

  {
    slug: "apple-component-batches-below-pooled-yield",
    title: "Apple: Component Batches Below Their Pooled Test Yield",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation"],
    description: [
      "Supplier quality engineers flag incoming component batches that test worse than the norm for that component. A batch's *yield* is `units_passed / units_tested`; a component's *pooled yield* is the total units passed over the total units tested across **all** batches of that component, from every supplier.",
      "",
      "Return `batch_id`, `component` and `supplier` for every batch whose yield is **strictly lower** than its component's pooled yield. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "ComponentBatch",
        columns: [
          { name: "batch_id", type: "int" },
          { name: "supplier", type: "varchar" },
          { name: "component", type: "enum", values: ["OLED panel", "A-series chip", "Camera module", "Battery cell"] },
          { name: "units_tested", type: "int" },
          { name: "units_passed", type: "int" },
        ],
        primaryKey: ["batch_id"],
        note: "One row per batch received; `units_tested` is always positive and `units_passed` never exceeds it.",
      },
    ],
    examples: [
      {
        ComponentBatch: [
          [1, "Supplier A", "OLED panel", 100, 96],
          [2, "Supplier B", "OLED panel", 200, 180],
          [3, "Supplier A", "OLED panel", 100, 93],
          [4, "Supplier C", "Camera module", 50, 49],
          [5, "Supplier D", "Camera module", 150, 147],
          [6, "Supplier B", "Battery cell", 80, 70],
        ],
      },
    ],
    gen: (rng) => {
      const comps = sample(rng, ["OLED panel", "A-series chip", "Camera module", "Battery cell"], ri(rng, 1, 3));
      const n = ri(rng, 1, 14);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const tested = roundTo(rng, 50, 200, 50);
        const passed = chance(rng, 0.3) ? Math.round(tested * 0.9) : ri(rng, Math.floor(tested * 0.8), tested);
        return [id, `Supplier ${pick(rng, ["A", "B", "C", "D", "E"])}`, pick(rng, comps), tested, passed];
      });
      return { ComponentBatch: rows };
    },
    solution: [
      "SELECT b.batch_id, b.component, b.supplier",
      "FROM ComponentBatch b",
      "JOIN (",
      "  SELECT component, SUM(units_passed) AS passed, SUM(units_tested) AS tested",
      "  FROM ComponentBatch",
      "  GROUP BY component",
      ") c ON c.component = b.component",
      "WHERE b.units_passed * c.tested < c.passed * b.units_tested",
    ].join("\n"),
    alternatives: [
      "SELECT b.batch_id, b.component, b.supplier FROM ComponentBatch b WHERE b.units_passed / b.units_tested < (SELECT SUM(x.units_passed) / SUM(x.units_tested) FROM ComponentBatch x WHERE x.component = b.component)",
      "SELECT batch_id, component, supplier FROM (SELECT batch_id, component, supplier, units_passed * SUM(units_tested) OVER (PARTITION BY component) AS lhs, units_tested * SUM(units_passed) OVER (PARTITION BY component) AS rhs FROM ComponentBatch) t WHERE lhs < rhs",
    ],
    hints: [
      "The pooled yield is a ratio of two sums, not the average of the batch ratios.",
      "Compute the per-component sums in a derived table (or a correlated subquery) and compare each batch with them.",
      "To avoid fractions, compare `passed_b × tested_c < passed_c × tested_b`.",
    ],
    editorial: [
      "The benchmark is the **pooled** yield, `SUM(units_passed) / SUM(units_tested)` per component — not the average of the batch yields, which would weight a 50-unit batch the same as a 200-unit one. Compute those two sums per component in a derived table, join each batch to its component's row, and compare.",
      "",
      "The comparison `passed_b / tested_b < passed_c / tested_c` can be cross-multiplied because every `units_tested` is positive: `passed_b × tested_c < passed_c × tested_b`. That keeps it in exact integers, so a batch exactly at the pooled yield — for example the only batch of its component, which always equals its own pool — is correctly *not* below it.",
      "",
      "A correlated subquery that computes the pooled ratio per batch gives the same rows, and a window `SUM(…) OVER (PARTITION BY component)` attaches the component totals to each batch without a join. All three read the table twice (or once with the window).",
    ].join("\n"),
  },

  {
    slug: "apple-store-revenue-share-by-product-line",
    title: "Apple: Each Product Line's Share of Store Revenue",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "Retail finance compares the product mix of each Apple Store — how much of a store's revenue comes from iPhone, Mac, iPad, wearables and services.",
      "",
      "For every store and every product line it sold, return `store_name`, `product_line`, `revenue` (the sum of `amount_usd`) and `share_pct`, the line's percentage of that store's total revenue, rounded to 1 decimal place. Lines a store did not sell are not listed. Order the rows by `store_name`, then `revenue` descending, then `product_line`.",
    ].join("\n"),
    tables: [
      {
        name: "RetailSale",
        columns: [
          { name: "sale_id", type: "int" },
          { name: "store_name", type: "varchar" },
          { name: "product_line", type: "enum", values: ["iPhone", "Mac", "iPad", "Wearables", "Services"] },
          { name: "amount_usd", type: "int" },
        ],
        primaryKey: ["sale_id"],
        note: "One row per sale at a store's tills; every amount is positive.",
      },
    ],
    examples: [
      {
        RetailSale: [
          [1, "Apple BKC", "iPhone", 1200],
          [2, "Apple BKC", "iPhone", 800],
          [3, "Apple BKC", "Mac", 1500],
          [4, "Apple BKC", "Services", 500],
          [5, "Apple Saket", "iPad", 600],
          [6, "Apple Saket", "Wearables", 600],
          [7, "Apple Saket", "Mac", 1300],
        ],
      },
    ],
    gen: (rng) => {
      const stores = sample(rng, STORES, ri(rng, 1, 3));
      const n = ri(rng, 1, 20);
      const rows: Cell[][] = seq(1, n).map((id) => [id, pick(rng, stores), pick(rng, ["iPhone", "Mac", "iPad", "Wearables", "Services"]), roundTo(rng, 100, 1600, 100)]);
      return { RetailSale: rows };
    },
    solution: [
      "SELECT store_name, product_line, revenue,",
      "       ROUND(100 * revenue / SUM(revenue) OVER (PARTITION BY store_name), 1) AS share_pct",
      "FROM (",
      "  SELECT store_name, product_line, SUM(amount_usd) AS revenue",
      "  FROM RetailSale",
      "  GROUP BY store_name, product_line",
      ") t",
      "ORDER BY store_name, revenue DESC, product_line",
    ].join("\n"),
    alternatives: [
      [
        "SELECT l.store_name, l.product_line, l.revenue, ROUND(100 * l.revenue / s.total, 1) AS share_pct",
        "FROM (SELECT store_name, product_line, SUM(amount_usd) AS revenue FROM RetailSale GROUP BY store_name, product_line) l",
        "JOIN (SELECT store_name, SUM(amount_usd) AS total FROM RetailSale GROUP BY store_name) s ON s.store_name = l.store_name",
        "ORDER BY l.store_name, l.revenue DESC, l.product_line",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Two levels of totals are needed: per store-and-line, and per store.",
      "Group by store and line first; then a window `SUM(revenue) OVER (PARTITION BY store_name)` gives the store total on every row.",
      "Multiply by 100 before dividing, then round to one decimal.",
    ],
    editorial: [
      "The share needs two totals at once: the line's revenue (a group per store and line) and the store's revenue (a group per store). Group first by `store_name, product_line`; then a window function over those grouped rows, `SUM(revenue) OVER (PARTITION BY store_name)`, puts the store total next to every line without collapsing the rows. Windows run after `GROUP BY`, which is why this works in one SELECT over a derived table.",
      "",
      "The share is `100 * revenue / store_total`, rounded to one decimal; the shares of a store add up to about 100 (rounding can make them 99.9 or 100.1). Lines a store never sold have no rows and are not listed. Two lines with equal revenue are ordered by name, as the statement fixes.",
      "",
      "Without windows, aggregate the store totals in a second derived table and join the two on `store_name`. Both scan the sales once per aggregate; the window version avoids the second scan.",
    ].join("\n"),
  },

  {
    slug: "apple-applecare-serials-that-fail-the-format-check",
    title: "Apple: AppleCare Serial Numbers That Fail the Format Check",
    difficulty: "MEDIUM",
    topics: ["Strings", "Conditional Logic"],
    description: [
      "Customers type their device's serial number when they register for AppleCare, and support wants to catch mistyped entries before a claim is filed. In this exercise a valid serial, after trimming leading and trailing spaces, is **exactly 12 characters**, uses **only capital letters and digits**, and never contains the letters **O** or **I** (they are too easily confused with 0 and 1). The form already upper-cases what is typed.",
      "",
      "Return every registration whose entry is invalid, with `registration_id`, `serial_entered` and `reason`, where `reason` is the **first** rule that fails, checked in this order: `'wrong length'`, `'invalid character'`, `'ambiguous letter'`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "CareRegistration",
        columns: [
          { name: "registration_id", type: "int" },
          { name: "customer_email", type: "varchar" },
          { name: "serial_entered", type: "varchar" },
        ],
        primaryKey: ["registration_id"],
        note: "One row per AppleCare registration, with the serial number exactly as it was submitted (upper-case, possibly with stray spaces or dashes).",
      },
    ],
    examples: [
      {
        CareRegistration: [
          [1, "aarav@icloud.com", "F4PRT8XH2NQC"],
          [2, "diya@icloud.com", "  DX7F2KQ91LMA "],
          [3, "kabir@icloud.com", "G9WZ3K7PL0R"],
          [4, "meera@icloud.com", "H2KM-8TQ4VX6"],
          [5, "rohan@icloud.com", "C02XL0GHJGH5"],
          [6, "zara@icloud.com", "FVFG7K3O2M1Q"],
          [7, "neha@icloud.com", "MXK3 9TQ4VX6"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const who = names(rng, n);
      const rows: Cell[][] = seq(1, n).map((id, i) => {
        let s = serialOf(rng);
        const kind = pick(rng, ["valid", "valid", "short", "long", "dash", "space", "ambiguous", "padded"]);
        if (kind === "short") s = s.slice(0, ri(rng, 8, 11));
        if (kind === "long") s = s + serialOf(rng, ri(rng, 1, 2));
        if (kind === "dash") s = `${s.slice(0, 4)}-${s.slice(5)}`;
        if (kind === "space") s = `${s.slice(0, 6)} ${s.slice(7)}`;
        if (kind === "ambiguous") s = `${s.slice(0, 5)}${pick(rng, ["O", "I"])}${s.slice(6)}`;
        if (kind === "padded") s = `${" ".repeat(ri(rng, 1, 2))}${s}${chance(rng, 0.5) ? " " : ""}`;
        if (chance(rng, 0.15)) s = `${s.slice(0, 3)}-${s.slice(3, 9)}`; // a wrong length that also has a dash
        return [id, `${who[i]!.toLowerCase()}@icloud.com`, s];
      });
      return { CareRegistration: rows };
    },
    solution: [
      "SELECT registration_id, serial_entered, reason",
      "FROM (",
      "  SELECT registration_id, serial_entered,",
      "         CASE",
      "           WHEN CHAR_LENGTH(TRIM(serial_entered)) <> 12 THEN 'wrong length'",
      "           WHEN TRIM(serial_entered) REGEXP '[^A-Z0-9]' THEN 'invalid character'",
      "           WHEN TRIM(serial_entered) REGEXP '[OI]' THEN 'ambiguous letter'",
      "         END AS reason",
      "  FROM CareRegistration",
      ") r",
      "WHERE reason IS NOT NULL",
    ].join("\n"),
    alternatives: [
      [
        "SELECT registration_id, serial_entered,",
        "       IF(LENGTH(TRIM(serial_entered)) <> 12, 'wrong length',",
        "          IF(NOT TRIM(serial_entered) REGEXP '^[0-9A-Z]+$', 'invalid character', 'ambiguous letter')) AS reason",
        "FROM CareRegistration",
        "WHERE LENGTH(TRIM(serial_entered)) <> 12",
        "   OR NOT TRIM(serial_entered) REGEXP '^[0-9A-Z]{12}$'",
        "   OR INSTR(serial_entered, 'O') > 0 OR INSTR(serial_entered, 'I') > 0",
      ].join("\n"),
    ],
    hints: [
      "Trim first — the spaces around an entry are not part of the serial.",
      "A `CASE` checks its branches in order and stops at the first true one, which is exactly the \"first rule that fails\".",
      "`REGEXP '[^A-Z0-9]'` is true when the text holds any character outside capitals and digits.",
    ],
    editorial: [
      "Every rule applies to the trimmed entry, so wrap the column in `TRIM` everywhere: `'  DX7F2KQ91LMA '` is a perfectly good serial once its padding is gone. Then the three rules become three tests, and because the statement asks for the *first* failing rule, they belong in one `CASE` in the stated order — a `CASE` returns the first branch that is true.",
      "",
      "Length is `CHAR_LENGTH(TRIM(…)) <> 12`. The character rule is a regular expression with a negated class, `[^A-Z0-9]`, which matches a dash or an inner space. The ambiguity rule looks for an `O` or an `I`. A valid entry passes all three, the `CASE` yields NULL, and the outer `WHERE reason IS NOT NULL` drops it. An entry that is both too short and contains a dash reports `wrong length`, because that rule comes first.",
      "",
      "The alternative nests `IF`s, checks the character set with an anchored pattern, and finds the ambiguous letters with `INSTR`. Both are one scan; regular expressions cost more per row than plain comparisons, but registrations are checked a handful at a time.",
    ].join("\n"),
  },

  {
    slug: "apple-running-icloud-plus-subscriber-count",
    title: "Apple: Running iCloud+ Subscriber Count by Day",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "The iCloud+ dashboard shows how the paying base moves day by day. Each `subscribe` event adds one subscriber and each `cancel` event removes one; the count starts at zero before the first event.",
      "",
      "For every date that has at least one event, return `event_date`, `net_change` (subscribes minus cancels that day) and `subscribers`, the running total at the end of that day. A day whose events cancel out still appears with `net_change` 0. Order the rows by `event_date`.",
    ].join("\n"),
    tables: [
      {
        name: "ICloudPlusEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "account_id", type: "int" },
          { name: "event_date", type: "date" },
          { name: "event_type", type: "enum", values: ["subscribe", "cancel"] },
        ],
        primaryKey: ["event_id"],
        note: "One row per change to an account's iCloud+ status; an account cancels only after subscribing.",
      },
    ],
    examples: [
      {
        ICloudPlusEvent: [
          [1, 11, "2025-01-01", "subscribe"],
          [2, 12, "2025-01-01", "subscribe"],
          [3, 13, "2025-01-02", "subscribe"],
          [4, 11, "2025-01-02", "cancel"],
          [5, 14, "2025-01-04", "subscribe"],
          [6, 12, "2025-01-05", "cancel"],
          [7, 13, "2025-01-05", "cancel"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 20);
      const active = new Set<number>();
      const rows: Cell[][] = [];
      let day = "2025-01-01";
      for (let id = 1; id <= n; id++) {
        if (chance(rng, 0.5)) day = addDays(day, ri(rng, 1, 3));
        const acct = ri(rng, 11, 22);
        if (active.has(acct)) {
          active.delete(acct);
          rows.push([id, acct, day, "cancel"]);
        } else {
          active.add(acct);
          rows.push([id, acct, day, "subscribe"]);
        }
      }
      return { ICloudPlusEvent: rows };
    },
    solution: [
      "SELECT event_date, net_change,",
      "       SUM(net_change) OVER (ORDER BY event_date) AS subscribers",
      "FROM (",
      "  SELECT event_date, SUM(CASE WHEN event_type = 'subscribe' THEN 1 ELSE -1 END) AS net_change",
      "  FROM ICloudPlusEvent",
      "  GROUP BY event_date",
      ") d",
      "ORDER BY event_date",
    ].join("\n"),
    alternatives: [
      [
        "SELECT d.event_date, d.net_change,",
        "       (SELECT SUM(IF(e.event_type = 'subscribe', 1, -1)) FROM ICloudPlusEvent e WHERE e.event_date <= d.event_date) AS subscribers",
        "FROM (SELECT event_date, SUM(event_type = 'subscribe') - SUM(event_type = 'cancel') AS net_change FROM ICloudPlusEvent GROUP BY event_date) d",
        "ORDER BY d.event_date",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Turn each event into +1 or −1, then add them up per day.",
      "A running total is `SUM(…) OVER (ORDER BY …)` over the daily rows.",
      "Aggregate per day first; a window over raw events would give one row per event, not per day.",
    ],
    editorial: [
      "Give each event a sign — `+1` for subscribe, `−1` for cancel — and the day's net change is the sum of those signs, grouped by `event_date`. A day with one subscribe and one cancel nets to 0 but still has events, so it stays in the output.",
      "",
      "The subscriber count at the end of a day is the sum of every net change up to and including that day: a **running total**. Over the grouped daily rows, `SUM(net_change) OVER (ORDER BY event_date)` computes exactly that; because the dates are unique after grouping, the default frame (all rows up to the current one) is unambiguous. Running the window over the raw events instead would produce one row per event, and duplicate dates would share a total.",
      "",
      "The alternative recomputes each day's total with a correlated subquery over all earlier events — correct but quadratic, where the window is a single sorted pass. Days with no events are not invented; the statement lists only dates that have events.",
    ].join("\n"),
  },

  {
    slug: "apple-arcade-new-and-cumulative-unique-players",
    title: "Apple: New and Cumulative Unique Apple Arcade Players by Day",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation", "Dates"],
    description: [
      "After a new Apple Arcade title launches, the Arcade growth team tracks how fast the player base grows: not sessions, but **distinct people** — and how many of each day's players are new.",
      "",
      "For every `played_on` date that has at least one session, return `played_on`, `players` (distinct players who played that day), `new_players` (players whose **first session ever** in the table is on that day) and `total_players` (distinct players who have played on or before that day). A player who comes back on a later day is counted in that day's `players` but never again in `new_players` or `total_players`. Order the rows by `played_on`.",
    ].join("\n"),
    tables: [
      {
        name: "ArcadeSession",
        columns: [
          { name: "session_id", type: "int" },
          { name: "player_id", type: "int" },
          { name: "played_on", type: "date" },
          { name: "game", type: "varchar" },
        ],
        primaryKey: ["session_id"],
        note: "One row per play session; a player can have several sessions on one day, in one or several games.",
      },
    ],
    examples: [
      {
        ArcadeSession: [
          [1, 101, "2025-04-01", "Monsoon Racer"],
          [2, 101, "2025-04-01", "Rangoli Puzzle"],
          [3, 102, "2025-04-01", "Monsoon Racer"],
          [4, 101, "2025-04-02", "Monsoon Racer"],
          [5, 103, "2025-04-02", "Tabla Hero"],
          [6, 102, "2025-04-04", "Tabla Hero"],
          [7, 101, "2025-04-04", "Rangoli Puzzle"],
          [8, 104, "2025-04-05", "Monsoon Racer"],
          [9, 104, "2025-04-05", "Tabla Hero"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 25);
      const span = ri(rng, 0, 6);
      const players = ri(rng, 1, 8);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        100 + ri(rng, 1, players),
        addDays("2025-04-01", ri(rng, 0, span)),
        pick(rng, ["Monsoon Racer", "Rangoli Puzzle", "Tabla Hero", "Cricket Nets"]),
      ]);
      return { ArcadeSession: rows };
    },
    solution: [
      "WITH first_seen AS (",
      "  SELECT player_id, MIN(played_on) AS first_day",
      "  FROM ArcadeSession",
      "  GROUP BY player_id",
      "), arrivals AS (",
      "  SELECT first_day, COUNT(*) AS new_players",
      "  FROM first_seen",
      "  GROUP BY first_day",
      "), daily AS (",
      "  SELECT played_on, COUNT(DISTINCT player_id) AS players",
      "  FROM ArcadeSession",
      "  GROUP BY played_on",
      ")",
      "SELECT d.played_on, d.players,",
      "       COALESCE(a.new_players, 0) AS new_players,",
      "       SUM(COALESCE(a.new_players, 0)) OVER (ORDER BY d.played_on) AS total_players",
      "FROM daily d",
      "LEFT JOIN arrivals a ON a.first_day = d.played_on",
      "ORDER BY d.played_on",
    ].join("\n"),
    alternatives: [
      [
        "SELECT d.played_on,",
        "       COUNT(DISTINCT s.player_id) AS players,",
        "       COUNT(DISTINCT CASE WHEN NOT EXISTS (SELECT 1 FROM ArcadeSession e WHERE e.player_id = s.player_id AND e.played_on < s.played_on) THEN s.player_id END) AS new_players,",
        "       (SELECT COUNT(DISTINCT t.player_id) FROM ArcadeSession t WHERE t.played_on <= d.played_on) AS total_players",
        "FROM (SELECT DISTINCT played_on FROM ArcadeSession) d",
        "JOIN ArcadeSession s ON s.played_on = d.played_on",
        "GROUP BY d.played_on",
        "ORDER BY d.played_on",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "A running `COUNT(DISTINCT …)` is not something a window can do directly — change the question.",
      "Find each player's first day with `MIN(played_on)` per player. A player adds to the running total exactly once: on that day.",
      "Count first days per date; a running `SUM` of those counts over the dates is the cumulative number of unique players.",
      "Days on which nobody new arrived still appear, with 0 new players — LEFT JOIN the arrivals onto the days that had sessions.",
    ],
    editorial: [
      "Two of the counts are easy: `players` is `COUNT(DISTINCT player_id)` per day. The cumulative one is the trap. Adding up the daily distinct counts counts every returning player again, and MySQL has no `COUNT(DISTINCT …) OVER (ORDER BY …)`. The way out is to give every player **one** date on which they count: their first session, `MIN(played_on)` per player.",
      "",
      "Grouping those first days by date gives `new_players` per day, and since each player has exactly one first day, a running `SUM(new_players) OVER (ORDER BY played_on)` is the number of distinct players seen so far. LEFT JOIN the arrivals onto the days that had sessions, so a day on which only returning players played (2025-04-04 in the example) keeps its row with 0 new players and an unchanged total.",
      "",
      "The alternative computes the total with a correlated `COUNT(DISTINCT)` over all sessions up to each day, and the new players with `NOT EXISTS` (no earlier session of the same player). It is correct but rescans the history for every day; the first-seen version reads the sessions twice and sorts the days once.",
    ].join("\n"),
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "apple-leaf-parts-needed-for-each-mac-build-order",
    title: "Apple: Leaf Parts Needed for Each Mac Build Order",
    difficulty: "HARD",
    topics: ["Subqueries", "Joins", "Aggregation"],
    description: [
      "Before a production run, Mac operations planners turn each build order into a parts list for the suppliers. A product is assembled from parts listed in a bill of materials, and a part can itself be an assembly with lines of its own, nested to any depth. A **leaf part** is one with no lines of its own in `BomLine` — it is bought, not built.",
      "",
      "For every build order, return `order_id`, `part_name` and `total_qty`: how many of each leaf part the order needs, multiplying the quantities along every path from the ordered part down to the leaf (`units` × each `qty_per` on the way) and **adding up** a leaf reached by several paths. An order for a part that is itself a leaf needs just that part, `units` times. Order the rows by `order_id`, then `part_name`.",
    ].join("\n"),
    tables: [
      {
        name: "Part",
        columns: [
          { name: "part_id", type: "varchar" },
          { name: "part_name", type: "varchar" },
        ],
        primaryKey: ["part_id"],
        note: "Every product, sub-assembly and component; names are unique.",
      },
      {
        name: "BomLine",
        columns: [
          { name: "parent_id", type: "varchar" },
          { name: "child_id", type: "varchar" },
          { name: "qty_per", type: "int" },
        ],
        primaryKey: ["parent_id", "child_id"],
        note: "One unit of `parent_id` needs `qty_per` units of `child_id`. The structure never loops back on itself.",
      },
      {
        name: "BuildOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "part_id", type: "varchar" },
          { name: "units", type: "int" },
        ],
        primaryKey: ["order_id"],
        note: "A request to build `units` of a part — usually a finished product.",
      },
    ],
    examples: [
      {
        Part: [
          ["MBA13", "MacBook Air 13"],
          ["LOGIC", "Logic board"],
          ["TOPC", "Top case"],
          ["M4", "M4 chip"],
          ["SCRW", "Pentalobe screw"],
          ["KEYB", "Keyboard"],
          ["CELL", "Battery cell"],
        ],
        BomLine: [
          ["MBA13", "LOGIC", 1],
          ["MBA13", "TOPC", 1],
          ["MBA13", "SCRW", 10],
          ["LOGIC", "M4", 1],
          ["LOGIC", "SCRW", 4],
          ["TOPC", "KEYB", 1],
          ["TOPC", "CELL", 3],
          ["TOPC", "SCRW", 6],
        ],
        BuildOrder: [
          [1, "MBA13", 2],
          [2, "TOPC", 5],
          [3, "CELL", 40],
        ],
      },
    ],
    gen: (rng) => {
      const products = sample(rng, [["MBA13", "MacBook Air 13"], ["MBP14", "MacBook Pro 14"], ["IMAC", "iMac 24"], ["MMINI", "Mac mini"]], ri(rng, 1, 2));
      const subs = sample(rng, [["LOGIC", "Logic board"], ["TOPC", "Top case"], ["DISP", "Display assembly"], ["PSU", "Power supply"]], ri(rng, 1, 3));
      const leaves = sample(rng, [["M4", "M4 chip"], ["SCRW", "Pentalobe screw"], ["KEYB", "Keyboard"], ["CELL", "Battery cell"], ["FAN", "Fan"], ["SPKR", "Speaker"], ["PANEL", "LCD panel"]], ri(rng, 2, 5));
      const bom: Cell[][] = [];
      // Products draw on sub-assemblies and leaves, sub-assemblies only on
      // leaves: no loops, and a shared leaf is reached along several paths.
      for (const [p] of products) for (const [c] of sample(rng, [...subs, ...leaves], ri(rng, 1, 3))) bom.push([p!, c!, pick(rng, [1, 1, 2, 4])]);
      for (const [s] of subs) for (const [c] of sample(rng, leaves, ri(rng, 0, 3))) bom.push([s!, c!, pick(rng, [1, 2, 3, 6])]);
      const all = [...products, ...subs, ...leaves];
      const orders: Cell[][] = seq(1, ri(rng, 1, 4)).map((id) => [id, chance(rng, 0.7) ? pick(rng, products)[0]! : pick(rng, all)[0]!, ri(rng, 1, 5)]);
      return { Part: all.map(([id, name]) => [id!, name!]), BomLine: bom, BuildOrder: orders };
    },
    solution: [
      "WITH RECURSIVE explode AS (",
      "  SELECT order_id, part_id, units AS qty",
      "  FROM BuildOrder",
      "  UNION ALL",
      "  SELECT e.order_id, l.child_id, e.qty * l.qty_per",
      "  FROM explode e",
      "  JOIN BomLine l ON l.parent_id = e.part_id",
      ")",
      "SELECT e.order_id, p.part_name, SUM(e.qty) AS total_qty",
      "FROM explode e",
      "JOIN Part p ON p.part_id = e.part_id",
      "WHERE NOT EXISTS (SELECT 1 FROM BomLine l WHERE l.parent_id = e.part_id)",
      "GROUP BY e.order_id, e.part_id, p.part_name",
      "ORDER BY e.order_id, p.part_name",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE tree AS (",
        "  SELECT part_id AS root_id, part_id, 1 AS per_unit",
        "  FROM (SELECT DISTINCT part_id FROM BuildOrder) r",
        "  UNION ALL",
        "  SELECT t.root_id, l.child_id, t.per_unit * l.qty_per",
        "  FROM tree t JOIN BomLine l ON l.parent_id = t.part_id",
        "), leaf_per_unit AS (",
        "  SELECT root_id, part_id, SUM(per_unit) AS per_unit",
        "  FROM tree",
        "  WHERE part_id NOT IN (SELECT parent_id FROM BomLine)",
        "  GROUP BY root_id, part_id",
        ")",
        "SELECT b.order_id, p.part_name, b.units * u.per_unit AS total_qty",
        "FROM BuildOrder b",
        "JOIN leaf_per_unit u ON u.root_id = b.part_id",
        "JOIN Part p ON p.part_id = u.part_id",
        "ORDER BY b.order_id, p.part_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The depth of the bill of materials is not fixed, so no fixed number of joins can follow it — use `WITH RECURSIVE`.",
      "Start from the build orders with `units` as the quantity; each recursive step joins `BomLine` on the current part and multiplies the quantity by `qty_per`.",
      "A leaf is a part that never appears as a `parent_id`. Keep only the leaf rows of the explosion.",
      "The same leaf can be reached along several paths — sum per order and leaf.",
    ],
    editorial: [
      "A bill of materials is a tree (strictly, a graph without cycles) of unknown depth, so the natural tool is a **recursive CTE**. The anchor is one row per build order: the ordered part with quantity `units`. The recursive step takes every row produced so far, joins the BOM lines whose parent is that part, and emits each child with quantity `qty × qty_per`. The recursion stops by itself at parts that have no lines, and it cannot run forever because the structure has no cycles.",
      "",
      "The explosion holds every level — products, sub-assemblies and leaves — so keep only the **leaf** rows: parts with no BOM line of their own (`NOT EXISTS`). A shared component such as the screw in the example arrives along several paths (directly from the laptop, through the logic board and through the top case), each with its own multiplied quantity, and the final `SUM` per order and part adds them: 2 × 10 + 2 × 4 + 2 × 6 = 40 screws for order 1. An order for a leaf itself never recurses and keeps its own row.",
      "",
      "The alternative explodes each ordered part once, per single unit (`1` at the root), sums the per-unit leaf needs, and only then multiplies by each order's `units` — handy when many orders share a product. Both walk each BOM path once per root.",
    ].join("\n"),
  },

  {
    slug: "apple-subscription-billing-lapses-recovered-in-grace",
    title: "Apple: Subscription Billing Lapses Recovered in the Grace Period",
    difficulty: "HARD",
    topics: ["Window Functions", "Subqueries", "Dates"],
    description: [
      "When an App Store subscription renewal fails to charge, the store keeps retrying, and the subscriber keeps access during a **16-day grace period**. The commerce team measures how many lapses are recovered within it.",
      "",
      "Within one subscription, order its billing attempts by `attempted_on`, then `attempt_id`. A **lapse** begins at a `failure` that is the subscription's first attempt or that directly follows a `success`; later failures before the next success belong to the same lapse. A lapse is **recovered in grace** if the subscription's first `success` after the lapse's first failure comes **at most 16 days** after that failure. For each `app_name` with at least one lapse, return `app_name`, `lapses` and `recovered_in_grace`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "AppSubscription",
        columns: [
          { name: "subscription_id", type: "int" },
          { name: "app_name", type: "varchar" },
          { name: "started_on", type: "date" },
        ],
        primaryKey: ["subscription_id"],
        note: "One row per auto-renewing subscription; an app has many subscribers.",
      },
      {
        name: "BillingAttempt",
        columns: [
          { name: "attempt_id", type: "int" },
          { name: "subscription_id", type: "int" },
          { name: "attempted_on", type: "date" },
          { name: "outcome", type: "enum", values: ["success", "failure"] },
        ],
        primaryKey: ["attempt_id"],
        note: "One row per charge attempt, renewal or retry.",
      },
    ],
    examples: [
      {
        AppSubscription: [
          [1, "Yoga Streak", "2024-01-10"],
          [2, "Yoga Streak", "2024-02-01"],
          [3, "Raga Tuner", "2024-03-15"],
        ],
        BillingAttempt: [
          [1, 1, "2025-01-10", "success"],
          [2, 1, "2025-02-10", "failure"],
          [3, 1, "2025-02-15", "failure"],
          [4, 1, "2025-02-26", "success"],
          [5, 1, "2025-03-26", "failure"],
          [6, 1, "2025-04-20", "success"],
          [7, 2, "2025-02-01", "failure"],
          [8, 2, "2025-02-09", "failure"],
          [9, 3, "2025-03-15", "success"],
          [10, 3, "2025-04-15", "success"],
        ],
      },
    ],
    gen: (rng) => {
      const apps = sample(rng, APPS, ri(rng, 1, 3));
      const subs: Cell[][] = seq(1, ri(rng, 1, 6)).map((id) => [id, pick(rng, apps), dateBetween(rng, "2024-01-01", "2024-12-31")]);
      const rows: Cell[][] = [];
      let id = 1;
      for (const s of subs) {
        let d = dateBetween(rng, "2025-01-01", "2025-02-15");
        const k = ri(rng, 1, 7);
        for (let i = 0; i < k; i++) {
          rows.push([id++, s[0]!, d, chance(rng, 0.5) ? "failure" : "success"]);
          d = addDays(d, chance(rng, 0.25) ? pick(rng, [16, 17]) : ri(rng, 1, 25));
        }
      }
      return { AppSubscription: subs, BillingAttempt: rows };
    },
    solution: [
      "WITH ordered AS (",
      "  SELECT attempt_id, subscription_id, attempted_on, outcome,",
      "         LAG(outcome) OVER (PARTITION BY subscription_id ORDER BY attempted_on, attempt_id) AS prev_outcome",
      "  FROM BillingAttempt",
      "), lapse AS (",
      "  SELECT o.subscription_id, o.attempted_on,",
      "         (SELECT MIN(s.attempted_on) FROM BillingAttempt s",
      "          WHERE s.subscription_id = o.subscription_id AND s.outcome = 'success'",
      "            AND (s.attempted_on > o.attempted_on OR (s.attempted_on = o.attempted_on AND s.attempt_id > o.attempt_id))) AS recovered_on",
      "  FROM ordered o",
      "  WHERE o.outcome = 'failure' AND (o.prev_outcome IS NULL OR o.prev_outcome = 'success')",
      ")",
      "SELECT a.app_name, COUNT(*) AS lapses,",
      "       SUM(CASE WHEN l.recovered_on IS NOT NULL AND DATEDIFF(l.recovered_on, l.attempted_on) <= 16 THEN 1 ELSE 0 END) AS recovered_in_grace",
      "FROM lapse l",
      "JOIN AppSubscription a ON a.subscription_id = l.subscription_id",
      "GROUP BY a.app_name",
    ].join("\n"),
    alternatives: [
      [
        "WITH marked AS (",
        "  SELECT subscription_id, attempted_on, outcome,",
        "         LAG(outcome) OVER w AS prev_outcome,",
        "         MIN(CASE WHEN outcome = 'success' THEN attempted_on END)",
        "           OVER (PARTITION BY subscription_id ORDER BY attempted_on, attempt_id ROWS BETWEEN 1 FOLLOWING AND UNBOUNDED FOLLOWING) AS next_success",
        "  FROM BillingAttempt",
        "  WINDOW w AS (PARTITION BY subscription_id ORDER BY attempted_on, attempt_id)",
        ")",
        "SELECT a.app_name, COUNT(*) AS lapses,",
        "       SUM(IF(DATEDIFF(m.next_success, m.attempted_on) <= 16, 1, 0)) AS recovered_in_grace",
        "FROM marked m",
        "JOIN AppSubscription a ON a.subscription_id = m.subscription_id",
        "WHERE m.outcome = 'failure' AND COALESCE(m.prev_outcome, 'success') = 'success'",
        "GROUP BY a.app_name",
      ].join("\n"),
    ],
    hints: [
      "Find where each lapse starts: a failure whose previous attempt (by `LAG`) is a success or does not exist.",
      "For each lapse start, look ahead for the subscription's first later success.",
      "A lapse with no later success is still a lapse — it just is not recovered.",
      "Count lapses and recoveries per app at the end, joining the subscription to its app.",
    ],
    editorial: [
      "Two ideas are layered here. First, a **lapse** is an island of consecutive failures, and only its first failure matters. `LAG(outcome)` over each subscription's ordered attempts tells whether a failure starts an island: it does when the previous outcome is a success or there is no previous attempt. Retries that fail again are inside the same lapse and must not be counted twice — subscription 1's two February failures are one lapse.",
      "",
      "Second, recovery looks *forward*: the first success after the lapse's first failure. A correlated `MIN` over later successes finds it; a lapse with no later success gets NULL and is counted as a lapse but not a recovery (subscription 2). The grace test is `DATEDIFF(recovered_on, failed_on) <= 16` — 16 days in counts, 17 does not.",
      "",
      "The alternative does the look-ahead with a window instead: `MIN(CASE WHEN outcome = 'success' THEN attempted_on END)` over the frame `ROWS BETWEEN 1 FOLLOWING AND UNBOUNDED FOLLOWING` is the next success date for every row, so no subquery is needed. Finally the lapses join their subscription and are counted per app with a conditional `SUM`. The window version is a single sorted pass per subscription.",
    ].join("\n"),
  },

  {
    slug: "apple-in-app-revenue-at-the-price-in-effect",
    title: "Apple: In-App Revenue at the Price in Effect on Each Day",
    difficulty: "HARD",
    topics: ["Subqueries", "Joins", "Dates"],
    description: [
      "Developers can change an in-app product's price, and a change takes effect from its `effective_on` date. The payments team recomputes revenue to check the ledger.",
      "",
      "A purchase is charged the `new_price_cents` of the **latest** price change of its product with `effective_on` **on or before** the purchase date; if the product had no change by then, it is charged the product's `base_price_cents`. For every product with at least one purchase, return `product_name`, `units` (total quantity) and `revenue_cents` (the sum of quantity × charged price). Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "IapProduct",
        columns: [
          { name: "product_id", type: "int" },
          { name: "product_name", type: "varchar" },
          { name: "base_price_cents", type: "int" },
        ],
        primaryKey: ["product_id"],
        note: "One row per in-app product, with its launch price.",
      },
      {
        name: "PriceChange",
        columns: [
          { name: "product_id", type: "int" },
          { name: "effective_on", type: "date" },
          { name: "new_price_cents", type: "int" },
        ],
        primaryKey: ["product_id", "effective_on"],
        note: "A product's price from `effective_on` until its next change.",
      },
      {
        name: "IapPurchase",
        columns: [
          { name: "purchase_id", type: "int" },
          { name: "product_id", type: "int" },
          { name: "purchased_on", type: "date" },
          { name: "quantity", type: "int" },
        ],
        primaryKey: ["purchase_id"],
        note: "One row per purchase; `quantity` is at least 1.",
      },
    ],
    examples: [
      {
        IapProduct: [
          [1, "Gem Pack S", 99],
          [2, "Gem Pack L", 499],
          [3, "Pro Unlock", 999],
        ],
        PriceChange: [
          [1, "2025-02-01", 129],
          [1, "2025-03-01", 149],
          [2, "2025-02-15", 449],
        ],
        IapPurchase: [
          [1, 1, "2025-01-20", 2],
          [2, 1, "2025-02-01", 1],
          [3, 1, "2025-02-28", 1],
          [4, 1, "2025-03-05", 3],
          [5, 2, "2025-02-14", 1],
          [6, 2, "2025-02-15", 2],
        ],
      },
    ],
    gen: (rng) => {
      const products: Cell[][] = seq(1, ri(rng, 1, 4)).map((id) => [id, pick(rng, ["Gem Pack", "Coin Bag", "Pro Unlock", "Ad-Free", "Song Pack"]) + ` ${id}`, pick(rng, [99, 199, 499, 999])]);
      const changes: Cell[][] = [];
      for (const p of products) {
        const days = sample(rng, ["2025-01-15", "2025-02-01", "2025-02-15", "2025-03-01", "2025-03-20"], ri(rng, 0, 3));
        for (const d of days) changes.push([p[0]!, d, pick(rng, [79, 129, 149, 299, 449, 799])]);
      }
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 15);
      const purchases: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 1, products.length),
        chance(rng, 0.3) ? pick(rng, ["2025-01-15", "2025-02-01", "2025-02-15", "2025-03-01", "2025-03-20"]) : dateBetween(rng, "2025-01-05", "2025-03-31"),
        ri(rng, 1, 3),
      ]);
      return { IapProduct: products, PriceChange: changes, IapPurchase: purchases };
    },
    solution: [
      "SELECT pr.product_name, SUM(p.quantity) AS units,",
      "       SUM(p.quantity * COALESCE(",
      "         (SELECT c.new_price_cents FROM PriceChange c",
      "          WHERE c.product_id = p.product_id AND c.effective_on <= p.purchased_on",
      "          ORDER BY c.effective_on DESC LIMIT 1),",
      "         pr.base_price_cents)) AS revenue_cents",
      "FROM IapPurchase p",
      "JOIN IapProduct pr ON pr.product_id = p.product_id",
      "GROUP BY pr.product_id, pr.product_name",
    ].join("\n"),
    alternatives: [
      [
        "WITH matched AS (",
        "  SELECT p.purchase_id, p.product_id, p.quantity, c.new_price_cents,",
        "         ROW_NUMBER() OVER (PARTITION BY p.purchase_id ORDER BY c.effective_on DESC) AS rn",
        "  FROM IapPurchase p",
        "  LEFT JOIN PriceChange c ON c.product_id = p.product_id AND c.effective_on <= p.purchased_on",
        ")",
        "SELECT pr.product_name, SUM(m.quantity) AS units, SUM(m.quantity * COALESCE(m.new_price_cents, pr.base_price_cents)) AS revenue_cents",
        "FROM matched m JOIN IapProduct pr ON pr.product_id = m.product_id",
        "WHERE m.rn = 1",
        "GROUP BY pr.product_id, pr.product_name",
      ].join("\n"),
      [
        "SELECT pr.product_name, SUM(p.quantity) AS units, SUM(p.quantity * COALESCE(c.new_price_cents, pr.base_price_cents)) AS revenue_cents",
        "FROM IapPurchase p",
        "JOIN IapProduct pr ON pr.product_id = p.product_id",
        "LEFT JOIN PriceChange c ON c.product_id = p.product_id",
        "  AND c.effective_on = (SELECT MAX(x.effective_on) FROM PriceChange x WHERE x.product_id = p.product_id AND x.effective_on <= p.purchased_on)",
        "GROUP BY pr.product_id, pr.product_name",
      ].join("\n"),
    ],
    hints: [
      "This is an \"as of\" lookup: for each purchase, the latest change dated on or before it.",
      "A correlated subquery ordered by `effective_on DESC` with `LIMIT 1` fetches that one price.",
      "When no change qualifies the lookup returns NULL — fall back to the base price with `COALESCE`.",
      "A change effective on the purchase day already applies.",
    ],
    editorial: [
      "Each purchase needs the price **as of** its date: among its product's price changes, the one with the greatest `effective_on` that is not after the purchase. That is a per-row lookup, and the most direct form is a correlated scalar subquery — filter the product's changes to `effective_on <= purchased_on`, sort newest first, take one row. The comparison is inclusive, so a purchase on the day a change takes effect pays the new price.",
      "",
      "A purchase made before any change finds nothing; the scalar subquery yields NULL and `COALESCE(…, base_price_cents)` falls back to the launch price. Multiply by `quantity` and sum per product; products never purchased do not appear because the query starts from purchases.",
      "",
      "Two set-based alternatives: LEFT JOIN every eligible change to each purchase and keep the newest with `ROW_NUMBER() … = 1` (a purchase with no eligible change keeps its single NULL row), or join on `effective_on = MAX(effective_on)` of eligible changes. With an index on `(product_id, effective_on)` the subquery is one index seek per purchase.",
    ].join("\n"),
  },

  {
    slug: "apple-devices-that-downgraded-ios",
    title: "Apple: Devices That Moved to an Older iOS Version",
    difficulty: "HARD",
    topics: ["Strings", "Window Functions"],
    description: [
      "Software-update engineers investigate devices that end up on an **older** iOS build than the one they had — usually a restore from an archived image. Versions are `major.minor` or `major.minor.patch`; a missing patch counts as 0, and every part compares **as a number** (so `16.7.10` is newer than `16.7.9`, and `17.4.1` is newer than `17.4`).",
      "",
      "For each device, order its installs by `installed_on`. Return every install whose version is **strictly older** than the version of the device's previous install, with `device_id`, `from_version` (the previous install's version), `to_version` and `installed_on`. Order the rows by `device_id`, then `installed_on`.",
    ].join("\n"),
    tables: [
      {
        name: "DeviceInstall",
        columns: [
          { name: "install_id", type: "int" },
          { name: "device_id", type: "int" },
          { name: "installed_on", type: "date" },
          { name: "ios_version", type: "varchar" },
        ],
        primaryKey: ["install_id"],
        note: "One row per OS install on a device; a device never has two installs on the same day.",
      },
    ],
    examples: [
      {
        DeviceInstall: [
          [1, 1, "2024-07-01", "16.7.9"],
          [2, 1, "2024-08-01", "16.7.10"],
          [3, 1, "2024-09-20", "18.0"],
          [4, 2, "2024-06-10", "17.4.1"],
          [5, 2, "2024-06-12", "17.4"],
          [6, 2, "2024-07-30", "17.6.1"],
          [7, 3, "2024-05-02", "17.5"],
          [8, 3, "2024-05-20", "16.7.10"],
          [9, 3, "2024-06-01", "16.7.10"],
        ],
      },
    ],
    gen: (rng) => {
      const versions = ["16.7.9", "16.7.10", "16.7.11", "17.4", "17.4.1", "17.5", "17.6.1", "18.0", "18.0.1"];
      const rows: Cell[][] = [];
      let id = 1;
      const devices = ri(rng, 1, 5);
      for (let d = 1; d <= devices; d++) {
        let day = dateBetween(rng, "2024-05-01", "2024-06-30");
        let vi = ri(rng, 0, versions.length - 1);
        const k = ri(rng, 1, 6);
        for (let i = 0; i < k; i++) {
          rows.push([id++, d, day, versions[vi]!]);
          day = addDays(day, ri(rng, 1, 30));
          vi = Math.max(0, Math.min(versions.length - 1, vi + pick(rng, [-2, -1, 0, 1, 1, 2])));
        }
      }
      return { DeviceInstall: rows };
    },
    solution: [
      "WITH parsed AS (",
      "  SELECT device_id, installed_on, ios_version,",
      "         CAST(SUBSTRING_INDEX(ios_version, '.', 1) AS SIGNED) * 1000000",
      "       + CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(ios_version, '.', 2), '.', -1) AS SIGNED) * 1000",
      "       + CASE WHEN ios_version LIKE '%.%.%' THEN CAST(SUBSTRING_INDEX(ios_version, '.', -1) AS SIGNED) ELSE 0 END AS vkey",
      "  FROM DeviceInstall",
      "), paired AS (",
      "  SELECT device_id, installed_on, ios_version, vkey,",
      "         LAG(ios_version) OVER (PARTITION BY device_id ORDER BY installed_on) AS prev_version,",
      "         LAG(vkey) OVER (PARTITION BY device_id ORDER BY installed_on) AS prev_key",
      "  FROM parsed",
      ")",
      "SELECT device_id, prev_version AS from_version, ios_version AS to_version, installed_on",
      "FROM paired",
      "WHERE vkey < prev_key",
      "ORDER BY device_id, installed_on",
    ].join("\n"),
    alternatives: [
      [
        "WITH parts AS (",
        "  SELECT device_id, installed_on, ios_version,",
        "         SUBSTRING_INDEX(ios_version, '.', 1) + 0 AS ma,",
        "         SUBSTRING_INDEX(SUBSTRING_INDEX(ios_version, '.', 2), '.', -1) + 0 AS mi,",
        "         IF(LENGTH(ios_version) - LENGTH(REPLACE(ios_version, '.', '')) = 2, SUBSTRING_INDEX(ios_version, '.', -1) + 0, 0) AS pa",
        "  FROM DeviceInstall",
        ")",
        "SELECT c.device_id, p.ios_version AS from_version, c.ios_version AS to_version, c.installed_on",
        "FROM parts c",
        "JOIN parts p ON p.device_id = c.device_id",
        " AND p.installed_on = (SELECT MAX(x.installed_on) FROM DeviceInstall x WHERE x.device_id = c.device_id AND x.installed_on < c.installed_on)",
        "WHERE c.ma < p.ma OR (c.ma = p.ma AND (c.mi < p.mi OR (c.mi = p.mi AND c.pa < p.pa)))",
        "ORDER BY c.device_id, c.installed_on",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Comparing the version strings as text fails: `'16.7.10' < '16.7.9'` as text.",
      "Split each version into major, minor and patch with `SUBSTRING_INDEX`, and treat a missing patch as 0.",
      "Combine the parts into one sortable number (major × 1,000,000 + minor × 1,000 + patch), or compare them part by part.",
      "`LAG` gives the previous install's version on the same device.",
    ],
    editorial: [
      "The heart of the problem is comparing versions. As text, `16.7.10` sorts before `16.7.9`, so a plain string comparison would report an upgrade as a downgrade. Split the string instead: `SUBSTRING_INDEX(v, '.', 1)` is the major, `SUBSTRING_INDEX(SUBSTRING_INDEX(v, '.', 2), '.', -1)` the minor, and the last part is the patch only when the version has two dots (`LIKE '%.%.%'`), otherwise 0. Cast them to numbers and pack them into one key, `major × 1,000,000 + minor × 1,000 + patch`, which orders versions exactly like the part-by-part rule as long as minor and patch stay below 1,000.",
      "",
      "With a numeric key per install, the rest is a **LAG** per device ordered by date: keep the rows whose key is strictly lower than the previous install's. Reinstalling the same version (device 3) is not a downgrade, and a device's first install has no previous row, so its NULL comparison drops it.",
      "",
      "The alternative compares the three parts lexicographically and finds the previous install with a correlated `MAX(installed_on)` instead of a window. Both parse each version once; the window version sorts each device's installs once.",
    ].join("\n"),
  },

  {
    slug: "apple-apps-breaking-into-their-categorys-top-three",
    title: "Apple: Apps Breaking Into Their Category's Top Three",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Joins"],
    description: [
      "App Store editorial features apps that have just climbed into the top of their category's monthly download chart.",
      "",
      "In each category and month, rank apps by `downloads`, highest first, with `RANK()` semantics (tied apps share a position and the next position is skipped). An app **breaks into the top three** in a month when its position that month is **3 or better** and, in the **previous calendar month**, it either had a position worse than 3 or no row at all. Skip the earliest month present in the whole table, which has nothing to compare with. Return `category`, `month_start`, `app_name` and `rank_now`, ordered by `month_start`, `category`, `rank_now`, then `app_name`.",
    ].join("\n"),
    tables: [
      {
        name: "ChartApp",
        columns: [
          { name: "app_id", type: "int" },
          { name: "app_name", type: "varchar" },
          { name: "category", type: "varchar" },
        ],
        primaryKey: ["app_id"],
        note: "One row per app; names are unique.",
      },
      {
        name: "MonthlyDownloads",
        columns: [
          { name: "app_id", type: "int" },
          { name: "month_start", type: "date" },
          { name: "downloads", type: "int" },
        ],
        primaryKey: ["app_id", "month_start"],
        note: "Downloads of an app in a month; `month_start` is the first day of the month. An app with no row in a month is not on that month's chart.",
      },
    ],
    examples: [
      {
        ChartApp: [
          [1, "Pocket Tabla", "Music"],
          [2, "Raga Tuner", "Music"],
          [3, "Sketch Studio", "Music"],
          [4, "Monsoon Weather", "Music"],
          [5, "Budget Bird", "Music"],
        ],
        MonthlyDownloads: [
          [1, "2025-01-01", 900],
          [2, "2025-01-01", 700],
          [3, "2025-01-01", 500],
          [4, "2025-01-01", 300],
          [1, "2025-02-01", 800],
          [2, "2025-02-01", 400],
          [4, "2025-02-01", 650],
          [5, "2025-02-01", 400],
          [3, "2025-03-01", 1000],
          [5, "2025-03-01", 200],
        ],
      },
    ],
    gen: (rng) => {
      const cats = sample(rng, CATEGORIES, ri(rng, 1, 2));
      const apps: Cell[][] = sample(rng, APPS, ri(rng, 3, 9)).map((a, i) => [i + 1, a, pick(rng, cats)]);
      const months = ri(rng, 2, 4);
      const start = pick(rng, ["2024-11", "2024-12", "2025-01"]);
      const rows: Cell[][] = [];
      for (let m = 0; m < months; m++) {
        if (m > 0 && chance(rng, 0.15)) continue; // a month with no chart rows at all
        for (const a of apps) if (chance(rng, 0.8)) rows.push([a[0]!, monthStart(start, m), roundTo(rng, 100, 1000, 100)]);
      }
      return { ChartApp: apps, MonthlyDownloads: rows };
    },
    solution: [
      "WITH ranked AS (",
      "  SELECT a.app_id, a.app_name, a.category, d.month_start,",
      "         YEAR(d.month_start) * 12 + MONTH(d.month_start) AS month_no,",
      "         RANK() OVER (PARTITION BY a.category, d.month_start ORDER BY d.downloads DESC) AS pos",
      "  FROM MonthlyDownloads d",
      "  JOIN ChartApp a ON a.app_id = d.app_id",
      ")",
      "SELECT c.category, c.month_start, c.app_name, c.pos AS rank_now",
      "FROM ranked c",
      "LEFT JOIN ranked p ON p.app_id = c.app_id AND p.month_no = c.month_no - 1",
      "WHERE c.pos <= 3",
      "  AND c.month_start > (SELECT MIN(month_start) FROM MonthlyDownloads)",
      "  AND (p.app_id IS NULL OR p.pos > 3)",
      "ORDER BY c.month_start, c.category, rank_now, c.app_name",
    ].join("\n"),
    alternatives: [
      [
        "WITH ranked AS (",
        "  SELECT a.app_id, a.app_name, a.category, d.month_start,",
        "         (SELECT COUNT(*) FROM MonthlyDownloads d2 JOIN ChartApp a2 ON a2.app_id = d2.app_id",
        "          WHERE a2.category = a.category AND d2.month_start = d.month_start AND d2.downloads > d.downloads) + 1 AS pos",
        "  FROM MonthlyDownloads d",
        "  JOIN ChartApp a ON a.app_id = d.app_id",
        ")",
        "SELECT c.category, c.month_start, c.app_name, c.pos AS rank_now",
        "FROM ranked c",
        "WHERE c.pos <= 3",
        "  AND EXISTS (SELECT 1 FROM MonthlyDownloads e WHERE e.month_start < c.month_start)",
        "  AND NOT EXISTS (SELECT 1 FROM ranked p WHERE p.app_id = c.app_id AND p.pos <= 3",
        "                  AND p.month_start = DATE_SUB(c.month_start, INTERVAL 1 MONTH))",
        "ORDER BY c.month_start, c.category, rank_now, c.app_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Rank the apps per category and month with `RANK()` over `PARTITION BY category, month_start`.",
      "Join each ranked row to the same app's row for the previous calendar month — a LEFT JOIN, because the app may have been off the chart.",
      "\"Previous calendar month\" is not \"previous row\": a month index `YEAR × 12 + MONTH` makes it `n − 1`.",
      "Exclude the table's earliest month with a subquery on `MIN(month_start)`.",
    ],
    editorial: [
      "Start by building the monthly charts: `RANK() OVER (PARTITION BY category, month_start ORDER BY downloads DESC)`. `RANK` (not `ROW_NUMBER`) is what the statement asks for — two apps tied for third are both third, and the app after them is fifth, so a tie can put four apps in the top three.",
      "",
      "Then compare each app with itself a month earlier. Joining the ranked rows to themselves on `app_id` and `month_no − 1` (with `month_no = YEAR × 12 + MONTH`, so December → January works) gives the previous position. It must be a **LEFT** join: an app with no row last month was off the chart, and that counts as breaking in. The condition is then `pos <= 3 AND (no previous row OR previous pos > 3)`. A month directly after a gap has no previous-month rows for anyone, so all its top apps count — but the very first month in the table is excluded explicitly, since there is nothing to compare it with.",
      "",
      "The alternative computes the rank as \"1 + apps in the category with more downloads that month\" — the definition of `RANK` — and uses `NOT EXISTS` for \"was in the top three last month\". The window version sorts each category-month once; the subquery version is quadratic per chart.",
    ].join("\n"),
  },

  {
    slug: "apple-launch-day-pre-orders-filled-in-queue-order",
    title: "Apple: Launch-Day Pre-Orders Filled Strictly in Queue Order",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins", "Aggregation"],
    description: [
      "Before a launch, the supply planning team checks how many pre-orders the launch-day stock will cover. A model's launch-day stock is the sum of `units` of its shipments arriving **on or before** its `launch_date`; later shipments do not count.",
      "",
      "Pre-orders are served strictly in queue order — by `ordered_at`, then `order_id` — and no order may skip ahead: an order is **filled** when its units plus the units of every earlier pre-order of the same model fit within the stock; otherwise it is **waitlisted**. For **every** model, return `model_name`, `filled_orders`, `waitlisted_orders` and `units_left` (stock minus the units of filled orders). A model with no pre-orders shows 0, 0 and its full stock. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "DeviceModel",
        columns: [
          { name: "model_id", type: "int" },
          { name: "model_name", type: "varchar" },
          { name: "launch_date", type: "date" },
        ],
        primaryKey: ["model_id"],
        note: "One row per model and colour being launched.",
      },
      {
        name: "Shipment",
        columns: [
          { name: "shipment_id", type: "int" },
          { name: "model_id", type: "int" },
          { name: "arrives_on", type: "date" },
          { name: "units", type: "int" },
        ],
        primaryKey: ["shipment_id"],
        note: "Stock arriving at the store for a model.",
      },
      {
        name: "PreOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "model_id", type: "int" },
          { name: "ordered_at", type: "datetime" },
          { name: "units", type: "int" },
        ],
        primaryKey: ["order_id"],
        note: "One pre-order; `units` is at least 1. Two orders may share a timestamp.",
      },
    ],
    examples: [
      {
        DeviceModel: [
          [1, "iPhone 16 Pro Desert", "2025-09-19"],
          [2, "iPhone 16 Pro Black", "2025-09-19"],
          [3, "iPhone 16 Teal", "2025-09-19"],
        ],
        Shipment: [
          [1, 1, "2025-09-15", 4],
          [2, 1, "2025-09-19", 2],
          [3, 1, "2025-09-22", 10],
          [4, 2, "2025-09-17", 3],
        ],
        PreOrder: [
          [1, 1, "2025-09-12 17:30:00", 2],
          [2, 1, "2025-09-12 17:30:00", 3],
          [3, 1, "2025-09-12 17:31:00", 2],
          [4, 1, "2025-09-12 17:35:00", 1],
          [5, 3, "2025-09-12 17:40:00", 1],
        ],
      },
    ],
    gen: (rng) => {
      const models: Cell[][] = seq(1, ri(rng, 1, 3)).map((id) => [id, `iPhone 16 ${pick(rng, ["Pro ", ""])}${pick(rng, ["Black", "White", "Teal", "Desert", "Pink"])} ${id}`, "2025-09-19"]);
      const ships: Cell[][] = [];
      let sid = 1;
      for (const m of models) for (let k = ri(rng, 0, 3); k > 0; k--) ships.push([sid++, m[0]!, chance(rng, 0.25) ? pick(rng, ["2025-09-19", "2025-09-20"]) : dateBetween(rng, "2025-09-12", "2025-09-25"), ri(rng, 1, 5)]);
      const orders: Cell[][] = [];
      let oid = 1;
      for (const m of models) {
        const k = ri(rng, 0, 7);
        let minute = 17 * 60 + ri(rng, 0, 5);
        for (let i = 0; i < k; i++) {
          orders.push([oid++, m[0]!, at("2025-09-12", minute), ri(rng, 1, 3)]);
          if (chance(rng, 0.7)) minute += ri(rng, 1, 4);
        }
      }
      return { DeviceModel: models, Shipment: ships, PreOrder: orders };
    },
    solution: [
      "WITH stock AS (",
      "  SELECT m.model_id, m.model_name, COALESCE(SUM(s.units), 0) AS units",
      "  FROM DeviceModel m",
      "  LEFT JOIN Shipment s ON s.model_id = m.model_id AND s.arrives_on <= m.launch_date",
      "  GROUP BY m.model_id, m.model_name",
      "), queue AS (",
      "  SELECT order_id, model_id, units,",
      "         SUM(units) OVER (PARTITION BY model_id ORDER BY ordered_at, order_id) AS running",
      "  FROM PreOrder",
      ")",
      "SELECT st.model_name,",
      "       SUM(CASE WHEN q.running <= st.units THEN 1 ELSE 0 END) AS filled_orders,",
      "       SUM(CASE WHEN q.running > st.units THEN 1 ELSE 0 END) AS waitlisted_orders,",
      "       st.units - SUM(CASE WHEN q.running <= st.units THEN q.units ELSE 0 END) AS units_left",
      "FROM stock st",
      "LEFT JOIN queue q ON q.model_id = st.model_id",
      "GROUP BY st.model_id, st.model_name, st.units",
    ].join("\n"),
    alternatives: [
      [
        "SELECT m.model_name,",
        "       (SELECT COUNT(*) FROM PreOrder p WHERE p.model_id = m.model_id AND",
        "          (SELECT SUM(q.units) FROM PreOrder q WHERE q.model_id = p.model_id",
        "             AND (q.ordered_at < p.ordered_at OR (q.ordered_at = p.ordered_at AND q.order_id <= p.order_id)))",
        "          <= (SELECT COALESCE(SUM(s.units), 0) FROM Shipment s WHERE s.model_id = m.model_id AND s.arrives_on <= m.launch_date)) AS filled_orders,",
        "       (SELECT COUNT(*) FROM PreOrder p WHERE p.model_id = m.model_id AND",
        "          (SELECT SUM(q.units) FROM PreOrder q WHERE q.model_id = p.model_id",
        "             AND (q.ordered_at < p.ordered_at OR (q.ordered_at = p.ordered_at AND q.order_id <= p.order_id)))",
        "          > (SELECT COALESCE(SUM(s.units), 0) FROM Shipment s WHERE s.model_id = m.model_id AND s.arrives_on <= m.launch_date)) AS waitlisted_orders,",
        "       (SELECT COALESCE(SUM(s.units), 0) FROM Shipment s WHERE s.model_id = m.model_id AND s.arrives_on <= m.launch_date)",
        "       - COALESCE((SELECT SUM(p.units) FROM PreOrder p WHERE p.model_id = m.model_id AND",
        "          (SELECT SUM(q.units) FROM PreOrder q WHERE q.model_id = p.model_id",
        "             AND (q.ordered_at < p.ordered_at OR (q.ordered_at = p.ordered_at AND q.order_id <= p.order_id)))",
        "          <= (SELECT COALESCE(SUM(s.units), 0) FROM Shipment s WHERE s.model_id = m.model_id AND s.arrives_on <= m.launch_date)), 0) AS units_left",
        "FROM DeviceModel m",
      ].join("\n"),
    ],
    hints: [
      "Compute each model's launch-day stock first — a LEFT JOIN so a model with no shipments has 0, with the arrival test in `ON`.",
      "\"No order may skip ahead\" means an order is filled exactly when the running total of units up to it is within the stock.",
      "A running `SUM(units) OVER (PARTITION BY model_id ORDER BY ordered_at, order_id)` gives that total; `order_id` breaks timestamp ties.",
      "LEFT JOIN the queue to the stock so models without pre-orders still appear.",
    ],
    editorial: [
      "Two quantities meet here: what is on the shelf and what is queued. The shelf is per model: sum the shipments that arrive on or before launch. Put the arrival test in the `ON` of a LEFT JOIN from `DeviceModel`, so a model whose stock all arrives late — or that has no shipments — still has a row, with `COALESCE` turning its NULL sum into 0.",
      "",
      "The queue rule \"no order may skip ahead\" sounds procedural but is a **running total**: walking the queue in order, the store hands out units until an order no longer fits, and from then on every order waits, because the running total only grows. So an order is filled exactly when `SUM(units)` over its model's queue up to and including it is at most the stock. `order_id` breaks ties between orders placed in the same second, which makes the running total deterministic. In the example the Desert model has 6 units on launch day (the shipment of the 22nd is too late): orders 1 and 2 take 5, order 3 would bring the total to 7 and waits, and order 4 waits behind it even though its single unit would have fitted.",
      "",
      "Finally LEFT JOIN the queue onto the stock and aggregate per model with conditional sums; a model with no pre-orders gets one NULL queue row, whose CASE yields 0. The alternative recomputes the running total with correlated subqueries — correct, but quadratic in the queue length, while the window is one sorted pass per model.",
    ].join("\n"),
  },

  {
    slug: "apple-pay-rolling-seven-day-fraud-rate",
    title: "Apple: Apple Pay Rolling Seven-Day Fraud Rate",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Subqueries"],
    description: [
      "The Apple Pay risk team watches a smoothed fraud rate rather than noisy single days.",
      "",
      "For **every calendar day** from the earliest to the latest `txn_date` in the table — including days with no transactions — return `day`, `txns_7d` (transactions in the seven days ending that day, i.e. from `day − 6` to `day` inclusive) and `fraud_pct_7d`, the percentage of those transactions with `flagged_fraud = 1`, rounded to 2 decimal places. When the seven-day window holds no transactions, `fraud_pct_7d` is NULL. Order the rows by `day`.",
    ].join("\n"),
    tables: [
      {
        name: "PayTxn",
        columns: [
          { name: "txn_id", type: "int" },
          { name: "txn_date", type: "date" },
          { name: "amount_usd", type: "int" },
          { name: "flagged_fraud", type: "bool" },
        ],
        primaryKey: ["txn_id"],
        note: "One row per Apple Pay transaction; `flagged_fraud` is 1 when the transaction was later confirmed fraudulent.",
      },
    ],
    examples: [
      {
        PayTxn: [
          [1, "2025-03-01", 40, 0],
          [2, "2025-03-01", 900, 1],
          [3, "2025-03-02", 25, 0],
          [4, "2025-03-04", 60, 0],
          [5, "2025-03-04", 15, 0],
          [6, "2025-03-08", 300, 1],
          [7, "2025-03-17", 75, 0],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 25);
      const start = dateBetween(rng, "2025-03-01", "2025-03-10");
      const span = ri(rng, 0, 20);
      const rows: Cell[][] = seq(1, n).map((id) => [id, addDays(start, ri(rng, 0, span)), roundTo(rng, 5, 900, 5), chance(rng, 0.2) ? 1 : 0]);
      return { PayTxn: rows };
    },
    solution: [
      "WITH RECURSIVE calendar AS (",
      "  SELECT MIN(txn_date) AS day FROM PayTxn HAVING MIN(txn_date) IS NOT NULL",
      "  UNION ALL",
      "  SELECT DATE_ADD(day, INTERVAL 1 DAY) FROM calendar",
      "  WHERE day < (SELECT MAX(txn_date) FROM PayTxn)",
      "), daily AS (",
      "  SELECT c.day, COUNT(t.txn_id) AS txns, COALESCE(SUM(t.flagged_fraud), 0) AS frauds",
      "  FROM calendar c",
      "  LEFT JOIN PayTxn t ON t.txn_date = c.day",
      "  GROUP BY c.day",
      "), rolled AS (",
      "  SELECT day,",
      "         SUM(txns) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS txns_7d,",
      "         SUM(frauds) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS frauds_7d",
      "  FROM daily",
      ")",
      "SELECT day, txns_7d,",
      "       CASE WHEN txns_7d = 0 THEN NULL ELSE ROUND(100 * frauds_7d / txns_7d, 2) END AS fraud_pct_7d",
      "FROM rolled",
      "ORDER BY day",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE calendar AS (",
        "  SELECT MIN(txn_date) AS day FROM PayTxn HAVING COUNT(*) > 0",
        "  UNION ALL",
        "  SELECT DATE_ADD(day, INTERVAL 1 DAY) FROM calendar WHERE day < (SELECT MAX(txn_date) FROM PayTxn)",
        ")",
        "SELECT c.day,",
        "       (SELECT COUNT(*) FROM PayTxn t WHERE t.txn_date BETWEEN DATE_SUB(c.day, INTERVAL 6 DAY) AND c.day) AS txns_7d,",
        "       ROUND(100 * (SELECT SUM(t.flagged_fraud) FROM PayTxn t WHERE t.txn_date BETWEEN DATE_SUB(c.day, INTERVAL 6 DAY) AND c.day)",
        "             / NULLIF((SELECT COUNT(*) FROM PayTxn t WHERE t.txn_date BETWEEN DATE_SUB(c.day, INTERVAL 6 DAY) AND c.day), 0), 2) AS fraud_pct_7d",
        "FROM calendar c",
        "ORDER BY c.day",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Days with no transactions must still appear, so generate the calendar first — a recursive CTE from the earliest to the latest date.",
      "LEFT JOIN the transactions onto the calendar and aggregate per day.",
      "Once every day has exactly one row, `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` is exactly seven calendar days.",
      "Guard the division: an empty window gives NULL, not an error or 0.",
    ],
    editorial: [
      "A rolling seven-day window is only \"seven rows\" if there is one row per calendar day. The transactions have gaps, so the first step is a **date spine**: a recursive CTE that starts at `MIN(txn_date)` and adds a day with `DATE_ADD` until it reaches `MAX(txn_date)`. LEFT JOINing the transactions onto it and grouping per day gives every day its count and its fraud count — zero on quiet days.",
      "",
      "Over that gap-free daily table, `SUM(…) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)` adds the current day and the six before it: exactly the window `day − 6 … day`. Near the start the frame is simply shorter, which matches the definition because no transactions exist before the first day. A window over the raw transactions would be wrong twice: rows are transactions, not days, and gaps would stretch the window beyond a week.",
      "",
      "The rate is `100 × frauds / txns`, rounded to two places; after a quiet week the count is 0, and the CASE (or `NULLIF` in the alternative) yields NULL instead of dividing by zero. The alternative skips the window and counts each day's range with correlated subqueries — clearer, but each day rescans the transactions.",
    ].join("\n"),
  },
];
