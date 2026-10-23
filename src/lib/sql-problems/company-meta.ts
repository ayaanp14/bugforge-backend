import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, chance, dateBetween, pick, ri, roundTo, sample, shuffle } from "./kit.js";

/**
 * Company set — Meta: the questions a data analyst or data engineer on one of
 * Meta's product teams is plausibly handed — Marketplace sell-through,
 * WhatsApp Business catalogues and conversation windows, Facebook events and
 * groups, Messenger calls, Threads previews, Instagram follow-backs and Reels
 * shopping funnels, Quest store revenue, the ads auction, attribution and
 * budget pacing, the content-moderation queue and its SLAs, and the integrity
 * team's device-linked account clusters. The schemas and data are fictional
 * (nothing here is Meta's real schema or a real figure); the business
 * questions are the ones those teams ask. Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
const pad = (n: number) => String(n).padStart(2, "0");
/** 'YYYY-MM-DD HH:MM:00' from a date and minutes after its midnight (rolls into later days). */
const at = (date: string, minutes: number): string => {
  const d = addDays(date, Math.floor(minutes / 1440));
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${d} ${pad(Math.floor(m / 60))}:${pad(m % 60)}:00`;
};
/** A random minute of a random day in [from, to], as 'YYYY-MM-DD HH:MM:00'. */
const someTime = (rng: () => number, from: string, to: string): string => at(dateBetween(rng, from, to), ri(rng, 0, 1439));

const BUSINESSES = [
  "Chai Point Express", "Rangoli Sarees", "Mumbai Mobile Fix", "Green Leaf Organics", "Kochi Spice Traders",
  "Pune Bike Rentals", "Delhi Dhaba Tiffins", "Jaipur Blue Pottery", "Hyderabad Biryani Co", "Chennai Silk House",
  "FitBharat Studio", "Goa Surf School",
] as const;
const MARKET_CATEGORIES = ["Furniture", "Electronics", "Bikes", "Clothing", "Books", "Home Decor"] as const;
const EVENT_NAMES = [
  "Bengaluru Runners Meetup", "Indie Music Night", "Startup Pitch Day", "Diwali Craft Fair", "Sunday Book Swap",
  "Street Food Walk", "Hackathon Kickoff", "Yoga in the Park",
] as const;
const QUEST_APPS = ["Orbit Golf", "Haunted Haveli", "Cricket Nets VR", "Zen Garden", "Rocket Kart", "Deep Sea Diver", "Rhythm Raja"] as const;
const POST_WORDS = [
  "shipping", "a", "new", "feature", "today", "monsoon", "in", "mumbai", "chai", "or", "coffee", "for", "late", "night",
  "debug", "run", "match", "tonight", "reading", "list", "weekend", "is", "ready", "who", "else", "loves", "biryani",
  "the", "metro", "was", "packed", "again", "finally", "learnt", "sql", "window", "functions",
] as const;

export const COMPANY_META: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "meta-marketplace-listings-sold-within-a-day",
    title: "Meta: Marketplace Listings Sold Within a Day",
    difficulty: "EASY",
    topics: ["Dates", "Basics"],
    description: [
      "A product analyst on Facebook Marketplace is studying which listings sell fast, to decide what the \"sells quickly\" badge should be based on.",
      "",
      "Return every listing that was **sold within 24 hours of being listed** — `sold_at` is at most 24 hours after `listed_at`, and a sale at **exactly** 24 hours still counts. Unsold listings (`sold_at` NULL) never qualify. Return the columns `listing_id`, `category` and `hours_to_sell`, the whole hours between listing and sale (rounded down, so 8 h 30 min is 8), in any order.",
    ].join("\n"),
    tables: [
      {
        name: "MarketplaceListing",
        columns: [
          { name: "listing_id", type: "int" },
          { name: "seller_id", type: "int" },
          { name: "category", type: "varchar" },
          { name: "listed_at", type: "datetime" },
          { name: "sold_at", type: "datetime" },
          { name: "price", type: "int" },
        ],
        primaryKey: ["listing_id"],
        note: "One row per listing. `sold_at` is NULL while the item is unsold; when set it is never before `listed_at`. `price` is in rupees.",
      },
    ],
    examples: [
      {
        MarketplaceListing: [
          [1, 11, "Furniture", "2025-05-01 10:00:00", "2025-05-01 18:30:00", 4500],
          [2, 12, "Electronics", "2025-05-01 09:00:00", "2025-05-02 09:00:00", 12000],
          [3, 13, "Bikes", "2025-05-02 20:15:00", "2025-05-03 20:16:00", 7000],
          [4, 11, "Furniture", "2025-05-03 08:00:00", null, 2500],
          [5, 14, "Clothing", "2025-05-03 12:00:00", "2025-05-03 12:40:00", 800],
          [6, 15, "Electronics", "2025-05-04 07:00:00", "2025-05-09 11:00:00", 30000],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 16);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const day = dateBetween(rng, "2025-05-01", "2025-05-20");
        const start = ri(rng, 0, 1439);
        const r = rng();
        const delta = r < 0.15 ? 1440 : r < 0.25 ? 1441 : r < 0.65 ? ri(rng, 0, 1439) : ri(rng, 1442, 7000);
        return [id, ri(rng, 10, 20), pick(rng, MARKET_CATEGORIES), at(day, start), chance(rng, 0.25) ? null : at(day, start + delta), roundTo(rng, 500, 40000, 500)];
      });
      return { MarketplaceListing: rows };
    },
    solution: [
      "SELECT listing_id, category, TIMESTAMPDIFF(HOUR, listed_at, sold_at) AS hours_to_sell",
      "FROM MarketplaceListing",
      "WHERE sold_at IS NOT NULL",
      "  AND sold_at <= DATE_ADD(listed_at, INTERVAL 24 HOUR)",
    ].join("\n"),
    alternatives: [
      "SELECT listing_id, category, TIMESTAMPDIFF(MINUTE, listed_at, sold_at) DIV 60 AS hours_to_sell FROM MarketplaceListing WHERE TIMESTAMPDIFF(SECOND, listed_at, sold_at) <= 86400",
    ],
    hints: [
      "The deadline of each listing is its own `listed_at` plus 24 hours — `DATE_ADD(listed_at, INTERVAL 24 HOUR)`.",
      "\"Within\" includes the boundary, so compare with `<=`.",
      "`TIMESTAMPDIFF(HOUR, a, b)` already counts whole hours and drops the remainder.",
    ],
    editorial: [
      "Each listing is judged on its own, so this is a filter over one table. The deadline differs per row — it is that listing's `listed_at` plus 24 hours — which is why the comparison uses `DATE_ADD(listed_at, INTERVAL 24 HOUR)` rather than a fixed date. A sale at exactly the deadline is \"within a day\", so the test is `sold_at <=` the deadline, not `<`.",
      "",
      "Unsold listings have `sold_at` NULL. Any comparison with NULL is unknown, so `WHERE` would drop them anyway; the explicit `sold_at IS NOT NULL` just says so. The alternative relies on that: `TIMESTAMPDIFF(SECOND, listed_at, sold_at)` is NULL for an unsold item and the `<= 86400` test removes it.",
      "",
      "For the reported value, `TIMESTAMPDIFF(HOUR, …)` counts complete hours, so 8 h 30 min reads 8 and 40 minutes reads 0; the alternative gets the same number as whole minutes divided by 60 with `DIV`. The query is one scan of the table.",
    ].join("\n"),
  },

  {
    slug: "meta-verified-whatsapp-businesses-without-catalog",
    title: "Meta: Verified WhatsApp Businesses With No Live Catalog Items",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "The WhatsApp Business partnerships team wants to nudge verified businesses that are not yet selling through their catalog.",
      "",
      "Return every business that is **verified** and has **no active catalog item** — a business whose items are all hidden (`is_active` = 0) counts as having none. Unverified businesses are never in the answer. Return the columns `business_id` and `business_name`, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "WaBusiness",
        columns: [
          { name: "business_id", type: "int" },
          { name: "business_name", type: "varchar" },
          { name: "city", type: "varchar" },
          { name: "verified", type: "bool" },
        ],
        primaryKey: ["business_id"],
        note: "One row per WhatsApp Business account. `verified` is 1 once the business passed verification.",
      },
      {
        name: "CatalogItem",
        columns: [
          { name: "item_id", type: "int" },
          { name: "business_id", type: "int" },
          { name: "item_name", type: "varchar" },
          { name: "is_active", type: "bool" },
        ],
        primaryKey: ["item_id"],
        note: "One row per product a business added to its catalog. `is_active` is 0 when the business hid the item; `business_id` always names a business.",
      },
    ],
    examples: [
      {
        WaBusiness: [
          [1, "Chai Point Express", "Bengaluru", 1],
          [2, "Rangoli Sarees", "Jaipur", 1],
          [3, "Mumbai Mobile Fix", "Mumbai", 0],
          [4, "Green Leaf Organics", "Pune", 1],
          [5, "Kochi Spice Traders", "Kochi", 1],
        ],
        CatalogItem: [
          [101, 1, "Masala Chai Flask", 1],
          [102, 2, "Bandhani Saree", 0],
          [103, 2, "Leheriya Dupatta", 0],
          [104, 4, "Cold-Pressed Oil", 1],
          [105, 3, "Screen Guard", 1],
          [106, 4, "Millet Muesli", 0],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const biz: Cell[][] = sample(rng, BUSINESSES, n).map((name, i) => [i + 1, name, pick(rng, ["Bengaluru", "Mumbai", "Pune", "Jaipur", "Kochi", "Delhi"]), chance(rng, 0.75) ? 1 : 0]);
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 16);
      const items: Cell[][] = seq(101, m).map((id) => [id, ri(rng, 1, n), pick(rng, ["Gift Box", "Sample Pack", "Combo Offer", "Classic", "Premium"]), chance(rng, 0.6) ? 1 : 0]);
      return { WaBusiness: biz, CatalogItem: items };
    },
    solution: [
      "SELECT b.business_id, b.business_name",
      "FROM WaBusiness b",
      "LEFT JOIN CatalogItem c ON c.business_id = b.business_id AND c.is_active = 1",
      "WHERE b.verified = 1",
      "  AND c.item_id IS NULL",
    ].join("\n"),
    alternatives: [
      "SELECT b.business_id, b.business_name FROM WaBusiness b WHERE b.verified = 1 AND NOT EXISTS (SELECT 1 FROM CatalogItem c WHERE c.business_id = b.business_id AND c.is_active = 1)",
      "SELECT business_id, business_name FROM WaBusiness WHERE verified = 1 AND business_id NOT IN (SELECT business_id FROM CatalogItem WHERE is_active = 1)",
    ],
    hints: [
      "You are looking for businesses for which a matching row does **not** exist — an anti join.",
      "Only active items should be able to match, so the `is_active = 1` condition belongs to the join (or the subquery), not to the outer `WHERE`.",
      "After a LEFT JOIN, a business with no match has NULL in every column of the item side.",
    ],
    editorial: [
      "The question is about absence: a verified business with **no** active item. The standard tool is an anti join. With a `LEFT JOIN`, every business keeps at least one row; when nothing on the right matches, the item columns come back NULL, and `c.item_id IS NULL` keeps exactly those businesses.",
      "",
      "Where the `is_active = 1` condition sits is the whole problem. In the `ON` clause it limits *which items may match*, so a business whose only items are hidden finds no match and is kept. Moved into `WHERE`, it would run after the join and throw away the NULL rows too, so the businesses with no items at all would vanish — the opposite of what is asked.",
      "",
      "`NOT EXISTS` with the same condition inside the subquery says it most directly, and `NOT IN` works here because `CatalogItem.business_id` is never NULL (a NULL in a `NOT IN` list would make every test unknown). All three read each table once with an index on `CatalogItem.business_id`.",
    ].join("\n"),
  },

  {
    slug: "meta-going-and-interested-per-facebook-event",
    title: "Meta: Going and Interested Counts per Facebook Event",
    difficulty: "EASY",
    topics: ["Conditional Logic", "Aggregation", "Joins"],
    description: [
      "The Facebook Events team shows hosts a small dashboard with how many people answered **Going** and how many **Interested**.",
      "",
      "Return one row for **every event** with the columns `event_id`, `event_name`, `going` (the number of `going` responses) and `interested` (the number of `interested` responses). `declined` responses count in neither column, and an event nobody answered shows 0 and 0. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "FbEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "event_name", type: "varchar" },
          { name: "starts_at", type: "datetime" },
        ],
        primaryKey: ["event_id"],
        note: "One row per event created on Facebook.",
      },
      {
        name: "EventRsvp",
        columns: [
          { name: "event_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "response", type: "enum", values: ["going", "interested", "declined"] },
        ],
        primaryKey: ["event_id", "user_id"],
        note: "A user's current answer to an event's invitation — one row per (event, user).",
      },
    ],
    examples: [
      {
        FbEvent: [
          [1, "Bengaluru Runners Meetup", "2025-07-06 06:00:00"],
          [2, "Indie Music Night", "2025-07-12 19:30:00"],
          [3, "Startup Pitch Day", "2025-07-19 10:00:00"],
          [4, "Diwali Craft Fair", "2025-10-18 11:00:00"],
        ],
        EventRsvp: [
          [1, 10, "going"],
          [1, 11, "going"],
          [1, 12, "interested"],
          [1, 13, "declined"],
          [1, 14, "going"],
          [2, 10, "interested"],
          [2, 14, "interested"],
          [3, 15, "declined"],
        ],
      },
    ],
    gen: (rng) => {
      const events: Cell[][] = sample(rng, EVENT_NAMES, ri(rng, 1, 6)).map((name, i) => [i + 1, name, someTime(rng, "2025-07-01", "2025-10-31")]);
      const rsvps: Cell[][] = [];
      for (const e of events) {
        if (chance(rng, 0.2)) continue;
        for (const u of sample(rng, seq(10, 15), ri(rng, 1, 7))) rsvps.push([e[0]!, u, pick(rng, ["going", "going", "interested", "declined"])]);
      }
      return { FbEvent: events, EventRsvp: rsvps };
    },
    solution: [
      "SELECT e.event_id, e.event_name,",
      "       SUM(CASE WHEN r.response = 'going' THEN 1 ELSE 0 END) AS going,",
      "       SUM(CASE WHEN r.response = 'interested' THEN 1 ELSE 0 END) AS interested",
      "FROM FbEvent e",
      "LEFT JOIN EventRsvp r ON r.event_id = e.event_id",
      "GROUP BY e.event_id, e.event_name",
    ].join("\n"),
    alternatives: [
      "SELECT e.event_id, e.event_name, COUNT(CASE WHEN r.response = 'going' THEN 1 END) AS going, COUNT(CASE WHEN r.response = 'interested' THEN 1 END) AS interested FROM FbEvent e LEFT JOIN EventRsvp r ON r.event_id = e.event_id GROUP BY e.event_id, e.event_name",
      "SELECT e.event_id, e.event_name, (SELECT COUNT(*) FROM EventRsvp r WHERE r.event_id = e.event_id AND r.response = 'going') AS going, (SELECT COUNT(*) FROM EventRsvp r WHERE r.event_id = e.event_id AND r.response = 'interested') AS interested FROM FbEvent e",
    ],
    hints: [
      "Every event must appear, even one with no answers — start from `FbEvent` and LEFT JOIN the responses.",
      "Two counts of different things over the same rows: put the condition inside the aggregate with `CASE`.",
      "Make sure an event with no responses ends with 0, not NULL.",
    ],
    editorial: [
      "Both numbers are counts over the same set of rows — one event's responses — split by the value of `response`. That is **conditional aggregation**: group once per event and let `SUM(CASE WHEN response = 'going' THEN 1 ELSE 0 END)` count only the matching rows, with a second `CASE` for `interested`. Declined answers fall into the `ELSE 0` of both and add nothing.",
      "",
      "Events with no answers must still be listed, so the join is a `LEFT JOIN` from `FbEvent`. Such an event gets one row with NULL `response`; the `CASE` turns it into 0 for both columns, so the sums are 0 rather than NULL. `COUNT(CASE WHEN … THEN 1 END)` is the same idea — `COUNT` skips the NULLs the `CASE` produces and returns 0 for an empty group.",
      "",
      "Correlated `COUNT(*)` subqueries per event are the third option; they read the responses twice per event but say each number on its own. With an index on `EventRsvp(event_id)` all of them are a single pass over the responses.",
    ].join("\n"),
  },

  {
    slug: "meta-ad-accounts-over-their-september-limit",
    title: "Meta: Ad Accounts That Overspent Their September Limit",
    difficulty: "EASY",
    topics: ["Aggregation", "Joins", "Dates"],
    description: [
      "Every ad account on Meta's ads platform carries a monthly spending limit, and the billing-risk team reviews accounts that went past it.",
      "",
      "Return the accounts whose total spend in **September 2025** (2025-09-01 to 2025-09-30 inclusive) is **strictly greater** than their `monthly_limit`, with the columns `account_id`, `business_name` and `september_spend`. Spend on other dates does not count, and spend exactly equal to the limit is not over it. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "AdAccount",
        columns: [
          { name: "account_id", type: "int" },
          { name: "business_name", type: "varchar" },
          { name: "monthly_limit", type: "int" },
        ],
        primaryKey: ["account_id"],
        note: "One row per ad account; `monthly_limit` is in rupees.",
      },
      {
        name: "AdSpend",
        columns: [
          { name: "spend_id", type: "int" },
          { name: "account_id", type: "int" },
          { name: "spend_date", type: "date" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["spend_id"],
        note: "One row per billed charge; an account can have several on one day. `account_id` always names an account.",
      },
    ],
    examples: [
      {
        AdAccount: [
          [1, "Chai Point Express", 50000],
          [2, "Rangoli Sarees", 30000],
          [3, "FitBharat Studio", 40000],
          [4, "Kochi Spice Traders", 20000],
        ],
        AdSpend: [
          [1, 1, "2025-09-03", 30000],
          [2, 1, "2025-09-20", 25000],
          [3, 2, "2025-09-10", 30000],
          [4, 2, "2025-08-31", 9000],
          [5, 3, "2025-09-30", 41000],
          [6, 4, "2025-10-01", 25000],
          [7, 3, "2025-09-01", 500],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 6);
      const accounts: Cell[][] = sample(rng, BUSINESSES, n).map((name, i) => [i + 1, name, roundTo(rng, 10000, 40000, 5000)]);
      const m = chance(rng, 0.05) ? 0 : ri(rng, 2, 18);
      const spend: Cell[][] = seq(1, m).map((id) => [
        id,
        ri(rng, 1, n),
        chance(rng, 0.2) ? pick(rng, ["2025-08-31", "2025-09-01", "2025-09-30", "2025-10-01"]) : dateBetween(rng, "2025-08-25", "2025-10-05"),
        roundTo(rng, 5000, 30000, 5000),
      ]);
      return { AdAccount: accounts, AdSpend: spend };
    },
    solution: [
      "SELECT a.account_id, a.business_name, SUM(s.amount) AS september_spend",
      "FROM AdAccount a",
      "JOIN AdSpend s ON s.account_id = a.account_id",
      "WHERE s.spend_date BETWEEN '2025-09-01' AND '2025-09-30'",
      "GROUP BY a.account_id, a.business_name, a.monthly_limit",
      "HAVING SUM(s.amount) > a.monthly_limit",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.account_id, a.business_name, t.september_spend",
        "FROM AdAccount a",
        "JOIN (SELECT account_id, SUM(amount) AS september_spend FROM AdSpend",
        "      WHERE YEAR(spend_date) = 2025 AND MONTH(spend_date) = 9 GROUP BY account_id) t ON t.account_id = a.account_id",
        "WHERE t.september_spend > a.monthly_limit",
      ].join("\n"),
    ],
    hints: [
      "Filter the charges to September before adding them up.",
      "A condition on a sum belongs in `HAVING`, which runs after the groups are formed.",
      "To compare with the limit in `HAVING`, the limit must be part of the grouping (or come from a join after the sum).",
    ],
    editorial: [
      "The rule compares a total with a per-account number, so the plan is: keep only September's charges, add them up per account, and keep the accounts whose total beats the limit. The date filter is a `WHERE` (it removes rows before grouping); the comparison with the sum is a `HAVING` (it removes whole groups after).",
      "",
      "`HAVING SUM(s.amount) > a.monthly_limit` needs `monthly_limit` to be a grouped value, so it is listed in `GROUP BY` — it is one value per account anyway. The comparison is strict, so an account that spent exactly its limit stays out, and the charges on 31 August and 1 October fall outside `BETWEEN '2025-09-01' AND '2025-09-30'`. An account with no September charges forms no group and is never reported.",
      "",
      "The alternative computes the September totals in a derived table first and compares them in an ordinary `WHERE` after joining, using `YEAR`/`MONTH` for the date test. Both scan the charges once.",
    ].join("\n"),
  },

  {
    slug: "meta-threads-posts-cut-off-in-feed-preview",
    title: "Meta: Threads Posts Cut Off in the Feed Preview",
    difficulty: "EASY",
    topics: ["Strings"],
    description: [
      "On a compact feed card, Threads shows only the first 40 characters of a post and adds an ellipsis. A designer wants to see exactly what those cards will look like.",
      "",
      "Return every post whose `body` is **longer than 40 characters**, with the columns `post_id` and `preview` — the first 40 characters of the body followed by `...` (three dots). A post of exactly 40 characters fits and is not returned. Return the rows **ordered by `post_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "ThreadsPost",
        columns: [
          { name: "post_id", type: "int" },
          { name: "author_handle", type: "varchar" },
          { name: "body", type: "varchar" },
          { name: "posted_at", type: "datetime" },
        ],
        primaryKey: ["post_id"],
        note: "One row per Threads post. `body` is plain text (letters, digits, spaces, punctuation) and is never NULL.",
      },
    ],
    examples: [
      {
        ThreadsPost: [
          [1, "chai.coder", "Shipping a new feature today, wish me luck", "2025-08-01 09:15:00"],
          [2, "mumbai.rains", "Who else is watching the match tonight??", "2025-08-01 19:40:00"],
          [3, "tabs.forever", "Hot take: tabs beat spaces, fight me", "2025-08-02 11:05:00"],
          [4, "run.priya", "Finished my first marathon in under five hours!!", "2025-08-03 07:30:00"],
          [5, "late.night.dev", "Chai or coffee for a late night debug run", "2025-08-03 23:55:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 12);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const target = chance(rng, 0.3) ? pick(rng, [39, 40, 41]) : ri(rng, 15, 70);
        let body = "";
        while (body.length < target) body += (body ? " " : "") + pick(rng, POST_WORDS);
        body = body.slice(0, target);
        if (body.endsWith(" ")) body = `${body.slice(0, -1)}!`;
        body = body[0]!.toUpperCase() + body.slice(1);
        return [id, pick(rng, ["chai.coder", "run.priya", "metro.diaries", "sql.nerd", "biryani.hunter"]), body, someTime(rng, "2025-08-01", "2025-08-31")];
      });
      return { ThreadsPost: shuffle(rng, rows) };
    },
    solution: [
      "SELECT post_id, CONCAT(LEFT(body, 40), '...') AS preview",
      "FROM ThreadsPost",
      "WHERE CHAR_LENGTH(body) > 40",
      "ORDER BY post_id",
    ].join("\n"),
    alternatives: [
      "SELECT post_id, CONCAT(SUBSTRING(body, 1, 40), '...') AS preview FROM ThreadsPost WHERE LENGTH(body) >= 41 ORDER BY post_id",
    ],
    ordered: true,
    hints: [
      "`CHAR_LENGTH(body)` tells you whether the post fits.",
      "`LEFT(body, 40)` is the visible part; `CONCAT` glues the dots on.",
      "\"Longer than 40\" is strict — a 40-character post is shown in full.",
    ],
    editorial: [
      "Two string functions do the work. The filter is a length test: `CHAR_LENGTH(body) > 40` keeps only the posts the card would cut, and the strict `>` lets a post of exactly 40 characters through untouched, since it fits. The preview is the visible part plus the marker: `LEFT(body, 40)` takes the first 40 characters and `CONCAT(…, '...')` appends the three dots.",
      "",
      "`CHAR_LENGTH` counts characters, while `LENGTH` counts bytes in MySQL; for this plain ASCII text they agree, which is why the alternative's `LENGTH(body) >= 41` gives the same rows, and `SUBSTRING(body, 1, 40)` is the same cut as `LEFT`. On text with emoji or Devanagari the byte count would be larger, so `CHAR_LENGTH` is the safer habit.",
      "",
      "The statement fixes the order, so the query ends with `ORDER BY post_id`. It is one scan of the table.",
    ].join("\n"),
  },

  {
    slug: "meta-messenger-video-call-minutes-by-weekday",
    title: "Meta: Messenger Video Call Minutes by Day of the Week",
    difficulty: "EASY",
    topics: ["Dates", "Aggregation"],
    description: [
      "The Messenger calling team wants to know on which days of the week people make video calls, to plan when to roll out a new video codec.",
      "",
      "Considering **video calls only**, return one row per weekday that has at least one, with the columns `day_name` (the full English name, e.g. `Monday`), `calls` (the number of video calls started that day of the week) and `total_minutes` (their summed `duration_minutes`). Order the rows by the weekday, **Monday first and Sunday last**.",
    ].join("\n"),
    tables: [
      {
        name: "MessengerCall",
        columns: [
          { name: "call_id", type: "int" },
          { name: "caller_id", type: "int" },
          { name: "call_type", type: "enum", values: ["audio", "video"] },
          { name: "started_at", type: "datetime" },
          { name: "duration_minutes", type: "int" },
        ],
        primaryKey: ["call_id"],
        note: "One row per connected call; `duration_minutes` is the call's length in whole minutes.",
      },
    ],
    examples: [
      {
        MessengerCall: [
          [1, 10, "video", "2025-06-02 20:10:00", 25],
          [2, 11, "audio", "2025-06-02 21:00:00", 40],
          [3, 12, "video", "2025-06-04 19:30:00", 12],
          [4, 10, "video", "2025-06-08 11:00:00", 60],
          [5, 13, "video", "2025-06-09 08:15:00", 5],
          [6, 14, "audio", "2025-06-06 18:00:00", 15],
          [7, 12, "video", "2025-06-07 22:45:00", 33],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 18);
      const rows: Cell[][] = seq(1, n).map((id) => [id, ri(rng, 10, 20), chance(rng, 0.65) ? "video" : "audio", someTime(rng, "2025-06-01", "2025-06-28"), ri(rng, 1, 90)]);
      return { MessengerCall: rows };
    },
    solution: [
      "SELECT DAYNAME(started_at) AS day_name, COUNT(*) AS calls, SUM(duration_minutes) AS total_minutes",
      "FROM MessengerCall",
      "WHERE call_type = 'video'",
      "GROUP BY DAYNAME(started_at), WEEKDAY(started_at)",
      "ORDER BY WEEKDAY(started_at)",
    ].join("\n"),
    alternatives: [
      [
        "SELECT day_name, COUNT(*) AS calls, SUM(duration_minutes) AS total_minutes",
        "FROM (SELECT DAYNAME(started_at) AS day_name, MOD(DAYOFWEEK(started_at) + 5, 7) AS wd, duration_minutes",
        "      FROM MessengerCall WHERE call_type = 'video') v",
        "GROUP BY day_name, wd",
        "ORDER BY wd",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`DAYNAME(started_at)` gives the label; group by it.",
      "Sorting the names alphabetically would put Friday first — sort by a weekday number instead.",
      "`WEEKDAY()` numbers Monday 0 … Sunday 6, which is exactly the order asked for.",
    ],
    editorial: [
      "Filter to video calls, then group by the day of the week each call started on and count and sum within each group. `DAYNAME(started_at)` gives the label the statement wants, so it is the grouping key.",
      "",
      "The order is the catch. Sorting by `day_name` would be alphabetical — Friday, Monday, Saturday … — so the query sorts by a number instead. `WEEKDAY()` returns 0 for Monday up to 6 for Sunday, exactly the requested order; it is added to `GROUP BY` (it is determined by the day name anyway) so that it may be used in `ORDER BY` under strict grouping rules. Weekdays with no video call form no group and are simply absent.",
      "",
      "The alternative builds the same number from `DAYOFWEEK()` (Sunday 1 … Saturday 7): `MOD(DAYOFWEEK(d) + 5, 7)` maps Monday to 0 and Sunday to 6, computed in a derived table so the outer query can group and sort by it. Both are a single scan.",
    ].join("\n"),
  },

  {
    slug: "meta-moderation-reports-reviewed-past-sla",
    title: "Meta: Moderation Reports Reviewed Past Their SLA",
    difficulty: "EASY",
    topics: ["Joins", "Dates"],
    description: [
      "Meta's content-moderation queue gives every report a priority, and each priority has a service-level target: the maximum number of hours a report may wait for a reviewer's decision.",
      "",
      "Return every **reviewed** report whose review took **longer than** its priority's `max_hours`, measured from `created_at` to `reviewed_at` in whole minutes. A review finished exactly at the limit is on time, and reports not yet reviewed (`reviewed_at` NULL) are not part of this list. Return the columns `report_id`, `priority` and `minutes_to_review`, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "SlaPolicy",
        columns: [
          { name: "priority", type: "enum", values: ["P0", "P1", "P2"] },
          { name: "max_hours", type: "int" },
        ],
        primaryKey: ["priority"],
        note: "The review-time target of each priority.",
      },
      {
        name: "ModReport",
        columns: [
          { name: "report_id", type: "int" },
          { name: "content_id", type: "int" },
          { name: "priority", type: "enum", values: ["P0", "P1", "P2"] },
          { name: "created_at", type: "datetime" },
          { name: "reviewed_at", type: "datetime" },
        ],
        primaryKey: ["report_id"],
        note: "One row per report in the queue. Every priority used here is in `SlaPolicy`; times are recorded to the minute.",
      },
    ],
    examples: [
      {
        SlaPolicy: [
          ["P0", 1],
          ["P1", 4],
          ["P2", 24],
        ],
        ModReport: [
          [1, 9001, "P0", "2025-04-10 10:00:00", "2025-04-10 10:45:00"],
          [2, 9002, "P0", "2025-04-10 11:00:00", "2025-04-10 12:30:00"],
          [3, 9003, "P1", "2025-04-10 09:00:00", "2025-04-10 13:00:00"],
          [4, 9004, "P1", "2025-04-10 09:00:00", null],
          [5, 9005, "P2", "2025-04-09 08:00:00", "2025-04-10 09:15:00"],
          [6, 9006, "P2", "2025-04-09 20:00:00", "2025-04-10 06:00:00"],
          [7, 9007, "P1", "2025-04-11 23:30:00", "2025-04-12 03:31:00"],
        ],
      },
    ],
    gen: (rng) => {
      const hours: Record<string, number> = { P0: pick(rng, [1, 2]), P1: pick(rng, [4, 6, 8]), P2: pick(rng, [24, 48]) };
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 16);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const pr = pick(rng, ["P0", "P1", "P2"]);
        const limit = hours[pr]! * 60;
        const day = dateBetween(rng, "2025-04-01", "2025-04-20");
        const start = ri(rng, 0, 1439);
        const r = rng();
        const delta = r < 0.2 ? limit : r < 0.3 ? limit + 1 : ri(rng, 1, limit * 2);
        return [id, 9000 + id, pr, at(day, start), chance(rng, 0.2) ? null : at(day, start + delta)];
      });
      return { SlaPolicy: Object.entries(hours).map(([p, h]) => [p, h]), ModReport: rows };
    },
    solution: [
      "SELECT r.report_id, r.priority, TIMESTAMPDIFF(MINUTE, r.created_at, r.reviewed_at) AS minutes_to_review",
      "FROM ModReport r",
      "JOIN SlaPolicy s ON s.priority = r.priority",
      "WHERE r.reviewed_at IS NOT NULL",
      "  AND TIMESTAMPDIFF(MINUTE, r.created_at, r.reviewed_at) > s.max_hours * 60",
    ].join("\n"),
    alternatives: [
      "SELECT r.report_id, r.priority, TIMESTAMPDIFF(MINUTE, r.created_at, r.reviewed_at) AS minutes_to_review FROM ModReport r JOIN SlaPolicy s ON s.priority = r.priority WHERE r.reviewed_at > DATE_ADD(r.created_at, INTERVAL s.max_hours HOUR)",
      "SELECT report_id, priority, TIMESTAMPDIFF(MINUTE, created_at, reviewed_at) AS minutes_to_review FROM ModReport r WHERE TIMESTAMPDIFF(MINUTE, created_at, reviewed_at) > 60 * (SELECT max_hours FROM SlaPolicy s WHERE s.priority = r.priority)",
    ],
    hints: [
      "Each report's limit lives in another table — join on `priority`.",
      "Compare like with like: minutes against `max_hours * 60`, or a deadline built with `DATE_ADD`.",
      "A NULL `reviewed_at` makes any comparison unknown, which `WHERE` treats as false.",
    ],
    editorial: [
      "Every report has to be checked against the target of its own priority, so the query joins `ModReport` to `SlaPolicy` on `priority`; after that each row carries both its timestamps and its limit, and the rest is a filter.",
      "",
      "The waiting time is `TIMESTAMPDIFF(MINUTE, created_at, reviewed_at)` and the limit in the same unit is `max_hours * 60`. Late means strictly more, so a review that lands exactly on the limit (240 minutes for a 4-hour P1) is on time. An unreviewed report has a NULL `reviewed_at`, which makes the difference NULL and the comparison unknown, so it drops out; the explicit `IS NOT NULL` documents that.",
      "",
      "The first alternative builds a deadline instead — `DATE_ADD(created_at, INTERVAL max_hours HOUR)` — and compares timestamps; the second looks the limit up with a correlated scalar subquery rather than a join. `SlaPolicy` has three rows, so every version is one pass over the reports.",
    ].join("\n"),
  },

  {
    slug: "meta-quest-apps-rated-by-three-players",
    title: "Meta: Quest Store Apps Rated by at Least Three Players",
    difficulty: "EASY",
    topics: ["Aggregation", "Joins"],
    description: [
      "The Quest Store hides an app's rating summary until enough different people have rated it. A player may rate an app again after an update, and every rating is kept as its own row.",
      "",
      "Return every app rated by **at least three different players**, with the columns `app_name`, `players` (the number of distinct players who rated it) and `ratings` (the number of rating rows, re-ratings included). Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "QuestApp",
        columns: [
          { name: "app_id", type: "int" },
          { name: "app_name", type: "varchar" },
          { name: "genre", type: "varchar" },
        ],
        primaryKey: ["app_id"],
        note: "One row per app in the store; names are unique.",
      },
      {
        name: "AppRating",
        columns: [
          { name: "rating_id", type: "int" },
          { name: "app_id", type: "int" },
          { name: "player_id", type: "int" },
          { name: "stars", type: "int" },
          { name: "rated_at", type: "date" },
        ],
        primaryKey: ["rating_id"],
        note: "One row per rating submitted (1–5 stars). The same player can appear more than once for an app.",
      },
    ],
    examples: [
      {
        QuestApp: [
          [1, "Orbit Golf", "Sports"],
          [2, "Haunted Haveli", "Horror"],
          [3, "Cricket Nets VR", "Sports"],
          [4, "Zen Garden", "Relaxation"],
        ],
        AppRating: [
          [1, 1, 21, 4, "2025-03-01"],
          [2, 1, 22, 5, "2025-03-02"],
          [3, 1, 21, 5, "2025-03-20"],
          [4, 1, 23, 3, "2025-03-21"],
          [5, 2, 21, 2, "2025-03-05"],
          [6, 2, 22, 4, "2025-03-06"],
          [7, 2, 22, 5, "2025-03-15"],
          [8, 3, 24, 5, "2025-03-07"],
          [9, 3, 25, 4, "2025-03-07"],
          [10, 3, 26, 4, "2025-03-08"],
          [11, 3, 27, 1, "2025-03-09"],
        ],
      },
    ],
    gen: (rng) => {
      const apps: Cell[][] = sample(rng, QUEST_APPS, ri(rng, 1, 6)).map((name, i) => [i + 1, name, pick(rng, ["Sports", "Horror", "Racing", "Puzzle", "Relaxation"])]);
      const rows: Cell[][] = [];
      for (const a of apps) {
        const players = sample(rng, seq(21, 8), ri(rng, 0, 5));
        for (const p of players) {
          const times = chance(rng, 0.3) ? 2 : 1;
          for (let k = 0; k < times; k++) rows.push([0, a[0]!, p, ri(rng, 1, 5), dateBetween(rng, "2025-03-01", "2025-03-31")]);
        }
      }
      shuffle(rng, rows).forEach((r, i) => (r[0] = i + 1));
      return { QuestApp: apps, AppRating: rows };
    },
    solution: [
      "SELECT q.app_name, COUNT(DISTINCT r.player_id) AS players, COUNT(*) AS ratings",
      "FROM QuestApp q",
      "JOIN AppRating r ON r.app_id = q.app_id",
      "GROUP BY q.app_id, q.app_name",
      "HAVING COUNT(DISTINCT r.player_id) >= 3",
    ].join("\n"),
    alternatives: [
      [
        "SELECT q.app_name, p.players, c.ratings",
        "FROM QuestApp q",
        "JOIN (SELECT app_id, COUNT(*) AS players FROM (SELECT DISTINCT app_id, player_id FROM AppRating) d GROUP BY app_id) p ON p.app_id = q.app_id",
        "JOIN (SELECT app_id, COUNT(*) AS ratings FROM AppRating GROUP BY app_id) c ON c.app_id = q.app_id",
        "WHERE p.players >= 3",
      ].join("\n"),
    ],
    hints: [
      "Two different counts per app: the rows, and the different players among them.",
      "`COUNT(DISTINCT player_id)` counts a player once however many times they rated.",
      "Filter on the distinct count in `HAVING`.",
    ],
    editorial: [
      "The threshold is about *people*, not rows: a player who rated an app twice must count once. `COUNT(DISTINCT r.player_id)` does exactly that within each app's group, while a plain `COUNT(*)` in the same `SELECT` counts every rating row, re-ratings included — the two columns the statement asks for.",
      "",
      "The rule then goes in `HAVING`, because it is a condition on an aggregate: `HAVING COUNT(DISTINCT r.player_id) >= 3`. Apps with no ratings never join and so never appear, which is right since zero is below three. In the example, Orbit Golf has four ratings from three players and qualifies, Haunted Haveli has three ratings from only two players and does not.",
      "",
      "The alternative makes the distinct count explicit: it first reduces the ratings to distinct (app, player) pairs and counts those, counts the raw rows in a second derived table, and joins both to the apps. It is longer but shows what `COUNT(DISTINCT …)` does. Both are a scan plus a sort or hash per app.",
    ].join("\n"),
  },

  // ──────────────────────────── MEDIUM ────────────────────────────
  {
    slug: "meta-ad-set-metrics-unpivoted-to-long-format",
    title: "Meta: Ad Set Metrics Unpivoted Into Long Format",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Subqueries", "Dates"],
    description: [
      "Ads reporting stores one wide row per ad set per day, a column per metric. A new dashboard charting library wants **long format** instead: one row per (ad set, metric) with the metric's name as a value. A NULL means the metric is not tracked for that ad set on that day — it is not zero.",
      "",
      "For **September 2025** (2025-09-01 to 2025-09-30 inclusive), return `ad_set_id`, `metric` (one of `impressions`, `clicks`, `leads`, `spend`) and `total` (the sum of that metric's non-NULL values). Return a row only when the metric has **at least one non-NULL value** for the ad set in September — a total of 0 from real zeros is still returned. Order the rows by `ad_set_id`, then by metric in the fixed order **impressions, clicks, leads, spend**.",
    ].join("\n"),
    tables: [
      {
        name: "AdSetDaily",
        columns: [
          { name: "ad_set_id", type: "int" },
          { name: "stat_date", type: "date" },
          { name: "impressions", type: "int" },
          { name: "clicks", type: "int" },
          { name: "leads", type: "int" },
          { name: "spend", type: "int" },
        ],
        primaryKey: ["ad_set_id", "stat_date"],
        note: "One row per ad set per day of delivery. `spend` is in rupees; any metric can be NULL when it was not tracked.",
      },
    ],
    examples: [
      {
        AdSetDaily: [
          [1, "2025-09-01", 1000, 40, null, 500],
          [1, "2025-09-02", 1500, 60, null, 700],
          [2, "2025-09-01", 800, 10, 3, 300],
          [2, "2025-08-31", 5000, 100, 9, 900],
          [3, "2025-09-05", 0, 0, 0, 0],
          [3, "2025-09-06", 200, null, 1, 100],
          [4, "2025-10-01", 100, 1, 0, 50],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      if (!chance(rng, 0.05)) {
        for (const set of seq(1, ri(rng, 1, 5))) {
          const tracksLeads = chance(rng, 0.5);
          for (const d of sample(rng, ["2025-08-30", "2025-08-31", "2025-09-01", "2025-09-02", "2025-09-14", "2025-09-29", "2025-09-30", "2025-10-01"], ri(rng, 1, 4))) {
            const imp = chance(rng, 0.1) ? 0 : roundTo(rng, 100, 3000, 100);
            const nul = <T,>(v: T): T | null => (chance(rng, 0.12) ? null : v);
            rows.push([set, d, nul(imp), nul(Math.floor(imp / ri(rng, 10, 50))), tracksLeads ? nul(ri(rng, 0, 4)) : null, nul(roundTo(rng, 0, 1500, 50))]);
          }
        }
      }
      return { AdSetDaily: shuffle(rng, rows) };
    },
    solution: [
      "WITH tall AS (",
      "  SELECT ad_set_id, 1 AS pos, 'impressions' AS metric, impressions AS val FROM AdSetDaily WHERE stat_date BETWEEN '2025-09-01' AND '2025-09-30'",
      "  UNION ALL",
      "  SELECT ad_set_id, 2, 'clicks', clicks FROM AdSetDaily WHERE stat_date BETWEEN '2025-09-01' AND '2025-09-30'",
      "  UNION ALL",
      "  SELECT ad_set_id, 3, 'leads', leads FROM AdSetDaily WHERE stat_date BETWEEN '2025-09-01' AND '2025-09-30'",
      "  UNION ALL",
      "  SELECT ad_set_id, 4, 'spend', spend FROM AdSetDaily WHERE stat_date BETWEEN '2025-09-01' AND '2025-09-30'",
      ")",
      "SELECT ad_set_id, metric, SUM(val) AS total",
      "FROM tall",
      "WHERE val IS NOT NULL",
      "GROUP BY ad_set_id, pos, metric",
      "ORDER BY ad_set_id, pos",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.ad_set_id, m.metric,",
        "       SUM(CASE m.pos WHEN 1 THEN a.impressions WHEN 2 THEN a.clicks WHEN 3 THEN a.leads ELSE a.spend END) AS total",
        "FROM AdSetDaily a",
        "CROSS JOIN (SELECT 1 AS pos, 'impressions' AS metric UNION ALL SELECT 2, 'clicks' UNION ALL SELECT 3, 'leads' UNION ALL SELECT 4, 'spend') m",
        "WHERE a.stat_date BETWEEN '2025-09-01' AND '2025-09-30'",
        "GROUP BY a.ad_set_id, m.pos, m.metric",
        "HAVING COUNT(CASE m.pos WHEN 1 THEN a.impressions WHEN 2 THEN a.clicks WHEN 3 THEN a.leads ELSE a.spend END) > 0",
        "ORDER BY a.ad_set_id, m.pos",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Each metric column becomes its own `SELECT ad_set_id, 'name' AS metric, column AS val …`; `UNION ALL` stacks them.",
      "Carry a small sort number with each metric — the requested order is not alphabetical.",
      "Drop NULL values before grouping, so an untracked metric produces no group at all, while real zeros still do.",
    ],
    editorial: [
      "Unpivoting turns columns into rows. MySQL has no `UNPIVOT`, so each metric column gets its own `SELECT` that emits the ad set, the metric's name as a string literal and the column's value, and `UNION ALL` stacks the four results into one tall table of (ad set, metric, value). `UNION ALL` matters: plain `UNION` would collapse two days with the same value into one row and undercount the sums. Each branch carries a sort number, because the requested order — impressions, clicks, leads, spend — is the funnel's order, not the alphabet's.",
      "",
      "Once the data is tall, the rest is an ordinary aggregation. Filtering `val IS NOT NULL` before grouping removes untracked days, so a metric that is NULL on every September day of an ad set forms no group and is not returned, while a metric whose values are real zeros still forms a group with total 0. The date filter in every branch keeps August and October out.",
      "",
      "The alternative unpivots with a `CROSS JOIN` to a four-row metric list and a `CASE` that picks the column for each metric; `HAVING COUNT(…) > 0` plays the role of the NULL filter, since `COUNT` of an expression skips NULLs. Both read the table four times' worth of values, which is the size of the result before grouping.",
    ].join("\n"),
  },

  {
    slug: "meta-last-click-attributed-revenue-by-campaign",
    title: "Meta: Last-Click Attributed Revenue by Campaign",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Joins", "Dates"],
    description: [
      "Meta's ads measurement team credits each purchase on an advertiser's site to one ad campaign with a **last-click, 7-day** rule: the purchase goes to the campaign of the same user's **latest ad click at or before the purchase time**, provided that click happened **no more than 7 days (exactly 7 days still counts) before** the purchase. If two of the user's clicks share the latest time, the one with the **larger `click_id`** wins. A purchase with no qualifying click is credited to nobody.",
      "",
      "Return every campaign credited with at least one purchase, with the columns `campaign_id`, `purchases` (purchases credited to it) and `revenue` (their summed `amount`), in any order.",
    ].join("\n"),
    tables: [
      {
        name: "AdClick",
        columns: [
          { name: "click_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "campaign_id", type: "int" },
          { name: "clicked_at", type: "datetime" },
        ],
        primaryKey: ["click_id"],
        note: "One row per click on an ad.",
      },
      {
        name: "Purchase",
        columns: [
          { name: "purchase_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "purchased_at", type: "datetime" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["purchase_id"],
        note: "One row per purchase reported by the advertiser's conversion tracking, in rupees.",
      },
    ],
    examples: [
      {
        AdClick: [
          [1, 1, 701, "2025-09-01 10:00:00"],
          [2, 1, 702, "2025-09-03 12:00:00"],
          [3, 2, 701, "2025-09-02 09:00:00"],
          [4, 3, 703, "2025-08-20 08:00:00"],
          [5, 4, 702, "2025-09-05 18:00:00"],
          [6, 4, 703, "2025-09-05 18:00:00"],
          [7, 2, 702, "2025-09-06 20:00:00"],
        ],
        Purchase: [
          [1, 1, "2025-09-04 09:00:00", 1200],
          [2, 2, "2025-09-05 10:00:00", 800],
          [3, 3, "2025-09-01 09:00:00", 500],
          [4, 4, "2025-09-12 18:00:00", 2000],
          [5, 1, "2025-09-09 11:00:00", 300],
          [6, 5, "2025-09-10 10:00:00", 450],
        ],
      },
    ],
    gen: (rng) => {
      const users = ri(rng, 2, 6);
      const clicks: Cell[][] = [];
      const nc = chance(rng, 0.05) ? 0 : ri(rng, 2, 14);
      for (let i = 0; i < nc; i++) {
        const user = ri(rng, 1, users);
        const t = chance(rng, 0.15) && clicks.length ? (pick(rng, clicks)[3] as string) : someTime(rng, "2025-09-01", "2025-09-15");
        clicks.push([0, user, pick(rng, [701, 702, 703, 704]), t]);
      }
      shuffle(rng, clicks).forEach((c, i) => (c[0] = i + 1));
      const np = ri(rng, 1, 10);
      const purchases: Cell[][] = seq(1, np).map((id) => {
        if (clicks.length && chance(rng, 0.7)) {
          const c = pick(rng, clicks);
          const [d, hm] = (c[3] as string).split(" ");
          const minutes = Number(hm!.slice(0, 2)) * 60 + Number(hm!.slice(3, 5));
          const delta = pick(rng, [0, 10080, 10081, ri(rng, 1, 10079), ri(rng, 1, 3000), -ri(rng, 1, 600)]);
          return [id, c[1]!, at(d!, minutes + delta), roundTo(rng, 100, 3000, 50)];
        }
        return [id, ri(rng, 1, users + 1), someTime(rng, "2025-09-01", "2025-09-20"), roundTo(rng, 100, 3000, 50)];
      });
      return { AdClick: clicks, Purchase: purchases };
    },
    solution: [
      "WITH candidates AS (",
      "  SELECT p.purchase_id, p.amount, c.campaign_id,",
      "         ROW_NUMBER() OVER (PARTITION BY p.purchase_id ORDER BY c.clicked_at DESC, c.click_id DESC) AS rn",
      "  FROM Purchase p",
      "  JOIN AdClick c ON c.user_id = p.user_id",
      "               AND c.clicked_at <= p.purchased_at",
      "               AND c.clicked_at >= DATE_SUB(p.purchased_at, INTERVAL 7 DAY)",
      ")",
      "SELECT campaign_id, COUNT(*) AS purchases, SUM(amount) AS revenue",
      "FROM candidates",
      "WHERE rn = 1",
      "GROUP BY campaign_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT c.campaign_id, COUNT(*) AS purchases, SUM(p.amount) AS revenue",
        "FROM Purchase p",
        "JOIN AdClick c ON c.click_id = (",
        "  SELECT c2.click_id FROM AdClick c2",
        "  WHERE c2.user_id = p.user_id AND c2.clicked_at <= p.purchased_at",
        "    AND TIMESTAMPDIFF(SECOND, c2.clicked_at, p.purchased_at) <= 7 * 86400",
        "  ORDER BY c2.clicked_at DESC, c2.click_id DESC LIMIT 1)",
        "GROUP BY c.campaign_id",
      ].join("\n"),
    ],
    hints: [
      "First find, for each purchase, all the clicks that *could* get the credit: same user, not after the purchase, not more than 7 days before it.",
      "Among those candidates keep one per purchase — the latest, ties to the larger `click_id`. `ROW_NUMBER()` partitioned by purchase does it.",
      "Only then group by campaign; purchases with no candidate simply never join.",
    ],
    editorial: [
      "Attribution is a two-step problem: pick **one click per purchase**, then aggregate per campaign. Doing it in that order matters — summing over every candidate click would credit one purchase to several campaigns.",
      "",
      "The join builds the candidates: clicks by the same user within the window `[purchased_at − 7 days, purchased_at]`. Both ends are inclusive, so a click exactly seven days earlier qualifies, and a click after the purchase never does. `ROW_NUMBER() OVER (PARTITION BY purchase_id ORDER BY clicked_at DESC, click_id DESC)` numbers each purchase's candidates from the latest, the `click_id` tie-break making the pick unique when two clicks share a timestamp; keeping `rn = 1` leaves exactly one row per credited purchase, and the inner join has already dropped purchases with no candidate.",
      "",
      "The alternative picks the click with a correlated `ORDER BY … LIMIT 1` subquery and joins the campaign through its `click_id`. With an index on `AdClick(user_id, clicked_at)` both look only at each user's recent clicks.",
    ].join("\n"),
  },

  {
    slug: "meta-groups-where-every-admin-approved-a-post",
    title: "Meta: Facebook Groups Where Every Admin Approved a Post",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Joins", "Dates"],
    description: [
      "The Facebook Groups team checks whether admin teams share the moderation load. A group passes for the week of **2025-03-03 to 2025-03-09** (inclusive) when **every one of its current admins approved at least one post** in that group during the week.",
      "",
      "Return the passing groups with the columns `group_id` and `group_name`, in any order. Approvals by people who are not current admins of that group do not count, approvals in another group do not count, and a group with no admins does not pass.",
    ].join("\n"),
    tables: [
      {
        name: "FbGroup",
        columns: [
          { name: "group_id", type: "int" },
          { name: "group_name", type: "varchar" },
        ],
        primaryKey: ["group_id"],
        note: "One row per Facebook group.",
      },
      {
        name: "GroupAdmin",
        columns: [
          { name: "group_id", type: "int" },
          { name: "user_id", type: "int" },
        ],
        primaryKey: ["group_id", "user_id"],
        note: "The current admins of each group.",
      },
      {
        name: "PostApproval",
        columns: [
          { name: "approval_id", type: "int" },
          { name: "group_id", type: "int" },
          { name: "admin_id", type: "int" },
          { name: "approved_at", type: "date" },
        ],
        primaryKey: ["approval_id"],
        note: "One row per pending post approved; `admin_id` is the user who approved it (possibly a former admin).",
      },
    ],
    examples: [
      {
        FbGroup: [
          [1, "Bengaluru Foodies"],
          [2, "Pune Cyclists"],
          [3, "Kochi Book Club"],
          [4, "Delhi Startup Founders"],
        ],
        GroupAdmin: [
          [1, 10],
          [1, 11],
          [2, 12],
          [2, 13],
          [3, 14],
        ],
        PostApproval: [
          [1, 1, 10, "2025-03-03"],
          [2, 1, 11, "2025-03-09"],
          [3, 2, 12, "2025-03-05"],
          [4, 2, 13, "2025-03-10"],
          [5, 3, 14, "2025-03-04"],
          [6, 3, 15, "2025-03-04"],
          [7, 1, 10, "2025-03-06"],
          [8, 2, 13, "2025-03-02"],
        ],
      },
    ],
    gen: (rng) => {
      const groups: Cell[][] = sample(rng, ["Bengaluru Foodies", "Pune Cyclists", "Kochi Book Club", "Delhi Startup Founders", "Mumbai Photo Walks", "Chennai Chess Circle"], ri(rng, 1, 5)).map((g, i) => [i + 1, g]);
      const admins: Cell[][] = [];
      for (const g of groups) if (!chance(rng, 0.15)) for (const u of sample(rng, seq(10, 8), ri(rng, 1, 3))) admins.push([g[0]!, u]);
      const approvals: Cell[][] = [];
      for (const [gid, uid] of admins) {
        if (chance(rng, 0.75)) approvals.push([0, gid!, uid!, chance(rng, 0.25) ? pick(rng, ["2025-03-03", "2025-03-09"]) : dateBetween(rng, "2025-03-03", "2025-03-09")]);
        if (chance(rng, 0.3)) approvals.push([0, gid!, uid!, pick(rng, ["2025-03-02", "2025-03-10", "2025-02-27"])]);
      }
      for (let k = ri(rng, 0, 3); k > 0; k--) approvals.push([0, pick(rng, groups)[0]!, ri(rng, 10, 17), dateBetween(rng, "2025-03-01", "2025-03-11")]);
      shuffle(rng, approvals).forEach((a, i) => (a[0] = i + 1));
      return { FbGroup: groups, GroupAdmin: admins, PostApproval: approvals };
    },
    solution: [
      "SELECT g.group_id, g.group_name",
      "FROM FbGroup g",
      "WHERE EXISTS (SELECT 1 FROM GroupAdmin a WHERE a.group_id = g.group_id)",
      "  AND NOT EXISTS (",
      "    SELECT 1 FROM GroupAdmin a",
      "    WHERE a.group_id = g.group_id",
      "      AND NOT EXISTS (",
      "        SELECT 1 FROM PostApproval p",
      "        WHERE p.group_id = a.group_id AND p.admin_id = a.user_id",
      "          AND p.approved_at BETWEEN '2025-03-03' AND '2025-03-09'))",
    ].join("\n"),
    alternatives: [
      [
        "SELECT g.group_id, g.group_name",
        "FROM FbGroup g",
        "JOIN GroupAdmin a ON a.group_id = g.group_id",
        "LEFT JOIN (SELECT DISTINCT group_id, admin_id FROM PostApproval",
        "           WHERE approved_at BETWEEN '2025-03-03' AND '2025-03-09') p",
        "       ON p.group_id = a.group_id AND p.admin_id = a.user_id",
        "GROUP BY g.group_id, g.group_name",
        "HAVING COUNT(*) = COUNT(p.admin_id)",
      ].join("\n"),
    ],
    hints: [
      "\"Every admin did X\" is the same as \"no admin failed to do X\".",
      "Write the inner test first: does this admin have an approval in this group in the week?",
      "Watch the empty case — with no admins, \"no admin failed\" is trivially true, but such a group must not pass.",
    ],
    editorial: [
      "This is **relational division**: keep a group only if *all* of its admins have a matching approval. SQL has no \"for all\", so the solution uses the double negative — there is **no** admin of the group for whom there is **no** approval. The innermost `NOT EXISTS` asks whether one admin approved something in that group between 3 and 9 March; the outer `NOT EXISTS` requires that no admin fails that test.",
      "",
      "A universal statement over an empty set is true, so a group without admins would pass the double negative. The statement says it must not, hence the extra `EXISTS` on `GroupAdmin`. Approvals by former admins never match a `GroupAdmin` row, and an approval in another group fails the `p.group_id = a.group_id` test, so neither helps.",
      "",
      "The counting alternative joins every admin to their distinct approvals in the week (a LEFT JOIN, so admins without one keep a NULL row) and keeps groups where the number of admins equals the number of matched admins. The inner join to `GroupAdmin` drops admin-less groups by itself. Both are linear with indexes on the join keys.",
    ].join("\n"),
  },

  {
    slug: "meta-whatsapp-business-message-delivery-funnel",
    title: "Meta: WhatsApp Business Message Delivery Funnel",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Aggregation", "Dates"],
    description: [
      "Businesses on the WhatsApp Business Platform see a funnel for the messages they send: sent → delivered → read. Receipts can go missing — a message that was read was certainly delivered, even if its `delivered_at` is NULL.",
      "",
      "Return one row for **every business** with the columns `business_name`, `sent` (messages sent), `delivered` (messages with a delivery receipt **or** a read receipt) and `read_within_day` (messages read **at most 24 hours** after `sent_at`; exactly 24 hours counts). A business that sent nothing shows 0 in every column. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "WaBusiness",
        columns: [
          { name: "business_id", type: "int" },
          { name: "business_name", type: "varchar" },
        ],
        primaryKey: ["business_id"],
        note: "One row per business on the platform; names are unique.",
      },
      {
        name: "WaMessage",
        columns: [
          { name: "message_id", type: "int" },
          { name: "business_id", type: "int" },
          { name: "sent_at", type: "datetime" },
          { name: "delivered_at", type: "datetime" },
          { name: "read_at", type: "datetime" },
        ],
        primaryKey: ["message_id"],
        note: "One row per message a business sent. `delivered_at` and `read_at` are NULL when that receipt never arrived; a receipt is never earlier than `sent_at`.",
      },
    ],
    examples: [
      {
        WaBusiness: [
          [1, "Chai Point Express"],
          [2, "Goa Surf School"],
          [3, "Chennai Silk House"],
        ],
        WaMessage: [
          [1, 1, "2025-07-01 09:00:00", "2025-07-01 09:01:00", "2025-07-01 12:00:00"],
          [2, 1, "2025-07-01 09:00:00", "2025-07-01 09:02:00", "2025-07-02 09:00:00"],
          [3, 1, "2025-07-01 10:00:00", null, null],
          [4, 2, "2025-07-02 08:00:00", null, "2025-07-02 08:30:00"],
          [5, 2, "2025-07-02 08:00:00", "2025-07-02 08:01:00", "2025-07-04 10:00:00"],
          [6, 1, "2025-07-03 18:00:00", "2025-07-03 18:00:00", null],
        ],
      },
    ],
    gen: (rng) => {
      const biz: Cell[][] = sample(rng, BUSINESSES, ri(rng, 1, 5)).map((name, i) => [i + 1, name]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 18);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const day = dateBetween(rng, "2025-07-01", "2025-07-10");
        const start = ri(rng, 0, 1439);
        const read = chance(rng, 0.4) ? null : start + pick(rng, [1440, 1441, ri(rng, 1, 1439), ri(rng, 1442, 5000)]);
        const delivered = chance(rng, 0.25) ? null : start + ri(rng, 0, 1);
        return [id, ri(rng, 1, biz.length), at(day, start), delivered === null ? null : at(day, delivered), read === null ? null : at(day, read)];
      });
      return { WaBusiness: biz, WaMessage: rows };
    },
    solution: [
      "SELECT b.business_name,",
      "       COUNT(m.message_id) AS sent,",
      "       SUM(CASE WHEN m.delivered_at IS NOT NULL OR m.read_at IS NOT NULL THEN 1 ELSE 0 END) AS delivered,",
      "       SUM(CASE WHEN m.read_at <= DATE_ADD(m.sent_at, INTERVAL 24 HOUR) THEN 1 ELSE 0 END) AS read_within_day",
      "FROM WaBusiness b",
      "LEFT JOIN WaMessage m ON m.business_id = b.business_id",
      "GROUP BY b.business_id, b.business_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT b.business_name, COALESCE(t.sent, 0) AS sent, COALESCE(t.delivered, 0) AS delivered, COALESCE(t.read_within_day, 0) AS read_within_day",
        "FROM WaBusiness b",
        "LEFT JOIN (SELECT business_id, COUNT(*) AS sent, COUNT(COALESCE(delivered_at, read_at)) AS delivered,",
        "                  COUNT(CASE WHEN TIMESTAMPDIFF(MINUTE, sent_at, read_at) <= 1440 THEN 1 END) AS read_within_day",
        "           FROM WaMessage GROUP BY business_id) t ON t.business_id = b.business_id",
      ].join("\n"),
    ],
    hints: [
      "Every business must appear — LEFT JOIN the messages, and count something that is NULL when there are none.",
      "\"Delivered\" has two sources of evidence: either receipt.",
      "The read deadline is per message: `sent_at` plus 24 hours.",
    ],
    editorial: [
      "Three counts over the same messages, each with its own condition, is conditional aggregation; the `LEFT JOIN` from `WaBusiness` keeps the businesses that sent nothing. For those, the single joined row is all NULLs, so `COUNT(m.message_id)` gives 0 (`COUNT(*)` would give 1 — the classic mistake), and each `CASE` evaluates to 0.",
      "",
      "Delivery is counted from either receipt, because a read message must have been delivered: `delivered_at IS NOT NULL OR read_at IS NOT NULL`. The read test compares each message with its own deadline, `DATE_ADD(sent_at, INTERVAL 24 HOUR)`, using `<=` so a read at exactly 24 hours is in; a NULL `read_at` makes the comparison unknown, which the `CASE` sends to `ELSE 0`.",
      "",
      "The alternative aggregates the messages first in a derived table — `COUNT(COALESCE(delivered_at, read_at))` counts rows where either receipt exists, and the 24-hour test is a minute difference — then attaches the totals to every business with `COALESCE(…, 0)` for the missing ones. Both read the messages once.",
    ].join("\n"),
  },

  {
    slug: "meta-advertiser-spend-falling-three-months-running",
    title: "Meta: Advertisers Whose Spend Fell Three Months Running",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates", "Aggregation"],
    description: [
      "The ads sales team wants an early warning for advertisers who are pulling back. Take each advertiser's total spend per calendar month. A **decline month** is a month `m` such that the advertiser spent in `m`, in the month before it and in the month before that (three **consecutive calendar months**), and each of the two later months is **strictly lower** than the month before it.",
      "",
      "Return one row per decline month, with the columns `advertiser_id` and `decline_month` (formatted `YYYY-MM`). A month with no spend breaks the chain, equal totals are not a decline, and a run can cross a year boundary. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "AdvertiserSpend",
        columns: [
          { name: "spend_id", type: "int" },
          { name: "advertiser_id", type: "int" },
          { name: "spend_date", type: "date" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["spend_id"],
        note: "One row per billed charge, in thousands of rupees; an advertiser can have several in a month.",
      },
    ],
    examples: [
      {
        AdvertiserSpend: [
          [1, 1, "2025-01-05", 200],
          [2, 1, "2025-01-20", 100],
          [3, 1, "2025-02-10", 250],
          [4, 1, "2025-03-15", 200],
          [5, 1, "2025-04-02", 150],
          [6, 2, "2025-01-08", 500],
          [7, 2, "2025-02-08", 400],
          [8, 2, "2025-04-08", 300],
          [9, 3, "2025-05-09", 100],
          [10, 3, "2025-06-09", 90],
          [11, 3, "2025-07-09", 90],
          [12, 4, "2024-11-30", 600],
          [13, 4, "2024-12-01", 500],
          [14, 4, "2025-01-31", 400],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const adv of seq(1, ri(rng, 1, 4))) {
        let mi = 2024 * 12 + ri(rng, 9, 17); // Oct 2024 … Jun 2025 as year*12 + month0
        let total = roundTo(rng, 200, 600, 10);
        for (let k = ri(rng, 1, 6); k > 0; k--) {
          const ym = `${Math.floor(mi / 12)}-${pad((mi % 12) + 1)}`;
          if (total > 0) {
            const parts = chance(rng, 0.3) ? 2 : 1;
            const first = parts === 2 ? Math.max(10, Math.floor(total / 2 / 10) * 10) : total;
            rows.push([0, adv, `${ym}-${pad(ri(rng, 1, 28))}`, first]);
            if (parts === 2 && total - first > 0) rows.push([0, adv, `${ym}-${pad(ri(rng, 1, 28))}`, total - first]);
          }
          mi += chance(rng, 0.12) ? 2 : 1;
          total = Math.max(10, total + pick(rng, [-50, -50, -30, -20, 0, 40]));
        }
      }
      shuffle(rng, rows).forEach((r, i) => (r[0] = i + 1));
      return { AdvertiserSpend: rows };
    },
    solution: [
      "WITH monthly AS (",
      "  SELECT advertiser_id, YEAR(spend_date) * 12 + MONTH(spend_date) AS mi, SUM(amount) AS total",
      "  FROM AdvertiserSpend",
      "  GROUP BY advertiser_id, YEAR(spend_date) * 12 + MONTH(spend_date)",
      ")",
      "SELECT m3.advertiser_id,",
      "       CONCAT((m3.mi - 1) DIV 12, '-', LPAD((m3.mi - 1) MOD 12 + 1, 2, '0')) AS decline_month",
      "FROM monthly m3",
      "JOIN monthly m2 ON m2.advertiser_id = m3.advertiser_id AND m2.mi = m3.mi - 1",
      "JOIN monthly m1 ON m1.advertiser_id = m3.advertiser_id AND m1.mi = m3.mi - 2",
      "WHERE m2.total < m1.total",
      "  AND m3.total < m2.total",
    ].join("\n"),
    alternatives: [
      [
        "WITH monthly AS (",
        "  SELECT advertiser_id, DATE_FORMAT(spend_date, '%Y-%m') AS ym, SUM(amount) AS total",
        "  FROM AdvertiserSpend GROUP BY advertiser_id, DATE_FORMAT(spend_date, '%Y-%m')",
        "), lagged AS (",
        "  SELECT advertiser_id, ym, total,",
        "         LAG(total, 1) OVER (PARTITION BY advertiser_id ORDER BY ym) AS prev1,",
        "         LAG(total, 2) OVER (PARTITION BY advertiser_id ORDER BY ym) AS prev2,",
        "         LAG(ym, 2) OVER (PARTITION BY advertiser_id ORDER BY ym) AS ym2",
        "  FROM monthly",
        ")",
        "SELECT advertiser_id, ym AS decline_month",
        "FROM lagged",
        "WHERE prev1 < prev2 AND total < prev1",
        "  AND ym2 = DATE_FORMAT(DATE_SUB(CONCAT(ym, '-01'), INTERVAL 2 MONTH), '%Y-%m')",
      ].join("\n"),
    ],
    hints: [
      "Reduce the charges to one total per advertiser per month first.",
      "Turn a month into a single number (year × 12 + month) so \"the month before\" is just minus one, even across January.",
      "With `LAG`, the previous *row* is not necessarily the previous *month* — check that the three rows are consecutive months.",
    ],
    editorial: [
      "Two steps: aggregate charges into monthly totals, then compare each month with the two before it. The comparison needs *calendar* neighbours, not merely the previous rows, because a month with no spend must break the chain.",
      "",
      "Encoding a month as `YEAR * 12 + MONTH` makes neighbours arithmetic: the month before `mi` is `mi − 1`, and December 2024 sits right before January 2025. Joining the monthly totals to themselves on `mi − 1` and `mi − 2` finds only genuinely consecutive triples — a gap leaves no partner row — and the `WHERE` demands two strict drops, so equal totals do not count. The month label is rebuilt from the number with `DIV`, `MOD` and `LPAD`.",
      "",
      "The window alternative reads the two previous totals with `LAG`, then proves consecutiveness by checking that the row two back is exactly two calendar months earlier (`DATE_SUB(…, INTERVAL 2 MONTH)` on the first of the month). Both group the charges once; the self-join probes the monthly table by key, the window sorts it per advertiser.",
    ].join("\n"),
  },

  {
    slug: "meta-moderators-overturned-more-than-their-team",
    title: "Meta: Moderators Overturned More Often Than Their Team",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Subqueries", "Joins"],
    description: [
      "Content-moderation quality leads look at how often a reviewer's decisions are overturned on appeal. A moderator's **overturn rate** is overturned decisions ÷ all their decisions; a team's rate is the same over every decision made by the team's members.",
      "",
      "Return the moderators whose overturn rate is **strictly higher** than their team's rate, with the columns `moderator_id`, `name`, `decisions` and `overturned`. Moderators with no decisions are not in the answer (and add nothing to their team). Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Moderator",
        columns: [
          { name: "moderator_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "team", type: "varchar" },
        ],
        primaryKey: ["moderator_id"],
        note: "One row per reviewer; `team` is the policy area they review.",
      },
      {
        name: "ModDecision",
        columns: [
          { name: "decision_id", type: "int" },
          { name: "moderator_id", type: "int" },
          { name: "decided_on", type: "date" },
          { name: "overturned", type: "bool" },
        ],
        primaryKey: ["decision_id"],
        note: "One row per enforcement decision; `overturned` is 1 when an appeal reversed it.",
      },
    ],
    examples: [
      {
        Moderator: [
          [1, "Aditi", "Hate Speech"],
          [2, "Rohan", "Hate Speech"],
          [3, "Kavya", "Spam"],
          [4, "Farhan", "Spam"],
          [5, "Neha", "Spam"],
          [6, "Dev", "Nudity"],
          [7, "Ira", "Spam"],
        ],
        ModDecision: [
          [1, 1, "2025-05-01", 1],
          [2, 1, "2025-05-01", 1],
          [3, 1, "2025-05-02", 0],
          [4, 2, "2025-05-02", 0],
          [5, 2, "2025-05-03", 0],
          [6, 3, "2025-05-01", 1],
          [7, 3, "2025-05-02", 0],
          [8, 4, "2025-05-02", 0],
          [9, 4, "2025-05-03", 1],
          [10, 6, "2025-05-01", 1],
          [11, 6, "2025-05-03", 0],
          [12, 7, "2025-05-03", 1],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 2, 8);
      const mods: Cell[][] = sample(rng, ["Aditi", "Rohan", "Kavya", "Farhan", "Neha", "Dev", "Ira", "Karan", "Simran", "Arjun"], n).map((name, i) => [i + 1, name, pick(rng, ["Hate Speech", "Spam", "Nudity"])]);
      const rows: Cell[][] = [];
      for (const m of mods) {
        const p = pick(rng, [0, 0.2, 0.4, 0.5, 0.7]);
        for (let k = ri(rng, 0, 5); k > 0; k--) rows.push([0, m[0]!, dateBetween(rng, "2025-05-01", "2025-05-10"), chance(rng, p) ? 1 : 0]);
      }
      shuffle(rng, rows).forEach((r, i) => (r[0] = i + 1));
      return { Moderator: mods, ModDecision: rows };
    },
    solution: [
      "WITH per_mod AS (",
      "  SELECT m.moderator_id, m.name, m.team, COUNT(*) AS decisions, SUM(d.overturned) AS overturned",
      "  FROM Moderator m",
      "  JOIN ModDecision d ON d.moderator_id = m.moderator_id",
      "  GROUP BY m.moderator_id, m.name, m.team",
      "), per_team AS (",
      "  SELECT team, SUM(decisions) AS team_decisions, SUM(overturned) AS team_overturned",
      "  FROM per_mod GROUP BY team",
      ")",
      "SELECT p.moderator_id, p.name, p.decisions, p.overturned",
      "FROM per_mod p",
      "JOIN per_team t ON t.team = p.team",
      "WHERE p.overturned * t.team_decisions > t.team_overturned * p.decisions",
    ].join("\n"),
    alternatives: [
      [
        "SELECT moderator_id, name, decisions, overturned",
        "FROM (SELECT m.moderator_id, m.name, COUNT(*) AS decisions, SUM(d.overturned) AS overturned,",
        "             SUM(SUM(d.overturned)) OVER (PARTITION BY m.team) AS team_overturned,",
        "             SUM(COUNT(*)) OVER (PARTITION BY m.team) AS team_decisions",
        "      FROM Moderator m JOIN ModDecision d ON d.moderator_id = m.moderator_id",
        "      GROUP BY m.moderator_id, m.name, m.team) x",
        "WHERE overturned / decisions > team_overturned / team_decisions",
      ].join("\n"),
    ],
    hints: [
      "Compute per-moderator counts first, then roll those up to the team.",
      "Compare each moderator's row with their team's row.",
      "a/b > c/d is the same as a·d > c·b when b and d are positive — no division, no rounding.",
    ],
    editorial: [
      "The comparison is between two levels of aggregation: a moderator and the team they belong to. Build the moderator level first — decisions and overturned per moderator, with an inner join so a moderator with no decisions never appears — and then the team level from those rows, which also guarantees that idle moderators add nothing to their team. Joining the two on `team` puts every moderator next to their team's totals.",
      "",
      "To compare the two rates without division, cross-multiply: `overturned / decisions > team_overturned / team_decisions` becomes `overturned * team_decisions > team_overturned * decisions`, valid because both denominators are positive. Integers compare exactly, so a moderator whose rate equals the team's — always the case for a one-person team — is correctly left out.",
      "",
      "The alternative computes the team totals with window sums over the grouped rows (`SUM(COUNT(*)) OVER (PARTITION BY team)`) and compares the divided rates. Both group the decisions once.",
    ].join("\n"),
  },

  {
    slug: "meta-instagram-follow-backs-within-a-week",
    title: "Meta: Instagram Follow-Backs Within a Week",
    difficulty: "MEDIUM",
    topics: ["Joins", "Dates", "Aggregation"],
    description: [
      "An Instagram growth analyst studies reciprocity: when someone new follows an account, how often does the account follow them back soon after?",
      "",
      "For every account that gained at least one follower in **March 2025** (a follow with `followed_at` in March), return `account_id`, `new_followers` (its March follows) and `followed_back` — how many of those followers it followed **back after** being followed and **within 7 days** (exactly 7 days still counts). If the account already followed that person before (or at the same moment), it is not a follow-back. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "IgFollow",
        columns: [
          { name: "follower_id", type: "int" },
          { name: "followee_id", type: "int" },
          { name: "followed_at", type: "datetime" },
        ],
        primaryKey: ["follower_id", "followee_id"],
        note: "`follower_id` started following `followee_id` at `followed_at`; one row per ordered pair of accounts.",
      },
    ],
    examples: [
      {
        IgFollow: [
          [11, 10, "2025-03-02 10:00:00"],
          [10, 11, "2025-03-05 09:00:00"],
          [12, 10, "2025-03-10 08:00:00"],
          [10, 12, "2025-03-17 08:00:00"],
          [13, 10, "2025-03-28 12:00:00"],
          [10, 13, "2025-04-05 12:00:00"],
          [14, 15, "2025-02-27 09:00:00"],
          [15, 14, "2025-03-01 00:00:00"],
          [16, 10, "2025-03-31 23:59:00"],
        ],
      },
    ],
    gen: (rng) => {
      const users = seq(10, ri(rng, 3, 8));
      const pairs = new Map<string, Cell[]>();
      for (let k = ri(rng, 2, 12); k > 0; k--) {
        const [a, b] = sample(rng, users, 2);
        if (!pairs.has(`${a}-${b}`)) pairs.set(`${a}-${b}`, [a!, b!, someTime(rng, "2025-02-25", "2025-04-03")]);
      }
      for (const [a, b, t] of [...pairs.values()]) {
        if (pairs.has(`${b}-${a}`) || !chance(rng, 0.5)) continue;
        const [d, hm] = (t as string).split(" ");
        const minutes = Number(hm!.slice(0, 2)) * 60 + Number(hm!.slice(3, 5));
        pairs.set(`${b}-${a}`, [b!, a!, at(d!, minutes + pick(rng, [0, 10080, 10081, ri(rng, 1, 10079), ri(rng, 1, 3000), -ri(rng, 1, 3000)]))]);
      }
      return { IgFollow: [...pairs.values()] };
    },
    solution: [
      "SELECT f.followee_id AS account_id,",
      "       COUNT(*) AS new_followers,",
      "       COUNT(b.follower_id) AS followed_back",
      "FROM IgFollow f",
      "LEFT JOIN IgFollow b ON b.follower_id = f.followee_id",
      "                    AND b.followee_id = f.follower_id",
      "                    AND b.followed_at > f.followed_at",
      "                    AND b.followed_at <= DATE_ADD(f.followed_at, INTERVAL 7 DAY)",
      "WHERE f.followed_at >= '2025-03-01' AND f.followed_at < '2025-04-01'",
      "GROUP BY f.followee_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT f.followee_id AS account_id, COUNT(*) AS new_followers,",
        "       SUM(CASE WHEN EXISTS (SELECT 1 FROM IgFollow b WHERE b.follower_id = f.followee_id AND b.followee_id = f.follower_id",
        "                              AND TIMESTAMPDIFF(SECOND, f.followed_at, b.followed_at) BETWEEN 1 AND 7 * 86400) THEN 1 ELSE 0 END) AS followed_back",
        "FROM IgFollow f",
        "WHERE YEAR(f.followed_at) = 2025 AND MONTH(f.followed_at) = 3",
        "GROUP BY f.followee_id",
      ].join("\n"),
    ],
    hints: [
      "The follow-back of `A → B` is the row `B → A` — join the table to itself with the two ids swapped.",
      "Put the timing conditions in the `ON` of a LEFT JOIN, so new followers without a follow-back are still counted.",
      "March is a condition on the original follow only; the follow-back may land in April.",
    ],
    editorial: [
      "A follow-back is the reverse edge of a follow, so the query self-joins `IgFollow`: for a follow `f` (follower → account), the candidate `b` has the ids swapped. The timing rules — strictly after, at most seven days after — go into the join condition too.",
      "",
      "They must be in the `ON` clause of a `LEFT JOIN`, not in `WHERE`: each March follow keeps its row whether or not a qualifying follow-back exists, so `COUNT(*)` counts every new follower while `COUNT(b.follower_id)` counts only the rows where the reverse edge matched. Since there is at most one row per ordered pair, nothing is double-counted. A reverse follow that happened earlier, or at the same instant, fails `b.followed_at > f.followed_at` — the account was following them already. Only the original follow is restricted to March, so a follow-back on 4 April for a follow on 28 March still counts.",
      "",
      "The alternative counts with a correlated `EXISTS` per follow and states the window as a seconds difference `BETWEEN 1 AND 604800`. With the primary key on (follower, followee) each reverse lookup is a single index probe.",
    ].join("\n"),
  },

  {
    slug: "meta-messenger-call-drops-by-major-app-version",
    title: "Meta: Messenger Call Drops by Major App Version",
    difficulty: "MEDIUM",
    topics: ["Strings", "Conditional Logic", "Aggregation"],
    description: [
      "After a release, the Messenger calling team compares dropped calls across app versions. Versions look like `452.1.0`; the **major version** is the number before the first dot.",
      "",
      "Ignoring declined calls (they never connected), return one row per major version with the columns `major_version` (as a number), `calls` (connected calls on that major version) and `dropped` (those that ended as `dropped`). Order the rows by `major_version` **numerically**, smallest first.",
    ].join("\n"),
    tables: [
      {
        name: "CallLog",
        columns: [
          { name: "call_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "app_version", type: "varchar" },
          { name: "platform", type: "enum", values: ["android", "ios"] },
          { name: "end_reason", type: "enum", values: ["hangup", "dropped", "declined"] },
        ],
        primaryKey: ["call_id"],
        note: "One row per call attempt; `app_version` is the caller's app version, always three dot-separated numbers.",
      },
    ],
    examples: [
      {
        CallLog: [
          [1, 10, "452.0.1", "android", "hangup"],
          [2, 11, "452.1.0", "ios", "dropped"],
          [3, 12, "98.3.2", "android", "dropped"],
          [4, 13, "98.3.2", "android", "declined"],
          [5, 14, "451.0.0", "ios", "hangup"],
          [6, 15, "45.2.0", "android", "hangup"],
          [7, 10, "452.0.1", "android", "hangup"],
          [8, 16, "451.2.1", "android", "declined"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 18);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 10, 20),
        `${pick(rng, [45, 98, 99, 450, 451, 452, 1003])}.${ri(rng, 0, 3)}.${ri(rng, 0, 9)}`,
        pick(rng, ["android", "ios"]),
        pick(rng, ["hangup", "hangup", "dropped", "declined"]),
      ]);
      return { CallLog: rows };
    },
    solution: [
      "SELECT CAST(SUBSTRING_INDEX(app_version, '.', 1) AS SIGNED) AS major_version,",
      "       COUNT(*) AS calls,",
      "       SUM(CASE WHEN end_reason = 'dropped' THEN 1 ELSE 0 END) AS dropped",
      "FROM CallLog",
      "WHERE end_reason <> 'declined'",
      "GROUP BY CAST(SUBSTRING_INDEX(app_version, '.', 1) AS SIGNED)",
      "ORDER BY major_version",
    ].join("\n"),
    alternatives: [
      [
        "SELECT major_version, COUNT(*) AS calls, COUNT(CASE WHEN end_reason = 'dropped' THEN 1 END) AS dropped",
        "FROM (SELECT CAST(LEFT(app_version, LOCATE('.', app_version) - 1) AS SIGNED) AS major_version, end_reason",
        "      FROM CallLog WHERE end_reason IN ('hangup', 'dropped')) c",
        "GROUP BY major_version",
        "ORDER BY major_version",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`SUBSTRING_INDEX(app_version, '.', 1)` returns everything before the first dot.",
      "That piece is still text — '98' sorts after '452' as a string. Convert it to a number.",
      "Drop the declined calls before grouping, then count the dropped ones conditionally.",
    ],
    editorial: [
      "The version string has to be cut and converted before it can be grouped and sorted. `SUBSTRING_INDEX(app_version, '.', 1)` keeps the part before the first dot; `CAST(… AS SIGNED)` turns it into a number. The conversion is not cosmetic: as text, `'45'`, `'451'`, `'452'`, `'98'` is the sorted order, while numerically 98 comes before 451. Grouping by the text would also work, but ordering must be numeric, so it is simplest to group by the number too.",
      "",
      "Declined calls never connected, so a `WHERE` removes them before grouping; within each major version `COUNT(*)` gives the connected calls and a conditional `SUM(CASE …)` the dropped ones. A prefix test such as `LIKE '45%'` would wrongly lump 45, 450, 451 and 452 together — which is why the string is cut at the dot rather than matched.",
      "",
      "The alternative finds the dot with `LOCATE` and takes the `LEFT` part, in a derived table, and counts drops with `COUNT(CASE …)`. Both are one scan plus a sort of the groups.",
    ].join("\n"),
  },

  {
    slug: "meta-quest-store-running-revenue-per-developer",
    title: "Meta: Running Quest Store Revenue per Developer",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation", "Joins"],
    description: [
      "Developers on the Meta Quest Store get a revenue chart that shows each sales day and the total earned so far. Refunded purchases earn nothing.",
      "",
      "For each developer and each date on which at least one of their apps had a **non-refunded** sale, return `developer_id`, `sale_date`, `day_revenue` (that day's non-refunded revenue across all their apps) and `running_revenue` (their non-refunded revenue from their first sale up to and including that date). Order the rows by `developer_id`, then `sale_date`.",
    ].join("\n"),
    tables: [
      {
        name: "QuestTitle",
        columns: [
          { name: "app_id", type: "int" },
          { name: "developer_id", type: "int" },
          { name: "title", type: "varchar" },
        ],
        primaryKey: ["app_id"],
        note: "One row per app on the store; a developer can publish several.",
      },
      {
        name: "StorePurchase",
        columns: [
          { name: "purchase_id", type: "int" },
          { name: "app_id", type: "int" },
          { name: "purchased_on", type: "date" },
          { name: "price", type: "int" },
          { name: "refunded", type: "bool" },
        ],
        primaryKey: ["purchase_id"],
        note: "One row per purchase, in rupees; `refunded` is 1 if the buyer got their money back.",
      },
    ],
    examples: [
      {
        QuestTitle: [
          [1, 201, "Orbit Golf"],
          [2, 201, "Rocket Kart"],
          [3, 202, "Zen Garden"],
          [4, 203, "Deep Sea Diver"],
        ],
        StorePurchase: [
          [1, 1, "2025-02-01", 500, 0],
          [2, 2, "2025-02-01", 300, 0],
          [3, 1, "2025-02-03", 500, 1],
          [4, 1, "2025-02-04", 500, 0],
          [5, 3, "2025-02-02", 250, 0],
          [6, 3, "2025-02-02", 250, 0],
          [7, 3, "2025-02-05", 400, 1],
          [8, 4, "2025-02-03", 700, 1],
        ],
      },
    ],
    gen: (rng) => {
      const apps: Cell[][] = sample(rng, QUEST_APPS, ri(rng, 1, 5)).map((t, i) => [i + 1, ri(rng, 201, 203), t]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 18);
      const rows: Cell[][] = seq(1, n).map((id) => [id, ri(rng, 1, apps.length), dateBetween(rng, "2025-02-01", "2025-02-07"), roundTo(rng, 100, 900, 50), chance(rng, 0.25) ? 1 : 0]);
      return { QuestTitle: apps, StorePurchase: rows };
    },
    solution: [
      "SELECT q.developer_id, p.purchased_on AS sale_date, SUM(p.price) AS day_revenue,",
      "       SUM(SUM(p.price)) OVER (PARTITION BY q.developer_id ORDER BY p.purchased_on) AS running_revenue",
      "FROM StorePurchase p",
      "JOIN QuestTitle q ON q.app_id = p.app_id",
      "WHERE p.refunded = 0",
      "GROUP BY q.developer_id, p.purchased_on",
      "ORDER BY q.developer_id, p.purchased_on",
    ].join("\n"),
    alternatives: [
      [
        "WITH daily AS (",
        "  SELECT q.developer_id, p.purchased_on AS sale_date, SUM(p.price) AS day_revenue",
        "  FROM StorePurchase p JOIN QuestTitle q ON q.app_id = p.app_id",
        "  WHERE p.refunded = 0 GROUP BY q.developer_id, p.purchased_on",
        ")",
        "SELECT d.developer_id, d.sale_date, d.day_revenue,",
        "       (SELECT SUM(e.day_revenue) FROM daily e WHERE e.developer_id = d.developer_id AND e.sale_date <= d.sale_date) AS running_revenue",
        "FROM daily d",
        "ORDER BY d.developer_id, d.sale_date",
      ].join("\n"),
      [
        "WITH daily AS (",
        "  SELECT q.developer_id, p.purchased_on AS sale_date, SUM(p.price) AS day_revenue",
        "  FROM StorePurchase p JOIN QuestTitle q ON q.app_id = p.app_id",
        "  WHERE p.refunded = 0 GROUP BY q.developer_id, p.purchased_on",
        ")",
        "SELECT a.developer_id, a.sale_date, a.day_revenue, SUM(b.day_revenue) AS running_revenue",
        "FROM daily a JOIN daily b ON b.developer_id = a.developer_id AND b.sale_date <= a.sale_date",
        "GROUP BY a.developer_id, a.sale_date, a.day_revenue",
        "ORDER BY a.developer_id, a.sale_date",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Remove refunds, then get one row per developer per day with `GROUP BY`.",
      "A running total is `SUM(…) OVER (PARTITION BY developer ORDER BY date)`.",
      "A window can run over an aggregate: `SUM(SUM(price)) OVER (…)`.",
    ],
    editorial: [
      "First reduce the purchases to one row per developer per day: join each purchase to its app to learn the developer, drop refunds in `WHERE`, and `GROUP BY developer_id, purchased_on`. Several apps or several purchases on one day collapse into a single `day_revenue`, and a developer whose every sale was refunded has no rows at all.",
      "",
      "The running total is a window over those grouped rows. Window functions are evaluated after `GROUP BY`, so `SUM(SUM(p.price)) OVER (PARTITION BY developer_id ORDER BY purchased_on)` adds up the daily sums in date order within each developer; because every row is a distinct date, the default frame (everything up to the current row) is exactly \"up to and including this date\". Doing the window on the raw purchases instead would repeat a day once per purchase.",
      "",
      "The alternatives compute the daily table in a CTE and sum it either with a correlated subquery or a self-join on `b.sale_date <= a.sale_date` — quadratic per developer, but they show what the window does in one sorted pass.",
    ].join("\n"),
  },

  {
    slug: "meta-marketplace-listings-year-over-year-by-city",
    title: "Meta: Marketplace Listings Against the Same Month Last Year",
    difficulty: "MEDIUM",
    topics: ["Dates", "Aggregation", "Joins"],
    description: [
      "Marketplace's India team reviews supply growth city by city, always against the **same calendar month a year earlier** so that festival seasons line up.",
      "",
      "For every city and every month in which that city had **at least one listing in 2025**, return `city`, `month_num` (1–12), `listings_2025` (listings created in that month of 2025), `listings_2024` (listings in the same city and month of 2024, **0** if there were none) and `difference` (`listings_2025` minus `listings_2024`). Listings from other years are ignored, and a month with listings in 2024 but none in 2025 is not returned. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "MarketListing",
        columns: [
          { name: "listing_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "category", type: "varchar" },
          { name: "listed_on", type: "date" },
        ],
        primaryKey: ["listing_id"],
        note: "One row per Marketplace listing, with the city it was posted in and the day it went live.",
      },
    ],
    examples: [
      {
        MarketListing: [
          [1, "Pune", "Furniture", "2024-03-05"],
          [2, "Pune", "Bikes", "2024-03-20"],
          [3, "Pune", "Furniture", "2025-03-11"],
          [4, "Pune", "Electronics", "2025-03-28"],
          [5, "Pune", "Books", "2025-03-30"],
          [6, "Kochi", "Clothing", "2025-01-15"],
          [7, "Kochi", "Bikes", "2024-02-10"],
          [8, "Delhi", "Electronics", "2025-03-01"],
          [9, "Pune", "Furniture", "2023-03-15"],
          [10, "Delhi", "Home Decor", "2024-03-31"],
        ],
      },
    ],
    gen: (rng) => {
      const cities = sample(rng, ["Pune", "Kochi", "Delhi", "Jaipur", "Mumbai"], ri(rng, 1, 3));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 4, 24);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const year = pick(rng, [2023, 2024, 2024, 2025, 2025, 2025]);
        const month = ri(rng, 1, 4);
        return [id, pick(rng, cities), pick(rng, MARKET_CATEGORIES), `${year}-${pad(month)}-${pad(ri(rng, 1, 28))}`];
      });
      return { MarketListing: rows };
    },
    solution: [
      "WITH monthly AS (",
      "  SELECT city, YEAR(listed_on) AS yr, MONTH(listed_on) AS mon, COUNT(*) AS n",
      "  FROM MarketListing",
      "  GROUP BY city, YEAR(listed_on), MONTH(listed_on)",
      ")",
      "SELECT cur.city, cur.mon AS month_num, cur.n AS listings_2025,",
      "       COALESCE(prev.n, 0) AS listings_2024,",
      "       cur.n - COALESCE(prev.n, 0) AS difference",
      "FROM monthly cur",
      "LEFT JOIN monthly prev ON prev.city = cur.city AND prev.mon = cur.mon AND prev.yr = 2024",
      "WHERE cur.yr = 2025",
    ].join("\n"),
    alternatives: [
      [
        "SELECT city, MONTH(listed_on) AS month_num,",
        "       SUM(CASE WHEN YEAR(listed_on) = 2025 THEN 1 ELSE 0 END) AS listings_2025,",
        "       SUM(CASE WHEN YEAR(listed_on) = 2024 THEN 1 ELSE 0 END) AS listings_2024,",
        "       SUM(CASE WHEN YEAR(listed_on) = 2025 THEN 1 WHEN YEAR(listed_on) = 2024 THEN -1 ELSE 0 END) AS difference",
        "FROM MarketListing",
        "WHERE listed_on BETWEEN '2024-01-01' AND '2025-12-31'",
        "GROUP BY city, MONTH(listed_on)",
        "HAVING SUM(CASE WHEN YEAR(listed_on) = 2025 THEN 1 ELSE 0 END) > 0",
      ].join("\n"),
    ],
    hints: [
      "Count listings per city, year and month first.",
      "Pair each 2025 month with the same city and month in 2024 — a LEFT JOIN, because last year may have nothing.",
      "A missing match is NULL; the statement wants 0, and the difference must use that 0 too.",
      "Or count both years side by side in one grouping by (city, month) with conditional sums.",
    ],
    editorial: [
      "A year-over-year comparison pairs each period with the *same* period a year earlier, not with the previous row. Here the period is a calendar month of a city, so the first step counts listings per (city, year, month).",
      "",
      "The 2025 rows drive the answer, which is why they are on the left of a `LEFT JOIN` to the 2024 rows on the same city and month. A month that existed only in 2024 has no 2025 row and is not returned; a 2025 month with no 2024 counterpart keeps its row with NULL on the right, which `COALESCE(prev.n, 0)` turns into the 0 the statement asks for — and the difference must be computed from that 0 as well, or it would be NULL. Rows from 2023 never match `yr = 2024` and are ignored.",
      "",
      "The alternative is a crosstab: group once by city and month over 2024–2025 and let conditional sums count each year in its own column (the difference adds +1 for a 2025 listing and −1 for a 2024 one); `HAVING` drops the months without a 2025 listing. It reads the table once, with no join.",
    ].join("\n"),
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "meta-whatsapp-business-conversation-windows",
    title: "Meta: WhatsApp Business Conversation Windows",
    difficulty: "HARD",
    topics: ["Subqueries", "Dates", "Window Functions"],
    description: [
      "The WhatsApp Business Platform bills by **conversation window**, and a billing engineer is recomputing the windows from the raw message log. For each business–customer pair, the **first message** opens a 24-hour window. Every later message sent **less than 24 hours after the window opened** belongs to that window; the first message at **24 hours or more** after it opened starts a new window, measured from that message. Windows are fixed from their opening message — a message inside a window does **not** extend it.",
      "",
      "Return each business that sent or received at least one message, with the columns `business_id` and `conversations`, the total number of windows across all its customers, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "WaChat",
        columns: [
          { name: "message_id", type: "int" },
          { name: "business_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "sent_at", type: "datetime" },
        ],
        primaryKey: ["message_id"],
        note: "One row per message in either direction between a business and a customer. Two messages of a pair may share a timestamp.",
      },
    ],
    examples: [
      {
        WaChat: [
          [1, 1, 100, "2025-06-01 09:00:00"],
          [2, 1, 100, "2025-06-01 20:00:00"],
          [3, 1, 100, "2025-06-02 08:59:00"],
          [4, 1, 100, "2025-06-02 09:00:00"],
          [5, 1, 100, "2025-06-03 08:00:00"],
          [6, 1, 101, "2025-06-01 10:00:00"],
          [7, 1, 101, "2025-06-05 10:00:00"],
          [8, 2, 100, "2025-06-01 12:00:00"],
          [9, 2, 100, "2025-06-02 11:00:00"],
          [10, 2, 100, "2025-06-02 13:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      if (!chance(rng, 0.05)) {
        for (let k = ri(rng, 1, 5); k > 0; k--) {
          const biz = ri(rng, 1, 3);
          const cust = ri(rng, 100, 104);
          if (rows.some((r) => r[1] === biz && r[2] === cust)) continue;
          const day = dateBetween(rng, "2025-06-01", "2025-06-05");
          let t = ri(rng, 0, 1439);
          for (let m = ri(rng, 1, 6); m > 0; m--) {
            rows.push([0, biz, cust, at(day, t)]);
            t += pick(rng, [0, 30, 600, 1439, 1440, 1441, 1500, 3000]);
          }
        }
      }
      shuffle(rng, rows).forEach((r, i) => (r[0] = i + 1));
      return { WaChat: rows };
    },
    solution: [
      "WITH RECURSIVE win AS (",
      "  SELECT business_id, customer_id, MIN(sent_at) AS opened_at",
      "  FROM WaChat",
      "  GROUP BY business_id, customer_id",
      "  UNION ALL",
      "  SELECT w.business_id, w.customer_id,",
      "         (SELECT MIN(c.sent_at) FROM WaChat c",
      "          WHERE c.business_id = w.business_id AND c.customer_id = w.customer_id",
      "            AND c.sent_at >= DATE_ADD(w.opened_at, INTERVAL 24 HOUR))",
      "  FROM win w",
      "  WHERE EXISTS (SELECT 1 FROM WaChat c",
      "                WHERE c.business_id = w.business_id AND c.customer_id = w.customer_id",
      "                  AND c.sent_at >= DATE_ADD(w.opened_at, INTERVAL 24 HOUR))",
      ")",
      "SELECT business_id, COUNT(*) AS conversations",
      "FROM win",
      "GROUP BY business_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE ordered AS (",
        "  SELECT business_id, customer_id, sent_at,",
        "         ROW_NUMBER() OVER (PARTITION BY business_id, customer_id ORDER BY sent_at) AS rn",
        "  FROM WaChat",
        "), walk AS (",
        "  SELECT business_id, customer_id, rn, sent_at AS opened_at, 1 AS opens FROM ordered WHERE rn = 1",
        "  UNION ALL",
        "  SELECT o.business_id, o.customer_id, o.rn,",
        "         CASE WHEN o.sent_at >= DATE_ADD(w.opened_at, INTERVAL 24 HOUR) THEN o.sent_at ELSE w.opened_at END,",
        "         CASE WHEN o.sent_at >= DATE_ADD(w.opened_at, INTERVAL 24 HOUR) THEN 1 ELSE 0 END",
        "  FROM walk w",
        "  JOIN ordered o ON o.business_id = w.business_id AND o.customer_id = w.customer_id AND o.rn = w.rn + 1",
        ")",
        "SELECT business_id, SUM(opens) AS conversations",
        "FROM walk",
        "GROUP BY business_id",
      ].join("\n"),
    ],
    hints: [
      "This is not \"a gap of 24 hours starts a new session\": three messages 23 hours apart make two windows, not one.",
      "Each window's start depends on the previous window's start — a chain that only a recursive CTE can follow.",
      "From a window opened at `t`, the next window opens at the first message at or after `t + 24 hours`.",
      "Alternatively, walk the messages of each pair one by one in time order, carrying the current window's opening time.",
    ],
    editorial: [
      "Most sessionization problems split on the gap between *consecutive* events, which a `LAG` handles. Fixed windows are different: whether a message opens a new window depends on when the *current window opened*, and that depends on the window before it. Messages at 12:00, 11:00 the next day and 13:00 the next day are each less than 24 hours after the previous message, yet the third is 25 hours after the window opened, so there are two windows. A chain like that needs recursion.",
      "",
      "The solution recurses on windows rather than messages. The anchor opens one window per pair at its first message (`MIN(sent_at)`). Each recursive step jumps from a window opened at `t` straight to the next one: the earliest message of the pair at or after `t + 24 hours`, guarded by `EXISTS` so the recursion stops when there is none. Counting the rows per business counts the windows. A message at exactly 24 hours opens a new window because the test is `>=`; messages sharing a timestamp are harmless since only times matter.",
      "",
      "The alternative recurses on messages: number each pair's messages, then walk row `rn` to `rn + 1`, carrying the current window's opening time and emitting 1 whenever a message is 24 hours or more past it. It visits every message once per pair, while the jump version takes one step per window; both are linear in the log for these sizes.",
    ].join("\n"),
  },

  {
    slug: "meta-monthly-active-user-growth-accounting",
    title: "Meta: Growth Accounting of Monthly Active Users",
    difficulty: "HARD",
    topics: ["Window Functions", "Subqueries", "Dates"],
    description: [
      "Meta's growth teams break each month's actives into where they came from. For a new app like Threads, a data scientist asks for that table from the activity log. A user is **active in a month** if they have at least one activity date in it. For each month, classify:",
      "",
      "- `new_users` — active this month, and this is the first month they were ever active;",
      "- `retained` — active this month and also in the previous calendar month;",
      "- `resurrected` — active this month, not in the previous month, but active in some earlier month;",
      "- `churned` — active in the previous month but **not** this month.",
      "",
      "Return one row for **every calendar month from the first month with any activity to the last**, including months in between with no activity at all, with the columns `month` (`YYYY-MM`), `new_users`, `retained`, `resurrected` and `churned`, **ordered by `month`**. An empty log returns no rows.",
    ].join("\n"),
    tables: [
      {
        name: "AppActivity",
        columns: [
          { name: "user_id", type: "int" },
          { name: "activity_date", type: "date" },
        ],
        primaryKey: ["user_id", "activity_date"],
        note: "One row per user per day on which they used the app.",
      },
    ],
    examples: [
      {
        AppActivity: [
          [1, "2025-01-05"],
          [1, "2025-01-20"],
          [1, "2025-02-03"],
          [1, "2025-04-10"],
          [2, "2025-01-15"],
          [2, "2025-03-02"],
          [3, "2025-02-14"],
          [3, "2025-03-14"],
          [3, "2025-04-01"],
          [4, "2025-04-30"],
          [5, "2025-06-08"],
        ],
      },
    ],
    gen: (rng) => {
      const months = ["2024-11", "2024-12", "2025-01", "2025-02", "2025-03", "2025-04", "2025-05"];
      const rows: Cell[][] = [];
      if (!chance(rng, 0.05)) {
        for (const user of seq(1, ri(rng, 1, 7))) {
          const p = pick(rng, [0.3, 0.5, 0.7]);
          for (const m of months) {
            if (!chance(rng, p)) continue;
            for (const d of sample(rng, ["03", "11", "19", "28"], chance(rng, 0.3) ? 2 : 1)) rows.push([user, `${m}-${d}`]);
          }
        }
      }
      return { AppActivity: shuffle(rng, rows) };
    },
    solution: [
      "WITH RECURSIVE ua AS (",
      "  SELECT DISTINCT user_id, YEAR(activity_date) * 12 + MONTH(activity_date) - 1 AS mi FROM AppActivity",
      "), bounds AS (",
      "  SELECT MIN(mi) AS lo, MAX(mi) AS hi FROM ua",
      "), months AS (",
      "  SELECT lo AS mi FROM bounds WHERE lo IS NOT NULL",
      "  UNION ALL",
      "  SELECT mi + 1 FROM months WHERE mi < (SELECT hi FROM bounds)",
      "), firsts AS (",
      "  SELECT user_id, MIN(mi) AS first_mi FROM ua GROUP BY user_id",
      ")",
      "SELECT CONCAT(m.mi DIV 12, '-', LPAD(m.mi MOD 12 + 1, 2, '0')) AS month,",
      "       (SELECT COUNT(*) FROM firsts f WHERE f.first_mi = m.mi) AS new_users,",
      "       (SELECT COUNT(*) FROM ua a JOIN ua p ON p.user_id = a.user_id AND p.mi = a.mi - 1 WHERE a.mi = m.mi) AS retained,",
      "       (SELECT COUNT(*) FROM ua a JOIN firsts f ON f.user_id = a.user_id",
      "         WHERE a.mi = m.mi AND f.first_mi < m.mi",
      "           AND NOT EXISTS (SELECT 1 FROM ua p WHERE p.user_id = a.user_id AND p.mi = m.mi - 1)) AS resurrected,",
      "       (SELECT COUNT(*) FROM ua p WHERE p.mi = m.mi - 1",
      "           AND NOT EXISTS (SELECT 1 FROM ua a WHERE a.user_id = p.user_id AND a.mi = m.mi)) AS churned",
      "FROM months m",
      "ORDER BY m.mi",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE ua AS (",
        "  SELECT DISTINCT user_id, YEAR(activity_date) * 12 + MONTH(activity_date) - 1 AS mi FROM AppActivity",
        "), tagged AS (",
        "  SELECT user_id, mi,",
        "         LAG(mi) OVER (PARTITION BY user_id ORDER BY mi) AS prev_mi,",
        "         LEAD(mi) OVER (PARTITION BY user_id ORDER BY mi) AS next_mi",
        "  FROM ua",
        "), months AS (",
        "  SELECT MIN(mi) AS mi, MAX(mi) AS hi FROM ua HAVING MIN(mi) IS NOT NULL",
        "  UNION ALL",
        "  SELECT mi + 1, hi FROM months WHERE mi < hi",
        "), moves AS (",
        "  SELECT mi, CASE WHEN prev_mi IS NULL THEN 'new' WHEN prev_mi = mi - 1 THEN 'retained' ELSE 'resurrected' END AS kind FROM tagged",
        "  UNION ALL",
        "  SELECT mi + 1, 'churned' FROM tagged WHERE next_mi IS NULL OR next_mi > mi + 1",
        ")",
        "SELECT CONCAT(m.mi DIV 12, '-', LPAD(m.mi MOD 12 + 1, 2, '0')) AS month,",
        "       SUM(CASE WHEN v.kind = 'new' THEN 1 ELSE 0 END) AS new_users,",
        "       SUM(CASE WHEN v.kind = 'retained' THEN 1 ELSE 0 END) AS retained,",
        "       SUM(CASE WHEN v.kind = 'resurrected' THEN 1 ELSE 0 END) AS resurrected,",
        "       SUM(CASE WHEN v.kind = 'churned' THEN 1 ELSE 0 END) AS churned",
        "FROM months m",
        "LEFT JOIN moves v ON v.mi = m.mi",
        "GROUP BY m.mi",
        "ORDER BY m.mi",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Reduce the log to distinct (user, month) pairs, with the month as one number (year × 12 + month) so \"previous month\" is minus one.",
      "Months with no activity must still appear — generate the calendar between the first and last month with a recursive CTE.",
      "A user's first active month makes them new; after that, the previous active month decides retained versus resurrected.",
      "Churn is reported in the month *after* the last month of a streak.",
    ],
    editorial: [
      "Growth accounting classifies every (user, month) pair, so the first move is to reduce the daily log to distinct active months, encoded as `YEAR * 12 + MONTH - 1`. With that number, the previous calendar month is `mi - 1` even across January, and the label is rebuilt with `DIV`, `MOD` and `LPAD`.",
      "",
      "The output needs every month between the first and the last, including empty ones (they still have churn from the month before), so a recursive CTE counts up from the minimum to the maximum month. The reference then fills each month with four correlated counts: new users are those whose first month is this one; retained users are active here and in `mi - 1`; resurrected users are active here, not in `mi - 1`, with a first month earlier still; churned users were active in `mi - 1` and are missing now. The three active categories partition the month's actives, and an empty month gets zeros except for churn.",
      "",
      "The alternative classifies each pair once with window functions: `LAG(mi)` gives the previous active month of the user (NULL → new, `mi - 1` → retained, anything older → resurrected), and `LEAD(mi)` finds the end of a streak, which emits one churn event in the following month. A `LEFT JOIN` of these events onto the calendar and conditional sums finish the table. It sorts each user's months once instead of probing per month.",
    ].join("\n"),
  },

  {
    slug: "meta-trending-reels-tags-from-tag-lists",
    title: "Meta: Trending Reels Tags Split Out of Comma-Separated Lists",
    difficulty: "HARD",
    topics: ["Strings", "Subqueries", "Dates"],
    description: [
      "An older Reels table stores each reel's tags as one comma-separated string such as `ipl,cricket,mumbai`. The Reels discovery team wants this week's trending tags from it without waiting for a backfill.",
      "",
      "Split every list into its tags (a tag repeated in one list counts once for that reel). Compare **this week**, 2025-08-11 to 2025-08-17, with **last week**, 2025-08-04 to 2025-08-10 (both inclusive), by the number of reels carrying each tag. A tag is **trending** when it is on **at least 3 reels this week** and this week's count is **at least double** last week's. Return `tag`, `this_week` and `last_week` (0 if none) for the trending tags, **ordered by `this_week` descending, then `tag`**. A NULL or empty `tags` has no tags.",
    ].join("\n"),
    tables: [
      {
        name: "ReelPost",
        columns: [
          { name: "reel_id", type: "int" },
          { name: "creator_id", type: "int" },
          { name: "posted_on", type: "date" },
          { name: "tags", type: "varchar" },
        ],
        primaryKey: ["reel_id"],
        note: "One row per reel. `tags` is lower-case tags without `#`, separated by single commas with no spaces (at most six), or NULL / '' when the reel has none.",
      },
    ],
    examples: [
      {
        ReelPost: [
          [1, 11, "2025-08-11", "ipl,cricket"],
          [2, 12, "2025-08-12", "ipl,mumbai,ipl"],
          [3, 13, "2025-08-13", "cricket,ipl"],
          [4, 11, "2025-08-14", "monsoon"],
          [5, 14, "2025-08-05", "ipl"],
          [6, 15, "2025-08-06", "cricket"],
          [7, 12, "2025-08-07", "cricket"],
          [8, 13, "2025-08-15", "cricket,monsoon,foodie"],
          [9, 14, "2025-08-16", "monsoon"],
          [10, 15, "2025-08-18", "monsoon,ipl"],
          [11, 16, "2025-08-17", null],
          [12, 11, "2025-08-17", "monsoon"],
        ],
      },
    ],
    gen: (rng) => {
      const pool = sample(rng, ["ipl", "cricket", "monsoon", "foodie", "diwali", "tech", "goa"], ri(rng, 2, 5));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 6, 24);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const r = rng();
        const day = r < 0.55 ? dateBetween(rng, "2025-08-11", "2025-08-17") : r < 0.8 ? dateBetween(rng, "2025-08-04", "2025-08-10") : pick(rng, ["2025-08-03", "2025-08-18", "2025-07-28"]);
        const k = ri(rng, 0, 4);
        const tags = k === 0 ? pick(rng, [null, ""]) : Array.from({ length: k }, () => pick(rng, pool)).join(",");
        return [id, ri(rng, 11, 18), day, tags];
      });
      return { ReelPost: rows };
    },
    solution: [
      "WITH RECURSIVE split AS (",
      "  SELECT reel_id, posted_on,",
      "         SUBSTRING_INDEX(tags, ',', 1) AS tag,",
      "         SUBSTRING(tags, CHAR_LENGTH(SUBSTRING_INDEX(tags, ',', 1)) + 2) AS rest",
      "  FROM ReelPost",
      "  WHERE tags IS NOT NULL AND tags <> ''",
      "    AND posted_on BETWEEN '2025-08-04' AND '2025-08-17'",
      "  UNION ALL",
      "  SELECT reel_id, posted_on,",
      "         SUBSTRING_INDEX(rest, ',', 1),",
      "         SUBSTRING(rest, CHAR_LENGTH(SUBSTRING_INDEX(rest, ',', 1)) + 2)",
      "  FROM split",
      "  WHERE rest <> ''",
      "), tagged AS (",
      "  SELECT DISTINCT reel_id, posted_on, tag FROM split",
      ")",
      "SELECT tag,",
      "       SUM(CASE WHEN posted_on >= '2025-08-11' THEN 1 ELSE 0 END) AS this_week,",
      "       SUM(CASE WHEN posted_on <= '2025-08-10' THEN 1 ELSE 0 END) AS last_week",
      "FROM tagged",
      "GROUP BY tag",
      "HAVING SUM(CASE WHEN posted_on >= '2025-08-11' THEN 1 ELSE 0 END) >= 3",
      "   AND SUM(CASE WHEN posted_on >= '2025-08-11' THEN 1 ELSE 0 END) >= 2 * SUM(CASE WHEN posted_on <= '2025-08-10' THEN 1 ELSE 0 END)",
      "ORDER BY this_week DESC, tag",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE n AS (",
        "  SELECT 1 AS k UNION ALL SELECT k + 1 FROM n WHERE k < 6",
        "), tagged AS (",
        "  SELECT DISTINCT r.reel_id, r.posted_on, SUBSTRING_INDEX(SUBSTRING_INDEX(r.tags, ',', n.k), ',', -1) AS tag",
        "  FROM ReelPost r",
        "  JOIN n ON n.k <= CHAR_LENGTH(r.tags) - CHAR_LENGTH(REPLACE(r.tags, ',', '')) + 1",
        "  WHERE r.tags <> ''",
        "), weekly AS (",
        "  SELECT tag,",
        "         COUNT(CASE WHEN posted_on BETWEEN '2025-08-11' AND '2025-08-17' THEN 1 END) AS this_week,",
        "         COUNT(CASE WHEN posted_on BETWEEN '2025-08-04' AND '2025-08-10' THEN 1 END) AS last_week",
        "  FROM tagged GROUP BY tag",
        ")",
        "SELECT tag, this_week, last_week",
        "FROM weekly",
        "WHERE this_week >= 3 AND this_week >= 2 * last_week",
        "ORDER BY this_week DESC, tag",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`SUBSTRING_INDEX(list, ',', 1)` is the first tag; everything after the first comma is what is left to split.",
      "A recursive CTE can peel one tag off per step until nothing is left.",
      "Alternatively join each row to the numbers 1…6 and take the k-th tag with `SUBSTRING_INDEX(SUBSTRING_INDEX(list, ',', k), ',', -1)`; the number of tags is the number of commas plus one.",
      "Deduplicate (reel, tag) before counting, then compare the two weeks with conditional sums.",
    ],
    editorial: [
      "The data is not in first normal form — one column holds a list — so the work is to turn each list into one row per tag, and only then count. The reference peels the list recursively: the anchor takes the first tag with `SUBSTRING_INDEX(tags, ',', 1)` and keeps the remainder after its comma (`SUBSTRING` from the tag's length + 2); each recursive step does the same to the remainder until it is empty. NULL and empty lists are filtered out in the anchor, so they produce no tags, and only the two weeks of interest are split at all.",
      "",
      "A tag listed twice on one reel must count once, so the rows are reduced to distinct (reel, tag) pairs. Then one grouping by tag counts both weeks with conditional sums, and `HAVING` applies the trend rule: at least three reels this week and this week ≥ 2 × last week, which a tag absent last week satisfies with 0. The order is fixed by the statement, with the tag name breaking ties.",
      "",
      "The alternative splits with a small numbers table instead of recursion over the strings: each reel joins to k = 1 … (commas + 1), and the nested `SUBSTRING_INDEX(SUBSTRING_INDEX(tags, ',', k), ',', -1)` picks the k-th element. Both are linear in the total number of tags; a production fix is a separate (reel, tag) table.",
    ].join("\n"),
  },

  {
    slug: "meta-reels-creator-percentile-rank-by-country",
    title: "Meta: Each Reels Creator's Percentile Rank Within Their Country",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins", "Conditional Logic"],
    description: [
      "The Reels creator bonus programme places every creator relative to the others **in their own country**. Take each creator's total plays in **August 2025** (2025-08-01 to 2025-08-31; a creator with no August plays has 0). Their **percentile rank** in the country is `(r − 1) / (n − 1)`, where `r` is their rank by August plays in ascending order (tied creators share the lowest rank of the tie) and `n` is the number of creators in that country; a country with a single creator gives that creator 0.",
      "",
      "Return **every creator** with `creator_id`, `country`, `august_plays`, `pct_rank` (the percentile rank rounded to 4 decimal places) and `tier`: `top` when the unrounded percentile rank is at least 0.9, `rising` when it is at least 0.5, otherwise `base`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Creator",
        columns: [
          { name: "creator_id", type: "int" },
          { name: "handle", type: "varchar" },
          { name: "country", type: "char" },
        ],
        primaryKey: ["creator_id"],
        note: "One row per creator enrolled in the programme; `country` is a two-letter code.",
      },
      {
        name: "ReelDailyPlays",
        columns: [
          { name: "creator_id", type: "int" },
          { name: "play_date", type: "date" },
          { name: "plays", type: "int" },
        ],
        primaryKey: ["creator_id", "play_date"],
        note: "Plays of all of a creator's reels on one day. Days without plays have no row.",
      },
    ],
    examples: [
      {
        Creator: [
          [1, "chai.coder", "IN"],
          [2, "run.priya", "IN"],
          [3, "metro.diaries", "IN"],
          [4, "goa.sunsets", "IN"],
          [5, "biryani.hunter", "IN"],
          [6, "nyc.eats", "US"],
          [7, "la.skate", "US"],
          [8, "dubai.drives", "AE"],
        ],
        ReelDailyPlays: [
          [1, "2025-08-01", 200],
          [1, "2025-08-15", 300],
          [2, "2025-08-03", 300],
          [3, "2025-08-31", 300],
          [4, "2025-07-31", 800],
          [5, "2025-08-10", 900],
          [6, "2025-08-02", 100],
          [7, "2025-08-20", 200],
          [8, "2025-08-05", 50],
          [3, "2025-09-01", 999],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const creators: Cell[][] = seq(1, n).map((id) => [id, `creator${id}`, pick(rng, ["IN", "IN", "US", "AE", "GB"])]);
      const rows: Cell[][] = [];
      for (const c of creators) {
        for (const d of sample(rng, ["2025-07-31", "2025-08-01", "2025-08-09", "2025-08-20", "2025-08-31", "2025-09-01"], ri(rng, 0, 3))) {
          rows.push([c[0]!, d, roundTo(rng, 0, 1000, 100)]);
        }
      }
      return { Creator: creators, ReelDailyPlays: shuffle(rng, rows) };
    },
    solution: [
      "WITH totals AS (",
      "  SELECT c.creator_id, c.country, COALESCE(SUM(p.plays), 0) AS august_plays",
      "  FROM Creator c",
      "  LEFT JOIN ReelDailyPlays p ON p.creator_id = c.creator_id",
      "                            AND p.play_date BETWEEN '2025-08-01' AND '2025-08-31'",
      "  GROUP BY c.creator_id, c.country",
      "), ranked AS (",
      "  SELECT creator_id, country, august_plays,",
      "         PERCENT_RANK() OVER (PARTITION BY country ORDER BY august_plays) AS pr",
      "  FROM totals",
      ")",
      "SELECT creator_id, country, august_plays, ROUND(pr, 4) AS pct_rank,",
      "       CASE WHEN pr >= 0.9 THEN 'top' WHEN pr >= 0.5 THEN 'rising' ELSE 'base' END AS tier",
      "FROM ranked",
    ].join("\n"),
    alternatives: [
      [
        "WITH totals AS (",
        "  SELECT c.creator_id, c.country,",
        "         COALESCE((SELECT SUM(p.plays) FROM ReelDailyPlays p",
        "                   WHERE p.creator_id = c.creator_id AND p.play_date BETWEEN '2025-08-01' AND '2025-08-31'), 0) AS august_plays",
        "  FROM Creator c",
        "), counted AS (",
        "  SELECT t.creator_id, t.country, t.august_plays,",
        "         (SELECT COUNT(*) FROM totals u WHERE u.country = t.country AND u.august_plays < t.august_plays) AS below,",
        "         (SELECT COUNT(*) FROM totals u WHERE u.country = t.country) AS n",
        "  FROM totals t",
        ")",
        "SELECT creator_id, country, august_plays,",
        "       CASE WHEN n = 1 THEN 0 ELSE ROUND(below / (n - 1), 4) END AS pct_rank,",
        "       CASE WHEN n > 1 AND 10 * below >= 9 * (n - 1) THEN 'top'",
        "            WHEN n > 1 AND 2 * below >= n - 1 THEN 'rising'",
        "            ELSE 'base' END AS tier",
        "FROM counted",
      ].join("\n"),
    ],
    hints: [
      "Build every creator's August total first — a LEFT JOIN with the date range in `ON` keeps creators who had no August plays, and `COALESCE` makes them 0.",
      "`PERCENT_RANK() OVER (PARTITION BY country ORDER BY august_plays)` is exactly `(rank − 1) / (n − 1)`, and 0 for a one-creator country.",
      "`r − 1` is the number of creators in the country with strictly fewer plays — that is how to compute it without the window function.",
      "Decide the tier on the unrounded value; round only for display.",
    ],
    editorial: [
      "The ranking must happen over a complete set of creators, so the first step builds one row per creator with their August total. The date range belongs in the `ON` clause of the `LEFT JOIN`: in `WHERE` it would delete the creators whose only plays fall in July or September, and they must instead be ranked with 0 plays. `COALESCE(SUM(...), 0)` turns their NULL sum into 0.",
      "",
      "`PERCENT_RANK()` is the statement's formula: within each country it orders creators by plays, gives tied creators the same `RANK()` (the lowest of the tie), and returns `(rank − 1) / (n − 1)`, defined as 0 when the country has a single creator. So the least-played creator is always 0 and a sole leader is 1. The tier is a `CASE` on the unrounded value — a creator exactly at 0.9, such as the tenth of eleven, is `top` — and the reported value is rounded to four places for display.",
      "",
      "The alternative computes the same number by counting: `r − 1` is how many creators in the same country have strictly fewer plays, divided by `n − 1`. Its tier thresholds are cross-multiplied (`10 · below ≥ 9 · (n − 1)`) so no division is compared, with `n > 1` guarding the one-creator country. It is quadratic per country where the window is one sort; `CUME_DIST()` would be the related measure that counts ties as at-or-below instead.",
    ].join("\n"),
  },

  {
    slug: "meta-day-each-campaign-exhausted-its-budget",
    title: "Meta: The Day Each Campaign Exhausted Its Lifetime Budget",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins", "Dates"],
    description: [
      "Ads delivery engineers study budget pacing: a campaign that spends its whole lifetime budget long before its end date was paced badly. A campaign **exhausts** its budget on the first date on which its cumulative spend (all charges on that date and before) **reaches or exceeds** `lifetime_budget`.",
      "",
      "Return one row for **every campaign**, with `campaign_id`, `exhausted_on` (that date), `days_left` (days from `exhausted_on` to the campaign's `end_date`; 0 when it ran out on its last day) and `overspend` (the campaign's total spend minus its budget). For a campaign that never exhausted its budget, all three are NULL. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Campaign",
        columns: [
          { name: "campaign_id", type: "int" },
          { name: "campaign_name", type: "varchar" },
          { name: "lifetime_budget", type: "int" },
          { name: "end_date", type: "date" },
        ],
        primaryKey: ["campaign_id"],
        note: "One row per campaign; `lifetime_budget` is in rupees.",
      },
      {
        name: "CampaignSpend",
        columns: [
          { name: "spend_id", type: "int" },
          { name: "campaign_id", type: "int" },
          { name: "spend_date", type: "date" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["spend_id"],
        note: "One row per delivery charge; a campaign can have several on one day, and never after its `end_date`.",
      },
    ],
    examples: [
      {
        Campaign: [
          [1, "Diwali Sale", 10000, "2025-10-25"],
          [2, "Monsoon Offers", 8000, "2025-10-20"],
          [3, "App Installs", 5000, "2025-10-12"],
          [4, "Brand Lift", 3000, "2025-10-30"],
        ],
        CampaignSpend: [
          [1, 1, "2025-10-10", 4000],
          [2, 1, "2025-10-11", 3000],
          [3, 1, "2025-10-11", 1000],
          [4, 1, "2025-10-13", 2500],
          [5, 2, "2025-10-12", 3000],
          [6, 2, "2025-10-15", 2000],
          [7, 3, "2025-10-11", 2000],
          [8, 3, "2025-10-12", 3000],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 5);
      const camps: Cell[][] = sample(rng, ["Diwali Sale", "Monsoon Offers", "App Installs", "Brand Lift", "Festive Reels", "Lead Forms"], n).map((name, i) => [i + 1, name, roundTo(rng, 3000, 12000, 1000), dateBetween(rng, "2025-10-12", "2025-10-25")]);
      const rows: Cell[][] = [];
      for (const c of camps) {
        for (let k = ri(rng, 0, 6); k > 0; k--) rows.push([0, c[0]!, chance(rng, 0.15) ? c[3]! : dateBetween(rng, "2025-10-05", c[3] as string), roundTo(rng, 500, 4000, 500)]);
      }
      shuffle(rng, rows).forEach((r, i) => (r[0] = i + 1));
      return { Campaign: camps, CampaignSpend: rows };
    },
    solution: [
      "WITH daily AS (",
      "  SELECT campaign_id, spend_date, SUM(amount) AS day_spend",
      "  FROM CampaignSpend",
      "  GROUP BY campaign_id, spend_date",
      "), running AS (",
      "  SELECT campaign_id, spend_date,",
      "         SUM(day_spend) OVER (PARTITION BY campaign_id ORDER BY spend_date) AS spent_so_far,",
      "         SUM(day_spend) OVER (PARTITION BY campaign_id) AS total_spent",
      "  FROM daily",
      "), hit AS (",
      "  SELECT r.campaign_id, MIN(r.spend_date) AS exhausted_on, MAX(r.total_spent) AS total_spent",
      "  FROM running r",
      "  JOIN Campaign c ON c.campaign_id = r.campaign_id",
      "  WHERE r.spent_so_far >= c.lifetime_budget",
      "  GROUP BY r.campaign_id",
      ")",
      "SELECT c.campaign_id, h.exhausted_on,",
      "       DATEDIFF(c.end_date, h.exhausted_on) AS days_left,",
      "       h.total_spent - c.lifetime_budget AS overspend",
      "FROM Campaign c",
      "LEFT JOIN hit h ON h.campaign_id = c.campaign_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT c.campaign_id, x.exhausted_on,",
        "       DATEDIFF(c.end_date, x.exhausted_on) AS days_left,",
        "       CASE WHEN x.exhausted_on IS NULL THEN NULL",
        "            ELSE (SELECT SUM(t.amount) FROM CampaignSpend t WHERE t.campaign_id = c.campaign_id) - c.lifetime_budget END AS overspend",
        "FROM Campaign c",
        "LEFT JOIN (",
        "  SELECT s.campaign_id, MIN(s.spend_date) AS exhausted_on",
        "  FROM CampaignSpend s",
        "  JOIN Campaign k ON k.campaign_id = s.campaign_id",
        "  WHERE (SELECT SUM(s2.amount) FROM CampaignSpend s2",
        "         WHERE s2.campaign_id = s.campaign_id AND s2.spend_date <= s.spend_date) >= k.lifetime_budget",
        "  GROUP BY s.campaign_id",
        ") x ON x.campaign_id = c.campaign_id",
      ].join("\n"),
    ],
    hints: [
      "Several charges can fall on one day — the cumulative spend \"on a date\" includes all of them. Sum per day first.",
      "A running total per campaign in date order tells you the spend so far on each date.",
      "The exhaustion date is the *earliest* date whose running total reaches the budget.",
      "Every campaign must appear: attach the result with a LEFT JOIN, and let NULLs flow through `DATEDIFF` and the subtraction.",
    ],
    editorial: [
      "The key quantity is the cumulative spend at the end of each date, so the query first collapses the charges to one row per campaign per day — otherwise two charges on the same day would produce two running totals for that date, and the first of them could look like the day the budget was *not* yet reached. A window `SUM(day_spend) OVER (PARTITION BY campaign_id ORDER BY spend_date)` then gives the spend so far on every spending day, and an unordered `SUM(...) OVER (PARTITION BY campaign_id)` the campaign's total.",
      "",
      "The exhaustion date is the earliest date whose running total is at least the budget — reaching it exactly counts — so the query keeps the qualifying days and takes `MIN(spend_date)`. Because the running total only grows, every later day qualifies too, and the minimum is the crossing. The campaign list is the driver of a `LEFT JOIN`, so campaigns that never ran out, or never spent, keep a row whose `exhausted_on` is NULL; `DATEDIFF` and the subtraction then return NULL as well, exactly as asked.",
      "",
      "The alternative computes each charge's running total with a correlated `SUM` over all charges up to that date — equivalent, since the sum covers the whole day — and the total spend with another subquery. It is quadratic per campaign; the window version sorts each campaign's days once.",
    ].join("\n"),
  },

  {
    slug: "meta-reels-shopping-funnel-in-order",
    title: "Meta: Instagram Reels Shopping Funnel, Steps in Order",
    difficulty: "HARD",
    topics: ["Joins", "Subqueries", "Aggregation"],
    description: [
      "Instagram Shopping measures a four-step funnel that starts from a Reel: `reel_view` → `product_tap` → `add_to_cart` → `purchase`. A user **reaches step k** when they have events of steps 1 through k at **strictly increasing times**, in that order — a tap at the very same second as the view, or a cart add before any qualifying tap, does not move them forward.",
      "",
      "Return exactly four rows with the columns `step` (1–4), `event_type` (the step's event name) and `users` (how many users reached that step), **ordered by `step`**. A step nobody reached shows 0.",
    ].join("\n"),
    tables: [
      {
        name: "ShopEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "event_type", type: "enum", values: ["reel_view", "product_tap", "add_to_cart", "purchase"] },
          { name: "event_at", type: "datetime" },
        ],
        primaryKey: ["event_id"],
        note: "One row per logged event. A user can log the same event type many times, in any order.",
      },
    ],
    examples: [
      {
        ShopEvent: [
          [1, 1, "reel_view", "2025-08-01 10:00:00"],
          [2, 1, "product_tap", "2025-08-01 10:05:00"],
          [3, 1, "add_to_cart", "2025-08-01 10:07:00"],
          [4, 1, "purchase", "2025-08-01 10:20:00"],
          [5, 2, "product_tap", "2025-08-01 09:00:00"],
          [6, 2, "reel_view", "2025-08-01 09:10:00"],
          [7, 2, "add_to_cart", "2025-08-01 09:15:00"],
          [8, 3, "reel_view", "2025-08-01 11:00:00"],
          [9, 3, "product_tap", "2025-08-01 11:02:00"],
          [10, 3, "purchase", "2025-08-01 11:30:00"],
          [11, 4, "reel_view", "2025-08-01 12:00:00"],
          [12, 4, "product_tap", "2025-08-01 12:00:00"],
          [13, 4, "product_tap", "2025-08-01 12:03:00"],
          [14, 4, "add_to_cart", "2025-08-01 12:10:00"],
          [15, 5, "purchase", "2025-08-01 13:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const steps = ["reel_view", "product_tap", "add_to_cart", "purchase"] as const;
      const rows: Cell[][] = [];
      for (const user of seq(1, ri(rng, 1, 8))) {
        let t = ri(rng, 0, 600);
        let next = 0;
        for (let k = ri(rng, 0, 6); k > 0; k--) {
          const type = chance(rng, 0.7) ? steps[Math.min(next, 3)]! : pick(rng, steps);
          if (type === steps[next]) next++;
          rows.push([0, user, type, at("2025-08-01", t)]);
          t += pick(rng, [0, 1, 2, 5, 15]);
        }
      }
      shuffle(rng, rows).forEach((r, i) => (r[0] = i + 1));
      return { ShopEvent: rows };
    },
    solution: [
      "WITH s1 AS (",
      "  SELECT user_id, MIN(event_at) AS t FROM ShopEvent WHERE event_type = 'reel_view' GROUP BY user_id",
      "), s2 AS (",
      "  SELECT s1.user_id, MIN(e.event_at) AS t FROM s1",
      "  JOIN ShopEvent e ON e.user_id = s1.user_id AND e.event_type = 'product_tap' AND e.event_at > s1.t",
      "  GROUP BY s1.user_id",
      "), s3 AS (",
      "  SELECT s2.user_id, MIN(e.event_at) AS t FROM s2",
      "  JOIN ShopEvent e ON e.user_id = s2.user_id AND e.event_type = 'add_to_cart' AND e.event_at > s2.t",
      "  GROUP BY s2.user_id",
      "), s4 AS (",
      "  SELECT s3.user_id FROM s3",
      "  JOIN ShopEvent e ON e.user_id = s3.user_id AND e.event_type = 'purchase' AND e.event_at > s3.t",
      "  GROUP BY s3.user_id",
      ")",
      "SELECT 1 AS step, 'reel_view' AS event_type, (SELECT COUNT(*) FROM s1) AS users",
      "UNION ALL SELECT 2, 'product_tap', (SELECT COUNT(*) FROM s2)",
      "UNION ALL SELECT 3, 'add_to_cart', (SELECT COUNT(*) FROM s3)",
      "UNION ALL SELECT 4, 'purchase', (SELECT COUNT(*) FROM s4)",
      "ORDER BY step",
    ].join("\n"),
    alternatives: [
      [
        "SELECT 1 AS step, 'reel_view' AS event_type, COUNT(DISTINCT user_id) AS users FROM ShopEvent WHERE event_type = 'reel_view'",
        "UNION ALL",
        "SELECT 2, 'product_tap', COUNT(DISTINCT a.user_id)",
        "FROM ShopEvent a JOIN ShopEvent b ON b.user_id = a.user_id AND b.event_type = 'product_tap' AND b.event_at > a.event_at",
        "WHERE a.event_type = 'reel_view'",
        "UNION ALL",
        "SELECT 3, 'add_to_cart', COUNT(DISTINCT a.user_id)",
        "FROM ShopEvent a",
        "JOIN ShopEvent b ON b.user_id = a.user_id AND b.event_type = 'product_tap' AND b.event_at > a.event_at",
        "JOIN ShopEvent c ON c.user_id = a.user_id AND c.event_type = 'add_to_cart' AND c.event_at > b.event_at",
        "WHERE a.event_type = 'reel_view'",
        "UNION ALL",
        "SELECT 4, 'purchase', COUNT(DISTINCT a.user_id)",
        "FROM ShopEvent a",
        "JOIN ShopEvent b ON b.user_id = a.user_id AND b.event_type = 'product_tap' AND b.event_at > a.event_at",
        "JOIN ShopEvent c ON c.user_id = a.user_id AND c.event_type = 'add_to_cart' AND c.event_at > b.event_at",
        "JOIN ShopEvent d ON d.user_id = a.user_id AND d.event_type = 'purchase' AND d.event_at > c.event_at",
        "WHERE a.event_type = 'reel_view'",
        "ORDER BY step",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Counting users who ever logged each event type is not enough — the order of events matters.",
      "Greedy works: for each user take the earliest view, then the earliest tap after it, then the earliest cart add after that tap, and so on.",
      "Each step is a CTE built from the previous one, so a user can only appear in step k if they appeared in step k − 1.",
      "Build the four output rows with `UNION ALL` so a step nobody reached still returns 0.",
    ],
    editorial: [
      "A naive funnel counts users who ever logged each event type; this one requires the steps to happen **in order**. The question for every user is whether there is a chain view < tap < cart < purchase of strictly increasing times.",
      "",
      "A greedy walk answers it. Take the user's earliest `reel_view`; from it, the earliest `product_tap` strictly later; from that, the earliest `add_to_cart` strictly later; and so on. Choosing the earliest event at each step is never worse than any other choice — an earlier time leaves more room for the next step — so a user who has *some* ordered chain is found by the greedy one. Each step is a CTE joined to the previous step's time with `event_at > t`, so equal timestamps do not advance anyone. The output is four constant rows glued with `UNION ALL`, each with a scalar count, which guarantees a 0 rather than a missing row for a step nobody reached.",
      "",
      "The alternative checks for the existence of an ordered chain with self-joins and `COUNT(DISTINCT user_id)`. It needs no greedy argument, but the joins multiply every combination of events before counting — fine for small logs, expensive for heavy users. The greedy CTEs keep one row per user per step.",
    ].join("\n"),
  },

  {
    slug: "meta-accounts-linked-to-banned-accounts-by-device",
    title: "Meta: Accounts Linked to Banned Accounts Through Shared Devices",
    difficulty: "HARD",
    topics: ["Subqueries", "Joins"],
    description: [
      "Meta's integrity team looks for ban evasion: people who come back with fresh accounts on the same phones. Two accounts are **directly linked** when both logged in on at least one common device. Links chain: an account linked to an account linked to a banned account is in the same cluster, two hops away.",
      "",
      "Return every account that is **not banned** but is connected, through any chain of links, to at least one banned account, with the columns `account_id` and `hops` — the **fewest** links from it to its **nearest** banned account (1 for an account sharing a device with a banned one). Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "FbAccount",
        columns: [
          { name: "account_id", type: "int" },
          { name: "is_banned", type: "bool" },
        ],
        primaryKey: ["account_id"],
        note: "One row per account; `is_banned` is 1 for accounts disabled for policy violations.",
      },
      {
        name: "DeviceLogin",
        columns: [
          { name: "account_id", type: "int" },
          { name: "device_id", type: "varchar" },
        ],
        primaryKey: ["account_id", "device_id"],
        note: "Each device an account has logged in on (one row per pair). Every `account_id` is in `FbAccount`.",
      },
    ],
    examples: [
      {
        FbAccount: [
          [1, 1],
          [2, 0],
          [3, 0],
          [4, 0],
          [5, 0],
          [6, 1],
          [7, 0],
          [8, 0],
        ],
        DeviceLogin: [
          [1, "dev-a"],
          [2, "dev-a"],
          [2, "dev-b"],
          [3, "dev-b"],
          [4, "dev-c"],
          [5, "dev-c"],
          [6, "dev-d"],
          [7, "dev-e"],
          [3, "dev-f"],
          [8, "dev-f"],
          [8, "dev-g"],
          [6, "dev-g"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 2, 10);
      const accounts: Cell[][] = seq(1, n).map((id) => [id, chance(rng, 0.2) ? 1 : 0]);
      if (chance(rng, 0.85)) accounts[ri(rng, 0, n - 1)]![1] = 1;
      const devices = seq(0, Math.max(2, Math.ceil(n / 1.5))).map((i) => `dev-${String.fromCharCode(97 + i)}`);
      const logins: Cell[][] = [];
      for (const a of accounts) for (const d of sample(rng, devices, ri(rng, 0, 2))) logins.push([a[0]!, d]);
      return { FbAccount: accounts, DeviceLogin: shuffle(rng, logins) };
    },
    solution: [
      "WITH RECURSIVE linked AS (",
      "  SELECT DISTINCT a.account_id AS src, b.account_id AS dst",
      "  FROM DeviceLogin a",
      "  JOIN DeviceLogin b ON b.device_id = a.device_id AND b.account_id <> a.account_id",
      "), reach AS (",
      "  SELECT account_id, 0 AS hops FROM FbAccount WHERE is_banned = 1",
      "  UNION",
      "  SELECT l.dst, r.hops + 1",
      "  FROM reach r",
      "  JOIN linked l ON l.src = r.account_id",
      "  WHERE r.hops < (SELECT COUNT(*) FROM FbAccount)",
      ")",
      "SELECT r.account_id, MIN(r.hops) AS hops",
      "FROM reach r",
      "JOIN FbAccount f ON f.account_id = r.account_id",
      "WHERE f.is_banned = 0",
      "GROUP BY r.account_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE linked AS (",
        "  SELECT DISTINCT a.account_id AS src, b.account_id AS dst",
        "  FROM DeviceLogin a JOIN DeviceLogin b ON b.device_id = a.device_id AND b.account_id <> a.account_id",
        "), walk AS (",
        "  SELECT account_id AS start_id, account_id AS at_id, 0 AS hops FROM FbAccount WHERE is_banned = 0",
        "  UNION",
        "  SELECT w.start_id, l.dst, w.hops + 1",
        "  FROM walk w JOIN linked l ON l.src = w.at_id",
        "  WHERE w.hops < (SELECT COUNT(*) FROM FbAccount)",
        ")",
        "SELECT w.start_id AS account_id, MIN(w.hops) AS hops",
        "FROM walk w",
        "JOIN FbAccount b ON b.account_id = w.at_id AND b.is_banned = 1",
        "GROUP BY w.start_id",
      ].join("\n"),
    ],
    hints: [
      "Turn device logins into account-to-account edges with a self-join on `device_id`.",
      "\"Any chain of links\" means graph reachability — a recursive CTE that starts from the banned accounts and follows edges.",
      "Carry a hop counter and take the minimum per account at the end.",
      "The graph can have cycles; cap the depth (no shortest path is longer than the number of accounts) and use `UNION` so repeated (account, hops) rows are dropped.",
    ],
    editorial: [
      "First the logins become a graph: a self-join of `DeviceLogin` on `device_id` (excluding an account paired with itself) gives an edge for every pair of accounts that shared a device; `DISTINCT` collapses pairs that shared several devices into one edge.",
      "",
      "Reachability over that graph needs recursion. The anchor puts every banned account at distance 0; each recursive step follows an edge and adds one hop. Because the graph has cycles — two accounts on one device link each other both ways — the recursion needs a stopping rule: a shortest path never has more links than there are accounts, so `hops < COUNT(*)` bounds it, and `UNION` (not `UNION ALL`) removes duplicate (account, hops) rows so the work stays small. Grouping the reached rows by account and taking `MIN(hops)` gives the distance to the nearest banned account; banned accounts themselves are filtered out, and accounts in clusters without a banned member are never reached.",
      "",
      "The alternative searches in the other direction — from every clean account outward, keeping the shortest walk that ends on a banned account. It explores once per starting account rather than once overall, so a breadth-first search from the banned set is the cheaper choice on a large graph.",
    ].join("\n"),
  },
];
