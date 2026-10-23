import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, chance, CITIES, dateBetween, names, pick, ri, roundTo, sample, shuffle } from "./kit.js";

/**
 * Zomato: the questions an analyst or data engineer at a restaurant-discovery
 * and food company is asked across its businesses — hygiene certificates and
 * veg/non-veg menus, Zomato Gold memberships and their renewals, dining-out
 * reviews and table reservations, promoted listings, Blinkit dark-store stock
 * and baskets, District movie and event tickets, Hyperpure supplies to
 * restaurants, Intercity Legends and Feeding India donations. The schemas and
 * figures are fictional, written for practice — none of it is Zomato's own
 * data model. World-food-delivery.ts already covers the delivery funnel,
 * riders and order GMV, so these lean on the other products. Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
const pad = (n: number) => String(n).padStart(2, "0");
/** 'YYYY-MM-DD HH:MM:00' from a date and minutes after midnight (may run into later days). */
const at = (date: string, minutes: number): string => {
  const d = addDays(date, Math.floor(minutes / 1440));
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${d} ${pad(Math.floor(m / 60))}:${pad(m % 60)}:00`;
};

const RESTAURANTS = [
  "Spice Route", "Tandoor Tales", "Dosa Darbar", "Wok Express", "Cafe Mocha Bay", "Biryani House",
  "Green Leaf Kitchen", "Kebab Korner", "Pasta Street", "Chaat Junction", "Coastal Curry", "Momo Point",
  "Paratha Lane", "Udupi Corner", "Bombay Bites", "Thali Theatre", "Sizzler Shack", "Rolls Republic",
  "Idli Express", "Pind Dhaba",
] as const;
const LOCALITIES = ["Koramangala", "Indiranagar", "HSR Layout", "Bandra West", "Andheri East", "Hauz Khas", "Connaught Place", "Banjara Hills", "Salt Lake", "Viman Nagar"] as const;
/** Names whose order is the same under a binary and a case-insensitive collation. */
const GROCERIES = [
  "Bananas", "Brown Bread", "Butter", "Cola Bottle", "Coriander Bunch", "Curd Cup", "Farm Eggs",
  "Instant Noodles", "Onions", "Paneer Block", "Potato Chips", "Tomatoes", "Toned Milk",
] as const;
const HYGIENE_GRADES = ["Excellent", "Very Good", "Good", "Needs Improvement"] as const;
const LEGENDS: readonly (readonly [string, string])[] = [
  ["Kolkata Rosogolla", "Kolkata"], ["Lucknowi Galouti", "Lucknow"], ["Hyderabadi Biryani", "Hyderabad"],
  ["Mysore Pak", "Mysuru"], ["Amritsari Kulcha", "Amritsar"], ["Jaipur Ghewar", "Jaipur"],
  ["Mumbai Pav Bhaji Kit", "Mumbai"], ["Delhi Butter Chicken", "Delhi"],
];
const DISHES = ["Butter Chicken", "Chole Bhature", "Filter Coffee", "Garlic Naan", "Gulab Jamun", "Mango Lassi", "Masala Dosa", "Paneer Tikka", "Pav Bhaji", "Veg Biryani"] as const;
const LEGEND_DESTINATIONS = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Kolkata", "Jaipur"] as const;

export const COMPANY_ZOMATO: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "zomato-hygiene-certificates-expiring-in-july",
    title: "Zomato: Hygiene Certificates Expiring in July",
    difficulty: "EASY",
    topics: ["Basics", "Dates"],
    description: [
      "Zomato's restaurant-compliance team shows a hygiene grade on every listed restaurant, and a grade is only shown while its certificate is valid. On 2024-06-25 they want to book re-audits for every certificate that lapses next month.",
      "",
      "Return each **active** restaurant (`is_active = 1`) whose `valid_until` falls **between 2024-07-01 and 2024-07-31 inclusive**, with the columns `restaurant_id`, `restaurant_name`, `grade`, `valid_until` and `days_left` — the number of days from 2024-06-25 to `valid_until`. Order the rows by `valid_until`, then by `restaurant_id`.",
    ].join("\n"),
    tables: [
      {
        name: "HygieneCertificate",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "restaurant_name", type: "varchar" },
          { name: "city", type: "varchar" },
          { name: "valid_until", type: "date" },
          { name: "grade", type: "enum", values: [...HYGIENE_GRADES] },
          { name: "is_active", type: "bool" },
        ],
        primaryKey: ["restaurant_id"],
        note: "One row per restaurant: its current hygiene certificate. `is_active` is 0 for a restaurant delisted from the app.",
      },
    ],
    examples: [
      {
        HygieneCertificate: [
          [1, "Spice Route", "Bengaluru", "2024-07-01", "Excellent", 1],
          [2, "Tandoor Tales", "Delhi", "2024-06-30", "Very Good", 1],
          [3, "Dosa Darbar", "Chennai", "2024-07-31", "Good", 1],
          [4, "Wok Express", "Mumbai", "2024-07-15", "Excellent", 0],
          [5, "Momo Point", "Kolkata", "2024-08-01", "Good", 1],
          [6, "Biryani House", "Hyderabad", "2024-07-15", "Needs Improvement", 1],
          [7, "Kebab Korner", "Delhi", "2024-07-15", "Very Good", 1],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 16);
      const who = sample(rng, RESTAURANTS, n);
      const rows: Cell[][] = who.map((name, i) => [
        i + 1,
        name,
        pick(rng, CITIES),
        chance(rng, 0.25) ? pick(rng, ["2024-07-01", "2024-07-31", "2024-06-30", "2024-08-01"]) : dateBetween(rng, "2024-06-10", "2024-08-20"),
        pick(rng, HYGIENE_GRADES),
        chance(rng, 0.8) ? 1 : 0,
      ]);
      return { HygieneCertificate: rows };
    },
    solution: [
      "SELECT restaurant_id, restaurant_name, grade, valid_until,",
      "       DATEDIFF(valid_until, '2024-06-25') AS days_left",
      "FROM HygieneCertificate",
      "WHERE is_active = 1",
      "  AND valid_until BETWEEN '2024-07-01' AND '2024-07-31'",
      "ORDER BY valid_until, restaurant_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT restaurant_id, restaurant_name, grade, valid_until,",
        "       TIMESTAMPDIFF(DAY, '2024-06-25', valid_until) AS days_left",
        "FROM HygieneCertificate",
        "WHERE is_active = 1 AND YEAR(valid_until) = 2024 AND MONTH(valid_until) = 7",
        "ORDER BY valid_until ASC, restaurant_id ASC",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Two conditions decide a row: the restaurant is active, and the expiry date is inside July 2024.",
      "Both ends of the month count — `BETWEEN` includes them.",
      "`DATEDIFF(later, earlier)` gives the days between two dates.",
    ],
    editorial: [
      "Every certificate is one row, so this is a filter plus one computed column. The `WHERE` clause keeps active restaurants (`is_active = 1`) whose `valid_until` lies in July 2024; `BETWEEN '2024-07-01' AND '2024-07-31'` is inclusive at both ends, so certificates lapsing on the 1st or the 31st are kept, while 30 June and 1 August are not.",
      "",
      "`days_left` is `DATEDIFF(valid_until, '2024-06-25')` — the later date first, so the count is positive. Two certificates often expire on the same day, which is why the order needs `restaurant_id` as a tie-breaker after `valid_until`.",
      "",
      "The alternative tests the month with `YEAR()` and `MONTH()` and measures the gap with `TIMESTAMPDIFF(DAY, …)`. That reads well but cannot use an index on `valid_until`; the `BETWEEN` range can, so on a large table it is the better habit. Either way the query is one pass over the rows.",
    ].join("\n"),
  },

  {
    slug: "zomato-veg-non-veg-and-egg-dishes-per-menu",
    title: "Zomato: Veg, Non-Veg and Egg Dishes on Every Menu",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "Every dish on Zomato carries a diet marker — the green, red or yellow dot. The menu-quality team wants, for each restaurant, how many dishes it currently offers under each marker.",
      "",
      "Return one row for **every** restaurant with `restaurant_id`, `restaurant_name`, `veg_items`, `non_veg_items` and `egg_items` — counts of its menu items with `is_available = 1` in each diet. Unavailable items are not counted, and a restaurant with no available items still appears with zeros. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Restaurant",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "restaurant_name", type: "varchar" },
          { name: "locality", type: "varchar" },
        ],
        primaryKey: ["restaurant_id"],
        note: "One row per listed restaurant.",
      },
      {
        name: "MenuItem",
        columns: [
          { name: "item_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "item_name", type: "varchar" },
          { name: "diet", type: "enum", values: ["veg", "non_veg", "egg"] },
          { name: "is_available", type: "bool" },
        ],
        primaryKey: ["item_id"],
        note: "One row per dish. `is_available` is 0 for a dish switched off for the day.",
      },
    ],
    examples: [
      {
        Restaurant: [
          [1, "Green Leaf Kitchen", "Indiranagar"],
          [2, "Kebab Korner", "Hauz Khas"],
          [3, "Udupi Corner", "HSR Layout"],
          [4, "Rolls Republic", "Bandra West"],
        ],
        MenuItem: [
          [1, 1, "Paneer Tikka", "veg", 1],
          [2, 1, "Veg Biryani", "veg", 1],
          [3, 1, "Masala Omelette", "egg", 0],
          [4, 2, "Chicken Seekh", "non_veg", 1],
          [5, 2, "Mutton Galouti", "non_veg", 1],
          [6, 2, "Egg Roll", "egg", 1],
          [7, 2, "Dal Makhani", "veg", 0],
          [8, 3, "Masala Dosa", "veg", 1],
          [9, 4, "Chicken Roll", "non_veg", 0],
        ],
      },
    ],
    gen: (rng) => {
      const r = ri(rng, 1, 6);
      const rest: Cell[][] = sample(rng, RESTAURANTS, r).map((name, i) => [i + 1, name, pick(rng, LOCALITIES)]);
      const n = chance(rng, 0.08) ? 0 : ri(rng, 1, 22);
      const items: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 1, r),
        `Dish ${id}`,
        pick(rng, ["veg", "veg", "non_veg", "non_veg", "egg"]),
        chance(rng, 0.75) ? 1 : 0,
      ]);
      return { Restaurant: rest, MenuItem: items };
    },
    solution: [
      "SELECT r.restaurant_id, r.restaurant_name,",
      "       COUNT(CASE WHEN m.diet = 'veg' THEN 1 END) AS veg_items,",
      "       COUNT(CASE WHEN m.diet = 'non_veg' THEN 1 END) AS non_veg_items,",
      "       COUNT(CASE WHEN m.diet = 'egg' THEN 1 END) AS egg_items",
      "FROM Restaurant r",
      "LEFT JOIN MenuItem m ON m.restaurant_id = r.restaurant_id AND m.is_available = 1",
      "GROUP BY r.restaurant_id, r.restaurant_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT r.restaurant_id, r.restaurant_name,",
        "  (SELECT COUNT(*) FROM MenuItem m WHERE m.restaurant_id = r.restaurant_id AND m.is_available = 1 AND m.diet = 'veg') AS veg_items,",
        "  (SELECT COUNT(*) FROM MenuItem m WHERE m.restaurant_id = r.restaurant_id AND m.is_available = 1 AND m.diet = 'non_veg') AS non_veg_items,",
        "  (SELECT COUNT(*) FROM MenuItem m WHERE m.restaurant_id = r.restaurant_id AND m.is_available = 1 AND m.diet = 'egg') AS egg_items",
        "FROM Restaurant r",
      ].join("\n"),
      [
        "SELECT r.restaurant_id, r.restaurant_name,",
        "       COALESCE(SUM(IF(a.diet = 'veg', 1, 0)), 0) AS veg_items,",
        "       COALESCE(SUM(IF(a.diet = 'non_veg', 1, 0)), 0) AS non_veg_items,",
        "       COALESCE(SUM(IF(a.diet = 'egg', 1, 0)), 0) AS egg_items",
        "FROM Restaurant r",
        "LEFT JOIN (SELECT restaurant_id, diet FROM MenuItem WHERE is_available = 1) a ON a.restaurant_id = r.restaurant_id",
        "GROUP BY r.restaurant_id, r.restaurant_name",
      ].join("\n"),
    ],
    hints: [
      "Every restaurant must appear, even one with nothing on the menu — which join keeps those?",
      "Counting three different things in one GROUP BY is conditional aggregation: `COUNT(CASE WHEN … THEN 1 END)`.",
      "Where does the `is_available = 1` test go? In `WHERE` it would throw away the restaurants with no available dish.",
    ],
    editorial: [
      "Start from `Restaurant`, because every restaurant must be in the answer, and `LEFT JOIN` its menu items. A restaurant with no matching item still produces one row whose `MenuItem` columns are all NULL.",
      "",
      "The availability test belongs in the **join condition**, not in `WHERE`. Put in `WHERE`, `m.is_available = 1` is NULL for the unmatched row and removes it, so a restaurant whose dishes are all switched off would vanish instead of showing zeros.",
      "",
      "Each count is then a conditional aggregate: `COUNT(CASE WHEN m.diet = 'veg' THEN 1 END)` counts only the rows where the `CASE` yields a value, and a NULL-padded row yields nothing, so it contributes 0. One pass over the joined rows gives all three columns.",
      "",
      "The alternatives use three correlated `COUNT(*)` subqueries (simple, but three probes per restaurant), and a pre-filtered derived table summed with `IF` — where the `COALESCE` matters, because `SUM` over only NULLs is NULL rather than 0.",
    ].join("\n"),
  },

  {
    slug: "zomato-gold-members-yet-to-use-a-benefit",
    title: "Zomato: Gold Members Yet to Use a Single Benefit",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries", "Dates"],
    description: [
      "Zomato Gold gives members free delivery and dining discounts. The membership team is planning a nudge for members who are paying for Gold but have never used it.",
      "",
      "Return the `membership_id` and `member_name` of every membership that is **active on 2024-06-30** (its `start_date` is on or before that day and its `end_date` on or after it) and has **no redemption at all** in `BenefitRedemption`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "GoldMembership",
        columns: [
          { name: "membership_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "member_name", type: "varchar" },
          { name: "plan", type: "enum", values: ["quarterly", "annual"] },
          { name: "start_date", type: "date" },
          { name: "end_date", type: "date" },
        ],
        primaryKey: ["membership_id"],
        note: "One row per Gold membership bought; both dates are inclusive.",
      },
      {
        name: "BenefitRedemption",
        columns: [
          { name: "redemption_id", type: "int" },
          { name: "membership_id", type: "int" },
          { name: "redeemed_on", type: "date" },
          { name: "benefit", type: "enum", values: ["free_delivery", "dining_discount"] },
        ],
        primaryKey: ["redemption_id"],
        note: "One row each time a member used a Gold benefit; `membership_id` always names a membership.",
      },
    ],
    examples: [
      {
        GoldMembership: [
          [1, 101, "Aarav", "annual", "2024-01-10", "2025-01-09"],
          [2, 102, "Diya", "quarterly", "2024-04-01", "2024-06-30"],
          [3, 103, "Kabir", "quarterly", "2024-06-30", "2024-09-29"],
          [4, 104, "Meera", "annual", "2023-05-01", "2024-04-30"],
          [5, 105, "Rohan", "annual", "2024-02-15", "2025-02-14"],
          [6, 106, "Zara", "quarterly", "2024-07-01", "2024-09-30"],
        ],
        BenefitRedemption: [
          [1, 1, "2024-03-02", "free_delivery"],
          [2, 5, "2024-05-20", "dining_discount"],
          [3, 5, "2024-06-01", "free_delivery"],
          [4, 4, "2024-03-01", "free_delivery"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 14);
      const who = names(rng, n);
      const members: Cell[][] = who.map((name, i) => {
        const quarterly = chance(rng, 0.5);
        const start = chance(rng, 0.15) ? pick(rng, ["2024-06-30", "2024-07-01"]) : dateBetween(rng, "2023-06-01", "2024-07-10");
        const end = chance(rng, 0.15) ? pick(rng, ["2024-06-30", "2024-06-29"]) : addDays(start, quarterly ? 90 : 364);
        return [i + 1, 100 + i + 1, name, quarterly ? "quarterly" : "annual", start, end < start ? start : end];
      });
      const k = n === 0 ? 0 : ri(rng, 0, 12);
      const used: Cell[][] = seq(1, k).map((id) => [id, ri(rng, 1, n), dateBetween(rng, "2023-06-01", "2024-06-30"), pick(rng, ["free_delivery", "dining_discount"])]);
      return { GoldMembership: members, BenefitRedemption: used };
    },
    solution: [
      "SELECT g.membership_id, g.member_name",
      "FROM GoldMembership g",
      "WHERE g.start_date <= '2024-06-30'",
      "  AND g.end_date >= '2024-06-30'",
      "  AND NOT EXISTS (SELECT 1 FROM BenefitRedemption b WHERE b.membership_id = g.membership_id)",
    ].join("\n"),
    alternatives: [
      [
        "SELECT g.membership_id, g.member_name",
        "FROM GoldMembership g",
        "LEFT JOIN BenefitRedemption b ON b.membership_id = g.membership_id",
        "WHERE '2024-06-30' BETWEEN g.start_date AND g.end_date",
        "  AND b.redemption_id IS NULL",
      ].join("\n"),
      "SELECT membership_id, member_name FROM GoldMembership WHERE start_date <= '2024-06-30' AND end_date >= '2024-06-30' AND membership_id NOT IN (SELECT membership_id FROM BenefitRedemption)",
    ],
    hints: [
      "\"Active on a day\" means the day lies inside the membership's start and end dates, both inclusive.",
      "\"Never used\" is an anti join: keep the memberships for which no redemption row exists.",
      "`NOT EXISTS`, `NOT IN` and `LEFT JOIN … IS NULL` are three ways to write it.",
    ],
    editorial: [
      "Two tests decide each membership. The first is a date range: a membership is active on 2024-06-30 when `start_date <= '2024-06-30'` and `end_date >= '2024-06-30'`. Both comparisons are inclusive, so a membership that starts or ends on that exact day counts, while one starting on 1 July does not.",
      "",
      "The second test is an **anti join** — there must be no row in `BenefitRedemption` for the membership. `NOT EXISTS` with a correlated subquery says exactly that and stops at the first redemption it finds. Redemptions are tied to the membership, not to the person, so a member's earlier, expired membership with plenty of use does not rescue the current one.",
      "",
      "The `LEFT JOIN … WHERE b.redemption_id IS NULL` version keeps the memberships whose join found nothing. `NOT IN` is safe here because `BenefitRedemption.membership_id` is never NULL; with a NULL in that list, `NOT IN` would return nothing at all, which is why `NOT EXISTS` is the habit to keep. With an index on `BenefitRedemption(membership_id)` each probe is a single lookup.",
    ].join("\n"),
  },

  {
    slug: "zomato-restaurant-page-url-slugs",
    title: "Zomato: Build the URL Slug of Every Restaurant Page",
    difficulty: "EASY",
    topics: ["Strings"],
    description: [
      "Each restaurant on Zomato has a web page whose address is built from its name, locality and city. The SEO team is rebuilding the addresses after an import left names in mixed case with stray spaces at the ends.",
      "",
      "Return `restaurant_id` and `page_slug` for every restaurant. The slug is the **trimmed** name, then the locality, then the city, each in **lower case** with every space replaced by a hyphen, joined by single hyphens. When `locality` is NULL the slug is just the name and the city. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Restaurant",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "locality", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["restaurant_id"],
        note: "Names may carry spaces at either end but never two spaces in a row inside; `locality` is NULL when it was never filled in, and has no stray spaces.",
      },
    ],
    examples: [
      {
        Restaurant: [
          [1, "Spice Route", "Koramangala", "Bengaluru"],
          [2, "THE Momo Point ", "Salt Lake", "Kolkata"],
          [3, "  Pind Dhaba", null, "Delhi"],
          [4, "Cafe Mocha Bay", "Bandra West", "Mumbai"],
          [5, "dosa darbar", "Banjara Hills", "Hyderabad"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const rows: Cell[][] = sample(rng, RESTAURANTS, n).map((name, i) => {
        const style = ri(rng, 0, 3);
        let shown: string = style === 1 ? name.toUpperCase() : style === 2 ? name.toLowerCase() : name;
        if (chance(rng, 0.3)) shown = " " + shown;
        if (chance(rng, 0.3)) shown = shown + "  ";
        return [i + 1, shown, chance(rng, 0.25) ? null : pick(rng, LOCALITIES), pick(rng, CITIES)];
      });
      return { Restaurant: rows };
    },
    solution: [
      "SELECT restaurant_id,",
      "       CONCAT_WS('-',",
      "                 LOWER(REPLACE(TRIM(name), ' ', '-')),",
      "                 LOWER(REPLACE(locality, ' ', '-')),",
      "                 LOWER(city)) AS page_slug",
      "FROM Restaurant",
    ].join("\n"),
    alternatives: [
      [
        "SELECT restaurant_id,",
        "       CASE WHEN locality IS NULL",
        "            THEN LCASE(REPLACE(CONCAT(TRIM(name), ' ', city), ' ', '-'))",
        "            ELSE LCASE(REPLACE(CONCAT(TRIM(name), ' ', locality, ' ', city), ' ', '-'))",
        "       END AS page_slug",
        "FROM Restaurant",
      ].join("\n"),
    ],
    hints: [
      "Clean the name first: `TRIM` removes the spaces at the ends, `LOWER` fixes the case.",
      "`REPLACE(x, ' ', '-')` turns the remaining spaces into hyphens.",
      "`CONCAT` returns NULL if any part is NULL; `CONCAT_WS` simply skips NULL parts.",
    ],
    editorial: [
      "The slug is three cleaned parts glued with hyphens. Each part gets the same treatment — lower case, spaces to hyphens — and the name additionally needs `TRIM`, because a leading or trailing space would otherwise become a hyphen at the start or a double hyphen in the middle of the slug.",
      "",
      "The missing locality is the interesting case. `CONCAT(name, '-', locality, '-', city)` would return NULL for the whole slug when `locality` is NULL, which is MySQL's rule for `CONCAT`. `CONCAT_WS('-', …)` puts the separator only between the non-NULL arguments, so a NULL locality simply drops out and the slug becomes `name-city` with no stray hyphen. `REPLACE` and `LOWER` of a NULL are NULL too, so the locality stays NULL all the way into `CONCAT_WS`.",
      "",
      "The alternative branches on the NULL with `CASE`, builds the spaced phrase first and replaces every space at once — it works because the parts themselves have no doubled spaces. Both are one pass over the table with string functions per row.",
    ].join("\n"),
  },

  {
    slug: "zomato-feeding-india-cities-raising-50000",
    title: "Zomato: Feeding India Cities That Raised ₹50,000",
    difficulty: "EASY",
    topics: ["Aggregation", "Dates"],
    description: [
      "Customers can add a donation to Feeding India at checkout. For the annual impact report the foundation's team wants the cities whose donors gave the most in 2024.",
      "",
      "Consider only donations with status `success` made **in 2024**. Return each city whose total is **at least 50000**, with the columns `city`, `total_raised` and `donors` (the number of distinct donors behind those donations). Order by `total_raised` descending, then `city` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Donation",
        columns: [
          { name: "donation_id", type: "int" },
          { name: "donor_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "amount", type: "int" },
          { name: "donated_on", type: "date" },
          { name: "status", type: "enum", values: ["success", "failed", "refunded"] },
        ],
        primaryKey: ["donation_id"],
        note: "One row per donation attempt, in rupees. A donor gives from one city.",
      },
    ],
    examples: [
      {
        Donation: [
          [1, 11, "Mumbai", 25000, "2024-01-15", "success"],
          [2, 12, "Mumbai", 25000, "2024-03-02", "success"],
          [3, 11, "Mumbai", 10000, "2024-05-10", "success"],
          [4, 13, "Delhi", 40000, "2024-02-11", "success"],
          [5, 14, "Delhi", 20000, "2024-02-12", "failed"],
          [6, 15, "Delhi", 30000, "2023-12-31", "success"],
          [7, 16, "Pune", 50000, "2024-12-31", "success"],
          [8, 17, "Kochi", 30000, "2024-06-01", "success"],
          [9, 18, "Kochi", 30000, "2024-06-02", "refunded"],
          [10, 19, "Kochi", 30000, "2024-07-01", "success"],
        ],
      },
    ],
    gen: (rng) => {
      const cities = sample(rng, CITIES, ri(rng, 1, 5));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 24);
      const donorCity = new Map<number, string>();
      const rows: Cell[][] = seq(1, n).map((id) => {
        const donor = ri(rng, 1, 12);
        if (!donorCity.has(donor)) donorCity.set(donor, pick(rng, cities));
        return [
          id,
          donor,
          donorCity.get(donor)!,
          chance(rng, 0.2) ? pick(rng, [25000, 50000]) : roundTo(rng, 2000, 30000, 1000),
          chance(rng, 0.15) ? pick(rng, ["2023-12-31", "2024-01-01", "2024-12-31", "2025-01-01"]) : dateBetween(rng, "2024-01-01", "2024-12-31"),
          pick(rng, ["success", "success", "success", "failed", "refunded"]),
        ];
      });
      return { Donation: rows };
    },
    solution: [
      "SELECT city, SUM(amount) AS total_raised, COUNT(DISTINCT donor_id) AS donors",
      "FROM Donation",
      "WHERE status = 'success'",
      "  AND donated_on BETWEEN '2024-01-01' AND '2024-12-31'",
      "GROUP BY city",
      "HAVING SUM(amount) >= 50000",
      "ORDER BY total_raised DESC, city",
    ].join("\n"),
    alternatives: [
      [
        "SELECT city, total_raised, donors FROM (",
        "  SELECT city, SUM(amount) AS total_raised, COUNT(DISTINCT donor_id) AS donors",
        "  FROM Donation WHERE status = 'success' AND YEAR(donated_on) = 2024",
        "  GROUP BY city",
        ") t",
        "WHERE total_raised >= 50000",
        "ORDER BY total_raised DESC, city ASC",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Throw away failed and refunded attempts and other years before adding anything up.",
      "A condition on a group's total belongs in `HAVING`, not `WHERE`.",
      "One donor can give several times — count them with `COUNT(DISTINCT …)`.",
    ],
    editorial: [
      "The shape is filter → group → filter the groups. `WHERE` keeps only successful donations dated in 2024, so a failed attempt, a refund or a gift made on 31 December 2023 never reaches a total. `GROUP BY city` then forms one group per city, and `SUM(amount)` is the money it raised.",
      "",
      "The threshold is about a group's total, which does not exist until the rows are grouped, so it goes in `HAVING SUM(amount) >= 50000`. The comparison is inclusive: a city that raised exactly 50,000 is in.",
      "",
      "`donors` must count people, not donations — a donor who gave twice is one donor — hence `COUNT(DISTINCT donor_id)`. Totals often tie, so the order uses `city` as the second key.",
      "",
      "The alternative groups in a derived table and filters its output with an ordinary `WHERE`, testing the year with `YEAR()`; both are a single scan, though the date range can use an index and `YEAR()` cannot.",
    ].join("\n"),
  },

  {
    slug: "zomato-district-sold-out-movie-shows",
    title: "Zomato: Sold-Out Movie Shows on District",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "District sells movie tickets for cinemas. The programming team wants to know which shows sold every seat so it can add extra screenings of those films.",
      "",
      "A show is **sold out** when the seats of its `confirmed` bookings add up to **at least its capacity**; cancelled bookings free their seats. Return `show_id`, `movie_title` and `show_time` of every sold-out show, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "MovieShow",
        columns: [
          { name: "show_id", type: "int" },
          { name: "movie_title", type: "varchar" },
          { name: "screen", type: "varchar" },
          { name: "show_time", type: "datetime" },
          { name: "capacity", type: "int" },
        ],
        primaryKey: ["show_id"],
        note: "One row per screening; `capacity` is the number of seats on sale.",
      },
      {
        name: "TicketBooking",
        columns: [
          { name: "booking_id", type: "int" },
          { name: "show_id", type: "int" },
          { name: "seats", type: "int" },
          { name: "status", type: "enum", values: ["confirmed", "cancelled"] },
        ],
        primaryKey: ["booking_id"],
        note: "One row per booking of one or more seats in a show.",
      },
    ],
    examples: [
      {
        MovieShow: [
          [1, "Monsoon Express", "Audi 1", "2024-08-15 18:30:00", 6],
          [2, "Monsoon Express", "Audi 2", "2024-08-15 21:00:00", 4],
          [3, "The Last Over", "Audi 1", "2024-08-16 14:00:00", 5],
          [4, "Chai and Chaos", "Audi 3", "2024-08-16 22:00:00", 3],
        ],
        TicketBooking: [
          [1, 1, 4, "confirmed"],
          [2, 1, 2, "confirmed"],
          [3, 2, 4, "cancelled"],
          [4, 2, 3, "confirmed"],
          [5, 3, 5, "confirmed"],
        ],
      },
    ],
    gen: (rng) => {
      const s = ri(rng, 1, 7);
      const titles = ["Monsoon Express", "The Last Over", "Chai and Chaos", "Neon Mumbai", "Ghost of Goa"];
      const shows: Cell[][] = seq(1, s).map((id) => [id, pick(rng, titles), `Audi ${ri(rng, 1, 4)}`, at(dateBetween(rng, "2024-08-10", "2024-08-20"), ri(rng, 600, 1380)), ri(rng, 2, 8)]);
      const rows: Cell[][] = [];
      let id = 1;
      for (const sh of shows) {
        const cap = sh[4] as number;
        // Aim near the capacity so the boundary is hit often.
        let left = chance(rng, 0.55) ? cap : cap - ri(rng, 1, 2);
        while (left > 0 && chance(rng, 0.95)) {
          const seats = ri(rng, 1, Math.min(4, left));
          const status = chance(rng, 0.2) ? "cancelled" : "confirmed";
          rows.push([id++, sh[0]!, seats, status]);
          if (status === "confirmed") left -= seats;
        }
      }
      return { MovieShow: shows, TicketBooking: shuffle(rng, rows) };
    },
    solution: [
      "SELECT s.show_id, s.movie_title, s.show_time",
      "FROM MovieShow s",
      "JOIN TicketBooking b ON b.show_id = s.show_id AND b.status = 'confirmed'",
      "GROUP BY s.show_id, s.movie_title, s.show_time, s.capacity",
      "HAVING SUM(b.seats) >= s.capacity",
    ].join("\n"),
    alternatives: [
      [
        "SELECT show_id, movie_title, show_time",
        "FROM MovieShow s",
        "WHERE capacity <= (SELECT SUM(seats) FROM TicketBooking b WHERE b.show_id = s.show_id AND b.status = 'confirmed')",
      ].join("\n"),
    ],
    hints: [
      "Add up the confirmed seats of each show, then compare the sum with that show's capacity.",
      "The comparison is on a group's sum, so it belongs in `HAVING`.",
      "A show with no confirmed booking can never be sold out — an inner join drops it for free.",
    ],
    editorial: [
      "Join each show to its **confirmed** bookings and group by show. `SUM(b.seats)` is then the number of seats taken, and `HAVING SUM(b.seats) >= s.capacity` keeps the full shows. `capacity` is listed in `GROUP BY` so it can be used in `HAVING` under MySQL's ONLY_FULL_GROUP_BY mode; it is one value per show anyway.",
      "",
      "Cancelled bookings are excluded in the join condition, so they free their seats as the statement says. A show whose bookings were all cancelled, or that sold nothing, finds no confirmed row, forms no group and is not reported — correct, since it has empty seats.",
      "",
      "The alternative compares the capacity with a correlated `SUM` subquery. For a show with no confirmed booking the subquery returns NULL, `capacity <= NULL` is not true, and the show is dropped the same way. Either query reads each booking once; an index on `TicketBooking(show_id)` makes the subquery version a lookup per show.",
    ].join("\n"),
  },

  {
    slug: "zomato-blinkit-store-items-below-reorder-level",
    title: "Zomato: Blinkit Store Items Below Their Reorder Level",
    difficulty: "EASY",
    topics: ["Joins", "Conditional Logic"],
    description: [
      "A Blinkit dark store reorders an item when its stock falls below the item's reorder level. The store manager wants the morning reorder list.",
      "",
      "For every **active** product (`is_active = 1`) whose units on hand are **below** its `reorder_level`, return `product_name`, `on_hand` and `shortfall` (`reorder_level - on_hand`). A product with **no row** in `StoreStock` has 0 units on hand. Order by `shortfall` descending, then `product_name` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Product",
        columns: [
          { name: "product_id", type: "int" },
          { name: "product_name", type: "varchar" },
          { name: "reorder_level", type: "int" },
          { name: "is_active", type: "bool" },
        ],
        primaryKey: ["product_id"],
        note: "The store's catalogue; `reorder_level` is always at least 1. Product names are unique.",
      },
      {
        name: "StoreStock",
        columns: [
          { name: "product_id", type: "int" },
          { name: "on_hand", type: "int" },
        ],
        primaryKey: ["product_id"],
        note: "Units on the shelves at opening. A product that was never stocked has no row.",
      },
    ],
    examples: [
      {
        Product: [
          [1, "Toned Milk", 40, 1],
          [2, "Brown Bread", 30, 1],
          [3, "Farm Eggs", 20, 1],
          [4, "Bananas", 25, 1],
          [5, "Instant Noodles", 10, 1],
          [6, "Paneer Block", 12, 0],
          [7, "Cola Bottle", 24, 1],
        ],
        StoreStock: [
          [1, 25],
          [2, 30],
          [3, 5],
          [4, 60],
          [7, 50],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const prods: Cell[][] = sample(rng, GROCERIES, n).map((name, i) => [i + 1, name, roundTo(rng, 5, 40, 5), chance(rng, 0.85) ? 1 : 0]);
      const stock: Cell[][] = [];
      for (const p of prods) {
        if (chance(rng, 0.2)) continue;
        const level = p[2] as number;
        stock.push([p[0]!, chance(rng, 0.2) ? level : Math.max(0, level + ri(rng, -20, 20))]);
      }
      return { Product: prods, StoreStock: stock };
    },
    solution: [
      "SELECT p.product_name,",
      "       COALESCE(s.on_hand, 0) AS on_hand,",
      "       p.reorder_level - COALESCE(s.on_hand, 0) AS shortfall",
      "FROM Product p",
      "LEFT JOIN StoreStock s ON s.product_id = p.product_id",
      "WHERE p.is_active = 1",
      "  AND COALESCE(s.on_hand, 0) < p.reorder_level",
      "ORDER BY shortfall DESC, p.product_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT product_name, on_hand, reorder_level - on_hand AS shortfall FROM (",
        "  SELECT p.product_name, p.reorder_level, p.is_active,",
        "         IFNULL((SELECT s.on_hand FROM StoreStock s WHERE s.product_id = p.product_id), 0) AS on_hand",
        "  FROM Product p",
        ") t",
        "WHERE is_active = 1 AND on_hand < reorder_level",
        "ORDER BY shortfall DESC, product_name ASC",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Every active product must be considered, stocked or not — start from `Product` and keep the unmatched rows.",
      "Turn a missing stock row into 0 with `COALESCE` (or `IFNULL`).",
      "\"Below\" is strict: a product exactly at its reorder level is not on the list.",
    ],
    editorial: [
      "Products that were never stocked are the ones most in need of a reorder, yet they have no `StoreStock` row, so an inner join would silently drop them. A `LEFT JOIN` from `Product` keeps them with `s.on_hand` NULL, and `COALESCE(s.on_hand, 0)` turns that NULL into the 0 the statement asks for.",
      "",
      "The filter then keeps active products whose (defaulted) stock is strictly below the reorder level. Writing the test on `s.on_hand` directly would be wrong: `NULL < 40` is NULL, not true, and the never-stocked items would vanish again. The shortfall is the level minus the defaulted stock, and the order is by shortfall with the name as the tie-breaker.",
      "",
      "The alternative fetches each product's stock with a scalar subquery wrapped in `IFNULL`, then filters in an outer query. Both make one pass over the catalogue with a key lookup per product.",
    ].join("\n"),
  },

  {
    slug: "zomato-hyperpure-invoices-paid-late",
    title: "Zomato: Hyperpure Invoices Paid Late or Still Overdue",
    difficulty: "EASY",
    topics: ["Dates", "Joins", "Conditional Logic"],
    description: [
      "Hyperpure supplies vegetables, meat and groceries to restaurants on credit, and each invoice has a due date. On 2024-08-31 the collections team wants every invoice that was, or still is, late.",
      "",
      "An invoice's lateness is the days from `due_on` to `paid_on`; for an **unpaid** invoice (`paid_on` NULL) it is the days from `due_on` to **2024-08-31**. Return the invoices whose lateness is **greater than 0**, with `invoice_id`, `restaurant_name`, `amount` and `days_late`. Order by `days_late` descending, then `invoice_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Restaurant",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "restaurant_name", type: "varchar" },
        ],
        primaryKey: ["restaurant_id"],
        note: "One row per restaurant buying from Hyperpure.",
      },
      {
        name: "Invoice",
        columns: [
          { name: "invoice_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "due_on", type: "date" },
          { name: "paid_on", type: "date" },
        ],
        primaryKey: ["invoice_id"],
        note: "Amounts in rupees. `paid_on` is NULL while the invoice is unpaid; no invoice was paid after 2024-08-31.",
      },
    ],
    examples: [
      {
        Restaurant: [
          [1, "Spice Route"],
          [2, "Biryani House"],
          [3, "Chaat Junction"],
        ],
        Invoice: [
          [501, 1, 18500, "2024-07-10", "2024-07-15"],
          [502, 1, 9200, "2024-08-05", null],
          [503, 2, 30400, "2024-08-20", "2024-08-20"],
          [504, 2, 12000, "2024-09-05", null],
          [505, 3, 7600, "2024-08-26", "2024-08-31"],
          [506, 3, 4100, "2024-07-01", "2024-06-28"],
        ],
      },
    ],
    gen: (rng) => {
      const r = ri(rng, 1, 5);
      const rest: Cell[][] = sample(rng, RESTAURANTS, r).map((name, i) => [i + 1, name]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 16);
      const rows: Cell[][] = seq(501, n).map((id) => {
        const due = chance(rng, 0.1) ? pick(rng, ["2024-08-31", "2024-09-01"]) : dateBetween(rng, "2024-06-15", "2024-09-15");
        let paid: string | null = null;
        if (chance(rng, 0.65)) {
          const p = addDays(due, chance(rng, 0.25) ? 0 : ri(rng, -6, 20));
          paid = p > "2024-08-31" ? null : p;
        }
        return [id, ri(rng, 1, r), roundTo(rng, 2000, 40000, 100), due, paid];
      });
      return { Restaurant: rest, Invoice: rows };
    },
    solution: [
      "SELECT i.invoice_id, r.restaurant_name, i.amount,",
      "       DATEDIFF(COALESCE(i.paid_on, '2024-08-31'), i.due_on) AS days_late",
      "FROM Invoice i",
      "JOIN Restaurant r ON r.restaurant_id = i.restaurant_id",
      "WHERE DATEDIFF(COALESCE(i.paid_on, '2024-08-31'), i.due_on) > 0",
      "ORDER BY days_late DESC, i.invoice_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT invoice_id, restaurant_name, amount, days_late FROM (",
        "  SELECT i.invoice_id, r.restaurant_name, i.amount,",
        "         CASE WHEN i.paid_on IS NULL THEN DATEDIFF('2024-08-31', i.due_on)",
        "              ELSE DATEDIFF(i.paid_on, i.due_on) END AS days_late",
        "  FROM Invoice i, Restaurant r WHERE r.restaurant_id = i.restaurant_id",
        ") t",
        "WHERE days_late > 0",
        "ORDER BY days_late DESC, invoice_id ASC",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "An unpaid invoice is measured up to the report date — substitute that date for the missing `paid_on`.",
      "`COALESCE(paid_on, '2024-08-31')` does the substitution in one expression.",
      "Paid exactly on the due date is 0 days late, and an unpaid invoice not yet due comes out negative — neither is reported.",
    ],
    editorial: [
      "Both kinds of late invoice reduce to one number once the missing payment date is replaced by the report date: `COALESCE(paid_on, '2024-08-31')` is the day the lateness is measured to, and `DATEDIFF` of that and `due_on` is the lateness in days.",
      "",
      "Keeping only `days_late > 0` handles every other case in one test. An invoice paid on or before its due date gives 0 or a negative number; an unpaid invoice that is not due until September gives a negative number too, since 31 August is before its due date. Neither is late.",
      "",
      "The same expression appears in `SELECT` and `WHERE` because a column alias cannot be used in `WHERE`; the alternative computes `days_late` once in a derived table with an explicit `CASE` and filters the outer query instead. The order is fixed by lateness with `invoice_id` breaking ties. Both versions scan the invoices once and join each to its restaurant by key.",
    ].join("\n"),
  },

  // ──────────────────────────── MEDIUM ────────────────────────────
  {
    slug: "zomato-gold-renewal-rate-by-plan",
    title: "Zomato: Gold Membership Renewal Rate by Plan",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Conditional Logic", "Dates"],
    description: [
      "The Zomato Gold team tracks how many members renew when a membership runs out, separately for the quarterly and the annual plan.",
      "",
      "A membership is **eligible** when its `end_date` is **on or before 2024-06-30**. It is **renewed** when the same user has another membership whose `start_date` is **after this one's `start_date`** and **no later than 7 days after this one's `end_date`** (an early renewal that overlaps counts). For each plan with at least one eligible membership, return `plan`, `ended` (eligible memberships), `renewed` (how many of them were renewed — each counted once, however many follow-ups it has) and `renewal_rate_pct` = 100 × renewed / ended rounded to 2 decimals. The plan is that of the ending membership. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "GoldMembership",
        columns: [
          { name: "membership_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "plan", type: "enum", values: ["quarterly", "annual"] },
          { name: "start_date", type: "date" },
          { name: "end_date", type: "date" },
        ],
        primaryKey: ["membership_id"],
        note: "One row per membership bought; both dates inclusive. A user may hold several over time.",
      },
    ],
    examples: [
      {
        GoldMembership: [
          [1, 1, "quarterly", "2024-01-01", "2024-03-31"],
          [2, 1, "quarterly", "2024-04-05", "2024-07-04"],
          [3, 2, "annual", "2023-03-01", "2024-02-29"],
          [4, 2, "quarterly", "2024-03-08", "2024-06-07"],
          [5, 3, "quarterly", "2024-02-01", "2024-04-30"],
          [6, 3, "annual", "2024-05-07", "2025-05-06"],
          [7, 4, "annual", "2023-06-01", "2024-05-31"],
          [8, 5, "quarterly", "2024-01-15", "2024-04-14"],
          [9, 5, "quarterly", "2024-03-20", "2024-06-19"],
        ],
      },
    ],
    gen: (rng) => {
      const users = ri(rng, 1, 8);
      const rows: Cell[][] = [];
      let id = 1;
      for (let u = 1; u <= users; u++) {
        let start = dateBetween(rng, "2023-01-01", "2024-03-01");
        const k = ri(rng, 1, 3);
        for (let j = 0; j < k && rows.length < 22; j++) {
          const quarterly = chance(rng, 0.6);
          const end = addDays(start, quarterly ? 90 : 364);
          rows.push([id++, u, quarterly ? "quarterly" : "annual", start, end]);
          // Next one: early, on the edge (7 or 8 days later), or after a long gap.
          start = addDays(end, pick(rng, [-15, -3, 1, 4, 7, 8, 20, 60]));
        }
      }
      return { GoldMembership: rows };
    },
    solution: [
      "SELECT g.plan,",
      "       COUNT(*) AS ended,",
      "       SUM(CASE WHEN EXISTS (",
      "             SELECT 1 FROM GoldMembership n",
      "             WHERE n.user_id = g.user_id",
      "               AND n.start_date > g.start_date",
      "               AND n.start_date <= DATE_ADD(g.end_date, INTERVAL 7 DAY)",
      "           ) THEN 1 ELSE 0 END) AS renewed,",
      "       ROUND(100 * SUM(CASE WHEN EXISTS (",
      "             SELECT 1 FROM GoldMembership n",
      "             WHERE n.user_id = g.user_id",
      "               AND n.start_date > g.start_date",
      "               AND n.start_date <= DATE_ADD(g.end_date, INTERVAL 7 DAY)",
      "           ) THEN 1 ELSE 0 END) / COUNT(*), 2) AS renewal_rate_pct",
      "FROM GoldMembership g",
      "WHERE g.end_date <= '2024-06-30'",
      "GROUP BY g.plan",
    ].join("\n"),
    alternatives: [
      [
        "WITH flagged AS (",
        "  SELECT g.membership_id, g.plan,",
        "         MAX(CASE WHEN n.membership_id IS NULL THEN 0 ELSE 1 END) AS is_renewed",
        "  FROM GoldMembership g",
        "  LEFT JOIN GoldMembership n",
        "    ON n.user_id = g.user_id",
        "   AND n.start_date > g.start_date",
        "   AND n.start_date <= DATE_ADD(g.end_date, INTERVAL 7 DAY)",
        "  WHERE g.end_date <= '2024-06-30'",
        "  GROUP BY g.membership_id, g.plan",
        ")",
        "SELECT plan, COUNT(*) AS ended, SUM(is_renewed) AS renewed,",
        "       ROUND(100 * SUM(is_renewed) / COUNT(*), 2) AS renewal_rate_pct",
        "FROM flagged",
        "GROUP BY plan",
      ].join("\n"),
    ],
    hints: [
      "First decide, for each eligible membership on its own, whether it was renewed — a yes/no per row.",
      "The follow-up is another row of the same table for the same user: a self join or an `EXISTS` subquery.",
      "A plain join would count a membership twice if two later memberships both qualify — collapse to one flag per membership before summing.",
      "The window ends at `DATE_ADD(end_date, INTERVAL 7 DAY)`, inclusive.",
    ],
    editorial: [
      "The question has two levels: a yes/no for each eligible membership, then a count of yeses per plan. Keeping those levels apart is the whole difficulty.",
      "",
      "A membership is eligible when it has ended by 30 June (`end_date <= '2024-06-30'`), so its outcome is known. It is renewed when **some** other membership of the same user starts after it began and no later than seven days after it ended. `EXISTS` asks precisely \"is there at least one such row\", so a membership with two qualifying follow-ups still counts once. Requiring the follow-up to start after `g.start_date` excludes the membership itself and lets an early, overlapping renewal count.",
      "",
      "`SUM(CASE WHEN EXISTS (…) THEN 1 ELSE 0 END)` turns the flags into the renewed count, `COUNT(*)` is the eligible count, and the rate is their ratio × 100, rounded. Plans with no eligible membership form no group and are left out.",
      "",
      "The alternative self-joins with `LEFT JOIN` and collapses the matches with `MAX(…)` per membership before aggregating by plan — the explicit version of the de-duplication `EXISTS` does for free. A naive `COUNT(n.membership_id)` without that step would over-count. With an index on `(user_id, start_date)` each check is a short range scan.",
    ].join("\n"),
  },

  {
    slug: "zomato-cost-per-order-of-promoted-listings",
    title: "Zomato: Cost per Order of Each Promoted Listing",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Dates"],
    description: [
      "Restaurants pay Zomato to appear as promoted listings, and the ads sales team reports what each campaign cost per order it brought in.",
      "",
      "An order is **attributed** to a campaign when it was placed at the campaign's restaurant, has `from_ad = 1`, and its `ordered_on` falls **within the campaign's dates (inclusive)**; an order inside two overlapping campaigns of one restaurant counts for both. For **every** campaign return `campaign_id`, `restaurant_name`, `ad_orders` (attributed orders) and `cost_per_order` = `spend / ad_orders` rounded to 2 decimals — NULL when the campaign has no attributed order. Order by `campaign_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Restaurant",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "restaurant_name", type: "varchar" },
        ],
        primaryKey: ["restaurant_id"],
        note: "One row per restaurant.",
      },
      {
        name: "AdCampaign",
        columns: [
          { name: "campaign_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "start_date", type: "date" },
          { name: "end_date", type: "date" },
          { name: "spend", type: "int" },
        ],
        primaryKey: ["campaign_id"],
        note: "One row per promoted-listing campaign; `spend` is the rupees billed for it.",
      },
      {
        name: "FoodOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "ordered_on", type: "date" },
          { name: "from_ad", type: "bool" },
        ],
        primaryKey: ["order_id"],
        note: "One row per order; `from_ad` is 1 when the customer reached the restaurant by tapping its promoted listing.",
      },
    ],
    examples: [
      {
        Restaurant: [
          [1, "Pasta Street"],
          [2, "Momo Point"],
          [3, "Thali Theatre"],
        ],
        AdCampaign: [
          [1, 1, "2024-05-01", "2024-05-07", 3000],
          [2, 2, "2024-05-03", "2024-05-05", 1500],
          [3, 1, "2024-05-20", "2024-05-21", 800],
          [4, 3, "2024-05-10", "2024-05-12", 1200],
        ],
        FoodOrder: [
          [1, 1, "2024-05-01", 1],
          [2, 1, "2024-05-07", 1],
          [3, 1, "2024-05-04", 0],
          [4, 1, "2024-05-08", 1],
          [5, 2, "2024-05-03", 1],
          [6, 2, "2024-05-04", 1],
          [7, 2, "2024-05-05", 1],
          [8, 3, "2024-05-11", 0],
          [9, 1, "2024-05-21", 1],
        ],
      },
    ],
    gen: (rng) => {
      const r = ri(rng, 1, 4);
      const rest: Cell[][] = sample(rng, RESTAURANTS, r).map((name, i) => [i + 1, name]);
      const c = ri(rng, 1, 6);
      const camps: Cell[][] = seq(1, c).map((id) => {
        const s = dateBetween(rng, "2024-05-01", "2024-05-25");
        return [id, ri(rng, 1, r), s, addDays(s, ri(rng, 0, 6)), roundTo(rng, 500, 6000, 100)];
      });
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 25);
      const orders: Cell[][] = seq(1, n).map((id) => [id, ri(rng, 1, r), dateBetween(rng, "2024-04-29", "2024-06-02"), chance(rng, 0.7) ? 1 : 0]);
      return { Restaurant: rest, AdCampaign: camps, FoodOrder: orders };
    },
    solution: [
      "SELECT c.campaign_id, r.restaurant_name,",
      "       COUNT(o.order_id) AS ad_orders,",
      "       ROUND(c.spend / NULLIF(COUNT(o.order_id), 0), 2) AS cost_per_order",
      "FROM AdCampaign c",
      "JOIN Restaurant r ON r.restaurant_id = c.restaurant_id",
      "LEFT JOIN FoodOrder o",
      "  ON o.restaurant_id = c.restaurant_id",
      " AND o.from_ad = 1",
      " AND o.ordered_on BETWEEN c.start_date AND c.end_date",
      "GROUP BY c.campaign_id, r.restaurant_name, c.spend",
      "ORDER BY c.campaign_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT campaign_id, restaurant_name, ad_orders,",
        "       CASE WHEN ad_orders = 0 THEN NULL ELSE ROUND(spend / ad_orders, 2) END AS cost_per_order",
        "FROM (",
        "  SELECT c.campaign_id, r.restaurant_name, c.spend,",
        "         (SELECT COUNT(*) FROM FoodOrder o",
        "          WHERE o.restaurant_id = c.restaurant_id AND o.from_ad = 1",
        "            AND o.ordered_on >= c.start_date AND o.ordered_on <= c.end_date) AS ad_orders",
        "  FROM AdCampaign c JOIN Restaurant r ON r.restaurant_id = c.restaurant_id",
        ") t",
        "ORDER BY campaign_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Every campaign must appear, so the orders are joined with a `LEFT JOIN` — and all the attribution rules go in its `ON` clause.",
      "Count `o.order_id`, not `*`, or a campaign with no orders counts its NULL-padded row as one.",
      "Dividing by `NULLIF(x, 0)` gives NULL instead of an error when x is 0.",
    ],
    editorial: [
      "Each campaign is matched with the orders it earned: same restaurant, `from_ad = 1`, and `ordered_on BETWEEN start_date AND end_date`. Those three conditions all belong in the `ON` clause of a `LEFT JOIN`, so that a campaign that earned nothing still contributes one row with NULL order columns. Moved into `WHERE`, they would delete that row and the campaign with it.",
      "",
      "After grouping by campaign, `COUNT(o.order_id)` counts only real matches — it skips the NULL of the padded row, so an empty campaign shows 0, where `COUNT(*)` would wrongly show 1. The cost per order is `spend / ad_orders`; dividing by `NULLIF(COUNT(o.order_id), 0)` turns the zero case into NULL, as the statement asks. `spend` is in the `GROUP BY` so it can be used beside the aggregate.",
      "",
      "Overlapping campaigns of one restaurant each join to the shared orders independently, so such an order counts for both — that is the stated rule. The alternative counts with a correlated subquery per campaign and handles zero with `CASE`. Both are a range probe per campaign with an index on `FoodOrder(restaurant_id, ordered_on)`.",
    ].join("\n"),
  },

  {
    slug: "zomato-best-rated-dining-spot-in-each-locality",
    title: "Zomato: Best-Rated Dining Spot in Each Locality",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation", "Joins"],
    description: [
      "Zomato's dining-out collections feature the best-rated place in every neighbourhood. Ratings come from diners who reviewed a restaurant after eating there.",
      "",
      "Only restaurants with **at least 3 dining reviews** qualify. In each `locality`, return the qualifying restaurant(s) with the **highest average rating** — if several share the top average, return all of them. Return `locality`, `restaurant_name`, `avg_rating` (rounded to 2 decimals) and `reviews`, in any order. A locality with no qualifying restaurant does not appear.",
    ].join("\n"),
    tables: [
      {
        name: "Restaurant",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "restaurant_name", type: "varchar" },
          { name: "locality", type: "varchar" },
        ],
        primaryKey: ["restaurant_id"],
        note: "One row per restaurant.",
      },
      {
        name: "DiningReview",
        columns: [
          { name: "review_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "rating", type: "int" },
          { name: "visited_on", type: "date" },
        ],
        primaryKey: ["review_id"],
        note: "One row per dining review; `rating` is 1 to 5 stars.",
      },
    ],
    examples: [
      {
        Restaurant: [
          [1, "Spice Route", "Koramangala"],
          [2, "Wok Express", "Koramangala"],
          [3, "Thali Theatre", "Koramangala"],
          [4, "Pasta Street", "Indiranagar"],
          [5, "Paratha Lane", "Indiranagar"],
          [6, "Momo Point", "HSR Layout"],
        ],
        DiningReview: [
          [1, 1, 5, "2024-03-01"], [2, 1, 4, "2024-03-04"], [3, 1, 4, "2024-03-09"],
          [4, 2, 5, "2024-03-02"], [5, 2, 5, "2024-03-05"],
          [6, 3, 4, "2024-03-03"], [7, 3, 5, "2024-03-06"], [8, 3, 4, "2024-03-08"],
          [9, 4, 3, "2024-03-01"], [10, 4, 4, "2024-03-02"], [11, 4, 5, "2024-03-07"], [12, 4, 4, "2024-03-10"],
          [13, 5, 4, "2024-03-04"], [14, 5, 4, "2024-03-05"], [15, 5, 4, "2024-03-11"],
          [16, 6, 2, "2024-03-02"], [17, 6, 3, "2024-03-12"],
        ],
      },
    ],
    gen: (rng) => {
      const r = ri(rng, 1, 7);
      const locs = sample(rng, LOCALITIES, ri(rng, 1, 3));
      const rest: Cell[][] = sample(rng, RESTAURANTS, r).map((name, i) => [i + 1, name, pick(rng, locs)]);
      const rows: Cell[][] = [];
      let id = 1;
      // A shared rating pattern now and then, so equal averages (ties) happen.
      const pattern = [ri(rng, 3, 5), ri(rng, 3, 5), ri(rng, 2, 5)];
      for (const x of rest) {
        const k = ri(rng, 0, 6);
        const same = chance(rng, 0.3);
        for (let j = 0; j < k; j++) rows.push([id++, x[0]!, same ? pattern[j % 3]! : ri(rng, 1, 5), dateBetween(rng, "2024-03-01", "2024-03-31")]);
      }
      return { Restaurant: rest, DiningReview: shuffle(rng, rows) };
    },
    solution: [
      "WITH scored AS (",
      "  SELECT r.locality, r.restaurant_name, AVG(d.rating) AS avg_raw, COUNT(*) AS reviews",
      "  FROM Restaurant r",
      "  JOIN DiningReview d ON d.restaurant_id = r.restaurant_id",
      "  GROUP BY r.restaurant_id, r.locality, r.restaurant_name",
      "  HAVING COUNT(*) >= 3",
      "),",
      "ranked AS (",
      "  SELECT locality, restaurant_name, avg_raw, reviews,",
      "         RANK() OVER (PARTITION BY locality ORDER BY avg_raw DESC) AS pos",
      "  FROM scored",
      ")",
      "SELECT locality, restaurant_name, ROUND(avg_raw, 2) AS avg_rating, reviews",
      "FROM ranked",
      "WHERE pos = 1",
    ].join("\n"),
    alternatives: [
      [
        "WITH scored AS (",
        "  SELECT r.locality, r.restaurant_name, SUM(d.rating) AS total, COUNT(*) AS reviews",
        "  FROM Restaurant r JOIN DiningReview d ON d.restaurant_id = r.restaurant_id",
        "  GROUP BY r.restaurant_id, r.locality, r.restaurant_name",
        "  HAVING COUNT(*) >= 3",
        ")",
        "SELECT s.locality, s.restaurant_name, ROUND(s.total / s.reviews, 2) AS avg_rating, s.reviews",
        "FROM scored s",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM scored t",
        "  WHERE t.locality = s.locality AND t.total * s.reviews > s.total * t.reviews",
        ")",
      ].join("\n"),
    ],
    hints: [
      "First compute each restaurant's average and review count, and drop those under 3 reviews with `HAVING`.",
      "\"Best in each locality\" is a ranking within a partition: `RANK() OVER (PARTITION BY locality ORDER BY …)`.",
      "`RANK` (or `DENSE_RANK`) gives tied restaurants the same position 1; `ROW_NUMBER` would pick one arbitrarily.",
      "Rank by the unrounded average, then round only for display.",
    ],
    editorial: [
      "Work in two steps. First aggregate the reviews per restaurant: `AVG(rating)` and `COUNT(*)`, with `HAVING COUNT(*) >= 3` dropping thinly reviewed places **before** any ranking — otherwise a restaurant with two five-star reviews would beat everyone.",
      "",
      "Then rank within each locality. `RANK() OVER (PARTITION BY locality ORDER BY avg_raw DESC)` numbers the restaurants of one locality from the best down, and equal averages receive the same rank, so every restaurant tied for the top gets position 1 and is kept. `ROW_NUMBER` would silently choose one of them — the classic mistake on a \"return all ties\" question.",
      "",
      "Rank on the unrounded average and round only in the final `SELECT`; ranking on rounded values could tie two averages that differ in the third decimal. A locality whose restaurants all have fewer than 3 reviews leaves no row in `scored` and so no answer.",
      "",
      "The alternative avoids window functions: a restaurant is the best when **no** restaurant of the same locality has a higher average, and the comparison `t.total * s.reviews > s.total * t.reviews` compares the two averages exactly by cross-multiplying, with no division. The window version reads the aggregate once; the `NOT EXISTS` version compares pairs within a locality.",
    ].join("\n"),
  },

  {
    slug: "zomato-reviews-far-from-the-restaurant-consensus",
    title: "Zomato: Reviews Far From the Restaurant's Consensus",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Subqueries"],
    description: [
      "Zomato's review-moderation team looks at ratings that disagree sharply with everyone else's view of a restaurant — they are often fake or a mistaken tap.",
      "",
      "For each review, the **consensus** is the average rating of all the **other** reviews of the same restaurant (the review itself is left out). Return the reviews whose rating differs from that consensus by **2 stars or more** (in either direction), with `review_id`, `restaurant_id`, `rating` and `others_avg` (the consensus rounded to 2 decimals). A review that is its restaurant's only review has no consensus and is never returned. Order by `review_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Review",
        columns: [
          { name: "review_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "rating", type: "int" },
          { name: "posted_on", type: "date" },
        ],
        primaryKey: ["review_id"],
        note: "One row per published review; `rating` is 1 to 5 stars.",
      },
    ],
    examples: [
      {
        Review: [
          [1, 10, 201, 5, "2024-04-01"],
          [2, 10, 202, 4, "2024-04-02"],
          [3, 10, 203, 1, "2024-04-02"],
          [4, 10, 204, 5, "2024-04-05"],
          [5, 11, 205, 3, "2024-04-03"],
          [6, 12, 201, 1, "2024-04-04"],
          [7, 12, 206, 3, "2024-04-06"],
          [8, 12, 207, 3, "2024-04-07"],
          [9, 13, 208, 5, "2024-04-01"],
          [10, 13, 209, 2, "2024-04-08"],
          [11, 13, 210, 1, "2024-04-09"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 24);
      const rests = ri(rng, 1, 6);
      const rows: Cell[][] = seq(1, n).map((id) => [id, 10 + ri(rng, 1, rests), 200 + ri(rng, 1, 15), pick(rng, [1, 2, 3, 3, 4, 4, 5, 5]), dateBetween(rng, "2024-04-01", "2024-04-30")]);
      return { Review: rows };
    },
    solution: [
      "WITH t AS (",
      "  SELECT review_id, restaurant_id, rating,",
      "         SUM(rating) OVER (PARTITION BY restaurant_id) AS total,",
      "         COUNT(*) OVER (PARTITION BY restaurant_id) AS cnt",
      "  FROM Review",
      ")",
      "SELECT review_id, restaurant_id, rating,",
      "       ROUND((total - rating) / (cnt - 1), 2) AS others_avg",
      "FROM t",
      "WHERE cnt > 1",
      "  AND ABS(rating - (total - rating) / (cnt - 1)) >= 2",
      "ORDER BY review_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT review_id, restaurant_id, rating, ROUND(others_avg, 2) AS others_avg FROM (",
        "  SELECT r.review_id, r.restaurant_id, r.rating,",
        "         (SELECT AVG(o.rating) FROM Review o",
        "          WHERE o.restaurant_id = r.restaurant_id AND o.review_id <> r.review_id) AS others_avg",
        "  FROM Review r",
        ") x",
        "WHERE others_avg IS NOT NULL AND (rating >= others_avg + 2 OR rating <= others_avg - 2)",
        "ORDER BY review_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The average of the others is (the restaurant's total − this rating) / (its count − 1).",
      "Window aggregates — `SUM(...) OVER (PARTITION BY restaurant_id)` — put the restaurant's total and count on every review row.",
      "A count of 1 would divide by zero: exclude those reviews first.",
      "\"2 stars or more in either direction\" is `ABS(difference) >= 2`.",
    ],
    editorial: [
      "The consensus for a review excludes the review itself, so it is not the restaurant's plain average. It can be derived from two restaurant-level numbers: `(total - rating) / (cnt - 1)`, where `total` and `cnt` are the sum and the number of all its ratings. Window aggregates with `PARTITION BY restaurant_id` and no `ORDER BY` attach those two numbers to every review row without collapsing the rows, so every review can see its own restaurant's figures.",
      "",
      "A restaurant with one review has `cnt - 1 = 0`; such reviews have no consensus and the `cnt > 1` test removes them before anything divides. The flag is `ABS(rating - others_avg) >= 2`, which catches both a one-star review among fives and a five among ones, and includes a gap of exactly 2.",
      "",
      "The comparison uses the exact average; only the displayed column is rounded, so a consensus of 3.33 against a 1-star review is judged on 3.333…, not on the rounded figure.",
      "",
      "The alternative computes each consensus with a correlated `AVG` over the other reviews (`o.review_id <> r.review_id`); for a lone review that subquery averages nothing and returns NULL, which the `IS NOT NULL` test drops. It is simpler to read but scans a restaurant's reviews once per review, while the window version needs a single pass.",
    ].join("\n"),
  },

  {
    slug: "zomato-blinkit-stock-outs-lasting-a-day",
    title: "Zomato: Blinkit Stock-Outs Lasting a Day or More",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates"],
    description: [
      "Every time a Blinkit dark store runs out of an item, and every time the item is back on the shelf, an event is logged. The category team chases stock-outs that lasted a day or longer.",
      "",
      "For each `out_of_stock` event, the stock-out ends at the **next** event of the same store and product (always a `restocked` event — the events of one store and product alternate, starting with `out_of_stock`). If there is no next event the item is still out, and the stock-out is measured up to **2024-09-01 00:00:00**. Return the stock-outs of **24 hours or more** — `hours_out` is `TIMESTAMPDIFF(HOUR, …)` from the out-of-stock time to the end — with `store_id`, `product_name`, `out_at`, `back_at` (NULL while still out) and `hours_out`. Order by `store_id`, `product_name`, `out_at`.",
    ].join("\n"),
    tables: [
      {
        name: "StockEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "product_name", type: "varchar" },
          { name: "event_time", type: "datetime" },
          { name: "event_type", type: "enum", values: ["out_of_stock", "restocked"] },
        ],
        primaryKey: ["event_id"],
        note: "One row per stock event, all before 2024-09-01. Two events of one store and product never share a time.",
      },
    ],
    examples: [
      {
        StockEvent: [
          [1, 7, "Bananas", "2024-08-20 09:00:00", "out_of_stock"],
          [2, 7, "Bananas", "2024-08-21 09:00:00", "restocked"],
          [3, 7, "Bananas", "2024-08-25 10:00:00", "out_of_stock"],
          [4, 7, "Bananas", "2024-08-25 18:30:00", "restocked"],
          [5, 7, "Brown Bread", "2024-08-22 08:15:00", "out_of_stock"],
          [6, 7, "Brown Bread", "2024-08-23 08:14:00", "restocked"],
          [7, 9, "Brown Bread", "2024-08-30 20:00:00", "out_of_stock"],
          [8, 9, "Paneer Block", "2024-08-31 12:00:00", "out_of_stock"],
          [9, 9, "Paneer Block", "2024-08-10 06:00:00", "out_of_stock"],
          [10, 9, "Paneer Block", "2024-08-13 07:00:00", "restocked"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      const pairs = ri(rng, 1, 5);
      const used = new Set<string>();
      for (let p = 0; p < pairs; p++) {
        const store = ri(rng, 1, 3);
        const prod = pick(rng, GROCERIES);
        if (used.has(`${store}|${prod}`)) continue;
        used.add(`${store}|${prod}`);
        // Minutes since 2024-08-01 00:00; a month is 44,640 minutes.
        let t = ri(rng, 0, 20000);
        let out = true;
        while (t < 44640 && rows.length < 28) {
          rows.push([id++, store, prod, at("2024-08-01", t), out ? "out_of_stock" : "restocked"]);
          const gap = out ? pick(rng, [60 * 24, 60 * 24 - 1, 60 * 30, ri(rng, 30, 3000)]) : ri(rng, 600, 8000);
          t += gap;
          out = !out;
          if (chance(rng, 0.08)) break;
        }
      }
      return { StockEvent: shuffle(rng, rows) };
    },
    solution: [
      "WITH seqd AS (",
      "  SELECT store_id, product_name, event_time, event_type,",
      "         LEAD(event_time) OVER (PARTITION BY store_id, product_name ORDER BY event_time) AS next_time",
      "  FROM StockEvent",
      ")",
      "SELECT store_id, product_name, event_time AS out_at, next_time AS back_at,",
      "       TIMESTAMPDIFF(HOUR, event_time, COALESCE(next_time, '2024-09-01 00:00:00')) AS hours_out",
      "FROM seqd",
      "WHERE event_type = 'out_of_stock'",
      "  AND TIMESTAMPDIFF(HOUR, event_time, COALESCE(next_time, '2024-09-01 00:00:00')) >= 24",
      "ORDER BY store_id, product_name, out_at",
    ].join("\n"),
    alternatives: [
      [
        "SELECT store_id, product_name, out_at, back_at,",
        "       TIMESTAMPDIFF(HOUR, out_at, IFNULL(back_at, '2024-09-01 00:00:00')) AS hours_out",
        "FROM (",
        "  SELECT e.store_id, e.product_name, e.event_time AS out_at,",
        "         (SELECT MIN(r.event_time) FROM StockEvent r",
        "          WHERE r.store_id = e.store_id AND r.product_name = e.product_name",
        "            AND r.event_type = 'restocked' AND r.event_time > e.event_time) AS back_at",
        "  FROM StockEvent e",
        "  WHERE e.event_type = 'out_of_stock'",
        ") s",
        "WHERE TIMESTAMPDIFF(HOUR, out_at, IFNULL(back_at, '2024-09-01 00:00:00')) >= 24",
        "ORDER BY store_id, product_name, out_at",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Each out-of-stock row needs the time of the event that follows it for the same store and product.",
      "`LEAD(event_time) OVER (PARTITION BY store_id, product_name ORDER BY event_time)` fetches exactly that.",
      "The last event of a series has no next event — `COALESCE` the missing end to the cut-off time.",
      "`TIMESTAMPDIFF(HOUR, …)` counts whole hours, so 23 hours 59 minutes is 23.",
    ],
    editorial: [
      "Each stock-out spans two rows — the `out_of_stock` event and the `restocked` event after it — so the task is to bring the next row's time alongside the current one. `LEAD(event_time)` does exactly that within a window partitioned by store and product and ordered by time. The partition matters: without it, the \"next\" event could belong to another product.",
      "",
      "Only the out-of-stock rows are reported, so the filter keeps `event_type = 'out_of_stock'` — after `LEAD` has been computed over all events, which is why it sits in the outer query. The last stock-out of a series may have no next event; `COALESCE(next_time, '2024-09-01 00:00:00')` measures it to the cut-off while `back_at` itself stays NULL, telling the team it is still out.",
      "",
      "`TIMESTAMPDIFF(HOUR, …)` truncates to whole hours, so a stock-out of exactly 24 hours is kept and one of 23 h 59 min is not. The rows arrive in any order in the table, but the window orders them itself.",
      "",
      "The alternative finds the end with a correlated `MIN(event_time)` of the restocked events after each stock-out — correct here because the events alternate. `LEAD` reads the events once in sorted order; the subquery probes per stock-out and wants an index on `(store_id, product_name, event_time)`.",
    ].join("\n"),
  },

  {
    slug: "zomato-district-event-sell-through-by-category",
    title: "Zomato: District Event Sell-Through by Category",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Joins", "Subqueries"],
    description: [
      "District lists live events — comedy, music, workshops, sports — and the events team compares categories by how much of their capacity they sell.",
      "",
      "For each category with at least one event, return `category`, `events` (number of events), `tickets_sold` (tickets of `confirmed` orders; 0 if none), `capacity` (the total capacity of **all** its events, including events that sold nothing) and `sell_through_pct` = 100 × tickets_sold / capacity rounded to 2 decimals. Order by `sell_through_pct` descending, then `category` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "LiveEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "title", type: "varchar" },
          { name: "category", type: "enum", values: ["comedy", "music", "workshop", "sports"] },
          { name: "capacity", type: "int" },
        ],
        primaryKey: ["event_id"],
        note: "One row per event listed on District; `capacity` is the tickets on sale.",
      },
      {
        name: "TicketOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "event_id", type: "int" },
          { name: "tickets", type: "int" },
          { name: "status", type: "enum", values: ["confirmed", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per order of one or more tickets.",
      },
    ],
    examples: [
      {
        LiveEvent: [
          [1, "Laugh Riot Live", "comedy", 200],
          [2, "Open Mic Night", "comedy", 100],
          [3, "Indie Nights", "music", 500],
          [4, "Pottery Basics", "workshop", 100],
          [5, "Bass Drop Fest", "music", 300],
          [6, "Sketching 101", "workshop", 100],
        ],
        TicketOrder: [
          [1, 1, 100, "confirmed"],
          [2, 1, 50, "confirmed"],
          [3, 1, 30, "cancelled"],
          [4, 2, 50, "confirmed"],
          [5, 3, 400, "confirmed"],
          [6, 4, 60, "confirmed"],
          [7, 4, 40, "confirmed"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 8);
      const cats = ["comedy", "music", "workshop", "sports"];
      const evs: Cell[][] = seq(1, n).map((id) => [id, `Event ${id}`, pick(rng, cats), roundTo(rng, 100, 600, 100)]);
      const orders: Cell[][] = [];
      let id = 1;
      for (const e of evs) {
        const k = ri(rng, 0, 3);
        for (let j = 0; j < k; j++) orders.push([id++, e[0]!, roundTo(rng, 10, 200, 10), chance(rng, 0.25) ? "cancelled" : "confirmed"]);
      }
      return { LiveEvent: evs, TicketOrder: shuffle(rng, orders) };
    },
    solution: [
      "WITH per_event AS (",
      "  SELECT e.event_id, e.category, e.capacity,",
      "         COALESCE((SELECT SUM(o.tickets) FROM TicketOrder o",
      "                   WHERE o.event_id = e.event_id AND o.status = 'confirmed'), 0) AS sold",
      "  FROM LiveEvent e",
      ")",
      "SELECT category, COUNT(*) AS events, SUM(sold) AS tickets_sold, SUM(capacity) AS capacity,",
      "       ROUND(100 * SUM(sold) / SUM(capacity), 2) AS sell_through_pct",
      "FROM per_event",
      "GROUP BY category",
      "ORDER BY sell_through_pct DESC, category",
    ].join("\n"),
    alternatives: [
      [
        "SELECT c.category, c.events, COALESCE(s.sold, 0) AS tickets_sold, c.capacity,",
        "       ROUND(100 * COALESCE(s.sold, 0) / c.capacity, 2) AS sell_through_pct",
        "FROM (SELECT category, COUNT(*) AS events, SUM(capacity) AS capacity FROM LiveEvent GROUP BY category) c",
        "LEFT JOIN (",
        "  SELECT e.category, SUM(o.tickets) AS sold",
        "  FROM LiveEvent e JOIN TicketOrder o ON o.event_id = e.event_id",
        "  WHERE o.status = 'confirmed'",
        "  GROUP BY e.category",
        ") s ON s.category = c.category",
        "ORDER BY sell_through_pct DESC, c.category ASC",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Joining events to orders and then summing `capacity` counts an event's capacity once per order — the fan-out trap.",
      "Reduce the orders to one number per event first, then aggregate events by category.",
      "Events with no confirmed orders still add their capacity; give them 0 tickets with `COALESCE`.",
    ],
    editorial: [
      "The trap is the fan-out. If events are joined straight to their orders and then grouped by category, an event with three orders appears on three rows and `SUM(capacity)` adds its capacity three times; an event with no orders disappears under an inner join, and its capacity is lost. Both make the sell-through wrong.",
      "",
      "The fix is to aggregate at the right grain before going up a level. The `per_event` step gives one row per event with its confirmed tickets (`COALESCE` turns \"no confirmed orders\" into 0). Now each event is exactly one row, so grouping by category can safely count events, add tickets and add capacities, and the ratio is `100 * SUM(sold) / SUM(capacity)`.",
      "",
      "Note that this is the category's overall rate (total tickets over total capacity), not the average of per-event percentages — a large event weighs more, which is the useful reading. Categories with no events never appear, and ties on the rate fall back to the category name.",
      "",
      "The alternative aggregates the two sides independently — events and capacity per category, confirmed tickets per category — and joins the two summaries with a `LEFT JOIN`, which is the same idea in a different shape. Both read each table once.",
    ].join("\n"),
  },

  {
    slug: "zomato-hyperpure-buyers-in-every-month-of-q1",
    title: "Zomato: Restaurants Buying From Hyperpure Every Month of Q1",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Dates", "Joins"],
    description: [
      "Hyperpure's account managers call a restaurant a **regular** when it received supplies in every month of a quarter. They want the regulars of the first quarter of 2024.",
      "",
      "Return each restaurant with at least one `delivered` order in **each** of January, February and March 2024, with `restaurant_id`, `restaurant_name` and `q1_spend` — the total `amount` of its delivered orders dated 2024-01-01 to 2024-03-31. Cancelled orders do not count for anything. Order by `q1_spend` descending, then `restaurant_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Restaurant",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "restaurant_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["restaurant_id"],
        note: "One row per restaurant on Hyperpure.",
      },
      {
        name: "SupplyOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "ordered_on", type: "date" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["delivered", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per supply order, in rupees.",
      },
    ],
    examples: [
      {
        Restaurant: [
          [1, "Spice Route", "Bengaluru"],
          [2, "Biryani House", "Hyderabad"],
          [3, "Dosa Darbar", "Chennai"],
          [4, "Pind Dhaba", "Delhi"],
        ],
        SupplyOrder: [
          [1, 1, "2024-01-05", 4000, "delivered"],
          [2, 1, "2024-02-10", 3500, "delivered"],
          [3, 1, "2024-03-31", 2500, "delivered"],
          [4, 1, "2024-04-01", 9000, "delivered"],
          [5, 2, "2024-01-02", 6000, "delivered"],
          [6, 2, "2024-01-20", 2000, "delivered"],
          [7, 2, "2024-02-14", 1000, "cancelled"],
          [8, 2, "2024-03-03", 5000, "delivered"],
          [9, 3, "2023-12-31", 3000, "delivered"],
          [10, 3, "2024-01-31", 2000, "delivered"],
          [11, 3, "2024-02-01", 3000, "delivered"],
          [12, 3, "2024-03-01", 5000, "delivered"],
          [13, 4, "2024-01-15", 8000, "delivered"],
          [14, 4, "2024-02-15", 8000, "delivered"],
          [15, 4, "2024-03-15", 8000, "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      const r = ri(rng, 1, 6);
      const rest: Cell[][] = sample(rng, RESTAURANTS, r).map((name, i) => [i + 1, name, pick(rng, CITIES)]);
      const rows: Cell[][] = [];
      let id = 1;
      for (const x of rest) {
        const months = pick(rng, [[1, 2, 3], [1, 2, 3], [1, 3], [2, 3, 4], [12, 1, 2, 3], [1, 2]]);
        for (const m of months) {
          const k = ri(rng, 1, 2);
          for (let j = 0; j < k; j++) {
            const date = m === 12 ? "2023-12-31" : m === 4 ? "2024-04-01" : dateBetween(rng, `2024-0${m}-01`, m === 2 ? "2024-02-29" : `2024-0${m}-${m === 1 ? 31 : 31}`);
            rows.push([id++, x[0]!, date, roundTo(rng, 1000, 9000, 500), chance(rng, 0.15) ? "cancelled" : "delivered"]);
          }
        }
      }
      return { Restaurant: rest, SupplyOrder: shuffle(rng, rows) };
    },
    solution: [
      "SELECT r.restaurant_id, r.restaurant_name, SUM(o.amount) AS q1_spend",
      "FROM Restaurant r",
      "JOIN SupplyOrder o ON o.restaurant_id = r.restaurant_id",
      "WHERE o.status = 'delivered'",
      "  AND o.ordered_on BETWEEN '2024-01-01' AND '2024-03-31'",
      "GROUP BY r.restaurant_id, r.restaurant_name",
      "HAVING COUNT(DISTINCT MONTH(o.ordered_on)) = 3",
      "ORDER BY q1_spend DESC, r.restaurant_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT r.restaurant_id, r.restaurant_name,",
        "       (SELECT SUM(amount) FROM SupplyOrder o WHERE o.restaurant_id = r.restaurant_id AND o.status = 'delivered'",
        "          AND o.ordered_on >= '2024-01-01' AND o.ordered_on <= '2024-03-31') AS q1_spend",
        "FROM Restaurant r",
        "WHERE EXISTS (SELECT 1 FROM SupplyOrder o WHERE o.restaurant_id = r.restaurant_id AND o.status = 'delivered' AND o.ordered_on BETWEEN '2024-01-01' AND '2024-01-31')",
        "  AND EXISTS (SELECT 1 FROM SupplyOrder o WHERE o.restaurant_id = r.restaurant_id AND o.status = 'delivered' AND o.ordered_on BETWEEN '2024-02-01' AND '2024-02-29')",
        "  AND EXISTS (SELECT 1 FROM SupplyOrder o WHERE o.restaurant_id = r.restaurant_id AND o.status = 'delivered' AND o.ordered_on BETWEEN '2024-03-01' AND '2024-03-31')",
        "ORDER BY q1_spend DESC, r.restaurant_id ASC",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Restrict to delivered orders inside the quarter first; then each restaurant's rows are its Q1 supplies.",
      "\"Every month\" means the number of **distinct** months among those rows is 3.",
      "Two orders in January must not count as two months — that is what `DISTINCT` is for.",
    ],
    editorial: [
      "This is a small case of **relational division**: keep the restaurants that have a row for each of a fixed set of months. With the rows narrowed by `WHERE` to delivered orders between 1 January and 31 March, every remaining month number is 1, 2 or 3, so a restaurant covered all three exactly when `COUNT(DISTINCT MONTH(ordered_on)) = 3`.",
      "",
      "The `DISTINCT` is essential — a restaurant with two January orders and one March order has three rows but only two months. The date filter must come before grouping, too: an order on 31 December or 1 April would otherwise add a fourth month or inflate the spend. Cancelled orders are dropped in the same `WHERE`, so a cancelled February order cannot stand in for a missing delivery.",
      "",
      "The same filtered rows give `SUM(amount)`, the Q1 spend, and the order uses `restaurant_id` to break ties in spend.",
      "",
      "The alternative spells the division out with three `EXISTS` tests, one per month, and computes the spend with a scalar subquery. It is explicit but scales poorly as the set of months grows; the counting version only needs its constant changed.",
    ].join("\n"),
  },

  {
    slug: "zomato-table-reservation-no-show-rate-by-meal",
    title: "Zomato: Table Reservation No-Show Rate by Meal Slot",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Aggregation", "Dates"],
    description: [
      "Diners can reserve a table through Zomato's dining-out service. Partner restaurants have asked which times of day suffer most from guests who never turn up.",
      "",
      "Put each reservation in a meal slot by the hour of `slot_time`: 7–11 `breakfast`, 12–15 `lunch`, 16–18 `evening`, 19–23 `dinner`, and 0–6 `late_night`. **Cancelled** reservations are left out entirely. For each slot with at least one remaining reservation, return `meal_slot`, `bookings` (honoured + no-show), `no_shows` and `no_show_rate_pct` = 100 × no_shows / bookings rounded to 2 decimals. Order by `no_show_rate_pct` descending, then `meal_slot` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "TableReservation",
        columns: [
          { name: "reservation_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "slot_time", type: "datetime" },
          { name: "guests", type: "int" },
          { name: "status", type: "enum", values: ["honoured", "no_show", "cancelled"] },
        ],
        primaryKey: ["reservation_id"],
        note: "One row per table reservation; `slot_time` is when the table was booked for.",
      },
    ],
    examples: [
      {
        TableReservation: [
          [1, 1, "2024-07-06 08:30:00", 2, "honoured"],
          [2, 1, "2024-07-06 11:59:00", 4, "no_show"],
          [3, 2, "2024-07-06 12:00:00", 2, "honoured"],
          [4, 2, "2024-07-06 13:30:00", 3, "honoured"],
          [5, 3, "2024-07-07 15:45:00", 2, "cancelled"],
          [6, 3, "2024-07-07 14:00:00", 6, "no_show"],
          [7, 1, "2024-07-06 20:00:00", 2, "no_show"],
          [8, 2, "2024-07-06 21:15:00", 4, "honoured"],
          [9, 3, "2024-07-06 17:30:00", 2, "cancelled"],
          [10, 2, "2024-07-07 00:30:00", 2, "honoured"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 26);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const hour = chance(rng, 0.3) ? pick(rng, [6, 7, 11, 12, 15, 16, 18, 19, 23, 0]) : ri(rng, 0, 23);
        const minute = pick(rng, [0, 15, 30, 45, 59]);
        return [id, ri(rng, 1, 4), at(dateBetween(rng, "2024-07-01", "2024-07-14"), hour * 60 + minute), ri(rng, 1, 8), pick(rng, ["honoured", "honoured", "no_show", "cancelled"])];
      });
      return { TableReservation: rows };
    },
    solution: [
      "WITH slotted AS (",
      "  SELECT status,",
      "         CASE WHEN HOUR(slot_time) BETWEEN 7 AND 11 THEN 'breakfast'",
      "              WHEN HOUR(slot_time) BETWEEN 12 AND 15 THEN 'lunch'",
      "              WHEN HOUR(slot_time) BETWEEN 16 AND 18 THEN 'evening'",
      "              WHEN HOUR(slot_time) BETWEEN 19 AND 23 THEN 'dinner'",
      "              ELSE 'late_night' END AS meal_slot",
      "  FROM TableReservation",
      "  WHERE status <> 'cancelled'",
      ")",
      "SELECT meal_slot, COUNT(*) AS bookings,",
      "       SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) AS no_shows,",
      "       ROUND(100 * SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) / COUNT(*), 2) AS no_show_rate_pct",
      "FROM slotted",
      "GROUP BY meal_slot",
      "ORDER BY no_show_rate_pct DESC, meal_slot",
    ].join("\n"),
    alternatives: [
      [
        "SELECT meal_slot, COUNT(*) AS bookings, SUM(is_no_show) AS no_shows,",
        "       ROUND(AVG(is_no_show) * 100, 2) AS no_show_rate_pct",
        "FROM (",
        "  SELECT IF(HOUR(slot_time) < 7, 'late_night',",
        "         IF(HOUR(slot_time) < 12, 'breakfast',",
        "         IF(HOUR(slot_time) < 16, 'lunch',",
        "         IF(HOUR(slot_time) < 19, 'evening', 'dinner')))) AS meal_slot,",
        "         IF(status = 'no_show', 1, 0) AS is_no_show",
        "  FROM TableReservation",
        "  WHERE status IN ('honoured', 'no_show')",
        ") t",
        "GROUP BY meal_slot",
        "ORDER BY no_show_rate_pct DESC, meal_slot ASC",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`HOUR(slot_time)` gives 0–23; a `CASE` maps the hour ranges to slot names.",
      "Remove the cancelled reservations before counting — they are neither bookings nor no-shows here.",
      "Compute the slot in a derived table or CTE, then group by it.",
      "The no-show count is a conditional sum over the slot's rows.",
    ],
    editorial: [
      "The slot is a label derived from the hour, so build it first: `HOUR(slot_time)` returns 0–23, and a `CASE` with ranges maps it to the five names. Each `WHEN` is tested in order and the `ELSE` catches hours 0–6. Note the boundaries — 11:59 is still breakfast (hour 11) and 12:00 is lunch.",
      "",
      "Cancelled reservations are dropped in the CTE's `WHERE`, so they are counted nowhere: the rate is no-shows out of the reservations that were expected to arrive. A slot whose reservations were all cancelled has no rows left and does not appear.",
      "",
      "Grouping by the derived `meal_slot` then gives `COUNT(*)` bookings and a conditional `SUM` of no-shows; their ratio × 100, rounded, is the rate. Ordering by the rounded rate with the slot name as the tie-breaker makes equal rates come out alphabetically.",
      "",
      "The alternative nests `IF` calls with upper bounds instead of ranges, and computes the rate as `AVG` of a 0/1 flag — the average of a flag is the share of rows where it is 1. Either way it is one scan of the table.",
    ].join("\n"),
  },

  {
    slug: "zomato-top-intercity-legends-dish-per-city",
    title: "Zomato: Top Intercity Legends Dish in Each Destination City",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Joins", "Aggregation"],
    description: [
      "Intercity Legends ships iconic dishes from one city to customers in another. The category team wants the most-loved import in every city it delivers to.",
      "",
      "Count the `quantity` of **delivered** orders per destination city and dish. An order delivered to the dish's own `origin_city` is not an intercity order and does not count. For each `destination_city`, return the dish(es) with the **most units** — all of them if tied — with `destination_city`, `dish_name`, `origin_city` and `units`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "LegendsDish",
        columns: [
          { name: "dish_id", type: "int" },
          { name: "dish_name", type: "varchar" },
          { name: "origin_city", type: "varchar" },
        ],
        primaryKey: ["dish_id"],
        note: "One row per dish on Intercity Legends, with the city it is cooked in.",
      },
      {
        name: "LegendsOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "dish_id", type: "int" },
          { name: "destination_city", type: "varchar" },
          { name: "quantity", type: "int" },
          { name: "status", type: "enum", values: ["delivered", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per order line of one dish.",
      },
    ],
    examples: [
      {
        LegendsDish: [
          [1, "Kolkata Rosogolla", "Kolkata"],
          [2, "Lucknowi Galouti", "Lucknow"],
          [3, "Hyderabadi Biryani", "Hyderabad"],
          [4, "Jaipur Ghewar", "Jaipur"],
        ],
        LegendsOrder: [
          [1, 1, "Bengaluru", 4, "delivered"],
          [2, 3, "Bengaluru", 3, "delivered"],
          [3, 3, "Bengaluru", 2, "delivered"],
          [4, 2, "Delhi", 2, "delivered"],
          [5, 4, "Delhi", 2, "delivered"],
          [6, 1, "Delhi", 5, "cancelled"],
          [7, 3, "Hyderabad", 10, "delivered"],
          [8, 1, "Hyderabad", 1, "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      const dishes: Cell[][] = sample(rng, LEGENDS, ri(rng, 2, 6)).map(([d, c], i) => [i + 1, d, c]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 22);
      const rows: Cell[][] = seq(1, n).map((id) => [id, ri(rng, 1, dishes.length), pick(rng, LEGEND_DESTINATIONS), ri(rng, 1, 4), chance(rng, 0.2) ? "cancelled" : "delivered"]);
      return { LegendsDish: dishes, LegendsOrder: rows };
    },
    solution: [
      "WITH units AS (",
      "  SELECT o.destination_city, d.dish_name, d.origin_city, SUM(o.quantity) AS units",
      "  FROM LegendsOrder o",
      "  JOIN LegendsDish d ON d.dish_id = o.dish_id",
      "  WHERE o.status = 'delivered' AND o.destination_city <> d.origin_city",
      "  GROUP BY o.destination_city, d.dish_id, d.dish_name, d.origin_city",
      "),",
      "ranked AS (",
      "  SELECT destination_city, dish_name, origin_city, units,",
      "         DENSE_RANK() OVER (PARTITION BY destination_city ORDER BY units DESC) AS pos",
      "  FROM units",
      ")",
      "SELECT destination_city, dish_name, origin_city, units FROM ranked WHERE pos = 1",
    ].join("\n"),
    alternatives: [
      [
        "WITH units AS (",
        "  SELECT o.destination_city, d.dish_name, d.origin_city, SUM(o.quantity) AS units",
        "  FROM LegendsOrder o JOIN LegendsDish d ON d.dish_id = o.dish_id",
        "  WHERE o.status = 'delivered' AND o.destination_city <> d.origin_city",
        "  GROUP BY o.destination_city, d.dish_id, d.dish_name, d.origin_city",
        ")",
        "SELECT u.destination_city, u.dish_name, u.origin_city, u.units",
        "FROM units u",
        "JOIN (SELECT destination_city, MAX(units) AS best FROM units GROUP BY destination_city) m",
        "  ON m.destination_city = u.destination_city AND m.best = u.units",
      ].join("\n"),
    ],
    hints: [
      "First total the delivered units per (destination city, dish), dropping orders shipped to the dish's own city.",
      "The \"own city\" test compares a column of the order with a column of the dish — it needs the join.",
      "Then keep, per city, the rows whose total equals the city's maximum — `RANK`/`DENSE_RANK` or a join to `MAX`.",
    ],
    editorial: [
      "Two steps: total, then pick the top per group. The totals come from joining each order line to its dish, keeping delivered lines whose `destination_city` differs from the dish's `origin_city`, and summing `quantity` per destination and dish. The origin test is why the join comes before the aggregation — a Hyderabadi Biryani sold in Hyderabad is ordinary delivery, not an Intercity Legends import.",
      "",
      "Picking the top is a per-partition ranking: `DENSE_RANK() OVER (PARTITION BY destination_city ORDER BY units DESC)` gives the largest total in each city position 1, and equal totals share it, so ties all come back. A city reached only by cancelled orders or by orders of its own dishes has no totals and no row.",
      "",
      "The alternative joins the totals to each city's `MAX(units)` and keeps the rows that equal it — the same result without window functions, at the cost of reading the CTE twice. Group by `dish_id` as well as the name so two dishes with the same name would stay apart.",
    ].join("\n"),
  },

  {
    slug: "zomato-september-photo-decisions-of-every-moderator",
    title: "Zomato: September Photo Decisions of Every Moderator",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "Diners upload food and ambience photos to restaurant pages, and Zomato's content-moderation team approves or rejects each one. The team lead's monthly report must list every active moderator — including anyone who decided nothing that month.",
      "",
      "For every moderator with `is_active = 1`, count their photo decisions made **in September 2024** (`decided_at` from 2024-09-01 00:00:00 up to, not including, 2024-10-01 00:00:00): `approved`, `rejected`, and `last_decision_at` — the time of their latest September decision, NULL if they made none. Decisions in other months do not count. Return `moderator_id`, `moderator_name`, `approved`, `rejected` and `last_decision_at`, ordered by `moderator_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Moderator",
        columns: [
          { name: "moderator_id", type: "int" },
          { name: "moderator_name", type: "varchar" },
          { name: "is_active", type: "bool" },
        ],
        primaryKey: ["moderator_id"],
        note: "One row per member of the photo-moderation team; `is_active` is 0 for someone who has left.",
      },
      {
        name: "PhotoDecision",
        columns: [
          { name: "decision_id", type: "int" },
          { name: "moderator_id", type: "int" },
          { name: "photo_id", type: "int" },
          { name: "decision", type: "enum", values: ["approved", "rejected"] },
          { name: "decided_at", type: "datetime" },
        ],
        primaryKey: ["decision_id"],
        note: "One row per moderation decision on an uploaded photo.",
      },
    ],
    examples: [
      {
        Moderator: [
          [1, "Aisha", 1],
          [2, "Farhan", 1],
          [3, "Pooja", 1],
          [4, "Karan", 0],
        ],
        PhotoDecision: [
          [1, 1, 501, "approved", "2024-09-01 00:00:00"],
          [2, 1, 502, "rejected", "2024-09-14 16:20:00"],
          [3, 1, 503, "approved", "2024-09-30 23:59:00"],
          [4, 1, 504, "approved", "2024-10-01 00:00:00"],
          [5, 2, 505, "approved", "2024-08-31 22:10:00"],
          [6, 3, 506, "rejected", "2024-09-05 11:00:00"],
          [7, 4, 507, "approved", "2024-09-06 09:30:00"],
        ],
      },
    ],
    gen: (rng) => {
      const m = ri(rng, 1, 6);
      const mods: Cell[][] = names(rng, m).map((name, i) => [i + 1, name, chance(rng, 0.8) ? 1 : 0]);
      const n = ri(rng, 0, 22);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 1, m),
        500 + id,
        chance(rng, 0.65) ? "approved" : "rejected",
        chance(rng, 0.2)
          ? pick(rng, ["2024-08-31 23:59:00", "2024-09-01 00:00:00", "2024-09-30 23:59:00", "2024-10-01 00:00:00"])
          : at(dateBetween(rng, "2024-08-25", "2024-10-05"), ri(rng, 0, 1439)),
      ]);
      return { Moderator: mods, PhotoDecision: rows };
    },
    solution: [
      "SELECT m.moderator_id, m.moderator_name,",
      "       COUNT(CASE WHEN d.decision = 'approved' THEN 1 END) AS approved,",
      "       COUNT(CASE WHEN d.decision = 'rejected' THEN 1 END) AS rejected,",
      "       MAX(d.decided_at) AS last_decision_at",
      "FROM Moderator m",
      "LEFT JOIN PhotoDecision d",
      "  ON d.moderator_id = m.moderator_id",
      " AND d.decided_at >= '2024-09-01 00:00:00'",
      " AND d.decided_at < '2024-10-01 00:00:00'",
      "WHERE m.is_active = 1",
      "GROUP BY m.moderator_id, m.moderator_name",
      "ORDER BY m.moderator_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT m.moderator_id, m.moderator_name,",
        "       (SELECT COUNT(*) FROM PhotoDecision d WHERE d.moderator_id = m.moderator_id AND d.decision = 'approved'",
        "          AND d.decided_at >= '2024-09-01' AND d.decided_at < '2024-10-01') AS approved,",
        "       (SELECT COUNT(*) FROM PhotoDecision d WHERE d.moderator_id = m.moderator_id AND d.decision = 'rejected'",
        "          AND d.decided_at >= '2024-09-01' AND d.decided_at < '2024-10-01') AS rejected,",
        "       (SELECT MAX(d.decided_at) FROM PhotoDecision d WHERE d.moderator_id = m.moderator_id",
        "          AND d.decided_at >= '2024-09-01' AND d.decided_at < '2024-10-01') AS last_decision_at",
        "FROM Moderator m",
        "WHERE m.is_active = 1",
        "ORDER BY m.moderator_id",
      ].join("\n"),
      [
        "SELECT m.moderator_id, m.moderator_name,",
        "       COALESCE(SUM(IF(s.decision = 'approved', 1, 0)), 0) AS approved,",
        "       COALESCE(SUM(IF(s.decision = 'rejected', 1, 0)), 0) AS rejected,",
        "       MAX(s.decided_at) AS last_decision_at",
        "FROM Moderator m",
        "LEFT JOIN (SELECT moderator_id, decision, decided_at FROM PhotoDecision",
        "           WHERE YEAR(decided_at) = 2024 AND MONTH(decided_at) = 9) s ON s.moderator_id = m.moderator_id",
        "WHERE m.is_active = 1",
        "GROUP BY m.moderator_id, m.moderator_name",
        "ORDER BY m.moderator_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Every active moderator must appear, so start from `Moderator` and `LEFT JOIN` the decisions.",
      "Where does the September condition go? In `WHERE` it is NULL for a moderator with no decision, and that moderator disappears.",
      "Put conditions on the *child* table in the join's `ON` clause, and conditions on the *parent* table in `WHERE`.",
      "Count with `COUNT(CASE …)` so the NULL-padded row of an idle moderator counts as 0, and `MAX` of nothing is NULL.",
    ],
    editorial: [
      "The report is about **every** active moderator, so it starts from `Moderator` and outer-joins the decisions. The whole problem is where each condition goes.",
      "",
      "The month filter is a condition on the **child** rows. Placed in the `LEFT JOIN … ON`, it decides which decisions attach to each moderator; a moderator with no September decision still produces one row, padded with NULLs. Placed in `WHERE` instead, `d.decided_at >= '2024-09-01'` is evaluated on that padded row, is NULL, and removes it — the left join silently turns into an inner join and the idle moderator, the very person the lead wants to see, vanishes. The same happens to someone whose only decisions were in August.",
      "",
      "The `is_active` test is a condition on the **parent**, and it belongs in `WHERE`: putting it in `ON` would not remove anyone, it would only stop inactive moderators' decisions from joining while still listing them with zeros.",
      "",
      "After grouping, `COUNT(CASE WHEN d.decision = 'approved' THEN 1 END)` counts only real approvals (0 for a padded row), and `MAX(d.decided_at)` is NULL when nothing joined. The month is half-open — from midnight on 1 September up to but excluding midnight on 1 October — so 23:59 on the 30th counts and 00:00 on 1 October does not.",
      "",
      "The alternatives get the same rows with correlated subqueries per moderator, and by filtering the decisions in a derived table **before** the outer join — the other correct place for a child condition.",
    ].join("\n"),
  },

  {
    slug: "zomato-live-menu-from-latest-approved-edits",
    title: "Zomato: Live Menu Rebuilt From the Latest Approved Edits",
    difficulty: "HARD",
    topics: ["Window Functions", "Subqueries", "Dates"],
    description: [
      "Restaurant partners edit their Zomato menus from the partner app, and every edit goes to a review queue. The menu service keeps only the edit log, so the catalogue team rebuilds the live menu from it.",
      "",
      "An item is identified by `restaurant_id` and `item_name`, and every edit is a full snapshot of the item. An item's **live edit** is its latest `approved` edit — latest by `edited_at`, and for two edits at the same moment the higher `edit_id`. The item is on the live menu when it has a live edit and that edit is not a deletion (`is_deleted = 0`). For every live item return `restaurant_id`, `item_name`, `live_price` (the live edit's price) and `pending_changes` — the number of the item's `pending` edits made **after** its live edit (later `edited_at`, or the same `edited_at` with a higher `edit_id`). Rejected edits count for nothing. Order by `restaurant_id`, then `item_name`.",
    ].join("\n"),
    tables: [
      {
        name: "MenuEdit",
        columns: [
          { name: "edit_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "item_name", type: "varchar" },
          { name: "price", type: "int" },
          { name: "is_deleted", type: "bool" },
          { name: "status", type: "enum", values: ["approved", "pending", "rejected"] },
          { name: "edited_at", type: "datetime" },
        ],
        primaryKey: ["edit_id"],
        note: "One row per menu edit submitted by a partner; `price` in rupees. `is_deleted` is 1 for an edit that removes the item. Item names are always spelled the same way.",
      },
    ],
    examples: [
      {
        MenuEdit: [
          [1, 1, "Paneer Tikka", 260, 0, "approved", "2024-09-01 10:00:00"],
          [2, 1, "Paneer Tikka", 280, 0, "approved", "2024-09-10 10:00:00"],
          [3, 1, "Paneer Tikka", 300, 0, "pending", "2024-09-12 09:00:00"],
          [4, 1, "Paneer Tikka", 250, 0, "rejected", "2024-09-11 09:00:00"],
          [5, 1, "Garlic Naan", 60, 0, "approved", "2024-09-01 10:00:00"],
          [6, 1, "Garlic Naan", 60, 1, "approved", "2024-09-05 18:00:00"],
          [7, 1, "Mango Lassi", 120, 0, "pending", "2024-09-02 12:00:00"],
          [8, 2, "Masala Dosa", 110, 0, "approved", "2024-09-03 08:00:00"],
          [9, 2, "Masala Dosa", 120, 0, "approved", "2024-09-03 08:00:00"],
          [10, 2, "Masala Dosa", 130, 0, "pending", "2024-09-03 08:00:00"],
          [11, 2, "Masala Dosa", 140, 0, "pending", "2024-09-01 08:00:00"],
          [12, 2, "Filter Coffee", 40, 1, "approved", "2024-08-20 07:00:00"],
          [13, 2, "Filter Coffee", 45, 0, "approved", "2024-08-25 07:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      const rests = ri(rng, 1, 3);
      for (let r = 1; r <= rests; r++) {
        for (const item of sample(rng, DISHES, ri(rng, 1, 4))) {
          const k = ri(rng, 1, 5);
          for (let j = 0; j < k && rows.length < 30; j++) {
            // A few shared timestamps, so the edit_id tie-break matters.
            const when = at(pick(rng, ["2024-09-01", "2024-09-03", "2024-09-05", "2024-09-08"]), pick(rng, [480, 480, 600, 900, 1200]));
            rows.push([id++, r, item, roundTo(rng, 40, 400, 10), chance(rng, 0.2) ? 1 : 0, pick(rng, ["approved", "approved", "pending", "rejected"]), when]);
          }
        }
      }
      return { MenuEdit: shuffle(rng, rows) };
    },
    solution: [
      "WITH approved AS (",
      "  SELECT edit_id, restaurant_id, item_name, price, is_deleted, edited_at,",
      "         ROW_NUMBER() OVER (PARTITION BY restaurant_id, item_name ORDER BY edited_at DESC, edit_id DESC) AS rn",
      "  FROM MenuEdit",
      "  WHERE status = 'approved'",
      ")",
      "SELECT a.restaurant_id, a.item_name, a.price AS live_price,",
      "       (SELECT COUNT(*) FROM MenuEdit p",
      "        WHERE p.restaurant_id = a.restaurant_id AND p.item_name = a.item_name",
      "          AND p.status = 'pending'",
      "          AND (p.edited_at > a.edited_at OR (p.edited_at = a.edited_at AND p.edit_id > a.edit_id))) AS pending_changes",
      "FROM approved a",
      "WHERE a.rn = 1 AND a.is_deleted = 0",
      "ORDER BY a.restaurant_id, a.item_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.restaurant_id, a.item_name, a.price AS live_price,",
        "       COUNT(p.edit_id) AS pending_changes",
        "FROM MenuEdit a",
        "LEFT JOIN MenuEdit p",
        "  ON p.restaurant_id = a.restaurant_id AND p.item_name = a.item_name",
        " AND p.status = 'pending'",
        " AND (p.edited_at > a.edited_at OR (p.edited_at = a.edited_at AND p.edit_id > a.edit_id))",
        "WHERE a.status = 'approved' AND a.is_deleted = 0",
        "  AND NOT EXISTS (",
        "    SELECT 1 FROM MenuEdit b",
        "    WHERE b.restaurant_id = a.restaurant_id AND b.item_name = a.item_name AND b.status = 'approved'",
        "      AND (b.edited_at > a.edited_at OR (b.edited_at = a.edited_at AND b.edit_id > a.edit_id))",
        "  )",
        "GROUP BY a.edit_id, a.restaurant_id, a.item_name, a.price",
        "ORDER BY a.restaurant_id, a.item_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Only approved edits can be live, so pick the live edit among the approved rows alone.",
      "\"Latest per item\" is `ROW_NUMBER()` partitioned by restaurant and item, ordered by time and then id, both descending — keep row 1.",
      "Filter out deletions **after** picking the latest edit; filtering before would resurrect an item whose last approved edit removed it.",
      "Pending edits count only when they come after the live edit in the same (time, id) order.",
    ],
    editorial: [
      "An append-only edit log is turned into current state with **keep-the-latest-row deduplication**. Restrict to approved edits, number each item's edits from the newest with `ROW_NUMBER() OVER (PARTITION BY restaurant_id, item_name ORDER BY edited_at DESC, edit_id DESC)`, and row 1 is the live edit. The `edit_id` tie-break is not decoration: two edits approved at the same moment would otherwise leave the choice — and the price — to the storage order.",
      "",
      "The order of the steps matters. A deletion is an approved edit like any other, so it must take part in choosing the latest edit; only then are items whose live edit is a deletion dropped (`is_deleted = 0` on row 1). Filtering deletions out first would make an earlier approved price look current and bring a removed dish back. An item with only pending or rejected edits has no approved row at all and is not on the menu.",
      "",
      "`pending_changes` is a correlated count of the item's pending edits that come after the live edit in the same (time, id) order — the queue the reviewers still have to clear for it. Rejected edits appear in neither step.",
      "",
      "The alternative finds the live edit without window functions: an approved edit for which **no** later approved edit of the same item exists (`NOT EXISTS`), then counts later pending edits with a `LEFT JOIN` and `COUNT(p.edit_id)`, which is 0 when nothing joins. The window version sorts each item's edits once; the anti-join version wants an index on `(restaurant_id, item_name, status, edited_at)`.",
    ].join("\n"),
  },

  {
    slug: "zomato-locality-cuisine-gaps-to-recruit",
    title: "Zomato: Cuisine Gaps in Each Locality Worth Recruiting For",
    difficulty: "HARD",
    topics: ["Joins", "Subqueries", "Aggregation", "Dates"],
    description: [
      "Zomato's city sales teams sign up restaurants where diners search for a cuisine that nobody nearby serves. They want every such gap, with the June search demand behind it.",
      "",
      "A **gap** is a pair of a locality and a cuisine from `Cuisine` such that **no active** restaurant in that locality serves the cuisine, while **at least one** active restaurant elsewhere in the **same city** does (someone the team can approach). Consider every locality × cuisine combination, including ones nobody searched. Return `city`, `locality_name`, `cuisine_name`, `june_searches` (searches for that cuisine in that locality dated 2024-06-01 to 2024-06-30; 0 if none) and `partners_in_city` (active restaurants in the city serving the cuisine). Order by `june_searches` descending, then `locality_name`, then `cuisine_name`.",
    ].join("\n"),
    tables: [
      {
        name: "Locality",
        columns: [
          { name: "locality_id", type: "int" },
          { name: "locality_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["locality_id"],
        note: "One row per delivery locality; locality names are unique.",
      },
      {
        name: "Cuisine",
        columns: [
          { name: "cuisine_id", type: "int" },
          { name: "cuisine_name", type: "varchar" },
        ],
        primaryKey: ["cuisine_id"],
        note: "The cuisines the app lets diners filter by.",
      },
      {
        name: "Restaurant",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "locality_id", type: "int" },
          { name: "is_active", type: "bool" },
        ],
        primaryKey: ["restaurant_id"],
        note: "One row per restaurant; `is_active` is 0 for one that is paused or delisted.",
      },
      {
        name: "RestaurantCuisine",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "cuisine_id", type: "int" },
        ],
        primaryKey: ["restaurant_id", "cuisine_id"],
        note: "The cuisines each restaurant serves; a restaurant may serve several.",
      },
      {
        name: "CuisineSearch",
        columns: [
          { name: "search_id", type: "int" },
          { name: "locality_id", type: "int" },
          { name: "cuisine_id", type: "int" },
          { name: "searched_on", type: "date" },
        ],
        primaryKey: ["search_id"],
        note: "One row per search filtered by a cuisine, logged against the diner's locality.",
      },
    ],
    examples: [
      {
        Locality: [
          [1, "Koramangala", "Bengaluru"],
          [2, "Indiranagar", "Bengaluru"],
          [3, "Bandra West", "Mumbai"],
          [4, "Powai", "Mumbai"],
        ],
        Cuisine: [
          [1, "Biryani"],
          [2, "Chinese"],
          [3, "South Indian"],
        ],
        Restaurant: [
          [10, 1, 1],
          [11, 1, 1],
          [12, 2, 1],
          [13, 2, 0],
          [14, 3, 1],
          [15, 4, 1],
        ],
        RestaurantCuisine: [
          [10, 1],
          [10, 2],
          [11, 3],
          [12, 1],
          [13, 3],
          [14, 2],
          [15, 2],
          [15, 1],
        ],
        CuisineSearch: [
          [1, 2, 3, "2024-06-03"],
          [2, 2, 3, "2024-06-10"],
          [3, 2, 3, "2024-05-31"],
          [4, 2, 2, "2024-06-15"],
          [5, 1, 1, "2024-06-20"],
          [6, 3, 1, "2024-06-21"],
          [7, 4, 3, "2024-06-30"],
        ],
      },
    ],
    gen: (rng) => {
      const pool: (readonly [string, string])[] = [
        ["Koramangala", "Bengaluru"], ["Indiranagar", "Bengaluru"], ["Whitefield", "Bengaluru"], ["Jayanagar", "Bengaluru"],
        ["Bandra West", "Mumbai"], ["Andheri East", "Mumbai"], ["Powai", "Mumbai"], ["Salt Lake", "Kolkata"], ["Park Street", "Kolkata"],
      ];
      const locs: Cell[][] = sample(rng, pool, ri(rng, 2, 6)).map(([n, c], i) => [i + 1, n, c]);
      const cuisinePool = ["Bengali", "Biryani", "Chinese", "Desserts", "Mughlai", "North Indian", "Pizza", "South Indian"];
      const cuis: Cell[][] = sample(rng, cuisinePool, ri(rng, 2, 5)).map((n, i) => [i + 1, n]);
      const rests: Cell[][] = seq(10, ri(rng, 2, 9)).map((id) => [id, ri(rng, 1, locs.length), chance(rng, 0.8) ? 1 : 0]);
      const serves: Cell[][] = [];
      for (const r of rests) for (const c of sample(rng, seq(1, cuis.length), ri(rng, 1, 2))) serves.push([r[0]!, c]);
      const n = ri(rng, 0, 20);
      const searches: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 1, locs.length),
        ri(rng, 1, cuis.length),
        chance(rng, 0.15) ? pick(rng, ["2024-05-31", "2024-06-01", "2024-06-30", "2024-07-01"]) : dateBetween(rng, "2024-06-01", "2024-06-30"),
      ]);
      return { Locality: locs, Cuisine: cuis, Restaurant: rests, RestaurantCuisine: serves, CuisineSearch: searches };
    },
    solution: [
      "WITH served AS (",
      "  SELECT DISTINCT r.locality_id, rc.cuisine_id",
      "  FROM Restaurant r",
      "  JOIN RestaurantCuisine rc ON rc.restaurant_id = r.restaurant_id",
      "  WHERE r.is_active = 1",
      "),",
      "city_partners AS (",
      "  SELECT l.city, rc.cuisine_id, COUNT(DISTINCT r.restaurant_id) AS partners",
      "  FROM Restaurant r",
      "  JOIN Locality l ON l.locality_id = r.locality_id",
      "  JOIN RestaurantCuisine rc ON rc.restaurant_id = r.restaurant_id",
      "  WHERE r.is_active = 1",
      "  GROUP BY l.city, rc.cuisine_id",
      "),",
      "demand AS (",
      "  SELECT locality_id, cuisine_id, COUNT(*) AS searches",
      "  FROM CuisineSearch",
      "  WHERE searched_on BETWEEN '2024-06-01' AND '2024-06-30'",
      "  GROUP BY locality_id, cuisine_id",
      ")",
      "SELECT l.city, l.locality_name, c.cuisine_name,",
      "       COALESCE(d.searches, 0) AS june_searches,",
      "       cp.partners AS partners_in_city",
      "FROM Locality l",
      "CROSS JOIN Cuisine c",
      "JOIN city_partners cp ON cp.city = l.city AND cp.cuisine_id = c.cuisine_id",
      "LEFT JOIN demand d ON d.locality_id = l.locality_id AND d.cuisine_id = c.cuisine_id",
      "WHERE NOT EXISTS (",
      "  SELECT 1 FROM served s WHERE s.locality_id = l.locality_id AND s.cuisine_id = c.cuisine_id",
      ")",
      "ORDER BY june_searches DESC, l.locality_name, c.cuisine_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT city, locality_name, cuisine_name, june_searches, partners_in_city FROM (",
        "  SELECT l.city, l.locality_name, c.cuisine_name,",
        "         (SELECT COUNT(*) FROM CuisineSearch q",
        "          WHERE q.locality_id = l.locality_id AND q.cuisine_id = c.cuisine_id",
        "            AND q.searched_on >= '2024-06-01' AND q.searched_on <= '2024-06-30') AS june_searches,",
        "         (SELECT COUNT(*) FROM Restaurant r",
        "          JOIN Locality rl ON rl.locality_id = r.locality_id",
        "          JOIN RestaurantCuisine rc ON rc.restaurant_id = r.restaurant_id",
        "          WHERE r.is_active = 1 AND rl.city = l.city AND rc.cuisine_id = c.cuisine_id) AS partners_in_city,",
        "         (SELECT COUNT(*) FROM Restaurant r",
        "          JOIN RestaurantCuisine rc ON rc.restaurant_id = r.restaurant_id",
        "          WHERE r.is_active = 1 AND r.locality_id = l.locality_id AND rc.cuisine_id = c.cuisine_id) AS local_partners",
        "  FROM Locality l JOIN Cuisine c ON 1 = 1",
        ") grid",
        "WHERE local_partners = 0 AND partners_in_city > 0",
        "ORDER BY june_searches DESC, locality_name, cuisine_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Pairs that nobody searched for must be considered too, so the candidates come from every locality combined with every cuisine — a `CROSS JOIN`.",
      "\"No active restaurant here serves it\" is an anti join against the (locality, cuisine) pairs that active restaurants cover.",
      "Count the city's active restaurants per cuisine separately; an inner join to that count drops the gaps nobody in the city could fill.",
      "Searches are a `LEFT JOIN` to a pre-aggregated count, with `COALESCE` for the pairs never searched.",
    ],
    editorial: [
      "A gap is something **missing** from the data, so it cannot be found by grouping the rows that exist. Generate every candidate instead: `Locality CROSS JOIN Cuisine` is the full grid of (locality, cuisine) pairs, whether or not anyone serves or searches them. Everything else is filtering and decorating that grid.",
      "",
      "The local supply is the set of distinct (locality, cuisine) pairs covered by **active** restaurants — a paused restaurant does not feed anyone. `NOT EXISTS` against that set keeps the uncovered pairs. The city-level supply is a separate aggregate: active restaurants per city and cuisine, counted with `COUNT(DISTINCT restaurant_id)`. An inner join to it removes gaps that no restaurant in the city could fill, and its count is the `partners_in_city` column; since the locality itself has none, all of them are elsewhere in the city.",
      "",
      "Demand is pre-aggregated per pair for June and attached with a `LEFT JOIN`, so a pair nobody searched still appears with `COALESCE(…, 0)` searches. Aggregating before joining matters: joining raw searches to the grid and counting afterwards would work here, but joining raw searches *and* raw restaurants would multiply the two counts together.",
      "",
      "The alternative builds the same grid with `JOIN … ON 1 = 1` and computes the three counts with correlated subqueries, then filters on them. It is easy to read but runs three probes per pair; the CTE version reads each table once.",
    ].join("\n"),
  },

  {
    slug: "zomato-most-loved-dish-and-its-complaints",
    title: "Zomato: Most-Loved Dish of Each Restaurant and Its Complaints",
    difficulty: "HARD",
    topics: ["Aggregation", "Window Functions", "Joins", "Conditional Logic"],
    description: [
      "When diners review a restaurant on Zomato they can tag the dishes the review is about. The restaurant page highlights each restaurant's most-loved dish — and its owner wants to see the complaints about that same dish.",
      "",
      "A dish's **loved tags** at a restaurant are the reviews rated **4 or 5** that tag it; its **complaint tags** are the reviews rated **1 or 2** that tag it (3-star reviews count for neither). For each restaurant, return the dish(es) with the **most loved tags** — every dish tied at the top — with `restaurant_name`, `dish_name`, `loved_tags` and `complaint_tags`. A restaurant with no loved tag at all does not appear. Order by `restaurant_name`, then `dish_name`.",
    ].join("\n"),
    tables: [
      {
        name: "Restaurant",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "restaurant_name", type: "varchar" },
        ],
        primaryKey: ["restaurant_id"],
        note: "One row per restaurant; names are unique.",
      },
      {
        name: "Review",
        columns: [
          { name: "review_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "rating", type: "int" },
          { name: "posted_on", type: "date" },
        ],
        primaryKey: ["review_id"],
        note: "One row per review; `rating` is 1 to 5 stars.",
      },
      {
        name: "ReviewDishTag",
        columns: [
          { name: "review_id", type: "int" },
          { name: "dish_name", type: "varchar" },
        ],
        primaryKey: ["review_id", "dish_name"],
        note: "One row per dish a review tags; a review tags a dish at most once. Dish names are always spelled the same way.",
      },
    ],
    examples: [
      {
        Restaurant: [
          [1, "Biryani House"],
          [2, "Dosa Darbar"],
          [3, "Kebab Korner"],
        ],
        Review: [
          [1, 1, 5, "2024-08-01"],
          [2, 1, 4, "2024-08-03"],
          [3, 1, 2, "2024-08-04"],
          [4, 1, 5, "2024-08-09"],
          [5, 2, 5, "2024-08-02"],
          [6, 2, 4, "2024-08-05"],
          [7, 2, 1, "2024-08-07"],
          [8, 2, 3, "2024-08-08"],
          [9, 3, 2, "2024-08-06"],
        ],
        ReviewDishTag: [
          [1, "Veg Biryani"],
          [1, "Gulab Jamun"],
          [2, "Gulab Jamun"],
          [3, "Gulab Jamun"],
          [3, "Veg Biryani"],
          [4, "Veg Biryani"],
          [5, "Masala Dosa"],
          [6, "Filter Coffee"],
          [7, "Masala Dosa"],
          [8, "Filter Coffee"],
          [9, "Butter Chicken"],
        ],
      },
    ],
    gen: (rng) => {
      const r = ri(rng, 1, 4);
      const rest: Cell[][] = sample(rng, RESTAURANTS, r).map((name, i) => [i + 1, name]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 14);
      const reviews: Cell[][] = seq(1, n).map((id) => [id, ri(rng, 1, r), pick(rng, [1, 2, 3, 4, 4, 5, 5, 5]), dateBetween(rng, "2024-08-01", "2024-08-31")]);
      const menu = sample(rng, DISHES, ri(rng, 2, 4));
      const tags: Cell[][] = [];
      for (const rv of reviews) for (const d of sample(rng, menu, ri(rng, 0, 2))) tags.push([rv[0]!, d]);
      return { Restaurant: rest, Review: reviews, ReviewDishTag: shuffle(rng, tags) };
    },
    solution: [
      "WITH dish_counts AS (",
      "  SELECT v.restaurant_id, t.dish_name,",
      "         SUM(CASE WHEN v.rating >= 4 THEN 1 ELSE 0 END) AS loved_tags,",
      "         SUM(CASE WHEN v.rating <= 2 THEN 1 ELSE 0 END) AS complaint_tags",
      "  FROM ReviewDishTag t",
      "  JOIN Review v ON v.review_id = t.review_id",
      "  GROUP BY v.restaurant_id, t.dish_name",
      "),",
      "ranked AS (",
      "  SELECT restaurant_id, dish_name, loved_tags, complaint_tags,",
      "         RANK() OVER (PARTITION BY restaurant_id ORDER BY loved_tags DESC) AS pos",
      "  FROM dish_counts",
      "  WHERE loved_tags > 0",
      ")",
      "SELECT r.restaurant_name, k.dish_name, k.loved_tags, k.complaint_tags",
      "FROM ranked k",
      "JOIN Restaurant r ON r.restaurant_id = k.restaurant_id",
      "WHERE k.pos = 1",
      "ORDER BY r.restaurant_name, k.dish_name",
    ].join("\n"),
    alternatives: [
      [
        "WITH loved AS (",
        "  SELECT v.restaurant_id, t.dish_name, COUNT(*) AS n",
        "  FROM ReviewDishTag t JOIN Review v ON v.review_id = t.review_id",
        "  WHERE v.rating IN (4, 5)",
        "  GROUP BY v.restaurant_id, t.dish_name",
        ")",
        "SELECT r.restaurant_name, l.dish_name, l.n AS loved_tags,",
        "       (SELECT COUNT(*) FROM ReviewDishTag t2 JOIN Review v2 ON v2.review_id = t2.review_id",
        "        WHERE v2.restaurant_id = l.restaurant_id AND t2.dish_name = l.dish_name AND v2.rating IN (1, 2)) AS complaint_tags",
        "FROM loved l",
        "JOIN Restaurant r ON r.restaurant_id = l.restaurant_id",
        "WHERE l.n = (SELECT MAX(x.n) FROM loved x WHERE x.restaurant_id = l.restaurant_id)",
        "ORDER BY r.restaurant_name ASC, l.dish_name ASC",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The tags live in their own table, one row per (review, dish); join them to the review to learn the rating and the restaurant.",
      "Count loved and complaint tags per restaurant and dish in one pass with conditional sums.",
      "The \"most frequent value per group\" is the mode: rank the dishes by loved tags within each restaurant and keep rank 1 — `RANK`, so ties all stay.",
      "Drop dishes with no loved tag before ranking, or a restaurant whose dishes were only complained about would get a \"most-loved\" dish with 0.",
    ],
    editorial: [
      "This is a **mode with ties**: the most frequent value per group, where every value sharing the top frequency must come back. Because the tags are stored one per row in `ReviewDishTag`, the frequencies are a plain `GROUP BY` after joining each tag to its review (the review supplies the rating and the restaurant).",
      "",
      "Both counts come from the same groups. `SUM(CASE WHEN rating >= 4 …)` is the dish's loved tags and `SUM(CASE WHEN rating <= 2 …)` its complaint tags; 3-star reviews add to neither. Computing them together means the complaint count is ready for whichever dish turns out to be the mode, with no second pass.",
      "",
      "To find the mode, rank the dishes inside each restaurant by loved tags with `RANK()`. Tied dishes share rank 1, so all of them are returned — `ROW_NUMBER` would pick one arbitrarily and depend on storage order. The `loved_tags > 0` filter comes first: a restaurant whose tagged reviews are all complaints would otherwise have its dishes tied at 0 and be reported with a \"most-loved\" dish that nobody loved.",
      "",
      "The alternative counts loved tags only, keeps the dishes whose count equals the restaurant's `MAX`, and looks up the complaints with a correlated count — the classic pre-window way to compute a mode with ties. Both read the tags once for the counts; the window version also ranks in a single sort per restaurant.",
    ].join("\n"),
  },

  {
    slug: "zomato-restaurant-partner-anniversaries-in-november",
    title: "Zomato: Restaurant Partner Anniversaries Falling in November",
    difficulty: "HARD",
    topics: ["Dates", "Subqueries", "Conditional Logic"],
    description: [
      "Zomato's partner team sends every restaurant a thank-you card on the anniversary of the day it joined the platform, with a bigger gift on milestone years. They are preparing November 2024.",
      "",
      "Take every **active** restaurant whose partnership anniversary falls in **November 2024** — the day and month of `onboarded_on`, in 2024 — and that completes **at least one** whole year on it. Return `restaurant_id`, `restaurant_name`, `anniversary_date`, `years_completed` (whole years from `onboarded_on` to the anniversary), `tenure_on_nov_15` (whole years from `onboarded_on` to 2024-11-15 — one less for anniversaries after the 15th), `milestone` (`yes` when `years_completed` is 1, 5 or 10, else `no`) and `orders_in_year` — the restaurant's delivered orders dated on or after the date one year before the anniversary and before the anniversary itself. Order by `anniversary_date`, then `restaurant_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Restaurant",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "restaurant_name", type: "varchar" },
          { name: "onboarded_on", type: "date" },
          { name: "is_active", type: "bool" },
        ],
        primaryKey: ["restaurant_id"],
        note: "One row per restaurant partner; `onboarded_on` is the day it went live on Zomato.",
      },
      {
        name: "FoodOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "ordered_on", type: "date" },
          { name: "status", type: "enum", values: ["delivered", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per order placed with a restaurant.",
      },
    ],
    examples: [
      {
        Restaurant: [
          [1, "Spice Route", "2019-11-03", 1],
          [2, "Momo Point", "2023-11-30", 1],
          [3, "Pind Dhaba", "2014-11-15", 1],
          [4, "Pasta Street", "2024-11-02", 1],
          [5, "Wok Express", "2021-12-01", 1],
          [6, "Thali Theatre", "2020-11-20", 0],
          [7, "Udupi Corner", "2022-10-31", 1],
        ],
        FoodOrder: [
          [1, 1, "2023-11-03", "delivered"],
          [2, 1, "2024-11-02", "delivered"],
          [3, 1, "2024-11-03", "delivered"],
          [4, 1, "2024-05-10", "cancelled"],
          [5, 2, "2024-01-15", "delivered"],
          [6, 2, "2023-11-29", "delivered"],
          [7, 3, "2024-06-01", "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 2, 10);
      const rest: Cell[][] = sample(rng, RESTAURANTS, n).map((name, i) => {
        const year = ri(rng, 2013, 2024);
        const onboard = chance(rng, 0.75)
          ? `${year}-11-${pad(pick(rng, [1, 2, 14, 15, 16, 29, 30]))}`
          : pick(rng, [`${year}-10-31`, `${year}-12-01`, `${year}-06-15`]);
        return [i + 1, name, onboard, chance(rng, 0.85) ? 1 : 0];
      });
      const k = ri(rng, 0, 20);
      const orders: Cell[][] = seq(1, k).map((id) => [
        id,
        ri(rng, 1, n),
        chance(rng, 0.25) ? pick(rng, ["2023-11-01", "2023-11-15", "2023-11-16", "2024-11-14", "2024-11-15", "2024-11-30"]) : dateBetween(rng, "2023-10-01", "2024-11-30"),
        chance(rng, 0.8) ? "delivered" : "cancelled",
      ]);
      return { Restaurant: rest, FoodOrder: orders };
    },
    solution: [
      "WITH anniversaries AS (",
      "  SELECT restaurant_id, restaurant_name, onboarded_on,",
      "         DATE_ADD(onboarded_on, INTERVAL 2024 - YEAR(onboarded_on) YEAR) AS anniversary_date",
      "  FROM Restaurant",
      "  WHERE is_active = 1 AND MONTH(onboarded_on) = 11 AND YEAR(onboarded_on) < 2024",
      ")",
      "SELECT a.restaurant_id, a.restaurant_name, a.anniversary_date,",
      "       TIMESTAMPDIFF(YEAR, a.onboarded_on, a.anniversary_date) AS years_completed,",
      "       TIMESTAMPDIFF(YEAR, a.onboarded_on, '2024-11-15') AS tenure_on_nov_15,",
      "       CASE WHEN TIMESTAMPDIFF(YEAR, a.onboarded_on, a.anniversary_date) IN (1, 5, 10) THEN 'yes' ELSE 'no' END AS milestone,",
      "       (SELECT COUNT(*) FROM FoodOrder o",
      "        WHERE o.restaurant_id = a.restaurant_id AND o.status = 'delivered'",
      "          AND o.ordered_on >= DATE_SUB(a.anniversary_date, INTERVAL 1 YEAR)",
      "          AND o.ordered_on < a.anniversary_date) AS orders_in_year",
      "FROM anniversaries a",
      "ORDER BY a.anniversary_date, a.restaurant_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT restaurant_id, restaurant_name, anniversary_date, years_completed,",
        "       years_completed - CASE WHEN DAY(anniversary_date) > 15 THEN 1 ELSE 0 END AS tenure_on_nov_15,",
        "       IF(years_completed = 1 OR years_completed = 5 OR years_completed = 10, 'yes', 'no') AS milestone,",
        "       orders_in_year",
        "FROM (",
        "  SELECT r.restaurant_id, r.restaurant_name,",
        "         CAST(CONCAT('2024', SUBSTRING(r.onboarded_on, 5, 6)) AS DATE) AS anniversary_date,",
        "         2024 - YEAR(r.onboarded_on) AS years_completed,",
        "         (SELECT COUNT(*) FROM FoodOrder o",
        "          WHERE o.restaurant_id = r.restaurant_id AND o.status = 'delivered'",
        "            AND o.ordered_on >= CAST(CONCAT('2023', SUBSTRING(r.onboarded_on, 5, 6)) AS DATE)",
        "            AND o.ordered_on < CAST(CONCAT('2024', SUBSTRING(r.onboarded_on, 5, 6)) AS DATE)) AS orders_in_year",
        "  FROM Restaurant r",
        "  WHERE r.is_active = 1 AND r.onboarded_on LIKE '%-11-%' AND r.onboarded_on < '2024-01-01'",
        ") t",
        "ORDER BY anniversary_date, restaurant_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "An anniversary in November 2024 means the restaurant joined in some November before 2024 — `MONTH(onboarded_on) = 11`.",
      "The anniversary date is the joining date moved forward by `2024 − YEAR(onboarded_on)` years.",
      "`TIMESTAMPDIFF(YEAR, a, b)` counts **whole** years: it is one less until the day-and-month of `a` has been reached in `b`'s year.",
      "The \"year before the anniversary\" is `[anniversary − 1 year, anniversary)`, a half-open range.",
    ],
    editorial: [
      "Anniversaries are about the calendar, tenure about whole years. A restaurant's anniversary falls in November 2024 exactly when it joined in a November of an earlier year; a restaurant that joined in November 2024 itself completes 0 years and is excluded by `YEAR(onboarded_on) < 2024`. The anniversary date is `DATE_ADD(onboarded_on, INTERVAL 2024 − YEAR(onboarded_on) YEAR)` — every November day exists in every year, so the move never lands on an invalid date (a 29 February joiner would need care; such dates cannot fall in November).",
      "",
      "`TIMESTAMPDIFF(YEAR, start, end)` returns **completed** years, rounding down: from 2019-11-03 to 2024-11-03 it is 5, to 2024-11-02 only 4. That is why the two tenure columns differ. On the anniversary itself the full count is reached; on the report day, 15 November, restaurants whose anniversary is the 16th or later are still one year short, while one that joined on the 15th has just completed its year. The milestone flag tests the completed years against 1, 5 and 10.",
      "",
      "`orders_in_year` is a correlated count over the half-open window `[anniversary − 1 year, anniversary)`: the previous anniversary is in, the anniversary day itself is not, and cancelled orders are left out. Inactive restaurants get no card and are filtered first.",
      "",
      "The alternative builds the anniversary as text — `'2024'` plus the `-MM-DD` part of the joining date — computes years as `2024 − YEAR(…)`, and derives the 15 November tenure by subtracting one when the anniversary's day is after the 15th. Both are single passes over the restaurants; the date functions say the intent more plainly.",
    ].join("\n"),
  },

  {
    slug: "zomato-progressive-commission-on-monthly-sales",
    title: "Zomato: Progressive Commission on Each Restaurant's Monthly Sales",
    difficulty: "HARD",
    topics: ["Joins", "Aggregation", "Dates", "Window Functions"],
    description: [
      "In this exercise a restaurant's delivery commission is charged in **slabs**, like income tax: each slab's rate applies only to the part of the month's sales that falls inside that slab. The partner-finance team needs each restaurant's monthly commission.",
      "",
      "A restaurant's monthly sales is the sum of its `order_value` over the days of a month. The slabs in `CommissionSlab` are contiguous: slab 1 starts at 0, each slab starts where the previous one ends, and only the last slab has a NULL `upper_bound` (no limit). The part of sales `s` inside a slab is `min(s, upper_bound) − lower_bound` when `s` is above `lower_bound`, and 0 otherwise. For every restaurant and month with sales, return `restaurant_id`, `month` (as `YYYY-MM`), `sales`, `commission` = Σ part × `rate_pct` / 100 rounded to 2 decimals, and `top_slab` — the highest slab the sales reached. Order by `restaurant_id`, then `month`.",
    ].join("\n"),
    tables: [
      {
        name: "CommissionSlab",
        columns: [
          { name: "slab_no", type: "int" },
          { name: "lower_bound", type: "int" },
          { name: "upper_bound", type: "int" },
          { name: "rate_pct", type: "int" },
        ],
        primaryKey: ["slab_no"],
        note: "One row per slab, numbered from 1 in increasing bounds. Amounts in rupees; `rate_pct` is a percentage.",
      },
      {
        name: "DailySales",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "sale_date", type: "date" },
          { name: "order_value", type: "int" },
        ],
        primaryKey: ["restaurant_id", "sale_date"],
        note: "One row per restaurant per day with delivered orders: the day's total order value. Every value is positive.",
      },
    ],
    examples: [
      {
        CommissionSlab: [
          [1, 0, 50000, 25],
          [2, 50000, 200000, 20],
          [3, 200000, null, 15],
        ],
        DailySales: [
          [1, "2024-01-10", 30000],
          [1, "2024-01-31", 20000],
          [1, "2024-02-01", 120000],
          [2, "2024-01-05", 200000],
          [2, "2024-01-06", 50000],
          [3, "2024-01-20", 1999],
          [3, "2024-02-29", 50001],
        ],
      },
    ],
    gen: (rng) => {
      const k = ri(rng, 1, 4);
      const slabs: Cell[][] = [];
      let lower = 0;
      let rate = ri(rng, 20, 30);
      for (let s = 1; s <= k; s++) {
        const upper = s === k ? null : lower + roundTo(rng, 10000, 60000, 10000);
        slabs.push([s, lower, upper, rate]);
        if (upper !== null) lower = upper;
        rate = Math.max(5, rate - ri(rng, 1, 6));
      }
      const rows: Cell[][] = [];
      const rests = ri(rng, 1, 4);
      for (let r = 1; r <= rests; r++) {
        for (const d of sample(rng, ["2024-01-03", "2024-01-17", "2024-01-31", "2024-02-01", "2024-02-14", "2024-02-29", "2024-03-09"], ri(rng, 0, 4))) {
          const exact = chance(rng, 0.2) && slabs.length > 1 ? (slabs[0]![2] as number) : null;
          rows.push([r, d, exact ?? ri(rng, 500, 70000)]);
        }
      }
      return { CommissionSlab: shuffle(rng, slabs), DailySales: shuffle(rng, rows) };
    },
    solution: [
      "WITH monthly AS (",
      "  SELECT restaurant_id, DATE_FORMAT(sale_date, '%Y-%m') AS month, SUM(order_value) AS sales",
      "  FROM DailySales",
      "  GROUP BY restaurant_id, DATE_FORMAT(sale_date, '%Y-%m')",
      ")",
      "SELECT m.restaurant_id, m.month, m.sales,",
      "       ROUND(SUM((LEAST(m.sales, COALESCE(c.upper_bound, m.sales)) - c.lower_bound) * c.rate_pct / 100), 2) AS commission,",
      "       MAX(c.slab_no) AS top_slab",
      "FROM monthly m",
      "JOIN CommissionSlab c ON m.sales > c.lower_bound",
      "GROUP BY m.restaurant_id, m.month, m.sales",
      "ORDER BY m.restaurant_id, m.month",
    ].join("\n"),
    alternatives: [
      [
        "WITH monthly AS (",
        "  SELECT restaurant_id, ym AS month, SUM(order_value) AS sales",
        "  FROM (SELECT restaurant_id, LEFT(sale_date, 7) AS ym, order_value FROM DailySales) t",
        "  GROUP BY restaurant_id, ym",
        "),",
        "slab_base AS (",
        "  SELECT slab_no, lower_bound, upper_bound, rate_pct,",
        "         COALESCE(SUM((upper_bound - lower_bound) * rate_pct / 100)",
        "                    OVER (ORDER BY slab_no ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0) AS base",
        "  FROM CommissionSlab",
        ")",
        "SELECT m.restaurant_id, m.month, m.sales,",
        "       ROUND(b.base + (m.sales - b.lower_bound) * b.rate_pct / 100, 2) AS commission,",
        "       b.slab_no AS top_slab",
        "FROM monthly m",
        "JOIN slab_base b",
        "  ON m.sales > b.lower_bound AND (b.upper_bound IS NULL OR m.sales <= b.upper_bound)",
        "ORDER BY m.restaurant_id, m.month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Total the sales per restaurant and month first; the slabs apply to the month's total, not to each day.",
      "Join each month to every slab its sales reach (`sales > lower_bound`).",
      "Within a slab the taxable part is `LEAST(sales, upper_bound) − lower_bound`; a NULL upper bound means no limit, so `COALESCE` it to the sales.",
      "Alternatively, pre-compute the full commission of all lower slabs with a running window and add the top slab's share.",
    ],
    editorial: [
      "First aggregate: the slabs apply to a restaurant's **monthly** sales, so `DailySales` is summed per restaurant and month, the month written with `DATE_FORMAT(sale_date, '%Y-%m')` — grouped by the very same expression so MySQL's ONLY_FULL_GROUP_BY accepts it.",
      "",
      "Progressive slabs are a **range join**: each month is joined to every slab whose lower bound its sales exceed. In slab *k* the charged part is `LEAST(sales, upper) − lower` — the full width of the slab when the sales go past it, only the excess over `lower` in the slab where the sales stop. The last slab has no upper bound, and `COALESCE(upper_bound, sales)` turns \"no limit\" into \"up to the sales\". Summing part × rate / 100 over the joined slabs gives the commission, and `MAX(slab_no)` among them is the top slab reached. The strict `>` means sales exactly on a boundary stop at the lower slab — 50,000 is charged entirely at slab 1's rate.",
      "",
      "The alternative is how tax tables are usually printed: for each slab precompute `base`, the full commission of all slabs below it (a running `SUM` over the previous rows), then join each month to the **one** slab its sales fall in and add only that slab's share. It joins once per month instead of once per reached slab, which matters when the slab table is long. Both are exact on integer amounts; only the final figure is rounded.",
    ].join("\n"),
  },

  {
    slug: "zomato-orders-placed-while-restaurant-closed",
    title: "Zomato: Orders Placed While the Restaurant Was Closed",
    difficulty: "HARD",
    topics: ["Dates", "Subqueries", "Conditional Logic"],
    description: [
      "A restaurant's listing should accept orders only during its published opening hours. After a bug report, the listings team wants every order that slipped through while the restaurant was closed.",
      "",
      "`OpeningHours` has at most one row per restaurant and weekday (`weekday` uses `DAYOFWEEK` numbering, 1 = Sunday … 7 = Saturday; no row means closed all day). Hours are minutes after midnight. When `closes_min > opens_min` the restaurant is open from `opens_min` up to but not including `closes_min` that day; when `closes_min < opens_min` it stays open **past midnight**, until `closes_min` on the next day (Saturday's late hours run into Sunday). An order is placed while open if its time falls in its own day's hours or in the previous day's late hours. Return `order_id`, `restaurant_id` and `ordered_at` of the orders placed while **closed**, ordered by `order_id`.",
    ].join("\n"),
    tables: [
      {
        name: "OpeningHours",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "weekday", type: "int" },
          { name: "opens_min", type: "int" },
          { name: "closes_min", type: "int" },
        ],
        primaryKey: ["restaurant_id", "weekday"],
        note: "One row per restaurant per open weekday; 660 is 11:00 and 120 is 02:00. `closes_min` never equals `opens_min`.",
      },
      {
        name: "FoodOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "ordered_at", type: "datetime" },
        ],
        primaryKey: ["order_id"],
        note: "One row per order, on whole minutes. 2024-10-06 was a Sunday.",
      },
    ],
    examples: [
      {
        OpeningHours: [
          [1, 2, 660, 1380],
          [1, 3, 660, 1380],
          [1, 4, 660, 1380],
          [1, 5, 660, 1380],
          [1, 6, 660, 120],
          [1, 7, 660, 120],
        ],
        FoodOrder: [
          [1, 1, "2024-10-01 10:59:00"],
          [2, 1, "2024-10-01 11:00:00"],
          [3, 1, "2024-10-01 23:00:00"],
          [4, 1, "2024-10-05 01:30:00"],
          [5, 1, "2024-10-05 02:00:00"],
          [6, 1, "2024-10-06 01:00:00"],
          [7, 1, "2024-10-06 13:00:00"],
          [8, 2, "2024-10-02 12:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rests = ri(rng, 1, 3);
      const hours: Cell[][] = [];
      for (let r = 1; r <= rests; r++) {
        for (const w of sample(rng, seq(1, 7), ri(rng, 3, 7))) {
          const opens = pick(rng, [360, 480, 660, 720, 1080]);
          const closes = chance(rng, 0.4) ? pick(rng, [0, 60, 120, 180]) : Math.min(1439, opens + pick(rng, [240, 480, 600]));
          hours.push([r, w, opens, closes]);
        }
      }
      const n = ri(rng, 3, 20);
      const orders: Cell[][] = seq(1, n).map((id) => {
        const minute = chance(rng, 0.35) ? pick(rng, [0, 59, 60, 119, 120, 179, 359, 360, 480, 660, 720, 1080, 1139]) : ri(rng, 0, 1439);
        return [id, ri(rng, 1, rests + (chance(rng, 0.1) ? 1 : 0)), at(dateBetween(rng, "2024-10-01", "2024-10-14"), minute)];
      });
      return { OpeningHours: shuffle(rng, hours), FoodOrder: orders };
    },
    solution: [
      "SELECT o.order_id, o.restaurant_id, o.ordered_at",
      "FROM FoodOrder o",
      "WHERE NOT EXISTS (",
      "        SELECT 1 FROM OpeningHours h",
      "        WHERE h.restaurant_id = o.restaurant_id",
      "          AND h.weekday = DAYOFWEEK(o.ordered_at)",
      "          AND HOUR(o.ordered_at) * 60 + MINUTE(o.ordered_at) >= h.opens_min",
      "          AND (h.closes_min < h.opens_min OR HOUR(o.ordered_at) * 60 + MINUTE(o.ordered_at) < h.closes_min)",
      "      )",
      "  AND NOT EXISTS (",
      "        SELECT 1 FROM OpeningHours h",
      "        WHERE h.restaurant_id = o.restaurant_id",
      "          AND h.weekday = DAYOFWEEK(DATE_SUB(o.ordered_at, INTERVAL 1 DAY))",
      "          AND h.closes_min < h.opens_min",
      "          AND HOUR(o.ordered_at) * 60 + MINUTE(o.ordered_at) < h.closes_min",
      "      )",
      "ORDER BY o.order_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH week_spans AS (",
        "  SELECT restaurant_id,",
        "         (weekday - 1) * 1440 + opens_min AS span_start,",
        "         (weekday - 1) * 1440 + opens_min + MOD(closes_min - opens_min + 1440, 1440) AS span_end",
        "  FROM OpeningHours",
        "),",
        "placed AS (",
        "  SELECT order_id, restaurant_id, ordered_at,",
        "         (DAYOFWEEK(ordered_at) - 1) * 1440 + HOUR(ordered_at) * 60 + MINUTE(ordered_at) AS week_min",
        "  FROM FoodOrder",
        ")",
        "SELECT p.order_id, p.restaurant_id, p.ordered_at",
        "FROM placed p",
        "LEFT JOIN week_spans s",
        "  ON s.restaurant_id = p.restaurant_id",
        " AND ((p.week_min >= s.span_start AND p.week_min < s.span_end)",
        "      OR p.week_min + 10080 < s.span_end)",
        "WHERE s.restaurant_id IS NULL",
        "ORDER BY p.order_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "An order is fine if **either** its own weekday's hours or the previous weekday's after-midnight hours cover it — check both.",
      "`HOUR(t) * 60 + MINUTE(t)` puts the order's time on the same minutes-after-midnight scale as the table.",
      "The previous weekday is `DAYOFWEEK(DATE_SUB(t, INTERVAL 1 DAY))` — that also turns Sunday's 'previous day' into Saturday.",
      "Or lay the whole week on one line of 10,080 minutes and let a Saturday-night span run past the end, wrapping into Sunday morning.",
    ],
    editorial: [
      "The difficulty is that a day's hours do not stay inside the day. A restaurant open 11:00–02:00 on Friday is open at 01:30 on **Saturday**, so an order must be checked against two rows: its own weekday's, and the previous weekday's when that one runs past midnight.",
      "",
      "Against its own day, the order's minute-of-day `m = HOUR*60 + MINUTE` must be at least `opens_min`, and either before `closes_min` (normal hours) or anywhere until midnight (late hours, `closes_min < opens_min`). Against the previous day, the row must be a late one and `m < closes_min`. The previous weekday comes from `DAYOFWEEK(DATE_SUB(ordered_at, INTERVAL 1 DAY))`, which wraps Sunday back to Saturday without any arithmetic. An order is open if either test finds a row, so a closed order is one where **both** `NOT EXISTS` hold; a restaurant with no hours at all fails both and every order of it is reported. Closing times are exclusive: an order at exactly 23:00 for hours ending at 23:00 is closed.",
      "",
      "The alternative removes the day boundary altogether. Each row becomes a span on a 10,080-minute week (`(weekday − 1) × 1440 + opens`), whose length is `(closes − opens + 1440) MOD 1440`, so late hours simply extend past the next midnight. The order becomes a week-minute too, and it is open when some span contains it — or, for Saturday-night spans that run past the end of the week, contains it shifted by one week (`week_min + 10080`). A `LEFT JOIN … IS NULL` keeps the orders no span contains. It is the standard trick for cyclic time: unroll the cycle once.",
    ].join("\n"),
  },

  {
    slug: "zomato-ratings-before-and-after-a-hygiene-audit",
    title: "Zomato: Ratings Before and After a Hygiene Audit",
    difficulty: "HARD",
    topics: ["Joins", "Aggregation", "Conditional Logic", "Dates"],
    description: [
      "After a hygiene audit a restaurant's new grade is shown on its page. The trust-and-safety team wants to see whether diners rate a restaurant differently after an audit.",
      "",
      "For each audit, take the restaurant's reviews posted in the **30 days before** the audit (`audit_date − 30` to `audit_date − 1`) and the **30 days after** it (`audit_date + 1` to `audit_date + 30`); reviews on the audit day itself are ignored. Report only audits with **at least 2 reviews in each window**. Return `audit_id`, `restaurant_name`, `grade`, `avg_before` and `avg_after` (each rounded to 2 decimals) and `rating_change` = `avg_after − avg_before`, the difference of the two **rounded** averages as the page shows them. Order by `rating_change` descending, then `audit_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Restaurant",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "restaurant_name", type: "varchar" },
        ],
        primaryKey: ["restaurant_id"],
        note: "One row per restaurant.",
      },
      {
        name: "HygieneAudit",
        columns: [
          { name: "audit_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "audit_date", type: "date" },
          { name: "grade", type: "enum", values: [...HYGIENE_GRADES] },
        ],
        primaryKey: ["audit_id"],
        note: "One row per audit; a restaurant may be audited more than once.",
      },
      {
        name: "RestaurantReview",
        columns: [
          { name: "review_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "rating", type: "int" },
          { name: "posted_on", type: "date" },
        ],
        primaryKey: ["review_id"],
        note: "One row per review; `rating` is 1 to 5 stars.",
      },
    ],
    examples: [
      {
        Restaurant: [
          [1, "Chaat Junction"],
          [2, "Coastal Curry"],
          [3, "Idli Express"],
        ],
        HygieneAudit: [
          [1, 1, "2024-05-15", "Very Good"],
          [2, 2, "2024-05-20", "Excellent"],
          [3, 3, "2024-06-01", "Good"],
        ],
        RestaurantReview: [
          [1, 1, 3, "2024-04-20"],
          [2, 1, 2, "2024-05-10"],
          [3, 1, 5, "2024-05-15"],
          [4, 1, 4, "2024-05-20"],
          [5, 1, 5, "2024-06-14"],
          [6, 1, 1, "2024-04-14"],
          [7, 2, 4, "2024-05-01"],
          [8, 2, 4, "2024-05-19"],
          [9, 2, 3, "2024-05-21"],
          [10, 2, 4, "2024-06-10"],
          [11, 2, 4, "2024-06-12"],
          [12, 3, 4, "2024-05-25"],
          [13, 3, 5, "2024-06-05"],
          [14, 3, 5, "2024-06-20"],
        ],
      },
    ],
    gen: (rng) => {
      const r = ri(rng, 1, 4);
      const rest: Cell[][] = sample(rng, RESTAURANTS, r).map((name, i) => [i + 1, name]);
      const audits: Cell[][] = seq(1, ri(rng, 1, 5)).map((id) => [id, ri(rng, 1, r), dateBetween(rng, "2024-05-01", "2024-06-30"), pick(rng, HYGIENE_GRADES)]);
      const reviews: Cell[][] = [];
      let id = 1;
      for (const a of audits) {
        // Reviews around this audit: before, after, on the day and just past either edge.
        const k = ri(rng, 2, 7);
        for (let j = 0; j < k && reviews.length < 28; j++) {
          const offset = chance(rng, 0.2) ? pick(rng, [-31, -30, -1, 0, 1, 30, 31]) : ri(rng, -30, 30);
          reviews.push([id++, a[1]!, ri(rng, 1, 5), addDays(a[2] as string, offset)]);
        }
      }
      return { Restaurant: rest, HygieneAudit: audits, RestaurantReview: shuffle(rng, reviews) };
    },
    solution: [
      "SELECT a.audit_id, r.restaurant_name, a.grade,",
      "       ROUND(AVG(CASE WHEN v.posted_on < a.audit_date THEN v.rating END), 2) AS avg_before,",
      "       ROUND(AVG(CASE WHEN v.posted_on > a.audit_date THEN v.rating END), 2) AS avg_after,",
      "       ROUND(ROUND(AVG(CASE WHEN v.posted_on > a.audit_date THEN v.rating END), 2)",
      "           - ROUND(AVG(CASE WHEN v.posted_on < a.audit_date THEN v.rating END), 2), 2) AS rating_change",
      "FROM HygieneAudit a",
      "JOIN Restaurant r ON r.restaurant_id = a.restaurant_id",
      "JOIN RestaurantReview v",
      "  ON v.restaurant_id = a.restaurant_id",
      " AND v.posted_on BETWEEN DATE_SUB(a.audit_date, INTERVAL 30 DAY) AND DATE_ADD(a.audit_date, INTERVAL 30 DAY)",
      " AND v.posted_on <> a.audit_date",
      "GROUP BY a.audit_id, r.restaurant_name, a.grade",
      "HAVING COUNT(CASE WHEN v.posted_on < a.audit_date THEN 1 END) >= 2",
      "   AND COUNT(CASE WHEN v.posted_on > a.audit_date THEN 1 END) >= 2",
      "ORDER BY rating_change DESC, a.audit_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH before_w AS (",
        "  SELECT a.audit_id, AVG(v.rating) AS avg_b, COUNT(*) AS n_b",
        "  FROM HygieneAudit a JOIN RestaurantReview v ON v.restaurant_id = a.restaurant_id",
        "  WHERE v.posted_on >= DATE_SUB(a.audit_date, INTERVAL 30 DAY) AND v.posted_on < a.audit_date",
        "  GROUP BY a.audit_id",
        "),",
        "after_w AS (",
        "  SELECT a.audit_id, AVG(v.rating) AS avg_a, COUNT(*) AS n_a",
        "  FROM HygieneAudit a JOIN RestaurantReview v ON v.restaurant_id = a.restaurant_id",
        "  WHERE v.posted_on > a.audit_date AND v.posted_on <= DATE_ADD(a.audit_date, INTERVAL 30 DAY)",
        "  GROUP BY a.audit_id",
        ")",
        "SELECT a.audit_id, r.restaurant_name, a.grade,",
        "       ROUND(b.avg_b, 2) AS avg_before, ROUND(f.avg_a, 2) AS avg_after,",
        "       ROUND(ROUND(f.avg_a, 2) - ROUND(b.avg_b, 2), 2) AS rating_change",
        "FROM HygieneAudit a",
        "JOIN Restaurant r ON r.restaurant_id = a.restaurant_id",
        "JOIN before_w b ON b.audit_id = a.audit_id",
        "JOIN after_w f ON f.audit_id = a.audit_id",
        "WHERE b.n_b >= 2 AND f.n_a >= 2",
        "ORDER BY rating_change DESC, a.audit_id ASC",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Join each audit to its restaurant's reviews within 30 days either side, leaving out the audit day.",
      "With all of one audit's nearby reviews in one group, `AVG(CASE WHEN posted_on < audit_date THEN rating END)` is the before-average — `AVG` skips the NULLs of the other window.",
      "The \"at least 2 in each window\" rule is a pair of conditional counts in `HAVING`.",
      "The change is the difference of the two figures the row shows — round each average first, then subtract.",
    ],
    editorial: [
      "Each audit defines its own pair of windows, so the reviews are joined to the audit, not just to the restaurant: same restaurant, `posted_on` within 30 days either side (`DATE_SUB`/`DATE_ADD` bound the range inclusively) and not on the audit day. A restaurant audited twice has its reviews joined to each audit separately, and a review may fall into windows of both.",
      "",
      "Grouping by audit puts all of its nearby reviews in one group, and **conditional aggregation** splits them: `AVG(CASE WHEN posted_on < audit_date THEN rating END)` averages only the before-window, because the `CASE` yields NULL for the after-window rows and `AVG` ignores NULLs; the same with `>` gives the after-average. The minimum-size rule is two conditional counts in `HAVING` — an audit with one review on a side would show a change based on a single opinion.",
      "",
      "The change is the difference of the two **rounded** averages, so the row's three numbers always agree with each other (3.20 − 3.38 = −0.18). Rounding the unrounded difference instead can disagree with them by a cent, and lands on a .5 when an average ends in 5 at the third decimal (3.375 with eight reviews) — exactly where engines disagree about which way to round. Subtracting two 2-decimal figures is exact, and the outer `ROUND(…, 2)` only removes binary noise so equal changes compare equal in the ordering. The order uses that change with `audit_id` as tie-break.",
      "",
      "The alternative computes the before and after windows in two separate aggregates and joins them — an inner join to both also enforces that each window has reviews. It reads the reviews twice instead of once, but each part is simpler to check.",
    ].join("\n"),
  },
];
