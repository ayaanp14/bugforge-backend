import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, chance, dateBetween, LAST_NAMES, names, pick, ri, roundTo, sample } from "./kit.js";

/**
 * Banking and fintech, as the analysts, risk teams and operations desks of an
 * Indian bank or payments app meet them: UPI transfers and their handles,
 * KYC, savings/current accounts and balances computed from a ledger, fixed
 * deposits, loans and their EMIs (overdue and missed instalments), credit
 * cards and utilisation, fraud signals such as bursts of repeated transfers,
 * minimum-average-balance checks and cohort retention of a payments app.
 * Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
const pad = (n: number) => String(n).padStart(2, "0");
/** 'YYYY-MM-DD HH:MM:SS' from a date and seconds since midnight. */
const stamp = (date: string, secs: number) =>
  `${date} ${pad(Math.floor(secs / 3600))}:${pad(Math.floor((secs % 3600) / 60))}:${pad(secs % 60)}`;
const fullName = (rng: () => number, first: string) => `${first} ${pick(rng, LAST_NAMES)}`;

const UPI_HANDLES = ["okaxis", "oksbi", "okhdfcbank", "okicici", "ybl", "paytm", "ibl", "axl"] as const;
const vpaOf = (name: string, handle: string, i: number) => `${name.toLowerCase()}${i}@${handle}`;
const BRANCHES = [
  ["MG Road", "Bengaluru"], ["Andheri West", "Mumbai"], ["Connaught Place", "Delhi"], ["Banjara Hills", "Hyderabad"],
  ["T Nagar", "Chennai"], ["Koregaon Park", "Pune"], ["Salt Lake", "Kolkata"], ["Navrangpura", "Ahmedabad"],
] as const;

