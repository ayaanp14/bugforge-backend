import type { SqlProblemSpec } from "./types.js";
import { FIRST_NAMES, chance, names, pick, ri, roundTo, sample } from "./kit.js";

/** Basics and conditional logic: filters, NULL handling, CASE/IF. Easiest first. */

const range = (lo: number, hi: number): number[] => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

const BRANCHES = ["CSE", "ECE", "ME", "IT", "EEE", "Civil"] as const;
const CANTEEN_ITEMS = ["Masala Dosa", "Vada Pav", "Cold Coffee", "Samosa", "Paneer Roll", "Chai", "Poha"] as const;
const FEST_TITLES: Record<string, readonly string[]> = {
  Music: ["Battle of the Bands", "Unplugged Evening", "Indie Night"],
  Dance: ["Classical Fusion", "Street Dance Face-off", "Salsa Night"],
  Drama: ["Nukkad Natak", "One-Act Plays", "Mime Show"],
  Quiz: ["Quiz Mania", "Tech Quiz", "Sports Quiz"],
  Workshop: ["Robotics Workshop", "Drone Workshop", "Photography Workshop"],
};
const FEST_CATEGORIES = Object.keys(FEST_TITLES);

export const BASICS: SqlProblemSpec[] = [
  {
    slug: "scholarship-shortlist-by-cgpa-or-hackathons",
    title: "Scholarship Shortlist by CGPA or Hackathon Wins",
    difficulty: "EASY",
    topics: ["Basics"],
    description: [
      "The training and placement cell is short-listing students for a merit scholarship. A student qualifies if their `cgpa` is **at least 9.0**, or if they have won **at least 2** hackathons — or both.",
      "",
      "Return the `student_id` and `name` of every qualifying student, each student once, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Student",
        columns: [
          { name: "student_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "branch", type: "varchar" },
          { name: "cgpa", type: "decimal" },
          { name: "hackathon_wins", type: "int" },
        ],
        primaryKey: ["student_id"],
        note: "`cgpa` is on a 10-point scale with two decimals; `hackathon_wins` counts inter-college hackathons won. Neither column is ever NULL.",
      },
    ],
    examples: [
      {
        Student: [
          [1, "Aarav", "CSE", 9.12, 0],
          [2, "Diya", "ECE", 8.4, 3],
          [3, "Kabir", "ME", 8.95, 1],
          [4, "Meera", "CSE", 9.0, 2],
          [5, "Rohan", "IT", 7.8, 0],
          [6, "Sneha", "EEE", 8.1, 2],
          [7, "Vikram", "CSE", 6.95, 1],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.04) ? 0 : ri(rng, 1, 14);
      const people = names(rng, n);
      const ids = sample(rng, range(1, 40), n);
      return {
        Student: people.map((name, i) => {
          const r = rng();
          // The boundary values "at least" is about, often.
          const cgpa = r < 0.15 ? 9 : r < 0.25 ? 8.99 : ri(rng, 600, 1000) / 100;
          return [ids[i]!, name, pick(rng, BRANCHES), cgpa, pick(rng, [0, 0, 0, 1, 1, 1, 2, 2, 3, 4])];
        }),
      };
    },
    solution: [
      "SELECT student_id, name",
      "FROM Student",
      "WHERE cgpa >= 9.0 OR hackathon_wins >= 2",
    ].join("\n"),
    alternatives: [
      "SELECT student_id, name FROM Student WHERE cgpa >= 9.0 UNION SELECT student_id, name FROM Student WHERE hackathon_wins >= 2",
      "SELECT student_id, name FROM Student WHERE NOT (cgpa < 9.0 AND hackathon_wins < 2)",
      "SELECT student_id, name FROM Student WHERE CASE WHEN cgpa >= 9.0 THEN 1 WHEN hackathon_wins >= 2 THEN 1 ELSE 0 END = 1",
    ],
    hints: [
      "A student qualifies through either of two separate conditions — which logical operator joins them?",
      "\"At least\" includes the boundary: a CGPA of exactly 9.00 qualifies, and so do exactly two wins.",
      "A row is kept or dropped once by `WHERE`, so a student meeting both conditions is not repeated.",
    ],
    editorial: [
      "A student qualifies through either of two independent conditions, so the whole query is one `WHERE` with **`OR`**: `cgpa >= 9.0 OR hackathon_wins >= 2`. A student who meets both is still a single row — `WHERE` keeps or drops each row once and never duplicates it — so no `DISTINCT` is needed.",
      "",
      "The words \"at least\" decide the operators. A CGPA of exactly 9.00, or exactly two wins, must qualify, so both comparisons are `>=`. Writing `>` silently drops the students sitting on the boundary, which is the most common wrong answer here.",
      "",
      "Another way to read the rule is as two lists glued together: the students with a high CGPA, `UNION` the students with enough wins. `UNION` (not `UNION ALL`) removes the students who appear in both lists. It reads the table twice, so the single `OR` filter is the cheaper choice — one scan, linear in the size of the table.",
      "",
      "By De Morgan's law the rule can also be written as `NOT (cgpa < 9.0 AND hackathon_wins < 2)`: a student is left out only when both numbers are too low. That rewrite is safe here only because neither column is ever NULL — with NULLs, the negated form and the original can disagree.",
    ].join("\n"),
  },
  {
    slug: "canteen-orders-without-the-fest-coupon",
    title: "Canteen Orders Not Placed With the FEST50 Coupon",
    difficulty: "EASY",
    topics: ["Basics"],
    description: [
      "The college canteen is withdrawing its `FEST50` coupon and wants to see which orders the change would not have touched.",
      "",
      "Return `order_id`, `student_name` and `coupon_code` for every order that was **not placed with the coupon `FEST50`**. An order with no coupon at all (`coupon_code` is NULL) counts as not using it and must be in the result. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "CanteenOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "student_name", type: "varchar" },
          { name: "item", type: "varchar" },
          { name: "amount", type: "int" },
          { name: "coupon_code", type: "varchar" },
        ],
        primaryKey: ["order_id"],
        note: "One row per order. `coupon_code` is the coupon applied to the order (always in capitals), or NULL when the student paid full price.",
      },
    ],
    examples: [
      {
        CanteenOrder: [
          [101, "Riya", "Masala Dosa", 60, "FEST50"],
          [102, "Arjun", "Vada Pav", 25, null],
          [103, "Zara", "Cold Coffee", 70, "WELCOME10"],
          [104, "Dev", "Samosa", 20, null],
          [105, "Ananya", "Paneer Roll", 90, "FEST50"],
          [106, "Harsh", "Chai", 15, "FEST25"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.04) ? 0 : ri(rng, 1, 14);
      const allFest = chance(rng, 0.05);
      return {
        CanteenOrder: range(1, n).map((i) => {
          const r = rng();
          const coupon = allFest || r < 0.35 ? "FEST50" : r < 0.7 ? null : pick(rng, ["WELCOME10", "MONSOON20", "FEST25"]);
          return [100 + i, pick(rng, FIRST_NAMES), pick(rng, CANTEEN_ITEMS), roundTo(rng, 10, 120, 5), coupon];
        }),
      };
    },
    solution: [
      "SELECT order_id, student_name, coupon_code",
      "FROM CanteenOrder",
      "WHERE coupon_code <> 'FEST50' OR coupon_code IS NULL",
    ].join("\n"),
    alternatives: [
      "SELECT order_id, student_name, coupon_code FROM CanteenOrder WHERE IFNULL(coupon_code, '') <> 'FEST50'",
      "SELECT order_id, student_name, coupon_code FROM CanteenOrder WHERE NOT (coupon_code <=> 'FEST50')",
      "SELECT order_id, student_name, coupon_code FROM CanteenOrder WHERE order_id NOT IN (SELECT order_id FROM CanteenOrder WHERE coupon_code = 'FEST50')",
    ],
    hints: [
      "Try `WHERE coupon_code <> 'FEST50'` on the example and count the rows: some orders are missing. Which ones?",
      "A comparison with NULL is neither true nor false but unknown, and `WHERE` keeps only rows where the condition is true.",
      "Say explicitly what should happen to a missing coupon — `IS NULL` is the test that is true for NULL.",
    ],
    editorial: [
      "The obvious filter, `coupon_code <> 'FEST50'`, returns the orders with *other* coupons but silently loses every order with no coupon. In SQL a comparison with NULL is neither true nor false but **unknown**, and `WHERE` keeps only the rows where the condition is true — so `NULL <> 'FEST50'` drops the row exactly as `NULL = 'FEST50'` would.",
      "",
      "The fix is to state what should happen to NULL: `coupon_code <> 'FEST50' OR coupon_code IS NULL`. `IS NULL` is the one test that is true for a missing value, and the `OR` brings those rows back.",
      "",
      "Other spellings of the same idea:",
      "",
      "- replace NULL with a value that can never be the coupon before comparing: `IFNULL(coupon_code, '') <> 'FEST50'`;",
      "- use MySQL's NULL-safe equality `<=>`, which treats NULL as an ordinary value (`NULL <=> 'FEST50'` is 0, not NULL), and negate it;",
      "- turn the question around and keep every order whose id is `NOT IN` the list of FEST50 orders. That list holds ids, never NULL, so `NOT IN` is safe here — a `NOT IN` over a list containing a NULL would return nothing at all.",
      "",
      "Each version reads the table once (the `NOT IN` one twice), so all are linear in the number of orders.",
    ].join("\n"),
  },
  {
    slug: "main-stage-fest-events-by-rating",
    title: "Main-Stage Fest Events Ranked by Rating",
    difficulty: "EASY",
    topics: ["Basics"],
    description: [
      "At the college fest, events with an **odd** `event_id` are staged in the open-air main arena; the even ones run in classrooms. The organisers want a running order for the main arena that leaves out the workshops.",
      "",
      "Return `event_id`, `title` and `rating` for every event with an odd `event_id` whose `category` is **not** `'Workshop'`, ordered by `rating` from highest to lowest. When two events have the same rating, the one with the smaller `event_id` comes first.",
    ].join("\n"),
    tables: [
      {
        name: "FestEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "title", type: "varchar" },
          { name: "category", type: "enum", values: FEST_CATEGORIES },
          { name: "rating", type: "decimal" },
        ],
        primaryKey: ["event_id"],
        note: "`rating` is the average audience rating out of 5, to one decimal place. `category` is never NULL.",
      },
    ],
    examples: [
      {
        FestEvent: [
          [1, "Battle of the Bands", "Music", 4.6],
          [2, "One-Act Plays", "Drama", 4.8],
          [3, "Robotics Workshop", "Workshop", 4.9],
          [5, "Quiz Mania", "Quiz", 4.1],
          [7, "Nukkad Natak", "Drama", 4.6],
          [8, "Salsa Night", "Dance", 3.9],
          [9, "Classical Fusion", "Dance", 4.7],
        ],
      },
    ],
    gen: (rng) => {
      const ids = chance(rng, 0.03) ? [] : sample(rng, range(1, 30), ri(rng, 1, 14)).sort((a, b) => a - b);
      return {
        FestEvent: ids.map((id) => {
          const category = pick(rng, FEST_CATEGORIES);
          // 21 possible ratings over up to 14 rows: ties are common, on purpose.
          return [id, pick(rng, FEST_TITLES[category]!), category, ri(rng, 30, 50) / 10];
        }),
      };
    },
    solution: [
      "SELECT event_id, title, rating",
      "FROM FestEvent",
      "WHERE MOD(event_id, 2) = 1 AND category <> 'Workshop'",
      "ORDER BY rating DESC, event_id",
    ].join("\n"),
    alternatives: [
      "SELECT event_id, title, rating FROM FestEvent WHERE event_id % 2 = 1 AND category NOT IN ('Workshop') ORDER BY rating DESC, event_id ASC",
      "SELECT event_id, title, rating FROM FestEvent WHERE event_id - 2 * (event_id DIV 2) = 1 AND category <> 'Workshop' ORDER BY rating DESC, event_id",
    ],
    ordered: true,
    hints: [
      "A number is odd when the remainder of dividing it by 2 is 1 — MySQL has `MOD(a, b)` and the `%` operator for that.",
      "Both conditions must hold at once, so combine them with `AND`.",
      "Sort by rating descending, and give the sort a second key for equal ratings, as the statement asks.",
    ],
    editorial: [
      "Three requirements, each mapping onto one clause.",
      "",
      "- **Odd id.** `MOD(event_id, 2) = 1` (or `event_id % 2 = 1`) is true exactly for odd numbers. The ids are positive, so there is no negative-remainder surprise.",
      "- **Not a workshop.** `category <> 'Workshop'`. The category is never NULL, so the NULL trap of `<>` does not apply here — but it is worth checking the schema for it every time you write `<>`.",
      "- **Order.** `ORDER BY rating DESC` puts the best-rated event first. Two events can share a rating, and the statement fixes their order too, so a second key, `event_id` ascending, is needed. Without it the database may return tied rows in any order, and a comparison that checks order can fail at random.",
      "",
      "The two filters are combined with `AND` in one `WHERE`, and the sort runs over the rows that are left: one scan plus a sort of the kept rows, O(n log n).",
      "",
      "Equivalent spellings: the odd test as `event_id - 2 * (event_id DIV 2) = 1` (subtract the even part and see what remains), and the category test as `NOT IN ('Workshop')`.",
    ].join("\n"),
  },
  {
    slug: "bowlers-who-caught-their-own-delivery",
    title: "Bowlers Who Took a Caught-and-Bowled Wicket",
    difficulty: "EASY",
    topics: ["Basics"],
    description: [
      "In a *caught and bowled* dismissal the bowler catches the ball off their own delivery, so the wicket's `fielder_id` is the same player as its `bowler_id`.",
      "",
      "Return the `bowler_id` of every bowler who has taken **at least one** caught-and-bowled wicket, each bowler once, ordered by `bowler_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Dismissal",
        columns: [
          { name: "match_id", type: "int" },
          { name: "wicket_no", type: "int" },
          { name: "batter_id", type: "int" },
          { name: "bowler_id", type: "int" },
          { name: "fielder_id", type: "int" },
        ],
        primaryKey: ["match_id", "wicket_no"],
        note: "One row per wicket credited to a bowler in a college cricket league. `fielder_id` is the player who took the catch, or NULL when no fielder was involved (bowled, LBW).",
      },
    ],
    examples: [
      {
        Dismissal: [
          [1, 1, 21, 4, 7],
          [1, 2, 22, 4, 4],
          [1, 3, 23, 9, null],
          [1, 4, 24, 4, 4],
          [2, 1, 31, 9, 2],
          [2, 2, 32, 2, 2],
          [2, 3, 33, 6, null],
          [2, 4, 34, 6, 9],
        ],
      },
    ],
    gen: (rng) => {
      const rows: (number | null)[][] = [];
      const matches = chance(rng, 0.04) ? 0 : ri(rng, 1, 4);
      for (let m = 1; m <= matches; m++) {
        const wickets = ri(rng, 1, 8);
        for (let w = 1; w <= wickets; w++) {
          const bowler = ri(rng, 1, 10);
          const r = rng();
          const fielder = r < 0.12 ? bowler : r < 0.45 ? null : ri(rng, 1, 11);
          rows.push([m, w, ri(rng, 20, 40), bowler, fielder]);
        }
      }
      // Most datasets have at least one caught-and-bowled.
      if (rows.length && chance(rng, 0.6)) {
        const r = pick(rng, rows);
        r[4] = r[3]!;
      }
      return { Dismissal: rows };
    },
    solution: [
      "SELECT DISTINCT bowler_id",
      "FROM Dismissal",
      "WHERE fielder_id = bowler_id",
      "ORDER BY bowler_id",
    ].join("\n"),
    alternatives: [
      "SELECT bowler_id FROM Dismissal WHERE fielder_id = bowler_id GROUP BY bowler_id ORDER BY bowler_id",
      "SELECT bowler_id FROM Dismissal GROUP BY bowler_id HAVING SUM(fielder_id = bowler_id) > 0 ORDER BY bowler_id",
    ],
    ordered: true,
    hints: [
      "The condition compares two columns of the same row — no join is needed.",
      "What does `fielder_id = bowler_id` give for a bowled wicket, where `fielder_id` is NULL?",
      "A bowler can have several such wickets; collapse the duplicates before sorting.",
    ],
    editorial: [
      "The condition compares two columns of the **same row**: a wicket is caught-and-bowled when `fielder_id = bowler_id`. No join or subquery is needed — `WHERE fielder_id = bowler_id` keeps exactly those wickets.",
      "",
      "Bowled and LBW wickets have `fielder_id` NULL. `NULL = bowler_id` is unknown rather than true, so those rows are dropped without any extra test — which is what we want, since nobody caught anything.",
      "",
      "A bowler can take several caught-and-bowled wickets, and the statement wants each bowler once, so the kept rows are collapsed with `SELECT DISTINCT bowler_id`. `GROUP BY bowler_id` removes duplicates the same way. Finally `ORDER BY bowler_id` fixes the order the statement asks for.",
      "",
      "A different approach groups *every* wicket by bowler first and keeps the groups containing at least one such wicket: `HAVING SUM(fielder_id = bowler_id) > 0`. In MySQL a comparison is 1, 0 or NULL, and `SUM` skips the NULLs, so the sum counts the caught-and-bowled wickets. It builds a group for every bowler rather than filtering first, so the `WHERE` version is usually lighter, but both are a single scan plus the cost of removing duplicates and sorting: O(n log n).",
    ].join("\n"),
  },
  {
    slug: "valid-playing-eleven-combinations",
    title: "Is the Playing XI Combination Valid?",
    difficulty: "EASY",
    topics: ["Conditional Logic"],
    description: [
      "Before each league match the captain submits a plan for the playing XI, saying how many players of each role it uses. A plan is valid only when **all three** rules hold:",
      "",
      "- it has **exactly 11** players in total;",
      "- it has **at least one** wicket-keeper;",
      "- at least **5 players can bowl** — bowlers and all-rounders together.",
      "",
      "Return `plan_id` and a column `is_valid` holding `'Yes'` for a valid plan and `'No'` otherwise, one row per plan, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "SquadPlan",
        columns: [
          { name: "plan_id", type: "int" },
          { name: "batters", type: "int" },
          { name: "keepers", type: "int" },
          { name: "all_rounders", type: "int" },
          { name: "bowlers", type: "int" },
        ],
        primaryKey: ["plan_id"],
        note: "Each column after `plan_id` is how many players of that role the plan picks. No column is ever NULL.",
      },
    ],
    examples: [
      {
        SquadPlan: [
          [1, 5, 1, 2, 3],
          [2, 6, 1, 1, 3],
          [3, 5, 0, 3, 3],
          [4, 4, 1, 2, 4],
          [5, 5, 1, 2, 4],
          [6, 3, 2, 3, 3],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      return {
        SquadPlan: range(1, n).map((id) => {
          const keepers = pick(rng, [0, 1, 1, 1, 2]);
          const bowlers = ri(rng, 2, 5);
          const allRounders = ri(rng, 0, 4);
          let batters = 11 - keepers - bowlers - allRounders;
          if (chance(rng, 0.3)) batters += pick(rng, [-1, 1, 2]);
          return [id, Math.max(0, batters), keepers, allRounders, bowlers];
        }),
      };
    },
    solution: [
      "SELECT plan_id,",
      "       CASE",
      "         WHEN batters + keepers + all_rounders + bowlers = 11",
      "          AND keepers >= 1",
      "          AND bowlers + all_rounders >= 5 THEN 'Yes'",
      "         ELSE 'No'",
      "       END AS is_valid",
      "FROM SquadPlan",
    ].join("\n"),
    alternatives: [
      "SELECT plan_id, IF(batters + keepers + all_rounders + bowlers = 11 AND keepers >= 1 AND bowlers + all_rounders >= 5, 'Yes', 'No') AS is_valid FROM SquadPlan",
      "SELECT plan_id, CASE WHEN batters + keepers + all_rounders + bowlers <> 11 OR keepers < 1 OR bowlers + all_rounders < 5 THEN 'No' ELSE 'Yes' END AS is_valid FROM SquadPlan",
    ],
    hints: [
      "Every plan is judged on its own row, so no grouping or join is needed — just an expression per row.",
      "A `CASE WHEN … THEN 'Yes' ELSE 'No' END` turns a condition into the two labels.",
      "Write each rule as a comparison and join them with `AND`; watch `>=` versus `>` and remember all-rounders can bowl.",
    ],
    editorial: [
      "Each plan is checked on its own, so the answer is a `CASE` expression evaluated once per row: when all three rules hold, `'Yes'`, otherwise `'No'`.",
      "",
      "Write the rules exactly as the statement gives them and join them with `AND`:",
      "",
      "- `batters + keepers + all_rounders + bowlers = 11` — exactly eleven, so neither 10 nor 12 passes;",
      "- `keepers >= 1`;",
      "- `bowlers + all_rounders >= 5` — all-rounders count as bowling options, and five is enough.",
      "",
      "The usual mistakes are off-by-one comparisons (`> 5` instead of `>= 5`) and leaving a role out of the total.",
      "",
      "MySQL's `IF(condition, 'Yes', 'No')` is a shorter spelling of the same two-way `CASE`. The rules can also be inverted: list the ways a plan fails — a total other than 11, *or* no keeper, *or* fewer than five bowling options — and return `'No'` when any of them holds. By De Morgan's law the two forms agree, and because no column is NULL there is no third, unknown outcome that could fall into the `ELSE` branch by accident. The query reads every row once, so it runs in linear time.",
    ].join("\n"),
  },
  {
    slug: "delivery-time-bands-with-empty-bands",
    title: "Count Deliveries in Every Time Band",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic"],
    description: [
      "A food-delivery app sorts its deliveries into three bands by `minutes`:",
      "",
      "- `'On time'` — under 30 minutes;",
      "- `'Late'` — 30 to 45 minutes, both ends included;",
      "- `'Very late'` — more than 45 minutes.",
      "",
      "Return one row per band with the columns `band` and `deliveries` (how many deliveries fall in that band). **All three bands must appear**, with `0` for a band no delivery falls in. Deliveries still on the way (`minutes` is NULL) belong to no band. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Delivery",
        columns: [
          { name: "delivery_id", type: "int" },
          { name: "rider_id", type: "int" },
          { name: "minutes", type: "int" },
        ],
        primaryKey: ["delivery_id"],
        note: "`minutes` is the time from the order being placed to it reaching the door, in whole minutes, or NULL while the order is still on its way.",
      },
    ],
    examples: [
      {
        Delivery: [
          [1, 11, 22],
          [2, 12, 30],
          [3, 11, 45],
          [4, 13, 29],
          [5, 12, null],
          [6, 13, 41],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 15);
      // Some datasets leave a band empty on purpose.
      const [lo, hi] = pick(rng, [[10, 75], [10, 75], [10, 45], [30, 80], [8, 29]] as const);
      return {
        Delivery: range(1, n).map((id) => {
          const minutes = chance(rng, 0.1)
            ? null
            : chance(rng, 0.3)
              ? pick(rng, [29, 30, 45, 46].filter((m) => m >= lo && m <= hi).concat([lo]))
              : ri(rng, lo, hi);
          return [id, ri(rng, 1, 6), minutes];
        }),
      };
    },
    solution: [
      "SELECT 'On time' AS band, COUNT(*) AS deliveries FROM Delivery WHERE minutes < 30",
      "UNION ALL",
      "SELECT 'Late', COUNT(*) FROM Delivery WHERE minutes BETWEEN 30 AND 45",
      "UNION ALL",
      "SELECT 'Very late', COUNT(*) FROM Delivery WHERE minutes > 45",
    ].join("\n"),
    alternatives: [
      [
        "SELECT b.band, COUNT(d.band) AS deliveries",
        "FROM (SELECT 'On time' AS band UNION ALL SELECT 'Late' UNION ALL SELECT 'Very late') b",
        "LEFT JOIN (",
        "  SELECT CASE WHEN minutes < 30 THEN 'On time' WHEN minutes <= 45 THEN 'Late' WHEN minutes > 45 THEN 'Very late' END AS band",
        "  FROM Delivery",
        ") d ON d.band = b.band",
        "GROUP BY b.band",
      ].join("\n"),
      [
        "SELECT 'On time' AS band, IFNULL(SUM(minutes < 30), 0) AS deliveries FROM Delivery",
        "UNION ALL SELECT 'Late', IFNULL(SUM(minutes >= 30 AND minutes <= 45), 0) FROM Delivery",
        "UNION ALL SELECT 'Very late', IFNULL(SUM(minutes > 45), 0) FROM Delivery",
      ].join("\n"),
    ],
    hints: [
      "Grouping by a `CASE` gives the right counts — but which rows does it produce for a band nobody falls in?",
      "The list of bands must come from the query, not from the data: three literal rows.",
      "A `COUNT(*)` with no `GROUP BY` always returns exactly one row, even when no row matches.",
      "Mind the NULLs: a `CASE` ending in `ELSE 'Very late'` would put the deliveries still on the way into the last band.",
    ],
    editorial: [
      "Counting per band with `GROUP BY` over a `CASE` gives the right numbers for the bands that occur, but a band with no deliveries produces **no group at all**, so it is missing from the answer instead of showing 0. The bands have to come from the query itself.",
      "",
      "The most direct way is one query per band, stacked with `UNION ALL`: `SELECT 'On time' AS band, COUNT(*) AS deliveries FROM Delivery WHERE minutes < 30`, then the same for the other two ranges. An aggregate with no `GROUP BY` always returns exactly one row — `COUNT(*)` over zero matching rows is 0 — so every band appears. The column names come from the first `SELECT`.",
      "",
      "Alternatively, build a small derived table holding the three band names and `LEFT JOIN` the classified deliveries to it. Count a column of the joined side, `COUNT(d.band)`, so a band with no match counts 0 rather than 1.",
      "",
      "Watch the NULLs. A `CASE` that ends in `ELSE 'Very late'` would file every delivery still on the way under the last band; spelling out `WHEN minutes > 45 THEN 'Very late'` with no `ELSE` leaves them unclassified, and `WHERE minutes < 30` already rejects them. `BETWEEN 30 AND 45` includes both ends, which is exactly the \"Late\" band.",
      "",
      "The union version scans the table three times and the join version once; both are linear.",
    ].join("\n"),
  },
  {
    slug: "shop-customers-with-returns-kept-vs-returned",
    title: "Customers With a Return: Delivered vs Returned Value",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic"],
    description: [
      "An online shop is reviewing customers who send things back. For every customer with **at least one returned order**, return:",
      "",
      "- `customer_id`;",
      "- `delivered_amount` — the total `amount` of their delivered orders (`0` if they have none);",
      "- `returned_amount` — the total `amount` of their returned orders.",
      "",
      "Cancelled orders count towards neither total. Customers who never returned an order are not in the result. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "ShopOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["delivered", "returned", "cancelled"] },
        ],
        primaryKey: ["order_id"],
        note: "`amount` is the order's value in rupees. A cancelled order never shipped; a returned one was delivered and then sent back.",
      },
    ],
    examples: [
      {
        ShopOrder: [
          [1, 101, 1200, "delivered"],
          [2, 101, 450, "returned"],
          [3, 102, 900, "delivered"],
          [4, 102, 300, "cancelled"],
          [5, 103, 650, "returned"],
          [6, 103, 200, "cancelled"],
          [7, 101, 800, "delivered"],
          [8, 104, 500, "returned"],
          [9, 104, 500, "returned"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.03) ? 0 : ri(rng, 1, 16);
      const customers = sample(rng, range(101, 120), ri(rng, 1, 6));
      return {
        ShopOrder: range(1, n).map((id) => {
          const r = rng();
          const status = r < 0.5 ? "delivered" : r < 0.75 ? "returned" : "cancelled";
          return [id, pick(rng, customers), roundTo(rng, 100, 3000, 50), status];
        }),
      };
    },
    solution: [
      "SELECT customer_id,",
      "       SUM(IF(status = 'delivered', amount, 0)) AS delivered_amount,",
      "       SUM(IF(status = 'returned', amount, 0)) AS returned_amount",
      "FROM ShopOrder",
      "GROUP BY customer_id",
      "HAVING SUM(status = 'returned') > 0",
    ].join("\n"),
    alternatives: [
      [
        "SELECT customer_id,",
        "       SUM(CASE WHEN status = 'delivered' THEN amount ELSE 0 END) AS delivered_amount,",
        "       SUM(CASE WHEN status = 'returned' THEN amount ELSE 0 END) AS returned_amount",
        "FROM ShopOrder",
        "WHERE customer_id IN (SELECT customer_id FROM ShopOrder WHERE status = 'returned')",
        "GROUP BY customer_id",
      ].join("\n"),
      [
        "SELECT r.customer_id, COALESCE(d.total, 0) AS delivered_amount, r.total AS returned_amount",
        "FROM (SELECT customer_id, SUM(amount) AS total FROM ShopOrder WHERE status = 'returned' GROUP BY customer_id) r",
        "LEFT JOIN (SELECT customer_id, SUM(amount) AS total FROM ShopOrder WHERE status = 'delivered' GROUP BY customer_id) d",
        "  ON d.customer_id = r.customer_id",
      ].join("\n"),
    ],
    hints: [
      "Group by customer. Inside one group you need two different sums, each over only some of the rows.",
      "An `IF` or `CASE` inside `SUM` can add the amount for the rows you want and 0 for the rest.",
      "Whether a customer belongs in the answer depends on the whole group — that is a job for `HAVING`, not `WHERE`.",
    ],
    editorial: [
      "This is **conditional aggregation**: one `GROUP BY customer_id`, and inside each aggregate a condition that decides which rows of the group contribute.",
      "",
      "`SUM(IF(status = 'delivered', amount, 0))` adds a delivered order's amount and 0 for every other order, so it is the delivered total — and 0, not NULL, for a customer with no delivered orders. The returned total is the same expression with `'returned'`. Cancelled orders match neither condition and add nothing to either column.",
      "",
      "Which customers to keep is a property of the **group**, not of a single row, so the test belongs in `HAVING`: `HAVING SUM(status = 'returned') > 0` counts the group's returned orders (a comparison is 1 or 0). Putting `status = 'returned'` in `WHERE` instead would throw the delivered rows away before grouping and make every `delivered_amount` 0 — a common wrong answer.",
      "",
      "Two alternatives: pick the customers first with `customer_id IN (SELECT customer_id … WHERE status = 'returned')` and then aggregate with `CASE`; or compute the returned and delivered totals in two derived tables and `LEFT JOIN` the delivered one onto the returned one, with `COALESCE(…, 0)` for customers who have no deliveries. The single grouped query reads the table once; the others read it twice. All are linear plus the grouping.",
    ].join("\n"),
  },
];
