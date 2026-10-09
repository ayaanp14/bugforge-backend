import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, chance, dateBetween, LAST_NAMES, names, pick, ri, roundTo, sample, shuffle } from "./kit.js";

/**
 * Healthcare: the questions a hospital's analysts, ward managers, pharmacists
 * and claims desk ask of their own data — lab turnaround breaches, controlled
 * prescriptions, OPD no-shows, bed occupancy on a census date, 30-day
 * readmissions, pharmacy stock against reorder levels and expiry, cashless
 * insurance claims and their settlement funnel, ICU over-capacity streaks,
 * median length of stay, patient retention cohorts and double-booked doctors.
 * Rupee amounts, Indian names and mobile numbers, dates in 2023–2025.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
const pad = (n: number) => String(n).padStart(2, "0");
/** 'YYYY-MM-DD HH:MM:SS' from a date and an offset in seconds from its midnight (may run past midnight). */
function stamp(date: string, secs: number): string {
  const d = new Date(Date.parse(`${date}T00:00:00Z`) + secs * 1000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}
const fullName = (first: string, rng: () => number) => `${first} ${pick(rng, LAST_NAMES)}`;

const LAB_TESTS = ["CBC", "HbA1c", "Lipid Profile", "LFT", "KFT", "Thyroid Panel", "Urine Routine", "Blood Culture"] as const;
const SPECIALTIES = ["Cardiology", "Orthopaedics", "Paediatrics", "Dermatology", "General Medicine", "ENT", "Neurology"] as const;
const DRUGS = [
  ["Paracetamol 500mg", "OTC"], ["Amoxicillin 500mg", "H"], ["Alprazolam 0.5mg", "H1"], ["Tramadol 50mg", "H1"],
  ["Morphine 10mg", "X"], ["Cetirizine 10mg", "OTC"], ["Metformin 500mg", "H"], ["Zolpidem 10mg", "H1"],
  ["Pantoprazole 40mg", "H"], ["Ketamine 50mg", "X"],
] as const;
const MEDICINES = [
  "Paracetamol 500mg", "Amoxicillin 500mg", "Azithromycin 500mg", "Metformin 500mg", "Atorvastatin 10mg",
  "Pantoprazole 40mg", "Insulin Glargine", "Salbutamol Inhaler", "ORS Sachet", "Ceftriaxone 1g",
] as const;
const INSURERS = ["Star Health", "HDFC Ergo", "Niva Bupa", "ICICI Lombard", "Care Health"] as const;

export const WORLD_HEALTHCARE: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "lab-reports-breaching-24-hour-turnaround",
    title: "Lab Reports Breaching the 24-Hour Turnaround",
    difficulty: "EASY",
    topics: ["Basics", "Dates"],
    description: [
      "The hospital lab promises every report within **24 hours of sample collection**. The quality team wants the breaches: a report delivered **more than 24 hours** after collection (exactly 24 hours is on time), or a report that has **not been delivered yet** (`reported_at` is NULL).",
      "",
      "Return `order_id`, `test_name` and `collected_at` of every breach, **ordered by `collected_at`, then `order_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "LabOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "patient_id", type: "int" },
          { name: "test_name", type: "varchar" },
          { name: "collected_at", type: "datetime" },
          { name: "reported_at", type: "datetime" },
        ],
        primaryKey: ["order_id"],
        note: "One row per lab test ordered. `reported_at` is when the signed report reached the doctor, or NULL while it is pending.",
      },
    ],
    examples: [
      {
        LabOrder: [
          [5001, 301, "CBC", "2025-03-03 08:15:00", "2025-03-03 13:40:00"],
          [5002, 302, "Blood Culture", "2025-03-03 09:00:00", "2025-03-05 10:20:00"],
          [5003, 303, "HbA1c", "2025-03-03 10:30:00", "2025-03-04 10:30:00"],
          [5004, 301, "Lipid Profile", "2025-03-03 11:05:00", null],
          [5005, 304, "Thyroid Panel", "2025-03-03 11:05:00", "2025-03-04 11:05:01"],
          [5006, 305, "KFT", "2025-03-04 07:45:00", "2025-03-04 18:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 16);
      const day = dateBetween(rng, "2024-01-01", "2025-11-30");
      const rows: Cell[][] = seq(7001, n).map((id) => {
        const start = ri(rng, 0, 4) * 86400 + ri(rng, 6 * 3600, 20 * 3600);
        const roll = rng();
        // Mostly on time; some late, some pending, some exactly at the 24-hour line or one second past it.
        const tat = roll < 0.5 ? ri(rng, 2 * 3600, 23 * 3600) : roll < 0.65 ? 86400 : roll < 0.75 ? 86401 : ri(rng, 25 * 3600, 70 * 3600);
        return [id, ri(rng, 301, 330), pick(rng, LAB_TESTS), stamp(day, start), chance(rng, 0.15) ? null : stamp(day, start + tat)];
      });
      return { LabOrder: shuffle(rng, rows) };
    },
    solution: [
      "SELECT order_id, test_name, collected_at",
      "FROM LabOrder",
      "WHERE reported_at IS NULL",
      "   OR TIMESTAMPDIFF(SECOND, collected_at, reported_at) > 86400",
      "ORDER BY collected_at, order_id",
    ].join("\n"),
    alternatives: [
      "SELECT order_id, test_name, collected_at FROM LabOrder WHERE reported_at IS NULL OR reported_at > DATE_ADD(collected_at, INTERVAL 24 HOUR) ORDER BY collected_at, order_id",
      "SELECT order_id, test_name, collected_at FROM LabOrder WHERE COALESCE(TIMESTAMPDIFF(SECOND, collected_at, reported_at), 86401) > 86400 ORDER BY collected_at, order_id",
    ],
    ordered: true,
    hints: [
      "There are two kinds of breach: a late report and a missing one. Each needs its own condition.",
      "A comparison with NULL is never true, so a pending report must be caught with `IS NULL` explicitly.",
      "Measure the gap in seconds (or compare against collection time plus 24 hours) — whole hours would round a report 24 h 30 min late down to 24.",
    ],
    editorial: [
      "The query is a filter with two branches joined by `OR`. The first, `reported_at IS NULL`, catches the reports still pending — a NULL in any comparison yields unknown, so without this branch the pending tests, which are the worst breaches of all, would silently disappear from the list.",
      "",
      "The second branch measures the turnaround. `TIMESTAMPDIFF(SECOND, collected_at, reported_at) > 86400` is exact: a report delivered exactly 24 hours later gives 86400 and is on time, one second more is a breach. Using `TIMESTAMPDIFF(HOUR, …)` would be wrong here because it truncates — 24 hours and 59 minutes is still 24 whole hours. Comparing `reported_at` with `DATE_ADD(collected_at, INTERVAL 24 HOUR)` is the same test written as a date comparison, and wrapping the difference in `COALESCE` with a value past the limit folds the NULL case into one condition.",
      "",
      "The order is fixed by the statement, with `order_id` breaking ties between samples collected at the same moment. One pass over the table.",
    ].join("\n"),
  },

  {
    slug: "controlled-drug-prescriptions-with-prescriber",
    title: "Controlled Drug Prescriptions With Their Prescriber",
    difficulty: "EASY",
    topics: ["Joins", "Basics"],
    description: [
      "Under India's Drugs and Cosmetics Rules, medicines in **Schedule H1** and **Schedule X** must be logged in a separate register with the prescriber's name. The pharmacy needs that register from its prescription data.",
      "",
      "Return every prescription of a drug whose `schedule` is `H1` or `X`, with columns `rx_id`, `rx_date`, `doctor_name` (the prescriber's `name`) and `drug_name`. Prescriptions of other schedules are left out. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Doctor",
        columns: [
          { name: "doctor_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "specialty", type: "varchar" },
        ],
        primaryKey: ["doctor_id"],
        note: "One row per doctor allowed to prescribe at the hospital.",
      },
      {
        name: "Drug",
        columns: [
          { name: "drug_id", type: "int" },
          { name: "drug_name", type: "varchar" },
          { name: "schedule", type: "enum", values: ["OTC", "H", "H1", "X"] },
        ],
        primaryKey: ["drug_id"],
        note: "The formulary. `schedule` is the drug's legal category; OTC needs no prescription.",
      },
      {
        name: "Prescription",
        columns: [
          { name: "rx_id", type: "int" },
          { name: "doctor_id", type: "int" },
          { name: "drug_id", type: "int" },
          { name: "patient_id", type: "int" },
          { name: "rx_date", type: "date" },
        ],
        primaryKey: ["rx_id"],
        note: "One row per drug prescribed. `doctor_id` and `drug_id` always exist in their tables.",
      },
    ],
    examples: [
      {
        Doctor: [
          [11, "Priya Nair", "Psychiatry"],
          [12, "Arjun Rao", "Orthopaedics"],
          [13, "Sneha Iyer", "General Medicine"],
        ],
        Drug: [
          [1, "Paracetamol 500mg", "OTC"],
          [2, "Alprazolam 0.5mg", "H1"],
          [3, "Tramadol 50mg", "H1"],
          [4, "Morphine 10mg", "X"],
          [5, "Amoxicillin 500mg", "H"],
        ],
        Prescription: [
          [9001, 11, 2, 401, "2025-04-02"],
          [9002, 12, 3, 402, "2025-04-02"],
          [9003, 13, 1, 403, "2025-04-03"],
          [9004, 12, 4, 404, "2025-04-03"],
          [9005, 13, 5, 405, "2025-04-04"],
          [9006, 11, 2, 406, "2025-04-05"],
        ],
      },
    ],
    gen: (rng) => {
      const docs = names(rng, ri(rng, 1, 5)).map((f, i) => [21 + i, fullName(f, rng), pick(rng, SPECIALTIES)]);
      const drugs = sample(rng, DRUGS, ri(rng, 2, 8)).map(([name, sch], i) => [i + 1, name, sch]);
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 18);
      const rx = seq(9101, m).map((id) => [id, pick(rng, docs)[0]!, pick(rng, drugs)[0]!, ri(rng, 401, 440), dateBetween(rng, "2024-01-01", "2025-12-31")]);
      return { Doctor: docs, Drug: drugs, Prescription: rx };
    },
    solution: [
      "SELECT p.rx_id, p.rx_date, d.name AS doctor_name, g.drug_name",
      "FROM Prescription p",
      "JOIN Doctor d ON d.doctor_id = p.doctor_id",
      "JOIN Drug g ON g.drug_id = p.drug_id",
      "WHERE g.schedule IN ('H1', 'X')",
    ].join("\n"),
    alternatives: [
      "SELECT p.rx_id, p.rx_date, (SELECT name FROM Doctor d WHERE d.doctor_id = p.doctor_id) AS doctor_name, (SELECT drug_name FROM Drug g WHERE g.drug_id = p.drug_id) AS drug_name FROM Prescription p WHERE p.drug_id IN (SELECT drug_id FROM Drug WHERE schedule = 'H1' OR schedule = 'X')",
      "SELECT p.rx_id, p.rx_date, d.name AS doctor_name, g.drug_name FROM Doctor d, Drug g, Prescription p WHERE d.doctor_id = p.doctor_id AND g.drug_id = p.drug_id AND g.schedule <> 'OTC' AND g.schedule <> 'H'",
    ],
    hints: [
      "Each output row is one prescription; the doctor's name and the drug's name live in two other tables.",
      "Join `Prescription` to `Doctor` and to `Drug` on their ids, then filter on the drug's schedule.",
      "`IN ('H1', 'X')` keeps both schedules in one condition.",
    ],
    editorial: [
      "A prescription row carries only ids, so the register is built by joining it to both lookup tables: `Doctor` on `doctor_id` for the prescriber's name and `Drug` on `drug_id` for the drug's name and schedule. Each prescription matches exactly one doctor and one drug, so the joins neither drop nor duplicate rows.",
      "",
      "With the three tables side by side the question is a filter on the drug's schedule. `IN ('H1', 'X')` reads exactly like the rule; listing the excluded schedules instead works only because the enum has four values and would break the day a new schedule is added, which is why the positive list is the better habit.",
      "",
      "The same answer can be written with scalar subqueries that look up each name, and an `IN` subquery for the controlled drugs. With primary-key lookups every form costs one probe per prescription.",
    ].join("\n"),
  },

  {
    slug: "completed-opd-visits-per-department-march-2025",
    title: "Completed OPD Visits per Department in March 2025",
    difficulty: "EASY",
    topics: ["Aggregation", "Dates", "Joins"],
    description: [
      "The outpatient department (OPD) books appointments with doctors, and each doctor belongs to one department. Management wants March 2025's workload.",
      "",
      "For each department, return `department` and `completed_visits`: the number of appointments with status `completed` whose `appt_date` falls in **March 2025**. Departments with no completed visit that month are left out. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Doctor",
        columns: [
          { name: "doctor_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "department", type: "varchar" },
        ],
        primaryKey: ["doctor_id"],
      },
      {
        name: "Appointment",
        columns: [
          { name: "appt_id", type: "int" },
          { name: "doctor_id", type: "int" },
          { name: "patient_id", type: "int" },
          { name: "appt_date", type: "date" },
          { name: "status", type: "enum", values: ["scheduled", "completed", "no_show", "cancelled"] },
        ],
        primaryKey: ["appt_id"],
        note: "One row per OPD booking. `doctor_id` always exists in `Doctor`.",
      },
    ],
    examples: [
      {
        Doctor: [
          [1, "Kavya Menon", "Cardiology"],
          [2, "Rohan Gupta", "Cardiology"],
          [3, "Aisha Khan", "Dermatology"],
          [4, "Vikram Joshi", "ENT"],
        ],
        Appointment: [
          [101, 1, 501, "2025-03-01", "completed"],
          [102, 2, 502, "2025-03-14", "completed"],
          [103, 3, 503, "2025-03-31", "completed"],
          [104, 3, 504, "2025-04-01", "completed"],
          [105, 4, 505, "2025-03-20", "no_show"],
          [106, 1, 506, "2025-02-28", "completed"],
          [107, 2, 507, "2025-03-22", "cancelled"],
        ],
      },
    ],
    gen: (rng) => {
      const depts = sample(rng, SPECIALTIES, ri(rng, 1, 4));
      const docs = names(rng, ri(rng, 1, 6)).map((f, i) => [i + 1, fullName(f, rng), pick(rng, depts)]);
      const m = ri(rng, 0, 20);
      const statuses = ["scheduled", "completed", "completed", "completed", "no_show", "cancelled"] as const;
      const appts = seq(201, m).map((id) => {
        const date = chance(rng, 0.2) ? pick(rng, ["2025-02-28", "2025-03-01", "2025-03-31", "2025-04-01", "2024-03-15"]) : dateBetween(rng, "2025-02-20", "2025-04-10");
        return [id, pick(rng, docs)[0]!, ri(rng, 501, 560), date, pick(rng, statuses)];
      });
      return { Doctor: docs, Appointment: appts };
    },
    solution: [
      "SELECT d.department, COUNT(*) AS completed_visits",
      "FROM Appointment a",
      "JOIN Doctor d ON d.doctor_id = a.doctor_id",
      "WHERE a.status = 'completed'",
      "  AND a.appt_date BETWEEN '2025-03-01' AND '2025-03-31'",
      "GROUP BY d.department",
    ].join("\n"),
    alternatives: [
      "SELECT d.department, COUNT(a.appt_id) AS completed_visits FROM Doctor d JOIN Appointment a ON a.doctor_id = d.doctor_id AND a.status = 'completed' AND YEAR(a.appt_date) = 2025 AND MONTH(a.appt_date) = 3 GROUP BY d.department",
      "SELECT department, SUM(CASE WHEN DATE_FORMAT(a.appt_date, '%Y-%m') = '2025-03' AND a.status = 'completed' THEN 1 ELSE 0 END) AS completed_visits FROM Appointment a JOIN Doctor d ON d.doctor_id = a.doctor_id GROUP BY department HAVING completed_visits > 0",
    ],
    hints: [
      "The department is on the doctor, so the appointment needs its doctor's row first.",
      "Filter to completed visits in March 2025 before grouping — both the first and the last day of the month count.",
      "Group by department and count the rows left.",
    ],
    editorial: [
      "An appointment knows its doctor but not the department, so the first step is a join from `Appointment` to `Doctor`. Then filter the rows down to what is being counted — status `completed` and a date inside March 2025 — and group what remains by department; `COUNT(*)` per group is the answer.",
      "",
      "Because the filter runs before grouping, a department whose doctors had only no-shows or visits in other months has no rows left and does not appear, which is what the statement asks. The month test can be written as `BETWEEN '2025-03-01' AND '2025-03-31'` (dates compare correctly as fixed-format text, and both ends are inclusive), as `YEAR(...) = 2025 AND MONTH(...) = 3`, or with `DATE_FORMAT(..., '%Y-%m')`. The range form is the one an index on `appt_date` can use.",
      "",
      "Conditional aggregation also works — count with a CASE inside SUM — but then the departments with a zero total must be removed with HAVING.",
    ].join("\n"),
  },

  {
    slug: "medicine-batches-expiring-within-90-days",
    title: "Medicine Batches Expiring Within 90 Days",
    difficulty: "EASY",
    topics: ["Dates", "Basics"],
    description: [
      "The hospital pharmacy returns near-expiry stock to distributors for credit, but only while it has not expired yet. Take **2025-06-30** as today.",
      "",
      "Return every batch that still has stock (`quantity` greater than 0) and whose `expiry_date` is **on or after today and at most 90 days after it**, with columns `batch_id`, `medicine`, `quantity` and `days_left` (days from today to the expiry date). Order by **`days_left`, then `batch_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "PharmacyBatch",
        columns: [
          { name: "batch_id", type: "int" },
          { name: "medicine", type: "varchar" },
          { name: "quantity", type: "int" },
          { name: "expiry_date", type: "date" },
        ],
        primaryKey: ["batch_id"],
        note: "One row per batch received; `quantity` is the number of units still on the shelf.",
      },
    ],
    examples: [
      {
        PharmacyBatch: [
          [1, "Amoxicillin 500mg", 120, "2025-07-15"],
          [2, "Paracetamol 500mg", 0, "2025-07-01"],
          [3, "Insulin Glargine", 18, "2025-06-30"],
          [4, "ORS Sachet", 300, "2025-09-28"],
          [5, "Ceftriaxone 1g", 40, "2025-09-29"],
          [6, "Atorvastatin 10mg", 75, "2025-06-12"],
          [7, "Salbutamol Inhaler", 22, "2025-07-15"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 15);
      const rows = seq(1, n).map((id) => {
        const offset = chance(rng, 0.25) ? pick(rng, [-1, 0, 90, 91]) : ri(rng, -60, 150);
        return [id, pick(rng, MEDICINES), chance(rng, 0.15) ? 0 : ri(rng, 1, 400), addDays("2025-06-30", offset)];
      });
      return { PharmacyBatch: shuffle(rng, rows) };
    },
    solution: [
      "SELECT batch_id, medicine, quantity, DATEDIFF(expiry_date, '2025-06-30') AS days_left",
      "FROM PharmacyBatch",
      "WHERE quantity > 0",
      "  AND expiry_date BETWEEN '2025-06-30' AND DATE_ADD('2025-06-30', INTERVAL 90 DAY)",
      "ORDER BY days_left, batch_id",
    ].join("\n"),
    alternatives: [
      "SELECT batch_id, medicine, quantity, DATEDIFF(expiry_date, '2025-06-30') AS days_left FROM PharmacyBatch WHERE quantity > 0 AND DATEDIFF(expiry_date, '2025-06-30') BETWEEN 0 AND 90 ORDER BY 4, 1",
      "SELECT * FROM (SELECT batch_id, medicine, quantity, DATEDIFF(expiry_date, '2025-06-30') AS days_left FROM PharmacyBatch WHERE quantity <> 0) t WHERE days_left >= 0 AND days_left <= 90 ORDER BY days_left, batch_id",
    ],
    ordered: true,
    hints: [
      "`DATEDIFF(later, earlier)` gives whole days, positive when the first date is later.",
      "The window is inclusive at both ends: expiring today is 0 days left, and 90 days left still counts.",
      "Don't forget the batches with nothing left on the shelf.",
    ],
    editorial: [
      "Every condition is about a single row, so this is a filter plus a computed column. `DATEDIFF(expiry_date, '2025-06-30')` is the number of days left: 0 for a batch expiring today, negative for one already expired. The batch qualifies when that number is between 0 and 90 inclusive and the batch still holds stock.",
      "",
      "The same window can be written on the dates themselves — `expiry_date BETWEEN '2025-06-30' AND DATE_ADD('2025-06-30', INTERVAL 90 DAY)` — which lets an index on `expiry_date` find the batches without computing a difference for every row. Both ends matter: a batch expiring exactly on day 90 is still returnable, day 91 is not, and yesterday's expiry is a write-off, not a return.",
      "",
      "Batches with `quantity` 0 are empty slots in the register and nothing can be returned from them. Order by the computed column, with `batch_id` breaking ties between batches expiring on the same day.",
    ].join("\n"),
  },

  {
    slug: "patient-mobile-numbers-that-cannot-get-sms",
    title: "Patient Mobile Numbers That Cannot Get SMS Reminders",
    difficulty: "EASY",
    topics: ["Strings", "Basics"],
    description: [
      "Appointment reminders go out by SMS, and the gateway accepts only a plain Indian mobile number: **exactly 10 digits, the first one 6, 7, 8 or 9** — no spaces, no `+91`, nothing else. Reception typed some numbers in other ways, and some patients gave none.",
      "",
      "Return `patient_id`, `name` and `mobile` of every patient whose number the gateway would refuse, **including a NULL `mobile`**, ordered by `patient_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Patient",
        columns: [
          { name: "patient_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "mobile", type: "varchar" },
        ],
        primaryKey: ["patient_id"],
        note: "`mobile` is free text as typed at registration, or NULL when the patient gave no number.",
      },
    ],
    examples: [
      {
        Patient: [
          [1, "Aarav Sharma", "9845012345"],
          [2, "Diya Reddy", "+919845012346"],
          [3, "Kabir Singh", "98450 12347"],
          [4, "Meera Das", null],
          [5, "Nikhil Rao", "5123456789"],
          [6, "Pooja Patel", "7012345678"],
          [7, "Farhan Khan", "984501234"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const digits = (k: number) => Array.from({ length: k }, () => String(ri(rng, 0, 9))).join("");
      const rows = names(rng, n).map((f, i) => {
        const good = `${ri(rng, 6, 9)}${digits(9)}`;
        const roll = rng();
        const mobile =
          roll < 0.5 ? good
          : roll < 0.58 ? null
          : roll < 0.66 ? `+91${good}`
          : roll < 0.74 ? `${good.slice(0, 5)} ${good.slice(5)}`
          : roll < 0.82 ? `${ri(rng, 0, 5)}${digits(9)}`
          : roll < 0.9 ? good.slice(0, 9)
          : roll < 0.95 ? `${good}${ri(rng, 0, 9)}`
          : `0${good.slice(1)}`;
        return [i + 1, fullName(f, rng), mobile];
      });
      return { Patient: shuffle(rng, rows) };
    },
    solution: [
      "SELECT patient_id, name, mobile",
      "FROM Patient",
      "WHERE mobile IS NULL",
      "   OR mobile NOT REGEXP '^[6-9][0-9]{9}$'",
      "ORDER BY patient_id",
    ].join("\n"),
    alternatives: [
      "SELECT patient_id, name, mobile FROM Patient WHERE NOT (mobile IS NOT NULL AND CHAR_LENGTH(mobile) = 10 AND LEFT(mobile, 1) IN ('6', '7', '8', '9') AND mobile NOT REGEXP '[^0-9]') ORDER BY patient_id",
      "SELECT patient_id, name, mobile FROM Patient WHERE CASE WHEN mobile REGEXP '^[6-9][0-9]{9}$' THEN 0 ELSE 1 END = 1 ORDER BY patient_id",
    ],
    ordered: true,
    hints: [
      "Describe a *valid* number as a pattern, then keep the rows that do not match it.",
      "Anchor the pattern at both ends (`^…$`), or extra characters before or after would still match.",
      "`NULL NOT REGEXP …` is NULL, not true — handle a missing number on its own.",
    ],
    editorial: [
      "A valid number is easiest to describe as a regular expression: `^[6-9][0-9]{9}$` — one leading digit from 6 to 9, then exactly nine more digits, and nothing before or after thanks to the anchors. Every patient whose number does **not** match is refused by the gateway: a `+91` prefix, a space in the middle, a landline-style leading 0 or 5, nine or eleven digits.",
      "",
      "The trap is the NULL. `mobile NOT REGEXP …` on a NULL is NULL, which `WHERE` treats as false, so a patient with no number would be dropped — yet they are exactly the people who will never get a reminder. The explicit `mobile IS NULL` branch keeps them. A CASE that maps a match to 0 and everything else (including NULL) to 1 gets the same effect in one expression.",
      "",
      "Without regular expressions the rule splits into three tests: length 10, first character in 6–9, and no character outside 0–9 (`NOT REGEXP '[^0-9]'`, or a chain of REPLACE calls). One pass over the table.",
    ].join("\n"),
  },

  {
    slug: "insurance-claim-settlement-labels",
    title: "Label Each Insurance Claim by How It Settled",
    difficulty: "EASY",
    topics: ["Conditional Logic"],
    description: [
      "The billing desk files a cashless claim with the patient's insurer for every insured discharge. Once the insurer processes it, the approved amount is recorded.",
      "",
      "Return `claim_id`, `claimed_amount`, `approved_amount` and `settlement`, where `settlement` is: `Pending` when `approved_amount` is NULL; `Rejected` when it is 0; `Full` when it is **at least** the claimed amount; `Partial` otherwise. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "InsuranceClaim",
        columns: [
          { name: "claim_id", type: "int" },
          { name: "patient_id", type: "int" },
          { name: "insurer", type: "varchar" },
          { name: "claimed_amount", type: "int" },
          { name: "approved_amount", type: "int" },
        ],
        primaryKey: ["claim_id"],
        note: "Amounts in rupees. `approved_amount` is NULL until the insurer has processed the claim.",
      },
    ],
    examples: [
      {
        InsuranceClaim: [
          [801, 11, "Star Health", 85000, 85000],
          [802, 12, "HDFC Ergo", 142000, 118500],
          [803, 13, "Niva Bupa", 36000, 0],
          [804, 14, "Care Health", 61000, null],
          [805, 15, "ICICI Lombard", 54000, 54000],
          [806, 16, "Star Health", 230000, 4000],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 15);
      const rows = seq(801, n).map((id) => {
        const claimed = roundTo(rng, 15000, 400000, 500);
        const roll = rng();
        const approved = roll < 0.2 ? null : roll < 0.35 ? 0 : roll < 0.6 ? claimed : roll < 0.65 ? claimed + 500 : roundTo(rng, 500, claimed - 500, 500);
        return [id, ri(rng, 11, 60), pick(rng, INSURERS), claimed, approved];
      });
      return { InsuranceClaim: rows };
    },
    solution: [
      "SELECT claim_id, claimed_amount, approved_amount,",
      "       CASE",
      "         WHEN approved_amount IS NULL THEN 'Pending'",
      "         WHEN approved_amount = 0 THEN 'Rejected'",
      "         WHEN approved_amount >= claimed_amount THEN 'Full'",
      "         ELSE 'Partial'",
      "       END AS settlement",
      "FROM InsuranceClaim",
    ].join("\n"),
    alternatives: [
      "SELECT claim_id, claimed_amount, approved_amount, IF(approved_amount IS NULL, 'Pending', IF(approved_amount = 0, 'Rejected', IF(approved_amount < claimed_amount, 'Partial', 'Full'))) AS settlement FROM InsuranceClaim",
      "SELECT claim_id, claimed_amount, approved_amount, COALESCE(CASE WHEN approved_amount = 0 THEN 'Rejected' WHEN approved_amount >= claimed_amount THEN 'Full' WHEN approved_amount > 0 THEN 'Partial' END, 'Pending') AS settlement FROM InsuranceClaim",
    ],
    hints: [
      "A searched CASE checks its WHEN branches top to bottom and stops at the first true one.",
      "Put the NULL test first: every comparison with a NULL amount is unknown, so it would fall through to ELSE.",
      "Rejected (0) must be tested before Partial, since 0 is also less than the claim.",
    ],
    editorial: [
      "Each claim gets exactly one label from its own row, so this is one `CASE` expression in the select list. The branches are tried in order and the first true one wins, which makes their order part of the logic.",
      "",
      "The NULL test goes first. If it came last, a pending claim would reach the `ELSE` branch — every comparison against NULL is unknown, never true — and be labelled Partial. Next comes `approved_amount = 0` for a rejection, before the `<` comparison that would otherwise also catch it. Then `>= claimed_amount` for a full settlement; the statement says *at least*, so an approval that exceeds the claim (insurers sometimes add room-rent differences back) is Full too. Whatever is left is Partial.",
      "",
      "Nested `IF` calls express the same decision tree; another variant leaves the NULL case to fall out of a CASE with no ELSE and turns that NULL into 'Pending' with `COALESCE`. One pass over the table.",
    ].join("\n"),
  },

  {
    slug: "doctor-names-for-the-prescription-letterhead",
    title: "Doctor Names for the Prescription Letterhead",
    difficulty: "EASY",
    topics: ["Strings", "Conditional Logic"],
    description: [
      "The printed prescription pad shows each doctor as `Dr. <first> <middle initial>. <last>, <qualification>` — for example `Dr. Rahul K. Sharma, MD`. A doctor with no middle name (NULL) is printed without the initial: `Dr. Sneha Iyer, MBBS`.",
      "",
      "Return `doctor_id` and `letterhead` for every doctor, in any order. Names are already stored in the right case; the initial is the **first letter** of the middle name.",
    ].join("\n"),
    tables: [
      {
        name: "Doctor",
        columns: [
          { name: "doctor_id", type: "int" },
          { name: "first_name", type: "varchar" },
          { name: "middle_name", type: "varchar" },
          { name: "last_name", type: "varchar" },
          { name: "qualification", type: "varchar" },
        ],
        primaryKey: ["doctor_id"],
        note: "`middle_name` is NULL for doctors who have none.",
      },
    ],
    examples: [
      {
        Doctor: [
          [1, "Rahul", "Krishna", "Sharma", "MD"],
          [2, "Sneha", null, "Iyer", "MBBS"],
          [3, "Ananya", "Lakshmi", "Menon", "MS"],
          [4, "Kabir", null, "Khan", "DM"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const mids = ["Kumar", "Lakshmi", "Prasad", "Devi", "Mohan", "Rani", "Shankar", "Bai"] as const;
      const rows = names(rng, n).map((f, i) => [i + 1, f, chance(rng, 0.4) ? null : pick(rng, mids), pick(rng, LAST_NAMES), pick(rng, ["MBBS", "MD", "MS", "DM", "MCh", "DNB"])]);
      return { Doctor: rows };
    },
    solution: [
      "SELECT doctor_id,",
      "       CONCAT('Dr. ', CONCAT_WS(' ', first_name, CONCAT(LEFT(middle_name, 1), '.'), last_name), ', ', qualification) AS letterhead",
      "FROM Doctor",
    ].join("\n"),
    alternatives: [
      "SELECT doctor_id, CASE WHEN middle_name IS NULL THEN CONCAT('Dr. ', first_name, ' ', last_name, ', ', qualification) ELSE CONCAT('Dr. ', first_name, ' ', SUBSTRING(middle_name, 1, 1), '. ', last_name, ', ', qualification) END AS letterhead FROM Doctor",
      "SELECT doctor_id, CONCAT('Dr. ', first_name, ' ', IFNULL(CONCAT(LEFT(middle_name, 1), '. '), ''), last_name, ', ', qualification) AS letterhead FROM Doctor",
    ],
    hints: [
      "`LEFT(s, 1)` is the first character of a string.",
      "In MySQL `CONCAT` returns NULL if any argument is NULL — handy for a part that should vanish.",
      "`CONCAT_WS(separator, …)` skips NULL arguments, so it never leaves a double space.",
    ],
    editorial: [
      "The letterhead is string assembly with one optional part. The interesting question is how to make the middle initial disappear cleanly — no `NULL.`, and no double space between first and last name.",
      "",
      "Two MySQL behaviours combine neatly. `CONCAT(LEFT(middle_name, 1), '.')` is NULL whenever `middle_name` is NULL, because CONCAT propagates NULL. `CONCAT_WS(' ', …)` joins its arguments with a space but *skips* NULL ones, so the first name, optional initial and last name come out as `Rahul K. Sharma` or `Sneha Iyer` with exactly one space between the parts. Wrapping that in an outer CONCAT adds the `Dr. ` prefix and the qualification.",
      "",
      "The explicit version is a CASE with one branch per shape, or `IFNULL(CONCAT(initial, '. '), '')` to turn the missing part into an empty string. All three are row-by-row and read the table once.",
    ].join("\n"),
  },

  {
    slug: "average-consultation-fee-by-specialty",
    title: "Average Consultation Fee by Specialty",
    difficulty: "EASY",
    topics: ["Aggregation"],
    description: [
      "Before revising OPD prices the hospital wants the current fee picture. A doctor whose `consultation_fee` is NULL has no fee set yet: they count as a doctor of the specialty but are **left out of the average**.",
      "",
      "Return `specialty`, `doctors` (all doctors of the specialty) and `avg_fee` (the average of the set fees, **rounded to 2 decimals**; NULL if no doctor of the specialty has a fee). Order by **`avg_fee` descending, then `specialty` ascending** — a NULL average sorts last.",
    ].join("\n"),
    tables: [
      {
        name: "Doctor",
        columns: [
          { name: "doctor_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "specialty", type: "varchar" },
          { name: "consultation_fee", type: "int" },
        ],
        primaryKey: ["doctor_id"],
        note: "`consultation_fee` is the OPD fee in rupees, or NULL when not set yet.",
      },
    ],
    examples: [
      {
        Doctor: [
          [1, "Kavya Menon", "Cardiology", 1200],
          [2, "Rohan Gupta", "Cardiology", 900],
          [3, "Aisha Khan", "Dermatology", 800],
          [4, "Vikram Joshi", "Dermatology", null],
          [5, "Ira Bose", "ENT", 700],
          [6, "Dev Mehta", "ENT", 800],
          [7, "Tanvi Rao", "ENT", 800],
          [8, "Harsh Das", "Neurology", null],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 14);
      const specs = sample(rng, SPECIALTIES, ri(rng, 1, 4));
      const rows = (n === 0 ? [] : names(rng, n)).map((f, i) => [i + 1, fullName(f, rng), pick(rng, specs), chance(rng, 0.15) ? null : roundTo(rng, 300, 1500, 100)]);
      return { Doctor: rows };
    },
    solution: [
      "SELECT specialty, COUNT(*) AS doctors, ROUND(AVG(consultation_fee), 2) AS avg_fee",
      "FROM Doctor",
      "GROUP BY specialty",
      "ORDER BY avg_fee DESC, specialty",
    ].join("\n"),
    alternatives: [
      "SELECT specialty, COUNT(doctor_id) AS doctors, ROUND(SUM(consultation_fee) / NULLIF(COUNT(consultation_fee), 0), 2) AS avg_fee FROM Doctor GROUP BY specialty ORDER BY 3 DESC, 1",
    ],
    ordered: true,
    hints: [
      "`COUNT(*)` counts rows; `COUNT(column)` and `AVG(column)` ignore NULLs in that column.",
      "That difference is exactly the rule in the statement — one function for each output column.",
      "ROUND the average to 2 decimals and sort on it.",
    ],
    editorial: [
      "Group by specialty and pick the aggregate that matches each column's rule. `COUNT(*)` counts every doctor row in the group, NULL fee or not. `AVG(consultation_fee)` skips NULLs, so a doctor without a fee does not drag the average towards zero — the average is over the doctors who have one. If none of them has a fee, AVG of no values is NULL, as the statement wants.",
      "",
      "MySQL computes averages of integers as decimals with four places, so the result is rounded to 2 decimals to make it exact and comparable. The same value can be built by hand as `SUM(fee) / COUNT(fee)`, with `NULLIF` to avoid dividing by zero when no fee is set.",
      "",
      "For the order: MySQL treats NULL as smaller than any number, so `ORDER BY avg_fee DESC` puts a NULL average last; ties on the average fall back to the specialty name. One pass and one group per specialty.",
    ].join("\n"),
  },

  // ───────────────────────────── MEDIUM ─────────────────────────────
  {
    slug: "opd-no-show-rate-by-doctor",
    title: "OPD No-Show Rate by Doctor",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Conditional Logic", "Joins"],
    description: [
      "Patients who book an OPD slot and never turn up waste a doctor's time. Only appointments that were **due** count: status `completed` or `no_show`. Cancelled and still-scheduled bookings are ignored.",
      "",
      "For every doctor with **at least 3 due appointments**, return `doctor_id`, `name`, `due_appointments`, `no_shows` and `no_show_pct` = 100 × no_shows ÷ due_appointments, **rounded to 2 decimals**. Order by **`no_show_pct` descending, then `doctor_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "Doctor",
        columns: [
          { name: "doctor_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "department", type: "varchar" },
        ],
        primaryKey: ["doctor_id"],
      },
      {
        name: "Appointment",
        columns: [
          { name: "appt_id", type: "int" },
          { name: "doctor_id", type: "int" },
          { name: "patient_id", type: "int" },
          { name: "slot_at", type: "datetime" },
          { name: "status", type: "enum", values: ["scheduled", "completed", "no_show", "cancelled"] },
        ],
        primaryKey: ["appt_id"],
        note: "One row per OPD booking; `doctor_id` always exists in `Doctor`.",
      },
    ],
    examples: [
      {
        Doctor: [
          [1, "Kavya Menon", "Cardiology"],
          [2, "Rohan Gupta", "Orthopaedics"],
          [3, "Aisha Khan", "Dermatology"],
          [4, "Vikram Joshi", "ENT"],
        ],
        Appointment: [
          [101, 1, 501, "2025-05-05 10:00:00", "completed"],
          [102, 1, 502, "2025-05-05 10:15:00", "no_show"],
          [103, 1, 503, "2025-05-05 10:30:00", "completed"],
          [104, 1, 504, "2025-05-05 10:45:00", "cancelled"],
          [105, 2, 505, "2025-05-05 11:00:00", "no_show"],
          [106, 2, 506, "2025-05-06 11:00:00", "no_show"],
          [107, 2, 507, "2025-05-06 11:15:00", "completed"],
          [108, 2, 508, "2025-05-07 11:15:00", "completed"],
          [109, 3, 509, "2025-05-06 09:00:00", "completed"],
          [110, 3, 510, "2025-05-06 09:20:00", "completed"],
          [111, 3, 511, "2025-05-08 09:00:00", "completed"],
          [112, 4, 512, "2025-05-08 12:00:00", "no_show"],
          [113, 4, 513, "2025-05-08 12:20:00", "completed"],
          [114, 4, 514, "2025-05-20 12:00:00", "scheduled"],
        ],
      },
    ],
    gen: (rng) => {
      const docs = names(rng, ri(rng, 1, 5)).map((f, i) => [i + 1, fullName(f, rng), pick(rng, SPECIALTIES)]);
      const statuses = ["completed", "completed", "completed", "no_show", "no_show", "cancelled", "scheduled"] as const;
      const m = ri(rng, 0, 28);
      const appts = seq(101, m).map((id) => [id, pick(rng, docs)[0]!, ri(rng, 501, 580), stamp(dateBetween(rng, "2025-01-01", "2025-06-30"), ri(rng, 9 * 4, 17 * 4) * 900), pick(rng, statuses)]);
      return { Doctor: docs, Appointment: appts };
    },
    solution: [
      "SELECT d.doctor_id, d.name,",
      "       COUNT(*) AS due_appointments,",
      "       SUM(CASE WHEN a.status = 'no_show' THEN 1 ELSE 0 END) AS no_shows,",
      "       ROUND(100 * SUM(CASE WHEN a.status = 'no_show' THEN 1 ELSE 0 END) / COUNT(*), 2) AS no_show_pct",
      "FROM Doctor d",
      "JOIN Appointment a ON a.doctor_id = d.doctor_id",
      "WHERE a.status IN ('completed', 'no_show')",
      "GROUP BY d.doctor_id, d.name",
      "HAVING COUNT(*) >= 3",
      "ORDER BY no_show_pct DESC, d.doctor_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH due AS (",
        "  SELECT doctor_id, COUNT(*) AS due_appointments, SUM(IF(status = 'no_show', 1, 0)) AS no_shows",
        "  FROM Appointment WHERE status <> 'cancelled' AND status <> 'scheduled'",
        "  GROUP BY doctor_id",
        ")",
        "SELECT d.doctor_id, d.name, u.due_appointments, u.no_shows, ROUND(u.no_shows * 100 / u.due_appointments, 2) AS no_show_pct",
        "FROM due u JOIN Doctor d ON d.doctor_id = u.doctor_id",
        "WHERE u.due_appointments >= 3",
        "ORDER BY no_show_pct DESC, d.doctor_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Filter to the due appointments first, so both the count and the rate use the same rows.",
      "A no-show count is a SUM over a CASE that is 1 for a no-show and 0 otherwise.",
      "The minimum of 3 is a condition on a group — it belongs in HAVING.",
    ],
    editorial: [
      "The rate's denominator is only the appointments that were due, so the cleanest plan is to remove cancelled and scheduled bookings in `WHERE` before grouping. Every remaining row is either completed or a no-show, and per doctor `COUNT(*)` is the number due.",
      "",
      "The no-shows are counted with **conditional aggregation**: `SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END)` adds one for every no-show in the group. The percentage is that sum times 100 divided by the count, rounded to 2 decimals — MySQL keeps four decimal places in a division, so the rounding makes the value well defined. Multiplying by 100 before dividing keeps the arithmetic exact.",
      "",
      "Doctors with fewer than three due appointments would produce noisy 0 % or 100 % rates, so `HAVING COUNT(*) >= 3` drops them after grouping. Ties in the rate are broken by `doctor_id`. A CTE that aggregates `Appointment` alone and joins the doctors afterwards is the same plan with the join done on fewer rows.",
    ].join("\n"),
  },

  {
    slug: "patients-readmitted-within-30-days",
    title: "Patients Readmitted Within 30 Days of Discharge",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates", "Subqueries"],
    description: [
      "A 30-day readmission is a quality indicator insurers and accreditation bodies watch. An admission is a **readmission** when the same patient's **previous admission** was discharged **0 to 30 days** before this admission's `admit_date` (a same-day return is 0 days). A patient's stays never overlap (no two start on the same day), and only the latest stay can still be open (`discharge_date` NULL).",
      "",
      "Return `admission_id`, `patient_id` and `days_since_discharge` for every readmission, in any order. A patient's first admission is never a readmission.",
    ].join("\n"),
    tables: [
      {
        name: "Admission",
        columns: [
          { name: "admission_id", type: "int" },
          { name: "patient_id", type: "int" },
          { name: "admit_date", type: "date" },
          { name: "discharge_date", type: "date" },
        ],
        primaryKey: ["admission_id"],
        note: "One row per inpatient stay. `discharge_date` is NULL while the patient is still admitted.",
      },
    ],
    examples: [
      {
        Admission: [
          [1, 201, "2025-01-03", "2025-01-08"],
          [2, 201, "2025-01-20", "2025-01-25"],
          [3, 201, "2025-03-10", "2025-03-12"],
          [4, 202, "2025-02-01", "2025-02-05"],
          [5, 202, "2025-03-07", "2025-03-09"],
          [6, 203, "2025-02-11", "2025-02-14"],
          [7, 203, "2025-02-14", null],
          [8, 204, "2025-01-15", "2025-01-15"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      const patients = sample(rng, seq(201, 30), ri(rng, 1, 6));
      for (const p of patients) {
        let day = dateBetween(rng, "2024-01-01", "2025-06-30");
        const stays = ri(rng, 1, 4);
        for (let s = 0; s < stays; s++) {
          const los = ri(rng, 0, 9);
          const open = s === stays - 1 && chance(rng, 0.15);
          rows.push([id++, p, day, open ? null : addDays(day, los)]);
          const gap = chance(rng, 0.3) ? pick(rng, [los === 0 ? 1 : 0, 30, 31]) : ri(rng, 1, 60);
          day = addDays(day, los + gap);
        }
      }
      return { Admission: shuffle(rng, rows) };
    },
    solution: [
      "SELECT admission_id, patient_id, days_since_discharge",
      "FROM (",
      "  SELECT admission_id, patient_id,",
      "         DATEDIFF(admit_date, LAG(discharge_date) OVER (PARTITION BY patient_id ORDER BY admit_date)) AS days_since_discharge",
      "  FROM Admission",
      ") t",
      "WHERE days_since_discharge BETWEEN 0 AND 30",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.admission_id, a.patient_id, DATEDIFF(a.admit_date, p.discharge_date) AS days_since_discharge",
        "FROM Admission a",
        "JOIN Admission p ON p.patient_id = a.patient_id AND p.admit_date < a.admit_date",
        "WHERE NOT EXISTS (SELECT 1 FROM Admission q WHERE q.patient_id = a.patient_id AND q.admit_date < a.admit_date AND q.admit_date > p.admit_date)",
        "  AND DATEDIFF(a.admit_date, p.discharge_date) <= 30",
      ].join("\n"),
      [
        "SELECT admission_id, patient_id, gap AS days_since_discharge FROM (",
        "  SELECT a.admission_id, a.patient_id,",
        "         DATEDIFF(a.admit_date, (SELECT MAX(p.discharge_date) FROM Admission p WHERE p.patient_id = a.patient_id AND p.admit_date < a.admit_date)) AS gap",
        "  FROM Admission a",
        ") t WHERE gap <= 30",
      ].join("\n"),
    ],
    hints: [
      "For each admission you need one value from the patient's previous admission — its discharge date.",
      "`LAG(discharge_date) OVER (PARTITION BY patient_id ORDER BY admit_date)` fetches it in one pass.",
      "The first admission has no previous row, so the gap is NULL and fails any comparison — exactly right.",
    ],
    editorial: [
      "The question compares each admission with the one before it for the same patient, which is what `LAG` is for. Partition the rows by `patient_id`, order each partition by `admit_date`, and `LAG(discharge_date)` hands every admission the discharge date of the stay just before it. `DATEDIFF(admit_date, that date)` is the gap in days; keep the rows where it is between 0 and 30.",
      "",
      "Edge cases fall out naturally. A patient's first admission has no previous row, LAG returns NULL, the difference is NULL and the filter drops it. A same-day return gives 0 and counts; day 31 does not. The current open stay is only ever the *latest*, so its NULL discharge is never somebody's previous discharge.",
      "",
      "Without window functions, find the previous admission with a self join plus `NOT EXISTS` (no admission between the two), or with a correlated `MAX(discharge_date)` over the earlier stays — valid here because stays never overlap, so the latest discharge belongs to the previous stay. The window version sorts each patient's rows once; the correlated forms probe the table per admission.",
    ].join("\n"),
  },

  {
    slug: "most-prescribed-drug-in-each-department",
    title: "Most Prescribed Drug in Each Department",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Joins", "Aggregation"],
    description: [
      "The pharmacy committee reviews each department's prescribing habits. A prescription belongs to the department of the doctor who wrote it.",
      "",
      "For every department, return the drug (or drugs) prescribed **most often**, with columns `department`, `drug_name` and `prescriptions`. **If several drugs tie for the top count, return all of them.** Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Doctor",
        columns: [
          { name: "doctor_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "department", type: "varchar" },
        ],
        primaryKey: ["doctor_id"],
      },
      {
        name: "Prescription",
        columns: [
          { name: "rx_id", type: "int" },
          { name: "doctor_id", type: "int" },
          { name: "drug_name", type: "varchar" },
          { name: "rx_date", type: "date" },
        ],
        primaryKey: ["rx_id"],
        note: "One row per drug prescribed; `doctor_id` always exists in `Doctor`.",
      },
    ],
    examples: [
      {
        Doctor: [
          [1, "Kavya Menon", "Cardiology"],
          [2, "Rohan Gupta", "Cardiology"],
          [3, "Aisha Khan", "General Medicine"],
          [4, "Ira Bose", "Paediatrics"],
        ],
        Prescription: [
          [1, 1, "Atorvastatin 10mg", "2025-02-01"],
          [2, 2, "Atorvastatin 10mg", "2025-02-02"],
          [3, 1, "Metformin 500mg", "2025-02-03"],
          [4, 3, "Paracetamol 500mg", "2025-02-03"],
          [5, 3, "Pantoprazole 40mg", "2025-02-04"],
          [6, 3, "Paracetamol 500mg", "2025-02-05"],
          [7, 3, "Pantoprazole 40mg", "2025-02-06"],
          [8, 4, "ORS Sachet", "2025-02-06"],
          [9, 2, "Atorvastatin 10mg", "2025-02-07"],
        ],
      },
    ],
    gen: (rng) => {
      const depts = sample(rng, SPECIALTIES, ri(rng, 1, 3));
      const docs = names(rng, ri(rng, 1, 5)).map((f, i) => [i + 1, fullName(f, rng), pick(rng, depts)]);
      const drugs = sample(rng, MEDICINES, ri(rng, 2, 5));
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      const rx = seq(1, m).map((id) => [id, pick(rng, docs)[0]!, pick(rng, drugs), dateBetween(rng, "2025-01-01", "2025-03-31")]);
      return { Doctor: docs, Prescription: rx };
    },
    solution: [
      "SELECT department, drug_name, prescriptions",
      "FROM (",
      "  SELECT d.department, p.drug_name, COUNT(*) AS prescriptions,",
      "         RANK() OVER (PARTITION BY d.department ORDER BY COUNT(*) DESC) AS rnk",
      "  FROM Prescription p",
      "  JOIN Doctor d ON d.doctor_id = p.doctor_id",
      "  GROUP BY d.department, p.drug_name",
      ") ranked",
      "WHERE rnk = 1",
    ].join("\n"),
    alternatives: [
      [
        "WITH counts AS (",
        "  SELECT d.department, p.drug_name, COUNT(*) AS prescriptions",
        "  FROM Prescription p JOIN Doctor d ON d.doctor_id = p.doctor_id",
        "  GROUP BY d.department, p.drug_name",
        ")",
        "SELECT department, drug_name, prescriptions FROM counts c",
        "WHERE prescriptions = (SELECT MAX(prescriptions) FROM counts x WHERE x.department = c.department)",
      ].join("\n"),
      [
        "WITH counts AS (",
        "  SELECT d.department, p.drug_name, COUNT(*) AS prescriptions",
        "  FROM Prescription p JOIN Doctor d ON d.doctor_id = p.doctor_id",
        "  GROUP BY d.department, p.drug_name",
        ")",
        "SELECT c.department, c.drug_name, c.prescriptions FROM counts c",
        "JOIN (SELECT department, MAX(prescriptions) AS top FROM counts GROUP BY department) m",
        "  ON m.department = c.department AND m.top = c.prescriptions",
      ].join("\n"),
    ],
    hints: [
      "First count prescriptions per (department, drug) — that needs the doctor's department.",
      "Then, within each department, find the top count. RANK keeps ties at the same rank; ROW_NUMBER would not.",
      "Without windows: compare each count with the department's MAX count.",
    ],
    editorial: [
      "There are two levels of aggregation. The first is a plain count: join each prescription to its doctor to learn the department, then `GROUP BY department, drug_name` and `COUNT(*)`. The second asks, inside each department, which counts are the largest.",
      "",
      "A window function can work directly on the grouped rows: `RANK() OVER (PARTITION BY department ORDER BY COUNT(*) DESC)` numbers each department's drugs by count, and drugs with equal counts receive the **same** rank. Keeping `rnk = 1` therefore returns every tied top drug, which is what the statement demands. `ROW_NUMBER` would pick one of the tied drugs arbitrarily, and `DENSE_RANK` = 1 would give the same answer as RANK here.",
      "",
      "Without windows, put the counts in a CTE and keep the rows whose count equals the department's maximum — either with a correlated `MAX` subquery or by joining to a grouped table of maxima. Both read the counts twice; the window version sorts them once per department.",
    ].join("\n"),
  },

  {
    slug: "cashless-claims-settled-per-insurer-per-month",
    title: "Cashless Claims Settled per Insurer per Month",
    difficulty: "MEDIUM",
    topics: ["Dates", "Aggregation", "Conditional Logic"],
    description: [
      "The TPA desk tracks cashless claims by the month they were **submitted**. A claim is settled once the insurer has paid it (status `settled`); only then is `settled_amount` filled in.",
      "",
      "For every insurer and submission month that has at least one claim, return `insurer`, `claim_month` (as `'YYYY-MM'`), `claims` (all claims submitted that month), `settled_claims` and `settled_amount` (the total paid on settled claims, **0 when none settled**). Order by **`insurer`, then `claim_month`**.",
    ].join("\n"),
    tables: [
      {
        name: "Claim",
        columns: [
          { name: "claim_id", type: "int" },
          { name: "insurer", type: "varchar" },
          { name: "submitted_on", type: "date" },
          { name: "status", type: "enum", values: ["submitted", "approved", "rejected", "settled"] },
          { name: "settled_amount", type: "int" },
        ],
        primaryKey: ["claim_id"],
        note: "Amounts in rupees. `settled_amount` is NULL unless `status` is `settled`.",
      },
    ],
    examples: [
      {
        Claim: [
          [1, "Star Health", "2025-01-04", "settled", 64000],
          [2, "Star Health", "2025-01-19", "rejected", null],
          [3, "Star Health", "2025-01-31", "settled", 22500],
          [4, "Star Health", "2025-02-01", "approved", null],
          [5, "HDFC Ergo", "2025-01-12", "settled", 118000],
          [6, "HDFC Ergo", "2025-03-03", "submitted", null],
          [7, "Niva Bupa", "2025-02-14", "settled", 41000],
          [8, "Niva Bupa", "2025-02-27", "settled", 9500],
        ],
      },
    ],
    gen: (rng) => {
      const insurers = sample(rng, INSURERS, ri(rng, 1, 3));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 22);
      const statuses = ["submitted", "approved", "rejected", "settled", "settled", "settled"] as const;
      const rows = seq(1, n).map((id) => {
        const st = pick(rng, statuses);
        const day = chance(rng, 0.2) ? pick(rng, ["2024-12-31", "2025-01-01", "2025-01-31", "2025-02-01", "2025-02-28", "2025-03-01"]) : dateBetween(rng, "2024-12-01", "2025-03-31");
        return [id, pick(rng, insurers), day, st, st === "settled" ? roundTo(rng, 5000, 250000, 500) : null];
      });
      return { Claim: rows };
    },
    solution: [
      "SELECT insurer,",
      "       DATE_FORMAT(submitted_on, '%Y-%m') AS claim_month,",
      "       COUNT(*) AS claims,",
      "       SUM(CASE WHEN status = 'settled' THEN 1 ELSE 0 END) AS settled_claims,",
      "       COALESCE(SUM(CASE WHEN status = 'settled' THEN settled_amount END), 0) AS settled_amount",
      "FROM Claim",
      "GROUP BY insurer, DATE_FORMAT(submitted_on, '%Y-%m')",
      "ORDER BY insurer, claim_month",
    ].join("\n"),
    alternatives: [
      "SELECT insurer, LEFT(submitted_on, 7) AS claim_month, COUNT(claim_id) AS claims, COUNT(settled_amount) AS settled_claims, IFNULL(SUM(settled_amount), 0) AS settled_amount FROM Claim GROUP BY insurer, LEFT(submitted_on, 7) ORDER BY 1, 2",
      "SELECT insurer, CONCAT(YEAR(submitted_on), '-', LPAD(MONTH(submitted_on), 2, '0')) AS claim_month, COUNT(*) AS claims, SUM(IF(status = 'settled', 1, 0)) AS settled_claims, SUM(IF(status = 'settled', settled_amount, 0)) AS settled_amount FROM Claim GROUP BY 1, 2 ORDER BY insurer, claim_month",
    ],
    ordered: true,
    hints: [
      "`DATE_FORMAT(d, '%Y-%m')` turns a date into its month bucket; group by that and the insurer.",
      "Count settled claims with a CASE inside SUM, so the other claims still count in `claims`.",
      "SUM over only NULLs is NULL — turn it into 0.",
    ],
    editorial: [
      "The grouping key is two parts: the insurer and the submission month. `DATE_FORMAT(submitted_on, '%Y-%m')` maps every date to its month label (the first seven characters of the date say the same thing), and grouping by both gives one row per insurer per month that had claims.",
      "",
      "All three numbers come from the same group with **conditional aggregation**. `COUNT(*)` counts every claim. `SUM(CASE WHEN status = 'settled' THEN 1 ELSE 0 END)` counts only the settled ones. The paid total is `SUM` of the amount restricted to settled claims; because a month with no settled claim sums nothing but NULLs, the result is NULL, and `COALESCE(…, 0)` turns it into the 0 the statement asks for.",
      "",
      "Since `settled_amount` is filled only for settled claims, `COUNT(settled_amount)` and `SUM(settled_amount)` are shortcuts that rely on that rule; the CASE form states the rule explicitly and survives data where it does not hold. One pass and one group per insurer-month.",
    ].join("\n"),
  },

  {
    slug: "patients-seen-across-several-specialties",
    title: "Patients Seen Across Several Specialties",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Strings"],
    description: [
      "Care coordinators want to know which patients are being seen by **two or more different specialties**, since those patients need a combined care plan.",
      "",
      "Return `patient_id`, `name` and `specialties` — the distinct specialties the patient has visited, **sorted alphabetically and joined with `', '`** (comma and space). Only patients with at least two distinct specialties appear. Order by `patient_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Patient",
        columns: [
          { name: "patient_id", type: "int" },
          { name: "name", type: "varchar" },
        ],
        primaryKey: ["patient_id"],
      },
      {
        name: "Doctor",
        columns: [
          { name: "doctor_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "specialty", type: "varchar" },
        ],
        primaryKey: ["doctor_id"],
      },
      {
        name: "Visit",
        columns: [
          { name: "visit_id", type: "int" },
          { name: "patient_id", type: "int" },
          { name: "doctor_id", type: "int" },
          { name: "visit_date", type: "date" },
        ],
        primaryKey: ["visit_id"],
        note: "One row per consultation. Both ids always exist in their tables.",
      },
    ],
    examples: [
      {
        Patient: [
          [1, "Aarav Sharma"],
          [2, "Diya Reddy"],
          [3, "Kabir Singh"],
          [4, "Meera Das"],
        ],
        Doctor: [
          [11, "Kavya Menon", "Cardiology"],
          [12, "Rohan Gupta", "Cardiology"],
          [13, "Aisha Khan", "Neurology"],
          [14, "Ira Bose", "ENT"],
        ],
        Visit: [
          [1, 1, 11, "2025-01-10"],
          [2, 1, 13, "2025-01-24"],
          [3, 1, 14, "2025-02-02"],
          [4, 2, 11, "2025-01-11"],
          [5, 2, 12, "2025-02-11"],
          [6, 3, 14, "2025-01-15"],
          [7, 3, 12, "2025-01-30"],
          [8, 3, 14, "2025-03-01"],
        ],
      },
    ],
    gen: (rng) => {
      const pts = names(rng, ri(rng, 1, 5)).map((f, i) => [i + 1, fullName(f, rng)]);
      const specs = sample(rng, SPECIALTIES, ri(rng, 2, 4));
      const docs = names(rng, ri(rng, 1, 6)).map((f, i) => [11 + i, fullName(f, rng), pick(rng, specs)]);
      const m = chance(rng, 0.05) ? 0 : ri(rng, 3, 22);
      const visits = seq(1, m).map((id) => [id, pick(rng, pts)[0]!, pick(rng, docs)[0]!, dateBetween(rng, "2024-06-01", "2025-06-30")]);
      return { Patient: pts, Doctor: docs, Visit: visits };
    },
    solution: [
      "SELECT p.patient_id, p.name,",
      "       GROUP_CONCAT(s.specialty ORDER BY s.specialty SEPARATOR ', ') AS specialties",
      "FROM Patient p",
      "JOIN (",
      "  SELECT DISTINCT v.patient_id, d.specialty",
      "  FROM Visit v JOIN Doctor d ON d.doctor_id = v.doctor_id",
      ") s ON s.patient_id = p.patient_id",
      "GROUP BY p.patient_id, p.name",
      "HAVING COUNT(*) >= 2",
      "ORDER BY p.patient_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT p.patient_id, p.name, GROUP_CONCAT(s.specialty ORDER BY s.specialty SEPARATOR ', ') AS specialties",
        "FROM Patient p JOIN (SELECT v.patient_id, d.specialty FROM Visit v JOIN Doctor d ON d.doctor_id = v.doctor_id GROUP BY v.patient_id, d.specialty) s ON s.patient_id = p.patient_id",
        "WHERE (SELECT COUNT(DISTINCT d2.specialty) FROM Visit v2 JOIN Doctor d2 ON d2.doctor_id = v2.doctor_id WHERE v2.patient_id = p.patient_id) >= 2",
        "GROUP BY p.patient_id, p.name",
        "ORDER BY p.patient_id",
      ].join("\n"),
      [
        "WITH seen AS (",
        "  SELECT DISTINCT v.patient_id, d.specialty",
        "  FROM Visit v JOIN Doctor d ON d.doctor_id = v.doctor_id",
        ")",
        "SELECT p.patient_id, p.name, GROUP_CONCAT(s.specialty ORDER BY s.specialty SEPARATOR ', ') AS specialties",
        "FROM seen s JOIN Patient p ON p.patient_id = s.patient_id",
        "GROUP BY p.patient_id, p.name",
        "HAVING COUNT(*) > 1",
        "ORDER BY p.patient_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The specialty lives on the doctor, so go patient → visit → doctor.",
      "Two visits to the same specialty are still one specialty — count DISTINCT.",
      "Reduce the visits to distinct (patient, specialty) pairs first; then `GROUP_CONCAT(x ORDER BY x SEPARATOR ', ')` builds the sorted list.",
    ],
    editorial: [
      "Join visits to doctors so each visit carries the doctor's specialty, then reduce those rows to **distinct (patient, specialty) pairs** and group them by patient. The filter is on the group: `HAVING COUNT(*) >= 2` over the distinct pairs. The de-duplication is essential — a patient who saw two cardiologists, or the same ENT twice, has several visits but only one specialty and must not appear.",
      "",
      "The list itself is `GROUP_CONCAT` over those distinct pairs, so each specialty is named once, with `ORDER BY specialty` so the list is alphabetical (without it the order would depend on how rows were read, and the answer would not be deterministic), and `SEPARATOR ', '` for the comma-and-space format. MySQL's default separator is a bare comma.",
      "",
      "In MySQL you can also write `GROUP_CONCAT(DISTINCT specialty ORDER BY specialty SEPARATOR ', ')` with `COUNT(DISTINCT specialty)` straight over the joined visits; the pair table makes the de-duplication explicit. The filter can equally be a correlated `COUNT(DISTINCT …)` subquery per patient, or the pairs can live in a CTE. Either way it is one join pass and one group per patient.",
    ].join("\n"),
  },

  {
    slug: "lab-tests-slower-than-their-usual-turnaround",
    title: "Lab Tests Slower Than Their Usual Turnaround",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Dates"],
    description: [
      "Different tests take different times — a CBC is quick, a blood culture is not — so the lab compares each report with **the average turnaround of the same test**. Turnaround is the whole minutes from `collected_at` to `reported_at`; reports still pending (`reported_at` NULL) are ignored everywhere, including in the averages.",
      "",
      "Return `result_id`, `test_name` and `turnaround_minutes` of every report whose turnaround is **strictly greater** than its test's average turnaround. Order by **`test_name`, then `result_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "LabResult",
        columns: [
          { name: "result_id", type: "int" },
          { name: "patient_id", type: "int" },
          { name: "test_name", type: "varchar" },
          { name: "collected_at", type: "datetime" },
          { name: "reported_at", type: "datetime" },
        ],
        primaryKey: ["result_id"],
        note: "One row per test run. Times are recorded to the minute; `reported_at` is NULL while the report is pending.",
      },
    ],
    examples: [
      {
        LabResult: [
          [1, 301, "CBC", "2025-04-01 08:00:00", "2025-04-01 09:00:00"],
          [2, 302, "CBC", "2025-04-01 08:30:00", "2025-04-01 10:30:00"],
          [3, 303, "CBC", "2025-04-01 09:00:00", "2025-04-01 10:30:00"],
          [4, 304, "Blood Culture", "2025-04-01 07:00:00", "2025-04-03 07:00:00"],
          [5, 305, "Blood Culture", "2025-04-01 11:00:00", "2025-04-04 11:00:00"],
          [6, 306, "Blood Culture", "2025-04-02 06:00:00", null],
          [7, 307, "HbA1c", "2025-04-02 10:00:00", "2025-04-02 16:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 18);
      const tests = sample(rng, LAB_TESTS, ri(rng, 1, 4));
      const rows = seq(1, n).map((id) => {
        const start = ri(rng, 6 * 60, 20 * 60) * 60;
        const day = dateBetween(rng, "2025-01-01", "2025-06-30");
        // Few distinct durations, so reports equal to their test's average happen.
        const mins = chance(rng, 0.5) ? pick(rng, [60, 120, 180]) : ri(rng, 30, 2000);
        return [id, ri(rng, 301, 360), pick(rng, tests), stamp(day, start), chance(rng, 0.12) ? null : stamp(day, start + mins * 60)];
      });
      return { LabResult: shuffle(rng, rows) };
    },
    solution: [
      "SELECT r.result_id, r.test_name,",
      "       TIMESTAMPDIFF(MINUTE, r.collected_at, r.reported_at) AS turnaround_minutes",
      "FROM LabResult r",
      "WHERE r.reported_at IS NOT NULL",
      "  AND TIMESTAMPDIFF(MINUTE, r.collected_at, r.reported_at) > (",
      "        SELECT AVG(TIMESTAMPDIFF(MINUTE, x.collected_at, x.reported_at))",
      "        FROM LabResult x",
      "        WHERE x.test_name = r.test_name AND x.reported_at IS NOT NULL",
      "      )",
      "ORDER BY r.test_name, r.result_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT result_id, test_name, tat AS turnaround_minutes FROM (",
        "  SELECT result_id, test_name, TIMESTAMPDIFF(MINUTE, collected_at, reported_at) AS tat,",
        "         AVG(TIMESTAMPDIFF(MINUTE, collected_at, reported_at)) OVER (PARTITION BY test_name) AS avg_tat",
        "  FROM LabResult WHERE reported_at IS NOT NULL",
        ") t WHERE tat > avg_tat ORDER BY test_name, result_id",
      ].join("\n"),
      [
        "SELECT r.result_id, r.test_name, TIMESTAMPDIFF(MINUTE, r.collected_at, r.reported_at) AS turnaround_minutes",
        "FROM LabResult r",
        "JOIN (SELECT test_name, SUM(TIMESTAMPDIFF(MINUTE, collected_at, reported_at)) AS total, COUNT(*) AS n FROM LabResult WHERE reported_at IS NOT NULL GROUP BY test_name) a",
        "  ON a.test_name = r.test_name",
        "WHERE r.reported_at IS NOT NULL AND TIMESTAMPDIFF(MINUTE, r.collected_at, r.reported_at) * a.n > a.total",
        "ORDER BY r.test_name, r.result_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`TIMESTAMPDIFF(MINUTE, start, end)` gives the turnaround in whole minutes.",
      "Each row is compared with a value computed over *other rows of the same test* — a correlated subquery or a window average.",
      "AVG ignores NULLs, but the pending rows should also stay out of the answer itself.",
    ],
    editorial: [
      "The comparison value differs per test, so it cannot be one constant. A **correlated subquery** computes it for each row: the average of `TIMESTAMPDIFF(MINUTE, collected_at, reported_at)` over the rows with the same `test_name`. The outer query keeps a report when its own turnaround is strictly above that average.",
      "",
      "Pending reports have a NULL turnaround. AVG skips NULLs automatically, so they never distort the average, and a NULL turnaround in the outer comparison is unknown, so they never appear — the explicit `reported_at IS NOT NULL` simply documents the rule. A report exactly equal to the average is not slower.",
      "",
      "The window version computes `AVG(...) OVER (PARTITION BY test_name)` once per partition instead of once per row, which is cheaper on a large table. A third approach joins to a grouped table of totals and counts and compares `minutes × count > total`, which avoids fractions altogether.",
    ].join("\n"),
  },

  {
    slug: "ward-bed-occupancy-on-census-date",
    title: "Ward Bed Occupancy on the Census Date",
    difficulty: "MEDIUM",
    topics: ["Joins", "Dates", "Aggregation"],
    description: [
      "The midnight census for **2025-02-15** counts a bed as occupied by every admission with `admit_date` **on or before** 2025-02-15 and **not discharged yet** on that date — `discharge_date` NULL or **after** 2025-02-15 (a patient discharged on the 15th has left).",
      "",
      "Return every ward — **including wards with no patient** — with `ward_name`, `beds`, `occupied` and `occupancy_pct` = 100 × occupied ÷ beds, **rounded to 2 decimals**. Order by **`occupancy_pct` descending, then `ward_name`**.",
    ].join("\n"),
    tables: [
      {
        name: "Ward",
        columns: [
          { name: "ward_id", type: "int" },
          { name: "ward_name", type: "varchar" },
          { name: "beds", type: "int" },
        ],
        primaryKey: ["ward_id"],
        note: "`beds` is the ward's sanctioned bed count, always at least 1.",
      },
      {
        name: "Admission",
        columns: [
          { name: "admission_id", type: "int" },
          { name: "patient_id", type: "int" },
          { name: "ward_id", type: "int" },
          { name: "admit_date", type: "date" },
          { name: "discharge_date", type: "date" },
        ],
        primaryKey: ["admission_id"],
        note: "`discharge_date` is NULL for patients still admitted.",
      },
    ],
    examples: [
      {
        Ward: [
          [1, "General", 10],
          [2, "ICU", 4],
          [3, "Maternity", 6],
          [4, "Paediatric", 5],
        ],
        Admission: [
          [1, 101, 1, "2025-02-10", "2025-02-16"],
          [2, 102, 1, "2025-02-15", null],
          [3, 103, 1, "2025-02-12", "2025-02-15"],
          [4, 104, 2, "2025-02-01", null],
          [5, 105, 2, "2025-02-14", "2025-02-20"],
          [6, 106, 2, "2025-02-16", null],
          [7, 107, 3, "2025-02-05", "2025-02-08"],
          [8, 108, 1, "2025-01-30", null],
        ],
      },
    ],
    gen: (rng) => {
      const wardNames = sample(rng, ["General", "ICU", "Maternity", "Paediatric", "Orthopaedic", "Surgical", "Cardiac Care"], ri(rng, 1, 5));
      const wards = wardNames.map((w, i) => [i + 1, w, pick(rng, [2, 4, 5, 6, 8, 10, 12, 20, 25])]);
      const m = ri(rng, 0, 26);
      const rows = seq(1, m).map((id) => {
        const admit = chance(rng, 0.2) ? pick(rng, ["2025-02-15", "2025-02-16", "2025-02-14"]) : dateBetween(rng, "2025-01-25", "2025-02-20");
        const r = rng();
        const discharge = r < 0.3 ? null : r < 0.45 ? "2025-02-15" : addDays(admit, ri(rng, 0, 12));
        return [id, ri(rng, 101, 170), pick(rng, wards)[0]!, admit, discharge !== null && discharge < admit ? admit : discharge];
      });
      return { Ward: wards, Admission: rows };
    },
    solution: [
      "SELECT w.ward_name, w.beds, COUNT(a.admission_id) AS occupied,",
      "       ROUND(100 * COUNT(a.admission_id) / w.beds, 2) AS occupancy_pct",
      "FROM Ward w",
      "LEFT JOIN Admission a",
      "  ON a.ward_id = w.ward_id",
      " AND a.admit_date <= '2025-02-15'",
      " AND (a.discharge_date IS NULL OR a.discharge_date > '2025-02-15')",
      "GROUP BY w.ward_id, w.ward_name, w.beds",
      "ORDER BY occupancy_pct DESC, w.ward_name",
    ].join("\n"),
    alternatives: [
      [
        "SELECT ward_name, beds, occupied, ROUND(occupied * 100 / beds, 2) AS occupancy_pct FROM (",
        "  SELECT w.ward_name, w.beds,",
        "         (SELECT COUNT(*) FROM Admission a WHERE a.ward_id = w.ward_id AND a.admit_date <= '2025-02-15' AND COALESCE(a.discharge_date, '9999-12-31') > '2025-02-15') AS occupied",
        "  FROM Ward w",
        ") t ORDER BY occupancy_pct DESC, ward_name",
      ].join("\n"),
      [
        "SELECT w.ward_name, w.beds, SUM(CASE WHEN a.admit_date <= '2025-02-15' AND (a.discharge_date IS NULL OR a.discharge_date > '2025-02-15') THEN 1 ELSE 0 END) AS occupied,",
        "       ROUND(100 * SUM(CASE WHEN a.admit_date <= '2025-02-15' AND (a.discharge_date IS NULL OR a.discharge_date > '2025-02-15') THEN 1 ELSE 0 END) / w.beds, 2) AS occupancy_pct",
        "FROM Ward w LEFT JOIN Admission a ON a.ward_id = w.ward_id",
        "GROUP BY w.ward_id, w.ward_name, w.beds",
        "ORDER BY occupancy_pct DESC, w.ward_name",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Every ward must appear, so start from `Ward` and LEFT JOIN the admissions.",
      "Put the census-date conditions in the ON clause; in WHERE they would remove the empty wards again.",
      "COUNT a column of the admission, not `*`, so a ward with no match counts 0.",
    ],
    editorial: [
      "An admission occupies a bed on the census date when it started on or before that date and had not ended by it: `admit_date <= '2025-02-15'` and `discharge_date` either NULL or later than the 15th. That is the classic **interval contains a point** test, with the discharge day itself counted as free.",
      "",
      "The wards with nobody in them are the trap. A LEFT JOIN from `Ward` keeps every ward, but only if the census conditions sit in the **ON** clause: written in WHERE they would be tested against the NULL columns of an unmatched ward and remove it. With the conditions in ON, an empty ward survives with one row of NULLs, and `COUNT(a.admission_id)` — which skips NULLs — counts 0 for it, while `COUNT(*)` would wrongly say 1.",
      "",
      "The percentage is 100 × occupied ÷ beds, rounded to 2 decimals. Alternatives: a correlated `COUNT(*)` subquery per ward, or a plain LEFT JOIN on the ward with the census test moved into a conditional SUM. All read the admissions once per ward or once overall.",
    ].join("\n"),
  },

  {
    slug: "diabetic-patients-whose-hba1c-improved",
    title: "Diabetic Patients Whose Latest HbA1c Improved",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Subqueries"],
    description: [
      "The diabetes clinic tracks each patient's HbA1c (%) over time; lower is better. A patient has **improved** when their **latest** reading is **strictly lower** than the reading just before it.",
      "",
      "Return `patient_id`, `previous_hba1c` and `latest_hba1c` for every improved patient, ordered by `patient_id`. Patients with a single reading cannot be judged and are left out; an unchanged reading is not an improvement.",
    ].join("\n"),
    tables: [
      {
        name: "HbA1cReading",
        columns: [
          { name: "patient_id", type: "int" },
          { name: "test_date", type: "date" },
          { name: "hba1c", type: "decimal" },
        ],
        primaryKey: ["patient_id", "test_date"],
        note: "One row per patient per test day; `hba1c` is a percentage with one decimal.",
      },
    ],
    examples: [
      {
        HbA1cReading: [
          [1, "2024-09-10", 8.4],
          [1, "2024-12-12", 7.9],
          [1, "2025-03-15", 7.1],
          [2, "2024-10-01", 7.0],
          [2, "2025-01-05", 7.6],
          [3, "2025-02-20", 6.8],
          [4, "2024-11-11", 9.2],
          [4, "2025-02-14", 9.2],
          [5, "2024-08-08", 6.4],
          [5, "2025-01-09", 8.1],
          [5, "2025-04-02", 7.5],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      for (const p of sample(rng, seq(1, 20), ri(rng, 1, 7))) {
        const k = ri(rng, 1, 4);
        let d = dateBetween(rng, "2023-06-01", "2024-06-01");
        let v = ri(rng, 55, 110);
        for (let i = 0; i < k; i++) {
          rows.push([p, d, v / 10]);
          d = addDays(d, ri(rng, 60, 120));
          v = Math.max(50, Math.min(130, v + (chance(rng, 0.2) ? 0 : ri(rng, -12, 10))));
        }
      }
      return { HbA1cReading: shuffle(rng, rows) };
    },
    solution: [
      "SELECT patient_id, previous_hba1c, latest_hba1c",
      "FROM (",
      "  SELECT patient_id, hba1c AS latest_hba1c,",
      "         LAG(hba1c) OVER (PARTITION BY patient_id ORDER BY test_date) AS previous_hba1c,",
      "         ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY test_date DESC) AS rn",
      "  FROM HbA1cReading",
      ") t",
      "WHERE rn = 1 AND latest_hba1c < previous_hba1c",
      "ORDER BY patient_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT l.patient_id, p.hba1c AS previous_hba1c, l.hba1c AS latest_hba1c",
        "FROM HbA1cReading l",
        "JOIN HbA1cReading p ON p.patient_id = l.patient_id",
        " AND p.test_date = (SELECT MAX(test_date) FROM HbA1cReading x WHERE x.patient_id = l.patient_id AND x.test_date < l.test_date)",
        "WHERE l.test_date = (SELECT MAX(test_date) FROM HbA1cReading y WHERE y.patient_id = l.patient_id)",
        "  AND l.hba1c < p.hba1c",
        "ORDER BY l.patient_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "For every reading, `LAG` can bring along the reading before it for the same patient.",
      "Then keep only each patient's latest row — ROW_NUMBER over the dates descending marks it.",
      "A patient with one reading gets NULL from LAG, and a comparison with NULL is never true.",
    ],
    editorial: [
      "Two facts are needed per patient: the latest reading and the one before it. Window functions give both in one pass. `LAG(hba1c) OVER (PARTITION BY patient_id ORDER BY test_date)` puts the previous reading beside every reading, and `ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY test_date DESC)` gives the latest reading the number 1. Filtering on `rn = 1` leaves one row per patient carrying exactly the pair we want, and the comparison `latest < previous` keeps the improvers.",
      "",
      "A patient with a single reading has `previous_hba1c` NULL; the comparison is unknown and the patient drops out, as the statement requires. An equal value fails `<`, so an unchanged result is not counted. Note the filter must be applied **outside** the subquery — window functions are evaluated after WHERE, so `rn` cannot be filtered at the same level.",
      "",
      "Without windows: find each patient's latest date with a correlated `MAX`, the previous date with a `MAX` below it, and join the two readings. That probes the table several times per patient; the window version sorts each patient's readings once.",
    ].join("\n"),
  },

  {
    slug: "medicines-below-reorder-level",
    title: "Medicines Below Their Reorder Level",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "Each medicine has a reorder level; when the **usable stock** falls below it, the store raises a purchase order. Take **2025-06-30** as today. Usable stock is the total `quantity` of the medicine's batches whose `expiry_date` is **after** today — a batch expiring today is already pulled from the shelf. A medicine with no usable batch has a usable stock of 0.",
      "",
      "Return `medicine_id`, `name`, `usable_stock` and `reorder_level` of every medicine whose usable stock is **strictly below** its reorder level, ordered by `medicine_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Medicine",
        columns: [
          { name: "medicine_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "reorder_level", type: "int" },
        ],
        primaryKey: ["medicine_id"],
      },
      {
        name: "StockBatch",
        columns: [
          { name: "batch_id", type: "int" },
          { name: "medicine_id", type: "int" },
          { name: "quantity", type: "int" },
          { name: "expiry_date", type: "date" },
        ],
        primaryKey: ["batch_id"],
        note: "Units on the shelf per batch; `medicine_id` always exists in `Medicine`.",
      },
    ],
    examples: [
      {
        Medicine: [
          [1, "Paracetamol 500mg", 500],
          [2, "Insulin Glargine", 40],
          [3, "Azithromycin 500mg", 100],
          [4, "ORS Sachet", 200],
          [5, "Ceftriaxone 1g", 60],
        ],
        StockBatch: [
          [11, 1, 300, "2026-01-31"],
          [12, 1, 250, "2025-12-31"],
          [13, 2, 25, "2025-08-15"],
          [14, 2, 30, "2025-06-30"],
          [15, 3, 100, "2025-11-30"],
          [16, 4, 500, "2025-05-31"],
          [17, 5, 20, "2025-07-01"],
        ],
      },
    ],
    gen: (rng) => {
      const meds = sample(rng, MEDICINES, ri(rng, 2, 7)).map((name, i) => [i + 1, name, roundTo(rng, 50, 500, 10)]);
      const m = ri(rng, 0, 18);
      const batches = seq(11, m).map((id) => {
        const med = pick(rng, meds);
        const offset = chance(rng, 0.25) ? pick(rng, [-1, 0, 1]) : ri(rng, -90, 400);
        return [id, med[0]!, chance(rng, 0.2) ? Number(med[2]) : roundTo(rng, 0, 250, 5), addDays("2025-06-30", offset)];
      });
      return { Medicine: meds, StockBatch: batches };
    },
    solution: [
      "SELECT m.medicine_id, m.name,",
      "       COALESCE(SUM(b.quantity), 0) AS usable_stock,",
      "       m.reorder_level",
      "FROM Medicine m",
      "LEFT JOIN StockBatch b",
      "  ON b.medicine_id = m.medicine_id AND b.expiry_date > '2025-06-30'",
      "GROUP BY m.medicine_id, m.name, m.reorder_level",
      "HAVING COALESCE(SUM(b.quantity), 0) < m.reorder_level",
      "ORDER BY m.medicine_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT * FROM (",
        "  SELECT m.medicine_id, m.name,",
        "         (SELECT COALESCE(SUM(quantity), 0) FROM StockBatch b WHERE b.medicine_id = m.medicine_id AND b.expiry_date > '2025-06-30') AS usable_stock,",
        "         m.reorder_level",
        "  FROM Medicine m",
        ") t WHERE usable_stock < reorder_level ORDER BY medicine_id",
      ].join("\n"),
      [
        "SELECT m.medicine_id, m.name, SUM(CASE WHEN b.expiry_date > '2025-06-30' THEN b.quantity ELSE 0 END) AS usable_stock, m.reorder_level",
        "FROM Medicine m LEFT JOIN StockBatch b ON b.medicine_id = m.medicine_id",
        "GROUP BY m.medicine_id, m.name, m.reorder_level",
        "HAVING SUM(CASE WHEN b.expiry_date > '2025-06-30' THEN b.quantity ELSE 0 END) < m.reorder_level",
        "ORDER BY m.medicine_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "A medicine with no batches still has to be checked — start from `Medicine` with a LEFT JOIN.",
      "Keep the expiry rule in the join condition (or inside a CASE), not in WHERE.",
      "SUM over no rows is NULL; COALESCE it to 0 before comparing.",
    ],
    editorial: [
      "The answer is per medicine, and the medicines most in need of reordering are the ones with **no** usable batch at all, so the query must start from `Medicine` and LEFT JOIN the batches. The expiry rule (`expiry_date > '2025-06-30'`) goes into the ON clause: batches that fail it simply don't join, while the medicine row stays.",
      "",
      "After grouping, `SUM(b.quantity)` is the usable stock — or NULL when nothing joined, because SUM of no values is NULL. `COALESCE(…, 0)` turns that into 0, and the HAVING clause compares it strictly with the reorder level; without the COALESCE, `NULL < 40` is unknown and the empty medicines would vanish from the list.",
      "",
      "A CASE inside SUM achieves the same by adding 0 for expired batches (a medicine with no batch at all then sums one NULL-ish 0 row from the LEFT JOIN — `ELSE 0` handles it). A correlated subquery per medicine is the third form. All are one pass over the batches.",
    ].join("\n"),
  },

  {
    slug: "emergency-peak-arrival-hour-each-day",
    title: "Peak Arrival Hour in Emergency Each Day",
    difficulty: "MEDIUM",
    topics: ["Dates", "Window Functions"],
    description: [
      "To roster triage nurses, the emergency department wants the busiest hour of each day. An arrival at 14:59:59 belongs to hour 14.",
      "",
      "For every date with at least one arrival, return `visit_date`, `peak_hour` (0–23, the hour with the **most arrivals** that day) and `arrivals` (how many arrived in that hour). **If hours tie, the earliest hour wins.** Order by `visit_date`.",
    ].join("\n"),
    tables: [
      {
        name: "ErVisit",
        columns: [
          { name: "visit_id", type: "int" },
          { name: "patient_id", type: "int" },
          { name: "arrived_at", type: "datetime" },
          { name: "triage", type: "enum", values: ["red", "orange", "yellow", "green"] },
        ],
        primaryKey: ["visit_id"],
        note: "One row per emergency arrival; `triage` is the colour assigned at the door.",
      },
    ],
    examples: [
      {
        ErVisit: [
          [1, 401, "2025-03-08 09:05:00", "yellow"],
          [2, 402, "2025-03-08 09:40:00", "green"],
          [3, 403, "2025-03-08 14:10:00", "red"],
          [4, 404, "2025-03-08 14:59:59", "orange"],
          [5, 405, "2025-03-08 22:30:00", "green"],
          [6, 406, "2025-03-09 01:15:00", "red"],
          [7, 407, "2025-03-09 18:20:00", "yellow"],
          [8, 408, "2025-03-09 18:45:00", "green"],
          [9, 409, "2025-03-09 18:50:00", "orange"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      const base = dateBetween(rng, "2024-01-01", "2025-12-25");
      const hours = sample(rng, seq(0, 24), ri(rng, 2, 5));
      const rows = seq(1, n).map((id) => [id, ri(rng, 401, 480), stamp(addDays(base, ri(rng, 0, 2)), pick(rng, hours) * 3600 + ri(rng, 0, 3599)), pick(rng, ["red", "orange", "yellow", "green"])]);
      return { ErVisit: rows };
    },
    solution: [
      "WITH hourly AS (",
      "  SELECT DATE(arrived_at) AS visit_date, HOUR(arrived_at) AS hr, COUNT(*) AS arrivals",
      "  FROM ErVisit",
      "  GROUP BY DATE(arrived_at), HOUR(arrived_at)",
      ")",
      "SELECT visit_date, hr AS peak_hour, arrivals",
      "FROM (",
      "  SELECT visit_date, hr, arrivals,",
      "         ROW_NUMBER() OVER (PARTITION BY visit_date ORDER BY arrivals DESC, hr) AS rn",
      "  FROM hourly",
      ") ranked",
      "WHERE rn = 1",
      "ORDER BY visit_date",
    ].join("\n"),
    alternatives: [
      [
        "WITH hourly AS (",
        "  SELECT LEFT(arrived_at, 10) AS visit_date, HOUR(arrived_at) AS hr, COUNT(*) AS arrivals",
        "  FROM ErVisit GROUP BY LEFT(arrived_at, 10), HOUR(arrived_at)",
        ")",
        "SELECT h.visit_date, h.hr AS peak_hour, h.arrivals FROM hourly h",
        "WHERE NOT EXISTS (SELECT 1 FROM hourly o WHERE o.visit_date = h.visit_date AND (o.arrivals > h.arrivals OR (o.arrivals = h.arrivals AND o.hr < h.hr)))",
        "ORDER BY h.visit_date",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First count arrivals per (date, hour): `DATE(arrived_at)` and `HOUR(arrived_at)` are the bucket.",
      "Then pick one bucket per date — the highest count, and among equal counts the smallest hour.",
      "ROW_NUMBER with `ORDER BY arrivals DESC, hour` encodes both rules at once.",
    ],
    editorial: [
      "Bucket first, then choose. `DATE(arrived_at)` and `HOUR(arrived_at)` turn each timestamp into a (day, hour) bucket — `HOUR` truncates, so 14:59:59 is hour 14 — and a GROUP BY on both with `COUNT(*)` gives the arrivals per bucket.",
      "",
      "Choosing one bucket per day is a **top-1 per group** problem with a tie rule. `ROW_NUMBER() OVER (PARTITION BY visit_date ORDER BY arrivals DESC, hr)` numbers each day's hours from busiest to quietest, putting the earlier hour first among equal counts, so row 1 is exactly the statement's peak hour. RANK would return every tied hour, which is not what is asked.",
      "",
      "Without windows, keep a bucket when no other bucket of the same day beats it — more arrivals, or equal arrivals at an earlier hour — with `NOT EXISTS`. Days without arrivals have no rows and so no output, as the statement says. The aggregation is one pass; the ranking sorts at most 24 rows per day.",
    ].join("\n"),
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "icu-over-capacity-streaks",
    title: "ICU Over-Capacity Streaks",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "The ICU files a census every night. A night is **over capacity** when `occupied_beds` is **at least** `capacity` (extra patients wait in step-down beds). A missing census date is unknown, so it **breaks** a streak.",
      "",
      "Return every run of **three or more consecutive calendar dates** that were all over capacity, with columns `streak_start`, `streak_end` and `nights`, ordered by `streak_start`.",
    ].join("\n"),
    tables: [
      {
        name: "IcuCensus",
        columns: [
          { name: "census_date", type: "date" },
          { name: "occupied_beds", type: "int" },
          { name: "capacity", type: "int" },
        ],
        primaryKey: ["census_date"],
        note: "One row per night the census was filed; `capacity` can change when beds are added or closed.",
      },
    ],
    examples: [
      {
        IcuCensus: [
          ["2025-01-01", 18, 20],
          ["2025-01-02", 20, 20],
          ["2025-01-03", 22, 20],
          ["2025-01-04", 21, 20],
          ["2025-01-05", 19, 20],
          ["2025-01-06", 24, 22],
          ["2025-01-07", 23, 22],
          ["2025-01-09", 25, 22],
          ["2025-01-10", 22, 22],
          ["2025-01-11", 23, 22],
          ["2025-01-12", 22, 22],
        ],
      },
    ],
    gen: (rng) => {
      const start = dateBetween(rng, "2024-01-01", "2025-11-30");
      const span = chance(rng, 0.04) ? 0 : ri(rng, 3, 24);
      const rate = chance(rng, 0.3) ? 0.45 : 0.75;
      const rows: Cell[][] = [];
      for (let i = 0; i < span; i++) {
        if (chance(rng, 0.1)) continue;
        const cap = pick(rng, [16, 20, 20, 24]);
        const over = chance(rng, rate);
        rows.push([addDays(start, i), over ? cap + ri(rng, 0, 3) : cap - ri(rng, 1, 4), cap]);
      }
      return { IcuCensus: shuffle(rng, rows) };
    },
    solution: [
      "WITH overcap AS (",
      "  SELECT census_date,",
      "         DATEDIFF(census_date, '2000-01-01') - ROW_NUMBER() OVER (ORDER BY census_date) AS grp",
      "  FROM IcuCensus",
      "  WHERE occupied_beds >= capacity",
      ")",
      "SELECT MIN(census_date) AS streak_start, MAX(census_date) AS streak_end, COUNT(*) AS nights",
      "FROM overcap",
      "GROUP BY grp",
      "HAVING COUNT(*) >= 3",
      "ORDER BY streak_start",
    ].join("\n"),
    alternatives: [
      [
        "WITH flagged AS (",
        "  SELECT census_date,",
        "         CASE WHEN DATEDIFF(census_date, LAG(census_date) OVER (ORDER BY census_date)) = 1 THEN 0 ELSE 1 END AS starts_run",
        "  FROM IcuCensus WHERE occupied_beds >= capacity",
        "), numbered AS (",
        "  SELECT census_date, SUM(starts_run) OVER (ORDER BY census_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS run_id FROM flagged",
        ")",
        "SELECT MIN(census_date) AS streak_start, MAX(census_date) AS streak_end, COUNT(*) AS nights",
        "FROM numbered GROUP BY run_id HAVING COUNT(*) > 2 ORDER BY streak_start",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Keep only the over-capacity nights first; the question is then about runs of consecutive dates among them.",
      "Within a run, the date and the row number both go up by one each step — so their difference is constant.",
      "Turn the date into a day number (DATEDIFF from a fixed date) before subtracting the row number, then group by the difference.",
    ],
    editorial: [
      "This is **gaps and islands**. After filtering to the over-capacity nights, every streak is a set of rows whose dates are consecutive. Number the remaining rows in date order with `ROW_NUMBER()`, and turn each date into a day number with `DATEDIFF(census_date, '2000-01-01')`. Inside one streak both rise by exactly one per row, so *day number − row number* is the same for the whole streak; a gap — a night under capacity or a missing census — makes the day number jump while the row number does not, which starts a new value.",
      "",
      "Grouping by that difference gives one group per island: `MIN` and `MAX` of the dates are its ends and `COUNT(*)` its length, and `HAVING COUNT(*) >= 3` keeps the real streaks. Note the `>=` in the over-capacity test: a night exactly at capacity counts.",
      "",
      "The alternative marks each night that does **not** follow the previous over-capacity night by one day (LAG + DATEDIFF) as the start of a run, and a running SUM of those flags numbers the runs. Both sort the filtered rows once.",
    ].join("\n"),
  },

  {
    slug: "median-length-of-stay-by-ward",
    title: "Median Length of Stay by Ward",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation", "Dates"],
    description: [
      "Average length of stay is pulled up by a few very long admissions, so the bed-management team reports the **median** instead. A stay's length is `DATEDIFF(discharge_date, admit_date)` days (a same-day discharge is 0). Patients still admitted (`discharge_date` NULL) are excluded.",
      "",
      "For every ward with at least one discharge, return `ward`, `discharges` and `median_stay_days` — the middle length, or the **average of the two middle lengths** when the count is even, **rounded to 1 decimal**. Order by `ward`.",
    ].join("\n"),
    tables: [
      {
        name: "Admission",
        columns: [
          { name: "admission_id", type: "int" },
          { name: "patient_id", type: "int" },
          { name: "ward", type: "varchar" },
          { name: "admit_date", type: "date" },
          { name: "discharge_date", type: "date" },
        ],
        primaryKey: ["admission_id"],
        note: "`discharge_date` is NULL while the patient is still in the ward.",
      },
    ],
    examples: [
      {
        Admission: [
          [1, 101, "General", "2025-03-01", "2025-03-04"],
          [2, 102, "General", "2025-03-02", "2025-03-03"],
          [3, 103, "General", "2025-03-02", "2025-03-30"],
          [4, 104, "General", "2025-03-05", null],
          [5, 105, "ICU", "2025-03-01", "2025-03-08"],
          [6, 106, "ICU", "2025-03-03", "2025-03-07"],
          [7, 107, "ICU", "2025-03-04", "2025-03-06"],
          [8, 108, "ICU", "2025-03-04", "2025-03-14"],
          [9, 109, "Maternity", "2025-03-06", "2025-03-06"],
          [10, 110, "Paediatric", "2025-03-07", null],
        ],
      },
    ],
    gen: (rng) => {
      const wards = sample(rng, ["General", "ICU", "Maternity", "Paediatric", "Orthopaedic", "Surgical"], ri(rng, 1, 4));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 24);
      const rows = seq(1, n).map((id) => {
        const admit = dateBetween(rng, "2024-06-01", "2025-06-30");
        const los = chance(rng, 0.1) ? ri(rng, 20, 60) : ri(rng, 0, 9);
        return [id, ri(rng, 101, 200), pick(rng, wards), admit, chance(rng, 0.15) ? null : addDays(admit, los)];
      });
      return { Admission: rows };
    },
    solution: [
      "WITH stays AS (",
      "  SELECT ward, DATEDIFF(discharge_date, admit_date) AS los,",
      "         ROW_NUMBER() OVER (PARTITION BY ward ORDER BY DATEDIFF(discharge_date, admit_date), admission_id) AS rn,",
      "         COUNT(*) OVER (PARTITION BY ward) AS n",
      "  FROM Admission",
      "  WHERE discharge_date IS NOT NULL",
      ")",
      "SELECT ward, MAX(n) AS discharges, ROUND(AVG(los), 1) AS median_stay_days",
      "FROM stays",
      "WHERE rn IN (FLOOR((n + 1) / 2), FLOOR((n + 2) / 2))",
      "GROUP BY ward",
      "ORDER BY ward",
    ].join("\n"),
    alternatives: [
      [
        "WITH stays AS (",
        "  SELECT admission_id, ward, DATEDIFF(discharge_date, admit_date) AS los FROM Admission WHERE discharge_date IS NOT NULL",
        ")",
        "SELECT s.ward,",
        "       (SELECT COUNT(*) FROM stays c WHERE c.ward = s.ward) AS discharges,",
        "       ROUND(AVG(DISTINCT s.los), 1) AS median_stay_days",
        "FROM stays s",
        "WHERE (SELECT COUNT(*) FROM stays a WHERE a.ward = s.ward AND a.los <= s.los) * 2 >= (SELECT COUNT(*) FROM stays c WHERE c.ward = s.ward)",
        "  AND (SELECT COUNT(*) FROM stays b WHERE b.ward = s.ward AND b.los >= s.los) * 2 >= (SELECT COUNT(*) FROM stays c WHERE c.ward = s.ward)",
        "GROUP BY s.ward",
        "ORDER BY s.ward",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Compute each discharged stay's length first, then sort the stays of each ward by it.",
      "With `n` stays numbered 1…n, the middle positions are ⌊(n+1)/2⌋ and ⌊(n+2)/2⌋ — the same position when n is odd.",
      "Average the one or two middle values; `COUNT(*) OVER (PARTITION BY ward)` gives n on every row.",
    ],
    editorial: [
      "SQL has no MEDIAN aggregate in MySQL, so the median is built from window functions. Compute each discharged stay's length with `DATEDIFF`, then in each ward number the stays in order of length (`ROW_NUMBER`, with `admission_id` as a tie-break so the numbering is fixed) and attach the ward's count `n` to every row with `COUNT(*) OVER (PARTITION BY ward)`.",
      "",
      "The median sits at positions ⌊(n+1)/2⌋ and ⌊(n+2)/2⌋: for n = 3 both are 2, for n = 4 they are 2 and 3. Keep the rows at those positions and average them per ward — one value for an odd count, the mean of two for an even one. Equal lengths do not matter: whichever of the tied rows takes a middle position carries the same value. Rounded to 1 decimal, since the mean of two whole numbers can end in .5.",
      "",
      "The window-free version uses the definition of the median: a value with at least half the stays at or below it and at least half at or above it. Those qualifying values are the one or two middle values, and `AVG(DISTINCT …)` of them is the median. It is quadratic per ward; the window version sorts each ward once.",
    ].join("\n"),
  },

  {
    slug: "patients-with-three-straight-no-shows",
    title: "Patients With Three or More No-Shows in a Row",
    difficulty: "HARD",
    topics: ["Window Functions", "Conditional Logic"],
    description: [
      "The OPD wants to ask patients who repeatedly miss appointments to pay a booking deposit. Look at each patient's appointments in `slot_at` order. **Cancelled** appointments are ignored completely — they neither count as a no-show nor break a run. A completed appointment breaks a run.",
      "",
      "Return `patient_id` and `longest_no_show_run` (the most consecutive no-shows) for every patient whose longest run is **at least 3**. Order by **`longest_no_show_run` descending, then `patient_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "Appointment",
        columns: [
          { name: "appt_id", type: "int" },
          { name: "patient_id", type: "int" },
          { name: "slot_at", type: "datetime" },
          { name: "status", type: "enum", values: ["completed", "no_show", "cancelled"] },
        ],
        primaryKey: ["appt_id"],
        note: "A patient never has two appointments at the same `slot_at`.",
      },
    ],
    examples: [
      {
        Appointment: [
          [1, 11, "2025-01-06 10:00:00", "no_show"],
          [2, 11, "2025-01-13 10:00:00", "cancelled"],
          [3, 11, "2025-01-20 10:00:00", "no_show"],
          [4, 11, "2025-01-27 10:00:00", "no_show"],
          [5, 11, "2025-02-03 10:00:00", "completed"],
          [6, 12, "2025-01-07 11:30:00", "no_show"],
          [7, 12, "2025-01-14 11:30:00", "no_show"],
          [8, 12, "2025-01-21 11:30:00", "completed"],
          [9, 12, "2025-01-28 11:30:00", "no_show"],
          [10, 13, "2025-01-08 09:00:00", "no_show"],
          [11, 13, "2025-01-09 09:00:00", "no_show"],
          [12, 13, "2025-01-10 09:00:00", "no_show"],
          [13, 13, "2025-01-11 09:00:00", "no_show"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      for (const p of sample(rng, seq(11, 30), ri(rng, 2, 6))) {
        const k = ri(rng, 1, 9);
        const flaky = chance(rng, 0.65);
        let d = dateBetween(rng, "2024-01-01", "2025-06-30");
        for (let i = 0; i < k; i++) {
          const r = rng();
          const st = r < 0.15 ? "cancelled" : r < (flaky ? 0.85 : 0.45) ? "no_show" : "completed";
          rows.push([id++, p, stamp(d, ri(rng, 36, 68) * 900), st]);
          d = addDays(d, ri(rng, 1, 14));
        }
      }
      return { Appointment: shuffle(rng, rows) };
    },
    solution: [
      "WITH kept AS (",
      "  SELECT patient_id, status,",
      "         ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY slot_at)",
      "       - ROW_NUMBER() OVER (PARTITION BY patient_id, status ORDER BY slot_at) AS grp",
      "  FROM Appointment",
      "  WHERE status <> 'cancelled'",
      "), runs AS (",
      "  SELECT patient_id, grp, COUNT(*) AS run_len",
      "  FROM kept",
      "  WHERE status = 'no_show'",
      "  GROUP BY patient_id, grp",
      ")",
      "SELECT patient_id, MAX(run_len) AS longest_no_show_run",
      "FROM runs",
      "GROUP BY patient_id",
      "HAVING MAX(run_len) >= 3",
      "ORDER BY longest_no_show_run DESC, patient_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH marked AS (",
        "  SELECT patient_id, status,",
        "         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) OVER (PARTITION BY patient_id ORDER BY slot_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS block",
        "  FROM Appointment WHERE status IN ('completed', 'no_show')",
        "), runs AS (",
        "  SELECT patient_id, block, SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) AS run_len FROM marked GROUP BY patient_id, block",
        ")",
        "SELECT patient_id, MAX(run_len) AS longest_no_show_run FROM runs GROUP BY patient_id",
        "HAVING MAX(run_len) > 2 ORDER BY 2 DESC, 1",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Drop the cancelled appointments first — after that, a run is simply consecutive rows with status no_show.",
      "Number each patient's rows overall, and separately within each status. Inside a run of one status the two numbers rise together.",
      "Their difference labels each run; group by (patient, label) to measure runs, then take each patient's longest.",
    ],
    editorial: [
      "Removing the cancelled rows up front makes the rule in the statement automatic: what remains is a sequence of completed and no-show appointments per patient, and a run is a maximal block of consecutive no-shows in it.",
      "",
      "The **double ROW_NUMBER** trick labels the blocks. Number each patient's rows by `slot_at` (`rn_all`) and, separately, each patient's rows of the same status (`rn_status`). While the status stays the same, both increase by one per row, so `rn_all − rn_status` is constant; when a completed visit interrupts, `rn_all` advances without `rn_status` for no-shows, so the next no-show block gets a new label. Grouping the no-show rows by patient and label gives each run's length; the longest per patient, kept when it is at least 3, is the answer.",
      "",
      "The alternative counts the completed visits seen so far with a running SUM: every no-show between two completed visits shares the same count, so that count is the block id. Both approaches sort each patient's appointments once; ties in the final order fall back to `patient_id`.",
    ].join("\n"),
  },

  {
    slug: "opd-new-patient-retention-by-cohort",
    title: "OPD New-Patient Retention by Monthly Cohort",
    difficulty: "HARD",
    topics: ["Dates", "Subqueries", "Aggregation"],
    description: [
      "A clinic chain measures whether new patients come back. A patient's **cohort** is the month of their **first** visit. The patient is **retained** when they have at least one visit in the **calendar month right after** the cohort month (a visit later in the cohort month itself does not count).",
      "",
      "For every cohort, return `cohort_month` (`'YYYY-MM'`), `new_patients`, `retained` and `retention_pct` = 100 × retained ÷ new_patients, **rounded to 2 decimals**. Order by `cohort_month`.",
    ].join("\n"),
    tables: [
      {
        name: "Visit",
        columns: [
          { name: "visit_id", type: "int" },
          { name: "patient_id", type: "int" },
          { name: "visit_date", type: "date" },
        ],
        primaryKey: ["visit_id"],
        note: "One row per OPD consultation. A patient may visit several times in a month.",
      },
    ],
    examples: [
      {
        Visit: [
          [1, 1, "2024-11-05"],
          [2, 1, "2024-12-02"],
          [3, 2, "2024-11-20"],
          [4, 2, "2024-11-28"],
          [5, 3, "2024-11-30"],
          [6, 3, "2025-01-10"],
          [7, 4, "2024-12-15"],
          [8, 4, "2025-01-03"],
          [9, 4, "2025-01-20"],
          [10, 5, "2024-12-31"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let id = 1;
      const pts = chance(rng, 0.04) ? [] : sample(rng, seq(1, 40), ri(rng, 1, 12));
      for (const p of pts) {
        let d = dateBetween(rng, "2024-10-01", "2025-01-31");
        const k = ri(rng, 1, 4);
        for (let i = 0; i < k; i++) {
          rows.push([id++, p, d]);
          d = addDays(d, chance(rng, 0.3) ? ri(rng, 1, 10) : ri(rng, 15, 50));
        }
      }
      return { Visit: shuffle(rng, rows) };
    },
    solution: [
      "WITH firsts AS (",
      "  SELECT patient_id, MIN(visit_date) AS first_visit",
      "  FROM Visit",
      "  GROUP BY patient_id",
      "), flagged AS (",
      "  SELECT f.patient_id, DATE_FORMAT(f.first_visit, '%Y-%m') AS cohort_month,",
      "         CASE WHEN EXISTS (",
      "           SELECT 1 FROM Visit v",
      "           WHERE v.patient_id = f.patient_id",
      "             AND YEAR(v.visit_date) * 12 + MONTH(v.visit_date) = YEAR(f.first_visit) * 12 + MONTH(f.first_visit) + 1",
      "         ) THEN 1 ELSE 0 END AS came_back",
      "  FROM firsts f",
      ")",
      "SELECT cohort_month, COUNT(*) AS new_patients, SUM(came_back) AS retained,",
      "       ROUND(100 * SUM(came_back) / COUNT(*), 2) AS retention_pct",
      "FROM flagged",
      "GROUP BY cohort_month",
      "ORDER BY cohort_month",
    ].join("\n"),
    alternatives: [
      [
        "WITH firsts AS (",
        "  SELECT patient_id, DATE_FORMAT(MIN(visit_date), '%Y-%m') AS cohort_month,",
        "         DATE_FORMAT(DATE_ADD(CONCAT(DATE_FORMAT(MIN(visit_date), '%Y-%m'), '-01'), INTERVAL 1 MONTH), '%Y-%m') AS next_month",
        "  FROM Visit GROUP BY patient_id",
        "), returners AS (",
        "  SELECT DISTINCT f.patient_id FROM firsts f JOIN Visit v ON v.patient_id = f.patient_id AND DATE_FORMAT(v.visit_date, '%Y-%m') = f.next_month",
        ")",
        "SELECT f.cohort_month, COUNT(*) AS new_patients, COUNT(r.patient_id) AS retained,",
        "       ROUND(COUNT(r.patient_id) * 100 / COUNT(*), 2) AS retention_pct",
        "FROM firsts f LEFT JOIN returners r ON r.patient_id = f.patient_id",
        "GROUP BY f.cohort_month ORDER BY f.cohort_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Start with one row per patient: their first visit date, which fixes the cohort.",
      "\"The next calendar month\" is easiest as a month index: `YEAR(d) * 12 + MONTH(d)` — next month is that plus one, even across December.",
      "Flag each patient 0/1 for a visit in that month, then aggregate the flags per cohort.",
    ],
    editorial: [
      "Retention analysis works in two layers. The first collapses the visits to **one row per patient** — `MIN(visit_date)` is the first visit, and its month is the cohort. The second decides, per patient, whether a visit exists in the following calendar month, and then aggregates those yes/no flags per cohort.",
      "",
      "Calendar months are compared most safely as a month index, `YEAR × 12 + MONTH`: December 2024 is followed by January 2025 because the index simply increases by one, with no special case for the year boundary, and visits elsewhere in the cohort month or two months later do not match. An `EXISTS` subquery turns the check into a 0/1 flag, so `COUNT(*)` is the cohort size, `SUM(flag)` the retained patients, and their ratio × 100, rounded to 2 decimals, the rate.",
      "",
      "The alternative computes the next month's label with `DATE_ADD` on the first day of the cohort month (never on the visit date itself — adding a month to 31 January would clamp to February's last day), joins to the visits to find returners, and LEFT JOINs them back so cohorts with no returner still show 0.",
    ].join("\n"),
  },

  {
    slug: "insurance-claim-funnel-by-insurer",
    title: "Insurance Claim Funnel by Insurer",
    difficulty: "HARD",
    topics: ["Conditional Logic", "Aggregation", "Joins"],
    description: [
      "Every cashless claim moves through stages logged in `ClaimEvent`: `submitted`, possibly `query_raised`, then `approved` or `rejected`, and `paid` after approval. A stage is logged at most once per claim. The hospital's CFO wants each insurer's funnel.",
      "",
      "For every insurer with at least one claim, return `insurer`, `submitted`, `approved`, `paid` (claims that reached each stage), `paid_in_7_days` (paid **no later than 7 × 24 hours** after submission) and `fast_pay_pct` = 100 × paid_in_7_days ÷ submitted, **rounded to 2 decimals**. Order by `insurer`.",
    ].join("\n"),
    tables: [
      {
        name: "Claim",
        columns: [
          { name: "claim_id", type: "int" },
          { name: "insurer", type: "varchar" },
          { name: "claimed_amount", type: "int" },
        ],
        primaryKey: ["claim_id"],
        note: "One row per claim. Every claim has a `submitted` event.",
      },
      {
        name: "ClaimEvent",
        columns: [
          { name: "claim_id", type: "int" },
          { name: "stage", type: "enum", values: ["submitted", "query_raised", "approved", "rejected", "paid"] },
          { name: "event_at", type: "datetime" },
        ],
        primaryKey: ["claim_id", "stage"],
        note: "When the claim reached the stage.",
      },
    ],
    examples: [
      {
        Claim: [
          [1, "Star Health", 64000],
          [2, "Star Health", 18000],
          [3, "Star Health", 92000],
          [4, "Niva Bupa", 45000],
          [5, "Niva Bupa", 130000],
        ],
        ClaimEvent: [
          [1, "submitted", "2025-02-01 10:00:00"],
          [1, "approved", "2025-02-03 12:00:00"],
          [1, "paid", "2025-02-08 10:00:00"],
          [2, "submitted", "2025-02-02 09:00:00"],
          [2, "query_raised", "2025-02-04 09:00:00"],
          [2, "approved", "2025-02-10 15:00:00"],
          [2, "paid", "2025-02-12 11:00:00"],
          [3, "submitted", "2025-02-05 16:00:00"],
          [3, "rejected", "2025-02-07 16:00:00"],
          [4, "submitted", "2025-02-06 08:30:00"],
          [4, "approved", "2025-02-07 08:30:00"],
          [4, "paid", "2025-02-13 08:30:01"],
          [5, "submitted", "2025-02-10 13:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const insurers = sample(rng, INSURERS, ri(rng, 1, 3));
      const n = ri(rng, 1, 12);
      const claims: Cell[][] = [];
      const events: Cell[][] = [];
      for (let id = 1; id <= n; id++) {
        claims.push([id, pick(rng, insurers), roundTo(rng, 10000, 300000, 1000)]);
        const day = dateBetween(rng, "2024-06-01", "2025-06-30");
        const t0 = ri(rng, 8, 18) * 3600;
        events.push([id, "submitted", stamp(day, t0)]);
        let t = t0;
        if (chance(rng, 0.3)) events.push([id, "query_raised", stamp(day, (t += ri(rng, 1, 3) * 86400))]);
        const r = rng();
        if (r < 0.2) continue;
        if (r < 0.35) {
          events.push([id, "rejected", stamp(day, t + ri(rng, 1, 4) * 86400)]);
          continue;
        }
        events.push([id, "approved", stamp(day, (t += ri(rng, 1, 4) * 86400))]);
        if (chance(rng, 0.8)) {
          const exact = chance(rng, 0.25);
          const paidAt = exact ? t0 + 7 * 86400 + pick(rng, [0, 1]) : t + ri(rng, 1, 6) * 86400;
          events.push([id, "paid", stamp(day, Math.max(paidAt, t + 3600))]);
        }
      }
      return { Claim: claims, ClaimEvent: shuffle(rng, events) };
    },
    solution: [
      "WITH per_claim AS (",
      "  SELECT c.claim_id, c.insurer,",
      "         MAX(CASE WHEN e.stage = 'submitted' THEN e.event_at END) AS submitted_at,",
      "         MAX(CASE WHEN e.stage = 'approved' THEN 1 ELSE 0 END) AS was_approved,",
      "         MAX(CASE WHEN e.stage = 'paid' THEN e.event_at END) AS paid_at",
      "  FROM Claim c",
      "  JOIN ClaimEvent e ON e.claim_id = c.claim_id",
      "  GROUP BY c.claim_id, c.insurer",
      ")",
      "SELECT insurer,",
      "       COUNT(submitted_at) AS submitted,",
      "       SUM(was_approved) AS approved,",
      "       COUNT(paid_at) AS paid,",
      "       SUM(CASE WHEN TIMESTAMPDIFF(SECOND, submitted_at, paid_at) <= 604800 THEN 1 ELSE 0 END) AS paid_in_7_days,",
      "       ROUND(100 * SUM(CASE WHEN TIMESTAMPDIFF(SECOND, submitted_at, paid_at) <= 604800 THEN 1 ELSE 0 END) / COUNT(submitted_at), 2) AS fast_pay_pct",
      "FROM per_claim",
      "GROUP BY insurer",
      "ORDER BY insurer",
    ].join("\n"),
    alternatives: [
      [
        "SELECT c.insurer,",
        "       COUNT(s.claim_id) AS submitted,",
        "       COUNT(a.claim_id) AS approved,",
        "       COUNT(p.claim_id) AS paid,",
        "       SUM(IF(p.event_at <= DATE_ADD(s.event_at, INTERVAL 7 DAY), 1, 0)) AS paid_in_7_days,",
        "       ROUND(SUM(IF(p.event_at <= DATE_ADD(s.event_at, INTERVAL 7 DAY), 1, 0)) * 100 / COUNT(s.claim_id), 2) AS fast_pay_pct",
        "FROM Claim c",
        "JOIN ClaimEvent s ON s.claim_id = c.claim_id AND s.stage = 'submitted'",
        "LEFT JOIN ClaimEvent a ON a.claim_id = c.claim_id AND a.stage = 'approved'",
        "LEFT JOIN ClaimEvent p ON p.claim_id = c.claim_id AND p.stage = 'paid'",
        "GROUP BY c.insurer",
        "ORDER BY c.insurer",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First reshape the events into one row per claim: the submission time, whether it was approved, the payment time.",
      "`MAX(CASE WHEN stage = '…' THEN event_at END)` pulls one stage's time out of a claim's events (NULL if the stage never happened).",
      "Then aggregate the claim rows per insurer; a NULL payment time fails the 7-day test on its own.",
    ],
    editorial: [
      "The events are long-format — one row per (claim, stage) — while the funnel wants one row per insurer with a column per stage. The usual route is two steps. First **pivot per claim** with conditional aggregation: grouping the events by claim, `MAX(CASE WHEN stage = 'submitted' THEN event_at END)` is the submission time, the same for `paid`, and a 0/1 MAX for approval. Stages that never happened come out NULL (or 0).",
      "",
      "Then aggregate the claim rows per insurer. `COUNT(column)` counts non-NULL values, so `COUNT(paid_at)` is the paid claims. The 7-day test is `TIMESTAMPDIFF(SECOND, submitted_at, paid_at) <= 604800` — exact to the second, so a payment exactly seven days later counts and one second more does not; for an unpaid claim the difference is NULL and the CASE yields 0. The rate divides by the submitted count and is rounded to 2 decimals.",
      "",
      "The alternative joins `ClaimEvent` once per stage — an inner join for the mandatory submission, LEFT JOINs for the optional stages — which works because each stage occurs at most once per claim, so no join multiplies rows.",
    ].join("\n"),
  },

  {
    slug: "double-booked-doctor-appointment-slots",
    title: "Double-Booked Doctor Appointment Slots",
    difficulty: "HARD",
    topics: ["Joins", "Dates"],
    description: [
      "Reception sometimes books a doctor into two appointments that overlap in time. Two appointments of the **same doctor** overlap when each starts **before the other ends**; one ending exactly when the next starts is not an overlap. Cancelled appointments block nothing.",
      "",
      "Return every overlapping pair once, with `doctor_id`, `first_appt` (the smaller `appt_id`), `second_appt` and `overlap_minutes` (how long both run at the same time). Order by **`doctor_id`, `first_appt`, `second_appt`**.",
    ].join("\n"),
    tables: [
      {
        name: "Appointment",
        columns: [
          { name: "appt_id", type: "int" },
          { name: "doctor_id", type: "int" },
          { name: "patient_id", type: "int" },
          { name: "starts_at", type: "datetime" },
          { name: "ends_at", type: "datetime" },
          { name: "status", type: "enum", values: ["booked", "completed", "cancelled"] },
        ],
        primaryKey: ["appt_id"],
        note: "`ends_at` is always after `starts_at`; times are on whole minutes.",
      },
    ],
    examples: [
      {
        Appointment: [
          [1, 7, 501, "2025-05-12 10:00:00", "2025-05-12 10:30:00", "completed"],
          [2, 7, 502, "2025-05-12 10:20:00", "2025-05-12 10:40:00", "completed"],
          [3, 7, 503, "2025-05-12 10:40:00", "2025-05-12 11:00:00", "booked"],
          [4, 7, 504, "2025-05-12 10:05:00", "2025-05-12 10:15:00", "booked"],
          [5, 8, 505, "2025-05-12 10:00:00", "2025-05-12 11:00:00", "booked"],
          [6, 8, 506, "2025-05-12 10:30:00", "2025-05-12 10:45:00", "cancelled"],
          [7, 9, 507, "2025-05-12 09:00:00", "2025-05-12 09:30:00", "booked"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const docs = sample(rng, [7, 8, 9, 10, 11], ri(rng, 1, 3));
      const day = dateBetween(rng, "2024-01-01", "2025-12-31");
      const rows = seq(1, n).map((id) => {
        const start = ri(rng, 36, 52) * 15 * 60;
        const len = pick(rng, [15, 15, 20, 30, 45, 60]) * 60;
        return [id, pick(rng, docs), ri(rng, 501, 560), stamp(day, start), stamp(day, start + len), pick(rng, ["booked", "booked", "completed", "cancelled"])];
      });
      return { Appointment: rows };
    },
    solution: [
      "SELECT a.doctor_id, a.appt_id AS first_appt, b.appt_id AS second_appt,",
      "       TIMESTAMPDIFF(MINUTE, GREATEST(a.starts_at, b.starts_at), LEAST(a.ends_at, b.ends_at)) AS overlap_minutes",
      "FROM Appointment a",
      "JOIN Appointment b",
      "  ON b.doctor_id = a.doctor_id",
      " AND a.appt_id < b.appt_id",
      " AND a.starts_at < b.ends_at",
      " AND b.starts_at < a.ends_at",
      "WHERE a.status <> 'cancelled' AND b.status <> 'cancelled'",
      "ORDER BY a.doctor_id, first_appt, second_appt",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.doctor_id, a.appt_id AS first_appt, b.appt_id AS second_appt,",
        "       TIMESTAMPDIFF(MINUTE, CASE WHEN a.starts_at > b.starts_at THEN a.starts_at ELSE b.starts_at END, CASE WHEN a.ends_at < b.ends_at THEN a.ends_at ELSE b.ends_at END) AS overlap_minutes",
        "FROM (SELECT * FROM Appointment WHERE status IN ('booked', 'completed')) a",
        "JOIN (SELECT * FROM Appointment WHERE status IN ('booked', 'completed')) b ON a.doctor_id = b.doctor_id AND b.appt_id > a.appt_id",
        "WHERE NOT (a.ends_at <= b.starts_at OR b.ends_at <= a.starts_at)",
        "ORDER BY 1, 2, 3",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Pair the table with itself on the doctor; `a.appt_id < b.appt_id` lists each pair once and never pairs a row with itself.",
      "Two intervals overlap exactly when each starts before the other ends — strict `<` keeps back-to-back slots apart.",
      "The shared time runs from the later start to the earlier end: GREATEST and LEAST.",
    ],
    editorial: [
      "Finding conflicts between rows of the same table is a **self join**. Pair every appointment `a` with every other appointment `b` of the same doctor, and require `a.appt_id < b.appt_id` so each unordered pair appears once and no appointment is paired with itself.",
      "",
      "The overlap test for intervals is the standard one: `a.starts_at < b.ends_at AND b.starts_at < a.ends_at`. It covers every arrangement — partial overlap on either side and one interval containing the other (appointments 1 and 4 in the example) — and the strict inequalities make back-to-back slots, where one ends at 10:40 and the next starts at 10:40, not count. Its negation, \"one ends before the other starts\", is the alternative's `NOT (…)` form.",
      "",
      "The shared stretch starts at the later of the two starts and ends at the earlier of the two ends, so `TIMESTAMPDIFF(MINUTE, GREATEST(starts), LEAST(ends))` is the overlap. Cancelled appointments are removed on both sides. The join is quadratic per doctor-day; an index on (doctor_id, starts_at) keeps it small in practice.",
    ].join("\n"),
  },

  {
    slug: "daily-admissions-with-quiet-days-and-running-total",
    title: "Daily Admissions With Quiet Days and a Running Total",
    difficulty: "HARD",
    topics: ["Dates", "Window Functions", "Subqueries"],
    description: [
      "The hospital's admissions chart must show **every calendar day** from the first admission date in the table to the last one, including quiet days with no admission (which have no row in `Admission`).",
      "",
      "Return `day`, `admissions` (admissions that day, 0 on a quiet day) and `running_total` (all admissions from the first day up to and including this one), ordered by `day`. An empty table gives no rows.",
    ].join("\n"),
    tables: [
      {
        name: "Admission",
        columns: [
          { name: "admission_id", type: "int" },
          { name: "patient_id", type: "int" },
          { name: "admit_date", type: "date" },
          { name: "ward", type: "varchar" },
        ],
        primaryKey: ["admission_id"],
        note: "One row per inpatient admission. The first and last admission dates are never more than a month apart.",
      },
    ],
    examples: [
      {
        Admission: [
          [1, 101, "2025-03-01", "General"],
          [2, 102, "2025-03-01", "ICU"],
          [3, 103, "2025-03-02", "General"],
          [4, 104, "2025-03-05", "Maternity"],
          [5, 105, "2025-03-05", "General"],
          [6, 106, "2025-03-05", "Paediatric"],
          [7, 107, "2025-03-07", "General"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 20);
      const base = dateBetween(rng, "2024-01-01", "2025-11-30");
      const span = ri(rng, 0, 20);
      const rows = seq(1, n).map((id) => [id, ri(rng, 101, 180), addDays(base, ri(rng, 0, span)), pick(rng, ["General", "ICU", "Maternity", "Paediatric"])]);
      return { Admission: rows };
    },
    solution: [
      "WITH RECURSIVE days AS (",
      "  SELECT MIN(admit_date) AS day FROM Admission",
      "  UNION ALL",
      "  SELECT DATE_ADD(day, INTERVAL 1 DAY) FROM days",
      "  WHERE day < (SELECT MAX(admit_date) FROM Admission)",
      "), daily AS (",
      "  SELECT d.day, COUNT(a.admission_id) AS admissions",
      "  FROM days d",
      "  LEFT JOIN Admission a ON a.admit_date = d.day",
      "  WHERE d.day IS NOT NULL",
      "  GROUP BY d.day",
      ")",
      "SELECT day, admissions,",
      "       SUM(admissions) OVER (ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total",
      "FROM daily",
      "ORDER BY day",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE days AS (",
        "  SELECT MIN(admit_date) AS day, MAX(admit_date) AS last_day FROM Admission",
        "  UNION ALL",
        "  SELECT DATE_ADD(day, INTERVAL 1 DAY), last_day FROM days WHERE day < last_day",
        ")",
        "SELECT d.day,",
        "       (SELECT COUNT(*) FROM Admission a WHERE a.admit_date = d.day) AS admissions,",
        "       (SELECT COUNT(*) FROM Admission a WHERE a.admit_date <= d.day) AS running_total",
        "FROM days d",
        "WHERE d.day IS NOT NULL",
        "ORDER BY d.day",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Quiet days have no rows, so they must be generated — a recursive CTE can count from the first date to the last one day at a time.",
      "LEFT JOIN the admissions onto the generated days and COUNT a column of `Admission`, so a quiet day counts 0.",
      "A running total is `SUM(...) OVER (ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`.",
    ],
    editorial: [
      "A GROUP BY over `Admission` can only produce days that have rows, so the quiet days have to be **generated**. A recursive CTE does that: the anchor is the first admission date, and each recursive step adds one day with `DATE_ADD(day, INTERVAL 1 DAY)` until the last admission date is reached. The table spans at most a month, so the recursion is short and always terminates.",
      "",
      "LEFT JOIN the admissions onto the calendar on the date and group by day; `COUNT(a.admission_id)` counts 0 for a quiet day, where `COUNT(*)` would count the calendar row itself and say 1. The running total is a window sum over the days in order, with an explicit `ROWS` frame — the days are unique, so it is the same as the default here, but stating it avoids surprises.",
      "",
      "On an empty table the anchor still returns one row, with a NULL day, and the recursion stops at once; `WHERE day IS NOT NULL` removes it so the answer is empty. The alternative uses correlated counts — admissions on the day and up to the day — instead of a join and a window.",
    ].join("\n"),
  },
];
