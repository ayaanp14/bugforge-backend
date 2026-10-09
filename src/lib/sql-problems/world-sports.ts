import type { Cell } from "../sql/types.js";
import type { Rng, SqlProblemSpec } from "./types.js";
import { FIRST_NAMES, LAST_NAMES, addDays, atTime, chance, dateBetween, maybeNull, pick, ri, roundTo, sample, shuffle } from "./kit.js";

/**
 * Sports and fantasy leagues: a T20 cricket league (scorecards, ball-by-ball
 * deliveries, bowling figures, partnerships, net run rate, the auction), a
 * football league (results, the table, goalkeepers, streaks, injuries) and a
 * fantasy game built on both (teams, captains, gameweek points, contest
 * entries, retention). The questions are the ones a league's stats desk, a
 * franchise analyst or a fantasy app's data team is actually asked. Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);

/**
 * `n` distinct full names. First names are distinct and none is a prefix of
 * another, so a byte-wise sort and MySQL's collation order them the same way.
 */
const people = (rng: Rng, n: number): string[] => sample(rng, FIRST_NAMES, n).map((f) => `${f} ${pick(rng, LAST_NAMES)}`);

const T20_TEAMS = [
  "Bengaluru Blasters", "Chennai Cheetahs", "Delhi Defenders", "Gujarat Gladiators",
  "Hyderabad Hurricanes", "Jaipur Jaguars", "Kolkata Krakens", "Lucknow Lancers", "Mumbai Monarchs", "Punjab Pioneers",
] as const;
const CLUBS = [
  "Bengal Tigers FC", "Chennai Strikers", "Delhi Falcons", "Goa Gulls",
  "Kerala Kingfishers", "Mumbai Mariners", "Pune Rovers", "Shillong Stars",
] as const;
const STADIUMS = ["Coastal Arena", "Fort Ground", "Hillside Park", "Lakeview Stadium", "Riverside Oval", "Salt Lake Bowl"] as const;

/**
 * True when num / den, shown to `dp` places, sits near a half-way point. MySQL
 * keeps 4 decimals after `/` and rounds the shown value from those, the judge
 * from the exact quotient, so a generator steers clear of these values.
 */
const nearHalf = (num: number, den: number, dp = 2, width = 0.006): boolean => {
  const v = (num / den) * 10 ** dp;
  const f = v - Math.floor(v);
  return f > 0.5 - width && f < 0.5 + width;
};

