import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, chance, dateBetween, names, pick, ri, sample, shuffle } from "./kit.js";

/**
 * Video & music streaming: the questions an analyst at an OTT video service or
 * a music app is asked every week — the catalogue and its regional licences,
 * profiles per account, watch sessions and completion, binge-watching, plays
 * and the royalties they earn artists, subscriptions, plan changes and
 * retention. Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
const pad2 = (n: number) => String(n).padStart(2, "0");
/** 'YYYY-MM-DD HH:MM:00' at `minute` minutes past midnight of `date` (minute may exceed a day). */
const at = (date: string, minute: number): string => {
  const d = addDays(date, Math.floor(minute / 1440));
  const m = ((minute % 1440) + 1440) % 1440;
  return `${d} ${pad2(Math.floor(m / 60))}:${pad2(m % 60)}:00`;
};

const SHOW_TITLES = [
  "Monsoon Diaries", "The Last Local", "Chai and Code", "Kites Over Jaipur", "Station Master", "Midnight Mumbai",
  "The Spice Route", "Little Astronauts", "Cricket Fever", "Hill Station", "Paper Boats", "Neon Bazaar",
  "Tiger Trail", "The Quiet Coast", "Dhaba Nights", "Space Monkeys", "Rangoli", "Backbenchers",
  "Ocean Kids", "Desert Rose", "Coastal Cops", "The Tiffin Box", "Gully Kings", "Silk Road Stories",
] as const;
const GENRES = ["Drama", "Comedy", "Thriller", "Kids", "Documentary", "Romance"] as const;
const RATINGS = ["U", "U/A 7+", "U/A 13+", "U/A 16+", "A"] as const;
const ARTISTS = [
  "Raga Republic", "Neha Kakkar", "Lost Stories", "Prateek Kuhad", "The Local Train", "Ritviz",
  "Anuv Jain", "Divine", "Shreya Ghoshal", "Arijit Singh", "When Chai Met Toast", "Seedhe Maut",
] as const;
const SONG_WORDS = ["Baarish", "Safar", "Udd Gaye", "Khwaab", "Raat", "Dil", "Roshni", "Saahil", "Jugnu", "Aasman", "Pal", "Mausam"] as const;

