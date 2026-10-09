import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, atTime, chance, CITIES, dateBetween, FIRST_NAMES, LAST_NAMES, maybeNull, names, pick, ri, roundTo, sample } from "./kit.js";

/**
 * Food delivery and quick commerce: the questions an analyst, an ops lead or
 * a city manager at a delivery app or a ten-minute grocery service is asked —
 * restaurants and their menus, orders and their bills (surge fees, coupons,
 * GST-free item totals in rupees), riders, their shifts and their SLAs,
 * ratings, cancellations and refunds, dark stores, peak hours, cohorts and
 * checkout funnels. Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);

/** Invented restaurant names — no real brand. */
const RESTAURANTS = [
  "Spice Route", "Dosa Junction", "Biryani Bay", "Tandoor Tales", "Udupi Upahar", "Momo Mansion",
  "Chaat Corner", "Pizza Planet", "Wok Express", "Green Bowl", "Kebab Kothi", "Idli Factory",
  "Paratha Point", "Curry Leaf", "Burger Barn", "Thali Times",
] as const;
const CUISINES = ["North Indian", "South Indian", "Chinese", "Biryani", "Pizza", "Street Food"] as const;
const DISHES = [
  ["Chicken Biryani", 280], ["Paneer Butter Masala", 240], ["Masala Dosa", 90], ["Veg Hakka Noodles", 180],
  ["Margherita Pizza", 299], ["Pav Bhaji", 140], ["Chole Bhature", 160], ["Gulab Jamun", 70],
  ["Mutton Rogan Josh", 380], ["Idli Sambar", 70], ["Veg Momos", 120], ["Dal Makhani", 210],
] as const;
const LOCALITIES = ["Koramangala", "HSR Layout", "Indiranagar", "Bandra West", "Powai", "Andheri East", "Gachibowli", "Salt Lake", "Viman Nagar", "Velachery"] as const;
const fullName = (rng: () => number): string => `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
const phone = (rng: () => number): number => ri(rng, 6, 9) * 1_000_000_000 + ri(rng, 0, 999_999_999);

/** Food delivery and quick commerce problems. */
export const WORLD_FOOD_DELIVERY: SqlProblemSpec[] = [
  {
    slug: "pure-veg-restaurants-rated-four-point-two",
    title: "Pure-Veg Restaurants Rated 4.2 or Higher",
    difficulty: "EASY",
    topics: ["Basics"],
    description: [
      "The app's \"Pure Veg\" collection page lists restaurants that serve no meat or egg, are currently **accepting orders**, and hold an average rating of **at least 4.2**. A restaurant that has just joined has no rating yet (`avg_rating` NULL) and is never listed.",
      "",
      "Return `restaurant_id`, `name` and `avg_rating` for every restaurant that qualifies, ordered by `avg_rating` descending, then by `restaurant_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Restaurant",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "city", type: "varchar" },
          { name: "is_pure_veg", type: "bool" },
          { name: "is_accepting_orders", type: "bool" },
          { name: "avg_rating", type: "decimal" },
        ],
        primaryKey: ["restaurant_id"],
        note: "One row per restaurant on the app. `avg_rating` is on a 1–5 scale with one decimal, NULL until the first rating.",
      },
    ],
    examples: [
      {
        Restaurant: [
          [1, "Udupi Upahar", "Bengaluru", 1, 1, 4.5],
          [2, "Kebab Kothi", "Delhi", 0, 1, 4.6],
          [3, "Dosa Junction", "Chennai", 1, 1, 4.2],
          [4, "Thali Times", "Ahmedabad", 1, 0, 4.8],
          [5, "Green Bowl", "Pune", 1, 1, null],
          [6, "Idli Factory", "Bengaluru", 1, 1, 4.1],
          [7, "Chaat Corner", "Jaipur", 1, 1, 4.5],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const rows = sample(rng, RESTAURANTS, n).map((name, i) => [
        i + 1,
        name,
        pick(rng, CITIES),
        chance(rng, 0.6) ? 1 : 0,
        chance(rng, 0.8) ? 1 : 0,
        // A rating pool around the 4.2 boundary, so equal ratings and the boundary itself are common.
        maybeNull(rng, 0.12, pick(rng, [3.8, 4.0, 4.1, 4.2, 4.2, 4.3, 4.5, 4.5, 4.7])),
      ]);
      return { Restaurant: rows };
    },
    solution: [
      "SELECT restaurant_id, name, avg_rating",
      "FROM Restaurant",
      "WHERE is_pure_veg = 1",
      "  AND is_accepting_orders = 1",
      "  AND avg_rating >= 4.2",
      "ORDER BY avg_rating DESC, restaurant_id",
    ].join("\n"),
    alternatives: [
      "SELECT restaurant_id, name, avg_rating FROM Restaurant WHERE is_pure_veg AND is_accepting_orders AND NOT (avg_rating < 4.2) ORDER BY avg_rating DESC, restaurant_id ASC",
      "SELECT restaurant_id, name, avg_rating FROM Restaurant WHERE is_pure_veg + is_accepting_orders = 2 AND avg_rating BETWEEN 4.2 AND 5 ORDER BY 3 DESC, 1",
    ],
    ordered: true,
    hints: [
      "Three conditions must all hold, so they are joined with AND.",
      "\"At least 4.2\" includes 4.2 itself.",
      "What does a comparison with NULL return, and does WHERE keep such a row?",
      "Two restaurants can share a rating; the order needs a second key to be fixed.",
    ],
    editorial: [
      "This is a plain filter over one table. A restaurant belongs on the page when three things are all true: it is pure veg, it is accepting orders right now, and its average rating is at least 4.2. Each is one comparison, and AND combines them.",
      "",
      "\"At least\" means `>=`, so a restaurant sitting exactly at 4.2 is listed. A restaurant with no rating has `avg_rating` NULL; `NULL >= 4.2` is unknown, and WHERE keeps only rows whose condition is true, so new restaurants drop out without an extra `IS NOT NULL` — the same holds for `NOT (avg_rating < 4.2)`, because NOT of unknown is still unknown.",
      "",
      "The order is fixed by the statement: highest rating first, and since ratings repeat, `restaurant_id` breaks the tie. Without the second key two restaurants rated 4.5 could come back in either order. The query reads the table once; an index on `(is_pure_veg, is_accepting_orders, avg_rating)` would serve it directly.",
    ].join("\n"),
  },

  {
    slug: "payable-amount-on-surge-priced-orders",
    title: "Payable Amount on Surge-Priced Orders",
    difficulty: "EASY",
    topics: ["Basics", "Conditional Logic"],
    description: [
      "When it rains or the dinner rush outruns the rider fleet, the app adds a surge fee to the bill. A coupon, if one was applied, takes `discount` rupees off; orders without a coupon have `discount` NULL.",
      "",
      "For every order that carried a surge fee (**`surge_fee` greater than 0**), return `order_id`, `surge_fee` and `payable`, where `payable = item_total + delivery_fee + surge_fee − discount` and a missing discount counts as 0. Order the rows by `payable` descending, then `order_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "FoodOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "placed_at", type: "datetime" },
          { name: "item_total", type: "int" },
          { name: "delivery_fee", type: "int" },
          { name: "surge_fee", type: "int" },
          { name: "discount", type: "int" },
        ],
        primaryKey: ["order_id"],
        note: "Amounts are in rupees. `surge_fee` is 0 when no surge applied; `discount` is NULL when no coupon was used.",
      },
    ],
    examples: [
      {
        FoodOrder: [
          [5001, 11, "2024-07-14 20:05:00", 450, 30, 25, null],
          [5002, 12, "2024-07-14 20:11:00", 320, 30, 0, 50],
          [5003, 13, "2024-07-14 20:40:00", 610, 0, 40, 100],
          [5004, 11, "2024-07-15 13:02:00", 280, 25, 15, 20],
          [5005, 14, "2024-07-15 21:30:00", 240, 25, 10, null],
          [5006, 15, "2024-07-16 12:45:00", 199, 30, 0, null],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 15);
      const rows = seq(5001, n).map((id) => {
        const day = dateBetween(rng, "2024-07-01", "2024-07-31");
        return [
          id,
          ri(rng, 11, 20),
          atTime(rng, day),
          roundTo(rng, 150, 900, 10),
          pick(rng, [0, 20, 25, 30, 40]),
          chance(rng, 0.6) ? pick(rng, [10, 15, 20, 25, 40]) : 0,
          maybeNull(rng, 0.5, pick(rng, [20, 50, 75, 100])),
        ];
      });
      return { FoodOrder: rows };
    },
    solution: [
      "SELECT order_id, surge_fee,",
      "       item_total + delivery_fee + surge_fee - COALESCE(discount, 0) AS payable",
      "FROM FoodOrder",
      "WHERE surge_fee > 0",
      "ORDER BY payable DESC, order_id",
    ].join("\n"),
    alternatives: [
      "SELECT order_id, surge_fee, item_total + delivery_fee + surge_fee - IFNULL(discount, 0) AS payable FROM FoodOrder WHERE surge_fee > 0 ORDER BY 3 DESC, 1",
      "SELECT order_id, surge_fee, CASE WHEN discount IS NULL THEN item_total + delivery_fee + surge_fee ELSE item_total + delivery_fee + surge_fee - discount END AS payable FROM FoodOrder WHERE surge_fee <> 0 ORDER BY payable DESC, order_id",
    ],
    ordered: true,
    hints: [
      "Keep only the rows whose surge fee is positive.",
      "Arithmetic with a NULL gives NULL — what should a missing discount be instead?",
      "COALESCE or IFNULL turns the NULL into 0 for the subtraction.",
    ],
    editorial: [
      "The filter is one comparison, `surge_fee > 0`. The computed column is where the care goes: in SQL any arithmetic that touches a NULL yields NULL, so `450 + 30 + 25 - NULL` is NULL, not 505. The statement says a missing discount counts as zero, which is exactly what `COALESCE(discount, 0)` (or MySQL's `IFNULL`) says: use the discount if there is one, else 0.",
      "",
      "A `CASE WHEN discount IS NULL …` spelling is equivalent and sometimes clearer to a reader who has not met COALESCE. The alias `payable` can be used in ORDER BY because ORDER BY runs after the SELECT list is computed; two orders can owe the same amount, so `order_id` fixes the order between them.",
      "",
      "One pass over the table; nothing is joined or grouped.",
    ].join("\n"),
  },

  {
    slug: "menu-items-nobody-has-ordered",
    title: "Menu Items Nobody Has Ordered",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "The menu team wants to prune dead dishes. An order line records one dish in one order; a dish that appears in no order line has never been ordered.",
      "",
      "Return every menu item with **no order line at all**, as columns `restaurant` (the restaurant's name), `item_name` and `price`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Restaurant",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "name", type: "varchar" },
        ],
        primaryKey: ["restaurant_id"],
        note: "One row per restaurant.",
      },
      {
        name: "MenuItem",
        columns: [
          { name: "item_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "item_name", type: "varchar" },
          { name: "price", type: "int" },
        ],
        primaryKey: ["item_id"],
        note: "One row per dish on a restaurant's menu; `restaurant_id` is always in `Restaurant`. Two restaurants may sell a dish of the same name.",
      },
      {
        name: "OrderLine",
        columns: [
          { name: "order_id", type: "int" },
          { name: "item_id", type: "int" },
          { name: "quantity", type: "int" },
        ],
        primaryKey: ["order_id", "item_id"],
        note: "One row per dish in an order; `item_id` is always in `MenuItem`.",
      },
    ],
    examples: [
      {
        Restaurant: [
          [1, "Biryani Bay"],
          [2, "Dosa Junction"],
        ],
        MenuItem: [
          [10, 1, "Chicken Biryani", 280],
          [11, 1, "Gulab Jamun", 70],
          [12, 1, "Mutton Rogan Josh", 380],
          [20, 2, "Masala Dosa", 90],
          [21, 2, "Gulab Jamun", 60],
          [22, 2, "Idli Sambar", 70],
        ],
        OrderLine: [
          [9001, 10, 2],
          [9001, 11, 1],
          [9002, 20, 1],
          [9003, 10, 1],
          [9003, 22, 3],
        ],
      },
    ],
    gen: (rng) => {
      const restaurants = sample(rng, RESTAURANTS, ri(rng, 1, 4)).map((name, i) => [i + 1, name]);
      const items: Cell[][] = [];
      let id = 10;
      for (const r of restaurants) {
        for (const [dish, price] of sample(rng, DISHES, ri(rng, 0, 5))) items.push([id++, r[0]!, dish, price]);
      }
      const lines: Cell[][] = [];
      const ids = items.map((i) => i[0] as number);
      const popular = chance(rng, 0.1) ? ids : sample(rng, ids, ri(rng, 0, ids.length));
      for (const order of seq(9001, popular.length ? ri(rng, 0, 8) : 0)) {
        for (const item of sample(rng, popular, ri(rng, 1, 3))) lines.push([order, item, ri(rng, 1, 3)]);
      }
      return { Restaurant: restaurants, MenuItem: items, OrderLine: lines };
    },
    solution: [
      "SELECT r.name AS restaurant, m.item_name, m.price",
      "FROM MenuItem m",
      "JOIN Restaurant r ON r.restaurant_id = m.restaurant_id",
      "LEFT JOIN OrderLine o ON o.item_id = m.item_id",
      "WHERE o.order_id IS NULL",
    ].join("\n"),
    alternatives: [
      "SELECT r.name AS restaurant, m.item_name, m.price FROM MenuItem m JOIN Restaurant r ON r.restaurant_id = m.restaurant_id WHERE NOT EXISTS (SELECT 1 FROM OrderLine o WHERE o.item_id = m.item_id)",
      "SELECT r.name AS restaurant, m.item_name, m.price FROM MenuItem m JOIN Restaurant r ON r.restaurant_id = m.restaurant_id WHERE m.item_id NOT IN (SELECT item_id FROM OrderLine)",
    ],
    hints: [
      "Each answer row is a menu item; look for that item's order lines by its id, not its name.",
      "A LEFT JOIN keeps an item with no matching order line, and fills the order line's columns with NULL.",
      "The restaurant's name comes from a second, ordinary join.",
    ],
    editorial: [
      "This is an anti join: menu items that have no partner in `OrderLine`. Start from `MenuItem`, join `Restaurant` for the name (every item has a restaurant, so an inner join loses nothing), and LEFT JOIN `OrderLine` on `item_id`. An item that was ordered appears once per order line; an item that never was appears once with NULL in every order-line column, and `o.order_id IS NULL` keeps exactly those.",
      "",
      "Match on `item_id`, not on `item_name`: two restaurants both sell Gulab Jamun, and one restaurant's sales say nothing about the other's dish.",
      "",
      "`NOT EXISTS` states the same rule directly and stops at the first matching line. `NOT IN` is safe here only because `OrderLine.item_id` is part of the primary key and never NULL — with a nullable column it would silently return nothing. With an index on `OrderLine.item_id` every form is one lookup per menu item.",
    ].join("\n"),
  },

  {
    slug: "delivered-gmv-of-every-dark-store",
    title: "Delivered GMV of Every Dark Store",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "A quick-commerce company runs small warehouses (dark stores) that pack ten-minute grocery orders. Finance wants each store's count of **delivered** orders and their gross merchandise value; cancelled orders are not counted, and a store with no delivered order must still appear with zeros.",
      "",
      "Return `store_id`, `locality`, `delivered_orders` and `gmv` (sum of `order_value` of delivered orders, 0 when there are none) for every dark store, ordered by `gmv` descending, then `store_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "DarkStore",
        columns: [
          { name: "store_id", type: "int" },
          { name: "locality", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["store_id"],
        note: "One row per dark store.",
      },
      {
        name: "QuickOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "ordered_at", type: "datetime" },
          { name: "order_value", type: "int" },
          { name: "status", type: "enum", values: ["delivered", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per order, in rupees. `store_id` is always in `DarkStore`.",
      },
    ],
    examples: [
      {
        DarkStore: [
          [1, "Koramangala", "Bengaluru"],
          [2, "Powai", "Mumbai"],
          [3, "Gachibowli", "Hyderabad"],
          [4, "Salt Lake", "Kolkata"],
        ],
        QuickOrder: [
          [101, 1, "2024-10-02 08:15:00", 420, "delivered"],
          [102, 1, "2024-10-02 09:40:00", 180, "cancelled"],
          [103, 2, "2024-10-02 10:05:00", 600, "delivered"],
          [104, 1, "2024-10-03 19:20:00", 180, "delivered"],
          [105, 3, "2024-10-03 21:10:00", 250, "cancelled"],
          [106, 2, "2024-10-04 07:55:00", 99, "cancelled"],
        ],
      },
    ],
    gen: (rng) => {
      const stores = sample(rng, LOCALITIES, ri(rng, 1, 6)).map((loc, i) => [i + 1, loc, pick(rng, CITIES)]);
      const n = chance(rng, 0.08) ? 0 : ri(rng, 1, 20);
      const orders = seq(101, n).map((id) => [
        id,
        ri(rng, 1, stores.length),
        atTime(rng, dateBetween(rng, "2024-10-01", "2024-10-07")),
        roundTo(rng, 90, 900, 30),
        chance(rng, 0.75) ? "delivered" : "cancelled",
      ]);
      return { DarkStore: stores, QuickOrder: orders };
    },
    solution: [
      "SELECT s.store_id, s.locality,",
      "       COUNT(o.order_id) AS delivered_orders,",
      "       COALESCE(SUM(o.order_value), 0) AS gmv",
      "FROM DarkStore s",
      "LEFT JOIN QuickOrder o ON o.store_id = s.store_id AND o.status = 'delivered'",
      "GROUP BY s.store_id, s.locality",
      "ORDER BY gmv DESC, s.store_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT s.store_id, s.locality,",
        "       SUM(CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END) AS delivered_orders,",
        "       SUM(CASE WHEN o.status = 'delivered' THEN o.order_value ELSE 0 END) AS gmv",
        "FROM DarkStore s LEFT JOIN QuickOrder o ON o.store_id = s.store_id",
        "GROUP BY s.store_id, s.locality",
        "ORDER BY gmv DESC, s.store_id",
      ].join("\n"),
      [
        "SELECT s.store_id, s.locality,",
        "       (SELECT COUNT(*) FROM QuickOrder o WHERE o.store_id = s.store_id AND o.status = 'delivered') AS delivered_orders,",
        "       (SELECT COALESCE(SUM(order_value), 0) FROM QuickOrder o WHERE o.store_id = s.store_id AND o.status = 'delivered') AS gmv",
        "FROM DarkStore s ORDER BY gmv DESC, s.store_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Every store must appear, so start from `DarkStore` and LEFT JOIN the orders.",
      "If the status filter goes in WHERE, what happens to a store whose only orders were cancelled?",
      "COUNT of a column skips NULLs; SUM over no rows is NULL, not 0.",
    ],
    editorial: [
      "Every store must be in the answer, so the query starts from `DarkStore` and LEFT JOINs `QuickOrder`, then groups by store. The subtle part is where the `status = 'delivered'` condition goes. Put in WHERE, it runs after the join and removes the NULL-extended row of a store that had no orders — and every row of a store whose orders were all cancelled — so those stores vanish. Put in the ON clause, it limits which orders join, and a store with no delivered order still gets its one NULL-extended row.",
      "",
      "On that row `COUNT(o.order_id)` is 0 because COUNT of a column skips NULL, while `SUM(o.order_value)` is NULL — SUM over nothing has no value — so COALESCE turns it into 0. Conditional aggregation over an unfiltered LEFT JOIN (`SUM(CASE WHEN status = 'delivered' …)`) gets the same numbers, and two correlated subqueries per store do too, at the cost of reading the orders twice.",
      "",
      "Stores can tie on GMV (two stores with nothing delivered both have 0), so `store_id` completes the order. One pass over the orders plus a group per store.",
    ].join("\n"),
  },

  {
    slug: "masked-customer-phone-on-rider-slips",
    title: "Masked Customer Phone Numbers on Rider Slips",
    difficulty: "EASY",
    topics: ["Strings", "Basics"],
    description: [
      "The printed slip a rider carries shows the customer's **first name** and only the **last four digits** of their phone number, so a lost slip leaks nothing useful. Phone numbers are ten digits.",
      "",
      "Return `customer_id`, `first_name` (the part of `full_name` before the first space) and `masked_phone` — six `X` characters followed by the last four digits, e.g. `XXXXXX4821`. A customer with no phone on file (NULL) gets `masked_phone` NULL. Order the rows by `customer_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Customer",
        columns: [
          { name: "customer_id", type: "int" },
          { name: "full_name", type: "varchar" },
          { name: "phone", type: "bigint" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["customer_id"],
        note: "`full_name` is a first name, one space and a surname. `phone` is a 10-digit mobile number, or NULL.",
      },
    ],
    examples: [
      {
        Customer: [
          [1, "Ananya Iyer", 9845014821, "Bengaluru"],
          [2, "Farhan Khan", 7012300009, "Kochi"],
          [3, "Riya Mehta", null, "Mumbai"],
          [4, "Vikram Singh", 8800112233, "Delhi"],
          [5, "Sara Das", 6290050400, "Kolkata"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const rows = seq(1, n).map((id) => {
        // Now and then a number ending in zeros, so the leading zeros of the last four digits matter.
        const p = chance(rng, 0.25) ? ri(rng, 6, 9) * 1_000_000_000 + ri(rng, 0, 99) : phone(rng);
        return [id, fullName(rng), maybeNull(rng, 0.15, p), pick(rng, CITIES)];
      });
      return { Customer: rows };
    },
    solution: [
      "SELECT customer_id,",
      "       SUBSTRING_INDEX(full_name, ' ', 1) AS first_name,",
      "       CONCAT('XXXXXX', RIGHT(phone, 4)) AS masked_phone",
      "FROM Customer",
      "ORDER BY customer_id",
    ].join("\n"),
    alternatives: [
      "SELECT customer_id, LEFT(full_name, LOCATE(' ', full_name) - 1) AS first_name, CONCAT(REPEAT('X', 6), SUBSTRING(phone, 7, 4)) AS masked_phone FROM Customer ORDER BY customer_id",
      "SELECT customer_id, SUBSTRING(full_name, 1, INSTR(full_name, ' ') - 1) AS first_name, CASE WHEN phone IS NULL THEN NULL ELSE LPAD(RIGHT(phone, 4), 10, 'X') END AS masked_phone FROM Customer ORDER BY customer_id",
    ],
    ordered: true,
    hints: [
      "The first name ends where the first space is — SUBSTRING_INDEX, or LEFT with LOCATE.",
      "A number used in a string function is read as its digits; RIGHT(x, 4) gives the last four.",
      "What does CONCAT return when one of its arguments is NULL?",
    ],
    editorial: [
      "Both columns are string surgery. The first name is everything before the first space: `SUBSTRING_INDEX(full_name, ' ', 1)` returns the text before the first occurrence of the delimiter, and `LEFT(full_name, LOCATE(' ', full_name) - 1)` says the same with a position.",
      "",
      "For the phone, a string function given a number works on its decimal digits, so `RIGHT(phone, 4)` is the last four digits — kept as text, so a number ending in 0009 shows `0009`, not 9. Prefix six X's with CONCAT, or pad the four digits on the left to ten characters with `LPAD(…, 10, 'X')`; since every number has exactly ten digits, `SUBSTRING(phone, 7, 4)` is the same four characters.",
      "",
      "The NULL rule comes for free: MySQL's CONCAT returns NULL when any argument is NULL, and RIGHT of NULL is NULL, so a customer without a phone gets NULL. LPAD of NULL is NULL too, but the explicit CASE makes the intent visible. One pass, no join.",
    ].join("\n"),
  },

  {
    slug: "weekend-food-orders-in-march-2024",
    title: "Weekend Food Orders in March 2024",
    difficulty: "EASY",
    topics: ["Dates"],
    description: [
      "Marketing is planning a weekend-only offer and wants to look at last March's weekend traffic first.",
      "",
      "Return `order_id`, `placed_at` and `day_name` (the full English weekday name, `Saturday` or `Sunday`) for every order **placed on a Saturday or a Sunday in March 2024**. An order at 23:59 on 31 March still counts; one at 00:00 on 1 April does not. Order the rows by `placed_at`, then `order_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Orders",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "placed_at", type: "datetime" },
          { name: "order_value", type: "int" },
        ],
        primaryKey: ["order_id"],
        note: "One row per order; `placed_at` is the local time the customer paid.",
      },
    ],
    examples: [
      {
        Orders: [
          [701, 21, 3, "2024-02-25 13:10:00", 340],
          [702, 22, 1, "2024-03-02 20:45:00", 520],
          [703, 23, 2, "2024-03-04 12:30:00", 180],
          [704, 21, 3, "2024-03-17 09:05:00", 260],
          [705, 24, 1, "2024-03-31 23:59:00", 410],
          [706, 25, 2, "2024-04-01 00:00:00", 150],
          [707, 22, 2, "2024-03-02 20:45:00", 300],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 15);
      const rows = seq(701, n).map((id) => {
        const edge = chance(rng, 0.15);
        const at = edge
          ? pick(rng, ["2024-03-31 23:59:00", "2024-04-01 00:00:00", "2024-03-02 00:00:00", "2024-02-25 18:00:00", "2024-03-30 12:00:00"])
          : atTime(rng, dateBetween(rng, "2024-02-24", "2024-04-07"));
        return [id, ri(rng, 21, 30), ri(rng, 1, 5), at, roundTo(rng, 120, 900, 10)];
      });
      return { Orders: rows };
    },
    solution: [
      "SELECT order_id, placed_at, DAYNAME(placed_at) AS day_name",
      "FROM Orders",
      "WHERE placed_at >= '2024-03-01' AND placed_at < '2024-04-01'",
      "  AND DAYOFWEEK(placed_at) IN (1, 7)",
      "ORDER BY placed_at, order_id",
    ].join("\n"),
    alternatives: [
      "SELECT order_id, placed_at, DATE_FORMAT(placed_at, '%W') AS day_name FROM Orders WHERE YEAR(placed_at) = 2024 AND MONTH(placed_at) = 3 AND WEEKDAY(placed_at) >= 5 ORDER BY placed_at, order_id",
      "SELECT order_id, placed_at, DAYNAME(placed_at) AS day_name FROM Orders WHERE DATE_FORMAT(placed_at, '%Y-%m') = '2024-03' AND DAYNAME(placed_at) IN ('Saturday', 'Sunday') ORDER BY 2, 1",
    ],
    ordered: true,
    hints: [
      "DAYOFWEEK numbers the days from Sunday = 1 to Saturday = 7; WEEKDAY from Monday = 0 to Sunday = 6.",
      "For the month, compare against the first instant of March and the first instant of April rather than a last-day time.",
      "DAYNAME gives the weekday as a word.",
    ],
    editorial: [
      "Two date conditions: the month, and the day of the week. For the month, the half-open range `placed_at >= '2024-03-01' AND placed_at < '2024-04-01'` is the safest form: it includes every time on 31 March (23:59 included) and excludes midnight on 1 April, and it works because datetimes stored as fixed-format text compare in time order. `YEAR(…) = 2024 AND MONTH(…) = 3` reads the same but cannot use an index on `placed_at`; `BETWEEN '2024-03-01' AND '2024-03-31'` is the classic bug — it stops at the very start of 31 March.",
      "",
      "For the weekend, `DAYOFWEEK` returns 1 for Sunday and 7 for Saturday, so `IN (1, 7)`; `WEEKDAY` counts from Monday = 0, so `>= 5`. `DAYNAME` (or `DATE_FORMAT(placed_at, '%W')`) prints the name.",
      "",
      "Two orders can share a timestamp, so `order_id` settles the order between them. One pass over the table.",
    ].join("\n"),
  },

  {
    slug: "restaurants-averaging-under-three-point-five-stars",
    title: "Restaurants Averaging Under 3.5 Stars",
    difficulty: "EASY",
    topics: ["Aggregation", "Joins"],
    description: [
      "The partner-quality team puts a restaurant on a watch list when it has **at least 3 reviews** and its average rating is **strictly below 3.5** stars (computed on the exact average, before any rounding).",
      "",
      "Return `restaurant_id`, `name`, `reviews` (the number of reviews) and `avg_stars` (the average rounded to 2 decimal places) for every restaurant on the watch list, ordered by `avg_stars` ascending, then `restaurant_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Restaurant",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["restaurant_id"],
        note: "One row per restaurant.",
      },
      {
        name: "Review",
        columns: [
          { name: "review_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "stars", type: "int" },
          { name: "reviewed_on", type: "date" },
        ],
        primaryKey: ["review_id"],
        note: "One row per review, `stars` from 1 to 5. `restaurant_id` is always in `Restaurant`.",
      },
    ],
    examples: [
      {
        Restaurant: [
          [1, "Burger Barn", "Pune"],
          [2, "Wok Express", "Pune"],
          [3, "Curry Leaf", "Kochi"],
          [4, "Pizza Planet", "Pune"],
        ],
        Review: [
          [1, 1, 31, 2, "2024-05-01"],
          [2, 1, 32, 4, "2024-05-02"],
          [3, 1, 33, 3, "2024-05-04"],
          [4, 2, 31, 3, "2024-05-03"],
          [5, 2, 34, 4, "2024-05-06"],
          [6, 2, 35, 3, "2024-05-07"],
          [7, 2, 36, 4, "2024-05-09"],
          [8, 3, 32, 1, "2024-05-05"],
          [9, 3, 37, 2, "2024-05-08"],
          [10, 4, 38, 2, "2024-05-02"],
          [11, 4, 39, 3, "2024-05-03"],
          [12, 4, 31, 4, "2024-05-06"],
        ],
      },
    ],
    gen: (rng) => {
      const restaurants = sample(rng, RESTAURANTS, ri(rng, 1, 5)).map((name, i) => [i + 1, name, pick(rng, CITIES)]);
      const reviews: Cell[][] = [];
      let id = 1;
      for (const r of restaurants) {
        // At most 7 reviews each, so no average lands on a half-way case at 2 decimals.
        const k = ri(rng, 0, 7);
        const pool = pick(rng, [[1, 2, 3], [2, 3, 4, 5], [3, 4], [3, 4, 5], [1, 5]]);
        for (let j = 0; j < k; j++) reviews.push([id++, r[0]!, ri(rng, 31, 60), pick(rng, pool), dateBetween(rng, "2024-05-01", "2024-05-31")]);
      }
      return { Restaurant: restaurants, Review: reviews };
    },
    solution: [
      "SELECT r.restaurant_id, r.name, COUNT(*) AS reviews, ROUND(AVG(v.stars), 2) AS avg_stars",
      "FROM Restaurant r",
      "JOIN Review v ON v.restaurant_id = r.restaurant_id",
      "GROUP BY r.restaurant_id, r.name",
      "HAVING COUNT(*) >= 3 AND AVG(v.stars) < 3.5",
      "ORDER BY avg_stars, r.restaurant_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT r.restaurant_id, r.name, a.reviews, a.avg_stars",
        "FROM (SELECT restaurant_id, COUNT(*) AS reviews, ROUND(AVG(stars), 2) AS avg_stars, SUM(stars) AS total",
        "      FROM Review GROUP BY restaurant_id) a",
        "JOIN Restaurant r ON r.restaurant_id = a.restaurant_id",
        "WHERE a.reviews >= 3 AND a.total * 2 < a.reviews * 7",
        "ORDER BY a.avg_stars, r.restaurant_id",
      ].join("\n"),
      "SELECT r.restaurant_id, r.name, COUNT(v.review_id) AS reviews, ROUND(SUM(v.stars) / COUNT(v.review_id), 2) AS avg_stars FROM Restaurant r LEFT JOIN Review v ON v.restaurant_id = r.restaurant_id GROUP BY r.restaurant_id, r.name HAVING COUNT(v.review_id) > 2 AND SUM(v.stars) < 3.5 * COUNT(v.review_id) ORDER BY 4, 1",
    ],
    ordered: true,
    hints: [
      "Group the reviews by restaurant, and filter the groups — not the rows.",
      "WHERE runs before grouping; conditions on COUNT or AVG belong in HAVING.",
      "Test the unrounded average against 3.5: a 3.499 average rounds to 3.50 but is still below.",
    ],
    editorial: [
      "One GROUP BY per restaurant gives the count and the average; HAVING keeps the groups that pass both tests. WHERE cannot do it, because it runs on single review rows before any group exists.",
      "",
      "The threshold is on the **exact** average. Comparing the rounded value would be wrong at the edge — an average of 3.4986 rounds to 3.50 yet is below 3.5 — so the HAVING uses `AVG(stars)` and only the output column is rounded. An exactly 3.5 average (3, 4, 3, 4) is not strictly below and stays off the list. Integer arithmetic avoids decimals entirely: `SUM(stars) * 2 < COUNT(*) * 7`.",
      "",
      "Joining `Restaurant` first and grouping by its id and name, or aggregating `Review` in a derived table and joining after, are equivalent; restaurants with fewer than three reviews (including none) fail the count either way. The cost is one pass over the reviews.",
    ].join("\n"),
  },

  {
    slug: "refund-due-on-cancelled-food-orders",
    title: "Refund Due on Cancelled Food Orders",
    difficulty: "EASY",
    topics: ["Conditional Logic", "Basics"],
    description: [
      "The refund policy for a cancelled order depends on who cancelled and when. If the **restaurant, the rider or the platform** cancelled, the customer gets the full `order_value` back. If the **customer** cancelled, they get the full value within 2 minutes of placing (2 minutes included), **half the value rounded down to the rupee** from 3 to 10 minutes, and nothing after 10 minutes.",
      "",
      "Return `order_id`, `cancelled_by` and `refund` for every cancelled order, ordered by `order_id`.",
    ].join("\n"),
    tables: [
      {
        name: "CancelledOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "order_value", type: "int" },
          { name: "cancelled_by", type: "enum", values: ["customer", "restaurant", "rider", "platform"] },
          { name: "minutes_after_placing", type: "int" },
        ],
        primaryKey: ["order_id"],
        note: "One row per cancelled order, `order_value` in rupees; `minutes_after_placing` is whole minutes between paying and cancelling.",
      },
    ],
    examples: [
      {
        CancelledOrder: [
          [8101, 400, "customer", 1],
          [8102, 355, "customer", 2],
          [8103, 355, "customer", 3],
          [8104, 280, "customer", 10],
          [8105, 280, "customer", 11],
          [8106, 520, "restaurant", 25],
          [8107, 199, "rider", 40],
          [8108, 610, "platform", 5],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const rows = seq(8101, n).map((id) => [
        id,
        ri(rng, 99, 900),
        chance(rng, 0.6) ? "customer" : pick(rng, ["restaurant", "rider", "platform"]),
        pick(rng, [0, 1, 2, 2, 3, 5, 9, 10, 10, 11, 15, 30]),
      ]);
      return { CancelledOrder: rows };
    },
    solution: [
      "SELECT order_id, cancelled_by,",
      "       CASE",
      "         WHEN cancelled_by <> 'customer' THEN order_value",
      "         WHEN minutes_after_placing <= 2 THEN order_value",
      "         WHEN minutes_after_placing <= 10 THEN FLOOR(order_value / 2)",
      "         ELSE 0",
      "       END AS refund",
      "FROM CancelledOrder",
      "ORDER BY order_id",
    ].join("\n"),
    alternatives: [
      "SELECT order_id, cancelled_by, IF(cancelled_by = 'customer', IF(minutes_after_placing <= 2, order_value, IF(minutes_after_placing <= 10, order_value DIV 2, 0)), order_value) AS refund FROM CancelledOrder ORDER BY order_id",
      "SELECT order_id, cancelled_by, CASE WHEN cancelled_by IN ('restaurant', 'rider', 'platform') OR minutes_after_placing BETWEEN 0 AND 2 THEN order_value WHEN minutes_after_placing BETWEEN 3 AND 10 THEN (order_value - MOD(order_value, 2)) / 2 ELSE 0 END AS refund FROM CancelledOrder ORDER BY order_id",
    ],
    ordered: true,
    hints: [
      "Write the policy as a CASE with one branch per rule; branches are tried top to bottom.",
      "Handle who cancelled first — the time only matters for the customer.",
      "Half rounded down: FLOOR of the division, or integer division with DIV.",
    ],
    editorial: [
      "The policy is a decision table, and CASE evaluates its branches in order and stops at the first true one — so the order of the branches carries part of the logic. Put the cancelled-by rule first: anyone other than the customer means a full refund whatever the time. Every later branch then knows the customer cancelled, and the minutes decide: `<= 2` full, `<= 10` half (the first branch already took 0–2, so this one means 3–10), anything else 0.",
      "",
      "\"Half rounded down to the rupee\" matters for odd values: 355 / 2 is 177.5 under MySQL's decimal division, and `FLOOR` gives 177. Integer division (`DIV`) gives the same, and so does subtracting the remainder before halving. `ROUND` would give 178 — the wrong rupee.",
      "",
      "Nested IF reads the same rules inside out. Every form is one pass over the table.",
    ].join("\n"),
  },

  {
    slug: "riders-missing-delivery-sla-in-june",
    title: "Riders Missing the Delivery SLA in June 2024",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Dates", "Conditional Logic"],
    description: [
      "Every delivery carries a promised time. A delivery is **late** when the minutes from pickup to drop-off (`TIMESTAMPDIFF(MINUTE, picked_up_at, delivered_at)`) are **greater than** `promised_minutes`. Only deliveries picked up in **June 2024** and already completed count; one still on the road has `delivered_at` NULL and is ignored.",
      "",
      "Return the riders whose late deliveries are **more than 20%** of their counted deliveries (exactly 20% is not more), with columns `rider_id`, `name`, `deliveries`, `late_deliveries` and `late_pct` (late as a percentage of deliveries, rounded to 1 decimal place). Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Rider",
        columns: [
          { name: "rider_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["rider_id"],
        note: "One row per delivery partner.",
      },
      {
        name: "Delivery",
        columns: [
          { name: "delivery_id", type: "int" },
          { name: "rider_id", type: "int" },
          { name: "picked_up_at", type: "datetime" },
          { name: "delivered_at", type: "datetime" },
          { name: "promised_minutes", type: "int" },
        ],
        primaryKey: ["delivery_id"],
        note: "One row per delivery; `rider_id` is always in `Rider`. `delivered_at` is NULL while the order is still out for delivery.",
      },
    ],
    examples: [
      {
        Rider: [
          [1, "Arjun", "Bengaluru"],
          [2, "Pooja", "Bengaluru"],
          [3, "Kabir", "Bengaluru"],
        ],
        Delivery: [
          [1, 1, "2024-06-03 12:10:00", "2024-06-03 12:40:00", 25],
          [2, 1, "2024-06-03 19:00:00", "2024-06-03 19:20:00", 20],
          [3, 1, "2024-06-04 13:00:00", "2024-06-04 13:18:00", 20],
          [4, 2, "2024-06-05 20:00:00", "2024-06-05 20:22:00", 20],
          [5, 2, "2024-06-05 21:00:00", "2024-06-05 21:15:00", 20],
          [6, 2, "2024-06-06 12:00:00", "2024-06-06 12:19:00", 20],
          [7, 2, "2024-06-06 13:00:00", "2024-06-06 13:20:00", 20],
          [8, 2, "2024-06-07 19:30:00", "2024-06-07 19:45:00", 20],
          [9, 3, "2024-05-31 22:00:00", "2024-05-31 22:50:00", 30],
          [10, 3, "2024-06-08 20:00:00", null, 30],
          [11, 3, "2024-06-09 20:00:00", "2024-06-09 20:31:00", 30],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 5);
      const riders = names(rng, n).map((name, i) => [i + 1, name, pick(rng, CITIES)]);
      const rows: Cell[][] = [];
      let id = 1;
      for (const r of riders) {
        // At most 12 deliveries a rider: no percentage lands on a half-way case at 1 decimal.
        const k = ri(rng, 0, 12);
        const lateness = rng() * 0.5;
        for (let j = 0; j < k; j++) {
          const day = dateBetween(rng, "2024-05-30", "2024-07-01");
          const start = `${day} ${String(ri(rng, 9, 22)).padStart(2, "0")}:${String(ri(rng, 0, 5) * 10).padStart(2, "0")}:00`;
          const promised = pick(rng, [15, 20, 25, 30]);
          const took = rng() < lateness ? promised + ri(rng, 1, 15) : promised - ri(rng, 0, 8);
          const end = new Date(Date.parse(start.replace(" ", "T") + "Z") + took * 60_000).toISOString().slice(0, 19).replace("T", " ");
          rows.push([id++, r[0]!, start, chance(rng, 0.08) ? null : end, promised]);
        }
      }
      return { Rider: riders, Delivery: rows };
    },
    solution: [
      "SELECT r.rider_id, r.name,",
      "       COUNT(*) AS deliveries,",
      "       SUM(CASE WHEN TIMESTAMPDIFF(MINUTE, d.picked_up_at, d.delivered_at) > d.promised_minutes THEN 1 ELSE 0 END) AS late_deliveries,",
      "       ROUND(100 * SUM(CASE WHEN TIMESTAMPDIFF(MINUTE, d.picked_up_at, d.delivered_at) > d.promised_minutes THEN 1 ELSE 0 END) / COUNT(*), 1) AS late_pct",
      "FROM Rider r",
      "JOIN Delivery d ON d.rider_id = r.rider_id",
      "WHERE d.picked_up_at >= '2024-06-01' AND d.picked_up_at < '2024-07-01'",
      "  AND d.delivered_at IS NOT NULL",
      "GROUP BY r.rider_id, r.name",
      "HAVING SUM(CASE WHEN TIMESTAMPDIFF(MINUTE, d.picked_up_at, d.delivered_at) > d.promised_minutes THEN 1 ELSE 0 END) * 5 > COUNT(*)",
    ].join("\n"),
    alternatives: [
      [
        "WITH counted AS (",
        "  SELECT rider_id, IF(TIMESTAMPDIFF(MINUTE, picked_up_at, delivered_at) > promised_minutes, 1, 0) AS is_late",
        "  FROM Delivery",
        "  WHERE YEAR(picked_up_at) = 2024 AND MONTH(picked_up_at) = 6 AND delivered_at IS NOT NULL",
        "), per_rider AS (",
        "  SELECT rider_id, COUNT(*) AS deliveries, SUM(is_late) AS late_deliveries FROM counted GROUP BY rider_id",
        ")",
        "SELECT p.rider_id, r.name, p.deliveries, p.late_deliveries, ROUND(p.late_deliveries * 100 / p.deliveries, 1) AS late_pct",
        "FROM per_rider p JOIN Rider r ON r.rider_id = p.rider_id",
        "WHERE p.late_deliveries / p.deliveries > 0.2",
      ].join("\n"),
    ],
    hints: [
      "Filter the deliveries first: June pickups, completed only.",
      "Count late deliveries with SUM over a CASE that yields 1 or 0.",
      "The 20% test is on groups, so it goes in HAVING; multiplying by 5 keeps it in integers.",
    ],
    editorial: [
      "First decide which rows count: pickups from 1 June up to (not including) 1 July, and only completed deliveries. Both are row filters, so they go in WHERE. Dropping the NULL `delivered_at` rows matters twice — they are not deliveries yet, and TIMESTAMPDIFF over a NULL is NULL, which would otherwise sit in the count as neither late nor on time.",
      "",
      "Then group by rider. `COUNT(*)` is the deliveries; **conditional aggregation** counts the late ones: `SUM(CASE WHEN minutes > promised THEN 1 ELSE 0 END)`. The SLA rule compares two group values, so it belongs in HAVING. \"More than 20%\" is `late / deliveries > 0.2`, or with no division at all `late * 5 > deliveries` — exactly one late delivery in five is 20%, not more, and stays out.",
      "",
      "The percentage column is rounded to one decimal as asked; the comparison uses the exact values. A CTE that flags each delivery first and aggregates second is the same plan written in steps. One pass over the deliveries, one group per rider.",
    ].join("\n"),
  },

  {
    slug: "peak-hour-share-of-orders-by-city",
    title: "Peak-Hour Share of Orders by City",
    difficulty: "MEDIUM",
    topics: ["Dates", "Conditional Logic", "Aggregation"],
    description: [
      "City managers staff riders for two peaks: **lunch, 12:00–14:59**, and **dinner, 19:00–22:59** (by the hour the order was placed). An order placed at 15:00 or 23:00 is off-peak.",
      "",
      "For every city that has at least one order, return `city`, `total_orders`, `peak_orders` and `peak_share_pct` (peak orders as a percentage of all the city's orders, rounded to 2 decimal places). The city is the restaurant's city. Order the rows by `peak_share_pct` descending, then `city` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Restaurant",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["restaurant_id"],
        note: "One row per restaurant.",
      },
      {
        name: "Orders",
        columns: [
          { name: "order_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "placed_at", type: "datetime" },
          { name: "order_value", type: "int" },
        ],
        primaryKey: ["order_id"],
        note: "One row per order; `restaurant_id` is always in `Restaurant`.",
      },
    ],
    examples: [
      {
        Restaurant: [
          [1, "Biryani Bay", "Hyderabad"],
          [2, "Tandoor Tales", "Hyderabad"],
          [3, "Idli Factory", "Chennai"],
          [4, "Momo Mansion", "Kolkata"],
        ],
        Orders: [
          [1, 1, "2024-08-01 12:00:00", 300],
          [2, 1, "2024-08-01 14:59:00", 250],
          [3, 2, "2024-08-01 15:00:00", 410],
          [4, 2, "2024-08-01 21:30:00", 380],
          [5, 3, "2024-08-01 08:15:00", 120],
          [6, 3, "2024-08-01 22:59:00", 160],
          [7, 3, "2024-08-02 23:00:00", 140],
          [8, 1, "2024-08-02 19:00:00", 290],
        ],
      },
    ],
    gen: (rng) => {
      const restaurants = sample(rng, RESTAURANTS, ri(rng, 1, 6)).map((name, i) => [i + 1, name, pick(rng, ["Hyderabad", "Chennai", "Kolkata", "Pune"])]);
      const n = chance(rng, 0.06) ? 0 : ri(rng, 1, 28);
      const rows = seq(1, n).map((id) => {
        const hour = pick(rng, [8, 11, 12, 13, 14, 15, 17, 19, 20, 21, 22, 23]);
        const day = dateBetween(rng, "2024-08-01", "2024-08-07");
        const minute = pick(rng, [0, 15, 30, 59]);
        return [id, ri(rng, 1, restaurants.length), `${day} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`, roundTo(rng, 100, 800, 10)];
      });
      return { Restaurant: restaurants, Orders: rows };
    },
    solution: [
      "SELECT r.city,",
      "       COUNT(*) AS total_orders,",
      "       SUM(CASE WHEN HOUR(o.placed_at) BETWEEN 12 AND 14 OR HOUR(o.placed_at) BETWEEN 19 AND 22 THEN 1 ELSE 0 END) AS peak_orders,",
      "       ROUND(100 * SUM(CASE WHEN HOUR(o.placed_at) BETWEEN 12 AND 14 OR HOUR(o.placed_at) BETWEEN 19 AND 22 THEN 1 ELSE 0 END) / COUNT(*), 2) AS peak_share_pct",
      "FROM Orders o",
      "JOIN Restaurant r ON r.restaurant_id = o.restaurant_id",
      "GROUP BY r.city",
      "ORDER BY peak_share_pct DESC, r.city",
    ].join("\n"),
    alternatives: [
      [
        "SELECT city, COUNT(*) AS total_orders, SUM(is_peak) AS peak_orders, ROUND(SUM(is_peak) * 100 / COUNT(*), 2) AS peak_share_pct",
        "FROM (SELECT r.city, IF(DATE_FORMAT(o.placed_at, '%H') IN ('12', '13', '14', '19', '20', '21', '22'), 1, 0) AS is_peak",
        "      FROM Orders o JOIN Restaurant r ON r.restaurant_id = o.restaurant_id) t",
        "GROUP BY city",
        "ORDER BY peak_share_pct DESC, city",
      ].join("\n"),
      "SELECT r.city, COUNT(*) AS total_orders, COUNT(CASE WHEN HOUR(o.placed_at) IN (12, 13, 14, 19, 20, 21, 22) THEN 1 END) AS peak_orders, ROUND(100 * AVG(CASE WHEN HOUR(o.placed_at) IN (12, 13, 14, 19, 20, 21, 22) THEN 1 ELSE 0 END), 2) AS peak_share_pct FROM Orders o JOIN Restaurant r ON r.restaurant_id = o.restaurant_id GROUP BY r.city ORDER BY 4 DESC, 1",
    ],
    ordered: true,
    hints: [
      "HOUR(placed_at) turns a time into the hour 0–23; 14:59 is hour 14, 15:00 is hour 15.",
      "Count peak orders with a CASE inside SUM, in the same GROUP BY as the total.",
      "The city lives on the restaurant, so join before grouping.",
    ],
    editorial: [
      "The peak windows are whole hours, so the cleanest test is on `HOUR(placed_at)`: lunch is hours 12, 13 and 14 (14:59 included, 15:00 not), dinner hours 19 to 22. Comparing full times (`>= '12:00' AND < '15:00'`) says the same thing but needs the time part extracted first; the hour avoids boundary slips.",
      "",
      "Join each order to its restaurant to learn the city, group by city, and count twice in one pass: `COUNT(*)` for all orders and `SUM(CASE WHEN peak THEN 1 ELSE 0 END)` for the peak ones. The share is their ratio times 100 — or the average of the 0/1 flag times 100, which is the same number — rounded to two decimals as asked.",
      "",
      "Cities without orders never appear because the query starts from orders. Two cities can share a percentage, so `city` breaks the tie. The cost is one join and one group per city.",
    ].join("\n"),
  },

  {
    slug: "best-selling-dish-of-each-restaurant",
    title: "Best-Selling Dish of Each Restaurant",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Joins", "Aggregation"],
    description: [
      "Each restaurant's page shows a \"Bestseller\" tag on the dish that has sold the **most units** across all orders (the sum of `quantity`). If several dishes of a restaurant tie for the most units, they all get the tag. Dishes that were never ordered cannot be bestsellers, and a restaurant with no sales gets no row.",
      "",
      "Return `restaurant` (the restaurant's name), `item_name` and `units_sold` for every bestseller. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Restaurant",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "name", type: "varchar" },
        ],
        primaryKey: ["restaurant_id"],
        note: "One row per restaurant.",
      },
      {
        name: "MenuItem",
        columns: [
          { name: "item_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "item_name", type: "varchar" },
          { name: "price", type: "int" },
        ],
        primaryKey: ["item_id"],
        note: "One row per dish; `restaurant_id` is always in `Restaurant`.",
      },
      {
        name: "OrderLine",
        columns: [
          { name: "order_id", type: "int" },
          { name: "item_id", type: "int" },
          { name: "quantity", type: "int" },
        ],
        primaryKey: ["order_id", "item_id"],
        note: "One row per dish in an order; `item_id` is always in `MenuItem`.",
      },
    ],
    examples: [
      {
        Restaurant: [
          [1, "Paratha Point"],
          [2, "Wok Express"],
          [3, "Green Bowl"],
        ],
        MenuItem: [
          [10, 1, "Chole Bhature", 160],
          [11, 1, "Dal Makhani", 210],
          [12, 1, "Gulab Jamun", 70],
          [20, 2, "Veg Hakka Noodles", 180],
          [21, 2, "Veg Momos", 120],
          [30, 3, "Pav Bhaji", 140],
        ],
        OrderLine: [
          [1, 10, 2],
          [1, 12, 4],
          [2, 11, 3],
          [3, 10, 2],
          [4, 20, 1],
          [4, 21, 3],
          [5, 20, 2],
        ],
      },
    ],
    gen: (rng) => {
      const restaurants = sample(rng, RESTAURANTS, ri(rng, 1, 4)).map((name, i) => [i + 1, name]);
      const items: Cell[][] = [];
      let id = 10;
      for (const r of restaurants) for (const [dish, price] of sample(rng, DISHES, ri(rng, 0, 4))) items.push([id++, r[0]!, dish, price]);
      const lines: Cell[][] = [];
      if (items.length) {
        for (const order of seq(1, ri(rng, 0, 10))) {
          // Small quantities from a short list, so equal totals within a restaurant are common.
          for (const it of sample(rng, items, ri(rng, 1, 3))) lines.push([order, it[0]!, pick(rng, [1, 1, 2, 3])]);
        }
      }
      return { Restaurant: restaurants, MenuItem: items, OrderLine: lines };
    },
    solution: [
      "WITH sold AS (",
      "  SELECT m.restaurant_id, m.item_name, SUM(o.quantity) AS units_sold,",
      "         RANK() OVER (PARTITION BY m.restaurant_id ORDER BY SUM(o.quantity) DESC) AS rnk",
      "  FROM MenuItem m",
      "  JOIN OrderLine o ON o.item_id = m.item_id",
      "  GROUP BY m.item_id, m.restaurant_id, m.item_name",
      ")",
      "SELECT r.name AS restaurant, s.item_name, s.units_sold",
      "FROM sold s",
      "JOIN Restaurant r ON r.restaurant_id = s.restaurant_id",
      "WHERE s.rnk = 1",
    ].join("\n"),
    alternatives: [
      [
        "WITH sold AS (",
        "  SELECT m.restaurant_id, m.item_name, SUM(o.quantity) AS units_sold",
        "  FROM MenuItem m JOIN OrderLine o ON o.item_id = m.item_id",
        "  GROUP BY m.item_id, m.restaurant_id, m.item_name",
        ")",
        "SELECT r.name AS restaurant, s.item_name, s.units_sold",
        "FROM sold s JOIN Restaurant r ON r.restaurant_id = s.restaurant_id",
        "WHERE s.units_sold = (SELECT MAX(t.units_sold) FROM sold t WHERE t.restaurant_id = s.restaurant_id)",
      ].join("\n"),
      [
        "SELECT r.name AS restaurant, x.item_name, x.units_sold",
        "FROM (SELECT m.restaurant_id, m.item_name, SUM(o.quantity) AS units_sold,",
        "             MAX(SUM(o.quantity)) OVER (PARTITION BY m.restaurant_id) AS top_units",
        "      FROM MenuItem m JOIN OrderLine o ON o.item_id = m.item_id",
        "      GROUP BY m.item_id, m.restaurant_id, m.item_name) x",
        "JOIN Restaurant r ON r.restaurant_id = x.restaurant_id",
        "WHERE x.units_sold = x.top_units",
      ].join("\n"),
    ],
    hints: [
      "First total the units of each dish: join the order lines to the menu and group by dish.",
      "\"Most in each restaurant\" means comparing a dish only with dishes of the same restaurant — PARTITION BY.",
      "Which ranking function gives every tied dish rank 1?",
      "A window value can't be filtered in the same SELECT; wrap it in a CTE or derived table.",
    ],
    editorial: [
      "Two steps. First an ordinary aggregate: join `OrderLine` to `MenuItem` and group by dish to get each dish's `SUM(quantity)`. The inner join already drops dishes with no sales, so they can never be the top of anything.",
      "",
      "Second, find the top per restaurant. A window over the grouped rows does it in the same query — window functions run after GROUP BY, so `RANK() OVER (PARTITION BY restaurant_id ORDER BY SUM(quantity) DESC)` ranks the dish totals within each restaurant. `RANK` (or `DENSE_RANK`) gives every dish that ties for the most units rank 1, which is exactly the \"they all get the tag\" rule; `ROW_NUMBER` would pick one of them arbitrarily. Filter `rnk = 1` outside, and join `Restaurant` for the name.",
      "",
      "Equivalent forms compare each dish total with the restaurant's maximum: a correlated `MAX` over the CTE, or `MAX(SUM(quantity)) OVER (PARTITION BY restaurant_id)`. Group by `item_id`, not by name — names repeat across restaurants. The cost is one aggregation of the order lines and a sort per restaurant.",
    ].join("\n"),
  },

  {
    slug: "orders-above-the-customers-own-average",
    title: "Orders Above the Customer's Own Average Basket",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation"],
    description: [
      "The growth team looks for \"splurge\" orders: delivered orders whose value is **strictly greater than that customer's average delivered order value**. Cancelled orders are ignored everywhere — in the average and as candidates.",
      "",
      "Return `customer_id`, `order_id`, `order_value` and `customer_avg` (the customer's average delivered order value, rounded to 2 decimal places). The comparison uses the exact average. Order the rows by `customer_id`, then `order_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Orders",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "placed_at", type: "datetime" },
          { name: "order_value", type: "int" },
          { name: "status", type: "enum", values: ["delivered", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per order, value in rupees.",
      },
    ],
    examples: [
      {
        Orders: [
          [1, 51, "2024-09-01 13:00:00", 300, "delivered"],
          [2, 51, "2024-09-03 20:10:00", 500, "delivered"],
          [3, 51, "2024-09-05 21:00:00", 900, "cancelled"],
          [4, 51, "2024-09-08 13:30:00", 350, "delivered"],
          [5, 52, "2024-09-02 19:45:00", 420, "delivered"],
          [6, 53, "2024-09-04 12:15:00", 250, "delivered"],
          [7, 53, "2024-09-06 12:20:00", 250, "delivered"],
          [8, 54, "2024-09-07 20:00:00", 610, "delivered"],
          [9, 54, "2024-09-09 20:30:00", 199, "delivered"],
          [10, 54, "2024-09-10 21:15:00", 280, "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      const customers = sample(rng, seq(51, 20), ri(rng, 1, 5));
      const rows: Cell[][] = [];
      let id = 1;
      for (const c of customers) {
        // At most 7 delivered orders a customer: no average is a half-way case at 2 decimals.
        const k = ri(rng, 1, 7);
        const pool = pick(rng, [[250, 250, 300], [199, 280, 420, 610], [150, 350, 500, 900], [400]]);
        for (let j = 0; j < k; j++) rows.push([id++, c, atTime(rng, dateBetween(rng, "2024-09-01", "2024-09-30")), pick(rng, pool), "delivered"]);
        if (chance(rng, 0.5)) rows.push([id++, c, atTime(rng, dateBetween(rng, "2024-09-01", "2024-09-30")), ri(rng, 600, 1500), "cancelled"]);
      }
      return { Orders: rows };
    },
    solution: [
      "SELECT o.customer_id, o.order_id, o.order_value,",
      "       ROUND((SELECT AVG(a.order_value) FROM Orders a",
      "              WHERE a.customer_id = o.customer_id AND a.status = 'delivered'), 2) AS customer_avg",
      "FROM Orders o",
      "WHERE o.status = 'delivered'",
      "  AND o.order_value > (SELECT AVG(a.order_value) FROM Orders a",
      "                       WHERE a.customer_id = o.customer_id AND a.status = 'delivered')",
      "ORDER BY o.customer_id, o.order_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT o.customer_id, o.order_id, o.order_value, ROUND(c.avg_value, 2) AS customer_avg",
        "FROM Orders o",
        "JOIN (SELECT customer_id, AVG(order_value) AS avg_value, SUM(order_value) AS total, COUNT(*) AS n",
        "      FROM Orders WHERE status = 'delivered' GROUP BY customer_id) c ON c.customer_id = o.customer_id",
        "WHERE o.status = 'delivered' AND o.order_value * c.n > c.total",
        "ORDER BY o.customer_id, o.order_id",
      ].join("\n"),
      [
        "SELECT customer_id, order_id, order_value, ROUND(avg_value, 2) AS customer_avg",
        "FROM (SELECT customer_id, order_id, order_value, AVG(order_value) OVER (PARTITION BY customer_id) AS avg_value,",
        "             SUM(order_value) OVER (PARTITION BY customer_id) AS total, COUNT(*) OVER (PARTITION BY customer_id) AS n",
        "      FROM Orders WHERE status = 'delivered') t",
        "WHERE order_value * n > total",
        "ORDER BY customer_id, order_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Each order is compared with a number computed over a group it belongs to — a correlated subquery, or a per-customer aggregate joined back.",
      "Filter out cancelled orders both in the average and in the outer query.",
      "Comparing `value * count > sum` avoids comparing against a rounded average.",
    ],
    editorial: [
      "Every order must be compared with an aggregate of its own customer's orders. The direct way is a **correlated subquery**: for the outer row `o`, `(SELECT AVG(order_value) FROM Orders a WHERE a.customer_id = o.customer_id AND a.status = 'delivered')` is that customer's average, and the WHERE keeps orders strictly above it. The same subquery, rounded, fills the `customer_avg` column.",
      "",
      "The cancelled rule applies twice: a cancelled ₹900 order must not drag the average up, and it must not be a candidate itself. A customer whose delivered orders are all equal (or who has only one) has no order strictly above the average and does not appear.",
      "",
      "A derived table with one row per customer (average, sum and count) joined back on `customer_id` computes each average once instead of once per order; a window `AVG(…) OVER (PARTITION BY customer_id)` does the same without a join. Testing `order_value * n > total` keeps the comparison in exact integers — the rounded display value must never decide it. With an index on `(customer_id, status)` the correlated form is one index range per order.",
    ].join("\n"),
  },

  {
    slug: "rider-login-hours-and-july-incentive-tier",
    title: "Rider Login Hours and July Incentive Tier",
    difficulty: "MEDIUM",
    topics: ["Dates", "Aggregation", "Joins"],
    description: [
      "Riders earn a monthly incentive by the hours they stay logged in. A shift belongs to the month its `login_at` falls in, and its length is `TIMESTAMPDIFF(MINUTE, login_at, logout_at)`. A shift that is still open (`logout_at` NULL) is not counted yet.",
      "",
      "For **every rider**, return `rider_id`, `name`, `hours_logged` (total counted minutes of July 2024 shifts divided by 60, rounded to 2 decimal places; 0 for a rider with none) and `tier`: `Gold` for 40 hours or more, `Silver` for 20 hours or more, otherwise `None` (decided on the exact hours). Order the rows by `hours_logged` descending, then `rider_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Rider",
        columns: [
          { name: "rider_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "joined_on", type: "date" },
        ],
        primaryKey: ["rider_id"],
        note: "One row per delivery partner.",
      },
      {
        name: "RiderShift",
        columns: [
          { name: "shift_id", type: "int" },
          { name: "rider_id", type: "int" },
          { name: "login_at", type: "datetime" },
          { name: "logout_at", type: "datetime" },
        ],
        primaryKey: ["shift_id"],
        note: "One row per login session in the rider app; `rider_id` is always in `Rider`. `logout_at` is NULL while the rider is still logged in.",
      },
    ],
    examples: [
      {
        Rider: [
          [1, "Nikhil", "2023-11-02"],
          [2, "Simran", "2024-01-15"],
          [3, "Dev", "2024-06-20"],
          [4, "Zara", "2024-07-01"],
        ],
        RiderShift: [
          [1, 1, "2024-07-01 08:00:00", "2024-07-01 20:00:00"],
          [2, 1, "2024-07-02 08:00:00", "2024-07-02 20:00:00"],
          [3, 1, "2024-07-03 09:00:00", "2024-07-03 21:00:00"],
          [4, 1, "2024-07-04 10:00:00", "2024-07-04 14:00:00"],
          [5, 2, "2024-06-30 18:00:00", "2024-07-01 02:00:00"],
          [6, 2, "2024-07-10 11:00:00", "2024-07-10 21:00:00"],
          [7, 2, "2024-07-11 11:00:00", "2024-07-11 21:00:00"],
          [8, 3, "2024-07-31 19:00:00", "2024-08-01 01:25:00"],
          [9, 3, "2024-07-20 12:00:00", null],
        ],
      },
    ],
    gen: (rng) => {
      const riders = names(rng, ri(rng, 1, 6)).map((name, i) => [i + 1, name, dateBetween(rng, "2023-01-01", "2024-07-01")]);
      const rows: Cell[][] = [];
      let id = 1;
      for (const r of riders) {
        const k = ri(rng, 0, 5);
        for (let j = 0; j < k; j++) {
          const day = dateBetween(rng, "2024-06-29", "2024-08-01");
          const start = `${day} ${String(ri(rng, 6, 20)).padStart(2, "0")}:${String(ri(rng, 0, 11) * 5).padStart(2, "0")}:00`;
          // Long shifts in multiples of 5 minutes, so totals cross the 20- and 40-hour lines.
          const mins = pick(rng, [240, 480, 600, 720, 725, 800]);
          const end = new Date(Date.parse(start.replace(" ", "T") + "Z") + mins * 60_000).toISOString().slice(0, 19).replace("T", " ");
          rows.push([id++, r[0]!, start, chance(rng, 0.08) ? null : end]);
        }
      }
      return { Rider: riders, RiderShift: rows };
    },
    solution: [
      "SELECT r.rider_id, r.name,",
      "       ROUND(COALESCE(SUM(TIMESTAMPDIFF(MINUTE, s.login_at, s.logout_at)), 0) / 60, 2) AS hours_logged,",
      "       CASE",
      "         WHEN COALESCE(SUM(TIMESTAMPDIFF(MINUTE, s.login_at, s.logout_at)), 0) >= 40 * 60 THEN 'Gold'",
      "         WHEN COALESCE(SUM(TIMESTAMPDIFF(MINUTE, s.login_at, s.logout_at)), 0) >= 20 * 60 THEN 'Silver'",
      "         ELSE 'None'",
      "       END AS tier",
      "FROM Rider r",
      "LEFT JOIN RiderShift s",
      "  ON s.rider_id = r.rider_id",
      " AND s.login_at >= '2024-07-01' AND s.login_at < '2024-08-01'",
      " AND s.logout_at IS NOT NULL",
      "GROUP BY r.rider_id, r.name",
      "ORDER BY hours_logged DESC, r.rider_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH july AS (",
        "  SELECT rider_id, SUM(TIMESTAMPDIFF(MINUTE, login_at, logout_at)) AS minutes",
        "  FROM RiderShift",
        "  WHERE DATE_FORMAT(login_at, '%Y-%m') = '2024-07' AND logout_at IS NOT NULL",
        "  GROUP BY rider_id",
        ")",
        "SELECT r.rider_id, r.name, ROUND(IFNULL(j.minutes, 0) / 60, 2) AS hours_logged,",
        "       IF(IFNULL(j.minutes, 0) >= 2400, 'Gold', IF(IFNULL(j.minutes, 0) >= 1200, 'Silver', 'None')) AS tier",
        "FROM Rider r LEFT JOIN july j ON j.rider_id = r.rider_id",
        "ORDER BY hours_logged DESC, r.rider_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "TIMESTAMPDIFF(MINUTE, a, b) gives a shift's length; sum it per rider.",
      "Every rider must appear — LEFT JOIN, and keep the July and open-shift conditions out of WHERE.",
      "A shift that starts on 30 June and ends in July belongs to June; one that starts on 31 July belongs to July.",
      "Decide the tier on minutes (2,400 and 1,200) rather than on the rounded hours.",
    ],
    editorial: [
      "The month rule is about `login_at` only: a shift from 30 June evening to 1 July morning is June's, and one starting late on 31 July is July's even though it ends in August. So the filter is the half-open range `login_at >= '2024-07-01' AND login_at < '2024-08-01'`, plus `logout_at IS NOT NULL` for open shifts (whose length would be NULL anyway).",
      "",
      "Because every rider must be listed, those conditions go in the LEFT JOIN's ON clause, not in WHERE; in WHERE they would delete the NULL-extended row of a rider with no July shift. Summing minutes over a rider with no matching shift gives NULL, so COALESCE makes it 0 before dividing by 60 and rounding.",
      "",
      "The tier compares exact minutes with 40 × 60 and 20 × 60; CASE tries Gold first so a 45-hour rider is not labelled Silver. Pre-aggregating July in a CTE and joining it to `Rider` is the same plan in two steps. One pass over the shifts.",
    ].join("\n"),
  },

  {
    slug: "month-over-month-gmv-change-by-city",
    title: "Month-Over-Month Delivered GMV Change by City",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates", "Aggregation"],
    description: [
      "The monthly business review shows each city's delivered GMV (sum of `order_value` of delivered orders) per calendar month, next to the city's figure for its **previous month with delivered orders**. Cancelled orders are not GMV, and a month in which a city delivered nothing has no row.",
      "",
      "Return `city`, `month` (as `YYYY-MM`), `gmv`, `prev_gmv` and `gmv_change` (`gmv − prev_gmv`). For a city's first month both `prev_gmv` and `gmv_change` are NULL. Order the rows by `city`, then `month`.",
    ].join("\n"),
    tables: [
      {
        name: "Orders",
        columns: [
          { name: "order_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "placed_at", type: "datetime" },
          { name: "order_value", type: "int" },
          { name: "status", type: "enum", values: ["delivered", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per order, value in rupees; `city` is the delivery city.",
      },
    ],
    examples: [
      {
        Orders: [
          [1, "Pune", "2024-01-05 13:00:00", 400, "delivered"],
          [2, "Pune", "2024-01-20 20:00:00", 350, "delivered"],
          [3, "Pune", "2024-02-11 19:30:00", 900, "delivered"],
          [4, "Pune", "2024-02-12 21:00:00", 500, "cancelled"],
          [5, "Pune", "2024-04-02 12:40:00", 620, "delivered"],
          [6, "Kochi", "2024-01-31 23:50:00", 280, "delivered"],
          [7, "Kochi", "2024-02-01 00:10:00", 260, "delivered"],
          [8, "Kochi", "2024-03-15 13:15:00", 300, "cancelled"],
        ],
      },
    ],
    gen: (rng) => {
      const cities = sample(rng, CITIES, ri(rng, 1, 3));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      const rows = seq(1, n).map((id) => [
        id,
        pick(rng, cities),
        atTime(rng, dateBetween(rng, "2024-01-01", "2024-06-30")),
        roundTo(rng, 150, 900, 10),
        chance(rng, 0.8) ? "delivered" : "cancelled",
      ]);
      return { Orders: rows };
    },
    solution: [
      "WITH monthly AS (",
      "  SELECT city, DATE_FORMAT(placed_at, '%Y-%m') AS month, SUM(order_value) AS gmv",
      "  FROM Orders",
      "  WHERE status = 'delivered'",
      "  GROUP BY city, DATE_FORMAT(placed_at, '%Y-%m')",
      ")",
      "SELECT city, month, gmv,",
      "       LAG(gmv) OVER (PARTITION BY city ORDER BY month) AS prev_gmv,",
      "       gmv - LAG(gmv) OVER (PARTITION BY city ORDER BY month) AS gmv_change",
      "FROM monthly",
      "ORDER BY city, month",
    ].join("\n"),
    alternatives: [
      [
        "WITH monthly AS (",
        "  SELECT city, LEFT(placed_at, 7) AS month, SUM(order_value) AS gmv",
        "  FROM Orders WHERE status = 'delivered' GROUP BY city, LEFT(placed_at, 7)",
        "), paired AS (",
        "  SELECT m.city, m.month, m.gmv,",
        "         (SELECT p.gmv FROM monthly p WHERE p.city = m.city AND p.month < m.month ORDER BY p.month DESC LIMIT 1) AS prev_gmv",
        "  FROM monthly m",
        ")",
        "SELECT city, month, gmv, prev_gmv, gmv - prev_gmv AS gmv_change FROM paired ORDER BY city, month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First build one row per city and month: group the delivered orders by city and DATE_FORMAT(placed_at, '%Y-%m').",
      "LAG(x) OVER (PARTITION BY city ORDER BY month) reads the previous row's value within the same city.",
      "'YYYY-MM' strings sort in time order, so they can be the window's ORDER BY.",
    ],
    editorial: [
      "Window functions work on rows, so first make the rows the report talks about: one per city and month. Group the delivered orders by `city` and `DATE_FORMAT(placed_at, '%Y-%m')` (or `LEFT(placed_at, 7)` — the first seven characters of a fixed-format datetime are the month) and sum the values. Cancelled orders are filtered out before grouping, so a month with only cancellations produces no row at all.",
      "",
      "Then `LAG(gmv) OVER (PARTITION BY city ORDER BY month)` puts the city's previous monthly row beside each row. Partitioning restarts the sequence for each city, so a city's first month gets NULL; and since a month with no deliveries has no row, the previous row is the previous month *with deliveries* — April's comparison in the example reaches back to February. The change is a plain subtraction, NULL when `prev_gmv` is NULL.",
      "",
      "The correlated alternative looks up, for each month, the latest earlier month of the same city with `ORDER BY month DESC LIMIT 1`; it is quadratic in the number of months, where the window is one sort.",
    ].join("\n"),
  },

  {
    slug: "packing-slip-item-list-per-quick-order",
    title: "Packing Slip Item List for Each Quick Order",
    difficulty: "MEDIUM",
    topics: ["Strings", "Aggregation"],
    description: [
      "Pickers at a dark store read one line per order from the packing screen. For each order placed at **store 3**, build the line from its items: each item written as `<product_name> x<quantity>` (e.g. `Amul Butter x2`), items sorted by `product_name` alphabetically and joined with `, ` (a comma and a space).",
      "",
      "Return `order_id`, `items` and `total_units` (the sum of quantities) for every store-3 order that has at least one item, ordered by `order_id`.",
    ].join("\n"),
    tables: [
      {
        name: "QuickOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "ordered_at", type: "datetime" },
        ],
        primaryKey: ["order_id"],
        note: "One row per grocery order.",
      },
      {
        name: "OrderItem",
        columns: [
          { name: "order_id", type: "int" },
          { name: "product_name", type: "varchar" },
          { name: "quantity", type: "int" },
        ],
        primaryKey: ["order_id", "product_name"],
        note: "One row per product in an order; `order_id` is always in `QuickOrder`.",
      },
    ],
    examples: [
      {
        QuickOrder: [
          [301, 3, "2024-11-05 07:40:00"],
          [302, 1, "2024-11-05 07:42:00"],
          [303, 3, "2024-11-05 08:05:00"],
          [304, 3, "2024-11-05 08:30:00"],
        ],
        OrderItem: [
          [301, "Toned Milk 500ml", 2],
          [301, "Brown Bread", 1],
          [301, "Amul Butter", 1],
          [302, "Basmati Rice 1kg", 1],
          [303, "Banana Robusta", 6],
          [303, "Eggs 6pc", 1],
        ],
      },
    ],
    gen: (rng) => {
      const GROCERIES = ["Amul Butter", "Brown Bread", "Toned Milk 500ml", "Basmati Rice 1kg", "Banana Robusta", "Eggs 6pc", "Maggi Noodles", "Onion 1kg", "Tomato 500g", "Paneer 200g", "Curd 400g", "Atta 5kg"];
      const n = ri(rng, 1, 7);
      const orders = seq(301, n).map((id) => [id, chance(rng, 0.6) ? 3 : pick(rng, [1, 2, 4]), atTime(rng, "2024-11-05")]);
      const items: Cell[][] = [];
      for (const o of orders) for (const p of sample(rng, GROCERIES, ri(rng, 0, 4))) items.push([o[0]!, p, pick(rng, [1, 1, 2, 3, 6])]);
      return { QuickOrder: orders, OrderItem: items };
    },
    solution: [
      "SELECT o.order_id,",
      "       GROUP_CONCAT(CONCAT(i.product_name, ' x', i.quantity) ORDER BY i.product_name SEPARATOR ', ') AS items,",
      "       SUM(i.quantity) AS total_units",
      "FROM QuickOrder o",
      "JOIN OrderItem i ON i.order_id = o.order_id",
      "WHERE o.store_id = 3",
      "GROUP BY o.order_id",
      "ORDER BY o.order_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT order_id, GROUP_CONCAT(label ORDER BY product_name SEPARATOR ', ') AS items, SUM(quantity) AS total_units",
        "FROM (SELECT i.order_id, i.product_name, i.quantity, CONCAT_WS(' x', i.product_name, i.quantity) AS label",
        "      FROM OrderItem i WHERE i.order_id IN (SELECT order_id FROM QuickOrder WHERE store_id = 3)) t",
        "GROUP BY order_id",
        "ORDER BY order_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "GROUP_CONCAT joins the values of a group into one string.",
      "Inside GROUP_CONCAT you can give an ORDER BY and a SEPARATOR.",
      "Build each item's label with CONCAT before it is concatenated.",
    ],
    editorial: [
      "The output has one row per order, so group the order's items by `order_id` after keeping only store 3. The aggregate that turns many rows into one string is `GROUP_CONCAT`: its argument can be any expression, here `CONCAT(product_name, ' x', quantity)` — the number is turned into text by CONCAT — and it takes its own `ORDER BY product_name` and `SEPARATOR ', '`.",
      "",
      "The ORDER BY inside GROUP_CONCAT is not decoration: without it the item order is whatever order the rows were read in, and the same order could print differently on two runs. MySQL's default separator is a comma with no space, so the separator must be given.",
      "",
      "Orders with no items have no rows to join and drop out, which is what the statement asks for. Building the label in a derived table (here with `CONCAT_WS`, which puts the separator between its arguments) and concatenating outside is the same plan. One join, one group per order.",
    ].join("\n"),
  },

  {
    slug: "coupon-discount-spend-by-campaign-prefix",
    title: "Coupon Discount Spend by Campaign Prefix",
    difficulty: "MEDIUM",
    topics: ["Strings", "Aggregation", "Conditional Logic"],
    description: [
      "Every coupon code issued since 2024 has the form `<CAMPAIGN>-<suffix>`, e.g. `DIWALI24-K7Q2`: the campaign is the part **before the first hyphen**. Older codes carry no hyphen at all; they belong to the campaign `LEGACY`.",
      "",
      "Return `campaign`, `redemptions` (number of redemptions) and `total_discount` (sum of `discount`) for every campaign with **at least 2 redemptions**, ordered by `total_discount` descending, then `campaign` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "CouponRedemption",
        columns: [
          { name: "redemption_id", type: "int" },
          { name: "order_id", type: "int" },
          { name: "coupon_code", type: "varchar" },
          { name: "discount", type: "int" },
        ],
        primaryKey: ["redemption_id"],
        note: "One row per coupon applied to an order, `discount` in rupees. Codes are upper-case letters, digits and hyphens.",
      },
    ],
    examples: [
      {
        CouponRedemption: [
          [1, 9001, "DIWALI24-K7Q2", 100],
          [2, 9002, "DIWALI24-ZZ81", 75],
          [3, 9003, "IPLNIGHT-A1", 60],
          [4, 9004, "WELCOME50", 50],
          [5, 9005, "FREEDEL", 30],
          [6, 9006, "IPLNIGHT-B2-X", 120],
          [7, 9007, "MONSOON-77", 40],
          [8, 9008, "WELCOME50", 50],
        ],
      },
    ],
    gen: (rng) => {
      const CAMPAIGNS = ["DIWALI24", "IPLNIGHT", "MONSOON", "HOLI25", "BIRYANI"];
      const LEGACY_CODES = ["WELCOME50", "FREEDEL", "FIRSTORDER", "SAVE20"];
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 20);
      const rows = seq(1, n).map((id) => {
        const legacy = chance(rng, 0.3);
        const suffix = `${String.fromCharCode(65 + ri(rng, 0, 25))}${ri(rng, 1, 99)}`;
        const code = legacy ? pick(rng, LEGACY_CODES) : `${pick(rng, CAMPAIGNS)}-${suffix}${chance(rng, 0.15) ? "-X" : ""}`;
        return [id, 9000 + id, code, pick(rng, [20, 30, 40, 50, 60, 75, 100, 120])];
      });
      return { CouponRedemption: rows };
    },
    solution: [
      "SELECT CASE WHEN LOCATE('-', coupon_code) = 0 THEN 'LEGACY'",
      "            ELSE SUBSTRING_INDEX(coupon_code, '-', 1) END AS campaign,",
      "       COUNT(*) AS redemptions,",
      "       SUM(discount) AS total_discount",
      "FROM CouponRedemption",
      "GROUP BY CASE WHEN LOCATE('-', coupon_code) = 0 THEN 'LEGACY'",
      "              ELSE SUBSTRING_INDEX(coupon_code, '-', 1) END",
      "HAVING COUNT(*) >= 2",
      "ORDER BY total_discount DESC, campaign",
    ].join("\n"),
    alternatives: [
      [
        "SELECT campaign, COUNT(*) AS redemptions, SUM(discount) AS total_discount",
        "FROM (SELECT IF(coupon_code LIKE '%-%', LEFT(coupon_code, INSTR(coupon_code, '-') - 1), 'LEGACY') AS campaign, discount",
        "      FROM CouponRedemption) t",
        "GROUP BY campaign",
        "HAVING COUNT(*) > 1",
        "ORDER BY total_discount DESC, campaign",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "SUBSTRING_INDEX(s, '-', 1) returns everything before the first hyphen.",
      "What does SUBSTRING_INDEX return for a code with no hyphen? It must become LEGACY instead.",
      "Group by the computed campaign — in a derived table, or by repeating the expression.",
    ],
    editorial: [
      "The grouping key is not a column but something derived from one. `SUBSTRING_INDEX(coupon_code, '-', 1)` returns the text before the first hyphen, so `IPLNIGHT-B2-X` is in `IPLNIGHT` — a split on the last hyphen would wrongly give `IPLNIGHT-B2`. For a code without a hyphen, SUBSTRING_INDEX returns the whole code, which would make `WELCOME50` and `FREEDEL` separate campaigns; the CASE (testing `LOCATE('-', code) = 0`, or `LIKE '%-%'`) sends them all to `LEGACY`.",
      "",
      "Group by that expression — MySQL also accepts the alias in GROUP BY, but computing it in a derived table and grouping the outer query by its column is the portable way. HAVING keeps campaigns with two or more redemptions, and the order is by total discount with the campaign name breaking ties.",
      "",
      "The cost is one pass and one group per campaign; the string functions are evaluated once per row.",
    ].join("\n"),
  },

  {
    slug: "restaurants-cooking-faster-than-their-city",
    title: "Restaurants Cooking Faster Than Their City Average",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Joins"],
    description: [
      "A kitchen ticket's preparation time is `TIMESTAMPDIFF(MINUTE, accepted_at, ready_at)`. The ops team wants restaurants whose **average preparation time is strictly lower than the average over all tickets of restaurants in the same city** (every ticket weighs the same in the city average).",
      "",
      "Return `name`, `city` and `avg_prep_min` (the restaurant's average preparation time, rounded to 2 decimal places) for every such restaurant. Restaurants with no tickets are not considered. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Restaurant",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["restaurant_id"],
        note: "One row per restaurant.",
      },
      {
        name: "KitchenTicket",
        columns: [
          { name: "ticket_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "accepted_at", type: "datetime" },
          { name: "ready_at", type: "datetime" },
        ],
        primaryKey: ["ticket_id"],
        note: "One row per order a kitchen accepted; `ready_at` is when the food was packed. `restaurant_id` is always in `Restaurant`.",
      },
    ],
    examples: [
      {
        Restaurant: [
          [1, "Kebab Kothi", "Delhi"],
          [2, "Paratha Point", "Delhi"],
          [3, "Chaat Corner", "Delhi"],
          [4, "Curry Leaf", "Kochi"],
          [5, "Momo Mansion", "Delhi"],
        ],
        KitchenTicket: [
          [1, 1, "2024-04-10 19:00:00", "2024-04-10 19:20:00"],
          [2, 1, "2024-04-10 20:00:00", "2024-04-10 20:24:00"],
          [3, 2, "2024-04-10 19:10:00", "2024-04-10 19:22:00"],
          [4, 2, "2024-04-10 19:40:00", "2024-04-10 19:55:00"],
          [5, 2, "2024-04-10 21:00:00", "2024-04-10 21:13:00"],
          [6, 3, "2024-04-10 18:00:00", "2024-04-10 18:16:00"],
          [7, 4, "2024-04-10 13:00:00", "2024-04-10 13:15:00"],
        ],
      },
    ],
    gen: (rng) => {
      const oneCity = chance(rng, 0.5);
      const restaurants = sample(rng, RESTAURANTS, chance(rng, 0.1) ? 1 : ri(rng, 3, 7)).map((name, i) => [i + 1, name, oneCity ? "Delhi" : pick(rng, ["Delhi", "Delhi", "Kochi"])]);
      const rows: Cell[][] = [];
      let id = 1;
      for (const r of restaurants) {
        // At most 5 tickets a restaurant: no displayed average is a half-way case at 2 decimals.
        const k = chance(rng, 0.15) ? 0 : ri(rng, 1, 5);
        const base = pick(rng, [8, 12, 16, 20]);
        for (let j = 0; j < k; j++) {
          const start = `2024-04-${String(ri(rng, 10, 16))} ${String(ri(rng, 12, 22))}:${String(ri(rng, 0, 5) * 10).padStart(2, "0")}:00`;
          const mins = base + ri(rng, 0, 6);
          const end = new Date(Date.parse(start.replace(" ", "T") + "Z") + mins * 60_000).toISOString().slice(0, 19).replace("T", " ");
          rows.push([id++, r[0]!, start, end]);
        }
      }
      return { Restaurant: restaurants, KitchenTicket: rows };
    },
    solution: [
      "WITH prep AS (",
      "  SELECT r.restaurant_id, r.name, r.city, TIMESTAMPDIFF(MINUTE, k.accepted_at, k.ready_at) AS mins",
      "  FROM KitchenTicket k JOIN Restaurant r ON r.restaurant_id = k.restaurant_id",
      ")",
      "SELECT p.name, p.city, ROUND(AVG(p.mins), 2) AS avg_prep_min",
      "FROM prep p",
      "GROUP BY p.restaurant_id, p.name, p.city",
      "HAVING AVG(p.mins) < (SELECT AVG(c.mins) FROM prep c WHERE c.city = p.city)",
    ].join("\n"),
    alternatives: [
      [
        "WITH prep AS (",
        "  SELECT r.restaurant_id, r.name, r.city, TIMESTAMPDIFF(MINUTE, k.accepted_at, k.ready_at) AS mins",
        "  FROM KitchenTicket k JOIN Restaurant r ON r.restaurant_id = k.restaurant_id",
        "), per_restaurant AS (",
        "  SELECT restaurant_id, name, city, SUM(mins) AS total, COUNT(*) AS n FROM prep GROUP BY restaurant_id, name, city",
        "), per_city AS (",
        "  SELECT city, SUM(mins) AS total, COUNT(*) AS n FROM prep GROUP BY city",
        ")",
        "SELECT p.name, p.city, ROUND(p.total / p.n, 2) AS avg_prep_min",
        "FROM per_restaurant p JOIN per_city c ON c.city = p.city",
        "WHERE p.total * c.n < c.total * p.n",
      ].join("\n"),
    ],
    hints: [
      "Compute each ticket's minutes once, with its restaurant's city attached.",
      "The city average is over tickets, not over restaurant averages — a busy kitchen weighs more.",
      "A correlated subquery in HAVING can compare a group's average with its city's.",
    ],
    editorial: [
      "Two averages are compared: one per restaurant, one per city, and the city one is **ticket-weighted** — the average of all the city's tickets, not the average of its restaurants' averages. In the example Delhi's tickets are 20, 24, 12, 15, 13 and 16 minutes, an average of 16.67; Paratha Point (13.33) and Chaat Corner (16) are faster, Kebab Kothi (22) is not. Averaging the three restaurant averages would give 17.11 instead, and the answer could change.",
      "",
      "A CTE that attaches the city and the minutes to each ticket keeps the rest short. Group it by restaurant for the restaurant's average, and in HAVING compare it with a correlated subquery over the same CTE filtered to the restaurant's city. Restaurants without tickets never enter the CTE, and a city's only restaurant equals its city average, so it is never strictly faster.",
      "",
      "Aggregating both levels into their own CTEs and comparing `total_r × n_c < total_c × n_r` avoids division entirely and computes each city once. Either plan is a pass over the tickets plus one group per restaurant.",
    ].join("\n"),
  },

  {
    slug: "customers-whose-second-order-came-within-a-week",
    title: "Customers Whose Second Order Came Within a Week",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates"],
    description: [
      "A customer who orders again within a week of their first order is far more likely to stay. For each customer, the first order is their earliest by `placed_at` and the second is the next one after it; the gap is `DATEDIFF` between the two **dates** (time of day ignored).",
      "",
      "Return `customer_id`, `first_order_on`, `second_order_on` (both as dates, `YYYY-MM-DD`) and `days_between` for every customer whose second order came **within 7 days** (0 to 7 inclusive). Customers with only one order are left out. Order the rows by `customer_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Orders",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "placed_at", type: "datetime" },
          { name: "order_value", type: "int" },
        ],
        primaryKey: ["order_id"],
        note: "One row per order. A customer never places two orders at the same instant.",
      },
    ],
    examples: [
      {
        Orders: [
          [1, 61, "2024-02-01 21:30:00", 320],
          [2, 61, "2024-02-08 09:00:00", 210],
          [3, 62, "2024-02-03 13:00:00", 450],
          [4, 62, "2024-02-11 13:00:00", 380],
          [5, 63, "2024-02-05 20:00:00", 260],
          [6, 64, "2024-02-10 23:55:00", 199],
          [7, 64, "2024-02-11 00:05:00", 240],
          [8, 64, "2024-02-12 12:00:00", 300],
          [9, 65, "2024-02-20 19:00:00", 280],
          [10, 65, "2024-02-14 19:00:00", 330],
        ],
      },
    ],
    gen: (rng) => {
      const customers = sample(rng, seq(61, 20), ri(rng, 1, 7));
      const rows: Cell[][] = [];
      let id = 1;
      for (const c of customers) {
        const first = dateBetween(rng, "2024-02-01", "2024-02-20");
        const k = ri(rng, 1, 4);
        const used = new Set<string>();
        for (let j = 0; j < k; j++) {
          const day = addDays(first, j === 0 ? 0 : pick(rng, [0, 1, 3, 6, 7, 7, 8, 12]));
          const at = `${day} ${String(ri(rng, 8, 23)).padStart(2, "0")}:${String(ri(rng, 0, 59)).padStart(2, "0")}:00`;
          if (used.has(at)) continue;
          used.add(at);
          rows.push([id++, c, at, roundTo(rng, 150, 700, 10)]);
        }
      }
      return { Orders: rows };
    },
    solution: [
      "WITH ranked AS (",
      "  SELECT customer_id, placed_at,",
      "         ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY placed_at) AS rn",
      "  FROM Orders",
      ")",
      "SELECT f.customer_id,",
      "       CAST(f.placed_at AS DATE) AS first_order_on,",
      "       CAST(s.placed_at AS DATE) AS second_order_on,",
      "       DATEDIFF(s.placed_at, f.placed_at) AS days_between",
      "FROM ranked f",
      "JOIN ranked s ON s.customer_id = f.customer_id AND s.rn = 2",
      "WHERE f.rn = 1 AND DATEDIFF(s.placed_at, f.placed_at) <= 7",
      "ORDER BY f.customer_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT customer_id, DATE(placed_at) AS first_order_on, DATE(next_at) AS second_order_on, DATEDIFF(next_at, placed_at) AS days_between",
        "FROM (SELECT customer_id, placed_at,",
        "             LEAD(placed_at) OVER (PARTITION BY customer_id ORDER BY placed_at) AS next_at,",
        "             ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY placed_at) AS rn",
        "      FROM Orders) t",
        "WHERE rn = 1 AND next_at IS NOT NULL AND DATEDIFF(next_at, placed_at) BETWEEN 0 AND 7",
        "ORDER BY customer_id",
      ].join("\n"),
      [
        "SELECT a.customer_id, CAST(a.first_at AS DATE) AS first_order_on, CAST(MIN(o.placed_at) AS DATE) AS second_order_on,",
        "       DATEDIFF(MIN(o.placed_at), a.first_at) AS days_between",
        "FROM (SELECT customer_id, MIN(placed_at) AS first_at FROM Orders GROUP BY customer_id) a",
        "JOIN Orders o ON o.customer_id = a.customer_id AND o.placed_at > a.first_at",
        "GROUP BY a.customer_id, a.first_at",
        "HAVING DATEDIFF(MIN(o.placed_at), a.first_at) <= 7",
        "ORDER BY a.customer_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Number each customer's orders in time order with ROW_NUMBER, or read the next one with LEAD.",
      "Rows are stored in no particular order — the first order is the earliest placed_at, not the lowest order_id.",
      "DATEDIFF counts calendar days between the dates, so 23:55 and 00:05 the next day are 1 day apart.",
    ],
    editorial: [
      "The first and second orders are positions in each customer's own timeline, which is what `ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY placed_at)` assigns: 1 for the earliest, 2 for the next. Joining the rank-1 row to the rank-2 row of the same customer puts both timestamps side by side; an inner join drops customers with a single order. `LEAD(placed_at)` read on the rank-1 row gives the same second timestamp without a join.",
      "",
      "Order ids are not a timeline — customer 65's order 10 came before order 9 — so the ordering must be on `placed_at`. The gap is in calendar days: `DATEDIFF` ignores the time of day, so an order at 23:55 and one at 00:05 the next day are 1 day apart, and 7 days counts as within a week.",
      "",
      "Without windows: the first order is `MIN(placed_at)` per customer, and the second is the minimum of the later ones — a grouped self join. That relies on a customer never ordering twice at one instant, which the table promises. The window plan is one sort per customer.",
    ].join("\n"),
  },

  {
    slug: "longest-on-time-delivery-streak-per-rider",
    title: "Longest On-Time Delivery Streak of Each Rider",
    difficulty: "HARD",
    topics: ["Window Functions"],
    description: [
      "Riders get a badge for long runs of on-time deliveries. A streak is a run of **consecutive** deliveries of one rider (in `delivered_at` order, `delivery_id` breaking a tie) that were all on time; a late delivery ends it.",
      "",
      "Return `rider_id` and `longest_streak` (the length of the rider's longest on-time streak, 0 if none of their deliveries was on time) for every rider who has at least one delivery. Order the rows by `longest_streak` descending, then `rider_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Delivery",
        columns: [
          { name: "delivery_id", type: "int" },
          { name: "rider_id", type: "int" },
          { name: "delivered_at", type: "datetime" },
          { name: "on_time", type: "bool" },
        ],
        primaryKey: ["delivery_id"],
        note: "One row per completed delivery; `on_time` is 1 when it reached the customer within the promised time, else 0.",
      },
    ],
    examples: [
      {
        Delivery: [
          [1, 7, "2024-03-01 12:30:00", 1],
          [2, 7, "2024-03-01 13:10:00", 1],
          [3, 7, "2024-03-01 14:00:00", 0],
          [4, 7, "2024-03-01 19:20:00", 1],
          [5, 7, "2024-03-01 20:05:00", 1],
          [6, 7, "2024-03-01 20:40:00", 1],
          [7, 8, "2024-03-01 12:00:00", 0],
          [8, 8, "2024-03-01 13:00:00", 0],
          [9, 9, "2024-03-01 21:00:00", 1],
          [10, 9, "2024-03-01 21:00:00", 0],
          [11, 9, "2024-03-01 21:45:00", 1],
          [12, 9, "2024-03-01 21:50:00", 1],
        ],
      },
    ],
    gen: (rng) => {
      const riders = sample(rng, seq(1, 12), ri(rng, 1, 4));
      const rows: Cell[][] = [];
      let id = 1;
      for (const r of riders) {
        const k = ri(rng, 1, 8);
        const p = pick(rng, [0, 0.5, 0.8, 1]);
        for (let j = 0; j < k; j++) {
          const at = `2024-03-01 ${String(10 + Math.floor(j * 1.5)).padStart(2, "0")}:${pick(rng, ["00", "00", "30"])}:00`;
          rows.push([id++, r, at, chance(rng, p) ? 1 : 0]);
        }
      }
      // Store the rows in shuffled id order, so delivery_id is not the timeline.
      const ids = sample(rng, seq(1, rows.length), rows.length);
      return { Delivery: rows.map((row, i) => [ids[i]!, ...row.slice(1)]) };
    },
    solution: [
      "WITH seq AS (",
      "  SELECT rider_id, on_time,",
      "         ROW_NUMBER() OVER (PARTITION BY rider_id ORDER BY delivered_at, delivery_id) AS rn,",
      "         ROW_NUMBER() OVER (PARTITION BY rider_id, on_time ORDER BY delivered_at, delivery_id) AS rn_same",
      "  FROM Delivery",
      "), runs AS (",
      "  SELECT rider_id, rn - rn_same AS island, COUNT(*) AS len",
      "  FROM seq",
      "  WHERE on_time = 1",
      "  GROUP BY rider_id, rn - rn_same",
      ")",
      "SELECT d.rider_id, COALESCE(MAX(r.len), 0) AS longest_streak",
      "FROM (SELECT DISTINCT rider_id FROM Delivery) d",
      "LEFT JOIN runs r ON r.rider_id = d.rider_id",
      "GROUP BY d.rider_id",
      "ORDER BY longest_streak DESC, d.rider_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH marked AS (",
        "  SELECT rider_id, on_time,",
        "         SUM(CASE WHEN on_time = 0 THEN 1 ELSE 0 END) OVER (PARTITION BY rider_id ORDER BY delivered_at, delivery_id",
        "             ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS breaks",
        "  FROM Delivery",
        "), runs AS (",
        "  SELECT rider_id, breaks, SUM(on_time) AS len FROM marked GROUP BY rider_id, breaks",
        ")",
        "SELECT rider_id, MAX(len) AS longest_streak FROM runs GROUP BY rider_id",
        "ORDER BY longest_streak DESC, rider_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Order each rider's deliveries by time; `delivery_id` is only a tie-breaker.",
      "Gaps and islands: the difference between a row number over all deliveries and a row number over only the on-time ones is constant along a streak.",
      "Another key for a streak: the number of late deliveries seen so far — a running SUM.",
      "A rider with no on-time delivery still needs a row with 0.",
    ],
    editorial: [
      "This is a **gaps-and-islands** problem: within each rider's ordered deliveries, find maximal runs of on-time rows. The trick is to give every row of one run the same key. Number each rider's deliveries in time order (`rn`), and separately number them within `(rider, on_time)` (`rn_same`). Along a run of on-time rows both numbers go up by one per row, so `rn − rn_same` stays constant; a late delivery in between bumps `rn` but not the on-time count, so the next run gets a new key. Group the on-time rows by that key, count them, and take each rider's maximum.",
      "",
      "A second way to key the runs: a running count of late deliveries, `SUM(CASE WHEN on_time = 0 …) OVER (… ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`. Every on-time row after the k-th late one carries k; summing `on_time` per key gives each run's length, and a rider with only late deliveries gets runs of length 0 — the 0 the statement asks for, with no extra join. The first query gets it from a LEFT JOIN of all riders and COALESCE.",
      "",
      "Order matters twice: by `delivered_at`, not by id, and with `delivery_id` breaking equal timestamps so the run boundaries are fixed (rider 9's two 21:00 deliveries). The `ROWS` frame keeps the running sum per row even when timestamps repeat. Each plan is a sort per rider.",
    ].join("\n"),
  },

  {
    slug: "next-month-retention-of-first-order-cohorts",
    title: "Next-Month Retention of First-Order Cohorts",
    difficulty: "HARD",
    topics: ["Dates", "Aggregation", "Subqueries"],
    description: [
      "A customer's **cohort** is the calendar month of their first order. A customer is **retained** if they ordered again at any time in the **calendar month right after** their cohort month (a January customer must order in February; ordering again in January, or only in March, does not count).",
      "",
      "Return one row per cohort with `cohort_month` (`YYYY-MM`), `customers` (the cohort's size), `retained` and `retention_pct` (retained as a percentage of customers, rounded to 1 decimal place). Order the rows by `cohort_month`.",
    ].join("\n"),
    tables: [
      {
        name: "Orders",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "placed_at", type: "datetime" },
          { name: "order_value", type: "int" },
        ],
        primaryKey: ["order_id"],
        note: "One row per delivered order.",
      },
    ],
    examples: [
      {
        Orders: [
          [1, 71, "2024-01-04 13:00:00", 300],
          [2, 71, "2024-02-14 20:00:00", 420],
          [3, 72, "2024-01-20 19:30:00", 250],
          [4, 72, "2024-01-28 21:00:00", 310],
          [5, 73, "2024-01-31 23:00:00", 199],
          [6, 73, "2024-03-02 12:00:00", 260],
          [7, 74, "2024-12-30 20:00:00", 500],
          [8, 74, "2025-01-05 13:30:00", 350],
          [9, 75, "2024-12-12 19:00:00", 280],
          [10, 76, "2024-02-29 22:00:00", 330],
          [11, 76, "2024-03-01 09:00:00", 150],
        ],
      },
    ],
    gen: (rng) => {
      const customers = sample(rng, seq(71, 30), ri(rng, 1, 14));
      const rows: Cell[][] = [];
      let id = 1;
      for (const c of customers) {
        const first = pick(rng, ["2024-01-", "2024-02-", "2024-11-", "2024-12-"]) + String(ri(rng, 1, 28)).padStart(2, "0");
        rows.push([id++, c, atTime(rng, first), roundTo(rng, 150, 700, 10)]);
        for (const gap of sample(rng, [2, 10, 20, 31, 35, 45, 62], ri(rng, 0, 2))) rows.push([id++, c, atTime(rng, addDays(first, gap)), roundTo(rng, 150, 700, 10)]);
      }
      return { Orders: rows };
    },
    solution: [
      "WITH firsts AS (",
      "  SELECT customer_id, DATE_FORMAT(MIN(placed_at), '%Y-%m-01') AS cohort_start",
      "  FROM Orders",
      "  GROUP BY customer_id",
      "), flagged AS (",
      "  SELECT f.customer_id, f.cohort_start,",
      "         CASE WHEN EXISTS (",
      "           SELECT 1 FROM Orders o",
      "           WHERE o.customer_id = f.customer_id",
      "             AND o.placed_at >= DATE_ADD(f.cohort_start, INTERVAL 1 MONTH)",
      "             AND o.placed_at < DATE_ADD(f.cohort_start, INTERVAL 2 MONTH)",
      "         ) THEN 1 ELSE 0 END AS kept",
      "  FROM firsts f",
      ")",
      "SELECT LEFT(cohort_start, 7) AS cohort_month,",
      "       COUNT(*) AS customers,",
      "       SUM(kept) AS retained,",
      "       ROUND(100 * SUM(kept) / COUNT(*), 1) AS retention_pct",
      "FROM flagged",
      "GROUP BY LEFT(cohort_start, 7)",
      "ORDER BY cohort_month",
    ].join("\n"),
    alternatives: [
      [
        "WITH months AS (",
        "  SELECT DISTINCT customer_id, DATE_FORMAT(placed_at, '%Y-%m') AS ym FROM Orders",
        "), cohort AS (",
        "  SELECT customer_id, MIN(ym) AS ym FROM months GROUP BY customer_id",
        ")",
        "SELECT c.ym AS cohort_month, COUNT(*) AS customers, COUNT(n.customer_id) AS retained,",
        "       ROUND(COUNT(n.customer_id) * 100 / COUNT(*), 1) AS retention_pct",
        "FROM cohort c",
        "LEFT JOIN months n ON n.customer_id = c.customer_id",
        "  AND TIMESTAMPDIFF(MONTH, CONCAT(c.ym, '-01'), CONCAT(n.ym, '-01')) = 1",
        "GROUP BY c.ym",
        "ORDER BY cohort_month",
      ].join("\n"),
      [
        "WITH firsts AS (SELECT customer_id, MIN(placed_at) AS first_at FROM Orders GROUP BY customer_id)",
        "SELECT DATE_FORMAT(f.first_at, '%Y-%m') AS cohort_month, COUNT(*) AS customers,",
        "       SUM(CASE WHEN (SELECT COUNT(*) FROM Orders o WHERE o.customer_id = f.customer_id",
        "                       AND DATE_FORMAT(o.placed_at, '%Y-%m') = DATE_FORMAT(DATE_ADD(DATE_FORMAT(f.first_at, '%Y-%m-01'), INTERVAL 1 MONTH), '%Y-%m')) > 0",
        "                THEN 1 ELSE 0 END) AS retained,",
        "       ROUND(100 * SUM(CASE WHEN (SELECT COUNT(*) FROM Orders o WHERE o.customer_id = f.customer_id",
        "                       AND DATE_FORMAT(o.placed_at, '%Y-%m') = DATE_FORMAT(DATE_ADD(DATE_FORMAT(f.first_at, '%Y-%m-01'), INTERVAL 1 MONTH), '%Y-%m')) > 0",
        "                THEN 1 ELSE 0 END) / COUNT(*), 1) AS retention_pct",
        "FROM firsts f",
        "GROUP BY DATE_FORMAT(f.first_at, '%Y-%m')",
        "ORDER BY cohort_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Step one: each customer's first order, and the first day of that month.",
      "The next calendar month runs from cohort start + 1 month (included) to cohort start + 2 months (excluded).",
      "December's next month is January of the next year — month arithmetic must handle the year.",
      "Flag each customer 0/1 for retained, then group the flags by cohort.",
    ],
    editorial: [
      "A cohort analysis is a chain of small steps, which is what CTEs are for. First find each customer's first order with `MIN(placed_at)` and reduce it to the first day of its month (`DATE_FORMAT(…, '%Y-%m-01')`). That date is the cohort.",
      "",
      "Next, flag each customer: retained when an order exists in the half-open window `[cohort + 1 month, cohort + 2 months)`. `DATE_ADD(…, INTERVAL n MONTH)` does the calendar arithmetic, including December → January of the next year (customer 74) and February's short month (customer 76, first order 29 February, retained by 1 March). A repeat order in the same month (customer 72) or a skip to the month after next (customer 73) is not in the window. `EXISTS` makes each customer count once however many orders they placed.",
      "",
      "Finally group the flags by cohort: `COUNT(*)` is the size, `SUM(kept)` the retained, and their ratio × 100, rounded to one decimal, the percentage. Reducing every order to its distinct `YYYY-MM` and joining a cohort to the month exactly one later (`TIMESTAMPDIFF(MONTH, …) = 1` between the first days) turns the flag into a LEFT JOIN instead. Each customer is looked up once with an index on `(customer_id, placed_at)`.",
    ].join("\n"),
  },

  {
    slug: "double-logged-rider-shifts-that-overlap",
    title: "Double-Logged Rider Shifts That Overlap",
    difficulty: "HARD",
    topics: ["Joins", "Dates"],
    description: [
      "A rider who logs in on two phones at once can earn login-hour incentives twice. Audit finds every **pair of shifts of the same rider whose time ranges overlap**. A shift runs from `login_at` to `logout_at`; two shifts that only touch (one ends at the very instant the other starts) do not overlap. A shift lying entirely inside another does.",
      "",
      "Return each overlapping pair once with columns `rider_id`, `first_shift` (the smaller `shift_id`), `second_shift` (the larger) and `overlap_minutes` (whole minutes during which both shifts were open). Order the rows by `rider_id`, then `first_shift`, then `second_shift`.",
    ].join("\n"),
    tables: [
      {
        name: "RiderShift",
        columns: [
          { name: "shift_id", type: "int" },
          { name: "rider_id", type: "int" },
          { name: "login_at", type: "datetime" },
          { name: "logout_at", type: "datetime" },
        ],
        primaryKey: ["shift_id"],
        note: "One row per closed login session; `logout_at` is always later than `login_at`.",
      },
    ],
    examples: [
      {
        RiderShift: [
          [1, 21, "2024-08-05 08:00:00", "2024-08-05 12:00:00"],
          [2, 21, "2024-08-05 11:30:00", "2024-08-05 15:00:00"],
          [3, 21, "2024-08-05 15:00:00", "2024-08-05 18:00:00"],
          [4, 22, "2024-08-05 09:00:00", "2024-08-05 17:00:00"],
          [5, 22, "2024-08-05 10:00:00", "2024-08-05 11:15:00"],
          [6, 22, "2024-08-05 16:30:00", "2024-08-05 20:00:00"],
          [7, 23, "2024-08-05 10:00:00", "2024-08-05 14:00:00"],
          [8, 21, "2024-08-05 07:00:00", "2024-08-05 08:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const riders = sample(rng, seq(21, 10), ri(rng, 1, 4));
      const rows: Cell[][] = [];
      let id = 1;
      for (const r of riders) {
        for (let j = ri(rng, 1, 5); j > 0; j--) {
          // Half-hour starts and lengths, so shifts that just touch are common.
          const startMin = ri(rng, 12, 40) * 30;
          const len = ri(rng, 2, 10) * 30;
          const at = (m: number) => `2024-08-05 ${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:00`;
          rows.push([id++, r, at(startMin), at(Math.min(startMin + len, 23 * 60 + 30))]);
        }
      }
      return { RiderShift: rows };
    },
    solution: [
      "SELECT a.rider_id, a.shift_id AS first_shift, b.shift_id AS second_shift,",
      "       TIMESTAMPDIFF(MINUTE, GREATEST(a.login_at, b.login_at), LEAST(a.logout_at, b.logout_at)) AS overlap_minutes",
      "FROM RiderShift a",
      "JOIN RiderShift b",
      "  ON b.rider_id = a.rider_id",
      " AND a.shift_id < b.shift_id",
      " AND a.login_at < b.logout_at",
      " AND b.login_at < a.logout_at",
      "ORDER BY a.rider_id, first_shift, second_shift",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.rider_id, a.shift_id AS first_shift, b.shift_id AS second_shift,",
        "       TIMESTAMPDIFF(MINUTE,",
        "         CASE WHEN a.login_at > b.login_at THEN a.login_at ELSE b.login_at END,",
        "         CASE WHEN a.logout_at < b.logout_at THEN a.logout_at ELSE b.logout_at END) AS overlap_minutes",
        "FROM RiderShift a, RiderShift b",
        "WHERE a.rider_id = b.rider_id AND a.shift_id < b.shift_id",
        "  AND NOT (a.logout_at <= b.login_at OR b.logout_at <= a.login_at)",
        "ORDER BY 1, 2, 3",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Pair each shift with every other shift of the same rider — a self join.",
      "`a.shift_id < b.shift_id` lists each pair once and never pairs a shift with itself.",
      "Two ranges overlap exactly when each starts before the other ends.",
      "The shared stretch starts at the later login and ends at the earlier logout.",
    ],
    editorial: [
      "Overlap is a relation between two rows of the same table, so the query is a self join of `RiderShift` on `rider_id`. Requiring `a.shift_id < b.shift_id` does two jobs: a shift is never paired with itself, and each unordered pair appears once, with the smaller id first as the output asks.",
      "",
      "The overlap test is the classic one for intervals: `[s1, e1)` and `[s2, e2)` overlap when `s1 < e2 AND s2 < e1`. It covers every shape — partial overlap from either side, and one shift inside another (shift 5 inside shift 4). The strict `<` is what makes touching shifts (shift 2 ends at 15:00, shift 3 starts at 15:00) not an overlap. Its negation, \"one ends before or when the other starts\", is the alternative's `NOT (e1 <= s2 OR e2 <= s1)`.",
      "",
      "The shared stretch runs from the later of the two logins to the earlier of the two logouts, `GREATEST(login)` to `LEAST(logout)`, and TIMESTAMPDIFF gives its minutes; a CASE picks the same two instants. The self join compares every pair of a rider's shifts — quadratic per rider, which is fine for a day's shifts; sorting by login and comparing neighbours with LAG would find overlaps with the previous shift only, missing a long shift that covers several later ones.",
    ].join("\n"),
  },

  {
    slug: "dark-store-daily-orders-with-zero-days",
    title: "Dark Store Daily Orders, Zero Days Included",
    difficulty: "HARD",
    topics: ["Dates", "Window Functions"],
    description: [
      "The launch report for the new **store 7** shows one row for **every day from 1 to 14 June 2024**, including days with no orders. An order counts on the date of its `ordered_at` unless it was cancelled.",
      "",
      "Return `order_date` (`YYYY-MM-DD`), `orders` (that day's non-cancelled store-7 orders, 0 when none) and `cumulative_orders` (the running total from 1 June up to and including that day). Exactly 14 rows, ordered by `order_date`.",
    ].join("\n"),
    tables: [
      {
        name: "QuickOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "store_id", type: "int" },
          { name: "ordered_at", type: "datetime" },
          { name: "status", type: "enum", values: ["delivered", "cancelled", "returned"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per grocery order across all dark stores. A returned order was delivered and still counts.",
      },
    ],
    examples: [
      {
        QuickOrder: [
          [1, 7, "2024-06-01 08:10:00", "delivered"],
          [2, 7, "2024-06-01 21:45:00", "delivered"],
          [3, 7, "2024-06-03 07:30:00", "cancelled"],
          [4, 5, "2024-06-03 09:00:00", "delivered"],
          [5, 7, "2024-06-04 23:59:00", "returned"],
          [6, 7, "2024-06-09 12:00:00", "delivered"],
          [7, 7, "2024-06-14 18:20:00", "delivered"],
          [8, 7, "2024-06-15 00:05:00", "delivered"],
          [9, 7, "2024-05-31 22:00:00", "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      const rows = seq(1, n).map((id) => [
        id,
        chance(rng, 0.75) ? 7 : pick(rng, [3, 5, 9]),
        atTime(rng, dateBetween(rng, "2024-05-30", "2024-06-16")),
        pick(rng, ["delivered", "delivered", "delivered", "cancelled", "returned"]),
      ]);
      return { QuickOrder: rows };
    },
    solution: [
      "WITH RECURSIVE days AS (",
      "  SELECT CAST('2024-06-01' AS DATE) AS d",
      "  UNION ALL",
      "  SELECT DATE_ADD(d, INTERVAL 1 DAY) FROM days WHERE d < '2024-06-14'",
      "), daily AS (",
      "  SELECT days.d AS order_date, COUNT(o.order_id) AS orders",
      "  FROM days",
      "  LEFT JOIN QuickOrder o",
      "    ON o.store_id = 7 AND o.status <> 'cancelled'",
      "   AND o.ordered_at >= days.d AND o.ordered_at < DATE_ADD(days.d, INTERVAL 1 DAY)",
      "  GROUP BY days.d",
      ")",
      "SELECT order_date, orders,",
      "       SUM(orders) OVER (ORDER BY order_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_orders",
      "FROM daily",
      "ORDER BY order_date",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE days AS (",
        "  SELECT 0 AS k UNION ALL SELECT k + 1 FROM days WHERE k < 13",
        "), counted AS (",
        "  SELECT CAST(ordered_at AS DATE) AS dt FROM QuickOrder WHERE store_id = 7 AND status IN ('delivered', 'returned')",
        ")",
        "SELECT DATE_ADD('2024-06-01', INTERVAL k DAY) AS order_date,",
        "       (SELECT COUNT(*) FROM counted c WHERE c.dt = DATE_ADD('2024-06-01', INTERVAL k DAY)) AS orders,",
        "       (SELECT COUNT(*) FROM counted c WHERE c.dt BETWEEN '2024-06-01' AND DATE_ADD('2024-06-01', INTERVAL k DAY)) AS cumulative_orders",
        "FROM days",
        "ORDER BY order_date",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Days with no orders have no rows in the table — you need a table of dates to start from.",
      "A recursive CTE can generate 1 June to 14 June one DATE_ADD at a time.",
      "LEFT JOIN the orders to the dates and put the store and status conditions in the ON clause.",
      "A running total is SUM(...) OVER (ORDER BY date).",
    ],
    editorial: [
      "GROUP BY can only report the dates that have rows, and a day with no orders has none, so the dates must come from somewhere else. A **recursive CTE** builds them: the anchor is 1 June, the recursive step adds one day with `DATE_ADD(d, INTERVAL 1 DAY)`, and `WHERE d < '2024-06-14'` stops it after 14 rows.",
      "",
      "LEFT JOIN the orders onto that calendar. The conditions that pick orders — store 7, not cancelled, placed on that day — go in the ON clause; in WHERE they would drop the NULL-extended rows of empty days. Matching a day as the half-open range `[d, d + 1 day)` keeps 23:59 on the 4th on the 4th and 00:05 on the 15th out of the window. `COUNT(o.order_id)` counts only real matches, so an empty day is 0.",
      "",
      "The running total is a window over the 14 daily rows: `SUM(orders) OVER (ORDER BY order_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`. Correlated counts per day — that day's orders, and all orders from 1 June to that day — give the same numbers by re-scanning, which is quadratic but tiny for 14 days. The recursion is bounded by its own WHERE, so it always terminates.",
    ].join("\n"),
  },

  {
    slug: "food-app-checkout-funnel-by-step",
    title: "Food App Checkout Funnel, Step by Step",
    difficulty: "HARD",
    topics: ["Conditional Logic", "Aggregation", "Subqueries"],
    description: [
      "The checkout funnel has four steps in order: `menu_view` → `add_to_cart` → `checkout` → `payment_success`. A session **reaches** step 1 if it has a `menu_view`, and reaches each later step if it has an event of that step **strictly later** than the moment it reached the step before (the earliest such event). An `add_to_cart` before any menu view, for example, does not count.",
      "",
      "Return four rows, one per step, with `step_no` (1–4), `step` (the event name), `sessions` (sessions that reached the step) and `conversion_pct` (sessions as a percentage of the previous step's sessions, rounded to 1 decimal place; NULL for step 1 and whenever the previous step has 0 sessions). Order the rows by `step_no`.",
    ].join("\n"),
    tables: [
      {
        name: "AppEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "session_id", type: "int" },
          { name: "event_type", type: "enum", values: ["menu_view", "add_to_cart", "checkout", "payment_success"] },
          { name: "event_at", type: "datetime" },
        ],
        primaryKey: ["event_id"],
        note: "One row per tracked event in the food app; a session can repeat an event.",
      },
    ],
    examples: [
      {
        AppEvent: [
          [1, 501, "menu_view", "2024-09-14 20:00:00"],
          [2, 501, "add_to_cart", "2024-09-14 20:02:00"],
          [3, 501, "checkout", "2024-09-14 20:04:00"],
          [4, 501, "payment_success", "2024-09-14 20:05:00"],
          [5, 502, "add_to_cart", "2024-09-14 20:10:00"],
          [6, 502, "menu_view", "2024-09-14 20:11:00"],
          [7, 503, "menu_view", "2024-09-14 20:20:00"],
          [8, 503, "add_to_cart", "2024-09-14 20:21:00"],
          [9, 503, "checkout", "2024-09-14 20:25:00"],
          [10, 504, "menu_view", "2024-09-14 21:00:00"],
          [11, 504, "payment_success", "2024-09-14 21:01:00"],
        ],
      },
    ],
    gen: (rng) => {
      const steps = ["menu_view", "add_to_cart", "checkout", "payment_success"];
      const sessions = sample(rng, seq(501, 30), chance(rng, 0.05) ? 0 : ri(rng, 1, 10));
      const rows: Cell[][] = [];
      let id = 1;
      for (const s of sessions) {
        let minute = ri(rng, 0, 600);
        const depth = ri(rng, 1, 4);
        for (let k = 0; k < depth; k++) {
          // Mostly in order; sometimes a step out of place or repeated.
          const type = chance(rng, 0.15) ? pick(rng, steps) : steps[k]!;
          minute += pick(rng, [0, 1, 2, 3]);
          const at = `2024-09-14 ${String(10 + Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}:00`;
          rows.push([id++, s, type, at]);
        }
      }
      return { AppEvent: rows };
    },
    solution: [
      "WITH s1 AS (",
      "  SELECT session_id, MIN(event_at) AS t FROM AppEvent WHERE event_type = 'menu_view' GROUP BY session_id",
      "), s2 AS (",
      "  SELECT p.session_id, MIN(e.event_at) AS t FROM s1 p",
      "  JOIN AppEvent e ON e.session_id = p.session_id AND e.event_type = 'add_to_cart' AND e.event_at > p.t",
      "  GROUP BY p.session_id",
      "), s3 AS (",
      "  SELECT p.session_id, MIN(e.event_at) AS t FROM s2 p",
      "  JOIN AppEvent e ON e.session_id = p.session_id AND e.event_type = 'checkout' AND e.event_at > p.t",
      "  GROUP BY p.session_id",
      "), s4 AS (",
      "  SELECT p.session_id, MIN(e.event_at) AS t FROM s3 p",
      "  JOIN AppEvent e ON e.session_id = p.session_id AND e.event_type = 'payment_success' AND e.event_at > p.t",
      "  GROUP BY p.session_id",
      "), counts AS (",
      "  SELECT 1 AS step_no, 'menu_view' AS step, (SELECT COUNT(*) FROM s1) AS sessions",
      "  UNION ALL SELECT 2, 'add_to_cart', (SELECT COUNT(*) FROM s2)",
      "  UNION ALL SELECT 3, 'checkout', (SELECT COUNT(*) FROM s3)",
      "  UNION ALL SELECT 4, 'payment_success', (SELECT COUNT(*) FROM s4)",
      ")",
      "SELECT step_no, step, sessions,",
      "       ROUND(100 * sessions / NULLIF(LAG(sessions) OVER (ORDER BY step_no), 0), 1) AS conversion_pct",
      "FROM counts",
      "ORDER BY step_no",
    ].join("\n"),
    alternatives: [
      [
        "WITH t AS (",
        "  SELECT session_id, MIN(event_at) AS t1 FROM AppEvent WHERE event_type = 'menu_view' GROUP BY session_id",
        "), t2 AS (",
        "  SELECT session_id, t1, (SELECT MIN(e.event_at) FROM AppEvent e WHERE e.session_id = t.session_id",
        "                         AND e.event_type = 'add_to_cart' AND e.event_at > t.t1) AS t2 FROM t",
        "), t3 AS (",
        "  SELECT session_id, t2, (SELECT MIN(e.event_at) FROM AppEvent e WHERE e.session_id = t2.session_id",
        "                         AND e.event_type = 'checkout' AND e.event_at > t2.t2) AS t3 FROM t2",
        "), t4 AS (",
        "  SELECT session_id, t2, t3, (SELECT MIN(e.event_at) FROM AppEvent e WHERE e.session_id = t3.session_id",
        "                             AND e.event_type = 'payment_success' AND e.event_at > t3.t3) AS t4 FROM t3",
        "), totals AS (",
        "  SELECT COUNT(*) AS c1,",
        "         SUM(CASE WHEN t2 IS NOT NULL THEN 1 ELSE 0 END) AS c2,",
        "         SUM(CASE WHEN t3 IS NOT NULL THEN 1 ELSE 0 END) AS c3,",
        "         SUM(CASE WHEN t4 IS NOT NULL THEN 1 ELSE 0 END) AS c4",
        "  FROM t4",
        ")",
        "SELECT 1 AS step_no, 'menu_view' AS step, c1 AS sessions, NULL AS conversion_pct FROM totals",
        "UNION ALL SELECT 2, 'add_to_cart', COALESCE(c2, 0), CASE WHEN c1 > 0 THEN ROUND(100 * COALESCE(c2, 0) / c1, 1) END FROM totals",
        "UNION ALL SELECT 3, 'checkout', COALESCE(c3, 0), CASE WHEN c2 > 0 THEN ROUND(100 * c3 / c2, 1) END FROM totals",
        "UNION ALL SELECT 4, 'payment_success', COALESCE(c4, 0), CASE WHEN c3 > 0 THEN ROUND(100 * c4 / c3, 1) END FROM totals",
        "ORDER BY step_no",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Work step by step: the time a session reached step 1, then the earliest event of step 2 after it, and so on.",
      "Each step's CTE can start from the sessions that reached the previous step.",
      "The four counts become four rows with UNION ALL.",
      "LAG(sessions) gives the previous step's count; NULLIF guards the division.",
    ],
    editorial: [
      "An ordered funnel cannot be counted from event types alone: session 502 has a cart event, but only *before* it viewed a menu, and session 504 paid without a cart or checkout. So each session is walked through the steps in order, remembering when it reached each one.",
      "",
      "Step 1 is the earliest `menu_view` per session. Step 2 starts from those sessions and takes the earliest `add_to_cart` strictly after that time; the inner join drops sessions that have none. Steps 3 and 4 repeat the pattern. Taking the **earliest** qualifying event at each step is the greedy choice that is always right: reaching a step sooner can only leave more later events eligible for the next one.",
      "",
      "Each CTE's row count is the number of sessions at that step. Four scalar subqueries joined with UNION ALL turn them into the four required rows, and the conversion is `sessions / previous` — `LAG(sessions) OVER (ORDER BY step_no)`, NULL on step 1, with `NULLIF(…, 0)` returning NULL instead of dividing by zero when nobody reached the previous step. The alternative computes the four times per session with correlated subqueries and counts the non-NULL ones with conditional aggregation. Each step is one join of the surviving sessions to the events.",
    ].join("\n"),
  },

  {
    slug: "rider-cash-in-hand-between-deposits",
    title: "Rider Cash-in-Hand Between Deposits",
    difficulty: "HARD",
    topics: ["Window Functions", "Conditional Logic"],
    description: [
      "Riders collect cash on cash-on-delivery orders and hand it in at a hub. A `cod_collected` entry adds its `amount` to the rider's cash in hand; a `deposit` hands in **all** the cash and resets it to 0. Entries apply in `entry_at` order. For safety a rider should never carry more than ₹2,000.",
      "",
      "For every rider with at least one entry, return `rider_id`, `max_cash_in_hand` (the most cash they held after any entry; 0 if they never held any) and `limit_breaches` (the number of `cod_collected` entries after which the cash in hand was **more than** ₹2,000). Order the rows by `rider_id`.",
    ].join("\n"),
    tables: [
      {
        name: "CashLedger",
        columns: [
          { name: "entry_id", type: "int" },
          { name: "rider_id", type: "int" },
          { name: "entry_at", type: "datetime" },
          { name: "entry_type", type: "enum", values: ["cod_collected", "deposit"] },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["entry_id"],
        note: "One row per cash event, in rupees. A rider never has two entries at the same instant. For a deposit, `amount` is what the hub counted and does not affect the rule.",
      },
    ],
    examples: [
      {
        CashLedger: [
          [1, 31, "2024-12-02 12:10:00", "cod_collected", 650],
          [2, 31, "2024-12-02 13:00:00", "cod_collected", 900],
          [3, 31, "2024-12-02 13:40:00", "cod_collected", 520],
          [4, 31, "2024-12-02 14:30:00", "cod_collected", 300],
          [5, 31, "2024-12-02 15:00:00", "deposit", 2370],
          [6, 31, "2024-12-02 19:15:00", "cod_collected", 1200],
          [7, 32, "2024-12-02 12:30:00", "cod_collected", 2000],
          [8, 32, "2024-12-02 13:30:00", "deposit", 2000],
          [9, 32, "2024-12-02 20:00:00", "cod_collected", 450],
          [10, 33, "2024-12-02 10:00:00", "deposit", 0],
        ],
      },
    ],
    gen: (rng) => {
      const riders = sample(rng, seq(31, 10), ri(rng, 1, 4));
      const rows: Cell[][] = [];
      let id = 1;
      for (const r of riders) {
        const k = ri(rng, 1, 7);
        const minutes = sample(rng, seq(0, 48), k).sort((a, b) => a - b);
        for (const m of minutes) {
          const at = `2024-12-02 ${String(9 + Math.floor(m / 4)).padStart(2, "0")}:${String((m % 4) * 15).padStart(2, "0")}:00`;
          const deposit = chance(rng, 0.25);
          rows.push([id++, r, at, deposit ? "deposit" : "cod_collected", deposit ? ri(rng, 0, 3000) : pick(rng, [300, 450, 500, 650, 900, 1000, 1200])]);
        }
      }
      // Store the rows in shuffled id order, so entry_id is not the timeline.
      const ids = sample(rng, seq(1, rows.length), rows.length);
      return { CashLedger: rows.map((row, i) => [ids[i]!, ...row.slice(1)]) };
    },
    solution: [
      "WITH cycles AS (",
      "  SELECT rider_id, entry_at, entry_type, amount,",
      "         SUM(CASE WHEN entry_type = 'deposit' THEN 1 ELSE 0 END)",
      "           OVER (PARTITION BY rider_id ORDER BY entry_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cycle",
      "  FROM CashLedger",
      "), balances AS (",
      "  SELECT rider_id, entry_type,",
      "         SUM(CASE WHEN entry_type = 'cod_collected' THEN amount ELSE 0 END)",
      "           OVER (PARTITION BY rider_id, cycle ORDER BY entry_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cash",
      "  FROM cycles",
      ")",
      "SELECT rider_id,",
      "       MAX(cash) AS max_cash_in_hand,",
      "       SUM(CASE WHEN entry_type = 'cod_collected' AND cash > 2000 THEN 1 ELSE 0 END) AS limit_breaches",
      "FROM balances",
      "GROUP BY rider_id",
      "ORDER BY rider_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH balances AS (",
        "  SELECT e.rider_id, e.entry_type,",
        "         (SELECT COALESCE(SUM(c.amount), 0) FROM CashLedger c",
        "          WHERE c.rider_id = e.rider_id AND c.entry_type = 'cod_collected' AND c.entry_at <= e.entry_at",
        "            AND c.entry_at > COALESCE((SELECT MAX(d.entry_at) FROM CashLedger d",
        "                                       WHERE d.rider_id = e.rider_id AND d.entry_type = 'deposit' AND d.entry_at <= e.entry_at),",
        "                                      '1900-01-01 00:00:00')) AS cash",
        "  FROM CashLedger e",
        ")",
        "SELECT rider_id, MAX(cash) AS max_cash_in_hand,",
        "       COUNT(CASE WHEN entry_type = 'cod_collected' AND cash > 2000 THEN 1 END) AS limit_breaches",
        "FROM balances GROUP BY rider_id ORDER BY rider_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "A running total that resets: split each rider's timeline into cycles that start at a deposit.",
      "A running count of deposits gives every row its cycle number.",
      "Within (rider, cycle), a running SUM of the collected amounts is the cash in hand after each entry.",
      "Count breaches only on collection rows — a deposit row's cash is always 0.",
    ],
    editorial: [
      "A plain running SUM would keep growing across deposits; the cash in hand is a running total that **resets** at every deposit. The standard trick is to turn the resets into a grouping key. A running count of deposits — `SUM(CASE WHEN entry_type = 'deposit' THEN 1 ELSE 0 END) OVER (PARTITION BY rider_id ORDER BY entry_at …)` — is 0 before the first deposit, 1 from the first deposit up to the second, and so on. Every row between two deposits carries the same cycle number, and a deposit opens its own cycle.",
      "",
      "Now a second window, partitioned by rider **and** cycle, sums only the collected amounts in time order: that is the cash after each entry. A deposit row adds 0 to an empty cycle, so its cash is 0, which is the reset. The rest is a group per rider: `MAX(cash)` (0 for a rider who only deposited), and a conditional count of collection rows whose cash is above 2,000 — exactly 2,000 (rider 32) is not a breach.",
      "",
      "The order must be by `entry_at`, not `entry_id` — the ids were not issued in time order. The correlated alternative finds, for each entry, the latest deposit at or before it and sums the collections after that deposit; it is quadratic in a rider's entries, where the two windows are one sort.",
    ].join("\n"),
  },

  {
    slug: "top-two-restaurants-per-cuisine-by-repeat-rate",
    title: "Top Two Restaurants per Cuisine by Repeat-Customer Rate",
    difficulty: "HARD",
    topics: ["Aggregation", "Window Functions", "Subqueries"],
    description: [
      "Loyalty is measured per restaurant on delivered orders: a **repeat customer** has placed at least 2 delivered orders there, and the **repeat rate** is repeat customers divided by distinct customers. Only restaurants with **at least 3 distinct customers** are ranked. Within each cuisine, the restaurants with the **two highest distinct repeat rates** are featured — restaurants with equal rates share a place, so more than two can be featured.",
      "",
      "Return `cuisine`, `name`, `customers`, `repeat_customers` and `repeat_rate_pct` (the rate as a percentage, rounded to 1 decimal place) for every featured restaurant. Rates are compared exactly, not rounded. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Restaurant",
        columns: [
          { name: "restaurant_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "cuisine", type: "varchar" },
        ],
        primaryKey: ["restaurant_id"],
        note: "One row per restaurant.",
      },
      {
        name: "Orders",
        columns: [
          { name: "order_id", type: "int" },
          { name: "restaurant_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "status", type: "enum", values: ["delivered", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "One row per order; `restaurant_id` is always in `Restaurant`.",
      },
    ],
    examples: [
      {
        Restaurant: [
          [1, "Biryani Bay", "Biryani"],
          [2, "Kebab Kothi", "Biryani"],
          [3, "Spice Route", "Biryani"],
          [4, "Curry Leaf", "Biryani"],
          [5, "Wok Express", "Chinese"],
        ],
        Orders: [
          [1, 1, 81, "delivered"], [2, 1, 81, "delivered"], [3, 1, 82, "delivered"], [4, 1, 83, "delivered"],
          [5, 2, 81, "delivered"], [6, 2, 82, "delivered"], [7, 2, 82, "delivered"], [8, 2, 84, "delivered"],
          [9, 3, 85, "delivered"], [10, 3, 86, "delivered"], [11, 3, 87, "delivered"], [12, 3, 87, "cancelled"],
          [13, 4, 81, "delivered"], [14, 4, 81, "delivered"],
          [15, 5, 82, "delivered"], [16, 5, 83, "delivered"], [17, 5, 84, "delivered"], [18, 5, 84, "delivered"], [19, 5, 85, "delivered"],
        ],
      },
    ],
    gen: (rng) => {
      const restaurants = sample(rng, RESTAURANTS, ri(rng, 2, 7)).map((name, i) => [i + 1, name, pick(rng, ["Biryani", "Chinese"])]);
      const rows: Cell[][] = [];
      let id = 1;
      for (const r of restaurants) {
        const regulars = sample(rng, seq(81, 10), ri(rng, 2, 5));
        const k = ri(rng, 2, 9);
        for (let j = 0; j < k; j++) rows.push([id++, r[0]!, pick(rng, regulars), chance(rng, 0.85) ? "delivered" : "cancelled"]);
      }
      return { Restaurant: restaurants, Orders: rows };
    },
    solution: [
      "WITH per_customer AS (",
      "  SELECT restaurant_id, customer_id, COUNT(*) AS n",
      "  FROM Orders",
      "  WHERE status = 'delivered'",
      "  GROUP BY restaurant_id, customer_id",
      "), per_restaurant AS (",
      "  SELECT restaurant_id, COUNT(*) AS customers,",
      "         SUM(CASE WHEN n >= 2 THEN 1 ELSE 0 END) AS repeat_customers",
      "  FROM per_customer",
      "  GROUP BY restaurant_id",
      "  HAVING COUNT(*) >= 3",
      "), ranked AS (",
      "  SELECT r.cuisine, r.name, p.customers, p.repeat_customers,",
      "         DENSE_RANK() OVER (PARTITION BY r.cuisine ORDER BY p.repeat_customers / p.customers DESC) AS place",
      "  FROM per_restaurant p",
      "  JOIN Restaurant r ON r.restaurant_id = p.restaurant_id",
      ")",
      "SELECT cuisine, name, customers, repeat_customers,",
      "       ROUND(100 * repeat_customers / customers, 1) AS repeat_rate_pct",
      "FROM ranked",
      "WHERE place <= 2",
    ].join("\n"),
    alternatives: [
      [
        "WITH stats AS (",
        "  SELECT o.restaurant_id, r.cuisine, r.name,",
        "         COUNT(DISTINCT o.customer_id) AS customers,",
        "         COUNT(DISTINCT CASE WHEN (SELECT COUNT(*) FROM Orders x WHERE x.restaurant_id = o.restaurant_id",
        "                                   AND x.customer_id = o.customer_id AND x.status = 'delivered') >= 2",
        "                             THEN o.customer_id END) AS repeat_customers",
        "  FROM Orders o JOIN Restaurant r ON r.restaurant_id = o.restaurant_id",
        "  WHERE o.status = 'delivered'",
        "  GROUP BY o.restaurant_id, r.cuisine, r.name",
        "  HAVING COUNT(DISTINCT o.customer_id) >= 3",
        ")",
        "SELECT s.cuisine, s.name, s.customers, s.repeat_customers, ROUND(100 * s.repeat_customers / s.customers, 1) AS repeat_rate_pct",
        "FROM stats s",
        "WHERE (SELECT COUNT(DISTINCT t.repeat_customers / t.customers) FROM stats t",
        "       WHERE t.cuisine = s.cuisine AND t.repeat_customers * s.customers > s.repeat_customers * t.customers) < 2",
      ].join("\n"),
    ],
    hints: [
      "Start with one row per (restaurant, customer) and that customer's delivered order count.",
      "From those rows, count customers and repeat customers per restaurant, and keep restaurants with at least 3 customers.",
      "\"Two highest distinct rates, ties share a place\" is DENSE_RANK within each cuisine.",
      "Cancelled orders count for nothing — not for the customer count, not for repeats.",
    ],
    editorial: [
      "The metric needs two levels of grouping, so build it in steps. First group delivered orders by restaurant and customer to get each customer's order count there — a cancelled order is filtered out before it can make anyone a customer or a repeat. Then group those rows by restaurant: `COUNT(*)` is distinct customers, `SUM(CASE WHEN n >= 2 …)` the repeat customers, and HAVING drops restaurants with fewer than three customers (Curry Leaf has one).",
      "",
      "Ranking restarts per cuisine and ties must share a place without using up the next one, which is `DENSE_RANK() OVER (PARTITION BY cuisine ORDER BY repeat_customers / customers DESC)`; keeping `place <= 2` features every restaurant on the two highest distinct rates. In the example Biryani Bay and Kebab Kothi tie at 1/3, so they share first place and Spice Route (0) is second. `RANK` would skip place 2 after the tie and drop it; `ROW_NUMBER` would break the tie arbitrarily.",
      "",
      "The order key is the exact ratio; only the output is rounded. The alternative counts, for each restaurant, how many distinct rates in its cuisine are strictly higher (comparing by cross-multiplication) and keeps it when fewer than two are — the correlated form of a dense rank, quadratic per cuisine.",
    ].join("\n"),
  },
];
