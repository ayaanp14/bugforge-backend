import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, atTime, chance, dateBetween, names, pick, ri, roundTo, sample, shuffle } from "./kit.js";

/**
 * World problems: an e-commerce marketplace — the questions an analyst, a
 * category manager or an ops lead at an Indian online marketplace is asked
 * every week. Orders and their line items, carts and how many are abandoned,
 * returns and refunds, coupons and their budgets, sellers and their GMV,
 * product reviews, wishlists, delivery pincodes and SLA breaches, GST
 * invoices (CGST/SGST against IGST), and flash sales. Easiest first: single
 * filters, joins and GROUP BYs, then two ideas combined (rates with HAVING,
 * window rankings, correlated subqueries, date bucketing), then several steps
 * (sessionisation, retention cohorts, medians, streaks, running totals,
 * overlapping intervals).
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);

const PAY_MODES = ["UPI", "Card", "NetBanking", "COD"] as const;
const ORDER_STATUS = ["placed", "packed", "shipped", "delivered", "cancelled"] as const;
const CATEGORIES = ["Mobiles", "Fashion", "Home", "Beauty", "Grocery", "Electronics"] as const;
const STORES = [
  "Shree Ganesh Traders", "UrbanKart", "Lakshmi Textiles", "TechBazaar", "Desi Basket", "GlowUp Beauty",
  "HomeNest", "Mehta Electronics", "Kirana Express", "StyleStreet", "GadgetHub", "Patel Handlooms",
] as const;
const ITEMS: Record<string, readonly string[]> = {
  Mobiles: ["Redmi Note 13", "Galaxy M34", "iPhone 15", "Moto G54", "Nord CE 3"],
  Fashion: ["Kurta Set", "Denim Jacket", "Running Shoes", "Silk Saree", "Linen Shirt"],
  Home: ["Pressure Cooker", "Bedsheet Set", "Mixer Grinder", "Wall Clock", "Steel Bottle"],
  Beauty: ["Face Wash", "Kajal Pen", "Sunscreen SPF50", "Hair Oil", "Lip Balm"],
  Grocery: ["Basmati Rice 5kg", "Toor Dal 1kg", "Ghee 1L", "Masala Chai", "Almonds 500g"],
  Electronics: ["Neckband", "Power Bank", "Smart Watch", "Bluetooth Speaker", "Trimmer"],
};
const COUPON_CODES = ["WELCOME100", "FESTIVE20", "UPI50", "BIGSALE", "FREESHIP", "NEWUSER", "DIWALI500", "SAVE10"] as const;

export const WORLD_ECOMMERCE: SqlProblemSpec[] = [
  {
    slug: "prepaid-orders-awaiting-dispatch",
    title: "Prepaid High-Value Orders Awaiting Dispatch",
    difficulty: "EASY",
    topics: ["Basics", "Conditional Logic"],
    description: [
      "The warehouse prioritises prepaid orders of high value: the money is already collected, so a delay costs a refund. An order is **prepaid** when its `payment_mode` is anything but `COD`, and it is **awaiting dispatch** while its status is `placed` or `packed`.",
      "",
      "Return every prepaid order awaiting dispatch whose `order_total` is **at least ₹5,000**, with the columns `order_id`, `payment_mode` and `order_total`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "orders",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "payment_mode", type: "enum", values: [...PAY_MODES] },
          { name: "order_total", type: "decimal" },
          { name: "status", type: "enum", values: [...ORDER_STATUS] },
          { name: "placed_at", type: "datetime" },
        ],
        primaryKey: ["order_id"],
        note: "One row per order. `order_total` is in rupees, GST included.",
      },
    ],
    examples: [
      {
        orders: [
          [9001, 11, "UPI", 7499, "placed", "2024-11-02 10:14:00"],
          [9002, 12, "COD", 12999, "placed", "2024-11-02 10:20:00"],
          [9003, 13, "Card", 5000, "packed", "2024-11-02 11:05:00"],
          [9004, 14, "NetBanking", 4999, "placed", "2024-11-02 11:40:00"],
          [9005, 15, "UPI", 18990, "shipped", "2024-11-02 12:02:00"],
          [9006, 16, "Card", 25499, "packed", "2024-11-02 12:30:00"],
          [9007, 17, "UPI", 6200, "cancelled", "2024-11-02 13:10:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 1 : ri(rng, 3, 20);
      const rows = seq(9001, n).map((id) => {
        const total = chance(rng, 0.15) ? pick(rng, [4999, 5000, 5001]) : roundTo(rng, 199, 30000, 10) - 1;
        const placed = atTime(rng, dateBetween(rng, "2024-10-01", "2024-12-31"));
        return [id, ri(rng, 1, 40), pick(rng, PAY_MODES), total, pick(rng, ORDER_STATUS), placed];
      });
      return { orders: rows };
    },
    solution: [
      "SELECT order_id, payment_mode, order_total",
      "FROM orders",
      "WHERE payment_mode <> 'COD'",
      "  AND status IN ('placed', 'packed')",
      "  AND order_total >= 5000",
    ].join("\n"),
    alternatives: [
      "SELECT order_id, payment_mode, order_total FROM orders WHERE payment_mode IN ('UPI', 'Card', 'NetBanking') AND (status = 'placed' OR status = 'packed') AND NOT order_total < 5000",
      "SELECT order_id, payment_mode, order_total FROM orders WHERE CASE WHEN payment_mode = 'COD' THEN 0 WHEN status NOT IN ('placed', 'packed') THEN 0 WHEN order_total < 5000 THEN 0 ELSE 1 END = 1",
    ],
    hints: [
      "There are three independent conditions; every one of them must hold, so they are joined with AND.",
      "\"Prepaid\" is easier to say as what it is not: the payment mode is not `COD`.",
      "\"At least ₹5,000\" includes an order of exactly ₹5,000.",
    ],
    editorial: [
      "Each condition in the statement is a filter on one column of the same row, so the whole answer is one `WHERE` clause with three conditions joined by `AND`.",
      "",
      "Prepaid is the complement of cash on delivery, so `payment_mode <> 'COD'` covers UPI, cards and net banking — and keeps working if the payments team adds a new mode tomorrow. Listing the modes with `IN (...)` is equivalent on this data. Awaiting dispatch is a set of two statuses, which `IN ('placed', 'packed')` states directly; `status = 'placed' OR status = 'packed'` is the same thing, but parenthesise the OR or it binds wrongly against the ANDs around it.",
      "",
      "The value condition is inclusive: `>= 5000` keeps order 9003 of exactly ₹5,000, while ₹4,999 is out. A shipped or cancelled order is out however large it is. The query reads the table once; on a real orders table an index on `(status, order_total)` makes it a range scan.",
    ].join("\n"),
  },

  {
    slug: "catalogue-products-nobody-wishlisted",
    title: "Catalogue Products Nobody Has Wishlisted",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "The merchandising team wants to know which listings have attracted no interest at all. A customer saves a product for later by adding it to their wishlist; the `wishlist` table also keeps entries for products that were later **delisted** and are no longer in `products`.",
      "",
      "Return every product in `products` that **no customer has ever wishlisted**, with the columns `product_id`, `name` and `category`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "products",
        columns: [
          { name: "product_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "category", type: "varchar" },
          { name: "price", type: "int" },
        ],
        primaryKey: ["product_id"],
        note: "One row per product currently listed; `price` in rupees.",
      },
      {
        name: "wishlist",
        columns: [
          { name: "customer_id", type: "int" },
          { name: "product_id", type: "int" },
          { name: "added_on", type: "date" },
        ],
        primaryKey: ["customer_id", "product_id"],
        note: "One row per product a customer saved. A `product_id` here may belong to a delisted product.",
      },
    ],
    examples: [
      {
        products: [
          [501, "Redmi Note 13", "Mobiles", 17999],
          [502, "Kurta Set", "Fashion", 1299],
          [503, "Pressure Cooker", "Home", 2199],
          [504, "Sunscreen SPF50", "Beauty", 399],
          [505, "Power Bank", "Electronics", 1499],
        ],
        wishlist: [
          [1, 502, "2024-09-01"],
          [2, 502, "2024-09-03"],
          [2, 505, "2024-09-04"],
          [3, 599, "2024-08-15"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const ids = sample(rng, seq(501, 30), n);
      const products = ids.map((id) => {
        const cat = pick(rng, CATEGORIES);
        return [id, pick(rng, ITEMS[cat]!), cat, roundTo(rng, 100, 40000, 100) - 1];
      });
      const liked = chance(rng, 0.1) ? ids : sample(rng, ids, ri(rng, 0, n));
      const rows: Cell[][] = [];
      const seen = new Set<string>();
      for (let k = 0; k < ri(rng, 0, 18); k++) {
        const delisted = liked.length === 0 || chance(rng, 0.15);
        const pid = delisted ? ri(rng, 590, 599) : pick(rng, liked);
        const cid = ri(rng, 1, 15);
        if (seen.has(`${cid}:${pid}`)) continue;
        seen.add(`${cid}:${pid}`);
        rows.push([cid, pid, dateBetween(rng, "2024-06-01", "2024-12-31")]);
      }
      return { products, wishlist: rows };
    },
    solution: [
      "SELECT p.product_id, p.name, p.category",
      "FROM products p",
      "LEFT JOIN wishlist w ON w.product_id = p.product_id",
      "WHERE w.customer_id IS NULL",
    ].join("\n"),
    alternatives: [
      "SELECT product_id, name, category FROM products p WHERE NOT EXISTS (SELECT 1 FROM wishlist w WHERE w.product_id = p.product_id)",
      "SELECT product_id, name, category FROM products WHERE product_id NOT IN (SELECT product_id FROM wishlist)",
    ],
    hints: [
      "Start from `products`: every row of the answer is a product.",
      "A LEFT JOIN keeps a product with no wishlist row; the wishlist columns are NULL on that row.",
      "Wishlist entries for delisted products have no product to attach to, so they never reach the answer.",
    ],
    editorial: [
      "This is an anti join: the products with no partner row in `wishlist`. The LEFT JOIN form keeps every product, attaching its wishlist rows when there are any; a product nobody saved appears once with NULL in every wishlist column. Testing a column that is never NULL on a real wishlist row — `customer_id`, part of the key — for `IS NULL` keeps exactly those products. A product saved by several customers appears several times before the filter, but every one of those rows fails it, so no duplicates reach the answer.",
      "",
      "`NOT EXISTS` states the same thing per product and stops at the first match. `NOT IN` works here too because `wishlist.product_id` is part of the primary key and can never be NULL; if the column were nullable, one NULL would make every `NOT IN` comparison unknown and empty the answer.",
      "",
      "The stale rows for delisted products (599 in the example) match no product and are simply ignored: the query starts from `products`, so they cannot add rows. With an index on `wishlist.product_id` each product costs one index probe.",
    ].join("\n"),
  },

  {
    slug: "seller-gmv-from-delivered-items",
    title: "Seller GMV From Delivered Items",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "Gross merchandise value (GMV) is what customers paid for goods they actually kept. Each order line belongs to one seller; only lines with `item_status` = `delivered` count — cancelled and returned lines add nothing.",
      "",
      "For every seller with **at least one delivered line**, return `seller_id`, `store_name` and `gmv`, the sum of `quantity * unit_price` over their delivered lines. Sellers with no delivered line are left out. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "sellers",
        columns: [
          { name: "seller_id", type: "int" },
          { name: "store_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["seller_id"],
        note: "One row per seller on the marketplace.",
      },
      {
        name: "order_items",
        columns: [
          { name: "item_id", type: "int" },
          { name: "order_id", type: "int" },
          { name: "seller_id", type: "int" },
          { name: "quantity", type: "int" },
          { name: "unit_price", type: "int" },
          { name: "item_status", type: "enum", values: ["delivered", "cancelled", "returned"] },
        ],
        primaryKey: ["item_id"],
        note: "One row per line of an order; `unit_price` in rupees. `seller_id` is always in `sellers`.",
      },
    ],
    examples: [
      {
        sellers: [
          [1, "UrbanKart", "Mumbai"],
          [2, "Lakshmi Textiles", "Chennai"],
          [3, "TechBazaar", "Bengaluru"],
          [4, "Desi Basket", "Pune"],
        ],
        order_items: [
          [1, 7001, 1, 2, 499, "delivered"],
          [2, 7001, 3, 1, 1999, "delivered"],
          [3, 7002, 1, 1, 899, "returned"],
          [4, 7003, 2, 3, 650, "delivered"],
          [5, 7004, 4, 1, 320, "cancelled"],
          [6, 7005, 3, 2, 1999, "delivered"],
          [7, 7006, 1, 1, 1299, "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 8);
      const stores = sample(rng, STORES, n);
      const sellers = stores.map((s, i) => [i + 1, s, pick(rng, ["Mumbai", "Delhi", "Bengaluru", "Surat", "Jaipur", "Pune"])]);
      const m = chance(rng, 0.08) ? 0 : ri(rng, 1, 20);
      const lines = seq(1, m).map((id) => [
        id, 7000 + ri(rng, 1, 12), ri(rng, 1, n), ri(rng, 1, 4), roundTo(rng, 100, 5000, 10) - 1,
        pick(rng, ["delivered", "delivered", "delivered", "cancelled", "returned"]),
      ]);
      return { sellers, order_items: lines };
    },
    solution: [
      "SELECT s.seller_id, s.store_name, SUM(i.quantity * i.unit_price) AS gmv",
      "FROM sellers s",
      "JOIN order_items i ON i.seller_id = s.seller_id",
      "WHERE i.item_status = 'delivered'",
      "GROUP BY s.seller_id, s.store_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT s.seller_id, s.store_name, g.gmv",
        "FROM sellers s",
        "JOIN (SELECT seller_id, SUM(quantity * unit_price) AS gmv FROM order_items WHERE item_status = 'delivered' GROUP BY seller_id) g",
        "  ON g.seller_id = s.seller_id",
      ].join("\n"),
      [
        "SELECT s.seller_id, s.store_name, SUM(CASE WHEN i.item_status = 'delivered' THEN i.quantity * i.unit_price ELSE 0 END) AS gmv",
        "FROM sellers s JOIN order_items i ON i.seller_id = s.seller_id",
        "GROUP BY s.seller_id, s.store_name",
        "HAVING SUM(CASE WHEN i.item_status = 'delivered' THEN 1 ELSE 0 END) > 0",
      ].join("\n"),
    ],
    hints: [
      "A line's value is its quantity times its unit price; GMV adds those up per seller.",
      "Filter to delivered lines before grouping, so cancelled and returned lines never enter the sum.",
      "The store name comes from `sellers`, so join it in and group by the seller's id and name.",
    ],
    editorial: [
      "Join each order line to its seller, keep the delivered lines, and add up `quantity * unit_price` per seller. Filtering in `WHERE` — before `GROUP BY` — means a seller whose only lines were cancelled or returned has no rows left at all and drops out, which is what the statement asks for. Grouping by both `seller_id` and `store_name` keeps the query valid under MySQL's ONLY_FULL_GROUP_BY; the name is determined by the id anyway.",
      "",
      "Two other shapes give the same answer. Aggregating `order_items` first in a derived table and joining the totals to `sellers` touches the sellers table once per seller rather than once per line. Conditional aggregation — summing a CASE that yields 0 for other statuses — keeps every line in the group and needs a HAVING to drop sellers with no delivered line, since their sum would be 0 rather than absent.",
      "",
      "The cost is one pass over `order_items` plus a hash or index lookup into `sellers` per line.",
    ].join("\n"),
  },

  {
    slug: "b2b-invoices-with-malformed-gstin",
    title: "B2B Invoices With a Malformed GSTIN",
    difficulty: "EASY",
    topics: ["Strings", "Basics"],
    description: [
      "Business buyers can claim input tax credit only if their invoice carries a valid GSTIN. Before filing the monthly GSTR-1, the finance team flags invoices whose GSTIN fails two basic checks: a GSTIN is **exactly 15 characters long**, and its **14th character is always `Z`**. A missing GSTIN (NULL) is malformed too.",
      "",
      "Return every malformed invoice with the columns `invoice_no` and `buyer_name`, **ordered by `invoice_no`**. All GSTINs are stored in upper case.",
    ].join("\n"),
    tables: [
      {
        name: "b2b_invoices",
        columns: [
          { name: "invoice_no", type: "varchar" },
          { name: "buyer_name", type: "varchar" },
          { name: "buyer_gstin", type: "varchar" },
          { name: "taxable_value", type: "int" },
        ],
        primaryKey: ["invoice_no"],
        note: "One row per invoice to a business buyer. `buyer_gstin` may be NULL when the buyer never entered it.",
      },
    ],
    examples: [
      {
        b2b_invoices: [
          ["INV-24-0101", "Sharma Traders", "27AAPFU0939F1ZV", 42000],
          ["INV-24-0102", "Nair Agencies", "29AAGCB1286Q1Z", 18500],
          ["INV-24-0103", "Rao Electricals", null, 9600],
          ["INV-24-0104", "Gupta & Sons", "07AABCS1429B1AK", 27300],
          ["INV-24-0105", "Bose Pharma", "19AACCB2230M1ZQ", 55000],
          ["INV-24-0106", "Patel Kirana", "24AAKFP5214L1ZPX", 7400],
        ],
      },
    ],
    gen: (rng) => {
      const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
      const L = () => letters[ri(rng, 0, letters.length - 1)]!;
      const D = () => String(ri(rng, 0, 9));
      const good = () => `${String(ri(rng, 1, 37)).padStart(2, "0")}${L()}${L()}${L()}${L()}${L()}${D()}${D()}${D()}${D()}${L()}${ri(rng, 1, 9)}Z${chance(rng, 0.5) ? L() : D()}`;
      const n = ri(rng, 1, 14);
      const rows = seq(101, n).map((k) => {
        let g: string | null = good();
        const r = rng();
        if (r < 0.1) g = null;
        else if (r < 0.2) g = g.slice(0, 14);
        else if (r < 0.3) g = g + D();
        else if (r < 0.4) g = g.slice(0, 13) + pick(rng, ["A", "Y", "1"]) + g.slice(14);
        return [`INV-24-0${k}`, `${pick(rng, ["Sharma", "Nair", "Rao", "Gupta", "Bose", "Patel", "Iyer", "Khan"])} ${pick(rng, ["Traders", "Agencies", "Stores", "Enterprises"])}`, g, roundTo(rng, 1000, 90000, 100)];
      });
      return { b2b_invoices: rows };
    },
    solution: [
      "SELECT invoice_no, buyer_name",
      "FROM b2b_invoices",
      "WHERE buyer_gstin IS NULL",
      "   OR CHAR_LENGTH(buyer_gstin) <> 15",
      "   OR SUBSTRING(buyer_gstin, 14, 1) <> 'Z'",
      "ORDER BY invoice_no",
    ].join("\n"),
    alternatives: [
      "SELECT invoice_no, buyer_name FROM b2b_invoices WHERE NOT (COALESCE(LENGTH(buyer_gstin), 0) = 15 AND buyer_gstin LIKE '_____________Z_') ORDER BY invoice_no",
      "SELECT invoice_no, buyer_name FROM b2b_invoices WHERE invoice_no NOT IN (SELECT invoice_no FROM b2b_invoices WHERE CHAR_LENGTH(buyer_gstin) = 15 AND RIGHT(LEFT(buyer_gstin, 14), 1) = 'Z') ORDER BY invoice_no",
    ],
    ordered: true,
    hints: [
      "`CHAR_LENGTH` (or `LENGTH`, for plain ASCII text) gives the number of characters.",
      "`SUBSTRING(s, 14, 1)` is the 14th character; positions in SQL start at 1.",
      "A NULL GSTIN makes both comparisons unknown rather than true — test it with IS NULL on its own.",
    ],
    editorial: [
      "An invoice is malformed when any one check fails, so the conditions are joined with `OR`: the GSTIN is missing, its length is not 15, or its 14th character is not `Z`.",
      "",
      "The NULL case needs its own test. `CHAR_LENGTH(NULL) <> 15` is NULL, not true, and so is the substring comparison, so without `buyer_gstin IS NULL` an invoice with no GSTIN would silently pass. Writing the rule as the negation of \"valid\" works too, provided the NULL is turned into something definite first — `COALESCE(LENGTH(...), 0) = 15` is false for a missing GSTIN, so `NOT (...)` is true.",
      "",
      "The 14th character can be read with `SUBSTRING`, with `RIGHT(LEFT(s, 14), 1)`, or matched with the pattern `LIKE '_____________Z_'` (thirteen underscores, Z, one underscore — which also enforces the length of 15). Because GSTINs are upper case, the comparison with `'Z'` never depends on collation. This is a single scan of the invoices; real validation would also check the state code and the checksum digit.",
    ].join("\n"),
  },

  {
    slug: "coupon-redemption-summary-per-code",
    title: "Coupon Redemption Summary per Code",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "The growth team reviews every coupon it has created, including the ones nobody used. Each use of a coupon on an order is one row of `coupon_redemptions`.",
      "",
      "Return one row per coupon in `coupons` with the columns `code`, `redemptions` (the number of times it was used) and `total_discount` (the rupees it gave away). A coupon never used shows **0** in both columns. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "coupons",
        columns: [
          { name: "code", type: "varchar" },
          { name: "discount_type", type: "enum", values: ["flat", "percent"] },
          { name: "valid_till", type: "date" },
        ],
        primaryKey: ["code"],
        note: "One row per coupon the marketing team created.",
      },
      {
        name: "coupon_redemptions",
        columns: [
          { name: "redemption_id", type: "int" },
          { name: "code", type: "varchar" },
          { name: "order_id", type: "int" },
          { name: "discount_amount", type: "int" },
        ],
        primaryKey: ["redemption_id"],
        note: "One row per order a coupon was applied to; `discount_amount` in rupees. `code` is always in `coupons`.",
      },
    ],
    examples: [
      {
        coupons: [
          ["WELCOME100", "flat", "2024-12-31"],
          ["FESTIVE20", "percent", "2024-11-15"],
          ["UPI50", "flat", "2024-12-31"],
          ["DIWALI500", "flat", "2024-11-05"],
        ],
        coupon_redemptions: [
          [1, "WELCOME100", 8101, 100],
          [2, "FESTIVE20", 8102, 340],
          [3, "WELCOME100", 8103, 100],
          [4, "FESTIVE20", 8104, 1200],
          [5, "UPI50", 8105, 50],
          [6, "FESTIVE20", 8106, 85],
        ],
      },
    ],
    gen: (rng) => {
      const codes = sample(rng, COUPON_CODES, ri(rng, 1, 8));
      const coupons = codes.map((c) => [c, pick(rng, ["flat", "percent"]), dateBetween(rng, "2024-10-01", "2025-03-31")]);
      const used = chance(rng, 0.1) ? [] : sample(rng, codes, ri(rng, 1, codes.length));
      const m = used.length ? ri(rng, 1, 18) : 0;
      const rows = seq(1, m).map((id) => [id, pick(rng, used), 8100 + id, pick(rng, [50, 100, 150, 200, 340, 500, 1200, ri(rng, 20, 900)])]);
      return { coupons, coupon_redemptions: rows };
    },
    solution: [
      "SELECT c.code, COUNT(r.redemption_id) AS redemptions, COALESCE(SUM(r.discount_amount), 0) AS total_discount",
      "FROM coupons c",
      "LEFT JOIN coupon_redemptions r ON r.code = c.code",
      "GROUP BY c.code",
    ].join("\n"),
    alternatives: [
      [
        "SELECT c.code,",
        "       (SELECT COUNT(*) FROM coupon_redemptions r WHERE r.code = c.code) AS redemptions,",
        "       (SELECT IFNULL(SUM(discount_amount), 0) FROM coupon_redemptions r WHERE r.code = c.code) AS total_discount",
        "FROM coupons c",
      ].join("\n"),
      [
        "SELECT c.code, COALESCE(t.n, 0) AS redemptions, COALESCE(t.amt, 0) AS total_discount",
        "FROM coupons c LEFT JOIN (SELECT code, COUNT(*) AS n, SUM(discount_amount) AS amt FROM coupon_redemptions GROUP BY code) t ON t.code = c.code",
      ].join("\n"),
    ],
    hints: [
      "An inner join would lose the coupons nobody used; which join keeps them?",
      "`COUNT(column)` skips NULLs, `COUNT(*)` does not — on an unmatched coupon they differ.",
      "`SUM` over no rows is NULL, not 0.",
    ],
    editorial: [
      "Every coupon must appear, used or not, so start from `coupons` and LEFT JOIN the redemptions. A used coupon gets one joined row per redemption; an unused one gets a single row with NULL in every redemption column.",
      "",
      "That NULL row is why the aggregates need care. `COUNT(r.redemption_id)` counts non-NULL values, so the unused coupon counts 0 — `COUNT(*)` would count the padding row and report 1. `SUM(r.discount_amount)` over nothing but a NULL is NULL, and `COALESCE(..., 0)` turns it into the 0 the statement asks for.",
      "",
      "Correlated scalar subqueries give the same result one coupon at a time, and there `COUNT(*)` is right because a coupon with no redemptions has no rows at all. Pre-aggregating the redemptions per code and LEFT JOINing the totals is the third shape, and on a large redemptions table usually the fastest: one grouped pass, then one row per coupon to join.",
    ].join("\n"),
  },

  {
    slug: "marketplace-orders-per-month-2024",
    title: "Marketplace Orders per Month in 2024",
    difficulty: "EASY",
    topics: ["Dates", "Aggregation"],
    description: [
      "For the annual review, the leadership team wants the order count of each month of **calendar year 2024**, leaving out **cancelled** orders. Orders placed in 2023 or 2025 are not part of it.",
      "",
      "Return the columns `month` — the month as text in the form `YYYY-MM` — and `orders`, the number of non-cancelled orders placed in that month. Months with no such order are not listed. Return the rows **ordered by `month`**.",
    ].join("\n"),
    tables: [
      {
        name: "orders",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "placed_at", type: "datetime" },
          { name: "status", type: "enum", values: [...ORDER_STATUS] },
        ],
        primaryKey: ["order_id"],
        note: "One row per order; `placed_at` is when the customer paid or confirmed it.",
      },
    ],
    examples: [
      {
        orders: [
          [1, 21, "2023-12-31 23:58:10", "delivered"],
          [2, 22, "2024-01-01 00:04:45", "delivered"],
          [3, 23, "2024-01-19 14:22:00", "cancelled"],
          [4, 21, "2024-01-28 09:15:30", "shipped"],
          [5, 24, "2024-03-02 18:40:00", "delivered"],
          [6, 25, "2024-12-31 22:10:05", "placed"],
          [7, 26, "2025-01-01 00:00:01", "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 22);
      const rows = seq(1, n).map((id) => {
        const r = rng();
        const day = r < 0.1 ? pick(rng, ["2023-12-31", "2025-01-01"]) : r < 0.2 ? pick(rng, ["2024-01-01", "2024-12-31", "2024-06-30", "2024-07-01"]) : dateBetween(rng, "2024-01-01", "2024-12-31");
        return [id, ri(rng, 1, 30), atTime(rng, day), pick(rng, ORDER_STATUS)];
      });
      return { orders: rows };
    },
    solution: [
      "SELECT DATE_FORMAT(placed_at, '%Y-%m') AS month, COUNT(*) AS orders",
      "FROM orders",
      "WHERE YEAR(placed_at) = 2024 AND status <> 'cancelled'",
      "GROUP BY DATE_FORMAT(placed_at, '%Y-%m')",
      "ORDER BY month",
    ].join("\n"),
    alternatives: [
      "SELECT LEFT(placed_at, 7) AS month, COUNT(*) AS orders FROM orders WHERE placed_at >= '2024-01-01' AND placed_at < '2025-01-01' AND status IN ('placed', 'packed', 'shipped', 'delivered') GROUP BY LEFT(placed_at, 7) ORDER BY month",
      "SELECT month, SUM(CASE WHEN status = 'cancelled' THEN 0 ELSE 1 END) AS orders FROM (SELECT CONCAT(YEAR(placed_at), '-', LPAD(MONTH(placed_at), 2, '0')) AS month, status FROM orders WHERE YEAR(placed_at) = 2024) t GROUP BY month HAVING SUM(CASE WHEN status = 'cancelled' THEN 0 ELSE 1 END) > 0 ORDER BY month",
    ],
    ordered: true,
    hints: [
      "`DATE_FORMAT(d, '%Y-%m')` turns a timestamp into its year and month.",
      "Restrict to 2024 before grouping — an order at 23:58 on 31 December 2023 is not a January order.",
      "The `YYYY-MM` text sorts in calendar order, so it can be the ORDER BY key.",
    ],
    editorial: [
      "Bucket each order by the month it was placed, count per bucket. `DATE_FORMAT(placed_at, '%Y-%m')` produces the bucket label directly; because the format is zero-padded and year-first, the labels also sort chronologically, so `ORDER BY month` gives January first.",
      "",
      "The filter has two parts and both belong in `WHERE`, before grouping: the year is 2024, and the order is not cancelled. The year test can be written with `YEAR(placed_at) = 2024` or as a half-open range `placed_at >= '2024-01-01' AND placed_at < '2025-01-01'`. The half-open range is the one to prefer on a real table: it can use an index on `placed_at`, and it gets the boundaries right — an order at 22:10 on 31 December is inside, while `BETWEEN '2024-01-01' AND '2024-12-31'` would cut it off at midnight.",
      "",
      "Months without orders simply produce no group. Building the label from `YEAR` and `MONTH` with `LPAD` is another way to the same text.",
    ].join("\n"),
  },

  {
    slug: "cart-shipping-fee-and-amount-payable",
    title: "Cart Shipping Fee and Amount Payable",
    difficulty: "EASY",
    topics: ["Conditional Logic", "Basics"],
    description: [
      "At checkout the app shows a shipping fee. Shipping is **free** for Plus members and for any cart whose `subtotal` is **₹499 or more**; every other cart pays **₹40**.",
      "",
      "Return every cart with the columns `cart_id`, `shipping_fee` and `payable` (the subtotal plus the shipping fee), **ordered by `cart_id`**. `is_plus_member` is 1 for a Plus member and 0 otherwise.",
    ].join("\n"),
    tables: [
      {
        name: "carts",
        columns: [
          { name: "cart_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "subtotal", type: "int" },
          { name: "is_plus_member", type: "bool" },
        ],
        primaryKey: ["cart_id"],
        note: "One row per cart at checkout; `subtotal` in rupees after item discounts.",
      },
    ],
    examples: [
      {
        carts: [
          [301, 41, 1249, 0],
          [302, 42, 499, 0],
          [303, 43, 498, 0],
          [304, 44, 120, 1],
          [305, 45, 260, 0],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 15);
      const rows = seq(301, n).map((id) => [id, ri(rng, 1, 60), chance(rng, 0.25) ? pick(rng, [498, 499, 500]) : ri(rng, 49, 2500), chance(rng, 0.3) ? 1 : 0]);
      return { carts: rows };
    },
    solution: [
      "SELECT cart_id,",
      "       CASE WHEN is_plus_member = 1 OR subtotal >= 499 THEN 0 ELSE 40 END AS shipping_fee,",
      "       subtotal + CASE WHEN is_plus_member = 1 OR subtotal >= 499 THEN 0 ELSE 40 END AS payable",
      "FROM carts",
      "ORDER BY cart_id",
    ].join("\n"),
    alternatives: [
      "SELECT cart_id, fee AS shipping_fee, subtotal + fee AS payable FROM (SELECT cart_id, subtotal, IF(is_plus_member = 0 AND subtotal < 499, 40, 0) AS fee FROM carts) t ORDER BY cart_id",
    ],
    ordered: true,
    hints: [
      "A CASE expression picks a value per row: 0 when shipping is free, 40 otherwise.",
      "Free shipping has two reasons joined by OR; ₹499 exactly qualifies.",
      "To reuse the fee in `payable`, either repeat the expression or compute it in a subquery first.",
    ],
    editorial: [
      "The fee is a per-row decision, so it is a `CASE` (or MySQL's `IF`) in the select list: when the customer is a Plus member **or** the subtotal is at least 499, the fee is 0, otherwise 40. The boundary matters — cart 302 at exactly ₹499 ships free, cart 303 at ₹498 pays.",
      "",
      "`payable` needs the same fee. SQL does not let a select-list alias be used in another expression of the same list, so either repeat the CASE (as the reference does) or compute the fee once in a derived table and add it outside — the alternative flips the condition, charging 40 only when the customer is not a member *and* the subtotal is below 499, which is De Morgan's law applied to the free-shipping rule.",
      "",
      "Nothing is aggregated or joined; the query reads each cart once and sorts by the key.",
    ].join("\n"),
  },

  {
    slug: "masked-reviewer-names-for-top-reviews",
    title: "Masked Reviewer Names for Top Reviews",
    difficulty: "EASY",
    topics: ["Strings", "Basics"],
    description: [
      "Product pages show reviews with the reviewer's name masked for privacy: the **first letter**, then one `*` for **each letter in between**, then the **last letter** — `Priya` becomes `P***a`, `Dev` becomes `D*v`.",
      "",
      "Return the reviews with a `rating` of **4 or more**, with the columns `review_id`, `product_id` and `display_name` (the masked name), **ordered by `review_id`**. Every `reviewer_name` is a single word of at least two letters.",
    ].join("\n"),
    tables: [
      {
        name: "product_reviews",
        columns: [
          { name: "review_id", type: "int" },
          { name: "product_id", type: "int" },
          { name: "reviewer_name", type: "varchar" },
          { name: "rating", type: "int" },
          { name: "reviewed_on", type: "date" },
        ],
        primaryKey: ["review_id"],
        note: "One row per review; `rating` is 1–5 stars.",
      },
    ],
    examples: [
      {
        product_reviews: [
          [1, 501, "Priya", 5, "2024-08-11"],
          [2, 501, "Dev", 4, "2024-08-12"],
          [3, 502, "Farhan", 2, "2024-08-12"],
          [4, 503, "Ananya", 4, "2024-08-15"],
          [5, 503, "Al", 5, "2024-08-16"],
          [6, 504, "Kabir", 3, "2024-08-20"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const who = names(rng, n);
      const rows = seq(1, n).map((id) => [id, ri(rng, 501, 508), chance(rng, 0.1) ? pick(rng, ["Al", "Jo", "Om"]) : who[id - 1]!, chance(rng, 0.2) ? 4 : ri(rng, 1, 5), dateBetween(rng, "2024-01-01", "2024-12-31")]);
      return { product_reviews: rows };
    },
    solution: [
      "SELECT review_id, product_id,",
      "       CONCAT(LEFT(reviewer_name, 1), REPEAT('*', CHAR_LENGTH(reviewer_name) - 2), RIGHT(reviewer_name, 1)) AS display_name",
      "FROM product_reviews",
      "WHERE rating >= 4",
      "ORDER BY review_id",
    ].join("\n"),
    alternatives: [
      "SELECT review_id, product_id, CONCAT(SUBSTRING(reviewer_name, 1, 1), RPAD('', LENGTH(reviewer_name) - 2, '*'), SUBSTRING(reviewer_name, LENGTH(reviewer_name), 1)) AS display_name FROM product_reviews WHERE rating > 3 ORDER BY review_id",
    ],
    ordered: true,
    hints: [
      "`LEFT(s, 1)` and `RIGHT(s, 1)` give the first and last letters.",
      "The number of stars is the name's length minus the two letters kept.",
      "`REPEAT('*', n)` builds a run of n stars; for n = 0 it is the empty string.",
    ],
    editorial: [
      "The masked name has three pieces glued with `CONCAT`: the first character (`LEFT(name, 1)`), a run of stars, and the last character (`RIGHT(name, 1)`). The run's length is `CHAR_LENGTH(name) - 2` — every letter except the two kept — and `REPEAT('*', n)` produces it.",
      "",
      "The two-letter name is the edge case: `Al` needs zero stars, and `REPEAT('*', 0)` is the empty string, so it comes out as `Al` unchanged. That is why the statement guarantees at least two letters; a one-letter name would ask for `REPEAT` with -1, which also yields an empty string but would then print the letter twice.",
      "",
      "The alternative builds the same pieces with `SUBSTRING` and pads an empty string to the right length with `RPAD`. `CHAR_LENGTH` counts characters while `LENGTH` counts bytes; for these ASCII names they agree, but for names in Devanagari only `CHAR_LENGTH` is right. The filter `rating >= 4` and the sort are applied to the plain columns.",
    ].join("\n"),
  },

  {
    slug: "cart-abandonment-rate-by-device",
    title: "Cart Abandonment Rate by Device",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Aggregation"],
    description: [
      "The product team compares checkout drop-off across the Android app, the iOS app and the website. A cart is **abandoned** when it holds at least one item but never became an order (`order_id` is NULL). Empty carts (`items` = 0) say nothing about checkout and are **left out entirely** — of both the count and the rate.",
      "",
      "For every device with at least one non-empty cart, return `device`, `carts` (non-empty carts), `abandoned`, and `abandonment_pct` = 100 × abandoned ÷ carts **rounded to 2 decimals**. Order the rows by `abandonment_pct` **descending**, then by `device` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "carts",
        columns: [
          { name: "cart_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "device", type: "enum", values: ["android", "ios", "web"] },
          { name: "created_at", type: "datetime" },
          { name: "items", type: "int" },
          { name: "order_id", type: "int" },
        ],
        primaryKey: ["cart_id"],
        note: "One row per cart session. `order_id` is the order the cart was checked out into, or NULL if it never was.",
      },
    ],
    examples: [
      {
        carts: [
          [1, 11, "android", "2024-09-01 10:00:00", 3, 5001],
          [2, 12, "android", "2024-09-01 10:30:00", 1, null],
          [3, 13, "android", "2024-09-01 11:00:00", 0, null],
          [4, 14, "ios", "2024-09-01 11:20:00", 2, null],
          [5, 15, "ios", "2024-09-01 12:00:00", 5, 5002],
          [6, 16, "web", "2024-09-01 12:10:00", 1, null],
          [7, 17, "web", "2024-09-01 13:45:00", 2, null],
          [8, 18, "web", "2024-09-01 14:05:00", 4, 5003],
          [9, 19, "android", "2024-09-01 15:30:00", 2, 5004],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 26);
      const devices = sample(rng, ["android", "ios", "web"], ri(rng, 1, 3));
      const dropRate = pick(rng, [0.2, 0.5, 0.7]);
      let next = 5001;
      const rows = seq(1, n).map((id) => {
        const items = chance(rng, 0.15) ? 0 : ri(rng, 1, 6);
        const ordered = items > 0 && !chance(rng, dropRate);
        return [id, ri(rng, 1, 40), pick(rng, devices), atTime(rng, dateBetween(rng, "2024-09-01", "2024-09-30")), items, ordered ? next++ : null];
      });
      return { carts: rows };
    },
    solution: [
      "SELECT device,",
      "       COUNT(*) AS carts,",
      "       SUM(CASE WHEN order_id IS NULL THEN 1 ELSE 0 END) AS abandoned,",
      "       ROUND(100 * SUM(CASE WHEN order_id IS NULL THEN 1 ELSE 0 END) / COUNT(*), 2) AS abandonment_pct",
      "FROM carts",
      "WHERE items > 0",
      "GROUP BY device",
      "ORDER BY abandonment_pct DESC, device",
    ].join("\n"),
    alternatives: [
      [
        "SELECT device, carts, abandoned, ROUND(100 * abandoned / carts, 2) AS abandonment_pct",
        "FROM (SELECT device, COUNT(*) AS carts, COUNT(*) - COUNT(order_id) AS abandoned FROM carts WHERE items > 0 GROUP BY device) t",
        "ORDER BY abandonment_pct DESC, device",
      ].join("\n"),
      [
        "SELECT device, SUM(IF(items > 0, 1, 0)) AS carts, SUM(IF(items > 0 AND order_id IS NULL, 1, 0)) AS abandoned,",
        "       ROUND(100 * SUM(IF(items > 0 AND order_id IS NULL, 1, 0)) / SUM(IF(items > 0, 1, 0)), 2) AS abandonment_pct",
        "FROM carts GROUP BY device HAVING SUM(IF(items > 0, 1, 0)) > 0",
        "ORDER BY abandonment_pct DESC, device",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Remove the empty carts before anything is counted — they belong to neither the numerator nor the denominator.",
      "Count abandoned carts with a CASE that yields 1 when `order_id` is NULL and 0 otherwise, inside SUM.",
      "`COUNT(order_id)` counts only the converted carts, so `COUNT(*) - COUNT(order_id)` is another way to the abandoned count.",
    ],
    editorial: [
      "Group the non-empty carts by device and count two things per group: all of them, and the ones with no order. The empty carts are removed in `WHERE`, before grouping, so a device whose only carts were empty produces no group at all and is not listed — exactly what the statement asks.",
      "",
      "Counting a subset inside a group is **conditional aggregation**: `SUM(CASE WHEN order_id IS NULL THEN 1 ELSE 0 END)`. `COUNT(*) - COUNT(order_id)` gives the same number because `COUNT(column)` skips NULLs. The rate is that count over the group size, times 100 — MySQL's `/` is decimal division, so no cast is needed — then `ROUND(..., 2)` so both engines print the same figure.",
      "",
      "Sorting by the alias `abandonment_pct` descending, then by `device`, makes ties deterministic. The `IF` version keeps the empty carts in the groups and filters them inside every aggregate instead, which needs a HAVING to drop devices with nothing left. Either way it is one pass over the carts.",
    ].join("\n"),
  },

  {
    slug: "sellers-with-high-return-rate",
    title: "Sellers With a High Return Rate",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation"],
    description: [
      "The trust & safety team reviews sellers whose buyers send too much back. A seller's **return rate** is the share of their **delivered** items that have a return request; items never delivered (`delivered_on` NULL) do not count at all.",
      "",
      "Return the sellers with **at least 4 delivered items** and a return rate **strictly above 25%**, with the columns `seller_id`, `delivered_items`, `returned_items` and `return_rate_pct` (100 × returned ÷ delivered, **rounded to 2 decimals**). Order by `return_rate_pct` descending, then `seller_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "order_items",
        columns: [
          { name: "item_id", type: "int" },
          { name: "order_id", type: "int" },
          { name: "seller_id", type: "int" },
          { name: "unit_price", type: "int" },
          { name: "delivered_on", type: "date" },
        ],
        primaryKey: ["item_id"],
        note: "One row per item sold. `delivered_on` is NULL while the item is in transit or if it was cancelled.",
      },
      {
        name: "returns",
        columns: [
          { name: "return_id", type: "int" },
          { name: "item_id", type: "int" },
          { name: "reason", type: "enum", values: ["damaged", "wrong_item", "size_issue", "not_as_described", "changed_mind"] },
          { name: "refund_amount", type: "int" },
        ],
        primaryKey: ["return_id"],
        note: "At most one return request per item, always for a delivered item.",
      },
    ],
    examples: [
      {
        order_items: [
          [1, 701, 10, 999, "2024-07-02"],
          [2, 702, 10, 499, "2024-07-03"],
          [3, 703, 10, 1299, "2024-07-03"],
          [4, 704, 10, 799, "2024-07-05"],
          [5, 705, 20, 2499, "2024-07-04"],
          [6, 706, 20, 1999, "2024-07-06"],
          [7, 707, 20, 349, "2024-07-06"],
          [8, 708, 20, 599, "2024-07-08"],
          [9, 709, 20, 899, null],
          [10, 710, 30, 1599, "2024-07-09"],
          [11, 711, 30, 1599, "2024-07-10"],
        ],
        returns: [
          [1, 1, "damaged", 999],
          [2, 3, "size_issue", 1299],
          [3, 5, "wrong_item", 2499],
          [4, 10, "changed_mind", 1599],
          [5, 11, "damaged", 1599],
        ],
      },
    ],
    gen: (rng) => {
      const sellers = ri(rng, 1, 5);
      const n = ri(rng, 3, 28);
      const items = seq(1, n).map((id) => [id, 700 + id, 10 * ri(rng, 1, sellers), roundTo(rng, 100, 4000, 50) - 1, chance(rng, 0.15) ? null : dateBetween(rng, "2024-07-01", "2024-07-31")]);
      const rate = pick(rng, [0.1, 0.25, 0.4, 0.6]);
      const returns: Cell[][] = [];
      for (const it of items) if (it[4] !== null && chance(rng, rate)) returns.push([returns.length + 1, it[0]!, pick(rng, ["damaged", "wrong_item", "size_issue", "not_as_described", "changed_mind"]), it[3]!]);
      return { order_items: items, returns };
    },
    solution: [
      "SELECT i.seller_id,",
      "       COUNT(*) AS delivered_items,",
      "       COUNT(r.return_id) AS returned_items,",
      "       ROUND(100 * COUNT(r.return_id) / COUNT(*), 2) AS return_rate_pct",
      "FROM order_items i",
      "LEFT JOIN returns r ON r.item_id = i.item_id",
      "WHERE i.delivered_on IS NOT NULL",
      "GROUP BY i.seller_id",
      "HAVING COUNT(*) >= 4 AND 4 * COUNT(r.return_id) > COUNT(*)",
      "ORDER BY return_rate_pct DESC, i.seller_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT seller_id, delivered_items, returned_items, ROUND(100 * returned_items / delivered_items, 2) AS return_rate_pct",
        "FROM (",
        "  SELECT seller_id, COUNT(*) AS delivered_items,",
        "         SUM(CASE WHEN EXISTS (SELECT 1 FROM returns r WHERE r.item_id = i.item_id) THEN 1 ELSE 0 END) AS returned_items",
        "  FROM order_items i WHERE delivered_on IS NOT NULL GROUP BY seller_id",
        ") t",
        "WHERE delivered_items >= 4 AND returned_items * 100 > delivered_items * 25",
        "ORDER BY return_rate_pct DESC, seller_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Start from the delivered items and LEFT JOIN the returns — a delivered item with no return still counts in the denominator.",
      "`COUNT(r.return_id)` counts only the items that found a return row.",
      "Both conditions are about whole groups, so they go in HAVING. Compare the rate with integers (4 × returned > delivered) to keep the 25% boundary exact.",
    ],
    editorial: [
      "The denominator is every delivered item of the seller and the numerator the ones with a return, so the natural shape is `order_items` filtered to `delivered_on IS NOT NULL`, LEFT JOINed to `returns`. Each item appears once (at most one return per item), with `return_id` NULL when nothing came back; `COUNT(*)` counts delivered items and `COUNT(r.return_id)` counts returned ones.",
      "",
      "The two thresholds apply to groups, so they live in `HAVING`. \"Strictly above 25%\" is written without division: `4 * returned > delivered`. That avoids any rounding question at the boundary — seller 20 in the example has 1 return out of 4 deliveries, exactly 25%, and is out. The rounded percentage is computed only for display.",
      "",
      "The undelivered item of seller 20 is filtered out before the join, so it changes neither count. An inner join would be wrong here: it would keep only returned items and make every rate 100%. The alternative counts returns per item with an `EXISTS` inside a conditional SUM. Cost: one pass over the items with an index lookup into `returns` per delivered item.",
    ].join("\n"),
  },

  {
    slug: "best-rated-product-in-each-category",
    title: "Best-Rated Product in Each Category",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Joins", "Aggregation"],
    description: [
      "The homepage shows a \"Top rated\" product per category. A product qualifies only with **at least 3 reviews**; among the qualifying products of a category, the one with the **highest average rating** wins, and products **tied** on that average all win.",
      "",
      "Return `category`, `product_name`, `avg_rating` (the average rating **rounded to 2 decimals**) and `reviews` (the review count) for every winner. A category with no qualifying product does not appear. Order the rows by `category`, then `product_name`.",
    ].join("\n"),
    tables: [
      {
        name: "products",
        columns: [
          { name: "product_id", type: "int" },
          { name: "product_name", type: "varchar" },
          { name: "category", type: "varchar" },
        ],
        primaryKey: ["product_id"],
        note: "One row per listed product; names are unique.",
      },
      {
        name: "product_reviews",
        columns: [
          { name: "review_id", type: "int" },
          { name: "product_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "rating", type: "int" },
        ],
        primaryKey: ["review_id"],
        note: "One row per review; `rating` is 1–5 stars. `product_id` is always in `products`.",
      },
    ],
    examples: [
      {
        products: [
          [1, "Galaxy M34", "Mobiles"],
          [2, "Moto G54", "Mobiles"],
          [3, "Nord CE 3", "Mobiles"],
          [4, "Silk Saree", "Fashion"],
          [5, "Linen Shirt", "Fashion"],
          [6, "Mixer Grinder", "Home"],
        ],
        product_reviews: [
          [1, 1, 11, 5], [2, 1, 12, 4], [3, 1, 13, 4],
          [4, 2, 14, 5], [5, 2, 15, 5],
          [6, 3, 16, 3], [7, 3, 17, 5], [8, 3, 18, 4], [9, 3, 19, 5], [10, 3, 20, 5], [11, 3, 21, 4],
          [12, 4, 22, 5], [13, 4, 23, 4], [14, 4, 24, 3],
          [15, 5, 25, 4], [16, 5, 26, 4], [17, 5, 27, 4],
          [18, 6, 28, 2], [19, 6, 29, 5],
        ],
      },
    ],
    gen: (rng) => {
      const cats = sample(rng, CATEGORIES, ri(rng, 1, 3));
      const products: Cell[][] = [];
      let pid = 1;
      for (const c of cats) for (const name of sample(rng, ITEMS[c]!, ri(rng, 1, 4))) products.push([pid++, name, c]);
      const reviews: Cell[][] = [];
      // Some products share one rating pattern, so averages tie within a category.
      const pattern = Array.from({ length: ri(rng, 3, 5) }, () => ri(rng, 3, 5));
      for (const p of products) {
        const copy = chance(rng, 0.3);
        const k = copy ? pattern.length : ri(rng, 0, 7);
        for (let j = 0; j < k; j++) reviews.push([reviews.length + 1, p[0]!, ri(rng, 1, 60), copy ? pattern[j]! : ri(rng, 1, 5)]);
      }
      return { products, product_reviews: reviews };
    },
    solution: [
      "WITH scored AS (",
      "  SELECT p.category, p.product_name, AVG(r.rating) AS avg_raw, COUNT(*) AS reviews",
      "  FROM products p",
      "  JOIN product_reviews r ON r.product_id = p.product_id",
      "  GROUP BY p.product_id, p.category, p.product_name",
      "  HAVING COUNT(*) >= 3",
      "), ranked AS (",
      "  SELECT category, product_name, avg_raw, reviews,",
      "         RANK() OVER (PARTITION BY category ORDER BY avg_raw DESC) AS rnk",
      "  FROM scored",
      ")",
      "SELECT category, product_name, ROUND(avg_raw, 2) AS avg_rating, reviews",
      "FROM ranked",
      "WHERE rnk = 1",
      "ORDER BY category, product_name",
    ].join("\n"),
    alternatives: [
      [
        "WITH scored AS (",
        "  SELECT p.category, p.product_name, SUM(r.rating) AS total, COUNT(*) AS reviews",
        "  FROM products p JOIN product_reviews r ON r.product_id = p.product_id",
        "  GROUP BY p.product_id, p.category, p.product_name HAVING COUNT(*) >= 3",
        ")",
        "SELECT s.category, s.product_name, ROUND(s.total / s.reviews, 2) AS avg_rating, s.reviews",
        "FROM scored s",
        "WHERE NOT EXISTS (SELECT 1 FROM scored b WHERE b.category = s.category AND b.total * s.reviews > s.total * b.reviews)",
        "ORDER BY s.category, s.product_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First compute each product's average and review count, keeping only products with at least 3 reviews.",
      "Then rank the products within each category by that average — a ranking that gives tied products the same rank.",
      "`RANK()` or `DENSE_RANK()` both give every tied leader rank 1; `ROW_NUMBER()` would keep only one of them.",
    ],
    editorial: [
      "Two steps. First aggregate the reviews per product — average and count — and drop products below 3 reviews with `HAVING`. The threshold must be applied **before** ranking: a product with two five-star reviews (Moto G54 in the example) has the best average in its category but is not eligible, and if it were ranked first it would hide the real winner.",
      "",
      "Second, rank within each category: `RANK() OVER (PARTITION BY category ORDER BY avg DESC)` and keep rank 1. Tied products get the same rank, so all of them are kept, as the statement asks. Rank on the raw average and round only for display; rounding first could make two different averages look tied.",
      "",
      "The alternative avoids window functions: a product wins if no product of the same category has a strictly higher average. Comparing `b.total * s.reviews > s.total * b.reviews` is the same as comparing the averages but in exact integers. Both cost one aggregation over the reviews plus a sort (or a self-comparison) per category; categories are small, so either is cheap.",
    ].join("\n"),
  },

  {
    slug: "customers-whose-first-order-used-a-coupon",
    title: "Customers Whose First Order Used a Coupon",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Subqueries"],
    description: [
      "Growth wants to know which customers were acquired by a coupon. A customer's **first order** is the one with the earliest `placed_at`; if two of their orders share that timestamp, the one with the **smaller `order_id`** is first.",
      "",
      "Return the customers whose first order carried a coupon (`coupon_code` not NULL), with the columns `customer_id`, `order_id` and `coupon_code` of that first order, **ordered by `customer_id`**. Coupons on later orders do not matter.",
    ].join("\n"),
    tables: [
      {
        name: "orders",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "placed_at", type: "datetime" },
          { name: "coupon_code", type: "varchar" },
          { name: "order_total", type: "int" },
        ],
        primaryKey: ["order_id"],
        note: "One row per order. `coupon_code` is NULL when no coupon was applied.",
      },
    ],
    examples: [
      {
        orders: [
          [101, 1, "2024-03-01 10:00:00", "WELCOME100", 899],
          [102, 1, "2024-03-09 18:30:00", null, 1499],
          [103, 2, "2024-03-02 09:15:00", null, 650],
          [104, 2, "2024-03-05 20:00:00", "FESTIVE20", 2100],
          [105, 3, "2024-03-04 12:00:00", "NEWUSER", 349],
          [106, 3, "2024-03-04 12:00:00", null, 1200],
          [107, 4, "2024-03-07 08:45:00", null, 799],
          [108, 4, "2024-03-07 08:45:00", "UPI50", 999],
        ],
      },
    ],
    gen: (rng) => {
      const customers = ri(rng, 1, 9);
      const rows: Cell[][] = [];
      let id = 101;
      for (let c = 1; c <= customers; c++) {
        const k = ri(rng, 1, 4);
        const base = dateBetween(rng, "2024-01-01", "2024-06-30");
        let last = atTime(rng, base);
        for (let j = 0; j < k; j++) {
          // Now and then two orders at the same second, the tie the order_id breaks.
          const at = j > 0 && chance(rng, 0.25) ? last : atTime(rng, addDays(base, ri(rng, 0, 40)));
          last = at;
          rows.push([id++, c, at, chance(rng, 0.4) ? pick(rng, COUPON_CODES) : null, roundTo(rng, 100, 5000, 50) - 1]);
        }
      }
      return { orders: shuffle(rng, rows) };
    },
    solution: [
      "SELECT customer_id, order_id, coupon_code",
      "FROM (",
      "  SELECT customer_id, order_id, coupon_code,",
      "         ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY placed_at, order_id) AS rn",
      "  FROM orders",
      ") t",
      "WHERE rn = 1 AND coupon_code IS NOT NULL",
      "ORDER BY customer_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT o.customer_id, o.order_id, o.coupon_code",
        "FROM orders o",
        "WHERE o.coupon_code IS NOT NULL",
        "  AND NOT EXISTS (SELECT 1 FROM orders e WHERE e.customer_id = o.customer_id",
        "                  AND (e.placed_at < o.placed_at OR (e.placed_at = o.placed_at AND e.order_id < o.order_id)))",
        "ORDER BY o.customer_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Find each customer's first order before looking at coupons — filtering coupons first would make a later coupon order look like the first.",
      "`ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY placed_at, order_id)` numbers each customer's orders in time order.",
      "Without a window: an order is first if no order of the same customer is earlier, or equally early with a smaller id.",
    ],
    editorial: [
      "The order of operations is the whole problem. If you keep only coupon orders and then take each customer's earliest, customer 2 — whose first order had no coupon, but whose second did — would wrongly appear. So pick the first order first, then test its coupon.",
      "",
      "`ROW_NUMBER()` partitioned by customer and ordered by `placed_at, order_id` gives each customer's orders 1, 2, 3, …; the second sort key breaks the same-second tie the statement defines, so exactly one order gets 1. Filtering `rn = 1 AND coupon_code IS NOT NULL` in the outer query does the rest. Customer 4 shows why the tie-breaker matters: two orders at 08:45, and the smaller id, 107, had no coupon.",
      "",
      "The correlated alternative says the same thing as a condition: an order is first if no other order of that customer comes before it in the (placed_at, order_id) order. It reads more like the definition but compares each order with all of the customer's others, while the window version is a single sort.",
    ].join("\n"),
  },

  {
    slug: "delivery-sla-breaches-by-postal-zone",
    title: "Delivery SLA Breaches by Postal Zone",
    difficulty: "MEDIUM",
    topics: ["Dates", "Strings", "Aggregation"],
    description: [
      "The logistics team tracks how often couriers miss the promised delivery time. The **first digit** of an Indian PIN code is its postal zone (1 = Delhi and the north, 4 = the west, 5 = Andhra/Telangana/Karnataka, and so on). A delivered shipment **breaches** its SLA when the days from `shipped_on` to `delivered_on` are **more than** `promised_days`. Shipments not yet delivered are ignored.",
      "",
      "Return one row per zone with at least one delivered shipment: `zone` (the first digit), `delivered` and `breaches`. Order by `breaches` descending, then `zone` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "shipments",
        columns: [
          { name: "shipment_id", type: "int" },
          { name: "order_id", type: "int" },
          { name: "pincode", type: "char" },
          { name: "shipped_on", type: "date" },
          { name: "promised_days", type: "int" },
          { name: "delivered_on", type: "date" },
        ],
        primaryKey: ["shipment_id"],
        note: "One row per shipment; `pincode` is the six-digit delivery PIN code as text. `delivered_on` is NULL while in transit.",
      },
    ],
    examples: [
      {
        shipments: [
          [1, 9101, "560034", "2024-10-01", 2, "2024-10-03"],
          [2, 9102, "560102", "2024-10-01", 2, "2024-10-04"],
          [3, 9103, "400076", "2024-10-02", 3, "2024-10-07"],
          [4, 9104, "411014", "2024-10-02", 3, "2024-10-06"],
          [5, 9105, "110017", "2024-10-03", 4, "2024-10-05"],
          [6, 9106, "500081", "2024-10-03", 2, null],
          [7, 9107, "600042", "2024-10-04", 3, "2024-10-08"],
          [8, 9108, "122002", "2024-10-04", 4, "2024-10-08"],
        ],
      },
    ],
    gen: (rng) => {
      const pins = ["560034", "560102", "400076", "411014", "110017", "122002", "500081", "600042", "700091", "380015", "302017", "682024", "201301", "751024"];
      const n = ri(rng, 1, 25);
      const rows = seq(1, n).map((id) => {
        const shipped = dateBetween(rng, "2024-10-01", "2024-10-31");
        const promised = ri(rng, 1, 6);
        const delivered = chance(rng, 0.15) ? null : addDays(shipped, chance(rng, 0.25) ? promised : ri(rng, 0, promised + 4));
        return [id, 9100 + id, pick(rng, pins), shipped, promised, delivered];
      });
      return { shipments: rows };
    },
    solution: [
      "SELECT LEFT(pincode, 1) AS zone,",
      "       COUNT(*) AS delivered,",
      "       SUM(CASE WHEN DATEDIFF(delivered_on, shipped_on) > promised_days THEN 1 ELSE 0 END) AS breaches",
      "FROM shipments",
      "WHERE delivered_on IS NOT NULL",
      "GROUP BY LEFT(pincode, 1)",
      "ORDER BY breaches DESC, zone",
    ].join("\n"),
    alternatives: [
      [
        "SELECT zone, COUNT(*) AS delivered, SUM(late) AS breaches",
        "FROM (SELECT SUBSTRING(pincode, 1, 1) AS zone, IF(delivered_on > DATE_ADD(shipped_on, INTERVAL promised_days DAY), 1, 0) AS late",
        "      FROM shipments WHERE delivered_on IS NOT NULL) t",
        "GROUP BY zone",
        "ORDER BY breaches DESC, zone",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`LEFT(pincode, 1)` is the zone; group by it.",
      "`DATEDIFF(later, earlier)` is the number of days between two dates.",
      "Count breaches with a conditional SUM, and drop the undelivered shipments before grouping so they count in neither column.",
    ],
    editorial: [
      "The zone is a string operation on the PIN code — its first character, `LEFT(pincode, 1)` — and it is the grouping key. Because PIN codes are stored as text, there is no arithmetic involved, and a leading digit is never lost the way it could be if the code were a number.",
      "",
      "A shipment breaches when `DATEDIFF(delivered_on, shipped_on) > promised_days`; delivering on exactly the promised day is on time (shipment 4 in the example takes 4 days against 3 promised and breaches; shipment 1 takes 2 against 2 and does not). The breach count is a conditional SUM, and the delivered count is the group size once the in-transit rows (NULL `delivered_on`) are filtered out in `WHERE`. A zone whose only shipment is still in transit has no group and is not listed.",
      "",
      "The alternative states the SLA as a date comparison: late when `delivered_on` is after `shipped_on` plus the promised days. The two are the same rule. One pass over the shipments, then a sort of at most ten zones.",
    ].join("\n"),
  },

  {
    slug: "flash-sale-units-sold-in-window",
    title: "Flash Sale Units Sold Inside the Sale Window",
    difficulty: "MEDIUM",
    topics: ["Joins", "Dates", "Conditional Logic"],
    description: [
      "Every flash sale puts a fixed stock of one product on offer between `starts_at` and `ends_at` (both **inclusive**). An order line counts towards a sale when it is for the sale's product and its `ordered_at` falls inside that window; lines a minute early or late were sold at the normal price and do not count.",
      "",
      "Return one row per flash sale with `sale_id`, `units_sold` (the sum of `quantity` of the lines that count, **0** if none) and `sale_status`: `sold out` when units sold reach `stock_allotted`, `partial` when some but fewer units sold, `unsold` when none did. Order by `sale_id`.",
    ].join("\n"),
    tables: [
      {
        name: "flash_sales",
        columns: [
          { name: "sale_id", type: "int" },
          { name: "product_id", type: "int" },
          { name: "starts_at", type: "datetime" },
          { name: "ends_at", type: "datetime" },
          { name: "stock_allotted", type: "int" },
        ],
        primaryKey: ["sale_id"],
        note: "One row per flash sale. A product can have several sales at different times.",
      },
      {
        name: "order_items",
        columns: [
          { name: "item_id", type: "int" },
          { name: "product_id", type: "int" },
          { name: "quantity", type: "int" },
          { name: "ordered_at", type: "datetime" },
        ],
        primaryKey: ["item_id"],
        note: "One row per order line.",
      },
    ],
    examples: [
      {
        flash_sales: [
          [1, 501, "2024-10-03 12:00:00", "2024-10-03 14:00:00", 5],
          [2, 502, "2024-10-03 20:00:00", "2024-10-03 21:00:00", 10],
          [3, 503, "2024-10-04 09:00:00", "2024-10-04 10:00:00", 3],
          [4, 501, "2024-10-05 12:00:00", "2024-10-05 13:00:00", 4],
        ],
        order_items: [
          [1, 501, 2, "2024-10-03 12:00:00"],
          [2, 501, 3, "2024-10-03 13:59:59"],
          [3, 501, 1, "2024-10-03 14:00:01"],
          [4, 502, 4, "2024-10-03 20:30:00"],
          [5, 503, 1, "2024-10-04 08:59:00"],
          [6, 501, 1, "2024-10-05 12:45:00"],
          [7, 502, 2, "2024-10-03 21:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const sales: Cell[][] = [];
      const items: Cell[][] = [];
      const n = ri(rng, 1, 6);
      for (let s = 1; s <= n; s++) {
        const day = dateBetween(rng, "2024-10-01", "2024-10-10");
        const h = ri(rng, 8, 20);
        const start = `${day} ${String(h).padStart(2, "0")}:00:00`;
        const end = `${day} ${String(h + ri(rng, 1, 3)).padStart(2, "0")}:00:00`;
        const pid = 500 + ri(rng, 1, 4);
        const stock = ri(rng, 2, 10);
        sales.push([s, pid, start, end, stock]);
        const lines = ri(rng, 0, 4);
        for (let k = 0; k < lines; k++) {
          const r = rng();
          const at = r < 0.15 ? start : r < 0.3 ? end : r < 0.4 ? `${day} ${String(h - 1).padStart(2, "0")}:59:59` : `${day} ${String(h).padStart(2, "0")}:${String(ri(rng, 0, 59)).padStart(2, "0")}:00`;
          items.push([items.length + 1, chance(rng, 0.85) ? pid : 500 + ri(rng, 1, 4), ri(rng, 1, 4), at]);
        }
      }
      return { flash_sales: sales, order_items: shuffle(rng, items) };
    },
    solution: [
      "SELECT s.sale_id,",
      "       COALESCE(SUM(i.quantity), 0) AS units_sold,",
      "       CASE WHEN COALESCE(SUM(i.quantity), 0) >= s.stock_allotted THEN 'sold out'",
      "            WHEN COALESCE(SUM(i.quantity), 0) > 0 THEN 'partial'",
      "            ELSE 'unsold' END AS sale_status",
      "FROM flash_sales s",
      "LEFT JOIN order_items i",
      "  ON i.product_id = s.product_id AND i.ordered_at BETWEEN s.starts_at AND s.ends_at",
      "GROUP BY s.sale_id, s.stock_allotted",
      "ORDER BY s.sale_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT sale_id, units AS units_sold,",
        "       CASE WHEN units >= stock_allotted THEN 'sold out' WHEN units = 0 THEN 'unsold' ELSE 'partial' END AS sale_status",
        "FROM (",
        "  SELECT s.sale_id, s.stock_allotted,",
        "         (SELECT IFNULL(SUM(quantity), 0) FROM order_items i WHERE i.product_id = s.product_id AND i.ordered_at >= s.starts_at AND i.ordered_at <= s.ends_at) AS units",
        "  FROM flash_sales s",
        ") t",
        "ORDER BY sale_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The join condition has two parts: the same product, and the line's time inside the sale's window.",
      "Put the time condition in the ON clause of a LEFT JOIN — in WHERE it would drop the sales that sold nothing.",
      "Compute the units first, then let a CASE turn them into a status; check \"sold out\" before \"partial\".",
    ],
    editorial: [
      "This is a **range join**: a line belongs to a sale when the products match and `ordered_at BETWEEN starts_at AND ends_at`. BETWEEN is inclusive on both ends, which is what the statement says — the line at exactly 12:00:00 counts, the one at 14:00:01 does not.",
      "",
      "Every sale must appear, so the join is a LEFT JOIN from `flash_sales`, with the whole match condition in `ON`. Moving the time test to `WHERE` would turn it back into an inner join: a sale with no matching line has NULL `ordered_at`, the test fails, and the sale vanishes instead of showing 0 and `unsold`. `SUM` over the padding NULL is NULL, so `COALESCE(..., 0)` gives the zero.",
      "",
      "The status is a CASE over the units, tested in order — sold out first (units reached the stock), then partial, then unsold. Grouping by `stock_allotted` alongside the key lets the CASE use it under ONLY_FULL_GROUP_BY. The alternative computes units in a correlated subquery per sale. With an index on `order_items(product_id, ordered_at)` each sale is one range scan.",
    ].join("\n"),
  },

  {
    slug: "monthly-gmv-against-previous-calendar-month",
    title: "Monthly GMV Against the Previous Calendar Month",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates", "Aggregation"],
    description: [
      "Finance reports GMV — the sum of `order_total` over orders that are **not cancelled** — for each month that had such orders, next to the **previous calendar month**. A month that had no orders produces no row, and it also means the month after it has no previous figure.",
      "",
      "Return `month` (`YYYY-MM`), `gmv`, `prev_month_gmv` (the GMV of the calendar month just before, or NULL if that month has no row) and `change` (`gmv - prev_month_gmv`, NULL when there is no previous figure), **ordered by `month`**.",
    ].join("\n"),
    tables: [
      {
        name: "orders",
        columns: [
          { name: "order_id", type: "int" },
          { name: "placed_at", type: "datetime" },
          { name: "order_total", type: "int" },
          { name: "status", type: "enum", values: [...ORDER_STATUS] },
        ],
        primaryKey: ["order_id"],
        note: "One row per order; `order_total` in rupees.",
      },
    ],
    examples: [
      {
        orders: [
          [1, "2024-01-05 10:00:00", 1200, "delivered"],
          [2, "2024-01-20 19:30:00", 800, "delivered"],
          [3, "2024-02-02 08:15:00", 2500, "shipped"],
          [4, "2024-02-14 21:00:00", 999, "cancelled"],
          [5, "2024-04-01 12:00:00", 3100, "delivered"],
          [6, "2024-05-11 16:45:00", 1700, "placed"],
          [7, "2024-05-30 23:59:00", 600, "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      const months = sample(rng, seq(1, 12), ri(rng, 1, 7));
      const rows: Cell[][] = [];
      for (const m of months) {
        const k = ri(rng, 1, 4);
        for (let j = 0; j < k; j++) {
          const day = `2024-${String(m).padStart(2, "0")}-${String(ri(rng, 1, 28)).padStart(2, "0")}`;
          rows.push([rows.length + 1, atTime(rng, day), roundTo(rng, 200, 6000, 100) - 1, chance(rng, 0.15) ? "cancelled" : pick(rng, ["delivered", "shipped", "placed"])]);
        }
      }
      return { orders: shuffle(rng, rows) };
    },
    solution: [
      "WITH monthly AS (",
      "  SELECT DATE_FORMAT(placed_at, '%Y-%m') AS month, SUM(order_total) AS gmv",
      "  FROM orders",
      "  WHERE status <> 'cancelled'",
      "  GROUP BY DATE_FORMAT(placed_at, '%Y-%m')",
      "), lagged AS (",
      "  SELECT month, gmv,",
      "         LAG(month) OVER (ORDER BY month) AS prev_month,",
      "         LAG(gmv) OVER (ORDER BY month) AS prev_gmv",
      "  FROM monthly",
      ")",
      "SELECT month, gmv,",
      "       CASE WHEN prev_month = DATE_FORMAT(DATE_SUB(CONCAT(month, '-01'), INTERVAL 1 MONTH), '%Y-%m') THEN prev_gmv END AS prev_month_gmv,",
      "       CASE WHEN prev_month = DATE_FORMAT(DATE_SUB(CONCAT(month, '-01'), INTERVAL 1 MONTH), '%Y-%m') THEN gmv - prev_gmv END AS `change`",
      "FROM lagged",
      "ORDER BY month",
    ].join("\n"),
    alternatives: [
      [
        "WITH monthly AS (",
        "  SELECT LEFT(placed_at, 7) AS month, SUM(order_total) AS gmv",
        "  FROM orders WHERE status <> 'cancelled' GROUP BY LEFT(placed_at, 7)",
        ")",
        "SELECT m.month, m.gmv, p.gmv AS prev_month_gmv, m.gmv - p.gmv AS `change`",
        "FROM monthly m",
        "LEFT JOIN monthly p ON p.month = LEFT(DATE_SUB(CONCAT(m.month, '-01'), INTERVAL 1 MONTH), 7)",
        "ORDER BY m.month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Aggregate the orders into one row per month first.",
      "`LAG()` gives the previous *row*, which is not always the previous *month* — April's previous row may be February.",
      "Either check that the lagged month really is one month earlier, or LEFT JOIN the monthly table to itself on \"one month earlier\".",
    ],
    editorial: [
      "Start with one row per month: GMV is a grouped SUM of the non-cancelled orders, keyed by `DATE_FORMAT(placed_at, '%Y-%m')`.",
      "",
      "The tempting next step is `LAG(gmv) OVER (ORDER BY month)`, but LAG looks at the previous **row**. In the example March has no orders, so April's previous row is February — and comparing April with February is exactly what the statement forbids. The fix is to lag the month label too and keep the lagged value only when that label equals the month one calendar month before (`DATE_SUB(CONCAT(month, '-01'), INTERVAL 1 MONTH)` formatted back to `YYYY-MM`); otherwise both `prev_month_gmv` and `change` are NULL.",
      "",
      "The self-join alternative expresses the rule directly: LEFT JOIN each month to the row whose label is one month earlier. A missing month simply finds no partner, and `m.gmv - NULL` is NULL. `change` is a reserved word in MySQL, so the alias is written in backticks. Both versions aggregate once and then touch one row per month.",
    ].join("\n"),
  },

  {
    slug: "customers-reordering-within-30-days",
    title: "Customers Who Reordered Within 30 Days",
    difficulty: "MEDIUM",
    topics: ["Dates", "Window Functions"],
    description: [
      "A healthy marketplace turns first-time buyers into repeat buyers quickly. Order a customer's orders by `order_date`, then by `order_id`; the first two are their **first** and **second** order (two orders on the same day count as first and second, 0 days apart).",
      "",
      "Return the customers whose second order came **within 30 days** of the first (30 days apart still counts), with the columns `customer_id`, `first_order_date`, `second_order_date` and `days_between`, **ordered by `customer_id`**. Customers with only one order are not listed.",
    ].join("\n"),
    tables: [
      {
        name: "orders",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "order_date", type: "date" },
          { name: "order_total", type: "int" },
        ],
        primaryKey: ["order_id"],
        note: "One row per order.",
      },
    ],
    examples: [
      {
        orders: [
          [1, 1, "2024-02-01", 499],
          [2, 1, "2024-03-02", 1299],
          [3, 2, "2024-02-03", 799],
          [4, 2, "2024-03-05", 349],
          [5, 3, "2024-02-10", 2599],
          [6, 3, "2024-02-10", 199],
          [7, 3, "2024-02-11", 899],
          [8, 4, "2024-02-15", 1499],
          [9, 5, "2024-03-01", 650],
          [10, 5, "2024-02-20", 1100],
        ],
      },
    ],
    gen: (rng) => {
      const customers = ri(rng, 1, 10);
      const rows: Cell[][] = [];
      for (let c = 1; c <= customers; c++) {
        const k = ri(rng, 1, 4);
        const first = dateBetween(rng, "2024-01-01", "2024-06-30");
        for (let j = 0; j < k; j++) {
          const gap = j === 0 ? 0 : pick(rng, [0, 29, 30, 31, ri(rng, 1, 60)]);
          rows.push([0, c, addDays(first, j === 0 ? 0 : gap + ri(rng, 0, 1) * j), roundTo(rng, 100, 4000, 50) - 1]);
        }
      }
      shuffle(rng, rows).forEach((r, i) => (r[0] = i + 1));
      return { orders: rows };
    },
    solution: [
      "WITH numbered AS (",
      "  SELECT customer_id, order_date,",
      "         ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date, order_id) AS rn",
      "  FROM orders",
      ")",
      "SELECT a.customer_id, a.order_date AS first_order_date, b.order_date AS second_order_date,",
      "       DATEDIFF(b.order_date, a.order_date) AS days_between",
      "FROM numbered a",
      "JOIN numbered b ON b.customer_id = a.customer_id AND b.rn = 2",
      "WHERE a.rn = 1 AND DATEDIFF(b.order_date, a.order_date) <= 30",
      "ORDER BY a.customer_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT customer_id, first_order_date, second_order_date, DATEDIFF(second_order_date, first_order_date) AS days_between",
        "FROM (",
        "  SELECT customer_id, order_date AS first_order_date,",
        "         LEAD(order_date) OVER (PARTITION BY customer_id ORDER BY order_date, order_id) AS second_order_date,",
        "         ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date, order_id) AS rn",
        "  FROM orders",
        ") t",
        "WHERE rn = 1 AND second_order_date IS NOT NULL AND second_order_date <= DATE_ADD(first_order_date, INTERVAL 30 DAY)",
        "ORDER BY customer_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Number each customer's orders in date order, breaking same-day ties by `order_id`.",
      "Rows 1 and 2 of each customer are the pair to compare — a self join on the numbered rows, or `LEAD()` from row 1.",
      "`DATEDIFF(second, first) <= 30` keeps the boundary case of exactly 30 days.",
    ],
    editorial: [
      "Number every customer's orders with `ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date, order_id)`. The tie-breaker makes the numbering unique even when a customer ordered twice on one day, as customer 3 did — those become orders 1 and 2, zero days apart, and the customer qualifies. Customer 5's rows are stored out of order, which the window's ORDER BY ignores.",
      "",
      "Then pair row 1 with row 2. A self join on the numbered CTE (`a.rn = 1`, `b.rn = 2`, same customer) does it; an inner join automatically drops customers with a single order because they have no row 2. `LEAD(order_date)` read on row 1 gives the same pair in one pass, and there the single-order customers show up with a NULL second date that has to be filtered.",
      "",
      "The window test is `DATEDIFF(second, first) <= 30` or, equivalently, `second <= DATE_ADD(first, INTERVAL 30 DAY)`. Customer 1 (30 days) is in, customer 2 (31 days) is out. One sort per customer, linear after that.",
    ].join("\n"),
  },

  {
    slug: "gst-cgst-sgst-igst-by-seller-and-month",
    title: "GST Split Into CGST, SGST and IGST by Seller",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Joins", "Dates"],
    description: [
      "Under GST, a sale **within the seller's own state** is taxed as CGST plus SGST, each half of the GST rate; a sale **to another state** is taxed as IGST at the full rate. Tax on an invoice is `taxable_value * gst_rate / 100` in total.",
      "",
      "For every seller and every month in which they invoiced, return `seller_id`, `month` (`YYYY-MM`), `cgst`, `sgst` and `igst` — the tax of each kind over that month's invoices, each **rounded to 2 decimals** (0 when there is none of that kind). Order by `seller_id`, then `month`.",
    ].join("\n"),
    tables: [
      {
        name: "sellers",
        columns: [
          { name: "seller_id", type: "int" },
          { name: "store_name", type: "varchar" },
          { name: "state", type: "varchar" },
        ],
        primaryKey: ["seller_id"],
        note: "One row per seller; `state` is where the seller is registered for GST.",
      },
      {
        name: "gst_invoices",
        columns: [
          { name: "invoice_id", type: "int" },
          { name: "seller_id", type: "int" },
          { name: "invoice_date", type: "date" },
          { name: "buyer_state", type: "varchar" },
          { name: "taxable_value", type: "int" },
          { name: "gst_rate", type: "int" },
        ],
        primaryKey: ["invoice_id"],
        note: "One row per tax invoice; `taxable_value` in rupees before tax, `gst_rate` in percent (5, 12, 18 or 28).",
      },
    ],
    examples: [
      {
        sellers: [
          [1, "Mehta Electronics", "Maharashtra"],
          [2, "Lakshmi Textiles", "Tamil Nadu"],
        ],
        gst_invoices: [
          [1, 1, "2024-07-03", "Maharashtra", 10000, 18],
          [2, 1, "2024-07-09", "Karnataka", 25000, 18],
          [3, 1, "2024-07-21", "Maharashtra", 1500, 28],
          [4, 1, "2024-08-02", "Gujarat", 4200, 12],
          [5, 2, "2024-07-11", "Tamil Nadu", 3300, 5],
          [6, 2, "2024-07-30", "Tamil Nadu", 2100, 5],
          [7, 2, "2024-08-18", "Kerala", 8000, 5],
        ],
      },
    ],
    gen: (rng) => {
      const STATES = ["Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat", "Delhi", "Kerala"];
      const ns = ri(rng, 1, 4);
      const sellers = seq(1, ns).map((id) => [id, pick(rng, STORES), pick(rng, STATES)]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 20);
      const invoices = seq(1, n).map((id) => {
        const s = sellers[ri(rng, 0, ns - 1)]!;
        return [id, s[0]!, dateBetween(rng, "2024-06-01", "2024-09-30"), chance(rng, 0.5) ? s[2]! : pick(rng, STATES), roundTo(rng, 100, 50000, 100), pick(rng, [5, 12, 18, 28])];
      });
      return { sellers, gst_invoices: invoices };
    },
    solution: [
      "SELECT i.seller_id, DATE_FORMAT(i.invoice_date, '%Y-%m') AS month,",
      "       ROUND(SUM(CASE WHEN i.buyer_state = s.state THEN i.taxable_value * i.gst_rate / 200 ELSE 0 END), 2) AS cgst,",
      "       ROUND(SUM(CASE WHEN i.buyer_state = s.state THEN i.taxable_value * i.gst_rate / 200 ELSE 0 END), 2) AS sgst,",
      "       ROUND(SUM(CASE WHEN i.buyer_state <> s.state THEN i.taxable_value * i.gst_rate / 100 ELSE 0 END), 2) AS igst",
      "FROM gst_invoices i",
      "JOIN sellers s ON s.seller_id = i.seller_id",
      "GROUP BY i.seller_id, DATE_FORMAT(i.invoice_date, '%Y-%m')",
      "ORDER BY i.seller_id, month",
    ].join("\n"),
    alternatives: [
      [
        "SELECT seller_id, month, ROUND(SUM(intra) / 2, 2) AS cgst, ROUND(SUM(intra) / 2, 2) AS sgst, ROUND(SUM(inter), 2) AS igst",
        "FROM (",
        "  SELECT i.seller_id, LEFT(i.invoice_date, 7) AS month,",
        "         IF(i.buyer_state = s.state, i.taxable_value * i.gst_rate / 100, 0) AS intra,",
        "         IF(i.buyer_state = s.state, 0, i.taxable_value * i.gst_rate / 100) AS inter",
        "  FROM gst_invoices i JOIN sellers s ON s.seller_id = i.seller_id",
        ") t",
        "GROUP BY seller_id, month",
        "ORDER BY seller_id, month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Whether an invoice is intra-state depends on the seller's state, so join `sellers` in first.",
      "Each tax column is a SUM of a CASE: the invoice's tax when it is of that kind, 0 otherwise.",
      "CGST and SGST are each half of the GST: `taxable_value * gst_rate / 200`.",
    ],
    editorial: [
      "The kind of tax is decided per invoice by comparing two states: the buyer's, on the invoice, and the seller's, in `sellers`. So join the two tables, then do **conditional aggregation** per seller and month — three SUMs over CASE expressions, each adding an invoice's tax when it is of that kind and 0 otherwise. The ELSE 0 is what makes a month with only inter-state sales show `cgst` and `sgst` as 0 rather than NULL.",
      "",
      "For an intra-state invoice the GST is split evenly: CGST and SGST are each `taxable_value * gst_rate / 200`. For inter-state the whole `taxable_value * gst_rate / 100` is IGST. Invoice 1 in the example (₹10,000 at 18% within Maharashtra) contributes ₹900 CGST and ₹900 SGST; invoice 2 to Karnataka contributes ₹4,500 IGST.",
      "",
      "The month key is `DATE_FORMAT(invoice_date, '%Y-%m')`, and grouping by the same expression keeps ONLY_FULL_GROUP_BY happy. Rounding to 2 decimals makes the output identical in every engine. The alternative computes intra- and inter-state tax per row in a derived table and halves the intra total afterwards — the same arithmetic in a different order.",
    ].join("\n"),
  },

  {
    slug: "wishlisted-products-now-cheaper",
    title: "Wishlisted Products That Are Now Cheaper",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Joins"],
    description: [
      "The \"Price drop on your wishlist\" push notification goes to customers whose saved product now costs less than when they saved it. A product's **current price** is the `price` of its `price_history` row with the **latest `effective_from`**; a product with no price history is skipped.",
      "",
      "Return every wishlist entry whose current price is **strictly below** `price_when_added`, with the columns `customer_id`, `product_id`, `price_when_added`, `current_price` and `saving` (the difference). Order by `saving` descending, then `customer_id`, then `product_id`.",
    ].join("\n"),
    tables: [
      {
        name: "wishlist",
        columns: [
          { name: "customer_id", type: "int" },
          { name: "product_id", type: "int" },
          { name: "added_on", type: "date" },
          { name: "price_when_added", type: "int" },
        ],
        primaryKey: ["customer_id", "product_id"],
        note: "One row per saved product; `price_when_added` is the price shown at the moment it was saved.",
      },
      {
        name: "price_history",
        columns: [
          { name: "product_id", type: "int" },
          { name: "effective_from", type: "date" },
          { name: "price", type: "int" },
        ],
        primaryKey: ["product_id", "effective_from"],
        note: "One row per price change; a price holds from `effective_from` until the next change.",
      },
    ],
    examples: [
      {
        wishlist: [
          [1, 501, "2024-08-01", 17999],
          [2, 501, "2024-09-10", 16499],
          [1, 502, "2024-08-05", 1299],
          [3, 503, "2024-08-20", 2199],
          [3, 504, "2024-08-21", 399],
        ],
        price_history: [
          [501, "2024-07-01", 17999],
          [501, "2024-09-01", 16499],
          [501, "2024-10-01", 15999],
          [502, "2024-06-15", 1299],
          [502, "2024-10-02", 1399],
          [503, "2024-08-01", 2199],
          [503, "2024-09-15", 1899],
        ],
      },
    ],
    gen: (rng) => {
      const pids = sample(rng, seq(501, 8), ri(rng, 1, 6));
      const history: Cell[][] = [];
      const priceAt: Record<number, number[]> = {};
      for (const p of pids) {
        if (chance(rng, 0.15)) continue;
        let price = roundTo(rng, 300, 20000, 100) - 1;
        priceAt[p] = [];
        let d = dateBetween(rng, "2024-05-01", "2024-06-30");
        const changes = chance(rng, 0.2) ? 1 : ri(rng, 2, 4);
        for (let k = 0; k < changes; k++) {
          history.push([p, d, price]);
          priceAt[p]!.push(price);
          d = addDays(d, ri(rng, 10, 40));
          price = chance(rng, 0.15) ? price : price + pick(rng, [-1000, -500, -200, -200, 200, 500]);
          if (price < 99) price = 99;
        }
      }
      const wishlist: Cell[][] = [];
      for (const c of seq(1, ri(rng, 1, 6))) {
        for (const p of sample(rng, pids, ri(rng, 1, 3))) {
          const seen = priceAt[p];
          wishlist.push([c, p, dateBetween(rng, "2024-06-01", "2024-09-30"), seen ? pick(rng, seen) : roundTo(rng, 300, 20000, 100) - 1]);
        }
      }
      return { wishlist, price_history: history };
    },
    solution: [
      "SELECT w.customer_id, w.product_id, w.price_when_added, h.price AS current_price,",
      "       w.price_when_added - h.price AS saving",
      "FROM wishlist w",
      "JOIN price_history h ON h.product_id = w.product_id",
      "WHERE h.effective_from = (SELECT MAX(effective_from) FROM price_history x WHERE x.product_id = w.product_id)",
      "  AND h.price < w.price_when_added",
      "ORDER BY saving DESC, w.customer_id, w.product_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH latest AS (",
        "  SELECT product_id, price, ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY effective_from DESC) AS rn",
        "  FROM price_history",
        ")",
        "SELECT w.customer_id, w.product_id, w.price_when_added, l.price AS current_price, w.price_when_added - l.price AS saving",
        "FROM wishlist w JOIN latest l ON l.product_id = w.product_id AND l.rn = 1",
        "WHERE l.price < w.price_when_added",
        "ORDER BY saving DESC, w.customer_id, w.product_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First find each product's current price: the row with the greatest `effective_from` for that product.",
      "A correlated subquery `MAX(effective_from) … WHERE x.product_id = w.product_id` picks that row out of a join.",
      "An inner join to the current prices drops products with no history, as the statement asks.",
    ],
    editorial: [
      "The current price is a **latest row per group** lookup: for each product, the `price_history` row whose `effective_from` equals the product's maximum. The reference joins the wishlist to the history and keeps only the history row matching a correlated `MAX(effective_from)`; because `(product_id, effective_from)` is the primary key, exactly one row survives per product.",
      "",
      "With the current price beside each wishlist entry, the rest is a filter and a subtraction. The comparison is strict: customer 2 saved product 501 at ₹16,499 and it is now ₹15,999, a saving of ₹500; customer 1 saved the same product at ₹17,999 and saves ₹2,000. Product 502 went up, so its entry is out, and 504 has no history at all — the inner join drops it.",
      "",
      "The window alternative numbers each product's history newest first and joins row 1. Both read the history once per product; the window version is usually faster on a long history because it sorts once instead of probing per entry.",
    ].join("\n"),
  },

  {
    slug: "shopping-sessions-abandoned-after-add-to-cart",
    title: "Shopping Sessions Abandoned After Add to Cart",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "The app logs every `view`, `add_to_cart` and `checkout` a user makes. Events of one user belong to the same **session** until a gap of **more than 30 minutes** (1,800 seconds) between consecutive events — a gap of exactly 30 minutes keeps the session going. Order a user's events by `event_time`, then `event_id`.",
      "",
      "Return the sessions that contain **at least one `add_to_cart` but no `checkout`**, with the columns `user_id`, `session_start` (first event time), `session_end` (last event time) and `events` (events in the session), **ordered by `user_id`, then `session_start`**.",
    ].join("\n"),
    tables: [
      {
        name: "app_events",
        columns: [
          { name: "event_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "event_time", type: "datetime" },
          { name: "event_type", type: "enum", values: ["view", "add_to_cart", "checkout"] },
        ],
        primaryKey: ["event_id"],
        note: "One row per tracked event from the shopping app.",
      },
    ],
    examples: [
      {
        app_events: [
          [1, 7, "2024-11-01 10:00:00", "view"],
          [2, 7, "2024-11-01 10:05:00", "add_to_cart"],
          [3, 7, "2024-11-01 10:35:00", "view"],
          [4, 7, "2024-11-01 11:20:00", "view"],
          [5, 7, "2024-11-01 11:22:00", "add_to_cart"],
          [6, 7, "2024-11-01 11:30:00", "checkout"],
          [7, 8, "2024-11-01 09:00:00", "add_to_cart"],
          [8, 8, "2024-11-01 09:30:01", "add_to_cart"],
          [9, 8, "2024-11-01 09:31:00", "view"],
          [10, 9, "2024-11-01 20:00:00", "view"],
        ],
      },
    ],
    gen: (rng) => {
      const plusSeconds = (ts: string, s: number): string => {
        const d = new Date(Date.parse(ts.replace(" ", "T") + "Z") + s * 1000);
        return d.toISOString().slice(0, 19).replace("T", " ");
      };
      const rows: Cell[][] = [];
      const users = ri(rng, 1, 4);
      for (let u = 1; u <= users; u++) {
        let t = atTime(rng, dateBetween(rng, "2024-11-01", "2024-11-03"));
        const k = ri(rng, 1, 8);
        for (let j = 0; j < k; j++) {
          if (j > 0) t = plusSeconds(t, pick(rng, [0, 60, 300, 600, 1799, 1800, 1801, 2700, 7200]));
          const r = rng();
          rows.push([0, u * 10 + 1, t, r < 0.45 ? "view" : r < 0.85 ? "add_to_cart" : "checkout"]);
        }
      }
      shuffle(rng, rows).forEach((r, i) => (r[0] = i + 1));
      return { app_events: rows };
    },
    solution: [
      "WITH gaps AS (",
      "  SELECT user_id, event_id, event_time, event_type,",
      "         LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time, event_id) AS prev_time",
      "  FROM app_events",
      "), flagged AS (",
      "  SELECT user_id, event_id, event_time, event_type,",
      "         CASE WHEN prev_time IS NULL OR TIMESTAMPDIFF(SECOND, prev_time, event_time) > 1800 THEN 1 ELSE 0 END AS new_session",
      "  FROM gaps",
      "), sessions AS (",
      "  SELECT user_id, event_time, event_type,",
      "         SUM(new_session) OVER (PARTITION BY user_id ORDER BY event_time, event_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS session_no",
      "  FROM flagged",
      ")",
      "SELECT user_id, MIN(event_time) AS session_start, MAX(event_time) AS session_end, COUNT(*) AS events",
      "FROM sessions",
      "GROUP BY user_id, session_no",
      "HAVING SUM(CASE WHEN event_type = 'add_to_cart' THEN 1 ELSE 0 END) > 0",
      "   AND SUM(CASE WHEN event_type = 'checkout' THEN 1 ELSE 0 END) = 0",
      "ORDER BY user_id, session_start",
    ].join("\n"),
    alternatives: [
      [
        "WITH starts AS (",
        "  SELECT e.user_id, e.event_time AS start_time",
        "  FROM app_events e",
        "  WHERE NOT EXISTS (",
        "    SELECT 1 FROM app_events p",
        "    WHERE p.user_id = e.user_id",
        "      AND (p.event_time < e.event_time OR (p.event_time = e.event_time AND p.event_id < e.event_id))",
        "      AND p.event_time >= DATE_SUB(e.event_time, INTERVAL 1800 SECOND)",
        "  )",
        "), tagged AS (",
        "  SELECT e.user_id, e.event_time, e.event_type,",
        "         (SELECT MAX(s.start_time) FROM starts s WHERE s.user_id = e.user_id AND s.start_time <= e.event_time) AS session_start",
        "  FROM app_events e",
        ")",
        "SELECT user_id, session_start, MAX(event_time) AS session_end, COUNT(*) AS events",
        "FROM tagged",
        "GROUP BY user_id, session_start",
        "HAVING MAX(CASE WHEN event_type = 'add_to_cart' THEN 1 ELSE 0 END) = 1 AND MAX(CASE WHEN event_type = 'checkout' THEN 1 ELSE 0 END) = 0",
        "ORDER BY user_id, session_start",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Compare each event with the user's previous event (`LAG`) to see whether a new session starts there.",
      "Turn \"starts a session\" into 1/0 and take a running SUM of it: every event then carries its session number.",
      "Once every event has a session number, group by user and session and test the event types in HAVING.",
      "Use `TIMESTAMPDIFF(SECOND, …)` so a gap of 30 minutes and 1 second is not truncated to 30 minutes.",
    ],
    editorial: [
      "This is **sessionisation**, a gaps-and-islands problem on time. Step one: for every event, look at the user's previous event with `LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time, event_id)`. The event starts a new session if there is no previous event or the gap exceeds 1,800 seconds. Measure in seconds: `TIMESTAMPDIFF(MINUTE, …)` truncates, so 30 minutes 1 second would read as 30 and wrongly continue the session — user 8 in the example has exactly that gap.",
      "",
      "Step two: a running `SUM` of the 0/1 start flags, with an explicit `ROWS` frame over a unique order, numbers the sessions 1, 2, 3, … per user. Step three: group by user and session number; MIN and MAX give the session's bounds, and two conditional sums in `HAVING` keep sessions with an add-to-cart and no checkout. User 7's first session (10:00–10:35, the 30-minute gap counts as one session) is abandoned; the second ends in a checkout.",
      "",
      "The alternative finds session starts directly — events with no earlier event of the user within 30 minutes — and assigns each event the latest start at or before it. It avoids window functions but is quadratic per user; the window version is one sort.",
    ].join("\n"),
  },

  {
    slug: "monthly-buyer-cohort-retention",
    title: "Monthly Buyer Cohort Retention",
    difficulty: "HARD",
    topics: ["Dates", "Aggregation", "Subqueries"],
    description: [
      "A customer's **cohort** is the calendar month of their first order. The retention report asks, for each cohort, how many of its customers ordered again in the **next calendar month** and how many in the **month after that** (a customer counts once per column however many orders they placed, and may count in both).",
      "",
      "Return `cohort_month` (`YYYY-MM`), `customers` (the cohort's size), `month_1` and `month_2`, **ordered by `cohort_month`**. Orders later in the cohort month itself do not count as retention.",
    ].join("\n"),
    tables: [
      {
        name: "orders",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "order_date", type: "date" },
          { name: "order_total", type: "int" },
        ],
        primaryKey: ["order_id"],
        note: "One row per order.",
      },
    ],
    examples: [
      {
        orders: [
          [1, 1, "2023-12-05", 899],
          [2, 1, "2024-01-10", 499],
          [3, 1, "2024-02-02", 1299],
          [4, 2, "2023-12-20", 650],
          [5, 2, "2023-12-28", 300],
          [6, 2, "2024-02-15", 799],
          [7, 3, "2024-01-03", 2499],
          [8, 3, "2024-02-28", 199],
          [9, 3, "2024-02-29", 349],
          [10, 4, "2024-01-30", 1500],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const customers = ri(rng, 1, 10);
      for (let c = 1; c <= customers; c++) {
        const first = dateBetween(rng, "2023-11-01", "2024-02-28");
        rows.push([0, c, first, roundTo(rng, 100, 3000, 50) - 1]);
        for (let k = 0; k < ri(rng, 0, 3); k++) rows.push([0, c, addDays(first, ri(rng, 1, 95)), roundTo(rng, 100, 3000, 50) - 1]);
      }
      shuffle(rng, rows).forEach((r, i) => (r[0] = i + 1));
      return { orders: rows };
    },
    solution: [
      "WITH firsts AS (",
      "  SELECT customer_id, MIN(order_date) AS first_date",
      "  FROM orders",
      "  GROUP BY customer_id",
      "), per_customer AS (",
      "  SELECT f.customer_id, DATE_FORMAT(f.first_date, '%Y-%m') AS cohort_month,",
      "         MAX(CASE WHEN (YEAR(o.order_date) * 12 + MONTH(o.order_date)) - (YEAR(f.first_date) * 12 + MONTH(f.first_date)) = 1 THEN 1 ELSE 0 END) AS m1,",
      "         MAX(CASE WHEN (YEAR(o.order_date) * 12 + MONTH(o.order_date)) - (YEAR(f.first_date) * 12 + MONTH(f.first_date)) = 2 THEN 1 ELSE 0 END) AS m2",
      "  FROM firsts f",
      "  JOIN orders o ON o.customer_id = f.customer_id",
      "  GROUP BY f.customer_id, DATE_FORMAT(f.first_date, '%Y-%m')",
      ")",
      "SELECT cohort_month, COUNT(*) AS customers, SUM(m1) AS month_1, SUM(m2) AS month_2",
      "FROM per_customer",
      "GROUP BY cohort_month",
      "ORDER BY cohort_month",
    ].join("\n"),
    alternatives: [
      [
        "WITH cohorts AS (",
        "  SELECT customer_id, DATE_FORMAT(MIN(order_date), '%Y-%m') AS cohort_month FROM orders GROUP BY customer_id",
        ")",
        "SELECT c.cohort_month, COUNT(*) AS customers,",
        "       SUM(CASE WHEN EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id",
        "             AND DATE_FORMAT(o.order_date, '%Y-%m') = DATE_FORMAT(DATE_ADD(CONCAT(c.cohort_month, '-01'), INTERVAL 1 MONTH), '%Y-%m')) THEN 1 ELSE 0 END) AS month_1,",
        "       SUM(CASE WHEN EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id",
        "             AND DATE_FORMAT(o.order_date, '%Y-%m') = DATE_FORMAT(DATE_ADD(CONCAT(c.cohort_month, '-01'), INTERVAL 2 MONTH), '%Y-%m')) THEN 1 ELSE 0 END) AS month_2",
        "FROM cohorts c",
        "GROUP BY c.cohort_month",
        "ORDER BY c.cohort_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Each customer's cohort comes from their earliest order: `MIN(order_date)` per customer.",
      "Number months on one scale — `YEAR * 12 + MONTH` — so December to January is a difference of 1, not -11.",
      "Reduce to one row per customer with 0/1 flags for \"ordered in month 1\" and \"in month 2\" before counting the cohort, or a customer with two orders in a month counts twice.",
    ],
    editorial: [
      "Three steps. First, each customer's first order date — a grouped MIN — which fixes the cohort month. Second, compare every order of the customer with that first date on a **month index**: `YEAR * 12 + MONTH` turns calendar months into consecutive integers, so the difference is 1 for the next month even across a year boundary (December 2023 → January 2024). Day-based arithmetic would be wrong here: 30 January to 1 March is only 31 days, yet it is two calendar months on, not one.",
      "",
      "Collapse to one row per customer with `MAX(CASE …)` flags: did they order at index +1, at index +2. Taking MAX rather than SUM is what makes customer 3, with two orders in February, count once. Index 0 (more orders in the cohort month, like customer 2's second December order) sets neither flag. Finally group the customers by cohort: `COUNT(*)` is the cohort size, the summed flags are the retained counts.",
      "",
      "The alternative keeps one row per customer from the start and asks two `EXISTS` questions per customer, building the target month with `DATE_ADD(…, INTERVAL n MONTH)`. Both do one pass to find cohorts and one look at each customer's orders.",
    ].join("\n"),
  },

  {
    slug: "median-delivery-days-per-courier",
    title: "Median Delivery Days per Courier Partner",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation", "Dates"],
    description: [
      "The marketplace ships through several courier partners and renegotiates contracts on their **median** delivery time, which a few lost parcels cannot distort the way they distort an average. A shipment's delivery time is the days from `shipped_on` to `delivered_on`; shipments not delivered yet are ignored.",
      "",
      "For every courier with at least one delivered shipment return `courier`, `deliveries` and `median_days` — the middle value, or the average of the two middle values for an even count, **rounded to 1 decimal**. Order by `median_days`, then `courier`.",
    ].join("\n"),
    tables: [
      {
        name: "courier_shipments",
        columns: [
          { name: "shipment_id", type: "int" },
          { name: "courier", type: "varchar" },
          { name: "shipped_on", type: "date" },
          { name: "delivered_on", type: "date" },
        ],
        primaryKey: ["shipment_id"],
        note: "One row per shipment handed to a courier; `delivered_on` is NULL while in transit.",
      },
    ],
    examples: [
      {
        courier_shipments: [
          [1, "Delhivery", "2024-08-01", "2024-08-03"],
          [2, "Delhivery", "2024-08-01", "2024-08-09"],
          [3, "Delhivery", "2024-08-02", "2024-08-05"],
          [4, "Ekart", "2024-08-02", "2024-08-04"],
          [5, "Ekart", "2024-08-03", "2024-08-04"],
          [6, "Ekart", "2024-08-03", "2024-08-07"],
          [7, "Ekart", "2024-08-04", "2024-08-07"],
          [8, "Blue Dart", "2024-08-04", "2024-08-06"],
          [9, "Blue Dart", "2024-08-05", null],
        ],
      },
    ],
    gen: (rng) => {
      const couriers = sample(rng, ["Delhivery", "Ekart", "Blue Dart", "Xpressbees", "Shadowfax"], ri(rng, 1, 4));
      const n = ri(rng, 1, 25);
      const rows = seq(1, n).map((id) => {
        const shipped = dateBetween(rng, "2024-08-01", "2024-08-31");
        return [id, pick(rng, couriers), shipped, chance(rng, 0.12) ? null : addDays(shipped, chance(rng, 0.1) ? ri(rng, 8, 15) : ri(rng, 0, 6))];
      });
      return { courier_shipments: rows };
    },
    solution: [
      "WITH d AS (",
      "  SELECT courier, shipment_id, DATEDIFF(delivered_on, shipped_on) AS days",
      "  FROM courier_shipments",
      "  WHERE delivered_on IS NOT NULL",
      "), r AS (",
      "  SELECT courier, days,",
      "         ROW_NUMBER() OVER (PARTITION BY courier ORDER BY days, shipment_id) AS rn,",
      "         COUNT(*) OVER (PARTITION BY courier) AS n",
      "  FROM d",
      ")",
      "SELECT courier, MAX(n) AS deliveries, ROUND(AVG(days), 1) AS median_days",
      "FROM r",
      "WHERE rn IN (FLOOR((n + 1) / 2), FLOOR(n / 2) + 1)",
      "GROUP BY courier",
      "ORDER BY median_days, courier",
    ].join("\n"),
    alternatives: [
      [
        "WITH d AS (",
        "  SELECT courier, shipment_id, DATEDIFF(delivered_on, shipped_on) AS days FROM courier_shipments WHERE delivered_on IS NOT NULL",
        "), r AS (",
        "  SELECT courier, days,",
        "         ROW_NUMBER() OVER (PARTITION BY courier ORDER BY days, shipment_id) AS up,",
        "         ROW_NUMBER() OVER (PARTITION BY courier ORDER BY days DESC, shipment_id DESC) AS down",
        "  FROM d",
        ")",
        "SELECT courier, (SELECT COUNT(*) FROM d d2 WHERE d2.courier = r.courier) AS deliveries, ROUND(AVG(days), 1) AS median_days",
        "FROM r",
        "WHERE up + 1 >= down AND down + 1 >= up",
        "GROUP BY courier",
        "ORDER BY median_days, courier",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Compute each delivered shipment's days with `DATEDIFF` first.",
      "Number each courier's shipments in order of days and count how many each courier has — both window functions.",
      "With n rows, the middle positions are ⌊(n+1)/2⌋ and ⌊n/2⌋+1 — the same row when n is odd. Average the values at those positions.",
    ],
    editorial: [
      "MySQL has no MEDIAN aggregate, so the median is built from positions. After computing each delivered shipment's `days`, number each courier's rows in order of `days` with `ROW_NUMBER()` (the `shipment_id` tie-breaker keeps the numbering stable) and attach the courier's row count `n` with `COUNT(*) OVER (PARTITION BY courier)`.",
      "",
      "The middle rows sit at positions `FLOOR((n + 1) / 2)` and `FLOOR(n / 2) + 1`. For odd n both are the same position, and AVG over one row is that value; for even n they are the two middle rows and AVG gives their mean. Ekart in the example has days 1, 2, 3, 4 — positions 2 and 3, median 2.5. Ties in `days` do not matter: equal values are interchangeable in the sorted list.",
      "",
      "The alternative numbers the rows both upwards and downwards; the middle rows are those where the two numbers differ by at most 1. For that to work the two orders must be exact mirrors, hence `days DESC, shipment_id DESC`. (Write the test as `up + 1 >= down AND down + 1 >= up` rather than `ABS(up - down) <= 1`: MySQL types ROW_NUMBER as an unsigned integer, and subtracting a larger one from a smaller one is an out-of-range error rather than a negative number.) Both cost one sort per courier. Round only the final value so the half-day medians print as `2.5` everywhere.",
    ].join("\n"),
  },

  {
    slug: "top-three-sellers-per-category-q4-with-ties",
    title: "Top Three Sellers per Category in Q4, With Ties",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins", "Aggregation"],
    description: [
      "For the festive-season awards, each category honours its top sellers by revenue (`quantity * unit_price`) over order lines dated in **Q4 2024** (1 October to 31 December). Sellers with **equal revenue share a rank**, and ranks are **dense** — after two sellers tied at rank 1 the next is rank 2. Every seller ranked **1, 2 or 3** is honoured, however many that is.",
      "",
      "Return `category`, `store_name`, `revenue` and `category_rank`, ordered by `category`, then `category_rank`, then `store_name`. Lines outside Q4 are ignored; a seller's revenue in a category counts only their lines in that category.",
    ].join("\n"),
    tables: [
      {
        name: "sellers",
        columns: [
          { name: "seller_id", type: "int" },
          { name: "store_name", type: "varchar" },
        ],
        primaryKey: ["seller_id"],
        note: "One row per seller; store names are unique.",
      },
      {
        name: "order_lines",
        columns: [
          { name: "line_id", type: "int" },
          { name: "seller_id", type: "int" },
          { name: "category", type: "varchar" },
          { name: "quantity", type: "int" },
          { name: "unit_price", type: "int" },
          { name: "order_date", type: "date" },
        ],
        primaryKey: ["line_id"],
        note: "One row per delivered order line; `seller_id` is always in `sellers`.",
      },
    ],
    examples: [
      {
        sellers: [
          [1, "UrbanKart"], [2, "StyleStreet"], [3, "Lakshmi Textiles"], [4, "Patel Handlooms"], [5, "GadgetHub"],
        ],
        order_lines: [
          [1, 1, "Fashion", 2, 1500, "2024-10-05"],
          [2, 2, "Fashion", 1, 3000, "2024-11-11"],
          [3, 3, "Fashion", 1, 2000, "2024-12-01"],
          [4, 4, "Fashion", 3, 500, "2024-10-20"],
          [5, 4, "Fashion", 2, 4000, "2024-09-30"],
          [6, 5, "Fashion", 1, 900, "2024-12-31"],
          [7, 5, "Electronics", 2, 2500, "2024-11-02"],
          [8, 1, "Electronics", 1, 4999, "2025-01-01"],
        ],
      },
    ],
    gen: (rng) => {
      const ns = ri(rng, 1, 7);
      const stores = sample(rng, STORES, ns);
      const sellers = stores.map((s, i) => [i + 1, s]);
      const cats = sample(rng, CATEGORIES, ri(rng, 1, 2));
      const n = ri(rng, 1, 22);
      const lines = seq(1, n).map((id) => [
        id, ri(rng, 1, ns), pick(rng, cats), ri(rng, 1, 3), pick(rng, [500, 1000, 1500, 2000, 3000]),
        chance(rng, 0.15) ? pick(rng, ["2024-09-30", "2025-01-01"]) : chance(rng, 0.1) ? pick(rng, ["2024-10-01", "2024-12-31"]) : dateBetween(rng, "2024-10-01", "2024-12-31"),
      ]);
      return { sellers, order_lines: lines };
    },
    solution: [
      "WITH revenue AS (",
      "  SELECT l.category, s.store_name, SUM(l.quantity * l.unit_price) AS revenue",
      "  FROM order_lines l",
      "  JOIN sellers s ON s.seller_id = l.seller_id",
      "  WHERE l.order_date BETWEEN '2024-10-01' AND '2024-12-31'",
      "  GROUP BY l.category, s.seller_id, s.store_name",
      "), ranked AS (",
      "  SELECT category, store_name, revenue,",
      "         DENSE_RANK() OVER (PARTITION BY category ORDER BY revenue DESC) AS category_rank",
      "  FROM revenue",
      ")",
      "SELECT category, store_name, revenue, category_rank",
      "FROM ranked",
      "WHERE category_rank <= 3",
      "ORDER BY category, category_rank, store_name",
    ].join("\n"),
    alternatives: [
      [
        "WITH revenue AS (",
        "  SELECT l.category, s.store_name, SUM(l.quantity * l.unit_price) AS revenue",
        "  FROM order_lines l JOIN sellers s ON s.seller_id = l.seller_id",
        "  WHERE YEAR(l.order_date) = 2024 AND QUARTER(l.order_date) = 4",
        "  GROUP BY l.category, s.seller_id, s.store_name",
        ")",
        "SELECT category, store_name, revenue, category_rank FROM (",
        "  SELECT r.category, r.store_name, r.revenue,",
        "         (SELECT COUNT(DISTINCT x.revenue) FROM revenue x WHERE x.category = r.category AND x.revenue > r.revenue) + 1 AS category_rank",
        "  FROM revenue r",
        ") t",
        "WHERE category_rank <= 3",
        "ORDER BY category, category_rank, store_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Aggregate first: one row per (category, seller) with the Q4 revenue.",
      "`DENSE_RANK()` gives tied revenues one rank and leaves no gap after a tie; `RANK()` would skip numbers.",
      "Without a window: a seller's dense rank is 1 + the number of *distinct* revenues above theirs in the category.",
    ],
    editorial: [
      "First reduce the lines to revenue per seller per category, keeping only Q4 dates. The date filter is inclusive at both ends — 1 October and 31 December count, 30 September and 1 January do not — and it runs before grouping, so Patel Handlooms' September line in the example adds nothing.",
      "",
      "Then rank inside each category with `DENSE_RANK() OVER (PARTITION BY category ORDER BY revenue DESC)` and keep ranks up to 3. The choice of ranking function is the heart of the question: `ROW_NUMBER()` would honour exactly three sellers and break ties arbitrarily; `RANK()` would give 1, 1, 3 and stop a seller from being \"second\"; `DENSE_RANK()` gives 1, 1, 2, 3 — UrbanKart and StyleStreet both earn ₹3,000 in Fashion and share rank 1, so four Fashion sellers are honoured.",
      "",
      "The correlated alternative computes the dense rank by definition: one plus the number of distinct revenues strictly above. It is quadratic per category but needs no window functions. The final ORDER BY names the store as the last key so tied sellers come out in a fixed order.",
    ].join("\n"),
  },

  {
    slug: "longest-daily-selling-streak-per-seller",
    title: "Longest Daily Selling Streak per Seller",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "Seller badges reward consistency: the badge tier depends on a seller's **longest streak of consecutive calendar days** with at least one sale. Several sales on one day count as one day; a day with no sale ends the streak.",
      "",
      "For every seller with at least one sale, return `seller_id`, `longest_streak` (in days) and `streak_start` — the first day of that streak, or of the **earliest** one if several streaks share the longest length. Order by `longest_streak` descending, then `seller_id`.",
    ].join("\n"),
    tables: [
      {
        name: "seller_sales",
        columns: [
          { name: "sale_id", type: "int" },
          { name: "seller_id", type: "int" },
          { name: "sold_on", type: "date" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["sale_id"],
        note: "One row per sale; a seller can have many sales on the same day.",
      },
    ],
    examples: [
      {
        seller_sales: [
          [1, 10, "2024-12-29", 499],
          [2, 10, "2024-12-30", 1299],
          [3, 10, "2024-12-30", 350],
          [4, 10, "2024-12-31", 899],
          [5, 10, "2025-01-01", 650],
          [6, 10, "2025-01-03", 199],
          [7, 20, "2025-01-01", 2499],
          [8, 20, "2025-01-02", 799],
          [9, 20, "2025-01-05", 1500],
          [10, 20, "2025-01-06", 300],
          [11, 30, "2025-01-04", 999],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const sellers = ri(rng, 1, 4);
      for (let s = 1; s <= sellers; s++) {
        let day = dateBetween(rng, "2024-12-20", "2025-01-05");
        const k = ri(rng, 1, 8);
        for (let j = 0; j < k; j++) {
          rows.push([0, s * 10, day, roundTo(rng, 100, 3000, 50) - 1]);
          day = addDays(day, pick(rng, [0, 1, 1, 1, 2, 3]));
        }
      }
      shuffle(rng, rows).forEach((r, i) => (r[0] = i + 1));
      return { seller_sales: rows };
    },
    solution: [
      "WITH days AS (",
      "  SELECT DISTINCT seller_id, sold_on FROM seller_sales",
      "), numbered AS (",
      "  SELECT seller_id, sold_on, ROW_NUMBER() OVER (PARTITION BY seller_id ORDER BY sold_on) AS rn",
      "  FROM days",
      "), islands AS (",
      "  SELECT seller_id, MIN(sold_on) AS streak_start, COUNT(*) AS streak_len",
      "  FROM numbered",
      "  GROUP BY seller_id, DATE_SUB(sold_on, INTERVAL rn DAY)",
      "), best AS (",
      "  SELECT seller_id, streak_start, streak_len,",
      "         ROW_NUMBER() OVER (PARTITION BY seller_id ORDER BY streak_len DESC, streak_start) AS pos",
      "  FROM islands",
      ")",
      "SELECT seller_id, streak_len AS longest_streak, streak_start",
      "FROM best",
      "WHERE pos = 1",
      "ORDER BY longest_streak DESC, seller_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH days AS (SELECT DISTINCT seller_id, sold_on FROM seller_sales),",
        "starts AS (",
        "  SELECT d.seller_id, d.sold_on AS streak_start FROM days d",
        "  WHERE NOT EXISTS (SELECT 1 FROM days p WHERE p.seller_id = d.seller_id AND p.sold_on = DATE_SUB(d.sold_on, INTERVAL 1 DAY))",
        "),",
        "ends AS (",
        "  SELECT d.seller_id, d.sold_on AS streak_end FROM days d",
        "  WHERE NOT EXISTS (SELECT 1 FROM days n WHERE n.seller_id = d.seller_id AND n.sold_on = DATE_ADD(d.sold_on, INTERVAL 1 DAY))",
        "),",
        "streaks AS (",
        "  SELECT s.seller_id, s.streak_start,",
        "         DATEDIFF((SELECT MIN(e.streak_end) FROM ends e WHERE e.seller_id = s.seller_id AND e.streak_end >= s.streak_start), s.streak_start) + 1 AS streak_len",
        "  FROM starts s",
        ")",
        "SELECT seller_id, streak_len AS longest_streak, MIN(streak_start) AS streak_start",
        "FROM streaks t",
        "WHERE streak_len = (SELECT MAX(streak_len) FROM streaks m WHERE m.seller_id = t.seller_id)",
        "GROUP BY seller_id, streak_len",
        "ORDER BY longest_streak DESC, seller_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Reduce the sales to distinct (seller, day) pairs first — two sales on one day must not lengthen a streak.",
      "Number each seller's days in order. Along a run of consecutive days, the date minus that number (in days) stays the same.",
      "Group by that constant to get each streak's start and length, then keep the longest per seller, earliest first on ties.",
    ],
    editorial: [
      "Start by collapsing the sales into distinct selling days per seller: seller 10 sold twice on 30 December, and counting both rows would make a three-day run look like four.",
      "",
      "Then the **gaps-and-islands** trick on dates. Number each seller's days 1, 2, 3, … with `ROW_NUMBER()`. Within a run of consecutive dates, the date and the row number both advance by one each step, so `DATE_SUB(sold_on, INTERVAL rn DAY)` is the same date for every day in the run; any missing day shifts it. Grouping by that key gives each streak's first day (`MIN`) and length (`COUNT`). Date arithmetic handles month and year boundaries — seller 10's streak runs 29 December to 1 January, four days.",
      "",
      "Finally keep one streak per seller: `ROW_NUMBER()` ordered by length descending, then start ascending, so of two equally long streaks the earlier wins (seller 20 has two two-day streaks; 1 January is reported). The alternative finds streak starts (no sale the day before) and ends (no sale the day after) with `NOT EXISTS` and pairs each start with the nearest end — clearer to read, but it probes per day instead of sorting once.",
    ].join("\n"),
  },

  {
    slug: "redemption-that-exhausted-the-coupon-budget",
    title: "The Redemption That Exhausted Each Coupon Budget",
    difficulty: "HARD",
    topics: ["Window Functions", "Subqueries"],
    description: [
      "Each coupon campaign has a discount **budget** in rupees. Redemptions are applied in order of `redeemed_at`, then `redemption_id`; the campaign is **exhausted** by the first redemption at which the running total of `discount` **reaches or passes** the budget (finance then claws back the excess).",
      "",
      "For every exhausted campaign return `code`, `budget`, `redemption_id` and `redeemed_at` of that redemption, and `cumulative_discount` — the running total including it. Campaigns that never reached their budget are not listed. Order by `code`.",
    ].join("\n"),
    tables: [
      {
        name: "coupon_campaigns",
        columns: [
          { name: "code", type: "varchar" },
          { name: "budget", type: "int" },
          { name: "launched_on", type: "date" },
        ],
        primaryKey: ["code"],
        note: "One row per coupon campaign.",
      },
      {
        name: "campaign_redemptions",
        columns: [
          { name: "redemption_id", type: "int" },
          { name: "code", type: "varchar" },
          { name: "redeemed_at", type: "datetime" },
          { name: "discount", type: "int" },
        ],
        primaryKey: ["redemption_id"],
        note: "One row per order a coupon was applied to; `discount` (rupees) is always positive and `code` is always a campaign.",
      },
    ],
    examples: [
      {
        coupon_campaigns: [
          ["DIWALI500", 1500, "2024-10-25"],
          ["UPI50", 200, "2024-10-25"],
          ["FESTIVE20", 5000, "2024-10-26"],
        ],
        campaign_redemptions: [
          [1, "DIWALI500", "2024-10-28 10:00:00", 500],
          [2, "DIWALI500", "2024-10-28 11:30:00", 500],
          [3, "UPI50", "2024-10-28 11:30:00", 50],
          [4, "DIWALI500", "2024-10-28 12:00:00", 500],
          [5, "DIWALI500", "2024-10-28 12:05:00", 500],
          [6, "UPI50", "2024-10-28 12:00:00", 50],
          [7, "UPI50", "2024-10-28 13:00:00", 50],
          [9, "UPI50", "2024-10-28 13:00:00", 50],
          [8, "UPI50", "2024-10-28 13:00:00", 50],
          [10, "FESTIVE20", "2024-10-29 09:00:00", 1200],
        ],
      },
    ],
    gen: (rng) => {
      const codes = sample(rng, COUPON_CODES, ri(rng, 1, 4));
      const campaigns = codes.map((c) => [c, pick(rng, [200, 300, 500, 800, 1000, ri(rng, 3, 15) * 100]), dateBetween(rng, "2024-10-01", "2024-10-20")]);
      const rows: Cell[][] = [];
      for (const c of codes) {
        let t = `${dateBetween(rng, "2024-10-21", "2024-10-25")} 10:00:00`;
        const k = chance(rng, 0.1) ? 0 : ri(rng, 2, 8);
        for (let j = 0; j < k; j++) {
          if (!chance(rng, 0.25)) t = `${t.slice(0, 11)}${String(10 + j).padStart(2, "0")}:${String(ri(rng, 0, 59)).padStart(2, "0")}:00`;
          rows.push([0, c, t, pick(rng, [50, 100, 200, 250, 500])]);
        }
      }
      shuffle(rng, rows).forEach((r, i) => (r[0] = i + 1));
      return { coupon_campaigns: campaigns, campaign_redemptions: rows };
    },
    solution: [
      "WITH running AS (",
      "  SELECT r.code, c.budget, r.redemption_id, r.redeemed_at,",
      "         SUM(r.discount) OVER (PARTITION BY r.code ORDER BY r.redeemed_at, r.redemption_id",
      "                               ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_discount",
      "  FROM campaign_redemptions r",
      "  JOIN coupon_campaigns c ON c.code = r.code",
      "), crossed AS (",
      "  SELECT code, budget, redemption_id, redeemed_at, cumulative_discount,",
      "         ROW_NUMBER() OVER (PARTITION BY code ORDER BY redeemed_at, redemption_id) AS pos",
      "  FROM running",
      "  WHERE cumulative_discount >= budget",
      ")",
      "SELECT code, budget, redemption_id, redeemed_at, cumulative_discount",
      "FROM crossed",
      "WHERE pos = 1",
      "ORDER BY code",
    ].join("\n"),
    alternatives: [
      [
        "SELECT code, budget, redemption_id, redeemed_at, cumulative_discount FROM (",
        "  SELECT r.code, c.budget, r.redemption_id, r.redeemed_at, r.discount,",
        "         (SELECT SUM(x.discount) FROM campaign_redemptions x",
        "          WHERE x.code = r.code AND (x.redeemed_at < r.redeemed_at OR (x.redeemed_at = r.redeemed_at AND x.redemption_id <= r.redemption_id))) AS cumulative_discount",
        "  FROM campaign_redemptions r JOIN coupon_campaigns c ON c.code = r.code",
        ") t",
        "WHERE cumulative_discount >= budget AND cumulative_discount - discount < budget",
        "ORDER BY code",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "A running total is `SUM(discount) OVER (PARTITION BY code ORDER BY …)` — give it a unique order and a ROWS frame so same-second redemptions are added one at a time.",
      "Keep the rows where the running total has reached the budget; the earliest of them per code is the answer.",
      "Because every discount is positive, the crossing row is the one where the total *with* it reaches the budget and the total *before* it did not.",
    ],
    editorial: [
      "Compute the running total of discounts per campaign in redemption order, then find the first row where it reaches the budget.",
      "",
      "The running total is `SUM(discount) OVER (PARTITION BY code ORDER BY redeemed_at, redemption_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`. Both details of the window matter. Without `redemption_id` in the ORDER BY, redemptions in the same second have no defined order. And without an explicit `ROWS` frame the default is `RANGE`, which treats rows with equal sort keys as peers and adds them all at once — UPI50's three redemptions at 13:00 in the example would jump from 100 to 250 together, and the crossing row would be ambiguous. With the frame, the total reaches 200 at redemption 8.",
      "",
      "Filter `cumulative_discount >= budget` and take the earliest such row per code with `ROW_NUMBER()`. Since discounts are positive the running total only grows, so the crossing can also be identified locally: the total with the row reaches the budget but the total without it (`cumulative - discount`) does not. The correlated alternative uses that test with a subquery for the running sum — quadratic per campaign, but window-free. FESTIVE20 never reaches ₹5,000 and is not listed.",
    ].join("\n"),
  },

  {
    slug: "overlapping-flash-sales-on-one-product",
    title: "Overlapping Flash Sales on the Same Product",
    difficulty: "HARD",
    topics: ["Joins", "Dates", "Conditional Logic"],
    description: [
      "Two flash sales of the same product running at once split the traffic and confuse the price shown, so the campaign planner flags them. A sale runs from `starts_at` to `ends_at`, **both inclusive**, so a sale ending at 14:00:00 overlaps one starting at 14:00:00 (an overlap of 0 minutes).",
      "",
      "Return every pair of overlapping sales of the same product, once per pair, with the columns `product_id`, `sale_a` (the smaller `sale_id`), `sale_b` and `overlap_minutes` — the minutes from the later start to the earlier end. Order by `product_id`, `sale_a`, `sale_b`.",
    ].join("\n"),
    tables: [
      {
        name: "flash_sales",
        columns: [
          { name: "sale_id", type: "int" },
          { name: "product_id", type: "int" },
          { name: "starts_at", type: "datetime" },
          { name: "ends_at", type: "datetime" },
          { name: "sale_price", type: "int" },
        ],
        primaryKey: ["sale_id"],
        note: "One row per scheduled flash sale; times are on whole minutes and `starts_at` < `ends_at`.",
      },
    ],
    examples: [
      {
        flash_sales: [
          [1, 501, "2024-11-11 10:00:00", "2024-11-11 12:00:00", 14999],
          [2, 501, "2024-11-11 11:30:00", "2024-11-11 13:00:00", 15499],
          [3, 501, "2024-11-11 13:00:00", "2024-11-11 14:00:00", 14499],
          [4, 501, "2024-11-11 09:00:00", "2024-11-11 15:00:00", 15999],
          [5, 502, "2024-11-11 10:00:00", "2024-11-11 11:00:00", 999],
          [6, 503, "2024-11-11 10:00:00", "2024-11-11 11:00:00", 1299],
          [7, 502, "2024-11-11 11:01:00", "2024-11-11 12:00:00", 949],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 9);
      const rows = seq(1, n).map((id) => {
        const startMin = 8 * 60 + ri(rng, 0, 24) * 15;
        const len = pick(rng, [15, 30, 60, 90, 120]);
        const fmt = (m: number) => `2024-11-11 ${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:00`;
        return [id, 500 + ri(rng, 1, 3), fmt(startMin), fmt(startMin + len), roundTo(rng, 500, 20000, 500) - 1];
      });
      return { flash_sales: rows };
    },
    solution: [
      "SELECT a.product_id, a.sale_id AS sale_a, b.sale_id AS sale_b,",
      "       TIMESTAMPDIFF(MINUTE, GREATEST(a.starts_at, b.starts_at), LEAST(a.ends_at, b.ends_at)) AS overlap_minutes",
      "FROM flash_sales a",
      "JOIN flash_sales b",
      "  ON b.product_id = a.product_id",
      " AND a.sale_id < b.sale_id",
      " AND a.starts_at <= b.ends_at",
      " AND b.starts_at <= a.ends_at",
      "ORDER BY a.product_id, sale_a, sale_b",
    ].join("\n"),
    alternatives: [
      [
        "SELECT product_id, sale_a, sale_b, TIMESTAMPDIFF(MINUTE, later_start, earlier_end) AS overlap_minutes FROM (",
        "  SELECT a.product_id, a.sale_id AS sale_a, b.sale_id AS sale_b,",
        "         CASE WHEN a.starts_at >= b.starts_at THEN a.starts_at ELSE b.starts_at END AS later_start,",
        "         CASE WHEN a.ends_at <= b.ends_at THEN a.ends_at ELSE b.ends_at END AS earlier_end",
        "  FROM flash_sales a, flash_sales b",
        "  WHERE a.product_id = b.product_id AND a.sale_id < b.sale_id",
        ") t",
        "WHERE later_start <= earlier_end",
        "ORDER BY product_id, sale_a, sale_b",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Pair the table with itself on the product, and use `a.sale_id < b.sale_id` so each pair appears once and a sale is never paired with itself.",
      "Two intervals overlap exactly when each one starts no later than the other ends.",
      "The shared part runs from the later of the two starts to the earlier of the two ends — `GREATEST` and `LEAST`.",
    ],
    editorial: [
      "Finding pairs of rows means a **self join**: two copies of `flash_sales` matched on `product_id`. The condition `a.sale_id < b.sale_id` does two jobs at once — it drops a sale paired with itself and keeps only one of the two orderings of every pair, so the smaller id lands in `sale_a` as asked.",
      "",
      "The overlap test is the classic one for intervals: `a.starts_at <= b.ends_at AND b.starts_at <= a.ends_at`. It covers every arrangement — partial overlap (sales 1 and 2), one sale inside another (sale 4 contains 1, 2 and 3), and touching ends (sales 2 and 3 meet at 13:00 and overlap for 0 minutes because the bounds are inclusive). Sales 5 and 7 are a minute apart and do not overlap. Testing only \"b starts inside a\" misses the containment case where b starts first.",
      "",
      "The shared stretch runs from the later start to the earlier end, `GREATEST(starts)` to `LEAST(ends)`, and `TIMESTAMPDIFF(MINUTE, …)` measures it — exact here because the times are on whole minutes. The alternative computes the two bounds with CASE and tests `later_start <= earlier_end`, which is the same overlap condition stated on the bounds. The self join is quadratic per product; with an index on `(product_id, starts_at)` it stays small.",
    ].join("\n"),
  },
];