export const WORLD_STREAMING: SqlProblemSpec[] = [
  {
    slug: "new-kids-originals-for-the-family-row",
    title: "New Kids-Safe Originals for the Family Row",
    difficulty: "EASY",
    topics: ["Basics"],
    description: [
      "The home screen of an OTT video app has a \"Family Originals\" row. A title belongs in it when it is one of the service's **own originals**, its certificate is `U` or `U/A 7+`, and it was **released in 2023 or later**.",
      "",
      "Return the columns `title_id` and `title_name` of every title that qualifies. Titles produced by other studios (`is_original` = 0) never qualify, whatever their certificate. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Title",
        columns: [
          { name: "title_id", type: "int" },
          { name: "title_name", type: "varchar" },
          { name: "kind", type: "enum", values: ["movie", "series"] },
          { name: "maturity_rating", type: "enum", values: [...RATINGS] },
          { name: "release_year", type: "int" },
          { name: "is_original", type: "bool" },
        ],
        primaryKey: ["title_id"],
        note: "One row per title in the catalogue. `is_original` is 1 for the service's own productions, 0 for licensed titles.",
      },
    ],
    examples: [
      {
        Title: [
          [1, "Little Astronauts", "series", "U", 2024, 1],
          [2, "Midnight Mumbai", "series", "A", 2024, 1],
          [3, "Paper Boats", "movie", "U/A 7+", 2023, 1],
          [4, "Ocean Kids", "series", "U", 2022, 1],
          [5, "Space Monkeys", "movie", "U", 2025, 0],
          [6, "Rangoli", "movie", "U/A 13+", 2023, 1],
          [7, "Kites Over Jaipur", "movie", "U/A 7+", 2025, 1],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 0, 16);
      const titles = sample(rng, SHOW_TITLES, n);
      return {
        Title: titles.map((t, i) => [
          i + 1, t, pick(rng, ["movie", "series"] as const), pick(rng, RATINGS), ri(rng, 2021, 2025), chance(rng, 0.7) ? 1 : 0,
        ]),
      };
    },
    solution: [
      "SELECT title_id, title_name",
      "FROM Title",
      "WHERE is_original = 1",
      "  AND maturity_rating IN ('U', 'U/A 7+')",
      "  AND release_year >= 2023",
    ].join("\n"),
    alternatives: [
      "SELECT title_id, title_name FROM Title WHERE is_original = 1 AND (maturity_rating = 'U' OR maturity_rating = 'U/A 7+') AND release_year > 2022",
      "SELECT title_id, title_name FROM Title WHERE is_original <> 0 AND release_year BETWEEN 2023 AND 9999 AND maturity_rating NOT IN ('U/A 13+', 'U/A 16+', 'A')",
    ],
    hints: [
      "Three conditions must all hold, so they are joined with AND.",
      "Two certificates are allowed — `IN` lists them neatly.",
      "\"2023 or later\" includes 2023 itself: `>=`, not `>`.",
    ],
    editorial: [
      "This is a pure filter over one table: no join, no grouping. Each row is checked against three conditions and kept only if every one holds, so they are combined with `AND`.",
      "",
      "The certificate test allows two values. `maturity_rating IN ('U', 'U/A 7+')` is shorthand for two equalities joined by `OR`; if you write the `OR` form yourself, wrap it in parentheses, because `AND` binds tighter than `OR` and `a AND b OR c` would let any `U/A 7+` title in regardless of the other conditions. The year test is inclusive — a title from 2023 belongs in the row — so it is `>= 2023` (or `> 2022`).",
      "",
      "`is_original` is a 0/1 flag, so `is_original = 1` keeps the service's own productions. The query reads every row once; on a large catalogue an index on `(is_original, release_year)` would let the engine skip most of it.",
    ].join("\n"),
  },

  {
    slug: "profiles-idle-since-the-new-year",
    title: "Profiles With No Streams Since the New Year",
    difficulty: "EASY",
    topics: ["Joins"],
    description: [
      "The growth team wants to nudge profiles that have gone quiet. A profile is quiet when it has **no watch session starting on or after 2024-01-01** — sessions from 2023 do not count, and a profile that has never streamed at all is quiet too.",
      "",
      "Return the columns `profile_id` and `profile_name` of every quiet profile, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Profile",
        columns: [
          { name: "profile_id", type: "int" },
          { name: "account_id", type: "int" },
          { name: "profile_name", type: "varchar" },
        ],
        primaryKey: ["profile_id"],
        note: "One row per viewer profile; an account can hold several.",
      },
      {
        name: "WatchSession",
        columns: [
          { name: "session_id", type: "int" },
          { name: "profile_id", type: "int" },
          { name: "title_id", type: "int" },
          { name: "started_at", type: "datetime" },
          { name: "watched_minutes", type: "int" },
        ],
        primaryKey: ["session_id"],
        note: "One row per playback session; `profile_id` always names a row of `Profile`.",
      },
    ],
    examples: [
      {
        Profile: [
          [1, 10, "Aarav"],
          [2, 10, "Kids"],
          [3, 11, "Meera"],
          [4, 12, "Rohan"],
          [5, 12, "Diya"],
        ],
        WatchSession: [
          [1, 1, 7, "2024-02-03 21:10:00", 48],
          [2, 2, 3, "2023-12-31 23:50:00", 30],
          [3, 3, 5, "2023-11-14 20:00:00", 95],
          [4, 3, 5, "2024-01-01 00:05:00", 12],
          [5, 5, 2, "2023-08-19 22:30:00", 41],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const who = names(rng, n);
      const profiles = who.map((p, i) => [i + 1, ri(rng, 10, 14), p]);
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 18);
      const sessions = seq(1, m).map((id) => {
        const edge = chance(rng, 0.15);
        const day = edge ? pick(rng, ["2023-12-31", "2024-01-01"]) : dateBetween(rng, "2023-09-01", "2024-04-30");
        return [id, ri(rng, 1, n), ri(rng, 1, 9), `${day} ${pad2(ri(rng, 0, 23))}:${pad2(ri(rng, 0, 59))}:00`, ri(rng, 3, 120)];
      });
      return { Profile: profiles, WatchSession: sessions };
    },
    solution: [
      "SELECT p.profile_id, p.profile_name",
      "FROM Profile p",
      "LEFT JOIN WatchSession w",
      "  ON w.profile_id = p.profile_id AND w.started_at >= '2024-01-01'",
      "WHERE w.session_id IS NULL",
    ].join("\n"),
    alternatives: [
      "SELECT profile_id, profile_name FROM Profile p WHERE NOT EXISTS (SELECT 1 FROM WatchSession w WHERE w.profile_id = p.profile_id AND w.started_at >= '2024-01-01 00:00:00')",
      "SELECT profile_id, profile_name FROM Profile WHERE profile_id NOT IN (SELECT profile_id FROM WatchSession WHERE YEAR(started_at) >= 2024)",
    ],
    hints: [
      "Start from `Profile`: every row of the answer is a profile, including ones with no sessions at all.",
      "A LEFT JOIN keeps profiles with no matching session; their session columns come back NULL.",
      "Where does the date condition go — in `ON` or in `WHERE`? Try both and compare what happens to a profile whose only sessions are from 2023.",
    ],
    editorial: [
      "This is an anti join with a twist: only *recent* sessions count as a partner. LEFT JOIN `Profile` to `WatchSession` with **both** conditions in the `ON` clause — the profile matches and the session started on or after midnight on 2024-01-01. A profile with a recent session gets matched rows; a profile with only 2023 sessions, or none, gets one row with NULLs, and `WHERE w.session_id IS NULL` keeps exactly those.",
      "",
      "Putting the date test in `WHERE` instead is the classic mistake: the profile with only old sessions is then matched to its 2023 rows, those rows are not NULL, the date filter throws them away — and the profile disappears from the answer although it is quiet.",
      "",
      "Because `started_at` is a fixed-format `datetime`, comparing it to the text `'2024-01-01'` works: a session at `2023-12-31 23:50` is smaller, `2024-01-01 00:05` is larger. `NOT EXISTS` states the rule directly, and `NOT IN` is safe here because `profile_id` is never NULL in `WatchSession`. Each form is one index probe per profile.",
    ].join("\n"),
  },

  {
    slug: "watch-hours-by-genre",
    title: "Watch Hours by Genre",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "Content acquisition decides next year's budget by genre. Using every watch session, compute the total time watched per genre of the title watched, in hours.",
      "",
      "Return the columns `genre` and `watch_hours`, where `watch_hours` is the sum of `watched_minutes` divided by 60 and **rounded to 2 decimal places**. Genres with no sessions do not appear. Order the rows by `watch_hours` from highest to lowest, and by `genre` alphabetically when two genres tie.",
    ].join("\n"),
    tables: [
      {
        name: "Title",
        columns: [
          { name: "title_id", type: "int" },
          { name: "title_name", type: "varchar" },
          { name: "genre", type: "varchar" },
        ],
        primaryKey: ["title_id"],
        note: "One row per title; every title has exactly one primary genre.",
      },
      {
        name: "WatchSession",
        columns: [
          { name: "session_id", type: "int" },
          { name: "profile_id", type: "int" },
          { name: "title_id", type: "int" },
          { name: "watched_minutes", type: "int" },
        ],
        primaryKey: ["session_id"],
        note: "One row per playback session; `title_id` always names a row of `Title`.",
      },
    ],
    examples: [
      {
        Title: [
          [1, "Coastal Cops", "Thriller"],
          [2, "Backbenchers", "Comedy"],
          [3, "Silk Road Stories", "Documentary"],
          [4, "Gully Kings", "Comedy"],
          [5, "Desert Rose", "Romance"],
        ],
        WatchSession: [
          [1, 1, 1, 50],
          [2, 2, 2, 25],
          [3, 1, 4, 45],
          [4, 3, 1, 20],
          [5, 3, 3, 70],
          [6, 2, 2, 100],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 8);
      const titles = sample(rng, SHOW_TITLES, n).map((t, i) => [i + 1, t, pick(rng, GENRES)]);
      const m = chance(rng, 0.08) ? 0 : ri(rng, 1, 20);
      const sessions = seq(1, m).map((id) => [id, ri(rng, 1, 6), ri(rng, 1, n), pick(rng, [15, 30, 45, 60, ri(rng, 1, 180)])]);
      return { Title: titles, WatchSession: sessions };
    },
    solution: [
      "SELECT t.genre, ROUND(SUM(w.watched_minutes) / 60, 2) AS watch_hours",
      "FROM WatchSession w",
      "JOIN Title t ON t.title_id = w.title_id",
      "GROUP BY t.genre",
      "ORDER BY watch_hours DESC, t.genre",
    ].join("\n"),
    alternatives: [
      [
        "SELECT genre, ROUND(total / 60, 2) AS watch_hours",
        "FROM (SELECT t.genre, SUM(w.watched_minutes) AS total FROM Title t JOIN WatchSession w ON w.title_id = t.title_id GROUP BY t.genre) g",
        "ORDER BY total DESC, genre",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Sessions know the title, titles know the genre: join them first.",
      "Group by genre and add up the minutes; convert to hours once, on the total.",
      "Sort by two keys: the hours descending, then the genre name.",
    ],
    editorial: [
      "The genre lives on `Title` and the minutes on `WatchSession`, so the query joins the two on `title_id` and then aggregates: `GROUP BY t.genre` and `SUM(w.watched_minutes)`. An inner join is right here because the statement leaves out genres nobody watched.",
      "",
      "Convert to hours **after** summing — `SUM(minutes) / 60` — and round once. Rounding each session's hours first and adding the rounded pieces can drift by a few hundredths from the true total. `/` is decimal division in MySQL, so 45 minutes become 0.75 hours, not 0.",
      "",
      "The order has two keys: the hours descending, then the genre name ascending to settle equal totals. Sorting by the raw minute total gives the same order, since two genres with the same rounded hours have the same minutes here (minutes are whole numbers). The plan is one pass over the sessions plus one primary-key lookup each.",
    ].join("\n"),
  },

  {
    slug: "accounts-with-two-or-more-kids-profiles",
    title: "Accounts With Two or More Kids Profiles",
    difficulty: "EASY",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "The family plan's marketing targets households with several children. A profile flagged `is_kids` = 1 is a kids profile.",
      "",
      "Return every account with **at least two kids profiles**, with the columns `account_id`, `total_profiles` (all its profiles, kids or not) and `kids_profiles`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Profile",
        columns: [
          { name: "profile_id", type: "int" },
          { name: "account_id", type: "int" },
          { name: "profile_name", type: "varchar" },
          { name: "is_kids", type: "bool" },
        ],
        primaryKey: ["profile_id"],
        note: "One row per viewer profile; an account holds one to five.",
      },
    ],
    examples: [
      {
        Profile: [
          [1, 501, "Priya", 0],
          [2, 501, "Chintu", 1],
          [3, 501, "Golu", 1],
          [4, 502, "Vikram", 0],
          [5, 502, "Kids", 1],
          [6, 503, "Ira", 1],
          [7, 503, "Zoya", 1],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const accounts = ri(rng, 0, 6);
      for (let a = 0; a < accounts; a++) {
        const k = ri(rng, 1, 5);
        for (let i = 0; i < k; i++) rows.push([rows.length + 1, 501 + a, pick(rng, ["Kids", "Junior", "Chintu", "Golu", "Pinky", ...names(rng, 1)]), chance(rng, 0.45) ? 1 : 0]);
      }
      return { Profile: rows };
    },
    solution: [
      "SELECT account_id, COUNT(*) AS total_profiles,",
      "       SUM(CASE WHEN is_kids = 1 THEN 1 ELSE 0 END) AS kids_profiles",
      "FROM Profile",
      "GROUP BY account_id",
      "HAVING SUM(CASE WHEN is_kids = 1 THEN 1 ELSE 0 END) >= 2",
    ].join("\n"),
    alternatives: [
      "SELECT account_id, COUNT(*) AS total_profiles, SUM(is_kids) AS kids_profiles FROM Profile GROUP BY account_id HAVING SUM(is_kids) > 1",
      [
        "SELECT p.account_id, COUNT(*) AS total_profiles, k.kids AS kids_profiles",
        "FROM Profile p JOIN (SELECT account_id, COUNT(*) AS kids FROM Profile WHERE is_kids = 1 GROUP BY account_id HAVING COUNT(*) >= 2) k ON k.account_id = p.account_id",
        "GROUP BY p.account_id, k.kids",
      ].join("\n"),
    ],
    hints: [
      "One row per account: group by `account_id`.",
      "You need two counts from the same group — all profiles and only kids profiles. A `WHERE is_kids = 1` would lose the first one.",
      "Count conditionally with `SUM(CASE WHEN … THEN 1 ELSE 0 END)` and filter the groups with `HAVING`.",
    ],
    editorial: [
      "The answer has one row per account, so it is a `GROUP BY account_id`. The catch is that the row needs two different counts: every profile, and only the kids ones. Filtering with `WHERE is_kids = 1` would make the first count wrong, because the adult profiles would be gone before grouping.",
      "",
      "**Conditional aggregation** solves it: `COUNT(*)` counts every profile of the group, and `SUM(CASE WHEN is_kids = 1 THEN 1 ELSE 0 END)` adds one only for kids profiles. Because the flag is already 0/1, `SUM(is_kids)` gives the same number. The condition on that count goes in `HAVING`, which runs after grouping, not in `WHERE`.",
      "",
      "An alternative counts kids profiles in a derived table with `WHERE` + `HAVING` and joins it back to count all profiles — two passes instead of one. The single grouped pass is linear in the number of profiles.",
    ].join("\n"),
  },

  {
    slug: "tracks-with-a-featured-artist",
    title: "Tracks With a Featured Artist",
    difficulty: "EASY",
    topics: ["Strings"],
    description: [
      "On the music app, a collaboration is written into the track title as `Song Name (feat. Guest Artist)`. The credits team wants the guest names pulled out.",
      "",
      "Return every track whose title contains **`(feat. `**, with the columns `track_id`, `title` and `featured_artist` — the text after `(feat. ` and before the closing `)`. Titles without a featured artist are left out. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Track",
        columns: [
          { name: "track_id", type: "int" },
          { name: "title", type: "varchar" },
          { name: "artist_name", type: "varchar" },
          { name: "duration_secs", type: "int" },
        ],
        primaryKey: ["track_id"],
        note: "One row per track. A featured artist, when there is one, is always written once, at the end, as `(feat. Name)`.",
      },
    ],
    examples: [
      {
        Track: [
          [1, "Baarish (feat. Anuv Jain)", "Ritviz", 214],
          [2, "Safar", "Prateek Kuhad", 198],
          [3, "Raat (Live)", "The Local Train", 305],
          [4, "Udd Gaye (feat. Divine)", "Raga Republic", 187],
          [5, "Feather Light", "Lost Stories", 241],
          [6, "Dil (Remix) (feat. Neha Kakkar)", "Lost Stories", 222],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      return {
        Track: seq(1, n).map((id) => {
          let t: string = pick(rng, SONG_WORDS);
          if (chance(rng, 0.25)) t += pick(rng, [" (Live)", " (Remix)", " (Acoustic)"]);
          if (chance(rng, 0.45)) t += ` (feat. ${pick(rng, ARTISTS)})`;
          return [id, t, pick(rng, ARTISTS), ri(rng, 120, 360)];
        }),
      };
    },
    solution: [
      "SELECT track_id, title,",
      "       SUBSTRING_INDEX(SUBSTRING_INDEX(title, '(feat. ', -1), ')', 1) AS featured_artist",
      "FROM Track",
      "WHERE title LIKE '%(feat. %'",
    ].join("\n"),
    alternatives: [
      "SELECT track_id, title, SUBSTRING(title, LOCATE('(feat. ', title) + 7, CHAR_LENGTH(title) - LOCATE('(feat. ', title) - 7) AS featured_artist FROM Track WHERE LOCATE('(feat. ', title) > 0",
      "SELECT track_id, title, REPLACE(SUBSTRING(title, INSTR(title, '(feat. ') + 7), ')', '') AS featured_artist FROM Track WHERE INSTR(title, '(feat. ') > 0",
    ],
    hints: [
      "Filter first: `LIKE` with `%` on both sides finds the marker anywhere in the title.",
      "Everything after the marker is `Guest Artist)`. How do you take the part after a delimiter, then the part before the next one?",
      "`SUBSTRING_INDEX(s, delim, -1)` keeps what follows the last delimiter; `SUBSTRING_INDEX(s, delim, 1)` keeps what precedes the first.",
    ],
    editorial: [
      "Two string steps. The filter `title LIKE '%(feat. %'` keeps only collaborations — note the opening parenthesis is part of the marker, so a title like *Feather Light* is not caught by a looser `%feat%`.",
      "",
      "To extract the guest, `SUBSTRING_INDEX(title, '(feat. ', -1)` returns everything after the marker, e.g. `Neha Kakkar)`, and an outer `SUBSTRING_INDEX(…, ')', 1)` cuts at the first closing parenthesis. A title with another bracket before the marker, such as `Dil (Remix) (feat. Neha Kakkar)`, still works because the inner call cuts at the marker itself, not at the first `(`.",
      "",
      "With positions instead: `LOCATE('(feat. ', title)` finds where the marker starts; the guest begins 7 characters later (the marker's length) and ends one character before the end of the string, since the feature is always written last. `INSTR` is the same function with its arguments reversed. Every form is a constant amount of work per row.",
    ].join("\n"),
  },

  {
    slug: "subscriptions-renewing-in-the-next-week",
    title: "Subscriptions Renewing in the Next Seven Days",
    difficulty: "EASY",
    topics: ["Dates"],
    description: [
      "Before an auto-debit, the app sends a UPI mandate reminder. Today is **2024-06-10**. A subscription needs a reminder when its `status` is `active` and its `next_renewal` falls **between 2024-06-10 and 2024-06-16, both included**.",
      "",
      "Return the columns `account_id`, `plan`, `next_renewal` and `days_left` (the number of days from 2024-06-10 to `next_renewal`; 0 for a renewal today). Paused and cancelled subscriptions get no reminder. Order the rows by `days_left`, then by `account_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Subscription",
        columns: [
          { name: "subscription_id", type: "int" },
          { name: "account_id", type: "int" },
          { name: "plan", type: "enum", values: ["Mobile", "Basic", "Standard", "Premium"] },
          { name: "status", type: "enum", values: ["active", "paused", "cancelled"] },
          { name: "next_renewal", type: "date" },
        ],
        primaryKey: ["subscription_id"],
        note: "One row per account's subscription (an account has at most one).",
      },
    ],
    examples: [
      {
        Subscription: [
          [1, 3101, "Premium", "active", "2024-06-10"],
          [2, 3102, "Mobile", "active", "2024-06-16"],
          [3, 3103, "Basic", "paused", "2024-06-12"],
          [4, 3104, "Standard", "active", "2024-06-17"],
          [5, 3105, "Mobile", "active", "2024-06-12"],
          [6, 3106, "Premium", "cancelled", "2024-06-11"],
          [7, 3107, "Basic", "active", "2024-06-09"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 0, 14);
      const accounts = sample(rng, seq(3101, 40), n);
      return {
        Subscription: accounts.map((acc, i) => [
          i + 1, acc, pick(rng, ["Mobile", "Basic", "Standard", "Premium"] as const),
          pick(rng, ["active", "active", "active", "paused", "cancelled"] as const),
          addDays("2024-06-10", ri(rng, -3, 10)),
        ]),
      };
    },
    solution: [
      "SELECT account_id, plan, next_renewal, DATEDIFF(next_renewal, '2024-06-10') AS days_left",
      "FROM Subscription",
      "WHERE status = 'active'",
      "  AND next_renewal BETWEEN '2024-06-10' AND DATE_ADD('2024-06-10', INTERVAL 6 DAY)",
      "ORDER BY days_left, account_id",
    ].join("\n"),
    alternatives: [
      "SELECT account_id, plan, next_renewal, DATEDIFF(next_renewal, '2024-06-10') AS days_left FROM Subscription WHERE status = 'active' AND DATEDIFF(next_renewal, '2024-06-10') BETWEEN 0 AND 6 ORDER BY next_renewal, account_id",
      "SELECT account_id, plan, next_renewal, TIMESTAMPDIFF(DAY, '2024-06-10', next_renewal) AS days_left FROM Subscription WHERE status = 'active' AND next_renewal >= '2024-06-10' AND next_renewal < '2024-06-17' ORDER BY days_left, account_id",
    ],
    ordered: true,
    hints: [
      "Two filters: the status, and a date window that includes both ends.",
      "`BETWEEN` is inclusive on both sides, which is exactly what \"both included\" asks for.",
      "`DATEDIFF(later, earlier)` gives whole days between two dates.",
    ],
    editorial: [
      "The window is seven calendar days starting today. `next_renewal BETWEEN '2024-06-10' AND DATE_ADD('2024-06-10', INTERVAL 6 DAY)` covers it — `BETWEEN` includes both ends, so a renewal today and one on the 16th both qualify while the 17th does not. An equivalent half-open form is `>= '2024-06-10' AND < '2024-06-17'`, which is the safer habit when the column is a `datetime` with a time part.",
      "",
      "`DATEDIFF(next_renewal, '2024-06-10')` counts the days left: 0 for today, 6 for the last day. Mind the argument order — MySQL's `DATEDIFF(a, b)` is `a - b`. The status filter drops paused and cancelled subscriptions, and a renewal date already in the past (the 9th) falls outside the window.",
      "",
      "Ordering by `days_left` and by `next_renewal` is the same thing, since one is the other minus a constant; `account_id` breaks ties between renewals on the same day. An index on `next_renewal` turns this into a short range scan.",
    ].join("\n"),
  },

  {
    slug: "episode-runtime-buckets",
    title: "Short, Standard and Long Episodes",
    difficulty: "EASY",
    topics: ["Conditional Logic", "Basics"],
    description: [
      "The player's \"quick watch\" filter needs every episode labelled by length. An episode under 25 minutes is `short`, one from 25 to 50 minutes (both included) is `standard`, and anything over 50 minutes is `long`. Episodes whose runtime has not been ingested yet have `runtime_minutes` NULL and are labelled `unknown`.",
      "",
      "Return the columns `episode_id`, `series_name` and `length_bucket` for every episode, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Episode",
        columns: [
          { name: "episode_id", type: "int" },
          { name: "series_name", type: "varchar" },
          { name: "season_no", type: "int" },
          { name: "episode_no", type: "int" },
          { name: "runtime_minutes", type: "int" },
        ],
        primaryKey: ["episode_id"],
        note: "One row per episode. `runtime_minutes` is NULL until the video's metadata is processed.",
      },
    ],
    examples: [
      {
        Episode: [
          [1, "Backbenchers", 1, 1, 22],
          [2, "Backbenchers", 1, 2, 25],
          [3, "Coastal Cops", 2, 1, 50],
          [4, "Coastal Cops", 2, 2, 51],
          [5, "Monsoon Diaries", 1, 1, null],
          [6, "Monsoon Diaries", 1, 2, 38],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      return {
        Episode: seq(1, n).map((id) => [
          id, pick(rng, SHOW_TITLES), ri(rng, 1, 3), ri(rng, 1, 10),
          chance(rng, 0.12) ? null : pick(rng, [24, 25, 50, 51, ri(rng, 10, 75)]),
        ]),
      };
    },
    solution: [
      "SELECT episode_id, series_name,",
      "       CASE",
      "         WHEN runtime_minutes IS NULL THEN 'unknown'",
      "         WHEN runtime_minutes < 25 THEN 'short'",
      "         WHEN runtime_minutes <= 50 THEN 'standard'",
      "         ELSE 'long'",
      "       END AS length_bucket",
      "FROM Episode",
    ].join("\n"),
    alternatives: [
      "SELECT episode_id, series_name, IF(runtime_minutes IS NULL, 'unknown', IF(runtime_minutes < 25, 'short', IF(runtime_minutes > 50, 'long', 'standard'))) AS length_bucket FROM Episode",
      "SELECT episode_id, series_name, COALESCE(CASE WHEN runtime_minutes > 50 THEN 'long' WHEN runtime_minutes BETWEEN 25 AND 50 THEN 'standard' WHEN runtime_minutes < 25 THEN 'short' END, 'unknown') AS length_bucket FROM Episode",
    ],
    hints: [
      "One output value chosen from several rules: a `CASE` expression.",
      "`CASE` stops at the first `WHEN` that is true, so order the rules carefully.",
      "Where does a NULL runtime land if you don't test for it? No comparison with NULL is true.",
    ],
    editorial: [
      "A searched `CASE` checks its `WHEN` branches top to bottom and returns the first one that is true, so overlapping ranges are fine as long as they are ordered: once `< 25` has failed, `<= 50` only sees runtimes from 25 upward, and `ELSE` catches everything over 50.",
      "",
      "NULL needs its own branch. Every comparison with NULL is unknown, never true, so without the `IS NULL` test a missing runtime would skip the first three branches and fall into `ELSE` — labelled `long`, which is wrong. Testing it first (or wrapping a CASE that has no `ELSE` in `COALESCE(…, 'unknown')`, as one alternative does) keeps it out.",
      "",
      "The boundaries are the other trap: 25 and 50 are both `standard`. Nested `IF`s express the same tree. Each row is labelled independently, so the query is one pass over the table.",
    ].join("\n"),
  },

  {
    slug: "movies-longer-than-the-average-movie",
    title: "Movies Longer Than the Average Movie",
    difficulty: "EASY",
    topics: ["Subqueries", "Basics"],
    description: [
      "Editors want an \"epic watch\" collection: movies that run **longer than the average movie** in the catalogue. Only movies count towards the average — series rows are ignored — and a movie with `runtime_minutes` NULL is ignored both in the average and in the answer.",
      "",
      "Return the columns `title_name` and `runtime_minutes`, ordered by `runtime_minutes` from longest to shortest, then by `title_name` alphabetically.",
    ].join("\n"),
    tables: [
      {
        name: "Title",
        columns: [
          { name: "title_id", type: "int" },
          { name: "title_name", type: "varchar" },
          { name: "kind", type: "enum", values: ["movie", "series"] },
          { name: "runtime_minutes", type: "int" },
        ],
        primaryKey: ["title_id"],
        note: "For a series, `runtime_minutes` is the length of an average episode. It is NULL when not yet known.",
      },
    ],
    examples: [
      {
        Title: [
          [1, "Paper Boats", "movie", 142],
          [2, "Coastal Cops", "series", 300],
          [3, "Desert Rose", "movie", 118],
          [4, "Tiger Trail", "movie", null],
          [5, "Kites Over Jaipur", "movie", 96],
          [6, "The Spice Route", "movie", 142],
          [7, "Rangoli", "movie", 104],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const titles = sample(rng, SHOW_TITLES, n);
      const lengths = [90, 104, 118, 130, 142, 155];
      return {
        Title: titles.map((t, i) => {
          const series = chance(rng, 0.3);
          return [i + 1, t, series ? "series" : "movie", chance(rng, 0.1) ? null : series ? ri(rng, 20, 400) : pick(rng, lengths)];
        }),
      };
    },
    solution: [
      "SELECT title_name, runtime_minutes",
      "FROM Title",
      "WHERE kind = 'movie'",
      "  AND runtime_minutes > (SELECT AVG(runtime_minutes) FROM Title WHERE kind = 'movie')",
      "ORDER BY runtime_minutes DESC, title_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT t.title_name, t.runtime_minutes",
        "FROM Title t CROSS JOIN (SELECT SUM(runtime_minutes) AS s, COUNT(runtime_minutes) AS c FROM Title WHERE kind = 'movie') a",
        "WHERE t.kind = 'movie' AND t.runtime_minutes * a.c > a.s",
        "ORDER BY t.runtime_minutes DESC, t.title_name",
      ].join("\n"),
      [
        "WITH movies AS (SELECT title_name, runtime_minutes, AVG(runtime_minutes) OVER () AS avg_rt FROM Title WHERE kind = 'movie')",
        "SELECT title_name, runtime_minutes FROM movies WHERE runtime_minutes > avg_rt ORDER BY runtime_minutes DESC, title_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The average is one number computed over the whole table — a scalar subquery can produce it.",
      "The subquery needs its own `WHERE kind = 'movie'`, or series lengths would pull the average up.",
      "`AVG` already skips NULLs; does a NULL runtime pass `> average`?",
    ],
    editorial: [
      "The threshold is a single value — the average movie runtime — so a **scalar subquery** in `WHERE` computes it once: `(SELECT AVG(runtime_minutes) FROM Title WHERE kind = 'movie')`. The outer query keeps movies whose runtime is strictly greater. Both queries need the `kind = 'movie'` filter; without it in the subquery, a 300-minute series row would inflate the average.",
      "",
      "NULLs take care of themselves: `AVG` ignores NULL values (it divides by the count of non-NULL runtimes), and `NULL > x` is not true, so a movie with an unknown runtime never appears. Equal-to-average movies are not \"longer\", hence `>`.",
      "",
      "Alternatives: compare `runtime * count > sum` against a one-row derived table (no division at all), or attach `AVG(…) OVER ()` to every movie row with a window and filter outside. All read the table twice at most; the order uses the title name to settle equal runtimes.",
    ].join("\n"),
  },

  {
    slug: "monthly-active-viewers-and-minutes-per-viewer",
    title: "Monthly Active Viewers and Minutes per Viewer",
    difficulty: "MEDIUM",
    topics: ["Dates", "Aggregation"],
    description: [
      "The monthly board deck shows engagement. A session shorter than **2 minutes** is an accidental autoplay and is ignored completely. Among the remaining sessions, a profile is active in a month when it has at least one session starting in that month.",
      "",
      "Return one row per month that has any counted session, with the columns `month` (as `YYYY-MM`), `active_profiles` (distinct profiles) and `minutes_per_profile` (total counted minutes divided by `active_profiles`, **rounded to 2 decimal places**). Order the rows by `month`.",
    ].join("\n"),
    tables: [
      {
        name: "WatchSession",
        columns: [
          { name: "session_id", type: "int" },
          { name: "profile_id", type: "int" },
          { name: "started_at", type: "datetime" },
          { name: "watched_minutes", type: "int" },
        ],
        primaryKey: ["session_id"],
        note: "One row per playback session; a session belongs to the month in which it started.",
      },
    ],
    examples: [
      {
        WatchSession: [
          [1, 1, "2024-01-05 20:15:00", 45],
          [2, 2, "2024-01-20 22:40:00", 1],
          [3, 1, "2024-01-31 23:58:00", 30],
          [4, 3, "2024-02-01 00:10:00", 50],
          [5, 1, "2024-02-14 19:00:00", 20],
          [6, 3, "2024-02-15 21:30:00", 2],
          [7, 2, "2024-03-02 08:00:00", 1],
        ],
      },
    ],
    gen: (rng) => {
      const m = chance(rng, 0.06) ? 0 : ri(rng, 1, 20);
      return {
        WatchSession: seq(1, m).map((id) => {
          const day = chance(rng, 0.15) ? pick(rng, ["2024-01-31", "2024-02-01", "2024-02-29", "2024-03-01"]) : dateBetween(rng, "2024-01-01", "2024-04-30");
          return [id, ri(rng, 1, 7), `${day} ${pad2(ri(rng, 0, 23))}:${pad2(ri(rng, 0, 59))}:00`, pick(rng, [1, 2, ri(rng, 1, 140)])];
        }),
      };
    },
    solution: [
      "SELECT DATE_FORMAT(started_at, '%Y-%m') AS month,",
      "       COUNT(DISTINCT profile_id) AS active_profiles,",
      "       ROUND(SUM(watched_minutes) / COUNT(DISTINCT profile_id), 2) AS minutes_per_profile",
      "FROM WatchSession",
      "WHERE watched_minutes >= 2",
      "GROUP BY DATE_FORMAT(started_at, '%Y-%m')",
      "ORDER BY month",
    ].join("\n"),
    alternatives: [
      [
        "SELECT month, COUNT(*) AS active_profiles, ROUND(SUM(mins) / COUNT(*), 2) AS minutes_per_profile",
        "FROM (SELECT LEFT(started_at, 7) AS month, profile_id, SUM(watched_minutes) AS mins FROM WatchSession WHERE watched_minutes > 1 GROUP BY LEFT(started_at, 7), profile_id) p",
        "GROUP BY month ORDER BY month",
      ].join("\n"),
      [
        "SELECT month, COUNT(DISTINCT profile_id) AS active_profiles, ROUND(SUM(watched_minutes) / COUNT(DISTINCT profile_id), 2) AS minutes_per_profile",
        "FROM (SELECT CONCAT(YEAR(started_at), '-', LPAD(MONTH(started_at), 2, '0')) AS month, profile_id, watched_minutes FROM WatchSession WHERE watched_minutes >= 2) s",
        "GROUP BY month ORDER BY month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Drop the autoplay sessions in `WHERE`, before any grouping.",
      "`DATE_FORMAT(started_at, '%Y-%m')` turns a timestamp into its month bucket.",
      "A profile with three sessions in a month is still one active profile: `COUNT(DISTINCT …)`.",
    ],
    editorial: [
      "Bucket each session by the month it started in — `DATE_FORMAT(started_at, '%Y-%m')` gives `2024-01`, which also sorts correctly as text — and group by that bucket. The autoplay rule removes sessions *before* grouping, in `WHERE`, so a profile whose only January session lasted one minute is not active in January at all.",
      "",
      "Inside a month, `COUNT(DISTINCT profile_id)` counts viewers rather than sessions, and `SUM(watched_minutes)` totals the counted minutes; their ratio, rounded to two places, is the minutes per active profile. Note that a session at 23:58 on the 31st belongs to January even if it ran past midnight.",
      "",
      "The alternative pre-aggregates per (month, profile) and then counts rows, which avoids `DISTINCT`; another builds the label from `YEAR` and `MONTH` with `LPAD`. A month with only autoplay sessions produces no row. The query is one scan plus a sort by month.",
    ].join("\n"),
  },

  {
    slug: "series-completion-rate",
    title: "Completion Rate of Every Series",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "A watch session **completes** an episode when the viewer watched at least **90%** of its runtime (`watched_minutes` ≥ 0.9 × `runtime_minutes`). Commissioning uses each series' completion rate to decide renewals.",
      "",
      "Return one row per series with at least one session, with the columns `series_name`, `sessions` (all its sessions) and `completion_pct` — completed sessions as a percentage of `sessions`, **rounded to 2 decimal places**. Order by `completion_pct` from highest to lowest, then by `series_name`.",
    ].join("\n"),
    tables: [
      {
        name: "Episode",
        columns: [
          { name: "episode_id", type: "int" },
          { name: "series_name", type: "varchar" },
          { name: "runtime_minutes", type: "int" },
        ],
        primaryKey: ["episode_id"],
        note: "One row per episode; several episodes share a `series_name`.",
      },
      {
        name: "WatchSession",
        columns: [
          { name: "session_id", type: "int" },
          { name: "profile_id", type: "int" },
          { name: "episode_id", type: "int" },
          { name: "watched_minutes", type: "int" },
        ],
        primaryKey: ["session_id"],
        note: "One row per playback session of an episode; `episode_id` always names a row of `Episode`.",
      },
    ],
    examples: [
      {
        Episode: [
          [1, "Coastal Cops", 50],
          [2, "Coastal Cops", 40],
          [3, "Backbenchers", 20],
          [4, "Hill Station", 30],
        ],
        WatchSession: [
          [1, 1, 1, 45],
          [2, 2, 1, 44],
          [3, 1, 2, 40],
          [4, 3, 3, 18],
          [5, 2, 3, 5],
          [6, 3, 2, 12],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 8);
      const series = sample(rng, SHOW_TITLES, ri(rng, 1, 4));
      const eps = seq(1, n).map((id) => [id, pick(rng, series), pick(rng, [20, 30, 40, 50, 60])] as [number, string, number]);
      const m = chance(rng, 0.06) ? 0 : ri(rng, 1, 24);
      const sessions = seq(1, m).map((id) => {
        const e = pick(rng, eps);
        const rt = e[2];
        return [id, ri(rng, 1, 8), e[0], pick(rng, [rt, Math.ceil(rt * 0.9), Math.ceil(rt * 0.9) - 1, ri(rng, 1, rt)])];
      });
      return { Episode: eps, WatchSession: sessions };
    },
    solution: [
      "SELECT e.series_name, COUNT(*) AS sessions,",
      "       ROUND(100 * SUM(CASE WHEN w.watched_minutes * 10 >= e.runtime_minutes * 9 THEN 1 ELSE 0 END) / COUNT(*), 2) AS completion_pct",
      "FROM WatchSession w",
      "JOIN Episode e ON e.episode_id = w.episode_id",
      "GROUP BY e.series_name",
      "ORDER BY completion_pct DESC, e.series_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT e.series_name, COUNT(w.session_id) AS sessions,",
        "       ROUND(AVG(IF(w.watched_minutes >= 0.9 * e.runtime_minutes, 100, 0)), 2) AS completion_pct",
        "FROM Episode e JOIN WatchSession w ON w.episode_id = e.episode_id",
        "GROUP BY e.series_name",
        "ORDER BY completion_pct DESC, e.series_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The runtime is on `Episode`, the minutes watched on `WatchSession` — join them before deciding anything.",
      "Turn the 90% rule into a 1/0 with `CASE` and add the ones up per series.",
      "Multiply by 100 before dividing, and round at the end.",
    ],
    editorial: [
      "Each session has to be compared with the runtime of its own episode, so the query first joins `WatchSession` to `Episode`, then groups by `series_name` — several episodes roll up into one series.",
      "",
      "The completion rule becomes a flag inside the aggregate: `SUM(CASE WHEN watched ≥ 90% of runtime THEN 1 ELSE 0 END)` counts completed sessions, `COUNT(*)` counts all of them, and `100 * completed / sessions` is the rate. Writing the test as `watched_minutes * 10 >= runtime_minutes * 9` keeps it in whole numbers, so 45 of 50 minutes — exactly 90% — completes, and 44 does not. `AVG` of a 100/0 flag is the same percentage in one step.",
      "",
      "An inner join is right because series without sessions are not wanted; a series with sessions but no completions shows 0. The plan is a scan of the sessions with a key lookup each, then a sort of the few series rows.",
    ].join("\n"),
  },

  {
    slug: "most-streamed-artist-in-every-genre",
    title: "Most-Streamed Artist in Every Genre",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Joins", "Aggregation"],
    description: [
      "On the music app a play counts as a **stream** only when at least **30 seconds** were played. The editorial team wants the top artist of each genre for the year-end playlist covers.",
      "",
      "For every genre, return the artist (or artists, if tied) with the **most streams**, with the columns `genre`, `artist_name` and `streams`. An artist with no streams is never a top artist, so a genre whose artists have no streams does not appear. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Artist",
        columns: [
          { name: "artist_id", type: "int" },
          { name: "artist_name", type: "varchar" },
          { name: "genre", type: "varchar" },
        ],
        primaryKey: ["artist_id"],
        note: "One row per artist with their main genre.",
      },
      {
        name: "Play",
        columns: [
          { name: "play_id", type: "int" },
          { name: "listener_id", type: "int" },
          { name: "artist_id", type: "int" },
          { name: "seconds_played", type: "int" },
        ],
        primaryKey: ["play_id"],
        note: "One row per play; `artist_id` always names a row of `Artist`.",
      },
    ],
    examples: [
      {
        Artist: [
          [1, "Prateek Kuhad", "Indie"],
          [2, "Anuv Jain", "Indie"],
          [3, "Divine", "Hip-Hop"],
          [4, "Seedhe Maut", "Hip-Hop"],
          [5, "Shreya Ghoshal", "Bollywood"],
        ],
        Play: [
          [1, 11, 1, 200],
          [2, 12, 1, 31],
          [3, 13, 2, 240],
          [4, 11, 2, 29],
          [5, 14, 3, 180],
          [6, 15, 4, 30],
          [7, 12, 4, 210],
          [8, 13, 3, 95],
          [9, 14, 5, 12],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 8);
      const artists = sample(rng, ARTISTS, n).map((a, i) => [i + 1, a, pick(rng, ["Indie", "Hip-Hop", "Bollywood"])]);
      const m = chance(rng, 0.06) ? 0 : ri(rng, 1, 26);
      return {
        Artist: artists,
        Play: seq(1, m).map((id) => [id, ri(rng, 11, 20), ri(rng, 1, n), pick(rng, [29, 30, ri(rng, 5, 300), ri(rng, 30, 300)])]),
      };
    },
    solution: [
      "WITH streams AS (",
      "  SELECT a.genre, a.artist_name, COUNT(*) AS streams,",
      "         RANK() OVER (PARTITION BY a.genre ORDER BY COUNT(*) DESC) AS rnk",
      "  FROM Play p",
      "  JOIN Artist a ON a.artist_id = p.artist_id",
      "  WHERE p.seconds_played >= 30",
      "  GROUP BY a.artist_id, a.genre, a.artist_name",
      ")",
      "SELECT genre, artist_name, streams FROM streams WHERE rnk = 1",
    ].join("\n"),
    alternatives: [
      [
        "WITH s AS (SELECT a.artist_id, a.genre, a.artist_name, COUNT(*) AS streams FROM Artist a JOIN Play p ON p.artist_id = a.artist_id AND p.seconds_played > 29 GROUP BY a.artist_id, a.genre, a.artist_name)",
        "SELECT genre, artist_name, streams FROM s WHERE streams = (SELECT MAX(s2.streams) FROM s s2 WHERE s2.genre = s.genre)",
      ].join("\n"),
      [
        "WITH s AS (SELECT a.artist_id, a.genre, a.artist_name, COUNT(*) AS streams FROM Artist a JOIN Play p ON p.artist_id = a.artist_id WHERE p.seconds_played >= 30 GROUP BY a.artist_id, a.genre, a.artist_name)",
        "SELECT s.genre, s.artist_name, s.streams FROM s JOIN (SELECT genre, MAX(streams) AS best FROM s GROUP BY genre) b ON b.genre = s.genre AND b.best = s.streams",
      ].join("\n"),
    ],
    hints: [
      "First count streams per artist — filter out the short plays before counting.",
      "\"Top in each genre\" means the comparison restarts in every genre: `PARTITION BY genre`.",
      "Ties must all be kept. Which of `ROW_NUMBER`, `RANK` or a comparison with `MAX` does that?",
    ],
    editorial: [
      "Two steps. First aggregate: join plays to artists, drop plays shorter than 30 seconds in `WHERE`, and `COUNT(*)` per artist. Group by `artist_id` (plus the columns you select), not by name — two artists could share a name.",
      "",
      "Then pick the maximum within each genre. `RANK() OVER (PARTITION BY genre ORDER BY COUNT(*) DESC)` can be computed in the same query as the aggregate, because window functions run after `GROUP BY`; the outer query keeps `rnk = 1`, which includes every artist tied for first. `ROW_NUMBER` would silently drop one of the tied artists.",
      "",
      "Without windows, compare each artist's count with the genre's `MAX` — either through a correlated subquery or by joining a per-genre maximum back on (genre, count). Artists with zero streams never reach the aggregate (the inner join finds no qualifying play), so a genre with only silent artists has no row. Cost: one pass over plays and a sort per genre.",
    ].join("\n"),
  },

  {
    slug: "artist-royalties-for-may-2024",
    title: "Artist Royalties for May 2024",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "The music app pays artists per stream: **₹0.40** for a stream by a `premium` listener and **₹0.10** for a stream by a `free` listener. Only plays of at least **30 seconds** that started in **May 2024** are paid.",
      "",
      "Return every artist — including artists with nothing paid this month — with the columns `artist_name`, `paid_streams` (the number of paid plays) and `royalty_inr` (the payout, **rounded to 2 decimal places**, 0 when nothing is paid). Order by `royalty_inr` from highest to lowest, then by `artist_name`.",
    ].join("\n"),
    tables: [
      {
        name: "Artist",
        columns: [
          { name: "artist_id", type: "int" },
          { name: "artist_name", type: "varchar" },
        ],
        primaryKey: ["artist_id"],
        note: "One row per artist on the royalty statement; names are unique.",
      },
      {
        name: "Play",
        columns: [
          { name: "play_id", type: "int" },
          { name: "artist_id", type: "int" },
          { name: "listener_tier", type: "enum", values: ["free", "premium"] },
          { name: "played_at", type: "datetime" },
          { name: "seconds_played", type: "int" },
        ],
        primaryKey: ["play_id"],
        note: "One row per play. `listener_tier` is the listener's plan at the time of the play.",
      },
    ],
    examples: [
      {
        Artist: [
          [1, "Ritviz"],
          [2, "The Local Train"],
          [3, "Arijit Singh"],
          [4, "Lost Stories"],
        ],
        Play: [
          [1, 1, "premium", "2024-05-01 00:00:10", 180],
          [2, 1, "free", "2024-05-12 18:20:00", 45],
          [3, 1, "premium", "2024-04-30 23:59:00", 200],
          [4, 2, "free", "2024-05-20 09:15:00", 30],
          [5, 2, "free", "2024-05-21 10:00:00", 29],
          [6, 3, "premium", "2024-05-31 23:59:59", 240],
          [7, 3, "free", "2024-06-01 00:00:05", 240],
          [8, 4, "premium", "2024-05-03 12:00:00", 10],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 7);
      const artists = sample(rng, ARTISTS, n).map((a, i) => [i + 1, a]);
      const m = chance(rng, 0.06) ? 0 : ri(rng, 1, 26);
      return {
        Artist: artists,
        Play: seq(1, m).map((id) => {
          const day = chance(rng, 0.2) ? pick(rng, ["2024-04-30", "2024-05-01", "2024-05-31", "2024-06-01"]) : dateBetween(rng, "2024-05-01", "2024-05-31");
          return [id, ri(rng, 1, n), pick(rng, ["free", "premium"] as const), `${day} ${pad2(ri(rng, 0, 23))}:${pad2(ri(rng, 0, 59))}:00`, pick(rng, [29, 30, ri(rng, 5, 300)])];
        }),
      };
    },
    solution: [
      "SELECT a.artist_name, COUNT(p.play_id) AS paid_streams,",
      "       ROUND(SUM(CASE WHEN p.listener_tier = 'premium' THEN 0.40",
      "                      WHEN p.listener_tier = 'free' THEN 0.10",
      "                      ELSE 0 END), 2) AS royalty_inr",
      "FROM Artist a",
      "LEFT JOIN Play p",
      "  ON p.artist_id = a.artist_id",
      " AND p.seconds_played >= 30",
      " AND p.played_at >= '2024-05-01' AND p.played_at < '2024-06-01'",
      "GROUP BY a.artist_id, a.artist_name",
      "ORDER BY royalty_inr DESC, a.artist_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.artist_name, COALESCE(s.paid, 0) AS paid_streams, ROUND(COALESCE(s.cents, 0) / 100, 2) AS royalty_inr",
        "FROM Artist a LEFT JOIN (",
        "  SELECT artist_id, COUNT(*) AS paid, SUM(IF(listener_tier = 'premium', 40, 10)) AS cents FROM Play",
        "  WHERE seconds_played >= 30 AND YEAR(played_at) = 2024 AND MONTH(played_at) = 5 GROUP BY artist_id",
        ") s ON s.artist_id = a.artist_id",
        "ORDER BY royalty_inr DESC, a.artist_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Every artist must appear, so start from `Artist` and LEFT JOIN the plays.",
      "Put the 30-second and May conditions in the `ON` clause — in `WHERE` they would remove the artists with nothing paid.",
      "A `CASE` on the tier gives each play its rate; `SUM` it per artist.",
    ],
    editorial: [
      "The statement lists every artist, paid or not, so the plays are attached with a **LEFT JOIN** and every qualifying condition — the 30-second minimum and the May window — goes in the `ON` clause. If those tests were in `WHERE`, an artist whose plays were all too short or out of the month would lose its only (NULL-padded) row and vanish from the statement.",
      "",
      "Per artist, `COUNT(p.play_id)` counts only real matches (it ignores the NULL from an unmatched artist), and `SUM(CASE …)` adds ₹0.40 or ₹0.10 per play by tier; the `ELSE 0` makes an artist with no match sum to 0 rather than NULL. The half-open window `>= '2024-05-01' AND < '2024-06-01'` includes the last second of the 31st and nothing from June 1st.",
      "",
      "The alternative aggregates in paise inside a derived table and divides by 100, which keeps the arithmetic exact, then fills missing artists with `COALESCE`. Both read the plays once.",
    ].join("\n"),
  },

  {
    slug: "plan-changes-classified-as-upgrades",
    title: "Classify Every Plan Change as Upgrade or Downgrade",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Joins", "Conditional Logic"],
    description: [
      "`PlanHistory` records the plan an account moved to each time it changed plans; an account's **earliest row is its sign-up**, not a change. Finance wants every real change labelled by price: `upgrade` when the new plan's monthly price is higher than the previous plan's, `downgrade` when lower, and `lateral` when the prices are equal.",
      "",
      "Return one row per change (sign-ups excluded) with the columns `account_id`, `changed_on`, `from_plan`, `to_plan` and `direction`. Order by `account_id`, then `changed_on`.",
    ].join("\n"),
    tables: [
      {
        name: "Plan",
        columns: [
          { name: "plan_name", type: "varchar" },
          { name: "monthly_price", type: "int" },
        ],
        primaryKey: ["plan_name"],
        note: "Monthly price in rupees.",
      },
      {
        name: "PlanHistory",
        columns: [
          { name: "account_id", type: "int" },
          { name: "changed_on", type: "date" },
          { name: "plan_name", type: "varchar" },
        ],
        primaryKey: ["account_id", "changed_on"],
        note: "One row per plan an account switched to, on the day it took effect; an account changes plan at most once a day.",
      },
    ],
    examples: [
      {
        Plan: [
          ["Mobile", 149],
          ["Basic", 199],
          ["Super", 199],
          ["Standard", 499],
          ["Premium", 649],
        ],
        PlanHistory: [
          [7001, "2024-01-04", "Mobile"],
          [7001, "2024-03-10", "Standard"],
          [7001, "2024-06-01", "Basic"],
          [7002, "2024-02-15", "Premium"],
          [7003, "2024-01-20", "Basic"],
          [7003, "2024-02-20", "Super"],
          [7003, "2024-05-02", "Premium"],
        ],
      },
    ],
    gen: (rng) => {
      const plans: [string, number][] = [["Mobile", 149], ["Basic", 199], ["Super", 199], ["Standard", 499], ["Premium", 649]];
      const rows: Cell[][] = [];
      const accounts = ri(rng, 1, 5);
      for (let a = 0; a < accounts; a++) {
        let day = dateBetween(rng, "2023-06-01", "2024-01-31");
        const k = ri(rng, 1, 5);
        for (let i = 0; i < k; i++) {
          rows.push([7001 + a, day, pick(rng, plans)[0]]);
          day = addDays(day, ri(rng, 1, 90));
        }
      }
      return { Plan: plans, PlanHistory: rows };
    },
    solution: [
      "WITH h AS (",
      "  SELECT account_id, changed_on, plan_name AS to_plan,",
      "         LAG(plan_name) OVER (PARTITION BY account_id ORDER BY changed_on) AS from_plan",
      "  FROM PlanHistory",
      ")",
      "SELECT h.account_id, h.changed_on, h.from_plan, h.to_plan,",
      "       CASE WHEN n.monthly_price > o.monthly_price THEN 'upgrade'",
      "            WHEN n.monthly_price < o.monthly_price THEN 'downgrade'",
      "            ELSE 'lateral' END AS direction",
      "FROM h",
      "JOIN Plan o ON o.plan_name = h.from_plan",
      "JOIN Plan n ON n.plan_name = h.to_plan",
      "ORDER BY h.account_id, h.changed_on",
    ].join("\n"),
    alternatives: [
      [
        "SELECT c.account_id, c.changed_on, p.plan_name AS from_plan, c.plan_name AS to_plan,",
        "       IF(nc.monthly_price > np.monthly_price, 'upgrade', IF(nc.monthly_price < np.monthly_price, 'downgrade', 'lateral')) AS direction",
        "FROM PlanHistory c",
        "JOIN PlanHistory p ON p.account_id = c.account_id",
        " AND p.changed_on = (SELECT MAX(x.changed_on) FROM PlanHistory x WHERE x.account_id = c.account_id AND x.changed_on < c.changed_on)",
        "JOIN Plan nc ON nc.plan_name = c.plan_name",
        "JOIN Plan np ON np.plan_name = p.plan_name",
        "ORDER BY c.account_id, c.changed_on",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Each row needs the plan from the account's previous row — that is what `LAG` returns.",
      "Partition the window by account and order it by date, so the previous row is the same account's.",
      "The sign-up row has no previous plan; an inner join on that NULL removes it for free.",
      "Look up both prices in `Plan` (join it twice) and compare them with `CASE`.",
    ],
    editorial: [
      "A change is a pair of consecutive rows of one account, so the natural tool is `LAG(plan_name) OVER (PARTITION BY account_id ORDER BY changed_on)`: on each row it returns the plan the account was on just before. The sign-up row gets NULL because nothing precedes it.",
      "",
      "Then join `Plan` twice — once for the old plan, once for the new — and compare the prices in a `CASE`. Because the old plan is joined with an inner join, the sign-up row (with `from_plan` NULL) matches no plan and drops out, which is exactly the \"sign-ups excluded\" rule. Two plans can cost the same (Basic and Super are both ₹199), and moving between them is `lateral`; moving to the *same* plan again would be lateral too.",
      "",
      "Without windows, the previous row is the one with the greatest `changed_on` before the current one, found by a correlated `MAX` and joined back. That is quadratic per account; the window plan is one sort by (account, date).",
    ].join("\n"),
  },

  {
    slug: "listeners-with-a-song-on-repeat",
    title: "Listeners With a Song on Repeat",
    difficulty: "MEDIUM",
    topics: ["Dates", "Aggregation"],
    description: [
      "The \"On Repeat\" playlist is seeded from songs a listener played **at least three times on the same calendar day**. Plays at 23:59 and 00:01 fall on different days.",
      "",
      "Return the columns `listener_id`, `track_id`, `play_date` (the day, as a date) and `plays` (that listener's plays of that track on that day) for every such listener, track and day. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Play",
        columns: [
          { name: "play_id", type: "int" },
          { name: "listener_id", type: "int" },
          { name: "track_id", type: "int" },
          { name: "played_at", type: "datetime" },
        ],
        primaryKey: ["play_id"],
        note: "One row per play; times are IST.",
      },
    ],
    examples: [
      {
        Play: [
          [1, 21, 501, "2024-08-03 08:10:00"],
          [2, 21, 501, "2024-08-03 13:45:00"],
          [3, 21, 501, "2024-08-03 23:59:00"],
          [4, 22, 502, "2024-08-03 22:00:00"],
          [5, 22, 502, "2024-08-03 23:30:00"],
          [6, 22, 502, "2024-08-04 00:01:00"],
          [7, 21, 503, "2024-08-03 09:00:00"],
          [8, 23, 501, "2024-08-05 18:00:00"],
          [9, 23, 501, "2024-08-05 18:04:00"],
          [10, 23, 501, "2024-08-05 18:08:00"],
          [11, 23, 501, "2024-08-05 18:12:00"],
        ],
      },
    ],
    gen: (rng) => {
      const m = chance(rng, 0.05) ? 0 : ri(rng, 6, 28);
      const days = ["2024-08-03", "2024-08-04"];
      return {
        Play: seq(1, m).map((id) => [id, ri(rng, 21, 23), ri(rng, 501, 502), at(pick(rng, days), pick(rng, [0, 1, 1438, 1439, ri(rng, 0, 1439)]))]),
      };
    },
    solution: [
      "SELECT listener_id, track_id, CAST(played_at AS DATE) AS play_date, COUNT(*) AS plays",
      "FROM Play",
      "GROUP BY listener_id, track_id, CAST(played_at AS DATE)",
      "HAVING COUNT(*) >= 3",
    ].join("\n"),
    alternatives: [
      "SELECT listener_id, track_id, play_date, COUNT(*) AS plays FROM (SELECT listener_id, track_id, DATE_FORMAT(played_at, '%Y-%m-%d') AS play_date FROM Play) p GROUP BY listener_id, track_id, play_date HAVING COUNT(*) > 2",
      "SELECT DISTINCT listener_id, track_id, d AS play_date, cnt AS plays FROM (SELECT listener_id, track_id, LEFT(played_at, 10) AS d, COUNT(*) OVER (PARTITION BY listener_id, track_id, LEFT(played_at, 10)) AS cnt FROM Play) x WHERE cnt >= 3",
    ],
    hints: [
      "Strip the time from `played_at` to get the calendar day.",
      "Group by listener, track and that day together.",
      "Filter groups, not rows: `HAVING COUNT(*) >= 3`.",
    ],
    editorial: [
      "\"Same calendar day\" means the timestamp's date part: `CAST(played_at AS DATE)` (or `DATE_FORMAT(played_at, '%Y-%m-%d')`, or the first ten characters of the fixed-format text) turns `2024-08-03 23:59:00` into `2024-08-03`. Grouping by (listener, track, day) puts each listener's plays of one track on one day into one group, and `HAVING COUNT(*) >= 3` keeps the busy ones.",
      "",
      "The midnight edge is where a rolling 24-hour window would disagree: listener 22's plays at 22:00, 23:30 and 00:01 are three plays within three hours, but they span two calendar days, so neither day reaches three. Grouping on the date handles it with no special case.",
      "",
      "The window alternative counts the group size on every row with `COUNT(*) OVER (PARTITION BY …)` and deduplicates with `DISTINCT`; it is the same partition, written differently. Both are one pass with a sort or hash on the three keys.",
    ].join("\n"),
  },

  {
    slug: "titles-licensed-in-every-region-on-launch-day",
    title: "Titles Licensed in Every Region on Launch Day",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation", "Dates"],
    description: [
      "Marketing plans a global push on **2024-07-01** and can only feature titles that are streamable in **every region** listed in `Region` that day. A licence covers a region from `starts_on` to `ends_on`, both included; `ends_on` NULL means the licence has no end date. A title can hold several licences for the same region.",
      "",
      "Return the column `title_name` for every qualifying title, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Title",
        columns: [
          { name: "title_id", type: "int" },
          { name: "title_name", type: "varchar" },
        ],
        primaryKey: ["title_id"],
        note: "One row per title in the global catalogue.",
      },
      {
        name: "Region",
        columns: [
          { name: "region_code", type: "char" },
          { name: "region_name", type: "varchar" },
        ],
        primaryKey: ["region_code"],
        note: "Every region the service launches in.",
      },
      {
        name: "Licence",
        columns: [
          { name: "licence_id", type: "int" },
          { name: "title_id", type: "int" },
          { name: "region_code", type: "char" },
          { name: "starts_on", type: "date" },
          { name: "ends_on", type: "date" },
        ],
        primaryKey: ["licence_id"],
        note: "A window during which a title may be streamed in a region. `ends_on` is NULL for an open-ended licence.",
      },
    ],
    examples: [
      {
        Title: [
          [1, "Monsoon Diaries"],
          [2, "Neon Bazaar"],
          [3, "The Quiet Coast"],
          [4, "Gully Kings"],
        ],
        Region: [
          ["IN", "India"],
          ["AE", "UAE"],
          ["SG", "Singapore"],
        ],
        Licence: [
          [1, 1, "IN", "2023-01-01", null],
          [2, 1, "AE", "2024-01-01", "2024-12-31"],
          [3, 1, "SG", "2024-07-01", "2025-06-30"],
          [4, 2, "IN", "2023-05-01", null],
          [5, 2, "AE", "2023-05-01", "2024-06-30"],
          [6, 2, "SG", "2023-05-01", null],
          [7, 3, "IN", "2024-01-01", "2024-07-01"],
          [8, 3, "IN", "2024-07-01", null],
          [9, 3, "AE", "2022-01-01", null],
          [10, 3, "SG", "2024-03-01", "2024-09-30"],
          [11, 4, "IN", "2024-01-01", null],
        ],
      },
    ],
    gen: (rng) => {
      const regions = sample(rng, [["IN", "India"], ["AE", "UAE"], ["SG", "Singapore"], ["GB", "United Kingdom"]], ri(rng, 1, 3));
      const n = ri(rng, 1, 6);
      const titles = sample(rng, SHOW_TITLES, n).map((t, i) => [i + 1, t]);
      const lic: Cell[][] = [];
      for (const t of titles) {
        for (const r of regions) {
          const k = chance(rng, 0.88) ? ri(rng, 1, 2) : 0;
          for (let i = 0; i < k; i++) {
            const start = pick(rng, ["2023-01-01", "2023-01-01", "2024-07-01", "2024-07-02", dateBetween(rng, "2023-01-01", "2024-07-31")]);
            const end = chance(rng, 0.45) ? null : pick(rng, ["2024-06-30", "2024-07-01", "2025-12-31", dateBetween(rng, start, "2025-12-31")]);
            if (end !== null && end < start) continue;
            lic.push([lic.length + 1, t[0]!, r[0]!, start, end]);
          }
        }
      }
      return { Title: titles, Region: regions, Licence: lic };
    },
    solution: [
      "SELECT t.title_name",
      "FROM Title t",
      "JOIN Licence l ON l.title_id = t.title_id",
      "WHERE l.starts_on <= '2024-07-01'",
      "  AND (l.ends_on IS NULL OR l.ends_on >= '2024-07-01')",
      "GROUP BY t.title_id, t.title_name",
      "HAVING COUNT(DISTINCT l.region_code) = (SELECT COUNT(*) FROM Region)",
    ].join("\n"),
    alternatives: [
      [
        "SELECT t.title_name FROM Title t",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM Region r WHERE NOT EXISTS (",
        "    SELECT 1 FROM Licence l WHERE l.title_id = t.title_id AND l.region_code = r.region_code",
        "      AND '2024-07-01' BETWEEN l.starts_on AND COALESCE(l.ends_on, '9999-12-31')))",
      ].join("\n"),
    ],
    hints: [
      "First keep only the licences that are live on 2024-07-01 — mind the NULL end date.",
      "A title qualifies when the number of *different* regions it is live in equals the number of regions.",
      "Two licences for one region must not count twice: `COUNT(DISTINCT …)`.",
      "Another way to say it: there is no region where the title has no live licence.",
    ],
    editorial: [
      "This is **relational division**: titles related to *all* rows of another table. The counting form filters licences to the ones live on the launch day — `starts_on <= '2024-07-01'` and either no end date or `ends_on >= '2024-07-01'` — groups by title, and keeps the titles whose number of distinct live regions equals the total number of regions, which a scalar subquery supplies.",
      "",
      "Two details matter. `ends_on` NULL means \"no end\", and `NULL >= date` is never true, so the open-ended case needs its own `IS NULL` test (or `COALESCE` with a far-future date). And a title can have two live licences for India; `COUNT(DISTINCT region_code)` stops that from making up for a missing region.",
      "",
      "The double `NOT EXISTS` reads as the definition: keep the title if there is no region for which no live licence exists. It never counts, so duplicates are harmless. Both forms are linear in the licences with indexes on `(title_id, region_code)`.",
    ].join("\n"),
  },

  {
    slug: "playlist-length-as-clock-time",
    title: "Playlist Length as Clock Time",
    difficulty: "MEDIUM",
    topics: ["Strings", "Aggregation", "Joins"],
    description: [
      "The playlist header shows how many tracks a playlist holds and how long it plays, written as a clock: `H:MM:SS`, where the hours are **not padded** and the minutes and seconds always have two digits (3,725 seconds is `1:02:05`, 59 seconds is `0:00:59`).",
      "",
      "Return every playlist, including empty ones, with the columns `playlist_name`, `track_count` and `total_length` (an empty playlist is `0:00:00`). Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Playlist",
        columns: [
          { name: "playlist_id", type: "int" },
          { name: "playlist_name", type: "varchar" },
          { name: "owner_id", type: "int" },
        ],
        primaryKey: ["playlist_id"],
        note: "One row per playlist.",
      },
      {
        name: "Track",
        columns: [
          { name: "track_id", type: "int" },
          { name: "title", type: "varchar" },
          { name: "duration_secs", type: "int" },
        ],
        primaryKey: ["track_id"],
        note: "One row per track; `duration_secs` is its length in whole seconds.",
      },
      {
        name: "PlaylistTrack",
        columns: [
          { name: "playlist_id", type: "int" },
          { name: "position", type: "int" },
          { name: "track_id", type: "int" },
        ],
        primaryKey: ["playlist_id", "position"],
        note: "The tracks of a playlist in order; the same track may appear twice in one playlist, and each appearance plays.",
      },
    ],
    examples: [
      {
        Playlist: [
          [1, "Monsoon Chill", 41],
          [2, "Gym Hip-Hop", 42],
          [3, "Long Drive", 41],
          [4, "Sleep Sounds", 43],
        ],
        Track: [
          [101, "Baarish", 214],
          [102, "Safar", 198],
          [103, "Raat", 1800],
          [104, "Jugnu", 59],
        ],
        PlaylistTrack: [
          [1, 1, 101],
          [1, 2, 102],
          [2, 1, 104],
          [3, 1, 103],
          [3, 2, 103],
          [3, 3, 101],
        ],
      },
    ],
    gen: (rng) => {
      const p = ri(rng, 1, 5);
      const playlists = seq(1, p).map((id) => [id, pick(rng, ["Monsoon Chill", "Gym Hip-Hop", "Long Drive", "Sleep Sounds", "Focus Flow", "Retro Bollywood"]), ri(rng, 41, 45)]);
      const t = ri(rng, 1, 6);
      const tracks = seq(101, t).map((id) => [id, pick(rng, SONG_WORDS), pick(rng, [59, 60, 600, 3599, 3600, ri(rng, 30, 2400)])]);
      const links: Cell[][] = [];
      for (const pl of playlists) {
        const k = chance(rng, 0.2) ? 0 : ri(rng, 1, 5);
        for (let i = 1; i <= k; i++) links.push([pl[0]!, i, ri(rng, 101, 100 + t)]);
      }
      return { Playlist: playlists, Track: tracks, PlaylistTrack: links };
    },
    solution: [
      "WITH totals AS (",
      "  SELECT p.playlist_id, p.playlist_name, COUNT(pt.track_id) AS track_count,",
      "         COALESCE(SUM(t.duration_secs), 0) AS secs",
      "  FROM Playlist p",
      "  LEFT JOIN PlaylistTrack pt ON pt.playlist_id = p.playlist_id",
      "  LEFT JOIN Track t ON t.track_id = pt.track_id",
      "  GROUP BY p.playlist_id, p.playlist_name",
      ")",
      "SELECT playlist_name, track_count,",
      "       CONCAT(secs DIV 3600, ':', LPAD(secs DIV 60 - (secs DIV 3600) * 60, 2, '0'), ':', LPAD(secs - (secs DIV 60) * 60, 2, '0')) AS total_length",
      "FROM totals",
    ].join("\n"),
    alternatives: [
      [
        "SELECT p.playlist_name, COALESCE(s.n, 0) AS track_count,",
        "       CONCAT(COALESCE(s.secs, 0) DIV 3600, ':', RIGHT(CONCAT('0', (COALESCE(s.secs, 0) DIV 60 - (COALESCE(s.secs, 0) DIV 3600) * 60)), 2), ':', RIGHT(CONCAT('0', COALESCE(s.secs, 0) - (COALESCE(s.secs, 0) DIV 60) * 60), 2)) AS total_length",
        "FROM Playlist p LEFT JOIN (",
        "  SELECT pt.playlist_id, COUNT(*) AS n, SUM(t.duration_secs) AS secs FROM PlaylistTrack pt JOIN Track t ON t.track_id = pt.track_id GROUP BY pt.playlist_id",
        ") s ON s.playlist_id = p.playlist_id",
      ].join("\n"),
    ],
    hints: [
      "Get the total seconds per playlist first; format it afterwards.",
      "Start from `Playlist` with LEFT JOINs so empty playlists stay — and turn their NULL sum into 0.",
      "Hours are `secs DIV 3600`; minutes are what is left of the hour, divided by 60; seconds are what is left after the whole minutes.",
      "`LPAD(x, 2, '0')` pads a number to two digits.",
    ],
    editorial: [
      "Split the job in two. **Aggregate**: LEFT JOIN `Playlist` to `PlaylistTrack` and on to `Track`, then group by playlist; `COUNT(pt.track_id)` counts appearances (0 for an empty playlist, because `COUNT` of a column skips NULL) and `SUM(duration_secs)` totals the seconds, wrapped in `COALESCE(…, 0)` since the sum over no rows is NULL. A track listed twice is counted and timed twice, as the statement says.",
      "",
      "**Format**: integer division and remainder break the seconds into a clock. `secs DIV 3600` is the hours; `secs DIV 60 - hours * 60` the minutes within the hour; `secs - (secs DIV 60) * 60` the seconds (MySQL's `MOD(secs, 60)` says the same). `LPAD(…, 2, '0')` gives the two-digit fields, and `CONCAT` joins them with colons. The hours are left as they are, so 36,000 seconds read `10:00:00`.",
      "",
      "`RIGHT(CONCAT('0', x), 2)` is an older padding trick that works for values under 100. Using `DIV` rather than `/` matters: `/` is decimal division in MySQL and would print `1.0347` hours. The cost is one pass over the playlist entries.",
    ].join("\n"),
  },

  {
    slug: "signup-channels-by-first-week-activation",
    title: "Sign-Up Channels by First-Week Activation",
    difficulty: "MEDIUM",
    topics: ["Dates", "Joins", "Aggregation"],
    description: [
      "Growth compares acquisition channels by how quickly new accounts start watching. An account is **activated** when its first watch session started **within 7 days of sign-up** — at most 7 calendar days after `signed_up_on` (the sign-up day itself counts as day 0). Accounts that never streamed are not activated.",
      "",
      "Return one row per `signup_channel` with the columns `signup_channel`, `signups` and `activated_pct` (activated accounts as a percentage of `signups`, **rounded to 2 decimal places**). Order by `activated_pct` from highest to lowest, then by `signup_channel`.",
    ].join("\n"),
    tables: [
      {
        name: "Account",
        columns: [
          { name: "account_id", type: "int" },
          { name: "signed_up_on", type: "date" },
          { name: "signup_channel", type: "enum", values: ["organic", "referral", "telecom_bundle", "paid_social"] },
        ],
        primaryKey: ["account_id"],
        note: "One row per account; `telecom_bundle` accounts came free with a mobile recharge pack.",
      },
      {
        name: "WatchSession",
        columns: [
          { name: "session_id", type: "int" },
          { name: "account_id", type: "int" },
          { name: "started_at", type: "datetime" },
        ],
        primaryKey: ["session_id"],
        note: "One row per playback session; sessions never start before the account's sign-up day.",
      },
    ],
    examples: [
      {
        Account: [
          [1, "2024-03-01", "organic"],
          [2, "2024-03-01", "telecom_bundle"],
          [3, "2024-03-05", "telecom_bundle"],
          [4, "2024-03-07", "referral"],
          [5, "2024-03-09", "organic"],
          [6, "2024-03-10", "telecom_bundle"],
        ],
        WatchSession: [
          [1, 1, "2024-03-01 21:00:00"],
          [2, 2, "2024-03-08 23:59:00"],
          [3, 2, "2024-03-02 10:00:00"],
          [4, 3, "2024-03-13 08:00:00"],
          [5, 4, "2024-03-20 19:30:00"],
          [6, 5, "2024-03-16 07:15:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const channels = ["organic", "referral", "telecom_bundle", "paid_social"] as const;
      const accounts = seq(1, n).map((id) => [id, dateBetween(rng, "2024-03-01", "2024-03-31"), pick(rng, channels)] as [number, string, string]);
      const sessions: Cell[][] = [];
      for (const [id, day] of accounts) {
        const k = chance(rng, 0.25) ? 0 : ri(rng, 1, 3);
        for (let i = 0; i < k; i++) sessions.push([sessions.length + 1, id, at(addDays(day, pick(rng, [0, 7, 8, ri(rng, 0, 20)])), ri(rng, 0, 1439))]);
      }
      return { Account: accounts, WatchSession: sessions };
    },
    solution: [
      "WITH firsts AS (",
      "  SELECT a.account_id, a.signup_channel, a.signed_up_on, MIN(w.started_at) AS first_stream",
      "  FROM Account a",
      "  LEFT JOIN WatchSession w ON w.account_id = a.account_id",
      "  GROUP BY a.account_id, a.signup_channel, a.signed_up_on",
      ")",
      "SELECT signup_channel, COUNT(*) AS signups,",
      "       ROUND(100 * SUM(CASE WHEN DATEDIFF(first_stream, signed_up_on) <= 7 THEN 1 ELSE 0 END) / COUNT(*), 2) AS activated_pct",
      "FROM firsts",
      "GROUP BY signup_channel",
      "ORDER BY activated_pct DESC, signup_channel",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.signup_channel, COUNT(*) AS signups,",
        "       ROUND(100 * SUM(CASE WHEN EXISTS (SELECT 1 FROM WatchSession w WHERE w.account_id = a.account_id AND w.started_at < DATE_ADD(a.signed_up_on, INTERVAL 8 DAY)) THEN 1 ELSE 0 END) / COUNT(*), 2) AS activated_pct",
        "FROM Account a GROUP BY a.signup_channel",
        "ORDER BY activated_pct DESC, a.signup_channel",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Find each account's first session with `MIN(started_at)` — keep accounts without sessions using a LEFT JOIN.",
      "`DATEDIFF` ignores the time of day, so a session at 23:59 on day 7 still counts.",
      "A NULL first session makes the DATEDIFF NULL — make sure it lands in the \"not activated\" branch.",
      "Then group by channel and turn the flag into a percentage.",
    ],
    editorial: [
      "First reduce sessions to one fact per account: the first session, `MIN(started_at)`. A LEFT JOIN keeps accounts with no session at all (their minimum is NULL), which matters because they still count as sign-ups in the denominator.",
      "",
      "An account is activated when `DATEDIFF(first_stream, signed_up_on) <= 7`. `DATEDIFF` compares calendar dates, ignoring the time, so day 0 is the sign-up day and a session late on day 7 still counts while one on day 8 does not. For an account that never streamed the difference is NULL, the `CASE` condition is not true, and the account falls into `ELSE 0`.",
      "",
      "Then group by channel: `COUNT(*)` sign-ups and `100 * activated / signups`, rounded. The `EXISTS` alternative skips the minimum entirely — any session before midnight at the start of day 8 means the first one was early enough. Both are linear in sessions with an index on `account_id`.",
    ].join("\n"),
  },

  {
    slug: "monthly-subscription-revenue-running-total",
    title: "Monthly Subscription Revenue With a Running Total",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates"],
    description: [
      "Finance tracks the year's subscription revenue month by month. Only payments with `status` = `success` are revenue; failed and refunded payments are ignored.",
      "",
      "Return one row per calendar month that has any successful payment, with the columns `month` (as `YYYY-MM`), `revenue` (that month's successful payments in rupees) and `running_revenue` (the sum of `revenue` over this month and every earlier month in the table). Order the rows by `month`.",
    ].join("\n"),
    tables: [
      {
        name: "Payment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "account_id", type: "int" },
          { name: "paid_on", type: "date" },
          { name: "amount_inr", type: "int" },
          { name: "status", type: "enum", values: ["success", "failed", "refunded"] },
        ],
        primaryKey: ["payment_id"],
        note: "One row per renewal charge attempt, via UPI autopay or card.",
      },
    ],
    examples: [
      {
        Payment: [
          [1, 9001, "2024-01-05", 199, "success"],
          [2, 9002, "2024-01-18", 649, "success"],
          [3, 9003, "2024-01-30", 499, "failed"],
          [4, 9001, "2024-02-05", 199, "success"],
          [5, 9002, "2024-02-18", 649, "refunded"],
          [6, 9003, "2024-04-01", 499, "success"],
          [7, 9004, "2024-04-29", 149, "success"],
        ],
      },
    ],
    gen: (rng) => {
      const m = chance(rng, 0.06) ? 0 : ri(rng, 1, 20);
      return {
        Payment: seq(1, m).map((id) => [
          id, ri(rng, 9001, 9010), dateBetween(rng, "2024-01-01", "2024-06-30"), pick(rng, [149, 199, 499, 649]),
          pick(rng, ["success", "success", "success", "failed", "refunded"] as const),
        ]),
      };
    },
    solution: [
      "WITH monthly AS (",
      "  SELECT DATE_FORMAT(paid_on, '%Y-%m') AS month, SUM(amount_inr) AS revenue",
      "  FROM Payment",
      "  WHERE status = 'success'",
      "  GROUP BY DATE_FORMAT(paid_on, '%Y-%m')",
      ")",
      "SELECT month, revenue,",
      "       SUM(revenue) OVER (ORDER BY month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_revenue",
      "FROM monthly",
      "ORDER BY month",
    ].join("\n"),
    alternatives: [
      [
        "WITH monthly AS (SELECT LEFT(paid_on, 7) AS month, SUM(amount_inr) AS revenue FROM Payment WHERE status = 'success' GROUP BY LEFT(paid_on, 7))",
        "SELECT m.month, m.revenue, (SELECT SUM(x.revenue) FROM monthly x WHERE x.month <= m.month) AS running_revenue FROM monthly m ORDER BY m.month",
      ].join("\n"),
      [
        "WITH monthly AS (SELECT LEFT(paid_on, 7) AS month, SUM(amount_inr) AS revenue FROM Payment WHERE status = 'success' GROUP BY LEFT(paid_on, 7))",
        "SELECT a.month, a.revenue, SUM(b.revenue) AS running_revenue FROM monthly a JOIN monthly b ON b.month <= a.month GROUP BY a.month, a.revenue ORDER BY a.month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Build the monthly totals first, keeping only successful payments.",
      "A running total is `SUM(...) OVER (ORDER BY month)` over those monthly rows.",
      "Months are unique after grouping, so the frame is unambiguous — but spelling it out with `ROWS` never hurts.",
    ],
    editorial: [
      "Two levels of aggregation. The inner query groups successful payments by month (`DATE_FORMAT(paid_on, '%Y-%m')`) to get each month's revenue; the status filter belongs in its `WHERE`, so refunds and failures never enter any sum.",
      "",
      "The running total is a window over those monthly rows: `SUM(revenue) OVER (ORDER BY month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` adds every month up to the current one. Month labels are unique after grouping, so the default `RANGE` frame would give the same answer, but naming the frame makes the intent explicit. A month with no successful payment simply has no row — March here — and the running total carries straight over it.",
      "",
      "Before window functions this was written as a correlated subquery or a self join on `b.month <= a.month`, both quadratic in the number of months; with only twelve months a year that is harmless, but the window is one sort.",
    ].join("\n"),
  },

  {
    slug: "binge-watch-runs",
    title: "Binge-Watch Runs of Three or More Episodes",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "Take each profile's sessions in order of `started_at`. A session **continues a run** when it is the same series as the profile's previous session and starts **no more than 15 minutes** after that previous session's `ended_at`; otherwise it starts a new run. A run of **at least 3 sessions** is a binge.",
      "",
      "Return every binge with the columns `profile_id`, `series_name`, `binge_start` (the `started_at` of its first session) and `episodes` (its number of sessions). Order by `profile_id`, then `binge_start`.",
    ].join("\n"),
    tables: [
      {
        name: "WatchSession",
        columns: [
          { name: "session_id", type: "int" },
          { name: "profile_id", type: "int" },
          { name: "series_name", type: "varchar" },
          { name: "started_at", type: "datetime" },
          { name: "ended_at", type: "datetime" },
        ],
        primaryKey: ["session_id"],
        note: "One row per episode watched. A profile's sessions never overlap, and times are whole minutes.",
      },
    ],
    examples: [
      {
        WatchSession: [
          [1, 1, "Coastal Cops", "2024-05-10 20:00:00", "2024-05-10 20:45:00"],
          [2, 1, "Coastal Cops", "2024-05-10 20:50:00", "2024-05-10 21:35:00"],
          [3, 1, "Coastal Cops", "2024-05-10 21:50:00", "2024-05-10 22:35:00"],
          [4, 1, "Coastal Cops", "2024-05-10 22:51:00", "2024-05-10 23:36:00"],
          [5, 2, "Backbenchers", "2024-05-11 13:00:00", "2024-05-11 13:22:00"],
          [6, 2, "Backbenchers", "2024-05-11 13:25:00", "2024-05-11 13:47:00"],
          [7, 2, "Hill Station", "2024-05-11 13:50:00", "2024-05-11 14:30:00"],
          [8, 2, "Backbenchers", "2024-05-11 14:31:00", "2024-05-11 14:53:00"],
          [9, 3, "Gully Kings", "2024-05-12 23:30:00", "2024-05-12 23:58:00"],
          [10, 3, "Gully Kings", "2024-05-13 00:05:00", "2024-05-13 00:33:00"],
          [11, 3, "Gully Kings", "2024-05-13 00:40:00", "2024-05-13 01:08:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const profiles = ri(rng, 1, 3);
      for (let p = 1; p <= profiles; p++) {
        let minute = ri(rng, 18 * 60, 22 * 60);
        const base = dateBetween(rng, "2024-05-01", "2024-05-20");
        const shows = sample(rng, SHOW_TITLES, 2);
        const k = ri(rng, 1, 9);
        for (let i = 0; i < k; i++) {
          const len = ri(rng, 20, 50);
          rows.push([rows.length + 1, p, chance(rng, 0.85) ? shows[0]! : shows[1]!, at(base, minute), at(base, minute + len)]);
          minute += len + pick(rng, [2, 5, 10, 15, 16, ri(rng, 0, 120)]);
        }
      }
      return { WatchSession: shuffle(rng, rows).map((r, i) => [i + 1, ...r.slice(1)]) };
    },
    solution: [
      "WITH ordered AS (",
      "  SELECT profile_id, series_name, started_at,",
      "         LAG(series_name) OVER (PARTITION BY profile_id ORDER BY started_at) AS prev_series,",
      "         LAG(ended_at) OVER (PARTITION BY profile_id ORDER BY started_at) AS prev_end",
      "  FROM WatchSession",
      "), flagged AS (",
      "  SELECT profile_id, series_name, started_at,",
      "         CASE WHEN prev_series = series_name",
      "                   AND TIMESTAMPDIFF(MINUTE, prev_end, started_at) <= 15 THEN 0 ELSE 1 END AS new_run",
      "  FROM ordered",
      "), runs AS (",
      "  SELECT profile_id, series_name, started_at,",
      "         SUM(new_run) OVER (PARTITION BY profile_id ORDER BY started_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS run_no",
      "  FROM flagged",
      ")",
      "SELECT profile_id, MIN(series_name) AS series_name, MIN(started_at) AS binge_start, COUNT(*) AS episodes",
      "FROM runs",
      "GROUP BY profile_id, run_no",
      "HAVING COUNT(*) >= 3",
      "ORDER BY profile_id, binge_start",
    ].join("\n"),
    alternatives: [
      [
        "WITH s AS (",
        "  SELECT profile_id, series_name, started_at,",
        "         CASE WHEN LAG(series_name) OVER w = series_name",
        "               AND started_at <= DATE_ADD(LAG(ended_at) OVER w, INTERVAL 15 MINUTE)",
        "              THEN NULL ELSE started_at END AS run_mark",
        "  FROM WatchSession",
        "  WINDOW w AS (PARTITION BY profile_id ORDER BY started_at)",
        "), r AS (",
        "  SELECT profile_id, series_name,",
        "         MAX(run_mark) OVER (PARTITION BY profile_id ORDER BY started_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS binge_start",
        "  FROM s",
        ")",
        "SELECT profile_id, series_name, binge_start, COUNT(*) AS episodes",
        "FROM r GROUP BY profile_id, series_name, binge_start HAVING COUNT(*) >= 3",
        "ORDER BY profile_id, binge_start",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Compare each session with the profile's previous one — `LAG` over `PARTITION BY profile_id ORDER BY started_at`.",
      "Mark the sessions that *start* a run with 1 and the ones that continue with 0. The first session of a profile has no previous row: what should it be?",
      "A running `SUM` of those marks numbers the runs; group by it.",
      "A run has one series by construction, so any aggregate of `series_name` (or the run's first start time as the key) recovers it.",
    ],
    editorial: [
      "This is **sessionisation**, a gaps-and-islands problem with a custom break rule. Order each profile's sessions by start time and look one row back with `LAG`: the previous session's series and end time. A session continues the run only when the series is the same *and* the gap from the previous end is at most 15 minutes; anything else — a different show in between, a longer break, or no previous row at all (LAG gives NULL, so the condition is not true) — starts a new run and gets flag 1.",
      "",
      "A running `SUM` of the flags over the same ordering gives every session the number of the run it belongs to; grouping by (profile, run number) collapses each run to one row. `COUNT(*) >= 3` keeps the binges, `MIN(started_at)` is the start, and because every session of a run shares the series, `MIN(series_name)` simply returns it while satisfying `ONLY_FULL_GROUP_BY`.",
      "",
      "The edges in the example: profile 2 watched two *Backbenchers* episodes, switched to *Hill Station*, then came back — three episodes of one show, but not in a row, so no binge. Profile 1's fourth episode starts 16 minutes after the third ended, one minute too late, which leaves a run of exactly three. Profile 3's run crosses midnight, which the timestamp arithmetic handles. The alternative carries the run's first start forward with a running `MAX` instead of numbering runs. Both are one sort per profile.",
    ].join("\n"),
  },

  {
    slug: "longest-daily-listening-streak",
    title: "Longest Daily Listening Streak per Listener",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Subqueries"],
    description: [
      "The music app's year-in-review card shows each listener's **longest streak**: the most consecutive calendar days with at least one play. Several plays on one day count once.",
      "",
      "Return one row per listener who has any play, with the columns `listener_id`, `longest_streak` (in days) and `streak_start` (the first day of that streak; if two streaks are equally long, the **earliest** one). Order by `listener_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Play",
        columns: [
          { name: "play_id", type: "int" },
          { name: "listener_id", type: "int" },
          { name: "played_at", type: "datetime" },
        ],
        primaryKey: ["play_id"],
        note: "One row per play.",
      },
    ],
    examples: [
      {
        Play: [
          [1, 31, "2024-12-01 08:00:00"],
          [2, 31, "2024-12-02 22:15:00"],
          [3, 31, "2024-12-02 23:40:00"],
          [4, 31, "2024-12-03 07:05:00"],
          [5, 31, "2024-12-06 19:00:00"],
          [6, 32, "2024-12-01 10:00:00"],
          [7, 32, "2024-12-02 10:00:00"],
          [8, 32, "2024-12-05 10:00:00"],
          [9, 32, "2024-12-06 10:00:00"],
          [10, 33, "2024-12-04 23:59:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const listeners = ri(rng, 1, 4);
      for (let l = 0; l < listeners; l++) {
        const days = sample(rng, seq(0, 12), ri(rng, 1, 9));
        for (const d of days) {
          const k = chance(rng, 0.25) ? 2 : 1;
          for (let i = 0; i < k; i++) rows.push([0, 31 + l, at(addDays("2024-12-01", d), ri(rng, 0, 1439))]);
        }
      }
      return { Play: shuffle(rng, rows).map((r, i) => [i + 1, ...r.slice(1)]) };
    },
    solution: [
      "WITH days AS (",
      "  SELECT DISTINCT listener_id, CAST(played_at AS DATE) AS d FROM Play",
      "), islands AS (",
      "  SELECT listener_id, d,",
      "         DATEDIFF(d, '2000-01-01') - ROW_NUMBER() OVER (PARTITION BY listener_id ORDER BY d) AS grp",
      "  FROM days",
      "), streaks AS (",
      "  SELECT listener_id, MIN(d) AS streak_start, COUNT(*) AS streak_len",
      "  FROM islands",
      "  GROUP BY listener_id, grp",
      "), ranked AS (",
      "  SELECT listener_id, streak_start, streak_len,",
      "         ROW_NUMBER() OVER (PARTITION BY listener_id ORDER BY streak_len DESC, streak_start) AS rn",
      "  FROM streaks",
      ")",
      "SELECT listener_id, streak_len AS longest_streak, streak_start",
      "FROM ranked",
      "WHERE rn = 1",
      "ORDER BY listener_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH days AS (SELECT DISTINCT listener_id, LEFT(played_at, 10) AS d FROM Play),",
        "starts AS (",
        "  SELECT a.listener_id, a.d FROM days a",
        "  WHERE NOT EXISTS (SELECT 1 FROM days b WHERE b.listener_id = a.listener_id AND b.d = DATE_SUB(a.d, INTERVAL 1 DAY))",
        "),",
        "streaks AS (",
        "  SELECT s.listener_id, s.d AS streak_start,",
        "         (SELECT COUNT(*) FROM days x WHERE x.listener_id = s.listener_id AND x.d >= s.d",
        "            AND x.d < COALESCE((SELECT MIN(e.d) FROM starts e WHERE e.listener_id = s.listener_id AND e.d > s.d), '9999-12-31')) AS streak_len",
        "  FROM starts s",
        ")",
        "SELECT listener_id, streak_len AS longest_streak, MIN(streak_start) AS streak_start",
        "FROM streaks t",
        "WHERE streak_len = (SELECT MAX(u.streak_len) FROM streaks u WHERE u.listener_id = t.listener_id)",
        "GROUP BY listener_id, streak_len",
        "ORDER BY listener_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Reduce plays to distinct (listener, day) pairs first — the time of day and repeat plays do not matter.",
      "Number each listener's days in order. For consecutive days, the date minus that row number stays constant.",
      "Group by that constant to get every streak with its length and first day.",
      "Pick the longest streak per listener, breaking ties by the earlier start.",
    ],
    editorial: [
      "The classic **gaps-and-islands** trick. Once plays are reduced to distinct (listener, day) pairs, number each listener's days with `ROW_NUMBER()` in date order. Along a run of consecutive days the date goes up by one and so does the row number, so `day_number − row_number` is the same for every day of the run and changes after any gap. Here the day number is `DATEDIFF(d, '2000-01-01')`, which keeps the subtraction in plain integers.",
      "",
      "Grouping by (listener, that difference) yields one row per streak: `COUNT(*)` days long, starting at `MIN(d)`. Then a second `ROW_NUMBER()` per listener ordered by length descending and start ascending picks the longest, with the earliest start winning a tie — listener 32 has two two-day streaks and the one from 1 December is reported. The `DISTINCT` step matters: two plays on one day would otherwise take two row numbers and break the arithmetic.",
      "",
      "Without windows, a streak starts on a day whose previous day has no play (`NOT EXISTS`), and its length counts the days up to the next start. That form is quadratic; the window plan is two sorts per listener.",
    ].join("\n"),
  },

  {
    slug: "viewer-signup-cohort-next-month-retention",
    title: "Next-Month Viewing Retention of Streaming Sign-Up Cohorts",
    difficulty: "HARD",
    topics: ["Dates", "Subqueries", "Aggregation"],
    description: [
      "Accounts are grouped into **cohorts by the calendar month they signed up in**. An account is **retained** when it has at least one watch session in the **calendar month right after** its sign-up month (an account that signed up any day in January is retained if it watched anything from 1 to 29 February). Sessions in the sign-up month itself, or two months later, do not count.",
      "",
      "Return one row per cohort with the columns `cohort_month` (as `YYYY-MM`), `cohort_size` and `retained_pct` (retained accounts as a percentage of `cohort_size`, **rounded to 2 decimal places**). Order by `cohort_month`.",
    ].join("\n"),
    tables: [
      {
        name: "Account",
        columns: [
          { name: "account_id", type: "int" },
          { name: "signed_up_on", type: "date" },
        ],
        primaryKey: ["account_id"],
        note: "One row per account.",
      },
      {
        name: "WatchSession",
        columns: [
          { name: "session_id", type: "int" },
          { name: "account_id", type: "int" },
          { name: "started_at", type: "datetime" },
        ],
        primaryKey: ["session_id"],
        note: "One row per playback session; `account_id` always names a row of `Account`.",
      },
    ],
    examples: [
      {
        Account: [
          [1, "2024-01-03"],
          [2, "2024-01-31"],
          [3, "2024-01-15"],
          [4, "2024-02-10"],
          [5, "2024-02-28"],
          [6, "2024-03-01"],
        ],
        WatchSession: [
          [1, 1, "2024-01-03 20:00:00"],
          [2, 1, "2024-02-14 21:00:00"],
          [3, 2, "2024-02-01 00:30:00"],
          [4, 2, "2024-02-02 19:00:00"],
          [5, 3, "2024-03-05 18:00:00"],
          [6, 4, "2024-03-31 23:59:00"],
          [7, 5, "2024-02-29 10:00:00"],
          [8, 6, "2024-04-02 09:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const accounts = seq(1, n).map((id) => [id, pick(rng, ["2024-01-31", "2024-02-01", dateBetween(rng, "2024-01-01", "2024-03-31")])] as [number, string]);
      const sessions: Cell[][] = [];
      for (const [id, day] of accounts) {
        const k = chance(rng, 0.2) ? 0 : ri(rng, 1, 3);
        for (let i = 0; i < k; i++) sessions.push([sessions.length + 1, id, at(addDays(day, ri(rng, 0, 65)), ri(rng, 0, 1439))]);
      }
      return { Account: accounts, WatchSession: shuffle(rng, sessions).map((r, i) => [i + 1, ...r.slice(1)]) };
    },
    solution: [
      "WITH cohort AS (",
      "  SELECT account_id,",
      "         DATE_FORMAT(signed_up_on, '%Y-%m') AS cohort_month,",
      "         DATE_FORMAT(DATE_ADD(signed_up_on, INTERVAL 1 MONTH), '%Y-%m') AS next_month",
      "  FROM Account",
      "), flags AS (",
      "  SELECT c.cohort_month,",
      "         CASE WHEN EXISTS (SELECT 1 FROM WatchSession w",
      "                           WHERE w.account_id = c.account_id",
      "                             AND DATE_FORMAT(w.started_at, '%Y-%m') = c.next_month) THEN 1 ELSE 0 END AS retained",
      "  FROM cohort c",
      ")",
      "SELECT cohort_month, COUNT(*) AS cohort_size, ROUND(100 * SUM(retained) / COUNT(*), 2) AS retained_pct",
      "FROM flags",
      "GROUP BY cohort_month",
      "ORDER BY cohort_month",
    ].join("\n"),
    alternatives: [
      [
        "SELECT LEFT(a.signed_up_on, 7) AS cohort_month, COUNT(*) AS cohort_size,",
        "       ROUND(100 * COUNT(r.account_id) / COUNT(*), 2) AS retained_pct",
        "FROM Account a",
        "LEFT JOIN (",
        "  SELECT DISTINCT w.account_id FROM WatchSession w JOIN Account x ON x.account_id = w.account_id",
        "  WHERE TIMESTAMPDIFF(MONTH, DATE_FORMAT(x.signed_up_on, '%Y-%m-01'), DATE_FORMAT(w.started_at, '%Y-%m-01')) = 1",
        ") r ON r.account_id = a.account_id",
        "GROUP BY LEFT(a.signed_up_on, 7)",
        "ORDER BY cohort_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Label every account with two months: its sign-up month and the month after it.",
      "Adding one month to 31 January lands in February — `DATE_ADD(…, INTERVAL 1 MONTH)` handles short months for you; only the `YYYY-MM` part matters.",
      "Per account, ask a yes/no question — is there a session in the next month? `EXISTS` answers it without duplicating the account.",
      "Then aggregate the 1/0 flags per cohort.",
    ],
    editorial: [
      "Retention is a property of the **account**, so compute it per account first and aggregate second. Each account gets its cohort label, `DATE_FORMAT(signed_up_on, '%Y-%m')`, and the label of the month that follows. `DATE_ADD(signed_up_on, INTERVAL 1 MONTH)` clamps to the end of a shorter month (31 January → 29 February), so its `YYYY-MM` is always the next calendar month — adding 30 days instead would jump from 31 January into March.",
      "",
      "Whether the account was retained is then a yes/no question: `EXISTS` a session whose month label equals the next-month label. Using `EXISTS` (or a `DISTINCT` list of retained accounts) keeps an account with several sessions from being counted several times; a plain join from accounts to sessions would inflate both the cohort size and the retained count.",
      "",
      "Finally group by cohort: `COUNT(*)` is the size and `100 * SUM(flag) / COUNT(*)` the rate, rounded. The alternative computes the month distance directly with `TIMESTAMPDIFF(MONTH, …)` on first-of-month dates. Sign-up-month and two-months-later sessions fall outside both tests. The cost is one probe into sessions per account with an index on `account_id`.",
    ].join("\n"),
  },

  {
    slug: "median-session-length-by-device",
    title: "Median Session Length by Device",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation", "Subqueries"],
    description: [
      "Product wants the **median** minutes watched per session on each device type — averages are skewed by people who leave the TV on overnight. For an odd number of sessions the median is the middle value; for an even number it is the average of the two middle values. Equal values are ordinary values in the ordering.",
      "",
      "Return one row per device that has sessions, with the columns `device`, `sessions` and `median_minutes` (**rounded to 2 decimal places**). Order by `device`.",
    ].join("\n"),
    tables: [
      {
        name: "WatchSession",
        columns: [
          { name: "session_id", type: "int" },
          { name: "profile_id", type: "int" },
          { name: "device", type: "enum", values: ["tv", "mobile", "web", "tablet"] },
          { name: "watched_minutes", type: "int" },
        ],
        primaryKey: ["session_id"],
        note: "One row per playback session.",
      },
    ],
    examples: [
      {
        WatchSession: [
          [1, 1, "tv", 42],
          [2, 2, "tv", 300],
          [3, 3, "tv", 55],
          [4, 1, "mobile", 12],
          [5, 4, "mobile", 25],
          [6, 2, "mobile", 9],
          [7, 3, "mobile", 31],
          [8, 4, "web", 18],
          [9, 1, "web", 18],
        ],
      },
    ],
    gen: (rng) => {
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 22);
      return {
        WatchSession: seq(1, m).map((id) => [id, ri(rng, 1, 8), pick(rng, ["tv", "mobile", "web", "tablet"] as const), pick(rng, [10, 20, 30, ri(rng, 1, 240)])]),
      };
    },
    solution: [
      "WITH ranked AS (",
      "  SELECT device, watched_minutes,",
      "         ROW_NUMBER() OVER (PARTITION BY device ORDER BY watched_minutes, session_id) AS rn,",
      "         COUNT(*) OVER (PARTITION BY device) AS cnt",
      "  FROM WatchSession",
      ")",
      "SELECT device, MAX(cnt) AS sessions, ROUND(AVG(watched_minutes), 2) AS median_minutes",
      "FROM ranked",
      "WHERE rn IN ((cnt + 1) DIV 2, cnt DIV 2 + 1)",
      "GROUP BY device",
      "ORDER BY device",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.device, (SELECT COUNT(*) FROM WatchSession c WHERE c.device = a.device) AS sessions,",
        "       ROUND(AVG(DISTINCT a.watched_minutes), 2) AS median_minutes",
        "FROM WatchSession a",
        "WHERE 2 * (SELECT COUNT(*) FROM WatchSession b WHERE b.device = a.device AND b.watched_minutes <= a.watched_minutes)",
        "        >= (SELECT COUNT(*) FROM WatchSession c WHERE c.device = a.device)",
        "  AND 2 * (SELECT COUNT(*) FROM WatchSession b WHERE b.device = a.device AND b.watched_minutes >= a.watched_minutes)",
        "        >= (SELECT COUNT(*) FROM WatchSession c WHERE c.device = a.device)",
        "GROUP BY a.device",
        "ORDER BY a.device",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Number each device's sessions from shortest to longest, and attach the device's session count to every row.",
      "For n sessions the middle positions are `(n + 1) DIV 2` and `n DIV 2 + 1` — the same position when n is odd.",
      "Average the one or two middle values per device.",
      "Duplicate minute values still need distinct positions — give `ROW_NUMBER` a tie-breaker.",
    ],
    editorial: [
      "SQL has no portable `MEDIAN`, so build it from positions. `ROW_NUMBER() OVER (PARTITION BY device ORDER BY watched_minutes, session_id)` numbers each device's sessions from shortest to longest (the `session_id` tie-breaker only fixes which of two equal values is first — the values themselves are the same either way), and `COUNT(*) OVER (PARTITION BY device)` puts the device's total on every row.",
      "",
      "For n rows the middle positions are `(n + 1) DIV 2` and `n DIV 2 + 1`: for n = 3 both are 2; for n = 4 they are 2 and 3. Keeping those rows and averaging them gives the median in both cases. With integer minutes the median is a whole number or ends in .5, so the rounding never sits on a boundary. `MAX(cnt)` returns the count, which is the same on every row of the group.",
      "",
      "The window-free alternative uses the definition: a value is a median candidate when at least half the sessions are ≤ it and at least half are ≥ it. Only the one or two middle values pass, so `AVG(DISTINCT …)` of the survivors is the median even when equal values repeat. It is quadratic per device; the window plan is one sort.",
    ].join("\n"),
  },

  {
    slug: "accounts-streaming-past-their-screen-limit",
    title: "Accounts Streaming Past Their Screen Limit",
    difficulty: "HARD",
    topics: ["Joins", "Dates", "Aggregation"],
    description: [
      "Each plan allows a number of simultaneous screens. Password-sharing detection looks at **concurrency**: at the moment a stream starts, count the account's streams in progress — every stream with `started_at` ≤ that moment and `ended_at` **after** it, the new stream included. A stream that ended exactly when another began does not overlap it.",
      "",
      "Return every account whose highest such count is **greater than** its plan's `max_screens`, with the columns `account_id`, `plan_name`, `max_screens` and `peak_streams`. Order by `account_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Plan",
        columns: [
          { name: "plan_name", type: "varchar" },
          { name: "max_screens", type: "int" },
        ],
        primaryKey: ["plan_name"],
        note: "How many devices may stream at the same time on the plan.",
      },
      {
        name: "Account",
        columns: [
          { name: "account_id", type: "int" },
          { name: "plan_name", type: "varchar" },
        ],
        primaryKey: ["account_id"],
        note: "Each account's current plan; `plan_name` always names a row of `Plan`.",
      },
      {
        name: "Stream",
        columns: [
          { name: "stream_id", type: "int" },
          { name: "account_id", type: "int" },
          { name: "device_id", type: "varchar" },
          { name: "started_at", type: "datetime" },
          { name: "ended_at", type: "datetime" },
        ],
        primaryKey: ["stream_id"],
        note: "One row per stream; `ended_at` is always later than `started_at`.",
      },
    ],
    examples: [
      {
        Plan: [
          ["Mobile", 1],
          ["Standard", 2],
          ["Premium", 4],
        ],
        Account: [
          [801, "Mobile"],
          [802, "Standard"],
          [803, "Standard"],
          [804, "Premium"],
        ],
        Stream: [
          [1, 801, "phone-a", "2024-09-01 20:00:00", "2024-09-01 21:00:00"],
          [2, 801, "phone-b", "2024-09-01 21:00:00", "2024-09-01 22:00:00"],
          [3, 802, "tv-1", "2024-09-01 19:00:00", "2024-09-01 22:00:00"],
          [4, 802, "phone-1", "2024-09-01 20:00:00", "2024-09-01 20:30:00"],
          [5, 802, "laptop-1", "2024-09-01 20:15:00", "2024-09-01 21:00:00"],
          [6, 803, "tv-2", "2024-09-01 19:00:00", "2024-09-01 20:00:00"],
          [7, 803, "tab-2", "2024-09-01 19:30:00", "2024-09-01 20:30:00"],
          [8, 804, "tv-3", "2024-09-01 18:00:00", "2024-09-01 23:00:00"],
          [9, 804, "tv-4", "2024-09-01 18:00:00", "2024-09-01 23:00:00"],
          [10, 801, "phone-a", "2024-09-02 08:00:00", "2024-09-02 08:45:00"],
          [11, 801, "phone-c", "2024-09-02 08:30:00", "2024-09-02 09:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const plans: [string, number][] = [["Mobile", 1], ["Standard", 2], ["Premium", 4]];
      const n = ri(rng, 1, 4);
      const accounts = seq(801, n).map((id) => [id, pick(rng, ["Mobile", "Mobile", "Standard", "Standard", "Premium"])]);
      const m = chance(rng, 0.05) ? 0 : ri(rng, 3, 22);
      const streams = seq(1, m).map((id) => {
        const start = ri(rng, 0, 16) * 15;
        const len = pick(rng, [15, 30, 45, 60, 90, 120]);
        return [id, ri(rng, 801, 800 + n), `dev-${ri(rng, 1, 6)}`, at("2024-09-01", 18 * 60 + start), at("2024-09-01", 18 * 60 + start + len)];
      });
      return { Plan: plans, Account: accounts, Stream: streams };
    },
    solution: [
      "WITH concurrency AS (",
      "  SELECT s.account_id, s.stream_id, COUNT(*) AS live",
      "  FROM Stream s",
      "  JOIN Stream o",
      "    ON o.account_id = s.account_id",
      "   AND o.started_at <= s.started_at",
      "   AND o.ended_at > s.started_at",
      "  GROUP BY s.account_id, s.stream_id",
      ")",
      "SELECT a.account_id, a.plan_name, p.max_screens, MAX(c.live) AS peak_streams",
      "FROM concurrency c",
      "JOIN Account a ON a.account_id = c.account_id",
      "JOIN Plan p ON p.plan_name = a.plan_name",
      "GROUP BY a.account_id, a.plan_name, p.max_screens",
      "HAVING MAX(c.live) > p.max_screens",
      "ORDER BY a.account_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH events AS (",
        "  SELECT account_id, started_at AS t, 1 AS delta FROM Stream",
        "  UNION ALL",
        "  SELECT account_id, ended_at AS t, -1 AS delta FROM Stream",
        "), running AS (",
        "  SELECT account_id, SUM(delta) OVER (PARTITION BY account_id ORDER BY t, delta ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS live",
        "  FROM events",
        "), peaks AS (SELECT account_id, MAX(live) AS peak FROM running GROUP BY account_id)",
        "SELECT a.account_id, a.plan_name, p.max_screens, k.peak AS peak_streams",
        "FROM peaks k JOIN Account a ON a.account_id = k.account_id JOIN Plan p ON p.plan_name = a.plan_name",
        "WHERE k.peak > p.max_screens",
        "ORDER BY a.account_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Concurrency only changes when a stream starts, so it is enough to measure it at every start time.",
      "Self-join `Stream` to itself within one account: which other streams are live at `s.started_at`?",
      "Mind the boundary — a stream ending at 21:00 is not live at 21:00.",
      "Take the maximum per account, then compare it with the plan's limit in `HAVING`.",
    ],
    editorial: [
      "The number of live streams can only rise when a stream starts, so the peak is reached at some start time. For each stream `s`, a self join finds the streams `o` of the same account that are live at `s.started_at`: `o.started_at <= s.started_at` and `o.ended_at > s.started_at`. The condition is half-open on purpose — a hand-off at exactly 21:00 (account 801) is not two screens — and `s` matches itself, so it counts towards its own moment. `COUNT(*)` per stream is the concurrency at that start; `MAX` per account is the peak.",
      "",
      "Join in the account's plan and keep the accounts whose peak exceeds `max_screens` in `HAVING`. Two streams starting at the same second both see each other (both satisfy `<=`), which is right: account 804's two TVs are two screens at 18:00, within the Premium limit.",
      "",
      "The alternative is a **sweep line**: turn every stream into a +1 event at its start and a −1 at its end, and take a running sum per account. Ordering by time and then by `delta` puts ends before starts at the same instant, matching the half-open rule. The self join is quadratic per account; the sweep is one sort of 2n events.",
    ].join("\n"),
  },

  {
    slug: "free-trial-conversion-funnel",
    title: "Free-Trial Conversion and Second-Month Funnel",
    difficulty: "HARD",
    topics: ["Conditional Logic", "Dates", "Subqueries"],
    description: [
      "New accounts get a 7-day free trial, then UPI autopay charges the first month. Per trial, measured in days after `trial_start` (`DATEDIFF(paid_on, trial_start)`, counting only `success` payments):",
      "",
      "- the trial **converted** when there is a successful payment on day **9 or earlier** (paying during the trial counts too);",
      "- a converted trial is **retained** when there is also a successful payment between day **30 and day 45**, both included.",
      "",
      "Return one row per trial start month with the columns `trial_month` (as `YYYY-MM`), `trials`, `converted_pct` and `retained_pct` — converted and retained trials as percentages of `trials`, each **rounded to 2 decimal places**. Order by `trial_month`.",
    ].join("\n"),
    tables: [
      {
        name: "Trial",
        columns: [
          { name: "account_id", type: "int" },
          { name: "trial_start", type: "date" },
        ],
        primaryKey: ["account_id"],
        note: "One free trial per account.",
      },
      {
        name: "Payment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "account_id", type: "int" },
          { name: "paid_on", type: "date" },
          { name: "status", type: "enum", values: ["success", "failed"] },
        ],
        primaryKey: ["payment_id"],
        note: "Every autopay attempt; `account_id` always names a row of `Trial`.",
      },
    ],
    examples: [
      {
        Trial: [
          [1, "2024-03-02"],
          [2, "2024-03-10"],
          [3, "2024-03-20"],
          [4, "2024-03-28"],
          [5, "2024-04-05"],
          [6, "2024-04-11"],
        ],
        Payment: [
          [1, 1, "2024-03-09", "success"],
          [2, 1, "2024-04-08", "success"],
          [3, 2, "2024-03-17", "failed"],
          [4, 2, "2024-03-19", "success"],
          [5, 3, "2024-03-30", "success"],
          [6, 3, "2024-04-19", "success"],
          [7, 4, "2024-04-04", "success"],
          [8, 4, "2024-05-12", "success"],
          [9, 5, "2024-04-12", "success"],
          [10, 5, "2024-05-06", "failed"],
          [11, 6, "2024-04-21", "success"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const trials = seq(1, n).map((id) => [id, dateBetween(rng, "2024-03-01", "2024-05-31")] as [number, string]);
      const pays: Cell[][] = [];
      for (const [id, start] of trials) {
        if (chance(rng, 0.2)) continue;
        pays.push([0, id, addDays(start, pick(rng, [3, 7, 9, 10, ri(rng, 6, 12)])), chance(rng, 0.8) ? "success" : "failed"]);
        if (chance(rng, 0.7)) pays.push([0, id, addDays(start, pick(rng, [29, 30, 37, 45, 46, ri(rng, 28, 48)])), chance(rng, 0.85) ? "success" : "failed"]);
      }
      return { Trial: trials, Payment: shuffle(rng, pays).map((r, i) => [i + 1, ...r.slice(1)]) };
    },
    solution: [
      "WITH flags AS (",
      "  SELECT t.account_id, DATE_FORMAT(t.trial_start, '%Y-%m') AS trial_month,",
      "         MAX(CASE WHEN DATEDIFF(p.paid_on, t.trial_start) <= 9 THEN 1 ELSE 0 END) AS converted,",
      "         MAX(CASE WHEN DATEDIFF(p.paid_on, t.trial_start) BETWEEN 30 AND 45 THEN 1 ELSE 0 END) AS renewed",
      "  FROM Trial t",
      "  LEFT JOIN Payment p ON p.account_id = t.account_id AND p.status = 'success'",
      "  GROUP BY t.account_id, DATE_FORMAT(t.trial_start, '%Y-%m')",
      ")",
      "SELECT trial_month, COUNT(*) AS trials,",
      "       ROUND(100 * SUM(converted) / COUNT(*), 2) AS converted_pct,",
      "       ROUND(100 * SUM(CASE WHEN converted = 1 AND renewed = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) AS retained_pct",
      "FROM flags",
      "GROUP BY trial_month",
      "ORDER BY trial_month",
    ].join("\n"),
    alternatives: [
      [
        "SELECT LEFT(t.trial_start, 7) AS trial_month, COUNT(*) AS trials,",
        "       ROUND(100 * SUM(IF(EXISTS (SELECT 1 FROM Payment p WHERE p.account_id = t.account_id AND p.status = 'success' AND p.paid_on <= DATE_ADD(t.trial_start, INTERVAL 9 DAY)), 1, 0)) / COUNT(*), 2) AS converted_pct,",
        "       ROUND(100 * SUM(IF(EXISTS (SELECT 1 FROM Payment p WHERE p.account_id = t.account_id AND p.status = 'success' AND p.paid_on <= DATE_ADD(t.trial_start, INTERVAL 9 DAY))",
        "                     AND EXISTS (SELECT 1 FROM Payment q WHERE q.account_id = t.account_id AND q.status = 'success' AND q.paid_on BETWEEN DATE_ADD(t.trial_start, INTERVAL 30 DAY) AND DATE_ADD(t.trial_start, INTERVAL 45 DAY)), 1, 0)) / COUNT(*), 2) AS retained_pct",
        "FROM Trial t",
        "GROUP BY LEFT(t.trial_start, 7)",
        "ORDER BY trial_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Work per trial first: two yes/no facts — converted, and paid again in the second month.",
      "Only successful payments matter; filter them in the join's `ON` so trials without one still appear.",
      "`MAX(CASE … THEN 1 ELSE 0 END)` over a trial's payments answers \"is there at least one?\".",
      "Retained needs both facts at once; then aggregate per trial month.",
    ],
    editorial: [
      "A funnel is a set of per-entity flags that are then counted. Here the entity is the trial: LEFT JOIN its **successful** payments (the status test sits in `ON`, so a trial with only failed attempts still produces a row) and fold them into two flags with `MAX(CASE …)`: *converted* if any payment came on day 9 or earlier, *renewed* if any came between day 30 and 45. A trial with no successful payment has NULL dates, the `CASE` conditions are not true, and both flags are 0.",
      "",
      "The second stage is gated by the first: **retained** is `converted AND renewed`, so an account that skipped the first charge but paid on day 37 counts in neither. Then group by `DATE_FORMAT(trial_start, '%Y-%m')` and turn the counts into percentages of all trials, rounded. The boundaries are inclusive — day 9 converts, day 10 does not; days 30 and 45 renew, 29 and 46 do not.",
      "",
      "The `EXISTS` alternative asks each question with its own subquery and date arithmetic instead of `DATEDIFF`. Either form reads each trial's payments once or twice; the join form does it in one pass.",
    ].join("\n"),
  },

  {
    slug: "album-first-week-daily-streams",
    title: "Daily Streams in an Album's First Week, Zero Days Included",
    difficulty: "HARD",
    topics: ["Dates", "Window Functions", "Joins"],
    description: [
      "Labels judge a new album by its **first seven days**: the release day is day 1, and day 7 is six days later. The chart must show **every** one of those seven days for every album, with 0 on a day without streams. Streams before release (pre-saves played early) or after day 7 are ignored.",
      "",
      "Return the columns `album_name`, `day_no` (1 to 7), `streams` (that day's streams) and `cumulative_streams` (streams from day 1 up to and including this day). Order by `album_name`, then `day_no`.",
    ].join("\n"),
    tables: [
      {
        name: "Album",
        columns: [
          { name: "album_id", type: "int" },
          { name: "album_name", type: "varchar" },
          { name: "release_date", type: "date" },
        ],
        primaryKey: ["album_id"],
        note: "One row per album; album names are unique.",
      },
      {
        name: "Stream",
        columns: [
          { name: "stream_id", type: "int" },
          { name: "album_id", type: "int" },
          { name: "streamed_on", type: "date" },
        ],
        primaryKey: ["stream_id"],
        note: "One row per qualifying stream of a track from the album.",
      },
    ],
    examples: [
      {
        Album: [
          [1, "Monsoon Tapes", "2024-07-05"],
          [2, "City Lights", "2024-07-30"],
        ],
        Stream: [
          [1, 1, "2024-07-05"],
          [2, 1, "2024-07-05"],
          [3, 1, "2024-07-06"],
          [4, 1, "2024-07-09"],
          [5, 1, "2024-07-11"],
          [6, 1, "2024-07-12"],
          [7, 1, "2024-07-04"],
          [8, 2, "2024-08-01"],
          [9, 2, "2024-08-05"],
          [10, 2, "2024-07-31"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 3);
      const albums = sample(rng, ["Monsoon Tapes", "City Lights", "Night Drive", "Old School Ghazals", "Kolkata Blues"], n)
        .map((name, i) => [i + 1, name, dateBetween(rng, "2024-06-20", "2024-08-28")] as [number, string, string]);
      const streams: Cell[][] = [];
      for (const [id, , rel] of albums) {
        const k = ri(rng, 0, 9);
        for (let i = 0; i < k; i++) streams.push([0, id, addDays(rel, pick(rng, [-1, 0, 6, 7, ri(rng, 0, 6)]))]);
      }
      return { Album: albums, Stream: shuffle(rng, streams).map((r, i) => [i + 1, ...r.slice(1)]) };
    },
    solution: [
      "WITH RECURSIVE days AS (",
      "  SELECT 1 AS day_no",
      "  UNION ALL",
      "  SELECT day_no + 1 FROM days WHERE day_no < 7",
      "), daily AS (",
      "  SELECT a.album_name, d.day_no, COUNT(s.stream_id) AS streams",
      "  FROM Album a",
      "  CROSS JOIN days d",
      "  LEFT JOIN Stream s",
      "    ON s.album_id = a.album_id",
      "   AND s.streamed_on = DATE_ADD(a.release_date, INTERVAL d.day_no - 1 DAY)",
      "  GROUP BY a.album_id, a.album_name, d.day_no",
      ")",
      "SELECT album_name, day_no, streams,",
      "       SUM(streams) OVER (PARTITION BY album_name ORDER BY day_no ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_streams",
      "FROM daily",
      "ORDER BY album_name, day_no",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.album_name, d.day_no,",
        "       (SELECT COUNT(*) FROM Stream s WHERE s.album_id = a.album_id AND DATEDIFF(s.streamed_on, a.release_date) = d.day_no - 1) AS streams,",
        "       (SELECT COUNT(*) FROM Stream s WHERE s.album_id = a.album_id AND DATEDIFF(s.streamed_on, a.release_date) BETWEEN 0 AND d.day_no - 1) AS cumulative_streams",
        "FROM Album a",
        "CROSS JOIN (SELECT 1 AS day_no UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7) d",
        "ORDER BY a.album_name, d.day_no",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Days with no stream have no row anywhere — you have to generate the seven days yourself.",
      "A recursive CTE counting from 1 to 7, cross joined with the albums, gives every (album, day) slot.",
      "LEFT JOIN the streams onto each slot by date and count a column of `Stream`, so empty slots count 0.",
      "The cumulative column is a running `SUM` over the daily counts.",
    ],
    editorial: [
      "The difficulty is the zero days: an aggregate over `Stream` can only produce days that have streams. So generate the **scaffold** first — a recursive CTE yields the numbers 1 to 7 (it stops at `day_no < 7`, so it terminates after seven rows), and a `CROSS JOIN` with `Album` gives one slot per album per day.",
      "",
      "Each slot's date is `DATE_ADD(release_date, INTERVAL day_no - 1 DAY)`. LEFT JOIN the streams on album and that date, group by the slot, and `COUNT(s.stream_id)`: it counts matched streams only, so a slot with none shows 0 rather than 1. Pre-release streams and those after day 7 never match a slot, so they are ignored without an extra filter.",
      "",
      "The running total is a window over the finished daily rows: `SUM(streams) OVER (PARTITION BY album ORDER BY day_no)` with an explicit `ROWS` frame. The alternative builds the seven days with `UNION ALL` and computes both numbers with correlated `COUNT`s by day offset (`DATEDIFF`) — simpler to read, but it scans the streams twice per slot.",
    ].join("\n"),
  },
];
