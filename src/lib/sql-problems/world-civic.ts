import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, chance, dateBetween, FIRST_NAMES, LAST_NAMES, names, pick, ri, roundTo, sample, shuffle } from "./kit.js";

/**
 * Public services, libraries, NGOs and event ticketing: a city library's loans,
 * overdue fines and reservation queues; a municipal grievance desk and how fast
 * each department resolves complaints; polling booths and counted votes; an
 * NGO's donors, 80G receipts and recurring givers; and concert ticketing with
 * seat maps, sell-through and resale. Easiest first — filters and single
 * GROUP BYs, then joins with HAVING, rankings and date bucketing, then streaks,
 * medians, cohorts, running balances, queue positions and overlapping slots.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
/** A full name from the kit's lists. */
const fullName = (rng: () => number): string => `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;

const DEPTS = ["Water Supply", "Roads", "Sanitation", "Electricity", "Street Lighting"] as const;
const GRIEVANCE_STATUS = ["open", "in_progress", "resolved", "rejected"] as const;
const VENUE_CITIES = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Pune", "Kolkata"] as const;
const EVENT_NAMES = [
  "Arijit Live", "Sunburn Arena", "Prateek Kuhad Tour", "Lollapalooza India", "Coke Studio Nights",
  "Zakir Hussain Tribute", "NH7 Weekender", "Diljit Dosanjh Live", "AP Dhillon Tour", "Indian Ocean Unplugged",
  "Comedy Premier League", "Jazz by the Bay",
] as const;
const DOMAINS = ["gmail.com", "yahoo.co.in", "outlook.com", "rediffmail.com", "hotmail.com", "akshayfoundation.org"] as const;
const BRANCHES = ["Central", "Jayanagar", "Malleshwaram", "Indiranagar"] as const;
const PAY_MODES = ["cash", "upi", "cheque", "netbanking"] as const;
const CONSTITUENCIES = ["Shivajinagar", "Hebbal", "Malleshwaram", "Jayanagar", "BTM Layout"] as const;

/** Lower-case e-mail for a name. */
const emailOf = (name: string, i: number, domain: string): string => `${name.toLowerCase()}${i}@${domain}`;

export const WORLD_CIVIC: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "library-loans-overdue-on-audit-day",
    title: "Library Loans Overdue on Audit Day",
    difficulty: "EASY",
    topics: ["Basics", "Dates"],
    description: [
      "The city library runs a stock audit on **2025-03-01** and wants every book that is still out and past its due date on that day.",
      "",
      "A loan is still out when `returned_on` is NULL, and it is overdue when `due_on` is **strictly before** 2025-03-01 (a book due on the audit day itself is not overdue yet). Return `loan_id`, `member_id` and `days_overdue` — the number of days from `due_on` to 2025-03-01 — **ordered by `days_overdue` descending, then `loan_id` ascending**.",
    ].join("\n"),
    tables: [
      {
        name: "book_loans",
        columns: [
          { name: "loan_id", type: "int" },
          { name: "member_id", type: "int" },
          { name: "book_id", type: "int" },
          { name: "issued_on", type: "date" },
          { name: "due_on", type: "date" },
          { name: "returned_on", type: "date" },
        ],
        primaryKey: ["loan_id"],
        note: "One row per book issued. `returned_on` is NULL while the book is still with the member; every return so far happened before the audit day.",
      },
    ],
    examples: [
      {
        book_loans: [
          [1, 11, 501, "2025-01-20", "2025-02-03", "2025-02-01"],
          [2, 12, 502, "2025-01-28", "2025-02-11", null],
          [3, 13, 503, "2025-02-15", "2025-03-01", null],
          [4, 11, 504, "2025-02-01", "2025-02-15", "2025-02-25"],
          [5, 14, 505, "2025-02-08", "2025-02-22", null],
          [6, 15, 506, "2025-02-08", "2025-02-22", null],
          [7, 12, 507, "2025-02-20", "2025-03-06", null],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 16);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const issued = chance(rng, 0.1) ? "2025-02-15" : dateBetween(rng, "2025-01-05", "2025-02-27");
        const due = addDays(issued, 14);
        let ret: string | null = chance(rng, 0.45) ? addDays(issued, ri(rng, 1, 25)) : null;
        if (ret !== null && ret > "2025-02-28") ret = null;
        return [id, ri(rng, 10, 20), ri(rng, 500, 540), issued, due, ret];
      });
      return { book_loans: rows };
    },
    solution: [
      "SELECT loan_id, member_id, DATEDIFF('2025-03-01', due_on) AS days_overdue",
      "FROM book_loans",
      "WHERE returned_on IS NULL AND due_on < '2025-03-01'",
      "ORDER BY days_overdue DESC, loan_id",
    ].join("\n"),
    alternatives: [
      "SELECT loan_id, member_id, TIMESTAMPDIFF(DAY, due_on, '2025-03-01') AS days_overdue FROM book_loans WHERE returned_on IS NULL AND DATEDIFF('2025-03-01', due_on) > 0 ORDER BY 3 DESC, 1",
    ],
    ordered: true,
    hints: [
      "Two conditions decide a row: the book has not come back, and its due date is before the audit day.",
      "`returned_on = NULL` is never true — test a missing value with `IS NULL`.",
      "`DATEDIFF(later, earlier)` gives the whole days between two dates.",
    ],
    editorial: [
      "This is a filter followed by one computed column. A loan is still out exactly when `returned_on IS NULL`; comparing with `= NULL` would be unknown for every row and return nothing, which is the classic mistake here.",
      "",
      "The overdue condition is strict: `due_on < '2025-03-01'`. Because dates are stored in a fixed `YYYY-MM-DD` form, comparing them is comparing the calendar, and a loan due on the audit day itself is excluded. Writing the same test as `DATEDIFF('2025-03-01', due_on) > 0` is equivalent.",
      "",
      "`DATEDIFF('2025-03-01', due_on)` counts the days late; `TIMESTAMPDIFF(DAY, due_on, '2025-03-01')` is the same number with the arguments the other way round. Two loans can be equally late, so the order needs `loan_id` as a tie-breaker to be fully determined. The query is a single scan of the loans table; an index on `(returned_on, due_on)` would let a large library skip returned books.",
    ].join("\n"),
  },

  {
    slug: "civic-grievances-per-department",
    title: "Civic Grievances Filed per Department",
    difficulty: "EASY",
    topics: ["Aggregation"],
    description: [
      "The municipal corporation's grievance portal routes every complaint to one department. Complaints marked `rejected` were found to be duplicates or spam and must **not be counted**.",
      "",
      "Return each department that has at least one counted complaint, with the columns `department` and `complaints` (the number of counted complaints), **ordered by `complaints` descending, then `department` ascending**.",
    ].join("\n"),
    tables: [
      {
        name: "grievances",
        columns: [
          { name: "grievance_id", type: "int" },
          { name: "citizen_name", type: "varchar" },
          { name: "department", type: "enum", values: [...DEPTS] },
          { name: "filed_on", type: "date" },
          { name: "status", type: "enum", values: [...GRIEVANCE_STATUS] },
        ],
        primaryKey: ["grievance_id"],
        note: "One row per complaint filed on the portal.",
      },
    ],
    examples: [
      {
        grievances: [
          [1, "Priya Nair", "Water Supply", "2024-07-01", "resolved"],
          [2, "Rahul Rao", "Roads", "2024-07-02", "open"],
          [3, "Sneha Iyer", "Water Supply", "2024-07-02", "in_progress"],
          [4, "Kabir Khan", "Sanitation", "2024-07-03", "rejected"],
          [5, "Diya Das", "Roads", "2024-07-04", "resolved"],
          [6, "Arjun Mehta", "Electricity", "2024-07-05", "open"],
          [7, "Meera Joshi", "Sanitation", "2024-07-05", "rejected"],
          [8, "Rohan Bose", "Electricity", "2024-07-06", "resolved"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 22);
      const depts = sample(rng, DEPTS, ri(rng, 1, 5));
      return {
        grievances: seq(1, n).map((id) => [
          id, fullName(rng), pick(rng, depts), dateBetween(rng, "2024-06-01", "2024-08-31"),
          chance(rng, 0.25) ? "rejected" : pick(rng, GRIEVANCE_STATUS.slice(0, 3)),
        ]),
      };
    },
    solution: [
      "SELECT department, COUNT(*) AS complaints",
      "FROM grievances",
      "WHERE status <> 'rejected'",
      "GROUP BY department",
      "ORDER BY complaints DESC, department",
    ].join("\n"),
    alternatives: [
      [
        "SELECT department, SUM(CASE WHEN status = 'rejected' THEN 0 ELSE 1 END) AS complaints",
        "FROM grievances GROUP BY department",
        "HAVING SUM(CASE WHEN status = 'rejected' THEN 0 ELSE 1 END) > 0",
        "ORDER BY complaints DESC, department",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Drop the rejected complaints before counting, so they never reach a group.",
      "One group per department: `GROUP BY department` and `COUNT(*)`.",
      "Two departments can have the same count — the order needs a second key.",
    ],
    editorial: [
      "Filtering in `WHERE` happens before grouping, so `WHERE status <> 'rejected'` removes the spam rows and `GROUP BY department` then counts what is left. A department whose every complaint was rejected has no rows left and simply produces no group, which is exactly what \"at least one counted complaint\" asks for.",
      "",
      "The alternative counts conditionally instead: every department forms a group, a `CASE` adds 1 only for non-rejected rows, and `HAVING … > 0` removes the departments that would show a zero. Both read the table once.",
      "",
      "Equal counts are common in small wards, so the order is `complaints DESC` and then the department name, which makes the answer fully determined. `status` is never NULL here; if it could be, `status <> 'rejected'` would drop NULL rows too, and the CASE version would keep them — a difference worth noticing when the column allows NULLs.",
    ].join("\n"),
  },

  {
    slug: "concerts-without-a-single-sold-ticket",
    title: "Concerts Without a Single Sold Ticket",
    difficulty: "EASY",
    topics: ["Joins"],
    description: [
      "A ticketing platform lists upcoming concerts in `events`. A ticket row is created when a seat is booked; if the buyer cancels, the row stays with status `refunded`.",
      "",
      "Return the concerts that have **no ticket with status `sold`** — including concerts whose only tickets were refunded — with the columns `event_id` and `event_name`, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "events",
        columns: [
          { name: "event_id", type: "int" },
          { name: "event_name", type: "varchar" },
          { name: "city", type: "varchar" },
          { name: "event_date", type: "date" },
        ],
        primaryKey: ["event_id"],
        note: "One row per listed concert.",
      },
      {
        name: "tickets",
        columns: [
          { name: "ticket_id", type: "int" },
          { name: "event_id", type: "int" },
          { name: "seat_no", type: "varchar" },
          { name: "price", type: "int" },
          { name: "status", type: "enum", values: ["sold", "refunded"] },
        ],
        primaryKey: ["ticket_id"],
        note: "Every `event_id` here is in `events`. `price` is in rupees.",
      },
    ],
    examples: [
      {
        events: [
          [1, "Arijit Live", "Mumbai", "2025-04-12"],
          [2, "Jazz by the Bay", "Mumbai", "2025-04-19"],
          [3, "NH7 Weekender", "Pune", "2025-05-03"],
          [4, "Coke Studio Nights", "Delhi", "2025-05-10"],
        ],
        tickets: [
          [1, 1, "A12", 2500, "sold"],
          [2, 1, "A13", 2500, "refunded"],
          [3, 2, "C04", 1200, "refunded"],
          [4, 3, "F21", 1800, "sold"],
          [5, 2, "C05", 1200, "refunded"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 9);
      const evs = sample(rng, EVENT_NAMES, n).map((name, i) => [i + 1, name, pick(rng, VENUE_CITIES), dateBetween(rng, "2025-03-01", "2025-08-31")]);
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 18);
      const soldRate = pick(rng, [0.3, 0.6, 0.9]);
      const tix = seq(1, m).map((id) => [id, ri(rng, 1, n), `${pick(rng, ["A", "B", "C", "F"])}${ri(rng, 1, 40)}`, roundTo(rng, 500, 4000, 100), chance(rng, soldRate) ? "sold" : "refunded"]);
      return { events: evs, tickets: tix };
    },
    solution: [
      "SELECT e.event_id, e.event_name",
      "FROM events e",
      "LEFT JOIN tickets t ON t.event_id = e.event_id AND t.status = 'sold'",
      "WHERE t.ticket_id IS NULL",
    ].join("\n"),
    alternatives: [
      "SELECT event_id, event_name FROM events e WHERE NOT EXISTS (SELECT 1 FROM tickets t WHERE t.event_id = e.event_id AND t.status = 'sold')",
      "SELECT event_id, event_name FROM events WHERE event_id NOT IN (SELECT event_id FROM tickets WHERE status = 'sold')",
    ],
    hints: [
      "Start from `events`, since a concert with no tickets at all must still be in the answer.",
      "A LEFT JOIN keeps an event even when nothing matches. Where should the `status = 'sold'` condition go so refunded tickets count as no match?",
      "A condition on the right table in `WHERE` turns a LEFT JOIN back into an inner join.",
    ],
    editorial: [
      "This is an anti join with a twist: only *sold* tickets count as a partner. The LEFT JOIN puts `t.status = 'sold'` in the `ON` clause, so a refunded ticket simply fails to match and the event survives with NULLs on the ticket side; `WHERE t.ticket_id IS NULL` then keeps exactly the events with no sold ticket.",
      "",
      "Putting the status test in `WHERE` instead is the trap. After the join, an event whose only tickets were refunded has rows with `status = 'refunded'`, and `WHERE t.status = 'sold' AND t.ticket_id IS NULL` can never hold — the event disappears, and so does every other one.",
      "",
      "`NOT EXISTS` expresses the same idea without the ON/WHERE subtlety, and `NOT IN` is safe here because `tickets.event_id` is never NULL. With an index on `tickets(event_id, status)` every form is one probe per event.",
    ].join("\n"),
  },

  {
    slug: "ngo-donors-by-email-domain",
    title: "NGO Donors Grouped by Email Domain",
    difficulty: "EASY",
    topics: ["Strings", "Aggregation"],
    description: [
      "An NGO's fundraising team wants to know which mail providers its donors use before choosing a newsletter service. Every stored email is lower-case; some donors gave no email (NULL).",
      "",
      "Return each domain — the part of the email **after the `@`** — in a column `email_domain`, with `donors`, the number of donors using it. Ignore donors without an email. Order by **`donors` descending, then `email_domain` ascending**.",
    ].join("\n"),
    tables: [
      {
        name: "donors",
        columns: [
          { name: "donor_id", type: "int" },
          { name: "full_name", type: "varchar" },
          { name: "email", type: "varchar" },
          { name: "city", type: "varchar" },
        ],
        primaryKey: ["donor_id"],
        note: "One row per donor. `email` has exactly one `@`, or is NULL.",
      },
    ],
    examples: [
      {
        donors: [
          [1, "Ananya Rao", "ananya.rao@gmail.com", "Bengaluru"],
          [2, "Vikram Singh", "vikram_s@yahoo.co.in", "Delhi"],
          [3, "Neha Gupta", "neha91@gmail.com", "Pune"],
          [4, "Farhan Khan", null, "Mumbai"],
          [5, "Pooja Menon", "pooja@akshayfoundation.org", "Kochi"],
          [6, "Dev Patel", "devp@yahoo.co.in", "Ahmedabad"],
          [7, "Ira Bose", "ira.bose@outlook.com", "Kolkata"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 20);
      const doms = sample(rng, DOMAINS, ri(rng, 1, 5));
      return {
        donors: seq(1, n).map((id) => {
          const first = pick(rng, FIRST_NAMES);
          return [id, `${first} ${pick(rng, LAST_NAMES)}`, chance(rng, 0.15) ? null : emailOf(first, id, pick(rng, doms)), pick(rng, VENUE_CITIES)];
        }),
      };
    },
    solution: [
      "SELECT SUBSTRING_INDEX(email, '@', -1) AS email_domain, COUNT(*) AS donors",
      "FROM donors",
      "WHERE email IS NOT NULL",
      "GROUP BY SUBSTRING_INDEX(email, '@', -1)",
      "ORDER BY donors DESC, email_domain",
    ].join("\n"),
    alternatives: [
      "SELECT SUBSTRING(email, LOCATE('@', email) + 1) AS email_domain, COUNT(email) AS donors FROM donors GROUP BY SUBSTRING(email, LOCATE('@', email) + 1) HAVING COUNT(email) > 0 ORDER BY donors DESC, email_domain",
      "SELECT email_domain, COUNT(*) AS donors FROM (SELECT RIGHT(email, CHAR_LENGTH(email) - INSTR(email, '@')) AS email_domain FROM donors WHERE email IS NOT NULL) d GROUP BY email_domain ORDER BY donors DESC, email_domain",
    ],
    ordered: true,
    hints: [
      "Find the position of `@`, or ask for the piece after the last `@` directly.",
      "`SUBSTRING_INDEX(s, '@', -1)` returns everything after the last `@`.",
      "Group by the extracted domain, not by the whole email.",
    ],
    editorial: [
      "The grouping key is not a column but an expression: the domain cut out of the email. `SUBSTRING_INDEX(email, '@', -1)` keeps everything to the right of the last `@`; with exactly one `@` per address that is the domain. The same piece can be had with `SUBSTRING(email, LOCATE('@', email) + 1)` or `RIGHT(email, CHAR_LENGTH(email) - INSTR(email, '@'))`.",
      "",
      "Donors without an email must not form a NULL group. Filtering `WHERE email IS NOT NULL` drops them; the second alternative instead lets the NULL group form, counts `COUNT(email)` (which ignores NULLs, giving 0) and removes it with `HAVING`.",
      "",
      "Emails are stored lower-case, so `gmail.com` never appears under two spellings — if they were not, you would wrap the expression in `LOWER()`. Ties between domains are broken by the domain name. The whole query is one scan plus a group by on short strings.",
    ].join("\n"),
  },

  {
    slug: "polling-booth-turnout-bands",
    title: "Polling Booth Turnout Bands",
    difficulty: "EASY",
    topics: ["Conditional Logic", "Basics"],
    description: [
      "After polling day the election office reviews turnout booth by booth. Turnout is `votes_cast * 100 / registered_voters`. A booth with `registered_voters` = 0 is a newly created booth whose roll is not loaded yet.",
      "",
      "Return every booth with `booth_id`, `turnout_pct` (turnout **rounded to one decimal**) and `turnout_band`: `'High'` when the unrounded turnout is at least 70, `'Moderate'` when it is at least 50, otherwise `'Low'`. For a booth with no roll, `turnout_pct` is NULL and the band is `'No Roll'`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "booths",
        columns: [
          { name: "booth_id", type: "int" },
          { name: "constituency", type: "varchar" },
          { name: "registered_voters", type: "int" },
          { name: "votes_cast", type: "int" },
        ],
        primaryKey: ["booth_id"],
        note: "One row per polling booth; `votes_cast` never exceeds `registered_voters`.",
      },
    ],
    examples: [
      {
        booths: [
          [101, "Hebbal", 1000, 700],
          [102, "Hebbal", 863, 512],
          [103, "Jayanagar", 200, 99],
          [104, "Jayanagar", 0, 0],
          [105, "Shivajinagar", 941, 466],
          [106, "Shivajinagar", 500, 250],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      return {
        booths: seq(101, n).map((id) => {
          if (chance(rng, 0.08)) return [id, pick(rng, CONSTITUENCIES), 0, 0];
          let reg: number;
          if (chance(rng, 0.3)) reg = pick(rng, [200, 500, 1000]);
          else {
            reg = ri(rng, 300, 1400);
            while (reg % 2 === 0 || reg % 5 === 0) reg++;
          }
          // Now and then a turnout exactly on a band's boundary.
          const v = reg % 10 === 0 && chance(rng, 0.4) ? (reg * pick(rng, [50, 70])) / 100 : ri(rng, Math.floor(reg * 0.3), Math.floor(reg * 0.9));
          return [id, pick(rng, CONSTITUENCIES), reg, v];
        }),
      };
    },
    solution: [
      "SELECT booth_id,",
      "       ROUND(votes_cast * 100 / NULLIF(registered_voters, 0), 1) AS turnout_pct,",
      "       CASE",
      "         WHEN registered_voters = 0 THEN 'No Roll'",
      "         WHEN votes_cast * 100 >= 70 * registered_voters THEN 'High'",
      "         WHEN votes_cast * 100 >= 50 * registered_voters THEN 'Moderate'",
      "         ELSE 'Low'",
      "       END AS turnout_band",
      "FROM booths",
    ].join("\n"),
    alternatives: [
      [
        "SELECT booth_id,",
        "       IF(registered_voters = 0, NULL, ROUND(votes_cast * 100 / registered_voters, 1)) AS turnout_pct,",
        "       IF(registered_voters = 0, 'No Roll', IF(votes_cast / registered_voters >= 0.7, 'High', IF(votes_cast / registered_voters >= 0.5, 'Moderate', 'Low'))) AS turnout_band",
        "FROM booths",
      ].join("\n"),
    ],
    hints: [
      "Division by zero has to be kept away from the roll-less booths — `NULLIF(x, 0)` turns a zero into NULL.",
      "A `CASE` checks its branches top to bottom; put the no-roll case first.",
      "Compare the unrounded turnout with the thresholds; multiplying both sides avoids decimals altogether.",
    ],
    editorial: [
      "Each booth needs a computed number and a label, which is a `CASE` expression over the same ratio. The first branch handles the booth without a roll, because any ratio there would divide by zero. For the number, `NULLIF(registered_voters, 0)` makes the divisor NULL for such a booth, so the whole expression is NULL instead of an error (MySQL returns NULL for division by zero anyway, but saying it explicitly keeps the intent clear and portable).",
      "",
      "The thresholds apply to the unrounded turnout, and branches are tried in order, so `>= 70` must come before `>= 50`. Writing the test as `votes_cast * 100 >= 70 * registered_voters` compares integers and avoids any decimal-precision doubt at exactly 70% — booth 101 (700 of 1000) is `High`, booth 106 (250 of 500) is `Moderate`.",
      "",
      "The nested `IF` version is the same logic in MySQL's shorthand. One scan of the table, no grouping.",
    ].join("\n"),
  },

  {
    slug: "box-office-revenue-per-show",
    title: "Box Office Revenue per Show",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "A box office records every booking of a show. A booking holds several seats and the amount paid for all of them; a `cancelled` booking was refunded in full.",
      "",
      "For each show with at least one `confirmed` booking, return `show_id`, `show_name`, `seats_sold` (total seats over its confirmed bookings) and `revenue` (total `amount_paid` over them). Cancelled bookings count for nothing. Order by **`revenue` descending, then `show_id` ascending**.",
    ].join("\n"),
    tables: [
      {
        name: "Performance",
        columns: [
          { name: "show_id", type: "int" },
          { name: "show_name", type: "varchar" },
          { name: "venue", type: "varchar" },
        ],
        primaryKey: ["show_id"],
        note: "One row per show on sale. Two shows can share a name (the same act on two nights).",
      },
      {
        name: "Booking",
        columns: [
          { name: "booking_id", type: "int" },
          { name: "show_id", type: "int" },
          { name: "seats", type: "int" },
          { name: "amount_paid", type: "int" },
          { name: "booking_status", type: "enum", values: ["confirmed", "cancelled"] },
        ],
        primaryKey: ["booking_id"],
        note: "`amount_paid` is in rupees for all the booking's seats. Every `show_id` is in `Performance`.",
      },
    ],
    examples: [
      {
        Performance: [
          [1, "Comedy Premier League", "Bengaluru"],
          [2, "Indian Ocean Unplugged", "Pune"],
          [3, "Comedy Premier League", "Bengaluru"],
          [4, "Jazz by the Bay", "Mumbai"],
        ],
        Booking: [
          [1, 1, 2, 1600, "confirmed"],
          [2, 1, 4, 3200, "confirmed"],
          [3, 2, 3, 4500, "confirmed"],
          [4, 3, 6, 4800, "cancelled"],
          [5, 3, 2, 1600, "confirmed"],
          [6, 2, 2, 3000, "cancelled"],
          [7, 4, 1, 1600, "confirmed"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 7);
      const shows = seq(1, n).map((id) => [id, pick(rng, EVENT_NAMES.slice(0, 5)), pick(rng, VENUE_CITIES)]);
      const prices = shows.map(() => roundTo(rng, 400, 2000, 200));
      const m = chance(rng, 0.08) ? 0 : ri(rng, 1, 20);
      const rows = seq(1, m).map((id) => {
        const s = ri(rng, 1, n);
        const seats = ri(rng, 1, 6);
        return [id, s, seats, seats * prices[s - 1]!, chance(rng, 0.25) ? "cancelled" : "confirmed"];
      });
      return { Performance: shows, Booking: rows };
    },
    solution: [
      "SELECT s.show_id, s.show_name, SUM(b.seats) AS seats_sold, SUM(b.amount_paid) AS revenue",
      "FROM Performance s",
      "JOIN Booking b ON b.show_id = s.show_id",
      "WHERE b.booking_status = 'confirmed'",
      "GROUP BY s.show_id, s.show_name",
      "ORDER BY revenue DESC, s.show_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT s.show_id, s.show_name, t.seats_sold, t.revenue",
        "FROM (SELECT show_id, SUM(seats) AS seats_sold, SUM(amount_paid) AS revenue FROM Booking WHERE booking_status = 'confirmed' GROUP BY show_id) t",
        "JOIN Performance s ON s.show_id = t.show_id",
        "ORDER BY t.revenue DESC, s.show_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Only confirmed bookings matter — filter them before adding anything up.",
      "Group by the show's id, not its name: two nights of the same act are two shows.",
      "Revenue can tie; the order has a second key.",
    ],
    editorial: [
      "Join each booking to its show, keep the confirmed ones, and sum per show. Because the join is an inner join and the filter removes cancelled bookings, a show with nothing confirmed has no rows left and drops out, as the statement requires.",
      "",
      "Grouping by `show_name` alone would be wrong: in the example the comedy act plays shows 1 and 3, and their revenue must stay separate. Grouping by `show_id, show_name` keeps them apart and still allows the name in the select list under ONLY_FULL_GROUP_BY (the name is determined by the id anyway).",
      "",
      "The alternative aggregates `Booking` first in a derived table and joins the small result to `Performance`. On a large bookings table that is often cheaper, because the join then touches one row per show instead of one per booking. Revenue ties are broken by `show_id`.",
    ].join("\n"),
  },

  {
    slug: "library-cards-expiring-in-march-2025",
    title: "Library Cards Expiring in March 2025",
    difficulty: "EASY",
    topics: ["Strings", "Dates"],
    description: [
      "The library mails a renewal reminder to every member whose card expires during **March 2025**. Members store their first and last names separately; some members gave no last name (NULL).",
      "",
      "Return `member_id`, `member_name` — the first name, a single space and the last name, or **just the first name** when the last name is NULL — and `card_expires_on`, **ordered by `card_expires_on`, then `member_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "library_members",
        columns: [
          { name: "member_id", type: "int" },
          { name: "first_name", type: "varchar" },
          { name: "last_name", type: "varchar" },
          { name: "branch", type: "varchar" },
          { name: "card_expires_on", type: "date" },
        ],
        primaryKey: ["member_id"],
        note: "One row per card holder.",
      },
    ],
    examples: [
      {
        library_members: [
          [1, "Kavya", "Iyer", "Jayanagar", "2025-03-14"],
          [2, "Harsh", null, "Central", "2025-03-01"],
          [3, "Tanvi", "Reddy", "Central", "2025-02-28"],
          [4, "Nikhil", "Verma", "Malleshwaram", "2025-03-31"],
          [5, "Zara", "Khan", "Indiranagar", "2025-04-01"],
          [6, "Ishaan", "Das", "Jayanagar", "2025-03-14"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 15);
      return {
        library_members: seq(1, n).map((id) => [
          id, pick(rng, FIRST_NAMES), chance(rng, 0.2) ? null : pick(rng, LAST_NAMES), pick(rng, BRANCHES),
          chance(rng, 0.2) ? pick(rng, ["2025-02-28", "2025-03-01", "2025-03-31", "2025-04-01"]) : dateBetween(rng, "2025-02-01", "2025-04-30"),
        ]),
      };
    },
    solution: [
      "SELECT member_id, CONCAT_WS(' ', first_name, last_name) AS member_name, card_expires_on",
      "FROM library_members",
      "WHERE card_expires_on BETWEEN '2025-03-01' AND '2025-03-31'",
      "ORDER BY card_expires_on, member_id",
    ].join("\n"),
    alternatives: [
      "SELECT member_id, IF(last_name IS NULL, first_name, CONCAT(first_name, ' ', last_name)) AS member_name, card_expires_on FROM library_members WHERE YEAR(card_expires_on) = 2025 AND MONTH(card_expires_on) = 3 ORDER BY card_expires_on, member_id",
      "SELECT member_id, TRIM(CONCAT(first_name, ' ', COALESCE(last_name, ''))) AS member_name, card_expires_on FROM library_members WHERE DATE_FORMAT(card_expires_on, '%Y-%m') = '2025-03' ORDER BY card_expires_on, member_id",
    ],
    ordered: true,
    hints: [
      "March 2025 runs from the 1st to the 31st — both ends included.",
      "`CONCAT` returns NULL as soon as one argument is NULL. Which function skips NULL arguments instead?",
      "`CONCAT_WS(separator, …)` puts the separator only between the non-NULL values.",
    ],
    editorial: [
      "Two small ideas meet here. The date filter is a closed range: `BETWEEN '2025-03-01' AND '2025-03-31'` includes both ends, which is right for a month — the 1st and the 31st both count, and 28 February and 1 April do not. `YEAR(...) = 2025 AND MONTH(...) = 3` or `DATE_FORMAT(..., '%Y-%m') = '2025-03'` say the same, though the range form can use an index on the date column and the function forms cannot.",
      "",
      "The name is the trap. `CONCAT(first_name, ' ', last_name)` is NULL for a member with no last name, because CONCAT propagates NULL. `CONCAT_WS(' ', …)` skips NULL arguments and puts the separator only between the values present, which gives just the first name. Wrapping the last name in `COALESCE(…, '')` and trimming the trailing space, or choosing with `IF`, are the other ways.",
      "",
      "Two cards can expire on the same day, so the order adds `member_id`.",
    ].join("\n"),
  },

  {
    slug: "cash-donations-and-80g-eligibility",
    title: "Cash Donations and 80G Eligibility",
    difficulty: "EASY",
    topics: ["Conditional Logic", "Basics"],
    description: [
      "An NGO issues 80G tax receipts for the financial year **2024-25** (1 April 2024 to 31 March 2025, both included). Under the rule it follows, a donation paid **in cash above ₹2,000** cannot get an 80G receipt; every other donation can (a cash gift of exactly ₹2,000 still qualifies).",
      "",
      "For every donation made in FY 2024-25 return `donation_id`, `donor_name`, `amount` and `eligible_80g` (`'Yes'` or `'No'`), **ordered by `donation_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "donations",
        columns: [
          { name: "donation_id", type: "int" },
          { name: "donor_name", type: "varchar" },
          { name: "amount", type: "int" },
          { name: "payment_mode", type: "enum", values: [...PAY_MODES] },
          { name: "donated_on", type: "date" },
        ],
        primaryKey: ["donation_id"],
        note: "One row per gift; `amount` is in rupees.",
      },
    ],
    examples: [
      {
        donations: [
          [1, "Saanvi Shah", 5000, "upi", "2024-04-01"],
          [2, "Rohan Gupta", 2500, "cash", "2024-06-15"],
          [3, "Aditi Rao", 2000, "cash", "2024-08-02"],
          [4, "Karan Singh", 10000, "cheque", "2024-03-31"],
          [5, "Meera Nair", 1500, "cash", "2025-01-26"],
          [6, "Liam Das", 7500, "netbanking", "2025-03-31"],
          [7, "Riya Joshi", 3000, "cash", "2025-04-01"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 16);
      return {
        donations: seq(1, n).map((id) => [
          id, fullName(rng), chance(rng, 0.15) ? 2000 : roundTo(rng, 500, 15000, 500), chance(rng, 0.45) ? "cash" : pick(rng, PAY_MODES),
          chance(rng, 0.15) ? pick(rng, ["2024-03-31", "2024-04-01", "2025-03-31", "2025-04-01"]) : dateBetween(rng, "2024-02-01", "2025-05-31"),
        ]),
      };
    },
    solution: [
      "SELECT donation_id, donor_name, amount,",
      "       CASE WHEN payment_mode = 'cash' AND amount > 2000 THEN 'No' ELSE 'Yes' END AS eligible_80g",
      "FROM donations",
      "WHERE donated_on >= '2024-04-01' AND donated_on <= '2025-03-31'",
      "ORDER BY donation_id",
    ].join("\n"),
    alternatives: [
      "SELECT donation_id, donor_name, amount, IF(payment_mode <> 'cash' OR amount <= 2000, 'Yes', 'No') AS eligible_80g FROM donations WHERE donated_on BETWEEN '2024-04-01' AND '2025-03-31' ORDER BY donation_id",
    ],
    ordered: true,
    hints: [
      "The financial year is a date range that crosses a calendar year.",
      "A donation is ineligible only when both conditions hold: cash, and above ₹2,000.",
      "Write the label with `CASE WHEN … THEN 'No' ELSE 'Yes' END`.",
    ],
    editorial: [
      "Indian financial years run April to March, so FY 2024-25 is the closed range from 2024-04-01 to 2025-03-31; the example deliberately has gifts on 31 March 2024 and 1 April 2025 just outside it. `BETWEEN` or a pair of `>=`/`<=` comparisons both work because the dates are stored in sortable `YYYY-MM-DD` form.",
      "",
      "The label is one `CASE`. Ineligibility needs both conditions together, `payment_mode = 'cash' AND amount > 2000`; the comparison is strict, so the ₹2,000 cash gift still gets `'Yes'`. The `IF` alternative writes the negation instead — by De Morgan's law, \"not (cash and above 2,000)\" is \"not cash, or at most 2,000\" — and returns the same labels.",
      "",
      "Every row is read once and nothing is grouped, so the cost is a single scan, or an index range scan on `donated_on`.",
    ].join("\n"),
  },

  // ──────────────────────────── MEDIUM ────────────────────────────
  {
    slug: "library-members-blocked-for-unpaid-fines",
    title: "Library Members Blocked for Unpaid Fines",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation"],
    description: [
      "The library stops issuing books to a member whose **unpaid** fines add up to **more than ₹200**. Fines that have been paid (`paid` = 1) no longer count.",
      "",
      "Return every blocked member with `member_id`, `name` and `unpaid_total` (the sum of their unpaid fines). A member at exactly ₹200 is not blocked. Order by **`unpaid_total` descending, then `member_id` ascending**.",
    ].join("\n"),
    tables: [
      {
        name: "members",
        columns: [
          { name: "member_id", type: "int" },
          { name: "name", type: "varchar" },
          { name: "branch", type: "varchar" },
        ],
        primaryKey: ["member_id"],
        note: "One row per library member.",
      },
      {
        name: "fines",
        columns: [
          { name: "fine_id", type: "int" },
          { name: "member_id", type: "int" },
          { name: "reason", type: "enum", values: ["overdue", "damaged", "lost"] },
          { name: "amount", type: "int" },
          { name: "paid", type: "bool" },
        ],
        primaryKey: ["fine_id"],
        note: "One row per fine, in rupees. `paid` is 1 once settled at the counter, otherwise 0.",
      },
    ],
    examples: [
      {
        members: [
          [1, "Aisha Khan", "Central"],
          [2, "Vivaan Rao", "Jayanagar"],
          [3, "Simran Kaur", "Central"],
          [4, "John Mathew", "Indiranagar"],
          [5, "Anjali Menon", "Malleshwaram"],
        ],
        fines: [
          [1, 1, "overdue", 120, 0],
          [2, 1, "damaged", 150, 0],
          [3, 2, "lost", 450, 1],
          [4, 2, "overdue", 60, 0],
          [5, 3, "overdue", 200, 0],
          [6, 4, "lost", 270, 0],
          [7, 5, "overdue", 90, 1],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const mems = seq(1, n).map((id) => [id, fullName(rng), pick(rng, BRANCHES)]);
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      const rows = seq(1, m).map((id) => {
        const reason = pick(rng, ["overdue", "overdue", "damaged", "lost"] as const);
        const amt = reason === "overdue" ? roundTo(rng, 10, 150, 10) : roundTo(rng, 100, 400, 50);
        return [id, ri(rng, 1, n), reason, chance(rng, 0.1) ? 200 : amt, chance(rng, 0.3) ? 1 : 0];
      });
      return { members: mems, fines: rows };
    },
    solution: [
      "SELECT m.member_id, m.name, SUM(f.amount) AS unpaid_total",
      "FROM members m",
      "JOIN fines f ON f.member_id = m.member_id",
      "WHERE f.paid = 0",
      "GROUP BY m.member_id, m.name",
      "HAVING SUM(f.amount) > 200",
      "ORDER BY unpaid_total DESC, m.member_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT member_id, name, unpaid_total FROM (",
        "  SELECT m.member_id, m.name, (SELECT SUM(amount) FROM fines f WHERE f.member_id = m.member_id AND f.paid = 0) AS unpaid_total",
        "  FROM members m",
        ") t WHERE unpaid_total > 200",
        "ORDER BY unpaid_total DESC, member_id",
      ].join("\n"),
      [
        "SELECT m.member_id, m.name, SUM(CASE WHEN f.paid = 0 THEN f.amount ELSE 0 END) AS unpaid_total",
        "FROM members m JOIN fines f ON f.member_id = m.member_id",
        "GROUP BY m.member_id, m.name",
        "HAVING SUM(CASE WHEN f.paid = 0 THEN f.amount ELSE 0 END) > 200",
        "ORDER BY unpaid_total DESC, m.member_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Paid fines should never reach the sum — filter them out first.",
      "A condition on a total belongs in `HAVING`, not `WHERE`.",
      "The limit is strict: ₹200 exactly is still allowed to borrow.",
    ],
    editorial: [
      "The question combines a join, a filter on rows and a filter on groups. Rows: only unpaid fines (`paid = 0`) count, so they are filtered in `WHERE` before grouping. Groups: one per member, with `SUM(f.amount)` as the outstanding balance. The block rule is a condition on that sum, which can only be tested after aggregation — that is what `HAVING SUM(f.amount) > 200` is for.",
      "",
      "Members with no fines, or only paid ones, have no unpaid rows and form no group, so they never appear. The strict `>` keeps the member sitting at exactly ₹200 (Simran in the example) off the list.",
      "",
      "The alternatives compute the same balance differently: a correlated scalar subquery per member (NULL for a member with nothing unpaid, and `NULL > 200` is not true), or conditional summing with `CASE`, which lets every fine into the group but adds zero for paid ones. All three are linear with an index on `fines(member_id)`.",
    ].join("\n"),
  },

  {
    slug: "grievance-resolution-within-seven-day-sla",
    title: "Grievances Resolved Within the Seven-Day SLA",
    difficulty: "MEDIUM",
    topics: ["Dates", "Aggregation", "Conditional Logic"],
    description: [
      "The municipal charter promises that a complaint is resolved **within 7 days** of filing: resolved on the filing day or up to 7 days later meets the SLA. Complaints still open have `resolved_on` NULL and are left out of this report.",
      "",
      "For each department with at least one resolved complaint, return `department`, `resolved` (resolved complaints), `within_sla` (those resolved within 7 days) and `sla_pct` = `within_sla * 100 / resolved` **rounded to 2 decimals**. Order by **`sla_pct` descending, then `department` ascending**.",
    ].join("\n"),
    tables: [
      {
        name: "complaints",
        columns: [
          { name: "complaint_id", type: "int" },
          { name: "department", type: "varchar" },
          { name: "ward_no", type: "int" },
          { name: "filed_on", type: "date" },
          { name: "resolved_on", type: "date" },
        ],
        primaryKey: ["complaint_id"],
        note: "One row per complaint. `resolved_on` is NULL while the complaint is open, and never before `filed_on`.",
      },
    ],
    examples: [
      {
        complaints: [
          [1, "Water Supply", 12, "2024-09-01", "2024-09-05"],
          [2, "Water Supply", 14, "2024-09-02", "2024-09-09"],
          [3, "Water Supply", 12, "2024-09-03", "2024-09-11"],
          [4, "Roads", 7, "2024-09-01", "2024-09-20"],
          [5, "Roads", 7, "2024-09-04", null],
          [6, "Sanitation", 3, "2024-09-05", "2024-09-05"],
          [7, "Street Lighting", 9, "2024-09-06", null],
          [8, "Roads", 8, "2024-09-07", "2024-09-10"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 24);
      const depts = sample(rng, DEPTS, ri(rng, 1, 5));
      return {
        complaints: seq(1, n).map((id) => {
          const filed = dateBetween(rng, "2024-08-01", "2024-10-31");
          const lag = chance(rng, 0.15) ? pick(rng, [7, 8]) : ri(rng, 0, 20);
          return [id, pick(rng, depts), ri(rng, 1, 30), filed, chance(rng, 0.2) ? null : addDays(filed, lag)];
        }),
      };
    },
    solution: [
      "SELECT department,",
      "       COUNT(*) AS resolved,",
      "       SUM(CASE WHEN DATEDIFF(resolved_on, filed_on) <= 7 THEN 1 ELSE 0 END) AS within_sla,",
      "       ROUND(SUM(CASE WHEN DATEDIFF(resolved_on, filed_on) <= 7 THEN 1 ELSE 0 END) * 100 / COUNT(*), 2) AS sla_pct",
      "FROM complaints",
      "WHERE resolved_on IS NOT NULL",
      "GROUP BY department",
      "ORDER BY sla_pct DESC, department",
    ].join("\n"),
    alternatives: [
      [
        "SELECT department, resolved, within_sla, ROUND(within_sla * 100 / resolved, 2) AS sla_pct",
        "FROM (",
        "  SELECT department, COUNT(resolved_on) AS resolved,",
        "         COUNT(CASE WHEN resolved_on <= DATE_ADD(filed_on, INTERVAL 7 DAY) THEN 1 END) AS within_sla",
        "  FROM complaints GROUP BY department",
        ") t WHERE resolved > 0",
        "ORDER BY sla_pct DESC, department",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Leave the open complaints out before counting anything.",
      "`DATEDIFF(resolved_on, filed_on)` is the number of days taken; 7 still meets the SLA.",
      "Count the on-time ones with `SUM(CASE WHEN … THEN 1 ELSE 0 END)` in the same group.",
      "Round the percentage, and break ties on it by department.",
    ],
    editorial: [
      "This is **conditional aggregation**: within each department, one count of all resolved complaints and a second count of only those that met the SLA, computed in the same pass. `WHERE resolved_on IS NOT NULL` removes open complaints first, so `COUNT(*)` is the number resolved and departments with nothing resolved (Street Lighting in the example) form no group.",
      "",
      "The SLA test is `DATEDIFF(resolved_on, filed_on) <= 7` — the boundary matters: a complaint closed exactly a week later (complaint 2) is on time, eight days (complaint 3) is not. `resolved_on <= DATE_ADD(filed_on, INTERVAL 7 DAY)` is the same test without subtraction.",
      "",
      "The percentage is the on-time count times 100 over the resolved count, rounded to two places because MySQL keeps four decimals on division. The alternative lets every complaint into the group, counts `resolved_on` (COUNT skips NULLs) and the on-time `CASE` (which yields NULL, and is skipped, for the rest), then drops departments with zero resolved. Both scan the table once.",
    ].join("\n"),
  },

  {
    slug: "constituency-winners-from-booth-counts",
    title: "Constituency Winners From Booth-Level Counts",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Joins", "Aggregation"],
    description: [
      "On counting day each booth reports the votes of every candidate standing in its constituency. A candidate's total is the sum over all booths; a candidate with no booth rows has no counted votes yet.",
      "",
      "For each constituency with counted votes, return the candidate(s) with the **highest total** — if two candidates tie for the top, return both — with columns `constituency`, `candidate_name`, `party` and `total_votes`. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "candidates",
        columns: [
          { name: "candidate_id", type: "int" },
          { name: "candidate_name", type: "varchar" },
          { name: "party", type: "varchar" },
          { name: "constituency", type: "varchar" },
        ],
        primaryKey: ["candidate_id"],
        note: "One row per candidate; a candidate stands in exactly one constituency.",
      },
      {
        name: "booth_results",
        columns: [
          { name: "booth_id", type: "int" },
          { name: "candidate_id", type: "int" },
          { name: "votes", type: "int" },
        ],
        primaryKey: ["booth_id", "candidate_id"],
        note: "Votes for one candidate at one booth. A booth belongs to one constituency and only reports that constituency's candidates.",
      },
    ],
    examples: [
      {
        candidates: [
          [1, "Rahul Nair", "Lok Vikas Party", "Hebbal"],
          [2, "Priya Reddy", "Jan Shakti Morcha", "Hebbal"],
          [3, "Arjun Rao", "Independent", "Hebbal"],
          [4, "Meera Iyer", "Lok Vikas Party", "Jayanagar"],
          [5, "Karan Singh", "Jan Shakti Morcha", "Jayanagar"],
          [6, "Sara Thomas", "Lok Vikas Party", "BTM Layout"],
        ],
        booth_results: [
          [11, 1, 412], [11, 2, 380], [11, 3, 55],
          [12, 1, 301], [12, 2, 350], [12, 3, 61],
          [21, 4, 520], [21, 5, 470],
          [22, 4, 300], [22, 5, 350],
        ],
      },
    ],
    gen: (rng) => {
      const consts = sample(rng, CONSTITUENCIES, ri(rng, 1, 3));
      const parties = ["Lok Vikas Party", "Jan Shakti Morcha", "Nav Bharat Dal", "Independent"];
      const cands: Cell[][] = [];
      const results: Cell[][] = [];
      let cid = 1;
      consts.forEach((c, ci) => {
        const k = ri(rng, 2, 4);
        const ids = seq(cid, k);
        cid += k;
        const ps = sample(rng, parties, k);
        ids.forEach((id, j) => cands.push([id, fullName(rng), ps[j]!, c]));
        if (chance(rng, 0.12)) return; // counting not started here
        const booths = seq(ci * 10 + 11, ri(rng, 1, 3));
        const counted = chance(rng, 0.2) ? ids.slice(0, k - 1) : ids;
        const tie = chance(rng, 0.3) && counted.length >= 2;
        for (const b of booths) {
          let first = 0;
          counted.forEach((id, j) => {
            const v = tie && j === 1 ? first : ri(rng, 40, 600);
            if (j === 0) first = v;
            results.push([b, id, v]);
          });
        }
      });
      return { candidates: cands, booth_results: results };
    },
    solution: [
      "WITH totals AS (",
      "  SELECT c.candidate_id, c.candidate_name, c.party, c.constituency, SUM(r.votes) AS total_votes",
      "  FROM candidates c",
      "  JOIN booth_results r ON r.candidate_id = c.candidate_id",
      "  GROUP BY c.candidate_id, c.candidate_name, c.party, c.constituency",
      ")",
      "SELECT constituency, candidate_name, party, total_votes",
      "FROM (",
      "  SELECT t.*, RANK() OVER (PARTITION BY constituency ORDER BY total_votes DESC) AS rnk",
      "  FROM totals t",
      ") ranked",
      "WHERE rnk = 1",
    ].join("\n"),
    alternatives: [
      [
        "WITH totals AS (",
        "  SELECT c.candidate_id, c.candidate_name, c.party, c.constituency, SUM(r.votes) AS total_votes",
        "  FROM candidates c JOIN booth_results r ON r.candidate_id = c.candidate_id",
        "  GROUP BY c.candidate_id, c.candidate_name, c.party, c.constituency",
        ")",
        "SELECT t.constituency, t.candidate_name, t.party, t.total_votes",
        "FROM totals t",
        "WHERE t.total_votes = (SELECT MAX(x.total_votes) FROM totals x WHERE x.constituency = t.constituency)",
      ].join("\n"),
      [
        "WITH totals AS (",
        "  SELECT c.candidate_id, c.candidate_name, c.party, c.constituency, SUM(r.votes) AS total_votes",
        "  FROM candidates c JOIN booth_results r ON r.candidate_id = c.candidate_id",
        "  GROUP BY c.candidate_id, c.candidate_name, c.party, c.constituency",
        ")",
        "SELECT t.constituency, t.candidate_name, t.party, t.total_votes",
        "FROM totals t",
        "WHERE NOT EXISTS (SELECT 1 FROM totals x WHERE x.constituency = t.constituency AND x.total_votes > t.total_votes)",
      ].join("\n"),
    ],
    hints: [
      "First turn booth rows into one total per candidate.",
      "Then compare each total only with the totals of the same constituency.",
      "`RANK()` gives tied candidates the same rank, so `rank = 1` keeps every joint leader.",
    ],
    editorial: [
      "There are two steps, so a CTE keeps them apart. The first joins candidates to their booth rows and sums the votes per candidate. The inner join means a candidate with no booth rows has no total, and a constituency where counting has not started has no rows at all — it drops out, as the statement says.",
      "",
      "The second step picks the leader per constituency. `RANK() OVER (PARTITION BY constituency ORDER BY total_votes DESC)` numbers candidates within their constituency from the top; tied totals share a rank, so filtering `rnk = 1` returns both candidates of a dead heat. `ROW_NUMBER()` would silently pick one of them, which is exactly the bug a returning officer cannot afford.",
      "",
      "The alternatives keep a total when it equals the constituency's maximum (a correlated `MAX`), or when no candidate of the same constituency has more (`NOT EXISTS`). All three agree on ties. The window version sorts the totals once per constituency; the correlated ones re-read the small totals set for each candidate, which is fine at this size.",
    ].join("\n"),
  },

  {
    slug: "recurring-donors-across-three-months-of-2024",
    title: "Recurring Donors Across Three Months of 2024",
    difficulty: "MEDIUM",
    topics: ["Dates", "Aggregation"],
    description: [
      "An NGO calls a donor **recurring** if they gave in **at least three different calendar months of 2024**. Several gifts in the same month count as one month.",
      "",
      "Return each recurring donor with `donor_id`, `months_given` (distinct months of 2024 with a gift) and `total_2024` (the sum of their 2024 gifts, in rupees). Gifts outside 2024 are ignored. Order by **`months_given` descending, then `donor_id` ascending**.",
    ].join("\n"),
    tables: [
      {
        name: "Gift",
        columns: [
          { name: "gift_id", type: "int" },
          { name: "donor_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "gift_date", type: "date" },
        ],
        primaryKey: ["gift_id"],
        note: "One row per donation received.",
      },
    ],
    examples: [
      {
        Gift: [
          [1, 7, 500, "2024-01-10"],
          [2, 7, 500, "2024-02-10"],
          [3, 7, 500, "2024-03-10"],
          [4, 8, 1000, "2024-05-02"],
          [5, 8, 1500, "2024-05-28"],
          [6, 8, 1000, "2024-06-15"],
          [7, 9, 2000, "2023-12-31"],
          [8, 9, 2000, "2024-01-01"],
          [9, 9, 2500, "2024-11-20"],
          [10, 9, 1000, "2024-12-31"],
        ],
      },
    ],
    gen: (rng) => {
      const donors = ri(rng, 1, 7);
      const rows: Cell[][] = [];
      let id = 1;
      for (let d = 1; d <= donors; d++) {
        const k = ri(rng, 1, 6);
        const steady = chance(rng, 0.4);
        const base = dateBetween(rng, "2023-11-01", "2024-09-30");
        for (let j = 0; j < k; j++) {
          const day = steady ? addDays(base, 30 * j) : dateBetween(rng, "2023-12-01", "2025-01-15");
          rows.push([id++, d * 3, roundTo(rng, 500, 5000, 500), day]);
        }
      }
      return { Gift: shuffle(rng, rows) };
    },
    solution: [
      "SELECT donor_id,",
      "       COUNT(DISTINCT MONTH(gift_date)) AS months_given,",
      "       SUM(amount) AS total_2024",
      "FROM Gift",
      "WHERE gift_date >= '2024-01-01' AND gift_date < '2025-01-01'",
      "GROUP BY donor_id",
      "HAVING COUNT(DISTINCT MONTH(gift_date)) >= 3",
      "ORDER BY months_given DESC, donor_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT donor_id, COUNT(*) AS months_given, SUM(month_total) AS total_2024",
        "FROM (SELECT donor_id, DATE_FORMAT(gift_date, '%Y-%m') AS ym, SUM(amount) AS month_total FROM Gift WHERE YEAR(gift_date) = 2024 GROUP BY donor_id, DATE_FORMAT(gift_date, '%Y-%m')) m",
        "GROUP BY donor_id",
        "HAVING COUNT(*) >= 3",
        "ORDER BY months_given DESC, donor_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Keep only the 2024 gifts before grouping.",
      "Count distinct months, not gifts: `COUNT(DISTINCT …)`.",
      "The threshold is on the count, so it goes in `HAVING`.",
    ],
    editorial: [
      "Restrict to 2024 first, then group by donor. The month count must be **distinct**: donor 8 in the example gave three times but in only two months (May twice and June), so they are not recurring. `COUNT(DISTINCT MONTH(gift_date))` is safe because the filter has already fixed the year; without the filter, January 2024 and January 2025 would collapse into one month, and the key would have to include the year (`DATE_FORMAT(gift_date, '%Y-%m')`).",
      "",
      "The year boundary is the other trap: 31 December 2023 is out and 31 December 2024 is in. A half-open range (`>= '2024-01-01' AND < '2025-01-01'`) states it exactly, and it can use an index on `gift_date`, unlike `YEAR(gift_date) = 2024`.",
      "",
      "The alternative first collapses each donor's gifts into one row per month and then counts those rows; the sum of the monthly sums is the yearly total. Both are one scan and a group by.",
    ].join("\n"),
  },

  {
    slug: "concert-sell-through-and-sales-status",
    title: "Concert Sell-Through and Sales Status",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "The promoter's weekly report shows how full every concert is. `tickets_sold` is the total `qty` over a concert's sales (0 when it has none), and sell-through is `tickets_sold * 100 / capacity` of its venue.",
      "",
      "Return **every concert** with `concert_id`, `title`, `tickets_sold`, `sell_through_pct` (rounded to **one decimal**) and `sales_status`: `'Sold Out'` when tickets sold reach the capacity, `'Strong'` when sell-through is at least 75%, otherwise `'Needs Push'`. Order by **`sell_through_pct` descending, then `concert_id` ascending**.",
    ].join("\n"),
    tables: [
      {
        name: "venues",
        columns: [
          { name: "venue_id", type: "int" },
          { name: "venue_name", type: "varchar" },
          { name: "capacity", type: "int" },
        ],
        primaryKey: ["venue_id"],
        note: "One row per venue; `capacity` is the number of sellable seats, always positive.",
      },
      {
        name: "concerts",
        columns: [
          { name: "concert_id", type: "int" },
          { name: "title", type: "varchar" },
          { name: "venue_id", type: "int" },
          { name: "concert_date", type: "date" },
        ],
        primaryKey: ["concert_id"],
        note: "Every `venue_id` is in `venues`.",
      },
      {
        name: "ticket_sales",
        columns: [
          { name: "sale_id", type: "int" },
          { name: "concert_id", type: "int" },
          { name: "qty", type: "int" },
          { name: "sold_at", type: "datetime" },
        ],
        primaryKey: ["sale_id"],
        note: "One row per order; the platform never sells more seats than the venue holds.",
      },
    ],
    examples: [
      {
        venues: [
          [1, "Phoenix Arena", 200],
          [2, "Blue Frog Hall", 87],
          [3, "Shanmukhananda Hall", 1003],
        ],
        concerts: [
          [1, "Prateek Kuhad Tour", 1, "2025-05-02"],
          [2, "Jazz by the Bay", 2, "2025-05-03"],
          [3, "Indian Ocean Unplugged", 2, "2025-05-10"],
          [4, "Zakir Hussain Tribute", 3, "2025-05-17"],
          [5, "Coke Studio Nights", 1, "2025-05-24"],
        ],
        ticket_sales: [
          [1, 1, 120, "2025-04-01 10:00:00"],
          [2, 1, 80, "2025-04-03 18:30:00"],
          [3, 2, 40, "2025-04-02 12:00:00"],
          [4, 2, 26, "2025-04-05 20:15:00"],
          [5, 3, 30, "2025-04-04 09:45:00"],
          [6, 5, 150, "2025-04-06 11:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const nv = ri(rng, 1, 3);
      const caps = seq(1, nv).map(() => {
        if (chance(rng, 0.3)) return pick(rng, [100, 200]);
        let c = ri(rng, 41, 400);
        while (c % 2 === 0 || c % 5 === 0) c++;
        return c;
      });
      const venues = caps.map((c, i) => [i + 1, pick(rng, ["Phoenix Arena", "Blue Frog Hall", "Siri Fort Auditorium", "NSCI Dome", "Palace Grounds"]) + ` ${i + 1}`, c]);
      const nc = ri(rng, 1, 6);
      const titles = sample(rng, EVENT_NAMES, nc);
      const concerts = titles.map((t, i) => [i + 1, t, ri(rng, 1, nv), dateBetween(rng, "2025-05-01", "2025-07-31")]);
      const sales: Cell[][] = [];
      let sid = 1;
      for (const c of concerts) {
        const cap = caps[(c[2] as number) - 1]!;
        const target = chance(rng, 0.15) ? cap : chance(rng, 0.15) ? 0 : ri(rng, 0, cap);
        let left = target;
        while (left > 0) {
          const q = Math.min(left, ri(rng, 1, Math.max(1, Math.ceil(cap / 2))));
          sales.push([sid++, c[0]!, q, `${dateBetween(rng, "2025-03-01", "2025-04-30")} 1${ri(rng, 0, 9)}:00:00`]);
          left -= q;
        }
      }
      return { venues, concerts, ticket_sales: sales };
    },
    solution: [
      "SELECT c.concert_id, c.title,",
      "       COALESCE(SUM(s.qty), 0) AS tickets_sold,",
      "       ROUND(COALESCE(SUM(s.qty), 0) * 100 / v.capacity, 1) AS sell_through_pct,",
      "       CASE",
      "         WHEN COALESCE(SUM(s.qty), 0) >= v.capacity THEN 'Sold Out'",
      "         WHEN COALESCE(SUM(s.qty), 0) * 100 >= 75 * v.capacity THEN 'Strong'",
      "         ELSE 'Needs Push'",
      "       END AS sales_status",
      "FROM concerts c",
      "JOIN venues v ON v.venue_id = c.venue_id",
      "LEFT JOIN ticket_sales s ON s.concert_id = c.concert_id",
      "GROUP BY c.concert_id, c.title, v.capacity",
      "ORDER BY sell_through_pct DESC, c.concert_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT concert_id, title, tickets_sold, ROUND(tickets_sold * 100 / capacity, 1) AS sell_through_pct,",
        "       IF(tickets_sold >= capacity, 'Sold Out', IF(tickets_sold / capacity >= 0.75, 'Strong', 'Needs Push')) AS sales_status",
        "FROM (",
        "  SELECT c.concert_id, c.title, v.capacity,",
        "         (SELECT COALESCE(SUM(qty), 0) FROM ticket_sales s WHERE s.concert_id = c.concert_id) AS tickets_sold",
        "  FROM concerts c JOIN venues v ON v.venue_id = c.venue_id",
        ") t",
        "ORDER BY sell_through_pct DESC, concert_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Every concert must appear, including those with no sales — which join keeps them?",
      "`SUM` over no rows is NULL; turn it into 0 with `COALESCE`.",
      "Test the status branches from the strictest (sold out) downwards.",
    ],
    editorial: [
      "Three tables, one row per concert. The venue is an inner join (every concert has one), but sales must be a LEFT JOIN, or a concert with nothing sold would vanish from the report. After grouping per concert, `SUM(s.qty)` is NULL for such a concert, so it is wrapped in `COALESCE(…, 0)` everywhere it is used.",
      "",
      "Capacity is grouped along with the concert so it can be used outside an aggregate; it is determined by the concert anyway. The percentage divides by capacity and rounds to one decimal. The status is a `CASE` tested strictest first: a sold-out concert is also above 75%, so `'Sold Out'` must come before `'Strong'`. Comparing `sold * 100 >= 75 * capacity` keeps the threshold in whole numbers.",
      "",
      "The alternative computes `tickets_sold` with a correlated scalar subquery per concert, which avoids grouping across the join entirely; it reads the sales of each concert once, the same work as the join with an index on `ticket_sales(concert_id)`.",
    ].join("\n"),
  },

  {
    slug: "resale-listings-marked-up-above-event-average",
    title: "Resale Listings Marked Up Above Their Event's Average",
    difficulty: "MEDIUM",
    topics: ["Subqueries"],
    description: [
      "Fans can resell tickets on the platform's marketplace. A listing's **markup** is `ask_price - face_value`. The trust team reviews listings whose markup is **strictly greater than the average markup of all listings for the same event**.",
      "",
      "Return `listing_id`, `event_id`, `seat_no` and `markup` of those listings, **ordered by `event_id`, then `listing_id`**. An event with a single listing never has one above its own average.",
    ].join("\n"),
    tables: [
      {
        name: "resale_listings",
        columns: [
          { name: "listing_id", type: "int" },
          { name: "event_id", type: "int" },
          { name: "seat_no", type: "varchar" },
          { name: "face_value", type: "int" },
          { name: "ask_price", type: "int" },
          { name: "listed_on", type: "date" },
        ],
        primaryKey: ["listing_id"],
        note: "One row per resale listing; prices in rupees. `ask_price` may be below the face value (a discount, negative markup).",
      },
    ],
    examples: [
      {
        resale_listings: [
          [1, 10, "A-14", 2000, 3500, "2025-03-02"],
          [2, 10, "A-15", 2000, 2400, "2025-03-02"],
          [3, 10, "B-02", 1500, 1500, "2025-03-04"],
          [4, 11, "G-30", 999, 1999, "2025-03-05"],
          [5, 12, "F-01", 4000, 3600, "2025-03-06"],
          [6, 12, "F-02", 4000, 5000, "2025-03-06"],
          [7, 12, "F-03", 4000, 4300, "2025-03-07"],
        ],
      },
    ],
    gen: (rng) => {
      const ne = ri(rng, 1, 4);
      const rows: Cell[][] = [];
      let id = 1;
      for (let e = 1; e <= ne; e++) {
        const k = ri(rng, 1, 6);
        const face = pick(rng, [999, 1500, 2000, 3500, 4999]);
        const flat = chance(rng, 0.12);
        for (let j = 0; j < k; j++) {
          const markup = flat ? 500 : roundTo(rng, -500, 3000, 100);
          rows.push([id++, 10 + e, `${pick(rng, ["A", "B", "F", "G"])}-${String(ri(rng, 1, 40)).padStart(2, "0")}`, face, face + markup, dateBetween(rng, "2025-03-01", "2025-03-20")]);
        }
      }
      return { resale_listings: rows };
    },
    solution: [
      "SELECT l.listing_id, l.event_id, l.seat_no, l.ask_price - l.face_value AS markup",
      "FROM resale_listings l",
      "WHERE l.ask_price - l.face_value > (",
      "  SELECT AVG(x.ask_price - x.face_value) FROM resale_listings x WHERE x.event_id = l.event_id",
      ")",
      "ORDER BY l.event_id, l.listing_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT l.listing_id, l.event_id, l.seat_no, l.ask_price - l.face_value AS markup",
        "FROM resale_listings l",
        "JOIN (SELECT event_id, SUM(ask_price - face_value) AS total_markup, COUNT(*) AS n FROM resale_listings GROUP BY event_id) a ON a.event_id = l.event_id",
        "WHERE (l.ask_price - l.face_value) * a.n > a.total_markup",
        "ORDER BY l.event_id, l.listing_id",
      ].join("\n"),
      [
        "SELECT listing_id, event_id, seat_no, markup FROM (",
        "  SELECT listing_id, event_id, seat_no, ask_price - face_value AS markup,",
        "         SUM(ask_price - face_value) OVER (PARTITION BY event_id) AS total_markup,",
        "         COUNT(*) OVER (PARTITION BY event_id) AS n",
        "  FROM resale_listings",
        ") t WHERE markup * n > total_markup",
        "ORDER BY event_id, listing_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The average you compare against changes with each row's event.",
      "A correlated subquery can compute the average for the outer row's `event_id`.",
      "Averages of whole numbers can be fractional; comparing `markup * count > total` avoids decimals entirely.",
    ],
    editorial: [
      "Each listing is compared with a statistic of its own group, which is what a **correlated subquery** expresses: for the outer row `l`, compute `AVG(ask_price - face_value)` over the listings `x` with the same `event_id`, and keep `l` when its markup is strictly larger.",
      "",
      "The average includes the listing itself, so a listing alone on its event equals its own average and is never kept; neither is any listing of an event where every markup is the same. Negative markups (discounts) simply pull the average down.",
      "",
      "Two alternatives avoid recomputing the average per row. One aggregates once per event in a derived table and joins it back; the other uses `SUM … OVER (PARTITION BY event_id)` and `COUNT … OVER` to attach the group's totals to every row. Both compare `markup * n > total_markup`, which is the same inequality multiplied by the positive count, so no fractional average is ever formed. The correlated form is quadratic per event in the worst case; the other two are a single pass plus a sort.",
    ].join("\n"),
  },

  {
    slug: "books-with-the-longest-reservation-queue",
    title: "Books With the Longest Reservation Queue",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Aggregation"],
    description: [
      "Members reserve books that are out on loan and wait in a queue. Only reservations with status `waiting` are in a queue; `fulfilled` and `cancelled` ones are history.",
      "",
      "The acquisitions team wants to buy another copy of the book(s) with the **most waiting reservations**. Return `book_id`, `title` and `waiting` (the number of waiting reservations) for every book that ties for the maximum, in any order. If nothing is waiting, return no rows.",
    ].join("\n"),
    tables: [
      {
        name: "catalogue",
        columns: [
          { name: "book_id", type: "int" },
          { name: "title", type: "varchar" },
          { name: "author", type: "varchar" },
        ],
        primaryKey: ["book_id"],
        note: "One row per title held by the library.",
      },
      {
        name: "reservations",
        columns: [
          { name: "reservation_id", type: "int" },
          { name: "book_id", type: "int" },
          { name: "member_id", type: "int" },
          { name: "reserved_on", type: "date" },
          { name: "status", type: "enum", values: ["waiting", "fulfilled", "cancelled"] },
        ],
        primaryKey: ["reservation_id"],
        note: "Every `book_id` is in `catalogue`.",
      },
    ],
    examples: [
      {
        catalogue: [
          [1, "The White Tiger", "Aravind Adiga"],
          [2, "Wings of Fire", "A. P. J. Abdul Kalam"],
          [3, "The God of Small Things", "Arundhati Roy"],
          [4, "Train to Pakistan", "Khushwant Singh"],
        ],
        reservations: [
          [1, 1, 21, "2025-01-03", "waiting"],
          [2, 1, 22, "2025-01-04", "waiting"],
          [3, 2, 23, "2025-01-04", "fulfilled"],
          [4, 2, 24, "2025-01-05", "waiting"],
          [5, 2, 25, "2025-01-06", "waiting"],
          [6, 3, 26, "2025-01-06", "waiting"],
          [7, 3, 27, "2025-01-07", "cancelled"],
          [8, 2, 28, "2025-01-08", "cancelled"],
        ],
      },
    ],
    gen: (rng) => {
      const titles = ["The White Tiger", "Wings of Fire", "The God of Small Things", "Train to Pakistan", "Midnight's Children", "Malgudi Days", "The Guide", "Gitanjali", "A Suitable Boy"];
      const nb = ri(rng, 1, 6);
      const books = sample(rng, titles, nb).map((t, i) => [i + 1, t, pick(rng, ["R. K. Narayan", "Vikram Seth", "Arundhati Roy", "Aravind Adiga"])]);
      const m = chance(rng, 0.06) ? 0 : ri(rng, 1, 18);
      const waitRate = chance(rng, 0.1) ? 0 : 0.6;
      const rows = seq(1, m).map((id) => [id, ri(rng, 1, Math.min(nb, ri(rng, 1, 4))), ri(rng, 20, 60), dateBetween(rng, "2025-01-01", "2025-02-28"), chance(rng, waitRate) ? "waiting" : pick(rng, ["fulfilled", "cancelled"])]);
      return { catalogue: books, reservations: rows };
    },
    solution: [
      "WITH queue AS (",
      "  SELECT book_id, COUNT(*) AS waiting",
      "  FROM reservations",
      "  WHERE status = 'waiting'",
      "  GROUP BY book_id",
      ")",
      "SELECT c.book_id, c.title, q.waiting",
      "FROM queue q",
      "JOIN catalogue c ON c.book_id = q.book_id",
      "WHERE q.waiting = (SELECT MAX(waiting) FROM queue)",
    ].join("\n"),
    alternatives: [
      [
        "SELECT book_id, title, waiting FROM (",
        "  SELECT c.book_id, c.title, COUNT(*) AS waiting, RANK() OVER (ORDER BY COUNT(*) DESC) AS rnk",
        "  FROM catalogue c JOIN reservations r ON r.book_id = c.book_id AND r.status = 'waiting'",
        "  GROUP BY c.book_id, c.title",
        ") t WHERE rnk = 1",
      ].join("\n"),
      [
        "SELECT c.book_id, c.title, COUNT(*) AS waiting",
        "FROM catalogue c JOIN reservations r ON r.book_id = c.book_id",
        "WHERE r.status = 'waiting'",
        "GROUP BY c.book_id, c.title",
        "HAVING NOT EXISTS (SELECT 1 FROM reservations r2 WHERE r2.status = 'waiting' GROUP BY r2.book_id HAVING COUNT(*) > (SELECT COUNT(*) FROM reservations r3 WHERE r3.status = 'waiting' AND r3.book_id = c.book_id))",
      ].join("\n"),
    ],
    hints: [
      "Count the waiting reservations per book first.",
      "The maximum of those counts is itself a query over the counts.",
      "Keep every book whose count equals that maximum — ties included.",
    ],
    editorial: [
      "The answer depends on a value computed across all books — the largest queue — so the query has two levels. The CTE `queue` counts waiting reservations per book (fulfilled and cancelled ones are filtered out first). The outer query keeps the books whose count equals `(SELECT MAX(waiting) FROM queue)` and joins the catalogue for the title.",
      "",
      "`ORDER BY waiting DESC LIMIT 1` is the tempting shortcut and the wrong one: in the example two books have two waiting members each, and LIMIT would return one of them arbitrarily. Comparing with the maximum keeps both. When nothing is waiting, `queue` is empty, the maximum is NULL, and no row is returned, as asked.",
      "",
      "The alternatives rank the grouped counts with `RANK() OVER (ORDER BY COUNT(*) DESC)` — a window over an aggregate — or keep a group when `NOT EXISTS` finds another book with a longer queue. Each is one grouping pass over the reservations.",
    ].join("\n"),
  },

  {
    slug: "monthly-library-issues-by-genre",
    title: "Monthly Library Issues by Genre",
    difficulty: "MEDIUM",
    topics: ["Dates", "Conditional Logic", "Joins"],
    description: [
      "The branch librarian's annual return to the city council shows, for every month of **2024** in which at least one book was issued, how many issues fell in each genre.",
      "",
      "Return `issue_month` in the form `'YYYY-MM'`, then the columns `fiction`, `non_fiction`, `children` (issues of books in each genre) and `total_issues`, **ordered by `issue_month`**. Issues outside 2024 are not counted.",
    ].join("\n"),
    tables: [
      {
        name: "Book",
        columns: [
          { name: "book_id", type: "int" },
          { name: "title", type: "varchar" },
          { name: "genre", type: "enum", values: ["fiction", "non_fiction", "children"] },
        ],
        primaryKey: ["book_id"],
        note: "One row per title.",
      },
      {
        name: "Issue",
        columns: [
          { name: "issue_id", type: "int" },
          { name: "book_id", type: "int" },
          { name: "member_id", type: "int" },
          { name: "issued_on", type: "date" },
        ],
        primaryKey: ["issue_id"],
        note: "One row each time a book is lent out. Every `book_id` is in `Book`.",
      },
    ],
    examples: [
      {
        Book: [
          [1, "Malgudi Days", "fiction"],
          [2, "India After Gandhi", "non_fiction"],
          [3, "Panchatantra Tales", "children"],
          [4, "The Guide", "fiction"],
        ],
        Issue: [
          [1, 1, 31, "2023-12-30"],
          [2, 1, 32, "2024-01-05"],
          [3, 3, 33, "2024-01-12"],
          [4, 4, 34, "2024-01-31"],
          [5, 2, 31, "2024-03-01"],
          [6, 3, 35, "2024-03-18"],
          [7, 2, 36, "2024-12-31"],
          [8, 4, 37, "2025-01-02"],
        ],
      },
    ],
    gen: (rng) => {
      const genres = ["fiction", "non_fiction", "children"] as const;
      const nb = ri(rng, 1, 6);
      const books = seq(1, nb).map((id) => [id, `${pick(rng, ["Tales", "Stories", "History", "Letters", "Poems"])} Vol ${id}`, pick(rng, genres)]);
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 22);
      const issues = seq(1, m).map((id) => [id, ri(rng, 1, nb), ri(rng, 30, 60), dateBetween(rng, chance(rng, 0.8) ? "2024-01-01" : "2023-11-01", chance(rng, 0.8) ? "2024-12-31" : "2025-02-28")]);
      return { Book: books, Issue: issues };
    },
    solution: [
      "SELECT DATE_FORMAT(i.issued_on, '%Y-%m') AS issue_month,",
      "       SUM(CASE WHEN b.genre = 'fiction' THEN 1 ELSE 0 END) AS fiction,",
      "       SUM(CASE WHEN b.genre = 'non_fiction' THEN 1 ELSE 0 END) AS non_fiction,",
      "       SUM(CASE WHEN b.genre = 'children' THEN 1 ELSE 0 END) AS children,",
      "       COUNT(*) AS total_issues",
      "FROM Issue i",
      "JOIN Book b ON b.book_id = i.book_id",
      "WHERE i.issued_on BETWEEN '2024-01-01' AND '2024-12-31'",
      "GROUP BY DATE_FORMAT(i.issued_on, '%Y-%m')",
      "ORDER BY issue_month",
    ].join("\n"),
    alternatives: [
      [
        "SELECT LEFT(i.issued_on, 7) AS issue_month,",
        "       COUNT(IF(b.genre = 'fiction', 1, NULL)) AS fiction,",
        "       COUNT(IF(b.genre = 'non_fiction', 1, NULL)) AS non_fiction,",
        "       COUNT(IF(b.genre = 'children', 1, NULL)) AS children,",
        "       COUNT(*) AS total_issues",
        "FROM Issue i JOIN Book b ON b.book_id = i.book_id",
        "WHERE YEAR(i.issued_on) = 2024",
        "GROUP BY LEFT(i.issued_on, 7)",
        "ORDER BY issue_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Bucket each issue by its month with `DATE_FORMAT(issued_on, '%Y-%m')`.",
      "Each genre column is a count of only the rows of that genre — a `CASE` inside `SUM`.",
      "Join `Book` to learn each issue's genre, and filter to 2024 before grouping.",
    ],
    editorial: [
      "Turning categories into columns is **conditional aggregation** (a pivot without a PIVOT keyword). Group the 2024 issues by month, and in each group compute one sum per genre where the `CASE` contributes 1 only for that genre's rows. The three genre columns always add up to `total_issues`, since every book has exactly one genre.",
      "",
      "The month bucket is `DATE_FORMAT(issued_on, '%Y-%m')`, which also gives the requested `'YYYY-MM'` text and sorts chronologically as a string. Months with no issue simply produce no group; the statement only asks for months with at least one issue. Issues on 30 December 2023 and 2 January 2025 in the example sit just outside the year and are dropped by the filter, while 31 December 2024 is inside.",
      "",
      "The alternative uses `COUNT(IF(…, 1, NULL))` — COUNT ignores NULLs — and `LEFT(issued_on, 7)` for the month. Both are one join and one grouping pass.",
    ].join("\n"),
  },

  {
    slug: "grievance-tickets-per-ward-from-reference-codes",
    title: "Grievance Tickets per Ward From Reference Codes",
    difficulty: "MEDIUM",
    topics: ["Strings", "Aggregation", "Conditional Logic"],
    description: [
      "The corporation's helpline stores no ward column; the ward is encoded in the ticket reference, which always has the form `BBMP/<ward>/<year>/<serial>` — for example `BBMP/W045/2024/0012`, where the ward code is always a `W` and three digits and the year four digits.",
      "",
      "For tickets of the year **2024** only, return `ward_code` (such as `W045`), `tickets` (the number of tickets) and `still_open` (tickets whose status is not `closed`), **ordered by `tickets` descending, then `ward_code` ascending**.",
    ].join("\n"),
    tables: [
      {
        name: "helpline_tickets",
        columns: [
          { name: "ticket_ref", type: "varchar" },
          { name: "category", type: "varchar" },
          { name: "status", type: "enum", values: ["new", "assigned", "closed"] },
        ],
        primaryKey: ["ticket_ref"],
        note: "One row per helpline ticket; `ticket_ref` is unique.",
      },
    ],
    examples: [
      {
        helpline_tickets: [
          ["BBMP/W045/2024/0012", "Garbage", "closed"],
          ["BBMP/W045/2024/0013", "Pothole", "assigned"],
          ["BBMP/W112/2024/0001", "Streetlight", "new"],
          ["BBMP/W045/2023/0907", "Garbage", "closed"],
          ["BBMP/W112/2024/0002", "Water leak", "closed"],
          ["BBMP/W007/2024/0044", "Stray dogs", "assigned"],
          ["BBMP/W007/2025/0001", "Pothole", "new"],
        ],
      },
    ],
    gen: (rng) => {
      const wards = sample(rng, ["W007", "W045", "W112", "W150", "W198", "W023"], ri(rng, 1, 4));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 20);
      const seen = new Set<string>();
      const rows: Cell[][] = [];
      for (let i = 0; i < n; i++) {
        const ref = `BBMP/${pick(rng, wards)}/${chance(rng, 0.75) ? 2024 : pick(rng, [2023, 2025])}/${String(ri(rng, 1, 999)).padStart(4, "0")}`;
        if (seen.has(ref)) continue;
        seen.add(ref);
        rows.push([ref, pick(rng, ["Garbage", "Pothole", "Streetlight", "Water leak", "Stray dogs"]), pick(rng, ["new", "assigned", "closed", "closed"])]);
      }
      return { helpline_tickets: rows };
    },
    solution: [
      "SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(ticket_ref, '/', 2), '/', -1) AS ward_code,",
      "       COUNT(*) AS tickets,",
      "       SUM(CASE WHEN status <> 'closed' THEN 1 ELSE 0 END) AS still_open",
      "FROM helpline_tickets",
      "WHERE SUBSTRING_INDEX(SUBSTRING_INDEX(ticket_ref, '/', 3), '/', -1) = '2024'",
      "GROUP BY SUBSTRING_INDEX(SUBSTRING_INDEX(ticket_ref, '/', 2), '/', -1)",
      "ORDER BY tickets DESC, ward_code",
    ].join("\n"),
    alternatives: [
      [
        "SELECT SUBSTRING(ticket_ref, 6, 4) AS ward_code, COUNT(*) AS tickets,",
        "       COUNT(CASE WHEN status IN ('new', 'assigned') THEN 1 END) AS still_open",
        "FROM helpline_tickets",
        "WHERE ticket_ref LIKE 'BBMP/____/2024/%'",
        "GROUP BY SUBSTRING(ticket_ref, 6, 4)",
        "ORDER BY tickets DESC, ward_code",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The reference is four fields separated by `/`; the ward is the second and the year the third.",
      "`SUBSTRING_INDEX(s, '/', 2)` keeps the first two fields; a second `SUBSTRING_INDEX(…, '/', -1)` keeps the last of those.",
      "Because every field has a fixed width, fixed positions work too.",
    ],
    editorial: [
      "When a fact lives inside a string, the query has to parse it out before it can group by it. The reference has `/`-separated fields, and the nested `SUBSTRING_INDEX` idiom picks field *k*: `SUBSTRING_INDEX(ref, '/', k)` keeps everything before the *k*-th slash, and `SUBSTRING_INDEX(…, '/', -1)` then keeps the last field of that prefix. Field 2 is the ward and field 3 the year.",
      "",
      "The year filter is on the parsed year, so the 2023 and 2025 tickets of ward W045 and W007 in the example are excluded. Then a group per ward counts all tickets and, conditionally, the ones not yet closed.",
      "",
      "Since the format is fixed-width (`BBMP/` is five characters, the ward four), `SUBSTRING(ticket_ref, 6, 4)` and a `LIKE 'BBMP/____/2024/%'` pattern (each `_` matches one character) are a cheaper alternative. Storing the ward and year as columns would be the real fix — parsing on every query defeats any index.",
    ].join("\n"),
  },

  {
    slug: "donor-first-and-latest-gift-change",
    title: "Change Between a Donor's First and Latest Gift",
    difficulty: "MEDIUM",
    topics: ["Window Functions"],
    description: [
      "The NGO's donor-care team wants to see whether repeat donors are giving more or less than when they started. When a donor gave twice on the same day, the gift with the smaller `gift_id` came first.",
      "",
      "For every donor with **at least two gifts**, return `donor_id`, `first_amount` (their earliest gift), `latest_amount` (their most recent gift) and `change_amount` = `latest_amount - first_amount`, **ordered by `donor_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "donor_gifts",
        columns: [
          { name: "gift_id", type: "int" },
          { name: "donor_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "gift_date", type: "date" },
        ],
        primaryKey: ["gift_id"],
        note: "One row per donation in rupees.",
      },
    ],
    examples: [
      {
        donor_gifts: [
          [1, 101, 1000, "2024-01-15"],
          [2, 101, 1500, "2024-06-15"],
          [3, 102, 5000, "2024-02-01"],
          [4, 103, 2000, "2024-03-10"],
          [5, 103, 500, "2024-03-10"],
          [6, 101, 1200, "2024-12-15"],
          [7, 104, 3000, "2024-05-05"],
          [8, 104, 3000, "2024-09-05"],
        ],
      },
    ],
    gen: (rng) => {
      const nd = ri(rng, 1, 7);
      const rows: Cell[][] = [];
      let id = 1;
      for (let d = 1; d <= nd; d++) {
        const k = chance(rng, 0.25) ? 1 : ri(rng, 2, 5);
        let day = dateBetween(rng, "2024-01-01", "2024-06-30");
        for (let j = 0; j < k; j++) {
          rows.push([id++, 100 + d, roundTo(rng, 500, 6000, 250), day]);
          if (!chance(rng, 0.2)) day = addDays(day, ri(rng, 1, 60));
        }
      }
      return { donor_gifts: shuffle(rng, rows) };
    },
    solution: [
      "WITH ordered_gifts AS (",
      "  SELECT donor_id, amount,",
      "         ROW_NUMBER() OVER (PARTITION BY donor_id ORDER BY gift_date, gift_id) AS from_first,",
      "         ROW_NUMBER() OVER (PARTITION BY donor_id ORDER BY gift_date DESC, gift_id DESC) AS from_last",
      "  FROM donor_gifts",
      ")",
      "SELECT donor_id,",
      "       MAX(CASE WHEN from_first = 1 THEN amount END) AS first_amount,",
      "       MAX(CASE WHEN from_last = 1 THEN amount END) AS latest_amount,",
      "       MAX(CASE WHEN from_last = 1 THEN amount END) - MAX(CASE WHEN from_first = 1 THEN amount END) AS change_amount",
      "FROM ordered_gifts",
      "GROUP BY donor_id",
      "HAVING COUNT(*) >= 2",
      "ORDER BY donor_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT DISTINCT donor_id, first_amount, latest_amount, latest_amount - first_amount AS change_amount FROM (",
        "  SELECT donor_id,",
        "         FIRST_VALUE(amount) OVER (PARTITION BY donor_id ORDER BY gift_date, gift_id ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS first_amount,",
        "         LAST_VALUE(amount) OVER (PARTITION BY donor_id ORDER BY gift_date, gift_id ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS latest_amount,",
        "         COUNT(*) OVER (PARTITION BY donor_id) AS gifts",
        "  FROM donor_gifts",
        ") t WHERE gifts >= 2",
        "ORDER BY donor_id",
      ].join("\n"),
      [
        "SELECT d.donor_id, f.amount AS first_amount, l.amount AS latest_amount, l.amount - f.amount AS change_amount",
        "FROM (SELECT donor_id FROM donor_gifts GROUP BY donor_id HAVING COUNT(*) >= 2) d",
        "JOIN donor_gifts f ON f.donor_id = d.donor_id AND NOT EXISTS (SELECT 1 FROM donor_gifts x WHERE x.donor_id = f.donor_id AND (x.gift_date < f.gift_date OR (x.gift_date = f.gift_date AND x.gift_id < f.gift_id)))",
        "JOIN donor_gifts l ON l.donor_id = d.donor_id AND NOT EXISTS (SELECT 1 FROM donor_gifts y WHERE y.donor_id = l.donor_id AND (y.gift_date > l.gift_date OR (y.gift_date = l.gift_date AND y.gift_id > l.gift_id)))",
        "ORDER BY d.donor_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Number each donor's gifts in date order — and once more in reverse order.",
      "The same-day rule means the order is `gift_date, gift_id`, never the date alone.",
      "Fold the two marked rows back into one row per donor with conditional `MAX`.",
    ],
    editorial: [
      "First and last per group is a window problem. `ROW_NUMBER()` over each donor's gifts ordered by `(gift_date, gift_id)` marks the first gift with 1; the same numbering in descending order marks the latest with 1. Adding `gift_id` to the order is what makes it deterministic: donor 103 gave twice on 10 March, and the rule says gift 4 came first.",
      "",
      "Grouping the numbered rows by donor and taking `MAX(CASE WHEN from_first = 1 THEN amount END)` picks the one marked amount (the CASE is NULL on all other rows, and MAX ignores NULLs). `HAVING COUNT(*) >= 2` drops one-time donors, whose first and latest gift would be the same row.",
      "",
      "`FIRST_VALUE`/`LAST_VALUE` work too, but `LAST_VALUE` needs the frame widened to `UNBOUNDED FOLLOWING` — with the default frame it only sees up to the current row and returns the current amount. The `NOT EXISTS` version finds the row with no earlier (or later) gift; it is quadratic per donor but uses no windows.",
    ].join("\n"),
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "wards-with-complaint-streaks-of-three-days",
    title: "Wards With Complaint Streaks of Three Days or More",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "A ward that logs complaints day after day usually has a failing pipe or a blocked drain rather than bad luck. The city engineer wants every **streak of consecutive calendar days** on which a ward logged **at least one** complaint, lasting **three days or more**. Several complaints on one day count as one day; a day without a complaint ends the streak.",
      "",
      "Return `ward_no`, `streak_start`, `streak_end` and `streak_days` for each such streak, **ordered by `ward_no`, then `streak_start`**.",
    ].join("\n"),
    tables: [
      {
        name: "complaint_log",
        columns: [
          { name: "complaint_id", type: "int" },
          { name: "ward_no", type: "int" },
          { name: "category", type: "varchar" },
          { name: "logged_on", type: "date" },
        ],
        primaryKey: ["complaint_id"],
        note: "One row per complaint received at the ward office.",
      },
    ],
    examples: [
      {
        complaint_log: [
          [1, 45, "Drainage", "2024-07-01"],
          [2, 45, "Drainage", "2024-07-02"],
          [3, 45, "Garbage", "2024-07-02"],
          [4, 45, "Drainage", "2024-07-03"],
          [5, 45, "Drainage", "2024-07-05"],
          [6, 45, "Drainage", "2024-07-06"],
          [7, 112, "Water", "2024-06-29"],
          [8, 112, "Water", "2024-06-30"],
          [9, 112, "Water", "2024-07-01"],
          [10, 112, "Water", "2024-07-02"],
          [11, 7, "Garbage", "2024-07-01"],
          [12, 7, "Garbage", "2024-07-03"],
        ],
      },
    ],
    gen: (rng) => {
      const wards = sample(rng, [7, 12, 45, 112, 150], ri(rng, 1, 3));
      const rows: Cell[][] = [];
      let id = 1;
      for (const w of wards) {
        const start = dateBetween(rng, "2024-05-01", "2024-08-15");
        const span = ri(rng, 3, 12);
        const p = pick(rng, [0.45, 0.65, 0.85]);
        const busy: boolean[] = seq(0, span).map(() => chance(rng, p));
        if (chance(rng, 0.5)) {
          const at = ri(rng, 0, span - 3);
          for (let k = at; k < at + 3; k++) busy[k] = true;
        }
        busy.forEach((b, i) => {
          if (!b) return;
          const k = chance(rng, 0.25) ? 2 : 1;
          for (let j = 0; j < k; j++) rows.push([id++, w, pick(rng, ["Drainage", "Garbage", "Water", "Roads"]), addDays(start, i)]);
        });
      }
      return { complaint_log: shuffle(rng, rows) };
    },
    solution: [
      "WITH days AS (",
      "  SELECT DISTINCT ward_no, logged_on FROM complaint_log",
      "),",
      "islands AS (",
      "  SELECT ward_no, logged_on,",
      "         DATEDIFF(logged_on, '2000-01-01') - ROW_NUMBER() OVER (PARTITION BY ward_no ORDER BY logged_on) AS island",
      "  FROM days",
      ")",
      "SELECT ward_no, MIN(logged_on) AS streak_start, MAX(logged_on) AS streak_end, COUNT(*) AS streak_days",
      "FROM islands",
      "GROUP BY ward_no, island",
      "HAVING COUNT(*) >= 3",
      "ORDER BY ward_no, streak_start",
    ].join("\n"),
    alternatives: [
      [
        "WITH days AS (SELECT DISTINCT ward_no, logged_on FROM complaint_log),",
        "flagged AS (",
        "  SELECT ward_no, logged_on,",
        "         CASE WHEN DATEDIFF(logged_on, LAG(logged_on) OVER (PARTITION BY ward_no ORDER BY logged_on)) = 1 THEN 0 ELSE 1 END AS starts_streak",
        "  FROM days",
        "),",
        "numbered AS (",
        "  SELECT ward_no, logged_on,",
        "         SUM(starts_streak) OVER (PARTITION BY ward_no ORDER BY logged_on ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS streak_no",
        "  FROM flagged",
        ")",
        "SELECT ward_no, MIN(logged_on) AS streak_start, MAX(logged_on) AS streak_end, COUNT(*) AS streak_days",
        "FROM numbered GROUP BY ward_no, streak_no HAVING COUNT(*) >= 3",
        "ORDER BY ward_no, streak_start",
      ].join("\n"),
      [
        "WITH days AS (SELECT DISTINCT ward_no, logged_on FROM complaint_log)",
        "SELECT s.ward_no, s.logged_on AS streak_start, MIN(e.logged_on) AS streak_end, DATEDIFF(MIN(e.logged_on), s.logged_on) + 1 AS streak_days",
        "FROM days s",
        "JOIN days e ON e.ward_no = s.ward_no AND e.logged_on >= s.logged_on",
        "WHERE NOT EXISTS (SELECT 1 FROM days p WHERE p.ward_no = s.ward_no AND p.logged_on = DATE_SUB(s.logged_on, INTERVAL 1 DAY))",
        "  AND NOT EXISTS (SELECT 1 FROM days n WHERE n.ward_no = e.ward_no AND n.logged_on = DATE_ADD(e.logged_on, INTERVAL 1 DAY))",
        "GROUP BY s.ward_no, s.logged_on",
        "HAVING DATEDIFF(MIN(e.logged_on), s.logged_on) + 1 >= 3",
        "ORDER BY s.ward_no, streak_start",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Reduce the log to one row per (ward, day) first — duplicates on a day would break any counting trick.",
      "Number each ward's days in order. Along a run of consecutive dates, the date and the row number rise together.",
      "So *date minus row number* is constant within a run and changes after every gap — group by it.",
    ],
    editorial: [
      "This is **gaps and islands** on dates. After `SELECT DISTINCT ward_no, logged_on` there is one row per active day. Number those days per ward with `ROW_NUMBER()`. On consecutive dates the day count since a fixed epoch (`DATEDIFF(logged_on, '2000-01-01')`) and the row number both rise by one, so their difference is the same for every day of a run; a missing day makes the date jump by two or more while the row number rises by one, and the difference changes. That difference is the island key: group by ward and key, keep groups of three or more, and the first and last dates are the streak's ends.",
      "",
      "De-duplicating first is essential — ward 45 logged two complaints on 2 July, and without `DISTINCT` the extra row would shift the numbering and split the streak.",
      "",
      "The first alternative marks a day that does *not* follow the previous one (`LAG` with a gap other than 1) and turns the marks into streak numbers with a running `SUM`. The second pairs each streak start (no complaint the day before) with the nearest streak end (no complaint the day after). The window versions are one sort per ward; the pairing version is quadratic but uses only joins.",
    ].join("\n"),
  },

  {
    slug: "reservation-holders-to-notify-after-returns",
    title: "Reservation Holders to Notify After Today's Returns",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins", "Subqueries"],
    description: [
      "Each morning the library processes yesterday's returns: every returned copy of a book goes to the next member in that book's reservation queue. The queue holds only `active` holds, in the order they were placed; two holds placed at the same moment are ordered by `hold_id`. If a book had three copies returned, the first three members in its queue are notified; if it had more returns than holds, everyone in its queue is.",
      "",
      "Return `book_id`, `queue_position` (1 for the head of that book's active queue) and `member_id` of every member to notify, **ordered by `book_id`, then `queue_position`**.",
    ].join("\n"),
    tables: [
      {
        name: "holds",
        columns: [
          { name: "hold_id", type: "int" },
          { name: "book_id", type: "int" },
          { name: "member_id", type: "int" },
          { name: "placed_at", type: "datetime" },
          { name: "status", type: "enum", values: ["active", "collected", "cancelled"] },
        ],
        primaryKey: ["hold_id"],
        note: "One row per reservation. Only `active` holds are still waiting for a copy.",
      },
      {
        name: "copy_returns",
        columns: [
          { name: "return_id", type: "int" },
          { name: "book_id", type: "int" },
          { name: "copy_barcode", type: "varchar" },
          { name: "returned_at", type: "datetime" },
        ],
        primaryKey: ["return_id"],
        note: "Yesterday's returns, one row per physical copy handed back.",
      },
    ],
    examples: [
      {
        holds: [
          [1, 10, 501, "2025-02-01 10:00:00", "active"],
          [2, 10, 502, "2025-02-01 10:00:00", "active"],
          [3, 10, 503, "2025-01-30 18:20:00", "collected"],
          [4, 10, 504, "2025-02-03 09:15:00", "active"],
          [5, 20, 505, "2025-02-02 11:00:00", "cancelled"],
          [6, 20, 506, "2025-02-04 12:30:00", "active"],
          [7, 30, 507, "2025-02-05 16:45:00", "active"],
        ],
        copy_returns: [
          [1, 10, "LIB-10-A", "2025-03-09 11:10:00"],
          [2, 10, "LIB-10-C", "2025-03-09 17:40:00"],
          [3, 20, "LIB-20-A", "2025-03-09 12:00:00"],
          [4, 20, "LIB-20-B", "2025-03-09 15:30:00"],
          [5, 40, "LIB-40-A", "2025-03-09 10:05:00"],
        ],
      },
    ],
    gen: (rng) => {
      const books = [10, 20, 30, 40];
      const nh = chance(rng, 0.05) ? 0 : ri(rng, 1, 15);
      const stamps = seq(0, 6).map(() => `${dateBetween(rng, "2025-01-20", "2025-03-05")} ${String(ri(rng, 9, 19)).padStart(2, "0")}:${pick(rng, ["00", "15", "30", "45"])}:00`);
      const holds = seq(1, nh).map((id) => [id, pick(rng, books), 500 + id, pick(rng, stamps), chance(rng, 0.7) ? "active" : pick(rng, ["collected", "cancelled"])]);
      const returns: Cell[][] = [];
      let rid = 1;
      for (const b of books) {
        const k = ri(rng, 0, 3);
        for (let j = 0; j < k; j++) returns.push([rid++, b, `LIB-${b}-${"ABC"[j]}`, `2025-03-09 ${String(ri(rng, 9, 19)).padStart(2, "0")}:00:00`]);
      }
      return { holds, copy_returns: returns };
    },
    solution: [
      "WITH returned AS (",
      "  SELECT book_id, COUNT(*) AS copies FROM copy_returns GROUP BY book_id",
      "),",
      "queue AS (",
      "  SELECT book_id, member_id,",
      "         ROW_NUMBER() OVER (PARTITION BY book_id ORDER BY placed_at, hold_id) AS queue_position",
      "  FROM holds",
      "  WHERE status = 'active'",
      ")",
      "SELECT q.book_id, q.queue_position, q.member_id",
      "FROM queue q",
      "JOIN returned r ON r.book_id = q.book_id",
      "WHERE q.queue_position <= r.copies",
      "ORDER BY q.book_id, q.queue_position",
    ].join("\n"),
    alternatives: [
      [
        "SELECT book_id, queue_position, member_id FROM (",
        "  SELECT h.book_id, h.member_id,",
        "         (SELECT COUNT(*) FROM holds x WHERE x.book_id = h.book_id AND x.status = 'active'",
        "            AND (x.placed_at < h.placed_at OR (x.placed_at = h.placed_at AND x.hold_id <= h.hold_id))) AS queue_position,",
        "         (SELECT COUNT(*) FROM copy_returns c WHERE c.book_id = h.book_id) AS copies",
        "  FROM holds h WHERE h.status = 'active'",
        ") t WHERE queue_position <= copies",
        "ORDER BY book_id, queue_position",
      ].join("\n"),
      [
        "SELECT q.book_id, q.queue_position, q.member_id",
        "FROM (SELECT book_id, member_id, ROW_NUMBER() OVER (PARTITION BY book_id ORDER BY placed_at, hold_id) AS queue_position FROM holds WHERE status = 'active') q",
        "JOIN (SELECT book_id, ROW_NUMBER() OVER (PARTITION BY book_id ORDER BY return_id) AS copy_no FROM copy_returns) c",
        "  ON c.book_id = q.book_id AND c.copy_no = q.queue_position",
        "ORDER BY q.book_id, q.queue_position",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Build each book's queue: only active holds, numbered by `placed_at` and then `hold_id`.",
      "Count how many copies of each book came back.",
      "A member is notified when their position is at most the number of copies returned for that book.",
      "Equivalently, pair the k-th returned copy with the k-th member in the queue.",
    ],
    editorial: [
      "Two independent facts per book have to meet: its queue and its number of returned copies. The queue is `ROW_NUMBER() OVER (PARTITION BY book_id ORDER BY placed_at, hold_id)` over the active holds only — collected and cancelled holds must be removed *before* numbering, or they would occupy positions. The `hold_id` tie-break matters: holds 1 and 2 in the example were placed in the same second, and the rule puts hold 1 first.",
      "",
      "The returns are counted per book, and the join keeps a queued member when `queue_position <= copies`. A book with returns but no queue (book 40) contributes nothing; a book with more returns than holds (book 20, two copies and one active hold) notifies only the member it has; a book with holds but no returns (30) is absent from the join.",
      "",
      "The second alternative makes the pairing literal: number the returned copies too and join copy *k* to queue position *k*. The first computes positions with a correlated count of holds ahead, which needs the same tie-break written as a comparison. The window versions sort each book's holds once.",
    ].join("\n"),
  },

  {
    slug: "first-day-a-library-fine-balance-hit-500",
    title: "First Day a Member's Fine Balance Reached ₹500",
    difficulty: "HARD",
    topics: ["Window Functions", "Conditional Logic"],
    description: [
      "Every fine, payment and waiver on a library account is an entry in `fine_ledger`. A `fine` raises the balance; a `payment` or a `waiver` lowers it (a payment can leave the account in credit, below zero). Entries are applied in date order, and entries on the same date in `entry_id` order.",
      "",
      "A member is reported to the branch head on the **first entry after which their running balance is ₹500 or more**. Return `member_id`, `blocked_on` (that entry's date) and `balance_then` (the balance right after it) for every member whose balance ever reached ₹500, **ordered by `member_id`**.",
    ].join("\n"),
    tables: [
      {
        name: "fine_ledger",
        columns: [
          { name: "entry_id", type: "int" },
          { name: "member_id", type: "int" },
          { name: "entry_date", type: "date" },
          { name: "entry_type", type: "enum", values: ["fine", "payment", "waiver"] },
          { name: "amount", type: "int" },
        ],
        primaryKey: ["entry_id"],
        note: "One row per ledger entry; `amount` is always positive, in rupees.",
      },
    ],
    examples: [
      {
        fine_ledger: [
          [1, 1, "2024-01-05", "fine", 300],
          [2, 1, "2024-01-20", "fine", 150],
          [3, 1, "2024-02-02", "payment", 100],
          [4, 1, "2024-02-10", "fine", 250],
          [5, 2, "2024-01-08", "fine", 500],
          [6, 3, "2024-01-10", "fine", 400],
          [7, 3, "2024-01-10", "waiver", 200],
          [8, 3, "2024-03-01", "fine", 200],
          [9, 4, "2024-02-14", "fine", 450],
          [10, 4, "2024-02-14", "fine", 120],
          [11, 4, "2024-02-20", "fine", 300],
        ],
      },
    ],
    gen: (rng) => {
      const nm = ri(rng, 2, 5);
      const entries: { m: number; d: string; t: string; a: number }[] = [];
      for (let m = 1; m <= nm; m++) {
        let day = dateBetween(rng, "2024-01-01", "2024-03-31");
        const k = ri(rng, 1, 6);
        for (let j = 0; j < k; j++) {
          const t = chance(rng, 0.7) ? "fine" : pick(rng, ["payment", "waiver"]);
          entries.push({ m, d: day, t, a: chance(rng, 0.15) ? 500 : roundTo(rng, 100, 400, 50) });
          if (!chance(rng, 0.25)) day = addDays(day, ri(rng, 1, 20));
        }
      }
      // Stored out of order: the rule is (entry_date, entry_id), and ids only break same-day ties.
      return { fine_ledger: shuffle(rng, entries.map((e, i) => [i + 1, e.m, e.d, e.t, e.a])) };
    },
    solution: [
      "WITH running AS (",
      "  SELECT member_id, entry_id, entry_date,",
      "         SUM(CASE WHEN entry_type = 'fine' THEN amount ELSE -amount END)",
      "           OVER (PARTITION BY member_id ORDER BY entry_date, entry_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS balance",
      "  FROM fine_ledger",
      "),",
      "crossings AS (",
      "  SELECT member_id, entry_date, balance,",
      "         ROW_NUMBER() OVER (PARTITION BY member_id ORDER BY entry_date, entry_id) AS nth",
      "  FROM running",
      "  WHERE balance >= 500",
      ")",
      "SELECT member_id, entry_date AS blocked_on, balance AS balance_then",
      "FROM crossings",
      "WHERE nth = 1",
      "ORDER BY member_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH bal AS (",
        "  SELECT l.member_id, l.entry_id, l.entry_date,",
        "         (SELECT SUM(IF(x.entry_type = 'fine', x.amount, -x.amount)) FROM fine_ledger x",
        "           WHERE x.member_id = l.member_id AND (x.entry_date < l.entry_date OR (x.entry_date = l.entry_date AND x.entry_id <= l.entry_id))) AS balance",
        "  FROM fine_ledger l",
        ")",
        "SELECT b.member_id, b.entry_date AS blocked_on, b.balance AS balance_then",
        "FROM bal b",
        "WHERE b.balance >= 500",
        "  AND NOT EXISTS (SELECT 1 FROM bal c WHERE c.member_id = b.member_id AND c.balance >= 500",
        "                  AND (c.entry_date < b.entry_date OR (c.entry_date = b.entry_date AND c.entry_id < b.entry_id)))",
        "ORDER BY b.member_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Give each entry a signed amount: positive for a fine, negative for a payment or waiver.",
      "A running `SUM … OVER` in `(entry_date, entry_id)` order is the balance after each entry.",
      "Among the entries whose balance is at least 500, keep only the earliest per member.",
    ],
    editorial: [
      "A balance is a **running total** of signed amounts. `CASE WHEN entry_type = 'fine' THEN amount ELSE -amount END` turns every entry into its effect on the account, and `SUM(...) OVER (PARTITION BY member_id ORDER BY entry_date, entry_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` is the balance right after each entry. The explicit `ROWS` frame matters: with the default `RANGE` frame two entries on the same date would both see each other's amounts. Member 4 in the example fined twice on 14 February shows why — after the first entry the balance is 450, after the second 570.",
      "",
      "Then the question is \"first row meeting a condition\": filter the rows with a balance of 500 or more and number them per member in the same order; row 1 is the crossing. A payment can delay the crossing (member 1 reached ₹450, paid ₹100 and crossed only with the fine of 10 February, at ₹600), only the first crossing is reported, and a member who never reaches 500 has no qualifying rows. Exactly 500 counts, as member 2 shows.",
      "",
      "Without windows, a correlated subquery sums every entry up to and including the current one, and `NOT EXISTS` keeps the crossing with no earlier crossing — quadratic per member, but the same answer.",
    ].join("\n"),
  },

  {
    slug: "median-days-to-close-service-requests",
    title: "Median Days to Close Service Requests by Department",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation", "Dates"],
    description: [
      "Averages hide the long tail of the corporation's service requests, so the commissioner's dashboard shows the **median** number of days a department takes to close a request, `DATEDIFF(closed_on, opened_on)`. With an even number of closed requests the median is the **average of the two middle values**. Requests still open (`closed_on` NULL) are not counted.",
      "",
      "For each department with at least one closed request, return `department`, `closed_requests` and `median_days` **rounded to one decimal**, **ordered by `department`**.",
    ].join("\n"),
    tables: [
      {
        name: "service_requests",
        columns: [
          { name: "request_id", type: "int" },
          { name: "department", type: "varchar" },
          { name: "opened_on", type: "date" },
          { name: "closed_on", type: "date" },
        ],
        primaryKey: ["request_id"],
        note: "One row per citizen service request; `closed_on` is NULL while it is open and never before `opened_on`.",
      },
    ],
    examples: [
      {
        service_requests: [
          [1, "Roads", "2024-04-01", "2024-04-03"],
          [2, "Roads", "2024-04-02", "2024-04-12"],
          [3, "Roads", "2024-04-02", "2024-04-07"],
          [4, "Roads", "2024-04-05", null],
          [5, "Sanitation", "2024-04-01", "2024-04-02"],
          [6, "Sanitation", "2024-04-03", "2024-04-07"],
          [7, "Sanitation", "2024-04-03", "2024-04-30"],
          [8, "Sanitation", "2024-04-06", "2024-04-09"],
          [9, "Water Supply", "2024-04-04", "2024-04-11"],
          [10, "Electricity", "2024-04-04", null],
        ],
      },
    ],
    gen: (rng) => {
      const depts = sample(rng, DEPTS, ri(rng, 1, 4));
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 22);
      const lags = [0, 1, 2, 2, 3, 5, 5, 7, 10, 14, 21, 30];
      return {
        service_requests: seq(1, n).map((id) => {
          const opened = dateBetween(rng, "2024-03-01", "2024-05-31");
          return [id, pick(rng, depts), opened, chance(rng, 0.15) ? null : addDays(opened, pick(rng, lags))];
        }),
      };
    },
    solution: [
      "WITH closed AS (",
      "  SELECT department, DATEDIFF(closed_on, opened_on) AS days",
      "  FROM service_requests",
      "  WHERE closed_on IS NOT NULL",
      "),",
      "ranked AS (",
      "  SELECT department, days,",
      "         ROW_NUMBER() OVER (PARTITION BY department ORDER BY days) AS rn,",
      "         COUNT(*) OVER (PARTITION BY department) AS n",
      "  FROM closed",
      ")",
      "SELECT department, MAX(n) AS closed_requests, ROUND(AVG(days), 1) AS median_days",
      "FROM ranked",
      "WHERE rn IN ((n + 1) DIV 2, (n + 2) DIV 2)",
      "GROUP BY department",
      "ORDER BY department",
    ].join("\n"),
    alternatives: [
      [
        "WITH closed AS (SELECT department, DATEDIFF(closed_on, opened_on) AS days FROM service_requests WHERE closed_on IS NOT NULL),",
        "sizes AS (SELECT department, COUNT(*) AS n FROM closed GROUP BY department)",
        "SELECT a.department, s.n AS closed_requests, ROUND(AVG(DISTINCT a.days), 1) AS median_days",
        "FROM closed a",
        "JOIN sizes s ON s.department = a.department",
        "WHERE (SELECT COUNT(*) FROM closed x WHERE x.department = a.department AND x.days <= a.days) * 2 >= s.n",
        "  AND (SELECT COUNT(*) FROM closed x WHERE x.department = a.department AND x.days >= a.days) * 2 >= s.n",
        "GROUP BY a.department, s.n",
        "ORDER BY a.department",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Compute the days taken per closed request first.",
      "Number each department's values in sorted order and attach the department's count with `COUNT(*) OVER`.",
      "For n values the middle positions are `(n + 1) DIV 2` and `(n + 2) DIV 2` — the same position when n is odd.",
      "Average the one or two middle values.",
    ],
    editorial: [
      "MySQL has no `MEDIAN()`, so the median is built from a sort. Number each department's closing times with `ROW_NUMBER() OVER (PARTITION BY department ORDER BY days)` and attach the department size `n` with `COUNT(*) OVER`. The middle positions are `(n + 1) DIV 2` and `(n + 2) DIV 2`: for n = 3 both are 2, for n = 4 they are 2 and 3. Keeping those rows and averaging them gives the median in both cases. Equal values may be numbered in either order, but they are equal, so the picked values — and the median — do not change.",
      "",
      "In the example Roads has 2, 5 and 10 days (median 5; the open request is ignored) and Sanitation 1, 3, 4 and 27 days (median 3.5) — the 27-day outlier would drag a mean to 8.75, which is why the dashboard wants the median.",
      "",
      "The alternative uses the definition instead of positions: a value is a median candidate when at least half the values are at or below it and at least half at or above it. Only the middle value (odd n) or the two middle values (even n) qualify, so the average of the *distinct* candidates is the median. It is quadratic per department; the window version is one sort.",
    ].join("\n"),
  },

  {
    slug: "donor-retention-by-first-gift-year",
    title: "Donor Retention by First-Gift Year",
    difficulty: "HARD",
    topics: ["Aggregation", "Subqueries", "Dates"],
    description: [
      "An NGO tracks donor retention by **cohort**: a donor's cohort is the calendar year of their **first ever gift**. A donor is **retained** when they also gave at least once in the calendar year **right after** their cohort year.",
      "",
      "For every cohort year, return `cohort_year`, `donors` (donors in the cohort), `retained_next_year` and `retention_pct` = `retained_next_year * 100 / donors` **rounded to 2 decimals**, **ordered by `cohort_year`**. A gift two years later does not count as retention.",
    ].join("\n"),
    tables: [
      {
        name: "contributions",
        columns: [
          { name: "contribution_id", type: "int" },
          { name: "donor_id", type: "int" },
          { name: "amount", type: "int" },
          { name: "contributed_on", type: "date" },
        ],
        primaryKey: ["contribution_id"],
        note: "One row per gift received, in rupees. The NGO's records start in 2023.",
      },
    ],
    examples: [
      {
        contributions: [
          [1, 1, 1000, "2023-03-14"],
          [2, 1, 1500, "2024-03-14"],
          [3, 2, 500, "2023-08-01"],
          [4, 2, 500, "2023-11-01"],
          [5, 2, 800, "2025-01-10"],
          [6, 3, 2000, "2023-12-31"],
          [7, 3, 2000, "2024-01-01"],
          [8, 4, 1200, "2024-05-05"],
          [9, 4, 1200, "2025-05-05"],
          [10, 5, 3000, "2024-09-09"],
          [11, 6, 700, "2025-02-02"],
        ],
      },
    ],
    gen: (rng) => {
      const nd = ri(rng, 1, 14);
      const rows: Cell[][] = [];
      let id = 1;
      for (let d = 1; d <= nd; d++) {
        const first = pick(rng, [2023, 2023, 2024, 2024, 2025]);
        const firstDay = chance(rng, 0.15) ? `${first}-12-31` : dateBetween(rng, `${first}-01-01`, `${first}-12-31`);
        rows.push([id++, d, roundTo(rng, 500, 5000, 500), firstDay]);
        if (chance(rng, 0.3)) rows.push([id++, d, roundTo(rng, 500, 5000, 500), dateBetween(rng, firstDay, `${first}-12-31`)]);
        if (chance(rng, 0.45) && first < 2025) rows.push([id++, d, roundTo(rng, 500, 5000, 500), chance(rng, 0.15) ? `${first + 1}-01-01` : dateBetween(rng, `${first + 1}-01-01`, `${first + 1}-12-31`)]);
        else if (chance(rng, 0.3) && first === 2023) rows.push([id++, d, roundTo(rng, 500, 5000, 500), dateBetween(rng, "2025-01-01", "2025-06-30")]);
      }
      return { contributions: shuffle(rng, rows) };
    },
    solution: [
      "WITH donor_years AS (",
      "  SELECT DISTINCT donor_id, YEAR(contributed_on) AS yr FROM contributions",
      "),",
      "cohorts AS (",
      "  SELECT donor_id, MIN(yr) AS cohort_year FROM donor_years GROUP BY donor_id",
      ")",
      "SELECT c.cohort_year,",
      "       COUNT(*) AS donors,",
      "       COUNT(n.donor_id) AS retained_next_year,",
      "       ROUND(COUNT(n.donor_id) * 100 / COUNT(*), 2) AS retention_pct",
      "FROM cohorts c",
      "LEFT JOIN donor_years n ON n.donor_id = c.donor_id AND n.yr = c.cohort_year + 1",
      "GROUP BY c.cohort_year",
      "ORDER BY c.cohort_year",
    ].join("\n"),
    alternatives: [
      [
        "SELECT cohort_year, COUNT(*) AS donors, SUM(retained) AS retained_next_year, ROUND(SUM(retained) * 100 / COUNT(*), 2) AS retention_pct",
        "FROM (",
        "  SELECT f.donor_id, f.cohort_year,",
        "         CASE WHEN EXISTS (SELECT 1 FROM contributions g WHERE g.donor_id = f.donor_id AND YEAR(g.contributed_on) = f.cohort_year + 1) THEN 1 ELSE 0 END AS retained",
        "  FROM (SELECT donor_id, YEAR(MIN(contributed_on)) AS cohort_year FROM contributions GROUP BY donor_id) f",
        ") t",
        "GROUP BY cohort_year",
        "ORDER BY cohort_year",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Find each donor's cohort: the year of their earliest gift.",
      "Reduce the gifts to distinct (donor, year) pairs so several gifts in a year count once.",
      "LEFT JOIN each donor to their own (donor, cohort_year + 1) pair — a match means retained.",
      "`COUNT(column)` counts only the matches; `COUNT(*)` counts the whole cohort.",
    ],
    editorial: [
      "A cohort report has two steps: assign every donor to a cohort, then measure each cohort. Reducing the gifts to distinct `(donor_id, year)` pairs first keeps both steps simple — a donor's cohort is `MIN(yr)`, and \"gave again next year\" becomes the existence of the pair `(donor_id, cohort_year + 1)`.",
      "",
      "The LEFT JOIN on that pair keeps every cohort member and matches at most one row (the pairs are distinct), so `COUNT(n.donor_id)` is the retained count and `COUNT(*)` the cohort size; the percentage is their ratio, rounded to two places. In the example the 2023 cohort has donors 1, 2 and 3: donor 1 returned in 2024, donor 3 on 1 January 2024 (a gift a day later still counts, because it is a new calendar year), and donor 2 skipped 2024 and came back only in 2025 — not retained.",
      "",
      "The alternative finds the cohort with `YEAR(MIN(contributed_on))` and tests retention with a correlated `EXISTS`, folded into a 0/1 flag. Both are a grouping pass plus one lookup per donor. The newest cohort has no following year yet, so its retention is 0 — a real report would flag it as incomplete.",
    ].join("\n"),
  },

  {
    slug: "blocks-of-three-free-adjacent-concert-seats",
    title: "Blocks of Three or More Free Adjacent Concert Seats",
    difficulty: "HARD",
    topics: ["Window Functions"],
    description: [
      "The ticketing app lets a group book seats together, so the seat-map service needs every **maximal block of consecutive `available` seats** in a row with **at least three seats**. Seats in a row are numbered from 1 with no gaps; a `sold` or `held` seat breaks a block, and blocks never continue from one row or section to another.",
      "",
      "Return `event_id`, `section`, `row_label`, `first_seat`, `last_seat` and `seats_free` for each block, **ordered by `event_id`, `section`, `row_label`, then `first_seat`**.",
    ].join("\n"),
    tables: [
      {
        name: "seat_map",
        columns: [
          { name: "event_id", type: "int" },
          { name: "section", type: "varchar" },
          { name: "row_label", type: "char" },
          { name: "seat_no", type: "int" },
          { name: "status", type: "enum", values: ["available", "sold", "held"] },
        ],
        primaryKey: ["event_id", "section", "row_label", "seat_no"],
        note: "One row per seat of an event's seat map. `held` seats are locked in someone's cart.",
      },
    ],
    examples: [
      {
        seat_map: [
          [1, "Gold", "A", 1, "sold"],
          [1, "Gold", "A", 2, "available"],
          [1, "Gold", "A", 3, "available"],
          [1, "Gold", "A", 4, "available"],
          [1, "Gold", "A", 5, "held"],
          [1, "Gold", "A", 6, "available"],
          [1, "Gold", "B", 1, "available"],
          [1, "Gold", "B", 2, "available"],
          [1, "Silver", "A", 1, "available"],
          [1, "Silver", "A", 2, "available"],
          [1, "Silver", "A", 3, "available"],
          [1, "Silver", "A", 4, "available"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const pFree = pick(rng, [0.45, 0.6, 0.75]);
      for (const ev of sample(rng, [1, 2], ri(rng, 1, 2))) {
        for (const sec of sample(rng, ["Gold", "Silver", "Platinum"], ri(rng, 1, 2))) {
          for (const rl of sample(rng, ["A", "B", "C"], ri(rng, 1, 2))) {
            const len = ri(rng, 2, 8);
            for (let s = 1; s <= len; s++) rows.push([ev, sec, rl, s, chance(rng, pFree) ? "available" : pick(rng, ["sold", "sold", "held"])]);
          }
        }
      }
      return { seat_map: shuffle(rng, rows.slice(0, 30)) };
    },
    solution: [
      "WITH free AS (",
      "  SELECT event_id, section, row_label, seat_no,",
      "         seat_no - ROW_NUMBER() OVER (PARTITION BY event_id, section, row_label ORDER BY seat_no) AS block_key",
      "  FROM seat_map",
      "  WHERE status = 'available'",
      ")",
      "SELECT event_id, section, row_label, MIN(seat_no) AS first_seat, MAX(seat_no) AS last_seat, COUNT(*) AS seats_free",
      "FROM free",
      "GROUP BY event_id, section, row_label, block_key",
      "HAVING COUNT(*) >= 3",
      "ORDER BY event_id, section, row_label, first_seat",
    ].join("\n"),
    alternatives: [
      [
        "WITH free AS (SELECT event_id, section, row_label, seat_no FROM seat_map WHERE status = 'available'),",
        "starts AS (",
        "  SELECT f.* FROM free f WHERE NOT EXISTS (SELECT 1 FROM free p WHERE p.event_id = f.event_id AND p.section = f.section AND p.row_label = f.row_label AND p.seat_no = f.seat_no - 1)",
        "),",
        "ends AS (",
        "  SELECT f.* FROM free f WHERE NOT EXISTS (SELECT 1 FROM free n WHERE n.event_id = f.event_id AND n.section = f.section AND n.row_label = f.row_label AND n.seat_no = f.seat_no + 1)",
        ")",
        "SELECT s.event_id, s.section, s.row_label, s.seat_no AS first_seat, MIN(e.seat_no) AS last_seat, MIN(e.seat_no) - s.seat_no + 1 AS seats_free",
        "FROM starts s",
        "JOIN ends e ON e.event_id = s.event_id AND e.section = s.section AND e.row_label = s.row_label AND e.seat_no >= s.seat_no",
        "GROUP BY s.event_id, s.section, s.row_label, s.seat_no",
        "HAVING MIN(e.seat_no) - s.seat_no + 1 >= 3",
        "ORDER BY s.event_id, s.section, s.row_label, first_seat",
      ].join("\n"),
      [
        "WITH marked AS (",
        "  SELECT event_id, section, row_label, seat_no, status,",
        "         SUM(CASE WHEN status = 'available' THEN 0 ELSE 1 END) OVER (PARTITION BY event_id, section, row_label ORDER BY seat_no ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS breaks",
        "  FROM seat_map",
        ")",
        "SELECT event_id, section, row_label, MIN(seat_no) AS first_seat, MAX(seat_no) AS last_seat, COUNT(*) AS seats_free",
        "FROM marked WHERE status = 'available'",
        "GROUP BY event_id, section, row_label, breaks",
        "HAVING COUNT(*) >= 3",
        "ORDER BY event_id, section, row_label, first_seat",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Only available seats can be in a block; a block lives inside one (event, section, row).",
      "Number the available seats of each row in seat order. Along a block, seat number and row number rise together.",
      "`seat_no - ROW_NUMBER()` is the same for every seat of one block — group by it.",
    ],
    editorial: [
      "Free seats in a block have consecutive numbers, so this is gaps and islands again, partitioned by the physical row: `PARTITION BY event_id, section, row_label`. After keeping the available seats, `seat_no - ROW_NUMBER() OVER (… ORDER BY seat_no)` is constant inside a block and jumps after every sold or held seat, because a skipped seat number raises `seat_no` without raising the row number. Grouping by that key gives each block's first and last seat and its size; `HAVING COUNT(*) >= 3` keeps the bookable ones.",
      "",
      "In the example, Gold A has free seats 2–4 and 6: the block 2–4 qualifies, seat 6 alone does not. Gold B has only two seats, and Silver A is free end to end — one block of four, never split into overlapping blocks of three, because the blocks are maximal.",
      "",
      "Two alternatives: count the non-free seats seen so far with a running `SUM` (every free seat between two breaks shares the count), or find block starts and ends with `NOT EXISTS` and pair each start with the nearest end. The window versions are one sort per row.",
    ].join("\n"),
  },

  {
    slug: "auditorium-bookings-clashing-with-changeover",
    title: "Auditorium Bookings That Clash Once Changeover Is Counted",
    difficulty: "HARD",
    topics: ["Joins", "Dates"],
    description: [
      "A city auditorium needs **two hours of changeover** after every event before the next one may start (stage reset, cleaning, security sweep). Two confirmed bookings of the same venue **clash** when one starts before the other's end time plus two hours, in either direction. A booking that starts exactly two hours after another ends does not clash. Cancelled bookings never clash.",
      "",
      "Return every clashing pair once, as `venue`, `first_booking` and `second_booking` with `first_booking < second_booking` (booking ids), **ordered by `venue`, `first_booking`, then `second_booking`**.",
    ].join("\n"),
    tables: [
      {
        name: "venue_bookings",
        columns: [
          { name: "booking_id", type: "int" },
          { name: "venue", type: "varchar" },
          { name: "organiser", type: "varchar" },
          { name: "starts_at", type: "datetime" },
          { name: "ends_at", type: "datetime" },
          { name: "status", type: "enum", values: ["confirmed", "cancelled"] },
        ],
        primaryKey: ["booking_id"],
        note: "One row per booking request; `ends_at` is always after `starts_at`. Times are on the quarter hour.",
      },
    ],
    examples: [
      {
        venue_bookings: [
          [1, "Town Hall", "Rotary Club", "2025-06-07 10:00:00", "2025-06-07 13:00:00", "confirmed"],
          [2, "Town Hall", "Kala Kendra", "2025-06-07 15:00:00", "2025-06-07 18:00:00", "confirmed"],
          [3, "Town Hall", "Lions Club", "2025-06-07 19:30:00", "2025-06-07 22:00:00", "confirmed"],
          [4, "Town Hall", "Youth Wing", "2025-06-07 12:00:00", "2025-06-07 14:00:00", "cancelled"],
          [5, "Rangashankara", "Theatre Guild", "2025-06-07 09:00:00", "2025-06-07 23:00:00", "confirmed"],
          [6, "Rangashankara", "Dance Academy", "2025-06-07 11:00:00", "2025-06-07 12:30:00", "confirmed"],
          [7, "Rangashankara", "Music Circle", "2025-06-08 00:30:00", "2025-06-08 02:00:00", "confirmed"],
        ],
      },
    ],
    gen: (rng) => {
      const venues = sample(rng, ["Town Hall", "Rangashankara", "Chowdiah Hall", "Ravindra Kalakshetra"], ri(rng, 1, 3));
      const n = ri(rng, 1, 12);
      const rows: Cell[][] = [];
      let prevEnd: number | null = null;
      for (let id = 1; id <= n; id++) {
        // Quarter-hour slots across one weekend; now and then a start exactly two hours after the previous end.
        const startQ: number = prevEnd !== null && chance(rng, 0.25) ? prevEnd + 8 : ri(rng, 0, 4 * 40);
        const endQ = startQ + ri(rng, 4, 16);
        prevEnd = endQ;
        const at = (q: number) => {
          const day = addDays("2025-06-07", Math.floor(q / 96));
          const mins = (q % 96) * 15;
          return `${day} ${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}:00`;
        };
        rows.push([id, pick(rng, venues), pick(rng, ["Rotary Club", "Kala Kendra", "Lions Club", "Theatre Guild"]), at(startQ), at(endQ), chance(rng, 0.15) ? "cancelled" : "confirmed"]);
      }
      return { venue_bookings: rows };
    },
    solution: [
      "SELECT a.venue, a.booking_id AS first_booking, b.booking_id AS second_booking",
      "FROM venue_bookings a",
      "JOIN venue_bookings b",
      "  ON b.venue = a.venue",
      " AND a.booking_id < b.booking_id",
      " AND a.starts_at < DATE_ADD(b.ends_at, INTERVAL 2 HOUR)",
      " AND b.starts_at < DATE_ADD(a.ends_at, INTERVAL 2 HOUR)",
      "WHERE a.status = 'confirmed' AND b.status = 'confirmed'",
      "ORDER BY a.venue, first_booking, second_booking",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.venue, a.booking_id AS first_booking, b.booking_id AS second_booking",
        "FROM venue_bookings a, venue_bookings b",
        "WHERE a.venue = b.venue AND a.booking_id < b.booking_id",
        "  AND a.status = 'confirmed' AND b.status = 'confirmed'",
        "  AND TIMESTAMPDIFF(MINUTE, b.ends_at, a.starts_at) < 120",
        "  AND TIMESTAMPDIFF(MINUTE, a.ends_at, b.starts_at) < 120",
        "ORDER BY a.venue, first_booking, second_booking",
      ].join("\n"),
      [
        "SELECT a.venue, LEAST(a.booking_id, b.booking_id) AS first_booking, GREATEST(a.booking_id, b.booking_id) AS second_booking",
        "FROM venue_bookings a",
        "JOIN venue_bookings b ON b.venue = a.venue AND b.booking_id <> a.booking_id",
        "WHERE a.status = 'confirmed' AND b.status = 'confirmed'",
        "  AND a.starts_at <= b.starts_at",
        "  AND b.starts_at < DATE_ADD(a.ends_at, INTERVAL 2 HOUR)",
        "  AND (a.starts_at < b.starts_at OR a.booking_id < b.booking_id)",
        "ORDER BY a.venue, first_booking, second_booking",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Pair every booking with every other booking of the same venue — a self join.",
      "Two intervals [s1, e1) and [s2, e2) overlap when s1 < e2 and s2 < e1. Here each end is pushed two hours later.",
      "`a.booking_id < b.booking_id` lists each pair once and never pairs a booking with itself.",
    ],
    editorial: [
      "Clash detection is the **interval overlap** test on a self join. Two time ranges overlap exactly when each starts before the other ends: `a.starts_at < b.ends_at AND b.starts_at < a.ends_at`. The changeover rule extends every booking's end by two hours, so the ends become `DATE_ADD(…, INTERVAL 2 HOUR)`. The strict `<` makes a start exactly at end + 2 h legal — Town Hall bookings 1 (ends 13:00) and 2 (starts 15:00) do not clash, while 2 (ends 18:00) and 3 (starts 19:30) do.",
      "",
      "The extended end can cross midnight, which is why the Rangashankara booking at 00:30 the next day clashes with the one ending at 23:00 — comparing full datetimes rather than times of day handles that. Cancelled bookings are filtered on both sides, and `a.booking_id < b.booking_id` emits each unordered pair once.",
      "",
      "The first alternative states the same inequalities in minutes with `TIMESTAMPDIFF`. The second orders each pair by start time instead — the later one must start before the earlier one's extended end — and then names the pair by `LEAST`/`GREATEST` of the ids. The self join is quadratic per venue; real calendars sort by start and compare neighbours, but every clashing pair is still output.",
    ].join("\n"),
  },
];
