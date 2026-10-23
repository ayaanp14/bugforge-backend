import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { LAST_NAMES, addDays, chance, dateBetween, names, pick, ri, roundTo, sample } from "./kit.js";

/**
 * Company set — Airbnb. The questions an analyst or data engineer on a
 * home-sharing marketplace answers week to week: which listings fit a
 * campaign, which hosts clear a (simplified) Superhost bar, how fast hosts
 * answer guests, how search turns into bookings, how a calendar reads as open
 * stretches and rate periods, whether payouts match what hosts earned. The
 * schemas and every figure are invented for practice — none of it is
 * Airbnb's real data, schema or policy thresholds. Easiest first.
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

const STAY_CITIES = ["Lisbon", "Goa", "Kyoto", "Cape Town", "Barcelona", "Bali"] as const;
const POLICIES = ["flexible", "moderate", "firm", "strict"] as const;
const LISTING_TITLES = [
  "Sunny loft near the old town", "Beach hut with hammock", "Machiya townhouse", "Garden cottage",
  "Cliffside studio", "Rooftop flat with plunge pool", "Quiet room in a family home", "Treehouse in the paddy fields",
  "Canal-side apartment", "Converted barn", "Minimalist micro-studio", "Villa with sea view",
] as const;

export const COMPANY_AIRBNB: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "airbnb-instant-book-listings-for-a-last-minute-weekend",
    title: "Airbnb: Instant Book Listings for a Last-Minute Weekend",
    difficulty: "EASY",
    topics: ["Basics"],
    description: [
      "A growth marketer at Airbnb is building a \"last-minute weekend\" email: it may only feature homes a guest can book on the spot and leave without a heavy penalty.",
      "",
      "Return every listing that is **active**, has **Instant Book on** (`instant_book = 1`), uses the `flexible` or `moderate` cancellation policy, and accepts a stay of **two nights or fewer** (`min_nights` at most 2). Return the columns `listing_id`, `city` and `nightly_price`, ordered by `nightly_price` ascending, then `listing_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Listing",
        columns: [
          { name: "listing_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "nightly_price", type: "int" },
          { name: "min_nights", type: "int" },
          { name: "instant_book", type: "bool" },
          { name: "cancellation_policy", type: "enum", values: [...POLICIES] },
          { name: "status", type: "enum", values: ["active", "snoozed", "delisted"] },
        ],
        primaryKey: ["listing_id"],
        note: "One row per listing. `nightly_price` is the base price in US dollars; `min_nights` is the shortest stay the host accepts; a `snoozed` listing is temporarily hidden from search.",
      },
    ],
    examples: [
      {
        Listing: [
          [1, "Lisbon", 120, 2, 1, "flexible", "active"],
          [2, "Lisbon", 95, 3, 1, "flexible", "active"],
          [3, "Goa", 60, 1, 1, "moderate", "active"],
          [4, "Goa", 60, 1, 0, "flexible", "active"],
          [5, "Kyoto", 140, 1, 1, "strict", "active"],
          [6, "Kyoto", 85, 2, 1, "moderate", "snoozed"],
          [7, "Bali", 60, 2, 1, "flexible", "active"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 20);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        pick(rng, STAY_CITIES),
        chance(rng, 0.25) ? 60 : roundTo(rng, 40, 300, 5),
        chance(rng, 0.3) ? pick(rng, [2, 3]) : ri(rng, 1, 4),
        chance(rng, 0.7) ? 1 : 0,
        pick(rng, ["flexible", "flexible", "moderate", "moderate", "firm", "strict"]),
        pick(rng, ["active", "active", "active", "snoozed", "delisted"]),
      ]);
      return { Listing: rows };
    },
    solution: [
      "SELECT listing_id, city, nightly_price",
      "FROM Listing",
      "WHERE status = 'active'",
      "  AND instant_book = 1",
      "  AND cancellation_policy IN ('flexible', 'moderate')",
      "  AND min_nights <= 2",
      "ORDER BY nightly_price, listing_id",
    ].join("\n"),
    alternatives: [
      "SELECT listing_id, city, nightly_price FROM Listing WHERE status = 'active' AND instant_book <> 0 AND cancellation_policy NOT IN ('firm', 'strict') AND min_nights < 3 ORDER BY nightly_price ASC, listing_id ASC",
    ],
    ordered: true,
    hints: [
      "Every condition must hold at once, so join them with AND.",
      "\"Flexible or moderate\" is one condition on one column — `IN` lists both values.",
      "\"Two nights or fewer\" includes exactly two. Two listings can share a price, so the order needs a second key.",
    ],
    editorial: [
      "This is a filter on one table: each listing either belongs in the email or it does not. Four conditions must all be true, so they sit together in `WHERE` joined by `AND` — the listing is `active` (a snoozed or delisted home cannot be booked), Instant Book is on, the cancellation policy is one of the two lenient ones, and the minimum stay is at most two nights.",
      "",
      "Two details decide the boundary rows. `min_nights <= 2` keeps a listing whose minimum is exactly two, which a strict `<` would lose; and `IN ('flexible', 'moderate')` is shorter and safer than two `OR`ed equalities, which would need brackets to sit correctly beside the `AND`s.",
      "",
      "The statement fixes the order, and several listings can share a price, so `ORDER BY nightly_price, listing_id` breaks the ties by id. The alternative spells the same sets the other way round — `NOT IN ('firm', 'strict')` and `min_nights < 3` — which only works because the enum has exactly four values and the column is never NULL. The query is one scan of the table.",
    ].join("\n"),
  },

  {
    slug: "airbnb-hosts-with-no-active-listing",
    title: "Airbnb: Hosts With No Active Listing",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "The host success team at Airbnb wants to call hosts who have nothing bookable right now, to help them get a home back into search.",
      "",
      "Return every host who has **no listing with status `active`** — that includes hosts whose listings are all snoozed or delisted, and hosts who never created a listing. Return the columns `host_id` and `host_name`, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Host",
        columns: [
          { name: "host_id", type: "int" },
          { name: "host_name", type: "varchar" },
          { name: "joined_on", type: "date" },
        ],
        primaryKey: ["host_id"],
        note: "One row per host account.",
      },
      {
        name: "Listing",
        columns: [
          { name: "listing_id", type: "int" },
          { name: "host_id", type: "int" },
          { name: "status", type: "enum", values: ["active", "snoozed", "delisted"] },
        ],
        primaryKey: ["listing_id"],
        note: "`host_id` always names a row of `Host`; a host can have any number of listings.",
      },
    ],
    examples: [
      {
        Host: [
          [1, "Aarav", "2021-04-12"],
          [2, "Meera", "2022-07-01"],
          [3, "Kabir", "2023-01-19"],
          [4, "Sara", "2023-09-30"],
          [5, "Liam", "2024-02-14"],
        ],
        Listing: [
          [10, 1, "active"],
          [11, 1, "snoozed"],
          [12, 2, "snoozed"],
          [13, 2, "delisted"],
          [14, 3, "active"],
          [15, 5, "delisted"],
        ],
      },
    ],
    gen: (rng) => {
      const h = ri(rng, 1, 8);
      const who = names(rng, h);
      const hosts: Cell[][] = seq(1, h).map((id, i) => [id, who[i]!, dateBetween(rng, "2019-01-01", "2024-12-31")]);
      const n = chance(rng, 0.08) ? 0 : ri(rng, 1, 16);
      const listings: Cell[][] = seq(100, n).map((id) => [id, ri(rng, 1, h), pick(rng, ["active", "active", "snoozed", "delisted"])]);
      return { Host: hosts, Listing: listings };
    },
    solution: [
      "SELECT h.host_id, h.host_name",
      "FROM Host h",
      "WHERE NOT EXISTS (",
      "  SELECT 1 FROM Listing l",
      "  WHERE l.host_id = h.host_id AND l.status = 'active'",
      ")",
    ].join("\n"),
    alternatives: [
      "SELECT h.host_id, h.host_name FROM Host h LEFT JOIN Listing l ON l.host_id = h.host_id AND l.status = 'active' WHERE l.listing_id IS NULL",
      "SELECT host_id, host_name FROM Host WHERE host_id NOT IN (SELECT host_id FROM Listing WHERE status = 'active')",
    ],
    hints: [
      "You are looking for hosts for whom a certain kind of row does *not* exist.",
      "`NOT EXISTS` with a subquery on `Listing` matched by `host_id` asks exactly that.",
      "If you use a LEFT JOIN instead, put the status test in the `ON` clause, not in `WHERE` — otherwise hosts with only snoozed listings are lost.",
    ],
    editorial: [
      "This is an **anti join**: keep the hosts for whom no active listing exists. `NOT EXISTS` states it directly — for each host the subquery looks for an `active` listing with that `host_id`, and the host survives only when it finds none. Hosts with no listings at all pass trivially, because the subquery has nothing to find.",
      "",
      "The LEFT JOIN version is the classic trap. The join must carry `l.status = 'active'` in its `ON` clause, so every host keeps one row whose listing columns are NULL when no active listing matched; `WHERE l.listing_id IS NULL` then keeps exactly those. Moving the status test into `WHERE` would throw away the NULL rows and return nobody.",
      "",
      "`NOT IN` works here as well, because `Listing.host_id` is never NULL — a single NULL in a `NOT IN` list makes every comparison unknown and empties the answer, which is why `NOT EXISTS` is the safer habit. All three run as one pass with an index on `Listing(host_id)`.",
    ].join("\n"),
  },

  {
    slug: "airbnb-average-cleaning-fee-by-property-type",
    title: "Airbnb: Average Cleaning Fee by Property Type",
    difficulty: "EASY",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "A pricing analyst at Airbnb is comparing how much hosts add for cleaning across kinds of space. A host who charges no cleaning fee is stored with `cleaning_fee` NULL — for this report that listing **charges 0**, and it must pull the average down.",
      "",
      "For every property type that has at least one listing, return `property_type`, `listings` (how many listings it has) and `avg_cleaning_fee` — the average fee with NULL counted as 0, rounded to 2 decimal places. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Listing",
        columns: [
          { name: "listing_id", type: "int" },
          { name: "property_type", type: "enum", values: ["entire_home", "private_room", "shared_room", "hotel_room"] },
          { name: "nightly_price", type: "int" },
          { name: "cleaning_fee", type: "int" },
        ],
        primaryKey: ["listing_id"],
        note: "Prices in US dollars. `cleaning_fee` is a one-off charge per stay, NULL when the host charges none.",
      },
    ],
    examples: [
      {
        Listing: [
          [1, "entire_home", 180, 60],
          [2, "entire_home", 140, null],
          [3, "entire_home", 220, 75],
          [4, "private_room", 55, 15],
          [5, "private_room", 48, 20],
          [6, "shared_room", 25, null],
          [7, "private_room", 60, 15],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 18);
      const types = ["entire_home", "private_room", "shared_room", "hotel_room"] as const;
      const rows: Cell[][] = seq(1, n).map((id) => {
        const t = pick(rng, types);
        const fee = t === "entire_home" ? roundTo(rng, 30, 120, 5) : roundTo(rng, 5, 40, 5);
        return [id, t, roundTo(rng, 20, 300, 5), chance(rng, 0.3) ? null : fee];
      });
      return { Listing: rows };
    },
    solution: [
      "SELECT property_type,",
      "       COUNT(*) AS listings,",
      "       ROUND(AVG(COALESCE(cleaning_fee, 0)), 2) AS avg_cleaning_fee",
      "FROM Listing",
      "GROUP BY property_type",
    ].join("\n"),
    alternatives: [
      "SELECT property_type, COUNT(listing_id) AS listings, ROUND(SUM(IFNULL(cleaning_fee, 0)) / COUNT(*), 2) AS avg_cleaning_fee FROM Listing GROUP BY property_type",
      "SELECT property_type, COUNT(*) AS listings, ROUND(AVG(CASE WHEN cleaning_fee IS NULL THEN 0 ELSE cleaning_fee END), 2) AS avg_cleaning_fee FROM Listing GROUP BY property_type",
    ],
    hints: [
      "One row per property type means GROUP BY that column.",
      "`AVG(cleaning_fee)` skips NULLs entirely — the listing would vanish from both the sum and the count.",
      "Turn NULL into 0 before averaging, with `COALESCE` or `IFNULL`.",
    ],
    editorial: [
      "Grouping by `property_type` gives one row per kind of space, and `COUNT(*)` counts its listings. The only subtlety is the average.",
      "",
      "Aggregate functions ignore NULL. `AVG(cleaning_fee)` over fees 60, NULL and 75 is 67.5 — the NULL listing is dropped from the count as well as the sum, so the average describes only the hosts who charge a fee. The report wants every listing in the denominator, with \"no fee\" as a fee of 0, so the value is wrapped in `COALESCE(cleaning_fee, 0)` first; the same three listings then average 45.",
      "",
      "Equivalent spellings: `SUM(IFNULL(cleaning_fee, 0)) / COUNT(*)` (note `COUNT(*)`, not `COUNT(cleaning_fee)`, which would skip NULLs again) or a `CASE` that maps NULL to 0. Types with no listing never form a group, so they are absent as the statement asks. One scan, one group per type.",
    ].join("\n"),
  },

  {
    slug: "airbnb-reviews-where-cleanliness-trails-the-overall-rating",
    title: "Airbnb: Reviews Where Cleanliness Trails the Overall Rating",
    difficulty: "EASY",
    topics: ["Basics"],
    description: [
      "Guests on Airbnb give an overall star rating plus category ratings such as cleanliness. The quality team wants reviews where the stay was liked overall but the cleaning clearly was not, to pass on to the hosts' cleaning partners.",
      "",
      "Return every review whose `cleanliness` rating is **at least 2 stars below** its `overall` rating. A review whose guest skipped the cleanliness question (`cleanliness` NULL) is never returned. Return `review_id`, `listing_id` and `gap` (overall minus cleanliness), ordered by `gap` descending, then `review_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Review",
        columns: [
          { name: "review_id", type: "int" },
          { name: "listing_id", type: "int" },
          { name: "overall", type: "int" },
          { name: "cleanliness", type: "int" },
          { name: "submitted_on", type: "date" },
        ],
        primaryKey: ["review_id"],
        note: "Ratings are whole stars from 1 to 5. `cleanliness` is NULL when the guest did not answer that question.",
      },
    ],
    examples: [
      {
        Review: [
          [1, 10, 5, 5, "2025-03-02"],
          [2, 10, 5, 3, "2025-03-04"],
          [3, 11, 4, 3, "2025-03-05"],
          [4, 12, 5, null, "2025-03-05"],
          [5, 12, 5, 1, "2025-03-09"],
          [6, 13, 4, 2, "2025-03-11"],
          [7, 13, 2, 4, "2025-03-12"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 20);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const overall = pick(rng, [3, 4, 4, 5, 5, 5]);
        const clean = chance(rng, 0.15) ? null : Math.max(1, Math.min(5, overall - pick(rng, [-1, 0, 0, 1, 1, 2, 2, 3])));
        return [id, ri(rng, 10, 16), overall, clean, dateBetween(rng, "2025-03-01", "2025-03-31")];
      });
      return { Review: rows };
    },
    solution: [
      "SELECT review_id, listing_id, overall - cleanliness AS gap",
      "FROM Review",
      "WHERE overall - cleanliness >= 2",
      "ORDER BY gap DESC, review_id",
    ].join("\n"),
    alternatives: [
      "SELECT review_id, listing_id, overall - cleanliness AS gap FROM Review WHERE cleanliness IS NOT NULL AND cleanliness <= overall - 2 ORDER BY overall - cleanliness DESC, review_id ASC",
    ],
    ordered: true,
    hints: [
      "The gap is plain arithmetic on two columns of the same row.",
      "\"At least 2 below\" includes a gap of exactly 2.",
      "What does `5 - NULL` evaluate to, and does a NULL comparison keep a row?",
    ],
    editorial: [
      "Each review is judged on its own row, so no grouping or join is needed: compute `overall - cleanliness`, keep the rows where it is at least 2, and select it under the name `gap`.",
      "",
      "The skipped question takes care of itself. Arithmetic with NULL yields NULL, and `NULL >= 2` is unknown, which `WHERE` treats as false — so a review with no cleanliness rating drops out without an explicit `IS NOT NULL` (the alternative writes it anyway, which does no harm and documents the intent). A review where cleanliness is *higher* than overall gives a negative gap and is excluded, as it should be.",
      "",
      "The order is fixed by the statement: biggest gap first, then `review_id` to break ties between equal gaps. MySQL lets `ORDER BY` use the select alias `gap`; the alternative repeats the expression instead. The query is a single scan.",
    ].join("\n"),
  },

  {
    slug: "airbnb-experience-bookings-and-guests-per-category",
    title: "Airbnb: Experience Bookings and Guests per Category",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "Besides homes, Airbnb sells Experiences — cooking classes, hikes, studio visits — led by local hosts. The Experiences team wants to know which categories guests actually turn up for.",
      "",
      "For every category with at least one booking that was **not cancelled**, return `category`, `bookings` (the number of non-cancelled bookings) and `guests` (the total `guests` on them). Categories whose bookings were all cancelled, or that have none, do not appear. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Experience",
        columns: [
          { name: "experience_id", type: "int" },
          { name: "title", type: "varchar" },
          { name: "category", type: "enum", values: ["food", "nature", "art", "sports", "wellness"] },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["experience_id"],
        note: "One row per Experience a host offers.",
      },
      {
        name: "ExperienceBooking",
        columns: [
          { name: "booking_id", type: "int" },
          { name: "experience_id", type: "int" },
          { name: "guests", type: "int" },
          { name: "status", type: "enum", values: ["confirmed", "attended", "cancelled"] },
        ],
        primaryKey: ["booking_id"],
        note: "One booking can bring several guests. `experience_id` always names an Experience.",
      },
    ],
    examples: [
      {
        Experience: [
          [1, "Pastel de nata workshop", "food", "Lisbon"],
          [2, "Sunrise volcano hike", "nature", "Bali"],
          [3, "Tea ceremony", "art", "Kyoto"],
          [4, "Spice farm lunch", "food", "Goa"],
          [5, "Sunset surf lesson", "sports", "Bali"],
        ],
        ExperienceBooking: [
          [101, 1, 2, "attended"],
          [102, 1, 4, "confirmed"],
          [103, 4, 1, "attended"],
          [104, 2, 3, "attended"],
          [105, 2, 2, "cancelled"],
          [106, 3, 2, "cancelled"],
        ],
      },
    ],
    gen: (rng) => {
      const e = ri(rng, 1, 7);
      const exps: Cell[][] = seq(1, e).map((id) => [id, `Experience ${id}`, pick(rng, ["food", "nature", "art", "sports", "wellness"]), pick(rng, STAY_CITIES)]);
      const n = chance(rng, 0.06) ? 0 : ri(rng, 1, 18);
      const rows: Cell[][] = seq(101, n).map((id) => [id, ri(rng, 1, e), ri(rng, 1, 6), pick(rng, ["confirmed", "attended", "attended", "cancelled"])]);
      return { Experience: exps, ExperienceBooking: rows };
    },
    solution: [
      "SELECT e.category, COUNT(*) AS bookings, SUM(b.guests) AS guests",
      "FROM Experience e",
      "JOIN ExperienceBooking b ON b.experience_id = e.experience_id",
      "WHERE b.status <> 'cancelled'",
      "GROUP BY e.category",
    ].join("\n"),
    alternatives: [
      [
        "SELECT e.category, SUM(t.n) AS bookings, SUM(t.g) AS guests",
        "FROM Experience e",
        "JOIN (SELECT experience_id, COUNT(*) AS n, SUM(guests) AS g FROM ExperienceBooking",
        "      WHERE status IN ('confirmed', 'attended') GROUP BY experience_id) t ON t.experience_id = e.experience_id",
        "GROUP BY e.category",
      ].join("\n"),
    ],
    hints: [
      "The category lives on `Experience`, the guests on `ExperienceBooking` — join them.",
      "Filter out cancelled bookings before you group.",
      "Count bookings with `COUNT(*)` and add guests with `SUM(guests)` — they are different numbers.",
    ],
    editorial: [
      "The booking rows hold the numbers and the Experience rows hold the category, so the query joins them on `experience_id`, drops cancelled bookings in `WHERE`, and groups by `category`. Inside each group `COUNT(*)` is the number of bookings and `SUM(guests)` the people they bring — a booking for four is one booking but four guests.",
      "",
      "Filtering before grouping is what makes the exclusions right. A category whose bookings were all cancelled loses every row in `WHERE` and never forms a group; a category with no bookings has no join partner at all. Neither appears, exactly as asked — a `HAVING` is not needed.",
      "",
      "The alternative pre-aggregates the bookings per Experience in a derived table and then adds those subtotals per category. It returns the same numbers and is the shape to reach for when the detail table is large, because it groups the big table once by its own key before joining. Both are linear with an index on `experience_id`.",
    ].join("\n"),
  },

  {
    slug: "airbnb-friday-and-saturday-check-ins-per-city",
    title: "Airbnb: Friday and Saturday Check-Ins per City",
    difficulty: "EASY",
    topics: ["Dates", "Conditional Logic", "Aggregation"],
    description: [
      "Airbnb's local operations team schedules check-in support by day of the week, and wants to know how weekend-heavy each city is.",
      "",
      "Considering only reservations that were **not cancelled**, return for every city `city`, `check_ins` (its number of such reservations) and `weekend_check_ins` (how many of them check in on a **Friday or a Saturday**). Cities with no non-cancelled reservation do not appear. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Reservation",
        columns: [
          { name: "reservation_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "check_in", type: "date" },
          { name: "nights", type: "int" },
          { name: "status", type: "enum", values: ["confirmed", "completed", "cancelled"] },
        ],
        primaryKey: ["reservation_id"],
        note: "One row per reservation; `city` is the listing's city.",
      },
    ],
    examples: [
      {
        Reservation: [
          [1, "Lisbon", "2025-05-02", 2, "completed"],
          [2, "Lisbon", "2025-05-03", 1, "completed"],
          [3, "Lisbon", "2025-05-04", 3, "confirmed"],
          [4, "Kyoto", "2025-05-09", 4, "cancelled"],
          [5, "Kyoto", "2025-05-08", 2, "confirmed"],
          [6, "Goa", "2025-05-10", 5, "cancelled"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 20);
      const cities = sample(rng, STAY_CITIES, ri(rng, 1, 4));
      const rows: Cell[][] = seq(1, n).map((id) => [id, pick(rng, cities), dateBetween(rng, "2025-05-01", "2025-06-15"), ri(rng, 1, 7), pick(rng, ["confirmed", "completed", "completed", "cancelled"])]);
      return { Reservation: rows };
    },
    solution: [
      "SELECT city,",
      "       COUNT(*) AS check_ins,",
      "       SUM(CASE WHEN DAYOFWEEK(check_in) IN (6, 7) THEN 1 ELSE 0 END) AS weekend_check_ins",
      "FROM Reservation",
      "WHERE status <> 'cancelled'",
      "GROUP BY city",
    ].join("\n"),
    alternatives: [
      "SELECT city, COUNT(*) AS check_ins, SUM(WEEKDAY(check_in) IN (4, 5)) AS weekend_check_ins FROM Reservation WHERE status IN ('confirmed', 'completed') GROUP BY city",
      "SELECT city, COUNT(*) AS check_ins, COUNT(CASE WHEN DAYNAME(check_in) IN ('Friday', 'Saturday') THEN 1 END) AS weekend_check_ins FROM Reservation WHERE status <> 'cancelled' GROUP BY city",
    ],
    hints: [
      "`DAYOFWEEK` numbers Sunday as 1 and Saturday as 7.",
      "Counting a subset inside a group is `SUM(CASE WHEN … THEN 1 ELSE 0 END)`.",
      "Drop the cancelled reservations in `WHERE` so they count in neither column.",
    ],
    editorial: [
      "This is **conditional aggregation**: one group per city, two counts per group. `COUNT(*)` counts every non-cancelled reservation; the weekend count adds 1 for each row whose check-in falls on a Friday or Saturday and 0 otherwise.",
      "",
      "The day test is where people slip. MySQL's `DAYOFWEEK` runs Sunday = 1 … Saturday = 7, so Friday and Saturday are 6 and 7. `WEEKDAY` runs Monday = 0 … Sunday = 6, so the same days are 4 and 5 — one alternative uses that, summing the boolean directly since MySQL treats a true comparison as 1. `DAYNAME` gives the English name, which reads most clearly. Mixing up the two numbering schemes is the usual bug.",
      "",
      "Cancelled reservations are removed before grouping, so they affect neither count, and a city left with nothing never forms a group. A city with check-ins but none at the weekend still appears, with `weekend_check_ins` 0 — the `ELSE 0` guarantees a number rather than NULL. One scan of the table.",
    ].join("\n"),
  },

  {
    slug: "airbnb-host-payout-for-each-completed-stay",
    title: "Airbnb: Host Payout for Each Completed Stay",
    difficulty: "EASY",
    topics: ["Basics", "Conditional Logic"],
    description: [
      "A finance analyst at Airbnb is checking the payout figures shown to hosts. In this simplified model a host's **gross** for a stay is `nights × nightly_price` plus the cleaning fee (a NULL `cleaning_fee` means none, so 0), and the host receives the gross **minus a 3% host service fee**.",
      "",
      "For every reservation with status `completed`, return `reservation_id`, `gross` and `payout` (gross × 0.97, rounded to 2 decimal places). Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Reservation",
        columns: [
          { name: "reservation_id", type: "int" },
          { name: "listing_id", type: "int" },
          { name: "nights", type: "int" },
          { name: "nightly_price", type: "int" },
          { name: "cleaning_fee", type: "int" },
          { name: "status", type: "enum", values: ["upcoming", "completed", "cancelled"] },
        ],
        primaryKey: ["reservation_id"],
        note: "Amounts in US dollars. `cleaning_fee` is NULL when the listing charges none.",
      },
    ],
    examples: [
      {
        Reservation: [
          [1, 10, 3, 120, 45, "completed"],
          [2, 10, 2, 120, 45, "cancelled"],
          [3, 11, 5, 85, null, "completed"],
          [4, 12, 1, 210, 60, "upcoming"],
          [5, 12, 7, 199, 60, "completed"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 18);
      const rows: Cell[][] = seq(1, n).map((id) => [id, ri(rng, 10, 15), ri(rng, 1, 10), ri(rng, 35, 320), chance(rng, 0.3) ? null : roundTo(rng, 10, 90, 5), pick(rng, ["upcoming", "completed", "completed", "cancelled"])]);
      return { Reservation: rows };
    },
    solution: [
      "SELECT reservation_id,",
      "       nights * nightly_price + COALESCE(cleaning_fee, 0) AS gross,",
      "       ROUND((nights * nightly_price + COALESCE(cleaning_fee, 0)) * 0.97, 2) AS payout",
      "FROM Reservation",
      "WHERE status = 'completed'",
    ].join("\n"),
    alternatives: [
      [
        "SELECT reservation_id, gross, ROUND(gross - gross * 3 / 100, 2) AS payout",
        "FROM (SELECT reservation_id, status, nights * nightly_price + IFNULL(cleaning_fee, 0) AS gross FROM Reservation) t",
        "WHERE status = 'completed'",
      ].join("\n"),
    ],
    hints: [
      "Write the gross first; the payout is the same expression times 0.97.",
      "`3 * 120 + NULL` is NULL — a missing cleaning fee needs `COALESCE`.",
      "A derived table lets you name `gross` once and reuse it.",
    ],
    editorial: [
      "Each row is computed on its own: the gross is `nights * nightly_price` plus the cleaning fee, and the payout takes 3% off it. The filter keeps only completed stays — an upcoming stay has not paid out yet and a cancelled one is not a stay.",
      "",
      "The NULL fee is the trap. Arithmetic with NULL gives NULL, so a listing without a cleaning fee would show no gross and no payout at all. `COALESCE(cleaning_fee, 0)` (or `IFNULL`) substitutes 0 before adding.",
      "",
      "MySQL cannot reuse a select alias inside the same `SELECT`, so the solution repeats the gross expression in the payout. The alternative computes `gross` once in a derived table and takes 3% off it in the outer query, which is easier to read when the expression is long. Multiplying a whole dollar figure by 0.97 gives at most two decimals, so the rounding never sits on a half cent. One scan of the table.",
    ].join("\n"),
  },

  {
    slug: "airbnb-host-display-names-with-a-last-initial",
    title: "Airbnb: Host Display Names With a Last Initial",
    difficulty: "EASY",
    topics: ["Strings", "Conditional Logic"],
    description: [
      "For privacy, a listing page shows the host by first name and last initial only. The profile team is backfilling that display name for every host account.",
      "",
      "Return `host_id` and `display_name`: the first name, a space, the **first letter of the last name** and a full stop — `Meera I.` for Meera Iyer. A host with no last name on file (`last_name` NULL) is shown by first name alone. Return the rows ordered by `host_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Host",
        columns: [
          { name: "host_id", type: "int" },
          { name: "first_name", type: "varchar" },
          { name: "last_name", type: "varchar" },
        ],
        primaryKey: ["host_id"],
        note: "`first_name` is never NULL; `last_name` may be NULL but is never an empty string.",
      },
    ],
    examples: [
      {
        Host: [
          [1, "Meera", "Iyer"],
          [2, "John", null],
          [3, "Aarav", "Sharma"],
          [4, "Emma", "Bose"],
          [5, "Zara", null],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const who = names(rng, n);
      const rows: Cell[][] = seq(1, n).map((id, i) => [id, who[i]!, chance(rng, 0.25) ? null : pick(rng, LAST_NAMES)]);
      return { Host: rows };
    },
    solution: [
      "SELECT host_id,",
      "       CASE WHEN last_name IS NULL THEN first_name",
      "            ELSE CONCAT(first_name, ' ', LEFT(last_name, 1), '.') END AS display_name",
      "FROM Host",
      "ORDER BY host_id",
    ].join("\n"),
    alternatives: [
      "SELECT host_id, CONCAT_WS(' ', first_name, CONCAT(SUBSTRING(last_name, 1, 1), '.')) AS display_name FROM Host ORDER BY host_id",
      "SELECT host_id, COALESCE(CONCAT(first_name, ' ', LEFT(last_name, 1), '.'), first_name) AS display_name FROM Host ORDER BY host_id",
    ],
    ordered: true,
    hints: [
      "`LEFT(s, 1)` or `SUBSTRING(s, 1, 1)` gives the first character.",
      "In MySQL, `CONCAT` returns NULL as soon as any argument is NULL.",
      "Either branch on `last_name IS NULL`, or fall back with `COALESCE`.",
    ],
    editorial: [
      "The display name is built from three pieces: the first name, a space, and the last name's first letter followed by a full stop. `LEFT(last_name, 1)` takes the letter and `CONCAT` glues the pieces together.",
      "",
      "The NULL last name decides the shape of the query. MySQL's `CONCAT` returns NULL if any argument is NULL, so the plain expression would give hosts without a last name no display name at all. The solution branches with `CASE`; one alternative lets the NULL happen and catches it with `COALESCE(…, first_name)`.",
      "",
      "The neatest alternative uses `CONCAT_WS`, which joins its arguments with a separator and **skips NULL arguments** — the inner `CONCAT(…, '.')` is NULL when there is no last name, so `CONCAT_WS` returns just the first name with no stray space. The order is fixed by `host_id`. One scan of the table.",
    ].join("\n"),
  },

  // ──────────────────────────── MEDIUM ────────────────────────────
  {
    slug: "airbnb-hosts-meeting-a-simplified-superhost-bar",
    title: "Airbnb: Hosts Meeting a Simplified Superhost Bar",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Conditional Logic", "Joins"],
    description: [
      "Airbnb reviews hosts every quarter for Superhost status. A host-quality analyst wants a first cut using a **simplified bar** (the thresholds here are made up for practice) over the quarter's reservations:",
      "",
      "- at least **3 completed** stays;",
      "- **no** reservation cancelled by the host;",
      "- at least one review, and an **average review rating of at least 4.8** across the host's reviews.",
      "",
      "Return `host_id`, `completed_stays` and `avg_rating` (rounded to 2 decimal places) for every host who meets all three, in any order. Guest cancellations do not count against a host.",
    ].join("\n"),
    tables: [
      {
        name: "Reservation",
        columns: [
          { name: "reservation_id", type: "int" },
          { name: "host_id", type: "int" },
          { name: "status", type: "enum", values: ["completed", "cancelled_by_guest", "cancelled_by_host"] },
        ],
        primaryKey: ["reservation_id"],
        note: "Every reservation that ended in the quarter.",
      },
      {
        name: "Review",
        columns: [
          { name: "review_id", type: "int" },
          { name: "reservation_id", type: "int" },
          { name: "rating", type: "int" },
        ],
        primaryKey: ["review_id"],
        note: "A guest's review of a completed stay, 1 to 5 stars. A reservation has at most one review.",
      },
    ],
    examples: [
      {
        Reservation: [
          [1, 1, "completed"], [2, 1, "completed"], [3, 1, "completed"], [4, 1, "cancelled_by_guest"],
          [14, 5, "completed"], [15, 5, "completed"], [16, 5, "completed"], [17, 5, "completed"], [18, 5, "completed"],
          [5, 2, "completed"], [6, 2, "completed"], [7, 2, "completed"], [8, 2, "cancelled_by_host"],
          [9, 3, "completed"], [10, 3, "completed"], [11, 3, "completed"],
          [12, 4, "completed"], [13, 4, "completed"],
        ],
        Review: [
          [101, 1, 5], [102, 2, 5], [103, 3, 5],
          [111, 14, 5], [112, 15, 5], [113, 16, 4], [114, 17, 5], [115, 18, 5],
          [104, 5, 5], [105, 6, 5],
          [106, 9, 5], [107, 10, 4], [108, 11, 4],
          [109, 12, 5], [110, 13, 5],
        ],
      },
    ],
    gen: (rng) => {
      const h = ri(rng, 2, 7);
      const res: Cell[][] = [];
      const rev: Cell[][] = [];
      let rid = 1;
      let vid = 101;
      for (let host = 1; host <= h; host++) {
        const good = chance(rng, 0.5);
        const k = good ? ri(rng, 3, 6) : ri(rng, 0, 6);
        for (let i = 0; i < k; i++) {
          const status = good
            ? (chance(rng, 0.06) ? "cancelled_by_host" : chance(rng, 0.15) ? "cancelled_by_guest" : "completed")
            : pick(rng, ["completed", "completed", "cancelled_by_guest", "cancelled_by_host"]);
          res.push([rid, host, status]);
          if (status === "completed" && chance(rng, 0.85)) rev.push([vid++, rid, good ? (chance(rng, 0.92) ? 5 : 4) : ri(rng, 3, 5)]);
          rid++;
        }
      }
      return { Reservation: res, Review: rev };
    },
    solution: [
      "WITH stays AS (",
      "  SELECT host_id,",
      "         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_stays,",
      "         SUM(CASE WHEN status = 'cancelled_by_host' THEN 1 ELSE 0 END) AS host_cancels",
      "  FROM Reservation",
      "  GROUP BY host_id",
      "), ratings AS (",
      "  SELECT r.host_id, AVG(v.rating) AS avg_rating",
      "  FROM Review v",
      "  JOIN Reservation r ON r.reservation_id = v.reservation_id",
      "  GROUP BY r.host_id",
      ")",
      "SELECT s.host_id, s.completed_stays, ROUND(g.avg_rating, 2) AS avg_rating",
      "FROM stays s",
      "JOIN ratings g ON g.host_id = s.host_id",
      "WHERE s.completed_stays >= 3 AND s.host_cancels = 0 AND g.avg_rating >= 4.8",
    ].join("\n"),
    alternatives: [
      [
        "SELECT r.host_id,",
        "       COUNT(DISTINCT CASE WHEN r.status = 'completed' THEN r.reservation_id END) AS completed_stays,",
        "       ROUND(AVG(v.rating), 2) AS avg_rating",
        "FROM Reservation r",
        "LEFT JOIN Review v ON v.reservation_id = r.reservation_id",
        "GROUP BY r.host_id",
        "HAVING COUNT(DISTINCT CASE WHEN r.status = 'completed' THEN r.reservation_id END) >= 3",
        "   AND SUM(r.status = 'cancelled_by_host') = 0",
        "   AND AVG(v.rating) >= 4.8",
      ].join("\n"),
    ],
    hints: [
      "Two of the conditions are counts over reservations, one is an average over reviews.",
      "Count one status inside a group with `SUM(CASE WHEN status = … THEN 1 ELSE 0 END)`.",
      "Reviews reach a host through their reservation — join `Review` to `Reservation`.",
      "A host with no reviews has an average of NULL, and `NULL >= 4.8` is not true.",
    ],
    editorial: [
      "The bar mixes two grains. Completed stays and host cancellations are counts over a host's **reservations**; the rating is an average over the host's **reviews**, which reach the host only through their reservation. The solution computes each in its own CTE, one row per host, and joins them.",
      "",
      "In `stays`, conditional sums count each status: `completed_stays` and `host_cancels`. In `ratings`, each review is joined to its reservation and averaged per host. The final `WHERE` applies the three rules. The inner join to `ratings` already drops hosts with no reviews; even with a left join, `NULL >= 4.8` would drop them. Guest cancellations appear in neither count, so they cost the host nothing.",
      "",
      "The alternative does it in one pass: reservations `LEFT JOIN` reviews, then `HAVING`. That works because a reservation has at most one review, so the join cannot duplicate reservations — and `COUNT(DISTINCT …)` guards the stay count anyway. With several reviews per reservation the one-pass form would inflate the cancellation sum, which is why separate aggregates are the safer default. Each table is read once.",
    ].join("\n"),
  },

  {
    slug: "airbnb-host-response-rate-within-24-hours",
    title: "Airbnb: Host Response Rate Within 24 Hours",
    difficulty: "MEDIUM",
    topics: ["Dates", "Aggregation", "Conditional Logic"],
    description: [
      "Guests on Airbnb often message a host before booking, and a quick answer wins the booking. The host-quality team tracks how many of those inquiries each host answers **within 24 hours**.",
      "",
      "An inquiry counts as answered in time when `first_reply_at` is set and is **at most 24 hours (1,440 minutes)** after `sent_at`; exactly 24 hours still counts. An inquiry never answered (`first_reply_at` NULL) counts as not answered. For every host with at least one inquiry, return `host_id`, `inquiries`, `answered_in_24h` and `response_rate` — the percentage answered in time, rounded to 2 decimal places. Order by `response_rate` descending, then `host_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Inquiry",
        columns: [
          { name: "inquiry_id", type: "int" },
          { name: "host_id", type: "int" },
          { name: "guest_id", type: "int" },
          { name: "sent_at", type: "datetime" },
          { name: "first_reply_at", type: "datetime" },
        ],
        primaryKey: ["inquiry_id"],
        note: "One row per guest message thread opened with a host. `first_reply_at` is the host's first answer, NULL if there is none.",
      },
    ],
    examples: [
      {
        Inquiry: [
          [1, 7, 101, "2025-03-01 09:00:00", "2025-03-01 09:40:00"],
          [2, 7, 102, "2025-03-02 22:15:00", "2025-03-03 22:15:00"],
          [3, 7, 103, "2025-03-04 08:00:00", "2025-03-05 08:01:00"],
          [4, 8, 104, "2025-03-01 12:00:00", null],
          [5, 8, 105, "2025-03-06 18:30:00", "2025-03-06 19:00:00"],
          [6, 9, 106, "2025-03-07 07:45:00", "2025-03-07 10:00:00"],
          [7, 9, 107, "2025-03-09 23:50:00", "2025-03-10 06:10:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 20);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const sentMin = ri(rng, 0, 1439);
        const day = dateBetween(rng, "2025-03-01", "2025-03-25");
        const delay = chance(rng, 0.2) ? null : chance(rng, 0.15) ? pick(rng, [1440, 1441, 1439]) : ri(rng, 3, 3000);
        return [id, ri(rng, 1, 6), ri(rng, 100, 140), at(day, sentMin), delay === null ? null : at(day, sentMin + delay)];
      });
      return { Inquiry: rows };
    },
    solution: [
      "SELECT host_id,",
      "       COUNT(*) AS inquiries,",
      "       SUM(CASE WHEN TIMESTAMPDIFF(MINUTE, sent_at, first_reply_at) <= 1440 THEN 1 ELSE 0 END) AS answered_in_24h,",
      "       ROUND(100 * SUM(CASE WHEN TIMESTAMPDIFF(MINUTE, sent_at, first_reply_at) <= 1440 THEN 1 ELSE 0 END) / COUNT(*), 2) AS response_rate",
      "FROM Inquiry",
      "GROUP BY host_id",
      "ORDER BY response_rate DESC, host_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT host_id, inquiries, answered_in_24h, ROUND(100 * answered_in_24h / inquiries, 2) AS response_rate",
        "FROM (",
        "  SELECT host_id, COUNT(inquiry_id) AS inquiries,",
        "         COUNT(CASE WHEN first_reply_at IS NOT NULL AND TIMESTAMPDIFF(SECOND, sent_at, first_reply_at) <= 86400 THEN 1 END) AS answered_in_24h",
        "  FROM Inquiry GROUP BY host_id",
        ") t",
        "ORDER BY response_rate DESC, host_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`TIMESTAMPDIFF(MINUTE, start, end)` measures the reply time.",
      "With a NULL reply the difference is NULL — make sure such an inquiry lands in the \"not answered\" bucket.",
      "Count all inquiries and the in-time ones in the same GROUP BY; the rate is one over the other.",
    ],
    editorial: [
      "One group per host gives both counts: `COUNT(*)` is every inquiry, and a conditional sum counts the ones answered in time. The reply time is `TIMESTAMPDIFF(MINUTE, sent_at, first_reply_at)`, and \"within 24 hours\" is `<= 1440` — an answer exactly a day later is still on time, one minute more is not.",
      "",
      "The NULL case works without special code. When `first_reply_at` is NULL the difference is NULL, the `CASE` condition is unknown, and the `ELSE 0` branch counts it as not answered — which is what the statement says. The alternative spells it out with `IS NOT NULL` and measures in seconds instead; both agree.",
      "",
      "The percentage multiplies by 100 *before* dividing (`/` is decimal division in MySQL) and rounds to two places. The statement fixes the order, and hosts can share a rate, so `host_id` breaks ties. MySQL lets `ORDER BY` use the `response_rate` alias. The alternative computes the counts in a derived table first so the rate does not repeat the long expression. One scan, one group per host.",
    ].join("\n"),
  },

  {
    slug: "airbnb-search-to-booking-funnel-by-platform",
    title: "Airbnb: Search-to-Booking Funnel by Platform",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "A product analyst on Airbnb's search team compares how guests move from searching to booking on the website and the two mobile apps. Every event carries the platform it happened on, and a funnel is counted **per platform** — a guest who searched on iOS and booked on the web does not convert on either.",
      "",
      "For each platform: `searchers` = distinct guests with a `search` on it; `viewers` = of those, the guests who also have a `listing_view` on it; `bookers` = of those viewers, the guests who also have a `booking_confirmed` on it. `booking_request` events are not a funnel step. Return `platform`, `searchers`, `viewers`, `bookers` and `conversion_pct` = 100 × bookers ÷ searchers rounded to 2 decimal places, for every platform with at least one searcher, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "GuestEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "guest_id", type: "int" },
          { name: "platform", type: "enum", values: ["web", "ios", "android"] },
          { name: "event_type", type: "enum", values: ["search", "listing_view", "booking_request", "booking_confirmed"] },
          { name: "event_time", type: "datetime" },
        ],
        primaryKey: ["event_id"],
        note: "One row per tracked event. A guest can repeat an event many times.",
      },
    ],
    examples: [
      {
        GuestEvent: [
          [1, 1, "web", "search", "2025-04-01 10:00:00"],
          [2, 1, "web", "listing_view", "2025-04-01 10:02:00"],
          [3, 1, "web", "booking_confirmed", "2025-04-01 10:20:00"],
          [4, 2, "web", "search", "2025-04-01 11:00:00"],
          [5, 2, "web", "search", "2025-04-01 11:05:00"],
          [6, 3, "ios", "search", "2025-04-02 08:00:00"],
          [7, 3, "ios", "listing_view", "2025-04-02 08:03:00"],
          [8, 3, "web", "booking_confirmed", "2025-04-02 21:00:00"],
          [9, 4, "android", "listing_view", "2025-04-03 09:00:00"],
          [10, 4, "android", "booking_confirmed", "2025-04-03 09:30:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      const guests = chance(rng, 0.05) ? 0 : ri(rng, 1, 9);
      for (let g = 1; g <= guests; g++) {
        for (const p of sample(rng, ["web", "ios", "android"], ri(rng, 1, 2))) {
          const day = dateBetween(rng, "2025-04-01", "2025-04-10");
          let t = ri(rng, 300, 1200);
          const push = (type: string) => rows.push([id++, g, p, type, at(day, (t += ri(rng, 1, 30)))]);
          if (chance(rng, 0.8)) {
            push("search");
            if (chance(rng, 0.3)) push("search");
          }
          if (chance(rng, 0.65)) push("listing_view");
          if (chance(rng, 0.4)) push("booking_request");
          if (chance(rng, 0.45)) push("booking_confirmed");
        }
      }
      return { GuestEvent: rows };
    },
    solution: [
      "WITH per_guest AS (",
      "  SELECT platform, guest_id,",
      "         MAX(CASE WHEN event_type = 'search' THEN 1 ELSE 0 END) AS s,",
      "         MAX(CASE WHEN event_type = 'listing_view' THEN 1 ELSE 0 END) AS v,",
      "         MAX(CASE WHEN event_type = 'booking_confirmed' THEN 1 ELSE 0 END) AS b",
      "  FROM GuestEvent",
      "  GROUP BY platform, guest_id",
      ")",
      "SELECT platform,",
      "       SUM(s) AS searchers,",
      "       SUM(s * v) AS viewers,",
      "       SUM(s * v * b) AS bookers,",
      "       ROUND(100 * SUM(s * v * b) / SUM(s), 2) AS conversion_pct",
      "FROM per_guest",
      "GROUP BY platform",
      "HAVING SUM(s) > 0",
    ].join("\n"),
    alternatives: [
      [
        "SELECT e.platform,",
        "       COUNT(DISTINCT e.guest_id) AS searchers,",
        "       COUNT(DISTINCT CASE WHEN v.guest_id IS NOT NULL THEN e.guest_id END) AS viewers,",
        "       COUNT(DISTINCT CASE WHEN v.guest_id IS NOT NULL AND b.guest_id IS NOT NULL THEN e.guest_id END) AS bookers,",
        "       ROUND(100 * COUNT(DISTINCT CASE WHEN v.guest_id IS NOT NULL AND b.guest_id IS NOT NULL THEN e.guest_id END) / COUNT(DISTINCT e.guest_id), 2) AS conversion_pct",
        "FROM GuestEvent e",
        "LEFT JOIN (SELECT DISTINCT platform, guest_id FROM GuestEvent WHERE event_type = 'listing_view') v",
        "  ON v.platform = e.platform AND v.guest_id = e.guest_id",
        "LEFT JOIN (SELECT DISTINCT platform, guest_id FROM GuestEvent WHERE event_type = 'booking_confirmed') b",
        "  ON b.platform = e.platform AND b.guest_id = e.guest_id",
        "WHERE e.event_type = 'search'",
        "GROUP BY e.platform",
      ].join("\n"),
    ],
    hints: [
      "First reduce the events to one row per (platform, guest) saying which steps that guest reached there.",
      "`MAX(CASE WHEN event_type = 'search' THEN 1 ELSE 0 END)` is a 0/1 flag per guest.",
      "A guest is a viewer only if both flags are 1 — multiplying the flags is an AND.",
      "Repeated searches by one guest must still count once.",
    ],
    editorial: [
      "A funnel counts **people**, not events, and each step requires the steps before it. So the first move is to collapse the event stream to one row per `(platform, guest_id)` with a 0/1 flag per step: `MAX(CASE WHEN event_type = 'search' THEN 1 ELSE 0 END)` is 1 if the guest searched there at least once, however many times. Repeats disappear at this point.",
      "",
      "Then each stage is a sum of flags. `SUM(s)` counts searchers; `SUM(s * v)` counts guests who both searched and viewed (a product of 0/1 flags is an AND); `SUM(s * v * b)` adds the confirmed booking. A guest who viewed and booked on Android without searching there contributes nothing — the example's guest 4 — and neither does guest 3, who searched on iOS but booked on the web. `HAVING SUM(s) > 0` drops a platform nobody searched on, which also keeps the division safe.",
      "",
      "The alternative starts from the search events and left-joins the distinct viewers and bookers of the same platform, counting with `COUNT(DISTINCT CASE …)`. It is the same set logic written as joins; the flag version reads the table once and is usually cheaper.",
    ].join("\n"),
  },

  {
    slug: "airbnb-most-wishlisted-listing-in-each-city",
    title: "Airbnb: Most-Wishlisted Listing in Each City",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation", "Joins"],
    description: [
      "Guests save homes they like to wishlists, and a guest can save the same home to more than one wishlist (\"Summer\", \"Someday\"). The merchandising team wants each city's most-wanted home for a destination page.",
      "",
      "A listing's popularity is the number of **distinct guests** who saved it. For every city, return the listing (or listings, if tied) with the most savers: `city`, `listing_id` and `savers`. Listings nobody saved are never returned, so a city with no saves has no row. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Listing",
        columns: [
          { name: "listing_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "title", type: "varchar" },
        ],
        primaryKey: ["listing_id"],
        note: "One row per listing.",
      },
      {
        name: "WishlistSave",
        columns: [
          { name: "save_id", type: "int" },
          { name: "guest_id", type: "int" },
          { name: "wishlist_name", type: "varchar" },
          { name: "listing_id", type: "int" },
        ],
        primaryKey: ["save_id"],
        note: "One row per listing saved to one of a guest's wishlists. `listing_id` always names a listing.",
      },
    ],
    examples: [
      {
        Listing: [
          [1, "Lisbon", "Sunny loft near the old town"],
          [2, "Lisbon", "Canal-side apartment"],
          [3, "Kyoto", "Machiya townhouse"],
          [4, "Kyoto", "Minimalist micro-studio"],
          [5, "Kyoto", "Garden cottage"],
          [6, "Goa", "Beach hut with hammock"],
        ],
        WishlistSave: [
          [1, 100, "Summer", 1],
          [2, 100, "Someday", 1],
          [3, 101, "Summer", 1],
          [4, 102, "Summer", 2],
          [5, 100, "Japan", 3],
          [6, 103, "Japan", 3],
          [7, 104, "Kyoto trip", 4],
          [8, 101, "Kyoto trip", 4],
          [9, 102, "Someday", 5],
        ],
      },
    ],
    gen: (rng) => {
      const l = ri(rng, 1, 9);
      const cities = sample(rng, STAY_CITIES, ri(rng, 1, 3));
      const listings: Cell[][] = seq(1, l).map((id) => [id, pick(rng, cities), pick(rng, LISTING_TITLES)]);
      const n = chance(rng, 0.06) ? 0 : ri(rng, 1, 22);
      const lists = ["Summer", "Someday", "Weekend", "Family trip"];
      const saves: Cell[][] = seq(1, n).map((id) => [id, ri(rng, 100, 106), pick(rng, lists), ri(rng, 1, l)]);
      return { Listing: listings, WishlistSave: saves };
    },
    solution: [
      "WITH counts AS (",
      "  SELECT l.city, l.listing_id, COUNT(DISTINCT w.guest_id) AS savers",
      "  FROM Listing l",
      "  JOIN WishlistSave w ON w.listing_id = l.listing_id",
      "  GROUP BY l.city, l.listing_id",
      "), ranked AS (",
      "  SELECT city, listing_id, savers,",
      "         RANK() OVER (PARTITION BY city ORDER BY savers DESC) AS pos",
      "  FROM counts",
      ")",
      "SELECT city, listing_id, savers FROM ranked WHERE pos = 1",
    ].join("\n"),
    alternatives: [
      [
        "WITH counts AS (",
        "  SELECT l.city, l.listing_id, COUNT(DISTINCT w.guest_id) AS savers",
        "  FROM Listing l JOIN WishlistSave w ON w.listing_id = l.listing_id",
        "  GROUP BY l.city, l.listing_id",
        ")",
        "SELECT c.city, c.listing_id, c.savers FROM counts c",
        "WHERE c.savers = (SELECT MAX(c2.savers) FROM counts c2 WHERE c2.city = c.city)",
      ].join("\n"),
      [
        "WITH counts AS (",
        "  SELECT l.city, l.listing_id, COUNT(DISTINCT w.guest_id) AS savers",
        "  FROM Listing l JOIN WishlistSave w ON w.listing_id = l.listing_id",
        "  GROUP BY l.city, l.listing_id",
        ")",
        "SELECT c.city, c.listing_id, c.savers FROM counts c",
        "WHERE NOT EXISTS (SELECT 1 FROM counts c2 WHERE c2.city = c.city AND c2.savers > c.savers)",
      ].join("\n"),
    ],
    hints: [
      "Count savers per listing first — and a guest who saved a home twice is one saver.",
      "Then compare each listing with the others in its city.",
      "`RANK()` keeps ties at position 1; `ROW_NUMBER()` would pick one arbitrarily.",
    ],
    editorial: [
      "Two steps: measure each listing, then pick the best per city. The measure is `COUNT(DISTINCT guest_id)` over the listing's saves — `COUNT(*)` would count guest 100's two saves of listing 1 twice and could crown the wrong home. Joining `Listing` brings in the city, and the inner join means a listing with no saves never gets a row.",
      "",
      "The pick is a **top-per-group with ties**. `RANK() OVER (PARTITION BY city ORDER BY savers DESC)` gives every listing its position inside its city, and equal counts share a position, so `pos = 1` returns all tied leaders, as asked. `ROW_NUMBER()` would keep one of them, and which one would depend on storage order.",
      "",
      "The alternatives drop the window: one keeps the listings whose count equals the city's maximum (a correlated `MAX`), the other keeps those for which no listing in the city has more savers (`NOT EXISTS`). All three agree on ties. The window version reads the counts once; the correlated ones may rescan them per row, which is fine at this size.",
    ].join("\n"),
  },

  {
    slug: "airbnb-guests-who-came-back-to-the-same-host-within-a-year",
    title: "Airbnb: Guests Who Came Back to the Same Host Within a Year",
    difficulty: "MEDIUM",
    topics: ["Joins", "Dates", "Subqueries"],
    description: [
      "Repeat guests are a sign of a great host. A host-insights analyst wants every guest who returned to the same host — possibly at a **different listing** of that host — within a year.",
      "",
      "A guest has returned to a host when, among the guest's **completed** stays at that host's listings, there is a later stay whose `check_in` is **on or after** an earlier stay's `check_out` and **at most 365 days** after it. Return each such pair once as `guest_id` and `host_id`, in any order. Cancelled reservations never count.",
    ].join("\n"),
    tables: [
      {
        name: "Listing",
        columns: [
          { name: "listing_id", type: "int" },
          { name: "host_id", type: "int" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["listing_id"],
        note: "A host can own several listings.",
      },
      {
        name: "Reservation",
        columns: [
          { name: "reservation_id", type: "int" },
          { name: "guest_id", type: "int" },
          { name: "listing_id", type: "int" },
          { name: "check_in", type: "date" },
          { name: "check_out", type: "date" },
          { name: "status", type: "enum", values: ["completed", "cancelled"] },
        ],
        primaryKey: ["reservation_id"],
        note: "`check_out` is always after `check_in`; `listing_id` always names a listing.",
      },
    ],
    examples: [
      {
        Listing: [
          [1, 50, "Lisbon"],
          [2, 50, "Lisbon"],
          [3, 60, "Goa"],
          [4, 70, "Kyoto"],
        ],
        Reservation: [
          [1, 900, 1, "2024-02-01", "2024-02-05", "completed"],
          [2, 900, 2, "2024-11-20", "2024-11-23", "completed"],
          [3, 901, 3, "2024-01-10", "2024-01-12", "completed"],
          [4, 901, 3, "2025-01-12", "2025-01-15", "completed"],
          [5, 902, 3, "2024-03-01", "2024-03-04", "completed"],
          [6, 902, 3, "2025-03-05", "2025-03-07", "completed"],
          [7, 903, 4, "2024-05-01", "2024-05-03", "completed"],
          [8, 903, 4, "2024-06-01", "2024-06-04", "cancelled"],
        ],
      },
    ],
    gen: (rng) => {
      const l = ri(rng, 1, 6);
      const listings: Cell[][] = seq(1, l).map((id) => [id, ri(rng, 50, 53), pick(rng, STAY_CITIES)]);
      const rows: Cell[][] = [];
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 14);
      for (let id = 1; id <= n; id++) {
        const prev = rows.length ? rows[rows.length - 1]! : null;
        // Now and then a return stay placed right at the 365-day edge.
        if (prev && chance(rng, 0.25)) {
          const ci = addDays(prev[4] as string, pick(rng, [0, 365, 366, 200]));
          rows.push([id, prev[1]!, ri(rng, 1, l), ci, addDays(ci, ri(rng, 1, 5)), chance(rng, 0.85) ? "completed" : "cancelled"]);
          continue;
        }
        const ci = dateBetween(rng, "2024-01-01", "2025-06-30");
        rows.push([id, ri(rng, 900, 904), ri(rng, 1, l), ci, addDays(ci, ri(rng, 1, 6)), chance(rng, 0.85) ? "completed" : "cancelled"]);
      }
      return { Listing: listings, Reservation: rows };
    },
    solution: [
      "SELECT DISTINCT a.guest_id, la.host_id",
      "FROM Reservation a",
      "JOIN Listing la ON la.listing_id = a.listing_id",
      "JOIN Reservation b ON b.guest_id = a.guest_id AND b.reservation_id <> a.reservation_id",
      "JOIN Listing lb ON lb.listing_id = b.listing_id AND lb.host_id = la.host_id",
      "WHERE a.status = 'completed' AND b.status = 'completed'",
      "  AND b.check_in >= a.check_out",
      "  AND DATEDIFF(b.check_in, a.check_out) <= 365",
    ].join("\n"),
    alternatives: [
      [
        "WITH s AS (",
        "  SELECT r.reservation_id, r.guest_id, l.host_id, r.check_in, r.check_out",
        "  FROM Reservation r JOIN Listing l ON l.listing_id = r.listing_id",
        "  WHERE r.status = 'completed'",
        ")",
        "SELECT DISTINCT a.guest_id, a.host_id FROM s a",
        "WHERE EXISTS (",
        "  SELECT 1 FROM s b",
        "  WHERE b.guest_id = a.guest_id AND b.host_id = a.host_id AND b.reservation_id <> a.reservation_id",
        "    AND b.check_in BETWEEN a.check_out AND DATE_ADD(a.check_out, INTERVAL 365 DAY)",
        ")",
      ].join("\n"),
    ],
    hints: [
      "The host is on `Listing`, so both stays need their listing joined in.",
      "Pair each completed stay with another completed stay of the same guest at the same host.",
      "The gap is `DATEDIFF(later.check_in, earlier.check_out)`; it must be between 0 and 365.",
      "Several qualifying pairs give the same guest and host — return them once.",
    ],
    editorial: [
      "The question compares two stays of one guest, so it is a **self join** on `Reservation`: `a` is the earlier stay and `b` the return. The host is not on the reservation, so each side joins its own `Listing` row, and the pair must share `host_id` — which is how a return to a *different* listing of the same host still counts.",
      "",
      "The date rule has two halves. `b.check_in >= a.check_out` makes `b` genuinely later (a guest can check in the day another stay ends, so equality is allowed), and `DATEDIFF(b.check_in, a.check_out) <= 365` keeps it within a year — exactly 365 days counts, 366 does not. Both stays must be completed; a cancelled booking is not a visit. `b.reservation_id <> a.reservation_id` stops a stay pairing with itself.",
      "",
      "A guest with three visits makes several qualifying pairs, so `DISTINCT` returns each guest–host pair once. The alternative builds the completed stays with their host in a CTE and asks `EXISTS` for a return, using `BETWEEN check_out AND DATE_ADD(check_out, INTERVAL 365 DAY)`. With indexes on `(guest_id)` the pairing stays small, since only one guest's stays are compared at a time.",
    ].join("\n"),
  },

  {
    slug: "airbnb-rank-experiences-by-a-bayesian-average-rating",
    title: "Airbnb: Rank Experiences by a Bayesian Average Rating",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Subqueries"],
    description: [
      "The Experiences team sorts a city's page by rating, but a cooking class with one five-star review should not outrank a walking tour with forty glowing ones. So ratings are **shrunk towards the platform average**: each Experience is treated as if it also had `m = 5` extra reviews at the overall mean.",
      "",
      "Let `v` be an Experience's number of reviews, `R` its average rating, and `C` the average of **every review in the table** (all Experiences together). Its Bayesian rating is `(v × R + 5 × C) / (v + 5)`. For every Experience with at least one review, return `experience_id`, `title`, `reviews` (= v), `avg_rating` (R) and `adjusted_rating`, both rounded to 2 decimal places. Order by `adjusted_rating` descending (the rounded value), then `reviews` descending, then `experience_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Experience",
        columns: [
          { name: "experience_id", type: "int" },
          { name: "title", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["experience_id"],
        note: "One row per Experience a host offers.",
      },
      {
        name: "ExperienceReview",
        columns: [
          { name: "review_id", type: "int" },
          { name: "experience_id", type: "int" },
          { name: "rating", type: "int" },
        ],
        primaryKey: ["review_id"],
        note: "One guest review, 1 to 5 stars. `experience_id` always names an Experience.",
      },
    ],
    examples: [
      {
        Experience: [
          [1, "Pastel de nata workshop", "Lisbon"],
          [2, "Sunrise volcano hike", "Bali"],
          [3, "Street-art walk", "Lisbon"],
          [4, "Tea ceremony", "Kyoto"],
          [5, "Spice farm lunch", "Goa"],
          [6, "Night kayak tour", "Goa"],
        ],
        ExperienceReview: [
          [1, 1, 5],
          [2, 2, 5], [3, 2, 5], [4, 2, 5], [5, 2, 5], [6, 2, 5], [7, 2, 5], [8, 2, 4], [9, 2, 5],
          [10, 3, 3], [11, 3, 4], [12, 3, 3],
          [13, 4, 4], [14, 4, 4], [15, 4, 5], [16, 4, 4],
          [17, 6, 2], [18, 6, 3],
        ],
      },
    ],
    gen: (rng) => {
      const e = ri(rng, 2, 7);
      const exps: Cell[][] = seq(1, e).map((id) => [id, `Experience ${id}`, pick(rng, STAY_CITIES)]);
      const rows: Cell[][] = [];
      let rid = 1;
      if (!chance(rng, 0.05)) {
        for (let id = 1; id <= e; id++) {
          // Some Experiences have one or two reviews (the case shrinkage is for), some many, some none.
          const k = pick(rng, [0, 1, 1, 2, 3, 5, 8]);
          const quality = pick(rng, [[5, 5, 5, 4], [4, 5, 4, 3], [3, 4, 2, 3], [5]]);
          for (let i = 0; i < k; i++) rows.push([rid++, id, pick(rng, quality)]);
        }
      }
      return { Experience: exps, ExperienceReview: rows };
    },
    solution: [
      "WITH overall AS (",
      "  SELECT COUNT(*) AS n_all, SUM(rating) AS s_all FROM ExperienceReview",
      "), per_exp AS (",
      "  SELECT experience_id, COUNT(*) AS v, SUM(rating) AS s",
      "  FROM ExperienceReview",
      "  GROUP BY experience_id",
      ")",
      "SELECT x.experience_id, x.title, p.v AS reviews,",
      "       ROUND(p.s / p.v, 2) AS avg_rating,",
      "       ROUND((p.s * o.n_all + 5 * o.s_all) * 1.0000 / (o.n_all * (p.v + 5)), 2) AS adjusted_rating",
      "FROM per_exp p",
      "JOIN Experience x ON x.experience_id = p.experience_id",
      "CROSS JOIN overall o",
      "ORDER BY adjusted_rating DESC, reviews DESC, x.experience_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT experience_id, title, reviews, ROUND(r_avg, 2) AS avg_rating,",
        "       ROUND((reviews * r_avg + 5 * c_avg) / (reviews + 5), 2) AS adjusted_rating",
        "FROM (",
        "  SELECT x.experience_id, x.title, COUNT(*) AS reviews,",
        "         SUM(r.rating) * 1.00000000 / COUNT(*) AS r_avg,",
        "         SUM(SUM(r.rating)) OVER () * 1.00000000 / SUM(COUNT(*)) OVER () AS c_avg",
        "  FROM Experience x",
        "  JOIN ExperienceReview r ON r.experience_id = x.experience_id",
        "  GROUP BY x.experience_id, x.title",
        ") t",
        "ORDER BY adjusted_rating DESC, reviews DESC, experience_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "You need two levels of aggregate: one per Experience (v and R) and one over the whole table (C).",
      "Compute the global count and sum once — a one-row CTE you CROSS JOIN, or a window over the grouped rows.",
      "`v × R` is just the Experience's sum of ratings, so the formula needs no averages at all: `(s + 5 × C) / (v + 5)`.",
      "C is the mean of all reviews, not the mean of the Experiences' averages — a busy Experience weighs more.",
    ],
    editorial: [
      "A raw average rewards luck: one five-star review gives 5.00, while an Experience with eight reviews and a single 4 sits at 4.88. The **Bayesian average** fixes that by mixing each Experience's own average R with the platform mean C, weighted by how much evidence each has: `(v·R + m·C) / (v + m)`. With few reviews the result stays near C; with many it approaches R. In the example the single-review workshop drops below the eight-review hike.",
      "",
      "The query needs aggregates at two levels. `per_exp` groups the reviews by Experience for `v` and the rating sum `s` (note `v·R = s`). `overall` is one row with the count and sum of every review, so `C = s_all / n_all` — the mean over reviews, which weighs busy Experiences more, not the mean of the averages. A `CROSS JOIN` attaches that row to every Experience. Experiences without reviews never form a group and are left out.",
      "",
      "The solution clears the fractions: `(s + 5·s_all/n_all) / (v + 5)` equals `(s·n_all + 5·s_all) / (n_all·(v + 5))`, one division of integers. The `* 1.0000` matters on MySQL, whose division keeps only four extra decimals: without it, a value just below a rounding boundary can round the wrong way. The alternative computes C with window functions over the grouped rows — `SUM(SUM(rating)) OVER ()` — and applies the formula as written. The order uses the rounded score, then the review count, then the id, so it is deterministic.",
    ].join("\n"),
  },

  {
    slug: "airbnb-guest-cancellation-rate-by-cancellation-policy",
    title: "Airbnb: Guest Cancellation Rate by Cancellation Policy",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "Hosts on Airbnb choose a cancellation policy, and the policy team wants to know whether stricter policies really mean fewer guest cancellations.",
      "",
      "For **every** policy in `CancellationPolicy`, return `policy`, `reservations` (all reservations made under it, whatever their status), `guest_cancellations` (those with status `cancelled_by_guest`) and `cancel_rate_pct` = 100 × guest_cancellations ÷ reservations rounded to 2 decimal places. A cancellation by the host is a reservation but not a guest cancellation. A policy with no reservations shows 0, 0 and a NULL rate. Order the rows by `policy`.",
    ].join("\n"),
    tables: [
      {
        name: "CancellationPolicy",
        columns: [
          { name: "policy", type: "varchar" },
          { name: "full_refund_days", type: "int" },
        ],
        primaryKey: ["policy"],
        note: "The policies a host can choose; `full_refund_days` is how many days before check-in a guest can still cancel for a full refund (an invented rule set).",
      },
      {
        name: "Reservation",
        columns: [
          { name: "reservation_id", type: "int" },
          { name: "policy", type: "varchar" },
          { name: "status", type: "enum", values: ["upcoming", "completed", "cancelled_by_guest", "cancelled_by_host"] },
        ],
        primaryKey: ["reservation_id"],
        note: "`policy` is the policy in force when the reservation was made; it always names a row of `CancellationPolicy`.",
      },
    ],
    examples: [
      {
        CancellationPolicy: [
          ["firm", 30],
          ["flexible", 1],
          ["moderate", 5],
          ["strict", 14],
        ],
        Reservation: [
          [1, "flexible", "completed"],
          [2, "flexible", "cancelled_by_guest"],
          [3, "flexible", "cancelled_by_guest"],
          [4, "flexible", "upcoming"],
          [5, "moderate", "completed"],
          [6, "moderate", "cancelled_by_host"],
          [7, "strict", "completed"],
          [8, "strict", "cancelled_by_guest"],
          [9, "strict", "completed"],
        ],
      },
    ],
    gen: (rng) => {
      const all: [string, number][] = [["flexible", 1], ["moderate", 5], ["firm", 30], ["strict", 14], ["non_refundable", 0]];
      const pol = sample(rng, all, ri(rng, 2, 5));
      const used = sample(rng, pol, ri(rng, 1, pol.length));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 22);
      const rows: Cell[][] = seq(1, n).map((id) => [id, pick(rng, used)[0], pick(rng, ["upcoming", "completed", "completed", "cancelled_by_guest", "cancelled_by_host"])]);
      return { CancellationPolicy: pol.map(([p, d]) => [p, d]), Reservation: rows };
    },
    solution: [
      "SELECT p.policy,",
      "       COUNT(r.reservation_id) AS reservations,",
      "       COUNT(CASE WHEN r.status = 'cancelled_by_guest' THEN 1 END) AS guest_cancellations,",
      "       ROUND(100 * COUNT(CASE WHEN r.status = 'cancelled_by_guest' THEN 1 END) / NULLIF(COUNT(r.reservation_id), 0), 2) AS cancel_rate_pct",
      "FROM CancellationPolicy p",
      "LEFT JOIN Reservation r ON r.policy = p.policy",
      "GROUP BY p.policy",
      "ORDER BY p.policy",
    ].join("\n"),
    alternatives: [
      [
        "SELECT policy, reservations, guest_cancellations,",
        "       CASE WHEN reservations = 0 THEN NULL ELSE ROUND(100 * guest_cancellations / reservations, 2) END AS cancel_rate_pct",
        "FROM (",
        "  SELECT p.policy,",
        "         (SELECT COUNT(*) FROM Reservation r WHERE r.policy = p.policy) AS reservations,",
        "         (SELECT COUNT(*) FROM Reservation r WHERE r.policy = p.policy AND r.status = 'cancelled_by_guest') AS guest_cancellations",
        "  FROM CancellationPolicy p",
        ") t",
        "ORDER BY policy",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Every policy must appear, even one nobody booked — start from `CancellationPolicy` and LEFT JOIN.",
      "After a LEFT JOIN, `COUNT(*)` counts the empty match as 1; count a column of `Reservation` instead.",
      "Dividing by zero needs care: `NULLIF(x, 0)` turns the zero into NULL.",
    ],
    editorial: [
      "\"For every policy\" means the policy table drives the query: `CancellationPolicy LEFT JOIN Reservation`, grouped by policy. A policy with no reservations still produces one row, with the reservation columns NULL.",
      "",
      "That NULL row is why the counts are written carefully. `COUNT(*)` counts rows, so it would report 1 reservation for an unbooked policy; `COUNT(r.reservation_id)` counts non-NULL ids and correctly gives 0. Likewise `COUNT(CASE WHEN status = 'cancelled_by_guest' THEN 1 END)` gives 0 where a `SUM(CASE …)` without an `ELSE` would give NULL. Host cancellations fall in the total but not in the guest count, as the statement asks.",
      "",
      "The rate divides by the reservation count, which can be 0. `NULLIF(count, 0)` turns that into NULL, and any arithmetic with NULL is NULL — the required result, and no division-by-zero surprise. The alternative counts with two correlated subqueries per policy and handles zero with a `CASE`. The join version reads `Reservation` once.",
    ].join("\n"),
  },

  {
    slug: "airbnb-listings-with-a-kitchen-but-no-wifi",
    title: "Airbnb: Listings With a Kitchen but No Wi-Fi",
    difficulty: "MEDIUM",
    topics: ["Strings"],
    description: [
      "Long-stay guests filter for a kitchen and Wi-Fi together. The listings-quality team wants hosts who advertise a kitchen but no Wi-Fi, so they can be nudged to add it.",
      "",
      "A listing's `amenities` is a comma-separated list of codes with no spaces, such as `wifi,kitchen,washer`. Return the listings whose list contains the code **`kitchen`** exactly and does **not** contain the code **`wifi`** exactly — `kitchenette` is not a kitchen, and `pocket_wifi` is not Wi-Fi. A listing with `amenities` NULL lists nothing and is never returned. Return `listing_id` and `title`, ordered by `listing_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Listing",
        columns: [
          { name: "listing_id", type: "int" },
          { name: "title", type: "varchar" },
          { name: "amenities", type: "varchar" },
        ],
        primaryKey: ["listing_id"],
        note: "`amenities` holds lower-case codes separated by commas, each code at most once, or NULL.",
      },
    ],
    examples: [
      {
        Listing: [
          [1, "Garden cottage", "wifi,kitchen,washer"],
          [2, "Beach hut with hammock", "kitchen,parking"],
          [3, "Minimalist micro-studio", "kitchenette,heating"],
          [4, "Converted barn", "pocket_wifi,kitchen"],
          [5, "Cliffside studio", null],
          [6, "Machiya townhouse", "kitchen"],
          [7, "Canal-side apartment", "parking,wifi"],
        ],
      },
    ],
    gen: (rng) => {
      const codes = ["wifi", "kitchen", "kitchenette", "pocket_wifi", "washer", "parking", "pool", "heating", "workspace"];
      const n = ri(rng, 1, 16);
      const rows: Cell[][] = seq(1, n).map((id) => [id, pick(rng, LISTING_TITLES), chance(rng, 0.1) ? null : sample(rng, codes, ri(rng, 1, 4)).join(",")]);
      return { Listing: rows };
    },
    solution: [
      "SELECT listing_id, title",
      "FROM Listing",
      "WHERE CONCAT(',', amenities, ',') LIKE '%,kitchen,%'",
      "  AND CONCAT(',', amenities, ',') NOT LIKE '%,wifi,%'",
      "ORDER BY listing_id",
    ].join("\n"),
    alternatives: [
      "SELECT listing_id, title FROM Listing WHERE amenities REGEXP '(^|,)kitchen(,|$)' AND NOT amenities REGEXP '(^|,)wifi(,|$)' ORDER BY listing_id",
      "SELECT listing_id, title FROM Listing WHERE LOCATE(',kitchen,', CONCAT(',', amenities, ',')) > 0 AND LOCATE(',wifi,', CONCAT(',', amenities, ',')) = 0 ORDER BY listing_id",
    ],
    ordered: true,
    hints: [
      "`amenities LIKE '%kitchen%'` also matches `kitchenette` — you need whole codes.",
      "Wrap the list in commas on both sides; then every code, first and last included, is surrounded by commas.",
      "With NULL amenities, what do `CONCAT` and the `LIKE` test return?",
    ],
    editorial: [
      "Searching a delimited list for a whole item is a string problem: a plain `LIKE '%kitchen%'` also finds `kitchenette`, and `'%wifi%'` finds `pocket_wifi`. The standard trick is to put a comma at both ends — `CONCAT(',', amenities, ',')` turns `kitchen,parking` into `,kitchen,parking,` — after which every code, including the first and the last, sits between two commas, and `LIKE '%,kitchen,%'` matches only the whole code.",
      "",
      "The listing must contain `,kitchen,` and must not contain `,wifi,`. NULL amenities need no extra test: `CONCAT` with a NULL argument is NULL, `NULL LIKE …` is unknown and `NULL NOT LIKE …` is unknown too, so the row fails `WHERE` either way — exactly the \"never returned\" rule.",
      "",
      "The alternatives use the same idea differently: a regular expression anchored on `(^|,)` and `(,|$)` needs no padding, and `LOCATE` finds the padded code's position (0 for absent). In a real schema the amenities would be a separate table with one row per code, which turns this into an indexed semi join plus anti join.",
    ].join("\n"),
  },

  {
    slug: "airbnb-hosts-whose-every-active-listing-is-instant-book",
    title: "Airbnb: Hosts Whose Every Active Listing Is Instant Book",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Subqueries"],
    description: [
      "Instant Book lets a guest book without waiting for approval. The host-tools team is choosing multi-listing hosts for a beta of a new calendar feature and wants hosts who have gone **all in** on Instant Book.",
      "",
      "Return every host with **at least two active listings** where **every active listing** has `instant_book = 1`. Snoozed and delisted listings are ignored entirely, whatever their setting. Return `host_id`, `host_name` and `active_listings`, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Host",
        columns: [
          { name: "host_id", type: "int" },
          { name: "host_name", type: "varchar" },
        ],
        primaryKey: ["host_id"],
        note: "One row per host.",
      },
      {
        name: "Listing",
        columns: [
          { name: "listing_id", type: "int" },
          { name: "host_id", type: "int" },
          { name: "instant_book", type: "bool" },
          { name: "status", type: "enum", values: ["active", "snoozed", "delisted"] },
        ],
        primaryKey: ["listing_id"],
        note: "`host_id` always names a host.",
      },
    ],
    examples: [
      {
        Host: [
          [1, "Priya"],
          [2, "David"],
          [3, "Ishaan"],
          [4, "Olivia"],
        ],
        Listing: [
          [10, 1, 1, "active"],
          [11, 1, 1, "active"],
          [12, 1, 0, "delisted"],
          [13, 2, 1, "active"],
          [14, 2, 0, "active"],
          [15, 3, 1, "active"],
          [16, 3, 1, "snoozed"],
          [17, 4, 1, "active"],
          [18, 4, 1, "active"],
          [19, 4, 1, "active"],
        ],
      },
    ],
    gen: (rng) => {
      const h = ri(rng, 2, 7);
      const who = names(rng, h);
      const hosts: Cell[][] = seq(1, h).map((id, i) => [id, who[i]!]);
      const listings: Cell[][] = [];
      let lid = 10;
      for (let host = 1; host <= h; host++) {
        const allIn = chance(rng, 0.5);
        for (let k = allIn ? ri(rng, 2, 5) : ri(rng, 0, 4); k > 0; k--) {
          const status = pick(rng, ["active", "active", "active", "active", "snoozed", "delisted"]);
          listings.push([lid++, host, allIn && status === "active" ? 1 : chance(rng, 0.6) ? 1 : 0, status]);
        }
      }
      return { Host: hosts, Listing: listings };
    },
    solution: [
      "SELECT h.host_id, h.host_name, COUNT(*) AS active_listings",
      "FROM Host h",
      "JOIN Listing l ON l.host_id = h.host_id",
      "WHERE l.status = 'active'",
      "GROUP BY h.host_id, h.host_name",
      "HAVING COUNT(*) >= 2 AND MIN(l.instant_book) = 1",
    ].join("\n"),
    alternatives: [
      [
        "SELECT h.host_id, h.host_name,",
        "       (SELECT COUNT(*) FROM Listing l WHERE l.host_id = h.host_id AND l.status = 'active') AS active_listings",
        "FROM Host h",
        "WHERE (SELECT COUNT(*) FROM Listing l WHERE l.host_id = h.host_id AND l.status = 'active') >= 2",
        "  AND NOT EXISTS (SELECT 1 FROM Listing l WHERE l.host_id = h.host_id AND l.status = 'active' AND l.instant_book = 0)",
      ].join("\n"),
      [
        "SELECT h.host_id, h.host_name, COUNT(*) AS active_listings",
        "FROM Host h JOIN Listing l ON l.host_id = h.host_id AND l.status = 'active'",
        "GROUP BY h.host_id, h.host_name",
        "HAVING COUNT(*) >= 2 AND SUM(l.instant_book) = COUNT(*)",
      ].join("\n"),
    ],
    hints: [
      "Filter to active listings first; only they matter.",
      "\"Every listing has the flag\" is the same as \"the smallest flag is 1\" — or \"no listing lacks it\".",
      "Both conditions are about the group, so they go in `HAVING`.",
    ],
    editorial: [
      "\"Every\" questions are a kind of relational division, and the easiest way to answer one in SQL is to turn it into an aggregate. After keeping only active listings and grouping by host, \"every active listing has Instant Book\" becomes `MIN(instant_book) = 1` — the minimum of 0/1 flags is 1 only when no 0 is present. Another spelling is `SUM(instant_book) = COUNT(*)`. Both sit in `HAVING` with the size rule `COUNT(*) >= 2`.",
      "",
      "Filtering in `WHERE` before grouping is what makes snoozed and delisted listings irrelevant: a delisted listing without Instant Book cannot spoil a host, and a snoozed one with it cannot make up the count of two. A host with no active listings never forms a group.",
      "",
      "The other alternative states the rule literally: count the active listings with a correlated subquery, and require that **no** active listing with `instant_book = 0` exists. Double negation (\"no listing that is not…\") is the textbook form of division; the grouped version reads the table once and is usually what a reviewer expects.",
    ].join("\n"),
  },

  {
    slug: "airbnb-listings-whose-latest-review-scored-lower",
    title: "Airbnb: Listings Whose Latest Review Scored Lower",
    difficulty: "MEDIUM",
    topics: ["Window Functions"],
    description: [
      "A drop in a listing's latest review is an early warning — something may have changed at the home. The trust team wants those listings flagged for a host check-in.",
      "",
      "A listing's reviews are ordered by `reviewed_on`, and reviews on the same day by `review_id`; the **latest** is the last in that order and the **previous** the one just before it. Return every listing whose latest review's `rating` is **strictly lower** than the previous review's, with `listing_id`, `previous_rating` and `latest_rating`. Listings with only one review are never returned. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Review",
        columns: [
          { name: "review_id", type: "int" },
          { name: "listing_id", type: "int" },
          { name: "reviewed_on", type: "date" },
          { name: "rating", type: "int" },
        ],
        primaryKey: ["review_id"],
        note: "One row per guest review, 1 to 5 stars.",
      },
    ],
    examples: [
      {
        Review: [
          [1, 10, "2025-02-01", 5],
          [2, 10, "2025-02-20", 3],
          [3, 11, "2025-02-03", 4],
          [4, 11, "2025-02-11", 5],
          [5, 12, "2025-02-14", 5],
          [6, 12, "2025-02-14", 4],
          [7, 13, "2025-02-25", 2],
          [8, 14, "2025-03-01", 4],
          [9, 14, "2025-01-15", 5],
          [10, 14, "2025-02-01", 3],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 20);
      const rows: Cell[][] = seq(1, n).map((id) => [id, ri(rng, 10, 15), dateBetween(rng, "2025-02-01", "2025-02-12"), ri(rng, 2, 5)]);
      return { Review: rows };
    },
    solution: [
      "WITH ordered_reviews AS (",
      "  SELECT listing_id, rating,",
      "         LAG(rating) OVER (PARTITION BY listing_id ORDER BY reviewed_on, review_id) AS previous_rating,",
      "         ROW_NUMBER() OVER (PARTITION BY listing_id ORDER BY reviewed_on DESC, review_id DESC) AS from_end",
      "  FROM Review",
      ")",
      "SELECT listing_id, previous_rating, rating AS latest_rating",
      "FROM ordered_reviews",
      "WHERE from_end = 1 AND rating < previous_rating",
    ].join("\n"),
    alternatives: [
      [
        "WITH r AS (",
        "  SELECT listing_id, rating,",
        "         ROW_NUMBER() OVER (PARTITION BY listing_id ORDER BY reviewed_on DESC, review_id DESC) AS from_end",
        "  FROM Review",
        ")",
        "SELECT a.listing_id, b.rating AS previous_rating, a.rating AS latest_rating",
        "FROM r a JOIN r b ON b.listing_id = a.listing_id AND b.from_end = 2",
        "WHERE a.from_end = 1 AND a.rating < b.rating",
      ].join("\n"),
    ],
    hints: [
      "Number each listing's reviews from the newest backwards.",
      "`LAG(rating)` over the oldest-first order gives each review the rating just before it.",
      "Two reviews on the same day are ordered by `review_id` — put it in every window's ORDER BY.",
    ],
    editorial: [
      "Two reviews of the same listing have to be compared, and \"latest\" and \"previous\" are positions in an order — a job for window functions. `LAG(rating) OVER (PARTITION BY listing_id ORDER BY reviewed_on, review_id)` attaches to every review the rating of the review before it, and `ROW_NUMBER()` over the reverse order marks the latest review with `from_end = 1`. Keeping that row and testing `rating < previous_rating` answers the question.",
      "",
      "The tie-break carries real weight. Two reviews can share a date, and without `review_id` in both windows their order — and therefore which one is \"latest\" — would be up to the engine. A listing with a single review has `previous_rating` NULL, and `rating < NULL` is unknown, so it is excluded without a special case. An equal rating is not a drop.",
      "",
      "The alternative numbers the reviews from the end and self-joins position 1 to position 2 of the same listing. It avoids `LAG` but reads the numbered rows twice; the `LAG` version is a single pass after one sort per listing.",
    ].join("\n"),
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "airbnb-longest-open-stretch-on-each-calendar",
    title: "Airbnb: Longest Open Stretch on Each Listing's Calendar",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "Airbnb's pricing team wants to suggest a discount for a listing's longest stretch of empty nights. A calendar has a row per night the host has opened up; `available = 1` means the night can still be booked. A night with **no row** is not open.",
      "",
      "For every listing with at least one available night, return its **longest run of consecutive available nights** as `listing_id`, `start_night`, `end_night` (the last night of the run) and `nights`. If two runs are equally long, return the **earlier** one. Order the rows by `listing_id`.",
    ].join("\n"),
    tables: [
      {
        name: "CalendarNight",
        columns: [
          { name: "listing_id", type: "int" },
          { name: "night", type: "date" },
          { name: "available", type: "bool" },
        ],
        primaryKey: ["listing_id", "night"],
        note: "One row per listing and night on the calendar; `available` is 0 when the night is booked or blocked by the host.",
      },
    ],
    examples: [
      {
        CalendarNight: [
          [1, "2025-03-01", 1], [1, "2025-03-02", 1], [1, "2025-03-03", 0], [1, "2025-03-04", 1],
          [1, "2025-03-05", 1], [1, "2025-03-06", 1], [1, "2025-03-08", 1],
          [2, "2025-03-01", 1], [2, "2025-03-02", 1], [2, "2025-03-03", 0], [2, "2025-03-04", 1], [2, "2025-03-05", 1],
          [3, "2025-03-01", 0], [3, "2025-03-02", 0],
          [4, "2025-03-05", 1],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const l = chance(rng, 0.05) ? 0 : ri(rng, 1, 3);
      for (let id = 1; id <= l; id++) {
        const start = dateBetween(rng, "2025-03-01", "2025-03-05");
        const len = ri(rng, 1, 12);
        const pOpen = pick(rng, [0.5, 0.7, 0.85]);
        for (let d = 0; d < len; d++) if (chance(rng, 0.9)) rows.push([id, addDays(start, d), chance(rng, pOpen) ? 1 : 0]);
      }
      return { CalendarNight: rows };
    },
    solution: [
      "WITH open_nights AS (",
      "  SELECT listing_id, night,",
      "         DATEDIFF(night, '2000-01-01') - ROW_NUMBER() OVER (PARTITION BY listing_id ORDER BY night) AS grp",
      "  FROM CalendarNight",
      "  WHERE available = 1",
      "), runs AS (",
      "  SELECT listing_id, MIN(night) AS start_night, MAX(night) AS end_night, COUNT(*) AS nights",
      "  FROM open_nights",
      "  GROUP BY listing_id, grp",
      "), best AS (",
      "  SELECT listing_id, start_night, end_night, nights,",
      "         ROW_NUMBER() OVER (PARTITION BY listing_id ORDER BY nights DESC, start_night) AS pos",
      "  FROM runs",
      ")",
      "SELECT listing_id, start_night, end_night, nights",
      "FROM best",
      "WHERE pos = 1",
      "ORDER BY listing_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH flagged AS (",
        "  SELECT listing_id, night,",
        "         CASE WHEN LAG(night) OVER (PARTITION BY listing_id ORDER BY night) = DATE_SUB(night, INTERVAL 1 DAY) THEN 0 ELSE 1 END AS new_run",
        "  FROM CalendarNight",
        "  WHERE available = 1",
        "), numbered AS (",
        "  SELECT listing_id, night,",
        "         SUM(new_run) OVER (PARTITION BY listing_id ORDER BY night ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS run_id",
        "  FROM flagged",
        "), runs AS (",
        "  SELECT listing_id, MIN(night) AS start_night, MAX(night) AS end_night, COUNT(*) AS nights",
        "  FROM numbered GROUP BY listing_id, run_id",
        ")",
        "SELECT r.listing_id, r.start_night, r.end_night, r.nights",
        "FROM runs r",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM runs o",
        "  WHERE o.listing_id = r.listing_id",
        "    AND (o.nights > r.nights OR (o.nights = r.nights AND o.start_night < r.start_night))",
        ")",
        "ORDER BY r.listing_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Keep only the available nights; a missing or unavailable night both end a run.",
      "Within one listing, consecutive dates minus their row numbers give the same value — that value labels the run.",
      "Group by that label to get each run's start, end and length, then pick the longest per listing.",
      "Break ties between equal runs by the start date.",
    ],
    editorial: [
      "This is **gaps and islands**: the islands are runs of consecutive open nights, and both a booked night and a night with no row are gaps. After filtering to `available = 1`, number each listing's open nights in date order. For nights that follow one another without a gap, the date advances by one day exactly as the row number advances by one, so `day number − row number` stays constant along a run and jumps at every gap. `DATEDIFF(night, '2000-01-01')` turns a date into a day number for that subtraction (it stays positive, which matters in MySQL, where `ROW_NUMBER()` is unsigned).",
      "",
      "Grouping by listing and that label gives every run's `MIN(night)`, `MAX(night)` and `COUNT(*)`. A second window ranks a listing's runs by length, longest first, with `start_night` as the tie-break, and `pos = 1` picks the answer. A listing whose nights are all unavailable has no open night, forms no run, and is absent.",
      "",
      "The alternative finds run starts with `LAG`: a night starts a run unless the previous open night is exactly one day earlier. A running `SUM` of those starts numbers the runs, and `NOT EXISTS` keeps the run that no other beats on length or, at equal length, on start date. Both cost one sort per listing.",
    ].join("\n"),
  },

  {
    slug: "airbnb-collapse-nightly-prices-into-rate-periods",
    title: "Airbnb: Collapse Nightly Prices Into Rate Periods",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "Hosts set a price per night, and the calendar export stores one row per night. A data engineer at Airbnb needs a compact form for the host dashboard: each run of nights at one price as a single **rate period**.",
      "",
      "A rate period is a maximal run of **consecutive** nights of one listing with the **same price**. A night with no row breaks a period, even if the prices on both sides match, and a price that returns after a different one starts a new period. Return every period as `listing_id`, `start_night`, `end_night`, `price` and `nights`, ordered by `listing_id`, then `start_night`.",
    ].join("\n"),
    tables: [
      {
        name: "NightlyPrice",
        columns: [
          { name: "listing_id", type: "int" },
          { name: "night", type: "date" },
          { name: "price", type: "int" },
        ],
        primaryKey: ["listing_id", "night"],
        note: "The price a host set for one night, in US dollars. Nights the host has not priced have no row.",
      },
    ],
    examples: [
      {
        NightlyPrice: [
          [1, "2025-06-01", 120], [1, "2025-06-02", 120], [1, "2025-06-03", 150], [1, "2025-06-04", 150],
          [1, "2025-06-05", 120], [1, "2025-06-06", 120], [1, "2025-06-08", 120],
          [2, "2025-06-01", 80], [2, "2025-06-02", 80], [2, "2025-06-03", 80],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const l = chance(rng, 0.05) ? 0 : ri(rng, 1, 3);
      for (let id = 1; id <= l; id++) {
        const start = dateBetween(rng, "2025-06-01", "2025-06-10");
        let price = pick(rng, [120, 135, 150]);
        for (let d = 0, len = ri(rng, 2, 12); d < len; d++) {
          if (chance(rng, 0.3)) price = pick(rng, [120, 135, 150]);
          if (chance(rng, 0.9)) rows.push([id, addDays(start, d), price]);
        }
      }
      return { NightlyPrice: rows };
    },
    solution: [
      "WITH marked AS (",
      "  SELECT listing_id, night, price,",
      "         CASE WHEN LAG(night) OVER w = DATE_SUB(night, INTERVAL 1 DAY)",
      "               AND LAG(price) OVER w = price THEN 0 ELSE 1 END AS starts_period",
      "  FROM NightlyPrice",
      "  WINDOW w AS (PARTITION BY listing_id ORDER BY night)",
      "), numbered AS (",
      "  SELECT listing_id, night, price,",
      "         SUM(starts_period) OVER (PARTITION BY listing_id ORDER BY night ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS period_no",
      "  FROM marked",
      ")",
      "SELECT listing_id, MIN(night) AS start_night, MAX(night) AS end_night, MIN(price) AS price, COUNT(*) AS nights",
      "FROM numbered",
      "GROUP BY listing_id, period_no",
      "ORDER BY listing_id, start_night",
    ].join("\n"),
    alternatives: [
      [
        "WITH g AS (",
        "  SELECT listing_id, night, price,",
        "         DATEDIFF(night, '2000-01-01') - ROW_NUMBER() OVER (PARTITION BY listing_id, price ORDER BY night) AS grp",
        "  FROM NightlyPrice",
        ")",
        "SELECT listing_id, MIN(night) AS start_night, MAX(night) AS end_night, price, COUNT(*) AS nights",
        "FROM g",
        "GROUP BY listing_id, price, grp",
        "ORDER BY listing_id, start_night",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "A night starts a new period unless the previous night of the listing is exactly one day earlier *and* has the same price.",
      "`LAG` gives you the previous night and its price.",
      "A running sum of the \"starts a period\" flags numbers the periods; group by it.",
      "Alternatively, number the nights within each (listing, price) and subtract from the day number.",
    ],
    editorial: [
      "A period boundary is a property of two neighbouring rows, so the solution looks at each night beside the one before it. `LAG(night)` and `LAG(price)` over the listing's nights in date order give the previous row; the current night **continues** a period only if that previous night is exactly the day before (`DATE_SUB(night, INTERVAL 1 DAY)`) and its price is the same. Anything else — a price change, an unpriced gap, or the first row of the listing, where `LAG` is NULL — starts a period and is flagged 1.",
      "",
      "A running `SUM` of the flags then gives every night the number of its period, and grouping by listing and period number collapses each run into one row with its first night, last night, price and length. The price is constant inside a group; `MIN(price)` just picks it without a bare column under `GROUP BY`.",
      "",
      "The alternative is the two-row-number trick: number the nights *within each listing and price*, and subtract from the day number. Consecutive nights at one price share the difference; a gap or an interruption at another price changes it, so 120 before and 120 after a 150 land in different groups. Both are one sort per listing.",
    ].join("\n"),
  },

  {
    slug: "airbnb-back-to-back-stays-merged-into-trips",
    title: "Airbnb: Back-to-Back Stays Merged Into Trips",
    difficulty: "HARD",
    topics: ["Window Functions", "Strings", "Dates"],
    description: [
      "Many guests chain stays — three nights in Lisbon, then four in Porto — and the trips team wants to see those journeys as one trip. Two of a guest's **completed** stays are linked when the later one checks in **on the same day** the earlier one checks out. A trip is a maximal chain of linked stays.",
      "",
      "Return every trip of **at least two stays** as `guest_id`, `trip_start` (first check-in), `trip_end` (last check-out), `stays`, and `route` — the stays' cities in check-in order joined by `' > '`. Cancelled reservations are not stays. A guest's completed stays never overlap. Order the rows by `guest_id`, then `trip_start`.",
    ].join("\n"),
    tables: [
      {
        name: "Reservation",
        columns: [
          { name: "reservation_id", type: "int" },
          { name: "guest_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "check_in", type: "date" },
          { name: "check_out", type: "date" },
          { name: "status", type: "enum", values: ["completed", "cancelled"] },
        ],
        primaryKey: ["reservation_id"],
        note: "`check_out` is always after `check_in`. `city` is the listing's city.",
      },
    ],
    examples: [
      {
        Reservation: [
          [1, 7, "Lisbon", "2025-04-01", "2025-04-04", "completed"],
          [2, 7, "Porto", "2025-04-04", "2025-04-08", "completed"],
          [3, 7, "Madrid", "2025-04-08", "2025-04-10", "completed"],
          [4, 7, "Seville", "2025-04-20", "2025-04-22", "completed"],
          [5, 8, "Kyoto", "2025-05-01", "2025-05-03", "completed"],
          [6, 8, "Osaka", "2025-05-03", "2025-05-05", "cancelled"],
          [7, 8, "Osaka", "2025-05-04", "2025-05-06", "completed"],
          [8, 9, "Goa", "2025-01-10", "2025-01-12", "completed"],
          [9, 9, "Kochi", "2025-01-12", "2025-01-14", "completed"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      const g = chance(rng, 0.05) ? 0 : ri(rng, 1, 4);
      for (let guest = 1; guest <= g; guest++) {
        let day = dateBetween(rng, "2025-01-01", "2025-03-01");
        for (let k = ri(rng, 1, 6); k > 0; k--) {
          const out = addDays(day, ri(rng, 1, 4));
          rows.push([id++, guest, pick(rng, STAY_CITIES), day, out, chance(rng, 0.85) ? "completed" : "cancelled"]);
          // A cancelled booking that would have chained, to be ignored.
          if (chance(rng, 0.15)) rows.push([id++, guest, pick(rng, STAY_CITIES), out, addDays(out, 2), "cancelled"]);
          day = chance(rng, 0.55) ? out : addDays(out, ri(rng, 1, 6));
        }
      }
      return { Reservation: rows };
    },
    solution: [
      "WITH stays AS (",
      "  SELECT guest_id, city, check_in, check_out,",
      "         CASE WHEN LAG(check_out) OVER (PARTITION BY guest_id ORDER BY check_in) = check_in THEN 0 ELSE 1 END AS new_trip",
      "  FROM Reservation",
      "  WHERE status = 'completed'",
      "), trips AS (",
      "  SELECT guest_id, city, check_in, check_out,",
      "         SUM(new_trip) OVER (PARTITION BY guest_id ORDER BY check_in ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS trip_no",
      "  FROM stays",
      ")",
      "SELECT guest_id, MIN(check_in) AS trip_start, MAX(check_out) AS trip_end, COUNT(*) AS stays,",
      "       GROUP_CONCAT(city ORDER BY check_in SEPARATOR ' > ') AS route",
      "FROM trips",
      "GROUP BY guest_id, trip_no",
      "HAVING COUNT(*) >= 2",
      "ORDER BY guest_id, trip_start",
    ].join("\n"),
    alternatives: [
      [
        "WITH done AS (",
        "  SELECT guest_id, city, check_in, check_out FROM Reservation WHERE status = 'completed'",
        "), starts AS (",
        "  SELECT d.guest_id, d.check_in FROM done d",
        "  WHERE NOT EXISTS (SELECT 1 FROM done p WHERE p.guest_id = d.guest_id AND p.check_out = d.check_in)",
        "), tagged AS (",
        "  SELECT d.guest_id, d.city, d.check_in, d.check_out,",
        "         (SELECT MAX(s.check_in) FROM starts s WHERE s.guest_id = d.guest_id AND s.check_in <= d.check_in) AS trip_start",
        "  FROM done d",
        ")",
        "SELECT guest_id, trip_start, MAX(check_out) AS trip_end, COUNT(*) AS stays,",
        "       GROUP_CONCAT(city ORDER BY check_in SEPARATOR ' > ') AS route",
        "FROM tagged",
        "GROUP BY guest_id, trip_start",
        "HAVING COUNT(*) >= 2",
        "ORDER BY guest_id, trip_start",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Drop cancelled reservations first — they neither link nor break anything.",
      "A stay starts a new trip unless the guest's previous stay checked out on its check-in day.",
      "A running sum of the \"new trip\" flags numbers the trips.",
      "`GROUP_CONCAT(city ORDER BY check_in SEPARATOR ' > ')` builds the route.",
    ],
    editorial: [
      "Trips are islands of stays linked end to start. With the cancelled rows removed, sort each guest's stays by check-in and use `LAG(check_out)` to see the previous stay: if it checked out on this stay's check-in day the stay continues the trip (flag 0), otherwise — including the guest's first stay, where `LAG` is NULL — it starts a new one (flag 1). Because completed stays never overlap, the previous stay in check-in order is the only one that could link.",
      "",
      "A running `SUM` of the flags gives each stay its trip number. Grouping by guest and trip number yields the first check-in, the last check-out, the count and, with `GROUP_CONCAT(city ORDER BY check_in SEPARATOR ' > ')`, the route in travel order — the `ORDER BY` inside the function matters, since group order is otherwise undefined. `HAVING COUNT(*) >= 2` drops single stays. In the example, guest 8's cancelled Osaka booking would have linked on 3 May; the real Osaka stay starts on the 4th, so Kyoto stands alone.",
      "",
      "The alternative identifies trip **starts** directly — completed stays that no other completed stay of the guest checks out into — and tags every stay with the latest start at or before it. It needs no window functions but runs correlated subqueries per stay.",
    ].join("\n"),
  },

  {
    slug: "airbnb-hosts-with-three-cancellations-inside-30-days",
    title: "Airbnb: Hosts With Three Cancellations Inside 30 Days",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "A host cancelling on a guest is one of the worst experiences on Airbnb, and the trust team reviews hosts who do it repeatedly. In this exercise a host is **flagged** once they have **three host cancellations within 30 days** — the third falls no more than 30 days after the first (`DATEDIFF` ≤ 30).",
      "",
      "Only reservations with status `cancelled_by_host` count; their date is `cancelled_on`. For every flagged host, return `host_id` and `flagged_on` — the **earliest date** on which they reached three host cancellations within the preceding 30 days. Several cancellations can share a day. Order the rows by `host_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Reservation",
        columns: [
          { name: "reservation_id", type: "int" },
          { name: "host_id", type: "int" },
          { name: "status", type: "enum", values: ["completed", "cancelled_by_guest", "cancelled_by_host"] },
          { name: "cancelled_on", type: "date" },
        ],
        primaryKey: ["reservation_id"],
        note: "`cancelled_on` is set for both kinds of cancellation and NULL for a completed stay.",
      },
    ],
    examples: [
      {
        Reservation: [
          [1, 5, "cancelled_by_host", "2025-01-03"],
          [2, 5, "cancelled_by_host", "2025-01-20"],
          [3, 5, "cancelled_by_guest", "2025-01-25"],
          [4, 5, "cancelled_by_host", "2025-02-02"],
          [5, 5, "cancelled_by_host", "2025-02-10"],
          [6, 6, "cancelled_by_host", "2025-01-01"],
          [7, 6, "cancelled_by_host", "2025-01-15"],
          [8, 6, "cancelled_by_host", "2025-02-01"],
          [9, 7, "cancelled_by_host", "2025-03-01"],
          [10, 7, "cancelled_by_host", "2025-03-01"],
          [11, 7, "cancelled_by_host", "2025-03-01"],
          [12, 7, "completed", null],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      const h = chance(rng, 0.05) ? 0 : ri(rng, 2, 5);
      for (let host = 1; host <= h; host++) {
        let day = dateBetween(rng, "2025-01-01", "2025-01-20");
        for (let k = ri(rng, 1, 7); k > 0; k--) {
          const status = pick(rng, ["cancelled_by_host", "cancelled_by_host", "cancelled_by_host", "cancelled_by_guest", "completed"]);
          rows.push([id++, host, status, status === "completed" ? null : day]);
          day = addDays(day, pick(rng, [0, 3, 5, 10, 14, 15, 16, 25]));
        }
      }
      return { Reservation: rows };
    },
    solution: [
      "WITH hc AS (",
      "  SELECT host_id, cancelled_on,",
      "         LAG(cancelled_on, 2) OVER (PARTITION BY host_id ORDER BY cancelled_on, reservation_id) AS two_before",
      "  FROM Reservation",
      "  WHERE status = 'cancelled_by_host'",
      ")",
      "SELECT host_id, MIN(cancelled_on) AS flagged_on",
      "FROM hc",
      "WHERE DATEDIFF(cancelled_on, two_before) <= 30",
      "GROUP BY host_id",
      "ORDER BY host_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH hc AS (SELECT reservation_id, host_id, cancelled_on FROM Reservation WHERE status = 'cancelled_by_host')",
        "SELECT a.host_id, MIN(a.cancelled_on) AS flagged_on",
        "FROM hc a",
        "WHERE (SELECT COUNT(*) FROM hc b",
        "       WHERE b.host_id = a.host_id",
        "         AND b.cancelled_on BETWEEN DATE_SUB(a.cancelled_on, INTERVAL 30 DAY) AND a.cancelled_on) >= 3",
        "GROUP BY a.host_id",
        "ORDER BY a.host_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Only host cancellations matter — filter first.",
      "Sort a host's cancellations by date; any three within 30 days include three *consecutive* ones that are within 30 days.",
      "`LAG(cancelled_on, 2)` looks two cancellations back.",
      "The flag date is the earliest cancellation that completes such a window.",
    ],
    editorial: [
      "\"Three events inside any 30-day window\" sounds like it needs every window, but sorting reduces it to neighbours. Put a host's cancellations in date order. If any three fall within 30 days, then the last of them together with the two cancellations immediately before it in the sorted list also fall within 30 days — those two are at least as late as the original pair. So it is enough to compare each cancellation with the one **two places earlier**: `LAG(cancelled_on, 2)`.",
      "",
      "Every cancellation whose date is at most 30 days after its second predecessor completes a window, and the earliest such date per host is `flagged_on`. Same-day cancellations are ordered by `reservation_id` so the window has a fixed order, but the answer is a date, which the tie-break cannot change. The first two cancellations of a host have no second predecessor (NULL), so `DATEDIFF` is NULL and they are skipped. Guest cancellations and completed stays never enter.",
      "",
      "The alternative counts directly: for each host cancellation, how many host cancellations fall in the 30 days up to and including its date (`BETWEEN DATE_SUB(…, INTERVAL 30 DAY) AND …`); three or more flags it. That is a correlated count per row — quadratic per host — where the `LAG` version is one sort.",
    ].join("\n"),
  },

  {
    slug: "airbnb-reconcile-host-payouts-against-earnings",
    title: "Airbnb: Reconcile Host Payouts Against Earnings",
    difficulty: "HARD",
    topics: ["Joins", "Aggregation", "Subqueries", "Conditional Logic"],
    description: [
      "A payments engineer at Airbnb runs a nightly reconciliation between what each reservation earned the host and the payouts actually sent. A reservation can be paid in several transfers, and transfers can fail.",
      "",
      "Only payouts with status `sent` count as paid. A **completed** reservation is **short** when its sent payouts add up to less than its `host_earnings` (no payout at all is short too); the shortfall is the difference. A **cancelled** reservation is **overpaid** when it has any sent payout; the overpayment is the whole sent amount. Upcoming reservations are ignored. For every host with at least one short or overpaid reservation, return `host_id`, `short_reservations`, `short_amount`, `overpaid_reservations` and `overpaid_amount`, ordered by `host_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Reservation",
        columns: [
          { name: "reservation_id", type: "int" },
          { name: "host_id", type: "int" },
          { name: "status", type: "enum", values: ["upcoming", "completed", "cancelled"] },
          { name: "host_earnings", type: "int" },
        ],
        primaryKey: ["reservation_id"],
        note: "`host_earnings` is what the host is owed for the stay, in US dollars.",
      },
      {
        name: "Payout",
        columns: [
          { name: "payout_id", type: "int" },
          { name: "reservation_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["sent", "pending", "failed"] },
        ],
        primaryKey: ["payout_id"],
        note: "One transfer towards a reservation; `reservation_id` always names a reservation.",
      },
    ],
    examples: [
      {
        Reservation: [
          [1, 10, "completed", 500],
          [2, 10, "completed", 300],
          [3, 10, "cancelled", 200],
          [4, 20, "completed", 400],
          [5, 20, "upcoming", 250],
          [6, 30, "completed", 350],
          [7, 30, "cancelled", 150],
        ],
        Payout: [
          [1, 1, 300, "sent"],
          [2, 1, 200, "sent"],
          [3, 2, 300, "failed"],
          [4, 2, 100, "sent"],
          [5, 3, 200, "sent"],
          [6, 4, 400, "sent"],
          [7, 5, 250, "pending"],
          [8, 6, 350, "pending"],
          [9, 7, 150, "failed"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 12);
      const res: Cell[][] = [];
      const pay: Cell[][] = [];
      let pid = 1;
      for (let id = 1; id <= n; id++) {
        const status = pick(rng, ["completed", "completed", "completed", "cancelled", "upcoming"]);
        const earn = roundTo(rng, 100, 900, 50);
        res.push([id, ri(rng, 10, 14), status, earn]);
        const plan = ri(rng, 0, 4);
        if (status === "completed") {
          if (plan === 0) pay.push([pid++, id, earn, "sent"]);
          else if (plan === 1) { pay.push([pid++, id, earn - 50, "sent"]); pay.push([pid++, id, 50, "sent"]); }
          else if (plan === 2) { pay.push([pid++, id, earn - 50, "sent"]); pay.push([pid++, id, 50, pick(rng, ["pending", "failed"])]); }
          else if (plan === 3) pay.push([pid++, id, earn, "failed"]);
        } else if (status === "cancelled") {
          if (plan <= 1) pay.push([pid++, id, earn, plan === 0 ? "sent" : "failed"]);
        } else if (plan <= 2) pay.push([pid++, id, earn, "pending"]);
      }
      return { Reservation: res, Payout: pay };
    },
    solution: [
      "WITH paid AS (",
      "  SELECT reservation_id, SUM(amount) AS sent",
      "  FROM Payout",
      "  WHERE status = 'sent'",
      "  GROUP BY reservation_id",
      "), r AS (",
      "  SELECT res.host_id, res.status, res.host_earnings, COALESCE(p.sent, 0) AS sent",
      "  FROM Reservation res",
      "  LEFT JOIN paid p ON p.reservation_id = res.reservation_id",
      ")",
      "SELECT host_id,",
      "       SUM(CASE WHEN status = 'completed' AND sent < host_earnings THEN 1 ELSE 0 END) AS short_reservations,",
      "       SUM(CASE WHEN status = 'completed' AND sent < host_earnings THEN host_earnings - sent ELSE 0 END) AS short_amount,",
      "       SUM(CASE WHEN status = 'cancelled' AND sent > 0 THEN 1 ELSE 0 END) AS overpaid_reservations,",
      "       SUM(CASE WHEN status = 'cancelled' THEN sent ELSE 0 END) AS overpaid_amount",
      "FROM r",
      "GROUP BY host_id",
      "HAVING SUM(CASE WHEN status = 'completed' AND sent < host_earnings THEN 1 ELSE 0 END)",
      "     + SUM(CASE WHEN status = 'cancelled' AND sent > 0 THEN 1 ELSE 0 END) > 0",
      "ORDER BY host_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT host_id,",
        "       SUM(is_short) AS short_reservations, SUM(is_short * (host_earnings - sent)) AS short_amount,",
        "       SUM(is_over) AS overpaid_reservations, SUM(is_over * sent) AS overpaid_amount",
        "FROM (",
        "  SELECT t.*,",
        "         IF(status = 'completed' AND sent < host_earnings, 1, 0) AS is_short,",
        "         IF(status = 'cancelled' AND sent > 0, 1, 0) AS is_over",
        "  FROM (",
        "    SELECT res.host_id, res.status, res.host_earnings,",
        "           (SELECT IFNULL(SUM(p.amount), 0) FROM Payout p WHERE p.reservation_id = res.reservation_id AND p.status = 'sent') AS sent",
        "    FROM Reservation res",
        "  ) t",
        ") x",
        "GROUP BY host_id",
        "HAVING SUM(is_short) + SUM(is_over) > 0",
        "ORDER BY host_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First total the *sent* payouts per reservation, so each reservation is one row with one paid figure.",
      "A reservation with no sent payout must still appear, with 0 paid — LEFT JOIN and COALESCE.",
      "Joining reservations straight to payouts and then summing earnings would count a reservation once per transfer.",
      "Each of the four figures is a conditional sum per host; the HAVING keeps hosts with any problem.",
    ],
    editorial: [
      "Reconciliation compares two grains — one row per reservation against many payouts per reservation — and the classic bug is to join them directly and sum: a reservation paid in two transfers then counts its `host_earnings` twice. So the payouts are **aggregated to the reservation first**: the `paid` CTE sums only `sent` transfers per reservation (failed and pending ones are not money in the host's account).",
      "",
      "Then every reservation is left-joined to its paid total, with `COALESCE(…, 0)` for reservations that have no sent transfer — those are exactly the \"no payout at all\" short cases, which an inner join would silently drop. Now each reservation is one row with `host_earnings` and `sent`, and the four figures are conditional sums per host: a completed reservation with `sent < host_earnings` counts as short and adds its difference; a cancelled one with `sent > 0` counts as overpaid and adds what was sent. Upcoming reservations meet no condition and add zeros. `HAVING` keeps hosts with at least one problem.",
      "",
      "The alternative computes `sent` with a correlated subquery per reservation and turns the two conditions into 0/1 columns with `IF`, multiplying them into the amounts. Both avoid the fan-out; the CTE version reads `Payout` once.",
    ].join("\n"),
  },

  {
    slug: "airbnb-quote-stays-from-nightly-prices-and-discounts",
    title: "Airbnb: Quote Stays From Nightly Prices and Discounts",
    difficulty: "HARD",
    topics: ["Joins", "Aggregation", "Conditional Logic", "Dates"],
    description: [
      "When a guest picks dates, Airbnb quotes the stay from the host's price for **each night** plus any length-of-stay discount. A pricing engineer is checking quotes against the calendar.",
      "",
      "A request covers the nights from `check_in` up to the night before `check_out`; every one of those nights has a row in `NightlyPrice`. The `nightly_total` is the sum of their prices. The discount is a percentage of `nightly_total`: the listing's `monthly_discount_pct` if the stay is **28 nights or more** and that column is not NULL; otherwise its `weekly_discount_pct` if the stay is **7 nights or more** and that column is not NULL; otherwise none. The `total` is `nightly_total − discount + cleaning_fee` (NULL fee = 0). Return `request_id`, `nights`, `nightly_total`, `discount` and `total` (both rounded to 2 decimal places) for every request, ordered by `request_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Listing",
        columns: [
          { name: "listing_id", type: "int" },
          { name: "cleaning_fee", type: "int" },
          { name: "weekly_discount_pct", type: "int" },
          { name: "monthly_discount_pct", type: "int" },
        ],
        primaryKey: ["listing_id"],
        note: "Discounts are whole percentages; NULL means the host offers none. `cleaning_fee` is NULL when none is charged.",
      },
      {
        name: "NightlyPrice",
        columns: [
          { name: "listing_id", type: "int" },
          { name: "night", type: "date" },
          { name: "price", type: "int" },
        ],
        primaryKey: ["listing_id", "night"],
        note: "The host's price for one night, in US dollars.",
      },
      {
        name: "StayRequest",
        columns: [
          { name: "request_id", type: "int" },
          { name: "listing_id", type: "int" },
          { name: "check_in", type: "date" },
          { name: "check_out", type: "date" },
        ],
        primaryKey: ["request_id"],
        note: "Dates a guest asked to book; `check_out` is after `check_in`.",
      },
    ],
    examples: [
      {
        Listing: [
          [1, 40, 10, 25],
          [2, null, null, 30],
        ],
        NightlyPrice: [
          [1, "2025-02-01", 100], [1, "2025-02-02", 100], [1, "2025-02-03", 100], [1, "2025-02-04", 100],
          [1, "2025-02-05", 100], [1, "2025-02-06", 100], [1, "2025-02-07", 140], [1, "2025-02-08", 140],
          [2, "2025-02-01", 90], [2, "2025-02-02", 90], [2, "2025-02-03", 90], [2, "2025-02-04", 90],
          [2, "2025-02-05", 90], [2, "2025-02-06", 90], [2, "2025-02-07", 110], [2, "2025-02-08", 110],
        ],
        StayRequest: [
          [1, 1, "2025-02-01", "2025-02-08"],
          [2, 1, "2025-02-06", "2025-02-08"],
          [3, 2, "2025-02-01", "2025-02-09"],
          [4, 2, "2025-02-07", "2025-02-08"],
        ],
      },
    ],
    gen: (rng) => {
      const l = ri(rng, 1, 2);
      const listings: Cell[][] = seq(1, l).map((id) => [id, chance(rng, 0.3) ? null : roundTo(rng, 20, 80, 5), chance(rng, 0.3) ? null : pick(rng, [5, 10, 15]), chance(rng, 0.3) ? null : pick(rng, [20, 25, 30])]);
      const span = 32;
      const prices: Cell[][] = [];
      for (let id = 1; id <= l; id++) {
        const base = roundTo(rng, 60, 180, 5);
        for (let d = 0; d < span; d++) {
          const night = addDays("2025-02-01", d);
          prices.push([id, night, d % 7 === 5 || d % 7 === 6 ? base + 30 : base + (chance(rng, 0.2) ? 15 : 0)]);
        }
      }
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 6);
      const reqs: Cell[][] = seq(1, n).map((id) => {
        const nights = pick(rng, [1, 2, 3, 6, 7, 7, 10, 27, 28, 30]);
        const off = ri(rng, 0, span - nights);
        const ci = addDays("2025-02-01", off);
        return [id, ri(rng, 1, l), ci, addDays(ci, nights)];
      });
      return { Listing: listings, NightlyPrice: prices, StayRequest: reqs };
    },
    solution: [
      "WITH nightly AS (",
      "  SELECT q.request_id, q.listing_id, COUNT(*) AS nights, SUM(p.price) AS nightly_total",
      "  FROM StayRequest q",
      "  JOIN NightlyPrice p ON p.listing_id = q.listing_id AND p.night >= q.check_in AND p.night < q.check_out",
      "  GROUP BY q.request_id, q.listing_id",
      "), priced AS (",
      "  SELECT n.request_id, n.nights, n.nightly_total, l.cleaning_fee,",
      "         CASE WHEN n.nights >= 28 AND l.monthly_discount_pct IS NOT NULL THEN l.monthly_discount_pct",
      "              WHEN n.nights >= 7 AND l.weekly_discount_pct IS NOT NULL THEN l.weekly_discount_pct",
      "              ELSE 0 END AS pct",
      "  FROM nightly n",
      "  JOIN Listing l ON l.listing_id = n.listing_id",
      ")",
      "SELECT request_id, nights, nightly_total,",
      "       ROUND(nightly_total * pct / 100, 2) AS discount,",
      "       ROUND(nightly_total - nightly_total * pct / 100 + COALESCE(cleaning_fee, 0), 2) AS total",
      "FROM priced",
      "ORDER BY request_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT request_id, nights, nightly_total, ROUND(disc, 2) AS discount, ROUND(nightly_total - disc + fee, 2) AS total",
        "FROM (",
        "  SELECT q.request_id,",
        "         DATEDIFF(q.check_out, q.check_in) AS nights,",
        "         (SELECT SUM(p.price) FROM NightlyPrice p WHERE p.listing_id = q.listing_id AND p.night BETWEEN q.check_in AND DATE_SUB(q.check_out, INTERVAL 1 DAY)) AS nightly_total,",
        "         (SELECT SUM(p.price) FROM NightlyPrice p WHERE p.listing_id = q.listing_id AND p.night BETWEEN q.check_in AND DATE_SUB(q.check_out, INTERVAL 1 DAY))",
        "           * IF(DATEDIFF(q.check_out, q.check_in) >= 28 AND l.monthly_discount_pct IS NOT NULL, l.monthly_discount_pct,",
        "                IF(DATEDIFF(q.check_out, q.check_in) >= 7, IFNULL(l.weekly_discount_pct, 0), 0)) / 100 AS disc,",
        "         IFNULL(l.cleaning_fee, 0) AS fee",
        "  FROM StayRequest q JOIN Listing l ON l.listing_id = q.listing_id",
        ") t",
        "ORDER BY request_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Join each request to the price rows of its listing whose night falls in `[check_in, check_out)`.",
      "The check-out day is not a night — the upper bound is strict.",
      "Pick the discount with a `CASE` that tests the monthly rule before the weekly one.",
      "A stay of 28+ nights at a listing with no monthly discount still gets the weekly one.",
    ],
    editorial: [
      "A quote has two parts: the nightly total, which comes from a **range join**, and the discount, which is a rule on the stay length. The range join matches each request to every `NightlyPrice` row of its listing with `night >= check_in AND night < check_out` — the check-out morning is not a night, so the bound is strict. Grouping by request gives `COUNT(*)` nights and `SUM(price)`, and since every night has a price row the count equals `DATEDIFF(check_out, check_in)`.",
      "",
      "The discount rate is a `CASE` evaluated top-down: monthly first (28 nights or more *and* a monthly rate exists), then weekly (7 or more *and* a weekly rate exists), else 0. The order of the branches is the rule — a 30-night stay at a listing with only a weekly discount falls through the first branch to the second, which a naive `IF(nights >= 28, monthly, weekly)` would get wrong by returning NULL. The cleaning fee joins as `COALESCE(cleaning_fee, 0)`.",
      "",
      "Whole-dollar totals times whole percentages divided by 100 have at most two decimals, so the rounding is exact. The alternative sums the nights with correlated subqueries and nests `IF`s for the rule. The join version touches each price row once per covering request.",
    ].join("\n"),
  },

  {
    slug: "airbnb-attribute-each-booking-to-its-last-search",
    title: "Airbnb: Attribute Each Booking to Its Last Search",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins", "Dates"],
    description: [
      "Airbnb's search team credits each booking to the search that led to it, to measure which platform's search experience converts. The rule used here is **last search wins**: a booking is attributed to the guest's **latest search for the same city** made **at or before** `booked_at` and **no more than 7 days** before it (exactly 7 days still counts). If two searches share that latest time, the one with the higher `search_id` wins.",
      "",
      "Return **every** booking as `booking_id`, `search_id`, `platform` and `hours_to_book` (whole hours from the search to the booking, `TIMESTAMPDIFF(HOUR, …)`). A booking with no qualifying search has NULL in the last three columns. Order the rows by `booking_id`.",
    ].join("\n"),
    tables: [
      {
        name: "SearchEvent",
        columns: [
          { name: "search_id", type: "int" },
          { name: "guest_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "platform", type: "enum", values: ["web", "ios", "android"] },
          { name: "searched_at", type: "datetime" },
        ],
        primaryKey: ["search_id"],
        note: "One row per search a guest ran for a destination.",
      },
      {
        name: "Booking",
        columns: [
          { name: "booking_id", type: "int" },
          { name: "guest_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "booked_at", type: "datetime" },
        ],
        primaryKey: ["booking_id"],
        note: "One row per confirmed booking; `city` is the booked listing's city.",
      },
    ],
    examples: [
      {
        SearchEvent: [
          [1, 70, "Lisbon", "web", "2025-04-01 09:00:00"],
          [2, 70, "Lisbon", "ios", "2025-04-03 20:00:00"],
          [3, 70, "Porto", "android", "2025-04-04 08:00:00"],
          [4, 71, "Kyoto", "web", "2025-04-02 10:00:00"],
          [5, 71, "Kyoto", "android", "2025-04-02 10:00:00"],
          [6, 72, "Goa", "ios", "2025-03-25 12:00:00"],
          [7, 70, "Lisbon", "web", "2025-04-05 07:00:00"],
        ],
        Booking: [
          [100, 70, "Lisbon", "2025-04-04 21:30:00"],
          [101, 71, "Kyoto", "2025-04-09 10:00:00"],
          [102, 72, "Goa", "2025-04-02 12:00:01"],
          [103, 73, "Bali", "2025-04-05 15:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const cities = sample(rng, STAY_CITIES, ri(rng, 1, 3));
      const searches: Cell[][] = [];
      const bookings: Cell[][] = [];
      const nb = chance(rng, 0.05) ? 0 : ri(rng, 1, 6);
      let sid = 1;
      for (let b = 1; b <= nb; b++) {
        const guest = ri(rng, 70, 73);
        const city = pick(rng, cities);
        const day = dateBetween(rng, "2025-04-08", "2025-04-20");
        const min = ri(rng, 0, 1439);
        bookings.push([100 + b, guest, city, at(day, min)]);
        for (let k = ri(rng, 0, 3); k > 0; k--) {
          const back = chance(rng, 0.2) ? pick(rng, [7 * 1440, 7 * 1440 + 1, 0]) : ri(rng, -600, 9 * 1440);
          searches.push([sid++, guest, chance(rng, 0.8) ? city : pick(rng, cities), pick(rng, ["web", "ios", "android"]), at(day, min - back)]);
          // A twin search at the same moment, for the search_id tie-break.
          if (chance(rng, 0.1)) searches.push([sid++, guest, city, pick(rng, ["web", "ios", "android"]), at(day, min - back)]);
        }
      }
      return { SearchEvent: searches, Booking: bookings };
    },
    solution: [
      "WITH candidates AS (",
      "  SELECT b.booking_id, s.search_id, s.platform,",
      "         TIMESTAMPDIFF(HOUR, s.searched_at, b.booked_at) AS hours_to_book,",
      "         ROW_NUMBER() OVER (PARTITION BY b.booking_id ORDER BY s.searched_at DESC, s.search_id DESC) AS pos",
      "  FROM Booking b",
      "  JOIN SearchEvent s",
      "    ON s.guest_id = b.guest_id AND s.city = b.city",
      "   AND s.searched_at <= b.booked_at",
      "   AND s.searched_at >= DATE_SUB(b.booked_at, INTERVAL 7 DAY)",
      ")",
      "SELECT b.booking_id, c.search_id, c.platform, c.hours_to_book",
      "FROM Booking b",
      "LEFT JOIN candidates c ON c.booking_id = b.booking_id AND c.pos = 1",
      "ORDER BY b.booking_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT t.booking_id, s.search_id, s.platform, TIMESTAMPDIFF(HOUR, s.searched_at, t.booked_at) AS hours_to_book",
        "FROM (",
        "  SELECT b.booking_id, b.booked_at,",
        "         (SELECT s2.search_id FROM SearchEvent s2",
        "          WHERE s2.guest_id = b.guest_id AND s2.city = b.city",
        "            AND s2.searched_at BETWEEN DATE_SUB(b.booked_at, INTERVAL 7 DAY) AND b.booked_at",
        "          ORDER BY s2.searched_at DESC, s2.search_id DESC",
        "          LIMIT 1) AS last_search",
        "  FROM Booking b",
        ") t",
        "LEFT JOIN SearchEvent s ON s.search_id = t.last_search",
        "ORDER BY t.booking_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Join each booking to all the searches that could have led to it — same guest, same city, inside the 7-day window.",
      "`DATE_SUB(booked_at, INTERVAL 7 DAY)` is the window's start; both ends are inclusive.",
      "Rank the candidates per booking, newest first, with `search_id` as the tie-break, and keep the first.",
      "Every booking must be returned — start from `Booking` and LEFT JOIN the winners.",
    ],
    editorial: [
      "Attribution is a **latest-before** lookup with a window. The first step joins each booking to every search that could earn the credit: same guest, same city, `searched_at` no later than `booked_at` and no earlier than `DATE_SUB(booked_at, INTERVAL 7 DAY)`. A search a minute after the booking, or seven days and a minute before, does not qualify; one exactly seven days before does.",
      "",
      "Among a booking's candidates, `ROW_NUMBER() OVER (PARTITION BY booking_id ORDER BY searched_at DESC, search_id DESC)` puts the winner at position 1 — the latest search, and of two searches at the same second the higher id, which makes the result deterministic. `RANK()` would keep both twins and duplicate the booking.",
      "",
      "Every booking must appear, so the final query starts from `Booking` and left-joins only the position-1 candidates; a booking with no qualifying search keeps NULLs in `search_id`, `platform` and `hours_to_book`. Putting `pos = 1` in the `ON` clause rather than `WHERE` is what preserves those rows. The alternative finds the winning id with a correlated `ORDER BY … LIMIT 1` subquery per booking and joins the search back for its platform; it reads more naturally but runs one lookup per booking, which an index on `(guest_id, city, searched_at)` makes cheap.",
    ].join("\n"),
  },
];
