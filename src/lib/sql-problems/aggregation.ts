import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, atTime, chance, dateBetween, names, pick, ri, roundTo, sample } from "./kit.js";

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);

const CLUBS = ["Robotics", "Dramatics", "Photography", "Coding", "Music", "Quizzing", "Literary"] as const;
const COUNTERS = ["South Indian", "North Indian", "Chinese", "Juice Bar", "Chaat", "Bakery"] as const;
const WORKSHOPS = ["Git basics", "Intro to Docker", "Figma for devs", "Web security", "Arduino", "Linux shell"] as const;
const RAIL_ZONES = ["Central", "Western", "Southern", "Eastern", "Northern"] as const;
const REFUND_STATUS = ["refunded", "refunded", "rejected", "pending"] as const;
const RESTAURANTS = ["Dosa Corner", "Biryani House", "Chai Point", "Momo Hub", "Pizza Planet", "Thali Express"] as const;

/** Aggregation: GROUP BY, HAVING, conditional counts and ratios. Easiest first. */
export const AGGREGATION: SqlProblemSpec[] = [
  {
    slug: "mobile-numbers-shared-by-wallet-accounts",
    title: "Mobile Numbers Shared by Wallet Accounts",
    difficulty: "EASY",
    topics: ["Aggregation"],
    description: [
      "The campus canteen's prepaid wallet asks for a mobile number at sign-up. The number is optional, and nothing stops two accounts from giving the same one.",
      "",
      "Return every mobile number used by **more than one** account, in a column named `mobile`, listing each such number once. Accounts without a mobile number (NULL) never count — a missing number is not a shared number. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "WalletAccount",
        columns: [
          { name: "account_id", type: "int" },
          { name: "holder", type: "varchar" },
          { name: "mobile", type: "varchar" },
          { name: "balance", type: "int" },
        ],
        primaryKey: ["account_id"],
        note: "One row per wallet. `mobile` is a 10-digit number stored as text, or NULL if none was given.",
      },
    ],
    examples: [
      {
        WalletAccount: [
          [1, "Neha", "9845012345", 250],
          [2, "Rohan", "9900011122", 80],
          [3, "Priya", "9845012345", 0],
          [4, "Arjun", null, 120],
          [5, "Zara", "9123456780", 40],
          [6, "Dev", null, 300],
          [7, "Ira", "9845012345", 15],
          [8, "Kabir", "9900011122", 60],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 15);
      const pool = Array.from({ length: ri(rng, 1, 9) }, () => `9${ri(rng, 100000000, 999999999)}`);
      const nullRate = pick(rng, [0, 0.15, 0.3]);
      const rows = names(rng, n).map((holder, i) => [i + 1, holder, chance(rng, nullRate) ? null : pick(rng, pool), roundTo(rng, 0, 500, 5)]);
      return { WalletAccount: rows };
    },
    solution: [
      "SELECT mobile",
      "FROM WalletAccount",
      "WHERE mobile IS NOT NULL",
      "GROUP BY mobile",
      "HAVING COUNT(*) > 1",
    ].join("\n"),
    alternatives: [
      "SELECT mobile FROM WalletAccount GROUP BY mobile HAVING COUNT(mobile) > 1",
      "SELECT DISTINCT a.mobile FROM WalletAccount a JOIN WalletAccount b ON a.mobile = b.mobile AND a.account_id <> b.account_id",
    ],
    hints: [
      "Put the accounts with the same number into one group.",
      "A condition on the size of a group goes in HAVING, not WHERE.",
      "GROUP BY puts all the NULLs into one group of their own. Make sure that group can never reach the answer.",
    ],
    editorial: [
      "Finding values that repeat is the classic use of `GROUP BY … HAVING`. Grouping by `mobile` puts all the accounts that share a number into one group; `COUNT(*)` is the group's size, and `HAVING COUNT(*) > 1` keeps the numbers used more than once. Each group yields one row, so every shared number is listed once however many accounts use it.",
      "",
      "The NULLs need a decision. `GROUP BY` treats all NULLs as one group, so two accounts without a number would form a group of size 2 and print a NULL row — but a missing number is not a shared number. Filtering them out first with `WHERE mobile IS NOT NULL` removes them before grouping. Counting the column instead of the rows does the same job: `COUNT(mobile)` skips NULLs, so the NULL group always counts 0.",
      "",
      "A self join finds the duplicates another way — pair each account with a *different* account holding the same number, then `DISTINCT` the numbers — and NULLs drop out because `NULL = NULL` is not true. It compares pairs, so it is quadratic in the size of a group, while grouping is one pass (or a sort) over the table.",
    ].join("\n"),
  },

  {
    slug: "clubs-with-enough-members-to-register",
    title: "Clubs With Enough Members to Register",
    difficulty: "EASY",
    topics: ["Aggregation"],
    description: [
      "A college recognises a student club only when **at least five different students** belong to it. The membership log gets a row every time a student joins a club, so a student who left a club and rejoined appears twice for it.",
      "",
      "Return the name of every club with at least five distinct students, in a column named `club`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "ClubJoin",
        columns: [
          { name: "join_id", type: "int" },
          { name: "roll_no", type: "int" },
          { name: "club", type: "varchar" },
          { name: "joined_on", type: "date" },
        ],
        primaryKey: ["join_id"],
        note: "One row per time a student joined a club; the same student and club can appear more than once.",
      },
    ],
    examples: [
      {
        ClubJoin: [
          [1, 21, "Robotics", "2025-07-01"],
          [2, 22, "Robotics", "2025-07-01"],
          [3, 23, "Dramatics", "2025-07-02"],
          [4, 24, "Robotics", "2025-07-03"],
          [5, 23, "Dramatics", "2025-08-10"],
          [6, 25, "Dramatics", "2025-07-04"],
          [7, 26, "Robotics", "2025-07-05"],
          [8, 27, "Dramatics", "2025-07-05"],
          [9, 28, "Robotics", "2025-07-06"],
          [10, 21, "Dramatics", "2025-07-07"],
        ],
      },
    ],
    gen: (rng) => {
      const joins: Cell[][] = [];
      if (!chance(rng, 0.05)) {
        for (const club of sample(rng, CLUBS, chance(rng, 0.15) ? 1 : ri(rng, 2, 3))) {
          // Club sizes around the boundary: four is one short, five is enough.
          const members = sample(rng, seq(1, 40), pick(rng, [2, 4, 4, 5, 5, 6, 7]));
          for (const roll of members) {
            // A rejoin adds a row but not a member.
            for (let k = chance(rng, 0.3) ? 2 : 1; k > 0; k--) joins.push([roll, club, dateBetween(rng, "2025-07-01", "2025-09-30")]);
          }
        }
      }
      const rows = sample(rng, joins, 30).map((r, i) => [i + 1, ...r]);
      return { ClubJoin: rows };
    },
    solution: [
      "SELECT club",
      "FROM ClubJoin",
      "GROUP BY club",
      "HAVING COUNT(DISTINCT roll_no) >= 5",
    ].join("\n"),
    alternatives: [
      "SELECT club FROM (SELECT DISTINCT club, roll_no FROM ClubJoin) m GROUP BY club HAVING COUNT(*) >= 5",
      "SELECT DISTINCT club FROM ClubJoin c WHERE (SELECT COUNT(DISTINCT roll_no) FROM ClubJoin x WHERE x.club = c.club) >= 5",
    ],
    hints: [
      "One row per club in the answer: group by the club.",
      "Count students, not rows — a rejoin is a second row for the same student.",
      "\"At least five\" includes five.",
    ],
    editorial: [
      "Grouping the log by `club` gives one group per club, and the question is a condition on each group, so it belongs in `HAVING`.",
      "",
      "What to count is the point of the problem. `COUNT(*)` counts rows, and a student who left and rejoined has two rows — Dramatics in the example has five rows but only four different students, so it must not qualify. `COUNT(DISTINCT roll_no)` counts each student once per club, which is the club's real size. The comparison is `>= 5` because five members is enough.",
      "",
      "The same answer can be reached by removing the duplicates first: `SELECT DISTINCT club, roll_no` leaves one row per membership, after which a plain `COUNT(*)` per club is the number of distinct students. A correlated subquery that counts each club's distinct students works too, but runs once per row of the log and needs a `DISTINCT` on the outside. The grouped query reads the table once; `COUNT(DISTINCT …)` sorts or hashes the pairs within each group.",
    ].join("\n"),
  },

  {
    slug: "rating-report-for-each-canteen-counter",
    title: "Rating Report for Each Canteen Counter",
    difficulty: "EASY",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "Students rate their meal from 1 to 5 stars on a tablet at the canteen's exit, choosing the counter that served them.",
      "",
      "For every counter with at least one rating, return the columns `counter`, `avg_stars` (the average of its stars) and `poor_pct` (the percentage of its ratings that are **2 stars or fewer**, as a number from 0 to 100). Round both to 2 decimal places. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "MealRating",
        columns: [
          { name: "rating_id", type: "int" },
          { name: "counter", type: "varchar" },
          { name: "stars", type: "int" },
          { name: "rated_on", type: "date" },
        ],
        primaryKey: ["rating_id"],
        note: "One row per rating; `stars` is from 1 to 5.",
      },
    ],
    examples: [
      {
        MealRating: [
          [1, "South Indian", 5, "2025-08-04"],
          [2, "South Indian", 2, "2025-08-04"],
          [3, "South Indian", 4, "2025-08-05"],
          [4, "Chinese", 1, "2025-08-05"],
          [5, "Chinese", 3, "2025-08-05"],
          [6, "Chinese", 2, "2025-08-06"],
          [7, "Juice Bar", 5, "2025-08-06"],
          [8, "South Indian", 3, "2025-08-07"],
        ],
      },
    ],
    gen: (rng) => {
      const counters = sample(rng, COUNTERS, ri(rng, 1, 5));
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 28);
      const rows = seq(1, m).map((id) => {
        const counter = pick(rng, counters);
        // Each counter leans good or bad, so percentages spread out.
        const lean = COUNTERS.indexOf(counter) % 2 === 0 ? [1, 2, 2, 3, 4, 5] : [2, 3, 4, 4, 5, 5];
        return [id, counter, pick(rng, lean), dateBetween(rng, "2025-08-01", "2025-08-31")];
      });
      return { MealRating: rows };
    },
    solution: [
      "SELECT counter,",
      "       ROUND(AVG(stars), 2) AS avg_stars,",
      "       ROUND(100 * SUM(CASE WHEN stars <= 2 THEN 1 ELSE 0 END) / COUNT(*), 2) AS poor_pct",
      "FROM MealRating",
      "GROUP BY counter",
    ].join("\n"),
    alternatives: [
      "SELECT counter, ROUND(SUM(stars) / COUNT(*), 2) AS avg_stars, ROUND(AVG(IF(stars <= 2, 100, 0)), 2) AS poor_pct FROM MealRating GROUP BY counter",
      "SELECT counter, ROUND(AVG(stars), 2) AS avg_stars, ROUND(AVG(stars <= 2) * 100, 2) AS poor_pct FROM MealRating GROUP BY counter",
    ],
    hints: [
      "Group by the counter; the average is a plain aggregate.",
      "Count the poor ratings with a conditional: a CASE or IF that gives 1 for two stars or fewer and 0 otherwise.",
      "A percentage is that count divided by all ratings of the counter, times 100. Round at the very end.",
    ],
    editorial: [
      "One row per counter means `GROUP BY counter`, and both figures are aggregates over the group.",
      "",
      "The average is `AVG(stars)`. The percentage needs a count of only some rows of the group, which is what **conditional aggregation** gives: `SUM(CASE WHEN stars <= 2 THEN 1 ELSE 0 END)` adds 1 for each poor rating and 0 for the rest. Dividing by `COUNT(*)`, the number of ratings, and multiplying by 100 turns it into a percentage. The boundary is inclusive — a 2-star rating is poor, a 3-star one is not.",
      "",
      "Two shortcuts give the same numbers. The average of a flag *is* a ratio, so `AVG(IF(stars <= 2, 100, 0))` is the percentage directly; and in MySQL a comparison is itself 1 or 0, so `AVG(stars <= 2) * 100` works as well. MySQL's `/` always divides as a decimal (`1 / 3` is 0.3333), so the order of the factors does not matter here; in databases that divide integers as integers, multiplying by 100 before dividing is what keeps a percentage from collapsing to 0.",
      "",
      "Round once, at the end — rounding the average or the ratio before multiplying would lose precision. A counter with no ratings has no rows, so it never appears, as the statement says. The query is a single pass over the table.",
    ].join("\n"),
  },

  {
    slug: "average-selling-price-of-each-canteen-item",
    title: "Average Selling Price of Each Canteen Item",
    difficulty: "EASY",
    topics: ["Aggregation", "Joins", "Dates"],
    description: [
      "The canteen changes its prices from time to time. `PriceList` holds every price an item has had, each valid for a period of days, and `Sale` records how many plates of an item were sold on a day.",
      "",
      "For every item in `PriceList`, return `item_id` and `average_price`: the total money taken for the item — each sale's quantity times the price that was valid **on the sale's date** — divided by the total quantity sold, rounded to 2 decimal places. An item that has never been sold has an `average_price` of **0**. Return one row per item, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "PriceList",
        columns: [
          { name: "item_id", type: "int" },
          { name: "valid_from", type: "date" },
          { name: "valid_to", type: "date" },
          { name: "price", type: "int" },
        ],
        primaryKey: ["item_id", "valid_from"],
        note: "A period includes both of its end dates. An item's periods never overlap, and every sale of the item falls inside exactly one of them.",
      },
      {
        name: "Sale",
        columns: [
          { name: "sale_id", type: "int" },
          { name: "item_id", type: "int" },
          { name: "sold_on", type: "date" },
          { name: "quantity", type: "int" },
        ],
        primaryKey: ["sale_id"],
        note: "One row per sale: `quantity` plates of an item on `sold_on`.",
      },
    ],
    examples: [
      {
        PriceList: [
          [1, "2025-01-01", "2025-01-15", 40],
          [1, "2025-01-16", "2025-01-31", 45],
          [2, "2025-01-01", "2025-01-31", 60],
          [3, "2025-01-10", "2025-01-31", 25],
        ],
        Sale: [
          [1, 1, "2025-01-15", 10],
          [2, 1, "2025-01-16", 20],
          [3, 2, "2025-01-05", 3],
          [4, 2, "2025-01-20", 7],
          [5, 1, "2025-01-03", 5],
        ],
      },
    ],
    gen: (rng) => {
      const prices: Cell[][] = [];
      const sales: Cell[][] = [];
      let saleId = 0;
      for (const item of sample(rng, seq(1, 12), ri(rng, 1, 5))) {
        let start = dateBetween(rng, "2025-01-01", "2025-01-10");
        const periods: [string, string][] = [];
        for (let k = ri(rng, 1, 3); k > 0; k--) {
          const end = addDays(start, ri(rng, 0, 20));
          periods.push([start, end]);
          prices.push([item, start, end, roundTo(rng, 10, 120, 5)]);
          // Usually the next price starts the next day; sometimes the item is off the menu for a while.
          start = addDays(end, chance(rng, 0.7) ? 1 : ri(rng, 2, 5));
        }
        if (chance(rng, 0.25)) continue; // never sold
        for (let s = ri(rng, 1, 5); s > 0; s--) {
          const [from, to] = pick(rng, periods);
          // The first and last day of a period are where a strict comparison goes wrong.
          const day = chance(rng, 0.4) ? pick(rng, [from, to]) : dateBetween(rng, from, to);
          sales.push([++saleId, item, day, ri(rng, 1, 20)]);
        }
      }
      return { PriceList: prices, Sale: sales };
    },
    solution: [
      "SELECT p.item_id,",
      "       IFNULL(ROUND(SUM(s.quantity * p.price) / SUM(s.quantity), 2), 0) AS average_price",
      "FROM PriceList p",
      "LEFT JOIN Sale s",
      "  ON s.item_id = p.item_id",
      " AND s.sold_on BETWEEN p.valid_from AND p.valid_to",
      "GROUP BY p.item_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH takings AS (",
        "  SELECT s.item_id, SUM(s.quantity * p.price) AS money, SUM(s.quantity) AS plates",
        "  FROM Sale s JOIN PriceList p ON p.item_id = s.item_id AND s.sold_on BETWEEN p.valid_from AND p.valid_to",
        "  GROUP BY s.item_id",
        ")",
        "SELECT i.item_id, IFNULL(ROUND(t.money / t.plates, 2), 0) AS average_price",
        "FROM (SELECT DISTINCT item_id FROM PriceList) i",
        "LEFT JOIN takings t ON t.item_id = i.item_id",
      ].join("\n"),
      [
        "SELECT i.item_id, IFNULL(ROUND(",
        "  (SELECT SUM(s.quantity * p.price) FROM Sale s JOIN PriceList p ON p.item_id = s.item_id AND s.sold_on >= p.valid_from AND s.sold_on <= p.valid_to WHERE s.item_id = i.item_id)",
        "  / (SELECT SUM(s.quantity) FROM Sale s WHERE s.item_id = i.item_id), 2), 0) AS average_price",
        "FROM (SELECT DISTINCT item_id FROM PriceList) i",
      ].join("\n"),
    ],
    hints: [
      "Each sale needs the one price row whose period contains its date — join on the item **and** on the date lying inside the period.",
      "The average must weigh each price by the plates sold at it: total money ÷ total plates, not the average of the prices.",
      "Items with no sales must still appear with 0. Which join keeps them, and what does the division give for them?",
    ],
    editorial: [
      "Each sale has to be priced at the rate that applied on its date. The join condition therefore has two parts: the same `item_id`, and `sold_on BETWEEN valid_from AND valid_to`. `BETWEEN` includes both ends, which matters here — a sale on the last day of one period or the first day of the next must find its price, and a strict `<` / `>` would lose it. Because an item's periods never overlap, every sale matches exactly one price row.",
      "",
      "The average is **weighted**: 10 plates at ₹40 and 20 at ₹45 average ₹43.33, not ₹42.50, so it is `SUM(quantity * price) / SUM(quantity)`, not `AVG(price)`.",
      "",
      "Every item must appear, so the join is a LEFT JOIN from `PriceList`. An unsold item keeps its price rows with NULL sales; both sums are NULL, the division is NULL, and `IFNULL(…, 0)` gives the 0 the statement asks for. Grouping by `p.item_id` folds an item's several price rows into one output row — the unmatched periods of a sold item contribute only NULLs, which `SUM` ignores.",
      "",
      "The alternatives compute the takings of sold items first and attach them to the list of items, or use correlated sums per item. All of them read each sale once against its item's few price rows.",
    ].join("\n"),
  },

  {
    slug: "share-of-quiz-players-who-returned-next-day",
    title: "Share of Quiz Players Who Returned the Next Day",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Dates", "Subqueries"],
    description: [
      "A daily-quiz app logs one row for each day a player plays. A player's **first day** is the earliest `played_on` date they have.",
      "",
      "Return a single row with one column, `next_day_rate`: the number of players who also played on the **day right after their first day**, divided by the number of all players, rounded to 2 decimal places. Only that one day matters — a player who next appears two days later, or who plays two days in a row only later on, does not count.",
    ].join("\n"),
    tables: [
      {
        name: "QuizPlay",
        columns: [
          { name: "player_id", type: "int" },
          { name: "played_on", type: "date" },
          { name: "score", type: "int" },
        ],
        primaryKey: ["player_id", "played_on"],
        note: "One row per player per day played. The table is never empty.",
      },
    ],
    examples: [
      {
        QuizPlay: [
          [1, "2025-04-29", 70],
          [1, "2025-04-30", 55],
          [2, "2025-04-30", 80],
          [2, "2025-05-02", 90],
          [2, "2025-05-03", 60],
          [3, "2025-04-30", 40],
          [3, "2025-05-01", 85],
          [4, "2025-05-05", 30],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      // A window around the end of February in a leap year, so "the next day" crosses month ends and 29 Feb.
      for (const player of sample(rng, seq(1, 30), ri(rng, 1, 10))) {
        const first = dateBetween(rng, "2024-02-24", "2024-03-03");
        const days = new Set<string>([first]);
        if (chance(rng, 0.45)) days.add(addDays(first, 1));
        for (let k = ri(rng, 0, 3); k > 0; k--) days.add(addDays(first, ri(rng, 2, 8)));
        for (const day of days) rows.push([player, day, ri(rng, 0, 100)]);
      }
      return { QuizPlay: rows };
    },
    solution: [
      "SELECT ROUND(COUNT(q.player_id) / COUNT(*), 2) AS next_day_rate",
      "FROM (SELECT player_id, MIN(played_on) AS first_day FROM QuizPlay GROUP BY player_id) f",
      "LEFT JOIN QuizPlay q",
      "  ON q.player_id = f.player_id",
      " AND q.played_on = DATE_ADD(f.first_day, INTERVAL 1 DAY)",
    ].join("\n"),
    alternatives: [
      [
        "SELECT ROUND(",
        "  (SELECT COUNT(*) FROM QuizPlay",
        "   WHERE (player_id, DATE_SUB(played_on, INTERVAL 1 DAY)) IN (SELECT player_id, MIN(played_on) FROM QuizPlay GROUP BY player_id))",
        "  / (SELECT COUNT(DISTINCT player_id) FROM QuizPlay), 2) AS next_day_rate",
      ].join("\n"),
      [
        "WITH firsts AS (SELECT player_id, played_on, MIN(played_on) OVER (PARTITION BY player_id) AS first_day FROM QuizPlay)",
        "SELECT ROUND(SUM(DATEDIFF(played_on, first_day) = 1) / COUNT(DISTINCT player_id), 2) AS next_day_rate",
        "FROM firsts",
      ].join("\n"),
    ],
    hints: [
      "First find each player's first day: one row per player with `MIN(played_on)`.",
      "Then ask, per player, whether a row exists exactly one day after it. Use date arithmetic — `DATE_ADD(d, INTERVAL 1 DAY)` or `DATEDIFF` — never `+ 1` on a date.",
      "The denominator is the number of players, not the number of rows.",
      "A ratio of counts divided in MySQL is already a decimal; round only the final value.",
    ],
    editorial: [
      "The question has a fixed reference point per player — their first day — so the first step is to compute it: `GROUP BY player_id` with `MIN(played_on)` gives one row per player.",
      "",
      "Next, for each of those rows, check whether the same player has a row dated one day later. A LEFT JOIN back to `QuizPlay` on the player and on `played_on = DATE_ADD(first_day, INTERVAL 1 DAY)` finds that row when it exists and leaves NULLs when it does not. Because a player has at most one row per day, each player still produces exactly one row, so `COUNT(*)` is the number of players and `COUNT(q.player_id)` — which skips the NULLs — is the number who returned. Their quotient, rounded, is the answer.",
      "",
      "Use real date arithmetic. `'2024-02-28' + 1` is not a date, and day 29 → day 30 does not exist in February; `DATE_ADD` and `DATEDIFF` get month ends and 29 February right. Also check the precise condition: playing on two consecutive days *somewhere* is a different, larger number.",
      "",
      "The alternatives turn the check around — keep rows whose previous day is the player's first day, using a row-value `IN` — or compute the first day with a window `MIN(…) OVER (PARTITION BY player_id)` and count rows exactly one day after it. Each reads the table two or three times.",
    ].join("\n"),
  },

  {
    slug: "students-who-attended-every-fest-workshop",
    title: "Students Who Attended Every Fest Workshop",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Subqueries"],
    description: [
      "At the college tech fest, students check in to workshops by scanning a QR code at the door. A student who steps out and comes back scans again, so the same student and workshop can appear more than once.",
      "",
      "Return the `roll_no` of every student who checked in to **every** workshop listed in `Workshop`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Workshop",
        columns: [
          { name: "workshop_id", type: "int" },
          { name: "topic", type: "varchar" },
        ],
        primaryKey: ["workshop_id"],
        note: "One row per workshop at the fest.",
      },
      {
        name: "CheckIn",
        columns: [
          { name: "scan_id", type: "int" },
          { name: "roll_no", type: "int" },
          { name: "workshop_id", type: "int" },
          { name: "scanned_at", type: "datetime" },
        ],
        primaryKey: ["scan_id"],
        note: "One row per QR scan. Every `workshop_id` here is in `Workshop`.",
      },
    ],
    examples: [
      {
        Workshop: [
          [1, "Git basics"],
          [2, "Intro to Docker"],
          [3, "Figma for devs"],
        ],
        CheckIn: [
          [1, 501, 1, "2025-02-14 10:02:11"],
          [2, 501, 2, "2025-02-14 12:00:40"],
          [3, 502, 1, "2025-02-14 10:05:03"],
          [4, 502, 1, "2025-02-14 11:15:47"],
          [5, 502, 2, "2025-02-14 12:01:30"],
          [6, 501, 3, "2025-02-15 09:58:00"],
          [7, 503, 1, "2025-02-14 10:10:10"],
          [8, 503, 2, "2025-02-14 12:04:22"],
          [9, 503, 3, "2025-02-15 10:01:05"],
        ],
      },
    ],
    gen: (rng) => {
      const w = ri(rng, 1, 4);
      const workshops = sample(rng, WORKSHOPS, w).map((topic, i) => [i + 1, topic]);
      const scans: Cell[][] = [];
      let id = 0;
      for (const roll of sample(rng, seq(501, 30), ri(rng, 1, 8))) {
        const attended = chance(rng, 0.4) ? seq(1, w) : sample(rng, seq(1, w), ri(rng, 1, w));
        for (const ws of attended) {
          for (let k = chance(rng, 0.3) ? 2 : 1; k > 0; k--) scans.push([++id, roll, ws, atTime(rng, dateBetween(rng, "2025-02-14", "2025-02-15"))]);
        }
      }
      return { Workshop: workshops, CheckIn: scans };
    },
    solution: [
      "SELECT roll_no",
      "FROM CheckIn",
      "GROUP BY roll_no",
      "HAVING COUNT(DISTINCT workshop_id) = (SELECT COUNT(*) FROM Workshop)",
    ].join("\n"),
    alternatives: [
      [
        "SELECT DISTINCT c.roll_no FROM CheckIn c",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM Workshop w",
        "  WHERE NOT EXISTS (SELECT 1 FROM CheckIn x WHERE x.roll_no = c.roll_no AND x.workshop_id = w.workshop_id)",
        ")",
      ].join("\n"),
      [
        "SELECT s.roll_no",
        "FROM (SELECT DISTINCT roll_no FROM CheckIn) s",
        "CROSS JOIN Workshop w",
        "LEFT JOIN CheckIn c ON c.roll_no = s.roll_no AND c.workshop_id = w.workshop_id",
        "GROUP BY s.roll_no",
        "HAVING SUM(c.scan_id IS NULL) = 0",
      ].join("\n"),
    ],
    hints: [
      "How many workshops are there? That number is a subquery on its own.",
      "A student attended them all exactly when the number of **different** workshops they scanned into equals that total.",
      "Repeated scans make `COUNT(*)` too big — count distinct workshops.",
      "Another way to say \"every\": there is no workshop the student did not attend.",
    ],
    editorial: [
      "\"Attended every workshop\" is **relational division**, and the counting form is the easiest to write. Group the scans by student; the student qualifies when the number of *different* workshops they scanned into equals the number of workshops in the catalogue, which a scalar subquery `(SELECT COUNT(*) FROM Workshop)` supplies.",
      "",
      "`DISTINCT` is essential. Student 502 in the example scanned three times but into only two workshops; `COUNT(*) = 3` would wrongly let them through. Counting distinct ids can only match the total when every workshop is covered, because every `workshop_id` in `CheckIn` is a real workshop — without that guarantee you would have to join to `Workshop` first so that unknown ids could not stand in for missing ones.",
      "",
      "The double `NOT EXISTS` is the textbook form: keep a student for whom there is no workshop with no matching scan. It reads like the definition and needs no counting, so duplicates never matter. The third query builds every student × workshop pair with a CROSS JOIN, attaches scans with a LEFT JOIN, and keeps students with no missing pair.",
      "",
      "The grouped version reads `CheckIn` once and `Workshop` once; the `NOT EXISTS` form probes `CheckIn` once per student and workshop, which is fast with an index on `(roll_no, workshop_id)`.",
    ].join("\n"),
  },

  {
    slug: "monthly-ticket-refund-report-by-zone",
    title: "Monthly Ticket Refund Report by Railway Zone",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Conditional Logic", "Dates"],
    description: [
      "Passengers who cancel a train ticket file a refund request, which ends up `refunded`, `rejected` or still `pending`. Requests filed online without choosing a zone have `zone` NULL.",
      "",
      "For every month and zone with at least one request, return these columns:",
      "",
      "- `month` — the month the request was filed, as text `'YYYY-MM'`;",
      "- `zone`;",
      "- `requests` — the number of requests;",
      "- `refunded` — how many of them were refunded;",
      "- `requested_amount` — the total amount asked for;",
      "- `refunded_amount` — the total amount of the refunded requests, **0** (never NULL) when none was refunded.",
      "",
      "Requests with a NULL zone form **their own group** in each month, shown with `zone` NULL. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "RefundRequest",
        columns: [
          { name: "request_id", type: "int" },
          { name: "zone", type: "varchar" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["refunded", "rejected", "pending"] },
          { name: "filed_on", type: "date" },
        ],
        primaryKey: ["request_id"],
        note: "One row per refund request; `amount` is in rupees and `zone` is NULL for requests filed without one.",
      },
    ],
    examples: [
      {
        RefundRequest: [
          [1, "Southern", 1200, "refunded", "2025-05-03"],
          [2, "Southern", 450, "rejected", "2025-05-18"],
          [3, "Western", 800, "refunded", "2025-05-21"],
          [4, null, 300, "pending", "2025-05-30"],
          [5, "Southern", 990, "refunded", "2025-06-01"],
          [6, null, 640, "refunded", "2025-06-11"],
          [7, "Western", 220, "pending", "2025-06-12"],
          [8, null, 150, "rejected", "2025-05-02"],
        ],
      },
    ],
    gen: (rng) => {
      const zones = sample(rng, RAIL_ZONES, ri(rng, 1, 3));
      const nullRate = pick(rng, [0, 0.2, 0.35]);
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      const rows = seq(1, m).map((id) => [
        id,
        chance(rng, nullRate) ? null : pick(rng, zones),
        roundTo(rng, 100, 3000, 10),
        pick(rng, REFUND_STATUS),
        dateBetween(rng, "2025-04-25", "2025-07-05"),
      ]);
      return { RefundRequest: rows };
    },
    solution: [
      "SELECT DATE_FORMAT(filed_on, '%Y-%m') AS month,",
      "       zone,",
      "       COUNT(*) AS requests,",
      "       SUM(IF(status = 'refunded', 1, 0)) AS refunded,",
      "       SUM(amount) AS requested_amount,",
      "       SUM(IF(status = 'refunded', amount, 0)) AS refunded_amount",
      "FROM RefundRequest",
      "GROUP BY DATE_FORMAT(filed_on, '%Y-%m'), zone",
    ].join("\n"),
    alternatives: [
      [
        "SELECT LEFT(filed_on, 7) AS month, zone, COUNT(*) AS requests,",
        "  COUNT(CASE WHEN status = 'refunded' THEN 1 END) AS refunded,",
        "  SUM(amount) AS requested_amount,",
        "  COALESCE(SUM(CASE WHEN status = 'refunded' THEN amount END), 0) AS refunded_amount",
        "FROM RefundRequest",
        "GROUP BY LEFT(filed_on, 7), zone",
      ].join("\n"),
      [
        "SELECT CONCAT(YEAR(filed_on), '-', LPAD(MONTH(filed_on), 2, '0')) AS month, zone, COUNT(*) AS requests,",
        "  SUM(status = 'refunded') AS refunded, SUM(amount) AS requested_amount,",
        "  SUM((status = 'refunded') * amount) AS refunded_amount",
        "FROM RefundRequest",
        "GROUP BY month, zone",
      ].join("\n"),
    ],
    hints: [
      "Group by two things: the month (`DATE_FORMAT(d, '%Y-%m')` turns a date into 'YYYY-MM') and the zone.",
      "Counting or summing only some rows of a group is conditional aggregation: `SUM(IF(condition, value, 0))`.",
      "`SUM(CASE WHEN … THEN amount END)` is NULL for a group with no refunded request — either give the CASE an `ELSE 0` or wrap the sum in COALESCE.",
      "Don't filter out NULL zones: GROUP BY already keeps them together as one group.",
    ],
    editorial: [
      "Each output row is one (month, zone) pair, so the query groups by both. The month comes from the date: `DATE_FORMAT(filed_on, '%Y-%m')` gives text like `2025-05`; `LEFT(filed_on, 7)` or `CONCAT(YEAR(…), '-', LPAD(MONTH(…), 2, '0'))` produce the same. Group by the very expression you select (or its alias): MySQL's `ONLY_FULL_GROUP_BY` refuses a selected expression it cannot match to the grouping. Grouping by `MONTH(filed_on)` alone would merge May 2025 with May of any other year.",
      "",
      "The four figures come from one pass over each group. `COUNT(*)` and `SUM(amount)` cover all requests. For the refunded ones, **conditional aggregation** keeps a single scan: `SUM(IF(status = 'refunded', 1, 0))` counts them and `SUM(IF(status = 'refunded', amount, 0))` adds up only their amounts. Writing it with `CASE WHEN … THEN amount END` and no `ELSE` gives NULL — not 0 — for a group with no refunds, because `SUM` over nothing but NULLs is NULL; the statement asks for 0, hence the `COALESCE`.",
      "",
      "The NULL zone needs no special handling. `GROUP BY` treats NULLs as equal for grouping, so each month's zone-less requests form one group, shown with `zone` NULL. Adding `WHERE zone IS NOT NULL` would lose them.",
      "",
      "The cost is one scan plus the grouping. Running several separate queries — one for totals, one for refunds — and joining them would read the table repeatedly and need outer joins to keep months with no refunds.",
    ].join("\n"),
  },

  {
    slug: "median-delivery-time-of-each-restaurant",
    title: "Median Delivery Time of Each Restaurant",
    difficulty: "HARD",
    topics: ["Aggregation", "Window Functions"],
    description: [
      "A food-delivery app records how many minutes each delivered order took. A cancelled order has `minutes` NULL.",
      "",
      "For every restaurant with at least one timed order, return `restaurant` and `median_minutes`, the median of its non-NULL `minutes`. Sort a restaurant's times: with an odd number of them the median is the middle value; with an **even** number it is the **average of the two middle values**, so it can end in .5. Equal times count separately (25, 25, 32, 41 has median 28.5). NULL times are ignored entirely, and a restaurant whose orders were all cancelled does not appear. Return the rows in any order.",
      "",
      "MySQL has no `MEDIAN` function — compute it from the sorted positions.",
    ].join("\n"),
    tables: [
      {
        name: "Delivery",
        columns: [
          { name: "order_id", type: "int" },
          { name: "restaurant", type: "varchar" },
          { name: "minutes", type: "int" },
        ],
        primaryKey: ["order_id"],
        note: "One row per order; `minutes` is the delivery time, or NULL for a cancelled order.",
      },
    ],
    examples: [
      {
        Delivery: [
          [1, "Dosa Corner", 32],
          [2, "Dosa Corner", 25],
          [3, "Dosa Corner", 41],
          [4, "Biryani House", 30],
          [5, "Biryani House", 44],
          [6, "Biryani House", 38],
          [7, "Biryani House", null],
          [8, "Chai Point", null],
          [9, "Dosa Corner", 25],
          [10, "Momo Hub", 27],
        ],
      },
    ],
    gen: (rng) => {
      const restaurants = sample(rng, RESTAURANTS, ri(rng, 1, 4));
      const nullRate = pick(rng, [0, 0.15, 0.3]);
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 30);
      const rows = seq(1, m).map((id) => {
        // Mostly multiples of 5, so equal times — and equal middle values — come up often.
        const minutes = chance(rng, 0.7) ? roundTo(rng, 15, 60, 5) : ri(rng, 12, 75);
        return [id, pick(rng, restaurants), chance(rng, nullRate) ? null : minutes];
      });
      return { Delivery: rows };
    },
    solution: [
      "WITH ranked AS (",
      "  SELECT restaurant, minutes,",
      "         ROW_NUMBER() OVER (PARTITION BY restaurant ORDER BY minutes) AS rn,",
      "         COUNT(*) OVER (PARTITION BY restaurant) AS cnt",
      "  FROM Delivery",
      "  WHERE minutes IS NOT NULL",
      ")",
      "SELECT restaurant, AVG(minutes) AS median_minutes",
      "FROM ranked",
      "WHERE rn IN (FLOOR((cnt + 1) / 2), FLOOR((cnt + 2) / 2))",
      "GROUP BY restaurant",
    ].join("\n"),
    alternatives: [
      [
        "SELECT restaurant, AVG(minutes) AS median_minutes",
        "FROM (",
        "  SELECT restaurant, minutes,",
        "         ROW_NUMBER() OVER (PARTITION BY restaurant ORDER BY minutes) AS rn,",
        "         COUNT(minutes) OVER (PARTITION BY restaurant) AS cnt",
        "  FROM Delivery WHERE minutes IS NOT NULL",
        ") t",
        "WHERE rn BETWEEN cnt / 2 AND cnt / 2 + 1",
        "GROUP BY restaurant",
      ].join("\n"),
      [
        "SELECT restaurant, AVG(DISTINCT minutes) AS median_minutes",
        "FROM (",
        "  SELECT a.restaurant, a.minutes",
        "  FROM Delivery a",
        "  JOIN Delivery b ON b.restaurant = a.restaurant AND b.minutes IS NOT NULL",
        "  WHERE a.minutes IS NOT NULL",
        "  GROUP BY a.order_id, a.restaurant, a.minutes",
        "  HAVING SUM(b.minutes < a.minutes) <= COUNT(*) / 2 AND SUM(b.minutes > a.minutes) <= COUNT(*) / 2",
        ") middle",
        "GROUP BY restaurant",
      ].join("\n"),
    ],
    hints: [
      "Throw away the NULL times first — they must not count towards a restaurant's size.",
      "Number each restaurant's times in sorted order (`ROW_NUMBER() OVER (PARTITION BY … ORDER BY minutes)`) and attach the restaurant's count with `COUNT(*) OVER (PARTITION BY …)`.",
      "With n values the middle positions are ⌊(n+1)/2⌋ and ⌊(n+2)/2⌋ — the same position when n is odd, two neighbours when it is even.",
      "Keep only the middle rows and average them per restaurant; that one AVG handles both the odd and the even case.",
      "Without window functions: a value is a middle value when at most n/2 values are smaller than it and at most n/2 are larger.",
    ],
    editorial: [
      "A median is defined by **positions** in sorted order, so the plan is to give each value its position and keep the middle one or two.",
      "",
      "Drop the NULLs first: a cancelled order has no time and must not count towards the size. Then two window functions over each restaurant do the bookkeeping: `ROW_NUMBER() OVER (PARTITION BY restaurant ORDER BY minutes)` numbers the sorted times 1…n, and `COUNT(*) OVER (PARTITION BY restaurant)` puts n on every row. For n values the middle positions are ⌊(n+1)/2⌋ and ⌊(n+2)/2⌋: for n = 5 both are 3, for n = 4 they are 2 and 3. Keeping the rows at those positions and taking `AVG(minutes)` per restaurant returns the single middle value when n is odd and the mean of the two middles when n is even. Ties in `minutes` make the order among equal values arbitrary, but they are equal, so the average does not change.",
      "",
      "`rn BETWEEN n/2 AND n/2 + 1` selects the same positions, because `/` is decimal division in MySQL.",
      "",
      "The window-free version counts instead of numbering: a value v is a middle value when at most n/2 values are below it and at most n/2 above it. With an even count the candidates are exactly the two middle values (possibly equal), so `AVG(DISTINCT minutes)` over the candidates is the median. That self join compares every pair inside a restaurant — quadratic — while the window version is a sort per restaurant.",
    ].join("\n"),
  },
];
