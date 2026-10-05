import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, atTime, chance, dateBetween, names, pick, ri, roundTo, sample } from "./kit.js";

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);

const HOSTELS = ["Ganga", "Kaveri", "Narmada", "Godavari", "Yamuna"] as const;
const CANTEEN_MENU = [
  ["Masala Dosa", 60], ["Veg Thali", 90], ["Samosa", 20], ["Cold Coffee", 45],
  ["Paneer Roll", 70], ["Idli Vada", 40], ["Maggi", 35], ["Lemon Tea", 15],
] as const;
const WARDS = ["General", "ICU", "Maternity", "Paediatric", "Orthopaedic"] as const;
const TRAINS = [
  [12627, "Karnataka Express"], [12951, "Rajdhani Express"], [12009, "Shatabdi Express"], [22439, "Vande Bharat Express"],
  [12213, "Duronto Express"], [12909, "Garib Rath"], [16345, "Netravati Express"], [12301, "Rajdhani Express"],
] as const;
const ZONES = ["Koramangala", "Indiranagar", "HSR Layout", "Whitefield", "Jayanagar"] as const;
const TEAMS = ["Chennai Chargers", "Mumbai Mavericks", "Kolkata Knights", "Pune Panthers", "Delhi Dynamos", "Kochi Comets"] as const;
const TRACKS = ["Aptitude", "Core CS", "DSA", "Puzzles", "SQL", "Verbal"] as const;
const ORDER_STATUS = ["delivered", "delivered", "delivered", "cancelled_by_customer", "cancelled_by_partner", "cancelled_by_restaurant"] as const;

