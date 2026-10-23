import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, atTime, chance, dateBetween, names, pick, ri, roundTo, sample, shuffle } from "./kit.js";

/**
 * Google: the questions an analyst or data engineer at Google gets asked —
 * Search quality (zero-result queries, click-through by position,
 * reformulations, experiment lift), Ads (keyword match types), Workspace
 * (Drive external sharing, late Meet hosts), YouTube (partner-programme
 * eligibility, autoplay chains), Play (installs, quick uninstalls, the
 * service-fee tier), Maps (reviews, categories), Gmail
 * (storage quota, spam-filter quality, reply times), Cloud billing and VM
 * costs, Workspace seats, Pixel sales, Nest and Chromebook fleets. Every schema and number is
 * invented for practice — none of it is Google's real data or schema.
 * Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
const pad = (n: number) => String(n).padStart(2, "0");
/** 'YYYY-MM-DD HH:MM:SS' at an exact time on `date`. */
const at = (date: string, h: number, m: number, s = 0) => `${date} ${pad(h)}:${pad(m)}:${pad(s)}`;
/** A 'YYYY-MM-DD HH:MM:SS' moved by `secs` seconds. */
function addSecs(dt: string, secs: number): string {
  const d = new Date(Date.parse(`${dt.replace(" ", "T")}Z`) + secs * 1000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

const LOCALES = ["en-IN", "hi-IN", "ta-IN", "bn-IN", "en-US", "mr-IN"] as const;
const QUERIES = [
  "weather pune", "ipl schedule", "train pnr status", "biryani near me", "how to tie a saree", "upi limit per day",
  "best phone under 20000", "monsoon session dates", "rangoli designs", "gate exam syllabus", "metro card recharge", "diwali sale",
] as const;
const APP_NAMES = ["Chai Timer", "Cricket Scorebook", "Metro Buddy", "Rangoli Maker", "Tiffin Tracker", "Raga Tuner", "Kirana Ledger", "Exam Countdown", "Bus Pass Wallet", "Yoga Daily"] as const;
const PROJECTS = ["maps-tiles-prod", "yt-transcode", "search-logs-etl", "ads-bidder", "play-review-ml", "gmail-spam-eval", "pixel-telemetry", "cloud-demo-sandbox"] as const;
const PIXEL_MODELS = ["Pixel 9", "Pixel 9 Pro", "Pixel 9 Pro Fold", "Pixel 9a", "Pixel 8a"] as const;
const SCHOOLS = ["DPS Pune", "Kendriya Vidyalaya Kochi", "St. Xavier's Kolkata", "Navodaya Jaipur", "Ryan Hyderabad"] as const;
const KEYWORDS = ["running shoes", "cricket bat", "trekking poles", "personal loan", "lunch box", "jee coaching", "cheap flights", "steel bottle"] as const;
const PLACES = ["Vidyarthi Bhavan", "Koshy's", "Toit", "Leopold Cafe", "Karim's", "Saravana Bhavan", "Indian Coffee House", "Mavalli Tiffin Rooms", "Britannia & Co", "Peter Cat"] as const;

export const COMPANY_GOOGLE: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "google-zero-result-searches-per-locale",
    title: "Google: Zero-Result Searches per Locale",
    difficulty: "EASY",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "A Search quality analyst wants to know which language markets most often hit an empty results page, because those queries point at content gaps in the index.",
      "",
      "For every `locale` that appears in `SearchLog`, return `locale`, `total_searches` (all its searches) and `zero_result_searches` (its searches with **`result_count = 0`**). Order the rows by `zero_result_searches` descending, then `locale` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "SearchLog",
        columns: [
          { name: "search_id", type: "int" },
          { name: "locale", type: "varchar" },
          { name: "query_text", type: "varchar" },
          { name: "result_count", type: "int" },
          { name: "searched_at", type: "datetime" },
        ],
        primaryKey: ["search_id"],
        note: "One row per search. `result_count` is the number of organic results returned and is never NULL.",
      },
    ],
    examples: [
      {
        SearchLog: [
          [1, "hi-IN", "monsoon session dates", 0, "2025-05-01 09:12:00"],
          [2, "en-IN", "weather pune", 412, "2025-05-01 09:15:30"],
          [3, "hi-IN", "rangoli designs", 98, "2025-05-01 10:02:11"],
          [4, "ta-IN", "metro card recharge", 0, "2025-05-01 11:40:00"],
          [5, "en-IN", "gate exam syllabus", 0, "2025-05-01 12:00:05"],
          [6, "ta-IN", "biryani near me", 0, "2025-05-01 13:22:47"],
          [7, "bn-IN", "diwali sale", 250, "2025-05-01 14:05:09"],
          [8, "hi-IN", "upi limit per day", 0, "2025-05-01 15:30:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      const locs = sample(rng, LOCALES, ri(rng, 1, LOCALES.length));
      return {
        SearchLog: seq(1, n).map((id) => [
          id,
          pick(rng, locs),
          pick(rng, QUERIES),
          chance(rng, 0.35) ? 0 : ri(rng, 1, 600),
          atTime(rng, dateBetween(rng, "2025-05-01", "2025-05-07")),
        ]),
      };
    },
    solution: [
      "SELECT locale,",
      "       COUNT(*) AS total_searches,",
      "       SUM(CASE WHEN result_count = 0 THEN 1 ELSE 0 END) AS zero_result_searches",
      "FROM SearchLog",
      "GROUP BY locale",
      "ORDER BY zero_result_searches DESC, locale",
    ].join("\n"),
    alternatives: [
      "SELECT locale, COUNT(*) AS total_searches, COUNT(IF(result_count = 0, 1, NULL)) AS zero_result_searches FROM SearchLog GROUP BY locale ORDER BY zero_result_searches DESC, locale",
      "SELECT l.locale, l.total_searches, (SELECT COUNT(*) FROM SearchLog z WHERE z.locale = l.locale AND z.result_count = 0) AS zero_result_searches FROM (SELECT locale, COUNT(*) AS total_searches FROM SearchLog GROUP BY locale) l ORDER BY zero_result_searches DESC, l.locale",
    ],
    ordered: true,
    hints: [
      "One row per locale means grouping by `locale`.",
      "Count two things in the same group: every row, and only the rows with no results.",
      "A `CASE` that yields 1 for a zero-result search and 0 otherwise can be summed.",
    ],
    editorial: [
      "Each output row summarises one locale, so the query groups `SearchLog` by `locale`. Inside a group two counts are needed at once. `COUNT(*)` is the total, and the zero-result count is **conditional aggregation**: `SUM(CASE WHEN result_count = 0 THEN 1 ELSE 0 END)` adds one for every empty results page and nothing for the rest. Because the CASE returns 0 rather than NULL for other rows, a locale whose searches all found something still shows `0`, not NULL.",
      "",
      "Only locales that appear in the log can be grouped, which is exactly what the statement asks. The order is fully fixed: zero-result count descending, then the locale name to break ties, so two markets with the same count always come out the same way.",
      "",
      "`COUNT(IF(result_count = 0, 1, NULL))` is the same idea — COUNT skips the NULLs. A correlated subquery per locale also works but reads the table again for each group; the single grouped scan is linear.",
    ].join("\n"),
  },

  {
    slug: "google-published-play-apps-with-no-installs",
    title: "Google: Published Play Apps With No Installs",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "The Play Console team wants to nudge developers whose live listings have never been installed, so they can improve the store listing or screenshots.",
      "",
      "Return `app_id` and `app_name` of every app whose `status` is **`published`** and that has **no row at all** in `Install`. Draft and removed apps are never in the answer, even without installs. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "PlayApp",
        columns: [
          { name: "app_id", type: "int" },
          { name: "app_name", type: "varchar" },
          { name: "developer", type: "varchar" },
          { name: "status", type: "enum", values: ["published", "draft", "removed"] },
        ],
        primaryKey: ["app_id"],
        note: "One row per app listing on the store.",
      },
      {
        name: "Install",
        columns: [
          { name: "install_id", type: "int" },
          { name: "app_id", type: "int" },
          { name: "device_id", type: "int" },
          { name: "installed_on", type: "date" },
        ],
        primaryKey: ["install_id"],
        note: "One row per install; `app_id` always names an app.",
      },
    ],
    examples: [
      {
        PlayApp: [
          [1, "Chai Timer", "Kettle Labs", "published"],
          [2, "Metro Buddy", "Transit Dev", "published"],
          [3, "Rangoli Maker", "Kolam Apps", "draft"],
          [4, "Raga Tuner", "Sur Studio", "published"],
          [5, "Kirana Ledger", "Bahi Tech", "removed"],
        ],
        Install: [
          [101, 2, 9001, "2025-04-02"],
          [102, 2, 9002, "2025-04-03"],
          [103, 5, 9003, "2025-03-15"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 2, 10);
      const apps: Cell[][] = seq(1, n).map((id, i) => [id, APP_NAMES[i]!, pick(rng, ["Kettle Labs", "Sur Studio", "Bahi Tech", "Transit Dev"]), pick(rng, ["published", "published", "published", "draft", "removed"])]);
      // Only some apps ever get installed, so most datasets keep an uninstalled live app.
      const popular = sample(rng, seq(1, n), ri(rng, 0, Math.max(1, n - 2)));
      const k = popular.length === 0 ? 0 : ri(rng, 1, 15);
      const installs: Cell[][] = seq(101, k).map((id) => [id, pick(rng, popular), ri(rng, 9000, 9050), dateBetween(rng, "2025-03-01", "2025-05-31")]);
      return { PlayApp: apps, Install: installs };
    },
    solution: [
      "SELECT a.app_id, a.app_name",
      "FROM PlayApp a",
      "LEFT JOIN Install i ON i.app_id = a.app_id",
      "WHERE a.status = 'published'",
      "  AND i.install_id IS NULL",
    ].join("\n"),
    alternatives: [
      "SELECT app_id, app_name FROM PlayApp a WHERE status = 'published' AND NOT EXISTS (SELECT 1 FROM Install i WHERE i.app_id = a.app_id)",
      "SELECT app_id, app_name FROM PlayApp WHERE status = 'published' AND app_id NOT IN (SELECT app_id FROM Install)",
    ],
    hints: [
      "You need apps for which a matching row does *not* exist — an anti join.",
      "A LEFT JOIN keeps every app; where no install matched, the install columns are NULL.",
      "Filter the status in the same WHERE clause.",
    ],
    editorial: [
      "This is an **anti join**: keep the apps that have no partner row in `Install`. The LEFT JOIN form pairs each app with all of its installs and, for an app with none, produces one row whose `Install` columns are NULL. Testing `i.install_id IS NULL` — the primary key, which is never NULL in a real row — keeps exactly those apps. An app with several installs produces several joined rows, none of them NULL, so it disappears entirely.",
      "",
      "The status test goes in `WHERE`, because it filters apps, not installs. Draft and removed apps drop out whether or not anyone installed them.",
      "",
      "`NOT EXISTS` states the same thing directly and stops at the first install it finds. `NOT IN` works here because `Install.app_id` is never NULL; if it could be, a single NULL would make `NOT IN` return no rows at all, which is why `NOT EXISTS` is the safer habit. All three run in one pass with an index on `Install.app_id`.",
    ].join("\n"),
  },

  {
    slug: "google-accounts-over-their-storage-quota",
    title: "Google: Accounts Over Their Storage Quota",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "Storage is shared across Gmail, Drive and Photos. The Google One team mails a warning to every account whose combined usage has gone past its plan's quota.",
      "",
      "Return `user_id`, `email`, `used_mb` (the account's usage summed over all products) and `quota_mb` for every account whose `used_mb` is **strictly greater** than its `quota_mb`. An account exactly at its quota is not over it, and an account with no usage rows has used nothing. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Account",
        columns: [
          { name: "user_id", type: "int" },
          { name: "email", type: "varchar" },
          { name: "plan", type: "enum", values: ["free", "basic", "premium"] },
          { name: "quota_mb", type: "int" },
        ],
        primaryKey: ["user_id"],
        note: "One row per account; `quota_mb` is the storage its plan allows.",
      },
      {
        name: "StorageUsage",
        columns: [
          { name: "user_id", type: "int" },
          { name: "product", type: "enum", values: ["gmail", "drive", "photos"] },
          { name: "used_mb", type: "int" },
        ],
        primaryKey: ["user_id", "product"],
        note: "Current usage of one product by one account; a product the account never used has no row.",
      },
    ],
    examples: [
      {
        Account: [
          [1, "asha@gmail.com", "free", 15360],
          [2, "ravi@gmail.com", "free", 15360],
          [3, "meera@gmail.com", "basic", 102400],
          [4, "kabir@gmail.com", "free", 15360],
          [5, "zara@gmail.com", "premium", 204800],
        ],
        StorageUsage: [
          [1, "gmail", 6000],
          [1, "drive", 4000],
          [1, "photos", 7000],
          [2, "gmail", 15360],
          [3, "photos", 99000],
          [3, "drive", 5000],
          [5, "drive", 1200],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 8);
      const quota = { free: 15360, basic: 102400, premium: 204800 } as const;
      const accounts: Cell[][] = [];
      const usage: Cell[][] = [];
      for (const id of seq(1, n)) {
        const plan = pick(rng, ["free", "free", "basic", "premium"] as const);
        const q = quota[plan];
        accounts.push([id, `user${id}@gmail.com`, plan, q]);
        const prods = sample(rng, ["gmail", "drive", "photos"], pick(rng, [0, 1, 2, 3, 3, 3]));
        let total = 0;
        prods.forEach((p, i) => {
          let used = ri(rng, 0, Math.floor(q * 0.7));
          // Now and then land exactly on the quota, the case "strictly" is about.
          if (i === prods.length - 1 && chance(rng, 0.25) && q - total >= 0) used = q - total;
          total += used;
          usage.push([id, p, used]);
        });
      }
      return { Account: accounts, StorageUsage: usage };
    },
    solution: [
      "SELECT a.user_id, a.email, SUM(s.used_mb) AS used_mb, a.quota_mb",
      "FROM Account a",
      "JOIN StorageUsage s ON s.user_id = a.user_id",
      "GROUP BY a.user_id, a.email, a.quota_mb",
      "HAVING SUM(s.used_mb) > a.quota_mb",
    ].join("\n"),
    alternatives: [
      "SELECT a.user_id, a.email, t.used_mb, a.quota_mb FROM Account a JOIN (SELECT user_id, SUM(used_mb) AS used_mb FROM StorageUsage GROUP BY user_id) t ON t.user_id = a.user_id WHERE t.used_mb > a.quota_mb",
      "SELECT * FROM (SELECT user_id, email, (SELECT COALESCE(SUM(used_mb), 0) FROM StorageUsage s WHERE s.user_id = a.user_id) AS used_mb, quota_mb FROM Account a) x WHERE used_mb > quota_mb",
    ],
    hints: [
      "First add up each account's usage across its product rows.",
      "A condition on a sum belongs in HAVING, not WHERE.",
      "Equal to the quota is not over it — use a strict comparison.",
    ],
    editorial: [
      "An account's usage is spread over up to three rows of `StorageUsage`, so it has to be summed before it can be compared. Joining `Account` to `StorageUsage` and grouping by the account gives one group per account with usage; `SUM(s.used_mb)` is its total. The quota is a column of the account, constant inside the group, so it is listed in `GROUP BY` and can be selected and compared.",
      "",
      "The comparison is on an aggregate, so it lives in `HAVING`: `SUM(s.used_mb) > a.quota_mb`. The strict `>` keeps an account sitting exactly on its quota out of the warning list. An account with no usage rows never forms a group in the inner join — correct, because zero usage is never over a quota.",
      "",
      "The alternative sums usage in a derived table first and joins the totals back, which avoids grouping by the account's columns; a correlated scalar subquery per account works too. Each is one pass over `StorageUsage` with an index on `user_id`.",
    ].join("\n"),
  },

  {
    slug: "google-well-rated-places-with-enough-reviews",
    title: "Google: Well-Rated Places With Enough Reviews",
    difficulty: "EASY",
    topics: ["Aggregation", "Joins"],
    description: [
      "Google Maps wants to badge restaurants that diners consistently love, but only where there is enough evidence and only from genuine reviews.",
      "",
      "Ignoring every review with **`is_spam = 1`**, return `place_id`, `place_name` and `review_count` (its genuine reviews) for each place with **at least 3** genuine reviews whose average genuine rating is **at least 4.5**. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Place",
        columns: [
          { name: "place_id", type: "int" },
          { name: "place_name", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["place_id"],
        note: "One row per place listed on Maps.",
      },
      {
        name: "PlaceReview",
        columns: [
          { name: "review_id", type: "int" },
          { name: "place_id", type: "int" },
          { name: "reviewer", type: "varchar" },
          { name: "rating", type: "int" },
          { name: "is_spam", type: "bool" },
        ],
        primaryKey: ["review_id"],
        note: "`rating` is 1–5 stars. `is_spam` is 1 for a review the spam classifier removed.",
      },
    ],
    examples: [
      {
        Place: [
          [1, "Vidyarthi Bhavan", "Bengaluru"],
          [2, "Leopold Cafe", "Mumbai"],
          [3, "Karim's", "Delhi"],
          [4, "Peter Cat", "Kolkata"],
        ],
        PlaceReview: [
          [1, 1, "Aarav", 5, 0],
          [2, 1, "Diya", 4, 0],
          [3, 1, "Kabir", 5, 0],
          [4, 1, "Neha", 4, 0],
          [5, 2, "Rohan", 5, 0],
          [6, 2, "Zara", 5, 0],
          [7, 2, "Ishaan", 5, 1],
          [8, 3, "Meera", 5, 0],
          [9, 3, "Priya", 5, 0],
          [10, 3, "Tanvi", 1, 1],
          [11, 3, "Riya", 4, 0],
          [12, 4, "Dev", 3, 0],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 7);
      const places: Cell[][] = sample(rng, PLACES, n).map((name, i) => [i + 1, name, pick(rng, ["Bengaluru", "Mumbai", "Delhi", "Kolkata", "Chennai"])]);
      const who = ["Aarav", "Diya", "Kabir", "Neha", "Rohan", "Zara", "Meera", "Priya"];
      const reviews: Cell[][] = [];
      for (const pid of seq(1, n)) {
        // A loved place mostly gets 5s and 4s; an ordinary one gets anything.
        const loved = chance(rng, 0.6);
        const stars = loved ? [5, 5, 5, 4] : [5, 4, 4, 3, 2, 1];
        for (let j = ri(rng, 0, 6); j > 0; j--) reviews.push([0, pid, pick(rng, who), pick(rng, stars), chance(rng, 0.15) ? 1 : 0]);
      }
      shuffle(rng, reviews).forEach((r, i) => (r[0] = i + 1));
      return { Place: places, PlaceReview: reviews };
    },
    solution: [
      "SELECT p.place_id, p.place_name, COUNT(*) AS review_count",
      "FROM Place p",
      "JOIN PlaceReview r ON r.place_id = p.place_id",
      "WHERE r.is_spam = 0",
      "GROUP BY p.place_id, p.place_name",
      "HAVING COUNT(*) >= 3 AND AVG(r.rating) >= 4.5",
    ].join("\n"),
    alternatives: [
      "SELECT p.place_id, p.place_name, t.review_count FROM Place p JOIN (SELECT place_id, COUNT(*) AS review_count, SUM(rating) AS stars FROM PlaceReview WHERE is_spam = 0 GROUP BY place_id) t ON t.place_id = p.place_id WHERE t.review_count >= 3 AND t.stars * 2 >= t.review_count * 9",
      "SELECT p.place_id, p.place_name, SUM(IF(r.is_spam = 0, 1, 0)) AS review_count FROM Place p JOIN PlaceReview r ON r.place_id = p.place_id GROUP BY p.place_id, p.place_name HAVING SUM(IF(r.is_spam = 0, 1, 0)) >= 3 AND SUM(IF(r.is_spam = 0, r.rating, 0)) >= 4.5 * SUM(IF(r.is_spam = 0, 1, 0))",
    ],
    hints: [
      "Drop the spam reviews before counting or averaging anything.",
      "Both thresholds are about groups of reviews, so they go in HAVING.",
      "\"At least\" includes the boundary: exactly 3 reviews and an average of exactly 4.5 both qualify.",
    ],
    editorial: [
      "Spam reviews must not count toward either threshold, so they are removed in `WHERE` before grouping — filtering rows before aggregation is what WHERE is for. Grouping the remaining reviews by place gives each place's genuine review count and average rating, and both conditions go into `HAVING`: `COUNT(*) >= 3` and `AVG(r.rating) >= 4.5`.",
      "",
      "Both comparisons are inclusive. A place with ratings 5, 4, 5, 4 averages exactly 4.5 and earns the badge. A place whose only spam-free reviews number two is excluded however perfect they are; and if every review of a place is spam it forms no group at all.",
      "",
      "The first alternative avoids a fractional average by comparing totals — `2 × stars ≥ 9 × reviews` is the same test as `stars / reviews ≥ 4.5` — which is a handy trick when exactness matters. The second keeps spam rows in the join and filters inside the aggregates with `IF`. All of them are one grouped scan of the reviews.",
    ].join("\n"),
  },

  {
    slug: "google-march-cloud-bill-for-every-project",
    title: "Google: March Cloud Bill for Every Project",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation", "Dates"],
    description: [
      "A FinOps analyst on Google Cloud prepares the March 2025 bill review and wants every project on the list — including idle ones, so their owners can be asked to shut them down.",
      "",
      "Return `project_name` and `march_cost_cents`, the sum of the project's `cost_cents` for usage dated **2025-03-01 to 2025-03-31 inclusive** (credits are negative lines and reduce the total). A project with no March lines shows **0**. Order by `march_cost_cents` descending, then `project_name` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "CloudProject",
        columns: [
          { name: "project_id", type: "int" },
          { name: "project_name", type: "varchar" },
          { name: "billing_account", type: "varchar" },
        ],
        primaryKey: ["project_id"],
        note: "One row per project; `project_name` is unique.",
      },
      {
        name: "UsageCost",
        columns: [
          { name: "line_id", type: "int" },
          { name: "project_id", type: "int" },
          { name: "service", type: "varchar" },
          { name: "usage_date", type: "date" },
          { name: "cost_cents", type: "int" },
        ],
        primaryKey: ["line_id"],
        note: "One billing line. A negative `cost_cents` is a credit (a free-tier or promotional discount).",
      },
    ],
    examples: [
      {
        CloudProject: [
          [1, "maps-tiles-prod", "BA-01"],
          [2, "yt-transcode", "BA-01"],
          [3, "cloud-demo-sandbox", "BA-02"],
          [4, "search-logs-etl", "BA-02"],
        ],
        UsageCost: [
          [1, 1, "Compute Engine", "2025-03-01", 42000],
          [2, 1, "Cloud Storage", "2025-03-31", 8000],
          [3, 1, "Compute Engine", "2025-04-01", 39000],
          [4, 2, "Transcoder API", "2025-03-14", 61000],
          [5, 2, "Free-tier credit", "2025-03-14", -11000],
          [6, 3, "Compute Engine", "2025-02-28", 1500],
          [7, 4, "BigQuery", "2025-03-20", 50000],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 7);
      const projects: Cell[][] = sample(rng, PROJECTS, n).map((name, i) => [i + 1, name, pick(rng, ["BA-01", "BA-02", "BA-03"])]);
      const k = chance(rng, 0.05) ? 0 : ri(rng, 1, 22);
      const lines: Cell[][] = seq(1, k).map((id) => [
        id,
        ri(rng, 1, n),
        pick(rng, ["Compute Engine", "BigQuery", "Cloud Storage", "Cloud Run", "Promotional credit"]),
        chance(rng, 0.2) ? pick(rng, ["2025-02-28", "2025-03-01", "2025-03-31", "2025-04-01"]) : dateBetween(rng, "2025-02-20", "2025-04-10"),
        chance(rng, 0.15) ? -roundTo(rng, 500, 5000, 500) : roundTo(rng, 500, 60000, 500),
      ]);
      return { CloudProject: projects, UsageCost: lines };
    },
    solution: [
      "SELECT p.project_name, COALESCE(SUM(u.cost_cents), 0) AS march_cost_cents",
      "FROM CloudProject p",
      "LEFT JOIN UsageCost u",
      "  ON u.project_id = p.project_id",
      " AND u.usage_date BETWEEN '2025-03-01' AND '2025-03-31'",
      "GROUP BY p.project_id, p.project_name",
      "ORDER BY march_cost_cents DESC, p.project_name",
    ].join("\n"),
    alternatives: [
      "SELECT project_name, (SELECT COALESCE(SUM(cost_cents), 0) FROM UsageCost u WHERE u.project_id = p.project_id AND YEAR(u.usage_date) = 2025 AND MONTH(u.usage_date) = 3) AS march_cost_cents FROM CloudProject p ORDER BY march_cost_cents DESC, project_name",
      "SELECT p.project_name, SUM(CASE WHEN u.usage_date >= '2025-03-01' AND u.usage_date < '2025-04-01' THEN u.cost_cents ELSE 0 END) AS march_cost_cents FROM CloudProject p LEFT JOIN UsageCost u ON u.project_id = p.project_id GROUP BY p.project_id, p.project_name ORDER BY march_cost_cents DESC, p.project_name",
    ],
    ordered: true,
    hints: [
      "Every project must appear, so start from `CloudProject` and LEFT JOIN the costs.",
      "Put the March date range in the ON clause — in WHERE it would remove the idle projects again.",
      "SUM over no rows is NULL; turn it into 0.",
    ],
    editorial: [
      "Every project belongs in the answer, so the query starts from `CloudProject` and **LEFT JOINs** the billing lines. The subtle part is where the date filter goes. Placed in the `ON` clause, it limits which lines are attached; a project with no March lines still survives with NULL cost columns. Placed in `WHERE`, `u.usage_date BETWEEN …` would be NULL for those rows and silently turn the LEFT JOIN back into an inner join, dropping the idle projects the analyst wants to see.",
      "",
      "`SUM` over only NULLs is NULL, so `COALESCE(…, 0)` reports idle projects as 0. Credits are ordinary negative numbers and the sum nets them off without special handling. `BETWEEN` is inclusive at both ends, which keeps lines on the 1st and the 31st.",
      "",
      "Alternatives: a correlated scalar subquery per project, or keep every line in the join and sum only March lines with a `CASE`. The order is fully determined by the cost and then the unique project name.",
    ].join("\n"),
  },

  {
    slug: "google-pixel-units-sold-and-returned-per-model",
    title: "Google: Pixel Units Sold and Returned per Model",
    difficulty: "EASY",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "The Google Store's hardware planning team reconciles sales against returns for each Pixel model before the next production order.",
      "",
      "For every `model` with at least one order line, return `model`, `units_sold` (the units of its `sale` lines), `units_returned` (the units of its `return` lines) and `net_units` (sold minus returned). A model with no returns shows **0** returned. Order by `net_units` descending, then `model` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "PixelOrderLine",
        columns: [
          { name: "line_id", type: "int" },
          { name: "order_id", type: "int" },
          { name: "model", type: "varchar" },
          { name: "units", type: "int" },
          { name: "line_type", type: "enum", values: ["sale", "return"] },
        ],
        primaryKey: ["line_id"],
        note: "One line of a Google Store order. A return is logged as its own line with `line_type = 'return'` and a positive `units`.",
      },
    ],
    examples: [
      {
        PixelOrderLine: [
          [1, 5001, "Pixel 9", 2, "sale"],
          [2, 5002, "Pixel 9 Pro", 1, "sale"],
          [3, 5003, "Pixel 9", 1, "sale"],
          [4, 5001, "Pixel 9", 1, "return"],
          [5, 5004, "Pixel 9a", 3, "sale"],
          [6, 5005, "Pixel 9 Pro", 1, "sale"],
          [7, 5005, "Pixel 9 Pro", 1, "return"],
          [8, 5006, "Pixel 9 Pro Fold", 1, "sale"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 24);
      return {
        PixelOrderLine: seq(1, n).map((id) => [id, ri(rng, 5000, 5015), pick(rng, PIXEL_MODELS), ri(rng, 1, 3), chance(rng, 0.25) ? "return" : "sale"]),
      };
    },
    solution: [
      "SELECT model,",
      "       SUM(CASE WHEN line_type = 'sale' THEN units ELSE 0 END) AS units_sold,",
      "       SUM(CASE WHEN line_type = 'return' THEN units ELSE 0 END) AS units_returned,",
      "       SUM(CASE WHEN line_type = 'sale' THEN units ELSE -units END) AS net_units",
      "FROM PixelOrderLine",
      "GROUP BY model",
      "ORDER BY net_units DESC, model",
    ].join("\n"),
    alternatives: [
      "SELECT model, SUM(IF(line_type = 'sale', units, 0)) AS units_sold, SUM(IF(line_type = 'return', units, 0)) AS units_returned, SUM(IF(line_type = 'sale', units, 0)) - SUM(IF(line_type = 'return', units, 0)) AS net_units FROM PixelOrderLine GROUP BY model ORDER BY net_units DESC, model",
      "SELECT m.model, COALESCE(s.u, 0) AS units_sold, COALESCE(r.u, 0) AS units_returned, COALESCE(s.u, 0) - COALESCE(r.u, 0) AS net_units FROM (SELECT DISTINCT model FROM PixelOrderLine) m LEFT JOIN (SELECT model, SUM(units) AS u FROM PixelOrderLine WHERE line_type = 'sale' GROUP BY model) s ON s.model = m.model LEFT JOIN (SELECT model, SUM(units) AS u FROM PixelOrderLine WHERE line_type = 'return' GROUP BY model) r ON r.model = m.model ORDER BY net_units DESC, m.model",
    ],
    ordered: true,
    hints: [
      "One row per model: group by `model`.",
      "Each total sums `units`, but only over lines of one type — put the condition inside the SUM.",
      "A return can be counted as negative units for the net figure.",
    ],
    editorial: [
      "All three figures come from the same group of lines, so one `GROUP BY model` and **conditional aggregation** answer it in a single pass. `SUM(CASE WHEN line_type = 'sale' THEN units ELSE 0 END)` adds only the sale units; the same with `'return'` adds the returned units. For the net, the CASE can return `-units` for a return so the sum subtracts it directly.",
      "",
      "The `ELSE 0` matters: it makes a model with no returns report `0` rather than NULL, and keeps a model whose only lines are returns (possible when the sale happened before the period) correct with `0` sold and a negative net.",
      "",
      "Splitting into two grouped subqueries — one for sales, one for returns — joined back to the list of models gives the same result with more reading. The order is fully fixed: net units descending, then the model name.",
    ].join("\n"),
  },

  {
    slug: "google-ad-keyword-match-type-from-syntax",
    title: "Google: Read Match Type From Ad Keyword Syntax",
    difficulty: "EASY",
    topics: ["Strings", "Conditional Logic"],
    description: [
      "In a Google Ads bulk upload, advertisers mark a keyword's match type with punctuation: `[running shoes]` is **exact**, `\"running shoes\"` is **phrase**, and plain `running shoes` is **broad**. An ads-quality engineer needs the type as its own column.",
      "",
      "Return `keyword_id`, `keyword` (the text with the enclosing brackets or quotes removed) and `match_type` (`exact`, `phrase` or `broad`). Only text that **both starts and ends** with the pair counts; anything else, including a half-closed `[running shoes`, is broad and kept exactly as written. Order by `keyword_id`.",
    ].join("\n"),
    tables: [
      {
        name: "AdKeyword",
        columns: [
          { name: "keyword_id", type: "int" },
          { name: "ad_group_id", type: "int" },
          { name: "keyword_text", type: "varchar" },
        ],
        primaryKey: ["keyword_id"],
        note: "Keyword text exactly as uploaded; it has no leading or trailing spaces and is at least three characters long.",
      },
    ],
    examples: [
      {
        AdKeyword: [
          [1, 10, "[running shoes]"],
          [2, 10, "\"running shoes\""],
          [3, 10, "running shoes"],
          [4, 11, "[cricket bat"],
          [5, 11, "\"cricket bat\""],
          [6, 12, "cheap flights]"],
          [7, 12, "[jee coaching]"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 15);
      return {
        AdKeyword: seq(1, n).map((id) => {
          const k = pick(rng, KEYWORDS);
          const form = pick(rng, [`[${k}]`, `"${k}"`, k, `[${k}`, `${k}]`, `"${k}`, `[${k}"`]);
          return [id, ri(rng, 10, 14), form];
        }),
      };
    },
    solution: [
      "SELECT keyword_id,",
      "       CASE WHEN keyword_text LIKE '[%]' OR keyword_text LIKE '\"%\"'",
      "            THEN SUBSTRING(keyword_text, 2, CHAR_LENGTH(keyword_text) - 2)",
      "            ELSE keyword_text END AS keyword,",
      "       CASE WHEN keyword_text LIKE '[%]' THEN 'exact'",
      "            WHEN keyword_text LIKE '\"%\"' THEN 'phrase'",
      "            ELSE 'broad' END AS match_type",
      "FROM AdKeyword",
      "ORDER BY keyword_id",
    ].join("\n"),
    alternatives: [
      "SELECT keyword_id, IF(t = 'broad', keyword_text, SUBSTRING(keyword_text, 2, CHAR_LENGTH(keyword_text) - 2)) AS keyword, t AS match_type FROM (SELECT keyword_id, keyword_text, CASE CONCAT(LEFT(keyword_text, 1), RIGHT(keyword_text, 1)) WHEN '[]' THEN 'exact' WHEN '\"\"' THEN 'phrase' ELSE 'broad' END AS t FROM AdKeyword) k ORDER BY keyword_id",
    ],
    ordered: true,
    hints: [
      "Look at the first and the last character of the text together.",
      "`LIKE '[%]'` matches text that starts with `[` and ends with `]`; brackets are ordinary characters in a MySQL LIKE.",
      "Stripping one character at each end is `SUBSTRING(text, 2, length - 2)`.",
    ],
    editorial: [
      "The match type is decided by the **first and last characters** together, so each test has to check both ends. `keyword_text LIKE '[%]'` does exactly that: a literal `[`, anything, then a literal `]` at the very end. (In MySQL's LIKE only `%` and `_` are special, so brackets match themselves.) The phrase test is the same pattern with double quotes. Anything that fails both — plain text, a lone opening bracket, mismatched `[ … \"` — is broad.",
      "",
      "For the cleaned keyword, a matched pair is removed with `SUBSTRING(keyword_text, 2, CHAR_LENGTH(keyword_text) - 2)`: start after the first character and take everything but the last. Broad keywords are returned untouched, which is why the half-closed `[cricket bat` keeps its bracket.",
      "",
      "The alternative glues `LEFT(…, 1)` and `RIGHT(…, 1)` into a two-character string and switches on it with a simple CASE, computing the type once in a derived table and reusing it. Both read each row once.",
    ].join("\n"),
  },

  {
    slug: "google-chromebooks-not-synced-in-90-days",
    title: "Google: Chromebooks Not Synced in 90 Days",
    difficulty: "EASY",
    topics: ["Dates", "Basics"],
    description: [
      "A Google for Education admin audits school Chromebooks on **2025-06-30**: a device that has not synced with the admin console for a long time is probably lost or broken.",
      "",
      "Return `device_id`, `school` and `days_since_sync` — the number of days from the date part of `last_sync` to 2025-06-30 — for every device with `days_since_sync` **of 90 or more**, plus every device that **never synced** (`last_sync` is NULL; its `days_since_sync` is NULL). Order by `device_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Chromebook",
        columns: [
          { name: "device_id", type: "int" },
          { name: "school", type: "varchar" },
          { name: "serial_no", type: "varchar" },
          { name: "last_sync", type: "datetime" },
        ],
        primaryKey: ["device_id"],
        note: "One enrolled device. `last_sync` is its latest check-in (never after 2025-06-30), or NULL if it has never checked in.",
      },
    ],
    examples: [
      {
        Chromebook: [
          [1, "DPS Pune", "CB-7Q1", "2025-06-29 14:05:00"],
          [2, "DPS Pune", "CB-7Q2", "2025-04-01 23:59:00"],
          [3, "Navodaya Jaipur", "CB-8A4", "2025-04-02 00:10:00"],
          [4, "Navodaya Jaipur", "CB-8A5", null],
          [5, "Ryan Hyderabad", "CB-9Z0", "2024-12-15 08:30:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      return {
        Chromebook: seq(1, n).map((id) => [
          id,
          pick(rng, SCHOOLS),
          `CB-${ri(rng, 100, 999)}`,
          chance(rng, 0.15) ? null : atTime(rng, chance(rng, 0.3) ? pick(rng, ["2025-04-01", "2025-04-02", "2025-03-31"]) : dateBetween(rng, "2024-12-01", "2025-06-30")),
        ]),
      };
    },
    solution: [
      "SELECT device_id, school, DATEDIFF('2025-06-30', last_sync) AS days_since_sync",
      "FROM Chromebook",
      "WHERE last_sync IS NULL",
      "   OR DATEDIFF('2025-06-30', last_sync) >= 90",
      "ORDER BY device_id",
    ].join("\n"),
    alternatives: [
      "SELECT device_id, school, DATEDIFF('2025-06-30', last_sync) AS days_since_sync FROM Chromebook WHERE COALESCE(last_sync, '2000-01-01') < '2025-04-02' ORDER BY device_id",
    ],
    ordered: true,
    hints: [
      "`DATEDIFF(later, earlier)` counts days and ignores the time of day.",
      "A NULL makes `DATEDIFF(...) >= 90` unknown, so the never-synced devices need their own condition.",
    ],
    editorial: [
      "`DATEDIFF('2025-06-30', last_sync)` gives the whole days between the two dates and ignores the time part, so a device that synced at 23:59 on 2025-04-01 is exactly 90 days stale and qualifies, while one that synced just after midnight on 2025-04-02 is 89 days and does not. The boundary is inclusive (`>= 90`).",
      "",
      "Never-synced devices have `last_sync` NULL. Any comparison with NULL is unknown, which `WHERE` treats as false, so `DATEDIFF(...) >= 90` alone would silently drop exactly the devices most likely to be missing. An explicit `last_sync IS NULL OR …` brings them back, and selecting the same DATEDIFF expression returns NULL for them, as asked.",
      "",
      "The alternative turns the day count into a date cut-off: 90 days or more before 2025-06-30 means a sync before 2025-04-02, and `COALESCE` maps a missing sync to a far-past date so the same test catches it. Either way it is one scan.",
    ].join("\n"),
  },
  // ──────────────────────────── MEDIUM ────────────────────────────
  {
    slug: "google-click-through-rate-at-every-organic-position",
    title: "Google: Click-Through Rate at Every Organic Position",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Subqueries"],
    description: [
      "A Search ranking analyst plots click-through rate against the ten organic positions of the first results page. The chart needs all ten positions, even ones that got no impressions in the sample.",
      "",
      "Return one row for **each position 1 to 10**: `position`, `impressions` (rows at that position), `clicks` (those with `clicked = 1`) and `ctr_pct` = 100 × clicks ÷ impressions **rounded to 2 decimals**. A position with no impressions shows `0` impressions, `0` clicks and a NULL `ctr_pct`. Impressions on later pages (position above 10) are ignored. Order by `position`.",
    ].join("\n"),
    tables: [
      {
        name: "SearchImpression",
        columns: [
          { name: "impression_id", type: "int" },
          { name: "query_id", type: "int" },
          { name: "position", type: "int" },
          { name: "clicked", type: "bool" },
        ],
        primaryKey: ["impression_id"],
        note: "One organic result shown for one query. `position` is 1-based (11 and above are on page two or later); `clicked` is 1 if the user clicked it.",
      },
    ],
    examples: [
      {
        SearchImpression: [
          [1, 501, 1, 1],
          [2, 501, 2, 0],
          [3, 501, 3, 1],
          [4, 502, 1, 1],
          [5, 502, 2, 1],
          [6, 502, 3, 0],
          [7, 503, 1, 0],
          [8, 503, 7, 0],
          [9, 504, 12, 1],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 4, 30);
      return {
        SearchImpression: seq(1, n).map((id) => {
          const pos = chance(rng, 0.15) ? ri(rng, 11, 20) : pick(rng, [1, 1, 1, 2, 2, 3, 3, 4, 5, 6, 7, 8, 9, 10]);
          return [id, ri(rng, 500, 520), pos, chance(rng, Math.max(0.05, 0.55 - 0.05 * pos)) ? 1 : 0];
        }),
      };
    },
    solution: [
      "WITH RECURSIVE slots (position) AS (",
      "  SELECT 1",
      "  UNION ALL",
      "  SELECT position + 1 FROM slots WHERE position < 10",
      ")",
      "SELECT s.position,",
      "       COUNT(i.impression_id) AS impressions,",
      "       COALESCE(SUM(i.clicked), 0) AS clicks,",
      "       ROUND(100 * SUM(i.clicked) / COUNT(i.impression_id), 2) AS ctr_pct",
      "FROM slots s",
      "LEFT JOIN SearchImpression i ON i.position = s.position",
      "GROUP BY s.position",
      "ORDER BY s.position",
    ].join("\n"),
    alternatives: [
      "SELECT s.position, COUNT(i.impression_id) AS impressions, SUM(CASE WHEN i.clicked = 1 THEN 1 ELSE 0 END) AS clicks, ROUND(100 * SUM(CASE WHEN i.clicked = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(i.impression_id), 0), 2) AS ctr_pct FROM (SELECT 1 AS position UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) s LEFT JOIN SearchImpression i ON i.position = s.position GROUP BY s.position ORDER BY s.position",
      "WITH RECURSIVE slots (position) AS (SELECT 1 UNION ALL SELECT position + 1 FROM slots WHERE position < 10), agg AS (SELECT position, COUNT(*) AS n, SUM(clicked) AS c FROM SearchImpression WHERE position <= 10 GROUP BY position) SELECT s.position, COALESCE(a.n, 0) AS impressions, COALESCE(a.c, 0) AS clicks, ROUND(100 * a.c / a.n, 2) AS ctr_pct FROM slots s LEFT JOIN agg a ON a.position = s.position ORDER BY s.position",
    ],
    ordered: true,
    hints: [
      "Positions that never appear in the table cannot come out of a GROUP BY on it — you need a list of 1 to 10 from somewhere else.",
      "A recursive CTE (or ten SELECTs glued with UNION ALL) can produce the numbers 1 to 10.",
      "LEFT JOIN the impressions to that list; count a column of the impression, not `*`, so an empty position counts 0.",
    ],
    editorial: [
      "Grouping `SearchImpression` by position can only produce positions that occur in it, but the chart needs all ten. The fix is a **driving table** of the positions themselves: a recursive CTE starts at 1 and adds one until 10. Every position then exists as a row, and the impressions are LEFT JOINed onto it. Impressions at 11 or beyond have no partner in the list and simply never join, which is how page-two results are ignored.",
      "",
      "After the join, an empty position is one row of NULL impression columns. `COUNT(i.impression_id)` skips the NULL and gives 0 — `COUNT(*)` would wrongly give 1. `SUM(i.clicked)` is NULL there, so `COALESCE` turns the clicks into 0, and the CTR expression divides NULL by 0, which is NULL in MySQL, as the statement asks.",
      "",
      "The ten numbers can also be written as a UNION ALL derived table, and the aggregation can be done first and joined to the list afterwards. All approaches read the impressions once.",
    ].join("\n"),
  },

  {
    slug: "google-drive-files-shared-outside-the-owners-domain",
    title: "Google: Drive Files Shared Outside the Owner's Domain",
    difficulty: "MEDIUM",
    topics: ["Strings", "Joins", "Aggregation"],
    description: [
      "A Google Workspace security admin reviews data leaving each company: a Drive file is **shared externally** when at least one address it is shared with has a different email domain (the text after `@`) from its owner's.",
      "",
      "For every owner domain with at least one externally shared file, return `owner_domain`, `external_files` (its distinct files shared externally) and `external_people` (the distinct outside addresses that can open any of those files). Domains must match **exactly** — `mail.zentrix.io` is not `zentrix.io`. Order by `external_files` descending, then `owner_domain` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "DriveFile",
        columns: [
          { name: "file_id", type: "int" },
          { name: "owner_email", type: "varchar" },
          { name: "title", type: "varchar" },
        ],
        primaryKey: ["file_id"],
        note: "One Drive file and the account that owns it. Every address in the data is lower case with exactly one `@`.",
      },
      {
        name: "FileShare",
        columns: [
          { name: "share_id", type: "int" },
          { name: "file_id", type: "int" },
          { name: "shared_with", type: "varchar" },
          { name: "role", type: "enum", values: ["viewer", "commenter", "editor"] },
        ],
        primaryKey: ["share_id"],
        note: "One grant of access to one address; a file is shared with an address at most once.",
      },
    ],
    examples: [
      {
        DriveFile: [
          [1, "asha@zentrix.io", "Q3 roadmap"],
          [2, "ravi@zentrix.io", "Payroll July"],
          [3, "meera@quillpad.in", "Launch plan"],
          [4, "kabir@quillpad.in", "Team offsite"],
          [5, "zara@ledgerly.com", "Audit notes"],
        ],
        FileShare: [
          [1, 1, "ravi@zentrix.io", "editor"],
          [2, 1, "partner@agency.com", "viewer"],
          [3, 2, "ca@taxfirm.in", "commenter"],
          [4, 2, "partner@agency.com", "viewer"],
          [5, 3, "dev@mail.quillpad.in", "editor"],
          [6, 4, "meera@quillpad.in", "editor"],
          [7, 5, "auditor@kpmg.example", "viewer"],
        ],
      },
    ],
    gen: (rng) => {
      const domains = ["zentrix.io", "quillpad.in", "ledgerly.com"];
      const outside = ["partner@agency.com", "ca@taxfirm.in", "dev@mail.zentrix.io", "intern@gmail.com", "auditor@kpmg.example"];
      const nf = ri(rng, 1, 8);
      const files: Cell[][] = seq(1, nf).map((id) => [id, `${pick(rng, ["asha", "ravi", "meera", "kabir"])}@${pick(rng, domains)}`, `Doc ${id}`]);
      const shares: Cell[][] = [];
      for (const f of files) {
        const own = String(f[1]).split("@")[1]!;
        const pool = [`ravi@${own}`, `neha@${own}`, `asha@${own}`, ...outside, `team@${pick(rng, domains)}`];
        for (const who of sample(rng, [...new Set(pool)], ri(rng, 0, 3))) shares.push([0, f[0]!, who, pick(rng, ["viewer", "commenter", "editor"])]);
      }
      shuffle(rng, shares).forEach((s, i) => (s[0] = i + 1));
      return { DriveFile: files, FileShare: shares };
    },
    solution: [
      "SELECT SUBSTRING_INDEX(f.owner_email, '@', -1) AS owner_domain,",
      "       COUNT(DISTINCT f.file_id) AS external_files,",
      "       COUNT(DISTINCT s.shared_with) AS external_people",
      "FROM DriveFile f",
      "JOIN FileShare s ON s.file_id = f.file_id",
      "WHERE SUBSTRING_INDEX(s.shared_with, '@', -1) <> SUBSTRING_INDEX(f.owner_email, '@', -1)",
      "GROUP BY owner_domain",
      "ORDER BY external_files DESC, owner_domain",
    ].join("\n"),
    alternatives: [
      "SELECT owner_domain, COUNT(DISTINCT file_id) AS external_files, COUNT(DISTINCT shared_with) AS external_people FROM (SELECT f.file_id, RIGHT(f.owner_email, CHAR_LENGTH(f.owner_email) - LOCATE('@', f.owner_email)) AS owner_domain, s.shared_with FROM DriveFile f JOIN FileShare s ON s.file_id = f.file_id) x WHERE shared_with NOT LIKE CONCAT('%@', owner_domain) GROUP BY owner_domain ORDER BY external_files DESC, owner_domain",
    ],
    ordered: true,
    hints: [
      "`SUBSTRING_INDEX(email, '@', -1)` returns everything after the `@`.",
      "Join each file to its shares and keep the shares whose domain differs from the owner's.",
      "A file shared with several outsiders, or an outsider with access to several files, must be counted once — COUNT(DISTINCT …).",
    ],
    editorial: [
      "Both sides of the comparison are derived from strings: the owner's domain and the recipient's domain are the text after the `@`, which `SUBSTRING_INDEX(email, '@', -1)` returns (a negative count takes the pieces from the right). Joining files to their shares and keeping the rows where the two domains differ leaves exactly the external grants. Comparing whole domains for equality is what makes `dev@mail.quillpad.in` external to `quillpad.in`; a test like `LIKE '%quillpad.in'` would wrongly treat the subdomain as internal.",
      "",
      "Grouped by the owner's domain, those rows give the two figures — but both need `COUNT(DISTINCT …)`: a file with two outside recipients appears twice, and an agency address with access to two files appears twice. Files shared only inside the company have no external rows and do not count; a domain with none drops out.",
      "",
      "The alternative cuts the domain with `RIGHT`/`LOCATE` and tests external with `NOT LIKE CONCAT('%@', owner_domain)` — the `@` in the pattern is what keeps subdomains external. One join and one grouped pass.",
    ].join("\n"),
  },

  {
    slug: "google-local-guides-whose-ratings-turned-harsher",
    title: "Google: Local Guides Whose Ratings Turned Harsher",
    difficulty: "MEDIUM",
    topics: ["Window Functions"],
    description: [
      "The Maps Local Guides team studies reviewers whose standards drift, comparing each guide's very first star rating with their most recent one.",
      "",
      "For every guide with **at least 2** reviews, find the first review (earliest `reviewed_on`; on the same day the lower `review_id`) and the latest review (latest `reviewed_on`; on the same day the higher `review_id`). Return `guide_name`, `first_rating`, `latest_rating` and `reviews` (their review count) for the guides whose latest rating is **strictly lower** than their first. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "LocalGuideReview",
        columns: [
          { name: "review_id", type: "int" },
          { name: "guide_name", type: "varchar" },
          { name: "place_id", type: "int" },
          { name: "rating", type: "int" },
          { name: "reviewed_on", type: "date" },
        ],
        primaryKey: ["review_id"],
        note: "One review by one guide; `guide_name` identifies the guide. `rating` is 1–5 stars.",
      },
    ],
    examples: [
      {
        LocalGuideReview: [
          [1, "Aarav", 1, 5, "2025-01-05"],
          [2, "Aarav", 2, 4, "2025-02-10"],
          [3, "Aarav", 3, 3, "2025-03-01"],
          [4, "Diya", 1, 2, "2025-01-07"],
          [5, "Diya", 4, 5, "2025-03-03"],
          [8, "Kabir", 2, 4, "2025-02-02"],
          [6, "Kabir", 5, 5, "2025-02-02"],
          [9, "Neha", 3, 1, "2025-01-01"],
          [10, "Meera", 4, 4, "2025-01-10"],
          [11, "Meera", 5, 4, "2025-04-10"],
        ],
      },
    ],
    gen: (rng) => {
      const guides = names(rng, ri(rng, 1, 6));
      const days = ["2025-01-05", "2025-02-02", "2025-02-10", "2025-03-01", "2025-04-10"];
      const rows: Cell[][] = [];
      for (const g of guides) for (let j = ri(rng, 1, 5); j > 0; j--) rows.push([0, g, ri(rng, 1, 9), ri(rng, 1, 5), pick(rng, days)]);
      shuffle(rng, rows).forEach((r, i) => (r[0] = i + 1));
      return { LocalGuideReview: rows };
    },
    solution: [
      "WITH r AS (",
      "  SELECT guide_name, rating,",
      "         COUNT(*) OVER (PARTITION BY guide_name) AS n,",
      "         ROW_NUMBER() OVER (PARTITION BY guide_name ORDER BY reviewed_on, review_id) AS from_first,",
      "         ROW_NUMBER() OVER (PARTITION BY guide_name ORDER BY reviewed_on DESC, review_id DESC) AS from_last",
      "  FROM LocalGuideReview",
      ")",
      "SELECT f.guide_name, f.rating AS first_rating, l.rating AS latest_rating, f.n AS reviews",
      "FROM r f",
      "JOIN r l ON l.guide_name = f.guide_name AND l.from_last = 1",
      "WHERE f.from_first = 1",
      "  AND f.n >= 2",
      "  AND l.rating < f.rating",
    ].join("\n"),
    alternatives: [
      "SELECT guide_name, first_rating, latest_rating, reviews FROM (SELECT DISTINCT guide_name, FIRST_VALUE(rating) OVER (PARTITION BY guide_name ORDER BY reviewed_on, review_id ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS first_rating, LAST_VALUE(rating) OVER (PARTITION BY guide_name ORDER BY reviewed_on, review_id ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS latest_rating, COUNT(*) OVER (PARTITION BY guide_name) AS reviews FROM LocalGuideReview) x WHERE reviews >= 2 AND latest_rating < first_rating",
      "SELECT g.guide_name, f.rating AS first_rating, l.rating AS latest_rating, g.reviews FROM (SELECT guide_name, COUNT(*) AS reviews FROM LocalGuideReview GROUP BY guide_name HAVING COUNT(*) >= 2) g JOIN LocalGuideReview f ON f.guide_name = g.guide_name AND NOT EXISTS (SELECT 1 FROM LocalGuideReview e WHERE e.guide_name = f.guide_name AND (e.reviewed_on < f.reviewed_on OR (e.reviewed_on = f.reviewed_on AND e.review_id < f.review_id))) JOIN LocalGuideReview l ON l.guide_name = g.guide_name AND NOT EXISTS (SELECT 1 FROM LocalGuideReview e WHERE e.guide_name = l.guide_name AND (e.reviewed_on > l.reviewed_on OR (e.reviewed_on = l.reviewed_on AND e.review_id > l.review_id))) WHERE l.rating < f.rating",
    ],
    hints: [
      "Each guide needs two specific rows: their first review and their latest one.",
      "Number the reviews in both directions with ROW_NUMBER, each with its own tiebreak on `review_id`.",
      "A COUNT(*) window gives the review count without collapsing the rows.",
    ],
    editorial: [
      "The comparison is between two particular rows of each guide, so the reviews are numbered in **both directions**: `ROW_NUMBER()` by `reviewed_on, review_id` finds the first review as number 1, and by `reviewed_on DESC, review_id DESC` finds the latest as number 1. The statement's tiebreaks — lower id first, higher id last — are exactly those two orderings, so a guide with two reviews on the same day still has a single first and a single latest.",
      "",
      "A `COUNT(*) OVER (PARTITION BY guide_name)` puts the guide's review count on every row without grouping. Joining the first-row copy to the latest-row copy gives one row per guide, filtered to at least two reviews and to a strictly lower latest rating. A guide with one review would compare a review with itself, which is why the count condition is needed; equal ratings are not harsher.",
      "",
      "`FIRST_VALUE`/`LAST_VALUE` with a full frame read the same two ratings (the frame must be widened, or LAST_VALUE stops at the current row). A window-free version picks each row with NOT EXISTS. The window version sorts each guide's reviews twice.",
    ].join("\n"),
  },

  {
    slug: "google-places-per-top-level-maps-category",
    title: "Google: Places per Top-Level Maps Category",
    difficulty: "MEDIUM",
    topics: ["Strings", "Aggregation"],
    description: [
      "Maps stores each place's category as a path such as `Food > Restaurant > South Indian`, levels joined by ` > ` (space, greater-than, space). A taxonomy analyst wants a summary by the first level.",
      "",
      "Ignoring places whose `category_path` is NULL, return `top_category` (the text before the first ` > `, or the whole path if it has one level), `places` (how many places fall under it) and `deepest_level` (the largest number of levels among those places' paths). Order by `places` descending, then `top_category` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "MapsPlace",
        columns: [
          { name: "place_id", type: "int" },
          { name: "place_name", type: "varchar" },
          { name: "category_path", type: "varchar" },
        ],
        primaryKey: ["place_id"],
        note: "Category names never contain `>`; a path has no leading or trailing spaces. NULL means the place is not categorised yet.",
      },
    ],
    examples: [
      {
        MapsPlace: [
          [1, "Vidyarthi Bhavan", "Food > Restaurant > South Indian"],
          [2, "Toit", "Food > Bar > Brewpub"],
          [3, "Indian Coffee House", "Food > Cafe"],
          [4, "Lalbagh", "Outdoors > Garden"],
          [5, "Cubbon Park", "Outdoors > Park"],
          [6, "Phoenix Mall", "Shopping"],
          [7, "Unnamed pin", null],
          [8, "Chinnaswamy Stadium", "Sports > Stadium > Cricket > Pavilion"],
        ],
      },
    ],
    gen: (rng) => {
      const cats = [
        "Food > Restaurant > South Indian", "Food > Restaurant > North Indian", "Food > Cafe", "Food", "Shopping > Mall", "Shopping",
        "Outdoors > Park", "Outdoors > Garden > Rose Garden", "Sports > Stadium > Cricket", "Health > Hospital > Children", "Health > Pharmacy",
      ];
      const n = ri(rng, 1, 16);
      return { MapsPlace: seq(1, n).map((id) => [id, `Place ${id}`, chance(rng, 0.1) ? null : pick(rng, cats)]) };
    },
    solution: [
      "SELECT SUBSTRING_INDEX(category_path, ' > ', 1) AS top_category,",
      "       COUNT(*) AS places,",
      "       MAX((CHAR_LENGTH(category_path) - CHAR_LENGTH(REPLACE(category_path, ' > ', ''))) DIV 3 + 1) AS deepest_level",
      "FROM MapsPlace",
      "WHERE category_path IS NOT NULL",
      "GROUP BY top_category",
      "ORDER BY places DESC, top_category",
    ].join("\n"),
    alternatives: [
      "SELECT top_category, COUNT(*) AS places, MAX(levels) AS deepest_level FROM (SELECT CASE WHEN LOCATE(' > ', category_path) = 0 THEN category_path ELSE LEFT(category_path, LOCATE(' > ', category_path) - 1) END AS top_category, LENGTH(category_path) - LENGTH(REPLACE(category_path, '>', '')) + 1 AS levels FROM MapsPlace WHERE category_path IS NOT NULL) p GROUP BY top_category ORDER BY places DESC, top_category",
    ],
    ordered: true,
    hints: [
      "`SUBSTRING_INDEX(path, ' > ', 1)` returns everything before the first separator — or the whole string when there is none.",
      "The number of levels is one more than the number of separators.",
      "Count separators by how much shorter the string gets when you remove them.",
    ],
    editorial: [
      "Two string facts are needed per place. The top level is the text before the first separator: `SUBSTRING_INDEX(category_path, ' > ', 1)` returns exactly that, and returns the whole path when it has no separator, so one-level paths like `Shopping` need no special case.",
      "",
      "The depth is one more than the number of separators. A classic way to count occurrences of a substring is to remove them with `REPLACE` and see how many characters disappeared: each ` > ` is three characters, so the difference in length `DIV 3` is the separator count. (The alternative counts the single `>` character instead, which is the same number because category names never contain one.)",
      "",
      "With those two expressions the rest is a grouped aggregate: group by the top level, count places, take the `MAX` depth. NULL paths are filtered out first so they do not form a NULL group. The order is fixed by the count and then the category name. One pass over the table.",
    ].join("\n"),
  },

  {
    slug: "google-spam-filter-precision-and-recall-per-model",
    title: "Google: Gmail Spam Filter Precision and Recall per Model",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Aggregation"],
    description: [
      "Before promoting a new Gmail spam model, the anti-abuse team compares model versions on a sample of messages that human raters labelled.",
      "",
      "Using only messages with a `rater_label`, return for each `model_version` that has at least one such message: `model_version`, `labeled` (labelled messages), `precision_pct` = 100 × (predicted spam **and** labelled spam) ÷ (predicted spam) and `recall_pct` = 100 × (predicted spam **and** labelled spam) ÷ (labelled spam), each **rounded to 2 decimals**, and NULL when its denominator is 0. Order by `model_version`.",
    ].join("\n"),
    tables: [
      {
        name: "LabeledMessage",
        columns: [
          { name: "message_id", type: "int" },
          { name: "model_version", type: "varchar" },
          { name: "predicted_spam", type: "bool" },
          { name: "rater_label", type: "enum", values: ["spam", "ham"] },
        ],
        primaryKey: ["message_id"],
        note: "One sampled message scored by one model version. `predicted_spam` is the model's call; `rater_label` is the human verdict, or NULL if not yet rated.",
      },
    ],
    examples: [
      {
        LabeledMessage: [
          [1, "v41", 1, "spam"],
          [2, "v41", 1, "ham"],
          [3, "v41", 0, "spam"],
          [4, "v41", 1, "spam"],
          [5, "v41", 0, "ham"],
          [6, "v41", 1, null],
          [7, "v42", 0, "ham"],
          [8, "v42", 0, "ham"],
          [9, "v42", 0, "spam"],
          [10, "v43", 1, null],
        ],
      },
    ],
    gen: (rng) => {
      const versions = sample(rng, ["v41", "v42", "v43", "v44"], ri(rng, 1, 3));
      const n = ri(rng, 1, 28);
      return {
        LabeledMessage: seq(1, n).map((id) => {
          const p = chance(rng, 0.5) ? 1 : 0;
          const label = chance(rng, 0.2) ? null : p ? (chance(rng, 0.75) ? "spam" : "ham") : chance(rng, 0.2) ? "spam" : "ham";
          return [id, pick(rng, versions), p, label];
        }),
      };
    },
    solution: [
      "SELECT model_version,",
      "       COUNT(*) AS labeled,",
      "       ROUND(100 * SUM(CASE WHEN predicted_spam = 1 AND rater_label = 'spam' THEN 1 ELSE 0 END)",
      "             / NULLIF(SUM(CASE WHEN predicted_spam = 1 THEN 1 ELSE 0 END), 0), 2) AS precision_pct,",
      "       ROUND(100 * SUM(CASE WHEN predicted_spam = 1 AND rater_label = 'spam' THEN 1 ELSE 0 END)",
      "             / NULLIF(SUM(CASE WHEN rater_label = 'spam' THEN 1 ELSE 0 END), 0), 2) AS recall_pct",
      "FROM LabeledMessage",
      "WHERE rater_label IS NOT NULL",
      "GROUP BY model_version",
      "ORDER BY model_version",
    ].join("\n"),
    alternatives: [
      "WITH c AS (SELECT model_version, COUNT(*) AS labeled, SUM(IF(predicted_spam = 1 AND rater_label = 'spam', 1, 0)) AS tp, SUM(IF(predicted_spam = 1 AND rater_label = 'ham', 1, 0)) AS fp, SUM(IF(predicted_spam = 0 AND rater_label = 'spam', 1, 0)) AS fn FROM LabeledMessage WHERE rater_label IS NOT NULL GROUP BY model_version) SELECT model_version, labeled, CASE WHEN tp + fp = 0 THEN NULL ELSE ROUND(100 * tp / (tp + fp), 2) END AS precision_pct, CASE WHEN tp + fn = 0 THEN NULL ELSE ROUND(100 * tp / (tp + fn), 2) END AS recall_pct FROM c ORDER BY model_version",
    ],
    ordered: true,
    hints: [
      "Leave out the unrated messages before computing anything.",
      "Count true positives, predicted positives and actual positives with conditional sums in one GROUP BY.",
      "`NULLIF(x, 0)` turns a zero denominator into NULL, and dividing by NULL gives NULL.",
    ],
    editorial: [
      "Precision and recall are both ratios of counts from the same group of messages, so the query is one `GROUP BY model_version` over the rated messages, with **conditional sums** for the pieces: true positives (predicted spam and labelled spam), all predicted spam (true + false positives) and all labelled spam (true positives + false negatives). Unrated messages are removed in `WHERE` first — they would otherwise inflate the predicted-spam count with calls nobody checked.",
      "",
      "A version can have no predicted spam (a cautious model) or no labelled spam in its sample, and then a ratio is undefined. `NULLIF(denominator, 0)` makes the division return NULL instead of failing, and `ROUND` of NULL stays NULL. A version whose messages are all unrated has no rows after the filter and does not appear.",
      "",
      "The alternative computes TP, FP and FN in a CTE and spells the zero cases with CASE, which reads closer to the textbook definitions. Both are one scan.",
    ].join("\n"),
  },

  {
    slug: "google-play-installs-removed-within-a-week",
    title: "Google: Play Installs Removed Within a Week",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates", "Joins"],
    description: [
      "A Play Store growth analyst tracks *quick uninstalls*: an install that the same device removes within a week usually means the app disappointed on first use.",
      "",
      "An install is a **quick uninstall** when the next event for the **same device and app** is an `uninstall` at most **7 days (604,800 seconds, inclusive)** after it. For every app with at least one install, return `app_name`, `installs` and `quick_uninstalls`. Order by `quick_uninstalls` descending, then `app_name` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "PlayApp",
        columns: [
          { name: "app_id", type: "int" },
          { name: "app_name", type: "varchar" },
        ],
        primaryKey: ["app_id"],
        note: "One app; `app_name` is unique.",
      },
      {
        name: "PlayEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "device_id", type: "int" },
          { name: "app_id", type: "int" },
          { name: "event_type", type: "enum", values: ["install", "uninstall"] },
          { name: "event_at", type: "datetime" },
        ],
        primaryKey: ["event_id"],
        note: "For one device and app, events alternate install, uninstall, install, … with distinct times; the sequence may end on an install.",
      },
    ],
    examples: [
      {
        PlayApp: [
          [1, "Metro Buddy"],
          [2, "Raga Tuner"],
          [3, "Exam Countdown"],
        ],
        PlayEvent: [
          [1, 1, 1, "install", "2025-05-01 10:00:00"],
          [7, 1, 1, "uninstall", "2025-05-08 10:00:00"],
          [9, 1, 1, "install", "2025-05-20 09:00:00"],
          [2, 2, 1, "install", "2025-05-02 12:00:00"],
          [8, 2, 1, "uninstall", "2025-05-09 12:00:01"],
          [3, 1, 2, "install", "2025-05-03 08:00:00"],
          [4, 1, 2, "uninstall", "2025-05-03 08:05:00"],
          [5, 3, 2, "install", "2025-05-05 21:30:00"],
          [6, 3, 2, "uninstall", "2025-05-06 07:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 5);
      const apps: Cell[][] = sample(rng, APP_NAMES, n).map((name, i) => [i + 1, name]);
      const events: Cell[][] = [];
      const devices = ri(rng, 1, 6);
      for (const d of seq(1, devices)) {
        for (const a of seq(1, n)) {
          if (!chance(rng, 0.45)) continue;
          let t = at(dateBetween(rng, "2025-05-01", "2025-05-20"), ri(rng, 0, 23), ri(rng, 0, 59), ri(rng, 0, 59));
          const k = ri(rng, 1, 4);
          for (let j = 0; j < k; j++) {
            events.push([0, d, a, j % 2 === 0 ? "install" : "uninstall", t]);
            t = addSecs(t, pick(rng, [604800, 604801, 604799, ri(rng, 60, 86400), ri(rng, 86400, 20 * 86400), ri(rng, 300, 3000)]));
          }
        }
      }
      shuffle(rng, events).forEach((e, i) => (e[0] = i + 1));
      return { PlayApp: apps, PlayEvent: events };
    },
    solution: [
      "WITH e AS (",
      "  SELECT app_id, event_type, event_at,",
      "         LEAD(event_type) OVER (PARTITION BY device_id, app_id ORDER BY event_at) AS next_type,",
      "         LEAD(event_at) OVER (PARTITION BY device_id, app_id ORDER BY event_at) AS next_at",
      "  FROM PlayEvent",
      ")",
      "SELECT a.app_name,",
      "       COUNT(*) AS installs,",
      "       SUM(CASE WHEN e.next_type = 'uninstall'",
      "                 AND TIMESTAMPDIFF(SECOND, e.event_at, e.next_at) <= 604800",
      "                THEN 1 ELSE 0 END) AS quick_uninstalls",
      "FROM e",
      "JOIN PlayApp a ON a.app_id = e.app_id",
      "WHERE e.event_type = 'install'",
      "GROUP BY a.app_id, a.app_name",
      "ORDER BY quick_uninstalls DESC, a.app_name",
    ].join("\n"),
    alternatives: [
      "SELECT a.app_name, COUNT(*) AS installs, SUM(CASE WHEN EXISTS (SELECT 1 FROM PlayEvent u WHERE u.device_id = i.device_id AND u.app_id = i.app_id AND u.event_type = 'uninstall' AND u.event_at > i.event_at AND u.event_at <= DATE_ADD(i.event_at, INTERVAL 7 DAY) AND NOT EXISTS (SELECT 1 FROM PlayEvent x WHERE x.device_id = i.device_id AND x.app_id = i.app_id AND x.event_at > i.event_at AND x.event_at < u.event_at)) THEN 1 ELSE 0 END) AS quick_uninstalls FROM PlayEvent i JOIN PlayApp a ON a.app_id = i.app_id WHERE i.event_type = 'install' GROUP BY a.app_id, a.app_name ORDER BY quick_uninstalls DESC, a.app_name",
    ],
    ordered: true,
    hints: [
      "For each install you need the very next event of the same device and app.",
      "`LEAD(...) OVER (PARTITION BY device_id, app_id ORDER BY event_at)` reads the following row's values.",
      "Measure the gap in seconds so that exactly seven days counts and one second more does not.",
    ],
    editorial: [
      "The question is about pairs of consecutive events of one device–app combination, which is what `LEAD` gives: partitioned by `device_id, app_id` and ordered by time, it puts the next event's type and time on each row. An install whose next event is an uninstall within the window is a quick uninstall. An install that is the last event (the app is still on the phone) has NULL next values and is simply not quick.",
      "",
      "The window is inclusive at 604,800 seconds. `TIMESTAMPDIFF(SECOND, …)` measures the exact gap, so an uninstall at the same clock time seven days later counts and one a second later does not — `DATEDIFF` would compare only dates and get that boundary wrong.",
      "",
      "After filtering to install rows, a grouped count gives installs, and a conditional sum the quick ones; apps without installs never appear. The alternative finds, for each install, an uninstall within `DATE_ADD(…, INTERVAL 7 DAY)` with no event in between — correct but quadratic per device, where the window sorts each partition once.",
    ].join("\n"),
  },

  {
    slug: "google-searches-reformulated-within-a-minute",
    title: "Google: Searches Reformulated Within a Minute",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates"],
    description: [
      "A Search quality rater flags queries that users quickly rewrite: if someone searches, clicks nothing and searches again within a minute, the first results page probably missed.",
      "",
      "A search is **reformulated** when `clicked = 0` and the **same user's next search** comes at most **60 seconds** later (inclusive). For each `query_text` with at least one reformulated search, return `query_text`, `searches` (all its searches), `reformulated` and `reformulation_pct` = 100 × reformulated ÷ searches, **rounded to 2 decimals**. Order by `reformulation_pct` descending, then `query_text` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "SearchEvent",
        columns: [
          { name: "search_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "query_text", type: "varchar" },
          { name: "searched_at", type: "datetime" },
          { name: "clicked", type: "bool" },
        ],
        primaryKey: ["search_id"],
        note: "One search. A user never searches twice in the same second. `clicked` is 1 if any result of that search was clicked.",
      },
    ],
    examples: [
      {
        SearchEvent: [
          [1, 1, "biryani near me", "2025-05-01 12:00:00", 0],
          [2, 1, "biryani delivery koramangala", "2025-05-01 12:00:40", 1],
          [3, 1, "weather pune", "2025-05-01 18:00:00", 0],
          [4, 2, "biryani near me", "2025-05-01 13:00:00", 0],
          [5, 2, "biryani near me open now", "2025-05-01 13:01:00", 0],
          [6, 2, "mutton biryani recipe", "2025-05-01 13:02:01", 0],
          [7, 3, "weather pune", "2025-05-02 07:00:00", 1],
          [8, 3, "weather mumbai", "2025-05-02 07:00:20", 0],
          [9, 4, "weather pune", "2025-05-02 08:00:00", 0],
          [10, 4, "weather pune today", "2025-05-02 08:00:30", 1],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const u of seq(1, ri(rng, 1, 5))) {
        let t = at(dateBetween(rng, "2025-05-01", "2025-05-03"), ri(rng, 6, 22), ri(rng, 0, 59), ri(rng, 0, 59));
        for (let j = ri(rng, 1, 6); j > 0; j--) {
          rows.push([0, u, pick(rng, QUERIES.slice(0, 6)), t, chance(rng, 0.4) ? 1 : 0]);
          t = addSecs(t, pick(rng, [5, 30, 60, 60, 61, 90, 600, 3600]));
        }
      }
      shuffle(rng, rows).forEach((r, i) => (r[0] = i + 1));
      return { SearchEvent: rows };
    },
    solution: [
      "WITH s AS (",
      "  SELECT query_text, clicked, searched_at,",
      "         LEAD(searched_at) OVER (PARTITION BY user_id ORDER BY searched_at) AS next_at",
      "  FROM SearchEvent",
      "), flagged AS (",
      "  SELECT query_text,",
      "         CASE WHEN clicked = 0 AND TIMESTAMPDIFF(SECOND, searched_at, next_at) <= 60 THEN 1 ELSE 0 END AS refo",
      "  FROM s",
      ")",
      "SELECT query_text,",
      "       COUNT(*) AS searches,",
      "       SUM(refo) AS reformulated,",
      "       ROUND(100 * SUM(refo) / COUNT(*), 2) AS reformulation_pct",
      "FROM flagged",
      "GROUP BY query_text",
      "HAVING SUM(refo) >= 1",
      "ORDER BY reformulation_pct DESC, query_text",
    ].join("\n"),
    alternatives: [
      "SELECT query_text, COUNT(*) AS searches, SUM(r) AS reformulated, ROUND(100 * SUM(r) / COUNT(*), 2) AS reformulation_pct FROM (SELECT e.query_text, IF(e.clicked = 0 AND EXISTS (SELECT 1 FROM SearchEvent n WHERE n.user_id = e.user_id AND n.searched_at > e.searched_at AND n.searched_at <= DATE_ADD(e.searched_at, INTERVAL 60 SECOND)), 1, 0) AS r FROM SearchEvent e) x GROUP BY query_text HAVING SUM(r) > 0 ORDER BY reformulation_pct DESC, query_text",
    ],
    ordered: true,
    hints: [
      "For each search you need the time of the same user's following search.",
      "LEAD over the user's searches in time order gives it; the last search has none.",
      "Flag each search 1 or 0, then group by the query text.",
    ],
    editorial: [
      "Whether a search was reformulated depends on the **next** search of the same user, so `LEAD(searched_at) OVER (PARTITION BY user_id ORDER BY searched_at)` puts that time on every row. A search is flagged when nothing was clicked and the gap, measured exactly with `TIMESTAMPDIFF(SECOND, …)`, is at most 60. The last search of a user has a NULL next time; the comparison is then unknown and the CASE falls to 0, so it is never a reformulation.",
      "",
      "Once each search carries a 1/0 flag, the report is a grouped aggregate per `query_text`: count all searches, sum the flags, and compute the percentage. `HAVING` keeps only queries that were reformulated at least once. The order is fully determined by the percentage and then the text.",
      "",
      "The alternative asks the same question with a correlated `EXISTS`: is there any later search by the user within 60 seconds? Because the earliest later search is the next one, \"some later search within a minute\" and \"the next search within a minute\" are the same condition. The window version sorts each user's searches once; the EXISTS one probes per row.",
    ].join("\n"),
  },

  {
    slug: "google-longest-heartbeat-gap-of-each-nest-device",
    title: "Google: Longest Heartbeat Gap of Each Nest Device",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates", "Joins"],
    description: [
      "Nest devices send a heartbeat to the cloud while they are online. A reliability engineer wants, per device, its worst outage: the longest silence between two consecutive heartbeats.",
      "",
      "For every device with **at least 2** heartbeats, return `device_id`, `room`, `longest_gap_minutes` (the largest gap in whole minutes between consecutive heartbeats) and `gap_started_at` (the heartbeat that came right before that gap; if several gaps are equally longest, the earliest one). Order by `longest_gap_minutes` descending, then `device_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "NestDevice",
        columns: [
          { name: "device_id", type: "int" },
          { name: "room", type: "varchar" },
          { name: "model", type: "varchar" },
        ],
        primaryKey: ["device_id"],
        note: "One installed device.",
      },
      {
        name: "Heartbeat",
        columns: [
          { name: "device_id", type: "int" },
          { name: "beat_at", type: "datetime" },
        ],
        primaryKey: ["device_id", "beat_at"],
        note: "One heartbeat received; times are on whole minutes. `device_id` always names a device.",
      },
    ],
    examples: [
      {
        NestDevice: [
          [1, "Living room", "Nest Cam"],
          [2, "Hallway", "Nest Thermostat"],
          [3, "Garage", "Nest Doorbell"],
        ],
        Heartbeat: [
          [1, "2025-06-01 08:00:00"],
          [1, "2025-06-01 08:15:00"],
          [1, "2025-06-01 09:45:00"],
          [1, "2025-06-01 11:15:00"],
          [2, "2025-06-01 08:00:00"],
          [2, "2025-06-01 08:05:00"],
          [2, "2025-06-01 12:05:00"],
          [3, "2025-06-01 09:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const nd = ri(rng, 1, 5);
      const devices: Cell[][] = seq(1, nd).map((id) => [id, pick(rng, ["Living room", "Hallway", "Garage", "Kitchen", "Nursery"]), pick(rng, ["Nest Cam", "Nest Thermostat", "Nest Doorbell", "Nest Hub"])]);
      const beats: Cell[][] = [];
      for (const d of seq(1, nd)) {
        let t = at("2025-06-01", ri(rng, 0, 10), ri(rng, 0, 59));
        const usual = ri(rng, 5, 180);
        for (let j = ri(rng, 0, 6); j > 0; j--) {
          beats.push([d, t]);
          t = addSecs(t, (chance(rng, 0.35) ? usual : ri(rng, 1, 240)) * 60);
        }
      }
      return { NestDevice: devices, Heartbeat: shuffle(rng, beats) };
    },
    solution: [
      "WITH nxt AS (",
      "  SELECT device_id, beat_at,",
      "         LEAD(beat_at) OVER (PARTITION BY device_id ORDER BY beat_at) AS next_at",
      "  FROM Heartbeat",
      "), gaps AS (",
      "  SELECT device_id, beat_at, TIMESTAMPDIFF(MINUTE, beat_at, next_at) AS gap",
      "  FROM nxt",
      "  WHERE next_at IS NOT NULL",
      "), ranked AS (",
      "  SELECT device_id, beat_at, gap,",
      "         ROW_NUMBER() OVER (PARTITION BY device_id ORDER BY gap DESC, beat_at) AS rn",
      "  FROM gaps",
      ")",
      "SELECT r.device_id, d.room, r.gap AS longest_gap_minutes, r.beat_at AS gap_started_at",
      "FROM ranked r",
      "JOIN NestDevice d ON d.device_id = r.device_id",
      "WHERE r.rn = 1",
      "ORDER BY longest_gap_minutes DESC, r.device_id",
    ].join("\n"),
    alternatives: [
      "WITH gaps AS (SELECT h.device_id, h.beat_at, TIMESTAMPDIFF(MINUTE, h.beat_at, (SELECT MIN(n.beat_at) FROM Heartbeat n WHERE n.device_id = h.device_id AND n.beat_at > h.beat_at)) AS gap FROM Heartbeat h) SELECT g.device_id, d.room, g.gap AS longest_gap_minutes, MIN(g.beat_at) AS gap_started_at FROM gaps g JOIN NestDevice d ON d.device_id = g.device_id WHERE g.gap = (SELECT MAX(g2.gap) FROM gaps g2 WHERE g2.device_id = g.device_id) GROUP BY g.device_id, d.room, g.gap ORDER BY longest_gap_minutes DESC, g.device_id",
    ],
    ordered: true,
    hints: [
      "A gap is the time from one heartbeat to the next heartbeat of the same device.",
      "Compute every gap with LEAD, then pick the largest per device.",
      "Rank the gaps per device by length descending and start time ascending to settle ties.",
    ],
    editorial: [
      "Each gap is defined by two consecutive heartbeats of one device, so `LEAD(beat_at) OVER (PARTITION BY device_id ORDER BY beat_at)` pairs every heartbeat with the next. The last heartbeat of a device has no successor and is dropped; a device with a single heartbeat therefore has no gaps at all and falls out, as the statement requires. `TIMESTAMPDIFF(MINUTE, …)` turns each pair into whole minutes (the computation is done in a separate step so the window and the date function are not nested).",
      "",
      "Picking the largest gap *and* the row it belongs to is a top-1-per-group problem: `ROW_NUMBER()` ordered by `gap DESC, beat_at` makes the longest gap number 1 and, among equal longest gaps, the earliest. Joining the device gives the room.",
      "",
      "The alternative finds each next heartbeat with a correlated `MIN`, keeps gaps equal to the device's maximum and takes the earliest start with `MIN(beat_at)`. The window approach sorts each device's heartbeats once.",
    ].join("\n"),
  },

  {
    slug: "google-cloud-cost-spikes-against-the-trailing-week",
    title: "Google: Cloud Cost Spikes Against the Trailing Week",
    difficulty: "MEDIUM",
    topics: ["Window Functions"],
    description: [
      "Google Cloud's billing alerts compare each day's spend with what a project normally spends. A FinOps engineer is prototyping the rule in SQL.",
      "",
      "For each project, compare every billed day with its **previous up to 7 billed days** (earlier rows of the same project, not calendar days). A day is a **spike** when it has **at least 3** such previous days and its `cost_usd` is **strictly more than twice** their average. Return `project_id`, `usage_date`, `cost_usd` and `trailing_avg` (that average **rounded to 2 decimals**) for every spike. Order by `project_id`, then `usage_date`.",
    ].join("\n"),
    tables: [
      {
        name: "ProjectDailyCost",
        columns: [
          { name: "project_id", type: "int" },
          { name: "usage_date", type: "date" },
          { name: "cost_usd", type: "int" },
        ],
        primaryKey: ["project_id", "usage_date"],
        note: "A project's total cost for one day; days without usage have no row.",
      },
    ],
    examples: [
      {
        ProjectDailyCost: [
          [1, "2025-03-01", 10],
          [1, "2025-03-02", 12],
          [1, "2025-03-03", 11],
          [1, "2025-03-04", 30],
          [1, "2025-03-05", 14],
          [1, "2025-03-07", 40],
          [2, "2025-03-01", 50],
          [2, "2025-03-02", 100],
          [2, "2025-03-03", 60],
          [2, "2025-03-04", 140],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const p of seq(1, ri(rng, 1, 3))) {
        let d = "2025-03-01";
        const costs: number[] = [];
        for (let j = ri(rng, p === 1 ? 5 : 0, 12); j > 0; j--) {
          let c = chance(rng, 0.25) ? ri(rng, 50, 120) : ri(rng, 10, 30);
          const w = costs.slice(-7);
          // Sometimes exactly twice the trailing average — the boundary "strictly" is about.
          if (w.length >= 3 && chance(rng, 0.2)) {
            const s2 = 2 * w.reduce((a, b) => a + b, 0);
            if (s2 % w.length === 0) c = s2 / w.length;
          }
          costs.push(c);
          rows.push([p, d, c]);
          d = addDays(d, chance(rng, 0.2) ? 2 : 1);
        }
      }
      return { ProjectDailyCost: shuffle(rng, rows) };
    },
    solution: [
      "WITH w AS (",
      "  SELECT project_id, usage_date, cost_usd,",
      "         AVG(cost_usd) OVER (PARTITION BY project_id ORDER BY usage_date",
      "                             ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING) AS prev_avg,",
      "         COUNT(*) OVER (PARTITION BY project_id ORDER BY usage_date",
      "                        ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING) AS prior_days",
      "  FROM ProjectDailyCost",
      ")",
      "SELECT project_id, usage_date, cost_usd, ROUND(prev_avg, 2) AS trailing_avg",
      "FROM w",
      "WHERE prior_days >= 3",
      "  AND cost_usd > 2 * prev_avg",
      "ORDER BY project_id, usage_date",
    ].join("\n"),
    alternatives: [
      "WITH w AS (SELECT project_id, usage_date, cost_usd, SUM(cost_usd) OVER (PARTITION BY project_id ORDER BY usage_date ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING) AS s, COUNT(*) OVER (PARTITION BY project_id ORDER BY usage_date ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING) AS n FROM ProjectDailyCost) SELECT project_id, usage_date, cost_usd, ROUND(s / n, 2) AS trailing_avg FROM w WHERE n >= 3 AND cost_usd * n > 2 * s ORDER BY project_id, usage_date",
      "WITH r AS (SELECT project_id, usage_date, cost_usd, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY usage_date) AS rn FROM ProjectDailyCost) SELECT c.project_id, c.usage_date, c.cost_usd, ROUND(AVG(p.cost_usd), 2) AS trailing_avg FROM r c JOIN r p ON p.project_id = c.project_id AND p.rn < c.rn AND p.rn + 7 >= c.rn GROUP BY c.project_id, c.usage_date, c.cost_usd HAVING COUNT(*) >= 3 AND c.cost_usd * COUNT(*) > 2 * SUM(p.cost_usd) ORDER BY c.project_id, c.usage_date",
    ],
    ordered: true,
    hints: [
      "A window frame can exclude the current row: `ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING`.",
      "Use the same frame for AVG and for COUNT so you know how many days the average covers.",
      "Compare with twice the average strictly; equal is not a spike.",
    ],
    editorial: [
      "The baseline for a day is the average of the rows *before* it, so the frame must stop one row short of the current one: `ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING`, partitioned by project and ordered by date. Because the frame counts rows, gaps in the calendar (a day without usage) are skipped naturally — the baseline is the previous seven *billed* days, as stated.",
      "",
      "Early rows have short frames; the very first has an empty one, where AVG is NULL. A `COUNT(*)` over the same frame tells how many days the baseline really covers, and the rule needs at least three, so a project's first three days can never be spikes. The spike test is strict: a day at exactly twice the average is not flagged.",
      "",
      "The first alternative avoids comparing with a fractional average by cross-multiplying: `cost × n > 2 × sum`. The second rebuilds the frame with a self join on row numbers (`p.rn` from `c.rn − 7` to `c.rn − 1`) and aggregates — the pre-window way. The window version sorts each project once.",
    ].join("\n"),
  },

  {
    slug: "google-meet-calls-where-guests-waited-for-a-late-host",
    title: "Google: Meet Calls Where Guests Waited for a Late Host",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Dates"],
    description: [
      "The Google Meet team is testing a nudge for hosts who keep people waiting. A participant's arrival is their **first** join to a call (people often drop and rejoin).",
      "",
      "A call qualifies when its host arrived **more than 5 minutes (300 seconds)** after `scheduled_start` and **at least one guest** (anyone other than the host) arrived **strictly before** the host. Calls the host never joined are left out. Return `meeting_id`, `host_email`, `host_late_minutes` (whole minutes from `scheduled_start` to the host's arrival) and `guests_waiting` (guests who arrived before the host). Order by `host_late_minutes` descending, then `meeting_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "MeetCall",
        columns: [
          { name: "meeting_id", type: "int" },
          { name: "host_email", type: "varchar" },
          { name: "scheduled_start", type: "datetime" },
        ],
        primaryKey: ["meeting_id"],
        note: "One scheduled Meet call and its host.",
      },
      {
        name: "MeetJoin",
        columns: [
          { name: "join_id", type: "int" },
          { name: "meeting_id", type: "int" },
          { name: "participant_email", type: "varchar" },
          { name: "joined_at", type: "datetime" },
        ],
        primaryKey: ["join_id"],
        note: "One time a participant entered a call; the same person can have several rows for one call.",
      },
    ],
    examples: [
      {
        MeetCall: [
          [1, "asha@zentrix.io", "2025-06-02 10:00:00"],
          [2, "ravi@zentrix.io", "2025-06-02 11:00:00"],
          [3, "meera@zentrix.io", "2025-06-02 12:00:00"],
          [4, "kabir@zentrix.io", "2025-06-02 15:00:00"],
          [5, "zara@zentrix.io", "2025-06-02 16:00:00"],
        ],
        MeetJoin: [
          [1, 1, "neha@zentrix.io", "2025-06-02 09:59:00"],
          [2, 1, "dev@zentrix.io", "2025-06-02 10:03:00"],
          [3, 1, "asha@zentrix.io", "2025-06-02 10:12:30"],
          [4, 1, "dev@zentrix.io", "2025-06-02 10:20:00"],
          [5, 2, "neha@zentrix.io", "2025-06-02 11:01:00"],
          [6, 2, "ravi@zentrix.io", "2025-06-02 11:05:00"],
          [7, 3, "meera@zentrix.io", "2025-06-02 12:09:00"],
          [8, 3, "dev@zentrix.io", "2025-06-02 12:10:00"],
          [9, 4, "neha@zentrix.io", "2025-06-02 15:00:00"],
          [10, 5, "dev@zentrix.io", "2025-06-02 16:06:00"],
          [11, 5, "zara@zentrix.io", "2025-06-02 16:08:00"],
          [12, 5, "zara@zentrix.io", "2025-06-02 16:30:00"],
        ],
      },
    ],
    gen: (rng) => {
      const people = ["asha", "ravi", "meera", "kabir", "zara", "neha", "dev"].map((n) => `${n}@zentrix.io`);
      const nm = ri(rng, 1, 6);
      const calls: Cell[][] = [];
      const joins: Cell[][] = [];
      for (const m of seq(1, nm)) {
        const host = pick(rng, people);
        const start = at(dateBetween(rng, "2025-06-02", "2025-06-06"), ri(rng, 9, 17), pick(rng, [0, 30]));
        calls.push([m, host, start]);
        const hostOffset = pick(rng, [0, 120, 300, 301, 360, 600, 900, 1500]);
        if (chance(rng, 0.9)) {
          joins.push([0, m, host, addSecs(start, hostOffset)]);
          if (chance(rng, 0.2)) joins.push([0, m, host, addSecs(start, hostOffset + 600)]);
        }
        for (const g of sample(rng, people.filter((p) => p !== host), ri(rng, 0, 3))) {
          const off = chance(rng, 0.15) ? hostOffset : ri(rng, -2, 20) * 60;
          joins.push([0, m, g, addSecs(start, off)]);
          if (chance(rng, 0.25)) joins.push([0, m, g, addSecs(start, off + ri(rng, 1, 30) * 60)]);
        }
      }
      shuffle(rng, joins).forEach((j, i) => (j[0] = i + 1));
      return { MeetCall: calls, MeetJoin: joins };
    },
    solution: [
      "WITH arrivals AS (",
      "  SELECT meeting_id, participant_email, MIN(joined_at) AS arrived_at",
      "  FROM MeetJoin",
      "  GROUP BY meeting_id, participant_email",
      "), hosts AS (",
      "  SELECT c.meeting_id, c.host_email, c.scheduled_start, a.arrived_at AS host_at",
      "  FROM MeetCall c",
      "  JOIN arrivals a ON a.meeting_id = c.meeting_id AND a.participant_email = c.host_email",
      "  WHERE TIMESTAMPDIFF(SECOND, c.scheduled_start, a.arrived_at) > 300",
      ")",
      "SELECT h.meeting_id, h.host_email,",
      "       TIMESTAMPDIFF(MINUTE, h.scheduled_start, h.host_at) AS host_late_minutes,",
      "       COUNT(*) AS guests_waiting",
      "FROM hosts h",
      "JOIN arrivals g",
      "  ON g.meeting_id = h.meeting_id",
      " AND g.participant_email <> h.host_email",
      " AND g.arrived_at < h.host_at",
      "GROUP BY h.meeting_id, h.host_email, h.scheduled_start, h.host_at",
      "ORDER BY host_late_minutes DESC, h.meeting_id",
    ].join("\n"),
    alternatives: [
      "SELECT x.meeting_id, x.host_email, TIMESTAMPDIFF(MINUTE, x.scheduled_start, x.host_at) AS host_late_minutes, COUNT(DISTINCT j.participant_email) AS guests_waiting FROM (SELECT c.meeting_id, c.host_email, c.scheduled_start, MIN(CASE WHEN j.participant_email = c.host_email THEN j.joined_at END) AS host_at FROM MeetCall c JOIN MeetJoin j ON j.meeting_id = c.meeting_id GROUP BY c.meeting_id, c.host_email, c.scheduled_start) x JOIN MeetJoin j ON j.meeting_id = x.meeting_id AND j.participant_email <> x.host_email AND j.joined_at < x.host_at WHERE x.host_at > DATE_ADD(x.scheduled_start, INTERVAL 300 SECOND) GROUP BY x.meeting_id, x.host_email, x.scheduled_start, x.host_at ORDER BY host_late_minutes DESC, x.meeting_id",
    ],
    ordered: true,
    hints: [
      "Collapse the join log to one arrival per person per call: their MIN `joined_at`.",
      "Pick out the host's arrival by matching the participant to `host_email`, and keep calls where it is more than 300 seconds late.",
      "Count the other people whose arrival is strictly earlier than the host's.",
    ],
    editorial: [
      "Rejoins are the trap: a guest who arrived early, dropped and came back late is still someone who waited, and a host who rejoined later did not arrive late a second time. So the log is first reduced to **arrivals** — `MIN(joined_at)` per call and participant.",
      "",
      "The host's arrival is the arrival row whose participant is the call's `host_email`; an inner join drops calls the host never entered. Lateness is measured exactly in seconds so that a host at 5:00 is on time and one at 5:01 is late, then reported in whole minutes with `TIMESTAMPDIFF(MINUTE, …)`.",
      "",
      "Joining the late hosts back to the arrivals of everyone else with `arrived_at < host_at` leaves the guests who were already waiting; a guest who arrived at the same second as the host did not wait. Calls with no such guest produce no row, which is the \"at least one guest\" rule. Because arrivals are unique per person, `COUNT(*)` counts people.",
      "",
      "The alternative finds the host's arrival with conditional aggregation — `MIN(CASE WHEN participant = host …)` — and counts waiting guests straight from the raw log with `COUNT(DISTINCT …)`, since a person with any join before the host's arrival has an arrival before it too.",
    ].join("\n"),
  },
  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "google-channels-eligible-for-the-partner-programme",
    title: "Google: YouTube Channels Eligible for the Partner Programme",
    difficulty: "HARD",
    topics: ["Joins", "Aggregation", "Subqueries", "Dates"],
    description: [
      "The YouTube creator-support team reviews which channels qualify for monetisation on **2025-06-30**. In this exercise a channel qualifies when, as of that date, all three hold:",
      "",
      "- it has **at least 1,000 subscribers** — the sum of `delta` over its subscription events dated on or before 2025-06-30;",
      "- its **public** videos earned **at least 4,000 watch hours** (240,000 minutes) from watch logs dated **2024-07-01 to 2025-06-30 inclusive** (unlisted and private videos do not count);",
      "- it has **no active strike**: no strike with `issued_on` on or before 2025-06-30 and `expires_on` after 2025-06-30.",
      "",
      "Return `channel_name`, `subscribers` and `watch_hours` (the qualifying minutes divided by 60, **rounded down** to a whole number) for every qualifying channel, ordered by `channel_name`.",
    ].join("\n"),
    tables: [
      {
        name: "Channel",
        columns: [
          { name: "channel_id", type: "int" },
          { name: "channel_name", type: "varchar" },
        ],
        primaryKey: ["channel_id"],
        note: "One channel; `channel_name` is unique.",
      },
      {
        name: "SubscriptionEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "channel_id", type: "int" },
          { name: "event_date", type: "date" },
          { name: "delta", type: "int" },
        ],
        primaryKey: ["event_id"],
        note: "The net change in a channel's subscribers on one day (negative when more people unsubscribed).",
      },
      {
        name: "Video",
        columns: [
          { name: "video_id", type: "int" },
          { name: "channel_id", type: "int" },
          { name: "visibility", type: "enum", values: ["public", "unlisted", "private"] },
        ],
        primaryKey: ["video_id"],
        note: "One uploaded video and its current visibility.",
      },
      {
        name: "WatchLog",
        columns: [
          { name: "log_id", type: "int" },
          { name: "video_id", type: "int" },
          { name: "watch_date", type: "date" },
          { name: "minutes", type: "int" },
        ],
        primaryKey: ["log_id"],
        note: "Minutes watched of one video on one day, summed over all viewers.",
      },
      {
        name: "Strike",
        columns: [
          { name: "strike_id", type: "int" },
          { name: "channel_id", type: "int" },
          { name: "issued_on", type: "date" },
          { name: "expires_on", type: "date" },
        ],
        primaryKey: ["strike_id"],
        note: "A community-guidelines strike, in force from `issued_on` until the day before `expires_on`.",
      },
    ],
    examples: [
      {
        Channel: [
          [1, "Tabla Lessons"],
          [2, "Desi Gadget Lab"],
          [3, "Monsoon Treks"],
          [4, "Pixel Photo Walks"],
        ],
        SubscriptionEvent: [
          [1, 1, "2024-03-10", 800],
          [2, 1, "2025-02-01", 250],
          [3, 1, "2025-07-02", -100],
          [4, 2, "2024-11-11", 1200],
          [5, 2, "2025-06-30", -200],
          [6, 3, "2025-01-05", 700],
          [7, 4, "2024-08-01", 3000],
        ],
        Video: [
          [10, 1, "public"],
          [11, 1, "private"],
          [20, 2, "public"],
          [21, 2, "unlisted"],
          [30, 3, "public"],
          [40, 4, "public"],
        ],
        WatchLog: [
          [1, 10, "2024-06-30", 90000],
          [2, 10, "2024-07-01", 150000],
          [3, 10, "2025-03-15", 95000],
          [4, 11, "2025-01-01", 200000],
          [5, 20, "2025-06-30", 240000],
          [6, 21, "2025-02-02", 50000],
          [7, 30, "2025-04-04", 400000],
          [8, 40, "2025-05-05", 300000],
        ],
        Strike: [
          [1, 4, "2025-04-01", "2025-07-01"],
          [2, 1, "2024-10-01", "2025-01-01"],
        ],
      },
    ],
    gen: (rng) => {
      const nc = ri(rng, 2, 5);
      const chans: Cell[][] = sample(rng, ["Tabla Lessons", "Desi Gadget Lab", "Monsoon Treks", "Pixel Photo Walks", "Chai Code", "Rasoi Diaries", "Cricket Nerds"], nc).map((n, i) => [i + 1, n]);
      const subs: Cell[][] = [];
      const vids: Cell[][] = [];
      const logs: Cell[][] = [];
      const strikes: Cell[][] = [];
      for (const c of seq(1, nc)) {
        let total = 0;
        for (let j = ri(rng, 0, 3); j > 0; j--) {
          let d = ri(rng, -200, 1500);
          const date = chance(rng, 0.15) ? pick(rng, ["2025-07-01", "2025-06-30"]) : dateBetween(rng, "2024-01-01", "2025-06-29");
          // Land exactly on 1,000 now and then.
          if (j === 1 && date <= "2025-06-30" && chance(rng, 0.3)) d = 1000 - total;
          if (date <= "2025-06-30") total += d;
          subs.push([subs.length + 1, c, date, d]);
        }
        for (let v = ri(rng, 1, 3); v > 0; v--) {
          const vid = vids.length + 1;
          vids.push([vid, c, pick(rng, ["public", "public", "public", "unlisted", "private"])]);
          for (let l = ri(rng, 0, 3); l > 0; l--) {
            const date = chance(rng, 0.2) ? pick(rng, ["2024-06-30", "2024-07-01", "2025-06-30", "2025-07-01"]) : dateBetween(rng, "2024-07-01", "2025-06-30");
            logs.push([logs.length + 1, vid, date, chance(rng, 0.1) ? 240000 : roundTo(rng, 40000, 260000, 1000)]);
          }
        }
        if (chance(rng, 0.15)) {
          const issued = dateBetween(rng, "2025-01-01", "2025-06-30");
          strikes.push([strikes.length + 1, c, issued, pick(rng, [addDays(issued, 90), "2025-06-30", "2025-07-01"])]);
        }
      }
      return { Channel: chans, SubscriptionEvent: subs, Video: vids, WatchLog: logs, Strike: strikes };
    },
    solution: [
      "WITH subs AS (",
      "  SELECT channel_id, SUM(delta) AS subscribers",
      "  FROM SubscriptionEvent",
      "  WHERE event_date <= '2025-06-30'",
      "  GROUP BY channel_id",
      "), watch AS (",
      "  SELECT v.channel_id, SUM(w.minutes) AS mins",
      "  FROM WatchLog w",
      "  JOIN Video v ON v.video_id = w.video_id",
      "  WHERE v.visibility = 'public'",
      "    AND w.watch_date BETWEEN '2024-07-01' AND '2025-06-30'",
      "  GROUP BY v.channel_id",
      ")",
      "SELECT c.channel_name, s.subscribers, w.mins DIV 60 AS watch_hours",
      "FROM Channel c",
      "JOIN subs s ON s.channel_id = c.channel_id",
      "JOIN watch w ON w.channel_id = c.channel_id",
      "WHERE s.subscribers >= 1000",
      "  AND w.mins >= 240000",
      "  AND NOT EXISTS (",
      "    SELECT 1 FROM Strike k",
      "    WHERE k.channel_id = c.channel_id",
      "      AND k.issued_on <= '2025-06-30'",
      "      AND k.expires_on > '2025-06-30'",
      "  )",
      "ORDER BY c.channel_name",
    ].join("\n"),
    alternatives: [
      "SELECT channel_name, subscribers, FLOOR(mins / 60) AS watch_hours FROM (SELECT c.channel_id, c.channel_name, (SELECT COALESCE(SUM(delta), 0) FROM SubscriptionEvent e WHERE e.channel_id = c.channel_id AND e.event_date <= '2025-06-30') AS subscribers, (SELECT COALESCE(SUM(w.minutes), 0) FROM WatchLog w JOIN Video v ON v.video_id = w.video_id WHERE v.channel_id = c.channel_id AND v.visibility = 'public' AND w.watch_date >= '2024-07-01' AND w.watch_date < '2025-07-01') AS mins, (SELECT COUNT(*) FROM Strike k WHERE k.channel_id = c.channel_id AND '2025-06-30' >= k.issued_on AND '2025-06-30' < k.expires_on) AS active_strikes FROM Channel c) t WHERE subscribers >= 1000 AND mins >= 240000 AND active_strikes = 0 ORDER BY channel_name",
    ],
    ordered: true,
    hints: [
      "Subscribers and watch time come from different tables with different row counts — aggregate each on its own before combining, or the join will multiply rows.",
      "Watch time goes through `Video` to reach the channel, and only public videos and the 365-day window count.",
      "An active strike is a condition of absence: NOT EXISTS.",
      "Whole hours rounded down: integer division by 60.",
    ],
    editorial: [
      "The trap is the **fan-out**. Joining `Channel` to `SubscriptionEvent` and to `WatchLog` in one go produces every subscription event paired with every watch log, so `SUM(delta)` gets multiplied by the number of logs and `SUM(minutes)` by the number of events. Each measure must be aggregated on its own first. The `subs` CTE sums deltas dated on or before the review date (a later unsubscribe does not count yet); the `watch` CTE joins logs to videos, keeps public videos and the inclusive window 2024-07-01 to 2025-06-30 (exactly 365 days), and sums minutes per channel.",
      "",
      "With one row per channel from each CTE, inner joins keep only channels that have both, and the thresholds are plain comparisons — inclusive, so a channel at exactly 1,000 subscribers or 240,000 minutes qualifies. The strike rule is an anti join: `NOT EXISTS` a strike issued by the date and expiring after it (a strike expiring on 2025-06-30 has already lapsed). `mins DIV 60` gives whole hours rounded down.",
      "",
      "The alternative computes the three facts as correlated scalar subqueries in a derived table — also fan-out free, because each subquery aggregates alone — and filters outside. Both read each table once per channel at most.",
    ].join("\n"),
  },

  {
    slug: "google-play-service-fee-tier-crossing",
    title: "Google: Play Service Fee and the Purchase That Crossed the Tier",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation", "Dates"],
    description: [
      "In this exercise the Play Store keeps **15%** of a developer's first **1,000 USD** of sales in each calendar year and **30%** of everything above that within the same year. A purchase that straddles the 1,000 mark is split: the part up to 1,000 is charged 15% and the rest 30%.",
      "",
      "Purchases are taken in order of `purchased_at`, then `purchase_id`. For every developer and year with sales, return `developer_id`, `sales_year`, `gross_usd` (the year's sales), `fee_usd` (the year's fee, **rounded to 2 decimals**) and `crossing_purchase_id` — the purchase during which the year's running sales first went **above** 1,000 (reaching exactly 1,000 is not above), or NULL if they never did. Order by `developer_id`, then `sales_year`.",
    ].join("\n"),
    tables: [
      {
        name: "PlayPurchase",
        columns: [
          { name: "purchase_id", type: "int" },
          { name: "developer_id", type: "int" },
          { name: "purchased_at", type: "datetime" },
          { name: "amount_usd", type: "int" },
        ],
        primaryKey: ["purchase_id"],
        note: "One paid app or in-app purchase, in whole US dollars (always positive).",
      },
    ],
    examples: [
      {
        PlayPurchase: [
          [1, 7, "2024-12-20 10:00:00", 400],
          [2, 7, "2025-01-05 09:30:00", 600],
          [3, 7, "2025-02-01 18:00:00", 300],
          [4, 7, "2025-03-01 12:00:00", 250],
          [5, 9, "2025-04-01 09:00:00", 990],
          [8, 9, "2025-05-05 10:00:00", 50],
          [6, 9, "2025-05-05 10:00:00", 10],
        ],
      },
    ],
    gen: (rng) => {
      const devs = seq(1, ri(rng, 1, 3));
      const rows: Cell[][] = seq(1, ri(rng, 1, 22)).map(() => [0, pick(rng, devs), at(dateBetween(rng, "2024-10-01", "2025-03-31"), pick(rng, [9, 12, 18]), 0), ri(rng, 20, 400)]);
      shuffle(rng, rows).forEach((r, i) => (r[0] = i + 1));
      // Walk each developer-year in order and sometimes land exactly on 1,000.
      const ordered = [...rows].sort((a, b) => (a[1] as number) - (b[1] as number) || String(a[2]).localeCompare(String(b[2])) || (a[0] as number) - (b[0] as number));
      const run = new Map<string, number>();
      for (const r of ordered) {
        const k = `${r[1]}-${String(r[2]).slice(0, 4)}`;
        const before = run.get(k) ?? 0;
        if (before < 1000 && before + (r[3] as number) > 1000 && chance(rng, 0.35)) r[3] = 1000 - before;
        run.set(k, before + (r[3] as number));
      }
      return { PlayPurchase: rows };
    },
    solution: [
      "WITH p AS (",
      "  SELECT purchase_id, developer_id, YEAR(purchased_at) AS sales_year, amount_usd,",
      "         SUM(amount_usd) OVER (PARTITION BY developer_id, YEAR(purchased_at)",
      "                               ORDER BY purchased_at, purchase_id",
      "                               ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running",
      "  FROM PlayPurchase",
      "), yr AS (",
      "  SELECT developer_id, sales_year, SUM(amount_usd) AS gross",
      "  FROM p",
      "  GROUP BY developer_id, sales_year",
      "), crossing AS (",
      "  SELECT developer_id, sales_year, purchase_id",
      "  FROM p",
      "  WHERE running > 1000 AND running - amount_usd <= 1000",
      ")",
      "SELECT y.developer_id, y.sales_year, y.gross AS gross_usd,",
      "       ROUND(0.15 * LEAST(y.gross, 1000) + 0.30 * GREATEST(y.gross - 1000, 0), 2) AS fee_usd,",
      "       c.purchase_id AS crossing_purchase_id",
      "FROM yr y",
      "LEFT JOIN crossing c ON c.developer_id = y.developer_id AND c.sales_year = y.sales_year",
      "ORDER BY y.developer_id, y.sales_year",
    ].join("\n"),
    alternatives: [
      "WITH p AS (SELECT a.purchase_id, a.developer_id, YEAR(a.purchased_at) AS sales_year, a.amount_usd, (SELECT COALESCE(SUM(b.amount_usd), 0) FROM PlayPurchase b WHERE b.developer_id = a.developer_id AND YEAR(b.purchased_at) = YEAR(a.purchased_at) AND (b.purchased_at < a.purchased_at OR (b.purchased_at = a.purchased_at AND b.purchase_id < a.purchase_id))) AS before_it FROM PlayPurchase a), s AS (SELECT purchase_id, developer_id, sales_year, amount_usd, before_it, GREATEST(0, LEAST(amount_usd, 1000 - before_it)) AS low FROM p) SELECT developer_id, sales_year, SUM(amount_usd) AS gross_usd, ROUND(SUM(0.15 * low + 0.30 * (amount_usd - low)), 2) AS fee_usd, MAX(CASE WHEN before_it <= 1000 AND before_it + amount_usd > 1000 THEN purchase_id END) AS crossing_purchase_id FROM s GROUP BY developer_id, sales_year ORDER BY developer_id, sales_year",
    ],
    ordered: true,
    hints: [
      "A running total per developer and year, in purchase order, tells where each purchase sits relative to the 1,000 mark.",
      "The crossing purchase is the one whose running total is above 1,000 while the total before it was not.",
      "The year's fee depends only on its gross: 15% of the first 1,000 plus 30% of the rest.",
      "Years with no crossing still need a row — LEFT JOIN the crossing onto the yearly totals.",
    ],
    editorial: [
      "Two different questions share one running total. `SUM(amount_usd) OVER (PARTITION BY developer_id, YEAR(purchased_at) ORDER BY purchased_at, purchase_id ROWS … CURRENT ROW)` gives, for every purchase, the year's sales up to and including it; the `purchase_id` tiebreak makes the order total when two purchases share a timestamp, so the running totals are deterministic.",
      "",
      "The **crossing purchase** is the one where the total jumps over the mark: `running > 1000` and `running - amount_usd <= 1000`. Exactly one purchase per developer-year can satisfy that (amounts are positive), and none does if the year never passes 1,000 — including a year that stops at exactly 1,000. A LEFT JOIN onto the yearly totals keeps those years with NULL.",
      "",
      "The fee splits at the mark, and because every dollar is either below or above it, the year's fee is `0.15 × LEAST(gross, 1000) + 0.30 × GREATEST(gross − 1000, 0)` — order does not change it. The alternative proves that by charging each purchase its own split (`low` = the part still under the mark) and summing, with the total-before computed by a correlated subquery instead of a window. The window version sorts each developer-year once.",
    ].join("\n"),
  },

  {
    slug: "google-cloud-vm-cost-with-machine-types-filled-forward",
    title: "Google: Cloud VM Cost With Machine Types Filled Forward",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins", "Aggregation"],
    description: [
      "A Google Cloud billing engineer rebuilds VM costs from a compact usage log. To save space the log records an instance's `machine_type` **only on days it changed**; on other days the column is NULL and the instance kept the **last type recorded before it**. Days before an instance's first recorded type have an **unknown** type.",
      "",
      "Fill each day's type forward, price it with `MachinePrice`, and return for every instance in the log: `instance_id`, `billed_hours` (hours on days with a known type), `cost_cents` (the sum of hours × `cents_per_hour` of that day's type; 0 if none) and `unknown_hours` (hours on days whose type is unknown). Order by `instance_id`.",
    ].join("\n"),
    tables: [
      {
        name: "VmUsage",
        columns: [
          { name: "instance_id", type: "int" },
          { name: "usage_date", type: "date" },
          { name: "hours", type: "int" },
          { name: "machine_type", type: "varchar" },
        ],
        primaryKey: ["instance_id", "usage_date"],
        note: "Hours one VM instance ran on one day. `machine_type` is set only on the day the type changed (or was first logged), NULL otherwise; days the VM did not run have no row.",
      },
      {
        name: "MachinePrice",
        columns: [
          { name: "machine_type", type: "varchar" },
          { name: "cents_per_hour", type: "int" },
        ],
        primaryKey: ["machine_type"],
        note: "The hourly list price of a machine type; every type in the log is priced here.",
      },
    ],
    examples: [
      {
        VmUsage: [
          [1, "2025-06-01", 10, "e2-small"],
          [1, "2025-06-02", 24, null],
          [1, "2025-06-03", 24, "e2-standard-4"],
          [1, "2025-06-04", 5, null],
          [1, "2025-06-06", 8, null],
          [2, "2025-06-01", 6, null],
          [2, "2025-06-02", 12, null],
          [2, "2025-06-03", 24, "n2-highmem-8"],
          [2, "2025-06-04", 3, null],
          [3, "2025-06-02", 4, null],
        ],
        MachinePrice: [
          ["e2-small", 2],
          ["e2-standard-4", 13],
          ["n2-highmem-8", 52],
          ["c3-standard-8", 34],
        ],
      },
    ],
    gen: (rng) => {
      const types = ["e2-small", "e2-standard-4", "n2-highmem-8", "c3-standard-8"];
      const rows: Cell[][] = [];
      for (const inst of seq(1, ri(rng, 1, 4))) {
        let d = dateBetween(rng, "2025-06-01", "2025-06-04");
        for (let j = ri(rng, 1, 8), first = true; j > 0; j--, first = false) {
          const logged = first ? chance(rng, 0.6) : chance(rng, 0.25);
          rows.push([inst, d, ri(rng, 1, 24), logged ? pick(rng, types) : null]);
          d = addDays(d, chance(rng, 0.25) ? 2 : 1);
        }
      }
      return { VmUsage: shuffle(rng, rows), MachinePrice: [["e2-small", 2], ["e2-standard-4", 13], ["n2-highmem-8", 52], ["c3-standard-8", 34]] };
    },
    solution: [
      "WITH marked AS (",
      "  SELECT instance_id, usage_date, hours, machine_type,",
      "         COUNT(machine_type) OVER (PARTITION BY instance_id ORDER BY usage_date",
      "                                   ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS type_grp",
      "  FROM VmUsage",
      "), filled AS (",
      "  SELECT instance_id, hours,",
      "         MAX(machine_type) OVER (PARTITION BY instance_id, type_grp) AS filled_type",
      "  FROM marked",
      ")",
      "SELECT f.instance_id,",
      "       SUM(CASE WHEN f.filled_type IS NOT NULL THEN f.hours ELSE 0 END) AS billed_hours,",
      "       COALESCE(SUM(f.hours * p.cents_per_hour), 0) AS cost_cents,",
      "       SUM(CASE WHEN f.filled_type IS NULL THEN f.hours ELSE 0 END) AS unknown_hours",
      "FROM filled f",
      "LEFT JOIN MachinePrice p ON p.machine_type = f.filled_type",
      "GROUP BY f.instance_id",
      "ORDER BY f.instance_id",
    ].join("\n"),
    alternatives: [
      "SELECT x.instance_id, SUM(IF(x.filled_type IS NULL, 0, x.hours)) AS billed_hours, SUM(IF(x.filled_type IS NULL, 0, x.hours * (SELECT p.cents_per_hour FROM MachinePrice p WHERE p.machine_type = x.filled_type))) AS cost_cents, SUM(IF(x.filled_type IS NULL, x.hours, 0)) AS unknown_hours FROM (SELECT u.instance_id, u.hours, (SELECT k.machine_type FROM VmUsage k WHERE k.instance_id = u.instance_id AND k.usage_date <= u.usage_date AND k.machine_type IS NOT NULL ORDER BY k.usage_date DESC LIMIT 1) AS filled_type FROM VmUsage u) x GROUP BY x.instance_id ORDER BY x.instance_id",
    ],
    ordered: true,
    hints: [
      "Each day needs the most recent non-NULL `machine_type` of the same instance at or before it.",
      "A running `COUNT(machine_type)` only goes up on days a type was logged, so it gives every day the number of the last logged row.",
      "Within one (instance, running count) group exactly one row has a type — spread it with `MAX(...) OVER (PARTITION BY ...)`.",
      "Days before the first logged type land in group 0, which has no type: they are the unknown hours.",
    ],
    editorial: [
      "This is **forward fill**: carry the last known value onto later rows until a new one appears. SQL has no \"ignore nulls\" for `LAG` in MySQL, so the standard trick builds groups. A running `COUNT(machine_type)` per instance in date order counts only non-NULL values, so it rises by one on each day a type was logged and stays flat on the NULL days after it. Every day therefore shares a group number with the logged day it inherits from.",
      "",
      "Inside such a group exactly one row carries a type, so `MAX(machine_type) OVER (PARTITION BY instance_id, type_grp)` copies it onto every row of the group. Rows before the first logged day are in group 0, where every value is NULL, and stay NULL — that is the unknown type the statement separates out.",
      "",
      "With a type on every row, the rest is a priced aggregate: a LEFT JOIN to `MachinePrice` (an unknown type has no price), hours × cents summed per instance, and conditional sums to split known from unknown hours. `COALESCE` makes an instance with only unknown days cost 0 rather than NULL. Calendar gaps do not matter: the fill follows the log rows, not the dates.",
      "",
      "The alternative fetches each day's type with a correlated subquery — the latest logged row at or before the day (`ORDER BY usage_date DESC LIMIT 1`) — which is the definition read literally but probes the table once per row; the window version sorts each instance once.",
    ].join("\n"),
  },

  {
    slug: "google-prorated-workspace-seat-days-for-june",
    title: "Google: Prorated Workspace Seat-Days for June 2025",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Joins"],
    description: [
      "Google Workspace bills flexible plans by the day. Each customer's seat count is recorded only when it changes: from a change's `effective_date` the customer holds `seats` seats **until the day before its next change** (or indefinitely if there is none). A change to 0 seats is a cancellation.",
      "",
      "For June 2025 (**2025-06-01 to 2025-06-30 inclusive**), a customer's **seat-days** are the sum over every day of June of the seats held that day; days before the first change hold no seats. Return `domain` and `seat_days` for every customer with **more than 0** seat-days, ordered by `seat_days` descending, then `domain` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "WorkspaceCustomer",
        columns: [
          { name: "customer_id", type: "int" },
          { name: "domain", type: "varchar" },
        ],
        primaryKey: ["customer_id"],
        note: "One Workspace customer; `domain` is unique.",
      },
      {
        name: "SeatChange",
        columns: [
          { name: "customer_id", type: "int" },
          { name: "effective_date", type: "date" },
          { name: "seats", type: "int" },
        ],
        primaryKey: ["customer_id", "effective_date"],
        note: "The seat count a customer holds from `effective_date` on, until its next change.",
      },
    ],
    examples: [
      {
        WorkspaceCustomer: [
          [1, "zentrix.io"],
          [2, "quillpad.in"],
          [3, "tiffinly.co"],
          [4, "ledgerly.com"],
          [5, "orbitpay.in"],
        ],
        SeatChange: [
          [1, "2025-04-10", 20],
          [1, "2025-06-11", 25],
          [2, "2025-06-20", 10],
          [3, "2025-05-01", 15],
          [3, "2025-06-16", 0],
          [4, "2025-07-01", 50],
          [5, "2025-03-01", 5],
          [5, "2025-05-31", 0],
        ],
      },
    ],
    gen: (rng) => {
      const domains = ["zentrix.io", "quillpad.in", "tiffinly.co", "ledgerly.com", "orbitpay.in", "vaani.ai", "mintmark.com"];
      const nc = ri(rng, 1, 5);
      const custs: Cell[][] = sample(rng, domains, nc).map((d, i) => [i + 1, d]);
      const changes: Cell[][] = [];
      for (const c of seq(1, nc)) {
        const dates = new Set<string>();
        for (let j = ri(rng, 1, 4); j > 0; j--) dates.add(chance(rng, 0.3) ? pick(rng, ["2025-06-01", "2025-06-30", "2025-07-01", "2025-05-31"]) : dateBetween(rng, "2025-04-15", "2025-07-10"));
        for (const d of dates) changes.push([c, d, chance(rng, 0.2) ? 0 : ri(rng, 1, 50)]);
      }
      return { WorkspaceCustomer: custs, SeatChange: shuffle(rng, changes) };
    },
    solution: [
      "WITH periods AS (",
      "  SELECT customer_id, seats, effective_date AS from_date,",
      "         LEAD(effective_date) OVER (PARTITION BY customer_id ORDER BY effective_date) AS next_date",
      "  FROM SeatChange",
      "), clipped AS (",
      "  SELECT customer_id, seats,",
      "         GREATEST(from_date, '2025-06-01') AS a,",
      "         LEAST(COALESCE(next_date, '2025-07-01'), '2025-07-01') AS b",
      "  FROM periods",
      ")",
      "SELECT c.domain, SUM(k.seats * DATEDIFF(k.b, k.a)) AS seat_days",
      "FROM clipped k",
      "JOIN WorkspaceCustomer c ON c.customer_id = k.customer_id",
      "WHERE k.b > k.a",
      "GROUP BY c.customer_id, c.domain",
      "HAVING SUM(k.seats * DATEDIFF(k.b, k.a)) > 0",
      "ORDER BY seat_days DESC, c.domain",
    ].join("\n"),
    alternatives: [
      "WITH RECURSIVE june (d) AS (SELECT CAST('2025-06-01' AS DATE) UNION ALL SELECT DATE_ADD(d, INTERVAL 1 DAY) FROM june WHERE d < '2025-06-30') SELECT c.domain, SUM(s.seats) AS seat_days FROM june j JOIN WorkspaceCustomer c JOIN SeatChange s ON s.customer_id = c.customer_id AND s.effective_date = (SELECT MAX(x.effective_date) FROM SeatChange x WHERE x.customer_id = c.customer_id AND x.effective_date <= j.d) GROUP BY c.customer_id, c.domain HAVING SUM(s.seats) > 0 ORDER BY seat_days DESC, c.domain",
      "SELECT c.domain, SUM(s.seats * DATEDIFF(CASE WHEN COALESCE((SELECT MIN(n.effective_date) FROM SeatChange n WHERE n.customer_id = s.customer_id AND n.effective_date > s.effective_date), '2025-07-01') < '2025-07-01' THEN (SELECT MIN(n.effective_date) FROM SeatChange n WHERE n.customer_id = s.customer_id AND n.effective_date > s.effective_date) ELSE '2025-07-01' END, CASE WHEN s.effective_date > '2025-06-01' THEN s.effective_date ELSE '2025-06-01' END)) AS seat_days FROM SeatChange s JOIN WorkspaceCustomer c ON c.customer_id = s.customer_id WHERE s.effective_date < '2025-07-01' AND COALESCE((SELECT MIN(n.effective_date) FROM SeatChange n WHERE n.customer_id = s.customer_id AND n.effective_date > s.effective_date), '2025-07-01') > '2025-06-01' GROUP BY c.customer_id, c.domain HAVING SUM(s.seats * DATEDIFF(CASE WHEN COALESCE((SELECT MIN(n.effective_date) FROM SeatChange n WHERE n.customer_id = s.customer_id AND n.effective_date > s.effective_date), '2025-07-01') < '2025-07-01' THEN (SELECT MIN(n.effective_date) FROM SeatChange n WHERE n.customer_id = s.customer_id AND n.effective_date > s.effective_date) ELSE '2025-07-01' END, CASE WHEN s.effective_date > '2025-06-01' THEN s.effective_date ELSE '2025-06-01' END)) > 0 ORDER BY seat_days DESC, c.domain",
    ],
    ordered: true,
    hints: [
      "Turn each change into a period: from its date up to (not including) the next change's date — LEAD gives the next date.",
      "Clip every period to June: start no earlier than 2025-06-01, end no later than 2025-07-01 (exclusive).",
      "A clipped period contributes seats × its length in days; periods that end up empty contribute nothing.",
    ],
    editorial: [
      "The table stores only the moments a seat count changed, so the first step rebuilds **periods**: `LEAD(effective_date)` per customer gives the date the next change takes over, and the current count holds on every day before it. The last change has no successor and runs on indefinitely, which `COALESCE(next_date, '2025-07-01')` caps at the end of the month.",
      "",
      "Each period is then **clipped** to June as a half-open range `[a, b)`: `a = GREATEST(from_date, '2025-06-01')`, `b = LEAST(next_date, '2025-07-01')`. If `b > a` the period overlaps June for exactly `DATEDIFF(b, a)` days and contributes `seats × DATEDIFF(b, a)`; otherwise it lies wholly outside June and is skipped. Half-open ranges make the boundary days count once: a change on 2025-06-11 ends the old period on the 10th and starts the new one on the 11th. Days before a customer's first change hold no seats because no period covers them, and a cancellation (0 seats) contributes nothing.",
      "",
      "The first alternative is the brute-force check: build the 30 days of June with a recursive CTE and, for each customer and day, look up the latest change on or before that day. The second replaces LEAD with a correlated `MIN` of later dates and the GREATEST/LEAST with CASE. The window version touches each change once.",
    ].join("\n"),
  },

  {
    slug: "google-longest-youtube-autoplay-chain-per-session",
    title: "Google: Longest YouTube Autoplay Chain in Each Session",
    difficulty: "HARD",
    topics: ["Subqueries", "Window Functions"],
    description: [
      "The YouTube recommendations team measures how far autoplay carries a viewer. Each watch event either was **chosen** by the viewer (`autoplay_from` is NULL) or was **autoplayed** from the event recorded in `autoplay_from`. A **chain** is a chosen event followed by every event autoplayed from it, then from that one, and so on.",
      "",
      "For every session, return `session_id`, `root_video_id` (the `video_id` of the chosen event that starts its longest chain) and `chain_length` (the number of events in that chain, 1 for a chosen event nothing autoplayed from). If chains tie for longest, the one whose chosen event started earlier wins. Order by `session_id`.",
    ].join("\n"),
    tables: [
      {
        name: "WatchEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "session_id", type: "int" },
          { name: "video_id", type: "int" },
          { name: "started_at", type: "datetime" },
          { name: "autoplay_from", type: "int" },
        ],
        primaryKey: ["event_id"],
        note: "One video play. `autoplay_from` is the `event_id` of the play that autoplayed this one — always the play directly before it in the same session — or NULL when the viewer picked it. Start times within a session are distinct; every session's first event is chosen.",
      },
    ],
    examples: [
      {
        WatchEvent: [
          [10, 1, 501, "2025-05-03 20:00:00", null],
          [11, 1, 502, "2025-05-03 20:10:00", 10],
          [12, 1, 503, "2025-05-03 20:20:00", 11],
          [13, 1, 504, "2025-05-03 20:40:00", null],
          [14, 1, 505, "2025-05-03 20:50:00", 13],
          [20, 2, 601, "2025-05-03 21:00:00", null],
          [21, 2, 602, "2025-05-03 21:05:00", 20],
          [22, 2, 603, "2025-05-03 21:10:00", null],
          [23, 2, 604, "2025-05-03 21:20:00", 22],
          [30, 3, 701, "2025-05-03 22:00:00", null],
        ],
      },
    ],
    gen: (rng) => {
      const events: { session: number; video: number; at: string; auto: boolean }[] = [];
      for (const s of seq(1, ri(rng, 1, 4))) {
        let t = at(dateBetween(rng, "2025-05-01", "2025-05-05"), ri(rng, 17, 22), pick(rng, [0, 15, 30]));
        for (let j = ri(rng, 1, 7); j > 0; j--) {
          events.push({ session: s, video: ri(rng, 500, 540), at: t, auto: events.length > 0 && events[events.length - 1]!.session === s && chance(rng, 0.6) });
          t = addSecs(t, ri(rng, 2, 20) * 60);
        }
      }
      const ids = shuffle(rng, seq(1, events.length));
      const rows: Cell[][] = events.map((e, i) => [ids[i]!, e.session, e.video, e.at, e.auto ? ids[i - 1]! : null]);
      return { WatchEvent: shuffle(rng, rows) };
    },
    solution: [
      "WITH RECURSIVE chain (root_id, cur_id, len) AS (",
      "  SELECT event_id, event_id, 1",
      "  FROM WatchEvent",
      "  WHERE autoplay_from IS NULL",
      "  UNION ALL",
      "  SELECT c.root_id, w.event_id, c.len + 1",
      "  FROM chain c",
      "  JOIN WatchEvent w ON w.autoplay_from = c.cur_id",
      "), lengths AS (",
      "  SELECT root_id, MAX(len) AS chain_length",
      "  FROM chain",
      "  GROUP BY root_id",
      "), ranked AS (",
      "  SELECT r.session_id, r.video_id, l.chain_length,",
      "         ROW_NUMBER() OVER (PARTITION BY r.session_id",
      "                            ORDER BY l.chain_length DESC, r.started_at) AS rn",
      "  FROM lengths l",
      "  JOIN WatchEvent r ON r.event_id = l.root_id",
      ")",
      "SELECT session_id, video_id AS root_video_id, chain_length",
      "FROM ranked",
      "WHERE rn = 1",
      "ORDER BY session_id",
    ].join("\n"),
    alternatives: [
      "WITH tagged AS (SELECT event_id, session_id, video_id, started_at, autoplay_from, SUM(CASE WHEN autoplay_from IS NULL THEN 1 ELSE 0 END) OVER (PARTITION BY session_id ORDER BY started_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS chain_no FROM WatchEvent), chains AS (SELECT session_id, chain_no, COUNT(*) AS chain_length, MIN(started_at) AS root_at FROM tagged GROUP BY session_id, chain_no), best AS (SELECT session_id, chain_length, root_at, ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY chain_length DESC, root_at) AS rn FROM chains) SELECT b.session_id, t.video_id AS root_video_id, b.chain_length FROM best b JOIN tagged t ON t.session_id = b.session_id AND t.started_at = b.root_at WHERE b.rn = 1 ORDER BY b.session_id",
    ],
    ordered: true,
    hints: [
      "Start from every chosen event and follow `autoplay_from` links forward, one step at a time — a recursive CTE.",
      "Carry the chain's root and a running length through the recursion.",
      "Since each autoplayed play directly follows its source in the session, a running count of chosen events also numbers the chains.",
      "Pick the longest chain per session with ROW_NUMBER, breaking ties by the root's start time.",
    ],
    editorial: [
      "The data is a set of linked lists: each autoplayed event points back to its source. A **recursive CTE** walks them forward. The anchor takes every chosen event as a chain of length 1 whose root is itself; the recursive step joins events whose `autoplay_from` is the current tail and adds one to the length, keeping the root. The recursion stops by itself when no event points at the tail. The longest length reached from each root, `MAX(len)`, is that chain's size.",
      "",
      "Each root is a chosen event, so joining it back to `WatchEvent` gives its session, video and start time. Ranking the chains of a session by `chain_length DESC, started_at` and keeping number 1 picks the longest chain, the earlier-started one on a tie (start times in a session are distinct, so the order is total). A session with a single chosen play has one chain of length 1.",
      "",
      "The alternative uses the guarantee that an autoplayed play directly follows its source: then chains are islands of consecutive plays, each starting at a chosen event, and a running `SUM` of chosen-event flags numbers them. The recursive version follows the links themselves and would still work if that ordering guarantee were dropped; it costs one join per chain step.",
    ].join("\n"),
  },

  {
    slug: "google-median-first-reply-time-in-gmail-support-threads",
    title: "Google: Median First-Reply Time in Gmail Support Threads",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins", "Dates", "Aggregation"],
    description: [
      "Google's support teams answer customers from shared Gmail inboxes. A team lead wants each team's **median first-reply time**.",
      "",
      "A thread's **opening message** is its earliest message; its **first reply** is the earliest later message sent by **someone other than the opener** (follow-ups from the opener do not count). The reply time is `TIMESTAMPDIFF(MINUTE, opening, first reply)`. Considering only threads that received a reply, return `team`, `replied_threads` and `median_reply_minutes` — the middle reply time, or the average of the two middle ones when the count is even. Teams with no replied thread are left out. Order by `team`.",
    ].join("\n"),
    tables: [
      {
        name: "SupportThread",
        columns: [
          { name: "thread_id", type: "int" },
          { name: "team", type: "varchar" },
        ],
        primaryKey: ["thread_id"],
        note: "One customer conversation and the team whose inbox it landed in.",
      },
      {
        name: "ThreadMessage",
        columns: [
          { name: "message_id", type: "int" },
          { name: "thread_id", type: "int" },
          { name: "sender", type: "varchar" },
          { name: "sent_at", type: "datetime" },
        ],
        primaryKey: ["message_id"],
        note: "One email in a thread. No two messages of a thread share a `sent_at`; message ids are not in time order.",
      },
    ],
    examples: [
      {
        SupportThread: [
          [1, "Workspace Billing"],
          [2, "Workspace Billing"],
          [3, "Workspace Billing"],
          [4, "Workspace Billing"],
          [5, "Account Recovery"],
          [6, "Account Recovery"],
        ],
        ThreadMessage: [
          [17, 1, "asha@zentrix.io", "2025-06-02 10:00:00"],
          [12, 1, "asha@zentrix.io", "2025-06-02 10:20:00"],
          [15, 1, "agent.ravi", "2025-06-02 10:45:30"],
          [11, 2, "kabir@quillpad.in", "2025-06-02 09:00:00"],
          [14, 2, "agent.meera", "2025-06-02 09:10:00"],
          [13, 3, "zara@tiffinly.co", "2025-06-02 08:00:00"],
          [16, 3, "agent.ravi", "2025-06-02 10:00:00"],
          [18, 4, "dev@ledgerly.com", "2025-06-02 11:00:00"],
          [21, 5, "neha@gmail.com", "2025-06-03 12:00:00"],
          [24, 5, "agent.tanvi", "2025-06-03 12:30:00"],
          [22, 5, "agent.dev", "2025-06-03 12:35:00"],
          [23, 6, "rohan@gmail.com", "2025-06-03 13:00:00"],
          [20, 6, "agent.tanvi", "2025-06-03 13:50:00"],
        ],
      },
    ],
    gen: (rng) => {
      const teams = ["Workspace Billing", "Account Recovery", "Play Developer Support"];
      const nt = ri(rng, 1, 9);
      const threads: Cell[][] = seq(1, nt).map((id) => [id, pick(rng, teams)]);
      const msgs: Cell[][] = [];
      for (const t of seq(1, nt)) {
        const customer = `${pick(rng, ["asha", "kabir", "zara", "neha", "rohan"])}@gmail.com`;
        let at0 = at(dateBetween(rng, "2025-06-01", "2025-06-05"), ri(rng, 8, 18), ri(rng, 0, 59), pick(rng, [0, 30]));
        for (let j = ri(rng, 1, 5), first = true; j > 0; j--, first = false) {
          msgs.push([0, t, first || chance(rng, 0.3) ? customer : pick(rng, ["agent.ravi", "agent.meera", "agent.tanvi"]), at0]);
          at0 = addSecs(at0, pick(rng, [10, 30, 45, 60, 90, 120, 240]) * 60 + pick(rng, [0, 30]));
        }
      }
      shuffle(rng, msgs).forEach((m, i) => (m[0] = i + 1));
      return { SupportThread: threads, ThreadMessage: msgs };
    },
    solution: [
      "WITH ordered AS (",
      "  SELECT thread_id, sender, sent_at,",
      "         ROW_NUMBER() OVER (PARTITION BY thread_id ORDER BY sent_at) AS rn",
      "  FROM ThreadMessage",
      "), opening AS (",
      "  SELECT thread_id, sender, sent_at FROM ordered WHERE rn = 1",
      "), replies AS (",
      "  SELECT o.thread_id,",
      "         TIMESTAMPDIFF(MINUTE, o.sent_at, MIN(m.sent_at)) AS mins",
      "  FROM opening o",
      "  JOIN ThreadMessage m",
      "    ON m.thread_id = o.thread_id AND m.sent_at > o.sent_at AND m.sender <> o.sender",
      "  GROUP BY o.thread_id, o.sent_at",
      "), ranked AS (",
      "  SELECT t.team, r.mins,",
      "         ROW_NUMBER() OVER (PARTITION BY t.team ORDER BY r.mins) AS pos,",
      "         COUNT(*) OVER (PARTITION BY t.team) AS cnt",
      "  FROM replies r",
      "  JOIN SupportThread t ON t.thread_id = r.thread_id",
      ")",
      "SELECT team, MAX(cnt) AS replied_threads, AVG(mins) AS median_reply_minutes",
      "FROM ranked",
      "WHERE pos IN (FLOOR((cnt + 1) / 2), FLOOR((cnt + 2) / 2))",
      "GROUP BY team",
      "ORDER BY team",
    ].join("\n"),
    alternatives: [
      "WITH opening AS (SELECT m.thread_id, m.sender, m.sent_at FROM ThreadMessage m WHERE NOT EXISTS (SELECT 1 FROM ThreadMessage e WHERE e.thread_id = m.thread_id AND e.sent_at < m.sent_at)), replies AS (SELECT t.team, TIMESTAMPDIFF(MINUTE, o.sent_at, (SELECT MIN(r.sent_at) FROM ThreadMessage r WHERE r.thread_id = o.thread_id AND r.sent_at > o.sent_at AND r.sender <> o.sender)) AS mins FROM opening o JOIN SupportThread t ON t.thread_id = o.thread_id), done AS (SELECT team, mins FROM replies WHERE mins IS NOT NULL) SELECT x.team, (SELECT COUNT(*) FROM done c WHERE c.team = x.team) AS replied_threads, AVG(DISTINCT x.mins) AS median_reply_minutes FROM done x WHERE 2 * (SELECT COUNT(*) FROM done y WHERE y.team = x.team AND y.mins <= x.mins) >= (SELECT COUNT(*) FROM done c WHERE c.team = x.team) AND 2 * (SELECT COUNT(*) FROM done y WHERE y.team = x.team AND y.mins >= x.mins) >= (SELECT COUNT(*) FROM done c WHERE c.team = x.team) GROUP BY x.team ORDER BY x.team",
    ],
    ordered: true,
    hints: [
      "First find each thread's opening message — the earliest by `sent_at`.",
      "The first reply is the MIN `sent_at` among later messages whose sender differs from the opener's.",
      "Threads without such a message have no reply time and must not enter the median.",
      "For a median, number each team's reply times in order and average the middle one or two positions.",
    ],
    editorial: [
      "Three steps. **Opening message:** `ROW_NUMBER()` by `sent_at` per thread marks the earliest message; its sender is the opener. Message ids are deliberately out of order, so ordering by id would pick the wrong opener.",
      "",
      "**First reply:** join the opening to the thread's later messages from a *different* sender and take `MIN(sent_at)`. The opener's own follow-ups fail the sender test, so a customer who writes twice before anyone answers does not count as a reply. An inner join drops threads nobody answered, which keeps them out of the median. `TIMESTAMPDIFF(MINUTE, …)` gives whole minutes.",
      "",
      "**Median:** number each team's reply times in ascending order with a count of the team's rows alongside. The middle positions are `FLOOR((cnt + 1) / 2)` and `FLOOR((cnt + 2) / 2)` — the same position when `cnt` is odd, the two middle ones when it is even — and `AVG` over the selected rows is the median either way. Ties in reply times do not matter, because positions are unique.",
      "",
      "The alternative avoids windows: the opener via NOT EXISTS, the reply via a correlated MIN, and the median as the values with at least half the team at or below and at least half at or above, averaged with `AVG(DISTINCT …)` (duplicates of a middle value must not be weighted twice).",
    ].join("\n"),
  },

  {
    slug: "google-search-experiment-lift-without-contaminated-users",
    title: "Google: Search Experiment Lift Without Contaminated Users",
    difficulty: "HARD",
    topics: ["Subqueries", "Aggregation", "Conditional Logic", "Joins"],
    description: [
      "A Search experiment splits users into a `control` arm and treatment arms. A logging bug put some users in **more than one** arm; they are **contaminated** and must be dropped from every arm. A user can also have duplicate rows for the same arm — then only their **earliest** `assigned_at` counts.",
      "",
      "A clean user **converted** if they have at least one conversion at or after their assignment time. For each arm with at least one clean user, return `arm`, `users`, `converters`, `conversion_pct` = 100 × converters ÷ users **rounded to 2 decimals**, and `lift_pts` = the arm's `conversion_pct` minus the control arm's `conversion_pct` (**rounded to 2 decimals**; NULL for the control arm itself and whenever control has no clean users). Order by `arm`.",
    ].join("\n"),
    tables: [
      {
        name: "ExperimentAssignment",
        columns: [
          { name: "assignment_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "arm", type: "enum", values: ["control", "treatment_a", "treatment_b"] },
          { name: "assigned_at", type: "datetime" },
        ],
        primaryKey: ["assignment_id"],
        note: "One assignment log row; a user may appear more than once.",
      },
      {
        name: "SearchConversion",
        columns: [
          { name: "conversion_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "converted_at", type: "datetime" },
        ],
        primaryKey: ["conversion_id"],
        note: "One conversion event (for example a sign-up started from a search); a user may convert several times.",
      },
    ],
    examples: [
      {
        ExperimentAssignment: [
          [1, 1, "control", "2025-06-01 10:00:00"],
          [2, 2, "control", "2025-06-01 11:00:00"],
          [3, 3, "control", "2025-06-02 09:00:00"],
          [4, 4, "treatment_a", "2025-06-01 09:00:00"],
          [5, 5, "treatment_a", "2025-06-01 12:00:00"],
          [6, 6, "treatment_a", "2025-06-02 12:00:00"],
          [7, 6, "control", "2025-06-03 12:00:00"],
          [8, 7, "treatment_b", "2025-06-01 15:00:00"],
          [9, 8, "treatment_b", "2025-06-02 09:00:00"],
          [10, 8, "treatment_b", "2025-06-04 09:00:00"],
        ],
        SearchConversion: [
          [1, 1, "2025-06-05 10:00:00"],
          [2, 2, "2025-05-30 18:00:00"],
          [3, 4, "2025-06-01 09:00:00"],
          [4, 5, "2025-06-03 12:00:00"],
          [5, 5, "2025-06-04 12:00:00"],
          [6, 6, "2025-06-05 09:00:00"],
          [7, 8, "2025-06-03 09:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const arms = ["control", "treatment_a", "treatment_b"];
      const slot = (from: string, to: string) => at(dateBetween(rng, from, to), pick(rng, [9, 12, 15]), 0);
      const assigns: Cell[][] = [];
      const first = new Map<number, string>();
      const nu = ri(rng, 3, 18);
      for (const u of seq(1, nu)) {
        const arm = pick(rng, arms);
        const t = slot("2025-06-01", "2025-06-05");
        first.set(u, t);
        assigns.push([0, u, arm, t]);
        if (chance(rng, 0.15)) assigns.push([0, u, pick(rng, arms.filter((a) => a !== arm)), slot("2025-06-01", "2025-06-07")]);
        else if (chance(rng, 0.12)) assigns.push([0, u, arm, addSecs(t, 86400 * ri(rng, 1, 3))]);
      }
      shuffle(rng, assigns).forEach((a, i) => (a[0] = i + 1));
      const convs: Cell[][] = seq(1, ri(rng, 0, 14)).map((id) => {
        const u = ri(rng, 1, nu);
        return [id, u, chance(rng, 0.2) ? first.get(u)! : slot("2025-05-29", "2025-06-10")];
      });
      return { ExperimentAssignment: assigns, SearchConversion: convs };
    },
    solution: [
      "WITH clean AS (",
      "  SELECT user_id, MIN(arm) AS arm, MIN(assigned_at) AS assigned_at",
      "  FROM ExperimentAssignment",
      "  GROUP BY user_id",
      "  HAVING COUNT(DISTINCT arm) = 1",
      "), flagged AS (",
      "  SELECT c.arm, c.user_id,",
      "         CASE WHEN EXISTS (SELECT 1 FROM SearchConversion s",
      "                           WHERE s.user_id = c.user_id AND s.converted_at >= c.assigned_at)",
      "              THEN 1 ELSE 0 END AS converted",
      "  FROM clean c",
      "), arms AS (",
      "  SELECT arm, COUNT(*) AS users, SUM(converted) AS converters,",
      "         ROUND(100 * SUM(converted) / COUNT(*), 2) AS conversion_pct",
      "  FROM flagged",
      "  GROUP BY arm",
      ")",
      "SELECT a.arm, a.users, a.converters, a.conversion_pct,",
      "       CASE WHEN a.arm = 'control' THEN NULL",
      "            ELSE ROUND(a.conversion_pct - (SELECT conversion_pct FROM arms WHERE arm = 'control'), 2)",
      "       END AS lift_pts",
      "FROM arms a",
      "ORDER BY a.arm",
    ].join("\n"),
    alternatives: [
      "WITH firsts AS (SELECT user_id, MIN(arm) AS arm, MAX(arm) AS other_arm, MIN(assigned_at) AS assigned_at FROM ExperimentAssignment GROUP BY user_id), arms AS (SELECT f.arm, COUNT(DISTINCT f.user_id) AS users, COUNT(DISTINCT s.user_id) AS converters FROM firsts f LEFT JOIN SearchConversion s ON s.user_id = f.user_id AND s.converted_at >= f.assigned_at WHERE f.arm = f.other_arm GROUP BY f.arm), pct AS (SELECT arm, users, converters, ROUND(100 * converters / users, 2) AS conversion_pct FROM arms) SELECT p.arm, p.users, p.converters, p.conversion_pct, IF(p.arm = 'control', NULL, ROUND(p.conversion_pct - ctl.conversion_pct, 2)) AS lift_pts FROM pct p LEFT JOIN pct ctl ON ctl.arm = 'control' ORDER BY p.arm",
    ],
    ordered: true,
    hints: [
      "Reduce the assignment log to one row per user first; a user whose rows name more than one arm is out.",
      "For a clean user, the earliest `assigned_at` is the one that counts.",
      "Count converters per user, not per conversion — EXISTS or COUNT(DISTINCT user_id).",
      "The control arm's rate can be read with a scalar subquery or a join to the control row.",
    ],
    editorial: [
      "The assignment log has to be cleaned **per user** before any arm is measured. Grouping it by `user_id` and keeping `COUNT(DISTINCT arm) = 1` drops every contaminated user from every arm at once — filtering per arm would wrongly keep them in each. For the survivors `MIN(arm)` is their one arm and `MIN(assigned_at)` their earliest assignment, which handles duplicate rows.",
      "",
      "A user converted if *some* conversion happened at or after that time; `EXISTS` asks exactly that and counts a user once however many times they converted, and a conversion before assignment (organic, not caused by the experiment) is ignored. Grouping the flagged users by arm gives users, converters and the rounded rate.",
      "",
      "Lift is a comparison across rows: each arm's rate minus control's. A scalar subquery reads control's rate; if control has no clean users it returns NULL and the difference is NULL, as required. The alternative cleans with `MIN(arm) = MAX(arm)`, counts converters with `COUNT(DISTINCT s.user_id)` over a LEFT JOIN, and reads control by joining the control row. Both are a few grouped scans.",
    ].join("\n"),
  },
];
