import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, chance, dateBetween, pick, ri, roundTo, sample, shuffle } from "./kit.js";

/**
 * Company set: Hotstar (JioHotstar / Disney+ Hotstar). The questions a data
 * analyst or data engineer on a live-streaming platform built around cricket
 * is asked — concurrent viewers per over and per minute, ad breaks and the
 * impressions sold into them, stream quality by CDN and device, commentary
 * feeds in many languages, plans and their devices, password sharing, next-day
 * viewing of regional serials, watchlists and paywall attribution.
 *
 * Every schema, name and number here is invented for practice: none of it is
 * Hotstar's real data or its real internal tables. Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
const pad = (n: number) => String(n).padStart(2, "0");
/** 'YYYY-MM-DD HH:MM:00' from a date and minutes after midnight (may run into the next day). */
const at = (date: string, minutes: number): string => {
  const d = addDays(date, Math.floor(minutes / 1440));
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${d} ${pad(Math.floor(m / 60))}:${pad(m % 60)}:00`;
};

const TEAMS = [
  "Mumbai Mariners", "Chennai Chargers", "Delhi Dynamos", "Kolkata Knights",
  "Bengaluru Blasters", "Hyderabad Hawks", "Punjab Panthers", "Jaipur Jaguars",
] as const;
const CDNS = ["EdgeNorth", "EdgeSouth", "MetroCache", "SkyRelay", "Origin"] as const;
const DEVICES = ["mobile", "tv", "web", "tablet"] as const;
const LANGUAGES = ["Hindi", "English", "Tamil", "Telugu", "Kannada", "Bengali", "Marathi"] as const;
const CITY_LIST = ["Mumbai", "Delhi", "Bengaluru", "Chennai", "Kolkata", "Pune", "Lucknow", "Indore"] as const;
const ADVERTISERS = ["Zing Cola", "Velocity Bikes", "Spark Fantasy", "NovaPay", "Crunchy Bites", "BrightHome Paints", "Tez Tyres"] as const;
const SERIALS = [
  ["Pyaar Ki Patang", "Hindi"], ["Neer Kolam", "Tamil"], ["Gharkul Diaries", "Marathi"], ["Ranga Mahal", "Kannada"],
  ["Ammayi Kathalu", "Telugu"], ["Sindoor Ki Saugandh", "Hindi"], ["Jol Phoring", "Bengali"],
] as const;
const PLATFORMS = ["android", "ios", "tizen", "webos", "web", "firetv"] as const;

/** Two different teams as "A vs B". */
const fixture = (rng: () => number): [string, string] => {
  const [a, b] = sample(rng, TEAMS, 2);
  return [a!, b!];
};

export const COMPANY_HOTSTAR: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "hotstar-death-over-ad-breaks-running-long",
    title: "Hotstar: Death-Over Ad Breaks Running Long",
    difficulty: "EASY",
    topics: ["Basics"],
    description: [
      "The live production desk at Hotstar worries that ad breaks late in a T20 innings run into the next delivery. Every break between overs is logged with its length in seconds; a break the director cut short by hand has `duration_secs` NULL.",
      "",
      "Return every break taken after an over **from 16 to 20 inclusive** (the death overs) whose `duration_secs` is **more than 90**. Return `break_id`, `match_id`, `innings` and `over_no`, ordered by `match_id`, then `innings`, then `over_no`, then `break_id`.",
    ].join("\n"),
    tables: [
      {
        name: "AdBreak",
        columns: [
          { name: "break_id", type: "int" },
          { name: "match_id", type: "int" },
          { name: "innings", type: "int" },
          { name: "over_no", type: "int" },
          { name: "duration_secs", type: "int" },
        ],
        primaryKey: ["break_id"],
        note: "One row per ad break, taken at the end of over `over_no` (1–20) of innings 1 or 2. `duration_secs` is NULL when the break was cut by hand and not timed.",
      },
    ],
    examples: [
      {
        AdBreak: [
          [1, 101, 1, 15, 120],
          [2, 101, 1, 16, 95],
          [3, 101, 1, 18, 90],
          [4, 101, 2, 20, null],
          [5, 102, 2, 17, 130],
          [6, 102, 1, 19, 60],
          [7, 102, 1, 16, 91],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 22);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 101, 104),
        ri(rng, 1, 2),
        chance(rng, 0.3) ? pick(rng, [15, 16, 20]) : ri(rng, 1, 20),
        chance(rng, 0.12) ? null : chance(rng, 0.25) ? pick(rng, [90, 91]) : roundTo(rng, 30, 180, 5),
      ]);
      return { AdBreak: rows };
    },
    solution: [
      "SELECT break_id, match_id, innings, over_no",
      "FROM AdBreak",
      "WHERE over_no BETWEEN 16 AND 20",
      "  AND duration_secs > 90",
      "ORDER BY match_id, innings, over_no, break_id",
    ].join("\n"),
    alternatives: [
      "SELECT break_id, match_id, innings, over_no FROM AdBreak WHERE over_no >= 16 AND over_no <= 20 AND duration_secs >= 91 AND duration_secs IS NOT NULL ORDER BY match_id, innings, over_no, break_id",
    ],
    ordered: true,
    hints: [
      "Both conditions must hold, so join them with AND.",
      "\"From 16 to 20 inclusive\" is exactly what `BETWEEN 16 AND 20` means.",
      "A NULL duration is not more than 90 — the comparison is unknown, and WHERE keeps only true rows.",
    ],
    editorial: [
      "This is a filter on one table: a break either belongs on the desk's list or it does not, and nothing is counted. Two conditions must hold at once — the over is one of the death overs, and the break ran longer than 90 seconds — so they are joined with `AND`.",
      "",
      "`over_no BETWEEN 16 AND 20` keeps both end overs, which is what \"inclusive\" asks for; a break after the 15th over is not a death-over break. The length test is strict: a break of exactly 90 seconds fits the slot and stays off the list.",
      "",
      "Breaks the director cut by hand have `duration_secs` NULL. `NULL > 90` is neither true nor false, and `WHERE` keeps only rows where the condition is true, so they drop out without an explicit `IS NOT NULL` (the alternative spells it out anyway, and writes the bounds with `>=`/`<=`). The statement fixes the order, so the query ends with an `ORDER BY` over all four keys. It is a single scan of the table.",
    ].join("\n"),
  },

  {
    slug: "hotstar-commentary-languages-live-per-match",
    title: "Hotstar: Commentary Languages Live on Each Match",
    difficulty: "EASY",
    topics: ["Aggregation", "Strings", "Joins"],
    description: [
      "Hotstar streams a match with several commentary feeds, one per language. The programming team wants a one-line summary per match of the languages that actually went on air; a feed that was scheduled but never went live has `went_live` = 0, and a feed that crashed and was restarted appears twice.",
      "",
      "For every match with **at least one feed that went live**, return `title`, `languages` — the distinct live languages in **alphabetical order**, separated by a comma and a space — and `language_count`, the number of distinct live languages. Matches with no live feed are left out. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "LiveMatch",
        columns: [
          { name: "match_id", type: "int" },
          { name: "title", type: "varchar" },
        ],
        primaryKey: ["match_id"],
        note: "One row per streamed match.",
      },
      {
        name: "CommentaryFeed",
        columns: [
          { name: "feed_id", type: "int" },
          { name: "match_id", type: "int" },
          { name: "language", type: "varchar" },
          { name: "went_live", type: "bool" },
        ],
        primaryKey: ["feed_id"],
        note: "One row per commentary feed started for a match. A restarted feed is a new row with the same language.",
      },
    ],
    examples: [
      {
        LiveMatch: [
          [1, "Mumbai Mariners vs Chennai Chargers"],
          [2, "Delhi Dynamos vs Kolkata Knights"],
          [3, "Bengaluru Blasters vs Hyderabad Hawks"],
        ],
        CommentaryFeed: [
          [1, 1, "Hindi", 1],
          [2, 1, "English", 1],
          [3, 1, "Tamil", 1],
          [4, 1, "Hindi", 1],
          [5, 2, "English", 1],
          [6, 2, "Bengali", 0],
          [7, 2, "Kannada", 1],
          [8, 3, "Telugu", 0],
        ],
      },
    ],
    gen: (rng) => {
      const m = ri(rng, 1, 5);
      const matches: Cell[][] = seq(1, m).map((id) => {
        const [a, b] = fixture(rng);
        return [id, `${a} vs ${b}`];
      });
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 18);
      const feeds: Cell[][] = seq(1, n).map((id) => [id, ri(rng, 1, m), pick(rng, LANGUAGES), chance(rng, 0.8) ? 1 : 0]);
      return { LiveMatch: matches, CommentaryFeed: feeds };
    },
    solution: [
      "SELECT m.title,",
      "       GROUP_CONCAT(DISTINCT f.language ORDER BY f.language SEPARATOR ', ') AS languages,",
      "       COUNT(DISTINCT f.language) AS language_count",
      "FROM LiveMatch m",
      "JOIN CommentaryFeed f ON f.match_id = m.match_id",
      "WHERE f.went_live = 1",
      "GROUP BY m.match_id, m.title",
    ].join("\n"),
    alternatives: [
      [
        "SELECT m.title, GROUP_CONCAT(f.language ORDER BY f.language SEPARATOR ', ') AS languages, COUNT(*) AS language_count",
        "FROM LiveMatch m",
        "JOIN (SELECT DISTINCT match_id, language FROM CommentaryFeed WHERE went_live = 1) f ON f.match_id = m.match_id",
        "GROUP BY m.match_id, m.title",
      ].join("\n"),
    ],
    hints: [
      "Throw away the feeds that never went live before you group anything.",
      "A restarted feed repeats its language — each language should be listed and counted once.",
      "`GROUP_CONCAT` takes `DISTINCT`, an `ORDER BY` and a `SEPARATOR` inside its parentheses.",
    ],
    editorial: [
      "Each output row summarises one match, so the query groups the live feeds by match. The filter `went_live = 1` runs in `WHERE`, before grouping, so a scheduled-but-dead feed never reaches a group; and because the join is an inner join, a match whose feeds all stayed dark forms no group at all and is left out as asked.",
      "",
      "The trap is the restarted feed: Hindi appears twice for the first match. `GROUP_CONCAT(DISTINCT f.language ORDER BY f.language SEPARATOR ', ')` lists each language once, alphabetically, with the separator the statement asks for, and `COUNT(DISTINCT f.language)` counts each once too — a plain `COUNT(*)` would say 4.",
      "",
      "The alternative removes the duplicates first, in a derived table of distinct `(match_id, language)` pairs, after which a plain `GROUP_CONCAT` and `COUNT(*)` are already right. Group by `match_id` as well as the title so two matches with the same teams would stay apart. The cost is one pass over the feeds plus a small sort per match.",
    ].join("\n"),
  },

  {
    slug: "hotstar-plans-with-no-active-subscriber",
    title: "Hotstar: Plans With No Active Subscriber",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "Before a pricing review, Hotstar's subscriptions team wants to know which plans in the catalogue nobody is currently paying for. A plan with only cancelled or expired subscriptions counts as having no active subscriber, and so does a plan nobody ever bought.",
      "",
      "Return `plan_name` and `monthly_price` of every plan with **no subscription whose status is `active`**. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Plan",
        columns: [
          { name: "plan_id", type: "int" },
          { name: "plan_name", type: "varchar" },
          { name: "monthly_price", type: "int" },
          { name: "device_limit", type: "int" },
        ],
        primaryKey: ["plan_id"],
        note: "One row per plan on sale. `monthly_price` is in rupees.",
      },
      {
        name: "Subscription",
        columns: [
          { name: "sub_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "plan_id", type: "int" },
          { name: "status", type: "enum", values: ["active", "cancelled", "expired"] },
        ],
        primaryKey: ["sub_id"],
        note: "One row per subscription a user has taken. `plan_id` always names a plan.",
      },
    ],
    examples: [
      {
        Plan: [
          [1, "Mobile", 149, 1],
          [2, "Super", 299, 2],
          [3, "Premium", 499, 4],
          [4, "Sports Pass", 199, 1],
          [5, "Ad-Free Premium", 599, 4],
        ],
        Subscription: [
          [1, 11, 1, "active"],
          [2, 12, 2, "cancelled"],
          [3, 13, 3, "active"],
          [4, 14, 2, "expired"],
          [5, 15, 4, "active"],
          [6, 16, 1, "expired"],
        ],
      },
    ],
    gen: (rng) => {
      const names = ["Mobile", "Super", "Premium", "Sports Pass", "Ad-Free Premium", "Family Max"];
      const k = ri(rng, 1, names.length);
      const plans: Cell[][] = seq(1, k).map((id) => [id, names[id - 1]!, roundTo(rng, 99, 699, 50) - 1, ri(rng, 1, 4)]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 15);
      const subs: Cell[][] = seq(1, n).map((id) => [id, ri(rng, 10, 40), ri(rng, 1, k), pick(rng, ["active", "active", "cancelled", "expired"])]);
      return { Plan: plans, Subscription: subs };
    },
    solution: [
      "SELECT p.plan_name, p.monthly_price",
      "FROM Plan p",
      "WHERE NOT EXISTS (",
      "  SELECT 1 FROM Subscription s",
      "  WHERE s.plan_id = p.plan_id AND s.status = 'active'",
      ")",
    ].join("\n"),
    alternatives: [
      "SELECT p.plan_name, p.monthly_price FROM Plan p LEFT JOIN Subscription s ON s.plan_id = p.plan_id AND s.status = 'active' WHERE s.sub_id IS NULL",
      "SELECT plan_name, monthly_price FROM Plan WHERE plan_id NOT IN (SELECT plan_id FROM Subscription WHERE status = 'active')",
    ],
    hints: [
      "You want plans for which a matching row does *not* exist — an anti join.",
      "Only active subscriptions matter, so the status test belongs inside the lookup, not outside it.",
      "With a LEFT JOIN, put the status condition in the ON clause; in WHERE it would turn the join back into an inner one.",
    ],
    editorial: [
      "The question is about absence: a plan qualifies when no active subscription points at it. That is an **anti join**, and `NOT EXISTS` says it directly — for each plan, look for one active subscription on it, and keep the plan if the lookup finds nothing. A plan with only cancelled or expired rows finds nothing (the status test is inside the subquery), and a plan nobody ever bought finds nothing either, so both are returned.",
      "",
      "The `LEFT JOIN` version keeps every plan and attaches its active subscriptions; plans with none get NULLs and are picked out with `s.sub_id IS NULL`. Where the status test goes matters: in the `ON` clause it limits what is attached, while in `WHERE` it would discard exactly the NULL rows you are looking for.",
      "",
      "`NOT IN` works here because `plan_id` is never NULL in `Subscription`; with a NULL in the list, `NOT IN` returns no rows at all, which is why `NOT EXISTS` is the safer habit. Each approach is one pass over the plans with an index lookup into subscriptions.",
    ].join("\n"),
  },

  {
    slug: "hotstar-buffering-share-of-watch-time-by-cdn",
    title: "Hotstar: Buffering Share of Watch Time by CDN",
    difficulty: "EASY",
    topics: ["Aggregation"],
    description: [
      "Hotstar spreads a big match across several content delivery networks, and the video-quality team ranks them by how much of the viewing time was spent staring at a spinner. Some player builds fail to report buffering, leaving `buffer_secs` NULL; those sessions are **left out entirely** — from the session count and from both sums.",
      "",
      "For every CDN with at least one reported session, return `cdn`, `sessions` (reported sessions) and `buffer_pct` = 100 × total `buffer_secs` ÷ total `watch_secs`, **rounded to 2 decimal places**. Order by `buffer_pct` descending, then `cdn` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "PlaybackSession",
        columns: [
          { name: "session_id", type: "int" },
          { name: "cdn", type: "varchar" },
          { name: "device_type", type: "varchar" },
          { name: "watch_secs", type: "int" },
          { name: "buffer_secs", type: "int" },
        ],
        primaryKey: ["session_id"],
        note: "One row per playback session. `watch_secs` is always at least 60; `buffer_secs` is NULL when the player did not report it.",
      },
    ],
    examples: [
      {
        PlaybackSession: [
          [1, "EdgeNorth", "mobile", 1200, 30],
          [2, "EdgeNorth", "tv", 600, 15],
          [3, "SkyRelay", "mobile", 900, 90],
          [4, "SkyRelay", "web", 300, null],
          [5, "MetroCache", "tv", 1500, 0],
          [6, "MetroCache", "mobile", 500, 20],
          [7, "EdgeSouth", "tablet", 1000, 10],
          [8, "Origin", "web", 700, null],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 20);
      const cdns = sample(rng, CDNS, ri(rng, 1, CDNS.length));
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        pick(rng, cdns),
        pick(rng, DEVICES),
        roundTo(rng, 60, 3600, 60),
        chance(rng, 0.15) ? null : chance(rng, 0.15) ? 0 : ri(rng, 1, 240),
      ]);
      return { PlaybackSession: rows };
    },
    solution: [
      "SELECT cdn,",
      "       COUNT(*) AS sessions,",
      "       ROUND(100 * SUM(buffer_secs) / SUM(watch_secs), 2) AS buffer_pct",
      "FROM PlaybackSession",
      "WHERE buffer_secs IS NOT NULL",
      "GROUP BY cdn",
      "ORDER BY buffer_pct DESC, cdn",
    ].join("\n"),
    alternatives: [
      [
        "SELECT cdn, COUNT(buffer_secs) AS sessions,",
        "       ROUND(SUM(buffer_secs) * 100 / SUM(CASE WHEN buffer_secs IS NOT NULL THEN watch_secs END), 2) AS buffer_pct",
        "FROM PlaybackSession",
        "GROUP BY cdn",
        "HAVING COUNT(buffer_secs) > 0",
        "ORDER BY buffer_pct DESC, cdn",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Remove the unreported sessions first, so they touch neither the count nor the sums.",
      "The share is a ratio of two sums, not the average of each session's own ratio.",
      "Order by the rounded column, then break ties on the CDN name.",
    ],
    editorial: [
      "The buffering share of a CDN is **total buffering time over total watch time** — a ratio of sums. Averaging each session's own percentage would weight a two-minute session as heavily as a two-hour one, which is not what the team is measuring.",
      "",
      "Sessions with `buffer_secs` NULL must vanish completely. Filtering them in `WHERE` does that in one place: they are not counted in `sessions` and their watch time does not dilute the denominator. (Simply relying on `SUM` skipping NULLs would still add their `watch_secs` to the denominator and their row to `COUNT(*)`.) A CDN whose every session was unreported forms no group and is not listed.",
      "",
      "The alternative keeps every row and makes each aggregate ignore the unreported sessions itself: `COUNT(buffer_secs)` counts non-NULLs, and the denominator only adds `watch_secs` where buffering was reported; `HAVING` drops CDNs left with nothing. Multiplying by 100 before dividing keeps the arithmetic exact, and the final order is by the rounded value, then the name for ties. One scan and a small sort.",
    ].join("\n"),
  },

  {
    slug: "hotstar-next-day-views-of-regional-serials",
    title: "Hotstar: Next-Day Views of Regional Serials",
    difficulty: "EASY",
    topics: ["Joins", "Dates", "Aggregation"],
    description: [
      "Regional TV serials air on the broadcast channel in the evening and land on Hotstar the same night; the content team tracks how many people catch up **the day after** an episode aired, a sign the show is pulling viewers back to the app.",
      "",
      "For **every serial** in `Episode`, return `serial_name` and `next_day_views`: the number of views of its episodes made on the calendar day right after that episode's `aired_on` date. Views on the airing day itself or two or more days later do not count. A serial with no next-day views is listed with 0. Order by `serial_name`.",
    ].join("\n"),
    tables: [
      {
        name: "Episode",
        columns: [
          { name: "episode_id", type: "int" },
          { name: "serial_name", type: "varchar" },
          { name: "language", type: "varchar" },
          { name: "aired_on", type: "date" },
        ],
        primaryKey: ["episode_id"],
        note: "One row per episode. A serial has many episodes; `serial_name` identifies the serial.",
      },
      {
        name: "EpisodeView",
        columns: [
          { name: "view_id", type: "int" },
          { name: "episode_id", type: "int" },
          { name: "profile_id", type: "int" },
          { name: "viewed_on", type: "date" },
        ],
        primaryKey: ["view_id"],
        note: "One row per play of an episode on the app. A profile can view the same episode more than once; each play counts.",
      },
    ],
    examples: [
      {
        Episode: [
          [1, "Pyaar Ki Patang", "Hindi", "2025-03-03"],
          [2, "Pyaar Ki Patang", "Hindi", "2025-03-04"],
          [3, "Neer Kolam", "Tamil", "2025-03-03"],
          [4, "Gharkul Diaries", "Marathi", "2025-02-28"],
        ],
        EpisodeView: [
          [1, 1, 501, "2025-03-04"],
          [2, 1, 502, "2025-03-03"],
          [3, 2, 501, "2025-03-05"],
          [4, 2, 503, "2025-03-07"],
          [5, 3, 504, "2025-03-05"],
          [6, 1, 503, "2025-03-04"],
          [7, 4, 505, "2025-03-01"],
        ],
      },
    ],
    gen: (rng) => {
      const serials = sample(rng, SERIALS, ri(rng, 1, 5));
      const ne = ri(rng, 1, 8);
      const eps: Cell[][] = seq(1, ne).map((id) => {
        const [name, lang] = pick(rng, serials);
        return [id, name, lang, dateBetween(rng, "2025-02-25", "2025-03-05")];
      });
      const nv = chance(rng, 0.08) ? 0 : ri(rng, 1, 20);
      const views: Cell[][] = seq(1, nv).map((id) => {
        const ep = pick(rng, eps);
        return [id, ep[0]!, ri(rng, 500, 512), addDays(ep[3] as string, pick(rng, [0, 1, 1, 1, 2, 3]))];
      });
      return { Episode: eps, EpisodeView: views };
    },
    solution: [
      "SELECT e.serial_name, COUNT(v.view_id) AS next_day_views",
      "FROM Episode e",
      "LEFT JOIN EpisodeView v",
      "  ON v.episode_id = e.episode_id",
      " AND v.viewed_on = DATE_ADD(e.aired_on, INTERVAL 1 DAY)",
      "GROUP BY e.serial_name",
      "ORDER BY e.serial_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT e.serial_name, SUM(CASE WHEN DATEDIFF(v.viewed_on, e.aired_on) = 1 THEN 1 ELSE 0 END) AS next_day_views",
        "FROM Episode e LEFT JOIN EpisodeView v ON v.episode_id = e.episode_id",
        "GROUP BY e.serial_name",
        "ORDER BY e.serial_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Each view must be compared with the airing date of its own episode, so join views to episodes.",
      "\"The day after\" is `DATE_ADD(aired_on, INTERVAL 1 DAY)` — it handles the end of a month for you.",
      "Serials with no qualifying views must still appear with 0, so keep every episode with a LEFT JOIN and count a column of the view table.",
    ],
    editorial: [
      "A view counts when its date is exactly one day after its episode's airing date. The comparison needs both rows side by side, so the query joins `EpisodeView` to `Episode` and tests `viewed_on = DATE_ADD(aired_on, INTERVAL 1 DAY)`. Date arithmetic rather than \"day number + 1\" matters at a month boundary: an episode aired on 28 February is caught up on 1 March.",
      "",
      "Every serial must appear, even with no next-day views. A `LEFT JOIN` keeps each episode, and putting the date test **in the ON clause** attaches only qualifying views — episodes with none get a NULL view. `COUNT(v.view_id)` counts non-NULL views, so those serials come out as 0. Putting the date test in `WHERE` instead would delete the NULL rows and lose those serials.",
      "",
      "The alternative joins every view and counts conditionally with `DATEDIFF(...) = 1` inside a `SUM(CASE …)`; unmatched episodes contribute a NULL `DATEDIFF`, which falls to the `ELSE 0`. Results are grouped by serial name and ordered by it. One pass over episodes with an index lookup into views.",
    ].join("\n"),
  },

  {
    slug: "hotstar-watchlist-titles-never-played",
    title: "Hotstar: Watchlist Titles the Profile Never Played",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "Hotstar's personalisation team sends a nudge for titles a profile saved to its watchlist but has never started. A play of the same title by **another** profile on the account does not count — the question is per profile.",
      "",
      "Return `profile_id` and `title_name` for every watchlist entry whose profile has **no play of that title at any time** (before or after adding it). Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Title",
        columns: [
          { name: "title_id", type: "int" },
          { name: "title_name", type: "varchar" },
        ],
        primaryKey: ["title_id"],
        note: "One row per movie, series or show in the catalogue.",
      },
      {
        name: "Watchlist",
        columns: [
          { name: "profile_id", type: "int" },
          { name: "title_id", type: "int" },
          { name: "added_on", type: "date" },
        ],
        primaryKey: ["profile_id", "title_id"],
        note: "One row per title a profile saved to its watchlist.",
      },
      {
        name: "Play",
        columns: [
          { name: "play_id", type: "int" },
          { name: "profile_id", type: "int" },
          { name: "title_id", type: "int" },
          { name: "played_at", type: "datetime" },
        ],
        primaryKey: ["play_id"],
        note: "One row per time a profile pressed play on a title.",
      },
    ],
    examples: [
      {
        Title: [
          [1, "Midnight at Marine Drive"],
          [2, "The Spin Doctors"],
          [3, "Monsoon Mehfil"],
          [4, "Desert Rally"],
        ],
        Watchlist: [
          [201, 1, "2025-01-05"],
          [201, 2, "2025-01-06"],
          [202, 2, "2025-01-07"],
          [202, 3, "2025-01-07"],
          [203, 4, "2025-01-09"],
        ],
        Play: [
          [1, 201, 1, "2025-01-08 21:10:00"],
          [2, 202, 2, "2025-01-03 20:00:00"],
          [3, 201, 3, "2025-01-10 22:30:00"],
          [4, 203, 1, "2025-01-11 19:45:00"],
        ],
      },
    ],
    gen: (rng) => {
      const titles: Cell[][] = seq(1, 6).map((id) => [id, ["Midnight at Marine Drive", "The Spin Doctors", "Monsoon Mehfil", "Desert Rally", "Second Innings", "Kitchen Kings"][id - 1]!]);
      const profiles = seq(201, ri(rng, 1, 5));
      const pairs = shuffle(rng, profiles.flatMap((p) => seq(1, 6).map((t) => [p, t] as const))).slice(0, chance(rng, 0.05) ? 0 : ri(rng, 1, 14));
      const wl: Cell[][] = pairs.map(([p, t]) => [p, t, dateBetween(rng, "2025-01-01", "2025-01-20")]);
      const np = ri(rng, 0, 14);
      const plays: Cell[][] = seq(1, np).map((id) => {
        const [p, t] = pairs.length && chance(rng, 0.6) ? pick(rng, pairs) : [pick(rng, profiles), ri(rng, 1, 6)];
        return [id, p, t, `${dateBetween(rng, "2024-12-25", "2025-01-25")} 2${ri(rng, 0, 3)}:${pad(ri(rng, 0, 59))}:00`];
      });
      return { Title: titles, Watchlist: wl, Play: plays };
    },
    solution: [
      "SELECT w.profile_id, t.title_name",
      "FROM Watchlist w",
      "JOIN Title t ON t.title_id = w.title_id",
      "WHERE NOT EXISTS (",
      "  SELECT 1 FROM Play p",
      "  WHERE p.profile_id = w.profile_id AND p.title_id = w.title_id",
      ")",
    ].join("\n"),
    alternatives: [
      [
        "SELECT w.profile_id, t.title_name",
        "FROM Watchlist w",
        "JOIN Title t ON t.title_id = w.title_id",
        "LEFT JOIN Play p ON p.profile_id = w.profile_id AND p.title_id = w.title_id",
        "WHERE p.play_id IS NULL",
      ].join("\n"),
    ],
    hints: [
      "Look for watchlist rows for which a matching play does not exist.",
      "A play matches only when **both** the profile and the title are the same.",
      "The play's date does not matter — any play at all rules the entry out.",
    ],
    editorial: [
      "Each watchlist row asks one question: has this profile ever played this title? That is an anti join on a **two-column key**. `NOT EXISTS` with both `p.profile_id = w.profile_id` and `p.title_id = w.title_id` in the subquery answers it exactly; a play by another profile matches on the title only and therefore does not rule the entry out, which is the trap in the first example: profile 201 played title 3, but that does not clear profile 202's watchlist entry for it.",
      "",
      "No date condition is needed: the statement says any play at any time counts, so a play before `added_on` still removes the entry. The `Title` join only supplies the name.",
      "",
      "The alternative is the `LEFT JOIN … IS NULL` form of the same anti join; it would duplicate rows if it were not filtered to the NULL side, but rows with a match are discarded entirely, so each surviving watchlist entry appears once. With an index on `Play(profile_id, title_id)` either form is a lookup per watchlist row.",
    ].join("\n"),
  },

  {
    slug: "hotstar-matches-crossing-two-crore-concurrent",
    title: "Hotstar: Matches That Crossed Two Crore Concurrent Viewers",
    difficulty: "EASY",
    topics: ["Aggregation", "Joins"],
    description: [
      "Hotstar's live-ops dashboard samples concurrent viewers at the end of every over. For the season review, the analytics team lists the matches whose concurrency **peaked at two crore (20,000,000) or more**.",
      "",
      "Return `match_id`, `home_team`, `away_team` and `peak_viewers` (the highest sampled concurrency of the match) for every such match. Matches with no samples are not listed. Order by `peak_viewers` descending, then `match_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Fixture",
        columns: [
          { name: "match_id", type: "int" },
          { name: "home_team", type: "varchar" },
          { name: "away_team", type: "varchar" },
        ],
        primaryKey: ["match_id"],
        note: "One row per match of the league.",
      },
      {
        name: "OverSnapshot",
        columns: [
          { name: "match_id", type: "int" },
          { name: "innings", type: "int" },
          { name: "over_no", type: "int" },
          { name: "viewers", type: "bigint" },
        ],
        primaryKey: ["match_id", "innings", "over_no"],
        note: "Concurrent viewers sampled at the end of over `over_no` of an innings.",
      },
    ],
    examples: [
      {
        Fixture: [
          [1, "Mumbai Mariners", "Chennai Chargers"],
          [2, "Delhi Dynamos", "Kolkata Knights"],
          [3, "Bengaluru Blasters", "Hyderabad Hawks"],
          [4, "Punjab Panthers", "Jaipur Jaguars"],
        ],
        OverSnapshot: [
          [1, 1, 10, 18500000],
          [1, 2, 18, 24300000],
          [1, 2, 20, 23900000],
          [2, 1, 20, 12000000],
          [2, 2, 19, 19999999],
          [3, 1, 6, 15000000],
          [3, 2, 20, 20000000],
        ],
      },
    ],
    gen: (rng) => {
      const m = ri(rng, 1, 6);
      const fixtures: Cell[][] = seq(1, m).map((id) => [id, ...fixture(rng)]);
      const rows: Cell[][] = [];
      for (const [id] of fixtures) {
        if (chance(rng, 0.15)) continue;
        const base = ri(rng, 80, 260) * 100000;
        for (const inn of [1, 2]) {
          for (const over of sample(rng, seq(1, 20), ri(rng, 1, 4))) {
            const v = chance(rng, 0.1) ? 20000000 : base + ri(rng, -30, 30) * 100000;
            rows.push([id!, inn, over, v]);
          }
        }
      }
      return { Fixture: fixtures, OverSnapshot: rows };
    },
    solution: [
      "SELECT f.match_id, f.home_team, f.away_team, MAX(s.viewers) AS peak_viewers",
      "FROM Fixture f",
      "JOIN OverSnapshot s ON s.match_id = f.match_id",
      "GROUP BY f.match_id, f.home_team, f.away_team",
      "HAVING MAX(s.viewers) >= 20000000",
      "ORDER BY peak_viewers DESC, f.match_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT f.match_id, f.home_team, f.away_team, p.peak_viewers",
        "FROM Fixture f",
        "JOIN (SELECT match_id, MAX(viewers) AS peak_viewers FROM OverSnapshot GROUP BY match_id) p ON p.match_id = f.match_id",
        "WHERE p.peak_viewers >= 20000000",
        "ORDER BY p.peak_viewers DESC, f.match_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The peak of a match is the largest of its samples — one aggregate per match.",
      "A condition on an aggregate goes in HAVING, not WHERE.",
      "\"Or more\" keeps a match that peaked at exactly 20,000,000.",
    ],
    editorial: [
      "Each match has many samples and the question is about the largest one, so group the snapshots by match and take `MAX(viewers)`. The threshold is a condition on that aggregate, which is what `HAVING` is for: `WHERE viewers >= 20000000` would instead keep individual samples, and while it happens to select the same matches here, it would break the moment you wanted another aggregate of the match (say, its average) in the same row.",
      "",
      "The boundary is inclusive — a match peaking at exactly two crore is listed, one at 19,999,999 is not. Writing the threshold as `20000000` rather than `2e7` keeps the comparison in integers.",
      "",
      "The inner join drops fixtures with no samples. The alternative computes each match's peak in a derived table first and filters it with `WHERE`. The order is by peak descending, ties broken by `match_id`. Both read the snapshots once.",
    ].join("\n"),
  },

  {
    slug: "hotstar-playback-errors-by-app-platform",
    title: "Hotstar: Playback Errors by App Platform",
    difficulty: "EASY",
    topics: ["Strings", "Aggregation"],
    description: [
      "Every playback error the Hotstar apps report carries a client string of the form `platform/app_version/device_model`, for example `android/14.2.1/SM-S918B`. The player team wants errors grouped by **platform** — the part before the first `/`. Errors whose client string is NULL (the report was truncated) are ignored.",
      "",
      "Return `platform`, `errors` (the number of errors) and `error_codes` (the number of distinct `error_code` values) for every platform. Order by `errors` descending, then `platform` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "PlaybackError",
        columns: [
          { name: "error_id", type: "int" },
          { name: "client", type: "varchar" },
          { name: "error_code", type: "varchar" },
          { name: "logged_at", type: "datetime" },
        ],
        primaryKey: ["error_id"],
        note: "One row per error report. Platform names are always lower case; `client` is NULL when the report was cut off.",
      },
    ],
    examples: [
      {
        PlaybackError: [
          [1, "android/14.2.1/SM-S918B", "PL-1002", "2025-04-12 19:31:05"],
          [2, "android/14.1.0/RMX3741", "PL-1002", "2025-04-12 19:32:40"],
          [3, "ios/14.2.0/iPhone15,2", "DRM-301", "2025-04-12 19:35:12"],
          [4, "tizen/7.0.3/UA55CU8000", "PL-2210", "2025-04-12 19:40:00"],
          [5, null, "PL-1002", "2025-04-12 19:41:18"],
          [6, "android/14.2.1/CPH2581", "NET-504", "2025-04-12 19:44:51"],
          [7, "ios/14.1.9/iPad13,4", "DRM-301", "2025-04-12 19:50:02"],
          [8, "tizen/7.0.1/UA43T5400", "PL-1002", "2025-04-12 19:52:30"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 22);
      const plats = sample(rng, PLATFORMS, ri(rng, 1, PLATFORMS.length));
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        chance(rng, 0.1) ? null : `${pick(rng, plats)}/${ri(rng, 13, 14)}.${ri(rng, 0, 3)}.${ri(rng, 0, 9)}/${pick(rng, ["SM-S918B", "RMX3741", "CPH2581", "UA55CU8000", "AFTMM", "OLED55C3"])}`,
        pick(rng, ["PL-1002", "PL-2210", "DRM-301", "NET-504", "NET-408"]),
        `2025-04-12 ${ri(rng, 18, 23)}:${pad(ri(rng, 0, 59))}:${pad(ri(rng, 0, 59))}`,
      ]);
      return { PlaybackError: rows };
    },
    solution: [
      "SELECT SUBSTRING_INDEX(client, '/', 1) AS platform,",
      "       COUNT(*) AS errors,",
      "       COUNT(DISTINCT error_code) AS error_codes",
      "FROM PlaybackError",
      "WHERE client IS NOT NULL",
      "GROUP BY platform",
      "ORDER BY errors DESC, platform",
    ].join("\n"),
    alternatives: [
      [
        "SELECT platform, COUNT(*) AS errors, COUNT(DISTINCT error_code) AS error_codes",
        "FROM (SELECT LEFT(client, LOCATE('/', client) - 1) AS platform, error_code FROM PlaybackError WHERE client IS NOT NULL) e",
        "GROUP BY platform",
        "ORDER BY errors DESC, platform",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The platform is the text before the first `/` — `SUBSTRING_INDEX(s, '/', 1)` returns exactly that.",
      "Group by the extracted platform, not by the whole client string, which includes the version and device.",
      "Drop the NULL client strings before grouping, or they form a NULL platform of their own.",
    ],
    editorial: [
      "The grouping key is not a column but a piece of one: the platform is everything before the first slash. `SUBSTRING_INDEX(client, '/', 1)` returns the text before the first occurrence of the delimiter, so `android/14.2.1/SM-S918B` becomes `android`. Grouping by that expression (through its alias) puts every Android build and device together.",
      "",
      "Two counts per group: `COUNT(*)` for the errors and `COUNT(DISTINCT error_code)` for how many different failure types the platform showed. Rows with a NULL client would produce a NULL platform and a group of their own, so they are filtered out in `WHERE` first.",
      "",
      "The alternative finds the slash with `LOCATE` and keeps the characters to its left with `LEFT(client, position - 1)`, computing it in a derived table so the outer query groups by a plain column. The statement fixes the order — most errors first, ties by platform name. One scan of the table plus a small sort.",
    ].join("\n"),
  },

  // ──────────────────────────── MEDIUM ────────────────────────────
  {
    slug: "hotstar-advertisers-owed-make-good-impressions",
    title: "Hotstar: Advertisers Owed Make-Good Impressions",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Subqueries"],
    description: [
      "Advertisers buy a number of impressions in a match's ad breaks; the ad server logs what it actually delivered, in several partial rows per booking (one per break the spot ran in). When an advertiser's total delivery across all its bookings falls **below 95% of what it booked**, Hotstar's ad-sales team owes it make-good impressions in a later match.",
      "",
      "Return `advertiser`, `booked` (total booked impressions), `delivered` (total delivered; a booking with no log rows delivered 0) and `shortfall` = `booked` − `delivered`, for every advertiser whose `delivered` is **strictly less than 95%** of `booked`. Order by `shortfall` descending, then `advertiser` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "AdBooking",
        columns: [
          { name: "booking_id", type: "int" },
          { name: "advertiser", type: "varchar" },
          { name: "match_id", type: "int" },
          { name: "booked_impressions", type: "int" },
        ],
        primaryKey: ["booking_id"],
        note: "One row per impressions deal for one match. An advertiser can book several matches.",
      },
      {
        name: "DeliveryLog",
        columns: [
          { name: "log_id", type: "int" },
          { name: "booking_id", type: "int" },
          { name: "delivered", type: "int" },
        ],
        primaryKey: ["log_id"],
        note: "Impressions delivered for a booking in one ad break. A booking can have many rows or none.",
      },
    ],
    examples: [
      {
        AdBooking: [
          [1, "Zing Cola", 501, 1000000],
          [2, "Zing Cola", 502, 500000],
          [3, "NovaPay", 501, 800000],
          [4, "Spark Fantasy", 502, 400000],
          [5, "Crunchy Bites", 501, 200000],
        ],
        DeliveryLog: [
          [1, 1, 500000],
          [2, 1, 400000],
          [3, 2, 470000],
          [4, 3, 760000],
          [5, 4, 300000],
          [6, 4, 50000],
        ],
      },
    ],
    gen: (rng) => {
      const advs = sample(rng, ADVERTISERS, ri(rng, 1, 5));
      const nb = ri(rng, 1, 9);
      const bookings: Cell[][] = seq(1, nb).map((id) => [id, pick(rng, advs), ri(rng, 501, 504), roundTo(rng, 100000, 1000000, 20000)]);
      const logs: Cell[][] = [];
      let lid = 1;
      for (const b of bookings) {
        if (chance(rng, 0.15)) continue;
        const booked = b[3] as number;
        const target = chance(rng, 0.2) ? booked * 0.95 : Math.round(booked * (0.75 + rng() * 0.35));
        const parts = ri(rng, 1, 3);
        let left = Math.round(target);
        for (let k = 0; k < parts; k++) {
          const v = k === parts - 1 ? left : Math.floor(left / (parts - k));
          logs.push([lid++, b[0]!, v]);
          left -= v;
        }
      }
      return { AdBooking: bookings, DeliveryLog: logs };
    },
    solution: [
      "WITH per_booking AS (",
      "  SELECT booking_id, SUM(delivered) AS delivered",
      "  FROM DeliveryLog",
      "  GROUP BY booking_id",
      "),",
      "per_advertiser AS (",
      "  SELECT b.advertiser,",
      "         SUM(b.booked_impressions) AS booked,",
      "         SUM(COALESCE(d.delivered, 0)) AS delivered",
      "  FROM AdBooking b",
      "  LEFT JOIN per_booking d ON d.booking_id = b.booking_id",
      "  GROUP BY b.advertiser",
      ")",
      "SELECT advertiser, booked, delivered, booked - delivered AS shortfall",
      "FROM per_advertiser",
      "WHERE delivered * 100 < booked * 95",
      "ORDER BY shortfall DESC, advertiser",
    ].join("\n"),
    alternatives: [
      [
        "SELECT advertiser, booked, delivered, booked - delivered AS shortfall",
        "FROM (",
        "  SELECT b.advertiser,",
        "         SUM(b.booked_impressions) AS booked,",
        "         COALESCE((SELECT SUM(l.delivered) FROM DeliveryLog l JOIN AdBooking x ON x.booking_id = l.booking_id WHERE x.advertiser = b.advertiser), 0) AS delivered",
        "  FROM AdBooking b",
        "  GROUP BY b.advertiser",
        ") t",
        "WHERE delivered < 0.95 * booked",
        "ORDER BY shortfall DESC, advertiser",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Joining bookings straight to the log repeats a booking once per log row — its booked impressions would be added several times.",
      "Add up the deliveries per booking first, then join that one row per booking to the bookings.",
      "A booking with no log row delivered nothing: turn its NULL into 0 before summing.",
      "Compare in integers — `delivered * 100 < booked * 95` — and note that exactly 95% is not owed anything.",
    ],
    editorial: [
      "Two tables at different grains meet here: a booking is one row, its deliveries are many. Joining them directly and summing would **fan out** the booking — Zing Cola's one-million booking has two log rows, so its booked impressions would be counted twice. The fix is to bring both sides to the same grain before joining: collapse `DeliveryLog` to one row per booking (`per_booking`), then join that to `AdBooking` with a `LEFT JOIN` so bookings without any log row survive with a NULL that `COALESCE` turns into 0 (Crunchy Bites delivered nothing and owes the most).",
      "",
      "Grouping by advertiser then gives booked and delivered totals, and the make-good test is `delivered * 100 < booked * 95`, kept in integers so nothing is lost to rounding. It is strict: NovaPay at exactly 95% is not owed. Over-delivery simply never qualifies.",
      "",
      "The alternative avoids the fan-out differently: it sums bookings per advertiser on their own and fetches the advertiser's total delivery with a correlated subquery over the log joined to that advertiser's bookings. Both read each table once per advertiser at most; the CTE version is the one that scales.",
    ].join("\n"),
  },

  {
    slug: "hotstar-commentary-language-split-per-match",
    title: "Hotstar: Commentary Language Split per Match",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Aggregation"],
    description: [
      "Hotstar decides how many commentary teams to staff for a language by how many people chose that feed. Each row of `FeedView` is a viewer tuning in to a match in a language; viewers reconnect, so the same viewer, match and language can appear many times, and a viewer can try several languages.",
      "",
      "For every match, return `match_id`, `hindi_viewers` and `english_viewers` (distinct viewers who tuned in to that language), `regional_viewers` (distinct viewers who tuned in to **any other** language), and `total_viewers` (distinct viewers of the match in any language). A viewer counts once in every bucket they touched, and once in the total. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "FeedView",
        columns: [
          { name: "view_id", type: "int" },
          { name: "match_id", type: "int" },
          { name: "viewer_id", type: "int" },
          { name: "language", type: "varchar" },
        ],
        primaryKey: ["view_id"],
        note: "One row per time a viewer tuned in to a commentary feed. Language names are spelled consistently (`Hindi`, `English`, `Tamil`, …).",
      },
    ],
    examples: [
      {
        FeedView: [
          [1, 11, 301, "Hindi"],
          [2, 11, 301, "Hindi"],
          [3, 11, 302, "English"],
          [4, 11, 303, "Tamil"],
          [5, 11, 303, "Telugu"],
          [6, 11, 304, "Hindi"],
          [7, 11, 304, "Kannada"],
          [8, 12, 301, "English"],
          [9, 12, 305, "Bengali"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 25);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 11, 13),
        ri(rng, 301, 308),
        chance(rng, 0.6) ? pick(rng, ["Hindi", "English"]) : pick(rng, LANGUAGES),
      ]);
      return { FeedView: rows };
    },
    solution: [
      "SELECT match_id,",
      "       COUNT(DISTINCT CASE WHEN language = 'Hindi' THEN viewer_id END) AS hindi_viewers,",
      "       COUNT(DISTINCT CASE WHEN language = 'English' THEN viewer_id END) AS english_viewers,",
      "       COUNT(DISTINCT CASE WHEN language NOT IN ('Hindi', 'English') THEN viewer_id END) AS regional_viewers,",
      "       COUNT(DISTINCT viewer_id) AS total_viewers",
      "FROM FeedView",
      "GROUP BY match_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT b.match_id,",
        "       SUM(b.bucket = 'hindi') AS hindi_viewers,",
        "       SUM(b.bucket = 'english') AS english_viewers,",
        "       SUM(b.bucket = 'regional') AS regional_viewers,",
        "       (SELECT COUNT(DISTINCT viewer_id) FROM FeedView f WHERE f.match_id = b.match_id) AS total_viewers",
        "FROM (",
        "  SELECT DISTINCT match_id, viewer_id,",
        "         CASE WHEN language = 'Hindi' THEN 'hindi' WHEN language = 'English' THEN 'english' ELSE 'regional' END AS bucket",
        "  FROM FeedView",
        ") b",
        "GROUP BY b.match_id",
      ].join("\n"),
    ],
    hints: [
      "Reconnections repeat rows, so every count must be of distinct viewers.",
      "A `CASE` that yields the viewer id only for the language you want — and NULL otherwise — can sit inside `COUNT(DISTINCT …)`.",
      "A viewer who tried Tamil and Telugu is one regional viewer, not two.",
      "The total is not the sum of the buckets: someone who tried Hindi and Kannada is in two buckets but one person.",
    ],
    editorial: [
      "This is a pivot: one row per match with a column per language bucket. **Conditional aggregation** builds it in one pass — `CASE WHEN language = 'Hindi' THEN viewer_id END` is the viewer id on Hindi rows and NULL elsewhere, and `COUNT(DISTINCT …)` over it counts distinct Hindi viewers, ignoring the NULLs. The regional bucket uses `NOT IN ('Hindi', 'English')`, so a viewer who tried both Tamil and Telugu still produces one distinct id there.",
      "",
      "`DISTINCT` is doing the real work: reconnections repeat (match, viewer, language), and without it viewer 301's two Hindi rows would count twice. The total is a separate `COUNT(DISTINCT viewer_id)`, not the sum of the buckets — viewer 304 is in both the Hindi and the regional bucket but is one person.",
      "",
      "The alternative first reduces the data to distinct (match, viewer, bucket) triples; after that each bucket is a plain `SUM` of a boolean, and the total comes from a correlated subquery because the triples can list a viewer twice. The single-pass version reads the table once.",
    ].join("\n"),
  },

  {
    slug: "hotstar-biggest-over-on-over-viewer-jump",
    title: "Hotstar: Biggest Over-on-Over Jump in Viewers",
    difficulty: "MEDIUM",
    topics: ["Window Functions"],
    description: [
      "The social team at Hotstar wants to know which moment of each match pulled the most people in. Concurrency is sampled at the end of overs (not every over is sampled), in order of innings and then over; the **jump** at a sample is its viewers minus the viewers at the **previous sample of the same match** — across the innings break too. A match's first sample has no jump.",
      "",
      "For every match with at least two samples, return the sample with the **largest jump** as `match_id`, `innings`, `over_no` and `jump`. The largest jump can be negative if a match only lost viewers. If several samples share the largest jump, return the **earliest** (lowest innings, then lowest over). Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "OverSnapshot",
        columns: [
          { name: "match_id", type: "int" },
          { name: "innings", type: "int" },
          { name: "over_no", type: "int" },
          { name: "viewers", type: "bigint" },
        ],
        primaryKey: ["match_id", "innings", "over_no"],
        note: "Concurrent viewers sampled at the end of over `over_no` (1–20) of innings 1 or 2.",
      },
    ],
    examples: [
      {
        OverSnapshot: [
          [1, 1, 5, 9000000],
          [1, 1, 10, 11500000],
          [1, 2, 1, 12000000],
          [1, 2, 18, 14500000],
          [2, 1, 6, 7000000],
          [2, 1, 20, 6500000],
          [2, 2, 5, 6000000],
          [3, 1, 1, 5000000],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 4);
      for (let id = 1; id <= m; id++) {
        let v = ri(rng, 40, 120) * 100000;
        const keys = [1, 2].flatMap((inn) => sample(rng, seq(1, 20), ri(rng, 0, 4)).sort((a, b) => a - b).map((o) => [inn, o] as const));
        const steps = [5, 5, 10, -5, 25, 25];
        for (const [inn, o] of keys) {
          rows.push([id, inn, o, v]);
          v = Math.max(100000, v + (chance(rng, 0.3) ? pick(rng, steps) : ri(rng, -20, 30)) * 100000);
        }
      }
      return { OverSnapshot: rows };
    },
    solution: [
      "WITH jumps AS (",
      "  SELECT match_id, innings, over_no,",
      "         viewers - LAG(viewers) OVER (PARTITION BY match_id ORDER BY innings, over_no) AS jump",
      "  FROM OverSnapshot",
      "),",
      "ranked AS (",
      "  SELECT match_id, innings, over_no, jump,",
      "         ROW_NUMBER() OVER (PARTITION BY match_id ORDER BY jump DESC, innings, over_no) AS rn",
      "  FROM jumps",
      "  WHERE jump IS NOT NULL",
      ")",
      "SELECT match_id, innings, over_no, jump",
      "FROM ranked",
      "WHERE rn = 1",
    ].join("\n"),
    alternatives: [
      [
        "WITH k AS (",
        "  SELECT match_id, innings, over_no, viewers, innings * 100 + over_no AS pos FROM OverSnapshot",
        "),",
        "j AS (",
        "  SELECT c.match_id, c.innings, c.over_no, c.pos, c.viewers - p.viewers AS jump",
        "  FROM k c",
        "  JOIN k p ON p.match_id = c.match_id",
        "         AND p.pos = (SELECT MAX(q.pos) FROM k q WHERE q.match_id = c.match_id AND q.pos < c.pos)",
        ")",
        "SELECT match_id, innings, over_no, jump",
        "FROM j",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM j b",
        "  WHERE b.match_id = j.match_id AND (b.jump > j.jump OR (b.jump = j.jump AND b.pos < j.pos))",
        ")",
      ].join("\n"),
    ],
    hints: [
      "`LAG(viewers)` over the match's samples, ordered by innings then over, gives the previous sample's viewers.",
      "Partition by match only — the innings break must not reset the comparison.",
      "The first sample of each match has no previous value; drop its NULL jump before ranking.",
      "Rank the jumps per match with the tie-break written into the window's ORDER BY.",
    ],
    editorial: [
      "Two window steps. First, `LAG(viewers) OVER (PARTITION BY match_id ORDER BY innings, over_no)` puts the previous sample's viewers beside each sample, and the difference is the jump. Partitioning by match alone, and ordering by innings *then* over, makes the first sample of the second innings compare with the last sample of the first — the chase starting is often the biggest moment. Missing overs do not matter: the previous *sample* is what counts.",
      "",
      "Each match's first sample has a NULL jump and is filtered out, so a match with one sample has nothing left and is not listed. Then `ROW_NUMBER()` per match, ordered by `jump DESC, innings, over_no`, picks exactly one sample — the largest jump, and among equal jumps the earliest, as the statement asks. A match that only lost viewers still has a largest (least negative) jump.",
      "",
      "The alternative does it without windows: a combined position `innings * 100 + over_no` finds the previous sample through a correlated `MAX`, and `NOT EXISTS` keeps the jump that no other sample of the match beats. It is quadratic per match; the window version sorts each match once.",
    ].join("\n"),
  },

  {
    slug: "hotstar-subscribers-who-only-watch-live-sport",
    title: "Hotstar: Subscribers Who Only Ever Watch Live Sport",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation", "Joins"],
    description: [
      "Hotstar's growth team is designing a cheaper sports-only pack and wants to size the audience that would never miss the rest of the catalogue: subscribers who have watched **only live sport** and nothing else.",
      "",
      "Return `user_id`, `plan` and `sport_plays` for every subscriber with **at least 3 plays**, **all** of whose plays have `content_type` = `live_sport`. Subscribers with fewer than 3 plays, or any play of another type, are left out. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Subscriber",
        columns: [
          { name: "user_id", type: "int" },
          { name: "plan", type: "enum", values: ["mobile", "super", "premium"] },
          { name: "joined_on", type: "date" },
        ],
        primaryKey: ["user_id"],
        note: "One row per paying subscriber.",
      },
      {
        name: "Play",
        columns: [
          { name: "play_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "content_type", type: "enum", values: ["live_sport", "sport_highlights", "movie", "serial", "news"] },
        ],
        primaryKey: ["play_id"],
        note: "One row per play. `user_id` always names a subscriber.",
      },
    ],
    examples: [
      {
        Subscriber: [
          [1, "mobile", "2025-03-01"],
          [2, "super", "2025-03-02"],
          [3, "premium", "2025-03-05"],
          [4, "mobile", "2025-03-07"],
        ],
        Play: [
          [1, 1, "live_sport"],
          [2, 1, "live_sport"],
          [3, 1, "live_sport"],
          [4, 2, "live_sport"],
          [5, 2, "live_sport"],
          [6, 2, "live_sport"],
          [7, 2, "sport_highlights"],
          [8, 3, "live_sport"],
          [9, 3, "live_sport"],
          [10, 1, "live_sport"],
        ],
      },
    ],
    gen: (rng) => {
      const ns = ri(rng, 1, 7);
      const subs: Cell[][] = seq(1, ns).map((id) => [id, pick(rng, ["mobile", "super", "premium"]), dateBetween(rng, "2025-03-01", "2025-03-20")]);
      const plays: Cell[][] = [];
      let pid = 1;
      for (const s of subs) {
        const sporty = chance(rng, 0.6);
        const k = ri(rng, 0, 6);
        for (let i = 0; i < k; i++) {
          const type = sporty && !chance(rng, 0.1) ? "live_sport" : pick(rng, ["live_sport", "sport_highlights", "movie", "serial", "news"]);
          plays.push([pid++, s[0]!, type]);
        }
      }
      return { Subscriber: subs, Play: shuffle(rng, plays) };
    },
    solution: [
      "SELECT s.user_id, s.plan, COUNT(*) AS sport_plays",
      "FROM Subscriber s",
      "JOIN Play p ON p.user_id = s.user_id",
      "GROUP BY s.user_id, s.plan",
      "HAVING COUNT(*) >= 3",
      "   AND SUM(CASE WHEN p.content_type <> 'live_sport' THEN 1 ELSE 0 END) = 0",
    ].join("\n"),
    alternatives: [
      [
        "SELECT s.user_id, s.plan,",
        "       (SELECT COUNT(*) FROM Play p WHERE p.user_id = s.user_id) AS sport_plays",
        "FROM Subscriber s",
        "WHERE NOT EXISTS (SELECT 1 FROM Play p WHERE p.user_id = s.user_id AND p.content_type <> 'live_sport')",
        "  AND (SELECT COUNT(*) FROM Play p WHERE p.user_id = s.user_id) >= 3",
      ].join("\n"),
      [
        "SELECT s.user_id, s.plan, COUNT(*) AS sport_plays",
        "FROM Subscriber s JOIN Play p ON p.user_id = s.user_id",
        "GROUP BY s.user_id, s.plan",
        "HAVING COUNT(*) >= 3 AND MIN(p.content_type = 'live_sport') = 1",
      ].join("\n"),
    ],
    hints: [
      "\"Only\" means: no play of any other type exists for the user.",
      "Filtering to live sport in WHERE first would hide the other plays you need to see — check after grouping instead.",
      "Inside HAVING, count the plays that are *not* live sport and require that count to be 0.",
    ],
    editorial: [
      "\"Only live sport\" is a statement about **all** of a user's plays, so it cannot be checked row by row in `WHERE` — filtering to `live_sport` first would hide the movie that disqualifies someone and wrongly keep them. Group each subscriber's plays and test the group: `SUM(CASE WHEN content_type <> 'live_sport' THEN 1 ELSE 0 END) = 0` says no play of another type exists, and `COUNT(*) >= 3` enforces the minimum. Note that sport highlights are not live sport, which is why user 2 is out.",
      "",
      "Because every play in a qualifying group is live sport, `COUNT(*)` is also the number of sport plays to report. Subscribers with no plays never join and are not listed — they would fail the minimum anyway.",
      "",
      "The first alternative states the rule as an anti join — `NOT EXISTS` a non-sport play — plus a correlated count for the minimum. The second uses `MIN(content_type = 'live_sport') = 1`: the boolean is 1 for sport and 0 otherwise, so its minimum is 1 only when every play is sport. All three read the plays once per subscriber.",
    ].join("\n"),
  },

  {
    slug: "hotstar-worst-rebuffering-cdn-and-device-per-city",
    title: "Hotstar: Worst Rebuffering CDN and Device in Each City",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "After a high-traffic match, Hotstar's CDN team looks city by city for the **CDN and device combination** that rebuffered the most, to decide where to shift traffic before the next one.",
      "",
      "For each city, add up `rebuffer_events` per (`cdn`, `device_type`) pair and return the pair or pairs with the **highest total** as `city`, `cdn`, `device_type`, `rebuffer_events`. Return **every** pair tied for the top. A city whose highest total is 0 is not listed. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "StreamQuality",
        columns: [
          { name: "session_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "cdn", type: "varchar" },
          { name: "device_type", type: "varchar" },
          { name: "rebuffer_events", type: "int" },
        ],
        primaryKey: ["session_id"],
        note: "One row per viewing session, with the number of times playback stalled to rebuffer (0 or more).",
      },
    ],
    examples: [
      {
        StreamQuality: [
          [1, "Mumbai", "EdgeNorth", "mobile", 4],
          [2, "Mumbai", "EdgeNorth", "mobile", 3],
          [3, "Mumbai", "SkyRelay", "tv", 7],
          [4, "Mumbai", "SkyRelay", "mobile", 2],
          [5, "Pune", "MetroCache", "web", 5],
          [6, "Pune", "EdgeSouth", "tv", 1],
          [7, "Indore", "EdgeNorth", "tv", 0],
          [8, "Indore", "SkyRelay", "mobile", 0],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 24);
      const cities = sample(rng, CITY_LIST, ri(rng, 1, 4));
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        pick(rng, cities),
        pick(rng, CDNS.slice(0, 3)),
        pick(rng, DEVICES.slice(0, 3)),
        chance(rng, 0.3) ? 0 : ri(rng, 1, 6),
      ]);
      return { StreamQuality: rows };
    },
    solution: [
      "WITH totals AS (",
      "  SELECT city, cdn, device_type, SUM(rebuffer_events) AS rebuffer_events",
      "  FROM StreamQuality",
      "  GROUP BY city, cdn, device_type",
      "),",
      "ranked AS (",
      "  SELECT city, cdn, device_type, rebuffer_events,",
      "         RANK() OVER (PARTITION BY city ORDER BY rebuffer_events DESC) AS rnk",
      "  FROM totals",
      ")",
      "SELECT city, cdn, device_type, rebuffer_events",
      "FROM ranked",
      "WHERE rnk = 1 AND rebuffer_events > 0",
    ].join("\n"),
    alternatives: [
      [
        "WITH totals AS (",
        "  SELECT city, cdn, device_type, SUM(rebuffer_events) AS rebuffer_events",
        "  FROM StreamQuality GROUP BY city, cdn, device_type",
        ")",
        "SELECT t.city, t.cdn, t.device_type, t.rebuffer_events",
        "FROM totals t",
        "JOIN (SELECT city, MAX(rebuffer_events) AS top FROM totals GROUP BY city) m",
        "  ON m.city = t.city AND m.top = t.rebuffer_events",
        "WHERE m.top > 0",
      ].join("\n"),
    ],
    hints: [
      "First aggregate the sessions to one row per (city, cdn, device_type).",
      "Then rank those totals within each city — `RANK()` gives every tied pair the same rank 1.",
      "A city where nothing rebuffered has a top total of 0; filter it out after ranking.",
    ],
    editorial: [
      "The ranking is over **totals**, not sessions, so aggregate first: one row per city, CDN and device with the summed rebuffer events. Then rank those rows inside each city with `RANK() OVER (PARTITION BY city ORDER BY rebuffer_events DESC)`. `RANK` (unlike `ROW_NUMBER`) gives every pair sharing the highest total the rank 1, which is how ties are all returned, as the statement asks.",
      "",
      "A city where no session stalled has a top total of 0 — every pair there would tie at rank 1, but none of them is a problem worth reporting — so the final filter also requires `rebuffer_events > 0`. Indore in the example is dropped this way.",
      "",
      "The alternative computes each city's maximum total in a derived table and joins back to keep the pairs equal to it; ties come out naturally because every pair equal to the maximum matches. Both aggregate the sessions once; the window version avoids the second pass over the totals.",
    ].join("\n"),
  },

  {
    slug: "hotstar-accounts-streaming-from-three-cities-in-a-day",
    title: "Hotstar: Accounts Streaming From Three Cities in a Day",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Dates"],
    description: [
      "Hotstar's trust and safety team flags possible password sharing: a single account that starts streams from **three or more different cities on the same calendar day** is unlikely to be one household. The city comes from an IP lookup; when the lookup fails, `city` is NULL and the stream says nothing about location.",
      "",
      "Return `account_id`, `stream_date` (the calendar date) and `cities` (the number of distinct non-NULL cities that day) for every account and day with **at least 3** distinct cities. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "StreamStart",
        columns: [
          { name: "start_id", type: "int" },
          { name: "account_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "started_at", type: "datetime" },
        ],
        primaryKey: ["start_id"],
        note: "One row per stream started on an account, with the city resolved from its IP address (NULL if unresolved).",
      },
    ],
    examples: [
      {
        StreamStart: [
          [1, 71, "Mumbai", "2025-04-05 09:15:00"],
          [2, 71, "Pune", "2025-04-05 13:40:00"],
          [3, 71, "Delhi", "2025-04-05 22:05:00"],
          [4, 71, "Mumbai", "2025-04-06 00:10:00"],
          [5, 72, "Chennai", "2025-04-05 19:00:00"],
          [6, 72, null, "2025-04-05 19:30:00"],
          [7, 72, "Chennai", "2025-04-05 20:00:00"],
          [8, 72, "Kolkata", "2025-04-05 21:00:00"],
          [9, 73, "Lucknow", "2025-04-06 18:00:00"],
          [10, 73, "Indore", "2025-04-06 19:00:00"],
          [11, 73, "Bengaluru", "2025-04-06 23:59:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 26);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const day = pick(rng, ["2025-04-05", "2025-04-06", "2025-04-07"]);
        return [id, ri(rng, 71, 75), chance(rng, 0.12) ? null : pick(rng, CITY_LIST.slice(0, 5)), at(day, chance(rng, 0.15) ? pick(rng, [0, 1439]) : ri(rng, 0, 1439))];
      });
      return { StreamStart: rows };
    },
    solution: [
      "SELECT account_id, DATE(started_at) AS stream_date, COUNT(DISTINCT city) AS cities",
      "FROM StreamStart",
      "GROUP BY account_id, DATE(started_at)",
      "HAVING COUNT(DISTINCT city) >= 3",
    ].join("\n"),
    alternatives: [
      [
        "SELECT account_id, stream_date, COUNT(*) AS cities",
        "FROM (SELECT DISTINCT account_id, LEFT(started_at, 10) AS stream_date, city FROM StreamStart WHERE city IS NOT NULL) d",
        "GROUP BY account_id, stream_date",
        "HAVING COUNT(*) >= 3",
      ].join("\n"),
    ],
    hints: [
      "The day is the date part of `started_at` — `DATE(started_at)`.",
      "Group by account *and* day; a city repeated in a day must count once.",
      "`COUNT(DISTINCT city)` already ignores NULLs.",
    ],
    editorial: [
      "The unit of the question is an (account, calendar day) pair, so group by the account and by `DATE(started_at)`, which drops the time of day. A stream at 00:10 belongs to the new day: account 71 reaches three cities on 5 April, while its after-midnight Mumbai stream starts a fresh day with just one.",
      "",
      "Within each group, `COUNT(DISTINCT city)` counts different cities — two Chennai streams are one city — and, like every aggregate except `COUNT(*)`, it skips NULLs, so an unresolved lookup neither adds a city nor breaks anything. The threshold is on the aggregate, hence `HAVING … >= 3`. Account 72 has Chennai, a NULL and Kolkata: two cities, not flagged.",
      "",
      "The alternative first builds the distinct (account, day, city) triples — using `LEFT(started_at, 10)` for the date, which works because the stored format is fixed — after which a plain `COUNT(*)` per account and day is the number of cities. One scan plus a group-by either way.",
    ].join("\n"),
  },

  {
    slug: "hotstar-subscriptions-with-no-play-in-first-week",
    title: "Hotstar: Subscriptions With No Play in Their First Week",
    difficulty: "MEDIUM",
    topics: ["Joins", "Dates", "Subqueries"],
    description: [
      "A subscriber who pays and then does not watch anything in the first week is the strongest churn signal Hotstar's lifecycle team has, so it sends them a curated \"start here\" mail. A subscription's **first week** is its `started_on` day and the six days after it; plays before `started_on` (on an earlier subscription, say) do not count.",
      "",
      "Return `sub_id`, `user_id` and `plan` for every subscription whose user has **no play during that subscription's first week**. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Subscription",
        columns: [
          { name: "sub_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "plan", type: "enum", values: ["mobile", "super", "premium"] },
          { name: "started_on", type: "date" },
        ],
        primaryKey: ["sub_id"],
        note: "One row per paid subscription. A user who lapsed and came back has more than one.",
      },
      {
        name: "Play",
        columns: [
          { name: "play_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "played_at", type: "datetime" },
        ],
        primaryKey: ["play_id"],
        note: "One row per play by a user, on any subscription.",
      },
    ],
    examples: [
      {
        Subscription: [
          [1, 41, "mobile", "2025-02-01"],
          [2, 42, "super", "2025-02-03"],
          [3, 43, "premium", "2025-02-05"],
          [4, 41, "super", "2025-03-01"],
          [5, 44, "mobile", "2025-02-10"],
        ],
        Play: [
          [1, 41, "2025-02-07 23:50:00"],
          [2, 42, "2025-02-10 08:00:00"],
          [3, 42, "2025-02-02 21:00:00"],
          [4, 43, "2025-02-05 00:05:00"],
          [5, 41, "2025-03-09 20:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const ns = chance(rng, 0.05) ? 0 : ri(rng, 1, 8);
      const subs: Cell[][] = seq(1, ns).map((id) => [id, ri(rng, 41, 46), pick(rng, ["mobile", "super", "premium"]), dateBetween(rng, "2025-02-01", "2025-03-10")]);
      const np = ri(rng, 0, 12);
      const plays: Cell[][] = seq(1, np).map((id) => {
        if (subs.length && chance(rng, 0.7)) {
          const s = pick(rng, subs);
          return [id, s[1]!, at(addDays(s[3] as string, pick(rng, [-1, 0, 3, 6, 7, 8])), ri(rng, 0, 1439))];
        }
        return [id, ri(rng, 41, 46), at(dateBetween(rng, "2025-02-01", "2025-03-20"), ri(rng, 0, 1439))];
      });
      return { Subscription: subs, Play: plays };
    },
    solution: [
      "SELECT s.sub_id, s.user_id, s.plan",
      "FROM Subscription s",
      "WHERE NOT EXISTS (",
      "  SELECT 1 FROM Play p",
      "  WHERE p.user_id = s.user_id",
      "    AND p.played_at >= s.started_on",
      "    AND p.played_at < DATE_ADD(s.started_on, INTERVAL 7 DAY)",
      ")",
    ].join("\n"),
    alternatives: [
      [
        "SELECT s.sub_id, s.user_id, s.plan",
        "FROM Subscription s",
        "LEFT JOIN Play p ON p.user_id = s.user_id AND DATEDIFF(p.played_at, s.started_on) BETWEEN 0 AND 6",
        "GROUP BY s.sub_id, s.user_id, s.plan",
        "HAVING COUNT(p.play_id) = 0",
      ].join("\n"),
    ],
    hints: [
      "The week is a half-open range: from the start of `started_on` up to, but not including, the start of the seventh day after it.",
      "Plays are datetimes and the start is a date — compare against the next date rather than with `<=` on the last day, or you lose plays late on day seven.",
      "Then it is an anti join: keep subscriptions with no play inside their own window.",
    ],
    editorial: [
      "Each subscription has its own window, `[started_on, started_on + 7 days)`, and the question is whether its user has any play inside it — an anti join with a range condition. `NOT EXISTS` with `played_at >= started_on AND played_at < DATE_ADD(started_on, INTERVAL 7 DAY)` states it exactly. The upper bound is the start of the eighth day, written as `<` on a date: `played_at <= '2025-02-07'` would compare a datetime with midnight of the 7th and miss user 41's play at 23:50 that evening.",
      "",
      "The window is per subscription, so a returning user is judged afresh: user 41 watched in February's first week but not in March's (the March play came on the ninth day), so subscription 4 is flagged while subscription 1 is not. A play before `started_on`, like user 42's on 2 February, belongs to no window.",
      "",
      "The alternative attaches in-window plays with a `LEFT JOIN` (`DATEDIFF(...) BETWEEN 0 AND 6`, which compares calendar days) and keeps groups where none attached. With an index on `Play(user_id, played_at)` the `NOT EXISTS` form is a range probe per subscription.",
    ].join("\n"),
  },

  {
    slug: "hotstar-unsold-ad-slots-by-innings-phase",
    title: "Hotstar: Unsold Ad Slots by Innings Phase",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Aggregation"],
    description: [
      "Ad inventory in a T20 is priced by phase: overs 1–6 are the **Powerplay**, overs 7–15 the **Middle** overs and overs 16–20 the **Death** overs. Hotstar's ad-sales team wants to see where inventory went unsold and what it would have earned at its rate card.",
      "",
      "Return `phase`, `total_slots`, `unsold_slots` and `unsold_value` (the sum of `rate` over unsold slots; 0 when every slot sold) for every phase that has at least one slot. Order the rows by phase in match order: `Powerplay`, then `Middle`, then `Death`.",
    ].join("\n"),
    tables: [
      {
        name: "AdSlot",
        columns: [
          { name: "slot_id", type: "int" },
          { name: "match_id", type: "int" },
          { name: "over_no", type: "int" },
          { name: "sold", type: "bool" },
          { name: "rate", type: "int" },
        ],
        primaryKey: ["slot_id"],
        note: "One 10-second ad slot in the break after over `over_no` (1–20). `rate` is the rate-card price in rupees; `sold` is 1 if a buyer took it.",
      },
    ],
    examples: [
      {
        AdSlot: [
          [1, 9, 3, 1, 180000],
          [2, 9, 6, 0, 180000],
          [3, 9, 7, 0, 120000],
          [4, 9, 12, 0, 120000],
          [5, 9, 15, 1, 120000],
          [6, 9, 16, 1, 250000],
          [7, 9, 20, 1, 250000],
          [8, 10, 1, 1, 180000],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 20);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const over = chance(rng, 0.3) ? pick(rng, [6, 7, 15, 16]) : ri(rng, 1, 20);
        const base = over <= 6 ? 180000 : over <= 15 ? 120000 : 250000;
        return [id, ri(rng, 9, 11), over, chance(rng, 0.65) ? 1 : 0, base + roundTo(rng, -20000, 20000, 10000)];
      });
      return { AdSlot: rows };
    },
    solution: [
      "SELECT phase, COUNT(*) AS total_slots,",
      "       SUM(CASE WHEN sold = 0 THEN 1 ELSE 0 END) AS unsold_slots,",
      "       SUM(CASE WHEN sold = 0 THEN rate ELSE 0 END) AS unsold_value",
      "FROM (",
      "  SELECT sold, rate,",
      "         CASE WHEN over_no <= 6 THEN 'Powerplay' WHEN over_no <= 15 THEN 'Middle' ELSE 'Death' END AS phase,",
      "         CASE WHEN over_no <= 6 THEN 1 WHEN over_no <= 15 THEN 2 ELSE 3 END AS phase_order",
      "  FROM AdSlot",
      ") s",
      "GROUP BY phase, phase_order",
      "ORDER BY phase_order",
    ].join("\n"),
    alternatives: [
      [
        "SELECT IF(over_no <= 6, 'Powerplay', IF(over_no <= 15, 'Middle', 'Death')) AS phase,",
        "       COUNT(*) AS total_slots,",
        "       COUNT(*) - SUM(sold) AS unsold_slots,",
        "       SUM(IF(sold = 1, 0, rate)) AS unsold_value",
        "FROM AdSlot",
        "GROUP BY phase",
        "ORDER BY MIN(over_no)",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Map each over to its phase with a `CASE` on `over_no`; the boundaries are 6 and 15.",
      "Count unsold slots and add up their rate with conditional aggregates — `SUM(CASE WHEN … THEN … ELSE 0 END)`.",
      "Alphabetical order would put Death first; sort by a number that follows the match instead.",
    ],
    editorial: [
      "The grouping key is derived: a `CASE` on `over_no` turns overs 1–6 into `Powerplay`, 7–15 into `Middle` and 16–20 into `Death`. Because a `CASE` takes the first branch that matches, `over_no <= 15` in the second branch only sees overs above 6, so the boundaries 6/7 and 15/16 fall exactly where the rate card puts them.",
      "",
      "Inside each phase, `COUNT(*)` counts the slots, and two conditional aggregates count and price the unsold ones. Writing `ELSE 0` matters for `unsold_value`: without it a phase that sold out would add only NULLs and report NULL instead of 0. Phases with no slots produce no group and are not listed.",
      "",
      "The order is by the match, not the alphabet. The solution carries a `phase_order` number beside the label and sorts by it; the alternative sorts by `MIN(over_no)` of the group, which is just as monotonic, and uses nested `IF` and `COUNT(*) - SUM(sold)` for the same counts. One scan and a three-row sort.",
    ].join("\n"),
  },

  {
    slug: "hotstar-top-two-shows-per-language-by-unique-viewers",
    title: "Hotstar: Top Two Shows per Language by Unique Viewers",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Joins", "Aggregation"],
    description: [
      "Each language home page on Hotstar leads with its most-watched shows. The editorial team measures a show by **unique viewers** (distinct profiles that played it), and wants the top two values per language — with ties, so a third show that ties the second also makes the row.",
      "",
      "Return `language`, `show_name` and `unique_viewers` for every show whose unique-viewer count is among the **two highest distinct counts** of its language. Shows nobody played are never returned. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "TvShow",
        columns: [
          { name: "show_id", type: "int" },
          { name: "show_name", type: "varchar" },
          { name: "language", type: "varchar" },
        ],
        primaryKey: ["show_id"],
        note: "One row per show in the catalogue, in its original language.",
      },
      {
        name: "ShowView",
        columns: [
          { name: "view_id", type: "int" },
          { name: "show_id", type: "int" },
          { name: "profile_id", type: "int" },
        ],
        primaryKey: ["view_id"],
        note: "One row per play of a show; a profile can play a show many times.",
      },
    ],
    examples: [
      {
        TvShow: [
          [1, "Pyaar Ki Patang", "Hindi"],
          [2, "Sindoor Ki Saugandh", "Hindi"],
          [3, "Second Innings", "Hindi"],
          [4, "Kitchen Kings", "Hindi"],
          [5, "Neer Kolam", "Tamil"],
          [6, "Kadal Kaatru", "Tamil"],
        ],
        ShowView: [
          [1, 1, 801], [2, 1, 802], [3, 1, 803], [4, 1, 801],
          [5, 2, 801], [6, 2, 804],
          [7, 3, 805], [8, 3, 806],
          [9, 4, 807],
          [10, 5, 808], [11, 5, 808],
        ],
      },
    ],
    gen: (rng) => {
      const pool = [
        ["Pyaar Ki Patang", "Hindi"], ["Sindoor Ki Saugandh", "Hindi"], ["Second Innings", "Hindi"], ["Kitchen Kings", "Hindi"],
        ["Neer Kolam", "Tamil"], ["Kadal Kaatru", "Tamil"], ["Ammayi Kathalu", "Telugu"], ["Ranga Mahal", "Kannada"], ["Jol Phoring", "Bengali"],
      ] as const;
      const shows: Cell[][] = sample(rng, pool, ri(rng, 2, pool.length)).map(([name, lang], i) => [i + 1, name, lang]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 26);
      const views: Cell[][] = seq(1, n).map((id) => [id, ri(rng, 1, shows.length), ri(rng, 801, 808)]);
      return { TvShow: shows, ShowView: views };
    },
    solution: [
      "WITH reach AS (",
      "  SELECT s.language, s.show_name, COUNT(DISTINCT v.profile_id) AS unique_viewers",
      "  FROM TvShow s",
      "  JOIN ShowView v ON v.show_id = s.show_id",
      "  GROUP BY s.show_id, s.language, s.show_name",
      "),",
      "ranked AS (",
      "  SELECT language, show_name, unique_viewers,",
      "         DENSE_RANK() OVER (PARTITION BY language ORDER BY unique_viewers DESC) AS dr",
      "  FROM reach",
      ")",
      "SELECT language, show_name, unique_viewers",
      "FROM ranked",
      "WHERE dr <= 2",
    ].join("\n"),
    alternatives: [
      [
        "WITH reach AS (",
        "  SELECT s.language, s.show_name, COUNT(DISTINCT v.profile_id) AS unique_viewers",
        "  FROM TvShow s JOIN ShowView v ON v.show_id = s.show_id",
        "  GROUP BY s.show_id, s.language, s.show_name",
        ")",
        "SELECT r.language, r.show_name, r.unique_viewers",
        "FROM reach r",
        "WHERE (SELECT COUNT(DISTINCT o.unique_viewers) FROM reach o",
        "       WHERE o.language = r.language AND o.unique_viewers > r.unique_viewers) < 2",
      ].join("\n"),
    ],
    hints: [
      "Count distinct profiles per show first — repeat plays by one profile count once.",
      "\"The two highest distinct counts\" is exactly what `DENSE_RANK() <= 2` keeps.",
      "Without windows: a show qualifies when fewer than two distinct higher counts exist in its language.",
    ],
    editorial: [
      "Two steps. First the measure: `COUNT(DISTINCT profile_id)` per show, so profile 801's two plays of the first show count once (and the Tamil show watched twice by one profile has one unique viewer). The inner join leaves out shows nobody played, as required.",
      "",
      "Then the cut. The statement asks for the top two *values*, with every show holding them — that is `DENSE_RANK()`, which numbers distinct values 1, 2, 3 with no gaps, so all shows at the highest count get 1 and all shows at the second-highest get 2. `RANK()` would skip to 3 after a tie at the top and drop the second value; `ROW_NUMBER()` would cut ties arbitrarily. In the example, two Hindi shows tie at 2 viewers and both are returned beside the 3-viewer leader.",
      "",
      "The alternative states the same rule as a correlated count: a show qualifies when fewer than two distinct higher counts exist in its language. It is quadratic in shows per language; the window version sorts once.",
    ].join("\n"),
  },

  {
    slug: "hotstar-final-day-paid-signups-by-hour-running-total",
    title: "Hotstar: Final-Day Paid Sign-Ups by Hour With a Running Total",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates", "Aggregation"],
    description: [
      "On the day of a league final, Hotstar's growth team watches paid sign-ups hour by hour to see when the paywall converts. The final in this data is on **2025-05-25**; free sign-ups (plan `free`) are not paid and are left out, as are sign-ups on other days.",
      "",
      "Return `signup_hour` (0–23), `paid_signups` in that hour, and `running_total` (paid sign-ups from the start of the day through that hour) for every hour of 2025-05-25 with at least one paid sign-up, ordered by `signup_hour`.",
    ].join("\n"),
    tables: [
      {
        name: "SignUp",
        columns: [
          { name: "signup_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "plan", type: "enum", values: ["free", "mobile", "super", "premium"] },
          { name: "signed_up_at", type: "datetime" },
        ],
        primaryKey: ["signup_id"],
        note: "One row per new account, with the plan chosen at sign-up. Times are IST.",
      },
    ],
    examples: [
      {
        SignUp: [
          [1, 901, "mobile", "2025-05-24 23:58:00"],
          [2, 902, "super", "2025-05-25 00:03:00"],
          [3, 903, "free", "2025-05-25 18:10:00"],
          [4, 904, "mobile", "2025-05-25 18:45:00"],
          [5, 905, "premium", "2025-05-25 18:59:59"],
          [6, 906, "mobile", "2025-05-25 19:00:00"],
          [7, 907, "super", "2025-05-25 21:30:00"],
          [8, 908, "mobile", "2025-05-26 00:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 25);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const day = chance(rng, 0.8) ? "2025-05-25" : pick(rng, ["2025-05-24", "2025-05-26"]);
        const minute = chance(rng, 0.6) ? ri(rng, 17 * 60, 23 * 60 + 59) : ri(rng, 0, 1439);
        return [id, 900 + id, pick(rng, ["free", "mobile", "mobile", "super", "premium"]), at(day, minute)];
      });
      return { SignUp: rows };
    },
    solution: [
      "SELECT signup_hour, paid_signups,",
      "       SUM(paid_signups) OVER (ORDER BY signup_hour) AS running_total",
      "FROM (",
      "  SELECT HOUR(signed_up_at) AS signup_hour, COUNT(*) AS paid_signups",
      "  FROM SignUp",
      "  WHERE plan <> 'free'",
      "    AND signed_up_at >= '2025-05-25' AND signed_up_at < '2025-05-26'",
      "  GROUP BY HOUR(signed_up_at)",
      ") h",
      "ORDER BY signup_hour",
    ].join("\n"),
    alternatives: [
      [
        "WITH h AS (",
        "  SELECT HOUR(signed_up_at) AS signup_hour, COUNT(*) AS paid_signups",
        "  FROM SignUp",
        "  WHERE plan IN ('mobile', 'super', 'premium') AND DATE(signed_up_at) = '2025-05-25'",
        "  GROUP BY HOUR(signed_up_at)",
        ")",
        "SELECT a.signup_hour, a.paid_signups,",
        "       (SELECT SUM(b.paid_signups) FROM h b WHERE b.signup_hour <= a.signup_hour) AS running_total",
        "FROM h a",
        "ORDER BY a.signup_hour",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Filter first: paid plans only, and only timestamps on 2025-05-25 — a half-open range `>= '2025-05-25' AND < '2025-05-26'` catches the whole day.",
      "`HOUR(signed_up_at)` gives the bucket; group by it.",
      "A running total over the hourly counts is `SUM(...) OVER (ORDER BY signup_hour)`.",
    ],
    editorial: [
      "Three layers. The filter keeps paid plans and the final's date. With datetimes, the safe way to say \"on 2025-05-25\" is the half-open range `>= '2025-05-25' AND < '2025-05-26'`: it keeps 00:03 and 23:59 and excludes the stroke of midnight on the 26th; `DATE(signed_up_at) = '2025-05-25'` (the alternative) is equivalent but cannot use an index on the column.",
      "",
      "Next, `HOUR(signed_up_at)` buckets the rows and `COUNT(*)` gives each hour's sign-ups — 18:59:59 is still hour 18, 19:00 is hour 19. Hours without paid sign-ups simply do not appear, as the statement allows.",
      "",
      "Finally the running total is a window over the **aggregated** rows: `SUM(paid_signups) OVER (ORDER BY signup_hour)` adds every hour up to the current one (hours are unique, so the default range frame is the same as a rows frame). The window must sit outside the `GROUP BY`, in a derived table, because it sums group results. The alternative computes the same cumulative sum with a correlated subquery over the hourly CTE — quadratic in 24 rows, which is nothing.",
    ].join("\n"),
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "hotstar-peak-of-three-sample-smoothed-concurrency",
    title: "Hotstar: Peak of Three-Sample Smoothed Concurrency per Match",
    difficulty: "HARD",
    topics: ["Window Functions"],
    description: [
      "Raw concurrency samples jump around — a wicket, an app refresh, a telemetry glitch — so Hotstar's capacity planners size the next match from a **smoothed** curve. Samples are taken at the end of some overs and ordered by `innings`, then `over_no`. Samples flagged `is_glitch` = 1 are bad readings and are **removed before smoothing**, so they never enter an average.",
      "",
      "The smoothed value at a clean sample is the **average of that sample and the two clean samples before it in the same match** (fewer at the start of a match: the first sample averages itself, the second averages two), **rounded to a whole number** of viewers. For every match with at least one clean sample, return the sample where the rounded smoothed value is highest, as `match_id`, `innings`, `over_no` and `smoothed_viewers`. If several samples share the highest rounded value, return the **earliest** (lowest innings, then lowest over). Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "OverSnapshot",
        columns: [
          { name: "match_id", type: "int" },
          { name: "innings", type: "int" },
          { name: "over_no", type: "int" },
          { name: "viewers", type: "bigint" },
          { name: "is_glitch", type: "bool" },
        ],
        primaryKey: ["match_id", "innings", "over_no"],
        note: "Concurrent viewers sampled at the end of over `over_no` (1–20) of innings 1 or 2. `is_glitch` is 1 when monitoring marked the reading as bad.",
      },
    ],
    examples: [
      {
        OverSnapshot: [
          [1, 1, 2, 8000000, 0],
          [1, 1, 6, 9000000, 0],
          [1, 1, 10, 10000000, 0],
          [1, 1, 15, 60000000, 1],
          [1, 1, 20, 11000000, 0],
          [1, 2, 4, 12000000, 0],
          [1, 2, 10, 9400000, 0],
          [2, 1, 5, 5000000, 0],
          [2, 1, 12, 6000000, 0],
          [2, 2, 3, 7000000, 0],
          [2, 2, 9, 6500000, 0],
          [2, 2, 15, 6000000, 0],
          [3, 1, 8, 40000000, 1],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 4);
      for (let id = 1; id <= m; id++) {
        const keys = [1, 2].flatMap((inn) => sample(rng, seq(1, 20), ri(rng, 0, 5)).sort((a, b) => a - b).map((o) => [inn, o] as const));
        let v = ri(rng, 40, 120);
        for (const [inn, o] of keys) {
          const glitch = chance(rng, 0.12);
          rows.push([id, inn, o, (glitch ? ri(rng, 300, 900) : v) * 100000, glitch ? 1 : 0]);
          if (!glitch) v = Math.max(5, v + (chance(rng, 0.25) ? 0 : ri(rng, -25, 30)));
        }
      }
      return { OverSnapshot: rows };
    },
    solution: [
      "WITH clean AS (",
      "  SELECT match_id, innings, over_no, viewers",
      "  FROM OverSnapshot",
      "  WHERE is_glitch = 0",
      "),",
      "smoothed AS (",
      "  SELECT match_id, innings, over_no,",
      "         ROUND(AVG(viewers) OVER (PARTITION BY match_id ORDER BY innings, over_no",
      "                                  ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 0) AS smoothed_viewers",
      "  FROM clean",
      "),",
      "ranked AS (",
      "  SELECT match_id, innings, over_no, smoothed_viewers,",
      "         ROW_NUMBER() OVER (PARTITION BY match_id ORDER BY smoothed_viewers DESC, innings, over_no) AS rn",
      "  FROM smoothed",
      ")",
      "SELECT match_id, innings, over_no, smoothed_viewers",
      "FROM ranked",
      "WHERE rn = 1",
    ].join("\n"),
    alternatives: [
      [
        "WITH k AS (",
        "  SELECT match_id, innings, over_no, viewers, innings * 100 + over_no AS pos",
        "  FROM OverSnapshot WHERE is_glitch = 0",
        "),",
        "s AS (",
        "  SELECT p.match_id, p.innings, p.over_no, p.pos, ROUND(AVG(q.viewers), 0) AS smoothed_viewers",
        "  FROM k p",
        "  JOIN k q ON q.match_id = p.match_id AND q.pos <= p.pos",
        "          AND (SELECT COUNT(*) FROM k r WHERE r.match_id = p.match_id AND r.pos > q.pos AND r.pos <= p.pos) < 3",
        "  GROUP BY p.match_id, p.innings, p.over_no, p.pos",
        ")",
        "SELECT match_id, innings, over_no, smoothed_viewers",
        "FROM s",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM s b",
        "  WHERE b.match_id = s.match_id",
        "    AND (b.smoothed_viewers > s.smoothed_viewers OR (b.smoothed_viewers = s.smoothed_viewers AND b.pos < s.pos))",
        ")",
      ].join("\n"),
    ],
    hints: [
      "Remove the glitch readings first — in a CTE — so the window only ever sees clean samples.",
      "A moving average over \"this row and the two before it\" is `AVG(...) OVER (... ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)`.",
      "Use a ROWS frame, not RANGE: the samples are irregular, and it is the previous two *samples* that count, not overs.",
      "Then pick the top smoothed value per match with the earliest-sample tie-break in the window's ORDER BY.",
    ],
    editorial: [
      "A **moving average** is a window aggregate with a sliding frame. Over the clean samples of each match, ordered by innings then over, `AVG(viewers) OVER (PARTITION BY match_id ORDER BY innings, over_no ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)` averages the current sample with up to two before it. At the start of a match the frame simply holds fewer rows, so the first sample averages itself and the second averages two — exactly the statement's rule. The frame must be `ROWS`: samples are irregular, and \"the two before\" means the previous two samples, not the previous two overs.",
      "",
      "Order of operations is the trap. The glitch reading of 6 crore in match 1 must be removed **before** the window runs; filtering it afterwards would still have let it inflate the averages of the next two samples. A CTE that keeps `is_glitch = 0` does that, and a match with only glitches (match 3) has no clean sample and is not listed.",
      "",
      "Finally the rounded smoothed values are ranked per match with `ROW_NUMBER()` ordered by value descending, then innings and over, which returns match 2's earlier sample when two samples both smooth to 6,500,000. The alternative builds each frame by hand — a self join keeping the samples with fewer than three clean samples between them and the current one — and picks the peak with `NOT EXISTS`; it is quadratic, while the window version is one sort per match.",
    ].join("\n"),
  },

  {
    slug: "hotstar-viewers-lost-during-rain-delays",
    title: "Hotstar: Viewers Lost During Each Rain Delay",
    difficulty: "HARD",
    topics: ["Subqueries", "Joins", "Dates"],
    description: [
      "When rain stops play, viewers drift away, and Hotstar's programming team decides what to show in the gap by how many it lost last time. Concurrency is sampled at irregular times. For a delay, **viewers before** is the sample of that match taken **at or before** the delay started (the latest such one), and **viewers after** is the sample taken **at or after** the delay ended (the earliest such one).",
      "",
      "Return `delay_id`, `match_id`, `viewers_before`, `viewers_after` and `viewers_lost` (= before − after, negative if the audience grew) for every delay that has **both** a before and an after sample. Order by `delay_id`.",
    ].join("\n"),
    tables: [
      {
        name: "ViewerSample",
        columns: [
          { name: "match_id", type: "int" },
          { name: "taken_at", type: "datetime" },
          { name: "viewers", type: "bigint" },
        ],
        primaryKey: ["match_id", "taken_at"],
        note: "One concurrency sample of a match; at most one per match per moment.",
      },
      {
        name: "RainDelay",
        columns: [
          { name: "delay_id", type: "int" },
          { name: "match_id", type: "int" },
          { name: "started_at", type: "datetime" },
          { name: "ended_at", type: "datetime" },
        ],
        primaryKey: ["delay_id"],
        note: "One row per interruption; `ended_at` is after `started_at`. A match can have several.",
      },
    ],
    examples: [
      {
        ViewerSample: [
          [1, "2025-04-20 20:00:00", 18000000],
          [1, "2025-04-20 20:10:00", 17500000],
          [1, "2025-04-20 20:20:00", 12000000],
          [1, "2025-04-20 20:50:00", 13000000],
          [1, "2025-04-20 21:00:00", 16000000],
          [2, "2025-04-20 19:40:00", 9000000],
          [2, "2025-04-20 19:50:00", 8000000],
          [3, "2025-04-20 20:30:00", 10000000],
          [3, "2025-04-20 21:45:00", 11000000],
        ],
        RainDelay: [
          [1, 1, "2025-04-20 20:10:00", "2025-04-20 20:55:00"],
          [2, 2, "2025-04-20 19:30:00", "2025-04-20 19:50:00"],
          [3, 3, "2025-04-20 21:00:00", "2025-04-20 21:30:00"],
          [4, 1, "2025-04-20 21:05:00", "2025-04-20 21:20:00"],
        ],
      },
    ],
    gen: (rng) => {
      const samples: Cell[][] = [];
      for (let id = 1; id <= 3; id++) {
        const times = sample(rng, seq(0, 30), ri(rng, 0, 8)).sort((a, b) => a - b);
        for (const t of times) samples.push([id, at("2025-04-20", 19 * 60 + t * 10), ri(rng, 50, 200) * 100000]);
      }
      const nd = ri(rng, 1, 5);
      const delays: Cell[][] = seq(1, nd).map((id) => {
        const s = ri(rng, 0, 50) * 5;
        return [id, ri(rng, 1, 3), at("2025-04-20", 19 * 60 + s), at("2025-04-20", 19 * 60 + s + ri(rng, 1, 12) * 5)];
      });
      return { ViewerSample: samples, RainDelay: delays };
    },
    solution: [
      "SELECT delay_id, match_id, viewers_before, viewers_after,",
      "       viewers_before - viewers_after AS viewers_lost",
      "FROM (",
      "  SELECT d.delay_id, d.match_id,",
      "         (SELECT s.viewers FROM ViewerSample s",
      "          WHERE s.match_id = d.match_id AND s.taken_at <= d.started_at",
      "          ORDER BY s.taken_at DESC LIMIT 1) AS viewers_before,",
      "         (SELECT s.viewers FROM ViewerSample s",
      "          WHERE s.match_id = d.match_id AND s.taken_at >= d.ended_at",
      "          ORDER BY s.taken_at LIMIT 1) AS viewers_after",
      "  FROM RainDelay d",
      ") x",
      "WHERE viewers_before IS NOT NULL AND viewers_after IS NOT NULL",
      "ORDER BY delay_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT d.delay_id, d.match_id, b.viewers AS viewers_before, a.viewers AS viewers_after,",
        "       b.viewers - a.viewers AS viewers_lost",
        "FROM RainDelay d",
        "JOIN ViewerSample b ON b.match_id = d.match_id",
        " AND b.taken_at = (SELECT MAX(taken_at) FROM ViewerSample WHERE match_id = d.match_id AND taken_at <= d.started_at)",
        "JOIN ViewerSample a ON a.match_id = d.match_id",
        " AND a.taken_at = (SELECT MIN(taken_at) FROM ViewerSample WHERE match_id = d.match_id AND taken_at >= d.ended_at)",
        "ORDER BY d.delay_id",
      ].join("\n"),
      [
        "WITH before_s AS (",
        "  SELECT d.delay_id, s.viewers, ROW_NUMBER() OVER (PARTITION BY d.delay_id ORDER BY s.taken_at DESC) AS rn",
        "  FROM RainDelay d JOIN ViewerSample s ON s.match_id = d.match_id AND s.taken_at <= d.started_at",
        "),",
        "after_s AS (",
        "  SELECT d.delay_id, s.viewers, ROW_NUMBER() OVER (PARTITION BY d.delay_id ORDER BY s.taken_at) AS rn",
        "  FROM RainDelay d JOIN ViewerSample s ON s.match_id = d.match_id AND s.taken_at >= d.ended_at",
        ")",
        "SELECT d.delay_id, d.match_id, b.viewers AS viewers_before, a.viewers AS viewers_after, b.viewers - a.viewers AS viewers_lost",
        "FROM RainDelay d",
        "JOIN before_s b ON b.delay_id = d.delay_id AND b.rn = 1",
        "JOIN after_s a ON a.delay_id = d.delay_id AND a.rn = 1",
        "ORDER BY d.delay_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "For each delay you need one specific sample on each side — a lookup per delay, not a group.",
      "\"The latest sample at or before the start\" is the sample whose time is the `MAX(taken_at)` among those `<= started_at`.",
      "The samples taken during the delay belong to neither side.",
      "A delay missing either side must be dropped, so an inner join (or a NOT NULL filter) does the work.",
    ],
    editorial: [
      "Each delay needs two **as-of lookups** against the sample table: the last sample at or before the start, and the first at or after the end. The cleanest way to say \"the last sample at or before\" in SQL is a correlated subquery ordered by time and limited to one row; mirror it for the after side. The boundaries are inclusive in both directions, so delay 1's start at exactly 20:10 uses the 20:10 sample, while the samples taken during the delay (20:20, 20:50) are on neither side.",
      "",
      "A delay with no sample before it (delay 2 began before match 2's first sample) or none after it (delay 4 ended after match 1's last sample) gets a NULL and is filtered out. `viewers_lost` is a plain difference and can be negative — match 3 gained viewers across its delay, which is still a result.",
      "",
      "The first alternative finds each side's timestamp with `MAX`/`MIN` and joins the sample row back on the primary key — the inner joins drop incomplete delays by themselves. The second ranks candidate samples per delay with `ROW_NUMBER()`. All are a range probe per delay with an index on `(match_id, taken_at)`.",
    ].join("\n"),
  },

  {
    slug: "hotstar-ninetieth-percentile-video-start-time-by-cdn",
    title: "Hotstar: 90th-Percentile Video Start Time by CDN",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "Averages hide the viewers who wait longest for a stream to start, so Hotstar's video team reports the **90th percentile** of start-up time per CDN. Only successful starts (`outcome` = `ok`) with a measured `startup_ms` count; failed starts are tracked elsewhere.",
      "",
      "Use the **nearest-rank** definition: sort a CDN's `n` start-up times ascending; the 90th percentile is the value at position **⌈0.9 × n⌉** (positions counted from 1). Return `cdn`, `starts` (= n) and `p90_ms` for every CDN with at least one counted start, ordered by `cdn`.",
    ].join("\n"),
    tables: [
      {
        name: "VideoStart",
        columns: [
          { name: "attempt_id", type: "int" },
          { name: "cdn", type: "varchar" },
          { name: "startup_ms", type: "int" },
          { name: "outcome", type: "enum", values: ["ok", "failed"] },
        ],
        primaryKey: ["attempt_id"],
        note: "One row per attempt to start a stream. `startup_ms` is the time to first frame, NULL when it was not measured.",
      },
    ],
    examples: [
      {
        VideoStart: [
          [1, "EdgeNorth", 800, "ok"], [2, "EdgeNorth", 1200, "ok"], [3, "EdgeNorth", 900, "ok"], [4, "EdgeNorth", 1500, "ok"],
          [5, "EdgeNorth", 1100, "ok"], [6, "EdgeNorth", 950, "ok"], [7, "EdgeNorth", 1000, "ok"], [8, "EdgeNorth", 1300, "ok"],
          [9, "EdgeNorth", 2400, "ok"], [10, "EdgeNorth", 700, "ok"], [11, "EdgeNorth", null, "failed"],
          [12, "SkyRelay", 400, "ok"], [13, "SkyRelay", 600, "ok"], [14, "SkyRelay", 500, "ok"], [15, "SkyRelay", null, "ok"],
          [16, "MetroCache", 3000, "failed"],
          [17, "EdgeSouth", 900, "ok"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 30);
      const cdns = sample(rng, CDNS, ri(rng, 1, 4));
      const rows: Cell[][] = seq(1, n).map((id) => {
        const ok = chance(rng, 0.85);
        return [id, pick(rng, cdns), chance(rng, 0.08) ? null : roundTo(rng, 300, 3000, 50), ok ? "ok" : "failed"];
      });
      return { VideoStart: rows };
    },
    solution: [
      "WITH counted AS (",
      "  SELECT cdn, startup_ms,",
      "         ROW_NUMBER() OVER (PARTITION BY cdn ORDER BY startup_ms, attempt_id) AS pos,",
      "         COUNT(*) OVER (PARTITION BY cdn) AS n",
      "  FROM VideoStart",
      "  WHERE outcome = 'ok' AND startup_ms IS NOT NULL",
      ")",
      "SELECT cdn, n AS starts, startup_ms AS p90_ms",
      "FROM counted",
      "WHERE pos = CEIL(9 * n / 10)",
      "ORDER BY cdn",
    ].join("\n"),
    alternatives: [
      [
        "WITH ok AS (SELECT cdn, startup_ms FROM VideoStart WHERE outcome = 'ok' AND startup_ms IS NOT NULL),",
        "sizes AS (SELECT cdn, COUNT(*) AS n FROM ok GROUP BY cdn)",
        "SELECT z.cdn, z.n AS starts,",
        "       (SELECT MIN(a.startup_ms) FROM ok a",
        "        WHERE a.cdn = z.cdn",
        "          AND (SELECT COUNT(*) FROM ok b WHERE b.cdn = a.cdn AND b.startup_ms <= a.startup_ms) * 10 >= 9 * z.n) AS p90_ms",
        "FROM sizes z",
        "ORDER BY z.cdn",
      ].join("\n"),
      [
        "WITH counted AS (",
        "  SELECT cdn, startup_ms,",
        "         ROW_NUMBER() OVER (PARTITION BY cdn ORDER BY startup_ms) AS pos,",
        "         COUNT(*) OVER (PARTITION BY cdn) AS n",
        "  FROM VideoStart WHERE outcome = 'ok' AND startup_ms IS NOT NULL",
        ")",
        "SELECT cdn, MAX(n) AS starts, MAX(CASE WHEN pos * 10 >= 9 * n AND (pos - 1) * 10 < 9 * n THEN startup_ms END) AS p90_ms",
        "FROM counted",
        "GROUP BY cdn",
        "ORDER BY cdn",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Filter to the starts that count before you number anything — a failed start must not take a position.",
      "`ROW_NUMBER()` gives each value its position, and `COUNT(*) OVER (PARTITION BY cdn)` puts n on every row.",
      "⌈0.9 × n⌉ in integers is `CEIL(9 * n / 10)`; with 10 values that is position 9, with 3 values position 3.",
      "Equal start-up times are fine: whichever of them sits at the position, the value is the same.",
    ],
    editorial: [
      "A percentile is a **positional** statistic, so the plan is: keep the counted starts, sort each CDN's values, and pick the value at a computed position. `ROW_NUMBER()` over `startup_ms` per CDN numbers the values 1…n, and `COUNT(*) OVER (PARTITION BY cdn)` repeats n on every row so the position can be compared in the same row. The nearest-rank position is ⌈0.9 n⌉, written `CEIL(9 * n / 10)` so the arithmetic is exact: 10 values → position 9 (EdgeNorth's 1500, not the 2400 outlier), 3 values → position 3, 1 value → position 1.",
      "",
      "The filter must happen first: a failed start or an unmeasured one would otherwise take a position and shift the answer, and a CDN with only failures (MetroCache) must vanish. Ties in `startup_ms` do not matter — equal values are interchangeable at any position — but `attempt_id` is added to the order so the numbering itself is deterministic.",
      "",
      "The first alternative uses the definition directly: the percentile is the smallest value v such that at least 90% of the values are ≤ v (`count(≤ v) * 10 >= 9n`), found with correlated counts. The second picks the row whose position is the first to reach 90% with integer comparisons. The window version is one sort per CDN; the correlated one is quadratic.",
    ].join("\n"),
  },

  {
    slug: "hotstar-commentary-feed-switches-per-viewer",
    title: "Hotstar: Commentary Feed Switches and Final Language per Viewer",
    difficulty: "HARD",
    topics: ["Window Functions", "Conditional Logic"],
    description: [
      "Hotstar wants to learn which commentary feeds viewers abandon mid-match. Every time a viewer tunes in to a feed, a `FeedEvent` row is written; reconnecting to the **same** language writes another row but is not a switch. A viewer's events in a match are ordered by `tuned_at`, then `event_id` (two events can share a timestamp).",
      "",
      "For every (match, viewer) with **at least 2 switches** — an event whose language differs from that viewer's previous event in the match — return `match_id`, `viewer_id`, `switches` and `final_language` (the language of their last event in the match). Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "FeedEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "match_id", type: "int" },
          { name: "viewer_id", type: "int" },
          { name: "language", type: "varchar" },
          { name: "tuned_at", type: "datetime" },
        ],
        primaryKey: ["event_id"],
        note: "One row per time a viewer tuned in to a commentary feed during a match.",
      },
    ],
    examples: [
      {
        FeedEvent: [
          [1, 11, 301, "Hindi", "2025-04-12 19:00:00"],
          [2, 11, 302, "English", "2025-04-12 19:05:00"],
          [3, 11, 303, "Tamil", "2025-04-12 19:10:00"],
          [4, 11, 301, "Hindi", "2025-04-12 19:20:00"],
          [5, 11, 302, "Hindi", "2025-04-12 19:30:00"],
          [6, 11, 301, "English", "2025-04-12 19:40:00"],
          [7, 11, 303, "Telugu", "2025-04-12 19:50:00"],
          [8, 11, 303, "Tamil", "2025-04-12 19:50:00"],
          [9, 11, 301, "Hindi", "2025-04-12 20:10:00"],
          [10, 11, 301, "Tamil", "2025-04-12 20:30:00"],
          [11, 12, 301, "English", "2025-04-13 19:00:00"],
          [12, 12, 301, "Hindi", "2025-04-13 19:10:00"],
          [13, 12, 301, "English", "2025-04-13 19:15:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 26);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 11, 12),
        ri(rng, 301, 304),
        pick(rng, ["Hindi", "English", "Tamil", "Hindi", "English"]),
        at("2025-04-12", 19 * 60 + ri(rng, 0, 24) * 10),
      ]);
      return { FeedEvent: rows };
    },
    solution: [
      "WITH ordered_events AS (",
      "  SELECT match_id, viewer_id, language,",
      "         LAG(language) OVER (PARTITION BY match_id, viewer_id ORDER BY tuned_at, event_id) AS prev_language,",
      "         ROW_NUMBER() OVER (PARTITION BY match_id, viewer_id ORDER BY tuned_at DESC, event_id DESC) AS from_end",
      "  FROM FeedEvent",
      ")",
      "SELECT match_id, viewer_id, switches, final_language",
      "FROM (",
      "  SELECT match_id, viewer_id,",
      "         SUM(CASE WHEN prev_language IS NOT NULL AND prev_language <> language THEN 1 ELSE 0 END) AS switches,",
      "         MAX(CASE WHEN from_end = 1 THEN language END) AS final_language",
      "  FROM ordered_events",
      "  GROUP BY match_id, viewer_id",
      ") v",
      "WHERE switches >= 2",
    ].join("\n"),
    alternatives: [
      [
        "WITH paired AS (",
        "  SELECT e.match_id, e.viewer_id, e.language,",
        "         (SELECT p.language FROM FeedEvent p",
        "          WHERE p.match_id = e.match_id AND p.viewer_id = e.viewer_id",
        "            AND (p.tuned_at < e.tuned_at OR (p.tuned_at = e.tuned_at AND p.event_id < e.event_id))",
        "          ORDER BY p.tuned_at DESC, p.event_id DESC LIMIT 1) AS prev_language",
        "  FROM FeedEvent e",
        "),",
        "counts AS (",
        "  SELECT match_id, viewer_id, SUM(IF(prev_language <> language, 1, 0)) AS switches",
        "  FROM paired GROUP BY match_id, viewer_id",
        ")",
        "SELECT c.match_id, c.viewer_id, c.switches,",
        "       (SELECT l.language FROM FeedEvent l",
        "        WHERE l.match_id = c.match_id AND l.viewer_id = c.viewer_id",
        "        ORDER BY l.tuned_at DESC, l.event_id DESC LIMIT 1) AS final_language",
        "FROM counts c",
        "WHERE c.switches >= 2",
      ].join("\n"),
    ],
    hints: [
      "Partition the events by match *and* viewer, ordered by `tuned_at` then `event_id`.",
      "`LAG(language)` gives the previous event's language; a switch is a row where it exists and differs.",
      "The final language is the row numbered 1 when you order the same partition backwards.",
      "Do both window steps in one CTE, then aggregate per viewer and filter with the switch count.",
    ],
    editorial: [
      "A switch is defined by **adjacent** rows, which is what `LAG` is for. Partition by match and viewer — a viewer's evening on another match is a different story — order by `tuned_at, event_id`, and compare each event's language with `LAG(language)`. A row counts as a switch when the previous language exists and differs; a reconnection to the same language (viewer 301's second Hindi row) is not one, and a viewer's first event has a NULL previous language and is not one either.",
      "",
      "The final language needs the last event, which the same pass provides: `ROW_NUMBER()` over the partition ordered **descending** marks it with 1, and `MAX(CASE WHEN from_end = 1 THEN language END)` lifts it into the grouped row. The `event_id` tie-break is not decoration — viewer 303 has two events at 19:50, and only the stated order makes their sequence Tamil → Telugu → Tamil, two switches ending on Tamil.",
      "",
      "Grouping then sums the switches per (match, viewer) and the outer filter keeps those with two or more. The alternative finds each event's predecessor with a correlated subquery ordered by the same keys, and the last language the same way; it is quadratic per viewer, while the window version sorts each partition once.",
    ].join("\n"),
  },

  {
    slug: "hotstar-deduplicated-watch-minutes-across-devices",
    title: "Hotstar: Deduplicated Watch Minutes Across Overlapping Devices",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Aggregation"],
    description: [
      "A profile often has the match open on the TV and the phone at once, so adding up session lengths overstates how long a person actually watched. Hotstar's engagement metric counts each minute of a profile's time **once**, however many devices were playing it.",
      "",
      "For every profile, return `profile_id`, `logged_minutes` (the plain sum of its session lengths) and `watch_minutes` (the length of the **union** of its sessions — overlapping or touching sessions merge into one interval). Session length is `TIMESTAMPDIFF(MINUTE, started_at, ended_at)`; all times fall on whole minutes. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "ViewingSession",
        columns: [
          { name: "session_id", type: "int" },
          { name: "profile_id", type: "int" },
          { name: "device", type: "varchar" },
          { name: "started_at", type: "datetime" },
          { name: "ended_at", type: "datetime" },
        ],
        primaryKey: ["session_id"],
        note: "One playback session on one device; `ended_at` is always after `started_at`. A session can run past midnight.",
      },
    ],
    examples: [
      {
        ViewingSession: [
          [1, 1, "tv", "2025-04-18 20:00:00", "2025-04-18 21:00:00"],
          [2, 1, "mobile", "2025-04-18 20:30:00", "2025-04-18 20:45:00"],
          [3, 1, "web", "2025-04-18 21:00:00", "2025-04-18 21:30:00"],
          [4, 1, "mobile", "2025-04-18 22:00:00", "2025-04-18 22:10:00"],
          [5, 2, "tv", "2025-04-18 19:00:00", "2025-04-18 19:40:00"],
          [6, 2, "mobile", "2025-04-18 19:20:00", "2025-04-18 20:00:00"],
          [7, 3, "tablet", "2025-04-18 18:00:00", "2025-04-18 18:25:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 14);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const start = 18 * 60 + ri(rng, 0, 60) * 5;
        return [id, ri(rng, 1, 4), pick(rng, DEVICES), at("2025-04-18", start), at("2025-04-18", start + pick(rng, [5, 10, 15, 30, 45, 60, 90, 120]))];
      });
      return { ViewingSession: rows };
    },
    solution: [
      "WITH prior AS (",
      "  SELECT session_id, profile_id, started_at, ended_at,",
      "         MAX(ended_at) OVER (PARTITION BY profile_id ORDER BY started_at, session_id",
      "                             ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS prev_end",
      "  FROM ViewingSession",
      "),",
      "flagged AS (",
      "  SELECT profile_id, started_at, ended_at,",
      "         SUM(CASE WHEN prev_end IS NULL OR started_at > prev_end THEN 1 ELSE 0 END)",
      "           OVER (PARTITION BY profile_id ORDER BY started_at, session_id",
      "                 ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS island",
      "  FROM prior",
      "),",
      "islands AS (",
      "  SELECT profile_id, MIN(started_at) AS s, MAX(ended_at) AS e",
      "  FROM flagged",
      "  GROUP BY profile_id, island",
      "),",
      "watched AS (",
      "  SELECT profile_id, SUM(TIMESTAMPDIFF(MINUTE, s, e)) AS watch_minutes FROM islands GROUP BY profile_id",
      "),",
      "logged AS (",
      "  SELECT profile_id, SUM(TIMESTAMPDIFF(MINUTE, started_at, ended_at)) AS logged_minutes",
      "  FROM ViewingSession GROUP BY profile_id",
      ")",
      "SELECT l.profile_id, l.logged_minutes, w.watch_minutes",
      "FROM logged l",
      "JOIN watched w ON w.profile_id = l.profile_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH starts AS (",
        "  SELECT DISTINCT a.profile_id, a.started_at AS s",
        "  FROM ViewingSession a",
        "  WHERE NOT EXISTS (",
        "    SELECT 1 FROM ViewingSession t",
        "    WHERE t.profile_id = a.profile_id AND t.started_at < a.started_at AND t.ended_at >= a.started_at",
        "  )",
        "),",
        "ends AS (",
        "  SELECT DISTINCT a.profile_id, a.ended_at AS e",
        "  FROM ViewingSession a",
        "  WHERE NOT EXISTS (",
        "    SELECT 1 FROM ViewingSession t",
        "    WHERE t.profile_id = a.profile_id AND t.started_at <= a.ended_at AND t.ended_at > a.ended_at",
        "  )",
        "),",
        "islands AS (",
        "  SELECT s.profile_id, s.s, (SELECT MIN(e.e) FROM ends e WHERE e.profile_id = s.profile_id AND e.e > s.s) AS e",
        "  FROM starts s",
        ")",
        "SELECT v.profile_id,",
        "       SUM(TIMESTAMPDIFF(MINUTE, v.started_at, v.ended_at)) AS logged_minutes,",
        "       (SELECT SUM(TIMESTAMPDIFF(MINUTE, i.s, i.e)) FROM islands i WHERE i.profile_id = v.profile_id) AS watch_minutes",
        "FROM ViewingSession v",
        "GROUP BY v.profile_id",
      ].join("\n"),
    ],
    hints: [
      "Sort a profile's sessions by start. A session begins a new merged interval only if it starts after **every** earlier session has ended.",
      "\"Every earlier session has ended\" means: after the maximum `ended_at` of the earlier rows — a running MAX over a frame that stops one row before the current one.",
      "Turn the begins-a-new-interval flags into interval numbers with a running SUM, then take MIN start and MAX end per interval.",
      "Touching sessions (one ends exactly when the next starts) merge — use a strict `>` for \"starts after\".",
    ],
    editorial: [
      "This is interval merging, a gaps-and-islands problem on ranges. Sort each profile's sessions by start time. A session opens a **new** merged interval exactly when it starts after the latest end among all sessions before it; otherwise it overlaps or touches the current interval and extends it. Comparing with only the previous session is the classic bug: in profile 1, the phone session 20:30–20:45 ends before the web session starts at 21:00, but the TV session that started earlier runs to 21:00, so the web session still continues the same interval. Hence `MAX(ended_at)` over `ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING`.",
      "",
      "A running `SUM` of the new-interval flags numbers the intervals; grouping by it gives each interval's `MIN(started_at)` and `MAX(ended_at)`, and their lengths add up to the deduplicated minutes. The comparison is strict (`started_at > prev_end`), so touching sessions merge — which does not change the total but keeps the intervals honest. `TIMESTAMPDIFF` handles a session that crosses midnight.",
      "",
      "The alternative never sorts: an interval's left end is a start time that no other session strictly before it covers, a right end is an end time no session continues past, and each left end pairs with the nearest right end after it. It is quadratic per profile; the window version is one sort per profile.",
    ].join("\n"),
  },

  {
    slug: "hotstar-highlights-clip-pipeline-stage-times",
    title: "Hotstar: Stage Times of Slow Highlights Clips",
    difficulty: "HARD",
    topics: ["Conditional Logic", "Aggregation", "Dates"],
    description: [
      "During a live match, every wicket and six becomes a highlights clip on Hotstar within minutes. Each clip goes through four stages — `ingested` (the broadcast segment arrives), `cut` (an editor trims it), `encoded` and `published` — and every attempt at a stage writes one row to `ClipEvent`. A failed attempt is retried, so a stage can appear more than once. The clip's clock starts at its **first** `ingested` event; every later stage is timed by its **last** attempt (the one that succeeded).",
      "",
      "For every clip that has all four stages and whose total time from first ingest to last publish is **more than 240 seconds**, return `clip_id`, `match_id`, `cut_secs` (first ingest → last cut), `encode_secs` (last cut → last encode), `publish_secs` (last encode → last publish) and `total_secs` (first ingest → last publish), all in whole seconds. Order by `total_secs` descending, then `clip_id`.",
    ].join("\n"),
    tables: [
      {
        name: "ClipEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "clip_id", type: "int" },
          { name: "match_id", type: "int" },
          { name: "stage", type: "enum", values: ["ingested", "cut", "encoded", "published"] },
          { name: "logged_at", type: "datetime" },
        ],
        primaryKey: ["event_id"],
        note: "One row per attempt at a pipeline stage. Every event of a clip carries the same `match_id`, and a clip's stages happen in pipeline order.",
      },
    ],
    examples: [
      {
        ClipEvent: [
          [1, 1, 7, "ingested", "2025-04-12 20:00:00"],
          [2, 1, 7, "ingested", "2025-04-12 20:00:20"],
          [3, 1, 7, "cut", "2025-04-12 20:01:10"],
          [4, 1, 7, "encoded", "2025-04-12 20:02:30"],
          [5, 1, 7, "encoded", "2025-04-12 20:04:00"],
          [6, 1, 7, "published", "2025-04-12 20:04:45"],
          [7, 2, 7, "ingested", "2025-04-12 20:10:00"],
          [8, 2, 7, "cut", "2025-04-12 20:10:50"],
          [9, 2, 7, "encoded", "2025-04-12 20:11:40"],
          [10, 2, 7, "published", "2025-04-12 20:12:00"],
          [11, 3, 8, "ingested", "2025-04-12 20:15:00"],
          [12, 3, 8, "cut", "2025-04-12 20:16:00"],
          [13, 3, 8, "cut", "2025-04-12 20:17:30"],
          [14, 3, 8, "encoded", "2025-04-12 20:19:00"],
          [15, 3, 8, "published", "2025-04-12 20:21:00"],
          [16, 4, 8, "ingested", "2025-04-12 20:22:00"],
          [17, 4, 8, "cut", "2025-04-12 20:23:00"],
          [18, 4, 8, "encoded", "2025-04-12 20:24:00"],
          [19, 5, 8, "ingested", "2025-04-12 20:30:00"],
          [20, 5, 8, "cut", "2025-04-12 20:31:00"],
          [21, 5, 8, "encoded", "2025-04-12 20:33:00"],
          [22, 5, 8, "published", "2025-04-12 20:34:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const nc = chance(rng, 0.05) ? 0 : ri(rng, 1, 6);
      const stamp = (secs: number): string => {
        const d = new Date(Date.parse("2025-04-12T19:30:00Z") + secs * 1000);
        return `2025-04-12 ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
      };
      let id = 1;
      for (let clip = 1; clip <= nc; clip++) {
        const match = ri(rng, 7, 9);
        let t = clip * 600 + ri(rng, 0, 120);
        const stages = ["ingested", "cut", "encoded", "published"].slice(0, chance(rng, 0.2) ? ri(rng, 1, 3) : 4);
        for (const stage of stages) {
          if (stage !== "ingested") t += pick(rng, [20, 40, 60, 80, 100, 120, 150]);
          const attempts = chance(rng, 0.25) ? 2 : 1;
          for (let a = 0; a < attempts; a++) {
            if (a > 0) t += pick(rng, [10, 30, 60]);
            rows.push([id++, clip, match, stage, stamp(t)]);
          }
        }
      }
      return { ClipEvent: shuffle(rng, rows) };
    },
    solution: [
      "WITH wide AS (",
      "  SELECT clip_id, match_id,",
      "         MIN(CASE WHEN stage = 'ingested' THEN logged_at END) AS ingested_at,",
      "         MAX(CASE WHEN stage = 'cut' THEN logged_at END) AS cut_at,",
      "         MAX(CASE WHEN stage = 'encoded' THEN logged_at END) AS encoded_at,",
      "         MAX(CASE WHEN stage = 'published' THEN logged_at END) AS published_at",
      "  FROM ClipEvent",
      "  GROUP BY clip_id, match_id",
      ")",
      "SELECT clip_id, match_id,",
      "       TIMESTAMPDIFF(SECOND, ingested_at, cut_at) AS cut_secs,",
      "       TIMESTAMPDIFF(SECOND, cut_at, encoded_at) AS encode_secs,",
      "       TIMESTAMPDIFF(SECOND, encoded_at, published_at) AS publish_secs,",
      "       TIMESTAMPDIFF(SECOND, ingested_at, published_at) AS total_secs",
      "FROM wide",
      "WHERE ingested_at IS NOT NULL AND cut_at IS NOT NULL",
      "  AND encoded_at IS NOT NULL AND published_at IS NOT NULL",
      "  AND TIMESTAMPDIFF(SECOND, ingested_at, published_at) > 240",
      "ORDER BY total_secs DESC, clip_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT i.clip_id, i.match_id,",
        "       TIMESTAMPDIFF(SECOND, i.t, c.t) AS cut_secs,",
        "       TIMESTAMPDIFF(SECOND, c.t, e.t) AS encode_secs,",
        "       TIMESTAMPDIFF(SECOND, e.t, p.t) AS publish_secs,",
        "       TIMESTAMPDIFF(SECOND, i.t, p.t) AS total_secs",
        "FROM (SELECT clip_id, match_id, MIN(logged_at) AS t FROM ClipEvent WHERE stage = 'ingested' GROUP BY clip_id, match_id) i",
        "JOIN (SELECT clip_id, MAX(logged_at) AS t FROM ClipEvent WHERE stage = 'cut' GROUP BY clip_id) c ON c.clip_id = i.clip_id",
        "JOIN (SELECT clip_id, MAX(logged_at) AS t FROM ClipEvent WHERE stage = 'encoded' GROUP BY clip_id) e ON e.clip_id = i.clip_id",
        "JOIN (SELECT clip_id, MAX(logged_at) AS t FROM ClipEvent WHERE stage = 'published' GROUP BY clip_id) p ON p.clip_id = i.clip_id",
        "WHERE TIMESTAMPDIFF(SECOND, i.t, p.t) > 240",
        "ORDER BY total_secs DESC, i.clip_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Turn the long event log into one wide row per clip, with one column per stage's timestamp.",
      "`MAX(CASE WHEN stage = 'cut' THEN logged_at END)` picks the last cut attempt; the ingest column wants `MIN` instead.",
      "Once the row is wide, every duration is a `TIMESTAMPDIFF(SECOND, earlier, later)` between two of its columns.",
      "A clip missing a stage has a NULL in that column — drop it, and keep only totals strictly above 240.",
    ],
    editorial: [
      "The log is **long**: one row per attempt, so the times of a clip's stages sit on different rows and cannot be subtracted directly. Pivot it to **wide** with conditional aggregation: group by clip, and for each stage take an aggregate of a `CASE` that yields `logged_at` only on that stage's rows. The aggregate also settles the retries: the clock starts at the first ingest, so that column is `MIN(CASE …)`, while a retried cut, encode or publish is timed by its last, successful attempt, so those are `MAX(CASE …)`. In the example, clip 1's second ingest and clip 3's first cut are both ignored for this reason.",
      "",
      "With one row per clip, each stage duration is `TIMESTAMPDIFF(SECOND, …)` between neighbouring columns, and the total is first ingest to last publish (which equals the sum of the three). A clip that never reached a stage has a NULL in its column — clip 4 was never published — so the filter requires all four. The threshold is strict: clip 5 took exactly 240 seconds and is not listed.",
      "",
      "The alternative builds the same four timestamps as four grouped derived tables, one per stage, and joins them on the clip; the inner joins drop incomplete clips by themselves. The pivot reads the log once; the join version reads it four times.",
    ].join("\n"),
  },

  {
    slug: "hotstar-passes-covering-every-playoff-match-day",
    title: "Hotstar: Subscribers Covered on Every Playoff Match Day",
    difficulty: "HARD",
    topics: ["Subqueries", "Joins", "Dates"],
    description: [
      "For a loyalty reward, Hotstar's subscriptions team wants the users who had a paid pass running on **every** playoff match day. A user may hold several passes — back to back or overlapping — and a day counts as covered if **any** of the user's passes covers it (`starts_on` and `ends_on` are both inclusive). A refunded pass covers nothing.",
      "",
      "Return the `user_id` of every user with at least one pass who was covered on **every** date in `MatchDay`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "MatchDay",
        columns: [
          { name: "match_date", type: "date" },
          { name: "fixture", type: "varchar" },
        ],
        primaryKey: ["match_date"],
        note: "One row per playoff match day; there is always at least one.",
      },
      {
        name: "SeasonPass",
        columns: [
          { name: "pass_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "plan", type: "enum", values: ["mobile", "super", "premium"] },
          { name: "starts_on", type: "date" },
          { name: "ends_on", type: "date" },
          { name: "status", type: "enum", values: ["active", "refunded"] },
        ],
        primaryKey: ["pass_id"],
        note: "One row per pass bought; `ends_on` is on or after `starts_on`.",
      },
    ],
    examples: [
      {
        MatchDay: [
          ["2025-05-20", "Qualifier 1"],
          ["2025-05-21", "Eliminator"],
          ["2025-05-23", "Qualifier 2"],
          ["2025-05-25", "Final"],
        ],
        SeasonPass: [
          [1, 81, "super", "2025-05-01", "2025-05-31", "active"],
          [2, 82, "mobile", "2025-05-15", "2025-05-21", "active"],
          [3, 82, "mobile", "2025-05-22", "2025-06-21", "active"],
          [4, 83, "premium", "2025-05-20", "2025-05-24", "active"],
          [5, 83, "premium", "2025-05-24", "2025-06-23", "refunded"],
          [6, 84, "mobile", "2025-05-21", "2025-06-20", "active"],
          [7, 85, "super", "2025-05-10", "2025-05-23", "active"],
          [8, 85, "super", "2025-05-18", "2025-05-25", "active"],
        ],
      },
    ],
    gen: (rng) => {
      const days = sample(rng, seq(18, 11), ri(rng, 1, 4)).sort((a, b) => a - b);
      const labels = ["Qualifier 1", "Eliminator", "Qualifier 2", "Final"];
      const matchDays: Cell[][] = days.map((d, i) => [`2025-05-${pad(d)}`, labels[i]!]);
      const np = chance(rng, 0.05) ? 0 : ri(rng, 1, 12);
      const passes: Cell[][] = seq(1, np).map((id) => {
        const start = addDays("2025-05-10", ri(rng, 0, 18));
        const len = pick(rng, [0, 3, 6, 9, 14, 29]);
        return [id, ri(rng, 81, 86), pick(rng, ["mobile", "super", "premium"]), start, addDays(start, len), chance(rng, 0.15) ? "refunded" : "active"];
      });
      return { MatchDay: matchDays, SeasonPass: passes };
    },
    solution: [
      "SELECT DISTINCT p.user_id",
      "FROM SeasonPass p",
      "WHERE NOT EXISTS (",
      "  SELECT 1 FROM MatchDay m",
      "  WHERE NOT EXISTS (",
      "    SELECT 1 FROM SeasonPass q",
      "    WHERE q.user_id = p.user_id",
      "      AND q.status = 'active'",
      "      AND m.match_date BETWEEN q.starts_on AND q.ends_on",
      "  )",
      ")",
    ].join("\n"),
    alternatives: [
      [
        "SELECT q.user_id",
        "FROM SeasonPass q",
        "JOIN MatchDay m ON m.match_date >= q.starts_on AND m.match_date <= q.ends_on",
        "WHERE q.status = 'active'",
        "GROUP BY q.user_id",
        "HAVING COUNT(DISTINCT m.match_date) = (SELECT COUNT(*) FROM MatchDay)",
      ].join("\n"),
    ],
    hints: [
      "\"Covered on every day\" is the same as: there is no match day on which the user is uncovered.",
      "A day is uncovered when no active pass of the user contains it — that is a NOT EXISTS inside a NOT EXISTS.",
      "If you count instead, overlapping passes cover a day twice: count distinct dates and compare with the number of match days.",
    ],
    editorial: [
      "This is **relational division**: users related to *all* rows of another table. SQL has no `FOR ALL`, so it is phrased as a double negative — keep a user if there is **no** match day for which there is **no** active pass of theirs containing it. The inner `NOT EXISTS` asks whether one specific day is covered by any of the user's passes, so coverage spread across two passes (user 82, whose passes meet between the 21st and the 22nd) works naturally, and the status test inside it makes a refunded pass cover nothing (user 83 loses the final).",
      "",
      "The outer query runs over pass rows, so `DISTINCT` returns each user once. Users with no pass at all never appear, which the statement wants.",
      "",
      "The alternative counts: join each active pass to the match days inside it, group by user, and require the number of **distinct** covered dates to equal the number of match days. `DISTINCT` is essential — user 85's overlapping passes both cover the 20th, 21st and 23rd, and a plain `COUNT(*)` would reach 7 and miss the comparison. The count version is one join and a group-by; the double `NOT EXISTS` is a probe per user and day.",
    ].join("\n"),
  },
];
