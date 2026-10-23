import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, atTime, chance, dateBetween, names, pick, ri, roundTo, sample, shuffle } from "./kit.js";

/**
 * Paytm, as its analysts and data engineers meet it: Soundbox speakers at
 * kirana counters and the payment alerts they read out, mobile/DTH recharges
 * and bill payments, FASTag toll crossings, movie, train and flight tickets,
 * cashback campaigns and scratch cards, merchant loans repaid out of daily
 * settlements, Paytm Money SIPs, wallet KYC levels, EDC card machines and
 * digital gold. Every schema and every number here is invented for practice —
 * none of it is Paytm's own data or tables. Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
const pad = (n: number) => String(n).padStart(2, "0");
const msOf = (s: string) => Date.parse(`${s.replace(" ", "T")}Z`);
const dtOf = (ms: number) => new Date(ms).toISOString().slice(0, 19).replace("T", " ");
/** 'YYYY-MM-DD HH:MM:00' from a date and minutes after midnight (may run past midnight). */
const at = (date: string, minutes: number): string => dtOf(msOf(`${date} 00:00:00`) + minutes * 60_000);
/** A datetime plus `secs` seconds. */
const plusSecs = (stamp: string, secs: number): string => dtOf(msOf(stamp) + secs * 1000);
/** 'YYYY-MM-DD' of the given month index (0 = 2024-01) and day. */
const monthDay = (idx: number, day: number): string => `${2024 + Math.floor(idx / 12)}-${pad((idx % 12) + 1)}-${pad(day)}`;

const MOBILE_OPERATORS = ["Jio", "Airtel", "Vi", "BSNL"] as const;
const DTH_OPERATORS = ["Tata Play", "Airtel Digital TV", "Dish TV", "Sun Direct"] as const;
const SHOPS = [
  "Sharma General Store", "Balaji Medicals", "Annapurna Sweets", "Gupta Kirana", "Shree Ganesh Tea Stall",
  "Royal Mobile Point", "Krishna Dairy", "Om Sai Vegetables", "Lakshmi Textiles", "Raj Electronics",
  "Fresh Bakery", "Mehta Hardware",
] as const;
const TOWNS = ["Jaipur", "Pune", "Indore", "Lucknow", "Nagpur", "Kochi", "Surat", "Kanpur"] as const;
const PLAZAS = ["Kherki Daula", "Shahjahanpur", "Electronic City", "Vashi", "Paranur", "Lonavala", "Shamshabad", "Kiratpur"] as const;
const MOVIES = ["Monsoon Express", "Tiger Valley", "Chai Pe Charcha", "Last Over", "Neon Nights", "Kesari Dawn"] as const;
const FUNDS = ["Bluechip Equity Fund", "Midcap Growth Fund", "Liquid Fund", "Nifty Index Fund", "ELSS Tax Saver"] as const;
const AIRPORTS = ["DEL", "BOM", "BLR", "GOI", "HYD", "MAA", "CCU"] as const;
const LPG = ["Indane", "HP Gas", "Bharat Gas"] as const;
const STATE_CODES = ["MH12", "KA05", "DL8C", "TN09", "RJ14", "GJ01", "UP16"] as const;