export const WORLD_BANKING: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "high-value-upi-transfers-for-review",
    title: "High-Value UPI Transfers for Compliance Review",
    difficulty: "EASY",
    topics: ["Basics"],
    description: [
      "The compliance desk reviews every UPI transfer of **₹50,000 or more** that actually went through. Failed and pending transfers moved no money and are not reviewed.",
      "",
      "Return `txn_id`, `payer_vpa` and `amount` for every transfer with status `SUCCESS` and an amount of at least 50,000 (a transfer of exactly 50,000 is included). Order the rows by `amount` descending, then by `txn_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "UpiTransaction",
        columns: [
          { name: "txn_id", type: "int" },
          { name: "payer_vpa", type: "varchar" },
          { name: "payee_vpa", type: "varchar" },
          { name: "amount", type: "decimal" },
          { name: "status", type: "enum", values: ["SUCCESS", "FAILED", "PENDING"] },
          { name: "txn_time", type: "datetime" },
        ],
        primaryKey: ["txn_id"],
        note: "One row per UPI transfer attempt; `amount` is in rupees.",
      },
    ],
    examples: [
      {
        UpiTransaction: [
          [1, "aarav1@okaxis", "kirana7@ybl", 1250, "SUCCESS", "2024-08-01 09:12:44"],
          [2, "diya2@oksbi", "rent.owner@okicici", 50000, "SUCCESS", "2024-08-01 10:05:10"],
          [3, "rohan3@paytm", "car.dealer@okhdfcbank", 175000, "FAILED", "2024-08-02 14:20:00"],
          [4, "meera4@ybl", "jewels.shop@ibl", 82500.5, "SUCCESS", "2024-08-03 18:45:31"],
          [5, "kabir5@okaxis", "college.fees@oksbi", 49999.99, "SUCCESS", "2024-08-04 11:00:02"],
          [6, "priya6@okicici", "builder@axl", 82500.5, "SUCCESS", "2024-08-05 16:30:00"],
          [7, "neha7@oksbi", "laptop.store@ybl", 64000, "PENDING", "2024-08-06 20:10:15"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 18);
      const who = names(rng, 12);
      const shared = roundTo(rng, 50000, 150000, 2500);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const r = rng();
        const amount = r < 0.2 ? 50000 : r < 0.35 ? shared : r < 0.5 ? 49999.99 : r < 0.75 ? roundTo(rng, 100, 30000, 50) : roundTo(rng, 50000, 250000, 500);
        const status = pick(rng, ["SUCCESS", "SUCCESS", "SUCCESS", "FAILED", "PENDING"] as const);
        const date = dateBetween(rng, "2024-01-01", "2024-12-31");
        return [id, vpaOf(pick(rng, who), pick(rng, UPI_HANDLES), id), `merchant${ri(rng, 1, 9)}@${pick(rng, UPI_HANDLES)}`, amount, status, stamp(date, ri(rng, 0, 86399))];
      });
      return { UpiTransaction: rows };
    },
    solution: [
      "SELECT txn_id, payer_vpa, amount",
      "FROM UpiTransaction",
      "WHERE status = 'SUCCESS' AND amount >= 50000",
      "ORDER BY amount DESC, txn_id",
    ].join("\n"),
    alternatives: [
      "SELECT txn_id, payer_vpa, amount FROM UpiTransaction WHERE status IN ('SUCCESS') AND NOT amount < 50000 ORDER BY amount DESC, txn_id ASC",
    ],
    ordered: true,
    hints: [
      "Two conditions must both hold: the transfer succeeded, and the amount reaches the threshold.",
      "\"₹50,000 or more\" includes 50,000 itself — pick the comparison operator accordingly.",
      "Two transfers can have the same amount, so the order needs a second key.",
    ],
    editorial: [
      "This is a filter and a sort. The `WHERE` clause keeps a row only when both conditions are true: `status = 'SUCCESS'` (failed and pending attempts moved no money) and `amount >= 50000`. The threshold is inclusive, so a transfer of exactly ₹50,000 is in the answer while one of ₹49,999.99 is not — the classic off-by-one of `>` versus `>=`.",
      "",
      "The statement fixes the order: largest amount first, and among equal amounts the smaller `txn_id` first. Without the second key two transfers of the same amount could come back in either order, and an ordered comparison would fail depending on how the rows happen to be stored.",
      "",
      "An index on `(status, amount)` lets the database read only the qualifying rows; without one it is a single scan of the table followed by a sort of the matches. Writing the condition as `NOT amount < 50000` or `status IN ('SUCCESS')` is equivalent.",
    ].join("\n"),
  },

  {
    slug: "customers-without-a-verified-kyc-document",
    title: "Customers Without a Verified KYC Document",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "RBI rules let a customer transact only after at least one officially valid document has been verified. Customers upload PAN, Aadhaar or passport copies, and each upload is reviewed separately.",
      "",
      "Return `customer_id` and `full_name` of every customer who has **no document with status `VERIFIED`** — whether they uploaded only pending or rejected documents or nothing at all. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Customer",
        columns: [
          { name: "customer_id", type: "int" },
          { name: "full_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["customer_id"],
        note: "One row per customer of the bank.",
      },
      {
        name: "KycDocument",
        columns: [
          { name: "doc_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "doc_type", type: "enum", values: ["PAN", "AADHAAR", "PASSPORT"] },
          { name: "status", type: "enum", values: ["VERIFIED", "PENDING", "REJECTED"] },
        ],
        primaryKey: ["doc_id"],
        note: "One row per uploaded document; `customer_id` always names a row of `Customer`.",
      },
    ],
    examples: [
      {
        Customer: [
          [1, "Aarav Sharma", "Pune"],
          [2, "Diya Nair", "Kochi"],
          [3, "Ishaan Reddy", "Hyderabad"],
          [4, "Kavya Iyer", "Chennai"],
          [5, "Rohan Gupta", "Delhi"],
        ],
        KycDocument: [
          [1, 1, "PAN", "VERIFIED"],
          [2, 2, "AADHAAR", "REJECTED"],
          [3, 2, "PAN", "PENDING"],
          [4, 4, "PASSPORT", "REJECTED"],
          [5, 4, "AADHAAR", "VERIFIED"],
          [6, 1, "AADHAAR", "PENDING"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const who = names(rng, n);
      const customers = who.map((f, i) => [i + 1, fullName(rng, f), pick(rng, ["Pune", "Kochi", "Delhi", "Jaipur", "Mumbai"])]);
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 20);
      const docs = seq(1, m).map((id) => [
        id, ri(rng, 1, n), pick(rng, ["PAN", "AADHAAR", "PASSPORT"] as const), pick(rng, ["VERIFIED", "PENDING", "REJECTED", "REJECTED"] as const),
      ]);
      return { Customer: customers, KycDocument: docs };
    },
    solution: [
      "SELECT c.customer_id, c.full_name",
      "FROM Customer c",
      "LEFT JOIN KycDocument k ON k.customer_id = c.customer_id AND k.status = 'VERIFIED'",
      "WHERE k.doc_id IS NULL",
    ].join("\n"),
    alternatives: [
      "SELECT customer_id, full_name FROM Customer c WHERE NOT EXISTS (SELECT 1 FROM KycDocument k WHERE k.customer_id = c.customer_id AND k.status = 'VERIFIED')",
      "SELECT customer_id, full_name FROM Customer WHERE customer_id NOT IN (SELECT customer_id FROM KycDocument WHERE status = 'VERIFIED')",
      [
        "SELECT c.customer_id, c.full_name FROM Customer c LEFT JOIN KycDocument k ON k.customer_id = c.customer_id",
        "GROUP BY c.customer_id, c.full_name",
        "HAVING SUM(CASE WHEN k.status = 'VERIFIED' THEN 1 ELSE 0 END) = 0 OR COUNT(k.doc_id) = 0",
      ].join("\n"),
    ],
    hints: [
      "Start from `Customer`: someone with no uploads at all must still be in the answer.",
      "You are looking for the absence of one particular kind of document — a verified one.",
      "With a LEFT JOIN, where the status condition sits (in `ON` or in `WHERE`) changes the result completely.",
    ],
    editorial: [
      "This is an **anti join** with a condition on the partner rows: keep the customers for whom no *verified* document exists. The cleanest LEFT JOIN form puts the status test inside the `ON` clause, so the join only ever matches verified documents; a customer with none gets a single row of NULLs, which `k.doc_id IS NULL` keeps.",
      "",
      "Moving `k.status = 'VERIFIED'` into the `WHERE` clause instead would be a bug: it would throw away the NULL rows of unmatched customers and keep only customers who *do* have a verified document — the opposite of the question. A customer with a rejected and a pending upload would also vanish.",
      "",
      "`NOT EXISTS` states the rule directly and is usually the plan an optimiser picks. `NOT IN` is safe here because `customer_id` in the documents is never NULL. A grouped version counts verified documents per customer and keeps the zeros. Each form is one pass over customers with an index lookup on `KycDocument(customer_id)`.",
    ].join("\n"),
  },

  {
    slug: "active-deposits-held-at-each-branch",
    title: "Active Deposits Held at Each Branch",
    difficulty: "EASY",
    topics: ["Aggregation", "Joins"],
    description: [
      "The regional head wants each branch's deposit book: how many **active** accounts it holds and their combined balance. Closed accounts no longer count. A branch with no active account still appears, with 0 accounts and a total of 0.",
      "",
      "Return `branch_id`, `branch_name`, `active_accounts` and `total_balance`, ordered by `total_balance` descending, then by `branch_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Branch",
        columns: [
          { name: "branch_id", type: "int" },
          { name: "branch_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["branch_id"],
        note: "One row per branch.",
      },
      {
        name: "Account",
        columns: [
          { name: "account_id", type: "int" },
          { name: "branch_id", type: "int" },
          { name: "account_type", type: "enum", values: ["SAVINGS", "CURRENT"] },
          { name: "balance", type: "int" },
          { name: "status", type: "enum", values: ["ACTIVE", "CLOSED"] },
        ],
        primaryKey: ["account_id"],
        note: "One row per account; `branch_id` always names a row of `Branch`. `balance` is in rupees.",
      },
    ],
    examples: [
      {
        Branch: [
          [1, "MG Road", "Bengaluru"],
          [2, "Andheri West", "Mumbai"],
          [3, "Salt Lake", "Kolkata"],
          [4, "T Nagar", "Chennai"],
        ],
        Account: [
          [101, 1, "SAVINGS", 45000, "ACTIVE"],
          [102, 1, "CURRENT", 230000, "ACTIVE"],
          [103, 2, "SAVINGS", 180000, "ACTIVE"],
          [104, 2, "SAVINGS", 95000, "ACTIVE"],
          [105, 3, "SAVINGS", 60000, "CLOSED"],
          [106, 4, "CURRENT", 275000, "ACTIVE"],
          [107, 1, "SAVINGS", 0, "CLOSED"],
        ],
      },
    ],
    gen: (rng) => {
      const branches = sample(rng, BRANCHES, ri(rng, 1, 6)).map(([b, c], i) => [i + 1, b, c]);
      const n = chance(rng, 0.08) ? 0 : ri(rng, 1, 20);
      const accounts = seq(101, n).map((id) => [
        id, ri(rng, 1, branches.length), pick(rng, ["SAVINGS", "SAVINGS", "CURRENT"] as const),
        roundTo(rng, 0, 300000, 5000), chance(rng, 0.25) ? "CLOSED" : "ACTIVE",
      ]);
      return { Branch: branches, Account: accounts };
    },
    solution: [
      "SELECT b.branch_id, b.branch_name,",
      "       COUNT(a.account_id) AS active_accounts,",
      "       COALESCE(SUM(a.balance), 0) AS total_balance",
      "FROM Branch b",
      "LEFT JOIN Account a ON a.branch_id = b.branch_id AND a.status = 'ACTIVE'",
      "GROUP BY b.branch_id, b.branch_name",
      "ORDER BY total_balance DESC, b.branch_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT b.branch_id, b.branch_name,",
        "  (SELECT COUNT(*) FROM Account a WHERE a.branch_id = b.branch_id AND a.status = 'ACTIVE') AS active_accounts,",
        "  (SELECT COALESCE(SUM(balance), 0) FROM Account a WHERE a.branch_id = b.branch_id AND a.status = 'ACTIVE') AS total_balance",
        "FROM Branch b ORDER BY total_balance DESC, b.branch_id",
      ].join("\n"),
      [
        "SELECT b.branch_id, b.branch_name,",
        "  SUM(CASE WHEN a.status = 'ACTIVE' THEN 1 ELSE 0 END) AS active_accounts,",
        "  SUM(CASE WHEN a.status = 'ACTIVE' THEN a.balance ELSE 0 END) AS total_balance",
        "FROM Branch b LEFT JOIN Account a ON a.branch_id = b.branch_id",
        "GROUP BY b.branch_id, b.branch_name ORDER BY total_balance DESC, b.branch_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Every branch must appear, so the branch table drives the query and accounts are joined to it.",
      "Filter closed accounts out without losing the branch — think about where the status test goes in a LEFT JOIN.",
      "`SUM` over no rows is NULL, not 0; `COUNT(column)` over no matched rows is 0.",
    ],
    editorial: [
      "Group accounts by branch and aggregate, but start from `Branch` with a LEFT JOIN so a branch whose accounts are all closed (or that has none) still produces a row. The status test belongs in the `ON` clause: in `WHERE` it would discard the NULL row of an unmatched branch and the branch would disappear.",
      "",
      "For a branch with no active account, the joined account columns are NULL. `COUNT(a.account_id)` counts only non-NULL values and gives 0, while `SUM(a.balance)` over only NULLs is NULL — `COALESCE(…, 0)` turns it into the 0 the statement asks for.",
      "",
      "Conditional aggregation (`SUM(CASE WHEN status = 'ACTIVE' …)`) over a plain LEFT JOIN gets there too, and the CASE's `ELSE 0` handles the empty branch on its own; two correlated subqueries per branch are the third option. The tie on total balance is broken by `branch_id`, so the order is fixed. The cost is one pass over accounts plus a sort of the branches.",
    ].join("\n"),
  },

  {
    slug: "masked-card-numbers-for-statements",
    title: "Masked Card Numbers for Card Statements",
    difficulty: "EASY",
    topics: ["Strings"],
    description: [
      "Card statements may never show a full card number. The card team prints only the last four digits behind a fixed mask, and the holder's name the way it is embossed — in capitals. Some card numbers were captured with spaces between the groups of four digits.",
      "",
      "Return `card_id`, `embossed_name` (the holder name in upper case) and `masked_number`, which is `XXXX-XXXX-XXXX-` followed by the card's last four digits. Order the rows by `card_id`.",
    ].join("\n"),
    tables: [
      {
        name: "CreditCard",
        columns: [
          { name: "card_id", type: "int" },
          { name: "holder_name", type: "varchar" },
          { name: "card_number", type: "varchar" },
          { name: "network", type: "enum", values: ["VISA", "MASTERCARD", "RUPAY"] },
        ],
        primaryKey: ["card_id"],
        note: "`card_number` holds 16 digits, stored either as one run or in four groups separated by single spaces.",
      },
    ],
    examples: [
      {
        CreditCard: [
          [1, "Aarav Sharma", "4111222233334821", "VISA"],
          [2, "Diya Nair", "5326 7788 1200 0457", "MASTERCARD"],
          [3, "Kabir Khan", "6521000011119900", "RUPAY"],
          [4, "Sara Menon", "4532 0101 2020 3036", "VISA"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const who = names(rng, n);
      const rows = who.map((f, i) => {
        const prefix = pick(rng, ["4", "5", "6"]);
        let digits = prefix;
        while (digits.length < 16) digits += String(ri(rng, 0, 9));
        const spaced = chance(rng, 0.4) ? digits.replace(/(\d{4})(?=\d)/g, "$1 ") : digits;
        return [i + 1, fullName(rng, f), spaced, prefix === "4" ? "VISA" : prefix === "5" ? "MASTERCARD" : "RUPAY"];
      });
      return { CreditCard: rows };
    },
    solution: [
      "SELECT card_id,",
      "       UPPER(holder_name) AS embossed_name,",
      "       CONCAT('XXXX-XXXX-XXXX-', RIGHT(card_number, 4)) AS masked_number",
      "FROM CreditCard",
      "ORDER BY card_id",
    ].join("\n"),
    alternatives: [
      "SELECT card_id, UCASE(holder_name) AS embossed_name, CONCAT(REPEAT('XXXX-', 3), SUBSTRING(REPLACE(card_number, ' ', ''), 13, 4)) AS masked_number FROM CreditCard ORDER BY card_id",
      "SELECT card_id, UPPER(holder_name) AS embossed_name, CONCAT('XXXX-XXXX-XXXX-', SUBSTRING(card_number, CHAR_LENGTH(card_number) - 3)) AS masked_number FROM CreditCard ORDER BY card_id",
    ],
    ordered: true,
    hints: [
      "Spaces only ever sit between groups, so the last four characters are always the last four digits.",
      "`RIGHT(text, n)` returns the last `n` characters; `CONCAT` glues the fixed mask in front.",
      "Upper-casing a name is a single function call.",
    ],
    editorial: [
      "The work is all string functions on each row. The holder name becomes `UPPER(holder_name)`. For the mask, notice that the spaces in some card numbers only ever separate the groups of four, so whether a number is stored as `4111222233334821` or `4111 2222 3333 4821`, its last four characters are its last four digits — `RIGHT(card_number, 4)` is enough, and `CONCAT('XXXX-XXXX-XXXX-', …)` adds the fixed prefix.",
      "",
      "If the spacing were less regular, the safe version strips the spaces first with `REPLACE(card_number, ' ', '')` and then takes characters 13 to 16 with `SUBSTRING` — the first alternative does exactly that. Another way is `SUBSTRING(card_number, CHAR_LENGTH(card_number) - 3)`, which starts four characters from the end.",
      "",
      "Masking in the query is also good practice in real systems: the full number never needs to leave the database for the statement printer. The query is a single scan with no sort beyond the primary key order.",
    ].join("\n"),
  },

  {
    slug: "fixed-deposits-maturing-in-march-2025",
    title: "Fixed Deposits Maturing in March 2025",
    difficulty: "EASY",
    topics: ["Dates"],
    description: [
      "Relationship managers call customers a month before their fixed deposits mature, to offer a renewal. A deposit matures exactly `tenure_months` months after its `start_date` (the same day of the month).",
      "",
      "Return `fd_id`, `customer_name` and `maturity_date` for every deposit that **matures in March 2025** (1 to 31 March inclusive). Order the rows by `maturity_date`, then by `fd_id`.",
    ].join("\n"),
    tables: [
      {
        name: "FixedDeposit",
        columns: [
          { name: "fd_id", type: "int" },
          { name: "customer_name", type: "varchar" },
          { name: "principal", type: "int" },
          { name: "rate_pct", type: "decimal" },
          { name: "start_date", type: "date" },
          { name: "tenure_months", type: "int" },
        ],
        primaryKey: ["fd_id"],
        note: "One row per fixed deposit. Start dates always fall on day 1–28 of a month.",
      },
    ],
    examples: [
      {
        FixedDeposit: [
          [1, "Meera Iyer", 200000, 7.1, "2024-03-15", 12],
          [2, "Rahul Verma", 50000, 6.8, "2024-09-01", 6],
          [3, "Ananya Das", 500000, 7.25, "2022-03-28", 36],
          [4, "Vikram Singh", 100000, 7.0, "2024-04-01", 12],
          [5, "Zara Khan", 75000, 6.5, "2024-12-10", 3],
          [6, "Harsh Patel", 300000, 7.1, "2023-02-20", 24],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const who = names(rng, n);
      const rows = who.map((f, i) => {
        const tenure = pick(rng, [3, 6, 12, 12, 24, 36]);
        // Mostly near March 2025, so some mature in it and some just miss it.
        const offset = tenure + ri(rng, -2, 1); // months before 2025-03
        const total = 2025 * 12 + 2 - offset; // 0-based month index
        const start = `${Math.floor(total / 12)}-${pad((total % 12) + 1)}-${pad(ri(rng, 1, 28))}`;
        return [i + 1, fullName(rng, f), roundTo(rng, 10000, 500000, 5000), pick(rng, [6.5, 6.8, 7, 7.1, 7.25]), start, tenure];
      });
      return { FixedDeposit: rows };
    },
    solution: [
      "SELECT fd_id, customer_name, DATE_ADD(start_date, INTERVAL tenure_months MONTH) AS maturity_date",
      "FROM FixedDeposit",
      "WHERE DATE_ADD(start_date, INTERVAL tenure_months MONTH) BETWEEN '2025-03-01' AND '2025-03-31'",
      "ORDER BY maturity_date, fd_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT fd_id, customer_name, maturity_date FROM (",
        "  SELECT fd_id, customer_name, DATE_ADD(start_date, INTERVAL tenure_months MONTH) AS maturity_date FROM FixedDeposit",
        ") t WHERE YEAR(maturity_date) = 2025 AND MONTH(maturity_date) = 3 ORDER BY maturity_date, fd_id",
      ].join("\n"),
      "SELECT fd_id, customer_name, DATE_ADD(start_date, INTERVAL tenure_months MONTH) AS maturity_date FROM FixedDeposit WHERE DATE_FORMAT(DATE_ADD(start_date, INTERVAL tenure_months MONTH), '%Y-%m') = '2025-03' ORDER BY maturity_date, fd_id",
    ],
    ordered: true,
    hints: [
      "The maturity date is not stored — compute it from the start date and the tenure.",
      "`DATE_ADD(date, INTERVAL n MONTH)` accepts a column for `n`.",
      "Filter the computed date to the month, inclusive of the 1st and the 31st.",
    ],
    editorial: [
      "The maturity date is derived, not stored: `DATE_ADD(start_date, INTERVAL tenure_months MONTH)` moves each start date forward by its own tenure, keeping the day of the month (the start dates stop at the 28th, so no month-end clamping is involved). Select it under the name `maturity_date` and filter on the same expression.",
      "",
      "The filter can be a range (`BETWEEN '2025-03-01' AND '2025-03-31'`, inclusive at both ends), a `YEAR(...) = 2025 AND MONTH(...) = 3` pair, or `DATE_FORMAT(..., '%Y-%m') = '2025-03'`. All three are equivalent here. In a real table the range form is preferred when the date is a stored, indexed column — but because this one is computed, every form scans the table.",
      "",
      "A column alias cannot be used in the `WHERE` of the same query (it is evaluated before `SELECT`), so either repeat the expression or compute it in a derived table and filter outside, as one alternative does. The order is fixed by maturity date with `fd_id` breaking ties.",
    ].join("\n"),
  },

  {
    slug: "loan-applicants-by-credit-score-band",
    title: "Loan Applicants by Credit Score Band",
    difficulty: "EASY",
    topics: ["Conditional Logic", "Basics"],
    description: [
      "The personal-loan desk prices every application by the applicant's bureau credit score. A score of **750 or above** is `Prime`, **650 to 749** is `Near Prime`, anything **below 650** is `Subprime`, and an applicant with no bureau record (score NULL) is `No Bureau Record`.",
      "",
      "Return `application_id`, `applicant_name` and `credit_band` for every application, ordered by `application_id`.",
    ].join("\n"),
    tables: [
      {
        name: "LoanApplication",
        columns: [
          { name: "application_id", type: "int" },
          { name: "applicant_name", type: "varchar" },
          { name: "credit_score", type: "int" },
          { name: "requested_amount", type: "int" },
        ],
        primaryKey: ["application_id"],
        note: "One row per application. `credit_score` is 300–900, or NULL when the bureau has no history for the applicant.",
      },
    ],
    examples: [
      {
        LoanApplication: [
          [1, "Aditi Rao", 812, 300000],
          [2, "Farhan Khan", 750, 150000],
          [3, "Neha Joshi", 749, 500000],
          [4, "Dev Mehta", null, 75000],
          [5, "Pooja Bose", 650, 200000],
          [6, "Karan Singh", 612, 400000],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 15);
      const who = names(rng, n);
      const rows = who.map((f, i) => {
        const r = rng();
        const score = r < 0.12 ? null : r < 0.3 ? pick(rng, [649, 650, 749, 750]) : ri(rng, 480, 880);
        return [i + 1, fullName(rng, f), score, roundTo(rng, 50000, 1500000, 25000)];
      });
      return { LoanApplication: rows };
    },
    solution: [
      "SELECT application_id, applicant_name,",
      "       CASE",
      "         WHEN credit_score IS NULL THEN 'No Bureau Record'",
      "         WHEN credit_score >= 750 THEN 'Prime'",
      "         WHEN credit_score >= 650 THEN 'Near Prime'",
      "         ELSE 'Subprime'",
      "       END AS credit_band",
      "FROM LoanApplication",
      "ORDER BY application_id",
    ].join("\n"),
    alternatives: [
      "SELECT application_id, applicant_name, IF(credit_score IS NULL, 'No Bureau Record', IF(credit_score >= 750, 'Prime', IF(credit_score >= 650, 'Near Prime', 'Subprime'))) AS credit_band FROM LoanApplication ORDER BY application_id",
      "SELECT application_id, applicant_name, COALESCE(CASE WHEN credit_score < 650 THEN 'Subprime' WHEN credit_score BETWEEN 650 AND 749 THEN 'Near Prime' WHEN credit_score > 749 THEN 'Prime' END, 'No Bureau Record') AS credit_band FROM LoanApplication ORDER BY application_id",
    ],
    ordered: true,
    hints: [
      "A `CASE` expression checks its `WHEN` branches top to bottom and takes the first that is true.",
      "Order the branches so each boundary (750, 650) lands in the right band.",
      "A comparison with NULL is never true — give NULL its own branch, or catch it at the end.",
    ],
    editorial: [
      "Each row maps to one label, which is what a searched `CASE` expression is for. The branches are tried in order, so testing `>= 750` first and then `>= 650` gives the bands without writing both ends of each range: a score that reaches the second branch is already known to be below 750.",
      "",
      "The NULL score needs care. Every comparison with NULL is unknown, so no numeric branch matches and the `CASE` would fall through to `ELSE` — labelling a missing score `Subprime`, a real mistake in lending. Testing `credit_score IS NULL` first avoids it. The second alternative takes the other route: it leaves out `ELSE`, so a NULL score yields NULL from the `CASE`, and `COALESCE` turns that into `No Bureau Record`.",
      "",
      "Nested `IF` calls work the same way in MySQL. Boundary values (exactly 750, 650 and 649) are where such queries usually go wrong, so check them first. The query is one scan; the sort is on the primary key.",
    ].join("\n"),
  },

  {
    slug: "customers-holding-savings-and-current-accounts",
    title: "Customers Holding Both Savings and Current Accounts",
    difficulty: "EASY",
    topics: ["Aggregation"],
    description: [
      "The bank is launching a sweep facility that links a customer's current account to their savings account. It is offered only to customers who hold **at least one `SAVINGS` and at least one `CURRENT` account**. Salary accounts do not count as either.",
      "",
      "Return the `customer_id` of every such customer, ordered by `customer_id`.",
    ].join("\n"),
    tables: [
      {
        name: "BankAccount",
        columns: [
          { name: "account_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "account_type", type: "enum", values: ["SAVINGS", "CURRENT", "SALARY"] },
          { name: "opened_on", type: "date" },
        ],
        primaryKey: ["account_id"],
        note: "One row per account. A customer may hold several accounts of the same type.",
      },
    ],
    examples: [
      {
        BankAccount: [
          [1, 11, "SAVINGS", "2021-04-12"],
          [2, 11, "CURRENT", "2022-07-01"],
          [3, 12, "SAVINGS", "2020-01-15"],
          [4, 12, "SALARY", "2023-06-30"],
          [5, 13, "CURRENT", "2019-11-05"],
          [6, 13, "CURRENT", "2024-02-02"],
          [7, 14, "SAVINGS", "2018-09-09"],
          [8, 14, "SAVINGS", "2021-03-03"],
          [9, 14, "CURRENT", "2024-01-20"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 22);
      const top = 11 + ri(rng, 1, 6);
      const rows = seq(1, n).map((id) => [
        id, ri(rng, 11, top), pick(rng, ["SAVINGS", "SAVINGS", "CURRENT", "CURRENT", "SALARY"] as const), dateBetween(rng, "2018-01-01", "2024-12-31"),
      ]);
      return { BankAccount: rows };
    },
    solution: [
      "SELECT customer_id",
      "FROM BankAccount",
      "GROUP BY customer_id",
      "HAVING SUM(CASE WHEN account_type = 'SAVINGS' THEN 1 ELSE 0 END) > 0",
      "   AND SUM(CASE WHEN account_type = 'CURRENT' THEN 1 ELSE 0 END) > 0",
      "ORDER BY customer_id",
    ].join("\n"),
    alternatives: [
      "SELECT customer_id FROM BankAccount WHERE account_type IN ('SAVINGS', 'CURRENT') GROUP BY customer_id HAVING COUNT(DISTINCT account_type) = 2 ORDER BY customer_id",
      "SELECT DISTINCT s.customer_id FROM BankAccount s JOIN BankAccount c ON c.customer_id = s.customer_id AND c.account_type = 'CURRENT' WHERE s.account_type = 'SAVINGS' ORDER BY s.customer_id",
      "SELECT customer_id FROM BankAccount WHERE account_type = 'SAVINGS' INTERSECT SELECT customer_id FROM BankAccount WHERE account_type = 'CURRENT' ORDER BY customer_id",
    ],
    ordered: true,
    hints: [
      "One row per customer in the answer: group the accounts by `customer_id`.",
      "Count savings accounts and current accounts separately inside the group, and test both counts in `HAVING`.",
      "`COUNT(DISTINCT account_type) = 2` alone is not enough — a savings and a salary account also make two types.",
    ],
    editorial: [
      "Group the accounts by customer and ask two questions of each group: does it contain a savings account, and does it contain a current account? Conditional aggregation answers both in one pass — `SUM(CASE WHEN account_type = 'SAVINGS' THEN 1 ELSE 0 END)` counts the savings accounts in the group — and `HAVING` keeps the groups where both counts are positive. Several accounts of one type are harmless, since only \"more than zero\" matters.",
      "",
      "A tempting shortcut is `HAVING COUNT(DISTINCT account_type) = 2`, but with three account types a customer holding savings and salary accounts also has two distinct types. It becomes correct once the `WHERE` clause keeps only savings and current rows, which is the first alternative.",
      "",
      "A self join of savings rows to current rows of the same customer, or an `INTERSECT` of the two customer lists, express the same set. The grouped version is a single scan with a hash or sort on `customer_id`.",
    ].join("\n"),
  },

  {
    slug: "savings-accounts-above-the-bank-average",
    title: "Savings Accounts Above the Bank-Wide Average Balance",
    difficulty: "EASY",
    topics: ["Subqueries"],
    description: [
      "Marketing wants to offer a premium debit card to savings customers whose balance is **strictly above the average balance** of all savings accounts in the bank.",
      "",
      "Return `account_id`, `holder_name` and `balance` for those accounts, ordered by `balance` descending, then by `account_id` ascending. An account whose balance equals the average is not included.",
    ].join("\n"),
    tables: [
      {
        name: "SavingsAccount",
        columns: [
          { name: "account_id", type: "int" },
          { name: "holder_name", type: "varchar" },
          { name: "balance", type: "int" },
        ],
        primaryKey: ["account_id"],
        note: "One row per savings account; `balance` is in rupees.",
      },
    ],
    examples: [
      {
        SavingsAccount: [
          [1, "Aarav Patel", 120000],
          [2, "Ishaan Rao", 40000],
          [3, "Tanvi Nair", 60000],
          [4, "Simran Gupta", 150000],
          [5, "Liam Das", 30000],
          [6, "Ira Menon", 120000],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const who = names(rng, n);
      // A small pool of balances so ties (and balances equal to the average) happen.
      const pool = Array.from({ length: ri(rng, 1, 5) }, () => roundTo(rng, 5000, 250000, 5000));
      const rows = who.map((f, i) => [i + 1, fullName(rng, f), pick(rng, pool)]);
      return { SavingsAccount: rows };
    },
    solution: [
      "SELECT account_id, holder_name, balance",
      "FROM SavingsAccount",
      "WHERE balance > (SELECT AVG(balance) FROM SavingsAccount)",
      "ORDER BY balance DESC, account_id",
    ].join("\n"),
    alternatives: [
      "SELECT s.account_id, s.holder_name, s.balance FROM SavingsAccount s CROSS JOIN (SELECT AVG(balance) AS avg_balance FROM SavingsAccount) a WHERE s.balance > a.avg_balance ORDER BY s.balance DESC, s.account_id",
      "SELECT account_id, holder_name, balance FROM (SELECT account_id, holder_name, balance, AVG(balance) OVER () AS avg_balance FROM SavingsAccount) t WHERE balance > avg_balance ORDER BY balance DESC, account_id",
    ],
    ordered: true,
    hints: [
      "An aggregate cannot sit in `WHERE` directly — compute the average first.",
      "A scalar subquery returns one value that every row can be compared against.",
      "\"Strictly above\" excludes a balance equal to the average.",
    ],
    editorial: [
      "The comparison value is a property of the whole table, not of the row, so it comes from an aggregate: `AVG(balance)`. An aggregate cannot appear in a `WHERE` clause on its own, but a **scalar subquery** can — `(SELECT AVG(balance) FROM SavingsAccount)` produces a single number that the database computes once and compares every row against.",
      "",
      "When every account has the same balance, the average equals each balance and the strict comparison returns nothing, which is exactly what \"strictly above\" means. Ties among the qualifying balances are ordered by `account_id`.",
      "",
      "The same idea can be written as a `CROSS JOIN` to a one-row derived table holding the average, or with the window function `AVG(balance) OVER ()`, which attaches the overall average to every row so a derived table can filter on it. All three read the table twice or once plus a sort; for a small table the difference does not matter.",
    ].join("\n"),
  },

  // ──────────────────────────── MEDIUM ────────────────────────────
  {
    slug: "upi-success-rate-by-app-and-month",
    title: "UPI Success Rate by App and Month",
    difficulty: "MEDIUM",
    topics: ["Dates", "Conditional Logic", "Aggregation"],
    description: [
      "The payments team tracks how reliable each UPI app is month by month. A payment attempt either succeeds or fails.",
      "",
      "For every calendar month and UPI app that had at least one attempt, return `month` (as `'YYYY-MM'`), `upi_app`, `attempts` (all attempts), `successful` (attempts with status `SUCCESS`) and `success_rate_pct` — `100 × successful ÷ attempts`, **rounded to 2 decimals**. Order the rows by `month`, then by `upi_app`.",
    ].join("\n"),
    tables: [
      {
        name: "UpiPayment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "upi_app", type: "enum", values: ["BHIM", "Google Pay", "Paytm", "PhonePe"] },
          { name: "status", type: "enum", values: ["SUCCESS", "FAILED"] },
          { name: "amount", type: "int" },
          { name: "paid_at", type: "datetime" },
        ],
        primaryKey: ["payment_id"],
        note: "One row per payment attempt; `paid_at` is when it was attempted.",
      },
    ],
    examples: [
      {
        UpiPayment: [
          [1, "PhonePe", "SUCCESS", 450, "2024-05-02 09:15:00"],
          [2, "PhonePe", "FAILED", 1200, "2024-05-11 13:40:22"],
          [3, "PhonePe", "SUCCESS", 80, "2024-05-31 23:59:59"],
          [4, "Google Pay", "SUCCESS", 2500, "2024-05-20 18:05:10"],
          [5, "Paytm", "FAILED", 640, "2024-06-01 00:00:05"],
          [6, "PhonePe", "SUCCESS", 99, "2024-06-03 10:10:10"],
          [7, "Paytm", "SUCCESS", 300, "2024-06-15 12:00:00"],
          [8, "Paytm", "SUCCESS", 150, "2024-06-28 19:45:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 28);
      const apps = sample(rng, ["BHIM", "Google Pay", "Paytm", "PhonePe"] as const, ri(rng, 1, 4));
      const rows = seq(1, n).map((id) => {
        const date = dateBetween(rng, "2024-03-25", "2024-06-05");
        return [id, pick(rng, apps), chance(rng, 0.7) ? "SUCCESS" : "FAILED", roundTo(rng, 10, 5000, 10), stamp(date, chance(rng, 0.1) ? pick(rng, [0, 86399]) : ri(rng, 0, 86399))];
      });
      return { UpiPayment: rows };
    },
    solution: [
      "SELECT DATE_FORMAT(paid_at, '%Y-%m') AS month,",
      "       upi_app,",
      "       COUNT(*) AS attempts,",
      "       SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) AS successful,",
      "       ROUND(100 * SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) / COUNT(*), 2) AS success_rate_pct",
      "FROM UpiPayment",
      "GROUP BY DATE_FORMAT(paid_at, '%Y-%m'), upi_app",
      "ORDER BY month, upi_app",
    ].join("\n"),
    alternatives: [
      [
        "SELECT month, upi_app, COUNT(*) AS attempts, SUM(ok) AS successful, ROUND(AVG(ok) * 100, 2) AS success_rate_pct",
        "FROM (SELECT LEFT(paid_at, 7) AS month, upi_app, IF(status = 'SUCCESS', 1, 0) AS ok FROM UpiPayment) t",
        "GROUP BY month, upi_app ORDER BY month, upi_app",
      ].join("\n"),
      [
        "SELECT CONCAT(YEAR(paid_at), '-', LPAD(MONTH(paid_at), 2, '0')) AS month, upi_app, COUNT(*) AS attempts,",
        "  COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) AS successful,",
        "  ROUND(COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) * 100 / COUNT(*), 2) AS success_rate_pct",
        "FROM UpiPayment GROUP BY month, upi_app ORDER BY month, upi_app",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Bucket each attempt by its month first: `DATE_FORMAT(paid_at, '%Y-%m')` gives a sortable label.",
      "Group by the month *and* the app; `COUNT(*)` gives the attempts.",
      "Count only successes inside the same group with `SUM(CASE WHEN … THEN 1 ELSE 0 END)`.",
      "Multiply by 100 before dividing and round the ratio to 2 decimals.",
    ],
    editorial: [
      "Two ideas combine here: **date bucketing** and **conditional aggregation**. `DATE_FORMAT(paid_at, '%Y-%m')` turns every timestamp into its month label, which both groups and sorts correctly because the format is fixed-width. Grouping by that label and `upi_app` gives one row per app per month that actually had attempts — months with no attempts for an app simply have no group, as the statement wants.",
      "",
      "Inside a group, `COUNT(*)` counts every attempt, and `SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END)` counts only the successes. The rate is their ratio times 100, rounded to two decimals; rounding matters because MySQL's division keeps four decimals and other engines keep more. Note the edges: a payment at 23:59:59 on the last day stays in its month, and one at 00:00:05 on the 1st starts the next.",
      "",
      "Alternatives: take `LEFT(paid_at, 7)` as the month and average a 0/1 flag (the average of a flag *is* the success share), or build the label from `YEAR` and `MONTH`. The query is one scan and a group-by.",
    ].join("\n"),
  },

  {
    slug: "current-balance-from-the-account-ledger",
    title: "Current Balance From the Account Ledger",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "Core banking does not trust a stored balance: it recomputes it from the ledger. An account's current balance is its `opening_balance` **plus every credit minus every debit**, ignoring entries that were later **reversed** (`is_reversed = 1`). An account with no entries (or only reversed ones) has its opening balance.",
      "",
      "Return `account_id`, `holder_name` and `current_balance` for every account, ordered by `account_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Account",
        columns: [
          { name: "account_id", type: "int" },
          { name: "holder_name", type: "varchar" },
          { name: "opening_balance", type: "int" },
        ],
        primaryKey: ["account_id"],
        note: "One row per account; `opening_balance` is in rupees.",
      },
      {
        name: "LedgerEntry",
        columns: [
          { name: "entry_id", type: "int" },
          { name: "account_id", type: "int" },
          { name: "entry_type", type: "enum", values: ["CREDIT", "DEBIT"] },
          { name: "amount", type: "int" },
          { name: "posted_on", type: "date" },
          { name: "is_reversed", type: "bool" },
        ],
        primaryKey: ["entry_id"],
        note: "One row per posting; `amount` is always positive and `entry_type` gives its direction. `account_id` always names an account.",
      },
    ],
    examples: [
      {
        Account: [
          [1, "Saanvi Reddy", 10000],
          [2, "Arjun Menon", 0],
          [3, "Olivia Joshi", 25000],
          [4, "Nikhil Bose", 5000],
        ],
        LedgerEntry: [
          [1, 1, "CREDIT", 50000, "2024-07-01", 0],
          [2, 1, "DEBIT", 12000, "2024-07-03", 0],
          [3, 2, "CREDIT", 8000, "2024-07-04", 0],
          [4, 2, "DEBIT", 3000, "2024-07-05", 1],
          [5, 1, "DEBIT", 1500, "2024-07-09", 0],
          [6, 4, "CREDIT", 20000, "2024-07-10", 1],
          [7, 2, "DEBIT", 2500, "2024-07-12", 0],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 8);
      const who = names(rng, n);
      const accounts = who.map((f, i) => [i + 1, fullName(rng, f), roundTo(rng, 0, 50000, 1000)]);
      const m = chance(rng, 0.08) ? 0 : ri(rng, 1, 24);
      const entries = seq(1, m).map((id) => [
        id, ri(rng, 1, n), chance(rng, 0.5) ? "CREDIT" : "DEBIT", roundTo(rng, 100, 40000, 100),
        dateBetween(rng, "2024-07-01", "2024-07-31"), chance(rng, 0.15) ? 1 : 0,
      ]);
      return { Account: accounts, LedgerEntry: entries };
    },
    solution: [
      "SELECT a.account_id, a.holder_name,",
      "       a.opening_balance + COALESCE(SUM(CASE WHEN l.entry_type = 'CREDIT' THEN l.amount ELSE -l.amount END), 0) AS current_balance",
      "FROM Account a",
      "LEFT JOIN LedgerEntry l ON l.account_id = a.account_id AND l.is_reversed = 0",
      "GROUP BY a.account_id, a.holder_name, a.opening_balance",
      "ORDER BY a.account_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.account_id, a.holder_name,",
        "  a.opening_balance",
        "  + (SELECT COALESCE(SUM(amount), 0) FROM LedgerEntry l WHERE l.account_id = a.account_id AND l.entry_type = 'CREDIT' AND l.is_reversed = 0)",
        "  - (SELECT COALESCE(SUM(amount), 0) FROM LedgerEntry l WHERE l.account_id = a.account_id AND l.entry_type = 'DEBIT' AND l.is_reversed = 0) AS current_balance",
        "FROM Account a ORDER BY a.account_id",
      ].join("\n"),
      [
        "SELECT a.account_id, a.holder_name, a.opening_balance + COALESCE(n.net, 0) AS current_balance",
        "FROM Account a LEFT JOIN (",
        "  SELECT account_id, SUM(IF(entry_type = 'CREDIT', amount, 0)) - SUM(IF(entry_type = 'DEBIT', amount, 0)) AS net",
        "  FROM LedgerEntry WHERE is_reversed = 0 GROUP BY account_id",
        ") n ON n.account_id = a.account_id ORDER BY a.account_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Turn each entry into a signed amount: positive for a credit, negative for a debit.",
      "Every account must appear, entries or not — join the ledger to the accounts with a LEFT JOIN.",
      "Drop reversed entries in the join condition, not in `WHERE`, or accounts with only reversed entries disappear.",
      "An account with no matching entry sums to NULL; replace it with 0 before adding.",
    ],
    editorial: [
      "A ledger stores amounts with a direction, so the first step is to give each entry a sign: `CASE WHEN entry_type = 'CREDIT' THEN amount ELSE -amount END`. Summing those per account gives the net movement, and adding it to the opening balance gives the current balance.",
      "",
      "Every account must be reported, so the query starts from `Account` with a LEFT JOIN. Reversed entries are excluded **in the `ON` clause**: in the `WHERE` clause the test would also discard the NULL row of an account whose entries were all reversed, and that account would vanish. For an account with nothing left to join, `SUM` returns NULL and `opening_balance + NULL` is NULL — `COALESCE(…, 0)` keeps the opening balance instead.",
      "",
      "Pre-aggregating the ledger in a derived table and joining it once is the plan a large bank would prefer (one pass over the ledger, then a join on a much smaller set); two correlated subqueries per account are the most literal reading. All three agree, including on accounts with no postings.",
    ].join("\n"),
  },

  {
    slug: "borrowers-with-repeatedly-overdue-emis",
    title: "Borrowers With Repeatedly Overdue EMIs",
    difficulty: "MEDIUM",
    topics: ["Joins", "Dates", "Aggregation"],
    description: [
      "The collections team pulled the EMI register on **2024-12-31**. An instalment counts as **overdue** when it was paid **more than 30 days** after its due date, or when it is still unpaid (`paid_date` NULL) and its due date is more than 30 days before 2024-12-31. Paying exactly 30 days late is not overdue, and an unpaid instalment due 30 days or less before the pull date is not overdue yet.",
      "",
      "Return `loan_id`, `borrower_name` and `overdue_emis` (the number of overdue instalments) for every loan with **at least 2** overdue instalments. Order the rows by `overdue_emis` descending, then by `loan_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Loan",
        columns: [
          { name: "loan_id", type: "int" },
          { name: "borrower_name", type: "varchar" },
          { name: "principal", type: "int" },
          { name: "emi_amount", type: "int" },
        ],
        primaryKey: ["loan_id"],
        note: "One row per personal loan.",
      },
      {
        name: "EmiSchedule",
        columns: [
          { name: "loan_id", type: "int" },
          { name: "installment_no", type: "int" },
          { name: "due_date", type: "date" },
          { name: "paid_date", type: "date" },
        ],
        primaryKey: ["loan_id", "installment_no"],
        note: "One row per instalment of a loan. `paid_date` is NULL while the instalment is unpaid.",
      },
    ],
    examples: [
      {
        Loan: [
          [1, "Rahul Sharma", 300000, 14200],
          [2, "Sneha Iyer", 150000, 7100],
          [3, "Kabir Singh", 500000, 23650],
          [4, "Emma Das", 200000, 9450],
        ],
        EmiSchedule: [
          [1, 1, "2024-09-05", "2024-10-20"],
          [1, 2, "2024-10-05", null],
          [1, 3, "2024-11-05", null],
          [2, 1, "2024-09-05", "2024-10-05"],
          [2, 2, "2024-10-05", "2024-11-05"],
          [3, 1, "2024-09-05", "2024-09-04"],
          [3, 2, "2024-10-05", "2024-11-25"],
          [3, 3, "2024-11-05", null],
          [3, 4, "2024-12-05", null],
          [4, 1, "2024-11-01", null],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 7);
      const who = names(rng, n);
      const loans = who.map((f, i) => [i + 1, fullName(rng, f), roundTo(rng, 50000, 800000, 10000), roundTo(rng, 2000, 40000, 50)]);
      const sched: Cell[][] = [];
      for (const [id] of loans) {
        const k = ri(rng, 0, 6);
        for (let j = 1; j <= k; j++) {
          const due = `2024-${pad(5 + j)}-${pad(pick(rng, [1, 5, 10]))}`;
          const r = rng();
          let paid: string | null =
            r < 0.3 ? addDays(due, ri(rng, -5, 10)) : r < 0.45 ? addDays(due, pick(rng, [30, 31])) : r < 0.65 ? addDays(due, ri(rng, 32, 70)) : null;
          if (paid !== null && paid > "2024-12-31") paid = null;
          sched.push([id as number, j, due, paid]);
        }
      }
      // Now and then an unpaid instalment due exactly 30 or 31 days before the pull date.
      if (chance(rng, 0.4)) sched.push([1, 9, pick(rng, ["2024-12-01", "2024-11-30"]), null]);
      return { Loan: loans, EmiSchedule: sched };
    },
    solution: [
      "SELECT l.loan_id, l.borrower_name, COUNT(*) AS overdue_emis",
      "FROM Loan l",
      "JOIN EmiSchedule e ON e.loan_id = l.loan_id",
      "WHERE (e.paid_date IS NOT NULL AND DATEDIFF(e.paid_date, e.due_date) > 30)",
      "   OR (e.paid_date IS NULL AND DATEDIFF('2024-12-31', e.due_date) > 30)",
      "GROUP BY l.loan_id, l.borrower_name",
      "HAVING COUNT(*) >= 2",
      "ORDER BY overdue_emis DESC, l.loan_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT l.loan_id, l.borrower_name,",
        "  SUM(CASE WHEN DATEDIFF(COALESCE(e.paid_date, '2024-12-31'), e.due_date) > 30 THEN 1 ELSE 0 END) AS overdue_emis",
        "FROM Loan l JOIN EmiSchedule e ON e.loan_id = l.loan_id",
        "GROUP BY l.loan_id, l.borrower_name",
        "HAVING overdue_emis >= 2 ORDER BY overdue_emis DESC, l.loan_id",
      ].join("\n"),
      [
        "SELECT * FROM (",
        "  SELECT l.loan_id, l.borrower_name,",
        "    (SELECT COUNT(*) FROM EmiSchedule e WHERE e.loan_id = l.loan_id",
        "       AND DATE_ADD(e.due_date, INTERVAL 30 DAY) < COALESCE(e.paid_date, '2024-12-31')) AS overdue_emis",
        "  FROM Loan l",
        ") t WHERE overdue_emis >= 2 ORDER BY overdue_emis DESC, loan_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Write the overdue rule for a paid instalment and for an unpaid one; `DATEDIFF(later, earlier)` gives days.",
      "An unpaid instalment behaves as if it were paid on the pull date — `COALESCE` can fold the two rules into one.",
      "Count the overdue instalments per loan and keep the loans with two or more in `HAVING`.",
    ],
    editorial: [
      "The rule has two arms. For a paid instalment the delay is `DATEDIFF(paid_date, due_date)`; for an unpaid one the delay so far is `DATEDIFF('2024-12-31', due_date)`. Either way the instalment is overdue when the delay is **more than** 30 days, so exactly 30 is on the safe side. Filter the instalments with that condition, join the loan for the borrower's name, group by loan and keep the groups with `COUNT(*) >= 2`.",
      "",
      "The two arms collapse into one with `COALESCE(paid_date, '2024-12-31')`: an unpaid instalment is treated as paid on the pull date. That makes conditional aggregation natural — `SUM(CASE WHEN … THEN 1 ELSE 0 END)` over all instalments — and the same idea can be written as `DATE_ADD(due_date, INTERVAL 30 DAY) < …` in a correlated count.",
      "",
      "Forgetting the unpaid arm is the usual mistake: `DATEDIFF(NULL, due_date)` is NULL, so the worst borrowers — those who stopped paying — would silently drop out. The query is one pass over the schedule with a group-by on the loan.",
    ].join("\n"),
  },

  {
    slug: "largest-debit-on-each-savings-account",
    title: "Largest Debit on Each Savings Account",
    difficulty: "MEDIUM",
    topics: ["Window Functions"],
    description: [
      "For a spending-pattern check, the risk team wants each account's **largest debit**. If several debits share the largest amount, all of them are reported. Credits are ignored, and an account with no debits does not appear.",
      "",
      "Return `account_no`, `txn_id`, `amount` and `txn_date` for those debits, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "AccountTxn",
        columns: [
          { name: "txn_id", type: "int" },
          { name: "account_no", type: "bigint" },
          { name: "txn_type", type: "enum", values: ["DEBIT", "CREDIT"] },
          { name: "amount", type: "int" },
          { name: "txn_date", type: "date" },
        ],
        primaryKey: ["txn_id"],
        note: "One row per transaction; `account_no` is the 12-digit account number.",
      },
    ],
    examples: [
      {
        AccountTxn: [
          [1, 501002345671, "DEBIT", 4500, "2024-02-01"],
          [2, 501002345671, "CREDIT", 90000, "2024-02-01"],
          [3, 501002345671, "DEBIT", 12000, "2024-02-07"],
          [4, 501002345688, "DEBIT", 3000, "2024-02-03"],
          [5, 501002345688, "DEBIT", 3000, "2024-02-15"],
          [6, 501002345695, "CREDIT", 25000, "2024-02-05"],
          [7, 501002345688, "DEBIT", 800, "2024-02-20"],
          [8, 501002345671, "DEBIT", 11999, "2024-02-21"],
        ],
      },
    ],
    gen: (rng) => {
      const accounts = Array.from({ length: ri(rng, 1, 5) }, (_, i) => 501002345600 + i * 17 + ri(rng, 0, 9));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 24);
      const pool = Array.from({ length: ri(rng, 2, 6) }, () => roundTo(rng, 500, 60000, 500));
      const rows = seq(1, n).map((id) => [
        id, pick(rng, accounts), chance(rng, 0.7) ? "DEBIT" : "CREDIT", pick(rng, pool), dateBetween(rng, "2024-02-01", "2024-02-29"),
      ]);
      return { AccountTxn: rows };
    },
    solution: [
      "SELECT account_no, txn_id, amount, txn_date",
      "FROM (",
      "  SELECT account_no, txn_id, amount, txn_date,",
      "         RANK() OVER (PARTITION BY account_no ORDER BY amount DESC) AS rnk",
      "  FROM AccountTxn",
      "  WHERE txn_type = 'DEBIT'",
      ") d",
      "WHERE rnk = 1",
    ].join("\n"),
    alternatives: [
      "SELECT account_no, txn_id, amount, txn_date FROM AccountTxn t WHERE txn_type = 'DEBIT' AND amount = (SELECT MAX(amount) FROM AccountTxn u WHERE u.account_no = t.account_no AND u.txn_type = 'DEBIT')",
      [
        "SELECT t.account_no, t.txn_id, t.amount, t.txn_date FROM AccountTxn t",
        "JOIN (SELECT account_no, MAX(amount) AS top_amount FROM AccountTxn WHERE txn_type = 'DEBIT' GROUP BY account_no) m",
        "  ON m.account_no = t.account_no AND m.top_amount = t.amount",
        "WHERE t.txn_type = 'DEBIT'",
      ].join("\n"),
    ],
    hints: [
      "Throw the credits away first; they must never be the \"largest\" row.",
      "Rank the debits within each account, largest first — the ranking restarts per account.",
      "Equal amounts must share first place: `ROW_NUMBER` would drop one of them.",
    ],
    editorial: [
      "This is **top-1 per group with ties**. Filter to debits, then rank them inside each account by amount, largest first: `RANK() OVER (PARTITION BY account_no ORDER BY amount DESC)`. Every debit that ties for the largest amount gets rank 1, so keeping `rnk = 1` returns all of them. `DENSE_RANK` would work equally well here; `ROW_NUMBER` would pick one of the tied rows arbitrarily, making the answer depend on storage order.",
      "",
      "Window functions are computed after `WHERE`, so the rank is filtered in an outer query. The credit filter must sit *inside*, before ranking — otherwise a large credit would take rank 1 and the account's debits would disappear.",
      "",
      "The classic alternatives compare each debit with its account's maximum: either a correlated `MAX` subquery, or a join to a grouped derived table of maxima. Both include the `txn_type = 'DEBIT'` test on both sides. The window version sorts the debits once per account; the join version is a group-by and a hash join.",
    ].join("\n"),
  },

  {
    slug: "credit-cards-over-30-percent-utilisation",
    title: "Credit Cards Over 30% Utilisation in September",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Dates"],
    description: [
      "Bureaus penalise cardholders who use more than 30% of their credit limit, so the card team warns them. A card's **September 2024 utilisation** is its net spend in that month — purchases minus refunds dated 1–30 September 2024 — as a percentage of its `credit_limit`, **rounded to 2 decimals**.",
      "",
      "Return `card_id`, `holder_name` and `utilisation_pct` for every card whose utilisation is **strictly greater than 30**. Order the rows by `utilisation_pct` descending, then by `card_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Card",
        columns: [
          { name: "card_id", type: "int" },
          { name: "holder_name", type: "varchar" },
          { name: "credit_limit", type: "int" },
        ],
        primaryKey: ["card_id"],
        note: "One row per credit card; `credit_limit` is in rupees.",
      },
      {
        name: "CardTxn",
        columns: [
          { name: "txn_id", type: "int" },
          { name: "card_id", type: "int" },
          { name: "txn_type", type: "enum", values: ["PURCHASE", "REFUND"] },
          { name: "amount", type: "int" },
          { name: "txn_date", type: "date" },
        ],
        primaryKey: ["txn_id"],
        note: "One row per card transaction; `amount` is positive for both types.",
      },
    ],
    examples: [
      {
        Card: [
          [1, "Priya Menon", 60000],
          [2, "Arjun Rao", 150000],
          [3, "Mia Verma", 30000],
          [4, "Vivaan Joshi", 90000],
        ],
        CardTxn: [
          [1, 1, "PURCHASE", 15000, "2024-09-03"],
          [2, 1, "PURCHASE", 6200, "2024-09-18"],
          [3, 2, "PURCHASE", 45000, "2024-09-10"],
          [4, 3, "PURCHASE", 12000, "2024-09-30"],
          [5, 3, "REFUND", 2000, "2024-09-25"],
          [6, 3, "PURCHASE", 9000, "2024-10-01"],
          [7, 4, "PURCHASE", 40000, "2024-08-31"],
          [8, 4, "PURCHASE", 30000, "2024-09-12"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 7);
      const who = names(rng, n);
      // Limits of 30,000 × {1, 2, 3, 5, 7} and spends in tens never land a ratio on a rounding half.
      const cards = who.map((f, i) => [i + 1, fullName(rng, f), 30000 * pick(rng, [1, 2, 3, 5, 7])]);
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 22);
      const txns = seq(1, m).map((id) => {
        const card = ri(rng, 1, n);
        const limit = cards[card - 1]![2] as number;
        const refund = chance(rng, 0.2);
        const amount = refund ? roundTo(rng, 100, 5000, 10) : chance(rng, 0.2) ? (limit * 3) / 10 : roundTo(rng, 500, limit * 0.4, 10);
        return [id, card, refund ? "REFUND" : "PURCHASE", amount, dateBetween(rng, "2024-08-28", "2024-10-02")];
      });
      return { Card: cards, CardTxn: txns };
    },
    solution: [
      "SELECT c.card_id, c.holder_name,",
      "       ROUND(100 * SUM(CASE WHEN t.txn_type = 'PURCHASE' THEN t.amount ELSE -t.amount END) / c.credit_limit, 2) AS utilisation_pct",
      "FROM Card c",
      "JOIN CardTxn t ON t.card_id = c.card_id",
      "WHERE t.txn_date BETWEEN '2024-09-01' AND '2024-09-30'",
      "GROUP BY c.card_id, c.holder_name, c.credit_limit",
      "HAVING SUM(CASE WHEN t.txn_type = 'PURCHASE' THEN t.amount ELSE -t.amount END) * 100 > 30 * c.credit_limit",
      "ORDER BY utilisation_pct DESC, c.card_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT card_id, holder_name, utilisation_pct FROM (",
        "  SELECT c.card_id, c.holder_name, c.credit_limit, ROUND(100 * s.net / c.credit_limit, 2) AS utilisation_pct, s.net",
        "  FROM Card c JOIN (",
        "    SELECT card_id, SUM(IF(txn_type = 'REFUND', -amount, amount)) AS net FROM CardTxn",
        "    WHERE YEAR(txn_date) = 2024 AND MONTH(txn_date) = 9 GROUP BY card_id",
        "  ) s ON s.card_id = c.card_id",
        ") u WHERE net * 100 > 30 * credit_limit ORDER BY utilisation_pct DESC, card_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Keep only September's transactions before adding anything up.",
      "Give refunds a negative sign so purchases minus refunds is a single `SUM`.",
      "Divide the net spend by the card's limit, times 100; filter the groups with `HAVING`.",
      "A card at exactly 30% is not over the line — compare without rounding first.",
    ],
    editorial: [
      "Three steps: restrict to the statement month, net the money per card, and compare with the limit. The date filter `BETWEEN '2024-09-01' AND '2024-09-30'` keeps the month inclusive at both ends and drops the 31 August and 1 October rows. Inside each card's group, `SUM(CASE WHEN txn_type = 'PURCHASE' THEN amount ELSE -amount END)` gives purchases minus refunds.",
      "",
      "The utilisation is `100 × net ÷ credit_limit`, rounded to two decimals for display. For the *filter*, compare the unrounded quantity in integer form — `net × 100 > 30 × credit_limit` — so a card at exactly 30% is excluded with no floating-point doubt. Cards with no September transactions have no group at all, and their 0% would be excluded anyway.",
      "",
      "Pre-aggregating the transactions in a derived table and joining it to `Card` is an equivalent shape, with `YEAR`/`MONTH` as another way to say \"September 2024\". Both are a scan of the month's transactions and a small join.",
    ].join("\n"),
  },

  {
    slug: "salary-credits-by-employer-from-narrations",
    title: "Salary Credits by Employer From Statement Narrations",
    difficulty: "MEDIUM",
    topics: ["Strings", "Aggregation"],
    description: [
      "The bank wants to know which employers pay salaries into its accounts, but the only trace is the statement narration. A salary credit's narration has the form `<RAIL>/SALARY/<EMPLOYER>/<PERIOD>`, for example `NEFT/SALARY/INFOSYS/OCT24`; all other credits use other words in the second segment (`P2P`, `REFUND`, `SALARYADV`, …).",
      "",
      "For every employer, return `employer`, `salaried_accounts` (the number of distinct accounts it paid) and `total_salary` (the sum of its salary credits). Order the rows by `total_salary` descending, then by `employer` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "StatementLine",
        columns: [
          { name: "line_id", type: "int" },
          { name: "account_id", type: "int" },
          { name: "narration", type: "varchar" },
          { name: "amount", type: "int" },
          { name: "value_date", type: "date" },
        ],
        primaryKey: ["line_id"],
        note: "One row per credit on a statement. Narrations are always upper case with `/` between segments.",
      },
    ],
    examples: [
      {
        StatementLine: [
          [1, 10, "NEFT/SALARY/INFOSYS/OCT24", 85000, "2024-10-31"],
          [2, 11, "NEFT/SALARY/INFOSYS/OCT24", 62000, "2024-10-31"],
          [3, 10, "UPI/P2P/RAHUL9/DINNER", 1200, "2024-11-02"],
          [4, 12, "IMPS/SALARY/ZOMATO/OCT24", 54000, "2024-11-01"],
          [5, 10, "NEFT/SALARY/INFOSYS/NOV24", 85000, "2024-11-30"],
          [6, 13, "IMPS/SALARYADV/KREDITBEE/LOAN", 15000, "2024-11-05"],
          [7, 14, "RTGS/SALARY/TCS/NOV24", 147000, "2024-11-29"],
          [8, 12, "NEFT/REFUND/AMAZON/ORD771", 2399, "2024-11-12"],
        ],
      },
    ],
    gen: (rng) => {
      const employers = sample(rng, ["INFOSYS", "TCS", "WIPRO", "ZOMATO", "FLIPKART", "HDFCLIFE", "BYJUS"], ri(rng, 1, 4));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 24);
      const rows = seq(1, n).map((id) => {
        const acct = ri(rng, 10, 17);
        const r = rng();
        const narration =
          r < 0.6
            ? `${pick(rng, ["NEFT", "IMPS", "RTGS"])}/SALARY/${pick(rng, employers)}/${pick(rng, ["SEP24", "OCT24", "NOV24"])}`
            : r < 0.75
              ? `IMPS/SALARYADV/${pick(rng, ["KREDITBEE", "FIBE"])}/LOAN`
              : `UPI/P2P/${pick(rng, ["RAHUL9", "DIYA2", "MOM"])}/${pick(rng, ["RENT", "DINNER", "GIFT"])}`;
        return [id, acct, narration, r < 0.6 ? roundTo(rng, 20000, 150000, 1000) : roundTo(rng, 100, 20000, 100), dateBetween(rng, "2024-09-25", "2024-11-30")];
      });
      return { StatementLine: rows };
    },
    solution: [
      "SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(narration, '/', 3), '/', -1) AS employer,",
      "       COUNT(DISTINCT account_id) AS salaried_accounts,",
      "       SUM(amount) AS total_salary",
      "FROM StatementLine",
      "WHERE SUBSTRING_INDEX(SUBSTRING_INDEX(narration, '/', 2), '/', -1) = 'SALARY'",
      "GROUP BY SUBSTRING_INDEX(SUBSTRING_INDEX(narration, '/', 3), '/', -1)",
      "ORDER BY total_salary DESC, employer",
    ].join("\n"),
    alternatives: [
      [
        "SELECT employer, COUNT(DISTINCT account_id) AS salaried_accounts, SUM(amount) AS total_salary FROM (",
        "  SELECT account_id, amount, SUBSTRING_INDEX(SUBSTRING_INDEX(narration, '/SALARY/', -1), '/', 1) AS employer",
        "  FROM StatementLine WHERE narration LIKE '%/SALARY/%'",
        ") s GROUP BY employer ORDER BY total_salary DESC, employer",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`SUBSTRING_INDEX(text, '/', n)` keeps everything before the n-th slash; a negative n counts from the right.",
      "Nest two calls to pull out a single segment: the first keeps segments 1..k, the second keeps the last of those.",
      "Match the whole second segment — `SALARYADV` starts with SALARY but is not a salary.",
      "Count accounts with `COUNT(DISTINCT …)`: the same person is paid every month.",
    ],
    editorial: [
      "The data lives inside a string, so the job is parsing. `SUBSTRING_INDEX(narration, '/', 3)` keeps the first three segments (`NEFT/SALARY/INFOSYS`), and wrapping it in `SUBSTRING_INDEX(…, '/', -1)` keeps the last of those — the third segment, the employer. The same trick with 2 extracts the second segment, which must be exactly `SALARY`.",
      "",
      "Testing the whole segment matters: `narration LIKE '%SALARY%'` would also catch `SALARYADV`, a salary-advance loan credit, and inflate the totals. `LIKE '%/SALARY/%'` is safe because the slashes pin the segment's ends — the alternative uses that, and then takes the text right after `/SALARY/` up to the next slash.",
      "",
      "Group by the extracted employer, count distinct accounts (an employee paid in October and November is one account) and sum the amounts. The order is by total with the employer name breaking ties. The cost is one scan with string functions per row; a real system would parse the narration once at load time into its own column.",
    ].join("\n"),
  },

  {
    slug: "branch-deposits-against-the-previous-month",
    title: "Branch Deposits Against the Previous Calendar Month",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates"],
    description: [
      "Branch managers review their monthly deposit inflow against the **immediately preceding calendar month**. A branch may have no deposits in some months; then the next month has no previous figure to compare with.",
      "",
      "For every branch and month with at least one deposit, return `branch_code`, `month` (`'YYYY-MM'`), `month_total`, `prev_month_total` (the branch's total in the calendar month just before, or NULL if it had no deposits then) and `change_amount` (`month_total − prev_month_total`, NULL when there is no previous total). Order the rows by `branch_code`, then by `month`.",
    ].join("\n"),
    tables: [
      {
        name: "Deposit",
        columns: [
          { name: "deposit_id", type: "int" },
          { name: "branch_code", type: "varchar" },
          { name: "amount", type: "int" },
          { name: "deposited_on", type: "date" },
        ],
        primaryKey: ["deposit_id"],
        note: "One row per cash or cheque deposit; `amount` is in rupees.",
      },
    ],
    examples: [
      {
        Deposit: [
          [1, "BLR001", 50000, "2024-11-04"],
          [2, "BLR001", 25000, "2024-11-28"],
          [3, "BLR001", 90000, "2024-12-15"],
          [4, "BLR001", 40000, "2025-02-03"],
          [5, "MUM014", 120000, "2024-12-31"],
          [6, "MUM014", 30000, "2025-01-01"],
          [7, "MUM014", 15000, "2025-01-20"],
        ],
      },
    ],
    gen: (rng) => {
      const branches = sample(rng, ["BLR001", "MUM014", "DEL022", "HYD007", "CHN010"], ri(rng, 1, 3));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 22);
      const rows = seq(1, n).map((id) => [id, pick(rng, branches), roundTo(rng, 5000, 200000, 5000), dateBetween(rng, "2024-10-01", "2025-03-31")]);
      return { Deposit: rows };
    },
    solution: [
      "WITH monthly AS (",
      "  SELECT branch_code, DATE_FORMAT(deposited_on, '%Y-%m') AS month, SUM(amount) AS total",
      "  FROM Deposit",
      "  GROUP BY branch_code, DATE_FORMAT(deposited_on, '%Y-%m')",
      ")",
      "SELECT c.branch_code, c.month, c.total AS month_total, p.total AS prev_month_total, c.total - p.total AS change_amount",
      "FROM monthly c",
      "LEFT JOIN monthly p",
      "  ON p.branch_code = c.branch_code",
      " AND p.month = DATE_FORMAT(DATE_SUB(CONCAT(c.month, '-01'), INTERVAL 1 MONTH), '%Y-%m')",
      "ORDER BY c.branch_code, c.month",
    ].join("\n"),
    alternatives: [
      [
        "WITH monthly AS (",
        "  SELECT branch_code, DATE_FORMAT(deposited_on, '%Y-%m') AS month, YEAR(deposited_on) * 12 + MONTH(deposited_on) AS mi, SUM(amount) AS total",
        "  FROM Deposit GROUP BY branch_code, DATE_FORMAT(deposited_on, '%Y-%m'), YEAR(deposited_on) * 12 + MONTH(deposited_on)",
        "), lagged AS (",
        "  SELECT branch_code, month, mi, total,",
        "    LAG(mi) OVER (PARTITION BY branch_code ORDER BY mi) AS prev_mi,",
        "    LAG(total) OVER (PARTITION BY branch_code ORDER BY mi) AS prev_total",
        "  FROM monthly",
        ")",
        "SELECT branch_code, month, total AS month_total,",
        "  CASE WHEN prev_mi = mi - 1 THEN prev_total END AS prev_month_total,",
        "  CASE WHEN prev_mi = mi - 1 THEN total - prev_total END AS change_amount",
        "FROM lagged ORDER BY branch_code, month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First reduce the deposits to one row per branch and month.",
      "`LAG` gives the previous *row*, which is not always the previous *month* — a branch can skip a month.",
      "Either check that the lagged month is exactly one month earlier, or join each month to the label of the month before it.",
      "December's previous month is November, January's is December of the year before.",
    ],
    editorial: [
      "Start by aggregating: one row per branch and `DATE_FORMAT(deposited_on, '%Y-%m')` month with the summed amount. The comparison then needs, for each of those rows, the row for the **previous calendar month** of the same branch, if it exists.",
      "",
      "`LAG(total) OVER (PARTITION BY branch_code ORDER BY month)` is the obvious tool, but it returns the previous *row*. If a branch had nothing in December, January's lag would be November's total — the wrong comparison. The window alternative fixes that by also lagging a month index (`YEAR × 12 + MONTH`) and only using the lagged total when the index is exactly one less, which also handles the January/December year boundary.",
      "",
      "The reference solution sidesteps the problem by joining the monthly table to itself on the *label* of the previous month, computed with `DATE_SUB(CONCAT(month, '-01'), INTERVAL 1 MONTH)`. A LEFT JOIN leaves `prev_month_total` NULL when there is no such month, and `total − NULL` is NULL, as required. Both approaches are one aggregation plus a small join or sort.",
    ].join("\n"),
  },

  {
    slug: "inoperative-accounts-under-the-two-year-rule",
    title: "Inoperative Accounts Under the Two-Year Rule",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Dates"],
    description: [
      "An account becomes **inoperative** when its holder has made no customer-induced transaction for two years. Interest credits are posted by the bank and do not count as activity. On the review date **2025-06-30**, an account is inoperative when it was opened on or before 2023-06-30 and has **no transaction other than `INTEREST` dated after 2023-06-30**.",
      "",
      "Return `account_id`, `holder_name` and `last_customer_txn` — the date of the account's latest non-interest transaction, or NULL if it never had one — for every inoperative account, ordered by `account_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Account",
        columns: [
          { name: "account_id", type: "int" },
          { name: "holder_name", type: "varchar" },
          { name: "opened_on", type: "date" },
        ],
        primaryKey: ["account_id"],
        note: "One row per savings account.",
      },
      {
        name: "AccountActivity",
        columns: [
          { name: "txn_id", type: "int" },
          { name: "account_id", type: "int" },
          { name: "txn_date", type: "date" },
          { name: "channel", type: "enum", values: ["ATM", "UPI", "BRANCH", "NETBANKING", "INTEREST"] },
        ],
        primaryKey: ["txn_id"],
        note: "One row per transaction; `channel` `INTEREST` marks the bank's own interest credit.",
      },
    ],
    examples: [
      {
        Account: [
          [1, "Aarav Nair", "2019-04-10"],
          [2, "Kavya Rao", "2020-08-01"],
          [3, "John Mehta", "2023-06-30"],
          [4, "Riya Sharma", "2024-01-15"],
          [5, "Dev Khan", "2021-11-20"],
        ],
        AccountActivity: [
          [1, 1, "2022-12-05", "ATM"],
          [2, 1, "2024-03-31", "INTEREST"],
          [3, 2, "2023-07-01", "UPI"],
          [4, 2, "2021-02-14", "BRANCH"],
          [5, 4, "2024-09-30", "INTEREST"],
          [6, 5, "2023-06-30", "NETBANKING"],
          [7, 5, "2025-03-31", "INTEREST"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 9);
      const who = names(rng, n);
      const accounts = who.map((f, i) => [i + 1, fullName(rng, f), chance(rng, 0.15) ? pick(rng, ["2023-06-30", "2023-07-01"]) : dateBetween(rng, "2019-01-01", "2024-06-30")]);
      const m = chance(rng, 0.08) ? 0 : ri(rng, 1, 20);
      const rows = seq(1, m).map((id) => {
        const acct = accounts[ri(rng, 0, n - 1)]!;
        const date = chance(rng, 0.15) ? pick(rng, ["2023-06-30", "2023-07-01"]) : dateBetween(rng, acct[2] as string, "2025-06-30");
        return [id, acct[0]!, date < (acct[2] as string) ? acct[2]! : date, pick(rng, ["ATM", "UPI", "BRANCH", "NETBANKING", "INTEREST", "INTEREST"] as const)];
      });
      return { Account: accounts, AccountActivity: rows };
    },
    solution: [
      "SELECT a.account_id, a.holder_name,",
      "       (SELECT MAX(t.txn_date) FROM AccountActivity t",
      "         WHERE t.account_id = a.account_id AND t.channel <> 'INTEREST') AS last_customer_txn",
      "FROM Account a",
      "WHERE a.opened_on <= '2023-06-30'",
      "  AND NOT EXISTS (SELECT 1 FROM AccountActivity t",
      "                   WHERE t.account_id = a.account_id AND t.channel <> 'INTEREST' AND t.txn_date > '2023-06-30')",
      "ORDER BY a.account_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.account_id, a.holder_name, MAX(t.txn_date) AS last_customer_txn",
        "FROM Account a LEFT JOIN AccountActivity t ON t.account_id = a.account_id AND t.channel <> 'INTEREST'",
        "WHERE a.opened_on <= '2023-06-30'",
        "GROUP BY a.account_id, a.holder_name",
        "HAVING MAX(t.txn_date) IS NULL OR MAX(t.txn_date) <= '2023-06-30'",
        "ORDER BY a.account_id",
      ].join("\n"),
      [
        "SELECT account_id, holder_name, last_customer_txn FROM (",
        "  SELECT a.account_id, a.holder_name, a.opened_on,",
        "    (SELECT MAX(t.txn_date) FROM AccountActivity t WHERE t.account_id = a.account_id AND t.channel IN ('ATM', 'UPI', 'BRANCH', 'NETBANKING')) AS last_customer_txn",
        "  FROM Account a",
        ") x WHERE DATEDIFF('2023-06-30', opened_on) >= 0 AND COALESCE(last_customer_txn, '1900-01-01') <= '2023-06-30'",
        "ORDER BY account_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First decide which transactions count as activity at all — interest credits do not.",
      "An account is inoperative when *no* qualifying transaction falls after the cut-off: think `NOT EXISTS`, or the latest qualifying date.",
      "An account opened after the cut-off date cannot have been idle for two years yet.",
      "An account with no activity ever has a NULL latest date — make sure it is kept, not dropped.",
    ],
    editorial: [
      "Two conditions define an inoperative account: it is at least two years old (`opened_on <= '2023-06-30'`), and no customer-induced transaction is dated after `2023-06-30`. The second is a natural `NOT EXISTS` with a correlated subquery that ignores `INTEREST` rows. The reported date is a separate correlated `MAX` over the same non-interest transactions, NULL when there are none.",
      "",
      "Equivalently, compute each account's latest customer transaction and keep the accounts where it is NULL **or** on/before the cut-off; that is the grouped LEFT JOIN alternative. The NULL arm is essential — `MAX(...) <= '2023-06-30'` alone is unknown for an account that never transacted, and the most dormant accounts of all would vanish. The interest filter belongs in the join condition, for the same reason as in any outer join.",
      "",
      "Boundary dates matter here: a transaction on 2023-06-30 is *not* after the cut-off, one on 2023-07-01 is, and an account opened exactly on 2023-06-30 is old enough. Each version is one pass over the accounts with an index lookup on activity per account.",
    ].join("\n"),
  },

  {
    slug: "loan-book-asset-classification-by-branch",
    title: "Loan Book Asset Classification by Branch",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Aggregation"],
    description: [
      "RBI asks banks to classify loans by **days past due** (`dpd`): 0 is *standard*, 1 to 90 is *special mention* (SMA), and **more than 90** is a *non-performing asset* (NPA). The credit-risk team needs each branch's book split this way.",
      "",
      "For every branch, return `branch_name`, `total_loans`, `standard_amount`, `sma_amount` and `npa_amount` (the summed `outstanding` of the loans in each class, 0 when a class is empty) and `npa_loans` (how many loans are NPA). Order the rows by `branch_name`.",
    ].join("\n"),
    tables: [
      {
        name: "LoanBook",
        columns: [
          { name: "loan_id", type: "int" },
          { name: "branch_name", type: "varchar" },
          { name: "product", type: "enum", values: ["HOME", "PERSONAL", "GOLD", "VEHICLE"] },
          { name: "outstanding", type: "int" },
          { name: "dpd", type: "int" },
        ],
        primaryKey: ["loan_id"],
        note: "One row per live loan; `outstanding` is the principal still owed in rupees, `dpd` the days since the oldest unpaid instalment fell due (0 if none).",
      },
    ],
    examples: [
      {
        LoanBook: [
          [1, "Koregaon Park", "HOME", 4200000, 0],
          [2, "Koregaon Park", "PERSONAL", 310000, 45],
          [3, "Koregaon Park", "GOLD", 90000, 91],
          [4, "Salt Lake", "VEHICLE", 640000, 90],
          [5, "Salt Lake", "PERSONAL", 150000, 0],
          [6, "Banjara Hills", "HOME", 2800000, 120],
          [7, "Salt Lake", "GOLD", 75000, 1],
        ],
      },
    ],
    gen: (rng) => {
      const branches = sample(rng, BRANCHES.map(([b]) => b), ri(rng, 1, 4));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 22);
      const rows = seq(1, n).map((id) => {
        const r = rng();
        const dpd = r < 0.4 ? 0 : r < 0.6 ? pick(rng, [1, 90, 91]) : ri(rng, 1, 200);
        return [id, pick(rng, branches), pick(rng, ["HOME", "PERSONAL", "GOLD", "VEHICLE"] as const), roundTo(rng, 20000, 5000000, 10000), dpd];
      });
      return { LoanBook: rows };
    },
    solution: [
      "SELECT branch_name,",
      "       COUNT(*) AS total_loans,",
      "       SUM(CASE WHEN dpd = 0 THEN outstanding ELSE 0 END) AS standard_amount,",
      "       SUM(CASE WHEN dpd BETWEEN 1 AND 90 THEN outstanding ELSE 0 END) AS sma_amount,",
      "       SUM(CASE WHEN dpd > 90 THEN outstanding ELSE 0 END) AS npa_amount,",
      "       SUM(CASE WHEN dpd > 90 THEN 1 ELSE 0 END) AS npa_loans",
      "FROM LoanBook",
      "GROUP BY branch_name",
      "ORDER BY branch_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT branch_name, COUNT(*) AS total_loans,",
        "  SUM(IF(cls = 'STD', outstanding, 0)) AS standard_amount,",
        "  SUM(IF(cls = 'SMA', outstanding, 0)) AS sma_amount,",
        "  SUM(IF(cls = 'NPA', outstanding, 0)) AS npa_amount,",
        "  COUNT(CASE WHEN cls = 'NPA' THEN 1 END) AS npa_loans",
        "FROM (SELECT branch_name, outstanding, CASE WHEN dpd > 90 THEN 'NPA' WHEN dpd > 0 THEN 'SMA' ELSE 'STD' END AS cls FROM LoanBook) t",
        "GROUP BY branch_name ORDER BY branch_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "One output row per branch: group by `branch_name`.",
      "Each class total is a sum over only some of the group's rows — put the condition inside the `SUM`.",
      "Return 0 for an empty class: a `CASE` with `ELSE 0` does that by itself.",
      "Check the edges: dpd 90 is still SMA, 91 is NPA.",
    ],
    editorial: [
      "This is **conditional aggregation**, the SQL way of pivoting a classification into columns. Group by branch; then every class column is a `SUM` over a `CASE` that yields the loan's outstanding amount when the loan is in that class and 0 otherwise. Because the `ELSE` is 0, a branch with no NPA gets `npa_amount = 0` rather than NULL, and `npa_loans` is a `SUM` of 0/1 flags.",
      "",
      "The boundaries are where the logic is tested: `dpd = 0` is standard, `BETWEEN 1 AND 90` is SMA (inclusive at both ends, so 90 is still SMA), and `> 90` is NPA. Writing the three tests so they cover every value exactly once is the point; the alternative labels each loan once in a derived table (`CASE WHEN dpd > 90 … WHEN dpd > 0 …`) and then counts by label, which makes overlaps impossible.",
      "",
      "The query is a single pass over the book with one group per branch — the same shape a regulatory return uses, because it stays one scan however many class columns are added.",
    ].join("\n"),
  },

  {
    slug: "running-wallet-balance-after-every-transaction",
    title: "Running Wallet Balance After Every Transaction",
    difficulty: "MEDIUM",
    topics: ["Window Functions"],
    description: [
      "A prepaid wallet starts at zero. Money added, cashback and refunds raise the balance; payments lower it. Support agents need the balance **after each transaction**, taking a user's transactions in order of `txn_time` and, for two at the same second, by `txn_id`.",
      "",
      "Return `user_id`, `txn_id`, `txn_time` and `running_balance` for every transaction, ordered by `user_id`, then `txn_time`, then `txn_id`.",
    ].join("\n"),
    tables: [
      {
        name: "WalletTxn",
        columns: [
          { name: "txn_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "txn_time", type: "datetime" },
          { name: "txn_type", type: "enum", values: ["ADD_MONEY", "PAYMENT", "CASHBACK", "REFUND"] },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["txn_id"],
        note: "One row per wallet transaction; `amount` is always positive and `txn_type` decides its direction.",
      },
    ],
    examples: [
      {
        WalletTxn: [
          [1, 7, "2024-04-01 09:00:00", "ADD_MONEY", 2000],
          [2, 7, "2024-04-01 12:30:00", "PAYMENT", 450],
          [3, 9, "2024-04-01 12:30:00", "ADD_MONEY", 500],
          [4, 7, "2024-04-02 08:15:00", "CASHBACK", 25],
          [5, 7, "2024-04-02 08:15:00", "PAYMENT", 1200],
          [6, 9, "2024-04-03 19:00:00", "PAYMENT", 499],
          [7, 7, "2024-04-01 10:00:00", "REFUND", 100],
        ],
      },
    ],
    gen: (rng) => {
      const users = sample(rng, [3, 7, 9, 12, 15], ri(rng, 1, 3));
      const n = chance(rng, 0.04) ? 0 : ri(rng, 1, 20);
      const times = Array.from({ length: 5 }, () => `${dateBetween(rng, "2024-04-01", "2024-04-05")} ${pad(ri(rng, 8, 22))}:${pick(rng, ["00", "15", "30"])}:00`);
      const rows = seq(1, n).map((id) => {
        const type = pick(rng, ["ADD_MONEY", "PAYMENT", "PAYMENT", "CASHBACK", "REFUND"] as const);
        return [id, pick(rng, users), pick(rng, times), type, type === "ADD_MONEY" ? roundTo(rng, 500, 5000, 500) : roundTo(rng, 10, 1500, 5)];
      });
      return { WalletTxn: rows };
    },
    solution: [
      "SELECT user_id, txn_id, txn_time,",
      "       SUM(CASE WHEN txn_type = 'PAYMENT' THEN -amount ELSE amount END)",
      "         OVER (PARTITION BY user_id ORDER BY txn_time, txn_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_balance",
      "FROM WalletTxn",
      "ORDER BY user_id, txn_time, txn_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT t.user_id, t.txn_id, t.txn_time,",
        "  (SELECT SUM(IF(u.txn_type = 'PAYMENT', -u.amount, u.amount)) FROM WalletTxn u",
        "    WHERE u.user_id = t.user_id AND (u.txn_time < t.txn_time OR (u.txn_time = t.txn_time AND u.txn_id <= t.txn_id))) AS running_balance",
        "FROM WalletTxn t ORDER BY t.user_id, t.txn_time, t.txn_id",
      ].join("\n"),
      [
        "SELECT t.user_id, t.txn_id, t.txn_time, SUM(CASE WHEN u.txn_type = 'PAYMENT' THEN -u.amount ELSE u.amount END) AS running_balance",
        "FROM WalletTxn t JOIN WalletTxn u ON u.user_id = t.user_id",
        "  AND (u.txn_time < t.txn_time OR (u.txn_time = t.txn_time AND u.txn_id <= t.txn_id))",
        "GROUP BY t.user_id, t.txn_id, t.txn_time ORDER BY t.user_id, t.txn_time, t.txn_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Give every transaction a sign: payments negative, everything else positive.",
      "A running total is a `SUM(...) OVER (...)` that restarts for each user.",
      "Two transactions can share a timestamp — order by `txn_time, txn_id` and make the frame stop at the current row.",
    ],
    editorial: [
      "A running balance is a **cumulative sum** of signed amounts. The sign comes from a `CASE` (`-amount` for a payment, `amount` otherwise), and the cumulative sum from `SUM(...) OVER (PARTITION BY user_id ORDER BY txn_time, txn_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` — the partition restarts the balance for every user.",
      "",
      "The frame clause is not decoration. Without it the default frame is `RANGE … CURRENT ROW`, which includes every *peer* of the current row in the ordering; if the order were only `txn_time`, two transactions at the same second would both show the balance after both. Ordering by `txn_time, txn_id` makes every row unique, and `ROWS` states the intent explicitly.",
      "",
      "Before window functions this was written as a correlated subquery or a self join that sums every earlier-or-equal transaction of the same user, with the same tie rule spelled out as `u.txn_time < t.txn_time OR (u.txn_time = t.txn_time AND u.txn_id <= t.txn_id)`. Those are quadratic per user; the window version is one sort and a single pass.",
    ].join("\n"),
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "rapid-repeated-upi-transfers-fraud-signal",
    title: "Rapid Repeated UPI Transfers: a Fraud Signal",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Joins"],
    description: [
      "A common mule-account pattern is a burst of transfers from one payer to the same payee. The fraud engine flags a **(payer, payee) pair** when there are **3 or more successful transfers** between them whose times fall within **10 minutes (600 seconds) of the first of them**, inclusive — transfers at 10:00:00, 10:04:00 and 10:10:00 are a burst; 10:00:00, 10:04:00 and 10:10:01 are not. Failed transfers are ignored.",
      "",
      "Return `payer_vpa`, `payee_vpa` and `first_flagged_at` — the earliest `txn_time` that starts such a burst — for every flagged pair. Order the rows by `first_flagged_at`, then `payer_vpa`, then `payee_vpa`.",
    ].join("\n"),
    tables: [
      {
        name: "UpiTransfer",
        columns: [
          { name: "txn_id", type: "int" },
          { name: "payer_vpa", type: "varchar" },
          { name: "payee_vpa", type: "varchar" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["SUCCESS", "FAILED"] },
          { name: "txn_time", type: "datetime" },
        ],
        primaryKey: ["txn_id"],
        note: "One row per transfer attempt; VPAs are always lower case.",
      },
    ],
    examples: [
      {
        UpiTransfer: [
          [1, "ravi7@ybl", "quickcash@paytm", 9999, "SUCCESS", "2024-10-05 10:00:00"],
          [2, "ravi7@ybl", "quickcash@paytm", 9999, "SUCCESS", "2024-10-05 10:04:00"],
          [3, "ravi7@ybl", "quickcash@paytm", 9999, "SUCCESS", "2024-10-05 10:10:00"],
          [4, "ravi7@ybl", "quickcash@paytm", 9999, "SUCCESS", "2024-10-05 10:12:30"],
          [5, "neha2@oksbi", "grocer@okaxis", 640, "SUCCESS", "2024-10-05 11:00:00"],
          [6, "neha2@oksbi", "grocer@okaxis", 640, "FAILED", "2024-10-05 11:02:00"],
          [7, "neha2@oksbi", "grocer@okaxis", 640, "SUCCESS", "2024-10-05 11:03:00"],
          [8, "neha2@oksbi", "grocer@okaxis", 640, "SUCCESS", "2024-10-05 11:10:01"],
          [9, "zara5@ibl", "giftcards@ybl", 5000, "SUCCESS", "2024-10-05 09:58:00"],
          [10, "zara5@ibl", "giftcards@ybl", 5000, "SUCCESS", "2024-10-05 10:01:00"],
          [11, "zara5@ibl", "giftcards@ybl", 5000, "SUCCESS", "2024-10-05 10:01:00"],
        ],
      },
    ],
    gen: (rng) => {
      const payers = ["ravi7@ybl", "neha2@oksbi", "zara5@ibl", "dev3@okaxis"].slice(0, ri(rng, 1, 3));
      const payees = ["quickcash@paytm", "grocer@okaxis", "giftcards@ybl"].slice(0, ri(rng, 1, 2));
      const n = chance(rng, 0.04) ? 0 : ri(rng, 3, 28);
      const rows: Cell[][] = [];
      let t = 36000 + ri(rng, 0, 600);
      for (let id = 1; id <= n; id++) {
        // Mostly short gaps, sometimes exactly at the 10-minute edge, sometimes a long pause.
        const r = rng();
        t += r < 0.15 ? 0 : r < 0.7 ? ri(rng, 10, 150) : r < 0.85 ? pick(rng, [300, 600, 601]) : ri(rng, 700, 3000);
        if (t > 86399) t = 86399;
        rows.push([id, pick(rng, payers), pick(rng, payees), roundTo(rng, 100, 10000, 1), chance(rng, 0.85) ? "SUCCESS" : "FAILED", stamp("2024-10-05", t)]);
      }
      return { UpiTransfer: rows };
    },
    solution: [
      "WITH burst_start AS (",
      "  SELECT a.txn_id, a.payer_vpa, a.payee_vpa, a.txn_time",
      "  FROM UpiTransfer a",
      "  JOIN UpiTransfer b",
      "    ON b.payer_vpa = a.payer_vpa AND b.payee_vpa = a.payee_vpa AND b.status = 'SUCCESS'",
      "   AND TIMESTAMPDIFF(SECOND, a.txn_time, b.txn_time) BETWEEN 0 AND 600",
      "  WHERE a.status = 'SUCCESS'",
      "  GROUP BY a.txn_id, a.payer_vpa, a.payee_vpa, a.txn_time",
      "  HAVING COUNT(*) >= 3",
      ")",
      "SELECT payer_vpa, payee_vpa, MIN(txn_time) AS first_flagged_at",
      "FROM burst_start",
      "GROUP BY payer_vpa, payee_vpa",
      "ORDER BY first_flagged_at, payer_vpa, payee_vpa",
    ].join("\n"),
    alternatives: [
      [
        "WITH ok AS (",
        "  SELECT payer_vpa, payee_vpa, txn_time,",
        "    LEAD(txn_time, 2) OVER (PARTITION BY payer_vpa, payee_vpa ORDER BY txn_time, txn_id) AS third_time",
        "  FROM UpiTransfer WHERE status = 'SUCCESS'",
        ")",
        "SELECT payer_vpa, payee_vpa, MIN(txn_time) AS first_flagged_at FROM ok",
        "WHERE third_time IS NOT NULL AND TIMESTAMPDIFF(SECOND, txn_time, third_time) <= 600",
        "GROUP BY payer_vpa, payee_vpa ORDER BY first_flagged_at, payer_vpa, payee_vpa",
      ].join("\n"),
      [
        "SELECT payer_vpa, payee_vpa, MIN(txn_time) AS first_flagged_at FROM UpiTransfer a",
        "WHERE status = 'SUCCESS' AND (",
        "  SELECT COUNT(*) FROM UpiTransfer b WHERE b.status = 'SUCCESS' AND b.payer_vpa = a.payer_vpa AND b.payee_vpa = a.payee_vpa",
        "    AND b.txn_time >= a.txn_time AND b.txn_time <= DATE_ADD(a.txn_time, INTERVAL 600 SECOND)) >= 3",
        "GROUP BY payer_vpa, payee_vpa ORDER BY first_flagged_at, payer_vpa, payee_vpa",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Treat every successful transfer as a possible start of a burst and look forward 600 seconds from it.",
      "Count the successful transfers of the same pair in `[t, t + 600 s]`; three or more means `t` starts a burst.",
      "With `LEAD(txn_time, 2)` you can read the time of the third transfer directly — is it within 600 s?",
      "A pair can start several bursts; report only the earliest start.",
    ],
    editorial: [
      "The rule is a **sliding window over time**, anchored at each transfer: transfer `t` starts a burst when at least three successful transfers of the same pair (itself included) happen in `[t, t + 600 s]`. Only the starting points need checking — any burst begins at one of its own transfers.",
      "",
      "The reference solution makes that literal with a self join: pair each successful transfer `a` with every successful transfer `b` of the same payer and payee whose time is 0 to 600 seconds later (`TIMESTAMPDIFF(SECOND, a, b) BETWEEN 0 AND 600`), group by `a`, and keep the groups with `COUNT(*) >= 3`. The minimum time per pair is the first flag. `BETWEEN` is inclusive, so a third transfer at exactly 600 s counts and one at 601 s does not; failed attempts are filtered on both sides.",
      "",
      "The window alternative is neater and linear after a sort: within each pair, ordered by time, the third transfer from `t` is `LEAD(txn_time, 2)`, and the burst exists iff that time is at most 600 s after `t`. Equal timestamps are harmless — the earliest-`txn_id` transfer at a tied second sees all its peers ahead of it, so the minimum is the same. A correlated count with `DATE_ADD(…, INTERVAL 600 SECOND)` is the third form.",
    ].join("\n"),
  },

  {
    slug: "longest-run-of-missed-loan-instalments",
    title: "Longest Run of Consecutive Missed Loan Instalments",
    difficulty: "HARD",
    topics: ["Window Functions", "Subqueries"],
    description: [
      "Missing several EMIs **in a row** is a far stronger default signal than the same number of scattered misses. For each loan, find its longest run of consecutive instalments with status `MISSED` (a `PARTIAL` payment breaks a run, like a `PAID` one). Every loan's instalments are numbered 1, 2, 3, … with no gaps.",
      "",
      "Return `loan_id`, `longest_missed_run` (the run's length) and `run_start` (the `installment_no` where it starts — the earliest such run if two runs tie) for every loan whose longest run is **at least 2**. Order the rows by `longest_missed_run` descending, then by `loan_id`.",
    ].join("\n"),
    tables: [
      {
        name: "EmiStatus",
        columns: [
          { name: "loan_id", type: "int" },
          { name: "installment_no", type: "int" },
          { name: "due_date", type: "date" },
          { name: "status", type: "enum", values: ["PAID", "PARTIAL", "MISSED"] },
        ],
        primaryKey: ["loan_id", "installment_no"],
        note: "One row per instalment that has fallen due.",
      },
    ],
    examples: [
      {
        EmiStatus: [
          [101, 1, "2024-01-05", "PAID"],
          [101, 2, "2024-02-05", "MISSED"],
          [101, 3, "2024-03-05", "MISSED"],
          [101, 4, "2024-04-05", "PAID"],
          [101, 5, "2024-05-05", "MISSED"],
          [101, 6, "2024-06-05", "MISSED"],
          [102, 1, "2024-03-10", "MISSED"],
          [102, 2, "2024-04-10", "PARTIAL"],
          [102, 3, "2024-05-10", "MISSED"],
          [103, 1, "2024-02-01", "MISSED"],
          [103, 2, "2024-03-01", "MISSED"],
          [103, 3, "2024-04-01", "MISSED"],
        ],
      },
    ],
    gen: (rng) => {
      const loans = sample(rng, [101, 102, 103, 104, 105, 106], ri(rng, 1, 5));
      const rows: Cell[][] = [];
      for (const loan of loans) {
        const k = ri(rng, 0, 9);
        const pMiss = rng() * 0.8;
        for (let j = 1; j <= k; j++) {
          const status = chance(rng, pMiss) ? "MISSED" : chance(rng, 0.3) ? "PARTIAL" : "PAID";
          rows.push([loan, j, addDays("2024-01-05", (j - 1) * 30), status]);
        }
      }
      return { EmiStatus: rows };
    },
    solution: [
      "WITH missed AS (",
      "  SELECT loan_id, installment_no,",
      "         installment_no - ROW_NUMBER() OVER (PARTITION BY loan_id ORDER BY installment_no) AS grp",
      "  FROM EmiStatus",
      "  WHERE status = 'MISSED'",
      "), runs AS (",
      "  SELECT loan_id, MIN(installment_no) AS run_start, COUNT(*) AS run_len",
      "  FROM missed",
      "  GROUP BY loan_id, grp",
      "), ranked AS (",
      "  SELECT loan_id, run_start, run_len,",
      "         ROW_NUMBER() OVER (PARTITION BY loan_id ORDER BY run_len DESC, run_start) AS rn",
      "  FROM runs",
      ")",
      "SELECT loan_id, run_len AS longest_missed_run, run_start",
      "FROM ranked",
      "WHERE rn = 1 AND run_len >= 2",
      "ORDER BY longest_missed_run DESC, loan_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH starts AS (",
        "  SELECT m.loan_id, m.installment_no AS run_start,",
        "    COALESCE((SELECT MIN(x.installment_no) FROM EmiStatus x WHERE x.loan_id = m.loan_id AND x.installment_no > m.installment_no AND x.status <> 'MISSED'),",
        "             (SELECT MAX(y.installment_no) + 1 FROM EmiStatus y WHERE y.loan_id = m.loan_id)) - m.installment_no AS run_len",
        "  FROM EmiStatus m",
        "  WHERE m.status = 'MISSED'",
        "    AND NOT EXISTS (SELECT 1 FROM EmiStatus p WHERE p.loan_id = m.loan_id AND p.installment_no = m.installment_no - 1 AND p.status = 'MISSED')",
        ")",
        "SELECT s.loan_id, s.run_len AS longest_missed_run, s.run_start FROM starts s",
        "WHERE s.run_len >= 2",
        "  AND NOT EXISTS (SELECT 1 FROM starts o WHERE o.loan_id = s.loan_id",
        "                  AND (o.run_len > s.run_len OR (o.run_len = s.run_len AND o.run_start < s.run_start)))",
        "ORDER BY longest_missed_run DESC, s.loan_id",
      ].join("\n"),
      [
        "WITH flagged AS (",
        "  SELECT loan_id, installment_no, status,",
        "    SUM(CASE WHEN status <> 'MISSED' THEN 1 ELSE 0 END) OVER (PARTITION BY loan_id ORDER BY installment_no ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS breaks",
        "  FROM EmiStatus",
        "), runs AS (",
        "  SELECT loan_id, breaks, MIN(installment_no) AS run_start, COUNT(*) AS run_len FROM flagged WHERE status = 'MISSED' GROUP BY loan_id, breaks",
        "), best AS (",
        "  SELECT loan_id, MAX(run_len) AS top_len FROM runs GROUP BY loan_id",
        ")",
        "SELECT r.loan_id, r.run_len AS longest_missed_run, MIN(r.run_start) AS run_start",
        "FROM runs r JOIN best b ON b.loan_id = r.loan_id AND b.top_len = r.run_len",
        "WHERE r.run_len >= 2 GROUP BY r.loan_id, r.run_len ORDER BY longest_missed_run DESC, r.loan_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Keep only the missed instalments and number them 1, 2, 3, … within each loan.",
      "Inside one run of consecutive instalments, `installment_no − row_number` is constant; it changes when a run breaks.",
      "Group by that difference to get every run with its start and length, then keep each loan's best run.",
      "Break a tie between equal-length runs with the earlier start.",
    ],
    editorial: [
      "This is a **gaps-and-islands** problem. Filter to the missed instalments and number them per loan with `ROW_NUMBER() OVER (PARTITION BY loan_id ORDER BY installment_no)`. Along a run of consecutive instalments both numbers grow by one, so their difference stays constant; when a paid or partial instalment interrupts, `installment_no` jumps while the row number does not, and the difference changes. That difference is a run label.",
      "",
      "Group by loan and label to get each run's `MIN(installment_no)` (its start) and `COUNT(*)` (its length). Then pick each loan's best run with another `ROW_NUMBER`, ordered by length descending and start ascending — the tie rule in the statement — and keep it when the length is at least 2.",
      "",
      "Two alternatives reach the same runs differently. One counts the non-missed instalments seen so far (a running `SUM` of a break flag); missed rows sharing that count form one run. The other finds run starts with `NOT EXISTS` (the previous instalment was not missed) and measures each run up to the next non-missed instalment, or to the end of the schedule. The window plans are a couple of sorts; the correlated one is quadratic per loan.",
    ].join("\n"),
  },

  {
    slug: "savings-accounts-below-minimum-average-balance",
    title: "Savings Accounts Below the Minimum Average Balance",
    difficulty: "HARD",
    topics: ["Dates", "Joins", "Aggregation"],
    description: [
      "Savings accounts must keep an **average daily balance** of ₹10,000 or pay a charge. For the review period **1–10 March 2024**, an account's balance at the end of each day is its `opening_balance` (the balance at the start of 1 March) plus every transaction dated on or before that day; the average daily balance is the mean of those **10 end-of-day balances**, including days with no transactions. Transactions after 10 March do not matter.",
      "",
      "Return `account_id`, `holder_name` and `avg_daily_balance` (**rounded to 2 decimals**) for every account whose average daily balance is **strictly below 10,000**. Order the rows by `avg_daily_balance`, then by `account_id`.",
    ].join("\n"),
    tables: [
      {
        name: "SavingsAccount",
        columns: [
          { name: "account_id", type: "int" },
          { name: "holder_name", type: "varchar" },
          { name: "opening_balance", type: "int" },
        ],
        primaryKey: ["account_id"],
        note: "One row per savings account; `opening_balance` is the balance at the start of 2024-03-01.",
      },
      {
        name: "AccountTxn",
        columns: [
          { name: "txn_id", type: "int" },
          { name: "account_id", type: "int" },
          { name: "txn_date", type: "date" },
          { name: "direction", type: "enum", values: ["CR", "DR"] },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["txn_id"],
        note: "One row per transaction from 2024-03-01 on; `CR` adds `amount`, `DR` subtracts it.",
      },
    ],
    examples: [
      {
        SavingsAccount: [
          [1, "Aditi Gupta", 12000],
          [2, "Rohan Iyer", 2000],
          [3, "Maria Bose", 10000],
          [4, "Harsh Reddy", 25000],
        ],
        AccountTxn: [
          [1, 1, "2024-03-02", "DR", 9000],
          [2, 1, "2024-03-09", "CR", 15000],
          [3, 2, "2024-03-01", "CR", 30000],
          [4, 2, "2024-03-06", "DR", 28000],
          [5, 4, "2024-03-05", "DR", 24000],
          [6, 4, "2024-03-11", "CR", 50000],
          [7, 3, "2024-03-12", "DR", 9000],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 7);
      const who = names(rng, n);
      const accounts = who.map((f, i) => [i + 1, fullName(rng, f), chance(rng, 0.15) ? 10000 : roundTo(rng, 0, 30000, 500)]);
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 18);
      const txns = seq(1, m).map((id) => [
        id, ri(rng, 1, n), dateBetween(rng, "2024-03-01", "2024-03-14"), chance(rng, 0.5) ? "CR" : "DR", roundTo(rng, 500, 15000, 500),
      ]);
      return { SavingsAccount: accounts, AccountTxn: txns };
    },
    solution: [
      "WITH RECURSIVE days AS (",
      "  SELECT CAST('2024-03-01' AS DATE) AS d",
      "  UNION ALL",
      "  SELECT DATE_ADD(d, INTERVAL 1 DAY) FROM days WHERE d < '2024-03-10'",
      "), eod AS (",
      "  SELECT a.account_id, a.holder_name, days.d,",
      "         a.opening_balance + COALESCE(SUM(CASE WHEN t.direction = 'CR' THEN t.amount ELSE -t.amount END), 0) AS balance",
      "  FROM SavingsAccount a",
      "  CROSS JOIN days",
      "  LEFT JOIN AccountTxn t ON t.account_id = a.account_id AND t.txn_date <= days.d",
      "  GROUP BY a.account_id, a.holder_name, a.opening_balance, days.d",
      ")",
      "SELECT account_id, holder_name, ROUND(AVG(balance), 2) AS avg_daily_balance",
      "FROM eod",
      "GROUP BY account_id, holder_name",
      "HAVING AVG(balance) < 10000",
      "ORDER BY avg_daily_balance, account_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT account_id, holder_name, ROUND(avg_balance, 2) AS avg_daily_balance FROM (",
        "  SELECT a.account_id, a.holder_name,",
        "    a.opening_balance + COALESCE(SUM(CASE WHEN t.direction = 'CR' THEN t.amount ELSE -t.amount END * (DATEDIFF('2024-03-10', t.txn_date) + 1)), 0) / 10 AS avg_balance",
        "  FROM SavingsAccount a",
        "  LEFT JOIN AccountTxn t ON t.account_id = a.account_id AND t.txn_date <= '2024-03-10'",
        "  GROUP BY a.account_id, a.holder_name, a.opening_balance",
        ") x WHERE avg_balance < 10000 ORDER BY avg_daily_balance, account_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Days without transactions still count, so you need a row for every day of the period — a recursive CTE can generate the ten dates.",
      "Pair every account with every day, and sum the account's transactions dated on or before that day.",
      "A LEFT JOIN plus `COALESCE` keeps the days (and accounts) that have no transactions yet.",
      "Shortcut: a transaction on day `d` is part of `DATEDIFF('2024-03-10', d) + 1` of the ten end-of-day balances.",
    ],
    editorial: [
      "The average is over **days**, not transactions, so the first job is a calendar. `WITH RECURSIVE days` starts at 2024-03-01 and adds a day until 2024-03-10, giving exactly ten rows. Cross-join it with the accounts to get one row per account per day, then LEFT JOIN each account's transactions dated on or before that day and sum their signed amounts; adding the opening balance gives the end-of-day balance. The LEFT JOIN and `COALESCE` keep a day before the first transaction, and an account with no transactions at all, at the opening balance.",
      "",
      "Averaging the ten balances per account and keeping `AVG(balance) < 10000` in `HAVING` finishes it; an account sitting at exactly 10,000 every day is not charged. Transactions after 10 March are excluded by the `txn_date <= days.d` condition, since no generated day is later.",
      "",
      "The alternative avoids the calendar entirely with a little algebra: a transaction on day `d` is included in every end-of-day balance from `d` to 10 March, that is `DATEDIFF('2024-03-10', d) + 1` of them, so the average is `opening + Σ(signed amount × days remaining) / 10`. That is one pass over the transactions instead of accounts × days × transactions, which is how a bank would compute it at scale — but the calendar version is the one that generalises to rules like \"balance on every Sunday\".",
    ].join("\n"),
  },

  {
    slug: "median-card-spend-by-merchant-category",
    title: "Median Card Spend by Merchant Category",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "Averages are skewed by a few huge purchases, so the cards team reports the **median** settled transaction amount for each merchant category. With an odd number of settled transactions the median is the middle amount; with an even number it is the mean of the two middle amounts. Declined transactions are ignored, and a category with no settled transaction does not appear.",
      "",
      "Return `category`, `settled_txns` and `median_amount` (**rounded to 2 decimals**), ordered by `category`.",
    ].join("\n"),
    tables: [
      {
        name: "CardSpend",
        columns: [
          { name: "txn_id", type: "int" },
          { name: "category", type: "enum", values: ["DINING", "ELECTRONICS", "FUEL", "GROCERY", "TRAVEL"] },
          { name: "amount", type: "int" },
          { name: "txn_status", type: "enum", values: ["SETTLED", "DECLINED"] },
        ],
        primaryKey: ["txn_id"],
        note: "One row per card authorisation; `amount` is in rupees.",
      },
    ],
    examples: [
      {
        CardSpend: [
          [1, "GROCERY", 850, "SETTLED"],
          [2, "GROCERY", 2400, "SETTLED"],
          [3, "GROCERY", 610, "SETTLED"],
          [4, "FUEL", 1500, "SETTLED"],
          [5, "FUEL", 2000, "SETTLED"],
          [6, "FUEL", 50000, "DECLINED"],
          [7, "TRAVEL", 18500, "SETTLED"],
          [8, "TRAVEL", 4200, "SETTLED"],
          [9, "TRAVEL", 4200, "SETTLED"],
          [10, "TRAVEL", 96000, "SETTLED"],
          [11, "DINING", 1250, "DECLINED"],
        ],
      },
    ],
    gen: (rng) => {
      const cats = sample(rng, ["DINING", "ELECTRONICS", "FUEL", "GROCERY", "TRAVEL"] as const, ri(rng, 1, 4));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 26);
      const pool = Array.from({ length: ri(rng, 3, 10) }, () => roundTo(rng, 100, 60000, 50));
      const rows = seq(1, n).map((id) => [id, pick(rng, cats), pick(rng, pool), chance(rng, 0.8) ? "SETTLED" : "DECLINED"]);
      return { CardSpend: rows };
    },
    solution: [
      "WITH ranked AS (",
      "  SELECT category, amount,",
      "         ROW_NUMBER() OVER (PARTITION BY category ORDER BY amount) AS rn,",
      "         COUNT(*) OVER (PARTITION BY category) AS cnt",
      "  FROM CardSpend",
      "  WHERE txn_status = 'SETTLED'",
      ")",
      "SELECT category, MAX(cnt) AS settled_txns, ROUND(AVG(amount), 2) AS median_amount",
      "FROM ranked",
      "WHERE rn IN (FLOOR((cnt + 1) / 2), FLOOR((cnt + 2) / 2))",
      "GROUP BY category",
      "ORDER BY category",
    ].join("\n"),
    alternatives: [
      [
        "WITH s AS (SELECT txn_id, category, amount FROM CardSpend WHERE txn_status = 'SETTLED')",
        "SELECT t.category, (SELECT COUNT(*) FROM s c WHERE c.category = t.category) AS settled_txns, ROUND(AVG(DISTINCT t.amount), 2) AS median_amount",
        "FROM s t",
        "WHERE (SELECT COUNT(*) FROM s u WHERE u.category = t.category AND u.amount <= t.amount) * 2 >= (SELECT COUNT(*) FROM s c WHERE c.category = t.category)",
        "  AND (SELECT COUNT(*) FROM s u WHERE u.category = t.category AND u.amount >= t.amount) * 2 >= (SELECT COUNT(*) FROM s c WHERE c.category = t.category)",
        "GROUP BY t.category ORDER BY t.category",
      ].join("\n"),
      [
        "WITH ranked AS (",
        "  SELECT category, amount, ROW_NUMBER() OVER (PARTITION BY category ORDER BY amount, txn_id) AS up,",
        "         ROW_NUMBER() OVER (PARTITION BY category ORDER BY amount DESC, txn_id DESC) AS down",
        "  FROM CardSpend WHERE txn_status = 'SETTLED'",
        ")",
        "SELECT category, COUNT(*) AS settled_txns, ROUND(AVG(CASE WHEN up + 1 >= down AND down + 1 >= up THEN amount END), 2) AS median_amount",
        "FROM ranked GROUP BY category ORDER BY category",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Number the settled amounts of each category in ascending order, and attach the category's count to every row.",
      "For a count `c`, the middle positions are `(c + 1) / 2` and `(c + 2) / 2` rounded down — the same position when `c` is odd.",
      "Average the amounts at the middle positions; duplicates of a value are fine, they are different rows.",
      "Without window functions: a value is a middle value when at least half the rows are ≤ it and at least half are ≥ it.",
    ],
    editorial: [
      "MySQL has no `MEDIAN` aggregate, so the median is built from positions. Inside each category, `ROW_NUMBER() OVER (PARTITION BY category ORDER BY amount)` numbers the settled amounts 1…c and `COUNT(*) OVER (PARTITION BY category)` attaches c to each row. The middle positions are `FLOOR((c + 1) / 2)` and `FLOOR((c + 2) / 2)`: for c = 3 both are 2, for c = 4 they are 2 and 3. Keeping those rows and averaging them gives the median for odd and even counts alike; filtering declined rows *before* numbering is what keeps them out.",
      "",
      "Ties do not break anything: two transactions of ₹4,200 are two rows with two positions, so the median of 4,200, 4,200, 18,500, 96,000 is the mean of positions 2 and 3 — (4,200 + 18,500) / 2. The ascending/descending variant uses the same fact: a row is in the middle when its rank from the bottom and from the top differ by at most one.",
      "",
      "The window-free alternative uses the definition: a value is a middle value when at least half of the category's amounts are ≤ it and at least half are ≥ it. For an even count the two middle values pass; for equal middle values only one distinct value passes — hence `AVG(DISTINCT …)`. That form is quadratic per category; the window form is one sort per category.",
    ].join("\n"),
  },

  {
    slug: "upi-new-user-next-month-retention",
    title: "UPI App New-User Retention in the Following Month",
    difficulty: "HARD",
    topics: ["Dates", "Aggregation", "Subqueries"],
    description: [
      "The growth team groups users into **cohorts** by the calendar month of their first UPI transaction, and measures how many came back in the **next calendar month** (any transaction in it counts; later months do not).",
      "",
      "For every cohort, return `cohort_month` (`'YYYY-MM'`), `new_users`, `retained_next_month` and `retention_pct` — `100 × retained_next_month ÷ new_users`, **rounded to 2 decimals**. Order the rows by `cohort_month`.",
    ].join("\n"),
    tables: [
      {
        name: "UpiActivity",
        columns: [
          { name: "txn_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "txn_date", type: "date" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["txn_id"],
        note: "One row per successful UPI payment made in the app.",
      },
    ],
    examples: [
      {
        UpiActivity: [
          [1, 1, "2024-11-03", 250],
          [2, 1, "2024-12-15", 90],
          [3, 2, "2024-11-30", 1200],
          [4, 2, "2025-01-02", 300],
          [5, 3, "2024-12-01", 45],
          [6, 3, "2025-01-31", 600],
          [7, 4, "2024-12-20", 5000],
          [8, 4, "2024-12-22", 150],
          [9, 5, "2024-11-11", 80],
          [10, 5, "2024-11-25", 75],
          [11, 5, "2024-12-01", 60],
        ],
      },
    ],
    gen: (rng) => {
      const users = ri(rng, 1, 10);
      const n = Math.min(30, users + ri(rng, 0, 18));
      const rows: Cell[][] = [];
      for (let id = 1; id <= n; id++) {
        const user = id <= users ? id : ri(rng, 1, users);
        rows.push([id, user, dateBetween(rng, "2024-10-20", "2025-02-10"), roundTo(rng, 10, 5000, 5)]);
      }
      return { UpiActivity: rows };
    },
    solution: [
      "WITH firsts AS (",
      "  SELECT user_id, DATE_FORMAT(MIN(txn_date), '%Y-%m') AS cohort_month",
      "  FROM UpiActivity",
      "  GROUP BY user_id",
      "), flagged AS (",
      "  SELECT f.user_id, f.cohort_month,",
      "         CASE WHEN EXISTS (",
      "           SELECT 1 FROM UpiActivity a",
      "           WHERE a.user_id = f.user_id",
      "             AND DATE_FORMAT(a.txn_date, '%Y-%m') = DATE_FORMAT(DATE_ADD(CONCAT(f.cohort_month, '-01'), INTERVAL 1 MONTH), '%Y-%m')",
      "         ) THEN 1 ELSE 0 END AS came_back",
      "  FROM firsts f",
      ")",
      "SELECT cohort_month, COUNT(*) AS new_users, SUM(came_back) AS retained_next_month,",
      "       ROUND(100 * SUM(came_back) / COUNT(*), 2) AS retention_pct",
      "FROM flagged",
      "GROUP BY cohort_month",
      "ORDER BY cohort_month",
    ].join("\n"),
    alternatives: [
      [
        "WITH m AS (",
        "  SELECT DISTINCT user_id, YEAR(txn_date) * 12 + MONTH(txn_date) AS mi FROM UpiActivity",
        "), firsts AS (",
        "  SELECT user_id, MIN(mi) AS first_mi FROM m GROUP BY user_id",
        ")",
        "SELECT CONCAT(FLOOR((f.first_mi - 1) / 12), '-', LPAD(MOD(f.first_mi - 1, 12) + 1, 2, '0')) AS cohort_month,",
        "  COUNT(*) AS new_users, COUNT(n.user_id) AS retained_next_month,",
        "  ROUND(COUNT(n.user_id) * 100 / COUNT(*), 2) AS retention_pct",
        "FROM firsts f LEFT JOIN m n ON n.user_id = f.user_id AND n.mi = f.first_mi + 1",
        "GROUP BY f.first_mi ORDER BY cohort_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "A user's cohort is the month of their earliest transaction — one `MIN` per user.",
      "\"Next month\" is relative to the cohort, so December's next month is January of the following year.",
      "Turning a month into a number (`YEAR × 12 + MONTH`) makes \"next month\" a plain `+ 1`.",
      "Count each returning user once, however many transactions they made in the next month.",
    ],
    editorial: [
      "Cohort analysis has two steps. First, each user's cohort: `MIN(txn_date)` per user, formatted as `'YYYY-MM'`. Second, for each user, a yes/no — did they transact in the month after their cohort month? An `EXISTS` subquery that compares each transaction's month label with the label of `DATE_ADD(cohort_month-01, INTERVAL 1 MONTH)` answers it; anchoring at the 1st of the month avoids any end-of-month surprises when adding a month. Then group by cohort, count users, sum the flags, and round the percentage.",
      "",
      "The details the statement pins down: activity two months later does not count, several transactions in the next month count once (the flag is 0/1 per user, not a count of transactions), and a user whose first transaction is on 30 November and next on 2 January is *not* retained for November. The year boundary must work — December's next month is January — which `DATE_ADD` handles.",
      "",
      "The alternative converts months to integers (`YEAR × 12 + MONTH`), de-duplicates user-months, and LEFT JOINs each user's first month to the same user's month `first + 1`; `COUNT(n.user_id)` counts matches only. It is a cleaner plan for large tables — one aggregation and an equality join instead of a correlated subquery per user.",
    ].join("\n"),
  },

  {
    slug: "top-psp-handles-by-monthly-upi-volume",
    title: "Top Two PSP Handles by Monthly UPI Volume",
    difficulty: "HARD",
    topics: ["Strings", "Window Functions", "Dates"],
    description: [
      "NPCI watches how concentrated UPI is among payment-service providers. The provider of a payment is the **handle after the `@`** in the payee's VPA (`kirana7@ybl` → `ybl`). For every month, rank the handles by their total amount of **successful** payments and keep the **top two totals** — handles with equal totals share a rank, so a month can list more than two handles, and the next distinct total after a tie is still rank 2.",
      "",
      "Return `month` (`'YYYY-MM'`), `psp_handle`, `total_amount` and `handle_rank` (1 or 2). Order the rows by `month`, then `handle_rank`, then `psp_handle`.",
    ].join("\n"),
    tables: [
      {
        name: "UpiCollection",
        columns: [
          { name: "txn_id", type: "int" },
          { name: "payee_vpa", type: "varchar" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["SUCCESS", "FAILED"] },
          { name: "txn_date", type: "date" },
        ],
        primaryKey: ["txn_id"],
        note: "One row per payment received by a merchant VPA; VPAs are lower case and contain exactly one `@`.",
      },
    ],
    examples: [
      {
        UpiCollection: [
          [1, "kirana7@ybl", 5000, "SUCCESS", "2024-07-02"],
          [2, "chaiwala@oksbi", 3000, "SUCCESS", "2024-07-05"],
          [3, "pharma.plus@okaxis", 3000, "SUCCESS", "2024-07-09"],
          [4, "tailor.raj@paytm", 1000, "SUCCESS", "2024-07-15"],
          [5, "kirana7@ybl", 9000, "FAILED", "2024-07-20"],
          [6, "bookstore@paytm", 6000, "SUCCESS", "2024-08-01"],
          [7, "kirana7@ybl", 2500, "SUCCESS", "2024-08-03"],
          [8, "dhaba22@ybl", 2500, "SUCCESS", "2024-08-10"],
          [9, "chaiwala@oksbi", 4000, "SUCCESS", "2024-08-31"],
        ],
      },
    ],
    gen: (rng) => {
      const merchants = ["kirana7", "chaiwala", "pharma.plus", "tailor.raj", "bookstore", "dhaba22"];
      const handles = sample(rng, UPI_HANDLES, ri(rng, 2, 5));
      const n = chance(rng, 0.04) ? 0 : ri(rng, 1, 24);
      const rows = seq(1, n).map((id) => [
        id, `${pick(rng, merchants)}@${pick(rng, handles)}`, pick(rng, [1000, 1500, 2500, 3000, 5000]), chance(rng, 0.85) ? "SUCCESS" : "FAILED",
        dateBetween(rng, "2024-07-01", "2024-09-30"),
      ]);
      return { UpiCollection: rows };
    },
    solution: [
      "WITH totals AS (",
      "  SELECT DATE_FORMAT(txn_date, '%Y-%m') AS month,",
      "         SUBSTRING_INDEX(payee_vpa, '@', -1) AS psp_handle,",
      "         SUM(amount) AS total_amount",
      "  FROM UpiCollection",
      "  WHERE status = 'SUCCESS'",
      "  GROUP BY DATE_FORMAT(txn_date, '%Y-%m'), SUBSTRING_INDEX(payee_vpa, '@', -1)",
      "), ranked AS (",
      "  SELECT month, psp_handle, total_amount,",
      "         DENSE_RANK() OVER (PARTITION BY month ORDER BY total_amount DESC) AS handle_rank",
      "  FROM totals",
      ")",
      "SELECT month, psp_handle, total_amount, handle_rank",
      "FROM ranked",
      "WHERE handle_rank <= 2",
      "ORDER BY month, handle_rank, psp_handle",
    ].join("\n"),
    alternatives: [
      [
        "WITH totals AS (",
        "  SELECT LEFT(txn_date, 7) AS month, SUBSTRING(payee_vpa, LOCATE('@', payee_vpa) + 1) AS psp_handle, SUM(amount) AS total_amount",
        "  FROM UpiCollection WHERE status = 'SUCCESS'",
        "  GROUP BY LEFT(txn_date, 7), SUBSTRING(payee_vpa, LOCATE('@', payee_vpa) + 1)",
        ")",
        "SELECT * FROM (",
        "  SELECT t.month, t.psp_handle, t.total_amount,",
        "    (SELECT COUNT(DISTINCT u.total_amount) FROM totals u WHERE u.month = t.month AND u.total_amount > t.total_amount) + 1 AS handle_rank",
        "  FROM totals t",
        ") r WHERE handle_rank <= 2 ORDER BY month, handle_rank, psp_handle",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Extract the handle from the VPA first: everything after the `@`.",
      "Aggregate successful payments to one row per month and handle before ranking anything.",
      "Equal totals share a rank and the next total is rank 2, not 3 — which ranking function behaves like that?",
      "The rank restarts every month: partition by the month.",
    ],
    editorial: [
      "Three steps in a CTE chain. **Parse**: `SUBSTRING_INDEX(payee_vpa, '@', -1)` returns everything after the last `@`, the PSP handle (`SUBSTRING(payee_vpa, LOCATE('@', payee_vpa) + 1)` is the equivalent). **Aggregate**: filter to successful payments and group by the month label and the handle, summing amounts — two merchants on `@ybl` add up to one handle total. **Rank**: within each month, `DENSE_RANK() OVER (PARTITION BY month ORDER BY total_amount DESC)` and keep ranks 1 and 2.",
      "",
      "The tie rule decides the ranking function. With totals 5,000, 3,000, 3,000, 1,000, `DENSE_RANK` gives 1, 2, 2, 3, so the two handles at 3,000 both make the list and the 1,000 does not. `RANK` gives 1, 2, 2, 4 — the same answer here but not after a tie at the top (6,000, 6,000, 4,000 → 1, 1, 3 drops the 4,000, which the statement keeps as rank 2). `ROW_NUMBER` would drop a tied handle arbitrarily.",
      "",
      "The window-free version computes the same dense rank as one plus the number of *distinct* larger totals in the month, with a correlated `COUNT(DISTINCT …)`. Ranking runs on the small aggregated table, so either form is cheap once the scan and group-by are done.",
    ].join("\n"),
  },

  {
    slug: "days-to-first-one-lakh-balance",
    title: "Days From Account Opening to a ₹1 Lakh Balance",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Joins"],
    description: [
      "A neobank measures how quickly new customers start using it as their main account: the number of days from opening until the balance first reaches **₹1,00,000 or more**. Every account opens at zero; credits add to the balance, debits subtract, and transactions are applied in order of `txn_date`, then `txn_id`. A balance that reaches the mark and later falls back still counts from the first time.",
      "",
      "Return `account_id`, `holder_name`, `reached_on` (the `txn_date` of the transaction that first brought the balance to 1,00,000 or more) and `days_to_lakh` (days from `opened_on` to `reached_on`) for every account that ever reached it. Order the rows by `days_to_lakh`, then by `account_id`.",
    ].join("\n"),
    tables: [
      {
        name: "NeoAccount",
        columns: [
          { name: "account_id", type: "int" },
          { name: "holder_name", type: "varchar" },
          { name: "opened_on", type: "date" },
        ],
        primaryKey: ["account_id"],
        note: "One row per account; the balance is 0 on `opened_on`.",
      },
      {
        name: "NeoTxn",
        columns: [
          { name: "txn_id", type: "int" },
          { name: "account_id", type: "int" },
          { name: "txn_date", type: "date" },
          { name: "txn_type", type: "enum", values: ["CREDIT", "DEBIT"] },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["txn_id"],
        note: "One row per transaction, never dated before the account's `opened_on`.",
      },
    ],
    examples: [
      {
        NeoAccount: [
          [1, "Ananya Verma", "2024-01-10"],
          [2, "Kabir Das", "2024-01-15"],
          [3, "Noah Iyer", "2024-02-01"],
          [4, "Simran Khan", "2024-02-05"],
        ],
        NeoTxn: [
          [1, 1, "2024-01-10", "CREDIT", 60000],
          [2, 1, "2024-01-31", "CREDIT", 45000],
          [3, 1, "2024-02-02", "DEBIT", 30000],
          [4, 2, "2024-01-20", "CREDIT", 99000],
          [5, 2, "2024-01-25", "DEBIT", 5000],
          [6, 2, "2024-03-01", "CREDIT", 6000],
          [7, 3, "2024-02-01", "CREDIT", 100000],
          [8, 4, "2024-02-10", "CREDIT", 80000],
          [9, 4, "2024-02-10", "DEBIT", 20000],
          [10, 4, "2024-02-10", "CREDIT", 40000],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 6);
      const who = names(rng, n);
      const accounts = who.map((f, i) => [i + 1, fullName(rng, f), dateBetween(rng, "2024-01-01", "2024-03-31")]);
      const rows: Cell[][] = [];
      let id = 1;
      for (const [acct, , opened] of accounts) {
        const k = ri(rng, 0, 5);
        for (let j = 0; j < k && id <= 26; j++, id++) {
          const credit = chance(rng, 0.7);
          rows.push([id, acct!, addDays(opened as string, ri(rng, 0, 60)), credit ? "CREDIT" : "DEBIT", credit ? pick(rng, [20000, 40000, 50000, 60000, 100000]) : roundTo(rng, 1000, 30000, 1000)]);
        }
      }
      return { NeoAccount: accounts, NeoTxn: rows };
    },
    solution: [
      "WITH running AS (",
      "  SELECT account_id, txn_date,",
      "         SUM(CASE WHEN txn_type = 'CREDIT' THEN amount ELSE -amount END)",
      "           OVER (PARTITION BY account_id ORDER BY txn_date, txn_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS balance",
      "  FROM NeoTxn",
      "), first_hit AS (",
      "  SELECT account_id, MIN(txn_date) AS reached_on",
      "  FROM running",
      "  WHERE balance >= 100000",
      "  GROUP BY account_id",
      ")",
      "SELECT a.account_id, a.holder_name, f.reached_on, DATEDIFF(f.reached_on, a.opened_on) AS days_to_lakh",
      "FROM first_hit f",
      "JOIN NeoAccount a ON a.account_id = f.account_id",
      "ORDER BY days_to_lakh, a.account_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.account_id, a.holder_name, MIN(t.txn_date) AS reached_on, DATEDIFF(MIN(t.txn_date), a.opened_on) AS days_to_lakh",
        "FROM NeoAccount a JOIN NeoTxn t ON t.account_id = a.account_id",
        "WHERE (SELECT SUM(IF(u.txn_type = 'CREDIT', u.amount, -u.amount)) FROM NeoTxn u",
        "       WHERE u.account_id = t.account_id AND (u.txn_date < t.txn_date OR (u.txn_date = t.txn_date AND u.txn_id <= t.txn_id))) >= 100000",
        "GROUP BY a.account_id, a.holder_name, a.opened_on",
        "ORDER BY days_to_lakh, a.account_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Compute the balance after every transaction: a running sum of signed amounts per account.",
      "Order the running sum by date and then `txn_id`, so same-day transactions are applied one at a time.",
      "Among the transactions where the balance is at least 1,00,000, the first one is the answer — later dips do not matter.",
      "`DATEDIFF(later, earlier)` gives the number of days.",
    ],
    editorial: [
      "The balance after each transaction is a **running total** of signed amounts — `SUM(CASE WHEN txn_type = 'CREDIT' THEN amount ELSE -amount END) OVER (PARTITION BY account_id ORDER BY txn_date, txn_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`. Ordering by `txn_id` within a date applies same-day transactions one at a time, so a balance that touches 1,00,000 in the middle of a busy day counts (the example's fourth account reaches it on its third transaction of 10 February).",
      "",
      "The first time the mark is reached is the earliest row with `balance >= 100000`; because rows are ordered by date first, `MIN(txn_date)` over those rows is that transaction's date. Later rows below the mark change nothing — the question is about the first crossing, not the current balance. Accounts that never reach it have no qualifying row and drop out of the inner join. `DATEDIFF(reached_on, opened_on)` gives the days, 0 when it happens on the opening day.",
      "",
      "Without window functions, a correlated subquery recomputes the running balance for every transaction with the same date-then-id tie rule; the grouped `MIN` is the same. That is quadratic per account, against one sort for the window version.",
    ].join("\n"),
  },
];
