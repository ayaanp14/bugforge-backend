import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { FIRST_NAMES, LAST_NAMES, addDays, chance, dateBetween, names, pick, ri, roundTo, sample, shuffle } from "./kit.js";

/**
 * Company set — Dream11: the questions a data analyst or engineer at a
 * fantasy-sports app is handed — contest fill rates and the moment a contest
 * filled, saved teams over the 100-credit cap, selection and captaincy
 * percentages, players left out of the announced XI, captain 2x / vice-captain
 * 1.5x team scores, tied leaderboard ranks splitting a prize slab, TDS on
 * winnings, KYC and withdrawal audits, responsible-play deposit limits, promo
 * campaigns, private leagues and activation cohorts. The schemas and figures
 * are invented for practice — none of this is Dream11's real data or tables.
 * Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (d: Date): string =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
/** A 'YYYY-MM-DD HH:MM:SS' plus `s` seconds. */
const plusSeconds = (dt: string, s: number): string => fmt(new Date(Date.parse(`${dt.replace(" ", "T")}Z`) + s * 1000));
/** A 'YYYY-MM-DD HH:MM:00' between two dates. */
const stamp = (rng: () => number, from: string, to: string): string => `${dateBetween(rng, from, to)} ${pad(ri(rng, 0, 23))}:${pad(ri(rng, 0, 59))}:00`;
/** `n` distinct "First Last" player names. */
const playerNames = (rng: () => number, n: number): string[] =>
  sample(rng, FIRST_NAMES.flatMap((f) => LAST_NAMES.map((l) => `${f} ${l}`)), n);
/** `n` distinct app usernames. */
const usernames = (rng: () => number, n: number): string[] => names(rng, n).map((x, i) => `${x.toLowerCase()}_${pad(ri(rng, 1, 9) * 10 + i)}`);
/** Fantasy points: a multiple of 0.5 between lo and hi. */
const fp = (rng: () => number, lo: number, hi: number): number => ri(rng, lo * 2, hi * 2) / 2;

const SPORTS = ["cricket", "football", "kabaddi"] as const;
const CONTEST_TYPES = ["mega", "small_league", "head_to_head", "private"] as const;
const FIXTURES = ["MUM vs CHE", "BLR vs KOL", "DEL vs HYD", "PUN vs RAJ", "GUJ vs LKO", "IND vs AUS", "Patna vs Jaipur", "Goa vs Kerala"] as const;

