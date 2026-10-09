import type { Cell } from "../sql/types.js";
import type { Rng, SqlProblemSpec } from "./types.js";
import { addDays, chance, dateBetween, DEPARTMENTS, FIRST_NAMES, LAST_NAMES, pick, ri, roundTo, sample, shuffle } from "./kit.js";

/**
 * HR, payroll and recruiting — the questions an HR-ops analyst, a payroll
 * engineer or a talent-acquisition lead is actually handed: probation
 * confirmations that are overdue, headcount by work mode, emergency contacts
 * that are missing, work e-mail addresses for new joiners, late punch-ins,
 * earned leave that lapses past the carry-forward cap, referral bonuses,
 * work anniversaries, appraisal hikes and rating distributions, hiring
 * funnels and time-to-fill, attrition and new-hire retention, payroll
 * variance, and the org hierarchy walked recursively. The classic
 * employee/manager/salary puzzles already live in the topic files; these are
 * the operational reports around them.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
/** `n` distinct "First Last" names (n ≤ 40). */
const fullNames = (rng: Rng, n: number): string[] => sample(rng, FIRST_NAMES, n).map((f) => `${f} ${pick(rng, LAST_NAMES)}`);
const WORK_MODES = ["onsite", "hybrid", "remote"] as const;
const RELATIONS = ["Spouse", "Father", "Mother", "Sibling", "Friend"] as const;
const phone = (rng: Rng): number => ri(rng, 7000000000, 9999999999);

