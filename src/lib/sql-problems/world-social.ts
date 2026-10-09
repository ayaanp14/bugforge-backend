import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, atTime, chance, dateBetween, maybeNull, names, pick, ri, roundTo, sample, shuffle } from "./kit.js";

/**
 * Social media & messaging: the questions the analysts, trust-and-safety leads
 * and growth engineers of a photo/short-video app actually get asked — verified
 * creators, posts nobody liked, story reach, hashtag counts, handle policy,
 * the moderation queue, follower graphs (mutual follows, friend suggestions),
 * engagement rates, reshare chains, posting streaks, DM response times,
 * app sessions and sign-up retention. Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);

/** A UTC epoch-ms instant as 'YYYY-MM-DD HH:MM:SS'. */
const ts = (ms: number): string => new Date(ms).toISOString().slice(0, 19).replace("T", " ");

/** `n` distinct lower-case handles like `priya.k_21`. */
const handles = (rng: () => number, n: number): string[] =>
  names(rng, n).map((nm, i) => `${nm.toLowerCase()}${pick(rng, ["", ".", "_"])}${pick(rng, ["k", "x", "in", "official", "codes", "eats"])}${i}`);

const COUNTRIES = ["IN", "US", "AE", "GB", "SG"] as const;
const REPORT_REASONS = ["spam", "harassment", "hate_speech", "nudity", "misinformation", "impersonation"] as const;
const HASHTAGS = ["ipl", "foodie", "travel", "mumbaidiaries", "fitness", "coding", "diwali", "cricket", "memes", "startup", "ootd", "bollywood"] as const;
const POST_TYPES = ["photo", "reel", "carousel", "text"] as const;

