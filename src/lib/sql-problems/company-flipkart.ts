import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { FIRST_NAMES, addDays, atTime, chance, dateBetween, names, pick, ri, roundTo, sample } from "./kit.js";

/**
 * Company set: Flipkart — the questions a data analyst or engineer on an
 * Indian marketplace's teams is handed: the Big Billion Days war room (orders
 * per day, running GMV, shoppers across categories, buyers the sale brought
 * in and whether they came back), Flipkart Plus and SuperCoins (balances,
 * burns, FIFO expiry, unbroken membership), sellers and F-Assured fulfilment
 * (listings, the 24-hour dispatch SLA, return spikes, the buy box), Ekart
 * delivery (COD by pincode, RTO, failed attempts day after day), returns and
 * refund turnaround, bank offers, Pay Later, product Q&A and ratings, price
 * history, and Shopsy resellers. The schemas and every figure are invented
 * for practice — none of it is Flipkart's real data or schema. Easiest first.
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

const CATEGORIES = ["Mobiles", "Fashion", "Home", "Appliances", "Beauty", "Books", "Grocery"] as const;
const SELLERS = [
  "Kirana Kart", "Om Sai Traders", "Lakshmi Electronics", "UrbanThreads", "Shree Ganesh Mobiles",
  "BlueOak Home", "Pixel Point", "Desi Weaves", "Metro Gadgets", "Green Leaf Organics",
] as const;
const PINCODES: readonly (readonly [number, string])[] = [
  [560034, "Bengaluru"], [560100, "Bengaluru"], [110092, "Delhi"], [400076, "Mumbai"], [600042, "Chennai"],
  [500081, "Hyderabad"], [411014, "Pune"], [700091, "Kolkata"], [302017, "Jaipur"], [682030, "Kochi"],
];
const LISTING_TITLES = [
  "Wireless Earbuds", "Cotton Kurta", "Non-stick Tawa", "Smartphone 128GB", "LED Bulb Pack",
  "Running Shoes", "Steel Bottle", "Face Serum", "Study Table", "Power Bank",
] as const;
const BANKS = ["HDFC Bank", "SBI Card", "ICICI Bank", "Axis Bank", "Kotak Bank"] as const;
const STORE_NAMES = [
  "Meera Sarees", "Kids Corner", "Desi Kitchenware", "Glow Beauty Hub", "Trendy Kurtis",
  "Home Decor Point", "Rakhi Gifts", "Mobile Covers Plus",
] as const;
const PHONES = ["Nova X5", "Pixelon 8a", "Redstar 12", "Moto Lite", "Galaxy F15", "Realm C55"] as const;
const SALE_EVENTS: readonly (readonly [number, string, string, string])[] = [
  [1, "Big Billion Days 2023", "2023-10-08", "2023-10-15"],
  [2, "Big Saving Days Jan 2024", "2024-01-14", "2024-01-19"],
  [3, "Big Saving Days Jul 2024", "2024-07-20", "2024-07-25"],
  [4, "Big Billion Days 2024", "2024-09-27", "2024-10-06"],
];

export const COMPANY_FLIPKART: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "flipkart-plus-members-sitting-on-supercoins",
    title: "Flipkart: Plus Members Sitting on Unused SuperCoins",
    difficulty: "EASY",
    topics: ["Basics", "Conditional Logic"],
    description: [
      "The Flipkart Plus loyalty team wants to nudge members who have piled up SuperCoins but have not spent any of them this year.",
      "",
      "Return every member whose `tier` is `Plus` or `Plus Premium` (not `Lapsed`), whose `supercoin_balance` is **at least 500**, and who has **not redeemed since 2025-01-01** — either `last_redeemed_on` is NULL (never redeemed) or it is before 2025-01-01. Return `member_id`, `member_name` and `supercoin_balance`, ordered by `supercoin_balance` descending, then `member_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "PlusMember",
        columns: [
          { name: "member_id", type: "int" },
          { name: "member_name", type: "varchar" },
          { name: "tier", type: "enum", values: ["Plus", "Plus Premium", "Lapsed"] },
          { name: "supercoin_balance", type: "int" },
          { name: "last_redeemed_on", type: "date" },
        ],
        primaryKey: ["member_id"],
        note: "One row per loyalty member. `last_redeemed_on` is the date of the member's latest SuperCoin redemption, or NULL if they have never redeemed.",
      },
    ],
    examples: [
      {
        PlusMember: [
          [1, "Aarav", "Plus", 820, null],
          [2, "Diya", "Plus Premium", 500, "2024-12-31"],
          [3, "Kabir", "Lapsed", 1500, null],
          [4, "Meera", "Plus", 1200, "2025-01-01"],
          [5, "Rohan", "Plus", 499, null],
          [6, "Zara", "Plus Premium", 820, "2024-06-10"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 16);
      const who = names(rng, n);
      const rows: Cell[][] = seq(1, n).map((id, i) => [
        id,
        who[i]!,
        pick(rng, ["Plus", "Plus", "Plus Premium", "Lapsed"]),
        chance(rng, 0.25) ? pick(rng, [499, 500, 820]) : roundTo(rng, 0, 3000, 10),
        chance(rng, 0.35) ? null : chance(rng, 0.25) ? pick(rng, ["2024-12-31", "2025-01-01"]) : dateBetween(rng, "2024-03-01", "2025-06-30"),
      ]);
      return { PlusMember: rows };
    },
    solution: [
      "SELECT member_id, member_name, supercoin_balance",
      "FROM PlusMember",
      "WHERE tier IN ('Plus', 'Plus Premium')",
      "  AND supercoin_balance >= 500",
      "  AND (last_redeemed_on IS NULL OR last_redeemed_on < '2025-01-01')",
      "ORDER BY supercoin_balance DESC, member_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT member_id, member_name, supercoin_balance FROM PlusMember",
        "WHERE tier <> 'Lapsed' AND NOT supercoin_balance < 500",
        "  AND COALESCE(last_redeemed_on, '1900-01-01') < '2025-01-01'",
        "ORDER BY supercoin_balance DESC, member_id ASC",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Three conditions must all hold, so join them with AND.",
      "\"At least 500\" keeps a balance of exactly 500.",
      "A NULL `last_redeemed_on` fails every comparison — test for it with IS NULL, or replace it with a very old date.",
    ],
    editorial: [
      "Every member either qualifies or not on their own row, so this is a filter and a sort. The tier test keeps `Plus` and `Plus Premium` and drops `Lapsed`; the balance test is `>= 500` because a member with exactly 500 coins counts.",
      "",
      "The redemption test is where the NULLs bite. A member who has never redeemed has `last_redeemed_on` NULL, and `NULL < '2025-01-01'` is not true, so a plain comparison would silently drop the very members the team most wants to reach. Write it as `last_redeemed_on IS NULL OR last_redeemed_on < '2025-01-01'` — and keep the parentheses, because AND binds tighter than OR. A member who redeemed on 2025-01-01 itself has redeemed this year and is left out.",
      "",
      "The alternative turns the NULL into an impossibly old date with `COALESCE`, which reads the same. Ties on balance are broken by `member_id` so the order is fixed. It is one scan of the table.",
    ].join("\n"),
  },

  {
    slug: "flipkart-cod-orders-to-pincodes-without-cod",
    title: "Flipkart: COD Orders Shipped to Pincodes Without COD",
    difficulty: "EASY",
    topics: ["Joins", "Conditional Logic"],
    description: [
      "Ekart's serviceability team found cash-on-delivery orders slipping through to pincodes where couriers cannot collect cash. They want every such order listed with the reason.",
      "",
      "Among orders with `payment_mode` = `COD`, return those whose pincode either is listed in `EkartPincode` with `cod_enabled` = 0, or is **not listed at all** (Ekart does not serve it). Return `order_id`, `pincode` and `issue`, where `issue` is `'COD disabled'` for a listed pincode and `'Not serviceable'` for an unlisted one. Prepaid and Pay Later orders are never reported. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "EkartPincode",
        columns: [
          { name: "pincode", type: "int" },
          { name: "city", type: "varchar" },
          { name: "cod_enabled", type: "bool" },
        ],
        primaryKey: ["pincode"],
        note: "One row per pincode Ekart delivers to; `cod_enabled` is 1 when the courier may collect cash there.",
      },
      {
        name: "CustomerOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_name", type: "varchar" },
          { name: "pincode", type: "int" },
          { name: "payment_mode", type: "enum", values: ["COD", "Prepaid", "Pay Later"] },
          { name: "order_value", type: "int" },
        ],
        primaryKey: ["order_id"],
        note: "One row per order, with the delivery pincode the customer entered.",
      },
    ],
    examples: [
      {
        EkartPincode: [
          [560034, "Bengaluru", 1],
          [110092, "Delhi", 0],
          [400076, "Mumbai", 1],
          [682030, "Kochi", 0],
        ],
        CustomerOrder: [
          [9001, "Aarav", 560034, "COD", 1499],
          [9002, "Diya", 110092, "COD", 799],
          [9003, "Kabir", 110092, "Prepaid", 2599],
          [9004, "Meera", 302017, "COD", 349],
          [9005, "Rohan", 682030, "Pay Later", 4999],
          [9006, "Zara", 600042, "Prepaid", 999],
          [9007, "Ishaan", 682030, "COD", 1299],
        ],
      },
    ],
    gen: (rng) => {
      const listed = sample(rng, PINCODES, ri(rng, 1, 8)).map(([pin, city]) => [pin, city, chance(rng, 0.4) ? 0 : 1] as Cell[]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 18);
      const rows: Cell[][] = seq(9001, n).map((id) => [
        id,
        pick(rng, FIRST_NAMES),
        pick(rng, PINCODES)[0],
        pick(rng, ["COD", "COD", "Prepaid", "Pay Later"]),
        ri(rng, 199, 25000),
      ]);
      return { EkartPincode: listed, CustomerOrder: rows };
    },
    solution: [
      "SELECT o.order_id, o.pincode,",
      "       CASE WHEN p.pincode IS NULL THEN 'Not serviceable' ELSE 'COD disabled' END AS issue",
      "FROM CustomerOrder o",
      "LEFT JOIN EkartPincode p ON p.pincode = o.pincode",
      "WHERE o.payment_mode = 'COD'",
      "  AND (p.pincode IS NULL OR p.cod_enabled = 0)",
    ].join("\n"),
    alternatives: [
      [
        "SELECT order_id, pincode, 'COD disabled' AS issue FROM CustomerOrder",
        "WHERE payment_mode = 'COD' AND pincode IN (SELECT pincode FROM EkartPincode WHERE cod_enabled = 0)",
        "UNION ALL",
        "SELECT order_id, pincode, 'Not serviceable' FROM CustomerOrder",
        "WHERE payment_mode = 'COD' AND pincode NOT IN (SELECT pincode FROM EkartPincode)",
      ].join("\n"),
    ],
    hints: [
      "An order whose pincode is not in `EkartPincode` must still come out, so an inner join is not enough.",
      "After a LEFT JOIN, an unlisted pincode shows up as NULL columns from `EkartPincode`.",
      "Decide the `issue` text with CASE on whether the joined pincode is NULL.",
    ],
    editorial: [
      "Two different failures share one report: a pincode Ekart serves without COD, and a pincode Ekart does not serve at all. A **LEFT JOIN** from orders to pincodes handles both in one pass — a listed pincode brings its `cod_enabled` flag along, and an unlisted one brings NULLs.",
      "",
      "The filter keeps COD orders where either the join found nothing (`p.pincode IS NULL`) or it found the pincode with `cod_enabled = 0`. The parentheses matter: without them, AND would bind to only half the condition and Prepaid orders to unlisted pincodes would leak in. The `issue` column is then a CASE on the same NULL test.",
      "",
      "The alternative writes the two failures as two queries — a semi join with `IN` and an anti join with `NOT IN` — glued with `UNION ALL`. `NOT IN` is safe here because `pincode` is the primary key of `EkartPincode` and can never be NULL. Either form is one scan of the orders with a key lookup each.",
    ].join("\n"),
  },

  {
    slug: "flipkart-active-f-assured-listings-per-seller",
    title: "Flipkart: Active F-Assured Listings per Seller",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "The seller-success team reviews how much of each seller's catalogue carries the F-Assured badge (fast, quality-checked fulfilment).",
      "",
      "For **every** seller, return `seller_name` and `f_assured_listings`, the number of their listings that are F-Assured (`is_f_assured` = 1) **and** have `listing_status` = `active`. A seller with none shows 0. Seller names are unique. Order by `f_assured_listings` descending, then `seller_name` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Seller",
        columns: [
          { name: "seller_id", type: "int" },
          { name: "seller_name", type: "varchar" },
        ],
        primaryKey: ["seller_id"],
        note: "One row per registered seller.",
      },
      {
        name: "Listing",
        columns: [
          { name: "listing_id", type: "int" },
          { name: "seller_id", type: "int" },
          { name: "product_title", type: "varchar" },
          { name: "is_f_assured", type: "bool" },
          { name: "listing_status", type: "enum", values: ["active", "paused", "blocked"] },
        ],
        primaryKey: ["listing_id"],
        note: "One row per product listing; `seller_id` always names a seller.",
      },
    ],
    examples: [
      {
        Seller: [
          [1, "Kirana Kart"],
          [2, "Pixel Point"],
          [3, "Desi Weaves"],
          [4, "BlueOak Home"],
        ],
        Listing: [
          [11, 1, "Steel Bottle", 1, "active"],
          [12, 1, "LED Bulb Pack", 1, "paused"],
          [13, 2, "Power Bank", 1, "active"],
          [14, 2, "Wireless Earbuds", 1, "active"],
          [15, 3, "Cotton Kurta", 0, "active"],
          [16, 4, "Study Table", 1, "active"],
          [17, 4, "Non-stick Tawa", 1, "blocked"],
        ],
      },
    ],
    gen: (rng) => {
      const sellers = sample(rng, SELLERS, ri(rng, 1, 6)).map((name, i) => [i + 1, name] as Cell[]);
      const n = chance(rng, 0.08) ? 0 : ri(rng, 1, 20);
      const rows: Cell[][] = seq(11, n).map((id) => [
        id,
        ri(rng, 1, sellers.length),
        pick(rng, LISTING_TITLES),
        chance(rng, 0.55) ? 1 : 0,
        pick(rng, ["active", "active", "paused", "blocked"]),
      ]);
      return { Seller: sellers, Listing: rows };
    },
    solution: [
      "SELECT s.seller_name, COUNT(l.listing_id) AS f_assured_listings",
      "FROM Seller s",
      "LEFT JOIN Listing l",
      "  ON l.seller_id = s.seller_id AND l.is_f_assured = 1 AND l.listing_status = 'active'",
      "GROUP BY s.seller_id, s.seller_name",
      "ORDER BY f_assured_listings DESC, s.seller_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT s.seller_name,",
        "       (SELECT COUNT(*) FROM Listing l WHERE l.seller_id = s.seller_id AND l.is_f_assured = 1 AND l.listing_status = 'active') AS f_assured_listings",
        "FROM Seller s",
        "ORDER BY f_assured_listings DESC, s.seller_name",
      ].join("\n"),
      [
        "SELECT s.seller_name, COALESCE(SUM(CASE WHEN l.is_f_assured = 1 AND l.listing_status = 'active' THEN 1 ELSE 0 END), 0) AS f_assured_listings",
        "FROM Seller s LEFT JOIN Listing l ON l.seller_id = s.seller_id",
        "GROUP BY s.seller_id, s.seller_name",
        "ORDER BY f_assured_listings DESC, s.seller_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Every seller must appear, even with no listings — start from `Seller` and LEFT JOIN.",
      "Where you put the F-Assured and active conditions matters: in WHERE they would turn the LEFT JOIN back into an inner join.",
      "COUNT(column) skips NULLs, so a seller with no matching listing counts 0.",
    ],
    editorial: [
      "The report must list sellers with zero badges too, so the query starts from `Seller` and **LEFT JOINs** the listings. The subtle part is where the two listing conditions go. Put them in `WHERE` and a seller whose only listings are paused would have every joined row filtered out — the seller vanishes instead of showing 0. Put them in the join's `ON` clause and the seller keeps one NULL-filled row.",
      "",
      "`COUNT(l.listing_id)` then counts only real matches, because COUNT of a column skips NULLs; `COUNT(*)` would count the NULL row as 1. Grouping by `seller_id` as well as the name keeps the groups right even if names repeated.",
      "",
      "The alternatives count with a correlated subquery per seller, or join everything and sum a CASE flag (with `COALESCE` for sellers with no listings at all). Each is one pass over the listings.",
    ].join("\n"),
  },

  {
    slug: "flipkart-big-billion-days-orders-per-day",
    title: "Flipkart: Orders Placed Each Day of Big Billion Days",
    difficulty: "EASY",
    topics: ["Aggregation", "Dates"],
    description: [
      "During the Big Billion Days sale the war room tracks orders day by day. This year's sale ran from **2024-09-27 00:00:00 to 2024-10-06 23:59:59**.",
      "",
      "For each calendar day of the sale, return `sale_day` (as 'YYYY-MM-DD') and `orders`, the number of orders placed that day whose `order_status` is not `cancelled`. Orders placed before or after the sale are ignored, and days with no such order are not listed. Order by `sale_day`.",
    ].join("\n"),
    tables: [
      {
        name: "SaleOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "placed_at", type: "datetime" },
          { name: "order_status", type: "enum", values: ["delivered", "shipped", "cancelled", "returned"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per order; `placed_at` is the moment it was placed (IST).",
      },
    ],
    examples: [
      {
        SaleOrder: [
          [1, 101, "2024-09-26 23:59:59", "delivered"],
          [2, 102, "2024-09-27 00:00:00", "delivered"],
          [3, 103, "2024-09-27 14:22:10", "returned"],
          [4, 101, "2024-09-27 20:05:44", "cancelled"],
          [5, 104, "2024-09-30 11:40:00", "shipped"],
          [6, 105, "2024-10-06 23:59:59", "delivered"],
          [7, 106, "2024-10-07 00:00:00", "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 25);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 101, 115),
        chance(rng, 0.15)
          ? pick(rng, ["2024-09-26 23:59:59", "2024-09-27 00:00:00", "2024-10-06 23:59:59", "2024-10-07 00:00:00"])
          : atTime(rng, dateBetween(rng, "2024-09-25", "2024-10-08")),
        pick(rng, ["delivered", "delivered", "shipped", "cancelled", "returned"]),
      ]);
      return { SaleOrder: rows };
    },
    solution: [
      "SELECT LEFT(placed_at, 10) AS sale_day, COUNT(*) AS orders",
      "FROM SaleOrder",
      "WHERE order_status <> 'cancelled'",
      "  AND placed_at >= '2024-09-27' AND placed_at < '2024-10-07'",
      "GROUP BY LEFT(placed_at, 10)",
      "ORDER BY sale_day",
    ].join("\n"),
    alternatives: [
      [
        "SELECT DATE_FORMAT(placed_at, '%Y-%m-%d') AS sale_day, COUNT(order_id) AS orders",
        "FROM SaleOrder",
        "WHERE order_status IN ('delivered', 'shipped', 'returned')",
        "  AND placed_at BETWEEN '2024-09-27 00:00:00' AND '2024-10-06 23:59:59'",
        "GROUP BY DATE_FORMAT(placed_at, '%Y-%m-%d')",
        "ORDER BY sale_day",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Bucket each order by the date part of `placed_at`.",
      "A half-open range — from the first day, up to but not including the day after the sale — catches every second of the last day.",
      "Filter the cancelled orders before grouping.",
    ],
    editorial: [
      "Each order belongs to the calendar day in the first ten characters of `placed_at`, so `LEFT(placed_at, 10)` is the bucket and `COUNT(*)` per bucket is the answer. Grouping by the same expression that is selected keeps MySQL's ONLY_FULL_GROUP_BY mode happy.",
      "",
      "The sale window is the part to get right. Writing `placed_at <= '2024-10-06'` would compare against midnight at the *start* of the last day and lose almost all of it. The half-open range `placed_at >= '2024-09-27' AND placed_at < '2024-10-07'` covers every second of the ten days without having to spell out 23:59:59, and an order at exactly midnight on 2024-10-07 is correctly out.",
      "",
      "Cancelled orders are removed in WHERE, before grouping, so a day whose only orders were cancelled never forms a group. The alternative formats the day with `DATE_FORMAT` and writes the window as an inclusive BETWEEN. With an index on `placed_at` the range is read directly.",
    ].join("\n"),
  },

  {
    slug: "flipkart-product-questions-still-unanswered",
    title: "Flipkart: Product Questions Still Waiting for an Answer",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "Shoppers ask questions on product pages, and sellers, past buyers or the brand answer them. Moderation hides answers that break the guidelines. The catalogue team wants the questions shoppers still see with no answer.",
      "",
      "Return every question that has **no visible answer** — no answer at all, or only answers with `is_hidden` = 1. Return `question_id`, `product_id` and `asked_on`, ordered by `asked_on`, then `question_id`.",
    ].join("\n"),
    tables: [
      {
        name: "ProductQuestion",
        columns: [
          { name: "question_id", type: "int" },
          { name: "product_id", type: "int" },
          { name: "asked_on", type: "date" },
        ],
        primaryKey: ["question_id"],
        note: "One row per question asked on a product page.",
      },
      {
        name: "QnaAnswer",
        columns: [
          { name: "answer_id", type: "int" },
          { name: "question_id", type: "int" },
          { name: "answered_by", type: "enum", values: ["seller", "buyer", "brand"] },
          { name: "is_hidden", type: "bool" },
        ],
        primaryKey: ["answer_id"],
        note: "One row per answer; `is_hidden` = 1 when moderation took it down. `question_id` always names a question.",
      },
    ],
    examples: [
      {
        ProductQuestion: [
          [1, 501, "2024-08-02"],
          [2, 501, "2024-08-05"],
          [3, 502, "2024-08-01"],
          [4, 503, "2024-08-05"],
          [5, 503, "2024-08-07"],
        ],
        QnaAnswer: [
          [10, 1, "seller", 0],
          [11, 2, "buyer", 1],
          [12, 3, "buyer", 1],
          [13, 3, "brand", 0],
          [14, 5, "buyer", 1],
          [15, 5, "seller", 1],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const qs: Cell[][] = seq(1, n).map((id) => [id, ri(rng, 501, 506), dateBetween(rng, "2024-08-01", "2024-08-20")]);
      const m = chance(rng, 0.08) ? 0 : ri(rng, 1, 15);
      const as: Cell[][] = seq(10, m).map((id) => [id, ri(rng, 1, n), pick(rng, ["seller", "buyer", "brand"]), chance(rng, 0.35) ? 1 : 0]);
      return { ProductQuestion: qs, QnaAnswer: as };
    },
    solution: [
      "SELECT q.question_id, q.product_id, q.asked_on",
      "FROM ProductQuestion q",
      "WHERE NOT EXISTS (",
      "  SELECT 1 FROM QnaAnswer a",
      "  WHERE a.question_id = q.question_id AND a.is_hidden = 0",
      ")",
      "ORDER BY q.asked_on, q.question_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT q.question_id, q.product_id, q.asked_on",
        "FROM ProductQuestion q",
        "LEFT JOIN QnaAnswer a ON a.question_id = q.question_id AND a.is_hidden = 0",
        "WHERE a.answer_id IS NULL",
        "ORDER BY q.asked_on, q.question_id",
      ].join("\n"),
      [
        "SELECT question_id, product_id, asked_on FROM ProductQuestion",
        "WHERE question_id NOT IN (SELECT question_id FROM QnaAnswer WHERE is_hidden = 0)",
        "ORDER BY asked_on, question_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "You want questions for which a certain kind of row does *not* exist — an anti join.",
      "Only visible answers count, so the hidden ones must be excluded inside the check, not after it.",
      "NOT EXISTS, a LEFT JOIN with IS NULL, or NOT IN all express \"no such row\".",
    ],
    editorial: [
      "This is an **anti join**: keep a question when there is no row in `QnaAnswer` that is both for this question and visible. `NOT EXISTS` says exactly that — the correlated subquery looks for one visible answer, and the question survives only if it finds none.",
      "",
      "The visibility test belongs inside the subquery. A question whose only answers were hidden still has answer rows, so checking for \"no answers\" and then filtering hidden ones afterwards would wrongly drop it. The same rule applies to the LEFT JOIN version: `a.is_hidden = 0` must sit in the `ON` clause, so a question with only hidden answers gets a NULL-filled row and passes `a.answer_id IS NULL`.",
      "",
      "The `NOT IN` form is safe because `question_id` in the answers is never NULL. All three read each question once with an index lookup into the answers. Ties on `asked_on` are broken by `question_id`.",
    ].join("\n"),
  },

  {
    slug: "flipkart-pay-later-accounts-past-their-limit",
    title: "Flipkart: Pay Later Accounts Spending Past Their Limit",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "Flipkart Pay Later lets a customer buy now and repay at the end of the month, up to a credit limit. The risk team wants the accounts where an approval bug let unpaid spends exceed the limit.",
      "",
      "For each account, its **outstanding** amount is the sum of its spends with `repaid` = 0. Return `customer_name`, `credit_limit` and `outstanding` for every account whose outstanding is **strictly greater** than its `credit_limit`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "PayLaterAccount",
        columns: [
          { name: "account_id", type: "int" },
          { name: "customer_name", type: "varchar" },
          { name: "credit_limit", type: "int" },
        ],
        primaryKey: ["account_id"],
        note: "One row per Pay Later account; `credit_limit` is in rupees.",
      },
      {
        name: "PayLaterSpend",
        columns: [
          { name: "spend_id", type: "int" },
          { name: "account_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "repaid", type: "bool" },
        ],
        primaryKey: ["spend_id"],
        note: "One row per purchase charged to Pay Later; `repaid` = 1 once the customer has paid it back.",
      },
    ],
    examples: [
      {
        PayLaterAccount: [
          [1, "Aarav", 10000],
          [2, "Diya", 5000],
          [3, "Kabir", 20000],
          [4, "Meera", 5000],
        ],
        PayLaterSpend: [
          [1, 1, 6000, 0],
          [2, 1, 4500, 0],
          [3, 2, 3000, 0],
          [4, 2, 4000, 1],
          [5, 3, 25000, 1],
          [6, 4, 5000, 0],
          [7, 4, 1, 1],
        ],
      },
    ],
    gen: (rng) => {
      const k = ri(rng, 1, 6);
      const accounts: Cell[][] = seq(1, k).map((id) => [id, pick(rng, FIRST_NAMES), roundTo(rng, 5000, 20000, 5000)]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 22);
      const spends: Cell[][] = seq(1, n).map((id) => [id, ri(rng, 1, k), roundTo(rng, 500, 12000, 500), chance(rng, 0.35) ? 1 : 0]);
      // Now and then an account pushed exactly to, or just over, its limit.
      if (chance(rng, 0.6)) {
        const a = pick(rng, accounts);
        spends.push([n + 1, a[0]!, (a[2] as number) + (chance(rng, 0.5) ? 0 : 500), 0]);
      }
      return { PayLaterAccount: accounts, PayLaterSpend: spends };
    },
    solution: [
      "SELECT a.customer_name, a.credit_limit, SUM(s.amount) AS outstanding",
      "FROM PayLaterAccount a",
      "JOIN PayLaterSpend s ON s.account_id = a.account_id",
      "WHERE s.repaid = 0",
      "GROUP BY a.account_id, a.customer_name, a.credit_limit",
      "HAVING SUM(s.amount) > a.credit_limit",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.customer_name, a.credit_limit, t.outstanding",
        "FROM PayLaterAccount a",
        "JOIN (SELECT account_id, SUM(CASE WHEN repaid = 0 THEN amount ELSE 0 END) AS outstanding FROM PayLaterSpend GROUP BY account_id) t",
        "  ON t.account_id = a.account_id",
        "WHERE t.outstanding > a.credit_limit",
      ].join("\n"),
    ],
    hints: [
      "Add up the unpaid spends per account first.",
      "A condition on a SUM goes in HAVING, not WHERE.",
      "\"Strictly greater\" — an account sitting exactly at its limit is fine.",
    ],
    editorial: [
      "Outstanding is a per-account total, so join the spends to their account, keep only the unpaid ones in `WHERE`, and `GROUP BY` the account. The comparison with the limit uses the aggregate, so it belongs in `HAVING SUM(s.amount) > a.credit_limit`. Because `credit_limit` is also selected and compared, it is listed in the GROUP BY; it is a column of the account, so this changes no group.",
      "",
      "Repaid spends are filtered before grouping, so an account whose every spend is repaid forms no group and cannot be reported — it owes nothing. The comparison is strict: an account at exactly its limit has used all of it, which is allowed.",
      "",
      "The alternative computes the outstanding in a derived table with a conditional sum and filters with a plain WHERE after joining. Both scan the spends once; an index on `PayLaterSpend(account_id)` serves the join.",
    ].join("\n"),
  },

  {
    slug: "flipkart-shopsy-reseller-store-handles",
    title: "Flipkart: Shopsy Reseller Store Handles",
    difficulty: "EASY",
    topics: ["Strings"],
    description: [
      "Shopsy resellers share their store with a short handle in WhatsApp links. Store names were typed by the resellers themselves, so some carry stray spaces at either end and odd capitals.",
      "",
      "Build each reseller's `handle`: the store name with leading and trailing spaces removed, in lower case, with every space replaced by a hyphen, then a hyphen and the **first three letters of the city in upper case**. If `city` is NULL, the handle is the name part alone. Return `reseller_id` and `handle`, ordered by `reseller_id`.",
    ].join("\n"),
    tables: [
      {
        name: "ShopsyReseller",
        columns: [
          { name: "reseller_id", type: "int" },
          { name: "store_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["reseller_id"],
        note: "One row per reseller. Words inside `store_name` are separated by single spaces; `city` is NULL when the reseller skipped it.",
      },
    ],
    examples: [
      {
        ShopsyReseller: [
          [1, "Meera Sarees", "Jaipur"],
          [2, "  Kids Corner ", "Pune"],
          [3, "GLOW BEAUTY HUB", "Kochi"],
          [4, "Rakhi Gifts", null],
          [5, "trendy kurtis  ", "Bengaluru"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const base = pick(rng, STORE_NAMES);
        const cased = pick(rng, [base, base, base.toUpperCase(), base.toLowerCase()]);
        const padded = `${" ".repeat(chance(rng, 0.3) ? ri(rng, 1, 2) : 0)}${cased}${" ".repeat(chance(rng, 0.3) ? ri(rng, 1, 2) : 0)}`;
        return [id, padded, chance(rng, 0.15) ? null : pick(rng, ["Jaipur", "Pune", "Kochi", "Bengaluru", "Surat", "Lucknow", "Indore"])];
      });
      return { ShopsyReseller: rows };
    },
    solution: [
      "SELECT reseller_id,",
      "       CONCAT(LOWER(REPLACE(TRIM(store_name), ' ', '-')), IFNULL(CONCAT('-', UPPER(LEFT(city, 3))), '')) AS handle",
      "FROM ShopsyReseller",
      "ORDER BY reseller_id",
    ].join("\n"),
    alternatives: [
      "SELECT reseller_id, CONCAT_WS('-', LOWER(REPLACE(TRIM(store_name), ' ', '-')), UPPER(SUBSTRING(city, 1, 3))) AS handle FROM ShopsyReseller ORDER BY reseller_id",
      [
        "SELECT reseller_id,",
        "       CASE WHEN city IS NULL THEN REPLACE(LCASE(TRIM(store_name)), ' ', '-')",
        "            ELSE CONCAT(REPLACE(LCASE(TRIM(store_name)), ' ', '-'), '-', UCASE(LEFT(city, 3))) END AS handle",
        "FROM ShopsyReseller ORDER BY reseller_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Trim first, then replace spaces — otherwise the stray outer spaces become hyphens.",
      "`CONCAT` returns NULL if any argument is NULL; that is useful for the optional city part.",
      "`CONCAT_WS` skips NULL arguments, so it can drop the city suffix by itself.",
    ],
    editorial: [
      "The handle is a chain of string functions, and the order of the steps matters. `TRIM` must run before `REPLACE`, or the spaces at either end would turn into leading and trailing hyphens. `LOWER` can run before or after the replacement, since hyphens have no case. The suffix is `'-'` followed by `UPPER(LEFT(city, 3))`.",
      "",
      "The NULL city is handled by a property of `CONCAT`: if any argument is NULL, the result is NULL. So `CONCAT('-', UPPER(LEFT(city, 3)))` is NULL exactly when the city is missing, and `IFNULL(…, '')` turns that into an empty suffix. `CONCAT_WS('-', name, suffix)` does the same in one call because it skips NULL arguments along with their separator, and the CASE alternative spells the two cases out.",
      "",
      "Each row is transformed independently, so the query is a single scan; the ORDER BY on the key fixes the output order.",
    ].join("\n"),
  },

  {
    slug: "flipkart-instant-discount-from-bank-offers",
    title: "Flipkart: Instant Discount From Each Bank Offer",
    difficulty: "EASY",
    topics: ["Joins", "Conditional Logic"],
    description: [
      "At checkout a card payment may carry a bank offer: a percentage off the amount, only when the amount reaches the offer's minimum, and never more than the offer's cap. Finance reconciles what each payment actually got.",
      "",
      "For every payment return `payment_id`, `amount`, `instant_discount` and `amount_payable` (`amount` minus the discount). The discount is 0 when `offer_id` is NULL or the amount is **below** `min_order_value`; otherwise it is `amount * discount_pct / 100`, capped at `max_discount` (use the smaller of the two). Order by `payment_id`.",
    ].join("\n"),
    tables: [
      {
        name: "BankOffer",
        columns: [
          { name: "offer_id", type: "int" },
          { name: "bank_name", type: "varchar" },
          { name: "discount_pct", type: "int" },
          { name: "min_order_value", type: "int" },
          { name: "max_discount", type: "int" },
        ],
        primaryKey: ["offer_id"],
        note: "One row per card offer; amounts in rupees.",
      },
      {
        name: "CardPayment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "order_id", type: "int" },
          { name: "offer_id", type: "int" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["payment_id"],
        note: "One row per card payment; `offer_id` is NULL when no offer was applied, and otherwise always names an offer.",
      },
    ],
    examples: [
      {
        BankOffer: [
          [1, "HDFC Bank", 10, 5000, 1500],
          [2, "SBI Card", 10, 3000, 750],
        ],
        CardPayment: [
          [1, 9101, 1, 12000],
          [2, 9102, 1, 4990],
          [3, 9103, 1, 25000],
          [4, 9104, 2, 3000],
          [5, 9105, null, 8000],
          [6, 9106, 2, 9999],
        ],
      },
    ],
    gen: (rng) => {
      const k = ri(rng, 1, 4);
      const offers: Cell[][] = seq(1, k).map((id) => [id, pick(rng, BANKS), pick(rng, [5, 10, 10, 15]), pick(rng, [1500, 3000, 5000]), pick(rng, [250, 750, 1500])]);
      const n = ri(rng, 1, 14);
      const pays: Cell[][] = seq(1, n).map((id) => {
        const offer = chance(rng, 0.25) ? null : pick(rng, offers);
        const amount = offer && chance(rng, 0.2) ? (offer[3] as number) - pick(rng, [0, 10]) : roundTo(rng, 500, 40000, 10);
        return [id, 9100 + id, offer ? offer[0]! : null, amount];
      });
      return { BankOffer: offers, CardPayment: pays };
    },
    solution: [
      "SELECT payment_id, amount, instant_discount, amount - instant_discount AS amount_payable",
      "FROM (",
      "  SELECT p.payment_id, p.amount,",
      "         CASE WHEN o.offer_id IS NULL OR p.amount < o.min_order_value THEN 0",
      "              ELSE LEAST(p.amount * o.discount_pct / 100, o.max_discount) END AS instant_discount",
      "  FROM CardPayment p",
      "  LEFT JOIN BankOffer o ON o.offer_id = p.offer_id",
      ") t",
      "ORDER BY payment_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT p.payment_id, p.amount,",
        "       IF(p.amount >= o.min_order_value, LEAST(p.amount * o.discount_pct / 100, o.max_discount), 0) AS instant_discount,",
        "       p.amount - IF(p.amount >= o.min_order_value, LEAST(p.amount * o.discount_pct / 100, o.max_discount), 0) AS amount_payable",
        "FROM CardPayment p LEFT JOIN BankOffer o ON o.offer_id = p.offer_id",
        "ORDER BY p.payment_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Payments without an offer must still be listed — LEFT JOIN the offers.",
      "`LEAST(a, b)` gives the smaller of the percentage discount and the cap.",
      "Compute the discount once (in a derived table) and subtract it, instead of repeating the CASE.",
    ],
    editorial: [
      "Each payment needs its offer's terms beside it, and payments without an offer still belong in the report, so the payments are **LEFT JOINed** to the offers. Then the discount is a CASE: nothing when there is no offer (`o.offer_id IS NULL`) or the amount is below the minimum, otherwise the percentage `amount * discount_pct / 100` limited by `LEAST(…, max_discount)`.",
      "",
      "The boundary is inclusive — an amount equal to `min_order_value` qualifies — so the zero branch tests `amount < min_order_value`. Computing the discount inside a derived table lets the outer query subtract it without repeating the logic.",
      "",
      "The alternative relies on NULL logic: with no offer, `p.amount >= o.min_order_value` is NULL, and `IF(NULL, …, 0)` takes the else branch, so a separate NULL test is not needed. Both are one pass over the payments with a key lookup into the offers.",
    ].join("\n"),
  },

  // ──────────────────────────── MEDIUM ────────────────────────────
  {
    slug: "flipkart-refund-sla-breaches-by-category",
    title: "Flipkart: Refund SLA Breaches by Product Category",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Dates", "Conditional Logic"],
    description: [
      "Flipkart promises a refund within **5 days** of the return being picked up. The returns team audits the promise on **2024-11-30**.",
      "",
      "Only returns that have been picked up (`picked_up_on` not NULL) are audited. A picked-up return is a **breach** if it was refunded more than 5 days after pickup, or if it is still not refunded and the audit date is more than 5 days after pickup. A refund exactly 5 days after pickup is on time. For each category with at least one picked-up return, return `category`, `picked_up` (its picked-up returns) and `breaches`. Order by `breaches` descending, then `category`.",
    ].join("\n"),
    tables: [
      {
        name: "ReturnRequest",
        columns: [
          { name: "return_id", type: "int" },
          { name: "category", type: "varchar" },
          { name: "picked_up_on", type: "date" },
          { name: "refunded_on", type: "date" },
        ],
        primaryKey: ["return_id"],
        note: "One row per return. `picked_up_on` is NULL while the courier has not collected the item; `refunded_on` is NULL until the refund is credited (never before pickup, never after the audit date).",
      },
    ],
    examples: [
      {
        ReturnRequest: [
          [1, "Mobiles", "2024-11-10", "2024-11-15"],
          [2, "Mobiles", "2024-11-10", "2024-11-16"],
          [3, "Fashion", "2024-11-20", null],
          [4, "Fashion", "2024-11-25", null],
          [5, "Home", null, null],
          [6, "Fashion", "2024-11-01", "2024-11-03"],
          [7, "Books", "2024-11-24", null],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 20);
      const cats = sample(rng, CATEGORIES, ri(rng, 1, 4));
      const rows: Cell[][] = seq(1, n).map((id) => {
        const picked = chance(rng, 0.15) ? null : chance(rng, 0.15) ? pick(rng, ["2024-11-24", "2024-11-25"]) : dateBetween(rng, "2024-11-01", "2024-11-30");
        let refunded: string | null = null;
        if (picked && !chance(rng, 0.3)) {
          const r = addDays(picked, chance(rng, 0.25) ? pick(rng, [5, 6]) : ri(rng, 0, 10));
          refunded = r > "2024-11-30" ? null : r;
        }
        return [id, pick(rng, cats), picked, refunded];
      });
      return { ReturnRequest: rows };
    },
    solution: [
      "SELECT category,",
      "       COUNT(*) AS picked_up,",
      "       SUM(CASE WHEN DATEDIFF(COALESCE(refunded_on, '2024-11-30'), picked_up_on) > 5 THEN 1 ELSE 0 END) AS breaches",
      "FROM ReturnRequest",
      "WHERE picked_up_on IS NOT NULL",
      "GROUP BY category",
      "ORDER BY breaches DESC, category",
    ].join("\n"),
    alternatives: [
      [
        "SELECT category, COUNT(picked_up_on) AS picked_up,",
        "       COUNT(CASE WHEN refunded_on IS NULL AND DATEDIFF('2024-11-30', picked_up_on) > 5 THEN 1",
        "                  WHEN refunded_on IS NOT NULL AND refunded_on > DATE_ADD(picked_up_on, INTERVAL 5 DAY) THEN 1 END) AS breaches",
        "FROM ReturnRequest",
        "GROUP BY category",
        "HAVING COUNT(picked_up_on) > 0",
        "ORDER BY breaches DESC, category",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Returns not yet picked up are outside the audit — filter them first.",
      "A pending refund is judged against the audit date as if it were refunded on that day.",
      "Count the breaches with a CASE inside SUM (or COUNT).",
    ],
    editorial: [
      "Two kinds of breach share one rule once you notice that a refund still pending on audit day is late exactly when it *would* be late if it were credited on audit day. `COALESCE(refunded_on, '2024-11-30')` makes that substitution, and `DATEDIFF(that, picked_up_on) > 5` is then the breach test for every audited row. Five days exactly is on time, so the comparison is strict.",
      "",
      "Returns that were never picked up are removed in WHERE, so they count neither as audited nor as breaches, and a category made only of them never forms a group. `SUM(CASE … THEN 1 ELSE 0 END)` counts breaches beside `COUNT(*)` in the same pass — conditional aggregation.",
      "",
      "The alternative spells the two cases out, uses `COUNT(CASE …)` (a CASE without ELSE is NULL, which COUNT skips), compares against `DATE_ADD(picked_up_on, INTERVAL 5 DAY)`, and drops never-picked categories with HAVING instead of WHERE. Either is one scan of the returns.",
    ].join("\n"),
  },

  {
    slug: "flipkart-months-supercoins-burned-beat-earned",
    title: "Flipkart: Months Members Burned More SuperCoins Than Earned",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Dates", "Conditional Logic"],
    description: [
      "The SuperCoin ledger records every coin a member earns on a purchase, burns on a reward, or loses to expiry. The loyalty analysts want the member-months where a member spent down their balance.",
      "",
      "For each member and calendar month with ledger activity, `earned` is the total coins of `earn` entries and `burned` the total of `burn` entries (`expire` entries count as neither). Return `member_id`, `ledger_month` ('YYYY-MM'), `earned` and `burned` for every member-month where **burned is strictly greater than earned** — a month with burns and no earns has `earned` 0. Order by `member_id`, then `ledger_month`.",
    ].join("\n"),
    tables: [
      {
        name: "SuperCoinLedger",
        columns: [
          { name: "entry_id", type: "int" },
          { name: "member_id", type: "int" },
          { name: "entry_at", type: "datetime" },
          { name: "coins", type: "int" },
          { name: "entry_type", type: "enum", values: ["earn", "burn", "expire"] },
        ],
        primaryKey: ["entry_id"],
        note: "One row per ledger entry; `coins` is always positive — the type says which way it moved.",
      },
    ],
    examples: [
      {
        SuperCoinLedger: [
          [1, 7, "2024-07-03 10:15:00", 120, "earn"],
          [2, 7, "2024-07-21 19:02:11", 200, "burn"],
          [3, 7, "2024-08-02 08:00:00", 50, "earn"],
          [4, 7, "2024-08-30 22:41:09", 50, "burn"],
          [5, 9, "2024-07-11 13:30:00", 300, "expire"],
          [6, 9, "2024-07-12 09:05:44", 40, "burn"],
          [7, 9, "2024-08-01 00:00:00", 500, "earn"],
        ],
      },
    ],
    gen: (rng) => {
      const members = ri(rng, 1, 4);
      const n = ri(rng, 1, 20);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 1, members),
        atTime(rng, dateBetween(rng, "2024-06-01", "2024-09-30")),
        chance(rng, 0.2) ? 100 : roundTo(rng, 10, 500, 10),
        pick(rng, ["earn", "earn", "burn", "burn", "expire"]),
      ]);
      return { SuperCoinLedger: rows };
    },
    solution: [
      "SELECT member_id, ledger_month, earned, burned",
      "FROM (",
      "  SELECT member_id, LEFT(entry_at, 7) AS ledger_month,",
      "         SUM(CASE WHEN entry_type = 'earn' THEN coins ELSE 0 END) AS earned,",
      "         SUM(CASE WHEN entry_type = 'burn' THEN coins ELSE 0 END) AS burned",
      "  FROM SuperCoinLedger",
      "  GROUP BY member_id, LEFT(entry_at, 7)",
      ") m",
      "WHERE burned > earned",
      "ORDER BY member_id, ledger_month",
    ].join("\n"),
    alternatives: [
      [
        "SELECT member_id, DATE_FORMAT(entry_at, '%Y-%m') AS ledger_month,",
        "       SUM(IF(entry_type = 'earn', coins, 0)) AS earned,",
        "       SUM(IF(entry_type = 'burn', coins, 0)) AS burned",
        "FROM SuperCoinLedger",
        "GROUP BY member_id, DATE_FORMAT(entry_at, '%Y-%m')",
        "HAVING SUM(IF(entry_type = 'burn', coins, 0)) > SUM(IF(entry_type = 'earn', coins, 0))",
        "ORDER BY member_id, ledger_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The month bucket is the first seven characters of the timestamp.",
      "One GROUP BY can produce both totals if each SUM only adds its own entry type.",
      "Filter on the two totals after grouping — HAVING, or WHERE on a derived table.",
    ],
    editorial: [
      "Both totals come from the same rows, so instead of two queries the solution uses **conditional aggregation**: `SUM(CASE WHEN entry_type = 'earn' THEN coins ELSE 0 END)` adds only the earn entries of a group and contributes 0 for the rest, and a second SUM does the same for burns. Expiry entries fall into neither branch, as the statement asks. The `ELSE 0` matters: a month with burns but no earns gets `earned = 0`, not NULL, so the comparison still works.",
      "",
      "The group is the member and the month, `LEFT(entry_at, 7)`. Grouping by the very expression that is selected satisfies MySQL's ONLY_FULL_GROUP_BY. The filter compares two aggregates, so it runs after grouping — on a derived table here, or as a HAVING in the alternative, which formats the month with `DATE_FORMAT` and uses `IF` in place of CASE.",
      "",
      "Equal totals are not \"more\" and are left out. It is one scan of the ledger plus the grouping.",
    ].join("\n"),
  },

  {
    slug: "flipkart-pincodes-where-cod-parcels-come-back",
    title: "Flipkart: Pincodes Where COD Parcels Keep Coming Back",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "When a cash-on-delivery customer refuses the parcel, it goes back to the seller — an **RTO** (return to origin) that costs two shipping legs. Ekart wants the pincodes where COD should be reconsidered.",
      "",
      "Only **finished COD** shipments count: `payment_mode` = `COD` and `outcome` either `delivered` or `rto` (in-transit parcels are not finished). Report a pincode when it has **at least 4** finished COD shipments and RTOs are **at least 25%** of them. Return `city`, `pincode`, `finished_cod` and `rto_shipments`, ordered by `rto_shipments` descending, then `pincode`.",
    ].join("\n"),
    tables: [
      {
        name: "EkartPincode",
        columns: [
          { name: "pincode", type: "int" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["pincode"],
        note: "One row per pincode Ekart serves.",
      },
      {
        name: "Shipment",
        columns: [
          { name: "shipment_id", type: "int" },
          { name: "pincode", type: "int" },
          { name: "payment_mode", type: "enum", values: ["COD", "Prepaid"] },
          { name: "outcome", type: "enum", values: ["delivered", "rto", "in_transit"] },
        ],
        primaryKey: ["shipment_id"],
        note: "One row per parcel; `pincode` always names a row of `EkartPincode`.",
      },
    ],
    examples: [
      {
        EkartPincode: [
          [302017, "Jaipur"],
          [560034, "Bengaluru"],
          [700091, "Kolkata"],
        ],
        Shipment: [
          [1, 302017, "COD", "rto"],
          [2, 302017, "COD", "delivered"],
          [3, 302017, "COD", "delivered"],
          [4, 302017, "COD", "delivered"],
          [5, 302017, "COD", "in_transit"],
          [6, 560034, "COD", "rto"],
          [7, 560034, "Prepaid", "delivered"],
          [8, 560034, "COD", "delivered"],
          [9, 560034, "Prepaid", "rto"],
          [10, 700091, "COD", "rto"],
          [11, 700091, "COD", "rto"],
          [12, 700091, "COD", "delivered"],
          [13, 700091, "COD", "delivered"],
          [14, 700091, "COD", "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      const pins = sample(rng, PINCODES, ri(rng, 1, 4)).map(([p, c]) => [p, c] as Cell[]);
      const n = ri(rng, 4, 30);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        pick(rng, pins)[0]!,
        pick(rng, ["COD", "COD", "COD", "Prepaid"]),
        pick(rng, ["delivered", "delivered", "rto", "in_transit"]),
      ]);
      return { EkartPincode: pins, Shipment: rows };
    },
    solution: [
      "SELECT p.city, s.pincode,",
      "       COUNT(*) AS finished_cod,",
      "       SUM(CASE WHEN s.outcome = 'rto' THEN 1 ELSE 0 END) AS rto_shipments",
      "FROM Shipment s",
      "JOIN EkartPincode p ON p.pincode = s.pincode",
      "WHERE s.payment_mode = 'COD' AND s.outcome IN ('delivered', 'rto')",
      "GROUP BY p.city, s.pincode",
      "HAVING COUNT(*) >= 4 AND 4 * SUM(CASE WHEN s.outcome = 'rto' THEN 1 ELSE 0 END) >= COUNT(*)",
      "ORDER BY rto_shipments DESC, s.pincode",
    ].join("\n"),
    alternatives: [
      [
        "SELECT p.city, t.pincode, t.finished_cod, t.rto_shipments",
        "FROM (SELECT pincode,",
        "             COUNT(CASE WHEN outcome <> 'in_transit' THEN 1 END) AS finished_cod,",
        "             COUNT(CASE WHEN outcome = 'rto' THEN 1 END) AS rto_shipments",
        "      FROM Shipment WHERE payment_mode = 'COD' GROUP BY pincode) t",
        "JOIN EkartPincode p ON p.pincode = t.pincode",
        "WHERE t.finished_cod >= 4 AND t.rto_shipments * 100 >= t.finished_cod * 25",
        "ORDER BY t.rto_shipments DESC, t.pincode",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Decide which rows are in scope (COD, finished) before counting anything.",
      "Count all finished shipments and only the RTOs in the same GROUP BY.",
      "Compare the share with integers — `4 * rto >= finished` — to avoid division altogether.",
    ],
    editorial: [
      "First narrow the rows: prepaid parcels never face a doorstep refusal and in-transit parcels have no outcome yet, so `WHERE payment_mode = 'COD' AND outcome IN ('delivered', 'rto')` leaves exactly the finished COD shipments. Grouping by pincode (with its city from the join) gives `COUNT(*)` as `finished_cod` and a CASE inside SUM as `rto_shipments`.",
      "",
      "Both conditions are on aggregates and go in HAVING: at least four finished shipments, so a single unlucky parcel cannot flag a pincode, and an RTO share of at least 25%. Writing the share as `4 * rto >= finished` keeps it in integers — no rounding, and a pincode at exactly a quarter is included as \"at least\" requires.",
      "",
      "The alternative counts inside a derived table with `COUNT(CASE …)` and filters with `rto * 100 >= finished * 25` after the join. Both read the shipments once; the join to `EkartPincode` is a key lookup per group.",
    ].join("\n"),
  },

  {
    slug: "flipkart-products-rated-lower-after-the-sale",
    title: "Flipkart: Products Rated Lower After Big Billion Days",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Dates", "Conditional Logic"],
    description: [
      "The phones category manager suspects that some models sold in a rush during Big Billion Days (2024-09-27 to 2024-10-06) disappointed buyers. Reviews written **before** the sale (before 2024-09-27) are compared with reviews written **after** it (after 2024-10-06); reviews written during the sale are ignored.",
      "",
      "Return the products with **at least 2 reviews in each period** whose average rating after the sale is **strictly lower** than before it. Return `product_name`, `before_avg` and `after_avg`, each average rounded to 2 decimal places, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Product",
        columns: [
          { name: "product_id", type: "int" },
          { name: "product_name", type: "varchar" },
        ],
        primaryKey: ["product_id"],
        note: "One row per phone model.",
      },
      {
        name: "ProductReview",
        columns: [
          { name: "review_id", type: "int" },
          { name: "product_id", type: "int" },
          { name: "rating", type: "int" },
          { name: "reviewed_on", type: "date" },
        ],
        primaryKey: ["review_id"],
        note: "One row per review; `rating` is 1 to 5 stars. `product_id` always names a product.",
      },
    ],
    examples: [
      {
        Product: [
          [1, "Nova X5"],
          [2, "Pixelon 8a"],
          [3, "Redstar 12"],
        ],
        ProductReview: [
          [1, 1, 5, "2024-09-10"],
          [2, 1, 4, "2024-09-26"],
          [3, 1, 1, "2024-10-01"],
          [4, 1, 4, "2024-10-07"],
          [5, 1, 3, "2024-10-20"],
          [6, 2, 4, "2024-09-01"],
          [7, 2, 4, "2024-09-15"],
          [8, 2, 5, "2024-10-12"],
          [9, 2, 3, "2024-10-30"],
          [10, 3, 5, "2024-09-20"],
          [11, 3, 2, "2024-10-15"],
          [12, 3, 2, "2024-10-16"],
        ],
      },
    ],
    gen: (rng) => {
      const products = sample(rng, PHONES, ri(rng, 1, 5)).map((name, i) => [i + 1, name] as Cell[]);
      const rows: Cell[][] = [];
      let id = 1;
      for (const p of products) {
        const drop = chance(rng, 0.5);
        for (let i = ri(rng, 0, 5); i > 0; i--) rows.push([id++, p[0]!, ri(rng, 3, 5), chance(rng, 0.15) ? "2024-09-26" : dateBetween(rng, "2024-08-01", "2024-09-26")]);
        for (let i = ri(rng, 0, 2); i > 0; i--) rows.push([id++, p[0]!, ri(rng, 1, 5), pick(rng, ["2024-09-27", "2024-10-02", "2024-10-06"])]);
        for (let i = ri(rng, 0, 5); i > 0; i--) rows.push([id++, p[0]!, drop ? ri(rng, 1, 4) : ri(rng, 3, 5), chance(rng, 0.15) ? "2024-10-07" : dateBetween(rng, "2024-10-07", "2024-11-15")]);
      }
      return { Product: products, ProductReview: rows };
    },
    solution: [
      "SELECT p.product_name,",
      "       ROUND(AVG(CASE WHEN r.reviewed_on < '2024-09-27' THEN r.rating END), 2) AS before_avg,",
      "       ROUND(AVG(CASE WHEN r.reviewed_on > '2024-10-06' THEN r.rating END), 2) AS after_avg",
      "FROM Product p",
      "JOIN ProductReview r ON r.product_id = p.product_id",
      "GROUP BY p.product_id, p.product_name",
      "HAVING SUM(CASE WHEN r.reviewed_on < '2024-09-27' THEN 1 ELSE 0 END) >= 2",
      "   AND SUM(CASE WHEN r.reviewed_on > '2024-10-06' THEN 1 ELSE 0 END) >= 2",
      "   AND AVG(CASE WHEN r.reviewed_on > '2024-10-06' THEN r.rating END) < AVG(CASE WHEN r.reviewed_on < '2024-09-27' THEN r.rating END)",
    ].join("\n"),
    alternatives: [
      [
        "SELECT p.product_name, ROUND(b.avg_rating, 2) AS before_avg, ROUND(a.avg_rating, 2) AS after_avg",
        "FROM Product p",
        "JOIN (SELECT product_id, AVG(rating) AS avg_rating, COUNT(*) AS n FROM ProductReview WHERE reviewed_on < '2024-09-27' GROUP BY product_id) b",
        "  ON b.product_id = p.product_id",
        "JOIN (SELECT product_id, AVG(rating) AS avg_rating, COUNT(*) AS n FROM ProductReview WHERE reviewed_on > '2024-10-06' GROUP BY product_id) a",
        "  ON a.product_id = p.product_id",
        "WHERE b.n >= 2 AND a.n >= 2 AND a.avg_rating < b.avg_rating",
      ].join("\n"),
    ],
    hints: [
      "Each review falls into before, during or after — a CASE on the date decides which.",
      "`AVG(CASE WHEN … THEN rating END)` averages only the reviews of one period, because AVG skips NULLs.",
      "Compare the unrounded averages; round only what you display.",
    ],
    editorial: [
      "Each product needs two averages over two disjoint sets of its reviews. **Conditional aggregation** gets both in one GROUP BY: `AVG(CASE WHEN reviewed_on < '2024-09-27' THEN rating END)` turns every review outside the period into NULL, and AVG ignores NULLs, so it averages only the pre-sale reviews. The CASE has no ELSE on purpose — an `ELSE 0` would drag the average down. Reviews written during the sale match neither CASE and so count nowhere.",
      "",
      "The HAVING clause applies all three conditions on the groups: at least two reviews before (a SUM of a 0/1 flag), at least two after, and the after-average strictly below the before-average. The comparison uses the unrounded averages, so two values that round to the same figure are still told apart correctly.",
      "",
      "The alternative builds one derived table per period and inner-joins them, which drops products missing a period automatically. Both scan the reviews once or twice; an index on `(product_id, reviewed_on)` helps either.",
    ].join("\n"),
  },

  {
    slug: "flipkart-certified-buyer-reviews-per-product",
    title: "Flipkart: Certified Buyer Reviews and Their Rating per Product",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation", "Conditional Logic"],
    description: [
      "Flipkart marks a review **Certified Buyer** when the reviewer had actually received the product before writing it. The trust-and-safety team wants to see how much of each product's rating comes from certified buyers.",
      "",
      "A review is certified when the same customer has an order of the same product with `delivered_on` **on or before** `reviewed_on` (orders not yet delivered have `delivered_on` NULL and never certify). For every product with at least one review, return `product_name`, `reviews` (all its reviews), `certified_reviews` and `certified_avg_rating` (the average rating of its certified reviews rounded to 2 decimal places, NULL if it has none). A customer may have ordered the same product more than once; a review still counts once. Order by `product_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Product",
        columns: [
          { name: "product_id", type: "int" },
          { name: "product_name", type: "varchar" },
        ],
        primaryKey: ["product_id"],
        note: "One row per catalogue product.",
      },
      {
        name: "ProductOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "product_id", type: "int" },
          { name: "delivered_on", type: "date" },
        ],
        primaryKey: ["order_id"],
        note: "One row per order of one product; `delivered_on` is NULL while the parcel has not been delivered.",
      },
      {
        name: "Review",
        columns: [
          { name: "review_id", type: "int" },
          { name: "product_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "rating", type: "int" },
          { name: "reviewed_on", type: "date" },
        ],
        primaryKey: ["review_id"],
        note: "One row per review; `rating` is 1 to 5 stars and `product_id` always names a product.",
      },
    ],
    examples: [
      {
        Product: [
          [1, "Nova X5"],
          [2, "Steel Bottle"],
          [3, "Face Serum"],
        ],
        ProductOrder: [
          [1, 101, 1, "2024-10-03"],
          [2, 101, 1, "2024-10-10"],
          [3, 102, 1, null],
          [4, 103, 1, "2024-10-12"],
          [5, 104, 2, "2024-10-05"],
          [6, 105, 3, "2024-10-01"],
        ],
        Review: [
          [1, 1, 101, 5, "2024-10-04"],
          [2, 1, 102, 1, "2024-10-06"],
          [3, 1, 103, 4, "2024-10-11"],
          [4, 1, 106, 2, "2024-10-08"],
          [5, 2, 104, 3, "2024-10-05"],
          [6, 2, 105, 1, "2024-10-06"],
        ],
      },
    ],
    gen: (rng) => {
      const k = ri(rng, 1, 4);
      const products: Cell[][] = sample(rng, PHONES, k).map((name, i) => [i + 1, name]);
      const n = chance(rng, 0.08) ? 0 : ri(rng, 2, 16);
      const orders: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 101, 107),
        ri(rng, 1, k),
        chance(rng, 0.2) ? null : dateBetween(rng, "2024-10-01", "2024-10-20"),
      ]);
      const reviews: Cell[][] = [];
      for (const p of seq(1, k)) {
        for (let i = ri(rng, 0, 5); i > 0; i--) {
          const mine = orders.filter((o) => o[2] === p && o[3] !== null);
          const o = mine.length && chance(rng, 0.6) ? pick(rng, mine) : null;
          reviews.push([
            reviews.length + 1,
            p,
            o ? o[1]! : ri(rng, 101, 107),
            ri(rng, 1, 5),
            o && chance(rng, 0.3) ? o[3]! : dateBetween(rng, "2024-10-01", "2024-10-25"),
          ]);
        }
      }
      return { Product: products, ProductOrder: orders, Review: reviews };
    },
    solution: [
      "WITH flagged AS (",
      "  SELECT r.product_id, r.rating,",
      "         CASE WHEN EXISTS (SELECT 1 FROM ProductOrder o",
      "                           WHERE o.customer_id = r.customer_id AND o.product_id = r.product_id",
      "                             AND o.delivered_on <= r.reviewed_on) THEN 1 ELSE 0 END AS certified",
      "  FROM Review r",
      ")",
      "SELECT p.product_name,",
      "       COUNT(*) AS reviews,",
      "       SUM(f.certified) AS certified_reviews,",
      "       ROUND(AVG(CASE WHEN f.certified = 1 THEN f.rating END), 2) AS certified_avg_rating",
      "FROM flagged f",
      "JOIN Product p ON p.product_id = f.product_id",
      "GROUP BY p.product_id, p.product_name",
      "ORDER BY p.product_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH first_delivery AS (",
        "  SELECT customer_id, product_id, MIN(delivered_on) AS first_on",
        "  FROM ProductOrder WHERE delivered_on IS NOT NULL",
        "  GROUP BY customer_id, product_id",
        ")",
        "SELECT p.product_name,",
        "       COUNT(*) AS reviews,",
        "       COUNT(CASE WHEN d.first_on <= r.reviewed_on THEN 1 END) AS certified_reviews,",
        "       ROUND(AVG(IF(d.first_on <= r.reviewed_on, r.rating, NULL)), 2) AS certified_avg_rating",
        "FROM Review r",
        "JOIN Product p ON p.product_id = r.product_id",
        "LEFT JOIN first_delivery d ON d.customer_id = r.customer_id AND d.product_id = r.product_id",
        "GROUP BY p.product_id, p.product_name",
        "ORDER BY p.product_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Decide for each review, on its own, whether it is certified — then aggregate.",
      "Joining reviews straight to orders would repeat a review once per matching order; EXISTS asks the yes/no question without multiplying rows.",
      "Only the customer's earliest delivery of the product matters: if that is on or before the review date, the review is certified.",
      "`AVG(CASE WHEN certified THEN rating END)` averages only the certified reviews and is NULL when there are none.",
    ],
    editorial: [
      "The trap is the join. A customer who ordered the same phone twice has two order rows, so joining reviews to orders would count that customer's review twice and weight its rating double. The question per review is yes or no — *is there* an order of this product by this customer delivered by the review date — which is exactly what a correlated `EXISTS` answers without multiplying rows. The flag is computed per review in a CTE, and only then are the reviews grouped by product.",
      "",
      "An undelivered order has `delivered_on` NULL, and `NULL <= reviewed_on` is not true, so it never certifies. A delivery on the review day itself does certify, because the comparison is `<=`.",
      "",
      "In the aggregate, `COUNT(*)` counts all reviews, `SUM(certified)` the certified ones, and `AVG(CASE WHEN certified = 1 THEN rating END)` averages only those — a product with none gets NULL, not 0. The alternative first reduces the orders to each customer's earliest delivery of each product, which is all that matters, and LEFT JOINs that one row per pair, so no review can be repeated. Both are a pass over the reviews with an index lookup into the orders.",
    ].join("\n"),
  },

  {
    slug: "flipkart-sellers-missing-the-dispatch-sla",
    title: "Flipkart: F-Assured Sellers Missing the 24-Hour Dispatch SLA",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Dates"],
    description: [
      "F-Assured sellers must hand an order to Ekart within **24 hours** of confirming it. The seller-quality team runs the check with the cut-off **2024-10-10 00:00:00**.",
      "",
      "An order is **late** if it was dispatched more than 24 hours after `confirmed_at`, or if it has not been dispatched and the cut-off is more than 24 hours after `confirmed_at`. Exactly 24 hours is on time. Report a seller with **at least 3 orders** of which **more than half** are late. Return `seller_name`, `orders` (all their orders) and `late_orders`, ordered by `late_orders` descending, then `seller_name`.",
    ].join("\n"),
    tables: [
      {
        name: "Seller",
        columns: [
          { name: "seller_id", type: "int" },
          { name: "seller_name", type: "varchar" },
        ],
        primaryKey: ["seller_id"],
        note: "One row per F-Assured seller; names are unique.",
      },
      {
        name: "FulfilmentOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "seller_id", type: "int" },
          { name: "confirmed_at", type: "datetime" },
          { name: "dispatched_at", type: "datetime" },
        ],
        primaryKey: ["order_id"],
        note: "One row per order, confirmed before the cut-off. `dispatched_at` is NULL until the parcel is handed over.",
      },
    ],
    examples: [
      {
        Seller: [
          [1, "Metro Gadgets"],
          [2, "Desi Weaves"],
          [3, "Om Sai Traders"],
        ],
        FulfilmentOrder: [
          [1, 1, "2024-10-01 10:00:00", "2024-10-02 10:00:00"],
          [2, 1, "2024-10-02 09:00:00", "2024-10-03 09:01:00"],
          [3, 1, "2024-10-07 18:30:00", null],
          [4, 2, "2024-10-03 11:00:00", "2024-10-03 15:00:00"],
          [5, 2, "2024-10-04 11:00:00", "2024-10-06 12:00:00"],
          [6, 2, "2024-10-09 20:00:00", null],
          [7, 3, "2024-10-05 08:00:00", "2024-10-07 08:00:00"],
          [8, 3, "2024-10-05 09:00:00", "2024-10-07 09:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const sellers = sample(rng, SELLERS, ri(rng, 1, 5)).map((name, i) => [i + 1, name] as Cell[]);
      const n = ri(rng, 3, 25);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const day = dateBetween(rng, "2024-10-01", "2024-10-09");
        const start = ri(rng, 0, 1439);
        const confirmed = at(day, start);
        let dispatched: string | null = null;
        if (!chance(rng, 0.15)) {
          const delay = chance(rng, 0.15) ? pick(rng, [1440, 1441]) : ri(rng, 60, 3000);
          const d = at(day, start + delay);
          dispatched = d >= "2024-10-10 00:00:00" ? null : d;
        }
        return [id, ri(rng, 1, sellers.length), confirmed, dispatched];
      });
      return { Seller: sellers, FulfilmentOrder: rows };
    },
    solution: [
      "SELECT s.seller_name,",
      "       COUNT(*) AS orders,",
      "       SUM(CASE WHEN TIMESTAMPDIFF(MINUTE, o.confirmed_at, COALESCE(o.dispatched_at, '2024-10-10 00:00:00')) > 1440",
      "                THEN 1 ELSE 0 END) AS late_orders",
      "FROM Seller s",
      "JOIN FulfilmentOrder o ON o.seller_id = s.seller_id",
      "GROUP BY s.seller_id, s.seller_name",
      "HAVING COUNT(*) >= 3",
      "   AND 2 * SUM(CASE WHEN TIMESTAMPDIFF(MINUTE, o.confirmed_at, COALESCE(o.dispatched_at, '2024-10-10 00:00:00')) > 1440 THEN 1 ELSE 0 END) > COUNT(*)",
      "ORDER BY late_orders DESC, s.seller_name",
    ].join("\n"),
    alternatives: [
      [
        "WITH flagged AS (",
        "  SELECT seller_id,",
        "         CASE WHEN dispatched_at IS NULL THEN DATE_ADD(confirmed_at, INTERVAL 24 HOUR) < '2024-10-10 00:00:00'",
        "              ELSE DATE_ADD(confirmed_at, INTERVAL 24 HOUR) < dispatched_at END AS is_late",
        "  FROM FulfilmentOrder",
        ")",
        "SELECT s.seller_name, COUNT(*) AS orders, SUM(f.is_late) AS late_orders",
        "FROM flagged f JOIN Seller s ON s.seller_id = f.seller_id",
        "GROUP BY s.seller_id, s.seller_name",
        "HAVING COUNT(*) >= 3 AND SUM(f.is_late) > COUNT(*) / 2",
        "ORDER BY late_orders DESC, s.seller_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "An undispatched order is late exactly when it would be late if it were dispatched at the cut-off.",
      "Measure the delay in minutes so that \"more than 24 hours\" is a clean `> 1440`.",
      "\"More than half\" can be written without division: `2 * late > orders`.",
    ],
    editorial: [
      "The lateness test has two cases that collapse into one: an order still waiting is late precisely when the cut-off is already past its 24-hour deadline, which is the same as pretending it was dispatched at the cut-off. `COALESCE(dispatched_at, '2024-10-10 00:00:00')` makes that substitution, and `TIMESTAMPDIFF(MINUTE, confirmed_at, …) > 1440` is the test. Measuring in minutes keeps the boundary exact — 24 hours to the minute is on time, 24 hours and one minute is late.",
      "",
      "Per seller, `COUNT(*)` gives all orders and a CASE inside SUM the late ones. The two filters are on aggregates: at least three orders, so one bad day does not flag a seller, and `2 * late > orders` for \"more than half\" without division or rounding.",
      "",
      "The alternative compares the deadline `DATE_ADD(confirmed_at, INTERVAL 24 HOUR)` with the dispatch time (or the cut-off), sums the boolean flag, and compares with `COUNT(*) / 2`, which is decimal division. Both read each order once.",
    ].join("\n"),
  },

  {
    slug: "flipkart-sale-shoppers-across-three-categories",
    title: "Flipkart: Sale Shoppers Who Bought From Three Categories",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation"],
    description: [
      "The growth team wants to thank customers who explored the store widely during Big Billion Days (**2024-09-27 to 2024-10-06**, inclusive).",
      "",
      "Consider orders placed in the sale window whose `order_status` is not `cancelled`. Return every customer who bought products from **at least 3 different categories** across those orders, with `customer_id` and `categories` (the number of distinct categories). Order by `categories` descending, then `customer_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Product",
        columns: [
          { name: "product_id", type: "int" },
          { name: "product_name", type: "varchar" },
          { name: "category", type: "varchar" },
        ],
        primaryKey: ["product_id"],
        note: "One row per catalogue product.",
      },
      {
        name: "SaleOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "ordered_on", type: "date" },
          { name: "order_status", type: "enum", values: ["delivered", "shipped", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per order.",
      },
      {
        name: "OrderItem",
        columns: [
          { name: "order_id", type: "int" },
          { name: "product_id", type: "int" },
          { name: "quantity", type: "int" },
        ],
        primaryKey: ["order_id", "product_id"],
        note: "One row per product on an order.",
      },
    ],
    examples: [
      {
        Product: [
          [1, "Galaxy F15", "Mobiles"],
          [2, "Cotton Kurta", "Fashion"],
          [3, "Mixer Grinder", "Appliances"],
          [4, "Face Serum", "Beauty"],
          [5, "Denim Jacket", "Fashion"],
        ],
        SaleOrder: [
          [1, 101, "2024-09-27", "delivered"],
          [2, 101, "2024-10-06", "shipped"],
          [3, 102, "2024-09-30", "delivered"],
          [4, 102, "2024-10-01", "cancelled"],
          [5, 103, "2024-09-26", "delivered"],
          [6, 103, "2024-10-02", "delivered"],
        ],
        OrderItem: [
          [1, 1, 1],
          [1, 2, 2],
          [2, 3, 1],
          [3, 2, 1],
          [3, 5, 1],
          [3, 4, 1],
          [4, 3, 1],
          [5, 1, 1],
          [6, 2, 1],
          [6, 4, 1],
        ],
      },
    ],
    gen: (rng) => {
      const products: Cell[][] = seq(1, 8).map((id) => [id, pick(rng, LISTING_TITLES), pick(rng, CATEGORIES.slice(0, 5))]);
      const n = ri(rng, 2, 14);
      const orders: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 101, 105),
        chance(rng, 0.2) ? pick(rng, ["2024-09-26", "2024-09-27", "2024-10-06", "2024-10-07"]) : dateBetween(rng, "2024-09-27", "2024-10-06"),
        pick(rng, ["delivered", "delivered", "shipped", "cancelled"]),
      ]);
      const items: Cell[][] = [];
      for (const o of orders) for (const p of sample(rng, seq(1, 8), ri(rng, 1, 3))) items.push([o[0]!, p, ri(rng, 1, 3)]);
      return { Product: products, SaleOrder: orders, OrderItem: items };
    },
    solution: [
      "SELECT o.customer_id, COUNT(DISTINCT p.category) AS categories",
      "FROM SaleOrder o",
      "JOIN OrderItem i ON i.order_id = o.order_id",
      "JOIN Product p ON p.product_id = i.product_id",
      "WHERE o.order_status <> 'cancelled'",
      "  AND o.ordered_on BETWEEN '2024-09-27' AND '2024-10-06'",
      "GROUP BY o.customer_id",
      "HAVING COUNT(DISTINCT p.category) >= 3",
      "ORDER BY categories DESC, o.customer_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT customer_id, COUNT(*) AS categories",
        "FROM (SELECT DISTINCT o.customer_id, p.category",
        "      FROM SaleOrder o, OrderItem i, Product p",
        "      WHERE i.order_id = o.order_id AND p.product_id = i.product_id",
        "        AND o.order_status IN ('delivered', 'shipped')",
        "        AND o.ordered_on >= '2024-09-27' AND o.ordered_on <= '2024-10-06') cc",
        "GROUP BY customer_id",
        "HAVING COUNT(*) >= 3",
        "ORDER BY categories DESC, customer_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The category lives on the product, two joins away from the customer.",
      "Several items, or several orders, from one category must count once — COUNT(DISTINCT …).",
      "The threshold is on a count, so it goes in HAVING.",
    ],
    editorial: [
      "The customer is on the order and the category on the product, so the query walks `SaleOrder → OrderItem → Product`. The WHERE clause keeps orders inside the inclusive sale window that were not cancelled; a cancelled order's items must not count even if they are the only Appliances the customer touched.",
      "",
      "After grouping by customer, the joined rows contain one row per item, so a customer who bought two Fashion items in one order, or Fashion in two orders, has Fashion several times. `COUNT(DISTINCT p.category)` counts each category once, and `HAVING … >= 3` keeps the wide explorers.",
      "",
      "The alternative first reduces the rows to distinct `(customer, category)` pairs in a derived table and then counts pairs per customer with a plain COUNT — the same idea in two steps, which is also handy when you later want to list the categories. Both cost a join over the sale's items plus a grouping.",
    ].join("\n"),
  },

  {
    slug: "flipkart-top-three-brands-per-category-with-others",
    title: "Flipkart: Top Three Brands per Category Plus an Others Line",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "The Big Billion Days recap deck shows each category's brand split as a short table: the three biggest brands by name, and everything else folded into one **Others** line so the table stays readable.",
      "",
      "Count GMV from lines that are **not cancelled** and were sold within the sale (**2024-09-27 to 2024-10-06**, inclusive). In each category, rank brands by GMV, highest first, ties to the brand name alphabetically. Return `category`, `brand` and `gmv`: one row for each of the **top 3** brands, then one row with `brand` = `'Others'` holding the combined GMV of all lower-ranked brands — only if the category has more than three brands. Order by `category`, then the top brands in rank order, with Others last.",
    ].join("\n"),
    tables: [
      {
        name: "SaleOrderLine",
        columns: [
          { name: "line_id", type: "int" },
          { name: "category", type: "varchar" },
          { name: "brand", type: "varchar" },
          { name: "sold_on", type: "date" },
          { name: "gmv", type: "int" },
          { name: "is_cancelled", type: "bool" },
        ],
        primaryKey: ["line_id"],
        note: "One row per order line, with its GMV in rupees. No brand is literally named 'Others'.",
      },
    ],
    examples: [
      {
        SaleOrderLine: [
          [1, "Mobiles", "Nova", "2024-09-27", 30000, 0],
          [2, "Mobiles", "Nova", "2024-09-30", 20000, 0],
          [3, "Mobiles", "Pixelon", "2024-09-28", 42000, 0],
          [4, "Mobiles", "Redstar", "2024-10-01", 22000, 0],
          [5, "Mobiles", "Redstar", "2024-10-06", 20000, 0],
          [6, "Mobiles", "Moto", "2024-10-02", 9000, 0],
          [7, "Mobiles", "Moto", "2024-10-07", 50000, 0],
          [8, "Mobiles", "Realm", "2024-10-03", 3000, 0],
          [9, "Mobiles", "Realm", "2024-10-03", 15000, 1],
          [10, "Fashion", "UrbanThreads", "2024-09-29", 5000, 0],
          [11, "Fashion", "Desi Weaves", "2024-10-04", 7000, 0],
          [12, "Audio", "BassBuds", "2024-09-27", 8000, 0],
          [13, "Audio", "Thump", "2024-10-05", 8000, 0],
          [14, "Audio", "Sonic", "2024-09-29", 2000, 0],
          [15, "Audio", "Echo", "2024-10-02", 1000, 0],
        ],
      },
    ],
    gen: (rng) => {
      const brands: Record<string, readonly string[]> = {
        Mobiles: ["Nova", "Pixelon", "Redstar", "Moto", "Realm", "Galaxy", "Lava"],
        Audio: ["BassBuds", "Thump", "Sonic", "Echo", "Boomer", "Pulse"],
        Fashion: ["UrbanThreads", "Desi Weaves", "Roadline", "Kurta Co", "Denimly"],
      };
      const cats = sample(rng, ["Mobiles", "Audio", "Fashion"], ri(rng, 1, 3));
      const pool = new Map(cats.map((c) => [c, sample(rng, brands[c]!, ri(rng, 1, brands[c]!.length))]));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 30);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const c = pick(rng, cats);
        return [
          id,
          c,
          pick(rng, pool.get(c)!),
          chance(rng, 0.15) ? pick(rng, ["2024-09-26", "2024-09-27", "2024-10-06", "2024-10-07"]) : dateBetween(rng, "2024-09-27", "2024-10-06"),
          roundTo(rng, 1000, 20000, 1000),
          chance(rng, 0.15) ? 1 : 0,
        ];
      });
      return { SaleOrderLine: rows };
    },
    solution: [
      "WITH brand_gmv AS (",
      "  SELECT category, brand, SUM(gmv) AS gmv",
      "  FROM SaleOrderLine",
      "  WHERE is_cancelled = 0 AND sold_on BETWEEN '2024-09-27' AND '2024-10-06'",
      "  GROUP BY category, brand",
      "), ranked AS (",
      "  SELECT category, brand, gmv,",
      "         ROW_NUMBER() OVER (PARTITION BY category ORDER BY gmv DESC, brand) AS rn",
      "  FROM brand_gmv",
      ")",
      "SELECT category, brand, gmv",
      "FROM (",
      "  SELECT category, brand, gmv, rn AS sort_key FROM ranked WHERE rn <= 3",
      "  UNION ALL",
      "  SELECT category, 'Others', SUM(gmv), 4 FROM ranked WHERE rn > 3 GROUP BY category",
      ") t",
      "ORDER BY category, sort_key",
    ].join("\n"),
    alternatives: [
      [
        "WITH brand_gmv AS (",
        "  SELECT category, brand, SUM(gmv) AS gmv FROM SaleOrderLine",
        "  WHERE is_cancelled = 0 AND sold_on >= '2024-09-27' AND sold_on <= '2024-10-06'",
        "  GROUP BY category, brand",
        "), ranked AS (",
        "  SELECT category, brand, gmv,",
        "         ROW_NUMBER() OVER (PARTITION BY category ORDER BY gmv DESC, brand) AS rn",
        "  FROM brand_gmv",
        ")",
        "SELECT category, CASE WHEN rn <= 3 THEN brand ELSE 'Others' END AS brand, SUM(gmv) AS gmv",
        "FROM ranked",
        "GROUP BY category, CASE WHEN rn <= 3 THEN brand ELSE 'Others' END",
        "ORDER BY category, MIN(rn)",
      ].join("\n"),
      [
        "WITH brand_gmv AS (",
        "  SELECT category, brand, SUM(gmv) AS gmv FROM SaleOrderLine",
        "  WHERE is_cancelled = 0 AND sold_on BETWEEN '2024-09-27' AND '2024-10-06'",
        "  GROUP BY category, brand",
        "), ranked AS (",
        "  SELECT a.category, a.brand, a.gmv,",
        "         1 + (SELECT COUNT(*) FROM brand_gmv b WHERE b.category = a.category",
        "              AND (b.gmv > a.gmv OR (b.gmv = a.gmv AND b.brand < a.brand))) AS pos",
        "  FROM brand_gmv a",
        ")",
        "SELECT category, brand, gmv FROM (",
        "  SELECT category, IF(pos <= 3, brand, 'Others') AS brand, SUM(gmv) AS gmv, MIN(pos) AS first_pos",
        "  FROM ranked GROUP BY category, IF(pos <= 3, brand, 'Others')",
        ") t",
        "ORDER BY category, first_pos",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Total the GMV per category and brand first, inside the sale window and without cancelled lines.",
      "Number the brands within each category with `ROW_NUMBER()`, ordered by GMV descending and then brand — ties need a fixed winner, or \"top 3\" changes with storage order.",
      "Brands numbered 4 and beyond all become one `'Others'` row: either a second SELECT glued on with UNION ALL, or a CASE that renames them before a second GROUP BY.",
      "Sort Others last with a sort key, not by its GMV — Others can be larger than any single brand.",
    ],
    editorial: [
      "A top-N table with a remainder line is two aggregations stacked. The first totals GMV per category and brand, after filtering cancelled lines and anything outside the inclusive sale window. The second decides what each brand becomes: `ROW_NUMBER()` per category, by GMV descending with the brand name breaking ties, gives every brand a position, and positions 1–3 stay themselves while every brand after them is folded into **Others**.",
      "",
      "The solution writes the two kinds of row as two SELECTs joined by `UNION ALL`: the top three as they are, and one grouped row of everything with `rn > 3`. A category with three brands or fewer has no such rows, so the grouped SELECT produces no Others line for it — exactly as required, with no empty Others row showing 0. A `sort_key` (the position, and 4 for Others) carries the order out of the union; sorting by GMV would put a large Others line above the brands.",
      "",
      "The first alternative renames instead: `CASE WHEN rn <= 3 THEN brand ELSE 'Others' END` is grouped a second time, and `MIN(rn)` orders the groups. The second ranks with a correlated count instead of a window. Each is a grouping of the lines plus a sort of the brands per category.",
    ].join("\n"),
  },

  {
    slug: "flipkart-pay-later-bills-not-cleared-by-due-date",
    title: "Flipkart: Pay Later Bills Not Cleared by the Due Date",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Dates"],
    description: [
      "Every month Flipkart Pay Later raises one bill per account, due on the 5th of the next month. Customers may repay a bill in several parts. Collections wants the bills that were short on the due date.",
      "",
      "For each bill, `paid_by_due` is the sum of its repayments made **on or before** `due_on` (0 if none). Return `bill_id`, `account_id`, `paid_by_due` and `shortfall` (`amount - paid_by_due`) for every bill where `paid_by_due` is less than the bill amount. Repayments after the due date do not help. Order by `shortfall` descending, then `bill_id`.",
    ].join("\n"),
    tables: [
      {
        name: "PayLaterBill",
        columns: [
          { name: "bill_id", type: "int" },
          { name: "account_id", type: "int" },
          { name: "bill_month", type: "char" },
          { name: "amount", type: "int" },
          { name: "due_on", type: "date" },
        ],
        primaryKey: ["bill_id"],
        note: "One row per monthly bill; `bill_month` is 'YYYY-MM' and `amount` is in rupees.",
      },
      {
        name: "Repayment",
        columns: [
          { name: "repayment_id", type: "int" },
          { name: "bill_id", type: "int" },
          { name: "paid_on", type: "date" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["repayment_id"],
        note: "One row per payment towards a bill; `bill_id` always names a bill.",
      },
    ],
    examples: [
      {
        PayLaterBill: [
          [1, 11, "2024-08", 4000, "2024-09-05"],
          [2, 12, "2024-08", 2500, "2024-09-05"],
          [3, 11, "2024-09", 3000, "2024-10-05"],
          [4, 13, "2024-09", 1200, "2024-10-05"],
        ],
        Repayment: [
          [1, 1, "2024-09-01", 2500],
          [2, 1, "2024-09-05", 1500],
          [3, 2, "2024-09-04", 1000],
          [4, 2, "2024-09-08", 1500],
          [5, 3, "2024-10-06", 3000],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const bills: Cell[][] = seq(1, n).map((id) => {
        const m = ri(rng, 6, 9);
        return [id, ri(rng, 11, 14), `2024-${pad(m)}`, roundTo(rng, 500, 15000, 100), `2024-${pad(m + 1)}-05`];
      });
      const reps: Cell[][] = [];
      for (const b of bills) {
        let left = b[3] as number;
        for (let k = ri(rng, 0, 3); k > 0 && left > 0; k--) {
          const amt = chance(rng, 0.5) ? left : roundTo(rng, 100, left, 100);
          reps.push([reps.length + 1, b[0]!, addDays(b[4] as string, pick(rng, [-10, -3, 0, 0, 1, 6])), amt]);
          left -= amt;
        }
      }
      return { PayLaterBill: bills, Repayment: reps };
    },
    solution: [
      "SELECT b.bill_id, b.account_id,",
      "       COALESCE(SUM(r.amount), 0) AS paid_by_due,",
      "       b.amount - COALESCE(SUM(r.amount), 0) AS shortfall",
      "FROM PayLaterBill b",
      "LEFT JOIN Repayment r ON r.bill_id = b.bill_id AND r.paid_on <= b.due_on",
      "GROUP BY b.bill_id, b.account_id, b.amount",
      "HAVING COALESCE(SUM(r.amount), 0) < b.amount",
      "ORDER BY shortfall DESC, b.bill_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT bill_id, account_id, paid_by_due, amount - paid_by_due AS shortfall",
        "FROM (SELECT b.bill_id, b.account_id, b.amount,",
        "             (SELECT IFNULL(SUM(r.amount), 0) FROM Repayment r WHERE r.bill_id = b.bill_id AND r.paid_on <= b.due_on) AS paid_by_due",
        "      FROM PayLaterBill b) t",
        "WHERE paid_by_due < amount",
        "ORDER BY shortfall DESC, bill_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Only repayments up to the due date count — make that part of the join, not a WHERE.",
      "A bill with no qualifying repayment must still appear, with 0 paid.",
      "SUM over no rows is NULL; COALESCE it to 0.",
    ],
    editorial: [
      "Each bill needs the total of its repayments up to its own due date. The **LEFT JOIN** carries both conditions in its `ON` clause — the repayment belongs to the bill, and `r.paid_on <= b.due_on` — so a late repayment is never joined, and a bill with nothing paid on time keeps one NULL-filled row. Had the date test been in WHERE, those bills would have disappeared instead of showing their full shortfall.",
      "",
      "After grouping by bill, `SUM(r.amount)` is NULL for such a bill, so `COALESCE(…, 0)` turns it into 0 paid. The HAVING clause keeps the bills where the on-time total is below the amount; a bill paid off exactly on the due date has a shortfall of 0 and is left out.",
      "",
      "The alternative computes `paid_by_due` with a correlated scalar subquery per bill and filters in an outer query. Both read each bill's repayments once; an index on `Repayment(bill_id, paid_on)` serves either.",
    ].join("\n"),
  },

  {
    slug: "flipkart-running-gmv-through-the-sale-by-category",
    title: "Flipkart: Running GMV Through the Sale by Category",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "The Big Billion Days dashboard shows each category's GMV piling up day by day. GMV is `selling_price * quantity` over items that were **not cancelled**, sold within the sale (**2024-09-27 to 2024-10-06**, inclusive).",
      "",
      "For each category and each sale day on which it had GMV, return `category`, `sold_on`, `day_gmv` (that day's GMV) and `running_gmv` (the category's GMV from the start of the sale up to and including that day). Days without sales are not listed. Order by `category`, then `sold_on`.",
    ].join("\n"),
    tables: [
      {
        name: "SaleItem",
        columns: [
          { name: "item_id", type: "int" },
          { name: "category", type: "varchar" },
          { name: "sold_on", type: "date" },
          { name: "selling_price", type: "int" },
          { name: "quantity", type: "int" },
          { name: "is_cancelled", type: "bool" },
        ],
        primaryKey: ["item_id"],
        note: "One row per item sold; `is_cancelled` = 1 when the buyer or seller cancelled it.",
      },
    ],
    examples: [
      {
        SaleItem: [
          [1, "Mobiles", "2024-09-26", 15000, 1, 0],
          [2, "Mobiles", "2024-09-27", 12000, 1, 0],
          [3, "Mobiles", "2024-09-27", 9000, 2, 0],
          [4, "Mobiles", "2024-09-29", 14000, 1, 1],
          [5, "Mobiles", "2024-10-01", 11000, 1, 0],
          [6, "Fashion", "2024-09-28", 799, 3, 0],
          [7, "Fashion", "2024-10-06", 1299, 1, 0],
        ],
      },
    ],
    gen: (rng) => {
      const cats = sample(rng, CATEGORIES, ri(rng, 1, 3));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 25);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        pick(rng, cats),
        chance(rng, 0.2) ? pick(rng, ["2024-09-26", "2024-09-27", "2024-10-06", "2024-10-07"]) : dateBetween(rng, "2024-09-27", "2024-10-06"),
        pick(rng, [499, 799, 1299, 2999, 9999, 14999]),
        ri(rng, 1, 3),
        chance(rng, 0.15) ? 1 : 0,
      ]);
      return { SaleItem: rows };
    },
    solution: [
      "WITH daily AS (",
      "  SELECT category, sold_on, SUM(selling_price * quantity) AS day_gmv",
      "  FROM SaleItem",
      "  WHERE is_cancelled = 0 AND sold_on BETWEEN '2024-09-27' AND '2024-10-06'",
      "  GROUP BY category, sold_on",
      ")",
      "SELECT category, sold_on, day_gmv,",
      "       SUM(day_gmv) OVER (PARTITION BY category ORDER BY sold_on) AS running_gmv",
      "FROM daily",
      "ORDER BY category, sold_on",
    ].join("\n"),
    alternatives: [
      [
        "WITH daily AS (",
        "  SELECT category, sold_on, SUM(selling_price * quantity) AS day_gmv",
        "  FROM SaleItem WHERE is_cancelled = 0 AND sold_on >= '2024-09-27' AND sold_on <= '2024-10-06'",
        "  GROUP BY category, sold_on",
        ")",
        "SELECT d.category, d.sold_on, d.day_gmv,",
        "       (SELECT SUM(e.day_gmv) FROM daily e WHERE e.category = d.category AND e.sold_on <= d.sold_on) AS running_gmv",
        "FROM daily d ORDER BY d.category, d.sold_on",
      ].join("\n"),
      [
        "SELECT category, sold_on, SUM(selling_price * quantity) AS day_gmv,",
        "       SUM(SUM(selling_price * quantity)) OVER (PARTITION BY category ORDER BY sold_on ROWS UNBOUNDED PRECEDING) AS running_gmv",
        "FROM SaleItem",
        "WHERE is_cancelled = 0 AND sold_on BETWEEN '2024-09-27' AND '2024-10-06'",
        "GROUP BY category, sold_on",
        "ORDER BY category, sold_on",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First reduce the items to one row per category and day.",
      "A running total is `SUM(…) OVER (PARTITION BY … ORDER BY …)`.",
      "Filter cancelled items and out-of-window days before you add anything.",
    ],
    editorial: [
      "There are two levels of summing. First the items collapse to one row per category and day — `daily`, with the cancelled items and the days outside the sale filtered in WHERE so they never enter a total. Then a **window** adds those daily figures cumulatively: `SUM(day_gmv) OVER (PARTITION BY category ORDER BY sold_on)` restarts for each category and, for each day, sums every day up to and including it.",
      "",
      "With an ORDER BY in the window the default frame runs from the partition's start to the current row (and its peers). Because `daily` has exactly one row per category and day there are no peers, so the default and an explicit `ROWS UNBOUNDED PRECEDING` agree. The third query nests the aggregate inside the window in a single GROUP BY, which is legal: the window runs after grouping.",
      "",
      "The correlated-subquery alternative re-adds the earlier days for every row — quadratic in the number of days per category, but tiny here. The window version is one sorted pass.",
    ].join("\n"),
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "flipkart-supercoins-left-in-each-earn-batch",
    title: "Flipkart: SuperCoins Left in Each Earn Batch After FIFO Burns",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins", "Subqueries"],
    description: [
      "SuperCoins expire a year after they are earned, so the loyalty engineers need to know how many coins of each earn batch are still unspent. Burns always consume the **oldest coins first**: batches in order of `earned_on`, and by `earn_id` for batches earned on the same day.",
      "",
      "Apply each member's **total** burned coins to their batches in that order (a member never burns more than they earned). Return `earn_id`, `member_id` and `coins_left` for every batch that still has **more than 0** coins left. Order by `member_id`, then `earned_on`, then `earn_id`.",
    ].join("\n"),
    tables: [
      {
        name: "SuperCoinEarn",
        columns: [
          { name: "earn_id", type: "int" },
          { name: "member_id", type: "int" },
          { name: "earned_on", type: "date" },
          { name: "coins", type: "int" },
        ],
        primaryKey: ["earn_id"],
        note: "One row per batch of coins credited for a purchase.",
      },
      {
        name: "SuperCoinBurn",
        columns: [
          { name: "burn_id", type: "int" },
          { name: "member_id", type: "int" },
          { name: "burned_on", type: "date" },
          { name: "coins", type: "int" },
        ],
        primaryKey: ["burn_id"],
        note: "One row per redemption. A member's burns never add up to more than their earns.",
      },
    ],
    examples: [
      {
        SuperCoinEarn: [
          [1, 7, "2024-06-01", 100],
          [2, 7, "2024-06-15", 200],
          [3, 7, "2024-07-02", 150],
          [4, 9, "2024-06-10", 80],
          [5, 9, "2024-06-10", 120],
          [6, 12, "2024-08-01", 60],
        ],
        SuperCoinBurn: [
          [1, 7, "2024-07-10", 150],
          [2, 7, "2024-07-20", 50],
          [3, 9, "2024-07-01", 80],
        ],
      },
    ],
    gen: (rng) => {
      const earns: Cell[][] = [];
      const burns: Cell[][] = [];
      for (const m of seq(1, ri(rng, 1, 4))) {
        let total = 0;
        let last = dateBetween(rng, "2024-04-01", "2024-08-31");
        for (let k = ri(rng, 0, 4); k > 0; k--) {
          const day = chance(rng, 0.25) ? last : dateBetween(rng, "2024-04-01", "2024-08-31");
          last = day;
          const coins = roundTo(rng, 10, 300, 10);
          earns.push([earns.length + 1, m, day, coins]);
          total += coins;
        }
        if (total === 0) continue;
        let toBurn = pick(rng, [0, total, roundTo(rng, 0, total, 10), roundTo(rng, 0, total, 10)]);
        while (toBurn > 0) {
          const part = chance(rng, 0.5) ? toBurn : roundTo(rng, 10, toBurn, 10);
          burns.push([burns.length + 1, m, dateBetween(rng, "2024-09-01", "2024-10-31"), part]);
          toBurn -= part;
        }
      }
      return { SuperCoinEarn: earns, SuperCoinBurn: burns };
    },
    solution: [
      "WITH burned AS (",
      "  SELECT member_id, SUM(coins) AS total_burned FROM SuperCoinBurn GROUP BY member_id",
      "), earned AS (",
      "  SELECT earn_id, member_id, earned_on, coins,",
      "         SUM(coins) OVER (PARTITION BY member_id ORDER BY earned_on, earn_id) AS cum_coins",
      "  FROM SuperCoinEarn",
      ")",
      "SELECT e.earn_id, e.member_id,",
      "       LEAST(e.coins, e.cum_coins - COALESCE(b.total_burned, 0)) AS coins_left",
      "FROM earned e",
      "LEFT JOIN burned b ON b.member_id = e.member_id",
      "WHERE e.cum_coins - COALESCE(b.total_burned, 0) > 0",
      "ORDER BY e.member_id, e.earned_on, e.earn_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT earn_id, member_id, coins_left FROM (",
        "  SELECT e.earn_id, e.member_id, e.earned_on,",
        "         GREATEST(0, LEAST(e.coins,",
        "           (SELECT SUM(x.coins) FROM SuperCoinEarn x",
        "             WHERE x.member_id = e.member_id",
        "               AND (x.earned_on < e.earned_on OR (x.earned_on = e.earned_on AND x.earn_id <= e.earn_id)))",
        "           - (SELECT IFNULL(SUM(b.coins), 0) FROM SuperCoinBurn b WHERE b.member_id = e.member_id))) AS coins_left",
        "  FROM SuperCoinEarn e",
        ") t",
        "WHERE coins_left > 0",
        "ORDER BY member_id, earned_on, earn_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Only each member's total burn matters, not when each burn happened.",
      "Line the batches up oldest first and keep a running total of the coins earned so far.",
      "A batch is untouched if the running total *before* it already covers the burns; it is gone if the running total *through* it does not exceed them.",
      "Coins left in a batch = the smaller of its own coins and (running total through it − total burned).",
    ],
    editorial: [
      "FIFO consumption looks procedural — walk the batches, subtract until the burn is used up — but it has a closed form. Order a member's batches oldest first and take the **running total** of coins earned, `cum_coins`. Let `B` be the member's total burned. All coins up to cumulative `B` are gone, so a batch whose running total is at most `B` is fully spent, and a batch whose running total exceeds `B` keeps `cum_coins − B` coins — but never more than the batch held, hence `LEAST(coins, cum_coins − B)`. The one batch straddling `B` is partly spent; every later one is untouched.",
      "",
      "The running total is a window `SUM(coins) OVER (PARTITION BY member_id ORDER BY earned_on, earn_id)`. The `earn_id` in the ORDER BY matters twice: it is the statement's tie-break for batches earned the same day, and it makes every row its own peer group, so the default RANGE frame gives a true running total instead of lumping same-day batches together. A member with no burns has no row in `burned`; the LEFT JOIN and `COALESCE(…, 0)` treat that as nothing spent.",
      "",
      "The alternative computes the running total with a correlated subquery and clamps with GREATEST/LEAST — quadratic per member but clear. The window version sorts each member's batches once.",
    ].join("\n"),
  },

  {
    slug: "flipkart-sale-day-gmv-against-last-year",
    title: "Flipkart: Big Billion Days GMV by Sale Day Against Last Year",
    difficulty: "HARD",
    topics: ["Subqueries", "Joins", "Dates", "Conditional Logic"],
    description: [
      "The Big Billion Days war room compares this year's sale with last year's **like for like**: day 1 of the 2024 sale against day 1 of the 2023 sale, day 2 against day 2, and so on — the two sales start on different dates and need not last equally long.",
      "",
      "Day `n` of a sale is the date `starts_on + (n - 1)` days. For **every** category in `Category` and every day number from 1 to the length of the **longer** sale, return `category`, `day_no`, `gmv_2023` and `gmv_2024`: the category's total GMV on that day of that year's sale. A sale day with no sales in the category shows **0**; a day number past the end of that year's sale shows **NULL** (the sale had no such day). Items sold outside both sales are ignored. Order by `category`, then `day_no`.",
    ].join("\n"),
    tables: [
      {
        name: "BigSale",
        columns: [
          { name: "sale_year", type: "int" },
          { name: "starts_on", type: "date" },
          { name: "ends_on", type: "date" },
        ],
        primaryKey: ["sale_year"],
        note: "Exactly two rows, for 2023 and 2024. Both dates are inclusive; a sale lasts 1 to 12 days.",
      },
      {
        name: "Category",
        columns: [{ name: "category", type: "varchar" }],
        primaryKey: ["category"],
        note: "Every category on the war-room board, whether or not it sold anything.",
      },
      {
        name: "SaleItem",
        columns: [
          { name: "item_id", type: "int" },
          { name: "category", type: "varchar" },
          { name: "sold_on", type: "date" },
          { name: "gmv", type: "int" },
        ],
        primaryKey: ["item_id"],
        note: "One row per item sold, with its GMV in rupees; `category` always names a row of `Category`.",
      },
    ],
    examples: [
      {
        BigSale: [
          [2023, "2023-10-08", "2023-10-11"],
          [2024, "2024-09-27", "2024-10-01"],
        ],
        Category: [["Books"], ["Fashion"], ["Mobiles"]],
        SaleItem: [
          [1, "Mobiles", "2023-10-08", 1000],
          [2, "Mobiles", "2023-10-08", 500],
          [3, "Mobiles", "2023-10-10", 800],
          [4, "Mobiles", "2024-09-27", 2000],
          [5, "Mobiles", "2024-09-29", 700],
          [6, "Mobiles", "2024-10-01", 300],
          [7, "Mobiles", "2024-10-02", 999],
          [8, "Fashion", "2023-10-11", 400],
          [9, "Fashion", "2024-09-28", 650],
          [10, "Fashion", "2023-10-07", 100],
        ],
      },
    ],
    gen: (rng) => {
      const s23 = dateBetween(rng, "2023-10-01", "2023-10-12");
      const s24 = dateBetween(rng, "2024-09-25", "2024-10-08");
      const e23 = addDays(s23, ri(rng, 0, 7));
      const e24 = addDays(s24, ri(rng, 0, 7));
      const cats = sample(rng, CATEGORIES, ri(rng, 1, 3));
      const n = ri(rng, 0, 25);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const [s, e] = chance(rng, 0.5) ? [s23, e23] : [s24, e24];
        return [id, pick(rng, cats), dateBetween(rng, addDays(s, -2), addDays(e, 2)), roundTo(rng, 100, 5000, 50)];
      });
      return { BigSale: [[2023, s23, e23], [2024, s24, e24]], Category: cats.map((c) => [c]), SaleItem: rows };
    },
    solution: [
      "WITH RECURSIVE span AS (",
      "  SELECT MAX(DATEDIFF(ends_on, starts_on) + 1) AS max_days FROM BigSale",
      "), days AS (",
      "  SELECT 1 AS day_no",
      "  UNION ALL",
      "  SELECT d.day_no + 1 FROM days d JOIN span s ON d.day_no < s.max_days",
      "), y AS (",
      "  SELECT sale_year, starts_on, DATEDIFF(ends_on, starts_on) + 1 AS sale_days FROM BigSale",
      "), daily AS (",
      "  SELECT category, sold_on, SUM(gmv) AS gmv FROM SaleItem GROUP BY category, sold_on",
      ")",
      "SELECT c.category, d.day_no,",
      "       CASE WHEN d.day_no <= a.sale_days THEN COALESCE(x.gmv, 0) END AS gmv_2023,",
      "       CASE WHEN d.day_no <= b.sale_days THEN COALESCE(z.gmv, 0) END AS gmv_2024",
      "FROM Category c",
      "CROSS JOIN days d",
      "JOIN y a ON a.sale_year = 2023",
      "JOIN y b ON b.sale_year = 2024",
      "LEFT JOIN daily x ON x.category = c.category AND x.sold_on = DATE_ADD(a.starts_on, INTERVAL d.day_no - 1 DAY)",
      "LEFT JOIN daily z ON z.category = c.category AND z.sold_on = DATE_ADD(b.starts_on, INTERVAL d.day_no - 1 DAY)",
      "ORDER BY c.category, d.day_no",
    ].join("\n"),
    alternatives: [
      [
        "WITH nums AS (",
        "  SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6",
        "  UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12",
        "), tagged AS (",
        "  SELECT i.category, i.gmv, b.sale_year, DATEDIFF(i.sold_on, b.starts_on) + 1 AS day_no",
        "  FROM SaleItem i JOIN BigSale b ON i.sold_on BETWEEN b.starts_on AND b.ends_on",
        ")",
        "SELECT c.category, k.n AS day_no,",
        "       IF(k.n <= (SELECT DATEDIFF(ends_on, starts_on) + 1 FROM BigSale WHERE sale_year = 2023),",
        "          (SELECT COALESCE(SUM(t.gmv), 0) FROM tagged t WHERE t.category = c.category AND t.sale_year = 2023 AND t.day_no = k.n), NULL) AS gmv_2023,",
        "       IF(k.n <= (SELECT DATEDIFF(ends_on, starts_on) + 1 FROM BigSale WHERE sale_year = 2024),",
        "          (SELECT COALESCE(SUM(t.gmv), 0) FROM tagged t WHERE t.category = c.category AND t.sale_year = 2024 AND t.day_no = k.n), NULL) AS gmv_2024",
        "FROM Category c CROSS JOIN nums k",
        "WHERE k.n <= (SELECT MAX(DATEDIFF(ends_on, starts_on) + 1) FROM BigSale)",
        "ORDER BY c.category, k.n",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Turn each sale's dates into day numbers 1, 2, 3, … — `DATEDIFF(sold_on, starts_on) + 1` — so the two years line up.",
      "The output has a row for every category and every day number, sold or not: build that grid first (a recursive CTE or a small numbers table, CROSS JOINed with `Category`), then attach the sales.",
      "LEFT JOIN the daily totals onto the grid and COALESCE a missing total to 0.",
      "0 and NULL mean different things here: test the day number against each sale's own length before reporting 0.",
    ],
    editorial: [
      "A year-over-year comparison of two sales cannot match on dates — 2023's day 1 is 8 October, 2024's is 27 September — so it matches on **day numbers**. Day `n` of a sale is `DATE_ADD(starts_on, INTERVAL n - 1 DAY)`, or equivalently a sold date belongs to day `DATEDIFF(sold_on, starts_on) + 1`.",
      "",
      "The report must show every category on every day, including Books on a day nothing sold, so the rows cannot come from the sales. They come from a **grid**: a recursive CTE counts day numbers from 1 up to the longer sale's length (the recursive step joins the length rather than using an aggregate, which MySQL forbids there), and a CROSS JOIN with `Category` gives one row per category and day. The daily totals are LEFT JOINed onto it for each year, and a missing total becomes 0.",
      "",
      "The last detail is **NULL versus 0**. When the 2024 sale ran five days and the 2023 sale four, day 5 of 2023 never existed; reporting 0 there would claim a day with no sales. A CASE on `day_no <= sale_days` returns NULL past the end of that year's sale. The alternative uses a fixed numbers table (sales last at most 12 days), tags each in-sale item with its year and day number, and sums with correlated subqueries. Either touches each item once and the grid is categories × days.",
    ].join("\n"),
  },

  {
    slug: "flipkart-sales-quartile-movement-matrix",
    title: "Flipkart: Month-to-Month Sales Quartile Movement Matrix",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins", "Conditional Logic", "Dates"],
    description: [
      "Category managers want to know how stable their rankings are: does a product that sells in the top quarter of its category one month stay there the next, or slide down?",
      "",
      "For every category and calendar month, rank the products of that category **that sold that month** by total units, highest first (ties to the lower `product_id`), and split them into quartiles 1–4 exactly as `NTILE(4)` does. A **move** is a product's quartile in one month paired with its quartile in the **next calendar month** — only when the product sold in both months (a month without sales means no move into or out of it). Return a movement matrix: for each category and `from_quartile` with at least one move, `category`, `from_quartile`, and `to_q1`, `to_q2`, `to_q3`, `to_q4` — how many moves landed in each quartile (0 if none). Order by `category`, then `from_quartile`.",
    ].join("\n"),
    tables: [
      {
        name: "Product",
        columns: [
          { name: "product_id", type: "int" },
          { name: "product_name", type: "varchar" },
          { name: "category", type: "varchar" },
        ],
        primaryKey: ["product_id"],
        note: "One row per catalogue product.",
      },
      {
        name: "ProductSale",
        columns: [
          { name: "sale_id", type: "int" },
          { name: "product_id", type: "int" },
          { name: "sold_on", type: "date" },
          { name: "units", type: "int" },
        ],
        primaryKey: ["sale_id"],
        note: "One row per day's sales of a product (a product can have several rows in a month); `product_id` always names a product.",
      },
    ],
    examples: [
      {
        Product: [
          [1, "Nova X5", "Mobiles"],
          [2, "Pixelon 8a", "Mobiles"],
          [3, "Redstar 12", "Mobiles"],
          [4, "Moto Lite", "Mobiles"],
          [5, "Galaxy F15", "Mobiles"],
          [6, "BassBuds Pro", "Audio"],
          [7, "Thump Mini", "Audio"],
        ],
        ProductSale: [
          [1, 1, "2024-06-10", 50], [2, 2, "2024-06-11", 40], [3, 3, "2024-06-12", 30], [4, 4, "2024-06-13", 20], [5, 5, "2024-06-14", 10],
          [6, 1, "2024-07-10", 30], [7, 2, "2024-07-11", 55], [8, 3, "2024-07-12", 55], [9, 4, "2024-07-13", 10], [10, 5, "2024-07-14", 5],
          [11, 2, "2024-08-05", 70], [12, 1, "2024-08-06", 60], [13, 3, "2024-08-07", 20], [14, 4, "2024-08-08", 10],
          [15, 1, "2024-09-03", 40], [16, 3, "2024-09-04", 30], [17, 4, "2024-09-05", 20],
          [18, 2, "2024-10-02", 50], [19, 2, "2024-10-20", 30], [20, 1, "2024-10-21", 10], [21, 3, "2024-10-22", 5],
          [22, 6, "2024-08-15", 9], [23, 7, "2024-08-16", 3],
          [24, 6, "2024-09-15", 4], [25, 7, "2024-09-16", 4],
          [26, 6, "2024-10-15", 7],
          [27, 6, "2024-12-15", 1], [28, 7, "2024-12-16", 8],
        ],
      },
    ],
    gen: (rng) => {
      const products: Cell[][] = [];
      for (const cat of sample(rng, ["Mobiles", "Audio", "Laptops"], ri(rng, 1, 2))) {
        for (let i = ri(rng, 1, 6); i > 0; i--) products.push([products.length + 1, `${cat} Model ${products.length + 1}`, cat]);
      }
      const months = ["2024-10", "2024-11", "2024-12", "2025-01", "2025-02", "2025-03"];
      const rows: Cell[][] = [];
      for (const p of products) {
        for (const m of months) {
          if (!chance(rng, 0.7)) continue;
          for (let k = ri(rng, 1, 2); k > 0; k--) {
            rows.push([rows.length + 1, p[0]!, `${m}-${pad(ri(rng, 1, 28))}`, chance(rng, 0.2) ? 10 : ri(rng, 1, 30)]);
          }
        }
      }
      return { Product: products, ProductSale: rows };
    },
    solution: [
      "WITH monthly AS (",
      "  SELECT s.product_id, p.category,",
      "         YEAR(s.sold_on) * 12 + MONTH(s.sold_on) AS month_no,",
      "         SUM(s.units) AS units",
      "  FROM ProductSale s",
      "  JOIN Product p ON p.product_id = s.product_id",
      "  GROUP BY s.product_id, p.category, YEAR(s.sold_on) * 12 + MONTH(s.sold_on)",
      "), quartiled AS (",
      "  SELECT product_id, category, month_no,",
      "         NTILE(4) OVER (PARTITION BY category, month_no ORDER BY units DESC, product_id) AS quartile",
      "  FROM monthly",
      "), moves AS (",
      "  SELECT a.category, a.quartile AS from_quartile, b.quartile AS to_quartile",
      "  FROM quartiled a",
      "  JOIN quartiled b ON b.product_id = a.product_id AND b.month_no = a.month_no + 1",
      ")",
      "SELECT category, from_quartile,",
      "       SUM(CASE WHEN to_quartile = 1 THEN 1 ELSE 0 END) AS to_q1,",
      "       SUM(CASE WHEN to_quartile = 2 THEN 1 ELSE 0 END) AS to_q2,",
      "       SUM(CASE WHEN to_quartile = 3 THEN 1 ELSE 0 END) AS to_q3,",
      "       SUM(CASE WHEN to_quartile = 4 THEN 1 ELSE 0 END) AS to_q4",
      "FROM moves",
      "GROUP BY category, from_quartile",
      "ORDER BY category, from_quartile",
    ].join("\n"),
    alternatives: [
      [
        "WITH monthly AS (",
        "  SELECT s.product_id, p.category, YEAR(s.sold_on) * 12 + MONTH(s.sold_on) AS month_no, SUM(s.units) AS units",
        "  FROM ProductSale s JOIN Product p ON p.product_id = s.product_id",
        "  GROUP BY s.product_id, p.category, YEAR(s.sold_on) * 12 + MONTH(s.sold_on)",
        "), ranked AS (",
        "  SELECT product_id, category, month_no,",
        "         ROW_NUMBER() OVER (PARTITION BY category, month_no ORDER BY units DESC, product_id) AS pos,",
        "         COUNT(*) OVER (PARTITION BY category, month_no) AS cnt",
        "  FROM monthly",
        "), quartiled AS (",
        "  SELECT product_id, category, month_no,",
        "         CASE WHEN pos <= (cnt MOD 4) * (cnt DIV 4 + 1) THEN FLOOR((pos - 1) / (cnt DIV 4 + 1)) + 1",
        "              ELSE cnt MOD 4 + FLOOR((pos - 1 - (cnt MOD 4) * (cnt DIV 4 + 1)) / (cnt DIV 4)) + 1 END AS quartile",
        "  FROM ranked",
        "), seq AS (",
        "  SELECT category, month_no, quartile,",
        "         LAG(quartile) OVER (PARTITION BY product_id ORDER BY month_no) AS prev_quartile,",
        "         LAG(month_no) OVER (PARTITION BY product_id ORDER BY month_no) AS prev_month",
        "  FROM quartiled",
        ")",
        "SELECT category, prev_quartile AS from_quartile,",
        "       COUNT(CASE WHEN quartile = 1 THEN 1 END) AS to_q1,",
        "       COUNT(CASE WHEN quartile = 2 THEN 1 END) AS to_q2,",
        "       COUNT(CASE WHEN quartile = 3 THEN 1 END) AS to_q3,",
        "       COUNT(CASE WHEN quartile = 4 THEN 1 END) AS to_q4",
        "FROM seq",
        "WHERE prev_month = month_no - 1",
        "GROUP BY category, prev_quartile",
        "ORDER BY category, from_quartile",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Collapse the daily rows to one row per product and month, with the category beside it, and number months as `YEAR * 12 + MONTH` so the next month is always `+ 1`.",
      "`NTILE(4) OVER (PARTITION BY category, month ORDER BY units DESC, product_id)` gives each product's quartile; only products that sold that month take part.",
      "Pair each product-month with the same product's row for the next month — a self join on `month_no + 1`, or LAG with a check that the previous month is really adjacent.",
      "Turn the pairs into a matrix with one conditional count per destination quartile, grouped by category and starting quartile.",
    ],
    editorial: [
      "Three steps. **Monthly totals**: sum the daily rows per product and month, keeping the month as a number `YEAR * 12 + MONTH`, which steps by exactly one from December to January. **Quartiles**: `NTILE(4)` partitioned by category and month splits that month's sellers into four nearly equal buckets, the first ones taking the remainder — with five products the buckets hold 2, 1, 1, 1, with three products only quartiles 1–3 exist. The ORDER BY must be total (units, then `product_id`) or tied products would land in buckets by chance.",
      "",
      "**Moves**: a self join of the quartiled rows on the same product and `b.month_no = a.month_no + 1` pairs each month with the next; a product that skipped a month has no row there, so no move is invented across the gap. Finally a **crosstab**: group the moves by category and starting quartile and count each destination with `SUM(CASE WHEN to_quartile = k THEN 1 ELSE 0 END)` — one column per quartile, zeros included. A starting quartile with no moves has no group and no row.",
      "",
      "The alternative replaces NTILE with its arithmetic (the first `n MOD 4` buckets hold one extra row), and finds the previous month with LAG, keeping a pair only when `prev_month = month_no - 1` — because LAG would otherwise pair months across a gap. Each version sorts every category-month once.",
    ].join("\n"),
  },

  {
    slug: "flipkart-sale-acquired-buyers-back-for-next-sale",
    title: "Flipkart: Sale-Acquired Buyers Who Came Back for the Next Sale",
    difficulty: "HARD",
    topics: ["Window Functions", "Subqueries", "Joins", "Dates"],
    description: [
      "Marketing asks whether big sales bring in customers who stay. A customer is **acquired** by a sale event when their **first non-cancelled order ever** falls within that event's dates (inclusive). An acquired customer **came back** if they placed a non-cancelled order during the **next** sale event (the event with the next later `starts_on`).",
      "",
      "For every sale event return `event_name`, `acquired` (customers it acquired, 0 if none) and `returned_next` (how many of them came back in the next event). For the latest event there is no next event yet, so `returned_next` is NULL. Order by the event's `starts_on`.",
    ].join("\n"),
    tables: [
      {
        name: "SaleEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "event_name", type: "varchar" },
          { name: "starts_on", type: "date" },
          { name: "ends_on", type: "date" },
        ],
        primaryKey: ["event_id"],
        note: "One row per sale event; events never overlap.",
      },
      {
        name: "CustomerOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "ordered_on", type: "date" },
          { name: "order_status", type: "enum", values: ["delivered", "returned", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "Every order a customer has ever placed, sale or not. Returned orders still count as orders; cancelled ones never do.",
      },
    ],
    examples: [
      {
        SaleEvent: SALE_EVENTS.map((e) => [...e]),
        CustomerOrder: [
          [1, 101, "2023-10-09", "delivered"],
          [2, 101, "2024-01-15", "delivered"],
          [3, 102, "2023-10-10", "cancelled"],
          [4, 102, "2023-11-20", "delivered"],
          [5, 103, "2023-10-12", "delivered"],
          [6, 103, "2024-07-21", "delivered"],
          [7, 104, "2024-01-16", "returned"],
          [8, 104, "2024-07-22", "cancelled"],
          [9, 105, "2024-07-20", "delivered"],
          [10, 105, "2024-09-27", "delivered"],
          [11, 106, "2024-09-30", "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      let events = SALE_EVENTS.filter(() => chance(rng, 0.8));
      if (!events.length) events = [pick(rng, SALE_EVENTS)];
      const n = ri(rng, 4, 30);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const e = pick(rng, SALE_EVENTS);
        return [
          id,
          ri(rng, 101, 110),
          chance(rng, 0.65) ? dateBetween(rng, e[2], e[3]) : dateBetween(rng, "2023-09-01", "2024-12-31"),
          pick(rng, ["delivered", "delivered", "returned", "cancelled"]),
        ];
      });
      return { SaleEvent: events.map((e) => [...e]), CustomerOrder: rows };
    },
    solution: [
      "WITH firsts AS (",
      "  SELECT customer_id, MIN(ordered_on) AS first_on",
      "  FROM CustomerOrder WHERE order_status <> 'cancelled' GROUP BY customer_id",
      "), ev AS (",
      "  SELECT event_id, event_name, starts_on, ends_on, LEAD(event_id) OVER (ORDER BY starts_on) AS next_id",
      "  FROM SaleEvent",
      "), acq AS (",
      "  SELECT e.event_id, e.next_id, f.customer_id",
      "  FROM ev e JOIN firsts f ON f.first_on BETWEEN e.starts_on AND e.ends_on",
      "), came_back AS (",
      "  SELECT DISTINCT a.event_id, a.customer_id",
      "  FROM acq a",
      "  JOIN SaleEvent n ON n.event_id = a.next_id",
      "  JOIN CustomerOrder o ON o.customer_id = a.customer_id AND o.order_status <> 'cancelled'",
      "   AND o.ordered_on BETWEEN n.starts_on AND n.ends_on",
      ")",
      "SELECT e.event_name,",
      "       (SELECT COUNT(*) FROM acq a WHERE a.event_id = e.event_id) AS acquired,",
      "       CASE WHEN e.next_id IS NULL THEN NULL",
      "            ELSE (SELECT COUNT(*) FROM came_back c WHERE c.event_id = e.event_id) END AS returned_next",
      "FROM ev e",
      "ORDER BY e.starts_on",
    ].join("\n"),
    alternatives: [
      [
        "WITH f AS (",
        "  SELECT customer_id, MIN(ordered_on) AS first_on FROM CustomerOrder WHERE order_status <> 'cancelled' GROUP BY customer_id",
        "), a AS (",
        "  SELECT s.event_id, f.customer_id FROM SaleEvent s JOIN f ON f.first_on >= s.starts_on AND f.first_on <= s.ends_on",
        ")",
        "SELECT s.event_name, COUNT(a.customer_id) AS acquired,",
        "       CASE WHEN NOT EXISTS (SELECT 1 FROM SaleEvent z WHERE z.starts_on > s.starts_on) THEN NULL",
        "            ELSE SUM(CASE WHEN EXISTS (",
        "                   SELECT 1 FROM CustomerOrder o JOIN SaleEvent nx ON o.ordered_on BETWEEN nx.starts_on AND nx.ends_on",
        "                   WHERE o.customer_id = a.customer_id AND o.order_status <> 'cancelled'",
        "                     AND nx.starts_on = (SELECT MIN(z.starts_on) FROM SaleEvent z WHERE z.starts_on > s.starts_on))",
        "                 THEN 1 ELSE 0 END) END AS returned_next",
        "FROM SaleEvent s LEFT JOIN a ON a.event_id = s.event_id",
        "GROUP BY s.event_id, s.event_name, s.starts_on",
        "ORDER BY s.starts_on",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Acquisition depends on the customer's first non-cancelled order ever, not their first order in the event.",
      "`LEAD(event_id) OVER (ORDER BY starts_on)` names each event's next event; the last one gets NULL.",
      "A customer with several orders in the next event must be counted once.",
      "Start the final SELECT from the events so an event that acquired nobody still shows 0.",
    ],
    editorial: [
      "The question chains three steps. **Acquisition**: each customer's first non-cancelled order, `MIN(ordered_on)` over their non-cancelled orders; a customer is acquired by the event whose dates contain that day. A customer whose first order was cancelled is judged by the next real order — which may fall outside every sale, in which case no event acquired them.",
      "",
      "**The next event**: `LEAD(event_id) OVER (ORDER BY starts_on)` gives every event its successor in time, and NULL for the latest. **Coming back**: join each acquired customer to the next event's dates and to their non-cancelled orders inside it; `DISTINCT` makes a customer with three orders in the next sale count once.",
      "",
      "The final SELECT starts from the events, so an event that acquired nobody still appears with `acquired = 0` and `returned_next = 0`, while the latest event shows NULL because its `next_id` is NULL — the CASE keeps \"not measurable yet\" apart from \"nobody came back\". The alternative finds the next event with a correlated `MIN(starts_on) > this start` and counts returners with EXISTS inside SUM. Either is a handful of passes over orders and events.",
    ].join("\n"),
  },

  {
    slug: "flipkart-unscanned-awb-number-ranges-per-hub",
    title: "Flipkart: Unscanned Ekart AWB Numbers as Ranges per Hub",
    difficulty: "HARD",
    topics: ["Window Functions", "Subqueries", "Joins"],
    description: [
      "Each Ekart hub is allotted one block of consecutive AWB (air waybill) numbers, from `series_start` to `series_end` inclusive. Every AWB used on a parcel should appear at least once in the hub's manifest scans; a number of the block that was never scanned means a label was printed and lost, or never used. The hub audit lists them compactly, as ranges.",
      "",
      "For every hub, find the numbers of its block with **no scan at that hub**, and report each run of consecutive missing numbers as one row: `hub_code`, `gap_start`, `gap_end` and `missing_awbs` (how many numbers the range holds). A single missing number is a range whose start and end are equal; a hub with no scans at all is one range covering its whole block. Scans repeat, and scans of numbers outside the hub's own block are ignored. Order by `hub_code`, then `gap_start`.",
    ].join("\n"),
    tables: [
      {
        name: "AwbAllocation",
        columns: [
          { name: "hub_code", type: "varchar" },
          { name: "series_start", type: "int" },
          { name: "series_end", type: "int" },
        ],
        primaryKey: ["hub_code"],
        note: "One block of AWB numbers per hub; `series_end` is never below `series_start`, and blocks of different hubs never overlap.",
      },
      {
        name: "ManifestScan",
        columns: [
          { name: "scan_id", type: "int" },
          { name: "hub_code", type: "varchar" },
          { name: "awb_no", type: "int" },
          { name: "scanned_at", type: "datetime" },
        ],
        primaryKey: ["scan_id"],
        note: "One row per scan of a parcel label at a hub. A parcel can be scanned several times, and a misrouted parcel can be scanned at a hub that does not own its number.",
      },
    ],
    examples: [
      {
        AwbAllocation: [
          ["BLR-E", 1000101, 1000110],
          ["DEL-N", 2000001, 2000005],
          ["MUM-W", 3000001, 3000003],
        ],
        ManifestScan: [
          [1, "BLR-E", 1000101, "2024-10-01 09:10:00"],
          [2, "BLR-E", 1000102, "2024-10-01 09:12:00"],
          [3, "BLR-E", 1000102, "2024-10-01 18:40:00"],
          [4, "BLR-E", 1000105, "2024-10-02 10:00:00"],
          [5, "BLR-E", 1000106, "2024-10-02 10:05:00"],
          [6, "BLR-E", 1000110, "2024-10-03 08:30:00"],
          [7, "BLR-E", 2000004, "2024-10-03 08:31:00"],
          [8, "DEL-N", 2000002, "2024-10-01 11:00:00"],
          [9, "DEL-N", 2000003, "2024-10-01 11:02:00"],
          [10, "DEL-N", 2000005, "2024-10-02 15:20:00"],
        ],
      },
    ],
    gen: (rng) => {
      const hubs = sample(rng, ["BLR-E", "DEL-N", "MUM-W", "HYD-S", "KOL-C"], ri(rng, 1, 3));
      const alloc: Cell[][] = hubs.map((h, i) => {
        const start = (i + 1) * 1000000 + ri(rng, 1, 900) * 100 + 1;
        return [h, start, start + ri(rng, 0, 14)];
      });
      const scans: Cell[][] = [];
      for (const a of alloc) {
        const p = pick(rng, [0, 0.5, 0.7, 0.9, 1]);
        for (let no = a[1] as number; no <= (a[2] as number); no++) {
          for (let k = chance(rng, p) ? ri(rng, 1, 2) : 0; k > 0; k--) {
            scans.push([scans.length + 1, a[0]!, no, atTime(rng, dateBetween(rng, "2024-10-01", "2024-10-05"))]);
          }
        }
        // A misrouted label from another hub's block, or just past this hub's own block.
        if (chance(rng, 0.4)) {
          const other = pick(rng, alloc);
          scans.push([scans.length + 1, a[0]!, chance(rng, 0.5) ? (other[1] as number) : (a[2] as number) + 1, atTime(rng, "2024-10-06")]);
        }
      }
      return { AwbAllocation: alloc, ManifestScan: scans };
    },
    solution: [
      "WITH seen AS (",
      "  SELECT DISTINCT m.hub_code, m.awb_no",
      "  FROM ManifestScan m",
      "  JOIN AwbAllocation a ON a.hub_code = m.hub_code AND m.awb_no BETWEEN a.series_start AND a.series_end",
      "  UNION",
      "  SELECT hub_code, series_start - 1 FROM AwbAllocation",
      "  UNION",
      "  SELECT hub_code, series_end + 1 FROM AwbAllocation",
      "), paired AS (",
      "  SELECT hub_code, awb_no,",
      "         LEAD(awb_no) OVER (PARTITION BY hub_code ORDER BY awb_no) AS next_no",
      "  FROM seen",
      ")",
      "SELECT hub_code, awb_no + 1 AS gap_start, next_no - 1 AS gap_end, next_no - awb_no - 1 AS missing_awbs",
      "FROM paired",
      "WHERE next_no - awb_no > 1",
      "ORDER BY hub_code, gap_start",
    ].join("\n"),
    alternatives: [
      [
        "WITH seen AS (",
        "  SELECT m.hub_code, m.awb_no FROM ManifestScan m",
        "  JOIN AwbAllocation a ON a.hub_code = m.hub_code AND m.awb_no >= a.series_start AND m.awb_no <= a.series_end",
        "  UNION",
        "  SELECT hub_code, series_start - 1 FROM AwbAllocation",
        "  UNION",
        "  SELECT hub_code, series_end + 1 FROM AwbAllocation",
        ")",
        "SELECT hub_code, gap_start, gap_end, gap_end - gap_start + 1 AS missing_awbs",
        "FROM (",
        "  SELECT s.hub_code, s.awb_no + 1 AS gap_start,",
        "         (SELECT MIN(t.awb_no) FROM seen t WHERE t.hub_code = s.hub_code AND t.awb_no > s.awb_no) - 1 AS gap_end",
        "  FROM seen s",
        "  WHERE NOT EXISTS (SELECT 1 FROM seen u WHERE u.hub_code = s.hub_code AND u.awb_no = s.awb_no + 1)",
        ") g",
        "WHERE gap_end IS NOT NULL",
        "ORDER BY hub_code, gap_start",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Work with the numbers that *were* scanned: a run of missing numbers sits between two scanned numbers that are more than 1 apart.",
      "Reduce the scans to distinct numbers inside the hub's own block first — duplicates and misrouted labels would create or hide gaps.",
      "Gaps at the very start or end of a block have no scanned neighbour on one side. Add the fences `series_start - 1` and `series_end + 1` as if they had been scanned.",
      "`LEAD(awb_no)` gives each number's next scanned neighbour; where the jump exceeds 1, the gap runs from `awb_no + 1` to `next - 1`.",
    ],
    editorial: [
      "Listing missing numbers one by one would need a row for every number of the block; reporting them as **ranges** needs only the numbers that exist. Sort a hub's scanned numbers and look at each one's successor: if the successor is `awb_no + 1` nothing is missing between them, and if it is larger, every number strictly between them is missing — the range `awb_no + 1` to `next_no - 1`, holding `next_no - awb_no - 1` numbers. `LEAD(awb_no) OVER (PARTITION BY hub_code ORDER BY awb_no)` fetches that successor.",
      "",
      "Two preparations make it exact. The scans are first cut to **distinct** numbers **inside the hub's own block**: a repeated scan would pair a number with itself, and a misrouted label from another block (or just past the end of this one) would look like a scanned neighbour and hide a real gap. And the block's edges get **fences** — `series_start - 1` and `series_end + 1` are added as if scanned. Without them a gap at the start of the block has no left neighbour and a gap at the end no right one, and a hub with no scans would produce nothing at all; with them it gets one range covering its whole block. `UNION` (not UNION ALL) removes duplicates in the same step.",
      "",
      "The alternative finds the start of each gap with NOT EXISTS (`awb_no + 1` is not among the scanned numbers) and its end with a correlated `MIN` of the next scanned number. The fence after the block has no successor, so its NULL end is filtered out. The window version is one sort per hub.",
    ].join("\n"),
  },

  {
    slug: "flipkart-first-day-seller-logged-three-returns-in-a-week",
    title: "Flipkart: First Day a Seller Logged Three Returns in Seven Days",
    difficulty: "HARD",
    topics: ["Joins", "Subqueries", "Dates", "Window Functions"],
    description: [
      "Seller-quality monitoring raises a flag the first time a seller collects **3 or more returns within 7 days**. The window for a day `D` is `D` and the six days before it (from `D - 6` to `D`, inclusive).",
      "",
      "For each seller, find the **earliest return date `D`** on which the returns dated within `D`'s seven-day window number at least 3 (several returns can share a date). Return `seller_name` and `flagged_on` (that date) for every seller that was ever flagged. Seller names are unique. Order by `flagged_on`, then `seller_name`.",
    ].join("\n"),
    tables: [
      {
        name: "Seller",
        columns: [
          { name: "seller_id", type: "int" },
          { name: "seller_name", type: "varchar" },
        ],
        primaryKey: ["seller_id"],
        note: "One row per seller.",
      },
      {
        name: "SellerReturn",
        columns: [
          { name: "return_id", type: "int" },
          { name: "seller_id", type: "int" },
          { name: "returned_on", type: "date" },
        ],
        primaryKey: ["return_id"],
        note: "One row per customer return received by a seller; `seller_id` always names a seller.",
      },
    ],
    examples: [
      {
        Seller: [
          [1, "Metro Gadgets"],
          [2, "Desi Weaves"],
          [3, "Pixel Point"],
          [4, "Kirana Kart"],
        ],
        SellerReturn: [
          [1, 1, "2024-10-01"],
          [2, 1, "2024-10-05"],
          [3, 1, "2024-10-08"],
          [4, 1, "2024-10-10"],
          [5, 2, "2024-10-03"],
          [6, 2, "2024-10-03"],
          [7, 2, "2024-10-09"],
          [8, 3, "2024-10-02"],
          [9, 3, "2024-10-09"],
          [10, 3, "2024-10-16"],
          [11, 4, "2024-10-12"],
          [12, 4, "2024-10-12"],
          [13, 4, "2024-10-12"],
        ],
      },
    ],
    gen: (rng) => {
      const sellers = sample(rng, SELLERS, ri(rng, 1, 4)).map((name, i) => [i + 1, name] as Cell[]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 20);
      const rows: Cell[][] = seq(1, n).map((id) => [id, ri(rng, 1, sellers.length), dateBetween(rng, "2024-10-01", "2024-10-31")]);
      return { Seller: sellers, SellerReturn: rows };
    },
    solution: [
      "WITH hit AS (",
      "  SELECT r.seller_id, r.returned_on",
      "  FROM SellerReturn r",
      "  WHERE (SELECT COUNT(*) FROM SellerReturn x",
      "         WHERE x.seller_id = r.seller_id",
      "           AND x.returned_on BETWEEN DATE_SUB(r.returned_on, INTERVAL 6 DAY) AND r.returned_on) >= 3",
      ")",
      "SELECT s.seller_name, MIN(h.returned_on) AS flagged_on",
      "FROM hit h",
      "JOIN Seller s ON s.seller_id = h.seller_id",
      "GROUP BY s.seller_id, s.seller_name",
      "ORDER BY flagged_on, s.seller_name",
    ].join("\n"),
    alternatives: [
      [
        "WITH x AS (",
        "  SELECT seller_id, returned_on,",
        "         LAG(returned_on, 2) OVER (PARTITION BY seller_id ORDER BY returned_on, return_id) AS two_back",
        "  FROM SellerReturn",
        ")",
        "SELECT s.seller_name, MIN(x.returned_on) AS flagged_on",
        "FROM x JOIN Seller s ON s.seller_id = x.seller_id",
        "WHERE x.two_back IS NOT NULL AND DATEDIFF(x.returned_on, x.two_back) <= 6",
        "GROUP BY s.seller_id, s.seller_name",
        "ORDER BY flagged_on, s.seller_name",
      ].join("\n"),
      [
        "SELECT s.seller_name, MIN(d.returned_on) AS flagged_on",
        "FROM (SELECT a.seller_id, a.returned_on",
        "      FROM SellerReturn a",
        "      JOIN SellerReturn b ON b.seller_id = a.seller_id AND DATEDIFF(a.returned_on, b.returned_on) BETWEEN 0 AND 6",
        "      GROUP BY a.return_id, a.seller_id, a.returned_on",
        "      HAVING COUNT(*) >= 3) d",
        "JOIN Seller s ON s.seller_id = d.seller_id",
        "GROUP BY s.seller_id, s.seller_name",
        "ORDER BY flagged_on, s.seller_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "For each return date, count the seller's returns dated from six days earlier up to that date.",
      "Returns on the same date all fall in each other's windows — count rows, not dates.",
      "Among the dates that reach three, the seller is flagged on the earliest.",
      "With LAG: if the return two places earlier (in date order) is within six days, three returns fit in one window ending here.",
    ],
    editorial: [
      "The rule is a **trailing window by date**, not by row count: the window ending on day `D` holds every return from `D − 6` to `D`. For each return, a correlated subquery counts the seller's returns in the window that ends on that return's date, using `BETWEEN DATE_SUB(returned_on, INTERVAL 6 DAY) AND returned_on`. Dates that reach three are hits; the seller's flag date is the earliest hit, `MIN(returned_on)`. Only dates that actually have a return are candidates, which is enough — the count can only rise on a day a return arrives.",
      "",
      "Same-day returns all count: three returns on one date flag that date. The window is inclusive at both ends, so returns on the 3rd and the 9th share a window.",
      "",
      "The LAG alternative is neater: sort a seller's returns by date (and id), and look two rows back. If that return is within six days of this one, the three rows from it to here fit in one window ending today; and the earliest such row is exactly the earliest flag date. The self-join version pairs each return with every return of the same seller up to six days earlier and keeps those with at least three partners (itself included). The window version is one sort per seller; the others are quadratic per seller.",
    ].join("\n"),
  },

  {
    slug: "flipkart-how-often-the-buy-box-changed-hands",
    title: "Flipkart: How Often Each Product's Buy Box Changed Hands",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "When several sellers offer the same product, one wins the **buy box** — the default \"Buy Now\" offer. In this exercise the winner on a day is the offer with the **lowest price**; ties go to the **higher `seller_rating`**, then to the **lower `seller_id`**. Pricing analysts want to know how unstable the buy box is.",
      "",
      "Offers are snapshotted daily, but not every product has offers every day. For each product, take its snapshot days in date order and count how many times the winner **differs from the winner on the product's previous snapshot day**. Return `product_id`, `snapshot_days` (days with at least one offer) and `winner_changes`, ordered by `winner_changes` descending, then `product_id`.",
    ].join("\n"),
    tables: [
      {
        name: "OfferSnapshot",
        columns: [
          { name: "snapshot_date", type: "date" },
          { name: "product_id", type: "int" },
          { name: "seller_id", type: "int" },
          { name: "price", type: "int" },
          { name: "seller_rating", type: "decimal" },
        ],
        primaryKey: ["snapshot_date", "product_id", "seller_id"],
        note: "One row per seller's live offer on a product on a day; `seller_rating` has one decimal place.",
      },
    ],
    examples: [
      {
        OfferSnapshot: [
          ["2024-10-01", 1, 1, 999, 4.3],
          ["2024-10-01", 1, 2, 1049, 4.5],
          ["2024-10-02", 1, 1, 1049, 4.3],
          ["2024-10-02", 1, 2, 1049, 4.5],
          ["2024-10-03", 1, 2, 999, 4.5],
          ["2024-10-03", 1, 3, 999, 4.5],
          ["2024-10-05", 1, 3, 949, 4.1],
          ["2024-10-01", 2, 4, 499, 4.0],
          ["2024-10-02", 2, 4, 499, 4.0],
          ["2024-10-02", 2, 1, 499, 4.0],
          ["2024-10-03", 3, 2, 1999, 4.2],
        ],
      },
    ],
    gen: (rng) => {
      const days = ["2024-10-01", "2024-10-02", "2024-10-03", "2024-10-04", "2024-10-05", "2024-10-06"];
      const rows: Cell[][] = [];
      for (const p of seq(1, ri(rng, 1, 3))) {
        for (const d of sample(rng, days, ri(rng, 1, 6))) {
          for (const s of sample(rng, [1, 2, 3, 4], ri(rng, 1, 3))) rows.push([d, p, s, pick(rng, [949, 999, 999, 1049]), pick(rng, [4.1, 4.3, 4.3, 4.5])]);
        }
      }
      return { OfferSnapshot: rows };
    },
    solution: [
      "WITH ranked AS (",
      "  SELECT snapshot_date, product_id, seller_id,",
      "         ROW_NUMBER() OVER (PARTITION BY product_id, snapshot_date ORDER BY price, seller_rating DESC, seller_id) AS rn",
      "  FROM OfferSnapshot",
      "), winners AS (",
      "  SELECT product_id, snapshot_date, seller_id,",
      "         LAG(seller_id) OVER (PARTITION BY product_id ORDER BY snapshot_date) AS prev_winner",
      "  FROM ranked WHERE rn = 1",
      ")",
      "SELECT product_id,",
      "       COUNT(*) AS snapshot_days,",
      "       SUM(CASE WHEN prev_winner IS NOT NULL AND prev_winner <> seller_id THEN 1 ELSE 0 END) AS winner_changes",
      "FROM winners",
      "GROUP BY product_id",
      "ORDER BY winner_changes DESC, product_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH win AS (",
        "  SELECT o.snapshot_date, o.product_id, o.seller_id FROM OfferSnapshot o",
        "  WHERE NOT EXISTS (",
        "    SELECT 1 FROM OfferSnapshot b",
        "    WHERE b.snapshot_date = o.snapshot_date AND b.product_id = o.product_id",
        "      AND (b.price < o.price",
        "           OR (b.price = o.price AND b.seller_rating > o.seller_rating)",
        "           OR (b.price = o.price AND b.seller_rating = o.seller_rating AND b.seller_id < o.seller_id)))",
        ")",
        "SELECT w.product_id, COUNT(*) AS snapshot_days,",
        "       SUM(CASE WHEN EXISTS (",
        "             SELECT 1 FROM win p",
        "             WHERE p.product_id = w.product_id AND p.seller_id <> w.seller_id",
        "               AND p.snapshot_date = (SELECT MAX(q.snapshot_date) FROM win q WHERE q.product_id = w.product_id AND q.snapshot_date < w.snapshot_date))",
        "           THEN 1 ELSE 0 END) AS winner_changes",
        "FROM win w",
        "GROUP BY w.product_id",
        "ORDER BY winner_changes DESC, w.product_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First reduce the snapshot to one winner per product and day.",
      "`ROW_NUMBER()` ordered by price, rating descending and seller id picks exactly one winner even when offers tie.",
      "Then compare each day's winner with the previous snapshot day's winner of the same product — LAG.",
      "The first snapshot day of a product has no previous winner and is not a change.",
    ],
    editorial: [
      "Two window passes do the work. The first picks the **winner** of each product-day: `ROW_NUMBER()` partitioned by product and date, ordered by `price`, then `seller_rating DESC`, then `seller_id`. The three-level order is what makes the pick unique — two sellers at the same price and rating would otherwise make the winner, and every count after it, depend on storage order.",
      "",
      "The second pass lines up each product's winners by date and fetches the previous one with `LAG(seller_id)`. Because only days with offers have a winner row, \"previous\" means the product's previous **snapshot day**, which is exactly what the statement asks — a day with no offers is skipped, not treated as a change. A change is a day whose previous winner exists and differs; the first day has a NULL previous winner and counts as none. Then a GROUP BY per product counts days and changes.",
      "",
      "The alternative finds winners with NOT EXISTS (no better offer the same day) and the previous day with a correlated `MAX(snapshot_date) < this day`. It is quadratic but shows the logic without windows; the window version is two sorts.",
    ].join("\n"),
  },
];
