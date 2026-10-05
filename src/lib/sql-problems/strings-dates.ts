import type { SqlProblemSpec } from "./types.js";
import { FIRST_NAMES, LAST_NAMES, addDays, chance, dateBetween, maybeNull, names, pick, ri, roundTo, sample, shuffle } from "./kit.js";

/** Strings and dates: text functions, patterns, date arithmetic and date grouping. Easiest first. */

const range = (lo: number, hi: number): number[] => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

/** A name typed in a random case style, the way people fill in forms. */
function typedCase(rng: () => number, name: string): string {
  const style = pick(rng, ["random", "random", "upper", "lower", "proper"] as const);
  if (style === "upper") return name.toUpperCase();
  if (style === "lower") return name.toLowerCase();
  if (style === "proper") return name;
  return [...name].map((c) => (chance(rng, 0.5) ? c.toUpperCase() : c.toLowerCase())).join("");
}

const ML_CODES = ["ML301", "ML315", "ML410"] as const;
const OTHER_CODES = ["CS201", "CS305", "MA102", "EC220", "HS110", "HTML101", "XML205", "PH150"] as const;
// No two names whose first difference is a capital against a small letter, or a space against a letter:
// MySQL's default collation and a byte-wise sort agree on this list.
const CANTEEN_MENU = ["Chai", "Cold Coffee", "Idli", "Masala Dosa", "Poha", "Samosa", "Vada Pav", "Veg Sandwich"] as const;

