import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, atTime, chance, dateBetween, FIRST_NAMES, names, pick, ri, roundTo, sample, shuffle } from "./kit.js";

/**
 * Company set — PhonePe: the questions a data analyst or engineer at a UPI
 * payments app is handed in a normal week — UPI Lite caps, QR stickers that
 * never earned, linked bank accounts, collect requests, decline codes by
 * remitter bank, P2P against P2M value, Pulse-style district volumes,
 * in-app insurance and Share.Market orders, Pincode partner stores,
 * scratch-card rewards, cross-product adoption, retry recovery, downtime
 * runs and fraud rings. The schemas and every number are invented for
 * practice; none of it is PhonePe's real data or real schema. Easiest first.
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

const BANKS = ["SBI", "HDFC", "ICICI", "Axis", "Kotak", "BOB", "PNB", "Canara"] as const;
const HANDLES = ["ybl", "ibl", "axl"] as const;
const OTHER_HANDLES = ["okaxis", "oksbi", "okhdfcbank", "upi"] as const;
const DECLINE_CODES = ["U30", "Z9", "ZM", "XH", "U16", "U69"] as const;
const SHOPS = [
  "Sharma Kirana", "Fresh Basket", "Annapurna Stores", "Daily Needs Mart", "Green Leaf Grocers",
  "Balaji Provisions", "City Medicals", "Om Sai Traders", "Lakshmi Sweets", "Raju Tea Stall",
] as const;
const SYMBOLS = ["INFY", "ITC", "SBIN", "TCS", "HDFCBANK", "RELIANCE"] as const;
const INSURERS = ["Suraksha General", "Kavach Health", "Raksha Life", "Sahyog Insurance", "Nirbhay Assure"] as const;
const STATE_DISTRICTS: Record<string, readonly string[]> = {
  Karnataka: ["Bengaluru Urban", "Mysuru", "Belagavi", "Dharwad", "Udupi"],
  Maharashtra: ["Pune", "Mumbai Suburban", "Nagpur", "Thane", "Nashik"],
  Telangana: ["Hyderabad", "Rangareddy", "Warangal", "Medchal", "Karimnagar"],
  "Uttar Pradesh": ["Lucknow", "Ghaziabad", "Kanpur Nagar", "Prayagraj", "Varanasi"],
};
const STATES = Object.keys(STATE_DISTRICTS);

/** A VPA handle like `ravi.k42` or a 10-digit mobile number. */
const handleOf = (rng: () => number, name: string): string => {
  const base = name.toLowerCase();
  const r = rng();
  if (r < 0.2) return String(ri(rng, 7000000000, 9999999999));
  if (r < 0.45) return base;
  if (r < 0.7) return `${base}.${String.fromCharCode(97 + ri(rng, 0, 25))}${ri(rng, 1, 99)}`;
  return `${base}${ri(rng, 1, 999)}`;
};

