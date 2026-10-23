import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, chance, dateBetween, names, pick, ri, roundTo, sample, shuffle } from "./kit.js";

/**
 * Razorpay: the questions a payments analyst, a settlements/reconciliation
 * engineer, a RazorpayX product analyst or a risk team member at a payment
 * gateway asks — captured volume by method, gateway fees, payment links, QR
 * codes, KYC queues, refunds, chargebacks, webhook retries, subscription
 * mandates and dunning, T+N settlements against a bank calendar, payment
 * method activation audits, RazorpayX payouts and payroll. Every schema and every
 * figure is fictional: this is a practice set framed on the company's
 * products, not its real data model. Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
const pad = (n: number) => String(n).padStart(2, "0");
/** 'YYYY-MM-DD HH:MM:00' from a date and minutes after midnight. */
const at = (date: string, minutes: number): string => {
  const d = addDays(date, Math.floor(minutes / 1440));
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${d} ${pad(Math.floor(m / 60))}:${pad(m % 60)}:00`;
};
/** Day of the week, 0 = Sunday … 6 = Saturday. */
const dow = (date: string): number => new Date(`${date}T00:00:00Z`).getUTCDay();

const BUSINESSES = [
  "Kirana Kart", "Urban Threads", "FitFuel Labs", "BookNook", "TrekNest", "PixelPlay Studio",
  "GreenLeaf Organics", "SkillSprint Academy", "HomeBrew Coffee", "Spice Route Foods",
] as const;
const METHODS = ["upi", "card", "netbanking", "wallet", "emi"] as const;
const BANKS = ["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak Mahindra Bank", "Yes Bank"] as const;
const NETWORKS = ["Visa", "Mastercard", "RuPay", "Amex", "Diners"] as const;
const CATEGORIES = ["ecommerce", "education", "food", "travel", "saas", "gaming"] as const;

export const COMPANY_RAZORPAY: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "razorpay-payment-links-that-lapsed-unpaid",
    title: "Razorpay: Payment Links That Lapsed Without Payment",
    difficulty: "EASY",
    topics: ["Basics", "Dates"],
    description: [
      "A merchant success manager at Razorpay wants to nudge merchants whose payment links quietly expired before the customer paid, so they can resend them.",
      "",
      "As of the audit date **2025-03-31**, return every payment link that is **not cancelled**, has **no payment** (`paid_on` is NULL), and whose `expire_by` date is **strictly before 2025-03-31**. A link with a NULL `expire_by` never expires, and a link expiring on the audit date itself has not lapsed yet. Return `link_id`, `merchant_id` and `amount`, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "PaymentLink",
        columns: [
          { name: "link_id", type: "int" },
          { name: "merchant_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "expire_by", type: "date" },
          { name: "paid_on", type: "date" },
          { name: "cancelled", type: "bool" },
        ],
        primaryKey: ["link_id"],
        note: "One row per payment link a merchant created. `amount` is in rupees; `expire_by` is NULL for a link without expiry; `paid_on` is NULL until the customer pays; `cancelled` is 1 when the merchant withdrew the link.",
      },
    ],
    examples: [
      {
        PaymentLink: [
          [1, 11, 1499, "2025-03-15", null, 0],
          [2, 11, 2500, "2025-03-10", "2025-03-08", 0],
          [3, 12, 999, "2025-03-31", null, 0],
          [4, 12, 5000, null, null, 0],
          [5, 13, 750, "2025-02-28", null, 1],
          [6, 13, 12000, "2025-03-30", null, 0],
          [7, 14, 300, "2025-04-15", null, 0],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 20);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 11, 16),
        roundTo(rng, 100, 20000, 50),
        chance(rng, 0.15) ? null : chance(rng, 0.2) ? pick(rng, ["2025-03-31", "2025-03-30", "2025-04-01"]) : dateBetween(rng, "2025-02-10", "2025-04-20"),
        chance(rng, 0.35) ? dateBetween(rng, "2025-02-05", "2025-03-30") : null,
        chance(rng, 0.15) ? 1 : 0,
      ]);
      return { PaymentLink: rows };
    },
    solution: [
      "SELECT link_id, merchant_id, amount",
      "FROM PaymentLink",
      "WHERE cancelled = 0",
      "  AND paid_on IS NULL",
      "  AND expire_by < '2025-03-31'",
    ].join("\n"),
    alternatives: [
      "SELECT link_id, merchant_id, amount FROM PaymentLink WHERE NOT cancelled = 1 AND COALESCE(paid_on, 'unpaid') = 'unpaid' AND expire_by IS NOT NULL AND DATEDIFF('2025-03-31', expire_by) > 0",
    ],
    hints: [
      "Three conditions must hold together: not cancelled, not paid, and expired before the audit date.",
      "\"Not paid\" is a NULL test — `= NULL` never matches anything.",
      "A NULL `expire_by` fails any comparison, which is exactly what \"never expires\" needs.",
    ],
    editorial: [
      "Each link is judged on its own row, so this is a filter with three conditions joined by `AND`: `cancelled = 0` drops the links the merchant withdrew, `paid_on IS NULL` keeps only links nobody paid, and `expire_by < '2025-03-31'` keeps links whose validity ended before the audit day.",
      "",
      "Two edge cases are handled by the comparison itself. A link with no expiry has `expire_by` NULL; `NULL < '2025-03-31'` is unknown, and `WHERE` keeps only true rows, so such links are never reported — they cannot lapse. A link expiring on 2025-03-31 is still valid that day, and the strict `<` leaves it out.",
      "",
      "The alternative spells the date test as `DATEDIFF('2025-03-31', expire_by) > 0` with an explicit NOT NULL check, and the payment test with `COALESCE`. Either way it is one scan of the table; an index on `(paid_on, expire_by)` would narrow it to unpaid links.",
    ].join("\n"),
  },

  {
    slug: "razorpay-captured-volume-by-method-per-merchant",
    title: "Razorpay: Captured Volume by Payment Method per Merchant",
    difficulty: "EASY",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "A merchant's account manager at Razorpay wants one row per merchant showing how its captured money splits across payment methods, to pitch the right offers (EMI, UPI Autopay, cards).",
      "",
      "Consider only payments with status **`captured`**. For every merchant with at least one captured payment, return `merchant_id`, `upi_amount`, `card_amount`, `netbanking_amount` and `other_amount` (wallet and EMI together) — the total captured `amount` in each bucket, **0** when the merchant has none in it. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Payment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "merchant_id", type: "int" },
          { name: "method", type: "enum", values: ["upi", "card", "netbanking", "wallet", "emi"] },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["captured", "authorized", "failed"] },
        ],
        primaryKey: ["payment_id"],
        note: "One row per payment attempt, `amount` in rupees. Only `captured` payments have moved money to the merchant.",
      },
    ],
    examples: [
      {
        Payment: [
          [1, 101, "upi", 450, "captured"],
          [2, 101, "card", 2200, "captured"],
          [3, 101, "upi", 300, "captured"],
          [4, 101, "wallet", 150, "failed"],
          [5, 102, "emi", 18000, "captured"],
          [6, 102, "wallet", 600, "captured"],
          [7, 103, "card", 999, "authorized"],
          [8, 102, "netbanking", 4100, "captured"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 25);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 101, 105),
        pick(rng, METHODS),
        roundTo(rng, 100, 9000, 50),
        pick(rng, ["captured", "captured", "captured", "failed", "authorized"]),
      ]);
      return { Payment: rows };
    },
    solution: [
      "SELECT merchant_id,",
      "       SUM(CASE WHEN method = 'upi' THEN amount ELSE 0 END) AS upi_amount,",
      "       SUM(CASE WHEN method = 'card' THEN amount ELSE 0 END) AS card_amount,",
      "       SUM(CASE WHEN method = 'netbanking' THEN amount ELSE 0 END) AS netbanking_amount,",
      "       SUM(CASE WHEN method IN ('wallet', 'emi') THEN amount ELSE 0 END) AS other_amount",
      "FROM Payment",
      "WHERE status = 'captured'",
      "GROUP BY merchant_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT merchant_id,",
        "       SUM(IF(method = 'upi', amount, 0)) AS upi_amount,",
        "       SUM(IF(method = 'card', amount, 0)) AS card_amount,",
        "       SUM(IF(method = 'netbanking', amount, 0)) AS netbanking_amount,",
        "       SUM(amount) - SUM(IF(method IN ('upi', 'card', 'netbanking'), amount, 0)) AS other_amount",
        "FROM Payment WHERE status = 'captured' GROUP BY merchant_id",
      ].join("\n"),
      [
        "SELECT merchant_id, SUM(amount * (method = 'upi')) AS upi_amount, SUM(amount * (method = 'card')) AS card_amount,",
        "       SUM(amount * (method = 'netbanking')) AS netbanking_amount, SUM(amount * (method = 'wallet' OR method = 'emi')) AS other_amount",
        "FROM Payment WHERE status = 'captured' GROUP BY merchant_id",
      ].join("\n"),
    ],
    hints: [
      "Filter to captured payments first, then group by merchant.",
      "Each output column is a sum over the same group, but counting only the rows of one method.",
      "`CASE WHEN … THEN amount ELSE 0 END` inside `SUM` gives 0 instead of NULL for an empty bucket.",
    ],
    editorial: [
      "This is a pivot: rows of (merchant, method, amount) become one row per merchant with a column per method bucket. The tool for it is **conditional aggregation** — group by `merchant_id`, and inside each `SUM` let a `CASE` pass the amount through only when the row belongs to that column's bucket and 0 otherwise.",
      "",
      "The `ELSE 0` matters: without it a merchant with no card payments would get NULL in `card_amount`, while the statement asks for 0. Wallet and EMI share one bucket, so their test is `method IN ('wallet', 'emi')`.",
      "",
      "The status filter goes in `WHERE`, so failed and merely authorized attempts never reach the groups, and a merchant whose only payments failed forms no group at all and is left out. The alternatives use `IF`, a subtraction for the last bucket, and MySQL's habit of treating a comparison as 1 or 0 (`amount * (method = 'upi')`). All are a single pass over the table.",
    ].join("\n"),
  },

  {
    slug: "razorpay-merchants-with-no-verified-kyc-document",
    title: "Razorpay: Merchants Whose KYC Documents Are All Unverified",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "The merchant onboarding team at Razorpay works a queue of businesses that have started KYC but cannot go live yet, because not one of their documents has been verified.",
      "",
      "Return every merchant that has submitted **at least one** KYC document and has **no verified document** (every one of its documents has `verified_on` NULL). Return `merchant_id`, `business_name` and `documents`, the number of documents the merchant submitted. Merchants who submitted nothing are not in the queue. Any order.",
    ].join("\n"),
    tables: [
      {
        name: "Merchant",
        columns: [
          { name: "merchant_id", type: "int" },
          { name: "business_name", type: "varchar" },
          { name: "signed_up_on", type: "date" },
        ],
        primaryKey: ["merchant_id"],
        note: "One row per business that created a Razorpay account.",
      },
      {
        name: "KycDocument",
        columns: [
          { name: "doc_id", type: "int" },
          { name: "merchant_id", type: "int" },
          { name: "doc_type", type: "enum", values: ["PAN", "GSTIN", "bank_proof", "address_proof"] },
          { name: "submitted_on", type: "date" },
          { name: "verified_on", type: "date" },
        ],
        primaryKey: ["doc_id"],
        note: "One row per uploaded document; `verified_on` is NULL until an onboarding analyst approves it.",
      },
    ],
    examples: [
      {
        Merchant: [
          [1, "Kirana Kart", "2025-01-04"],
          [2, "Urban Threads", "2025-01-09"],
          [3, "FitFuel Labs", "2025-01-12"],
          [4, "BookNook", "2025-01-15"],
          [5, "TrekNest", "2025-01-20"],
        ],
        KycDocument: [
          [10, 1, "PAN", "2025-01-05", "2025-01-07"],
          [11, 1, "GSTIN", "2025-01-05", null],
          [12, 2, "PAN", "2025-01-10", null],
          [13, 2, "bank_proof", "2025-01-11", null],
          [14, 4, "PAN", "2025-01-16", null],
          [15, 5, "GSTIN", "2025-01-21", "2025-01-22"],
        ],
      },
    ],
    gen: (rng) => {
      const m = ri(rng, 1, 7);
      const merchants: Cell[][] = sample(rng, BUSINESSES, m).map((b, i) => [i + 1, b, dateBetween(rng, "2025-01-01", "2025-02-28")]);
      const docs: Cell[][] = [];
      for (const row of merchants) {
        for (const t of sample(rng, ["PAN", "GSTIN", "bank_proof", "address_proof"], ri(rng, 0, 3))) {
          const sub = dateBetween(rng, "2025-03-01", "2025-03-20");
          docs.push([docs.length + 10, row[0]!, t, sub, chance(rng, 0.4) ? addDays(sub, ri(rng, 0, 5)) : null]);
        }
      }
      return { Merchant: merchants, KycDocument: shuffle(rng, docs) };
    },
    solution: [
      "SELECT m.merchant_id, m.business_name, COUNT(*) AS documents",
      "FROM Merchant m",
      "JOIN KycDocument d ON d.merchant_id = m.merchant_id",
      "GROUP BY m.merchant_id, m.business_name",
      "HAVING COUNT(d.verified_on) = 0",
    ].join("\n"),
    alternatives: [
      [
        "SELECT m.merchant_id, m.business_name,",
        "       (SELECT COUNT(*) FROM KycDocument d WHERE d.merchant_id = m.merchant_id) AS documents",
        "FROM Merchant m",
        "WHERE EXISTS (SELECT 1 FROM KycDocument d WHERE d.merchant_id = m.merchant_id)",
        "  AND NOT EXISTS (SELECT 1 FROM KycDocument d WHERE d.merchant_id = m.merchant_id AND d.verified_on IS NOT NULL)",
      ].join("\n"),
    ],
    hints: [
      "An inner join to the documents already drops merchants who submitted nothing.",
      "`COUNT(column)` counts only non-NULL values — what does `COUNT(verified_on)` tell you about a merchant?",
      "Filter groups with `HAVING`, not rows with `WHERE`: a merchant fails if *any* of its rows is verified.",
    ],
    editorial: [
      "The condition is about all of a merchant's documents at once, so it belongs to a group, not to a row. Join merchants to their documents (an inner join, which removes merchants with no documents — they are not in the queue) and group by merchant. `COUNT(*)` is then the number of documents submitted.",
      "",
      "`COUNT(d.verified_on)` counts only the documents that carry a verification date. If it is 0, no document of that merchant is verified, which is exactly the queue's rule; `HAVING` keeps those groups. Filtering `verified_on IS NULL` in `WHERE` instead would be wrong: a merchant with one verified and one pending document would still show up with its pending row.",
      "",
      "The alternative states the rule literally with `EXISTS` (submitted something) and `NOT EXISTS` (nothing verified), plus a scalar subquery for the count. Both read each document once with an index on `KycDocument(merchant_id)`.",
    ].join("\n"),
  },

  {
    slug: "razorpay-open-qr-codes-with-no-payment",
    title: "Razorpay: Open QR Codes That Never Received a Payment",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "Razorpay's offline payments team suspects that some QR codes printed for shop counters were never put up. They want the list of QR codes that are still open and have **never** received a payment, so field agents can visit those counters.",
      "",
      "Return `qr_id`, `merchant_id` and `location_label` for every QR code with `is_closed = 0` and **no row** in `QrPayment`. Closed QR codes are never reported. Any order.",
    ].join("\n"),
    tables: [
      {
        name: "QrCode",
        columns: [
          { name: "qr_id", type: "int" },
          { name: "merchant_id", type: "int" },
          { name: "location_label", type: "varchar" },
          { name: "created_on", type: "date" },
          { name: "is_closed", type: "bool" },
        ],
        primaryKey: ["qr_id"],
        note: "One row per QR code issued to a merchant; `location_label` is where the merchant said it would be displayed.",
      },
      {
        name: "QrPayment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "qr_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "received_at", type: "datetime" },
        ],
        primaryKey: ["payment_id"],
        note: "One row per payment received on a QR code; `qr_id` always names an existing code.",
      },
    ],
    examples: [
      {
        QrCode: [
          [1, 201, "Billing Desk", "2025-02-01", 0],
          [2, 201, "Counter 2", "2025-02-01", 0],
          [3, 202, "Food Court Kiosk", "2025-02-10", 1],
          [4, 203, "Delivery Van 3", "2025-02-12", 0],
          [5, 203, "Pharmacy Counter", "2025-02-12", 0],
        ],
        QrPayment: [
          [9001, 1, 240, "2025-02-03 11:20:00"],
          [9002, 1, 85, "2025-02-03 12:05:00"],
          [9003, 4, 1200, "2025-02-14 18:40:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 9);
      const labels = ["Billing Desk", "Counter 1", "Counter 2", "Food Court Kiosk", "Delivery Van 3", "Gate 2 Parking", "Pharmacy Counter", "Reception"];
      const qrs: Cell[][] = seq(1, n).map((id) => [id, ri(rng, 201, 204), pick(rng, labels), dateBetween(rng, "2025-01-01", "2025-02-28"), chance(rng, 0.2) ? 1 : 0]);
      const p = ri(rng, 0, 12);
      const pays: Cell[][] = seq(9001, p).map((id) => [id, ri(rng, 1, n), roundTo(rng, 20, 3000, 5), `${dateBetween(rng, "2025-03-01", "2025-03-20")} 1${ri(rng, 0, 9)}:${pad(ri(rng, 0, 59))}:00`]);
      return { QrCode: qrs, QrPayment: pays };
    },
    solution: [
      "SELECT q.qr_id, q.merchant_id, q.location_label",
      "FROM QrCode q",
      "LEFT JOIN QrPayment p ON p.qr_id = q.qr_id",
      "WHERE q.is_closed = 0 AND p.payment_id IS NULL",
    ].join("\n"),
    alternatives: [
      "SELECT qr_id, merchant_id, location_label FROM QrCode q WHERE is_closed = 0 AND NOT EXISTS (SELECT 1 FROM QrPayment p WHERE p.qr_id = q.qr_id)",
      "SELECT qr_id, merchant_id, location_label FROM QrCode WHERE is_closed = 0 AND qr_id NOT IN (SELECT qr_id FROM QrPayment)",
    ],
    hints: [
      "You are looking for rows of one table that have no partner in another — an anti join.",
      "A LEFT JOIN keeps every QR code; when there is no payment, the payment's columns come back NULL.",
      "Don't forget the closed codes.",
    ],
    editorial: [
      "\"Never received a payment\" means there is no matching row in `QrPayment`, the classic **anti join**. With a `LEFT JOIN`, every QR code appears at least once; a code with payments appears once per payment with real values, and a code without payments appears once with all of `p`'s columns NULL. Keeping `p.payment_id IS NULL` — a primary key, so it is NULL only for a missing partner — leaves exactly the codes nobody paid on.",
      "",
      "The status test `q.is_closed = 0` belongs in `WHERE` too: a closed code is not a field visit, whatever its payments.",
      "",
      "`NOT EXISTS` states the same thing directly and stops at the first payment it finds per code. `NOT IN` works here because `QrPayment.qr_id` is never NULL — if the subquery could return a NULL, `NOT IN` would return no rows at all, which is why `NOT EXISTS` is the safer habit. All three are a single pass with an index on `QrPayment(qr_id)`.",
    ].join("\n"),
  },

  {
    slug: "razorpay-gateway-fee-and-settled-amount",
    title: "Razorpay: Gateway Fee and Settled Amount for Each Payment",
    difficulty: "EASY",
    topics: ["Joins", "Basics"],
    description: [
      "A settlements analyst at Razorpay is checking how much of each payment a merchant should receive after the gateway fee (MDR). The fee depends only on the payment method, from a pricing table.",
      "",
      "For every payment return `payment_id`, `fee` = `amount × fee_percent / 100` **rounded to 2 decimals**, and `settled_amount` = `amount − fee`. A method that has **no row** in `PricingRule` is charged nothing, so its `fee` is **0**. Any order.",
    ].join("\n"),
    tables: [
      {
        name: "Payment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "method", type: "varchar" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["payment_id"],
        note: "Captured payments, `amount` in rupees.",
      },
      {
        name: "PricingRule",
        columns: [
          { name: "method", type: "varchar" },
          { name: "fee_percent", type: "decimal" },
        ],
        primaryKey: ["method"],
        note: "The merchant's fee per method, as a percentage (2.00 means 2%). UPI can be priced at 0.",
      },
    ],
    examples: [
      {
        Payment: [
          [1, "card", 1000],
          [2, "netbanking", 555],
          [3, "upi", 2000],
          [4, "emi", 750],
          [5, "wallet", 1234],
        ],
        PricingRule: [
          ["card", 2.0],
          ["netbanking", 1.8],
          ["upi", 0],
          ["wallet", 2.4],
        ],
      },
    ],
    gen: (rng) => {
      const rules: Cell[][] = sample(rng, METHODS, ri(rng, 1, 5)).map((m) => [m, pick(rng, [0, 1.2, 1.8, 2, 2.4, 3])]);
      const n = ri(rng, 1, 15);
      const pays: Cell[][] = seq(1, n).map((id) => [id, pick(rng, METHODS), ri(rng, 10, 25000)]);
      return { Payment: pays, PricingRule: rules };
    },
    solution: [
      "SELECT p.payment_id,",
      "       COALESCE(ROUND(p.amount * r.fee_percent / 100, 2), 0) AS fee,",
      "       p.amount - COALESCE(ROUND(p.amount * r.fee_percent / 100, 2), 0) AS settled_amount",
      "FROM Payment p",
      "LEFT JOIN PricingRule r ON r.method = p.method",
    ].join("\n"),
    alternatives: [
      [
        "SELECT payment_id, fee, amount - fee AS settled_amount",
        "FROM (SELECT p.payment_id, p.amount,",
        "             IFNULL((SELECT ROUND(p.amount * r.fee_percent / 100, 2) FROM PricingRule r WHERE r.method = p.method), 0) AS fee",
        "      FROM Payment p) t",
      ].join("\n"),
    ],
    hints: [
      "Every payment must appear, even when its method has no pricing row — which join keeps it?",
      "A missing rule gives a NULL fee; turn it into 0 before subtracting, or the settled amount becomes NULL too.",
      "Round the fee first, then subtract the rounded fee.",
    ],
    editorial: [
      "Each payment needs the fee percentage of its method, so join `Payment` to `PricingRule` on `method`. It must be a **LEFT JOIN**: an inner join would silently drop the EMI payment whose method has no rule, while the statement says such payments are charged nothing and still belong in the answer.",
      "",
      "For a payment without a rule, `r.fee_percent` is NULL, so the whole fee expression is NULL. `COALESCE(…, 0)` turns it into the 0 the statement asks for — and it must happen before the subtraction, because `amount - NULL` is NULL as well. Round the fee to paise first and subtract the rounded value, which is how a settlement statement would show it.",
      "",
      "The alternative looks the fee up with a correlated scalar subquery wrapped in `IFNULL`, then computes the settled amount in an outer query from the derived column. Both read each payment once and find its rule through the primary key on `method`.",
    ].join("\n"),
  },

  {
    slug: "razorpay-normal-refunds-that-took-over-a-week",
    title: "Razorpay: Normal-Speed Refunds That Took Over a Week",
    difficulty: "EASY",
    topics: ["Dates", "Basics"],
    description: [
      "Razorpay's customer support team promises that a normal-speed refund reaches the customer within a week. They want the refunds that broke that promise, slowest first.",
      "",
      "Return every refund with `speed = 'normal'` that has been **processed** and whose `days_taken` — the days from `created_on` to `processed_on` — is **more than 7**. Return `refund_id`, `payment_id` and `days_taken`, ordered by `days_taken` descending, then `refund_id` ascending. Instant refunds and refunds still pending (`processed_on` NULL) are not reported.",
    ].join("\n"),
    tables: [
      {
        name: "Refund",
        columns: [
          { name: "refund_id", type: "int" },
          { name: "payment_id", type: "int" },
          { name: "speed", type: "enum", values: ["normal", "instant"] },
          { name: "amount", type: "int" },
          { name: "created_on", type: "date" },
          { name: "processed_on", type: "date" },
        ],
        primaryKey: ["refund_id"],
        note: "One row per refund a merchant raised; `processed_on` is NULL while the bank has not confirmed it.",
      },
    ],
    examples: [
      {
        Refund: [
          [1, 5001, "normal", 499, "2025-03-01", "2025-03-06"],
          [2, 5002, "normal", 1200, "2025-03-01", "2025-03-08"],
          [3, 5003, "normal", 300, "2025-03-02", "2025-03-12"],
          [4, 5004, "instant", 800, "2025-03-02", "2025-03-11"],
          [5, 5005, "normal", 2500, "2025-03-03", null],
          [6, 5006, "normal", 150, "2025-03-04", "2025-03-12"],
          [7, 5007, "normal", 999, "2025-03-05", "2025-03-15"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 20);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const c = dateBetween(rng, "2025-03-01", "2025-03-20");
        const days = chance(rng, 0.3) ? pick(rng, [7, 8]) : ri(rng, 0, 13);
        return [id, 5000 + id, chance(rng, 0.75) ? "normal" : "instant", roundTo(rng, 100, 5000, 50), c, chance(rng, 0.15) ? null : addDays(c, days)];
      });
      return { Refund: rows };
    },
    solution: [
      "SELECT refund_id, payment_id, DATEDIFF(processed_on, created_on) AS days_taken",
      "FROM Refund",
      "WHERE speed = 'normal'",
      "  AND processed_on IS NOT NULL",
      "  AND DATEDIFF(processed_on, created_on) > 7",
      "ORDER BY days_taken DESC, refund_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT refund_id, payment_id, TIMESTAMPDIFF(DAY, created_on, processed_on) AS days_taken",
        "FROM Refund",
        "WHERE speed = 'normal' AND processed_on > DATE_ADD(created_on, INTERVAL 7 DAY)",
        "ORDER BY 3 DESC, 1",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`DATEDIFF(later, earlier)` gives the number of days between two dates.",
      "Exactly seven days is within the promise; only more than seven breaks it.",
      "A pending refund has no `processed_on`, so its difference is NULL — make sure it can't sneak in.",
    ],
    editorial: [
      "The days a refund took are `DATEDIFF(processed_on, created_on)`, the later date first. The filter keeps normal refunds whose difference is strictly greater than 7: a refund done in exactly seven days kept the promise.",
      "",
      "Pending refunds have `processed_on` NULL, so `DATEDIFF` returns NULL and the comparison is unknown; `WHERE` drops them even without the explicit `IS NOT NULL`, which is there for the reader. Instant refunds are excluded by the speed test.",
      "",
      "The order is part of the answer: `days_taken DESC` puts the slowest refunds first, and `refund_id` breaks ties so the result is fully determined. The alternative compares dates directly — `processed_on > DATE_ADD(created_on, INTERVAL 7 DAY)` — which lets an index on the dates be used, and computes the difference with `TIMESTAMPDIFF(DAY, …)`. Both are a single scan plus a sort of the matching rows.",
    ].join("\n"),
  },

  {
    slug: "razorpay-fund-accounts-with-malformed-upi-id",
    title: "Razorpay: Fund Accounts With a Malformed UPI ID",
    difficulty: "EASY",
    topics: ["Strings"],
    description: [
      "Before a RazorpayX bulk payout goes out, the payouts team screens the contacts' UPI fund accounts: a payout to a malformed UPI ID (VPA) fails at the bank and has to be redone.",
      "",
      "A VPA is **well formed** when it contains **exactly one** `@`, has at least one character **before and after** it, and contains **no spaces**. Among fund accounts with `account_type = 'vpa'`, return those whose `vpa` is **NULL or not well formed**: `fund_account_id`, `contact_name` and `vpa`. Bank-account fund accounts are never reported. Any order.",
    ].join("\n"),
    tables: [
      {
        name: "FundAccount",
        columns: [
          { name: "fund_account_id", type: "int" },
          { name: "contact_name", type: "varchar" },
          { name: "account_type", type: "enum", values: ["vpa", "bank_account"] },
          { name: "vpa", type: "varchar" },
        ],
        primaryKey: ["fund_account_id"],
        note: "Where a contact is paid. `vpa` is the UPI ID for `vpa` accounts and NULL for bank accounts (though a broken import can leave it NULL on a `vpa` account too). All IDs are lower case.",
      },
    ],
    examples: [
      {
        FundAccount: [
          [1, "Aarav", "vpa", "aarav.mehta@okhdfcbank"],
          [2, "Diya", "vpa", "diya.rao"],
          [3, "Kabir", "vpa", "@okaxis"],
          [4, "Meera", "bank_account", null],
          [5, "Rohan", "vpa", "rohan@@ybl"],
          [6, "Sneha", "vpa", "sneha 21@ybl"],
          [7, "Vikram", "vpa", "9876543210@paytm"],
          [8, "Zara", "vpa", null],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 16);
      const who = names(rng, n);
      const rows: Cell[][] = who.map((name, i) => {
        const l = name.toLowerCase();
        if (chance(rng, 0.15)) return [i + 1, name, "bank_account", chance(rng, 0.2) ? `${l}@okicici` : null];
        const vpa = chance(rng, 0.45)
          ? pick(rng, [`${l}@okhdfcbank`, `${l}.${ri(rng, 1, 99)}@ybl`, `${ri(rng, 7000000000, 9999999999)}@paytm`, `${l}@oksbi`, `${l}_pay@axl`])
          : pick(rng, [`${l}`, `@okaxis`, `${l}@`, `${l}@@ybl`, `${l} ${ri(rng, 1, 9)}@ybl`, `${l}@ok@sbi`, ``, `${l}@ybl `, null]);
        return [i + 1, name, "vpa", vpa];
      });
      return { FundAccount: rows };
    },
    solution: [
      "SELECT fund_account_id, contact_name, vpa",
      "FROM FundAccount",
      "WHERE account_type = 'vpa'",
      "  AND (vpa IS NULL OR vpa NOT REGEXP '^[^@ ]+@[^@ ]+$')",
    ].join("\n"),
    alternatives: [
      [
        "SELECT fund_account_id, contact_name, vpa",
        "FROM FundAccount",
        "WHERE account_type = 'vpa'",
        "  AND NOT COALESCE(LENGTH(vpa) - LENGTH(REPLACE(vpa, '@', '')) = 1",
        "                   AND LEFT(vpa, 1) <> '@' AND RIGHT(vpa, 1) <> '@'",
        "                   AND LOCATE(' ', vpa) = 0, 0)",
      ].join("\n"),
    ],
    hints: [
      "Count the `@` signs by comparing the string's length with its length after removing them.",
      "A regular expression can say the whole rule at once: some non-`@`, non-space characters, one `@`, some more.",
      "A NULL VPA makes every string test NULL — decide explicitly that it counts as malformed.",
    ],
    editorial: [
      "The rule has three parts — exactly one `@`, something on both sides of it, no spaces — and a single anchored regular expression captures all of them: `^[^@ ]+@[^@ ]+$` means one or more characters that are neither `@` nor a space, then the `@`, then one or more such characters, and nothing else. A VPA that fails to match is malformed.",
      "",
      "NULL needs its own branch. `NULL NOT REGEXP …` is NULL, not true, so without `vpa IS NULL OR …` a `vpa` account with no ID would slip through the screen — the opposite of what the payouts team wants. The empty string fails the pattern, so it is reported as well.",
      "",
      "The alternative avoids regex: `LENGTH(vpa) - LENGTH(REPLACE(vpa, '@', ''))` counts the `@` signs, `LEFT`/`RIGHT` check the first and last characters, and `LOCATE(' ', vpa) = 0` rules out spaces; `COALESCE(…, 0)` turns the NULL case into \"not well formed\". Both are one scan of the table.",
    ].join("\n"),
  },

  {
    slug: "razorpay-magic-checkout-conversion-by-merchant",
    title: "Razorpay: Magic Checkout Conversion Rate by Merchant",
    difficulty: "EASY",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "The Magic Checkout product team at Razorpay compares how well the one-click checkout converts for each merchant that uses it.",
      "",
      "For every merchant with at least one checkout session, return `merchant_id`, `sessions` (all its sessions), `orders` (sessions whose `outcome` is `order_placed`) and `conversion_pct` = 100 × orders / sessions, **rounded to 2 decimals**. Order the rows by `conversion_pct` descending, then `merchant_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "CheckoutSession",
        columns: [
          { name: "session_id", type: "int" },
          { name: "merchant_id", type: "int" },
          { name: "started_at", type: "datetime" },
          { name: "outcome", type: "enum", values: ["order_placed", "abandoned", "payment_failed"] },
        ],
        primaryKey: ["session_id"],
        note: "One row per time a shopper opened Magic Checkout on a merchant's store.",
      },
    ],
    examples: [
      {
        CheckoutSession: [
          [1, 301, "2025-03-01 10:02:00", "order_placed"],
          [2, 301, "2025-03-01 10:15:00", "abandoned"],
          [3, 301, "2025-03-01 11:40:00", "order_placed"],
          [4, 302, "2025-03-01 12:00:00", "payment_failed"],
          [5, 302, "2025-03-01 12:30:00", "order_placed"],
          [6, 303, "2025-03-02 09:10:00", "abandoned"],
          [7, 304, "2025-03-02 09:45:00", "order_placed"],
          [8, 304, "2025-03-02 10:05:00", "abandoned"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 30);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 301, 305),
        at(dateBetween(rng, "2025-03-01", "2025-03-07"), ri(rng, 480, 1380)),
        pick(rng, ["order_placed", "order_placed", "abandoned", "abandoned", "payment_failed"]),
      ]);
      return { CheckoutSession: rows };
    },
    solution: [
      "SELECT merchant_id,",
      "       COUNT(*) AS sessions,",
      "       SUM(CASE WHEN outcome = 'order_placed' THEN 1 ELSE 0 END) AS orders,",
      "       ROUND(100 * SUM(CASE WHEN outcome = 'order_placed' THEN 1 ELSE 0 END) / COUNT(*), 2) AS conversion_pct",
      "FROM CheckoutSession",
      "GROUP BY merchant_id",
      "ORDER BY conversion_pct DESC, merchant_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT merchant_id, sessions, orders, ROUND(100 * orders / sessions, 2) AS conversion_pct",
        "FROM (SELECT merchant_id, COUNT(*) AS sessions, COUNT(IF(outcome = 'order_placed', 1, NULL)) AS orders",
        "      FROM CheckoutSession GROUP BY merchant_id) t",
        "ORDER BY 4 DESC, 1",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Group by merchant: `COUNT(*)` is the sessions.",
      "Count the converted sessions inside the same group with a conditional sum or a COUNT of a conditional expression.",
      "`/` in MySQL is decimal division, so 100 × 2 / 3 is 66.67 after rounding, not 66.",
    ],
    editorial: [
      "Conversion is a ratio of two counts over the same group, so one `GROUP BY merchant_id` gives both: `COUNT(*)` is every session, and `SUM(CASE WHEN outcome = 'order_placed' THEN 1 ELSE 0 END)` counts only the sessions that ended in an order. Abandoned and payment-failed sessions add to the denominator only.",
      "",
      "Multiply by 100 before dividing and round to 2 decimals at the end. MySQL's `/` is decimal division, so there is no integer-division trap, and rounding last avoids compounding errors. A merchant whose every session was abandoned still appears with `orders = 0` and a rate of 0.",
      "",
      "The statement fixes the order: highest conversion first, and `merchant_id` breaks ties between merchants with the same rate. The alternative computes the two counts in a derived table — using `COUNT(IF(…, 1, NULL))`, which counts only non-NULL values — and divides outside. Both are a single pass plus a sort of one row per merchant.",
    ].join("\n"),
  },

  // ──────────────────────────── MEDIUM ────────────────────────────
  {
    slug: "razorpay-card-success-rate-by-issuing-bank",
    title: "Razorpay: Card Payment Success Rate by Issuing Bank",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "Razorpay's payments performance team tracks which card issuers decline the most, to decide where to route and whom to escalate to.",
      "",
      "A card attempt is **successful** when its status is `captured` or `authorized` (the issuer approved it). Ignore attempts whose `issuer_bank` is NULL (the BIN lookup failed). For every issuing bank with **at least 5** attempts, return `issuer_bank`, `attempts` and `success_rate` = 100 × successful / attempts, **rounded to 2 decimals**. Order by `success_rate` descending, then `issuer_bank` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "CardAttempt",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "issuer_bank", type: "varchar" },
          { name: "card_network", type: "varchar" },
          { name: "card_type", type: "enum", values: ["credit", "debit"] },
          { name: "status", type: "enum", values: ["captured", "authorized", "failed"] },
        ],
        primaryKey: ["payment_id"],
        note: "One row per card payment attempt; a shopper retrying is a new row.",
      },
    ],
    examples: [
      {
        CardAttempt: [
          [1, "HDFC Bank", "Visa", "credit", "captured"],
          [2, "HDFC Bank", "Visa", "debit", "failed"],
          [3, "HDFC Bank", "Mastercard", "credit", "captured"],
          [4, "HDFC Bank", "RuPay", "debit", "authorized"],
          [5, "HDFC Bank", "Visa", "credit", "captured"],
          [6, "SBI", "RuPay", "debit", "failed"],
          [7, "SBI", "RuPay", "debit", "captured"],
          [8, "SBI", "Visa", "debit", "failed"],
          [9, "SBI", "RuPay", "credit", "captured"],
          [10, "SBI", "Mastercard", "debit", "failed"],
          [11, "Axis Bank", "Visa", "credit", "captured"],
          [12, null, "Visa", "credit", "failed"],
        ],
      },
    ],
    gen: (rng) => {
      const banks = sample(rng, BANKS, ri(rng, 1, 4));
      const n = ri(rng, 4, 30);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        chance(rng, 0.08) ? null : pick(rng, banks),
        pick(rng, NETWORKS),
        pick(rng, ["credit", "debit"]),
        pick(rng, ["captured", "captured", "authorized", "failed", "failed"]),
      ]);
      return { CardAttempt: rows };
    },
    solution: [
      "SELECT issuer_bank,",
      "       COUNT(*) AS attempts,",
      "       ROUND(100 * SUM(CASE WHEN status IN ('captured', 'authorized') THEN 1 ELSE 0 END) / COUNT(*), 2) AS success_rate",
      "FROM CardAttempt",
      "WHERE issuer_bank IS NOT NULL",
      "GROUP BY issuer_bank",
      "HAVING COUNT(*) >= 5",
      "ORDER BY success_rate DESC, issuer_bank",
    ].join("\n"),
    alternatives: [
      [
        "SELECT issuer_bank, attempts, ROUND(100 * ok / attempts, 2) AS success_rate",
        "FROM (SELECT issuer_bank, COUNT(*) AS attempts, COUNT(*) - SUM(status = 'failed') AS ok",
        "      FROM CardAttempt GROUP BY issuer_bank) t",
        "WHERE issuer_bank IS NOT NULL AND attempts >= 5",
        "ORDER BY success_rate DESC, issuer_bank",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Two statuses count as success — test both in one conditional sum.",
      "The \"at least 5 attempts\" rule is about a group, so it goes in `HAVING`.",
      "Drop the NULL issuers before grouping, or they form a group of their own.",
    ],
    editorial: [
      "Group the attempts by `issuer_bank` and compute two numbers per group: `COUNT(*)` for attempts and a conditional sum for the approvals, where both `captured` and `authorized` count (authorized money has been approved by the issuer even if the merchant has not captured it yet). The rate is 100 × approvals / attempts, rounded at the end.",
      "",
      "`GROUP BY` puts all NULLs in one group, so attempts with an unknown issuer would otherwise appear as a NULL bank; `WHERE issuer_bank IS NOT NULL` removes them before grouping. The minimum volume rule — at least 5 attempts — is a condition on the group and belongs in `HAVING`; a bank with exactly 5 attempts is kept.",
      "",
      "The statement fixes the order, with the bank name breaking ties between equal rates. The alternative counts successes as attempts minus failures (`SUM(status = 'failed')` uses MySQL's 1/0 booleans) inside a derived table and filters the NULL group and the volume rule outside. Both are a single pass over the attempts.",
    ].join("\n"),
  },

  {
    slug: "razorpay-chargeback-rate-by-merchant-category",
    title: "Razorpay: Chargeback Rate by Merchant Category",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation"],
    description: [
      "Razorpay's risk team watches the share of captured payments that turn into disputes, per merchant category — card networks penalise high chargeback ratios.",
      "",
      "For every merchant category with at least one **captured** payment, return `category`, `captured_payments`, `disputed_payments` (captured payments with **at least one** dispute row — a payment that went from chargeback to pre-arbitration still counts **once**) and `dispute_rate_pct` = 100 × disputed / captured, **rounded to 2 decimals**. Categories with no disputes show 0. Any order.",
    ].join("\n"),
    tables: [
      {
        name: "Merchant",
        columns: [
          { name: "merchant_id", type: "int" },
          { name: "business_name", type: "varchar" },
          { name: "category", type: "varchar" },
        ],
        primaryKey: ["merchant_id"],
        note: "One row per merchant.",
      },
      {
        name: "Payment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "merchant_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["captured", "failed"] },
        ],
        primaryKey: ["payment_id"],
        note: "One row per payment.",
      },
      {
        name: "Dispute",
        columns: [
          { name: "dispute_id", type: "int" },
          { name: "payment_id", type: "int" },
          { name: "phase", type: "enum", values: ["chargeback", "pre_arbitration", "arbitration"] },
          { name: "opened_on", type: "date" },
        ],
        primaryKey: ["dispute_id"],
        note: "One row per dispute phase raised on a payment, so a payment can have several rows.",
      },
    ],
    examples: [
      {
        Merchant: [
          [1, "Kirana Kart", "ecommerce"],
          [2, "Urban Threads", "ecommerce"],
          [3, "SkillSprint Academy", "education"],
          [4, "TrekNest", "travel"],
        ],
        Payment: [
          [10, 1, 1200, "captured"],
          [11, 1, 800, "captured"],
          [12, 2, 4500, "captured"],
          [13, 2, 300, "failed"],
          [14, 3, 9999, "captured"],
          [15, 3, 4999, "captured"],
          [16, 4, 15000, "failed"],
        ],
        Dispute: [
          [100, 10, "chargeback", "2025-02-10"],
          [101, 10, "pre_arbitration", "2025-03-05"],
          [102, 12, "chargeback", "2025-02-20"],
        ],
      },
    ],
    gen: (rng) => {
      const m = ri(rng, 1, 6);
      const merchants: Cell[][] = sample(rng, BUSINESSES, m).map((b, i) => [i + 1, b, pick(rng, CATEGORIES.slice(0, 4))]);
      const n = ri(rng, 1, 28);
      const pays: Cell[][] = seq(10, n).map((id) => [id, ri(rng, 1, m), roundTo(rng, 100, 20000, 100), chance(rng, 0.8) ? "captured" : "failed"]);
      const disputes: Cell[][] = [];
      for (const p of pays) {
        if (p[3] !== "captured" || !chance(rng, 0.25)) continue;
        const phases = chance(rng, 0.3) ? ["chargeback", "pre_arbitration"] : ["chargeback"];
        for (const ph of phases) disputes.push([100 + disputes.length, p[0]!, ph, dateBetween(rng, "2025-02-01", "2025-03-31")]);
      }
      return { Merchant: merchants, Payment: pays, Dispute: shuffle(rng, disputes) };
    },
    solution: [
      "SELECT m.category,",
      "       COUNT(DISTINCT p.payment_id) AS captured_payments,",
      "       COUNT(DISTINCT d.payment_id) AS disputed_payments,",
      "       ROUND(100 * COUNT(DISTINCT d.payment_id) / COUNT(DISTINCT p.payment_id), 2) AS dispute_rate_pct",
      "FROM Merchant m",
      "JOIN Payment p ON p.merchant_id = m.merchant_id AND p.status = 'captured'",
      "LEFT JOIN Dispute d ON d.payment_id = p.payment_id",
      "GROUP BY m.category",
    ].join("\n"),
    alternatives: [
      [
        "SELECT category, COUNT(*) AS captured_payments, SUM(disputed) AS disputed_payments,",
        "       ROUND(100 * SUM(disputed) / COUNT(*), 2) AS dispute_rate_pct",
        "FROM (SELECT m.category,",
        "             CASE WHEN EXISTS (SELECT 1 FROM Dispute d WHERE d.payment_id = p.payment_id) THEN 1 ELSE 0 END AS disputed",
        "      FROM Payment p JOIN Merchant m ON m.merchant_id = p.merchant_id",
        "      WHERE p.status = 'captured') t",
        "GROUP BY category",
      ].join("\n"),
    ],
    hints: [
      "Joining disputes multiplies a payment's row by its number of dispute phases — what does that do to a plain `COUNT(*)`?",
      "`COUNT(DISTINCT …)` counts each payment once however many rows it has after the join.",
      "Use a LEFT JOIN to disputes so undisputed payments still count in the denominator.",
    ],
    editorial: [
      "Start from captured payments joined to their merchant's category, then bring in disputes with a **LEFT JOIN** so undisputed payments keep a row (with NULL dispute columns) and still count as captured.",
      "",
      "The trap is fan-out: a payment with a chargeback and a pre-arbitration row appears twice after the join, so `COUNT(*)` would count it twice as captured *and* twice as disputed. `COUNT(DISTINCT p.payment_id)` counts each captured payment once, and `COUNT(DISTINCT d.payment_id)` counts each disputed payment once — NULLs from undisputed payments are ignored by `COUNT`, which is what makes a category with no disputes show 0.",
      "",
      "The alternative avoids the fan-out altogether: it marks every captured payment with `EXISTS` (1 if any dispute row exists) and then simply counts and sums per category. That version is usually the cheaper one with an index on `Dispute(payment_id)`, because each payment is probed once instead of being multiplied and de-duplicated.",
    ].join("\n"),
  },

  {
    slug: "razorpay-webhook-events-that-exhausted-retries",
    title: "Razorpay: Webhook Events That Never Got a 2xx Response",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "Razorpay retries a webhook until the merchant's server answers with a 2xx status. The developer-experience team wants the events that were attempted but **never** acknowledged, to email the merchants whose integration is broken.",
      "",
      "A delivery attempt is acknowledged when `http_status` is **between 200 and 299**; a NULL status is a timeout. Return every event with **at least one** attempt and **no acknowledged attempt**: `event_id`, `event_type`, `attempts` (its number of attempts) and `last_attempt_at` (its latest attempt). Events never attempted are not reported. Any order.",
    ].join("\n"),
    tables: [
      {
        name: "WebhookEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "merchant_id", type: "int" },
          { name: "event_type", type: "varchar" },
          { name: "created_at", type: "datetime" },
        ],
        primaryKey: ["event_id"],
        note: "One row per event Razorpay raised for a merchant, such as `payment.captured`.",
      },
      {
        name: "DeliveryAttempt",
        columns: [
          { name: "attempt_id", type: "int" },
          { name: "event_id", type: "int" },
          { name: "attempted_at", type: "datetime" },
          { name: "http_status", type: "int" },
        ],
        primaryKey: ["attempt_id"],
        note: "One row per POST to the merchant's webhook URL; `http_status` is NULL when the request timed out.",
      },
    ],
    examples: [
      {
        WebhookEvent: [
          [1, 401, "payment.captured", "2025-03-10 10:00:00"],
          [2, 401, "refund.processed", "2025-03-10 10:05:00"],
          [3, 402, "settlement.processed", "2025-03-10 11:00:00"],
          [4, 402, "payment.failed", "2025-03-10 11:30:00"],
          [5, 403, "subscription.charged", "2025-03-10 12:00:00"],
        ],
        DeliveryAttempt: [
          [1, 1, "2025-03-10 10:00:02", 500],
          [2, 1, "2025-03-10 10:05:02", 200],
          [3, 2, "2025-03-10 10:05:03", 502],
          [4, 2, "2025-03-10 10:10:03", null],
          [5, 2, "2025-03-10 10:40:03", 404],
          [6, 3, "2025-03-10 11:00:04", 300],
          [7, 5, "2025-03-10 12:00:01", 204],
        ],
      },
    ],
    gen: (rng) => {
      const e = ri(rng, 1, 8);
      const types = ["payment.captured", "payment.failed", "refund.processed", "settlement.processed", "subscription.charged"];
      const events: Cell[][] = seq(1, e).map((id) => [id, ri(rng, 401, 404), pick(rng, types), at("2025-03-10", 600 + id * 7)]);
      const attempts: Cell[][] = [];
      for (const ev of events) {
        const k = ri(rng, 0, 4);
        for (let j = 0; j < k; j++) {
          attempts.push([attempts.length + 1, ev[0]!, at("2025-03-10", 600 + (ev[0] as number) * 7 + j * 30 + 1), pick(rng, [200, 201, 204, 299, 300, 199, 404, 410, 500, 502, 503, null, null])]);
        }
      }
      return { WebhookEvent: events, DeliveryAttempt: shuffle(rng, attempts) };
    },
    solution: [
      "SELECT e.event_id, e.event_type, COUNT(*) AS attempts, MAX(a.attempted_at) AS last_attempt_at",
      "FROM WebhookEvent e",
      "JOIN DeliveryAttempt a ON a.event_id = e.event_id",
      "GROUP BY e.event_id, e.event_type",
      "HAVING SUM(CASE WHEN a.http_status BETWEEN 200 AND 299 THEN 1 ELSE 0 END) = 0",
    ].join("\n"),
    alternatives: [
      [
        "SELECT e.event_id, e.event_type,",
        "       (SELECT COUNT(*) FROM DeliveryAttempt a WHERE a.event_id = e.event_id) AS attempts,",
        "       (SELECT MAX(a.attempted_at) FROM DeliveryAttempt a WHERE a.event_id = e.event_id) AS last_attempt_at",
        "FROM WebhookEvent e",
        "WHERE EXISTS (SELECT 1 FROM DeliveryAttempt a WHERE a.event_id = e.event_id)",
        "  AND NOT EXISTS (SELECT 1 FROM DeliveryAttempt a WHERE a.event_id = e.event_id AND a.http_status >= 200 AND a.http_status < 300)",
      ].join("\n"),
    ],
    hints: [
      "Group attempts per event and ask a question of the whole group: did any attempt succeed?",
      "A conditional sum of the 2xx attempts is 0 exactly when none succeeded.",
      "A timeout (NULL) is neither between 200 and 299 nor anything else — make sure it counts as a failure, not as an error in your logic.",
    ],
    editorial: [
      "The rule is about all of an event's attempts at once — attempted, and never acknowledged — so group the attempts per event. The inner join with `DeliveryAttempt` already removes events with no attempts, and `COUNT(*)` and `MAX(attempted_at)` give the two reported numbers.",
      "",
      "\"Never acknowledged\" becomes `HAVING SUM(CASE WHEN http_status BETWEEN 200 AND 299 THEN 1 ELSE 0 END) = 0`. Both ends of `BETWEEN` are inclusive, so 200 and 299 succeed while 199 and 300 do not. A timeout has `http_status` NULL; `NULL BETWEEN …` is unknown, so the `CASE` falls to `ELSE 0` and the timeout counts as a failed attempt, as it should. Filtering failures in `WHERE` instead would be wrong — it would report an event that failed once and succeeded on the retry.",
      "",
      "The alternative states the rule with `EXISTS` / `NOT EXISTS` and fetches the count and the latest time with scalar subqueries. With an index on `DeliveryAttempt(event_id)` both read each attempt once.",
    ].join("\n"),
  },

  {
    slug: "razorpay-subscription-cycles-recovered-or-halted",
    title: "Razorpay: Subscription Cycles Recovered by Retry vs Halted",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation", "Conditional Logic"],
    description: [
      "When a subscription's recurring charge fails, Razorpay Subscriptions retries it; if every retry fails, the subscription halts. The billing team wants, per subscription, how its billing cycles ended up.",
      "",
      "Each billing cycle of a subscription is exactly one of: **paid first time** (attempt 1 succeeded), **recovered** (a later attempt succeeded), or **halted** (no attempt succeeded). For every subscription with at least one charge row, return `subscription_id`, `paid_first_time`, `recovered` and `halted` — the number of its cycles of each kind. Any order.",
    ].join("\n"),
    tables: [
      {
        name: "SubscriptionCharge",
        columns: [
          { name: "charge_id", type: "int" },
          { name: "subscription_id", type: "int" },
          { name: "cycle_no", type: "int" },
          { name: "attempt_no", type: "int" },
          { name: "attempted_on", type: "date" },
          { name: "status", type: "enum", values: ["success", "failed"] },
        ],
        primaryKey: ["charge_id"],
        note: "One row per charge attempt on a billing cycle. Attempts of a cycle are numbered from 1; retrying stops at the first success, so a cycle has at most one `success` and it is its last attempt.",
      },
    ],
    examples: [
      {
        SubscriptionCharge: [
          [1, 70, 1, 1, "2025-01-05", "success"],
          [2, 70, 2, 1, "2025-02-05", "failed"],
          [3, 70, 2, 2, "2025-02-06", "success"],
          [4, 70, 3, 1, "2025-03-05", "failed"],
          [5, 70, 3, 2, "2025-03-06", "failed"],
          [6, 70, 3, 3, "2025-03-08", "failed"],
          [7, 71, 1, 1, "2025-02-10", "success"],
          [8, 71, 2, 1, "2025-03-10", "success"],
          [9, 72, 1, 1, "2025-03-01", "failed"],
          [10, 72, 1, 2, "2025-03-02", "failed"],
          [11, 72, 1, 3, "2025-03-04", "success"],
        ],
      },
    ],
    gen: (rng) => {
      const subs = ri(rng, 1, 5);
      const rows: Cell[][] = [];
      for (let s = 0; s < subs; s++) {
        const cycles = ri(rng, 1, 4);
        for (let c = 1; c <= cycles; c++) {
          const kind = pick(rng, ["first", "first", "recovered", "halted"]);
          const fails = kind === "first" ? 0 : kind === "recovered" ? ri(rng, 1, 3) : ri(rng, 1, 4);
          const base = `2025-0${c}-0${ri(rng, 1, 9)}`;
          for (let a = 1; a <= fails; a++) rows.push([0, 70 + s, c, a, addDays(base, a - 1), "failed"]);
          if (kind !== "halted") rows.push([0, 70 + s, c, fails + 1, addDays(base, fails), "success"]);
        }
      }
      shuffle(rng, rows).forEach((r, i) => (r[0] = i + 1));
      return { SubscriptionCharge: rows };
    },
    solution: [
      "SELECT subscription_id,",
      "       SUM(CASE WHEN ok_at = 1 THEN 1 ELSE 0 END) AS paid_first_time,",
      "       SUM(CASE WHEN ok_at > 1 THEN 1 ELSE 0 END) AS recovered,",
      "       SUM(CASE WHEN ok_at IS NULL THEN 1 ELSE 0 END) AS halted",
      "FROM (SELECT subscription_id, cycle_no,",
      "             MIN(CASE WHEN status = 'success' THEN attempt_no END) AS ok_at",
      "      FROM SubscriptionCharge",
      "      GROUP BY subscription_id, cycle_no) c",
      "GROUP BY subscription_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT subscription_id,",
        "       SUM(status = 'success' AND attempt_no = 1) AS paid_first_time,",
        "       SUM(status = 'success' AND attempt_no > 1) AS recovered,",
        "       COUNT(DISTINCT cycle_no) - SUM(status = 'success') AS halted",
        "FROM SubscriptionCharge",
        "GROUP BY subscription_id",
      ].join("\n"),
    ],
    hints: [
      "Classify each cycle first, then count the classes per subscription — two levels of grouping.",
      "For one cycle, the attempt number of its success (or NULL if there is none) is all you need.",
      "`MIN(CASE WHEN status = 'success' THEN attempt_no END)` is NULL when no attempt succeeded.",
    ],
    editorial: [
      "The outcome belongs to a cycle, not to a row, so the query has two levels. The inner query groups by `(subscription_id, cycle_no)` and computes `ok_at`, the attempt number of the successful charge: `MIN(CASE WHEN status = 'success' THEN attempt_no END)` — the `CASE` yields NULL for failed rows, and `MIN` ignores NULLs, so `ok_at` is NULL exactly when the cycle never succeeded.",
      "",
      "The outer query groups those cycle rows by subscription and counts the three classes with conditional sums: `ok_at = 1` is paid first time, `ok_at > 1` recovered, `ok_at IS NULL` halted. Every cycle lands in exactly one bucket, so the three columns add up to the number of cycles.",
      "",
      "The alternative uses the table's guarantee — at most one success per cycle — to do it in one pass: successes on attempt 1 and on later attempts are conditional sums of rows, and halted cycles are the distinct cycles minus the successes. It is shorter but leans on that rule; the two-level version would still be right if a cycle could hold two successes.",
    ].join("\n"),
  },

  {
    slug: "razorpay-leading-card-network-in-each-category",
    title: "Razorpay: Leading Card Network in Each Merchant Category",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Joins", "Aggregation"],
    description: [
      "Razorpay's partnerships team negotiates network incentives per vertical, so they want to know which card network carries the most captured money in each merchant category.",
      "",
      "For every merchant category, return the card network(s) with the **highest total captured amount** in that category: `category`, `card_network` and `captured_amount`. If several networks tie for the top, return **all** of them. Only `captured` payments count, and categories with no captured card payment are not reported. Any order.",
    ].join("\n"),
    tables: [
      {
        name: "Merchant",
        columns: [
          { name: "merchant_id", type: "int" },
          { name: "category", type: "varchar" },
        ],
        primaryKey: ["merchant_id"],
        note: "One row per merchant and its business category.",
      },
      {
        name: "CardPayment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "merchant_id", type: "int" },
          { name: "card_network", type: "varchar" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["captured", "failed"] },
        ],
        primaryKey: ["payment_id"],
        note: "One row per card payment attempt, `amount` in rupees.",
      },
    ],
    examples: [
      {
        Merchant: [
          [1, "travel"],
          [2, "travel"],
          [3, "food"],
          [4, "education"],
        ],
        CardPayment: [
          [10, 1, "Visa", 12000, "captured"],
          [11, 2, "Mastercard", 9000, "captured"],
          [12, 2, "Mastercard", 4000, "captured"],
          [13, 1, "Amex", 30000, "failed"],
          [14, 3, "RuPay", 500, "captured"],
          [15, 3, "Visa", 500, "captured"],
          [16, 4, "Visa", 7000, "failed"],
        ],
      },
    ],
    gen: (rng) => {
      const m = ri(rng, 1, 6);
      const merchants: Cell[][] = seq(1, m).map((id) => [id, pick(rng, CATEGORIES.slice(0, 3))]);
      const n = ri(rng, 1, 25);
      const nets = sample(rng, NETWORKS, 3);
      const rows: Cell[][] = seq(10, n).map((id) => [id, ri(rng, 1, m), pick(rng, nets), roundTo(rng, 500, 3000, 500), chance(rng, 0.8) ? "captured" : "failed"]);
      return { Merchant: merchants, CardPayment: rows };
    },
    solution: [
      "WITH totals AS (",
      "  SELECT m.category, c.card_network, SUM(c.amount) AS captured_amount",
      "  FROM CardPayment c",
      "  JOIN Merchant m ON m.merchant_id = c.merchant_id",
      "  WHERE c.status = 'captured'",
      "  GROUP BY m.category, c.card_network",
      "), ranked AS (",
      "  SELECT category, card_network, captured_amount,",
      "         RANK() OVER (PARTITION BY category ORDER BY captured_amount DESC) AS rnk",
      "  FROM totals",
      ")",
      "SELECT category, card_network, captured_amount FROM ranked WHERE rnk = 1",
    ].join("\n"),
    alternatives: [
      [
        "WITH totals AS (",
        "  SELECT m.category, c.card_network, SUM(c.amount) AS captured_amount",
        "  FROM CardPayment c JOIN Merchant m ON m.merchant_id = c.merchant_id",
        "  WHERE c.status = 'captured' GROUP BY m.category, c.card_network",
        ")",
        "SELECT t.category, t.card_network, t.captured_amount FROM totals t",
        "WHERE NOT EXISTS (SELECT 1 FROM totals u WHERE u.category = t.category AND u.captured_amount > t.captured_amount)",
      ].join("\n"),
      [
        "WITH totals AS (",
        "  SELECT m.category, c.card_network, SUM(c.amount) AS captured_amount",
        "  FROM CardPayment c JOIN Merchant m ON m.merchant_id = c.merchant_id",
        "  WHERE c.status = 'captured' GROUP BY m.category, c.card_network",
        ")",
        "SELECT t.category, t.card_network, t.captured_amount FROM totals t",
        "JOIN (SELECT category, MAX(captured_amount) AS top FROM totals GROUP BY category) b",
        "  ON b.category = t.category AND b.top = t.captured_amount",
      ].join("\n"),
    ],
    hints: [
      "First total the captured amount per (category, network) — the category comes from the merchant.",
      "Then, within each category, keep the network(s) whose total is the largest.",
      "`RANK()` gives tied rows the same rank, so `rank = 1` keeps every tied leader; `ROW_NUMBER()` would keep only one.",
    ],
    editorial: [
      "The question has two steps. First, aggregate: join each card payment to its merchant to learn the category, keep captured payments, and sum the amount per `(category, card_network)`. Second, pick the maximum within each category.",
      "",
      "A window function does the second step neatly: `RANK() OVER (PARTITION BY category ORDER BY captured_amount DESC)` numbers the networks of each category from the largest total down, giving equal totals the same rank. Keeping rank 1 returns every network that ties for the top — the statement asks for all of them, which is why `ROW_NUMBER()` (one arbitrary winner) would be wrong. (The alias avoids `rank`, which is a reserved word in MySQL.)",
      "",
      "The alternatives express \"largest in its category\" without windows: a `NOT EXISTS` that no network in the same category has a larger total, or a join to the per-category `MAX`. All three aggregate once; the ranking or the comparison then runs on the much smaller table of totals.",
    ].join("\n"),
  },

  {
    slug: "razorpay-expense-claims-not-approved-by-manager",
    title: "Razorpay: Expense Claims Not Approved by the Claimant's Manager",
    difficulty: "MEDIUM",
    topics: ["Joins", "Conditional Logic"],
    description: [
      "RazorpayX Payroll pays approved expense reimbursements with the next salary run. The customer's policy is that a claim may be approved only by the claimant's **direct manager**; the internal auditor wants every approved claim that broke the rule before the run is paid.",
      "",
      "Return each `approved` claim whose `decided_by` is **not** the claimant's `manager_id` — that includes a claim the claimant approved themselves, one approved by a manager further up, and **every** approved claim of an employee with no manager on file (`manager_id` NULL). Pending and rejected claims are ignored.",
      "",
      "Return `claim_id`, `employee_name` (the claimant), `manager_name` (their direct manager, NULL when they have none), `approver_name` and `amount`, ordered by `claim_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Employee",
        columns: [
          { name: "employee_id", type: "int" },
          { name: "full_name", type: "varchar" },
          { name: "manager_id", type: "int" },
        ],
        primaryKey: ["employee_id"],
        note: "One row per employee on the customer's payroll. `manager_id` is the `employee_id` of their direct manager, NULL at the top of the org chart.",
      },
      {
        name: "Claim",
        columns: [
          { name: "claim_id", type: "int" },
          { name: "employee_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["pending", "approved", "rejected"] },
          { name: "decided_by", type: "int" },
        ],
        primaryKey: ["claim_id"],
        note: "One row per reimbursement claim, `amount` in rupees. `decided_by` is the `employee_id` who approved or rejected it, NULL while it is pending.",
      },
    ],
    examples: [
      {
        Employee: [
          [1, "Meera Iyer", null],
          [2, "Rahul Verma", 1],
          [3, "Ananya Nair", 1],
          [4, "Kabir Khan", 2],
          [5, "Sneha Rao", 2],
          [6, "Dev Joshi", 3],
        ],
        Claim: [
          [101, 4, 2400, "approved", 2],
          [102, 5, 1800, "approved", 1],
          [103, 6, 5200, "approved", 6],
          [104, 2, 900, "approved", 1],
          [105, 1, 15000, "approved", 2],
          [106, 3, 3000, "rejected", 2],
          [107, 4, 700, "pending", null],
          [108, 6, 1200, "approved", 3],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 9);
      const first = names(rng, n);
      const emps: Cell[][] = seq(1, n).map((id, i) => {
        const mgr = id === 1 || chance(rng, 0.1) ? null : ri(rng, 1, id - 1);
        return [id, `${first[i]} ${pick(rng, ["Sharma", "Iyer", "Nair", "Reddy", "Khan", "Gupta", "Das", "Menon"])}`, mgr];
      });
      const claims: Cell[][] = seq(1, ri(rng, 0, 14)).map((k) => {
        const e = emps[ri(rng, 0, n - 1)]!;
        const status = pick(rng, ["approved", "approved", "approved", "rejected", "pending"]);
        const mgr = e[2] as number | null;
        const r = rng();
        const by = status === "pending" ? null : mgr !== null && r < 0.5 ? mgr : r < 0.7 ? (e[0] as number) : ri(rng, 1, n);
        return [100 + k, e[0], roundTo(rng, 200, 20000, 100), status, by];
      });
      return { Employee: emps, Claim: shuffle(rng, claims) };
    },
    solution: [
      "SELECT c.claim_id, e.full_name AS employee_name, m.full_name AS manager_name,",
      "       a.full_name AS approver_name, c.amount",
      "FROM Claim c",
      "JOIN Employee e ON e.employee_id = c.employee_id",
      "LEFT JOIN Employee m ON m.employee_id = e.manager_id",
      "JOIN Employee a ON a.employee_id = c.decided_by",
      "WHERE c.status = 'approved'",
      "  AND (e.manager_id IS NULL OR c.decided_by <> e.manager_id)",
      "ORDER BY c.claim_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT c.claim_id, e.full_name AS employee_name,",
        "       (SELECT m.full_name FROM Employee m WHERE m.employee_id = e.manager_id) AS manager_name,",
        "       (SELECT a.full_name FROM Employee a WHERE a.employee_id = c.decided_by) AS approver_name,",
        "       c.amount",
        "FROM Claim c",
        "JOIN Employee e ON e.employee_id = c.employee_id",
        "WHERE c.status = 'approved' AND NOT (c.decided_by <=> e.manager_id)",
        "ORDER BY c.claim_id",
      ].join("\n"),
      [
        "SELECT c.claim_id, e.full_name AS employee_name, m.full_name AS manager_name,",
        "       a.full_name AS approver_name, c.amount",
        "FROM Claim c",
        "JOIN Employee e ON e.employee_id = c.employee_id",
        "JOIN Employee a ON a.employee_id = c.decided_by",
        "LEFT JOIN Employee m ON m.employee_id = e.manager_id",
        "WHERE c.status = 'approved'",
        "  AND NOT EXISTS (SELECT 1 FROM Employee x WHERE x.employee_id = c.employee_id AND x.manager_id = c.decided_by)",
        "ORDER BY c.claim_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The claimant, their manager and the approver are all rows of `Employee` — join the table to itself under three aliases.",
      "The manager join must be a LEFT JOIN, or claims of employees with no manager disappear.",
      "`decided_by <> manager_id` is NULL, not true, when `manager_id` is NULL — test that case explicitly (or use `<=>`).",
    ],
    editorial: [
      "The rule compares two people who are both rows of `Employee`: the claimant's direct manager and the approver. So the table is joined to itself — once as the claimant `e` (from the claim's `employee_id`), once as the manager `m` (from `e.manager_id`) and once as the approver `a` (from `decided_by`). Only approved claims are checked, and they always have a `decided_by`, so the approver join can be inner.",
      "",
      "The manager join must be a **LEFT JOIN**: the person at the top of the org chart has no manager, and an inner join would drop their claims — exactly the ones the policy cannot allow. The comparison has the same NULL trap: `decided_by <> manager_id` is unknown when `manager_id` is NULL, and `WHERE` drops unknown rows, so the condition adds `e.manager_id IS NULL OR …`. Self-approval (Dev Joshi's claim 103) and skip-level approval (claim 102, approved by the CFO) both fail the equality and are reported.",
      "",
      "The first alternative uses MySQL's NULL-safe `<=>`, which is true only for equal values, so `NOT (decided_by <=> manager_id)` is true for a NULL manager, and reads the two names with scalar subqueries. The second states the rule as an anti join: report the claim unless the claimant's row names the approver as manager. All three do one primary-key lookup per joined row.",
    ].join("\n"),
  },

  {
    slug: "razorpay-upi-ticket-size-bands",
    title: "Razorpay: UPI Ticket Sizes in ₹1,000 Bands, Empty Bands Included",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Joins", "Subqueries"],
    description: [
      "Razorpay's risk team sizes UPI traffic before tuning fraud rules: how many captured UPI payments fall in each ₹1,000 band of amount. A chart with a missing bar is misleading, so **every band is shown**, including those with no payments.",
      "",
      "Consider only payments with `method = 'upi'` and `status = 'captured'`. A band covers `band_start <= amount < band_end`, with `band_end = band_start + 1000`; bands start at 0 and go up to the band holding the **largest** such amount. For each band return `band_start`, `band_end`, `payments` (how many fall in it, 0 for an empty band) and `total_amount` (their sum, 0 for an empty band), ordered by `band_start`. If there is no captured UPI payment, return no rows.",
    ].join("\n"),
    tables: [
      {
        name: "Payment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "merchant_id", type: "int" },
          { name: "method", type: "enum", values: ["upi", "card", "netbanking", "wallet"] },
          { name: "amount", type: "decimal" },
          { name: "status", type: "enum", values: ["captured", "failed"] },
        ],
        primaryKey: ["payment_id"],
        note: "One row per payment, `amount` in rupees. A UPI payment is below ₹1,00,000, the UPI per-transaction limit.",
      },
    ],
    examples: [
      {
        Payment: [
          [1, 11, "upi", 250.0, "captured"],
          [2, 11, "upi", 999.5, "captured"],
          [3, 12, "upi", 1000.0, "captured"],
          [4, 12, "upi", 4200.0, "captured"],
          [5, 13, "card", 2500.0, "captured"],
          [6, 13, "upi", 3100.0, "failed"],
          [7, 11, "upi", 1450.5, "captured"],
          [8, 14, "upi", 6000.0, "failed"],
          [9, 14, "netbanking", 9000.0, "captured"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 0, 20);
      const top = pick(rng, [2000, 5000, 9000, 15000]);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const r = rng();
        const amount = r < 0.2 ? roundTo(rng, 0, top, 1000) || 1000 : r < 0.3 ? roundTo(rng, 1000, top, 1000) - 0.5 : roundTo(rng, 50, top, 50) + (chance(rng, 0.3) ? 0.5 : 0);
        const method = chance(rng, 0.7) ? "upi" : pick(rng, ["card", "netbanking", "wallet"]);
        return [id, ri(rng, 11, 15), method, amount, chance(rng, 0.75) ? "captured" : "failed"];
      });
      return { Payment: rows };
    },
    solution: [
      "WITH RECURSIVE ok AS (",
      "  SELECT amount FROM Payment WHERE method = 'upi' AND status = 'captured'",
      "), bands AS (",
      "  SELECT 0 AS band_start FROM (SELECT MAX(amount) AS top FROM ok) t WHERE t.top IS NOT NULL",
      "  UNION ALL",
      "  SELECT band_start + 1000 FROM bands",
      "  WHERE band_start + 1000 <= (SELECT MAX(amount) FROM ok)",
      ")",
      "SELECT b.band_start, b.band_start + 1000 AS band_end,",
      "       COUNT(o.amount) AS payments, COALESCE(SUM(o.amount), 0) AS total_amount",
      "FROM bands b",
      "LEFT JOIN ok o ON o.amount >= b.band_start AND o.amount < b.band_start + 1000",
      "GROUP BY b.band_start",
      "ORDER BY b.band_start",
    ].join("\n"),
    alternatives: [
      [
        "WITH ok AS (",
        "  SELECT amount FROM Payment WHERE method = 'upi' AND status = 'captured'",
        "), digits AS (",
        "  SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4",
        "  UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9",
        "), n AS (",
        "  SELECT t.d * 10 + u.d AS k FROM digits t CROSS JOIN digits u",
        "), counted AS (",
        "  SELECT FLOOR(amount / 1000) AS k, COUNT(*) AS payments, SUM(amount) AS total_amount",
        "  FROM ok GROUP BY FLOOR(amount / 1000)",
        ")",
        "SELECT n.k * 1000 AS band_start, n.k * 1000 + 1000 AS band_end,",
        "       COALESCE(c.payments, 0) AS payments, COALESCE(c.total_amount, 0) AS total_amount",
        "FROM n",
        "LEFT JOIN counted c ON c.k = n.k",
        "WHERE n.k <= (SELECT FLOOR(MAX(amount) / 1000) FROM ok)",
        "ORDER BY band_start",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "A `GROUP BY` over the payments can only produce bands that have a payment — the empty bands have to come from somewhere else.",
      "Generate the band starts 0, 1000, 2000, … up to the largest amount, with a recursive CTE or a small numbers table.",
      "LEFT JOIN the payments to the bands on `amount >= band_start AND amount < band_start + 1000`, and count a payment column, not `*`.",
      "Filter method and status before the join, or the largest amount may come from a failed or card payment.",
    ],
    editorial: [
      "A histogram is a `GROUP BY` on the band, but grouping can only report bands that contain a row, and the chart needs the empty ones too. So the bands are generated first and the payments are joined onto them — a zero-filled histogram.",
      "",
      "The recursive CTE starts at 0 and adds 1,000 while the next start is still at or below the largest captured UPI amount, so the last band is the one holding the maximum (`9000.00` would start band 9000; `8999.50` stays in band 8000). Its anchor selects 0 only when `MAX(amount)` over the qualifying payments is not NULL, so it yields nothing when there are no qualifying payments, so the answer is empty rather than one empty band. The method and status filters live in `ok`, before both the maximum and the join — a failed ₹6,000 payment must not stretch the axis.",
      "",
      "The LEFT JOIN keeps every band; `COUNT(o.amount)` counts only matched payments, so an empty band gets 0, and `COALESCE(SUM(…), 0)` turns its NULL sum into 0. The half-open test `>= band_start AND < band_end` puts ₹1,000.00 in the 1000 band and ₹999.50 in the 0 band.",
      "",
      "The alternative uses the ₹1,00,000 UPI limit: at most 100 bands, so a digits × digits cross join is a big enough numbers table. It groups the payments by `FLOOR(amount / 1000)` once and LEFT JOINs those counts to the band numbers up to the largest one. Both read the payments once; the band list is tiny.",
    ].join("\n"),
  },

  {
    slug: "razorpay-settlements-that-dont-reconcile",
    title: "Razorpay: Settlements That Don't Match Their Line Items",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "The reconciliation team at Razorpay checks that every settlement credited to a merchant equals what its line items add up to: payments, minus refunds, minus gateway fees, minus tax on fees.",
      "",
      "For each settlement, `expected_amount` = sum of `payment` lines − sum of `refund`, `fee` and `tax` lines (a settlement with **no lines** expects 0). Return the settlements whose `amount` **differs** from that: `settlement_id`, `merchant_id`, `expected_amount`, `settled_amount` (the settlement's `amount`) and `difference` = settled − expected. Any order.",
    ].join("\n"),
    tables: [
      {
        name: "Settlement",
        columns: [
          { name: "settlement_id", type: "int" },
          { name: "merchant_id", type: "int" },
          { name: "settled_on", type: "date" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["settlement_id"],
        note: "One row per bank credit made to a merchant.",
      },
      {
        name: "SettlementLine",
        columns: [
          { name: "line_id", type: "int" },
          { name: "settlement_id", type: "int" },
          { name: "line_type", type: "enum", values: ["payment", "refund", "fee", "tax"] },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["line_id"],
        note: "The entries a settlement is made of. `amount` is always positive; `line_type` says whether it adds or deducts.",
      },
    ],
    examples: [
      {
        Settlement: [
          [1, 601, "2025-03-04", 9620],
          [2, 601, "2025-03-05", 4000],
          [3, 602, "2025-03-05", 2950],
          [4, 603, "2025-03-06", 0],
          [5, 603, "2025-03-07", 1500],
        ],
        SettlementLine: [
          [1, 1, "payment", 10000],
          [2, 1, "fee", 200],
          [3, 1, "tax", 36],
          [4, 1, "refund", 144],
          [5, 2, "payment", 4100],
          [6, 2, "fee", 82],
          [7, 3, "payment", 3000],
          [8, 3, "fee", 50],
        ],
      },
    ],
    gen: (rng) => {
      const s = ri(rng, 1, 8);
      const lines: Cell[][] = [];
      const sets: Cell[][] = seq(1, s).map((id) => {
        let expected = 0;
        if (!chance(rng, 0.15)) {
          const k = ri(rng, 1, 4);
          for (let j = 0; j < k; j++) {
            const t = j === 0 ? "payment" : pick(rng, ["payment", "refund", "fee", "tax"]);
            const amt = t === "payment" ? roundTo(rng, 500, 10000, 50) : roundTo(rng, 10, 400, 2);
            expected += t === "payment" ? amt : -amt;
            lines.push([lines.length + 1, id, t, amt]);
          }
        }
        const amount = chance(rng, 0.55) ? expected : expected + pick(rng, [-100, -2, 2, 50, 300]);
        return [id, ri(rng, 601, 604), dateBetween(rng, "2025-03-01", "2025-03-10"), amount];
      });
      return { Settlement: sets, SettlementLine: shuffle(rng, lines) };
    },
    solution: [
      "SELECT s.settlement_id, s.merchant_id,",
      "       COALESCE(SUM(CASE WHEN l.line_type = 'payment' THEN l.amount ELSE -l.amount END), 0) AS expected_amount,",
      "       s.amount AS settled_amount,",
      "       s.amount - COALESCE(SUM(CASE WHEN l.line_type = 'payment' THEN l.amount ELSE -l.amount END), 0) AS difference",
      "FROM Settlement s",
      "LEFT JOIN SettlementLine l ON l.settlement_id = s.settlement_id",
      "GROUP BY s.settlement_id, s.merchant_id, s.amount",
      "HAVING s.amount <> COALESCE(SUM(CASE WHEN l.line_type = 'payment' THEN l.amount ELSE -l.amount END), 0)",
    ].join("\n"),
    alternatives: [
      [
        "SELECT settlement_id, merchant_id, expected_amount, settled_amount, settled_amount - expected_amount AS difference",
        "FROM (SELECT s.settlement_id, s.merchant_id, s.amount AS settled_amount,",
        "             (SELECT IFNULL(SUM(IF(l.line_type = 'payment', l.amount, 0)), 0) - IFNULL(SUM(IF(l.line_type <> 'payment', l.amount, 0)), 0)",
        "              FROM SettlementLine l WHERE l.settlement_id = s.settlement_id) AS expected_amount",
        "      FROM Settlement s) t",
        "WHERE settled_amount <> expected_amount",
      ].join("\n"),
    ],
    hints: [
      "Give every line a sign: payments add, everything else deducts.",
      "A settlement with no lines must still be checked — which join keeps it, and what does `SUM` return for it?",
      "Compare the settlement's amount with the signed sum in `HAVING`, after grouping.",
    ],
    editorial: [
      "Each settlement's expected amount is a signed sum of its lines, so join the lines and group by settlement. A `CASE` gives each line its sign — `payment` lines count positive, `refund`, `fee` and `tax` lines negative — and `SUM` adds them up.",
      "",
      "A settlement with no lines is still a bank credit that must be explained; the **LEFT JOIN** keeps it as one row with NULL line columns. `SUM` over only NULLs is NULL, so `COALESCE(…, 0)` makes its expected amount 0 — and a non-zero credit with nothing behind it is reported, while a zero one is not. The settlement's own `amount` is in the `GROUP BY`, so it can be selected and compared in `HAVING`.",
      "",
      "The alternative computes the expected amount with a correlated scalar subquery per settlement (payments minus deductions, each `IFNULL`-ed) and filters in an outer query, which avoids repeating the expression three times. Both read every line once with an index on `SettlementLine(settlement_id)`.",
    ].join("\n"),
  },

  {
    slug: "razorpay-mdr-pricing-changes-between-snapshots",
    title: "Razorpay: MDR Pricing Rows Added, Removed or Changed Between Snapshots",
    difficulty: "MEDIUM",
    topics: ["Joins", "Subqueries", "Conditional Logic"],
    description: [
      "Razorpay keeps a month-end snapshot of every merchant's negotiated MDR (merchant discount rate) per payment method. Before April's invoices go out, the billing team diffs the **2025-03-31** snapshot against the **2025-04-30** one to see exactly what pricing moved.",
      "",
      "A row is identified by (`merchant_id`, `method`). Report every row that differs between the two snapshots:",
      "",
      "- `added` — in 2025-04-30 but not in 2025-03-31;",
      "- `removed` — in 2025-03-31 but not in 2025-04-30;",
      "- `changed` — in both with a different `mdr_bps`.",
      "",
      "Rows that are identical in both are left out, and snapshots on other dates are ignored. Return `merchant_id`, `method`, `old_mdr_bps` (NULL for an added row), `new_mdr_bps` (NULL for a removed row) and `change_type`, ordered by `merchant_id`, then `method`.",
    ].join("\n"),
    tables: [
      {
        name: "PricingSnapshot",
        columns: [
          { name: "snapshot_date", type: "date" },
          { name: "merchant_id", type: "int" },
          { name: "method", type: "varchar" },
          { name: "mdr_bps", type: "int" },
        ],
        primaryKey: ["snapshot_date", "merchant_id", "method"],
        note: "One row per merchant and enabled method in each month-end snapshot. `mdr_bps` is the fee in basis points of the payment amount (190 = 1.90%); 0 is valid (UPI is often zero-MDR).",
      },
    ],
    examples: [
      {
        PricingSnapshot: [
          ["2025-02-28", 2, "emi", 300],
          ["2025-03-31", 1, "card", 200],
          ["2025-03-31", 1, "upi", 0],
          ["2025-03-31", 2, "card", 190],
          ["2025-03-31", 2, "netbanking", 190],
          ["2025-03-31", 3, "wallet", 220],
          ["2025-04-30", 1, "card", 180],
          ["2025-04-30", 1, "emi", 250],
          ["2025-04-30", 1, "upi", 0],
          ["2025-04-30", 2, "card", 190],
          ["2025-04-30", 3, "wallet", 220],
          ["2025-04-30", 4, "upi", 0],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const fee = () => pick(rng, [0, 0, 150, 175, 190, 200, 220, 250]);
      for (let m = 1, ms = ri(rng, 0, 5); m <= ms; m++) {
        for (const method of sample(rng, METHODS, ri(rng, 0, 4))) {
          const r = rng();
          const old = fee();
          if (r < 0.15) {
            rows.push(["2025-04-30", m, method, fee()]);
          } else if (r < 0.3) {
            rows.push(["2025-03-31", m, method, old]);
          } else {
            rows.push(["2025-03-31", m, method, old]);
            rows.push(["2025-04-30", m, method, chance(rng, 0.4) ? fee() : old]);
          }
          if (chance(rng, 0.15)) rows.push([pick(rng, ["2025-02-28", "2025-05-31"]), m, method, fee()]);
        }
      }
      return { PricingSnapshot: shuffle(rng, rows) };
    },
    solution: [
      "SELECT n.merchant_id, n.method, NULL AS old_mdr_bps, n.mdr_bps AS new_mdr_bps, 'added' AS change_type",
      "FROM PricingSnapshot n",
      "WHERE n.snapshot_date = '2025-04-30'",
      "  AND NOT EXISTS (SELECT 1 FROM PricingSnapshot o WHERE o.snapshot_date = '2025-03-31'",
      "                  AND o.merchant_id = n.merchant_id AND o.method = n.method)",
      "UNION ALL",
      "SELECT o.merchant_id, o.method, o.mdr_bps, NULL, 'removed'",
      "FROM PricingSnapshot o",
      "WHERE o.snapshot_date = '2025-03-31'",
      "  AND NOT EXISTS (SELECT 1 FROM PricingSnapshot n WHERE n.snapshot_date = '2025-04-30'",
      "                  AND n.merchant_id = o.merchant_id AND n.method = o.method)",
      "UNION ALL",
      "SELECT o.merchant_id, o.method, o.mdr_bps, n.mdr_bps, 'changed'",
      "FROM PricingSnapshot o",
      "JOIN PricingSnapshot n ON n.merchant_id = o.merchant_id AND n.method = o.method",
      " AND n.snapshot_date = '2025-04-30'",
      "WHERE o.snapshot_date = '2025-03-31' AND o.mdr_bps <> n.mdr_bps",
      "ORDER BY merchant_id, method",
    ].join("\n"),
    alternatives: [
      [
        "SELECT merchant_id, method, old_mdr_bps, new_mdr_bps,",
        "       CASE WHEN old_mdr_bps IS NULL THEN 'added' WHEN new_mdr_bps IS NULL THEN 'removed' ELSE 'changed' END AS change_type",
        "FROM (",
        "  SELECT merchant_id, method,",
        "         MAX(CASE WHEN snapshot_date = '2025-03-31' THEN mdr_bps END) AS old_mdr_bps,",
        "         MAX(CASE WHEN snapshot_date = '2025-04-30' THEN mdr_bps END) AS new_mdr_bps",
        "  FROM PricingSnapshot",
        "  WHERE snapshot_date IN ('2025-03-31', '2025-04-30')",
        "  GROUP BY merchant_id, method",
        ") d",
        "WHERE NOT (old_mdr_bps <=> new_mdr_bps)",
        "ORDER BY merchant_id, method",
      ].join("\n"),
      [
        "WITH k AS (",
        "  SELECT merchant_id, method FROM PricingSnapshot WHERE snapshot_date = '2025-03-31'",
        "  UNION",
        "  SELECT merchant_id, method FROM PricingSnapshot WHERE snapshot_date = '2025-04-30'",
        ")",
        "SELECT k.merchant_id, k.method, o.mdr_bps AS old_mdr_bps, n.mdr_bps AS new_mdr_bps,",
        "       IF(o.mdr_bps IS NULL, 'added', IF(n.mdr_bps IS NULL, 'removed', 'changed')) AS change_type",
        "FROM k",
        "LEFT JOIN PricingSnapshot o ON o.merchant_id = k.merchant_id AND o.method = k.method AND o.snapshot_date = '2025-03-31'",
        "LEFT JOIN PricingSnapshot n ON n.merchant_id = k.merchant_id AND n.method = k.method AND n.snapshot_date = '2025-04-30'",
        "WHERE o.mdr_bps IS NULL OR n.mdr_bps IS NULL OR o.mdr_bps <> n.mdr_bps",
        "ORDER BY k.merchant_id, k.method",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Treat the two dates as two separate tables, old and new, keyed by (merchant, method).",
      "Added rows are new rows with no old partner, removed rows the reverse — each an anti join. Changed rows are an inner join with different fees.",
      "Stack the three cases with `UNION ALL`; or pivot both dates into two columns per key and classify with `CASE`.",
      "A fee of 0 is a real value — make sure \"missing\" is decided by the row's existence, not by the fee being falsy.",
    ],
    editorial: [
      "Diffing two versions of a table is a full outer join on the key: line up the old and new rows for each (merchant, method), then classify. MySQL has no `FULL OUTER JOIN`, so the main query writes the three outcomes separately. `added` is an anti join (a 2025-04-30 row with no 2025-03-31 row for the same key), `removed` the mirror image, and `changed` an inner join of the two snapshots on the key where `mdr_bps` differs. Identical rows match the inner join but fail `<>`, so they drop out. `UNION ALL` is safe because the three sets cannot overlap.",
      "",
      "Every condition names its snapshot date, so the February and May snapshots never take part — merchant 2's February EMI row is not reported as removed. A zero fee is an ordinary value: the existence of the row, not the fee, decides added or removed, which is why merchant 1's UPI row at 0 bps in both snapshots is simply unchanged.",
      "",
      "The first alternative pivots: grouping by key with `MAX(CASE WHEN snapshot_date = … THEN mdr_bps END)` gives the old and new fee side by side, NULL where a snapshot lacks the row, and `NOT (old <=> new)` keeps only differences (NULL-safe, so added and removed rows survive). The second builds the key list with `UNION` and LEFT JOINs each snapshot to it. All three read the two snapshots a small, fixed number of times; with the primary key starting at `snapshot_date`, each lookup is an index probe.",
    ].join("\n"),
  },

  {
    slug: "razorpay-bank-credits-matching-no-settlement",
    title: "Razorpay: Bank Credits That Match No Settlement",
    difficulty: "MEDIUM",
    topics: ["Strings", "Joins"],
    description: [
      "A merchant's finance team reconciles their bank statement against Razorpay settlements. Every Razorpay credit carries a narration like `RAZORPAY/setl_40211/UTR/AXN5039921`: the settlement id sits between the first and second `/`.",
      "",
      "Among statement lines whose narration **starts with `RAZORPAY/`** (lines from other senders, including `RAZORPAYX/…` payouts, are ignored), return those whose settlement id has **no row** in `Settlement` or whose credited amount **differs** from the settlement's amount: `line_id`, `settlement_ref` (the extracted id), `credited_amount` (the line's `amount`) and `expected_amount` (the settlement's amount, NULL when there is none). Any order.",
    ].join("\n"),
    tables: [
      {
        name: "Settlement",
        columns: [
          { name: "settlement_id", type: "varchar" },
          { name: "merchant_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "utr", type: "varchar" },
        ],
        primaryKey: ["settlement_id"],
        note: "Settlements Razorpay reports for the merchant; ids look like `setl_40211`.",
      },
      {
        name: "BankStatementLine",
        columns: [
          { name: "line_id", type: "int" },
          { name: "credited_on", type: "date" },
          { name: "narration", type: "varchar" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["line_id"],
        note: "One row per credit on the merchant's bank statement. A Razorpay credit's narration is `RAZORPAY/<settlement id>/UTR/<utr>`.",
      },
    ],
    examples: [
      {
        Settlement: [
          ["setl_40211", 701, 18450, "AXN5039921"],
          ["setl_40212", 701, 9200, "AXN5039958"],
          ["setl_40230", 701, 5000, "AXN5040102"],
        ],
        BankStatementLine: [
          [1, "2025-03-03", "RAZORPAY/setl_40211/UTR/AXN5039921", 18450],
          [2, "2025-03-04", "RAZORPAY/setl_40212/UTR/AXN5039958", 9020],
          [3, "2025-03-04", "NEFT/ACME TRADERS/INV-2231", 12000],
          [4, "2025-03-05", "RAZORPAY/setl_40299/UTR/AXN5040377", 7600],
          [5, "2025-03-05", "RAZORPAYX/pout_88120/REVERSAL", 2500],
          [6, "2025-03-06", "RAZORPAY/setl_40230/UTR/AXN5040102", 5000],
        ],
      },
    ],
    gen: (rng) => {
      const s = ri(rng, 1, 7);
      const ids = sample(rng, seq(40200, 60), s).map((x) => `setl_${x}`);
      const sets: Cell[][] = ids.map((id) => [id, 701, roundTo(rng, 1000, 30000, 10), `AXN${ri(rng, 5000000, 5999999)}`]);
      const lines: Cell[][] = [];
      for (const st of sets) {
        if (chance(rng, 0.15)) continue;
        const amt = chance(rng, 0.65) ? (st[2] as number) : (st[2] as number) + pick(rng, [-180, -10, 10, 90]);
        lines.push([0, dateBetween(rng, "2025-03-01", "2025-03-10"), `RAZORPAY/${st[0]}/UTR/${st[3]}`, amt]);
      }
      for (let k = ri(rng, 0, 4); k > 0; k--) {
        lines.push([
          0,
          dateBetween(rng, "2025-03-01", "2025-03-10"),
          pick(rng, [`RAZORPAY/setl_${ri(rng, 40300, 40399)}/UTR/AXN${ri(rng, 6000000, 6999999)}`, `NEFT/ACME TRADERS/INV-${ri(rng, 1000, 9999)}`, `RAZORPAYX/pout_${ri(rng, 80000, 89999)}/REVERSAL`, `IMPS/REFUND/${ri(rng, 100, 999)}`]),
          roundTo(rng, 500, 20000, 10),
        ]);
      }
      shuffle(rng, lines).forEach((r, i) => (r[0] = i + 1));
      return { Settlement: sets, BankStatementLine: lines };
    },
    solution: [
      "WITH rz AS (",
      "  SELECT line_id, SUBSTRING_INDEX(SUBSTRING_INDEX(narration, '/', 2), '/', -1) AS settlement_ref, amount",
      "  FROM BankStatementLine",
      "  WHERE narration LIKE 'RAZORPAY/%'",
      ")",
      "SELECT rz.line_id, rz.settlement_ref, rz.amount AS credited_amount, s.amount AS expected_amount",
      "FROM rz",
      "LEFT JOIN Settlement s ON s.settlement_id = rz.settlement_ref",
      "WHERE s.settlement_id IS NULL OR s.amount <> rz.amount",
    ].join("\n"),
    alternatives: [
      [
        "SELECT line_id, settlement_ref, credited_amount,",
        "       (SELECT s.amount FROM Settlement s WHERE s.settlement_id = t.settlement_ref) AS expected_amount",
        "FROM (SELECT line_id, SUBSTRING(narration, 10, LOCATE('/UTR/', narration) - 10) AS settlement_ref, amount AS credited_amount",
        "      FROM BankStatementLine WHERE LEFT(narration, 9) = 'RAZORPAY/') t",
        "WHERE NOT EXISTS (SELECT 1 FROM Settlement s WHERE s.settlement_id = t.settlement_ref AND s.amount = t.credited_amount)",
      ].join("\n"),
    ],
    hints: [
      "`SUBSTRING_INDEX(str, '/', 2)` keeps everything before the second `/`; a second `SUBSTRING_INDEX(…, '/', -1)` keeps what follows the last `/` of that.",
      "`LIKE 'RAZORPAY/%'` includes the slash, so `RAZORPAYX/…` does not match.",
      "A LEFT JOIN to `Settlement` gives NULL for an unknown id — report that row too.",
    ],
    editorial: [
      "Two steps: parse, then reconcile. The narration has a fixed shape, so the settlement id is the second `/`-separated field. `SUBSTRING_INDEX(narration, '/', 2)` returns `RAZORPAY/setl_40211`, and `SUBSTRING_INDEX(…, '/', -1)` keeps the part after its last slash, `setl_40211`. The prefix test `LIKE 'RAZORPAY/%'` includes the slash on purpose, so RazorpayX payout reversals (`RAZORPAYX/…`) and other senders are not mistaken for settlements.",
      "",
      "Then **LEFT JOIN** the parsed lines to `Settlement`. A line whose id is unknown gets NULL settlement columns and is reported with a NULL `expected_amount`; a line that matched is reported only when the amounts differ. Note that `s.amount <> rz.amount` alone would miss the unknown ids, because a comparison with NULL is never true — the `IS NULL` branch is needed.",
      "",
      "The alternative cuts the id with `SUBSTRING` and `LOCATE('/UTR/')`, and states the rule as \"no settlement with this id *and* this amount\" using `NOT EXISTS`, looking the expected amount up with a scalar subquery. Both scan the statement once and probe `Settlement` through its primary key.",
    ].join("\n"),
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "razorpay-settlements-credited-after-t-plus-n",
    title: "Razorpay: Payments Settled After Their T+N Working Day",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Subqueries"],
    description: [
      "Razorpay settles a captured payment on a merchant's **T+N** cycle: N **working days** after the capture date, where only days listed in the bank calendar count. The settlements ops team wants the payments that missed their date.",
      "",
      "A payment's `due_on` is the **N-th working day strictly after** `captured_on`, with N = the merchant's `settlement_cycle` (so T+1 is the first working day after capture). Report every payment that was settled **later than** `due_on`, or is still unsettled (`settled_on` NULL) with `due_on` **before 2025-03-31**. Return `payment_id`, `merchant_id`, `captured_on`, `due_on` and `settled_on`, ordered by `due_on`, then `payment_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Merchant",
        columns: [
          { name: "merchant_id", type: "int" },
          { name: "business_name", type: "varchar" },
          { name: "settlement_cycle", type: "int" },
        ],
        primaryKey: ["merchant_id"],
        note: "`settlement_cycle` is N in T+N (1, 2 or 3).",
      },
      {
        name: "Payment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "merchant_id", type: "int" },
          { name: "captured_on", type: "date" },
          { name: "settled_on", type: "date" },
        ],
        primaryKey: ["payment_id"],
        note: "Captured payments; `settled_on` is NULL until the money reaches the merchant.",
      },
      {
        name: "WorkingDay",
        columns: [{ name: "work_date", type: "date" }],
        primaryKey: ["work_date"],
        note: "Every bank working day of the period, which always extends well past the last capture; weekends and bank holidays are absent.",
      },
    ],
    examples: [
      {
        Merchant: [
          [1, "Kirana Kart", 1],
          [2, "TrekNest", 2],
          [3, "BookNook", 3],
        ],
        Payment: [
          [10, 1, "2025-03-06", "2025-03-07"],
          [11, 1, "2025-03-07", "2025-03-11"],
          [12, 2, "2025-03-07", "2025-03-12"],
          [13, 2, "2025-03-12", "2025-03-17"],
          [14, 3, "2025-03-13", null],
          [15, 1, "2025-03-28", null],
        ],
        WorkingDay: [
          ["2025-03-06"], ["2025-03-07"], ["2025-03-10"], ["2025-03-11"], ["2025-03-12"],
          ["2025-03-13"], ["2025-03-17"], ["2025-03-18"], ["2025-03-19"], ["2025-03-20"],
          ["2025-03-21"], ["2025-03-24"], ["2025-03-25"], ["2025-03-26"], ["2025-03-27"],
          ["2025-03-28"], ["2025-04-01"], ["2025-04-02"], ["2025-04-03"],
        ],
      },
    ],
    gen: (rng) => {
      const m = ri(rng, 1, 4);
      const merchants: Cell[][] = sample(rng, BUSINESSES, m).map((b, i) => [i + 1, b, ri(rng, 1, 3)]);
      const holidays = new Set(sample(rng, ["2025-03-14", "2025-03-31", "2025-03-18", "2025-04-01", "2025-03-25", "2025-03-10"], ri(rng, 0, 3)));
      const days: Cell[][] = [];
      for (let d = "2025-03-01"; d <= "2025-04-20"; d = addDays(d, 1)) if (dow(d) !== 0 && dow(d) !== 6 && !holidays.has(d)) days.push([d]);
      const n = ri(rng, 1, 15);
      const pays: Cell[][] = seq(10, n).map((id) => {
        const c = dateBetween(rng, "2025-03-01", "2025-03-28");
        return [id, ri(rng, 1, m), c, chance(rng, 0.2) ? null : addDays(c, ri(rng, 1, 6))];
      });
      return { Merchant: merchants, Payment: pays, WorkingDay: shuffle(rng, days) };
    },
    solution: [
      "WITH wd AS (",
      "  SELECT work_date, ROW_NUMBER() OVER (ORDER BY work_date) AS n FROM WorkingDay",
      "), due AS (",
      "  SELECT p.payment_id, p.merchant_id, p.captured_on, p.settled_on,",
      "         (SELECT MIN(w.n) FROM wd w WHERE w.work_date > p.captured_on) + m.settlement_cycle - 1 AS due_n",
      "  FROM Payment p",
      "  JOIN Merchant m ON m.merchant_id = p.merchant_id",
      ")",
      "SELECT d.payment_id, d.merchant_id, d.captured_on, w.work_date AS due_on, d.settled_on",
      "FROM due d",
      "JOIN wd w ON w.n = d.due_n",
      "WHERE d.settled_on > w.work_date",
      "   OR (d.settled_on IS NULL AND w.work_date < '2025-03-31')",
      "ORDER BY due_on, d.payment_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT p.payment_id, p.merchant_id, p.captured_on, w.work_date AS due_on, p.settled_on",
        "FROM Payment p",
        "JOIN Merchant m ON m.merchant_id = p.merchant_id",
        "JOIN WorkingDay w ON w.work_date > p.captured_on",
        " AND (SELECT COUNT(*) FROM WorkingDay x WHERE x.work_date > p.captured_on AND x.work_date <= w.work_date) = m.settlement_cycle",
        "WHERE p.settled_on > w.work_date OR (p.settled_on IS NULL AND w.work_date < '2025-03-31')",
        "ORDER BY w.work_date, p.payment_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Calendar arithmetic with `DATE_ADD` can't skip holidays — count rows of the working-day table instead.",
      "Number the working days in order; then \"N working days after\" becomes \"N positions after\".",
      "The first working day strictly after the capture is the smallest number whose date is greater than `captured_on`; add N − 1 to it.",
      "Unsettled payments need their own branch: `NULL > due_on` is never true.",
    ],
    editorial: [
      "Adding days to a date cannot skip weekends and bank holidays, but the `WorkingDay` table already lists exactly the days that count. Number them with `ROW_NUMBER() OVER (ORDER BY work_date)` and the problem becomes integer arithmetic: if the first working day strictly after the capture has number *k*, the T+N due date is the working day numbered *k + N − 1*.",
      "",
      "*k* is `MIN(n)` over working days later than `captured_on` — a capture on a Friday or a holiday still finds the next working day, and a capture on a working day correctly skips itself because the comparison is strict. Joining back to the numbered calendar on `n = k + N − 1` turns the number into the date `due_on`.",
      "",
      "Then report late payments: settled after `due_on`, or not settled at all with a due date before the report date. The second branch is needed because a NULL `settled_on` makes the first comparison unknown. The order is fixed by `due_on` and `payment_id`.",
      "",
      "The alternative avoids the window: it joins each payment to every later working day and keeps the one for which exactly N working days lie in `(captured_on, work_date]`. That is a counting subquery per candidate pair — quadratic in the calendar — whereas numbering the calendar once makes each lookup a single index probe.",
    ].join("\n"),
  },

  {
    slug: "razorpay-live-methods-differ-from-onboarding-request",
    title: "Razorpay: Merchants Whose Live Methods Differ From Their Request",
    difficulty: "HARD",
    topics: ["Subqueries", "Strings", "Dates", "Aggregation"],
    description: [
      "At onboarding, a merchant asks Razorpay for a set of payment methods (UPI, cards, EMI, Pay Later …); risk and ops then activate and deactivate methods over time. An activation audit compares, for every merchant, the methods it asked for with the methods **live** today.",
      "",
      "A method is **live on 2025-03-31** for a merchant when it has **at least one** activation with `activated_on` on or before 2025-03-31 and `deactivated_on` NULL or **after** 2025-03-31. For every merchant whose set of live methods is **not exactly** its set of requested methods, return `merchant_id`, `missing_methods` (requested but not live) and `extra_methods` (live but never requested) — each a comma-separated list with no spaces, in **alphabetical order**, without duplicates, and **NULL** when empty. Consider every merchant that appears in either table. Any order.",
    ].join("\n"),
    tables: [
      {
        name: "MethodRequest",
        columns: [
          { name: "merchant_id", type: "int" },
          { name: "method", type: "varchar" },
        ],
        primaryKey: ["merchant_id", "method"],
        note: "The methods each merchant asked for on its onboarding form. Method names are lower case.",
      },
      {
        name: "MethodActivation",
        columns: [
          { name: "activation_id", type: "int" },
          { name: "merchant_id", type: "int" },
          { name: "method", type: "varchar" },
          { name: "activated_on", type: "date" },
          { name: "deactivated_on", type: "date" },
        ],
        primaryKey: ["activation_id"],
        note: "One row per time a method was switched on for a merchant; `deactivated_on` is the day it was switched off (it is not live that day), NULL while it is still on. A method can be switched on again later, as a new row.",
      },
    ],
    examples: [
      {
        MethodRequest: [
          [1, "card"],
          [1, "upi"],
          [2, "card"],
          [2, "emi"],
          [2, "upi"],
          [3, "upi"],
          [4, "netbanking"],
        ],
        MethodActivation: [
          [1, 1, "upi", "2025-01-10", null],
          [2, 1, "card", "2025-01-10", "2025-02-01"],
          [3, 1, "card", "2025-02-15", null],
          [4, 2, "upi", "2025-01-12", null],
          [5, 2, "card", "2025-01-12", "2025-03-31"],
          [6, 2, "paylater", "2025-03-01", null],
          [7, 2, "emi", "2025-04-01", null],
          [8, 3, "upi", "2025-02-02", null],
          [9, 3, "wallet", "2025-02-02", null],
          [10, 3, "wallet", "2025-03-05", null],
          [11, 5, "upi", "2025-03-20", null],
        ],
      },
    ],
    gen: (rng) => {
      const methods = ["card", "emi", "netbanking", "paylater", "upi", "wallet"];
      const m = ri(rng, 1, 6);
      const req: Cell[][] = [];
      const act: Cell[][] = [];
      const on = (mid: number, meth: string, live: boolean) => {
        if (live) {
          act.push([0, mid, meth, dateBetween(rng, "2025-01-01", "2025-03-31"), chance(rng, 0.2) ? pick(rng, ["2025-04-01", "2025-05-10"]) : null]);
        } else {
          const a = dateBetween(rng, "2025-01-01", "2025-03-01");
          act.push(chance(rng, 0.5) ? [0, mid, meth, a, pick(rng, ["2025-03-31", addDays(a, ri(rng, 1, 20))])] : [0, mid, meth, pick(rng, ["2025-04-01", "2025-04-15"]), null]);
        }
      };
      for (let mid = 1; mid <= m; mid++) {
        const asked = chance(rng, 0.1) ? [] : sample(rng, methods, ri(rng, 1, 4));
        for (const meth of asked) req.push([mid, meth]);
        const exact = chance(rng, 0.35);
        for (const meth of methods) {
          const wanted = asked.includes(meth);
          const live = exact ? wanted : wanted ? chance(rng, 0.7) : chance(rng, 0.15);
          if (live) {
            on(mid, meth, true);
            if (chance(rng, 0.2)) on(mid, meth, chance(rng, 0.5));
          } else if (chance(rng, 0.3)) on(mid, meth, false);
        }
      }
      shuffle(rng, act).forEach((r, i) => (r[0] = i + 1));
      return { MethodRequest: shuffle(rng, req), MethodActivation: act };
    },
    solution: [
      "WITH live AS (",
      "  SELECT DISTINCT merchant_id, method",
      "  FROM MethodActivation",
      "  WHERE activated_on <= '2025-03-31'",
      "    AND (deactivated_on IS NULL OR deactivated_on > '2025-03-31')",
      "), diff AS (",
      "  SELECT r.merchant_id, r.method, 'missing' AS side",
      "  FROM MethodRequest r",
      "  WHERE NOT EXISTS (SELECT 1 FROM live l WHERE l.merchant_id = r.merchant_id AND l.method = r.method)",
      "  UNION ALL",
      "  SELECT l.merchant_id, l.method, 'extra'",
      "  FROM live l",
      "  WHERE NOT EXISTS (SELECT 1 FROM MethodRequest r WHERE r.merchant_id = l.merchant_id AND r.method = l.method)",
      ")",
      "SELECT merchant_id,",
      "       GROUP_CONCAT(CASE WHEN side = 'missing' THEN method END ORDER BY method SEPARATOR ',') AS missing_methods,",
      "       GROUP_CONCAT(CASE WHEN side = 'extra' THEN method END ORDER BY method SEPARATOR ',') AS extra_methods",
      "FROM diff",
      "GROUP BY merchant_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH live AS (",
        "  SELECT merchant_id, method",
        "  FROM MethodActivation",
        "  WHERE activated_on <= '2025-03-31' AND COALESCE(deactivated_on, '9999-12-31') > '2025-03-31'",
        "  GROUP BY merchant_id, method",
        "), keyset AS (",
        "  SELECT merchant_id, method FROM MethodRequest",
        "  UNION",
        "  SELECT merchant_id, method FROM live",
        "), joined AS (",
        "  SELECT k.merchant_id, k.method, r.method AS asked, l.method AS on_now",
        "  FROM keyset k",
        "  LEFT JOIN MethodRequest r ON r.merchant_id = k.merchant_id AND r.method = k.method",
        "  LEFT JOIN live l ON l.merchant_id = k.merchant_id AND l.method = k.method",
        ")",
        "SELECT merchant_id,",
        "       GROUP_CONCAT(IF(on_now IS NULL, method, NULL) ORDER BY method SEPARATOR ',') AS missing_methods,",
        "       GROUP_CONCAT(IF(asked IS NULL, method, NULL) ORDER BY method SEPARATOR ',') AS extra_methods",
        "FROM joined",
        "GROUP BY merchant_id",
        "HAVING SUM(asked IS NULL OR on_now IS NULL) > 0",
      ].join("\n"),
    ],
    hints: [
      "First reduce the activations to one row per live (merchant, method) — several rows can say the same method is on.",
      "Two set differences: requested minus live, and live minus requested. `NOT EXISTS` gives each.",
      "Stack both differences with a label, then build the two lists per merchant with `GROUP_CONCAT(… ORDER BY … SEPARATOR ',')`.",
      "`GROUP_CONCAT` skips NULLs and returns NULL when nothing is left — exactly the empty-list rule.",
    ],
    editorial: [
      "Two sets are equal when each has nothing the other lacks, so the audit is two **set differences**. Start by turning the activation history into the set of methods live on the audit day: an activation counts when it began on or before 2025-03-31 and either was never switched off or was switched off after that day — `deactivated_on = '2025-03-31'` means it was off that day. `DISTINCT` collapses a method that has two live rows, so it can never be listed twice.",
      "",
      "*Missing* methods are requested rows with no live partner, and *extra* methods are live rows with no request, each an anti join with `NOT EXISTS`. Stacking both with `UNION ALL` and a `side` label gives one row per discrepancy; a merchant whose sets match produces no rows at all and so drops out of the answer without any further test. That also covers merchants found in only one table — a merchant with live methods but no request has only extras, and one that asked for methods but has nothing live has only missing ones.",
      "",
      "Per merchant, `GROUP_CONCAT(CASE WHEN side = 'missing' THEN method END ORDER BY method SEPARATOR ',')` lists one side alphabetically: the `CASE` yields NULL for the other side's rows, `GROUP_CONCAT` ignores NULLs, and when every value is NULL the result is NULL — the required empty value.",
      "",
      "The alternative emulates a full outer join (MySQL has none): the union of both key sets, left-joined to each side, so a NULL on either side marks a difference, and `HAVING` drops merchants without one. Both read each table once with indexes on `(merchant_id, method)`.",
    ].join("\n"),
  },
  {
    slug: "razorpay-diwali-week-volume-year-on-year",
    title: "Razorpay: Diwali-Week Captured Volume Against Last Year's Diwali Week",
    difficulty: "HARD",
    topics: ["Dates", "Conditional Logic", "Aggregation", "Joins"],
    description: [
      "Every November Razorpay's merchant-success team asks how each merchant's festive rush compared with the year before. Diwali moves around the calendar, so the window is read from a `Festival` table, not from fixed dates.",
      "",
      "A year's **Diwali week** is the seven days ending on that year's `diwali_date`: from `diwali_date − 6 days` 00:00:00 through `diwali_date` 23:59:59, inclusive. Only `captured` payments count — `failed` ones never moved money and `refunded` ones went back to the customer. Amounts are in **paise**.",
      "",
      "For every merchant with captured volume in the Diwali week of **2024 or 2025** (or both), return `merchant_id`, `business_name`, `gmv_2024`, `gmv_2025` (0 for a week with nothing captured), `yoy_change` (`gmv_2025 − gmv_2024`) and `trend`:",
      "",
      "- `new` when `gmv_2024` is 0, else `lost` when `gmv_2025` is 0;",
      "- otherwise `grew` when `gmv_2025` is **at least 1.2 ×** `gmv_2024`, `shrank` when it is **at most 0.8 ×** `gmv_2024`, and `flat` in between.",
      "",
      "Order by `yoy_change` descending, then `merchant_id`. Other years in `Festival` are ignored.",
    ].join("\n"),
    tables: [
      {
        name: "Merchant",
        columns: [
          { name: "merchant_id", type: "int" },
          { name: "business_name", type: "varchar" },
          { name: "category", type: "varchar" },
        ],
        primaryKey: ["merchant_id"],
        note: "One row per merchant account on Razorpay.",
      },
      {
        name: "Festival",
        columns: [
          { name: "festival_year", type: "int" },
          { name: "diwali_date", type: "date" },
        ],
        primaryKey: ["festival_year"],
        note: "The date of Diwali (Lakshmi Puja) in each year — it falls on a different day every year.",
      },
      {
        name: "Payment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "merchant_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "created_at", type: "datetime" },
          { name: "status", type: "enum", values: ["captured", "failed", "refunded"] },
        ],
        primaryKey: ["payment_id"],
        note: "One row per payment, `amount` in paise (₹1 = 100 paise). `refunded` payments were captured and later returned in full.",
      },
    ],
    examples: [
      {
        Merchant: [
          [1, "Kirana Kart", "ecommerce"],
          [2, "Urban Threads", "ecommerce"],
          [3, "FitFuel Labs", "food"],
          [4, "BookNook", "education"],
          [5, "TrekNest", "travel"],
          [6, "HomeBrew Coffee", "food"],
        ],
        Festival: [
          [2023, "2023-11-12"],
          [2024, "2024-11-01"],
          [2025, "2025-10-20"],
        ],
        Payment: [
          [1, 1, 500000, "2024-10-26 00:00:00", "captured"],
          [2, 1, 300000, "2024-11-01 23:59:59", "captured"],
          [3, 1, 1000000, "2025-10-15 10:00:00", "captured"],
          [4, 2, 600000, "2024-10-28 12:00:00", "captured"],
          [5, 2, 200000, "2024-10-29 15:20:00", "refunded"],
          [6, 2, 480000, "2025-10-18 20:00:00", "captured"],
          [7, 3, 250000, "2025-10-20 18:30:00", "captured"],
          [8, 3, 400000, "2024-11-02 00:00:00", "captured"],
          [9, 4, 350000, "2024-10-30 11:00:00", "captured"],
          [10, 4, 350000, "2025-10-27 11:00:00", "captured"],
          [11, 5, 400000, "2024-10-27 09:15:00", "captured"],
          [12, 5, 440000, "2025-10-16 13:40:00", "captured"],
          [13, 5, 90000, "2025-10-17 08:05:00", "failed"],
          [14, 6, 150000, "2025-10-19 19:00:00", "failed"],
          [15, 6, 200000, "2023-11-10 12:00:00", "captured"],
        ],
      },
    ],
    gen: (rng) => {
      const d24 = dateBetween(rng, "2024-10-18", "2024-11-10");
      const d25 = dateBetween(rng, "2025-10-14", "2025-11-08");
      const d23 = dateBetween(rng, "2023-10-20", "2023-11-14");
      const festival: Cell[][] = [[2023, d23], [2024, d24], [2025, d25]];
      const m = ri(rng, 1, 7);
      const merchants: Cell[][] = sample(rng, BUSINESSES, m).map((b, i) => [i + 1, b, pick(rng, CATEGORIES)]);
      /** A moment in a year's week, or just outside it, or in another year's week on the same calendar dates. */
      const when = (diwali: string): string => {
        const r = rng();
        if (r < 0.12) return `${addDays(diwali, -6)} 00:00:00`;
        if (r < 0.24) return `${diwali} 23:59:59`;
        if (r < 0.3) return `${addDays(diwali, -7)} 23:59:59`;
        if (r < 0.36) return `${addDays(diwali, 1)} 00:00:00`;
        return at(addDays(diwali, -ri(rng, 0, 6)), ri(rng, 0, 1439));
      };
      const payments: Cell[][] = [];
      for (let id = 1; id <= m; id++) {
        if (chance(rng, 0.1)) continue;
        const base = roundTo(rng, 50000, 600000, 50000);
        const shape = pick(rng, ["both", "both", "both", "only24", "only25", "none"]);
        if (shape !== "only25" && shape !== "none") payments.push([0, id, base, when(d24), "captured"]);
        if (shape !== "only24" && shape !== "none") {
          const amt = pick(rng, [base * 1.2, base * 0.8, base, roundTo(rng, 20000, 900000, 10000)]);
          payments.push([0, id, Math.round(amt), when(d25), "captured"]);
        }
        for (let k = ri(rng, 0, 3); k > 0; k--) {
          const year = pick(rng, [d23, d24, d25]);
          const t = chance(rng, 0.3) ? at(addDays(year === d25 ? d24 : d25, -ri(rng, 0, 6)).replace(/^\d{4}/, year.slice(0, 4)), ri(rng, 0, 1439)) : when(year);
          payments.push([0, id, roundTo(rng, 10000, 400000, 10000), t, pick(rng, ["captured", "failed", "refunded"])]);
        }
      }
      if (m > 0 && chance(rng, 0.1)) payments.length = 0;
      shuffle(rng, payments).forEach((r, i) => (r[0] = i + 1));
      return { Merchant: merchants, Festival: festival, Payment: payments };
    },
    solution: [
      "WITH win AS (",
      "  SELECT festival_year,",
      "         DATE_SUB(diwali_date, INTERVAL 6 DAY) AS starts_on,",
      "         DATE_ADD(diwali_date, INTERVAL 1 DAY) AS ends_before",
      "  FROM Festival",
      "  WHERE festival_year IN (2024, 2025)",
      "), g AS (",
      "  SELECT p.merchant_id,",
      "         SUM(CASE WHEN w.festival_year = 2024 THEN p.amount ELSE 0 END) AS gmv_2024,",
      "         SUM(CASE WHEN w.festival_year = 2025 THEN p.amount ELSE 0 END) AS gmv_2025",
      "  FROM Payment p",
      "  JOIN win w ON p.created_at >= w.starts_on AND p.created_at < w.ends_before",
      "  WHERE p.status = 'captured'",
      "  GROUP BY p.merchant_id",
      ")",
      "SELECT m.merchant_id, m.business_name, g.gmv_2024, g.gmv_2025,",
      "       g.gmv_2025 - g.gmv_2024 AS yoy_change,",
      "       CASE WHEN g.gmv_2024 = 0 THEN 'new'",
      "            WHEN g.gmv_2025 = 0 THEN 'lost'",
      "            WHEN 5 * g.gmv_2025 >= 6 * g.gmv_2024 THEN 'grew'",
      "            WHEN 5 * g.gmv_2025 <= 4 * g.gmv_2024 THEN 'shrank'",
      "            ELSE 'flat' END AS trend",
      "FROM g",
      "JOIN Merchant m ON m.merchant_id = g.merchant_id",
      "ORDER BY yoy_change DESC, m.merchant_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH y AS (",
        "  SELECT p.merchant_id, f.festival_year, SUM(p.amount) AS gmv",
        "  FROM Payment p",
        "  JOIN Festival f ON f.festival_year IN (2024, 2025)",
        "   AND p.created_at >= DATE_SUB(f.diwali_date, INTERVAL 6 DAY)",
        "   AND p.created_at < DATE_ADD(f.diwali_date, INTERVAL 1 DAY)",
        "  WHERE p.status = 'captured'",
        "  GROUP BY p.merchant_id, f.festival_year",
        "), k AS (",
        "  SELECT DISTINCT merchant_id FROM y",
        "), t AS (",
        "  SELECT k.merchant_id, COALESCE(a.gmv, 0) AS gmv_2024, COALESCE(b.gmv, 0) AS gmv_2025",
        "  FROM k",
        "  LEFT JOIN y a ON a.merchant_id = k.merchant_id AND a.festival_year = 2024",
        "  LEFT JOIN y b ON b.merchant_id = k.merchant_id AND b.festival_year = 2025",
        ")",
        "SELECT t.merchant_id, m.business_name, t.gmv_2024, t.gmv_2025, t.gmv_2025 - t.gmv_2024 AS yoy_change,",
        "       IF(t.gmv_2024 = 0, 'new', IF(t.gmv_2025 = 0, 'lost',",
        "          IF(t.gmv_2025 * 5 >= t.gmv_2024 * 6, 'grew', IF(t.gmv_2025 * 5 <= t.gmv_2024 * 4, 'shrank', 'flat')))) AS trend",
        "FROM t JOIN Merchant m ON m.merchant_id = t.merchant_id",
        "ORDER BY yoy_change DESC, t.merchant_id",
      ].join("\n"),
      [
        "SELECT merchant_id, business_name, gmv_2024, gmv_2025, gmv_2025 - gmv_2024 AS yoy_change,",
        "       CASE WHEN gmv_2024 = 0 THEN 'new' WHEN gmv_2025 = 0 THEN 'lost'",
        "            WHEN gmv_2025 * 5 >= gmv_2024 * 6 THEN 'grew' WHEN gmv_2025 * 5 <= gmv_2024 * 4 THEN 'shrank'",
        "            ELSE 'flat' END AS trend",
        "FROM (",
        "  SELECT m.merchant_id, m.business_name,",
        "         (SELECT COALESCE(SUM(p.amount), 0) FROM Payment p JOIN Festival f ON f.festival_year = 2024",
        "           WHERE p.merchant_id = m.merchant_id AND p.status = 'captured'",
        "             AND DATEDIFF(f.diwali_date, p.created_at) BETWEEN 0 AND 6) AS gmv_2024,",
        "         (SELECT COALESCE(SUM(p.amount), 0) FROM Payment p JOIN Festival f ON f.festival_year = 2025",
        "           WHERE p.merchant_id = m.merchant_id AND p.status = 'captured'",
        "             AND DATEDIFF(f.diwali_date, p.created_at) BETWEEN 0 AND 6) AS gmv_2025",
        "  FROM Merchant m",
        ") x",
        "WHERE gmv_2024 > 0 OR gmv_2025 > 0",
        "ORDER BY yoy_change DESC, merchant_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Turn the 2024 and 2025 rows of `Festival` into two windows: a start date six days before Diwali and an exclusive end the day after it, so a payment at 23:59:59 on Diwali still counts.",
      "Join captured payments to those windows; each payment lands in at most one of them.",
      "One `GROUP BY merchant_id` with `SUM(CASE WHEN festival_year = 2024 THEN amount ELSE 0 END)` (and the same for 2025) gives both years side by side, zeros included.",
      "Compare without decimals: `gmv_2025 ≥ 1.2 × gmv_2024` is `5 × gmv_2025 ≥ 6 × gmv_2024`. Check the `new` and `lost` cases first.",
    ],
    editorial: [
      "A year-on-year comparison is only fair when both sides cover the same *occasion*, and Diwali falls on a different date every year — 1 November in 2024, 20 October in 2025 in the example. So the windows come from data: for each of the two years, `DATE_SUB(diwali_date, INTERVAL 6 DAY)` is the first day and `DATE_ADD(diwali_date, INTERVAL 1 DAY)` an exclusive end, which keeps a payment stamped 23:59:59 on Diwali day and drops one at 00:00:00 the next morning without any `DATE()` call on the column. A payment on the same *calendar* dates as last year's week (BookNook's 27 October 2025) is outside this year's week, which is the mistake fixed dates would make.",
      "",
      "Joining captured payments to the two window rows tags each payment with its festival year — the windows cannot overlap, so a payment is counted once. One grouping per merchant then pivots the years into columns with conditional sums; `ELSE 0` makes a year with no captured payment a 0 rather than a NULL, which the `new`/`lost` labels and `yoy_change` need. A merchant appears only if some captured payment fell in a window, which is exactly the population asked for: failed and refunded payments, and payments in 2023's week, never reach the grouping.",
      "",
      "The trend is checked in order — `new` and `lost` first, since 0 would otherwise pass as `shrank` — and the 20% thresholds are compared in integers (`5 × gmv_2025 ≥ 6 × gmv_2024`), so a merchant exactly 20% down, like Urban Threads, is `shrank` with no floating-point doubt.",
      "",
      "The first alternative aggregates per (merchant, year) and stitches the two years back together with a list of merchants and two LEFT JOINs — a full outer join, which MySQL lacks. The second computes each year with a correlated subquery per merchant and finds the window with `DATEDIFF(diwali_date, created_at) BETWEEN 0 AND 6`; it reads the payments once per merchant and year, fine with an index on `(merchant_id, created_at)`, while the main query reads them once.",
    ].join("\n"),
  },

  {
    slug: "razorpay-orders-rescued-by-switching-method",
    title: "Razorpay: Orders Rescued by Switching Payment Method",
    difficulty: "HARD",
    topics: ["Window Functions", "Subqueries", "Aggregation"],
    description: [
      "When a payment fails, Razorpay Checkout lets the shopper retry the same order, often with another method. The checkout team wants to know which failing methods are rescued by a switch, and by what.",
      "",
      "An order's **first attempt** is its earliest `attempted_at` (ties by smaller `payment_id`). An order is **rescued** when its first attempt **failed** and the order was later captured with a method **different** from the first attempt's. For every method that was the failed first attempt of at least one order, return `first_method`, `failed_first` (orders whose first attempt failed with it), `rescued_by_switch` (of those, the rescued ones) and `top_rescue_method` — the method that captured the most of those rescued orders (ties: alphabetically first; NULL when none was rescued). Any order.",
    ].join("\n"),
    tables: [
      {
        name: "PaymentAttempt",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "order_id", type: "int" },
          { name: "method", type: "varchar" },
          { name: "attempted_at", type: "datetime" },
          { name: "status", type: "enum", values: ["failed", "captured"] },
        ],
        primaryKey: ["payment_id"],
        note: "One row per payment attempt on an order. An order is captured at most once, and no attempt follows its capture.",
      },
    ],
    examples: [
      {
        PaymentAttempt: [
          [1, 100, "card", "2025-03-01 10:00:00", "failed"],
          [2, 100, "upi", "2025-03-01 10:02:00", "captured"],
          [3, 101, "card", "2025-03-01 11:00:00", "failed"],
          [4, 101, "card", "2025-03-01 11:01:00", "captured"],
          [5, 102, "card", "2025-03-01 12:00:00", "failed"],
          [6, 102, "netbanking", "2025-03-01 12:03:00", "failed"],
          [7, 102, "upi", "2025-03-01 12:05:00", "captured"],
          [8, 103, "upi", "2025-03-01 13:00:00", "failed"],
          [9, 103, "upi", "2025-03-01 13:01:00", "failed"],
          [10, 104, "upi", "2025-03-01 14:00:00", "captured"],
          [11, 105, "netbanking", "2025-03-01 15:00:00", "failed"],
          [12, 105, "card", "2025-03-01 15:04:00", "captured"],
        ],
      },
    ],
    gen: (rng) => {
      const orders = ri(rng, 1, 9);
      const methods = ["upi", "card", "netbanking", "wallet"];
      const rows: Cell[][] = [];
      for (let o = 0; o < orders; o++) {
        const k = ri(rng, 1, 4);
        const captured = chance(rng, 0.65);
        let t = 600 + o * 30;
        for (let j = 0; j < k; j++) {
          const last = j === k - 1;
          rows.push([0, 100 + o, pick(rng, methods), at("2025-03-01", t), last && captured ? "captured" : "failed"]);
          t += chance(rng, 0.1) ? 0 : ri(rng, 1, 4);
        }
      }
      shuffle(rng, rows).forEach((r, i) => (r[0] = i + 1));
      return { PaymentAttempt: rows };
    },
    solution: [
      "WITH ranked AS (",
      "  SELECT order_id, method, status,",
      "         ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY attempted_at, payment_id) AS rn",
      "  FROM PaymentAttempt",
      "), firsts AS (",
      "  SELECT order_id, method AS first_method FROM ranked WHERE rn = 1 AND status = 'failed'",
      "), rescues AS (",
      "  SELECT f.first_method, a.method AS rescue_method",
      "  FROM firsts f",
      "  JOIN PaymentAttempt a ON a.order_id = f.order_id AND a.status = 'captured' AND a.method <> f.first_method",
      "), tops AS (",
      "  SELECT first_method, rescue_method,",
      "         ROW_NUMBER() OVER (PARTITION BY first_method ORDER BY COUNT(*) DESC, rescue_method) AS r",
      "  FROM rescues",
      "  GROUP BY first_method, rescue_method",
      ")",
      "SELECT f.first_method, COUNT(*) AS failed_first,",
      "       (SELECT COUNT(*) FROM rescues x WHERE x.first_method = f.first_method) AS rescued_by_switch,",
      "       t.rescue_method AS top_rescue_method",
      "FROM firsts f",
      "LEFT JOIN tops t ON t.first_method = f.first_method AND t.r = 1",
      "GROUP BY f.first_method, t.rescue_method",
    ].join("\n"),
    alternatives: [
      [
        "WITH firsts AS (",
        "  SELECT a.order_id, a.method AS first_method",
        "  FROM PaymentAttempt a",
        "  WHERE a.status = 'failed'",
        "    AND NOT EXISTS (SELECT 1 FROM PaymentAttempt b WHERE b.order_id = a.order_id",
        "                    AND (b.attempted_at < a.attempted_at OR (b.attempted_at = a.attempted_at AND b.payment_id < a.payment_id)))",
        "), outcome AS (",
        "  SELECT f.order_id, f.first_method,",
        "         (SELECT c.method FROM PaymentAttempt c WHERE c.order_id = f.order_id AND c.status = 'captured' AND c.method <> f.first_method) AS rescue_method",
        "  FROM firsts f",
        "), counts AS (",
        "  SELECT first_method, rescue_method, COUNT(*) AS n FROM outcome WHERE rescue_method IS NOT NULL GROUP BY first_method, rescue_method",
        ")",
        "SELECT o.first_method, COUNT(*) AS failed_first, COUNT(o.rescue_method) AS rescued_by_switch,",
        "       (SELECT c.rescue_method FROM counts c WHERE c.first_method = o.first_method ORDER BY c.n DESC, c.rescue_method LIMIT 1) AS top_rescue_method",
        "FROM outcome o",
        "GROUP BY o.first_method",
      ].join("\n"),
    ],
    hints: [
      "Find each order's first attempt with `ROW_NUMBER()` per order, ordered by time and then `payment_id`.",
      "Keep the orders whose first attempt failed; they define both the groups and `failed_first`.",
      "A rescue is a captured attempt on the same order with a different method — the order has at most one capture.",
      "The top rescue method is a second ranking, over the counts of rescues per (first method, rescue method). Join it with a LEFT JOIN so methods with no rescue keep their row.",
    ],
    editorial: [
      "Build it in stages with CTEs. **ranked** numbers each order's attempts by time with `payment_id` as tie-breaker, so the first attempt is unambiguous. **firsts** keeps the orders whose first attempt failed, with that attempt's method — one row per order, which is the population of the report.",
      "",
      "**rescues** joins those orders to their captured attempt when the capture used a different method. An order captured with the *same* method (a plain retry) is not a rescue by switching; an order never captured is not rescued at all. Since an order is captured at most once, each rescued order contributes exactly one row.",
      "",
      "**tops** counts rescues per (first method, rescue method) and ranks them with `ROW_NUMBER() … ORDER BY COUNT(*) DESC, rescue_method`, so a tie goes to the alphabetically first method and exactly one row per first method gets rank 1. The final query groups `firsts` per method and **LEFT JOINs** the rank-1 row, so a method nobody was rescued from still appears with `rescued_by_switch = 0` and a NULL top method.",
      "",
      "The alternative finds first attempts with `NOT EXISTS` (no earlier attempt on the order), the rescue method with a scalar subquery, and the top method with `ORDER BY … LIMIT 1` in a correlated subquery. The window version sorts each order once; the subquery version probes per order and is fine with an index on `(order_id, attempted_at)`.",
    ].join("\n"),
  },

  {
    slug: "razorpay-queued-payouts-rejected-for-low-balance",
    title: "Razorpay: Queued Payouts Rejected for Insufficient Balance",
    difficulty: "HARD",
    topics: ["Subqueries", "Window Functions"],
    description: [
      "On a RazorpayX current account, queued payouts are released one by one when the balance is checked. The payouts team simulates the queue to tell a business which payouts will bounce.",
      "",
      "Each account starts at its `opening_balance`. Its payouts are processed in `queued_at` order (ties by smaller `payout_id`). A payout **goes through** when its `amount` is **at most** the current balance, which then drops by the amount; otherwise it is **rejected**, the balance is unchanged, and processing **continues** with the next payout (a later, smaller one may still go through). Return every rejected payout: `payout_id`, `account_id`, `amount` and `balance_at_attempt` (the balance when it was tried), ordered by `payout_id`.",
    ].join("\n"),
    tables: [
      {
        name: "CurrentAccount",
        columns: [
          { name: "account_id", type: "int" },
          { name: "business_name", type: "varchar" },
          { name: "opening_balance", type: "int" },
        ],
        primaryKey: ["account_id"],
        note: "A RazorpayX current account and its balance before the queue is processed.",
      },
      {
        name: "QueuedPayout",
        columns: [
          { name: "payout_id", type: "int" },
          { name: "account_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "queued_at", type: "datetime" },
        ],
        primaryKey: ["payout_id"],
        note: "Payouts waiting for funds; `account_id` always names an account.",
      },
    ],
    examples: [
      {
        CurrentAccount: [
          [1, "Kirana Kart", 50000],
          [2, "PixelPlay Studio", 20000],
          [3, "BookNook", 10000],
        ],
        QueuedPayout: [
          [101, 1, 30000, "2025-03-10 09:00:00"],
          [102, 1, 25000, "2025-03-10 09:05:00"],
          [103, 1, 15000, "2025-03-10 09:10:00"],
          [104, 1, 5000, "2025-03-10 09:20:00"],
          [105, 1, 1000, "2025-03-10 09:30:00"],
          [106, 2, 20000, "2025-03-10 10:00:00"],
          [107, 2, 1, "2025-03-10 10:00:00"],
          [108, 3, 4000, "2025-03-10 11:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const a = ri(rng, 1, 3);
      const accounts: Cell[][] = sample(rng, BUSINESSES, a).map((b, i) => [i + 1, b, roundTo(rng, 10000, 80000, 5000)]);
      const rows: Cell[][] = [];
      for (const acc of accounts) {
        const k = ri(rng, 0, 7);
        let t = 540;
        for (let j = 0; j < k; j++) {
          rows.push([0, acc[0]!, roundTo(rng, 5000, 40000, 5000), at("2025-03-10", t)]);
          t += chance(rng, 0.15) ? 0 : ri(rng, 1, 30);
        }
      }
      shuffle(rng, rows).forEach((r, i) => (r[0] = 101 + i));
      return { CurrentAccount: accounts, QueuedPayout: rows };
    },
    solution: [
      "WITH RECURSIVE q AS (",
      "  SELECT payout_id, account_id, amount,",
      "         ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY queued_at, payout_id) AS n",
      "  FROM QueuedPayout",
      "), sim AS (",
      "  SELECT q.account_id, q.n, q.payout_id, q.amount, a.opening_balance AS bal_before,",
      "         CASE WHEN q.amount <= a.opening_balance THEN a.opening_balance - q.amount ELSE a.opening_balance END AS bal_after",
      "  FROM q JOIN CurrentAccount a ON a.account_id = q.account_id",
      "  WHERE q.n = 1",
      "  UNION ALL",
      "  SELECT q.account_id, q.n, q.payout_id, q.amount, s.bal_after,",
      "         CASE WHEN q.amount <= s.bal_after THEN s.bal_after - q.amount ELSE s.bal_after END",
      "  FROM sim s JOIN q ON q.account_id = s.account_id AND q.n = s.n + 1",
      ")",
      "SELECT payout_id, account_id, amount, bal_before AS balance_at_attempt",
      "FROM sim",
      "WHERE amount > bal_before",
      "ORDER BY payout_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE sim AS (",
        "  SELECT p.payout_id, p.account_id, p.amount, p.queued_at, a.opening_balance AS bal_before,",
        "         IF(p.amount <= a.opening_balance, a.opening_balance - p.amount, a.opening_balance) AS bal_after",
        "  FROM QueuedPayout p JOIN CurrentAccount a ON a.account_id = p.account_id",
        "  WHERE NOT EXISTS (SELECT 1 FROM QueuedPayout e WHERE e.account_id = p.account_id",
        "                    AND (e.queued_at < p.queued_at OR (e.queued_at = p.queued_at AND e.payout_id < p.payout_id)))",
        "  UNION ALL",
        "  SELECT nx.payout_id, nx.account_id, nx.amount, nx.queued_at, s.bal_after,",
        "         IF(nx.amount <= s.bal_after, s.bal_after - nx.amount, s.bal_after)",
        "  FROM sim s",
        "  JOIN QueuedPayout nx ON nx.account_id = s.account_id",
        "   AND (nx.queued_at > s.queued_at OR (nx.queued_at = s.queued_at AND nx.payout_id > s.payout_id))",
        "   AND NOT EXISTS (SELECT 1 FROM QueuedPayout m WHERE m.account_id = s.account_id",
        "                   AND (m.queued_at > s.queued_at OR (m.queued_at = s.queued_at AND m.payout_id > s.payout_id))",
        "                   AND (m.queued_at < nx.queued_at OR (m.queued_at = nx.queued_at AND m.payout_id < nx.payout_id)))",
        ")",
        "SELECT payout_id, account_id, amount, bal_before AS balance_at_attempt FROM sim WHERE amount > bal_before ORDER BY payout_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "A running total does not work: a rejected payout must not reduce the balance, so each step depends on the decision before it.",
      "Number each account's payouts in queue order, then walk the queue with a recursive CTE carrying the balance.",
      "The anchor is payout 1 against the opening balance; each recursive step joins payout n + 1 to the balance left after payout n.",
      "Record the balance *before* each payout so the rejected ones can report it.",
    ],
    editorial: [
      "It is tempting to compare a running `SUM` of amounts with the opening balance, but that assumes every earlier payout went through. Here a rejected payout leaves the balance unchanged and a later, smaller payout can still fit, so whether payout *n* succeeds depends on every decision before it. That is a sequential simulation, and SQL's tool for it is a **recursive CTE**.",
      "",
      "First number each account's payouts in queue order with `ROW_NUMBER()` (queue time, then `payout_id`). The anchor of the recursion takes payout 1 of every account and computes the balance after it: reduced by the amount if the amount is at most the opening balance, unchanged otherwise. Each recursive step joins the previous state to payout `n + 1` of the same account and applies the same rule to the carried balance. Every row keeps `bal_before`, the balance at the moment of the attempt, so the final select just keeps `amount > bal_before` — the rejected payouts. A payout equal to the balance goes through.",
      "",
      "The alternative recurses without numbering: the anchor is the payout with no earlier one on the account (`NOT EXISTS`), and each step finds the next payout as the later one with nothing in between. It is the same walk, but each step costs a correlated search instead of a lookup by number. The recursion depth is the longest queue; all accounts advance together.",
    ].join("\n"),
  },

  {
    slug: "razorpay-weekly-success-rate-drops",
    title: "Razorpay: Merchants Whose Weekly Success Rate Fell 10+ Points",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Aggregation"],
    description: [
      "Razorpay's merchant health team flags merchants whose payment success rate drops sharply from one week to the next — often a sign of a broken checkout integration.",
      "",
      "Weeks start on **Monday**. A merchant's weekly success rate is 100 × captured / attempts over its payments created that week. Compare each week with the merchant's **immediately preceding calendar week** (exactly 7 days earlier), only when that week also had payments. Report the weeks where the rate **fell by 10 points or more**: `merchant_id`, `week_start` (the Monday), `previous_rate` and `current_rate`, each rate **rounded to 2 decimals** (decide the drop on the exact rates). Order by `merchant_id`, then `week_start`.",
    ].join("\n"),
    tables: [
      {
        name: "Payment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "merchant_id", type: "int" },
          { name: "created_on", type: "date" },
          { name: "status", type: "enum", values: ["captured", "failed"] },
        ],
        primaryKey: ["payment_id"],
        note: "One row per payment attempt.",
      },
    ],
    examples: [
      {
        Payment: [
          [1, 801, "2025-02-03", "captured"],
          [2, 801, "2025-02-05", "captured"],
          [3, 801, "2025-02-09", "captured"],
          [4, 801, "2025-02-10", "captured"],
          [5, 801, "2025-02-12", "failed"],
          [6, 801, "2025-02-24", "failed"],
          [7, 802, "2025-02-04", "captured"],
          [8, 802, "2025-02-06", "captured"],
          [9, 802, "2025-02-07", "captured"],
          [10, 802, "2025-02-08", "captured"],
          [11, 802, "2025-02-08", "captured"],
          [12, 802, "2025-02-11", "captured"],
          [13, 802, "2025-02-13", "captured"],
          [14, 802, "2025-02-14", "captured"],
          [15, 802, "2025-02-16", "failed"],
        ],
      },
    ],
    gen: (rng) => {
      const m = ri(rng, 1, 3);
      const rows: Cell[][] = [];
      for (let k = 0; k < m; k++) {
        for (let w = 0; w < 4; w++) {
          if (chance(rng, 0.15)) continue;
          const p = pick(rng, [1, 0.9, 0.8, 0.7, 0.5, 0.3]);
          const cnt = ri(rng, 1, 5);
          for (let j = 0; j < cnt; j++) rows.push([0, 801 + k, addDays("2025-02-03", w * 7 + ri(rng, 0, 6)), rng() < p ? "captured" : "failed"]);
        }
      }
      shuffle(rng, rows).forEach((r, i) => (r[0] = i + 1));
      return { Payment: rows };
    },
    solution: [
      "WITH weekly AS (",
      "  SELECT merchant_id, week_start, COUNT(*) AS attempts, SUM(status = 'captured') AS ok",
      "  FROM (SELECT merchant_id, status, DATE_SUB(created_on, INTERVAL WEEKDAY(created_on) DAY) AS week_start FROM Payment) p",
      "  GROUP BY merchant_id, week_start",
      "), paired AS (",
      "  SELECT merchant_id, week_start, attempts, ok,",
      "         LAG(week_start) OVER (PARTITION BY merchant_id ORDER BY week_start) AS prev_week,",
      "         LAG(attempts) OVER (PARTITION BY merchant_id ORDER BY week_start) AS prev_attempts,",
      "         LAG(ok) OVER (PARTITION BY merchant_id ORDER BY week_start) AS prev_ok",
      "  FROM weekly",
      ")",
      "SELECT merchant_id, week_start,",
      "       ROUND(100 * prev_ok / prev_attempts, 2) AS previous_rate,",
      "       ROUND(100 * ok / attempts, 2) AS current_rate",
      "FROM paired",
      "WHERE DATEDIFF(week_start, prev_week) = 7",
      "  AND 10 * (prev_ok * attempts - ok * prev_attempts) >= prev_attempts * attempts",
      "ORDER BY merchant_id, week_start",
    ].join("\n"),
    alternatives: [
      [
        "WITH weekly AS (",
        "  SELECT merchant_id, DATE_SUB(created_on, INTERVAL WEEKDAY(created_on) DAY) AS week_start,",
        "         COUNT(*) AS attempts, SUM(CASE WHEN status = 'captured' THEN 1 ELSE 0 END) AS ok",
        "  FROM Payment",
        "  GROUP BY merchant_id, DATE_SUB(created_on, INTERVAL WEEKDAY(created_on) DAY)",
        ")",
        "SELECT cur.merchant_id, cur.week_start,",
        "       ROUND(100 * prev.ok / prev.attempts, 2) AS previous_rate,",
        "       ROUND(100 * cur.ok / cur.attempts, 2) AS current_rate",
        "FROM weekly cur",
        "JOIN weekly prev ON prev.merchant_id = cur.merchant_id AND prev.week_start = DATE_SUB(cur.week_start, INTERVAL 7 DAY)",
        "WHERE 10 * (prev.ok * cur.attempts - cur.ok * prev.attempts) >= prev.attempts * cur.attempts",
        "ORDER BY cur.merchant_id, cur.week_start",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`WEEKDAY(d)` is 0 on Monday, so `DATE_SUB(d, INTERVAL WEEKDAY(d) DAY)` is the Monday of d's week.",
      "Aggregate to one row per merchant and week first; then compare rows.",
      "The previous *row* is not always the previous *week* — check that the weeks are exactly 7 days apart.",
      "Comparing two fractions exactly: a/b − c/d ≥ 0.1 is the same as 10(ad − cb) ≥ bd for positive b and d.",
    ],
    editorial: [
      "Start by bucketing payments into Monday-start weeks: `WEEKDAY` counts days since Monday, so subtracting it from the date gives the week's Monday. Grouping by merchant and that Monday gives each week's attempts and captures.",
      "",
      "Next, pair each week with the previous one. `LAG` over the merchant's weeks returns the previous *row*, but a merchant with no payments in some week has a gap, and the statement wants the immediately preceding calendar week only — so the pair is kept only when the two Mondays are exactly 7 days apart. A self join on `prev.week_start = cur.week_start − 7 days` (the alternative) expresses the same thing directly.",
      "",
      "The drop test is done on exact values. Rates such as 66.666… and 56.666… differ by exactly 10, but comparing rounded or floating values can tip such a boundary either way. Cross-multiplying keeps it in integers: (prev_ok/prev_attempts − ok/attempts) ≥ 1/10 becomes `10 * (prev_ok * attempts − ok * prev_attempts) >= prev_attempts * attempts`. Only the displayed rates are rounded. Both versions aggregate once and then work on one row per merchant-week.",
    ].join("\n"),
  },

  {
    slug: "razorpay-subscription-cycles-never-charged",
    title: "Razorpay: Subscription Billing Cycles With No Charge Attempt",
    difficulty: "HARD",
    topics: ["Subqueries", "Dates", "Joins"],
    description: [
      "An audit of Razorpay Subscriptions checks that the scheduler attempted a charge for every billing cycle that fell due. A cycle with no attempt at all is lost revenue for the merchant.",
      "",
      "Subscriptions bill **monthly**: cycle k (1 ≤ k ≤ `total_count`) falls due on `start_on` plus k − 1 months. A cycle is **expected** when its due date is **on or before 2025-06-30** and, for a cancelled subscription, **on or before `cancelled_on`**. Return every expected cycle with **no row** in `ChargeAttempt`: `subscription_id`, `cycle_no` and `due_on`, ordered by `subscription_id`, then `cycle_no`.",
    ].join("\n"),
    tables: [
      {
        name: "Subscription",
        columns: [
          { name: "subscription_id", type: "int" },
          { name: "merchant_id", type: "int" },
          { name: "start_on", type: "date" },
          { name: "total_count", type: "int" },
          { name: "cancelled_on", type: "date" },
        ],
        primaryKey: ["subscription_id"],
        note: "`total_count` is the number of monthly cycles the customer authorised (1–12); `start_on` is always on day 1–28 of a month; `cancelled_on` is NULL unless the subscription was cancelled.",
      },
      {
        name: "ChargeAttempt",
        columns: [
          { name: "attempt_id", type: "int" },
          { name: "subscription_id", type: "int" },
          { name: "cycle_no", type: "int" },
          { name: "attempted_on", type: "date" },
        ],
        primaryKey: ["attempt_id"],
        note: "One row per charge attempt the scheduler made, whatever its result; a cycle may have several.",
      },
    ],
    examples: [
      {
        Subscription: [
          [1, 901, "2025-03-05", 6, null],
          [2, 901, "2025-01-20", 3, null],
          [3, 902, "2025-02-10", 12, "2025-04-15"],
          [4, 903, "2025-06-30", 2, null],
        ],
        ChargeAttempt: [
          [1, 1, 1, "2025-03-05"],
          [2, 1, 2, "2025-04-05"],
          [3, 1, 4, "2025-06-05"],
          [4, 2, 1, "2025-01-20"],
          [5, 2, 2, "2025-02-20"],
          [6, 2, 2, "2025-02-21"],
          [7, 2, 3, "2025-03-20"],
          [8, 3, 1, "2025-02-10"],
        ],
      },
    ],
    gen: (rng) => {
      const s = ri(rng, 1, 5);
      const subs: Cell[][] = [];
      const atts: Cell[][] = [];
      for (let id = 1; id <= s; id++) {
        const start = `2025-${pad(ri(rng, 1, 6))}-${pad(ri(rng, 1, 28))}`;
        const total = ri(rng, 1, 8);
        const cancelled = chance(rng, 0.3) ? addDays(start, ri(rng, 10, 120)) : null;
        subs.push([id, ri(rng, 901, 904), start, total, cancelled]);
        for (let c = 1; c <= total; c++) {
          const [y, mo, d] = start.split("-").map(Number) as [number, number, number];
          const m0 = mo - 1 + (c - 1);
          const due = `${y + Math.floor(m0 / 12)}-${pad((m0 % 12) + 1)}-${pad(d)}`;
          if (due > "2025-06-30") break;
          if (chance(rng, 0.7)) {
            const k = ri(rng, 1, 2);
            for (let j = 0; j < k; j++) atts.push([0, id, c, addDays(due, j)]);
          }
        }
      }
      shuffle(rng, atts).forEach((r, i) => (r[0] = i + 1));
      return { Subscription: subs, ChargeAttempt: atts };
    },
    solution: [
      "WITH RECURSIVE cyc AS (",
      "  SELECT subscription_id, start_on, total_count, cancelled_on, 1 AS cycle_no, start_on AS due_on",
      "  FROM Subscription",
      "  UNION ALL",
      "  SELECT subscription_id, start_on, total_count, cancelled_on, cycle_no + 1, DATE_ADD(start_on, INTERVAL cycle_no MONTH)",
      "  FROM cyc",
      "  WHERE cycle_no < total_count",
      ")",
      "SELECT c.subscription_id, c.cycle_no, c.due_on",
      "FROM cyc c",
      "WHERE c.due_on <= '2025-06-30'",
      "  AND (c.cancelled_on IS NULL OR c.due_on <= c.cancelled_on)",
      "  AND NOT EXISTS (SELECT 1 FROM ChargeAttempt a WHERE a.subscription_id = c.subscription_id AND a.cycle_no = c.cycle_no)",
      "ORDER BY c.subscription_id, c.cycle_no",
    ].join("\n"),
    alternatives: [
      [
        "SELECT s.subscription_id, k.n AS cycle_no, DATE_ADD(s.start_on, INTERVAL k.n - 1 MONTH) AS due_on",
        "FROM Subscription s",
        "JOIN (SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6",
        "      UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12) k",
        "  ON k.n <= s.total_count",
        "LEFT JOIN ChargeAttempt a ON a.subscription_id = s.subscription_id AND a.cycle_no = k.n",
        "WHERE a.attempt_id IS NULL",
        "  AND DATE_ADD(s.start_on, INTERVAL k.n - 1 MONTH) <= '2025-06-30'",
        "  AND (s.cancelled_on IS NULL OR DATE_ADD(s.start_on, INTERVAL k.n - 1 MONTH) <= s.cancelled_on)",
        "ORDER BY s.subscription_id, k.n",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The cycles are not rows anywhere — generate them first, one row per (subscription, cycle number).",
      "A recursive CTE can count from 1 to `total_count` per subscription; a small numbers table joined on `n <= total_count` works too.",
      "Compute each due date with `DATE_ADD(start_on, INTERVAL k - 1 MONTH)` from the start date, not from the previous due date.",
      "Then it is an anti join against the attempts, plus the two date conditions.",
    ],
    editorial: [
      "The missing cycles cannot be found by looking at `ChargeAttempt` alone — a cycle with no attempt leaves no trace there. So first **generate** the cycles that should exist: one row per subscription and cycle number 1 … `total_count`. A recursive CTE does this: the anchor is cycle 1 due on `start_on`, and each step adds one to the cycle number while it is below `total_count`, computing the due date as `start_on` plus `cycle_no` months (the previous cycle number is the new one minus one). Deriving every due date from the start date, never from the previous due date, avoids drift; the start day is at most 28, so every month has that day.",
      "",
      "Then filter to expected cycles — due by the report date and, for a cancelled subscription, by its cancellation date (a NULL `cancelled_on` passes through the `IS NULL` branch) — and keep those with **no** attempt using `NOT EXISTS` on `(subscription_id, cycle_no)`. Several attempts on one cycle do not matter: existence is all that is checked.",
      "",
      "The alternative replaces the recursion with an inline numbers table 1–12 joined on `n <= total_count`, and the anti join with `LEFT JOIN … IS NULL`. It is simpler but needs the cap on `total_count`; the recursive version works for any length. Both are linear in the number of cycles generated.",
    ].join("\n"),
  },
];