export const STRINGS_DATES: SqlProblemSpec[] = [
  {
    slug: "fix-the-case-of-registered-names",
    title: "Fix the Capitalisation of Registered Names",
    difficulty: "EASY",
    topics: ["Strings"],
    description: [
      "Students typed their names into the tech-fest registration form in whatever case they liked — `aRJUN`, `PRIYA`, `kavya`.",
      "",
      "Return `reg_id` and `student_name`, with each name fixed so that **only the first letter is a capital** and every other letter is small, ordered by `reg_id` ascending. Every name is a single word made only of English letters.",
    ].join("\n"),
    tables: [
      {
        name: "Registration",
        columns: [
          { name: "reg_id", type: "int" },
          { name: "student_name", type: "varchar" },
        ],
        primaryKey: ["reg_id"],
        note: "One row per registration; `student_name` is exactly what the student typed, never NULL or empty.",
      },
    ],
    examples: [
      {
        Registration: [
          [3, "aRJUN"],
          [1, "priya"],
          [2, "KAVYA"],
          [5, "Ira"],
          [4, "nIKHIL"],
          [6, "om"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const ids = sample(rng, range(1, 30), n);
      const people = sample(rng, [...FIRST_NAMES, "Om", "Jo"], n);
      return { Registration: ids.map((id, i) => [id, typedCase(rng, people[i]!)]) };
    },
    solution: [
      "SELECT reg_id,",
      "       CONCAT(UPPER(LEFT(student_name, 1)), LOWER(SUBSTRING(student_name, 2))) AS student_name",
      "FROM Registration",
      "ORDER BY reg_id",
    ].join("\n"),
    alternatives: [
      "SELECT reg_id, CONCAT(UCASE(SUBSTR(student_name, 1, 1)), LCASE(SUBSTR(student_name, 2))) AS student_name FROM Registration ORDER BY reg_id",
      "SELECT reg_id, CONCAT(UPPER(LEFT(student_name, 1)), LOWER(RIGHT(student_name, CHAR_LENGTH(student_name) - 1))) AS student_name FROM Registration ORDER BY reg_id ASC",
    ],
    ordered: true,
    hints: [
      "Split each name into two parts: the first character, and everything after it.",
      "`LEFT(s, 1)` is the first character and `SUBSTRING(s, 2)` the rest; `UPPER` and `LOWER` change their case.",
      "`CONCAT` glues the parts back together — and keep the column name `student_name` with an alias.",
    ],
    editorial: [
      "Split each name into its first character and the rest, fix the case of each part, and join them back:",
      "",
      "- `LEFT(student_name, 1)` (or `SUBSTRING(student_name, 1, 1)`) is the first letter, and `UPPER` makes it a capital;",
      "- `SUBSTRING(student_name, 2)` is everything from the second character on, and `LOWER` makes it small letters — for a two-letter name like `om` it is a single letter, and the method needs no special case;",
      "- `CONCAT` joins the two parts.",
      "",
      "Alias the result `AS student_name`, or the column is named after the whole expression. The comparison of your output with the expected one is case-sensitive, which is the point of the exercise: `aRJUN` must become exactly `Arjun`.",
      "",
      "Another way to take the rest of the name is `RIGHT(student_name, CHAR_LENGTH(student_name) - 1)` — the last *length − 1* characters. `CHAR_LENGTH` counts characters while MySQL's `LENGTH` counts bytes; for plain English letters they agree, but `CHAR_LENGTH` is the right habit for text, since a name with an accented or Devanagari letter takes more than one byte per character.",
      "",
      "Finally `ORDER BY reg_id` gives the order the statement asks for. The work per row is constant, so the query is linear plus the sort.",
    ].join("\n"),
  },
  {
    slug: "students-taking-a-machine-learning-elective",
    title: "Students Registered for a Machine Learning Elective",
    difficulty: "EASY",
    topics: ["Strings"],
    description: [
      "Machine-learning electives at the college all have codes that **begin with `ML`** — `ML301`, `ML410` and so on. Other courses may contain the letters `ML` inside their code (`HTML101` is a web-design course); those are not machine-learning electives.",
      "",
      "Return `student_id`, `name` and `course_codes` for every student registered for **at least one** machine-learning elective, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Enrolment",
        columns: [
          { name: "student_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "course_codes", type: "varchar" },
        ],
        primaryKey: ["student_id"],
        note: "`course_codes` lists the codes of the student's electives separated by single spaces, or is NULL if they have not registered yet. A code is capital letters followed by three digits.",
      },
    ],
    examples: [
      {
        Enrolment: [
          [1, "Aditi", "CS201 ML301 HS110"],
          [2, "Farhan", "HTML101 CS305"],
          [3, "Kavya", "ML410"],
          [4, "Rahul", null],
          [5, "Simran", "MA102 XML205"],
          [6, "Tanvi", "EC220 ML315"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const people = names(rng, n);
      return {
        Enrolment: people.map((name, i) => {
          const codes = sample(rng, [...ML_CODES, ...OTHER_CODES], ri(rng, 1, 4));
          // HTML101 and XML205 often, the codes a '%ML%' pattern gets wrong.
          const trap = pick(rng, ["HTML101", "XML205"] as const);
          if (chance(rng, 0.3) && !codes.includes(trap)) codes.push(trap);
          return [i + 1, name, chance(rng, 0.1) ? null : shuffle(rng, codes).join(" ")];
        }),
      };
    },
    solution: [
      "SELECT student_id, name, course_codes",
      "FROM Enrolment",
      "WHERE course_codes LIKE 'ML%' OR course_codes LIKE '% ML%'",
    ].join("\n"),
    alternatives: [
      "SELECT student_id, name, course_codes FROM Enrolment WHERE CONCAT(' ', course_codes) LIKE '% ML%'",
      "SELECT student_id, name, course_codes FROM Enrolment WHERE course_codes REGEXP '(^| )ML'",
      "SELECT student_id, name, course_codes FROM Enrolment WHERE LOCATE(' ML', CONCAT(' ', course_codes)) > 0",
    ],
    hints: [
      "`LIKE '%ML%'` is too loose — try it on `HTML101`.",
      "An ML code is a word that starts with `ML`. In a space-separated list, where can a word start?",
      "A word starts either at the very beginning of the text or right after a space: that is two `LIKE` patterns.",
    ],
    editorial: [
      "A machine-learning elective is a *word* of the list that **starts with** `ML`. The list is words separated by single spaces, so such a word is either at the very start of the text or right after a space — exactly two `LIKE` patterns:",
      "",
      "- `course_codes LIKE 'ML%'` — the first code is an ML code;",
      "- `course_codes LIKE '% ML%'` — some later code is (a space, then `ML`).",
      "",
      "The tempting `LIKE '%ML%'` is wrong: it also matches `HTML101` and `XML205`, where the letters sit in the middle of a word. And `LIKE 'ML%'` alone misses every student whose ML elective is not listed first.",
      "",
      "A neat trick merges the two patterns: put a space in front of the whole list, `CONCAT(' ', course_codes)`, and now every code — the first one included — follows a space, so `LIKE '% ML%'` alone is enough. A regular expression says the same thing directly, `REGEXP '(^| )ML'`: the start of the text or a space, then `ML`. `LOCATE(' ML', CONCAT(' ', course_codes)) > 0` is the same search written as a position.",
      "",
      "Students with a NULL list match no pattern, since `NULL LIKE …` is unknown, so they drop out without a separate test. Each test scans the string once, so the query is linear in the total length of the lists. (Storing a list in one column is itself a design smell — a separate enrolment row per course would make this an ordinary `=` filter.)",
    ].join("\n"),
  },
  {
    slug: "placement-portal-valid-college-emails",
    title: "Applicants With a Valid College E-mail Address",
    difficulty: "EASY",
    topics: ["Strings"],
    description: [
      "The placement portal of Sahyadri Institute accepts only the institute's own e-mail addresses. An address is valid when:",
      "",
      "- the part before the `@` **starts with a letter** and contains only letters, digits, underscores `_`, periods `.` and hyphens `-`;",
      "- there is exactly one `@`, followed by the domain **`sahyadri.edu`** and nothing else.",
      "",
      "Return `applicant_id`, `name` and `email` for every applicant whose address is valid, in any order. An applicant with no address (`email` is NULL) is not valid.",
    ].join("\n"),
    tables: [
      {
        name: "Applicant",
        columns: [
          { name: "applicant_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "email", type: "varchar" },
        ],
        primaryKey: ["applicant_id"],
        note: "`email` is the address the applicant typed, or NULL if they signed up with a phone number. Domains are always typed in small letters.",
      },
    ],
    examples: [
      {
        Applicant: [
          [1, "Aisha", "aisha.khan@sahyadri.edu"],
          [2, "Rohan", "rohan_22@sahyadri.edu"],
          [3, "Pooja", "2021pooja@sahyadri.edu"],
          [4, "Karan", "karan#m@sahyadri.edu"],
          [5, "Mia", "mia-d@sahyadri.edu.in"],
          [6, "Dev", "Dev-Rao@sahyadri.edu"],
          [7, "Ira", null],
          [8, "Liam", "liam@sahyadri-edu"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const people = names(rng, n);
      return {
        Applicant: people.map((name, i) => {
          const base = name.toLowerCase();
          const last = pick(rng, LAST_NAMES);
          const goodLocal = pick(rng, [
            base,
            `${base}.${last.toLowerCase()}`,
            `${base}_${ri(rng, 1, 99)}`,
            `${name}-${last}`,
            `${base}${ri(rng, 2019, 2025)}`,
            `${base[0]}.${last.toLowerCase()}.${ri(rng, 1, 9)}`,
          ]);
          const badLocal = pick(rng, [`${ri(rng, 2019, 2025)}${base}`, `.${base}`, `_${base}`, `${base}#${ri(rng, 1, 9)}`, `${base}+fest`, `${base}!`, `-${base}`]);
          const badDomain = pick(rng, ["sahyadri.edu.in", "gmail.com", "sahyadri-edu", "sahyadriXedu", "mail.sahyadri.edu", "sahyadri.ed", `gmail.com@sahyadri.edu`]);
          const r = rng();
          const email = r < 0.08 ? null : r < 0.58 ? `${goodLocal}@sahyadri.edu` : r < 0.8 ? `${badLocal}@sahyadri.edu` : `${goodLocal}@${badDomain}`;
          return [i + 1, name, email];
        }),
      };
    },
    solution: [
      "SELECT applicant_id, name, email",
      "FROM Applicant",
      "WHERE email REGEXP '^[a-zA-Z][a-zA-Z0-9_.-]*@sahyadri[.]edu$'",
    ].join("\n"),
    alternatives: [
      "SELECT applicant_id, name, email FROM Applicant WHERE REGEXP_LIKE(email, '^[a-zA-Z][a-zA-Z0-9_.-]*@sahyadri[.]edu$')",
      [
        "SELECT applicant_id, name, email FROM Applicant",
        "WHERE CHAR_LENGTH(email) - CHAR_LENGTH(REPLACE(email, '@', '')) = 1",
        "  AND SUBSTRING_INDEX(email, '@', -1) = 'sahyadri.edu'",
        "  AND SUBSTRING_INDEX(email, '@', 1) REGEXP '^[a-zA-Z][a-zA-Z0-9_.-]*$'",
      ].join("\n"),
    ],
    hints: [
      "Rules about which characters may appear where are what regular expressions are for: `REGEXP`.",
      "Anchor the pattern with `^` and `$`, or it can match a valid-looking piece inside an invalid address.",
      "A bracket expression like `[a-zA-Z0-9_.-]` lists the allowed characters; `*` allows any number of them.",
      "Outside brackets `.` means \"any character\" — write the domain's dot as `[.]` so `sahyadri-edu` is rejected.",
    ],
    editorial: [
      "Validation rules like these are a **regular expression**: `email REGEXP pattern` (or `REGEXP_LIKE(email, pattern)`) is true when the address matches the pattern. Build it piece by piece:",
      "",
      "- `^` anchors the match at the start, so nothing may come before the first letter;",
      "- `[a-zA-Z]` is the required first letter — `2021pooja` and `.dev` fail here;",
      "- `[a-zA-Z0-9_.-]*` allows any number of the permitted characters. Inside brackets `.` is a literal period, and a `-` placed last is a literal hyphen;",
      "- `@sahyadri[.]edu` is the domain, with its dot written as `[.]` so it means a period and not \"any character\" — a bare `.` would accept `sahyadri-edu`;",
      "- `$` anchors the end, rejecting `sahyadri.edu.in`.",
      "",
      "`@` is not in the allowed set, so a second `@` can never sneak into the part before the domain. NULL addresses give a NULL match and drop out.",
      "",
      "A more step-by-step alternative splits the address with `SUBSTRING_INDEX`: count the `@`s (`CHAR_LENGTH(email) - CHAR_LENGTH(REPLACE(email, '@', ''))` must be 1), compare the part after it with `'sahyadri.edu'`, and check the part before it with a smaller, anchored pattern. It is longer but easier to debug one rule at a time. Either way each address is scanned a constant number of times, so the query is linear in the total length of the addresses.",
    ].join("\n"),
  },
  {
    slug: "canteen-menu-sold-each-day",
    title: "Canteen Items Sold on Each Day",
    difficulty: "EASY",
    topics: ["Strings", "Dates"],
    description: [
      "The canteen manager wants a one-line summary of each trading day. For every date on which anything was sold, return:",
      "",
      "- `sale_date`;",
      "- `item_count` — the number of **different** items sold that day;",
      "- `items` — those different items' names in **alphabetical order**, joined by commas with no spaces (`Chai,Samosa`).",
      "",
      "An item sold several times on one day is counted and listed once. Order the rows by `sale_date` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "CanteenSale",
        columns: [
          { name: "sale_id", type: "int" },
          { name: "sale_date", type: "date" },
          { name: "item", type: "varchar" },
        ],
        primaryKey: ["sale_id"],
        note: "One row per item sold over the counter. The same item is always spelled the same way.",
      },
    ],
    examples: [
      {
        CanteenSale: [
          [1, "2024-08-05", "Samosa"],
          [2, "2024-08-05", "Chai"],
          [3, "2024-08-05", "Samosa"],
          [4, "2024-08-06", "Vada Pav"],
          [5, "2024-08-05", "Cold Coffee"],
          [6, "2024-08-07", "Poha"],
          [7, "2024-08-07", "Idli"],
          [8, "2024-08-06", "Vada Pav"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.04) ? 0 : ri(rng, 1, 20);
      const base = dateBetween(rng, "2024-07-01", "2024-12-20");
      const span = ri(rng, 0, 4);
      const ids = shuffle(rng, range(1, n));
      return {
        CanteenSale: ids.map((id) => [id, addDays(base, ri(rng, 0, span)), pick(rng, CANTEEN_MENU)]),
      };
    },
    solution: [
      "SELECT sale_date,",
      "       COUNT(DISTINCT item) AS item_count,",
      "       GROUP_CONCAT(DISTINCT item ORDER BY item SEPARATOR ',') AS items",
      "FROM CanteenSale",
      "GROUP BY sale_date",
      "ORDER BY sale_date",
    ].join("\n"),
    alternatives: [
      [
        "SELECT sale_date, COUNT(*) AS item_count, GROUP_CONCAT(item ORDER BY item SEPARATOR ',') AS items",
        "FROM (SELECT DISTINCT sale_date, item FROM CanteenSale) d",
        "GROUP BY sale_date",
        "ORDER BY sale_date",
      ].join("\n"),
      "SELECT sale_date, COUNT(DISTINCT item) AS item_count, GROUP_CONCAT(DISTINCT item ORDER BY item) AS items FROM CanteenSale GROUP BY sale_date ORDER BY sale_date ASC",
    ],
    ordered: true,
    hints: [
      "One output row per date: group by `sale_date`.",
      "`COUNT(DISTINCT …)` counts each item once however many times it sold.",
      "MySQL's `GROUP_CONCAT` joins a group's values into one string, and takes `DISTINCT`, its own `ORDER BY` and a `SEPARATOR`.",
    ],
    editorial: [
      "Group the sales by day, then describe each group in two ways.",
      "",
      "`COUNT(DISTINCT item)` counts the different items — a dish sold five times on one day counts once.",
      "",
      "`GROUP_CONCAT` is MySQL's aggregate that joins the values of a group into one string, and its full form has every option this problem needs: `GROUP_CONCAT(DISTINCT item ORDER BY item SEPARATOR ',')`. `DISTINCT` drops repeated items, `ORDER BY item` sorts the names alphabetically *inside* the string, and the separator is a comma with no space (which is also MySQL's default). Without the inner `ORDER BY` the items come out in whatever order the rows happen to be read, and the answer can change when the table's storage order does.",
      "",
      "The outer `ORDER BY sale_date` then sorts the result rows themselves — a different job from the `ORDER BY` inside `GROUP_CONCAT`. Dates stored as `YYYY-MM-DD` sort chronologically.",
      "",
      "An alternative removes duplicates first: `SELECT DISTINCT sale_date, item` in a derived table, then group that by date with a plain `COUNT(*)` and `GROUP_CONCAT(item ORDER BY item)`. Both read the table once and sort within each day, so the cost is about O(n log n). One practical note: MySQL truncates a `GROUP_CONCAT` result at `group_concat_max_len` (1,024 bytes by default), which matters only for very long lists.",
    ].join("\n"),
  },
  {
    slug: "food-app-daily-active-users-30-days",
    title: "Daily Active Users in the 30 Days to 15 March",
    difficulty: "EASY",
    topics: ["Dates"],
    description: [
      "The growth team of a food-delivery app wants its daily active users for the **30 days ending 15 March 2025** — from `2025-02-14` to `2025-03-15`, both days included. A user is active on a day if they have at least one event that day, of any type.",
      "",
      "Return `day` and `active_users` (the number of different users active that day) for every day in that window with at least one event. Days without events are left out. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "AppEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "event_date", type: "date" },
          { name: "event_type", type: "enum", values: ["open", "search", "add_to_cart", "order"] },
        ],
        primaryKey: ["event_id"],
        note: "One row per thing a user did in the app. A user can have many events on the same day.",
      },
    ],
    examples: [
      {
        AppEvent: [
          [1, 7, "2025-02-13", "open"],
          [2, 7, "2025-02-14", "open"],
          [3, 7, "2025-02-14", "order"],
          [4, 9, "2025-02-14", "search"],
          [5, 3, "2025-03-01", "open"],
          [6, 9, "2025-03-15", "add_to_cart"],
          [7, 3, "2025-03-15", "open"],
          [8, 5, "2025-03-16", "order"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.04) ? 0 : ri(rng, 1, 25);
      const users = ri(rng, 1, 8);
      return {
        AppEvent: range(1, n).map((id) => {
          // The four days either side of the window's edges, often.
          const day = chance(rng, 0.3) ? pick(rng, ["2025-02-13", "2025-02-14", "2025-03-15", "2025-03-16"]) : dateBetween(rng, "2025-02-08", "2025-03-21");
          return [id, ri(rng, 1, users), day, pick(rng, ["open", "search", "add_to_cart", "order"])];
        }),
      };
    },
    solution: [
      "SELECT event_date AS day, COUNT(DISTINCT user_id) AS active_users",
      "FROM AppEvent",
      "WHERE event_date BETWEEN '2025-02-14' AND '2025-03-15'",
      "GROUP BY event_date",
    ].join("\n"),
    alternatives: [
      "SELECT event_date AS day, COUNT(DISTINCT user_id) AS active_users FROM AppEvent WHERE DATEDIFF('2025-03-15', event_date) BETWEEN 0 AND 29 GROUP BY event_date",
      "SELECT event_date AS day, COUNT(DISTINCT user_id) AS active_users FROM AppEvent WHERE event_date > DATE_SUB('2025-03-15', INTERVAL 30 DAY) AND event_date <= '2025-03-15' GROUP BY event_date",
    ],
    hints: [
      "First keep only the events inside the window, then count per day.",
      "`BETWEEN` includes both ends; `DATEDIFF(end, d)` tells you how many days before the end a date is.",
      "Thirty days ending on the 15th means 0 to 29 days before it — 30 would be one day too many.",
      "A user with several events on a day is one active user: count distinct users.",
    ],
    editorial: [
      "Two steps: keep the events inside the window, then count users per day.",
      "",
      "The window is 30 days **ending** on 15 March 2025, both ends included. Counting back, the first day is 14 February: 2025 is not a leap year, so the window is 15 days of February plus 15 of March. `WHERE event_date BETWEEN '2025-02-14' AND '2025-03-15'` keeps exactly those days, because `BETWEEN` includes both bounds and dates in `YYYY-MM-DD` form compare correctly.",
      "",
      "If you would rather not count days by hand, let the database do it: `DATEDIFF('2025-03-15', event_date) BETWEEN 0 AND 29` keeps the dates 0 to 29 days before the end — thirty days. `event_date > DATE_SUB('2025-03-15', INTERVAL 30 DAY) AND event_date <= '2025-03-15'` says the same with a half-open range. The classic off-by-one is `BETWEEN 0 AND 30`, which is 31 days and lets 13 February in.",
      "",
      "Then `GROUP BY event_date` with `COUNT(DISTINCT user_id)`: a user with three events in a day is one active user, while `COUNT(*)` would count events. Days without events produce no group, so they are absent, as asked. One scan of the table plus the grouping; with an index on `event_date` the range filter reads only the window.",
    ].join("\n"),
  },
  {
    slug: "days-the-air-got-worse",
    title: "Days the Air Quality Got Worse Than the Day Before",
    difficulty: "EASY",
    topics: ["Dates"],
    description: [
      "A city air-quality station records one AQI reading per day, but it sometimes goes offline, so some calendar days have no reading. A higher AQI means worse air.",
      "",
      "Return `reading_date` and `aqi` for every day whose AQI is **strictly higher** than the reading of the **previous calendar day**. A day whose previous calendar day has no reading is not compared and is not in the result. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "AqiReading",
        columns: [
          { name: "reading_id", type: "int" },
          { name: "reading_date", type: "date" },
          { name: "aqi", type: "int" },
        ],
        primaryKey: ["reading_id"],
        note: "One row per day with a reading; no date appears twice. `reading_id` values are not in date order.",
      },
    ],
    examples: [
      {
        AqiReading: [
          [4, "2024-10-30", 180],
          [2, "2024-10-31", 210],
          [7, "2024-11-01", 260],
          [1, "2024-11-02", 260],
          [5, "2024-11-04", 300],
          [3, "2024-11-05", 240],
          [6, "2024-11-06", 255],
        ],
      },
    ],
    gen: (rng) => {
      const len = chance(rng, 0.05) ? 1 : ri(rng, 2, 14);
      // Starts that cross month ends, a year end and both kinds of February.
      let day = chance(rng, 0.4) ? pick(rng, ["2023-12-29", "2024-02-26", "2025-02-25", "2024-04-28"]) : dateBetween(rng, "2023-11-01", "2025-03-01");
      let aqi = ri(rng, 60, 300);
      const ids = shuffle(rng, range(1, len));
      const rows: (number | string)[][] = [];
      for (let i = 0; i < len; i++) {
        if (i > 0) {
          day = addDays(day, chance(rng, 0.25) ? ri(rng, 2, 3) : 1);
          aqi = Math.min(480, Math.max(30, aqi + pick(rng, [-45, -20, 0, 0, 10, 25, 60])));
        }
        rows.push([ids[i]!, day, aqi]);
      }
      return { AqiReading: rows };
    },
    solution: [
      "SELECT t.reading_date, t.aqi",
      "FROM AqiReading t",
      "JOIN AqiReading y ON DATEDIFF(t.reading_date, y.reading_date) = 1",
      "WHERE t.aqi > y.aqi",
    ].join("\n"),
    alternatives: [
      "SELECT t.reading_date, t.aqi FROM AqiReading t JOIN AqiReading y ON y.reading_date = DATE_SUB(t.reading_date, INTERVAL 1 DAY) WHERE t.aqi > y.aqi",
      [
        "SELECT reading_date, aqi FROM (",
        "  SELECT reading_date, aqi,",
        "         LAG(reading_date) OVER (ORDER BY reading_date) AS prev_date,",
        "         LAG(aqi) OVER (ORDER BY reading_date) AS prev_aqi",
        "  FROM AqiReading",
        ") x",
        "WHERE DATEDIFF(reading_date, prev_date) = 1 AND aqi > prev_aqi",
      ].join("\n"),
      "SELECT reading_date, aqi FROM AqiReading t WHERE aqi > (SELECT y.aqi FROM AqiReading y WHERE y.reading_date = DATE_SUB(t.reading_date, INTERVAL 1 DAY))",
    ],
    hints: [
      "Each day must be compared with another row of the same table — yesterday's.",
      "The previous row by id, or even by date, is not always yesterday: the station skips days.",
      "Join the table to itself on the dates being exactly one day apart, using date arithmetic.",
    ],
    editorial: [
      "Each day is compared with a different row — the reading of the day before — so join the table to itself: `t` plays today and `y` yesterday.",
      "",
      "The join condition is the important part. The previous row in date order is *not* necessarily the previous calendar day, because the station skips days, and `reading_id` is not even in date order. So match on the dates themselves: `DATEDIFF(t.reading_date, y.reading_date) = 1`, or equivalently `y.reading_date = DATE_SUB(t.reading_date, INTERVAL 1 DAY)`. Date functions handle month ends, year ends and leap years — 1 March follows 29 February in 2024 but 28 February in 2025 — which subtracting day numbers by hand does not.",
      "",
      "After the join, `WHERE t.aqi > y.aqi` keeps the days that got worse. Equal readings are not higher, and a day with no reading the day before finds no partner, so the inner join drops it.",
      "",
      "A window-function version reads the previous row with `LAG(reading_date)` and `LAG(aqi)` over the date order, but must still check that the previous row is exactly one day earlier — skipping that check is the usual bug. A correlated subquery that fetches yesterday's AQI works too: when there is no reading yesterday it returns NULL and the comparison drops the row. With an index on `reading_date` each version is one lookup per day.",
    ].join("\n"),
  },
  {
    slug: "upi-payments-by-month-and-city",
    title: "UPI Payments by Month and City",
    difficulty: "MEDIUM",
    topics: ["Dates", "Conditional Logic"],
    description: [
      "A payments app wants a monthly report of its UPI transactions per city. For every month and city that has at least one transaction, return:",
      "",
      "- `month` — the month as text in the form `'YYYY-MM'`;",
      "- `city`;",
      "- `txn_count` — the number of transactions;",
      "- `success_count` — how many of them succeeded;",
      "- `txn_amount` — the total amount of all of them;",
      "- `success_amount` — the total amount of the successful ones (`0` if none succeeded).",
      "",
      "Transactions whose `city` is unknown (NULL) are grouped together as one city, shown as NULL. The same month of different years is a different month. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "UpiTransaction",
        columns: [
          { name: "txn_id", type: "int" },
          { name: "city", type: "varchar" },
          { name: "status", type: "enum", values: ["success", "failed"] },
          { name: "amount", type: "int" },
          { name: "txn_date", type: "date" },
        ],
        primaryKey: ["txn_id"],
        note: "`amount` is in rupees. `city` is where the payer was, or NULL when the app could not tell.",
      },
    ],
    examples: [
      {
        UpiTransaction: [
          [1, "Pune", "success", 500, "2024-12-03"],
          [2, "Pune", "failed", 1200, "2024-12-18"],
          [3, "Kochi", "success", 300, "2024-12-31"],
          [4, "Pune", "success", 700, "2025-01-01"],
          [5, null, "failed", 250, "2025-01-09"],
          [6, null, "success", 400, "2025-01-20"],
          [7, "Kochi", "failed", 900, "2025-01-22"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.03) ? 0 : ri(rng, 1, 16);
      const cities = sample(rng, ["Pune", "Kochi", "Jaipur", "Delhi", "Chennai"], ri(rng, 1, 3));
      return {
        UpiTransaction: range(1, n).map((id) => {
          // Now and then the same months a year later, which grouping by MONTH() alone would merge.
          const date = chance(rng, 0.12) ? dateBetween(rng, "2025-11-01", "2025-12-31") : dateBetween(rng, "2024-11-01", "2025-01-31");
          return [id, maybeNull(rng, 0.15, pick(rng, cities)), chance(rng, 0.65) ? "success" : "failed", roundTo(rng, 50, 5000, 50), date];
        }),
      };
    },
    solution: [
      "SELECT DATE_FORMAT(txn_date, '%Y-%m') AS month,",
      "       city,",
      "       COUNT(*) AS txn_count,",
      "       SUM(IF(status = 'success', 1, 0)) AS success_count,",
      "       SUM(amount) AS txn_amount,",
      "       SUM(IF(status = 'success', amount, 0)) AS success_amount",
      "FROM UpiTransaction",
      "GROUP BY DATE_FORMAT(txn_date, '%Y-%m'), city",
    ].join("\n"),
    alternatives: [
      [
        "SELECT LEFT(txn_date, 7) AS month, city, COUNT(*) AS txn_count,",
        "       SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success_count,",
        "       SUM(amount) AS txn_amount,",
        "       SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) AS success_amount",
        "FROM UpiTransaction",
        "GROUP BY LEFT(txn_date, 7), city",
      ].join("\n"),
      [
        "SELECT CONCAT(YEAR(txn_date), '-', LPAD(MONTH(txn_date), 2, '0')) AS month, city, COUNT(*) AS txn_count,",
        "       SUM(status = 'success') AS success_count, SUM(amount) AS txn_amount,",
        "       SUM((status = 'success') * amount) AS success_amount",
        "FROM UpiTransaction",
        "GROUP BY month, city",
      ].join("\n"),
    ],
    hints: [
      "Group by two things: the month and the city. `DATE_FORMAT(txn_date, '%Y-%m')` gives the month as `'YYYY-MM'`.",
      "Grouping by `MONTH(txn_date)` alone would put December 2024 and December 2025 together.",
      "Count and add only the successful transactions with an `IF` or `CASE` inside `SUM`.",
      "`GROUP BY` already collects all NULL cities into one group — no special handling needed.",
    ],
    editorial: [
      "Two grouping keys: the month and the city. The month comes from the date with `DATE_FORMAT(txn_date, '%Y-%m')`, which turns `2025-01-09` into `'2025-01'`. That keeps the year in the key, so December 2024 and December 2025 stay apart; grouping by `MONTH(txn_date)` alone would merge them.",
      "",
      "Within each (month, city) group the four numbers are plain or **conditional** aggregates:",
      "",
      "- `COUNT(*)` and `SUM(amount)` cover all of the group's transactions;",
      "- `SUM(IF(status = 'success', 1, 0))` counts only the successes, and `SUM(IF(status = 'success', amount, 0))` adds only their amounts — giving 0, not NULL, for a group with no successful transaction.",
      "",
      "NULL cities need no special code: `GROUP BY` puts every NULL into one group, which is what the statement asks for. (A `WHERE city = …` filter, by contrast, could never match them.)",
      "",
      "Other spellings: `LEFT(txn_date, 7)` gives the same `'YYYY-MM'` text from a date; grouping by `YEAR(txn_date), MONTH(txn_date)` and building the label with `CONCAT` and `LPAD` works too; and `SUM(status = 'success')` counts with a comparison that is 1 or 0, so `CASE WHEN … THEN amount ELSE 0 END` and `(status = 'success') * amount` are interchangeable with `IF`. Every version is one scan plus a grouping step.",
    ].join("\n"),
  },
  {
    slug: "grocery-customers-first-order-same-day",
    title: "Share of Customers Whose First Grocery Order Came Same Day",
    difficulty: "MEDIUM",
    topics: ["Dates"],
    description: [
      "A grocery app lets customers pick a delivery date when they order; an order is **same-day** when `deliver_on` equals `placed_on`. A customer's **first order** is the one with the earliest `placed_on` — no customer places two orders on the same day, so it is unique.",
      "",
      "Return one row with one column, `same_day_pct`: the percentage of customers whose **first** order was same-day, **rounded to 2 decimal places**. Every customer with at least one order counts once. If there are no orders at all, the percentage is NULL.",
    ].join("\n"),
    tables: [
      {
        name: "GroceryOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "placed_on", type: "date" },
          { name: "deliver_on", type: "date" },
        ],
        primaryKey: ["order_id"],
        note: "`deliver_on` is the delivery date the customer chose, never earlier than `placed_on`. `order_id` values are not in date order.",
      },
    ],
    examples: [
      {
        GroceryOrder: [
          [1, 1, "2024-06-01", "2024-06-01"],
          [2, 1, "2024-06-03", "2024-06-05"],
          [3, 2, "2024-06-02", "2024-06-04"],
          [4, 2, "2024-06-05", "2024-06-05"],
          [5, 3, "2024-06-08", "2024-06-10"],
          [6, 3, "2024-06-04", "2024-06-04"],
        ],
      },
    ],
    gen: (rng) => {
      const customers = chance(rng, 0.04) ? [] : sample(rng, range(1, 30), ri(rng, 1, 9));
      const start = dateBetween(rng, "2024-01-01", "2024-12-01");
      const orders: (number | string)[][] = [];
      for (const c of customers) {
        for (const offset of sample(rng, range(0, 20), ri(rng, 1, 4))) {
          const placed = addDays(start, offset);
          orders.push([c, placed, addDays(placed, pick(rng, [0, 0, 1, 1, 2, 3]))]);
        }
      }
      // Ids are handed out in a shuffled order, so the smallest id is not the first order.
      const ids = shuffle(rng, range(1, orders.length));
      return { GroceryOrder: orders.map((o, i) => [ids[i]!, ...o]) };
    },
    solution: [
      "SELECT ROUND(100 * SUM(placed_on = deliver_on) / COUNT(*), 2) AS same_day_pct",
      "FROM GroceryOrder",
      "WHERE (customer_id, placed_on) IN (",
      "  SELECT customer_id, MIN(placed_on) FROM GroceryOrder GROUP BY customer_id",
      ")",
    ].join("\n"),
    alternatives: [
      [
        "SELECT ROUND(AVG(placed_on = deliver_on) * 100, 2) AS same_day_pct",
        "FROM (",
        "  SELECT placed_on, deliver_on, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY placed_on) AS rn",
        "  FROM GroceryOrder",
        ") ranked",
        "WHERE rn = 1",
      ].join("\n"),
      [
        "SELECT ROUND(SUM(CASE WHEN o.deliver_on = o.placed_on THEN 1 ELSE 0 END) * 100 / COUNT(*), 2) AS same_day_pct",
        "FROM GroceryOrder o",
        "JOIN (SELECT customer_id, MIN(placed_on) AS first_day FROM GroceryOrder GROUP BY customer_id) f",
        "  ON f.customer_id = o.customer_id AND f.first_day = o.placed_on",
      ].join("\n"),
      [
        "SELECT ROUND(100 * AVG(CASE WHEN o.deliver_on = o.placed_on THEN 1 ELSE 0 END), 2) AS same_day_pct",
        "FROM GroceryOrder o",
        "WHERE NOT EXISTS (SELECT 1 FROM GroceryOrder e WHERE e.customer_id = o.customer_id AND e.placed_on < o.placed_on)",
      ].join("\n"),
    ],
    hints: [
      "Split the task: first find each customer's first order, then compute a percentage over those orders only.",
      "`MIN(placed_on)` per customer gives the date of the first order; match it back to the order rows.",
      "`order_id` is not in date order, so the smallest id is not necessarily the first order.",
      "A comparison like `placed_on = deliver_on` is 1 or 0 in MySQL — its `SUM` counts, its `AVG` is a ratio.",
    ],
    editorial: [
      "Two steps: find each customer's first order, then measure what share of those first orders were same-day.",
      "",
      "**The first order.** The earliest date per customer is `MIN(placed_on)` grouped by customer. To get the whole order back, keep the orders whose `(customer_id, placed_on)` pair is among those minimums — a row-value `IN` — or join the orders to the grouped minimums on both columns. Because a customer never orders twice on one day, exactly one row per customer survives. Note that `order_id` is not a safe shortcut: a smaller id may have been placed later.",
      "",
      "**The percentage.** Over the surviving rows, `SUM(placed_on = deliver_on)` counts the same-day first orders (the comparison is 1 or 0), and dividing by `COUNT(*)` — one row per customer — and multiplying by 100 gives the percentage, which `ROUND(…, 2)` rounds. `AVG` of the same 1/0 comparison is that ratio in one function. With no orders at all, both forms give NULL.",
      "",
      "A frequent wrong answer computes the share over *all* orders instead of first orders; another counts a customer as same-day if *any* of their orders was.",
      "",
      "Alternatives: number each customer's orders with `ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY placed_on)` and keep row 1, or keep the orders for which `NOT EXISTS` an earlier order by the same customer. All of them group or sort per customer, so the cost is about O(n log n) with an index on `(customer_id, placed_on)`.",
    ].join("\n"),
  },
];