export const COMPANY_PHONEPE: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "phonepe-upi-lite-payments-above-the-cap",
    title: "PhonePe: UPI Lite Payments Above the Per-Payment Cap",
    difficulty: "EASY",
    topics: ["Basics"],
    description: [
      "UPI Lite pays small amounts from an on-device balance without a UPI PIN, so the risk team caps a single Lite payment at **₹500**. After a release, they want to see whether any payment slipped past the cap.",
      "",
      "Return every **successful** Lite payment whose `amount` is **strictly greater than 500**, with the columns `payment_id`, `user_id` and `amount`. A payment of exactly 500 is within the cap, and failed payments moved no money. Order the rows by `amount` from highest to lowest, then by `payment_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "LitePayment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "paid_at", type: "datetime" },
          { name: "status", type: "enum", values: ["success", "failed"] },
        ],
        primaryKey: ["payment_id"],
        note: "One row per UPI Lite payment attempt; `amount` is in whole rupees.",
      },
    ],
    examples: [
      {
        LitePayment: [
          [1, 101, 500, "2025-02-03 09:12:40", "success"],
          [2, 102, 820, "2025-02-03 10:05:11", "success"],
          [3, 101, 750, "2025-02-04 18:30:02", "failed"],
          [4, 103, 501, "2025-02-05 08:00:59", "success"],
          [5, 104, 820, "2025-02-05 13:44:20", "success"],
          [6, 102, 120, "2025-02-06 21:10:00", "success"],
          [7, 105, 1000, "2025-02-07 07:15:33", "success"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 22);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 101, 112),
        chance(rng, 0.3) ? pick(rng, [499, 500, 500, 501, 820, 1000]) : roundTo(rng, 20, 1200, 10),
        atTime(rng, dateBetween(rng, "2025-02-01", "2025-02-28")),
        chance(rng, 0.8) ? "success" : "failed",
      ]);
      return { LitePayment: rows };
    },
    solution: [
      "SELECT payment_id, user_id, amount",
      "FROM LitePayment",
      "WHERE status = 'success'",
      "  AND amount > 500",
      "ORDER BY amount DESC, payment_id",
    ].join("\n"),
    alternatives: [
      "SELECT payment_id, user_id, amount FROM LitePayment WHERE status IN ('success') AND NOT amount <= 500 ORDER BY amount DESC, payment_id ASC",
      "SELECT payment_id, user_id, amount FROM LitePayment WHERE amount >= 501 AND status <> 'failed' ORDER BY 3 DESC, 1",
    ],
    ordered: true,
    hints: [
      "Two conditions must hold together: the payment succeeded, and it is over the cap.",
      "\"Strictly greater than 500\" leaves a payment of exactly 500 out.",
      "Sort by two keys: amount descending first, then the id to settle equal amounts.",
    ],
    editorial: [
      "This is a filter and a sort on one table. A payment is a breach of the cap only if it actually went through, so `status = 'success'` is the first condition; a failed attempt above ₹500 moved no money and is not a breach. The second is `amount > 500` — strict, because a payment of exactly the cap is allowed.",
      "",
      "The order is fixed by the statement, so the query needs a full `ORDER BY`: `amount DESC` puts the biggest breaches first, and `payment_id` breaks a tie between two payments of the same amount, which is what makes the result the same however the rows are stored.",
      "",
      "The alternatives write the same conditions differently — `NOT amount <= 500`, `amount >= 501` for whole-rupee amounts, and `status <> 'failed'`, which is the same test while there are only two statuses. One pass over the table; an index on `(status, amount)` would read only the breaches.",
    ].join("\n"),
  },

  {
    slug: "phonepe-qr-stickers-that-never-took-a-payment",
    title: "PhonePe: QR Stickers That Never Took a Successful Payment",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "Field sales agents put PhonePe QR stickers up at shops. The merchant team wants a revisit list: stickers that have **never received a successful payment**, because the shop may have taken the sticker down or never told customers about it.",
      "",
      "Return `sticker_id` and `merchant_name` for every such sticker. Failed and pending payments do not count as a payment taken, so a sticker whose only scans failed is on the list. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "QrSticker",
        columns: [
          { name: "sticker_id", type: "int" },
          { name: "merchant_name", type: "varchar" },
          { name: "city", type: "varchar" },
          { name: "installed_on", type: "date" },
        ],
        primaryKey: ["sticker_id"],
        note: "One row per QR sticker put up at a shop.",
      },
      {
        name: "QrPayment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "sticker_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["success", "failed", "pending"] },
        ],
        primaryKey: ["payment_id"],
        note: "One row per payment made by scanning a sticker; `sticker_id` always names a sticker.",
      },
    ],
    examples: [
      {
        QrSticker: [
          [501, "Sharma Kirana", "Pune", "2025-01-04"],
          [502, "Raju Tea Stall", "Pune", "2025-01-06"],
          [503, "City Medicals", "Nagpur", "2025-01-09"],
          [504, "Lakshmi Sweets", "Nashik", "2025-01-11"],
          [505, "Om Sai Traders", "Pune", "2025-01-15"],
        ],
        QrPayment: [
          [1, 501, 240, "success"],
          [2, 501, 60, "failed"],
          [3, 503, 410, "failed"],
          [4, 503, 410, "pending"],
          [5, 505, 35, "success"],
          [6, 505, 90, "success"],
        ],
      },
    ],
    gen: (rng) => {
      const stickers = sample(rng, SHOPS, ri(rng, 1, 8)).map((name, i): Cell[] => [
        501 + i, name, pick(rng, ["Pune", "Nagpur", "Nashik", "Thane"]), dateBetween(rng, "2025-01-01", "2025-02-28"),
      ]);
      const n = chance(rng, 0.08) ? 0 : ri(rng, 1, 18);
      const pays: Cell[][] = seq(1, n).map((id) => [
        id, 501 + ri(rng, 0, stickers.length - 1), roundTo(rng, 10, 900, 5), pick(rng, ["success", "success", "failed", "pending"]),
      ]);
      return { QrSticker: stickers, QrPayment: pays };
    },
    solution: [
      "SELECT s.sticker_id, s.merchant_name",
      "FROM QrSticker s",
      "LEFT JOIN QrPayment p ON p.sticker_id = s.sticker_id AND p.status = 'success'",
      "WHERE p.payment_id IS NULL",
    ].join("\n"),
    alternatives: [
      "SELECT sticker_id, merchant_name FROM QrSticker s WHERE NOT EXISTS (SELECT 1 FROM QrPayment p WHERE p.sticker_id = s.sticker_id AND p.status = 'success')",
      "SELECT sticker_id, merchant_name FROM QrSticker WHERE sticker_id NOT IN (SELECT sticker_id FROM QrPayment WHERE status = 'success')",
    ],
    hints: [
      "You are looking for stickers that have no matching row of a certain kind — an anti join.",
      "Only successful payments are a match; decide where that condition goes.",
      "With a LEFT JOIN, a status filter in WHERE would throw away the unmatched stickers — put it in the ON clause.",
    ],
    editorial: [
      "The question is about something that did not happen, which is an **anti join**: keep each sticker for which no successful payment exists. The cleanest way to say that is `NOT EXISTS` with a correlated subquery that looks for a payment on the same sticker with `status = 'success'`.",
      "",
      "The `LEFT JOIN` form needs care. The condition `p.status = 'success'` must sit in the `ON` clause, so a sticker whose payments all failed joins to nothing and comes out with NULLs, which `WHERE p.payment_id IS NULL` keeps. Put the status test in `WHERE` instead and that sticker's failed rows would join, then be filtered away, and the sticker would vanish from the answer — the classic outer-join mistake.",
      "",
      "`NOT IN` works here as well because `QrPayment.sticker_id` is never NULL; if it could be, a single NULL in the subquery would make `NOT IN` return nothing. All three read each table once with an index on `QrPayment(sticker_id, status)`.",
    ].join("\n"),
  },

  {
    slug: "phonepe-users-with-three-active-linked-banks",
    title: "PhonePe: Users With Three or More Active Linked Bank Accounts",
    difficulty: "EASY",
    topics: ["Aggregation"],
    description: [
      "A user can link several bank accounts to the app and later unlink some. The product team studying multi-bank users wants everyone who currently has **at least three active** linked accounts.",
      "",
      "Return `user_id` and `active_accounts`, the number of that user's links with `is_active = 1`. Two accounts at the same bank are two links and both count. Unlinked (inactive) rows are ignored. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "LinkedAccount",
        columns: [
          { name: "link_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "bank_name", type: "varchar" },
          { name: "linked_on", type: "date" },
          { name: "is_active", type: "bool" },
        ],
        primaryKey: ["link_id"],
        note: "One row per bank account a user has linked; `is_active` is 0 once the user unlinks it.",
      },
    ],
    examples: [
      {
        LinkedAccount: [
          [1, 11, "SBI", "2023-04-02", 1],
          [2, 11, "HDFC", "2023-09-18", 1],
          [3, 11, "HDFC", "2024-01-07", 1],
          [4, 12, "ICICI", "2023-06-11", 1],
          [5, 12, "Axis", "2023-07-21", 1],
          [6, 12, "Kotak", "2024-02-14", 0],
          [7, 13, "SBI", "2022-12-30", 1],
          [8, 13, "PNB", "2023-03-03", 1],
          [9, 13, "BOB", "2024-05-05", 1],
          [10, 13, "Canara", "2024-08-09", 1],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      for (const user of seq(11, ri(rng, 1, 7))) {
        const k = ri(rng, 0, 5);
        for (let i = 0; i < k; i++) rows.push([id++, user, pick(rng, BANKS), dateBetween(rng, "2022-01-01", "2025-03-31"), chance(rng, 0.8) ? 1 : 0]);
      }
      return { LinkedAccount: shuffle(rng, rows) };
    },
    solution: [
      "SELECT user_id, COUNT(*) AS active_accounts",
      "FROM LinkedAccount",
      "WHERE is_active = 1",
      "GROUP BY user_id",
      "HAVING COUNT(*) >= 3",
    ].join("\n"),
    alternatives: [
      "SELECT user_id, SUM(is_active) AS active_accounts FROM LinkedAccount GROUP BY user_id HAVING SUM(is_active) >= 3",
      "SELECT user_id, active_accounts FROM (SELECT user_id, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_accounts FROM LinkedAccount GROUP BY user_id) t WHERE active_accounts >= 3",
    ],
    hints: [
      "Count rows per user — but only the active ones.",
      "`WHERE` filters rows before grouping; `HAVING` filters the groups after counting.",
      "The bank name does not matter: two HDFC accounts are two links.",
    ],
    editorial: [
      "Each row is one link, so the number of active links per user is a count of rows after dropping the inactive ones: filter with `WHERE is_active = 1`, group by `user_id`, and count. The threshold applies to the count, which only exists after grouping, so it goes in `HAVING COUNT(*) >= 3`.",
      "",
      "Nothing is deduplicated by bank — the statement says two accounts at the same bank both count — so `COUNT(*)` is right and `COUNT(DISTINCT bank_name)` would be wrong for user 11 in the example. A user whose links are all inactive has no rows left after `WHERE` and never forms a group.",
      "",
      "Because `is_active` is 0 or 1, summing it counts the active links without a `WHERE`, which is the first alternative; the second does the conditional count in a derived table and filters outside it. All three are one scan and a hash aggregate over users.",
    ].join("\n"),
  },

  {
    slug: "phonepe-insurance-premium-by-product-line-2025",
    title: "PhonePe: In-App Insurance Premium by Product Line in 2025",
    difficulty: "EASY",
    topics: ["Aggregation", "Dates"],
    description: [
      "Users can buy motor, health, term life and travel cover inside the app. The insurance business team wants the 2025 sales by product line, leaving out policies cancelled in the free-look period, since their premium was refunded.",
      "",
      "For policies **purchased in calendar year 2025** whose `status` is **not** `cancelled_free_look`, return `product_line`, `policies` (how many) and `total_premium` (their premium summed). Product lines with no such policy do not appear. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "InsurancePolicy",
        columns: [
          { name: "policy_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "product_line", type: "enum", values: ["motor", "health", "term_life", "travel"] },
          { name: "premium", type: "int" },
          { name: "purchased_on", type: "date" },
          { name: "status", type: "enum", values: ["active", "expired", "cancelled_free_look"] },
        ],
        primaryKey: ["policy_id"],
        note: "One row per policy sold in the app; `premium` is the amount paid in rupees.",
      },
    ],
    examples: [
      {
        InsurancePolicy: [
          [1, 21, "motor", 6400, "2025-01-01", "active"],
          [2, 22, "health", 11800, "2025-03-14", "active"],
          [3, 23, "health", 9200, "2025-06-02", "cancelled_free_look"],
          [4, 21, "travel", 450, "2025-04-20", "expired"],
          [5, 24, "motor", 7100, "2024-12-31", "active"],
          [6, 25, "motor", 5300, "2025-12-31", "active"],
          [7, 26, "term_life", 14500, "2026-01-01", "active"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 24);
      const lines = sample(rng, ["motor", "health", "term_life", "travel"], ri(rng, 2, 4));
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 21, 35),
        pick(rng, lines),
        roundTo(rng, 300, 18000, 100),
        chance(rng, 0.2) ? pick(rng, ["2024-12-31", "2025-01-01", "2025-12-31", "2026-01-01"]) : dateBetween(rng, "2024-11-01", "2026-01-31"),
        pick(rng, ["active", "active", "expired", "cancelled_free_look"]),
      ]);
      return { InsurancePolicy: rows };
    },
    solution: [
      "SELECT product_line, COUNT(*) AS policies, SUM(premium) AS total_premium",
      "FROM InsurancePolicy",
      "WHERE purchased_on BETWEEN '2025-01-01' AND '2025-12-31'",
      "  AND status <> 'cancelled_free_look'",
      "GROUP BY product_line",
    ].join("\n"),
    alternatives: [
      "SELECT product_line, COUNT(policy_id) AS policies, SUM(premium) AS total_premium FROM InsurancePolicy WHERE YEAR(purchased_on) = 2025 AND status IN ('active', 'expired') GROUP BY product_line",
    ],
    hints: [
      "Filter to 2025 purchases and drop the free-look cancellations before grouping.",
      "Both 1 January and 31 December belong to the year.",
      "One `GROUP BY product_line` gives both the count and the sum.",
    ],
    editorial: [
      "The report is one group per product line, so the shape is `WHERE` → `GROUP BY product_line` → `COUNT(*)` and `SUM(premium)`. The two exclusions are row-level facts and belong in `WHERE`: a policy bought outside 2025 is not part of the year, and a policy cancelled during free look had its premium refunded, so it is neither a sale nor revenue.",
      "",
      "The year test must include both ends: `BETWEEN '2025-01-01' AND '2025-12-31'` does that for a `date` column, and `YEAR(purchased_on) = 2025` says the same thing, as the alternative shows (though a function on the column stops an index range scan). A product line whose only 2025 policies were cancelled loses all its rows in `WHERE`, forms no group, and is left out, as the statement asks.",
      "",
      "Writing the status test as `IN ('active', 'expired')` is equivalent while the enum has three values; `<>` keeps working if a new status is added later. The query is a single scan and a small aggregate.",
    ].join("\n"),
  },

  {
    slug: "phonepe-masked-upi-ids-on-receipts",
    title: "PhonePe: Masked UPI IDs on Payment Receipts",
    difficulty: "EASY",
    topics: ["Strings"],
    description: [
      "A shared payment receipt should not reveal the full UPI ID of the person paid. The receipts team masks each UPI ID (`vpa`, written `handle@provider`) before printing it.",
      "",
      "Return `payee_id` and `masked_vpa`: keep the **first two characters** of the handle, replace **every other character of the handle** with `*`, and keep the `@` and the provider unchanged. So `ravi.k99@ybl` becomes `ra******@ybl`, and a two-character handle such as `om@axl` stays as it is. Every `vpa` has exactly one `@` and a handle of at least two characters. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Payee",
        columns: [
          { name: "payee_id", type: "int" },
          { name: "display_name", type: "varchar" },
          { name: "vpa", type: "varchar" },
        ],
        primaryKey: ["payee_id"],
        note: "One row per saved payee; `vpa` is the UPI ID, a handle and a provider joined by `@`.",
      },
    ],
    examples: [
      {
        Payee: [
          [1, "Ravi Kumar", "ravi.k99@ybl"],
          [2, "Anita Shah", "9876543210@ibl"],
          [3, "Om Prakash", "om@axl"],
          [4, "Sneha Rao", "sneharao@okaxis"],
          [5, "Dev Menon", "dev@upi"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const who = sample(rng, FIRST_NAMES, n);
      const rows: Cell[][] = seq(1, n).map((id, i) => {
        const handle = chance(rng, 0.1) ? who[i]!.toLowerCase().slice(0, 2) : handleOf(rng, who[i]!);
        return [id, who[i]!, `${handle}@${chance(rng, 0.7) ? pick(rng, HANDLES) : pick(rng, OTHER_HANDLES)}`];
      });
      return { Payee: rows };
    },
    solution: [
      "SELECT payee_id,",
      "       CONCAT(LEFT(vpa, 2), REPEAT('*', LOCATE('@', vpa) - 3), SUBSTRING(vpa, LOCATE('@', vpa))) AS masked_vpa",
      "FROM Payee",
    ].join("\n"),
    alternatives: [
      "SELECT payee_id, CONCAT(SUBSTRING(vpa, 1, 2), REPEAT('*', CHAR_LENGTH(SUBSTRING_INDEX(vpa, '@', 1)) - 2), '@', SUBSTRING_INDEX(vpa, '@', -1)) AS masked_vpa FROM Payee",
      "SELECT payee_id, CONCAT(LEFT(vpa, 2), RPAD('', INSTR(vpa, '@') - 3, '*'), RIGHT(vpa, CHAR_LENGTH(vpa) - INSTR(vpa, '@') + 1)) AS masked_vpa FROM Payee",
    ],
    hints: [
      "Split the string into three parts: the first two characters, the rest of the handle, and `@provider`.",
      "`LOCATE('@', vpa)` tells you where the handle ends, and so how long it is.",
      "`REPEAT('*', n)` builds the mask; with n = 0 it is the empty string.",
    ],
    editorial: [
      "Masking is string surgery in three pieces glued with `CONCAT`. The first piece is `LEFT(vpa, 2)`. The last piece is everything from the `@` on, `SUBSTRING(vpa, LOCATE('@', vpa))`, which keeps the provider exactly as stored. The middle is one `*` per hidden character.",
      "",
      "How many characters are hidden? The handle ends just before the `@`, so its length is `LOCATE('@', vpa) - 1`, and two of those are shown: `LOCATE('@', vpa) - 3` stars. For a two-character handle that is zero, and `REPEAT('*', 0)` is the empty string, so `om@axl` comes out unchanged — the edge case the statement calls out. A numeric handle is masked the same way as a name; nothing depends on letter case.",
      "",
      "The alternatives cut the parts with `SUBSTRING_INDEX` (the text before the first `@`, and after the last one — the same `@` here) or build the mask with `RPAD('', n, '*')`. Each row is handled on its own, so the cost is one scan.",
    ].join("\n"),
  },

  {
    slug: "phonepe-collect-requests-pending-past-expiry",
    title: "PhonePe: Collect Requests Still Pending After Their Expiry",
    difficulty: "EASY",
    topics: ["Dates"],
    description: [
      "A collect request asks a payer to approve a payment before `expires_at`. A sweeper job should flip unanswered requests to `expired`; on-call suspects it stalled. At the audit time **2025-03-10 12:00:00** they want every request still `pending` whose expiry has **already passed**.",
      "",
      "Return `request_id`, `payer_vpa`, `amount` and `minutes_overdue`, the whole minutes from `expires_at` to the audit time. A request expiring exactly at the audit time is not overdue yet. Order the rows by `minutes_overdue` from most to least, then by `request_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "CollectRequest",
        columns: [
          { name: "request_id", type: "int" },
          { name: "requester_vpa", type: "varchar" },
          { name: "payer_vpa", type: "varchar" },
          { name: "amount", type: "int" },
          { name: "created_at", type: "datetime" },
          { name: "expires_at", type: "datetime" },
          { name: "status", type: "enum", values: ["pending", "approved", "declined", "expired"] },
        ],
        primaryKey: ["request_id"],
        note: "One row per collect request; times are whole minutes.",
      },
    ],
    examples: [
      {
        CollectRequest: [
          [1, "shop.fresh@ybl", "aarav@ibl", 450, "2025-03-09 10:00:00", "2025-03-09 10:30:00", "pending"],
          [2, "kabir22@ybl", "diya.m4@axl", 1200, "2025-03-10 09:00:00", "2025-03-10 12:00:00", "pending"],
          [3, "kabir22@ybl", "meera@ybl", 300, "2025-03-10 11:00:00", "2025-03-10 11:15:00", "pending"],
          [4, "zara@ibl", "rohan9@ybl", 800, "2025-03-08 08:00:00", "2025-03-08 09:00:00", "approved"],
          [5, "shop.fresh@ybl", "ishaan@axl", 650, "2025-03-10 11:30:00", "2025-03-10 12:30:00", "pending"],
          [6, "zara@ibl", "neha@ybl", 90, "2025-03-10 10:45:00", "2025-03-10 11:15:00", "pending"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 18);
      const who = names(rng, 12).map((x) => x.toLowerCase());
      const rows: Cell[][] = seq(1, n).map((id) => {
        const made = ri(rng, 0, 3540);
        const exp = chance(rng, 0.12) ? 3600 : made + pick(rng, [15, 30, 30, 60, 1440]);
        return [
          id, `${pick(rng, who)}@${pick(rng, HANDLES)}`, `${pick(rng, who)}@${pick(rng, HANDLES)}`, roundTo(rng, 10, 2000, 10),
          at("2025-03-08", made), at("2025-03-08", exp), pick(rng, ["pending", "pending", "pending", "approved", "declined", "expired"]),
        ];
      });
      return { CollectRequest: rows };
    },
    solution: [
      "SELECT request_id, payer_vpa, amount,",
      "       TIMESTAMPDIFF(MINUTE, expires_at, '2025-03-10 12:00:00') AS minutes_overdue",
      "FROM CollectRequest",
      "WHERE status = 'pending'",
      "  AND expires_at < '2025-03-10 12:00:00'",
      "ORDER BY minutes_overdue DESC, request_id",
    ].join("\n"),
    alternatives: [
      "SELECT request_id, payer_vpa, amount, TIMESTAMPDIFF(SECOND, expires_at, '2025-03-10 12:00:00') DIV 60 AS minutes_overdue FROM CollectRequest WHERE status = 'pending' AND TIMESTAMPDIFF(SECOND, expires_at, '2025-03-10 12:00:00') > 0 ORDER BY 4 DESC, 1",
    ],
    ordered: true,
    hints: [
      "Two filters: the request is still pending, and its expiry is before the audit time.",
      "`TIMESTAMPDIFF(MINUTE, earlier, later)` gives the gap in whole minutes.",
      "A strict `<` leaves out a request expiring exactly at 12:00:00.",
    ],
    editorial: [
      "A request is stuck when two facts hold: nobody answered it (`status = 'pending'`) and its window has closed (`expires_at < '2025-03-10 12:00:00'`). Datetimes in the fixed `YYYY-MM-DD HH:MM:SS` form compare correctly, so the second test is a plain comparison. It is strict, because at exactly 12:00:00 the request has not expired yet.",
      "",
      "How late it is comes from `TIMESTAMPDIFF(MINUTE, expires_at, audit_time)`: the first argument is the earlier time, so the result is positive for every row the filter keeps. Approved, declined and already-expired requests are excluded by the status test even when their expiry is in the past.",
      "",
      "The order is fixed: most overdue first, and `request_id` to settle two requests that expired in the same minute. The alternative measures in seconds and divides with `DIV 60`, which equals the minute count because every time is a whole minute. One scan; an index on `(status, expires_at)` would serve both filters.",
    ].join("\n"),
  },

  {
    slug: "phonepe-pincode-delivered-orders-per-store",
    title: "PhonePe: Delivered Pincode Orders per Partner Store, Zeros Included",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "The Pincode app routes grocery orders to neighbourhood partner stores. The partner team's weekly sheet lists **every** store with how many orders it delivered and their value, so stores with no deliveries stand out.",
      "",
      "Return `store_id`, `store_name`, `delivered_orders` and `delivered_value` for every store. Only orders with `status = 'delivered'` count; a store with none shows **0** in both columns, never NULL. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "PincodeStore",
        columns: [
          { name: "store_id", type: "int" },
          { name: "store_name", type: "varchar" },
          { name: "pincode", type: "varchar" },
        ],
        primaryKey: ["store_id"],
        note: "One row per partner store.",
      },
      {
        name: "PincodeOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "order_value", type: "int" },
          { name: "status", type: "enum", values: ["delivered", "cancelled", "returned"] },
          { name: "placed_on", type: "date" },
        ],
        primaryKey: ["order_id"],
        note: "One row per order; `store_id` always names a store.",
      },
    ],
    examples: [
      {
        PincodeStore: [
          [1, "Annapurna Stores", "560034"],
          [2, "Daily Needs Mart", "560038"],
          [3, "Green Leaf Grocers", "560102"],
          [4, "Balaji Provisions", "560095"],
        ],
        PincodeOrder: [
          [101, 1, 640, "delivered", "2025-05-05"],
          [102, 1, 220, "delivered", "2025-05-06"],
          [103, 1, 410, "cancelled", "2025-05-06"],
          [104, 2, 980, "returned", "2025-05-07"],
          [105, 3, 155, "delivered", "2025-05-08"],
          [106, 2, 300, "cancelled", "2025-05-09"],
        ],
      },
    ],
    gen: (rng) => {
      const stores = sample(rng, SHOPS, ri(rng, 1, 6)).map((name, i): Cell[] => [i + 1, name, `5600${pad(ri(rng, 1, 99))}`]);
      const n = chance(rng, 0.08) ? 0 : ri(rng, 1, 18);
      const orders: Cell[][] = seq(101, n).map((id) => [
        id, ri(rng, 1, stores.length), roundTo(rng, 50, 1500, 5), pick(rng, ["delivered", "delivered", "cancelled", "returned"]), dateBetween(rng, "2025-05-05", "2025-05-11"),
      ]);
      return { PincodeStore: stores, PincodeOrder: orders };
    },
    solution: [
      "SELECT s.store_id, s.store_name,",
      "       COUNT(o.order_id) AS delivered_orders,",
      "       COALESCE(SUM(o.order_value), 0) AS delivered_value",
      "FROM PincodeStore s",
      "LEFT JOIN PincodeOrder o ON o.store_id = s.store_id AND o.status = 'delivered'",
      "GROUP BY s.store_id, s.store_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT s.store_id, s.store_name,",
        "  (SELECT COUNT(*) FROM PincodeOrder o WHERE o.store_id = s.store_id AND o.status = 'delivered') AS delivered_orders,",
        "  (SELECT IFNULL(SUM(order_value), 0) FROM PincodeOrder o WHERE o.store_id = s.store_id AND o.status = 'delivered') AS delivered_value",
        "FROM PincodeStore s",
      ].join("\n"),
      "SELECT s.store_id, s.store_name, SUM(CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END) AS delivered_orders, SUM(CASE WHEN o.status = 'delivered' THEN o.order_value ELSE 0 END) AS delivered_value FROM PincodeStore s LEFT JOIN PincodeOrder o ON o.store_id = s.store_id GROUP BY s.store_id, s.store_name",
    ],
    hints: [
      "Every store must appear, so start from the store table and keep it whole.",
      "Put the delivered-only condition in the join, not in WHERE.",
      "`COUNT(column)` skips NULLs, but `SUM` of nothing is NULL — wrap it.",
    ],
    editorial: [
      "\"Every store, zeros included\" means the store table drives the query and is outer-joined to the orders. The delivered filter goes inside the `ON` clause, so a store with only cancelled or returned orders still keeps one row, padded with NULLs, instead of being removed by a `WHERE`.",
      "",
      "After grouping by store, `COUNT(o.order_id)` counts only real matches — the NULL padding of an unmatched store counts as 0, whereas `COUNT(*)` would wrongly report 1. `SUM(o.order_value)` over only NULLs is NULL, so `COALESCE(…, 0)` turns it into the 0 the sheet needs.",
      "",
      "The alternatives show two other routes: scalar subqueries per store (simple to read, two lookups per store), and a plain left join with conditional sums, where the `CASE` decides what counts and an unmatched store's NULL status adds 0. With an index on `PincodeOrder(store_id, status)` each is a linear pass.",
    ].join("\n"),
  },

  {
    slug: "phonepe-scratch-card-reward-labels",
    title: "PhonePe: Labelling Scratch Card Rewards for the Rewards Page",
    difficulty: "EASY",
    topics: ["Conditional Logic"],
    description: [
      "After a payment, users may get a scratch card. The rewards page shows one label per card, and the app team wants the labels computed in SQL so every client shows the same words.",
      "",
      "Return `card_id`, `user_id` and `label`, where the label is: `No reward` when `reward_type` is `none` **or** it is a cashback worth 0; `Jackpot` for a cashback of **100 or more**; `Cashback` for any other cashback; and `Voucher` for a voucher. `cashback_amount` is NULL exactly when the card is not a cashback. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "ScratchCard",
        columns: [
          { name: "card_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "reward_type", type: "enum", values: ["cashback", "voucher", "none"] },
          { name: "cashback_amount", type: "int" },
          { name: "issued_on", type: "date" },
        ],
        primaryKey: ["card_id"],
        note: "One row per scratch card; `cashback_amount` is in rupees and NULL for vouchers and empty cards.",
      },
    ],
    examples: [
      {
        ScratchCard: [
          [1, 31, "cashback", 12, "2025-04-01"],
          [2, 31, "none", null, "2025-04-01"],
          [3, 32, "cashback", 100, "2025-04-02"],
          [4, 33, "voucher", null, "2025-04-02"],
          [5, 33, "cashback", 0, "2025-04-03"],
          [6, 34, "cashback", 99, "2025-04-04"],
          [7, 35, "cashback", 250, "2025-04-05"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 16);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const type = pick(rng, ["cashback", "cashback", "cashback", "voucher", "none"]);
        const amt = type === "cashback" ? (chance(rng, 0.35) ? pick(rng, [0, 99, 100, 101]) : ri(rng, 1, 300)) : null;
        return [id, ri(rng, 31, 40), type, amt, dateBetween(rng, "2025-04-01", "2025-04-30")];
      });
      return { ScratchCard: rows };
    },
    solution: [
      "SELECT card_id, user_id,",
      "       CASE",
      "         WHEN reward_type = 'none' OR (reward_type = 'cashback' AND cashback_amount = 0) THEN 'No reward'",
      "         WHEN reward_type = 'voucher' THEN 'Voucher'",
      "         WHEN cashback_amount >= 100 THEN 'Jackpot'",
      "         ELSE 'Cashback'",
      "       END AS label",
      "FROM ScratchCard",
    ].join("\n"),
    alternatives: [
      "SELECT card_id, user_id, IF(reward_type = 'voucher', 'Voucher', IF(IFNULL(cashback_amount, 0) = 0, 'No reward', IF(cashback_amount >= 100, 'Jackpot', 'Cashback'))) AS label FROM ScratchCard",
      "SELECT card_id, user_id, 'Voucher' AS label FROM ScratchCard WHERE reward_type = 'voucher' UNION ALL SELECT card_id, user_id, 'No reward' FROM ScratchCard WHERE reward_type = 'none' OR cashback_amount = 0 UNION ALL SELECT card_id, user_id, 'Jackpot' FROM ScratchCard WHERE cashback_amount >= 100 UNION ALL SELECT card_id, user_id, 'Cashback' FROM ScratchCard WHERE cashback_amount BETWEEN 1 AND 99",
    ],
    hints: [
      "One `CASE` with its branches in the right order does the whole job.",
      "Check the empty cases first, so a cashback of 0 is not called Cashback.",
      "A comparison with NULL is never true — think about which branch a voucher's NULL amount reaches.",
    ],
    editorial: [
      "A searched `CASE` returns the result of the **first** branch whose condition is true, so the order of the branches is the specification. The empty outcomes come first: an empty card, or a cashback card worth 0, is `No reward`. Vouchers are next. What is left is a cashback with a positive amount, split at the boundary `>= 100` into `Jackpot` and `Cashback` — 100 itself is a jackpot, 99 is not.",
      "",
      "NULL needs a thought. For vouchers and empty cards `cashback_amount` is NULL, and `NULL >= 100` is unknown, not true — so a voucher must be caught by its own branch before the amount tests, or it would fall through to `ELSE 'Cashback'`. Listing the branches as above avoids that.",
      "",
      "The nested `IF` alternative folds the two empty cases into `IFNULL(cashback_amount, 0) = 0` after vouchers are handled. The `UNION ALL` alternative builds each label from its own filter; it works because the four filters are disjoint and cover every row. All are a single pass.",
    ].join("\n"),
  },

  // ──────────────────────────── MEDIUM ────────────────────────────
  {
    slug: "phonepe-most-frequent-decline-code-per-bank",
    title: "PhonePe: Most Frequent UPI Decline Code at Each Remitter Bank",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Window Functions"],
    description: [
      "When a UPI payment fails, the remitter bank (the payer's bank) answers with a decline code. The bank-partnerships team takes each bank's single most common code to its weekly call with that bank.",
      "",
      "For every bank with at least one failed transaction, return `remitter_bank`, `error_code` and `failures`, the number of failed transactions with that code. Keep only the code with the **most** failures at that bank; if several codes **tie** for the most, return all of them. Successful transactions have no code and do not count. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "UpiTxn",
        columns: [
          { name: "txn_id", type: "int" },
          { name: "remitter_bank", type: "varchar" },
          { name: "status", type: "enum", values: ["success", "failed"] },
          { name: "error_code", type: "varchar" },
          { name: "txn_at", type: "datetime" },
        ],
        primaryKey: ["txn_id"],
        note: "One row per UPI transaction; `error_code` is NULL for a success and set for every failure.",
      },
    ],
    examples: [
      {
        UpiTxn: [
          [1, "SBI", "failed", "U30", "2025-06-02 10:01:00"],
          [2, "SBI", "failed", "Z9", "2025-06-02 10:04:00"],
          [3, "SBI", "failed", "U30", "2025-06-02 11:20:00"],
          [4, "SBI", "success", null, "2025-06-02 11:25:00"],
          [5, "HDFC", "failed", "ZM", "2025-06-02 12:00:00"],
          [6, "HDFC", "failed", "XH", "2025-06-02 12:30:00"],
          [7, "HDFC", "success", null, "2025-06-02 13:10:00"],
          [8, "ICICI", "success", null, "2025-06-02 13:15:00"],
          [9, "SBI", "failed", "Z9", "2025-06-02 14:00:00"],
          [10, "SBI", "failed", "U30", "2025-06-02 15:45:00"],
        ],
      },
    ],
    gen: (rng) => {
      const banks = sample(rng, BANKS, ri(rng, 1, 4));
      const codes = sample(rng, DECLINE_CODES, ri(rng, 2, 4));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 4, 26);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const failed = chance(rng, 0.6);
        return [id, pick(rng, banks), failed ? "failed" : "success", failed ? pick(rng, codes) : null, atTime(rng, dateBetween(rng, "2025-06-01", "2025-06-07"))];
      });
      return { UpiTxn: rows };
    },
    solution: [
      "WITH counts AS (",
      "  SELECT remitter_bank, error_code, COUNT(*) AS failures",
      "  FROM UpiTxn",
      "  WHERE status = 'failed'",
      "  GROUP BY remitter_bank, error_code",
      "), ranked AS (",
      "  SELECT remitter_bank, error_code, failures,",
      "         RANK() OVER (PARTITION BY remitter_bank ORDER BY failures DESC) AS pos",
      "  FROM counts",
      ")",
      "SELECT remitter_bank, error_code, failures",
      "FROM ranked",
      "WHERE pos = 1",
    ].join("\n"),
    alternatives: [
      [
        "WITH counts AS (SELECT remitter_bank, error_code, COUNT(*) AS failures FROM UpiTxn WHERE status = 'failed' GROUP BY remitter_bank, error_code)",
        "SELECT c.remitter_bank, c.error_code, c.failures FROM counts c",
        "WHERE NOT EXISTS (SELECT 1 FROM counts d WHERE d.remitter_bank = c.remitter_bank AND d.failures > c.failures)",
      ].join("\n"),
      [
        "WITH counts AS (SELECT remitter_bank, error_code, COUNT(*) AS failures FROM UpiTxn WHERE status = 'failed' GROUP BY remitter_bank, error_code)",
        "SELECT c.remitter_bank, c.error_code, c.failures FROM counts c",
        "JOIN (SELECT remitter_bank, MAX(failures) AS top FROM counts GROUP BY remitter_bank) m ON m.remitter_bank = c.remitter_bank AND m.top = c.failures",
      ].join("\n"),
    ],
    hints: [
      "First count failures per bank and code; then compare the counts within each bank.",
      "\"Keep ties\" rules out `ROW_NUMBER()` — which ranking function gives tied rows the same position?",
      "Another way: a code is the most common if no other code at the same bank has more failures.",
    ],
    editorial: [
      "The work happens in two levels. First, aggregate the failed transactions to one row per `(remitter_bank, error_code)` with its count — successes are dropped in `WHERE`, and since every failure carries a code there is no NULL group. Second, within each bank, keep the rows whose count is the bank's maximum.",
      "",
      "`RANK()` over `PARTITION BY remitter_bank ORDER BY failures DESC` gives position 1 to every code that shares the top count, which is exactly the tie rule; `ROW_NUMBER()` would keep one tied code arbitrarily and make the answer depend on storage order. A bank with only successful transactions has no rows in the counts and does not appear.",
      "",
      "The alternatives avoid window functions: `NOT EXISTS` keeps a code when no code at the same bank has a larger count, and the join version compares each count with the per-bank `MAX`. All three aggregate once; the comparison step works on the small table of counts, not the raw transactions.",
    ].join("\n"),
  },

  {
    slug: "phonepe-monthly-p2p-vs-p2m-value-2024",
    title: "PhonePe: Monthly P2P Versus P2M Payment Value in 2024",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Dates", "Aggregation"],
    description: [
      "Strategy tracks how much of the money moving through the app goes person-to-person (`P2P`) and how much is paid to merchants (`P2M`). They want one row per month of 2024 to chart the two side by side.",
      "",
      "For each month of **2024** with at least one **successful** payment, return `month` as `'YYYY-MM'`, `p2p_value` and `p2m_value` (the summed `amount` of that month's successful payments of each type, **0** when there were none of a type), and `p2m_count`, the number of successful P2M payments. Order the rows by `month`.",
    ].join("\n"),
    tables: [
      {
        name: "Payment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "txn_type", type: "enum", values: ["P2P", "P2M"] },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["success", "failed", "pending"] },
          { name: "paid_at", type: "datetime" },
        ],
        primaryKey: ["payment_id"],
        note: "One row per payment; `amount` is in rupees.",
      },
    ],
    examples: [
      {
        Payment: [
          [1, "P2P", 1500, "success", "2024-01-03 09:00:00"],
          [2, "P2M", 240, "success", "2024-01-03 13:10:00"],
          [3, "P2M", 999, "failed", "2024-01-09 18:00:00"],
          [4, "P2M", 60, "success", "2024-01-31 23:59:59"],
          [5, "P2P", 500, "success", "2023-12-31 23:00:00"],
          [6, "P2P", 2000, "success", "2024-03-15 10:00:00"],
          [7, "P2M", 120, "pending", "2024-03-16 11:00:00"],
          [8, "P2M", 75, "success", "2025-01-01 00:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 26);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        pick(rng, ["P2P", "P2M", "P2M"]),
        roundTo(rng, 10, 3000, 10),
        pick(rng, ["success", "success", "success", "failed", "pending"]),
        chance(rng, 0.1) ? pick(rng, ["2023-12-31 23:59:59", "2024-01-01 00:00:00", "2024-12-31 23:59:59", "2025-01-01 00:00:00"]) : atTime(rng, dateBetween(rng, "2023-12-01", "2025-01-31")),
      ]);
      return { Payment: rows };
    },
    solution: [
      "SELECT DATE_FORMAT(paid_at, '%Y-%m') AS month,",
      "       SUM(CASE WHEN txn_type = 'P2P' THEN amount ELSE 0 END) AS p2p_value,",
      "       SUM(CASE WHEN txn_type = 'P2M' THEN amount ELSE 0 END) AS p2m_value,",
      "       SUM(CASE WHEN txn_type = 'P2M' THEN 1 ELSE 0 END) AS p2m_count",
      "FROM Payment",
      "WHERE status = 'success'",
      "  AND paid_at >= '2024-01-01' AND paid_at < '2025-01-01'",
      "GROUP BY month",
      "ORDER BY month",
    ].join("\n"),
    alternatives: [
      "SELECT LEFT(paid_at, 7) AS month, SUM(IF(txn_type = 'P2P', amount, 0)) AS p2p_value, SUM(IF(txn_type = 'P2M', amount, 0)) AS p2m_value, COUNT(IF(txn_type = 'P2M', 1, NULL)) AS p2m_count FROM Payment WHERE status = 'success' AND YEAR(paid_at) = 2024 GROUP BY LEFT(paid_at, 7) ORDER BY month",
      [
        "SELECT m.month, COALESCE(SUM(p2p.amount), 0) AS p2p_value, COALESCE(SUM(p2m.amount), 0) AS p2m_value, COUNT(p2m.payment_id) AS p2m_count",
        "FROM (SELECT payment_id, DATE_FORMAT(paid_at, '%Y-%m') AS month FROM Payment WHERE status = 'success' AND YEAR(paid_at) = 2024) m",
        "LEFT JOIN Payment p2p ON p2p.payment_id = m.payment_id AND p2p.txn_type = 'P2P'",
        "LEFT JOIN Payment p2m ON p2m.payment_id = m.payment_id AND p2m.txn_type = 'P2M'",
        "GROUP BY m.month ORDER BY m.month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Group by the month string; one row per month, not one per month and type.",
      "Inside one group, `SUM(CASE WHEN type = … THEN amount ELSE 0 END)` adds up only one type.",
      "Watch the year boundaries: 23:59:59 on 31 December is still 2024.",
    ],
    editorial: [
      "The answer has one row per month and the two types as **columns**, which is conditional aggregation: group by the month, and inside each group add `amount` only where the type matches, using `CASE … ELSE 0`. The `ELSE 0` is what makes a month with no P2M payments show 0 rather than NULL. Counting P2M payments is the same trick with `THEN 1`.",
      "",
      "Failed and pending payments moved no money, so `status = 'success'` is a row filter before grouping. The year is a half-open range on the datetime — `>= '2024-01-01'` and `< '2025-01-01'` — so 23:59:59 on New Year's Eve is in and midnight of 2025 is out. Months with only failed payments form no group, as asked. `DATE_FORMAT(paid_at, '%Y-%m')` builds the label, and grouping by that alias is valid in MySQL.",
      "",
      "The first alternative uses `LEFT(paid_at, 7)` and `IF`/`COUNT(IF(…, 1, NULL))`; the second splits the types with two left self-joins, which is longer but shows what the `CASE` is doing. All are a single scan plus a tiny aggregate.",
    ].join("\n"),
  },

  {
    slug: "phonepe-top-district-per-state-q2-2025",
    title: "PhonePe: Top District by Transaction Count in Each State, Q2 2025",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation", "Dates"],
    description: [
      "A Pulse-style dashboard publishes daily UPI transaction counts per district. For the quarterly write-up, the data team names the busiest district of every state for **April–June 2025**.",
      "",
      "For each state, return `state`, `district` and `q2_txns` — the district's total `txn_count` from **2025-04-01 to 2025-06-30 inclusive** — for the district with the **highest** total. If districts **tie** for the highest, return each of them. States with no data in that quarter do not appear. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "DistrictDaily",
        columns: [
          { name: "state", type: "varchar" },
          { name: "district", type: "varchar" },
          { name: "txn_date", type: "date" },
          { name: "txn_count", type: "int" },
        ],
        primaryKey: ["state", "district", "txn_date"],
        note: "One row per district per day that had transactions; `txn_count` is in thousands.",
      },
    ],
    examples: [
      {
        DistrictDaily: [
          ["Karnataka", "Bengaluru Urban", "2025-04-01", 900],
          ["Karnataka", "Bengaluru Urban", "2025-06-30", 850],
          ["Karnataka", "Mysuru", "2025-05-10", 300],
          ["Karnataka", "Mysuru", "2025-07-01", 5000],
          ["Telangana", "Hyderabad", "2025-04-15", 700],
          ["Telangana", "Rangareddy", "2025-05-15", 400],
          ["Telangana", "Rangareddy", "2025-06-15", 300],
          ["Maharashtra", "Pune", "2025-03-31", 2000],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const seen = new Set<string>();
      for (const state of sample(rng, STATES, ri(rng, 1, 3))) {
        for (const district of sample(rng, STATE_DISTRICTS[state]!, ri(rng, 1, 4))) {
          const k = ri(rng, 0, 4);
          for (let i = 0; i < k; i++) {
            const d = chance(rng, 0.2) ? pick(rng, ["2025-03-31", "2025-04-01", "2025-06-30", "2025-07-01"]) : dateBetween(rng, "2025-03-20", "2025-07-10");
            const key = `${district}|${d}`;
            if (seen.has(key)) continue;
            seen.add(key);
            rows.push([state, district, d, roundTo(rng, 100, 600, 100)]);
          }
        }
      }
      return { DistrictDaily: shuffle(rng, rows) };
    },
    solution: [
      "WITH q2 AS (",
      "  SELECT state, district, SUM(txn_count) AS q2_txns",
      "  FROM DistrictDaily",
      "  WHERE txn_date BETWEEN '2025-04-01' AND '2025-06-30'",
      "  GROUP BY state, district",
      "), ranked AS (",
      "  SELECT state, district, q2_txns,",
      "         RANK() OVER (PARTITION BY state ORDER BY q2_txns DESC) AS pos",
      "  FROM q2",
      ")",
      "SELECT state, district, q2_txns FROM ranked WHERE pos = 1",
    ].join("\n"),
    alternatives: [
      [
        "WITH q2 AS (SELECT state, district, SUM(txn_count) AS q2_txns FROM DistrictDaily WHERE txn_date >= '2025-04-01' AND txn_date < '2025-07-01' GROUP BY state, district)",
        "SELECT a.state, a.district, a.q2_txns FROM q2 a",
        "WHERE NOT EXISTS (SELECT 1 FROM q2 b WHERE b.state = a.state AND b.q2_txns > a.q2_txns)",
      ].join("\n"),
      [
        "WITH q2 AS (SELECT state, district, SUM(txn_count) AS q2_txns FROM DistrictDaily WHERE QUARTER(txn_date) = 2 AND YEAR(txn_date) = 2025 GROUP BY state, district)",
        "SELECT state, district, q2_txns FROM (SELECT q2.*, MAX(q2_txns) OVER (PARTITION BY state) AS top FROM q2) t WHERE q2_txns = top",
      ].join("\n"),
    ],
    hints: [
      "Total each district's quarter first; only then compare districts.",
      "Both 1 April and 30 June are in the quarter; 31 March and 1 July are not.",
      "A ranking that gives tied rows the same position keeps every tied district.",
    ],
    editorial: [
      "Two steps. First collapse the daily rows to one total per district for the quarter: filter `txn_date BETWEEN '2025-04-01' AND '2025-06-30'` (inclusive at both ends, which is the quarter exactly) and `SUM(txn_count)` grouped by state and district. A big day just outside the quarter, like Mysuru's 1 July in the example, must not count.",
      "",
      "Second, pick the top total in each state. `RANK()` over `PARTITION BY state ORDER BY q2_txns DESC` gives every district that shares the maximum the position 1, so ties are kept as the statement asks. A state with no rows inside the quarter has no totals and disappears on its own.",
      "",
      "The alternatives do the comparison differently: `NOT EXISTS` keeps a district when no district of the same state has a larger total, and `MAX(…) OVER (PARTITION BY state)` puts the state's best total on each row to compare against. The aggregate is one scan; the comparison runs over the much smaller set of district totals.",
    ].join("\n"),
  },

  {
    slug: "phonepe-users-whose-first-payment-was-at-a-merchant",
    title: "PhonePe: Users Whose First Successful Payment Was at a Merchant",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Joins", "Subqueries"],
    description: [
      "Growth wants to know how users start: some first send money to a friend, others first scan a shop's QR. This question is about the second group.",
      "",
      "Return `user_id`, `name` and `first_paid_at` for every user whose **earliest successful payment** has `txn_type = 'P2M'`; `first_paid_at` is that payment's `paid_at`. Failed payments are ignored when finding the first one, and users with no successful payment are not returned. A user never has two payments at the same moment. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "AppUser",
        columns: [
          { name: "user_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "signup_date", type: "date" },
        ],
        primaryKey: ["user_id"],
        note: "One row per registered user.",
      },
      {
        name: "Payment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "txn_type", type: "enum", values: ["P2P", "P2M"] },
          { name: "status", type: "enum", values: ["success", "failed"] },
          { name: "paid_at", type: "datetime" },
        ],
        primaryKey: ["payment_id"],
        note: "One row per payment attempt by a user; `user_id` always names a user.",
      },
    ],
    examples: [
      {
        AppUser: [
          [1, "Aarav", "2025-01-02"],
          [2, "Diya", "2025-01-03"],
          [3, "Kabir", "2025-01-05"],
          [4, "Meera", "2025-01-06"],
        ],
        Payment: [
          [11, 1, "P2M", "success", "2025-01-02 10:00:00"],
          [12, 1, "P2P", "success", "2025-01-03 09:00:00"],
          [13, 2, "P2M", "failed", "2025-01-03 11:00:00"],
          [14, 2, "P2P", "success", "2025-01-03 11:05:00"],
          [15, 2, "P2M", "success", "2025-01-04 08:00:00"],
          [16, 3, "P2P", "failed", "2025-01-05 12:00:00"],
          [17, 3, "P2M", "success", "2025-01-06 19:30:00"],
          [18, 4, "P2M", "failed", "2025-01-07 07:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 8);
      const who = names(rng, n);
      const users: Cell[][] = seq(1, n).map((id, i) => [id, who[i]!, dateBetween(rng, "2025-01-01", "2025-01-10")]);
      const pays: Cell[][] = [];
      let pid = 11;
      for (const u of seq(1, n)) {
        const offsets = sample(rng, seq(0, 300), ri(rng, 0, 5)).map((x) => x * 37);
        for (const m of offsets) pays.push([pid++, u, pick(rng, ["P2P", "P2M"]), chance(rng, 0.7) ? "success" : "failed", at("2025-01-02", m)]);
      }
      return { AppUser: users, Payment: shuffle(rng, pays) };
    },
    solution: [
      "WITH firsts AS (",
      "  SELECT user_id, txn_type, paid_at,",
      "         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY paid_at) AS rn",
      "  FROM Payment",
      "  WHERE status = 'success'",
      ")",
      "SELECT u.user_id, u.name, f.paid_at AS first_paid_at",
      "FROM firsts f",
      "JOIN AppUser u ON u.user_id = f.user_id",
      "WHERE f.rn = 1 AND f.txn_type = 'P2M'",
    ].join("\n"),
    alternatives: [
      [
        "SELECT u.user_id, u.name, p.paid_at AS first_paid_at",
        "FROM AppUser u JOIN Payment p ON p.user_id = u.user_id",
        "WHERE p.status = 'success' AND p.txn_type = 'P2M'",
        "  AND p.paid_at = (SELECT MIN(q.paid_at) FROM Payment q WHERE q.user_id = u.user_id AND q.status = 'success')",
      ].join("\n"),
      [
        "SELECT u.user_id, u.name, p.paid_at AS first_paid_at",
        "FROM Payment p JOIN AppUser u ON u.user_id = p.user_id",
        "WHERE p.status = 'success' AND p.txn_type = 'P2M'",
        "  AND NOT EXISTS (SELECT 1 FROM Payment q WHERE q.user_id = p.user_id AND q.status = 'success' AND q.paid_at < p.paid_at)",
      ].join("\n"),
    ],
    hints: [
      "Find each user's first successful payment before looking at its type.",
      "Filtering to P2M first and then taking the earliest would answer a different question.",
      "`ROW_NUMBER()` per user ordered by time marks the first row with 1.",
    ],
    editorial: [
      "The order of operations is the whole problem. If you filter to P2M payments first and then take each user's earliest, every user who ever paid a merchant qualifies — Diya in the example, whose first success was a P2P transfer, would wrongly appear. The first successful payment has to be found among **all** successful payments, and only then is its type checked.",
      "",
      "`ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY paid_at)` over the successful rows numbers each user's payments in time order; the row numbered 1 is the first. Keeping `rn = 1 AND txn_type = 'P2M'` and joining the user table for the name gives the answer. Failed attempts never get a number, and a user with no successful payment has no row 1. Because a user's payments never share a timestamp, the first is unique.",
      "",
      "The alternatives use the same idea without a window: compare `paid_at` with the user's `MIN` over successful payments, or keep a P2M success when `NOT EXISTS` an earlier success. With an index on `(user_id, status, paid_at)` each is close to linear.",
    ].join("\n"),
  },

  {
    slug: "phonepe-open-share-market-positions",
    title: "PhonePe: Open Share.Market Positions From the Order Book",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "Share.Market keeps an order book of every buy and sell a user places. The holdings service is being rebuilt, and the engineer wants to check its output against the open positions derived straight from the orders.",
      "",
      "For each user and symbol, the **net quantity** is the quantity of **executed** `BUY` orders minus the quantity of **executed** `SELL` orders; rejected and cancelled orders never traded. Return `user_id`, `symbol` and `net_quantity` for every position whose net quantity is **greater than 0** — a position at 0 has been closed. Order the rows by `user_id`, then `symbol`.",
    ].join("\n"),
    tables: [
      {
        name: "TradeOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "symbol", type: "varchar" },
          { name: "side", type: "enum", values: ["BUY", "SELL"] },
          { name: "quantity", type: "int" },
          { name: "status", type: "enum", values: ["executed", "rejected", "cancelled"] },
          { name: "placed_at", type: "datetime" },
        ],
        primaryKey: ["order_id"],
        note: "One row per order; `quantity` is the number of shares and is always positive.",
      },
    ],
    examples: [
      {
        TradeOrder: [
          [1, 7, "INFY", "BUY", 10, "executed", "2025-02-03 09:20:00"],
          [2, 7, "INFY", "SELL", 4, "executed", "2025-02-05 10:10:00"],
          [3, 7, "ITC", "BUY", 50, "executed", "2025-02-03 09:25:00"],
          [4, 7, "ITC", "SELL", 50, "executed", "2025-02-10 14:00:00"],
          [5, 8, "SBIN", "BUY", 20, "rejected", "2025-02-04 11:00:00"],
          [6, 8, "TCS", "BUY", 2, "executed", "2025-02-04 11:05:00"],
          [7, 8, "TCS", "SELL", 1, "cancelled", "2025-02-06 12:00:00"],
          [8, 9, "SBIN", "BUY", 15, "executed", "2025-02-07 09:45:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      for (const user of seq(7, ri(rng, 1, 4))) {
        for (const symbol of sample(rng, SYMBOLS, ri(rng, 0, 3))) {
          let held = 0;
          for (let i = ri(rng, 1, 4); i > 0; i--) {
            const status = pick(rng, ["executed", "executed", "executed", "rejected", "cancelled"]);
            const sell = held > 0 && chance(rng, 0.45);
            const qty = sell ? (chance(rng, 0.5) ? held : ri(rng, 1, held)) : ri(rng, 1, 30);
            if (status === "executed") held += sell ? -qty : qty;
            rows.push([id++, user, symbol, sell ? "SELL" : "BUY", qty, status, atTime(rng, dateBetween(rng, "2025-02-03", "2025-02-28"))]);
          }
        }
      }
      return { TradeOrder: shuffle(rng, rows) };
    },
    solution: [
      "SELECT user_id, symbol,",
      "       SUM(CASE WHEN side = 'BUY' THEN quantity ELSE -quantity END) AS net_quantity",
      "FROM TradeOrder",
      "WHERE status = 'executed'",
      "GROUP BY user_id, symbol",
      "HAVING SUM(CASE WHEN side = 'BUY' THEN quantity ELSE -quantity END) > 0",
      "ORDER BY user_id, symbol",
    ].join("\n"),
    alternatives: [
      [
        "SELECT b.user_id, b.symbol, b.qty - COALESCE(s.qty, 0) AS net_quantity",
        "FROM (SELECT user_id, symbol, SUM(quantity) AS qty FROM TradeOrder WHERE status = 'executed' AND side = 'BUY' GROUP BY user_id, symbol) b",
        "LEFT JOIN (SELECT user_id, symbol, SUM(quantity) AS qty FROM TradeOrder WHERE status = 'executed' AND side = 'SELL' GROUP BY user_id, symbol) s",
        "  ON s.user_id = b.user_id AND s.symbol = b.symbol",
        "WHERE b.qty - COALESCE(s.qty, 0) > 0",
        "ORDER BY b.user_id, b.symbol",
      ].join("\n"),
      "SELECT user_id, symbol, net_quantity FROM (SELECT user_id, symbol, SUM(IF(side = 'BUY', quantity, 0)) - SUM(IF(side = 'SELL', quantity, 0)) AS net_quantity FROM TradeOrder WHERE status = 'executed' GROUP BY user_id, symbol) t WHERE net_quantity > 0 ORDER BY user_id, symbol",
    ],
    ordered: true,
    hints: [
      "Only executed orders change a holding.",
      "Turn each order into a signed quantity — positive for a buy, negative for a sell — and add them up.",
      "The \"greater than 0\" test is on the sum, so it belongs in HAVING.",
    ],
    editorial: [
      "A position is the running result of trades, and its final size is simply a sum: each executed buy adds its quantity, each executed sell subtracts it. `CASE WHEN side = 'BUY' THEN quantity ELSE -quantity END` turns every order into a signed quantity, and `SUM` of that per `(user_id, symbol)` is the net position. Rejected and cancelled orders never reached the exchange, so `status = 'executed'` filters them out before grouping — user 8's rejected SBIN buy leaves no position.",
      "",
      "Closed positions (net 0, like user 7's ITC) are removed by a condition on the aggregate, which belongs in `HAVING`. The statement fixes the order, so the query ends with `ORDER BY user_id, symbol`.",
      "",
      "The alternatives make the two sides explicit: one sums buys and sells in separate derived tables and subtracts after a left join (`COALESCE` covers a symbol never sold), the other subtracts two conditional sums and filters in an outer query. All are one or two scans with a hash aggregate per position.",
    ].join("\n"),
  },

  {
    slug: "phonepe-motor-policy-renewal-rate-by-month",
    title: "PhonePe: Motor Policy Renewal Rate by Expiry Month",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Dates", "Aggregation"],
    description: [
      "Motor insurance bought in the app runs for a fixed term. The insurance team measures retention by expiry month: of the policies that ended in a month, how many vehicles were covered again in time?",
      "",
      "A policy counts as **renewed** when **another** policy for the **same `vehicle_no`** has a `start_date` from the old policy's `end_date` up to **30 days after** it, both ends included (who bought it does not matter — a car may change hands). For each month of **2025** in which at least one policy ended, return `expiry_month` (`'YYYY-MM'`), `expiring`, `renewed` and `renewal_pct` = 100 × renewed ÷ expiring rounded to 2 decimals. Order the rows by `expiry_month`.",
    ].join("\n"),
    tables: [
      {
        name: "MotorPolicy",
        columns: [
          { name: "policy_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "vehicle_no", type: "varchar" },
          { name: "start_date", type: "date" },
          { name: "end_date", type: "date" },
        ],
        primaryKey: ["policy_id"],
        note: "One row per motor policy; cover runs from `start_date` to `end_date`.",
      },
    ],
    examples: [
      {
        MotorPolicy: [
          [1, 41, "KA01AB1234", "2024-01-10", "2025-01-09"],
          [2, 41, "KA01AB1234", "2025-01-10", "2026-01-09"],
          [3, 42, "MH12CD5678", "2024-01-20", "2025-01-19"],
          [4, 43, "MH12CD5678", "2025-02-18", "2026-02-17"],
          [5, 44, "TS09EF4321", "2024-01-25", "2025-01-24"],
          [6, 44, "TS09EF4321", "2025-02-24", "2026-02-23"],
          [7, 45, "DL3CGH0001", "2024-03-05", "2025-03-04"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      const states = ["KA01", "MH12", "TS09", "DL3C", "TN07", "GJ01"];
      for (let v = ri(rng, 1, 7); v > 0; v--) {
        const vehicle = `${pick(rng, states)}${String.fromCharCode(65 + ri(rng, 0, 25))}${String.fromCharCode(65 + ri(rng, 0, 25))}${ri(rng, 1000, 9999)}`;
        let start = dateBetween(rng, "2023-11-01", "2025-06-30");
        let user = ri(rng, 41, 60);
        for (let k = ri(rng, 1, 3); k > 0; k--) {
          const end = addDays(start, 364);
          rows.push([id++, user, vehicle, start, end]);
          if (chance(rng, 0.25)) break;
          start = addDays(end, pick(rng, [0, 1, 1, 15, 30, 31, 45]));
          if (chance(rng, 0.2)) user = ri(rng, 41, 60);
        }
      }
      return { MotorPolicy: shuffle(rng, rows) };
    },
    solution: [
      "WITH flagged AS (",
      "  SELECT DATE_FORMAT(p.end_date, '%Y-%m') AS expiry_month,",
      "         CASE WHEN EXISTS (",
      "           SELECT 1 FROM MotorPolicy n",
      "           WHERE n.vehicle_no = p.vehicle_no AND n.policy_id <> p.policy_id",
      "             AND n.start_date BETWEEN p.end_date AND DATE_ADD(p.end_date, INTERVAL 30 DAY)",
      "         ) THEN 1 ELSE 0 END AS renewed",
      "  FROM MotorPolicy p",
      "  WHERE p.end_date BETWEEN '2025-01-01' AND '2025-12-31'",
      ")",
      "SELECT expiry_month, COUNT(*) AS expiring, SUM(renewed) AS renewed,",
      "       ROUND(100 * SUM(renewed) / COUNT(*), 2) AS renewal_pct",
      "FROM flagged",
      "GROUP BY expiry_month",
      "ORDER BY expiry_month",
    ].join("\n"),
    alternatives: [
      [
        "SELECT DATE_FORMAT(p.end_date, '%Y-%m') AS expiry_month, COUNT(DISTINCT p.policy_id) AS expiring,",
        "       COUNT(DISTINCT CASE WHEN n.policy_id IS NOT NULL THEN p.policy_id END) AS renewed,",
        "       ROUND(100 * COUNT(DISTINCT CASE WHEN n.policy_id IS NOT NULL THEN p.policy_id END) / COUNT(DISTINCT p.policy_id), 2) AS renewal_pct",
        "FROM MotorPolicy p",
        "LEFT JOIN MotorPolicy n ON n.vehicle_no = p.vehicle_no AND n.policy_id <> p.policy_id",
        "  AND n.start_date >= p.end_date AND DATEDIFF(n.start_date, p.end_date) <= 30",
        "WHERE YEAR(p.end_date) = 2025",
        "GROUP BY expiry_month ORDER BY expiry_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First decide, for each policy ending in 2025, whether it was renewed (1) or not (0).",
      "An `EXISTS` subquery on the same table looks for the follow-on policy of the same vehicle.",
      "Then group by the expiry month: the count is `expiring`, the sum of the flags is `renewed`.",
    ],
    editorial: [
      "Break it into a per-policy flag and a monthly roll-up. For each policy that ended in 2025, a correlated `EXISTS` looks for a different policy on the same vehicle whose start date falls in the window `[end_date, end_date + 30 days]` — `DATE_ADD(p.end_date, INTERVAL 30 DAY)` builds the far end and `BETWEEN` includes both. The vehicle, not the user, is the key: policy 4 in the example was bought by a new owner and still renews policy 3. Policy 6 started 31 days after policy 5 ended, one day too late.",
      "",
      "The roll-up groups the flags by `DATE_FORMAT(end_date, '%Y-%m')`: `COUNT(*)` is how many expired, `SUM(renewed)` how many were renewed, and their ratio times 100, rounded to two places, is the rate. Computing the flag first matters — joining straight to follow-on policies could match two of them and count one renewal twice.",
      "",
      "The alternative does exactly that join but defends against duplicates with `COUNT(DISTINCT …)` on the expiring policy. Either way the cost is dominated by the self-lookup per expiring policy, cheap with an index on `(vehicle_no, start_date)`.",
    ].join("\n"),
  },

  {
    slug: "phonepe-collect-request-senders-mostly-declined",
    title: "PhonePe: Collect-Request Senders Declined More Often Than Not",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "Collect requests are a known route for scams: someone \"requests\" money hoping the payer approves without reading. Trust & Safety flags senders whose requests are mostly rejected by the people they target.",
      "",
      "Flag a requester who has sent **at least 4** requests, of which **more than half** were `declined`, with the declines coming from **at least 2 different payers**. Return `requester_id`, `requests_sent` (all their requests, whatever the status) and `declined`. Order the rows by `declined` from most to least, then by `requester_id`.",
    ].join("\n"),
    tables: [
      {
        name: "CollectRequest",
        columns: [
          { name: "request_id", type: "int" },
          { name: "requester_id", type: "int" },
          { name: "payer_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["approved", "declined", "expired", "pending"] },
          { name: "created_at", type: "datetime" },
        ],
        primaryKey: ["request_id"],
        note: "One row per collect request sent by `requester_id` to `payer_id`.",
      },
    ],
    examples: [
      {
        CollectRequest: [
          [1, 51, 201, 4999, "declined", "2025-07-01 10:00:00"],
          [2, 51, 202, 4999, "declined", "2025-07-01 10:05:00"],
          [3, 51, 203, 4999, "declined", "2025-07-01 10:09:00"],
          [4, 51, 204, 4999, "approved", "2025-07-01 10:15:00"],
          [5, 52, 205, 300, "declined", "2025-07-02 09:00:00"],
          [6, 52, 205, 300, "declined", "2025-07-02 09:30:00"],
          [7, 52, 205, 300, "declined", "2025-07-02 10:00:00"],
          [8, 52, 206, 300, "approved", "2025-07-02 11:00:00"],
          [9, 53, 201, 150, "declined", "2025-07-03 12:00:00"],
          [10, 53, 202, 150, "declined", "2025-07-03 12:10:00"],
          [11, 53, 203, 150, "expired", "2025-07-03 12:20:00"],
          [12, 53, 204, 150, "approved", "2025-07-03 12:30:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      const senders = seq(51, ri(rng, 2, 6));
      const bad = chance(rng, 0.8) ? pick(rng, senders) : -1;
      for (const s of senders) {
        const k = ri(rng, 0, 8);
        const pDecline = s === bad ? 0.75 : 0.4;
        const payers = sample(rng, seq(201, 8), ri(rng, 1, 5));
        for (let i = 0; i < k; i++) {
          const status = chance(rng, pDecline) ? "declined" : pick(rng, ["approved", "approved", "expired", "pending"]);
          rows.push([id++, s, pick(rng, payers), roundTo(rng, 50, 5000, 50), status, atTime(rng, dateBetween(rng, "2025-07-01", "2025-07-14"))]);
        }
      }
      return { CollectRequest: shuffle(rng, rows) };
    },
    solution: [
      "SELECT requester_id,",
      "       COUNT(*) AS requests_sent,",
      "       SUM(CASE WHEN status = 'declined' THEN 1 ELSE 0 END) AS declined",
      "FROM CollectRequest",
      "GROUP BY requester_id",
      "HAVING COUNT(*) >= 4",
      "   AND 2 * SUM(CASE WHEN status = 'declined' THEN 1 ELSE 0 END) > COUNT(*)",
      "   AND COUNT(DISTINCT CASE WHEN status = 'declined' THEN payer_id END) >= 2",
      "ORDER BY declined DESC, requester_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT t.requester_id, t.requests_sent, t.declined",
        "FROM (SELECT requester_id, COUNT(*) AS requests_sent, SUM(IF(status = 'declined', 1, 0)) AS declined FROM CollectRequest GROUP BY requester_id) t",
        "JOIN (SELECT requester_id, COUNT(DISTINCT payer_id) AS decliners FROM CollectRequest WHERE status = 'declined' GROUP BY requester_id) d ON d.requester_id = t.requester_id",
        "WHERE t.requests_sent >= 4 AND t.declined > t.requests_sent / 2 AND d.decliners >= 2",
        "ORDER BY t.declined DESC, t.requester_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "All three conditions are about a sender's totals, so group by the requester and test in HAVING.",
      "\"More than half\" without fractions: `2 * declined > sent`.",
      "Counting distinct payers *among the declines only*: `COUNT(DISTINCT CASE WHEN … THEN payer_id END)`.",
    ],
    editorial: [
      "Every condition is a property of a sender's whole history, so the query groups by `requester_id` and puts all three tests in `HAVING`. `COUNT(*)` is the number of requests sent, and `SUM(CASE WHEN status = 'declined' THEN 1 ELSE 0 END)` the number declined.",
      "",
      "\"More than half\" is strict: three declines out of six is exactly half and is not enough. Writing it as `2 * declined > sent` keeps the test in whole numbers. The spread condition needs the number of **different** payers who declined; `COUNT(DISTINCT CASE WHEN status = 'declined' THEN payer_id END)` works because the `CASE` yields NULL for other statuses and `COUNT` ignores NULLs. In the example sender 52 was declined three times by the same person, which looks like a dispute rather than a scam, so they are not flagged; sender 53 has exactly half declined and is not flagged either.",
      "",
      "The alternative computes the totals and the distinct decliners in two derived tables and joins them; `requests_sent / 2` is a decimal division, so the comparison stays exact. Both are one aggregate pass over the requests.",
    ].join("\n"),
  },

  {
    slug: "phonepe-new-users-trying-three-products-first-30-days",
    title: "PhonePe: New Users Who Tried Three Products in Their First 30 Days",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Dates"],
    description: [
      "The app is more than UPI: users also recharge phones, buy insurance and buy digital gold. The cross-sell team measures how many new users try **several** of these products early on.",
      "",
      "A user's **first 30 days** run from `signup_date` (day 0) to 29 days after it, both included. The four products are: a **successful** UPI payment, a **successful** mobile recharge, an insurance policy purchase, and a digital gold purchase. Return `user_id`, `name` and `products_used`, the number of **different** products the user used in their first 30 days, for every user who used **at least 3**. Activity before signup or after day 29 does not count. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "AppUser",
        columns: [
          { name: "user_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "signup_date", type: "date" },
        ],
        primaryKey: ["user_id"],
        note: "One row per registered user.",
      },
      {
        name: "UpiPayment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "status", type: "enum", values: ["success", "failed"] },
          { name: "paid_on", type: "date" },
        ],
        primaryKey: ["payment_id"],
        note: "One row per UPI payment attempt.",
      },
      {
        name: "MobileRecharge",
        columns: [
          { name: "recharge_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "status", type: "enum", values: ["success", "failed"] },
          { name: "recharged_on", type: "date" },
        ],
        primaryKey: ["recharge_id"],
        note: "One row per mobile recharge attempt.",
      },
      {
        name: "PolicyPurchase",
        columns: [
          { name: "policy_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "purchased_on", type: "date" },
        ],
        primaryKey: ["policy_id"],
        note: "One row per insurance policy bought in the app.",
      },
      {
        name: "GoldPurchase",
        columns: [
          { name: "order_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "milligrams", type: "int" },
          { name: "bought_on", type: "date" },
        ],
        primaryKey: ["order_id"],
        note: "One row per digital gold purchase.",
      },
    ],
    examples: [
      {
        AppUser: [
          [1, "Aarav", "2025-01-01"],
          [2, "Diya", "2025-01-05"],
          [3, "Kabir", "2025-01-10"],
          [4, "Meera", "2025-01-12"],
        ],
        UpiPayment: [
          [11, 1, "success", "2025-01-01"],
          [12, 1, "success", "2025-01-03"],
          [13, 2, "failed", "2025-01-06"],
          [14, 3, "success", "2025-01-15"],
          [15, 4, "success", "2025-01-12"],
        ],
        MobileRecharge: [
          [21, 1, "success", "2025-01-20"],
          [22, 2, "success", "2025-01-07"],
          [23, 3, "success", "2025-02-09"],
          [24, 4, "failed", "2025-01-13"],
        ],
        PolicyPurchase: [
          [31, 1, "2025-01-30"],
          [32, 2, "2025-02-03"],
          [33, 3, "2025-01-09"],
          [34, 4, "2025-02-10"],
        ],
        GoldPurchase: [
          [41, 2, 500, "2025-02-05"],
          [42, 3, 250, "2025-02-10"],
          [43, 4, 100, "2025-01-14"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 2, 8);
      const who = names(rng, n);
      const signup = seq(1, n).map(() => dateBetween(rng, "2025-01-01", "2025-01-20"));
      const users: Cell[][] = seq(1, n).map((id, i) => [id, who[i]!, signup[i]!]);
      const when = (u: number) => addDays(signup[u - 1]!, chance(rng, 0.3) ? pick(rng, [-1, 0, 29, 30]) : ri(rng, 0, 36));
      const rowsFor = (p: number, make: (id: number, u: number) => Cell[], start: number): Cell[][] => {
        const out: Cell[][] = [];
        let id = start;
        for (const u of seq(1, n)) if (chance(rng, p)) for (let k = ri(rng, 1, 2); k > 0; k--) out.push(make(id++, u));
        return out;
      };
      const ok = () => (chance(rng, 0.8) ? "success" : "failed");
      return {
        AppUser: users,
        UpiPayment: rowsFor(0.9, (id, u) => [id, u, ok(), when(u)], 11),
        MobileRecharge: rowsFor(0.75, (id, u) => [id, u, ok(), when(u)], 101),
        PolicyPurchase: rowsFor(0.65, (id, u) => [id, u, when(u)], 201),
        GoldPurchase: rowsFor(0.65, (id, u) => [id, u, roundTo(rng, 100, 2000, 50), when(u)], 301),
      };
    },
    solution: [
      "WITH activity AS (",
      "  SELECT user_id, 'upi' AS product, paid_on AS used_on FROM UpiPayment WHERE status = 'success'",
      "  UNION ALL",
      "  SELECT user_id, 'recharge', recharged_on FROM MobileRecharge WHERE status = 'success'",
      "  UNION ALL",
      "  SELECT user_id, 'insurance', purchased_on FROM PolicyPurchase",
      "  UNION ALL",
      "  SELECT user_id, 'gold', bought_on FROM GoldPurchase",
      ")",
      "SELECT u.user_id, u.name, COUNT(DISTINCT a.product) AS products_used",
      "FROM AppUser u",
      "JOIN activity a ON a.user_id = u.user_id",
      " AND a.used_on BETWEEN u.signup_date AND DATE_ADD(u.signup_date, INTERVAL 29 DAY)",
      "GROUP BY u.user_id, u.name",
      "HAVING COUNT(DISTINCT a.product) >= 3",
    ].join("\n"),
    alternatives: [
      [
        "SELECT user_id, name, products_used FROM (",
        "  SELECT u.user_id, u.name,",
        "    (CASE WHEN EXISTS (SELECT 1 FROM UpiPayment p WHERE p.user_id = u.user_id AND p.status = 'success' AND DATEDIFF(p.paid_on, u.signup_date) BETWEEN 0 AND 29) THEN 1 ELSE 0 END)",
        "  + (CASE WHEN EXISTS (SELECT 1 FROM MobileRecharge r WHERE r.user_id = u.user_id AND r.status = 'success' AND DATEDIFF(r.recharged_on, u.signup_date) BETWEEN 0 AND 29) THEN 1 ELSE 0 END)",
        "  + (CASE WHEN EXISTS (SELECT 1 FROM PolicyPurchase i WHERE i.user_id = u.user_id AND DATEDIFF(i.purchased_on, u.signup_date) BETWEEN 0 AND 29) THEN 1 ELSE 0 END)",
        "  + (CASE WHEN EXISTS (SELECT 1 FROM GoldPurchase g WHERE g.user_id = u.user_id AND DATEDIFF(g.bought_on, u.signup_date) BETWEEN 0 AND 29) THEN 1 ELSE 0 END) AS products_used",
        "  FROM AppUser u",
        ") t",
        "WHERE products_used >= 3",
      ].join("\n"),
    ],
    hints: [
      "The four products live in four tables; bring them into one shape — user, product name, date — with UNION ALL.",
      "Join that to the users and keep only activity from the signup date to 29 days after it.",
      "A user who bought gold twice used one product, so count distinct product names.",
    ],
    editorial: [
      "The difficulty is that \"a product used\" is spread over four tables with different columns. Stacking them with `UNION ALL` into one shape — `user_id`, a constant product label, and the date — turns the question into a single aggregate. The success filters belong inside the branches they apply to: a failed UPI payment or recharge is not a use, while every policy and gold purchase row is one.",
      "",
      "Joining the stack to the users with `used_on BETWEEN signup_date AND DATE_ADD(signup_date, INTERVAL 29 DAY)` keeps days 0 to 29 — the signup day counts, day 30 does not, and anything before signup is dropped. Then `COUNT(DISTINCT a.product)` per user counts products, not purchases: two gold orders still make one product. `HAVING` keeps users with three or more. In the example Aarav qualifies with his day-29 policy, and Meera with a signup-day payment, a day-29 policy and gold (her failed recharge is ignored). Kabir's policy came the day before signup and his recharge and gold on days 30 and 31, and Diya's only UPI attempt failed, so both stop short.",
      "",
      "The alternative scores each product with its own `EXISTS` and adds the four 0/1 flags — no union and no `DISTINCT`, at the cost of four lookups per user. Both are linear with indexes on `user_id` in each table.",
    ].join("\n"),
  },

  {
    slug: "phonepe-users-who-only-send-only-receive-or-both",
    title: "PhonePe: Users Who Only Send, Only Receive or Do Both in October",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Conditional Logic"],
    description: [
      "The P2P growth team splits October's active users by how they took part in person-to-person transfers: people who only sent money, people who only received it, and people who did both — the two-way users they most want to grow.",
      "",
      "Consider only **successful** transfers with `sent_on` in **October 2025**. Return `user_id` and `user_type` for every user who sent or received at least one such transfer, where `user_type` is `both` for a user who **sent and received**, `sender_only` for one who **sent but never received**, and `receiver_only` for one who **received but never sent**. Failed transfers and transfers outside October do not count for either side. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "P2pTransfer",
        columns: [
          { name: "transfer_id", type: "int" },
          { name: "from_user", type: "int" },
          { name: "to_user", type: "int" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["success", "failed"] },
          { name: "sent_on", type: "date" },
        ],
        primaryKey: ["transfer_id"],
        note: "One row per transfer from `from_user` to `to_user`; the two are always different users.",
      },
    ],
    examples: [
      {
        P2pTransfer: [
          [1, 1, 2, 500, "success", "2025-10-01"],
          [2, 2, 3, 200, "success", "2025-10-05"],
          [3, 3, 1, 150, "failed", "2025-10-08"],
          [4, 4, 5, 1000, "success", "2025-10-31"],
          [5, 5, 6, 300, "success", "2025-09-30"],
          [6, 6, 1, 700, "success", "2025-11-01"],
          [7, 1, 4, 250, "success", "2025-10-20"],
        ],
      },
    ],
    gen: (rng) => {
      const users = seq(1, ri(rng, 3, 10));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 18);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const [a, b] = sample(rng, users, 2);
        return [
          id, a!, b!, roundTo(rng, 50, 5000, 50),
          chance(rng, 0.85) ? "success" : "failed",
          chance(rng, 0.2) ? pick(rng, ["2025-09-30", "2025-10-01", "2025-10-31", "2025-11-01"]) : dateBetween(rng, "2025-09-25", "2025-11-05"),
        ];
      });
      return { P2pTransfer: rows };
    },
    solution: [
      "WITH senders AS (",
      "  SELECT from_user AS user_id FROM P2pTransfer",
      "  WHERE status = 'success' AND sent_on BETWEEN '2025-10-01' AND '2025-10-31'",
      "), receivers AS (",
      "  SELECT to_user AS user_id FROM P2pTransfer",
      "  WHERE status = 'success' AND sent_on BETWEEN '2025-10-01' AND '2025-10-31'",
      ")",
      "SELECT user_id, 'both' AS user_type FROM (SELECT user_id FROM senders INTERSECT SELECT user_id FROM receivers) b",
      "UNION ALL",
      "SELECT user_id, 'sender_only' FROM (SELECT user_id FROM senders EXCEPT SELECT user_id FROM receivers) s",
      "UNION ALL",
      "SELECT user_id, 'receiver_only' FROM (SELECT user_id FROM receivers EXCEPT SELECT user_id FROM senders) r",
    ].join("\n"),
    alternatives: [
      [
        "WITH oct AS (SELECT from_user, to_user FROM P2pTransfer WHERE status = 'success' AND sent_on >= '2025-10-01' AND sent_on < '2025-11-01'),",
        "everyone AS (SELECT from_user AS user_id FROM oct UNION SELECT to_user FROM oct)",
        "SELECT e.user_id,",
        "       CASE WHEN EXISTS (SELECT 1 FROM oct o WHERE o.from_user = e.user_id) AND EXISTS (SELECT 1 FROM oct o WHERE o.to_user = e.user_id) THEN 'both'",
        "            WHEN EXISTS (SELECT 1 FROM oct o WHERE o.from_user = e.user_id) THEN 'sender_only'",
        "            ELSE 'receiver_only' END AS user_type",
        "FROM everyone e",
      ].join("\n"),
      [
        "SELECT user_id, CASE WHEN MAX(sent) = 1 AND MAX(got) = 1 THEN 'both' WHEN MAX(sent) = 1 THEN 'sender_only' ELSE 'receiver_only' END AS user_type",
        "FROM (",
        "  SELECT from_user AS user_id, 1 AS sent, 0 AS got FROM P2pTransfer WHERE status = 'success' AND YEAR(sent_on) = 2025 AND MONTH(sent_on) = 10",
        "  UNION ALL",
        "  SELECT to_user, 0, 1 FROM P2pTransfer WHERE status = 'success' AND YEAR(sent_on) = 2025 AND MONTH(sent_on) = 10",
        ") x",
        "GROUP BY user_id",
      ].join("\n"),
    ],
    hints: [
      "Build two sets of user ids from the same filtered transfers: the senders and the receivers.",
      "Users in both sets are `INTERSECT`; users in one set but not the other are `EXCEPT`, taken in each direction.",
      "Stack the three labelled results with `UNION ALL` — they cannot overlap.",
    ],
    editorial: [
      "The three groups are exactly the regions of a Venn diagram of two sets, so set operators say it directly. From the successful October transfers, take the set of senders (`from_user`) and the set of receivers (`to_user`). `senders INTERSECT receivers` is the two-way users, `senders EXCEPT receivers` those who only sent, and `receivers EXCEPT senders` those who only received. Each operator works on distinct rows, so a user who sent ten transfers still appears once. The three results are disjoint, so `UNION ALL` stacks them with their labels.",
      "",
      "The filter must be applied to both sets the same way. In the example user 3's only outgoing transfer failed, so 3 is a receiver only; user 6 received in September and sent in November, so 6 is in neither set and does not appear; users 4 and 5 are on the October boundaries and both count.",
      "",
      "The alternatives reach the same Venn regions without set operators: a `UNION` of everyone with two `EXISTS` tests per user, or a `UNION ALL` of flagged rows grouped by user with `MAX` of each flag. `INTERSECT` and `EXCEPT` need MySQL 8.0.31 or later; on older servers those forms are the way. All are linear in the transfers with a hash per set.",
    ].join("\n"),
  },

  {
    slug: "phonepe-rewards-campaign-redemption-report",
    title: "PhonePe: Rewards Campaign Redemption Report on 1 April",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Joins", "Dates"],
    description: [
      "Each rewards campaign issues coupons that a user can redeem until `expires_on`. On the report date **2025-04-01** the rewards team reviews every campaign.",
      "",
      "Return `campaign_id`, `campaign_name`, `issued` (coupons issued), `redeemed` (with a `redeemed_on` date), `lapsed` (not redeemed and `expires_on` **before** 2025-04-01), `still_open` (not redeemed and `expires_on` on or after 2025-04-01) and `redeemed_pct` = 100 × redeemed ÷ issued rounded to 2 decimals — **NULL** for a campaign that issued nothing. List **every** campaign, with 0 counts where nothing applies, ordered by `campaign_id`. A redemption always happens on or before expiry and before the report date.",
    ].join("\n"),
    tables: [
      {
        name: "RewardCampaign",
        columns: [
          { name: "campaign_id", type: "int" },
          { name: "campaign_name", type: "varchar" },
        ],
        primaryKey: ["campaign_id"],
        note: "One row per rewards campaign.",
      },
      {
        name: "RewardCoupon",
        columns: [
          { name: "coupon_id", type: "int" },
          { name: "campaign_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "issued_on", type: "date" },
          { name: "expires_on", type: "date" },
          { name: "redeemed_on", type: "date" },
        ],
        primaryKey: ["coupon_id"],
        note: "One row per coupon issued; `redeemed_on` is NULL until the coupon is used.",
      },
    ],
    examples: [
      {
        RewardCampaign: [
          [1, "Holi Cashback"],
          [2, "First Bill Payment"],
          [3, "Travel Week"],
        ],
        RewardCoupon: [
          [101, 1, 81, "2025-03-10", "2025-03-25", "2025-03-12"],
          [102, 1, 82, "2025-03-10", "2025-03-25", null],
          [103, 1, 83, "2025-03-15", "2025-04-01", null],
          [104, 2, 81, "2025-03-20", "2025-04-20", "2025-03-31"],
          [105, 2, 84, "2025-03-21", "2025-04-21", null],
          [106, 2, 85, "2025-02-01", "2025-03-31", null],
        ],
      },
    ],
    gen: (rng) => {
      const camps = sample(rng, ["Holi Cashback", "First Bill Payment", "Travel Week", "Recharge Fest", "Gold Rush", "Insure & Win"], ri(rng, 1, 4)).map((n, i): Cell[] => [i + 1, n]);
      const rows: Cell[][] = [];
      for (let id = 101, k = ri(rng, 0, 20); k > 0; k--, id++) {
        const issued = dateBetween(rng, "2025-02-01", "2025-03-30");
        const expires = chance(rng, 0.15) ? pick(rng, ["2025-03-31", "2025-04-01"]) : addDays(issued, pick(rng, [7, 15, 30, 45]));
        const last = expires < "2025-03-31" ? expires : "2025-03-31";
        const redeemed = chance(rng, 0.45) ? (chance(rng, 0.3) ? last : dateBetween(rng, issued, last)) : null;
        rows.push([id, ri(rng, 1, camps.length), ri(rng, 81, 95), issued, expires, redeemed]);
      }
      return { RewardCampaign: camps, RewardCoupon: shuffle(rng, rows) };
    },
    solution: [
      "SELECT c.campaign_id, c.campaign_name,",
      "       COUNT(r.coupon_id) AS issued,",
      "       SUM(CASE WHEN r.redeemed_on IS NOT NULL THEN 1 ELSE 0 END) AS redeemed,",
      "       SUM(CASE WHEN r.coupon_id IS NOT NULL AND r.redeemed_on IS NULL AND r.expires_on < '2025-04-01' THEN 1 ELSE 0 END) AS lapsed,",
      "       SUM(CASE WHEN r.coupon_id IS NOT NULL AND r.redeemed_on IS NULL AND r.expires_on >= '2025-04-01' THEN 1 ELSE 0 END) AS still_open,",
      "       ROUND(100 * SUM(CASE WHEN r.redeemed_on IS NOT NULL THEN 1 ELSE 0 END) / NULLIF(COUNT(r.coupon_id), 0), 2) AS redeemed_pct",
      "FROM RewardCampaign c",
      "LEFT JOIN RewardCoupon r ON r.campaign_id = c.campaign_id",
      "GROUP BY c.campaign_id, c.campaign_name",
      "ORDER BY c.campaign_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT c.campaign_id, c.campaign_name, t.issued, t.redeemed, t.lapsed, t.still_open,",
        "       ROUND(100 * t.redeemed / NULLIF(t.issued, 0), 2) AS redeemed_pct",
        "FROM RewardCampaign c",
        "JOIN (",
        "  SELECT c2.campaign_id,",
        "    (SELECT COUNT(*) FROM RewardCoupon r WHERE r.campaign_id = c2.campaign_id) AS issued,",
        "    (SELECT COUNT(redeemed_on) FROM RewardCoupon r WHERE r.campaign_id = c2.campaign_id) AS redeemed,",
        "    (SELECT COUNT(*) FROM RewardCoupon r WHERE r.campaign_id = c2.campaign_id AND r.redeemed_on IS NULL AND r.expires_on < '2025-04-01') AS lapsed,",
        "    (SELECT COUNT(*) FROM RewardCoupon r WHERE r.campaign_id = c2.campaign_id AND r.redeemed_on IS NULL AND r.expires_on >= '2025-04-01') AS still_open",
        "  FROM RewardCampaign c2",
        ") t ON t.campaign_id = c.campaign_id",
        "ORDER BY c.campaign_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Every campaign must appear, so outer-join the coupons to the campaigns.",
      "Each count is a `SUM(CASE …)` over the same group; check `coupon_id IS NOT NULL` so the padding row of an empty campaign counts nowhere.",
      "`NULLIF(issued, 0)` turns a zero denominator into NULL, and the division then yields NULL.",
    ],
    editorial: [
      "One row per campaign with several counts is conditional aggregation over a `LEFT JOIN`, so campaigns with no coupons still get a row. Every coupon is in exactly one bucket: redeemed (it has a date), lapsed (no date and the expiry has passed) or still open (no date and the expiry is on or after the report date — a coupon expiring on 1 April can still be used that day).",
      "",
      "The outer join produces one all-NULL row for an empty campaign, and that row must not land in any bucket. `COUNT(r.coupon_id)` ignores it, and the lapsed/open conditions start with `r.coupon_id IS NOT NULL` so the NULL `redeemed_on` of the padding is not mistaken for an unredeemed coupon. The rate divides by `NULLIF(COUNT(r.coupon_id), 0)`, which is NULL for an empty campaign, so the whole expression is NULL instead of an error or a misleading 0.",
      "",
      "The alternative computes each count with its own correlated `COUNT(*)` and avoids the padding question entirely; it reads the coupons four times per campaign, where the main query reads them once.",
    ].join("\n"),
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "phonepe-three-new-payees-within-an-hour",
    title: "PhonePe: Users Paying Three New Payees Within One Hour",
    difficulty: "HARD",
    topics: ["Window Functions", "Subqueries", "Dates"],
    description: [
      "A common account-takeover pattern is a burst of transfers to people the account has never paid before. The fraud team's velocity rule looks for that burst.",
      "",
      "A **new-payee transfer** is a sender's **first successful** transfer to a given `payee_vpa` (failed attempts do not count, later transfers to the same payee are not new). Flag every sender with **three or more** new-payee transfers inside some span of **60 minutes**, both ends included — the third may be sent exactly 60 minutes after the first. Return `sender_id` and `first_alert_at`, the `sent_at` of the earliest new-payee transfer that starts such a span. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "P2pTransfer",
        columns: [
          { name: "transfer_id", type: "int" },
          { name: "sender_id", type: "int" },
          { name: "payee_vpa", type: "varchar" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["success", "failed"] },
          { name: "sent_at", type: "datetime" },
        ],
        primaryKey: ["transfer_id"],
        note: "One row per peer-to-peer transfer attempt; times are whole minutes.",
      },
    ],
    examples: [
      {
        P2pTransfer: [
          [1, 91, "asha@ybl", 2000, "success", "2025-05-12 10:00:00"],
          [2, 91, "vikram.k7@ibl", 4500, "success", "2025-05-12 10:20:00"],
          [3, 91, "asha@ybl", 500, "success", "2025-05-12 10:30:00"],
          [4, 91, "9812345678@axl", 9000, "success", "2025-05-12 11:00:00"],
          [5, 92, "farhan@ybl", 1500, "success", "2025-05-12 09:00:00"],
          [6, 92, "pooja22@ybl", 1500, "success", "2025-05-12 09:30:00"],
          [7, 92, "karan@ibl", 1500, "success", "2025-05-12 10:01:00"],
          [8, 92, "simran@axl", 1500, "success", "2025-05-12 10:15:00"],
          [9, 93, "dev@ybl", 300, "failed", "2025-05-12 08:00:00"],
          [10, 93, "ira.n3@ibl", 300, "success", "2025-05-12 08:10:00"],
          [11, 93, "harsh@ybl", 300, "success", "2025-05-12 08:40:00"],
          [12, 93, "dev@ybl", 300, "success", "2025-05-12 09:30:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      let fresh = 0;
      const senders = seq(91, ri(rng, 1, 5));
      const pool = names(rng, 8).map((n) => `${n.toLowerCase()}@${pick(rng, HANDLES)}`);
      for (const s of senders) {
        for (let k = ri(rng, 0, 7); k > 0; k--) {
          rows.push([id++, s, pick(rng, pool), roundTo(rng, 100, 10000, 100), chance(rng, 0.85) ? "success" : "failed", at("2025-05-12", ri(rng, 0, 400))]);
        }
      }
      if (chance(rng, 0.8)) {
        const s = pick(rng, senders);
        const t = ri(rng, 0, 400);
        const offsets = [0, ri(rng, 1, 59), pick(rng, [30, 59, 60, 60, 61])].sort((a, b) => a - b);
        for (const o of offsets) rows.push([id++, s, `payee${++fresh}.x${ri(rng, 1, 9)}@${pick(rng, HANDLES)}`, roundTo(rng, 1000, 20000, 500), "success", at("2025-05-12", t + o)]);
      }
      return { P2pTransfer: shuffle(rng, rows) };
    },
    solution: [
      "WITH firsts AS (",
      "  SELECT sender_id, payee_vpa, MIN(sent_at) AS first_at",
      "  FROM P2pTransfer",
      "  WHERE status = 'success'",
      "  GROUP BY sender_id, payee_vpa",
      "), spans AS (",
      "  SELECT a.sender_id, a.payee_vpa, a.first_at, COUNT(*) AS new_payees",
      "  FROM firsts a",
      "  JOIN firsts b ON b.sender_id = a.sender_id",
      "               AND b.first_at >= a.first_at",
      "               AND b.first_at <= DATE_ADD(a.first_at, INTERVAL 60 MINUTE)",
      "  GROUP BY a.sender_id, a.payee_vpa, a.first_at",
      ")",
      "SELECT sender_id, MIN(first_at) AS first_alert_at",
      "FROM spans",
      "WHERE new_payees >= 3",
      "GROUP BY sender_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH firsts AS (SELECT sender_id, payee_vpa, MIN(sent_at) AS first_at FROM P2pTransfer WHERE status = 'success' GROUP BY sender_id, payee_vpa),",
        "ahead AS (SELECT sender_id, first_at, LEAD(first_at, 2) OVER (PARTITION BY sender_id ORDER BY first_at) AS third_at FROM firsts)",
        "SELECT sender_id, MIN(first_at) AS first_alert_at FROM ahead",
        "WHERE third_at <= DATE_ADD(first_at, INTERVAL 60 MINUTE)",
        "GROUP BY sender_id",
      ].join("\n"),
      [
        "WITH firsts AS (SELECT sender_id, payee_vpa, MIN(sent_at) AS first_at FROM P2pTransfer WHERE status = 'success' GROUP BY sender_id, payee_vpa)",
        "SELECT a.sender_id, MIN(a.first_at) AS first_alert_at FROM firsts a",
        "WHERE (SELECT COUNT(*) FROM firsts b WHERE b.sender_id = a.sender_id AND b.first_at BETWEEN a.first_at AND DATE_ADD(a.first_at, INTERVAL 60 MINUTE)) >= 3",
        "GROUP BY a.sender_id",
      ].join("\n"),
    ],
    hints: [
      "Reduce the transfers to one row per sender and payee: the time of the first successful transfer.",
      "A burst can start at any new-payee transfer; count how many new-payee transfers fall in the hour that starts there.",
      "With the first-transfer times sorted, the third one from a start is `LEAD(first_at, 2)`.",
    ],
    editorial: [
      "First turn the raw transfers into the events the rule is about. `MIN(sent_at)` over successful transfers, grouped by sender and payee, is the moment each payee became a payee — a later transfer to the same person is not new, and a failed attempt (sender 93's 08:00 try to `dev@ybl`) does not make the payee known, so the first success at 09:30 is the new-payee event.",
      "",
      "Any qualifying hour can be slid forward until it starts on a new-payee event, so it is enough to try each event as a start. The self-join counts the events in `[start, start + 60 minutes]` for the same sender; `DATE_ADD(…, INTERVAL 60 MINUTE)` builds the end, and the inclusive `<=` admits sender 91's third payee at exactly 11:00. Sender 92's first three are 61 minutes apart, but the span starting at 09:30 holds three, so the alert time is 09:30. The earliest qualifying start per sender is `MIN(first_at)`.",
      "",
      "The window alternative avoids the self-join: in time order, the span starting at an event holds three events exactly when the event two places later, `LEAD(first_at, 2)`, is within the hour. That is a sort per sender instead of a quadratic join, and the right choice on real volumes. The third query does the count with a correlated subquery.",
    ].join("\n"),
  },

  {
    slug: "phonepe-failed-payments-recovered-by-retry",
    title: "PhonePe: Failed UPI Payments Recovered by a Retry, per Bank",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Aggregation"],
    description: [
      "When a UPI payment fails, many users simply try again. Payments product wants to know, per remitter bank, how often a failed payment is rescued by a retry.",
      "",
      "Attempts by the same `user_id` to the same `payee_vpa` for the same `amount` form one **chain** as long as each attempt comes **at most 10 minutes** after the previous one (a gap of exactly 10 minutes still continues the chain; a longer gap starts a new one). A chain whose **first** attempt failed is a **failed chain**; it is **recovered** if any attempt in it succeeded. For each remitter bank of a failed chain's first attempt, return `remitter_bank`, `failed_chains`, `recovered_chains` and `recovery_pct` = 100 × recovered ÷ failed rounded to 2 decimals. Banks with no failed chain do not appear. A user never makes two attempts at the same moment. Order the rows by `remitter_bank`.",
    ].join("\n"),
    tables: [
      {
        name: "PaymentAttempt",
        columns: [
          { name: "attempt_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "payee_vpa", type: "varchar" },
          { name: "amount", type: "int" },
          { name: "remitter_bank", type: "varchar" },
          { name: "status", type: "enum", values: ["success", "failed"] },
          { name: "attempted_at", type: "datetime" },
        ],
        primaryKey: ["attempt_id"],
        note: "One row per payment attempt; a retry may go through a different linked bank.",
      },
    ],
    examples: [
      {
        PaymentAttempt: [
          [1, 1, "shop.fresh@ybl", 250, "SBI", "failed", "2025-09-01 10:00:00"],
          [2, 1, "shop.fresh@ybl", 250, "SBI", "failed", "2025-09-01 10:04:00"],
          [3, 1, "shop.fresh@ybl", 250, "SBI", "success", "2025-09-01 10:09:00"],
          [4, 1, "shop.fresh@ybl", 250, "SBI", "failed", "2025-09-01 10:30:00"],
          [5, 2, "rent.owner@ibl", 15000, "HDFC", "failed", "2025-09-01 09:00:00"],
          [6, 2, "rent.owner@ibl", 15000, "ICICI", "success", "2025-09-01 09:10:00"],
          [7, 2, "kabir@ybl", 500, "HDFC", "failed", "2025-09-01 12:00:00"],
          [8, 2, "kabir@ybl", 500, "HDFC", "success", "2025-09-01 12:11:00"],
          [9, 3, "chai.point@ybl", 100, "ICICI", "success", "2025-09-01 08:00:00"],
          [10, 3, "chai.point@ybl", 200, "ICICI", "failed", "2025-09-01 08:05:00"],
          [11, 3, "chai.point@ybl", 100, "ICICI", "success", "2025-09-01 08:07:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      const payees = names(rng, 3).map((n) => `${n.toLowerCase()}@${pick(rng, HANDLES)}`);
      const banks = sample(rng, BANKS, ri(rng, 2, 3));
      for (const user of seq(1, ri(rng, 1, 4))) {
        let clock = ri(rng, 0, 60);
        for (let c = ri(rng, 1, 4); c > 0; c--) {
          const payee = pick(rng, payees);
          const amount = pick(rng, [100, 250, 500]);
          let bank = pick(rng, banks);
          for (let a = ri(rng, 1, 4); a > 0; a--) {
            rows.push([id++, user, payee, amount, bank, chance(rng, 0.55) ? "failed" : "success", at("2025-09-01", clock)]);
            clock += pick(rng, [1, 3, 5, 10, 10, 11, 20]);
            if (chance(rng, 0.2)) bank = pick(rng, banks);
          }
          clock += pick(rng, [2, 11, 45, 180]);
        }
      }
      return { PaymentAttempt: shuffle(rng, rows) };
    },
    solution: [
      "WITH flagged AS (",
      "  SELECT user_id, payee_vpa, amount, remitter_bank, status, attempted_at,",
      "         CASE WHEN TIMESTAMPDIFF(SECOND,",
      "                     LAG(attempted_at) OVER (PARTITION BY user_id, payee_vpa, amount ORDER BY attempted_at),",
      "                     attempted_at) <= 600 THEN 0 ELSE 1 END AS new_chain",
      "  FROM PaymentAttempt",
      "), numbered AS (",
      "  SELECT f.*,",
      "         SUM(new_chain) OVER (PARTITION BY user_id, payee_vpa, amount ORDER BY attempted_at",
      "                              ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS chain_no",
      "  FROM flagged f",
      "), chains AS (",
      "  SELECT user_id, payee_vpa, amount, chain_no, MIN(attempted_at) AS started_at,",
      "         MAX(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS recovered",
      "  FROM numbered",
      "  GROUP BY user_id, payee_vpa, amount, chain_no",
      ")",
      "SELECT n.remitter_bank, COUNT(*) AS failed_chains, SUM(c.recovered) AS recovered_chains,",
      "       ROUND(100 * SUM(c.recovered) / COUNT(*), 2) AS recovery_pct",
      "FROM chains c",
      "JOIN numbered n ON n.user_id = c.user_id AND n.payee_vpa = c.payee_vpa",
      "               AND n.amount = c.amount AND n.attempted_at = c.started_at",
      "WHERE n.status = 'failed'",
      "GROUP BY n.remitter_bank",
      "ORDER BY n.remitter_bank",
    ].join("\n"),
    alternatives: [
      [
        "WITH starts AS (",
        "  SELECT p.* FROM PaymentAttempt p",
        "  WHERE NOT EXISTS (SELECT 1 FROM PaymentAttempt q WHERE q.user_id = p.user_id AND q.payee_vpa = p.payee_vpa AND q.amount = p.amount",
        "                      AND q.attempted_at < p.attempted_at AND q.attempted_at >= DATE_SUB(p.attempted_at, INTERVAL 10 MINUTE))",
        "), member AS (",
        "  SELECT x.user_id, x.payee_vpa, x.amount, x.status,",
        "         (SELECT MAX(s.attempted_at) FROM starts s WHERE s.user_id = x.user_id AND s.payee_vpa = x.payee_vpa AND s.amount = x.amount AND s.attempted_at <= x.attempted_at) AS chain_start",
        "  FROM PaymentAttempt x",
        ")",
        "SELECT s.remitter_bank, COUNT(*) AS failed_chains,",
        "       SUM(CASE WHEN EXISTS (SELECT 1 FROM member m WHERE m.user_id = s.user_id AND m.payee_vpa = s.payee_vpa AND m.amount = s.amount AND m.chain_start = s.attempted_at AND m.status = 'success') THEN 1 ELSE 0 END) AS recovered_chains,",
        "       ROUND(100 * SUM(CASE WHEN EXISTS (SELECT 1 FROM member m WHERE m.user_id = s.user_id AND m.payee_vpa = s.payee_vpa AND m.amount = s.amount AND m.chain_start = s.attempted_at AND m.status = 'success') THEN 1 ELSE 0 END) / COUNT(*), 2) AS recovery_pct",
        "FROM starts s",
        "WHERE s.status = 'failed'",
        "GROUP BY s.remitter_bank",
        "ORDER BY s.remitter_bank",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "This is sessionisation: decide for every attempt whether it starts a new chain, using the gap to the previous attempt with the same user, payee and amount.",
      "A running `SUM` of the \"starts a chain\" flags numbers the chains.",
      "Per chain you need two facts: the first attempt (its status and bank) and whether any attempt succeeded.",
      "The very first attempt of a key has no previous one — make sure it counts as a chain start.",
    ],
    editorial: [
      "The chains are sessions, and sessionising is a two-window pattern. `LAG(attempted_at)` over the attempts of one `(user, payee, amount)` in time order gives the previous attempt; the row starts a new chain when the gap is more than 600 seconds **or** there is no previous attempt (the `TIMESTAMPDIFF` is NULL, the comparison is unknown and the `CASE` falls to `ELSE 1`). A running `SUM` of that flag then gives every attempt its chain number.",
      "",
      "Grouping by key and chain number yields each chain's start time and a `MAX` of \"was a success\", which is the recovered flag. Joining back on the start time picks up the first attempt's status and bank — times are unique per user, so the match is exact. Only chains whose first attempt failed are counted, grouped by that attempt's bank. In the example user 2's rent payment failed on HDFC and succeeded on ICICI 10 minutes later: one HDFC chain, recovered. Their 500-rupee retry came 11 minutes later — a new chain, so the HDFC failure stays unrecovered.",
      "",
      "Recovery is decided per chain, so a chain is counted once even when it held several retries. The alternative finds chain starts with `NOT EXISTS` (no attempt of the same key in the 10 minutes before) and assigns each attempt to the latest start at or before it; it is correct but quadratic, while the window version sorts each key once.",
    ].join("\n"),
  },

  {
    slug: "phonepe-bank-downtime-runs-from-technical-declines",
    title: "PhonePe: Bank Downtime Runs From Consecutive Technical Declines",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "A business decline (wrong PIN, low balance) is the user's problem; a **technical decline** means the bank's systems did not answer. Several technical declines in a row at one bank usually mean the bank is down, and the payments-reliability team wants those runs listed.",
      "",
      "Take each bank's transactions in `txn_at` order. A **run** is a stretch of **three or more consecutive** `technical_decline` transactions at the same bank with nothing else between them. Return `bank_code`, `run_start` and `run_end` (the first and last `txn_at` of the run) and `declines`, the number of transactions in it. A bank never has two transactions at the same moment. Order the rows by `bank_code`, then `run_start`.",
    ].join("\n"),
    tables: [
      {
        name: "BankTxn",
        columns: [
          { name: "txn_id", type: "int" },
          { name: "bank_code", type: "varchar" },
          { name: "txn_at", type: "datetime" },
          { name: "status", type: "enum", values: ["success", "business_decline", "technical_decline"] },
        ],
        primaryKey: ["txn_id"],
        note: "One row per UPI transaction routed to the bank.",
      },
    ],
    examples: [
      {
        BankTxn: [
          [1, "SBI", "2025-10-03 10:00:00", "success"],
          [2, "SBI", "2025-10-03 10:01:00", "technical_decline"],
          [3, "SBI", "2025-10-03 10:02:00", "technical_decline"],
          [4, "SBI", "2025-10-03 10:03:00", "technical_decline"],
          [5, "SBI", "2025-10-03 10:04:00", "business_decline"],
          [6, "SBI", "2025-10-03 10:05:00", "technical_decline"],
          [7, "SBI", "2025-10-03 10:06:00", "technical_decline"],
          [8, "SBI", "2025-10-03 10:07:00", "success"],
          [9, "HDFC", "2025-10-03 11:00:00", "success"],
          [10, "HDFC", "2025-10-03 11:02:00", "technical_decline"],
          [11, "HDFC", "2025-10-03 11:03:00", "technical_decline"],
          [12, "ICICI", "2025-10-03 11:04:00", "technical_decline"],
          [13, "HDFC", "2025-10-03 11:05:00", "technical_decline"],
          [14, "HDFC", "2025-10-03 11:09:00", "technical_decline"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      for (const bank of sample(rng, BANKS, ri(rng, 1, 3))) {
        let clock = ri(rng, 0, 30);
        let left = ri(rng, 3, 14);
        while (left > 0) {
          const tech = chance(rng, 0.5);
          const len = Math.min(left, tech ? pick(rng, [1, 2, 3, 3, 4, 5]) : ri(rng, 1, 3));
          for (let i = 0; i < len; i++) {
            rows.push([id++, bank, at("2025-10-03", clock), tech ? "technical_decline" : pick(rng, ["success", "success", "business_decline"])]);
            clock += ri(rng, 1, 4);
          }
          left -= len;
        }
      }
      return { BankTxn: shuffle(rng, rows) };
    },
    solution: [
      "WITH grouped AS (",
      "  SELECT bank_code, txn_at, status,",
      "         SUM(CASE WHEN status <> 'technical_decline' THEN 1 ELSE 0 END)",
      "           OVER (PARTITION BY bank_code ORDER BY txn_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS grp",
      "  FROM BankTxn",
      ")",
      "SELECT bank_code, MIN(txn_at) AS run_start, MAX(txn_at) AS run_end, COUNT(*) AS declines",
      "FROM grouped",
      "WHERE status = 'technical_decline'",
      "GROUP BY bank_code, grp",
      "HAVING COUNT(*) >= 3",
      "ORDER BY bank_code, run_start",
    ].join("\n"),
    alternatives: [
      [
        "WITH numbered AS (",
        "  SELECT bank_code, txn_at, status,",
        "         ROW_NUMBER() OVER (PARTITION BY bank_code ORDER BY txn_at) AS rn_all,",
        "         ROW_NUMBER() OVER (PARTITION BY bank_code, status ORDER BY txn_at) AS rn_status",
        "  FROM BankTxn",
        ")",
        "SELECT bank_code, MIN(txn_at) AS run_start, MAX(txn_at) AS run_end, COUNT(*) AS declines",
        "FROM numbered WHERE status = 'technical_decline'",
        "GROUP BY bank_code, rn_all - rn_status",
        "HAVING COUNT(*) >= 3",
        "ORDER BY bank_code, run_start",
      ].join("\n"),
      [
        "WITH marked AS (",
        "  SELECT bank_code, txn_at, status, LAG(status) OVER (PARTITION BY bank_code ORDER BY txn_at) AS prev_status FROM BankTxn",
        "), starts AS (",
        "  SELECT bank_code, txn_at AS run_start FROM marked",
        "  WHERE status = 'technical_decline' AND (prev_status IS NULL OR prev_status <> 'technical_decline')",
        "), runs AS (",
        "  SELECT s.bank_code, s.run_start,",
        "         (SELECT MIN(o.txn_at) FROM BankTxn o WHERE o.bank_code = s.bank_code AND o.txn_at > s.run_start AND o.status <> 'technical_decline') AS stop_at",
        "  FROM starts s",
        ")",
        "SELECT r.bank_code, r.run_start, MAX(t.txn_at) AS run_end, COUNT(*) AS declines",
        "FROM runs r JOIN BankTxn t ON t.bank_code = r.bank_code AND t.txn_at >= r.run_start AND (r.stop_at IS NULL OR t.txn_at < r.stop_at)",
        "GROUP BY r.bank_code, r.run_start",
        "HAVING COUNT(*) >= 3",
        "ORDER BY r.bank_code, r.run_start",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "This is gaps and islands: give every row of one run the same group key.",
      "A running count of the *other* statuses does not change inside a run of technical declines.",
      "Group the technical declines by bank and that key, then keep the groups of three or more.",
    ],
    editorial: [
      "Consecutive rows with the same property are an **islands** problem, and the trick is a key that is constant inside an island and changes between islands. Over each bank's transactions in time order, a running count of the rows that are **not** technical declines does exactly that: it stays fixed across a run of technical declines and steps up each time something else interrupts it. Every run of declines at a bank therefore shares one `(bank_code, grp)` pair, and no two runs share one.",
      "",
      "Keeping only the technical declines and grouping by that pair gives each run's first time, last time and length; `HAVING COUNT(*) >= 3` drops the short blips. In the example SBI's 10:05–10:06 pair is too short, and HDFC's 11:02–11:09 run counts four rows even though an ICICI transaction sits between them in time — runs are per bank, so the partition ignores other banks entirely.",
      "",
      "The first alternative is the classic difference of row numbers: within a run, the row number over all of a bank's rows and the row number over its technical declines rise together, so their difference is constant (and never negative, because the second count can't overtake the first). The second finds run starts with `LAG` and ends each run at the bank's next non-technical transaction. All are a sort per bank.",
    ].join("\n"),
  },

  {
    slug: "phonepe-merchant-spend-quartiles-per-city",
    title: "PhonePe: Merchant-Spend Quartiles of Users in Each City, March 2025",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation", "Joins"],
    description: [
      "The rewards team sizes city-wise cashback budgets by splitting each city's paying users into four equal-sized spend groups. For **March 2025**, a user's spend is the sum of their **successful** merchant (P2M) payments; users with no such payment are left out.",
      "",
      "In each city, sort the users by spend from **highest to lowest**, breaking ties by `user_id` ascending, and deal them into **quartiles 1 to 4** the way `NTILE(4)` does: the groups differ in size by at most one, and the larger groups come first (10 users → 3, 3, 2, 2). A city with fewer than four users has fewer quartiles. Return `city`, `quartile`, `users`, `min_spend`, `max_spend` and `total_spend` for every quartile, ordered by `city`, then `quartile`.",
    ].join("\n"),
    tables: [
      {
        name: "AppUser",
        columns: [
          { name: "user_id", type: "int" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["user_id"],
        note: "One row per user, with the city of their registered address.",
      },
      {
        name: "P2mPayment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["success", "failed"] },
          { name: "paid_on", type: "date" },
        ],
        primaryKey: ["payment_id"],
        note: "One row per payment by a user to a merchant; `user_id` always names a user.",
      },
    ],
    examples: [
      {
        AppUser: [
          [1, "Pune"], [2, "Pune"], [3, "Pune"], [4, "Pune"], [5, "Pune"], [6, "Pune"],
          [7, "Indore"], [8, "Indore"], [9, "Surat"],
        ],
        P2mPayment: [
          [11, 1, 900, "success", "2025-03-02"],
          [12, 2, 400, "success", "2025-03-05"],
          [13, 2, 300, "success", "2025-03-25"],
          [14, 3, 700, "success", "2025-03-09"],
          [15, 4, 250, "success", "2025-03-31"],
          [16, 5, 250, "success", "2025-03-12"],
          [17, 6, 5000, "failed", "2025-03-14"],
          [18, 6, 120, "success", "2025-04-01"],
          [19, 7, 60, "success", "2025-03-03"],
          [20, 8, 80, "success", "2025-03-04"],
          [21, 9, 50, "failed", "2025-03-04"],
        ],
      },
    ],
    gen: (rng) => {
      const cities = sample(rng, ["Pune", "Indore", "Surat", "Nagpur", "Mysuru"], ri(rng, 1, 3));
      const n = ri(rng, 2, 18);
      const users: Cell[][] = seq(1, n).map((id) => [id, pick(rng, cities)]);
      const pays: Cell[][] = [];
      let id = 11;
      for (const u of seq(1, n)) {
        for (let k = chance(rng, 0.15) ? 0 : ri(rng, 1, 3); k > 0; k--) {
          pays.push([
            id++, u, chance(rng, 0.3) ? pick(rng, [100, 250, 500]) : roundTo(rng, 50, 1500, 50),
            chance(rng, 0.85) ? "success" : "failed",
            chance(rng, 0.85) ? dateBetween(rng, "2025-03-01", "2025-03-31") : pick(rng, ["2025-02-28", "2025-04-01"]),
          ]);
        }
      }
      return { AppUser: users, P2mPayment: shuffle(rng, pays) };
    },
    solution: [
      "WITH spend AS (",
      "  SELECT u.city, p.user_id, SUM(p.amount) AS spent",
      "  FROM P2mPayment p",
      "  JOIN AppUser u ON u.user_id = p.user_id",
      "  WHERE p.status = 'success' AND p.paid_on BETWEEN '2025-03-01' AND '2025-03-31'",
      "  GROUP BY u.city, p.user_id",
      "), bucketed AS (",
      "  SELECT city, spent,",
      "         NTILE(4) OVER (PARTITION BY city ORDER BY spent DESC, user_id) AS quartile",
      "  FROM spend",
      ")",
      "SELECT city, quartile, COUNT(*) AS users,",
      "       MIN(spent) AS min_spend, MAX(spent) AS max_spend, SUM(spent) AS total_spend",
      "FROM bucketed",
      "GROUP BY city, quartile",
      "ORDER BY city, quartile",
    ].join("\n"),
    alternatives: [
      [
        "WITH spend AS (",
        "  SELECT u.city, p.user_id, SUM(p.amount) AS spent FROM P2mPayment p JOIN AppUser u ON u.user_id = p.user_id",
        "  WHERE p.status = 'success' AND p.paid_on >= '2025-03-01' AND p.paid_on < '2025-04-01' GROUP BY u.city, p.user_id",
        "), numbered AS (",
        "  SELECT city, spent,",
        "         ROW_NUMBER() OVER (PARTITION BY city ORDER BY spent DESC, user_id) AS rn,",
        "         COUNT(*) OVER (PARTITION BY city) AS n",
        "  FROM spend",
        "), sized AS (",
        "  SELECT city, spent, rn, n DIV 4 AS base, n MOD 4 AS extra FROM numbered",
        "), bucketed AS (",
        "  SELECT city, spent,",
        "         CASE WHEN rn <= extra * (base + 1) THEN (rn - 1) DIV (base + 1) + 1",
        "              ELSE extra + (rn - extra * (base + 1) - 1) DIV base + 1 END AS quartile",
        "  FROM sized",
        ")",
        "SELECT city, quartile, COUNT(*) AS users, MIN(spent) AS min_spend, MAX(spent) AS max_spend, SUM(spent) AS total_spend",
        "FROM bucketed GROUP BY city, quartile ORDER BY city, quartile",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Total each user's March spend first, and attach the city — the buckets are of users, not of payments.",
      "`NTILE(4) OVER (PARTITION BY city ORDER BY …)` deals the sorted users into four groups per city.",
      "Without NTILE: with n users, the first `n MOD 4` groups get `n DIV 4 + 1` users and the rest get `n DIV 4`.",
    ],
    editorial: [
      "Two levels again. First collapse payments to one March spend per user — only successful payments dated in March count, so user 6's failed ₹5,000 and April payment in the example leave them out — and carry the city along from the user table. Users with nothing to sum never form a row and are not bucketed.",
      "",
      "Then `NTILE(4)` over each city's users, ordered by spend descending and `user_id` ascending, assigns the quartile: it splits n rows into four groups whose sizes differ by at most one, the larger ones first. Pune's five spenders become 2, 1, 1, 1 users; Indore's two users fill quartiles 1 and 2 only; Surat's only payment failed, so Surat has no row. Grouping by city and quartile gives each bucket's size, range and total. The `user_id` tie-break makes the dealing deterministic; and because tied users have equal spend, the bucket figures would not change whichever tied user landed where.",
      "",
      "The alternative rebuilds `NTILE` from `ROW_NUMBER` and the city's count: with `base = n DIV 4` and `extra = n MOD 4`, the first `extra × (base + 1)` rows go into groups of `base + 1`, the rest into groups of `base`. It is the same arithmetic NTILE performs, and it shows why a city of three users has no fourth quartile. Both are a sort per city.",
    ].join("\n"),
  },

  {
    slug: "phonepe-districts-climbing-every-quarter-2024",
    title: "PhonePe: Districts Whose State Rank Rose Every Quarter of 2024",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "Pulse-style quarterly data ranks districts within their state by transaction count. For a story on fast-growing towns, the data team wants the districts that climbed **every** quarter of 2024.",
      "",
      "In each state and each quarter of **2024**, rank the districts by `txn_count`, highest first; tied districts share a rank and the next rank is skipped (1, 2, 2, 4). Return `state`, `district`, `q1_rank` and `q4_rank` for every district that has a row in **all four** quarters of 2024 and whose rank number got **strictly smaller** from Q1 to Q2, from Q2 to Q3 and from Q3 to Q4. Only districts with a row in a quarter are ranked in it. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "DistrictQuarter",
        columns: [
          { name: "state", type: "varchar" },
          { name: "district", type: "varchar" },
          { name: "txn_year", type: "int" },
          { name: "txn_quarter", type: "int" },
          { name: "txn_count", type: "int" },
        ],
        primaryKey: ["state", "district", "txn_year", "txn_quarter"],
        note: "One row per district per quarter with transactions; `txn_count` is in thousands.",
      },
    ],
    examples: [
      {
        DistrictQuarter: [
          ["Karnataka", "Bengaluru Urban", 2024, 1, 900],
          ["Karnataka", "Mysuru", 2024, 1, 500],
          ["Karnataka", "Belagavi", 2024, 1, 400],
          ["Karnataka", "Udupi", 2024, 1, 200],
          ["Karnataka", "Bengaluru Urban", 2024, 2, 950],
          ["Karnataka", "Mysuru", 2024, 2, 520],
          ["Karnataka", "Belagavi", 2024, 2, 380],
          ["Karnataka", "Udupi", 2024, 2, 450],
          ["Karnataka", "Bengaluru Urban", 2024, 3, 980],
          ["Karnataka", "Mysuru", 2024, 3, 560],
          ["Karnataka", "Belagavi", 2024, 3, 390],
          ["Karnataka", "Udupi", 2024, 3, 600],
          ["Karnataka", "Bengaluru Urban", 2024, 4, 990],
          ["Karnataka", "Mysuru", 2024, 4, 560],
          ["Karnataka", "Belagavi", 2024, 4, 395],
          ["Karnataka", "Udupi", 2024, 4, 1000],
          ["Karnataka", "Belagavi", 2023, 4, 2000],
        ],
      },
      {
        DistrictQuarter: [
          ["Telangana", "Hyderabad", 2024, 1, 800],
          ["Telangana", "Rangareddy", 2024, 1, 300],
          ["Telangana", "Medchal", 2024, 1, 300],
          ["Telangana", "Warangal", 2024, 1, 100],
          ["Telangana", "Hyderabad", 2024, 2, 800],
          ["Telangana", "Rangareddy", 2024, 2, 500],
          ["Telangana", "Warangal", 2024, 2, 450],
          ["Telangana", "Medchal", 2024, 2, 200],
          ["Telangana", "Hyderabad", 2024, 3, 800],
          ["Telangana", "Rangareddy", 2024, 3, 450],
          ["Telangana", "Medchal", 2024, 3, 150],
          ["Telangana", "Hyderabad", 2024, 4, 850],
          ["Telangana", "Rangareddy", 2024, 4, 400],
          ["Telangana", "Warangal", 2024, 4, 900],
          ["Telangana", "Medchal", 2024, 4, 120],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const state of sample(rng, STATES, ri(rng, 1, 2))) {
        const districts = sample(rng, STATE_DISTRICTS[state]!, ri(rng, 4, 5));
        const planted = chance(rng, 0.85);
        const climber = districts[0]!;
        const others = districts.slice(1);
        const ranks = sample(rng, seq(1, districts.length), 4).sort((a, b) => b - a);
        const tieMode = chance(rng, 0.3);
        for (const q of [1, 2, 3, 4]) {
          const vals = tieMode && !planted
            ? others.map(() => roundTo(rng, 100, 600, 100))
            : sample(rng, seq(2, 30).map((x) => x * 50), others.length);
          others.forEach((d, i) => {
            // A missing quarter now and then (rarely in a planted state, where it can break the climb).
            if (!chance(rng, planted ? 0.015 : 0.1)) rows.push([state, d, 2024, q, vals[i]!]);
          });
          if (planted) {
            const sorted = [...vals].sort((a, b) => b - a);
            const r = ranks[q - 1]!;
            const v = r === 1 ? sorted[0]! + 10 : r - 1 >= sorted.length ? sorted[sorted.length - 1]! - 10 : sorted[r - 1]! + 10;
            rows.push([state, climber, 2024, q, v]);
          } else rows.push([state, climber, 2024, q, roundTo(rng, 100, 1500, 50)]);
        }
        if (chance(rng, 0.4)) rows.push([state, pick(rng, districts), 2023, 4, roundTo(rng, 100, 1500, 50)]);
      }
      return { DistrictQuarter: shuffle(rng, rows) };
    },
    solution: [
      "WITH ranked AS (",
      "  SELECT state, district, txn_quarter,",
      "         RANK() OVER (PARTITION BY state, txn_quarter ORDER BY txn_count DESC) AS pos",
      "  FROM DistrictQuarter",
      "  WHERE txn_year = 2024",
      "), steps AS (",
      "  SELECT state, district, txn_quarter, pos,",
      "         LAG(pos) OVER (PARTITION BY state, district ORDER BY txn_quarter) AS prev_pos",
      "  FROM ranked",
      ")",
      "SELECT state, district,",
      "       MAX(CASE WHEN txn_quarter = 1 THEN pos END) AS q1_rank,",
      "       MAX(CASE WHEN txn_quarter = 4 THEN pos END) AS q4_rank",
      "FROM steps",
      "GROUP BY state, district",
      "HAVING COUNT(*) = 4",
      "   AND SUM(CASE WHEN pos < prev_pos THEN 1 ELSE 0 END) = 3",
    ].join("\n"),
    alternatives: [
      [
        "WITH ranked AS (SELECT state, district, txn_quarter, RANK() OVER (PARTITION BY state, txn_quarter ORDER BY txn_count DESC) AS pos FROM DistrictQuarter WHERE txn_year = 2024)",
        "SELECT r1.state, r1.district, r1.pos AS q1_rank, r4.pos AS q4_rank",
        "FROM ranked r1",
        "JOIN ranked r2 ON r2.state = r1.state AND r2.district = r1.district AND r2.txn_quarter = 2",
        "JOIN ranked r3 ON r3.state = r1.state AND r3.district = r1.district AND r3.txn_quarter = 3",
        "JOIN ranked r4 ON r4.state = r1.state AND r4.district = r1.district AND r4.txn_quarter = 4",
        "WHERE r1.txn_quarter = 1 AND r2.pos < r1.pos AND r3.pos < r2.pos AND r4.pos < r3.pos",
      ].join("\n"),
      [
        "WITH ranked AS (",
        "  SELECT d.state, d.district, d.txn_quarter,",
        "         1 + (SELECT COUNT(*) FROM DistrictQuarter o WHERE o.state = d.state AND o.txn_year = 2024 AND o.txn_quarter = d.txn_quarter AND o.txn_count > d.txn_count) AS pos",
        "  FROM DistrictQuarter d WHERE d.txn_year = 2024",
        "), pivot AS (",
        "  SELECT state, district,",
        "         MAX(CASE WHEN txn_quarter = 1 THEN pos END) AS q1, MAX(CASE WHEN txn_quarter = 2 THEN pos END) AS q2,",
        "         MAX(CASE WHEN txn_quarter = 3 THEN pos END) AS q3, MAX(CASE WHEN txn_quarter = 4 THEN pos END) AS q4",
        "  FROM ranked GROUP BY state, district",
        ")",
        "SELECT state, district, q1 AS q1_rank, q4 AS q4_rank FROM pivot WHERE q2 < q1 AND q3 < q2 AND q4 < q3",
      ].join("\n"),
    ],
    hints: [
      "First rank inside each (state, quarter) with a function that lets ties share a rank and skips the next one.",
      "Rank only 2024 rows; a 2023 row must not take a place in the 2024 ranking.",
      "Then compare each quarter's rank with the previous quarter's — `LAG` — and require three strict improvements out of four rows.",
    ],
    editorial: [
      "Two window passes. The first is the ranking itself: `RANK() OVER (PARTITION BY state, txn_quarter ORDER BY txn_count DESC)` over the 2024 rows, which gives tied districts the same rank and skips the next number, as the statement defines. Filtering the year **before** ranking matters — the big 2023 Belagavi row in the first example would otherwise take first place in the Q4 table.",
      "",
      "The second pass looks back one quarter per district with `LAG(pos)`. After grouping by district, `COUNT(*) = 4` demands a row in every quarter, and three strict improvements (`pos < prev_pos`) out of the three comparisons means the rank fell every time. Udupi goes 4 → 3 → 2 → 1 and qualifies. In the second example Warangal would have climbed but has no Q3 row, so it is out; Rangareddy's tie for second in Q1 then a plain second in Q2 is no improvement.",
      "",
      "The alternatives pivot instead of using `LAG`: a four-way self-join of the ranked rows (each join also enforces presence in that quarter), or a rank computed as 1 + the number of districts with a larger count — the same skipping-ranks definition — followed by conditional `MAX` per quarter. A NULL quarter makes their comparisons unknown, which drops the district just like the count test.",
    ].join("\n"),
  },

  {
    slug: "phonepe-merchants-reliant-on-three-customers",
    title: "PhonePe: Merchants Earning Half Their Takings From Three Customers",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation", "Dates"],
    description: [
      "Merchant-lending looks at how concentrated a shop's income is before offering a loan: a shop that lives off a few regular customers is a different risk from one with a broad base.",
      "",
      "Using **successful** payments made in **March 2025** only, find merchants that had **at least 5 different** paying customers in that month and whose **three biggest customers** (by their total March spend at that merchant) paid **at least half** of the merchant's March takings. Return `merchant_id`, `march_takings` and `top3_takings`. When customers tie for third place, any of them may fill the slot — the sum is the same. Order the rows by `merchant_id`.",
    ].join("\n"),
    tables: [
      {
        name: "MerchantPayment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "merchant_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["success", "failed"] },
          { name: "paid_on", type: "date" },
        ],
        primaryKey: ["payment_id"],
        note: "One row per payment from a customer to a merchant.",
      },
    ],
    examples: [
      {
        MerchantPayment: [
          [1, 1, 11, 300, "success", "2025-03-02"],
          [2, 1, 11, 200, "success", "2025-03-20"],
          [3, 1, 12, 300, "success", "2025-03-05"],
          [4, 1, 13, 100, "success", "2025-03-06"],
          [5, 1, 14, 100, "success", "2025-03-07"],
          [6, 1, 15, 100, "success", "2025-03-08"],
          [7, 1, 16, 100, "success", "2025-03-31"],
          [8, 2, 11, 100, "success", "2025-03-01"],
          [9, 2, 12, 100, "success", "2025-03-02"],
          [10, 2, 13, 100, "success", "2025-03-03"],
          [11, 2, 14, 100, "success", "2025-03-04"],
          [12, 2, 15, 100, "success", "2025-03-05"],
          [13, 2, 16, 100, "success", "2025-03-06"],
          [14, 2, 17, 900, "failed", "2025-03-07"],
          [15, 3, 11, 800, "success", "2025-03-10"],
          [16, 3, 12, 50, "success", "2025-03-11"],
          [17, 3, 13, 50, "success", "2025-03-12"],
          [18, 3, 14, 50, "success", "2025-03-13"],
          [19, 3, 15, 700, "success", "2025-04-01"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      for (const m of seq(1, ri(rng, 1, 4))) {
        const customers = sample(rng, seq(11, 10), ri(rng, 4, 9));
        const whale = chance(rng, 0.6) ? pick(rng, customers) : -1;
        for (let k = ri(rng, 6, 14); k > 0; k--) {
          const c = pick(rng, customers);
          rows.push([
            id++, m, c,
            c === whale ? roundTo(rng, 500, 2000, 50) : roundTo(rng, 50, 400, 50),
            chance(rng, 0.88) ? "success" : "failed",
            chance(rng, 0.85) ? dateBetween(rng, "2025-03-01", "2025-03-31") : pick(rng, ["2025-02-28", "2025-04-01"]),
          ]);
        }
      }
      return { MerchantPayment: shuffle(rng, rows) };
    },
    solution: [
      "WITH spend AS (",
      "  SELECT merchant_id, customer_id, SUM(amount) AS spent",
      "  FROM MerchantPayment",
      "  WHERE status = 'success' AND paid_on BETWEEN '2025-03-01' AND '2025-03-31'",
      "  GROUP BY merchant_id, customer_id",
      "), ranked AS (",
      "  SELECT merchant_id, spent,",
      "         ROW_NUMBER() OVER (PARTITION BY merchant_id ORDER BY spent DESC, customer_id) AS rn",
      "  FROM spend",
      ")",
      "SELECT merchant_id, SUM(spent) AS march_takings,",
      "       SUM(CASE WHEN rn <= 3 THEN spent ELSE 0 END) AS top3_takings",
      "FROM ranked",
      "GROUP BY merchant_id",
      "HAVING COUNT(*) >= 5",
      "   AND 2 * SUM(CASE WHEN rn <= 3 THEN spent ELSE 0 END) >= SUM(spent)",
      "ORDER BY merchant_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH spend AS (SELECT merchant_id, customer_id, SUM(amount) AS spent FROM MerchantPayment WHERE status = 'success' AND paid_on >= '2025-03-01' AND paid_on < '2025-04-01' GROUP BY merchant_id, customer_id),",
        "top3 AS (",
        "  SELECT a.merchant_id, SUM(a.spent) AS top3_takings FROM spend a",
        "  WHERE (SELECT COUNT(*) FROM spend b WHERE b.merchant_id = a.merchant_id",
        "         AND (b.spent > a.spent OR (b.spent = a.spent AND b.customer_id < a.customer_id))) < 3",
        "  GROUP BY a.merchant_id",
        "), tot AS (SELECT merchant_id, SUM(spent) AS march_takings, COUNT(*) AS customers FROM spend GROUP BY merchant_id)",
        "SELECT t.merchant_id, t.march_takings, p.top3_takings FROM tot t JOIN top3 p ON p.merchant_id = t.merchant_id",
        "WHERE t.customers >= 5 AND 2 * p.top3_takings >= t.march_takings",
        "ORDER BY t.merchant_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Total each customer's March spend at each merchant first; the ranking is of customers, not of payments.",
      "Number the customers per merchant from the biggest spender down and add up the first three.",
      "\"At least half\" without division: `2 * top3 >= total`.",
    ],
    editorial: [
      "The unit of the ranking is a customer, so the first step collapses payments into one total per `(merchant, customer)`, keeping only successful payments dated inside March — merchant 3's April payment and merchant 2's failed one are gone before anything is ranked. Each merchant's number of rows is then its number of distinct paying customers, so `COUNT(*) >= 5` is the breadth test (merchant 3 has only four).",
      "",
      "`ROW_NUMBER()` over each merchant's customers ordered by spend (descending) numbers them from the biggest down; the sum of the spend where `rn <= 3` is the top three's share, and the sum of all is the takings. Ties at third place do not change that sum — whichever tied customer gets number 3, the amount added is the same — and the `customer_id` tie-break only makes the numbering deterministic. `RANK()` would be wrong here: four customers tied at the top would all get rank 1 and be added. Merchant 2 shows the boundary: 300 of 600 is exactly half, which counts.",
      "",
      "The alternative ranks without a window: a customer is in the top three when fewer than three customers of the same merchant come before it in (spend desc, id asc) order. It is quadratic per merchant, where the window is one sort.",
    ].join("\n"),
  },

  {
    slug: "phonepe-three-way-circular-transfers",
    title: "PhonePe: Three-Way Circular Transfers Within 24 Hours",
    difficulty: "HARD",
    topics: ["Joins", "Dates", "Conditional Logic"],
    description: [
      "Money that goes round in a circle — A pays B, B pays C, C pays A — can be used to fake activity or launder funds. The fraud-analytics team scans for three-person rings that close quickly.",
      "",
      "A **ring** is three **successful** transfers A → B, B → C and C → A between three different users, each sent **strictly after** the previous one, with the last sent **no more than 24 hours** after the first. Report each ring once as `user_1`, `user_2`, `user_3`: `user_1` is the **smallest** user id of the three, and the others follow the direction the money moved (`user_1` paid `user_2`, `user_2` paid `user_3`). A ring that occurs several times is listed once. Order the rows by `user_1`, `user_2`, `user_3`.",
    ].join("\n"),
    tables: [
      {
        name: "Transfer",
        columns: [
          { name: "transfer_id", type: "int" },
          { name: "from_user", type: "int" },
          { name: "to_user", type: "int" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["success", "failed"] },
          { name: "sent_at", type: "datetime" },
        ],
        primaryKey: ["transfer_id"],
        note: "One row per peer-to-peer transfer; `from_user` and `to_user` are always different.",
      },
    ],
    examples: [
      {
        Transfer: [
          [1, 101, 102, 5000, "success", "2025-09-01 10:00:00"],
          [2, 102, 103, 4900, "success", "2025-09-01 14:00:00"],
          [3, 103, 101, 4800, "success", "2025-09-02 10:00:00"],
          [4, 104, 105, 2000, "success", "2025-09-01 09:00:00"],
          [5, 105, 106, 2000, "success", "2025-09-01 09:30:00"],
          [6, 106, 104, 2000, "success", "2025-09-02 09:01:00"],
          [7, 107, 108, 700, "success", "2025-09-03 08:00:00"],
          [8, 108, 105, 700, "success", "2025-09-03 08:05:00"],
          [9, 105, 107, 700, "failed", "2025-09-03 08:10:00"],
          [10, 106, 109, 9000, "success", "2025-09-04 10:00:00"],
          [11, 109, 104, 9000, "success", "2025-09-04 11:00:00"],
          [12, 104, 106, 9000, "success", "2025-09-04 12:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const users = seq(101, ri(rng, 4, 8));
      const rows: Cell[][] = [];
      let id = 1;
      const send = (a: number, b: number, m: number, ok = chance(rng, 0.9)) =>
        rows.push([id++, a, b, roundTo(rng, 100, 10000, 100), ok ? "success" : "failed", at("2025-09-01", m)]);
      for (let k = ri(rng, 0, 14); k > 0; k--) {
        const [a, b] = sample(rng, users, 2);
        send(a!, b!, ri(rng, 0, 4000));
      }
      for (let r = chance(rng, 0.9) ? ri(rng, 1, 2) : 0; r > 0; r--) {
        const [a, b, c] = sample(rng, users, 3);
        const t = ri(rng, 0, 3000);
        const t2 = t + ri(rng, 1, 299);
        send(a!, b!, t, true);
        send(b!, c!, t2, true);
        send(c!, a!, t + pick(rng, [300, 900, 1440, 1440, 1441]), chance(rng, 0.9));
      }
      return { Transfer: shuffle(rng, rows) };
    },
    solution: [
      "WITH s AS (",
      "  SELECT from_user, to_user, sent_at FROM Transfer WHERE status = 'success'",
      "), ring AS (",
      "  SELECT t1.from_user AS a, t1.to_user AS b, t2.to_user AS c",
      "  FROM s t1",
      "  JOIN s t2 ON t2.from_user = t1.to_user AND t2.sent_at > t1.sent_at",
      "  JOIN s t3 ON t3.from_user = t2.to_user AND t3.to_user = t1.from_user",
      "           AND t3.sent_at > t2.sent_at",
      "           AND t3.sent_at <= DATE_ADD(t1.sent_at, INTERVAL 24 HOUR)",
      "  WHERE t2.to_user <> t1.from_user",
      ")",
      "SELECT DISTINCT",
      "       CASE WHEN a < b AND a < c THEN a WHEN b < c THEN b ELSE c END AS user_1,",
      "       CASE WHEN a < b AND a < c THEN b WHEN b < c THEN c ELSE a END AS user_2,",
      "       CASE WHEN a < b AND a < c THEN c WHEN b < c THEN a ELSE b END AS user_3",
      "FROM ring",
      "ORDER BY user_1, user_2, user_3",
    ].join("\n"),
    alternatives: [
      [
        "WITH s AS (SELECT from_user, to_user, sent_at FROM Transfer WHERE status = 'success'),",
        "ring AS (",
        "  SELECT t1.from_user AS a, t2.from_user AS b, t3.from_user AS c",
        "  FROM s t1, s t2, s t3",
        "  WHERE t1.to_user = t2.from_user AND t2.to_user = t3.from_user AND t3.to_user = t1.from_user",
        "    AND t3.from_user <> t1.from_user",
        "    AND t1.sent_at < t2.sent_at AND t2.sent_at < t3.sent_at",
        "    AND TIMESTAMPDIFF(SECOND, t1.sent_at, t3.sent_at) <= 86400",
        "),",
        "rotations AS (",
        "  SELECT a AS user_1, b AS user_2, c AS user_3 FROM ring",
        "  UNION SELECT b, c, a FROM ring",
        "  UNION SELECT c, a, b FROM ring",
        ")",
        "SELECT user_1, user_2, user_3 FROM rotations",
        "WHERE user_1 < user_2 AND user_1 < user_3",
        "ORDER BY user_1, user_2, user_3",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Chain three copies of the successful transfers: the receiver of each is the sender of the next, and the last pays the first sender back.",
      "Put the time rules in the joins: each transfer strictly later than the previous, the last within 24 hours of the first.",
      "The same ring can be found starting from any of its three members — rotate it so the smallest id comes first, then remove duplicates.",
    ],
    editorial: [
      "A ring is a path of length three in the transfer graph that returns to its start, so the query is a three-way self-join of the successful transfers: `t2` starts where `t1` ended, `t3` starts where `t2` ended and ends where `t1` started. The join conditions also carry the time rules — `t2` strictly after `t1`, `t3` strictly after `t2`, and `t3` no later than `DATE_ADD(t1.sent_at, INTERVAL 24 HOUR)`. The extra `t2.to_user <> t1.from_user` excludes a back-and-forth A → B → A, which is not three people.",
      "",
      "The same ring can be discovered with any member as the first sender — in the example the 104/106/109 ring starts with 106 paying 109 — so each match is rotated into one canonical form: the smallest id first, keeping the direction of the money. The `CASE` expressions pick the rotation; `DISTINCT` then lists a ring once however many times it ran. Ring 104 → 105 → 106 → 104 closed 24 hours and one minute after it opened, so it is not reported; exactly 24 hours (101 → 102 → 103) is.",
      "",
      "The alternative writes the rotation as three `UNION`ed rows per ring and keeps the one whose first user is the smallest, letting `UNION` remove duplicates. The self-join is the costly part; with an index on `(from_user, sent_at)` each step only reads one user's transfers.",
    ].join("\n"),
  },
];