export const COMPANY_PAYTM: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "paytm-failed-recharges-still-awaiting-a-refund",
    title: "Paytm: Failed Recharges Still Awaiting a Refund",
    difficulty: "EASY",
    topics: ["Basics"],
    description: [
      "The recharges operations desk promises that money for a failed mobile or DTH recharge goes back to the customer within 48 hours. Today is 2025-03-10, so any failure created **before 2025-03-08 00:00:00** that is still not refunded has broken the promise.",
      "",
      "Return every recharge whose `status` is `failed`, whose `refunded` flag is 0, and whose `created_at` is strictly before `2025-03-08 00:00:00`. Pending and successful recharges never qualify. Return the columns `recharge_id`, `user_id`, `operator` and `amount`, **ordered by `created_at`**, then by `recharge_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Recharge",
        columns: [
          { name: "recharge_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "operator", type: "varchar" },
          { name: "recharge_type", type: "enum", values: ["mobile", "dth"] },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["success", "failed", "pending"] },
          { name: "refunded", type: "bool" },
          { name: "created_at", type: "datetime" },
        ],
        primaryKey: ["recharge_id"],
        note: "One row per recharge attempt. `refunded` is 1 once the amount has gone back to the customer's wallet or bank.",
      },
    ],
    examples: [
      {
        Recharge: [
          [1, 11, "Jio", "mobile", 299, "failed", 0, "2025-03-06 21:14:05"],
          [2, 12, "Tata Play", "dth", 450, "failed", 1, "2025-03-05 09:30:00"],
          [3, 13, "Airtel", "mobile", 719, "pending", 0, "2025-03-04 18:02:44"],
          [4, 11, "Vi", "mobile", 155, "failed", 0, "2025-03-08 00:00:00"],
          [5, 14, "Dish TV", "dth", 350, "failed", 0, "2025-03-02 07:45:10"],
          [6, 15, "Jio", "mobile", 239, "success", 0, "2025-03-03 12:00:00"],
          [7, 16, "BSNL", "mobile", 107, "failed", 0, "2025-03-07 23:59:59"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 5, 18);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const dth = chance(rng, 0.3);
        const created = chance(rng, 0.15)
          ? pick(rng, ["2025-03-08 00:00:00", "2025-03-07 23:59:59", "2025-03-06 10:00:00"])
          : atTime(rng, dateBetween(rng, "2025-03-01", "2025-03-09"));
        return [
          id,
          ri(rng, 11, 22),
          dth ? pick(rng, DTH_OPERATORS) : pick(rng, MOBILE_OPERATORS),
          dth ? "dth" : "mobile",
          dth ? roundTo(rng, 150, 900, 50) : pick(rng, [155, 199, 239, 299, 349, 719]),
          pick(rng, ["failed", "failed", "failed", "success", "pending"]),
          chance(rng, 0.35) ? 1 : 0,
          created,
        ];
      });
      return { Recharge: rows };
    },
    solution: [
      "SELECT recharge_id, user_id, operator, amount",
      "FROM Recharge",
      "WHERE status = 'failed'",
      "  AND refunded = 0",
      "  AND created_at < '2025-03-08 00:00:00'",
      "ORDER BY created_at, recharge_id",
    ].join("\n"),
    alternatives: [
      "SELECT recharge_id, user_id, operator, amount FROM Recharge WHERE status IN ('failed') AND NOT refunded AND created_at <= '2025-03-07 23:59:59' ORDER BY created_at, recharge_id",
    ],
    ordered: true,
    hints: [
      "Three conditions must all hold: the status, the refund flag and the creation time.",
      "\"Before midnight on the 8th\" is a strict comparison — a failure at exactly `2025-03-08 00:00:00` is still inside the 48 hours.",
      "Sort by the time first; the id only breaks ties between two recharges created in the same second.",
    ],
    editorial: [
      "Each recharge either breaks the refund promise or it does not, so this is a filter on one table. The three conditions are joined with `AND`: the attempt failed (`status = 'failed'` — a pending recharge may still go through, so it is not owed anything yet), no refund has been recorded (`refunded = 0`), and it was created before the cut-off.",
      "",
      "The cut-off is strict: a recharge created at exactly `2025-03-08 00:00:00` is 48 hours old only at the end of today, so `<` and not `<=` is right. Datetimes stored as `YYYY-MM-DD HH:MM:SS` compare correctly as text, which is why the alternative can write the same bound as `<= '2025-03-07 23:59:59'` — the timestamps carry whole seconds, so both forms keep the same rows.",
      "",
      "The order is fixed by the statement, so the query ends with `ORDER BY created_at, recharge_id`; the id is the tie-breaker for two failures in the same second. An index on `(status, created_at)` lets the database read only failed attempts in the window.",
    ].join("\n"),
  },

  {
    slug: "paytm-soundbox-devices-that-never-announced-a-payment",
    title: "Paytm: Soundbox Devices That Never Announced a Payment",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "The Soundbox field team wants to visit every shop where the speaker was installed but has not read out a single payment — usually a SIM, power or pairing problem.",
      "",
      "Return every device that has **no row at all** in `PaymentAlert`, with the columns `device_id` and `merchant_name`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "SoundboxDevice",
        columns: [
          { name: "device_id", type: "int" },
          { name: "merchant_name", type: "varchar" },
          { name: "city", type: "varchar" },
          { name: "installed_on", type: "date" },
        ],
        primaryKey: ["device_id"],
        note: "One row per installed speaker; a merchant may have more than one.",
      },
      {
        name: "PaymentAlert",
        columns: [
          { name: "alert_id", type: "int" },
          { name: "device_id", type: "int" },
          { name: "paid_at", type: "datetime" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["alert_id"],
        note: "One row per payment the speaker announced. `device_id` always names an installed device.",
      },
    ],
    examples: [
      {
        SoundboxDevice: [
          [101, "Sharma General Store", "Jaipur", "2024-11-02"],
          [102, "Balaji Medicals", "Pune", "2024-11-15"],
          [103, "Annapurna Sweets", "Indore", "2024-12-01"],
          [104, "Gupta Kirana", "Lucknow", "2024-12-03"],
          [105, "Om Sai Vegetables", "Nagpur", "2024-12-09"],
        ],
        PaymentAlert: [
          [1, 101, "2024-12-10 09:15:00", 120],
          [2, 101, "2024-12-10 11:40:00", 45],
          [3, 103, "2024-12-11 18:05:00", 260],
          [4, 105, "2024-12-12 07:30:00", 30],
        ],
      },
    ],
    gen: (rng) => {
      const nDev = ri(rng, 1, 10);
      const shops = sample(rng, SHOPS, nDev);
      const devices: Cell[][] = shops.map((s, i) => [101 + i, s, pick(rng, TOWNS), dateBetween(rng, "2024-10-01", "2024-12-31")]);
      const active = chance(rng, 0.1) ? devices.length : ri(rng, 0, devices.length - 1);
      const live = sample(rng, devices.map((d) => d[0] as number), active);
      const nAlerts = live.length ? ri(rng, live.length, 20) : 0;
      const alerts: Cell[][] = seq(1, nAlerts).map((id, i) => [
        id,
        i < live.length ? live[i]! : pick(rng, live),
        atTime(rng, dateBetween(rng, "2025-01-01", "2025-01-31")),
        ri(rng, 10, 900),
      ]);
      return { SoundboxDevice: devices, PaymentAlert: shuffle(rng, alerts) };
    },
    solution: [
      "SELECT d.device_id, d.merchant_name",
      "FROM SoundboxDevice d",
      "LEFT JOIN PaymentAlert a ON a.device_id = d.device_id",
      "WHERE a.alert_id IS NULL",
    ].join("\n"),
    alternatives: [
      "SELECT device_id, merchant_name FROM SoundboxDevice d WHERE NOT EXISTS (SELECT 1 FROM PaymentAlert a WHERE a.device_id = d.device_id)",
      "SELECT device_id, merchant_name FROM SoundboxDevice WHERE device_id NOT IN (SELECT device_id FROM PaymentAlert)",
    ],
    hints: [
      "You need the devices that have no matching row in the other table — an anti join.",
      "A LEFT JOIN keeps every device; the ones without an alert get NULLs in the alert columns.",
      "`NOT EXISTS` with a correlated subquery says the same thing directly.",
    ],
    editorial: [
      "This is an **anti join**: keep the rows of one table that have no partner in another. The `LEFT JOIN` version keeps every device and attaches its alerts; a device with no alerts still appears once, with NULL in every `PaymentAlert` column. Filtering on `a.alert_id IS NULL` — the primary key, which is never NULL in a real alert — keeps exactly those silent devices. A device with several alerts produces several joined rows, but none of them pass the filter, so no duplicates reach the answer.",
      "",
      "`NOT EXISTS` states the rule more literally: for each device, look for any alert with its id and keep it only if there is none. `NOT IN` works here as well because `PaymentAlert.device_id` is never NULL; if it could be, a single NULL in the subquery would make `NOT IN` return no rows at all, which is why `NOT EXISTS` is the safer habit.",
      "",
      "With an index on `PaymentAlert.device_id`, each device costs one index probe.",
    ].join("\n"),
  },

  {
    slug: "paytm-merchant-qr-codes-on-the-old-paytm-handle",
    title: "Paytm: Merchant QR Codes Still on the Old @paytm Handle",
    difficulty: "EASY",
    topics: ["Strings"],
    description: [
      "Merchant QR codes are being moved from the old `@paytm` UPI handle to partner-bank handles such as `@ptys`, `@pthdfc`, `@ptsbi` and `@ptaxis`. The migration team needs the list of merchants still on the old one.",
      "",
      "A UPI ID has the form `username@handle` with exactly one `@`. Return every merchant whose handle is **exactly** `paytm`, with the columns `merchant_id`, `business_name` and `upi_username` (the part before the `@`). A NULL `upi_id` never qualifies, and the word `paytm` inside a username does not make it the old handle. Return the rows **ordered by `merchant_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "Merchant",
        columns: [
          { name: "merchant_id", type: "int" },
          { name: "business_name", type: "varchar" },
          { name: "upi_id", type: "varchar" },
        ],
        primaryKey: ["merchant_id"],
        note: "`upi_id` is the ID printed on the merchant's QR code, all lower case, or NULL while onboarding is incomplete.",
      },
    ],
    examples: [
      {
        Merchant: [
          [1, "Sharma General Store", "sharmagen@paytm"],
          [2, "Balaji Medicals", "paytm.balaji@pthdfc"],
          [3, "Annapurna Sweets", "paytmqr1x9k2@ptys"],
          [4, "Gupta Kirana", null],
          [5, "Krishna Dairy", "krishnadairy@paytm"],
          [6, "Raj Electronics", "rajelec.paytm@ptsbi"],
          [7, "Fresh Bakery", "9123456780@paytm"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 3, 14);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const shop = pick(rng, SHOPS);
        const base = shop.toLowerCase().replace(/[^a-z]/g, "").slice(0, 10);
        const user = pick(rng, [base, `${base}${ri(rng, 1, 99)}`, `paytm.${base}`, `${base}paytm`, String(ri(rng, 600000000, 999999999) + 9000000000), `paytmqr${ri(rng, 1000, 9999)}`]);
        const handle = pick(rng, ["paytm", "paytm", "ptys", "pthdfc", "ptsbi", "ptaxis"]);
        return [id, shop, chance(rng, 0.1) ? null : `${user}@${handle}`];
      });
      return { Merchant: rows };
    },
    solution: [
      "SELECT merchant_id, business_name, SUBSTRING_INDEX(upi_id, '@', 1) AS upi_username",
      "FROM Merchant",
      "WHERE SUBSTRING_INDEX(upi_id, '@', -1) = 'paytm'",
      "ORDER BY merchant_id",
    ].join("\n"),
    alternatives: [
      "SELECT merchant_id, business_name, LEFT(upi_id, LOCATE('@', upi_id) - 1) AS upi_username FROM Merchant WHERE upi_id LIKE '%@paytm' ORDER BY merchant_id",
      "SELECT merchant_id, business_name, SUBSTRING(upi_id, 1, CHAR_LENGTH(upi_id) - 6) AS upi_username FROM Merchant WHERE RIGHT(upi_id, 6) = '@paytm' ORDER BY merchant_id",
    ],
    ordered: true,
    hints: [
      "Split the UPI ID at the `@`: the handle is everything after it, the username everything before.",
      "`SUBSTRING_INDEX(s, '@', -1)` returns the part after the last `@`; with `1` it returns the part before the first.",
      "Testing `LIKE '%paytm%'` is wrong — `paytm.balaji@pthdfc` contains the word but is on a bank handle.",
    ],
    editorial: [
      "The question is about the **handle**, the part after the `@`, so the query has to split the string rather than search it. `SUBSTRING_INDEX(upi_id, '@', -1)` returns everything after the last `@` and `SUBSTRING_INDEX(upi_id, '@', 1)` everything before the first; with exactly one `@` they are the handle and the username. Comparing the handle with `= 'paytm'` keeps `sharmagen@paytm` and rejects `paytm.balaji@pthdfc`, whose username merely contains the word — the trap a `LIKE '%paytm%'` falls into.",
      "",
      "A NULL `upi_id` makes `SUBSTRING_INDEX` return NULL, and `NULL = 'paytm'` is not true, so merchants still onboarding drop out without a special case.",
      "",
      "The alternatives anchor the match at the end instead: `LIKE '%@paytm'` (the `@` in the pattern stops a handle like `ptpaytm` matching) with `LOCATE` to cut the username, or `RIGHT(upi_id, 6) = '@paytm'` with a length-based `SUBSTRING`. All of them read every row once; a leading wildcard cannot use an index, which is fine for a one-off migration list.",
    ].join("\n"),
  },

  {
    slug: "paytm-wallet-users-by-kyc-level-in-each-city",
    title: "Paytm: Wallet Users by KYC Level in Each City",
    difficulty: "EASY",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "A wallet with only minimum KYC has lower limits than one with full KYC, so the compliance team tracks how far each city has moved users up the ladder.",
      "",
      "For every city with at least one wallet user, return `city`, `users` (all its users), `full_kyc` (users at level `full`) and `min_kyc` (users at level `minimum`). Users at level `none` count only in `users`. A city with no user at some level shows 0 for it. Return the rows **ordered by `city`**.",
    ].join("\n"),
    tables: [
      {
        name: "WalletUser",
        columns: [
          { name: "user_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "kyc_level", type: "enum", values: ["none", "minimum", "full"] },
          { name: "joined_on", type: "date" },
        ],
        primaryKey: ["user_id"],
        note: "One row per wallet holder with their current KYC level.",
      },
    ],
    examples: [
      {
        WalletUser: [
          [1, "Lucknow", "full", "2023-04-11"],
          [2, "Lucknow", "minimum", "2024-01-20"],
          [3, "Lucknow", "minimum", "2024-06-02"],
          [4, "Indore", "none", "2024-09-15"],
          [5, "Indore", "full", "2022-12-30"],
          [6, "Kochi", "none", "2024-10-01"],
          [7, "Lucknow", "none", "2024-11-11"],
          [8, "Indore", "full", "2023-07-07"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 20);
      const cities = sample(rng, TOWNS, ri(rng, 1, 4));
      const rows: Cell[][] = seq(1, n).map((id) => [id, pick(rng, cities), pick(rng, ["none", "minimum", "minimum", "full", "full"]), dateBetween(rng, "2022-01-01", "2024-12-31")]);
      return { WalletUser: rows };
    },
    solution: [
      "SELECT city,",
      "       COUNT(*) AS users,",
      "       SUM(CASE WHEN kyc_level = 'full' THEN 1 ELSE 0 END) AS full_kyc,",
      "       SUM(CASE WHEN kyc_level = 'minimum' THEN 1 ELSE 0 END) AS min_kyc",
      "FROM WalletUser",
      "GROUP BY city",
      "ORDER BY city",
    ].join("\n"),
    alternatives: [
      "SELECT city, COUNT(user_id) AS users, COUNT(IF(kyc_level = 'full', 1, NULL)) AS full_kyc, COUNT(IF(kyc_level = 'minimum', 1, NULL)) AS min_kyc FROM WalletUser GROUP BY city ORDER BY city",
      "SELECT city, COUNT(*) AS users, SUM(kyc_level = 'full') AS full_kyc, SUM(kyc_level = 'minimum') AS min_kyc FROM WalletUser GROUP BY city ORDER BY city",
    ],
    ordered: true,
    hints: [
      "One row per city means `GROUP BY city`.",
      "To count only some rows of a group, add 1 for the rows you want and 0 for the rest.",
      "`COUNT(expression)` skips NULLs, so `COUNT(IF(cond, 1, NULL))` also counts only matching rows.",
    ],
    editorial: [
      "This is **conditional aggregation**: one pass over the table, grouped by city, with several counts that each look at a different subset of the group. `COUNT(*)` counts everyone. For the KYC levels, `SUM(CASE WHEN kyc_level = 'full' THEN 1 ELSE 0 END)` adds one per full-KYC user and nothing for the others — the `ELSE 0` is what makes a city with no full-KYC users show 0 rather than NULL.",
      "",
      "The alternatives are the same idea in other spellings: `COUNT(IF(cond, 1, NULL))` relies on `COUNT` ignoring NULLs, and in MySQL a comparison is itself 0 or 1, so `SUM(kyc_level = 'full')` adds the matches directly.",
      "",
      "Cities only appear if some user lives there, because groups are formed from rows; that is exactly what the statement asks. The query is one scan plus a grouping, and the final `ORDER BY city` fixes the order.",
    ].join("\n"),
  },

  {
    slug: "paytm-february-lpg-cylinder-bookings-by-gas-provider",
    title: "Paytm: February LPG Cylinder Bookings by Gas Provider",
    difficulty: "EASY",
    topics: ["Aggregation", "Dates"],
    description: [
      "Customers book cooking-gas cylinders from Indane, HP Gas and Bharat Gas through the app. The bill-payments team reviews each provider's month.",
      "",
      "For every provider with at least one **confirmed** booking made in **February 2025** (by `booked_at`), return `provider`, `bookings` (the number of such bookings) and `total_amount` (their amounts added up). Failed and refunded bookings do not count. Return the rows **ordered by `total_amount` descending**, then by `provider`.",
    ].join("\n"),
    tables: [
      {
        name: "LpgBooking",
        columns: [
          { name: "booking_id", type: "int" },
          { name: "consumer_no", type: "varchar" },
          { name: "provider", type: "enum", values: ["Indane", "HP Gas", "Bharat Gas"] },
          { name: "booked_at", type: "datetime" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["confirmed", "failed", "refunded"] },
        ],
        primaryKey: ["booking_id"],
        note: "One row per cylinder booking paid through the app; `consumer_no` is the household's gas connection number.",
      },
    ],
    examples: [
      {
        LpgBooking: [
          [1, "IN7781203", "Indane", "2025-02-03 09:12:40", 903, "confirmed"],
          [2, "HP4410921", "HP Gas", "2025-02-14 18:30:00", 905, "confirmed"],
          [3, "IN7781203", "Indane", "2025-01-31 23:59:59", 903, "confirmed"],
          [4, "BG2219034", "Bharat Gas", "2025-02-20 11:05:10", 902, "failed"],
          [5, "IN6630118", "Indane", "2025-02-28 23:10:00", 903, "confirmed"],
          [6, "HP4410921", "HP Gas", "2025-03-01 00:00:00", 905, "confirmed"],
          [7, "BG2219034", "Bharat Gas", "2025-02-21 08:00:00", 902, "refunded"],
          [8, "HP5501277", "HP Gas", "2025-02-09 07:45:00", 905, "confirmed"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 18);
      const price = pick(rng, [850, 900, 903]);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const p = pick(rng, LPG);
        const when = chance(rng, 0.15)
          ? pick(rng, ["2025-01-31 23:59:59", "2025-02-01 00:00:00", "2025-02-28 23:59:59", "2025-03-01 00:00:00"])
          : atTime(rng, dateBetween(rng, "2025-01-25", "2025-03-05"));
        return [id, `${p.slice(0, 2).toUpperCase()}${ri(rng, 1000000, 9999999)}`, p, when, chance(rng, 0.5) ? price : pick(rng, [850, 900, 903, 905]), pick(rng, ["confirmed", "confirmed", "confirmed", "failed", "refunded"])];
      });
      return { LpgBooking: rows };
    },
    solution: [
      "SELECT provider, COUNT(*) AS bookings, SUM(amount) AS total_amount",
      "FROM LpgBooking",
      "WHERE status = 'confirmed'",
      "  AND booked_at >= '2025-02-01 00:00:00'",
      "  AND booked_at < '2025-03-01 00:00:00'",
      "GROUP BY provider",
      "ORDER BY total_amount DESC, provider",
    ].join("\n"),
    alternatives: [
      "SELECT provider, COUNT(booking_id) AS bookings, SUM(amount) AS total_amount FROM LpgBooking WHERE status = 'confirmed' AND YEAR(booked_at) = 2025 AND MONTH(booked_at) = 2 GROUP BY provider ORDER BY total_amount DESC, provider",
      "SELECT provider, COUNT(*) AS bookings, SUM(amount) AS total_amount FROM LpgBooking WHERE status = 'confirmed' AND DATE_FORMAT(booked_at, '%Y-%m') = '2025-02' GROUP BY provider ORDER BY 3 DESC, 1",
    ],
    ordered: true,
    hints: [
      "Filter to confirmed bookings in February first, then group by provider.",
      "February is every moment from `2025-02-01 00:00:00` up to, but not including, `2025-03-01 00:00:00`.",
      "Two providers can reach the same total — the provider name breaks the tie.",
    ],
    editorial: [
      "Filter, then group. The `WHERE` clause keeps confirmed bookings made in February; `GROUP BY provider` then gives one row per provider, with `COUNT(*)` for the bookings and `SUM(amount)` for the money. A provider whose February bookings all failed loses every row in `WHERE`, so it forms no group and does not appear — as asked.",
      "",
      "The month test is a half-open range: `>= '2025-02-01 00:00:00'` and `< '2025-03-01 00:00:00'`. That keeps a booking at 23:59:59 on the 28th and rejects one at midnight on 1 March, and it can use an index on `booked_at`. `YEAR(...) = 2025 AND MONTH(...) = 2` or `DATE_FORMAT(booked_at, '%Y-%m') = '2025-02'` say the same thing more readably but wrap the column in a function, which prevents an index range scan.",
      "",
      "The order is total descending with the provider name as the tie-breaker, because cylinder prices are the same across many bookings and equal totals are common.",
    ].join("\n"),
  },

  {
    slug: "paytm-january-fastag-toll-spend-for-each-vehicle",
    title: "Paytm: January FASTag Toll Spend for Each Vehicle",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation", "Dates"],
    description: [
      "The FASTag team sends each vehicle owner a monthly toll statement.",
      "",
      "For every vehicle with at least one **debited** toll crossing in **January 2025** (by `crossed_at`), return `vehicle_no`, `crossings` (the number of such crossings) and `total_toll` (their toll added up). Declined crossings — the tag had too little balance — do not count. Return the rows **ordered by `total_toll` descending**, then by `vehicle_no`.",
    ].join("\n"),
    tables: [
      {
        name: "FastagTag",
        columns: [
          { name: "tag_id", type: "int" },
          { name: "vehicle_no", type: "varchar" },
          { name: "vehicle_class", type: "enum", values: ["car", "lcv", "bus", "truck"] },
        ],
        primaryKey: ["tag_id"],
        note: "One row per FASTag sticker; each `vehicle_no` has one tag.",
      },
      {
        name: "TollCrossing",
        columns: [
          { name: "crossing_id", type: "int" },
          { name: "tag_id", type: "int" },
          { name: "plaza", type: "varchar" },
          { name: "crossed_at", type: "datetime" },
          { name: "toll_amount", type: "int" },
          { name: "status", type: "enum", values: ["debited", "declined"] },
        ],
        primaryKey: ["crossing_id"],
        note: "One row per time a tag was read at a toll plaza. `tag_id` always names a tag.",
      },
    ],
    examples: [
      {
        FastagTag: [
          [1, "MH12AB1234", "car"],
          [2, "KA05MN4321", "truck"],
          [3, "DL8CAF0099", "car"],
          [4, "TN09BX7788", "bus"],
        ],
        TollCrossing: [
          [1, 1, "Lonavala", "2025-01-04 08:10:00", 320, "debited"],
          [2, 1, "Vashi", "2025-01-04 10:02:00", 40, "debited"],
          [3, 2, "Electronic City", "2025-01-15 02:30:00", 205, "debited"],
          [4, 2, "Paranur", "2025-01-31 23:55:00", 155, "debited"],
          [5, 3, "Kherki Daula", "2025-02-01 00:05:00", 80, "debited"],
          [6, 3, "Kherki Daula", "2025-01-20 19:00:00", 80, "declined"],
          [7, 4, "Paranur", "2024-12-31 23:50:00", 410, "debited"],
          [8, 1, "Lonavala", "2025-01-28 18:40:00", 320, "debited"],
        ],
      },
    ],
    gen: (rng) => {
      const nTags = ri(rng, 1, 6);
      const tags: Cell[][] = seq(1, nTags).map((id) => [id, `${pick(rng, STATE_CODES)}${String.fromCharCode(65 + ri(rng, 0, 25))}${String.fromCharCode(65 + ri(rng, 0, 25))}${ri(rng, 1000, 9999)}${id}`, pick(rng, ["car", "car", "lcv", "bus", "truck"])]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 20);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 1, nTags),
        pick(rng, PLAZAS),
        chance(rng, 0.15) ? pick(rng, ["2024-12-31 23:59:00", "2025-01-01 00:00:00", "2025-01-31 23:59:00", "2025-02-01 00:00:00"]) : atTime(rng, dateBetween(rng, "2024-12-25", "2025-02-05")),
        pick(rng, [40, 80, 95, 155, 205, 320]),
        chance(rng, 0.2) ? "declined" : "debited",
      ]);
      return { FastagTag: tags, TollCrossing: rows };
    },
    solution: [
      "SELECT t.vehicle_no, COUNT(*) AS crossings, SUM(c.toll_amount) AS total_toll",
      "FROM FastagTag t",
      "JOIN TollCrossing c ON c.tag_id = t.tag_id",
      "WHERE c.status = 'debited'",
      "  AND c.crossed_at >= '2025-01-01 00:00:00'",
      "  AND c.crossed_at < '2025-02-01 00:00:00'",
      "GROUP BY t.tag_id, t.vehicle_no",
      "ORDER BY total_toll DESC, t.vehicle_no",
    ].join("\n"),
    alternatives: [
      [
        "SELECT t.vehicle_no, s.crossings, s.total_toll",
        "FROM FastagTag t",
        "JOIN (SELECT tag_id, COUNT(*) AS crossings, SUM(toll_amount) AS total_toll FROM TollCrossing",
        "      WHERE status = 'debited' AND LEFT(crossed_at, 7) = '2025-01' GROUP BY tag_id) s ON s.tag_id = t.tag_id",
        "ORDER BY s.total_toll DESC, t.vehicle_no",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The vehicle number lives in `FastagTag`, the money in `TollCrossing` — join them on `tag_id`.",
      "Keep only debited crossings inside January before grouping.",
      "Crossings late on 31 December or just after midnight on 1 February are outside the month.",
    ],
    editorial: [
      "Join the tags to their crossings, filter, and group by vehicle. The `WHERE` clause keeps debited crossings whose `crossed_at` lies in `[2025-01-01 00:00:00, 2025-02-01 00:00:00)`; a declined read moved no money and a crossing on New Year's Eve belongs to December's statement. Grouping by the tag (and its vehicle number, so the column can be selected) then gives `COUNT(*)` crossings and `SUM(toll_amount)` per vehicle.",
      "",
      "Because the join is an inner join, a vehicle with no qualifying crossing has no rows left after the filter and is not listed — the statement only wants vehicles that were charged. The order is spend descending with `vehicle_no` breaking ties.",
      "",
      "The alternative aggregates `TollCrossing` first in a derived table — tested with `LEFT(crossed_at, 7) = '2025-01'` — and then joins the much smaller per-tag result to the tags. Both are a single scan of the crossings; pre-aggregating is the better habit when the dimension table is wide.",
    ].join("\n"),
  },

  {
    slug: "paytm-tatkal-train-bookings-made-in-the-first-five-minutes",
    title: "Paytm: Tatkal Train Bookings Made in the First Five Minutes",
    difficulty: "EASY",
    topics: ["Dates"],
    description: [
      "Tatkal train tickets go on sale at **10:00 on the day before the journey**, and the trains team measures how many of its users get a booking through in the first five minutes.",
      "",
      "Return every booking in the `tatkal` or `premium_tatkal` quota whose `booked_at` is on the day before its `journey_date`, at or after `10:00:00` and **before `10:05:00`**. Return the columns `booking_id`, `user_id` and `seconds_after_open` (seconds from 10:00:00 that day to `booked_at`), **ordered by `seconds_after_open`**, then by `booking_id`.",
    ].join("\n"),
    tables: [
      {
        name: "TrainBooking",
        columns: [
          { name: "booking_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "quota", type: "enum", values: ["general", "tatkal", "premium_tatkal"] },
          { name: "journey_date", type: "date" },
          { name: "booked_at", type: "datetime" },
        ],
        primaryKey: ["booking_id"],
        note: "One row per successful train booking made through the app.",
      },
    ],
    examples: [
      {
        TrainBooking: [
          [1, 21, "tatkal", "2025-04-12", "2025-04-11 10:00:07"],
          [2, 22, "tatkal", "2025-04-12", "2025-04-11 09:59:58"],
          [3, 23, "premium_tatkal", "2025-04-15", "2025-04-14 10:04:59"],
          [4, 24, "general", "2025-04-12", "2025-04-11 10:01:00"],
          [5, 25, "tatkal", "2025-04-15", "2025-04-14 10:05:00"],
          [6, 26, "tatkal", "2025-04-20", "2025-04-18 10:02:00"],
          [7, 27, "tatkal", "2025-05-01", "2025-04-30 10:00:07"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 4, 18);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const journey = dateBetween(rng, "2025-04-01", "2025-05-31");
        const dayBefore = addDays(journey, chance(rng, 0.8) ? -1 : pick(rng, [-2, 0, -3]));
        const offset = chance(rng, 0.2) ? pick(rng, [-1, 0, 299, 300, 7]) : ri(rng, -120, 420);
        return [id, ri(rng, 21, 32), pick(rng, ["tatkal", "tatkal", "premium_tatkal", "general"]), journey, plusSecs(`${dayBefore} 10:00:00`, offset)];
      });
      return { TrainBooking: rows };
    },
    solution: [
      "SELECT booking_id, user_id,",
      "       TIMESTAMPDIFF(SECOND, CONCAT(DATE_SUB(journey_date, INTERVAL 1 DAY), ' 10:00:00'), booked_at) AS seconds_after_open",
      "FROM TrainBooking",
      "WHERE quota IN ('tatkal', 'premium_tatkal')",
      "  AND booked_at >= CONCAT(DATE_SUB(journey_date, INTERVAL 1 DAY), ' 10:00:00')",
      "  AND booked_at < CONCAT(DATE_SUB(journey_date, INTERVAL 1 DAY), ' 10:05:00')",
      "ORDER BY seconds_after_open, booking_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT booking_id, user_id, MINUTE(booked_at) * 60 + SECOND(booked_at) AS seconds_after_open",
        "FROM TrainBooking",
        "WHERE quota <> 'general'",
        "  AND CAST(booked_at AS DATE) = DATE_SUB(journey_date, INTERVAL 1 DAY)",
        "  AND HOUR(booked_at) = 10 AND MINUTE(booked_at) < 5",
        "ORDER BY seconds_after_open, booking_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The opening moment depends on the row: it is 10:00:00 on `journey_date` minus one day.",
      "Build that moment as a datetime with `DATE_SUB` and `CONCAT`, then compare `booked_at` against it.",
      "Ten o'clock sharp counts; five past ten does not.",
    ],
    editorial: [
      "The window is different for every booking, so it has to be built from the row itself. `DATE_SUB(journey_date, INTERVAL 1 DAY)` is the sale day, and `CONCAT(..., ' 10:00:00')` turns it into the opening moment. A booking qualifies when `booked_at` is at or after that moment and strictly before the same day at `10:05:00` — the half-open range keeps 10:04:59 and rejects 10:05:00 exactly, and it also rejects a booking at 10:02 two days before the journey, which a test on the clock time alone would wrongly keep.",
      "",
      "`TIMESTAMPDIFF(SECOND, opening, booked_at)` gives the delay. The alternative splits the test differently: the calendar day of `booked_at` (`CAST(booked_at AS DATE)`) must be the sale day and the clock must read `10:00`–`10:04`, and then the delay is simply `MINUTE * 60 + SECOND`. Both handle a journey on the 1st of a month, whose sale day is the last day of the previous month, because the date arithmetic is calendar-aware.",
      "",
      "Order by the delay with the booking id as tie-breaker, as the statement fixes.",
    ].join("\n"),
  },

  {
    slug: "paytm-digital-gold-customers-holding-at-least-one-gram",
    title: "Paytm: Digital Gold Customers Holding at Least One Gram",
    difficulty: "EASY",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "Customers can buy and sell digital gold in tiny amounts; from one gram upward they may ask for physical delivery as a coin. The gold team wants the customers who already qualify.",
      "",
      "A customer's holding is the milligrams they **bought** minus the milligrams they **sold**. Return every customer whose holding is **at least 1000 mg**, with the columns `user_id` and `holding_mg`, **ordered by `holding_mg` descending**, then by `user_id`.",
    ].join("\n"),
    tables: [
      {
        name: "GoldTxn",
        columns: [
          { name: "txn_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "txn_type", type: "enum", values: ["buy", "sell"] },
          { name: "milligrams", type: "int" },
          { name: "txn_date", type: "date" },
        ],
        primaryKey: ["txn_id"],
        note: "One row per gold purchase or sale; `milligrams` is always positive, and a customer never sells more than they hold.",
      },
    ],
    examples: [
      {
        GoldTxn: [
          [1, 1, "buy", 800, "2025-01-03"],
          [2, 1, "buy", 400, "2025-01-17"],
          [3, 1, "sell", 200, "2025-02-01"],
          [4, 2, "buy", 2500, "2025-01-05"],
          [5, 2, "sell", 500, "2025-02-10"],
          [6, 3, "buy", 900, "2025-01-09"],
          [7, 4, "buy", 1500, "2025-01-12"],
          [8, 4, "sell", 1500, "2025-01-30"],
          [9, 5, "buy", 1200, "2025-02-14"],
        ],
      },
    ],
    gen: (rng) => {
      const users = ri(rng, 1, 7);
      const rows: Cell[][] = [];
      let id = 1;
      for (let u = 1; u <= users; u++) {
        let held = 0;
        let day = dateBetween(rng, "2025-01-01", "2025-01-20");
        const k = ri(rng, 1, 5);
        for (let j = 0; j < k; j++) {
          day = addDays(day, ri(rng, 1, 9));
          if (held > 0 && chance(rng, 0.35)) {
            const mg = chance(rng, 0.3) ? held : ri(rng, 1, held);
            held -= mg;
            rows.push([id++, u, "sell", mg, day]);
          } else {
            const mg = pick(rng, [100, 200, 250, 500, 800, 1000, 1200]);
            held += mg;
            rows.push([id++, u, "buy", mg, day]);
          }
        }
      }
      return { GoldTxn: shuffle(rng, rows) };
    },
    solution: [
      "SELECT user_id,",
      "       SUM(CASE WHEN txn_type = 'buy' THEN milligrams ELSE -milligrams END) AS holding_mg",
      "FROM GoldTxn",
      "GROUP BY user_id",
      "HAVING holding_mg >= 1000",
      "ORDER BY holding_mg DESC, user_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT user_id, holding_mg FROM (",
        "  SELECT user_id, SUM(IF(txn_type = 'buy', milligrams, 0)) - SUM(IF(txn_type = 'sell', milligrams, 0)) AS holding_mg",
        "  FROM GoldTxn GROUP BY user_id",
        ") h WHERE holding_mg >= 1000 ORDER BY holding_mg DESC, user_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Give each row a sign: a purchase adds, a sale subtracts.",
      "Sum the signed amounts per customer, then filter the groups — that filter belongs in HAVING.",
      "Exactly 1000 mg qualifies.",
    ],
    editorial: [
      "A holding is a **signed sum**: every purchase adds its milligrams and every sale takes them away. `CASE WHEN txn_type = 'buy' THEN milligrams ELSE -milligrams END` gives each row its sign, and `SUM` over the customer's rows is what they hold now. Because the condition is on the total and not on any one row, it goes in `HAVING`, after grouping; `WHERE` runs before the sum exists.",
      "",
      "The boundary is inclusive — exactly one gram is enough for a coin — so the test is `>= 1000`. A customer who bought and later sold everything sums to 0 and is left out; one who bought 900 mg is just short.",
      "",
      "The alternative adds purchases and sales in two separate conditional sums and subtracts them, filtering in an outer query instead of `HAVING`. Storing weights as whole milligrams keeps the arithmetic exact; summing grams as decimals could leave 0.9999999 where 1 was meant. Cost: one scan and one grouping.",
    ].join("\n"),
  },

  // ───────────────────────────── MEDIUM ─────────────────────────────
  {
    slug: "paytm-runner-up-movie-by-seats-sold-in-each-city",
    title: "Paytm: Runner-Up Movie by Seats Sold in Each City",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation", "Joins"],
    description: [
      "The movie-ticketing team already promotes each city's best-selling film; this week it wants to give the **runner-up** a banner too.",
      "",
      "Total each movie's seats per city over its **booked** bookings (cancelled ones never count). The runner-up total is the **second-highest distinct** total in the city; every movie with that total is a runner-up. Return one row for **every city that appears in `MovieBooking`**, with `city`, `runner_up_seats` and `runner_up_movies` (the runner-up movies' names in alphabetical order joined with `', '`). When a city has no second distinct total — one movie, movies tied at the top, or only cancelled bookings — both columns are NULL. Return the rows **ordered by `city`**.",
    ].join("\n"),
    tables: [
      {
        name: "MovieBooking",
        columns: [
          { name: "booking_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "movie", type: "varchar" },
          { name: "show_date", type: "date" },
          { name: "seats", type: "int" },
          { name: "status", type: "enum", values: ["booked", "cancelled"] },
        ],
        primaryKey: ["booking_id"],
        note: "One row per ticket order; `seats` is how many seats that order holds.",
      },
    ],
    examples: [
      {
        MovieBooking: [
          [1, "Mumbai", "Monsoon Express", "2025-03-07", 4, "booked"],
          [2, "Mumbai", "Monsoon Express", "2025-03-08", 5, "booked"],
          [3, "Mumbai", "Tiger Valley", "2025-03-07", 7, "booked"],
          [4, "Mumbai", "Last Over", "2025-03-08", 3, "booked"],
          [5, "Mumbai", "Last Over", "2025-03-09", 4, "booked"],
          [6, "Mumbai", "Neon Nights", "2025-03-08", 6, "booked"],
          [7, "Mumbai", "Neon Nights", "2025-03-09", 8, "cancelled"],
          [8, "Pune", "Chai Pe Charcha", "2025-03-07", 2, "booked"],
          [9, "Pune", "Last Over", "2025-03-08", 5, "booked"],
          [10, "Pune", "Neon Nights", "2025-03-09", 1, "booked"],
          [11, "Kochi", "Kesari Dawn", "2025-03-08", 4, "booked"],
          [12, "Indore", "Tiger Valley", "2025-03-07", 3, "booked"],
          [13, "Indore", "Last Over", "2025-03-07", 3, "booked"],
          [14, "Surat", "Tiger Valley", "2025-03-09", 6, "cancelled"],
        ],
      },
    ],
    gen: (rng) => {
      const cities = sample(rng, TOWNS, ri(rng, 1, 4));
      const n = ri(rng, 3, 24);
      const rows: Cell[][] = seq(1, n).map((id) => [id, pick(rng, cities), pick(rng, MOVIES), dateBetween(rng, "2025-03-07", "2025-03-09"), ri(rng, 1, 5), chance(rng, 0.2) ? "cancelled" : "booked"]);
      return { MovieBooking: rows };
    },
    solution: [
      "WITH totals AS (",
      "  SELECT city, movie, SUM(seats) AS seats_sold",
      "  FROM MovieBooking",
      "  WHERE status = 'booked'",
      "  GROUP BY city, movie",
      "), ranked AS (",
      "  SELECT city, movie, seats_sold,",
      "         DENSE_RANK() OVER (PARTITION BY city ORDER BY seats_sold DESC) AS pos",
      "  FROM totals",
      "), cities AS (",
      "  SELECT DISTINCT city FROM MovieBooking",
      ")",
      "SELECT c.city, MAX(r.seats_sold) AS runner_up_seats,",
      "       GROUP_CONCAT(r.movie ORDER BY r.movie SEPARATOR ', ') AS runner_up_movies",
      "FROM cities c",
      "LEFT JOIN ranked r ON r.city = c.city AND r.pos = 2",
      "GROUP BY c.city",
      "ORDER BY c.city",
    ].join("\n"),
    alternatives: [
      [
        "WITH totals AS (SELECT city, movie, SUM(seats) AS seats_sold FROM MovieBooking WHERE status = 'booked' GROUP BY city, movie),",
        "second AS (",
        "  SELECT a.city, MAX(a.seats_sold) AS s FROM totals a",
        "  WHERE a.seats_sold < (SELECT MAX(b.seats_sold) FROM totals b WHERE b.city = a.city)",
        "  GROUP BY a.city",
        ")",
        "SELECT c.city, s.s AS runner_up_seats,",
        "       (SELECT GROUP_CONCAT(t.movie ORDER BY t.movie SEPARATOR ', ') FROM totals t WHERE t.city = c.city AND t.seats_sold = s.s) AS runner_up_movies",
        "FROM (SELECT DISTINCT city FROM MovieBooking) c",
        "LEFT JOIN second s ON s.city = c.city",
        "ORDER BY c.city",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Total the booked seats per (city, movie) first.",
      "`DENSE_RANK()` gives tied totals the same rank and no gaps, so rank 2 is exactly the second-highest distinct total.",
      "Every city must appear: start from the list of cities and LEFT JOIN the rank-2 rows, so a city without one gets NULLs.",
      "`GROUP_CONCAT(movie ORDER BY movie SEPARATOR ', ')` folds tied runner-ups into one row.",
    ],
    editorial: [
      "First the totals: booked seats per (city, movie). Cancelled orders are filtered before summing, so Neon Nights' cancelled 8-seat order in Mumbai does not lift it.",
      "",
      "\"Second-highest distinct total\" is what `DENSE_RANK()` measures: equal totals share a rank and the next total gets the next integer. Mumbai's 9, 7, 7, 6 rank 1, 2, 2, 3, so both 7s are runner-ups. `RANK()` would give 1, 2, 2, 4 and would also work here, but for a tie at the top it gives 1, 1, 3 — no rank 2 although a second distinct total exists. `ROW_NUMBER()` would pick one tied movie arbitrarily.",
      "",
      "The NULL rows are the part that is easy to lose. Filtering `pos = 2` drops every city without a runner-up — Kochi (one movie), Indore (two movies tied at the top, so only one distinct total) and Surat (only a cancelled booking, so no totals at all). Starting from the distinct cities of the whole table and `LEFT JOIN`ing the rank-2 rows keeps them with NULLs, and grouping by city with `MAX` and an ordered `GROUP_CONCAT` folds the tied runner-ups into one line.",
      "",
      "The alternative finds the second distinct total as the largest total below the city's maximum, and lists its movies with a correlated `GROUP_CONCAT`.",
    ].join("\n"),
  },

  {
    slug: "paytm-users-who-paid-electricity-every-month-of-q1",
    title: "Paytm: Users Who Paid Electricity in Every Month of Q1 2025",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Dates", "Subqueries"],
    description: [
      "The bill-payments growth team wants to reward habitual users: people who paid their electricity bill through the app in **each** of January, February and March 2025.",
      "",
      "Return every user with at least one **successful** `electricity` payment in each of those three months (by `paid_at`), with the columns `user_id` and `total_paid` — the sum of their successful electricity payments in January–March 2025. Other categories and failed payments never count. Return the rows **ordered by `user_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "BillPayment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "category", type: "enum", values: ["electricity", "water", "gas", "broadband"] },
          { name: "paid_at", type: "datetime" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["success", "failed"] },
        ],
        primaryKey: ["payment_id"],
        note: "One row per bill payment attempt.",
      },
    ],
    examples: [
      {
        BillPayment: [
          [1, 1, "electricity", "2025-01-05 10:00:00", 1450, "success"],
          [2, 1, "electricity", "2025-02-06 09:20:00", 1320, "success"],
          [3, 1, "water", "2025-02-06 09:25:00", 300, "success"],
          [4, 1, "electricity", "2025-03-31 23:59:00", 1180, "success"],
          [5, 2, "electricity", "2025-01-10 12:00:00", 980, "success"],
          [6, 2, "electricity", "2025-02-11 12:00:00", 1010, "success"],
          [7, 2, "electricity", "2025-03-12 12:00:00", 990, "failed"],
          [8, 2, "electricity", "2025-04-01 08:00:00", 990, "success"],
          [9, 3, "electricity", "2025-01-02 08:00:00", 600, "success"],
          [10, 3, "electricity", "2025-01-29 08:00:00", 650, "success"],
          [11, 3, "electricity", "2025-02-27 08:00:00", 700, "success"],
          [12, 3, "electricity", "2025-03-28 08:00:00", 720, "success"],
          [13, 4, "electricity", "2024-12-31 21:00:00", 800, "success"],
          [14, 4, "electricity", "2025-02-15 21:00:00", 820, "success"],
          [15, 4, "electricity", "2025-03-15 21:00:00", 810, "success"],
          [16, 5, "gas", "2025-01-20 07:00:00", 500, "success"],
          [17, 5, "electricity", "2025-02-20 07:00:00", 900, "success"],
          [18, 5, "electricity", "2025-03-20 07:00:00", 905, "success"],
        ],
      },
    ],
    gen: (rng) => {
      const users = ri(rng, 1, 7);
      const rows: Cell[][] = [];
      let id = 1;
      const months = ["2024-12", "2025-01", "2025-02", "2025-03", "2025-04"];
      for (let u = 1; u <= users; u++) {
        const loyal = chance(rng, 0.45);
        for (const m of months) {
          const k = loyal && m >= "2025-01" && m <= "2025-03" ? ri(rng, 1, 2) : chance(rng, 0.5) ? 1 : 0;
          for (let j = 0; j < k; j++) {
            rows.push([id++, u, chance(rng, 0.85) ? "electricity" : pick(rng, ["water", "gas", "broadband"]), atTime(rng, `${m}-${pad(ri(rng, 1, 28))}`), roundTo(rng, 300, 2000, 10), chance(rng, 0.85) ? "success" : "failed"]);
          }
        }
        if (chance(rng, 0.15)) rows.push([id++, u, "electricity", pick(rng, ["2025-03-31 23:59:59", "2025-01-01 00:00:00", "2024-12-31 23:59:59", "2025-04-01 00:00:00"]), 500, "success"]);
      }
      return { BillPayment: shuffle(rng, rows) };
    },
    solution: [
      "SELECT user_id, SUM(amount) AS total_paid",
      "FROM BillPayment",
      "WHERE category = 'electricity'",
      "  AND status = 'success'",
      "  AND paid_at >= '2025-01-01 00:00:00'",
      "  AND paid_at < '2025-04-01 00:00:00'",
      "GROUP BY user_id",
      "HAVING COUNT(DISTINCT MONTH(paid_at)) = 3",
      "ORDER BY user_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT p.user_id, SUM(p.amount) AS total_paid",
        "FROM BillPayment p",
        "WHERE p.category = 'electricity' AND p.status = 'success' AND LEFT(p.paid_at, 7) IN ('2025-01', '2025-02', '2025-03')",
        "  AND EXISTS (SELECT 1 FROM BillPayment q WHERE q.user_id = p.user_id AND q.category = 'electricity' AND q.status = 'success' AND LEFT(q.paid_at, 7) = '2025-01')",
        "  AND EXISTS (SELECT 1 FROM BillPayment q WHERE q.user_id = p.user_id AND q.category = 'electricity' AND q.status = 'success' AND LEFT(q.paid_at, 7) = '2025-02')",
        "  AND EXISTS (SELECT 1 FROM BillPayment q WHERE q.user_id = p.user_id AND q.category = 'electricity' AND q.status = 'success' AND LEFT(q.paid_at, 7) = '2025-03')",
        "GROUP BY p.user_id",
        "ORDER BY p.user_id",
      ].join("\n"),
      [
        "SELECT user_id, SUM(amount) AS total_paid FROM BillPayment",
        "WHERE category = 'electricity' AND status = 'success' AND QUARTER(paid_at) = 1 AND YEAR(paid_at) = 2025",
        "GROUP BY user_id",
        "HAVING SUM(MONTH(paid_at) = 1) > 0 AND SUM(MONTH(paid_at) = 2) > 0 AND SUM(MONTH(paid_at) = 3) > 0",
        "ORDER BY user_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Restrict to successful electricity payments inside the quarter first.",
      "A user qualifies when their remaining payments cover three different months.",
      "Two payments in January are still one month — count distinct months.",
    ],
    editorial: [
      "This is a small **relational division**: keep the users whose payments cover *every* month of a set. Filter first — successful, electricity, and inside `[2025-01-01, 2025-04-01)` — so that a December or April payment, a water bill or a failed attempt cannot help anyone. Then group by user: `COUNT(DISTINCT MONTH(paid_at)) = 3` is true exactly when all three months are present, because only three months survive the filter. `DISTINCT` matters: user 3 paid twice in January and must not be counted as covering February that way.",
      "",
      "The same filtered rows give `total_paid` with `SUM(amount)`, so one grouping answers both parts.",
      "",
      "The alternatives spell the division out: three `EXISTS` subqueries, one per month, or three conditional sums in `HAVING`. They are longer but generalise to a set that is not \"all months in a range\". The grouping version is a single scan; an index on `(category, status, paid_at)` narrows it further.",
    ].join("\n"),
  },

  {
    slug: "paytm-days-loan-deductions-took-over-half-the-settlement",
    title: "Paytm: Days Loan Deductions Took Over Half a Merchant's Settlement",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation"],
    description: [
      "Merchant loans are repaid by deducting a slice of the merchant's daily settlement. The lending risk team flags days when the deductions left the shop with too little cash.",
      "",
      "A merchant may hold more than one loan, so several deductions can fall on one settlement day. Return every (merchant, day) where the **total deducted is strictly more than half** the day's `gross_amount`, with the columns `merchant_id`, `settle_date`, `gross_amount` and `deducted`. Exactly half is not flagged. Return the rows **ordered by `merchant_id`**, then `settle_date`.",
    ].join("\n"),
    tables: [
      {
        name: "Settlement",
        columns: [
          { name: "merchant_id", type: "int" },
          { name: "settle_date", type: "date" },
          { name: "gross_amount", type: "int" },
        ],
        primaryKey: ["merchant_id", "settle_date"],
        note: "One row per merchant per day the merchant was paid out: the day's collections before any deduction.",
      },
      {
        name: "LoanDeduction",
        columns: [
          { name: "deduction_id", type: "int" },
          { name: "merchant_id", type: "int" },
          { name: "loan_id", type: "int" },
          { name: "settle_date", type: "date" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["deduction_id"],
        note: "One row per loan instalment taken out of a settlement; every deduction falls on a day that has a `Settlement` row for the merchant.",
      },
    ],
    examples: [
      {
        Settlement: [
          [1, "2025-02-01", 10000],
          [1, "2025-02-02", 4000],
          [2, "2025-02-01", 6000],
          [2, "2025-02-02", 3000],
          [3, "2025-02-01", 8000],
        ],
        LoanDeduction: [
          [1, 1, 501, "2025-02-01", 3000],
          [2, 1, 501, "2025-02-02", 1500],
          [3, 1, 502, "2025-02-02", 1000],
          [4, 2, 503, "2025-02-01", 3000],
          [5, 2, 503, "2025-02-02", 1600],
          [6, 3, 504, "2025-02-01", 4100],
        ],
      },
    ],
    gen: (rng) => {
      const merchants = ri(rng, 1, 5);
      const settlements: Cell[][] = [];
      const deductions: Cell[][] = [];
      let did = 1;
      for (let m = 1; m <= merchants; m++) {
        const loans = seq(500 + m * 10, ri(rng, 1, 2));
        for (const d of sample(rng, ["2025-02-01", "2025-02-02", "2025-02-03", "2025-02-04"], ri(rng, 1, 4))) {
          const gross = roundTo(rng, 1000, 12000, 500);
          settlements.push([m, d, gross]);
          for (const loan of loans) {
            if (!chance(rng, 0.7)) continue;
            const amt = chance(rng, 0.2) ? gross / 2 / loans.length : roundTo(rng, 100, gross * 0.6, 100);
            deductions.push([did++, m, loan, d, amt]);
          }
        }
      }
      return { Settlement: settlements, LoanDeduction: shuffle(rng, deductions) };
    },
    solution: [
      "SELECT s.merchant_id, s.settle_date, s.gross_amount, SUM(d.amount) AS deducted",
      "FROM Settlement s",
      "JOIN LoanDeduction d ON d.merchant_id = s.merchant_id AND d.settle_date = s.settle_date",
      "GROUP BY s.merchant_id, s.settle_date, s.gross_amount",
      "HAVING SUM(d.amount) * 2 > s.gross_amount",
      "ORDER BY s.merchant_id, s.settle_date",
    ].join("\n"),
    alternatives: [
      [
        "SELECT s.merchant_id, s.settle_date, s.gross_amount, t.deducted",
        "FROM Settlement s",
        "JOIN (SELECT merchant_id, settle_date, SUM(amount) AS deducted FROM LoanDeduction GROUP BY merchant_id, settle_date) t",
        "  ON t.merchant_id = s.merchant_id AND t.settle_date = s.settle_date",
        "WHERE t.deducted > s.gross_amount / 2",
        "ORDER BY s.merchant_id, s.settle_date",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Add up the deductions per merchant and day before comparing — one loan's slice alone may look harmless.",
      "Match a deduction to its settlement on both the merchant and the date.",
      "\"Strictly more than half\": compare `deducted * 2 > gross_amount`, and exactly half stays out.",
    ],
    editorial: [
      "The comparison is between a day's settlement and the **total** of that day's deductions, so the deductions have to be summed per (merchant, day) first. Joining `Settlement` to `LoanDeduction` on both `merchant_id` and `settle_date` puts each deduction beside its day; grouping by the settlement's key and `SUM(d.amount)` gives the total. Merchant 1 on 2 February is the reason: neither 1,500 nor 1,000 is more than half of 4,000, but together they are.",
      "",
      "The condition is on an aggregate, so it goes in `HAVING`. Writing it as `SUM(d.amount) * 2 > s.gross_amount` keeps it in integers; `> s.gross_amount / 2` is the same test because MySQL's `/` is exact decimal division. Exactly half (merchant 2 on 1 February) is not strictly more and is not flagged. Days with no deduction never join and so are never flagged.",
      "",
      "The alternative sums the deductions in a derived table and joins the result to the settlements, filtering with `WHERE`. Both read each table once.",
    ].join("\n"),
  },

  {
    slug: "paytm-money-sips-that-bounced-twice-in-a-row",
    title: "Paytm Money: SIPs That Bounced Twice in a Row",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Joins"],
    description: [
      "On Paytm Money, a SIP instalment **bounces** when the bank mandate fails. Two bounces in a row usually mean the investor's account has a lasting problem, so the service team calls them.",
      "",
      "Instalments of a SIP are numbered 1, 2, 3, … with no gaps. Return every SIP with two **consecutive** instalments (numbers `n` and `n + 1`) that both bounced, with the columns `sip_id`, `investor_name`, `fund_name` and `streak_starts_at` — the smallest `n` where such a pair begins. A `skipped` instalment between two bounces breaks the run. Return the rows **ordered by `sip_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "Sip",
        columns: [
          { name: "sip_id", type: "int" },
          { name: "investor_name", type: "varchar" },
          { name: "fund_name", type: "varchar" },
          { name: "monthly_amount", type: "int" },
        ],
        primaryKey: ["sip_id"],
        note: "One row per systematic investment plan.",
      },
      {
        name: "SipInstalment",
        columns: [
          { name: "sip_id", type: "int" },
          { name: "instalment_no", type: "int" },
          { name: "due_date", type: "date" },
          { name: "status", type: "enum", values: ["paid", "bounced", "skipped"] },
        ],
        primaryKey: ["sip_id", "instalment_no"],
        note: "One row per monthly instalment; `skipped` means the investor paused that month on purpose.",
      },
    ],
    examples: [
      {
        Sip: [
          [1, "Aarav", "Bluechip Equity Fund", 1000],
          [2, "Diya", "Midcap Growth Fund", 500],
          [3, "Kabir", "Liquid Fund", 2000],
          [4, "Meera", "Nifty Index Fund", 1500],
        ],
        SipInstalment: [
          [1, 1, "2025-01-05", "paid"],
          [1, 2, "2025-02-05", "bounced"],
          [1, 3, "2025-03-05", "paid"],
          [1, 4, "2025-04-05", "bounced"],
          [2, 1, "2025-01-05", "paid"],
          [2, 2, "2025-02-05", "bounced"],
          [2, 3, "2025-03-05", "bounced"],
          [2, 4, "2025-04-05", "bounced"],
          [2, 5, "2025-05-05", "paid"],
          [3, 1, "2025-01-05", "bounced"],
          [3, 2, "2025-02-05", "skipped"],
          [3, 3, "2025-03-05", "bounced"],
          [4, 1, "2025-01-05", "bounced"],
          [4, 2, "2025-02-05", "bounced"],
          [4, 3, "2025-03-05", "paid"],
          [4, 4, "2025-04-05", "bounced"],
          [4, 5, "2025-05-05", "bounced"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 7);
      const who = names(rng, n);
      const sips: Cell[][] = seq(1, n).map((id, i) => [id, who[i]!, pick(rng, FUNDS), roundTo(rng, 500, 5000, 500)]);
      const inst: Cell[][] = [];
      for (let s = 1; s <= n; s++) {
        const k = ri(rng, 0, 9);
        const bounceP = pick(rng, [0.15, 0.35, 0.55]);
        for (let i = 1; i <= k; i++) inst.push([s, i, `2025-${pad(i)}-05`, chance(rng, bounceP) ? "bounced" : chance(rng, 0.15) ? "skipped" : "paid"]);
      }
      return { Sip: sips, SipInstalment: shuffle(rng, inst) };
    },
    solution: [
      "SELECT s.sip_id, s.investor_name, s.fund_name, MIN(a.instalment_no) AS streak_starts_at",
      "FROM Sip s",
      "JOIN SipInstalment a ON a.sip_id = s.sip_id AND a.status = 'bounced'",
      "JOIN SipInstalment b ON b.sip_id = a.sip_id AND b.instalment_no = a.instalment_no + 1 AND b.status = 'bounced'",
      "GROUP BY s.sip_id, s.investor_name, s.fund_name",
      "ORDER BY s.sip_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH seqd AS (",
        "  SELECT sip_id, instalment_no, status,",
        "         LEAD(status) OVER (PARTITION BY sip_id ORDER BY instalment_no) AS next_status",
        "  FROM SipInstalment",
        ")",
        "SELECT s.sip_id, s.investor_name, s.fund_name, MIN(q.instalment_no) AS streak_starts_at",
        "FROM seqd q JOIN Sip s ON s.sip_id = q.sip_id",
        "WHERE q.status = 'bounced' AND q.next_status = 'bounced'",
        "GROUP BY s.sip_id, s.investor_name, s.fund_name",
        "ORDER BY s.sip_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Pair each instalment with the next one of the same SIP.",
      "A self join on `b.instalment_no = a.instalment_no + 1` does it; so does `LEAD(status)`.",
      "Keep pairs where both are bounced, then take the smallest starting number per SIP.",
    ],
    editorial: [
      "\"Two in a row\" is a question about **neighbouring rows**, so each instalment has to be put beside the next one. Because the numbers have no gaps, the next instalment of `a` is the row `b` of the same SIP with `b.instalment_no = a.instalment_no + 1`. Joining `SipInstalment` to itself on that rule, and requiring both sides to be `bounced`, leaves exactly the pairs that make a streak. A skipped month sits between two bounces as its own row, so neither bounce has a bounced neighbour and Kabir's SIP is correctly left out.",
      "",
      "A SIP with a long run (Diya's 2-3-4) produces several pairs, and Meera has two separate runs; `MIN(a.instalment_no)` with `GROUP BY` collapses each SIP to one row and reports the first run's start.",
      "",
      "The alternative uses `LEAD(status) OVER (PARTITION BY sip_id ORDER BY instalment_no)` to read the next status without a join; it would also cope with gaps in the numbering. Both are linear with an index on `(sip_id, instalment_no)`.",
    ].join("\n"),
  },

  {
    slug: "paytm-scratch-cards-that-expired-unscratched",
    title: "Paytm: Scratch Cards That Expired Unscratched",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Conditional Logic", "Dates"],
    description: [
      "Cashback scratch cards must be scratched before they expire. The rewards team is studying users who let rewards lapse. The report date is **2025-04-01**.",
      "",
      "A card is **wasted** when it was never scratched (`scratched_on` is NULL) and its `expires_on` is **before 2025-04-01** — a card expiring on the report date is still valid. For every user with at least one wasted card, return `user_id`, `cards_received` (all their cards), `cards_wasted` and `value_wasted` (the rewards of the wasted cards). Return the rows **ordered by `value_wasted` descending**, then by `user_id`.",
    ].join("\n"),
    tables: [
      {
        name: "ScratchCard",
        columns: [
          { name: "card_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "issued_on", type: "date" },
          { name: "expires_on", type: "date" },
          { name: "scratched_on", type: "date" },
          { name: "reward", type: "int" },
        ],
        primaryKey: ["card_id"],
        note: "One row per scratch card issued after a payment. `scratched_on` is NULL until the user scratches it; `reward` is the cashback in rupees hidden under it.",
      },
    ],
    examples: [
      {
        ScratchCard: [
          [1, 1, "2025-03-01", "2025-03-15", null, 25],
          [2, 1, "2025-03-05", "2025-03-19", "2025-03-06", 10],
          [3, 1, "2025-03-20", "2025-04-03", null, 50],
          [4, 2, "2025-02-20", "2025-03-31", null, 40],
          [5, 2, "2025-03-01", "2025-04-01", null, 15],
          [6, 3, "2025-03-02", "2025-03-16", "2025-03-16", 30],
          [7, 4, "2025-02-10", "2025-02-24", null, 5],
          [8, 4, "2025-02-12", "2025-02-26", null, 20],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 2, 20);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const issued = dateBetween(rng, "2025-02-01", "2025-03-31");
        const expires = chance(rng, 0.1) ? pick(rng, ["2025-03-31", "2025-04-01"]) : addDays(issued, pick(rng, [7, 14, 30]));
        const scratched = chance(rng, 0.45) ? addDays(issued, ri(rng, 0, 5)) : null;
        return [id, ri(rng, 1, 6), issued, expires, scratched, pick(rng, [5, 10, 15, 20, 25, 40, 50])];
      });
      return { ScratchCard: rows };
    },
    solution: [
      "SELECT user_id,",
      "       COUNT(*) AS cards_received,",
      "       SUM(CASE WHEN scratched_on IS NULL AND expires_on < '2025-04-01' THEN 1 ELSE 0 END) AS cards_wasted,",
      "       SUM(CASE WHEN scratched_on IS NULL AND expires_on < '2025-04-01' THEN reward ELSE 0 END) AS value_wasted",
      "FROM ScratchCard",
      "GROUP BY user_id",
      "HAVING cards_wasted > 0",
      "ORDER BY value_wasted DESC, user_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.user_id, a.cards_received, w.cards_wasted, w.value_wasted",
        "FROM (SELECT user_id, COUNT(*) AS cards_received FROM ScratchCard GROUP BY user_id) a",
        "JOIN (SELECT user_id, COUNT(*) AS cards_wasted, SUM(reward) AS value_wasted FROM ScratchCard",
        "      WHERE scratched_on IS NULL AND DATEDIFF('2025-04-01', expires_on) > 0 GROUP BY user_id) w ON w.user_id = a.user_id",
        "ORDER BY w.value_wasted DESC, a.user_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Two different counts per user: all cards, and only the wasted ones — conditional aggregation.",
      "Wasted needs both conditions: never scratched *and* already expired on the report date.",
      "`scratched_on = NULL` is never true; use `IS NULL`.",
      "Filter users with no wasted card after grouping.",
    ],
    editorial: [
      "The report needs, per user, a count over *all* their cards and two figures over only the *wasted* ones, so a plain `WHERE` filter would lose `cards_received`. Conditional aggregation solves it in one grouping: `COUNT(*)` counts every card, while `SUM(CASE WHEN <wasted> THEN 1 ELSE 0 END)` and `SUM(CASE WHEN <wasted> THEN reward ELSE 0 END)` count and value only the wasted ones.",
      "",
      "The wasted test has two halves. `scratched_on IS NULL` — not `= NULL`, which is never true — means the reward was never claimed; `expires_on < '2025-04-01'` means it is already gone. A card expiring on the report day itself is still usable, so the comparison is strict, and an unscratched card that has not expired yet is merely pending. `HAVING cards_wasted > 0` then drops users who wasted nothing.",
      "",
      "The alternative computes the two halves in separate derived tables — all cards per user, and wasted cards per user — and joins them; the inner join drops users with no wasted card. One scan for the first query, two for the second.",
    ].join("\n"),
  },

  {
    slug: "paytm-busiest-day-for-each-card-machine",
    title: "Paytm: Busiest Day for Each EDC Card Machine",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation", "Dates"],
    description: [
      "EDC card machines at merchant counters take card swipes. The devices team sizes settlement capacity from each machine's busiest day.",
      "",
      "For every terminal with at least one **approved** swipe, find the calendar day with the highest total approved amount; if two days tie, take the **earlier** day. Declined swipes never count. Return `terminal_id`, `merchant_name`, `busiest_date` and `day_amount`, **ordered by `terminal_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "EdcTerminal",
        columns: [
          { name: "terminal_id", type: "int" },
          { name: "merchant_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["terminal_id"],
        note: "One row per card machine.",
      },
      {
        name: "CardSwipe",
        columns: [
          { name: "swipe_id", type: "int" },
          { name: "terminal_id", type: "int" },
          { name: "swiped_at", type: "datetime" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["approved", "declined"] },
        ],
        primaryKey: ["swipe_id"],
        note: "One row per card tap, dip or swipe; `terminal_id` always names a terminal.",
      },
    ],
    examples: [
      {
        EdcTerminal: [
          [1, "Lakshmi Textiles", "Surat"],
          [2, "Raj Electronics", "Kanpur"],
          [3, "Fresh Bakery", "Kochi"],
        ],
        CardSwipe: [
          [1, 1, "2025-03-01 11:00:00", 1200, "approved"],
          [2, 1, "2025-03-01 17:30:00", 800, "approved"],
          [3, 1, "2025-03-02 12:00:00", 2500, "declined"],
          [4, 1, "2025-03-02 13:00:00", 1500, "approved"],
          [5, 1, "2025-03-03 19:45:00", 2000, "approved"],
          [6, 2, "2025-03-02 16:00:00", 5000, "declined"],
          [7, 3, "2025-03-04 23:59:59", 700, "approved"],
          [8, 3, "2025-03-05 00:00:00", 300, "approved"],
        ],
      },
    ],
    gen: (rng) => {
      const nT = ri(rng, 1, 5);
      const terms: Cell[][] = sample(rng, SHOPS, nT).map((s, i) => [i + 1, s, pick(rng, TOWNS)]);
      const n = ri(rng, 1, 24);
      const rows: Cell[][] = seq(1, n).map((id) => [id, ri(rng, 1, nT), atTime(rng, dateBetween(rng, "2025-03-01", "2025-03-05")), roundTo(rng, 200, 2000, 200), chance(rng, 0.2) ? "declined" : "approved"]);
      return { EdcTerminal: terms, CardSwipe: rows };
    },
    solution: [
      "WITH daily AS (",
      "  SELECT terminal_id, CAST(swiped_at AS DATE) AS day, SUM(amount) AS day_amount",
      "  FROM CardSwipe",
      "  WHERE status = 'approved'",
      "  GROUP BY terminal_id, CAST(swiped_at AS DATE)",
      "), ranked AS (",
      "  SELECT terminal_id, day, day_amount,",
      "         ROW_NUMBER() OVER (PARTITION BY terminal_id ORDER BY day_amount DESC, day) AS rn",
      "  FROM daily",
      ")",
      "SELECT t.terminal_id, t.merchant_name, r.day AS busiest_date, r.day_amount",
      "FROM ranked r",
      "JOIN EdcTerminal t ON t.terminal_id = r.terminal_id",
      "WHERE r.rn = 1",
      "ORDER BY t.terminal_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH daily AS (SELECT terminal_id, LEFT(swiped_at, 10) AS day, SUM(amount) AS day_amount FROM CardSwipe WHERE status = 'approved' GROUP BY terminal_id, LEFT(swiped_at, 10))",
        "SELECT t.terminal_id, t.merchant_name, d.day AS busiest_date, d.day_amount",
        "FROM daily d JOIN EdcTerminal t ON t.terminal_id = d.terminal_id",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM daily e WHERE e.terminal_id = d.terminal_id",
        "    AND (e.day_amount > d.day_amount OR (e.day_amount = d.day_amount AND e.day < d.day))",
        ")",
        "ORDER BY t.terminal_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First total the approved amount per terminal per calendar day.",
      "`CAST(swiped_at AS DATE)` turns a timestamp into its day.",
      "Rank each terminal's days by amount descending and date ascending, and keep the first.",
    ],
    editorial: [
      "Two levels of grouping. First collapse swipes to (terminal, day) totals: filter to approved swipes, take the calendar day with `CAST(swiped_at AS DATE)` — a swipe at 23:59:59 belongs to that day, one at 00:00:00 to the next — and `SUM(amount)`.",
      "",
      "Then pick one day per terminal. `ROW_NUMBER() OVER (PARTITION BY terminal_id ORDER BY day_amount DESC, day)` numbers each terminal's days from the biggest down, with the earlier date first among equal totals, so `rn = 1` is exactly the requested day — Lakshmi Textiles' 1 March and 3 March both total 2,000 and the earlier wins. A terminal with only declined swipes has no daily rows and is not listed. Join the terminals at the end to fetch the merchant name.",
      "",
      "The alternative keeps a day when no other day of the same terminal beats it — more money, or the same money on an earlier date — using `NOT EXISTS` over the same daily totals. It is quadratic per terminal but needs no window functions.",
    ].join("\n"),
  },

  {
    slug: "paytm-flight-cancellation-refunds-under-the-free-window",
    title: "Paytm: Flight Cancellation Refunds Under the Free Window",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Dates", "Joins"],
    description: [
      "Flight bookings carry a **free cancellation window**: a ticket cancelled within 48 hours of booking is refunded in full, but only when the flight departs at least 7 days after the booking time. Any other cancellation is refunded the fare minus the airline's `cancellation_fee`, never below 0.",
      "",
      "For every cancelled booking (`cancelled_at` is not NULL), return `booking_id`, `airline_name`, `fare`, `refund_type` (`full` or `fee_deducted`) and `refund`. Both boundaries are inclusive: exactly 48 hours after booking and a departure exactly 7 days after booking still qualify. Return the rows **ordered by `booking_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "Airline",
        columns: [
          { name: "airline_code", type: "char" },
          { name: "airline_name", type: "varchar" },
          { name: "cancellation_fee", type: "int" },
        ],
        primaryKey: ["airline_code"],
        note: "One row per airline sold on the app, with its flat domestic cancellation fee in rupees.",
      },
      {
        name: "FlightBooking",
        columns: [
          { name: "booking_id", type: "int" },
          { name: "airline_code", type: "char" },
          { name: "booked_at", type: "datetime" },
          { name: "departs_at", type: "datetime" },
          { name: "fare", type: "int" },
          { name: "cancelled_at", type: "datetime" },
        ],
        primaryKey: ["booking_id"],
        note: "One row per ticket. `cancelled_at` is NULL for a ticket that was flown or is still live. Times are whole minutes.",
      },
    ],
    examples: [
      {
        Airline: [
          ["6E", "IndiGo", 3000],
          ["AI", "Air India", 3500],
          ["QP", "Akasa Air", 2500],
        ],
        FlightBooking: [
          [1, "6E", "2025-05-01 10:00:00", "2025-05-20 06:00:00", 5400, "2025-05-02 09:00:00"],
          [2, "6E", "2025-05-01 10:00:00", "2025-05-20 06:00:00", 5400, "2025-05-03 10:01:00"],
          [3, "AI", "2025-05-01 10:00:00", "2025-05-06 10:00:00", 6200, "2025-05-01 12:00:00"],
          [4, "AI", "2025-05-01 10:00:00", "2025-05-08 10:00:00", 4800, "2025-05-03 10:00:00"],
          [5, "QP", "2025-05-02 08:00:00", "2025-05-04 08:00:00", 2100, "2025-05-03 08:00:00"],
          [6, "QP", "2025-05-02 08:00:00", "2025-05-25 08:00:00", 3900, null],
        ],
      },
    ],
    gen: (rng) => {
      const airlines: Cell[][] = [["6E", "IndiGo", pick(rng, [2500, 3000])], ["AI", "Air India", pick(rng, [3000, 3500])], ["QP", "Akasa Air", pick(rng, [2000, 2500])]];
      const n = ri(rng, 2, 16);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const bookedDay = dateBetween(rng, "2025-05-01", "2025-05-10");
        const bookedMin = ri(rng, 6 * 60, 22 * 60);
        const booked = at(bookedDay, bookedMin);
        const departs = at(bookedDay, bookedMin + (chance(rng, 0.2) ? 7 * 1440 + pick(rng, [-1, 0, 1]) : ri(rng, 1, 25) * 1440 + ri(rng, -300, 300)));
        const cancelAfter = chance(rng, 0.2) ? 2880 + pick(rng, [-1, 0, 1]) : ri(rng, 30, 6000);
        const cancelled = chance(rng, 0.2) || cancelAfter >= msOf(departs) / 60000 - msOf(booked) / 60000 ? null : at(bookedDay, bookedMin + cancelAfter);
        return [id, pick(rng, ["6E", "AI", "QP"]), booked, departs, roundTo(rng, 1800, 9000, 100), cancelled];
      });
      return { Airline: airlines, FlightBooking: rows };
    },
    solution: [
      "SELECT b.booking_id, a.airline_name, b.fare,",
      "       CASE WHEN b.cancelled_at <= DATE_ADD(b.booked_at, INTERVAL 48 HOUR)",
      "             AND b.departs_at >= DATE_ADD(b.booked_at, INTERVAL 7 DAY) THEN 'full' ELSE 'fee_deducted' END AS refund_type,",
      "       CASE WHEN b.cancelled_at <= DATE_ADD(b.booked_at, INTERVAL 48 HOUR)",
      "             AND b.departs_at >= DATE_ADD(b.booked_at, INTERVAL 7 DAY) THEN b.fare",
      "            ELSE GREATEST(b.fare - a.cancellation_fee, 0) END AS refund",
      "FROM FlightBooking b",
      "JOIN Airline a ON a.airline_code = b.airline_code",
      "WHERE b.cancelled_at IS NOT NULL",
      "ORDER BY b.booking_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT booking_id, airline_name, fare, IF(free, 'full', 'fee_deducted') AS refund_type, IF(free, fare, IF(fare > cancellation_fee, fare - cancellation_fee, 0)) AS refund",
        "FROM (",
        "  SELECT b.booking_id, a.airline_name, b.fare, a.cancellation_fee,",
        "         TIMESTAMPDIFF(MINUTE, b.booked_at, b.cancelled_at) <= 2880 AND TIMESTAMPDIFF(MINUTE, b.booked_at, b.departs_at) >= 10080 AS free",
        "  FROM FlightBooking b JOIN Airline a ON a.airline_code = b.airline_code",
        "  WHERE b.cancelled_at IS NOT NULL",
        ") x",
        "ORDER BY booking_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Write the free-window test once in words: cancelled no later than booking + 48 hours, and departing no earlier than booking + 7 days.",
      "`DATE_ADD(booked_at, INTERVAL 48 HOUR)` builds the first limit; the second is the same with `INTERVAL 7 DAY`.",
      "`GREATEST(fare - fee, 0)` keeps a refund from going negative when the fee is larger than a cheap fare.",
    ],
    editorial: [
      "Every cancelled booking gets one of two refunds, decided by a single condition, so the core of the query is a `CASE`. The free window has two parts that must both hold: the cancellation came no later than 48 hours after booking (`cancelled_at <= DATE_ADD(booked_at, INTERVAL 48 HOUR)`) and the flight leaves no earlier than 7 days after booking (`departs_at >= DATE_ADD(booked_at, INTERVAL 7 DAY)`). Both comparisons are inclusive, which is why booking 4 — exactly 48 hours and exactly 7 days — gets its whole fare back, while booking 2, one minute late, does not.",
      "",
      "Outside the window the refund is the fare less the airline's fee, joined from `Airline`. `GREATEST(fare - fee, 0)` stops a cheap fare from producing a negative refund (booking 5). Bookings never cancelled are filtered out with `cancelled_at IS NOT NULL`.",
      "",
      "The alternative computes the condition once as a 0/1 column with `TIMESTAMPDIFF(MINUTE, …)` (2,880 minutes and 10,080 minutes) in a derived table and reuses it with `IF`. With whole-minute timestamps the two forms agree exactly.",
    ].join("\n"),
  },

  {
    slug: "paytm-mobile-numbers-that-switched-operator-between-recharges",
    title: "Paytm: Mobile Numbers That Switched Operator Between Recharges",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Subqueries"],
    description: [
      "When a customer ports a number to another network, their next recharge on the app goes to a different operator. The recharges team tracks these switches to keep operator detection accurate.",
      "",
      "Return every mobile number whose **latest** recharge was with a different operator from its **first** recharge, with the columns `mobile_no`, `first_operator` and `latest_operator`. A number that left and came back to the same operator is not a switch, and a number with one recharge cannot have switched. No number has two recharges at the same moment. Return the rows **ordered by `mobile_no`**.",
    ].join("\n"),
    tables: [
      {
        name: "PrepaidRecharge",
        columns: [
          { name: "recharge_id", type: "int" },
          { name: "mobile_no", type: "bigint" },
          { name: "operator", type: "enum", values: ["Jio", "Airtel", "Vi", "BSNL"] },
          { name: "recharged_at", type: "datetime" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["recharge_id"],
        note: "One row per successful prepaid recharge; `operator` is the network the recharge was sent to.",
      },
    ],
    examples: [
      {
        PrepaidRecharge: [
          [1, 9810000001, "Airtel", "2025-01-03 10:00:00", 299],
          [2, 9810000001, "Airtel", "2025-02-02 10:00:00", 299],
          [3, 9810000001, "Jio", "2025-03-04 09:00:00", 349],
          [4, 9810000002, "Vi", "2025-01-10 08:00:00", 199],
          [5, 9810000002, "Jio", "2025-02-11 08:00:00", 239],
          [6, 9810000002, "Vi", "2025-03-12 08:00:00", 199],
          [7, 9810000003, "Jio", "2025-01-15 20:00:00", 719],
          [8, 9810000004, "BSNL", "2025-01-20 07:30:00", 107],
          [9, 9810000004, "Airtel", "2025-02-25 07:30:00", 299],
          [10, 9810000005, "Jio", "2025-01-05 12:00:00", 239],
          [11, 9810000005, "Jio", "2025-02-05 12:00:00", 239],
        ],
      },
    ],
    gen: (rng) => {
      const nums = ri(rng, 1, 7);
      const rows: Cell[][] = [];
      let id = 1;
      for (let i = 0; i < nums; i++) {
        const mobile = 9810000001 + i * 7 + ri(rng, 0, 5);
        let op = pick(rng, MOBILE_OPERATORS);
        const k = ri(rng, 1, 5);
        const days = sample(rng, seq(0, 80), k).sort((a, b) => a - b);
        for (const d of days) {
          if (chance(rng, 0.3)) op = pick(rng, MOBILE_OPERATORS);
          rows.push([id++, mobile, op, atTime(rng, addDays("2025-01-01", d)), pick(rng, [107, 199, 239, 299, 349, 719])]);
        }
      }
      return { PrepaidRecharge: shuffle(rng, rows) };
    },
    solution: [
      "WITH ordered_r AS (",
      "  SELECT mobile_no, operator,",
      "         ROW_NUMBER() OVER (PARTITION BY mobile_no ORDER BY recharged_at) AS from_start,",
      "         ROW_NUMBER() OVER (PARTITION BY mobile_no ORDER BY recharged_at DESC) AS from_end",
      "  FROM PrepaidRecharge",
      ")",
      "SELECT f.mobile_no, f.operator AS first_operator, l.operator AS latest_operator",
      "FROM ordered_r f",
      "JOIN ordered_r l ON l.mobile_no = f.mobile_no AND l.from_end = 1",
      "WHERE f.from_start = 1 AND f.operator <> l.operator",
      "ORDER BY f.mobile_no",
    ].join("\n"),
    alternatives: [
      [
        "SELECT mobile_no, first_operator, latest_operator FROM (",
        "  SELECT p.mobile_no,",
        "         (SELECT a.operator FROM PrepaidRecharge a WHERE a.mobile_no = p.mobile_no ORDER BY a.recharged_at LIMIT 1) AS first_operator,",
        "         (SELECT b.operator FROM PrepaidRecharge b WHERE b.mobile_no = p.mobile_no ORDER BY b.recharged_at DESC LIMIT 1) AS latest_operator",
        "  FROM (SELECT DISTINCT mobile_no FROM PrepaidRecharge) p",
        ") x WHERE first_operator <> latest_operator ORDER BY mobile_no",
      ].join("\n"),
      [
        "SELECT DISTINCT mobile_no, first_operator, latest_operator FROM (",
        "  SELECT mobile_no,",
        "         FIRST_VALUE(operator) OVER (PARTITION BY mobile_no ORDER BY recharged_at ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS first_operator,",
        "         LAST_VALUE(operator) OVER (PARTITION BY mobile_no ORDER BY recharged_at ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS latest_operator",
        "  FROM PrepaidRecharge",
        ") x WHERE first_operator <> latest_operator ORDER BY mobile_no",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "You need two specific rows per number: its earliest recharge and its latest.",
      "Number each number's recharges from the start and from the end with `ROW_NUMBER()`.",
      "Only the endpoints matter — what happened in between does not.",
    ],
    editorial: [
      "The question only looks at two rows per number: the first recharge and the latest. Numbering the rows twice does it cleanly — `ROW_NUMBER()` ordered by `recharged_at` ascending marks the first with 1, and ordered descending marks the latest with 1. Joining the \"first\" row to the \"latest\" row of the same number and keeping pairs whose operators differ gives the switches.",
      "",
      "Only the endpoints count: number 2 went Vi → Jio → Vi, so its first and latest operators are both Vi and it is not reported. A number with one recharge is its own first and latest row, so the operators are equal and it drops out with no special case.",
      "",
      "The alternatives fetch the endpoints differently: correlated subqueries with `ORDER BY … LIMIT 1` per number, or `FIRST_VALUE`/`LAST_VALUE` over a frame covering the whole partition (the explicit `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` matters — the default frame ends at the current row, which would make `LAST_VALUE` return the current operator). All are a sort per number.",
    ].join("\n"),
  },

  {
    slug: "paytm-cashback-paid-above-the-campaign-cap",
    title: "Paytm: Cashback Paid Above the Per-User Campaign Cap",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation"],
    description: [
      "Every cashback campaign has a per-user cap, but a bug or a race between two payments can credit someone more. The rewards finance team audits the leakage.",
      "",
      "For each (user, campaign), add up the **credited** cashback (reversed rows were clawed back and do not count). Return every pair whose credited total is **strictly greater** than the campaign's `per_user_cap`, with the columns `user_id`, `campaign_code`, `credited_total`, `per_user_cap` and `excess` (total minus cap). Return the rows **ordered by `excess` descending**, then `user_id`, then `campaign_code`.",
    ].join("\n"),
    tables: [
      {
        name: "Campaign",
        columns: [
          { name: "campaign_code", type: "varchar" },
          { name: "title", type: "varchar" },
          { name: "per_user_cap", type: "int" },
        ],
        primaryKey: ["campaign_code"],
        note: "One row per cashback offer; `per_user_cap` is the most one user may earn from it, in rupees.",
      },
      {
        name: "Cashback",
        columns: [
          { name: "cashback_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "campaign_code", type: "varchar" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["credited", "reversed"] },
        ],
        primaryKey: ["cashback_id"],
        note: "One row per cashback credit; `campaign_code` always names a campaign.",
      },
    ],
    examples: [
      {
        Campaign: [
          ["HOLI50", "Holi bill-pay offer", 50],
          ["MOVIE100", "Movie Fridays", 100],
          ["FASTAG25", "FASTag recharge offer", 25],
        ],
        Cashback: [
          [1, 1, "HOLI50", 30, "credited"],
          [2, 1, "HOLI50", 30, "credited"],
          [3, 1, "MOVIE100", 100, "credited"],
          [4, 2, "HOLI50", 40, "credited"],
          [5, 2, "HOLI50", 40, "reversed"],
          [6, 2, "FASTAG25", 20, "credited"],
          [7, 2, "FASTAG25", 10, "credited"],
          [8, 3, "MOVIE100", 75, "credited"],
          [9, 3, "MOVIE100", 75, "credited"],
        ],
      },
    ],
    gen: (rng) => {
      const campaigns: Cell[][] = [["HOLI50", "Holi bill-pay offer", 50], ["MOVIE100", "Movie Fridays", 100], ["FASTAG25", "FASTag recharge offer", 25], ["GOLD75", "Gold savings offer", 75]];
      const n = ri(rng, 2, 22);
      const rows: Cell[][] = seq(1, n).map((id) => [id, ri(rng, 1, 6), pick(rng, campaigns)[0]!, pick(rng, [10, 20, 25, 30, 40, 50, 75]), chance(rng, 0.2) ? "reversed" : "credited"]);
      return { Campaign: campaigns, Cashback: rows };
    },
    solution: [
      "SELECT c.user_id, c.campaign_code, SUM(c.amount) AS credited_total, p.per_user_cap,",
      "       SUM(c.amount) - p.per_user_cap AS excess",
      "FROM Cashback c",
      "JOIN Campaign p ON p.campaign_code = c.campaign_code",
      "WHERE c.status = 'credited'",
      "GROUP BY c.user_id, c.campaign_code, p.per_user_cap",
      "HAVING SUM(c.amount) > p.per_user_cap",
      "ORDER BY excess DESC, c.user_id, c.campaign_code",
    ].join("\n"),
    alternatives: [
      [
        "WITH totals AS (SELECT user_id, campaign_code, SUM(amount) AS credited_total FROM Cashback WHERE status = 'credited' GROUP BY user_id, campaign_code)",
        "SELECT t.user_id, t.campaign_code, t.credited_total, p.per_user_cap, t.credited_total - p.per_user_cap AS excess",
        "FROM totals t JOIN Campaign p ON p.campaign_code = t.campaign_code",
        "WHERE t.credited_total > p.per_user_cap",
        "ORDER BY excess DESC, t.user_id, t.campaign_code",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Total the credited cashback per user and campaign before comparing with the cap.",
      "Reversed rows must be filtered out before the sum, not after.",
      "Bring the cap in with a join; a total exactly equal to the cap is not a leak.",
    ],
    editorial: [
      "The cap applies to what one user earned from one campaign, so the unit of the answer is the (user, campaign) pair. Filter to credited rows, group by the pair, and `SUM(amount)` gives what was actually paid; a reversal took its money back, so it must not be added (user 2's Holi credits net to 40 once the reversed row is excluded).",
      "",
      "Joining `Campaign` brings in `per_user_cap`. Because it is constant within a group it can be listed in `GROUP BY` and selected. The comparison is on an aggregate, so it goes in `HAVING SUM(c.amount) > p.per_user_cap` — strictly greater, which leaves user 1's 100 on a 100 cap out. `excess` is the same difference, and the order is excess descending with the user and campaign as tie-breakers.",
      "",
      "The alternative aggregates in a CTE first and joins the much smaller totals to the campaigns, filtering with `WHERE`. Both scan `Cashback` once.",
    ].join("\n"),
  },

  {
    slug: "paytm-merchant-days-when-qr-collections-fell-by-half",
    title: "Paytm: Merchant Days When QR Collections Fell by More Than Half",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation", "Dates"],
    description: [
      "A sudden fall in a shop's QR collections often means a broken Soundbox or a scanner taped over, so the merchant-success team calls the shop.",
      "",
      "A merchant's **collection** on a day is the sum of its successful payments that day; only days with at least one successful payment count as collection days. Compare each collection day with the merchant's **previous collection day** (not necessarily the calendar day before). Return the days whose collection is **strictly less than half** of the previous one, with `merchant_id`, `collection_date`, `collection` and `previous_collection`. A merchant's first collection day is never returned. Return the rows **ordered by `merchant_id`**, then `collection_date`.",
    ].join("\n"),
    tables: [
      {
        name: "QrPayment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "merchant_id", type: "int" },
          { name: "paid_at", type: "datetime" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["success", "failed"] },
        ],
        primaryKey: ["payment_id"],
        note: "One row per customer payment to a merchant's QR code.",
      },
    ],
    examples: [
      {
        QrPayment: [
          [1, 1, "2025-03-01 09:00:00", 1000, "success"],
          [2, 1, "2025-03-01 18:00:00", 600, "success"],
          [3, 1, "2025-03-02 11:00:00", 900, "success"],
          [4, 1, "2025-03-04 10:30:00", 400, "success"],
          [5, 1, "2025-03-05 12:00:00", 200, "success"],
          [6, 2, "2025-03-01 13:00:00", 3000, "success"],
          [7, 2, "2025-03-02 13:00:00", 5000, "failed"],
          [8, 2, "2025-03-03 13:00:00", 1000, "success"],
          [9, 3, "2025-03-02 08:00:00", 500, "success"],
        ],
      },
    ],
    gen: (rng) => {
      const merchants = ri(rng, 1, 4);
      const rows: Cell[][] = [];
      let id = 1;
      for (let m = 1; m <= merchants; m++) {
        for (const d of sample(rng, ["2025-03-01", "2025-03-02", "2025-03-03", "2025-03-04", "2025-03-05", "2025-03-06"], ri(rng, 1, 6))) {
          const k = ri(rng, 1, 3);
          for (let j = 0; j < k; j++) rows.push([id++, m, atTime(rng, d), pick(rng, [100, 200, 250, 400, 500, 1000, 2000]), chance(rng, 0.15) ? "failed" : "success"]);
        }
      }
      return { QrPayment: shuffle(rng, rows) };
    },
    solution: [
      "WITH daily AS (",
      "  SELECT merchant_id, CAST(paid_at AS DATE) AS collection_date, SUM(amount) AS collection",
      "  FROM QrPayment",
      "  WHERE status = 'success'",
      "  GROUP BY merchant_id, CAST(paid_at AS DATE)",
      "), compared AS (",
      "  SELECT merchant_id, collection_date, collection,",
      "         LAG(collection) OVER (PARTITION BY merchant_id ORDER BY collection_date) AS previous_collection",
      "  FROM daily",
      ")",
      "SELECT merchant_id, collection_date, collection, previous_collection",
      "FROM compared",
      "WHERE collection * 2 < previous_collection",
      "ORDER BY merchant_id, collection_date",
    ].join("\n"),
    alternatives: [
      [
        "WITH daily AS (SELECT merchant_id, LEFT(paid_at, 10) AS collection_date, SUM(amount) AS collection FROM QrPayment WHERE status = 'success' GROUP BY merchant_id, LEFT(paid_at, 10))",
        "SELECT cur.merchant_id, cur.collection_date, cur.collection, prev.collection AS previous_collection",
        "FROM daily cur",
        "JOIN daily prev ON prev.merchant_id = cur.merchant_id",
        " AND prev.collection_date = (SELECT MAX(x.collection_date) FROM daily x WHERE x.merchant_id = cur.merchant_id AND x.collection_date < cur.collection_date)",
        "WHERE cur.collection < prev.collection / 2",
        "ORDER BY cur.merchant_id, cur.collection_date",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Build the daily collections first; failed payments and days with no success are not collection days.",
      "`LAG()` over each merchant's days in date order reads the previous collection day.",
      "A first day has no previous value — the comparison with NULL removes it on its own.",
    ],
    editorial: [
      "Start by turning payments into **collection days**: keep successful payments, group by merchant and calendar day (`CAST(paid_at AS DATE)`), and sum. A day whose only payment failed — merchant 2 on 2 March — produces no row, so it can never be anyone's \"previous day\".",
      "",
      "Then compare each day with the one before it in the same merchant's list. `LAG(collection) OVER (PARTITION BY merchant_id ORDER BY collection_date)` reads the previous collection day's total, however many calendar days back it is — merchant 1's 4 March is compared with 2 March. The test `collection * 2 < previous_collection` is \"strictly less than half\" in integers: 200 against 400 is exactly half and is not reported. On a merchant's first day `LAG` returns NULL, the comparison is unknown, and the row is filtered out without a special case.",
      "",
      "The alternative finds the previous day with a correlated `MAX(collection_date)` below the current one and joins back to its total. It is quadratic per merchant; the window version is one sort.",
    ].join("\n"),
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "paytm-gold-buyers-whose-weighted-cost-beat-the-simple-average",
    title: "Paytm: Gold Buyers Whose Weighted Cost Beat the Simple Average",
    difficulty: "HARD",
    topics: ["Joins", "Aggregation", "Dates"],
    description: [
      "Digital gold is bought at the day's published rate. The gold team wants to show customers who bought more on cheap days that their gram-for-gram cost was better than the plain average of the rates they saw.",
      "",
      "Use only **successful buy** orders; each executes at the `GoldRate` of the day of its `ordered_at`. A customer's **weighted rate** is the average rate weighted by milligrams (`Σ rate × mg ÷ Σ mg`); their **simple rate** is the plain average of the rate over their orders, each order counting once. Return customers whose weighted rate is **strictly lower** than their simple rate, with `user_id`, `bought_mg` (milligrams bought), `weighted_rate` and `simple_rate`, both rates **rounded to whole rupees**. Compare the exact rates, not the rounded ones. Return the rows **ordered by `user_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "GoldRate",
        columns: [
          { name: "rate_date", type: "date" },
          { name: "price_per_gram", type: "int" },
        ],
        primaryKey: ["rate_date"],
        note: "The buy rate published for each day, in rupees per gram. Every day an order was placed has a rate.",
      },
      {
        name: "GoldOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "txn_type", type: "enum", values: ["buy", "sell"] },
          { name: "ordered_at", type: "datetime" },
          { name: "milligrams", type: "int" },
          { name: "status", type: "enum", values: ["success", "failed"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per digital gold order.",
      },
    ],
    examples: [
      {
        GoldRate: [
          ["2025-03-01", 6400],
          ["2025-03-02", 6500],
          ["2025-03-03", 6300],
          ["2025-03-04", 6600],
        ],
        GoldOrder: [
          [1, 1, "buy", "2025-03-01 09:00:00", 1000, "success"],
          [2, 1, "buy", "2025-03-03 23:59:59", 3000, "success"],
          [3, 1, "buy", "2025-03-04 10:00:00", 500, "success"],
          [4, 2, "buy", "2025-03-02 12:00:00", 2000, "success"],
          [5, 2, "buy", "2025-03-04 12:00:00", 2000, "success"],
          [6, 3, "buy", "2025-03-01 08:00:00", 100, "success"],
          [7, 3, "buy", "2025-03-04 08:00:00", 900, "success"],
          [8, 4, "buy", "2025-03-02 18:00:00", 500, "success"],
          [9, 4, "buy", "2025-03-03 18:00:00", 4000, "failed"],
          [10, 4, "buy", "2025-03-03 19:00:00", 1000, "success"],
          [11, 4, "sell", "2025-03-04 09:00:00", 1000, "success"],
          [12, 5, "buy", "2025-03-03 07:00:00", 2500, "success"],
        ],
      },
    ],
    gen: (rng) => {
      const days = ["2025-03-01", "2025-03-02", "2025-03-03", "2025-03-04", "2025-03-05", "2025-03-06"];
      const rates: Cell[][] = days.map((d) => [d, roundTo(rng, 6200, 6700, 10)]);
      const users = ri(rng, 1, 7);
      const rows: Cell[][] = [];
      let id = 1;
      for (let u = 1; u <= users; u++) {
        const k = ri(rng, 1, 5);
        const flat = chance(rng, 0.2);
        for (let j = 0; j < k; j++) {
          rows.push([id++, u, chance(rng, 0.15) ? "sell" : "buy", atTime(rng, pick(rng, days)), flat ? 1000 : pick(rng, [100, 250, 500, 1000, 2000, 3000]), chance(rng, 0.12) ? "failed" : "success"]);
        }
      }
      return { GoldRate: rates, GoldOrder: shuffle(rng, rows) };
    },
    solution: [
      "SELECT o.user_id,",
      "       SUM(o.milligrams) AS bought_mg,",
      "       ROUND(SUM(r.price_per_gram * o.milligrams) / SUM(o.milligrams)) AS weighted_rate,",
      "       ROUND(AVG(r.price_per_gram)) AS simple_rate",
      "FROM GoldOrder o",
      "JOIN GoldRate r ON r.rate_date = CAST(o.ordered_at AS DATE)",
      "WHERE o.txn_type = 'buy' AND o.status = 'success'",
      "GROUP BY o.user_id",
      "HAVING SUM(r.price_per_gram * o.milligrams) * COUNT(*) < SUM(r.price_per_gram) * SUM(o.milligrams)",
      "ORDER BY o.user_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT user_id, bought_mg, ROUND(w) AS weighted_rate, ROUND(s) AS simple_rate",
        "FROM (",
        "  SELECT o.user_id, SUM(o.milligrams) AS bought_mg,",
        "         SUM(r.price_per_gram * o.milligrams) / SUM(o.milligrams) AS w,",
        "         SUM(r.price_per_gram) / COUNT(o.order_id) AS s",
        "  FROM GoldOrder o",
        "  JOIN GoldRate r ON r.rate_date = LEFT(o.ordered_at, 10)",
        "  WHERE o.txn_type = 'buy' AND o.status = 'success'",
        "  GROUP BY o.user_id",
        ") t",
        "WHERE w < s",
        "ORDER BY user_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Attach each order's rate by joining on the order's calendar day.",
      "A weighted average is a sum of value × weight divided by the sum of the weights — not `AVG(rate)`.",
      "To compare two fractions without rounding trouble, cross-multiply: `Σ(rate·mg) × n < Σ rate × Σ mg`.",
      "Sells and failed orders bought nothing — filter them before aggregating.",
    ],
    editorial: [
      "Each order's price is the rate of its day, so the first step is a join on the order's calendar day — `CAST(ordered_at AS DATE) = rate_date` — which puts customer 1's order at 23:59:59 on 3 March at that day's rate. Sells and failed orders are filtered out first; they did not buy any gold.",
      "",
      "The **weighted** average weighs every rupee rate by the milligrams bought at it: `SUM(rate × mg) / SUM(mg)`. Customer 1 bought 3,000 mg at 6,300 and only 1,500 mg at higher rates, so their weighted rate is 6,355.56, while the **simple** average of the three rates they saw, `AVG(rate)`, is 6,433.33 — they beat it. When every order has the same size the two are equal (customer 2), and when the big order fell on an expensive day the weighted rate is higher (customer 3); neither is reported.",
      "",
      "The comparison must use the exact values, so the reference query cross-multiplies: weighted < simple is `Σ(rate·mg) / Σmg < Σrate / n`, and with positive denominators that is `Σ(rate·mg) × n < Σrate × Σmg` — all integers, no rounding involved. Only the displayed columns are rounded. The alternative computes both averages in a derived table and compares them directly; it agrees because equal fractions divide to equal values. One join and one grouping.",
    ].join("\n"),
  },

  {
    slug: "paytm-fastag-reads-charged-off-the-axle-band-rate",
    title: "Paytm: FASTag Reads Charged Off the Plaza's Axle-Band Rate",
    difficulty: "HARD",
    topics: ["Joins", "Conditional Logic"],
    description: [
      "Toll at a plaza depends on the vehicle's number of axles, in bands such as 2, 3, 4–6 and 7 or more. The FASTag disputes team audits every toll read against the plaza's band table.",
      "",
      "A read's **expected toll** is the `rate` of the band at the same plaza whose range holds the vehicle's `axles` (`min_axles` to `max_axles` inclusive; a NULL `max_axles` has no upper limit). Bands of one plaza never overlap. Return every read whose charge does **not** match, with `read_id`, `vehicle_no`, `plaza`, `charged`, `expected_toll` and `verdict`: `overcharged` or `undercharged` when a band was found, `no_band` (with `expected_toll` NULL) when the plaza has no band for that vehicle. Reads charged exactly the band rate are left out. Return the rows **ordered by `read_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "FastagTag",
        columns: [
          { name: "tag_id", type: "int" },
          { name: "vehicle_no", type: "varchar" },
          { name: "axles", type: "int" },
        ],
        primaryKey: ["tag_id"],
        note: "One row per FASTag sticker with the axle count on the vehicle's registration.",
      },
      {
        name: "TollBand",
        columns: [
          { name: "band_id", type: "int" },
          { name: "plaza", type: "varchar" },
          { name: "min_axles", type: "int" },
          { name: "max_axles", type: "int" },
          { name: "rate", type: "int" },
        ],
        primaryKey: ["band_id"],
        note: "One row per axle band at a plaza; the whole toll for a vehicle in the band, in rupees (not added up band by band).",
      },
      {
        name: "TollRead",
        columns: [
          { name: "read_id", type: "int" },
          { name: "tag_id", type: "int" },
          { name: "plaza", type: "varchar" },
          { name: "crossed_at", type: "datetime" },
          { name: "charged", type: "int" },
        ],
        primaryKey: ["read_id"],
        note: "One row per debited toll read; `tag_id` always names a tag.",
      },
    ],
    examples: [
      {
        FastagTag: [
          [1, "MH12AB1234", 2],
          [2, "KA05MN4321", 3],
          [3, "DL8CAF0099", 6],
          [4, "TN09BX7788", 9],
          [5, "RJ14CD5566", 4],
        ],
        TollBand: [
          [1, "Kherki Daula", 2, 2, 80],
          [2, "Kherki Daula", 3, 3, 130],
          [3, "Kherki Daula", 4, 6, 270],
          [4, "Kherki Daula", 7, null, 350],
          [5, "Vashi", 2, 3, 40],
          [6, "Vashi", 4, 6, 130],
        ],
        TollRead: [
          [1, 1, "Kherki Daula", "2025-03-01 08:00:00", 80],
          [2, 2, "Kherki Daula", "2025-03-01 09:10:00", 270],
          [3, 3, "Kherki Daula", "2025-03-01 10:20:00", 270],
          [4, 4, "Kherki Daula", "2025-03-01 11:30:00", 270],
          [5, 5, "Vashi", "2025-03-02 07:00:00", 130],
          [6, 2, "Vashi", "2025-03-02 07:40:00", 40],
          [7, 1, "Lonavala", "2025-03-02 12:00:00", 320],
          [8, 3, "Vashi", "2025-03-02 18:15:00", 40],
          [9, 4, "Vashi", "2025-03-03 06:30:00", 130],
        ],
      },
    ],
    gen: (rng) => {
      const plazas = sample(rng, PLAZAS, 3);
      const bands: Cell[][] = [];
      let bid = 1;
      plazas.slice(0, 2).forEach((plaza) => {
        let lo = 2;
        let rate = roundTo(rng, 40, 120, 5);
        while (lo <= 9) {
          const hi = Math.min(9, lo + ri(rng, 0, 2));
          const last = hi === 9 || chance(rng, 0.15);
          bands.push([bid++, plaza, lo, last ? (chance(rng, 0.6) ? null : hi) : hi, rate]);
          if (last) break;
          lo = hi + 1;
          rate += roundTo(rng, 30, 120, 5);
        }
      });
      const nTags = ri(rng, 1, 6);
      const tags: Cell[][] = seq(1, nTags).map((id) => [id, `${pick(rng, STATE_CODES)}AB${ri(rng, 1000, 9999)}${id}`, ri(rng, 2, 9)]);
      const n = ri(rng, 2, 18);
      const reads: Cell[][] = seq(1, n).map((id) => {
        const tag = tags[ri(rng, 0, nTags - 1)]!;
        const plaza = chance(rng, 0.15) ? plazas[2]! : pick(rng, plazas.slice(0, 2));
        const band = bands.find((b) => b[1] === plaza && (tag[2] as number) >= (b[2] as number) && (b[3] === null || (tag[2] as number) <= (b[3] as number)));
        const fair = band ? (band[4] as number) : roundTo(rng, 40, 400, 5);
        const charged = chance(rng, 0.55) ? fair : Math.max(5, fair + pick(rng, [-50, -5, 5, 40, 100]));
        return [id, tag[0]!, plaza, atTime(rng, dateBetween(rng, "2025-03-01", "2025-03-05")), charged];
      });
      return { FastagTag: tags, TollBand: bands, TollRead: reads };
    },
    solution: [
      "SELECT r.read_id, t.vehicle_no, r.plaza, r.charged, b.rate AS expected_toll,",
      "       CASE WHEN b.rate IS NULL THEN 'no_band'",
      "            WHEN r.charged > b.rate THEN 'overcharged'",
      "            ELSE 'undercharged' END AS verdict",
      "FROM TollRead r",
      "JOIN FastagTag t ON t.tag_id = r.tag_id",
      "LEFT JOIN TollBand b",
      "  ON b.plaza = r.plaza",
      " AND t.axles >= b.min_axles",
      " AND (b.max_axles IS NULL OR t.axles <= b.max_axles)",
      "WHERE b.rate IS NULL OR r.charged <> b.rate",
      "ORDER BY r.read_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT read_id, vehicle_no, plaza, charged, expected_toll,",
        "       IF(expected_toll IS NULL, 'no_band', IF(charged > expected_toll, 'overcharged', 'undercharged')) AS verdict",
        "FROM (",
        "  SELECT r.read_id, t.vehicle_no, r.plaza, r.charged,",
        "         (SELECT b.rate FROM TollBand b WHERE b.plaza = r.plaza AND t.axles BETWEEN b.min_axles AND COALESCE(b.max_axles, t.axles)) AS expected_toll",
        "  FROM TollRead r JOIN FastagTag t ON t.tag_id = r.tag_id",
        ") x",
        "WHERE NOT (charged <=> expected_toll)",
        "ORDER BY read_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The band is found by a range, not by equality: join on the plaza and `axles` between the band's limits.",
      "An open-ended top band has `max_axles` NULL — the upper test must let NULL through.",
      "Use a LEFT JOIN so a read with no band survives with a NULL rate.",
      "Then keep the reads whose charge differs from the rate, or that have no rate at all.",
    ],
    editorial: [
      "This is a **band lookup**: each read has to find the one row of `TollBand` whose range contains the vehicle's axle count at that plaza. The join condition is therefore a range test — `t.axles >= b.min_axles AND (b.max_axles IS NULL OR t.axles <= b.max_axles)` — plus equality on the plaza. The NULL branch is essential: the 9-axle truck at Kherki Daula falls in the open-ended \"7 or more\" band, and a plain `t.axles <= b.max_axles` would be NULL there and lose it. Because a plaza's bands never overlap, each read matches at most one band. The rate is the whole toll for the band — nothing is added across lower bands.",
      "",
      "A `LEFT JOIN` keeps reads that match no band: Lonavala has no table at all, and Vashi's bands stop at 6 axles, so the truck read there gets NULL. Those are the `no_band` disputes. The `WHERE` clause keeps no-band reads and reads whose charge differs; a correct charge is dropped. The verdict `CASE` tests the NULL case first, then the direction of the difference.",
      "",
      "The alternative looks the rate up with a correlated scalar subquery (`COALESCE(max_axles, axles)` stands in for \"no upper limit\") and drops correct charges with the NULL-safe `<=>`, which treats a NULL rate as a mismatch. Both cost one probe of the band table per read.",
    ].join("\n"),
  },

  {
    slug: "paytm-money-sip-investor-retention-three-months-later",
    title: "Paytm Money: SIP Investor Retention Three Months Later by Cohort",
    difficulty: "HARD",
    topics: ["Subqueries", "Dates", "Aggregation"],
    description: [
      "The Paytm Money growth team measures whether new SIP investors are still investing a quarter later.",
      "",
      "An investor's **cohort** is the month (`YYYY-MM`) of their first **successful** SIP payment; bounced payments never start a cohort. An investor is **retained** when they have at least one successful payment in the calendar month **exactly three months after** their cohort month (a January cohort looks at April; a November cohort at the next February). For every cohort return `cohort_month`, `investors`, `retained` and `retention_pct` = 100 × retained ÷ investors **rounded to 1 decimal place**. Return the rows **ordered by `cohort_month`**.",
    ].join("\n"),
    tables: [
      {
        name: "SipPayment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "investor_id", type: "int" },
          { name: "paid_on", type: "date" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["success", "bounced"] },
        ],
        primaryKey: ["payment_id"],
        note: "One row per SIP debit attempt.",
      },
    ],
    examples: [
      {
        SipPayment: [
          [1, 1, "2024-01-05", 1000, "success"],
          [2, 1, "2024-04-05", 1000, "success"],
          [3, 2, "2024-01-10", 500, "bounced"],
          [4, 2, "2024-02-10", 500, "success"],
          [5, 2, "2024-05-10", 500, "success"],
          [6, 3, "2024-01-20", 2000, "success"],
          [7, 3, "2024-02-20", 2000, "success"],
          [8, 3, "2024-03-20", 2000, "success"],
          [9, 3, "2024-04-20", 2000, "bounced"],
          [10, 4, "2024-02-01", 1500, "success"],
          [11, 4, "2024-05-31", 1500, "bounced"],
          [12, 4, "2024-06-01", 1500, "success"],
          [13, 5, "2024-11-15", 3000, "success"],
          [14, 5, "2025-02-28", 3000, "success"],
        ],
      },
    ],
    gen: (rng) => {
      const investors = ri(rng, 1, 12);
      const rows: Cell[][] = [];
      let id = 1;
      for (let v = 1; v <= investors; v++) {
        const first = pick(rng, [0, 1, 2, 10, 11]);
        const amount = roundTo(rng, 500, 5000, 500);
        const len = ri(rng, 1, 6);
        for (let m = first; m < first + len; m++) {
          if (m > first && chance(rng, 0.25)) continue;
          const status = m === first && chance(rng, 0.15) ? "bounced" : chance(rng, 0.25) ? "bounced" : "success";
          rows.push([id++, v, monthDay(m, chance(rng, 0.15) ? pick(rng, [1, 28]) : ri(rng, 1, 28)), amount, status]);
        }
      }
      return { SipPayment: shuffle(rng, rows) };
    },
    solution: [
      "WITH firsts AS (",
      "  SELECT investor_id, DATE_FORMAT(MIN(paid_on), '%Y-%m') AS cohort_month",
      "  FROM SipPayment",
      "  WHERE status = 'success'",
      "  GROUP BY investor_id",
      "), flagged AS (",
      "  SELECT f.cohort_month,",
      "         CASE WHEN EXISTS (",
      "           SELECT 1 FROM SipPayment p",
      "           WHERE p.investor_id = f.investor_id AND p.status = 'success'",
      "             AND DATE_FORMAT(p.paid_on, '%Y-%m') = DATE_FORMAT(DATE_ADD(CONCAT(f.cohort_month, '-01'), INTERVAL 3 MONTH), '%Y-%m')",
      "         ) THEN 1 ELSE 0 END AS kept",
      "  FROM firsts f",
      ")",
      "SELECT cohort_month, COUNT(*) AS investors, SUM(kept) AS retained,",
      "       ROUND(100 * SUM(kept) / COUNT(*), 1) AS retention_pct",
      "FROM flagged",
      "GROUP BY cohort_month",
      "ORDER BY cohort_month",
    ].join("\n"),
    alternatives: [
      [
        "WITH ok AS (SELECT investor_id, YEAR(paid_on) * 12 + MONTH(paid_on) AS mi FROM SipPayment WHERE status = 'success'),",
        "firsts AS (SELECT investor_id, MIN(mi) AS cm FROM ok GROUP BY investor_id),",
        "kept AS (SELECT DISTINCT f.investor_id FROM firsts f JOIN ok o ON o.investor_id = f.investor_id AND o.mi = f.cm + 3)",
        "SELECT CONCAT((f.cm - 1) DIV 12, '-', LPAD((f.cm - 1) MOD 12 + 1, 2, '0')) AS cohort_month,",
        "       COUNT(*) AS investors, COUNT(k.investor_id) AS retained,",
        "       ROUND(100 * COUNT(k.investor_id) / COUNT(*), 1) AS retention_pct",
        "FROM firsts f LEFT JOIN kept k ON k.investor_id = f.investor_id",
        "GROUP BY f.cm",
        "ORDER BY cohort_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Find each investor's cohort from the minimum date of their *successful* payments.",
      "The target month is the cohort month plus three months — `DATE_ADD` handles the year change.",
      "Flag each investor as retained or not, then aggregate the flags per cohort.",
    ],
    editorial: [
      "Cohort analysis is two steps: assign every member to a cohort, then measure each cohort. The cohort is the month of the investor's first **successful** payment — `MIN(paid_on)` over successful rows, formatted as `YYYY-MM`. Investor 2's bounced January debit does not count, so they belong to February.",
      "",
      "Retention looks at one specific month: the cohort month plus three. `DATE_ADD(CONCAT(cohort_month, '-01'), INTERVAL 3 MONTH)` computes it with the calendar, so November 2024 → February 2025 just works. A correlated `EXISTS` asks whether the investor has a successful payment in that month and turns the answer into a 0/1 flag; a bounced payment in the target month (investor 4's 31 May) is not retention, and a payment a month later is too late.",
      "",
      "Grouping the flags by cohort gives `COUNT(*)` investors and `SUM(kept)` retained, and the percentage is `ROUND(100 * retained / investors, 1)`. Every cohort is reported, even one whose target month has no data yet.",
      "",
      "The alternative works with month indexes (`YEAR * 12 + MONTH`), so \"three months later\" is `+ 3`, finds retained investors with a join, and rebuilds the `YYYY-MM` label with `DIV`, `MOD` and `LPAD`.",
    ].join("\n"),
  },

  {
    slug: "paytm-daily-movie-seats-for-every-day-of-the-run",
    title: "Paytm: Daily Seats Sold for Every Day of a Movie's Run",
    difficulty: "HARD",
    topics: ["Subqueries", "Window Functions", "Dates", "Joins"],
    description: [
      "The movie-ticketing team plots each film's sales curve for distributors. A day with no tickets must still be on the chart as a 0, or the line jumps over the dip.",
      "",
      "For every movie, list **every date** from its `release_date` to its `last_show_date`, both inclusive, with `movie_id`, `show_date`, `seats_sold` (the seats of its **booked** tickets for shows on that date, **0** if none) and `running_seats` (seats sold from the release date up to and including that date). Cancelled tickets never count. Every ticket's `show_date` lies inside its movie's run, and no run is longer than 20 days. Return the rows **ordered by `movie_id`**, then `show_date`.",
    ].join("\n"),
    tables: [
      {
        name: "Movie",
        columns: [
          { name: "movie_id", type: "int" },
          { name: "title", type: "varchar" },
          { name: "release_date", type: "date" },
          { name: "last_show_date", type: "date" },
        ],
        primaryKey: ["movie_id"],
        note: "One row per film listed on the app; `last_show_date` is never before `release_date`.",
      },
      {
        name: "TicketSale",
        columns: [
          { name: "sale_id", type: "int" },
          { name: "movie_id", type: "int" },
          { name: "show_date", type: "date" },
          { name: "seats", type: "int" },
          { name: "status", type: "enum", values: ["booked", "cancelled"] },
        ],
        primaryKey: ["sale_id"],
        note: "One row per ticket order; `show_date` is the date of the show, not of the purchase.",
      },
    ],
    examples: [
      {
        Movie: [
          [1, "Monsoon Express", "2025-03-07", "2025-03-11"],
          [2, "Kesari Dawn", "2025-03-09", "2025-03-09"],
          [3, "Neon Nights", "2025-03-10", "2025-03-11"],
        ],
        TicketSale: [
          [1, 1, "2025-03-07", 4, "booked"],
          [2, 1, "2025-03-07", 2, "booked"],
          [3, 1, "2025-03-08", 5, "cancelled"],
          [4, 1, "2025-03-10", 3, "booked"],
          [5, 1, "2025-03-11", 1, "booked"],
          [6, 2, "2025-03-09", 6, "booked"],
          [7, 3, "2025-03-11", 2, "cancelled"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 4);
      const movies: Cell[][] = sample(rng, MOVIES, n).map((t, i) => {
        const rel = dateBetween(rng, "2025-02-24", "2025-03-10");
        return [i + 1, t, rel, addDays(rel, chance(rng, 0.15) ? 0 : ri(rng, 1, 8))];
      });
      const sales: Cell[][] = [];
      let id = 1;
      for (const m of movies) {
        const len = Math.round((Date.parse(`${m[3]}T00:00:00Z`) - Date.parse(`${m[2]}T00:00:00Z`)) / 86_400_000);
        const k = ri(rng, 0, 7);
        for (let j = 0; j < k; j++) sales.push([id++, m[0]!, addDays(m[2] as string, ri(rng, 0, len)), ri(rng, 1, 6), chance(rng, 0.2) ? "cancelled" : "booked"]);
      }
      return { Movie: movies, TicketSale: shuffle(rng, sales) };
    },
    solution: [
      "WITH RECURSIVE run_days AS (",
      "  SELECT movie_id, release_date AS show_date, last_show_date",
      "  FROM Movie",
      "  UNION ALL",
      "  SELECT movie_id, DATE_ADD(show_date, INTERVAL 1 DAY), last_show_date",
      "  FROM run_days",
      "  WHERE show_date < last_show_date",
      "), daily AS (",
      "  SELECT movie_id, show_date, SUM(seats) AS seats",
      "  FROM TicketSale",
      "  WHERE status = 'booked'",
      "  GROUP BY movie_id, show_date",
      "), filled AS (",
      "  SELECT r.movie_id, r.show_date, COALESCE(d.seats, 0) AS seats_sold",
      "  FROM run_days r",
      "  LEFT JOIN daily d ON d.movie_id = r.movie_id AND d.show_date = r.show_date",
      ")",
      "SELECT movie_id, show_date, seats_sold,",
      "       SUM(seats_sold) OVER (PARTITION BY movie_id ORDER BY show_date ROWS UNBOUNDED PRECEDING) AS running_seats",
      "FROM filled",
      "ORDER BY movie_id, show_date",
    ].join("\n"),
    alternatives: [
      [
        "WITH digits AS (",
        "  SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6",
        "  UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13",
        "  UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19",
        "), days AS (",
        "  SELECT m.movie_id, DATE_ADD(m.release_date, INTERVAL g.n DAY) AS show_date",
        "  FROM Movie m CROSS JOIN digits g",
        "  WHERE g.n <= DATEDIFF(m.last_show_date, m.release_date)",
        ")",
        "SELECT x.movie_id, x.show_date,",
        "       IFNULL((SELECT SUM(t.seats) FROM TicketSale t WHERE t.movie_id = x.movie_id AND t.show_date = x.show_date AND t.status = 'booked'), 0) AS seats_sold,",
        "       IFNULL((SELECT SUM(t.seats) FROM TicketSale t WHERE t.movie_id = x.movie_id AND t.show_date <= x.show_date AND t.status = 'booked'), 0) AS running_seats",
        "FROM days x",
        "ORDER BY x.movie_id, x.show_date",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The dates with no sales are not in any table, so you have to generate the dates first.",
      "A recursive CTE can start at each movie's release date and add one day until it reaches the last show date.",
      "LEFT JOIN the daily booked seats to the generated dates and turn the missing ones into 0.",
      "The running total is a windowed SUM over the zero-filled rows.",
    ],
    editorial: [
      "The difficulty is that a day with no booked tickets leaves no row anywhere — `GROUP BY show_date` over the sales can only return days that sold something. So the dates have to be **generated** before the sales are attached. A recursive CTE does it per movie: the anchor row is the release date, and the recursive step adds one day with `DATE_ADD(show_date, INTERVAL 1 DAY)` while the date is still before `last_show_date`. A movie whose run is a single day stops at the anchor; `DATE_ADD` handles month ends, so a run from 26 February to 3 March produces every day in between.",
      "",
      "Separately, booked seats are summed per (movie, show date) — cancelled orders are filtered first, so Monsoon Express's cancelled 8 March order leaves that day at 0. `LEFT JOIN`ing these sums to the generated calendar keeps every date, and `COALESCE(…, 0)` turns the empty days into 0. Neon Nights, whose only order was cancelled, still gets both of its days at 0.",
      "",
      "The running total is then `SUM(seats_sold) OVER (PARTITION BY movie_id ORDER BY show_date ROWS UNBOUNDED PRECEDING)` over the filled rows, so it stays flat across the dips.",
      "",
      "The alternative generates the calendar without recursion: a small table of offsets 0–19 `CROSS JOIN`ed to the movies, kept where the offset fits the run (this is why the statement bounds a run at 20 days), with the day's seats and the running total from correlated sums.",
    ].join("\n"),
  },

  {
    slug: "paytm-merchant-loan-outstanding-as-of-31-january-2025",
    title: "Paytm: Merchant Loan Outstanding as of 31 January 2025",
    difficulty: "HARD",
    topics: ["Aggregation", "Conditional Logic", "Dates", "Joins"],
    description: [
      "Every movement on a merchant loan is a row in the loan ledger. For the January month-end book, the lending finance team needs each loan's balance **as it stood at the end of 31 January 2025** — later postings must not leak in.",
      "",
      "Use only entries posted **on or before `2025-01-31 23:59:59`**. A loan's outstanding balance is its `disbursal` and `fee` amounts minus its `repayment` and `waiver` amounts. Report a loan only if its disbursal was posted by then. Return `loan_id`, `merchant_id`, `outstanding` and `last_repaid_on` (the posting time of its latest repayment up to that moment, NULL if none). A fully repaid loan shows 0 and is still listed. Return the rows **ordered by `outstanding` descending**, then by `loan_id`.",
    ].join("\n"),
    tables: [
      {
        name: "MerchantLoan",
        columns: [
          { name: "loan_id", type: "int" },
          { name: "merchant_id", type: "int" },
          { name: "product", type: "enum", values: ["daily_deduction", "fixed_emi"] },
        ],
        primaryKey: ["loan_id"],
        note: "One row per loan sanctioned to a merchant.",
      },
      {
        name: "LoanLedger",
        columns: [
          { name: "entry_id", type: "int" },
          { name: "loan_id", type: "int" },
          { name: "posted_at", type: "datetime" },
          { name: "entry_type", type: "enum", values: ["disbursal", "fee", "repayment", "waiver"] },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["entry_id"],
        note: "One row per posting; `amount` is always positive and `entry_type` says which way it moves the balance. Each loan has one disbursal, and its balance never goes below 0.",
      },
    ],
    examples: [
      {
        MerchantLoan: [
          [1, 11, "daily_deduction"],
          [2, 12, "fixed_emi"],
          [3, 13, "daily_deduction"],
          [4, 14, "daily_deduction"],
          [5, 15, "fixed_emi"],
        ],
        LoanLedger: [
          [1, 1, "2025-01-02 10:00:00", "disbursal", 10000],
          [2, 1, "2025-01-02 10:00:00", "fee", 300],
          [3, 1, "2025-01-10 21:00:00", "repayment", 2000],
          [4, 1, "2025-01-31 23:59:59", "repayment", 1000],
          [5, 1, "2025-02-01 00:00:00", "repayment", 5000],
          [6, 2, "2025-01-15 12:00:00", "disbursal", 5000],
          [7, 2, "2025-01-15 12:00:00", "fee", 150],
          [8, 3, "2025-02-01 09:00:00", "disbursal", 8000],
          [9, 4, "2024-12-20 11:00:00", "disbursal", 3000],
          [10, 4, "2024-12-20 11:00:00", "fee", 90],
          [11, 4, "2025-01-05 21:00:00", "repayment", 2000],
          [12, 4, "2025-01-20 15:00:00", "waiver", 90],
          [13, 4, "2025-01-25 21:00:00", "repayment", 1000],
          [14, 5, "2025-01-10 10:00:00", "disbursal", 4000],
          [15, 5, "2025-01-10 10:00:00", "fee", 120],
          [16, 5, "2025-01-12 21:00:00", "repayment", 1000],
          [17, 5, "2025-01-12 21:30:00", "repayment", 500],
        ],
      },
    ],
    gen: (rng) => {
      const loans = ri(rng, 1, 6);
      const loanRows: Cell[][] = [];
      const entries: Cell[][] = [];
      let eid = 1;
      for (let l = 1; l <= loans; l++) {
        loanRows.push([l, 10 + l, pick(rng, ["daily_deduction", "fixed_emi"])]);
        const disb = chance(rng, 0.1) ? pick(rng, ["2025-01-31 23:59:59", "2025-02-01 00:00:00"]) : atTime(rng, dateBetween(rng, "2024-12-10", "2025-02-05"));
        const principal = roundTo(rng, 2000, 10000, 1000);
        const fee = chance(rng, 0.8) ? Math.round(principal * 0.03) : 0;
        entries.push([eid++, l, disb, "disbursal", principal]);
        if (fee) entries.push([eid++, l, disb, "fee", fee]);
        let left = principal + fee;
        let t = Date.parse(`${disb.replace(" ", "T")}Z`);
        const k = ri(rng, 0, 5);
        for (let j = 0; j < k && left > 0; j++) {
          t += ri(rng, 1, 12) * 86_400_000 + ri(rng, 0, 3600) * 1000;
          const when = chance(rng, 0.1) ? "2025-01-31 23:59:59" : new Date(t).toISOString().slice(0, 19).replace("T", " ");
          if (when < disb) continue;
          const waive = fee > 0 && chance(rng, 0.15) && left >= fee;
          const amt = waive ? fee : Math.min(left, chance(rng, 0.2) ? left : roundTo(rng, 500, 3000, 500));
          left -= amt;
          entries.push([eid++, l, when, waive ? "waiver" : "repayment", amt]);
        }
      }
      return { MerchantLoan: loanRows, LoanLedger: shuffle(rng, entries) };
    },
    solution: [
      "SELECT l.loan_id, l.merchant_id,",
      "       SUM(CASE WHEN e.entry_type IN ('disbursal', 'fee') THEN e.amount ELSE -e.amount END) AS outstanding,",
      "       MAX(CASE WHEN e.entry_type = 'repayment' THEN e.posted_at END) AS last_repaid_on",
      "FROM MerchantLoan l",
      "JOIN LoanLedger e ON e.loan_id = l.loan_id",
      "WHERE e.posted_at < '2025-02-01 00:00:00'",
      "GROUP BY l.loan_id, l.merchant_id",
      "HAVING SUM(e.entry_type = 'disbursal') > 0",
      "ORDER BY outstanding DESC, l.loan_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT loan_id, merchant_id, outstanding, last_repaid_on FROM (",
        "  SELECT l.loan_id, l.merchant_id,",
        "         (SELECT COALESCE(SUM(e.amount), 0) FROM LoanLedger e WHERE e.loan_id = l.loan_id AND e.posted_at <= '2025-01-31 23:59:59' AND e.entry_type IN ('disbursal', 'fee'))",
        "       - (SELECT COALESCE(SUM(e.amount), 0) FROM LoanLedger e WHERE e.loan_id = l.loan_id AND e.posted_at <= '2025-01-31 23:59:59' AND e.entry_type IN ('repayment', 'waiver')) AS outstanding,",
        "         (SELECT MAX(e.posted_at) FROM LoanLedger e WHERE e.loan_id = l.loan_id AND e.posted_at <= '2025-01-31 23:59:59' AND e.entry_type = 'repayment') AS last_repaid_on",
        "  FROM MerchantLoan l",
        "  WHERE EXISTS (SELECT 1 FROM LoanLedger d WHERE d.loan_id = l.loan_id AND d.entry_type = 'disbursal' AND d.posted_at <= '2025-01-31 23:59:59')",
        ") x",
        "ORDER BY outstanding DESC, loan_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Cut the ledger at the as-of moment first; everything later is invisible to the month-end book.",
      "Give each entry a sign: disbursals and fees raise the balance, repayments and waivers lower it.",
      "The end of 31 January is every timestamp before `2025-02-01 00:00:00` — a date-only comparison with `'2025-01-31'` would lose that day's postings.",
      "A loan disbursed in February has no rows left after the cut — or keep it out with a check on the disbursal.",
    ],
    editorial: [
      "A ledger stores movements, not balances, so a balance **as of a moment** is rebuilt by adding up every movement posted up to that moment. The cut comes first: `posted_at < '2025-02-01 00:00:00'` keeps loan 1's repayment at 23:59:59 on 31 January and drops its 5,000 posted at midnight on 1 February, which belongs to February's book. Writing the bound as `<= '2025-01-31'` would compare a timestamp with a bare date and lose the whole last day.",
      "",
      "Each surviving entry then gets a sign — `+amount` for a disbursal or fee, `-amount` for a repayment or waiver — and `SUM` per loan is the balance. Loan 4 shows how waivers count: 3,000 + 90 − 2,000 − 90 − 1,000 = 0, still listed as fully repaid. `MAX(CASE WHEN entry_type = 'repayment' THEN posted_at END)` picks the latest repayment inside the cut; a loan with none gets NULL because `MAX` ignores the NULLs the `CASE` produces.",
      "",
      "A loan disbursed after the cut (loan 3) has no entries left, so the inner join already removes it; `HAVING SUM(entry_type = 'disbursal') > 0` states the rule explicitly. The alternative computes the two sides of the balance and the last repayment with correlated subqueries and checks the disbursal with `EXISTS`. Both read each loan's ledger once with an index on `(loan_id, posted_at)`.",
    ].join("\n"),
  },

  {
    slug: "paytm-spending-before-and-after-cashback-by-campaign",
    title: "Paytm: Spending Before and After Cashback for Each Campaign",
    difficulty: "HARD",
    topics: ["Subqueries", "Joins", "Dates", "Aggregation"],
    description: [
      "The rewards team judges a cashback campaign by whether users spend more after receiving it. For each user in a campaign, the reference day is their **first** credit in that campaign.",
      "",
      "Per (campaign, user), take their payments in the **14 days before** the reference day (reference − 14 … reference − 1) and the **14 days after** it (reference + 1 … reference + 14); payments on the reference day itself are ignored. For every campaign return `campaign_code`, `users` (distinct users credited), `cashback_paid` (all its credits), `spend_before`, `spend_after` (the windows summed over its users; 0 if none) and `uplift` = `spend_after − spend_before`. Return the rows **ordered by `uplift` descending**, then `campaign_code`.",
    ].join("\n"),
    tables: [
      {
        name: "CashbackCredit",
        columns: [
          { name: "credit_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "campaign_code", type: "varchar" },
          { name: "credited_on", type: "date" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["credit_id"],
        note: "One row per cashback credited; a user can be credited several times in one campaign.",
      },
      {
        name: "UserPayment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "paid_on", type: "date" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["payment_id"],
        note: "One row per successful payment the user made on the app.",
      },
    ],
    examples: [
      {
        CashbackCredit: [
          [1, 1, "HOLI50", "2025-03-14", 50],
          [2, 1, "HOLI50", "2025-03-20", 50],
          [3, 2, "HOLI50", "2025-03-15", 30],
          [4, 3, "IPL100", "2025-04-01", 100],
        ],
        UserPayment: [
          [1, 1, "2025-02-27", 700],
          [2, 1, "2025-02-28", 400],
          [3, 1, "2025-03-14", 999],
          [4, 1, "2025-03-20", 300],
          [5, 1, "2025-03-28", 200],
          [6, 1, "2025-03-29", 500],
          [7, 2, "2025-03-01", 100],
          [8, 2, "2025-03-16", 50],
          [9, 3, "2025-03-31", 200],
          [10, 3, "2025-04-15", 600],
          [11, 4, "2025-03-20", 800],
        ],
      },
    ],
    gen: (rng) => {
      const users = ri(rng, 1, 6);
      const credits: Cell[][] = [];
      const pays: Cell[][] = [];
      let cid = 1;
      let pid = 1;
      for (let u = 1; u <= users; u++) {
        for (const code of sample(rng, ["HOLI50", "IPL100", "GOLD75"], ri(rng, 0, 2))) {
          const k = ri(rng, 1, 2);
          for (let j = 0; j < k; j++) credits.push([cid++, u, code, dateBetween(rng, "2025-03-10", "2025-03-25"), pick(rng, [25, 50, 75, 100])]);
        }
        const k = ri(rng, 0, 8);
        for (let j = 0; j < k; j++) pays.push([pid++, u, dateBetween(rng, "2025-02-20", "2025-04-12"), roundTo(rng, 50, 1000, 50)]);
      }
      return { CashbackCredit: shuffle(rng, credits), UserPayment: shuffle(rng, pays) };
    },
    solution: [
      "WITH firsts AS (",
      "  SELECT campaign_code, user_id, MIN(credited_on) AS ref_day",
      "  FROM CashbackCredit",
      "  GROUP BY campaign_code, user_id",
      "), windows AS (",
      "  SELECT f.campaign_code, f.user_id,",
      "         COALESCE(SUM(CASE WHEN p.paid_on BETWEEN DATE_SUB(f.ref_day, INTERVAL 14 DAY) AND DATE_SUB(f.ref_day, INTERVAL 1 DAY) THEN p.amount END), 0) AS before_amt,",
      "         COALESCE(SUM(CASE WHEN p.paid_on BETWEEN DATE_ADD(f.ref_day, INTERVAL 1 DAY) AND DATE_ADD(f.ref_day, INTERVAL 14 DAY) THEN p.amount END), 0) AS after_amt",
      "  FROM firsts f",
      "  LEFT JOIN UserPayment p ON p.user_id = f.user_id",
      "  GROUP BY f.campaign_code, f.user_id",
      "), paid AS (",
      "  SELECT campaign_code, SUM(amount) AS cashback_paid FROM CashbackCredit GROUP BY campaign_code",
      ")",
      "SELECT w.campaign_code, COUNT(*) AS users, p.cashback_paid,",
      "       SUM(w.before_amt) AS spend_before, SUM(w.after_amt) AS spend_after,",
      "       SUM(w.after_amt) - SUM(w.before_amt) AS uplift",
      "FROM windows w",
      "JOIN paid p ON p.campaign_code = w.campaign_code",
      "GROUP BY w.campaign_code, p.cashback_paid",
      "ORDER BY uplift DESC, w.campaign_code",
    ].join("\n"),
    alternatives: [
      [
        "WITH firsts AS (SELECT campaign_code, user_id, MIN(credited_on) AS ref_day FROM CashbackCredit GROUP BY campaign_code, user_id),",
        "per_user AS (",
        "  SELECT f.campaign_code,",
        "         IFNULL((SELECT SUM(p.amount) FROM UserPayment p WHERE p.user_id = f.user_id AND DATEDIFF(f.ref_day, p.paid_on) BETWEEN 1 AND 14), 0) AS b,",
        "         IFNULL((SELECT SUM(p.amount) FROM UserPayment p WHERE p.user_id = f.user_id AND DATEDIFF(p.paid_on, f.ref_day) BETWEEN 1 AND 14), 0) AS a",
        "  FROM firsts f",
        ")",
        "SELECT u.campaign_code, COUNT(*) AS users,",
        "       (SELECT SUM(c.amount) FROM CashbackCredit c WHERE c.campaign_code = u.campaign_code) AS cashback_paid,",
        "       SUM(u.b) AS spend_before, SUM(u.a) AS spend_after, SUM(u.a - u.b) AS uplift",
        "FROM per_user u",
        "GROUP BY u.campaign_code",
        "ORDER BY uplift DESC, u.campaign_code",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Work at the (campaign, user) level first, with the reference day = their earliest credit in the campaign.",
      "The two windows are date ranges relative to that day — `DATE_SUB`/`DATE_ADD` or `DATEDIFF` between 1 and 14.",
      "Total cashback paid is a separate aggregate over every credit; don't let the payment join multiply it.",
      "A user with no payments in a window contributes 0, not NULL.",
    ],
    editorial: [
      "Break the report into levels. **Per (campaign, user)**: the reference day is `MIN(credited_on)`, so user 1's second Holi credit on 20 March does not move their windows. Joining that row to the user's payments and summing with two conditional expressions gives the spend in each window: `BETWEEN ref − 14 AND ref − 1` before, `BETWEEN ref + 1 AND ref + 14` after. Both ends are inclusive, so a payment exactly 14 days away counts, one 15 days away does not, and the reference day's own payment (user 1's 999) falls in neither. The `LEFT JOIN` keeps users with no payments, and `COALESCE(…, 0)` turns their empty sums into 0.",
      "",
      "**Per campaign**: add the users' windows and count the users. `cashback_paid` must include *every* credit, but joining credits to payments would repeat each credit once per payment, so it is computed separately (the `paid` CTE) and joined on the campaign. `uplift` is the after total minus the before total.",
      "",
      "The alternative expresses the windows with `DATEDIFF(...) BETWEEN 1 AND 14` in correlated subqueries and fetches the cashback total with a scalar subquery. Payments of a user who is in two campaigns are counted once per campaign, which is the intended reading — each campaign is judged on its own.",
    ].join("\n"),
  },

  {
    slug: "paytm-return-flights-booked-within-ten-days",
    title: "Paytm: Return Flights Booked Within Ten Days",
    difficulty: "HARD",
    topics: ["Joins", "Window Functions", "Dates"],
    description: [
      "The flights team wants to know how often a one-way ticket is followed by the trip home, to decide where to offer round-trip fares.",
      "",
      "For every **confirmed** ticket (the outbound), find the same user's earliest **confirmed** ticket in the opposite direction (from the outbound's `to_airport` to its `from_airport`) that departs **1 to 10 days after** the outbound's `departs_on`, inclusive. If several such tickets share the earliest date, take the smallest `ticket_id`. Return `user_id`, `outbound_ticket`, `return_ticket` and `days_away` (days between the two departures) for every outbound that has a return. Return the rows **ordered by `user_id`**, then `outbound_ticket`.",
    ].join("\n"),
    tables: [
      {
        name: "FlightTicket",
        columns: [
          { name: "ticket_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "from_airport", type: "char" },
          { name: "to_airport", type: "char" },
          { name: "departs_on", type: "date" },
          { name: "status", type: "enum", values: ["confirmed", "cancelled"] },
        ],
        primaryKey: ["ticket_id"],
        note: "One row per one-way ticket bought on the app; airports are three-letter codes.",
      },
    ],
    examples: [
      {
        FlightTicket: [
          [1, 1, "DEL", "BOM", "2025-05-01", "confirmed"],
          [2, 1, "BOM", "DEL", "2025-05-08", "confirmed"],
          [3, 1, "BOM", "DEL", "2025-05-09", "confirmed"],
          [4, 2, "BLR", "GOI", "2025-05-10", "confirmed"],
          [5, 2, "GOI", "BLR", "2025-05-15", "cancelled"],
          [6, 2, "GOI", "BLR", "2025-05-20", "confirmed"],
          [7, 3, "HYD", "MAA", "2025-05-01", "confirmed"],
          [8, 3, "MAA", "HYD", "2025-05-12", "confirmed"],
          [9, 4, "CCU", "DEL", "2025-05-03", "confirmed"],
          [10, 4, "DEL", "CCU", "2025-05-03", "confirmed"],
          [11, 2, "GOI", "BLR", "2025-05-20", "confirmed"],
        ],
      },
    ],
    gen: (rng) => {
      const users = ri(rng, 1, 5);
      const rows: Cell[][] = [];
      let id = 1;
      for (let u = 1; u <= users; u++) {
        const [a, b] = sample(rng, AIRPORTS, 2) as [string, string];
        const k = ri(rng, 1, 6);
        for (let j = 0; j < k; j++) {
          const forward = chance(rng, 0.5);
          rows.push([id++, u, forward ? a : b, forward ? b : a, dateBetween(rng, "2025-05-01", "2025-05-25"), chance(rng, 0.15) ? "cancelled" : "confirmed"]);
        }
        if (chance(rng, 0.4)) {
          const d = dateBetween(rng, "2025-05-01", "2025-05-15");
          rows.push([id++, u, a, b, d, "confirmed"]);
          rows.push([id++, u, b, a, addDays(d, pick(rng, [0, 1, 10, 11])), "confirmed"]);
        }
      }
      return { FlightTicket: shuffle(rng, rows) };
    },
    solution: [
      "WITH pairs AS (",
      "  SELECT o.user_id, o.ticket_id AS outbound_ticket, r.ticket_id AS return_ticket,",
      "         DATEDIFF(r.departs_on, o.departs_on) AS days_away,",
      "         ROW_NUMBER() OVER (PARTITION BY o.ticket_id ORDER BY r.departs_on, r.ticket_id) AS pick_no",
      "  FROM FlightTicket o",
      "  JOIN FlightTicket r",
      "    ON r.user_id = o.user_id",
      "   AND r.from_airport = o.to_airport",
      "   AND r.to_airport = o.from_airport",
      "   AND r.status = 'confirmed'",
      "   AND r.departs_on BETWEEN DATE_ADD(o.departs_on, INTERVAL 1 DAY) AND DATE_ADD(o.departs_on, INTERVAL 10 DAY)",
      "  WHERE o.status = 'confirmed'",
      ")",
      "SELECT user_id, outbound_ticket, return_ticket, days_away",
      "FROM pairs",
      "WHERE pick_no = 1",
      "ORDER BY user_id, outbound_ticket",
    ].join("\n"),
    alternatives: [
      [
        "SELECT o.user_id, o.ticket_id AS outbound_ticket, r.ticket_id AS return_ticket, DATEDIFF(r.departs_on, o.departs_on) AS days_away",
        "FROM FlightTicket o",
        "JOIN FlightTicket r ON r.user_id = o.user_id AND r.from_airport = o.to_airport AND r.to_airport = o.from_airport",
        " AND r.status = 'confirmed' AND DATEDIFF(r.departs_on, o.departs_on) BETWEEN 1 AND 10",
        "WHERE o.status = 'confirmed'",
        "  AND NOT EXISTS (",
        "    SELECT 1 FROM FlightTicket x",
        "    WHERE x.user_id = o.user_id AND x.from_airport = o.to_airport AND x.to_airport = o.from_airport",
        "      AND x.status = 'confirmed' AND DATEDIFF(x.departs_on, o.departs_on) BETWEEN 1 AND 10",
        "      AND (x.departs_on < r.departs_on OR (x.departs_on = r.departs_on AND x.ticket_id < r.ticket_id))",
        "  )",
        "ORDER BY o.user_id, o.ticket_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Join the tickets to themselves: one copy is the outbound, the other a candidate return by the same user.",
      "A return goes the opposite way — its `from_airport` is the outbound's `to_airport` and vice versa — and departs 1 to 10 days later.",
      "Several candidates may match; rank them by date and id per outbound and keep the first.",
    ],
    editorial: [
      "Matching a ticket with a later ticket of the same user is a **self join**. The outbound copy `o` is any confirmed ticket; the return copy `r` must belong to the same user, fly the reverse route (`r.from_airport = o.to_airport AND r.to_airport = o.from_airport`), be confirmed, and depart between one and ten days after the outbound. Putting the date window in the join condition with `DATE_ADD` keeps same-day tickets out (user 4's two flights on 3 May) and stops at ten days inclusive (user 2's 20 May return is exactly ten days; user 3's eleven-day gap is too long). Cancelled tickets are excluded on both sides, so user 2's cancelled 15 May ticket cannot be the return.",
      "",
      "An outbound can match several returns — user 1 has tickets home on 8 and 9 May, and user 2 has two on 20 May. `ROW_NUMBER() OVER (PARTITION BY o.ticket_id ORDER BY r.departs_on, r.ticket_id)` ranks them, and `pick_no = 1` keeps the earliest date, smallest id on a tie. Every confirmed ticket is tried as an outbound, so a ticket home is itself checked for a return and simply finds none.",
      "",
      "The alternative keeps a pair when **no** other qualifying return is earlier, or equally early with a smaller id — the `NOT EXISTS` form of \"the first one\". Both are a self join on `(user_id, from_airport, to_airport)`.",
    ].join("\n"),
  },
];
