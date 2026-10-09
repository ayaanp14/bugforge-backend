import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, atTime, chance, dateBetween, pick, ri, sample, shuffle } from "./kit.js";

/**
 * Online gaming: the questions a live-ops analyst, a trust-and-safety engineer
 * or a monetisation lead at a multiplayer game studio is asked — players and
 * their ranked tiers, matches and the people in them, win rates, matchmaking
 * queues and how long they wait, cheating reports, in-app purchases and the
 * whales who carry the revenue, battle pass progress, login streaks and
 * retention, guilds, referrals and concurrent sessions. Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);

const pad = (n: number) => String(n).padStart(2, "0");
/** A 'YYYY-MM-DD HH:MM:SS' `secs` seconds after a datetime. */
function addSecs(dt: string, secs: number): string {
  const d = new Date(Date.parse(dt.replace(" ", "T") + "Z") + secs * 1000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

const TAGS = [
  "ShadowFang", "NoScopeNeha", "KingKabir", "PixelPriya", "RushRohan", "LagLord", "ClutchDiya", "SniperSaanvi",
  "TurboTanvi", "GhostArjun", "ViperVikram", "BlazeIra", "FrostDev", "ChaiAndChill", "BotSlayer", "HeadshotHarsh",
  "MidlaneMeera", "CampingKaran", "ZeroPingZara", "DesiDragon", "OneTapAnanya", "LootGoblin", "NightOwlNikhil",
  "ComboKavya", "SpeedySimran", "AceAisha", "RocketRiya", "DriftDavid", "SilentSara", "NovaNoah",
] as const;
const tags = (rng: () => number, n: number): string[] => sample(rng, TAGS, n);

const TIERS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master"] as const;
const REGIONS = ["IN", "SEA", "EU", "NA", "ME"] as const;
const MODES = ["Battle Royale", "Team Deathmatch", "Ranked 5v5", "Capture the Flag"] as const;
const CATEGORIES = ["Skin", "Battle Pass", "Currency Pack", "Emote", "Loot Box"] as const;
const STORE = [
  ["Neon Tiger Skin", "Skin", 799], ["Monsoon Raider Skin", "Skin", 1299], ["Season 12 Pass", "Battle Pass", 449],
  ["Elite Pass Bundle", "Battle Pass", 999], ["600 Gems", "Currency Pack", 499], ["2500 Gems", "Currency Pack", 1799],
  ["Bhangra Emote", "Emote", 149], ["Victory Dab", "Emote", 99], ["Mystic Crate", "Loot Box", 199],
] as const;

export const WORLD_GAMING: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "diamond-and-master-players-gone-quiet",
    title: "Diamond and Master Players Who Went Quiet",
    difficulty: "EASY",
    topics: ["Basics", "Dates"],
    description: [
      "The live-ops team wants to send a comeback reward to high-tier players who have stopped logging in. A player qualifies when their `tier` is **Diamond or Master** and their last login was **before 1 March 2025** (`last_login_at < '2025-03-01'`). A NULL `last_login_at` means no login was recorded since the account migration, and such a player qualifies too.",
      "",
      "Return the columns `player_id` and `gamertag`, **ordered by `player_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "Player",
        columns: [
          { name: "player_id", type: "int" },
          { name: "gamertag", type: "varchar" },
          { name: "region", type: "varchar" },
          { name: "tier", type: "enum", values: [...TIERS] },
          { name: "last_login_at", type: "datetime" },
        ],
        primaryKey: ["player_id"],
        note: "One row per player account. `last_login_at` is NULL when no login was recorded after the migration.",
      },
    ],
    examples: [
      {
        Player: [
          [1, "ShadowFang", "IN", "Diamond", "2025-02-11 21:40:00"],
          [2, "PixelPriya", "SEA", "Master", "2025-03-04 10:15:22"],
          [3, "LagLord", "EU", "Gold", "2024-12-30 08:00:00"],
          [4, "ClutchDiya", "IN", "Master", null],
          [5, "FrostDev", "NA", "Diamond", "2025-03-01 00:00:00"],
          [6, "KingKabir", "IN", "Diamond", "2025-02-28 23:59:59"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 15);
      const who = tags(rng, n);
      const rows = seq(1, n).map((id, i) => {
        let last: string | null;
        if (chance(rng, 0.12)) last = null;
        else if (chance(rng, 0.1)) last = pick(rng, ["2025-03-01 00:00:00", "2025-02-28 23:59:59"]);
        else last = atTime(rng, dateBetween(rng, "2024-12-01", "2025-04-30"));
        const tier = chance(rng, 0.5) ? pick(rng, ["Diamond", "Master"]) : pick(rng, TIERS);
        return [id, who[i]!, pick(rng, REGIONS), tier, last];
      });
      return { Player: shuffle(rng, rows) };
    },
    solution: [
      "SELECT player_id, gamertag",
      "FROM Player",
      "WHERE tier IN ('Diamond', 'Master')",
      "  AND (last_login_at IS NULL OR last_login_at < '2025-03-01')",
      "ORDER BY player_id",
    ].join("\n"),
    alternatives: [
      "SELECT player_id, gamertag FROM Player WHERE (tier = 'Diamond' OR tier = 'Master') AND COALESCE(last_login_at, '1970-01-01 00:00:00') < '2025-03-01' ORDER BY player_id",
      "SELECT player_id, gamertag FROM Player WHERE tier IN ('Diamond', 'Master') AND last_login_at IS NULL UNION ALL SELECT player_id, gamertag FROM Player WHERE tier IN ('Diamond', 'Master') AND DATE(last_login_at) < '2025-03-01' ORDER BY player_id",
    ],
    ordered: true,
    hints: [
      "Two conditions must hold together: the tier, and the login date.",
      "`IN ('Diamond', 'Master')` reads better than two ORs.",
      "A comparison with NULL is never true, so a player with no recorded login needs its own `IS NULL` test.",
      "Watch the parentheses: the OR for the login date must not swallow the tier condition.",
    ],
    editorial: [
      "This is a filter with one trap. The tier condition is a plain `IN` list. The login condition is \"before 1 March 2025\": datetimes are stored in a fixed `YYYY-MM-DD HH:MM:SS` format, so comparing with `'2025-03-01'` keeps everything up to `2025-02-28 23:59:59` and drops a login at exactly midnight on the first, which is not before the date.",
      "",
      "The trap is NULL. `NULL < '2025-03-01'` is unknown, not true, so a player with no recorded login would silently disappear — and the statement says those players qualify. Add `last_login_at IS NULL` with an OR, and wrap the two login tests in parentheses: `AND` binds tighter than `OR`, so without them a Gold player with a NULL login would slip in.",
      "",
      "An alternative replaces the NULL with a date far in the past through `COALESCE`, which turns the two tests into one comparison. A UNION of the two cases works as well. Each is one scan of the table.",
    ].join("\n"),
  },

  {
    slug: "players-who-never-queued-for-ranked",
    title: "Players Who Never Queued for Ranked",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "Every time a player presses Play, the matchmaker writes a `QueueTicket` for the mode they chose. The competitive team wants to invite players who have **never queued for the `Ranked 5v5` mode** to a ranked tutorial. Tickets for other modes do not count, and a cancelled ranked ticket still counts as having queued.",
      "",
      "Return the columns `player_id`, `gamertag` and `signup_date`, **ordered by `signup_date`, then `player_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "Player",
        columns: [
          { name: "player_id", type: "int" },
          { name: "gamertag", type: "varchar" },
          { name: "signup_date", type: "date" },
        ],
        primaryKey: ["player_id"],
        note: "One row per registered player.",
      },
      {
        name: "QueueTicket",
        columns: [
          { name: "ticket_id", type: "int" },
          { name: "player_id", type: "int" },
          { name: "mode", type: "enum", values: [...MODES] },
          { name: "status", type: "enum", values: ["matched", "cancelled", "timed_out"] },
        ],
        primaryKey: ["ticket_id"],
        note: "One row per time a player entered a matchmaking queue. `player_id` is always in `Player`.",
      },
    ],
    examples: [
      {
        Player: [
          [1, "NoScopeNeha", "2024-11-02"],
          [2, "RushRohan", "2024-11-02"],
          [3, "BlazeIra", "2024-12-15"],
          [4, "GhostArjun", "2024-10-20"],
          [5, "AceAisha", "2025-01-08"],
        ],
        QueueTicket: [
          [101, 1, "Ranked 5v5", "matched"],
          [102, 2, "Battle Royale", "matched"],
          [103, 2, "Team Deathmatch", "timed_out"],
          [104, 3, "Ranked 5v5", "cancelled"],
          [105, 1, "Battle Royale", "matched"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const who = tags(rng, n);
      const players = seq(1, n).map((id, i) => [id, who[i]!, dateBetween(rng, "2024-09-01", "2025-02-28")]);
      // Some signup dates repeat, so the player_id tie-break matters.
      if (n > 2 && chance(rng, 0.5)) players[1]![2] = players[0]![2]!;
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 20);
      const rankedRate = pick(rng, [0.2, 0.4, 0.7]);
      const tickets = seq(101, m).map((id) => [
        id,
        ri(rng, 1, n),
        chance(rng, rankedRate) ? "Ranked 5v5" : pick(rng, MODES),
        pick(rng, ["matched", "matched", "cancelled", "timed_out"]),
      ]);
      return { Player: shuffle(rng, players), QueueTicket: tickets };
    },
    solution: [
      "SELECT p.player_id, p.gamertag, p.signup_date",
      "FROM Player p",
      "LEFT JOIN QueueTicket q ON q.player_id = p.player_id AND q.mode = 'Ranked 5v5'",
      "WHERE q.ticket_id IS NULL",
      "ORDER BY p.signup_date, p.player_id",
    ].join("\n"),
    alternatives: [
      "SELECT player_id, gamertag, signup_date FROM Player p WHERE NOT EXISTS (SELECT 1 FROM QueueTicket q WHERE q.player_id = p.player_id AND q.mode = 'Ranked 5v5') ORDER BY signup_date, player_id",
      "SELECT player_id, gamertag, signup_date FROM Player WHERE player_id NOT IN (SELECT player_id FROM QueueTicket WHERE mode = 'Ranked 5v5') ORDER BY signup_date, player_id",
    ],
    ordered: true,
    hints: [
      "The answer is players, so start from `Player` and look for each player's ranked tickets.",
      "A LEFT JOIN keeps players with no matching ticket; the ticket's columns are NULL on those rows.",
      "Where does the `mode = 'Ranked 5v5'` condition go? In WHERE it would undo the LEFT JOIN.",
      "The ticket's status is irrelevant: any ranked ticket means the player queued.",
    ],
    editorial: [
      "This is an anti join with a condition on the inner side. LEFT JOIN `QueueTicket` to `Player` on the player **and** on `mode = 'Ranked 5v5'`: a player with a ranked ticket is matched, and a player with none — including one who only played Battle Royale — comes through once with NULLs in every ticket column. `WHERE q.ticket_id IS NULL` keeps exactly those.",
      "",
      "Putting the mode test in WHERE instead is the classic mistake: the rows of players without any ticket have `q.mode` NULL, the test fails, and the anti join collapses into an inner join that returns nothing useful. The condition about the joined table belongs in ON.",
      "",
      "`NOT EXISTS` with the same two conditions in the subquery says it directly and is what most optimisers do with the LEFT JOIN. `NOT IN` is safe here only because `QueueTicket.player_id` is never NULL. The status column is a distractor: a cancelled ranked ticket still shows the player tried ranked. Sorting by signup date with the id as the tie-break makes the order fixed.",
    ].join("\n"),
  },

  {
    slug: "in-game-store-revenue-by-item-category",
    title: "In-Game Store Revenue by Item Category",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "The monetisation team reviews which kinds of store items earn the money. Only purchases with status `completed` count; `refunded` purchases are returned money and are ignored.",
      "",
      "For each item `category` with at least one completed purchase, return `category`, `purchases` (the number of completed purchases) and `revenue_inr` (the sum of their `amount_inr`). Categories with no completed purchase are left out. Order by **`revenue_inr` descending, then `category` ascending**.",
    ].join("\n"),
    tables: [
      {
        name: "StoreItem",
        columns: [
          { name: "item_id", type: "int" },
          { name: "item_name", type: "varchar" },
          { name: "category", type: "enum", values: [...CATEGORIES] },
        ],
        primaryKey: ["item_id"],
        note: "One row per item sold in the in-game store.",
      },
      {
        name: "Purchase",
        columns: [
          { name: "purchase_id", type: "int" },
          { name: "player_id", type: "int" },
          { name: "item_id", type: "int" },
          { name: "amount_inr", type: "int" },
          { name: "status", type: "enum", values: ["completed", "refunded"] },
        ],
        primaryKey: ["purchase_id"],
        note: "One row per purchase attempt that was charged. `amount_inr` is the price paid, in rupees, after any discount.",
      },
    ],
    examples: [
      {
        StoreItem: [
          [1, "Neon Tiger Skin", "Skin"],
          [2, "Season 12 Pass", "Battle Pass"],
          [3, "600 Gems", "Currency Pack"],
          [4, "Bhangra Emote", "Emote"],
          [5, "Mystic Crate", "Loot Box"],
        ],
        Purchase: [
          [1, 11, 1, 799, "completed"],
          [2, 12, 2, 449, "completed"],
          [3, 13, 2, 449, "completed"],
          [4, 11, 3, 499, "completed"],
          [5, 14, 3, 399, "completed"],
          [6, 15, 4, 149, "refunded"],
          [7, 12, 5, 199, "completed"],
        ],
      },
    ],
    gen: (rng) => {
      const k = ri(rng, 1, STORE.length);
      const items = sample(rng, STORE, k).map((s, i) => [i + 1, s[0], s[1]]);
      const prices = new Map(sample(rng, STORE, STORE.length).map((s) => [s[0] as string, s[2] as number]));
      const m = chance(rng, 0.08) ? 0 : ri(rng, 1, 22);
      const purchases = seq(1, m).map((id) => {
        const it = pick(rng, items);
        const price = prices.get(it[1] as string)!;
        return [id, ri(rng, 10, 40), it[0]!, chance(rng, 0.2) ? price - 100 : price, chance(rng, 0.2) ? "refunded" : "completed"];
      });
      return { StoreItem: items, Purchase: purchases };
    },
    solution: [
      "SELECT i.category, COUNT(*) AS purchases, SUM(p.amount_inr) AS revenue_inr",
      "FROM Purchase p",
      "JOIN StoreItem i ON i.item_id = p.item_id",
      "WHERE p.status = 'completed'",
      "GROUP BY i.category",
      "ORDER BY revenue_inr DESC, i.category",
    ].join("\n"),
    alternatives: [
      [
        "SELECT category, purchases, revenue_inr FROM (",
        "  SELECT i.category,",
        "         SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) AS purchases,",
        "         SUM(CASE WHEN p.status = 'completed' THEN p.amount_inr ELSE 0 END) AS revenue_inr",
        "  FROM StoreItem i JOIN Purchase p ON p.item_id = i.item_id",
        "  GROUP BY i.category",
        ") t WHERE purchases > 0",
        "ORDER BY revenue_inr DESC, category",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The category lives on the item, the money on the purchase — join them on `item_id`.",
      "Drop refunded purchases before grouping, so they add neither to the count nor to the sum.",
      "Group by category; the ordering needs a tie-break for two categories with the same revenue.",
    ],
    editorial: [
      "Join each purchase to its item to learn the category, filter to `status = 'completed'`, then group by category and take `COUNT(*)` and `SUM(amount_inr)`. Because the filter runs before grouping, a category whose only purchases were refunded has no rows left and is absent from the result — exactly what the statement asks for — and a category nobody bought from never appears in the inner join at all.",
      "",
      "Note that the price comes from the purchase, not from a list price: discounts are already applied in `amount_inr`, so the sum is the real revenue.",
      "",
      "An alternative keeps every purchase and counts conditionally with `SUM(CASE WHEN status = 'completed' …)`, then removes categories with a zero count in an outer filter (or a HAVING). It reads every row once either way. The ORDER BY uses the category name as the tie-break so that two categories with equal revenue come out in a fixed order.",
    ].join("\n"),
  },

  {
    slug: "gamertags-breaking-the-naming-policy",
    title: "Gamertags Breaking the Naming Policy",
    difficulty: "EASY",
    topics: ["Strings", "Conditional Logic"],
    description: [
      "Trust and safety enforces three gamertag rules, checked in this order: a gamertag **longer than 14 characters** is `too_long`; one that contains a **space** is `has_space`; one that contains the word `admin` or `official` in any letter case is `impersonation`. A gamertag gets the label of the **first** rule it breaks.",
      "",
      "Return the columns `player_id`, `gamertag` and `violation` for every gamertag that breaks at least one rule, **ordered by `player_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "Player",
        columns: [
          { name: "player_id", type: "int" },
          { name: "gamertag", type: "varchar" },
        ],
        primaryKey: ["player_id"],
        note: "One row per player. Gamertags use plain ASCII letters, digits, spaces and underscores.",
      },
    ],
    examples: [
      {
        Player: [
          [1, "ShadowFang"],
          [2, "TheRealGameAdmin"],
          [3, "Chai And Chill"],
          [4, "OfficialRiya"],
          [5, "SniperSaanvi99"],
          [6, "xX_admin_Xx"],
          [7, "NightOwlNikhil07"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const base = tags(rng, n);
      const rows = seq(1, n).map((id, i) => {
        let t = base[i]!;
        const r = rng();
        if (r < 0.15) t = `${t}${ri(rng, 10, 9999)}`;
        else if (r < 0.28) t = t.replace(/([a-z])([A-Z])/, "$1 $2");
        else if (r < 0.38) t = pick(rng, ["Admin", "ADMIN", "admin", "Official", "OFFICIAL", "official"]) + t.slice(0, ri(rng, 3, 8));
        else if (r < 0.45) t = t.slice(0, 5) + pick(rng, ["_admin", "Official"]);
        else if (r < 0.52) t = (t + "XXXXXXXXXXXXXX").slice(0, 14);
        else if (r < 0.58) t = (t + "XXXXXXXXXXXXXXX").slice(0, 15);
        return [id, t];
      });
      return { Player: shuffle(rng, rows) };
    },
    solution: [
      "SELECT player_id, gamertag,",
      "       CASE",
      "         WHEN CHAR_LENGTH(gamertag) > 14 THEN 'too_long'",
      "         WHEN LOCATE(' ', gamertag) > 0 THEN 'has_space'",
      "         ELSE 'impersonation'",
      "       END AS violation",
      "FROM Player",
      "WHERE CHAR_LENGTH(gamertag) > 14",
      "   OR LOCATE(' ', gamertag) > 0",
      "   OR LOCATE('admin', LOWER(gamertag)) > 0",
      "   OR LOCATE('official', LOWER(gamertag)) > 0",
      "ORDER BY player_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT player_id, gamertag, violation FROM (",
        "  SELECT player_id, gamertag,",
        "         CASE WHEN LENGTH(gamertag) > 14 THEN 'too_long'",
        "              WHEN INSTR(gamertag, ' ') > 0 THEN 'has_space'",
        "              WHEN INSTR(LOWER(gamertag), 'admin') > 0 OR INSTR(LOWER(gamertag), 'official') > 0 THEN 'impersonation'",
        "         END AS violation",
        "  FROM Player",
        ") t WHERE violation IS NOT NULL",
        "ORDER BY player_id",
      ].join("\n"),
      [
        "SELECT player_id, gamertag,",
        "       IF(CHAR_LENGTH(gamertag) > 14, 'too_long', IF(gamertag LIKE '% %', 'has_space', 'impersonation')) AS violation",
        "FROM Player",
        "WHERE CHAR_LENGTH(gamertag) > 14 OR gamertag LIKE '% %' OR LOWER(gamertag) LIKE '%admin%' OR LOWER(gamertag) LIKE '%official%'",
        "ORDER BY player_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "A searched CASE checks its WHEN branches top to bottom and stops at the first true one — the policy's order.",
      "`CHAR_LENGTH` measures the gamertag; `LOCATE` (or `INSTR`, or LIKE) finds a space or a word inside it.",
      "Lower-case the gamertag once before searching for the reserved words, so the letter case never matters.",
      "Rows that break no rule must not appear: filter them out, or compute the label and keep the non-NULL ones.",
    ],
    editorial: [
      "The label is a **searched CASE** whose branches follow the policy in order — length first, then the space, then the reserved words. CASE returns the first branch that holds, which is what \"the first rule it breaks\" means: `TheRealGameAdmin` is 16 characters, so it is `too_long` even though it also contains `admin`.",
      "",
      "Letter case must not decide the impersonation rule, so the gamertag is lower-cased with `LOWER` before searching for `admin` and `official`. `LOCATE(needle, haystack) > 0` (or `INSTR(haystack, needle) > 0`, or `LIKE '%admin%'`) tests for a substring. An underscore is a wildcard inside a LIKE pattern, which is one reason to prefer LOCATE for literal text.",
      "",
      "Players who break nothing must be excluded. Either repeat the rules in WHERE, as the solution does, or compute the CASE without an ELSE in a subquery and keep the rows whose label is not NULL. Both are one scan; the boundary is strict, so a 14-character gamertag is allowed.",
    ].join("\n"),
  },

  {
    slug: "average-completed-match-length-by-mode",
    title: "Average Completed Match Length by Game Mode",
    difficulty: "EASY",
    topics: ["Aggregation", "Basics"],
    description: [
      "Game designers tune each mode's pacing from how long completed matches last. A match with status `abandoned` (every player left, or the server crashed) has no meaningful length and is ignored.",
      "",
      "For each `mode` with at least one completed match, return `mode`, `completed_matches` and `avg_duration_sec` — the average `duration_sec` of its completed matches **rounded to 2 decimal places**. Order by **`avg_duration_sec` descending, then `mode` ascending**.",
    ].join("\n"),
    tables: [
      {
        name: "GameMatch",
        columns: [
          { name: "match_id", type: "int" },
          { name: "mode", type: "enum", values: [...MODES] },
          { name: "map_name", type: "varchar" },
          { name: "status", type: "enum", values: ["completed", "abandoned"] },
          { name: "duration_sec", type: "int" },
        ],
        primaryKey: ["match_id"],
        note: "One row per match the servers hosted. `duration_sec` is the time from the first spawn to the end screen (for abandoned matches, until the server closed it).",
      },
    ],
    examples: [
      {
        GameMatch: [
          [1, "Battle Royale", "Erangel Docks", "completed", 1620],
          [2, "Battle Royale", "Erangel Docks", "completed", 1385],
          [3, "Team Deathmatch", "Old Delhi Bazaar", "completed", 600],
          [4, "Team Deathmatch", "Warehouse 9", "abandoned", 95],
          [5, "Ranked 5v5", "Ascent Fort", "completed", 2310],
          [6, "Team Deathmatch", "Warehouse 9", "completed", 587],
          [7, "Capture the Flag", "Snow Peak", "abandoned", 410],
          [8, "Team Deathmatch", "Old Delhi Bazaar", "completed", 591],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 24);
      const typical: Record<string, number> = { "Battle Royale": 1500, "Team Deathmatch": 600, "Ranked 5v5": 2100, "Capture the Flag": 900 };
      const modes = sample(rng, MODES, ri(rng, 1, 4));
      const rows = seq(1, n).map((id) => {
        const mode = pick(rng, modes);
        const abandoned = chance(rng, 0.2);
        return [id, mode, pick(rng, ["Erangel Docks", "Old Delhi Bazaar", "Warehouse 9", "Ascent Fort", "Snow Peak"]), abandoned ? "abandoned" : "completed",
          abandoned ? ri(rng, 30, 500) : typical[mode]! + ri(rng, -300, 300)];
      });
      return { GameMatch: rows };
    },
    solution: [
      "SELECT mode, COUNT(*) AS completed_matches, ROUND(AVG(duration_sec), 2) AS avg_duration_sec",
      "FROM GameMatch",
      "WHERE status = 'completed'",
      "GROUP BY mode",
      "ORDER BY avg_duration_sec DESC, mode",
    ].join("\n"),
    alternatives: [
      [
        "SELECT mode, completed_matches, ROUND(total / completed_matches, 2) AS avg_duration_sec FROM (",
        "  SELECT mode, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_matches,",
        "         SUM(CASE WHEN status = 'completed' THEN duration_sec ELSE 0 END) AS total",
        "  FROM GameMatch GROUP BY mode",
        ") t WHERE completed_matches > 0",
        "ORDER BY avg_duration_sec DESC, mode",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Remove abandoned matches before you average, or a crashed server would drag a mode's average down.",
      "GROUP BY the mode and use COUNT and AVG on what is left.",
      "Round the average to two places and sort on the rounded value, with the mode name breaking ties.",
    ],
    editorial: [
      "Filter to completed matches, group by mode, and take `COUNT(*)` and `AVG(duration_sec)`. The WHERE clause runs before the grouping, so abandoned matches neither count nor pull the average down, and a mode that only ever had abandoned matches has no rows left and disappears from the answer.",
      "",
      "`AVG` of integers is a fraction; MySQL carries it to four decimal places, so the result is rounded to two with `ROUND(…, 2)` as the statement asks, and the sort uses that rounded value. Two modes with the same average are ordered by name.",
      "",
      "The same numbers come out of conditional aggregation — sum the durations and count the matches with a CASE that only lets completed ones through, then divide — which is handy when you also want the abandoned count in the same row. Either way it is one pass over the table.",
    ].join("\n"),
  },

  {
    slug: "daily-active-players-from-the-login-log",
    title: "Daily Active Players From the Login Log",
    difficulty: "EASY",
    topics: ["Dates", "Aggregation"],
    description: [
      "The game client writes a `LoginEvent` every time a player signs in, and many players sign in several times a day. The live-ops dashboard shows **daily active players**: the number of **distinct** players who logged in on each calendar day.",
      "",
      "Return the columns `login_day` (the date part of `login_at`, as `YYYY-MM-DD`) and `active_players`, one row per day that has at least one login, **ordered by `login_day`**.",
    ].join("\n"),
    tables: [
      {
        name: "LoginEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "player_id", type: "int" },
          { name: "login_at", type: "datetime" },
          { name: "platform", type: "enum", values: ["android", "ios", "pc"] },
        ],
        primaryKey: ["event_id"],
        note: "One row per successful sign-in. Times are server time (IST).",
      },
    ],
    examples: [
      {
        LoginEvent: [
          [1, 7, "2025-04-14 09:12:00", "android"],
          [2, 7, "2025-04-14 21:40:10", "android"],
          [3, 9, "2025-04-14 23:59:59", "pc"],
          [4, 9, "2025-04-15 00:00:05", "pc"],
          [5, 3, "2025-04-15 18:30:00", "ios"],
          [6, 7, "2025-04-15 19:02:44", "ios"],
          [7, 3, "2025-04-17 07:45:00", "android"],
        ],
      },
    ],
    gen: (rng) => {
      const start = dateBetween(rng, "2024-06-01", "2025-06-01");
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      const players = ri(rng, 1, 8);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const day = addDays(start, ri(rng, 0, 5));
        const t = chance(rng, 0.1) ? `${day} ${pick(rng, ["00:00:00", "23:59:59"])}` : atTime(rng, day);
        return [id, ri(rng, 1, players), t, pick(rng, ["android", "ios", "pc"])];
      });
      return { LoginEvent: rows };
    },
    solution: [
      "SELECT DATE(login_at) AS login_day, COUNT(DISTINCT player_id) AS active_players",
      "FROM LoginEvent",
      "GROUP BY DATE(login_at)",
      "ORDER BY login_day",
    ].join("\n"),
    alternatives: [
      "SELECT LEFT(login_at, 10) AS login_day, COUNT(DISTINCT player_id) AS active_players FROM LoginEvent GROUP BY LEFT(login_at, 10) ORDER BY login_day",
      "SELECT login_day, COUNT(*) AS active_players FROM (SELECT DISTINCT DATE_FORMAT(login_at, '%Y-%m-%d') AS login_day, player_id FROM LoginEvent) d GROUP BY login_day ORDER BY login_day",
    ],
    ordered: true,
    hints: [
      "A day is the date part of the timestamp: `DATE(login_at)` drops the time.",
      "Group by that date.",
      "`COUNT(*)` counts sign-ins; the dashboard wants players, so count distinct player ids.",
    ],
    editorial: [
      "Two ideas: bucket each sign-in by its calendar day, and count each player once per bucket. `DATE(login_at)` turns `2025-04-14 23:59:59` into `2025-04-14`, so grouping by it puts every sign-in of a day together — and a sign-in five seconds after midnight lands on the next day, as it should.",
      "",
      "Inside each group `COUNT(DISTINCT player_id)` counts players rather than events, so player 7 signing in twice on the 14th counts once. Days with no sign-ins have no rows and therefore no group; filling them with zeros would need a calendar to join against.",
      "",
      "Because the format is fixed, `LEFT(login_at, 10)` or `DATE_FORMAT(login_at, '%Y-%m-%d')` produce the same key. Another way is to first take the DISTINCT (day, player) pairs and then count rows per day. All of them read the table once and sort the groups.",
    ].join("\n"),
  },

  {
    slug: "battle-pass-progress-labels",
    title: "Battle Pass Progress Labels for Season 12",
    difficulty: "EASY",
    topics: ["Conditional Logic", "Basics"],
    description: [
      "The season 12 battle pass has 100 tiers. The end-of-season email groups players by how far they got: tier **100** is `Completed`, tiers **70–99** are `Final Stretch`, tiers **30–69** are `Midway` and anything below 30 is `Just Started`. Rows of other seasons are ignored.",
      "",
      "For every player with a row for season `S12`, return `player_id`, `current_tier` and `progress`, **ordered by `current_tier` descending, then `player_id` ascending**.",
    ].join("\n"),
    tables: [
      {
        name: "BattlePass",
        columns: [
          { name: "player_id", type: "int" },
          { name: "season", type: "varchar" },
          { name: "current_tier", type: "int" },
          { name: "has_premium", type: "bool" },
        ],
        primaryKey: ["player_id", "season"],
        note: "One row per player per season they opened the battle pass. `current_tier` is 0–100; `has_premium` is 1 for a bought premium track.",
      },
    ],
    examples: [
      {
        BattlePass: [
          [11, "S12", 100, 1],
          [12, "S12", 70, 1],
          [13, "S12", 69, 0],
          [14, "S11", 100, 1],
          [15, "S12", 29, 0],
          [16, "S12", 30, 0],
          [17, "S12", 70, 0],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 16);
      const rows: Cell[][] = [];
      for (const pid of sample(rng, seq(11, 30), n)) {
        const tier = chance(rng, 0.35) ? pick(rng, [0, 29, 30, 69, 70, 99, 100]) : ri(rng, 0, 100);
        if (chance(rng, 0.85)) rows.push([pid, "S12", tier, chance(rng, 0.4) ? 1 : 0]);
        if (chance(rng, 0.4)) rows.push([pid, "S11", ri(rng, 0, 100), chance(rng, 0.4) ? 1 : 0]);
      }
      return { BattlePass: rows };
    },
    solution: [
      "SELECT player_id, current_tier,",
      "       CASE",
      "         WHEN current_tier = 100 THEN 'Completed'",
      "         WHEN current_tier >= 70 THEN 'Final Stretch'",
      "         WHEN current_tier >= 30 THEN 'Midway'",
      "         ELSE 'Just Started'",
      "       END AS progress",
      "FROM BattlePass",
      "WHERE season = 'S12'",
      "ORDER BY current_tier DESC, player_id",
    ].join("\n"),
    alternatives: [
      "SELECT player_id, current_tier, IF(current_tier >= 100, 'Completed', IF(current_tier >= 70, 'Final Stretch', IF(current_tier >= 30, 'Midway', 'Just Started'))) AS progress FROM BattlePass WHERE season = 'S12' ORDER BY current_tier DESC, player_id",
      "SELECT player_id, current_tier, CASE WHEN current_tier BETWEEN 0 AND 29 THEN 'Just Started' WHEN current_tier BETWEEN 30 AND 69 THEN 'Midway' WHEN current_tier BETWEEN 70 AND 99 THEN 'Final Stretch' ELSE 'Completed' END AS progress FROM BattlePass WHERE season = 'S12' ORDER BY current_tier DESC, player_id",
    ],
    ordered: true,
    hints: [
      "Only season `S12` rows matter — filter first.",
      "A searched CASE tests its conditions in order, so after `= 100` a plain `>= 70` already means 70–99.",
      "Check the boundaries: 70 and 30 belong to the higher band, 69 and 29 to the lower one.",
    ],
    editorial: [
      "Filter to `season = 'S12'` and compute the label with a searched CASE. Because CASE stops at the first true branch, the branches can be written from the top band down with only lower bounds: `= 100`, then `>= 70` (which by then can only be 70–99), then `>= 30`, and ELSE for the rest. Writing the bands with explicit BETWEEN ranges is equally correct and does not depend on the order of the branches.",
      "",
      "The boundaries are the part to get right: a player on tier 70 is in the Final Stretch, one on tier 69 is Midway. The example has a row on each side of each boundary.",
      "",
      "Nested `IF` calls give the same result in MySQL. Season 11 rows — including a completed one — are excluded by the WHERE clause. The sort is on the tier, highest first, with the player id deciding ties. It is a single scan.",
    ].join("\n"),
  },

  {
    slug: "players-rated-above-the-average-mmr",
    title: "Players Rated Above the Average MMR",
    difficulty: "EASY",
    topics: ["Subqueries", "Aggregation"],
    description: [
      "Each ranked player has a matchmaking rating (`mmr`). Players still in their placement matches have **no rating yet** (`mmr` NULL) and must not affect the average. The coaching programme invites players whose rating is **strictly above** the average rating of all rated players.",
      "",
      "Return the columns `player_id`, `gamertag` and `mmr`, **ordered by `mmr` descending, then `player_id` ascending**.",
    ].join("\n"),
    tables: [
      {
        name: "Player",
        columns: [
          { name: "player_id", type: "int" },
          { name: "gamertag", type: "varchar" },
          { name: "region", type: "varchar" },
          { name: "mmr", type: "int" },
        ],
        primaryKey: ["player_id"],
        note: "`mmr` is NULL while the player is still in placement matches.",
      },
    ],
    examples: [
      {
        Player: [
          [1, "ViperVikram", "IN", 2400],
          [2, "ComboKavya", "IN", 1800],
          [3, "DriftDavid", "EU", null],
          [4, "TurboTanvi", "SEA", 2100],
          [5, "BotSlayer", "NA", 1500],
          [6, "AceAisha", "IN", 2400],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 14);
      const who = tags(rng, n);
      const rows = seq(1, n).map((id, i) => [id, who[i]!, pick(rng, REGIONS), chance(rng, 0.15) ? null : 100 * ri(rng, 10, 30)]);
      // Now and then everyone rated has the same mmr, so nobody is strictly above.
      if (n > 1 && chance(rng, 0.1)) for (const r of rows) if (r[3] !== null) r[3] = 2000;
      return { Player: rows };
    },
    solution: [
      "SELECT player_id, gamertag, mmr",
      "FROM Player",
      "WHERE mmr > (SELECT AVG(mmr) FROM Player)",
      "ORDER BY mmr DESC, player_id",
    ].join("\n"),
    alternatives: [
      "SELECT p.player_id, p.gamertag, p.mmr FROM Player p CROSS JOIN (SELECT SUM(mmr) / COUNT(mmr) AS avg_mmr FROM Player) a WHERE p.mmr > a.avg_mmr ORDER BY p.mmr DESC, p.player_id",
      "SELECT player_id, gamertag, mmr FROM (SELECT player_id, gamertag, mmr, AVG(mmr) OVER () AS avg_mmr FROM Player) t WHERE mmr > avg_mmr ORDER BY mmr DESC, player_id",
    ],
    ordered: true,
    hints: [
      "Compute the average once, in a scalar subquery, and compare each player with it.",
      "`AVG` skips NULLs on its own, so unrated players do not pull the average down.",
      "An unrated player's comparison is NULL, so the WHERE clause already leaves them out.",
    ],
    editorial: [
      "A **scalar subquery** `(SELECT AVG(mmr) FROM Player)` returns one number, which the outer query compares with each player's rating. Aggregate functions ignore NULLs, so the average is taken over rated players only — exactly what the statement wants; `SUM(mmr) / COUNT(mmr)` is the same thing written out, while `SUM(mmr) / COUNT(*)` would be wrong because it counts the unrated players.",
      "",
      "For a player in placement matches the comparison `NULL > avg` is unknown, so the row is filtered out without an extra condition. The comparison is strict: when every rated player has the same rating, nobody is above the average and the result is empty.",
      "",
      "A window `AVG(mmr) OVER ()` attaches the same average to every row in one pass, after which an outer query filters. The subquery version reads the table twice; both are linear.",
    ].join("\n"),
  },

  // ───────────────────────────── MEDIUM ─────────────────────────────
  {
    slug: "player-win-rates-over-five-matches",
    title: "Player Win Rates With at Least Five Matches",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "Each row of `MatchParticipant` is one player's outcome in one match: `win`, `loss` or `draw`. The esports scouts look at win rates, but only for players with **at least 5 matches** — fewer is noise. A draw counts as a match played but not as a win.",
      "",
      "Return `gamertag`, `matches`, `wins` and `win_rate_pct` = 100 × wins ÷ matches **rounded to 2 decimal places**, for every player with 5 or more matches. Order by **`win_rate_pct` descending, then `gamertag` ascending**.",
    ].join("\n"),
    tables: [
      {
        name: "Player",
        columns: [
          { name: "player_id", type: "int" },
          { name: "gamertag", type: "varchar" },
        ],
        primaryKey: ["player_id"],
        note: "Gamertags are unique.",
      },
      {
        name: "MatchParticipant",
        columns: [
          { name: "match_id", type: "int" },
          { name: "player_id", type: "int" },
          { name: "team", type: "enum", values: ["red", "blue"] },
          { name: "result", type: "enum", values: ["win", "loss", "draw"] },
        ],
        primaryKey: ["match_id", "player_id"],
        note: "One row per player per match they finished.",
      },
    ],
    examples: [
      {
        Player: [
          [1, "HeadshotHarsh"],
          [2, "MidlaneMeera"],
          [3, "CampingKaran"],
          [4, "ZeroPingZara"],
        ],
        MatchParticipant: [
          [501, 1, "red", "win"], [501, 2, "blue", "loss"], [501, 4, "red", "win"],
          [502, 1, "blue", "win"], [502, 2, "red", "loss"], [502, 4, "blue", "win"],
          [503, 1, "red", "draw"], [503, 2, "blue", "draw"], [503, 4, "red", "draw"],
          [504, 1, "red", "loss"], [504, 2, "blue", "win"], [504, 4, "red", "loss"],
          [505, 1, "blue", "win"], [505, 2, "red", "win"], [505, 3, "red", "win"],
          [506, 2, "red", "win"], [506, 4, "blue", "loss"],
          [507, 3, "blue", "win"], [507, 4, "red", "win"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 7);
      const who = tags(rng, n);
      const players = seq(1, n).map((id, i) => [id, who[i]!]);
      const matches = chance(rng, 0.05) ? 0 : ri(rng, 4, 12);
      const rows: Cell[][] = [];
      for (let m = 1; m <= matches; m++) {
        for (const pid of seq(1, n)) {
          if (!chance(rng, 0.7)) continue;
          rows.push([500 + m, pid, pick(rng, ["red", "blue"]), pick(rng, ["win", "win", "loss", "loss", "draw"])]);
        }
      }
      return { Player: players, MatchParticipant: rows };
    },
    solution: [
      "SELECT p.gamertag,",
      "       COUNT(*) AS matches,",
      "       SUM(CASE WHEN mp.result = 'win' THEN 1 ELSE 0 END) AS wins,",
      "       ROUND(100 * SUM(CASE WHEN mp.result = 'win' THEN 1 ELSE 0 END) / COUNT(*), 2) AS win_rate_pct",
      "FROM MatchParticipant mp",
      "JOIN Player p ON p.player_id = mp.player_id",
      "GROUP BY p.player_id, p.gamertag",
      "HAVING COUNT(*) >= 5",
      "ORDER BY win_rate_pct DESC, p.gamertag",
    ].join("\n"),
    alternatives: [
      [
        "SELECT p.gamertag, s.matches, s.wins, ROUND(100 * s.wins / s.matches, 2) AS win_rate_pct",
        "FROM (SELECT player_id, COUNT(*) AS matches, COUNT(CASE WHEN result = 'win' THEN 1 END) AS wins",
        "      FROM MatchParticipant GROUP BY player_id) s",
        "JOIN Player p ON p.player_id = s.player_id",
        "WHERE s.matches >= 5",
        "ORDER BY win_rate_pct DESC, p.gamertag",
      ].join("\n"),
      [
        "SELECT p.gamertag, COUNT(*) AS matches, SUM(IF(mp.result = 'win', 1, 0)) AS wins,",
        "       ROUND(AVG(IF(mp.result = 'win', 100, 0)), 2) AS win_rate_pct",
        "FROM Player p JOIN MatchParticipant mp ON mp.player_id = p.player_id",
        "GROUP BY p.player_id, p.gamertag HAVING COUNT(*) >= 5",
        "ORDER BY win_rate_pct DESC, p.gamertag",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Group the participant rows by player: the row count is the number of matches.",
      "Count wins conditionally — a CASE that yields 1 for a win and 0 otherwise, summed.",
      "The 5-match minimum is a condition on a group, so it belongs in HAVING.",
      "Multiply by 100 before dividing and round the ratio to two places.",
    ],
    editorial: [
      "Group `MatchParticipant` by player; within a group `COUNT(*)` is the matches played and `SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END)` the wins — **conditional aggregation** counts a subset of the rows without a second query. Draws and losses land in the count but add 0 to the wins.",
      "",
      "The minimum of five matches is about the whole group, so it cannot go in WHERE (which sees one row at a time); `HAVING COUNT(*) >= 5` filters groups after they are formed. Join to `Player` for the gamertag and group by both id and gamertag so ONLY_FULL_GROUP_BY is satisfied.",
      "",
      "The rate is `100 * wins / matches`, rounded to two places. Another neat form is `AVG(IF(result = 'win', 100, 0))` — the mean of 100s and 0s is the percentage. Ties on the rate are broken by gamertag. One pass and one sort of the groups.",
    ].join("\n"),
  },

  {
    slug: "top-spender-in-each-region-for-2025",
    title: "Top In-App Spender in Each Region for 2025",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Joins", "Aggregation"],
    description: [
      "Regional community managers want to thank their biggest spender of the year with a custom skin. Only purchases made in calendar year **2025** count. For each `region`, find the player or players whose total 2025 spend is the highest in that region — **if several players tie, return all of them**. Regions where nobody bought anything in 2025 do not appear.",
      "",
      "Return `region`, `gamertag` and `total_spend_inr`, **ordered by `region`, then `gamertag`**.",
    ].join("\n"),
    tables: [
      {
        name: "Player",
        columns: [
          { name: "player_id", type: "int" },
          { name: "gamertag", type: "varchar" },
          { name: "region", type: "varchar" },
        ],
        primaryKey: ["player_id"],
        note: "Gamertags are unique.",
      },
      {
        name: "Purchase",
        columns: [
          { name: "purchase_id", type: "int" },
          { name: "player_id", type: "int" },
          { name: "amount_inr", type: "int" },
          { name: "purchased_on", type: "date" },
        ],
        primaryKey: ["purchase_id"],
        note: "One row per completed in-app purchase.",
      },
    ],
    examples: [
      {
        Player: [
          [1, "DesiDragon", "IN"],
          [2, "OneTapAnanya", "IN"],
          [3, "LootGoblin", "IN"],
          [4, "SilentSara", "EU"],
          [5, "NovaNoah", "EU"],
          [6, "RocketRiya", "SEA"],
        ],
        Purchase: [
          [1, 1, 1799, "2025-01-14"],
          [2, 1, 449, "2025-03-02"],
          [3, 2, 2248, "2025-02-20"],
          [4, 3, 5000, "2024-12-31"],
          [5, 3, 199, "2025-01-01"],
          [6, 4, 999, "2025-05-10"],
          [7, 5, 499, "2025-06-01"],
          [8, 6, 3200, "2024-11-11"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const who = tags(rng, n);
      const regions = sample(rng, REGIONS, ri(rng, 1, 4));
      const players = seq(1, n).map((id, i) => [id, who[i]!, pick(rng, regions)]);
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 20);
      const prices = [99, 149, 199, 449, 499, 999, 1799];
      const rows: Cell[][] = seq(1, m).map((id) => [id, ri(rng, 1, n), pick(rng, prices), dateBetween(rng, "2024-11-01", "2026-01-31")]);
      // Plant a tie: two players of one region each buy the same big bundle in 2025.
      if (n >= 2 && chance(rng, 0.3)) {
        rows.push([m + 1, 1, 9999, "2025-07-07"], [m + 2, 2, 9999, "2025-08-08"]);
        players[1]![2] = players[0]![2]!;
      }
      return { Player: players, Purchase: rows };
    },
    solution: [
      "WITH spend AS (",
      "  SELECT p.region, p.gamertag, SUM(pu.amount_inr) AS total_spend_inr",
      "  FROM Purchase pu",
      "  JOIN Player p ON p.player_id = pu.player_id",
      "  WHERE pu.purchased_on BETWEEN '2025-01-01' AND '2025-12-31'",
      "  GROUP BY p.player_id, p.region, p.gamertag",
      "), ranked AS (",
      "  SELECT region, gamertag, total_spend_inr,",
      "         RANK() OVER (PARTITION BY region ORDER BY total_spend_inr DESC) AS rnk",
      "  FROM spend",
      ")",
      "SELECT region, gamertag, total_spend_inr",
      "FROM ranked",
      "WHERE rnk = 1",
      "ORDER BY region, gamertag",
    ].join("\n"),
    alternatives: [
      [
        "WITH spend AS (",
        "  SELECT p.region, p.gamertag, SUM(pu.amount_inr) AS total_spend_inr",
        "  FROM Purchase pu JOIN Player p ON p.player_id = pu.player_id",
        "  WHERE YEAR(pu.purchased_on) = 2025",
        "  GROUP BY p.player_id, p.region, p.gamertag",
        ")",
        "SELECT s.region, s.gamertag, s.total_spend_inr FROM spend s",
        "WHERE s.total_spend_inr = (SELECT MAX(t.total_spend_inr) FROM spend t WHERE t.region = s.region)",
        "ORDER BY s.region, s.gamertag",
      ].join("\n"),
      [
        "SELECT region, gamertag, total_spend_inr FROM (",
        "  SELECT p.region, p.gamertag, SUM(pu.amount_inr) AS total_spend_inr,",
        "         MAX(SUM(pu.amount_inr)) OVER (PARTITION BY p.region) AS best",
        "  FROM Purchase pu JOIN Player p ON p.player_id = pu.player_id",
        "  WHERE pu.purchased_on >= '2025-01-01' AND pu.purchased_on < '2026-01-01'",
        "  GROUP BY p.player_id, p.region, p.gamertag",
        ") t WHERE total_spend_inr = best",
        "ORDER BY region, gamertag",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First total each player's 2025 purchases — the year filter goes before the sum.",
      "Then rank players within their region by that total, highest first.",
      "Ties must all be returned: which ranking function gives two equal totals the same number 1?",
    ],
    editorial: [
      "Two steps. First aggregate: filter purchases to 2025 (`BETWEEN '2025-01-01' AND '2025-12-31'` on a date column, or `YEAR(purchased_on) = 2025`), join to the player for the region and gamertag, and sum per player. The filter must run before the sum, otherwise a big purchase on 31 December 2024 would crown the wrong player — the example's LootGoblin.",
      "",
      "Then pick the best per region. `RANK() OVER (PARTITION BY region ORDER BY total DESC)` numbers players inside each region and gives equal totals the same rank, so `rnk = 1` returns every tied top spender; `ROW_NUMBER` would silently keep only one of them.",
      "",
      "Without a ranking function, compare each total with the region's maximum through a correlated subquery over the same CTE, or attach `MAX(SUM(...)) OVER (PARTITION BY region)` in the grouped query itself. Regions without 2025 purchases have no rows after the filter, so they never appear. The cost is one aggregation plus a sort per region.",
    ].join("\n"),
  },

  {
    slug: "ranked-queue-wait-time-by-hour-of-day",
    title: "Ranked Queue Wait Time by Hour of Day",
    difficulty: "MEDIUM",
    topics: ["Dates", "Aggregation", "Conditional Logic"],
    description: [
      "The matchmaking team suspects that ranked queues are slow at night. Each `QueueTicket` records when a player entered the queue and, if a match was found, when; `matched_at` is NULL for a ticket that timed out or was cancelled. Only tickets for mode `Ranked 5v5` matter.",
      "",
      "For each hour of the day (`queue_hour`, 0–23, from `queued_at`) that has at least one ranked ticket, return `queue_hour`, `tickets`, `unmatched` (tickets with no match) and `avg_wait_sec` — the average number of seconds from `queued_at` to `matched_at` over the **matched** tickets, **rounded to 2 decimal places**, or NULL when no ticket of that hour was matched. Order by `queue_hour`.",
    ].join("\n"),
    tables: [
      {
        name: "QueueTicket",
        columns: [
          { name: "ticket_id", type: "int" },
          { name: "player_id", type: "int" },
          { name: "mode", type: "enum", values: [...MODES] },
          { name: "queued_at", type: "datetime" },
          { name: "matched_at", type: "datetime" },
        ],
        primaryKey: ["ticket_id"],
        note: "One row per time a player entered a queue. `matched_at` is NULL when no match was found.",
      },
    ],
    examples: [
      {
        QueueTicket: [
          [1, 21, "Ranked 5v5", "2025-05-03 02:10:00", "2025-05-03 02:13:20"],
          [2, 22, "Ranked 5v5", "2025-05-03 02:40:00", null],
          [3, 23, "Ranked 5v5", "2025-05-04 02:05:30", "2025-05-04 02:09:00"],
          [4, 24, "Battle Royale", "2025-05-03 02:11:00", "2025-05-03 02:11:40"],
          [5, 25, "Ranked 5v5", "2025-05-03 20:00:00", "2025-05-03 20:00:45"],
          [6, 21, "Ranked 5v5", "2025-05-03 20:59:59", "2025-05-03 21:00:59"],
          [7, 26, "Ranked 5v5", "2025-05-04 04:20:00", null],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      const hours = sample(rng, seq(0, 24), ri(rng, 1, 5));
      const rows: Cell[][] = seq(1, n).map((id) => {
        const day = dateBetween(rng, "2025-05-01", "2025-05-07");
        const q = `${day} ${pad(pick(rng, hours))}:${pad(ri(rng, 0, 59))}:${pad(ri(rng, 0, 59))}`;
        const matched = chance(rng, 0.7) ? addSecs(q, ri(rng, 5, 600)) : null;
        return [id, ri(rng, 20, 40), chance(rng, 0.75) ? "Ranked 5v5" : pick(rng, MODES), q, matched];
      });
      return { QueueTicket: rows };
    },
    solution: [
      "SELECT HOUR(queued_at) AS queue_hour,",
      "       COUNT(*) AS tickets,",
      "       SUM(CASE WHEN matched_at IS NULL THEN 1 ELSE 0 END) AS unmatched,",
      "       ROUND(AVG(TIMESTAMPDIFF(SECOND, queued_at, matched_at)), 2) AS avg_wait_sec",
      "FROM QueueTicket",
      "WHERE mode = 'Ranked 5v5'",
      "GROUP BY HOUR(queued_at)",
      "ORDER BY queue_hour",
    ].join("\n"),
    alternatives: [
      [
        "SELECT queue_hour, COUNT(*) AS tickets, COUNT(*) - COUNT(matched_at) AS unmatched,",
        "       ROUND(SUM(wait) / NULLIF(COUNT(wait), 0), 2) AS avg_wait_sec",
        "FROM (",
        "  SELECT CAST(SUBSTRING(queued_at, 12, 2) AS SIGNED) AS queue_hour, matched_at,",
        "         CASE WHEN matched_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, queued_at, matched_at) END AS wait",
        "  FROM QueueTicket WHERE mode = 'Ranked 5v5'",
        ") t",
        "GROUP BY queue_hour",
        "ORDER BY queue_hour",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`HOUR(queued_at)` gives the hour of the day; group by it.",
      "`TIMESTAMPDIFF(SECOND, a, b)` is the wait of one ticket — and NULL when `b` is NULL.",
      "AVG skips NULLs, so unmatched tickets drop out of the average on their own while COUNT(*) still counts them.",
      "Count the unmatched ones with a CASE on `matched_at IS NULL`.",
    ],
    editorial: [
      "Bucket the ranked tickets by `HOUR(queued_at)` — the hour of the day, so 02:10 on two different dates falls into the same bucket, which is the point of the question. A ticket queued at 20:59:59 and matched at 21:00:59 belongs to hour 20, because the bucket comes from when it was queued.",
      "",
      "For each ticket, `TIMESTAMPDIFF(SECOND, queued_at, matched_at)` is the wait; for an unmatched ticket it is NULL. That NULL is exactly what we want: `AVG` ignores NULLs, so the average is over matched tickets only, and an hour where nothing matched averages to NULL. `COUNT(*)` still counts every ticket, and `SUM(CASE WHEN matched_at IS NULL THEN 1 ELSE 0 END)` — or `COUNT(*) - COUNT(matched_at)` — counts the unmatched ones.",
      "",
      "The alternative reads the hour from the text with SUBSTRING and divides a sum by `NULLIF(COUNT(wait), 0)`, which also yields NULL for an hour with no matches. One scan and a grouping over at most 24 buckets.",
    ].join("\n"),
  },

  {
    slug: "players-reported-for-cheating-by-three-reporters",
    title: "Players Reported for Cheating by Three Reporters in a Month",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Dates", "Strings"],
    description: [
      "Players can report each other from the end-of-match screen. Reports for `aimbot`, `wallhack` or `speed_hack` are cheating reports; `griefing` is a behaviour report and does not count here. The anti-cheat team reviews a player for a calendar month when **at least 3 different reporters** filed cheating reports against them in that month — one angry player filing five reports is still one reporter.",
      "",
      "Return `reported_player_id`, `report_month` (as `YYYY-MM`) and `distinct_reporters`, **ordered by `report_month`, then `reported_player_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "CheatReport",
        columns: [
          { name: "report_id", type: "int" },
          { name: "reported_player_id", type: "int" },
          { name: "reporter_player_id", type: "int" },
          { name: "reason", type: "enum", values: ["aimbot", "wallhack", "speed_hack", "griefing"] },
          { name: "reported_at", type: "datetime" },
        ],
        primaryKey: ["report_id"],
        note: "One row per report filed. A reporter never reports themselves.",
      },
    ],
    examples: [
      {
        CheatReport: [
          [1, 7, 11, "aimbot", "2025-03-02 22:10:00"],
          [2, 7, 12, "wallhack", "2025-03-15 21:00:00"],
          [3, 7, 13, "aimbot", "2025-03-31 23:59:00"],
          [4, 7, 14, "aimbot", "2025-04-01 00:05:00"],
          [5, 8, 11, "speed_hack", "2025-03-05 18:00:00"],
          [6, 8, 11, "speed_hack", "2025-03-06 18:00:00"],
          [7, 8, 11, "aimbot", "2025-03-07 18:00:00"],
          [8, 8, 15, "griefing", "2025-03-07 19:00:00"],
          [9, 8, 16, "wallhack", "2025-03-08 10:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 28);
      const suspects = sample(rng, seq(1, 9), ri(rng, 1, 3));
      const rows: Cell[][] = seq(1, n).map((id) => {
        const month = pick(rng, ["2025-03", "2025-04"]);
        const day = chance(rng, 0.1) ? pick(rng, ["01", "28"]) : pad(ri(rng, 1, 28));
        return [id, pick(rng, suspects), ri(rng, 11, 17), pick(rng, ["aimbot", "aimbot", "wallhack", "speed_hack", "griefing"]), atTime(rng, `${month}-${day}`)];
      });
      return { CheatReport: rows };
    },
    solution: [
      "SELECT reported_player_id,",
      "       DATE_FORMAT(reported_at, '%Y-%m') AS report_month,",
      "       COUNT(DISTINCT reporter_player_id) AS distinct_reporters",
      "FROM CheatReport",
      "WHERE reason IN ('aimbot', 'wallhack', 'speed_hack')",
      "GROUP BY reported_player_id, DATE_FORMAT(reported_at, '%Y-%m')",
      "HAVING COUNT(DISTINCT reporter_player_id) >= 3",
      "ORDER BY report_month, reported_player_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT reported_player_id, report_month, COUNT(*) AS distinct_reporters",
        "FROM (SELECT DISTINCT reported_player_id, LEFT(reported_at, 7) AS report_month, reporter_player_id",
        "      FROM CheatReport WHERE reason <> 'griefing') d",
        "GROUP BY reported_player_id, report_month",
        "HAVING COUNT(*) >= 3",
        "ORDER BY report_month, reported_player_id",
      ].join("\n"),
      [
        "SELECT reported_player_id, CONCAT(YEAR(reported_at), '-', LPAD(MONTH(reported_at), 2, '0')) AS report_month,",
        "       COUNT(DISTINCT reporter_player_id) AS distinct_reporters",
        "FROM CheatReport WHERE reason <> 'griefing'",
        "GROUP BY reported_player_id, report_month",
        "HAVING COUNT(DISTINCT reporter_player_id) >= 3",
        "ORDER BY report_month, reported_player_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Leave out the griefing reports first.",
      "The month key is the first seven characters of the timestamp — `DATE_FORMAT(reported_at, '%Y-%m')`.",
      "Group by the reported player and the month, and count distinct reporters, not rows.",
      "The threshold is on the group, so it goes in HAVING.",
    ],
    editorial: [
      "Filter to the cheating reasons, then group by the pair (reported player, month). The month is a string key built from the timestamp: `DATE_FORMAT(reported_at, '%Y-%m')`, `LEFT(reported_at, 7)` or a CONCAT of YEAR and a zero-padded MONTH all give `2025-03`. A report at 23:59 on 31 March and one five minutes into April land in different months, so player 7 has three reporters in March and only one in April.",
      "",
      "Within a group `COUNT(DISTINCT reporter_player_id)` counts reporters rather than reports — player 8 got four cheating reports in March, three of them from the same person, so only two reporters count and the griefing report does not count at all. `HAVING` keeps the groups with three or more.",
      "",
      "Taking the DISTINCT triples first and then `COUNT(*)` per group is the same computation in two steps. It is one scan plus a grouping.",
    ].join("\n"),
  },

  {
    slug: "ranked-tier-demotions-between-snapshots",
    title: "Ranked Tier Demotions Between Weekly Snapshots",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Joins"],
    description: [
      "Every week the ranked service stores a snapshot of each active player's tier; a player who did not play that week has no snapshot. The tiers are ordered by `RankTier.tier_order` (Bronze lowest). A **demotion** is a snapshot whose tier is lower than the tier in the **same player's previous snapshot** — however many weeks apart they are.",
      "",
      "Return every demotion with the columns `player_id`, `snapshot_date`, `from_tier` and `to_tier`, **ordered by `player_id`, then `snapshot_date`**.",
    ].join("\n"),
    tables: [
      {
        name: "RankTier",
        columns: [
          { name: "tier_name", type: "varchar" },
          { name: "tier_order", type: "int" },
        ],
        primaryKey: ["tier_name"],
        note: "The ranked ladder: a higher `tier_order` is a higher tier.",
      },
      {
        name: "RankSnapshot",
        columns: [
          { name: "player_id", type: "int" },
          { name: "snapshot_date", type: "date" },
          { name: "tier_name", type: "varchar" },
        ],
        primaryKey: ["player_id", "snapshot_date"],
        note: "One row per player per weekly snapshot they appear in. `tier_name` is always in `RankTier`.",
      },
    ],
    examples: [
      {
        RankTier: [["Bronze", 1], ["Silver", 2], ["Gold", 3], ["Platinum", 4], ["Diamond", 5], ["Master", 6]],
        RankSnapshot: [
          [1, "2025-01-06", "Gold"],
          [1, "2025-01-13", "Platinum"],
          [1, "2025-01-20", "Gold"],
          [1, "2025-02-10", "Silver"],
          [2, "2025-01-06", "Diamond"],
          [2, "2025-01-13", "Diamond"],
          [2, "2025-01-27", "Master"],
          [3, "2025-01-13", "Bronze"],
          [3, "2025-01-20", "Silver"],
        ],
      },
    ],
    gen: (rng) => {
      const tiers = TIERS.map((t, i) => [t, i + 1] as Cell[]);
      const rows: Cell[][] = [];
      for (const pid of sample(rng, seq(1, 8), ri(rng, 1, 5))) {
        let level = ri(rng, 0, 5);
        for (let w = 0; w < 8; w++) {
          if (chance(rng, 0.3)) continue;
          level = Math.max(0, Math.min(5, level + pick(rng, [-2, -1, -1, 0, 0, 1, 1, 2])));
          rows.push([pid, addDays("2025-01-06", 7 * w), TIERS[level]!]);
        }
      }
      return { RankTier: tiers, RankSnapshot: shuffle(rng, rows) };
    },
    solution: [
      "WITH ordered AS (",
      "  SELECT s.player_id, s.snapshot_date, s.tier_name, t.tier_order,",
      "         LAG(s.tier_name) OVER (PARTITION BY s.player_id ORDER BY s.snapshot_date) AS prev_tier,",
      "         LAG(t.tier_order) OVER (PARTITION BY s.player_id ORDER BY s.snapshot_date) AS prev_order",
      "  FROM RankSnapshot s",
      "  JOIN RankTier t ON t.tier_name = s.tier_name",
      ")",
      "SELECT player_id, snapshot_date, prev_tier AS from_tier, tier_name AS to_tier",
      "FROM ordered",
      "WHERE tier_order < prev_order",
      "ORDER BY player_id, snapshot_date",
    ].join("\n"),
    alternatives: [
      [
        "SELECT cur.player_id, cur.snapshot_date, prev.tier_name AS from_tier, cur.tier_name AS to_tier",
        "FROM RankSnapshot cur",
        "JOIN RankSnapshot prev ON prev.player_id = cur.player_id",
        " AND prev.snapshot_date = (SELECT MAX(p.snapshot_date) FROM RankSnapshot p",
        "                           WHERE p.player_id = cur.player_id AND p.snapshot_date < cur.snapshot_date)",
        "JOIN RankTier tc ON tc.tier_name = cur.tier_name",
        "JOIN RankTier tp ON tp.tier_name = prev.tier_name",
        "WHERE tc.tier_order < tp.tier_order",
        "ORDER BY cur.player_id, cur.snapshot_date",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Tier names do not sort in ladder order — join `RankTier` to compare by `tier_order`.",
      "\"The previous snapshot\" is the previous row of the same player in date order: that is `LAG` with `PARTITION BY player_id`.",
      "A player's first snapshot has no previous one; LAG gives NULL there and the comparison drops it.",
    ],
    editorial: [
      "Each snapshot must be compared with the one just before it for the same player. `LAG(...) OVER (PARTITION BY player_id ORDER BY snapshot_date)` fetches the previous row's values within each player's history, so a gap of several weeks without snapshots is skipped naturally — player 1 went from Gold on 20 January straight to Silver on 10 February, which is a demotion even though three weeks passed.",
      "",
      "Tier names cannot be compared as strings (`Gold` < `Silver` alphabetically, but Gold is higher), so join `RankTier` first and carry `tier_order` alongside the name; LAG both. A demotion is `tier_order < prev_order`. On a player's first snapshot `prev_order` is NULL, the comparison is unknown, and the row is dropped. Staying in the same tier is not a demotion.",
      "",
      "Without window functions, find the previous snapshot with a correlated `MAX(snapshot_date) < current` and join to it, then join the ladder twice. That is a lookup per row; the window version sorts each player's snapshots once.",
    ].join("\n"),
  },

  {
    slug: "whale-share-of-monthly-store-revenue",
    title: "Whale Share of Monthly Store Revenue",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation", "Dates"],
    description: [
      "In free-to-play games a handful of **whales** bring in most of the money. A player is a whale **for a month** when their purchases in that calendar month total **at least ₹5,000**. Finance wants to see how dependent each month is on its whales.",
      "",
      "For every month that has at least one purchase, return `purchase_month` (as `YYYY-MM`), `whales` (the number of whale players that month), `whale_revenue_inr` (what they spent that month) and `whale_share_pct` = 100 × whale revenue ÷ the month's total revenue, **rounded to 2 decimal places**. A month without whales shows 0, 0 and 0. Order by `purchase_month`.",
    ].join("\n"),
    tables: [
      {
        name: "Purchase",
        columns: [
          { name: "purchase_id", type: "int" },
          { name: "player_id", type: "int" },
          { name: "amount_inr", type: "int" },
          { name: "purchased_at", type: "datetime" },
        ],
        primaryKey: ["purchase_id"],
        note: "One row per completed in-app purchase; `amount_inr` is always positive.",
      },
    ],
    examples: [
      {
        Purchase: [
          [1, 31, 1799, "2025-01-03 20:15:00"],
          [2, 31, 1799, "2025-01-18 21:40:00"],
          [3, 31, 1799, "2025-01-31 23:10:00"],
          [4, 32, 499, "2025-01-09 12:00:00"],
          [5, 33, 5000, "2025-01-20 09:30:00"],
          [6, 31, 999, "2025-02-01 10:00:00"],
          [7, 32, 449, "2025-02-14 19:00:00"],
          [8, 34, 2500, "2025-03-02 16:45:00"],
          [9, 34, 2499, "2025-03-28 16:45:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 26);
      const prices = [99, 199, 449, 499, 999, 1799, 2500, 2499, 4999];
      const rows: Cell[][] = seq(1, n).map((id) => [
        id, ri(rng, 31, 36), pick(rng, prices),
        atTime(rng, dateBetween(rng, "2025-01-01", pick(rng, ["2025-01-31", "2025-03-31"]))),
      ]);
      if (n > 0 && chance(rng, 0.3)) rows.push([n + 1, 37, 5000, "2025-02-10 11:11:11"]);
      return { Purchase: rows };
    },
    solution: [
      "WITH player_month AS (",
      "  SELECT DATE_FORMAT(purchased_at, '%Y-%m') AS purchase_month, player_id, SUM(amount_inr) AS spent",
      "  FROM Purchase",
      "  GROUP BY DATE_FORMAT(purchased_at, '%Y-%m'), player_id",
      ")",
      "SELECT purchase_month,",
      "       SUM(CASE WHEN spent >= 5000 THEN 1 ELSE 0 END) AS whales,",
      "       SUM(CASE WHEN spent >= 5000 THEN spent ELSE 0 END) AS whale_revenue_inr,",
      "       ROUND(100 * SUM(CASE WHEN spent >= 5000 THEN spent ELSE 0 END) / SUM(spent), 2) AS whale_share_pct",
      "FROM player_month",
      "GROUP BY purchase_month",
      "ORDER BY purchase_month",
    ].join("\n"),
    alternatives: [
      [
        "SELECT m.purchase_month, COALESCE(w.whales, 0) AS whales, COALESCE(w.rev, 0) AS whale_revenue_inr,",
        "       ROUND(100 * COALESCE(w.rev, 0) / m.total, 2) AS whale_share_pct",
        "FROM (SELECT LEFT(purchased_at, 7) AS purchase_month, SUM(amount_inr) AS total FROM Purchase GROUP BY LEFT(purchased_at, 7)) m",
        "LEFT JOIN (",
        "  SELECT purchase_month, COUNT(*) AS whales, SUM(spent) AS rev",
        "  FROM (SELECT LEFT(purchased_at, 7) AS purchase_month, player_id, SUM(amount_inr) AS spent",
        "        FROM Purchase GROUP BY LEFT(purchased_at, 7), player_id HAVING SUM(amount_inr) >= 5000) pm",
        "  GROUP BY purchase_month",
        ") w ON w.purchase_month = m.purchase_month",
        "ORDER BY m.purchase_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Whale status is per player **per month**, so first total each player's spend within each month.",
      "From those per-player monthly totals, a month's revenue is their sum, and the whales are the totals of at least 5,000.",
      "Conditional aggregation over the per-player totals gives the whale count and revenue without a second pass.",
      "Months with no whale must still appear with zeros — think about what an inner join to a whale-only table would do.",
    ],
    editorial: [
      "The question has two levels of grouping. First (player, month): sum each player's purchases within a calendar month, keyed by `DATE_FORMAT(purchased_at, '%Y-%m')`. Player 31 spent three times ₹1,799 in January, ₹5,397 in all, so they are a January whale even though no single purchase was large; player 34's ₹4,999 in March misses the threshold by one rupee.",
      "",
      "Then (month): over the per-player totals, `SUM(spent)` is the month's revenue, and CASE expressions keep only totals ≥ 5,000 for the whale count and whale revenue. The share is `100 * whale / total`, rounded to two places. Because the month's total comes from the same rows, a month without whales simply gets 0 for all three — no special case.",
      "",
      "The alternative builds the month totals and the whale-only totals separately and LEFT JOINs them, with COALESCE turning a missing whale row into 0; an inner join there would wrongly drop February. Both are two aggregations over the table.",
    ].join("\n"),
  },

  {
    slug: "guilds-with-three-active-members-last-week",
    title: "Guilds With Three Active Members in the Last Week",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Dates"],
    description: [
      "Guild wars next season are open only to guilds that are actually playing. The cut-off report runs on **30 June 2025**: a member is **active** if their `last_match_on` falls in the 7 days ending that day — from `2025-06-24` to `2025-06-30` inclusive. A NULL `last_match_on` means the player has never finished a match. A guild qualifies with **at least 3 active members**.",
      "",
      "Return `guild_name`, `members` (all members of the guild) and `active_members`, **ordered by `active_members` descending, then `guild_name`**.",
    ].join("\n"),
    tables: [
      {
        name: "Guild",
        columns: [
          { name: "guild_id", type: "int" },
          { name: "guild_name", type: "varchar" },
        ],
        primaryKey: ["guild_id"],
        note: "Guild names are unique.",
      },
      {
        name: "GuildMember",
        columns: [
          { name: "guild_id", type: "int" },
          { name: "player_id", type: "int" },
          { name: "role", type: "enum", values: ["leader", "officer", "member"] },
        ],
        primaryKey: ["player_id"],
        note: "A player belongs to at most one guild.",
      },
      {
        name: "Player",
        columns: [
          { name: "player_id", type: "int" },
          { name: "gamertag", type: "varchar" },
          { name: "last_match_on", type: "date" },
        ],
        primaryKey: ["player_id"],
        note: "`last_match_on` is the day of the player's latest finished match (never after 30 June 2025), or NULL.",
      },
    ],
    examples: [
      {
        Guild: [[1, "Rajput Raiders"], [2, "Midnight Snipers"], [3, "Chai Squad"]],
        GuildMember: [
          [1, 101, "leader"], [1, 102, "officer"], [1, 103, "member"], [1, 104, "member"],
          [2, 105, "leader"], [2, 106, "member"], [2, 107, "member"],
          [3, 108, "leader"], [3, 109, "member"],
        ],
        Player: [
          [101, "ShadowFang", "2025-06-30"],
          [102, "PixelPriya", "2025-06-24"],
          [103, "LagLord", "2025-06-23"],
          [104, "FrostDev", "2025-06-27"],
          [105, "KingKabir", "2025-06-29"],
          [106, "ClutchDiya", "2025-06-25"],
          [107, "AceAisha", null],
          [108, "BotSlayer", "2025-06-28"],
          [109, "NovaNoah", "2025-06-26"],
        ],
      },
    ],
    gen: (rng) => {
      const guildNames = sample(rng, ["Rajput Raiders", "Midnight Snipers", "Chai Squad", "Deccan Wolves", "Lag Busters", "Garuda Clan"], ri(rng, 1, 4));
      const guilds = guildNames.map((g, i) => [i + 1, g]);
      const n = ri(rng, 4, 24);
      const who = tags(rng, Math.min(n, TAGS.length));
      const players = seq(101, n).map((id, i) => {
        const r = rng();
        const last = r < 0.1 ? null : r < 0.2 ? pick(rng, ["2025-06-24", "2025-06-23", "2025-06-30"]) : dateBetween(rng, "2025-06-19", "2025-06-30");
        return [id, who[i]!, last];
      });
      const members = players.filter(() => chance(rng, 0.85)).map((p) => [pick(rng, guilds)[0]!, p[0]!, pick(rng, ["officer", "member", "member"])]);
      return { Guild: guilds, GuildMember: members, Player: players };
    },
    solution: [
      "SELECT g.guild_name,",
      "       COUNT(*) AS members,",
      "       SUM(CASE WHEN p.last_match_on BETWEEN '2025-06-24' AND '2025-06-30' THEN 1 ELSE 0 END) AS active_members",
      "FROM Guild g",
      "JOIN GuildMember gm ON gm.guild_id = g.guild_id",
      "JOIN Player p ON p.player_id = gm.player_id",
      "GROUP BY g.guild_id, g.guild_name",
      "HAVING SUM(CASE WHEN p.last_match_on BETWEEN '2025-06-24' AND '2025-06-30' THEN 1 ELSE 0 END) >= 3",
      "ORDER BY active_members DESC, g.guild_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT g.guild_name, m.members, m.active_members",
        "FROM Guild g",
        "JOIN (SELECT gm.guild_id, COUNT(*) AS members,",
        "             COUNT(CASE WHEN DATEDIFF('2025-06-30', p.last_match_on) BETWEEN 0 AND 6 THEN 1 END) AS active_members",
        "      FROM GuildMember gm JOIN Player p ON p.player_id = gm.player_id",
        "      GROUP BY gm.guild_id) m ON m.guild_id = g.guild_id",
        "WHERE m.active_members >= 3",
        "ORDER BY m.active_members DESC, g.guild_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Join guild → member → player so each member row carries their last match date.",
      "Count all members with COUNT(*), and the active ones with a CASE inside SUM.",
      "\"The 7 days ending 30 June\" starts on 24 June — check both ends of the window.",
      "The three-member rule is about the group: HAVING.",
    ],
    editorial: [
      "Join the three tables so every membership row has the player's `last_match_on`, then group by guild. `COUNT(*)` is the guild size; `SUM(CASE WHEN last_match_on BETWEEN '2025-06-24' AND '2025-06-30' THEN 1 ELSE 0 END)` counts the active members in the same pass — conditional aggregation.",
      "",
      "The window is seven days *including* the report day, so it begins on the 24th: LagLord's match on the 23rd is one day too old. `DATEDIFF('2025-06-30', last_match_on) BETWEEN 0 AND 6` is the same test written as an age. A NULL date fails both forms, so a member who never played counts towards `members` but not towards `active_members`.",
      "",
      "Filtering inactive players in WHERE would be wrong here: it would also shrink `members`. The threshold is on the aggregate, so it goes in HAVING (or in an outer WHERE over a grouped subquery, as the alternative does). One join and one grouping.",
    ].join("\n"),
  },

  {
    slug: "email-domains-behind-unverified-signups",
    title: "Email Domains Behind Unverified Sign-ups",
    difficulty: "MEDIUM",
    topics: ["Strings", "Aggregation"],
    description: [
      "Bot farms create accounts in bulk to farm the new-player rewards and never verify their email. Trust and safety wants the email **domains** (everything after the `@`) that have **at least 2 unverified accounts**. Accounts that signed up with a phone number have `email` NULL and are ignored; verified accounts do not count.",
      "",
      "Return `email_domain` and `unverified_accounts`, **ordered by `unverified_accounts` descending, then `email_domain` ascending**. Emails are stored in lower case.",
    ].join("\n"),
    tables: [
      {
        name: "Account",
        columns: [
          { name: "player_id", type: "int" },
          { name: "email", type: "varchar" },
          { name: "email_verified", type: "bool" },
          { name: "created_on", type: "date" },
        ],
        primaryKey: ["player_id"],
        note: "`email` is NULL for a phone sign-up; when present it contains exactly one `@`. `email_verified` is 1 once the player clicked the link.",
      },
    ],
    examples: [
      {
        Account: [
          [1, "neha.gamer@gmail.com", 1, "2025-02-01"],
          [2, "x9k2@tempmail.dev", 0, "2025-02-01"],
          [3, "q81z@tempmail.dev", 0, "2025-02-01"],
          [4, "p0p0@tempmail.dev", 0, "2025-02-02"],
          [5, "rohan99@gmail.com", 0, "2025-02-03"],
          [6, null, 0, "2025-02-03"],
          [7, "bot77@mailbox.in", 0, "2025-02-03"],
          [8, "bot78@mailbox.in", 0, "2025-02-03"],
          [9, "kavya@outlook.com", 0, "2025-02-04"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 2, 24);
      const domains = sample(rng, ["gmail.com", "tempmail.dev", "mailbox.in", "outlook.com", "yahoo.co.in", "throwaway.io", "rediffmail.com"], ri(rng, 2, 5));
      const rows: Cell[][] = seq(1, n).map((id) => {
        const email = chance(rng, 0.1) ? null : `${pick(rng, ["bot", "user", "gamer", "pro", "x"])}${ri(rng, 1, 999)}.${id}@${pick(rng, domains)}`;
        return [id, email, chance(rng, 0.35) ? 1 : 0, dateBetween(rng, "2025-02-01", "2025-02-10")];
      });
      return { Account: rows };
    },
    solution: [
      "SELECT SUBSTRING_INDEX(email, '@', -1) AS email_domain, COUNT(*) AS unverified_accounts",
      "FROM Account",
      "WHERE email IS NOT NULL AND email_verified = 0",
      "GROUP BY SUBSTRING_INDEX(email, '@', -1)",
      "HAVING COUNT(*) >= 2",
      "ORDER BY unverified_accounts DESC, email_domain",
    ].join("\n"),
    alternatives: [
      "SELECT SUBSTRING(email, LOCATE('@', email) + 1) AS email_domain, COUNT(*) AS unverified_accounts FROM Account WHERE email_verified = 0 AND email LIKE '%@%' GROUP BY SUBSTRING(email, LOCATE('@', email) + 1) HAVING COUNT(*) >= 2 ORDER BY unverified_accounts DESC, email_domain",
      "SELECT email_domain, COUNT(*) AS unverified_accounts FROM (SELECT RIGHT(email, CHAR_LENGTH(email) - INSTR(email, '@')) AS email_domain FROM Account WHERE email IS NOT NULL AND email_verified <> 1) d GROUP BY email_domain HAVING COUNT(*) > 1 ORDER BY unverified_accounts DESC, email_domain",
    ],
    ordered: true,
    hints: [
      "Keep only unverified accounts that have an email.",
      "`SUBSTRING_INDEX(email, '@', -1)` returns everything after the last `@` — the domain.",
      "Group by that expression and keep the groups with two or more rows.",
    ],
    editorial: [
      "Extract the domain, then group. `SUBSTRING_INDEX(email, '@', -1)` returns the part of the string after the last `@`; since every email has exactly one, that is the domain. `SUBSTRING(email, LOCATE('@', email) + 1)` and `RIGHT(email, CHAR_LENGTH(email) - INSTR(email, '@'))` compute the same thing from the position of the `@`.",
      "",
      "Filter before grouping: only unverified rows (`email_verified = 0`) with a non-NULL email. A phone sign-up has no domain and would otherwise form a NULL group. Then group by the extracted domain and keep the groups with `COUNT(*) >= 2` in HAVING — a single unverified Gmail account is a normal player who forgot to click a link, not a farm.",
      "",
      "The sort puts the busiest domain first, with the name breaking ties. The work is one scan plus string functions per row; in production you would store the domain in its own indexed column.",
    ].join("\n"),
  },

  {
    slug: "guild-members-above-their-guild-average",
    title: "Guild Members Above Their Guild's Average Points",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Window Functions"],
    description: [
      "Each guild member earns season points from wins and events. Guild leaders want to shortlist their stronger players for the guild-war roster: members whose `season_points` are **strictly greater than the average of their own guild**. A guild with one member, or one where everyone has the same points, has nobody above its average.",
      "",
      "Return `guild_id`, `gamertag` and `season_points`, **ordered by `guild_id`, then `season_points` descending, then `gamertag`**.",
    ].join("\n"),
    tables: [
      {
        name: "GuildMember",
        columns: [
          { name: "player_id", type: "int" },
          { name: "guild_id", type: "int" },
          { name: "gamertag", type: "varchar" },
          { name: "season_points", type: "int" },
        ],
        primaryKey: ["player_id"],
        note: "One row per player in a guild; a player is in at most one guild. Gamertags are unique.",
      },
    ],
    examples: [
      {
        GuildMember: [
          [1, 10, "ShadowFang", 1200],
          [2, 10, "PixelPriya", 800],
          [3, 10, "LagLord", 700],
          [4, 10, "FrostDev", 1200],
          [5, 20, "KingKabir", 500],
          [6, 20, "ClutchDiya", 500],
          [7, 30, "AceAisha", 950],
          [8, 40, "BotSlayer", 300],
          [9, 40, "NovaNoah", 301],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 18);
      const who = tags(rng, n);
      const guilds = sample(rng, [10, 20, 30, 40, 50], ri(rng, 1, 4));
      const rows = seq(1, n).map((id, i) => [id, pick(rng, guilds), who[i]!, 50 * ri(rng, 4, 30)]);
      if (n > 2 && chance(rng, 0.25)) { rows[1]![1] = rows[0]![1]!; rows[1]![3] = rows[0]![3]!; }
      return { GuildMember: rows };
    },
    solution: [
      "SELECT g.guild_id, g.gamertag, g.season_points",
      "FROM GuildMember g",
      "WHERE g.season_points > (SELECT AVG(o.season_points) FROM GuildMember o WHERE o.guild_id = g.guild_id)",
      "ORDER BY g.guild_id, g.season_points DESC, g.gamertag",
    ].join("\n"),
    alternatives: [
      "SELECT g.guild_id, g.gamertag, g.season_points FROM GuildMember g JOIN (SELECT guild_id, AVG(season_points) AS avg_points FROM GuildMember GROUP BY guild_id) a ON a.guild_id = g.guild_id WHERE g.season_points > a.avg_points ORDER BY g.guild_id, g.season_points DESC, g.gamertag",
      "SELECT guild_id, gamertag, season_points FROM (SELECT guild_id, gamertag, season_points, AVG(season_points) OVER (PARTITION BY guild_id) AS avg_points FROM GuildMember) t WHERE season_points > avg_points ORDER BY guild_id, season_points DESC, gamertag",
    ],
    ordered: true,
    hints: [
      "The average changes from guild to guild, so a single global average will not do.",
      "A correlated subquery can compute the average of the guild of the row being tested.",
      "Equivalently, compute every guild's average once (GROUP BY or a window) and compare.",
    ],
    editorial: [
      "Each member is compared with a number that depends on their own group — the classic **correlated subquery**: `(SELECT AVG(season_points) FROM GuildMember o WHERE o.guild_id = g.guild_id)` is re-evaluated for each outer row with that row's guild. Keep the rows where the points are strictly greater.",
      "",
      "The edge cases follow from the arithmetic: a guild with one member has an average equal to that member's points, and a guild where everyone ties has an average equal to each of them, so the strict comparison returns nobody for either. Guild 40's 301 against an average of 300.5 is above, so NovaNoah is in.",
      "",
      "Computing the averages once in a grouped derived table and joining, or attaching `AVG(season_points) OVER (PARTITION BY guild_id)` to every row, avoids re-running the subquery per row — most engines decorrelate the subquery into the join anyway. All three are linear after one grouping.",
    ].join("\n"),
  },

  {
    slug: "first-store-purchase-after-signup",
    title: "Each Player's First Store Purchase After Sign-up",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates", "Joins"],
    description: [
      "The monetisation team studies conversion: what does a new player buy first, and how long after signing up? For every player who has made at least one purchase, take their **earliest** purchase by `purchased_at`; if two purchases share the same timestamp, the one with the **smaller `purchase_id`** is first.",
      "",
      "Return `gamertag`, `first_item` and `days_to_first_purchase` (whole days from `signup_date` to the date of that purchase; 0 for the same day), **ordered by `days_to_first_purchase`, then `gamertag`**.",
    ].join("\n"),
    tables: [
      {
        name: "Player",
        columns: [
          { name: "player_id", type: "int" },
          { name: "gamertag", type: "varchar" },
          { name: "signup_date", type: "date" },
        ],
        primaryKey: ["player_id"],
        note: "Gamertags are unique.",
      },
      {
        name: "Purchase",
        columns: [
          { name: "purchase_id", type: "int" },
          { name: "player_id", type: "int" },
          { name: "item_name", type: "varchar" },
          { name: "amount_inr", type: "int" },
          { name: "purchased_at", type: "datetime" },
        ],
        primaryKey: ["purchase_id"],
        note: "One row per completed purchase, never before the player's signup date.",
      },
    ],
    examples: [
      {
        Player: [
          [1, "TurboTanvi", "2025-01-10"],
          [2, "DesiDragon", "2025-01-12"],
          [3, "GhostArjun", "2025-01-12"],
          [4, "SpeedySimran", "2025-01-15"],
        ],
        Purchase: [
          [11, 1, "600 Gems", 499, "2025-01-14 20:00:00"],
          [12, 1, "Neon Tiger Skin", 799, "2025-01-11 22:30:00"],
          [13, 2, "Season 12 Pass", 449, "2025-01-12 23:50:00"],
          [14, 2, "Victory Dab", 99, "2025-01-12 23:50:00"],
          [15, 3, "Mystic Crate", 199, "2025-02-01 08:00:00"],
          [16, 2, "2500 Gems", 1799, "2025-01-20 12:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const who = tags(rng, n);
      const players = seq(1, n).map((id, i) => [id, who[i]!, dateBetween(rng, "2025-01-01", "2025-01-31")]);
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 20);
      const rows: Cell[][] = [];
      for (let k = 0; k < m; k++) {
        const p = pick(rng, players);
        const [item, , price] = pick(rng, STORE);
        rows.push([100 + k, p[0]!, item, price, atTime(rng, addDays(p[2] as string, chance(rng, 0.25) ? 0 : ri(rng, 1, 40)))]);
      }
      // A same-second double purchase now and then: the purchase_id decides.
      if (rows.length && chance(rng, 0.3)) {
        const r = rows[0]!;
        rows.push([99, r[1]!, "Victory Dab", 99, r[4]!]);
      }
      return { Player: players, Purchase: shuffle(rng, rows) };
    },
    solution: [
      "WITH ranked AS (",
      "  SELECT pu.player_id, pu.item_name, pu.purchased_at,",
      "         ROW_NUMBER() OVER (PARTITION BY pu.player_id ORDER BY pu.purchased_at, pu.purchase_id) AS rn",
      "  FROM Purchase pu",
      ")",
      "SELECT p.gamertag, r.item_name AS first_item,",
      "       DATEDIFF(r.purchased_at, p.signup_date) AS days_to_first_purchase",
      "FROM ranked r",
      "JOIN Player p ON p.player_id = r.player_id",
      "WHERE r.rn = 1",
      "ORDER BY days_to_first_purchase, p.gamertag",
    ].join("\n"),
    alternatives: [
      [
        "SELECT p.gamertag, pu.item_name AS first_item, DATEDIFF(DATE(pu.purchased_at), p.signup_date) AS days_to_first_purchase",
        "FROM Purchase pu JOIN Player p ON p.player_id = pu.player_id",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM Purchase e WHERE e.player_id = pu.player_id",
        "    AND (e.purchased_at < pu.purchased_at OR (e.purchased_at = pu.purchased_at AND e.purchase_id < pu.purchase_id))",
        ")",
        "ORDER BY days_to_first_purchase, p.gamertag",
      ].join("\n"),
      [
        "SELECT p.gamertag, pu.item_name AS first_item, DATEDIFF(pu.purchased_at, p.signup_date) AS days_to_first_purchase",
        "FROM Purchase pu JOIN Player p ON p.player_id = pu.player_id",
        "WHERE pu.purchase_id = (SELECT e.purchase_id FROM Purchase e WHERE e.player_id = pu.player_id ORDER BY e.purchased_at, e.purchase_id LIMIT 1)",
        "ORDER BY days_to_first_purchase, p.gamertag",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Number each player's purchases in time order with ROW_NUMBER and keep number 1.",
      "Put `purchase_id` second in the window's ORDER BY so two purchases in the same second are ordered.",
      "`DATEDIFF(later, earlier)` counts whole calendar days and ignores the time of day.",
      "Players who never bought anything should not appear — start from the purchases.",
    ],
    editorial: [
      "\"The first row per group\" is a job for `ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY purchased_at, purchase_id)`: within each player's purchases the earliest gets 1, and the second sort key settles two purchases in the same second (DesiDragon's pass and emote at 23:50) in favour of the smaller id. Unlike RANK, ROW_NUMBER never gives two rows the number 1, so exactly one purchase per player survives `rn = 1`.",
      "",
      "Join to `Player` for the gamertag and signup date. `DATEDIFF(purchased_at, signup_date)` compares only the date parts, so a purchase at 23:50 on the signup day is 0 days, and TurboTanvi's skin bought the day after signing up is 1 — even though her gems were bought later and listed first.",
      "",
      "The same row can be found without windows: keep a purchase when no other purchase of that player is earlier (NOT EXISTS, with the id tie-break written out), or when its id is the first of the player's purchases sorted the same way (a correlated LIMIT 1). Those do a lookup per purchase; the window sorts once.",
    ].join("\n"),
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "longest-daily-login-streak-per-player",
    title: "Longest Daily Login Streak per Player",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "The login-reward calendar pays out for consecutive days played. A player's **streak** is a run of consecutive calendar days on each of which they logged in at least once; several logins on one day count as one day, and a single missed day ends the streak.",
      "",
      "For every player with at least one login, return `player_id` and `longest_streak_days` — the length of their longest streak. Order by **`longest_streak_days` descending, then `player_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "LoginEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "player_id", type: "int" },
          { name: "login_at", type: "datetime" },
        ],
        primaryKey: ["event_id"],
        note: "One row per successful sign-in (IST).",
      },
    ],
    examples: [
      {
        LoginEvent: [
          [1, 5, "2025-03-01 10:00:00"],
          [2, 5, "2025-03-02 23:59:00"],
          [3, 5, "2025-03-03 00:01:00"],
          [4, 5, "2025-03-03 21:00:00"],
          [5, 5, "2025-03-05 08:00:00"],
          [6, 6, "2025-02-27 19:00:00"],
          [7, 6, "2025-02-28 19:00:00"],
          [8, 6, "2025-03-01 19:00:00"],
          [9, 6, "2025-03-02 19:00:00"],
          [10, 7, "2025-03-04 12:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      const start = dateBetween(rng, "2024-12-20", "2025-03-01");
      for (const pid of sample(rng, seq(1, 9), chance(rng, 0.05) ? 0 : ri(rng, 1, 5))) {
        const rate = pick(rng, [0.5, 0.7, 0.9]);
        for (let d = 0; d < 14 && id <= 30; d++) {
          if (!chance(rng, rate)) continue;
          const day = addDays(start, d);
          rows.push([id++, pid, atTime(rng, day)]);
          if (chance(rng, 0.2) && id <= 30) rows.push([id++, pid, atTime(rng, day)]);
        }
      }
      return { LoginEvent: shuffle(rng, rows) };
    },
    solution: [
      "WITH days AS (",
      "  SELECT DISTINCT player_id, DATE(login_at) AS login_day",
      "  FROM LoginEvent",
      "), keyed AS (",
      "  SELECT player_id, login_day,",
      "         DATEDIFF(login_day, '2000-01-01') - ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY login_day) AS island",
      "  FROM days",
      "), streaks AS (",
      "  SELECT player_id, island, COUNT(*) AS streak_len",
      "  FROM keyed",
      "  GROUP BY player_id, island",
      ")",
      "SELECT player_id, MAX(streak_len) AS longest_streak_days",
      "FROM streaks",
      "GROUP BY player_id",
      "ORDER BY longest_streak_days DESC, player_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH days AS (SELECT DISTINCT player_id, LEFT(login_at, 10) AS login_day FROM LoginEvent),",
        "flagged AS (",
        "  SELECT player_id, login_day,",
        "         CASE WHEN DATEDIFF(login_day, LAG(login_day) OVER (PARTITION BY player_id ORDER BY login_day)) = 1 THEN 0 ELSE 1 END AS starts",
        "  FROM days",
        "), numbered AS (",
        "  SELECT player_id, login_day,",
        "         SUM(starts) OVER (PARTITION BY player_id ORDER BY login_day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS streak_no",
        "  FROM flagged",
        ")",
        "SELECT player_id, MAX(cnt) AS longest_streak_days",
        "FROM (SELECT player_id, streak_no, COUNT(*) AS cnt FROM numbered GROUP BY player_id, streak_no) s",
        "GROUP BY player_id",
        "ORDER BY longest_streak_days DESC, player_id",
      ].join("\n"),
      [
        "WITH days AS (SELECT DISTINCT player_id, DATE(login_at) AS login_day FROM LoginEvent)",
        "SELECT player_id, MAX(len) AS longest_streak_days FROM (",
        "  SELECT s.player_id, s.login_day, DATEDIFF(MIN(e.login_day), s.login_day) + 1 AS len",
        "  FROM days s",
        "  JOIN days e ON e.player_id = s.player_id AND e.login_day >= s.login_day",
        "  WHERE NOT EXISTS (SELECT 1 FROM days n WHERE n.player_id = e.player_id AND n.login_day = DATE_ADD(e.login_day, INTERVAL 1 DAY))",
        "    AND NOT EXISTS (SELECT 1 FROM days b WHERE b.player_id = s.player_id AND b.login_day = DATE_SUB(s.login_day, INTERVAL 1 DAY))",
        "  GROUP BY s.player_id, s.login_day",
        ") t",
        "GROUP BY player_id",
        "ORDER BY longest_streak_days DESC, player_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Reduce the log to distinct (player, day) pairs first — two logins on one day are one day.",
      "Number each player's days 1, 2, 3, … in order. Along a run of consecutive dates, the date minus that number stays constant.",
      "Group by (player, that constant) to get each streak's length, then take the maximum per player.",
      "A login at 23:59 and one at 00:01 the next day are on consecutive days.",
    ],
    editorial: [
      "This is **gaps and islands** on dates. Start by collapsing the log to one row per player per calendar day with `SELECT DISTINCT player_id, DATE(login_at)` — without that, a second login on the same day would look like an extra day in the run.",
      "",
      "Then number each player's days with `ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY login_day)`. On a run of consecutive dates the date advances by one day exactly when the row number advances by one, so `DATEDIFF(login_day, fixed_date) - row_number` is the same for the whole run and jumps whenever a day is missed. That value labels the island; `COUNT(*)` per (player, island) is the streak length, and `MAX` per player is the answer. Player 5 has 1–3 March (3 days, the 23:59 and 00:01 logins bridging two days) and 5 March alone.",
      "",
      "Equivalently, flag each day that does not follow the previous one (`LAG` + `DATEDIFF = 1`), turn the flags into streak numbers with a running SUM, and count. A set-based version pairs each streak start (no login the day before) with the first end at or after it (no login the day after). The window versions sort each player's days once.",
    ].join("\n"),
  },

  {
    slug: "day-one-and-day-seven-retention-by-signup-week",
    title: "Day-1 and Day-7 Retention by Signup Week",
    difficulty: "HARD",
    topics: ["Dates", "Aggregation", "Joins"],
    description: [
      "Product reviews new-player retention by **signup week**, a week starting on **Monday**: a player who signed up on Sunday 9 March 2025 belongs to the week of Monday 3 March. A player is **day-1 retained** if they played on the day right after their signup date, and **day-7 retained** if they played exactly 7 days after it. Playing on the signup day itself counts for neither; players who never came back still belong to their cohort.",
      "",
      "Return `cohort_week` (the Monday, `YYYY-MM-DD`), `cohort_size`, `d1_retention_pct` and `d7_retention_pct` — the percentage of the cohort retained, each **rounded to 2 decimal places** — **ordered by `cohort_week`**.",
    ].join("\n"),
    tables: [
      {
        name: "Player",
        columns: [
          { name: "player_id", type: "int" },
          { name: "signup_date", type: "date" },
          { name: "acquisition_channel", type: "varchar" },
        ],
        primaryKey: ["player_id"],
        note: "One row per new account.",
      },
      {
        name: "PlayDay",
        columns: [
          { name: "player_id", type: "int" },
          { name: "play_date", type: "date" },
          { name: "minutes_played", type: "int" },
        ],
        primaryKey: ["player_id", "play_date"],
        note: "A daily roll-up: one row per player per day they played, never before their signup date.",
      },
    ],
    examples: [
      {
        Player: [
          [1, "2025-03-03", "organic"],
          [2, "2025-03-05", "youtube_ad"],
          [3, "2025-03-09", "referral"],
          [4, "2025-03-10", "organic"],
          [5, "2025-03-11", "youtube_ad"],
        ],
        PlayDay: [
          [1, "2025-03-03", 40], [1, "2025-03-04", 25], [1, "2025-03-10", 30],
          [2, "2025-03-05", 15], [2, "2025-03-12", 60],
          [3, "2025-03-10", 45],
          [4, "2025-03-10", 20],
          [5, "2025-03-12", 35], [5, "2025-03-18", 10],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 12);
      const players: Cell[][] = [];
      const plays: Cell[][] = [];
      for (const id of seq(1, n)) {
        const signup = dateBetween(rng, "2025-03-01", "2025-03-23");
        players.push([id, signup, pick(rng, ["organic", "youtube_ad", "referral", "influencer"])]);
        const offsets = [0, 1, 7].filter(() => chance(rng, 0.5)).concat(sample(rng, [2, 3, 6, 8, 10], ri(rng, 0, 2)));
        for (const o of [...new Set(offsets)]) if (plays.length < 30) plays.push([id, addDays(signup, o), ri(rng, 5, 120)]);
      }
      return { Player: players, PlayDay: shuffle(rng, plays) };
    },
    solution: [
      "WITH flags AS (",
      "  SELECT p.player_id,",
      "         DATE_SUB(p.signup_date, INTERVAL WEEKDAY(p.signup_date) DAY) AS cohort_week,",
      "         MAX(CASE WHEN d.play_date = DATE_ADD(p.signup_date, INTERVAL 1 DAY) THEN 1 ELSE 0 END) AS d1,",
      "         MAX(CASE WHEN d.play_date = DATE_ADD(p.signup_date, INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS d7",
      "  FROM Player p",
      "  LEFT JOIN PlayDay d ON d.player_id = p.player_id",
      "  GROUP BY p.player_id, p.signup_date",
      ")",
      "SELECT cohort_week,",
      "       COUNT(*) AS cohort_size,",
      "       ROUND(100 * SUM(d1) / COUNT(*), 2) AS d1_retention_pct,",
      "       ROUND(100 * SUM(d7) / COUNT(*), 2) AS d7_retention_pct",
      "FROM flags",
      "GROUP BY cohort_week",
      "ORDER BY cohort_week",
    ].join("\n"),
    alternatives: [
      [
        "SELECT cohort_week, COUNT(*) AS cohort_size,",
        "       ROUND(AVG(d1) * 100, 2) AS d1_retention_pct, ROUND(AVG(d7) * 100, 2) AS d7_retention_pct",
        "FROM (",
        "  SELECT SUBDATE(p.signup_date, WEEKDAY(p.signup_date)) AS cohort_week,",
        "         CASE WHEN EXISTS (SELECT 1 FROM PlayDay d WHERE d.player_id = p.player_id AND DATEDIFF(d.play_date, p.signup_date) = 1) THEN 1 ELSE 0 END AS d1,",
        "         CASE WHEN EXISTS (SELECT 1 FROM PlayDay d WHERE d.player_id = p.player_id AND DATEDIFF(d.play_date, p.signup_date) = 7) THEN 1 ELSE 0 END AS d7",
        "  FROM Player p",
        ") t",
        "GROUP BY cohort_week",
        "ORDER BY cohort_week",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`WEEKDAY(d)` is 0 on Monday and 6 on Sunday, so subtracting that many days lands on the week's Monday.",
      "Work out two 0/1 flags per player first — played on signup + 1, played on signup + 7 — then aggregate by cohort.",
      "Start from `Player` with a LEFT JOIN, or players who never returned vanish from the cohort size.",
      "With the flags as 0/1, the retention rate is their sum over the cohort size (or simply their average).",
    ],
    editorial: [
      "Two levels again. **Per player**: LEFT JOIN the daily play rows and collapse them with `MAX(CASE WHEN play_date = DATE_ADD(signup_date, INTERVAL 1 DAY) THEN 1 ELSE 0 END)` — a 0/1 flag that is 1 if any row is the day after signup — and the same for 7 days. The LEFT JOIN matters: player 4 never played after the signup day and player 3's only row is day 1, and both must still count in their cohort. A play on the signup day matches neither CASE.",
      "",
      "**Per cohort**: the week's Monday is `DATE_SUB(signup_date, INTERVAL WEEKDAY(signup_date) DAY)` — `WEEKDAY` counts days since Monday, so Sunday 9 March steps back six days to 3 March. Grouping the per-player flags by that Monday, `COUNT(*)` is the cohort size and `100 * SUM(flag) / COUNT(*)`, rounded to two places, the retention. Because a flag is 0 or 1, `AVG(flag) * 100` is the same number.",
      "",
      "The alternative computes each flag with a correlated EXISTS on `DATEDIFF(play_date, signup_date) = 1` (or 7). Both read each player's play days once; an index on `(player_id, play_date)` makes the EXISTS lookups point queries.",
    ].join("\n"),
  },

  {
    slug: "battle-pass-xp-race-to-tier-thirty",
    title: "Battle Pass Race to Tier 30, Season by Season",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Subqueries"],
    description: [
      "Battle pass XP accumulates through a season and **resets to zero when a new season starts**. Tier 30 unlocks once a player's **cumulative XP within the season reaches 30,000** (exactly 30,000 is enough). `BattlePassXp` holds each player's XP earned per day, tagged with the season.",
      "",
      "For every (player, season) that reached tier 30, return `player_id`, `season`, `reached_on` (the first day the season's running total was at least 30,000) and `days_taken` (days from that player's first XP day of the season to `reached_on`; 0 if the same day). Order by **`season`, then `reached_on`, then `player_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "BattlePassXp",
        columns: [
          { name: "player_id", type: "int" },
          { name: "earned_on", type: "date" },
          { name: "season", type: "varchar" },
          { name: "xp", type: "int" },
        ],
        primaryKey: ["player_id", "earned_on"],
        note: "A daily roll-up: one row per player per day they earned XP. Season `S11` ran in January–February 2025 and `S12` from March.",
      },
    ],
    examples: [
      {
        BattlePassXp: [
          [1, "2025-02-20", "S11", 12000],
          [1, "2025-02-25", "S11", 15000],
          [1, "2025-03-01", "S12", 9000],
          [1, "2025-03-04", "S12", 21000],
          [2, "2025-02-27", "S11", 31000],
          [2, "2025-03-02", "S12", 14000],
          [2, "2025-03-03", "S12", 15999],
          [3, "2025-03-01", "S12", 10000],
          [3, "2025-03-02", "S12", 25000],
          [3, "2025-03-08", "S12", 4000],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const pid of sample(rng, seq(1, 8), chance(rng, 0.05) ? 0 : ri(rng, 1, 4))) {
        for (const [season, from, to] of [["S11", "2025-02-01", "2025-02-28"], ["S12", "2025-03-01", "2025-03-28"]] as const) {
          if (chance(rng, 0.2)) continue;
          const days = [...new Set(seq(0, ri(rng, 1, 4)).map(() => dateBetween(rng, from, to)))];
          for (const d of days) rows.push([pid, d, season, chance(rng, 0.15) ? 10000 : 1000 * ri(rng, 2, 16)]);
        }
      }
      return { BattlePassXp: shuffle(rng, rows.slice(0, 30)) };
    },
    solution: [
      "WITH running AS (",
      "  SELECT player_id, season, earned_on,",
      "         SUM(xp) OVER (PARTITION BY player_id, season ORDER BY earned_on",
      "                       ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS season_xp,",
      "         MIN(earned_on) OVER (PARTITION BY player_id, season) AS season_start",
      "  FROM BattlePassXp",
      ")",
      "SELECT player_id, season, MIN(earned_on) AS reached_on,",
      "       DATEDIFF(MIN(earned_on), MIN(season_start)) AS days_taken",
      "FROM running",
      "WHERE season_xp >= 30000",
      "GROUP BY player_id, season",
      "ORDER BY season, reached_on, player_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT b.player_id, b.season, MIN(b.earned_on) AS reached_on,",
        "       DATEDIFF(MIN(b.earned_on), (SELECT MIN(s.earned_on) FROM BattlePassXp s WHERE s.player_id = b.player_id AND s.season = b.season)) AS days_taken",
        "FROM BattlePassXp b",
        "WHERE (SELECT SUM(e.xp) FROM BattlePassXp e",
        "       WHERE e.player_id = b.player_id AND e.season = b.season AND e.earned_on <= b.earned_on) >= 30000",
        "GROUP BY b.player_id, b.season",
        "ORDER BY season, reached_on, b.player_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "A running total that restarts every season is a window SUM partitioned by both player and season.",
      "Order the window by date with an explicit ROWS frame so each row's total includes exactly the days up to it.",
      "The first day the total reaches the threshold is the MIN date among the rows where it does.",
      "The season's first XP day is a MIN over the same partition, without an ORDER BY.",
    ],
    editorial: [
      "The season reset is what a **partitioned running total** expresses: `SUM(xp) OVER (PARTITION BY player_id, season ORDER BY earned_on ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` gives every daily row the XP earned so far in that season, starting again from zero in each new partition. Player 1 had 27,000 XP when S11 ended; carrying it over would wrongly unlock tier 30 on 1 March, but within S12 they reach 30,000 exactly on 4 March — and exactly 30,000 counts.",
      "",
      "Once the running totals exist, the rows at or above 30,000 are the days after the unlock; the earliest of them is `reached_on`, so filter and take `MIN(earned_on)` per (player, season). Because XP is never negative the running total never falls back below the threshold, so the minimum is the unlock day. `MIN(earned_on) OVER (PARTITION BY player_id, season)` carries the season's first day along for `DATEDIFF`. Player 2 at 29,999 in S12 never appears.",
      "",
      "Without windows, a correlated SUM over the earlier days of the same season computes each running total — quadratic per partition, fine for small tables. The window version is one sort per partition.",
    ].join("\n"),
  },

  {
    slug: "peak-concurrent-sessions-per-server-region",
    title: "Peak Concurrent Game Sessions per Server Region",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation", "Subqueries"],
    description: [
      "Capacity planning needs each server region's **peak concurrency**: the largest number of game sessions open at the same moment. A session is open from `started_at` up to but **not including** `ended_at` — a session that ends at 21:00:00 does not overlap one that starts at 21:00:00. A NULL `ended_at` is a session still live, open from its start onwards.",
      "",
      "For each `server_region` with at least one session, return `server_region`, `peak_concurrent` and `peak_at` — the **earliest** moment the peak was reached (it is always some session's `started_at`). Order by `server_region`.",
    ].join("\n"),
    tables: [
      {
        name: "GameSession",
        columns: [
          { name: "session_id", type: "int" },
          { name: "player_id", type: "int" },
          { name: "server_region", type: "varchar" },
          { name: "started_at", type: "datetime" },
          { name: "ended_at", type: "datetime" },
        ],
        primaryKey: ["session_id"],
        note: "One row per connected session. `ended_at` is after `started_at`, or NULL for a session still in progress.",
      },
    ],
    examples: [
      {
        GameSession: [
          [1, 41, "ap-south-1", "2025-04-12 20:00:00", "2025-04-12 21:00:00"],
          [2, 42, "ap-south-1", "2025-04-12 20:30:00", "2025-04-12 22:00:00"],
          [3, 43, "ap-south-1", "2025-04-12 21:00:00", "2025-04-12 21:45:00"],
          [4, 44, "ap-south-1", "2025-04-12 21:30:00", null],
          [5, 45, "eu-west-1", "2025-04-12 18:00:00", "2025-04-12 19:00:00"],
          [6, 46, "eu-west-1", "2025-04-12 19:00:00", "2025-04-12 19:30:00"],
          [7, 47, "us-east-1", "2025-04-12 10:00:00", "2025-04-12 12:00:00"],
          [8, 48, "us-east-1", "2025-04-12 10:15:00", "2025-04-12 11:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 18);
      const regions = sample(rng, ["ap-south-1", "ap-southeast-1", "eu-west-1", "us-east-1"], ri(rng, 1, 3));
      const rows: Cell[][] = [];
      const ends: string[] = [];
      for (const id of seq(1, n)) {
        // Start on a 15-minute grid, now and then exactly when an earlier session ended.
        const start = ends.length && chance(rng, 0.25) ? pick(rng, ends) : `2025-04-12 ${pad(ri(rng, 18, 22))}:${pick(rng, ["00", "15", "30", "45"])}:00`;
        const end = chance(rng, 0.1) ? null : addSecs(start, 900 * ri(rng, 1, 8));
        if (end) ends.push(end);
        rows.push([id, 40 + id, pick(rng, regions), start, end]);
      }
      return { GameSession: rows };
    },
    solution: [
      "WITH events AS (",
      "  SELECT server_region, session_id, started_at AS ts, 1 AS delta FROM GameSession",
      "  UNION ALL",
      "  SELECT server_region, session_id, ended_at AS ts, -1 AS delta FROM GameSession WHERE ended_at IS NOT NULL",
      "), running AS (",
      "  SELECT server_region, ts,",
      "         SUM(delta) OVER (PARTITION BY server_region ORDER BY ts, delta, session_id",
      "                          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS open_now",
      "  FROM events",
      "), peaks AS (",
      "  SELECT server_region, MAX(open_now) AS peak_concurrent FROM running GROUP BY server_region",
      ")",
      "SELECT p.server_region, p.peak_concurrent, MIN(r.ts) AS peak_at",
      "FROM peaks p",
      "JOIN running r ON r.server_region = p.server_region AND r.open_now = p.peak_concurrent",
      "GROUP BY p.server_region, p.peak_concurrent",
      "ORDER BY p.server_region",
    ].join("\n"),
    alternatives: [
      [
        "WITH at_start AS (",
        "  SELECT s.server_region, s.started_at AS ts,",
        "         (SELECT COUNT(*) FROM GameSession o",
        "          WHERE o.server_region = s.server_region AND o.started_at <= s.started_at",
        "            AND (o.ended_at IS NULL OR o.ended_at > s.started_at)) AS open_now",
        "  FROM GameSession s",
        ")",
        "SELECT a.server_region, a.open_now AS peak_concurrent, MIN(a.ts) AS peak_at",
        "FROM at_start a",
        "WHERE a.open_now = (SELECT MAX(b.open_now) FROM at_start b WHERE b.server_region = a.server_region)",
        "GROUP BY a.server_region, a.open_now",
        "ORDER BY a.server_region",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Turn each session into two events: +1 when it starts and −1 when it ends (no end event for a live session).",
      "A running SUM of the events, in time order, is the number of sessions open after each event.",
      "When an end and a start share a timestamp, the end must be applied first — sort by the delta too.",
      "Concurrency only rises at a start, so it is enough to count the sessions open at each session's start.",
    ],
    editorial: [
      "The **sweep line**: split every session into a +1 event at `started_at` and a −1 event at `ended_at` (a live session has no −1). A running `SUM(delta)` per region, in time order, is the number of open sessions right after each event, and its maximum is the peak.",
      "",
      "Order matters at equal timestamps. Because a session is open up to but not including its end, an end at 21:00 must be processed before a start at 21:00; sorting by `(ts, delta)` puts −1 first. Adding `session_id` makes the order total, and with an explicit ROWS frame the running sum is deterministic. Several starts in the same second pass through intermediate counts, but those are below the final count at that second, so the maximum and its earliest time are unaffected. In ap-south-1 the peak is 3 at 21:30 — session 1 ended exactly when session 3 started, so 21:00 is still 2.",
      "",
      "The alternative relies on concurrency only rising at a start: for each session, count the sessions of its region with `started_at <= t` and (`ended_at > t` or NULL) — a correlated count, quadratic but simple — and take the best per region with its earliest start. The sweep is one sort of 2n events.",
    ].join("\n"),
  },

  {
    slug: "median-completed-match-duration-by-mode",
    title: "Median Completed Match Duration by Game Mode",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "Averages are skewed by the odd marathon match, so the designers want the **median** duration of each mode's **completed** matches (`abandoned` ones are ignored). With an odd number of matches the median is the middle duration; with an even number it is the average of the two middle durations.",
      "",
      "For each `mode` with at least one completed match, return `mode`, `completed_matches` and `median_duration_sec` **rounded to 1 decimal place**. Order by `mode`.",
    ].join("\n"),
    tables: [
      {
        name: "GameMatch",
        columns: [
          { name: "match_id", type: "int" },
          { name: "mode", type: "enum", values: [...MODES] },
          { name: "status", type: "enum", values: ["completed", "abandoned"] },
          { name: "duration_sec", type: "int" },
        ],
        primaryKey: ["match_id"],
        note: "One row per hosted match.",
      },
    ],
    examples: [
      {
        GameMatch: [
          [1, "Battle Royale", "completed", 1500],
          [2, "Battle Royale", "completed", 1320],
          [3, "Battle Royale", "completed", 3900],
          [4, "Battle Royale", "abandoned", 60],
          [5, "Team Deathmatch", "completed", 600],
          [6, "Team Deathmatch", "completed", 545],
          [7, "Team Deathmatch", "completed", 600],
          [8, "Team Deathmatch", "completed", 610],
          [9, "Ranked 5v5", "completed", 2101],
          [10, "Ranked 5v5", "completed", 2000],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 24);
      const modes = sample(rng, MODES, ri(rng, 1, 4));
      const rows = seq(1, n).map((id) => [
        id, pick(rng, modes), chance(rng, 0.15) ? "abandoned" : "completed",
        chance(rng, 0.25) ? 600 : 60 * ri(rng, 5, 40) + ri(rng, 0, 1),
      ]);
      return { GameMatch: shuffle(rng, rows) };
    },
    solution: [
      "WITH ranked AS (",
      "  SELECT mode, duration_sec,",
      "         ROW_NUMBER() OVER (PARTITION BY mode ORDER BY duration_sec, match_id) AS rn,",
      "         COUNT(*) OVER (PARTITION BY mode) AS cnt",
      "  FROM GameMatch",
      "  WHERE status = 'completed'",
      ")",
      "SELECT mode, MAX(cnt) AS completed_matches, ROUND(AVG(duration_sec), 1) AS median_duration_sec",
      "FROM ranked",
      "WHERE rn IN (FLOOR((cnt + 1) / 2), FLOOR((cnt + 2) / 2))",
      "GROUP BY mode",
      "ORDER BY mode",
    ].join("\n"),
    alternatives: [
      [
        "WITH done AS (SELECT match_id, mode, duration_sec FROM GameMatch WHERE status = 'completed')",
        "SELECT d.mode,",
        "       (SELECT COUNT(*) FROM done c WHERE c.mode = d.mode) AS completed_matches,",
        "       ROUND(AVG(DISTINCT d.duration_sec), 1) AS median_duration_sec",
        "FROM done d",
        "WHERE (SELECT COUNT(*) FROM done x WHERE x.mode = d.mode AND x.duration_sec <= d.duration_sec) * 2 >= (SELECT COUNT(*) FROM done c WHERE c.mode = d.mode)",
        "  AND (SELECT COUNT(*) FROM done x WHERE x.mode = d.mode AND x.duration_sec >= d.duration_sec) * 2 >= (SELECT COUNT(*) FROM done c WHERE c.mode = d.mode)",
        "GROUP BY d.mode",
        "ORDER BY d.mode",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Number each mode's completed matches by duration and count them, both with window functions.",
      "For n rows the middle positions are ⌊(n+1)/2⌋ and ⌊(n+2)/2⌋ — the same position when n is odd.",
      "Averaging the one or two middle rows gives the median in both cases.",
      "Duplicate durations need a tie-break in the ROW_NUMBER so positions are unique.",
    ],
    editorial: [
      "SQL has no portable MEDIAN, so build it from positions. Over the completed matches of each mode, `ROW_NUMBER() OVER (PARTITION BY mode ORDER BY duration_sec, match_id)` gives each match its position in sorted order and `COUNT(*) OVER (PARTITION BY mode)` the size n. The middle positions are `FLOOR((n+1)/2)` and `FLOOR((n+2)/2)`: for n = 3 both are 2, for n = 4 they are 2 and 3. Keeping those rows and averaging them gives the middle value for odd n and the mean of the two middle values for even n.",
      "",
      "The `match_id` tie-break makes positions unique when durations repeat; the median does not depend on which of two equal durations sits where, but the row numbering must be total. Team Deathmatch (545, 600, 600, 610) has median 600; Ranked (2000, 2101) gives 2050.5, and Battle Royale's 3,900-second outlier does not move its median of 1,500 as it would move an average.",
      "",
      "A set-based alternative: a value is a median candidate when at least half the rows are ≤ it and at least half are ≥ it; the median is the average of the **distinct** candidates. It is quadratic but needs no windows. The window version is one sort per mode.",
    ].join("\n"),
  },

  {
    slug: "new-player-funnel-by-platform",
    title: "New-Player Funnel From Install to First Purchase by Platform",
    difficulty: "HARD",
    topics: ["Conditional Logic", "Joins", "Aggregation"],
    description: [
      "The growth team tracks a strict onboarding funnel: **install → tutorial complete → first ranked match → first purchase**. A player reaches a step only if they reached the previous one **and** the step happened **strictly later** than the previous step — a player who skipped the tutorial and played ranked first has not reached the ranked step, and a purchase made before the first ranked match does not count either.",
      "",
      "For each `platform` with at least one install, return `platform`, `installs`, `completed_tutorial`, `played_ranked`, `purchased` and `install_to_purchase_pct` = 100 × purchased ÷ installs **rounded to 2 decimal places**. Order by `platform`.",
    ].join("\n"),
    tables: [
      {
        name: "Player",
        columns: [
          { name: "player_id", type: "int" },
          { name: "platform", type: "enum", values: ["android", "ios", "pc"] },
          { name: "installed_at", type: "datetime" },
        ],
        primaryKey: ["player_id"],
        note: "One row per install.",
      },
      {
        name: "FunnelEvent",
        columns: [
          { name: "player_id", type: "int" },
          { name: "event_type", type: "enum", values: ["tutorial_complete", "first_ranked_match", "first_purchase"] },
          { name: "occurred_at", type: "datetime" },
        ],
        primaryKey: ["player_id", "event_type"],
        note: "Each milestone happens at most once per player, always after the install.",
      },
    ],
    examples: [
      {
        Player: [
          [1, "android", "2025-05-01 10:00:00"],
          [2, "android", "2025-05-01 11:00:00"],
          [3, "android", "2025-05-02 09:00:00"],
          [4, "ios", "2025-05-02 12:00:00"],
          [5, "ios", "2025-05-03 08:00:00"],
          [6, "pc", "2025-05-03 20:00:00"],
        ],
        FunnelEvent: [
          [1, "tutorial_complete", "2025-05-01 10:20:00"],
          [1, "first_ranked_match", "2025-05-02 19:00:00"],
          [1, "first_purchase", "2025-05-04 21:00:00"],
          [2, "tutorial_complete", "2025-05-01 11:30:00"],
          [2, "first_purchase", "2025-05-01 12:00:00"],
          [3, "first_ranked_match", "2025-05-02 10:00:00"],
          [3, "tutorial_complete", "2025-05-02 11:00:00"],
          [4, "tutorial_complete", "2025-05-02 12:15:00"],
          [4, "first_ranked_match", "2025-05-03 18:00:00"],
          [4, "first_purchase", "2025-05-03 18:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 10);
      const players: Cell[][] = [];
      const events: Cell[][] = [];
      for (const id of seq(1, n)) {
        const inst = `2025-05-${pad(ri(rng, 1, 9))} ${pad(ri(rng, 8, 20))}:00:00`;
        players.push([id, pick(rng, ["android", "android", "ios", "pc"]), inst]);
        let t = inst;
        for (const type of ["tutorial_complete", "first_ranked_match", "first_purchase"]) {
          if (!chance(rng, 0.7) || events.length >= 30) continue;
          // Usually later than the previous milestone; sometimes at the same second or before it.
          const r = rng();
          const at = r < 0.12 ? t : r < 0.24 ? addSecs(inst, ri(rng, 60, 600)) : addSecs(t, 60 * ri(rng, 5, 3000));
          events.push([id, type, at]);
          t = at;
        }
      }
      return { Player: players, FunnelEvent: shuffle(rng, events) };
    },
    solution: [
      "WITH firsts AS (",
      "  SELECT player_id,",
      "         MAX(CASE WHEN event_type = 'tutorial_complete' THEN occurred_at END) AS tutorial_at,",
      "         MAX(CASE WHEN event_type = 'first_ranked_match' THEN occurred_at END) AS ranked_at,",
      "         MAX(CASE WHEN event_type = 'first_purchase' THEN occurred_at END) AS purchase_at",
      "  FROM FunnelEvent",
      "  GROUP BY player_id",
      "), steps AS (",
      "  SELECT p.platform,",
      "         CASE WHEN f.tutorial_at IS NOT NULL THEN 1 ELSE 0 END AS s1,",
      "         CASE WHEN f.ranked_at > f.tutorial_at THEN 1 ELSE 0 END AS s2,",
      "         CASE WHEN f.ranked_at > f.tutorial_at AND f.purchase_at > f.ranked_at THEN 1 ELSE 0 END AS s3",
      "  FROM Player p",
      "  LEFT JOIN firsts f ON f.player_id = p.player_id",
      ")",
      "SELECT platform, COUNT(*) AS installs, SUM(s1) AS completed_tutorial, SUM(s2) AS played_ranked, SUM(s3) AS purchased,",
      "       ROUND(100 * SUM(s3) / COUNT(*), 2) AS install_to_purchase_pct",
      "FROM steps",
      "GROUP BY platform",
      "ORDER BY platform",
    ].join("\n"),
    alternatives: [
      [
        "SELECT p.platform, COUNT(*) AS installs, COUNT(t.player_id) AS completed_tutorial,",
        "       COUNT(r.player_id) AS played_ranked, COUNT(b.player_id) AS purchased,",
        "       ROUND(100 * COUNT(b.player_id) / COUNT(*), 2) AS install_to_purchase_pct",
        "FROM Player p",
        "LEFT JOIN FunnelEvent t ON t.player_id = p.player_id AND t.event_type = 'tutorial_complete'",
        "LEFT JOIN FunnelEvent r ON r.player_id = t.player_id AND r.event_type = 'first_ranked_match' AND r.occurred_at > t.occurred_at",
        "LEFT JOIN FunnelEvent b ON b.player_id = r.player_id AND b.event_type = 'first_purchase' AND b.occurred_at > r.occurred_at",
        "GROUP BY p.platform",
        "ORDER BY p.platform",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Pivot the events into one row per player with a column per milestone time — MAX(CASE …) per event type.",
      "Every install counts, so start from `Player` and LEFT JOIN the milestones.",
      "A step is reached when its time is strictly after the previous step's time; a NULL on either side means not reached.",
      "Alternatively chain three LEFT JOINs, each joined to the previous step's row with the time condition in ON.",
    ],
    editorial: [
      "First **pivot**: one row per player with the time of each milestone, via `MAX(CASE WHEN event_type = … THEN occurred_at END)` grouped by player (each milestone happens at most once, so MAX just picks it). Then turn the times into 0/1 step flags with CASE. Step 2 is `ranked_at > tutorial_at`: if either is NULL the comparison is unknown and CASE falls to 0, so a missing tutorial and a ranked match before the tutorial (player 3) both fail. Step 3 also requires step 2, so player 2's purchase — made without any ranked match — does not count, and player 4's purchase at the same second as the ranked match is not *strictly* later.",
      "",
      "LEFT JOIN the pivot to `Player` so players with no events at all are installs with every flag 0, then sum the flags per platform. The conversion is `100 * purchased / installs`, rounded.",
      "",
      "The chained LEFT JOIN version encodes the funnel in the joins: each step joins to the previous step's row, with the time condition in ON, so a player who fails a step has NULLs from there on and `COUNT(column)` counts only those who got through. Both are a grouping over players.",
    ].join("\n"),
  },

  {
    slug: "referral-tree-recruits-per-player",
    title: "Total Recruits Down Each Player's Referral Tree",
    difficulty: "HARD",
    topics: ["Subqueries", "Joins", "Aggregation"],
    description: [
      "The \"Invite a friend\" programme rewards a player for everyone they brought in, **directly or indirectly**: if Asha invited Ravi and Ravi invited Meera, Meera is one of Asha's recruits too. `referred_by` points to the inviting player; referral chains are at most four levels deep and never loop.",
      "",
      "For every player who referred at least one other player, return `gamertag`, `direct_referrals` and `total_recruits` (all players anywhere below them in the tree), **ordered by `total_recruits` descending, then `gamertag`**.",
    ].join("\n"),
    tables: [
      {
        name: "Player",
        columns: [
          { name: "player_id", type: "int" },
          { name: "gamertag", type: "varchar" },
          { name: "referred_by", type: "int" },
        ],
        primaryKey: ["player_id"],
        note: "`referred_by` is the `player_id` of the player whose invite link was used, or NULL for an organic sign-up. Gamertags are unique.",
      },
    ],
    examples: [
      {
        Player: [
          [1, "ShadowFang", null],
          [2, "PixelPriya", 1],
          [3, "LagLord", 1],
          [4, "ClutchDiya", 2],
          [5, "FrostDev", 4],
          [6, "KingKabir", null],
          [7, "AceAisha", 6],
          [8, "BotSlayer", 4],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 16);
      const who = tags(rng, n);
      const depth: number[] = [];
      const rows: Cell[][] = seq(1, n).map((id, i) => {
        const parents = seq(1, i).filter((p) => depth[p - 1]! < 3);
        const ref = parents.length && chance(rng, 0.75) ? pick(rng, parents) : null;
        depth.push(ref === null ? 0 : depth[ref - 1]! + 1);
        return [id, who[i]!, ref];
      });
      return { Player: shuffle(rng, rows) };
    },
    solution: [
      "WITH RECURSIVE chain (ancestor_id, recruit_id) AS (",
      "  SELECT referred_by, player_id FROM Player WHERE referred_by IS NOT NULL",
      "  UNION ALL",
      "  SELECT c.ancestor_id, p.player_id",
      "  FROM chain c",
      "  JOIN Player p ON p.referred_by = c.recruit_id",
      ")",
      "SELECT a.gamertag,",
      "       (SELECT COUNT(*) FROM Player d WHERE d.referred_by = a.player_id) AS direct_referrals,",
      "       COUNT(*) AS total_recruits",
      "FROM chain c",
      "JOIN Player a ON a.player_id = c.ancestor_id",
      "GROUP BY a.player_id, a.gamertag",
      "ORDER BY total_recruits DESC, a.gamertag",
    ].join("\n"),
    alternatives: [
      [
        "WITH pairs AS (",
        "  SELECT p1.referred_by AS ancestor_id, p1.player_id AS recruit_id FROM Player p1 WHERE p1.referred_by IS NOT NULL",
        "  UNION ALL",
        "  SELECT p1.referred_by, p2.player_id FROM Player p1 JOIN Player p2 ON p2.referred_by = p1.player_id WHERE p1.referred_by IS NOT NULL",
        "  UNION ALL",
        "  SELECT p1.referred_by, p3.player_id FROM Player p1 JOIN Player p2 ON p2.referred_by = p1.player_id JOIN Player p3 ON p3.referred_by = p2.player_id WHERE p1.referred_by IS NOT NULL",
        "  UNION ALL",
        "  SELECT p1.referred_by, p4.player_id FROM Player p1 JOIN Player p2 ON p2.referred_by = p1.player_id JOIN Player p3 ON p3.referred_by = p2.player_id JOIN Player p4 ON p4.referred_by = p3.player_id WHERE p1.referred_by IS NOT NULL",
        ")",
        "SELECT a.gamertag,",
        "       SUM(CASE WHEN r.referred_by = a.player_id THEN 1 ELSE 0 END) AS direct_referrals,",
        "       COUNT(*) AS total_recruits",
        "FROM pairs x",
        "JOIN Player a ON a.player_id = x.ancestor_id",
        "JOIN Player r ON r.player_id = x.recruit_id",
        "GROUP BY a.player_id, a.gamertag",
        "ORDER BY total_recruits DESC, a.gamertag",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Build every (ancestor, recruit) pair: the direct referrals, then the referrals of those, and so on.",
      "A recursive CTE does this: the anchor is each direct referral, the recursive step goes one level further down.",
      "Count the pairs per ancestor for the total; the direct count is just the players whose `referred_by` is that ancestor.",
      "Because the depth is bounded, a UNION ALL of one-, two-, three- and four-level self joins gives the same pairs.",
    ],
    editorial: [
      "The total depends on the whole subtree, which a fixed number of joins only handles if the depth is fixed — the general tool is a **recursive CTE**. The anchor turns each referral into a pair (ancestor = the inviter, recruit = the player). The recursive member takes every pair found so far and adds the recruit's own referrals with the *same* ancestor, so ShadowFang → PixelPriya produces ShadowFang → ClutchDiya, then ShadowFang → FrostDev and ShadowFang → BotSlayer. The recursion stops when a level finds no new players; since chains never loop it always ends.",
      "",
      "Each pair is one recruit of one ancestor (a tree gives every recruit one path up, so nobody is counted twice), so `COUNT(*)` grouped by ancestor is `total_recruits`. The direct referrals are a correlated count of players whose `referred_by` is that ancestor — or, in the pair table, the pairs whose recruit points straight at the ancestor. Players who invited nobody have no pairs and do not appear.",
      "",
      "With the depth capped at four, the same pairs come from a UNION ALL of self joins one to four levels deep, which is what the recursion unrolls into. The recursive form keeps working if the cap is ever lifted; the cost is one join per level.",
    ].join("\n"),
  },
];