const EASY: SqlProblemSpec[] = [
  {
    slug: "dream11-paid-contests-under-half-full",
    title: "Dream11: Paid Public Contests Still Under Half Full",
    difficulty: "EASY",
    topics: ["Basics"],
    description: [
      "An hour before the round locks, the contest-operations team at Dream11 looks for paid public contests that are filling slowly, so it can feature them in a push notification.",
      "",
      "Return every contest that is **not private**, has an `entry_fee` **above 0**, and has **less than half** of its spots filled (`spots_filled` strictly below half of `total_spots` — a contest exactly half full is not slow). Return `contest_id`, `entry_fee` and `spots_left` (`total_spots - spots_filled`), in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Contest",
        columns: [
          { name: "contest_id", type: "int" },
          { name: "match_id", type: "int" },
          { name: "contest_type", type: "enum", values: [...CONTEST_TYPES] },
          { name: "entry_fee", type: "int" },
          { name: "total_spots", type: "int" },
          { name: "spots_filled", type: "int" },
        ],
        primaryKey: ["contest_id"],
        note: "One row per contest on a match. `entry_fee` is in rupees; 0 means a free contest. `spots_filled` never exceeds `total_spots`.",
      },
    ],
    examples: [
      {
        Contest: [
          [1, 101, "mega", 49, 10000, 3120],
          [2, 101, "head_to_head", 99, 2, 1],
          [3, 101, "private", 25, 10, 2],
          [4, 102, "small_league", 0, 20, 4],
          [5, 102, "small_league", 25, 20, 9],
          [6, 102, "mega", 99, 1000, 500],
          [7, 103, "mega", 499, 100, 98],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 4, 18);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const total = pick(rng, [2, 10, 20, 50, 100, 1000, 10000]);
        const r = rng();
        const filled = r < 0.2 ? total / 2 : r < 0.3 ? total / 2 - 1 : r < 0.4 ? total / 2 + 1 : ri(rng, 0, total);
        return [id, ri(rng, 101, 104), pick(rng, CONTEST_TYPES), pick(rng, [0, 25, 49, 49, 99, 499]), total, filled];
      });
      return { Contest: rows };
    },
    solution: [
      "SELECT contest_id, entry_fee, total_spots - spots_filled AS spots_left",
      "FROM Contest",
      "WHERE contest_type <> 'private'",
      "  AND entry_fee > 0",
      "  AND spots_filled * 2 < total_spots",
    ].join("\n"),
    alternatives: [
      "SELECT contest_id, entry_fee, total_spots - spots_filled AS spots_left FROM Contest WHERE contest_type IN ('mega', 'small_league', 'head_to_head') AND entry_fee >= 1 AND spots_filled < total_spots / 2",
    ],
    hints: [
      "All three conditions must hold together, so join them with AND.",
      "\"Less than half\" is strict: a 2-spot head-to-head with 1 team in it is exactly half full and stays out.",
      "Comparing `spots_filled * 2` with `total_spots` avoids any fractions.",
    ],
    editorial: [
      "This is a single-table filter. A contest qualifies when three independent facts are all true, so the `WHERE` clause joins them with `AND`: the contest is public (`contest_type <> 'private'` — private leagues are only visible to invited friends, so a push notification cannot sell them), it is paid (`entry_fee > 0`), and it is filling slowly.",
      "",
      "The slow-fill test is the one to get exactly right. \"Less than half\" is strict, so a contest at exactly 50% is out. Writing it as `spots_filled * 2 < total_spots` keeps the arithmetic in integers and makes the boundary obvious; `spots_filled < total_spots / 2` is the same test with decimal division, which is how the alternative writes it. The extra column is just the difference of two columns of the same row.",
      "",
      "The query reads the table once; an index on `(contest_type, entry_fee)` would help only if most contests were free or private.",
    ].join("\n"),
  },

  {
    slug: "dream11-depositors-who-never-joined-a-contest",
    title: "Dream11: Depositors Who Never Joined a Contest",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "Dream11's growth team wants to nudge people who added money to their wallet but have not yet played: they get a reminder that a contest is waiting.",
      "",
      "Return every user with **at least one successful deposit** and **no contest entry at all** (free or paid). A failed or pending deposit does not count as having deposited. Return `user_id` and `username`, one row per user, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "AppUser",
        columns: [
          { name: "user_id", type: "int" },
          { name: "username", type: "varchar" },
          { name: "signup_date", type: "date" },
        ],
        primaryKey: ["user_id"],
        note: "One row per registered account.",
      },
      {
        name: "Deposit",
        columns: [
          { name: "deposit_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["success", "failed", "pending"] },
        ],
        primaryKey: ["deposit_id"],
        note: "Every attempt to add cash to the wallet, whatever its outcome.",
      },
      {
        name: "ContestEntry",
        columns: [
          { name: "entry_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "contest_id", type: "int" },
        ],
        primaryKey: ["entry_id"],
        note: "One row per team a user entered into a contest.",
      },
    ],
    examples: [
      {
        AppUser: [
          [1, "aarav_21", "2025-03-02"],
          [2, "diya_07", "2025-03-04"],
          [3, "kabir_88", "2025-03-05"],
          [4, "meera_14", "2025-03-09"],
          [5, "rohan_33", "2025-03-11"],
          [6, "zara_50", "2025-03-12"],
        ],
        Deposit: [
          [11, 1, 500, "success"],
          [12, 2, 100, "success"],
          [13, 2, 200, "success"],
          [14, 3, 1000, "failed"],
          [15, 5, 300, "pending"],
          [16, 5, 300, "success"],
        ],
        ContestEntry: [
          [21, 1, 900],
          [22, 4, 901],
          [23, 1, 902],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const who = usernames(rng, n);
      const users: Cell[][] = seq(1, n).map((id, i) => [id, who[i]!, dateBetween(rng, "2025-03-01", "2025-04-30")]);
      const deposits: Cell[][] = [];
      const entries: Cell[][] = [];
      for (const id of seq(1, n)) {
        for (let k = ri(rng, 0, 3); k > 0; k--) deposits.push([100 + deposits.length, id, roundTo(rng, 50, 2000, 50), pick(rng, ["success", "success", "failed", "pending"])]);
        if (chance(rng, 0.45)) for (let k = ri(rng, 1, 3); k > 0; k--) entries.push([500 + entries.length, id, ri(rng, 900, 910)]);
      }
      return { AppUser: users, Deposit: deposits, ContestEntry: entries };
    },
    solution: [
      "SELECT u.user_id, u.username",
      "FROM AppUser u",
      "WHERE EXISTS (SELECT 1 FROM Deposit d WHERE d.user_id = u.user_id AND d.status = 'success')",
      "  AND NOT EXISTS (SELECT 1 FROM ContestEntry e WHERE e.user_id = u.user_id)",
    ].join("\n"),
    alternatives: [
      [
        "SELECT DISTINCT u.user_id, u.username",
        "FROM AppUser u",
        "JOIN Deposit d ON d.user_id = u.user_id AND d.status = 'success'",
        "LEFT JOIN ContestEntry e ON e.user_id = u.user_id",
        "WHERE e.entry_id IS NULL",
      ].join("\n"),
      "SELECT user_id, username FROM AppUser WHERE user_id IN (SELECT user_id FROM Deposit WHERE status = 'success') AND user_id NOT IN (SELECT user_id FROM ContestEntry)",
    ],
    hints: [
      "Two separate questions about each user: did a successful deposit happen, and did any entry happen?",
      "`EXISTS` answers the first; `NOT EXISTS` (an anti join) answers the second.",
      "A user with two successful deposits must still appear once — joining to `Deposit` directly would repeat them unless you use DISTINCT.",
    ],
    editorial: [
      "Each user is tested against two other tables, and neither test needs a value from them — only whether a matching row exists. That is exactly what `EXISTS` and `NOT EXISTS` express: keep the user if some successful deposit belongs to them, and if no contest entry belongs to them.",
      "",
      "The status filter sits inside the deposit subquery, so a user whose only deposits failed or are still pending is not a depositor. Because `EXISTS` stops at the first match, a user with several deposits is still one row.",
      "",
      "The first alternative joins to the successful deposits and then left-joins the entries, keeping the rows where no entry matched (`e.entry_id IS NULL`); the inner join repeats a user once per deposit, which `DISTINCT` folds back. The second uses `IN` and `NOT IN`, safe here because `ContestEntry.user_id` is never NULL — with a nullable column `NOT IN` would return nothing at all. With indexes on `user_id` in both child tables every version is a pair of index probes per user.",
    ].join("\n"),
  },

  {
    slug: "dream11-winnings-tds-and-net-payout",
    title: "Dream11: Gross Winnings, Tax Withheld and Net Payout per User",
    difficulty: "EASY",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "The payments team at Dream11 prepares a statement of every winner's payout for the week. For this exercise use a simplified rule: tax is withheld at **30%** of any single winning of **more than 10,000** rupees, and a winning of 10,000 or less is paid in full.",
      "",
      "For each user in `Winning`, return `user_id`, `gross_winnings` (the sum of their winnings), `tds_deducted` (the total tax withheld under the rule, applied winning by winning) and `net_payout` (gross minus tax). Order the rows by `net_payout` **descending**, then by `user_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Winning",
        columns: [
          { name: "winning_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "contest_id", type: "int" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["winning_id"],
        note: "One row per prize a user won in a contest, in rupees. Amounts are multiples of 10, so 30% is always a whole number of rupees.",
      },
    ],
    examples: [
      {
        Winning: [
          [1, 11, 701, 10000],
          [2, 11, 702, 15000],
          [3, 12, 701, 25000],
          [4, 13, 703, 500],
          [5, 13, 704, 10010],
          [6, 14, 705, 9000],
          [7, 12, 706, 2000],
          [8, 15, 707, 9000],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 16);
      const users = sample(rng, seq(11, 8), ri(rng, 1, 6));
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        pick(rng, users),
        ri(rng, 700, 720),
        chance(rng, 0.3) ? pick(rng, [10000, 10010, 9990, 9000]) : roundTo(rng, 50, 40000, 10),
      ]);
      return { Winning: rows };
    },
    solution: [
      "SELECT user_id,",
      "       SUM(amount) AS gross_winnings,",
      "       SUM(CASE WHEN amount > 10000 THEN amount * 30 / 100 ELSE 0 END) AS tds_deducted,",
      "       SUM(amount) - SUM(CASE WHEN amount > 10000 THEN amount * 30 / 100 ELSE 0 END) AS net_payout",
      "FROM Winning",
      "GROUP BY user_id",
      "ORDER BY net_payout DESC, user_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT user_id, SUM(amount) AS gross_winnings,",
        "       SUM(IF(amount > 10000, amount * 3 DIV 10, 0)) AS tds_deducted,",
        "       SUM(IF(amount > 10000, amount * 7 DIV 10, amount)) AS net_payout",
        "FROM Winning GROUP BY user_id ORDER BY net_payout DESC, user_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The tax rule looks at one winning at a time, so decide each row's tax before adding anything up.",
      "A `CASE` (or `IF`) inside `SUM` gives each row's tax; rows at or below 10,000 contribute 0.",
      "Exactly 10,000 is not \"more than 10,000\".",
    ],
    editorial: [
      "The tax rule applies per winning, not per user: a user with two prizes of 6,000 owes nothing even though their total is 12,000. So the tax has to be worked out row by row and then summed — which is what **conditional aggregation** does. `SUM(CASE WHEN amount > 10000 THEN amount * 30 / 100 ELSE 0 END)` adds 30% of each large prize and 0 for every other one.",
      "",
      "Gross winnings are a plain `SUM(amount)`, and the net payout is gross minus tax. The comparison is strict, so a prize of exactly 10,000 is paid in full. Every amount is a multiple of 10, so the tax is a whole number and no rounding question arises.",
      "",
      "The alternative computes the net directly, row by row, as 70% of a large prize or the whole of a small one, using integer `DIV` — the two forms agree because the arithmetic is exact. The order is by net payout descending with `user_id` breaking ties, so equal payouts still come out in a fixed order. One pass over the table, one group per user.",
    ].join("\n"),
  },

  {
    slug: "dream11-saved-teams-over-the-credit-cap",
    title: "Dream11: Saved Teams Over the 100-Credit Cap",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "Every fantasy team on Dream11 must fit inside **100 credits**. After a bad app release, the integrity team suspects some saved teams slipped past the check and wants the list.",
      "",
      "Return every team whose players' credits add up to **more than 100** (a team at exactly 100 is legal). Return `team_id` and `credits_used`, ordered by `credits_used` **descending**, then by `team_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Player",
        columns: [
          { name: "player_id", type: "int" },
          { name: "player_name", type: "varchar" },
          { name: "credits", type: "decimal" },
        ],
        primaryKey: ["player_id"],
        note: "The credit price of each player for the match, in steps of 0.5.",
      },
      {
        name: "TeamPick",
        columns: [
          { name: "team_id", type: "int" },
          { name: "player_id", type: "int" },
        ],
        primaryKey: ["team_id", "player_id"],
        note: "One row per player in a saved team; every team has 11 players.",
      },
    ],
    examples: (() => {
      const credits = [9.5, 9, 10.5, 8.5, 9, 8, 10, 9.5, 8.5, 9, 8, 10.5, 9, 8.5];
      const who = ["Arjun Rao", "Kabir Khan", "Rohan Iyer", "Dev Nair", "Harsh Patel", "Ishaan Das", "Karan Mehta", "Nikhil Joshi", "Vikram Bose", "Rahul Verma", "Farhan Singh", "Vivaan Reddy", "Aarav Gupta", "Liam Menon"];
      const teams: [number, number[]][] = [
        [1, seq(1, 11)],
        [2, [...seq(1, 10), 12]],
        [3, [...seq(1, 10), 14]],
        [4, seq(2, 11)],
      ];
      return [
        {
          Player: credits.map((c, i) => [i + 1, who[i]!, c]),
          TeamPick: teams.flatMap(([t, ps]) => ps.map((p) => [t, p] as Cell[])),
        },
      ];
    })(),
    gen: (rng) => {
      const np = ri(rng, 12, 15);
      const who = playerNames(rng, np);
      const players: Cell[][] = seq(1, np).map((id, i) => [id, who[i]!, pick(rng, [8, 8.5, 9, 9, 9.5, 10, 10.5])]);
      const picks: Cell[][] = [];
      const nt = chance(rng, 0.05) ? 0 : ri(rng, 1, 5);
      for (const t of seq(1, nt)) for (const p of sample(rng, seq(1, np), 11)) picks.push([t, p]);
      return { Player: players, TeamPick: picks };
    },
    solution: [
      "SELECT t.team_id, SUM(p.credits) AS credits_used",
      "FROM TeamPick t",
      "JOIN Player p ON p.player_id = t.player_id",
      "GROUP BY t.team_id",
      "HAVING SUM(p.credits) > 100",
      "ORDER BY credits_used DESC, t.team_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT team_id, credits_used",
        "FROM (SELECT t.team_id, SUM(p.credits) AS credits_used FROM TeamPick t JOIN Player p ON p.player_id = t.player_id GROUP BY t.team_id) x",
        "WHERE credits_used > 100",
        "ORDER BY credits_used DESC, team_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "A team's spend comes from the `Player` table, so join each pick to its player first.",
      "Group by team and add the credits.",
      "A condition on a group's total goes in `HAVING`, not `WHERE`.",
    ],
    editorial: [
      "Each pick row only names a player, and the price lives in `Player`, so the first step is a join on `player_id`. After the join every row is one player in one team with that player's credits, and grouping by `team_id` turns the eleven rows of a team into one total.",
      "",
      "The cap is on that total, which does not exist until the groups are formed, so the filter belongs in `HAVING SUM(p.credits) > 100`. A team at exactly 100 credits is within the rules and the strict comparison keeps it out of the list. Credits move in steps of 0.5, which are exact in both MySQL decimals and binary floating point, so the sum has no rounding error to worry about.",
      "",
      "The alternative computes every team's total in a derived table and filters it with an ordinary `WHERE` outside — the same plan written in two steps. The ordering puts the worst offenders first and breaks equal totals by `team_id` so the list is stable.",
    ].join("\n"),
  },

  {
    slug: "dream11-promo-redemptions-per-campaign",
    title: "Dream11: Promo Code Redemptions per Campaign",
    difficulty: "EASY",
    topics: ["Strings", "Aggregation"],
    description: [
      "Dream11's marketing team issues bonus-cash promo codes in campaigns. Every code starts with the campaign name and a hyphen, followed by a unique suffix (`IPLFINAL-X4M8`); a suffix may itself contain hyphens (`IPLFINAL-2-PL9Z`), so the campaign is the part **before the first hyphen**.",
      "",
      "For each campaign, return `campaign`, `redemptions` (rows), `unique_users` (distinct users who redeemed) and `total_bonus` (sum of `bonus_amount`). Order by `total_bonus` **descending**, then by `campaign` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "PromoRedemption",
        columns: [
          { name: "redemption_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "promo_code", type: "varchar" },
          { name: "bonus_amount", type: "int" },
          { name: "redeemed_on", type: "date" },
        ],
        primaryKey: ["redemption_id"],
        note: "One row per code applied to a wallet. Codes are upper case and always contain at least one hyphen.",
      },
    ],
    examples: [
      {
        PromoRedemption: [
          [1, 21, "WELCOME-A7K2", 50, "2025-04-01"],
          [2, 22, "WELCOME-B9Q1", 50, "2025-04-01"],
          [3, 21, "IPLFINAL-X4M8", 100, "2025-05-25"],
          [4, 23, "IPLFINAL-2-PL9Z", 100, "2025-05-25"],
          [5, 23, "IPLFINAL-Z1Q5", 100, "2025-05-26"],
          [6, 24, "KABADDI50-K8J3", 50, "2025-06-02"],
          [7, 24, "KABADDI50-M2D7", 50, "2025-06-03"],
        ],
      },
    ],
    gen: (rng) => {
      const campaigns = sample(rng, ["WELCOME", "IPLFINAL", "KABADDI50", "FOOTY25", "DIWALI", "SUPEROVER"], ri(rng, 1, 4));
      const suffix = () => `${String.fromCharCode(65 + ri(rng, 0, 25))}${ri(rng, 0, 9)}${String.fromCharCode(65 + ri(rng, 0, 25))}${ri(rng, 0, 9)}`;
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 18);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 21, 27),
        `${pick(rng, campaigns)}-${chance(rng, 0.25) ? `${ri(rng, 2, 9)}-` : ""}${suffix()}`,
        pick(rng, [25, 50, 50, 100]),
        dateBetween(rng, "2025-04-01", "2025-06-30"),
      ]);
      return { PromoRedemption: rows };
    },
    solution: [
      "SELECT SUBSTRING_INDEX(promo_code, '-', 1) AS campaign,",
      "       COUNT(*) AS redemptions,",
      "       COUNT(DISTINCT user_id) AS unique_users,",
      "       SUM(bonus_amount) AS total_bonus",
      "FROM PromoRedemption",
      "GROUP BY campaign",
      "ORDER BY total_bonus DESC, campaign",
    ].join("\n"),
    alternatives: [
      [
        "SELECT campaign, COUNT(*) AS redemptions, COUNT(DISTINCT user_id) AS unique_users, SUM(bonus_amount) AS total_bonus",
        "FROM (SELECT LEFT(promo_code, LOCATE('-', promo_code) - 1) AS campaign, user_id, bonus_amount FROM PromoRedemption) x",
        "GROUP BY campaign",
        "ORDER BY total_bonus DESC, campaign",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The campaign is not a column — cut it out of `promo_code`.",
      "`SUBSTRING_INDEX(s, '-', 1)` returns everything before the first hyphen; `LEFT` with `LOCATE` does the same.",
      "Count users with `COUNT(DISTINCT …)`: one user may redeem two codes of the same campaign.",
    ],
    editorial: [
      "The grouping key is hidden inside a string, so the first job is to extract it. `SUBSTRING_INDEX(promo_code, '-', 1)` returns the text before the first occurrence of the delimiter — exactly the campaign, even when the suffix contains more hyphens. Taking the part before the *last* hyphen, or a fixed number of characters, would break on `IPLFINAL-2-PL9Z` or on campaigns of different lengths.",
      "",
      "Once each row has its campaign, the rest is ordinary aggregation: `COUNT(*)` counts redemptions, `COUNT(DISTINCT user_id)` counts people (a user who redeemed two codes of a campaign counts once), and `SUM(bonus_amount)` is the cost of the campaign. Grouping by the alias works in MySQL; the alternative computes the campaign in a derived table with `LEFT(promo_code, LOCATE('-', promo_code) - 1)` and groups outside, which is the portable way to write it.",
      "",
      "The order puts the most expensive campaigns first and breaks ties by name. One scan of the table.",
    ].join("\n"),
  },

  {
    slug: "dream11-withdrawals-that-missed-24-hours",
    title: "Dream11: Withdrawals That Missed the 24-Hour Payout Promise",
    difficulty: "EASY",
    topics: ["Dates"],
    description: [
      "Dream11's payments operations team promises a winner's withdrawal within 24 hours and reviews every payout that took longer.",
      "",
      "Return every **processed** withdrawal whose `processed_at` is **more than 24 hours** after its `requested_at` (exactly 24 hours is on time). Return `withdrawal_id`, `user_id` and `hours_taken`, the whole hours between the two timestamps rounded down. Pending and rejected withdrawals are not part of the review. Order by `hours_taken` **descending**, then by `withdrawal_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Withdrawal",
        columns: [
          { name: "withdrawal_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "requested_at", type: "datetime" },
          { name: "processed_at", type: "datetime" },
          { name: "status", type: "enum", values: ["processed", "pending", "rejected"] },
        ],
        primaryKey: ["withdrawal_id"],
        note: "`processed_at` is set when the money left (status `processed`) or the request was turned down (`rejected`); it is NULL while `pending`.",
      },
    ],
    examples: [
      {
        Withdrawal: [
          [1, 31, 1500, "2025-05-01 10:00:00", "2025-05-01 18:30:00", "processed"],
          [2, 32, 20000, "2025-05-01 11:15:00", "2025-05-02 11:15:00", "processed"],
          [3, 33, 750, "2025-05-01 12:00:00", "2025-05-02 12:00:30", "processed"],
          [4, 31, 5000, "2025-05-02 09:00:00", "2025-05-05 14:45:00", "processed"],
          [5, 34, 300, "2025-05-02 22:10:00", null, "pending"],
          [6, 35, 9000, "2025-05-03 08:00:00", "2025-05-06 08:00:00", "rejected"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 16);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const req = `${dateBetween(rng, "2025-05-01", "2025-05-20")} ${pad(ri(rng, 0, 23))}:${pad(ri(rng, 0, 59))}:${pad(ri(rng, 0, 59))}`;
        const status = pick(rng, ["processed", "processed", "processed", "pending", "rejected"]);
        const delay = chance(rng, 0.35) ? pick(rng, [86400, 86401, 86399, 90000]) : ri(rng, 600, 300000);
        return [id, ri(rng, 31, 40), roundTo(rng, 100, 25000, 50), req, status === "pending" ? null : plusSeconds(req, delay), status];
      });
      return { Withdrawal: rows };
    },
    solution: [
      "SELECT withdrawal_id, user_id, TIMESTAMPDIFF(HOUR, requested_at, processed_at) AS hours_taken",
      "FROM Withdrawal",
      "WHERE status = 'processed'",
      "  AND TIMESTAMPDIFF(SECOND, requested_at, processed_at) > 86400",
      "ORDER BY hours_taken DESC, withdrawal_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT withdrawal_id, user_id, TIMESTAMPDIFF(MINUTE, requested_at, processed_at) DIV 60 AS hours_taken",
        "FROM Withdrawal",
        "WHERE status = 'processed' AND processed_at > DATE_ADD(requested_at, INTERVAL 24 HOUR)",
        "ORDER BY hours_taken DESC, withdrawal_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`TIMESTAMPDIFF(unit, earlier, later)` measures the gap in whole units, rounded down.",
      "Comparing whole hours would treat 24 h 0 min 30 s as 24 — measure the boundary in seconds, or compare with `DATE_ADD(requested_at, INTERVAL 24 HOUR)`.",
      "Only `processed` rows are payouts; a rejected request also has a `processed_at`.",
    ],
    editorial: [
      "The question has two parts: which withdrawals breached the promise, and how late each one was. Both are differences between two timestamps on the same row.",
      "",
      "The breach test must be precise at the boundary. `TIMESTAMPDIFF(HOUR, …) > 24` would let a payout of 24 hours and 59 minutes through, because whole hours round down to 24. Measuring in seconds — `TIMESTAMPDIFF(SECOND, requested_at, processed_at) > 86400` — or comparing `processed_at` with `DATE_ADD(requested_at, INTERVAL 24 HOUR)` gets it exactly: exactly 24 hours is on time, one second more is late. The reported `hours_taken` is the rounded-down hour count, so a payout 24 hours and 30 seconds late shows 24.",
      "",
      "The status filter matters because rejected requests also carry a `processed_at`; pending rows have NULL there, and any comparison with NULL is false anyway. The alternative derives hours as minutes `DIV 60`, which is the same rounding. One scan of the table.",
    ].join("\n"),
  },

  {
    slug: "dream11-may-prize-pools-by-sport",
    title: "Dream11: Contests and Prize Pools per Sport in May 2025",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation", "Dates"],
    description: [
      "For a monthly business review, Dream11's strategy team wants to see how much prize money was put up in each sport.",
      "",
      "Consider the contests on matches whose `start_time` falls in **May 2025** (from 2025-05-01 00:00:00 up to, but not including, 2025-06-01 00:00:00). For each sport with at least one such contest, return `sport`, `contests` (how many) and `total_prize_pool`. Order by `total_prize_pool` **descending**, then by `sport`.",
    ].join("\n"),
    tables: [
      {
        name: "FixtureMatch",
        columns: [
          { name: "match_id", type: "int" },
          { name: "sport", type: "enum", values: [...SPORTS] },
          { name: "fixture", type: "varchar" },
          { name: "start_time", type: "datetime" },
        ],
        primaryKey: ["match_id"],
        note: "One row per real-world match the app lists.",
      },
      {
        name: "Contest",
        columns: [
          { name: "contest_id", type: "int" },
          { name: "match_id", type: "int" },
          { name: "prize_pool", type: "int" },
        ],
        primaryKey: ["contest_id"],
        note: "One row per contest on a match; `prize_pool` is the advertised total prize in rupees.",
      },
    ],
    examples: [
      {
        FixtureMatch: [
          [1, "cricket", "MUM vs CHE", "2025-04-30 19:30:00"],
          [2, "cricket", "BLR vs KOL", "2025-05-03 19:30:00"],
          [3, "football", "Goa vs Kerala", "2025-05-31 23:30:00"],
          [4, "kabaddi", "Patna vs Jaipur", "2025-06-01 00:00:00"],
          [5, "kabaddi", "Patna vs Jaipur", "2025-05-12 20:00:00"],
        ],
        Contest: [
          [10, 1, 500000],
          [11, 2, 1000000],
          [12, 2, 25000],
          [13, 3, 200000],
          [14, 4, 50000],
          [15, 5, 150000],
          [16, 5, 50000],
        ],
      },
    ],
    gen: (rng) => {
      const nm = ri(rng, 1, 7);
      const matches: Cell[][] = seq(1, nm).map((id) => [
        id,
        pick(rng, SPORTS),
        pick(rng, FIXTURES),
        chance(rng, 0.25) ? pick(rng, ["2025-05-01 00:00:00", "2025-05-31 23:59:00", "2025-06-01 00:00:00", "2025-04-30 23:30:00"]) : stamp(rng, "2025-04-20", "2025-06-10"),
      ]);
      const nc = chance(rng, 0.05) ? 0 : ri(rng, 1, 14);
      const contests: Cell[][] = seq(10, nc).map((id) => [id, ri(rng, 1, nm), pick(rng, [25000, 50000, 100000, 200000, 1000000])]);
      return { FixtureMatch: matches, Contest: contests };
    },
    solution: [
      "SELECT m.sport, COUNT(*) AS contests, SUM(c.prize_pool) AS total_prize_pool",
      "FROM Contest c",
      "JOIN FixtureMatch m ON m.match_id = c.match_id",
      "WHERE m.start_time >= '2025-05-01 00:00:00' AND m.start_time < '2025-06-01 00:00:00'",
      "GROUP BY m.sport",
      "ORDER BY total_prize_pool DESC, m.sport",
    ].join("\n"),
    alternatives: [
      [
        "SELECT m.sport, COUNT(c.contest_id) AS contests, SUM(c.prize_pool) AS total_prize_pool",
        "FROM FixtureMatch m JOIN Contest c ON c.match_id = m.match_id",
        "WHERE YEAR(m.start_time) = 2025 AND MONTH(m.start_time) = 5",
        "GROUP BY m.sport ORDER BY total_prize_pool DESC, m.sport",
      ].join("\n"),
      [
        "SELECT sport, COUNT(*) AS contests, SUM(prize_pool) AS total_prize_pool",
        "FROM (SELECT m.sport, c.prize_pool FROM Contest c JOIN FixtureMatch m ON m.match_id = c.match_id",
        "      WHERE DATE_FORMAT(m.start_time, '%Y-%m') = '2025-05') x",
        "GROUP BY sport ORDER BY total_prize_pool DESC, sport",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The month belongs to the match, the prize pool to the contest — join them.",
      "A half-open range (`>=` the first of May, `<` the first of June) includes a match late on 31 May and excludes one at midnight on 1 June.",
      "Group by sport after filtering.",
    ],
    editorial: [
      "The date that decides the month is on the match, while the money is on the contest, so the query joins `Contest` to `FixtureMatch`, keeps the rows whose match starts in May 2025, and groups by sport.",
      "",
      "The month filter is written as a **half-open range**: `start_time >= '2025-05-01 00:00:00' AND start_time < '2025-06-01 00:00:00'`. That keeps a match at 23:30 on 31 May and drops one at exactly midnight on 1 June, without having to know how many days May has or what the last second of the day is. Because the timestamps are stored in a fixed format, comparing them as text is the same as comparing them as times, and the range lets an index on `start_time` do the work.",
      "",
      "The alternatives test `YEAR()` and `MONTH()`, or format the timestamp to `'%Y-%m'` — equally correct, but a function on the column cannot use an index. A sport with no May contests has no rows after the join, so it does not appear. Ties in the total are ordered by sport name.",
    ].join("\n"),
  },

  {
    slug: "dream11-deposits-above-own-monthly-limit",
    title: "Dream11: Deposits Above a User's Own Monthly Limit",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation", "Dates"],
    description: [
      "Dream11 lets users set a responsible-play limit on how much they can deposit in a calendar month. After a payment-gateway incident, the responsible-play team wants to find users whose successful deposits in **September 2025** went past the limit they had set.",
      "",
      "Return `username`, `deposit_limit` and `deposited` (the total of the user's **successful** deposits in September 2025) for every user whose `deposited` is **greater than** their limit. Users with no limit (NULL) are never in the list. Order by how far over the limit they went (`deposited - deposit_limit`) **descending**, then by `username`.",
    ].join("\n"),
    tables: [
      {
        name: "AppUser",
        columns: [
          { name: "user_id", type: "int" },
          { name: "username", type: "varchar" },
          { name: "deposit_limit", type: "int" },
        ],
        primaryKey: ["user_id"],
        note: "`deposit_limit` is the monthly cap in rupees the user chose, or NULL if they never set one. Usernames are unique.",
      },
      {
        name: "Deposit",
        columns: [
          { name: "deposit_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["success", "failed"] },
          { name: "deposited_at", type: "datetime" },
        ],
        primaryKey: ["deposit_id"],
        note: "Every attempt to add cash to the wallet.",
      },
    ],
    examples: [
      {
        AppUser: [
          [1, "aarav_21", 5000],
          [2, "diya_07", 2000],
          [3, "kabir_88", null],
          [4, "meera_14", 1000],
          [5, "rohan_33", 3000],
        ],
        Deposit: [
          [11, 1, 3000, "success", "2025-09-02 10:00:00"],
          [12, 1, 2500, "success", "2025-09-20 21:00:00"],
          [13, 2, 1500, "success", "2025-09-05 12:00:00"],
          [14, 2, 1000, "failed", "2025-09-06 12:00:00"],
          [15, 3, 90000, "success", "2025-09-07 09:00:00"],
          [16, 4, 1000, "success", "2025-09-30 23:50:00"],
          [17, 4, 800, "success", "2025-10-01 00:05:00"],
          [18, 5, 2000, "success", "2025-09-11 18:00:00"],
          [19, 5, 1500, "success", "2025-09-12 18:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 2, 8);
      const who = usernames(rng, n);
      const users: Cell[][] = seq(1, n).map((id, i) => [id, who[i]!, chance(rng, 0.2) ? null : pick(rng, [1000, 1500, 2000, 3000])]);
      const deposits: Cell[][] = [];
      for (const id of seq(1, n)) {
        for (let k = ri(rng, 0, 5); k > 0; k--) {
          deposits.push([
            100 + deposits.length,
            id,
            pick(rng, [500, 1000, 1000, 1500, 2000]),
            chance(rng, 0.8) ? "success" : "failed",
            chance(rng, 0.2) ? pick(rng, ["2025-08-31 23:59:00", "2025-10-01 00:00:00", "2025-09-01 00:00:00"]) : stamp(rng, "2025-09-01", "2025-09-30"),
          ]);
        }
      }
      return { AppUser: users, Deposit: deposits };
    },
    solution: [
      "SELECT u.username, u.deposit_limit, SUM(d.amount) AS deposited",
      "FROM AppUser u",
      "JOIN Deposit d ON d.user_id = u.user_id",
      "WHERE d.status = 'success'",
      "  AND d.deposited_at >= '2025-09-01 00:00:00' AND d.deposited_at < '2025-10-01 00:00:00'",
      "  AND u.deposit_limit IS NOT NULL",
      "GROUP BY u.user_id, u.username, u.deposit_limit",
      "HAVING SUM(d.amount) > u.deposit_limit",
      "ORDER BY deposited - u.deposit_limit DESC, u.username",
    ].join("\n"),
    alternatives: [
      [
        "SELECT u.username, u.deposit_limit, s.deposited",
        "FROM AppUser u",
        "JOIN (SELECT user_id, SUM(amount) AS deposited FROM Deposit",
        "      WHERE status = 'success' AND YEAR(deposited_at) = 2025 AND MONTH(deposited_at) = 9",
        "      GROUP BY user_id) s ON s.user_id = u.user_id",
        "WHERE s.deposited > u.deposit_limit",
        "ORDER BY s.deposited - u.deposit_limit DESC, u.username",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Filter to successful September deposits first, then total them per user.",
      "Compare each user's total with their own limit in `HAVING` — the limit is a column of the grouped user.",
      "A NULL limit compares as unknown, so `total > NULL` never keeps a row.",
    ],
    editorial: [
      "Each user's total is a sum over their deposits, and the threshold is a value on the user's own row, so the query joins `AppUser` to `Deposit`, keeps only the successful deposits made in September, groups by user and compares the group's total with that user's limit.",
      "",
      "Failed deposits never reached the wallet, so they are filtered in `WHERE` before summing. The month is a half-open range on `deposited_at`: a deposit at 23:50 on 30 September counts, one at 00:05 on 1 October does not. Because `deposit_limit` is part of the `GROUP BY`, it can be used in `HAVING SUM(d.amount) > u.deposit_limit`. A user with no limit has NULL there; `x > NULL` is never true, so they would drop out anyway — the explicit `IS NOT NULL` just says so.",
      "",
      "The alternative totals the deposits per user in a derived table and compares outside the aggregation. Ordering by the excess puts the biggest breaches first, with the username breaking ties.",
    ].join("\n"),
  },
];

const MEDIUM: SqlProblemSpec[] = [
  {
    slug: "dream11-player-selection-percentage",
    title: "Dream11: Selection Percentage of Every Player per Match",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Subqueries"],
    description: [
      "The \"Selected by\" figure on a player card tells Dream11 users how many fantasy teams for that match include the player. The product analytics team wants it computed from the saved teams.",
      "",
      "For every match and every player picked in at least one team for it, return `match_id`, `player_name` and `selected_by_pct`: the percentage of **that match's** teams that include the player, rounded to 2 decimals. A team with no picks in this extract still counts in its match's total. Order by `match_id`, then `selected_by_pct` **descending**, then `player_name`.",
    ].join("\n"),
    tables: [
      {
        name: "UserTeam",
        columns: [
          { name: "team_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "match_id", type: "int" },
        ],
        primaryKey: ["team_id"],
        note: "One row per fantasy team saved for a match.",
      },
      {
        name: "TeamPick",
        columns: [
          { name: "team_id", type: "int" },
          { name: "player_id", type: "int" },
        ],
        primaryKey: ["team_id", "player_id"],
        note: "The extract keeps only the picks among a few headline players, so a team lists fewer than 11 rows here.",
      },
      {
        name: "Player",
        columns: [
          { name: "player_id", type: "int" },
          { name: "player_name", type: "varchar" },
        ],
        primaryKey: ["player_id"],
        note: "Player names are unique.",
      },
    ],
    examples: [
      {
        UserTeam: [
          [1, 71, 501],
          [2, 72, 501],
          [3, 73, 501],
          [4, 74, 501],
          [5, 71, 502],
          [6, 75, 502],
          [7, 76, 502],
        ],
        TeamPick: [
          [1, 1], [1, 2],
          [2, 1], [2, 3],
          [3, 1], [3, 2],
          [4, 3],
          [5, 4], [5, 5],
          [6, 4],
        ],
        Player: [
          [1, "Arjun Rao"],
          [2, "Kabir Khan"],
          [3, "Rohan Iyer"],
          [4, "Dev Nair"],
          [5, "Ishaan Das"],
          [6, "Karan Mehta"],
        ],
      },
    ],
    gen: (rng) => {
      const nm = ri(rng, 1, 3);
      const np = nm * 4;
      const who = playerNames(rng, np);
      const players: Cell[][] = seq(1, np).map((id, i) => [id, who[i]!]);
      const teams: Cell[][] = [];
      const picks: Cell[][] = [];
      for (const m of seq(0, nm)) {
        const pool = seq(m * 4 + 1, 4);
        for (let k = ri(rng, 1, 8); k > 0; k--) {
          const t = teams.length + 1;
          teams.push([t, ri(rng, 71, 90), 501 + m]);
          for (const p of sample(rng, pool, ri(rng, 0, 3))) picks.push([t, p]);
        }
      }
      return { UserTeam: teams, TeamPick: picks, Player: players };
    },
    solution: [
      "WITH match_teams AS (",
      "  SELECT match_id, COUNT(*) AS teams FROM UserTeam GROUP BY match_id",
      ")",
      "SELECT ut.match_id, p.player_name, ROUND(100 * COUNT(*) / mt.teams, 2) AS selected_by_pct",
      "FROM TeamPick tp",
      "JOIN UserTeam ut ON ut.team_id = tp.team_id",
      "JOIN Player p ON p.player_id = tp.player_id",
      "JOIN match_teams mt ON mt.match_id = ut.match_id",
      "GROUP BY ut.match_id, p.player_id, p.player_name, mt.teams",
      "ORDER BY ut.match_id, selected_by_pct DESC, p.player_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT ut.match_id, p.player_name,",
        "       ROUND(100 * COUNT(*) / (SELECT COUNT(*) FROM UserTeam x WHERE x.match_id = ut.match_id), 2) AS selected_by_pct",
        "FROM TeamPick tp JOIN UserTeam ut ON ut.team_id = tp.team_id JOIN Player p ON p.player_id = tp.player_id",
        "GROUP BY ut.match_id, p.player_id, p.player_name",
        "ORDER BY ut.match_id, selected_by_pct DESC, p.player_name",
      ].join("\n"),
      [
        "SELECT DISTINCT match_id, player_name, ROUND(100 * picks / teams, 2) AS selected_by_pct",
        "FROM (SELECT ut.match_id, p.player_name,",
        "             COUNT(*) OVER (PARTITION BY ut.match_id, tp.player_id) AS picks,",
        "             (SELECT COUNT(*) FROM UserTeam y WHERE y.match_id = ut.match_id) AS teams",
        "      FROM TeamPick tp JOIN UserTeam ut ON ut.team_id = tp.team_id JOIN Player p ON p.player_id = tp.player_id) z",
        "ORDER BY match_id, selected_by_pct DESC, player_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Two counts per row: teams that picked the player, and all teams of the match.",
      "The denominator must come from `UserTeam`, not from the picks — a team that picked none of these players still counts.",
      "Compute the per-match team count separately (a CTE or a scalar subquery) and divide.",
    ],
    editorial: [
      "A selection percentage is a ratio of two counts at different grains: the numerator is per (match, player), the denominator is per match. Mixing them in one `GROUP BY` does not work, so the query computes the denominator on its own — `match_teams`, the number of saved teams per match — and joins it back.",
      "",
      "The numerator is the number of pick rows for a player in a match. Since `(team_id, player_id)` is the primary key of `TeamPick`, a player appears at most once per team, so `COUNT(*)` after the join is the number of teams that picked them. Taking the denominator from `UserTeam` is the important detail: counting distinct teams among the picks would ignore the teams that left the player (and everyone else in the extract) out, inflating every percentage.",
      "",
      "`100 * COUNT(*) / teams` is decimal division, rounded to two places. The first alternative uses a correlated scalar subquery for the denominator; the second counts picks with a window function and removes the duplicate rows with `DISTINCT`. All read the picks once; the subquery versions rely on an index on `UserTeam.match_id`.",
    ].join("\n"),
  },

  {
    slug: "dream11-most-picked-captain-per-match",
    title: "Dream11: Most-Picked Captain in Every Match",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Joins", "Aggregation"],
    description: [
      "Before each match, Dream11's content team publishes the most popular captain choice. A captain earns double points, so the pick says a lot about what users expect.",
      "",
      "For every match with at least one saved team, return the player (or players, **if tied**) chosen as captain by the most teams. Return `match_id`, `player_name` and `captain_picks`, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "UserTeam",
        columns: [
          { name: "team_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "match_id", type: "int" },
          { name: "captain_id", type: "int" },
          { name: "vice_captain_id", type: "int" },
        ],
        primaryKey: ["team_id"],
        note: "One row per saved team; `captain_id` and `vice_captain_id` are different players of the team.",
      },
      {
        name: "Player",
        columns: [
          { name: "player_id", type: "int" },
          { name: "player_name", type: "varchar" },
        ],
        primaryKey: ["player_id"],
        note: "One row per player.",
      },
    ],
    examples: [
      {
        UserTeam: [
          [1, 71, 501, 1, 2],
          [2, 72, 501, 1, 3],
          [3, 73, 501, 2, 1],
          [4, 74, 501, 1, 2],
          [5, 71, 502, 4, 5],
          [6, 75, 502, 5, 4],
          [7, 76, 502, 6, 4],
        ],
        Player: [
          [1, "Arjun Rao"],
          [2, "Kabir Khan"],
          [3, "Rohan Iyer"],
          [4, "Dev Nair"],
          [5, "Ishaan Das"],
          [6, "Karan Mehta"],
        ],
      },
    ],
    gen: (rng) => {
      const nm = ri(rng, 1, 3);
      const np = nm * 4;
      const who = playerNames(rng, np);
      const players: Cell[][] = seq(1, np).map((id, i) => [id, who[i]!]);
      const teams: Cell[][] = [];
      for (const m of seq(0, nm)) {
        const pool = seq(m * 4 + 1, 4);
        for (let k = chance(rng, 0.15) ? 0 : ri(rng, 1, 7); k > 0; k--) {
          const [c, v] = sample(rng, pool, 2);
          teams.push([teams.length + 1, ri(rng, 71, 90), 501 + m, c!, v!]);
        }
      }
      return { UserTeam: teams, Player: players };
    },
    solution: [
      "WITH picks AS (",
      "  SELECT match_id, captain_id, COUNT(*) AS captain_picks,",
      "         RANK() OVER (PARTITION BY match_id ORDER BY COUNT(*) DESC) AS pos",
      "  FROM UserTeam",
      "  GROUP BY match_id, captain_id",
      ")",
      "SELECT k.match_id, p.player_name, k.captain_picks",
      "FROM picks k",
      "JOIN Player p ON p.player_id = k.captain_id",
      "WHERE k.pos = 1",
    ].join("\n"),
    alternatives: [
      [
        "SELECT t.match_id, p.player_name, COUNT(*) AS captain_picks",
        "FROM UserTeam t JOIN Player p ON p.player_id = t.captain_id",
        "GROUP BY t.match_id, t.captain_id, p.player_name",
        "HAVING COUNT(*) = (SELECT MAX(c) FROM (SELECT match_id, COUNT(*) AS c FROM UserTeam GROUP BY match_id, captain_id) x WHERE x.match_id = t.match_id)",
      ].join("\n"),
      [
        "WITH c AS (SELECT match_id, captain_id, COUNT(*) AS n FROM UserTeam GROUP BY match_id, captain_id)",
        "SELECT c.match_id, p.player_name, c.n AS captain_picks",
        "FROM c JOIN Player p ON p.player_id = c.captain_id",
        "WHERE NOT EXISTS (SELECT 1 FROM c d WHERE d.match_id = c.match_id AND d.n > c.n)",
      ].join("\n"),
    ],
    hints: [
      "First count teams per (match, captain).",
      "Then keep, within each match, the counts equal to the match's highest — a tie keeps every tied captain.",
      "`RANK()` over the counts, partitioned by match, gives 1 to every tied leader; `ROW_NUMBER()` would drop one of them.",
    ],
    editorial: [
      "This is a \"top per group, keeping ties\" question in two steps. First collapse the teams to one row per (match, captain) with `COUNT(*)` — that is how many teams made each player captain. Then, inside each match, keep the rows whose count is the largest.",
      "",
      "`RANK() OVER (PARTITION BY match_id ORDER BY COUNT(*) DESC)` does the second step in the same query: window functions run after `GROUP BY`, so they can order by the aggregate. Every captain sharing the top count gets rank 1, which is why `RANK` (or `DENSE_RANK`) is right and `ROW_NUMBER` is wrong — it would arbitrarily pick one of the tied players. The final join turns the captain's id into a name.",
      "",
      "Without windows the same result comes from comparing each count with the match's maximum, either through `HAVING COUNT(*) = (SELECT MAX(…))` or with `NOT EXISTS` a strictly larger count in the same match. Matches without any teams never produce a group and are absent. One grouping pass over `UserTeam`.",
    ].join("\n"),
  },

  {
    slug: "dream11-teams-with-players-left-out-of-xi",
    title: "Dream11: Saved Teams Carrying Players Left Out of the XI",
    difficulty: "MEDIUM",
    topics: ["Joins", "Subqueries", "Aggregation"],
    description: [
      "When the toss happens and the playing XIs are announced, Dream11 reminds users whose saved team includes players who will not play. The notifications team needs the list.",
      "",
      "Only matches whose XI **has been announced** (at least one row in `PlayingXI`) are checked; teams for other matches are ignored. For each team in a checked match that picked **at least one** player missing from that match's announced XI, return `team_id`, `user_id` and `benched_picks` (how many such players). Order by `benched_picks` **descending**, then by `team_id`.",
    ].join("\n"),
    tables: [
      {
        name: "UserTeam",
        columns: [
          { name: "team_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "match_id", type: "int" },
        ],
        primaryKey: ["team_id"],
        note: "One row per saved fantasy team.",
      },
      {
        name: "TeamPick",
        columns: [
          { name: "team_id", type: "int" },
          { name: "player_id", type: "int" },
        ],
        primaryKey: ["team_id", "player_id"],
        note: "The players in a team (the extract lists only some of them).",
      },
      {
        name: "PlayingXI",
        columns: [
          { name: "match_id", type: "int" },
          { name: "player_id", type: "int" },
        ],
        primaryKey: ["match_id", "player_id"],
        note: "The announced line-up of a match; no rows for a match whose toss has not happened yet.",
      },
    ],
    examples: [
      {
        UserTeam: [
          [1, 71, 501],
          [2, 72, 501],
          [3, 73, 501],
          [4, 74, 502],
          [5, 75, 501],
        ],
        TeamPick: [
          [1, 1], [1, 2], [1, 3],
          [2, 1], [2, 4], [2, 5],
          [3, 2], [3, 3],
          [4, 7], [4, 8],
          [5, 5], [5, 6],
        ],
        PlayingXI: [
          [501, 1],
          [501, 2],
          [501, 3],
          [501, 6],
        ],
      },
    ],
    gen: (rng) => {
      const nm = ri(rng, 1, 3);
      const teams: Cell[][] = [];
      const picks: Cell[][] = [];
      const xi: Cell[][] = [];
      for (const m of seq(0, nm)) {
        const pool = seq(m * 6 + 1, 6);
        if (chance(rng, 0.75)) for (const p of sample(rng, pool, ri(rng, 3, 5))) xi.push([501 + m, p]);
        for (let k = ri(rng, 0, 5); k > 0; k--) {
          const t = teams.length + 1;
          teams.push([t, ri(rng, 71, 90), 501 + m]);
          for (const p of sample(rng, pool, ri(rng, 1, 4))) picks.push([t, p]);
        }
      }
      return { UserTeam: teams, TeamPick: picks, PlayingXI: xi };
    },
    solution: [
      "SELECT ut.team_id, ut.user_id, COUNT(*) AS benched_picks",
      "FROM UserTeam ut",
      "JOIN TeamPick tp ON tp.team_id = ut.team_id",
      "LEFT JOIN PlayingXI x ON x.match_id = ut.match_id AND x.player_id = tp.player_id",
      "WHERE x.player_id IS NULL",
      "  AND ut.match_id IN (SELECT match_id FROM PlayingXI)",
      "GROUP BY ut.team_id, ut.user_id",
      "ORDER BY benched_picks DESC, ut.team_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT ut.team_id, ut.user_id, COUNT(*) AS benched_picks",
        "FROM UserTeam ut JOIN TeamPick tp ON tp.team_id = ut.team_id",
        "WHERE EXISTS (SELECT 1 FROM PlayingXI a WHERE a.match_id = ut.match_id)",
        "  AND NOT EXISTS (SELECT 1 FROM PlayingXI x WHERE x.match_id = ut.match_id AND x.player_id = tp.player_id)",
        "GROUP BY ut.team_id, ut.user_id",
        "ORDER BY benched_picks DESC, ut.team_id",
      ].join("\n"),
      [
        "SELECT team_id, user_id, benched_picks FROM (",
        "  SELECT ut.team_id, ut.user_id, SUM(CASE WHEN x.player_id IS NULL THEN 1 ELSE 0 END) AS benched_picks",
        "  FROM UserTeam ut",
        "  JOIN (SELECT DISTINCT match_id FROM PlayingXI) ann ON ann.match_id = ut.match_id",
        "  JOIN TeamPick tp ON tp.team_id = ut.team_id",
        "  LEFT JOIN PlayingXI x ON x.match_id = ut.match_id AND x.player_id = tp.player_id",
        "  GROUP BY ut.team_id, ut.user_id) s",
        "WHERE benched_picks > 0",
        "ORDER BY benched_picks DESC, team_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "A pick is benched when no `PlayingXI` row has the same match and the same player — an anti join on two columns.",
      "The match comes from the team, so join `UserTeam` to its picks before looking up the XI.",
      "Without the announced-match check, every pick of a match before its toss would look benched.",
    ],
    editorial: [
      "Each pick needs to be checked against the XI **of its own team's match**, so the anti join is on two columns: `x.match_id = ut.match_id AND x.player_id = tp.player_id`. A `LEFT JOIN` with `WHERE x.player_id IS NULL` keeps exactly the picks that found no line-up row, and grouping by team counts them. Teams with no benched picks have no surviving rows and disappear, which is what \"at least one\" asks.",
      "",
      "The trap is the match whose toss has not happened. Its `PlayingXI` is empty, so every one of its picks would look benched and every team would be notified. The extra condition `ut.match_id IN (SELECT match_id FROM PlayingXI)` restricts the check to announced matches.",
      "",
      "The first alternative states both tests with `EXISTS` / `NOT EXISTS`. The second joins to the distinct announced matches first and counts the unmatched picks with a conditional `SUM`, filtering zero counts afterwards. With the primary keys as indexes each pick costs one index probe.",
    ].join("\n"),
  },

  {
    slug: "dream11-private-league-head-to-heads-still-to-play",
    title: "Dream11: Head-to-Head Fixtures Still to Play in Private Leagues",
    difficulty: "MEDIUM",
    topics: ["Joins", "Subqueries"],
    description: [
      "Some groups of friends run a season-long private league on Dream11 in round-robin style: **every two members of a league meet in exactly one head-to-head**. The private-contests team needs the fixtures that still have to be created so the remaining head-to-heads can be scheduled.",
      "",
      "For every league, list each pair of its members that has **not yet played** a head-to-head in that league. A played head-to-head may be stored with either member as `user_a`; a pair from a different league does not count. Return `league_id`, `user_one` and `user_two`, with `user_one` the **smaller** user id of the pair, so each pair appears once. Order by `league_id`, then `user_one`, then `user_two`.",
    ].join("\n"),
    tables: [
      {
        name: "LeagueMember",
        columns: [
          { name: "league_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "joined_on", type: "date" },
        ],
        primaryKey: ["league_id", "user_id"],
        note: "One row per member of a private league; a user can belong to several leagues.",
      },
      {
        name: "H2HMatch",
        columns: [
          { name: "h2h_id", type: "int" },
          { name: "league_id", type: "int" },
          { name: "user_a", type: "int" },
          { name: "user_b", type: "int" },
        ],
        primaryKey: ["h2h_id"],
        note: "A head-to-head already played between two members of the league, in no particular order of `user_a` and `user_b`. A rematch after an abandoned match can appear twice.",
      },
    ],
    examples: [
      {
        LeagueMember: [
          [1, 11, "2025-03-01"],
          [1, 12, "2025-03-01"],
          [1, 13, "2025-03-02"],
          [1, 14, "2025-03-05"],
          [2, 11, "2025-03-03"],
          [2, 15, "2025-03-03"],
          [2, 16, "2025-03-04"],
          [3, 17, "2025-03-06"],
        ],
        H2HMatch: [
          [100, 1, 11, 12],
          [101, 1, 14, 11],
          [102, 1, 13, 12],
          [103, 1, 12, 11],
          [104, 2, 16, 15],
          [105, 2, 13, 14],
        ],
      },
    ],
    gen: (rng) => {
      const members: Cell[][] = [];
      const played: Cell[][] = [];
      for (const league of seq(1, ri(rng, 1, 3))) {
        const ids = sample(rng, seq(11, 10), ri(rng, 1, 5)).sort((a, b) => a - b);
        for (const u of ids) members.push([league, u, dateBetween(rng, "2025-03-01", "2025-03-10")]);
        for (let i = 0; i < ids.length; i++) {
          for (let j = i + 1; j < ids.length; j++) {
            if (!chance(rng, 0.45)) continue;
            const [a, b] = chance(rng, 0.5) ? [ids[i]!, ids[j]!] : [ids[j]!, ids[i]!];
            played.push([100 + played.length, league, a, b]);
            if (chance(rng, 0.15)) played.push([100 + played.length, league, b, a]);
          }
        }
        // A pair that met in another league must not count here.
        if (ids.length >= 2 && chance(rng, 0.3)) played.push([100 + played.length, league + 10, ids[0]!, ids[1]!]);
      }
      return { LeagueMember: members, H2HMatch: played };
    },
    solution: [
      "SELECT m1.league_id, m1.user_id AS user_one, m2.user_id AS user_two",
      "FROM LeagueMember m1",
      "JOIN LeagueMember m2 ON m2.league_id = m1.league_id AND m1.user_id < m2.user_id",
      "LEFT JOIN H2HMatch h ON h.league_id = m1.league_id",
      " AND LEAST(h.user_a, h.user_b) = m1.user_id",
      " AND GREATEST(h.user_a, h.user_b) = m2.user_id",
      "WHERE h.h2h_id IS NULL",
      "ORDER BY m1.league_id, user_one, user_two",
    ].join("\n"),
    alternatives: [
      [
        "SELECT m1.league_id, m1.user_id AS user_one, m2.user_id AS user_two",
        "FROM LeagueMember m1, LeagueMember m2",
        "WHERE m2.league_id = m1.league_id AND m2.user_id > m1.user_id",
        "  AND NOT EXISTS (SELECT 1 FROM H2HMatch h WHERE h.league_id = m1.league_id",
        "                    AND ((h.user_a = m1.user_id AND h.user_b = m2.user_id) OR (h.user_a = m2.user_id AND h.user_b = m1.user_id)))",
        "ORDER BY m1.league_id, user_one, user_two",
      ].join("\n"),
      [
        "SELECT a.league_id, a.user_id AS user_one, b.user_id AS user_two",
        "FROM LeagueMember a JOIN LeagueMember b ON b.league_id = a.league_id AND b.user_id > a.user_id",
        "WHERE (a.league_id, a.user_id, b.user_id) NOT IN (",
        "  SELECT league_id, user_a, user_b FROM H2HMatch",
        "  UNION",
        "  SELECT league_id, user_b, user_a FROM H2HMatch)",
        "ORDER BY a.league_id, user_one, user_two",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Every fixture is a pair of members of the same league — join `LeagueMember` to itself on `league_id`.",
      "`m1.user_id < m2.user_id` keeps each pair once and never pairs a member with themselves.",
      "A played match may be stored either way round: compare against `LEAST(user_a, user_b)` and `GREATEST(user_a, user_b)`, or test both orders.",
      "The league must match too — two friends who met in another league still owe each other this one.",
    ],
    editorial: [
      "A round-robin schedule is every unordered pair of members, and the way to list unordered pairs in SQL is a **self join with an inequality**: `LeagueMember m1 JOIN LeagueMember m2 ON m2.league_id = m1.league_id AND m1.user_id < m2.user_id`. The equality keeps both members in the same league; the strict `<` does two jobs at once — it drops the pairing of a member with themselves, and it keeps only one of the two orders (11 vs 12, never also 12 vs 11). A league of n members yields n(n − 1)/2 pairs, and a league of one member yields none.",
      "",
      "What remains is an anti join against the matches already played. Because a played match may name either member first, it is normalised with `LEAST(user_a, user_b)` and `GREATEST(user_a, user_b)`, which is exactly the shape of the generated pair; a `LEFT JOIN` on that plus the league id, keeping the rows where nothing matched, leaves the fixtures still owed. A rematch stored twice simply matches twice and is still excluded, and a meeting in a different league does not match because the league is part of the condition.",
      "",
      "The alternatives test both orders explicitly in a `NOT EXISTS`, or remove the played pairs (in both orientations, via `UNION`) with a row-value `NOT IN`. Pair generation is quadratic in a league's size, which is tiny for a friends' league.",
    ].join("\n"),
  },

  {
    slug: "dream11-moment-each-contest-filled",
    title: "Dream11: The Moment Each Contest Filled Up",
    difficulty: "MEDIUM",
    topics: ["Window Functions"],
    description: [
      "Dream11's contest-design team measures how fast contests fill to decide how many to create for the next match. A contest **filled** at the moment its `total_spots`-th entry joined. Entries take spots in order of `joined_at`, and when two entries share a timestamp the smaller `entry_id` came first. During traffic bursts a few extra entries can slip in after a contest is full (they are refunded later); they do not change when it filled.",
      "",
      "For every contest that filled, return `contest_id` and `filled_at`. Contests that never reached `total_spots` entries are left out. Order by `filled_at`, then `contest_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Contest",
        columns: [
          { name: "contest_id", type: "int" },
          { name: "total_spots", type: "int" },
        ],
        primaryKey: ["contest_id"],
        note: "How many teams the contest admits.",
      },
      {
        name: "ContestEntry",
        columns: [
          { name: "entry_id", type: "int" },
          { name: "contest_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "joined_at", type: "datetime" },
        ],
        primaryKey: ["entry_id"],
        note: "One row per team that joined a contest.",
      },
    ],
    examples: [
      {
        Contest: [
          [1, 3],
          [2, 2],
          [3, 4],
          [4, 2],
        ],
        ContestEntry: [
          [10, 1, 71, "2025-05-10 18:00:05"],
          [11, 1, 72, "2025-05-10 18:01:00"],
          [12, 1, 73, "2025-05-10 18:02:30"],
          [13, 1, 74, "2025-05-10 18:02:30"],
          [16, 2, 75, "2025-05-10 18:03:00"],
          [14, 2, 76, "2025-05-10 18:04:00"],
          [15, 2, 77, "2025-05-10 18:04:00"],
          [17, 3, 71, "2025-05-10 18:00:00"],
          [18, 3, 78, "2025-05-10 18:05:00"],
        ],
      },
    ],
    gen: (rng) => {
      const nc = ri(rng, 1, 5);
      const contests: Cell[][] = seq(1, nc).map((id) => [id, ri(rng, 2, 4)]);
      const rows: Cell[][] = [];
      for (const [id, spots] of contests as number[][]) {
        let t = `2025-05-10 18:0${ri(rng, 0, 5)}:00`;
        for (let k = ri(rng, 0, spots! + 2); k > 0; k--) {
          rows.push([0, id!, ri(rng, 71, 90), t]);
          t = plusSeconds(t, chance(rng, 0.3) ? 0 : ri(rng, 1, 400));
        }
      }
      const ids = shuffle(rng, seq(10, rows.length));
      rows.forEach((r, i) => (r[0] = ids[i]!));
      return { Contest: contests, ContestEntry: rows };
    },
    solution: [
      "WITH seat AS (",
      "  SELECT contest_id, joined_at,",
      "         ROW_NUMBER() OVER (PARTITION BY contest_id ORDER BY joined_at, entry_id) AS spot",
      "  FROM ContestEntry",
      ")",
      "SELECT c.contest_id, s.joined_at AS filled_at",
      "FROM Contest c",
      "JOIN seat s ON s.contest_id = c.contest_id AND s.spot = c.total_spots",
      "ORDER BY filled_at, c.contest_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT c.contest_id, e.joined_at AS filled_at",
        "FROM Contest c JOIN ContestEntry e ON e.contest_id = c.contest_id",
        "WHERE (SELECT COUNT(*) FROM ContestEntry b WHERE b.contest_id = e.contest_id",
        "         AND (b.joined_at < e.joined_at OR (b.joined_at = e.joined_at AND b.entry_id <= e.entry_id))) = c.total_spots",
        "ORDER BY filled_at, c.contest_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Number each contest's entries in the order they took spots.",
      "The order is `joined_at`, then `entry_id` — the tie-break is part of the rule.",
      "The contest filled at the entry whose number equals `total_spots`; a contest with fewer entries has no such row.",
    ],
    editorial: [
      "Give every entry its spot number within its contest — `ROW_NUMBER() OVER (PARTITION BY contest_id ORDER BY joined_at, entry_id)` — and the answer is the entry whose spot number equals the contest's `total_spots`. Joining `Contest` to the numbered entries on both `contest_id` and `spot = total_spots` picks out exactly that row, and its `joined_at` is when the contest filled.",
      "",
      "The tie-break matters: two entries that joined in the same second compete for the last spot, and the statement says the smaller `entry_id` wins it. Because the window order includes `entry_id`, the numbering is total and deterministic. Over-filled contests are handled for free — the extra entries get numbers above `total_spots` and are never matched — and contests that did not fill have no row with that number, so the inner join drops them.",
      "",
      "The alternative counts, for each entry, how many entries of its contest came at or before it (a correlated subquery that spells out the same order) and keeps the one whose count equals the capacity. It is quadratic per contest; the window version sorts each contest once.",
    ].join("\n"),
  },

  {
    slug: "dream11-contest-entries-by-format-per-match",
    title: "Dream11: Contest Entries by Format for Each Match",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Joins", "Aggregation"],
    description: [
      "Dream11's match-day dashboard shows where users put their teams: mega contests, head-to-heads or the smaller formats.",
      "",
      "For **every** match — including matches with no contests or no entries — return `match_id`, `mega_entries`, `h2h_entries` (contest type `head_to_head`), `other_entries` (`small_league` and `private` together) and `total_entries`. Counts with nothing to count are 0. Order by `total_entries` **descending**, then by `match_id`.",
    ].join("\n"),
    tables: [
      {
        name: "FixtureMatch",
        columns: [
          { name: "match_id", type: "int" },
          { name: "fixture", type: "varchar" },
        ],
        primaryKey: ["match_id"],
        note: "One row per match listed in the app.",
      },
      {
        name: "Contest",
        columns: [
          { name: "contest_id", type: "int" },
          { name: "match_id", type: "int" },
          { name: "contest_type", type: "enum", values: [...CONTEST_TYPES] },
        ],
        primaryKey: ["contest_id"],
        note: "One row per contest on a match.",
      },
      {
        name: "ContestEntry",
        columns: [
          { name: "entry_id", type: "int" },
          { name: "contest_id", type: "int" },
          { name: "user_id", type: "int" },
        ],
        primaryKey: ["entry_id"],
        note: "One row per team entered into a contest.",
      },
    ],
    examples: [
      {
        FixtureMatch: [
          [1, "MUM vs CHE"],
          [2, "Patna vs Jaipur"],
          [3, "Goa vs Kerala"],
          [4, "IND vs AUS"],
        ],
        Contest: [
          [10, 1, "mega"],
          [11, 1, "head_to_head"],
          [12, 1, "private"],
          [13, 2, "small_league"],
          [14, 2, "mega"],
          [15, 3, "mega"],
        ],
        ContestEntry: [
          [100, 10, 71],
          [101, 10, 72],
          [102, 11, 71],
          [103, 11, 73],
          [104, 12, 74],
          [105, 13, 71],
          [106, 13, 75],
          [107, 14, 76],
          [108, 14, 77],
          [109, 14, 78],
        ],
      },
    ],
    gen: (rng) => {
      const nm = ri(rng, 1, 5);
      const matches: Cell[][] = seq(1, nm).map((id) => [id, pick(rng, FIXTURES)]);
      const nc = ri(rng, 0, 7);
      const contests: Cell[][] = seq(10, nc).map((id) => [id, ri(rng, 1, nm), pick(rng, CONTEST_TYPES)]);
      const ne = nc === 0 ? 0 : ri(rng, 0, 20);
      const entries: Cell[][] = seq(100, ne).map((id) => [id, ri(rng, 10, 9 + nc), ri(rng, 71, 90)]);
      return { FixtureMatch: matches, Contest: contests, ContestEntry: entries };
    },
    solution: [
      "SELECT m.match_id,",
      "       SUM(CASE WHEN c.contest_type = 'mega' AND e.entry_id IS NOT NULL THEN 1 ELSE 0 END) AS mega_entries,",
      "       SUM(CASE WHEN c.contest_type = 'head_to_head' AND e.entry_id IS NOT NULL THEN 1 ELSE 0 END) AS h2h_entries,",
      "       SUM(CASE WHEN c.contest_type IN ('small_league', 'private') AND e.entry_id IS NOT NULL THEN 1 ELSE 0 END) AS other_entries,",
      "       COUNT(e.entry_id) AS total_entries",
      "FROM FixtureMatch m",
      "LEFT JOIN Contest c ON c.match_id = m.match_id",
      "LEFT JOIN ContestEntry e ON e.contest_id = c.contest_id",
      "GROUP BY m.match_id",
      "ORDER BY total_entries DESC, m.match_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT m.match_id,",
        "       COALESCE(s.mega, 0) AS mega_entries, COALESCE(s.h2h, 0) AS h2h_entries,",
        "       COALESCE(s.other, 0) AS other_entries, COALESCE(s.total, 0) AS total_entries",
        "FROM FixtureMatch m",
        "LEFT JOIN (SELECT c.match_id,",
        "                  SUM(IF(c.contest_type = 'mega', 1, 0)) AS mega,",
        "                  SUM(IF(c.contest_type = 'head_to_head', 1, 0)) AS h2h,",
        "                  SUM(IF(c.contest_type IN ('small_league', 'private'), 1, 0)) AS other,",
        "                  COUNT(*) AS total",
        "           FROM Contest c JOIN ContestEntry e ON e.contest_id = c.contest_id",
        "           GROUP BY c.match_id) s ON s.match_id = m.match_id",
        "ORDER BY total_entries DESC, m.match_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Every match must appear, so start from `FixtureMatch` and LEFT JOIN outwards.",
      "One `SUM(CASE …)` per output column turns contest types into columns.",
      "A contest with no entries still produces a joined row with NULL entry columns — make sure it is not counted.",
    ],
    editorial: [
      "The output has one row per match and one column per format, a classic **conditional aggregation** (a manual pivot). Starting from `FixtureMatch` and LEFT JOINing contests and then entries keeps every match, even one with nothing under it, and grouping by `match_id` folds its rows into one.",
      "",
      "Each format column is `SUM(CASE WHEN <format> AND e.entry_id IS NOT NULL THEN 1 ELSE 0 END)`. The second half of the condition is the subtle part: a contest that has no entries still survives the first left join and appears once with NULLs on the entry side — counting it would add a phantom entry. `COUNT(e.entry_id)` for the total skips those NULLs by itself. A match with no contests yields one all-NULL row, so every sum is 0, as required.",
      "",
      "The alternative pivots only real entries (inner join of contests and entries) in a derived table and left-joins it to the matches, turning the missing groups into zeros with `COALESCE`. Both read each table once.",
    ].join("\n"),
  },

  {
    slug: "dream11-private-leagues-below-minimum-size",
    title: "Dream11: Private Leagues Cancelled Below Their Minimum Size",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation"],
    description: [
      "A private league on Dream11 is created by a user for friends, with a minimum number of teams. If fewer than `min_teams` teams have joined when the match locks, the league is cancelled and every entry fee is refunded. Finance needs the refund list.",
      "",
      "For every private league with **fewer than** `min_teams` entries (including leagues nobody joined), return `league_name`, `creator` (the creator's username), `teams_joined` and `refund_due` (`teams_joined × entry_fee`). Order by `refund_due` **descending**, then by `league_name`.",
    ].join("\n"),
    tables: [
      {
        name: "AppUser",
        columns: [
          { name: "user_id", type: "int" },
          { name: "username", type: "varchar" },
        ],
        primaryKey: ["user_id"],
        note: "One row per account.",
      },
      {
        name: "PrivateLeague",
        columns: [
          { name: "league_id", type: "int" },
          { name: "league_name", type: "varchar" },
          { name: "creator_id", type: "int" },
          { name: "entry_fee", type: "int" },
          { name: "min_teams", type: "int" },
        ],
        primaryKey: ["league_id"],
        note: "League names are unique. `creator_id` is a user.",
      },
      {
        name: "LeagueEntry",
        columns: [
          { name: "entry_id", type: "int" },
          { name: "league_id", type: "int" },
          { name: "user_id", type: "int" },
        ],
        primaryKey: ["entry_id"],
        note: "One row per team entered; the creator's own team is an entry like any other.",
      },
    ],
    examples: [
      {
        AppUser: [
          [1, "aarav_21"],
          [2, "diya_07"],
          [3, "kabir_88"],
          [4, "meera_14"],
        ],
        PrivateLeague: [
          [10, "Hostel B Warriors", 1, 50, 3],
          [11, "Office Super Over", 2, 100, 4],
          [12, "College Gang", 3, 25, 2],
          [13, "Sunday Squad", 4, 200, 2],
        ],
        LeagueEntry: [
          [100, 10, 1],
          [101, 10, 2],
          [102, 11, 2],
          [103, 11, 3],
          [104, 12, 3],
          [105, 12, 4],
          [106, 12, 1],
        ],
      },
    ],
    gen: (rng) => {
      const nu = ri(rng, 2, 6);
      const who = usernames(rng, nu);
      const users: Cell[][] = seq(1, nu).map((id, i) => [id, who[i]!]);
      const nl = ri(rng, 1, 6);
      const leagueNames = sample(rng, ["Hostel B Warriors", "Office Super Over", "College Gang", "Sunday Squad", "Cousins XI", "Gully Legends", "Team Chai", "Night Owls"], nl);
      const leagues: Cell[][] = seq(10, nl).map((id, i) => [id, leagueNames[i]!, ri(rng, 1, nu), pick(rng, [25, 50, 100, 200]), ri(rng, 2, 4)]);
      const entries: Cell[][] = [];
      for (const id of seq(10, nl)) for (let k = ri(rng, 0, 5); k > 0; k--) entries.push([100 + entries.length, id, ri(rng, 1, nu)]);
      return { AppUser: users, PrivateLeague: leagues, LeagueEntry: entries };
    },
    solution: [
      "SELECT l.league_name, u.username AS creator, COUNT(e.entry_id) AS teams_joined,",
      "       COUNT(e.entry_id) * l.entry_fee AS refund_due",
      "FROM PrivateLeague l",
      "JOIN AppUser u ON u.user_id = l.creator_id",
      "LEFT JOIN LeagueEntry e ON e.league_id = l.league_id",
      "GROUP BY l.league_id, l.league_name, u.username, l.entry_fee, l.min_teams",
      "HAVING COUNT(e.entry_id) < l.min_teams",
      "ORDER BY refund_due DESC, l.league_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT league_name, creator, teams_joined, teams_joined * entry_fee AS refund_due FROM (",
        "  SELECT l.league_name, u.username AS creator, l.entry_fee, l.min_teams,",
        "         (SELECT COUNT(*) FROM LeagueEntry e WHERE e.league_id = l.league_id) AS teams_joined",
        "  FROM PrivateLeague l JOIN AppUser u ON u.user_id = l.creator_id) t",
        "WHERE teams_joined < min_teams",
        "ORDER BY refund_due DESC, league_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Leagues with no entries must still be counted (as 0), so LEFT JOIN the entries.",
      "`COUNT(*)` would count the empty league's single NULL row as 1 — count a column of the entry table.",
      "The minimum is per league, so compare in `HAVING` against the league's own `min_teams`.",
    ],
    editorial: [
      "Every league needs its entry count, including leagues with none, so `PrivateLeague` is LEFT JOINed to `LeagueEntry` and grouped per league. The creator's name comes from an inner join to `AppUser` — every league has a creator, so it loses nothing.",
      "",
      "Counting needs care. A league nobody joined contributes one row whose entry columns are NULL; `COUNT(*)` would call that 1 team, while `COUNT(e.entry_id)` correctly says 0. The cancellation test compares the count with that league's own minimum, which is why `min_teams` is in the `GROUP BY` and the test sits in `HAVING`. The refund is the count times the fee — 0 for an empty league, which still appears because it was cancelled.",
      "",
      "The alternative computes the count with a correlated subquery per league (which naturally returns 0 for an empty league) and filters outside. Both read each league's entries once with an index on `LeagueEntry.league_id`. Ties on the refund are broken by the league's unique name.",
    ].join("\n"),
  },

  {
    slug: "dream11-withdrawals-before-kyc-approval",
    title: "Dream11: Withdrawal Requests Made Before KYC Approval",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Dates"],
    description: [
      "Winnings can only be withdrawn after a user's identity check (KYC) is approved. The compliance team at Dream11 audits whether the app ever accepted a withdrawal request too early.",
      "",
      "A withdrawal is **early** if the user had no approved KYC at `requested_at`: they have no KYC row, their KYC was never approved (`approved_at` is NULL), or the request came **strictly before** `approved_at` (a request at the exact approval second is fine). For every user with at least one early request, return `user_id`, `early_requests` and `early_amount` (their total). Order by `early_amount` **descending**, then by `user_id`.",
    ].join("\n"),
    tables: [
      {
        name: "KycCheck",
        columns: [
          { name: "user_id", type: "int" },
          { name: "submitted_at", type: "datetime" },
          { name: "approved_at", type: "datetime" },
          { name: "status", type: "enum", values: ["approved", "pending", "rejected"] },
        ],
        primaryKey: ["user_id"],
        note: "At most one KYC record per user. `approved_at` is set only when `status` is `approved`.",
      },
      {
        name: "Withdrawal",
        columns: [
          { name: "withdrawal_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "requested_at", type: "datetime" },
        ],
        primaryKey: ["withdrawal_id"],
        note: "Every withdrawal request the app accepted.",
      },
    ],
    examples: [
      {
        KycCheck: [
          [1, "2025-06-01 10:00:00", "2025-06-02 12:00:00", "approved"],
          [2, "2025-06-01 11:00:00", null, "pending"],
          [3, "2025-06-03 09:00:00", "2025-06-03 15:00:00", "approved"],
          [4, "2025-06-04 09:00:00", null, "rejected"],
        ],
        Withdrawal: [
          [10, 1, 500, "2025-06-02 11:59:59"],
          [11, 1, 700, "2025-06-02 12:00:00"],
          [12, 2, 1200, "2025-06-05 10:00:00"],
          [13, 3, 900, "2025-06-04 10:00:00"],
          [14, 5, 300, "2025-06-05 18:00:00"],
          [15, 2, 300, "2025-06-06 10:00:00"],
          [16, 1, 1000, "2025-06-01 20:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const users = seq(1, ri(rng, 2, 7));
      const kyc: Cell[][] = [];
      const approved = new Map<number, string>();
      for (const u of users) {
        if (chance(rng, 0.15)) continue;
        const sub = stamp(rng, "2025-06-01", "2025-06-05");
        const status = pick(rng, ["approved", "approved", "pending", "rejected"]);
        const ok = status === "approved" ? plusSeconds(sub, ri(rng, 1, 48) * 3600) : null;
        if (ok) approved.set(u, ok);
        kyc.push([u, sub, ok, status]);
      }
      const rows: Cell[][] = [];
      for (const u of users) {
        for (let k = ri(rng, 0, 3); k > 0; k--) {
          const a = approved.get(u);
          const req = a && chance(rng, 0.5) ? plusSeconds(a, pick(rng, [-1, 0, 1, -7200, 3600, 86400])) : stamp(rng, "2025-06-01", "2025-06-09");
          rows.push([10 + rows.length, u, roundTo(rng, 100, 3000, 100), req]);
        }
      }
      return { KycCheck: kyc, Withdrawal: rows };
    },
    solution: [
      "SELECT w.user_id, COUNT(*) AS early_requests, SUM(w.amount) AS early_amount",
      "FROM Withdrawal w",
      "LEFT JOIN KycCheck k ON k.user_id = w.user_id",
      "WHERE k.approved_at IS NULL OR w.requested_at < k.approved_at",
      "GROUP BY w.user_id",
      "ORDER BY early_amount DESC, w.user_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT user_id, COUNT(*) AS early_requests, SUM(amount) AS early_amount",
        "FROM Withdrawal w",
        "WHERE NOT EXISTS (SELECT 1 FROM KycCheck k WHERE k.user_id = w.user_id AND k.approved_at <= w.requested_at)",
        "GROUP BY user_id",
        "ORDER BY early_amount DESC, user_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Some users have no KYC row at all — an inner join would silently drop their withdrawals.",
      "After a LEFT JOIN, a missing KYC and an unapproved one both show `approved_at` as NULL.",
      "Turn the rule around: a request is fine only if an approval exists at or before it.",
    ],
    editorial: [
      "A withdrawal is legitimate only when an approval exists at or before the request. Everything else is early, and \"everything else\" has three shapes: no KYC record, a record that was never approved, and an approval that came later than the request.",
      "",
      "A `LEFT JOIN` from `Withdrawal` to `KycCheck` keeps every request; for the first two shapes `k.approved_at` is NULL, so `k.approved_at IS NULL OR w.requested_at < k.approved_at` covers all three in one condition. Without the `IS NULL` branch, the comparison with NULL would be unknown and those requests — the worst ones — would vanish from the audit. The comparison is strict, so a request at the approval second passes. Grouping by user then counts and totals the early requests.",
      "",
      "The alternative states the rule in its positive form, as an anti join: keep the request when **no** KYC row has `approved_at <= requested_at`. That handles missing rows and NULL approvals without any special case, since neither can satisfy the comparison. Both are one pass with an index probe per request.",
    ].join("\n"),
  },

  {
    slug: "dream11-player-form-last-three-matches",
    title: "Dream11: Each Player's Form Over Their Last Three Matches",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "Dream11's team-building tips show each player's recent form: their average fantasy points in their three most recent matches.",
      "",
      "For every player with **at least three** matches in `PlayerPoints`, return `player_name`, `player_role` and `form_avg`, the average of their fantasy points in their three latest matches by `match_date`, rounded to 2 decimals. Players with fewer than three matches are left out. Order by `form_avg` **descending**, then by `player_name`.",
    ].join("\n"),
    tables: [
      {
        name: "Player",
        columns: [
          { name: "player_id", type: "int" },
          { name: "player_name", type: "varchar" },
          { name: "player_role", type: "enum", values: ["WK", "BAT", "AR", "BOWL"] },
        ],
        primaryKey: ["player_id"],
        note: "Player names are unique.",
      },
      {
        name: "PlayerPoints",
        columns: [
          { name: "player_id", type: "int" },
          { name: "match_id", type: "int" },
          { name: "match_date", type: "date" },
          { name: "fantasy_points", type: "decimal" },
        ],
        primaryKey: ["player_id", "match_id"],
        note: "Fantasy points a player scored in a match (steps of 0.5; can be negative). A player plays at most one match on a date.",
      },
    ],
    examples: [
      {
        Player: [
          [1, "Arjun Rao", "BAT"],
          [2, "Kabir Khan", "BOWL"],
          [3, "Rohan Iyer", "AR"],
          [4, "Dev Nair", "WK"],
        ],
        PlayerPoints: [
          [1, 501, "2025-04-01", 12],
          [1, 502, "2025-04-04", 88.5],
          [1, 503, "2025-04-07", 40],
          [1, 504, "2025-04-10", 61],
          [2, 501, "2025-04-01", 45],
          [2, 503, "2025-04-07", -2],
          [2, 505, "2025-04-12", 70],
          [3, 502, "2025-04-04", 33],
          [3, 504, "2025-04-10", 20],
          [4, 502, "2025-04-04", 60],
          [4, 503, "2025-04-07", 46.5],
          [4, 504, "2025-04-10", 56],
        ],
      },
    ],
    gen: (rng) => {
      const np = ri(rng, 2, 6);
      const who = playerNames(rng, np);
      const players: Cell[][] = seq(1, np).map((id, i) => [id, who[i]!, pick(rng, ["WK", "BAT", "AR", "BOWL"])]);
      const rows: Cell[][] = [];
      for (const p of seq(1, np)) {
        const games = sample(rng, seq(0, 8), ri(rng, 1, 6));
        for (const g of games) rows.push([p, 501 + g, addDays("2025-04-01", g * 3), fp(rng, -4, 110)]);
      }
      return { Player: players, PlayerPoints: rows };
    },
    solution: [
      "WITH recent AS (",
      "  SELECT player_id, fantasy_points,",
      "         ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY match_date DESC) AS k",
      "  FROM PlayerPoints",
      ")",
      "SELECT p.player_name, p.player_role, ROUND(AVG(r.fantasy_points), 2) AS form_avg",
      "FROM recent r",
      "JOIN Player p ON p.player_id = r.player_id",
      "WHERE r.k <= 3",
      "GROUP BY p.player_id, p.player_name, p.player_role",
      "HAVING COUNT(*) = 3",
      "ORDER BY form_avg DESC, p.player_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT p.player_name, p.player_role, ROUND(SUM(a.fantasy_points) / 3, 2) AS form_avg",
        "FROM PlayerPoints a JOIN Player p ON p.player_id = a.player_id",
        "WHERE (SELECT COUNT(*) FROM PlayerPoints b WHERE b.player_id = a.player_id AND b.match_date > a.match_date) < 3",
        "  AND (SELECT COUNT(*) FROM PlayerPoints c WHERE c.player_id = a.player_id) >= 3",
        "GROUP BY p.player_id, p.player_name, p.player_role",
        "ORDER BY form_avg DESC, p.player_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Number each player's matches from the most recent backwards.",
      "Keep numbers 1 to 3, then average per player.",
      "A player with only two matches would still average them — require exactly three rows in the group.",
    ],
    editorial: [
      "\"The last three\" is a top-N-per-group question. `ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY match_date DESC)` numbers each player's matches from the latest backwards; keeping `k <= 3` leaves at most three rows per player, and `AVG` over them is the form figure. A player plays at most one match per date, so the numbering has no ties to break.",
      "",
      "The filter `k <= 3` alone would still let a player with one or two matches through, averaged over fewer games. `HAVING COUNT(*) = 3` removes them — after the filter a group has three rows exactly when the player had at least three matches. Points move in steps of 0.5, so an average of three is a multiple of 1/6 and rounding it to two decimals never lands on a half.",
      "",
      "The alternative avoids window functions: a match is among a player's last three when fewer than three of their matches are later, and a second correlated count enforces the minimum; dividing the sum by 3 is then the average. It is quadratic per player, the window version a sort per player.",
    ].join("\n"),
  },

  {
    slug: "dream11-multi-accounts-behind-one-gmail",
    title: "Dream11: Multiple Accounts Behind One Gmail Address",
    difficulty: "MEDIUM",
    topics: ["Strings", "Aggregation"],
    description: [
      "Dream11's fair-play team looks for people who open several accounts to claim sign-up bonuses repeatedly. Gmail delivers mail for `ri.ya+ipl@gmail.com` and `riya@gmail.com` to the same inbox: it ignores dots in the part before `@` and anything from a `+` onwards.",
      "",
      "Consider only addresses ending in `@gmail.com`. Normalise each by removing everything from the first `+` up to the `@`, removing the dots of the part before the `@`, and keeping `@gmail.com`. For every normalised address shared by **two or more** accounts, return `canonical_email`, `accounts` and `first_user_id` (the smallest `user_id` among them). Order by `accounts` **descending**, then by `canonical_email`.",
    ].join("\n"),
    tables: [
      {
        name: "AppUser",
        columns: [
          { name: "user_id", type: "int" },
          { name: "email", type: "varchar" },
          { name: "signup_date", type: "date" },
        ],
        primaryKey: ["user_id"],
        note: "Emails are stored in lower case; each address is registered once.",
      },
    ],
    examples: [
      {
        AppUser: [
          [1, "riya.sharma@gmail.com", "2025-03-01"],
          [2, "riyasharma+ipl@gmail.com", "2025-03-04"],
          [3, "r.i.y.a.sharma+bonus2@gmail.com", "2025-03-05"],
          [4, "riya.sharma@yahoo.co.in", "2025-03-05"],
          [5, "karan.mehta@gmail.com", "2025-03-06"],
          [6, "karanmehta@gmail.com", "2025-03-07"],
          [7, "dev.nair@outlook.com", "2025-03-07"],
          [8, "devnair@outlook.com", "2025-03-08"],
          [9, "zara@gmail.com", "2025-03-09"],
        ],
      },
    ],
    gen: (rng) => {
      const bases = sample(rng, FIRST_NAMES.map((f) => f.toLowerCase()), ri(rng, 1, 4)).map((f) => `${f}${pick(rng, LAST_NAMES).toLowerCase()}`);
      const seen = new Set<string>();
      const rows: Cell[][] = [];
      for (let k = ri(rng, 2, 14); k > 0; k--) {
        const b = pick(rng, bases);
        const cut = ri(rng, 1, b.length - 1);
        let local = chance(rng, 0.5) ? `${b.slice(0, cut)}.${b.slice(cut)}` : b;
        if (chance(rng, 0.2)) local = local.split("").join(".");
        if (chance(rng, 0.35)) local += `+${pick(rng, ["ipl", "bonus", "fc", "x1", "dream.11"])}`;
        const email = `${local}@${chance(rng, 0.8) ? "gmail.com" : pick(rng, ["yahoo.co.in", "outlook.com"])}`;
        if (seen.has(email)) continue;
        seen.add(email);
        rows.push([0, email, dateBetween(rng, "2025-03-01", "2025-03-31")]);
      }
      const ids = shuffle(rng, seq(1, rows.length));
      rows.forEach((r, i) => (r[0] = ids[i]!));
      return { AppUser: rows };
    },
    solution: [
      "WITH g AS (",
      "  SELECT user_id,",
      "         CONCAT(REPLACE(SUBSTRING_INDEX(SUBSTRING_INDEX(email, '@', 1), '+', 1), '.', ''), '@gmail.com') AS canonical_email",
      "  FROM AppUser",
      "  WHERE email LIKE '%@gmail.com'",
      ")",
      "SELECT canonical_email, COUNT(*) AS accounts, MIN(user_id) AS first_user_id",
      "FROM g",
      "GROUP BY canonical_email",
      "HAVING COUNT(*) >= 2",
      "ORDER BY accounts DESC, canonical_email",
    ].join("\n"),
    alternatives: [
      [
        "SELECT canonical_email, COUNT(*) AS accounts, MIN(user_id) AS first_user_id FROM (",
        "  SELECT user_id, CONCAT(REPLACE(IF(LOCATE('+', loc) > 0, LEFT(loc, LOCATE('+', loc) - 1), loc), '.', ''), '@gmail.com') AS canonical_email",
        "  FROM (SELECT user_id, LEFT(email, LOCATE('@', email) - 1) AS loc FROM AppUser WHERE RIGHT(email, 10) = '@gmail.com') a) b",
        "GROUP BY canonical_email HAVING COUNT(*) > 1",
        "ORDER BY accounts DESC, canonical_email",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Work on the part before `@` only; other domains are out of scope.",
      "Cut at the first `+` before removing dots — a tag like `+dream.11` contains a dot of its own.",
      "Once every address is normalised, it is a GROUP BY with HAVING.",
    ],
    editorial: [
      "The problem is mostly string surgery, then an ordinary duplicate search. For each Gmail address, take the local part with `SUBSTRING_INDEX(email, '@', 1)`, drop any tag with `SUBSTRING_INDEX(…, '+', 1)` (everything before the first `+`; the whole string if there is none), remove the dots with `REPLACE(…, '.', '')`, and glue `@gmail.com` back on.",
      "",
      "The order of operations matters: if the dots were removed first, a tag such as `+dream.11` would be altered before being cut off — harmless here, but cutting first is the faithful reading of the rule and keeps each step simple. Other domains are filtered out by `LIKE '%@gmail.com'`, because Outlook and Yahoo treat dots as significant: `dev.nair@outlook.com` and `devnair@outlook.com` are different people.",
      "",
      "With the canonical address computed, `GROUP BY` with `HAVING COUNT(*) >= 2` finds the shared inboxes and `MIN(user_id)` the original account. The alternative extracts the local part with `LEFT`/`LOCATE` and handles the tag with an `IF`. Both are one scan.",
    ].join("\n"),
  },
];

const HARD: SqlProblemSpec[] = [
  {
    slug: "dream11-contest-prizes-with-tied-ranks",
    title: "Dream11: Contest Prizes When Tied Teams Share a Rank",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins", "Aggregation"],
    description: [
      "When a contest ends, Dream11 ranks its teams by points and pays out a prize table. Teams with **equal points share a rank**, and the prizes of all the positions they occupy are pooled and **split equally** among them. For example, if two teams tie for rank 2, they occupy positions 2 and 3 and each receives half of (prize for 2 + prize for 3); the next team is rank 4.",
      "",
      "`PrizeSlab` gives the prize per position for ranges of positions; positions not covered by any slab pay nothing. For every entry that wins **more than 0**, return `contest_id`, `entry_id`, `contest_rank` and `prize_won` (rounded to 2 decimals). Order by `contest_id`, then `contest_rank`, then `entry_id`.",
    ].join("\n"),
    tables: [
      {
        name: "ContestEntry",
        columns: [
          { name: "entry_id", type: "int" },
          { name: "contest_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "points", type: "decimal" },
        ],
        primaryKey: ["entry_id"],
        note: "The final fantasy points of each team in a contest (steps of 0.5).",
      },
      {
        name: "PrizeSlab",
        columns: [
          { name: "contest_id", type: "int" },
          { name: "rank_from", type: "int" },
          { name: "rank_to", type: "int" },
          { name: "prize_per_rank", type: "int" },
        ],
        primaryKey: ["contest_id", "rank_from"],
        note: "Positions `rank_from` to `rank_to` (inclusive) each pay `prize_per_rank` rupees. A contest's slabs never overlap.",
      },
    ],
    examples: [
      {
        ContestEntry: [
          [1, 900, 71, 512.5],
          [2, 900, 72, 480],
          [3, 900, 73, 480],
          [4, 900, 74, 455],
          [5, 900, 75, 455],
          [6, 900, 76, 455],
          [7, 900, 77, 301],
          [8, 901, 71, 390],
          [9, 901, 78, 390],
          [10, 901, 79, 200],
        ],
        PrizeSlab: [
          [900, 1, 1, 10000],
          [900, 2, 3, 4000],
          [900, 4, 5, 1000],
          [901, 1, 1, 500],
        ],
      },
    ],
    gen: (rng) => {
      const contests = seq(900, ri(rng, 1, 3));
      const entries: Cell[][] = [];
      const slabs: Cell[][] = [];
      for (const c of contests) {
        const levels = seq(0, 4).map(() => fp(rng, 150, 600));
        for (let k = ri(rng, 2, 7); k > 0; k--) entries.push([entries.length + 1, c, ri(rng, 71, 90), chance(rng, 0.6) ? pick(rng, levels) : fp(rng, 150, 600)]);
        let pos = 1;
        let prize = pick(rng, [5000, 10000, 2000]);
        for (let s = ri(rng, 1, 3); s > 0; s--) {
          const width = ri(rng, 1, 3);
          slabs.push([c, pos, pos + width - 1, prize]);
          pos += width;
          prize = Math.max(100, Math.floor(prize / pick(rng, [2, 4, 5]) / 100) * 100);
        }
      }
      return { ContestEntry: entries, PrizeSlab: slabs };
    },
    solution: [
      "WITH ranked AS (",
      "  SELECT entry_id, contest_id,",
      "         RANK() OVER (PARTITION BY contest_id ORDER BY points DESC) AS contest_rank,",
      "         COUNT(*) OVER (PARTITION BY contest_id, points) AS tied",
      "  FROM ContestEntry",
      ")",
      "SELECT r.contest_id, r.entry_id, r.contest_rank,",
      "       ROUND(SUM(s.prize_per_rank * (LEAST(s.rank_to, r.contest_rank + r.tied - 1) - GREATEST(s.rank_from, r.contest_rank) + 1)) / r.tied, 2) AS prize_won",
      "FROM ranked r",
      "JOIN PrizeSlab s",
      "  ON s.contest_id = r.contest_id",
      " AND s.rank_from <= r.contest_rank + r.tied - 1",
      " AND s.rank_to >= r.contest_rank",
      "GROUP BY r.contest_id, r.entry_id, r.contest_rank, r.tied",
      "ORDER BY r.contest_id, r.contest_rank, r.entry_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE pos AS (",
        "  SELECT contest_id, rank_from AS n, rank_to, prize_per_rank FROM PrizeSlab",
        "  UNION ALL",
        "  SELECT contest_id, n + 1, rank_to, prize_per_rank FROM pos WHERE n < rank_to",
        "),",
        "ranked AS (",
        "  SELECT e.entry_id, e.contest_id,",
        "         1 + (SELECT COUNT(*) FROM ContestEntry b WHERE b.contest_id = e.contest_id AND b.points > e.points) AS contest_rank,",
        "         (SELECT COUNT(*) FROM ContestEntry t WHERE t.contest_id = e.contest_id AND t.points = e.points) AS tied",
        "  FROM ContestEntry e",
        ")",
        "SELECT r.contest_id, r.entry_id, r.contest_rank, ROUND(SUM(p.prize_per_rank) / r.tied, 2) AS prize_won",
        "FROM ranked r JOIN pos p ON p.contest_id = r.contest_id AND p.n BETWEEN r.contest_rank AND r.contest_rank + r.tied - 1",
        "GROUP BY r.contest_id, r.entry_id, r.contest_rank, r.tied",
        "ORDER BY r.contest_id, r.contest_rank, r.entry_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`RANK()` gives tied teams the same rank and skips the following numbers — exactly the positions rule.",
      "A team of rank r in a tie of size k occupies positions r to r + k − 1; `COUNT(*) OVER (PARTITION BY contest_id, points)` gives k.",
      "For each slab, the positions it pays inside that range are an overlap of two intervals: `LEAST(ends) − GREATEST(starts) + 1`.",
      "Sum the slab money over the occupied positions and divide by k.",
    ],
    editorial: [
      "The payout rule has two ingredients: where each team sits, and which positions its tie occupies. `RANK() OVER (PARTITION BY contest_id ORDER BY points DESC)` gives the shared rank — two teams level on 480 points after the leader are both rank 2 and the next team is rank 4, which is precisely the position numbering the prize table uses. `COUNT(*) OVER (PARTITION BY contest_id, points)` gives the size `k` of the tie, so the group occupies positions `rank` to `rank + k − 1`.",
      "",
      "The prize table is in ranges, so for each slab we need how many of its positions fall inside the tie's range. Two closed intervals overlap when each starts before the other ends — that is the join condition — and the length of the overlap is `LEAST(rank_to, last) − GREATEST(rank_from, rank) + 1`. Multiplying by the per-position prize and summing over the overlapping slabs gives the pooled money; dividing by `k` gives each team's share. Teams whose positions meet no slab have no joined rows and are omitted, which is the \"more than 0\" rule.",
      "",
      "The alternative expands the slabs into one row per position with a recursive CTE, computes ranks and tie sizes with correlated counts, and simply sums the positions in range. Ties are capped at a handful of teams, so a share is never a rounding half. The window version sorts each contest once; the correlated one is quadratic.",
    ].join("\n"),
  },

  {
    slug: "dream11-longest-same-captain-run",
    title: "Dream11: Longest Run of Matches With the Same Captain",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins"],
    description: [
      "Dream11's personalisation team wants to know how loyal users are to a captain. Take each user's saved teams in match order (by the match's `start_time`, then `match_id`); a **run** is a stretch of consecutive teams with the same `captain_id`.",
      "",
      "For every user with at least one team, return `user_id` and `longest_run`, the length of their longest run (a user who changed captain every match has 1). Order by `longest_run` **descending**, then by `user_id`.",
    ].join("\n"),
    tables: [
      {
        name: "FixtureMatch",
        columns: [
          { name: "match_id", type: "int" },
          { name: "fixture", type: "varchar" },
          { name: "start_time", type: "datetime" },
        ],
        primaryKey: ["match_id"],
        note: "Two matches can start at the same time (double-headers on different grounds).",
      },
      {
        name: "UserTeam",
        columns: [
          { name: "team_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "match_id", type: "int" },
          { name: "captain_id", type: "int" },
        ],
        primaryKey: ["team_id"],
        note: "In this extract a user saves at most one team per match. Matches the user skipped do not break a run.",
      },
    ],
    examples: [
      {
        FixtureMatch: [
          [1, "MUM vs CHE", "2025-04-01 19:30:00"],
          [2, "BLR vs KOL", "2025-04-02 19:30:00"],
          [3, "DEL vs HYD", "2025-04-03 15:30:00"],
          [4, "PUN vs RAJ", "2025-04-03 15:30:00"],
          [5, "GUJ vs LKO", "2025-04-04 19:30:00"],
          [6, "MUM vs KOL", "2025-04-05 19:30:00"],
        ],
        UserTeam: [
          [10, 71, 1, 7],
          [11, 71, 2, 7],
          [12, 71, 3, 9],
          [13, 71, 4, 7],
          [14, 71, 5, 7],
          [15, 71, 6, 7],
          [16, 72, 1, 3],
          [17, 72, 3, 3],
          [18, 72, 6, 3],
          [19, 73, 2, 5],
          [20, 73, 5, 8],
        ],
      },
    ],
    gen: (rng) => {
      const nm = ri(rng, 2, 9);
      let t = "2025-04-01 15:30:00";
      const matches: Cell[][] = seq(1, nm).map((id) => {
        if (id > 1 && !chance(rng, 0.2)) t = plusSeconds(t, ri(rng, 1, 3) * 14400);
        return [id, pick(rng, FIXTURES), t];
      });
      shuffle(rng, matches).forEach((m, i) => (m[0] = i + 1));
      const teams: Cell[][] = [];
      for (const u of sample(rng, seq(71, 8), ri(rng, 1, 5))) {
        const pool = sample(rng, seq(1, 9), ri(rng, 1, 3));
        let cap = pick(rng, pool);
        for (const m of seq(1, nm)) {
          if (!chance(rng, 0.7)) continue;
          if (chance(rng, 0.4)) cap = pick(rng, pool);
          teams.push([0, u, m, cap]);
        }
      }
      const ids = shuffle(rng, seq(10, teams.length));
      teams.forEach((r, i) => (r[0] = ids[i]!));
      return { FixtureMatch: matches, UserTeam: teams };
    },
    solution: [
      "WITH ordered_teams AS (",
      "  SELECT t.user_id, t.captain_id,",
      "         ROW_NUMBER() OVER (PARTITION BY t.user_id ORDER BY m.start_time, m.match_id) AS rn_all,",
      "         ROW_NUMBER() OVER (PARTITION BY t.user_id, t.captain_id ORDER BY m.start_time, m.match_id) AS rn_cap",
      "  FROM UserTeam t",
      "  JOIN FixtureMatch m ON m.match_id = t.match_id",
      "),",
      "islands AS (",
      "  SELECT user_id, captain_id, rn_all - rn_cap AS grp FROM ordered_teams",
      "),",
      "runs AS (",
      "  SELECT user_id, captain_id, grp, COUNT(*) AS run_len FROM islands GROUP BY user_id, captain_id, grp",
      ")",
      "SELECT user_id, MAX(run_len) AS longest_run",
      "FROM runs",
      "GROUP BY user_id",
      "ORDER BY longest_run DESC, user_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH prev AS (",
        "  SELECT t.user_id, t.captain_id, m.start_time, m.match_id,",
        "         LAG(t.captain_id) OVER (PARTITION BY t.user_id ORDER BY m.start_time, m.match_id) AS prev_cap",
        "  FROM UserTeam t JOIN FixtureMatch m ON m.match_id = t.match_id",
        "),",
        "marked AS (",
        "  SELECT user_id,",
        "         SUM(CASE WHEN prev_cap = captain_id THEN 0 ELSE 1 END)",
        "           OVER (PARTITION BY user_id ORDER BY start_time, match_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS run_id",
        "  FROM prev",
        ")",
        "SELECT user_id, MAX(n) AS longest_run",
        "FROM (SELECT user_id, run_id, COUNT(*) AS n FROM marked GROUP BY user_id, run_id) r",
        "GROUP BY user_id",
        "ORDER BY longest_run DESC, user_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "This is gaps-and-islands: consecutive rows sharing a value form an island.",
      "Number the user's teams in match order, and separately number them within each captain. Inside a run both numbers rise together, so their difference is constant.",
      "Or: mark each team that starts a new run (captain differs from the previous team's) and take a running sum of the marks as a run id.",
      "Ties in `start_time` are broken by `match_id` — both orderings must use the same key.",
    ],
    editorial: [
      "A run is an **island**: a maximal stretch of consecutive rows, in a given order, that share a value. The classic trick numbers each user's teams twice — `rn_all` over all their teams in match order, `rn_cap` over only the teams with the same captain, in the same order. While the captain stays the same, both counters advance by one per team, so `rn_all − rn_cap` is constant; when the user switches away and later comes back to that captain, `rn_all` has moved on further than `rn_cap`, and the difference jumps. Grouping by `(user, captain, difference)` therefore groups exactly the runs, and `COUNT(*)` is each run's length. (`rn_all` is never smaller than `rn_cap`, so the subtraction never goes negative — worth checking, since MySQL's row numbers are unsigned.)",
      "",
      "The order has to be total and identical in both windows: two matches can start at the same time, so `match_id` breaks the tie. The longest run per user is then a `MAX`.",
      "",
      "The alternative compares each team with the previous one through `LAG`, writes 1 where a new run starts (including the first team, whose `LAG` is NULL), and turns the marks into run ids with a running `SUM`. Both are a couple of sorts per user.",
    ].join("\n"),
  },

  {
    slug: "dream11-top-three-net-winners-per-sport",
    title: "Dream11: Top Three Users by Net Winnings in Each Sport",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins", "Aggregation"],
    description: [
      "For a season-end feature, Dream11's community team wants the most successful players in each sport by **net winnings**: everything a user won in the sport minus every entry fee they paid in it.",
      "",
      "Compute each user's net per sport over all their entries. Rank users within a sport by net, highest first, with **dense ranking** (equal nets share a rank, and the next distinct net takes the next number). Return the users at **rank 3 or better** whose net is **greater than 0**: `sport`, `username`, `net_winnings` and `sport_rank`. Order by `sport`, then `sport_rank`, then `username`.",
    ].join("\n"),
    tables: [
      {
        name: "AppUser",
        columns: [
          { name: "user_id", type: "int" },
          { name: "username", type: "varchar" },
        ],
        primaryKey: ["user_id"],
        note: "Usernames are unique.",
      },
      {
        name: "FixtureMatch",
        columns: [
          { name: "match_id", type: "int" },
          { name: "sport", type: "enum", values: [...SPORTS] },
        ],
        primaryKey: ["match_id"],
        note: "One row per match.",
      },
      {
        name: "Contest",
        columns: [
          { name: "contest_id", type: "int" },
          { name: "match_id", type: "int" },
          { name: "entry_fee", type: "int" },
        ],
        primaryKey: ["contest_id"],
        note: "One row per contest on a match.",
      },
      {
        name: "ContestEntry",
        columns: [
          { name: "entry_id", type: "int" },
          { name: "contest_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "winnings", type: "int" },
        ],
        primaryKey: ["entry_id"],
        note: "One row per team entered; `winnings` is 0 for a team that won nothing.",
      },
    ],
    examples: [
      {
        AppUser: [
          [1, "aarav_21"],
          [2, "diya_07"],
          [3, "kabir_88"],
          [4, "meera_14"],
          [5, "rohan_33"],
        ],
        FixtureMatch: [
          [1, "cricket"],
          [2, "cricket"],
          [3, "kabaddi"],
        ],
        Contest: [
          [10, 1, 50],
          [11, 2, 100],
          [12, 3, 25],
        ],
        ContestEntry: [
          [100, 10, 1, 500],
          [101, 10, 2, 0],
          [102, 11, 2, 400],
          [103, 11, 3, 250],
          [104, 10, 4, 100],
          [105, 11, 4, 200],
          [106, 10, 5, 350],
          [107, 12, 1, 0],
          [108, 12, 3, 125],
          [109, 12, 5, 0],
        ],
      },
    ],
    gen: (rng) => {
      const nu = ri(rng, 2, 7);
      const who = usernames(rng, nu);
      const users: Cell[][] = seq(1, nu).map((id, i) => [id, who[i]!]);
      const nm = ri(rng, 1, 5);
      const matches: Cell[][] = seq(1, nm).map((id) => [id, pick(rng, SPORTS)]);
      const nc = ri(rng, 1, 6);
      const contests: Cell[][] = seq(10, nc).map((id) => [id, ri(rng, 1, nm), pick(rng, [25, 50, 100])]);
      const entries: Cell[][] = seq(100, chance(rng, 0.05) ? 0 : ri(rng, 3, 22)).map((id) => [
        id,
        ri(rng, 10, 9 + nc),
        ri(rng, 1, nu),
        chance(rng, 0.5) ? 0 : pick(rng, [50, 100, 150, 200, 500, 1000]),
      ]);
      return { AppUser: users, FixtureMatch: matches, Contest: contests, ContestEntry: entries };
    },
    solution: [
      "WITH net AS (",
      "  SELECT m.sport, e.user_id, SUM(e.winnings) - SUM(c.entry_fee) AS net_winnings",
      "  FROM ContestEntry e",
      "  JOIN Contest c ON c.contest_id = e.contest_id",
      "  JOIN FixtureMatch m ON m.match_id = c.match_id",
      "  GROUP BY m.sport, e.user_id",
      "),",
      "ranked AS (",
      "  SELECT sport, user_id, net_winnings,",
      "         DENSE_RANK() OVER (PARTITION BY sport ORDER BY net_winnings DESC) AS sport_rank",
      "  FROM net",
      ")",
      "SELECT r.sport, u.username, r.net_winnings, r.sport_rank",
      "FROM ranked r",
      "JOIN AppUser u ON u.user_id = r.user_id",
      "WHERE r.sport_rank <= 3 AND r.net_winnings > 0",
      "ORDER BY r.sport, r.sport_rank, u.username",
    ].join("\n"),
    alternatives: [
      [
        "WITH net AS (",
        "  SELECT m.sport, e.user_id, SUM(e.winnings - c.entry_fee) AS net_winnings",
        "  FROM ContestEntry e JOIN Contest c ON c.contest_id = e.contest_id JOIN FixtureMatch m ON m.match_id = c.match_id",
        "  GROUP BY m.sport, e.user_id",
        ")",
        "SELECT a.sport, u.username, a.net_winnings,",
        "       1 + (SELECT COUNT(DISTINCT b.net_winnings) FROM net b WHERE b.sport = a.sport AND b.net_winnings > a.net_winnings) AS sport_rank",
        "FROM net a JOIN AppUser u ON u.user_id = a.user_id",
        "WHERE a.net_winnings > 0",
        "  AND (SELECT COUNT(DISTINCT b.net_winnings) FROM net b WHERE b.sport = a.sport AND b.net_winnings > a.net_winnings) < 3",
        "ORDER BY a.sport, sport_rank, u.username",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Each entry's fee is on its contest, and the sport is on the contest's match — two joins before anything is summed.",
      "Net per (sport, user) is total winnings minus total fees.",
      "`DENSE_RANK` gives tied nets one rank without leaving a gap.",
      "Rank first, then filter: the rank must be computed over every user of the sport, including those with a loss.",
    ],
    editorial: [
      "The money is spread over three tables: the winnings on the entry, the fee on the contest, the sport on the match. So the first CTE joins them and aggregates per `(sport, user)`, giving `SUM(winnings) − SUM(entry_fee)` — a user who played five contests and won one may well be negative.",
      "",
      "Ranking then happens inside each sport: `DENSE_RANK() OVER (PARTITION BY sport ORDER BY net_winnings DESC)`. Dense ranking is the statement's rule — two users level on the top net are both rank 1 and the next net is rank 2, so \"top three\" can be more than three people but never skips a level. The filter on rank and on a positive net comes **after** ranking, in the outer query; filtering positive nets first would not change who is on top here, but filtering inside the window query would be wrong for any rule that counts everyone. A sport where nobody is up yields no rows.",
      "",
      "The alternative computes the dense rank without a window: one plus the number of *distinct* nets above this one in the same sport. It is quadratic in the number of users per sport; the window function is a sort per sport.",
    ].join("\n"),
  },

  {
    slug: "dream11-contest-winners-from-player-points",
    title: "Dream11: Contest Winners From Player Points With C and VC Boosts",
    difficulty: "HARD",
    topics: ["Joins", "Aggregation", "Window Functions", "Conditional Logic"],
    description: [
      "After a match, Dream11 computes every fantasy team's score from its players' points and declares each contest's winner. A team's score is the sum of its players' points, where the **captain's points count 2×** and the **vice-captain's 1.5×**. A picked player with no row in `PlayerPoints` did not play and scores 0. All contests here are on the same match.",
      "",
      "For every contest, return the entry (or entries, **if tied**) with the highest team score: `contest_id`, `team_id`, `user_id` and `team_points`. Order by `contest_id`, then `team_id`.",
    ].join("\n"),
    tables: [
      {
        name: "PlayerPoints",
        columns: [
          { name: "player_id", type: "int" },
          { name: "points", type: "decimal" },
        ],
        primaryKey: ["player_id"],
        note: "Base fantasy points of each player who played (steps of 0.5, may be negative).",
      },
      {
        name: "UserTeam",
        columns: [
          { name: "team_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "captain_id", type: "int" },
          { name: "vice_captain_id", type: "int" },
        ],
        primaryKey: ["team_id"],
        note: "The captain and vice-captain are two different players of the team's picks.",
      },
      {
        name: "TeamPick",
        columns: [
          { name: "team_id", type: "int" },
          { name: "player_id", type: "int" },
        ],
        primaryKey: ["team_id", "player_id"],
        note: "The players in each team (shortened in this extract).",
      },
      {
        name: "ContestEntry",
        columns: [
          { name: "entry_id", type: "int" },
          { name: "contest_id", type: "int" },
          { name: "team_id", type: "int" },
        ],
        primaryKey: ["entry_id"],
        note: "A team can be entered into several contests, at most once each.",
      },
    ],
    examples: [
      {
        PlayerPoints: [
          [1, 80],
          [2, 42.5],
          [3, 10],
          [4, -2],
          [5, 61],
        ],
        UserTeam: [
          [1, 71, 1, 2],
          [2, 72, 2, 1],
          [3, 73, 5, 1],
          [4, 74, 6, 5],
        ],
        TeamPick: [
          [1, 1], [1, 2], [1, 3],
          [2, 1], [2, 2], [2, 4],
          [3, 1], [3, 5], [3, 3],
          [4, 6], [4, 5], [4, 1],
        ],
        ContestEntry: [
          [100, 900, 1],
          [101, 900, 2],
          [102, 900, 3],
          [103, 901, 2],
          [104, 901, 4],
        ],
      },
    ],
    gen: (rng) => {
      const np = ri(rng, 5, 9);
      const points: Cell[][] = seq(1, np).filter(() => chance(rng, 0.85)).map((p) => [p, chance(rng, 0.3) ? pick(rng, [20, 40, 60]) : fp(rng, -4, 90)]);
      const nt = ri(rng, 1, 6);
      const teams: Cell[][] = [];
      const picks: Cell[][] = [];
      for (const t of seq(1, nt)) {
        const ps = sample(rng, seq(1, np), ri(rng, 3, 4));
        teams.push([t, ri(rng, 71, 90), ps[0]!, ps[1]!]);
        for (const p of ps) picks.push([t, p]);
      }
      const entries: Cell[][] = [];
      for (const c of seq(900, ri(rng, 1, 3))) for (const t of sample(rng, seq(1, nt), ri(rng, 1, nt))) entries.push([100 + entries.length, c, t]);
      return { PlayerPoints: points, UserTeam: teams, TeamPick: picks, ContestEntry: entries };
    },
    solution: [
      "WITH team_score AS (",
      "  SELECT ut.team_id, ut.user_id,",
      "         SUM(COALESCE(pp.points, 0) * CASE WHEN tp.player_id = ut.captain_id THEN 2",
      "                                          WHEN tp.player_id = ut.vice_captain_id THEN 1.5",
      "                                          ELSE 1 END) AS team_points",
      "  FROM UserTeam ut",
      "  JOIN TeamPick tp ON tp.team_id = ut.team_id",
      "  LEFT JOIN PlayerPoints pp ON pp.player_id = tp.player_id",
      "  GROUP BY ut.team_id, ut.user_id",
      "),",
      "ranked AS (",
      "  SELECT e.contest_id, s.team_id, s.user_id, s.team_points,",
      "         RANK() OVER (PARTITION BY e.contest_id ORDER BY s.team_points DESC) AS pos",
      "  FROM ContestEntry e",
      "  JOIN team_score s ON s.team_id = e.team_id",
      ")",
      "SELECT contest_id, team_id, user_id, team_points",
      "FROM ranked",
      "WHERE pos = 1",
      "ORDER BY contest_id, team_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH base AS (",
        "  SELECT tp.team_id, SUM(COALESCE(pp.points, 0)) AS raw_points",
        "  FROM TeamPick tp LEFT JOIN PlayerPoints pp ON pp.player_id = tp.player_id GROUP BY tp.team_id",
        "),",
        "team_score AS (",
        "  SELECT ut.team_id, ut.user_id,",
        "         b.raw_points + COALESCE(c.points, 0) + 0.5 * COALESCE(v.points, 0) AS team_points",
        "  FROM UserTeam ut JOIN base b ON b.team_id = ut.team_id",
        "  LEFT JOIN PlayerPoints c ON c.player_id = ut.captain_id",
        "  LEFT JOIN PlayerPoints v ON v.player_id = ut.vice_captain_id",
        "),",
        "per_contest AS (",
        "  SELECT e.contest_id, s.team_id, s.user_id, s.team_points FROM ContestEntry e JOIN team_score s ON s.team_id = e.team_id",
        ")",
        "SELECT a.contest_id, a.team_id, a.user_id, a.team_points",
        "FROM per_contest a",
        "JOIN (SELECT contest_id, MAX(team_points) AS best FROM per_contest GROUP BY contest_id) m",
        "  ON m.contest_id = a.contest_id AND m.best = a.team_points",
        "ORDER BY a.contest_id, a.team_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Score each team once, then look at contests — a team in two contests has the same score in both.",
      "A `CASE` inside the `SUM` gives each pick its multiplier: 2, 1.5 or 1.",
      "LEFT JOIN the points so a player who did not play contributes 0 instead of removing the pick (and `COALESCE` the NULL).",
      "Keep every team equal to the contest's best score.",
    ],
    editorial: [
      "The score is a property of the team, not of the contest, so it is computed once per team in `team_score` and then attached to each entry. For every pick the multiplier comes from comparing the pick with the team's captain and vice-captain — `CASE WHEN tp.player_id = ut.captain_id THEN 2 WHEN … = vice_captain_id THEN 1.5 ELSE 1 END` — and the weighted points are summed.",
      "",
      "Players who did not play have no `PlayerPoints` row. An inner join would delete those picks, which happens to give the same total, but it would also delete a whole team if none of its players played; the `LEFT JOIN` with `COALESCE(pp.points, 0)` states the rule directly. Negative points are possible and the multiplier applies to them too: a captain on −2 costs 4.",
      "",
      "The winners are the entries whose score equals the contest's maximum, found with `RANK() … = 1` so ties are all kept. The alternative computes the boost differently — the plain sum of all picks plus one extra copy of the captain's points and half a copy of the vice-captain's — and finds the best per contest with a `MAX` join instead of a window. Steps of 0.5 times 1.5 are multiples of 0.25, exact in binary, so equal scores compare as equal.",
    ].join("\n"),
  },

  {
    slug: "dream11-deposit-then-withdraw-without-playing",
    title: "Dream11: Withdrawals Right After a Deposit With No Play Between",
    difficulty: "HARD",
    topics: ["Subqueries", "Dates", "Joins"],
    description: [
      "Money that is deposited and taken straight back out without being used to play is a risk signal (for example, a stolen card being cashed out). Dream11's risk team reviews such withdrawals.",
      "",
      "Flag a withdrawal when the same user made a deposit **at most 48 hours before it** (the deposit at or before `requested_at`, and `requested_at` no later than exactly 48 hours after the deposit), and the user joined **no contest** from that deposit's time through the withdrawal's time, both ends included. If several deposits qualify, the withdrawal is still listed once. Return `withdrawal_id`, `user_id` and `amount` (of the withdrawal), ordered by `withdrawal_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Deposit",
        columns: [
          { name: "deposit_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "deposited_at", type: "datetime" },
        ],
        primaryKey: ["deposit_id"],
        note: "Successful deposits only.",
      },
      {
        name: "Withdrawal",
        columns: [
          { name: "withdrawal_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "requested_at", type: "datetime" },
        ],
        primaryKey: ["withdrawal_id"],
        note: "Every withdrawal request.",
      },
      {
        name: "ContestEntry",
        columns: [
          { name: "entry_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "joined_at", type: "datetime" },
        ],
        primaryKey: ["entry_id"],
        note: "One row per contest entry, with the time it was made.",
      },
    ],
    examples: [
      {
        Deposit: [
          [1, 81, 5000, "2025-07-01 10:00:00"],
          [2, 82, 2000, "2025-07-01 12:00:00"],
          [3, 83, 1000, "2025-07-02 09:00:00"],
          [4, 84, 3000, "2025-07-02 10:00:00"],
          [5, 84, 3000, "2025-07-03 20:00:00"],
          [6, 85, 1500, "2025-07-04 08:00:00"],
        ],
        Withdrawal: [
          [10, 81, 4900, "2025-07-01 16:00:00"],
          [11, 82, 2000, "2025-07-02 10:00:00"],
          [12, 83, 1000, "2025-07-04 09:00:00"],
          [13, 84, 2500, "2025-07-03 22:00:00"],
          [14, 85, 1500, "2025-07-06 08:00:01"],
        ],
        ContestEntry: [
          [20, 82, "2025-07-01 18:30:00"],
          [21, 84, "2025-07-02 11:00:00"],
          [22, 83, "2025-07-01 09:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const users = seq(81, ri(rng, 1, 5));
      const deposits: Cell[][] = [];
      const withdrawals: Cell[][] = [];
      const entries: Cell[][] = [];
      for (const u of users) {
        for (let k = ri(rng, 1, 3); k > 0; k--) deposits.push([deposits.length + 1, u, roundTo(rng, 500, 5000, 500), stamp(rng, "2025-07-01", "2025-07-05")]);
        const mine = deposits.filter((d) => d[1] === u);
        for (let k = ri(rng, 1, 2); k > 0; k--) {
          const base = String(pick(rng, mine)[3]);
          const off = chance(rng, 0.35) ? pick(rng, [0, 172800, 172801, 3600, -60]) : ri(rng, 0, 260000);
          withdrawals.push([10 + withdrawals.length, u, roundTo(rng, 500, 5000, 100), plusSeconds(base, off)]);
        }
        for (let k = ri(rng, 0, 2); k > 0; k--) {
          const base = String(pick(rng, mine)[3]);
          entries.push([20 + entries.length, u, plusSeconds(base, chance(rng, 0.25) ? 0 : ri(rng, -20000, 200000))]);
        }
      }
      return { Deposit: deposits, Withdrawal: withdrawals, ContestEntry: entries };
    },
    solution: [
      "SELECT w.withdrawal_id, w.user_id, w.amount",
      "FROM Withdrawal w",
      "WHERE EXISTS (",
      "  SELECT 1 FROM Deposit d",
      "  WHERE d.user_id = w.user_id",
      "    AND d.deposited_at <= w.requested_at",
      "    AND w.requested_at <= DATE_ADD(d.deposited_at, INTERVAL 48 HOUR)",
      "    AND NOT EXISTS (",
      "      SELECT 1 FROM ContestEntry e",
      "      WHERE e.user_id = w.user_id",
      "        AND e.joined_at BETWEEN d.deposited_at AND w.requested_at",
      "    )",
      ")",
      "ORDER BY w.withdrawal_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT DISTINCT withdrawal_id, user_id, amount FROM (",
        "  SELECT w.withdrawal_id, w.user_id, w.amount, d.deposit_id",
        "  FROM Withdrawal w",
        "  JOIN Deposit d ON d.user_id = w.user_id",
        "   AND TIMESTAMPDIFF(SECOND, d.deposited_at, w.requested_at) BETWEEN 0 AND 172800",
        "  LEFT JOIN ContestEntry e ON e.user_id = w.user_id",
        "   AND e.joined_at >= d.deposited_at AND e.joined_at <= w.requested_at",
        "  GROUP BY w.withdrawal_id, w.user_id, w.amount, d.deposit_id",
        "  HAVING COUNT(e.entry_id) = 0",
        ") x",
        "ORDER BY withdrawal_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The test is per (withdrawal, deposit) pair: does some recent deposit exist with nothing played since?",
      "Nest the two conditions: `EXISTS` a qualifying deposit, and inside it `NOT EXISTS` an entry in the window between that deposit and the withdrawal.",
      "Both window ends are inclusive — exactly 48 hours counts, and an entry at the deposit's own second counts as play.",
    ],
    editorial: [
      "The rule pairs a withdrawal with a deposit and then asks about everything in between, which reads naturally as two nested existence tests. The outer `EXISTS` looks for a deposit of the same user in the 48 hours up to the withdrawal: `d.deposited_at <= w.requested_at AND w.requested_at <= DATE_ADD(d.deposited_at, INTERVAL 48 HOUR)`. The inner `NOT EXISTS` checks that no contest entry of that user falls `BETWEEN d.deposited_at AND w.requested_at`. Because the inner test refers to `d`, it is evaluated per candidate deposit — a user who played after an early deposit but then deposited again and withdrew immediately is still flagged through the later deposit.",
      "",
      "Both boundaries are inclusive by the statement: a withdrawal exactly 48 hours after the deposit qualifies and one second later does not, and an entry at the very second of the deposit counts as play. The outer `EXISTS` makes the withdrawal appear once however many deposits qualify.",
      "",
      "The alternative builds every qualifying (withdrawal, deposit) pair with a join, left-joins the entries inside the window, keeps the pairs with no entry (`HAVING COUNT(e.entry_id) = 0`) and removes duplicate withdrawals with `DISTINCT`. With an index on `user_id` and the time column in each table, both run in a few index range scans per withdrawal.",
    ].join("\n"),
  },

  {
    slug: "dream11-second-contest-activation-by-signup-month",
    title: "Dream11: Second-Paid-Contest Activation Rate by Signup Month",
    difficulty: "HARD",
    topics: ["Subqueries", "Dates", "Aggregation", "Joins"],
    description: [
      "Dream11's growth team calls a new user **activated** when, after their first paid contest, they come back for another paid contest quickly: a user is activated if they have **at least two paid entries** (entry fee above 0) dated **no later than 7 days after** the date of their first paid entry. Two paid entries on the first day count; free contests never count.",
      "",
      "For every signup month (`signup_month` as `'YYYY-MM'` of `signup_date`), return `signup_month`, `signups` (users who signed up that month), `activated` (how many of them are activated) and `activation_pct` (`100 × activated / signups`, rounded to 2 decimals). List every month that has a signup. Order by `signup_month`.",
    ].join("\n"),
    tables: [
      {
        name: "AppUser",
        columns: [
          { name: "user_id", type: "int" },
          { name: "signup_date", type: "date" },
        ],
        primaryKey: ["user_id"],
        note: "One row per account.",
      },
      {
        name: "ContestEntry",
        columns: [
          { name: "entry_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "joined_on", type: "date" },
          { name: "entry_fee", type: "int" },
        ],
        primaryKey: ["entry_id"],
        note: "One row per contest entry; `entry_fee` 0 is a free contest.",
      },
    ],
    examples: [
      {
        AppUser: [
          [1, "2025-01-05"],
          [2, "2025-01-20"],
          [3, "2025-01-28"],
          [4, "2025-02-02"],
          [5, "2025-02-14"],
          [6, "2025-03-01"],
        ],
        ContestEntry: [
          [10, 1, "2025-01-06", 49],
          [11, 1, "2025-01-13", 25],
          [12, 2, "2025-01-21", 0],
          [13, 2, "2025-01-22", 49],
          [14, 2, "2025-01-30", 49],
          [15, 3, "2025-01-29", 25],
          [16, 3, "2025-01-29", 99],
          [17, 4, "2025-02-03", 0],
          [18, 4, "2025-02-04", 0],
          [19, 5, "2025-02-15", 49],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 2, 16);
      const users: Cell[][] = seq(1, n).map((id) => [id, dateBetween(rng, "2025-01-01", "2025-03-31")]);
      const entries: Cell[][] = [];
      for (const [id, signup] of users as [number, string][]) {
        let d = addDays(signup, ri(rng, 0, 3));
        for (let k = ri(rng, 0, 4); k > 0; k--) {
          entries.push([entries.length + 10, id, d, chance(rng, 0.25) ? 0 : pick(rng, [25, 49, 99])]);
          d = addDays(d, chance(rng, 0.3) ? pick(rng, [0, 7, 8]) : ri(rng, 0, 10));
        }
      }
      return { AppUser: users, ContestEntry: entries };
    },
    solution: [
      "WITH first_paid AS (",
      "  SELECT user_id, MIN(joined_on) AS first_day",
      "  FROM ContestEntry",
      "  WHERE entry_fee > 0",
      "  GROUP BY user_id",
      "),",
      "activated AS (",
      "  SELECT f.user_id",
      "  FROM first_paid f",
      "  JOIN ContestEntry e ON e.user_id = f.user_id AND e.entry_fee > 0",
      "   AND e.joined_on <= DATE_ADD(f.first_day, INTERVAL 7 DAY)",
      "  GROUP BY f.user_id",
      "  HAVING COUNT(*) >= 2",
      ")",
      "SELECT DATE_FORMAT(u.signup_date, '%Y-%m') AS signup_month,",
      "       COUNT(*) AS signups,",
      "       COUNT(a.user_id) AS activated,",
      "       ROUND(100 * COUNT(a.user_id) / COUNT(*), 2) AS activation_pct",
      "FROM AppUser u",
      "LEFT JOIN activated a ON a.user_id = u.user_id",
      "GROUP BY signup_month",
      "ORDER BY signup_month",
    ].join("\n"),
    alternatives: [
      [
        "WITH paid AS (",
        "  SELECT user_id, joined_on, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY joined_on, entry_id) AS k",
        "  FROM ContestEntry WHERE entry_fee > 0",
        "),",
        "flags AS (",
        "  SELECT u.user_id, LEFT(u.signup_date, 7) AS signup_month,",
        "         CASE WHEN EXISTS (SELECT 1 FROM paid a JOIN paid b ON b.user_id = a.user_id AND b.k = 2",
        "                           WHERE a.user_id = u.user_id AND a.k = 1 AND DATEDIFF(b.joined_on, a.joined_on) <= 7)",
        "              THEN 1 ELSE 0 END AS is_active",
        "  FROM AppUser u",
        ")",
        "SELECT signup_month, COUNT(*) AS signups, SUM(is_active) AS activated,",
        "       ROUND(100 * SUM(is_active) / COUNT(*), 2) AS activation_pct",
        "FROM flags GROUP BY signup_month ORDER BY signup_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First find each user's first paid date — free entries do not start the clock.",
      "Count the paid entries up to 7 days after that date; two or more means activated (the first one is among them).",
      "Every user must stay in the denominator, so LEFT JOIN the activated set to the users before grouping by month.",
      "Equivalently: is the user's second paid entry, in date order, within 7 days of their first?",
    ],
    editorial: [
      "The metric is a cohort ratio, so the work splits into a per-user flag and a per-month rollup.",
      "",
      "For the flag, `first_paid` takes each user's earliest paid date (`MIN(joined_on)` over entries with a fee — a free contest does not start the clock). Joining back to the paid entries up to `DATE_ADD(first_day, INTERVAL 7 DAY)` collects the first entry itself plus any quick follow-ups; `HAVING COUNT(*) >= 2` keeps the users with at least one more. Two paid entries on the same first day count, and day 7 is inside the window while day 8 is not.",
      "",
      "For the rollup, every user belongs to the denominator whether or not they ever played, so the activated set is LEFT JOINed onto `AppUser` and grouped by the formatted month: `COUNT(*)` counts signups and `COUNT(a.user_id)` counts only matched (activated) users. Grouping by the `signup_month` alias keeps MySQL's ONLY_FULL_GROUP_BY happy. Months hold at most a few dozen signups here, so the rounded percentage never sits on a half.",
      "",
      "The alternative numbers each user's paid entries and tests whether entry 2 is within 7 days of entry 1 — the same condition, since the second-earliest paid entry is in the window exactly when at least two are.",
    ].join("\n"),
  },

  {
    slug: "dream11-biggest-leaderboard-climb",
    title: "Dream11: Biggest Live Leaderboard Climb of Each Team",
    difficulty: "HARD",
    topics: ["Window Functions"],
    description: [
      "During a match, Dream11's live leaderboard re-ranks every team in a contest after each scoring update. The engagement team wants to celebrate dramatic comebacks. At each snapshot a team's **position** is its rank by `points` (highest first; equal points share a position, as in `RANK`). A **climb** is the previous snapshot's position minus the current one.",
      "",
      "For every team that ever climbed, return `team_id`, `best_climb` (its largest climb) and `snapshot_no` (the snapshot where that climb happened — the **earliest** one if several share the largest climb). Teams that never moved up are left out. Order by `best_climb` **descending**, then by `team_id`.",
    ].join("\n"),
    tables: [
      {
        name: "LiveScore",
        columns: [
          { name: "team_id", type: "int" },
          { name: "snapshot_no", type: "int" },
          { name: "points", type: "decimal" },
        ],
        primaryKey: ["team_id", "snapshot_no"],
        note: "A team's total points in one contest after each update. Snapshots are numbered 1, 2, 3, … with no gaps, and every team has a row at every snapshot.",
      },
    ],
    examples: [
      {
        LiveScore: [
          [1, 1, 40], [2, 1, 35], [3, 1, 30], [4, 1, 12],
          [1, 2, 44], [2, 2, 60], [3, 2, 31], [4, 2, 50.5],
          [1, 3, 70], [2, 3, 62], [3, 3, 88], [4, 3, 51],
          [1, 4, 71], [2, 4, 90], [3, 4, 90], [4, 4, 52],
        ],
      },
    ],
    gen: (rng) => {
      const nt = ri(rng, 2, 6);
      const ns = ri(rng, 2, 5);
      const rows: Cell[][] = [];
      const pts = seq(1, nt).map(() => fp(rng, 0, 30));
      for (const s of seq(1, ns)) {
        for (const t of seq(1, nt)) {
          if (s > 1) pts[t - 1] = pts[t - 1]! + (chance(rng, 0.2) ? 0 : fp(rng, 0, 40));
          rows.push([t, s, pts[t - 1]!]);
        }
        if (chance(rng, 0.3) && nt > 1) {
          const [a, b] = sample(rng, seq(0, nt), 2);
          pts[a!] = pts[b!]!;
          rows[rows.length - nt + a!]![2] = pts[a!]!;
        }
      }
      return { LiveScore: rows };
    },
    solution: [
      "WITH positioned AS (",
      "  SELECT team_id, snapshot_no,",
      "         RANK() OVER (PARTITION BY snapshot_no ORDER BY points DESC) AS pos",
      "  FROM LiveScore",
      "),",
      "moves AS (",
      "  SELECT team_id, snapshot_no, pos,",
      "         LAG(pos) OVER (PARTITION BY team_id ORDER BY snapshot_no) AS prev_pos",
      "  FROM positioned",
      "),",
      "climbs AS (",
      "  SELECT team_id, snapshot_no, prev_pos - pos AS climb,",
      "         ROW_NUMBER() OVER (PARTITION BY team_id ORDER BY prev_pos - pos DESC, snapshot_no) AS k",
      "  FROM moves",
      "  WHERE prev_pos > pos",
      ")",
      "SELECT team_id, climb AS best_climb, snapshot_no",
      "FROM climbs",
      "WHERE k = 1",
      "ORDER BY best_climb DESC, team_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH positioned AS (",
        "  SELECT a.team_id, a.snapshot_no,",
        "         1 + (SELECT COUNT(*) FROM LiveScore b WHERE b.snapshot_no = a.snapshot_no AND b.points > a.points) AS pos",
        "  FROM LiveScore a",
        "),",
        "climbs AS (",
        "  SELECT cur.team_id, cur.snapshot_no, prv.pos - cur.pos AS climb",
        "  FROM positioned cur",
        "  JOIN positioned prv ON prv.team_id = cur.team_id AND prv.snapshot_no = cur.snapshot_no - 1",
        "  WHERE prv.pos > cur.pos",
        ")",
        "SELECT c.team_id, c.climb AS best_climb, c.snapshot_no",
        "FROM climbs c",
        "WHERE NOT EXISTS (SELECT 1 FROM climbs d WHERE d.team_id = c.team_id",
        "                    AND (d.climb > c.climb OR (d.climb = c.climb AND d.snapshot_no < c.snapshot_no)))",
        "ORDER BY best_climb DESC, team_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Two windows in sequence: rank teams within each snapshot, then look back along each team's own snapshots.",
      "`LAG(pos)` over a team's snapshots gives its previous position; the climb is previous minus current.",
      "Keep only positive climbs before choosing the best, and break equal climbs by the earlier snapshot.",
      "Subtracting window results can overflow in MySQL when negative — filter `prev_pos > pos` before subtracting.",
    ],
    editorial: [
      "The positions are not stored, so the first step ranks the teams inside every snapshot: `RANK() OVER (PARTITION BY snapshot_no ORDER BY points DESC)`. `RANK` gives level teams the same position, matching how the leaderboard displays a tie.",
      "",
      "The second step changes the partition: now each team's own history matters, so `LAG(pos) OVER (PARTITION BY team_id ORDER BY snapshot_no)` puts the previous position beside the current one. A climb is `prev_pos − pos`. Only real climbs count, so rows with `prev_pos > pos` are kept — which also drops the first snapshot (no previous position) and avoids subtracting into negative numbers, which MySQL refuses for its unsigned ranking results. Finally `ROW_NUMBER()` per team, ordered by climb descending and then snapshot ascending, picks the biggest climb and its earliest occurrence in one deterministic step.",
      "",
      "The alternative ranks with a correlated count (one plus the teams strictly ahead), pairs consecutive snapshots with a self join on `snapshot_no - 1` — valid because snapshots have no gaps — and keeps the climb that no other climb of the team beats under the same ordering, with `NOT EXISTS`. The window version costs a few sorts; the correlated one is quadratic per snapshot.",
    ].join("\n"),
  },
];

export const COMPANY_DREAM11: SqlProblemSpec[] = [...EASY, ...MEDIUM, ...HARD];
