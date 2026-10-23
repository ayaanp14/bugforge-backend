import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, chance, dateBetween, names, pick, ri, roundTo, sample } from "./kit.js";

/**
 * Company set — Myntra: the questions a data analyst or engineer on a fashion
 * marketplace is handed — the End of Reason Sale's early-access hours and
 * markdowns, size charts and size-related returns, exchanges versus refunds,
 * wishlist-to-purchase, Insider tiers and points, creator-store commissions,
 * M-Now quick-delivery promises, coupon abuse, catalogue image QC, and the
 * stock that runs out on sale day. The schemas and data are invented for
 * practice; they are not Myntra's tables and no figure is a real one.
 * Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
const pad = (n: number) => String(n).padStart(2, "0");
/** 'YYYY-MM-DD HH:MM:00' from a date and minutes after midnight (may run into the next days). */
const at = (date: string, minutes: number): string => {
  const d = addDays(date, Math.floor(minutes / 1440));
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${d} ${pad(Math.floor(m / 60))}:${pad(m % 60)}:00`;
};

const BRANDS = ["Roadster", "HRX", "Mast & Harbour", "Dressberry", "Anouk", "Here&Now", "Sangria", "Kook N Keech"] as const;
const ARTICLE_NAMES = ["Slim Fit Jeans", "Running T-shirt", "Printed Kurta", "Wrap Dress", "Chunky Sneakers", "Oversized Shirt", "Cargo Joggers", "Anarkali Kurta"] as const;
const COLOURS = ["Navy Blue", "Black", "Olive", "Maroon", "White", "Mustard"] as const;
const PAID_TIERS = ["insider", "select", "elite", "icon"] as const;
const RETURN_REASONS = ["size_too_small", "size_too_large", "colour_different", "damaged", "changed_mind"] as const;
const SIZE_REASONS = ["size_too_small", "size_too_large"] as const;

export const COMPANY_MYNTRA: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "myntra-eors-insider-early-access-orders",
    title: "Myntra: Orders Placed in the EORS Insider Early-Access Hours",
    difficulty: "EASY",
    topics: ["Joins", "Dates"],
    description: [
      "Before the End of Reason Sale opens to everyone at midnight, Insider members get four hours of early access. The loyalty team wants the orders that actually used that window.",
      "",
      "Return every order placed **from 2024-05-31 20:00:00 inclusive up to, but not including, 2024-06-01 00:00:00** by a shopper whose `insider_tier` is anything other than `none`, and whose `status` is not `cancelled`. Return the columns `order_id`, `name` and `insider_tier`, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Shopper",
        columns: [
          { name: "user_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "insider_tier", type: "enum", values: ["none", "insider", "select", "elite", "icon"] },
        ],
        primaryKey: ["user_id"],
        note: "One row per account. `none` means the shopper is not in the Insider programme.",
      },
      {
        name: "ShopOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "placed_at", type: "datetime" },
          { name: "order_value", type: "int" },
          { name: "status", type: "enum", values: ["placed", "delivered", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per order; `user_id` always names a shopper.",
      },
    ],
    examples: [
      {
        Shopper: [
          [1, "Aarav", "elite"],
          [2, "Diya", "none"],
          [3, "Kabir", "insider"],
          [4, "Meera", "icon"],
        ],
        ShopOrder: [
          [1001, 1, "2024-05-31 20:00:00", 2499, "placed"],
          [1002, 2, "2024-05-31 21:15:00", 1899, "placed"],
          [1003, 3, "2024-05-31 23:59:59", 999, "delivered"],
          [1004, 4, "2024-06-01 00:00:00", 3499, "placed"],
          [1005, 1, "2024-05-31 19:59:59", 1299, "placed"],
          [1006, 4, "2024-05-31 22:40:00", 5999, "cancelled"],
          [1007, 4, "2024-05-31 22:45:00", 5799, "placed"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 8);
      const who = names(rng, n);
      const shoppers: Cell[][] = seq(1, n).map((id, i) => [id, who[i]!, chance(rng, 0.3) ? "none" : pick(rng, PAID_TIERS)]);
      const edges = ["2024-05-31 19:59:59", "2024-05-31 20:00:00", "2024-05-31 23:59:59", "2024-06-01 00:00:00"];
      const m = chance(rng, 0.05) ? 0 : ri(rng, 3, 18);
      const orders: Cell[][] = seq(1001, m).map((id) => [
        id,
        ri(rng, 1, n),
        chance(rng, 0.3) ? pick(rng, edges) : at("2024-05-31", ri(rng, 18 * 60, 26 * 60)),
        roundTo(rng, 500, 7000, 100) - 1,
        pick(rng, ["placed", "placed", "delivered", "cancelled"]),
      ]);
      return { Shopper: shoppers, ShopOrder: orders };
    },
    solution: [
      "SELECT o.order_id, s.name, s.insider_tier",
      "FROM ShopOrder o",
      "JOIN Shopper s ON s.user_id = o.user_id",
      "WHERE s.insider_tier <> 'none'",
      "  AND o.status <> 'cancelled'",
      "  AND o.placed_at >= '2024-05-31 20:00:00'",
      "  AND o.placed_at < '2024-06-01 00:00:00'",
    ].join("\n"),
    alternatives: [
      [
        "SELECT o.order_id, s.name, s.insider_tier",
        "FROM ShopOrder o, Shopper s",
        "WHERE s.user_id = o.user_id",
        "  AND s.insider_tier IN ('insider', 'select', 'elite', 'icon')",
        "  AND o.status IN ('placed', 'delivered')",
        "  AND CAST(o.placed_at AS DATE) = '2024-05-31'",
        "  AND HOUR(o.placed_at) >= 20",
      ].join("\n"),
    ],
    hints: [
      "The tier lives on the shopper and the time on the order, so join the two tables on `user_id`.",
      "A half-open window — `>=` the start and `<` the end — keeps 20:00:00 and drops midnight itself.",
      "Midnight belongs to 1 June, which is the public sale, not early access.",
    ],
    editorial: [
      "Each order is either in the early-access window or not, so this is a join followed by a filter. The tier is a property of the shopper and the timestamp a property of the order, so `ShopOrder` is joined to `Shopper` on `user_id` and four conditions are applied together: the tier is not `none`, the order was not cancelled, and the timestamp lies in the window.",
      "",
      "The window is half-open: `placed_at >= '2024-05-31 20:00:00'` keeps an order placed at exactly eight o'clock, and `placed_at < '2024-06-01 00:00:00'` drops one placed at midnight, which is already the public sale. Writing `BETWEEN ... AND '2024-06-01 00:00:00'` would wrongly keep midnight; writing `<= '2024-05-31 23:59:59'` happens to work here because times are stored to the second, but the half-open form is the habit that survives finer timestamps.",
      "",
      "The alternative reads the same window as \"the date is 31 May and the hour is 20 or later\" and lists the allowed values with `IN`. Both are a single pass over the orders with a primary-key lookup per shopper.",
    ].join("\n"),
  },

  {
    slug: "myntra-live-styles-without-an-approved-image",
    title: "Myntra: Live Styles With No Approved Catalogue Image",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "Catalogue quality control checks every product photo before it can be shown. A style that went live while none of its photos had passed QC shows a blank tile, and the catalogue team wants the list to fix.",
      "",
      "Return `style_id` and `style_name` of every style with `is_live = 1` that has **no image with `qc_status = 'approved'`** — whether it has no images at all or only rejected and pending ones. Styles that are not live never appear. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Style",
        columns: [
          { name: "style_id", type: "int" },
          { name: "style_name", type: "varchar" },
          { name: "brand", type: "varchar" },
          { name: "is_live", type: "bool" },
        ],
        primaryKey: ["style_id"],
        note: "One row per style (a design, before colour and size variants). `is_live` is 1 when the style is visible to shoppers.",
      },
      {
        name: "StyleImage",
        columns: [
          { name: "image_id", type: "int" },
          { name: "style_id", type: "int" },
          { name: "qc_status", type: "enum", values: ["approved", "rejected", "pending"] },
        ],
        primaryKey: ["image_id"],
        note: "One row per uploaded photo and its quality-check result.",
      },
    ],
    examples: [
      {
        Style: [
          [1, "Roadster Slim Fit Jeans", "Roadster", 1],
          [2, "HRX Running T-shirt", "HRX", 1],
          [3, "Anouk Printed Kurta", "Anouk", 1],
          [4, "Dressberry Wrap Dress", "Dressberry", 0],
          [5, "Sangria Anarkali Kurta", "Sangria", 1],
        ],
        StyleImage: [
          [1, 1, "approved"],
          [2, 1, "rejected"],
          [3, 2, "rejected"],
          [4, 2, "pending"],
          [5, 4, "pending"],
          [6, 5, "approved"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 8);
      const styles: Cell[][] = seq(1, n).map((id) => {
        const brand = pick(rng, BRANDS);
        return [id, `${brand} ${pick(rng, ARTICLE_NAMES)}`, brand, chance(rng, 0.8) ? 1 : 0];
      });
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 14);
      const images: Cell[][] = seq(1, m).map((id) => [id, ri(rng, 1, n), pick(rng, ["approved", "approved", "rejected", "pending"])]);
      return { Style: styles, StyleImage: images };
    },
    solution: [
      "SELECT s.style_id, s.style_name",
      "FROM Style s",
      "WHERE s.is_live = 1",
      "  AND NOT EXISTS (",
      "    SELECT 1 FROM StyleImage i",
      "    WHERE i.style_id = s.style_id AND i.qc_status = 'approved'",
      "  )",
    ].join("\n"),
    alternatives: [
      [
        "SELECT s.style_id, s.style_name",
        "FROM Style s",
        "LEFT JOIN StyleImage i ON i.style_id = s.style_id AND i.qc_status = 'approved'",
        "WHERE s.is_live = 1 AND i.image_id IS NULL",
      ].join("\n"),
      "SELECT style_id, style_name FROM Style WHERE is_live = 1 AND style_id NOT IN (SELECT style_id FROM StyleImage WHERE qc_status = 'approved')",
    ],
    hints: [
      "You are looking for something that does **not** exist — an approved image for the style.",
      "`NOT EXISTS` with a correlated subquery, or a LEFT JOIN that keeps only unmatched styles, both express it.",
      "If you use a LEFT JOIN, the `qc_status = 'approved'` test belongs in the `ON` clause, not in `WHERE`.",
    ],
    editorial: [
      "This is an **anti join**: keep the live styles for which no approved image exists. `NOT EXISTS` says it directly — for each live style, the subquery looks for an image of that style whose status is `approved`, and the style is kept only when it finds none. A style with no images at all and a style with only rejected or pending images both pass, which is what the catalogue team wants.",
      "",
      "The LEFT JOIN version is a common place to slip. The approval condition has to sit in the `ON` clause, so that only approved images are candidates for the match; a style with no such image then comes out with NULLs, and `i.image_id IS NULL` keeps it. Putting `qc_status = 'approved'` in `WHERE` instead would throw away every unmatched row and return nothing useful.",
      "",
      "`NOT IN` works too because `style_id` in the image table is never NULL; if it could be, a single NULL would make `NOT IN` return no rows at all, which is why `NOT EXISTS` is the safer habit. All three are one scan of the styles with an index lookup into the images.",
    ].join("\n"),
  },

  {
    slug: "myntra-most-common-return-reasons-2024",
    title: "Myntra: Most Common Return Reasons in 2024",
    difficulty: "EASY",
    topics: ["Aggregation", "Dates"],
    description: [
      "The returns team is writing its annual review and wants to know which reasons shoppers picked most often when they sent something back or asked for an exchange.",
      "",
      "Count the requests raised **in calendar year 2024** (`requested_on` from 2024-01-01 to 2024-12-31), returns and exchanges together, per `reason`. Return `reason` and `requests`, **ordered by `requests` descending, then by `reason` alphabetically**. Reasons with no 2024 request do not appear.",
    ].join("\n"),
    tables: [
      {
        name: "ReturnRequest",
        columns: [
          { name: "return_id", type: "int" },
          { name: "order_item_id", type: "int" },
          { name: "reason", type: "varchar" },
          { name: "request_type", type: "enum", values: ["return", "exchange"] },
          { name: "requested_on", type: "date" },
        ],
        primaryKey: ["return_id"],
        note: "One row per return or exchange request. `reason` is the code the shopper picked, such as `size_too_small` or `damaged`.",
      },
    ],
    examples: [
      {
        ReturnRequest: [
          [1, 501, "size_too_small", "exchange", "2024-01-04"],
          [2, 502, "size_too_large", "return", "2024-02-11"],
          [3, 503, "size_too_small", "return", "2024-03-20"],
          [4, 504, "damaged", "return", "2023-12-30"],
          [5, 505, "size_too_large", "exchange", "2024-06-01"],
          [6, 506, "colour_different", "return", "2024-12-31"],
          [7, 507, "changed_mind", "return", "2025-01-01"],
          [8, 508, "damaged", "return", "2024-07-15"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 20);
      const edges = ["2023-12-31", "2024-01-01", "2024-12-31", "2025-01-01"];
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        500 + id,
        pick(rng, RETURN_REASONS),
        pick(rng, ["return", "exchange"]),
        chance(rng, 0.2) ? pick(rng, edges) : dateBetween(rng, "2023-11-01", "2025-02-28"),
      ]);
      return { ReturnRequest: rows };
    },
    solution: [
      "SELECT reason, COUNT(*) AS requests",
      "FROM ReturnRequest",
      "WHERE requested_on >= '2024-01-01' AND requested_on < '2025-01-01'",
      "GROUP BY reason",
      "ORDER BY requests DESC, reason ASC",
    ].join("\n"),
    alternatives: [
      "SELECT reason, COUNT(return_id) AS requests FROM ReturnRequest WHERE YEAR(requested_on) = 2024 GROUP BY reason ORDER BY COUNT(return_id) DESC, reason",
    ],
    ordered: true,
    hints: [
      "Filter to 2024 first, then group by the reason.",
      "Both request types count, so do not filter on `request_type`.",
      "Two reasons can share a count — the second sort key decides their order.",
    ],
    editorial: [
      "The question is a filter, a group and a sort. The `WHERE` clause keeps only requests raised in 2024; written as `requested_on >= '2024-01-01' AND requested_on < '2025-01-01'` it includes both New Year's Eve and New Year's Day of 2024 and leaves out the two neighbouring days, which the data puts there on purpose. `YEAR(requested_on) = 2024` says the same thing and is the alternative, though it cannot use an index on the date.",
      "",
      "`GROUP BY reason` then makes one group per reason that still has rows, and `COUNT(*)` counts them. A reason with no 2024 request has no rows left after the filter, so it forms no group and does not appear — exactly what the statement asks.",
      "",
      "The order is fixed: most requests first, and when two reasons tie, alphabetical by reason. Without the second key the tied rows could come back in either order. The query reads the table once and sorts a handful of groups.",
    ].join("\n"),
  },

  {
    slug: "myntra-product-display-names",
    title: "Myntra: Product Display Names From Brand, Colour and Article",
    difficulty: "EASY",
    topics: ["Strings"],
    description: [
      "The product tile on the listing page shows a display name built from three catalogue fields. Brand names were typed in by hand at onboarding and some carry stray spaces; some styles have no colour recorded yet.",
      "",
      "For every live style (`is_live = 1`) return `style_id` and `display_name`: the brand with spaces removed from both ends, the colour, and the article type, joined by **single spaces**. When `colour` is NULL, leave it out (no double space). Order the rows by `style_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Style",
        columns: [
          { name: "style_id", type: "int" },
          { name: "brand", type: "varchar" },
          { name: "colour", type: "varchar" },
          { name: "article_type", type: "varchar" },
          { name: "is_live", type: "bool" },
        ],
        primaryKey: ["style_id"],
        note: "`brand` may have leading or trailing spaces; `colour` and `article_type` never do. `colour` may be NULL.",
      },
    ],
    examples: [
      {
        Style: [
          [1, "Roadster", "Navy Blue", "Slim Fit Jeans", 1],
          [2, "  HRX", "Black", "Running T-shirt", 1],
          [3, "Anouk", null, "Printed Kurta", 1],
          [4, "Dressberry", "Maroon", "Wrap Dress", 0],
          [5, "Mast & Harbour ", "Olive", "Cargo Joggers", 1],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        `${pick(rng, ["", "", " ", "  "])}${pick(rng, BRANDS)}${pick(rng, ["", "", " "])}`,
        chance(rng, 0.3) ? null : pick(rng, COLOURS),
        pick(rng, ARTICLE_NAMES),
        chance(rng, 0.8) ? 1 : 0,
      ]);
      return { Style: rows };
    },
    solution: [
      "SELECT style_id, CONCAT_WS(' ', TRIM(brand), colour, article_type) AS display_name",
      "FROM Style",
      "WHERE is_live = 1",
      "ORDER BY style_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT style_id,",
        "       CASE WHEN colour IS NULL THEN CONCAT(TRIM(brand), ' ', article_type)",
        "            ELSE CONCAT(TRIM(brand), ' ', colour, ' ', article_type) END AS display_name",
        "FROM Style WHERE is_live = 1 ORDER BY style_id",
      ].join("\n"),
      "SELECT style_id, CONCAT(TRIM(brand), ' ', IFNULL(CONCAT(colour, ' '), ''), article_type) AS display_name FROM Style WHERE is_live = 1 ORDER BY style_id",
    ],
    ordered: true,
    hints: [
      "`TRIM` removes spaces from both ends of a string.",
      "`CONCAT` returns NULL as soon as one argument is NULL — try it on style 3.",
      "`CONCAT_WS(separator, …)` skips NULL arguments, separator and all.",
    ],
    editorial: [
      "Two string problems hide in this one. The first is the stray spaces around some brands: `TRIM(brand)` removes them from both ends, so `'  HRX'` and `'Mast & Harbour '` become clean words before anything is joined to them.",
      "",
      "The second is the NULL colour. Plain `CONCAT(TRIM(brand), ' ', colour, ' ', article_type)` returns NULL for the whole name as soon as `colour` is NULL — MySQL's rule is that any NULL argument makes the result NULL — so the tile would show nothing. `CONCAT_WS(' ', …)` (\"concat with separator\") is built for this: it puts the separator only between the arguments that are not NULL, so a missing colour leaves `Anouk Printed Kurta` with single spaces.",
      "",
      "The alternatives spell the same rule out by hand: a `CASE` that picks one of two `CONCAT`s, or `IFNULL(CONCAT(colour, ' '), '')`, which turns a missing colour, together with its trailing space, into the empty string. The query is one pass over the styles plus a sort by the primary key.",
    ].join("\n"),
  },

  {
    slug: "myntra-wishlisted-styles-not-yet-bought",
    title: "Myntra: Wishlisted Styles the Shopper Has Not Bought Yet",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "Before a sale, the CRM team sends each shopper a reminder about the styles still sitting in their wishlist. A style the shopper has already bought should not be in that reminder.",
      "",
      "Return `user_id` and `style_id` for every wishlist entry where **that same shopper** has no order line of that style with a `status` other than `cancelled` — a delivered or returned purchase counts as bought, at any date. Another shopper's purchase does not matter. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Wishlist",
        columns: [
          { name: "user_id", type: "int" },
          { name: "style_id", type: "int" },
          { name: "added_on", type: "date" },
        ],
        primaryKey: ["user_id", "style_id"],
        note: "One row per style a shopper has saved to their wishlist.",
      },
      {
        name: "OrderLine",
        columns: [
          { name: "order_line_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "style_id", type: "int" },
          { name: "size", type: "varchar" },
          { name: "ordered_on", type: "date" },
          { name: "status", type: "enum", values: ["delivered", "returned", "cancelled"] },
        ],
        primaryKey: ["order_line_id"],
        note: "One row per item bought, in one size.",
      },
    ],
    examples: [
      {
        Wishlist: [
          [1, 10, "2024-05-01"],
          [1, 11, "2024-05-03"],
          [2, 10, "2024-05-04"],
          [2, 12, "2024-05-10"],
          [3, 11, "2024-05-12"],
        ],
        OrderLine: [
          [1, 1, 10, "M", "2024-05-20", "delivered"],
          [2, 2, 10, "L", "2024-05-21", "cancelled"],
          [3, 2, 12, "S", "2024-04-01", "returned"],
          [4, 3, 10, "M", "2024-05-22", "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      const users = ri(rng, 1, 5);
      const styles = seq(10, ri(rng, 2, 5));
      const pairs: [number, number][] = [];
      for (const u of seq(1, users)) for (const s of styles) pairs.push([u, s]);
      const wish = sample(rng, pairs, ri(rng, 1, Math.min(10, pairs.length)));
      const wishlist: Cell[][] = wish.map(([u, s]) => [u, s, dateBetween(rng, "2024-04-01", "2024-05-31")]);
      const m = ri(rng, 0, 12);
      const lines: Cell[][] = seq(1, m).map((id) => {
        const [u, s] = chance(rng, 0.5) ? pick(rng, wish) : pick(rng, pairs);
        return [id, u, s, pick(rng, ["S", "M", "L", "XL"]), dateBetween(rng, "2024-03-15", "2024-06-30"), pick(rng, ["delivered", "delivered", "returned", "cancelled"])];
      });
      return { Wishlist: wishlist, OrderLine: lines };
    },
    solution: [
      "SELECT w.user_id, w.style_id",
      "FROM Wishlist w",
      "WHERE NOT EXISTS (",
      "  SELECT 1 FROM OrderLine o",
      "  WHERE o.user_id = w.user_id AND o.style_id = w.style_id AND o.status <> 'cancelled'",
      ")",
    ].join("\n"),
    alternatives: [
      [
        "SELECT w.user_id, w.style_id",
        "FROM Wishlist w",
        "LEFT JOIN OrderLine o ON o.user_id = w.user_id AND o.style_id = w.style_id AND o.status <> 'cancelled'",
        "WHERE o.order_line_id IS NULL",
      ].join("\n"),
      "SELECT user_id, style_id FROM Wishlist EXCEPT SELECT user_id, style_id FROM OrderLine WHERE status <> 'cancelled'",
    ],
    hints: [
      "A match needs both the shopper and the style to agree — one column is not enough.",
      "Think \"wishlist entries for which no qualifying order line exists\".",
      "A cancelled line is not a purchase, so leave it out of the match itself.",
    ],
    editorial: [
      "Each wishlist row is a (shopper, style) pair, and it stays in the reminder unless that exact pair also appears among the shopper's real purchases. That is an anti join on **two** columns: the correlated `NOT EXISTS` looks for an order line with the same `user_id` and the same `style_id` whose status is not `cancelled`, and keeps the wishlist row only when there is none.",
      "",
      "Matching on `style_id` alone would be the bug — shopper 3 buying style 10 must not remove style 10 from shopper 2's reminder. And the status test sits inside the match, so a cancelled order is treated as if it never happened, while a returned one still counts as bought, as the statement says. The purchase date does not matter: a style bought before it was wishlisted is still bought.",
      "",
      "The LEFT JOIN alternative carries the same conditions in `ON` and keeps the rows that found no partner. `EXCEPT` removes the bought pairs from the wishlisted ones as sets — safe here because the wishlist's key already makes its pairs distinct. All run in time proportional to the two tables with an index on `(user_id, style_id)`.",
    ].join("\n"),
  },

  {
    slug: "myntra-insider-points-per-order",
    title: "Myntra: Insider Points Earned on Each Delivered Order",
    difficulty: "EASY",
    topics: ["Conditional Logic", "Joins"],
    description: [
      "Insider members earn points on every delivered order, and the rate depends on their tier. The loyalty team needs the points to credit for each order.",
      "",
      "A shopper earns points for every **full ₹100** of `order_value`: 2 points per ₹100 at `insider`, 3 at `select`, 4 at `elite`, 5 at `icon`, and 0 for `none`. For every order with `status = 'delivered'`, return `order_id`, `name` and `points`. An order under ₹100 earns 0. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Shopper",
        columns: [
          { name: "user_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "insider_tier", type: "enum", values: ["none", "insider", "select", "elite", "icon"] },
        ],
        primaryKey: ["user_id"],
        note: "One row per account and its current Insider tier.",
      },
      {
        name: "ShopOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "order_value", type: "int" },
          { name: "status", type: "enum", values: ["delivered", "returned", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per order; `order_value` is in whole rupees.",
      },
    ],
    examples: [
      {
        Shopper: [
          [1, "Aarav", "elite"],
          [2, "Diya", "none"],
          [3, "Kabir", "icon"],
          [4, "Meera", "insider"],
          [5, "Rohan", "select"],
        ],
        ShopOrder: [
          [101, 1, 2599, "delivered"],
          [102, 2, 4999, "delivered"],
          [103, 3, 99, "delivered"],
          [104, 4, 1200, "delivered"],
          [105, 5, 3450, "returned"],
          [106, 5, 800, "delivered"],
          [107, 3, 1999, "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 6);
      const who = names(rng, n);
      const shoppers: Cell[][] = seq(1, n).map((id, i) => [id, who[i]!, chance(rng, 0.2) ? "none" : pick(rng, PAID_TIERS)]);
      const m = ri(rng, 1, 15);
      const orders: Cell[][] = seq(101, m).map((id) => [
        id,
        ri(rng, 1, n),
        chance(rng, 0.2) ? pick(rng, [99, 100, 199, 200, 1000]) : ri(rng, 50, 9999),
        pick(rng, ["delivered", "delivered", "delivered", "returned", "cancelled"]),
      ]);
      return { Shopper: shoppers, ShopOrder: orders };
    },
    solution: [
      "SELECT o.order_id, s.name,",
      "       FLOOR(o.order_value / 100) * CASE s.insider_tier",
      "         WHEN 'insider' THEN 2 WHEN 'select' THEN 3 WHEN 'elite' THEN 4 WHEN 'icon' THEN 5 ELSE 0",
      "       END AS points",
      "FROM ShopOrder o",
      "JOIN Shopper s ON s.user_id = o.user_id",
      "WHERE o.status = 'delivered'",
    ].join("\n"),
    alternatives: [
      [
        "SELECT o.order_id, s.name, (o.order_value DIV 100) * COALESCE(r.rate, 0) AS points",
        "FROM ShopOrder o",
        "JOIN Shopper s ON s.user_id = o.user_id",
        "LEFT JOIN (SELECT 'insider' AS tier, 2 AS rate UNION ALL SELECT 'select', 3",
        "           UNION ALL SELECT 'elite', 4 UNION ALL SELECT 'icon', 5) r ON r.tier = s.insider_tier",
        "WHERE o.status = 'delivered'",
      ].join("\n"),
    ],
    hints: [
      "\"Every full ₹100\" is the order value divided by 100, rounded down.",
      "Turn the tier into a rate with a `CASE`, and remember `none` earns nothing.",
      "Returned and cancelled orders earn no points, so filter on the status.",
    ],
    editorial: [
      "Points are a product of two numbers: how many full hundreds the order is worth, and the tier's rate per hundred. The first is `FLOOR(order_value / 100)` — in MySQL `/` is exact division, so 2599 / 100 is 25.99 and `FLOOR` brings it down to 25. `order_value DIV 100`, integer division, gives the same 25 directly and is what the alternative uses. An order of ₹99 has no full hundred and earns 0 whatever the tier.",
      "",
      "The rate comes from the shopper's tier, so the orders are joined to `Shopper` and a `CASE` maps each tier to 2, 3, 4 or 5, with `ELSE 0` covering `none`. The alternative keeps the rates as a small table built with `UNION ALL` and LEFT JOINs it, so a tier missing from it (here `none`) comes back NULL and `COALESCE` turns that into 0 — the same idea as a rates table you would keep in a real warehouse.",
      "",
      "Only delivered orders are credited; the `WHERE` clause drops returned and cancelled ones. The query is one pass over the orders with a key lookup per shopper.",
    ].join("\n"),
  },

  {
    slug: "myntra-late-return-requests",
    title: "Myntra: Return Requests Raised After the Category's Window",
    difficulty: "EASY",
    topics: ["Joins", "Dates"],
    description: [
      "Each category has its own return window, counted in days from delivery; innerwear, for hygiene reasons, may only be returned on the day it arrives. The returns-policy team wants to see the requests that came in too late.",
      "",
      "A request is late when the number of days from `delivered_on` to `requested_on` is **greater than** the category's `return_window_days` — a request on the last day of the window is still on time. Return `return_id`, `category_name` and `days_after_delivery` for every late request, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Category",
        columns: [
          { name: "category_id", type: "int" },
          { name: "category_name", type: "varchar" },
          { name: "return_window_days", type: "int" },
        ],
        primaryKey: ["category_id"],
        note: "`return_window_days` is how many days after delivery a return may still be requested (0 = delivery day only).",
      },
      {
        name: "OrderItem",
        columns: [
          { name: "order_item_id", type: "int" },
          { name: "category_id", type: "int" },
          { name: "delivered_on", type: "date" },
        ],
        primaryKey: ["order_item_id"],
        note: "One row per delivered item.",
      },
      {
        name: "ReturnRequest",
        columns: [
          { name: "return_id", type: "int" },
          { name: "order_item_id", type: "int" },
          { name: "requested_on", type: "date" },
        ],
        primaryKey: ["return_id"],
        note: "One row per return request; `requested_on` is never before the delivery date.",
      },
    ],
    examples: [
      {
        Category: [
          [1, "Western Wear", 14],
          [2, "Footwear", 7],
          [3, "Innerwear", 0],
          [4, "Watches", 10],
        ],
        OrderItem: [
          [11, 1, "2024-03-01"],
          [12, 1, "2024-03-01"],
          [13, 2, "2024-03-05"],
          [14, 3, "2024-03-08"],
          [15, 3, "2024-03-08"],
          [16, 4, "2024-03-10"],
        ],
        ReturnRequest: [
          [1, 11, "2024-03-15"],
          [2, 12, "2024-03-16"],
          [3, 13, "2024-03-13"],
          [4, 14, "2024-03-08"],
          [5, 15, "2024-03-09"],
          [6, 16, "2024-03-12"],
        ],
      },
    ],
    gen: (rng) => {
      const windows = [0, 7, 10, 14, 30];
      const catNames = sample(rng, ["Western Wear", "Footwear", "Innerwear", "Watches", "Ethnic Wear", "Beauty"], ri(rng, 1, 4));
      const cats = catNames.map((nm, i) => ({ id: i + 1, nm, w: pick(rng, windows) }));
      const items = seq(11, ri(rng, 1, 12)).map((id) => ({ id, cat: pick(rng, cats), on: dateBetween(rng, "2024-03-01", "2024-04-30") }));
      const chosen = chance(rng, 0.05) ? [] : sample(rng, items, ri(rng, 1, items.length));
      const returns: Cell[][] = chosen.map((it, i) => {
        const w = it.cat.w;
        const days = chance(rng, 0.6) ? Math.max(0, pick(rng, [w - 1, w, w + 1, w + 2])) : ri(rng, 0, 35);
        return [i + 1, it.id, addDays(it.on, days)];
      });
      return {
        Category: cats.map((c) => [c.id, c.nm, c.w]),
        OrderItem: items.map((it) => [it.id, it.cat.id, it.on]),
        ReturnRequest: returns,
      };
    },
    solution: [
      "SELECT r.return_id, c.category_name, DATEDIFF(r.requested_on, i.delivered_on) AS days_after_delivery",
      "FROM ReturnRequest r",
      "JOIN OrderItem i ON i.order_item_id = r.order_item_id",
      "JOIN Category c ON c.category_id = i.category_id",
      "WHERE DATEDIFF(r.requested_on, i.delivered_on) > c.return_window_days",
    ].join("\n"),
    alternatives: [
      [
        "SELECT t.return_id, t.category_name, t.days_after_delivery",
        "FROM (",
        "  SELECT r.return_id, c.category_name, c.return_window_days,",
        "         TIMESTAMPDIFF(DAY, i.delivered_on, r.requested_on) AS days_after_delivery",
        "  FROM ReturnRequest r, OrderItem i, Category c",
        "  WHERE i.order_item_id = r.order_item_id AND c.category_id = i.category_id",
        ") t",
        "WHERE t.days_after_delivery > t.return_window_days",
      ].join("\n"),
    ],
    hints: [
      "The window is on the category, the delivery date on the item and the request date on the return — you need all three tables.",
      "`DATEDIFF(later, earlier)` counts the days between two dates.",
      "\"On the last day\" is on time, so the comparison is strict.",
    ],
    editorial: [
      "Three facts decide whether a request is late, and they live in three tables: the request date on `ReturnRequest`, the delivery date on `OrderItem`, and the window on `Category`. Two inner joins along the keys put them on one row; every request names an item and every item a category, so nothing is lost.",
      "",
      "`DATEDIFF(r.requested_on, i.delivered_on)` is the number of days since delivery — 0 for a request on the delivery day itself. The request is late when that number is strictly greater than the window, so a request exactly 14 days after delivery in a 14-day category is on time, and an innerwear request on the delivery day (0 > 0 is false) is on time while one the next day is not.",
      "",
      "The same expression is selected as `days_after_delivery`. The alternative computes it once with `TIMESTAMPDIFF(DAY, …)` in a derived table and filters on the alias outside, which avoids repeating the expression. Either way it is one pass over the requests with two key lookups each.",
    ].join("\n"),
  },

  {
    slug: "myntra-m-now-on-time-deliveries-by-store",
    title: "Myntra: M-Now Deliveries Inside the 30-Minute Promise by Store",
    difficulty: "EASY",
    topics: ["Aggregation", "Conditional Logic", "Dates"],
    description: [
      "M-Now promises fashion delivered fast from neighbourhood dark stores, and the ops team reviews each store's record against a 30-minute promise.",
      "",
      "Consider only orders that have been delivered (`delivered_at` is not NULL). For every dark store with at least one such order, return `store_name`, `delivered` (its delivered orders) and `on_time` (those delivered **at most 30 minutes** after `placed_at`). Stores with no delivered order do not appear. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "DarkStore",
        columns: [
          { name: "store_id", type: "int" },
          { name: "store_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["store_id"],
        note: "One row per quick-delivery dark store.",
      },
      {
        name: "MNowOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "placed_at", type: "datetime" },
          { name: "delivered_at", type: "datetime" },
        ],
        primaryKey: ["order_id"],
        note: "Times are to the whole minute. `delivered_at` is NULL while the order is still on its way or was cancelled.",
      },
    ],
    examples: [
      {
        DarkStore: [
          [1, "HSR Layout", "Bengaluru"],
          [2, "Andheri West", "Mumbai"],
          [3, "Sector 29", "Gurugram"],
        ],
        MNowOrder: [
          [1, 1, "2024-08-01 10:00:00", "2024-08-01 10:30:00"],
          [2, 1, "2024-08-01 11:00:00", "2024-08-01 11:31:00"],
          [3, 1, "2024-08-01 23:50:00", "2024-08-02 00:15:00"],
          [4, 2, "2024-08-01 12:00:00", null],
          [5, 2, "2024-08-01 12:10:00", "2024-08-01 12:52:00"],
          [6, 3, "2024-08-01 09:00:00", null],
        ],
      },
    ],
    gen: (rng) => {
      const storeNames = sample(rng, ["HSR Layout", "Andheri West", "Sector 29", "Koramangala", "Banjara Hills", "Viman Nagar", "Salt Lake"], ri(rng, 1, 4));
      const stores: Cell[][] = storeNames.map((nm, i) => [i + 1, nm, pick(rng, ["Bengaluru", "Mumbai", "Gurugram", "Hyderabad", "Pune", "Kolkata"])]);
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 18);
      const orders: Cell[][] = seq(1, m).map((id) => {
        const day = pick(rng, ["2024-08-01", "2024-08-02"]);
        const placed = ri(rng, 8 * 60, 23 * 60 + 50);
        const took = chance(rng, 0.5) ? pick(rng, [29, 30, 30, 31]) : ri(rng, 12, 50);
        return [id, ri(rng, 1, stores.length), at(day, placed), chance(rng, 0.15) ? null : at(day, placed + took)];
      });
      return { DarkStore: stores, MNowOrder: orders };
    },
    solution: [
      "SELECT d.store_name,",
      "       COUNT(*) AS delivered,",
      "       SUM(CASE WHEN TIMESTAMPDIFF(MINUTE, o.placed_at, o.delivered_at) <= 30 THEN 1 ELSE 0 END) AS on_time",
      "FROM DarkStore d",
      "JOIN MNowOrder o ON o.store_id = d.store_id",
      "WHERE o.delivered_at IS NOT NULL",
      "GROUP BY d.store_id, d.store_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT d.store_name, t.delivered, t.on_time",
        "FROM DarkStore d",
        "JOIN (SELECT store_id, COUNT(*) AS delivered,",
        "             COUNT(CASE WHEN delivered_at <= DATE_ADD(placed_at, INTERVAL 30 MINUTE) THEN 1 END) AS on_time",
        "      FROM MNowOrder WHERE delivered_at IS NOT NULL GROUP BY store_id) t ON t.store_id = d.store_id",
      ].join("\n"),
    ],
    hints: [
      "Drop the undelivered orders first — they are neither on time nor late.",
      "`TIMESTAMPDIFF(MINUTE, start, end)` gives the minutes between two times, across midnight too.",
      "Count a subset inside a group with `SUM(CASE WHEN … THEN 1 ELSE 0 END)`.",
    ],
    editorial: [
      "The answer is two counts per store, one of them conditional. Undelivered orders (`delivered_at` NULL) are removed in `WHERE`, so they count in neither column; after that, `COUNT(*)` per store is the delivered total, and a store whose orders were all undelivered has no rows left and drops out, as asked.",
      "",
      "The on-time count is **conditional aggregation**: `SUM(CASE WHEN … THEN 1 ELSE 0 END)` adds one for each order meeting the promise. The test is `TIMESTAMPDIFF(MINUTE, placed_at, delivered_at) <= 30`; working on full timestamps, it handles an order placed at 23:50 and delivered at 00:15 the next day as the 25 minutes it was, which comparing clock times alone would get wrong. Exactly 30 minutes is on time.",
      "",
      "The alternative aggregates the orders first in a derived table and compares `delivered_at` with `DATE_ADD(placed_at, INTERVAL 30 MINUTE)` instead of computing a difference, using `COUNT(CASE … THEN 1 END)` — `COUNT` ignores the NULL a `CASE` without `ELSE` returns. Both make one pass over the orders.",
    ].join("\n"),
  },

  // ──────────────────────────── MEDIUM ────────────────────────────
  {
    slug: "myntra-size-return-rate-by-article-and-size",
    title: "Myntra: Size-Related Return Rate by Article Type and Size",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "The size-chart team suspects that some sizes of some article types fit badly. They want the share of items in each size that came back **because of size**.",
      "",
      "For every combination of `article_type` (from `Style`) and `size` with **at least 3 items** sold, return `article_type`, `size`, `items` (items sold), `size_returns` (items with a return request whose `reason` is `size_too_small` or `size_too_large`) and `size_return_pct` = `100 * size_returns / items`, **rounded to 1 decimal place**. Returns for other reasons count as items but not as size returns. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Style",
        columns: [
          { name: "style_id", type: "int" },
          { name: "brand", type: "varchar" },
          { name: "article_type", type: "varchar" },
        ],
        primaryKey: ["style_id"],
        note: "One row per style.",
      },
      {
        name: "OrderItem",
        columns: [
          { name: "order_item_id", type: "int" },
          { name: "style_id", type: "int" },
          { name: "size", type: "varchar" },
        ],
        primaryKey: ["order_item_id"],
        note: "One row per item sold, in one size.",
      },
      {
        name: "ReturnRequest",
        columns: [
          { name: "return_id", type: "int" },
          { name: "order_item_id", type: "int" },
          { name: "reason", type: "varchar" },
        ],
        primaryKey: ["return_id"],
        note: "At most one request per item.",
      },
    ],
    examples: [
      {
        Style: [
          [1, "Roadster", "Jeans"],
          [2, "HRX", "T-shirt"],
          [3, "Sangria", "Jeans"],
        ],
        OrderItem: [
          [1, 1, "M"],
          [2, 3, "M"],
          [3, 1, "M"],
          [4, 1, "L"],
          [5, 3, "L"],
          [6, 2, "M"],
          [7, 2, "M"],
          [8, 2, "M"],
          [9, 2, "M"],
          [10, 2, "S"],
        ],
        ReturnRequest: [
          [1, 1, "size_too_small"],
          [2, 2, "damaged"],
          [3, 4, "size_too_large"],
          [4, 6, "size_too_large"],
          [5, 7, "size_too_small"],
          [6, 8, "colour_different"],
        ],
      },
    ],
    gen: (rng) => {
      const articles = sample(rng, ["Jeans", "T-shirt", "Kurta", "Dress"], ri(rng, 1, 3));
      const styles: Cell[][] = seq(1, ri(rng, 1, 5)).map((id) => [id, pick(rng, BRANDS), pick(rng, articles)]);
      const sizes = sample(rng, ["S", "M", "L", "XL"], ri(rng, 2, 3));
      const items: Cell[][] = seq(1, ri(rng, 3, 26)).map((id) => [id, ri(rng, 1, styles.length), pick(rng, sizes)]);
      const returns: Cell[][] = [];
      for (const it of items) {
        if (chance(rng, 0.45)) returns.push([returns.length + 1, it[0]!, chance(rng, 0.65) ? pick(rng, SIZE_REASONS) : pick(rng, RETURN_REASONS)]);
      }
      return { Style: styles, OrderItem: items, ReturnRequest: returns };
    },
    solution: [
      "SELECT s.article_type, oi.size,",
      "       COUNT(*) AS items,",
      "       SUM(CASE WHEN r.reason IN ('size_too_small', 'size_too_large') THEN 1 ELSE 0 END) AS size_returns,",
      "       ROUND(100 * SUM(CASE WHEN r.reason IN ('size_too_small', 'size_too_large') THEN 1 ELSE 0 END) / COUNT(*), 1) AS size_return_pct",
      "FROM OrderItem oi",
      "JOIN Style s ON s.style_id = oi.style_id",
      "LEFT JOIN ReturnRequest r ON r.order_item_id = oi.order_item_id",
      "GROUP BY s.article_type, oi.size",
      "HAVING COUNT(*) >= 3",
    ].join("\n"),
    alternatives: [
      [
        "SELECT article_type, size, COUNT(*) AS items, SUM(is_size) AS size_returns,",
        "       ROUND(100 * SUM(is_size) / COUNT(*), 1) AS size_return_pct",
        "FROM (",
        "  SELECT s.article_type, oi.size,",
        "         CASE WHEN EXISTS (SELECT 1 FROM ReturnRequest r WHERE r.order_item_id = oi.order_item_id",
        "                             AND r.reason IN ('size_too_small', 'size_too_large')) THEN 1 ELSE 0 END AS is_size",
        "  FROM OrderItem oi JOIN Style s ON s.style_id = oi.style_id",
        ") t",
        "GROUP BY article_type, size",
        "HAVING COUNT(*) >= 3",
      ].join("\n"),
    ],
    hints: [
      "Every item counts in the denominator, returned or not — so the returns must be joined without losing items.",
      "A LEFT JOIN to the returns keeps the kept items, with NULL in `reason`.",
      "Count the size returns with a `CASE` inside `SUM`, and filter small groups with `HAVING`.",
    ],
    editorial: [
      "The rate has every item sold in the denominator and only the size-related returns in the numerator, so the items must all survive the join. The article type comes from `Style` by an inner join (every item has a style), and the return requests are attached with a **LEFT JOIN**: a kept item comes through with a NULL `reason`. Because each item has at most one request, the join never duplicates an item.",
      "",
      "Grouping by `article_type` and `size` then gives `COUNT(*)` as items sold, and `SUM(CASE WHEN reason IN ('size_too_small', 'size_too_large') THEN 1 ELSE 0 END)` counts the size returns — a NULL reason or a `damaged` one adds 0. `HAVING COUNT(*) >= 3` drops thin groups after aggregation, which `WHERE` cannot do. The percentage is `100 * size_returns / items` with MySQL's exact division, rounded to one place.",
      "",
      "The alternative marks each item with a 0/1 flag from a correlated `EXISTS` and aggregates the flags; it would stay correct even if an item could have several requests. Both are one pass over the items with key lookups.",
    ].join("\n"),
  },

  {
    slug: "myntra-reordered-the-size-returned-as-too-small",
    title: "Myntra: Shoppers Who Reordered the Size They Returned as Too Small",
    difficulty: "MEDIUM",
    topics: ["Joins"],
    description: [
      "The fit-recommendation team wants to know whether its \"you returned this size as too small\" nudge would have helped: who sent back a size as too small and then bought **the same size again** of the same brand and article type?",
      "",
      "Find every item returned with `reason = 'size_too_small'` for which the same shopper later ordered an item of the **same `brand`, `article_type` and `size`**, with an `ordered_on` **strictly after** the returned item's `ordered_on`. Return the distinct combinations `user_id`, `brand`, `article_type`, `size`, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "OrderItem",
        columns: [
          { name: "order_item_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "brand", type: "varchar" },
          { name: "article_type", type: "varchar" },
          { name: "size", type: "varchar" },
          { name: "ordered_on", type: "date" },
        ],
        primaryKey: ["order_item_id"],
        note: "One row per item ordered.",
      },
      {
        name: "ReturnRequest",
        columns: [
          { name: "return_id", type: "int" },
          { name: "order_item_id", type: "int" },
          { name: "reason", type: "varchar" },
        ],
        primaryKey: ["return_id"],
        note: "One row per returned item, with the reason the shopper gave.",
      },
    ],
    examples: [
      {
        OrderItem: [
          [1, 1, "Roadster", "Jeans", "32", "2024-02-01"],
          [2, 1, "Roadster", "Jeans", "32", "2024-03-10"],
          [3, 1, "Roadster", "Jeans", "32", "2024-04-02"],
          [4, 2, "HRX", "T-shirt", "M", "2024-02-05"],
          [5, 2, "HRX", "T-shirt", "L", "2024-02-20"],
          [6, 3, "Anouk", "Kurta", "S", "2024-03-01"],
          [7, 3, "Anouk", "Kurta", "S", "2024-03-15"],
          [8, 4, "Roadster", "Jeans", "30", "2024-05-05"],
          [9, 4, "Roadster", "Jeans", "30", "2024-05-05"],
          [10, 2, "Roadster", "T-shirt", "M", "2024-03-01"],
        ],
        ReturnRequest: [
          [1, 1, "size_too_small"],
          [2, 4, "size_too_small"],
          [3, 6, "size_too_large"],
          [4, 8, "size_too_small"],
        ],
      },
    ],
    gen: (rng) => {
      const users = ri(rng, 1, 3);
      const brands = sample(rng, BRANDS, ri(rng, 1, 2));
      const sizeOf: Record<string, string[]> = { Jeans: ["30", "32", "34"], "T-shirt": ["M", "L"] };
      const n = ri(rng, 6, 20);
      const items: Cell[][] = seq(1, n).map((id) => {
        const art = pick(rng, ["Jeans", "T-shirt"]);
        return [id, ri(rng, 1, users), pick(rng, brands), art, pick(rng, sizeOf[art]!), dateBetween(rng, "2024-02-01", "2024-03-15")];
      });
      const returns: Cell[][] = [];
      for (const it of items) {
        if (chance(rng, 0.4)) returns.push([returns.length + 1, it[0]!, chance(rng, 0.65) ? "size_too_small" : pick(rng, RETURN_REASONS)]);
      }
      return { OrderItem: items, ReturnRequest: returns };
    },
    solution: [
      "SELECT DISTINCT a.user_id, a.brand, a.article_type, a.size",
      "FROM OrderItem a",
      "JOIN ReturnRequest r ON r.order_item_id = a.order_item_id AND r.reason = 'size_too_small'",
      "JOIN OrderItem b ON b.user_id = a.user_id",
      "               AND b.brand = a.brand",
      "               AND b.article_type = a.article_type",
      "               AND b.size = a.size",
      "               AND b.ordered_on > a.ordered_on",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.user_id, a.brand, a.article_type, a.size",
        "FROM OrderItem a",
        "WHERE a.order_item_id IN (SELECT order_item_id FROM ReturnRequest WHERE reason = 'size_too_small')",
        "  AND EXISTS (SELECT 1 FROM OrderItem b",
        "              WHERE b.user_id = a.user_id AND b.brand = a.brand AND b.article_type = a.article_type",
        "                AND b.size = a.size AND b.ordered_on > a.ordered_on)",
        "GROUP BY a.user_id, a.brand, a.article_type, a.size",
      ].join("\n"),
    ],
    hints: [
      "Start from the items returned as too small: join `OrderItem` to `ReturnRequest`.",
      "Join `OrderItem` to itself to find a second item of the same shopper, brand, article type and size.",
      "\"Later\" is a strict date comparison, and one shopper can match several times — remove duplicates.",
    ],
    editorial: [
      "Two items of the same shopper have to be compared, so `OrderItem` appears twice. Alias `a` is the returned item: joining it to `ReturnRequest` with `reason = 'size_too_small'` keeps only items sent back as too small. Alias `b` is the reorder: a **self join** on the same `user_id`, `brand`, `article_type` and `size`, with `b.ordered_on > a.ordered_on`.",
      "",
      "Each condition matters. Same-day items are not \"later\", so shopper 4's two identical jeans on one day do not count. A different size (shopper 2 going from M to L) is the nudge working, not failing. A return for being too large is a different story. And because one returned item can pair with several later orders, or one shopper can have several qualifying pairs, the raw join repeats combinations — `DISTINCT` collapses them to one row each.",
      "",
      "The alternative filters the returned items with `IN`, tests for a later reorder with a correlated `EXISTS`, and uses `GROUP BY` to make the rows distinct. With an index on `(user_id, brand, article_type, size)` both find each item's partners directly.",
    ].join("\n"),
  },

  {
    slug: "myntra-creator-store-commission-october-2024",
    title: "Myntra: Creator Store Commission for October 2024",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Dates"],
    description: [
      "Fashion creators run storefronts on the app and earn a commission on the orders that come through their links. Finance is preparing October's payout run, and every creator gets a line, even one who earned nothing.",
      "",
      "A creator earns `order_value * commission_pct / 100` on each order with `outcome = 'kept'` and an `order_date` in **October 2024**. Returned and cancelled orders earn nothing. For **every** creator return `handle`, `kept_orders` (their qualifying orders) and `payout` (the total, 0 when there are none), **ordered by `payout` descending, then `handle` ascending**.",
    ].join("\n"),
    tables: [
      {
        name: "Creator",
        columns: [
          { name: "creator_id", type: "int" },
          { name: "handle", type: "varchar" },
          { name: "commission_pct", type: "int" },
        ],
        primaryKey: ["creator_id"],
        note: "One row per creator; handles are unique. `commission_pct` is the creator's rate in percent.",
      },
      {
        name: "CreatorOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "creator_id", type: "int" },
          { name: "order_date", type: "date" },
          { name: "order_value", type: "int" },
          { name: "outcome", type: "enum", values: ["kept", "returned", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per order placed through a creator's store link.",
      },
    ],
    examples: [
      {
        Creator: [
          [1, "@styledbyriya", 8],
          [2, "@kabirfits", 10],
          [3, "@zarawears", 5],
          [4, "@meera.minimal", 12],
        ],
        CreatorOrder: [
          [1, 1, "2024-10-01", 2000, "kept"],
          [2, 1, "2024-10-31", 1500, "kept"],
          [3, 1, "2024-11-01", 3000, "kept"],
          [4, 2, "2024-10-15", 2800, "kept"],
          [5, 2, "2024-10-20", 5000, "returned"],
          [6, 3, "2024-09-30", 4000, "kept"],
          [7, 3, "2024-10-05", 2450, "cancelled"],
          [8, 4, "2024-10-12", 1150, "kept"],
        ],
      },
    ],
    gen: (rng) => {
      const handles = sample(rng, ["@styledbyriya", "@kabirfits", "@zarawears", "@meera.minimal", "@thearjunedit", "@ananya.ootd", "@rohanstreet"], ri(rng, 1, 5));
      const creators: Cell[][] = handles.map((h, i) => [i + 1, h, pick(rng, [5, 8, 10, 12, 15])]);
      const edges = ["2024-09-30", "2024-10-01", "2024-10-31", "2024-11-01"];
      const m = ri(rng, 0, 20);
      const orders: Cell[][] = seq(1, m).map((id) => [
        id,
        ri(rng, 1, creators.length),
        chance(rng, 0.25) ? pick(rng, edges) : dateBetween(rng, "2024-09-25", "2024-11-05"),
        roundTo(rng, 500, 6000, 50),
        pick(rng, ["kept", "kept", "kept", "returned", "cancelled"]),
      ]);
      return { Creator: creators, CreatorOrder: orders };
    },
    solution: [
      "SELECT c.handle,",
      "       COUNT(o.order_id) AS kept_orders,",
      "       COALESCE(SUM(o.order_value * c.commission_pct / 100), 0) AS payout",
      "FROM Creator c",
      "LEFT JOIN CreatorOrder o ON o.creator_id = c.creator_id",
      "                        AND o.outcome = 'kept'",
      "                        AND o.order_date BETWEEN '2024-10-01' AND '2024-10-31'",
      "GROUP BY c.creator_id, c.handle, c.commission_pct",
      "ORDER BY payout DESC, c.handle ASC",
    ].join("\n"),
    alternatives: [
      [
        "SELECT handle, kept_orders, kept_value * commission_pct / 100 AS payout",
        "FROM (",
        "  SELECT c.handle, c.commission_pct,",
        "         (SELECT COUNT(*) FROM CreatorOrder o WHERE o.creator_id = c.creator_id AND o.outcome = 'kept'",
        "            AND YEAR(o.order_date) = 2024 AND MONTH(o.order_date) = 10) AS kept_orders,",
        "         (SELECT COALESCE(SUM(o.order_value), 0) FROM CreatorOrder o WHERE o.creator_id = c.creator_id AND o.outcome = 'kept'",
        "            AND YEAR(o.order_date) = 2024 AND MONTH(o.order_date) = 10) AS kept_value",
        "  FROM Creator c",
        ") t",
        "ORDER BY payout DESC, handle",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Every creator must appear, so start from `Creator` and LEFT JOIN the orders.",
      "If the month and outcome tests go in `WHERE`, creators with nothing in October vanish — put them in `ON`.",
      "`SUM` over no rows is NULL; `COALESCE` it to 0. `COUNT(o.order_id)` counts only matched orders.",
    ],
    editorial: [
      "A payout run needs a line for **every** creator, so the query starts from `Creator` and LEFT JOINs the orders. The three conditions that decide which orders count — the creator, `outcome = 'kept'`, and an October 2024 date — all go into the `ON` clause. If the outcome or date test sat in `WHERE` instead, a creator whose only orders were returned or fell in September would lose their NULL-extended row and disappear from the run.",
      "",
      "After grouping per creator, `COUNT(o.order_id)` counts matched orders only (the NULL row of a creator with none counts 0), and `SUM(o.order_value * c.commission_pct / 100)` adds each order's commission; for a creator with no matches that sum is NULL, which `COALESCE` turns into 0. The date range is inclusive at both ends, so 1 and 31 October count while 30 September and 1 November do not.",
      "",
      "The result is sorted by payout, highest first, and two creators with the same payout by handle. The alternative computes the count and the kept value with two correlated subqueries and applies the rate once to the total — the same amount, since the rate is constant per creator.",
    ].join("\n"),
  },

  {
    slug: "myntra-eors-day-one-deep-markdowns",
    title: "Myntra: Styles Marked Down by at Least 40% for EORS Day One",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Dates", "Joins"],
    description: [
      "The pricing desk keeps a log of price changes; a price stays in force from its `effective_on` date until the style's next change. For the sale's launch banner they want the styles whose price on **2024-06-01**, the first day of the sale, is **at least 40% below** the price in force on **2024-05-31**.",
      "",
      "The price in force on a day is the row with the **latest `effective_on` on or before that day**. A style needs a price in force on both days to be considered. Return `style_id`, `style_name`, `price_before` (in force on 2024-05-31) and `price_on_sale` (in force on 2024-06-01) for every style where `price_on_sale` is at most 60% of `price_before`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Style",
        columns: [
          { name: "style_id", type: "int" },
          { name: "style_name", type: "varchar" },
        ],
        primaryKey: ["style_id"],
        note: "One row per style.",
      },
      {
        name: "StylePrice",
        columns: [
          { name: "style_id", type: "int" },
          { name: "effective_on", type: "date" },
          { name: "selling_price", type: "int" },
        ],
        primaryKey: ["style_id", "effective_on"],
        note: "One row per price change: from `effective_on` the style sells at `selling_price` rupees.",
      },
    ],
    examples: [
      {
        Style: [
          [1, "Roadster Slim Fit Jeans"],
          [2, "HRX Running T-shirt"],
          [3, "Anouk Printed Kurta"],
          [4, "Dressberry Wrap Dress"],
          [5, "Sangria Anarkali Kurta"],
        ],
        StylePrice: [
          [1, "2024-05-10", 2000],
          [1, "2024-06-01", 1200],
          [2, "2024-05-20", 1000],
          [2, "2024-05-31", 900],
          [2, "2024-06-01", 600],
          [3, "2024-05-25", 1500],
          [3, "2024-05-30", 800],
          [3, "2024-06-02", 500],
          [4, "2024-06-01", 999],
          [5, "2024-05-15", 2500],
          [5, "2024-06-01", 1250],
          [5, "2024-06-03", 2500],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 7);
      const styles: Cell[][] = seq(1, n).map((id) => [id, `${pick(rng, BRANDS)} ${pick(rng, ARTICLE_NAMES)}`]);
      const days = ["2024-05-10", "2024-05-20", "2024-05-25", "2024-05-31", "2024-06-01", "2024-06-02", "2024-06-05"];
      const prices: Cell[][] = [];
      for (const id of seq(1, n)) {
        const base = roundTo(rng, 800, 4000, 100);
        const picked = sample(rng, days, ri(rng, 1, 4));
        if (chance(rng, 0.7) && !picked.includes("2024-06-01")) picked.push("2024-06-01");
        if (chance(rng, 0.85) && !picked.some((d) => d <= "2024-05-31")) picked.push(pick(rng, ["2024-05-20", "2024-05-31"]));
        for (const d of picked) {
          const price = d >= "2024-06-01" ? Math.round(base * pick(rng, [0.5, 0.55, 0.6, 0.6, 0.65, 0.8, 1])) : base + pick(rng, [0, 0, -100, 100]);
          prices.push([id, d, price]);
        }
      }
      return { Style: styles, StylePrice: prices };
    },
    solution: [
      "WITH before_sale AS (",
      "  SELECT p.style_id, p.selling_price",
      "  FROM StylePrice p",
      "  WHERE p.effective_on = (SELECT MAX(q.effective_on) FROM StylePrice q",
      "                          WHERE q.style_id = p.style_id AND q.effective_on <= '2024-05-31')",
      "), on_sale AS (",
      "  SELECT p.style_id, p.selling_price",
      "  FROM StylePrice p",
      "  WHERE p.effective_on = (SELECT MAX(q.effective_on) FROM StylePrice q",
      "                          WHERE q.style_id = p.style_id AND q.effective_on <= '2024-06-01')",
      ")",
      "SELECT s.style_id, s.style_name, b.selling_price AS price_before, o.selling_price AS price_on_sale",
      "FROM Style s",
      "JOIN before_sale b ON b.style_id = s.style_id",
      "JOIN on_sale o ON o.style_id = s.style_id",
      "WHERE o.selling_price * 10 <= b.selling_price * 6",
    ].join("\n"),
    alternatives: [
      [
        "WITH b AS (",
        "  SELECT style_id, selling_price, ROW_NUMBER() OVER (PARTITION BY style_id ORDER BY effective_on DESC) AS rn",
        "  FROM StylePrice WHERE effective_on <= '2024-05-31'",
        "), o AS (",
        "  SELECT style_id, selling_price, ROW_NUMBER() OVER (PARTITION BY style_id ORDER BY effective_on DESC) AS rn",
        "  FROM StylePrice WHERE effective_on <= '2024-06-01'",
        ")",
        "SELECT s.style_id, s.style_name, b.selling_price AS price_before, o.selling_price AS price_on_sale",
        "FROM Style s JOIN b ON b.style_id = s.style_id AND b.rn = 1",
        "JOIN o ON o.style_id = s.style_id AND o.rn = 1",
        "WHERE o.selling_price <= 0.6 * b.selling_price",
      ].join("\n"),
    ],
    hints: [
      "The price on a day is not necessarily a row dated that day — it is the latest change on or before it.",
      "Find that row once for 31 May and once for 1 June, then put the two side by side.",
      "\"At least 40% off\" means the sale price is at most 60% of the old one; compare with whole numbers to avoid rounding.",
    ],
    editorial: [
      "A price log answers \"what was the price on day D?\" with the change that was most recent on D: the row with the latest `effective_on` that is not after D. Style 2 changed price on 20 May and again on 31 May, so on 31 May it sold at 900, not 1000 — comparing against the older price would wrongly put it in the banner.",
      "",
      "The solution finds that row twice, as two CTEs: for each style, the row whose `effective_on` equals the correlated `MAX(effective_on)` on or before the day. A style with no row on or before 31 May (style 4, launched on sale day) has no `before_sale` row, and the inner join drops it, as the statement requires. A change after 1 June (style 3's on 2 June) is ignored. Since `(style_id, effective_on)` is the key, each CTE has exactly one row per style.",
      "",
      "The markdown test `price_on_sale <= 0.6 * price_before` is written as `price_on_sale * 10 <= price_before * 6`, all integers, so a cut of exactly 40% (2000 → 1200) is kept with no floating-point doubt. The alternative ranks each style's rows newest first with `ROW_NUMBER()` under each cut-off and keeps rank 1.",
    ].join("\n"),
  },

  {
    slug: "myntra-wishlist-to-purchase-conversion-by-article",
    title: "Myntra: Wishlist-to-Purchase Conversion by Article Type",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation", "Joins"],
    description: [
      "The growth team wants to know which article types turn wishlist saves into sales.",
      "",
      "A wishlist entry **converts** when the same shopper has an order line of that same style with a `status` other than `cancelled` and an `ordered_on` **on or after** the entry's `added_on`. Several such lines still count as one conversion. For every `article_type` with at least one wishlist entry, return `article_type`, `wishlisted` (entries), `converted` (entries that converted) and `conversion_pct` = `100 * converted / wishlisted` **rounded to 1 decimal place**, ordered by `conversion_pct` descending, then `article_type` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Style",
        columns: [
          { name: "style_id", type: "int" },
          { name: "article_type", type: "varchar" },
        ],
        primaryKey: ["style_id"],
        note: "One row per style.",
      },
      {
        name: "Wishlist",
        columns: [
          { name: "user_id", type: "int" },
          { name: "style_id", type: "int" },
          { name: "added_on", type: "date" },
        ],
        primaryKey: ["user_id", "style_id"],
        note: "One row per style a shopper saved.",
      },
      {
        name: "OrderLine",
        columns: [
          { name: "order_line_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "style_id", type: "int" },
          { name: "ordered_on", type: "date" },
          { name: "status", type: "enum", values: ["delivered", "returned", "cancelled"] },
        ],
        primaryKey: ["order_line_id"],
        note: "One row per item bought.",
      },
    ],
    examples: [
      {
        Style: [
          [10, "Jeans"],
          [11, "Jeans"],
          [12, "Kurta"],
          [13, "Sneakers"],
          [14, "Kurta"],
        ],
        Wishlist: [
          [1, 10, "2024-04-01"],
          [2, 10, "2024-04-10"],
          [2, 11, "2024-04-12"],
          [3, 12, "2024-04-02"],
          [1, 14, "2024-04-03"],
          [4, 13, "2024-04-04"],
        ],
        OrderLine: [
          [1, 1, 10, "2024-04-05", "delivered"],
          [2, 1, 10, "2024-04-07", "delivered"],
          [3, 2, 10, "2024-04-09", "delivered"],
          [4, 2, 11, "2024-04-12", "returned"],
          [5, 3, 12, "2024-04-06", "cancelled"],
          [6, 1, 14, "2024-04-20", "delivered"],
          [7, 4, 12, "2024-04-21", "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      const arts = sample(rng, ["Jeans", "Kurta", "Sneakers", "Dress"], ri(rng, 2, 3));
      const styleIds = seq(10, 5);
      const styles: Cell[][] = styleIds.map((id) => [id, pick(rng, arts)]);
      const pairs: [number, number][] = [];
      for (const u of seq(1, ri(rng, 2, 5))) for (const s of styleIds) pairs.push([u, s]);
      const wish = sample(rng, pairs, ri(rng, 1, Math.min(15, pairs.length))).map(([u, s]) => ({ u, s, on: dateBetween(rng, "2024-04-01", "2024-04-20") }));
      const lines: Cell[][] = seq(1, ri(rng, 0, 18)).map((id) => {
        if (chance(rng, 0.6)) {
          const w = pick(rng, wish);
          return [id, w.u, w.s, addDays(w.on, ri(rng, -5, 10)), pick(rng, ["delivered", "delivered", "returned", "cancelled"])];
        }
        const [u, s] = pick(rng, pairs);
        return [id, u, s, dateBetween(rng, "2024-03-25", "2024-05-05"), pick(rng, ["delivered", "returned", "cancelled"])];
      });
      return { Style: styles, Wishlist: wish.map((w) => [w.u, w.s, w.on]), OrderLine: lines };
    },
    solution: [
      "SELECT s.article_type,",
      "       COUNT(*) AS wishlisted,",
      "       SUM(CASE WHEN EXISTS (SELECT 1 FROM OrderLine o",
      "                             WHERE o.user_id = w.user_id AND o.style_id = w.style_id",
      "                               AND o.status <> 'cancelled' AND o.ordered_on >= w.added_on)",
      "                THEN 1 ELSE 0 END) AS converted,",
      "       ROUND(100 * SUM(CASE WHEN EXISTS (SELECT 1 FROM OrderLine o",
      "                             WHERE o.user_id = w.user_id AND o.style_id = w.style_id",
      "                               AND o.status <> 'cancelled' AND o.ordered_on >= w.added_on)",
      "                THEN 1 ELSE 0 END) / COUNT(*), 1) AS conversion_pct",
      "FROM Wishlist w",
      "JOIN Style s ON s.style_id = w.style_id",
      "GROUP BY s.article_type",
      "ORDER BY conversion_pct DESC, s.article_type ASC",
    ].join("\n"),
    alternatives: [
      [
        "SELECT s.article_type, COUNT(*) AS wishlisted, COUNT(c.user_id) AS converted,",
        "       ROUND(100 * COUNT(c.user_id) / COUNT(*), 1) AS conversion_pct",
        "FROM Wishlist w",
        "JOIN Style s ON s.style_id = w.style_id",
        "LEFT JOIN (",
        "  SELECT DISTINCT w2.user_id, w2.style_id",
        "  FROM Wishlist w2",
        "  JOIN OrderLine o ON o.user_id = w2.user_id AND o.style_id = w2.style_id",
        "                  AND o.status <> 'cancelled' AND o.ordered_on >= w2.added_on",
        ") c ON c.user_id = w.user_id AND c.style_id = w.style_id",
        "GROUP BY s.article_type",
        "ORDER BY conversion_pct DESC, s.article_type",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Decide per wishlist entry whether it converted — a yes/no — before you count anything.",
      "Joining the order lines straight onto the wishlist would count a shopper who bought twice as two conversions.",
      "`EXISTS` gives one yes/no per entry; `SUM(CASE WHEN EXISTS (…) THEN 1 ELSE 0 END)` counts the yeses.",
    ],
    editorial: [
      "The unit being counted is the **wishlist entry**, and each entry either converted or did not. Joining `OrderLine` directly onto `Wishlist` would break that: shopper 1 bought style 10 twice, so the join would produce two rows for one entry and inflate both counts. The solution instead asks a yes/no question per entry with a correlated `EXISTS` — is there an order line of the same shopper and style, not cancelled, dated on or after the save? — and adds the yeses with `SUM(CASE … THEN 1 ELSE 0 END)`.",
      "",
      "The conditions are deliberate: an order placed before the save (shopper 2's style 10) is not a conversion of that save; a returned order still started as a sale and counts; a cancelled one does not. The entries are grouped by the style's article type, `COUNT(*)` gives the entries, and the percentage is rounded to one place, ordered highest first with ties broken by name.",
      "",
      "The alternative builds the set of converted (shopper, style) pairs once, with `DISTINCT` to collapse repeat purchases, and LEFT JOINs it: `COUNT(c.user_id)` counts the entries that found a partner. Both are linear in the tables with an index on `(user_id, style_id)`.",
    ].join("\n"),
  },

  {
    slug: "myntra-delivered-gmv-by-fiscal-quarter",
    title: "Myntra: Delivered GMV by Indian Fiscal Year and Quarter",
    difficulty: "MEDIUM",
    topics: ["Dates", "Aggregation", "Strings"],
    description: [
      "Finance reports on the Indian fiscal year, which runs from **1 April to 31 March**, and wants the board pack's sales table in those terms rather than by calendar year.",
      "",
      "Count only orders with `status = 'delivered'`. Label each order with its fiscal year as `'FY<start year>-<last two digits of the end year>'` — an order on 15 January 2025 belongs to `'FY2024-25'`, one on 1 April 2025 to `'FY2025-26'` — and its fiscal quarter `'Q1'` (April–June), `'Q2'` (July–September), `'Q3'` (October–December) or `'Q4'` (January–March). Return `fiscal_year`, `fiscal_quarter`, `orders` (delivered orders) and `gmv` (the sum of their `amount`) for every fiscal quarter with at least one delivered order, ordered by `fiscal_year`, then `fiscal_quarter`.",
    ].join("\n"),
    tables: [
      {
        name: "ShopOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "placed_on", type: "date" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["delivered", "returned", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per order; `amount` is what the shopper paid, in rupees. Returned and cancelled orders are not GMV.",
      },
    ],
    examples: [
      {
        ShopOrder: [
          [1, 11, "2024-03-31", 1800, "delivered"],
          [2, 12, "2024-04-01", 2500, "delivered"],
          [3, 13, "2024-06-30", 900, "delivered"],
          [4, 11, "2024-07-01", 1200, "returned"],
          [5, 14, "2024-12-31", 3100, "delivered"],
          [6, 12, "2025-01-01", 700, "delivered"],
          [7, 15, "2025-03-15", 1500, "cancelled"],
          [8, 13, "2025-03-31", 1100, "delivered"],
          [9, 14, "2025-04-01", 2000, "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      const edges = ["2023-03-31", "2023-04-01", "2023-12-31", "2024-01-01", "2024-03-31", "2024-04-01", "2024-06-30", "2024-07-01", "2024-09-30", "2024-10-01", "2025-03-31", "2025-04-01"];
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 1, 8),
        chance(rng, 0.35) ? pick(rng, edges) : dateBetween(rng, "2022-11-01", "2025-06-30"),
        roundTo(rng, 300, 4000, 100),
        pick(rng, ["delivered", "delivered", "delivered", "returned", "cancelled"]),
      ]);
      return { ShopOrder: rows };
    },
    solution: [
      "SELECT CONCAT('FY', fy, '-', LPAD((fy + 1) MOD 100, 2, '0')) AS fiscal_year,",
      "       CONCAT('Q', fq) AS fiscal_quarter,",
      "       COUNT(*) AS orders,",
      "       SUM(amount) AS gmv",
      "FROM (",
      "  SELECT amount,",
      "         CASE WHEN MONTH(placed_on) >= 4 THEN YEAR(placed_on) ELSE YEAR(placed_on) - 1 END AS fy,",
      "         CASE WHEN MONTH(placed_on) BETWEEN 4 AND 6 THEN 1",
      "              WHEN MONTH(placed_on) BETWEEN 7 AND 9 THEN 2",
      "              WHEN MONTH(placed_on) BETWEEN 10 AND 12 THEN 3",
      "              ELSE 4 END AS fq",
      "  FROM ShopOrder",
      "  WHERE status = 'delivered'",
      ") t",
      "GROUP BY fy, fq",
      "ORDER BY fiscal_year, fiscal_quarter",
    ].join("\n"),
    alternatives: [
      [
        "WITH shifted AS (",
        "  SELECT amount, DATE_SUB(placed_on, INTERVAL 3 MONTH) AS d",
        "  FROM ShopOrder",
        "  WHERE status = 'delivered'",
        "), labelled AS (",
        "  SELECT amount,",
        "         CONCAT('FY', YEAR(d), '-', RIGHT(CONCAT(YEAR(d) + 1), 2)) AS fiscal_year,",
        "         CONCAT('Q', QUARTER(d)) AS fiscal_quarter",
        "  FROM shifted",
        ")",
        "SELECT fiscal_year, fiscal_quarter, COUNT(*) AS orders, SUM(amount) AS gmv",
        "FROM labelled",
        "GROUP BY fiscal_year, fiscal_quarter",
        "ORDER BY fiscal_year, fiscal_quarter",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "January to March belong to the fiscal year that started the April before, so their fiscal year is the calendar year minus one.",
      "The quarter is a fixed mapping of the month: April–June is Q1, January–March is Q4.",
      "Group by the fiscal year and quarter you computed, not by the calendar year.",
      "Moving every date back three months turns April into January — after that, the calendar year and `QUARTER()` are the fiscal ones.",
    ],
    editorial: [
      "Every date maps to exactly one fiscal year and quarter, so the task is a relabelling followed by a plain `GROUP BY`. The fiscal year starts in April: a date in April–December belongs to the fiscal year starting that calendar year, and a date in January–March to the one that started the year before. That is the `CASE` on `MONTH(placed_on) >= 4`. The quarter is a second `CASE` over month ranges — April–June Q1 through January–March Q4. The label then joins the start year with the last two digits of the next year, padded so FY2099-00 would still read correctly.",
      "",
      "The boundaries are where mistakes happen, and the example sits on them: 31 March 2024 is Q4 of FY2023-24, the next day is Q1 of FY2024-25; 31 December and 1 January are Q3 and Q4 of the **same** fiscal year; 31 March 2025 closes FY2024-25. Returned and cancelled orders are filtered before grouping, so the returned July order leaves FY2024-25 with no Q2 row at all.",
      "",
      "The alternative uses a neat shift: `DATE_SUB(placed_on, INTERVAL 3 MONTH)` moves April to January and March to December, after which `YEAR()` is the fiscal start year and `QUARTER()` is the fiscal quarter. Both are one pass over the orders and one grouping; since the labels are fixed-width text, sorting them as strings is chronological.",
    ].join("\n"),
  },

  {
    slug: "myntra-jeans-buyers-whose-waist-size-changed",
    title: "Myntra: Jeans Buyers Whose Waist Size Changed Between Orders",
    difficulty: "MEDIUM",
    topics: ["Window Functions"],
    description: [
      "The size-recommendation model pre-selects a shopper's usual jeans size. To measure how often that guess would be stale, the data-science team wants every point where a shopper's waist size changed from one jeans purchase to their next.",
      "",
      "Look only at items with `article_type = 'Jeans'`. Take each shopper's jeans items in order of `ordered_on`, then `order_item_id` for items ordered the same day. Return `user_id`, `order_item_id`, `previous_size` (the size of the shopper's previous jeans item) and `new_size` (this item's size) for every item whose size **differs** from the previous one. A shopper's first jeans item is never returned. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "OrderItem",
        columns: [
          { name: "order_item_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "article_type", type: "varchar" },
          { name: "size", type: "varchar" },
          { name: "ordered_on", type: "date" },
        ],
        primaryKey: ["order_item_id"],
        note: "One row per item ordered. For jeans, `size` is the waist in inches, such as `32`.",
      },
    ],
    examples: [
      {
        OrderItem: [
          [1, 1, "Jeans", "32", "2024-01-10"],
          [2, 1, "T-shirt", "L", "2024-02-01"],
          [3, 1, "Jeans", "32", "2024-03-05"],
          [4, 1, "Jeans", "34", "2024-06-20"],
          [5, 2, "Jeans", "30", "2024-02-14"],
          [6, 2, "Jeans", "28", "2024-02-14"],
          [7, 2, "T-shirt", "M", "2024-03-01"],
          [8, 2, "Jeans", "30", "2024-04-01"],
          [9, 3, "Jeans", "36", "2024-05-05"],
        ],
      },
    ],
    gen: (rng) => {
      const users = ri(rng, 1, 4);
      const n = ri(rng, 2, 20);
      const last: Record<number, string> = {};
      const rows: Cell[][] = seq(1, n).map((id) => {
        const u = ri(rng, 1, users);
        if (chance(rng, 0.25)) return [id, u, pick(rng, ["T-shirt", "Kurta"]), pick(rng, ["M", "L", "32"]), dateBetween(rng, "2024-01-01", "2024-06-30")];
        const size = last[u] && chance(rng, 0.5) ? last[u]! : pick(rng, ["28", "30", "32", "34"]);
        last[u] = size;
        return [id, u, "Jeans", size, chance(rng, 0.2) ? "2024-03-01" : dateBetween(rng, "2024-01-01", "2024-06-30")];
      });
      return { OrderItem: rows };
    },
    solution: [
      "WITH jeans AS (",
      "  SELECT user_id, order_item_id, size,",
      "         LAG(size) OVER (PARTITION BY user_id ORDER BY ordered_on, order_item_id) AS previous_size",
      "  FROM OrderItem",
      "  WHERE article_type = 'Jeans'",
      ")",
      "SELECT user_id, order_item_id, previous_size, size AS new_size",
      "FROM jeans",
      "WHERE previous_size IS NOT NULL AND previous_size <> size",
    ].join("\n"),
    alternatives: [
      [
        "SELECT user_id, order_item_id, previous_size, new_size",
        "FROM (",
        "  SELECT o.user_id, o.order_item_id, o.size AS new_size,",
        "         (SELECT p.size FROM OrderItem p",
        "          WHERE p.user_id = o.user_id AND p.article_type = 'Jeans'",
        "            AND (p.ordered_on < o.ordered_on OR (p.ordered_on = o.ordered_on AND p.order_item_id < o.order_item_id))",
        "          ORDER BY p.ordered_on DESC, p.order_item_id DESC",
        "          LIMIT 1) AS previous_size",
        "  FROM OrderItem o",
        "  WHERE o.article_type = 'Jeans'",
        ") t",
        "WHERE previous_size <> new_size",
      ].join("\n"),
    ],
    hints: [
      "Filter to jeans before you look at \"the previous item\" — a T-shirt in between must not count.",
      "`LAG(size)` over each shopper's items reads the size of the row before.",
      "The first item has no previous size; NULL compared with anything is not \"different\", but say so explicitly.",
    ],
    editorial: [
      "\"The previous jeans item\" is a question about row order within a shopper, which is what `LAG` answers. Filtering to jeans **first** matters: shopper 1 bought a T-shirt in size L between two pairs of 32-inch jeans, and if that row stayed in, the second pair would wrongly look like a change from L to 32.",
      "",
      "`LAG(size) OVER (PARTITION BY user_id ORDER BY ordered_on, order_item_id)` gives every jeans item the size of the same shopper's previous jeans item. The `order_item_id` tie-breaker fixes the order of two items bought on the same day — shopper 2 bought a 30 and a 28 together, and the rule in the statement makes that a change from 30 to 28. Then the outer query keeps the rows whose sizes differ. A shopper's first item has a NULL previous size; `previous_size <> size` is NULL there and filters it out anyway, but stating `IS NOT NULL` makes the intent clear.",
      "",
      "The alternative finds the previous item with a correlated subquery that sorts the shopper's earlier jeans newest first and takes one. It reads the same, but runs a subquery per item; the window version sorts once.",
    ].join("\n"),
  },

  {
    slug: "myntra-size-exchanges-blocked-by-stock-per-brand",
    title: "Myntra: Size Exchanges Blocked by an Unavailable Size, per Brand",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "A shopper who asks to exchange an item for another size can only get one if that size of the same style is in stock; otherwise the exchange turns into a refund, and the sale is usually lost. Brand managers want to see how often that happens to their brand.",
      "",
      "An exchange request is **blocked** when the style has no SKU in the requested `to_size`, or has one whose `stock` is 0. For every brand with at least one exchange request, return `brand`, `exchanges` (its requests) and `blocked` (how many of them are blocked), **ordered by `blocked` descending, then `brand` ascending**.",
    ].join("\n"),
    tables: [
      {
        name: "Style",
        columns: [
          { name: "style_id", type: "int" },
          { name: "brand", type: "varchar" },
        ],
        primaryKey: ["style_id"],
        note: "One row per style; a brand has many styles.",
      },
      {
        name: "Sku",
        columns: [
          { name: "style_id", type: "int" },
          { name: "size", type: "varchar" },
          { name: "stock", type: "int" },
        ],
        primaryKey: ["style_id", "size"],
        note: "One row per size a style is made in, with the units in stock now. A size the style is not made in has no row.",
      },
      {
        name: "SizeExchange",
        columns: [
          { name: "exchange_id", type: "int" },
          { name: "style_id", type: "int" },
          { name: "from_size", type: "varchar" },
          { name: "to_size", type: "varchar" },
          { name: "requested_on", type: "date" },
        ],
        primaryKey: ["exchange_id"],
        note: "One row per open exchange request: the shopper has `from_size` and wants `to_size` of the same style.",
      },
    ],
    examples: [
      {
        Style: [
          [1, "Roadster"],
          [2, "Roadster"],
          [3, "HRX"],
          [4, "Anouk"],
          [5, "Sangria"],
        ],
        Sku: [
          [1, "M", 4],
          [1, "L", 0],
          [2, "32", 3],
          [3, "S", 2],
          [3, "M", 1],
          [4, "XL", 0],
          [4, "L", 6],
        ],
        SizeExchange: [
          [1, 1, "S", "M", "2024-06-03"],
          [2, 1, "M", "L", "2024-06-04"],
          [3, 2, "30", "34", "2024-06-04"],
          [4, 3, "M", "S", "2024-06-05"],
          [5, 3, "S", "M", "2024-06-05"],
          [6, 4, "L", "XL", "2024-06-06"],
        ],
      },
    ],
    gen: (rng) => {
      const brands = sample(rng, BRANDS, ri(rng, 1, 4));
      const n = ri(rng, 1, 6);
      const styles: Cell[][] = seq(1, n).map((id) => [id, pick(rng, brands)]);
      const sizes = ["S", "M", "L", "XL"];
      const skus: Cell[][] = [];
      for (const id of seq(1, n)) for (const sz of sample(rng, sizes, ri(rng, 1, 4))) skus.push([id, sz, pick(rng, [0, 0, 1, 3, 5])]);
      const exchanges: Cell[][] = seq(1, chance(rng, 0.05) ? 0 : ri(rng, 1, 15)).map((id) => {
        const [from, to] = sample(rng, sizes, 2);
        return [id, ri(rng, 1, n), from!, to!, dateBetween(rng, "2024-06-01", "2024-06-15")];
      });
      return { Style: styles, Sku: skus, SizeExchange: exchanges };
    },
    solution: [
      "SELECT s.brand,",
      "       COUNT(*) AS exchanges,",
      "       SUM(CASE WHEN k.stock IS NULL OR k.stock = 0 THEN 1 ELSE 0 END) AS blocked",
      "FROM SizeExchange e",
      "JOIN Style s ON s.style_id = e.style_id",
      "LEFT JOIN Sku k ON k.style_id = e.style_id AND k.size = e.to_size",
      "GROUP BY s.brand",
      "ORDER BY blocked DESC, s.brand ASC",
    ].join("\n"),
    alternatives: [
      [
        "SELECT s.brand, COUNT(*) AS exchanges,",
        "       SUM(IF(NOT EXISTS (SELECT 1 FROM Sku k WHERE k.style_id = e.style_id AND k.size = e.to_size AND k.stock > 0), 1, 0)) AS blocked",
        "FROM SizeExchange e, Style s",
        "WHERE s.style_id = e.style_id",
        "GROUP BY s.brand",
        "ORDER BY blocked DESC, s.brand",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The size to look up is the one the shopper wants — `to_size` — of the same style, so the match is on two columns.",
      "A size the style is not made in has no row at all; an inner join would silently drop those requests.",
      "With a LEFT JOIN, a missing SKU shows up as NULL stock — blocked, just like stock 0.",
      "Count the blocked ones with a `CASE` inside `SUM`.",
    ],
    editorial: [
      "Each exchange request has to be checked against one SKU: the same style in the requested `to_size`. That is a join on two columns, `k.style_id = e.style_id AND k.size = e.to_size`, and it must be a **LEFT JOIN**, because a request for a size the style is not made in (style 2 in 34) has no SKU row at all. An inner join would throw that request away and undercount both columns; with the LEFT JOIN it stays, with NULL stock.",
      "",
      "A request is blocked in two situations — no SKU (`stock IS NULL`) or an empty one (`stock = 0`) — and `SUM(CASE WHEN … THEN 1 ELSE 0 END)` counts both, while `COUNT(*)` counts every request. Because `(style_id, size)` is the key of `Sku`, the join never duplicates a request. The brand comes from `Style` by an inner join, and grouping by brand adds up across its styles; a brand with no requests forms no group, as asked.",
      "",
      "The order is most blocked first, then brand name. The alternative asks the question the other way round — is there an SKU of that size with stock above 0? — using `NOT EXISTS` inside `IF`, which covers both the missing and the empty case in one test. Both read each request once with a key lookup into `Sku`.",
    ].join("\n"),
  },

  {
    slug: "myntra-monthly-net-revenue-after-refunds-2024",
    title: "Myntra: Monthly Net Revenue After Refunds in 2024",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Dates", "Joins"],
    description: [
      "Finance books an order's refunds against the month the order was placed, not the month the money went back, so a month's net figure stays tied to the sales it came from. An order can be refunded in several parts.",
      "",
      "For each month of **2024** with at least one order whose `status` is `delivered`, return `order_month` (as `'YYYY-MM'`), `gross` (the total `order_value` of delivered orders placed that month), `refunds` (the total of all refunds on those orders, whenever they were made; 0 if none) and `net` = `gross - refunds`. Order the rows by `order_month`.",
    ].join("\n"),
    tables: [
      {
        name: "ShopOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "placed_on", type: "date" },
          { name: "order_value", type: "int" },
          { name: "status", type: "enum", values: ["delivered", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per order.",
      },
      {
        name: "Refund",
        columns: [
          { name: "refund_id", type: "int" },
          { name: "order_id", type: "int" },
          { name: "refunded_on", type: "date" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["refund_id"],
        note: "One row per refund payment; an order may have several (one per returned item).",
      },
    ],
    examples: [
      {
        ShopOrder: [
          [1, "2024-01-10", 3000, "delivered"],
          [2, "2024-01-25", 2000, "delivered"],
          [3, "2024-01-28", 1500, "cancelled"],
          [4, "2024-02-03", 4000, "delivered"],
          [5, "2023-12-31", 2500, "delivered"],
          [6, "2024-03-15", 1000, "delivered"],
        ],
        Refund: [
          [1, 1, "2024-01-20", 1000],
          [2, 1, "2024-02-02", 500],
          [3, 4, "2024-02-10", 4000],
          [4, 5, "2024-01-05", 2500],
        ],
      },
    ],
    gen: (rng) => {
      const edges = ["2023-12-31", "2024-01-01", "2024-12-31", "2025-01-01"];
      const orders: Cell[][] = seq(1, ri(rng, 1, 20)).map((id) => [
        id,
        chance(rng, 0.15) ? pick(rng, edges) : dateBetween(rng, "2024-01-01", "2024-06-30"),
        roundTo(rng, 500, 5000, 100),
        chance(rng, 0.8) ? "delivered" : "cancelled",
      ]);
      const refunds: Cell[][] = [];
      for (const o of orders) {
        if (o[3] !== "delivered" || !chance(rng, 0.4)) continue;
        for (let k = ri(rng, 1, 2); k > 0; k--) {
          refunds.push([refunds.length + 1, o[0]!, addDays(o[1] as string, ri(rng, 1, 40)), roundTo(rng, 100, Math.max(100, (o[2] as number) / 2), 100)]);
        }
      }
      return { ShopOrder: orders, Refund: refunds };
    },
    solution: [
      "WITH per_order AS (",
      "  SELECT order_id, SUM(amount) AS refunded",
      "  FROM Refund",
      "  GROUP BY order_id",
      ")",
      "SELECT DATE_FORMAT(o.placed_on, '%Y-%m') AS order_month,",
      "       SUM(o.order_value) AS gross,",
      "       COALESCE(SUM(p.refunded), 0) AS refunds,",
      "       SUM(o.order_value) - COALESCE(SUM(p.refunded), 0) AS net",
      "FROM ShopOrder o",
      "LEFT JOIN per_order p ON p.order_id = o.order_id",
      "WHERE o.status = 'delivered' AND o.placed_on >= '2024-01-01' AND o.placed_on < '2025-01-01'",
      "GROUP BY order_month",
      "ORDER BY order_month",
    ].join("\n"),
    alternatives: [
      [
        "SELECT order_month, SUM(order_value) AS gross, SUM(refunded) AS refunds, SUM(order_value) - SUM(refunded) AS net",
        "FROM (",
        "  SELECT LEFT(o.placed_on, 7) AS order_month, o.order_value,",
        "         (SELECT COALESCE(SUM(r.amount), 0) FROM Refund r WHERE r.order_id = o.order_id) AS refunded",
        "  FROM ShopOrder o",
        "  WHERE o.status = 'delivered' AND YEAR(o.placed_on) = 2024",
        ") t",
        "GROUP BY order_month",
        "ORDER BY order_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "If you join orders straight to refunds, an order with two refunds is counted twice in `gross`.",
      "Total the refunds per order first, then join that one row per order.",
      "The month comes from `placed_on`, never from `refunded_on`.",
    ],
    editorial: [
      "The trap is **join fan-out**. Order 1 was refunded in two parts; joined straight to `Refund` it becomes two rows, and `SUM(order_value)` would count its ₹3000 twice. The fix is to bring the refunds down to one row per order before the join: the `per_order` CTE sums `amount` by `order_id`, and that is LEFT JOINed so orders without refunds stay in with a NULL.",
      "",
      "Then the delivered 2024 orders are grouped by `DATE_FORMAT(placed_on, '%Y-%m')`. Gross is the sum of order values; refunds is the sum of the per-order refund totals, wrapped in `COALESCE` so a month with no refunds shows 0 rather than NULL (which would also make `net` NULL). The month is always the order's: order 1's February refund lands in January, and order 5's refund in January 2024 belongs to a December 2023 order and is outside the report.",
      "",
      "The alternative puts each order's refund total in a correlated subquery inside a derived table — also one value per order, so no fan-out — and takes the month with `LEFT(placed_on, 7)`. Both read each table once with an index on `Refund(order_id)`.",
    ].join("\n"),
  },

  {
    slug: "myntra-styles-most-shoppers-say-run-small",
    title: "Myntra: Styles Most Shoppers Say Run Small",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation", "Conditional Logic"],
    description: [
      "After delivery, shoppers rate how a style fits, and they can change their answer later. The size-chart team wants the styles where most shoppers say it runs small, to add a \"size up\" note.",
      "",
      "Only each shopper's **latest** verdict on a style counts — the one with the highest `feedback_id` for that shopper and style. For every style with **at least 4** such verdicts, where **more than half** of them are `runs_small`, return `style_name`, `brand`, `feedbacks` (the number of latest verdicts) and `runs_small` (how many of them are `runs_small`). Order by `runs_small` descending, then by `style_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Style",
        columns: [
          { name: "style_id", type: "int" },
          { name: "style_name", type: "varchar" },
          { name: "brand", type: "varchar" },
        ],
        primaryKey: ["style_id"],
        note: "One row per style.",
      },
      {
        name: "FitFeedback",
        columns: [
          { name: "feedback_id", type: "int" },
          { name: "style_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "verdict", type: "enum", values: ["runs_small", "true_to_size", "runs_large"] },
        ],
        primaryKey: ["feedback_id"],
        note: "One row per fit answer; a higher `feedback_id` is a later answer.",
      },
    ],
    examples: [
      {
        Style: [
          [1, "Roadster Slim Fit Jeans", "Roadster"],
          [2, "HRX Running T-shirt", "HRX"],
          [3, "Anouk Printed Kurta", "Anouk"],
        ],
        FitFeedback: [
          [1, 1, 1, "runs_small"],
          [2, 1, 2, "runs_small"],
          [3, 1, 3, "true_to_size"],
          [4, 1, 4, "runs_small"],
          [5, 1, 5, "runs_large"],
          [6, 2, 1, "runs_small"],
          [7, 2, 2, "runs_small"],
          [8, 2, 3, "true_to_size"],
          [9, 2, 4, "true_to_size"],
          [10, 2, 3, "runs_small"],
          [11, 3, 1, "runs_small"],
          [12, 3, 1, "runs_small"],
          [13, 3, 2, "runs_small"],
          [14, 3, 3, "runs_small"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 4);
      const styles: Cell[][] = seq(1, n).map((id) => {
        const brand = pick(rng, BRANDS);
        return [id, `${brand} ${pick(rng, ARTICLE_NAMES)}`, brand];
      });
      const m = chance(rng, 0.05) ? 0 : ri(rng, 6, 30);
      const lean = seq(1, n).map(() => pick(rng, [0.35, 0.55, 0.7]));
      const rows: Cell[][] = seq(1, m).map((id) => {
        const s = ri(rng, 1, n);
        return [id, s, ri(rng, 1, 7), chance(rng, lean[s - 1]!) ? "runs_small" : pick(rng, ["true_to_size", "true_to_size", "runs_large"])];
      });
      return { Style: styles, FitFeedback: rows };
    },
    solution: [
      "WITH latest AS (",
      "  SELECT f.style_id, f.verdict",
      "  FROM FitFeedback f",
      "  WHERE f.feedback_id = (SELECT MAX(g.feedback_id) FROM FitFeedback g",
      "                         WHERE g.style_id = f.style_id AND g.user_id = f.user_id)",
      ")",
      "SELECT s.style_name, s.brand,",
      "       COUNT(*) AS feedbacks,",
      "       SUM(CASE WHEN l.verdict = 'runs_small' THEN 1 ELSE 0 END) AS runs_small",
      "FROM Style s",
      "JOIN latest l ON l.style_id = s.style_id",
      "GROUP BY s.style_id, s.style_name, s.brand",
      "HAVING COUNT(*) >= 4 AND 2 * SUM(CASE WHEN l.verdict = 'runs_small' THEN 1 ELSE 0 END) > COUNT(*)",
      "ORDER BY runs_small DESC, s.style_id ASC",
    ].join("\n"),
    alternatives: [
      [
        "WITH ranked AS (",
        "  SELECT style_id, verdict,",
        "         ROW_NUMBER() OVER (PARTITION BY style_id, user_id ORDER BY feedback_id DESC) AS rn",
        "  FROM FitFeedback",
        "), counts AS (",
        "  SELECT style_id, COUNT(*) AS feedbacks, SUM(IF(verdict = 'runs_small', 1, 0)) AS small",
        "  FROM ranked WHERE rn = 1 GROUP BY style_id",
        ")",
        "SELECT s.style_name, s.brand, c.feedbacks, c.small AS runs_small",
        "FROM counts c JOIN Style s ON s.style_id = c.style_id",
        "WHERE c.feedbacks >= 4 AND c.small > c.feedbacks / 2",
        "ORDER BY c.small DESC, c.style_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First reduce the feedback to one row per (shopper, style): the latest.",
      "\"More than half\" is `runs_small * 2 > total` — no division needed.",
      "Both thresholds are about groups, so they belong in `HAVING`.",
    ],
    editorial: [
      "Counting the raw table would let one shopper vote several times. Style 3 has four `runs_small` rows, but two come from shopper 1, so it really has three voters and misses the threshold of four; style 2 has two small answers out of four on first reading, but shopper 3 later changed to `runs_small`, which makes it three of four.",
      "",
      "So the first step keeps each shopper's latest answer per style: the row whose `feedback_id` equals the correlated `MAX(feedback_id)` for the same style and shopper. The remaining rows are joined to `Style` and grouped per style; `COUNT(*)` is the number of voters and `SUM(CASE WHEN verdict = 'runs_small' THEN 1 ELSE 0 END)` the small votes. Both conditions are about whole groups, so they go in `HAVING`: at least four voters, and `2 * small > total`, which is \"more than half\" without division (exactly half does not qualify).",
      "",
      "The order is small votes descending, then `style_id`, so equal counts come out in a fixed order. The alternative picks the latest answer with `ROW_NUMBER()` partitioned by style and shopper, newest first, and filters the counts in an outer query — the same result, with one sort instead of a subquery per row.",
    ].join("\n"),
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "myntra-brand-share-of-category-eors-revenue",
    title: "Myntra: Each Brand's Share of Its Category in the EORS",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins", "Aggregation"],
    description: [
      "After the End of Reason Sale, each category manager gets a page showing how the category's revenue split across its brands, and the head of merchandising wants to see how big each category was within the whole sale.",
      "",
      "Revenue is the sum of `amount` over order lines with `status = 'delivered'`; a style's category and brand come from `Style`. For every (category, brand) pair with revenue **above 0**, return `category`, `brand`, `revenue`, `pct_of_category` — the pair's revenue as a percentage of its category's revenue — and `category_pct_of_sale` — the whole category's revenue as a percentage of all delivered revenue in the sale (the same value on every row of a category). Round both percentages to **2 decimal places**. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Style",
        columns: [
          { name: "style_id", type: "int" },
          { name: "brand", type: "varchar" },
          { name: "category", type: "varchar" },
        ],
        primaryKey: ["style_id"],
        note: "One row per style in the sale catalogue.",
      },
      {
        name: "SaleLine",
        columns: [
          { name: "line_id", type: "int" },
          { name: "style_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["delivered", "returned", "cancelled"] },
        ],
        primaryKey: ["line_id"],
        note: "One row per item sold during the sale, in rupees. Only delivered lines are revenue.",
      },
    ],
    examples: [
      {
        Style: [
          [1, "Roadster", "Men Topwear"],
          [2, "Roadster", "Men Topwear"],
          [3, "HRX", "Men Topwear"],
          [4, "Anouk", "Ethnic Wear"],
          [5, "Sangria", "Ethnic Wear"],
          [6, "HRX", "Footwear"],
          [7, "Roadster", "Footwear"],
        ],
        SaleLine: [
          [1, 1, 1200, "delivered"],
          [2, 2, 1800, "delivered"],
          [3, 3, 1000, "delivered"],
          [4, 3, 900, "returned"],
          [5, 4, 2500, "delivered"],
          [6, 5, 1500, "delivered"],
          [7, 5, 700, "cancelled"],
          [8, 6, 2000, "delivered"],
          [9, 7, 600, "returned"],
        ],
      },
    ],
    gen: (rng) => {
      const brands = sample(rng, BRANDS, ri(rng, 1, 4));
      const cats = sample(rng, ["Men Topwear", "Ethnic Wear", "Footwear", "Western Wear", "Bags"], ri(rng, 1, 3));
      const styles: Cell[][] = seq(1, ri(rng, 1, 10)).map((id) => [id, pick(rng, brands), pick(rng, cats)]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      const lines: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 1, styles.length),
        pick(rng, [500, 1000, 1500, 2000, 2500, 4000, 5000]),
        pick(rng, ["delivered", "delivered", "delivered", "returned", "cancelled"]),
      ]);
      return { Style: styles, SaleLine: lines };
    },
    solution: [
      "WITH pair AS (",
      "  SELECT s.category, s.brand, SUM(l.amount) AS revenue",
      "  FROM SaleLine l",
      "  JOIN Style s ON s.style_id = l.style_id",
      "  WHERE l.status = 'delivered'",
      "  GROUP BY s.category, s.brand",
      ")",
      "SELECT category, brand, revenue,",
      "       ROUND(100 * revenue / SUM(revenue) OVER (PARTITION BY category), 2) AS pct_of_category,",
      "       ROUND(100 * SUM(revenue) OVER (PARTITION BY category) / SUM(revenue) OVER (), 2) AS category_pct_of_sale",
      "FROM pair",
      "WHERE revenue > 0",
    ].join("\n"),
    alternatives: [
      [
        "WITH pair AS (",
        "  SELECT s.category, s.brand, SUM(l.amount) AS revenue",
        "  FROM SaleLine l JOIN Style s ON s.style_id = l.style_id",
        "  WHERE l.status = 'delivered'",
        "  GROUP BY s.category, s.brand",
        "), cat AS (",
        "  SELECT category, SUM(revenue) AS cat_revenue FROM pair GROUP BY category",
        "), total AS (",
        "  SELECT SUM(revenue) AS sale_revenue FROM pair",
        ")",
        "SELECT p.category, p.brand, p.revenue,",
        "       ROUND(100 * p.revenue / c.cat_revenue, 2) AS pct_of_category,",
        "       ROUND(100 * c.cat_revenue / t.sale_revenue, 2) AS category_pct_of_sale",
        "FROM pair p",
        "JOIN cat c ON c.category = p.category",
        "CROSS JOIN total t",
      ].join("\n"),
      [
        "SELECT s.category, s.brand, SUM(l.amount) AS revenue,",
        "       ROUND(100 * SUM(l.amount) / (SELECT SUM(l2.amount) FROM SaleLine l2 JOIN Style s2 ON s2.style_id = l2.style_id",
        "                                    WHERE l2.status = 'delivered' AND s2.category = s.category), 2) AS pct_of_category,",
        "       ROUND(100 * (SELECT SUM(l3.amount) FROM SaleLine l3 JOIN Style s3 ON s3.style_id = l3.style_id",
        "                    WHERE l3.status = 'delivered' AND s3.category = s.category)",
        "             / (SELECT SUM(l4.amount) FROM SaleLine l4 WHERE l4.status = 'delivered'), 2) AS category_pct_of_sale",
        "FROM SaleLine l",
        "JOIN Style s ON s.style_id = l.style_id",
        "WHERE l.status = 'delivered'",
        "GROUP BY s.category, s.brand",
      ].join("\n"),
    ],
    hints: [
      "Aggregate to one row per category and brand first, using only delivered lines.",
      "A window `SUM(revenue) OVER (PARTITION BY category)` puts the category's total on every brand's row without collapsing them.",
      "`SUM(…) OVER ()` with an empty window is the grand total of all rows.",
      "Filter out returned and cancelled lines before summing, so a brand with nothing delivered never becomes a row.",
    ],
    editorial: [
      "Two levels of totals are needed on one row: the brand's own revenue, its category's (the **parent**) and the sale's. Grouping can give any one of them, but a share needs the brand and its parent side by side — which is exactly what a window aggregate does. After grouping to one row per (category, brand), `SUM(revenue) OVER (PARTITION BY category)` adds up the brands of the same category and writes that total on each of their rows, and `SUM(revenue) OVER ()` writes the grand total on every row. Dividing gives both percentages without a second pass or a join.",
      "",
      "The filters decide what the parents contain. Only delivered lines count, so HRX's returned topwear line and Sangria's cancelled one add nothing, and Roadster's footwear, with only a returned line, has no revenue and no row — and it does not dilute Footwear, where HRX holds 100%. Roadster's two topwear styles merge into one 3,000-rupee brand row, 75% of Men Topwear. The percentages of a category add to 100 (up to rounding) and the categories' shares of the sale add to 100 too.",
      "",
      "The first alternative computes the category totals and the grand total in their own grouped CTEs and joins them back — the classic pre-window approach. The second recomputes each total with correlated subqueries per row, which is simple to read but rescans the lines per group. The window version sorts the grouped rows once by category.",
    ].join("\n"),
  },

  {
    slug: "myntra-best-price-box-across-three-offers",
    title: "Myntra: The Best Price Box for Each Style Across Three Offers",
    difficulty: "HARD",
    topics: ["Conditional Logic", "Basics"],
    description: [
      "A product page's **Best Price** box shows the lowest price a shopper can reach. Only one extra offer may be stacked on the sale price, so the box must work out which of a style's three offers — a coupon, a bank offer and an Insider reward — saves the most, and what it leaves the shopper paying.",
      "",
      "For each style: `sale_price` is `mrp * (100 - discount_pct) / 100`. The offers are worth, in rupees:",
      "",
      "- **coupon**: `coupon_off`, but only when `sale_price` is at least `coupon_min` (equal counts); otherwise 0;",
      "- **bank**: `bank_pct` percent of `sale_price`, rounded **down** to a whole rupee, and never more than `bank_cap`;",
      "- **insider**: `insider_off`.",
      "",
      "An offer whose columns are NULL is not available and is worth 0. Return `style_id`, `sale_price`, `best_offer` — the name (`'coupon'`, `'bank'` or `'insider'`) of the offer worth the most, ties going to coupon, then bank, then insider, and `'none'` when every offer is worth 0 — and `final_price`: `sale_price` minus that offer's value, but **never below the brand's `floor_price`** (a sale price already under the floor stays as it is, since no offer applies then). Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "StyleOffer",
        columns: [
          { name: "style_id", type: "int" },
          { name: "mrp", type: "int" },
          { name: "discount_pct", type: "int" },
          { name: "coupon_off", type: "int" },
          { name: "coupon_min", type: "int" },
          { name: "bank_pct", type: "int" },
          { name: "bank_cap", type: "int" },
          { name: "insider_off", type: "int" },
          { name: "floor_price", type: "int" },
        ],
        primaryKey: ["style_id"],
        note: "One row per live style. `coupon_off`/`coupon_min` are both NULL when no coupon applies, `bank_pct`/`bank_cap` both NULL when no bank offer runs; `insider_off` is NULL for styles outside the Insider programme. `mrp` is a multiple of 100 and `discount_pct` of 5.",
      },
    ],
    examples: [
      {
        StyleOffer: [
          [1, 2000, 40, 150, 999, 10, 200, 100, 600],
          [2, 3000, 50, 300, 1500, 10, 250, null, 900],
          [3, 1000, 30, 200, 799, null, null, 50, 600],
          [4, 1500, 20, null, null, 5, 100, null, 1000],
          [5, 800, 0, null, null, null, null, null, 500],
          [6, 1200, 50, 100, 599, null, null, 100, 400],
          [7, 900, 60, 100, 299, 10, 500, 30, 300],
          [8, 1000, 50, null, null, null, null, 100, 600],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 20);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const mrp = roundTo(rng, 500, 4000, 100);
        const disc = roundTo(rng, 0, 70, 5);
        const sale = (mrp * (100 - disc)) / 100;
        const hasCoupon = chance(rng, 0.6);
        const couponMin = pick(rng, [sale, sale + 1, sale - 1, roundTo(rng, 299, 1999, 100)]);
        const hasBank = chance(rng, 0.6);
        const bankPct = pick(rng, [5, 10, 15]);
        const bankRaw = Math.floor((sale * bankPct) / 100);
        const bankCap = pick(rng, [bankRaw, bankRaw - 1, 100, 250, 500]);
        const couponOff = pick(rng, [100, 150, 200, 300, Math.min(bankRaw, bankCap)]);
        const hasInsider = chance(rng, 0.5);
        const insiderOff = pick(rng, [50, 100, 150, couponOff]);
        const floor = pick(rng, [roundTo(rng, 200, 1500, 100), sale, sale - 50, sale + 100]);
        return [
          id,
          mrp,
          disc,
          hasCoupon ? couponOff : null,
          hasCoupon ? couponMin : null,
          hasBank ? bankPct : null,
          hasBank ? bankCap : null,
          hasInsider ? insiderOff : null,
          floor,
        ];
      });
      return { StyleOffer: rows };
    },
    solution: [
      "WITH priced AS (",
      "  SELECT style_id, floor_price, mrp * (100 - discount_pct) DIV 100 AS sale_price, coupon_off, coupon_min,",
      "         bank_pct, bank_cap, insider_off",
      "  FROM StyleOffer",
      "), valued AS (",
      "  SELECT style_id, sale_price, floor_price,",
      "         CASE WHEN coupon_off IS NOT NULL AND sale_price >= coupon_min THEN coupon_off ELSE 0 END AS coupon_val,",
      "         COALESCE(LEAST(FLOOR(sale_price * bank_pct / 100), bank_cap), 0) AS bank_val,",
      "         COALESCE(insider_off, 0) AS insider_val",
      "  FROM priced",
      "), best AS (",
      "  SELECT style_id, sale_price, floor_price, coupon_val, bank_val, insider_val,",
      "         GREATEST(coupon_val, bank_val, insider_val) AS best_val",
      "  FROM valued",
      ")",
      "SELECT style_id, sale_price,",
      "       CASE WHEN best_val = 0 THEN 'none'",
      "            WHEN coupon_val = best_val THEN 'coupon'",
      "            WHEN bank_val = best_val THEN 'bank'",
      "            ELSE 'insider' END AS best_offer,",
      "       LEAST(sale_price, GREATEST(sale_price - best_val, floor_price)) AS final_price",
      "FROM best",
    ].join("\n"),
    alternatives: [
      [
        "SELECT style_id, sale_price,",
        "       IF(c = 0 AND b = 0 AND i = 0, 'none',",
        "          IF(c >= b AND c >= i, 'coupon', IF(b >= i, 'bank', 'insider'))) AS best_offer,",
        "       IF(sale_price <= floor_price, sale_price,",
        "          IF(sale_price - IF(c >= b AND c >= i, c, IF(b >= i, b, i)) < floor_price, floor_price,",
        "             sale_price - IF(c >= b AND c >= i, c, IF(b >= i, b, i)))) AS final_price",
        "FROM (",
        "  SELECT style_id, sale_price, floor_price,",
        "         IF(coupon_min IS NULL OR sale_price < coupon_min, 0, coupon_off) AS c,",
        "         IF(bank_pct IS NULL, 0,",
        "            IF((sale_price * bank_pct) DIV 100 > bank_cap, bank_cap, (sale_price * bank_pct) DIV 100)) AS b,",
        "         IFNULL(insider_off, 0) AS i",
        "  FROM (",
        "    SELECT style_id, floor_price, coupon_off, coupon_min, bank_pct, bank_cap, insider_off,",
        "           (mrp * (100 - discount_pct)) DIV 100 AS sale_price",
        "    FROM StyleOffer",
        "  ) p",
        ") v",
      ].join("\n"),
    ],
    hints: [
      "Turn each offer into its rupee value first, with an unavailable offer worth 0 — `GREATEST` returns NULL if any argument is NULL.",
      "The bank offer is the smaller of two amounts: the rounded-down percentage and the cap.",
      "The best value is the greatest of the three; name it by comparing each value with it, in the tie order.",
      "The final price is bounded below by the floor — but a sale price already under the floor must not be raised to it.",
    ],
    editorial: [
      "This is row-wise arithmetic: everything the box needs is in one row, so no join or grouping is involved; the difficulty is in the NULLs, the caps and the order of the bounds. `GREATEST` and `LEAST` compare values **across columns** of a row the way `MAX` and `MIN` compare down a column.",
      "",
      "First each offer becomes rupees. The coupon is worth `coupon_off` only when the sale price reaches `coupon_min` — style 3's 700 does not reach 799. The bank offer is `LEAST(FLOOR(sale * pct / 100), cap)`: style 2's 10% of 1,500 is 150, under its 250 cap, while style 7's cap is generous but 10% of 360 is only 36. A NULL anywhere makes `LEAST` and `GREATEST` return NULL in MySQL, so each value is wrapped in `COALESCE(…, 0)` — without it style 3, with no bank offer, would lose its whole row's answer.",
      "",
      "`GREATEST(coupon, bank, insider)` is the saving; the name is found by testing the values against it in the tie order, so style 1's coupon of 150 beats a bank 120 and Insider 100, and style 6's coupon and Insider tie at 100 and the coupon wins. Style 5 has nothing available, so its best value is 0 and the name is `'none'`.",
      "",
      "The final price has two bounds. `GREATEST(sale - best, floor)` stops an offer from cutting below the brand's floor — style 7's coupon would take 360 down to 260, but the floor holds it at 300. Then `LEAST(sale, …)` stops the floor from *raising* a price: style 8 already sells at 500 under a 600 floor, and the outer `LEAST` keeps 500. The order matters — swapping the two bounds would charge style 8 more than its sale price. The alternative spells every comparison out with nested `IF`s and integer `DIV`, exactly what `GREATEST`/`LEAST` save you from writing. Both are a single scan of the table.",
    ].join("\n"),
  },

  {
    slug: "myntra-eors-first-time-buyers-who-came-back",
    title: "Myntra: EORS First-Time Buyers Who Ordered Again Within 90 Days",
    difficulty: "HARD",
    topics: ["Subqueries", "Dates", "Aggregation"],
    description: [
      "Big sale events bring in many first-time shoppers. The growth team wants to know, per sale edition, how many shoppers made their very first purchase during it and how many of them came back soon after.",
      "",
      "A shopper's **first order** is their earliest order with a `status` other than `cancelled`. They are a **new buyer** of an edition when that first order's `placed_on` falls between the edition's `starts_on` and `ends_on`, inclusive. A new buyer **came back** when they have another non-cancelled order placed on a **later day**, at most **90 days** after the first order's date. For **every** edition return `edition_name`, `new_buyers` and `came_back`, ordered by `starts_on`.",
    ].join("\n"),
    tables: [
      {
        name: "SaleEdition",
        columns: [
          { name: "edition_id", type: "int" },
          { name: "edition_name", type: "varchar" },
          { name: "starts_on", type: "date" },
          { name: "ends_on", type: "date" },
        ],
        primaryKey: ["edition_id"],
        note: "One row per sale event; editions never overlap.",
      },
      {
        name: "ShopOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "placed_on", type: "date" },
          { name: "status", type: "enum", values: ["delivered", "returned", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per order.",
      },
    ],
    examples: [
      {
        SaleEdition: [
          [1, "EORS Summer 2024", "2024-06-01", "2024-06-06"],
          [2, "Big Fashion Festival 2024", "2024-10-01", "2024-10-08"],
          [3, "EORS Winter 2024", "2024-12-14", "2024-12-19"],
        ],
        ShopOrder: [
          [1, 1, "2024-06-01", "delivered"],
          [2, 1, "2024-08-30", "delivered"],
          [3, 2, "2024-05-20", "cancelled"],
          [4, 2, "2024-06-06", "delivered"],
          [5, 2, "2024-06-06", "returned"],
          [6, 2, "2024-09-05", "delivered"],
          [7, 3, "2024-05-30", "delivered"],
          [8, 3, "2024-06-02", "delivered"],
          [9, 4, "2024-10-08", "returned"],
          [10, 4, "2024-10-09", "cancelled"],
          [11, 4, "2024-11-01", "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      const eds: [string, string, string][] = [
        ["EORS Summer 2024", "2024-06-01", "2024-06-06"],
        ["Big Fashion Festival 2024", "2024-10-01", "2024-10-08"],
        ["EORS Winter 2024", "2024-12-14", "2024-12-19"],
      ];
      const editions: Cell[][] = eds.map(([nm, s, e], i) => [i + 1, nm, s, e]);
      const rows: Cell[][] = [];
      for (const u of seq(1, ri(rng, 2, 8))) {
        const [, s, e] = pick(rng, eds);
        const first = chance(rng, 0.65) ? dateBetween(rng, addDays(s, -3), addDays(e, 2)) : dateBetween(rng, "2024-05-01", "2024-12-31");
        rows.push([0, u, first, pick(rng, ["delivered", "delivered", "returned", "cancelled"])]);
        for (let j = ri(rng, 0, 3); j > 0; j--) {
          rows.push([0, u, addDays(first, pick(rng, [0, 1, 30, 89, 90, 91, 120])), pick(rng, ["delivered", "returned", "cancelled"])]);
        }
      }
      rows.forEach((r, i) => (r[0] = i + 1));
      return { SaleEdition: editions, ShopOrder: rows };
    },
    solution: [
      "WITH valid_orders AS (",
      "  SELECT user_id, placed_on FROM ShopOrder WHERE status <> 'cancelled'",
      "), firsts AS (",
      "  SELECT user_id, MIN(placed_on) AS first_on FROM valid_orders GROUP BY user_id",
      ")",
      "SELECT e.edition_name,",
      "       COUNT(f.user_id) AS new_buyers,",
      "       COUNT(CASE WHEN EXISTS (SELECT 1 FROM valid_orders v",
      "                               WHERE v.user_id = f.user_id AND v.placed_on > f.first_on",
      "                                 AND DATEDIFF(v.placed_on, f.first_on) <= 90)",
      "                  THEN 1 END) AS came_back",
      "FROM SaleEdition e",
      "LEFT JOIN firsts f ON f.first_on BETWEEN e.starts_on AND e.ends_on",
      "GROUP BY e.edition_id, e.edition_name, e.starts_on",
      "ORDER BY e.starts_on",
    ].join("\n"),
    alternatives: [
      [
        "WITH valid_orders AS (",
        "  SELECT user_id, placed_on FROM ShopOrder WHERE status IN ('delivered', 'returned')",
        "), ranked AS (",
        "  SELECT user_id, placed_on, MIN(placed_on) OVER (PARTITION BY user_id) AS first_on FROM valid_orders",
        "), seconds AS (",
        "  SELECT user_id, first_on, MIN(CASE WHEN placed_on > first_on THEN placed_on END) AS next_on",
        "  FROM ranked GROUP BY user_id, first_on",
        ")",
        "SELECT e.edition_name,",
        "       COUNT(s.user_id) AS new_buyers,",
        "       SUM(CASE WHEN s.next_on IS NOT NULL AND DATEDIFF(s.next_on, s.first_on) <= 90 THEN 1 ELSE 0 END) AS came_back",
        "FROM SaleEdition e",
        "LEFT JOIN seconds s ON s.first_on >= e.starts_on AND s.first_on <= e.ends_on",
        "GROUP BY e.edition_id, e.edition_name, e.starts_on",
        "ORDER BY e.starts_on",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Drop cancelled orders before finding anyone's first order — a cancelled order is not a purchase.",
      "Find each shopper's first order date, then match it to the edition whose window contains it.",
      "Every edition must appear, so start from `SaleEdition` and LEFT JOIN.",
      "\"Came back\" needs a later *day* — a second order on the first day does not count — and at most 90 days later.",
    ],
    editorial: [
      "The question has three layers. First, which orders count: cancelled ones never do, so they are filtered out before anything else. Shopper 2's cancelled order on 20 May would otherwise make 20 May their first order and hide them from the summer sale.",
      "",
      "Second, each shopper's first order: `MIN(placed_on)` per shopper over the valid orders. A shopper is a new buyer of the edition whose window contains that date; joining `firsts` to `SaleEdition` with `BETWEEN starts_on AND ends_on` (inclusive) assigns each shopper to at most one edition, since editions do not overlap. Shopper 3 first bought on 30 May, before the sale, and is nobody's new buyer. The join is a LEFT JOIN from the editions so that the winter edition, with no new buyers, still gets its row with zeros.",
      "",
      "Third, the come-back test: another valid order on a **later** day (`placed_on > first_on`, so shopper 2's second order on the same day does not count) no more than 90 days on (`DATEDIFF <= 90`; 90 counts, 91 does not). `COUNT(CASE WHEN EXISTS (…) THEN 1 END)` counts the shoppers who pass; for an edition with no new buyers there is nothing to count. The alternative uses a window `MIN` for the first date and finds each shopper's next later order date with a conditional `MIN`, then tests the gap — one pass instead of a subquery per shopper.",
    ].join("\n"),
  },

  {
    slug: "myntra-top-three-wishlisted-styles-per-brand",
    title: "Myntra: Each Brand's Three Most-Wishlisted Styles in One Row",
    difficulty: "HARD",
    topics: ["Window Functions", "Subqueries", "Conditional Logic"],
    description: [
      "Before the sale, each brand's account manager gets a one-line card naming the brand's three styles sitting in the most wishlists right now, so the brand can stock up on them.",
      "",
      "The wishlist log records every `'add'` and `'remove'`. A style is **in a shopper's wishlist** when that shopper's **latest** event for the style is an `'add'`. For each style, count the shoppers who have it in their wishlist; styles with a count of 0 are ignored. For every brand with at least one such style, return one row: `brand`, `top_1`, `top_2` and `top_3` — the `style_name`s of its most-wishlisted, second and third styles, ranked by that count descending with ties broken by the **lower `style_id`**. When a brand has fewer than three, the missing columns are NULL. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Style",
        columns: [
          { name: "style_id", type: "int" },
          { name: "brand", type: "varchar" },
          { name: "style_name", type: "varchar" },
        ],
        primaryKey: ["style_id"],
        note: "One row per style; names may repeat across brands.",
      },
      {
        name: "WishlistEvent",
        columns: [
          { name: "user_id", type: "int" },
          { name: "style_id", type: "int" },
          { name: "event_at", type: "datetime" },
          { name: "action", type: "enum", values: ["add", "remove"] },
        ],
        primaryKey: ["user_id", "style_id", "event_at"],
        note: "One row per tap on the heart icon. A shopper never has two events for one style at the same moment.",
      },
    ],
    examples: [
      {
        Style: [
          [1, "Roadster", "Slim Fit Jeans"],
          [2, "Roadster", "Oversized Shirt"],
          [3, "Roadster", "Cargo Joggers"],
          [4, "Roadster", "Running T-shirt"],
          [5, "Anouk", "Printed Kurta"],
          [6, "Anouk", "Anarkali Kurta"],
          [7, "HRX", "Chunky Sneakers"],
        ],
        WishlistEvent: [
          [1, 1, "2024-11-01 10:00:00", "add"],
          [2, 1, "2024-11-01 11:00:00", "add"],
          [3, 1, "2024-11-02 09:00:00", "add"],
          [3, 1, "2024-11-03 09:00:00", "remove"],
          [1, 2, "2024-11-01 10:05:00", "add"],
          [2, 2, "2024-11-02 12:00:00", "add"],
          [1, 3, "2024-11-01 10:10:00", "add"],
          [2, 3, "2024-11-02 13:00:00", "add"],
          [3, 4, "2024-11-02 10:00:00", "add"],
          [1, 5, "2024-11-04 08:00:00", "remove"],
          [1, 5, "2024-11-01 08:00:00", "add"],
          [2, 6, "2024-11-05 19:00:00", "add"],
          [3, 7, "2024-11-01 09:00:00", "add"],
          [3, 7, "2024-11-02 09:00:00", "remove"],
        ],
      },
    ],
    gen: (rng) => {
      const brands = sample(rng, BRANDS, ri(rng, 1, 3));
      const styles: Cell[][] = seq(1, ri(rng, 1, 9)).map((id) => [id, pick(rng, brands), pick(rng, ARTICLE_NAMES)]);
      const events: Cell[][] = [];
      const users = ri(rng, 1, 6);
      for (const u of seq(1, users)) {
        for (const s of sample(rng, seq(1, styles.length), ri(rng, 0, styles.length))) {
          const base = dateBetween(rng, "2024-10-20", "2024-11-10");
          const k = pick(rng, [1, 1, 1, 2, 3]);
          for (let j = 0; j < k; j++) {
            events.push([u, s, `${addDays(base, j)} ${pad(ri(rng, 0, 23))}:00:00`, j === 0 ? "add" : pick(rng, ["add", "remove", "remove"])]);
          }
        }
      }
      return { Style: styles, WishlistEvent: events };
    },
    solution: [
      "WITH latest AS (",
      "  SELECT w.user_id, w.style_id, w.action",
      "  FROM WishlistEvent w",
      "  WHERE w.event_at = (SELECT MAX(w2.event_at) FROM WishlistEvent w2",
      "                      WHERE w2.user_id = w.user_id AND w2.style_id = w.style_id)",
      "), counts AS (",
      "  SELECT s.brand, s.style_id, s.style_name, COUNT(*) AS shoppers",
      "  FROM latest l",
      "  JOIN Style s ON s.style_id = l.style_id",
      "  WHERE l.action = 'add'",
      "  GROUP BY s.brand, s.style_id, s.style_name",
      "), ranked AS (",
      "  SELECT brand, style_name,",
      "         ROW_NUMBER() OVER (PARTITION BY brand ORDER BY shoppers DESC, style_id) AS pos",
      "  FROM counts",
      ")",
      "SELECT brand,",
      "       MAX(CASE WHEN pos = 1 THEN style_name END) AS top_1,",
      "       MAX(CASE WHEN pos = 2 THEN style_name END) AS top_2,",
      "       MAX(CASE WHEN pos = 3 THEN style_name END) AS top_3",
      "FROM ranked",
      "GROUP BY brand",
    ].join("\n"),
    alternatives: [
      [
        "WITH ordered AS (",
        "  SELECT user_id, style_id, action,",
        "         ROW_NUMBER() OVER (PARTITION BY user_id, style_id ORDER BY event_at DESC) AS rn",
        "  FROM WishlistEvent",
        "), counts AS (",
        "  SELECT s.brand, s.style_id, s.style_name, COUNT(*) AS shoppers",
        "  FROM ordered o JOIN Style s ON s.style_id = o.style_id",
        "  WHERE o.rn = 1 AND o.action = 'add'",
        "  GROUP BY s.brand, s.style_id, s.style_name",
        "), ranked AS (",
        "  SELECT c.brand, c.style_name,",
        "         (SELECT COUNT(*) FROM counts c2",
        "           WHERE c2.brand = c.brand",
        "             AND (c2.shoppers > c.shoppers OR (c2.shoppers = c.shoppers AND c2.style_id <= c.style_id))) AS pos",
        "  FROM counts c",
        ")",
        "SELECT b.brand, r1.style_name AS top_1, r2.style_name AS top_2, r3.style_name AS top_3",
        "FROM (SELECT DISTINCT brand FROM ranked) b",
        "LEFT JOIN ranked r1 ON r1.brand = b.brand AND r1.pos = 1",
        "LEFT JOIN ranked r2 ON r2.brand = b.brand AND r2.pos = 2",
        "LEFT JOIN ranked r3 ON r3.brand = b.brand AND r3.pos = 3",
      ].join("\n"),
    ],
    hints: [
      "Reduce the log to each shopper's latest event per style; only those that are an `'add'` count.",
      "Count shoppers per style, then number each brand's styles by that count, breaking ties by `style_id`.",
      "To turn positions 1, 2 and 3 into columns, group by brand and pick each position with a conditional aggregate.",
      "A position that does not exist gives `MAX(CASE …)` nothing to see, so it comes out NULL by itself.",
    ],
    editorial: [
      "There are three steps: the current state of every wishlist, a ranking per brand, and a **pivot** of the top three ranks into columns.",
      "",
      "The log has history, so a style is in a wishlist only if the shopper's **latest** event for it is an add. Keeping the row whose `event_at` equals the pair's maximum does that; shopper 3 added and then removed Slim Fit Jeans, and shopper 1's Printed Kurta removal is the later row even though it is listed first, so neither counts. HRX's only style was removed, so HRX has no style above 0 and no row.",
      "",
      "Counting shoppers per style gives Roadster 2 for Slim Fit Jeans, 2 for Oversized Shirt, 2 for Cargo Joggers and 1 for Running T-shirt. `ROW_NUMBER()` per brand ordered by count descending and `style_id` makes the three-way tie resolve to ids 1, 2, 3, and the T-shirt is fourth and dropped. The pivot is `GROUP BY brand` with `MAX(CASE WHEN pos = k THEN style_name END)` for k = 1, 2, 3: each position appears at most once per brand, so `MAX` simply picks it, and a missing position gives NULL — Anouk has only Anarkali Kurta, so its `top_2` and `top_3` are NULL.",
      "",
      "The alternative finds the latest event with `ROW_NUMBER()` instead of a correlated `MAX`, computes positions by counting the brand's styles that rank at or ahead of each one, and pivots by joining the ranked rows three times on the position with `LEFT JOIN`s. The conditional aggregate is one grouping; the join version touches the ranked set once per column.",
    ].join("\n"),
  },

  {
    slug: "myntra-sizes-over-represented-in-size-returns",
    title: "Myntra: Sizes Over-Represented in Size Returns per Article Type",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation", "Subqueries"],
    description: [
      "A size whose fit is off shows up in size-related returns more often than its share of sales would predict. The size-chart team wants those sizes, article type by article type.",
      "",
      "Within each `article_type`, a size's **sales share** is its items divided by all the article type's items, and its **return share** is its `size_return` items divided by all the article type's `size_return` items. Return `article_type`, `size`, `items` and `size_returns` for every size whose return share is **strictly greater** than its sales share. Article types with no size returns at all are skipped. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "OrderItem",
        columns: [
          { name: "order_item_id", type: "int" },
          { name: "article_type", type: "varchar" },
          { name: "size", type: "varchar" },
          { name: "outcome", type: "enum", values: ["kept", "size_return", "other_return"] },
        ],
        primaryKey: ["order_item_id"],
        note: "One row per item sold. `size_return` means it came back because it did not fit; `other_return` covers every other reason.",
      },
    ],
    examples: [
      {
        OrderItem: [
          [1, "Jeans", "30", "kept"],
          [2, "Jeans", "30", "kept"],
          [3, "Jeans", "30", "size_return"],
          [4, "Jeans", "30", "kept"],
          [5, "Jeans", "32", "size_return"],
          [6, "Jeans", "32", "size_return"],
          [7, "Jeans", "32", "size_return"],
          [8, "Jeans", "32", "kept"],
          [9, "Jeans", "34", "kept"],
          [10, "Jeans", "34", "other_return"],
          [11, "Kurta", "M", "size_return"],
          [12, "Kurta", "M", "other_return"],
          [13, "Kurta", "M", "kept"],
          [14, "Kurta", "L", "size_return"],
          [15, "Sneakers", "8", "other_return"],
          [16, "Sneakers", "8", "other_return"],
        ],
      },
    ],
    gen: (rng) => {
      const sizeOf: Record<string, string[]> = { Jeans: ["28", "30", "32", "34"], Kurta: ["S", "M", "L", "XL"], Sneakers: ["7", "8", "9", "10"] };
      const arts = sample(rng, Object.keys(sizeOf), ri(rng, 1, 3));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 4, 30);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const a = pick(rng, arts);
        const size = pick(rng, sizeOf[a]!);
        const bad = size === sizeOf[a]![1];
        return [id, a, size, chance(rng, bad ? 0.5 : 0.2) ? "size_return" : pick(rng, ["kept", "kept", "kept", "other_return"])];
      });
      return { OrderItem: rows };
    },
    solution: [
      "WITH by_size AS (",
      "  SELECT article_type, size,",
      "         COUNT(*) AS items,",
      "         SUM(CASE WHEN outcome = 'size_return' THEN 1 ELSE 0 END) AS size_returns",
      "  FROM OrderItem",
      "  GROUP BY article_type, size",
      "), with_totals AS (",
      "  SELECT article_type, size, items, size_returns,",
      "         SUM(items) OVER (PARTITION BY article_type) AS article_items,",
      "         SUM(size_returns) OVER (PARTITION BY article_type) AS article_returns",
      "  FROM by_size",
      ")",
      "SELECT article_type, size, items, size_returns",
      "FROM with_totals",
      "WHERE article_returns > 0",
      "  AND size_returns * article_items > items * article_returns",
    ].join("\n"),
    alternatives: [
      [
        "SELECT s.article_type, s.size, s.items, s.size_returns",
        "FROM (SELECT article_type, size, COUNT(*) AS items, SUM(outcome = 'size_return') AS size_returns",
        "      FROM OrderItem GROUP BY article_type, size) s",
        "JOIN (SELECT article_type, COUNT(*) AS article_items, SUM(outcome = 'size_return') AS article_returns",
        "      FROM OrderItem GROUP BY article_type) a ON a.article_type = s.article_type",
        "WHERE a.article_returns > 0",
        "  AND s.size_returns / a.article_returns > s.items / a.article_items",
      ].join("\n"),
    ],
    hints: [
      "You need two levels of totals at once: per size and per article type.",
      "Aggregate per (article type, size) first; then a window `SUM` over the article type gives its totals on every row.",
      "Compare a/b > c/d as a·d > c·b to avoid division — but skip article types whose return total is 0.",
    ],
    editorial: [
      "Each size has to be compared with its whole article type, so the query needs per-size counts and per-article totals side by side. The first CTE groups by `(article_type, size)`: `COUNT(*)` items and a conditional `SUM` of size returns. The second puts the article type's totals on each of those rows with window sums — `SUM(items) OVER (PARTITION BY article_type)` and the same for returns — which is a window over an aggregate, evaluated after the grouping.",
      "",
      "The test \"return share > sales share\" is `size_returns / article_returns > items / article_items`. Multiplying both sides by the two positive totals gives `size_returns * article_items > items * article_returns`, all integers, so there is no rounding at all and an exact tie (a size returning exactly its share) is correctly excluded. The division is undefined when an article type has no size returns, so those are filtered out first; Sneakers, with only other returns, never appears. Jeans size 30 sells 40% and takes 25% of size returns — under-represented — while size 32 sells 40% and takes 75%.",
      "",
      "The alternative joins the per-size aggregate to a per-article aggregate and compares the two ratios with exact decimal division, which in MySQL is exact enough for these small counts. Both read the table once or twice and sort a few groups.",
    ].join("\n"),
  },

  {
    slug: "myntra-brands-making-up-80-percent-of-category-revenue",
    title: "Myntra: The Few Brands Making Up 80% of Each Category's Sale Revenue",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation", "Joins"],
    description: [
      "After the sale, category managers want to know how concentrated their revenue was: which leading brands, taken from the biggest down, together make up 80% of the category's revenue.",
      "",
      "A brand's revenue in a category is the total `amount` of its `delivered` lines on styles of that category. Within each category, rank the brands with revenue by revenue descending, ties broken by `brand` ascending. Return a brand when the brands ranked **before** it make up **less than 80%** of the category's revenue — so the list runs up to and including the brand that reaches 80%. Return `category`, `brand`, `revenue` and `cumulative_revenue` (the revenue of the brands up to and including this one), **ordered by `category`, then `revenue` descending, then `brand`**.",
    ].join("\n"),
    tables: [
      {
        name: "Style",
        columns: [
          { name: "style_id", type: "int" },
          { name: "brand", type: "varchar" },
          { name: "category", type: "varchar" },
        ],
        primaryKey: ["style_id"],
        note: "One row per style; a brand can have styles in several categories.",
      },
      {
        name: "SaleOrderLine",
        columns: [
          { name: "line_id", type: "int" },
          { name: "style_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["delivered", "returned", "cancelled"] },
        ],
        primaryKey: ["line_id"],
        note: "One row per item sold during the sale, at the price paid in rupees.",
      },
    ],
    examples: [
      {
        Style: [
          [1, "Roadster", "Jeans"],
          [2, "Roadster", "Jeans"],
          [3, "HRX", "Jeans"],
          [4, "Mast & Harbour", "Jeans"],
          [5, "Here&Now", "Jeans"],
          [6, "Anouk", "Kurta"],
          [7, "Sangria", "Kurta"],
          [8, "Dressberry", "Kurta"],
        ],
        SaleOrderLine: [
          [1, 1, 3000, "delivered"],
          [2, 2, 2000, "delivered"],
          [3, 3, 3000, "delivered"],
          [4, 4, 1000, "delivered"],
          [5, 5, 1000, "delivered"],
          [6, 6, 4000, "delivered"],
          [7, 7, 4000, "delivered"],
          [8, 8, 1000, "delivered"],
          [9, 8, 5000, "returned"],
          [10, 3, 2500, "cancelled"],
        ],
      },
    ],
    gen: (rng) => {
      const cats = sample(rng, ["Jeans", "Kurta", "Sneakers"], ri(rng, 1, 2));
      const brands = sample(rng, BRANDS, ri(rng, 2, 5));
      const n = ri(rng, 2, 8);
      const styles: Cell[][] = seq(1, n).map((id) => [id, pick(rng, brands), pick(rng, cats)]);
      const lines: Cell[][] = seq(1, chance(rng, 0.05) ? 0 : ri(rng, 3, 25)).map((id) => [
        id,
        ri(rng, 1, n),
        roundTo(rng, 500, 5000, 500),
        pick(rng, ["delivered", "delivered", "delivered", "returned", "cancelled"]),
      ]);
      return { Style: styles, SaleOrderLine: lines };
    },
    solution: [
      "WITH brand_revenue AS (",
      "  SELECT s.category, s.brand, SUM(l.amount) AS revenue",
      "  FROM SaleOrderLine l",
      "  JOIN Style s ON s.style_id = l.style_id",
      "  WHERE l.status = 'delivered'",
      "  GROUP BY s.category, s.brand",
      "), running AS (",
      "  SELECT category, brand, revenue,",
      "         SUM(revenue) OVER (PARTITION BY category ORDER BY revenue DESC, brand",
      "                            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_revenue,",
      "         SUM(revenue) OVER (PARTITION BY category) AS category_revenue",
      "  FROM brand_revenue",
      ")",
      "SELECT category, brand, revenue, cumulative_revenue",
      "FROM running",
      "WHERE (cumulative_revenue - revenue) * 10 < category_revenue * 8",
      "ORDER BY category, revenue DESC, brand",
    ].join("\n"),
    alternatives: [
      [
        "WITH br AS (",
        "  SELECT s.category, s.brand, SUM(l.amount) AS revenue",
        "  FROM SaleOrderLine l, Style s",
        "  WHERE s.style_id = l.style_id AND l.status IN ('delivered')",
        "  GROUP BY s.category, s.brand",
        "), placed AS (",
        "  SELECT b.category, b.brand, b.revenue,",
        "         (SELECT COALESCE(SUM(a.revenue), 0) FROM br a",
        "          WHERE a.category = b.category",
        "            AND (a.revenue > b.revenue OR (a.revenue = b.revenue AND a.brand < b.brand))) AS ahead,",
        "         (SELECT SUM(t.revenue) FROM br t WHERE t.category = b.category) AS total",
        "  FROM br b",
        ")",
        "SELECT category, brand, revenue, ahead + revenue AS cumulative_revenue",
        "FROM placed",
        "WHERE ahead < 0.8 * total",
        "ORDER BY category, revenue DESC, brand",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First total the delivered revenue per (category, brand) — the ranking is over brands, not over order lines.",
      "A window `SUM` over the brand totals, ordered by revenue descending and brand, gives the running revenue.",
      "The test is on the revenue *before* the brand: running total minus its own revenue.",
      "Compare with 80% without decimals: `before * 10 < total * 8`.",
    ],
    editorial: [
      "This is a **Pareto cut**: the shortest list of top brands that together reach 80% of a category's revenue. It takes three steps. First, aggregate: delivered lines joined to their style's brand and category, summed per `(category, brand)`. Returned and cancelled lines never count, which is why Dressberry's ₹5000 return does not make it the biggest kurta brand.",
      "",
      "Second, a window over the aggregate: `SUM(revenue) OVER (PARTITION BY category ORDER BY revenue DESC, brand ROWS …)` is the running revenue down the ranking, and `SUM(revenue) OVER (PARTITION BY category)` the category total on every row. The `brand` tie-break and the `ROWS` frame matter: Here&Now and Mast & Harbour both made ₹1000 in jeans, and without them the two would share one running value.",
      "",
      "Third, the cut. A brand belongs to the list when the brands *before* it have not yet reached 80% — `cumulative_revenue - revenue` below 80% of the total — which keeps the brand that crosses the line and nothing after it. Written as `(cumulative_revenue - revenue) * 10 < category_revenue * 8` it is exact; a brand whose predecessors make exactly 80% is not needed and is left out, as Here&Now is. The alternative computes the revenue ahead of each brand with a correlated sum over the brand totals, using the same tie order, and is quadratic per category where the window version is one sort.",
    ].join("\n"),
  },

  {
    slug: "myntra-serial-returners-last-five-orders",
    title: "Myntra: Serial Returners by Their Last Five Delivered Orders",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins", "Aggregation"],
    description: [
      "To decide who loses free returns, the returns-abuse team looks at each shopper's **recent** behaviour only, not their whole history.",
      "",
      "Ignore cancelled orders. A shopper's last five orders are their five with the latest `delivered_on`, breaking ties by the higher `order_id`. Return `user_id`, `name` and `returns_in_last_five` for every shopper who has **at least five** non-cancelled orders and whose last five include **at least four** with `status = 'returned'` (exchanges are not returns). Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Shopper",
        columns: [
          { name: "user_id", type: "int" },
          { name: "name", type: "varchar" },
        ],
        primaryKey: ["user_id"],
        note: "One row per account.",
      },
      {
        name: "ShopOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "delivered_on", type: "date" },
          { name: "status", type: "enum", values: ["kept", "returned", "exchanged", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per order. `delivered_on` is NULL exactly when the order was cancelled.",
      },
    ],
    examples: [
      {
        Shopper: [
          [1, "Aarav"],
          [2, "Diya"],
          [3, "Kabir"],
          [4, "Meera"],
        ],
        ShopOrder: [
          [1, 1, "2024-01-05", "kept"],
          [2, 1, "2024-02-05", "returned"],
          [3, 1, "2024-03-05", "returned"],
          [4, 1, "2024-04-05", "kept"],
          [5, 1, "2024-05-05", "returned"],
          [6, 1, "2024-06-05", "returned"],
          [7, 2, "2024-01-10", "returned"],
          [8, 2, "2024-02-10", "returned"],
          [9, 2, "2024-03-10", "exchanged"],
          [10, 2, "2024-04-10", "returned"],
          [11, 2, "2024-05-10", "returned"],
          [12, 2, "2024-05-10", "kept"],
          [13, 3, "2024-03-01", "returned"],
          [14, 3, "2024-03-02", "returned"],
          [15, 3, "2024-03-03", "returned"],
          [16, 3, "2024-03-04", "returned"],
          [17, 4, "2024-02-01", "returned"],
          [18, 4, "2024-02-02", "returned"],
          [19, 4, "2024-02-03", "kept"],
          [20, 4, "2024-02-04", "returned"],
          [21, 4, "2024-02-05", "returned"],
          [22, 4, null, "cancelled"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 3, 6);
      const who = names(rng, n);
      const shoppers: Cell[][] = seq(1, n).map((id, i) => [id, who[i]!]);
      const rows: Cell[][] = [];
      for (const u of seq(1, n)) {
        const p = chance(rng, 0.5) ? 0.9 : pick(rng, [0.3, 0.6]);
        for (let j = ri(rng, 3, 9); j > 0; j--) {
          if (chance(rng, 0.1)) {
            rows.push([0, u, null, "cancelled"]);
            continue;
          }
          rows.push([0, u, dateBetween(rng, "2024-01-01", "2024-02-15"), chance(rng, p) ? "returned" : pick(rng, ["kept", "kept", "exchanged"])]);
        }
      }
      rows.forEach((r, i) => (r[0] = i + 1));
      return { Shopper: shoppers, ShopOrder: rows };
    },
    solution: [
      "WITH ranked AS (",
      "  SELECT user_id, status,",
      "         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY delivered_on DESC, order_id DESC) AS recency",
      "  FROM ShopOrder",
      "  WHERE status <> 'cancelled'",
      "), last_five AS (",
      "  SELECT user_id,",
      "         COUNT(*) AS orders_seen,",
      "         SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) AS returns_in_last_five",
      "  FROM ranked",
      "  WHERE recency <= 5",
      "  GROUP BY user_id",
      ")",
      "SELECT s.user_id, s.name, l.returns_in_last_five",
      "FROM last_five l",
      "JOIN Shopper s ON s.user_id = l.user_id",
      "WHERE l.orders_seen = 5 AND l.returns_in_last_five >= 4",
    ].join("\n"),
    alternatives: [
      [
        "SELECT s.user_id, s.name, SUM(CASE WHEN o.status = 'returned' THEN 1 ELSE 0 END) AS returns_in_last_five",
        "FROM Shopper s",
        "JOIN ShopOrder o ON o.user_id = s.user_id",
        "WHERE o.status <> 'cancelled'",
        "  AND (SELECT COUNT(*) FROM ShopOrder p",
        "       WHERE p.user_id = o.user_id AND p.status <> 'cancelled'",
        "         AND (p.delivered_on > o.delivered_on OR (p.delivered_on = o.delivered_on AND p.order_id > o.order_id))) < 5",
        "GROUP BY s.user_id, s.name",
        "HAVING COUNT(*) = 5 AND SUM(CASE WHEN o.status = 'returned' THEN 1 ELSE 0 END) >= 4",
      ].join("\n"),
    ],
    hints: [
      "Remove cancelled orders before ranking — they have no delivery date and are not \"recent orders\".",
      "Number each shopper's orders newest first with `ROW_NUMBER()`, breaking date ties by `order_id`.",
      "Keep positions 1–5, then count rows and returns per shopper.",
      "\"At least five orders\" is the same as \"five rows survived\".",
    ],
    editorial: [
      "This is a **top-N per group** problem followed by a condition on the group. Cancelled orders are removed first: they have no delivery date and were never in the shopper's hands. Then `ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY delivered_on DESC, order_id DESC)` numbers each shopper's orders from the most recent, and positions 1 to 5 are the last five. The `order_id` tie-break matters when two orders arrived the same day at the edge of the window.",
      "",
      "Grouping those rows per shopper gives two numbers: how many orders were seen (fewer than five means the shopper does not have five orders yet, like Kabir) and how many of them were returned. Only `returned` counts — Diya's exchange is not a return, and her older return outside the window must not count either; looking at her whole history would wrongly flag her. Meera's cancelled order is ignored rather than pushing an older order out.",
      "",
      "The alternative selects the last five without a window: an order is among them when fewer than five of the shopper's non-cancelled orders are newer in (date, id) order, counted by a correlated subquery, and `HAVING` applies both conditions. It is quadratic per shopper; the window version is one sort.",
    ].join("\n"),
  },
];