export const WORLD_SPORTS: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "t20-innings-with-strike-rate-above-150",
    title: "T20 Innings Scored at a Strike Rate Above 150",
    difficulty: "EASY",
    topics: ["Basics"],
    description: [
      "The league's broadcaster wants a graphic of the season's quickest knocks. A batter's **strike rate** in an innings is runs scored per 100 balls faced: `runs * 100 / balls_faced`.",
      "",
      "Return every innings in which the batter faced **at least 10 balls** and scored at a strike rate **strictly greater than 150**, with the columns `match_id`, `batter`, `runs`, `balls_faced` and `strike_rate` (rounded to 2 decimal places). An innings at exactly 150 does not qualify. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "BattingInnings",
        columns: [
          { name: "innings_id", type: "int" },
          { name: "match_id", type: "int" },
          { name: "batter", type: "varchar" },
          { name: "runs", type: "int" },
          { name: "balls_faced", type: "int" },
          { name: "dismissed", type: "bool" },
        ],
        primaryKey: ["innings_id"],
        note: "One row per batter per match they batted in. `balls_faced` is always at least 1; `dismissed` is 1 if the batter was out.",
      },
    ],
    examples: [
      {
        BattingInnings: [
          [1, 101, "Rohan Iyer", 64, 31, 1],
          [2, 101, "Kabir Khan", 12, 8, 1],
          [3, 101, "Arjun Nair", 45, 30, 0],
          [4, 102, "Vikram Rao", 88, 52, 1],
          [5, 102, "Rohan Iyer", 21, 10, 1],
          [6, 102, "Dev Mehta", 30, 25, 1],
          [7, 103, "Kabir Khan", 52, 23, 0],
        ],
      },
    ],
    gen: (rng) => {
      const batters = people(rng, ri(rng, 1, 8));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 20);
      const rows: Cell[][] = seq(1, n).map((id) => {
        // Never 32 balls: an odd score off 32 balls is a half-way strike rate.
        let balls = ri(rng, 1, 60);
        if (balls === 32) balls = 33;
        const style = rng();
        let runs: number;
        if (style < 0.2 && balls % 2 === 0) runs = (balls * 3) / 2; // exactly 150
        else if (style < 0.3) {
          balls = 10; // the 10-ball boundary
          runs = ri(rng, 10, 25);
        }
        else runs = Math.round(balls * (0.5 + rng() * 1.8));
        return [id, ri(rng, 101, 110), pick(rng, batters), runs, balls, chance(rng, 0.7) ? 1 : 0];
      });
      return { BattingInnings: rows };
    },
    solution: [
      "SELECT match_id, batter, runs, balls_faced,",
      "       ROUND(runs * 100 / balls_faced, 2) AS strike_rate",
      "FROM BattingInnings",
      "WHERE balls_faced >= 10",
      "  AND runs * 100 > 150 * balls_faced",
    ].join("\n"),
    alternatives: [
      "SELECT match_id, batter, runs, balls_faced, ROUND(100 * runs / balls_faced, 2) AS strike_rate FROM BattingInnings WHERE balls_faced >= 10 AND runs / balls_faced > 1.5",
      "SELECT * FROM (SELECT match_id, batter, runs, balls_faced, ROUND(runs * 100 / balls_faced, 2) AS strike_rate FROM BattingInnings WHERE NOT balls_faced < 10) t WHERE strike_rate > 150",
    ],
    hints: [
      "The strike rate is a calculated column: `runs * 100 / balls_faced`.",
      "Two conditions must both hold — the minimum number of balls and the strike-rate bar — so join them with AND.",
      "\"Strictly greater\" means an innings at exactly 150 is left out; multiplying out (`runs * 100 > 150 * balls_faced`) avoids any rounding in the comparison.",
    ],
    editorial: [
      "This is a filter with a calculated column. The strike rate of each innings is `runs * 100 / balls_faced`; MySQL's `/` is decimal division, so 64 runs off 31 balls is 206.45 after rounding, not an integer 206.",
      "",
      "Two conditions decide whether an innings is shown. `balls_faced >= 10` throws out cameos like 12 off 8, which would otherwise top any strike-rate chart, and the strike rate must be **strictly** above 150 — 21 off 10 (210) passes while 45 off 30 (exactly 150) does not. Comparing `runs * 100 > 150 * balls_faced` keeps the test in whole numbers, so no rounding can push a borderline innings across the bar; comparing `runs / balls_faced > 1.5` is the same test, and so is filtering on the rounded column in an outer query, because a strike rate just above 150 is never close enough to round down to it.",
      "",
      "Round only the value you display. The query is a single scan of the table.",
    ].join("\n"),
  },

  {
    slug: "economical-bowlers-of-the-t20-season",
    title: "Economical Bowlers of the T20 Season",
    difficulty: "EASY",
    topics: ["Aggregation"],
    description: [
      "Selectors are shortlisting bowlers who kept the scoring down across the season. Every spell in `BowlingSpell` is recorded in **complete overs**, so a bowler's season **economy** is their total runs conceded divided by their total overs.",
      "",
      "Return each bowler who bowled **at least 10 overs** in total and whose season economy is **strictly below 7**, with the columns `bowler`, `overs`, `runs_conceded` and `economy` (rounded to 2 decimal places). Order the rows by `economy` ascending, then by `bowler` alphabetically.",
    ].join("\n"),
    tables: [
      {
        name: "BowlingSpell",
        columns: [
          { name: "spell_id", type: "int" },
          { name: "match_id", type: "int" },
          { name: "bowler", type: "varchar" },
          { name: "overs", type: "int" },
          { name: "runs_conceded", type: "int" },
          { name: "wickets", type: "int" },
        ],
        primaryKey: ["spell_id"],
        note: "One row per bowler per match. `overs` is a whole number between 1 and 4 (a T20 bowler may bowl at most four).",
      },
    ],
    examples: [
      {
        BowlingSpell: [
          [1, 201, "Aarav Das", 4, 22, 2],
          [2, 202, "Aarav Das", 4, 31, 1],
          [3, 203, "Aarav Das", 3, 18, 0],
          [4, 201, "Farhan Patel", 4, 26, 3],
          [5, 202, "Farhan Patel", 4, 30, 1],
          [6, 203, "Farhan Patel", 2, 14, 0],
          [7, 201, "Ishaan Bose", 4, 20, 1],
          [8, 202, "Ishaan Bose", 3, 19, 2],
          [9, 203, "Harsh Joshi", 4, 41, 0],
        ],
      },
    ],
    gen: (rng) => {
      const bowlers = people(rng, ri(rng, 1, 7));
      const rows: Cell[][] = [];
      let id = 1;
      for (const b of bowlers) {
        const spells = chance(rng, 0.1) ? ri(rng, 0, 2) : ri(rng, 3, 6);
        const overs = Array.from({ length: spells }, () => ri(rng, 1, 4));
        let total = overs.reduce((a, x) => a + x, 0);
        // A total that is a multiple of 8 can give a half-way economy (x.125); nudge it.
        if (total > 0 && total % 8 === 0) {
          const k = overs.findIndex((o) => o < 4);
          if (k >= 0) overs[k] = overs[k]! + 1;
          else overs[0] = overs[0]! - 1;
          total = overs.reduce((a, x) => a + x, 0);
        }
        // Sometimes exactly 7 an over, the boundary "strictly below" is about.
        const exact = chance(rng, 0.2);
        overs.forEach((o, i) => {
          const runs = exact ? 7 * o : Math.max(0, Math.round(o * (4.5 + rng() * 4)));
          rows.push([id++, 200 + i + ri(rng, 0, 3), b, o, runs, ri(rng, 0, 3)]);
        });
      }
      return { BowlingSpell: shuffle(rng, rows) };
    },
    solution: [
      "SELECT bowler,",
      "       SUM(overs) AS overs,",
      "       SUM(runs_conceded) AS runs_conceded,",
      "       ROUND(SUM(runs_conceded) / SUM(overs), 2) AS economy",
      "FROM BowlingSpell",
      "GROUP BY bowler",
      "HAVING SUM(overs) >= 10 AND SUM(runs_conceded) < 7 * SUM(overs)",
      "ORDER BY economy, bowler",
    ].join("\n"),
    alternatives: [
      "SELECT bowler, overs, runs_conceded, ROUND(runs_conceded / overs, 2) AS economy FROM (SELECT bowler, SUM(overs) AS overs, SUM(runs_conceded) AS runs_conceded FROM BowlingSpell GROUP BY bowler) t WHERE overs >= 10 AND runs_conceded / overs < 7 ORDER BY economy, bowler",
    ],
    ordered: true,
    hints: [
      "Economy is a season figure, so first collapse the spells to one row per bowler.",
      "Sum the runs and the overs separately, then divide the sums — an average of each spell's economy would weight a one-over spell like a four-over one.",
      "Conditions on aggregated values go in HAVING, not WHERE.",
    ],
    editorial: [
      "The question is about each bowler's whole season, so the spells are grouped by `bowler` and the runs and overs are summed. The season economy is `SUM(runs_conceded) / SUM(overs)` — a ratio of totals. Averaging the per-spell economies instead would be wrong: a single expensive over would count as much as a tidy four-over spell.",
      "",
      "Both conditions are about the totals, so they go in `HAVING`: at least 10 overs, and an economy strictly below 7. Writing the second as `SUM(runs_conceded) < 7 * SUM(overs)` keeps it in whole numbers, so a bowler at exactly 7.00 is reliably left out. The derived-table version computes the totals first and filters them in an outer query, which reads the same.",
      "",
      "The order is by the rounded economy and then by name, so two bowlers with the same figure are listed alphabetically. The query is one scan and one grouping of the spells.",
    ].join("\n"),
  },

  {
    slug: "football-full-time-results-board",
    title: "Full-Time Results Board for the Football League",
    difficulty: "EASY",
    topics: ["Conditional Logic", "Basics"],
    description: [
      "The league's website shows a results board. Each fixture has a home and an away side; a fixture that was postponed has NULL in both goal columns.",
      "",
      "Return every fixture with the columns `match_id`, `home_team`, `away_team`, `result` and `winner`. `result` is `'Home win'`, `'Away win'`, `'Draw'` or, for a postponed fixture, `'Postponed'`. `winner` is the winning team's name, and NULL for a draw or a postponed fixture. Order the rows by `match_date`, then by `match_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Fixture",
        columns: [
          { name: "match_id", type: "int" },
          { name: "match_date", type: "date" },
          { name: "home_team", type: "varchar" },
          { name: "away_team", type: "varchar" },
          { name: "home_goals", type: "int" },
          { name: "away_goals", type: "int" },
        ],
        primaryKey: ["match_id"],
        note: "`home_goals` and `away_goals` are both NULL when the fixture was postponed, and both set otherwise.",
      },
    ],
    examples: [
      {
        Fixture: [
          [1, "2024-09-14", "Goa Gulls", "Pune Rovers", 2, 1],
          [2, "2024-09-14", "Delhi Falcons", "Shillong Stars", 0, 0],
          [3, "2024-09-15", "Chennai Strikers", "Mumbai Mariners", 1, 3],
          [4, "2024-09-21", "Pune Rovers", "Delhi Falcons", null, null],
          [5, "2024-09-21", "Mumbai Mariners", "Goa Gulls", 2, 2],
          [6, "2024-09-22", "Shillong Stars", "Chennai Strikers", 4, 0],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 18);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const [home, away] = sample(rng, CLUBS, 2);
        const off = chance(rng, 0.12);
        return [id, dateBetween(rng, "2024-08-10", "2024-11-30"), home!, away!, off ? null : ri(rng, 0, 4), off ? null : ri(rng, 0, 3)];
      });
      return { Fixture: rows };
    },
    solution: [
      "SELECT match_id, home_team, away_team,",
      "       CASE",
      "         WHEN home_goals IS NULL THEN 'Postponed'",
      "         WHEN home_goals > away_goals THEN 'Home win'",
      "         WHEN home_goals < away_goals THEN 'Away win'",
      "         ELSE 'Draw'",
      "       END AS result,",
      "       CASE",
      "         WHEN home_goals > away_goals THEN home_team",
      "         WHEN home_goals < away_goals THEN away_team",
      "       END AS winner",
      "FROM Fixture",
      "ORDER BY match_date, match_id",
    ].join("\n"),
    alternatives: [
      "SELECT match_id, home_team, away_team, IF(home_goals IS NULL, 'Postponed', IF(home_goals > away_goals, 'Home win', IF(home_goals < away_goals, 'Away win', 'Draw'))) AS result, IF(home_goals > away_goals, home_team, IF(home_goals < away_goals, away_team, NULL)) AS winner FROM Fixture ORDER BY match_date, match_id",
    ],
    ordered: true,
    hints: [
      "A `CASE` expression picks one value per row from a list of conditions, checked top to bottom.",
      "Deal with the postponed fixtures first: a comparison with NULL is never true, so they would otherwise fall through to the last branch.",
      "`winner` is a second CASE; a CASE without ELSE yields NULL when nothing matches.",
    ],
    editorial: [
      "Each output row is one fixture, so there is no grouping — just two `CASE` expressions. The first names the result. Its branches are checked in order, and the order matters: a postponed fixture has NULL goals, and `NULL > NULL` and `NULL < NULL` are both unknown, so without a first branch for `home_goals IS NULL` a postponed match would fall through to `ELSE 'Draw'`. Putting the NULL test first makes the remaining branches only ever see played matches.",
      "",
      "The second CASE returns the home team when it scored more and the away team when it scored less. A draw matches neither branch, and neither does a postponed fixture (the comparisons are unknown), and a CASE with no matching branch and no ELSE yields NULL — exactly the rule asked for. Nested `IF` calls say the same thing.",
      "",
      "Order by date, then by `match_id` so fixtures on the same day are listed predictably. The query is a single scan.",
    ].join("\n"),
  },

  {
    slug: "fantasy-teams-without-a-captain",
    title: "Fantasy Teams That Forgot to Pick a Captain",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "Before the gameweek locks, the fantasy app emails every manager whose team has **no captain** among its picks. A team that has not picked any players yet has no captain either.",
      "",
      "Return the columns `team_name` and `manager` for every such team. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "FantasyTeam",
        columns: [
          { name: "team_id", type: "int" },
          { name: "team_name", type: "varchar" },
          { name: "manager", type: "varchar" },
        ],
        primaryKey: ["team_id"],
        note: "One row per fantasy team.",
      },
      {
        name: "TeamPick",
        columns: [
          { name: "pick_id", type: "int" },
          { name: "team_id", type: "int" },
          { name: "player_name", type: "varchar" },
          { name: "is_captain", type: "bool" },
        ],
        primaryKey: ["pick_id"],
        note: "One row per player picked into a team for this gameweek; `is_captain` is 1 for the captain. `team_id` is always in `FantasyTeam`.",
      },
    ],
    examples: [
      {
        FantasyTeam: [
          [1, "Spin Doctors XI", "Priya Sharma"],
          [2, "Powerplay Pirates", "Nikhil Rao"],
          [3, "Yorker Kings", "Sneha Iyer"],
          [4, "Boundary Riders", "Karan Gupta"],
        ],
        TeamPick: [
          [1, 1, "Rohan Iyer", 1],
          [2, 1, "Kabir Khan", 0],
          [3, 2, "Arjun Nair", 0],
          [4, 2, "Dev Mehta", 0],
          [5, 3, "Vikram Rao", 0],
          [6, 3, "Ishaan Bose", 1],
        ],
      },
    ],
    gen: (rng) => {
      const nt = ri(rng, 1, 8);
      const managers = people(rng, nt);
      const teams: Cell[][] = seq(1, nt).map((id) => [id, `Team ${String.fromCharCode(64 + id)} XI`, managers[id - 1]!]);
      const picks: Cell[][] = [];
      let pid = 1;
      for (let t = 1; t <= nt; t++) {
        const k = chance(rng, 0.15) ? 0 : ri(rng, 1, 4);
        const cap = chance(rng, 0.55) ? ri(rng, 0, k - 1) : -1;
        for (let j = 0; j < k; j++) picks.push([pid++, t, pick(rng, FIRST_NAMES), j === cap ? 1 : 0]);
      }
      return { FantasyTeam: teams, TeamPick: shuffle(rng, picks) };
    },
    solution: [
      "SELECT t.team_name, t.manager",
      "FROM FantasyTeam t",
      "WHERE NOT EXISTS (",
      "  SELECT 1 FROM TeamPick p",
      "  WHERE p.team_id = t.team_id AND p.is_captain = 1",
      ")",
    ].join("\n"),
    alternatives: [
      "SELECT t.team_name, t.manager FROM FantasyTeam t LEFT JOIN TeamPick p ON p.team_id = t.team_id AND p.is_captain = 1 WHERE p.pick_id IS NULL",
      "SELECT team_name, manager FROM FantasyTeam WHERE team_id NOT IN (SELECT team_id FROM TeamPick WHERE is_captain = 1)",
    ],
    hints: [
      "You are looking for teams that have *no* row of a certain kind — an anti join.",
      "The row you are looking for is a pick of that team with `is_captain = 1`.",
      "If you use a LEFT JOIN, put the captain condition in the ON clause: in WHERE it would discard the teams that have picks but no captain.",
    ],
    editorial: [
      "The answer is the teams for which a certain row does not exist — a captain pick — which is an **anti join**. `NOT EXISTS` says it directly: for each team, look for a pick of that team with `is_captain = 1`, and keep the team if there is none. A team with no picks at all has nothing to find, so it is kept too, as the statement asks.",
      "",
      "The LEFT JOIN form needs care with where the captain condition goes. In the `ON` clause it means \"join only the captain pick\", so a team without one gets a single row of NULLs, which `p.pick_id IS NULL` keeps. Moved to `WHERE`, the condition would run after the join and remove the NULL rows — leaving only teams that do have a captain, the opposite of the question.",
      "",
      "`NOT IN` works here because `team_id` is never NULL in `TeamPick`. Each form is one lookup per team with an index on `TeamPick(team_id)`.",
    ].join("\n"),
  },

  {
    slug: "overseas-players-in-the-auction-pool",
    title: "Overseas Players in the Auction Pool by Role",
    difficulty: "EASY",
    topics: ["Strings"],
    description: [
      "Every player registered for the T20 auction gets a code `<origin>-<role>-<number>`: the origin is `IN` for an Indian player or `OS` for an overseas one, the role is `BAT`, `BWL`, `AR` (all-rounder) or `WK` (wicket-keeper), and the number is four digits, for example `OS-AR-0412`.",
      "",
      "Franchises can sign only a few overseas players, so the auctioneer wants them listed separately. Return every **overseas** player with the columns `player_name`, `role` (the middle part of the code, such as `AR`) and `base_price_lakh`. Order the rows by `base_price_lakh` descending, then by `player_name`.",
    ].join("\n"),
    tables: [
      {
        name: "AuctionPool",
        columns: [
          { name: "player_id", type: "int" },
          { name: "player_name", type: "varchar" },
          { name: "reg_code", type: "varchar" },
          { name: "base_price_lakh", type: "int" },
        ],
        primaryKey: ["player_id"],
        note: "One row per registered player. `reg_code` is always in upper case and well formed; `base_price_lakh` is the reserve price in lakh rupees.",
      },
    ],
    examples: [
      {
        AuctionPool: [
          [1, "Liam Brooks", "OS-BAT-0231", 200],
          [2, "Rohan Iyer", "IN-BWL-0042", 50],
          [3, "Noah Fernando", "OS-AR-0412", 150],
          [4, "David Malan", "OS-WK-0118", 200],
          [5, "Kabir Khan", "IN-AR-0077", 100],
          [6, "Alex Carter", "OS-BWL-0390", 75],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 16);
      const who = people(rng, n);
      const nums = sample(rng, seq(1, 999), n);
      const rows: Cell[][] = who.map((name, i) => {
        const origin = chance(rng, 0.5) ? "OS" : "IN";
        const role = pick(rng, ["BAT", "BWL", "AR", "WK"] as const);
        return [i + 1, name, `${origin}-${role}-${String(nums[i]).padStart(4, "0")}`, pick(rng, [20, 30, 50, 75, 100, 150, 200] as const)];
      });
      return { AuctionPool: rows };
    },
    solution: [
      "SELECT player_name,",
      "       SUBSTRING_INDEX(SUBSTRING_INDEX(reg_code, '-', 2), '-', -1) AS role,",
      "       base_price_lakh",
      "FROM AuctionPool",
      "WHERE reg_code LIKE 'OS-%'",
      "ORDER BY base_price_lakh DESC, player_name",
    ].join("\n"),
    alternatives: [
      "SELECT player_name, SUBSTRING(reg_code, 4, CHAR_LENGTH(reg_code) - 8) AS role, base_price_lakh FROM AuctionPool WHERE LEFT(reg_code, 2) = 'OS' ORDER BY base_price_lakh DESC, player_name",
      "SELECT player_name, REPLACE(SUBSTRING(reg_code, 4), RIGHT(reg_code, 5), '') AS role, base_price_lakh FROM AuctionPool WHERE SUBSTRING(reg_code, 1, 3) = 'OS-' ORDER BY base_price_lakh DESC, player_name",
    ],
    ordered: true,
    hints: [
      "The origin is the first two characters of the code — `LIKE 'OS-%'` or `LEFT(reg_code, 2)` finds the overseas players.",
      "The role is between the first and the second hyphen, and it is two or three characters long.",
      "`SUBSTRING_INDEX(s, '-', 2)` keeps everything before the second hyphen; a second `SUBSTRING_INDEX` with `-1` keeps what follows the last hyphen of that.",
    ],
    editorial: [
      "Two string operations answer this: a prefix test for the origin and an extraction for the role.",
      "",
      "The origin is always the first two letters, so `reg_code LIKE 'OS-%'` (or `LEFT(reg_code, 2) = 'OS'`) keeps the overseas players. The role is harder because it is not a fixed width — `AR` and `WK` have two letters, `BAT` and `BWL` three — so a fixed `SUBSTRING(reg_code, 4, 3)` would return `AR-` for an all-rounder. `SUBSTRING_INDEX` splits on the delimiter instead: `SUBSTRING_INDEX(reg_code, '-', 2)` is `OS-AR`, and taking the part after its last hyphen with `-1` gives `AR`.",
      "",
      "Because the origin (`OS-`) and the tail (`-0412`) have fixed lengths, the role is also everything from position 4 with eight characters fewer than the whole code, which is the first alternative. The order is by price, highest first, with names breaking ties. Each row is examined once.",
    ].join("\n"),
  },

  {
    slug: "football-attendance-by-stadium",
    title: "Season Attendance at Each Football Stadium",
    difficulty: "EASY",
    topics: ["Aggregation"],
    description: [
      "The league's commercial team is reviewing how full each ground was this season. A fixture played behind closed doors has NULL `attendance`; it still counts as a match played at that stadium.",
      "",
      "Return one row per stadium with the columns `stadium`, `matches` (every fixture played there) and `total_attendance` (the sum of the recorded crowds, **0** when none was recorded). Order the rows by `total_attendance` descending, then by `stadium`.",
    ].join("\n"),
    tables: [
      {
        name: "StadiumFixture",
        columns: [
          { name: "match_id", type: "int" },
          { name: "stadium", type: "varchar" },
          { name: "match_date", type: "date" },
          { name: "attendance", type: "int" },
        ],
        primaryKey: ["match_id"],
        note: "One row per fixture played. `attendance` is NULL for a match behind closed doors.",
      },
    ],
    examples: [
      {
        StadiumFixture: [
          [1, "Salt Lake Bowl", "2024-10-05", 41200],
          [2, "Fort Ground", "2024-10-06", 18500],
          [3, "Salt Lake Bowl", "2024-10-19", null],
          [4, "Coastal Arena", "2024-10-20", null],
          [5, "Fort Ground", "2024-11-02", 22700],
          [6, "Hillside Park", "2024-11-03", 40000],
          [7, "Salt Lake Bowl", "2024-11-16", 38900],
        ],
      },
    ],
    gen: (rng) => {
      const grounds = sample(rng, STADIUMS, ri(rng, 1, 5));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 18);
      const crowds = [12000, 18500, 25000, 32000, 40000];
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        pick(rng, grounds),
        dateBetween(rng, "2024-08-01", "2025-03-31"),
        maybeNull(rng, 0.2, chance(rng, 0.4) ? pick(rng, crowds) : roundTo(rng, 5000, 45000, 100)),
      ]);
      return { StadiumFixture: rows };
    },
    solution: [
      "SELECT stadium,",
      "       COUNT(*) AS matches,",
      "       COALESCE(SUM(attendance), 0) AS total_attendance",
      "FROM StadiumFixture",
      "GROUP BY stadium",
      "ORDER BY total_attendance DESC, stadium",
    ].join("\n"),
    alternatives: [
      "SELECT stadium, COUNT(match_id) AS matches, SUM(IFNULL(attendance, 0)) AS total_attendance FROM StadiumFixture GROUP BY stadium ORDER BY SUM(IFNULL(attendance, 0)) DESC, stadium",
    ],
    ordered: true,
    hints: [
      "One output row per stadium means GROUP BY stadium.",
      "`COUNT(*)` counts every fixture; `COUNT(attendance)` would skip the closed-door ones.",
      "`SUM` of a group whose values are all NULL is NULL, not 0 — wrap it.",
    ],
    editorial: [
      "Grouping by `stadium` gives one row per ground; two aggregates fill it in. The point of the exercise is how each aggregate treats NULL.",
      "",
      "`COUNT(*)` counts rows, so a closed-door fixture counts as a match — as the statement requires. `COUNT(attendance)` would skip it, because counting a column ignores its NULLs. `SUM(attendance)` also ignores NULLs, which is what we want for the total, but a stadium whose every fixture was behind closed doors has nothing to add up, and SQL returns NULL for the sum of an empty set, not 0. `COALESCE(SUM(attendance), 0)` turns that into 0; summing `IFNULL(attendance, 0)` instead, as the alternative does, gets the same result by replacing the NULLs before adding.",
      "",
      "The ordering puts the biggest crowds first, and the stadium name settles equal totals (two closed-door grounds both at 0, for instance). One scan, one grouping.",
    ].join("\n"),
  },

  {
    slug: "t20-fixtures-on-weekends-in-2024",
    title: "T20 League Fixtures Played on a Weekend in 2024",
    difficulty: "EASY",
    topics: ["Dates"],
    description: [
      "Weekend matches carry a higher ticket price, so the finance team wants the list of them for the 2024 calendar year. The league's season spills over from December into January, so the table holds fixtures from more than one year.",
      "",
      "Return every fixture played on a **Saturday or Sunday** with a `match_date` in **2024**, with the columns `match_id`, `match_date` and `day_name` (the full English name of the day, such as `Saturday`). Order the rows by `match_date`, then by `match_id`.",
    ].join("\n"),
    tables: [
      {
        name: "T20Fixture",
        columns: [
          { name: "match_id", type: "int" },
          { name: "match_date", type: "date" },
          { name: "home_team", type: "varchar" },
          { name: "away_team", type: "varchar" },
        ],
        primaryKey: ["match_id"],
        note: "One row per scheduled league fixture.",
      },
    ],
    examples: [
      {
        T20Fixture: [
          [1, "2023-12-30", "Mumbai Monarchs", "Chennai Cheetahs"],
          [2, "2024-01-05", "Delhi Defenders", "Jaipur Jaguars"],
          [3, "2024-01-06", "Kolkata Krakens", "Punjab Pioneers"],
          [4, "2024-01-07", "Chennai Cheetahs", "Delhi Defenders"],
          [5, "2024-01-07", "Lucknow Lancers", "Mumbai Monarchs"],
          [6, "2024-01-10", "Jaipur Jaguars", "Kolkata Krakens"],
          [7, "2024-12-28", "Punjab Pioneers", "Lucknow Lancers"],
          [8, "2025-01-04", "Mumbai Monarchs", "Delhi Defenders"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 18);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const [home, away] = sample(rng, T20_TEAMS, 2);
        const when = chance(rng, 0.5) ? dateBetween(rng, "2023-12-15", "2024-01-31") : dateBetween(rng, "2024-12-10", "2025-01-20");
        return [id, when, home!, away!];
      });
      return { T20Fixture: rows };
    },
    solution: [
      "SELECT match_id, match_date, DAYNAME(match_date) AS day_name",
      "FROM T20Fixture",
      "WHERE YEAR(match_date) = 2024",
      "  AND DAYOFWEEK(match_date) IN (1, 7)",
      "ORDER BY match_date, match_id",
    ].join("\n"),
    alternatives: [
      "SELECT match_id, match_date, DAYNAME(match_date) AS day_name FROM T20Fixture WHERE match_date BETWEEN '2024-01-01' AND '2024-12-31' AND WEEKDAY(match_date) >= 5 ORDER BY match_date, match_id",
      "SELECT match_id, match_date, DAYNAME(match_date) AS day_name FROM T20Fixture WHERE DATE_FORMAT(match_date, '%Y') = '2024' AND DAYNAME(match_date) IN ('Saturday', 'Sunday') ORDER BY match_date, match_id",
    ],
    ordered: true,
    hints: [
      "`YEAR(match_date)` or a date range keeps 2024 only.",
      "`DAYOFWEEK` numbers Sunday as 1 and Saturday as 7; `WEEKDAY` numbers Monday as 0 and Sunday as 6.",
      "`DAYNAME` gives the day's name for the output column.",
    ],
    editorial: [
      "Two date conditions and one date function. The year filter can be `YEAR(match_date) = 2024` or a range `BETWEEN '2024-01-01' AND '2024-12-31'`; the range form can use an index on `match_date`, because it does not wrap the column in a function.",
      "",
      "For the weekend, MySQL offers two numberings and it is easy to mix them up. `DAYOFWEEK` follows the ODBC convention, Sunday = 1 through Saturday = 7, so the weekend is `IN (1, 7)`. `WEEKDAY` starts at Monday = 0, so Saturday and Sunday are 5 and 6 and the test is `>= 5`. Comparing `DAYNAME(...)` with the names also works. All three agree.",
      "",
      "The example includes fixtures on 30 December 2023 and 4 January 2025, both on weekends, to show why the year filter is needed. The output is ordered by date, with `match_id` breaking the tie between two matches on one day. One scan of the table.",
    ].join("\n"),
  },

  {
    slug: "batters-with-the-most-ducks",
    title: "Batters Who Were Out for a Duck This Season",
    difficulty: "EASY",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "A **duck** is an innings in which the batter was **dismissed** without scoring. A batter who ends on 0 not out has not made a duck.",
      "",
      "Return each batter who made at least one duck, with the columns `batter` and `ducks` (how many innings they were out for 0). Order the rows by `ducks` descending, then by `batter` alphabetically.",
    ].join("\n"),
    tables: [
      {
        name: "Scorecard",
        columns: [
          { name: "innings_id", type: "int" },
          { name: "match_id", type: "int" },
          { name: "batter", type: "varchar" },
          { name: "runs", type: "int" },
          { name: "balls_faced", type: "int" },
          { name: "dismissed", type: "bool" },
        ],
        primaryKey: ["innings_id"],
        note: "One row per batter per innings. `dismissed` is 1 if the batter was out and 0 if not out.",
      },
    ],
    examples: [
      {
        Scorecard: [
          [1, 301, "Rohan Iyer", 0, 1, 1],
          [2, 301, "Kabir Khan", 0, 2, 0],
          [3, 302, "Rohan Iyer", 34, 22, 1],
          [4, 302, "Arjun Nair", 0, 4, 1],
          [5, 303, "Rohan Iyer", 0, 3, 1],
          [6, 303, "Kabir Khan", 0, 1, 1],
          [7, 303, "Dev Mehta", 51, 30, 0],
        ],
      },
    ],
    gen: (rng) => {
      const batters = people(rng, ri(rng, 1, 7));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 22);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const zero = chance(rng, 0.45);
        const runs = zero ? 0 : ri(rng, 1, 80);
        return [id, ri(rng, 301, 312), pick(rng, batters), runs, zero ? ri(rng, 1, 6) : ri(rng, runs > 6 ? Math.ceil(runs / 6) : 1, runs + 10), chance(rng, 0.7) ? 1 : 0];
      });
      return { Scorecard: rows };
    },
    solution: [
      "SELECT batter, COUNT(*) AS ducks",
      "FROM Scorecard",
      "WHERE runs = 0 AND dismissed = 1",
      "GROUP BY batter",
      "ORDER BY ducks DESC, batter",
    ].join("\n"),
    alternatives: [
      "SELECT batter, SUM(CASE WHEN runs = 0 AND dismissed = 1 THEN 1 ELSE 0 END) AS ducks FROM Scorecard GROUP BY batter HAVING SUM(CASE WHEN runs = 0 AND dismissed = 1 THEN 1 ELSE 0 END) > 0 ORDER BY ducks DESC, batter",
    ],
    ordered: true,
    hints: [
      "A duck needs two things at once: zero runs and a dismissal.",
      "Filter the ducks first, then count them per batter.",
      "If you count with a CASE over every innings instead, drop the batters whose count is 0 with HAVING.",
    ],
    editorial: [
      "The definition has two parts — `runs = 0` and `dismissed = 1` — and the not-out zero is the trap: Kabir's 0 not out in match 301 is not a duck, his 0 in match 303 is.",
      "",
      "The direct plan filters the ducks in `WHERE` and then groups by batter and counts. Because the filter runs before grouping, a batter with no ducks has no rows left and never appears, which is exactly the rule asked for.",
      "",
      "Conditional aggregation is the other common shape: group every innings by batter and count the ducks with `SUM(CASE WHEN … THEN 1 ELSE 0 END)`. That keeps every batter, including those with a count of 0, so a `HAVING … > 0` is needed to drop them. It is the better shape when you want several counts side by side (ducks, fifties, not-outs) in one pass.",
      "",
      "Order by the count, highest first, and by name for equal counts. One scan and one grouping.",
    ].join("\n"),
  },
  // ──────────────────────────── MEDIUM ────────────────────────────
  {
    slug: "football-league-table-with-goal-difference",
    title: "Football League Table With Points and Goal Difference",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Subqueries"],
    description: [
      "Build the league table from the results. A win is worth **3 points**, a draw **1**, a defeat 0. Every team plays both home and away, and a team appears in the table once it has played at least one match.",
      "",
      "Return one row per team with the columns `team`, `played`, `won`, `drawn`, `lost`, `goals_for`, `goals_against`, `goal_difference` (`goals_for - goals_against`) and `points`. Order the rows by `points` descending, then `goal_difference` descending, then `goals_for` descending, then `team` alphabetically.",
    ].join("\n"),
    tables: [
      {
        name: "LeagueMatch",
        columns: [
          { name: "match_id", type: "int" },
          { name: "match_date", type: "date" },
          { name: "home_team", type: "varchar" },
          { name: "away_team", type: "varchar" },
          { name: "home_goals", type: "int" },
          { name: "away_goals", type: "int" },
        ],
        primaryKey: ["match_id"],
        note: "One row per match played; goals are never NULL. `home_team` and `away_team` are always different clubs.",
      },
    ],
    examples: [
      {
        LeagueMatch: [
          [1, "2024-09-07", "Goa Gulls", "Pune Rovers", 2, 0],
          [2, "2024-09-08", "Delhi Falcons", "Kerala Kingfishers", 1, 1],
          [3, "2024-09-14", "Pune Rovers", "Delhi Falcons", 3, 1],
          [4, "2024-09-15", "Kerala Kingfishers", "Goa Gulls", 2, 2],
          [5, "2024-09-21", "Goa Gulls", "Delhi Falcons", 0, 1],
          [6, "2024-09-22", "Kerala Kingfishers", "Pune Rovers", 2, 0],
        ],
      },
    ],
    gen: (rng) => {
      const clubs = sample(rng, CLUBS, ri(rng, 2, 6));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 16);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const [home, away] = sample(rng, clubs, 2);
        return [id, addDays("2024-08-17", id * 3), home!, away!, ri(rng, 0, 3), ri(rng, 0, 3)];
      });
      return { LeagueMatch: rows };
    },
    solution: [
      "WITH side AS (",
      "  SELECT home_team AS team, home_goals AS gf, away_goals AS ga FROM LeagueMatch",
      "  UNION ALL",
      "  SELECT away_team, away_goals, home_goals FROM LeagueMatch",
      ")",
      "SELECT team,",
      "       COUNT(*) AS played,",
      "       SUM(CASE WHEN gf > ga THEN 1 ELSE 0 END) AS won,",
      "       SUM(CASE WHEN gf = ga THEN 1 ELSE 0 END) AS drawn,",
      "       SUM(CASE WHEN gf < ga THEN 1 ELSE 0 END) AS lost,",
      "       SUM(gf) AS goals_for,",
      "       SUM(ga) AS goals_against,",
      "       SUM(gf) - SUM(ga) AS goal_difference,",
      "       SUM(CASE WHEN gf > ga THEN 3 WHEN gf = ga THEN 1 ELSE 0 END) AS points",
      "FROM side",
      "GROUP BY team",
      "ORDER BY points DESC, goal_difference DESC, goals_for DESC, team",
    ].join("\n"),
    alternatives: [
      [
        "SELECT t.team,",
        "       COUNT(*) AS played,",
        "       SUM(CASE WHEN (m.home_team = t.team AND m.home_goals > m.away_goals) OR (m.away_team = t.team AND m.away_goals > m.home_goals) THEN 1 ELSE 0 END) AS won,",
        "       SUM(CASE WHEN m.home_goals = m.away_goals THEN 1 ELSE 0 END) AS drawn,",
        "       SUM(CASE WHEN (m.home_team = t.team AND m.home_goals < m.away_goals) OR (m.away_team = t.team AND m.away_goals < m.home_goals) THEN 1 ELSE 0 END) AS lost,",
        "       SUM(IF(m.home_team = t.team, m.home_goals, m.away_goals)) AS goals_for,",
        "       SUM(IF(m.home_team = t.team, m.away_goals, m.home_goals)) AS goals_against,",
        "       SUM(IF(m.home_team = t.team, m.home_goals - m.away_goals, m.away_goals - m.home_goals)) AS goal_difference,",
        "       3 * SUM(CASE WHEN (m.home_team = t.team AND m.home_goals > m.away_goals) OR (m.away_team = t.team AND m.away_goals > m.home_goals) THEN 1 ELSE 0 END) + SUM(CASE WHEN m.home_goals = m.away_goals THEN 1 ELSE 0 END) AS points",
        "FROM (SELECT home_team AS team FROM LeagueMatch UNION SELECT away_team FROM LeagueMatch) t",
        "JOIN LeagueMatch m ON m.home_team = t.team OR m.away_team = t.team",
        "GROUP BY t.team",
        "ORDER BY points DESC, goal_difference DESC, goals_for DESC, t.team",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Each match concerns two teams, but one row of the table concerns one. Turn every match into two rows — one from each side's point of view.",
      "`UNION ALL` of a home view (`home_team`, `home_goals` as scored, `away_goals` as conceded) and an away view gives one row per team per match.",
      "With that, wins, draws, defeats and points are conditional sums over each team's rows.",
    ],
    editorial: [
      "The difficulty is that a match row is about two teams, and the table is about one. The clean way out is to **unpivot**: write each match twice, once as the home side saw it and once as the away side saw it. In the home view the goals scored are `home_goals` and conceded `away_goals`; in the away view they swap. `UNION ALL` (not `UNION`, which would merge two identical scorelines of one team) stacks them into `side`, one row per team per match.",
      "",
      "Now every column of the table is an aggregate over a team's rows: `COUNT(*)` matches played, conditional sums for won/drawn/lost, plain sums for goals, their difference, and points as `3` per win and `1` per draw.",
      "",
      "The alternative keeps the matches as they are and joins each team to every match it played in (`home_team = team OR away_team = team`), choosing the side with `IF`. It works but every column has to repeat the which-side logic. The ordering is the usual tie-break chain, ending on the team's name so the table is fully determined. Both plans are linear in the number of matches.",
    ].join("\n"),
  },

  {
    slug: "highest-partnership-in-each-t20-match",
    title: "Highest Batting Partnership in Each T20 Match",
    difficulty: "MEDIUM",
    topics: ["Window Functions"],
    description: [
      "A partnership is the runs two batters add together while they are at the crease, recorded by the wicket that ended it (`wicket_no` 1 is the opening stand). The commentary team wants the best stand of every match, across both innings.",
      "",
      "Return, for every match, the partnership(s) with the **most runs** in that match — if several share the top total, return all of them. Columns: `match_id`, `innings_no`, `wicket_no`, `batters` (the two names joined as `batter_one & batter_two`, for example `Rohan Iyer & Kabir Khan`) and `runs`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Partnership",
        columns: [
          { name: "match_id", type: "int" },
          { name: "innings_no", type: "int" },
          { name: "wicket_no", type: "int" },
          { name: "batter_one", type: "varchar" },
          { name: "batter_two", type: "varchar" },
          { name: "runs", type: "int" },
          { name: "balls", type: "int" },
        ],
        primaryKey: ["match_id", "innings_no", "wicket_no"],
        note: "One row per partnership. `innings_no` is 1 or 2.",
      },
    ],
    examples: [
      {
        Partnership: [
          [401, 1, 1, "Rohan Iyer", "Kabir Khan", 68, 41],
          [401, 1, 2, "Kabir Khan", "Arjun Nair", 22, 15],
          [401, 2, 1, "Dev Mehta", "Vikram Rao", 91, 50],
          [401, 2, 2, "Vikram Rao", "Ishaan Bose", 14, 9],
          [402, 1, 1, "Arjun Nair", "Rohan Iyer", 40, 28],
          [402, 1, 3, "Kabir Khan", "Farhan Patel", 55, 30],
          [402, 2, 1, "Dev Mehta", "Harsh Joshi", 55, 37],
          [403, 1, 1, "Ishaan Bose", "Vikram Rao", 12, 10],
        ],
      },
    ],
    gen: (rng) => {
      const batters = people(rng, 10);
      const rows: Cell[][] = [];
      const matches = chance(rng, 0.05) ? 0 : ri(rng, 1, 5);
      for (let m = 0; m < matches; m++) {
        const pool = [10, 25, 40, 55, 70];
        for (let inn = 1; inn <= 2; inn++) {
          const k = ri(rng, 0, 4);
          for (let w = 1; w <= k; w++) {
            const [a, b] = sample(rng, batters, 2);
            const runs = chance(rng, 0.4) ? pick(rng, pool) : ri(rng, 0, 110);
            rows.push([501 + m, inn, w, a!, b!, runs, Math.max(1, Math.round(runs * (0.6 + rng())))]);
          }
        }
      }
      return { Partnership: rows };
    },
    solution: [
      "SELECT match_id, innings_no, wicket_no, CONCAT(batter_one, ' & ', batter_two) AS batters, runs",
      "FROM (",
      "  SELECT p.*, RANK() OVER (PARTITION BY match_id ORDER BY runs DESC) AS rnk",
      "  FROM Partnership p",
      ") ranked",
      "WHERE rnk = 1",
    ].join("\n"),
    alternatives: [
      "SELECT p.match_id, p.innings_no, p.wicket_no, CONCAT(p.batter_one, ' & ', p.batter_two) AS batters, p.runs FROM Partnership p JOIN (SELECT match_id, MAX(runs) AS best FROM Partnership GROUP BY match_id) b ON b.match_id = p.match_id AND b.best = p.runs",
      "SELECT match_id, innings_no, wicket_no, CONCAT(batter_one, ' & ', batter_two) AS batters, runs FROM Partnership p WHERE NOT EXISTS (SELECT 1 FROM Partnership q WHERE q.match_id = p.match_id AND q.runs > p.runs)",
    ],
    hints: [
      "\"The best in each group, keeping ties\" is a ranking within a partition.",
      "`RANK()` gives tied rows the same rank, so every partnership equal to the top total gets rank 1; `ROW_NUMBER()` would keep only one of them.",
      "Partition by the match only — the statement compares both innings together.",
    ],
    editorial: [
      "This is **top-1 per group with ties**. `RANK() OVER (PARTITION BY match_id ORDER BY runs DESC)` numbers the partnerships within each match from the biggest down, and two stands with equal runs get the same rank. Keeping rank 1 returns every partnership equal to the match's best — in match 402 both 55-run stands, one in each innings. `ROW_NUMBER` would pick one of the two arbitrarily, which is wrong here; `DENSE_RANK` would also work for rank 1.",
      "",
      "The partition is the match, not the innings: an outstanding first-innings stand can beat everything in the chase, and the question is about the match as a whole.",
      "",
      "Two classic alternatives: join to the per-match `MAX(runs)` and keep the rows that equal it, or keep a partnership when no other in its match has more runs (`NOT EXISTS`). All three return ties. `CONCAT` builds the display name; neither name column is ever NULL. The window plan is one sort by match and runs.",
    ].join("\n"),
  },

  {
    slug: "best-bowling-figures-of-each-bowler",
    title: "Best Bowling Figures of Each Bowler This Season",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Strings", "Joins"],
    description: [
      "In cricket a bowler's **best figures** are the spell with the **most wickets**; among spells with equal wickets, the one with the **fewest runs** conceded is better. If two spells are identical, the **earlier** match counts as the best.",
      "",
      "Return one row per bowler with the columns `bowler`, `best_figures` (written `wickets/runs`, for example `4/23`) and `match_date` (the date of the match of that spell). Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Spell",
        columns: [
          { name: "spell_id", type: "int" },
          { name: "match_id", type: "int" },
          { name: "bowler", type: "varchar" },
          { name: "wickets", type: "int" },
          { name: "runs_conceded", type: "int" },
        ],
        primaryKey: ["spell_id"],
        note: "One row per bowler per match they bowled in; a bowler bowls at most one spell in a match. `match_id` is always in `LeagueGame`.",
      },
      {
        name: "LeagueGame",
        columns: [
          { name: "match_id", type: "int" },
          { name: "match_date", type: "date" },
          { name: "venue", type: "varchar" },
        ],
        primaryKey: ["match_id"],
        note: "One row per match; no two matches share a date.",
      },
    ],
    examples: [
      {
        Spell: [
          [1, 1, "Aarav Das", 3, 28],
          [2, 2, "Aarav Das", 4, 31],
          [3, 3, "Aarav Das", 4, 23],
          [4, 1, "Farhan Patel", 2, 18],
          [5, 3, "Farhan Patel", 2, 18],
          [6, 2, "Ishaan Bose", 0, 40],
          [7, 4, "Ishaan Bose", 1, 35],
        ],
        LeagueGame: [
          [1, "2024-04-02", "Riverside Oval"],
          [2, "2024-04-06", "Fort Ground"],
          [3, "2024-04-11", "Coastal Arena"],
          [4, "2024-04-15", "Hillside Park"],
        ],
      },
    ],
    gen: (rng) => {
      const nm = ri(rng, 1, 6);
      const days = sample(rng, seq(0, 50), nm).sort((a, b) => a - b);
      const games: Cell[][] = days.map((d, i) => [i + 1, addDays("2024-03-22", d), pick(rng, STADIUMS)]);
      const bowlers = people(rng, ri(rng, 1, 6));
      const spells: Cell[][] = [];
      let id = 1;
      for (const b of bowlers) {
        for (const m of sample(rng, seq(1, nm), ri(rng, chance(rng, 0.1) ? 0 : 1, nm))) {
          // A small pool of figures so equal wickets and identical spells happen.
          spells.push([id++, m, b, ri(rng, 0, 4), pick(rng, [18, 23, 28, 31, 35, 40, ri(rng, 10, 50)])]);
        }
      }
      return { Spell: shuffle(rng, spells), LeagueGame: games };
    },
    solution: [
      "SELECT bowler, CONCAT(wickets, '/', runs_conceded) AS best_figures, match_date",
      "FROM (",
      "  SELECT s.bowler, s.wickets, s.runs_conceded, g.match_date,",
      "         ROW_NUMBER() OVER (PARTITION BY s.bowler ORDER BY s.wickets DESC, s.runs_conceded, g.match_date) AS rn",
      "  FROM Spell s",
      "  JOIN LeagueGame g ON g.match_id = s.match_id",
      ") ranked",
      "WHERE rn = 1",
    ].join("\n"),
    alternatives: [
      [
        "SELECT s.bowler, CONCAT(s.wickets, '/', s.runs_conceded) AS best_figures, g.match_date",
        "FROM Spell s JOIN LeagueGame g ON g.match_id = s.match_id",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM Spell t JOIN LeagueGame h ON h.match_id = t.match_id",
        "  WHERE t.bowler = s.bowler",
        "    AND (t.wickets > s.wickets",
        "      OR (t.wickets = s.wickets AND t.runs_conceded < s.runs_conceded)",
        "      OR (t.wickets = s.wickets AND t.runs_conceded = s.runs_conceded AND h.match_date < g.match_date))",
        ")",
      ].join("\n"),
    ],
    hints: [
      "\"Best\" is an ordering with three keys: wickets (high first), runs (low first), date (early first).",
      "Join the spells to the matches to get each spell's date, then number each bowler's spells in that order.",
      "Because the date breaks the last tie, exactly one spell per bowler gets number 1 — `ROW_NUMBER` is the right function here.",
      "`CONCAT` accepts numbers and turns them into text.",
    ],
    editorial: [
      "Best figures are defined by an ordering, so the natural tool is a ranking window. First join `Spell` to `LeagueGame` to bring in each spell's date. Then `ROW_NUMBER() OVER (PARTITION BY bowler ORDER BY wickets DESC, runs_conceded, match_date)` numbers each bowler's spells from best to worst: more wickets first, fewer runs among equal wickets, the earlier match among identical spells. The statement's rules make that order total — a bowler has at most one spell per match and matches have distinct dates — so `ROW_NUMBER` is safe and exactly one row per bowler gets 1.",
      "",
      "The display string is `CONCAT(wickets, '/', runs_conceded)`, where `CONCAT` converts the numbers to text.",
      "",
      "The `NOT EXISTS` alternative says the same as a comparison: keep a spell when no other spell of the bowler beats it on wickets, or ties on wickets and beats it on runs, or ties on both and came earlier. It is easy to get the OR-chain wrong; the window states the order once. The window plan is one sort per bowler.",
    ].join("\n"),
  },

  {
    slug: "death-overs-economy-from-ball-by-ball-data",
    title: "Death-Overs Economy From Ball-by-Ball Data",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Aggregation"],
    description: [
      "The analytics team rates bowlers on the **death overs**, overs 17 to 20 of an innings. From the ball-by-ball feed, a bowler is charged with the runs off the bat plus the extra runs of wides and no-balls; **byes and leg-byes are not charged** to the bowler. Wides and no-balls are not legal deliveries and do not count as balls bowled; every other delivery does.",
      "",
      "Return each bowler with **at least 12 legal deliveries** in overs 17–20, with the columns `bowler`, `legal_balls`, `runs_conceded` and `economy` = `runs_conceded * 6 / legal_balls`, rounded to 2 decimal places. Order the rows by `economy` ascending, then by `bowler`.",
    ].join("\n"),
    tables: [
      {
        name: "Delivery",
        columns: [
          { name: "delivery_id", type: "int" },
          { name: "match_id", type: "int" },
          { name: "over_no", type: "int" },
          { name: "bowler", type: "varchar" },
          { name: "batter_runs", type: "int" },
          { name: "extra_runs", type: "int" },
          { name: "extra_type", type: "enum", values: ["none", "wide", "noball", "bye", "legbye"] },
        ],
        primaryKey: ["delivery_id"],
        note: "One row per delivery. `over_no` is 1–20. `extra_runs` is 0 when `extra_type` is `none`.",
      },
    ],
    examples: [
      {
        Delivery: [
          ...seq(1, 12).map((i): Cell[] => [i, 601, 18, "Aarav Das", i % 4 === 0 ? 4 : 1, 0, "none"]),
          [13, 601, 18, "Aarav Das", 0, 1, "wide"],
          [14, 601, 19, "Aarav Das", 0, 4, "legbye"],
          ...seq(15, 12).map((i): Cell[] => [i, 601, 19, "Farhan Patel", i % 3 === 0 ? 0 : 2, 0, "none"]),
          [27, 601, 20, "Farhan Patel", 6, 1, "noball"],
          [28, 601, 5, "Farhan Patel", 4, 0, "none"],
          ...seq(29, 6).map((i): Cell[] => [i, 601, 17, "Ishaan Bose", 1, 0, "none"]),
        ],
      },
    ],
    gen: (rng) => {
      const bowlers = people(rng, ri(rng, 1, 4));
      const rows: Cell[][] = [];
      let id = 1;
      for (const b of bowlers) {
        const target = chance(rng, 0.2) ? ri(rng, 6, 12) : ri(rng, 12, 24);
        let legal = 0;
        let runs = 0;
        const add = (over: number, bat: number, ex: number, type: string) => {
          rows.push([id++, ri(rng, 701, 703), over, b, bat, ex, type]);
        };
        while (legal < target) {
          const r = rng();
          const over = chance(rng, 0.85) ? ri(rng, 17, 20) : ri(rng, 1, 16);
          const death = over >= 17;
          if (r < 0.08) {
            add(over, 0, 1, "wide");
            if (death) runs += 1;
          } else if (r < 0.12) {
            const bat = pick(rng, [0, 1, 4, 6]);
            add(over, bat, 1, "noball");
            if (death) runs += bat + 1;
          } else if (r < 0.18) {
            add(over, 0, ri(rng, 1, 4), pick(rng, ["bye", "legbye"]));
            if (death) legal++;
          } else {
            const bat = pick(rng, [0, 0, 1, 1, 2, 4, 6]);
            add(over, bat, 0, "none");
            if (death) {
              legal++;
              runs += bat;
            }
          }
        }
        // Keep the shown economy away from a half-way rounding.
        while (nearHalf(runs * 6, legal)) {
          add(20, 0, 0, "none");
          legal++;
        }
      }
      return { Delivery: rows };
    },
    solution: [
      "SELECT bowler,",
      "       SUM(CASE WHEN extra_type IN ('wide', 'noball') THEN 0 ELSE 1 END) AS legal_balls,",
      "       SUM(batter_runs + CASE WHEN extra_type IN ('wide', 'noball') THEN extra_runs ELSE 0 END) AS runs_conceded,",
      "       ROUND(SUM(batter_runs + CASE WHEN extra_type IN ('wide', 'noball') THEN extra_runs ELSE 0 END) * 6",
      "             / SUM(CASE WHEN extra_type IN ('wide', 'noball') THEN 0 ELSE 1 END), 2) AS economy",
      "FROM Delivery",
      "WHERE over_no BETWEEN 17 AND 20",
      "GROUP BY bowler",
      "HAVING SUM(CASE WHEN extra_type IN ('wide', 'noball') THEN 0 ELSE 1 END) >= 12",
      "ORDER BY economy, bowler",
    ].join("\n"),
    alternatives: [
      [
        "WITH death AS (",
        "  SELECT bowler,",
        "         IF(extra_type = 'wide' OR extra_type = 'noball', 0, 1) AS legal,",
        "         batter_runs + IF(extra_type = 'wide' OR extra_type = 'noball', extra_runs, 0) AS charged",
        "  FROM Delivery WHERE over_no >= 17",
        ")",
        "SELECT bowler, SUM(legal) AS legal_balls, SUM(charged) AS runs_conceded, ROUND(SUM(charged) * 6 / SUM(legal), 2) AS economy",
        "FROM death GROUP BY bowler HAVING SUM(legal) >= 12",
        "ORDER BY economy, bowler",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Filter the deliveries to overs 17–20 before grouping by bowler.",
      "Two per-delivery quantities are conditional: whether it was a legal ball, and how many of its runs the bowler is charged with.",
      "A `CASE` inside `SUM` computes each of them; byes and leg-byes are legal balls whose extras are not charged.",
    ],
    editorial: [
      "Every delivery contributes two conditional amounts, and the rest is grouping. A delivery is a **legal ball** unless it is a wide or a no-ball — `CASE WHEN extra_type IN ('wide', 'noball') THEN 0 ELSE 1 END`. Its **charged runs** are always the runs off the bat, plus the extras only for wides and no-balls; byes and leg-byes are legal balls, but their runs go to the batting side's extras, not the bowler. Summing the two expressions per bowler, after filtering to `over_no BETWEEN 17 AND 20`, gives the death-overs totals.",
      "",
      "The minimum is on legal balls, so it is a `HAVING` on the same sum. Economy is runs per six legal balls — `runs * 6 / balls` — rounded only for display. A bowler with all their balls before over 17 has no rows after the filter and never appears, so there is no division by zero.",
      "",
      "The alternative computes the two per-ball values once in a CTE with `IF` and aggregates them, which avoids repeating the CASE. One scan of the deliveries.",
    ].join("\n"),
  },

  {
    slug: "fantasy-gameweek-scores-with-captain-bonus",
    title: "Fantasy Gameweek Scores With the Captain's Double Points",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation"],
    description: [
      "In the fantasy game a team's score for a gameweek is the sum of its picked players' points that gameweek, with the **captain's points doubled**. A picked player who did not play has no row in `PlayerScore` and scores 0.",
      "",
      "Return one row for every team and gameweek in which the team made picks, with the columns `team_name`, `gameweek` and `total_points`. Order the rows by `gameweek`, then `total_points` descending, then `team_name`.",
    ].join("\n"),
    tables: [
      {
        name: "FantasySquad",
        columns: [
          { name: "team_id", type: "int" },
          { name: "team_name", type: "varchar" },
        ],
        primaryKey: ["team_id"],
        note: "One row per fantasy team; team names are distinct.",
      },
      {
        name: "GameweekPick",
        columns: [
          { name: "team_id", type: "int" },
          { name: "gameweek", type: "int" },
          { name: "player_id", type: "int" },
          { name: "is_captain", type: "bool" },
        ],
        primaryKey: ["team_id", "gameweek", "player_id"],
        note: "One row per player a team picked for a gameweek; at most one pick per team and gameweek has `is_captain` = 1.",
      },
      {
        name: "PlayerScore",
        columns: [
          { name: "player_id", type: "int" },
          { name: "gameweek", type: "int" },
          { name: "points", type: "int" },
        ],
        primaryKey: ["player_id", "gameweek"],
        note: "A player's fantasy points in a gameweek they played; points can be negative.",
      },
    ],
    examples: [
      {
        FantasySquad: [
          [1, "Spin Doctors XI"],
          [2, "Powerplay Pirates"],
          [3, "Yorker Kings"],
        ],
        GameweekPick: [
          [1, 1, 10, 1],
          [1, 1, 11, 0],
          [1, 1, 12, 0],
          [2, 1, 11, 1],
          [2, 1, 13, 0],
          [1, 2, 10, 0],
          [1, 2, 13, 1],
          [3, 2, 12, 0],
        ],
        PlayerScore: [
          [10, 1, 42],
          [11, 1, 18],
          [12, 1, -2],
          [13, 1, 60],
          [10, 2, 25],
          [13, 2, 8],
        ],
      },
    ],
    gen: (rng) => {
      const nt = ri(rng, 1, 5);
      const squads: Cell[][] = seq(1, nt).map((id) => [id, `${pick(rng, ["Spin", "Swing", "Boundary", "Powerplay", "Yorker"])} ${["Kings", "Pirates", "Riders", "Titans", "Wizards"][id - 1]}`]);
      const players = seq(10, 8);
      const gws = ri(rng, 1, 3);
      const picks: Cell[][] = [];
      for (let t = 1; t <= nt; t++) {
        for (let gw = 1; gw <= gws; gw++) {
          if (chance(rng, 0.2)) continue;
          const chosen = sample(rng, players, ri(rng, 1, 4));
          const cap = chance(rng, 0.8) ? 0 : -1;
          chosen.forEach((p, i) => picks.push([t, gw, p, i === cap ? 1 : 0]));
        }
      }
      const scores: Cell[][] = [];
      for (const p of players) for (let gw = 1; gw <= gws; gw++) if (chance(rng, 0.75)) scores.push([p, gw, ri(rng, -4, 60)]);
      return { FantasySquad: squads, GameweekPick: shuffle(rng, picks), PlayerScore: scores };
    },
    solution: [
      "SELECT t.team_name, p.gameweek,",
      "       SUM(CASE WHEN p.is_captain = 1 THEN 2 ELSE 1 END * COALESCE(s.points, 0)) AS total_points",
      "FROM GameweekPick p",
      "JOIN FantasySquad t ON t.team_id = p.team_id",
      "LEFT JOIN PlayerScore s ON s.player_id = p.player_id AND s.gameweek = p.gameweek",
      "GROUP BY t.team_id, t.team_name, p.gameweek",
      "ORDER BY p.gameweek, total_points DESC, t.team_name",
    ].join("\n"),
    alternatives: [
      "SELECT t.team_name, p.gameweek, SUM((1 + p.is_captain) * IFNULL((SELECT s.points FROM PlayerScore s WHERE s.player_id = p.player_id AND s.gameweek = p.gameweek), 0)) AS total_points FROM GameweekPick p JOIN FantasySquad t ON t.team_id = p.team_id GROUP BY t.team_name, p.gameweek ORDER BY p.gameweek, total_points DESC, t.team_name",
    ],
    ordered: true,
    hints: [
      "Start from the picks: each output row is a team and a gameweek that has picks.",
      "Match a pick to its score on both the player and the gameweek — and keep picks with no score, so use a LEFT JOIN.",
      "Multiply each player's points by 2 for the captain and 1 otherwise, treating a missing score as 0, then sum per team and gameweek.",
    ],
    editorial: [
      "The grain of the answer is (team, gameweek), and those come from `GameweekPick`. Each pick needs that player's points **for the same gameweek**, so the join to `PlayerScore` is on both `player_id` and `gameweek` — joining on the player alone would add up every gameweek's points.",
      "",
      "Some picked players did not play and have no score row. An inner join would silently drop those picks; a LEFT JOIN keeps them with NULL points, which `COALESCE(s.points, 0)` turns into 0. The captain's double is a multiplier per row, `CASE WHEN is_captain = 1 THEN 2 ELSE 1 END` (or `1 + is_captain`, since the flag is 0 or 1).",
      "",
      "Grouping by team and gameweek and summing gives the score; a team that skipped a gameweek has no picks and no row. The alternative looks the score up with a correlated scalar subquery, which is the same left-join semantics in another shape. Order by gameweek, best score first, then name. With indexes on the primary keys the work is one lookup per pick.",
    ].join("\n"),
  },
  {
    slug: "auction-buys-above-franchise-average-price",
    title: "Auction Buys Above Their Franchise's Average Price",
    difficulty: "MEDIUM",
    topics: ["Subqueries"],
    description: [
      "After each year's player auction a franchise's analyst reviews the signings that cost **more than the franchise's average price that year**. The average is over every player the same franchise bought in the same `auction_year`.",
      "",
      "Return the columns `franchise_name`, `auction_year`, `player_name` and `price_lakh` for every such signing. A franchise that bought one player that year has nothing above its own average. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Franchise",
        columns: [
          { name: "franchise_id", type: "int" },
          { name: "franchise_name", type: "varchar" },
          { name: "home_city", type: "varchar" },
        ],
        primaryKey: ["franchise_id"],
        note: "One row per franchise in the league.",
      },
      {
        name: "AuctionSale",
        columns: [
          { name: "sale_id", type: "int" },
          { name: "auction_year", type: "int" },
          { name: "player_name", type: "varchar" },
          { name: "franchise_id", type: "int" },
          { name: "price_lakh", type: "int" },
        ],
        primaryKey: ["sale_id"],
        note: "One row per player sold, with the hammer price in lakh rupees. `franchise_id` is always in `Franchise`.",
      },
    ],
    examples: [
      {
        Franchise: [
          [1, "Mumbai Monarchs", "Mumbai"],
          [2, "Chennai Cheetahs", "Chennai"],
          [3, "Jaipur Jaguars", "Jaipur"],
        ],
        AuctionSale: [
          [1, 2024, "Liam Brooks", 1, 1200],
          [2, 2024, "Rohan Iyer", 1, 300],
          [3, 2024, "Kabir Khan", 1, 450],
          [4, 2024, "Noah Fernando", 2, 800],
          [5, 2024, "Dev Mehta", 2, 800],
          [6, 2025, "Arjun Nair", 1, 650],
          [7, 2025, "Vikram Rao", 3, 975],
          [8, 2025, "Ishaan Bose", 3, 200],
        ],
      },
    ],
    gen: (rng) => {
      const fr = sample(rng, T20_TEAMS, ri(rng, 1, 4));
      const franchises: Cell[][] = fr.map((name, i) => [i + 1, name, name.split(" ")[0]!]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 20);
      const who = people(rng, Math.min(n, 40));
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        pick(rng, [2024, 2025]),
        who[id - 1]!,
        ri(rng, 1, fr.length),
        chance(rng, 0.3) ? pick(rng, [200, 500, 800]) : roundTo(rng, 20, 1500, 5),
      ]);
      return { Franchise: franchises, AuctionSale: rows };
    },
    solution: [
      "SELECT f.franchise_name, s.auction_year, s.player_name, s.price_lakh",
      "FROM AuctionSale s",
      "JOIN Franchise f ON f.franchise_id = s.franchise_id",
      "WHERE s.price_lakh > (",
      "  SELECT AVG(t.price_lakh) FROM AuctionSale t",
      "  WHERE t.franchise_id = s.franchise_id AND t.auction_year = s.auction_year",
      ")",
    ].join("\n"),
    alternatives: [
      "SELECT f.franchise_name, s.auction_year, s.player_name, s.price_lakh FROM AuctionSale s JOIN Franchise f ON f.franchise_id = s.franchise_id JOIN (SELECT franchise_id, auction_year, AVG(price_lakh) AS avg_price FROM AuctionSale GROUP BY franchise_id, auction_year) a ON a.franchise_id = s.franchise_id AND a.auction_year = s.auction_year WHERE s.price_lakh > a.avg_price",
      "SELECT f.franchise_name, w.auction_year, w.player_name, w.price_lakh FROM (SELECT s.*, AVG(price_lakh) OVER (PARTITION BY franchise_id, auction_year) AS avg_price FROM AuctionSale s) w JOIN Franchise f ON f.franchise_id = w.franchise_id WHERE w.price_lakh > w.avg_price",
    ],
    hints: [
      "Each sale is compared with an average that depends on that sale's own franchise and year.",
      "A correlated subquery computes `AVG(price_lakh)` over the sales matching the outer row's `franchise_id` and `auction_year`.",
      "Alternatively, compute every (franchise, year) average once in a derived table and join it back.",
    ],
    editorial: [
      "The comparison value changes from row to row: each sale is measured against **its own** franchise's average in **its own** year. That is the textbook use of a **correlated subquery** — `(SELECT AVG(price_lakh) FROM AuctionSale t WHERE t.franchise_id = s.franchise_id AND t.auction_year = s.auction_year)` is evaluated with the outer row's values, and the sale is kept when its price is strictly above it.",
      "",
      "Correlating on both columns matters: a franchise's 2024 spree should not lift the bar for its 2025 buys. A franchise with a single signing in a year has an average equal to that price, so `>` excludes it; two players bought at the same price (800 and 800) are both equal to the average and neither is listed.",
      "",
      "The same averages can be computed once — a `GROUP BY franchise_id, auction_year` derived table joined back, or `AVG(...) OVER (PARTITION BY franchise_id, auction_year)` beside every row. Those read the table a fixed number of times, while a naive correlated plan rescans it per row; most optimisers turn the correlated form into the grouped join anyway.",
    ].join("\n"),
  },

  {
    slug: "early-bird-ticket-share-per-match",
    title: "Share of Seats Booked Two Weeks Early for Each Match",
    difficulty: "MEDIUM",
    topics: ["Dates", "Joins", "Conditional Logic"],
    description: [
      "The ticketing team wants to know how far ahead fans buy. A booking is **early** when it was made **at least 14 days** before the match date (a booking exactly 14 days before counts as early).",
      "",
      "For every match with at least one booking, return the columns `match_id`, `match_date`, `total_seats` (all seats booked), `early_seats` and `early_share_pct` = `100 * early_seats / total_seats`, rounded to 2 decimal places. Matches with no bookings are left out. Order the rows by `match_date`, then `match_id`.",
    ].join("\n"),
    tables: [
      {
        name: "T20Match",
        columns: [
          { name: "match_id", type: "int" },
          { name: "match_date", type: "date" },
          { name: "home_team", type: "varchar" },
          { name: "away_team", type: "varchar" },
        ],
        primaryKey: ["match_id"],
        note: "One row per T20 league match.",
      },
      {
        name: "TicketBooking",
        columns: [
          { name: "booking_id", type: "int" },
          { name: "match_id", type: "int" },
          { name: "booked_on", type: "date" },
          { name: "seats", type: "int" },
        ],
        primaryKey: ["booking_id"],
        note: "One row per booking; `booked_on` is never after the match date. `match_id` is always in `T20Match`.",
      },
    ],
    examples: [
      {
        T20Match: [
          [1, "2024-04-12", "Mumbai Monarchs", "Delhi Defenders"],
          [2, "2024-04-14", "Chennai Cheetahs", "Kolkata Krakens"],
          [3, "2024-04-20", "Jaipur Jaguars", "Punjab Pioneers"],
        ],
        TicketBooking: [
          [1, 1, "2024-03-20", 4],
          [2, 1, "2024-03-29", 2],
          [3, 1, "2024-04-10", 6],
          [4, 2, "2024-03-31", 3],
          [5, 2, "2024-04-01", 5],
          [6, 2, "2024-04-13", 2],
          [7, 1, "2024-04-12", 8],
        ],
      },
    ],
    gen: (rng) => {
      for (;;) {
        const nm = ri(rng, 1, 5);
        const matches: Cell[][] = seq(1, nm).map((id) => {
          const [h, a] = sample(rng, T20_TEAMS, 2);
          return [id, dateBetween(rng, "2024-03-25", "2024-05-20"), h!, a!];
        });
        const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 20);
        const bookings: Cell[][] = seq(1, n).map((id) => {
          const m = ri(rng, 1, nm);
          const ahead = chance(rng, 0.2) ? pick(rng, [13, 14, 15]) : ri(rng, 0, 40);
          return [id, m, addDays(matches[m - 1]![1] as string, -ahead), ri(rng, 1, 8)];
        });
        // Regenerate if a share would sit on a half-way rounding.
        const risky = matches.some((m) => {
          const mine = bookings.filter((b) => b[1] === m[0]);
          const total = mine.reduce((a, b) => a + (b[3] as number), 0);
          const early = mine.filter((b) => (Date.parse(m[1] as string) - Date.parse(b[2] as string)) / 86_400_000 >= 14).reduce((a, b) => a + (b[3] as number), 0);
          return total > 0 && nearHalf(100 * early, total);
        });
        if (!risky) return { T20Match: matches, TicketBooking: bookings };
      }
    },
    solution: [
      "SELECT m.match_id, m.match_date,",
      "       SUM(b.seats) AS total_seats,",
      "       SUM(CASE WHEN DATEDIFF(m.match_date, b.booked_on) >= 14 THEN b.seats ELSE 0 END) AS early_seats,",
      "       ROUND(100 * SUM(CASE WHEN DATEDIFF(m.match_date, b.booked_on) >= 14 THEN b.seats ELSE 0 END) / SUM(b.seats), 2) AS early_share_pct",
      "FROM T20Match m",
      "JOIN TicketBooking b ON b.match_id = m.match_id",
      "GROUP BY m.match_id, m.match_date",
      "ORDER BY m.match_date, m.match_id",
    ].join("\n"),
    alternatives: [
      "SELECT m.match_id, m.match_date, SUM(b.seats) AS total_seats, SUM(IF(b.booked_on <= DATE_SUB(m.match_date, INTERVAL 14 DAY), b.seats, 0)) AS early_seats, ROUND(100 * SUM(IF(b.booked_on <= DATE_SUB(m.match_date, INTERVAL 14 DAY), b.seats, 0)) / SUM(b.seats), 2) AS early_share_pct FROM TicketBooking b JOIN T20Match m ON m.match_id = b.match_id GROUP BY m.match_id, m.match_date ORDER BY m.match_date, m.match_id",
    ],
    ordered: true,
    hints: [
      "Each booking needs its match's date, so join the bookings to the matches.",
      "`DATEDIFF(match_date, booked_on)` is the number of days between them; early means `>= 14`.",
      "Sum the seats twice per match — once for all bookings, once with a CASE that keeps only the early ones.",
    ],
    editorial: [
      "The early/late decision needs a date from each table, so the bookings are joined to their match. An inner join also implements \"matches with no bookings are left out\": a match with no booking has no rows to group.",
      "",
      "Per match, the total is `SUM(seats)` and the early part is a **conditional sum**: `SUM(CASE WHEN DATEDIFF(match_date, booked_on) >= 14 THEN seats ELSE 0 END)`. `DATEDIFF(a, b)` is `a - b` in days, so a booking on 29 March for a 12 April match is 14 days ahead and counts, while one on 1 April for a 14 April match is 13 days ahead and does not. Comparing `booked_on <= DATE_SUB(match_date, INTERVAL 14 DAY)` is the same boundary written as a date.",
      "",
      "The share is the ratio of the two sums times 100, rounded at the end; the total is at least one seat for every match that has a row, so there is no division by zero. One join and one grouping.",
    ].join("\n"),
  },

  {
    slug: "monthly-fantasy-contest-entries-change",
    title: "Monthly Fantasy Contest Entries and the Change From Last Month",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates"],
    description: [
      "The fantasy app's growth team tracks contest entries month by month. For each calendar month that has at least one entry, report the entries, the fees collected and the change from the **previous calendar month**.",
      "",
      "Return the columns `month` (as `YYYY-MM`), `entries`, `fees_collected` (sum of `entry_fee`) and `change_from_prev` = this month's entries minus the previous calendar month's entries. A previous month with no entries counts as **0**; the **earliest** month in the data has `change_from_prev` NULL. Order the rows by `month`.",
    ].join("\n"),
    tables: [
      {
        name: "ContestEntry",
        columns: [
          { name: "entry_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "entered_at", type: "datetime" },
          { name: "entry_fee", type: "int" },
        ],
        primaryKey: ["entry_id"],
        note: "One row per paid contest entry; `entry_fee` is in rupees.",
      },
    ],
    examples: [
      {
        ContestEntry: [
          [1, 11, "2024-03-02 19:05:00", 49],
          [2, 12, "2024-03-15 20:10:00", 99],
          [3, 11, "2024-04-01 18:45:00", 49],
          [4, 13, "2024-04-09 21:00:00", 25],
          [5, 14, "2024-04-30 23:59:00", 49],
          [6, 12, "2024-06-03 19:30:00", 99],
          [7, 15, "2024-07-11 20:00:00", 25],
          [8, 11, "2024-07-21 19:15:00", 49],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      const start = pick(rng, ["2023-11-01", "2024-01-01", "2024-10-01"]);
      const rows: Cell[][] = seq(1, n).map((id) => [id, ri(rng, 11, 30), atTime(rng, dateBetween(rng, start, addDays(start, 200))), pick(rng, [25, 49, 99, 199])]);
      return { ContestEntry: rows };
    },
    solution: [
      "WITH monthly AS (",
      "  SELECT DATE_FORMAT(entered_at, '%Y-%m') AS month, COUNT(*) AS entries, SUM(entry_fee) AS fees_collected",
      "  FROM ContestEntry",
      "  GROUP BY DATE_FORMAT(entered_at, '%Y-%m')",
      ")",
      "SELECT m.month, m.entries, m.fees_collected,",
      "       CASE",
      "         WHEN m.month = (SELECT MIN(month) FROM monthly) THEN NULL",
      "         ELSE m.entries - COALESCE(p.entries, 0)",
      "       END AS change_from_prev",
      "FROM monthly m",
      "LEFT JOIN monthly p",
      "  ON p.month = DATE_FORMAT(DATE_SUB(CONCAT(m.month, '-01'), INTERVAL 1 MONTH), '%Y-%m')",
      "ORDER BY m.month",
    ].join("\n"),
    alternatives: [
      [
        "WITH monthly AS (",
        "  SELECT DATE_FORMAT(entered_at, '%Y-%m') AS month, COUNT(*) AS entries, SUM(entry_fee) AS fees_collected",
        "  FROM ContestEntry GROUP BY DATE_FORMAT(entered_at, '%Y-%m')",
        "), lagged AS (",
        "  SELECT month, entries, fees_collected,",
        "         LAG(month) OVER (ORDER BY month) AS prev_month,",
        "         LAG(entries) OVER (ORDER BY month) AS prev_entries",
        "  FROM monthly",
        ")",
        "SELECT month, entries, fees_collected,",
        "       CASE",
        "         WHEN prev_month IS NULL THEN NULL",
        "         WHEN prev_month = DATE_FORMAT(DATE_SUB(CONCAT(month, '-01'), INTERVAL 1 MONTH), '%Y-%m') THEN entries - prev_entries",
        "         ELSE entries",
        "       END AS change_from_prev",
        "FROM lagged",
        "ORDER BY month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First reduce the entries to one row per month with `DATE_FORMAT(entered_at, '%Y-%m')`.",
      "`LAG` fetches the previous row's values — but the previous row is not always the previous calendar month, since a month with no entries has no row.",
      "Compute the calendar month before each month (`DATE_SUB` of its first day by one month) and compare.",
    ],
    editorial: [
      "Step one is a monthly rollup: group by `DATE_FORMAT(entered_at, '%Y-%m')`, counting entries and summing fees. The `YYYY-MM` text sorts chronologically, which the ordering relies on.",
      "",
      "The subtle part is the **calendar** gap. `LAG(entries) OVER (ORDER BY month)` returns the previous *row*, and in the example the row before June is April — May had no entries. Comparing June with April would be wrong; the statement says May counts as 0. So either join each month to the row for exactly one calendar month earlier — `DATE_FORMAT(DATE_SUB(CONCAT(month, '-01'), INTERVAL 1 MONTH), '%Y-%m')` — with a LEFT JOIN and `COALESCE(..., 0)`, or use `LAG` for both the previous month and its entries and check that the previous row really is the previous month, falling back to `entries - 0`.",
      "",
      "The earliest month has no history at all and gets NULL rather than its own count — that is a separate branch in both versions. The work is one grouping plus a join or a sort over a handful of monthly rows.",
    ].join("\n"),
  },

  {
    slug: "wickets-credited-from-dismissal-text",
    title: "Wickets Credited to Each Bowler From the Dismissal Text",
    difficulty: "MEDIUM",
    topics: ["Strings", "Aggregation"],
    description: [
      "An old scoring app stored only the scorecard's dismissal text, in the usual notation: `b Aarav Das` (bowled), `lbw b Aarav Das`, `c Rohan Iyer b Aarav Das` (caught), `c & b Aarav Das` (caught by the bowler), `st Kabir Khan b Aarav Das` (stumped), `run out (Dev Mehta)` and `retired hurt`. The bowler is credited with the wicket in every form that names one after `b `; **run outs and retirements credit no bowler**.",
      "",
      "Return the columns `bowler` and `wickets` (dismissals credited to them). Order the rows by `wickets` descending, then by `bowler`.",
    ].join("\n"),
    tables: [
      {
        name: "DismissalLog",
        columns: [
          { name: "dismissal_id", type: "int" },
          { name: "match_id", type: "int" },
          { name: "batter", type: "varchar" },
          { name: "how_out", type: "varchar" },
        ],
        primaryKey: ["dismissal_id"],
        note: "One row per dismissal, `how_out` in the notation above. Player names are first name and surname, each starting with a capital letter.",
      },
    ],
    examples: [
      {
        DismissalLog: [
          [1, 801, "Rohan Iyer", "c Kabir Khan b Aarav Das"],
          [2, 801, "Dev Mehta", "b Farhan Patel"],
          [3, 801, "Vikram Rao", "lbw b Aarav Das"],
          [4, 801, "Ishaan Bose", "run out (Kabir Khan)"],
          [5, 802, "Kabir Khan", "c & b Farhan Patel"],
          [6, 802, "Arjun Nair", "st Rohan Iyer b Harsh Joshi"],
          [7, 802, "Neha Gupta", "retired hurt"],
          [8, 802, "Rahul Singh", "b Aarav Das"],
        ],
      },
    ],
    gen: (rng) => {
      const bowlers = people(rng, ri(rng, 1, 5));
      const fielders = people(rng, 6);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 22);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const b = pick(rng, bowlers);
        const f = pick(rng, fielders);
        const how = pick(rng, [`b ${b}`, `lbw b ${b}`, `c ${f} b ${b}`, `c ${f} b ${b}`, `c & b ${b}`, `st ${f} b ${b}`, `run out (${f})`, "retired hurt"]);
        return [id, ri(rng, 801, 806), pick(rng, FIRST_NAMES), how];
      });
      return { DismissalLog: rows };
    },
    solution: [
      "SELECT bowler, COUNT(*) AS wickets",
      "FROM (",
      "  SELECT CASE",
      "           WHEN how_out LIKE 'b %' THEN SUBSTRING(how_out, 3)",
      "           WHEN how_out LIKE '% b %' THEN SUBSTRING_INDEX(how_out, ' b ', -1)",
      "         END AS bowler",
      "  FROM DismissalLog",
      ") credited",
      "WHERE bowler IS NOT NULL",
      "GROUP BY bowler",
      "ORDER BY wickets DESC, bowler",
    ].join("\n"),
    alternatives: [
      "SELECT SUBSTRING_INDEX(CONCAT(' ', how_out), ' b ', -1) AS bowler, COUNT(*) AS wickets FROM DismissalLog WHERE how_out NOT LIKE 'run out%' AND how_out <> 'retired hurt' GROUP BY SUBSTRING_INDEX(CONCAT(' ', how_out), ' b ', -1) ORDER BY wickets DESC, bowler",
      "SELECT bowler, COUNT(*) AS wickets FROM (SELECT SUBSTRING(how_out, 3) AS bowler FROM DismissalLog WHERE how_out LIKE 'b %' UNION ALL SELECT SUBSTRING_INDEX(how_out, ' b ', -1) FROM DismissalLog WHERE how_out LIKE '% b %') x GROUP BY bowler ORDER BY wickets DESC, bowler",
    ],
    ordered: true,
    hints: [
      "In every form that credits a bowler, the bowler's name is whatever follows the last `b ` marker.",
      "`SUBSTRING_INDEX(text, ' b ', -1)` returns what follows the last occurrence of ` b `; a dismissal that *starts* with `b ` has no space before it.",
      "Run outs and retirements contain no ` b ` marker — leave them out, then group by the extracted name.",
    ],
    editorial: [
      "The work is extracting a name from free text and then counting. In the scorecard notation the bowler always comes last, after a `b ` marker, so the name is **everything after the last marker**. `SUBSTRING_INDEX(how_out, ' b ', -1)` returns exactly that for `lbw b …`, `c … b …`, `c & b …` and `st … b …`. Bowled alone, `b Farhan Patel`, starts with the marker and has no space before it, so it needs its own branch (`SUBSTRING(how_out, 3)`) — or put a space in front of every text with `CONCAT(' ', how_out)` so that one rule covers all forms, as the first alternative does.",
      "",
      "Run outs and `retired hurt` match neither branch; the CASE gives NULL and the outer filter drops them. Grouping on the extracted name and counting gives each bowler's wickets. Names here never contain a lone lower-case `b`, which is what makes the marker unambiguous — real data would need a stricter parse. One scan, one grouping.",
    ].join("\n"),
  },

  {
    slug: "goalkeeper-clean-sheet-percentage",
    title: "Goalkeepers' Clean-Sheet Percentage",
    difficulty: "MEDIUM",
    topics: ["Joins", "Conditional Logic"],
    description: [
      "A goalkeeper keeps a **clean sheet** when the opposing team scores no goals in a match they played. `KeeperAppearance` says who kept goal for each side.",
      "",
      "For every goalkeeper with **at least 3 appearances**, return the columns `goalkeeper`, `appearances`, `clean_sheets` and `clean_sheet_pct` = `100 * clean_sheets / appearances`, rounded to 1 decimal place. Order the rows by `clean_sheet_pct` descending, then by `goalkeeper`.",
    ].join("\n"),
    tables: [
      {
        name: "MatchResult",
        columns: [
          { name: "match_id", type: "int" },
          { name: "home_club", type: "varchar" },
          { name: "away_club", type: "varchar" },
          { name: "home_goals", type: "int" },
          { name: "away_goals", type: "int" },
        ],
        primaryKey: ["match_id"],
        note: "One row per match played.",
      },
      {
        name: "KeeperAppearance",
        columns: [
          { name: "match_id", type: "int" },
          { name: "club", type: "varchar" },
          { name: "goalkeeper", type: "varchar" },
        ],
        primaryKey: ["match_id", "club"],
        note: "The goalkeeper who played for `club` in the match; `club` is that match's home or away club.",
      },
    ],
    examples: [
      {
        MatchResult: [
          [1, "Goa Gulls", "Pune Rovers", 2, 0],
          [2, "Pune Rovers", "Delhi Falcons", 0, 0],
          [3, "Delhi Falcons", "Goa Gulls", 1, 3],
          [4, "Goa Gulls", "Delhi Falcons", 0, 0],
          [5, "Pune Rovers", "Goa Gulls", 2, 1],
        ],
        KeeperAppearance: [
          [1, "Goa Gulls", "Arjun Nair"],
          [1, "Pune Rovers", "Kabir Khan"],
          [2, "Pune Rovers", "Kabir Khan"],
          [2, "Delhi Falcons", "Vikram Rao"],
          [3, "Delhi Falcons", "Vikram Rao"],
          [3, "Goa Gulls", "Arjun Nair"],
          [4, "Goa Gulls", "Arjun Nair"],
          [4, "Delhi Falcons", "Dev Mehta"],
          [5, "Pune Rovers", "Kabir Khan"],
          [5, "Goa Gulls", "Arjun Nair"],
        ],
      },
    ],
    gen: (rng) => {
      for (;;) {
        const clubs = sample(rng, CLUBS, ri(rng, 2, 4));
        const keepers = new Map<string, string[]>(clubs.map((c) => [c, people(rng, ri(rng, 1, 2))]));
        const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 12);
        const results: Cell[][] = [];
        const apps: Cell[][] = [];
        const tally = new Map<string, [number, number]>();
        for (let id = 1; id <= n; id++) {
          const [h, a] = sample(rng, clubs, 2) as [string, string];
          const hg = chance(rng, 0.35) ? 0 : ri(rng, 1, 3);
          const ag = chance(rng, 0.35) ? 0 : ri(rng, 1, 3);
          results.push([id, h, a, hg, ag]);
          for (const [club, conceded] of [[h, ag], [a, hg]] as const) {
            const gk = pick(rng, keepers.get(club)!);
            apps.push([id, club, gk]);
            const t = tally.get(gk) ?? [0, 0];
            tally.set(gk, [t[0] + 1, t[1] + (conceded === 0 ? 1 : 0)]);
          }
        }
        if (![...tally.values()].some(([app, cs]) => nearHalf(100 * cs, app, 1))) return { MatchResult: results, KeeperAppearance: apps };
      }
    },
    solution: [
      "SELECT k.goalkeeper,",
      "       COUNT(*) AS appearances,",
      "       SUM(CASE WHEN (k.club = r.home_club AND r.away_goals = 0)",
      "                  OR (k.club = r.away_club AND r.home_goals = 0) THEN 1 ELSE 0 END) AS clean_sheets,",
      "       ROUND(100 * SUM(CASE WHEN (k.club = r.home_club AND r.away_goals = 0)",
      "                         OR (k.club = r.away_club AND r.home_goals = 0) THEN 1 ELSE 0 END) / COUNT(*), 1) AS clean_sheet_pct",
      "FROM KeeperAppearance k",
      "JOIN MatchResult r ON r.match_id = k.match_id",
      "GROUP BY k.goalkeeper",
      "HAVING COUNT(*) >= 3",
      "ORDER BY clean_sheet_pct DESC, k.goalkeeper",
    ].join("\n"),
    alternatives: [
      [
        "WITH conceded AS (",
        "  SELECT k.goalkeeper, IF(k.club = r.home_club, r.away_goals, r.home_goals) AS against",
        "  FROM KeeperAppearance k JOIN MatchResult r ON r.match_id = k.match_id",
        ")",
        "SELECT goalkeeper, COUNT(*) AS appearances, SUM(IF(against = 0, 1, 0)) AS clean_sheets,",
        "       ROUND(100 * SUM(IF(against = 0, 1, 0)) / COUNT(*), 1) AS clean_sheet_pct",
        "FROM conceded GROUP BY goalkeeper HAVING COUNT(*) >= 3",
        "ORDER BY clean_sheet_pct DESC, goalkeeper",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Join each appearance to its match to see the score.",
      "The goals a keeper conceded are the *other* side's goals: `away_goals` if they played for the home club, `home_goals` otherwise.",
      "Count clean sheets with a conditional sum, and filter the appearance count in HAVING.",
    ],
    editorial: [
      "Each appearance row says which club the keeper played for; joined to `MatchResult`, the question \"did the opponent score?\" depends on which side that club was. For the home club the opponent's goals are `away_goals`, for the away club `home_goals`. Written as `IF(club = home_club, away_goals, home_goals)` it is the goals conceded, and a clean sheet is when that is 0.",
      "",
      "Grouping by goalkeeper, `COUNT(*)` is appearances and a conditional sum counts the clean sheets. A goalless draw (match 2, match 4) is a clean sheet for **both** keepers — the per-appearance view handles that naturally because each keeper has their own row. The minimum of three appearances is a condition on the group, so it goes in HAVING. The percentage is rounded only for display, and appearances is never 0 for a listed keeper.",
      "",
      "The CTE alternative computes goals conceded once and aggregates it; the solution writes the condition inline. Both are one join and one grouping.",
    ].join("\n"),
  },
  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "longest-winning-streak-of-each-club",
    title: "Longest Winning Streak of Each Football Club",
    difficulty: "HARD",
    topics: ["Window Functions"],
    description: [
      "A club's **winning streak** is a run of consecutive wins in its own matches taken in date order; a draw or a defeat ends it. A club plays at most one match on any date.",
      "",
      "Return every club that played at least one match, with the columns `club` and `longest_win_streak` (the length of its longest streak, **0** if it never won). Order the rows by `longest_win_streak` descending, then by `club`.",
    ].join("\n"),
    tables: [
      {
        name: "ClubMatch",
        columns: [
          { name: "match_id", type: "int" },
          { name: "match_date", type: "date" },
          { name: "home_club", type: "varchar" },
          { name: "away_club", type: "varchar" },
          { name: "home_goals", type: "int" },
          { name: "away_goals", type: "int" },
        ],
        primaryKey: ["match_id"],
        note: "One row per match played; goals are never NULL.",
      },
    ],
    examples: [
      {
        ClubMatch: [
          [1, "2024-09-01", "Goa Gulls", "Pune Rovers", 2, 0],
          [2, "2024-09-08", "Pune Rovers", "Delhi Falcons", 1, 1],
          [3, "2024-09-15", "Delhi Falcons", "Goa Gulls", 0, 1],
          [4, "2024-09-22", "Goa Gulls", "Delhi Falcons", 3, 2],
          [5, "2024-09-29", "Pune Rovers", "Goa Gulls", 2, 1],
          [6, "2024-10-06", "Goa Gulls", "Pune Rovers", 4, 0],
          [7, "2024-10-13", "Delhi Falcons", "Pune Rovers", 2, 1],
          [8, "2024-10-20", "Delhi Falcons", "Goa Gulls", 1, 0],
        ],
      },
    ],
    gen: (rng) => {
      const clubs = sample(rng, CLUBS, ri(rng, 2, 5));
      const rounds = chance(rng, 0.05) ? 0 : ri(rng, 1, 9);
      const rows: Cell[][] = [];
      let id = 1;
      for (let r = 0; r < rounds; r++) {
        // Each round, disjoint pairs, so a club plays at most once on a date.
        const order = shuffle(rng, [...clubs]);
        for (let i = 0; i + 1 < order.length; i += 2) {
          if (chance(rng, 0.2)) continue;
          const strong = chance(rng, 0.6);
          rows.push([id++, addDays("2024-08-31", r * 7), order[i]!, order[i + 1]!, strong ? ri(rng, 1, 3) : ri(rng, 0, 2), ri(rng, 0, 2)]);
        }
      }
      return { ClubMatch: rows };
    },
    solution: [
      "WITH side AS (",
      "  SELECT home_club AS club, match_date, CASE WHEN home_goals > away_goals THEN 1 ELSE 0 END AS won FROM ClubMatch",
      "  UNION ALL",
      "  SELECT away_club, match_date, CASE WHEN away_goals > home_goals THEN 1 ELSE 0 END FROM ClubMatch",
      "), numbered AS (",
      "  SELECT club, won,",
      "         ROW_NUMBER() OVER (PARTITION BY club ORDER BY match_date)",
      "       - ROW_NUMBER() OVER (PARTITION BY club, won ORDER BY match_date) AS island",
      "  FROM side",
      "), streaks AS (",
      "  SELECT club, island, COUNT(*) AS len FROM numbered WHERE won = 1 GROUP BY club, island",
      ")",
      "SELECT c.club, COALESCE(MAX(s.len), 0) AS longest_win_streak",
      "FROM (SELECT DISTINCT club FROM side) c",
      "LEFT JOIN streaks s ON s.club = c.club",
      "GROUP BY c.club",
      "ORDER BY longest_win_streak DESC, c.club",
    ].join("\n"),
    alternatives: [
      [
        "WITH side AS (",
        "  SELECT home_club AS club, match_date, IF(home_goals > away_goals, 1, 0) AS won FROM ClubMatch",
        "  UNION ALL",
        "  SELECT away_club, match_date, IF(away_goals > home_goals, 1, 0) FROM ClubMatch",
        "), grouped AS (",
        "  SELECT club, won,",
        "         SUM(1 - won) OVER (PARTITION BY club ORDER BY match_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS breaks",
        "  FROM side",
        ")",
        "SELECT club, MAX(run) AS longest_win_streak",
        "FROM (SELECT club, breaks, SUM(won) AS run FROM grouped GROUP BY club, breaks) r",
        "GROUP BY club",
        "ORDER BY longest_win_streak DESC, club",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First turn each match into one row per club with a won/not-won flag, so every club has its own sequence of results.",
      "This is gaps-and-islands: consecutive wins form an island. The difference between a club's overall row number and its row number among wins is constant along an island.",
      "Alternatively, a running count of non-wins stays the same throughout a winning run — use it as a group key.",
      "Clubs that never won still need a row with 0.",
    ],
    editorial: [
      "First unpivot each match into two rows, one per club, with a flag `won` (draws and defeats are 0). Now each club has a sequence of results ordered by date — guaranteed to be a strict order, since a club plays at most once per date.",
      "",
      "Consecutive wins are **islands** in that sequence. The classic trick numbers each club's matches twice: `ROW_NUMBER()` over all its matches, and `ROW_NUMBER()` over just its wins (partition by club and `won`). Along a run of consecutive wins both numbers grow by one per row, so their difference is constant; any non-win between two wins bumps the first number but not the second, giving the next island a different difference. Grouping the win rows by (club, difference) and counting gives each streak's length; the longest is `MAX`.",
      "",
      "A club that never won has no win rows, so the solution starts from the list of clubs and LEFT JOINs the streaks, with `COALESCE(..., 0)`. The alternative labels each row with the running number of non-wins so far — constant through a winning run — and sums `won` per label; a club with no wins gets runs of 0 automatically. Both are a couple of sorts over the unpivoted rows.",
    ].join("\n"),
  },

  {
    slug: "t20-net-run-rate-standings",
    title: "Net Run Rate of Every Team in the T20 League",
    difficulty: "HARD",
    topics: ["Aggregation", "Subqueries", "Conditional Logic"],
    description: [
      "In a T20 league, teams level on points are separated by **net run rate** (NRR): the runs a team scored per over faced, minus the runs it conceded per over bowled, over the whole season. Overs are balls divided by 6. One rule makes it fair: when a side is **bowled out**, its innings counts as the full **120 balls**, both for the batting team's overs faced and for the bowling team's overs bowled.",
      "",
      "Return every team with the columns `team`, `runs_for`, `runs_against` and `net_run_rate` = `runs_for * 6 / balls_faced - runs_against * 6 / balls_bowled`, rounded to 3 decimal places, using the adjusted ball counts. Order the rows by `net_run_rate` descending, then by `team`.",
    ].join("\n"),
    tables: [
      {
        name: "InningsTotal",
        columns: [
          { name: "match_id", type: "int" },
          { name: "innings_no", type: "int" },
          { name: "batting_team", type: "varchar" },
          { name: "bowling_team", type: "varchar" },
          { name: "runs", type: "int" },
          { name: "balls", type: "int" },
          { name: "all_out", type: "bool" },
        ],
        primaryKey: ["match_id", "innings_no"],
        note: "One row per completed innings; every match has two, one batted by each team. `balls` is the legal balls actually faced (at most 120).",
      },
    ],
    examples: [
      {
        InningsTotal: [
          [1, 1, "Mumbai Monarchs", "Chennai Cheetahs", 182, 120, 0],
          [1, 2, "Chennai Cheetahs", "Mumbai Monarchs", 150, 104, 1],
          [2, 1, "Delhi Defenders", "Mumbai Monarchs", 140, 120, 0],
          [2, 2, "Mumbai Monarchs", "Delhi Defenders", 143, 99, 0],
          [3, 1, "Chennai Cheetahs", "Delhi Defenders", 165, 118, 1],
          [3, 2, "Delhi Defenders", "Chennai Cheetahs", 166, 115, 0],
        ],
      },
    ],
    gen: (rng) => {
      for (;;) {
        const teams = sample(rng, T20_TEAMS, ri(rng, 2, 5));
        const nm = chance(rng, 0.05) ? 0 : ri(rng, 1, 8);
        const rows: Cell[][] = [];
        for (let m = 1; m <= nm; m++) {
          const [a, b] = sample(rng, teams, 2) as [string, string];
          const firstOut = chance(rng, 0.3);
          const first = ri(rng, 110, 220);
          rows.push([m, 1, a, b, first, firstOut ? ri(rng, 80, 119) : 120, firstOut ? 1 : 0]);
          const chased = chance(rng, 0.5);
          const secondOut = !chased && chance(rng, 0.5);
          rows.push([m, 2, b, a, chased ? first + ri(rng, 1, 5) : ri(rng, 90, first), chased || secondOut ? ri(rng, 70, 119) : 120, secondOut ? 1 : 0]);
        }
        const nrr = teams.map((t) => {
          let rf = 0;
          let bf = 0;
          let ra = 0;
          let bb = 0;
          for (const r of rows) {
            const balls = r[6] === 1 ? 120 : (r[5] as number);
            if (r[2] === t) {
              rf += r[4] as number;
              bf += balls;
            }
            if (r[3] === t) {
              ra += r[4] as number;
              bb += balls;
            }
          }
          return bf > 0 && bb > 0 ? (rf * 6) / bf - (ra * 6) / bb : 0;
        });
        // MySQL keeps 4 decimals on each division: stay well clear of a rounding edge at the 3rd.
        if (!nrr.some((v) => nearHalf(Math.abs(v), 1, 3, 0.2))) return { InningsTotal: rows };
      }
    },
    solution: [
      "WITH adjusted AS (",
      "  SELECT batting_team, bowling_team, runs,",
      "         CASE WHEN all_out = 1 THEN 120 ELSE balls END AS balls_used",
      "  FROM InningsTotal",
      "), batting AS (",
      "  SELECT batting_team AS team, SUM(runs) AS runs_for, SUM(balls_used) AS balls_faced FROM adjusted GROUP BY batting_team",
      "), bowling AS (",
      "  SELECT bowling_team AS team, SUM(runs) AS runs_against, SUM(balls_used) AS balls_bowled FROM adjusted GROUP BY bowling_team",
      ")",
      "SELECT b.team, b.runs_for, w.runs_against,",
      "       ROUND(b.runs_for * 6 / b.balls_faced - w.runs_against * 6 / w.balls_bowled, 3) AS net_run_rate",
      "FROM batting b",
      "JOIN bowling w ON w.team = b.team",
      "ORDER BY net_run_rate DESC, b.team",
    ].join("\n"),
    alternatives: [
      [
        "SELECT team, SUM(rf) AS runs_for, SUM(ra) AS runs_against,",
        "       ROUND(SUM(rf) * 6 / SUM(bf) - SUM(ra) * 6 / SUM(bb), 3) AS net_run_rate",
        "FROM (",
        "  SELECT batting_team AS team, runs AS rf, IF(all_out = 1, 120, balls) AS bf, 0 AS ra, 0 AS bb FROM InningsTotal",
        "  UNION ALL",
        "  SELECT bowling_team, 0, 0, runs, IF(all_out = 1, 120, balls) FROM InningsTotal",
        ") t",
        "GROUP BY team",
        "ORDER BY net_run_rate DESC, team",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Apply the bowled-out rule first: an innings' ball count is 120 when `all_out` is 1, and `balls` otherwise.",
      "Each innings counts twice — for the batting team's runs and balls faced, and for the bowling team's runs and balls bowled.",
      "Aggregate the season totals first and divide the totals; averaging per-match run rates gives a different number.",
    ],
    editorial: [
      "Net run rate is a ratio of **season totals**, not an average of match run rates, so the plan is: adjust each innings, total it two ways, then divide.",
      "",
      "The adjustment is a CASE: a bowled-out innings uses 120 balls, any other its real `balls`. In the example Chennai were all out in 104 balls chasing, so their 150 runs count over 20 overs — which hurts their rate — and Mumbai's bowling is credited with 20 overs too.",
      "",
      "Each innings then feeds two teams: the batting team's runs for and balls faced, and the bowling team's runs against and balls bowled. Two grouped CTEs (by `batting_team` and by `bowling_team`) joined on the team give all four totals; the alternative unpivots each innings into a batting row and a bowling row with zeros in the other columns and groups once. Every team both bats and bowls in each of its matches, so the join loses nobody and no ball count is zero.",
      "",
      "Finally `runs_for * 6 / balls_faced - runs_against * 6 / balls_bowled`, rounded to three places only at the end. Both plans scan the innings a fixed number of times.",
    ].join("\n"),
  },

  {
    slug: "over-in-which-each-innings-passed-100",
    title: "The Over in Which Each T20 Innings Passed 100 Runs",
    difficulty: "HARD",
    topics: ["Window Functions", "Subqueries"],
    description: [
      "The scoring feed stores the runs of every over. The broadcaster's graphic shows when each innings **reached 100**: the first over at whose end the innings total was **100 or more**.",
      "",
      "For every innings that reached 100, return the columns `match_id`, `innings_no`, `over_no` (that over) and `score_after_over` (the innings total at the end of it). Innings that never reached 100 are left out. Order the rows by `match_id`, then `innings_no`.",
    ].join("\n"),
    tables: [
      {
        name: "OverSummary",
        columns: [
          { name: "match_id", type: "int" },
          { name: "innings_no", type: "int" },
          { name: "over_no", type: "int" },
          { name: "runs", type: "int" },
          { name: "wickets", type: "int" },
        ],
        primaryKey: ["match_id", "innings_no", "over_no"],
        note: "One row per over bowled, `over_no` 1–20; an innings can end before its 20th over, and its overs are numbered without gaps.",
      },
    ],
    examples: [
      {
        OverSummary: [
          [901, 1, 1, 14, 0],
          [901, 1, 2, 22, 0],
          [901, 1, 3, 9, 1],
          [901, 1, 4, 18, 0],
          [901, 1, 5, 16, 0],
          [901, 1, 6, 21, 1],
          [901, 1, 7, 7, 0],
          [901, 1, 8, 12, 0],
          [901, 2, 1, 6, 1],
          [901, 2, 2, 9, 0],
          [901, 2, 3, 3, 2],
          [902, 1, 1, 30, 0],
          [902, 1, 2, 30, 0],
          [902, 1, 3, 25, 0],
          [902, 1, 4, 15, 1],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const innings = chance(rng, 0.05) ? 0 : ri(rng, 1, 3);
      for (let i = 0; i < innings; i++) {
        const match = 901 + Math.floor(i / 2);
        const inn = (i % 2) + 1;
        const overs = ri(rng, 3, 10);
        const hot = chance(rng, 0.7);
        for (let o = 1; o <= overs; o++) rows.push([match, inn, o, hot ? ri(rng, 8, 24) : ri(rng, 2, 12), ri(rng, 0, 1)]);
        // Sometimes the total lands on exactly 100 at the end of an over.
        if (chance(rng, 0.3) && overs >= 5) {
          const before = rows.slice(rows.length - overs, rows.length - 1).reduce((a, r) => a + (r[3] as number), 0);
          if (before < 100 && 100 - before <= 36) rows[rows.length - 1]![3] = 100 - before;
        }
      }
      return { OverSummary: rows };
    },
    solution: [
      "WITH running AS (",
      "  SELECT match_id, innings_no, over_no,",
      "         SUM(runs) OVER (PARTITION BY match_id, innings_no ORDER BY over_no",
      "                         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS total",
      "  FROM OverSummary",
      "), reached AS (",
      "  SELECT match_id, innings_no, over_no, total,",
      "         ROW_NUMBER() OVER (PARTITION BY match_id, innings_no ORDER BY over_no) AS rn",
      "  FROM running",
      "  WHERE total >= 100",
      ")",
      "SELECT match_id, innings_no, over_no, total AS score_after_over",
      "FROM reached",
      "WHERE rn = 1",
      "ORDER BY match_id, innings_no",
    ].join("\n"),
    alternatives: [
      [
        "SELECT o.match_id, o.innings_no, o.over_no,",
        "       (SELECT SUM(p.runs) FROM OverSummary p WHERE p.match_id = o.match_id AND p.innings_no = o.innings_no AND p.over_no <= o.over_no) AS score_after_over",
        "FROM OverSummary o",
        "WHERE (SELECT SUM(p.runs) FROM OverSummary p WHERE p.match_id = o.match_id AND p.innings_no = o.innings_no AND p.over_no <= o.over_no) >= 100",
        "  AND (SELECT SUM(p.runs) FROM OverSummary p WHERE p.match_id = o.match_id AND p.innings_no = o.innings_no AND p.over_no < o.over_no) < 100",
        "ORDER BY o.match_id, o.innings_no",
      ].join("\n"),
      [
        "WITH running AS (",
        "  SELECT match_id, innings_no, over_no, runs,",
        "         SUM(runs) OVER (PARTITION BY match_id, innings_no ORDER BY over_no ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS total",
        "  FROM OverSummary",
        ")",
        "SELECT match_id, innings_no, over_no, total AS score_after_over",
        "FROM running",
        "WHERE total >= 100 AND total - runs < 100",
        "ORDER BY match_id, innings_no",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The innings total after each over is a running sum of `runs` within the innings, in over order.",
      "Once you have the running total, the over you want is the first one where it is at least 100.",
      "Equivalently: the total after the over is at least 100 and the total before it was below 100.",
    ],
    editorial: [
      "The total at the end of each over is a **running total**: `SUM(runs) OVER (PARTITION BY match_id, innings_no ORDER BY over_no ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`. The partition restarts the sum for every innings, and the explicit `ROWS` frame makes the sum stop at the current over (over numbers are unique within an innings, so `RANGE` would agree, but saying `ROWS` removes any doubt).",
      "",
      "From the running totals, the over that passed 100 is the earliest one with `total >= 100`: filter, number what is left per innings by over, and keep number 1. Because runs are never negative the running total only rises, so there is an even simpler test: the total after the over is at least 100 and the total **before** it (`total - runs`) is below 100 — exactly one over per innings satisfies that, which is the second alternative. An innings ending on exactly 100 qualifies, and one that never got there has no row.",
      "",
      "Without windows, correlated sums compute the totals before and after each over; that rescans the innings per over, quadratic in its length, while the window plan is one sort per innings.",
    ].join("\n"),
  },

  {
    slug: "median-fantasy-points-by-player-role",
    title: "Median Fantasy Points per Gameweek by Player Role",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation", "Joins"],
    description: [
      "The fantasy game's pricing team sets player prices by role and wants a typical gameweek score that big hauls do not distort, so they use the **median**: the middle score when a role's scores are sorted, or the **average of the two middle scores** when there is an even number of them.",
      "",
      "Over every row of `GameweekPoints`, return one row per role that has at least one score, with the columns `role`, `scores` (how many gameweek scores the role has) and `median_points`, rounded to 1 decimal place. Order the rows by `role`.",
    ].join("\n"),
    tables: [
      {
        name: "FantasyPlayer",
        columns: [
          { name: "player_id", type: "int" },
          { name: "player_name", type: "varchar" },
          { name: "role", type: "enum", values: ["AR", "BAT", "BWL", "WK"] },
        ],
        primaryKey: ["player_id"],
        note: "One row per player in the game.",
      },
      {
        name: "GameweekPoints",
        columns: [
          { name: "player_id", type: "int" },
          { name: "gameweek", type: "int" },
          { name: "points", type: "int" },
        ],
        primaryKey: ["player_id", "gameweek"],
        note: "A player's fantasy points in a gameweek they played. `player_id` is always in `FantasyPlayer`; points can be negative.",
      },
    ],
    examples: [
      {
        FantasyPlayer: [
          [1, "Rohan Iyer", "BAT"],
          [2, "Kabir Khan", "BAT"],
          [3, "Aarav Das", "BWL"],
          [4, "Dev Mehta", "AR"],
          [5, "Arjun Nair", "WK"],
        ],
        GameweekPoints: [
          [1, 1, 12],
          [1, 2, 88],
          [2, 1, 31],
          [2, 2, 40],
          [3, 1, 25],
          [3, 2, 2],
          [3, 3, 61],
          [4, 1, 45],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 8);
      const roles = ["AR", "BAT", "BWL", "WK"] as const;
      const players: Cell[][] = people(rng, n).map((name, i) => [i + 1, name, pick(rng, roles)]);
      const rows: Cell[][] = [];
      for (let p = 1; p <= n; p++) {
        for (let gw = 1; gw <= 4; gw++) {
          if (chance(rng, 0.4)) rows.push([p, gw, chance(rng, 0.3) ? pick(rng, [10, 25, 40]) : ri(rng, -4, 90)]);
        }
      }
      return { FantasyPlayer: players, GameweekPoints: rows };
    },
    solution: [
      "WITH ordered AS (",
      "  SELECT p.role, g.points,",
      "         ROW_NUMBER() OVER (PARTITION BY p.role ORDER BY g.points, g.player_id, g.gameweek) AS rn,",
      "         COUNT(*) OVER (PARTITION BY p.role) AS cnt",
      "  FROM GameweekPoints g",
      "  JOIN FantasyPlayer p ON p.player_id = g.player_id",
      ")",
      "SELECT role, MAX(cnt) AS scores, ROUND(AVG(points), 1) AS median_points",
      "FROM ordered",
      "WHERE rn IN (FLOOR((cnt + 1) / 2), FLOOR(cnt / 2) + 1)",
      "GROUP BY role",
      "ORDER BY role",
    ].join("\n"),
    alternatives: [
      [
        "WITH s AS (SELECT p.role, g.points FROM GameweekPoints g JOIN FantasyPlayer p ON p.player_id = g.player_id)",
        "SELECT a.role, (SELECT COUNT(*) FROM s c WHERE c.role = a.role) AS scores, ROUND(AVG(DISTINCT a.points), 1) AS median_points",
        "FROM s a",
        "WHERE (SELECT COUNT(*) FROM s b WHERE b.role = a.role AND b.points <= a.points) >= (SELECT COUNT(*) FROM s c WHERE c.role = a.role) / 2",
        "  AND (SELECT COUNT(*) FROM s b WHERE b.role = a.role AND b.points >= a.points) >= (SELECT COUNT(*) FROM s c WHERE c.role = a.role) / 2",
        "GROUP BY a.role",
        "ORDER BY a.role",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Join each score to its player to know the role; the median is over scores, not over players.",
      "Number the scores within each role in ascending order and count them with a window over the same partition.",
      "For `n` scores the middle positions are `(n + 1) / 2` and `n / 2 + 1` rounded down — the same position when `n` is odd. Average the scores at those positions.",
    ],
    editorial: [
      "SQL has no portable `MEDIAN`, so we find the middle positions ourselves. After joining each score to its player's role, two windows over the same partition do the work: `ROW_NUMBER()` numbers a role's scores in ascending order, and `COUNT(*) OVER (PARTITION BY role)` puts the role's total beside every row. The tie-breakers in the ORDER BY (`player_id`, `gameweek`) only make the numbering repeatable — equal scores are interchangeable for a median.",
      "",
      "For `n` scores the middle is at positions `FLOOR((n + 1) / 2)` and `FLOOR(n / 2) + 1`. For odd `n` both are the same position; for even `n` they are the two middle ones. Keeping those rows and averaging gives the median in both cases, rounded once at the end. In the example BAT has four scores (12, 31, 40, 88), so the median is (31 + 40) / 2 = 35.5.",
      "",
      "The alternative is the classic counting definition: a value is a middle value when at least half the scores are `<=` it and at least half are `>=` it; averaging the distinct such values gives the median. It needs correlated counts — quadratic — where the window version is one sort per role.",
    ].join("\n"),
  },
  {
    slug: "fantasy-signup-cohort-next-month-retention",
    title: "Fantasy App Signup Cohorts Retained Into the Next Month",
    difficulty: "HARD",
    topics: ["Dates", "Joins", "Aggregation"],
    description: [
      "The fantasy app groups users into **cohorts** by the calendar month they signed up in. A user is **retained** when they entered at least one contest in the **calendar month right after** their signup month (a user who signed up on 31 January is retained by any entry in February; entries in the signup month itself or two months later do not count).",
      "",
      "Return one row per signup month with the columns `cohort_month` (`YYYY-MM`), `cohort_size` (users who signed up that month), `retained_users` and `retention_pct` = `100 * retained_users / cohort_size`, rounded to 2 decimal places. Cohorts with nobody retained show 0. Order the rows by `cohort_month`.",
    ].join("\n"),
    tables: [
      {
        name: "AppUser",
        columns: [
          { name: "user_id", type: "int" },
          { name: "signed_up_on", type: "date" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["user_id"],
        note: "One row per registered user.",
      },
      {
        name: "ContestJoin",
        columns: [
          { name: "join_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "joined_on", type: "date" },
          { name: "entry_fee", type: "int" },
        ],
        primaryKey: ["join_id"],
        note: "One row per contest entry; `user_id` is always in `AppUser` and `joined_on` is never before that user's signup.",
      },
    ],
    examples: [
      {
        AppUser: [
          [1, "2024-01-05", "Pune"],
          [2, "2024-01-20", "Mumbai"],
          [3, "2024-01-31", "Delhi"],
          [4, "2024-02-10", "Kochi"],
          [5, "2024-02-14", "Jaipur"],
          [6, "2024-03-02", "Chennai"],
        ],
        ContestJoin: [
          [1, 1, "2024-01-06", 49],
          [2, 1, "2024-02-03", 49],
          [3, 1, "2024-02-17", 99],
          [4, 2, "2024-03-01", 25],
          [5, 3, "2024-02-01", 49],
          [6, 4, "2024-02-11", 99],
          [7, 5, "2024-03-29", 25],
          [8, 6, "2024-03-05", 49],
        ],
      },
    ],
    gen: (rng) => {
      for (;;) {
        const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 12);
        const users: Cell[][] = seq(1, n).map((id) => [id, dateBetween(rng, "2024-10-01", "2025-01-31"), pick(rng, ["Pune", "Mumbai", "Delhi", "Kochi", "Jaipur"])]);
        const joins: Cell[][] = [];
        let jid = 1;
        for (const u of users) {
          const k = ri(rng, 0, 3);
          for (let j = 0; j < k && jid <= 30; j++) joins.push([jid++, u[0]!, addDays(u[1] as string, chance(rng, 0.2) ? ri(rng, 0, 3) : ri(rng, 0, 70)), pick(rng, [25, 49, 99])]);
        }
        const cohorts = new Map<string, [number, number]>();
        for (const u of users) {
          const m = (u[1] as string).slice(0, 7);
          const [y, mo] = m.split("-").map(Number) as [number, number];
          const next = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;
          const kept = joins.some((j) => j[1] === u[0] && (j[2] as string).startsWith(next));
          const c = cohorts.get(m) ?? [0, 0];
          cohorts.set(m, [c[0] + 1, c[1] + (kept ? 1 : 0)]);
        }
        if (![...cohorts.values()].some(([size, kept]) => nearHalf(100 * kept, size))) return { AppUser: users, ContestJoin: joins };
      }
    },
    solution: [
      "WITH retained AS (",
      "  SELECT DISTINCT u.user_id",
      "  FROM AppUser u",
      "  JOIN ContestJoin j ON j.user_id = u.user_id",
      "  WHERE DATE_FORMAT(j.joined_on, '%Y-%m') = DATE_FORMAT(DATE_ADD(u.signed_up_on, INTERVAL 1 MONTH), '%Y-%m')",
      ")",
      "SELECT DATE_FORMAT(u.signed_up_on, '%Y-%m') AS cohort_month,",
      "       COUNT(*) AS cohort_size,",
      "       COUNT(r.user_id) AS retained_users,",
      "       ROUND(100 * COUNT(r.user_id) / COUNT(*), 2) AS retention_pct",
      "FROM AppUser u",
      "LEFT JOIN retained r ON r.user_id = u.user_id",
      "GROUP BY DATE_FORMAT(u.signed_up_on, '%Y-%m')",
      "ORDER BY cohort_month",
    ].join("\n"),
    alternatives: [
      [
        "SELECT cohort_month, COUNT(*) AS cohort_size, SUM(kept) AS retained_users, ROUND(100 * SUM(kept) / COUNT(*), 2) AS retention_pct",
        "FROM (",
        "  SELECT DATE_FORMAT(u.signed_up_on, '%Y-%m') AS cohort_month,",
        "         CASE WHEN EXISTS (",
        "           SELECT 1 FROM ContestJoin j",
        "           WHERE j.user_id = u.user_id",
        "             AND j.joined_on >= DATE_ADD(DATE_SUB(u.signed_up_on, INTERVAL DAY(u.signed_up_on) - 1 DAY), INTERVAL 1 MONTH)",
        "             AND j.joined_on <= LAST_DAY(DATE_ADD(DATE_SUB(u.signed_up_on, INTERVAL DAY(u.signed_up_on) - 1 DAY), INTERVAL 1 MONTH))",
        "         ) THEN 1 ELSE 0 END AS kept",
        "  FROM AppUser u",
        ") t",
        "GROUP BY cohort_month",
        "ORDER BY cohort_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The cohort of a user is `DATE_FORMAT(signed_up_on, '%Y-%m')`.",
      "The month after signup is the month of `DATE_ADD(signed_up_on, INTERVAL 1 MONTH)` — compare months as `YYYY-MM` text, not dates.",
      "Decide per user whether they are retained (a user with three entries next month is still one user), then aggregate per cohort with a LEFT JOIN or a 0/1 flag so cohorts with nobody retained stay.",
    ],
    editorial: [
      "Retention is a per-**user** fact aggregated per **cohort**, so it pays to do it in two steps. First decide, for each user, whether some entry falls in the month after the signup month. Comparing month labels avoids day arithmetic: the target month is `DATE_FORMAT(DATE_ADD(signed_up_on, INTERVAL 1 MONTH), '%Y-%m')`. `DATE_ADD` by a month clamps 31 January to the end of February, so the label is still February — the month, not \"30 days later\", is what the statement asks for. `DISTINCT` (or `EXISTS`) makes a user with several entries count once.",
      "",
      "Then group users by signup month. The LEFT JOIN to the retained list keeps every user, so `COUNT(*)` is the cohort size and `COUNT(r.user_id)` counts only the matched ones; a cohort where nobody came back gets 0 rather than disappearing. The percentage is rounded at the end.",
      "",
      "The alternative computes a 0/1 flag per user with `EXISTS` over the next month's first and last day (`LAST_DAY`), which is the date-range version of the same idea and can use an index on `joined_on`. Each plan reads the users once plus one probe per user.",
    ].join("\n"),
  },

  {
    slug: "days-out-injured-after-merging-overlapping-records",
    title: "Days Each Player Was Out Injured, Merging Overlapping Records",
    difficulty: "HARD",
    topics: ["Dates", "Window Functions"],
    description: [
      "The football club's physio and its doctor both log injuries, so one layoff is often recorded twice with different dates, and a player can pick up a new knock before the last one clears. Each record covers the days from `out_from` to `out_until`, **both inclusive**. Records that overlap or **touch** (one ends the day before the next starts) belong to one continuous layoff.",
      "",
      "Return every player who has a record, with the columns `player_name`, `layoffs` (continuous layoffs after merging) and `days_out` (distinct days unavailable). Order the rows by `days_out` descending, then by `player_name`.",
    ].join("\n"),
    tables: [
      {
        name: "InjuryRecord",
        columns: [
          { name: "record_id", type: "int" },
          { name: "player_name", type: "varchar" },
          { name: "injury", type: "varchar" },
          { name: "out_from", type: "date" },
          { name: "out_until", type: "date" },
        ],
        primaryKey: ["record_id"],
        note: "`out_until` is never before `out_from`; a one-day record has them equal.",
      },
    ],
    examples: [
      {
        InjuryRecord: [
          [1, "Rohan Iyer", "Hamstring", "2024-09-02", "2024-09-15"],
          [2, "Rohan Iyer", "Hamstring", "2024-09-05", "2024-09-20"],
          [3, "Rohan Iyer", "Ankle", "2024-10-01", "2024-10-03"],
          [4, "Kabir Khan", "Concussion", "2024-09-10", "2024-09-16"],
          [5, "Kabir Khan", "Groin", "2024-09-17", "2024-09-21"],
          [6, "Dev Mehta", "Knee", "2024-08-20", "2024-09-08"],
          [7, "Dev Mehta", "Knee", "2024-08-25", "2024-08-30"],
        ],
      },
    ],
    gen: (rng) => {
      const players = people(rng, ri(rng, 1, 5));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 14);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const from = dateBetween(rng, "2024-08-01", "2024-10-15");
        const len = chance(rng, 0.15) ? 0 : ri(rng, 1, 20);
        return [id, pick(rng, players), pick(rng, ["Hamstring", "Ankle", "Knee", "Groin", "Concussion"]), from, addDays(from, len)];
      });
      // Now and then a record that starts the day after another ends, the "touching" case.
      if (n >= 2 && chance(rng, 0.5)) {
        const a = rows[0]!;
        const b = rows[1]!;
        b[1] = a[1]!;
        b[3] = addDays(a[4] as string, 1);
        b[4] = addDays(b[3] as string, ri(rng, 0, 10));
      }
      return { InjuryRecord: rows };
    },
    solution: [
      "WITH ordered AS (",
      "  SELECT player_name, record_id, out_from, out_until,",
      "         MAX(out_until) OVER (PARTITION BY player_name ORDER BY out_from, out_until, record_id",
      "                              ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS reach",
      "  FROM InjuryRecord",
      "), flagged AS (",
      "  SELECT player_name, record_id, out_from, out_until,",
      "         CASE WHEN reach IS NULL OR out_from > DATE_ADD(reach, INTERVAL 1 DAY) THEN 1 ELSE 0 END AS starts_new",
      "  FROM ordered",
      "), numbered AS (",
      "  SELECT player_name, out_from, out_until,",
      "         SUM(starts_new) OVER (PARTITION BY player_name ORDER BY out_from, out_until, record_id",
      "                               ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS layoff_no",
      "  FROM flagged",
      "), merged AS (",
      "  SELECT player_name, layoff_no, MIN(out_from) AS first_day, MAX(out_until) AS last_day",
      "  FROM numbered",
      "  GROUP BY player_name, layoff_no",
      ")",
      "SELECT player_name, COUNT(*) AS layoffs, SUM(DATEDIFF(last_day, first_day) + 1) AS days_out",
      "FROM merged",
      "GROUP BY player_name",
      "ORDER BY days_out DESC, player_name",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE days AS (",
        "  SELECT player_name, out_from AS d, out_until FROM InjuryRecord",
        "  UNION ALL",
        "  SELECT player_name, DATE_ADD(d, INTERVAL 1 DAY), out_until FROM days WHERE d < out_until",
        "), distinct_days AS (",
        "  SELECT DISTINCT player_name, d FROM days",
        ")",
        "SELECT a.player_name,",
        "       SUM(CASE WHEN NOT EXISTS (SELECT 1 FROM distinct_days b WHERE b.player_name = a.player_name AND b.d = DATE_SUB(a.d, INTERVAL 1 DAY)) THEN 1 ELSE 0 END) AS layoffs,",
        "       COUNT(*) AS days_out",
        "FROM distinct_days a",
        "GROUP BY a.player_name",
        "ORDER BY days_out DESC, a.player_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Sort each player's records by start date. A record starts a new layoff when it begins more than one day after the latest end date of all the records before it.",
      "The latest end so far is a running `MAX(out_until)` over the preceding rows — not just the previous row's end, because a long record can cover several short ones.",
      "A running sum of the \"starts a new layoff\" flags numbers the layoffs; group by it to get each layoff's first and last day.",
      "Days in a merged layoff are `DATEDIFF(last, first) + 1`, because both ends are inclusive.",
    ],
    editorial: [
      "This is **interval merging**, a gaps-and-islands problem on ranges. Sort each player's records by `out_from`. Walking down the list, a record belongs to the current layoff if it starts no later than the day after the furthest `out_until` seen so far; otherwise it opens a new one. \"Furthest so far\" must be a running maximum over **all** earlier rows — `MAX(out_until) OVER (… ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING)` — because a long record (Dev's 20 Aug–8 Sep) can swallow a later short one, and the next record must be compared with the long one's end, not the short one's.",
      "",
      "The flag is 1 for the first record of a player (no earlier rows, `reach` NULL) or when `out_from > reach + 1 day`; touching records (Kabir's 16th and 17th) merge. A running `SUM` of the flags numbers the layoffs, and grouping by that number gives each layoff's first and last day. Inclusive ends mean a layoff lasts `DATEDIFF(last, first) + 1` days, and merged layoffs never overlap, so their lengths add up to the distinct days.",
      "",
      "The alternative expands every record into its days with a recursive CTE (records are short), counts distinct days, and counts a layoff at every day whose previous day is not out. It is simpler to trust but proportional to the number of days; the window plan is two sorts per player.",
    ].join("\n"),
  },

  {
    slug: "orange-cap-leader-after-each-match-day",
    title: "Orange Cap Leader After Every Match Day",
    difficulty: "HARD",
    topics: ["Window Functions", "Subqueries", "Joins"],
    description: [
      "In the T20 league the **orange cap** is worn by the season's leading run-scorer. After every match day (each distinct `match_date` in the table), the leader is the batter with the **highest total runs on or before that date** — counting batters who did not play that day. If several batters share the top total, the cap goes to the one whose name comes **first alphabetically**.",
      "",
      "Return one row per match day with the columns `match_date`, `cap_holder` and `season_runs` (the holder's total after that day). Order the rows by `match_date`.",
    ].join("\n"),
    tables: [
      {
        name: "BatterMatchRuns",
        columns: [
          { name: "match_id", type: "int" },
          { name: "match_date", type: "date" },
          { name: "batter", type: "varchar" },
          { name: "runs", type: "int" },
        ],
        primaryKey: ["match_id", "batter"],
        note: "One row per batter per match they batted in; a match has one date.",
      },
    ],
    examples: [
      {
        BatterMatchRuns: [
          [1, "2024-03-22", "Rohan Iyer", 72],
          [1, "2024-03-22", "Kabir Khan", 45],
          [2, "2024-03-23", "Arjun Nair", 88],
          [2, "2024-03-23", "Dev Mehta", 12],
          [3, "2024-03-25", "Kabir Khan", 27],
          [3, "2024-03-25", "Dev Mehta", 64],
          [4, "2024-03-25", "Rohan Iyer", 16],
          [5, "2024-03-27", "Arjun Nair", 0],
          [5, "2024-03-27", "Kabir Khan", 4],
        ],
      },
    ],
    gen: (rng) => {
      const batters = people(rng, ri(rng, 2, 6));
      const nm = chance(rng, 0.05) ? 0 : ri(rng, 1, 8);
      const rows: Cell[][] = [];
      let day = 0;
      for (let m = 1; m <= nm && rows.length < 28; m++) {
        if (chance(rng, 0.6)) day += ri(rng, 1, 3);
        for (const b of sample(rng, batters, ri(rng, 1, 3))) rows.push([m, addDays("2024-03-22", day), b, chance(rng, 0.3) ? pick(rng, [20, 40]) : ri(rng, 0, 90)]);
      }
      return { BatterMatchRuns: rows };
    },
    solution: [
      "WITH match_days AS (",
      "  SELECT DISTINCT match_date FROM BatterMatchRuns",
      "), totals AS (",
      "  SELECT d.match_date, r.batter, SUM(r.runs) AS season_runs",
      "  FROM match_days d",
      "  JOIN BatterMatchRuns r ON r.match_date <= d.match_date",
      "  GROUP BY d.match_date, r.batter",
      "), ranked AS (",
      "  SELECT match_date, batter, season_runs,",
      "         ROW_NUMBER() OVER (PARTITION BY match_date ORDER BY season_runs DESC, batter) AS rn",
      "  FROM totals",
      ")",
      "SELECT match_date, batter AS cap_holder, season_runs",
      "FROM ranked",
      "WHERE rn = 1",
      "ORDER BY match_date",
    ].join("\n"),
    alternatives: [
      [
        "WITH totals AS (",
        "  SELECT d.match_date, r.batter, SUM(r.runs) AS season_runs",
        "  FROM (SELECT DISTINCT match_date FROM BatterMatchRuns) d",
        "  JOIN BatterMatchRuns r ON r.match_date <= d.match_date",
        "  GROUP BY d.match_date, r.batter",
        ")",
        "SELECT t.match_date, t.batter AS cap_holder, t.season_runs",
        "FROM totals t",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM totals u",
        "  WHERE u.match_date = t.match_date",
        "    AND (u.season_runs > t.season_runs OR (u.season_runs = t.season_runs AND u.batter < t.batter))",
        ")",
        "ORDER BY t.match_date",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The leader after a day depends on every batter's total up to that day, including batters who did not play on it.",
      "Pair each match day with every innings on or before it (a non-equi join on `match_date <=`), then sum per day and batter.",
      "Rank the batters within each day by total (high first) and name, and keep the first.",
    ],
    editorial: [
      "A running total per batter alone is not enough: the leader after 25 March must consider Arjun, who did not bat that day but leads on his 88 from the 23rd. What is needed is every batter's total **as of every match day**.",
      "",
      "So build the grid explicitly. Take the distinct match days and join each to all innings on or before it — `r.match_date <= d.match_date`, a non-equi join. Grouping by (day, batter) and summing gives each batter's season total as it stood after that day; a batter who had not batted yet simply has no row for the earlier days. Then rank batters within each day by total descending and name ascending with `ROW_NUMBER()`, and keep the first. The name is the explicit tie-break, so exactly one holder per day — on 25 March Rohan (88) and Arjun (88) tie and Arjun takes the cap.",
      "",
      "The alternative keeps a total when no other batter on the same day has more runs, or the same runs and an earlier name. The join is days × innings, fine at league scale; a running-sum window per batter plus a carry-forward would avoid it on large data.",
    ].join("\n"),
  },
];