export const WORLD_SOCIAL: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "verified-creators-over-one-lakh-followers",
    title: "Verified Creators With Over One Lakh Followers",
    difficulty: "EASY",
    topics: ["Basics"],
    description: [
      "The partnerships team wants a list of creators to invite to a brand-collab programme: accounts that are **verified**, currently **active**, and have **at least 1,00,000 (100000) followers**. A NULL `follower_count` means the count has not been computed yet and never qualifies.",
      "",
      "Return the columns `user_id`, `handle` and `follower_count`, **ordered by `follower_count` descending**, then by `user_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "users",
        columns: [
          { name: "user_id", type: "int" },
          { name: "handle", type: "varchar" },
          { name: "is_verified", type: "bool" },
          { name: "account_status", type: "enum", values: ["active", "suspended", "deactivated"] },
          { name: "follower_count", type: "int" },
        ],
        primaryKey: ["user_id"],
        note: "One row per account. `is_verified` is 1 for a blue-tick account, 0 otherwise.",
      },
    ],
    examples: [
      {
        users: [
          [1, "aarav.eats", 1, "active", 245000],
          [2, "diya_travels", 1, "active", 100000],
          [3, "kabir.codes", 0, "active", 880000],
          [4, "meera_fit", 1, "suspended", 510000],
          [5, "rohan.memes", 1, "active", 99999],
          [6, "zara_ootd", 1, "active", 245000],
          [7, "ishaan.ipl", 1, "active", null],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 15);
      const pool = [100000, 99999, 100001, 250000, 1200000, 45000, 5400000, 250000, 320];
      const hs = handles(rng, n);
      return {
        users: hs.map((h, i) => [
          i + 1,
          h,
          chance(rng, 0.7) ? 1 : 0,
          pick(rng, ["active", "active", "active", "suspended", "deactivated"]),
          maybeNull(rng, 0.1, pick(rng, pool)),
        ]),
      };
    },
    solution: [
      "SELECT user_id, handle, follower_count",
      "FROM users",
      "WHERE is_verified = 1",
      "  AND account_status = 'active'",
      "  AND follower_count >= 100000",
      "ORDER BY follower_count DESC, user_id",
    ].join("\n"),
    alternatives: [
      "SELECT user_id, handle, follower_count FROM users WHERE follower_count > 99999 AND is_verified <> 0 AND account_status IN ('active') ORDER BY follower_count DESC, user_id ASC",
      "SELECT user_id, handle, follower_count FROM users WHERE IF(is_verified = 1 AND account_status = 'active', follower_count, 0) >= 100000 ORDER BY 3 DESC, 1",
    ],
    ordered: true,
    hints: [
      "Three conditions must all hold, so they join with AND in one WHERE clause.",
      "\"At least\" includes the boundary: 100000 itself qualifies.",
      "A NULL compared with `>=` is unknown, and WHERE keeps only true rows — no extra check needed.",
    ],
    editorial: [
      "This is a plain filter followed by a sort. Each condition the partnerships team named becomes one predicate: `is_verified = 1`, `account_status = 'active'` and `follower_count >= 100000`, combined with AND because an account must satisfy every one of them.",
      "",
      "The boundary matters: \"at least one lakh\" means 100000 is in and 99999 is out, so the comparison is `>=` (or, equivalently for integers, `> 99999`). A NULL follower count makes the comparison unknown rather than false, and WHERE keeps only rows where the predicate is true, so uncomputed counts drop out on their own.",
      "",
      "Two creators can have the same follower count, so the order needs a tie-breaker: `user_id` ascending makes it deterministic. The query reads the table once; an index on `(is_verified, account_status, follower_count)` would let the database skip non-qualifying rows entirely.",
    ].join("\n"),
  },

  {
    slug: "posts-with-no-likes-from-other-users",
    title: "Posts With No Likes From Anyone but the Author",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "The feed-ranking team is studying posts that got zero outside engagement. Authors are allowed to like their own posts, but a **self-like does not count**.",
      "",
      "Return every post that has **no like from any user other than its author**, with the columns `post_id` and `author_id`. A post with only its author's like is in the answer; a post with no likes at all is too. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "posts",
        columns: [
          { name: "post_id", type: "int" },
          { name: "author_id", type: "int" },
          { name: "post_type", type: "enum", values: [...POST_TYPES] },
          { name: "posted_at", type: "datetime" },
        ],
        primaryKey: ["post_id"],
        note: "One row per post.",
      },
      {
        name: "likes",
        columns: [
          { name: "post_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "liked_at", type: "datetime" },
        ],
        primaryKey: ["post_id", "user_id"],
        note: "One row per (post, user who liked it). `post_id` is always a row of `posts`.",
      },
    ],
    examples: [
      {
        posts: [
          [1, 10, "photo", "2025-01-04 09:12:00"],
          [2, 11, "reel", "2025-01-04 10:30:00"],
          [3, 10, "carousel", "2025-01-05 18:45:00"],
          [4, 12, "text", "2025-01-06 08:00:00"],
          [5, 13, "reel", "2025-01-06 21:10:00"],
        ],
        likes: [
          [1, 11, "2025-01-04 09:30:00"],
          [1, 12, "2025-01-04 11:02:00"],
          [2, 11, "2025-01-04 10:31:00"],
          [3, 10, "2025-01-05 18:46:00"],
          [3, 13, "2025-01-05 20:00:00"],
          [5, 13, "2025-01-06 21:11:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const users = seq(10, ri(rng, 2, 6));
      const posts = seq(1, n).map((id) => [id, pick(rng, users), pick(rng, POST_TYPES), atTime(rng, dateBetween(rng, "2025-01-01", "2025-01-31"))]);
      const likes: Cell[][] = [];
      const rate = pick(rng, [0.1, 0.3, 0.5]);
      for (const p of posts) {
        if (chance(rng, 0.35)) likes.push([p[0]!, p[1]!, addDays(String(p[3]).slice(0, 10), 0) + " 23:00:00"]);
        for (const u of users) if (u !== p[1] && chance(rng, rate)) likes.push([p[0]!, u, String(p[3]).slice(0, 10) + " 23:30:00"]);
      }
      return { posts, likes };
    },
    solution: [
      "SELECT p.post_id, p.author_id",
      "FROM posts p",
      "WHERE NOT EXISTS (",
      "  SELECT 1 FROM likes l",
      "  WHERE l.post_id = p.post_id AND l.user_id <> p.author_id",
      ")",
    ].join("\n"),
    alternatives: [
      "SELECT p.post_id, p.author_id FROM posts p LEFT JOIN likes l ON l.post_id = p.post_id AND l.user_id <> p.author_id WHERE l.post_id IS NULL",
      "SELECT post_id, author_id FROM posts WHERE post_id NOT IN (SELECT l.post_id FROM likes l JOIN posts q ON q.post_id = l.post_id WHERE l.user_id <> q.author_id)",
    ],
    hints: [
      "Start from `posts`: every row of the answer is a post, including posts with no likes at all.",
      "You are looking for posts where a certain kind of like does *not* exist — an anti join.",
      "Put the \"not the author\" condition inside the join or subquery, not in the outer WHERE.",
    ],
    editorial: [
      "The answer is an **anti join** with an extra condition: keep a post when no row of `likes` both belongs to it and comes from someone other than its author. `NOT EXISTS` states that literally — the correlated subquery looks for a like on `p.post_id` whose `user_id` differs from `p.author_id`, and the post survives when it finds none.",
      "",
      "The LEFT JOIN version must carry the self-like rule **in the ON clause**. If you joined on `post_id` alone and then wrote `WHERE l.user_id <> p.author_id OR l.post_id IS NULL`, a post liked only by its author would match its self-like row, fail the filter and vanish — the classic mistake of turning an outer join's condition into a WHERE filter. With the rule in ON, a post whose only like is a self-like gets no partner row and comes out NULL-extended, which `IS NULL` keeps.",
      "",
      "The `NOT IN` form is safe here because `likes.post_id` is part of the primary key and never NULL. All three are one pass over posts with an index lookup into likes.",
    ].join("\n"),
  },

  {
    slug: "stories-posted-and-views-per-user",
    title: "Stories Posted and Total Story Views per User",
    difficulty: "EASY",
    topics: ["Aggregation", "Joins"],
    description: [
      "Stories disappear after a day, so the growth team keeps a summary of story reach. For every user who has posted **at least one story**, report how many stories they posted and how many views those stories got in total.",
      "",
      "Return the columns `user_id`, `stories` and `total_views`. A story nobody viewed still counts in `stories` and adds 0 to `total_views`. Users who never posted a story do not appear. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "stories",
        columns: [
          { name: "story_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "posted_at", type: "datetime" },
        ],
        primaryKey: ["story_id"],
        note: "One row per story; `user_id` is the poster.",
      },
      {
        name: "story_views",
        columns: [
          { name: "story_id", type: "int" },
          { name: "viewer_id", type: "int" },
          { name: "viewed_at", type: "datetime" },
        ],
        primaryKey: ["story_id", "viewer_id"],
        note: "One row per (story, viewer) — repeat views by the same viewer are not stored. `story_id` is always a row of `stories`.",
      },
    ],
    examples: [
      {
        stories: [
          [1, 21, "2025-03-01 08:00:00"],
          [2, 21, "2025-03-01 20:15:00"],
          [3, 22, "2025-03-02 12:40:00"],
          [4, 23, "2025-03-02 19:05:00"],
        ],
        story_views: [
          [1, 22, "2025-03-01 08:10:00"],
          [1, 23, "2025-03-01 09:00:00"],
          [1, 24, "2025-03-01 13:20:00"],
          [2, 22, "2025-03-01 21:00:00"],
          [3, 21, "2025-03-02 13:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 10);
      const posters = seq(21, ri(rng, 1, 5));
      const viewers = seq(21, 8);
      const stories = seq(1, n).map((id) => [id, pick(rng, posters), atTime(rng, dateBetween(rng, "2025-03-01", "2025-03-10"))]);
      const views: Cell[][] = [];
      for (const s of stories) for (const v of sample(rng, viewers, ri(rng, 0, 4))) views.push([s[0]!, v, String(s[2])]);
      return { stories, story_views: views };
    },
    solution: [
      "SELECT s.user_id,",
      "       COUNT(DISTINCT s.story_id) AS stories,",
      "       COUNT(v.viewer_id) AS total_views",
      "FROM stories s",
      "LEFT JOIN story_views v ON v.story_id = s.story_id",
      "GROUP BY s.user_id",
    ].join("\n"),
    alternatives: [
      "SELECT user_id, COUNT(*) AS stories, SUM(cnt) AS total_views FROM (SELECT s.user_id, (SELECT COUNT(*) FROM story_views v WHERE v.story_id = s.story_id) AS cnt FROM stories s) x GROUP BY user_id",
      "SELECT s.user_id, COUNT(*) AS stories, SUM(COALESCE(v.cnt, 0)) AS total_views FROM stories s LEFT JOIN (SELECT story_id, COUNT(*) AS cnt FROM story_views GROUP BY story_id) v ON v.story_id = s.story_id GROUP BY s.user_id",
    ],
    hints: [
      "Group by the poster, and make sure stories with no views still reach the GROUP BY.",
      "After joining views, a story appears once per view — count stories with DISTINCT.",
      "`COUNT(column)` skips NULLs, which is exactly what an unviewed story contributes after a LEFT JOIN.",
    ],
    editorial: [
      "Joining `stories` to `story_views` multiplies each story by its number of views, so two counts come out of one grouped result. A **LEFT JOIN** keeps a story with no views as a single row whose view columns are NULL.",
      "",
      "Per poster, `COUNT(DISTINCT s.story_id)` counts stories once each despite the fan-out, and `COUNT(v.viewer_id)` counts only real view rows — the NULL from an unviewed story is skipped, so it adds 0. Using `COUNT(*)` for views would wrongly count that NULL-extended row as a view.",
      "",
      "An alternative pre-aggregates views per story in a derived table and joins that, which avoids the fan-out entirely: each story is one row, so `COUNT(*)` counts stories and `SUM(COALESCE(cnt, 0))` adds the views. A correlated scalar subquery per story does the same. All are linear with an index on `story_views.story_id`.",
    ].join("\n"),
  },

  {
    slug: "hashtags-on-three-or-more-live-posts",
    title: "Hashtags Used on Three or More Live Posts",
    difficulty: "EASY",
    topics: ["Aggregation", "Joins"],
    description: [
      "The explore page only lists a hashtag once it appears on **at least three posts that are not deleted**. Deleted posts keep their hashtag rows but must not be counted.",
      "",
      "Return the columns `hashtag` and `post_count` (the number of live posts carrying it) for the qualifying hashtags, **ordered by `post_count` descending**, then by `hashtag` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "posts",
        columns: [
          { name: "post_id", type: "int" },
          { name: "author_id", type: "int" },
          { name: "is_deleted", type: "bool" },
        ],
        primaryKey: ["post_id"],
        note: "`is_deleted` is 1 for a post the author or a moderator removed.",
      },
      {
        name: "post_hashtags",
        columns: [
          { name: "post_id", type: "int" },
          { name: "hashtag", type: "varchar" },
        ],
        primaryKey: ["post_id", "hashtag"],
        note: "One row per hashtag on a post, stored lower-case without the `#`. `post_id` is always a row of `posts`.",
      },
    ],
    examples: [
      {
        posts: [
          [1, 7, 0],
          [2, 8, 0],
          [3, 7, 1],
          [4, 9, 0],
          [5, 8, 0],
          [6, 9, 0],
        ],
        post_hashtags: [
          [1, "ipl"], [1, "cricket"],
          [2, "ipl"], [2, "foodie"],
          [3, "ipl"], [3, "foodie"],
          [4, "foodie"], [4, "cricket"],
          [5, "ipl"], [5, "cricket"],
          [6, "foodie"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 2, 14);
      const posts = seq(1, n).map((id) => [id, ri(rng, 1, 5), chance(rng, 0.2) ? 1 : 0]);
      const tags = sample(rng, HASHTAGS, ri(rng, 2, 5));
      const rows: Cell[][] = [];
      for (const p of posts) for (const t of sample(rng, tags, ri(rng, 0, 3))) rows.push([p[0]!, t]);
      return { posts, post_hashtags: rows };
    },
    solution: [
      "SELECT h.hashtag, COUNT(*) AS post_count",
      "FROM post_hashtags h",
      "JOIN posts p ON p.post_id = h.post_id",
      "WHERE p.is_deleted = 0",
      "GROUP BY h.hashtag",
      "HAVING COUNT(*) >= 3",
      "ORDER BY post_count DESC, h.hashtag",
    ].join("\n"),
    alternatives: [
      "SELECT hashtag, post_count FROM (SELECT hashtag, COUNT(*) AS post_count FROM post_hashtags WHERE post_id IN (SELECT post_id FROM posts WHERE is_deleted = 0) GROUP BY hashtag) t WHERE post_count >= 3 ORDER BY post_count DESC, hashtag",
      "SELECT h.hashtag, SUM(CASE WHEN p.is_deleted = 0 THEN 1 ELSE 0 END) AS post_count FROM post_hashtags h JOIN posts p ON p.post_id = h.post_id GROUP BY h.hashtag HAVING SUM(CASE WHEN p.is_deleted = 0 THEN 1 ELSE 0 END) >= 3 ORDER BY post_count DESC, h.hashtag",
    ],
    ordered: true,
    hints: [
      "The deleted flag lives on `posts`, so the hashtag rows need a join first.",
      "Filter rows (deleted posts) with WHERE before grouping; filter groups (fewer than three) with HAVING after.",
      "Two hashtags can have the same count — the order needs a second key.",
    ],
    editorial: [
      "Each hashtag row needs its post's `is_deleted` flag, so join `post_hashtags` to `posts` and drop deleted posts in WHERE. Grouping the surviving rows by hashtag gives one row per tag, and since `(post_id, hashtag)` is the primary key, `COUNT(*)` is the number of distinct live posts carrying it.",
      "",
      "The threshold is a condition on the group, not on a row, so it belongs in **HAVING**: `COUNT(*) >= 3` — exactly three qualifies. Filtering deleted posts in HAVING instead (with conditional SUM, as one alternative does) gives the same answer, but WHERE is cheaper because it discards rows before they are grouped.",
      "",
      "Ties on `post_count` are broken by the hashtag's name so the order is fixed. The query is one join plus one grouping; an `IN (SELECT …)` semi join is an equivalent way to apply the live-post filter.",
    ].join("\n"),
  },

  {
    slug: "handles-breaking-the-username-policy",
    title: "Handles Breaking the Username Policy",
    difficulty: "EASY",
    topics: ["Strings", "Basics"],
    description: [
      "A new username policy says a handle must be **3 to 20 characters long**, must **not start with a digit**, and must **not contain a space**. Accounts created before the policy are being audited.",
      "",
      "Return every account whose handle breaks **at least one** of the three rules, with the columns `user_id` and `handle`, **ordered by `user_id`**. Handles never have leading or trailing spaces.",
    ].join("\n"),
    tables: [
      {
        name: "users",
        columns: [
          { name: "user_id", type: "int" },
          { name: "handle", type: "varchar" },
          { name: "created_at", type: "date" },
        ],
        primaryKey: ["user_id"],
        note: "One row per account. Handles are lower-case letters, digits, `.`, `_` and (on legacy accounts) spaces.",
      },
    ],
    examples: [
      {
        users: [
          [1, "priya.sharma", "2022-05-10"],
          [2, "9to5trader", "2022-07-01"],
          [3, "dev", "2022-08-19"],
          [4, "rahul verma", "2022-09-03"],
          [5, "kc", "2022-11-21"],
          [6, "the.official.mumbai.foodie", "2023-01-14"],
          [7, "neha_2003", "2023-02-02"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const bases = ["priya", "rahul", "neha", "dev", "kabir", "ananya", "zara", "farhan", "simran"];
      const make = (): string => {
        const b = pick(rng, bases);
        switch (ri(rng, 0, 7)) {
          case 0: return `${ri(rng, 1, 9)}${b}`;
          case 1: return `${b} ${pick(rng, ["k", "verma", "iyer"])}`;
          case 2: return b.slice(0, 2);
          case 3: return "abc";
          case 4: return `${b}.${pick(rng, bases)}.${pick(rng, bases)}.${pick(rng, bases)}`;
          case 5: return `${b}_${"x".repeat(20 - b.length - 1)}`; // exactly 20
          default: return `${b}${pick(rng, [".", "_"])}${ri(rng, 1, 99)}`;
        }
      };
      return { users: seq(1, n).map((id) => [id, make(), dateBetween(rng, "2021-01-01", "2023-12-31")]) };
    },
    solution: [
      "SELECT user_id, handle",
      "FROM users",
      "WHERE CHAR_LENGTH(handle) < 3",
      "   OR CHAR_LENGTH(handle) > 20",
      "   OR LEFT(handle, 1) IN ('0','1','2','3','4','5','6','7','8','9')",
      "   OR LOCATE(' ', handle) > 0",
      "ORDER BY user_id",
    ].join("\n"),
    alternatives: [
      "SELECT user_id, handle FROM users WHERE LENGTH(handle) NOT BETWEEN 3 AND 20 OR handle REGEXP '^[0-9]' OR handle LIKE '% %' ORDER BY user_id",
      "SELECT user_id, handle FROM users WHERE NOT (CHAR_LENGTH(handle) BETWEEN 3 AND 20 AND SUBSTRING(handle, 1, 1) NOT REGEXP '[0-9]' AND INSTR(handle, ' ') = 0) ORDER BY user_id",
    ],
    ordered: true,
    hints: [
      "Write each rule as the condition for *breaking* it, then join them with OR.",
      "`CHAR_LENGTH`, `LEFT` and `LOCATE`/`INSTR` (or `LIKE '% %'`) cover the three rules.",
      "Watch the boundaries: a 3-character and a 20-character handle are both allowed.",
    ],
    editorial: [
      "Breaking *at least one* rule is the OR of the three violations, or equivalently `NOT (rule1 AND rule2 AND rule3)` by De Morgan's law — the second alternative is written that way.",
      "",
      "- **Length**: `CHAR_LENGTH(handle) < 3 OR CHAR_LENGTH(handle) > 20`, or `NOT BETWEEN 3 AND 20`; BETWEEN is inclusive, so lengths 3 and 20 pass.",
      "- **Leading digit**: take the first character with `LEFT(handle, 1)` and test it against the ten digits, or let a regular expression anchored at the start (`'^[0-9]'`) do it.",
      "- **Space**: `LOCATE(' ', handle) > 0`, `INSTR(handle, ' ') > 0` or `LIKE '% %'` all find an interior space.",
      "",
      "`LENGTH` counts bytes and `CHAR_LENGTH` characters; they agree here because handles are ASCII, but `CHAR_LENGTH` is the right habit for user-visible lengths. String functions on every row force a full scan, which is fine for a one-off audit; a policy enforced at sign-up would use a CHECK constraint instead.",
    ].join("\n"),
  },

  {
    slug: "weekend-moderation-reports-in-march",
    title: "Moderation Reports Filed on Weekends in March 2025",
    difficulty: "EASY",
    topics: ["Dates", "Basics"],
    description: [
      "Trust and safety staffs a smaller team on weekends and wants to see the weekend load. Find the reports filed on a **Saturday or Sunday during March 2025**.",
      "",
      "Return the columns `report_id`, `reason` and `day_name` (the full English weekday name, such as `Saturday`), **ordered by `reported_at`**, then by `report_id`.",
    ].join("\n"),
    tables: [
      {
        name: "reports",
        columns: [
          { name: "report_id", type: "int" },
          { name: "post_id", type: "int" },
          { name: "reporter_id", type: "int" },
          { name: "reason", type: "enum", values: [...REPORT_REASONS] },
          { name: "reported_at", type: "datetime" },
        ],
        primaryKey: ["report_id"],
        note: "One row per user report against a post, with the time it was filed (IST).",
      },
    ],
    examples: [
      {
        reports: [
          [1, 501, 31, "spam", "2025-02-28 23:50:00"],
          [2, 502, 32, "harassment", "2025-03-01 10:15:00"],
          [3, 503, 33, "spam", "2025-03-03 09:00:00"],
          [4, 504, 31, "misinformation", "2025-03-09 22:40:00"],
          [5, 505, 34, "nudity", "2025-03-15 07:05:00"],
          [6, 506, 35, "hate_speech", "2025-03-21 18:30:00"],
          [7, 507, 32, "spam", "2025-04-05 11:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 15);
      return {
        reports: seq(1, n).map((id) => [id, ri(rng, 500, 540), ri(rng, 30, 45), pick(rng, REPORT_REASONS), atTime(rng, dateBetween(rng, "2025-02-22", "2025-04-06"))]),
      };
    },
    solution: [
      "SELECT report_id, reason, DAYNAME(reported_at) AS day_name",
      "FROM reports",
      "WHERE reported_at >= '2025-03-01' AND reported_at < '2025-04-01'",
      "  AND DAYOFWEEK(reported_at) IN (1, 7)",
      "ORDER BY reported_at, report_id",
    ].join("\n"),
    alternatives: [
      "SELECT report_id, reason, DAYNAME(reported_at) AS day_name FROM reports WHERE DATE_FORMAT(reported_at, '%Y-%m') = '2025-03' AND WEEKDAY(reported_at) >= 5 ORDER BY reported_at, report_id",
      "SELECT report_id, reason, DAYNAME(reported_at) AS day_name FROM reports WHERE YEAR(reported_at) = 2025 AND MONTH(reported_at) = 3 AND DAYNAME(reported_at) IN ('Saturday', 'Sunday') ORDER BY reported_at, report_id",
    ],
    ordered: true,
    hints: [
      "Two filters: the month, and the day of the week.",
      "`DAYOFWEEK` numbers Sunday as 1 and Saturday as 7; `WEEKDAY` numbers Monday as 0.",
      "For the month, a half-open range (`>= '2025-03-01' AND < '2025-04-01'`) includes the whole last day.",
    ],
    editorial: [
      "Two independent filters do the work. The **month** is best written as a half-open range on the raw column, `reported_at >= '2025-03-01' AND reported_at < '2025-04-01'`: it includes every second of 31 March and keeps the column bare, so an index on `reported_at` can be used. `YEAR(...) = 2025 AND MONTH(...) = 3` or `DATE_FORMAT(..., '%Y-%m') = '2025-03'` are correct too, but wrap the column in a function.",
      "",
      "The **weekend** test needs a day-of-week function, and the numbering differs between them: `DAYOFWEEK` gives 1 for Sunday through 7 for Saturday, so the weekend is `IN (1, 7)`; `WEEKDAY` gives 0 for Monday through 6 for Sunday, so it is `>= 5`. `DAYNAME` returns the name itself and doubles as the output column.",
      "",
      "A report at 23:50 on Friday 28 February is outside the month, and one on Saturday 5 April is outside it too, which is why both filters are needed. Ties on `reported_at` fall back to `report_id`.",
    ].join("\n"),
  },

  {
    slug: "label-accounts-by-last-activity",
    title: "Label Accounts Active, Dormant or Churned",
    difficulty: "EASY",
    topics: ["Conditional Logic", "Dates"],
    description: [
      "For the re-engagement campaign, label every account by how long ago it was last active, **as of 2025-06-30**. Let `gap` be the number of days from `last_active_on` to 2025-06-30.",
      "",
      "- `active` — `gap` is **0 to 7** days;",
      "- `dormant` — `gap` is **8 to 90** days;",
      "- `churned` — `gap` is **more than 90** days;",
      "- `never_active` — `last_active_on` is NULL (signed up but never opened the app).",
      "",
      "Return the columns `user_id`, `handle` and `status`, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "users",
        columns: [
          { name: "user_id", type: "int" },
          { name: "handle", type: "varchar" },
          { name: "signed_up_on", type: "date" },
          { name: "last_active_on", type: "date" },
        ],
        primaryKey: ["user_id"],
        note: "`last_active_on` is the last day the user opened the app (never after 2025-06-30), or NULL.",
      },
    ],
    examples: [
      {
        users: [
          [1, "aditi.reads", "2024-01-10", "2025-06-30"],
          [2, "vikram_runs", "2024-03-02", "2025-06-23"],
          [3, "saanvi.art", "2024-05-18", "2025-06-22"],
          [4, "karan.k", "2023-11-30", "2025-04-01"],
          [5, "tanvi_eats", "2023-08-12", "2025-03-31"],
          [6, "liam.codes", "2025-06-01", null],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const gaps = [0, 3, 7, 8, 30, 89, 90, 91, 200, 400];
      const hs = handles(rng, n);
      return {
        users: hs.map((h, i) => {
          const last = maybeNull(rng, 0.15, addDays("2025-06-30", -pick(rng, gaps)));
          return [i + 1, h, addDays("2025-06-30", -ri(rng, 450, 900)), last];
        }),
      };
    },
    solution: [
      "SELECT user_id, handle,",
      "       CASE",
      "         WHEN last_active_on IS NULL THEN 'never_active'",
      "         WHEN DATEDIFF('2025-06-30', last_active_on) <= 7 THEN 'active'",
      "         WHEN DATEDIFF('2025-06-30', last_active_on) <= 90 THEN 'dormant'",
      "         ELSE 'churned'",
      "       END AS status",
      "FROM users",
    ].join("\n"),
    alternatives: [
      "SELECT user_id, handle, IF(last_active_on IS NULL, 'never_active', IF(last_active_on >= DATE_SUB('2025-06-30', INTERVAL 7 DAY), 'active', IF(last_active_on >= DATE_SUB('2025-06-30', INTERVAL 90 DAY), 'dormant', 'churned'))) AS status FROM users",
      "SELECT user_id, handle, CASE WHEN last_active_on IS NULL THEN 'never_active' WHEN DATEDIFF('2025-06-30', last_active_on) > 90 THEN 'churned' WHEN DATEDIFF('2025-06-30', last_active_on) > 7 THEN 'dormant' ELSE 'active' END AS status FROM users",
    ],
    hints: [
      "`DATEDIFF(later, earlier)` gives the number of days between two dates.",
      "A searched CASE checks its WHEN branches top to bottom and stops at the first true one — order the bands accordingly.",
      "Handle NULL first: any arithmetic on NULL is NULL and would fall through to ELSE.",
    ],
    editorial: [
      "One searched `CASE` turns the gap into a label. Because CASE returns the first matching branch, the bands can be written as upper bounds only — `<= 7` then `<= 90` then ELSE — and each branch implicitly means \"and not any earlier one\".",
      "",
      "The NULL branch must come first. `DATEDIFF('2025-06-30', NULL)` is NULL, every comparison with it is unknown, and without an explicit `IS NULL` test the row would fall through to ELSE and be labelled `churned`.",
      "",
      "The boundaries are where most mistakes happen: a gap of exactly 7 is still active and exactly 90 still dormant. An equivalent way is to compare the date with cut-off dates computed once, `DATE_SUB('2025-06-30', INTERVAL 7 DAY)` and `INTERVAL 90 DAY`, which keeps the column bare. The query is a single scan with no joins.",
    ].join("\n"),
  },

  {
    slug: "posts-beating-the-platform-average-likes",
    title: "Posts With More Likes Than the Platform Average",
    difficulty: "EASY",
    topics: ["Subqueries", "Basics"],
    description: [
      "The content team wants posts that did **better than average**. A post's `like_count` is NULL while its counters are being rebuilt; such posts are left out of the average and never returned.",
      "",
      "Return the columns `post_id`, `author_handle` and `like_count` for every post whose `like_count` is **strictly greater** than the average `like_count` of all posts, **ordered by `like_count` descending**, then by `post_id`.",
    ].join("\n"),
    tables: [
      {
        name: "posts",
        columns: [
          { name: "post_id", type: "int" },
          { name: "author_handle", type: "varchar" },
          { name: "posted_on", type: "date" },
          { name: "like_count", type: "int" },
        ],
        primaryKey: ["post_id"],
        note: "One row per post with its denormalised like counter.",
      },
    ],
    examples: [
      {
        posts: [
          [1, "aarav.eats", "2025-05-01", 120],
          [2, "diya_travels", "2025-05-01", 40],
          [3, "aarav.eats", "2025-05-02", 80],
          [4, "kabir.codes", "2025-05-03", null],
          [5, "zara_ootd", "2025-05-03", 120],
          [6, "meera_fit", "2025-05-04", 40],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const hs = handles(rng, 5);
      const pool = Array.from({ length: ri(rng, 2, 6) }, () => roundTo(rng, 0, 500, 10));
      return {
        posts: seq(1, n).map((id) => [id, pick(rng, hs), dateBetween(rng, "2025-05-01", "2025-05-31"), maybeNull(rng, 0.12, pick(rng, pool))]),
      };
    },
    solution: [
      "SELECT post_id, author_handle, like_count",
      "FROM posts",
      "WHERE like_count > (SELECT AVG(like_count) FROM posts)",
      "ORDER BY like_count DESC, post_id",
    ].join("\n"),
    alternatives: [
      "SELECT p.post_id, p.author_handle, p.like_count FROM posts p CROSS JOIN (SELECT AVG(like_count) AS avg_likes FROM posts) a WHERE p.like_count > a.avg_likes ORDER BY p.like_count DESC, p.post_id",
      "SELECT post_id, author_handle, like_count FROM posts WHERE like_count * (SELECT COUNT(like_count) FROM posts) > (SELECT SUM(like_count) FROM posts) ORDER BY like_count DESC, post_id",
    ],
    ordered: true,
    hints: [
      "The threshold is a single number computed over the whole table — a scalar subquery.",
      "`AVG` already ignores NULLs; what does a NULL `like_count` do in the outer comparison?",
      "Strictly greater: a post exactly at the average is not in the answer.",
    ],
    editorial: [
      "The average is one value over the whole table, so compute it in a **scalar subquery** and compare each row with it: `like_count > (SELECT AVG(like_count) FROM posts)`. The database evaluates the uncorrelated subquery once.",
      "",
      "NULLs are handled by the aggregates themselves: `AVG` skips them, so posts with a rebuilding counter do not drag the average down, and `NULL > x` is unknown, so they never pass the outer filter either.",
      "",
      "Comparing with an average invites precision questions. The third query avoids division altogether — `like_count × n > total` is the same inequality multiplied through by the count of non-NULL posts, all in integers. A derived table cross-joined to the posts is another way to bring the single average next to every row. Equal like counts are ordered by `post_id` to keep the result fixed.",
    ].join("\n"),
  },

  // ──────────────────────────── MEDIUM ────────────────────────────
  {
    slug: "mutual-follows-between-active-accounts",
    title: "Mutual Follows Between Active Accounts",
    difficulty: "MEDIUM",
    topics: ["Joins"],
    description: [
      "Two accounts are **mutuals** when each follows the other. The \"close friends\" feature is being rolled out to mutual pairs where **both accounts are active**.",
      "",
      "Return every such pair once, with the columns `handle_a` and `handle_b`, where `handle_a` belongs to the account with the **smaller `user_id`**. **Order the rows by the smaller `user_id`, then by the larger `user_id`.** One-way follows and pairs involving a suspended account are not in the answer.",
    ].join("\n"),
    tables: [
      {
        name: "users",
        columns: [
          { name: "user_id", type: "int" },
          { name: "handle", type: "varchar" },
          { name: "account_status", type: "enum", values: ["active", "suspended"] },
        ],
        primaryKey: ["user_id"],
        note: "One row per account.",
      },
      {
        name: "follows",
        columns: [
          { name: "follower_id", type: "int" },
          { name: "followee_id", type: "int" },
          { name: "followed_at", type: "datetime" },
        ],
        primaryKey: ["follower_id", "followee_id"],
        note: "`follower_id` follows `followee_id`. Both are rows of `users`, and nobody follows themselves.",
      },
    ],
    examples: [
      {
        users: [
          [1, "aarav.eats", "active"],
          [2, "diya_travels", "active"],
          [3, "kabir.codes", "active"],
          [4, "meera_fit", "suspended"],
          [5, "rohan.memes", "active"],
        ],
        follows: [
          [1, 2, "2024-11-02 10:00:00"],
          [2, 1, "2024-11-03 09:15:00"],
          [1, 3, "2024-12-01 18:20:00"],
          [3, 4, "2025-01-05 08:00:00"],
          [4, 3, "2025-01-05 08:05:00"],
          [5, 3, "2025-01-09 22:40:00"],
          [3, 5, "2025-02-14 07:30:00"],
          [2, 5, "2025-02-20 13:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 2, 8);
      const hs = handles(rng, n);
      const users = hs.map((h, i) => [i + 1, h, chance(rng, 0.2) ? "suspended" : "active"]);
      const follows: Cell[][] = [];
      const p = pick(rng, [0.25, 0.45, 0.65]);
      for (let a = 1; a <= n; a++)
        for (let b = 1; b <= n; b++)
          if (a !== b && chance(rng, p)) follows.push([a, b, atTime(rng, dateBetween(rng, "2024-06-01", "2025-03-31"))]);
      return { users, follows };
    },
    solution: [
      "SELECT ua.handle AS handle_a, ub.handle AS handle_b",
      "FROM follows f",
      "JOIN follows g ON g.follower_id = f.followee_id AND g.followee_id = f.follower_id",
      "JOIN users ua ON ua.user_id = f.follower_id",
      "JOIN users ub ON ub.user_id = f.followee_id",
      "WHERE f.follower_id < f.followee_id",
      "  AND ua.account_status = 'active'",
      "  AND ub.account_status = 'active'",
      "ORDER BY ua.user_id, ub.user_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT ua.handle AS handle_a, ub.handle AS handle_b",
        "FROM users ua JOIN users ub ON ua.user_id < ub.user_id",
        "WHERE ua.account_status = 'active' AND ub.account_status = 'active'",
        "  AND EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = ua.user_id AND f.followee_id = ub.user_id)",
        "  AND EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = ub.user_id AND f.followee_id = ua.user_id)",
        "ORDER BY ua.user_id, ub.user_id",
      ].join("\n"),
      [
        "SELECT ua.handle AS handle_a, ub.handle AS handle_b",
        "FROM (SELECT LEAST(follower_id, followee_id) AS a, GREATEST(follower_id, followee_id) AS b",
        "      FROM follows GROUP BY LEAST(follower_id, followee_id), GREATEST(follower_id, followee_id)",
        "      HAVING COUNT(*) = 2) m",
        "JOIN users ua ON ua.user_id = m.a JOIN users ub ON ub.user_id = m.b",
        "WHERE ua.account_status = 'active' AND ub.account_status = 'active'",
        "ORDER BY m.a, m.b",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "A follow edge has a mirror image when someone follows back: join `follows` to itself with the two ids swapped.",
      "Each mutual pair produces two matching edges; keep only the one where the follower's id is the smaller.",
      "Join `users` twice — once for each side — to get both handles and both statuses.",
    ],
    editorial: [
      "A mutual follow is an edge `a → b` together with its reverse `b → a`. A **self join** of `follows` finds them: pair each row `f` with a row `g` where `g.follower_id = f.followee_id` and `g.followee_id = f.follower_id`. Every mutual pair then appears twice — once starting from each side — so the condition `f.follower_id < f.followee_id` keeps exactly one copy and also fixes which account is `handle_a`.",
      "",
      "Joining `users` twice, under two aliases, brings each side's handle and status; both must be active. A pair with one suspended account is dropped even though the follows exist.",
      "",
      "The second query starts from pairs of users instead and asks two EXISTS questions — readable, but it considers every pair of accounts. The third normalises each edge to `(LEAST, GREATEST)` and keeps pairs seen twice; because `(follower_id, followee_id)` is the primary key, a count of 2 can only mean both directions. With the composite primary key the self join is an index lookup per edge.",
    ].join("\n"),
  },

  {
    slug: "creator-monthly-engagement-rate",
    title: "Creator Engagement Rate by Month",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Dates"],
    description: [
      "Brands judge creators by **engagement rate**: interactions (likes + comments + shares) as a percentage of impressions. Compute it per creator per calendar month of `posted_at`, over all of that month's posts together (total interactions × 100 ÷ total impressions), **rounded to 2 decimals**. If a month's posts have **0 impressions in total**, its rate is NULL.",
      "",
      "Return the columns `creator_id`, `month` (as `'YYYY-MM'`), `posts` (the number of posts that month) and `engagement_rate`, **ordered by `creator_id`, then `month`**.",
    ].join("\n"),
    tables: [
      {
        name: "post_stats",
        columns: [
          { name: "post_id", type: "int" },
          { name: "creator_id", type: "int" },
          { name: "posted_at", type: "datetime" },
          { name: "impressions", type: "int" },
          { name: "likes", type: "int" },
          { name: "comments", type: "int" },
          { name: "shares", type: "int" },
        ],
        primaryKey: ["post_id"],
        note: "One row per post with its lifetime counters (never NULL).",
      },
    ],
    examples: [
      {
        post_stats: [
          [1, 7, "2025-01-03 19:00:00", 12000, 900, 120, 60],
          [2, 7, "2025-01-20 08:30:00", 8000, 350, 40, 10],
          [3, 7, "2025-02-11 21:15:00", 15000, 1200, 300, 150],
          [4, 9, "2025-01-31 23:59:00", 4000, 160, 25, 15],
          [5, 9, "2025-02-01 00:05:00", 0, 0, 0, 0],
          [6, 9, "2025-03-14 12:00:00", 5000, 410, 33, 7],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 14);
      const creators = seq(1, ri(rng, 1, 4));
      return {
        post_stats: seq(1, n).map((id) => {
          const imp = chance(rng, 0.1) ? 0 : ri(rng, 500, 40000);
          const likes = imp === 0 ? 0 : ri(rng, 0, Math.floor(imp / 8));
          const comments = imp === 0 ? 0 : ri(rng, 0, Math.floor(imp / 40));
          const shares = imp === 0 ? 0 : ri(rng, 0, Math.floor(imp / 80));
          return [id, pick(rng, creators), atTime(rng, dateBetween(rng, "2024-11-01", "2025-02-28")), imp, likes, comments, shares];
        }),
      };
    },
    solution: [
      "SELECT creator_id,",
      "       DATE_FORMAT(posted_at, '%Y-%m') AS month,",
      "       COUNT(*) AS posts,",
      "       ROUND(SUM(likes + comments + shares) * 100 / NULLIF(SUM(impressions), 0), 2) AS engagement_rate",
      "FROM post_stats",
      "GROUP BY creator_id, DATE_FORMAT(posted_at, '%Y-%m')",
      "ORDER BY creator_id, month",
    ].join("\n"),
    alternatives: [
      [
        "SELECT creator_id, month, COUNT(*) AS posts,",
        "       CASE WHEN SUM(impressions) = 0 THEN NULL",
        "            ELSE ROUND((SUM(likes) + SUM(comments) + SUM(shares)) * 100 / SUM(impressions), 2) END AS engagement_rate",
        "FROM (SELECT creator_id, LEFT(posted_at, 7) AS month, impressions, likes, comments, shares FROM post_stats) t",
        "GROUP BY creator_id, month",
        "ORDER BY creator_id, month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Group by the creator and by a month key built from `posted_at`.",
      "A month's rate is a ratio of sums, not the average of each post's rate.",
      "Guard the division: `NULLIF(SUM(impressions), 0)` turns a zero denominator into NULL.",
    ],
    editorial: [
      "The month key is the first seven characters of the timestamp — `DATE_FORMAT(posted_at, '%Y-%m')` produces `'2025-01'` directly. Grouping by `(creator_id, month)` gives one row per creator-month, and `COUNT(*)` is that month's post count.",
      "",
      "The rate must be a **ratio of sums**: total interactions over total impressions. Averaging each post's own rate would give a viral post with 50,000 impressions the same weight as one with 500, which is not what a brand means by the month's engagement.",
      "",
      "A month whose posts all have 0 impressions would divide by zero. MySQL returns NULL for that and SQLite errors or returns NULL depending on settings, so make it explicit: `NULLIF(SUM(impressions), 0)` makes the denominator NULL, and the whole expression is NULL. The alternative uses CASE for the same guard and builds the month key with `LEFT` in a derived table, so the outer GROUP BY uses a plain column. The cost is one scan and one grouping.",
    ].join("\n"),
  },

  {
    slug: "each-creators-most-liked-post",
    title: "Each Creator's Most-Liked Post",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Joins"],
    description: [
      "For the year-in-review card, show each creator's single **most-liked post**. If two posts have the same `likes`, the **earlier `posted_at`** wins; if they were posted at the same moment, the smaller `post_id` wins.",
      "",
      "Return the columns `handle`, `post_id` and `likes`, one row per creator who has at least one post, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "creators",
        columns: [
          { name: "creator_id", type: "int" },
          { name: "handle", type: "varchar" },
          { name: "category", type: "varchar" },
        ],
        primaryKey: ["creator_id"],
        note: "One row per creator account.",
      },
      {
        name: "posts",
        columns: [
          { name: "post_id", type: "int" },
          { name: "creator_id", type: "int" },
          { name: "posted_at", type: "datetime" },
          { name: "likes", type: "int" },
        ],
        primaryKey: ["post_id"],
        note: "`creator_id` is always a row of `creators`; `likes` is never NULL.",
      },
    ],
    examples: [
      {
        creators: [
          [1, "aarav.eats", "food"],
          [2, "diya_travels", "travel"],
          [3, "kabir.codes", "tech"],
          [4, "zara_ootd", "fashion"],
        ],
        posts: [
          [10, 1, "2024-03-02 12:00:00", 5400],
          [11, 1, "2024-06-18 19:30:00", 8200],
          [12, 1, "2024-09-01 08:00:00", 8200],
          [13, 2, "2024-04-11 10:00:00", 3100],
          [14, 2, "2024-04-11 10:00:00", 3100],
          [15, 3, "2024-12-25 21:00:00", 950],
        ],
      },
    ],
    gen: (rng) => {
      const nc = ri(rng, 1, 5);
      const hs = handles(rng, nc);
      const creators = hs.map((h, i) => [i + 1, h, pick(rng, ["food", "travel", "tech", "fashion", "fitness"])]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 15);
      const pool = Array.from({ length: ri(rng, 2, 5) }, () => roundTo(rng, 100, 9000, 100));
      const dates = Array.from({ length: ri(rng, 3, 8) }, () => atTime(rng, dateBetween(rng, "2024-01-01", "2024-12-31")));
      const ids = shuffle(rng, seq(10, 40)).slice(0, n);
      return { creators, posts: ids.map((id) => [id, ri(rng, 1, nc), pick(rng, dates), pick(rng, pool)]) };
    },
    solution: [
      "WITH ranked AS (",
      "  SELECT creator_id, post_id, likes,",
      "         ROW_NUMBER() OVER (PARTITION BY creator_id ORDER BY likes DESC, posted_at, post_id) AS rn",
      "  FROM posts",
      ")",
      "SELECT c.handle, r.post_id, r.likes",
      "FROM ranked r",
      "JOIN creators c ON c.creator_id = r.creator_id",
      "WHERE r.rn = 1",
    ].join("\n"),
    alternatives: [
      [
        "SELECT c.handle, p.post_id, p.likes",
        "FROM posts p JOIN creators c ON c.creator_id = p.creator_id",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM posts q",
        "  WHERE q.creator_id = p.creator_id",
        "    AND (q.likes > p.likes",
        "         OR (q.likes = p.likes AND q.posted_at < p.posted_at)",
        "         OR (q.likes = p.likes AND q.posted_at = p.posted_at AND q.post_id < p.post_id))",
        ")",
      ].join("\n"),
      [
        "SELECT c.handle, p.post_id, p.likes",
        "FROM posts p JOIN creators c ON c.creator_id = p.creator_id",
        "WHERE p.post_id = (SELECT q.post_id FROM posts q WHERE q.creator_id = p.creator_id ORDER BY q.likes DESC, q.posted_at, q.post_id LIMIT 1)",
      ].join("\n"),
    ],
    hints: [
      "Rank each creator's posts separately — PARTITION BY the creator.",
      "Put every tie-breaker into the window's ORDER BY so exactly one post gets rank 1.",
      "RANK would give two posts rank 1 on a tie; ROW_NUMBER never does.",
    ],
    editorial: [
      "\"The best row per group\" is the textbook use of `ROW_NUMBER()`. Partition the posts by creator and order each partition by the ranking rule — `likes DESC`, then `posted_at`, then `post_id` — so the winner is numbered 1. Because the ordering is total (`post_id` is unique), exactly one post per creator gets 1, and filtering `rn = 1` in an outer query (window functions cannot appear in WHERE) keeps it. A join to `creators` adds the handle.",
      "",
      "`RANK()` or `DENSE_RANK()` would be wrong here: on a tie they number several posts 1, and the card has room for one.",
      "",
      "Without window functions, the same rule is an anti join: keep a post when no other post of the same creator beats it under the ordering — the three OR branches spell the ordering out. A correlated `ORDER BY … LIMIT 1` subquery is a third form. The window query sorts each partition once (O(n log n)); the correlated forms are fine with an index on `(creator_id, likes)`.",
    ].join("\n"),
  },

  {
    slug: "moderation-outcomes-by-report-reason",
    title: "Moderation Outcomes by Report Reason",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Aggregation"],
    description: [
      "The trust-and-safety lead wants one table summarising the report queue by reason. A report is `pending` until a moderator reviews it, after which it is `actioned` (content removed) or `dismissed`.",
      "",
      "Return the columns `reason`, `total_reports`, `actioned`, `dismissed`, `pending` and `action_rate` — the percentage of **reviewed** reports (actioned + dismissed) that were actioned, **rounded to 1 decimal**, or NULL when none of the reason's reports has been reviewed. **Order by `total_reports` descending, then `reason`.**",
    ].join("\n"),
    tables: [
      {
        name: "reports",
        columns: [
          { name: "report_id", type: "int" },
          { name: "post_id", type: "int" },
          { name: "reason", type: "varchar" },
          { name: "status", type: "enum", values: ["pending", "actioned", "dismissed"] },
          { name: "reported_at", type: "datetime" },
        ],
        primaryKey: ["report_id"],
        note: "One row per user report. `reason` is one of a fixed list of lower-case codes.",
      },
    ],
    examples: [
      {
        reports: [
          [1, 101, "spam", "actioned", "2025-04-01 10:00:00"],
          [2, 102, "spam", "actioned", "2025-04-01 11:30:00"],
          [3, 103, "spam", "dismissed", "2025-04-02 09:10:00"],
          [4, 104, "harassment", "pending", "2025-04-02 14:00:00"],
          [5, 105, "harassment", "actioned", "2025-04-03 08:45:00"],
          [6, 106, "impersonation", "pending", "2025-04-03 20:20:00"],
          [7, 107, "spam", "pending", "2025-04-04 07:00:00"],
          [8, 108, "harassment", "dismissed", "2025-04-04 16:40:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      const reasons = sample(rng, REPORT_REASONS, ri(rng, 1, 4));
      const weights = pick(rng, [["pending", "actioned", "dismissed"], ["actioned", "actioned", "dismissed", "pending"], ["pending", "pending", "dismissed"]]);
      return {
        reports: seq(1, n).map((id) => [id, ri(rng, 100, 140), pick(rng, reasons), pick(rng, weights), atTime(rng, dateBetween(rng, "2025-04-01", "2025-04-30"))]),
      };
    },
    solution: [
      "SELECT reason,",
      "       COUNT(*) AS total_reports,",
      "       SUM(CASE WHEN status = 'actioned' THEN 1 ELSE 0 END) AS actioned,",
      "       SUM(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END) AS dismissed,",
      "       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,",
      "       ROUND(SUM(CASE WHEN status = 'actioned' THEN 1 ELSE 0 END) * 100",
      "             / NULLIF(SUM(CASE WHEN status <> 'pending' THEN 1 ELSE 0 END), 0), 1) AS action_rate",
      "FROM reports",
      "GROUP BY reason",
      "ORDER BY total_reports DESC, reason",
    ].join("\n"),
    alternatives: [
      [
        "SELECT reason, COUNT(*) AS total_reports,",
        "       COUNT(IF(status = 'actioned', 1, NULL)) AS actioned,",
        "       COUNT(IF(status = 'dismissed', 1, NULL)) AS dismissed,",
        "       COUNT(IF(status = 'pending', 1, NULL)) AS pending,",
        "       ROUND(AVG(CASE WHEN status = 'actioned' THEN 100 WHEN status = 'dismissed' THEN 0 END), 1) AS action_rate",
        "FROM reports GROUP BY reason ORDER BY total_reports DESC, reason",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "One GROUP BY reason; every count is a SUM over a CASE that yields 1 or 0.",
      "The rate's denominator is the reviewed reports only — pending ones are left out.",
      "A reason with only pending reports has a zero denominator: make the rate NULL rather than dividing by zero.",
    ],
    editorial: [
      "This is **conditional aggregation**: one pass over the reports grouped by reason, where each output column is an aggregate over a CASE. `SUM(CASE WHEN status = 'actioned' THEN 1 ELSE 0 END)` counts actioned reports; the same shape counts dismissed and pending ones. `COUNT(IF(cond, 1, NULL))` is an equivalent spelling, since COUNT skips NULLs.",
      "",
      "The action rate is over reviewed reports only, so its denominator is `actioned + dismissed`. For a reason whose reports are all pending that denominator is 0; `NULLIF(…, 0)` turns it into NULL so the rate is NULL instead of an error. The alternative gets the rate from an AVG over a CASE that yields 100 for actioned, 0 for dismissed and NULL for pending — AVG ignores the NULLs, and when every value is NULL it returns NULL, which is exactly the rule.",
      "",
      "Rounding to one decimal keeps MySQL's four-digit decimal division and other engines in agreement. Ties on the total fall back to the reason code.",
    ].join("\n"),
  },

  {
    slug: "drive-by-commenters-who-never-liked",
    title: "Drive-By Commenters Who Never Liked the Post",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation"],
    description: [
      "Spam rings often comment on posts without liking them. The integrity team flags users who commented on **at least two different posts by other people** that they **did not like**. Comments on one's own posts never count.",
      "",
      "Return the columns `user_id` and `unliked_posts` (the number of distinct such posts), in any order. Several comments on the same post count once.",
    ].join("\n"),
    tables: [
      {
        name: "posts",
        columns: [
          { name: "post_id", type: "int" },
          { name: "author_id", type: "int" },
        ],
        primaryKey: ["post_id"],
        note: "One row per post.",
      },
      {
        name: "comments",
        columns: [
          { name: "comment_id", type: "int" },
          { name: "post_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "commented_at", type: "datetime" },
        ],
        primaryKey: ["comment_id"],
        note: "`post_id` is always a row of `posts`; `user_id` is the commenter.",
      },
      {
        name: "likes",
        columns: [
          { name: "post_id", type: "int" },
          { name: "user_id", type: "int" },
        ],
        primaryKey: ["post_id", "user_id"],
        note: "One row per (post, user who liked it).",
      },
    ],
    examples: [
      {
        posts: [
          [1, 50],
          [2, 50],
          [3, 51],
          [4, 52],
        ],
        comments: [
          [1, 1, 60, "2025-05-01 10:00:00"],
          [2, 1, 60, "2025-05-01 10:01:00"],
          [3, 3, 60, "2025-05-01 10:05:00"],
          [4, 2, 61, "2025-05-02 09:00:00"],
          [5, 4, 61, "2025-05-02 09:30:00"],
          [6, 1, 50, "2025-05-02 11:00:00"],
          [7, 2, 50, "2025-05-02 11:05:00"],
          [8, 3, 62, "2025-05-03 08:00:00"],
          [9, 4, 62, "2025-05-03 08:10:00"],
        ],
        likes: [
          [2, 61],
          [3, 62],
          [1, 62],
        ],
      },
    ],
    gen: (rng) => {
      const np = ri(rng, 2, 8);
      const authors = seq(50, 4);
      const posts = seq(1, np).map((id) => [id, pick(rng, authors)]);
      const users = seq(50, ri(rng, 3, 6));
      const comments: Cell[][] = [];
      const m = chance(rng, 0.05) ? 0 : ri(rng, 6, 22);
      for (let i = 1; i <= m; i++) comments.push([i, ri(rng, 1, np), pick(rng, users), atTime(rng, dateBetween(rng, "2025-05-01", "2025-05-15"))]);
      const likes: Cell[][] = [];
      const rate = pick(rng, [0.1, 0.25, 0.4]);
      for (const p of posts) for (const u of users) if (chance(rng, rate)) likes.push([p[0]!, u]);
      return { posts, comments, likes };
    },
    solution: [
      "SELECT c.user_id, COUNT(DISTINCT c.post_id) AS unliked_posts",
      "FROM comments c",
      "JOIN posts p ON p.post_id = c.post_id",
      "WHERE p.author_id <> c.user_id",
      "  AND NOT EXISTS (SELECT 1 FROM likes l WHERE l.post_id = c.post_id AND l.user_id = c.user_id)",
      "GROUP BY c.user_id",
      "HAVING COUNT(DISTINCT c.post_id) >= 2",
    ].join("\n"),
    alternatives: [
      [
        "SELECT c.user_id, COUNT(DISTINCT c.post_id) AS unliked_posts",
        "FROM comments c",
        "JOIN posts p ON p.post_id = c.post_id AND p.author_id <> c.user_id",
        "LEFT JOIN likes l ON l.post_id = c.post_id AND l.user_id = c.user_id",
        "WHERE l.post_id IS NULL",
        "GROUP BY c.user_id",
        "HAVING COUNT(DISTINCT c.post_id) >= 2",
      ].join("\n"),
      [
        "SELECT user_id, COUNT(*) AS unliked_posts FROM (",
        "  SELECT DISTINCT c.user_id, c.post_id FROM comments c",
        "  WHERE c.user_id <> (SELECT author_id FROM posts p WHERE p.post_id = c.post_id)",
        "    AND (c.post_id, c.user_id) NOT IN (SELECT post_id, user_id FROM likes)",
        ") t GROUP BY user_id HAVING COUNT(*) >= 2",
      ].join("\n"),
    ],
    hints: [
      "First decide, comment by comment, whether it qualifies: not on the commenter's own post, and no like by the same person on the same post.",
      "\"No like\" is an anti join on two columns — the post and the user.",
      "Count distinct posts per user, then keep groups with at least two.",
    ],
    editorial: [
      "Work at the level of single comments first. A comment qualifies when its post was written by someone else (join `posts` and compare `author_id` with the commenter) and when there is **no like** from the same user on the same post — an anti join on the pair `(post_id, user_id)`, written with `NOT EXISTS` or as a LEFT JOIN that keeps only unmatched rows.",
      "",
      "Then aggregate: group the qualifying comments by commenter and count `DISTINCT post_id`, because a spammer posting three comments on one post has still hit only one post. `HAVING COUNT(DISTINCT post_id) >= 2` applies the threshold to the group.",
      "",
      "The third query deduplicates `(user_id, post_id)` pairs first and uses a row-value `NOT IN` against `likes`; that is safe because both columns of the likes primary key are non-NULL. All three are linear with the composite index on `likes`.",
    ].join("\n"),
  },

  {
    slug: "sharp-follower-drops-between-snapshots",
    title: "Sharp Follower Drops Between Daily Snapshots",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates"],
    description: [
      "A nightly job snapshots every creator's follower count, though a failed run leaves a day without a snapshot. A creator **lost more than 5%** when a snapshot's `followers` is below 95% of that creator's **previous snapshot** (the latest earlier `snapshot_date`, however many days back).",
      "",
      "Return the columns `creator_id`, `snapshot_date`, `previous_followers`, `followers` and `drop_pct` — `(previous_followers − followers) × 100 ÷ previous_followers` **rounded to 2 decimals** — **ordered by `creator_id`, then `snapshot_date`**. A creator's first snapshot has nothing to compare with and is never returned.",
    ].join("\n"),
    tables: [
      {
        name: "follower_snapshots",
        columns: [
          { name: "creator_id", type: "int" },
          { name: "snapshot_date", type: "date" },
          { name: "followers", type: "int" },
        ],
        primaryKey: ["creator_id", "snapshot_date"],
        note: "One row per creator per day the job ran; `followers` is always positive.",
      },
    ],
    examples: [
      {
        follower_snapshots: [
          [1, "2025-06-01", 52000],
          [1, "2025-06-02", 51900],
          [1, "2025-06-03", 48000],
          [1, "2025-06-05", 47800],
          [2, "2025-06-01", 8000],
          [2, "2025-06-02", 7600],
          [2, "2025-06-04", 7100],
          [3, "2025-06-03", 1200],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const nc = chance(rng, 0.05) ? 0 : ri(rng, 1, 4);
      for (let c = 1; c <= nc; c++) {
        let f = ri(rng, 1500, 90000);
        let d = dateBetween(rng, "2025-06-01", "2025-06-05");
        for (let k = ri(rng, 1, 7); k > 0; k--) {
          rows.push([c, d, f]);
          d = addDays(d, ri(rng, 1, 3));
          const move = pick(rng, [-0.12, -0.08, -0.05, -0.03, 0, 0.02, 0.06]);
          f = Math.max(1, Math.round(f * (1 + move)) + ri(rng, -40, 40));
        }
      }
      return { follower_snapshots: rows };
    },
    solution: [
      "SELECT creator_id, snapshot_date, previous_followers, followers,",
      "       ROUND((previous_followers - followers) * 100 / previous_followers, 2) AS drop_pct",
      "FROM (",
      "  SELECT creator_id, snapshot_date, followers,",
      "         LAG(followers) OVER (PARTITION BY creator_id ORDER BY snapshot_date) AS previous_followers",
      "  FROM follower_snapshots",
      ") s",
      "WHERE followers * 100 < previous_followers * 95",
      "ORDER BY creator_id, snapshot_date",
    ].join("\n"),
    alternatives: [
      [
        "SELECT creator_id, snapshot_date, previous_followers, followers,",
        "       ROUND((previous_followers - followers) * 100 / previous_followers, 2) AS drop_pct",
        "FROM (",
        "  SELECT a.creator_id, a.snapshot_date, a.followers,",
        "         (SELECT b.followers FROM follower_snapshots b",
        "          WHERE b.creator_id = a.creator_id AND b.snapshot_date < a.snapshot_date",
        "          ORDER BY b.snapshot_date DESC LIMIT 1) AS previous_followers",
        "  FROM follower_snapshots a",
        ") s",
        "WHERE followers < previous_followers * 0.95",
        "ORDER BY creator_id, snapshot_date",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Each row needs a value from the creator's previous row — that is what `LAG` returns.",
      "Partition the window by creator so one creator's first snapshot does not look at another creator's last.",
      "Window results cannot be filtered in the same SELECT's WHERE; wrap the query and filter outside.",
    ],
    editorial: [
      "`LAG(followers) OVER (PARTITION BY creator_id ORDER BY snapshot_date)` puts the previous snapshot's count beside each row. Because it works on **rows**, not calendar days, a missing day is skipped over naturally — the previous snapshot is whatever came last before, which is the rule. Partitioning by creator makes each creator's first snapshot get NULL.",
      "",
      "The filter has to happen in an outer query. Comparing `followers * 100 < previous_followers * 95` keeps it in integers, so a drop of exactly 5% is not \"more than 5%\"; a NULL previous count makes the comparison unknown and drops the first snapshot.",
      "",
      "The percentage divides by the previous count and is rounded to 2 decimals. Without window functions, a correlated subquery fetches the latest earlier snapshot with `ORDER BY snapshot_date DESC LIMIT 1` — correct, but one lookup per row instead of one sorted pass.",
    ].join("\n"),
  },

  {
    slug: "sign-ups-by-email-provider",
    title: "Sign-Ups by Email Provider",
    difficulty: "MEDIUM",
    topics: ["Strings", "Aggregation", "Conditional Logic"],
    description: [
      "Growth wants to know which email providers people sign up with. The provider is the part of the email **after the `@`**, except that **`googlemail.com` is the same provider as `gmail.com`** and must be counted as `gmail.com`.",
      "",
      "Considering only accounts that signed up in **2024**, return the columns `domain` and `signups` for providers with **at least 2** sign-ups, **ordered by `signups` descending, then `domain`**. Emails are stored lower-case and contain exactly one `@`.",
    ].join("\n"),
    tables: [
      {
        name: "users",
        columns: [
          { name: "user_id", type: "int" },
          { name: "email", type: "varchar" },
          { name: "signed_up_on", type: "date" },
        ],
        primaryKey: ["user_id"],
        note: "One row per account.",
      },
    ],
    examples: [
      {
        users: [
          [1, "aarav.k@gmail.com", "2024-01-14"],
          [2, "diya92@googlemail.com", "2024-02-03"],
          [3, "kabir@outlook.com", "2024-03-21"],
          [4, "meera.n@iitb.ac.in", "2024-04-09"],
          [5, "rohan@outlook.com", "2024-06-30"],
          [6, "zara.s@gmail.com", "2023-12-31"],
          [7, "ishaan@iitb.ac.in", "2025-01-02"],
          [8, "priya.r@yahoo.co.in", "2024-11-11"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 18);
      const domains = ["gmail.com", "googlemail.com", "outlook.com", "yahoo.co.in", "yahoo.com", "iitb.ac.in", "rediffmail.com", "proton.me"];
      const pool = sample(rng, domains, ri(rng, 2, 6));
      return {
        users: names(rng, Math.min(n, 40)).map((nm, i) => [i + 1, `${nm.toLowerCase()}${ri(rng, 1, 99)}@${pick(rng, pool)}`, dateBetween(rng, "2023-11-01", "2025-02-28")]),
      };
    },
    solution: [
      "SELECT domain, COUNT(*) AS signups",
      "FROM (",
      "  SELECT CASE WHEN SUBSTRING_INDEX(email, '@', -1) = 'googlemail.com' THEN 'gmail.com'",
      "              ELSE SUBSTRING_INDEX(email, '@', -1) END AS domain",
      "  FROM users",
      "  WHERE signed_up_on BETWEEN '2024-01-01' AND '2024-12-31'",
      ") t",
      "GROUP BY domain",
      "HAVING COUNT(*) >= 2",
      "ORDER BY signups DESC, domain",
    ].join("\n"),
    alternatives: [
      [
        "SELECT REPLACE(SUBSTRING(email, LOCATE('@', email) + 1), 'googlemail.com', 'gmail.com') AS domain, COUNT(*) AS signups",
        "FROM users WHERE YEAR(signed_up_on) = 2024",
        "GROUP BY REPLACE(SUBSTRING(email, LOCATE('@', email) + 1), 'googlemail.com', 'gmail.com')",
        "HAVING COUNT(*) >= 2 ORDER BY signups DESC, domain",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`SUBSTRING_INDEX(email, '@', -1)` returns everything after the last `@`.",
      "Merge the two Google spellings before grouping, or they become two groups.",
      "Compute the domain in a derived table so the outer query can group and sort by it by name.",
    ],
    editorial: [
      "Extract the provider with `SUBSTRING_INDEX(email, '@', -1)` — a negative count takes the part after the last delimiter — or with `SUBSTRING(email, LOCATE('@', email) + 1)`. Then normalise: a CASE maps `googlemail.com` to `gmail.com` (the alternative uses REPLACE, which is safe because no other provider's name contains that text).",
      "",
      "The merge must happen **before** the GROUP BY. Grouping by the raw domain and fixing the label afterwards would leave two groups both called `gmail.com`. Computing the clean domain in a derived table and grouping the outer query by it is the tidy way; grouping directly by the full expression, as the alternative does, works too.",
      "",
      "The year filter keeps the column bare with BETWEEN on the date, and `HAVING COUNT(*) >= 2` drops one-off providers. Ties on the count fall back to the domain name. It is one scan plus a small grouping.",
    ].join("\n"),
  },

  {
    slug: "first-hashtag-of-each-caption",
    title: "Most Common Leading Hashtags in Captions",
    difficulty: "MEDIUM",
    topics: ["Strings", "Aggregation"],
    description: [
      "Older posts stored hashtags only inside the caption text. To backfill the topic of each post, take the **first hashtag** in its caption: the text after the first `#` up to the next space (or the end of the caption). Hashtags are lower-case letters and digits and are always followed by a space or the end of the caption.",
      "",
      "Return the columns `hashtag` (without the `#`) and `post_count` — how many posts have it as their first hashtag — **ordered by `post_count` descending, then `hashtag`**. Posts whose caption is NULL or has no `#` are ignored.",
    ].join("\n"),
    tables: [
      {
        name: "posts",
        columns: [
          { name: "post_id", type: "int" },
          { name: "author_id", type: "int" },
          { name: "caption", type: "varchar" },
        ],
        primaryKey: ["post_id"],
        note: "One row per legacy post; `caption` may be NULL.",
      },
    ],
    examples: [
      {
        posts: [
          [1, 3, "Sunday brunch at Bandra #foodie #mumbaidiaries"],
          [2, 4, "#ipl what a finish tonight #cricket"],
          [3, 3, "Rain again #mumbaidiaries"],
          [4, 5, "no tags on this one"],
          [5, 6, "#foodie"],
          [6, 4, null],
          [7, 7, "Last over drama #ipl #memes"],
          [8, 5, "Street food crawl #foodie #travel"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 15);
      const tags = sample(rng, HASHTAGS, ri(rng, 2, 5));
      const words = ["what a day", "sunday vibes", "with the gang", "new post", "throwback", "so good"];
      return {
        posts: seq(1, n).map((id) => {
          const k = ri(rng, 0, 3);
          if (chance(rng, 0.1)) return [id, ri(rng, 1, 6), null];
          const ts = Array.from({ length: k }, () => `#${pick(rng, tags)}`);
          const shape = ri(rng, 0, 2);
          const text = pick(rng, words);
          const caption = k === 0 ? text : shape === 0 ? `${text} ${ts.join(" ")}` : shape === 1 ? `${ts[0]} ${text} ${ts.slice(1).join(" ")}`.trim() : ts.join(" ");
          return [id, ri(rng, 1, 6), caption];
        }),
      };
    },
    solution: [
      "SELECT hashtag, COUNT(*) AS post_count",
      "FROM (",
      "  SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(caption, '#', 2), '#', -1), ' ', 1) AS hashtag",
      "  FROM posts",
      "  WHERE caption LIKE '%#%'",
      ") t",
      "GROUP BY hashtag",
      "ORDER BY post_count DESC, hashtag",
    ].join("\n"),
    alternatives: [
      [
        "SELECT SUBSTRING_INDEX(SUBSTRING(caption, LOCATE('#', caption) + 1), ' ', 1) AS hashtag, COUNT(*) AS post_count",
        "FROM posts WHERE LOCATE('#', caption) > 0",
        "GROUP BY SUBSTRING_INDEX(SUBSTRING(caption, LOCATE('#', caption) + 1), ' ', 1)",
        "ORDER BY post_count DESC, hashtag",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Find where the first `#` is, and take the text that follows it.",
      "From that text, the hashtag is everything before the first space — `SUBSTRING_INDEX(x, ' ', 1)` returns the whole string when there is no space.",
      "Filter out captions without a `#` (and NULL captions) before grouping.",
    ],
    editorial: [
      "Two string steps isolate the tag. First, get the text after the first `#`: `SUBSTRING(caption, LOCATE('#', caption) + 1)` does it directly, and the solution's `SUBSTRING_INDEX(SUBSTRING_INDEX(caption, '#', 2), '#', -1)` takes the piece between the first and second `#` instead. Second, cut that text at its first space with `SUBSTRING_INDEX(…, ' ', 1)`; when the tag ends the caption there is no space and the whole remainder is the tag.",
      "",
      "Captions with no `#` must be removed first — `SUBSTRING_INDEX` would otherwise return the caption's first word as if it were a tag. `LIKE '%#%'` and `LOCATE('#', caption) > 0` both reject NULL captions as well, because a NULL makes the predicate unknown.",
      "",
      "Then group by the extracted tag and count. Ties on the count are sorted by the tag. String functions on every row make it a full scan — fine for a one-time backfill, after which the tags belong in their own table.",
    ].join("\n"),
  },

  {
    slug: "creators-whose-latest-post-underperformed",
    title: "Creators Whose Latest Post Underperformed",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation"],
    description: [
      "Creator success managers reach out when a creator's **latest post** (greatest `posted_at`; no creator has two posts at the same moment) got **fewer likes than the average of all their earlier posts**. Creators with a single post have no earlier posts and are never flagged.",
      "",
      "Return the columns `creator_id`, `latest_post_id`, `latest_likes` and `earlier_avg` (the earlier posts' average likes, **rounded to 1 decimal**), in any order.",
    ].join("\n"),
    tables: [
      {
        name: "posts",
        columns: [
          { name: "post_id", type: "int" },
          { name: "creator_id", type: "int" },
          { name: "posted_at", type: "datetime" },
          { name: "likes", type: "int" },
        ],
        primaryKey: ["post_id"],
        note: "One row per post; `posted_at` is unique within a creator and `likes` is never NULL.",
      },
    ],
    examples: [
      {
        posts: [
          [1, 1, "2025-02-01 18:00:00", 400],
          [2, 1, "2025-02-08 18:00:00", 600],
          [3, 1, "2025-02-15 18:00:00", 450],
          [4, 2, "2025-02-03 09:00:00", 120],
          [5, 2, "2025-02-10 09:00:00", 200],
          [6, 3, "2025-02-05 21:00:00", 900],
          [7, 4, "2025-02-02 12:00:00", 300],
          [8, 4, "2025-02-09 12:00:00", 301],
          [9, 4, "2025-02-16 12:00:00", 300],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const nc = ri(rng, 1, 5);
      let id = 1;
      for (let c = 1; c <= nc; c++) {
        const days = sample(rng, seq(1, 28), ri(rng, 1, 6)).sort((a, b) => a - b);
        const base = roundTo(rng, 50, 900, 10);
        for (const d of days) rows.push([id++, c, `2025-02-${String(d).padStart(2, "0")} ${pick(rng, ["09", "18", "21"])}:00:00`, Math.max(0, base + ri(rng, -6, 6) * 10)]);
      }
      return { posts: shuffle(rng, rows) };
    },
    solution: [
      "SELECT p.creator_id, p.post_id AS latest_post_id, p.likes AS latest_likes,",
      "       ROUND((SELECT AVG(q.likes) FROM posts q",
      "              WHERE q.creator_id = p.creator_id AND q.posted_at < p.posted_at), 1) AS earlier_avg",
      "FROM posts p",
      "WHERE p.posted_at = (SELECT MAX(q.posted_at) FROM posts q WHERE q.creator_id = p.creator_id)",
      "  AND p.likes < (SELECT AVG(q.likes) FROM posts q",
      "                 WHERE q.creator_id = p.creator_id AND q.posted_at < p.posted_at)",
    ].join("\n"),
    alternatives: [
      [
        "SELECT creator_id, post_id AS latest_post_id, likes AS latest_likes, ROUND(earlier_avg, 1) AS earlier_avg",
        "FROM (",
        "  SELECT creator_id, post_id, likes,",
        "         ROW_NUMBER() OVER (PARTITION BY creator_id ORDER BY posted_at DESC) AS rn,",
        "         AVG(likes) OVER (PARTITION BY creator_id ORDER BY posted_at ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS earlier_avg",
        "  FROM posts",
        ") t",
        "WHERE rn = 1 AND likes < earlier_avg",
      ].join("\n"),
      [
        "SELECT l.creator_id, l.post_id AS latest_post_id, l.likes AS latest_likes, ROUND(AVG(e.likes), 1) AS earlier_avg",
        "FROM posts l",
        "JOIN posts e ON e.creator_id = l.creator_id AND e.posted_at < l.posted_at",
        "WHERE NOT EXISTS (SELECT 1 FROM posts x WHERE x.creator_id = l.creator_id AND x.posted_at > l.posted_at)",
        "GROUP BY l.creator_id, l.post_id, l.likes",
        "HAVING l.likes < AVG(e.likes)",
      ].join("\n"),
    ],
    hints: [
      "Two questions per creator: which post is the latest, and what is the average of the posts before it.",
      "Both are correlated subqueries keyed on the creator — one with MAX, one with AVG over earlier rows.",
      "With one post only, the earlier average is NULL, and comparing with NULL is never true.",
    ],
    editorial: [
      "Pick each creator's latest post with a correlated subquery, `p.posted_at = (SELECT MAX(posted_at) … same creator)`. For that post, the earlier average is `AVG(likes)` over the same creator's posts with a smaller `posted_at` — another correlated subquery — and the post is flagged when its likes are strictly lower.",
      "",
      "Creators with one post need no special case: the earlier set is empty, `AVG` over no rows is NULL, and `likes < NULL` is unknown, so the row is filtered out. Likes equal to the average are not \"fewer\".",
      "",
      "The window alternative computes both facts in one pass: `ROW_NUMBER` by `posted_at DESC` marks the latest post, and `AVG(likes)` with the frame `ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING` averages everything before each row. The third joins every earlier post to the latest one and aggregates, keeping the latest via `NOT EXISTS` of a later post. The average is rounded to one decimal for display.",
    ].join("\n"),
  },

  {
    slug: "group-chats-silent-for-a-month",
    title: "Group Chats Silent for More Than 30 Days",
    difficulty: "MEDIUM",
    topics: ["Joins", "Dates", "Aggregation"],
    description: [
      "To reduce clutter, the messaging app will suggest archiving group chats that have gone quiet. **As of 2025-03-31**, a group is quiet when the **calendar date of its last message is more than 30 days before 2025-03-31**, or when it has **no messages at all**.",
      "",
      "Return the columns `chat_id`, `chat_name` and `last_message_at` (the timestamp of its latest message, NULL if none), **ordered by `chat_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "group_chats",
        columns: [
          { name: "chat_id", type: "int" },
          { name: "chat_name", type: "varchar" },
          { name: "created_on", type: "date" },
        ],
        primaryKey: ["chat_id"],
        note: "One row per group chat.",
      },
      {
        name: "messages",
        columns: [
          { name: "message_id", type: "int" },
          { name: "chat_id", type: "int" },
          { name: "sender_id", type: "int" },
          { name: "sent_at", type: "datetime" },
        ],
        primaryKey: ["message_id"],
        note: "`chat_id` is always a row of `group_chats`. No message is later than 2025-03-31 23:59:59.",
      },
    ],
    examples: [
      {
        group_chats: [
          [1, "Hostel Wing B", "2024-08-01"],
          [2, "Goa Trip 2025", "2024-12-10"],
          [3, "Cousins", "2023-05-20"],
          [4, "Placement Prep", "2025-01-05"],
          [5, "Office Lunch", "2025-03-28"],
        ],
        messages: [
          [1, 1, 11, "2025-03-30 22:10:00"],
          [2, 1, 12, "2025-02-01 09:00:00"],
          [3, 2, 13, "2025-02-28 23:59:00"],
          [4, 3, 14, "2025-01-12 18:00:00"],
          [5, 3, 15, "2025-01-14 07:45:00"],
          [6, 4, 16, "2025-03-01 00:01:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 8);
      const chatNames = ["Hostel Wing B", "Goa Trip 2025", "Cousins", "Placement Prep", "Office Lunch", "Cricket Sundays", "Flat 402", "Book Club", "Batch of 2022", "Gym Buddies"];
      const chats = sample(rng, chatNames, n).map((nm, i) => [i + 1, nm, dateBetween(rng, "2023-01-01", "2025-03-01")]);
      const msgs: Cell[][] = [];
      let id = 1;
      for (const c of chats) {
        const k = chance(rng, 0.2) ? 0 : ri(rng, 1, 4);
        const latest = pick(rng, ["2025-02-28", "2025-03-01", "2025-03-02", "2025-01-15", "2025-03-31", "2024-12-31"]);
        for (let j = 0; j < k; j++) msgs.push([id++, c[0]!, ri(rng, 10, 30), atTime(rng, j === 0 ? latest : addDays(latest, -ri(rng, 1, 60)))]);
      }
      return { group_chats: chats, messages: msgs };
    },
    solution: [
      "SELECT g.chat_id, g.chat_name, MAX(m.sent_at) AS last_message_at",
      "FROM group_chats g",
      "LEFT JOIN messages m ON m.chat_id = g.chat_id",
      "GROUP BY g.chat_id, g.chat_name",
      "HAVING MAX(m.sent_at) IS NULL OR DATEDIFF('2025-03-31', MAX(m.sent_at)) > 30",
      "ORDER BY g.chat_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT g.chat_id, g.chat_name, (SELECT MAX(m.sent_at) FROM messages m WHERE m.chat_id = g.chat_id) AS last_message_at",
        "FROM group_chats g",
        "WHERE NOT EXISTS (SELECT 1 FROM messages m WHERE m.chat_id = g.chat_id AND m.sent_at >= '2025-03-01')",
        "ORDER BY g.chat_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "A LEFT JOIN keeps chats with no messages; their MAX(sent_at) is NULL.",
      "The condition is on an aggregate (the latest message), so it goes in HAVING.",
      "`DATEDIFF` compares calendar dates and ignores the time of day; work out which first date is *not* quiet.",
    ],
    editorial: [
      "Each chat's last message is `MAX(sent_at)` over its messages. A **LEFT JOIN** from `group_chats` keeps chats that never had a message, and for them the maximum is NULL. Because the quiet test is about that maximum, it belongs in **HAVING**: keep a group when the maximum is NULL or when `DATEDIFF('2025-03-31', MAX(sent_at)) > 30`.",
      "",
      "`DATEDIFF` uses only the date part, so a last message at 00:01 on 1 March is exactly 30 days back and the chat is **not** quiet, while one at 23:59 on 28 February is 31 days back and is. Seeing that boundary leads to the alternative: a chat is quiet exactly when it has no message on or after `2025-03-01` — a `NOT EXISTS` that also covers chats with no messages at all — with the last timestamp fetched by a scalar subquery for display.",
      "",
      "Grouping by both `chat_id` and `chat_name` keeps the query valid under ONLY_FULL_GROUP_BY. With an index on `messages(chat_id, sent_at)` each chat costs one index probe.",
    ].join("\n"),
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "average-dm-reply-time-per-user",
    title: "Average Reply Time in Direct Messages",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "The messaging team measures how quickly people answer DMs. Every conversation is between exactly two users. Order a conversation's messages by `sent_at`, then `message_id`. A message is a **reply** when the message just before it in the same conversation was sent by **the other person**; its reply time is the number of **whole minutes** between the two messages (`TIMESTAMPDIFF(MINUTE, …)`). A second message in a row from the same sender is not a reply, and a conversation's first message is not a reply.",
      "",
      "Return the columns `user_id` (the replier), `replies` and `avg_reply_minutes` (the average reply time, **rounded to 1 decimal**) for every user with at least one reply, **ordered by `avg_reply_minutes`, then `user_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "dm_messages",
        columns: [
          { name: "message_id", type: "int" },
          { name: "conversation_id", type: "int" },
          { name: "sender_id", type: "int" },
          { name: "sent_at", type: "datetime" },
        ],
        primaryKey: ["message_id"],
        note: "One row per direct message. Each conversation has exactly two participants.",
      },
    ],
    examples: [
      {
        dm_messages: [
          [1, 100, 7, "2025-07-01 09:00:00"],
          [2, 100, 8, "2025-07-01 09:04:30"],
          [3, 100, 8, "2025-07-01 09:05:00"],
          [4, 100, 7, "2025-07-01 09:45:10"],
          [5, 101, 9, "2025-07-01 20:00:00"],
          [6, 101, 7, "2025-07-01 22:00:00"],
          [7, 101, 9, "2025-07-01 22:01:59"],
          [8, 102, 8, "2025-07-02 08:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const nconv = chance(rng, 0.05) ? 0 : ri(rng, 1, 4);
      const people = seq(1, 6);
      for (let c = 0; c < nconv; c++) {
        const [a, b] = sample(rng, people, 2) as [number, number];
        let t = Date.parse(`${dateBetween(rng, "2025-07-01", "2025-07-10")}T${String(ri(rng, 8, 20)).padStart(2, "0")}:00:00Z`);
        for (let k = ri(rng, 1, 8); k > 0; k--) {
          rows.push([0, 100 + c, chance(rng, 0.6) ? (rows.length % 2 ? a : b) : pick(rng, [a, b]), ts(t)]);
          t += pick(rng, [0, 45, 59, 60, 61, 300, 1799, 3600, 7260]) * 1000;
        }
      }
      // Ids in time order, with the occasional equal timestamp left to the id.
      rows.forEach((r, i) => (r[0] = i + 1));
      return { dm_messages: shuffle(rng, rows) };
    },
    solution: [
      "WITH ordered AS (",
      "  SELECT sender_id, sent_at,",
      "         LAG(sender_id) OVER (PARTITION BY conversation_id ORDER BY sent_at, message_id) AS prev_sender,",
      "         LAG(sent_at) OVER (PARTITION BY conversation_id ORDER BY sent_at, message_id) AS prev_sent_at",
      "  FROM dm_messages",
      ")",
      "SELECT sender_id AS user_id,",
      "       COUNT(*) AS replies,",
      "       ROUND(AVG(TIMESTAMPDIFF(MINUTE, prev_sent_at, sent_at)), 1) AS avg_reply_minutes",
      "FROM ordered",
      "WHERE prev_sender IS NOT NULL AND prev_sender <> sender_id",
      "GROUP BY sender_id",
      "ORDER BY avg_reply_minutes, user_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT d.sender_id AS user_id, COUNT(*) AS replies,",
        "       ROUND(AVG(TIMESTAMPDIFF(MINUTE, p.sent_at, d.sent_at)), 1) AS avg_reply_minutes",
        "FROM dm_messages d",
        "JOIN dm_messages p ON p.message_id = (",
        "  SELECT q.message_id FROM dm_messages q",
        "  WHERE q.conversation_id = d.conversation_id",
        "    AND (q.sent_at < d.sent_at OR (q.sent_at = d.sent_at AND q.message_id < d.message_id))",
        "  ORDER BY q.sent_at DESC, q.message_id DESC LIMIT 1)",
        "WHERE p.sender_id <> d.sender_id",
        "GROUP BY d.sender_id",
        "ORDER BY avg_reply_minutes, user_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Each message needs the sender and time of the message right before it in its conversation — `LAG` over a window partitioned by conversation.",
      "Order the window by `sent_at` and then `message_id`, so equal timestamps still have a fixed order.",
      "Keep only rows whose previous sender exists and is different, then aggregate per sender.",
      "`TIMESTAMPDIFF(MINUTE, a, b)` counts whole minutes and drops the leftover seconds.",
    ],
    editorial: [
      "The definition of a reply looks one row back, so the tool is `LAG`. Over a window **partitioned by conversation** and ordered by `sent_at, message_id`, `LAG(sender_id)` and `LAG(sent_at)` put the previous message's sender and time beside each message. The partition matters: without it, the first message of one conversation would look back into another.",
      "",
      "A row is a reply when `prev_sender` is not NULL (it is not the conversation's first message) and differs from `sender_id` (a double text is not an answer). For those rows the reply time is `TIMESTAMPDIFF(MINUTE, prev_sent_at, sent_at)` — whole minutes, so 1 minute 59 seconds counts as 1. The outer query groups by the replier, counts replies and averages, rounded to one decimal so every engine prints the same value.",
      "",
      "Without window functions, a correlated subquery finds each message's predecessor — the latest earlier message by `(sent_at, message_id)` — and a join brings its sender and time. It is correct but runs one ordered lookup per message, against one sort per conversation for the window version. The final order is by the rounded average, with `user_id` breaking ties.",
    ].join("\n"),
  },

  {
    slug: "friend-suggestions-with-two-mutual-friends",
    title: "Friend Suggestions From Two or More Mutual Friends",
    difficulty: "HARD",
    topics: ["Joins", "Aggregation", "Subqueries"],
    description: [
      "\"People you may know\" suggests two users to each other when they are **not friends** yet, have **at least two mutual friends**, and **neither has blocked the other**. Friendship is mutual and each friendship is stored once, with `user_a < user_b`.",
      "",
      "Return each suggested pair once with the columns `user_id` (the smaller id), `suggested_id` (the larger id) and `mutual_friends`, **ordered by `mutual_friends` descending, then `user_id`, then `suggested_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "users",
        columns: [
          { name: "user_id", type: "int" },
          { name: "handle", type: "varchar" },
        ],
        primaryKey: ["user_id"],
        note: "One row per account.",
      },
      {
        name: "friendships",
        columns: [
          { name: "user_a", type: "int" },
          { name: "user_b", type: "int" },
          { name: "since", type: "date" },
        ],
        primaryKey: ["user_a", "user_b"],
        note: "One row per friendship, always with `user_a < user_b`; both are rows of `users`.",
      },
      {
        name: "blocks",
        columns: [
          { name: "blocker_id", type: "int" },
          { name: "blocked_id", type: "int" },
        ],
        primaryKey: ["blocker_id", "blocked_id"],
        note: "`blocker_id` has blocked `blocked_id`. A block in either direction rules a suggestion out.",
      },
    ],
    examples: [
      {
        users: [
          [1, "aarav.eats"],
          [2, "diya_travels"],
          [3, "kabir.codes"],
          [4, "meera_fit"],
          [5, "rohan.memes"],
          [6, "zara_ootd"],
        ],
        friendships: [
          [1, 2, "2023-01-10"],
          [1, 3, "2023-02-14"],
          [2, 4, "2023-03-01"],
          [3, 4, "2023-04-22"],
          [2, 5, "2023-05-05"],
          [3, 5, "2023-06-30"],
          [4, 6, "2024-01-01"],
          [5, 6, "2024-02-02"],
        ],
        blocks: [[6, 2]],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 4, 8);
      const hs = handles(rng, n);
      const users = hs.map((h, i) => [i + 1, h]);
      const p = pick(rng, [0.4, 0.5, 0.6]);
      const edges = new Set<string>();
      const key = (x: number, y: number) => `${Math.min(x, y)}-${Math.max(x, y)}`;
      for (let a = 1; a <= n; a++) for (let b = a + 1; b <= n; b++) if (chance(rng, p)) edges.add(key(a, b));
      // Usually plant one pair of strangers with two friends in common.
      if (chance(rng, 0.8)) {
        const [x, y, m1, m2] = sample(rng, seq(1, n), 4) as [number, number, number, number];
        edges.delete(key(x, y));
        for (const m of [m1, m2]) {
          edges.add(key(x, m));
          edges.add(key(y, m));
        }
      }
      const friendships: Cell[][] = [...edges].map((e) => {
        const [a, b] = e.split("-").map(Number) as [number, number];
        return [a, b, dateBetween(rng, "2022-01-01", "2024-12-31")];
      });
      const blocks: Cell[][] = [];
      const seen = new Set<string>();
      for (let k = ri(rng, 0, 3); k > 0; k--) {
        const [x, y] = sample(rng, seq(1, n), 2) as [number, number];
        if (!seen.has(`${x}-${y}`)) {
          seen.add(`${x}-${y}`);
          blocks.push([x, y]);
        }
      }
      return { users, friendships, blocks };
    },
    solution: [
      "WITH f AS (",
      "  SELECT user_a AS u, user_b AS v FROM friendships",
      "  UNION ALL",
      "  SELECT user_b AS u, user_a AS v FROM friendships",
      ")",
      "SELECT f1.u AS user_id, f2.u AS suggested_id, COUNT(*) AS mutual_friends",
      "FROM f f1",
      "JOIN f f2 ON f2.v = f1.v AND f1.u < f2.u",
      "WHERE NOT EXISTS (SELECT 1 FROM friendships x WHERE x.user_a = f1.u AND x.user_b = f2.u)",
      "  AND NOT EXISTS (SELECT 1 FROM blocks b",
      "                  WHERE (b.blocker_id = f1.u AND b.blocked_id = f2.u)",
      "                     OR (b.blocker_id = f2.u AND b.blocked_id = f1.u))",
      "GROUP BY f1.u, f2.u",
      "HAVING COUNT(*) >= 2",
      "ORDER BY mutual_friends DESC, user_id, suggested_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT user_id, suggested_id, mutual_friends FROM (",
        "  SELECT a.user_id, b.user_id AS suggested_id,",
        "         (SELECT COUNT(*) FROM users m",
        "          WHERE EXISTS (SELECT 1 FROM friendships x WHERE x.user_a = LEAST(a.user_id, m.user_id) AND x.user_b = GREATEST(a.user_id, m.user_id))",
        "            AND EXISTS (SELECT 1 FROM friendships y WHERE y.user_a = LEAST(b.user_id, m.user_id) AND y.user_b = GREATEST(b.user_id, m.user_id))",
        "         ) AS mutual_friends",
        "  FROM users a JOIN users b ON a.user_id < b.user_id",
        "  WHERE NOT EXISTS (SELECT 1 FROM friendships x WHERE x.user_a = a.user_id AND x.user_b = b.user_id)",
        "    AND NOT EXISTS (SELECT 1 FROM blocks k WHERE k.blocker_id IN (a.user_id, b.user_id) AND k.blocked_id IN (a.user_id, b.user_id))",
        ") t",
        "WHERE mutual_friends >= 2",
        "ORDER BY mutual_friends DESC, user_id, suggested_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Friendship is stored in one direction only; first turn it into both directions so \"friends of x\" is a single lookup.",
      "Two users share a mutual friend when both rows of the doubled table point at the same friend — join it to itself on the friend.",
      "Exclude pairs that are already friends and pairs with a block either way, then count and keep counts of 2 or more.",
    ],
    editorial: [
      "Storing each friendship once with `user_a < user_b` saves space but makes \"who are x's friends?\" awkward, so the first step **doubles the edges**: a UNION ALL of `(user_a, user_b)` and `(user_b, user_a)` gives a directed table `f(u, v)` meaning \"v is a friend of u\".",
      "",
      "Two users `x < y` share the mutual friend `m` exactly when `f` holds both `(x, m)` and `(y, m)`. Self-joining `f` on the friend column (`f2.v = f1.v`) with `f1.u < f2.u` produces one row per (pair, mutual friend) and each unordered pair only once, so `COUNT(*)` grouped by the pair is the number of mutual friends.",
      "",
      "Two anti joins remove pairs that must not be suggested: an existing friendship (looked up in the stored orientation, since `f1.u < f2.u`) and a block in **either** direction. `HAVING COUNT(*) >= 2` keeps strong suggestions. The alternative instead walks all pairs of users and counts mutual friends with a correlated subquery that normalises each lookup with LEAST/GREATEST — clearer, but quadratic in users times friends. The join version only touches pairs that actually share someone.",
    ].join("\n"),
  },

  {
    slug: "longest-daily-posting-streak-per-creator",
    title: "Longest Daily Posting Streak per Creator",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "Creators earn a badge for posting every day. A **streak** is a run of consecutive calendar days on each of which the creator posted at least once (several posts on one day count as one day; the date is the date part of `posted_at`).",
      "",
      "For every creator with at least one post, return the columns `creator_id`, `longest_streak` (its length in days) and `streak_start` (the first day of that streak; if two streaks tie for longest, the **earlier** one), **ordered by `creator_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "posts",
        columns: [
          { name: "post_id", type: "int" },
          { name: "creator_id", type: "int" },
          { name: "posted_at", type: "datetime" },
        ],
        primaryKey: ["post_id"],
        note: "One row per post, with the time it went live (IST).",
      },
    ],
    examples: [
      {
        posts: [
          [1, 1, "2025-08-01 09:00:00"],
          [2, 1, "2025-08-02 21:30:00"],
          [3, 1, "2025-08-02 23:10:00"],
          [4, 1, "2025-08-03 07:45:00"],
          [5, 1, "2025-08-05 12:00:00"],
          [6, 1, "2025-08-06 12:00:00"],
          [7, 2, "2025-08-10 18:00:00"],
          [8, 2, "2025-08-12 18:00:00"],
          [9, 3, "2025-07-30 22:00:00"],
          [10, 3, "2025-07-31 23:59:59"],
          [11, 3, "2025-08-01 00:00:01"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const nc = chance(rng, 0.05) ? 0 : ri(rng, 1, 4);
      let id = 1;
      for (let c = 1; c <= nc; c++) {
        const density = pick(rng, [0.4, 0.6, 0.8]);
        const start = dateBetween(rng, "2025-07-25", "2025-08-05");
        const span = ri(rng, 1, 12);
        for (let d = 0; d < span; d++) {
          if (!chance(rng, density) && rows.length > 0) continue;
          for (let k = ri(rng, 1, 2); k > 0; k--) rows.push([id++, c, atTime(rng, addDays(start, d))]);
        }
      }
      return { posts: rows };
    },
    solution: [
      "WITH days AS (",
      "  SELECT DISTINCT creator_id, DATE(posted_at) AS d FROM posts",
      "), numbered AS (",
      "  SELECT creator_id, d, ROW_NUMBER() OVER (PARTITION BY creator_id ORDER BY d) AS rn FROM days",
      "), streaks AS (",
      "  SELECT creator_id, MIN(d) AS start_day, COUNT(*) AS len",
      "  FROM (SELECT creator_id, d, DATE_SUB(d, INTERVAL rn DAY) AS grp FROM numbered) x",
      "  GROUP BY creator_id, grp",
      "), best AS (",
      "  SELECT creator_id, start_day, len,",
      "         ROW_NUMBER() OVER (PARTITION BY creator_id ORDER BY len DESC, start_day) AS k",
      "  FROM streaks",
      ")",
      "SELECT creator_id, len AS longest_streak, start_day AS streak_start",
      "FROM best WHERE k = 1",
      "ORDER BY creator_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH days AS (SELECT DISTINCT creator_id, DATE(posted_at) AS d FROM posts),",
        "flagged AS (",
        "  SELECT creator_id, d,",
        "         CASE WHEN DATEDIFF(d, LAG(d) OVER (PARTITION BY creator_id ORDER BY d)) = 1 THEN 0 ELSE 1 END AS is_new",
        "  FROM days",
        "), islands AS (",
        "  SELECT creator_id, d,",
        "         SUM(is_new) OVER (PARTITION BY creator_id ORDER BY d ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS island",
        "  FROM flagged",
        "), streaks AS (",
        "  SELECT creator_id, island, MIN(d) AS start_day, COUNT(*) AS len FROM islands GROUP BY creator_id, island",
        ")",
        "SELECT s.creator_id, s.len AS longest_streak, MIN(s.start_day) AS streak_start",
        "FROM streaks s",
        "WHERE s.len = (SELECT MAX(t.len) FROM streaks t WHERE t.creator_id = s.creator_id)",
        "GROUP BY s.creator_id, s.len",
        "ORDER BY s.creator_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Reduce the posts to distinct (creator, day) pairs first — a second post on a day must not lengthen a streak.",
      "Number each creator's days in order. Within a run of consecutive days, the day minus its row number is the same date.",
      "Group by that constant to get each streak's start and length, then pick the longest per creator, breaking ties by the start.",
    ],
    editorial: [
      "This is **gaps and islands**. Start with the distinct posting days per creator (`DATE(posted_at)`), so that two posts on one day count once — and note that 23:59:59 on 31 July and 00:00:01 on 1 August are two different days.",
      "",
      "Number each creator's days with `ROW_NUMBER()` in date order. Along a run of consecutive days both the date and the row number go up by one per row, so `DATE_SUB(d, INTERVAL rn DAY)` is constant inside a run and jumps when a day is skipped. Grouping by that key gives every streak with `MIN(d)` as its start and `COUNT(*)` as its length.",
      "",
      "The last step is top-1 per creator with a tie rule: `ROW_NUMBER()` ordered by `len DESC, start_day` picks the longest and, among equals, the earliest. The alternative finds islands differently — a day starts a new island unless it is exactly one day after the previous one (`LAG` + `DATEDIFF`), and a running SUM of those flags numbers the islands — and selects the longest with a correlated MAX, taking the earliest start with MIN. Both sort each creator's days once.",
    ].join("\n"),
  },

  {
    slug: "signup-cohort-first-week-retention",
    title: "First-Week Retention by Sign-Up Month",
    difficulty: "HARD",
    topics: ["Dates", "Aggregation", "Conditional Logic"],
    description: [
      "Product reviews first-week retention by sign-up cohort. A user is **retained** when they opened the app on **any day from 1 to 7 days after** their sign-up date (opening the app on the sign-up day itself does not count). A cohort is all users who signed up in the same calendar month.",
      "",
      "Return the columns `cohort_month` (`'YYYY-MM'`), `cohort_size`, `retained` and `retention_pct` (retained × 100 ÷ cohort size, **rounded to 1 decimal**) for every month that has sign-ups, **ordered by `cohort_month`**. A user's several opens count once.",
    ].join("\n"),
    tables: [
      {
        name: "users",
        columns: [
          { name: "user_id", type: "int" },
          { name: "signed_up_on", type: "date" },
          { name: "acquisition_channel", type: "varchar" },
        ],
        primaryKey: ["user_id"],
        note: "One row per account.",
      },
      {
        name: "app_opens",
        columns: [
          { name: "user_id", type: "int" },
          { name: "opened_on", type: "date" },
        ],
        primaryKey: ["user_id", "opened_on"],
        note: "One row per user per day they opened the app; `user_id` is always a row of `users`.",
      },
    ],
    examples: [
      {
        users: [
          [1, "2025-01-05", "instagram_ads"],
          [2, "2025-01-20", "referral"],
          [3, "2025-01-31", "organic"],
          [4, "2025-02-02", "referral"],
          [5, "2025-02-14", "organic"],
          [6, "2025-02-27", "instagram_ads"],
        ],
        app_opens: [
          [1, "2025-01-05"],
          [1, "2025-01-12"],
          [2, "2025-01-20"],
          [2, "2025-01-28"],
          [3, "2025-02-01"],
          [3, "2025-02-03"],
          [4, "2025-02-09"],
          [6, "2025-03-06"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 16);
      const users = seq(1, n).map((id) => [id, dateBetween(rng, "2024-12-01", "2025-03-31"), pick(rng, ["organic", "referral", "instagram_ads", "youtube_ads"])]);
      const opens: Cell[][] = [];
      const keep = pick(rng, [0.3, 0.5, 0.8]);
      for (const u of users) {
        const offsets = new Set<number>();
        if (chance(rng, 0.7)) offsets.add(0);
        if (chance(rng, keep)) offsets.add(pick(rng, [1, 3, 7]));
        if (chance(rng, 0.4)) offsets.add(pick(rng, [8, 10, 20]));
        if (chance(rng, 0.2)) offsets.add(-1);
        for (const o of offsets) opens.push([u[0]!, addDays(String(u[1]), o)]);
      }
      return { users, app_opens: opens };
    },
    solution: [
      "SELECT DATE_FORMAT(signed_up_on, '%Y-%m') AS cohort_month,",
      "       COUNT(*) AS cohort_size,",
      "       SUM(is_retained) AS retained,",
      "       ROUND(SUM(is_retained) * 100 / COUNT(*), 1) AS retention_pct",
      "FROM (",
      "  SELECT u.user_id, u.signed_up_on,",
      "         CASE WHEN COUNT(o.opened_on) > 0 THEN 1 ELSE 0 END AS is_retained",
      "  FROM users u",
      "  LEFT JOIN app_opens o ON o.user_id = u.user_id",
      "   AND o.opened_on BETWEEN DATE_ADD(u.signed_up_on, INTERVAL 1 DAY) AND DATE_ADD(u.signed_up_on, INTERVAL 7 DAY)",
      "  GROUP BY u.user_id, u.signed_up_on",
      ") t",
      "GROUP BY DATE_FORMAT(signed_up_on, '%Y-%m')",
      "ORDER BY cohort_month",
    ].join("\n"),
    alternatives: [
      [
        "SELECT cohort_month, COUNT(*) AS cohort_size, SUM(flag) AS retained, ROUND(AVG(flag) * 100, 1) AS retention_pct",
        "FROM (",
        "  SELECT LEFT(u.signed_up_on, 7) AS cohort_month,",
        "         IF(EXISTS (SELECT 1 FROM app_opens o WHERE o.user_id = u.user_id",
        "                    AND DATEDIFF(o.opened_on, u.signed_up_on) BETWEEN 1 AND 7), 1, 0) AS flag",
        "  FROM users u",
        ") t",
        "GROUP BY cohort_month",
        "ORDER BY cohort_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Decide retained/not retained per user first, as a 0/1 flag; then aggregate the flags per month.",
      "Put the date window in the join condition (or an EXISTS), so a user with no qualifying open still counts in the cohort.",
      "`DATEDIFF(opened_on, signed_up_on) BETWEEN 1 AND 7` is the window; day 0 is the sign-up day itself.",
    ],
    editorial: [
      "Retention questions go in two levels. **Per user**, compute a 0/1 flag: did any open fall between `signed_up_on + 1` and `signed_up_on + 7`? The solution LEFT JOINs the opens with that window in the ON clause — moving it to WHERE would drop users with no qualifying open and shrink the cohort — and turns `COUNT(o.opened_on) > 0` into 1 or 0. The alternative uses `EXISTS` with `DATEDIFF(...) BETWEEN 1 AND 7`, which also counts several opens once.",
      "",
      "**Per cohort**, group the users by `DATE_FORMAT(signed_up_on, '%Y-%m')`: `COUNT(*)` is the cohort size, `SUM(flag)` the retained users, and their ratio × 100 rounded to one decimal the percentage (the average of a 0/1 flag is the same ratio). Opens on the sign-up day, the day before or eight days after are outside the window, and a user who signed up on 31 January is retained by an open on 1 February — the window is about days since sign-up, not the calendar month.",
      "",
      "The cost is one join of users to their opens with a range condition; the composite key `(user_id, opened_on)` makes it an index range scan.",
    ].join("\n"),
  },

  {
    slug: "reshare-cascade-size-and-depth",
    title: "Reshare Cascades: Size, Depth and Unique Resharers",
    difficulty: "HARD",
    topics: ["Subqueries", "Aggregation", "Joins"],
    description: [
      "A reshare points at the post it reshared, which may itself be a reshare, so every original post (one with `reshare_of` NULL) roots a cascade. For each **original post with at least one reshare** anywhere in its cascade, report `total_reshares` (every reshare below it, at any level), `max_depth` (a direct reshare is depth 1, a reshare of that is depth 2, and so on) and `unique_resharers` (distinct authors of those reshares).",
      "",
      "Return the columns `post_id`, `total_reshares`, `max_depth` and `unique_resharers`, **ordered by `total_reshares` descending, then `post_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "posts",
        columns: [
          { name: "post_id", type: "int" },
          { name: "author_id", type: "int" },
          { name: "reshare_of", type: "int" },
          { name: "posted_at", type: "datetime" },
        ],
        primaryKey: ["post_id"],
        note: "`reshare_of` is the `post_id` this post reshared (always an earlier post, so there are no cycles), or NULL for an original post.",
      },
    ],
    examples: [
      {
        posts: [
          [1, 10, null, "2025-09-01 10:00:00"],
          [2, 11, 1, "2025-09-01 10:20:00"],
          [3, 12, 2, "2025-09-01 11:00:00"],
          [4, 11, 3, "2025-09-01 12:30:00"],
          [5, 13, 1, "2025-09-01 13:00:00"],
          [6, 14, null, "2025-09-02 08:00:00"],
          [7, 10, 6, "2025-09-02 09:15:00"],
          [8, 15, null, "2025-09-02 19:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 18);
      const rows: Cell[][] = [];
      for (let id = 1; id <= n; id++) {
        const original = id === 1 || chance(rng, 0.3);
        // Prefer recent posts as parents so chains get deep.
        const parent = original ? null : chance(rng, 0.6) ? id - 1 : ri(rng, 1, id - 1);
        rows.push([id, ri(rng, 10, 16), parent, `2025-09-${String(1 + Math.floor(id / 3)).padStart(2, "0")} ${String(8 + (id % 12)).padStart(2, "0")}:00:00`]);
      }
      return { posts: shuffle(rng, rows) };
    },
    solution: [
      "WITH RECURSIVE reshare_tree AS (",
      "  SELECT post_id AS root_id, post_id, author_id, 0 AS depth",
      "  FROM posts WHERE reshare_of IS NULL",
      "  UNION ALL",
      "  SELECT c.root_id, p.post_id, p.author_id, c.depth + 1",
      "  FROM reshare_tree c JOIN posts p ON p.reshare_of = c.post_id",
      ")",
      "SELECT root_id AS post_id,",
      "       COUNT(*) AS total_reshares,",
      "       MAX(depth) AS max_depth,",
      "       COUNT(DISTINCT author_id) AS unique_resharers",
      "FROM reshare_tree",
      "WHERE depth > 0",
      "GROUP BY root_id",
      "ORDER BY total_reshares DESC, post_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE up AS (",
        "  SELECT post_id AS node, author_id, reshare_of AS ancestor, 1 AS depth",
        "  FROM posts WHERE reshare_of IS NOT NULL",
        "  UNION ALL",
        "  SELECT u.node, u.author_id, p.reshare_of, u.depth + 1",
        "  FROM up u JOIN posts p ON p.post_id = u.ancestor",
        "  WHERE p.reshare_of IS NOT NULL",
        ")",
        "SELECT r.post_id, COUNT(*) AS total_reshares, MAX(u.depth) AS max_depth, COUNT(DISTINCT u.author_id) AS unique_resharers",
        "FROM up u JOIN posts r ON r.post_id = u.ancestor AND r.reshare_of IS NULL",
        "GROUP BY r.post_id",
        "ORDER BY total_reshares DESC, r.post_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The depth of a cascade is not fixed, so a fixed number of self joins cannot reach every level — use a recursive CTE.",
      "Anchor the recursion at the original posts and carry the root's id and a depth counter down each level.",
      "Drop the anchor rows (depth 0) before aggregating, or every original counts itself as a reshare.",
    ],
    editorial: [
      "Reshares form a forest: each original post is a root and each reshare points at its parent. A cascade can be any number of levels deep, so the query needs **recursion**. The anchor of `WITH RECURSIVE` selects the originals, labelling each with itself as `root_id` and depth 0; the recursive step joins the posts whose `reshare_of` is a row already found, copying the root and adding 1 to the depth. Because every reshare points at an earlier post, there are no cycles and the recursion stops when a level finds no children.",
      "",
      "Each reshare then appears exactly once, tagged with its root and depth. Removing the depth-0 anchors and grouping by root gives the three numbers: `COUNT(*)` reshares, `MAX(depth)`, and `COUNT(DISTINCT author_id)` — someone resharing twice in one cascade counts once. Originals nobody reshared have no rows left after the filter and disappear, as asked.",
      "",
      "The alternative walks **upwards** instead: starting from every reshare, it follows `reshare_of` until it reaches a post that is an original; the row where the ancestor is an original carries the reshare's depth and its root. Both visit each (reshare, ancestor) pair at most once — linear in the total depth of the forest.",
    ].join("\n"),
  },

  {
    slug: "median-likes-per-creator",
    title: "Median Likes per Creator",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "Averages are skewed by one viral post, so the creator dashboard shows the **median** likes instead. For a creator with `n` posts that have a like count, sort those counts: the median is the middle value when `n` is odd and the **average of the two middle values** when `n` is even. Posts with NULL `likes` (counter not yet synced) are ignored; creators with no counted posts do not appear.",
      "",
      "Return the columns `creator_id`, `posts` (the `n` above) and `median_likes` (**rounded to 1 decimal**), in any order.",
    ].join("\n"),
    tables: [
      {
        name: "posts",
        columns: [
          { name: "post_id", type: "int" },
          { name: "creator_id", type: "int" },
          { name: "posted_on", type: "date" },
          { name: "likes", type: "int" },
        ],
        primaryKey: ["post_id"],
        note: "One row per post; `likes` is NULL while the counter syncs.",
      },
    ],
    examples: [
      {
        posts: [
          [1, 1, "2025-04-01", 120],
          [2, 1, "2025-04-03", 45000],
          [3, 1, "2025-04-05", 300],
          [4, 2, "2025-04-02", 80],
          [5, 2, "2025-04-04", 95],
          [6, 2, "2025-04-06", 80],
          [7, 2, "2025-04-08", 210],
          [8, 3, "2025-04-03", null],
          [9, 4, "2025-04-09", 61],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 20);
      const pool = Array.from({ length: ri(rng, 3, 8) }, () => ri(rng, 0, 2000));
      return {
        posts: seq(1, n).map((id) => [id, ri(rng, 1, 4), dateBetween(rng, "2025-04-01", "2025-04-30"), maybeNull(rng, 0.1, pick(rng, pool))]),
      };
    },
    solution: [
      "WITH ranked AS (",
      "  SELECT creator_id, likes,",
      "         ROW_NUMBER() OVER (PARTITION BY creator_id ORDER BY likes, post_id) AS rn,",
      "         COUNT(*) OVER (PARTITION BY creator_id) AS n",
      "  FROM posts",
      "  WHERE likes IS NOT NULL",
      ")",
      "SELECT creator_id, MAX(n) AS posts, ROUND(AVG(likes), 1) AS median_likes",
      "FROM ranked",
      "WHERE rn IN (FLOOR((n + 1) / 2), FLOOR(n / 2) + 1)",
      "GROUP BY creator_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT creator_id, MAX(n) AS posts, ROUND(AVG(likes), 1) AS median_likes",
        "FROM (",
        "  SELECT p.creator_id, p.likes,",
        "         (SELECT COUNT(*) FROM posts q WHERE q.creator_id = p.creator_id AND q.likes IS NOT NULL",
        "            AND (q.likes < p.likes OR (q.likes = p.likes AND q.post_id <= p.post_id))) AS pos,",
        "         (SELECT COUNT(*) FROM posts q WHERE q.creator_id = p.creator_id AND q.likes IS NOT NULL) AS n",
        "  FROM posts p WHERE p.likes IS NOT NULL",
        ") t",
        "WHERE pos * 2 IN (n, n + 1, n + 2)",
        "GROUP BY creator_id",
      ].join("\n"),
    ],
    hints: [
      "Number each creator's counted posts in order of likes, and attach the creator's count `n` to every row.",
      "For odd `n` the middle position is (n+1)/2; for even `n` it is n/2 and n/2+1. `FLOOR((n+1)/2)` and `FLOOR(n/2)+1` cover both cases.",
      "Average the one or two middle rows per creator.",
    ],
    editorial: [
      "MySQL has no MEDIAN aggregate, so build it from positions. `ROW_NUMBER()` over each creator's counted posts, ordered by `likes` (with `post_id` to make equal counts take distinct positions), gives every post its rank, and `COUNT(*) OVER (PARTITION BY creator_id)` puts `n` on every row. Filtering NULL likes **before** the window is essential: otherwise NULLs would take positions and shift the middle.",
      "",
      "The middle positions are `FLOOR((n + 1) / 2)` and `FLOOR(n / 2) + 1`: for odd `n` both are the same middle row, for even `n` they are the two central rows. Averaging the selected rows per creator returns the median in both cases — equal values sharing the middle do not matter, because only the values are averaged.",
      "",
      "The alternative computes each row's position with a correlated count (rows strictly smaller, plus equal ones with a smaller or equal id) and keeps positions where `2·pos` is `n`, `n + 1` or `n + 2` — the same middle rows. It is O(n²) per creator against O(n log n) for the window version.",
    ].join("\n"),
  },

  {
    slug: "app-sessions-from-the-event-stream",
    title: "App Sessions From the Event Stream",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Conditional Logic"],
    description: [
      "The app logs an event for every screen a user opens. Analytics splits each user's events into **sessions**: events are taken in order of `event_time`, then `event_id`, and a **new session starts** at a user's first event and at every event that comes **more than 30 minutes (1800 seconds)** after the user's previous event. A gap of exactly 30 minutes stays in the same session.",
      "",
      "For every user with events, return the columns `user_id`, `sessions`, `longest_session_minutes` (the largest whole-minute span, `TIMESTAMPDIFF(MINUTE, …)`, from a session's first to its last event; a one-event session is 0) and `avg_events_per_session` (**rounded to 1 decimal**), **ordered by `user_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "app_events",
        columns: [
          { name: "event_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "screen", type: "varchar" },
          { name: "event_time", type: "datetime" },
        ],
        primaryKey: ["event_id"],
        note: "One row per screen view. Two events of a user can share a timestamp.",
      },
    ],
    examples: [
      {
        app_events: [
          [1, 1, "feed", "2025-10-01 09:00:00"],
          [2, 1, "reels", "2025-10-01 09:12:00"],
          [3, 1, "profile", "2025-10-01 09:42:00"],
          [4, 1, "feed", "2025-10-01 10:12:01"],
          [5, 1, "dm_inbox", "2025-10-01 10:20:30"],
          [6, 2, "feed", "2025-10-01 21:00:00"],
          [7, 2, "search", "2025-10-01 23:00:00"],
          [8, 2, "reels", "2025-10-01 23:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const nu = chance(rng, 0.05) ? 0 : ri(rng, 1, 3);
      for (let u = 1; u <= nu; u++) {
        let t = Date.parse(`${dateBetween(rng, "2025-10-01", "2025-10-05")}T${String(ri(rng, 6, 20)).padStart(2, "0")}:00:00Z`);
        for (let k = ri(rng, 1, 9); k > 0; k--) {
          rows.push([0, u, pick(rng, ["feed", "reels", "profile", "search", "dm_inbox", "stories"]), ts(t)]);
          t += pick(rng, [0, 60, 600, 1799, 1800, 1801, 3600, 7200, 125]) * 1000;
        }
      }
      rows.forEach((r, i) => (r[0] = i + 1));
      return { app_events: shuffle(rng, rows) };
    },
    solution: [
      "WITH gaps AS (",
      "  SELECT user_id, event_id, event_time,",
      "         CASE WHEN LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time, event_id) IS NULL",
      "                OR TIMESTAMPDIFF(SECOND, LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time, event_id), event_time) > 1800",
      "              THEN 1 ELSE 0 END AS starts_session",
      "  FROM app_events",
      "), numbered AS (",
      "  SELECT user_id, event_time,",
      "         SUM(starts_session) OVER (PARTITION BY user_id ORDER BY event_time, event_id",
      "                                   ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS session_no",
      "  FROM gaps",
      "), sessions AS (",
      "  SELECT user_id, session_no, MIN(event_time) AS started, MAX(event_time) AS ended, COUNT(*) AS events",
      "  FROM numbered GROUP BY user_id, session_no",
      ")",
      "SELECT user_id,",
      "       COUNT(*) AS sessions,",
      "       MAX(TIMESTAMPDIFF(MINUTE, started, ended)) AS longest_session_minutes,",
      "       ROUND(AVG(events), 1) AS avg_events_per_session",
      "FROM sessions",
      "GROUP BY user_id",
      "ORDER BY user_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH starts AS (",
        "  SELECT a.user_id, a.event_time FROM app_events a",
        "  WHERE NOT EXISTS (",
        "    SELECT 1 FROM app_events b",
        "    WHERE b.user_id = a.user_id",
        "      AND (b.event_time < a.event_time OR (b.event_time = a.event_time AND b.event_id < a.event_id))",
        "      AND TIMESTAMPDIFF(SECOND, b.event_time, a.event_time) <= 1800)",
        "), tagged AS (",
        "  SELECT e.user_id, e.event_time,",
        "         (SELECT MAX(s.event_time) FROM starts s WHERE s.user_id = e.user_id AND s.event_time <= e.event_time) AS started",
        "  FROM app_events e",
        "), sessions AS (",
        "  SELECT user_id, started, MAX(event_time) AS ended, COUNT(*) AS events FROM tagged GROUP BY user_id, started",
        ")",
        "SELECT user_id, COUNT(*) AS sessions, MAX(TIMESTAMPDIFF(MINUTE, started, ended)) AS longest_session_minutes,",
        "       ROUND(AVG(events), 1) AS avg_events_per_session",
        "FROM sessions GROUP BY user_id ORDER BY user_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Mark each event with 1 if it starts a session (no previous event, or a gap over 1800 seconds) and 0 otherwise — `LAG` gives the previous event.",
      "A running SUM of those marks, in event order, numbers the sessions.",
      "Group by (user, session number) for each session's first/last time and event count, then aggregate the sessions per user.",
      "Order the windows by `event_time, event_id` and use a ROWS frame, so equal timestamps cannot be counted as peers.",
    ],
    editorial: [
      "**Sessionisation** is gaps and islands on time. First, compare every event with the user's previous one: `LAG(event_time)` over a window partitioned by user and ordered by `event_time, event_id`. An event starts a session when there is no previous event or `TIMESTAMPDIFF(SECOND, prev, cur) > 1800` — strictly more, so a gap of exactly 30 minutes continues the session.",
      "",
      "Second, a **running SUM** of the start flags, with an explicit `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` frame, gives every event its session number; the default RANGE frame would treat events with the same timestamp as peers and could hand them a later number. Grouping by `(user_id, session_no)` gives each session's first and last time and its event count, and a final GROUP BY user counts sessions, takes the longest span in whole minutes and averages events per session.",
      "",
      "The alternative identifies session starts directly — an event with no earlier event of the same user within 1800 seconds (since the immediate predecessor is the latest earlier event, this is the same test) — then tags every event with the latest start at or before it via a correlated MAX. It is correct but quadratic per user; the window version is one sort.",
    ].join("\n"),
  },
];
