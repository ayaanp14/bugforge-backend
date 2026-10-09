import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, chance, dateBetween, LAST_NAMES, names, pick, ri, sample } from "./kit.js";

/**
 * Education and edtech: the questions a college's exam cell, accounts office
 * and placement cell ask of their tables (attendance shortage, grade bands,
 * fee dues, CGPA, offers), and the ones an online learning platform asks of its
 * own (quiz scores, lesson progress, completion funnels, streaks, cohorts).
 * Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);

const COURSE_CODES = ["CS301", "CS302", "EC210", "ME105", "MA201", "HS101", "CS405", "EE220"] as const;
const BRANCHES = ["CSE", "ECE", "MECH", "CIVIL", "EEE", "IT"] as const;
const COMPANIES = ["Infosys", "TCS", "Wipro", "Zoho", "Flipkart", "Razorpay", "Accenture", "Atlassian", "Swiggy", "Deloitte"] as const;
const EMAIL_DOMAINS = ["gmail.com", "outlook.com", "yahoo.co.in", "iitb.ac.in", "nitk.edu.in", "vit.ac.in", "rediffmail.com"] as const;
const SUBJECTS = ["MA101", "PH102", "CS103", "EE104", "HS105", "ME106"] as const;

export const WORLD_EDUCATION: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "students-short-of-seventy-five-percent-attendance",
    title: "Students Short of 75% Attendance in a Course",
    difficulty: "EASY",
    topics: ["Basics"],
    description: [
      "The university debars a student from a course's end-semester exam when their attendance in that course is **below 75%**. The exam cell has one row per student and course with the classes held and the classes the student attended.",
      "",
      "Return every student-course pair whose attendance is strictly below 75%, with the columns `roll_no`, `course_code` and `attendance_pct` — the attended classes as a percentage of the classes held, **rounded to 2 decimal places**. Exactly 75% is not a shortage. Order the rows by `roll_no`, then by `course_code`.",
    ].join("\n"),
    tables: [
      {
        name: "Attendance",
        columns: [
          { name: "roll_no", type: "int" },
          { name: "course_code", type: "varchar" },
          { name: "classes_held", type: "int" },
          { name: "classes_attended", type: "int" },
        ],
        primaryKey: ["roll_no", "course_code"],
        note: "One row per student per registered course this semester; `classes_held` is always at least 1 and `classes_attended` never exceeds it.",
      },
    ],
    examples: [
      {
        Attendance: [
          [2101, "CS301", 40, 30],
          [2101, "MA201", 42, 29],
          [2102, "CS301", 40, 38],
          [2102, "EC210", 36, 20],
          [2103, "MA201", 42, 32],
          [2103, "CS301", 40, 29],
          [2104, "HS101", 30, 30],
        ],
      },
    ],
    gen: (rng) => {
      const rolls = sample(rng, seq(2101, 20), ri(rng, 1, 8));
      const rows: Cell[][] = [];
      for (const roll of rolls) {
        for (const code of sample(rng, COURSE_CODES, ri(rng, 1, 3))) {
          const held = pick(rng, [30, 36, 40, 42, 45, 48, 52, 60]);
          // A quarter of the rows sit exactly on 75% when the count allows it, the boundary the statement is about.
          const attended = held % 4 === 0 && chance(rng, 0.25) ? (held * 3) / 4 : ri(rng, Math.floor(held * 0.5), held);
          rows.push([roll, code, held, attended]);
        }
      }
      return { Attendance: rows };
    },
    solution: [
      "SELECT roll_no, course_code,",
      "       ROUND(classes_attended * 100 / classes_held, 2) AS attendance_pct",
      "FROM Attendance",
      "WHERE classes_attended * 100 < classes_held * 75",
      "ORDER BY roll_no, course_code",
    ].join("\n"),
    alternatives: [
      "SELECT roll_no, course_code, ROUND(100.0 * classes_attended / classes_held, 2) AS attendance_pct FROM Attendance WHERE classes_attended / classes_held < 0.75 ORDER BY roll_no ASC, course_code ASC",
      "SELECT roll_no, course_code, attendance_pct FROM (SELECT roll_no, course_code, ROUND(classes_attended * 100 / classes_held, 2) AS attendance_pct, classes_attended * 4 - classes_held * 3 AS margin FROM Attendance) t WHERE margin < 0 ORDER BY roll_no, course_code",
    ],
    ordered: true,
    hints: [
      "Each row already holds everything the condition needs — no join or grouping is involved.",
      "Compare the attended classes with three quarters of the classes held, and keep the comparison strict.",
      "Filter on the exact ratio and only round the number you display; rounding first can move a row across the 75% line.",
    ],
    editorial: [
      "Each row of `Attendance` is one student in one course, so the answer is a filter plus a computed column. A row is a shortage when `classes_attended / classes_held < 0.75`. Multiplying both sides by `classes_held` (always positive) gives the integer-only form `classes_attended * 100 < classes_held * 75`, which never touches a fraction and so cannot be affected by any rounding.",
      "",
      "The percentage itself is `classes_attended * 100 / classes_held`. In MySQL `/` is decimal division, so 29 of 42 is 69.0476…, and `ROUND(…, 2)` gives 69.05. Round only the value you show — filtering on a rounded percentage could turn 74.996% into 75.00% and wrongly clear a student.",
      "",
      "Exactly 75% (30 of 40) is allowed, which is why the comparison is strict. The statement fixes the order, so finish with `ORDER BY roll_no, course_code`. The query is one scan of the table.",
    ].join("\n"),
  },

  {
    slug: "courses-nobody-registered-for-this-semester",
    title: "Courses Nobody Registered For in the Odd Semester",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "The academic office wants to drop courses that drew no registrations for the **2024-25 Odd** semester. Registrations from other semesters do not count — a course popular last year but empty this semester must still be listed.",
      "",
      "Return every course with **no registration in the '2024-25 Odd' semester**, with the columns `course_code` and `title`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Course",
        columns: [
          { name: "course_code", type: "varchar" },
          { name: "title", type: "varchar" },
          { name: "credits", type: "int" },
        ],
        primaryKey: ["course_code"],
        note: "One row per course in the catalogue.",
      },
      {
        name: "Registration",
        columns: [
          { name: "registration_id", type: "int" },
          { name: "roll_no", type: "int" },
          { name: "course_code", type: "varchar" },
          { name: "semester", type: "enum", values: ["2023-24 Even", "2024-25 Odd", "2024-25 Even"] },
        ],
        primaryKey: ["registration_id"],
        note: "One row per student registering for a course in a semester; `course_code` is always in `Course`.",
      },
    ],
    examples: [
      {
        Course: [
          ["CS301", "Operating Systems", 4],
          ["CS302", "Computer Networks", 4],
          ["MA201", "Probability and Statistics", 3],
          ["HS101", "Professional Communication", 2],
          ["EC210", "Digital Electronics", 3],
        ],
        Registration: [
          [1, 2101, "CS301", "2024-25 Odd"],
          [2, 2102, "CS301", "2024-25 Odd"],
          [3, 2101, "MA201", "2023-24 Even"],
          [4, 2103, "CS302", "2024-25 Odd"],
          [5, 2104, "HS101", "2024-25 Even"],
          [6, 2102, "MA201", "2023-24 Even"],
        ],
      },
    ],
    gen: (rng) => {
      const TITLES: Record<string, string> = {
        CS301: "Operating Systems", CS302: "Computer Networks", EC210: "Digital Electronics", ME105: "Engineering Drawing",
        MA201: "Probability and Statistics", HS101: "Professional Communication", CS405: "Machine Learning", EE220: "Signals and Systems",
      };
      const codes = sample(rng, COURSE_CODES, ri(rng, 1, 8));
      const courses = codes.map((c) => [c, TITLES[c]!, pick(rng, [2, 3, 4])]);
      const sems = ["2023-24 Even", "2024-25 Odd", "2024-25 Even"] as const;
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 14);
      const regs = seq(1, m).map((id) => [id, ri(rng, 2101, 2120), pick(rng, codes), pick(rng, sems)]);
      return { Course: courses, Registration: regs };
    },
    solution: [
      "SELECT c.course_code, c.title",
      "FROM Course c",
      "LEFT JOIN Registration r",
      "  ON r.course_code = c.course_code AND r.semester = '2024-25 Odd'",
      "WHERE r.registration_id IS NULL",
    ].join("\n"),
    alternatives: [
      "SELECT course_code, title FROM Course c WHERE NOT EXISTS (SELECT 1 FROM Registration r WHERE r.course_code = c.course_code AND r.semester = '2024-25 Odd')",
      "SELECT course_code, title FROM Course WHERE course_code NOT IN (SELECT course_code FROM Registration WHERE semester = '2024-25 Odd')",
    ],
    hints: [
      "Start from `Course`: every row of the answer is a course, including ones with no registrations at all.",
      "A LEFT JOIN keeps the course even when nothing matches — but where you put the semester condition matters.",
      "A semester filter in WHERE runs after the join and throws away the very rows with no match. Put it in the ON clause instead.",
    ],
    editorial: [
      "This is an anti join with a twist: only registrations of one semester count. The natural form is a LEFT JOIN from `Course` to `Registration` and a test for the missing partner, `r.registration_id IS NULL`.",
      "",
      "The semester condition must sit in the **ON** clause. There it limits which registrations may match, so a course with registrations only in other semesters finds no partner and comes through with NULLs. Written in WHERE instead, `r.semester = '2024-25 Odd'` is evaluated after the join; on the unmatched rows `r.semester` is NULL, the condition is unknown, and every course you wanted is filtered away — while a course with only old registrations is dropped too.",
      "",
      "`NOT EXISTS` with the semester inside the subquery says the same thing directly, and `NOT IN` is safe here because `course_code` is never NULL in `Registration`. All three read each course once and probe the registrations by course code.",
    ].join("\n"),
  },

  {
    slug: "fee-invoices-paid-late-or-still-overdue",
    title: "Fee Invoices Paid Late or Still Overdue",
    difficulty: "EASY",
    topics: ["Dates", "Conditional Logic"],
    description: [
      "The accounts office closes its books for the quarter on **2024-08-31** and charges a late fee per day on tuition invoices. An invoice is late when it was paid after its due date, or when it is still unpaid on 2024-08-31 and its due date is before that day.",
      "",
      "Return every late invoice with the columns `invoice_id`, `roll_no` and `days_late` — the days between the due date and the payment date, or 2024-08-31 for an unpaid invoice. An invoice paid on its due date is not late. Order the rows by `days_late` **highest first**, then by `invoice_id`.",
    ].join("\n"),
    tables: [
      {
        name: "FeeInvoice",
        columns: [
          { name: "invoice_id", type: "int" },
          { name: "roll_no", type: "int" },
          { name: "amount", type: "int" },
          { name: "due_date", type: "date" },
          { name: "paid_on", type: "date" },
        ],
        primaryKey: ["invoice_id"],
        note: "`amount` is in rupees; `paid_on` is NULL while the invoice is unpaid and is never after 2024-08-31.",
      },
    ],
    examples: [
      {
        FeeInvoice: [
          [501, 2101, 85000, "2024-07-15", "2024-07-10"],
          [502, 2102, 85000, "2024-07-15", "2024-07-15"],
          [503, 2103, 85000, "2024-07-15", "2024-07-29"],
          [504, 2104, 42000, "2024-08-10", null],
          [505, 2105, 42000, "2024-08-31", null],
          [506, 2101, 12500, "2024-08-01", "2024-08-22"],
          [507, 2106, 12500, "2024-09-15", null],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      return {
        FeeInvoice: seq(501, n).map((id) => {
          const due = pick(rng, ["2024-07-15", "2024-08-01", "2024-08-10", "2024-08-31", "2024-09-15"]);
          const r = rng();
          let paid: string | null;
          if (r < 0.3) paid = null;
          else if (r < 0.45) paid = due <= "2024-08-31" ? due : null;
          else {
            const p = addDays(due, ri(rng, -10, 25));
            paid = p > "2024-08-31" ? "2024-08-31" : p;
          }
          return [id, ri(rng, 2101, 2115), pick(rng, [12500, 42000, 85000]), due, paid];
        }),
      };
    },
    solution: [
      "SELECT invoice_id, roll_no,",
      "       DATEDIFF(COALESCE(paid_on, '2024-08-31'), due_date) AS days_late",
      "FROM FeeInvoice",
      "WHERE DATEDIFF(COALESCE(paid_on, '2024-08-31'), due_date) > 0",
      "ORDER BY days_late DESC, invoice_id",
    ].join("\n"),
    alternatives: [
      "SELECT invoice_id, roll_no, CASE WHEN paid_on IS NULL THEN DATEDIFF('2024-08-31', due_date) ELSE DATEDIFF(paid_on, due_date) END AS days_late FROM FeeInvoice WHERE (paid_on IS NULL AND due_date < '2024-08-31') OR paid_on > due_date ORDER BY days_late DESC, invoice_id ASC",
      "SELECT invoice_id, roll_no, DATEDIFF(IFNULL(paid_on, '2024-08-31'), due_date) AS days_late FROM FeeInvoice WHERE IFNULL(paid_on, '2024-08-31') > due_date ORDER BY 3 DESC, 1",
    ],
    ordered: true,
    hints: [
      "For an unpaid invoice, the day the lateness is measured up to is the closing date, 2024-08-31.",
      "`COALESCE(paid_on, '2024-08-31')` gives one 'settled on' date for every invoice.",
      "`DATEDIFF(a, b)` is the number of days from `b` to `a`; a late invoice has a positive difference.",
    ],
    editorial: [
      "Two kinds of invoice are late — paid after the due date, and unpaid past the due date — but both measure the same thing: the gap between the due date and the day the invoice was settled, where an unpaid invoice counts as settled on the closing day. `COALESCE(paid_on, '2024-08-31')` turns the two cases into one date, and `DATEDIFF(settled, due_date)` is the days late.",
      "",
      "A positive difference means late; zero is paid on the due date (or unpaid but due on the closing day) and negative is paid early, neither of which belongs in the answer. So the filter is the same expression `> 0`, and the list is ordered by it, highest first, with `invoice_id` breaking ties.",
      "",
      "Spelling the two cases out with CASE and an OR in WHERE gives the same rows. Either way it is a single scan of the invoices.",
    ].join("\n"),
  },

  {
    slug: "quiz-average-score-with-enough-attempts",
    title: "Average Quiz Score for Quizzes With Three or More Attempts",
    difficulty: "EASY",
    topics: ["Aggregation"],
    description: [
      "An online learning platform's content team reviews quiz difficulty, but an average over one or two attempts says little. Each row of `QuizAttempt` is one learner's attempt at one quiz, scored out of 100.",
      "",
      "For every quiz with **at least 3 attempts**, return `quiz_id`, `attempts` (the number of attempts) and `avg_score` (the mean score, **rounded to 2 decimal places**). Quizzes with fewer attempts are left out. Order the rows by `avg_score` **lowest first**, then by `quiz_id`.",
    ].join("\n"),
    tables: [
      {
        name: "QuizAttempt",
        columns: [
          { name: "attempt_id", type: "int" },
          { name: "learner_id", type: "int" },
          { name: "quiz_id", type: "int" },
          { name: "score", type: "int" },
        ],
        primaryKey: ["attempt_id"],
        note: "`score` is a whole number from 0 to 100; a learner may attempt the same quiz more than once and every attempt counts.",
      },
    ],
    examples: [
      {
        QuizAttempt: [
          [1, 11, 7, 62],
          [2, 12, 7, 48],
          [3, 13, 7, 71],
          [4, 11, 9, 90],
          [5, 12, 9, 85],
          [6, 11, 4, 55],
          [7, 14, 4, 60],
          [8, 11, 4, 40],
          [9, 15, 4, 52],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 0, 22);
      const quizzes = sample(rng, seq(1, 9), ri(rng, 1, 4));
      return {
        QuizAttempt: seq(1, n).map((id) => [id, ri(rng, 11, 20), pick(rng, quizzes), ri(rng, 20, 100)]),
      };
    },
    solution: [
      "SELECT quiz_id, COUNT(*) AS attempts, ROUND(AVG(score), 2) AS avg_score",
      "FROM QuizAttempt",
      "GROUP BY quiz_id",
      "HAVING COUNT(*) >= 3",
      "ORDER BY avg_score, quiz_id",
    ].join("\n"),
    alternatives: [
      "SELECT quiz_id, attempts, avg_score FROM (SELECT quiz_id, COUNT(attempt_id) AS attempts, ROUND(SUM(score) / COUNT(*), 2) AS avg_score FROM QuizAttempt GROUP BY quiz_id) t WHERE attempts >= 3 ORDER BY avg_score ASC, quiz_id ASC",
    ],
    ordered: true,
    hints: [
      "One output row per quiz means grouping by `quiz_id`.",
      "A condition on a group's size can't go in WHERE, which runs before grouping.",
      "HAVING filters groups after they are formed; round only the average you display.",
    ],
    editorial: [
      "Group the attempts by `quiz_id`; each group is one quiz, `COUNT(*)` is its attempts and `AVG(score)` its mean score. The statement asks only for quizzes with at least three attempts, a condition on the group rather than on a row, so it belongs in **HAVING**, which is evaluated after the groups are built. WHERE cannot see `COUNT(*)` at all.",
      "",
      "Round the average to two places for display. Ordering by the rounded average with `quiz_id` as the tie-breaker makes the order unique, which matters because two quizzes can easily share an average.",
      "",
      "An equivalent form computes the counts in a derived table and filters them in the outer WHERE; `SUM(score) / COUNT(*)` is the same mean as `AVG`. The cost is one pass over the attempts with a hash or sort on `quiz_id`.",
    ].join("\n"),
  },

  {
    slug: "learner-signups-by-email-domain",
    title: "Learner Sign-ups by E-mail Domain",
    difficulty: "EASY",
    topics: ["Strings", "Aggregation"],
    description: [
      "The partnerships team of an online learning platform wants to know which colleges and mail providers its learners sign up from, to decide where to pitch campus licences. The domain is everything after the `@` in a learner's e-mail address.",
      "",
      "Return one row per domain with the columns `domain` and `learners` (the number of learners using it). Every e-mail contains exactly one `@`. Order the rows by `learners` **highest first**, then by `domain` alphabetically.",
    ].join("\n"),
    tables: [
      {
        name: "Learner",
        columns: [
          { name: "learner_id", type: "int" },
          { name: "full_name", type: "varchar" },
          { name: "email", type: "varchar" },
          { name: "signed_up_on", type: "date" },
        ],
        primaryKey: ["learner_id"],
        note: "E-mail addresses are stored in lower case.",
      },
    ],
    examples: [
      {
        Learner: [
          [1, "Aarav Sharma", "aarav.s@gmail.com", "2024-01-04"],
          [2, "Diya Iyer", "diya.iyer@iitb.ac.in", "2024-01-09"],
          [3, "Kabir Khan", "kabir_k@gmail.com", "2024-02-11"],
          [4, "Meera Nair", "meera@nitk.edu.in", "2024-02-20"],
          [5, "Rohan Das", "rohan.das@iitb.ac.in", "2024-03-02"],
          [6, "Sneha Rao", "sneha.r@outlook.com", "2024-03-15"],
          [7, "Zara Patel", "zara.patel@gmail.com", "2024-03-18"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 15);
      const who = names(rng, n);
      const domains = sample(rng, EMAIL_DOMAINS, ri(rng, 1, 5));
      return {
        Learner: who.map((first, i) => {
          const last = pick(rng, LAST_NAMES);
          const local = `${first.toLowerCase()}${pick(rng, [".", "_", ""])}${last.toLowerCase().slice(0, ri(rng, 1, 4))}${i}`;
          return [i + 1, `${first} ${last}`, `${local}@${pick(rng, domains)}`, dateBetween(rng, "2024-01-01", "2024-12-31")];
        }),
      };
    },
    solution: [
      "SELECT SUBSTRING_INDEX(email, '@', -1) AS domain, COUNT(*) AS learners",
      "FROM Learner",
      "GROUP BY SUBSTRING_INDEX(email, '@', -1)",
      "ORDER BY learners DESC, domain",
    ].join("\n"),
    alternatives: [
      "SELECT SUBSTRING(email, LOCATE('@', email) + 1) AS domain, COUNT(learner_id) AS learners FROM Learner GROUP BY SUBSTRING(email, LOCATE('@', email) + 1) ORDER BY 2 DESC, 1 ASC",
      "SELECT domain, COUNT(*) AS learners FROM (SELECT RIGHT(email, CHAR_LENGTH(email) - INSTR(email, '@')) AS domain FROM Learner) t GROUP BY domain ORDER BY learners DESC, domain",
    ],
    ordered: true,
    hints: [
      "First turn each e-mail into its domain, then count learners per domain.",
      "`SUBSTRING_INDEX(s, '@', -1)` returns everything after the last `@`.",
      "Group by the extracted domain (the expression or its alias in a derived table), not by the full e-mail.",
    ],
    editorial: [
      "The question has two steps: derive the domain from each address, then count addresses per domain. `SUBSTRING_INDEX(email, '@', -1)` returns the part of the string after the last occurrence of the delimiter — with a negative count it counts from the right — which, with exactly one `@`, is the domain.",
      "",
      "Group by that expression and `COUNT(*)` the rows of each group. Order by the count descending and break ties alphabetically on the domain, as the statement asks, so the order is fully fixed.",
      "",
      "The same domain can be cut with `LOCATE('@', email)` (the position of the `@`) and `SUBSTRING` from the next character, or with `RIGHT` over the length that remains. Computing it once in a derived table keeps the GROUP BY short. Either way the work is one scan plus a group-by on a short string.",
    ].join("\n"),
  },
  {
    slug: "exam-marks-to-university-grade-bands",
    title: "Exam Marks to University Grade Letters",
    difficulty: "EASY",
    topics: ["Conditional Logic", "Basics"],
    description: [
      "The exam cell publishes letter grades, not marks. The university's bands are: 90 and above `O`, 80–89 `A+`, 70–79 `A`, 60–69 `B+`, 50–59 `B`, 40–49 `C`, and below 40 `F`. A student who was absent has `marks` NULL and gets `AB`.",
      "",
      "Return every result with the columns `roll_no`, `subject_code` and `grade`. Each band includes its lower bound (exactly 80 is `A+`). Order the rows by `roll_no`, then by `subject_code`.",
    ].join("\n"),
    tables: [
      {
        name: "ExamResult",
        columns: [
          { name: "roll_no", type: "int" },
          { name: "subject_code", type: "varchar" },
          { name: "marks", type: "int" },
        ],
        primaryKey: ["roll_no", "subject_code"],
        note: "`marks` is a whole number from 0 to 100, or NULL when the student was absent from the exam.",
      },
    ],
    examples: [
      {
        ExamResult: [
          [2101, "MA101", 92],
          [2101, "PH102", 80],
          [2102, "MA101", 39],
          [2102, "PH102", null],
          [2103, "MA101", 40],
          [2103, "CS103", 69],
          [2104, "CS103", 75],
          [2104, "MA101", 55],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const roll of sample(rng, seq(2101, 15), ri(rng, 1, 7))) {
        for (const sub of sample(rng, SUBJECTS, ri(rng, 1, 3))) {
          // Band edges often, since an off-by-one there is the usual mistake.
          const marks = chance(rng, 0.1) ? null : chance(rng, 0.4) ? pick(rng, [39, 40, 49, 50, 59, 60, 69, 70, 79, 80, 89, 90, 100]) : ri(rng, 0, 100);
          rows.push([roll, sub, marks]);
        }
      }
      return { ExamResult: rows };
    },
    solution: [
      "SELECT roll_no, subject_code,",
      "       CASE",
      "         WHEN marks IS NULL THEN 'AB'",
      "         WHEN marks >= 90 THEN 'O'",
      "         WHEN marks >= 80 THEN 'A+'",
      "         WHEN marks >= 70 THEN 'A'",
      "         WHEN marks >= 60 THEN 'B+'",
      "         WHEN marks >= 50 THEN 'B'",
      "         WHEN marks >= 40 THEN 'C'",
      "         ELSE 'F'",
      "       END AS grade",
      "FROM ExamResult",
      "ORDER BY roll_no, subject_code",
    ].join("\n"),
    alternatives: [
      "SELECT roll_no, subject_code, IF(marks IS NULL, 'AB', IF(marks >= 90, 'O', IF(marks >= 80, 'A+', IF(marks >= 70, 'A', IF(marks >= 60, 'B+', IF(marks >= 50, 'B', IF(marks >= 40, 'C', 'F'))))))) AS grade FROM ExamResult ORDER BY roll_no, subject_code",
      "SELECT roll_no, subject_code, CASE WHEN marks BETWEEN 90 AND 100 THEN 'O' WHEN marks BETWEEN 80 AND 89 THEN 'A+' WHEN marks BETWEEN 70 AND 79 THEN 'A' WHEN marks BETWEEN 60 AND 69 THEN 'B+' WHEN marks BETWEEN 50 AND 59 THEN 'B' WHEN marks BETWEEN 40 AND 49 THEN 'C' WHEN marks < 40 THEN 'F' ELSE 'AB' END AS grade FROM ExamResult ORDER BY 1, 2",
    ],
    ordered: true,
    hints: [
      "A CASE expression returns the first branch whose condition holds, so the order of the branches matters.",
      "Test the bands from the top down with `>=`, and each branch only needs its lower bound.",
      "A NULL fails every comparison — give absentees their own branch first, or let them fall through to the right default.",
    ],
    editorial: [
      "Mapping a number onto bands is what a searched **CASE** is for. CASE checks its WHEN conditions in order and returns the first one that is true, so listing the bands from the highest down lets each branch test only its lower bound: an 85 fails `>= 90`, passes `>= 80`, and stops there as `A+`.",
      "",
      "NULL needs care. `NULL >= 90` is unknown, not false, but CASE treats unknown like false and moves on — so without a branch of its own an absentee would reach `ELSE 'F'` and be failed rather than marked absent. Testing `marks IS NULL` first (or making `AB` the ELSE after every band, as the BETWEEN version does) fixes that.",
      "",
      "Nested `IF` calls do the same job less readably. The query is a single scan with no grouping.",
    ].join("\n"),
  },

  {
    slug: "faculty-names-for-id-cards",
    title: "Faculty Names Formatted for ID Cards",
    difficulty: "EASY",
    topics: ["Strings", "Conditional Logic"],
    description: [
      "The college is printing new staff ID cards. A card shows the faculty member's first initial, a full stop and a space, then the surname in capitals — `R. SHARMA` — and holders of a PhD get the prefix `Dr. ` — `Dr. R. SHARMA`.",
      "",
      "Return every faculty member with the columns `faculty_id` and `card_name` built that way. `has_phd` is 1 for a PhD holder and 0 otherwise. Order the rows by `faculty_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Faculty",
        columns: [
          { name: "faculty_id", type: "int" },
          { name: "first_name", type: "varchar" },
          { name: "last_name", type: "varchar" },
          { name: "designation", type: "enum", values: ["Professor", "Associate Professor", "Assistant Professor", "Lecturer"] },
          { name: "has_phd", type: "bool" },
        ],
        primaryKey: ["faculty_id"],
        note: "Names are stored with a capital first letter (`Rahul`, `Sharma`).",
      },
    ],
    examples: [
      {
        Faculty: [
          [301, "Rahul", "Sharma", "Professor", 1],
          [302, "Ananya", "Iyer", "Assistant Professor", 0],
          [303, "Farhan", "Khan", "Associate Professor", 1],
          [304, "Ira", "Bose", "Lecturer", 0],
          [305, "Tanvi", "Menon", "Assistant Professor", 1],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const who = names(rng, n);
      const desig = ["Professor", "Associate Professor", "Assistant Professor", "Lecturer"] as const;
      return {
        Faculty: who.map((first, i) => [301 + i, first, pick(rng, LAST_NAMES), pick(rng, desig), chance(rng, 0.5) ? 1 : 0]),
      };
    },
    solution: [
      "SELECT faculty_id,",
      "       CONCAT(CASE WHEN has_phd = 1 THEN 'Dr. ' ELSE '' END, LEFT(first_name, 1), '. ', UPPER(last_name)) AS card_name",
      "FROM Faculty",
      "ORDER BY faculty_id",
    ].join("\n"),
    alternatives: [
      "SELECT faculty_id, CONCAT(IF(has_phd = 1, 'Dr. ', ''), SUBSTRING(first_name, 1, 1), '. ', UCASE(last_name)) AS card_name FROM Faculty ORDER BY faculty_id",
      "SELECT faculty_id, CONCAT_WS(' ', CASE WHEN has_phd = 1 THEN 'Dr.' END, CONCAT(LEFT(first_name, 1), '.'), UPPER(last_name)) AS card_name FROM Faculty ORDER BY faculty_id ASC",
    ],
    ordered: true,
    hints: [
      "Build the card name from four pieces: an optional prefix, the initial, the separator `. ` and the surname.",
      "`LEFT(first_name, 1)` is the initial and `UPPER(last_name)` the capitalised surname.",
      "The prefix is a CASE or IF that yields `'Dr. '` or an empty string — not NULL, because CONCAT with a NULL argument is NULL.",
    ],
    editorial: [
      "The card name is a concatenation of pieces, one of which depends on a condition. `LEFT(first_name, 1)` takes the initial, `UPPER(last_name)` capitalises the surname, and the literal `'. '` sits between them.",
      "",
      "The prefix is `CASE WHEN has_phd = 1 THEN 'Dr. ' ELSE '' END`. The empty string in the ELSE matters: in MySQL `CONCAT` returns NULL if **any** argument is NULL, so a CASE without an ELSE would blank out every card for staff without a PhD.",
      "",
      "`CONCAT_WS` behaves the other way round — it skips NULL arguments — so the alternative leaves the prefix NULL for non-PhD staff and lets `CONCAT_WS(' ', …)` drop it, putting single spaces between the remaining parts. Both are a single pass over the table.",
    ].join("\n"),
  },

  {
    slug: "accepted-offers-of-ten-lpa-or-more",
    title: "Students Who Accepted Offers of 10 LPA or More",
    difficulty: "EASY",
    topics: ["Joins", "Basics"],
    description: [
      "The placement cell's brochure lists the students who **accepted** an offer with a CTC of **10 LPA or more** (lakh rupees per annum). Declined and revoked offers are not shown, however high.",
      "",
      "Return the columns `name`, `branch`, `company` and `ctc_lpa`, one row per qualifying offer. Exactly 10 LPA qualifies. Order the rows by `ctc_lpa` **highest first**, then by `name`, then by `company`.",
    ].join("\n"),
    tables: [
      {
        name: "Student",
        columns: [
          { name: "roll_no", type: "int" },
          { name: "name", type: "varchar" },
          { name: "branch", type: "varchar" },
        ],
        primaryKey: ["roll_no"],
        note: "One row per final-year student; names are unique.",
      },
      {
        name: "Offer",
        columns: [
          { name: "offer_id", type: "int" },
          { name: "roll_no", type: "int" },
          { name: "company", type: "varchar" },
          { name: "ctc_lpa", type: "decimal" },
          { name: "offer_status", type: "enum", values: ["accepted", "declined", "revoked"] },
        ],
        primaryKey: ["offer_id"],
        note: "`ctc_lpa` has one decimal place; `roll_no` is always in `Student`.",
      },
    ],
    examples: [
      {
        Student: [
          [2101, "Aarav", "CSE"],
          [2102, "Diya", "ECE"],
          [2103, "Ishaan", "CSE"],
          [2104, "Kavya", "MECH"],
          [2105, "Neha", "IT"],
        ],
        Offer: [
          [1, 2101, "Atlassian", 32.5, "accepted"],
          [2, 2102, "TCS", 7.0, "accepted"],
          [3, 2103, "Razorpay", 18.0, "declined"],
          [4, 2103, "Zoho", 10.0, "accepted"],
          [5, 2104, "Flipkart", 24.0, "revoked"],
          [6, 2105, "Swiggy", 10.0, "accepted"],
          [7, 2101, "Infosys", 9.5, "declined"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const who = names(rng, n);
      const students = who.map((name, i) => [2101 + i, name, pick(rng, BRANCHES)]);
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 14);
      const status = ["accepted", "accepted", "declined", "revoked"] as const;
      return {
        Student: students,
        Offer: seq(1, m).map((id) => [
          id,
          2101 + ri(rng, 0, n - 1),
          pick(rng, COMPANIES),
          chance(rng, 0.25) ? 10 : ri(rng, 35, 400) / 10,
          pick(rng, status),
        ]),
      };
    },
    solution: [
      "SELECT s.name, s.branch, o.company, o.ctc_lpa",
      "FROM Offer o",
      "JOIN Student s ON s.roll_no = o.roll_no",
      "WHERE o.offer_status = 'accepted' AND o.ctc_lpa >= 10",
      "ORDER BY o.ctc_lpa DESC, s.name, o.company",
    ].join("\n"),
    alternatives: [
      "SELECT s.name, s.branch, o.company, o.ctc_lpa FROM Student s, Offer o WHERE s.roll_no = o.roll_no AND o.offer_status = 'accepted' AND NOT o.ctc_lpa < 10 ORDER BY 4 DESC, 1, 3",
    ],
    ordered: true,
    hints: [
      "The name and branch live in `Student`, the company and CTC in `Offer` — join them on the roll number.",
      "Two conditions must both hold: the status, and the CTC with `>=` so that exactly 10 is in.",
      "Order by three keys so that two students on the same CTC always come out the same way.",
    ],
    editorial: [
      "Every row of the answer is an offer, decorated with the student's name and branch, so join `Offer` to `Student` on `roll_no` — an inner join, since every offer belongs to a student.",
      "",
      "Then filter: `offer_status = 'accepted'` removes declined and revoked offers, and `ctc_lpa >= 10` keeps the 10 LPA offers that a strict `>` would lose. A student with two accepted offers above the line appears twice, once per offer, which is what one row per offer means.",
      "",
      "The order has three keys — CTC descending, then name, then company — because CTCs repeat often (10.0 is common) and only a full key makes the order unique. The join uses the student's primary key, so the cost is one pass over the offers.",
    ].join("\n"),
  },

  // ───────────────────────────── MEDIUM ─────────────────────────────
  {
    slug: "first-student-to-submit-each-assignment",
    title: "First Student to Submit Each Assignment",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Joins"],
    description: [
      "A course portal gives a bonus mark to the first student who submits each assignment. Students may submit several times; any submission counts.",
      "",
      "For every assignment that has at least one submission, return `assignment_id`, `title`, `roll_no` (the first submitter) and `submitted_at` (their earliest submission). When two students submitted at the **same second**, the lower `roll_no` wins. Assignments without submissions are not listed. Order the rows by `assignment_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Assignment",
        columns: [
          { name: "assignment_id", type: "int" },
          { name: "course_code", type: "varchar" },
          { name: "title", type: "varchar" },
          { name: "due_at", type: "datetime" },
        ],
        primaryKey: ["assignment_id"],
        note: "One row per assignment released on the portal.",
      },
      {
        name: "Submission",
        columns: [
          { name: "submission_id", type: "int" },
          { name: "assignment_id", type: "int" },
          { name: "roll_no", type: "int" },
          { name: "submitted_at", type: "datetime" },
        ],
        primaryKey: ["submission_id"],
        note: "One row per upload; `assignment_id` is always in `Assignment`.",
      },
    ],
    examples: [
      {
        Assignment: [
          [1, "CS301", "Process Scheduling", "2024-09-10 23:59:00"],
          [2, "CS301", "Deadlock Detection", "2024-09-24 23:59:00"],
          [3, "MA201", "Bayes Problem Set", "2024-09-15 23:59:00"],
        ],
        Submission: [
          [1, 1, 2103, "2024-09-08 21:14:05"],
          [2, 1, 2101, "2024-09-08 19:02:40"],
          [3, 1, 2102, "2024-09-09 10:00:00"],
          [4, 1, 2101, "2024-09-07 22:30:00"],
          [5, 3, 2104, "2024-09-12 18:45:10"],
          [6, 3, 2102, "2024-09-12 18:45:10"],
          [7, 3, 2105, "2024-09-13 08:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const TITLES = ["Process Scheduling", "Deadlock Detection", "Bayes Problem Set", "Lab Record 3", "Mini Project Proposal"];
      const k = ri(rng, 1, 5);
      const assignments = seq(1, k).map((id) => [id, pick(rng, COURSE_CODES), TITLES[id - 1]!, `2024-09-${String(10 + id * 2).padStart(2, "0")} 23:59:00`]);
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 16);
      const stamps = ["2024-09-08 19:02:40", "2024-09-08 21:14:05", "2024-09-09 10:00:00", "2024-09-09 10:00:00", "2024-09-10 07:30:15", "2024-09-11 23:58:59"];
      return {
        Assignment: assignments,
        Submission: seq(1, m).map((id) => [id, ri(rng, 1, k), ri(rng, 2101, 2110), pick(rng, stamps)]),
      };
    },
    solution: [
      "WITH ranked AS (",
      "  SELECT assignment_id, roll_no, submitted_at,",
      "         ROW_NUMBER() OVER (PARTITION BY assignment_id ORDER BY submitted_at, roll_no) AS rn",
      "  FROM Submission",
      ")",
      "SELECT a.assignment_id, a.title, r.roll_no, r.submitted_at",
      "FROM ranked r",
      "JOIN Assignment a ON a.assignment_id = r.assignment_id",
      "WHERE r.rn = 1",
      "ORDER BY a.assignment_id",
    ].join("\n"),
    alternatives: [
      "SELECT a.assignment_id, a.title, s.roll_no, s.submitted_at FROM Assignment a JOIN Submission s ON s.assignment_id = a.assignment_id WHERE NOT EXISTS (SELECT 1 FROM Submission t WHERE t.assignment_id = s.assignment_id AND (t.submitted_at < s.submitted_at OR (t.submitted_at = s.submitted_at AND t.roll_no < s.roll_no))) GROUP BY a.assignment_id, a.title, s.roll_no, s.submitted_at ORDER BY a.assignment_id",
      "SELECT a.assignment_id, a.title, MIN(s.roll_no) AS roll_no, s.submitted_at FROM Assignment a JOIN Submission s ON s.assignment_id = a.assignment_id WHERE s.submitted_at = (SELECT MIN(t.submitted_at) FROM Submission t WHERE t.assignment_id = a.assignment_id) GROUP BY a.assignment_id, a.title, s.submitted_at ORDER BY a.assignment_id",
    ],
    ordered: true,
    hints: [
      "Within each assignment, put the submissions in time order and take the first one.",
      "`ROW_NUMBER() OVER (PARTITION BY assignment_id ORDER BY …)` numbers the submissions of each assignment from 1.",
      "Add `roll_no` as a second ordering key so that a tie on the timestamp has exactly one winner.",
    ],
    editorial: [
      "This is the classic **first row per group**. `ROW_NUMBER()` partitioned by `assignment_id` and ordered by `submitted_at` numbers each assignment's submissions in time order; the row numbered 1 is the earliest. Ordering by `roll_no` as a second key settles a tie on the same second the way the statement asks — without it, which of two simultaneous uploads gets number 1 is up to the engine.",
      "",
      "A student who uploaded several times appears several times in the partition, but only their earliest upload can be first, so nothing special is needed for resubmissions. Joining to `Assignment` afterwards adds the title, and the inner join naturally leaves out assignments nobody submitted.",
      "",
      "Without window functions, take the earliest timestamp per assignment with a correlated `MIN` and then the smallest roll number among the submissions at that time, or keep a submission only if NOT EXISTS an earlier (or equally early, lower-roll) one. The window version sorts each partition once and is the cheapest to read.",
    ].join("\n"),
  },

  {
    slug: "monthly-fee-collection-by-payment-mode",
    title: "Monthly Fee Collection by Payment Mode",
    difficulty: "MEDIUM",
    topics: ["Dates", "Conditional Logic", "Aggregation"],
    description: [
      "The college bursar reports fee collections each month split by how the money came in, to reconcile against the UPI settlement and card gateway statements.",
      "",
      "Return one row per calendar month that has at least one payment, with the columns `month` (as `'YYYY-MM'`), `upi_amount`, `card_amount`, `other_amount` (net banking and cash together) and `total_amount`, all in rupees. A mode with no payments in a month shows 0, never NULL. Order the rows by `month`.",
    ].join("\n"),
    tables: [
      {
        name: "FeePayment",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "roll_no", type: "int" },
          { name: "amount", type: "int" },
          { name: "paid_on", type: "date" },
          { name: "mode", type: "enum", values: ["UPI", "Card", "NetBanking", "Cash"] },
        ],
        primaryKey: ["payment_id"],
        note: "One row per successful payment; `amount` is in rupees.",
      },
    ],
    examples: [
      {
        FeePayment: [
          [1, 2101, 42000, "2024-07-03", "UPI"],
          [2, 2102, 42000, "2024-07-05", "Card"],
          [3, 2103, 85000, "2024-07-29", "NetBanking"],
          [4, 2104, 12500, "2024-08-01", "UPI"],
          [5, 2101, 12500, "2024-08-14", "UPI"],
          [6, 2105, 3000, "2024-08-20", "Cash"],
          [7, 2106, 85000, "2024-10-02", "Card"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.1) ? 0 : ri(rng, 1, 18);
      const modes = ["UPI", "UPI", "Card", "NetBanking", "Cash"] as const;
      return {
        FeePayment: seq(1, n).map((id) => [
          id,
          ri(rng, 2101, 2120),
          pick(rng, [3000, 12500, 42000, 85000]),
          dateBetween(rng, "2024-06-25", "2024-10-05"),
          pick(rng, modes),
        ]),
      };
    },
    solution: [
      "SELECT DATE_FORMAT(paid_on, '%Y-%m') AS month,",
      "       SUM(CASE WHEN mode = 'UPI' THEN amount ELSE 0 END) AS upi_amount,",
      "       SUM(CASE WHEN mode = 'Card' THEN amount ELSE 0 END) AS card_amount,",
      "       SUM(CASE WHEN mode IN ('NetBanking', 'Cash') THEN amount ELSE 0 END) AS other_amount,",
      "       SUM(amount) AS total_amount",
      "FROM FeePayment",
      "GROUP BY DATE_FORMAT(paid_on, '%Y-%m')",
      "ORDER BY month",
    ].join("\n"),
    alternatives: [
      "SELECT m AS month, SUM(IF(mode = 'UPI', amount, 0)) AS upi_amount, SUM(IF(mode = 'Card', amount, 0)) AS card_amount, SUM(IF(mode = 'UPI' OR mode = 'Card', 0, amount)) AS other_amount, SUM(amount) AS total_amount FROM (SELECT CONCAT(YEAR(paid_on), '-', LPAD(MONTH(paid_on), 2, '0')) AS m, mode, amount FROM FeePayment) t GROUP BY m ORDER BY m",
      "SELECT DATE_FORMAT(paid_on, '%Y-%m') AS month, COALESCE(SUM(CASE WHEN mode = 'UPI' THEN amount END), 0) AS upi_amount, COALESCE(SUM(CASE WHEN mode = 'Card' THEN amount END), 0) AS card_amount, COALESCE(SUM(CASE WHEN mode IN ('NetBanking', 'Cash') THEN amount END), 0) AS other_amount, SUM(amount) AS total_amount FROM FeePayment GROUP BY 1 ORDER BY 1",
    ],
    ordered: true,
    hints: [
      "Group the payments by month — `DATE_FORMAT(paid_on, '%Y-%m')` turns a date into its month label.",
      "Each mode column is a SUM over only some rows of the group: put a CASE inside the SUM.",
      "A CASE without ELSE yields NULL, and SUM of only NULLs is NULL — use `ELSE 0`.",
    ],
    editorial: [
      "One row per month means grouping by the month, and `DATE_FORMAT(paid_on, '%Y-%m')` produces exactly the label the statement wants. Grouping by `MONTH(paid_on)` alone would merge July 2024 with July 2025, so keep the year in the key.",
      "",
      "The split by mode is **conditional aggregation**: inside the same group, `SUM(CASE WHEN mode = 'UPI' THEN amount ELSE 0 END)` adds only the UPI rows, and so on for each column. `ELSE 0` is what makes a mode with no payments that month read 0; without it the CASE yields NULL for every row and the SUM is NULL — the third query shows the COALESCE fix instead.",
      "",
      "`total_amount` is a plain `SUM(amount)`, which equals the three mode columns added up because every payment has exactly one mode. Months with no payments simply have no group, so they do not appear. The whole report is one pass over the payments.",
    ].join("\n"),
  },
  {
    slug: "courses-where-over-a-quarter-failed",
    title: "Courses Where More Than a Quarter of Students Failed",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "The academic council reviews any course in which **more than 25%** of the students who sat the end-semester exam failed it. A student fails with marks **below 40**; students absent from the exam (`marks` NULL) did not sit it and are left out of both counts.",
      "",
      "Return `course_code`, `appeared` (students who sat), `failed` and `fail_pct` (failed as a percentage of appeared, **rounded to 2 decimal places**) for every course above the line. Exactly 25% is not flagged. Order the rows by `fail_pct` **highest first**, then by `course_code`.",
    ].join("\n"),
    tables: [
      {
        name: "EndSemResult",
        columns: [
          { name: "roll_no", type: "int" },
          { name: "course_code", type: "varchar" },
          { name: "marks", type: "int" },
        ],
        primaryKey: ["roll_no", "course_code"],
        note: "One row per registered student per course; `marks` is out of 100, or NULL when the student was absent.",
      },
    ],
    examples: [
      {
        EndSemResult: [
          [2101, "CS301", 35],
          [2102, "CS301", 62],
          [2103, "CS301", 38],
          [2104, "CS301", 71],
          [2101, "MA201", 39],
          [2102, "MA201", 40],
          [2103, "MA201", 55],
          [2104, "MA201", 81],
          [2101, "EC210", 22],
          [2102, "EC210", null],
          [2103, "EC210", 64],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const code of sample(rng, COURSE_CODES, ri(rng, 1, 5))) {
        const rolls = sample(rng, seq(2101, 12), ri(rng, 1, 8));
        const hard = rng();
        for (const roll of rolls) {
          const marks = chance(rng, 0.1) ? null : chance(rng, hard * 0.6) ? ri(rng, 10, 39) : pick(rng, [40, ri(rng, 40, 95)]);
          rows.push([roll, code, marks]);
        }
      }
      return { EndSemResult: rows };
    },
    solution: [
      "SELECT course_code,",
      "       COUNT(marks) AS appeared,",
      "       SUM(CASE WHEN marks < 40 THEN 1 ELSE 0 END) AS failed,",
      "       ROUND(100 * SUM(CASE WHEN marks < 40 THEN 1 ELSE 0 END) / COUNT(marks), 2) AS fail_pct",
      "FROM EndSemResult",
      "WHERE marks IS NOT NULL",
      "GROUP BY course_code",
      "HAVING SUM(CASE WHEN marks < 40 THEN 1 ELSE 0 END) * 4 > COUNT(marks)",
      "ORDER BY fail_pct DESC, course_code",
    ].join("\n"),
    alternatives: [
      "SELECT course_code, appeared, failed, ROUND(100 * failed / appeared, 2) AS fail_pct FROM (SELECT course_code, COUNT(*) AS appeared, SUM(IF(marks < 40, 1, 0)) AS failed FROM EndSemResult WHERE marks IS NOT NULL GROUP BY course_code) t WHERE failed * 4 > appeared ORDER BY fail_pct DESC, course_code ASC",
      "SELECT course_code, COUNT(marks) AS appeared, COUNT(CASE WHEN marks < 40 THEN 1 END) AS failed, ROUND(100 * COUNT(CASE WHEN marks < 40 THEN 1 END) / COUNT(marks), 2) AS fail_pct FROM EndSemResult GROUP BY course_code HAVING COUNT(marks) > 0 AND COUNT(CASE WHEN marks < 40 THEN 1 END) * 4 > COUNT(marks) ORDER BY 4 DESC, 1",
    ],
    ordered: true,
    hints: [
      "Count, per course, two things at once: the students who sat and the students who failed.",
      "A CASE inside SUM (or COUNT) counts only the rows that meet a condition.",
      "The threshold is a condition on the group, so it belongs in HAVING — and compare counts as integers (`failed * 4 > appeared`) rather than rounded percentages.",
    ],
    editorial: [
      "Group the results by course and compute two counts per group. `COUNT(marks)` counts only non-NULL marks, so absentees drop out of `appeared` by themselves (filtering `marks IS NOT NULL` in WHERE does the same and also removes them from every other aggregate). The failures are a **conditional count**: `SUM(CASE WHEN marks < 40 THEN 1 ELSE 0 END)`, or `COUNT(CASE WHEN marks < 40 THEN 1 END)`, which counts the non-NULL results of the CASE.",
      "",
      "Whether a course is flagged depends on the whole group, so the test goes in **HAVING**. Writing it as `failed * 4 > appeared` keeps it in integers: exactly a quarter (1 of 4, 2 of 8) is not flagged, and no rounded percentage can push a course over the line by accident. A course where every student was absent has `appeared` = 0 and is never flagged.",
      "",
      "The displayed `fail_pct` is rounded only for output. One scan and one group-by.",
    ].join("\n"),
  },

  {
    slug: "students-above-their-section-average",
    title: "Students Scoring Above Their Section's Internal Average",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Window Functions"],
    description: [
      "After the first internal assessment, each class teacher wants to know which students in their section scored **above the section's average**. Each section is compared only with itself.",
      "",
      "Return `roll_no`, `name`, `section`, `marks` and `section_avg` (the average marks of the student's section, **rounded to 2 decimal places**) for every student whose marks are **strictly greater** than their section's average. Order the rows by `section`, then by `marks` **highest first**, then by `roll_no`.",
    ].join("\n"),
    tables: [
      {
        name: "InternalMark",
        columns: [
          { name: "roll_no", type: "int" },
          { name: "name", type: "varchar" },
          { name: "section", type: "char" },
          { name: "marks", type: "int" },
        ],
        primaryKey: ["roll_no"],
        note: "One row per student; `marks` is out of 50 and never NULL; `section` is `A`, `B` or `C`.",
      },
    ],
    examples: [
      {
        InternalMark: [
          [2101, "Aarav", "A", 42],
          [2102, "Diya", "A", 30],
          [2103, "Ishaan", "A", 36],
          [2104, "Kavya", "B", 25],
          [2105, "Neha", "B", 25],
          [2106, "Rohan", "B", 40],
          [2107, "Sneha", "C", 33],
          [2108, "Vikram", "C", 33],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 16);
      const who = names(rng, n);
      return {
        InternalMark: who.map((name, i) => [2101 + i, name, pick(rng, ["A", "B", "C"]), chance(rng, 0.2) ? 33 : ri(rng, 10, 50)]),
      };
    },
    solution: [
      "SELECT m.roll_no, m.name, m.section, m.marks,",
      "       ROUND((SELECT AVG(x.marks) FROM InternalMark x WHERE x.section = m.section), 2) AS section_avg",
      "FROM InternalMark m",
      "WHERE m.marks > (SELECT AVG(x.marks) FROM InternalMark x WHERE x.section = m.section)",
      "ORDER BY m.section, m.marks DESC, m.roll_no",
    ].join("\n"),
    alternatives: [
      "SELECT roll_no, name, section, marks, ROUND(avg_marks, 2) AS section_avg FROM (SELECT roll_no, name, section, marks, AVG(marks) OVER (PARTITION BY section) AS avg_marks FROM InternalMark) t WHERE marks > avg_marks ORDER BY section, marks DESC, roll_no",
      "SELECT m.roll_no, m.name, m.section, m.marks, ROUND(s.avg_marks, 2) AS section_avg FROM InternalMark m JOIN (SELECT section, AVG(marks) AS avg_marks FROM InternalMark GROUP BY section) s ON s.section = m.section WHERE m.marks > s.avg_marks ORDER BY 3, 4 DESC, 1",
    ],
    ordered: true,
    hints: [
      "Each student needs a number computed over other rows — their section's average.",
      "A correlated subquery `(SELECT AVG(marks) … WHERE section = m.section)` gives that number for the outer row's section.",
      "Compare with the unrounded average; round only the copy you display. A section where everyone scored the same has nobody above it.",
    ],
    editorial: [
      "The comparison is between a row and an aggregate over its own group. A **correlated subquery** expresses it directly: for each outer row `m`, `(SELECT AVG(x.marks) FROM InternalMark x WHERE x.section = m.section)` is the average of that student's section, and the WHERE clause keeps the student when their marks are strictly greater.",
      "",
      "Two other forms compute each section's average only once. A derived table grouped by section, joined back on `section`, gives every student their section average as a column. A window `AVG(marks) OVER (PARTITION BY section)` does the same without a join, though the filter must then go in an outer query because WHERE cannot see window results.",
      "",
      "Compare against the exact average and round only the displayed `section_avg`: in a section averaging 33.33, a student with 33 is below it even though the rounded figure looks close. Students level with the average, including whole sections of equal marks, are excluded by the strict comparison.",
    ].join("\n"),
  },

  {
    slug: "course-completion-percentage-per-learner",
    title: "Course Completion Percentage for Each Learner",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation"],
    description: [
      "On an online learning platform a learner's progress row is created when they open a lesson, and `completed_at` is filled in when they finish it. The learner dashboard shows, for each course a learner has started, how much of it they have finished.",
      "",
      "For every learner and every course in which the learner has **at least one progress row**, return `learner_id`, `course_title`, `lessons_done` (lessons with `completed_at` set), `total_lessons` (all lessons of the course) and `completion_pct` (`lessons_done` over `total_lessons` as a percentage, **rounded to 2 decimal places**). Order the rows by `learner_id`, then by `course_title`.",
    ].join("\n"),
    tables: [
      {
        name: "Course",
        columns: [
          { name: "course_id", type: "int" },
          { name: "course_title", type: "varchar" },
        ],
        primaryKey: ["course_id"],
        note: "Course titles are unique.",
      },
      {
        name: "Lesson",
        columns: [
          { name: "lesson_id", type: "int" },
          { name: "course_id", type: "int" },
          { name: "position", type: "int" },
        ],
        primaryKey: ["lesson_id"],
        note: "Every lesson belongs to one course in `Course`; `position` is its order in the course.",
      },
      {
        name: "LessonProgress",
        columns: [
          { name: "learner_id", type: "int" },
          { name: "lesson_id", type: "int" },
          { name: "opened_at", type: "datetime" },
          { name: "completed_at", type: "datetime" },
        ],
        primaryKey: ["learner_id", "lesson_id"],
        note: "At most one row per learner and lesson; `completed_at` is NULL while the lesson is unfinished.",
      },
    ],
    examples: [
      {
        Course: [
          [1, "SQL for Analysts"],
          [2, "Python Foundations"],
          [3, "Spoken English"],
        ],
        Lesson: [
          [11, 1, 1], [12, 1, 2], [13, 1, 3], [14, 1, 4],
          [21, 2, 1], [22, 2, 2], [23, 2, 3],
          [31, 3, 1],
        ],
        LessonProgress: [
          [501, 11, "2024-05-01 09:00:00", "2024-05-01 09:40:00"],
          [501, 12, "2024-05-02 20:10:00", "2024-05-02 20:55:00"],
          [501, 13, "2024-05-04 21:00:00", null],
          [501, 21, "2024-05-03 07:15:00", "2024-05-03 07:50:00"],
          [502, 21, "2024-05-05 18:00:00", null],
          [503, 11, "2024-05-06 10:00:00", "2024-05-06 10:30:00"],
          [503, 12, "2024-05-06 10:31:00", "2024-05-06 11:05:00"],
          [503, 13, "2024-05-07 10:00:00", "2024-05-07 10:20:00"],
          [503, 14, "2024-05-07 10:21:00", "2024-05-07 11:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const TITLES = ["SQL for Analysts", "Python Foundations", "Spoken English", "Data Structures in Java", "Excel for Finance"];
      const k = ri(rng, 1, 4);
      const courses = seq(1, k).map((id) => [id, TITLES[id - 1]!]);
      const lessons: Cell[][] = [];
      for (let c = 1; c <= k; c++) for (let p = 1; p <= ri(rng, 1, 6); p++) lessons.push([c * 10 + p, c, p]);
      const progress: Cell[][] = [];
      for (const learner of sample(rng, seq(501, 6), ri(rng, 0, 4))) {
        for (const l of sample(rng, lessons, ri(rng, 1, Math.min(8, lessons.length)))) {
          const day = dateBetween(rng, "2024-05-01", "2024-05-20");
          progress.push([learner, l[0]!, `${day} 09:00:00`, chance(rng, 0.65) ? `${day} 09:45:00` : null]);
        }
      }
      return { Course: courses, Lesson: lessons, LessonProgress: progress };
    },
    solution: [
      "WITH totals AS (",
      "  SELECT course_id, COUNT(*) AS total_lessons FROM Lesson GROUP BY course_id",
      ")",
      "SELECT p.learner_id, c.course_title,",
      "       COUNT(p.completed_at) AS lessons_done,",
      "       t.total_lessons,",
      "       ROUND(100 * COUNT(p.completed_at) / t.total_lessons, 2) AS completion_pct",
      "FROM LessonProgress p",
      "JOIN Lesson l ON l.lesson_id = p.lesson_id",
      "JOIN Course c ON c.course_id = l.course_id",
      "JOIN totals t ON t.course_id = l.course_id",
      "GROUP BY p.learner_id, c.course_title, t.total_lessons",
      "ORDER BY p.learner_id, c.course_title",
    ].join("\n"),
    alternatives: [
      "SELECT p.learner_id, c.course_title, SUM(CASE WHEN p.completed_at IS NOT NULL THEN 1 ELSE 0 END) AS lessons_done, (SELECT COUNT(*) FROM Lesson x WHERE x.course_id = c.course_id) AS total_lessons, ROUND(100 * SUM(CASE WHEN p.completed_at IS NOT NULL THEN 1 ELSE 0 END) / (SELECT COUNT(*) FROM Lesson x WHERE x.course_id = c.course_id), 2) AS completion_pct FROM LessonProgress p JOIN Lesson l ON l.lesson_id = p.lesson_id JOIN Course c ON c.course_id = l.course_id GROUP BY p.learner_id, c.course_id, c.course_title ORDER BY p.learner_id, c.course_title",
    ],
    ordered: true,
    hints: [
      "The progress rows know the lesson, the lesson knows its course: join them to group by learner and course.",
      "`COUNT(completed_at)` counts only the finished lessons, because COUNT skips NULLs.",
      "The total number of lessons of a course comes from `Lesson` alone — count it separately (a CTE or subquery), not from the learner's progress rows.",
    ],
    editorial: [
      "Two counts with different sources meet in this report. The **finished lessons** come from the learner's progress: join `LessonProgress` to `Lesson` to learn each lesson's course, group by learner and course, and `COUNT(p.completed_at)` — COUNT of a column skips NULLs, so opened-but-unfinished lessons are not counted.",
      "",
      "The **total lessons** must not come from that same join: a learner's progress rows cover only the lessons they opened, so counting them would make every started course look nearly complete. Count lessons per course once in a CTE (or a correlated subquery) and join it in; since it is one value per course, it can sit in the GROUP BY.",
      "",
      "Starting from `LessonProgress` limits the rows to courses the learner has touched, as the statement wants. The percentage is `100 * done / total`, rounded for display. Each table is read once; the CTE is a small aggregate over the lesson catalogue.",
    ].join("\n"),
  },

  {
    slug: "sgpa-drop-of-more-than-one-point",
    title: "Students Whose SGPA Fell by More Than One Point",
    difficulty: "MEDIUM",
    topics: ["Window Functions"],
    description: [
      "The student-mentoring cell calls in anyone whose SGPA fell sharply from one semester to the next. Some students have a gap in their record (a semester dropped for medical reasons), so each semester is compared with the student's **previous recorded semester**, whatever its number.",
      "",
      "Return `roll_no`, `semester`, `previous_sgpa`, `sgpa` and `sgpa_drop` (`previous_sgpa - sgpa`, **rounded to 2 decimal places**) for every semester where the rounded drop is **greater than 1.00**. A drop of exactly 1.00 is not flagged, and a student's first recorded semester has nothing to compare with. Order the rows by `roll_no`, then by `semester`.",
    ].join("\n"),
    tables: [
      {
        name: "SemesterResult",
        columns: [
          { name: "roll_no", type: "int" },
          { name: "semester", type: "int" },
          { name: "sgpa", type: "decimal" },
        ],
        primaryKey: ["roll_no", "semester"],
        note: "`semester` runs from 1 to 8; `sgpa` is on a 10-point scale with two decimals.",
      },
    ],
    examples: [
      {
        SemesterResult: [
          [2101, 1, 8.42],
          [2101, 2, 7.10],
          [2101, 3, 7.35],
          [2102, 1, 9.10],
          [2102, 2, 8.10],
          [2102, 4, 6.75],
          [2103, 1, 6.20],
          [2103, 2, 7.90],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const roll of sample(rng, seq(2101, 12), ri(rng, 1, 6))) {
        let g = ri(rng, 600, 980) / 100;
        for (let sem = 1; sem <= 8; sem++) {
          if (sem > 1 && chance(rng, 0.15)) continue;
          if (chance(rng, 0.25)) break;
          rows.push([roll, sem, g]);
          // Steps of exactly 1.00 now and then, the boundary the statement is about.
          const step = chance(rng, 0.2) ? -1 : ri(rng, -200, 120) / 100;
          g = Math.min(10, Math.max(4, Math.round((g + step) * 100) / 100));
        }
      }
      return { SemesterResult: rows };
    },
    solution: [
      "WITH seq AS (",
      "  SELECT roll_no, semester, sgpa,",
      "         LAG(sgpa) OVER (PARTITION BY roll_no ORDER BY semester) AS previous_sgpa",
      "  FROM SemesterResult",
      ")",
      "SELECT roll_no, semester, previous_sgpa, sgpa, ROUND(previous_sgpa - sgpa, 2) AS sgpa_drop",
      "FROM seq",
      "WHERE ROUND(previous_sgpa - sgpa, 2) > 1",
      "ORDER BY roll_no, semester",
    ].join("\n"),
    alternatives: [
      "SELECT roll_no, semester, previous_sgpa, sgpa, sgpa_drop FROM (SELECT r.roll_no, r.semester, p.sgpa AS previous_sgpa, r.sgpa, ROUND(p.sgpa - r.sgpa, 2) AS sgpa_drop FROM SemesterResult r JOIN SemesterResult p ON p.roll_no = r.roll_no AND p.semester = (SELECT MAX(q.semester) FROM SemesterResult q WHERE q.roll_no = r.roll_no AND q.semester < r.semester)) t WHERE sgpa_drop > 1 ORDER BY roll_no, semester",
    ],
    ordered: true,
    hints: [
      "Each row needs a value from another row of the same student: the one just before it.",
      "`LAG(sgpa) OVER (PARTITION BY roll_no ORDER BY semester)` reads the previous recorded semester, gaps or not.",
      "A window result cannot be filtered in the same SELECT's WHERE — compute it in a CTE first. Compare the rounded drop, as the statement says.",
    ],
    editorial: [
      "The question compares each row with the **previous row of the same student**, which is exactly what `LAG` does: partitioned by `roll_no` and ordered by `semester`, `LAG(sgpa)` returns the SGPA of the row before, and NULL for a student's first recorded semester. Because it works on row order rather than on `semester - 1`, a missing semester is skipped over naturally — semester 4 after semester 2 is compared with semester 2.",
      "",
      "Window functions are evaluated after WHERE, so compute the previous SGPA in a CTE and filter outside it. The first semester's NULL makes the drop NULL, and NULL > 1 is not true, so it falls out with no extra condition.",
      "",
      "The statement compares the drop rounded to two places. That matters: two-decimal grades stored as binary floating point can subtract to 1.0000000000000009, which a raw `> 1` would wrongly flag. Without window functions, a self join to the row whose semester is the student's largest one below the current gives the same pairs at the cost of a correlated MAX per row.",
    ].join("\n"),
  },

  {
    slug: "placement-rate-and-top-package-by-branch",
    title: "Placement Rate and Top Package by Branch",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation"],
    description: [
      "The training and placement officer's annual report shows, for each branch, how many final-year students were placed and the best package anyone accepted. A student counts as **placed** when they hold at least one **accepted** offer; declined and revoked offers do not count.",
      "",
      "Return one row per branch with at least one student: `branch`, `students`, `placed`, `placement_pct` (placed as a percentage of students, **rounded to 2 decimal places**) and `top_ctc_lpa` (the highest accepted CTC in the branch, NULL if nobody was placed). Order the rows by `placement_pct` **highest first**, then by `branch`.",
    ].join("\n"),
    tables: [
      {
        name: "Student",
        columns: [
          { name: "roll_no", type: "int" },
          { name: "name", type: "varchar" },
          { name: "branch", type: "varchar" },
        ],
        primaryKey: ["roll_no"],
        note: "One row per final-year student.",
      },
      {
        name: "PlacementOffer",
        columns: [
          { name: "offer_id", type: "int" },
          { name: "roll_no", type: "int" },
          { name: "company", type: "varchar" },
          { name: "ctc_lpa", type: "decimal" },
          { name: "offer_status", type: "enum", values: ["accepted", "declined", "revoked"] },
        ],
        primaryKey: ["offer_id"],
        note: "`ctc_lpa` is lakh rupees per annum with one decimal; a student may hold several accepted offers.",
      },
    ],
    examples: [
      {
        Student: [
          [2101, "Aarav", "CSE"],
          [2102, "Diya", "CSE"],
          [2103, "Ishaan", "CSE"],
          [2104, "Kavya", "ECE"],
          [2105, "Neha", "ECE"],
          [2106, "Rohan", "MECH"],
        ],
        PlacementOffer: [
          [1, 2101, "Atlassian", 32.5, "accepted"],
          [2, 2101, "TCS", 7.0, "accepted"],
          [3, 2102, "Zoho", 9.0, "accepted"],
          [4, 2104, "Wipro", 6.5, "accepted"],
          [5, 2105, "Razorpay", 18.0, "declined"],
          [6, 2106, "Infosys", 4.5, "revoked"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const who = names(rng, n);
      const branches = sample(rng, BRANCHES, ri(rng, 1, 4));
      const students = who.map((name, i) => [2101 + i, name, pick(rng, branches)]);
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 16);
      const status = ["accepted", "accepted", "declined", "revoked"] as const;
      return {
        Student: students,
        PlacementOffer: seq(1, m).map((id) => [id, 2101 + ri(rng, 0, n - 1), pick(rng, COMPANIES), ri(rng, 35, 400) / 10, pick(rng, status)]),
      };
    },
    solution: [
      "SELECT s.branch,",
      "       COUNT(DISTINCT s.roll_no) AS students,",
      "       COUNT(DISTINCT o.roll_no) AS placed,",
      "       ROUND(100 * COUNT(DISTINCT o.roll_no) / COUNT(DISTINCT s.roll_no), 2) AS placement_pct,",
      "       MAX(o.ctc_lpa) AS top_ctc_lpa",
      "FROM Student s",
      "LEFT JOIN PlacementOffer o ON o.roll_no = s.roll_no AND o.offer_status = 'accepted'",
      "GROUP BY s.branch",
      "ORDER BY placement_pct DESC, s.branch",
    ].join("\n"),
    alternatives: [
      "WITH best AS (SELECT roll_no, MAX(ctc_lpa) AS best_ctc FROM PlacementOffer WHERE offer_status = 'accepted' GROUP BY roll_no) SELECT s.branch, COUNT(*) AS students, COUNT(b.roll_no) AS placed, ROUND(100 * COUNT(b.roll_no) / COUNT(*), 2) AS placement_pct, MAX(b.best_ctc) AS top_ctc_lpa FROM Student s LEFT JOIN best b ON b.roll_no = s.roll_no GROUP BY s.branch ORDER BY placement_pct DESC, branch",
      "SELECT branch, COUNT(*) AS students, SUM(CASE WHEN EXISTS (SELECT 1 FROM PlacementOffer o WHERE o.roll_no = s.roll_no AND o.offer_status = 'accepted') THEN 1 ELSE 0 END) AS placed, ROUND(100 * SUM(CASE WHEN EXISTS (SELECT 1 FROM PlacementOffer o WHERE o.roll_no = s.roll_no AND o.offer_status = 'accepted') THEN 1 ELSE 0 END) / COUNT(*), 2) AS placement_pct, MAX((SELECT MAX(o.ctc_lpa) FROM PlacementOffer o WHERE o.roll_no = s.roll_no AND o.offer_status = 'accepted')) AS top_ctc_lpa FROM Student s GROUP BY branch ORDER BY 4 DESC, 1",
    ],
    ordered: true,
    hints: [
      "Start from `Student` with a LEFT JOIN, or unplaced students vanish from the count of students.",
      "Put the `accepted` condition in the ON clause so that a student with only declined offers still appears, unmatched.",
      "A student with two accepted offers is joined twice — count distinct roll numbers.",
    ],
    editorial: [
      "Every branch's denominator is all of its students, placed or not, so the query must start from `Student` and **LEFT JOIN** the offers. The `accepted` condition belongs in the ON clause: there it decides which offers may match, and a student with only declined or revoked offers stays in the result with NULL offer columns. In WHERE it would remove that student altogether.",
      "",
      "The join produces one row per accepted offer, so a student with two offers appears twice. `COUNT(DISTINCT s.roll_no)` counts students and `COUNT(DISTINCT o.roll_no)` counts the placed ones — the NULLs of unmatched students are ignored by COUNT. `MAX(o.ctc_lpa)` is the branch's top package, and it is NULL when no row matched, as the statement asks.",
      "",
      "Collapsing offers to one row per student first (a CTE with each student's best accepted CTC) removes the duplicates before the join, so plain COUNTs work. Both are a pass over each table.",
    ].join("\n"),
  },
  {
    slug: "late-coursework-uploads-per-course",
    title: "Late Coursework Uploads and Average Hours Late per Course",
    difficulty: "MEDIUM",
    topics: ["Dates", "Joins", "Aggregation"],
    description: [
      "The dean's office suspects some courses set deadlines students cannot meet. For each course it wants the share of coursework uploads that came in after the task's deadline and how late they were on average.",
      "",
      "For every course with at least one upload, return `course_code`, `uploads`, `late_uploads` (uploads **strictly after** `due_at`) and `avg_hours_late` — the average of `TIMESTAMPDIFF(HOUR, due_at, uploaded_at)` over the late uploads only (whole hours, truncated), **rounded to 2 decimal places**, or NULL when the course has no late uploads. An upload at exactly `due_at` is on time. Order the rows by `course_code`.",
    ].join("\n"),
    tables: [
      {
        name: "CourseworkTask",
        columns: [
          { name: "task_id", type: "int" },
          { name: "course_code", type: "varchar" },
          { name: "title", type: "varchar" },
          { name: "due_at", type: "datetime" },
        ],
        primaryKey: ["task_id"],
        note: "One row per lab record, assignment or project milestone.",
      },
      {
        name: "Upload",
        columns: [
          { name: "upload_id", type: "int" },
          { name: "task_id", type: "int" },
          { name: "roll_no", type: "int" },
          { name: "uploaded_at", type: "datetime" },
        ],
        primaryKey: ["upload_id"],
        note: "`task_id` is always in `CourseworkTask`.",
      },
    ],
    examples: [
      {
        CourseworkTask: [
          [1, "CS301", "Shell Scripting Lab", "2024-08-20 23:59:00"],
          [2, "CS301", "Scheduler Simulation", "2024-09-05 17:00:00"],
          [3, "MA201", "Hypothesis Testing Sheet", "2024-08-28 10:00:00"],
          [4, "EC210", "Counter Design", "2024-09-10 23:59:00"],
        ],
        Upload: [
          [1, 1, 2101, "2024-08-20 22:10:00"],
          [2, 1, 2102, "2024-08-21 03:30:00"],
          [3, 2, 2101, "2024-09-05 17:00:00"],
          [4, 2, 2103, "2024-09-07 09:15:00"],
          [5, 3, 2101, "2024-08-27 18:00:00"],
          [6, 3, 2104, "2024-08-28 09:59:59"],
          [7, 1, 2104, "2024-08-20 23:59:30"],
        ],
      },
    ],
    gen: (rng) => {
      const k = ri(rng, 1, 5);
      const tasks = seq(1, k).map((id) => [id, pick(rng, COURSE_CODES.slice(0, 4)), `Task ${id}`, `${dateBetween(rng, "2024-08-15", "2024-09-30")} ${pick(rng, ["10:00:00", "17:00:00", "23:59:00"])}`]);
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 16);
      const uploads = seq(1, m).map((id) => {
        const t = pick(rng, tasks);
        const due = String(t[3]);
        const [d, time] = due.split(" ");
        const r = rng();
        let at: string;
        if (r < 0.15) at = due;
        else if (r < 0.5) at = `${addDays(d!, -ri(rng, 0, 3))} 08:${String(ri(rng, 10, 59))}:00`;
        else at = `${addDays(d!, ri(rng, 1, 3))} ${pick(rng, ["01:30:00", "09:15:00", time!, "21:45:10"])}`;
        return [id, t[0]!, ri(rng, 2101, 2115), at];
      });
      return { CourseworkTask: tasks, Upload: uploads };
    },
    solution: [
      "SELECT t.course_code,",
      "       COUNT(*) AS uploads,",
      "       SUM(CASE WHEN u.uploaded_at > t.due_at THEN 1 ELSE 0 END) AS late_uploads,",
      "       ROUND(AVG(CASE WHEN u.uploaded_at > t.due_at THEN TIMESTAMPDIFF(HOUR, t.due_at, u.uploaded_at) END), 2) AS avg_hours_late",
      "FROM Upload u",
      "JOIN CourseworkTask t ON t.task_id = u.task_id",
      "GROUP BY t.course_code",
      "ORDER BY t.course_code",
    ].join("\n"),
    alternatives: [
      "SELECT a.course_code, a.uploads, a.late_uploads, l.avg_hours_late FROM (SELECT t.course_code, COUNT(*) AS uploads, SUM(IF(u.uploaded_at > t.due_at, 1, 0)) AS late_uploads FROM Upload u JOIN CourseworkTask t ON t.task_id = u.task_id GROUP BY t.course_code) a LEFT JOIN (SELECT t.course_code, ROUND(AVG(TIMESTAMPDIFF(HOUR, t.due_at, u.uploaded_at)), 2) AS avg_hours_late FROM Upload u JOIN CourseworkTask t ON t.task_id = u.task_id WHERE u.uploaded_at > t.due_at GROUP BY t.course_code) l ON l.course_code = a.course_code ORDER BY a.course_code",
    ],
    ordered: true,
    hints: [
      "Each upload's deadline is on its task: join `Upload` to `CourseworkTask` and group by course.",
      "Late means `uploaded_at > due_at`; count late rows with a CASE inside SUM.",
      "AVG ignores NULLs — a CASE that yields the hours only for late uploads (and NULL otherwise) averages over the late ones alone.",
    ],
    editorial: [
      "Join each upload to its task so the deadline sits beside the upload time, then group by course. `COUNT(*)` is all uploads; `SUM(CASE WHEN uploaded_at > due_at THEN 1 ELSE 0 END)` counts the late ones. The comparison is strict, so an upload stamped exactly at the deadline is on time.",
      "",
      "The average lateness must be taken over **late uploads only**. The trick is that AVG skips NULLs: `AVG(CASE WHEN late THEN TIMESTAMPDIFF(HOUR, due_at, uploaded_at) END)` produces a number for late rows and NULL for on-time rows, so on-time uploads affect neither the sum nor the count. A course with no late uploads averages nothing and gets NULL, exactly as the statement asks. Averaging `GREATEST(0, …)` instead would wrongly count on-time uploads as zero hours.",
      "",
      "`TIMESTAMPDIFF(HOUR, …)` counts whole hours and truncates, so 3 h 31 min is 3. The alternative computes the late average in a separate grouped query and LEFT JOINs it back, which also gives NULL for courses with no late uploads.",
    ].join("\n"),
  },

  {
    slug: "course-catalogue-by-department-and-level",
    title: "Course Catalogue Summary by Department and Level",
    difficulty: "MEDIUM",
    topics: ["Strings", "Aggregation"],
    description: [
      "Course codes in the university catalogue look like `CSE-301`: the department's short name, a hyphen, and a three-digit number whose first digit is the **level** (1 for first-year courses, 3 for third-year, …). The curriculum committee wants a count of courses and credits at each level of each department.",
      "",
      "Return `department` (the part before the hyphen), `level` (the first digit of the number, times 100 — so `301` gives `300`), `courses` and `total_credits`. Order the rows by `department`, then by `level`.",
    ].join("\n"),
    tables: [
      {
        name: "CatalogueCourse",
        columns: [
          { name: "course_code", type: "varchar" },
          { name: "title", type: "varchar" },
          { name: "credits", type: "int" },
        ],
        primaryKey: ["course_code"],
        note: "Every code has exactly one hyphen followed by three digits; department names have 2–4 capital letters.",
      },
    ],
    examples: [
      {
        CatalogueCourse: [
          ["CSE-101", "Programming in C", 4],
          ["CSE-301", "Operating Systems", 4],
          ["CSE-305", "Compiler Design", 3],
          ["ME-105", "Engineering Drawing", 3],
          ["ME-210", "Thermodynamics", 4],
          ["MA-101", "Calculus", 4],
          ["ECE-301", "Digital Signal Processing", 4],
        ],
      },
    ],
    gen: (rng) => {
      const depts = sample(rng, ["CSE", "ME", "ECE", "MA", "CIV", "HS", "EEE"], ri(rng, 1, 4));
      const seen = new Set<string>();
      const rows: Cell[][] = [];
      for (let i = 0; i < ri(rng, 1, 14); i++) {
        const code = `${pick(rng, depts)}-${ri(rng, 1, 4)}${ri(rng, 0, 2)}${ri(rng, 1, 9)}`;
        if (seen.has(code)) continue;
        seen.add(code);
        rows.push([code, `Course ${code}`, pick(rng, [2, 3, 4])]);
      }
      return { CatalogueCourse: rows };
    },
    solution: [
      "SELECT SUBSTRING_INDEX(course_code, '-', 1) AS department,",
      "       CAST(LEFT(SUBSTRING_INDEX(course_code, '-', -1), 1) AS SIGNED) * 100 AS level,",
      "       COUNT(*) AS courses,",
      "       SUM(credits) AS total_credits",
      "FROM CatalogueCourse",
      "GROUP BY department, level",
      "ORDER BY department, level",
    ].join("\n"),
    alternatives: [
      "SELECT department, level, COUNT(*) AS courses, SUM(credits) AS total_credits FROM (SELECT LEFT(course_code, LOCATE('-', course_code) - 1) AS department, FLOOR(CAST(SUBSTRING(course_code, LOCATE('-', course_code) + 1) AS SIGNED) / 100) * 100 AS level, credits FROM CatalogueCourse) t GROUP BY department, level ORDER BY department, level",
    ],
    ordered: true,
    hints: [
      "Two values hide inside each code: split it at the hyphen.",
      "`SUBSTRING_INDEX(code, '-', 1)` is the part before the hyphen and `SUBSTRING_INDEX(code, '-', -1)` the part after.",
      "Turn the number into a level either by its first digit, or by integer-dividing it by 100 — then group by both derived values.",
    ],
    editorial: [
      "Each course code packs two facts. Split at the hyphen: `SUBSTRING_INDEX(course_code, '-', 1)` returns everything before the first hyphen — the department — and `SUBSTRING_INDEX(course_code, '-', -1)` everything after the last one — the three-digit number. Because the department has a variable length (`ME`, `CSE`), a fixed `LEFT(code, 3)` would not work.",
      "",
      "The level is the number's hundreds digit. Take its first character, cast it to a number and multiply by 100, or cast the whole number and compute `FLOOR(n / 100) * 100`; both give 300 for `301` and `305`. Casting matters for the sort — as text the levels would still sort correctly here, but they would be compared as strings, and `CAST(… AS SIGNED)` makes the column a proper integer.",
      "",
      "MySQL lets you group by the select-list aliases, so `GROUP BY department, level` groups on the derived values. Then `COUNT(*)` and `SUM(credits)` summarise each group. One scan of the catalogue.",
    ].join("\n"),
  },

  {
    slug: "backlogs-cleared-on-a-later-attempt",
    title: "Backlogs Cleared on a Later Attempt",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Conditional Logic"],
    description: [
      "The exam cell tracks supplementary exams. A student who scored **below 40** on their **first attempt** at a subject has a backlog; they may reappear (attempts 2, 3, …) until they score 40 or more. Students also sometimes reappear after passing to improve their marks.",
      "",
      "Return `roll_no`, `subject_code` and `cleared_on_attempt` — the number of the **first attempt with 40 or more** — for every student-subject pair that failed attempt 1 and has since passed. Pairs that passed at the first attempt, or have not passed yet, are left out. Order the rows by `roll_no`, then by `subject_code`.",
    ].join("\n"),
    tables: [
      {
        name: "ExamAttempt",
        columns: [
          { name: "roll_no", type: "int" },
          { name: "subject_code", type: "varchar" },
          { name: "attempt_no", type: "int" },
          { name: "marks", type: "int" },
        ],
        primaryKey: ["roll_no", "subject_code", "attempt_no"],
        note: "Attempts of a pair are numbered 1, 2, 3, … with no gaps; `marks` is out of 100 and never NULL.",
      },
    ],
    examples: [
      {
        ExamAttempt: [
          [2101, "MA101", 1, 32],
          [2101, "MA101", 2, 38],
          [2101, "MA101", 3, 51],
          [2101, "PH102", 1, 64],
          [2101, "PH102", 2, 78],
          [2102, "MA101", 1, 28],
          [2102, "MA101", 2, 40],
          [2102, "MA101", 3, 66],
          [2103, "CS103", 1, 22],
          [2103, "CS103", 2, 35],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const roll of sample(rng, seq(2101, 10), ri(rng, 1, 6))) {
        for (const sub of sample(rng, SUBJECTS, ri(rng, 1, 2))) {
          const tries = ri(rng, 1, 4);
          for (let a = 1; a <= tries; a++) {
            const marks = a === 1 && chance(rng, 0.7) ? ri(rng, 15, 39) : chance(rng, 0.2) ? 40 : ri(rng, 20, 85);
            rows.push([roll, sub, a, marks]);
          }
        }
      }
      return { ExamAttempt: rows };
    },
    solution: [
      "SELECT e.roll_no, e.subject_code, MIN(e.attempt_no) AS cleared_on_attempt",
      "FROM ExamAttempt e",
      "WHERE e.marks >= 40",
      "  AND EXISTS (",
      "    SELECT 1 FROM ExamAttempt f",
      "    WHERE f.roll_no = e.roll_no AND f.subject_code = e.subject_code",
      "      AND f.attempt_no = 1 AND f.marks < 40",
      "  )",
      "GROUP BY e.roll_no, e.subject_code",
      "ORDER BY e.roll_no, e.subject_code",
    ].join("\n"),
    alternatives: [
      "SELECT roll_no, subject_code, cleared_on_attempt FROM (SELECT roll_no, subject_code, MIN(CASE WHEN marks >= 40 THEN attempt_no END) AS cleared_on_attempt, MAX(CASE WHEN attempt_no = 1 AND marks < 40 THEN 1 ELSE 0 END) AS failed_first FROM ExamAttempt GROUP BY roll_no, subject_code) t WHERE failed_first = 1 AND cleared_on_attempt IS NOT NULL ORDER BY roll_no, subject_code",
      "SELECT f.roll_no, f.subject_code, (SELECT MIN(p.attempt_no) FROM ExamAttempt p WHERE p.roll_no = f.roll_no AND p.subject_code = f.subject_code AND p.marks >= 40) AS cleared_on_attempt FROM ExamAttempt f WHERE f.attempt_no = 1 AND f.marks < 40 AND EXISTS (SELECT 1 FROM ExamAttempt p WHERE p.roll_no = f.roll_no AND p.subject_code = f.subject_code AND p.marks >= 40) ORDER BY 1, 2",
    ],
    ordered: true,
    hints: [
      "Two facts about a pair must hold: its first attempt failed, and some attempt passed.",
      "The first passing attempt is the smallest `attempt_no` among the rows with `marks >= 40`.",
      "Check the first-attempt failure with EXISTS, or with a conditional aggregate over the pair's rows.",
    ],
    editorial: [
      "Think of each student-subject pair as a small group of attempts. Two conditions decide whether it is in the answer: **attempt 1 failed** (marks below 40), and **some attempt passed**. The value to report is the smallest attempt number among the passing ones.",
      "",
      "The reference keeps only the passing attempts, groups them by pair and takes `MIN(attempt_no)`; a correlated `EXISTS` keeps the pair only if its attempt 1 is a failure. Pairs that passed straight away fail the EXISTS, and pairs still failing have no passing rows to group. Improvement attempts after a pass are larger numbers and never affect the MIN.",
      "",
      "The same result comes from one grouped pass with **conditional aggregates**: `MIN(CASE WHEN marks >= 40 THEN attempt_no END)` is the clearing attempt (NULL when none) and `MAX(CASE WHEN attempt_no = 1 AND marks < 40 THEN 1 ELSE 0 END)` flags a failed first attempt. Or start from the failed first attempts and look the clearing attempt up with a scalar subquery. Exactly 40 is a pass in every form.",
    ].join("\n"),
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "longest-daily-learning-streak",
    title: "Longest Daily Learning Streak of Each Learner",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "An online learning app shows each learner their best streak: the longest run of **consecutive calendar days** on which they completed at least one lesson. Several completions on one day count as one day.",
      "",
      "For every learner with at least one completion, return `learner_id`, `longest_streak` (the number of days in their longest run) and `streak_start` (the first day of that run, as a date). If a learner has two runs of the same longest length, report the **earlier** one. Order the rows by `learner_id`.",
    ].join("\n"),
    tables: [
      {
        name: "LessonCompletion",
        columns: [
          { name: "completion_id", type: "int" },
          { name: "learner_id", type: "int" },
          { name: "lesson_id", type: "int" },
          { name: "completed_at", type: "datetime" },
        ],
        primaryKey: ["completion_id"],
        note: "One row per lesson a learner finished; times are in IST.",
      },
    ],
    examples: [
      {
        LessonCompletion: [
          [1, 501, 11, "2024-03-01 08:10:00"],
          [2, 501, 12, "2024-03-02 21:40:00"],
          [3, 501, 13, "2024-03-02 22:15:00"],
          [4, 501, 14, "2024-03-03 07:05:00"],
          [5, 501, 15, "2024-03-06 19:30:00"],
          [6, 502, 11, "2024-03-01 18:00:00"],
          [7, 502, 12, "2024-03-03 18:00:00"],
          [8, 502, 13, "2024-03-04 09:20:00"],
          [9, 502, 14, "2024-03-08 11:00:00"],
          [10, 502, 15, "2024-03-09 11:30:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      for (const learner of sample(rng, seq(501, 8), ri(rng, 0, 4))) {
        let day = dateBetween(rng, "2024-02-20", "2024-03-05");
        for (let i = 0; i < ri(rng, 1, 7); i++) {
          const times = chance(rng, 0.2) ? 2 : 1;
          for (let t = 0; t < times; t++) rows.push([id++, learner, ri(rng, 11, 40), `${day} ${pick(rng, ["07:05:00", "13:30:00", "21:40:00", "23:59:59", "00:00:00"])}`]);
          day = addDays(day, pick(rng, [1, 1, 1, 2, 3]));
        }
      }
      return { LessonCompletion: rows };
    },
    solution: [
      "WITH days AS (",
      "  SELECT DISTINCT learner_id, CAST(completed_at AS DATE) AS d",
      "  FROM LessonCompletion",
      "), islands AS (",
      "  SELECT learner_id, d,",
      "         DATEDIFF(d, '2024-01-01') - ROW_NUMBER() OVER (PARTITION BY learner_id ORDER BY d) AS grp",
      "  FROM days",
      "), runs AS (",
      "  SELECT learner_id, MIN(d) AS streak_start, COUNT(*) AS longest_streak",
      "  FROM islands",
      "  GROUP BY learner_id, grp",
      "), ranked AS (",
      "  SELECT learner_id, longest_streak, streak_start,",
      "         ROW_NUMBER() OVER (PARTITION BY learner_id ORDER BY longest_streak DESC, streak_start) AS rn",
      "  FROM runs",
      ")",
      "SELECT learner_id, longest_streak, streak_start",
      "FROM ranked",
      "WHERE rn = 1",
      "ORDER BY learner_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH days AS (SELECT DISTINCT learner_id, CAST(completed_at AS DATE) AS d FROM LessonCompletion),",
        "starts AS (SELECT a.learner_id, a.d FROM days a WHERE NOT EXISTS (SELECT 1 FROM days b WHERE b.learner_id = a.learner_id AND b.d = DATE_SUB(a.d, INTERVAL 1 DAY))),",
        "runs AS (SELECT s.learner_id, s.d AS streak_start, (SELECT COUNT(*) FROM days x WHERE x.learner_id = s.learner_id AND x.d >= s.d AND DATEDIFF(x.d, s.d) = (SELECT COUNT(*) FROM days y WHERE y.learner_id = s.learner_id AND y.d > s.d AND y.d <= x.d)) AS longest_streak FROM starts s)",
        "SELECT r.learner_id, r.longest_streak, r.streak_start FROM runs r WHERE NOT EXISTS (SELECT 1 FROM runs q WHERE q.learner_id = r.learner_id AND (q.longest_streak > r.longest_streak OR (q.longest_streak = r.longest_streak AND q.streak_start < r.streak_start))) ORDER BY r.learner_id",
      ].join(" "),
    ],
    ordered: true,
    hints: [
      "First reduce the completions to one row per learner per day.",
      "Number each learner's days in order. Within a run of consecutive days, the date minus that number stays constant — that constant identifies the run.",
      "Group by learner and that key to get each run's start and length, then keep the longest run per learner, the earlier one on a tie.",
    ],
    editorial: [
      "This is a **gaps-and-islands** problem. Start by collapsing completions to distinct (learner, day) pairs with `CAST(completed_at AS DATE)`, so two lessons on one day count once.",
      "",
      "Then number each learner's days with `ROW_NUMBER()` in date order. On consecutive days the date grows by one and so does the row number, so `DATEDIFF(d, some_fixed_day) - row_number` is constant across a run and jumps whenever a day is skipped. That difference is a run identifier: group by learner and it, and `COUNT(*)` is the run's length and `MIN(d)` its first day.",
      "",
      "Finally keep one run per learner — the longest, and on a tie the earliest — with another `ROW_NUMBER()` ordered by length descending and start ascending, which makes the choice deterministic.",
      "",
      "The alternative finds run starts (a day whose previous day is missing) with NOT EXISTS and measures each run by counting the days that continue it without a gap. It is quadratic per learner; the window version sorts each learner's days once, so it is O(n log n).",
    ].join("\n"),
  },

  {
    slug: "signup-cohort-next-month-retention",
    title: "Next-Month Retention of Learner Sign-up Cohorts",
    difficulty: "HARD",
    topics: ["Dates", "Aggregation", "Joins"],
    description: [
      "The growth team of a learning platform groups learners into **cohorts by sign-up month** and measures how many come back in the **calendar month right after** the one they signed up in (for a January sign-up, any activity in February).",
      "",
      "Return one row per cohort with the columns `cohort_month` (`'YYYY-MM'`), `signups`, `retained` (learners of the cohort with at least one activity in the following month) and `retention_pct` (retained over signups as a percentage, **rounded to 2 decimal places**). A cohort with no retained learners shows 0. Activity in the sign-up month itself or two or more months later does not count. Order the rows by `cohort_month`.",
    ].join("\n"),
    tables: [
      {
        name: "Learner",
        columns: [
          { name: "learner_id", type: "int" },
          { name: "signed_up_on", type: "date" },
          { name: "plan", type: "enum", values: ["free", "plus", "pro"] },
        ],
        primaryKey: ["learner_id"],
        note: "One row per learner account.",
      },
      {
        name: "LearnerActivity",
        columns: [
          { name: "activity_id", type: "int" },
          { name: "learner_id", type: "int" },
          { name: "active_on", type: "date" },
          { name: "action", type: "enum", values: ["watched_video", "attempted_quiz", "posted_doubt"] },
        ],
        primaryKey: ["activity_id"],
        note: "One row per action; `active_on` is never before the learner's sign-up date.",
      },
    ],
    examples: [
      {
        Learner: [
          [1, "2024-01-05", "free"],
          [2, "2024-01-31", "plus"],
          [3, "2024-01-20", "free"],
          [4, "2024-02-14", "pro"],
          [5, "2024-02-29", "free"],
          [6, "2024-12-10", "free"],
        ],
        LearnerActivity: [
          [1, 1, "2024-01-06", "watched_video"],
          [2, 1, "2024-02-03", "attempted_quiz"],
          [3, 1, "2024-02-20", "watched_video"],
          [4, 2, "2024-02-01", "posted_doubt"],
          [5, 3, "2024-01-25", "watched_video"],
          [6, 3, "2024-03-02", "watched_video"],
          [7, 4, "2024-03-31", "attempted_quiz"],
          [8, 6, "2025-01-02", "watched_video"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const learners = seq(1, n).map((id) => [id, dateBetween(rng, "2024-11-01", "2025-02-28"), pick(rng, ["free", "free", "plus", "pro"])]);
      const acts: Cell[][] = [];
      let id = 1;
      for (const l of learners) {
        for (let i = 0; i < ri(rng, 0, 3); i++) acts.push([id++, l[0]!, addDays(String(l[1]), ri(rng, 0, 70)), pick(rng, ["watched_video", "attempted_quiz", "posted_doubt"])]);
      }
      return { Learner: learners, LearnerActivity: acts };
    },
    solution: [
      "WITH flagged AS (",
      "  SELECT l.learner_id, DATE_FORMAT(l.signed_up_on, '%Y-%m') AS cohort_month,",
      "         CASE WHEN EXISTS (",
      "           SELECT 1 FROM LearnerActivity a",
      "           WHERE a.learner_id = l.learner_id",
      "             AND (YEAR(a.active_on) * 12 + MONTH(a.active_on)) - (YEAR(l.signed_up_on) * 12 + MONTH(l.signed_up_on)) = 1",
      "         ) THEN 1 ELSE 0 END AS came_back",
      "  FROM Learner l",
      ")",
      "SELECT cohort_month, COUNT(*) AS signups, SUM(came_back) AS retained,",
      "       ROUND(100 * SUM(came_back) / COUNT(*), 2) AS retention_pct",
      "FROM flagged",
      "GROUP BY cohort_month",
      "ORDER BY cohort_month",
    ].join("\n"),
    alternatives: [
      "SELECT DATE_FORMAT(l.signed_up_on, '%Y-%m') AS cohort_month, COUNT(DISTINCT l.learner_id) AS signups, COUNT(DISTINCT a.learner_id) AS retained, ROUND(100 * COUNT(DISTINCT a.learner_id) / COUNT(DISTINCT l.learner_id), 2) AS retention_pct FROM Learner l LEFT JOIN LearnerActivity a ON a.learner_id = l.learner_id AND DATE_FORMAT(a.active_on, '%Y-%m') = DATE_FORMAT(DATE_ADD(CONCAT(DATE_FORMAT(l.signed_up_on, '%Y-%m'), '-01'), INTERVAL 1 MONTH), '%Y-%m') GROUP BY DATE_FORMAT(l.signed_up_on, '%Y-%m') ORDER BY cohort_month",
    ],
    ordered: true,
    hints: [
      "Every learner belongs to exactly one cohort — the month of `signed_up_on`. Count sign-ups from `Learner`, not from activity.",
      "\"The following month\" is a calendar month: compare month numbers (`YEAR * 12 + MONTH`), not a 30-day window.",
      "Decide per learner whether they came back (EXISTS, or a LEFT JOIN restricted in its ON clause), then aggregate per cohort.",
    ],
    editorial: [
      "A cohort report has two levels. First decide, **per learner**, whether they were retained; then aggregate per cohort. Doing it in that order avoids double counting a learner with several actions next month.",
      "",
      "The cohort is `DATE_FORMAT(signed_up_on, '%Y-%m')`. \"The month after\" is a calendar notion, so the cleanest test is on month indexes: `YEAR(d) * 12 + MONTH(d)` numbers months consecutively across year boundaries, and a learner came back when some activity's index is exactly one more than the sign-up's. That handles December → January and the end-of-month cases (a 31 January sign-up active on 1 February is retained) with no date arithmetic at all. Adding one month to the sign-up date itself is risky, because 31 January plus one month is not well-defined — the alternative adds it to the first of the month instead.",
      "",
      "With a 0/1 flag per learner, `COUNT(*)` is the cohort size, `SUM(flag)` the retained learners, and the percentage is rounded for display. Cohorts nobody returned from still appear with 0, because the flag comes from `Learner`, not from the activity table. The LEFT JOIN variant counts distinct learners on both sides for the same result.",
    ].join("\n"),
  },
  {
    slug: "median-cgpa-of-each-branch",
    title: "Median CGPA of Each Branch",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "Recruiters visiting the campus ask for each branch's **median** CGPA rather than the average, which a handful of very low or very high grades can drag. The median is the middle CGPA when a branch's students are sorted; for an even number of students it is the average of the two middle values.",
      "",
      "Return one row per branch with the columns `branch`, `students` and `median_cgpa` (**rounded to 2 decimal places**). Order the rows by `branch`.",
    ].join("\n"),
    tables: [
      {
        name: "Student",
        columns: [
          { name: "roll_no", type: "int" },
          { name: "name", type: "varchar" },
          { name: "branch", type: "varchar" },
          { name: "cgpa", type: "decimal" },
        ],
        primaryKey: ["roll_no"],
        note: "One row per final-year student; `cgpa` is on a 10-point scale with one decimal and never NULL.",
      },
    ],
    examples: [
      {
        Student: [
          [2101, "Aarav", "CSE", 8.4],
          [2102, "Diya", "CSE", 9.1],
          [2103, "Ishaan", "CSE", 6.2],
          [2104, "Kavya", "ECE", 7.5],
          [2105, "Neha", "ECE", 8.8],
          [2106, "Rohan", "ECE", 7.5],
          [2107, "Sneha", "ECE", 9.6],
          [2108, "Vikram", "MECH", 6.9],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 16);
      const who = names(rng, n);
      const branches = sample(rng, BRANCHES, ri(rng, 1, 4));
      return {
        Student: who.map((name, i) => [2101 + i, name, pick(rng, branches), chance(rng, 0.2) ? 7.5 : ri(rng, 55, 98) / 10]),
      };
    },
    solution: [
      "WITH ordered AS (",
      "  SELECT branch, cgpa,",
      "         ROW_NUMBER() OVER (PARTITION BY branch ORDER BY cgpa, roll_no) AS rn,",
      "         COUNT(*) OVER (PARTITION BY branch) AS cnt",
      "  FROM Student",
      ")",
      "SELECT branch, MAX(cnt) AS students, ROUND(AVG(cgpa), 2) AS median_cgpa",
      "FROM ordered",
      "WHERE rn IN (FLOOR((cnt + 1) / 2), FLOOR((cnt + 2) / 2))",
      "GROUP BY branch",
      "ORDER BY branch",
    ].join("\n"),
    alternatives: [
      "SELECT branch, MAX(cnt) AS students, ROUND(AVG(cgpa), 2) AS median_cgpa FROM (SELECT branch, cgpa, COUNT(*) OVER (PARTITION BY branch) AS cnt, ROW_NUMBER() OVER (PARTITION BY branch ORDER BY cgpa, roll_no) AS up, ROW_NUMBER() OVER (PARTITION BY branch ORDER BY cgpa DESC, roll_no DESC) AS down FROM Student) t WHERE up <= down + 1 AND down <= up + 1 GROUP BY branch ORDER BY branch",
      "SELECT s.branch, (SELECT COUNT(*) FROM Student z WHERE z.branch = s.branch) AS students, ROUND(AVG(s.cgpa), 2) AS median_cgpa FROM Student s WHERE (SELECT COUNT(*) FROM Student x WHERE x.branch = s.branch AND (x.cgpa < s.cgpa OR (x.cgpa = s.cgpa AND x.roll_no < s.roll_no))) * 2 BETWEEN (SELECT COUNT(*) FROM Student z WHERE z.branch = s.branch) - 2 AND (SELECT COUNT(*) FROM Student z WHERE z.branch = s.branch) GROUP BY s.branch ORDER BY s.branch",
    ],
    ordered: true,
    hints: [
      "Sort each branch's students by CGPA and number them; you also need the branch's size on every row.",
      "`ROW_NUMBER()` and `COUNT(*)` with the same `PARTITION BY branch` give the position and the size side by side.",
      "The middle positions are `(cnt + 1) / 2` and `(cnt + 2) / 2` rounded down — the same position when `cnt` is odd, two neighbours when it is even. Average the CGPAs at those positions.",
    ],
    editorial: [
      "MySQL has no MEDIAN aggregate, so build it from window functions. Within each branch, `ROW_NUMBER() OVER (PARTITION BY branch ORDER BY cgpa, roll_no)` gives every student a position 1…cnt in CGPA order, and `COUNT(*) OVER (PARTITION BY branch)` puts the branch size on every row. Ties in CGPA need a tie-breaker (`roll_no`) only so that the numbering is deterministic — tied students have the same CGPA, so which of them sits in the middle does not change the value.",
      "",
      "For an odd size the median is at position `(cnt + 1) / 2`; for an even size it is the average of positions `cnt / 2` and `cnt / 2 + 1`. Both cases are covered by keeping the rows whose position is `FLOOR((cnt + 1) / 2)` or `FLOOR((cnt + 2) / 2)` — one row for odd sizes, two for even — and taking `AVG(cgpa)` per branch. `MAX(cnt)` carries the size through the GROUP BY.",
      "",
      "A neat alternative numbers the rows in both directions: the middle rows are those where the ascending and descending numbers differ by at most 1. Without windows, count for each student how many sort before them with a correlated subquery — quadratic, but it shows the definition plainly.",
    ].join("\n"),
  },

  {
    slug: "course-funnel-from-enrolment-to-certificate",
    title: "Course Funnel From Enrolment to Certificate",
    difficulty: "HARD",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "The product team of an online course platform tracks a four-step funnel per course: learners **enrolled**; enrolled learners who **started** (completed at least one lesson of the course); those who reached **halfway** (completed at least half of the course's lessons); and those who were **certified**.",
      "",
      "Return one row per course — including courses with no enrolments — with the columns `course_title`, `enrolled`, `started`, `halfway` and `certified`. Halfway means completed lessons × 2 ≥ the course's lesson count, so 2 of 4 counts and 1 of 3 does not. Order the rows by `course_title`.",
    ].join("\n"),
    tables: [
      {
        name: "Course",
        columns: [
          { name: "course_id", type: "int" },
          { name: "course_title", type: "varchar" },
        ],
        primaryKey: ["course_id"],
        note: "Titles are unique; every course has at least one lesson.",
      },
      {
        name: "Lesson",
        columns: [
          { name: "lesson_id", type: "int" },
          { name: "course_id", type: "int" },
        ],
        primaryKey: ["lesson_id"],
        note: "Each lesson belongs to one course.",
      },
      {
        name: "Enrolment",
        columns: [
          { name: "learner_id", type: "int" },
          { name: "course_id", type: "int" },
          { name: "enrolled_on", type: "date" },
        ],
        primaryKey: ["learner_id", "course_id"],
        note: "One row per learner per course they enrolled in.",
      },
      {
        name: "LessonCompleted",
        columns: [
          { name: "learner_id", type: "int" },
          { name: "lesson_id", type: "int" },
          { name: "completed_on", type: "date" },
        ],
        primaryKey: ["learner_id", "lesson_id"],
        note: "One row per lesson a learner finished; only enrolled learners can complete a course's lessons.",
      },
      {
        name: "Certificate",
        columns: [
          { name: "certificate_id", type: "int" },
          { name: "learner_id", type: "int" },
          { name: "course_id", type: "int" },
          { name: "issued_on", type: "date" },
        ],
        primaryKey: ["certificate_id"],
        note: "At most one certificate per learner and course, issued only to enrolled learners.",
      },
    ],
    examples: [
      {
        Course: [
          [1, "Data Analysis With SQL"],
          [2, "Java for Placements"],
          [3, "Cloud Basics"],
        ],
        Lesson: [
          [11, 1], [12, 1], [13, 1], [14, 1],
          [21, 2], [22, 2], [23, 2],
          [31, 3],
        ],
        Enrolment: [
          [501, 1, "2024-04-01"],
          [502, 1, "2024-04-02"],
          [503, 1, "2024-04-05"],
          [504, 1, "2024-04-09"],
          [501, 2, "2024-04-03"],
          [505, 2, "2024-04-10"],
        ],
        LessonCompleted: [
          [501, 11, "2024-04-02"], [501, 12, "2024-04-04"], [501, 13, "2024-04-06"], [501, 14, "2024-04-08"],
          [502, 11, "2024-04-03"], [502, 12, "2024-04-07"],
          [503, 11, "2024-04-06"],
          [505, 21, "2024-04-12"],
        ],
        Certificate: [[1, 501, 1, "2024-04-09"]],
      },
    ],
    gen: (rng) => {
      const TITLES = ["Data Analysis With SQL", "Java for Placements", "Cloud Basics", "UI Design Sprint", "Aptitude Crash Course"];
      const k = ri(rng, 1, 4);
      const courses = seq(1, k).map((id) => [id, TITLES[id - 1]!]);
      const lessons: Cell[][] = [];
      const byCourse = new Map<number, number[]>();
      for (let c = 1; c <= k; c++) {
        const ids = seq(c * 10 + 1, ri(rng, 1, 5));
        byCourse.set(c, ids);
        for (const l of ids) lessons.push([l, c]);
      }
      const enrol: Cell[][] = [];
      const done: Cell[][] = [];
      const certs: Cell[][] = [];
      for (let c = 1; c <= k; c++) {
        if (chance(rng, 0.15)) continue;
        for (const learner of sample(rng, seq(501, 8), ri(rng, 1, 5))) {
          enrol.push([learner, c, dateBetween(rng, "2024-04-01", "2024-04-15")]);
          const ids = byCourse.get(c)!;
          const finished = sample(rng, ids, ri(rng, 0, ids.length));
          for (const l of finished) done.push([learner, l, dateBetween(rng, "2024-04-16", "2024-05-15")]);
          if (finished.length === ids.length && chance(rng, 0.7)) certs.push([certs.length + 1, learner, c, "2024-05-20"]);
        }
      }
      return { Course: courses, Lesson: lessons, Enrolment: enrol, LessonCompleted: done, Certificate: certs };
    },
    solution: [
      "WITH total AS (",
      "  SELECT course_id, COUNT(*) AS lessons FROM Lesson GROUP BY course_id",
      "), progress AS (",
      "  SELECT lc.learner_id, l.course_id, COUNT(*) AS done",
      "  FROM LessonCompleted lc",
      "  JOIN Lesson l ON l.lesson_id = lc.lesson_id",
      "  GROUP BY lc.learner_id, l.course_id",
      ")",
      "SELECT c.course_title,",
      "       COUNT(e.learner_id) AS enrolled,",
      "       COUNT(p.learner_id) AS started,",
      "       COUNT(CASE WHEN p.done * 2 >= t.lessons THEN 1 END) AS halfway,",
      "       COUNT(cert.certificate_id) AS certified",
      "FROM Course c",
      "JOIN total t ON t.course_id = c.course_id",
      "LEFT JOIN Enrolment e ON e.course_id = c.course_id",
      "LEFT JOIN progress p ON p.learner_id = e.learner_id AND p.course_id = e.course_id",
      "LEFT JOIN Certificate cert ON cert.learner_id = e.learner_id AND cert.course_id = e.course_id",
      "GROUP BY c.course_id, c.course_title",
      "ORDER BY c.course_title",
    ].join("\n"),
    alternatives: [
      [
        "SELECT c.course_title,",
        "(SELECT COUNT(*) FROM Enrolment e WHERE e.course_id = c.course_id) AS enrolled,",
        "(SELECT COUNT(DISTINCT lc.learner_id) FROM LessonCompleted lc JOIN Lesson l ON l.lesson_id = lc.lesson_id WHERE l.course_id = c.course_id) AS started,",
        "(SELECT COUNT(*) FROM (SELECT lc.learner_id, l.course_id, COUNT(*) AS done FROM LessonCompleted lc JOIN Lesson l ON l.lesson_id = lc.lesson_id GROUP BY lc.learner_id, l.course_id) d WHERE d.course_id = c.course_id AND d.done * 2 >= (SELECT COUNT(*) FROM Lesson x WHERE x.course_id = c.course_id)) AS halfway,",
        "(SELECT COUNT(*) FROM Certificate k WHERE k.course_id = c.course_id) AS certified",
        "FROM Course c ORDER BY c.course_title",
      ].join(" "),
    ],
    ordered: true,
    hints: [
      "Each funnel step is a count of learners per course; build each learner's completed-lesson count per course first.",
      "Join completions to `Lesson` to learn which course each completed lesson belongs to, and count lessons per course separately.",
      "Start from `Course` with LEFT JOINs so a course with no enrolments shows zeros; `COUNT(column)` and `COUNT(CASE … THEN 1 END)` count only matching rows.",
    ],
    editorial: [
      "A funnel is several counts over the same population, so the clean way is to put **one row per enrolment** in front of you with everything you need beside it, then count conditionally. Two small aggregates prepare that: `total` is the number of lessons per course, and `progress` is how many lessons each learner completed in each course (completions joined to `Lesson` for the course, grouped by learner and course).",
      "",
      "Then start from `Course` and LEFT JOIN enrolments, progress and certificates on learner and course. Every enrolment appears once — progress and certificates are at most one row per learner and course, so nothing multiplies. Now each step is a COUNT: `COUNT(e.learner_id)` enrolled; `COUNT(p.learner_id)` started, because a progress row exists only with at least one completion; `COUNT(CASE WHEN p.done * 2 >= t.lessons THEN 1 END)` halfway, with the integer comparison making 2 of 4 count and 1 of 3 not; `COUNT(cert.certificate_id)` certified. A course with no enrolments still has its single row of NULLs and counts 0 everywhere.",
      "",
      "The alternative computes each step as an independent scalar subquery per course — simpler to read, more scans.",
    ].join("\n"),
  },

  {
    slug: "top-three-scores-in-each-mock-test",
    title: "Top Three Scores in Each National Mock Test",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins", "Aggregation"],
    description: [
      "A test-prep platform runs national mock tests and publishes a leaderboard of the **top three distinct scores** of each test. Learners may retake a test; only a learner's **best** score on that test counts. Everyone who shares a top-three score is listed — two learners tied on the best score are both position 1, and the next distinct score is position 2.",
      "",
      "Return `test_name`, `position` (1, 2 or 3), `learner_name` and `best_score`. Order the rows by `test_name`, then by `position`, then by `learner_name`.",
    ].join("\n"),
    tables: [
      {
        name: "MockTest",
        columns: [
          { name: "test_id", type: "int" },
          { name: "test_name", type: "varchar" },
        ],
        primaryKey: ["test_id"],
        note: "Test names are unique.",
      },
      {
        name: "Learner",
        columns: [
          { name: "learner_id", type: "int" },
          { name: "learner_name", type: "varchar" },
        ],
        primaryKey: ["learner_id"],
        note: "Learner names are unique.",
      },
      {
        name: "TestAttempt",
        columns: [
          { name: "attempt_id", type: "int" },
          { name: "test_id", type: "int" },
          { name: "learner_id", type: "int" },
          { name: "score", type: "int" },
        ],
        primaryKey: ["attempt_id"],
        note: "One row per sitting; `score` is out of 300 and never NULL.",
      },
    ],
    examples: [
      {
        MockTest: [
          [1, "JEE Main Mock 4"],
          [2, "CAT Mock 2"],
        ],
        Learner: [
          [501, "Aarav"], [502, "Diya"], [503, "Ishaan"], [504, "Kavya"], [505, "Neha"], [506, "Rohan"],
        ],
        TestAttempt: [
          [1, 1, 501, 212],
          [2, 1, 501, 248],
          [3, 1, 502, 248],
          [4, 1, 503, 230],
          [5, 1, 504, 199],
          [6, 1, 505, 230],
          [7, 1, 506, 185],
          [8, 2, 502, 141],
          [9, 2, 503, 156],
          [10, 2, 503, 120],
        ],
      },
    ],
    gen: (rng) => {
      const NAMES = ["JEE Main Mock 4", "CAT Mock 2", "GATE CS Mock 1", "NEET Mock 7"];
      const k = ri(rng, 1, 3);
      const n = ri(rng, 1, 9);
      const who = names(rng, n);
      const learners = who.map((name, i) => [501 + i, name]);
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 22);
      return {
        MockTest: seq(1, k).map((id) => [id, NAMES[id - 1]!]),
        Learner: learners,
        TestAttempt: seq(1, m).map((id) => [id, ri(rng, 1, k), 501 + ri(rng, 0, n - 1), pick(rng, [180, 200, 210, 230, 248, ri(rng, 90, 290)])]),
      };
    },
    solution: [
      "WITH best AS (",
      "  SELECT test_id, learner_id, MAX(score) AS best_score",
      "  FROM TestAttempt",
      "  GROUP BY test_id, learner_id",
      "), ranked AS (",
      "  SELECT test_id, learner_id, best_score,",
      "         DENSE_RANK() OVER (PARTITION BY test_id ORDER BY best_score DESC) AS position",
      "  FROM best",
      ")",
      "SELECT t.test_name, r.position, l.learner_name, r.best_score",
      "FROM ranked r",
      "JOIN MockTest t ON t.test_id = r.test_id",
      "JOIN Learner l ON l.learner_id = r.learner_id",
      "WHERE r.position <= 3",
      "ORDER BY t.test_name, r.position, l.learner_name",
    ].join("\n"),
    alternatives: [
      "WITH best AS (SELECT test_id, learner_id, MAX(score) AS best_score FROM TestAttempt GROUP BY test_id, learner_id) SELECT t.test_name, (SELECT COUNT(DISTINCT o.best_score) FROM best o WHERE o.test_id = b.test_id AND o.best_score > b.best_score) + 1 AS position, l.learner_name, b.best_score FROM best b JOIN MockTest t ON t.test_id = b.test_id JOIN Learner l ON l.learner_id = b.learner_id WHERE (SELECT COUNT(DISTINCT o.best_score) FROM best o WHERE o.test_id = b.test_id AND o.best_score > b.best_score) < 3 ORDER BY t.test_name, position, l.learner_name",
    ],
    ordered: true,
    hints: [
      "Collapse retakes first: one best score per learner per test.",
      "Positions by distinct score, with ties sharing a position and no gaps, are exactly `DENSE_RANK()`.",
      "Rank in a CTE, then filter `position <= 3` outside it, and join the names in.",
    ],
    editorial: [
      "Two steps matter here, in this order. First, a learner's retakes must not take more than one place on the board, so reduce `TestAttempt` to **one best score per learner per test** with `MAX(score)` grouped by test and learner. Ranking raw attempts instead would list Aarav twice if both his sittings were in the top three.",
      "",
      "Second, rank those best scores within each test. The statement's positions — ties share a position and the next distinct score takes the next number — are `DENSE_RANK()` ordered by score descending. `RANK()` would skip a number after a tie (1, 1, 3), and `ROW_NUMBER()` would split tied learners. Keep `position <= 3`, which may well return more than three learners when there are ties, and join the test and learner tables for the names.",
      "",
      "Without windows, a learner's position is one plus the number of distinct best scores above theirs in the same test, computed with a correlated `COUNT(DISTINCT …)`; it is quadratic per test but gives the same rows.",
    ].join("\n"),
  },

  {
    slug: "clashing-exam-slots-in-student-timetables",
    title: "Clashing Exam Slots in Students' Timetables",
    difficulty: "HARD",
    topics: ["Joins", "Dates"],
    description: [
      "Before publishing the end-semester timetable, the exam cell checks every student's registered exams for **clashes**: two exams whose time slots overlap. An exam ending at the very minute another begins is not a clash.",
      "",
      "Return one row per clashing pair per student with the columns `roll_no`, `first_subject`, `second_subject` and `overlap_minutes` (how long the two slots overlap). In each pair the `first_subject` is the exam that **starts earlier**; for two exams starting together, the one with the smaller `exam_id`. Order the rows by `roll_no`, then by `first_subject`, then by `second_subject`.",
    ].join("\n"),
    tables: [
      {
        name: "ExamSlot",
        columns: [
          { name: "exam_id", type: "int" },
          { name: "subject_code", type: "varchar" },
          { name: "starts_at", type: "datetime" },
          { name: "ends_at", type: "datetime" },
        ],
        primaryKey: ["exam_id"],
        note: "One slot per subject (`subject_code` is unique); `ends_at` is always after `starts_at`.",
      },
      {
        name: "ExamRegistration",
        columns: [
          { name: "roll_no", type: "int" },
          { name: "exam_id", type: "int" },
        ],
        primaryKey: ["roll_no", "exam_id"],
        note: "The exams each student must sit, regular and backlog papers alike.",
      },
    ],
    examples: [
      {
        ExamSlot: [
          [1, "CS301", "2024-11-18 09:30:00", "2024-11-18 12:30:00"],
          [2, "MA201", "2024-11-18 11:00:00", "2024-11-18 13:00:00"],
          [3, "HS101", "2024-11-18 12:30:00", "2024-11-18 14:00:00"],
          [4, "EC210", "2024-11-19 09:30:00", "2024-11-19 12:30:00"],
          [5, "ME105", "2024-11-19 09:30:00", "2024-11-19 11:00:00"],
        ],
        ExamRegistration: [
          [2101, 1], [2101, 2], [2101, 3],
          [2102, 1], [2102, 3],
          [2103, 4], [2103, 5], [2103, 2],
        ],
      },
    ],
    gen: (rng) => {
      const codes = sample(rng, [...COURSE_CODES, ...SUBJECTS], ri(rng, 2, 7));
      const starts = ["09:30:00", "11:00:00", "12:30:00", "14:00:00"];
      const slots = codes.map((code, i) => {
        const day = chance(rng, 0.8) ? "2024-11-18" : "2024-11-19";
        const s = ri(rng, 0, 3);
        const len = pick(rng, [1, 2, 2, 3]);
        const end = s + len >= 4 ? "17:00:00" : starts[s + len]!;
        return [i + 1, code, `${day} ${starts[s]}`, `${day} ${end}`];
      });
      const reg: Cell[][] = [];
      for (const roll of sample(rng, seq(2101, 8), ri(rng, 1, 5))) {
        for (const s of sample(rng, slots, ri(rng, Math.min(2, slots.length), Math.min(5, slots.length)))) reg.push([roll, s[0]!]);
      }
      return { ExamSlot: slots, ExamRegistration: reg };
    },
    solution: [
      "SELECT ra.roll_no, a.subject_code AS first_subject, b.subject_code AS second_subject,",
      "       TIMESTAMPDIFF(MINUTE, GREATEST(a.starts_at, b.starts_at), LEAST(a.ends_at, b.ends_at)) AS overlap_minutes",
      "FROM ExamRegistration ra",
      "JOIN ExamRegistration rb ON rb.roll_no = ra.roll_no AND rb.exam_id <> ra.exam_id",
      "JOIN ExamSlot a ON a.exam_id = ra.exam_id",
      "JOIN ExamSlot b ON b.exam_id = rb.exam_id",
      "WHERE a.starts_at < b.ends_at AND b.starts_at < a.ends_at",
      "  AND (a.starts_at < b.starts_at OR (a.starts_at = b.starts_at AND a.exam_id < b.exam_id))",
      "ORDER BY ra.roll_no, first_subject, second_subject",
    ].join("\n"),
    alternatives: [
      "SELECT roll_no, first_subject, second_subject, overlap_minutes FROM (SELECT ra.roll_no, a.subject_code AS first_subject, b.subject_code AS second_subject, TIMESTAMPDIFF(MINUTE, CASE WHEN a.starts_at > b.starts_at THEN a.starts_at ELSE b.starts_at END, CASE WHEN a.ends_at < b.ends_at THEN a.ends_at ELSE b.ends_at END) AS overlap_minutes FROM ExamRegistration ra, ExamRegistration rb, ExamSlot a, ExamSlot b WHERE ra.roll_no = rb.roll_no AND a.exam_id = ra.exam_id AND b.exam_id = rb.exam_id AND (a.starts_at < b.starts_at OR (a.starts_at = b.starts_at AND a.exam_id < b.exam_id))) t WHERE overlap_minutes > 0 ORDER BY 1, 2, 3",
    ],
    ordered: true,
    hints: [
      "Pair each student's registrations with their other registrations — a self join on `roll_no`.",
      "Two intervals overlap exactly when each starts before the other ends; strict comparisons make touching slots safe.",
      "To list each pair once in the right orientation, require the first exam to start earlier (or start together with a smaller id). The overlap runs from the later start to the earlier end.",
    ],
    editorial: [
      "Clashes are pairs of rows, so the shape is a **self join**: each registration is joined with the same student's other registrations, and both sides are joined to `ExamSlot` for their times.",
      "",
      "Two intervals [s1, e1) and [s2, e2) overlap exactly when `s1 < e2 AND s2 < e1`. The comparisons are strict, so slots that merely touch — 09:30–12:30 and 12:30–14:00 — are not a clash. This single test covers every arrangement: one slot inside the other, partial overlaps on either side, identical slots.",
      "",
      "A self join produces every clash twice, as (A, B) and (B, A). The orientation rule in the statement picks one: the first exam starts earlier, or starts at the same time with the smaller `exam_id`. The overlap is from the later of the two starts to the earlier of the two ends, `TIMESTAMPDIFF(MINUTE, GREATEST(starts), LEAST(ends))`.",
      "",
      "The alternative computes that duration for every oriented pair and keeps the positive ones, which is the same condition expressed through the result. The cost is quadratic in each student's registrations, which is a handful.",
    ].join("\n"),
  },

  {
    slug: "day-each-branch-crossed-half-placed",
    title: "Day Each Branch Crossed 50% Placement",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates", "Subqueries"],
    description: [
      "The placement cell celebrates the day each branch gets **half its students placed**. A student is placed on the date of their **earliest accepted offer**; later offers to the same student change nothing, and declined or revoked offers never count.",
      "",
      "For every branch that reached the mark, return `branch`, `students` (all students of the branch), `crossed_on` (the first date on which the number of placed students reached at least half of `students`) and `placed_by_then` (placed students as of the end of that date). Branches that never reached half are left out. Order the rows by `branch`.",
    ].join("\n"),
    tables: [
      {
        name: "Student",
        columns: [
          { name: "roll_no", type: "int" },
          { name: "name", type: "varchar" },
          { name: "branch", type: "varchar" },
        ],
        primaryKey: ["roll_no"],
        note: "One row per final-year student.",
      },
      {
        name: "PlacementOffer",
        columns: [
          { name: "offer_id", type: "int" },
          { name: "roll_no", type: "int" },
          { name: "company", type: "varchar" },
          { name: "offered_on", type: "date" },
          { name: "offer_status", type: "enum", values: ["accepted", "declined", "revoked"] },
        ],
        primaryKey: ["offer_id"],
        note: "`roll_no` is always in `Student`; a student may accept more than one offer.",
      },
    ],
    examples: [
      {
        Student: [
          [2101, "Aarav", "CSE"],
          [2102, "Diya", "CSE"],
          [2103, "Ishaan", "CSE"],
          [2104, "Kavya", "CSE"],
          [2105, "Neha", "ECE"],
          [2106, "Rohan", "ECE"],
          [2107, "Sneha", "ECE"],
          [2108, "Vikram", "MECH"],
          [2109, "Zara", "MECH"],
        ],
        PlacementOffer: [
          [1, 2101, "Atlassian", "2024-08-05", "accepted"],
          [2, 2101, "Zoho", "2024-08-20", "accepted"],
          [3, 2102, "TCS", "2024-08-12", "declined"],
          [4, 2103, "Razorpay", "2024-08-12", "accepted"],
          [5, 2105, "Wipro", "2024-08-07", "accepted"],
          [6, 2106, "Infosys", "2024-09-02", "accepted"],
          [7, 2107, "Accenture", "2024-09-02", "accepted"],
          [8, 2108, "Deloitte", "2024-08-30", "revoked"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const who = names(rng, n);
      const branches = sample(rng, BRANCHES, ri(rng, 1, 3));
      const students = who.map((name, i) => [2101 + i, name, pick(rng, branches)]);
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 18);
      const status = ["accepted", "accepted", "accepted", "declined", "revoked"] as const;
      return {
        Student: students,
        PlacementOffer: seq(1, m).map((id) => [
          id,
          2101 + ri(rng, 0, n - 1),
          pick(rng, COMPANIES),
          pick(rng, ["2024-08-05", "2024-08-07", "2024-08-12", "2024-08-20", "2024-09-02", dateBetween(rng, "2024-08-01", "2024-09-30")]),
          pick(rng, status),
        ]),
      };
    },
    solution: [
      "WITH placed AS (",
      "  SELECT s.branch, o.roll_no, MIN(o.offered_on) AS placed_on",
      "  FROM PlacementOffer o",
      "  JOIN Student s ON s.roll_no = o.roll_no",
      "  WHERE o.offer_status = 'accepted'",
      "  GROUP BY s.branch, o.roll_no",
      "), daily AS (",
      "  SELECT branch, placed_on, COUNT(*) AS newly_placed",
      "  FROM placed",
      "  GROUP BY branch, placed_on",
      "), running AS (",
      "  SELECT branch, placed_on,",
      "         SUM(newly_placed) OVER (PARTITION BY branch ORDER BY placed_on ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS placed_by_then",
      "  FROM daily",
      "), sizes AS (",
      "  SELECT branch, COUNT(*) AS students FROM Student GROUP BY branch",
      "), crossed AS (",
      "  SELECT r.branch, z.students, r.placed_on, r.placed_by_then,",
      "         ROW_NUMBER() OVER (PARTITION BY r.branch ORDER BY r.placed_on) AS rn",
      "  FROM running r",
      "  JOIN sizes z ON z.branch = r.branch",
      "  WHERE r.placed_by_then * 2 >= z.students",
      ")",
      "SELECT branch, students, placed_on AS crossed_on, placed_by_then",
      "FROM crossed",
      "WHERE rn = 1",
      "ORDER BY branch",
    ].join("\n"),
    alternatives: [
      [
        "WITH placed AS (SELECT s.branch, o.roll_no, MIN(o.offered_on) AS placed_on FROM PlacementOffer o JOIN Student s ON s.roll_no = o.roll_no WHERE o.offer_status = 'accepted' GROUP BY s.branch, o.roll_no),",
        "cand AS (SELECT DISTINCT p.branch, p.placed_on, (SELECT COUNT(*) FROM placed q WHERE q.branch = p.branch AND q.placed_on <= p.placed_on) AS placed_by_then, (SELECT COUNT(*) FROM Student z WHERE z.branch = p.branch) AS students FROM placed p)",
        "SELECT c.branch, c.students, c.placed_on AS crossed_on, c.placed_by_then FROM cand c WHERE c.placed_by_then * 2 >= c.students AND c.placed_on = (SELECT MIN(d.placed_on) FROM cand d WHERE d.branch = c.branch AND d.placed_by_then * 2 >= d.students) ORDER BY c.branch",
      ].join(" "),
    ],
    ordered: true,
    hints: [
      "First find each student's placement date: the MIN offer date over their accepted offers.",
      "Count new placements per branch per day, then take a running total in date order.",
      "The answer is the first day whose running total × 2 reaches the branch size — the size comes from `Student`, not from the offers.",
    ],
    editorial: [
      "Break the question into a chain of CTEs. **placed**: one row per placed student with their placement date, `MIN(offered_on)` over accepted offers — a student accepting two offers is placed once, on the earlier day. **daily**: how many students of each branch were placed on each date. Grouping by date first matters, because several students placed on the same day must enter the running total together; a running sum over raw rows would report a date with only some of that day's placements counted.",
      "",
      "**running**: `SUM(newly_placed) OVER (PARTITION BY branch ORDER BY placed_on ROWS …)` is the cumulative number placed by the end of each date; dates are unique per branch after grouping, so the frame is exact. **sizes** counts every student of the branch, placed or not. Finally keep the dates where `placed_by_then * 2 >= students` — integer arithmetic, so 2 of 4 counts — and take the earliest per branch with `ROW_NUMBER()`. Branches that never get there have no qualifying date and drop out.",
      "",
      "The alternative replaces the window with a correlated count of students placed on or before each candidate date, and picks the minimum qualifying date with another subquery — the same logic, quadratic in the number of placements.",
    ].join("\n"),
  },
];
