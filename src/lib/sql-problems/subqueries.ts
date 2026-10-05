import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { chance, dateBetween, maybeNull, names, pick, ri, roundTo, sample, shuffle } from "./kit.js";

/** Subqueries: scalar, IN / NOT IN, EXISTS, correlated, derived tables and CTEs. Easiest first. */

const DISHES = ["Masala Dosa", "Paneer Roll", "Veg Biryani", "Chole Bhature", "Idli Sambar", "Pav Bhaji", "Vada Pav", "Hakka Noodles", "Gulab Jamun", "Filter Coffee"] as const;
const VILLAGES = ["Kothur", "Rampur", "Wadi", "Palam", "Nandgaon", "Sirsi"] as const;

export const SUBQUERIES: SqlProblemSpec[] = [
  {
    slug: "canteen-staff-whose-supervisor-has-left",
    title: "Canteen Staff Whose Supervisor Has Left",
    difficulty: "EASY",
    topics: ["Subqueries"],
    description: [
      "The college canteen keeps one row per **current** staff member. When someone leaves, their row is deleted — but the people they supervised still carry the old `supervisor_id`. The canteen manager wants to reassign the lower-paid ones among them first.",
      "",
      "Return the `staff_id` and `full_name` of every staff member who earns **less than 25000** a month **and** whose `supervisor_id` names a person who is **no longer in the table**. Staff with no supervisor (`supervisor_id` NULL) are not in the answer, and pay of exactly 25000 is not \"less\". Order the rows by `staff_id`.",
    ].join("\n"),
    tables: [
      {
        name: "CanteenStaff",
        columns: [
          { name: "staff_id", type: "int" },
          { name: "full_name", type: "varchar" },
          { name: "monthly_pay", type: "int" },
          { name: "supervisor_id", type: "int" },
        ],
        primaryKey: ["staff_id"],
        note: "`supervisor_id` is the `staff_id` of the person's supervisor at the time they were assigned, or NULL for someone with no supervisor. It may name a person who has since left.",
      },
    ],
    examples: [
      {
        CanteenStaff: [
          [1, "Ramesh", 32000, null],
          [3, "Lakshmi", 24000, 1],
          [4, "Imran", 18000, 2],
          [6, "Geeta", 25000, 2],
          [7, "Joseph", 21000, 5],
          [8, "Kavya", 19000, null],
          [9, "Suresh", 30000, 5],
        ],
      },
    ],
    gen: (rng) => {
      // Ids are a random subset of 1..20 and supervisors point anywhere in 1..24, so roughly half of them have left.
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 14);
      const ids = shuffle(rng, Array.from({ length: 20 }, (_, i) => i + 1)).slice(0, n).sort((a, b) => a - b);
      const people = names(rng, n);
      const rows: Cell[][] = ids.map((id, i) => {
        let sup: number | null = chance(rng, 0.2) ? null : ri(rng, 1, 24);
        if (sup === id) sup = null;
        const pay = chance(rng, 0.15) ? 25000 : roundTo(rng, 12000, 34000, 1000);
        return [id, people[i]!, pay, sup];
      });
      // Usually make sure at least one person qualifies, so most answers are not empty.
      if (n > 0 && chance(rng, 0.6)) {
        const gone = [21, 22, 23, 24].filter((x) => !ids.includes(x));
        const r = pick(rng, rows);
        r[2] = roundTo(rng, 12000, 24000, 1000);
        r[3] = pick(rng, gone);
      }
      return { CanteenStaff: rows };
    },
    solution: [
      "SELECT staff_id, full_name",
      "FROM CanteenStaff",
      "WHERE monthly_pay < 25000",
      "  AND supervisor_id NOT IN (SELECT staff_id FROM CanteenStaff)",
      "ORDER BY staff_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT c.staff_id, c.full_name",
        "FROM CanteenStaff c",
        "LEFT JOIN CanteenStaff s ON s.staff_id = c.supervisor_id",
        "WHERE c.monthly_pay < 25000 AND c.supervisor_id IS NOT NULL AND s.staff_id IS NULL",
        "ORDER BY c.staff_id",
      ].join("\n"),
      [
        "SELECT c.staff_id, c.full_name",
        "FROM CanteenStaff c",
        "WHERE c.monthly_pay < 25000 AND c.supervisor_id IS NOT NULL",
        "  AND NOT EXISTS (SELECT 1 FROM CanteenStaff s WHERE s.staff_id = c.supervisor_id)",
        "ORDER BY c.staff_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Two conditions: one on the row's own pay, one about whether another row exists.",
      "The set of people still employed is just `SELECT staff_id FROM CanteenStaff` — test `supervisor_id` against it.",
      "Think about what `NULL NOT IN (…)` evaluates to, and whether that already drops the people with no supervisor.",
    ],
    editorial: [
      "The question has two parts: a plain filter on the row itself (`monthly_pay < 25000`) and a question about *other* rows — is there still someone whose `staff_id` equals my `supervisor_id`? That second part is an **anti join**, and a subquery states it most directly: `supervisor_id NOT IN (SELECT staff_id FROM CanteenStaff)`.",
      "",
      "NULLs need a moment's thought. For someone with no supervisor the test is `NULL NOT IN (…)`, which is NULL rather than true, so `WHERE` drops the row — exactly what the statement asks. The opposite trap (a NULL *inside* the list making every `NOT IN` unknown) cannot happen here, because `staff_id` is the primary key and is never NULL. Pay of exactly 25000 fails the strict `<`.",
      "",
      "Two other shapes give the same answer. A `LEFT JOIN` from each person to their supervisor's row keeps the person even when no supervisor row matches, and `s.staff_id IS NULL` then picks the unmatched ones — but here you must exclude NULL supervisors yourself. `NOT EXISTS` with a correlated subquery reads the same way and is NULL-safe in either direction. With an index on the primary key, each check is one lookup, so all three are linear in the table size.",
    ].join("\n"),
  },
  {
    slug: "second-best-innings-score",
    title: "Second-Best Innings in the College Cup",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation"],
    description: [
      "The inter-college cricket cup records one row per batting innings. The organisers give a prize for the top score and a smaller one for the **second-highest distinct score** — if two batters share the top score, the runner-up prize goes to the next lower score.",
      "",
      "Return **one row** with one column, `second_highest_runs`: the second-highest distinct value of `runs`. A NULL `runs` means the player did not bat and is not a score. If there are fewer than two distinct scores, return one row holding NULL.",
    ].join("\n"),
    tables: [
      {
        name: "BattingCard",
        columns: [
          { name: "innings_id", type: "int" },
          { name: "batter", type: "varchar" },
          { name: "runs", type: "int" },
        ],
        primaryKey: ["innings_id"],
        note: "One row per innings. `runs` is NULL when the player was listed but did not bat.",
      },
    ],
    examples: [
      {
        BattingCard: [
          [1, "Arjun", 87],
          [2, "Rohan", 64],
          [3, "Ishaan", 87],
          [4, "Karan", null],
          [5, "Dev", 12],
          [6, "Farhan", 64],
        ],
      },
      {
        BattingCard: [
          [1, "Vikram", 45],
          [2, "Harsh", 45],
          [3, "Kabir", null],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.06) ? 0 : chance(rng, 0.1) ? 1 : ri(rng, 2, 12);
      // A narrow pool of scores now and then, so the top is often shared or every score is equal.
      const pool = Array.from({ length: chance(rng, 0.3) ? ri(rng, 1, 2) : ri(rng, 3, 8) }, () => ri(rng, 0, 150));
      const people = names(rng, n);
      return { BattingCard: people.map((who, i) => [i + 1, who, maybeNull(rng, 0.15, pick(rng, pool))]) };
    },
    solution: [
      "SELECT (",
      "  SELECT DISTINCT runs",
      "  FROM BattingCard",
      "  WHERE runs IS NOT NULL",
      "  ORDER BY runs DESC",
      "  LIMIT 1 OFFSET 1",
      ") AS second_highest_runs",
    ].join("\n"),
    alternatives: [
      "SELECT MAX(runs) AS second_highest_runs FROM BattingCard WHERE runs < (SELECT MAX(runs) FROM BattingCard)",
      [
        "SELECT MAX(runs) AS second_highest_runs",
        "FROM (SELECT runs, DENSE_RANK() OVER (ORDER BY runs DESC) AS rnk FROM BattingCard WHERE runs IS NOT NULL) ranked",
        "WHERE rnk = 2",
      ].join("\n"),
      [
        "SELECT MAX(b.runs) AS second_highest_runs",
        "FROM BattingCard b",
        "WHERE (SELECT COUNT(DISTINCT c.runs) FROM BattingCard c WHERE c.runs > b.runs) = 1",
      ].join("\n"),
    ],
    hints: [
      "Duplicates of the top score must not count as \"second\" — think about `DISTINCT`.",
      "Sorting the distinct scores from high to low and skipping one gives the answer — when it exists.",
      "A query over an empty result returns no row, but a scalar subquery with no row is NULL. Wrap the lookup so the outer query always returns exactly one row.",
      "Another way: the largest score that is smaller than the largest score.",
    ],
    editorial: [
      "\"Second-highest\" means second among the **distinct** scores: if 87 appears twice, the answer is the next lower value, not 87 again. So the scores are deduplicated first, sorted high to low, and the second one is taken — `SELECT DISTINCT runs … ORDER BY runs DESC LIMIT 1 OFFSET 1`.",
      "",
      "On its own that query returns *no row* when there is no second score, while the statement wants one row holding NULL. Putting it inside a **scalar subquery** — `SELECT ( … ) AS second_highest_runs` — fixes that: a scalar subquery that finds nothing evaluates to NULL, and the outer `SELECT` without a `FROM` always yields exactly one row.",
      "",
      "The aggregate version needs no `LIMIT`: the second-highest distinct value is `MAX(runs)` over the rows whose runs are below the overall `MAX(runs)`. An aggregate without `GROUP BY` also always returns one row, NULL when nothing qualifies, so the empty case comes for free. `DENSE_RANK()` gives the same result (rank 2 is the second distinct value), and generalises to the N-th highest; a correlated count of distinct higher scores does too, at quadratic cost.",
      "",
      "NULL runs never win: `MAX` ignores them and `<` against NULL is unknown. The sort-based queries filter them out explicitly.",
    ].join("\n"),
  },
  {
    slug: "swap-neighbouring-exam-seats",
    title: "Swap Neighbouring Seats in the Exam Hall",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Conditional Logic"],
    description: [
      "To discourage copying, the invigilator swaps every pair of neighbouring candidates in the hall: the candidates in seats 1 and 2 trade places, then seats 3 and 4, and so on. When the number of seats is odd, the candidate in the **last seat stays where they are**. Seats are numbered 1, 2, 3, … with no gaps.",
      "",
      "Return every seat after the swap, with columns `seat_no` and `student_name`, **ordered by `seat_no`**.",
    ].join("\n"),
    tables: [
      {
        name: "HallSeat",
        columns: [
          { name: "seat_no", type: "int" },
          { name: "student_name", type: "varchar" },
        ],
        primaryKey: ["seat_no"],
        note: "One row per occupied seat; the seat numbers run from 1 to the number of rows without gaps. `student_name` is never NULL.",
      },
    ],
    examples: [
      {
        HallSeat: [
          [1, "Aarav"],
          [2, "Diya"],
          [3, "Kabir"],
          [4, "Meera"],
          [5, "Rohan"],
        ],
      },
      { HallSeat: [[1, "Sneha"]] },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : chance(rng, 0.1) ? 1 : ri(rng, 2, 15);
      return { HallSeat: names(rng, n).map((who, i) => [i + 1, who]) };
    },
    solution: [
      "SELECT CASE",
      "         WHEN MOD(seat_no, 2) = 0 THEN seat_no - 1",
      "         WHEN seat_no = (SELECT COUNT(*) FROM HallSeat) THEN seat_no",
      "         ELSE seat_no + 1",
      "       END AS seat_no,",
      "       student_name",
      "FROM HallSeat",
      "ORDER BY seat_no",
    ].join("\n"),
    alternatives: [
      [
        "SELECT s.seat_no, COALESCE(p.student_name, s.student_name) AS student_name",
        "FROM HallSeat s",
        "LEFT JOIN HallSeat p ON p.seat_no = IF(MOD(s.seat_no, 2) = 1, s.seat_no + 1, s.seat_no - 1)",
        "ORDER BY s.seat_no",
      ].join("\n"),
      [
        "SELECT seat_no,",
        "       CASE WHEN MOD(seat_no, 2) = 1",
        "            THEN COALESCE(LEAD(student_name) OVER (ORDER BY seat_no), student_name)",
        "            ELSE LAG(student_name) OVER (ORDER BY seat_no)",
        "       END AS student_name",
        "FROM HallSeat",
        "ORDER BY seat_no",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Instead of moving names, you can move seat numbers: decide each candidate's new seat.",
      "An even seat moves one down; an odd seat moves one up — except one particular odd seat.",
      "The seat that stays is the last one when the count is odd. A scalar subquery can tell you how many seats there are.",
    ],
    editorial: [
      "There are two ways to look at a swap: the names move between fixed seats, or each candidate gets a new seat number. The second is a single `CASE` over each row. A candidate in an **even** seat moves to `seat_no - 1`. A candidate in an **odd** seat moves to `seat_no + 1` — unless their seat is the last one, which only happens when the count is odd; then they stay. The count is a scalar subquery, `(SELECT COUNT(*) FROM HallSeat)`, evaluated once.",
      "",
      "The `CASE` branches are checked in order, so testing evenness first means the \"last seat\" branch is reached only for odd seats: an even last seat still swaps down, which is right. Ordering by the new `seat_no` (the alias, which `ORDER BY` prefers over the column) lays the hall out again.",
      "",
      "The other view keeps seat numbers and fetches the neighbour's name: a self `LEFT JOIN` to the partner seat (`seat_no + 1` for odd, `- 1` for even), falling back to the candidate's own name when there is no partner. Window functions do the same without a join — `LEAD` for odd seats, `LAG` for even ones, with `COALESCE` covering the lonely last seat. All three read the table once (plus an index lookup per row for the join).",
    ].join("\n"),
  },
  {
    slug: "student-with-the-most-study-buddies",
    title: "Student With the Most Study Buddies",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation"],
    description: [
      "The campus app lets two students link up as study buddies. Each link is stored **once**, with whichever student sent the request in `student_a` and the one who accepted in `student_b` — so a student's buddies are found on **both sides** of the table.",
      "",
      "Return the student (or students) with the most buddies, with columns `student_id` and `buddy_count`. If several students share the highest count, **return all of them**. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "BuddyPair",
        columns: [
          { name: "student_a", type: "int" },
          { name: "student_b", type: "int" },
          { name: "paired_on", type: "date" },
        ],
        primaryKey: ["student_a", "student_b"],
        note: "One row per accepted link. A pair of students appears at most once (never also reversed), and nobody is paired with themselves.",
      },
    ],
    examples: [
      {
        BuddyPair: [
          [1, 2, "2025-07-01"],
          [1, 3, "2025-07-02"],
          [2, 3, "2025-07-05"],
          [4, 2, "2025-07-09"],
          [5, 1, "2025-07-12"],
        ],
      },
    ],
    gen: (rng) => {
      const k = ri(rng, 2, 8);
      const ids = sample(rng, Array.from({ length: 30 }, (_, i) => i + 1), k);
      const pairs: [number, number][] = [];
      for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) pairs.push([ids[i]!, ids[j]!]);
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, Math.min(12, pairs.length));
      const rows = sample(rng, pairs, m).map(([a, b]) => {
        const [x, y] = chance(rng, 0.5) ? [a, b] : [b, a];
        return [x, y, dateBetween(rng, "2025-07-01", "2025-09-30")];
      });
      return { BuddyPair: rows };
    },
    solution: [
      "WITH ends AS (",
      "  SELECT student_a AS student_id FROM BuddyPair",
      "  UNION ALL",
      "  SELECT student_b FROM BuddyPair",
      "), counts AS (",
      "  SELECT student_id, COUNT(*) AS buddy_count",
      "  FROM ends",
      "  GROUP BY student_id",
      ")",
      "SELECT student_id, buddy_count",
      "FROM counts",
      "WHERE buddy_count = (SELECT MAX(buddy_count) FROM counts)",
    ].join("\n"),
    alternatives: [
      [
        "SELECT student_id, buddy_count FROM (",
        "  SELECT student_id, COUNT(*) AS buddy_count, RANK() OVER (ORDER BY COUNT(*) DESC) AS rnk",
        "  FROM (SELECT student_a AS student_id FROM BuddyPair UNION ALL SELECT student_b FROM BuddyPair) e",
        "  GROUP BY student_id",
        ") ranked",
        "WHERE rnk = 1",
      ].join("\n"),
      [
        "WITH ids AS (SELECT student_a AS student_id FROM BuddyPair UNION SELECT student_b FROM BuddyPair),",
        "c AS (",
        "  SELECT i.student_id,",
        "         (SELECT COUNT(*) FROM BuddyPair p WHERE p.student_a = i.student_id OR p.student_b = i.student_id) AS buddy_count",
        "  FROM ids i",
        ")",
        "SELECT student_id, buddy_count FROM c WHERE buddy_count = (SELECT MAX(buddy_count) FROM c)",
      ].join("\n"),
    ],
    hints: [
      "Counting only `student_a` (or only `student_b`) misses half of each student's links.",
      "Stack the two columns into one list of student ids — every appearance is one buddy.",
      "`UNION` would drop repeated ids and lose counts; you need the variant that keeps duplicates.",
      "To keep every tied student, compare each count with the maximum count instead of using `LIMIT 1`.",
    ],
    editorial: [
      "A link between two students is one row but two friendships-from-a-point-of-view: it adds a buddy to `student_a` *and* to `student_b`. So the first step turns each row into its two endpoints, by stacking the columns: `SELECT student_a … UNION ALL SELECT student_b …`. It must be `UNION ALL` — plain `UNION` removes duplicates, and a student who appears in three links must appear three times. Because the same pair is never stored twice, each appearance is a different buddy, and `COUNT(*)` grouped by student is the buddy count.",
      "",
      "The statement asks for **every** student tied at the top, so `ORDER BY … LIMIT 1` is wrong (it silently picks one). Instead, keep the counts in a CTE and filter with a scalar subquery: `buddy_count = (SELECT MAX(buddy_count) FROM counts)`. `RANK() OVER (ORDER BY COUNT(*) DESC)` and keeping rank 1 does the same in one pass, since tied counts share rank 1.",
      "",
      "A correlated alternative counts, for each distinct student, the links where they appear on either side (`student_a = id OR student_b = id`). It is easy to read but scans the table once per student; the union-and-group plan reads it twice and groups once.",
    ].join("\n"),
  },
  {
    slug: "canteen-menu-price-on-a-date",
    title: "Canteen Menu Prices on 15 March",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Dates"],
    description: [
      "Every item on the hostel canteen's menu cost **₹10** when the menu was launched. Since then, each price change has been logged with the date it took effect; a change stays in force until the item's next change.",
      "",
      "For every item that appears in the log, return its price **on 2025-03-15**, with columns `item_id` and `price`. A change that takes effect **on** 2025-03-15 already applies that day; an item whose first change is later than that still costs 10. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "MenuPriceChange",
        columns: [
          { name: "item_id", type: "int" },
          { name: "new_price", type: "int" },
          { name: "effective_on", type: "date" },
        ],
        primaryKey: ["item_id", "effective_on"],
        note: "One row per price change: from `effective_on` onwards the item costs `new_price` rupees, until its next change.",
      },
    ],
    examples: [
      {
        MenuPriceChange: [
          [1, 15, "2025-01-10"],
          [1, 18, "2025-03-15"],
          [2, 12, "2025-02-01"],
          [2, 14, "2025-03-20"],
          [3, 25, "2025-04-01"],
          [4, 20, "2025-03-01"],
          [4, 22, "2025-02-01"],
        ],
      },
    ],
    gen: (rng) => {
      if (chance(rng, 0.05)) return { MenuPriceChange: [] };
      const items = ri(rng, 1, 8);
      const rows: Cell[][] = [];
      for (let item = 1; item <= items; item++) {
        const dates = new Set<string>();
        const changes = ri(rng, 1, 4);
        // Now and then a change dated exactly on the day asked about, or the day after.
        if (chance(rng, 0.2)) dates.add("2025-03-15");
        if (chance(rng, 0.1)) dates.add("2025-03-16");
        while (dates.size < changes) dates.add(dateBetween(rng, "2025-01-01", "2025-05-31"));
        for (const d of dates) rows.push([item, roundTo(rng, 8, 60, 1), d]);
      }
      return { MenuPriceChange: shuffle(rng, rows) };
    },
    solution: [
      "SELECT i.item_id,",
      "       COALESCE((SELECT p.new_price",
      "                 FROM MenuPriceChange p",
      "                 WHERE p.item_id = i.item_id AND p.effective_on <= '2025-03-15'",
      "                 ORDER BY p.effective_on DESC",
      "                 LIMIT 1), 10) AS price",
      "FROM (SELECT DISTINCT item_id FROM MenuPriceChange) i",
    ].join("\n"),
    alternatives: [
      [
        "SELECT p.item_id, p.new_price AS price",
        "FROM MenuPriceChange p",
        "WHERE (p.item_id, p.effective_on) IN (",
        "  SELECT item_id, MAX(effective_on) FROM MenuPriceChange",
        "  WHERE effective_on <= '2025-03-15' GROUP BY item_id",
        ")",
        "UNION ALL",
        "SELECT item_id, 10 FROM MenuPriceChange GROUP BY item_id HAVING MIN(effective_on) > '2025-03-15'",
      ].join("\n"),
      [
        "SELECT i.item_id, COALESCE(r.new_price, 10) AS price",
        "FROM (SELECT DISTINCT item_id FROM MenuPriceChange) i",
        "LEFT JOIN (",
        "  SELECT item_id, new_price, ROW_NUMBER() OVER (PARTITION BY item_id ORDER BY effective_on DESC) AS rn",
        "  FROM MenuPriceChange WHERE effective_on <= '2025-03-15'",
        ") r ON r.item_id = i.item_id AND r.rn = 1",
      ].join("\n"),
    ],
    hints: [
      "The price on a date is set by the **latest** change on or before that date — not the latest change overall.",
      "Start from the list of distinct items, so items with no change yet are not lost.",
      "For one item, the right change is the first row when its changes up to 2025-03-15 are sorted newest first.",
      "When no change qualifies, the lookup is NULL — replace it with the launch price.",
    ],
    editorial: [
      "The price in force on a day is the `new_price` of the item's **most recent change on or before that day**. Changes after 2025-03-15 are irrelevant, and an item with no change by then still has the launch price of 10.",
      "",
      "A correlated scalar subquery says exactly that. Start from the distinct items (so an item whose only changes are in the future still gets a row), and for each one look up its changes with `effective_on <= '2025-03-15'`, newest first, `LIMIT 1`. If there is none, the scalar subquery is NULL and `COALESCE(…, 10)` supplies the default. The `<=` is what makes a change dated on the 15th count. Dates are compared as text, which works because they are all `YYYY-MM-DD`.",
      "",
      "Two other plans give the same answer. A set-based one finds each item's latest qualifying date with `MAX(effective_on)` grouped by item, joins back to read the price (here with a row-value `IN`), and adds the default-price items with `UNION ALL` — those are the items whose *earliest* change is after the date. A window version ranks each item's qualifying changes with `ROW_NUMBER()` newest first and `LEFT JOIN`s rank 1 onto the item list. With an index on `(item_id, effective_on)`, each lookup in the correlated version is a short index seek.",
    ].join("\n"),
  },
  {
    slug: "crop-cover-on-unique-plots",
    title: "Crop Cover for Shared Amounts on Unique Plots",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation"],
    description: [
      "A farmers' cooperative insures crops plot by plot. For a risk review it needs the 2024 cover of a particular group of policies: those whose 2023 cover amount is **shared with at least one other policy**, and whose plot is **not shared with any other policy**. A plot is identified by the pair (`village`, `plot_no`) — plot 1 in one village is a different plot from plot 1 in another.",
      "",
      "Return **one row** with one column, `total_cover_2024`: the sum of `cover_2024` over the policies meeting **both** conditions, rounded to 2 decimal places. If no policy qualifies, the row holds NULL.",
    ].join("\n"),
    tables: [
      {
        name: "CropPolicy",
        columns: [
          { name: "policy_id", type: "int" },
          { name: "cover_2023", type: "decimal" },
          { name: "cover_2024", type: "decimal" },
          { name: "village", type: "varchar" },
          { name: "plot_no", type: "int" },
        ],
        primaryKey: ["policy_id"],
        note: "One row per policy. `cover_2023` and `cover_2024` are the insured amounts in rupees for each year; no column is NULL.",
      },
    ],
    examples: [
      {
        CropPolicy: [
          [1, 20000, 25000.5, "Kothur", 1],
          [2, 15000, 18000, "Kothur", 2],
          [3, 20000, 21000.25, "Rampur", 4],
          [4, 18000, 30000, "Rampur", 4],
          [5, 18000, 12500.75, "Wadi", 3],
          [6, 20000, 40000, "Wadi", 1],
          [7, 22000, 9000, "Palam", 2],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : chance(rng, 0.05) ? 1 : ri(rng, 2, 14);
      const amounts = Array.from({ length: ri(rng, 2, 6) }, () => roundTo(rng, 10000, 30000, 500));
      const villages = sample(rng, VILLAGES, ri(rng, 1, 4));
      const plots = ri(rng, 2, 5);
      const rows: Cell[][] = [];
      for (let i = 1; i <= n; i++) {
        // Quarter-rupee amounts keep every sum exact in floating point.
        rows.push([i, pick(rng, amounts), ri(rng, 40000, 160000) / 4, pick(rng, villages), ri(rng, 1, plots)]);
      }
      return { CropPolicy: rows };
    },
    solution: [
      "SELECT ROUND(SUM(cover_2024), 2) AS total_cover_2024",
      "FROM CropPolicy",
      "WHERE cover_2023 IN (",
      "        SELECT cover_2023 FROM CropPolicy GROUP BY cover_2023 HAVING COUNT(*) > 1",
      "      )",
      "  AND (village, plot_no) IN (",
      "        SELECT village, plot_no FROM CropPolicy GROUP BY village, plot_no HAVING COUNT(*) = 1",
      "      )",
    ].join("\n"),
    alternatives: [
      [
        "SELECT ROUND(SUM(cover_2024), 2) AS total_cover_2024",
        "FROM (",
        "  SELECT cover_2024,",
        "         COUNT(*) OVER (PARTITION BY cover_2023) AS same_amount,",
        "         COUNT(*) OVER (PARTITION BY village, plot_no) AS same_plot",
        "  FROM CropPolicy",
        ") t",
        "WHERE same_amount > 1 AND same_plot = 1",
      ].join("\n"),
      [
        "SELECT ROUND(SUM(p.cover_2024), 2) AS total_cover_2024",
        "FROM CropPolicy p",
        "WHERE EXISTS (SELECT 1 FROM CropPolicy q WHERE q.cover_2023 = p.cover_2023 AND q.policy_id <> p.policy_id)",
        "  AND NOT EXISTS (SELECT 1 FROM CropPolicy q",
        "                  WHERE q.village = p.village AND q.plot_no = p.plot_no AND q.policy_id <> p.policy_id)",
      ].join("\n"),
    ],
    hints: [
      "Each condition is about how many policies share something with this one: a 2023 amount, or a plot.",
      "`GROUP BY cover_2023 HAVING COUNT(*) > 1` lists the shared amounts; a similar query lists the plots that occur exactly once.",
      "A plot is two columns. Group by both, and test both at once (a row-value `IN`, or `EXISTS` with two equalities).",
      "`SUM` over no rows is NULL, which is what the statement asks for when nothing qualifies.",
    ],
    editorial: [
      "Both conditions compare a policy with the rest of the table, and both can be phrased as membership in a list built by `GROUP BY … HAVING`:",
      "",
      "- the amounts held by more than one policy: `SELECT cover_2023 … GROUP BY cover_2023 HAVING COUNT(*) > 1`;",
      "- the plots held by exactly one policy: `SELECT village, plot_no … GROUP BY village, plot_no HAVING COUNT(*) = 1`.",
      "",
      "A policy qualifies when its amount is `IN` the first list and its `(village, plot_no)` pair is `IN` the second. Grouping the plot by **both** columns matters: grouping by `plot_no` alone would treat plot 1 in Kothur and plot 1 in Wadi as one plot. The policy itself is counted in each group, which is why \"shared with another\" is `> 1` and \"not shared\" is `= 1`. Then `ROUND(SUM(cover_2024), 2)` totals the survivors; with no survivors, `SUM` yields NULL, as required.",
      "",
      "Window counts do the same in a single scan: `COUNT(*) OVER (PARTITION BY cover_2023)` and `COUNT(*) OVER (PARTITION BY village, plot_no)` attach both group sizes to every row, and the outer query filters on them. A correlated version asks directly whether *another* policy (`q.policy_id <> p.policy_id`) has the same amount (`EXISTS`) or the same plot (`NOT EXISTS`); it is the most literal reading but costs a lookup per row for each condition.",
    ].join("\n"),
  },
  {
    slug: "top-reviewer-and-best-rated-dish",
    title: "Top Reviewer and Best-Rated Dish of February",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation", "Joins"],
    description: [
      "A food-delivery app shows two names on its monthly highlights card: the **diner who has written the most reviews** (counting every review ever written), and the **dish with the highest average stars among reviews written in February 2025** (from 2025-02-01 to 2025-02-28).",
      "",
      "Return both names in a single column named `result`. Break a tie for most reviews by taking the diner name that comes **first alphabetically**, and a tie for best average the same way, by dish name. A diner with no reviews never counts; if there are no reviews at all, the diner row is missing, and if no review falls in February 2025, the dish row is missing. The rows may come in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Diner",
        columns: [
          { name: "diner_id", type: "int" },
          { name: "diner_name", type: "varchar" },
        ],
        primaryKey: ["diner_id"],
        note: "One row per diner; names are unique.",
      },
      {
        name: "Dish",
        columns: [
          { name: "dish_id", type: "int" },
          { name: "dish_name", type: "varchar" },
        ],
        primaryKey: ["dish_id"],
        note: "One row per dish; names are unique.",
      },
      {
        name: "DishReview",
        columns: [
          { name: "dish_id", type: "int" },
          { name: "diner_id", type: "int" },
          { name: "stars", type: "int" },
          { name: "reviewed_on", type: "date" },
        ],
        primaryKey: ["dish_id", "diner_id"],
        note: "One row per review: a diner reviews a dish at most once, giving 1 to 5 `stars`.",
      },
    ],
    examples: [
      {
        Diner: [
          [1, "Aarav"],
          [2, "Diya"],
          [3, "Kabir"],
          [4, "Meera"],
        ],
        Dish: [
          [1, "Masala Dosa"],
          [2, "Pav Bhaji"],
          [3, "Veg Biryani"],
        ],
        DishReview: [
          [3, 1, 5, "2025-01-20"],
          [1, 1, 4, "2025-02-03"],
          [2, 1, 5, "2025-02-10"],
          [1, 2, 5, "2025-02-14"],
          [2, 2, 4, "2025-02-28"],
          [3, 2, 5, "2025-03-01"],
          [2, 3, 1, "2025-03-02"],
        ],
      },
    ],
    gen: (rng) => {
      const k = ri(rng, 1, 6);
      const diners = names(rng, k).map((name, i) => [i + 1, name]);
      const m = ri(rng, 1, 6);
      const dishes = sample(rng, DISHES, m).map((name, i) => [i + 1, name]);
      const p = chance(rng, 0.1) ? 0.15 : 0.5;
      const reviews: Cell[][] = [];
      for (let dish = 1; dish <= m; dish++) {
        for (let diner = 1; diner <= k; diner++) {
          if (!chance(rng, p)) continue;
          // Dates around February, with its first and last day as likely as any.
          const on = chance(rng, 0.1) ? pick(rng, ["2025-01-31", "2025-02-01", "2025-02-28", "2025-03-01"]) : dateBetween(rng, "2025-01-15", "2025-03-15");
          reviews.push([dish, diner, ri(rng, 1, 5), on]);
        }
      }
      return { Diner: diners, Dish: dishes, DishReview: reviews };
    },
    solution: [
      "SELECT result FROM (",
      "  SELECT d.diner_name AS result",
      "  FROM DishReview r",
      "  JOIN Diner d ON d.diner_id = r.diner_id",
      "  GROUP BY d.diner_id, d.diner_name",
      "  ORDER BY COUNT(*) DESC, d.diner_name",
      "  LIMIT 1",
      ") AS top_diner",
      "UNION ALL",
      "SELECT result FROM (",
      "  SELECT m.dish_name AS result",
      "  FROM DishReview r",
      "  JOIN Dish m ON m.dish_id = r.dish_id",
      "  WHERE r.reviewed_on BETWEEN '2025-02-01' AND '2025-02-28'",
      "  GROUP BY m.dish_id, m.dish_name",
      "  ORDER BY AVG(r.stars) DESC, m.dish_name",
      "  LIMIT 1",
      ") AS top_dish",
    ].join("\n"),
    alternatives: [
      [
        "WITH per_diner AS (SELECT diner_id, COUNT(*) AS n FROM DishReview GROUP BY diner_id),",
        "feb AS (SELECT dish_id, AVG(stars) AS avg_stars FROM DishReview WHERE reviewed_on LIKE '2025-02-%' GROUP BY dish_id)",
        "SELECT MIN(d.diner_name) AS result",
        "FROM per_diner p JOIN Diner d ON d.diner_id = p.diner_id",
        "WHERE p.n = (SELECT MAX(n) FROM per_diner)",
        "HAVING COUNT(*) > 0",
        "UNION ALL",
        "SELECT MIN(m.dish_name)",
        "FROM feb f JOIN Dish m ON m.dish_id = f.dish_id",
        "WHERE f.avg_stars = (SELECT MAX(avg_stars) FROM feb)",
        "HAVING COUNT(*) > 0",
      ].join("\n"),
      [
        "SELECT result FROM (",
        "  SELECT d.diner_name AS result, ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC, d.diner_name) AS rn",
        "  FROM DishReview r JOIN Diner d ON d.diner_id = r.diner_id",
        "  GROUP BY d.diner_id, d.diner_name",
        ") a WHERE rn = 1",
        "UNION ALL",
        "SELECT result FROM (",
        "  SELECT m.dish_name AS result, ROW_NUMBER() OVER (ORDER BY AVG(r.stars) DESC, m.dish_name) AS rn",
        "  FROM DishReview r JOIN Dish m ON m.dish_id = r.dish_id",
        "  WHERE YEAR(r.reviewed_on) = 2025 AND MONTH(r.reviewed_on) = 2",
        "  GROUP BY m.dish_id, m.dish_name",
        ") b WHERE rn = 1",
      ].join("\n"),
    ],
    hints: [
      "These are two independent questions; answer each with its own query and stack the results.",
      "Each half is \"group, sort by the measure and then by name, keep the first row\".",
      "An `ORDER BY … LIMIT 1` cannot sit directly on one side of a `UNION`; wrap each half in a derived table.",
      "Use `UNION ALL`, not `UNION`: two equal names must still give two rows.",
    ],
    editorial: [
      "The card asks two unrelated questions, so the query is two small queries glued together with `UNION ALL` — both return one text column, which the outer result names `result`.",
      "",
      "**Top reviewer.** Join reviews to diners, group by diner, and sort by `COUNT(*)` descending and then by name; the first row is the answer. Joining from `DishReview` means diners with no reviews never appear, and an empty review table gives no row at all.",
      "",
      "**Best dish of February.** Filter the reviews to `2025-02-01 … 2025-02-28` *before* grouping, then sort the dishes by `AVG(stars)` descending and by name. The filter matters: a dish rated highly only in January or March must not win.",
      "",
      "Each half needs `ORDER BY … LIMIT 1`, and in standard SQL that clause applies to the whole compound query, so each half goes inside a derived table. `UNION ALL` keeps both rows even if the two names were equal; `UNION` would merge them.",
      "",
      "Without `LIMIT`, compute the counts and February averages in CTEs, keep the rows equal to the maximum, and take `MIN(name)` — the alphabetical tie-break. `HAVING COUNT(*) > 0` stops an empty half from returning a NULL row. `ROW_NUMBER()` with the same two-key order is a third way. Each version groups the review table twice.",
    ].join("\n"),
  },
];
