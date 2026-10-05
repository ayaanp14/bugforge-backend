import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, atTime, chance, dateBetween, maybeNull, names, pick, ri, roundTo, sample, shuffle } from "./kit.js";

/** Window functions: ranking, LAG/LEAD, running and moving aggregates, gaps and islands. Easiest first. */

const FACULTY_DEPARTMENTS = ["Computer Science", "Mechanical", "Civil", "Electronics", "Physics", "Mathematics"] as const;
const QUIZ_TEAMS = [
  "Bit Brigade", "Null Pointers", "Stack Smashers", "Kernel Kings", "Code Crusaders", "Logic Lords", "Syntax Squad",
  "Binary Bandits", "Loop Legends", "Cache Hits", "Debug Divas", "Hash Heroes", "Pixel Pirates", "Query Queens",
] as const;
const GYM_BRANCHES = ["Koramangala", "Indiranagar", "HSR Layout", "Whitefield", "Jayanagar"] as const;
const LEAGUE_TEAMS = ["Hilltop Hawks", "Riverside Rhinos", "Lakeview Lions", "Valley Vipers", "Coastal Cobras"] as const;

export const WINDOWS: SqlProblemSpec[] = [
  {
    slug: "faculty-pay-against-department-average",
    title: "Faculty Pay Against the Department Average",
    difficulty: "EASY",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "The college's pay committee wants every faculty member's salary shown next to the average salary of their department, and how far above or below that average they are.",
      "",
      "Return one row per faculty member with columns `faculty_id`, `faculty_name`, `department`, `salary`, `dept_avg` and `gap`, where `dept_avg` is the average salary of the member's department **rounded to 2 decimal places**, and `gap` is `salary` minus the **unrounded** department average, also rounded to 2 places (negative when below the average). Order the rows by `department`, then by `salary` **highest first**, then by `faculty_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Faculty",
        columns: [
          { name: "faculty_id", type: "int" },
          { name: "faculty_name", type: "varchar" },
          { name: "department", type: "varchar" },
          { name: "salary", type: "int" },
        ],
        primaryKey: ["faculty_id"],
        note: "One row per faculty member; `salary` is monthly, in rupees, and never NULL.",
      },
    ],
    examples: [
      {
        Faculty: [
          [1, "Priya", "Computer Science", 95000],
          [2, "Rahul", "Computer Science", 78000],
          [3, "Sneha", "Computer Science", 78000],
          [4, "Vikram", "Mechanical", 82000],
          [5, "Ananya", "Mechanical", 70500],
          [6, "Farhan", "Physics", 66000],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.04) ? 0 : chance(rng, 0.06) ? 1 : ri(rng, 2, 14);
      const depts = sample(rng, FACULTY_DEPARTMENTS, ri(rng, 1, 4));
      const rows: Cell[][] = names(rng, n).map((who, i) => [i + 1, who, pick(rng, depts), roundTo(rng, 40000, 150000, 500)]);
      // Equal salaries inside a department, so the faculty_id tie-break is exercised.
      if (n > 2 && chance(rng, 0.6)) {
        const a = pick(rng, rows);
        const b = pick(rng, rows);
        b[2] = a[2]!;
        b[3] = a[3]!;
      }
      return { Faculty: shuffle(rng, rows) };
    },
    solution: [
      "SELECT faculty_id, faculty_name, department, salary,",
      "       ROUND(AVG(salary) OVER (PARTITION BY department), 2) AS dept_avg,",
      "       ROUND(salary - AVG(salary) OVER (PARTITION BY department), 2) AS gap",
      "FROM Faculty",
      "ORDER BY department, salary DESC, faculty_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT f.faculty_id, f.faculty_name, f.department, f.salary,",
        "       ROUND(d.avg_salary, 2) AS dept_avg,",
        "       ROUND(f.salary - d.avg_salary, 2) AS gap",
        "FROM Faculty f",
        "JOIN (SELECT department, AVG(salary) AS avg_salary FROM Faculty GROUP BY department) d ON d.department = f.department",
        "ORDER BY f.department, f.salary DESC, f.faculty_id",
      ].join("\n"),
      [
        "SELECT f.faculty_id, f.faculty_name, f.department, f.salary,",
        "       ROUND((SELECT AVG(g.salary) FROM Faculty g WHERE g.department = f.department), 2) AS dept_avg,",
        "       ROUND(f.salary - (SELECT AVG(g.salary) FROM Faculty g WHERE g.department = f.department), 2) AS gap",
        "FROM Faculty f",
        "ORDER BY f.department, f.salary DESC, f.faculty_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`GROUP BY department` would collapse each department to one row, but every faculty member needs their own row.",
      "An aggregate followed by `OVER (PARTITION BY …)` computes the group's value and attaches it to each row of the group.",
      "Subtract the raw average and round once at the end; rounding the average first can move the second decimal of `gap`.",
    ],
    editorial: [
      "The output keeps **every** row of `Faculty`, and each row needs a value computed over a *group* of rows — its department. `GROUP BY` cannot do that on its own, because it returns one row per group. A **window aggregate** can: `AVG(salary) OVER (PARTITION BY department)` computes the department's average and repeats it on every row of that department, leaving the rows themselves intact.",
      "",
      "With the average beside each salary, both outputs are arithmetic: `dept_avg` rounds the average, and `gap` rounds `salary - average`. Rounding is done last, on the exact average — `ROUND(salary - ROUND(avg, 2), 2)` can differ in the last place. A department with one member has a `gap` of 0, and nothing is NULL because salaries never are.",
      "",
      "Before window functions this was written as a join to a grouped derived table (one row per department with its average), or with a correlated scalar subquery per row. Both give the same numbers; the join groups the table once, while the correlated form recomputes the average for every row unless the optimiser caches it. The window version reads the table once and sorts it by department. The final `ORDER BY` uses `faculty_id` as the last key so equal salaries in one department come out in a fixed order.",
    ].join("\n"),
  },
  {
    slug: "quiz-team-standings-with-ties",
    title: "Quiz Team Standings With Shared Places",
    difficulty: "MEDIUM",
    topics: ["Window Functions"],
    description: [
      "At the end of the college quiz, teams are placed by points. Teams with equal points **share a place**, and the next lower total takes the **next** place with no gap: 42.5, 42.5, 38 are places 1, 1, 2. A team that was disqualified has NULL points and gets no place.",
      "",
      "Return every team that has points, with columns `team_name`, `points` and `standing`. Order the rows by `points` **highest first**, then by `team_name`.",
    ].join("\n"),
    tables: [
      {
        name: "QuizScore",
        columns: [
          { name: "team_id", type: "int" },
          { name: "team_name", type: "varchar" },
          { name: "points", type: "decimal" },
        ],
        primaryKey: ["team_id"],
        note: "One row per team; team names are unique. `points` can be a half point, and is NULL for a disqualified team.",
      },
    ],
    examples: [
      {
        QuizScore: [
          [1, "Null Pointers", 42.5],
          [2, "Stack Smashers", 38],
          [3, "Bit Brigade", 42.5],
          [4, "Kernel Kings", null],
          [5, "Logic Lords", 30],
          [6, "Cache Hits", 38],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.04) ? 0 : chance(rng, 0.06) ? 1 : ri(rng, 2, 12);
      const pool = Array.from({ length: ri(rng, 1, 6) }, () => ri(rng, 20, 120) / 2);
      const teams = sample(rng, QUIZ_TEAMS, n);
      return { QuizScore: teams.map((t, i) => [i + 1, t, maybeNull(rng, 0.1, pick(rng, pool))]) };
    },
    solution: [
      "SELECT team_name, points,",
      "       DENSE_RANK() OVER (ORDER BY points DESC) AS standing",
      "FROM QuizScore",
      "WHERE points IS NOT NULL",
      "ORDER BY points DESC, team_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT q.team_name, q.points,",
        "       (SELECT COUNT(DISTINCT r.points) FROM QuizScore r WHERE r.points >= q.points) AS standing",
        "FROM QuizScore q",
        "WHERE q.points IS NOT NULL",
        "ORDER BY q.points DESC, q.team_name",
      ].join("\n"),
      [
        "SELECT a.team_name, a.points, COUNT(DISTINCT b.points) AS standing",
        "FROM QuizScore a",
        "JOIN QuizScore b ON b.points >= a.points",
        "GROUP BY a.team_id, a.team_name, a.points",
        "ORDER BY a.points DESC, a.team_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Shared places with no gaps after them is a specific ranking rule — compare `RANK()` and `DENSE_RANK()` on 42.5, 42.5, 38.",
      "A team's place equals the number of distinct point totals that are greater than or equal to its own.",
      "Leave the disqualified teams out before ranking: where would a NULL sort if you did not?",
      "`RANK` is a reserved word in MySQL 8, which is why the column here is called `standing`.",
    ],
    editorial: [
      "Three ranking functions differ only on ties. `ROW_NUMBER()` gives tied rows different numbers, `RANK()` gives them the same number and then **skips** (1, 1, 3), and `DENSE_RANK()` gives them the same number and **does not skip** (1, 1, 2). The statement describes the last one, so the whole answer is `DENSE_RANK() OVER (ORDER BY points DESC)`.",
      "",
      "Disqualified teams must be removed in `WHERE`. If they stayed, the NULLs would sort last in a descending order and receive the last place instead of none. The window is computed after `WHERE`, so filtering first keeps the places of the other teams unchanged. The final `ORDER BY points DESC, team_name` fixes the order of tied teams; the window's own `ORDER BY` does not order the output.",
      "",
      "Without window functions, a team's dense place is the number of **distinct** totals at or above its own: a correlated `COUNT(DISTINCT r.points) … WHERE r.points >= q.points`, or the same count from a self join grouped by team. Both are quadratic in the number of teams, while the window version is one sort — but they show exactly what a dense rank means. A NULL `points` never satisfies `>=`, so the self join drops those teams on its own.",
    ].join("\n"),
  },
  {
    slug: "stuck-cold-storage-sensor",
    title: "Readings From a Stuck Cold-Storage Sensor",
    difficulty: "MEDIUM",
    topics: ["Window Functions"],
    description: [
      "A cold-storage warehouse logs its temperature every ten minutes. Real readings wobble, so when the **same value appears in three or more consecutive log entries**, the maintenance team suspects the sensor got stuck at that value. A NULL reading means the sensor sent nothing; it is not a value and it **breaks** a run.",
      "",
      "Return every temperature that appears in at least three consecutive entries (by `log_id`), in a column named `stuck_temp`. List each such value **once**, even if it was stuck several times. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "ColdStorageLog",
        columns: [
          { name: "log_id", type: "int" },
          { name: "temp_c", type: "decimal" },
        ],
        primaryKey: ["log_id"],
        note: "One row per log entry; `log_id` runs 1, 2, 3, … in time order with no gaps. `temp_c` is in degrees Celsius, NULL when no reading arrived.",
      },
    ],
    examples: [
      {
        ColdStorageLog: [
          [1, -18.5],
          [2, -18.5],
          [3, -18.5],
          [4, -17],
          [5, -17],
          [6, null],
          [7, -17],
          [8, -20],
          [9, -20],
          [10, -20],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.04) ? 0 : chance(rng, 0.1) ? ri(rng, 1, 3) : ri(rng, 5, 20);
      const pool = sample(rng, Array.from({ length: 15 }, (_, i) => -22 + i / 2), ri(rng, 2, 4));
      const temps: (number | null)[] = [];
      while (temps.length < n) {
        if (chance(rng, 0.08)) {
          temps.push(null);
          continue;
        }
        const v = pick(rng, pool);
        const len = pick(rng, [1, 1, 2, 2, 2, 3, 4]);
        for (let k = 0; k < len && temps.length < n; k++) temps.push(v);
      }
      // A near miss now and then: v, v, (NULL or another value), v — three of a value, but not in a row.
      if (n >= 4 && chance(rng, 0.35)) {
        const at = ri(rng, 0, n - 4);
        const v = pick(rng, pool);
        const other = pool.find((x) => x !== v);
        temps.splice(at, 4, v, v, chance(rng, 0.5) || other === undefined ? null : other, v);
      }
      return { ColdStorageLog: temps.map((t, i) => [i + 1, t]) };
    },
    solution: [
      "SELECT DISTINCT temp_c AS stuck_temp",
      "FROM (",
      "  SELECT temp_c,",
      "         LAG(temp_c, 1) OVER (ORDER BY log_id) AS prev1,",
      "         LAG(temp_c, 2) OVER (ORDER BY log_id) AS prev2",
      "  FROM ColdStorageLog",
      ") t",
      "WHERE temp_c = prev1 AND temp_c = prev2",
    ].join("\n"),
    alternatives: [
      [
        "SELECT DISTINCT a.temp_c AS stuck_temp",
        "FROM ColdStorageLog a",
        "JOIN ColdStorageLog b ON b.log_id = a.log_id + 1",
        "JOIN ColdStorageLog c ON c.log_id = a.log_id + 2",
        "WHERE a.temp_c = b.temp_c AND b.temp_c = c.temp_c",
      ].join("\n"),
      [
        "SELECT DISTINCT temp_c AS stuck_temp",
        "FROM (",
        "  SELECT temp_c, log_id - ROW_NUMBER() OVER (PARTITION BY temp_c ORDER BY log_id) AS run_key",
        "  FROM ColdStorageLog",
        "  WHERE temp_c IS NOT NULL",
        ") t",
        "GROUP BY temp_c, run_key",
        "HAVING COUNT(*) >= 3",
      ].join("\n"),
    ],
    hints: [
      "Each row needs to see the readings just before it — that is what `LAG` returns.",
      "A row ends a run of three when it equals the previous reading and the one before that.",
      "Comparisons with NULL are never true, so NULL readings break runs without extra work.",
      "A value can be stuck more than once; make sure it is listed only once.",
    ],
    editorial: [
      "\"Three consecutive entries with the same value\" is a statement about a row and its neighbours in `log_id` order. `LAG(temp_c, 1)` and `LAG(temp_c, 2)` bring the previous two readings onto each row, and a row whose reading equals both is the **third (or later) entry of a run**. Every run of three or more produces at least one such row, and a shorter run produces none. `DISTINCT` then lists each stuck value once, even when the same value got stuck twice or the run was longer than three.",
      "",
      "NULLs need no special case: `temp_c = prev1` is unknown whenever either side is NULL, so a missing reading breaks a run and is never reported itself. The first two rows have NULL from `LAG` and are likewise skipped.",
      "",
      "Because the ids have no gaps, a self join on `log_id + 1` and `log_id + 2` finds the same triples. A third approach is the **gaps-and-islands** trick: within one value's rows ordered by id, `log_id - ROW_NUMBER()` stays constant across a run of consecutive ids and changes when another reading interrupts it, so grouping by `(temp_c, run_key)` and keeping groups of three or more finds every run — and it would also report run lengths if asked. The window versions sort once; the self join does two index lookups per row.",
    ].join("\n"),
  },
  {
    slug: "last-rider-into-the-ropeway-cabin",
    title: "Last Rider Into the Ropeway Cabin",
    difficulty: "MEDIUM",
    topics: ["Window Functions"],
    description: [
      "A hill-station ropeway cabin can carry at most **350 kg**. Riders board strictly in queue order; the cabin leaves as soon as the **next** rider in the queue would push the total above 350 kg — nobody further back may skip ahead, even if they would fit. A total of exactly 350 kg is allowed, and every rider weighs at most 350 kg, so the first rider always boards.",
      "",
      "Return the name of the **last rider to board** the cabin, in a single column named `rider_name`. If the queue is empty, return no rows.",
    ].join("\n"),
    tables: [
      {
        name: "CabinQueue",
        columns: [
          { name: "rider_id", type: "int" },
          { name: "rider_name", type: "varchar" },
          { name: "weight_kg", type: "int" },
          { name: "queue_pos", type: "int" },
        ],
        primaryKey: ["rider_id"],
        note: "One row per rider waiting. `queue_pos` is the place in the queue — 1 boards first — and runs 1, 2, 3, … with no repeats.",
      },
    ],
    examples: [
      {
        CabinQueue: [
          [1, "Meera", 62, 3],
          [2, "Arjun", 85, 1],
          [3, "Kabir", 110, 4],
          [4, "Diya", 48, 2],
          [5, "Rohan", 70, 5],
          [6, "Zara", 40, 6],
        ],
      },
      {
        CabinQueue: [
          [1, "Aisha", 150, 1],
          [2, "Dev", 200, 2],
          [3, "Ira", 30, 3],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : chance(rng, 0.08) ? 1 : ri(rng, 2, 10);
      const people = names(rng, n);
      const weights = people.map(() => ri(rng, 40, 120));
      // Often make some prefix of the queue weigh exactly 350 kg — the boundary "at most" is about.
      if (n > 1 && chance(rng, 0.35)) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          const need = 350 - sum;
          if (k > 0 && need >= 30 && need <= 150) {
            weights[k] = need;
            break;
          }
          sum += weights[k]!;
          if (sum >= 350) break;
        }
      }
      const order = shuffle(rng, Array.from({ length: n }, (_, i) => i + 1));
      // Row k holds the rider at queue position order[k]; weights are given in queue order.
      return { CabinQueue: people.map((who, k) => [k + 1, who, weights[order[k]! - 1]!, order[k]!]) };
    },
    solution: [
      "SELECT rider_name",
      "FROM (",
      "  SELECT rider_name, queue_pos,",
      "         SUM(weight_kg) OVER (ORDER BY queue_pos) AS on_board",
      "  FROM CabinQueue",
      ") q",
      "WHERE on_board <= 350",
      "ORDER BY queue_pos DESC",
      "LIMIT 1",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.rider_name",
        "FROM CabinQueue a",
        "JOIN CabinQueue b ON b.queue_pos <= a.queue_pos",
        "GROUP BY a.rider_id, a.rider_name, a.queue_pos",
        "HAVING SUM(b.weight_kg) <= 350",
        "ORDER BY a.queue_pos DESC",
        "LIMIT 1",
      ].join("\n"),
      [
        "SELECT c.rider_name",
        "FROM CabinQueue c",
        "WHERE (SELECT SUM(d.weight_kg) FROM CabinQueue d WHERE d.queue_pos <= c.queue_pos) <= 350",
        "ORDER BY c.queue_pos DESC",
        "LIMIT 1",
      ].join("\n"),
    ],
    hints: [
      "For each rider, what matters is the total weight of everyone up to and including them in the queue.",
      "A running total is `SUM(…) OVER (ORDER BY …)`.",
      "Weights are positive, so the running total only grows: the riders who board are exactly those whose running total is at most 350.",
      "Of those, you want the one furthest back in the queue.",
    ],
    editorial: [
      "Riders board in `queue_pos` order and nobody may skip, so a rider boards exactly when the **running total** of weights up to and including them is at most 350 kg. Because every weight is positive, the running total grows along the queue: once it passes 350 it never comes back, so the riders who board form a prefix of the queue, and the last rider to board is the one with the largest `queue_pos` among those whose running total is ≤ 350.",
      "",
      "`SUM(weight_kg) OVER (ORDER BY queue_pos)` computes that running total in one pass (the default frame of an ordered window runs from the first row to the current one, and positions are unique, so there are no peer rows to fold in). Filter `on_board <= 350`, sort by `queue_pos` descending and take one row. The `<=` keeps a cabin that is filled to exactly 350 kg. The skipping trap — a light rider further back who would fit in the leftover space — is handled automatically, because their running total includes everyone ahead of them.",
      "",
      "Without windows, the running total is a self join on `b.queue_pos <= a.queue_pos` grouped by rider, or a correlated `SUM` per rider. Both are quadratic in the queue length; the window version is a single sort. An empty queue produces no rows in all three.",
    ].join("\n"),
  },
  {
    slug: "gym-members-first-and-latest-branch",
    title: "Gym Members' First and Latest Branch",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "A gym chain with branches across Bengaluru logs every member check-in. The marketing team wants to know where each member started, where they went most recently, and how many visits came in between.",
      "",
      "Return one row per member who has checked in at least once, with columns `member_id`, `first_branch` (the branch of their earliest check-in), `latest_branch` (the branch of their most recent check-in) and `visits_between` (the number of their check-ins strictly after the earliest and strictly before the most recent — 0 for a member with one or two check-ins). Order the rows by `member_id`.",
    ].join("\n"),
    tables: [
      {
        name: "GymCheckIn",
        columns: [
          { name: "member_id", type: "int" },
          { name: "checked_in_at", type: "datetime" },
          { name: "branch", type: "varchar" },
        ],
        primaryKey: ["member_id", "checked_in_at"],
        note: "One row per check-in. A member never has two check-ins at the same moment, so their first and latest check-ins are well defined.",
      },
    ],
    examples: [
      {
        GymCheckIn: [
          [101, "2025-06-01 06:30:00", "Koramangala"],
          [101, "2025-06-03 18:05:00", "Indiranagar"],
          [101, "2025-06-07 07:10:00", "Koramangala"],
          [101, "2025-06-02 19:45:00", "HSR Layout"],
          [102, "2025-06-02 06:00:00", "Whitefield"],
          [103, "2025-06-01 20:15:00", "Jayanagar"],
          [103, "2025-06-01 08:40:00", "HSR Layout"],
        ],
      },
    ],
    gen: (rng) => {
      const members = chance(rng, 0.04) ? [] : sample(rng, Array.from({ length: 20 }, (_, i) => 101 + i), ri(rng, 1, 6));
      const rows: Cell[][] = [];
      for (const m of members) {
        const times = new Set<string>();
        const visits = ri(rng, 1, 6);
        // A narrow window of days, so several check-ins often fall on the same date.
        while (times.size < visits) times.add(atTime(rng, dateBetween(rng, "2025-06-01", "2025-06-08")));
        for (const t of times) rows.push([m, t, pick(rng, GYM_BRANCHES)]);
      }
      return { GymCheckIn: shuffle(rng, rows) };
    },
    solution: [
      "SELECT member_id,",
      "       MAX(CASE WHEN from_first = 1 THEN branch END) AS first_branch,",
      "       MAX(CASE WHEN from_latest = 1 THEN branch END) AS latest_branch,",
      "       GREATEST(COUNT(*) - 2, 0) AS visits_between",
      "FROM (",
      "  SELECT member_id, branch,",
      "         ROW_NUMBER() OVER (PARTITION BY member_id ORDER BY checked_in_at) AS from_first,",
      "         ROW_NUMBER() OVER (PARTITION BY member_id ORDER BY checked_in_at DESC) AS from_latest",
      "  FROM GymCheckIn",
      ") v",
      "GROUP BY member_id",
      "ORDER BY member_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT DISTINCT member_id,",
        "       FIRST_VALUE(branch) OVER (PARTITION BY member_id ORDER BY checked_in_at) AS first_branch,",
        "       FIRST_VALUE(branch) OVER (PARTITION BY member_id ORDER BY checked_in_at DESC) AS latest_branch,",
        "       GREATEST(COUNT(*) OVER (PARTITION BY member_id) - 2, 0) AS visits_between",
        "FROM GymCheckIn",
        "ORDER BY member_id",
      ].join("\n"),
      [
        "SELECT s.member_id,",
        "       (SELECT x.branch FROM GymCheckIn x WHERE x.member_id = s.member_id AND x.checked_in_at = s.first_at) AS first_branch,",
        "       (SELECT x.branch FROM GymCheckIn x WHERE x.member_id = s.member_id AND x.checked_in_at = s.last_at) AS latest_branch,",
        "       (SELECT COUNT(*) FROM GymCheckIn x",
        "         WHERE x.member_id = s.member_id AND x.checked_in_at > s.first_at AND x.checked_in_at < s.last_at) AS visits_between",
        "FROM (SELECT member_id, MIN(checked_in_at) AS first_at, MAX(checked_in_at) AS last_at FROM GymCheckIn GROUP BY member_id) s",
        "ORDER BY s.member_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`MIN(checked_in_at)` tells you *when* the first visit was, but not *where* — you need the branch from that same row.",
      "Number each member's check-ins in time order, once forwards and once backwards; the row numbered 1 in each direction is the one you want.",
      "Collapse each member to one row afterwards; a conditional aggregate such as `MAX(CASE WHEN … THEN branch END)` picks out the marked rows.",
      "Visits strictly between the first and the latest are all of them minus two — but never fewer than zero.",
    ],
    editorial: [
      "The classic trap here is `SELECT member_id, MIN(checked_in_at), branch … GROUP BY member_id`: the aggregate finds the right *time*, but `branch` is not grouped, so the database is free to return the branch of any row (MySQL refuses it outright under `ONLY_FULL_GROUP_BY`). The branch has to come from the specific row that is first, or latest.",
      "",
      "`ROW_NUMBER()` marks those rows. Partitioned by member and ordered by time, it numbers the earliest check-in 1; ordered by time descending, it numbers the latest one 1. Then group by member: `MAX(CASE WHEN from_first = 1 THEN branch END)` returns the one branch carrying that mark (the `CASE` is NULL on every other row, and `MAX` ignores NULLs). The visits strictly in between are `COUNT(*) - 2`, floored at 0 by `GREATEST` for members with a single check-in; with distinct timestamps nothing ties with the first or latest visit.",
      "",
      "`FIRST_VALUE(branch)` over the same two orderings reads the branches without the grouping step; `DISTINCT` then collapses each member's identical rows. A window-free version finds each member's first and last times with `MIN`/`MAX`, then looks up the branch at those times and counts the visits strictly between them with correlated subqueries. The window plans sort the table by member and time once.",
    ].join("\n"),
  },
  {
    slug: "cloud-kitchen-seven-day-moving-average",
    title: "Cloud Kitchen Seven-Day Moving Average",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates", "Aggregation"],
    description: [
      "A cloud kitchen reviews its sales as a 7-day moving window, which smooths out the weekend rush. The kitchen is open every day, and **every date from its first order to its last has at least one order**.",
      "",
      "For each date from the **seventh day** on (the first order date plus six days), return `order_date`, `week_total` — the total `amount` of all orders on that date and the six dates before it — and `week_average` — that total divided by 7. Round both to 2 decimal places. Order the rows by `order_date`. If the orders span fewer than seven days, return no rows.",
    ].join("\n"),
    tables: [
      {
        name: "KitchenOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "order_date", type: "date" },
          { name: "amount", type: "decimal" },
        ],
        primaryKey: ["order_id"],
        note: "One row per order; a date usually has several. `amount` is the bill in rupees.",
      },
    ],
    examples: [
      {
        KitchenOrder: [
          [1, 11, "2025-08-01", 250],
          [2, 12, "2025-08-02", 180.5],
          [3, 11, "2025-08-03", 320],
          [4, 13, "2025-08-03", 99.5],
          [5, 14, "2025-08-04", 410],
          [6, 12, "2025-08-05", 150],
          [7, 15, "2025-08-06", 275],
          [8, 11, "2025-08-07", 200],
          [9, 13, "2025-08-08", 330],
          [10, 14, "2025-08-08", 120],
          [11, 12, "2025-08-09", 90],
        ],
      },
    ],
    gen: (rng) => {
      if (chance(rng, 0.03)) return { KitchenOrder: [] };
      const start = dateBetween(rng, "2025-01-01", "2025-11-30");
      const days = chance(rng, 0.12) ? ri(rng, 1, 6) : ri(rng, 7, 14);
      const rows: Cell[][] = [];
      for (let d = 0; d < days; d++) {
        const orders = pick(rng, [1, 1, 2, 2, 3]);
        // Half-rupee amounts keep every sum exact in floating point.
        for (let k = 0; k < orders; k++) rows.push([rows.length + 1, ri(rng, 1, 20), addDays(start, d), ri(rng, 160, 1200) / 2]);
      }
      return { KitchenOrder: shuffle(rng, rows) };
    },
    solution: [
      "WITH daily AS (",
      "  SELECT order_date, SUM(amount) AS day_total",
      "  FROM KitchenOrder",
      "  GROUP BY order_date",
      "), rolling AS (",
      "  SELECT order_date,",
      "         SUM(day_total) OVER (ORDER BY order_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS week_total,",
      "         ROW_NUMBER() OVER (ORDER BY order_date) AS day_no",
      "  FROM daily",
      ")",
      "SELECT order_date, ROUND(week_total, 2) AS week_total, ROUND(week_total / 7, 2) AS week_average",
      "FROM rolling",
      "WHERE day_no >= 7",
      "ORDER BY order_date",
    ].join("\n"),
    alternatives: [
      [
        "SELECT d1.order_date,",
        "       ROUND(SUM(d2.day_total), 2) AS week_total,",
        "       ROUND(SUM(d2.day_total) / 7, 2) AS week_average",
        "FROM (SELECT order_date, SUM(amount) AS day_total FROM KitchenOrder GROUP BY order_date) d1",
        "JOIN (SELECT order_date, SUM(amount) AS day_total FROM KitchenOrder GROUP BY order_date) d2",
        "  ON DATEDIFF(d1.order_date, d2.order_date) BETWEEN 0 AND 6",
        "WHERE d1.order_date >= DATE_ADD((SELECT MIN(order_date) FROM KitchenOrder), INTERVAL 6 DAY)",
        "GROUP BY d1.order_date",
        "ORDER BY d1.order_date",
      ].join("\n"),
      [
        "SELECT k.order_date,",
        "       ROUND((SELECT SUM(x.amount) FROM KitchenOrder x",
        "              WHERE x.order_date BETWEEN DATE_SUB(k.order_date, INTERVAL 6 DAY) AND k.order_date), 2) AS week_total,",
        "       ROUND((SELECT SUM(x.amount) FROM KitchenOrder x",
        "              WHERE x.order_date BETWEEN DATE_SUB(k.order_date, INTERVAL 6 DAY) AND k.order_date) / 7, 2) AS week_average",
        "FROM (SELECT DISTINCT order_date FROM KitchenOrder) k",
        "WHERE k.order_date >= DATE_ADD((SELECT MIN(order_date) FROM KitchenOrder), INTERVAL 6 DAY)",
        "ORDER BY k.order_date",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First reduce the orders to one row per date with that date's total.",
      "A window frame such as `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` sums a row and the six rows before it.",
      "Because every date is present, six rows back is exactly six days back.",
      "The first six dates do not have a full week behind them — number the dates and skip those.",
    ],
    editorial: [
      "There are usually several orders per date, and the window must move by **date**, not by order. So the first step aggregates to one row per date (`daily`). Since every date between the first and last order is present, the seven dates ending at a given date are exactly that row and the six rows before it, which is the frame `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW`. `SUM` over that frame is the week's total, and dividing by 7 gives the average — always 7, because the statement defines the average over seven days.",
      "",
      "The first six dates have fewer than six days behind them, and their frame is silently shorter, so they are dropped with `ROW_NUMBER() … >= 7`, which is the same as dates from `MIN(order_date) + 6 days` on. Rounding happens last, on the exact sums.",
      "",
      "Without windows, join the daily totals to themselves on `DATEDIFF(d1, d2) BETWEEN 0 AND 6` and sum the matches, or use a correlated `SUM` over `BETWEEN DATE_SUB(date, INTERVAL 6 DAY) AND date`. These calendar-based versions would stay correct even if some dates were missing, where `ROWS` would reach back too far; a `RANGE` frame over a day number has the same property. The window plan is one sort of the daily rows; the join compares every pair of dates.",
    ].join("\n"),
  },
  {
    slug: "top-three-run-scorers-per-team",
    title: "Top Three Run Totals in Every League Team",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins"],
    description: [
      "The inter-college cricket league awards a medal to each player whose season run total is among the **three highest distinct totals in their team**. Equal totals share a medal, so a team can have more than three medallists: totals of 410, 410, 385, 300, 120 give medals to the four players with 410, 385 and 300. A player with NULL `season_runs` has not batted this season and never gets a medal, and a team with fewer than three distinct totals gives a medal to every player who batted.",
      "",
      "Return every medallist with columns `team` (the team's name), `player` and `runs`. Teams with no players do not appear. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Team",
        columns: [
          { name: "team_id", type: "int" },
          { name: "team_name", type: "varchar" },
        ],
        primaryKey: ["team_id"],
        note: "One row per team.",
      },
      {
        name: "Player",
        columns: [
          { name: "player_id", type: "int" },
          { name: "player_name", type: "varchar" },
          { name: "team_id", type: "int" },
          { name: "season_runs", type: "int" },
        ],
        primaryKey: ["player_id"],
        note: "One row per player; `team_id` always names a row of `Team`. `season_runs` is NULL for a player who has not batted.",
      },
    ],
    examples: [
      {
        Team: [
          [1, "Hilltop Hawks"],
          [2, "Riverside Rhinos"],
          [3, "Lakeview Lions"],
        ],
        Player: [
          [1, "Arjun", 1, 410],
          [2, "Rohan", 1, 385],
          [3, "Karan", 1, 410],
          [4, "Dev", 1, 300],
          [5, "Ishaan", 1, 120],
          [6, "Vikram", 2, 250],
          [7, "Kabir", 2, null],
          [8, "Harsh", 2, 180],
        ],
      },
    ],
    gen: (rng) => {
      const teams = sample(rng, LEAGUE_TEAMS, ri(rng, 1, 4)).map((name, i) => [i + 1, name]);
      const n = chance(rng, 0.04) ? 0 : ri(rng, 1, 20);
      // A small pool of totals per team, so equal totals are common.
      const pools = teams.map(() => Array.from({ length: ri(rng, 1, 6) }, () => roundTo(rng, 0, 500, 10)));
      const rows: Cell[][] = names(rng, n).map((who, i) => {
        const t = ri(rng, 1, teams.length);
        return [i + 1, who, t, maybeNull(rng, 0.1, pick(rng, pools[t - 1]!))];
      });
      return { Team: teams, Player: rows };
    },
    solution: [
      "SELECT t.team_name AS team, r.player_name AS player, r.season_runs AS runs",
      "FROM (",
      "  SELECT player_name, team_id, season_runs,",
      "         DENSE_RANK() OVER (PARTITION BY team_id ORDER BY season_runs DESC) AS medal_rank",
      "  FROM Player",
      "  WHERE season_runs IS NOT NULL",
      ") r",
      "JOIN Team t ON t.team_id = r.team_id",
      "WHERE r.medal_rank <= 3",
    ].join("\n"),
    alternatives: [
      [
        "SELECT t.team_name AS team, p.player_name AS player, p.season_runs AS runs",
        "FROM Player p",
        "JOIN Team t ON t.team_id = p.team_id",
        "WHERE p.season_runs IS NOT NULL",
        "  AND (SELECT COUNT(DISTINCT q.season_runs) FROM Player q",
        "       WHERE q.team_id = p.team_id AND q.season_runs > p.season_runs) < 3",
      ].join("\n"),
      [
        "SELECT t.team_name AS team, p.player_name AS player, p.season_runs AS runs",
        "FROM Player p",
        "JOIN Team t ON t.team_id = p.team_id",
        "LEFT JOIN Player q ON q.team_id = p.team_id AND q.season_runs > p.season_runs",
        "WHERE p.season_runs IS NOT NULL",
        "GROUP BY p.player_id, t.team_name, p.player_name, p.season_runs",
        "HAVING COUNT(DISTINCT q.season_runs) < 3",
      ].join("\n"),
    ],
    hints: [
      "\"Top three per team\" means the ranking restarts in every team: `PARTITION BY`.",
      "Equal totals share a medal and the next total is still eligible — which ranking function gives 1, 1, 2, 3?",
      "A window value cannot be filtered in the same `SELECT`'s `WHERE`; rank in a subquery and filter outside it.",
      "Where does a NULL total land in a descending ranking? Make sure it can never take a medal place.",
    ],
    editorial: [
      "The ranking must restart in each team, and equal totals must share a place **without** using up the next one: 410, 410, 385, 300 are places 1, 1, 2, 3, so all four players win medals. That is `DENSE_RANK() OVER (PARTITION BY team_id ORDER BY season_runs DESC)`. `RANK()` would give 1, 1, 3, 4 and drop the 300; `ROW_NUMBER()` would drop a tied player outright.",
      "",
      "Window functions are evaluated after `WHERE`, so the rank cannot be filtered in the query that computes it. Rank inside a derived table (or CTE), then keep `medal_rank <= 3` outside and join `Team` for the name.",
      "",
      "The NULL rule is the subtle part. In a descending order NULLs sort last, so in a team with only two distinct totals a NULL would get dense rank 3 and a medal. Filtering `season_runs IS NOT NULL` *before* ranking removes them. The correlated version has the same trap from the other side: for a NULL total, the count of higher totals is 0, which is \"in the top three\" — hence the same filter.",
      "",
      "That correlated version reads naturally: a player medals when fewer than three distinct totals in their team are strictly higher. The self-join version counts those higher totals with `LEFT JOIN … GROUP BY … HAVING`. Both are quadratic within each team; the window plan is one sort by team and total.",
    ].join("\n"),
  },
  {
    slug: "book-fair-busy-day-streaks",
    title: "Busy Streaks at the Book Fair",
    difficulty: "HARD",
    topics: ["Window Functions"],
    description: [
      "The city book fair counts visitors every day it is open; `day_no` is the fair's day number (day 1 is opening day), and a day the fair stayed **closed has no row**. A day is **busy** when its `footfall` is **at least 100**; a NULL footfall means the counter failed and the day is not busy.",
      "",
      "Return every day that belongs to a streak of **three or more consecutive day numbers** that are all busy, with columns `day_no`, `visit_date` and `footfall`, **ordered by `visit_date`**. A closed day breaks a streak, because its day number is missing.",
    ].join("\n"),
    tables: [
      {
        name: "FairDay",
        columns: [
          { name: "day_no", type: "int" },
          { name: "visit_date", type: "date" },
          { name: "footfall", type: "int" },
        ],
        primaryKey: ["day_no"],
        note: "One row per day the fair was open. `visit_date` is opening day plus `day_no - 1` days, so day numbers and dates rise together; numbers of closed days are skipped.",
      },
    ],
    examples: [
      {
        FairDay: [
          [1, "2025-01-04", 120],
          [2, "2025-01-05", 140],
          [3, "2025-01-06", 100],
          [4, "2025-01-07", 80],
          [5, "2025-01-08", 210],
          [6, "2025-01-09", 230],
          [8, "2025-01-11", 260],
          [9, "2025-01-12", 190],
          [10, "2025-01-13", 175],
          [11, "2025-01-14", null],
        ],
      },
    ],
    gen: (rng) => {
      const opening = dateBetween(rng, "2025-01-01", "2025-12-01");
      const span = chance(rng, 0.04) ? 0 : ri(rng, 4, 18);
      const busyRate = chance(rng, 0.2) ? 0.45 : 0.75;
      // "closed" = no row for that day; otherwise the day's footfall, which may be NULL.
      const days: (number | null | "closed")[] = [];
      for (let day = 1; day <= span; day++) {
        if (chance(rng, 0.12)) days.push("closed");
        else if (chance(rng, 0.05)) days.push(null);
        else if (chance(rng, busyRate)) days.push(chance(rng, 0.1) ? 100 : ri(rng, 100, 400));
        else days.push(chance(rng, 0.1) ? 99 : ri(rng, 20, 99));
      }
      // Usually plant a streak of three or four busy days; now and then a near miss — busy, busy, closed, busy.
      if (span >= 4 && chance(rng, 0.5)) {
        const len = ri(rng, 3, 4);
        const at = ri(rng, 0, span - len);
        for (let k = at; k < at + len; k++) days[k] = k === at && chance(rng, 0.3) ? 100 : ri(rng, 100, 400);
      } else if (span >= 4 && chance(rng, 0.4)) {
        const at = ri(rng, 0, span - 4);
        days[at] = ri(rng, 100, 400);
        days[at + 1] = ri(rng, 100, 400);
        days[at + 2] = "closed";
        days[at + 3] = ri(rng, 100, 400);
      }
      const rows: Cell[][] = [];
      days.forEach((f, i) => {
        if (f !== "closed") rows.push([i + 1, addDays(opening, i), f]);
      });
      return { FairDay: shuffle(rng, rows) };
    },
    solution: [
      "WITH busy AS (",
      "  SELECT day_no, visit_date, footfall,",
      "         day_no - ROW_NUMBER() OVER (ORDER BY day_no) AS streak_key",
      "  FROM FairDay",
      "  WHERE footfall >= 100",
      ")",
      "SELECT day_no, visit_date, footfall",
      "FROM (",
      "  SELECT day_no, visit_date, footfall, COUNT(*) OVER (PARTITION BY streak_key) AS streak_len",
      "  FROM busy",
      ") s",
      "WHERE streak_len >= 3",
      "ORDER BY visit_date",
    ].join("\n"),
    alternatives: [
      [
        "SELECT day_no, visit_date, footfall",
        "FROM (",
        "  SELECT day_no, visit_date, footfall,",
        "         LAG(day_no, 2) OVER (ORDER BY day_no) AS back2,",
        "         LAG(day_no, 1) OVER (ORDER BY day_no) AS back1,",
        "         LEAD(day_no, 1) OVER (ORDER BY day_no) AS ahead1,",
        "         LEAD(day_no, 2) OVER (ORDER BY day_no) AS ahead2",
        "  FROM FairDay",
        "  WHERE footfall >= 100",
        ") t",
        "WHERE back2 = day_no - 2",
        "   OR (back1 = day_no - 1 AND ahead1 = day_no + 1)",
        "   OR ahead2 = day_no + 2",
        "ORDER BY visit_date",
      ].join("\n"),
      [
        "SELECT DISTINCT a.day_no, a.visit_date, a.footfall",
        "FROM FairDay a, FairDay b, FairDay c",
        "WHERE a.footfall >= 100 AND b.footfall >= 100 AND c.footfall >= 100",
        "  AND ((b.day_no = a.day_no + 1 AND c.day_no = a.day_no + 2)",
        "    OR (b.day_no = a.day_no - 1 AND c.day_no = a.day_no + 1)",
        "    OR (b.day_no = a.day_no - 2 AND c.day_no = a.day_no - 1))",
        "ORDER BY a.visit_date",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Keep only the busy days first; the question becomes which of them form runs of consecutive day numbers.",
      "Comparing a busy day with the *previous busy row* is not enough: days 6 and 8 are neighbours among the busy rows, but day 7 was closed.",
      "Number the busy days 1, 2, 3, … in order. Along a run of consecutive day numbers, `day_no` minus that number stays the same.",
      "A day belongs in the answer if it is the first, middle or last of some three consecutive busy days.",
    ],
    editorial: [
      "First keep only the busy days (`footfall >= 100`; NULL fails the test, so a failed counter is not busy). What remains is a sorted set of day numbers, and the task is to find **islands** of consecutive numbers of size three or more.",
      "",
      "The gaps-and-islands trick: number the busy days with `ROW_NUMBER() OVER (ORDER BY day_no)`. Inside a run of consecutive days, both `day_no` and the row number rise by 1 each step, so `day_no - ROW_NUMBER()` is constant; any gap — a quiet day, a NULL, or a closed day with no row — makes `day_no` jump while the row number does not, so the difference changes. That difference is a key for the island, and `COUNT(*) OVER (PARTITION BY streak_key)` gives each day the length of its island. Keep lengths ≥ 3 and sort by date.",
      "",
      "The closed-day case is where a naive `LAG`/`LEAD` on the busy rows goes wrong: day 6 and day 8 are adjacent *rows*, but not adjacent *days*. Comparing the neighbours' `day_no` values with `day_no ± 1` and `± 2` fixes it — a day qualifies if it starts, sits in the middle of, or ends a triple. A triple self join expresses the same three cases with `DISTINCT` to remove repeats. The island version handles any streak length in one sort; the self join is cubic without indexes.",
    ].join("\n"),
  },
];