export const WORLD_HR: SqlProblemSpec[] = [
  {
    slug: "employees-overdue-for-probation-confirmation",
    title: "Employees Overdue for Probation Confirmation",
    difficulty: "EASY",
    topics: ["Basics", "Dates"],
    description: [
      "Every new joiner starts on probation, and HR has to confirm them (or extend the probation) by the `probation_end` date. On the review day, **30 June 2025**, HR wants the confirmations that slipped.",
      "",
      "Return every employee whose `status` is still `'probation'` and whose `probation_end` is **strictly before** `2025-06-30`, with the columns `emp_id`, `full_name`, `probation_end` and `days_overdue` (the number of days from `probation_end` to 2025-06-30). A probation ending on the review day itself is not overdue. Order the rows by `days_overdue` descending, then `emp_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Employee",
        columns: [
          { name: "emp_id", type: "int" },
          { name: "full_name", type: "varchar" },
          { name: "department", type: "varchar" },
          { name: "joined_on", type: "date" },
          { name: "probation_end", type: "date" },
          { name: "status", type: "enum", values: ["probation", "confirmed", "exited"] },
        ],
        primaryKey: ["emp_id"],
        note: "One row per employee. `probation_end` is set when the person joins; `status` moves to `confirmed` once HR signs off.",
      },
    ],
    examples: [
      {
        Employee: [
          [1001, "Aarav Sharma", "Engineering", "2024-11-04", "2025-05-03", "probation"],
          [1002, "Diya Iyer", "Sales", "2024-12-02", "2025-06-30", "probation"],
          [1003, "Kabir Khan", "Finance", "2024-10-01", "2025-03-30", "confirmed"],
          [1004, "Meera Nair", "Support", "2024-12-16", "2025-06-14", "probation"],
          [1005, "Rohan Das", "Engineering", "2024-11-18", "2025-05-17", "probation"],
          [1006, "Zara Joshi", "HR", "2025-01-06", "2025-07-05", "probation"],
          [1007, "Vikram Rao", "Design", "2024-09-02", "2025-03-01", "exited"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.04) ? 0 : ri(rng, 1, 16);
      const who = fullNames(rng, Math.max(n, 1));
      const rows: Cell[][] = seq(1001, n).map((id, i) => {
        const joined = dateBetween(rng, "2024-08-01", "2025-03-31");
        // Mostly the standard 180 days; now and then exactly on the review day, or two joiners on one end date.
        const end = chance(rng, 0.12) ? "2025-06-30" : chance(rng, 0.1) ? "2025-05-17" : addDays(joined, 180);
        const status = chance(rng, 0.6) ? "probation" : pick(rng, ["confirmed", "exited"]);
        return [id, who[i]!, pick(rng, DEPARTMENTS), joined, end, status];
      });
      return { Employee: rows };
    },
    solution: [
      "SELECT emp_id, full_name, probation_end, DATEDIFF('2025-06-30', probation_end) AS days_overdue",
      "FROM Employee",
      "WHERE status = 'probation' AND probation_end < '2025-06-30'",
      "ORDER BY days_overdue DESC, emp_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT emp_id, full_name, probation_end, TIMESTAMPDIFF(DAY, probation_end, '2025-06-30') AS days_overdue",
        "FROM Employee",
        "WHERE status = 'probation' AND TIMESTAMPDIFF(DAY, probation_end, '2025-06-30') > 0",
        "ORDER BY probation_end, emp_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Two conditions must both hold: the person is still on probation, and the end date has passed.",
      "\"Strictly before\" the review day means a probation ending on 2025-06-30 stays out.",
      "`DATEDIFF(later, earlier)` gives the number of days between two dates.",
    ],
    editorial: [
      "This is a filter with one computed column. Keep the rows where `status = 'probation'` — confirmed and exited people are no longer anyone's to-do — and where `probation_end < '2025-06-30'`. Dates stored as `YYYY-MM-DD` compare correctly as values, and the strict `<` keeps a probation that ends on the review day itself out of the list, as asked.",
      "",
      "`DATEDIFF('2025-06-30', probation_end)` counts the days between the two dates, later date first, so an overdue confirmation gets a positive number. `TIMESTAMPDIFF(DAY, probation_end, '2025-06-30')` is the same count with the arguments the other way round; filtering on it being `> 0` is equivalent to the date comparison.",
      "",
      "The order is the longest overdue first. Because `days_overdue` falls as `probation_end` rises, sorting by `probation_end` ascending gives the same order — the alternative shows that — and `emp_id` breaks ties when two people share an end date. One scan of the table; an index on `(status, probation_end)` would turn it into a range read.",
    ].join("\n"),
  },

  {
    slug: "on-payroll-headcount-by-work-mode",
    title: "On-Payroll Headcount by Department and Work Mode",
    difficulty: "EASY",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "The facilities team is planning desks and needs to know how each department works. Everyone **on the payroll** counts — that is status `'active'` and also `'notice'` (people serving their notice period still come in); `'exited'` employees do not.",
      "",
      "Return one row per department that has at least one on-payroll employee, with the columns `department`, `onsite`, `hybrid`, `remote` (the number of on-payroll employees in each work mode, 0 when none) and `total`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Employee",
        columns: [
          { name: "emp_id", type: "int" },
          { name: "department", type: "varchar" },
          { name: "work_mode", type: "enum", values: ["onsite", "hybrid", "remote"] },
          { name: "status", type: "enum", values: ["active", "notice", "exited"] },
        ],
        primaryKey: ["emp_id"],
        note: "One row per employee, past or present. `work_mode` is the arrangement in the employee's contract.",
      },
    ],
    examples: [
      {
        Employee: [
          [1, "Engineering", "hybrid", "active"],
          [2, "Engineering", "remote", "active"],
          [3, "Engineering", "hybrid", "notice"],
          [4, "Sales", "onsite", "active"],
          [5, "Sales", "onsite", "exited"],
          [6, "Legal", "remote", "exited"],
          [7, "Support", "onsite", "active"],
          [8, "Support", "remote", "notice"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.04) ? 0 : ri(rng, 1, 25);
      const depts = sample(rng, DEPARTMENTS, ri(rng, 1, 5));
      return {
        Employee: seq(1, n).map((id) => [id, pick(rng, depts), pick(rng, WORK_MODES), pick(rng, ["active", "active", "notice", "exited"])]),
      };
    },
    solution: [
      "SELECT department,",
      "       SUM(CASE WHEN work_mode = 'onsite' THEN 1 ELSE 0 END) AS onsite,",
      "       SUM(CASE WHEN work_mode = 'hybrid' THEN 1 ELSE 0 END) AS hybrid,",
      "       SUM(CASE WHEN work_mode = 'remote' THEN 1 ELSE 0 END) AS remote,",
      "       COUNT(*) AS total",
      "FROM Employee",
      "WHERE status IN ('active', 'notice')",
      "GROUP BY department",
    ].join("\n"),
    alternatives: [
      [
        "SELECT department, SUM(IF(work_mode = 'onsite', 1, 0)) AS onsite, SUM(IF(work_mode = 'hybrid', 1, 0)) AS hybrid,",
        "       SUM(IF(work_mode = 'remote', 1, 0)) AS remote, COUNT(*) AS total",
        "FROM Employee WHERE status <> 'exited' GROUP BY department",
      ].join("\n"),
      [
        "SELECT department, COUNT(CASE WHEN work_mode = 'onsite' THEN 1 END) AS onsite,",
        "       COUNT(CASE WHEN work_mode = 'hybrid' THEN 1 END) AS hybrid,",
        "       COUNT(CASE WHEN work_mode = 'remote' THEN 1 END) AS remote, COUNT(emp_id) AS total",
        "FROM Employee WHERE status IN ('active', 'notice') GROUP BY department",
      ].join("\n"),
    ],
    hints: [
      "Drop the exited employees first; a department with only exited people should then disappear on its own.",
      "One row per department means one GROUP BY; the three mode columns are three different counts inside each group.",
      "`SUM(CASE WHEN … THEN 1 ELSE 0 END)` counts the rows of a group that meet a condition, and gives 0 when none do.",
    ],
    editorial: [
      "The pattern is **conditional aggregation**: one group per department, several counts per group, each counting only the rows that meet its own condition.",
      "",
      "Filter first: `WHERE status IN ('active', 'notice')` keeps everyone on the payroll. Because the filter runs before grouping, a department whose employees have all exited produces no group at all, which is what the statement asks for. Then `GROUP BY department`, and inside each group `SUM(CASE WHEN work_mode = 'onsite' THEN 1 ELSE 0 END)` adds 1 for each onsite row and 0 for the rest — so a department with nobody remote gets a 0, not a NULL. `COUNT(*)` is the total.",
      "",
      "`SUM(IF(…, 1, 0))` is MySQL shorthand for the same thing, and `COUNT(CASE WHEN … THEN 1 END)` works because a CASE without ELSE yields NULL, and COUNT skips NULLs. All three read the table once — it is a single pass with a hash on department.",
    ].join("\n"),
  },

  {
    slug: "employees-without-a-reachable-emergency-contact",
    title: "Employees Without a Reachable Emergency Contact",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "Before the annual safety audit, HR checks that every current employee has someone to call in an emergency. A contact only counts if it has a **phone number** — rows where `phone` is NULL were saved half-filled from the onboarding form.",
      "",
      "Return the `emp_id` and `full_name` of every employee whose `status` is not `'exited'` and who has **no emergency contact with a non-NULL phone**. Exited employees are never in the answer. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Employee",
        columns: [
          { name: "emp_id", type: "int" },
          { name: "full_name", type: "varchar" },
          { name: "status", type: "enum", values: ["active", "notice", "exited"] },
        ],
        primaryKey: ["emp_id"],
        note: "One row per employee, past or present.",
      },
      {
        name: "EmergencyContact",
        columns: [
          { name: "contact_id", type: "int" },
          { name: "emp_id", type: "int" },
          { name: "contact_name", type: "varchar" },
          { name: "relation", type: "varchar" },
          { name: "phone", type: "bigint" },
        ],
        primaryKey: ["contact_id"],
        note: "An employee may list several contacts. `phone` is a 10-digit mobile number, or NULL when it was never filled in.",
      },
    ],
    examples: [
      {
        Employee: [
          [201, "Ananya Reddy", "active"],
          [202, "Ishaan Gupta", "active"],
          [203, "Pooja Mehta", "notice"],
          [204, "Farhan Khan", "exited"],
          [205, "Tanvi Bose", "active"],
        ],
        EmergencyContact: [
          [1, 201, "Suresh Reddy", "Father", 9845012345],
          [2, 202, "Lata Gupta", "Mother", null],
          [3, 203, "Amit Mehta", "Spouse", 9123456780],
          [4, 203, "Kiran Mehta", "Sibling", null],
          [5, 205, "Nisha Bose", "Spouse", null],
          [6, 205, "Raj Bose", "Father", null],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const who = fullNames(rng, n);
      const ids = seq(201, n);
      const emps = ids.map((id, i) => [id, who[i]!, pick(rng, ["active", "active", "notice", "exited"])]);
      const contacts: Cell[][] = [];
      let cid = 1;
      const rate = pick(rng, [0, 0.5, 0.8, 1]);
      for (const id of ids) {
        if (!chance(rng, rate)) continue;
        for (let k = ri(rng, 1, 3); k > 0; k--) {
          contacts.push([cid++, id, `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`, pick(rng, RELATIONS), chance(rng, 0.4) ? null : phone(rng)]);
        }
      }
      return { Employee: emps, EmergencyContact: contacts };
    },
    solution: [
      "SELECT e.emp_id, e.full_name",
      "FROM Employee e",
      "LEFT JOIN EmergencyContact c ON c.emp_id = e.emp_id AND c.phone IS NOT NULL",
      "WHERE e.status <> 'exited' AND c.contact_id IS NULL",
    ].join("\n"),
    alternatives: [
      "SELECT emp_id, full_name FROM Employee e WHERE status <> 'exited' AND NOT EXISTS (SELECT 1 FROM EmergencyContact c WHERE c.emp_id = e.emp_id AND c.phone IS NOT NULL)",
      "SELECT emp_id, full_name FROM Employee WHERE status IN ('active', 'notice') AND emp_id NOT IN (SELECT emp_id FROM EmergencyContact WHERE phone IS NOT NULL)",
    ],
    hints: [
      "This is an anti join: employees with no matching row in the contacts table.",
      "But not every contact is a match — only one with a phone number.",
      "With a LEFT JOIN, put the phone condition in the `ON` clause, not in `WHERE`, or the join turns back into an inner join.",
    ],
    editorial: [
      "We want employees for whom **no usable contact exists** — an anti join, with a twist: the partner rows must themselves pass a filter (`phone IS NOT NULL`).",
      "",
      "With a LEFT JOIN the twist decides where the condition goes. Written in the `ON` clause, `c.phone IS NOT NULL` limits which contacts may match; an employee whose contacts all lack a phone then matches nothing and comes out once with NULLs, which `c.contact_id IS NULL` keeps. Written in `WHERE` instead, it would run after the join and also throw away the very NULL-extended rows we are looking for, so the query would return nobody.",
      "",
      "`NOT EXISTS` with the phone test inside the subquery reads the same rule directly. `NOT IN` is safe here only because the subquery selects `emp_id`, which is never NULL on a contact; were it nullable, one NULL would make every `NOT IN` unknown. Exited people are filtered on the employee side in all three. Each form is one lookup per employee with an index on `EmergencyContact.emp_id`.",
    ].join("\n"),
  },

  {
    slug: "work-email-addresses-for-new-joiners",
    title: "Work E-mail Addresses for New Joiners",
    difficulty: "EASY",
    topics: ["Strings", "Conditional Logic"],
    description: [
      "IT creates a mailbox for each new joiner before day one. The address is the first name, a dot and the last name, all in **lower case** with any spaces removed, followed by `@acmecorp.in` — `Ravi De Souza` becomes `ravi.desouza@acmecorp.in`. Some joiners have a single name and `last_name` NULL; their address is just the first name, `@acmecorp.in` (no dot).",
      "",
      "Return `joiner_id` and `work_email` for every joiner. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "NewJoiner",
        columns: [
          { name: "joiner_id", type: "int" },
          { name: "first_name", type: "varchar" },
          { name: "last_name", type: "varchar" },
          { name: "joining_date", type: "date" },
        ],
        primaryKey: ["joiner_id"],
        note: "One row per person with an accepted offer. `last_name` is NULL for people who go by one name; a last name may contain a space.",
      },
    ],
    examples: [
      {
        NewJoiner: [
          [1, "Ravi", "De Souza", "2025-07-01"],
          [2, "Priya", "Iyer", "2025-07-01"],
          [3, "Anbu", null, "2025-07-07"],
          [4, "Sara", "Van Der Berg", "2025-07-14"],
          [5, "Harsh", "Mehta", "2025-07-14"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const LONG = ["De Souza", "Van Der Berg", "Da Costa", "Sen Gupta", "Mac Donald"];
      return {
        NewJoiner: seq(1, n).map((id) => [
          id,
          pick(rng, FIRST_NAMES),
          chance(rng, 0.2) ? null : chance(rng, 0.3) ? pick(rng, LONG) : pick(rng, LAST_NAMES),
          dateBetween(rng, "2025-07-01", "2025-08-31"),
        ]),
      };
    },
    solution: [
      "SELECT joiner_id,",
      "       CASE WHEN last_name IS NULL",
      "            THEN CONCAT(LOWER(first_name), '@acmecorp.in')",
      "            ELSE CONCAT(LOWER(first_name), '.', LOWER(REPLACE(last_name, ' ', '')), '@acmecorp.in')",
      "       END AS work_email",
      "FROM NewJoiner",
    ].join("\n"),
    alternatives: [
      "SELECT joiner_id, CONCAT(LOWER(CONCAT_WS('.', first_name, REPLACE(last_name, ' ', ''))), '@acmecorp.in') AS work_email FROM NewJoiner",
      "SELECT joiner_id, CONCAT(LOWER(first_name), IFNULL(CONCAT('.', LOWER(REPLACE(last_name, ' ', ''))), ''), '@acmecorp.in') AS work_email FROM NewJoiner",
    ],
    hints: [
      "`CONCAT` glues strings together, `LOWER` lower-cases, `REPLACE(s, ' ', '')` removes spaces.",
      "What does `CONCAT` return when one of its arguments is NULL?",
      "`CONCAT_WS(sep, …)` skips NULL arguments — and never leaves a dangling separator.",
    ],
    editorial: [
      "Building the address is string plumbing: `LOWER(first_name)`, a dot, `LOWER(REPLACE(last_name, ' ', ''))` and the domain, joined with `CONCAT`.",
      "",
      "The NULL last name is the catch. In MySQL `CONCAT` returns NULL as soon as any argument is NULL, so the naive expression gives a single-name joiner no address at all. The solution branches with `CASE WHEN last_name IS NULL`, leaving out both the dot and the last name in that branch.",
      "",
      "Two neater forms avoid the branch. `CONCAT_WS('.', first_name, last_name_without_spaces)` joins its non-NULL arguments with the separator and simply skips a NULL — with no stray dot — and the result is lower-cased once. Or build the `'.' + last name` piece with `CONCAT`, which is NULL exactly when the last name is, and turn it into an empty string with `IFNULL`. Each is one pass over the table with constant work per row.",
    ].join("\n"),
  },

  {
    slug: "late-punch-ins-per-employee-in-march",
    title: "Late Punch-Ins per Employee in March 2025",
    difficulty: "EASY",
    topics: ["Aggregation", "Dates"],
    description: [
      "The office shift starts at **09:30**. The biometric system records one punch per employee per working day, and a punch-in is **late** when its time of day is **after 09:30:00** — a punch at exactly 09:30:00 is on time, one at 09:30:01 is late.",
      "",
      "For **March 2025** only, return every employee with at least one late punch-in, with the columns `emp_id` and `late_days` (the number of late punch-ins that month). Order the rows by `late_days` descending, then `emp_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Punch",
        columns: [
          { name: "punch_id", type: "int" },
          { name: "emp_id", type: "int" },
          { name: "punch_in", type: "datetime" },
          { name: "punch_out", type: "datetime" },
        ],
        primaryKey: ["punch_id"],
        note: "One row per employee per day they came in. `punch_out` is NULL when the employee forgot to punch out.",
      },
    ],
    examples: [
      {
        Punch: [
          [1, 11, "2025-02-28 09:50:00", "2025-02-28 18:40:00"],
          [2, 11, "2025-03-03 09:42:10", "2025-03-03 18:30:00"],
          [3, 11, "2025-03-04 09:30:00", "2025-03-04 18:05:00"],
          [4, 12, "2025-03-03 09:30:01", null],
          [5, 12, "2025-03-04 10:15:00", "2025-03-04 19:00:00"],
          [6, 13, "2025-03-05 09:05:00", "2025-03-05 17:45:00"],
          [7, 14, "2025-03-31 11:02:00", "2025-03-31 19:30:00"],
          [8, 14, "2025-04-01 09:45:00", "2025-04-01 18:10:00"],
        ],
      },
    ],
    gen: (rng) => {
      const emps = seq(11, ri(rng, 1, 6));
      const days = [...new Set(Array.from({ length: 10 }, () => (chance(rng, 0.2) ? pick(rng, ["2025-02-28", "2025-03-01", "2025-03-31", "2025-04-01"]) : dateBetween(rng, "2025-02-24", "2025-04-04"))))];
      const pairs = shuffle(rng, emps.flatMap((e) => days.map((d) => [e, d] as const))).slice(0, chance(rng, 0.04) ? 0 : ri(rng, 1, 28));
      const pad = (x: number) => String(x).padStart(2, "0");
      return {
        Punch: pairs.map(([e, d], i) => {
          const t = chance(rng, 0.15) ? pick(rng, ["09:30:00", "09:30:01", "09:29:59"]) : `${pad(ri(rng, 8, 10))}:${pad(ri(rng, 0, 59))}:${pad(ri(rng, 0, 59))}`;
          return [i + 1, e, `${d} ${t}`, chance(rng, 0.1) ? null : `${d} ${pad(ri(rng, 17, 20))}:${pad(ri(rng, 0, 59))}:00`];
        }),
      };
    },
    solution: [
      "SELECT emp_id, COUNT(*) AS late_days",
      "FROM Punch",
      "WHERE punch_in >= '2025-03-01' AND punch_in < '2025-04-01'",
      "  AND HOUR(punch_in) * 3600 + MINUTE(punch_in) * 60 + SECOND(punch_in) > 9 * 3600 + 30 * 60",
      "GROUP BY emp_id",
      "ORDER BY late_days DESC, emp_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT emp_id, SUM(CASE WHEN DATE_FORMAT(punch_in, '%H:%i:%s') > '09:30:00' THEN 1 ELSE 0 END) AS late_days",
        "FROM Punch",
        "WHERE YEAR(punch_in) = 2025 AND MONTH(punch_in) = 3",
        "GROUP BY emp_id",
        "HAVING late_days > 0",
        "ORDER BY late_days DESC, emp_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Two filters: the punch falls in March 2025, and its time of day is after 09:30:00.",
      "A datetime's time of day can be compared as text (`DATE_FORMAT(punch_in, '%H:%i:%s')`) or as seconds since midnight.",
      "`punch_in < '2025-04-01'` includes every moment of 31 March; `<= '2025-03-31'` would not.",
    ],
    editorial: [
      "Filter, then count per employee.",
      "",
      "The month filter is a half-open range: `punch_in >= '2025-03-01' AND punch_in < '2025-04-01'`. It is the safe way to bound a datetime — `punch_in <= '2025-03-31'` would compare `'2025-03-31 11:02:00'` with the bare date and drop the whole last day. `YEAR(…) = 2025 AND MONTH(…) = 3` is the readable alternative, though it cannot use an index on `punch_in`.",
      "",
      "Lateness is about the time of day only. Turning it into seconds since midnight — `HOUR*3600 + MINUTE*60 + SECOND` — and comparing with 34,200 (09:30:00) makes the strict boundary obvious: exactly 09:30:00 is not greater, 09:30:01 is. Formatting the time as `HH:MM:SS` text and comparing with `'09:30:00'` works too, because fixed-width times sort as text.",
      "",
      "Grouping the late rows by `emp_id` and counting gives `late_days`; employees with no late day simply form no group (the alternative counts conditionally and removes zero groups with `HAVING`). The order is fixed by the statement, with `emp_id` breaking ties. One pass over the month's punches.",
    ].join("\n"),
  },

  {
    slug: "earned-leave-lapsing-above-carry-forward-cap",
    title: "Earned Leave Lapsing Above the Carry-Forward Cap",
    difficulty: "EASY",
    topics: ["Basics"],
    description: [
      "Company policy lets employees carry at most **30 days of earned leave** into the next year; anything above that lapses on 31 December. Casual and sick leave never carry forward and are not part of this report.",
      "",
      "For the **2024** earned-leave balances, return every employee whose closing balance (`entitled - availed`) is **more than 30**, with the columns `emp_id`, `closing_balance` and `lapsing_days` (the closing balance minus 30). A balance of exactly 30 loses nothing and is not listed. Order the rows by `lapsing_days` descending, then `emp_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "LeaveBalance",
        columns: [
          { name: "emp_id", type: "int" },
          { name: "leave_type", type: "enum", values: ["earned", "casual", "sick"] },
          { name: "leave_year", type: "int" },
          { name: "entitled", type: "int" },
          { name: "availed", type: "int" },
        ],
        primaryKey: ["emp_id", "leave_type", "leave_year"],
        note: "One row per employee, leave type and calendar year. `entitled` already includes the days carried in from the year before.",
      },
    ],
    examples: [
      {
        LeaveBalance: [
          [301, "earned", 2024, 48, 12],
          [301, "casual", 2024, 12, 4],
          [302, "earned", 2024, 40, 10],
          [303, "earned", 2024, 52, 16],
          [303, "earned", 2023, 45, 5],
          [304, "sick", 2024, 45, 0],
          [305, "earned", 2024, 44, 8],
          [306, "earned", 2024, 18, 18],
        ],
      },
    ],
    gen: (rng) => {
      const emps = seq(301, ri(rng, 1, 10));
      const rows: Cell[][] = [];
      for (const e of emps) {
        for (const year of [2023, 2024]) {
          for (const type of ["earned", "casual", "sick"] as const) {
            if (!chance(rng, type === "earned" && year === 2024 ? 0.9 : 0.35)) continue;
            const entitled = type === "earned" ? ri(rng, 18, 54) : ri(rng, 6, 40);
            const availed = chance(rng, 0.15) ? entitled - 30 : ri(rng, 0, Math.min(entitled, 24));
            rows.push([e, type, year, entitled, Math.max(0, availed)]);
          }
        }
      }
      return { LeaveBalance: rows };
    },
    solution: [
      "SELECT emp_id, entitled - availed AS closing_balance, entitled - availed - 30 AS lapsing_days",
      "FROM LeaveBalance",
      "WHERE leave_type = 'earned' AND leave_year = 2024 AND entitled - availed > 30",
      "ORDER BY lapsing_days DESC, emp_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT emp_id, closing_balance, closing_balance - 30 AS lapsing_days",
        "FROM (SELECT emp_id, entitled - availed AS closing_balance FROM LeaveBalance WHERE leave_type = 'earned' AND leave_year = 2024) b",
        "WHERE closing_balance > 30",
        "ORDER BY closing_balance DESC, emp_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Only one leave type and one year are in scope — filter those first.",
      "The closing balance is computed from two columns; you can filter on the expression directly.",
      "MySQL does not let `WHERE` see a column alias from the same `SELECT`; repeat the expression or use a derived table.",
    ],
    editorial: [
      "A filter with arithmetic. Keep the rows for `leave_type = 'earned'` in `leave_year = 2024`, compute the closing balance as `entitled - availed`, and keep it only when it is **strictly** above the cap of 30 — a balance of exactly 30 carries over in full.",
      "",
      "The lapsing days are the closing balance minus 30. One detail trips people up: a `WHERE` clause is evaluated before the `SELECT` list, so it cannot refer to the alias `closing_balance`. Either repeat the expression in `WHERE` (the solution) or compute it in a derived table and filter outside, where the alias is a real column (the alternative).",
      "",
      "Ordering by `lapsing_days` descending is the same as ordering by the closing balance descending, since one is the other minus a constant; `emp_id` breaks ties. The primary key `(emp_id, leave_type, leave_year)` guarantees one row per employee for that type and year, so no aggregation is needed. A single scan.",
    ].join("\n"),
  },

  {
    slug: "referral-bonus-owed-to-each-employee",
    title: "Referral Bonus Owed to Each Employee",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "Employees earn a **₹25,000 referral bonus** for every candidate they referred who has **joined** the company. Referrals at any other stage — still interviewing, rejected, offer declined — earn nothing yet.",
      "",
      "Return every employee who has earned at least one bonus, with the columns `emp_id`, `full_name`, `joined_referrals` and `bonus_amount` (in rupees). Order the rows by `bonus_amount` descending, then `emp_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Employee",
        columns: [
          { name: "emp_id", type: "int" },
          { name: "full_name", type: "varchar" },
          { name: "department", type: "varchar" },
        ],
        primaryKey: ["emp_id"],
        note: "One row per current employee.",
      },
      {
        name: "Referral",
        columns: [
          { name: "referral_id", type: "int" },
          { name: "referrer_id", type: "int" },
          { name: "candidate_name", type: "varchar" },
          { name: "stage", type: "enum", values: ["applied", "interviewing", "offered", "joined", "rejected", "declined"] },
        ],
        primaryKey: ["referral_id"],
        note: "One row per candidate referred. `referrer_id` is the `emp_id` of the employee who referred them.",
      },
    ],
    examples: [
      {
        Employee: [
          [401, "Neha Verma", "Engineering"],
          [402, "Karan Singh", "Sales"],
          [403, "Simran Patel", "Engineering"],
          [404, "Dev Menon", "Finance"],
        ],
        Referral: [
          [1, 401, "Arun Kumar", "joined"],
          [2, 401, "Bhavna Shah", "joined"],
          [3, 402, "Chirag Jain", "rejected"],
          [4, 403, "Divya Pillai", "joined"],
          [5, 403, "Esha Kapoor", "declined"],
          [6, 404, "Gaurav Sinha", "interviewing"],
          [7, 402, "Hema Rao", "joined"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const who = fullNames(rng, n);
      const ids = seq(401, n);
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 20);
      return {
        Employee: ids.map((id, i) => [id, who[i]!, pick(rng, DEPARTMENTS)]),
        Referral: seq(1, m).map((rid) => [
          rid,
          pick(rng, ids),
          `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`,
          pick(rng, ["applied", "interviewing", "offered", "joined", "joined", "joined", "rejected", "declined"]),
        ]),
      };
    },
    solution: [
      "SELECT e.emp_id, e.full_name, COUNT(*) AS joined_referrals, COUNT(*) * 25000 AS bonus_amount",
      "FROM Employee e",
      "JOIN Referral r ON r.referrer_id = e.emp_id",
      "WHERE r.stage = 'joined'",
      "GROUP BY e.emp_id, e.full_name",
      "ORDER BY bonus_amount DESC, e.emp_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT e.emp_id, e.full_name, j.joined_referrals, j.joined_referrals * 25000 AS bonus_amount",
        "FROM Employee e",
        "JOIN (SELECT referrer_id, COUNT(*) AS joined_referrals FROM Referral WHERE stage = 'joined' GROUP BY referrer_id) j ON j.referrer_id = e.emp_id",
        "ORDER BY j.joined_referrals DESC, e.emp_id",
      ].join("\n"),
      [
        "SELECT e.emp_id, e.full_name, SUM(CASE WHEN r.stage = 'joined' THEN 1 ELSE 0 END) AS joined_referrals,",
        "       SUM(CASE WHEN r.stage = 'joined' THEN 25000 ELSE 0 END) AS bonus_amount",
        "FROM Employee e JOIN Referral r ON r.referrer_id = e.emp_id",
        "GROUP BY e.emp_id, e.full_name",
        "HAVING joined_referrals > 0",
        "ORDER BY bonus_amount DESC, e.emp_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Only referrals at the `joined` stage pay — filter those before counting.",
      "Join the referrals to the employees to get the name, then group per employee.",
      "The bonus is the count times a fixed amount.",
    ],
    editorial: [
      "Join, filter, group. Each referral row is linked to its referrer through `r.referrer_id = e.emp_id`; keeping only `stage = 'joined'` leaves the referrals that pay. Grouping by employee and counting gives `joined_referrals`, and the bonus is that count times ₹25,000.",
      "",
      "Because the filter runs before the grouping, an employee whose referrals are all at other stages forms no group and is left out — exactly the \"at least one bonus\" rule. The inner join also leaves out employees who referred nobody. Grouping by both `emp_id` and `full_name` keeps the query valid under MySQL's `ONLY_FULL_GROUP_BY`.",
      "",
      "You can also aggregate the referrals first in a derived table (one row per referrer) and join that to the employees, which keeps the join small; or count conditionally with `SUM(CASE …)` and drop zero rows with `HAVING`. The statement fixes the order: the biggest bonus first, `emp_id` breaking ties. Cost: one pass over the referrals plus a key lookup per group.",
    ].join("\n"),
  },

  {
    slug: "work-anniversaries-in-october-2025",
    title: "Work Anniversaries Coming Up in October 2025",
    difficulty: "EASY",
    topics: ["Dates", "Basics"],
    description: [
      "The people team sends a card on every work anniversary. For **October 2025**, list the current employees (`exit_date` is NULL) who joined in **October of an earlier year** — someone who joined in October 2025 has no anniversary yet.",
      "",
      "Return `emp_id`, `full_name`, `anniversary_date` (the date in 2025 that falls on their joining day, as `YYYY-MM-DD`) and `years_completed` (2025 minus the joining year). Order the rows by `anniversary_date`, then `emp_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Employee",
        columns: [
          { name: "emp_id", type: "int" },
          { name: "full_name", type: "varchar" },
          { name: "joined_on", type: "date" },
          { name: "exit_date", type: "date" },
        ],
        primaryKey: ["emp_id"],
        note: "`exit_date` is the last working day of someone who has left, or NULL for a current employee.",
      },
    ],
    examples: [
      {
        Employee: [
          [501, "Aditi Sharma", "2019-10-14", null],
          [502, "Rahul Nair", "2022-10-03", null],
          [503, "Sneha Patel", "2021-10-14", "2024-06-30"],
          [504, "Liam Das", "2025-10-06", null],
          [505, "Riya Joshi", "2023-09-30", null],
          [506, "Nikhil Rao", "2024-10-14", null],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.04) ? 0 : ri(rng, 1, 16);
      const who = fullNames(rng, Math.max(n, 1));
      return {
        Employee: seq(501, n).map((id, i) => {
          const year = ri(rng, 2015, 2025);
          const day = String(chance(rng, 0.2) ? 14 : ri(rng, 1, 31)).padStart(2, "0");
          const joined = chance(rng, 0.6) ? `${year}-10-${day}` : dateBetween(rng, `${year}-01-01`, `${year}-12-31`);
          return [id, who[i]!, joined, chance(rng, 0.2) ? dateBetween(rng, "2024-01-01", "2025-09-30") : null];
        }),
      };
    },
    solution: [
      "SELECT emp_id, full_name,",
      "       DATE_FORMAT(DATE_ADD(joined_on, INTERVAL 2025 - YEAR(joined_on) YEAR), '%Y-%m-%d') AS anniversary_date,",
      "       2025 - YEAR(joined_on) AS years_completed",
      "FROM Employee",
      "WHERE exit_date IS NULL AND MONTH(joined_on) = 10 AND YEAR(joined_on) < 2025",
      "ORDER BY anniversary_date, emp_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT emp_id, full_name, CONCAT('2025-', DATE_FORMAT(joined_on, '%m-%d')) AS anniversary_date,",
        "       YEAR('2025-10-01') - YEAR(joined_on) AS years_completed",
        "FROM Employee",
        "WHERE exit_date IS NULL AND DATE_FORMAT(joined_on, '%m') = '10' AND joined_on < '2025-01-01'",
        "ORDER BY DAY(joined_on), emp_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Three conditions: still employed, joined in October, joined before 2025.",
      "`MONTH(d)` and `YEAR(d)` pull the parts out of a date.",
      "The anniversary is the joining date moved forward by the number of whole years completed.",
    ],
    editorial: [
      "Filter on the parts of the joining date. `exit_date IS NULL` keeps current employees; `MONTH(joined_on) = 10` keeps October joiners; `YEAR(joined_on) < 2025` drops this October's new joiners, who have nothing to celebrate yet.",
      "",
      "The years completed are `2025 - YEAR(joined_on)`. The anniversary date can be computed by moving the joining date forward that many years with `DATE_ADD(joined_on, INTERVAL n YEAR)` — formatted with `DATE_FORMAT(…, '%Y-%m-%d')` so the column is the plain text date the statement asks for — or assembled directly as `CONCAT('2025-', DATE_FORMAT(joined_on, '%m-%d'))`. October has no 29 February problem, so both agree.",
      "",
      "Because every anniversary is in October 2025, ordering by the anniversary date is ordering by the day of the month, which is how the alternative sorts; `emp_id` breaks ties between people who joined on the same day of different years. A single scan; date-part functions cannot use an index on `joined_on`, which is fine at HR-table sizes.",
    ].join("\n"),
  },

  {
    slug: "salary-hike-at-the-april-2025-appraisal",
    title: "Salary Hike Percentage at the April 2025 Appraisal",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Subqueries"],
    description: [
      "Every salary change is a new row in `SalaryRevision`, effective from a date. The annual appraisal revisions all took effect on **2025-04-01**, and the compensation team wants the hike each person got.",
      "",
      "For every employee with a revision effective on `2025-04-01` **and** an earlier revision, return `emp_id`, `previous_ctc` (the CTC of the revision immediately before it), `new_ctc` and `hike_pct` = (new − previous) × 100 / previous, **rounded to 2 decimals**. Employees whose first ever revision is the April one (new joiners) are not listed; later revisions (say a July promotion) do not matter. Order the rows by `hike_pct` descending, then `emp_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "SalaryRevision",
        columns: [
          { name: "emp_id", type: "int" },
          { name: "effective_from", type: "date" },
          { name: "annual_ctc", type: "int" },
          { name: "reason", type: "enum", values: ["joining", "appraisal", "promotion", "correction"] },
        ],
        primaryKey: ["emp_id", "effective_from"],
        note: "One row per salary change. `annual_ctc` is the cost to company in rupees per year from `effective_from` until the next revision.",
      },
    ],
    examples: [
      {
        SalaryRevision: [
          [601, "2023-06-12", 800000, "joining"],
          [601, "2024-04-01", 880000, "appraisal"],
          [601, "2025-04-01", 968000, "appraisal"],
          [602, "2024-01-08", 1200000, "joining"],
          [602, "2025-04-01", 1200000, "appraisal"],
          [603, "2025-04-01", 650000, "joining"],
          [604, "2022-09-01", 1500000, "joining"],
          [604, "2025-04-01", 1725000, "appraisal"],
          [604, "2025-07-01", 2000000, "promotion"],
          [605, "2024-11-04", 900000, "joining"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const e of seq(601, ri(rng, 1, 9))) {
        let ctc = roundTo(rng, 400000, 3000000, 100000);
        const history = sample(rng, ["2022-04-01", "2023-04-01", "2024-04-01", "2023-08-14", "2024-10-01"], ri(rng, 0, 3)).sort();
        for (const d of history) {
          rows.push([e, d, ctc, d === history[0] ? "joining" : pick(rng, ["appraisal", "promotion"])]);
          ctc += roundTo(rng, 0, 300000, 100000);
        }
        if (chance(rng, 0.8)) {
          const pct = pick(rng, [0, 4, 5, 7.5, 8, 10, 12, 15, 20]);
          const aprCtc = history.length ? (rows[rows.length - 1]![2] as number) * (100 + pct) / 100 : ctc;
          rows.push([e, "2025-04-01", aprCtc, history.length ? "appraisal" : "joining"]);
          if (chance(rng, 0.3)) rows.push([e, "2025-07-01", aprCtc + 200000, "promotion"]);
        }
      }
      return { SalaryRevision: rows };
    },
    solution: [
      "SELECT emp_id, previous_ctc, annual_ctc AS new_ctc,",
      "       ROUND((annual_ctc - previous_ctc) * 100 / previous_ctc, 2) AS hike_pct",
      "FROM (",
      "  SELECT emp_id, effective_from, annual_ctc,",
      "         LAG(annual_ctc) OVER (PARTITION BY emp_id ORDER BY effective_from) AS previous_ctc",
      "  FROM SalaryRevision",
      ") r",
      "WHERE effective_from = '2025-04-01' AND previous_ctc IS NOT NULL",
      "ORDER BY hike_pct DESC, emp_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.emp_id, p.annual_ctc AS previous_ctc, a.annual_ctc AS new_ctc,",
        "       ROUND((a.annual_ctc - p.annual_ctc) * 100 / p.annual_ctc, 2) AS hike_pct",
        "FROM SalaryRevision a",
        "JOIN SalaryRevision p ON p.emp_id = a.emp_id",
        " AND p.effective_from = (SELECT MAX(effective_from) FROM SalaryRevision x WHERE x.emp_id = a.emp_id AND x.effective_from < '2025-04-01')",
        "WHERE a.effective_from = '2025-04-01'",
        "ORDER BY hike_pct DESC, a.emp_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "For each April revision you need the row just before it for the same employee.",
      "`LAG(annual_ctc) OVER (PARTITION BY emp_id ORDER BY effective_from)` brings the previous revision's CTC onto each row.",
      "Filter to the April rows *after* computing LAG — filtering first would leave no previous row to look at.",
      "A new joiner's April row has no previous revision: LAG gives NULL there.",
    ],
    editorial: [
      "The hike compares two rows of one employee: the April 2025 revision and the revision immediately before it. `LAG(annual_ctc) OVER (PARTITION BY emp_id ORDER BY effective_from)` puts the previous CTC on every row, in one sort of the table.",
      "",
      "Order of operations matters. Window functions run after `WHERE`, so if you filtered to `effective_from = '2025-04-01'` in the same query, each employee would have one row and LAG would always be NULL. Compute LAG in a derived table first, then keep the April rows outside. A July promotion sits *after* April in the order, so it never becomes April's previous row.",
      "",
      "New joiners whose first revision is in April get a NULL `previous_ctc` and are dropped by `previous_ctc IS NOT NULL`. The percentage is `(new − previous) × 100 / previous`, rounded to 2 decimals so MySQL's decimal division and other engines agree.",
      "",
      "Without windows, find the previous revision's date with a correlated `MAX(effective_from) … < '2025-04-01'` and join back to read its CTC; the inner join drops employees with no earlier row by itself. That is one indexed lookup per April row.",
    ].join("\n"),
  },

  {
    slug: "employees-averaging-short-workdays",
    title: "Employees Averaging Less Than Eight Hours a Day",
    difficulty: "MEDIUM",
    topics: ["Dates", "Aggregation"],
    description: [
      "Each punch row is one working day: in and out on the same date. HR's attendance review looks at **May 2025** and flags people whose average day was **shorter than 8 hours** (480 minutes). A day without a `punch_out` cannot be measured and is ignored entirely.",
      "",
      "Return `emp_id`, `days_counted` (measured days in May) and `avg_minutes` (the average minutes between punch-in and punch-out, **rounded to a whole number**) for every employee whose unrounded average is **below 480**. Order the rows by `avg_minutes` ascending, then `emp_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Punch",
        columns: [
          { name: "punch_id", type: "int" },
          { name: "emp_id", type: "int" },
          { name: "punch_in", type: "datetime" },
          { name: "punch_out", type: "datetime" },
        ],
        primaryKey: ["punch_id"],
        note: "One row per employee per day they came in; `punch_out` is on the same date, or NULL when they forgot to punch out.",
      },
    ],
    examples: [
      {
        Punch: [
          [1, 21, "2025-05-05 09:30:00", "2025-05-05 17:00:00"],
          [2, 21, "2025-05-06 09:45:00", "2025-05-06 17:30:00"],
          [3, 21, "2025-05-07 10:00:00", null],
          [4, 22, "2025-05-05 09:00:00", "2025-05-05 18:00:00"],
          [5, 22, "2025-05-06 09:15:00", "2025-05-06 16:15:00"],
          [6, 23, "2025-05-05 09:20:00", "2025-05-05 17:20:00"],
          [7, 24, "2025-04-30 09:00:00", "2025-04-30 13:00:00"],
          [8, 24, "2025-05-02 08:50:00", "2025-05-02 16:10:00"],
          [9, 25, "2025-05-09 11:00:00", null],
        ],
      },
    ],
    gen: (rng) => {
      const emps = seq(21, ri(rng, 1, 7));
      const days = sample(rng, ["2025-04-29", "2025-04-30", "2025-05-01", "2025-05-02", "2025-05-05", "2025-05-06", "2025-05-15", "2025-05-30", "2025-06-02"], 6);
      const rows: Cell[][] = [];
      const pad = (x: number) => String(x).padStart(2, "0");
      for (const e of emps) {
        const typical = pick(rng, [420, 450, 480, 510]);
        for (const d of days) {
          if (!chance(rng, 0.55)) continue;
          const start = 8 * 60 + 30 + ri(rng, 0, 12) * 10;
          const len = chance(rng, 0.3) ? 480 : typical + ri(rng, -6, 6) * 10 + ri(rng, 0, 9);
          const end = Math.min(start + len, 23 * 60 + 59);
          const t = (m: number) => `${d} ${pad(Math.floor(m / 60))}:${pad(m % 60)}:00`;
          rows.push([rows.length + 1, e, t(start), chance(rng, 0.12) ? null : t(end)]);
        }
      }
      return { Punch: shuffle(rng, rows) };
    },
    solution: [
      "SELECT emp_id, COUNT(*) AS days_counted, ROUND(AVG(TIMESTAMPDIFF(MINUTE, punch_in, punch_out))) AS avg_minutes",
      "FROM Punch",
      "WHERE punch_out IS NOT NULL AND punch_in >= '2025-05-01' AND punch_in < '2025-06-01'",
      "GROUP BY emp_id",
      "HAVING AVG(TIMESTAMPDIFF(MINUTE, punch_in, punch_out)) < 480",
      "ORDER BY avg_minutes, emp_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT emp_id, days_counted, ROUND(total_minutes / days_counted) AS avg_minutes",
        "FROM (",
        "  SELECT emp_id, COUNT(punch_out) AS days_counted,",
        "         SUM((HOUR(punch_out) - HOUR(punch_in)) * 60 + MINUTE(punch_out) - MINUTE(punch_in)) AS total_minutes",
        "  FROM Punch",
        "  WHERE YEAR(punch_in) = 2025 AND MONTH(punch_in) = 5",
        "  GROUP BY emp_id",
        ") t",
        "WHERE days_counted > 0 AND total_minutes < 480 * days_counted",
        "ORDER BY avg_minutes, emp_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Leave out the unmeasurable days first: `punch_out IS NULL` rows must not count as days either.",
      "`TIMESTAMPDIFF(MINUTE, punch_in, punch_out)` is the length of a day in minutes.",
      "A condition on an average belongs in `HAVING`; compare the unrounded average, round only for display.",
    ],
    editorial: [
      "Measure each day, then average per employee.",
      "",
      "A day with no `punch_out` has no length, and the statement says to ignore it — not to count it as zero. Filtering `punch_out IS NOT NULL` in `WHERE` removes it from both the count and the average. (`AVG` would skip a NULL difference anyway, but `COUNT(*)` would not, so the filter keeps both honest.) The month is bounded with a half-open range on `punch_in`.",
      "",
      "`TIMESTAMPDIFF(MINUTE, punch_in, punch_out)` gives each day's minutes; `AVG` of it per `emp_id` is the average day. The threshold is a condition on a group, so it goes in `HAVING`, and it uses the **unrounded** average — an average of 479.6 minutes is short even though it rounds to 480. The displayed `avg_minutes` is rounded to a whole number, which keeps every engine's decimals out of the answer.",
      "",
      "The alternative adds the minutes up from the hour and minute parts (punch in and out are on the same date) and compares `total < 480 × days`, which avoids division in the test altogether. One pass over the month's punches.",
    ].join("\n"),
  },

  {
    slug: "appraisal-rating-mix-by-department",
    title: "Appraisal Rating Mix by Department",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Joins", "Aggregation"],
    description: [
      "After the **FY2024-25** appraisal cycle, HR checks how ratings (1 to 5) were spread in each department. Ratings 4 and 5 are **exceeds**, 3 is **meets**, 1 and 2 are **below**. A NULL rating means the manager has not submitted it yet; it is left out of every count. Ratings from other cycles do not matter.",
      "",
      "Return one row per department with at least one submitted FY2024-25 rating: `department`, `exceeds`, `meets`, `below`, and `exceeds_pct` = exceeds × 100 / (exceeds + meets + below), **rounded to 2 decimals**. Order by `exceeds_pct` descending, then `department` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Employee",
        columns: [
          { name: "emp_id", type: "int" },
          { name: "full_name", type: "varchar" },
          { name: "department", type: "varchar" },
        ],
        primaryKey: ["emp_id"],
      },
      {
        name: "Appraisal",
        columns: [
          { name: "emp_id", type: "int" },
          { name: "cycle", type: "varchar" },
          { name: "rating", type: "int" },
        ],
        primaryKey: ["emp_id", "cycle"],
        note: "One row per employee per appraisal cycle (`'FY2023-24'`, `'FY2024-25'`, …). `rating` is 1–5, or NULL until the manager submits it.",
      },
    ],
    examples: [
      {
        Employee: [
          [1, "Aarav Sharma", "Engineering"],
          [2, "Diya Iyer", "Engineering"],
          [3, "Ishaan Gupta", "Engineering"],
          [4, "Kavya Nair", "Sales"],
          [5, "Rohan Das", "Sales"],
          [6, "Meera Rao", "Finance"],
          [7, "Zara Khan", "Legal"],
        ],
        Appraisal: [
          [1, "FY2024-25", 5],
          [2, "FY2024-25", 3],
          [3, "FY2024-25", 4],
          [3, "FY2023-24", 2],
          [4, "FY2024-25", 2],
          [5, "FY2024-25", 4],
          [6, "FY2024-25", null],
          [7, "FY2024-25", 1],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 22);
      const depts = sample(rng, DEPARTMENTS, ri(rng, 1, 4));
      const who = fullNames(rng, n);
      const emps = seq(1, n).map((id, i) => [id, who[i]!, pick(rng, depts)]);
      const appr: Cell[][] = [];
      for (const [id] of emps) {
        if (chance(rng, 0.85)) appr.push([id!, "FY2024-25", chance(rng, 0.12) ? null : ri(rng, 1, 5)]);
        if (chance(rng, 0.4)) appr.push([id!, "FY2023-24", ri(rng, 1, 5)]);
      }
      return { Employee: emps, Appraisal: appr };
    },
    solution: [
      "SELECT e.department,",
      "       SUM(CASE WHEN a.rating >= 4 THEN 1 ELSE 0 END) AS exceeds,",
      "       SUM(CASE WHEN a.rating = 3 THEN 1 ELSE 0 END) AS meets,",
      "       SUM(CASE WHEN a.rating <= 2 THEN 1 ELSE 0 END) AS below,",
      "       ROUND(SUM(CASE WHEN a.rating >= 4 THEN 1 ELSE 0 END) * 100 / COUNT(*), 2) AS exceeds_pct",
      "FROM Appraisal a",
      "JOIN Employee e ON e.emp_id = a.emp_id",
      "WHERE a.cycle = 'FY2024-25' AND a.rating IS NOT NULL",
      "GROUP BY e.department",
      "ORDER BY exceeds_pct DESC, e.department",
    ].join("\n"),
    alternatives: [
      [
        "SELECT department, exceeds, meets, below, ROUND(exceeds * 100 / (exceeds + meets + below), 2) AS exceeds_pct",
        "FROM (",
        "  SELECT e.department, COUNT(CASE WHEN a.rating IN (4, 5) THEN 1 END) AS exceeds,",
        "         COUNT(CASE WHEN a.rating = 3 THEN 1 END) AS meets, COUNT(CASE WHEN a.rating IN (1, 2) THEN 1 END) AS below",
        "  FROM Employee e JOIN Appraisal a ON a.emp_id = e.emp_id AND a.cycle = 'FY2024-25'",
        "  GROUP BY e.department",
        ") t",
        "WHERE exceeds + meets + below > 0",
        "ORDER BY exceeds_pct DESC, department",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Join each appraisal to its employee to know the department, and keep only this cycle's submitted ratings.",
      "Three buckets, one group: count each with `SUM(CASE WHEN … THEN 1 ELSE 0 END)`.",
      "Once NULL ratings are filtered out, the denominator is simply the number of rows in the group.",
    ],
    editorial: [
      "Conditional aggregation over a join. Each `Appraisal` row is joined to `Employee` for its department; the `WHERE` keeps this cycle and drops unsubmitted (NULL) ratings, so the rows left are exactly the ratings that count.",
      "",
      "Grouping by department, three `SUM(CASE …)` expressions sort each rating into its bucket. Because NULLs are already gone, `COUNT(*)` equals exceeds + meets + below, and the share is `exceeds × 100 / COUNT(*)`, rounded to 2 decimals. A department whose only rating is NULL has no rows left and forms no group — that is the \"at least one submitted rating\" rule, with no division by zero to guard.",
      "",
      "If you keep the NULLs in the join (as the alternative does), `rating >= 4` and the other tests are simply unknown for them, so the bucket counts still ignore them; but then the denominator must be the sum of the buckets, and empty departments must be filtered out afterwards. Order by the share, highest first, with the department name breaking ties. One pass plus the join.",
    ].join("\n"),
  },

  {
    slug: "hiring-funnel-for-each-requisition",
    title: "Hiring Funnel for Each Open Requisition",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Joins"],
    description: [
      "The applicant-tracking system stores, for each application, the **furthest stage** the candidate reached: `applied` → `screened` → `interviewed` → `offered` → `joined`. A candidate who reached a stage also passed every stage before it.",
      "",
      "Return one row for **every requisition**, including those with no applications, with `req_id`, `role_title`, `applied` (all applications), `interviewed` (reached `interviewed` or beyond), `offered` (reached `offered` or beyond), `joined`, and `acceptance_pct` = joined × 100 / offered **rounded to 2 decimals** — NULL when nobody was offered. Counts are 0, not NULL, for an empty requisition. Order by `req_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Requisition",
        columns: [
          { name: "req_id", type: "int" },
          { name: "role_title", type: "varchar" },
          { name: "department", type: "varchar" },
          { name: "opened_on", type: "date" },
        ],
        primaryKey: ["req_id"],
        note: "One row per approved opening the recruiters are hiring for.",
      },
      {
        name: "Application",
        columns: [
          { name: "app_id", type: "int" },
          { name: "req_id", type: "int" },
          { name: "candidate_id", type: "int" },
          { name: "furthest_stage", type: "enum", values: ["applied", "screened", "interviewed", "offered", "joined"] },
        ],
        primaryKey: ["app_id"],
        note: "One row per candidate per requisition; `furthest_stage` is the last stage they reached, whether or not they are still in process.",
      },
    ],
    examples: [
      {
        Requisition: [
          [71, "Backend Engineer", "Engineering", "2025-01-06"],
          [72, "Inside Sales Executive", "Sales", "2025-01-13"],
          [73, "Payroll Analyst", "Finance", "2025-02-03"],
          [74, "Legal Counsel", "Legal", "2025-02-10"],
        ],
        Application: [
          [1, 71, 9001, "applied"],
          [2, 71, 9002, "interviewed"],
          [3, 71, 9003, "offered"],
          [4, 71, 9004, "joined"],
          [5, 72, 9005, "screened"],
          [6, 72, 9006, "offered"],
          [7, 72, 9007, "offered"],
          [8, 72, 9008, "joined"],
          [9, 73, 9009, "interviewed"],
        ],
      },
    ],
    gen: (rng) => {
      const reqs = seq(71, ri(rng, 1, 6));
      const titles = ["Backend Engineer", "Inside Sales Executive", "Payroll Analyst", "Legal Counsel", "UX Designer", "Support Lead", "Data Analyst", "HR Business Partner"];
      const stages = ["applied", "applied", "screened", "interviewed", "offered", "joined"];
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 26);
      return {
        Requisition: reqs.map((r) => [r, pick(rng, titles), pick(rng, DEPARTMENTS), dateBetween(rng, "2025-01-01", "2025-03-31")]),
        Application: seq(1, m).map((id) => [id, pick(rng, reqs), 9000 + id, pick(rng, stages)]),
      };
    },
    solution: [
      "SELECT r.req_id, r.role_title,",
      "       COUNT(a.app_id) AS applied,",
      "       SUM(CASE WHEN a.furthest_stage IN ('interviewed', 'offered', 'joined') THEN 1 ELSE 0 END) AS interviewed,",
      "       SUM(CASE WHEN a.furthest_stage IN ('offered', 'joined') THEN 1 ELSE 0 END) AS offered,",
      "       SUM(CASE WHEN a.furthest_stage = 'joined' THEN 1 ELSE 0 END) AS joined,",
      "       ROUND(SUM(CASE WHEN a.furthest_stage = 'joined' THEN 1 ELSE 0 END) * 100",
      "             / NULLIF(SUM(CASE WHEN a.furthest_stage IN ('offered', 'joined') THEN 1 ELSE 0 END), 0), 2) AS acceptance_pct",
      "FROM Requisition r",
      "LEFT JOIN Application a ON a.req_id = r.req_id",
      "GROUP BY r.req_id, r.role_title",
      "ORDER BY r.req_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT req_id, role_title, applied, interviewed, offered, joined,",
        "       CASE WHEN offered = 0 THEN NULL ELSE ROUND(joined * 100 / offered, 2) END AS acceptance_pct",
        "FROM (",
        "  SELECT r.req_id, r.role_title, COUNT(a.app_id) AS applied,",
        "         COUNT(CASE WHEN s.lvl >= 3 THEN 1 END) AS interviewed,",
        "         COUNT(CASE WHEN s.lvl >= 4 THEN 1 END) AS offered,",
        "         COUNT(CASE WHEN s.lvl = 5 THEN 1 END) AS joined",
        "  FROM Requisition r",
        "  LEFT JOIN (SELECT app_id, req_id, CASE furthest_stage WHEN 'applied' THEN 1 WHEN 'screened' THEN 2",
        "             WHEN 'interviewed' THEN 3 WHEN 'offered' THEN 4 ELSE 5 END AS lvl FROM Application) s ON s.req_id = r.req_id",
        "  LEFT JOIN Application a ON a.app_id = s.app_id",
        "  GROUP BY r.req_id, r.role_title",
        ") t",
        "ORDER BY req_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Every requisition must appear, so start from `Requisition` and LEFT JOIN the applications.",
      "\"Reached interviewed or beyond\" is a set of stages — or a stage number compared with `>=`.",
      "On an empty requisition, `COUNT(*)` counts the NULL-extended row; count a column of the application instead.",
      "Guard the division with `NULLIF(offered, 0)` so a requisition with no offers gives NULL.",
    ],
    editorial: [
      "A funnel is cumulative: a candidate whose furthest stage is `joined` was also interviewed and offered. So each funnel column counts the applications whose stage is **at or beyond** a point — `IN ('offered', 'joined')` for offered, and so on — or, cleaner for longer funnels, map each stage to a number (1–5) and compare with `>=`.",
      "",
      "Every requisition is in the answer, so the query starts at `Requisition` and LEFT JOINs `Application`. A requisition with no applications produces one row of NULLs: `COUNT(a.app_id)` gives 0 for it where `COUNT(*)` would give 1, and each `SUM(CASE … ELSE 0 END)` gives 0 because the CASE falls to ELSE on NULL.",
      "",
      "The acceptance rate divides joined by offered. When nobody was offered that would be a division by zero; `NULLIF(offered, 0)` turns the divisor into NULL and the whole expression into NULL, which is what the statement asks for (MySQL would give NULL anyway, but other engines raise an error, so say it explicitly). Round to 2 decimals. One pass over the applications grouped by requisition.",
    ].join("\n"),
  },

  {
    slug: "days-to-fill-requisitions-by-department",
    title: "Average Days to Fill a Requisition by Department",
    difficulty: "MEDIUM",
    topics: ["Dates", "Joins", "Aggregation"],
    description: [
      "Talent acquisition measures **time to fill**: the days from the date a requisition was opened to the date of its **first accepted offer**. Offers that were never accepted (`accepted_on` NULL) do not fill anything; a requisition without an accepted offer is not filled and is left out.",
      "",
      "Return one row per department with at least one filled requisition: `department`, `filled` (the number of filled requisitions), `avg_days` (the average time to fill, **rounded to 1 decimal**) and `max_days`. Order by `avg_days` descending, then `department` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Requisition",
        columns: [
          { name: "req_id", type: "int" },
          { name: "department", type: "varchar" },
          { name: "opened_on", type: "date" },
        ],
        primaryKey: ["req_id"],
      },
      {
        name: "Offer",
        columns: [
          { name: "offer_id", type: "int" },
          { name: "req_id", type: "int" },
          { name: "candidate_id", type: "int" },
          { name: "offered_on", type: "date" },
          { name: "accepted_on", type: "date" },
        ],
        primaryKey: ["offer_id"],
        note: "A requisition can have several offers (a declined one, then another). `accepted_on` is NULL for an offer that was declined or is still pending.",
      },
    ],
    examples: [
      {
        Requisition: [
          [81, "Engineering", "2025-01-06"],
          [82, "Engineering", "2025-01-20"],
          [83, "Sales", "2025-02-03"],
          [84, "Sales", "2025-02-10"],
          [85, "Finance", "2025-02-17"],
        ],
        Offer: [
          [1, 81, 7001, "2025-02-10", null],
          [2, 81, 7002, "2025-02-24", "2025-02-27"],
          [3, 82, 7003, "2025-02-14", "2025-02-19"],
          [4, 83, 7004, "2025-02-20", "2025-02-21"],
          [5, 83, 7005, "2025-03-03", "2025-03-04"],
          [6, 84, 7006, "2025-03-10", null],
          [7, 85, 7007, "2025-03-05", "2025-03-14"],
        ],
      },
    ],
    gen: (rng) => {
      const reqs = seq(81, ri(rng, 1, 9));
      const depts = sample(rng, DEPARTMENTS, ri(rng, 1, 4));
      const reqRows = reqs.map((r) => [r, pick(rng, depts), dateBetween(rng, "2025-01-01", "2025-03-31")]);
      const offers: Cell[][] = [];
      for (const [r, , opened] of reqRows) {
        for (let k = ri(rng, 0, 3); k > 0; k--) {
          const offered = addDays(opened as string, ri(rng, 10, 70));
          offers.push([offers.length + 1, r!, 7001 + offers.length, offered, chance(rng, 0.6) ? addDays(offered, ri(rng, 0, 9)) : null]);
        }
      }
      return { Requisition: reqRows, Offer: offers };
    },
    solution: [
      "SELECT r.department, COUNT(*) AS filled,",
      "       ROUND(AVG(DATEDIFF(f.first_accept, r.opened_on)), 1) AS avg_days,",
      "       MAX(DATEDIFF(f.first_accept, r.opened_on)) AS max_days",
      "FROM Requisition r",
      "JOIN (SELECT req_id, MIN(accepted_on) AS first_accept FROM Offer WHERE accepted_on IS NOT NULL GROUP BY req_id) f",
      "  ON f.req_id = r.req_id",
      "GROUP BY r.department",
      "ORDER BY avg_days DESC, r.department",
    ].join("\n"),
    alternatives: [
      [
        "WITH filled AS (",
        "  SELECT r.req_id, r.department,",
        "         DATEDIFF((SELECT MIN(o.accepted_on) FROM Offer o WHERE o.req_id = r.req_id), r.opened_on) AS days",
        "  FROM Requisition r",
        ")",
        "SELECT department, COUNT(days) AS filled, ROUND(AVG(days), 1) AS avg_days, MAX(days) AS max_days",
        "FROM filled",
        "WHERE days IS NOT NULL",
        "GROUP BY department",
        "ORDER BY avg_days DESC, department",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First reduce the offers to one date per requisition: its earliest acceptance.",
      "`MIN` ignores NULLs, so declined offers drop out of `MIN(accepted_on)` by themselves.",
      "Join that to the requisitions, compute `DATEDIFF`, then aggregate by department.",
    ],
    editorial: [
      "Two levels of aggregation. First, per requisition, the fill date is `MIN(accepted_on)` over its offers — NULLs (declined or pending offers) are ignored by `MIN`, and a requisition whose offers are all unaccepted has no row once we filter `accepted_on IS NOT NULL`. Doing this before the department step matters: joining every offer straight to the requisition and averaging would count a requisition once per offer.",
      "",
      "Then join the per-requisition fill dates to `Requisition`, take `DATEDIFF(first_accept, opened_on)` and aggregate by department: `COUNT(*)` filled requisitions, `AVG` rounded to 1 decimal, and `MAX`. The inner join is what drops unfilled requisitions, and departments with none filled disappear with them.",
      "",
      "The alternative computes the fill date with a correlated scalar subquery per requisition (NULL when none accepted) and filters the NULLs before grouping. Both are one pass over offers plus one over requisitions with an index on `Offer.req_id`.",
    ].join("\n"),
  },

  {
    slug: "high-performers-due-for-promotion-review",
    title: "High Performers Due for a Promotion Review",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Dates"],
    description: [
      "On **2025-07-01** HR runs its promotion review. A current employee (`exit_date` NULL) is **due** when they have spent **at least three years** in their current role — their latest promotion, or their joining date if they were never promoted, is **on or before `2022-07-01`** — **and** their `FY2024-25` rating is 4 or 5. A missing or NULL rating is not 4 or 5.",
      "",
      "Return `emp_id`, `full_name` and `in_role_since` (the latest promotion date, or the joining date) for every employee who is due. Order by `in_role_since`, then `emp_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Employee",
        columns: [
          { name: "emp_id", type: "int" },
          { name: "full_name", type: "varchar" },
          { name: "joined_on", type: "date" },
          { name: "exit_date", type: "date" },
        ],
        primaryKey: ["emp_id"],
        note: "`exit_date` is NULL for a current employee.",
      },
      {
        name: "Promotion",
        columns: [
          { name: "emp_id", type: "int" },
          { name: "promoted_on", type: "date" },
          { name: "new_grade", type: "varchar" },
        ],
        primaryKey: ["emp_id", "promoted_on"],
        note: "One row per promotion an employee received.",
      },
      {
        name: "Appraisal",
        columns: [
          { name: "emp_id", type: "int" },
          { name: "cycle", type: "varchar" },
          { name: "rating", type: "int" },
        ],
        primaryKey: ["emp_id", "cycle"],
        note: "`rating` is 1–5, or NULL until the manager submits it.",
      },
    ],
    examples: [
      {
        Employee: [
          [1, "Aarav Sharma", "2018-03-12", null],
          [2, "Diya Iyer", "2021-06-01", null],
          [3, "Ishaan Gupta", "2019-08-19", null],
          [4, "Kavya Nair", "2020-01-06", "2025-03-31"],
          [5, "Rohan Das", "2022-07-01", null],
          [6, "Meera Rao", "2017-11-20", null],
        ],
        Promotion: [
          [1, "2021-04-01", "L3"],
          [3, "2021-04-01", "L3"],
          [3, "2023-04-01", "L4"],
          [6, "2020-04-01", "L4"],
        ],
        Appraisal: [
          [1, "FY2024-25", 4],
          [2, "FY2024-25", 5],
          [3, "FY2024-25", 5],
          [4, "FY2024-25", 5],
          [5, "FY2024-25", 4],
          [6, "FY2024-25", null],
          [6, "FY2023-24", 5],
        ],
      },
    ],
    gen: (rng) => {
      const ids = seq(1, ri(rng, 1, 12));
      const who = fullNames(rng, ids.length);
      const emps: Cell[][] = [];
      const promos: Cell[][] = [];
      const appr: Cell[][] = [];
      ids.forEach((id, i) => {
        const joined = chance(rng, 0.1) ? "2022-07-01" : dateBetween(rng, "2016-01-01", "2024-06-30");
        emps.push([id, who[i]!, joined, chance(rng, 0.15) ? "2025-03-31" : null]);
        for (const d of sample(rng, ["2020-04-01", "2021-04-01", "2022-04-01", "2022-07-01", "2023-04-01", "2024-04-01"], ri(rng, 0, 2))) {
          if (d > joined) promos.push([id, d, pick(rng, ["L2", "L3", "L4", "L5"])]);
        }
        if (chance(rng, 0.85)) appr.push([id, "FY2024-25", chance(rng, 0.1) ? null : ri(rng, 2, 5)]);
        if (chance(rng, 0.3)) appr.push([id, "FY2023-24", ri(rng, 3, 5)]);
      });
      return { Employee: emps, Promotion: promos, Appraisal: appr };
    },
    solution: [
      "SELECT emp_id, full_name, in_role_since",
      "FROM (",
      "  SELECT e.emp_id, e.full_name,",
      "         COALESCE((SELECT MAX(p.promoted_on) FROM Promotion p WHERE p.emp_id = e.emp_id), e.joined_on) AS in_role_since",
      "  FROM Employee e",
      "  WHERE e.exit_date IS NULL",
      "    AND EXISTS (SELECT 1 FROM Appraisal a WHERE a.emp_id = e.emp_id AND a.cycle = 'FY2024-25' AND a.rating >= 4)",
      ") t",
      "WHERE in_role_since <= '2022-07-01'",
      "ORDER BY in_role_since, emp_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT e.emp_id, e.full_name, COALESCE(MAX(p.promoted_on), e.joined_on) AS in_role_since",
        "FROM Employee e",
        "JOIN Appraisal a ON a.emp_id = e.emp_id AND a.cycle = 'FY2024-25' AND a.rating IN (4, 5)",
        "LEFT JOIN Promotion p ON p.emp_id = e.emp_id",
        "WHERE e.exit_date IS NULL",
        "GROUP BY e.emp_id, e.full_name, e.joined_on",
        "HAVING COALESCE(MAX(p.promoted_on), e.joined_on) <= DATE_SUB('2025-07-01', INTERVAL 3 YEAR)",
        "ORDER BY in_role_since, e.emp_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First work out each employee's \"in role since\" date: the latest promotion, falling back to the joining date.",
      "`COALESCE(MAX(promoted_on), joined_on)` does the fallback in one expression.",
      "Three years before 2025-07-01 is 2022-07-01, and \"at least three years\" includes that day.",
      "Check the rating with EXISTS (or an inner join) on this cycle only.",
    ],
    editorial: [
      "Each employee's time in role starts at their **latest promotion**, or at joining when there is none. A correlated `MAX(promoted_on)` returns NULL for someone never promoted, and `COALESCE(…, joined_on)` falls back to the joining date. Computing this in a derived table lets the outer query filter on it by name.",
      "",
      "The cut-off is three years before the review: `DATE_SUB('2025-07-01', INTERVAL 3 YEAR)` = 2022-07-01, and \"at least three years\" means `<=` — someone who joined or was promoted on exactly 2022-07-01 qualifies. The rating check is an `EXISTS` on this cycle's row with `rating >= 4`; a NULL rating fails the comparison and a missing row fails the EXISTS, so neither counts. A strong rating from an earlier cycle is irrelevant.",
      "",
      "The alternative does the same with joins: an inner join to the qualifying appraisal, a LEFT JOIN to promotions, `GROUP BY` per employee and the date test in `HAVING`. The appraisal key `(emp_id, cycle)` guarantees the inner join cannot multiply rows. Both are a couple of indexed lookups per employee.",
    ].join("\n"),
  },

  {
    slug: "performance-bonus-payout-for-fy2024-25",
    title: "Performance Bonus Payout for FY2024-25",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Joins"],
    description: [
      "The annual bonus is a share of `annual_ctc` decided by the `FY2024-25` rating: **5 → 20%, 4 → 12%, 3 → 8%**, anything lower → 0. Two more rules: an employee who **joined after 2024-10-01** (strictly after) is not eligible this year and gets 0, and an employee with no rating for the cycle (no row, or NULL) gets 0.",
      "",
      "Return **every employee** with `emp_id`, `rating` (NULL when there is none) and `bonus_amount` in rupees. Order by `emp_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Employee",
        columns: [
          { name: "emp_id", type: "int" },
          { name: "full_name", type: "varchar" },
          { name: "joined_on", type: "date" },
          { name: "annual_ctc", type: "int" },
        ],
        primaryKey: ["emp_id"],
        note: "`annual_ctc` is the current yearly cost to company in rupees.",
      },
      {
        name: "Appraisal",
        columns: [
          { name: "emp_id", type: "int" },
          { name: "cycle", type: "varchar" },
          { name: "rating", type: "int" },
        ],
        primaryKey: ["emp_id", "cycle"],
        note: "`rating` is 1–5, or NULL until the manager submits it.",
      },
    ],
    examples: [
      {
        Employee: [
          [1, "Aarav Sharma", "2021-05-10", 1800000],
          [2, "Diya Iyer", "2023-02-06", 1200000],
          [3, "Ishaan Gupta", "2024-10-01", 900000],
          [4, "Kavya Nair", "2024-11-18", 1000000],
          [5, "Rohan Das", "2022-08-01", 1500000],
          [6, "Meera Rao", "2020-03-02", 2400000],
        ],
        Appraisal: [
          [1, "FY2024-25", 5],
          [2, "FY2024-25", 3],
          [3, "FY2024-25", 4],
          [4, "FY2024-25", 5],
          [5, "FY2024-25", 2],
          [6, "FY2023-24", 5],
        ],
      },
    ],
    gen: (rng) => {
      const ids = seq(1, ri(rng, 1, 14));
      const who = fullNames(rng, ids.length);
      const emps = ids.map((id, i) => [
        id,
        who[i]!,
        chance(rng, 0.12) ? "2024-10-01" : chance(rng, 0.2) ? dateBetween(rng, "2024-10-02", "2025-03-01") : dateBetween(rng, "2018-01-01", "2024-09-30"),
        roundTo(rng, 500000, 4000000, 100000),
      ]);
      const appr: Cell[][] = [];
      for (const id of ids) {
        if (chance(rng, 0.85)) appr.push([id, "FY2024-25", chance(rng, 0.1) ? null : ri(rng, 1, 5)]);
        if (chance(rng, 0.3)) appr.push([id, "FY2023-24", ri(rng, 1, 5)]);
      }
      return { Employee: emps, Appraisal: appr };
    },
    solution: [
      "SELECT e.emp_id, a.rating,",
      "       CASE",
      "         WHEN e.joined_on > '2024-10-01' THEN 0",
      "         WHEN a.rating = 5 THEN e.annual_ctc * 20 / 100",
      "         WHEN a.rating = 4 THEN e.annual_ctc * 12 / 100",
      "         WHEN a.rating = 3 THEN e.annual_ctc * 8 / 100",
      "         ELSE 0",
      "       END AS bonus_amount",
      "FROM Employee e",
      "LEFT JOIN Appraisal a ON a.emp_id = e.emp_id AND a.cycle = 'FY2024-25'",
      "ORDER BY e.emp_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT e.emp_id,",
        "       (SELECT rating FROM Appraisal a WHERE a.emp_id = e.emp_id AND a.cycle = 'FY2024-25') AS rating,",
        "       IF(e.joined_on <= '2024-10-01',",
        "          e.annual_ctc * IFNULL((SELECT CASE rating WHEN 5 THEN 20 WHEN 4 THEN 12 WHEN 3 THEN 8 ELSE 0 END",
        "                                 FROM Appraisal a WHERE a.emp_id = e.emp_id AND a.cycle = 'FY2024-25'), 0) / 100,",
        "          0) AS bonus_amount",
        "FROM Employee e",
        "ORDER BY e.emp_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Every employee is in the answer, rated or not — LEFT JOIN this cycle's appraisal.",
      "Put the cycle condition in the `ON` clause; in `WHERE` it would drop the unrated employees.",
      "Check eligibility first in the CASE, then the rating bands; `ELSE 0` covers low ratings and NULLs.",
    ],
    editorial: [
      "One row per employee, a payout decided by rules — a LEFT JOIN plus a CASE.",
      "",
      "The LEFT JOIN to `Appraisal` must carry `a.cycle = 'FY2024-25'` in its `ON` clause. That way an employee with only an older appraisal, or none, still comes through once with `rating` NULL; moving the condition to `WHERE` would delete exactly those employees. The cycle in the key also guarantees at most one matching row, so nobody is duplicated.",
      "",
      "CASE branches are tried in order, so the eligibility rule goes first: `joined_on > '2024-10-01'` gives 0 whatever the rating (joining on 1 October itself is still eligible). Then the three bands, and `ELSE 0` for ratings 1–2 and for NULL — `NULL = 5` is unknown, so a NULL rating falls through every band to the ELSE.",
      "",
      "The alternative reads the rating with scalar subqueries, maps it to a percentage with a simple `CASE rating WHEN …` and turns the no-rating case into 0 with `IFNULL`. Both are one indexed lookup per employee.",
    ].join("\n"),
  },

  {
    slug: "appraisal-ratings-falling-two-cycles-running",
    title: "Appraisal Ratings Falling Two Cycles Running",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Strings"],
    description: [
      "HR business partners want to talk to anyone whose performance is sliding. Look at each employee's **three most recent** appraisal cycles (by `cycle_year`): the employee is flagged when the ratings **strictly fall** from the oldest of the three to the middle one **and** from the middle one to the latest. Employees with fewer than three appraisals are never flagged.",
      "",
      "Return `emp_id` and `trend`, the three ratings oldest first joined by `>` (for example `5>4>2`). Order by `emp_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Appraisal",
        columns: [
          { name: "emp_id", type: "int" },
          { name: "cycle_year", type: "int" },
          { name: "rating", type: "int" },
        ],
        primaryKey: ["emp_id", "cycle_year"],
        note: "One row per employee per yearly cycle they were rated in; `rating` is 1–5 and never NULL. An employee may have skipped a cycle (on leave), so years can have gaps.",
      },
    ],
    examples: [
      {
        Appraisal: [
          [1, 2021, 5],
          [1, 2022, 5],
          [1, 2023, 4],
          [1, 2024, 3],
          [2, 2022, 4],
          [2, 2023, 3],
          [2, 2024, 3],
          [3, 2020, 5],
          [3, 2022, 4],
          [3, 2024, 2],
          [4, 2023, 4],
          [4, 2024, 2],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const e of seq(1, ri(rng, 1, 8))) {
        const sliding = chance(rng, 0.5);
        const years = sample(rng, [2019, 2020, 2021, 2022, 2023, 2024], sliding ? ri(rng, 3, 5) : ri(rng, 1, 5)).sort();
        let r = sliding ? ri(rng, 4, 5) : ri(rng, 1, 5);
        for (const y of years) {
          rows.push([e, y, r]);
          r = sliding ? Math.max(1, r - (chance(rng, 0.8) ? 1 : ri(rng, 0, 2))) : ri(rng, 1, 5);
        }
      }
      return { Appraisal: shuffle(rng, rows) };
    },
    solution: [
      "SELECT emp_id, CONCAT(r3, '>', r2, '>', r1) AS trend",
      "FROM (",
      "  SELECT emp_id, rating AS r1,",
      "         LEAD(rating, 1) OVER (PARTITION BY emp_id ORDER BY cycle_year DESC) AS r2,",
      "         LEAD(rating, 2) OVER (PARTITION BY emp_id ORDER BY cycle_year DESC) AS r3,",
      "         ROW_NUMBER() OVER (PARTITION BY emp_id ORDER BY cycle_year DESC) AS rn",
      "  FROM Appraisal",
      ") t",
      "WHERE rn = 1 AND r3 > r2 AND r2 > r1",
      "ORDER BY emp_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH ranked AS (",
        "  SELECT emp_id, rating, ROW_NUMBER() OVER (PARTITION BY emp_id ORDER BY cycle_year DESC) AS rn FROM Appraisal",
        ")",
        "SELECT a.emp_id, CONCAT_WS('>', c.rating, b.rating, a.rating) AS trend",
        "FROM ranked a",
        "JOIN ranked b ON b.emp_id = a.emp_id AND b.rn = 2",
        "JOIN ranked c ON c.emp_id = a.emp_id AND c.rn = 3",
        "WHERE a.rn = 1 AND c.rating > b.rating AND b.rating > a.rating",
        "ORDER BY a.emp_id",
      ].join("\n"),
      [
        "SELECT emp_id, GROUP_CONCAT(rating ORDER BY cycle_year SEPARATOR '>') AS trend",
        "FROM (SELECT emp_id, cycle_year, rating, ROW_NUMBER() OVER (PARTITION BY emp_id ORDER BY cycle_year DESC) AS rn FROM Appraisal) t",
        "WHERE rn <= 3",
        "GROUP BY emp_id",
        "HAVING COUNT(*) = 3",
        "   AND MAX(CASE WHEN rn = 3 THEN rating END) > MAX(CASE WHEN rn = 2 THEN rating END)",
        "   AND MAX(CASE WHEN rn = 2 THEN rating END) > MAX(CASE WHEN rn = 1 THEN rating END)",
        "ORDER BY emp_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Number each employee's cycles from the most recent: 1 is the latest, 3 the oldest of the three that matter.",
      "With the cycles ordered newest first, `LEAD(rating, 1)` and `LEAD(rating, 2)` are the two cycles before the current one.",
      "Keep only the latest row per employee; if it has no second or third cycle before it, the LEADs are NULL and the comparison fails.",
      "Gaps in the years do not matter — the question is about the three most recent appraisals, not three consecutive years.",
    ],
    editorial: [
      "Each employee's **three most recent** appraisals decide the flag, so order each employee's rows newest first. On the latest row (`ROW_NUMBER() = 1`), `LEAD(rating, 1)` is the previous appraisal and `LEAD(rating, 2)` the one before that — whatever their years, so a skipped cycle is simply stepped over.",
      "",
      "The test is two strict comparisons: oldest > middle and middle > latest. An employee with fewer than three appraisals has NULL in a LEAD, NULL comparisons are never true, and the row is dropped without a special case. A flat step (4, 3, 3) fails because `3 > 3` is false.",
      "",
      "The trend string is built oldest first with `CONCAT(r3, '>', r2, '>', r1)` — numbers are converted to text by CONCAT. The second form ranks the rows, joins the ranks 1, 2 and 3 of each employee and builds the same string with `CONCAT_WS`. The third groups the top three rows, demands exactly three, compares them by pivoting with `MAX(CASE …)`, and lets `GROUP_CONCAT(rating ORDER BY cycle_year SEPARATOR '>')` build the string. All are one sort per employee.",
    ].join("\n"),
  },

  {
    slug: "monthly-attrition-rate-in-2024",
    title: "Monthly Attrition Rate in 2024",
    difficulty: "MEDIUM",
    topics: ["Dates", "Subqueries"],
    description: [
      "Attrition for a month is the number of employees whose **last working day** (`exit_date`) fell in that month, divided by the **opening headcount** — the employees on the rolls on the **1st of the month** (joined on or before the 1st, and either still employed or with an `exit_date` on or after the 1st).",
      "",
      "For every month of **2024 with at least one exit**, return `month` (as `YYYY-MM`), `exits`, `opening_headcount` and `attrition_pct` = exits × 100 / opening headcount, **rounded to 2 decimals** (NULL if the opening headcount is 0). Order by `month`.",
    ].join("\n"),
    tables: [
      {
        name: "Employee",
        columns: [
          { name: "emp_id", type: "int" },
          { name: "joined_on", type: "date" },
          { name: "exit_date", type: "date" },
        ],
        primaryKey: ["emp_id"],
        note: "`exit_date` is the last working day of someone who has left, or NULL for a current employee.",
      },
    ],
    examples: [
      {
        Employee: [
          [1, "2022-04-11", null],
          [2, "2023-01-09", "2024-02-29"],
          [3, "2023-06-01", "2024-03-01"],
          [4, "2024-01-01", null],
          [5, "2024-02-12", "2024-02-28"],
          [6, "2021-09-20", "2024-06-14"],
          [7, "2023-11-06", "2023-12-29"],
          [8, "2024-03-04", null],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 24);
      return {
        Employee: seq(1, n).map((id) => {
          const joined = chance(rng, 0.1) ? pick(rng, ["2024-03-01", "2024-06-01"]) : dateBetween(rng, "2021-01-01", "2024-10-31");
          const exit = chance(rng, 0.5) ? (chance(rng, 0.15) ? pick(rng, ["2024-03-01", "2024-06-30", "2024-12-31"]) : dateBetween(rng, "2023-10-01", "2025-02-28")) : null;
          return [id, joined, exit !== null && exit < joined ? addDays(joined, ri(rng, 20, 200)) : exit];
        }),
      };
    },
    solution: [
      "SELECT m.month, m.exits,",
      "       (SELECT COUNT(*) FROM Employee e",
      "         WHERE e.joined_on <= m.first_day AND (e.exit_date IS NULL OR e.exit_date >= m.first_day)) AS opening_headcount,",
      "       ROUND(m.exits * 100 / NULLIF((SELECT COUNT(*) FROM Employee e",
      "         WHERE e.joined_on <= m.first_day AND (e.exit_date IS NULL OR e.exit_date >= m.first_day)), 0), 2) AS attrition_pct",
      "FROM (",
      "  SELECT month, CONCAT(month, '-01') AS first_day, COUNT(*) AS exits",
      "  FROM (SELECT DATE_FORMAT(exit_date, '%Y-%m') AS month FROM Employee",
      "        WHERE exit_date >= '2024-01-01' AND exit_date < '2025-01-01') x",
      "  GROUP BY month",
      ") m",
      "ORDER BY m.month",
    ].join("\n"),
    alternatives: [
      [
        "WITH months AS (",
        "  SELECT DISTINCT DATE_FORMAT(exit_date, '%Y-%m') AS month FROM Employee WHERE YEAR(exit_date) = 2024",
        "), stats AS (",
        "  SELECT m.month,",
        "         SUM(CASE WHEN DATE_FORMAT(e.exit_date, '%Y-%m') = m.month THEN 1 ELSE 0 END) AS exits,",
        "         SUM(CASE WHEN e.joined_on <= CONCAT(m.month, '-01') AND (e.exit_date IS NULL OR e.exit_date >= CONCAT(m.month, '-01')) THEN 1 ELSE 0 END) AS opening_headcount",
        "  FROM months m CROSS JOIN Employee e",
        "  GROUP BY m.month",
        ")",
        "SELECT month, exits, opening_headcount,",
        "       CASE WHEN opening_headcount = 0 THEN NULL ELSE ROUND(exits * 100 / opening_headcount, 2) END AS attrition_pct",
        "FROM stats",
        "ORDER BY month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Start from the months that have exits: group the 2024 exits by `DATE_FORMAT(exit_date, '%Y-%m')`.",
      "For each such month, the opening headcount is a count over the whole table with a condition on the month's first day.",
      "Someone whose last day is the 1st was still on the rolls that morning — `exit_date >= first_day`.",
      "Guard the division with NULLIF for a month whose opening headcount is zero.",
    ],
    editorial: [
      "Two different populations meet in each row: the **exits** of a month (grouped by the month of `exit_date`) and the **opening headcount** on its 1st (a count over all employees). They do not come from the same rows, so compute them separately.",
      "",
      "The derived table `m` groups 2024's exits by month, which also yields only the months the statement wants — those with at least one exit — and carries the month's first day as text (`YYYY-MM-01`). For each of those rows, a correlated scalar subquery counts employees who had joined by that day and had not yet left: `exit_date IS NULL OR exit_date >= first_day`. The `>=` matters: a person whose last working day is the 1st was still on the rolls that morning, and an employee who exits during the month is counted in both the exits and the opening headcount.",
      "",
      "The rate is exits × 100 / headcount rounded to 2 decimals, with `NULLIF` so a month whose leavers all joined during it gives NULL instead of failing. The alternative cross-joins the exit months with all employees and counts both things with conditional sums. Both are months × employees, tiny here.",
    ].join("\n"),
  },

  {
    slug: "staffing-pool-of-multi-skill-experts",
    title: "Staffing Pool of Multi-Skill Experts",
    difficulty: "MEDIUM",
    topics: ["Strings", "Aggregation"],
    description: [
      "The resource-management team is staffing a new client project and wants people who are **expert in at least two skills**. Skills at `beginner` or `intermediate` level do not count towards the two.",
      "",
      "Return `emp_id`, `full_name`, `expert_count` and `expert_skills` — the names of their expert skills in **alphabetical order**, separated by a comma and a space (`Docker, Java, SQL`). Order by `expert_count` descending, then `emp_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Employee",
        columns: [
          { name: "emp_id", type: "int" },
          { name: "full_name", type: "varchar" },
        ],
        primaryKey: ["emp_id"],
      },
      {
        name: "EmployeeSkill",
        columns: [
          { name: "emp_id", type: "int" },
          { name: "skill", type: "varchar" },
          { name: "level", type: "enum", values: ["beginner", "intermediate", "expert"] },
        ],
        primaryKey: ["emp_id", "skill"],
        note: "One row per skill an employee has declared and had assessed.",
      },
    ],
    examples: [
      {
        Employee: [
          [1, "Aarav Sharma"],
          [2, "Diya Iyer"],
          [3, "Ishaan Gupta"],
          [4, "Kavya Nair"],
        ],
        EmployeeSkill: [
          [1, "Java", "expert"],
          [1, "SQL", "expert"],
          [1, "Docker", "expert"],
          [2, "Python", "expert"],
          [2, "Tableau", "intermediate"],
          [2, "Excel", "expert"],
          [3, "React", "expert"],
          [3, "Go", "beginner"],
          [4, "Kubernetes", "intermediate"],
        ],
      },
    ],
    gen: (rng) => {
      const SKILLS = ["Angular", "Docker", "Excel", "Go", "Java", "Kubernetes", "Python", "React", "SQL", "Tableau"];
      const ids = seq(1, ri(rng, 1, 10));
      const who = fullNames(rng, ids.length);
      const skills: Cell[][] = [];
      const expertRate = pick(rng, [0.3, 0.5, 0.7]);
      for (const id of ids) {
        for (const s of sample(rng, SKILLS, ri(rng, 0, 5))) skills.push([id, s, chance(rng, expertRate) ? "expert" : pick(rng, ["beginner", "intermediate"])]);
      }
      return { Employee: ids.map((id, i) => [id, who[i]!]), EmployeeSkill: skills };
    },
    solution: [
      "SELECT e.emp_id, e.full_name, COUNT(*) AS expert_count,",
      "       GROUP_CONCAT(s.skill ORDER BY s.skill SEPARATOR ', ') AS expert_skills",
      "FROM Employee e",
      "JOIN EmployeeSkill s ON s.emp_id = e.emp_id",
      "WHERE s.level = 'expert'",
      "GROUP BY e.emp_id, e.full_name",
      "HAVING COUNT(*) >= 2",
      "ORDER BY expert_count DESC, e.emp_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT e.emp_id, e.full_name, x.expert_count, x.expert_skills",
        "FROM Employee e",
        "JOIN (SELECT emp_id, COUNT(skill) AS expert_count, GROUP_CONCAT(skill ORDER BY skill SEPARATOR ', ') AS expert_skills",
        "      FROM EmployeeSkill WHERE level = 'expert' GROUP BY emp_id) x ON x.emp_id = e.emp_id",
        "WHERE x.expert_count > 1",
        "ORDER BY x.expert_count DESC, e.emp_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Filter to expert rows before grouping, so the other levels never reach the count or the list.",
      "`HAVING` keeps the groups with at least two rows.",
      "`GROUP_CONCAT(x ORDER BY x SEPARATOR ', ')` builds the sorted, comma-separated list.",
    ],
    editorial: [
      "Filter, group, and aggregate into a string. `WHERE s.level = 'expert'` removes beginner and intermediate skills before grouping, so they affect neither the count nor the list. Grouping by employee, `COUNT(*)` is the number of expert skills and `HAVING COUNT(*) >= 2` keeps the multi-skill experts.",
      "",
      "`GROUP_CONCAT(s.skill ORDER BY s.skill SEPARATOR ', ')` builds the list. The inner `ORDER BY` is essential: without it the order inside the string follows however the rows were read, and the same data could produce a different string. The separator is a comma followed by a space, as the statement shows.",
      "",
      "The alternative aggregates the skills table alone in a derived table and joins the names afterwards, which keeps the join small when the skills table is large. Either way it is one pass over the expert rows plus a sort within each employee's handful of skills; the final order is the biggest pool first, ties by `emp_id`.",
    ].join("\n"),
  },

  {
    slug: "org-chart-depth-and-business-head",
    title: "Org Chart Depth and Business Head of Every Employee",
    difficulty: "HARD",
    topics: ["Joins", "Subqueries"],
    description: [
      "The company has exactly one CEO (`manager_id` NULL); everyone else reports to a manager who is also an employee. The people directly under the CEO are the **business heads**, and every other employee belongs to the business head at the top of their reporting chain.",
      "",
      "Return every employee with `emp_id`, `full_name`, `depth` (0 for the CEO, 1 for a business head, 2 for their direct reports, and so on) and `business_head` (the business head's `full_name`; a business head is their own, and the CEO's is NULL). Order by `depth`, then `emp_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Employee",
        columns: [
          { name: "emp_id", type: "int" },
          { name: "full_name", type: "varchar" },
          { name: "designation", type: "varchar" },
          { name: "manager_id", type: "int" },
        ],
        primaryKey: ["emp_id"],
        note: "`manager_id` is the `emp_id` of the employee's manager, NULL only for the CEO. Reporting lines never loop.",
      },
    ],
    examples: [
      {
        Employee: [
          [1, "Meera Iyer", "CEO", null],
          [2, "Arjun Rao", "CTO", 1],
          [3, "Pooja Shah", "CFO", 1],
          [4, "Karan Nair", "Engineering Manager", 2],
          [5, "Sneha Das", "Senior Engineer", 4],
          [6, "Rahul Khan", "Finance Controller", 3],
          [7, "Tanvi Bose", "Engineer", 5],
          [8, "Dev Menon", "Platform Lead", 2],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 15);
      const who = fullNames(rng, n);
      const depth: number[] = [0];
      const rows: Cell[][] = [[1, who[0]!, "CEO", null]];
      for (let id = 2; id <= n; id++) {
        // A manager among the earlier rows, kept at depth ≤ 4 so the chart stays realistic.
        const options = seq(1, id - 1).filter((m) => depth[m - 1]! < 4);
        const m = chance(rng, 0.3) ? 1 : pick(rng, options);
        depth.push(depth[m - 1]! + 1);
        rows.push([id, who[id - 1]!, pick(rng, ["Director", "Manager", "Lead", "Engineer", "Analyst", "Executive"]), m]);
      }
      return { Employee: shuffle(rng, rows) };
    },
    solution: [
      "WITH RECURSIVE chain AS (",
      "  SELECT e.emp_id, 1 AS depth, e.full_name AS business_head",
      "  FROM Employee e",
      "  JOIN Employee ceo ON ceo.emp_id = e.manager_id",
      "  WHERE ceo.manager_id IS NULL",
      "  UNION ALL",
      "  SELECT e.emp_id, c.depth + 1, c.business_head",
      "  FROM Employee e",
      "  JOIN chain c ON e.manager_id = c.emp_id",
      ")",
      "SELECT e.emp_id, e.full_name, COALESCE(c.depth, 0) AS depth, c.business_head",
      "FROM Employee e",
      "LEFT JOIN chain c ON c.emp_id = e.emp_id",
      "ORDER BY depth, e.emp_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE up AS (",
        "  SELECT emp_id AS start_id, emp_id AS cur_id, manager_id AS cur_mgr, 0 AS steps FROM Employee",
        "  UNION ALL",
        "  SELECT u.start_id, m.emp_id, m.manager_id, u.steps + 1",
        "  FROM up u JOIN Employee m ON m.emp_id = u.cur_mgr",
        "), depths AS (",
        "  SELECT start_id, MAX(steps) AS depth FROM up GROUP BY start_id",
        ")",
        "SELECT e.emp_id, e.full_name, d.depth, h.full_name AS business_head",
        "FROM Employee e",
        "JOIN depths d ON d.start_id = e.emp_id",
        "LEFT JOIN up u ON u.start_id = e.emp_id AND u.steps = d.depth - 1",
        "LEFT JOIN Employee h ON h.emp_id = u.cur_id",
        "ORDER BY d.depth, e.emp_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The chain can be any length, so a fixed number of self joins is not enough — use `WITH RECURSIVE`.",
      "Start the recursion at the business heads (whose manager has no manager) and carry their name down the tree.",
      "Each recursive step finds the direct reports of the rows found so far and adds 1 to the depth.",
      "The CEO is not reached by the recursion; a LEFT JOIN back to `Employee` brings them in with depth 0.",
    ],
    editorial: [
      "Reporting chains have no fixed length, so this is a job for a **recursive CTE**. The anchor selects the business heads — employees whose manager is the CEO, i.e. whose manager's `manager_id` is NULL — with depth 1 and their own name as `business_head`. The recursive member joins `Employee` to the rows found so far on `e.manager_id = c.emp_id`: each pass reaches one level further down, adds 1 to the depth and copies the business head's name unchanged. The recursion stops when a pass finds no new reports; since reporting lines never loop, that always happens.",
      "",
      "Anchoring at depth 1 rather than at the CEO is deliberate: the CEO has no business head, and starting the recursion with a NULL in that column would give the CTE an awkward column type in MySQL. Instead the final query LEFT JOINs `Employee` to the chain, so the one employee the recursion never reaches — the CEO — comes through with `COALESCE(depth, 0)` and a NULL head.",
      "",
      "The alternative walks **upwards**: from every employee, follow `manager_id` one step at a time and record how many steps were taken. The longest walk is the depth, and the ancestor reached one step before the top is the business head. It visits each employee's whole chain, so it is O(n × depth), the same order as the top-down version.",
    ].join("\n"),
  },

  {
    slug: "total-team-size-and-payroll-under-each-manager",
    title: "Total Team Size and Payroll Under Each Manager",
    difficulty: "HARD",
    topics: ["Aggregation", "Joins"],
    description: [
      "For budgeting, every people manager is accountable for their **whole subtree**: direct reports, their reports, and so on down. The organisation may have more than one top-level leader (`manager_id` NULL), for example after an acquisition.",
      "",
      "For every employee with **at least one direct report**, return `emp_id`, `full_name`, `team_size` (the number of people anywhere below them) and `team_ctc` (the sum of those people's `annual_ctc`; the manager's own CTC is not included). Order by `team_size` descending, then `emp_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Employee",
        columns: [
          { name: "emp_id", type: "int" },
          { name: "full_name", type: "varchar" },
          { name: "manager_id", type: "int" },
          { name: "annual_ctc", type: "int" },
        ],
        primaryKey: ["emp_id"],
        note: "`manager_id` is the `emp_id` of the direct manager, NULL for a top-level leader. Reporting lines never loop.",
      },
    ],
    examples: [
      {
        Employee: [
          [1, "Meera Iyer", null, 9000000],
          [2, "Arjun Rao", 1, 4500000],
          [3, "Pooja Shah", 1, 4200000],
          [4, "Karan Nair", 2, 2400000],
          [5, "Sneha Das", 4, 1600000],
          [6, "Rahul Khan", 3, 1800000],
          [7, "Tanvi Bose", 4, 1200000],
          [8, "Liam Joshi", null, 6000000],
          [9, "Emma Patel", 8, 1500000],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 16);
      const who = fullNames(rng, n);
      const rows: Cell[][] = [];
      for (let id = 1; id <= n; id++) {
        const m = id === 1 || chance(rng, 0.12) ? null : ri(rng, Math.max(1, id - 4), id - 1);
        rows.push([id, who[id - 1]!, m, roundTo(rng, 600000, 6000000, 100000)]);
      }
      return { Employee: shuffle(rng, rows) };
    },
    solution: [
      "WITH RECURSIVE reports AS (",
      "  SELECT manager_id AS boss_id, emp_id AS report_id",
      "  FROM Employee",
      "  WHERE manager_id IS NOT NULL",
      "  UNION ALL",
      "  SELECT r.boss_id, e.emp_id",
      "  FROM reports r",
      "  JOIN Employee e ON e.manager_id = r.report_id",
      ")",
      "SELECT b.emp_id, b.full_name, COUNT(*) AS team_size, SUM(p.annual_ctc) AS team_ctc",
      "FROM reports r",
      "JOIN Employee b ON b.emp_id = r.boss_id",
      "JOIN Employee p ON p.emp_id = r.report_id",
      "GROUP BY b.emp_id, b.full_name",
      "ORDER BY team_size DESC, b.emp_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE ancestors AS (",
        "  SELECT emp_id AS report_id, manager_id AS boss_id FROM Employee WHERE manager_id IS NOT NULL",
        "  UNION ALL",
        "  SELECT a.report_id, m.manager_id",
        "  FROM ancestors a JOIN Employee m ON m.emp_id = a.boss_id",
        "  WHERE m.manager_id IS NOT NULL",
        ")",
        "SELECT b.emp_id, b.full_name, t.team_size, t.team_ctc",
        "FROM (SELECT a.boss_id, COUNT(*) AS team_size, SUM(e.annual_ctc) AS team_ctc",
        "      FROM ancestors a JOIN Employee e ON e.emp_id = a.report_id GROUP BY a.boss_id) t",
        "JOIN Employee b ON b.emp_id = t.boss_id",
        "ORDER BY t.team_size DESC, b.emp_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Build every (manager, someone below them) pair — the transitive closure of the reporting line.",
      "Start with the direct pairs, then repeatedly extend a pair (boss, x) with x's own direct reports.",
      "Once you have the pairs, team size and team CTC are an ordinary GROUP BY on the boss.",
      "You can also build the same pairs from the bottom: from each employee, walk up through every ancestor.",
    ],
    editorial: [
      "The question is about **everyone below** a manager, at any depth, so we need the transitive closure of `manager_id`: one row per (boss, report) pair where the report is somewhere in the boss's subtree.",
      "",
      "A recursive CTE builds it. The anchor is the direct pairs `(manager_id, emp_id)`. The recursive member takes a pair (boss, x) and joins `Employee` on `e.manager_id = x`, producing (boss, x's direct report); repeating this reaches every level. Since the org chart is a forest without loops, each pair is produced exactly once and the recursion ends after as many passes as the deepest chain.",
      "",
      "With the pairs in hand the rest is plain aggregation: group by the boss, `COUNT(*)` the reports and `SUM` their CTC (joining `Employee` for the report's salary — the boss's own CTC never enters, because the boss is never their own report). Employees with no direct report never appear as a boss, so they are excluded, and several top-level leaders are handled naturally.",
      "",
      "The alternative walks upwards: from each employee, the anchor is (employee, manager) and every step replaces the boss by the boss's manager. It yields the same pair set from the other end. Both are O(n × depth).",
    ].join("\n"),
  },

  {
    slug: "overlapping-approved-leave-in-the-same-team",
    title: "Overlapping Approved Leave Within a Team",
    difficulty: "HARD",
    topics: ["Joins", "Dates"],
    description: [
      "Team leads do not want two people from the same team away at the same time. Leave dates are **inclusive**: a leave from 2025-05-05 to 2025-05-07 covers three days, and two leaves overlap when they share **at least one day**. Only `approved` requests matter.",
      "",
      "For every pair of approved leave requests of **two different employees in the same team** that overlap, return `team`, `emp_a` and `emp_b` (the two `emp_id`s, smaller first), `overlap_start`, `overlap_end` and `overlap_days`. Order by `overlap_start`, then `emp_a`, then `emp_b`, then `overlap_end`.",
    ].join("\n"),
    tables: [
      {
        name: "Employee",
        columns: [
          { name: "emp_id", type: "int" },
          { name: "full_name", type: "varchar" },
          { name: "team", type: "varchar" },
        ],
        primaryKey: ["emp_id"],
      },
      {
        name: "LeaveRequest",
        columns: [
          { name: "leave_id", type: "int" },
          { name: "emp_id", type: "int" },
          { name: "start_date", type: "date" },
          { name: "end_date", type: "date" },
          { name: "status", type: "enum", values: ["approved", "pending", "rejected"] },
        ],
        primaryKey: ["leave_id"],
        note: "`start_date` and `end_date` are both days of leave (`end_date` ≥ `start_date`). One employee's own approved leaves never overlap each other.",
      },
    ],
    examples: [
      {
        Employee: [
          [1, "Aarav Sharma", "Payments"],
          [2, "Diya Iyer", "Payments"],
          [3, "Ishaan Gupta", "Payments"],
          [4, "Kavya Nair", "Search"],
        ],
        LeaveRequest: [
          [11, 1, "2025-05-05", "2025-05-09", "approved"],
          [12, 2, "2025-05-08", "2025-05-12", "approved"],
          [13, 3, "2025-05-09", "2025-05-09", "approved"],
          [14, 4, "2025-05-06", "2025-05-08", "approved"],
          [15, 2, "2025-05-01", "2025-05-02", "pending"],
          [16, 1, "2025-05-01", "2025-05-02", "approved"],
          [17, 3, "2025-05-12", "2025-05-14", "rejected"],
          [18, 3, "2025-05-13", "2025-05-13", "approved"],
        ],
      },
    ],
    gen: (rng) => {
      const ids = seq(1, chance(rng, 0.1) ? 1 : ri(rng, 2, 7));
      const who = fullNames(rng, ids.length);
      const teams = sample(rng, ["Payments", "Search", "Onboarding", "Payroll Ops"], ri(rng, 1, 2));
      const emps = ids.map((id, i) => [id, who[i]!, pick(rng, teams)]);
      const leaves: Cell[][] = [];
      for (const id of ids) {
        // Non-overlapping approved leaves per person: walk forward through May.
        let day = ri(rng, 0, 6);
        for (let k = ri(rng, 0, 3); k > 0 && day < 20; k--) {
          const len = ri(rng, 0, 4);
          const start = addDays("2025-05-01", day);
          leaves.push([0, id, start, addDays(start, len), chance(rng, 0.85) ? "approved" : pick(rng, ["pending", "rejected"])]);
          day += len + ri(rng, 1, 5);
        }
      }
      return { Employee: emps, LeaveRequest: shuffle(rng, leaves).map((l, i) => [100 + i, ...l.slice(1)]) };
    },
    solution: [
      "SELECT ea.team, a.emp_id AS emp_a, b.emp_id AS emp_b,",
      "       GREATEST(a.start_date, b.start_date) AS overlap_start,",
      "       LEAST(a.end_date, b.end_date) AS overlap_end,",
      "       DATEDIFF(LEAST(a.end_date, b.end_date), GREATEST(a.start_date, b.start_date)) + 1 AS overlap_days",
      "FROM LeaveRequest a",
      "JOIN LeaveRequest b ON a.emp_id < b.emp_id AND a.start_date <= b.end_date AND b.start_date <= a.end_date",
      "JOIN Employee ea ON ea.emp_id = a.emp_id",
      "JOIN Employee eb ON eb.emp_id = b.emp_id AND eb.team = ea.team",
      "WHERE a.status = 'approved' AND b.status = 'approved'",
      "ORDER BY overlap_start, emp_a, emp_b, overlap_end",
    ].join("\n"),
    alternatives: [
      [
        "WITH approved AS (",
        "  SELECT l.emp_id, l.start_date, l.end_date, e.team",
        "  FROM LeaveRequest l JOIN Employee e ON e.emp_id = l.emp_id",
        "  WHERE l.status = 'approved'",
        ")",
        "SELECT team, emp_a, emp_b, overlap_start, overlap_end, DATEDIFF(overlap_end, overlap_start) + 1 AS overlap_days",
        "FROM (",
        "  SELECT a.team, a.emp_id AS emp_a, b.emp_id AS emp_b,",
        "         CASE WHEN a.start_date > b.start_date THEN a.start_date ELSE b.start_date END AS overlap_start,",
        "         CASE WHEN a.end_date < b.end_date THEN a.end_date ELSE b.end_date END AS overlap_end",
        "  FROM approved a JOIN approved b ON a.team = b.team AND a.emp_id < b.emp_id",
        ") p",
        "WHERE overlap_start <= overlap_end",
        "ORDER BY overlap_start, emp_a, emp_b, overlap_end",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Pair leave requests with each other — a self join on `LeaveRequest` — and use `a.emp_id < b.emp_id` so each pair appears once and nobody is paired with themselves.",
      "Two inclusive ranges [s1, e1] and [s2, e2] overlap exactly when `s1 <= e2 AND s2 <= e1`.",
      "The shared part starts at the later start and ends at the earlier end: `GREATEST` and `LEAST`.",
      "Inclusive dates: the number of days is the difference plus one.",
    ],
    editorial: [
      "Pairing rows of one table means a **self join**. Join `LeaveRequest a` to `LeaveRequest b` with `a.emp_id < b.emp_id`: that excludes pairing an employee with themselves and lists every pair once, with the smaller id as `emp_a`. Join `Employee` on both sides and require the same team; keep only approved requests on both sides.",
      "",
      "The overlap test for inclusive ranges is the classic `a.start <= b.end AND b.start <= a.end`: two ranges fail to overlap only when one ends before the other starts. The equality cases matter — a leave ending on the 9th and a one-day leave on the 9th share that day. The shared stretch runs from `GREATEST(a.start, b.start)` to `LEAST(a.end, b.end)`, and with inclusive dates its length is `DATEDIFF(end, start) + 1`.",
      "",
      "The alternative computes the would-be overlap for every same-team pair first (with CASE instead of GREATEST/LEAST) and keeps the pairs where it is non-empty, `overlap_start <= overlap_end` — an equivalent way to say the ranges intersect. The self join is quadratic in the leaves per team; an index on `(status, start_date)` lets an engine prune pairs by date.",
    ].join("\n"),
  },

  {
    slug: "three-day-unplanned-absence-streaks",
    title: "Unplanned Absence Streaks of Three Working Days",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "Under the attendance policy, an employee who is `absent` (no punch, no approved leave) on **three or more consecutive working days** gets a call from HR. Working days are listed in `WorkDay`, numbered in order, so a weekend or holiday between two working days does **not** break a streak; an approved `leave` or a `present`/`wfh` day does.",
      "",
      "Return every streak of at least three consecutive working days of `absent` status, with `emp_id`, `streak_start`, `streak_end` (the first and last dates) and `days` (working days in the streak). Order by `emp_id`, then `streak_start`.",
    ].join("\n"),
    tables: [
      {
        name: "WorkDay",
        columns: [
          { name: "day_no", type: "int" },
          { name: "work_date", type: "date" },
        ],
        primaryKey: ["day_no"],
        note: "One row per working day of the office calendar; `day_no` rises by 1 from one working day to the next, skipping weekends and holidays.",
      },
      {
        name: "Attendance",
        columns: [
          { name: "emp_id", type: "int" },
          { name: "work_date", type: "date" },
          { name: "status", type: "enum", values: ["present", "wfh", "leave", "absent"] },
        ],
        primaryKey: ["emp_id", "work_date"],
        note: "One row per employee per working day; `work_date` is always a date in `WorkDay`.",
      },
    ],
    examples: [
      {
        WorkDay: [
          [1, "2025-03-06"],
          [2, "2025-03-07"],
          [3, "2025-03-10"],
          [4, "2025-03-11"],
          [5, "2025-03-12"],
          [6, "2025-03-13"],
        ],
        Attendance: [
          [7, "2025-03-06", "absent"],
          [7, "2025-03-07", "absent"],
          [7, "2025-03-10", "absent"],
          [7, "2025-03-11", "present"],
          [7, "2025-03-12", "absent"],
          [8, "2025-03-06", "absent"],
          [8, "2025-03-07", "leave"],
          [8, "2025-03-10", "absent"],
          [8, "2025-03-11", "absent"],
          [9, "2025-03-10", "absent"],
          [9, "2025-03-11", "absent"],
          [9, "2025-03-12", "absent"],
          [9, "2025-03-13", "absent"],
        ],
      },
    ],
    gen: (rng) => {
      // A calendar of working days: weekdays from a start date, minus the odd holiday.
      const days: string[] = [];
      let d = dateBetween(rng, "2025-01-06", "2025-10-06");
      while (days.length < 14) {
        const wd = new Date(`${d}T00:00:00Z`).getUTCDay();
        if (wd !== 0 && wd !== 6 && !chance(rng, 0.06)) days.push(d);
        d = addDays(d, 1);
      }
      const att: Cell[][] = [];
      for (const e of seq(7, ri(rng, 1, 3))) {
        const absentRate = pick(rng, [0.3, 0.55, 0.75]);
        for (const day of days) {
          if (chance(rng, 0.1)) continue;
          att.push([e, day, chance(rng, absentRate) ? "absent" : pick(rng, ["present", "present", "wfh", "leave"])]);
        }
      }
      return { WorkDay: days.map((x, i) => [i + 1, x]), Attendance: att.slice(0, 30) };
    },
    solution: [
      "WITH absent AS (",
      "  SELECT a.emp_id, w.day_no, w.work_date,",
      "         w.day_no - ROW_NUMBER() OVER (PARTITION BY a.emp_id ORDER BY w.day_no) AS grp",
      "  FROM Attendance a",
      "  JOIN WorkDay w ON w.work_date = a.work_date",
      "  WHERE a.status = 'absent'",
      ")",
      "SELECT emp_id, MIN(work_date) AS streak_start, MAX(work_date) AS streak_end, COUNT(*) AS days",
      "FROM absent",
      "GROUP BY emp_id, grp",
      "HAVING COUNT(*) >= 3",
      "ORDER BY emp_id, streak_start",
    ].join("\n"),
    alternatives: [
      [
        "WITH absent AS (",
        "  SELECT a.emp_id, w.day_no, w.work_date,",
        "         CASE WHEN LAG(w.day_no) OVER (PARTITION BY a.emp_id ORDER BY w.day_no) = w.day_no - 1 THEN 0 ELSE 1 END AS is_start",
        "  FROM Attendance a JOIN WorkDay w ON w.work_date = a.work_date",
        "  WHERE a.status = 'absent'",
        "), labelled AS (",
        "  SELECT emp_id, work_date,",
        "         SUM(is_start) OVER (PARTITION BY emp_id ORDER BY day_no ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS streak_no",
        "  FROM absent",
        ")",
        "SELECT emp_id, MIN(work_date) AS streak_start, MAX(work_date) AS streak_end, COUNT(*) AS days",
        "FROM labelled",
        "GROUP BY emp_id, streak_no",
        "HAVING COUNT(*) >= 3",
        "ORDER BY emp_id, streak_start",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Consecutive calendar dates are the wrong test — Friday and Monday are consecutive *working* days. Use `day_no`.",
      "Keep only the absent days, then look for runs of consecutive `day_no` per employee: a gaps-and-islands problem.",
      "Within a run, `day_no - ROW_NUMBER()` (per employee, ordered by `day_no`) stays constant.",
      "Group by employee and that key; keep groups of three or more.",
    ],
    editorial: [
      "Two things make this harder than it looks. First, **consecutive means consecutive working days**: a streak from Friday into Monday is unbroken. The calendar table solves that — join each attendance row to `WorkDay` and reason about `day_no`, which rises by exactly 1 from one working day to the next. Second, a run must be broken by any non-absent status, so keep only `status = 'absent'` rows before looking for runs; a leave day then leaves a hole in the day numbers.",
      "",
      "What remains is **gaps and islands**. Number each employee's absent days with `ROW_NUMBER() OVER (PARTITION BY emp_id ORDER BY day_no)`. Along a run of consecutive day numbers both values rise by one each step, so `day_no - ROW_NUMBER()` is constant; any hole changes it. Grouping by employee and that key gives one group per streak: `MIN`/`MAX` of the dates are its ends, `COUNT(*)` its length, and `HAVING COUNT(*) >= 3` keeps the ones that trigger a call.",
      "",
      "The alternative marks a row as the start of a streak when the previous absent day (`LAG`) is not `day_no - 1`, then numbers the streaks with a running `SUM` of the start flags — an explicit `ROWS` frame keeps the running total exact. Both are a sort per employee plus a grouping.",
    ].join("\n"),
  },

  {
    slug: "median-ctc-for-each-job-level",
    title: "Median CTC for Each Job Level",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "The compensation team benchmarks pay bands by the **median** annual CTC of each job level, because a few very high packages make the average misleading. Only people on the payroll count (`status` is not `'exited'`). With an odd headcount the median is the middle CTC; with an even headcount it is the **average of the two middle CTCs**.",
      "",
      "Return one row per job level that has at least one on-payroll employee, with `job_level`, `headcount` and `median_ctc`. Order by `job_level`.",
    ].join("\n"),
    tables: [
      {
        name: "Employee",
        columns: [
          { name: "emp_id", type: "int" },
          { name: "job_level", type: "enum", values: ["L1", "L2", "L3", "L4", "L5"] },
          { name: "annual_ctc", type: "int" },
          { name: "status", type: "enum", values: ["active", "notice", "exited"] },
        ],
        primaryKey: ["emp_id"],
        note: "`annual_ctc` is the yearly cost to company in rupees. Several people can have exactly the same CTC.",
      },
    ],
    examples: [
      {
        Employee: [
          [1, "L1", 600000, "active"],
          [2, "L1", 750000, "active"],
          [3, "L1", 700000, "notice"],
          [4, "L1", 5000000, "exited"],
          [5, "L2", 1200000, "active"],
          [6, "L2", 1500000, "active"],
          [7, "L2", 1300000, "active"],
          [8, "L2", 1800000, "active"],
          [9, "L3", 2400000, "active"],
          [10, "L4", 3600000, "exited"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.04) ? 0 : ri(rng, 1, 22);
      const levels = sample(rng, ["L1", "L2", "L3", "L4", "L5"], ri(rng, 1, 4));
      const base: Record<string, number> = { L1: 500000, L2: 1000000, L3: 1800000, L4: 3000000, L5: 4500000 };
      return {
        Employee: seq(1, n).map((id) => {
          const lvl = pick(rng, levels);
          // CTCs on a coarse grid, so equal packages (and equal middle values) are common.
          return [id, lvl, base[lvl]! + roundTo(rng, 0, 800000, 100000), pick(rng, ["active", "active", "active", "notice", "exited"])];
        }),
      };
    },
    solution: [
      "WITH ranked AS (",
      "  SELECT job_level, annual_ctc,",
      "         ROW_NUMBER() OVER (PARTITION BY job_level ORDER BY annual_ctc, emp_id) AS rn,",
      "         COUNT(*) OVER (PARTITION BY job_level) AS cnt",
      "  FROM Employee",
      "  WHERE status <> 'exited'",
      ")",
      "SELECT job_level, MAX(cnt) AS headcount, AVG(annual_ctc) AS median_ctc",
      "FROM ranked",
      "WHERE rn IN ((cnt + 1) DIV 2, cnt DIV 2 + 1)",
      "GROUP BY job_level",
      "ORDER BY job_level",
    ].join("\n"),
    alternatives: [
      [
        "WITH a AS (SELECT job_level, annual_ctc FROM Employee WHERE status <> 'exited'),",
        "c AS (SELECT job_level, COUNT(*) AS n FROM a GROUP BY job_level)",
        "SELECT x.job_level, c.n AS headcount, AVG(DISTINCT x.annual_ctc) AS median_ctc",
        "FROM a x JOIN c ON c.job_level = x.job_level",
        "WHERE 2 * (SELECT COUNT(*) FROM a y WHERE y.job_level = x.job_level AND y.annual_ctc <= x.annual_ctc) >= c.n",
        "  AND 2 * (SELECT COUNT(*) FROM a y WHERE y.job_level = x.job_level AND y.annual_ctc >= x.annual_ctc) >= c.n",
        "GROUP BY x.job_level, c.n",
        "ORDER BY x.job_level",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Rank each level's CTCs in order and know how many there are: `ROW_NUMBER()` and `COUNT(*)` over the same partition.",
      "For n rows the middle positions are `(n + 1) DIV 2` and `n DIV 2 + 1` — the same position when n is odd.",
      "Averaging the rows at those positions gives the median for both odd and even counts.",
      "Without windows: a value is a middle value when at least half the rows are ≤ it and at least half are ≥ it.",
    ],
    editorial: [
      "SQL has no portable `MEDIAN`, so we locate the middle rows ourselves. After dropping exited employees, number each level's rows by CTC with `ROW_NUMBER() OVER (PARTITION BY job_level ORDER BY annual_ctc, emp_id)` and attach the level's size with `COUNT(*) OVER (PARTITION BY job_level)`. Equal CTCs get distinct numbers (the `emp_id` tie-break), which is fine: equal values are interchangeable for the median.",
      "",
      "For n rows the middle positions are `(n + 1) DIV 2` and `n DIV 2 + 1`. When n is odd they are the same position (for n = 3: 2 and 2); when n is even they are the two middle ones (for n = 4: 2 and 3). Keeping those rows and taking `AVG(annual_ctc)` per level therefore gives the median in both cases without a CASE; `MAX(cnt)` reports the headcount.",
      "",
      "The window-free alternative uses the definition: a value v is a middle value when at least half of the level's CTCs are ≤ v **and** at least half are ≥ v. For odd n only the median satisfies both; for even n exactly the two middle values do. Duplicates can make several rows qualify with the same value, so the average is taken over `DISTINCT` values. That version is quadratic per level; the window version is one sort.",
    ].join("\n"),
  },

  {
    slug: "new-hire-retention-by-joining-quarter-2024",
    title: "90- and 180-Day Retention of 2024 Hires by Quarter",
    difficulty: "HARD",
    topics: ["Dates", "Conditional Logic", "Aggregation"],
    description: [
      "The leadership review on **2025-03-31** asks how well 2024's hires stayed. A hire is **retained at N days** when they have not left, or their `exit_date` is **at least N days** after `joined_on`. Every 2024 hire is old enough for the 90-day check; for the 180-day check, count only hires who joined **at least 180 days before 2025-03-31** (on or before 2024-10-02).",
      "",
      "Return all four quarters of 2024 — even a quarter with no hires — with `cohort` (`2024-Q1` … `2024-Q4`), `hires`, `retained_90_pct` (retained at 90 ÷ hires × 100) and `retained_180_pct` (retained at 180 ÷ hires old enough × 100), each **rounded to 2 decimals** and NULL when its denominator is 0. Order by `cohort`.",
    ].join("\n"),
    tables: [
      {
        name: "Employee",
        columns: [
          { name: "emp_id", type: "int" },
          { name: "joined_on", type: "date" },
          { name: "exit_date", type: "date" },
          { name: "source", type: "enum", values: ["campus", "referral", "job_board", "agency"] },
        ],
        primaryKey: ["emp_id"],
        note: "`exit_date` is the last working day of someone who has left, or NULL for a current employee.",
      },
    ],
    examples: [
      {
        Employee: [
          [1, "2024-01-15", null, "campus"],
          [2, "2024-02-05", "2024-04-30", "job_board"],
          [3, "2024-03-11", "2024-06-09", "agency"],
          [4, "2024-07-01", "2024-11-15", "referral"],
          [5, "2024-08-19", null, "campus"],
          [6, "2024-10-02", "2025-03-31", "job_board"],
          [7, "2024-11-04", "2025-01-10", "agency"],
          [8, "2023-12-18", "2024-02-01", "agency"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.04) ? 0 : ri(rng, 1, 22);
      const quarters = sample(rng, [["2024-01-01", "2024-03-31"], ["2024-04-01", "2024-06-30"], ["2024-07-01", "2024-09-30"], ["2024-10-01", "2024-12-31"]], ri(rng, 1, 4));
      return {
        Employee: seq(1, n).map((id) => {
          const [from, to] = pick(rng, quarters);
          const joined = chance(rng, 0.08) ? "2024-10-02" : chance(rng, 0.1) ? dateBetween(rng, "2023-11-01", "2025-02-28") : dateBetween(rng, from!, to!);
          const stay = pick(rng, [null, null, ri(rng, 20, 89), 90, ri(rng, 91, 179), 180, ri(rng, 181, 400)]);
          const exit = stay === null ? null : addDays(joined, stay);
          return [id, joined, exit !== null && exit > "2025-03-31" ? null : exit, pick(rng, ["campus", "referral", "job_board", "agency"])];
        }),
      };
    },
    solution: [
      "WITH quarters AS (",
      "  SELECT 1 AS q UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4",
      ")",
      "SELECT CONCAT('2024-Q', q.q) AS cohort,",
      "       COUNT(e.emp_id) AS hires,",
      "       ROUND(SUM(CASE WHEN e.exit_date IS NULL OR DATEDIFF(e.exit_date, e.joined_on) >= 90 THEN 1 ELSE 0 END) * 100",
      "             / NULLIF(COUNT(e.emp_id), 0), 2) AS retained_90_pct,",
      "       ROUND(SUM(CASE WHEN e.joined_on <= '2024-10-02' AND (e.exit_date IS NULL OR DATEDIFF(e.exit_date, e.joined_on) >= 180) THEN 1 ELSE 0 END) * 100",
      "             / NULLIF(SUM(CASE WHEN e.joined_on <= '2024-10-02' THEN 1 ELSE 0 END), 0), 2) AS retained_180_pct",
      "FROM quarters q",
      "LEFT JOIN Employee e ON YEAR(e.joined_on) = 2024 AND QUARTER(e.joined_on) = q.q",
      "GROUP BY q.q",
      "ORDER BY cohort",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE quarters AS (",
        "  SELECT 1 AS q, CAST('2024-01-01' AS DATE) AS q_start",
        "  UNION ALL",
        "  SELECT q + 1, DATE_ADD(q_start, INTERVAL 3 MONTH) FROM quarters WHERE q < 4",
        "), hires AS (",
        "  SELECT q.q,",
        "         CASE WHEN e.exit_date IS NULL OR e.exit_date >= DATE_ADD(e.joined_on, INTERVAL 90 DAY) THEN 1 ELSE 0 END AS kept90,",
        "         CASE WHEN e.joined_on <= DATE_SUB('2025-03-31', INTERVAL 180 DAY) THEN 1 ELSE 0 END AS eligible180,",
        "         CASE WHEN e.joined_on <= DATE_SUB('2025-03-31', INTERVAL 180 DAY)",
        "               AND (e.exit_date IS NULL OR e.exit_date >= DATE_ADD(e.joined_on, INTERVAL 180 DAY)) THEN 1 ELSE 0 END AS kept180",
        "  FROM quarters q",
        "  JOIN Employee e ON e.joined_on >= q.q_start AND e.joined_on < DATE_ADD(q.q_start, INTERVAL 3 MONTH)",
        ")",
        "SELECT CONCAT('2024-Q', q.q) AS cohort, COUNT(h.q) AS hires,",
        "       CASE WHEN COUNT(h.q) = 0 THEN NULL ELSE ROUND(SUM(h.kept90) * 100 / COUNT(h.q), 2) END AS retained_90_pct,",
        "       CASE WHEN IFNULL(SUM(h.eligible180), 0) = 0 THEN NULL ELSE ROUND(SUM(h.kept180) * 100 / SUM(h.eligible180), 2) END AS retained_180_pct",
        "FROM quarters q",
        "LEFT JOIN hires h ON h.q = q.q",
        "GROUP BY q.q",
        "ORDER BY cohort",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "All four quarters must appear, so build them as a small table of their own and LEFT JOIN the hires onto it.",
      "`QUARTER(joined_on)` gives 1–4; only joining dates in 2024 belong to a cohort.",
      "The two percentages have different denominators: all hires, and only the hires old enough for the 180-day check.",
      "Count with `SUM(CASE …)`, and divide by `NULLIF(denominator, 0)` so empty denominators give NULL.",
    ],
    editorial: [
      "A cohort report has to show every cohort, including an empty one, so the quarters come from a table we make ourselves — four literal rows joined with `UNION ALL`, or a recursive CTE that steps three months at a time — and the hires are LEFT JOINed onto it by `YEAR(joined_on) = 2024 AND QUARTER(joined_on) = q`. A quarter with no hires keeps one NULL row; `COUNT(e.emp_id)` gives it 0.",
      "",
      "Retention at N days is a condition per hire: no exit, or an exit at least N days after joining — `DATEDIFF(exit_date, joined_on) >= N`, which is the same as `exit_date >= DATE_ADD(joined_on, INTERVAL N DAY)`. Someone whose last day is exactly day 90 counts as retained, as the statement says.",
      "",
      "The 180-day rate is the trap: hires from the last months of 2024 have not had 180 days yet, and counting them as \"not retained\" would make the newest cohort look terrible. So its denominator is only the hires who joined on or before `2024-10-02` (180 days before the review), and its numerator is the retained among those. Both percentages divide by `NULLIF(…, 0)` so an empty denominator gives NULL, and are rounded to 2 decimals. One pass over the employees.",
    ].join("\n"),
  },

  {
    slug: "leave-ledger-entries-that-went-negative",
    title: "Leave Ledger Entries That Took the Balance Negative",
    difficulty: "HARD",
    topics: ["Window Functions", "Conditional Logic"],
    description: [
      "Earned leave is kept as a ledger. `carry_forward` and `accrual` entries **add** days; `availed` and `encashed` entries **subtract** them. The balance **starts again from 0 every calendar year** (the days carried in arrive as a `carry_forward` entry in January). Entries apply in order of `entry_date`, and entries on the same day in order of `entry_id`.",
      "",
      "Payroll needs every entry after which that year's running balance is **below zero** (leave taken in advance). Return `emp_id`, `entry_id`, `entry_date` and `balance_after`. Order by `emp_id`, then `entry_date`, then `entry_id`.",
    ].join("\n"),
    tables: [
      {
        name: "LeaveLedger",
        columns: [
          { name: "entry_id", type: "int" },
          { name: "emp_id", type: "int" },
          { name: "entry_date", type: "date" },
          { name: "entry_type", type: "enum", values: ["carry_forward", "accrual", "availed", "encashed"] },
          { name: "days", type: "int" },
        ],
        primaryKey: ["entry_id"],
        note: "`days` is always positive; the type says whether it adds to or subtracts from the balance.",
      },
    ],
    examples: [
      {
        LeaveLedger: [
          [1, 31, "2024-01-01", "carry_forward", 4],
          [2, 31, "2024-01-31", "accrual", 2],
          [3, 31, "2024-02-10", "availed", 7],
          [4, 31, "2024-02-29", "accrual", 2],
          [5, 31, "2024-12-20", "encashed", 2],
          [6, 31, "2025-01-03", "availed", 1],
          [7, 32, "2024-03-04", "availed", 2],
          [8, 32, "2024-03-04", "accrual", 2],
          [9, 32, "2024-03-29", "accrual", 2],
          [10, 32, "2024-04-02", "availed", 2],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const e of seq(31, ri(rng, 1, 3))) {
        for (const year of sample(rng, [2023, 2024, 2025], ri(rng, 1, 2))) {
          if (chance(rng, 0.6)) rows.push([0, e, `${year}-01-01`, "carry_forward", ri(rng, 0, 8)]);
          for (let k = ri(rng, 2, 6); k > 0; k--) {
            const add = chance(rng, 0.45);
            rows.push([0, e, dateBetween(rng, `${year}-01-01`, `${year}-06-30`), add ? "accrual" : pick(rng, ["availed", "availed", "encashed"]), add ? 2 : ri(rng, 1, 5)]);
          }
        }
      }
      return { LeaveLedger: shuffle(rng, rows.slice(0, 30)).map((r, i) => [i + 1, ...r.slice(1)]) };
    },
    solution: [
      "SELECT emp_id, entry_id, entry_date, balance_after",
      "FROM (",
      "  SELECT emp_id, entry_id, entry_date,",
      "         SUM(CASE WHEN entry_type IN ('carry_forward', 'accrual') THEN days ELSE -days END)",
      "           OVER (PARTITION BY emp_id, YEAR(entry_date) ORDER BY entry_date, entry_id",
      "                 ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS balance_after",
      "  FROM LeaveLedger",
      ") t",
      "WHERE balance_after < 0",
      "ORDER BY emp_id, entry_date, entry_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT l.emp_id, l.entry_id, l.entry_date,",
        "       SUM(IF(p.entry_type IN ('availed', 'encashed'), -p.days, p.days)) AS balance_after",
        "FROM LeaveLedger l",
        "JOIN LeaveLedger p ON p.emp_id = l.emp_id AND YEAR(p.entry_date) = YEAR(l.entry_date)",
        " AND (p.entry_date < l.entry_date OR (p.entry_date = l.entry_date AND p.entry_id <= l.entry_id))",
        "GROUP BY l.emp_id, l.entry_id, l.entry_date",
        "HAVING SUM(IF(p.entry_type IN ('availed', 'encashed'), -p.days, p.days)) < 0",
        "ORDER BY l.emp_id, l.entry_date, l.entry_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Turn each entry into a signed number of days: positive for credits, negative for debits.",
      "A running total is `SUM(…) OVER (… ORDER BY …)`; the yearly reset is a second PARTITION BY key, `YEAR(entry_date)`.",
      "Two entries on the same day: order by `entry_id` as well, and use a `ROWS` frame so same-day entries are not added together.",
      "Filter on the running balance outside the query that computes it.",
    ],
    editorial: [
      "First give each entry a sign: `CASE WHEN entry_type IN ('carry_forward', 'accrual') THEN days ELSE -days END`. The balance after an entry is then the running sum of those signed values for the same employee and the same year, up to and including that entry.",
      "",
      "The window does exactly that: `SUM(signed) OVER (PARTITION BY emp_id, YEAR(entry_date) ORDER BY entry_date, entry_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`. Partitioning by the year is the reset — January starts a new partition, so last December's balance is never carried silently. The order includes `entry_id` because same-day entries apply one at a time: on the example's 4 March an advance is availed *before* the month's accrual lands, and that intermediate negative balance is exactly what payroll wants to see. With the default `RANGE` frame both same-day rows would be summed together and the dip would vanish, hence the explicit `ROWS` frame.",
      "",
      "Window results cannot be filtered in their own `WHERE`, so wrap the query and keep `balance_after < 0`. The alternative is the pre-window way: join each entry to every earlier-or-equal entry of the same employee and year, sum, and filter with `HAVING` — quadratic per employee-year, against one sort for the window.",
    ].join("\n"),
  },
];