/** Joins: inner, outer, self and anti joins. Easiest first. */
export const JOINS: SqlProblemSpec[] = [
  {
    slug: "employees-earning-more-than-their-manager",
    title: "Employees Earning More Than Their Manager",
    difficulty: "EASY",
    topics: ["Joins"],
    description: [
      "Every employee except the people at the top reports to a manager, who is also a row of the `Employee` table.",
      "",
      "Return the name of every employee whose salary is **strictly greater** than their manager's salary, in a column named `employee`. Employees without a manager are never in the answer. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Employee",
        columns: [
          { name: "id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "salary", type: "int" },
          { name: "managerId", type: "int" },
        ],
        primaryKey: ["id"],
        note: "`managerId` is the `id` of the employee's manager, or NULL for someone with no manager.",
      },
    ],
    examples: [
      {
        Employee: [
          [1, "Asha", 90000, null],
          [2, "Ravi", 95000, 1],
          [3, "Meera", 60000, 1],
          [4, "Kabir", 70000, 3],
          [5, "Zara", 60000, 3],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const people = names(rng, n);
      const rows = people.map((name, i) => {
        const id = i + 1;
        // Managers are earlier rows, so the reporting lines never loop.
        const managerId = i === 0 || chance(rng, 0.2) ? null : ri(rng, 1, i);
        return [id, name, roundTo(rng, 30000, 120000, 5000), managerId];
      });
      // Now and then a salary equal to the manager's, the case "strictly" is about.
      if (n > 1 && chance(rng, 0.5)) {
        const r = pick(rng, rows.slice(1));
        const boss = rows.find((x) => x[0] === r[3]);
        if (boss) r[2] = boss[2]!;
      }
      return { Employee: rows };
    },
    solution: [
      "SELECT e.name AS employee",
      "FROM Employee e",
      "JOIN Employee m ON e.managerId = m.id",
      "WHERE e.salary > m.salary",
    ].join("\n"),
    alternatives: [
      "SELECT name AS employee FROM Employee e WHERE salary > (SELECT salary FROM Employee m WHERE m.id = e.managerId)",
      "SELECT e.name AS employee FROM Employee e, Employee m WHERE e.managerId = m.id AND e.salary > m.salary",
    ],
    hints: [
      "Each row needs to be compared with another row of the same table — its manager's.",
      "Join `Employee` to itself: one copy plays the employee, the other the manager, matched on `e.managerId = m.id`.",
      "An inner join already drops employees with no manager, because NULL matches no id.",
    ],
    editorial: [
      "The comparison is between two rows of one table: an employee and the row of their manager. A **self join** puts those two rows side by side — the table appears twice in `FROM` under two aliases, `e` for the employee and `m` for the manager, and the join condition `e.managerId = m.id` pairs each employee with exactly one manager row.",
      "",
      "Once the rows are paired, the question is a plain filter: keep the pairs where `e.salary > m.salary`, and select the employee's name under the alias the statement asks for.",
      "",
      "People with no manager have `managerId` NULL. `NULL = m.id` is never true, so an inner join drops them without any extra condition — which is what the statement wants. A correlated subquery that looks up the manager's salary works too: for a NULL `managerId` the subquery returns no row, the comparison is NULL, and the row is filtered out the same way.",
      "",
      "Equal salaries are not \"more\", so the comparison is strict. The join reads each employee once and finds the manager through the primary key, so it is linear in the size of the table with an index on `id`.",
    ].join("\n"),
  },

  {
    slug: "hostel-students-who-never-ordered-from-the-canteen",
    title: "Hostel Students Who Never Ordered From the Canteen",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "The college canteen takes orders through its app. An order placed by a hostel student carries the student's roll number; walk-in guests pay at the counter, and their orders are stored with `roll_no` NULL.",
      "",
      "Return every student who has **never placed an order**, with the columns `roll_no` and `name`. Guest orders belong to no student and change nothing for anyone. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Student",
        columns: [
          { name: "roll_no", type: "int" },
          { name: "name", type: "varchar" },
          { name: "hostel", type: "varchar" },
        ],
        primaryKey: ["roll_no"],
        note: "One row per student living in a college hostel.",
      },
      {
        name: "CanteenOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "roll_no", type: "int" },
          { name: "item", type: "varchar" },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["order_id"],
        note: "`roll_no` is the student who ordered, or NULL for a walk-in guest. A non-NULL `roll_no` is always in `Student`.",
      },
    ],
    examples: [
      {
        Student: [
          [101, "Aarav", "Ganga"],
          [102, "Diya", "Kaveri"],
          [103, "Ishaan", "Ganga"],
          [104, "Meera", "Narmada"],
          [105, "Rohan", "Kaveri"],
        ],
        CanteenOrder: [
          [1, 102, "Masala Dosa", 60],
          [2, 104, "Veg Thali", 90],
          [3, 102, "Cold Coffee", 45],
          [4, null, "Samosa", 20],
          [5, 104, "Paneer Roll", 70],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const rolls = sample(rng, seq(101, 40), n);
      const who = names(rng, n);
      const students = rolls.map((roll, i) => [roll, who[i]!, pick(rng, HOSTELS)]);
      // Only some students ever order; now and then all of them might.
      const buyers = chance(rng, 0.15) ? rolls : sample(rng, rolls, ri(rng, 0, n));
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 15);
      const orders = seq(1, m).map((id) => {
        const [item, price] = pick(rng, CANTEEN_MENU);
        const guest = buyers.length === 0 || chance(rng, 0.2);
        return [id, guest ? null : pick(rng, buyers), item, price];
      });
      return { Student: students, CanteenOrder: orders };
    },
    solution: [
      "SELECT s.roll_no, s.name",
      "FROM Student s",
      "LEFT JOIN CanteenOrder o ON o.roll_no = s.roll_no",
      "WHERE o.order_id IS NULL",
    ].join("\n"),
    alternatives: [
      "SELECT roll_no, name FROM Student s WHERE NOT EXISTS (SELECT 1 FROM CanteenOrder o WHERE o.roll_no = s.roll_no)",
      "SELECT roll_no, name FROM Student WHERE roll_no NOT IN (SELECT roll_no FROM CanteenOrder WHERE roll_no IS NOT NULL)",
    ],
    hints: [
      "Every row of the answer is a student, so start from `Student` and look for that student's orders.",
      "A LEFT JOIN keeps a student even when no order matches; on those rows every column of the order is NULL.",
      "Test a column of the order that is never NULL on a real order — its primary key — for IS NULL.",
      "If you reach for `NOT IN (SELECT roll_no FROM CanteenOrder)`, think about what one NULL in that list does to the comparison.",
    ],
    editorial: [
      "This is an **anti join**: keep the rows of one table that have no partner in another. The most common way to write it is a LEFT JOIN from `Student` to `CanteenOrder` on the roll number. A student with orders appears once per order; a student without any appears exactly once, with NULL in every column of `CanteenOrder`. Filtering on `o.order_id IS NULL` keeps only those — the primary key is never NULL on a real order, so a NULL there can only mean \"no match\".",
      "",
      "`NOT EXISTS` says the same thing directly: keep the student if no order carries their roll number. It stops at the first matching order and is usually what an optimiser turns the LEFT JOIN into anyway.",
      "",
      "The trap is `NOT IN`. Guest orders have `roll_no` NULL, and `101 NOT IN (102, 104, NULL)` is not true but *unknown* — SQL cannot tell whether 101 equals the missing value — so the filter drops every student and the answer comes back empty. Either filter the NULLs out of the subquery, as the third query does, or use one of the forms above, which never compare against NULL. With an index on `CanteenOrder.roll_no` each form is one lookup per student.",
    ].join("\n"),
  },

  {
    slug: "admitted-patients-and-their-ward-beds",
    title: "Admitted Patients and Their Ward Beds",
    difficulty: "EASY",
    topics: ["Joins"],
    description: [
      "A hospital keeps its admitted patients in `Patient` and bed assignments in `BedAllocation`. Not every patient has been given a bed yet, and `BedAllocation` still holds a few rows for patients who were discharged and are no longer in `Patient`.",
      "",
      "Return **one row per patient** in `Patient` with the columns `patient_id`, `name`, `ward` and `bed_no`. A patient without a bed gets NULL in `ward` and `bed_no`. Allocations of discharged patients are not part of the answer. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Patient",
        columns: [
          { name: "patient_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "admitted_on", type: "date" },
        ],
        primaryKey: ["patient_id"],
        note: "One row per patient currently admitted.",
      },
      {
        name: "BedAllocation",
        columns: [
          { name: "patient_id", type: "int" },
          { name: "ward", type: "varchar" },
          { name: "bed_no", type: "int" },
        ],
        primaryKey: ["patient_id"],
        note: "At most one bed per patient. A `patient_id` here may belong to someone already discharged.",
      },
    ],
    examples: [
      {
        Patient: [
          [1, "Kavya", "2025-02-03"],
          [2, "Arjun", "2025-02-04"],
          [3, "Sneha", "2025-02-04"],
          [4, "Farhan", "2025-02-05"],
        ],
        BedAllocation: [
          [1, "General", 12],
          [3, "ICU", 2],
          [7, "Maternity", 5],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const ids = sample(rng, seq(1, 30), n);
      const who = names(rng, n);
      const patients = ids.map((id, i) => [id, who[i]!, dateBetween(rng, "2025-02-01", "2025-02-20")]);
      const beds: Cell[][] = [];
      const bedRate = pick(rng, [0, 0.4, 0.7, 1]);
      for (const id of ids) if (chance(rng, bedRate)) beds.push([id, pick(rng, WARDS), ri(rng, 1, 40)]);
      // Discharged patients whose allocation was never cleared.
      for (const id of sample(rng, seq(31, 10), ri(rng, 0, 3))) beds.push([id, pick(rng, WARDS), ri(rng, 1, 40)]);
      return { Patient: patients, BedAllocation: beds };
    },
    solution: [
      "SELECT p.patient_id, p.name, b.ward, b.bed_no",
      "FROM Patient p",
      "LEFT JOIN BedAllocation b ON b.patient_id = p.patient_id",
    ].join("\n"),
    alternatives: [
      "SELECT p.patient_id, p.name, b.ward, b.bed_no FROM BedAllocation b RIGHT JOIN Patient p ON p.patient_id = b.patient_id",
      [
        "SELECT p.patient_id, p.name,",
        "  (SELECT ward FROM BedAllocation b WHERE b.patient_id = p.patient_id) AS ward,",
        "  (SELECT bed_no FROM BedAllocation b WHERE b.patient_id = p.patient_id) AS bed_no",
        "FROM Patient p",
      ].join("\n"),
    ],
    hints: [
      "Every patient must appear, bed or no bed — which table decides the rows?",
      "An inner join would drop patients who have no allocation. Which join keeps the left table's unmatched rows?",
      "Rows of `BedAllocation` with no patient should vanish; make sure your join does not keep the right side's unmatched rows too.",
    ],
    editorial: [
      "The answer has one row per patient, so `Patient` drives the query and the bed is optional information attached to it. That is exactly what a **LEFT JOIN** does: every row of the left table appears, joined to its matching row on the right when there is one, and padded with NULLs when there is not.",
      "",
      "An inner join would be wrong in one direction — Arjun and Farhan, who have no bed yet, would disappear. A FULL join would be wrong in the other — the stale allocation for patient 7, discharged long ago, would show up as a row with a NULL name. The LEFT JOIN keeps unmatched rows of `Patient` only.",
      "",
      "`BedAllocation` has `patient_id` as its primary key, so a patient matches at most one row and never appears twice. A RIGHT JOIN with the tables swapped is the same query written from the other side, and two scalar subqueries in the select list work as well (a subquery that finds no row yields NULL), though they look the allocation up twice. With the key indexed, the join is one lookup per patient.",
    ].join("\n"),
  },

  {
    slug: "train-name-and-travel-year-on-every-booking",
    title: "Train Name and Travel Year on Every Booking",
    difficulty: "EASY",
    topics: ["Joins", "Dates"],
    description: [
      "A railway booking site stores each ticket with the number of the train it is for; the train's name lives in the `Train` table. Two different trains can share a name.",
      "",
      "For every row of `Booking`, return the columns `pnr`, `train_name`, `travel_year` (the year of `journey_date`, as a number) and `fare`. Every booking's train is in `Train`; trains nobody booked do not appear. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Train",
        columns: [
          { name: "train_no", type: "int" },
          { name: "train_name", type: "varchar" },
          { name: "source", type: "varchar" },
          { name: "destination", type: "varchar" },
        ],
        primaryKey: ["train_no"],
        note: "One row per train service.",
      },
      {
        name: "Booking",
        columns: [
          { name: "pnr", type: "bigint" },
          { name: "train_no", type: "int" },
          { name: "journey_date", type: "date" },
          { name: "fare", type: "int" },
        ],
        primaryKey: ["pnr"],
        note: "One row per ticket. `fare` is in rupees.",
      },
    ],
    examples: [
      {
        Train: [
          [12627, "Karnataka Express", "Bengaluru", "Delhi"],
          [12951, "Rajdhani Express", "Mumbai", "Delhi"],
          [12301, "Rajdhani Express", "Kolkata", "Delhi"],
          [12009, "Shatabdi Express", "Mumbai", "Ahmedabad"],
        ],
        Booking: [
          [4512873690, 12951, "2024-12-30", 3150],
          [4598120034, 12627, "2025-01-02", 1890],
          [4433019987, 12301, "2025-03-15", 2950],
          [4471200561, 12951, "2025-01-11", 3150],
          [4420987712, 12627, "2024-11-08", 1740],
        ],
      },
    ],
    gen: (rng) => {
      const trains = sample(rng, TRAINS, ri(rng, 1, 6));
      const trainRows = trains.map(([no, name]) => {
        const [from, to] = sample(rng, ["Bengaluru", "Mumbai", "Delhi", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur"], 2);
        return [no, name, from!, to!];
      });
      const m = chance(rng, 0.08) ? 0 : ri(rng, 1, 14);
      const pnrs = new Set<number>();
      while (pnrs.size < m) pnrs.add(ri(rng, 4100000000, 4999999999));
      const bookings = [...pnrs].map((pnr) => [
        pnr,
        pick(rng, trains)[0],
        dateBetween(rng, "2023-11-01", "2026-02-28"),
        roundTo(rng, 300, 4000, 10),
      ]);
      return { Train: trainRows, Booking: bookings };
    },
    solution: [
      "SELECT b.pnr, t.train_name, YEAR(b.journey_date) AS travel_year, b.fare",
      "FROM Booking b",
      "JOIN Train t ON t.train_no = b.train_no",
    ].join("\n"),
    alternatives: [
      "SELECT b.pnr, t.train_name, CAST(LEFT(b.journey_date, 4) AS SIGNED) AS travel_year, b.fare FROM Booking b, Train t WHERE t.train_no = b.train_no",
      "SELECT pnr, (SELECT train_name FROM Train t WHERE t.train_no = b.train_no) AS train_name, YEAR(journey_date) AS travel_year, fare FROM Booking b",
    ],
    hints: [
      "The name is in one table and the ticket in another; they share `train_no`.",
      "Join on the train number, not on the name — two trains can be called the same thing.",
      "`YEAR(date)` gives the year of a date as a number.",
    ],
    editorial: [
      "Each booking knows its train only by number, so the name has to be fetched from `Train`. An **inner join** on `train_no` puts every booking next to its train's row; because every booking's train exists, no booking is lost, and trains with no bookings simply never match anything.",
      "",
      "Join on the key, never on a descriptive column. Here two different services are both called \"Rajdhani Express\" — joining or grouping by name would mix them up — while `train_no` identifies exactly one row of `Train`, so each booking produces exactly one output row.",
      "",
      "The year comes from `YEAR(journey_date)`, which returns a number. Taking the first four characters with `LEFT` and casting works too because dates are stored in a fixed `YYYY-MM-DD` form, but `YEAR` states the intent. Selecting the columns under the requested names finishes the query.",
      "",
      "The comma join with the condition in `WHERE` is the older spelling of the same inner join, and a scalar subquery in the select list looks the name up per booking; with `train_no` as the primary key, all three are one index lookup per booking.",
    ].join("\n"),
  },

  {
    slug: "delivery-captains-leading-five-or-more-riders",
    title: "Delivery Captains Leading Five or More Riders",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation"],
    description: [
      "A food-delivery company groups its riders into squads. Each rider reports to a captain, who is also a rider in the same table; `captain_id` is NULL for a rider who reports to nobody.",
      "",
      "Return the name of every rider who has **at least five** riders reporting **directly** to them, in a column named `captain`. A report's own reports do not count. A `captain_id` that matches no rider in the table (a captain who has left the company) is ignored. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Rider",
        columns: [
          { name: "rider_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "zone", type: "varchar" },
          { name: "captain_id", type: "int" },
        ],
        primaryKey: ["rider_id"],
        note: "`captain_id` is the `rider_id` of the rider's captain, or NULL. It may name a rider who is no longer in the table.",
      },
    ],
    examples: [
      {
        Rider: [
          [1, "Vikram", "Koramangala", null],
          [2, "Rahul", "Koramangala", 1],
          [3, "Pooja", "Indiranagar", 1],
          [4, "Karan", "Indiranagar", 1],
          [5, "Aisha", "HSR Layout", 2],
          [6, "Dev", "HSR Layout", 2],
          [7, "Simran", "Whitefield", 2],
          [8, "Harsh", "Whitefield", 2],
          [9, "Ira", "Jayanagar", 2],
          [10, "Kabir", "Jayanagar", 1],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.06) ? ri(rng, 1, 5) : ri(rng, 8, 25);
      const who = names(rng, n);
      const ids = seq(1, n);
      const captainOf = new Map<number, number | null>(ids.map((id) => [id, null]));
      const captains = sample(rng, ids, ri(rng, n >= 8 ? 2 : 1, Math.min(3, n)));
      // A captain who has left the company, served first so their squad is often big enough to matter.
      if (chance(rng, 0.4)) captains.unshift(99);
      // Squads sized around the boundary: four is one short, five is enough.
      const order = sample(rng, ids, n);
      for (const c of captains) {
        const size = pick(rng, [3, 4, 5, 5, 6, 7]);
        let given = 0;
        for (const id of order) {
          if (given === size) break;
          if (id !== c && captainOf.get(id) === null) {
            captainOf.set(id, c);
            given++;
          }
        }
      }
      const rows = ids.map((id, i) => [id, who[i]!, pick(rng, ZONES), captainOf.get(id) ?? null]);
      return { Rider: rows };
    },
    solution: [
      "SELECT c.name AS captain",
      "FROM Rider c",
      "JOIN Rider r ON r.captain_id = c.rider_id",
      "GROUP BY c.rider_id, c.name",
      "HAVING COUNT(*) >= 5",
    ].join("\n"),
    alternatives: [
      "SELECT name AS captain FROM Rider WHERE rider_id IN (SELECT captain_id FROM Rider GROUP BY captain_id HAVING COUNT(*) >= 5)",
      "SELECT name AS captain FROM Rider c WHERE (SELECT COUNT(*) FROM Rider r WHERE r.captain_id = c.rider_id) >= 5",
      "SELECT c.name AS captain FROM Rider c JOIN (SELECT captain_id, COUNT(*) AS squad FROM Rider WHERE captain_id IS NOT NULL GROUP BY captain_id) s ON s.captain_id = c.rider_id WHERE s.squad >= 5",
    ],
    hints: [
      "Count the riders per `captain_id` first — that number is the size of each squad.",
      "The count belongs to a captain, but the name you need is on the captain's own row: join the table to itself, or look the ids up with `IN`.",
      "\"At least five\" includes five.",
      "A captain who left still has a count, but no row of their own — make sure the join or lookup drops them.",
    ],
    editorial: [
      "Two questions hide in one: how many riders report to each person, and what is that person's name. The count comes from grouping the reports by `captain_id`; the name lives on a different row — the captain's own — so the table is used twice.",
      "",
      "The reference query self-joins: `c` is the captain and `r` each rider whose `captain_id` points at `c`. Grouping by the captain's id (and name, so the name can be selected) leaves one group per captain with one row per direct report, and `HAVING COUNT(*) >= 5` keeps the big squads. Grouping by `rider_id` rather than `name` keeps two captains who share a name apart.",
      "",
      "The edges are handled by the join itself. Riders with NULL `captain_id` match no captain. A `captain_id` belonging to someone who has left matches no row of `c`, so their squad, however large, never reaches the answer. Only direct reports are counted because the join follows one link, not a chain.",
      "",
      "The alternatives count first and look the names up afterwards — with `IN` over a grouped subquery, a correlated `COUNT(*)` per rider, or a join to a derived table of squad sizes. All of them read the table about twice; with an index on `captain_id` the correlated count is one range scan per rider.",
    ].join("\n"),
  },

  {
    slug: "costliest-auction-buy-of-each-cricket-team",
    title: "Costliest Auction Buy of Each Cricket Team",
    difficulty: "MEDIUM",
    topics: ["Joins", "Subqueries"],
    description: [
      "At a college cricket league's auction, each player who is sold joins a team at the price the team bid; a player nobody bought has `team_id` NULL and keeps their base price.",
      "",
      "For every team, return the player it paid the most for — and when **several** of its players went for the same top price, return **all** of them. Return the columns `team` (the team's name), `player` (the player's name) and `price`. Teams that bought nobody, and unsold players, do not appear. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Team",
        columns: [
          { name: "team_id", type: "int" },
          { name: "team_name", type: "varchar" },
        ],
        primaryKey: ["team_id"],
        note: "One row per franchise in the league.",
      },
      {
        name: "Player",
        columns: [
          { name: "player_id", type: "int" },
          { name: "player_name", type: "varchar" },
          { name: "team_id", type: "int" },
          { name: "price", type: "int" },
        ],
        primaryKey: ["player_id"],
        note: "`team_id` is the buying team, or NULL if unsold. `price` is in thousands of rupees.",
      },
    ],
    examples: [
      {
        Team: [
          [1, "Chennai Chargers"],
          [2, "Mumbai Mavericks"],
          [3, "Kolkata Knights"],
          [4, "Pune Panthers"],
        ],
        Player: [
          [1, "Arjun", 1, 95],
          [2, "Ishaan", 1, 120],
          [3, "Kavya", 2, 95],
          [4, "Nikhil", 2, 95],
          [5, "Riya", 2, 40],
          [6, "Tanvi", 3, 60],
          [7, "Zara", null, 150],
          [8, "Vivaan", 3, 55],
        ],
      },
    ],
    gen: (rng) => {
      const t = ri(rng, 1, 5);
      const teams = sample(rng, TEAMS, t).map((name, i) => [i + 1, name]);
      const n = chance(rng, 0.08) ? 0 : ri(rng, 1, 20);
      const who = names(rng, n);
      const players: Cell[][] = who.map((name, i) => [i + 1, name, chance(rng, 0.15) ? null : ri(rng, 1, t), roundTo(rng, 20, 200, 10)]);
      // A tie for a team's top price, now and then.
      const sold = players.filter((p) => p[2] !== null);
      if (sold.length && n > 1 && chance(rng, 0.5)) {
        const a = pick(rng, sold);
        const top = Math.max(...players.filter((p) => p[2] === a[2]).map((p) => p[3] as number));
        const b = pick(rng, players.filter((p) => p !== a));
        b[2] = a[2]!;
        b[3] = top;
      }
      return { Team: teams, Player: players };
    },
    solution: [
      "SELECT t.team_name AS team, p.player_name AS player, p.price AS price",
      "FROM Player p",
      "JOIN Team t ON t.team_id = p.team_id",
      "WHERE (p.team_id, p.price) IN (SELECT team_id, MAX(price) FROM Player GROUP BY team_id)",
    ].join("\n"),
    alternatives: [
      [
        "WITH ranked AS (",
        "  SELECT team_id, player_name, price, RANK() OVER (PARTITION BY team_id ORDER BY price DESC) AS rk FROM Player",
        ")",
        "SELECT t.team_name AS team, r.player_name AS player, r.price AS price",
        "FROM ranked r JOIN Team t ON t.team_id = r.team_id",
        "WHERE r.rk = 1",
      ].join("\n"),
      "SELECT t.team_name AS team, p.player_name AS player, p.price AS price FROM Player p JOIN Team t ON t.team_id = p.team_id WHERE p.price = (SELECT MAX(q.price) FROM Player q WHERE q.team_id = p.team_id)",
      "SELECT t.team_name AS team, p.player_name AS player, p.price AS price FROM Player p JOIN (SELECT team_id, MAX(price) AS top FROM Player GROUP BY team_id) m ON m.team_id = p.team_id AND m.top = p.price JOIN Team t ON t.team_id = p.team_id",
    ],
    hints: [
      "First find one number per team: its highest price.",
      "Then keep every player whose (team, price) pair equals one of those maxima — that keeps ties automatically.",
      "`ORDER BY price DESC LIMIT 1` cannot work per team, and it would drop ties anyway.",
      "Join `Team` for the name; unsold players have no team and should fall out of that join.",
    ],
    editorial: [
      "\"The top row per group, ties included\" is answered in two steps. First compute the maximum price of each team with `GROUP BY team_id`. Then go back to `Player` and keep the rows whose team and price match one of those maxima. Comparing against the value — not picking a single row — is what keeps every player tied at the top.",
      "",
      "The reference query does the matching with a row-value `IN`: `(p.team_id, p.price) IN (SELECT team_id, MAX(price) …)`. The grouped subquery also produces a group for unsold players (team NULL), but a NULL never equals anything, so that pair matches nobody — and the join to `Team` would drop those players anyway. Teams with no players produce no group and so no row.",
      "",
      "Three other shapes give the same answer. `RANK() OVER (PARTITION BY team_id ORDER BY price DESC)` numbers each team's players with ties sharing rank 1 (`ROW_NUMBER` would wrongly keep one). A correlated subquery compares each player with their own team's maximum. A join to a derived table of maxima is the grouped version written as a join. Each reads `Player` about twice; the window version reads it once and sorts per team.",
    ].join("\n"),
  },

  {
    slug: "otp-verification-rate-of-every-account",
    title: "OTP Verification Rate of Every Account",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "A payments app sends a one-time password whenever someone signs in from a new device. Each request ends either `verified` (the code was typed in time) or `expired`.",
      "",
      "For **every account** in `Account`, return `account_id` and `verify_rate`: the number of its verified requests divided by the number of all its requests, **rounded to 2 decimal places**. An account that has never requested an OTP has a `verify_rate` of **0**. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Account",
        columns: [
          { name: "account_id", type: "int" },
          { name: "signed_up_on", type: "date" },
        ],
        primaryKey: ["account_id"],
        note: "One row per account.",
      },
      {
        name: "OtpRequest",
        columns: [
          { name: "account_id", type: "int" },
          { name: "requested_at", type: "datetime" },
          { name: "result", type: "enum", values: ["verified", "expired"] },
        ],
        primaryKey: ["account_id", "requested_at"],
        note: "One row per OTP sent. Every `account_id` here is in `Account`.",
      },
    ],
    examples: [
      {
        Account: [
          [1, "2025-01-02"],
          [2, "2025-01-05"],
          [3, "2025-01-07"],
          [4, "2025-01-10"],
        ],
        OtpRequest: [
          [1, "2025-01-02 09:15:00", "verified"],
          [1, "2025-01-03 18:40:12", "expired"],
          [1, "2025-01-04 08:01:55", "verified"],
          [3, "2025-01-08 12:00:00", "expired"],
          [3, "2025-01-08 12:03:30", "expired"],
          [4, "2025-01-11 21:10:05", "verified"],
          [4, "2025-01-12 07:45:00", "verified"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const accounts: Cell[][] = [];
      const requests: Cell[][] = [];
      for (const id of sample(rng, seq(1, 20), n)) {
        const joined = dateBetween(rng, "2025-01-01", "2025-01-31");
        accounts.push([id, joined]);
        if (chance(rng, 0.25)) continue; // never asked for an OTP
        const p = pick(rng, [0, 0.3, 0.5, 0.7, 1]);
        const times = new Set<string>();
        const k = ri(rng, 1, 7);
        while (times.size < k) times.add(atTime(rng, addDays(joined, ri(rng, 0, 10))));
        for (const at of times) requests.push([id, at, chance(rng, p) ? "verified" : "expired"]);
      }
      return { Account: accounts, OtpRequest: requests };
    },
    solution: [
      "SELECT a.account_id,",
      "       ROUND(AVG(IF(o.result = 'verified', 1, 0)), 2) AS verify_rate",
      "FROM Account a",
      "LEFT JOIN OtpRequest o ON o.account_id = a.account_id",
      "GROUP BY a.account_id",
    ].join("\n"),
    alternatives: [
      "SELECT a.account_id, IFNULL(ROUND(SUM(CASE WHEN o.result = 'verified' THEN 1 ELSE 0 END) / COUNT(o.account_id), 2), 0) AS verify_rate FROM Account a LEFT JOIN OtpRequest o ON o.account_id = a.account_id GROUP BY a.account_id",
      "SELECT a.account_id, ROUND(IFNULL((SELECT AVG(o.result = 'verified') FROM OtpRequest o WHERE o.account_id = a.account_id), 0), 2) AS verify_rate FROM Account a",
    ],
    hints: [
      "Accounts with no requests must still appear — which join keeps them?",
      "A ratio of \"how many rows satisfy a condition\" is the average of a 1-or-0 flag.",
      "Check what your expression gives for an account with no requests: a division by zero or an average over nothing is NULL, and the answer wants 0.",
    ],
    editorial: [
      "Every account must appear, including those that never requested a code, so the query starts from `Account` and **LEFT JOINs** the requests. Grouping by account then gives one group per account: its requests, or a single row of NULLs if there were none.",
      "",
      "The rate is the share of requests that were verified, and a share is the average of a flag: `IF(result = 'verified', 1, 0)` is 1 for a verified request and 0 otherwise, so its average is verified ÷ total. The flag also settles the empty case neatly — for an account with no requests the one padded row has `result` NULL, the IF yields 0, and the average is 0, exactly what the statement asks for.",
      "",
      "Counting explicitly works too: the verified count divided by `COUNT(o.account_id)`, the number of real requests. For an account with none that is 0 ÷ 0, which SQL answers with NULL rather than an error, so the expression needs `IFNULL(…, 0)`. An aggregate that skips NULLs, such as `AVG(o.result = 'verified')`, has the same gap: over a group holding only the padded row it averages nothing and returns NULL. A correlated subquery per account computes the same average and needs the same `IFNULL`.",
      "",
      "Round only the final ratio. Both forms read each request once, so the cost is one pass over `OtpRequest` plus the grouping.",
    ].join("\n"),
  },

  {
    slug: "mock-test-sittings-for-every-learner-and-track",
    title: "Mock Test Sittings for Every Learner and Track",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation"],
    description: [
      "A placement-prep centre runs mock tests in a few tracks (Aptitude, DSA, SQL, …). A learner may sit a track's mock test any number of times, or never.",
      "",
      "Return one row for **every pair** of a learner and a track — pairs without any sitting included — with the columns `learner_id`, `learner_name`, `track` and `sittings` (how many times that learner sat that track's test, **0** if never). Order the rows by `learner_id`, then by `track`.",
    ].join("\n"),
    tables: [
      {
        name: "Learner",
        columns: [
          { name: "learner_id", type: "int" },
          { name: "learner_name", type: "varchar" },
        ],
        primaryKey: ["learner_id"],
        note: "One row per enrolled learner.",
      },
      {
        name: "Track",
        columns: [{ name: "track", type: "varchar" }],
        primaryKey: ["track"],
        note: "One row per mock-test track.",
      },
      {
        name: "MockSitting",
        columns: [
          { name: "sitting_id", type: "int" },
          { name: "learner_id", type: "int" },
          { name: "track", type: "varchar" },
          { name: "sat_on", type: "date" },
        ],
        primaryKey: ["sitting_id"],
        note: "One row per test taken. Every `learner_id` and `track` here exists in its own table.",
      },
    ],
    examples: [
      {
        Learner: [
          [1, "Ananya"],
          [2, "Kabir"],
          [3, "Saanvi"],
        ],
        Track: [["Aptitude"], ["DSA"], ["SQL"]],
        MockSitting: [
          [1, 1, "DSA", "2025-03-01"],
          [2, 1, "Aptitude", "2025-03-02"],
          [3, 1, "DSA", "2025-03-05"],
          [4, 3, "SQL", "2025-03-03"],
          [5, 1, "DSA", "2025-03-08"],
          [6, 3, "Aptitude", "2025-03-09"],
        ],
      },
    ],
    ordered: true,
    gen: (rng) => {
      const n = chance(rng, 0.06) ? 0 : ri(rng, 1, 6);
      const ids = sample(rng, seq(1, 20), n);
      const who = names(rng, n);
      const learners = ids.map((id, i) => [id, who[i]!]);
      const tracks = chance(rng, 0.06) ? [] : sample(rng, TRACKS, ri(rng, 1, 5));
      const m = n && tracks.length ? ri(rng, 0, 15) : 0;
      const sittings = seq(1, m).map((id) => [id, pick(rng, ids), pick(rng, tracks), dateBetween(rng, "2025-03-01", "2025-03-31")]);
      return { Learner: learners, Track: tracks.map((t) => [t]), MockSitting: sittings };
    },
    solution: [
      "SELECT l.learner_id, l.learner_name, t.track, COUNT(m.sitting_id) AS sittings",
      "FROM Learner l",
      "CROSS JOIN Track t",
      "LEFT JOIN MockSitting m ON m.learner_id = l.learner_id AND m.track = t.track",
      "GROUP BY l.learner_id, l.learner_name, t.track",
      "ORDER BY l.learner_id, t.track",
    ].join("\n"),
    alternatives: [
      [
        "SELECT l.learner_id, l.learner_name, t.track,",
        "  (SELECT COUNT(*) FROM MockSitting m WHERE m.learner_id = l.learner_id AND m.track = t.track) AS sittings",
        "FROM Learner l CROSS JOIN Track t",
        "ORDER BY l.learner_id, t.track",
      ].join("\n"),
      [
        "WITH counts AS (SELECT learner_id, track, COUNT(*) AS n FROM MockSitting GROUP BY learner_id, track)",
        "SELECT l.learner_id, l.learner_name, t.track, COALESCE(c.n, 0) AS sittings",
        "FROM Learner l CROSS JOIN Track t",
        "LEFT JOIN counts c ON c.learner_id = l.learner_id AND c.track = t.track",
        "ORDER BY l.learner_id, t.track",
      ].join("\n"),
    ],
    hints: [
      "The rows of the answer are all learner–track pairs, whether or not anything happened. Which join produces every pair?",
      "Attach the sittings to each pair with a LEFT JOIN on both the learner and the track.",
      "`COUNT(*)` counts the padded row of a pair with no sittings as 1 — count a column of `MockSitting` instead.",
    ],
    editorial: [
      "The answer's rows are not taken from the sittings — they are every combination of a learner and a track, including combinations that never happened. Combinations are what a **CROSS JOIN** produces: with 3 learners and 3 tracks it yields 9 pairs, which is exactly the grid the answer needs.",
      "",
      "Each pair then needs its count. A **LEFT JOIN** to `MockSitting` on both `learner_id` and `track` attaches every matching sitting — several rows for a pair taken repeatedly, and one row of NULLs for a pair never taken. Grouping by the pair and counting `m.sitting_id` gives the number of sittings: `COUNT` of a column skips NULLs, so an untouched pair counts 0, whereas `COUNT(*)` would count its padded row as 1.",
      "",
      "Both join conditions belong in `ON`. Putting `m.track = t.track` in `WHERE` instead would throw away the NULL-padded rows and with them every zero.",
      "",
      "Alternatives: a correlated `COUNT(*)` per pair (no padding involved, so `*` is right there), or counting the sittings once in a CTE and LEFT JOINing those counts to the grid with `COALESCE(n, 0)`. The grid has learners × tracks rows, so that product bounds the cost; the counting itself is one pass over the sittings.",
    ].join("\n"),
  },

  {
    slug: "daily-cancellation-rate-without-suspended-members",
    title: "Daily Cancellation Rate Without Suspended Members",
    difficulty: "HARD",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "A food-delivery app records each order with the customer who placed it and the delivery partner assigned to it. An order can end `delivered` or be cancelled by the customer, the partner or the restaurant. Some members have been **suspended** for fraud, and their orders must be left out of the figures.",
      "",
      "For each day from **2025-03-01 to 2025-03-07** (both included), compute the cancellation rate: the number of cancelled orders (every status other than `delivered`) divided by the number of orders, counting only orders whose customer is **not suspended** and whose partner is **not suspended**. An order cancelled before any partner was assigned has `partner_id` NULL — it **still counts**, as long as its customer is not suspended. Round the rate to 2 decimal places.",
      "",
      "Return the columns `order_day` and `cancellation_rate`, one row per day with at least one counted order, ordered by `order_day`.",
    ].join("\n"),
    tables: [
      {
        name: "FoodOrder",
        columns: [
          { name: "order_id", type: "int" },
          { name: "customer_id", type: "int" },
          { name: "partner_id", type: "int" },
          { name: "status", type: "enum", values: ["delivered", "cancelled_by_customer", "cancelled_by_partner", "cancelled_by_restaurant"] },
          { name: "order_date", type: "date" },
        ],
        primaryKey: ["order_id"],
        note: "`customer_id` and `partner_id` are `member_id`s in `Member`. `partner_id` is NULL when the order was cancelled before a partner was assigned.",
      },
      {
        name: "Member",
        columns: [
          { name: "member_id", type: "int" },
          { name: "role", type: "enum", values: ["customer", "partner"] },
          { name: "suspended", type: "bool" },
        ],
        primaryKey: ["member_id"],
        note: "`suspended` is 1 for a suspended member and 0 otherwise.",
      },
    ],
    examples: [
      {
        FoodOrder: [
          [1, 1, 10, "delivered", "2025-03-01"],
          [2, 3, 12, "cancelled_by_partner", "2025-03-01"],
          [3, 2, 10, "cancelled_by_customer", "2025-03-01"],
          [4, 1, 11, "delivered", "2025-03-02"],
          [5, 3, null, "cancelled_by_customer", "2025-03-02"],
          [6, 1, 12, "delivered", "2025-03-02"],
          [7, 3, 10, "delivered", "2025-03-02"],
          [8, 2, null, "cancelled_by_restaurant", "2025-03-03"],
          [9, 1, 10, "cancelled_by_restaurant", "2025-03-07"],
          [10, 3, 12, "delivered", "2025-02-28"],
        ],
        Member: [
          [1, "customer", 0],
          [2, "customer", 1],
          [3, "customer", 0],
          [10, "partner", 0],
          [11, "partner", 1],
          [12, "partner", 0],
        ],
      },
    ],
    ordered: true,
    gen: (rng) => {
      const customers = seq(1, ri(rng, 1, 6));
      const partners = seq(101, ri(rng, 1, 5));
      const members: Cell[][] = [
        ...customers.map((id) => [id, "customer", chance(rng, 0.25) ? 1 : 0]),
        ...partners.map((id) => [id, "partner", chance(rng, 0.25) ? 1 : 0]),
      ];
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      const orders = seq(1, m).map((id) => {
        const status = pick(rng, ORDER_STATUS);
        const unassigned = status !== "delivered" && status !== "cancelled_by_partner" && chance(rng, 0.4);
        return [id, pick(rng, customers), unassigned ? null : pick(rng, partners), status, dateBetween(rng, "2025-02-27", "2025-03-09")];
      });
      return { FoodOrder: orders, Member: members };
    },
    solution: [
      "SELECT o.order_date AS order_day,",
      "       ROUND(SUM(CASE WHEN o.status = 'delivered' THEN 0 ELSE 1 END) / COUNT(*), 2) AS cancellation_rate",
      "FROM FoodOrder o",
      "JOIN Member c ON c.member_id = o.customer_id AND c.suspended = 0",
      "LEFT JOIN Member p ON p.member_id = o.partner_id",
      "WHERE o.order_date BETWEEN '2025-03-01' AND '2025-03-07'",
      "  AND (o.partner_id IS NULL OR p.suspended = 0)",
      "GROUP BY o.order_date",
      "ORDER BY o.order_date",
    ].join("\n"),
    alternatives: [
      [
        "SELECT order_date AS order_day, ROUND(AVG(status <> 'delivered'), 2) AS cancellation_rate",
        "FROM FoodOrder o",
        "WHERE order_date BETWEEN '2025-03-01' AND '2025-03-07'",
        "  AND NOT EXISTS (SELECT 1 FROM Member m WHERE m.suspended = 1 AND m.member_id IN (o.customer_id, o.partner_id))",
        "GROUP BY order_date",
        "ORDER BY order_day",
      ].join("\n"),
      [
        "WITH banned AS (SELECT member_id FROM Member WHERE suspended = 1)",
        "SELECT order_date AS order_day, ROUND(AVG(IF(status = 'delivered', 0, 1)), 2) AS cancellation_rate",
        "FROM FoodOrder",
        "WHERE order_date >= '2025-03-01' AND order_date <= '2025-03-07'",
        "  AND customer_id NOT IN (SELECT member_id FROM banned)",
        "  AND (partner_id IS NULL OR partner_id NOT IN (SELECT member_id FROM banned))",
        "GROUP BY order_date",
        "ORDER BY order_date",
      ].join("\n"),
    ],
    hints: [
      "Filter first, then aggregate: decide which orders count, and only then group them by day.",
      "Each order involves two members, so `Member` is needed twice — once for the customer, once for the partner.",
      "An inner join on `partner_id` silently drops every order with no partner. Which join keeps them, and what condition then lets them through?",
      "The rate is the average of a 1-for-cancelled, 0-for-delivered flag.",
      "Check `partner_id NOT IN (…)` with a NULL `partner_id`: the result is not true.",
    ],
    editorial: [
      "The work is in choosing the orders; the arithmetic is one grouped average. An order counts when it falls inside the week, its customer is not suspended, and its partner — if it has one — is not suspended either.",
      "",
      "Each order refers to two members, so the reference query joins `Member` twice under two aliases. The customer side is an inner join with `c.suspended = 0` in its condition: every order has a customer, and orders of suspended customers drop out. The partner side must be a **LEFT JOIN**, because an inner join on `partner_id` would silently discard every order cancelled before assignment — exactly the orders the statement says still count. The `WHERE` clause then admits an order if it has no partner or its partner is not suspended.",
      "",
      "With the right orders kept, grouping by `order_date` and averaging a 1-or-0 cancellation flag gives cancelled ÷ total for each day; days with no counted order produce no group and so no row.",
      "",
      "The first alternative asks the question per order with `NOT EXISTS`: no suspended member whose id is the customer's or the partner's. `IN (customer_id, NULL)` is never true through the NULL, so unassigned orders pass. The second uses `NOT IN` against a list of suspended ids, which needs the explicit `partner_id IS NULL OR …` — `NULL NOT IN (…)` is unknown and would drop the order. Each version is a single pass over the orders with key lookups into `Member`.",
    ].join("\n"),
  },
];
