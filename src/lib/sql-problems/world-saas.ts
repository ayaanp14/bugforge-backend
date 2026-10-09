import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, atTime, chance, dateBetween, maybeNull, names, pick, ri, roundTo, sample } from "./kit.js";

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);

const COMPANIES = [
  "Zentrix Labs", "Quillpad", "Nimbus Retail", "Kiranakart", "Tiffinly", "Brightdesk", "Orbitpay", "Saffron Analytics",
  "Chaiwala Tech", "Ledgerly", "Pixelforge", "Monsoon Media", "Trekbase", "Udyog Cloud", "Vaani AI", "Greenleaf Foods",
  "Hexagon Logistics", "Mintmark", "Pragati Steel", "Rangoli Studios", "Skyline Realty", "Tarang Health", "Yatra Bus Co", "Zest Fitness",
] as const;
const PLANS = ["free", "starter", "growth", "enterprise"] as const;
const FREE_MAIL = ["gmail.com", "yahoo.com", "outlook.com", "rediffmail.com"] as const;
const WORK_DOMAINS = ["zentrix.io", "quillpad.in", "ledgerly.com", "orbitpay.in", "tiffinly.co", "vaani.ai", "mintmark.com"] as const;
const PRODUCT_EVENTS = ["login", "project_created", "task_added", "file_uploaded", "comment_posted", "report_viewed"] as const;
const FEATURES = ["Kanban Board", "Gantt Chart", "Time Tracking", "Invoicing", "Slack Sync", "AI Summaries", "Custom Fields", "Audit Log"] as const;

const pad = (n: number) => String(n).padStart(2, "0");
/** A 'YYYY-MM-DD HH:MM:SS' on `date` at an exact time. */
const at = (date: string, h: number, m: number, s = 0) => `${date} ${pad(h)}:${pad(m)}:${pad(s)}`;
/** Milliseconds since the epoch of a 'YYYY-MM-DD HH:MM:SS' (read as UTC), and back. */
const tsMs = (ts: string) => Date.parse(`${ts.replace(" ", "T")}Z`);
const msTs = (ms: number) => {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
};

/**
 * SaaS and product analytics — the questions a growth analyst, a finance
 * team or a product manager at a subscription software company is asked:
 * signups and their email domains, activation, DAU/MAU, feature adoption,
 * trials and their conversion, seat-based billing, MRR and its movements,
 * churn, A/B test results, funnels, sessions cut from event gaps, usage
 * streaks and monthly retention cohorts. Easiest first.
 */
export const WORLD_SAAS: SqlProblemSpec[] = [
  {
    slug: "annual-enterprise-accounts-signed-up-in-2024",
    title: "Annual Enterprise Accounts Signed Up in 2024",
    difficulty: "EASY",
    topics: ["Basics", "Dates"],
    description: [
      "The finance team at a project-management SaaS wants to reconcile this year's enterprise contracts with what was billed up front.",
      "",
      "Return every account on the **`enterprise` plan with `annual` billing** whose `signed_up_on` falls in the calendar year **2024**, with the columns `account_id` and `company_name`. Return the rows ordered by `signed_up_on`, then by `account_id`.",
    ].join("\n"),
    tables: [
      {
        name: "accounts",
        columns: [
          { name: "account_id", type: "int" },
          { name: "company_name", type: "varchar" },
          { name: "plan", type: "enum", values: [...PLANS] },
          { name: "billing_cycle", type: "enum", values: ["monthly", "annual"] },
          { name: "signed_up_on", type: "date" },
        ],
        primaryKey: ["account_id"],
        note: "One row per customer account (a company, not a person).",
      },
    ],
    examples: [
      {
        accounts: [
          [1, "Zentrix Labs", "enterprise", "annual", "2024-03-14"],
          [2, "Quillpad", "growth", "annual", "2024-01-09"],
          [3, "Ledgerly", "enterprise", "monthly", "2024-05-02"],
          [4, "Orbitpay", "enterprise", "annual", "2023-12-31"],
          [5, "Vaani AI", "enterprise", "annual", "2024-01-01"],
          [6, "Mintmark", "enterprise", "annual", "2024-03-14"],
          [7, "Tiffinly", "starter", "monthly", "2024-07-20"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 16);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const edge = chance(rng, 0.15);
        const day = edge ? pick(rng, ["2023-12-31", "2024-01-01", "2024-12-31", "2025-01-01"]) : dateBetween(rng, "2023-09-01", "2025-03-31");
        const plan = chance(rng, 0.5) ? "enterprise" : pick(rng, PLANS);
        return [id, pick(rng, COMPANIES), plan, chance(rng, 0.6) ? "annual" : "monthly", day];
      });
      return { accounts: rows };
    },
    solution: [
      "SELECT account_id, company_name",
      "FROM accounts",
      "WHERE plan = 'enterprise'",
      "  AND billing_cycle = 'annual'",
      "  AND signed_up_on >= '2024-01-01' AND signed_up_on < '2025-01-01'",
      "ORDER BY signed_up_on, account_id",
    ].join("\n"),
    alternatives: [
      "SELECT account_id, company_name FROM accounts WHERE plan = 'enterprise' AND billing_cycle = 'annual' AND YEAR(signed_up_on) = 2024 ORDER BY signed_up_on, account_id",
      "SELECT account_id, company_name FROM accounts WHERE plan = 'enterprise' AND billing_cycle = 'annual' AND signed_up_on BETWEEN '2024-01-01' AND '2024-12-31' ORDER BY signed_up_on, account_id",
    ],
    ordered: true,
    hints: [
      "Three conditions must all hold, so they are joined with AND.",
      "A calendar year is a half-open range: on or after 1 January, before 1 January of the next year.",
      "Two accounts can sign up on the same day — the second sort key decides their order.",
    ],
    editorial: [
      "This is a pure filter: keep the rows whose plan is `enterprise`, whose billing cycle is `annual`, and whose signup date lies in 2024, then sort.",
      "",
      "The year test is best written as a **range** — `signed_up_on >= '2024-01-01' AND signed_up_on < '2025-01-01'`. It includes both 1 January and 31 December, and because the column itself is compared (not a function of it), an index on `signed_up_on` can serve it. `YEAR(signed_up_on) = 2024` gives the same rows and reads more naturally, but wraps the column in a function, which stops a plain index from being used on a large table. `BETWEEN '2024-01-01' AND '2024-12-31'` is correct for a `date` column; on a `datetime` column it would miss everything after midnight on 31 December, which is why the half-open range is the habit worth keeping.",
      "",
      "The order is fixed by the statement, and signup dates repeat, so `account_id` breaks ties. The query reads the table once.",
    ].join("\n"),
  },

  {
    slug: "signups-who-never-created-a-project",
    title: "Signups Who Never Created a Project",
    difficulty: "EASY",
    topics: ["Joins"],
    description: [
      "In a task-tracking app a new user is **activated** once they create their first project (the `project_created` event). Users who only logged in or browsed are not activated.",
      "",
      "Return every user who has **never fired a `project_created` event**, with the columns `user_id` and `email`, ordered by `user_id`. A user with no events at all is also in the answer.",
    ].join("\n"),
    tables: [
      {
        name: "users",
        columns: [
          { name: "user_id", type: "int" },
          { name: "email", type: "varchar" },
          { name: "signed_up_at", type: "datetime" },
        ],
        primaryKey: ["user_id"],
        note: "One row per person who created an account.",
      },
      {
        name: "events",
        columns: [
          { name: "event_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "event_name", type: "varchar" },
          { name: "occurred_at", type: "datetime" },
        ],
        primaryKey: ["event_id"],
        note: "The product's event log; `user_id` always names a row of `users`.",
      },
    ],
    examples: [
      {
        users: [
          [11, "aarav@zentrix.io", "2024-08-01 09:10:00"],
          [12, "diya@quillpad.in", "2024-08-01 11:45:00"],
          [13, "kabir@ledgerly.com", "2024-08-02 08:05:00"],
          [14, "meera@vaani.ai", "2024-08-03 17:30:00"],
          [15, "rohan@mintmark.com", "2024-08-03 18:00:00"],
        ],
        events: [
          [1, 11, "login", "2024-08-01 09:11:00"],
          [2, 11, "project_created", "2024-08-01 09:20:00"],
          [3, 12, "login", "2024-08-01 11:46:00"],
          [4, 12, "report_viewed", "2024-08-01 11:50:00"],
          [5, 14, "project_created", "2024-08-03 17:40:00"],
          [6, 14, "project_created", "2024-08-04 10:00:00"],
          [7, 13, "login", "2024-08-02 08:06:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const ids = sample(rng, seq(10, 40), n).sort((a, b) => a - b);
      const users: Cell[][] = ids.map((id) => {
        const who = pick(rng, names(rng, 1)).toLowerCase();
        return [id, `${who}${id}@${pick(rng, WORK_DOMAINS)}`, atTime(rng, dateBetween(rng, "2024-08-01", "2024-08-10"))];
      });
      const createRate = pick(rng, [0, 0.2, 0.4, 0.6]);
      const events: Cell[][] = [];
      let eid = 1;
      for (const id of ids) {
        const k = chance(rng, 0.2) ? 0 : ri(rng, 1, 3);
        for (let j = 0; j < k; j++) {
          const name = chance(rng, createRate) ? "project_created" : pick(rng, PRODUCT_EVENTS);
          events.push([eid++, id, name, atTime(rng, dateBetween(rng, "2024-08-01", "2024-08-15"))]);
        }
      }
      return { users, events };
    },
    solution: [
      "SELECT u.user_id, u.email",
      "FROM users u",
      "LEFT JOIN events e",
      "  ON e.user_id = u.user_id AND e.event_name = 'project_created'",
      "WHERE e.event_id IS NULL",
      "ORDER BY u.user_id",
    ].join("\n"),
    alternatives: [
      "SELECT user_id, email FROM users u WHERE NOT EXISTS (SELECT 1 FROM events e WHERE e.user_id = u.user_id AND e.event_name = 'project_created') ORDER BY user_id",
      "SELECT user_id, email FROM users WHERE user_id NOT IN (SELECT user_id FROM events WHERE event_name = 'project_created') ORDER BY user_id",
    ],
    ordered: true,
    hints: [
      "Start from `users`: every row of the answer is a user, including users with no events.",
      "A LEFT JOIN keeps a user with no matching event, filling the event's columns with NULL.",
      "Where does the `event_name = 'project_created'` condition belong — in the ON clause or in WHERE? Try both on a user who only logged in.",
    ],
    editorial: [
      "This is an anti join with a condition on the other side. LEFT JOIN `events` to `users`, but only the `project_created` events: the condition `e.event_name = 'project_created'` goes **in the ON clause**, so a user whose events are all logins finds no partner and keeps one row of NULLs. Then `WHERE e.event_id IS NULL` keeps exactly those users.",
      "",
      "Putting the event-name test in WHERE instead is the classic slip: the LEFT JOIN would first pair the user with their login rows, and the WHERE would then throw those rows away — the user disappears from the answer, although they were never activated. Users with no events at all survive either way, which is why the mistake hides on small data.",
      "",
      "`NOT EXISTS` with the same two conditions says it directly. `NOT IN` is safe here because `events.user_id` is never NULL; if it could be, one NULL in the list would empty the answer. Each form is one index lookup per user on `(user_id, event_name)`.",
    ].join("\n"),
  },

  {
    slug: "daily-active-users-from-the-event-log",
    title: "Daily Active Users From the Event Log",
    difficulty: "EASY",
    topics: ["Aggregation", "Dates"],
    description: [
      "The growth dashboard plots **DAU** — the number of distinct users who did something in the product on a day. A `push_delivered` event is logged when the app receives a notification, without the user doing anything, so it **does not make a user active**.",
      "",
      "Return one row per calendar day that has at least one counted event, with the columns `activity_date` (the day, 'YYYY-MM-DD') and `dau`, ordered by `activity_date`. A user with several events on a day counts once.",
    ].join("\n"),
    tables: [
      {
        name: "events",
        columns: [
          { name: "event_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "event_name", type: "varchar" },
          { name: "occurred_at", type: "datetime" },
        ],
        primaryKey: ["event_id"],
        note: "One row per event the app logged, with the moment it happened.",
      },
    ],
    examples: [
      {
        events: [
          [1, 7, "login", "2024-09-02 08:15:00"],
          [2, 7, "task_added", "2024-09-02 08:20:00"],
          [3, 9, "login", "2024-09-02 23:59:00"],
          [4, 12, "push_delivered", "2024-09-02 10:00:00"],
          [5, 9, "comment_posted", "2024-09-03 00:01:00"],
          [6, 12, "push_delivered", "2024-09-03 10:00:00"],
          [7, 12, "login", "2024-09-04 19:30:00"],
          [8, 7, "report_viewed", "2024-09-04 21:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      const users = seq(1, ri(rng, 1, 8));
      const rows: Cell[][] = seq(1, n).map((id) => {
        const day = dateBetween(rng, "2024-09-01", "2024-09-06");
        const edge = chance(rng, 0.15);
        return [id, pick(rng, users), chance(rng, 0.2) ? "push_delivered" : pick(rng, PRODUCT_EVENTS), edge ? at(day, pick(rng, [0, 23]), pick(rng, [0, 59])) : atTime(rng, day)];
      });
      return { events: rows };
    },
    solution: [
      "SELECT DATE(occurred_at) AS activity_date, COUNT(DISTINCT user_id) AS dau",
      "FROM events",
      "WHERE event_name <> 'push_delivered'",
      "GROUP BY DATE(occurred_at)",
      "ORDER BY activity_date",
    ].join("\n"),
    alternatives: [
      "SELECT DATE_FORMAT(occurred_at, '%Y-%m-%d') AS activity_date, COUNT(DISTINCT user_id) AS dau FROM events WHERE event_name <> 'push_delivered' GROUP BY DATE_FORMAT(occurred_at, '%Y-%m-%d') ORDER BY activity_date",
      "SELECT d AS activity_date, COUNT(*) AS dau FROM (SELECT DISTINCT LEFT(occurred_at, 10) AS d, user_id FROM events WHERE event_name <> 'push_delivered') x GROUP BY d ORDER BY d",
    ],
    ordered: true,
    hints: [
      "The timestamp carries a time of day; group by the date part only.",
      "Remove the passive event before grouping, so a day with only notifications produces no row.",
      "COUNT(DISTINCT …) counts a user once however many events they fired that day.",
    ],
    editorial: [
      "DAU is a distinct count per day. Reduce each timestamp to its date — `DATE(occurred_at)` — so that 08:15 and 23:59 on the same day fall in one group, filter out `push_delivered` in WHERE, group by the date and count `DISTINCT user_id`.",
      "",
      "The filter has to happen **before** grouping. A day on which the only events were notifications then has no rows left and produces no output row, which is what \"at least one counted event\" asks for; a user who received a push and also logged in still counts through the login.",
      "",
      "Midnight is a real boundary: an event at 00:01 belongs to the next day even if the user's session started the night before. `DATE_FORMAT(occurred_at, '%Y-%m-%d')` or taking the first ten characters give the same key. Deduplicating `(day, user)` pairs first and counting rows is the same distinct count written in two steps. The cost is one scan plus a sort or hash on the day.",
    ].join("\n"),
  },

  {
    slug: "signups-by-work-email-domain",
    title: "Signups by Work Email Domain",
    difficulty: "EASY",
    topics: ["Strings", "Aggregation"],
    description: [
      "Sales wants to spot companies where several employees signed up on their own — a sign the team is ready for a business plan. Free mailboxes say nothing about the company, so signups at **gmail.com, yahoo.com, outlook.com and rediffmail.com are ignored**.",
      "",
      "Return each remaining email domain (the part after `@`) with **at least two signups**, in the columns `domain` and `signups`, ordered by `signups` descending, then `domain` ascending. Every email is lower-case and has exactly one `@`.",
    ].join("\n"),
    tables: [
      {
        name: "signups",
        columns: [
          { name: "user_id", type: "int" },
          { name: "email", type: "varchar" },
          { name: "signed_up_on", type: "date" },
        ],
        primaryKey: ["user_id"],
        note: "One row per self-serve signup.",
      },
    ],
    examples: [
      {
        signups: [
          [1, "priya@quillpad.in", "2024-04-01"],
          [2, "rahul@gmail.com", "2024-04-01"],
          [3, "sneha@quillpad.in", "2024-04-03"],
          [4, "dev@vaani.ai", "2024-04-04"],
          [5, "zara@gmail.com", "2024-04-05"],
          [6, "ira@ledgerly.com", "2024-04-05"],
          [7, "karan@ledgerly.com", "2024-04-07"],
          [8, "tanvi@quillpad.in", "2024-04-08"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 20);
      const domains = sample(rng, WORK_DOMAINS, ri(rng, 1, 5));
      const rows: Cell[][] = seq(1, n).map((id) => {
        const who = pick(rng, names(rng, 1)).toLowerCase();
        const dom = chance(rng, 0.35) ? pick(rng, FREE_MAIL) : pick(rng, domains);
        return [id, `${who}.${id}@${dom}`, dateBetween(rng, "2024-04-01", "2024-04-30")];
      });
      return { signups: rows };
    },
    solution: [
      "SELECT SUBSTRING_INDEX(email, '@', -1) AS domain, COUNT(*) AS signups",
      "FROM signups",
      "WHERE SUBSTRING_INDEX(email, '@', -1) NOT IN ('gmail.com', 'yahoo.com', 'outlook.com', 'rediffmail.com')",
      "GROUP BY SUBSTRING_INDEX(email, '@', -1)",
      "HAVING COUNT(*) >= 2",
      "ORDER BY signups DESC, domain",
    ].join("\n"),
    alternatives: [
      "SELECT domain, COUNT(*) AS signups FROM (SELECT SUBSTRING(email, LOCATE('@', email) + 1) AS domain FROM signups) d WHERE domain NOT IN ('gmail.com', 'yahoo.com', 'outlook.com', 'rediffmail.com') GROUP BY domain HAVING COUNT(*) >= 2 ORDER BY signups DESC, domain",
      "SELECT RIGHT(email, CHAR_LENGTH(email) - INSTR(email, '@')) AS domain, COUNT(*) AS signups FROM signups GROUP BY RIGHT(email, CHAR_LENGTH(email) - INSTR(email, '@')) HAVING COUNT(*) >= 2 AND domain NOT IN ('gmail.com', 'yahoo.com', 'outlook.com', 'rediffmail.com') ORDER BY signups DESC, domain",
    ],
    ordered: true,
    hints: [
      "Cut the domain out of the email first: everything after the `@`.",
      "Group by that expression and count; a condition on the count belongs in HAVING.",
      "The free mailboxes can be removed before grouping (WHERE) or after (HAVING) — both work, one is cheaper.",
    ],
    editorial: [
      "Each signup is reduced to its domain, and the domains are counted. `SUBSTRING_INDEX(email, '@', -1)` returns everything after the last `@`, which with exactly one `@` is the domain. `SUBSTRING(email, LOCATE('@', email) + 1)` gets the same text by position.",
      "",
      "Removing the free mailboxes in WHERE drops those rows before grouping, so the database never builds a `gmail.com` group only to discard it; doing it in HAVING on the grouped domain gives the same answer. The \"at least two\" condition is about the group's size, so it can only be in HAVING.",
      "",
      "The order has two keys because counts tie: two domains with two signups each are ordered alphabetically. The query is one scan and a hash on the domain. In a real table the emails would be stored lower-case precisely so a grouping like this never splits `Quillpad.in` from `quillpad.in`.",
    ].join("\n"),
  },

  {
    slug: "workspace-seat-utilisation-status",
    title: "Workspace Seat Utilisation Status",
    difficulty: "EASY",
    topics: ["Conditional Logic", "Basics"],
    description: [
      "A seat-based collaboration tool sells each workspace a number of seats. Customer success labels every workspace by how its active members compare with its purchased seats:",
      "",
      "- `over_limit` when `seats_active` is **greater than** `seats_purchased`;",
      "- `full` when they are **equal**;",
      "- `underused` when fewer than half the seats are in use (`seats_active * 2 < seats_purchased`);",
      "- `healthy` otherwise.",
      "",
      "Return `workspace_id`, `workspace_name` and `seat_status` for every workspace, in any order.",
    ].join("\n"),
    tables: [
      {
        name: "workspaces",
        columns: [
          { name: "workspace_id", type: "int" },
          { name: "workspace_name", type: "varchar" },
          { name: "seats_purchased", type: "int" },
          { name: "seats_active", type: "int" },
        ],
        primaryKey: ["workspace_id"],
        note: "One row per paying workspace; `seats_active` counts members who are not deactivated.",
      },
    ],
    examples: [
      {
        workspaces: [
          [1, "Zentrix Labs", 25, 27],
          [2, "Quillpad", 10, 10],
          [3, "Ledgerly", 50, 12],
          [4, "Orbitpay", 20, 10],
          [5, "Vaani AI", 8, 5],
          [6, "Tiffinly", 40, 19],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const bought = roundTo(rng, 5, 60, 5);
        const kind = ri(rng, 0, 4);
        const active = kind === 0 ? bought + ri(rng, 1, 4) : kind === 1 ? bought : kind === 2 ? bought / 5 * 2 + (chance(rng, 0.5) ? 0 : ri(rng, 0, 2)) : ri(rng, 0, bought);
        return [id, pick(rng, COMPANIES), bought, Math.max(0, Math.round(active))];
      });
      return { workspaces: rows };
    },
    solution: [
      "SELECT workspace_id, workspace_name,",
      "       CASE",
      "         WHEN seats_active > seats_purchased THEN 'over_limit'",
      "         WHEN seats_active = seats_purchased THEN 'full'",
      "         WHEN seats_active * 2 < seats_purchased THEN 'underused'",
      "         ELSE 'healthy'",
      "       END AS seat_status",
      "FROM workspaces",
    ].join("\n"),
    alternatives: [
      "SELECT workspace_id, workspace_name, IF(seats_active > seats_purchased, 'over_limit', IF(seats_active = seats_purchased, 'full', IF(seats_active * 2 < seats_purchased, 'underused', 'healthy'))) AS seat_status FROM workspaces",
      "SELECT workspace_id, workspace_name, 'over_limit' AS seat_status FROM workspaces WHERE seats_active > seats_purchased UNION ALL SELECT workspace_id, workspace_name, 'full' FROM workspaces WHERE seats_active = seats_purchased UNION ALL SELECT workspace_id, workspace_name, 'underused' FROM workspaces WHERE seats_active * 2 < seats_purchased UNION ALL SELECT workspace_id, workspace_name, 'healthy' FROM workspaces WHERE seats_active < seats_purchased AND seats_active * 2 >= seats_purchased",
    ],
    hints: [
      "One label per row from several conditions is a CASE expression.",
      "CASE stops at the first true branch, so the order of the branches matters.",
      "Exactly half the seats in use is not \"fewer than half\" — check which label it gets.",
    ],
    editorial: [
      "Every workspace gets exactly one label, computed from its own row, so this is a `CASE` in the select list with no grouping or joining.",
      "",
      "The branches are tested **in order** and the first true one wins. Testing `over_limit` and `full` first means the `underused` branch only ever sees workspaces with spare seats, and `healthy` is whatever is left. Writing the half-rule as `seats_active * 2 < seats_purchased` keeps the arithmetic in integers, so 10 of 20 seats (exactly half) is `healthy` and 9 of 20 is `underused` — no rounding question arises.",
      "",
      "A nested `IF` is the MySQL shorthand for the same chain. The `UNION ALL` version spells each label as its own filter; it is correct only because the four conditions are made mutually exclusive by hand, which is exactly the bookkeeping CASE does for you. All are a single scan.",
    ].join("\n"),
  },

  {
    slug: "active-subscriptions-above-average-mrr",
    title: "Active Subscriptions Above the Average MRR",
    difficulty: "EASY",
    topics: ["Subqueries", "Basics"],
    description: [
      "Account managers are assigned to the larger customers. A subscription is large when its monthly recurring revenue (`mrr`, in rupees) is **strictly above the average MRR of active subscriptions**; cancelled and paused subscriptions neither count towards the average nor appear in the answer.",
      "",
      "Return `subscription_id`, `account_name` and `mrr`, ordered by `mrr` descending, then `subscription_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "subscriptions",
        columns: [
          { name: "subscription_id", type: "int" },
          { name: "account_name", type: "varchar" },
          { name: "plan", type: "enum", values: ["starter", "growth", "enterprise"] },
          { name: "mrr", type: "int" },
          { name: "status", type: "enum", values: ["active", "paused", "cancelled"] },
        ],
        primaryKey: ["subscription_id"],
        note: "One row per subscription; `mrr` is the monthly amount billed in rupees.",
      },
    ],
    examples: [
      {
        subscriptions: [
          [101, "Zentrix Labs", "enterprise", 85000, "active"],
          [102, "Quillpad", "starter", 4999, "active"],
          [103, "Ledgerly", "growth", 24999, "active"],
          [104, "Orbitpay", "enterprise", 120000, "cancelled"],
          [105, "Vaani AI", "growth", 39999, "active"],
          [106, "Tiffinly", "growth", 39999, "active"],
          [107, "Mintmark", "starter", 4999, "paused"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 15);
      const prices: Record<string, number[]> = { starter: [2999, 4999], growth: [19999, 24999, 39999], enterprise: [85000, 120000, 150000] };
      const rows: Cell[][] = seq(101, n).map((id) => {
        const plan = pick(rng, ["starter", "growth", "enterprise"] as const);
        return [id, pick(rng, COMPANIES), plan, pick(rng, prices[plan]!), chance(rng, 0.7) ? "active" : pick(rng, ["paused", "cancelled"])];
      });
      return { subscriptions: rows };
    },
    solution: [
      "SELECT subscription_id, account_name, mrr",
      "FROM subscriptions",
      "WHERE status = 'active'",
      "  AND mrr > (SELECT AVG(mrr) FROM subscriptions WHERE status = 'active')",
      "ORDER BY mrr DESC, subscription_id",
    ].join("\n"),
    alternatives: [
      "SELECT s.subscription_id, s.account_name, s.mrr FROM subscriptions s CROSS JOIN (SELECT AVG(mrr) AS avg_mrr FROM subscriptions WHERE status = 'active') a WHERE s.status = 'active' AND s.mrr > a.avg_mrr ORDER BY s.mrr DESC, s.subscription_id",
      "WITH a AS (SELECT SUM(mrr) AS total, COUNT(*) AS n FROM subscriptions WHERE status = 'active') SELECT s.subscription_id, s.account_name, s.mrr FROM subscriptions s, a WHERE s.status = 'active' AND s.mrr * a.n > a.total ORDER BY s.mrr DESC, s.subscription_id",
    ],
    ordered: true,
    hints: [
      "The average is one number computed over a subset of the table — a scalar subquery.",
      "The status filter must appear twice: once for the average, once for the rows returned.",
      "A subscription exactly at the average is not above it.",
    ],
    editorial: [
      "The comparison value is a single number — the mean MRR of active subscriptions — so it is a **scalar subquery**: `(SELECT AVG(mrr) FROM subscriptions WHERE status = 'active')`. The outer query keeps the active subscriptions strictly above it and sorts.",
      "",
      "The status filter is needed in both places, and they mean different things. Inside the subquery it decides which rows form the average (a cancelled ₹1,20,000 contract would otherwise pull it up); outside it decides which rows may be returned. Forgetting either gives a different answer.",
      "",
      "The subquery does not depend on the outer row, so it is computed once. Joining a one-row derived table is the same plan written as a join. The third version avoids the average's decimals altogether by comparing `mrr * count > total`, which is exact in integers — a useful trick when ratios worry you. If no subscription is active the average is NULL, the comparison is never true, and the answer is empty.",
    ].join("\n"),
  },

  {
    slug: "free-trials-ending-within-a-week",
    title: "Free Trials Ending Within a Week",
    difficulty: "EASY",
    topics: ["Dates", "Basics"],
    description: [
      "Every Monday the lifecycle team emails workspaces whose 14-day trial is about to run out. Today is **2024-06-10**. A trial is in the campaign when it has **not converted** (`converted_on` is NULL) and its `ends_on` is **from today up to and including 2024-06-17**.",
      "",
      "Return `trial_id`, `workspace_name` and `days_left` (whole days from 2024-06-10 to `ends_on`, so a trial ending today has 0), ordered by `days_left`, then `trial_id`.",
    ].join("\n"),
    tables: [
      {
        name: "trials",
        columns: [
          { name: "trial_id", type: "int" },
          { name: "workspace_name", type: "varchar" },
          { name: "started_on", type: "date" },
          { name: "ends_on", type: "date" },
          { name: "converted_on", type: "date" },
        ],
        primaryKey: ["trial_id"],
        note: "One row per trial; `converted_on` is the day the workspace started paying, or NULL if it has not.",
      },
    ],
    examples: [
      {
        trials: [
          [1, "Zentrix Labs", "2024-05-27", "2024-06-10", null],
          [2, "Quillpad", "2024-05-30", "2024-06-13", null],
          [3, "Ledgerly", "2024-05-30", "2024-06-13", "2024-06-05"],
          [4, "Orbitpay", "2024-06-03", "2024-06-17", null],
          [5, "Vaani AI", "2024-06-04", "2024-06-18", null],
          [6, "Tiffinly", "2024-05-26", "2024-06-09", null],
          [7, "Mintmark", "2024-05-31", "2024-06-14", null],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 15);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const end = chance(rng, 0.2) ? pick(rng, ["2024-06-09", "2024-06-10", "2024-06-17", "2024-06-18"]) : dateBetween(rng, "2024-06-05", "2024-06-22");
        const start = addDays(end, -14);
        const conv = chance(rng, 0.3) ? dateBetween(rng, start, "2024-06-09") : null;
        return [id, pick(rng, COMPANIES), start, end, conv];
      });
      return { trials: rows };
    },
    solution: [
      "SELECT trial_id, workspace_name, DATEDIFF(ends_on, '2024-06-10') AS days_left",
      "FROM trials",
      "WHERE converted_on IS NULL",
      "  AND ends_on BETWEEN '2024-06-10' AND '2024-06-17'",
      "ORDER BY days_left, trial_id",
    ].join("\n"),
    alternatives: [
      "SELECT trial_id, workspace_name, DATEDIFF(ends_on, '2024-06-10') AS days_left FROM trials WHERE converted_on IS NULL AND DATEDIFF(ends_on, '2024-06-10') BETWEEN 0 AND 7 ORDER BY days_left, trial_id",
      "SELECT trial_id, workspace_name, TIMESTAMPDIFF(DAY, '2024-06-10', ends_on) AS days_left FROM trials WHERE converted_on IS NULL AND ends_on >= '2024-06-10' AND ends_on <= DATE_ADD('2024-06-10', INTERVAL 7 DAY) ORDER BY days_left, trial_id",
    ],
    ordered: true,
    hints: [
      "Not converted means the conversion date is missing — test it with IS NULL, not `= NULL`.",
      "Both ends of the window are inclusive.",
      "DATEDIFF(later, earlier) counts whole days between two dates.",
    ],
    editorial: [
      "Two filters and one computed column. `converted_on IS NULL` keeps the trials that have not paid — `= NULL` would match nothing, because a comparison with NULL is unknown. The window is today through seven days from now, both inclusive, so `ends_on BETWEEN '2024-06-10' AND '2024-06-17'`; a trial that ended yesterday is too late for the email and one ending on the 18th waits for next week.",
      "",
      "`DATEDIFF(ends_on, '2024-06-10')` gives whole days remaining, 0 for a trial ending today. Filtering on that difference being between 0 and 7 is equivalent; comparing the column directly is the index-friendly form. `TIMESTAMPDIFF(DAY, a, b)` is the same count with the arguments in the other order — a frequent source of negative numbers.",
      "",
      "Days left repeat, so `trial_id` breaks ties. One scan of the table.",
    ].join("\n"),
  },

  {
    slug: "feature-adoption-including-unused-features",
    title: "Feature Adoption, Including Features Nobody Used",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation"],
    description: [
      "The product team reviews adoption of every shipped feature, and a feature **nobody has used yet must still appear** with 0 — those are the ones to fix or retire.",
      "",
      "Return `feature_name` and `adopters`, the number of **distinct users** who used the feature at least once, for every row of `features`. Order by `adopters` descending, then `feature_name` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "features",
        columns: [
          { name: "feature_id", type: "int" },
          { name: "feature_name", type: "varchar" },
          { name: "launched_on", type: "date" },
        ],
        primaryKey: ["feature_id"],
        note: "One row per feature that has shipped.",
      },
      {
        name: "feature_usage",
        columns: [
          { name: "usage_id", type: "int" },
          { name: "feature_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "used_at", type: "datetime" },
        ],
        primaryKey: ["usage_id"],
        note: "One row each time a user used a feature; `feature_id` always names a row of `features`.",
      },
    ],
    examples: [
      {
        features: [
          [1, "Kanban Board", "2024-01-15"],
          [2, "Time Tracking", "2024-03-01"],
          [3, "AI Summaries", "2024-06-20"],
          [4, "Audit Log", "2024-07-01"],
        ],
        feature_usage: [
          [1, 1, 21, "2024-07-02 10:00:00"],
          [2, 1, 22, "2024-07-02 11:30:00"],
          [3, 1, 21, "2024-07-03 09:00:00"],
          [4, 2, 23, "2024-07-03 12:15:00"],
          [5, 3, 21, "2024-07-04 16:40:00"],
          [6, 3, 24, "2024-07-05 08:20:00"],
          [7, 2, 23, "2024-07-05 18:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const feats = sample(rng, FEATURES, ri(rng, 1, 6)).map((name, i) => [i + 1, name, dateBetween(rng, "2024-01-01", "2024-06-30")] as Cell[]);
      const m = chance(rng, 0.1) ? 0 : ri(rng, 1, 20);
      const usedFeats = sample(rng, feats.map((f) => f[0] as number), ri(rng, 1, feats.length));
      const rows: Cell[][] = seq(1, m).map((id) => [id, pick(rng, usedFeats), ri(rng, 20, 27), atTime(rng, dateBetween(rng, "2024-07-01", "2024-07-31"))]);
      return { features: feats, feature_usage: rows };
    },
    solution: [
      "SELECT f.feature_name, COUNT(DISTINCT u.user_id) AS adopters",
      "FROM features f",
      "LEFT JOIN feature_usage u ON u.feature_id = f.feature_id",
      "GROUP BY f.feature_id, f.feature_name",
      "ORDER BY adopters DESC, f.feature_name",
    ].join("\n"),
    alternatives: [
      "SELECT f.feature_name, (SELECT COUNT(DISTINCT u.user_id) FROM feature_usage u WHERE u.feature_id = f.feature_id) AS adopters FROM features f ORDER BY adopters DESC, f.feature_name",
      "SELECT f.feature_name, COALESCE(a.n, 0) AS adopters FROM features f LEFT JOIN (SELECT feature_id, COUNT(DISTINCT user_id) AS n FROM feature_usage GROUP BY feature_id) a ON a.feature_id = f.feature_id ORDER BY adopters DESC, f.feature_name",
    ],
    ordered: true,
    hints: [
      "Every feature must appear, so the feature table is the left side of an outer join.",
      "COUNT of a column ignores NULLs — what does a feature with no usage contribute?",
      "Count users, not usage rows: one user using a feature five times is one adopter.",
    ],
    editorial: [
      "Start from `features` and LEFT JOIN `feature_usage`, so a feature without any usage survives as one row whose usage columns are NULL. Group by the feature and count `DISTINCT u.user_id`. Because `COUNT(column)` skips NULLs, the unused feature counts **0** rather than 1 — `COUNT(*)` would count its single NULL-padded row and report one adopter that does not exist.",
      "",
      "`DISTINCT` turns usage rows into people: user 21 using the Kanban board twice is one adopter. Grouping by `feature_id` as well as the name keeps two features that happened to share a name apart.",
      "",
      "A correlated subquery per feature gives the same count, and aggregating the usage table first then LEFT JOINing it needs `COALESCE(…, 0)` because the missing features get NULL from the join. Pre-aggregating is often the fastest plan on a big log: one pass over usage, then a small join.",
    ].join("\n"),
  },

  // ───────────────────────────── MEDIUM ─────────────────────────────

  {
    slug: "days-from-signup-to-first-captured-payment",
    title: "Days From Signup to First Captured Payment",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Dates"],
    description: [
      "Finance measures how long a new account takes to start paying. Only a payment with status **`captured`** counts — a `failed` charge never reached the bank and a `refunded` one was given back.",
      "",
      "For every account with at least one captured payment, return `account_id`, `company_name`, `first_paid_on` (the date of its earliest captured payment) and `days_to_first_payment` (whole days from `signed_up_on` to `first_paid_on`). Accounts that never paid are left out. Order by `days_to_first_payment`, then `account_id`.",
    ].join("\n"),
    tables: [
      {
        name: "accounts",
        columns: [
          { name: "account_id", type: "int" },
          { name: "company_name", type: "varchar" },
          { name: "signed_up_on", type: "date" },
        ],
        primaryKey: ["account_id"],
        note: "One row per customer account.",
      },
      {
        name: "payments",
        columns: [
          { name: "payment_id", type: "int" },
          { name: "account_id", type: "int" },
          { name: "paid_on", type: "date" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["captured", "failed", "refunded"] },
        ],
        primaryKey: ["payment_id"],
        note: "Every charge attempt made through the payment gateway, in rupees.",
      },
    ],
    examples: [
      {
        accounts: [
          [1, "Zentrix Labs", "2024-03-01"],
          [2, "Quillpad", "2024-03-05"],
          [3, "Ledgerly", "2024-03-10"],
          [4, "Orbitpay", "2024-03-12"],
          [5, "Vaani AI", "2024-03-15"],
        ],
        payments: [
          [1, 1, "2024-03-15", 4999, "failed"],
          [2, 1, "2024-03-16", 4999, "captured"],
          [3, 1, "2024-04-16", 4999, "captured"],
          [4, 2, "2024-03-05", 24999, "captured"],
          [5, 3, "2024-03-20", 4999, "refunded"],
          [6, 4, "2024-04-01", 4999, "failed"],
          [7, 5, "2024-03-29", 39999, "captured"],
          [8, 3, "2024-04-02", 4999, "captured"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const accounts: Cell[][] = seq(1, n).map((id) => [id, pick(rng, COMPANIES), dateBetween(rng, "2024-01-01", "2024-03-31")]);
      const payments: Cell[][] = [];
      let pid = 1;
      for (const a of accounts) {
        const k = chance(rng, 0.2) ? 0 : ri(rng, 1, 3);
        for (let j = 0; j < k; j++) {
          const day = chance(rng, 0.15) ? (a[2] as string) : addDays(a[2] as string, ri(rng, 0, 60));
          payments.push([pid++, a[0]!, day, pick(rng, [4999, 24999, 39999]), chance(rng, 0.6) ? "captured" : pick(rng, ["failed", "refunded"])]);
        }
      }
      return { accounts, payments };
    },
    solution: [
      "SELECT a.account_id, a.company_name,",
      "       MIN(p.paid_on) AS first_paid_on,",
      "       DATEDIFF(MIN(p.paid_on), a.signed_up_on) AS days_to_first_payment",
      "FROM accounts a",
      "JOIN payments p ON p.account_id = a.account_id AND p.status = 'captured'",
      "GROUP BY a.account_id, a.company_name, a.signed_up_on",
      "ORDER BY days_to_first_payment, a.account_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH firsts AS (",
        "  SELECT account_id, paid_on, ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY paid_on, payment_id) AS rn",
        "  FROM payments WHERE status = 'captured'",
        ")",
        "SELECT a.account_id, a.company_name, f.paid_on AS first_paid_on, DATEDIFF(f.paid_on, a.signed_up_on) AS days_to_first_payment",
        "FROM accounts a JOIN firsts f ON f.account_id = a.account_id AND f.rn = 1",
        "ORDER BY days_to_first_payment, a.account_id",
      ].join("\n"),
      [
        "SELECT account_id, company_name, first_paid_on, DATEDIFF(first_paid_on, signed_up_on) AS days_to_first_payment",
        "FROM (SELECT a.*, (SELECT MIN(paid_on) FROM payments p WHERE p.account_id = a.account_id AND p.status = 'captured') AS first_paid_on FROM accounts a) x",
        "WHERE first_paid_on IS NOT NULL",
        "ORDER BY days_to_first_payment, account_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Restrict the payments to captured ones before looking for the earliest.",
      "The earliest payment per account is a MIN over a group.",
      "An inner join already drops the accounts with no captured payment.",
      "DATEDIFF(later, earlier) returns whole days.",
    ],
    editorial: [
      "Join each account to its **captured** payments, group by account, and take `MIN(paid_on)` — the first time money actually arrived. `DATEDIFF(MIN(p.paid_on), a.signed_up_on)` turns that into days; an account that paid on its signup day scores 0.",
      "",
      "Where the status filter sits matters. In the join condition (or WHERE — with an inner join they are the same), it removes failed and refunded attempts before the minimum is taken, so Ledgerly's refunded charge on 20 March does not count and its first payment is 2 April. Without it, a failed card on day 14 would look like a conversion.",
      "",
      "An inner join is what leaves out accounts that never paid: Orbitpay has only a failed charge, so no captured row joins and it has no group. `signed_up_on` is listed in GROUP BY because the select list uses it outside an aggregate — it is functionally determined by the key, but MySQL's ONLY_FULL_GROUP_BY wants it named.",
      "",
      "A `ROW_NUMBER()` per account picks the first captured payment row (useful if you also want its amount), and a correlated `MIN` subquery per account does the same lookup row by row. With an index on `(account_id, status, paid_on)` each is a short range scan per account.",
    ].join("\n"),
  },

  {
    slug: "pricing-page-ab-test-conversion-by-variant",
    title: "Pricing Page A/B Test Conversion by Variant",
    difficulty: "MEDIUM",
    topics: ["Conditional Logic", "Joins", "Aggregation"],
    description: [
      "The growth team ran the experiment `pricing_page_v2`, splitting users between a `control` and a `treatment` pricing page. A user **converted** in the test when they have at least one conversion **at or after the moment they were assigned**; a purchase before assignment was not caused by the page, and a second purchase still counts the user once. Assignments to other experiments are irrelevant.",
      "",
      "Return one row per variant of `pricing_page_v2` with `variant`, `users` (users assigned), `converters` and `conversion_rate_pct` = 100 × converters ÷ users, **rounded to 2 decimals**. Order by `variant`.",
    ].join("\n"),
    tables: [
      {
        name: "experiment_assignments",
        columns: [
          { name: "user_id", type: "int" },
          { name: "experiment", type: "varchar" },
          { name: "variant", type: "enum", values: ["control", "treatment"] },
          { name: "assigned_at", type: "datetime" },
        ],
        primaryKey: ["user_id", "experiment"],
        note: "A user is assigned at most once per experiment.",
      },
      {
        name: "conversions",
        columns: [
          { name: "conversion_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "plan", type: "varchar" },
          { name: "converted_at", type: "datetime" },
        ],
        primaryKey: ["conversion_id"],
        note: "One row per purchase of a paid plan.",
      },
    ],
    examples: [
      {
        experiment_assignments: [
          [1, "pricing_page_v2", "control", "2024-05-01 10:00:00"],
          [2, "pricing_page_v2", "treatment", "2024-05-01 10:05:00"],
          [3, "pricing_page_v2", "control", "2024-05-01 11:00:00"],
          [4, "pricing_page_v2", "treatment", "2024-05-02 09:00:00"],
          [5, "pricing_page_v2", "treatment", "2024-05-02 12:00:00"],
          [6, "pricing_page_v2", "control", "2024-05-03 08:00:00"],
          [8, "pricing_page_v2", "treatment", "2024-05-03 09:30:00"],
          [1, "onboarding_checklist", "treatment", "2024-04-20 10:00:00"],
        ],
        conversions: [
          [1, 2, "growth", "2024-05-03 14:00:00"],
          [2, 5, "starter", "2024-04-28 09:00:00"],
          [3, 3, "starter", "2024-05-04 10:00:00"],
          [4, 2, "growth", "2024-05-20 10:00:00"],
          [5, 7, "growth", "2024-05-05 16:00:00"],
          [6, 8, "starter", "2024-05-03 09:30:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 20);
      const assignments: Cell[][] = [];
      const assignedAt = new Map<number, string>();
      for (const u of seq(1, n)) {
        if (chance(rng, 0.85)) {
          const t = atTime(rng, dateBetween(rng, "2024-05-01", "2024-05-07"));
          assignedAt.set(u, t);
          assignments.push([u, "pricing_page_v2", chance(rng, 0.5) ? "control" : "treatment", t]);
        }
        if (chance(rng, 0.3)) assignments.push([u, "onboarding_checklist", pick(rng, ["control", "treatment"]), atTime(rng, dateBetween(rng, "2024-04-15", "2024-04-30"))]);
      }
      const conversions: Cell[][] = [];
      let cid = 1;
      const rate = pick(rng, [0.2, 0.4, 0.6]);
      for (const u of seq(1, n)) {
        if (!chance(rng, rate)) continue;
        for (let j = 0, k = ri(rng, 1, 2); j < k; j++) {
          const base = assignedAt.get(u);
          const when = base && chance(rng, 0.2) ? base : atTime(rng, dateBetween(rng, "2024-04-25", "2024-05-20"));
          conversions.push([cid++, u, pick(rng, ["starter", "growth"]), when]);
        }
      }
      return { experiment_assignments: assignments, conversions };
    },
    solution: [
      "SELECT a.variant,",
      "       COUNT(DISTINCT a.user_id) AS users,",
      "       COUNT(DISTINCT c.user_id) AS converters,",
      "       ROUND(100 * COUNT(DISTINCT c.user_id) / COUNT(DISTINCT a.user_id), 2) AS conversion_rate_pct",
      "FROM experiment_assignments a",
      "LEFT JOIN conversions c",
      "  ON c.user_id = a.user_id AND c.converted_at >= a.assigned_at",
      "WHERE a.experiment = 'pricing_page_v2'",
      "GROUP BY a.variant",
      "ORDER BY a.variant",
    ].join("\n"),
    alternatives: [
      [
        "SELECT variant, COUNT(*) AS users, SUM(converted) AS converters, ROUND(100 * SUM(converted) / COUNT(*), 2) AS conversion_rate_pct",
        "FROM (",
        "  SELECT a.variant, CASE WHEN EXISTS (SELECT 1 FROM conversions c WHERE c.user_id = a.user_id AND c.converted_at >= a.assigned_at) THEN 1 ELSE 0 END AS converted",
        "  FROM experiment_assignments a WHERE a.experiment = 'pricing_page_v2'",
        ") t",
        "GROUP BY variant ORDER BY variant",
      ].join("\n"),
      [
        "WITH per_user AS (",
        "  SELECT a.user_id, a.variant, MAX(CASE WHEN c.converted_at >= a.assigned_at THEN 1 ELSE 0 END) AS converted",
        "  FROM experiment_assignments a LEFT JOIN conversions c ON c.user_id = a.user_id",
        "  WHERE a.experiment = 'pricing_page_v2'",
        "  GROUP BY a.user_id, a.variant",
        ")",
        "SELECT variant, COUNT(*) AS users, SUM(converted) AS converters, ROUND(100 * SUM(converted) / COUNT(*), 2) AS conversion_rate_pct",
        "FROM per_user GROUP BY variant ORDER BY variant",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Start from the assignments of this one experiment: they define who is in each variant.",
      "Join only the conversions that happened at or after the user's own assignment time.",
      "A user with two purchases must count once — count distinct users, or reduce to one 0/1 flag per user first.",
      "Users with no qualifying purchase must still count in the denominator, so the join is a LEFT JOIN.",
    ],
    editorial: [
      "The denominator is everyone assigned to a variant of `pricing_page_v2`, so the query is driven by `experiment_assignments` filtered to that experiment. Each user is LEFT JOINed to the conversions that happened **at or after their own assignment** — the time condition sits in the ON clause, so a user whose only purchase came before the test keeps one row with NULLs and still counts as a non-converter.",
      "",
      "`COUNT(DISTINCT a.user_id)` is the variant's size and `COUNT(DISTINCT c.user_id)` its converters: DISTINCT folds a user's repeat purchases into one, and the NULLs of non-converters are ignored by COUNT. The rate is computed from those counts and rounded to two decimals, as MySQL's division would otherwise return four.",
      "",
      "Reducing to one row per user with a 0/1 flag — through `EXISTS` or `MAX(CASE …)` over a plain LEFT JOIN — then summing the flags is the same arithmetic, and is the shape you would want before running a significance test. Purchases by users never assigned (user 7) never join, because the drive is from assignments. The cost is one pass over the assignments with an index lookup into conversions per user.",
    ].join("\n"),
  },

  {
    slug: "monthly-paid-revenue-change-vs-previous-month",
    title: "Monthly Paid Revenue and Its Change From Last Month",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates"],
    description: [
      "The board deck shows revenue by month with the change against the month before. Only invoices with status **`paid`** count; `void` invoices were cancelled.",
      "",
      "Return one row per calendar month that has paid revenue, with `revenue_month` ('YYYY-MM'), `revenue` (sum of paid amounts) and `change_from_prev` = this month's revenue minus the **previous calendar month's**. When the previous calendar month has no paid revenue (or there is none before it), `change_from_prev` is NULL — never compare across a gap. Order by `revenue_month`.",
    ].join("\n"),
    tables: [
      {
        name: "invoices",
        columns: [
          { name: "invoice_id", type: "int" },
          { name: "account_id", type: "int" },
          { name: "invoice_date", type: "date" },
          { name: "amount", type: "int" },
          { name: "status", type: "enum", values: ["paid", "void"] },
        ],
        primaryKey: ["invoice_id"],
        note: "One row per invoice raised, amount in rupees.",
      },
    ],
    examples: [
      {
        invoices: [
          [1, 1, "2024-01-05", 4999, "paid"],
          [2, 2, "2024-01-20", 24999, "paid"],
          [3, 1, "2024-02-05", 4999, "paid"],
          [4, 2, "2024-02-20", 24999, "void"],
          [5, 3, "2024-02-25", 39999, "paid"],
          [6, 4, "2024-03-10", 4999, "void"],
          [7, 1, "2024-04-05", 4999, "paid"],
          [8, 3, "2024-04-25", 39999, "paid"],
          [9, 2, "2024-05-20", 24999, "paid"],
          [10, 1, "2024-05-05", 4999, "paid"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 20);
      const months = sample(rng, ["2023-11", "2023-12", "2024-01", "2024-02", "2024-03", "2024-04"], ri(rng, 1, 6));
      const rows: Cell[][] = seq(1, n).map((id) => {
        const m = pick(rng, months);
        return [id, ri(rng, 1, 6), `${m}-${pad(ri(rng, 1, 28))}`, pick(rng, [4999, 24999, 39999, 85000]), chance(rng, 0.8) ? "paid" : "void"];
      });
      return { invoices: rows };
    },
    solution: [
      "WITH monthly AS (",
      "  SELECT YEAR(invoice_date) * 12 + MONTH(invoice_date) AS month_key,",
      "         DATE_FORMAT(invoice_date, '%Y-%m') AS revenue_month,",
      "         SUM(amount) AS revenue",
      "  FROM invoices",
      "  WHERE status = 'paid'",
      "  GROUP BY YEAR(invoice_date) * 12 + MONTH(invoice_date), DATE_FORMAT(invoice_date, '%Y-%m')",
      ")",
      "SELECT revenue_month, revenue,",
      "       CASE WHEN LAG(month_key) OVER (ORDER BY month_key) = month_key - 1",
      "            THEN revenue - LAG(revenue) OVER (ORDER BY month_key) END AS change_from_prev",
      "FROM monthly",
      "ORDER BY revenue_month",
    ].join("\n"),
    alternatives: [
      [
        "WITH monthly AS (",
        "  SELECT YEAR(invoice_date) * 12 + MONTH(invoice_date) AS month_key, DATE_FORMAT(invoice_date, '%Y-%m') AS revenue_month, SUM(amount) AS revenue",
        "  FROM invoices WHERE status = 'paid'",
        "  GROUP BY YEAR(invoice_date) * 12 + MONTH(invoice_date), DATE_FORMAT(invoice_date, '%Y-%m')",
        ")",
        "SELECT m.revenue_month, m.revenue, m.revenue - p.revenue AS change_from_prev",
        "FROM monthly m LEFT JOIN monthly p ON p.month_key = m.month_key - 1",
        "ORDER BY m.revenue_month",
      ].join("\n"),
      [
        "SELECT revenue_month, revenue,",
        "  revenue - (SELECT SUM(i.amount) FROM invoices i WHERE i.status = 'paid' AND DATE_FORMAT(i.invoice_date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CONCAT(revenue_month, '-01'), INTERVAL 1 MONTH), '%Y-%m')) AS change_from_prev",
        "FROM (SELECT DATE_FORMAT(invoice_date, '%Y-%m') AS revenue_month, SUM(amount) AS revenue FROM invoices WHERE status = 'paid' GROUP BY DATE_FORMAT(invoice_date, '%Y-%m')) m",
        "ORDER BY revenue_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First build one row per month with its paid revenue; compare months only after that.",
      "LAG reads the previous row — but is the previous row always the previous calendar month?",
      "Number the months (year × 12 + month) so \"the month before\" is simply key − 1, across a year boundary too.",
    ],
    editorial: [
      "Two steps. First aggregate: filter to `paid`, group by month and sum. Then compare each month with the one before it.",
      "",
      "`LAG(revenue) OVER (ORDER BY month)` reads the previous *row*, which is the previous calendar month only when no month is missing. In the example March has only a void invoice, so it has no row, and a bare LAG would compare April with February. The fix is to carry a month number — `YEAR * 12 + MONTH`, which also makes December → January a step of one — and accept the lagged value only when the lagged key is exactly one less. Otherwise the CASE has no ELSE and yields NULL.",
      "",
      "A self-join of the monthly table on `p.month_key = m.month_key - 1` states the rule directly: LEFT JOIN leaves NULL when the previous month is absent, and `revenue - NULL` is NULL. A correlated subquery that recomputes the previous month's total also works but rescans invoices for every month. The window plan sorts the few monthly rows once.",
    ].join("\n"),
  },

  {
    slug: "paid-accounts-dormant-for-over-30-days",
    title: "Paid Accounts Dormant for Over 30 Days",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Dates"],
    description: [
      "Customer success calls paying customers who have stopped using the product before they cancel. Today is **2024-09-30**. An account is **dormant** when it is `active`, on a paid plan (anything but `free`), and **no one has logged in for more than 30 days** — its latest login falls on a date more than 30 days before today, or it has never logged in at all.",
      "",
      "Return `account_id`, `company_name` and `last_login_on` (the date of the latest login, NULL if none), ordered by `last_login_on` with never-logged-in accounts first, then by `account_id`.",
    ].join("\n"),
    tables: [
      {
        name: "accounts",
        columns: [
          { name: "account_id", type: "int" },
          { name: "company_name", type: "varchar" },
          { name: "plan", type: "enum", values: [...PLANS] },
          { name: "status", type: "enum", values: ["active", "cancelled"] },
        ],
        primaryKey: ["account_id"],
        note: "One row per customer account.",
      },
      {
        name: "logins",
        columns: [
          { name: "login_id", type: "int" },
          { name: "account_id", type: "int" },
          { name: "logged_in_at", type: "datetime" },
        ],
        primaryKey: ["login_id"],
        note: "One row per sign-in by any member of the account.",
      },
    ],
    examples: [
      {
        accounts: [
          [1, "Zentrix Labs", "growth", "active"],
          [2, "Quillpad", "starter", "active"],
          [3, "Ledgerly", "free", "active"],
          [4, "Orbitpay", "enterprise", "active"],
          [5, "Vaani AI", "growth", "cancelled"],
          [6, "Tiffinly", "starter", "active"],
          [7, "Mintmark", "growth", "active"],
        ],
        logins: [
          [1, 1, "2024-09-25 10:00:00"],
          [2, 1, "2024-07-01 09:00:00"],
          [3, 2, "2024-08-30 23:50:00"],
          [4, 3, "2024-06-01 12:00:00"],
          [5, 5, "2024-05-01 08:30:00"],
          [6, 6, "2024-08-31 00:10:00"],
          [7, 7, "2024-07-14 12:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 12);
      const accounts: Cell[][] = seq(1, n).map((id) => [id, pick(rng, COMPANIES), pick(rng, PLANS), chance(rng, 0.8) ? "active" : "cancelled"]);
      const logins: Cell[][] = [];
      let lid = 1;
      for (const a of accounts) {
        const k = chance(rng, 0.2) ? 0 : ri(rng, 1, 3);
        for (let j = 0; j < k; j++) {
          const day = chance(rng, 0.2) ? pick(rng, ["2024-08-30", "2024-08-31"]) : dateBetween(rng, "2024-06-01", "2024-09-30");
          logins.push([lid++, a[0]!, atTime(rng, day)]);
        }
      }
      return { accounts, logins };
    },
    solution: [
      "SELECT a.account_id, a.company_name, DATE(MAX(l.logged_in_at)) AS last_login_on",
      "FROM accounts a",
      "LEFT JOIN logins l ON l.account_id = a.account_id",
      "WHERE a.status = 'active' AND a.plan <> 'free'",
      "GROUP BY a.account_id, a.company_name",
      "HAVING MAX(l.logged_in_at) IS NULL OR DATEDIFF('2024-09-30', MAX(l.logged_in_at)) > 30",
      "ORDER BY last_login_on, a.account_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.account_id, a.company_name,",
        "       (SELECT DATE(MAX(l.logged_in_at)) FROM logins l WHERE l.account_id = a.account_id) AS last_login_on",
        "FROM accounts a",
        "WHERE a.status = 'active' AND a.plan <> 'free'",
        "  AND NOT EXISTS (SELECT 1 FROM logins l WHERE l.account_id = a.account_id AND l.logged_in_at >= '2024-08-31')",
        "ORDER BY last_login_on, a.account_id",
      ].join("\n"),
      [
        "SELECT account_id, company_name, last_login_on FROM (",
        "  SELECT a.account_id, a.company_name, (SELECT LEFT(MAX(l.logged_in_at), 10) FROM logins l WHERE l.account_id = a.account_id) AS last_login_on",
        "  FROM accounts a WHERE a.status = 'active' AND a.plan <> 'free'",
        ") x",
        "WHERE last_login_on IS NULL OR last_login_on < '2024-08-31'",
        "ORDER BY last_login_on, account_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The question is about each account's latest login — a MAX per account.",
      "Accounts that never logged in have no login rows; an inner join would lose them.",
      "\"More than 30 days before 2024-09-30\" is a date you can compute once: which is the first date that is *not* dormant?",
      "In ascending order, NULLs come first in MySQL.",
    ],
    editorial: [
      "Dormancy is a property of each account's **latest** login, so the core is `MAX(logged_in_at)` per account. LEFT JOIN keeps accounts with no logins at all — their MAX is NULL — and the HAVING clause keeps an account when that MAX is NULL or more than 30 days before today. The plan and status filters are on the account row, so they belong in WHERE, before grouping.",
      "",
      "The boundary: `DATEDIFF('2024-09-30', d) > 30` holds for 30 August and not for 31 August, and DATEDIFF ignores the time of day, so a login at 00:10 on 31 August makes Tiffinly not dormant, while Quillpad's 23:50 on 30 August is 31 days ago. Equivalently, an account is dormant when **no login exists on or after 2024-08-31** — the NOT EXISTS form, which never needs the maximum to decide and only computes it for display.",
      "",
      "Ordering by `last_login_on` puts NULLs first in MySQL's ascending sort, which is the order asked for; `account_id` breaks ties between accounts last seen on the same date. With an index on `logins(account_id, logged_in_at)` every form reads one index entry per account.",
    ].join("\n"),
  },

  {
    slug: "top-two-features-per-pricing-plan",
    title: "Top Two Features in Every Pricing Plan",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Joins", "Aggregation"],
    description: [
      "Packaging decisions start from what each tier's customers actually use. A feature's popularity in a plan is the number of **distinct users on that plan** who used it. A feature is in a plan's top two when **fewer than two features of that plan have strictly more users** — so ties share a place and can push the list past two (counts 5, 5, 3 give two features; 5, 3, 3 give three).",
      "",
      "Return `plan`, `feature` and `users`, ordered by `plan`, then `users` descending, then `feature`. Plans with no usage do not appear.",
    ].join("\n"),
    tables: [
      {
        name: "users",
        columns: [
          { name: "user_id", type: "int" },
          { name: "plan", type: "enum", values: ["starter", "growth", "enterprise"] },
        ],
        primaryKey: ["user_id"],
        note: "One row per user with the plan their workspace pays for.",
      },
      {
        name: "feature_events",
        columns: [
          { name: "event_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "feature", type: "varchar" },
          { name: "used_at", type: "datetime" },
        ],
        primaryKey: ["event_id"],
        note: "One row per use of a feature; `user_id` always names a row of `users`.",
      },
    ],
    examples: [
      {
        users: [
          [1, "starter"],
          [2, "starter"],
          [3, "starter"],
          [4, "growth"],
          [5, "growth"],
          [6, "enterprise"],
        ],
        feature_events: [
          [1, 1, "Kanban Board", "2024-07-01 10:00:00"],
          [2, 2, "Kanban Board", "2024-07-01 11:00:00"],
          [3, 3, "Kanban Board", "2024-07-02 09:00:00"],
          [4, 1, "Time Tracking", "2024-07-02 10:30:00"],
          [5, 2, "Time Tracking", "2024-07-03 15:00:00"],
          [6, 3, "Invoicing", "2024-07-03 16:00:00"],
          [7, 4, "Gantt Chart", "2024-07-01 12:00:00"],
          [8, 5, "Gantt Chart", "2024-07-04 12:00:00"],
          [9, 4, "AI Summaries", "2024-07-02 14:00:00"],
          [10, 5, "AI Summaries", "2024-07-05 09:15:00"],
          [11, 4, "Audit Log", "2024-07-06 18:00:00"],
          [12, 6, "Audit Log", "2024-07-06 19:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const users: Cell[][] = seq(1, n).map((id) => [id, pick(rng, ["starter", "growth", "enterprise"])]);
      const feats = sample(rng, FEATURES, ri(rng, 2, 5));
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      const events: Cell[][] = seq(1, m).map((id) => [id, ri(rng, 1, n), pick(rng, feats), atTime(rng, dateBetween(rng, "2024-07-01", "2024-07-31"))]);
      return { users, feature_events: events };
    },
    solution: [
      "WITH per_feature AS (",
      "  SELECT u.plan, e.feature, COUNT(DISTINCT e.user_id) AS users",
      "  FROM feature_events e",
      "  JOIN users u ON u.user_id = e.user_id",
      "  GROUP BY u.plan, e.feature",
      "), ranked AS (",
      "  SELECT plan, feature, users, RANK() OVER (PARTITION BY plan ORDER BY users DESC) AS rk",
      "  FROM per_feature",
      ")",
      "SELECT plan, feature, users",
      "FROM ranked",
      "WHERE rk <= 2",
      "ORDER BY plan, users DESC, feature",
    ].join("\n"),
    alternatives: [
      [
        "WITH per_feature AS (",
        "  SELECT u.plan, e.feature, COUNT(DISTINCT e.user_id) AS users",
        "  FROM feature_events e JOIN users u ON u.user_id = e.user_id GROUP BY u.plan, e.feature",
        ")",
        "SELECT p.plan, p.feature, p.users FROM per_feature p",
        "WHERE (SELECT COUNT(*) FROM per_feature q WHERE q.plan = p.plan AND q.users > p.users) < 2",
        "ORDER BY p.plan, p.users DESC, p.feature",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Aggregate first: one row per (plan, feature) with its distinct users.",
      "\"Fewer than two strictly better\" is exactly the definition of one ranking function — which one leaves gaps after a tie?",
      "Filter on the rank outside the query that computes it.",
    ],
    editorial: [
      "Join each event to its user's plan and count distinct users per (plan, feature) — a user who opens the Kanban board ten times is one user. That gives a small table to rank.",
      "",
      "The tie rule — a feature qualifies when fewer than two features in its plan have strictly more users — is the definition of `RANK()`: a row's rank is one plus the number of rows strictly ahead of it. So `RANK() OVER (PARTITION BY plan ORDER BY users DESC) <= 2`. With counts 2, 2, 1 both twos rank 1 and the one ranks 3, so two features return; with 3, 2, 2 the twos share rank 2 and three return. `DENSE_RANK` would wrongly admit the 1 in the first case (dense rank 2), and `ROW_NUMBER` would arbitrarily drop one of a tied pair.",
      "",
      "The correlated alternative writes the rule literally — count the plan's features with more users and keep those with fewer than two. It is quadratic in features per plan, which is tiny here; the window version is a sort per plan.",
    ].join("\n"),
  },

  {
    slug: "power-users-active-on-four-days-a-month",
    title: "Power Users Active on Four or More Days a Month",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Dates"],
    description: [
      "The product team calls a user a **power user for a month** when they were active on **at least four different calendar days** of that month. Several events on one day are one active day, and a streak across a month boundary counts separately in each month.",
      "",
      "Return `activity_month` ('YYYY-MM'), `user_id` and `active_days` for every qualifying (month, user) pair, ordered by `activity_month`, then `active_days` descending, then `user_id`.",
    ].join("\n"),
    tables: [
      {
        name: "events",
        columns: [
          { name: "event_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "event_name", type: "varchar" },
          { name: "occurred_at", type: "datetime" },
        ],
        primaryKey: ["event_id"],
        note: "The product event log; every event is a user doing something.",
      },
    ],
    examples: [
      {
        events: [
          [1, 1, "login", "2024-06-03 09:00:00"],
          [2, 1, "task_added", "2024-06-04 10:15:00"],
          [3, 1, "comment_posted", "2024-06-04 18:40:00"],
          [4, 1, "login", "2024-06-10 08:05:00"],
          [5, 1, "report_viewed", "2024-06-21 13:30:00"],
          [6, 2, "login", "2024-06-30 22:00:00"],
          [7, 2, "login", "2024-07-01 09:00:00"],
          [8, 2, "file_uploaded", "2024-07-02 11:20:00"],
          [9, 2, "login", "2024-07-03 09:10:00"],
          [10, 2, "task_added", "2024-07-05 17:45:00"],
          [11, 3, "login", "2024-06-29 10:00:00"],
          [12, 3, "login", "2024-06-30 10:00:00"],
          [13, 3, "login", "2024-07-01 10:00:00"],
          [14, 3, "login", "2024-07-02 10:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 6, 30);
      const users = ri(rng, 1, 3);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const month = chance(rng, 0.7) ? "2024-06" : "2024-07";
        const day = `${month}-${pad(ri(rng, 1, 7))}`;
        return [id, ri(rng, 1, users), pick(rng, PRODUCT_EVENTS), atTime(rng, day)];
      });
      return { events: rows };
    },
    solution: [
      "SELECT DATE_FORMAT(occurred_at, '%Y-%m') AS activity_month,",
      "       user_id,",
      "       COUNT(DISTINCT DATE(occurred_at)) AS active_days",
      "FROM events",
      "GROUP BY DATE_FORMAT(occurred_at, '%Y-%m'), user_id",
      "HAVING COUNT(DISTINCT DATE(occurred_at)) >= 4",
      "ORDER BY activity_month, active_days DESC, user_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT LEFT(d, 7) AS activity_month, user_id, COUNT(*) AS active_days",
        "FROM (SELECT DISTINCT user_id, LEFT(occurred_at, 10) AS d FROM events) days",
        "GROUP BY LEFT(d, 7), user_id",
        "HAVING COUNT(*) >= 4",
        "ORDER BY activity_month, active_days DESC, user_id",
      ].join("\n"),
      [
        "SELECT activity_month, user_id, active_days FROM (",
        "  SELECT YEAR(occurred_at) AS y, MONTH(occurred_at) AS m, DATE_FORMAT(occurred_at, '%Y-%m') AS activity_month, user_id, COUNT(DISTINCT DAY(occurred_at)) AS active_days",
        "  FROM events GROUP BY YEAR(occurred_at), MONTH(occurred_at), DATE_FORMAT(occurred_at, '%Y-%m'), user_id",
        ") t WHERE active_days >= 4",
        "ORDER BY activity_month, active_days DESC, user_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Group by month and user together.",
      "Count distinct dates, not events: two events on 4 June are one active day.",
      "The threshold applies to a group, so it goes in HAVING.",
    ],
    editorial: [
      "The unit is a (month, user) pair, so group by both: the month as `DATE_FORMAT(occurred_at, '%Y-%m')` and the user. Inside each group count **distinct dates** — `COUNT(DISTINCT DATE(occurred_at))` — because an active day is a date, not an event; user 1's two events on 4 June are one day. Then `HAVING … >= 4` keeps the power users.",
      "",
      "Grouping by month splits a streak that crosses the boundary: user 3 was active 29 June – 2 July, four days in a row, but only two in each month, so they qualify in neither. That is the definition the statement asks for, and the one a monthly dashboard actually uses.",
      "",
      "Deduplicating (user, date) pairs in a derived table first and then counting rows is the same computation in two steps, and is how you would write it on an engine without `COUNT(DISTINCT expr)`. Counting distinct `DAY()` numbers inside a month is also safe, because the month is part of the group. One scan, one sort or hash.",
    ].join("\n"),
  },

  {
    slug: "signups-and-upgrades-by-utm-source",
    title: "Signups and Upgrades by UTM Source",
    difficulty: "MEDIUM",
    topics: ["Strings", "Conditional Logic", "Aggregation"],
    description: [
      "Marketing attributes each signup to the `utm_source` parameter of the URL it landed on — the text after `utm_source=` up to the next `&` or the end of the URL. The parameter can appear anywhere in the query string; a URL **without a `utm_source` parameter counts as `direct`**. A signup is a paid signup when `upgraded_on` is not NULL.",
      "",
      "Return `utm_source`, `signups` and `paid_signups` per source, ordered by `signups` descending, then `utm_source`. Every URL is lower-case.",
    ].join("\n"),
    tables: [
      {
        name: "signups",
        columns: [
          { name: "user_id", type: "int" },
          { name: "landing_url", type: "varchar" },
          { name: "signed_up_on", type: "date" },
          { name: "upgraded_on", type: "date" },
        ],
        primaryKey: ["user_id"],
        note: "One row per signup; `upgraded_on` is the day the user moved to a paid plan, or NULL.",
      },
    ],
    examples: [
      {
        signups: [
          [1, "https://app.taskora.in/signup?utm_source=google&utm_medium=cpc", "2024-04-01", "2024-04-10"],
          [2, "https://app.taskora.in/signup?utm_medium=email&utm_source=newsletter", "2024-04-02", null],
          [3, "https://app.taskora.in/signup", "2024-04-02", null],
          [4, "https://app.taskora.in/signup?utm_source=google&utm_medium=cpc&utm_campaign=diwali", "2024-04-03", "2024-04-20"],
          [5, "https://app.taskora.in/signup?ref=footer", "2024-04-05", null],
          [6, "https://app.taskora.in/signup?utm_source=linkedin", "2024-04-06", "2024-04-07"],
          [7, "https://app.taskora.in/signup?utm_source=google&utm_medium=organic", "2024-04-08", null],
          [8, "https://app.taskora.in/signup?utm_source=newsletter", "2024-04-09", "2024-05-01"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 20);
      const sources = sample(rng, ["google", "linkedin", "newsletter", "youtube", "partner_zoho", "twitter"], ri(rng, 1, 4));
      const rows: Cell[][] = seq(1, n).map((id) => {
        const base = "https://app.taskora.in/signup";
        const src = pick(rng, sources);
        const shape = ri(rng, 0, 5);
        const url =
          shape === 0 ? base
          : shape === 1 ? `${base}?ref=${pick(rng, ["footer", "blog", "pricing"])}`
          : shape === 2 ? `${base}?utm_source=${src}`
          : shape === 3 ? `${base}?utm_source=${src}&utm_medium=${pick(rng, ["cpc", "social", "email"])}`
          : shape === 4 ? `${base}?utm_medium=${pick(rng, ["cpc", "social", "email"])}&utm_source=${src}`
          : `${base}?utm_campaign=${pick(rng, ["diwali", "holi", "launch"])}&utm_source=${src}&utm_medium=cpc`;
        const day = dateBetween(rng, "2024-04-01", "2024-04-30");
        return [id, url, day, chance(rng, 0.35) ? addDays(day, ri(rng, 0, 20)) : null];
      });
      return { signups: rows };
    },
    solution: [
      "SELECT utm_source,",
      "       COUNT(*) AS signups,",
      "       SUM(CASE WHEN upgraded_on IS NOT NULL THEN 1 ELSE 0 END) AS paid_signups",
      "FROM (",
      "  SELECT CASE WHEN LOCATE('utm_source=', landing_url) > 0",
      "              THEN SUBSTRING_INDEX(SUBSTRING_INDEX(landing_url, 'utm_source=', -1), '&', 1)",
      "              ELSE 'direct' END AS utm_source,",
      "         upgraded_on",
      "  FROM signups",
      ") s",
      "GROUP BY utm_source",
      "ORDER BY signups DESC, utm_source",
    ].join("\n"),
    alternatives: [
      [
        "SELECT IF(INSTR(landing_url, 'utm_source=') = 0, 'direct', SUBSTRING_INDEX(SUBSTRING(landing_url, INSTR(landing_url, 'utm_source=') + 11), '&', 1)) AS utm_source,",
        "       COUNT(*) AS signups, COUNT(upgraded_on) AS paid_signups",
        "FROM signups",
        "GROUP BY IF(INSTR(landing_url, 'utm_source=') = 0, 'direct', SUBSTRING_INDEX(SUBSTRING(landing_url, INSTR(landing_url, 'utm_source=') + 11), '&', 1))",
        "ORDER BY signups DESC, utm_source",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Extract the source in a derived table first, then group by it.",
      "SUBSTRING_INDEX(s, 'utm_source=', -1) keeps everything after the marker; a second SUBSTRING_INDEX on '&' keeps the value only.",
      "When the marker is missing, SUBSTRING_INDEX returns the whole URL — test for the marker first.",
      "COUNT(column) counts non-NULL values, which is exactly the paid signups.",
    ],
    editorial: [
      "The work is in parsing. `SUBSTRING_INDEX(url, 'utm_source=', -1)` returns everything after the marker — `google&utm_medium=cpc` — and `SUBSTRING_INDEX(…, '&', 1)` cuts that at the first `&`, leaving `google`; when the parameter is last there is no `&` and the whole remainder is the value. Because the marker is searched for anywhere, the order of parameters does not matter.",
      "",
      "If the marker is absent, `SUBSTRING_INDEX` returns the **whole URL**, which would create a junk source per URL. So the expression is guarded: `LOCATE('utm_source=', url) > 0` (or `INSTR(url, …) = 0` in the IF form) decides between the parsed value and `'direct'`. A `?ref=footer` URL has a query string but no source, so it is direct too.",
      "",
      "Once each row has a source, the rest is grouping: `COUNT(*)` signups and a conditional sum — or `COUNT(upgraded_on)`, which skips NULLs — for paid signups. Parsing in a derived table keeps the expression written once; MySQL also allows grouping by the expression itself. One scan of the table.",
    ].join("\n"),
  },

  {
    slug: "monthly-active-users-new-vs-returning",
    title: "Monthly Active Users, New Versus Returning",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Dates", "Conditional Logic"],
    description: [
      "The MAU chart is split into **new** active users — who signed up in the same calendar month they were active — and **returning** ones, who signed up in an earlier month. A user active several times in a month counts once that month.",
      "",
      "Return one row per month that has events, with `activity_month` ('YYYY-MM'), `active_users`, `new_users` and `returning_users`, ordered by `activity_month`.",
    ].join("\n"),
    tables: [
      {
        name: "users",
        columns: [
          { name: "user_id", type: "int" },
          { name: "signed_up_on", type: "date" },
        ],
        primaryKey: ["user_id"],
        note: "One row per account holder.",
      },
      {
        name: "events",
        columns: [
          { name: "event_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "occurred_at", type: "datetime" },
        ],
        primaryKey: ["event_id"],
        note: "Product events; `user_id` always names a row of `users`, and no event is before its user's signup.",
      },
    ],
    examples: [
      {
        users: [
          [1, "2024-01-15"],
          [2, "2024-02-03"],
          [3, "2024-02-28"],
          [4, "2024-03-01"],
        ],
        events: [
          [1, 1, "2024-02-01 09:00:00"],
          [2, 1, "2024-02-14 10:00:00"],
          [3, 2, "2024-02-03 12:00:00"],
          [4, 3, "2024-02-29 23:00:00"],
          [5, 2, "2024-03-02 08:00:00"],
          [6, 3, "2024-03-05 19:30:00"],
          [7, 4, "2024-03-01 07:45:00"],
          [8, 4, "2024-03-09 18:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const users: Cell[][] = seq(1, n).map((id) => [id, dateBetween(rng, "2024-01-01", "2024-03-31")]);
      const m = chance(rng, 0.05) ? 0 : ri(rng, 1, 25);
      const events: Cell[][] = seq(1, m).map((id) => {
        const u = users[ri(rng, 0, n - 1)]!;
        const signup = u[1] as string;
        const day = chance(rng, 0.4) ? addDays(signup, ri(rng, 0, 3)) : addDays(signup, ri(rng, 0, 75));
        return [id, u[0]!, atTime(rng, day)];
      });
      return { users, events };
    },
    solution: [
      "SELECT DATE_FORMAT(e.occurred_at, '%Y-%m') AS activity_month,",
      "       COUNT(DISTINCT e.user_id) AS active_users,",
      "       COUNT(DISTINCT CASE WHEN DATE_FORMAT(u.signed_up_on, '%Y-%m') = DATE_FORMAT(e.occurred_at, '%Y-%m') THEN e.user_id END) AS new_users,",
      "       COUNT(DISTINCT CASE WHEN DATE_FORMAT(u.signed_up_on, '%Y-%m') < DATE_FORMAT(e.occurred_at, '%Y-%m') THEN e.user_id END) AS returning_users",
      "FROM events e",
      "JOIN users u ON u.user_id = e.user_id",
      "GROUP BY DATE_FORMAT(e.occurred_at, '%Y-%m')",
      "ORDER BY activity_month",
    ].join("\n"),
    alternatives: [
      [
        "WITH monthly AS (",
        "  SELECT DISTINCT LEFT(e.occurred_at, 7) AS activity_month, e.user_id, LEFT(u.signed_up_on, 7) AS signup_month",
        "  FROM events e JOIN users u ON u.user_id = e.user_id",
        ")",
        "SELECT activity_month, COUNT(*) AS active_users,",
        "       SUM(CASE WHEN signup_month = activity_month THEN 1 ELSE 0 END) AS new_users,",
        "       SUM(CASE WHEN signup_month < activity_month THEN 1 ELSE 0 END) AS returning_users",
        "FROM monthly GROUP BY activity_month ORDER BY activity_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Join each event to its user's signup date, then group by the event's month.",
      "A conditional count — COUNT(DISTINCT CASE WHEN … THEN user_id END) — counts only the users meeting the condition.",
      "'YYYY-MM' strings compare in time order, so an earlier signup month is a smaller string.",
    ],
    editorial: [
      "Each event is joined to its user's signup date and grouped by the event's month. Three distinct counts come out of one group: all users, the users whose signup month equals the activity month, and those whose signup month is earlier. The last two are **conditional counts** — `COUNT(DISTINCT CASE WHEN cond THEN e.user_id END)` — the CASE yields NULL for rows that fail the condition, and COUNT ignores NULLs.",
      "",
      "DISTINCT matters inside each conditional count too: user 1's two February events are one returning user, not two. Since no event precedes its user's signup, every active user is either new or returning, so the last two columns always add up to the first — a good self-check.",
      "",
      "Comparing months as 'YYYY-MM' strings is safe because the format is fixed-width and year-first. User 3 signed up on 28 February and was active on the 29th (a leap day) — new in February — and in March counts as returning. Deduplicating (month, user) first and summing 0/1 flags is the alternative; both are one scan plus a join.",
    ].join("\n"),
  },

  {
    slug: "classify-subscription-plan-changes",
    title: "Upgrades, Downgrades and Lateral Plan Moves",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Conditional Logic"],
    description: [
      "Billing logs a row every time an account moves onto a plan; an account's **first row is its initial purchase** and is not a change. Every later row is compared with the same account's **previous row**: it is an `upgrade` when its `monthly_price` is higher, a `downgrade` when lower, and `lateral` when equal (for example switching between two plans at the same price).",
      "",
      "Return `change_id`, `account_id`, `from_plan`, `to_plan` and `direction` for every change except initial purchases, ordered by `account_id`, then `changed_on`. No account has two rows on the same day.",
    ].join("\n"),
    tables: [
      {
        name: "plan_changes",
        columns: [
          { name: "change_id", type: "int" },
          { name: "account_id", type: "int" },
          { name: "changed_on", type: "date" },
          { name: "plan", type: "varchar" },
          { name: "monthly_price", type: "int" },
        ],
        primaryKey: ["change_id"],
        note: "One row per plan an account moved onto, with the plan's monthly price in rupees at the time.",
      },
    ],
    examples: [
      {
        plan_changes: [
          [1, 10, "2024-01-05", "starter", 2999],
          [2, 10, "2024-03-01", "growth", 9999],
          [3, 10, "2024-06-15", "team", 9999],
          [4, 11, "2024-02-10", "business", 24999],
          [5, 11, "2024-05-20", "growth", 9999],
          [6, 12, "2024-04-01", "starter", 2999],
          [7, 10, "2024-09-01", "enterprise", 85000],
        ],
      },
    ],
    gen: (rng) => {
      const plans = [["starter", 2999], ["team", 9999], ["growth", 9999], ["business", 24999], ["enterprise", 85000]] as const;
      const rows: Cell[][] = [];
      let cid = 1;
      for (const acct of seq(10, ri(rng, 1, 6))) {
        let day = dateBetween(rng, "2024-01-01", "2024-03-31");
        for (let j = 0, k = ri(rng, 1, 5); j < k; j++) {
          const [p, price] = pick(rng, plans);
          rows.push([cid++, acct, day, p, price]);
          day = addDays(day, ri(rng, 1, 60));
        }
      }
      return { plan_changes: rows };
    },
    solution: [
      "SELECT change_id, account_id, from_plan, to_plan,",
      "       CASE WHEN monthly_price > prev_price THEN 'upgrade'",
      "            WHEN monthly_price < prev_price THEN 'downgrade'",
      "            ELSE 'lateral' END AS direction",
      "FROM (",
      "  SELECT change_id, account_id, changed_on, plan AS to_plan, monthly_price,",
      "         LAG(plan) OVER (PARTITION BY account_id ORDER BY changed_on) AS from_plan,",
      "         LAG(monthly_price) OVER (PARTITION BY account_id ORDER BY changed_on) AS prev_price",
      "  FROM plan_changes",
      ") c",
      "WHERE prev_price IS NOT NULL",
      "ORDER BY account_id, changed_on",
    ].join("\n"),
    alternatives: [
      [
        "SELECT cur.change_id, cur.account_id, prev.plan AS from_plan, cur.plan AS to_plan,",
        "       IF(cur.monthly_price > prev.monthly_price, 'upgrade', IF(cur.monthly_price < prev.monthly_price, 'downgrade', 'lateral')) AS direction",
        "FROM plan_changes cur",
        "JOIN plan_changes prev ON prev.account_id = cur.account_id",
        " AND prev.changed_on = (SELECT MAX(p.changed_on) FROM plan_changes p WHERE p.account_id = cur.account_id AND p.changed_on < cur.changed_on)",
        "ORDER BY cur.account_id, cur.changed_on",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Each row needs a value from the previous row of the same account — LAG with PARTITION BY.",
      "The initial purchase has no previous row, so its lagged values are NULL; drop it.",
      "Compare prices, not plan names: two plans can cost the same.",
    ],
    editorial: [
      "Every classification compares a row with the **previous row of the same account**, which is what `LAG(…) OVER (PARTITION BY account_id ORDER BY changed_on)` returns. Lag both the plan (for `from_plan`) and the price (for the comparison) in a derived table, then classify with a CASE outside it.",
      "",
      "An account's first row has nothing before it, so its lagged price is NULL. Filtering `prev_price IS NOT NULL` removes the initial purchases — and must happen *outside* the window query, because WHERE runs before window functions: filtering inside would change which row is \"previous\". Prices never NULL, so the filter only ever removes first rows.",
      "",
      "The comparison is on price because plan names do not order themselves: moving from `growth` to `team` at the same ₹9,999 is lateral. The self-join alternative finds the previous row with a correlated `MAX(changed_on) < current`, which relies on dates being unique per account, as the statement promises; the window version needs no such promise and is one sort.",
    ].join("\n"),
  },

  {
    slug: "seat-based-monthly-bill-per-workspace",
    title: "Seat-Based Monthly Bill for Every Workspace",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "The collaboration tool bills per seat. A member is **billable** when they are not a `guest` (guests are free) and have not been deactivated (`deactivated_on` is NULL). Each plan has a **minimum number of seats** that is always charged, so `billed_seats` is the larger of the billable members and the plan's `min_seats`, and `amount_due` = `billed_seats` × `price_per_seat`.",
      "",
      "Return `workspace_id`, `workspace_name`, `billable_members`, `billed_seats` and `amount_due` for **every workspace**, including one with no members, ordered by `workspace_id`.",
    ].join("\n"),
    tables: [
      {
        name: "plans",
        columns: [
          { name: "plan_code", type: "varchar" },
          { name: "price_per_seat", type: "int" },
          { name: "min_seats", type: "int" },
        ],
        primaryKey: ["plan_code"],
        note: "Price per seat per month in rupees, and the seats always billed.",
      },
      {
        name: "workspaces",
        columns: [
          { name: "workspace_id", type: "int" },
          { name: "workspace_name", type: "varchar" },
          { name: "plan_code", type: "varchar" },
        ],
        primaryKey: ["workspace_id"],
        note: "`plan_code` always names a row of `plans`.",
      },
      {
        name: "members",
        columns: [
          { name: "member_id", type: "int" },
          { name: "workspace_id", type: "int" },
          { name: "role", type: "enum", values: ["owner", "admin", "member", "guest"] },
          { name: "deactivated_on", type: "date" },
        ],
        primaryKey: ["member_id"],
        note: "One row per person ever added to a workspace; `deactivated_on` is NULL while they still have access.",
      },
    ],
    examples: [
      {
        plans: [
          ["team", 399, 3],
          ["business", 699, 5],
          ["enterprise", 999, 20],
        ],
        workspaces: [
          [1, "Zentrix Labs", "team"],
          [2, "Quillpad", "business"],
          [3, "Ledgerly", "team"],
          [4, "Orbitpay", "enterprise"],
        ],
        members: [
          [1, 1, "owner", null],
          [2, 1, "admin", null],
          [3, 1, "member", null],
          [4, 1, "member", null],
          [5, 1, "guest", null],
          [6, 1, "member", "2024-05-31"],
          [7, 2, "owner", null],
          [8, 2, "member", null],
          [9, 2, "member", null],
          [10, 3, "owner", null],
          [11, 3, "guest", null],
        ],
      },
    ],
    gen: (rng) => {
      const plans: Cell[][] = [["team", 399, ri(rng, 1, 4)], ["business", 699, ri(rng, 3, 6)], ["enterprise", 999, ri(rng, 5, 10)]];
      const n = ri(rng, 1, 6);
      const workspaces: Cell[][] = seq(1, n).map((id) => [id, pick(rng, COMPANIES), pick(rng, ["team", "business", "enterprise"])]);
      const m = ri(rng, 0, 30);
      const members: Cell[][] = seq(1, m).map((id) => [
        id,
        ri(rng, 1, n),
        pick(rng, ["owner", "admin", "member", "member", "member", "guest"]),
        chance(rng, 0.2) ? dateBetween(rng, "2024-01-01", "2024-06-30") : null,
      ]);
      return { plans, workspaces, members };
    },
    solution: [
      "SELECT w.workspace_id, w.workspace_name,",
      "       COUNT(m.member_id) AS billable_members,",
      "       GREATEST(COUNT(m.member_id), p.min_seats) AS billed_seats,",
      "       GREATEST(COUNT(m.member_id), p.min_seats) * p.price_per_seat AS amount_due",
      "FROM workspaces w",
      "JOIN plans p ON p.plan_code = w.plan_code",
      "LEFT JOIN members m",
      "  ON m.workspace_id = w.workspace_id AND m.role <> 'guest' AND m.deactivated_on IS NULL",
      "GROUP BY w.workspace_id, w.workspace_name, p.min_seats, p.price_per_seat",
      "ORDER BY w.workspace_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT workspace_id, workspace_name, billable_members,",
        "       CASE WHEN billable_members > min_seats THEN billable_members ELSE min_seats END AS billed_seats,",
        "       CASE WHEN billable_members > min_seats THEN billable_members ELSE min_seats END * price_per_seat AS amount_due",
        "FROM (",
        "  SELECT w.workspace_id, w.workspace_name, p.min_seats, p.price_per_seat,",
        "         (SELECT COUNT(*) FROM members m WHERE m.workspace_id = w.workspace_id AND m.role <> 'guest' AND m.deactivated_on IS NULL) AS billable_members",
        "  FROM workspaces w JOIN plans p ON p.plan_code = w.plan_code",
        ") t",
        "ORDER BY workspace_id",
      ].join("\n"),
      [
        "SELECT w.workspace_id, w.workspace_name,",
        "       SUM(CASE WHEN m.role <> 'guest' AND m.deactivated_on IS NULL THEN 1 ELSE 0 END) AS billable_members,",
        "       GREATEST(SUM(CASE WHEN m.role <> 'guest' AND m.deactivated_on IS NULL THEN 1 ELSE 0 END), p.min_seats) AS billed_seats,",
        "       GREATEST(SUM(CASE WHEN m.role <> 'guest' AND m.deactivated_on IS NULL THEN 1 ELSE 0 END), p.min_seats) * p.price_per_seat AS amount_due",
        "FROM workspaces w JOIN plans p ON p.plan_code = w.plan_code",
        "LEFT JOIN members m ON m.workspace_id = w.workspace_id",
        "GROUP BY w.workspace_id, w.workspace_name, p.min_seats, p.price_per_seat",
        "HAVING COUNT(*) > 0",
        "ORDER BY w.workspace_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Every workspace must appear, so members are LEFT JOINed.",
      "Put the billable conditions in the ON clause so a workspace with only guests still keeps its row.",
      "GREATEST(a, b) picks the larger of two values — the billed seats.",
    ],
    editorial: [
      "Join each workspace to its plan (an inner join: every workspace has one), then LEFT JOIN only its **billable** members — the role and deactivation tests go in the ON clause. A workspace with no billable member then keeps one NULL-padded row, and `COUNT(m.member_id)` counts it as 0.",
      "",
      "Had the conditions gone in WHERE, Orbitpay (no members) would reach the filter as a NULL-padded row, and `m.role <> 'guest'` on a NULL role is unknown, so the row would be dropped — losing a workspace that still owes its minimum. A workspace whose members were all guests or deactivated would vanish the same way. Keeping filters of the optional side in ON is the habit that avoids this.",
      "",
      "The billed seats are `GREATEST(billable, min_seats)`; a CASE does the same. The plan's columns are in GROUP BY because they are selected outside an aggregate. The third version LEFT JOINs every member and counts billable ones with a conditional SUM — then a member-less workspace's single NULL row sums to 0 because the CASE yields 0 for it. Each is one pass over members.",
    ].join("\n"),
  },

  // ────────────────────────────── HARD ──────────────────────────────

  {
    slug: "user-sessions-from-thirty-minute-event-gaps",
    title: "User Sessions From Thirty-Minute Event Gaps",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "The web app does not log sessions, so analytics cuts them from the event stream: a user's **first event starts a session**, and so does any event that comes **more than 30 minutes after that user's previous event**. A gap of exactly 30 minutes stays in the same session. A session's length is the whole minutes from its first to its last event (`TIMESTAMPDIFF(MINUTE, …)`), so a one-event session lasts 0.",
      "",
      "Return `user_id`, `sessions` (how many sessions the user had) and `longest_session_minutes` for every user with events, ordered by `user_id`.",
    ].join("\n"),
    tables: [
      {
        name: "events",
        columns: [
          { name: "event_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "event_name", type: "varchar" },
          { name: "occurred_at", type: "datetime" },
        ],
        primaryKey: ["event_id"],
        note: "One row per event; a user never has two events at the same second.",
      },
    ],
    examples: [
      {
        events: [
          [1, 1, "login", "2024-07-01 09:00:00"],
          [2, 1, "task_added", "2024-07-01 09:20:00"],
          [3, 1, "comment_posted", "2024-07-01 09:50:00"],
          [4, 1, "login", "2024-07-01 10:30:00"],
          [5, 1, "report_viewed", "2024-07-01 10:45:00"],
          [6, 2, "login", "2024-07-01 14:00:00"],
          [7, 2, "login", "2024-07-01 14:31:00"],
          [8, 3, "login", "2024-07-02 08:00:00"],
          [9, 3, "file_uploaded", "2024-07-02 08:29:30"],
          [10, 3, "task_added", "2024-07-02 08:59:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let eid = 1;
      for (const u of seq(1, ri(rng, 1, 4))) {
        let t = tsMs(at(dateBetween(rng, "2024-07-01", "2024-07-03"), ri(rng, 8, 20), ri(rng, 0, 59)));
        for (let j = 0, k = ri(rng, 1, 7); j < k && rows.length < 30; j++) {
          rows.push([eid++, u, pick(rng, PRODUCT_EVENTS), msTs(t)]);
          t += (pick(rng, [2, 10, 29, 30, 30, 31, 45, 120]) * 60 + pick(rng, [0, 0, 0, 30, -30])) * 1000;
        }
      }
      return { events: rows };
    },
    solution: [
      "WITH flagged AS (",
      "  SELECT user_id, event_id, occurred_at,",
      "         CASE WHEN LAG(occurred_at) OVER (PARTITION BY user_id ORDER BY occurred_at, event_id) IS NULL",
      "                OR TIMESTAMPDIFF(SECOND, LAG(occurred_at) OVER (PARTITION BY user_id ORDER BY occurred_at, event_id), occurred_at) > 1800",
      "              THEN 1 ELSE 0 END AS is_start",
      "  FROM events",
      "), numbered AS (",
      "  SELECT user_id, occurred_at,",
      "         SUM(is_start) OVER (PARTITION BY user_id ORDER BY occurred_at, event_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS session_no",
      "  FROM flagged",
      "), sessions AS (",
      "  SELECT user_id, session_no, TIMESTAMPDIFF(MINUTE, MIN(occurred_at), MAX(occurred_at)) AS minutes",
      "  FROM numbered",
      "  GROUP BY user_id, session_no",
      ")",
      "SELECT user_id, COUNT(*) AS sessions, MAX(minutes) AS longest_session_minutes",
      "FROM sessions",
      "GROUP BY user_id",
      "ORDER BY user_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH starts AS (",
        "  SELECT e.user_id, e.occurred_at FROM events e",
        "  WHERE NOT EXISTS (SELECT 1 FROM events p WHERE p.user_id = e.user_id AND p.occurred_at < e.occurred_at",
        "                    AND TIMESTAMPDIFF(SECOND, p.occurred_at, e.occurred_at) <= 1800)",
        "), tagged AS (",
        "  SELECT e.user_id, e.occurred_at,",
        "         (SELECT MAX(s.occurred_at) FROM starts s WHERE s.user_id = e.user_id AND s.occurred_at <= e.occurred_at) AS session_start",
        "  FROM events e",
        "), sessions AS (",
        "  SELECT user_id, session_start, TIMESTAMPDIFF(MINUTE, session_start, MAX(occurred_at)) AS minutes",
        "  FROM tagged GROUP BY user_id, session_start",
        ")",
        "SELECT user_id, COUNT(*) AS sessions, MAX(minutes) AS longest_session_minutes",
        "FROM sessions GROUP BY user_id ORDER BY user_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Compare each event with the same user's previous event — LAG over a per-user, time-ordered window.",
      "Flag an event 1 when it starts a session, 0 otherwise. What does a running sum of those flags give each event?",
      "Measure the gap in seconds so 30 minutes exactly is not mistaken for more.",
      "Aggregate twice: events into sessions, then sessions into users.",
    ],
    editorial: [
      "This is **sessionisation**, a gaps-and-islands problem on timestamps. Step one marks the events that start a session: with `LAG(occurred_at)` over each user's events in time order, an event starts a session when there is no previous event (LAG is NULL) or the gap is more than 1,800 seconds. Measuring in seconds matters — `TIMESTAMPDIFF(MINUTE, …)` truncates, so a gap of 30 minutes 30 seconds would read as 30 and wrongly stay in the session.",
      "",
      "Step two turns the flags into session numbers: a **running sum** of `is_start` in the same order gives every event the count of starts at or before it, which is the same number for all events of one session. The frame is written as ROWS with a unique order so peers can never be summed together.",
      "",
      "Step three groups by (user, session number) to get each session's length from its first to its last event, and a final group by user counts sessions and takes the longest. In the example user 1's 09:50 event is exactly 30 minutes after 09:20 and stays in the first session (50 minutes long); 10:30 is 40 minutes later and starts the second.",
      "",
      "The alternative avoids windows: a start is an event with no earlier event of the same user within 30 minutes (`NOT EXISTS`), and every event belongs to the latest start at or before it. It is quadratic per user; the window plan is one sort.",
    ].join("\n"),
  },

  {
    slug: "onboarding-funnel-with-steps-in-order",
    title: "Onboarding Funnel With Steps Taken in Order",
    difficulty: "HARD",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "The onboarding funnel has four steps: **1** `signed_up` (every user), **2** `project_created`, **3** `teammate_invited`, **4** `plan_upgraded`. A user reaches a step only if they reached the step before it **and** fired the step's event **at or after the moment they reached the previous step** — the time they reach a step is the earliest such event. An invite sent before the user's first project does not count, and a user who upgrades without ever inviting stops at step 2.",
      "",
      "Return all four steps with `step_no`, `step_name`, `users` (users who reached the step) and `pct_of_previous` = 100 × users ÷ the previous step's users, **rounded to 1 decimal** — NULL for step 1, and NULL when the previous step has no users. Order by `step_no`.",
    ].join("\n"),
    tables: [
      {
        name: "users",
        columns: [
          { name: "user_id", type: "int" },
          { name: "signed_up_at", type: "datetime" },
        ],
        primaryKey: ["user_id"],
        note: "One row per signup; signing up is step 1.",
      },
      {
        name: "events",
        columns: [
          { name: "event_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "event_name", type: "varchar" },
          { name: "occurred_at", type: "datetime" },
        ],
        primaryKey: ["event_id"],
        note: "Product events; other event names exist and do not matter. `user_id` always names a row of `users`.",
      },
    ],
    examples: [
      {
        users: [
          [1, "2024-08-01 09:00:00"],
          [2, "2024-08-01 10:00:00"],
          [3, "2024-08-02 11:00:00"],
          [4, "2024-08-02 12:00:00"],
          [5, "2024-08-03 08:00:00"],
        ],
        events: [
          [1, 1, "project_created", "2024-08-01 09:30:00"],
          [2, 1, "teammate_invited", "2024-08-01 09:45:00"],
          [3, 1, "plan_upgraded", "2024-08-05 10:00:00"],
          [4, 2, "teammate_invited", "2024-08-01 10:10:00"],
          [5, 2, "project_created", "2024-08-01 10:30:00"],
          [6, 3, "project_created", "2024-08-02 11:20:00"],
          [7, 3, "plan_upgraded", "2024-08-03 09:00:00"],
          [8, 4, "project_created", "2024-08-02 12:05:00"],
          [9, 4, "teammate_invited", "2024-08-02 12:30:00"],
          [10, 5, "login", "2024-08-03 08:01:00"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 12);
      const users: Cell[][] = [];
      const events: Cell[][] = [];
      let eid = 1;
      const steps = ["project_created", "teammate_invited", "plan_upgraded"];
      for (const u of seq(1, n)) {
        const signup = tsMs(at(dateBetween(rng, "2024-08-01", "2024-08-05"), ri(rng, 8, 18), ri(rng, 0, 59)));
        users.push([u, msTs(signup)]);
        for (const name of [...steps, "login"]) {
          if (!chance(rng, name === "login" ? 0.3 : 0.55)) continue;
          for (let j = 0, k = ri(rng, 1, 2); j < k && events.length < 30; j++) {
            const offsetMin = steps.indexOf(name) >= 0 ? (steps.indexOf(name) + 1) * pick(rng, [20, 60, 600]) - pick(rng, [0, 0, 0, 90]) : ri(rng, 1, 300);
            events.push([eid++, u, name, msTs(signup + offsetMin * 60_000)]);
          }
        }
      }
      return { users, events };
    },
    solution: [
      "WITH s2 AS (",
      "  SELECT u.user_id, MIN(e.occurred_at) AS reached_at",
      "  FROM users u JOIN events e",
      "    ON e.user_id = u.user_id AND e.event_name = 'project_created' AND e.occurred_at >= u.signed_up_at",
      "  GROUP BY u.user_id",
      "), s3 AS (",
      "  SELECT s.user_id, MIN(e.occurred_at) AS reached_at",
      "  FROM s2 s JOIN events e",
      "    ON e.user_id = s.user_id AND e.event_name = 'teammate_invited' AND e.occurred_at >= s.reached_at",
      "  GROUP BY s.user_id",
      "), s4 AS (",
      "  SELECT s.user_id, MIN(e.occurred_at) AS reached_at",
      "  FROM s3 s JOIN events e",
      "    ON e.user_id = s.user_id AND e.event_name = 'plan_upgraded' AND e.occurred_at >= s.reached_at",
      "  GROUP BY s.user_id",
      "), steps AS (",
      "  SELECT 1 AS step_no, 'signed_up' AS step_name, COUNT(*) AS users FROM users",
      "  UNION ALL SELECT 2, 'project_created', COUNT(*) FROM s2",
      "  UNION ALL SELECT 3, 'teammate_invited', COUNT(*) FROM s3",
      "  UNION ALL SELECT 4, 'plan_upgraded', COUNT(*) FROM s4",
      ")",
      "SELECT step_no, step_name, users,",
      "       ROUND(100 * users / NULLIF(LAG(users) OVER (ORDER BY step_no), 0), 1) AS pct_of_previous",
      "FROM steps",
      "ORDER BY step_no",
    ].join("\n"),
    alternatives: [
      [
        "WITH p2 AS (",
        "  SELECT u.user_id, (SELECT MIN(e.occurred_at) FROM events e WHERE e.user_id = u.user_id AND e.event_name = 'project_created' AND e.occurred_at >= u.signed_up_at) AS t2",
        "  FROM users u",
        "), p3 AS (",
        "  SELECT p.user_id, p.t2, (SELECT MIN(e.occurred_at) FROM events e WHERE e.user_id = p.user_id AND e.event_name = 'teammate_invited' AND e.occurred_at >= p.t2) AS t3",
        "  FROM p2 p",
        "), p4 AS (",
        "  SELECT p.user_id, p.t2, p.t3, (SELECT MIN(e.occurred_at) FROM events e WHERE e.user_id = p.user_id AND e.event_name = 'plan_upgraded' AND e.occurred_at >= p.t3) AS t4",
        "  FROM p3 p",
        "), r AS (",
        "  SELECT COUNT(*) AS c1, COUNT(t2) AS c2, COUNT(t3) AS c3, COUNT(t4) AS c4 FROM p4",
        ")",
        "SELECT 1 AS step_no, 'signed_up' AS step_name, c1 AS users, NULL AS pct_of_previous FROM r",
        "UNION ALL SELECT 2, 'project_created', c2, ROUND(100 * c2 / NULLIF(c1, 0), 1) FROM r",
        "UNION ALL SELECT 3, 'teammate_invited', c3, ROUND(100 * c3 / NULLIF(c2, 0), 1) FROM r",
        "UNION ALL SELECT 4, 'plan_upgraded', c4, ROUND(100 * c4 / NULLIF(c3, 0), 1) FROM r",
        "ORDER BY step_no",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Compute, per user, the time they reached each step; each step's time depends on the previous one.",
      "A chain of CTEs works well: step 3 is built only from users who are in step 2, joined to events after their step-2 time.",
      "Counting the users in each CTE gives the funnel; UNION ALL stacks the four counts into rows.",
      "LAG over the stacked rows gives the previous step's count; guard the division with NULLIF.",
    ],
    editorial: [
      "An ordered funnel is a chain: whether a user reaches step k depends on *when* they reached step k − 1. So compute a reach time per user per step, each from the previous. Step 2 joins every user to their `project_created` events at or after signup and takes the MIN; step 3 starts from step 2's users only and joins `teammate_invited` events at or after that step-2 time; step 4 likewise. An inner join at each link drops users who never take the step — and anyone dropped can never come back at a later step.",
      "",
      "The time conditions are what make it an *ordered* funnel. User 2 invited a teammate at 10:10 but created their first project at 10:30, so the invite does not count; user 3 upgraded without inviting and stops at step 2. Counting events independently per step would credit both.",
      "",
      "Each CTE's row count is a step's size. `UNION ALL` stacks them as rows, and `LAG(users) OVER (ORDER BY step_no)` brings the previous step's count beside each row: NULL on step 1, and `NULLIF(…, 0)` turns a zero previous step into NULL instead of a division error. The rate is rounded to one decimal so MySQL and other engines agree.",
      "",
      "The alternative computes the three reach times per user with correlated MIN subqueries (a NULL time propagates — `occurred_at >= NULL` is never true), counts them in one row, and writes each percentage explicitly. With an index on `events(user_id, event_name, occurred_at)` every step is a seek per user.",
    ].join("\n"),
  },

  {
    slug: "monthly-signup-cohort-retention",
    title: "Monthly Signup Cohort Retention",
    difficulty: "HARD",
    topics: ["Dates", "Aggregation", "Joins"],
    description: [
      "The retention chart groups users into **cohorts by signup month** and asks what share of each cohort came back in the **calendar month right after** signup (month 1) and the **month after that** (month 2). Activity in the signup month itself does not count, and a user active several times in a month counts once.",
      "",
      "Return one row per cohort with `cohort_month` ('YYYY-MM'), `cohort_size`, `month_1_pct` and `month_2_pct` — each 100 × retained users ÷ `cohort_size`, **rounded to 1 decimal** (0.0 when nobody returned). Order by `cohort_month`.",
    ].join("\n"),
    tables: [
      {
        name: "users",
        columns: [
          { name: "user_id", type: "int" },
          { name: "signed_up_on", type: "date" },
        ],
        primaryKey: ["user_id"],
        note: "One row per signup.",
      },
      {
        name: "activity",
        columns: [
          { name: "activity_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "active_on", type: "date" },
        ],
        primaryKey: ["activity_id"],
        note: "One row per day a user was active (several rows may share a month); `user_id` always names a row of `users`.",
      },
    ],
    examples: [
      {
        users: [
          [1, "2024-01-10"],
          [2, "2024-01-25"],
          [3, "2024-01-31"],
          [4, "2024-02-05"],
          [5, "2024-02-20"],
          [6, "2024-03-02"],
        ],
        activity: [
          [1, 1, "2024-01-12"],
          [2, 1, "2024-02-03"],
          [3, 1, "2024-02-20"],
          [4, 2, "2024-03-15"],
          [5, 3, "2024-02-29"],
          [6, 4, "2024-03-10"],
          [7, 5, "2024-04-01"],
          [8, 6, "2024-03-05"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 14);
      const users: Cell[][] = seq(1, n).map((id) => [id, chance(rng, 0.15) ? pick(rng, ["2024-01-31", "2024-02-29", "2024-03-01"]) : dateBetween(rng, "2024-01-01", "2024-04-30")]);
      const activity: Cell[][] = [];
      let aid = 1;
      for (const u of users) {
        for (let j = 0, k = ri(rng, 0, 3); j < k && activity.length < 30; j++) {
          activity.push([aid++, u[0]!, addDays(u[1] as string, pick(rng, [1, 10, 25, 30, 40, 55, 70]))]);
        }
      }
      return { users, activity };
    },
    solution: [
      "WITH cohorts AS (",
      "  SELECT user_id, DATE_FORMAT(signed_up_on, '%Y-%m') AS cohort_month,",
      "         YEAR(signed_up_on) * 12 + MONTH(signed_up_on) AS month_key",
      "  FROM users",
      "), active_months AS (",
      "  SELECT DISTINCT user_id, YEAR(active_on) * 12 + MONTH(active_on) AS month_key",
      "  FROM activity",
      ")",
      "SELECT c.cohort_month,",
      "       COUNT(DISTINCT c.user_id) AS cohort_size,",
      "       ROUND(100 * COUNT(DISTINCT CASE WHEN a.month_key = c.month_key + 1 THEN c.user_id END) / COUNT(DISTINCT c.user_id), 1) AS month_1_pct,",
      "       ROUND(100 * COUNT(DISTINCT CASE WHEN a.month_key = c.month_key + 2 THEN c.user_id END) / COUNT(DISTINCT c.user_id), 1) AS month_2_pct",
      "FROM cohorts c",
      "LEFT JOIN active_months a ON a.user_id = c.user_id",
      "GROUP BY c.cohort_month",
      "ORDER BY c.cohort_month",
    ].join("\n"),
    alternatives: [
      [
        "SELECT cohort_month, COUNT(*) AS cohort_size,",
        "       ROUND(100 * SUM(m1) / COUNT(*), 1) AS month_1_pct,",
        "       ROUND(100 * SUM(m2) / COUNT(*), 1) AS month_2_pct",
        "FROM (",
        "  SELECT DATE_FORMAT(u.signed_up_on, '%Y-%m') AS cohort_month,",
        "         CASE WHEN EXISTS (SELECT 1 FROM activity a WHERE a.user_id = u.user_id",
        "              AND DATE_FORMAT(a.active_on, '%Y-%m') = DATE_FORMAT(DATE_ADD(u.signed_up_on, INTERVAL 1 MONTH), '%Y-%m')) THEN 1 ELSE 0 END AS m1,",
        "         CASE WHEN EXISTS (SELECT 1 FROM activity a WHERE a.user_id = u.user_id",
        "              AND DATE_FORMAT(a.active_on, '%Y-%m') = DATE_FORMAT(DATE_ADD(u.signed_up_on, INTERVAL 2 MONTH), '%Y-%m')) THEN 1 ELSE 0 END AS m2",
        "  FROM users u",
        ") flags",
        "GROUP BY cohort_month",
        "ORDER BY cohort_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Give every month a number (year × 12 + month) so \"the next month\" is +1, even from December to January.",
      "Reduce activity to distinct (user, month) pairs before joining, or count distinct users.",
      "LEFT JOIN keeps users who never came back in the cohort size.",
      "A conditional COUNT(DISTINCT CASE …) counts the users retained in month 1 and month 2 in the same pass.",
    ],
    editorial: [
      "Retention is about **calendar months relative to signup**, so the cleanest representation is a month number: `YEAR * 12 + MONTH`. Month 1 for a cohort is then `cohort key + 1`, month 2 is `+ 2`, and December rolls into January without special cases. Days do not matter — user 3 signed up on 31 January and was active on 29 February, which is month 1, even though only a few weeks passed.",
      "",
      "Activity is reduced to distinct (user, month) pairs and LEFT JOINed to the cohorts, so a user who never returned still counts in `cohort_size`. Within each cohort, `COUNT(DISTINCT CASE WHEN a.month_key = c.month_key + 1 THEN c.user_id END)` counts the month-1 returners and the same with `+ 2` counts month 2; activity in the signup month matches neither. The shares are rounded to one decimal, which also keeps MySQL's four-decimal division out of the answer.",
      "",
      "The alternative builds a 0/1 flag per user with `EXISTS`, comparing the activity's 'YYYY-MM' with that of `DATE_ADD(signed_up_on, INTERVAL n MONTH)` — adding months to 31 January lands on 29 February, still the right month. Averaging flags per cohort is the same ratio. The join version is one pass over each table; the EXISTS version is a lookup per user per month.",
    ].join("\n"),
  },

  {
    slug: "longest-daily-usage-streak-per-user",
    title: "Longest Daily Usage Streak per User",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "The app shows each user their best **streak**: the longest run of **consecutive calendar days** on which they used the product at least once. Several uses on one day are one day, and a streak may cross a month boundary.",
      "",
      "Return `user_id`, `longest_streak` (in days) and `streak_start` (the first day of that streak) for every user with usage. If a user has two streaks of the same longest length, report the **earliest** one. Order by `user_id`.",
    ].join("\n"),
    tables: [
      {
        name: "usage_log",
        columns: [
          { name: "log_id", type: "int" },
          { name: "user_id", type: "int" },
          { name: "used_at", type: "datetime" },
        ],
        primaryKey: ["log_id"],
        note: "One row per use of the app.",
      },
    ],
    examples: [
      {
        usage_log: [
          [1, 1, "2024-06-01 09:00:00"],
          [2, 1, "2024-06-02 08:30:00"],
          [3, 1, "2024-06-02 21:15:00"],
          [4, 1, "2024-06-03 07:45:00"],
          [5, 1, "2024-06-05 10:00:00"],
          [6, 1, "2024-06-06 10:00:00"],
          [7, 1, "2024-06-07 23:59:00"],
          [8, 2, "2024-06-10 12:00:00"],
          [9, 3, "2024-06-28 18:00:00"],
          [10, 3, "2024-06-29 18:00:00"],
          [11, 3, "2024-06-30 18:00:00"],
          [12, 3, "2024-07-01 00:05:00"],
          [13, 3, "2024-07-03 18:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      let lid = 1;
      for (const u of seq(1, ri(rng, 1, 4))) {
        let day = dateBetween(rng, "2024-06-20", "2024-06-28");
        for (let run = 0, runs = ri(rng, 1, 3); run < runs; run++) {
          for (let j = 0, len = ri(rng, 1, 4); j < len && rows.length < 30; j++) {
            rows.push([lid++, u, atTime(rng, day)]);
            if (chance(rng, 0.2) && rows.length < 30) rows.push([lid++, u, atTime(rng, day)]);
            day = addDays(day, 1);
          }
          day = addDays(day, ri(rng, 1, 3));
        }
      }
      return { usage_log: rows };
    },
    solution: [
      "WITH days AS (",
      "  SELECT DISTINCT user_id, DATE(used_at) AS day FROM usage_log",
      "), islands AS (",
      "  SELECT user_id, day,",
      "         DATEDIFF(day, '2000-01-01') - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day) AS grp",
      "  FROM days",
      "), streaks AS (",
      "  SELECT user_id, MIN(day) AS streak_start, COUNT(*) AS len",
      "  FROM islands",
      "  GROUP BY user_id, grp",
      "), ranked AS (",
      "  SELECT user_id, streak_start, len,",
      "         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY len DESC, streak_start) AS rn",
      "  FROM streaks",
      ")",
      "SELECT user_id, len AS longest_streak, streak_start",
      "FROM ranked",
      "WHERE rn = 1",
      "ORDER BY user_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH days AS (",
        "  SELECT DISTINCT user_id, DATE(used_at) AS day FROM usage_log",
        "), marked AS (",
        "  SELECT user_id, day,",
        "         CASE WHEN DATEDIFF(day, LAG(day) OVER (PARTITION BY user_id ORDER BY day)) = 1 THEN 0 ELSE 1 END AS is_start",
        "  FROM days",
        "), numbered AS (",
        "  SELECT user_id, day, SUM(is_start) OVER (PARTITION BY user_id ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS island",
        "  FROM marked",
        "), streaks AS (",
        "  SELECT user_id, island, MIN(day) AS streak_start, COUNT(*) AS len FROM numbered GROUP BY user_id, island",
        ")",
        "SELECT s.user_id, s.len AS longest_streak, s.streak_start",
        "FROM streaks s",
        "WHERE NOT EXISTS (SELECT 1 FROM streaks t WHERE t.user_id = s.user_id",
        "                  AND (t.len > s.len OR (t.len = s.len AND t.streak_start < s.streak_start)))",
        "ORDER BY s.user_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First reduce the log to one row per user per day.",
      "Within a run of consecutive days, the day number and the row number both go up by one — so their difference is constant.",
      "Group by that difference to get each streak's start and length.",
      "Pick one streak per user with ROW_NUMBER, ordering by length and then start date to break ties.",
    ],
    editorial: [
      "A classic **gaps and islands** problem. Deduplicate to distinct (user, day) pairs — two uses on 2 June are one day — then number each user's days in order with `ROW_NUMBER()`. Inside a run of consecutive days both the date and the row number rise by exactly one, so `DATEDIFF(day, '2000-01-01') - row_number` is the same for every day of the run and changes at every gap. That value is the island's key; it is computed on integer day numbers rather than by subtracting an interval from a date, which keeps it simple in every engine.",
      "",
      "Grouping by (user, key) gives each streak's first day and length. Because the key comes from day arithmetic, a streak crossing a month boundary — 28 June to 1 July for user 3 — stays one island.",
      "",
      "Choosing one streak per user with ties is a top-1-per-group: `ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY len DESC, streak_start)` makes the longest come first and the earliest win a tie (user 1 has two three-day streaks, and 1 June wins).",
      "",
      "The alternative marks island starts with LAG — a day whose previous day is not exactly one day earlier — numbers islands with a running sum, and keeps the streak no other streak beats via `NOT EXISTS`. Both are a sort per user.",
    ].join("\n"),
  },

  {
    slug: "month-end-mrr-from-subscription-periods",
    title: "Month-End MRR From Subscription Periods",
    difficulty: "HARD",
    topics: ["Dates", "Subqueries", "Joins"],
    description: [
      "Finance reports MRR as a snapshot on the **last day of each month**. A subscription is live on a month end `E` when it **started on or before `E`** and has **not ended by then** — `ended_on` is NULL or **after** `E` (a subscription ending on the 31st is not live that evening). A subscription that started and ended inside one month never shows up in a snapshot.",
      "",
      "Return one row for **every month end from 2024-01-31 to 2024-06-30**, even when nothing is live, with `month_end`, `active_subscriptions` and `mrr` (the sum of live subscriptions' `mrr`, 0 when none). Order by `month_end`.",
    ].join("\n"),
    tables: [
      {
        name: "subscriptions",
        columns: [
          { name: "subscription_id", type: "int" },
          { name: "account_id", type: "int" },
          { name: "mrr", type: "int" },
          { name: "started_on", type: "date" },
          { name: "ended_on", type: "date" },
        ],
        primaryKey: ["subscription_id"],
        note: "One row per subscription (an account may hold several, e.g. add-ons); `ended_on` is NULL while it runs.",
      },
    ],
    examples: [
      {
        subscriptions: [
          [1, 101, 4999, "2023-11-15", null],
          [2, 102, 24999, "2024-01-31", "2024-03-31"],
          [3, 103, 9999, "2024-02-10", "2024-02-20"],
          [4, 104, 39999, "2024-03-01", null],
          [5, 105, 9999, "2024-04-30", "2024-06-15"],
          [6, 101, 2999, "2024-05-01", null],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 14);
      const ends = ["2024-01-31", "2024-02-29", "2024-03-31", "2024-04-30", "2024-05-31", "2024-06-30"];
      const rows: Cell[][] = seq(1, n).map((id) => {
        const start = chance(rng, 0.25) ? pick(rng, ends) : dateBetween(rng, "2023-12-01", "2024-06-30");
        const end = chance(rng, 0.45) ? null : chance(rng, 0.3) ? pick(rng, ends.filter((e) => e >= start)) ?? null : addDays(start, ri(rng, 5, 120));
        return [id, ri(rng, 101, 110), pick(rng, [2999, 4999, 9999, 24999, 39999]), start, end];
      });
      return { subscriptions: rows };
    },
    solution: [
      "WITH RECURSIVE months AS (",
      "  SELECT 0 AS n",
      "  UNION ALL",
      "  SELECT n + 1 FROM months WHERE n < 5",
      "), month_ends AS (",
      "  SELECT LAST_DAY(DATE_ADD('2024-01-01', INTERVAL n MONTH)) AS month_end FROM months",
      ")",
      "SELECT e.month_end,",
      "       COUNT(s.subscription_id) AS active_subscriptions,",
      "       COALESCE(SUM(s.mrr), 0) AS mrr",
      "FROM month_ends e",
      "LEFT JOIN subscriptions s",
      "  ON s.started_on <= e.month_end AND (s.ended_on IS NULL OR s.ended_on > e.month_end)",
      "GROUP BY e.month_end",
      "ORDER BY e.month_end",
    ].join("\n"),
    alternatives: [
      [
        "SELECT month_end,",
        "       (SELECT COUNT(*) FROM subscriptions s WHERE s.started_on <= e.month_end AND (s.ended_on IS NULL OR s.ended_on > e.month_end)) AS active_subscriptions,",
        "       (SELECT COALESCE(SUM(s.mrr), 0) FROM subscriptions s WHERE s.started_on <= e.month_end AND (s.ended_on IS NULL OR s.ended_on > e.month_end)) AS mrr",
        "FROM (",
        "  SELECT '2024-01-31' AS month_end UNION ALL SELECT '2024-02-29' UNION ALL SELECT '2024-03-31'",
        "  UNION ALL SELECT '2024-04-30' UNION ALL SELECT '2024-05-31' UNION ALL SELECT '2024-06-30'",
        ") e",
        "ORDER BY month_end",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The answer has a row for months with no data, so the months must come from somewhere other than the subscriptions table.",
      "A recursive CTE counting 0 to 5 plus LAST_DAY(DATE_ADD(…, INTERVAL n MONTH)) gives the six month ends.",
      "Join each month end to the subscriptions live on it — the join condition is an interval test, not an equality.",
      "LEFT JOIN, COUNT of a subscription column and COALESCE on the SUM give zeros for empty months.",
    ],
    editorial: [
      "A snapshot report needs a **calendar spine**: one row per reporting date whether or not anything happened. A recursive CTE produces the numbers 0–5, and `LAST_DAY(DATE_ADD('2024-01-01', INTERVAL n MONTH))` turns each into a month end — LAST_DAY knows February 2024 has 29 days, so nothing is typed by hand. The recursion is bounded by `n < 5`, so it stops after six rows.",
      "",
      "Each month end is then LEFT JOINed to every subscription live on it: `started_on <= month_end AND (ended_on IS NULL OR ended_on > month_end)`. This is a range join — one subscription matches every month end it spans. The strict `>` means a subscription that ends on 31 March is not in the March snapshot; one starting on 31 January is in January's. A two-week subscription inside February matches no month end at all.",
      "",
      "Grouping by month end, `COUNT(s.subscription_id)` counts live subscriptions (0 for a month whose only row is the LEFT JOIN's NULL padding), and `COALESCE(SUM(s.mrr), 0)` replaces the NULL sum of an empty month with 0.",
      "",
      "The alternative lists the month ends literally and computes each figure with a correlated scalar subquery — simple for six dates, but the spine has to be edited by hand and the table is scanned twice per month. The join plan scans subscriptions once per month end, fine for a small spine; at scale you would expand each subscription into its month ends instead.",
    ].join("\n"),
  },

  {
    slug: "median-days-from-trial-to-paid-by-channel",
    title: "Median Days From Trial to Paid by Acquisition Channel",
    difficulty: "HARD",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "Marketing compares acquisition channels by how quickly their trials turn into paying customers. For each converted trial, the time to convert is `DATEDIFF(converted_on, started_on)` days. A channel's **median** is the middle value of its converted trials' days, or the **average of the two middle values** when the count is even. Trials that never converted are ignored.",
      "",
      "Return `channel`, `converted_trials` and `median_days` **rounded to 1 decimal** for every channel with at least one conversion, ordered by `channel`.",
    ].join("\n"),
    tables: [
      {
        name: "trials",
        columns: [
          { name: "trial_id", type: "int" },
          { name: "workspace_name", type: "varchar" },
          { name: "channel", type: "enum", values: ["organic", "paid_search", "partner", "referral"] },
          { name: "started_on", type: "date" },
          { name: "converted_on", type: "date" },
        ],
        primaryKey: ["trial_id"],
        note: "One row per free trial; `converted_on` is the first paid day, or NULL.",
      },
    ],
    examples: [
      {
        trials: [
          [1, "Zentrix Labs", "organic", "2024-03-01", "2024-03-11"],
          [2, "Quillpad", "organic", "2024-03-02", "2024-03-06"],
          [3, "Ledgerly", "organic", "2024-03-05", null],
          [4, "Orbitpay", "organic", "2024-03-07", "2024-03-14"],
          [5, "Vaani AI", "paid_search", "2024-03-01", "2024-03-03"],
          [6, "Tiffinly", "paid_search", "2024-03-04", "2024-03-13"],
          [7, "Mintmark", "referral", "2024-03-08", "2024-03-09"],
          [8, "Kiranakart", "partner", "2024-03-02", null],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 22);
      const channels = sample(rng, ["organic", "paid_search", "partner", "referral"], ri(rng, 1, 4));
      const rows: Cell[][] = seq(1, n).map((id) => {
        const start = dateBetween(rng, "2024-03-01", "2024-03-31");
        return [id, pick(rng, COMPANIES), pick(rng, channels), start, maybeNull(rng, 0.3, addDays(start, pick(rng, [0, 1, 3, 3, 7, 7, 10, 14])))];
      });
      return { trials: rows };
    },
    solution: [
      "WITH conv AS (",
      "  SELECT channel, DATEDIFF(converted_on, started_on) AS days,",
      "         ROW_NUMBER() OVER (PARTITION BY channel ORDER BY DATEDIFF(converted_on, started_on), trial_id) AS rn,",
      "         COUNT(*) OVER (PARTITION BY channel) AS cnt",
      "  FROM trials",
      "  WHERE converted_on IS NOT NULL",
      ")",
      "SELECT channel, MAX(cnt) AS converted_trials, ROUND(AVG(days), 1) AS median_days",
      "FROM conv",
      "WHERE rn IN (FLOOR((cnt + 1) / 2), FLOOR((cnt + 2) / 2))",
      "GROUP BY channel",
      "ORDER BY channel",
    ].join("\n"),
    alternatives: [
      [
        "WITH conv AS (",
        "  SELECT trial_id, channel, DATEDIFF(converted_on, started_on) AS days FROM trials WHERE converted_on IS NOT NULL",
        ")",
        "SELECT c.channel,",
        "       (SELECT COUNT(*) FROM conv x WHERE x.channel = c.channel) AS converted_trials,",
        "       ROUND(AVG(DISTINCT c.days), 1) AS median_days",
        "FROM conv c",
        "WHERE (SELECT COUNT(*) FROM conv x WHERE x.channel = c.channel AND x.days <= c.days) * 2 >= (SELECT COUNT(*) FROM conv x WHERE x.channel = c.channel)",
        "  AND (SELECT COUNT(*) FROM conv x WHERE x.channel = c.channel AND x.days >= c.days) * 2 >= (SELECT COUNT(*) FROM conv x WHERE x.channel = c.channel)",
        "GROUP BY c.channel",
        "ORDER BY c.channel",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Filter to converted trials first, so unconverted ones never take a position in the ordering.",
      "Number each channel's conversions in order of days, and count how many the channel has.",
      "For a count n, the middle positions are FLOOR((n + 1) / 2) and FLOOR((n + 2) / 2) — the same position when n is odd.",
      "Average the one or two middle values.",
    ],
    editorial: [
      "There is no MEDIAN in MySQL, so it is built from a ranking. Keep only converted trials, compute each one's days, and in a window per channel number them by days (`ROW_NUMBER`, with `trial_id` breaking equal days so the numbering is deterministic) and count them (`COUNT(*) OVER`).",
      "",
      "For a count `n`, positions `FLOOR((n + 1) / 2)` and `FLOOR((n + 2) / 2)` are the middle: for n = 3 both are 2, for n = 2 they are 1 and 2. Keeping those rows and averaging their days gives the median in both cases — 4, 7, 10 → 7.0 for organic, and 2, 9 → 5.5 for paid search. Equal day counts do not matter: whichever tied row sits in the middle position has the same value. Because the average of two integers ends in .0 or .5, rounding to one decimal is exact.",
      "",
      "The window-free alternative uses the definition of a median: a value is a middle value when at least half the values are ≤ it and at least half are ≥ it. Those values are the one or two medians (possibly repeated), so `AVG(DISTINCT days)` over them is the median. It runs four correlated counts per row — quadratic — while the window plan is one sort per channel.",
    ].join("\n"),
  },

  {
    slug: "mrr-movements-new-expansion-contraction-churn",
    title: "MRR Movements: New, Expansion, Contraction and Churn",
    difficulty: "HARD",
    topics: ["Joins", "Conditional Logic", "Aggregation"],
    description: [
      "The SaaS metrics pack breaks each month's MRR change into four movements by comparing every account's MRR with the **previous calendar month**. An account with no row in a month paid nothing that month (MRR 0).",
      "",
      "- `new_mrr`: accounts with MRR this month and none last month — their whole MRR (this includes reactivations);",
      "- `expansion_mrr`: accounts paying in both months, more now — the increase;",
      "- `contraction_mrr`: accounts paying in both months, less now — the decrease, as a positive number;",
      "- `churned_mrr`: accounts paying last month and nothing this month — last month's MRR.",
      "",
      "Return one row per month from **2024-02-01 to 2024-05-01** (`month_start`), with the four columns (0 when nothing moved), ordered by `month_start`. Snapshots cover January to May 2024.",
    ].join("\n"),
    tables: [
      {
        name: "account_mrr",
        columns: [
          { name: "account_id", type: "int" },
          { name: "month_start", type: "date" },
          { name: "mrr", type: "int" },
        ],
        primaryKey: ["account_id", "month_start"],
        note: "One row per account per month it paid; `month_start` is always the first of a month between 2024-01-01 and 2024-05-01, `mrr` is positive (rupees).",
      },
    ],
    examples: [
      {
        account_mrr: [
          [1, "2024-01-01", 4999],
          [2, "2024-01-01", 9999],
          [3, "2024-01-01", 24999],
          [1, "2024-02-01", 4999],
          [2, "2024-02-01", 14999],
          [4, "2024-02-01", 9999],
          [1, "2024-03-01", 2999],
          [2, "2024-03-01", 14999],
          [3, "2024-03-01", 24999],
          [4, "2024-03-01", 9999],
          [1, "2024-04-01", 2999],
          [2, "2024-04-01", 19999],
        ],
      },
    ],
    gen: (rng) => {
      const months = ["2024-01-01", "2024-02-01", "2024-03-01", "2024-04-01", "2024-05-01"];
      const rows: Cell[][] = [];
      for (const acct of seq(1, ri(rng, 1, 6))) {
        let mrr = pick(rng, [2999, 4999, 9999, 14999, 24999]);
        const presence = pick(rng, [0.5, 0.75, 0.9]);
        for (const m of months) {
          if (rows.length >= 30) break;
          if (chance(rng, 0.3)) mrr = pick(rng, [2999, 4999, 9999, 14999, 24999]);
          if (chance(rng, presence)) rows.push([acct, m, mrr]);
        }
      }
      return { account_mrr: rows };
    },
    solution: [
      "WITH RECURSIVE months AS (",
      "  SELECT CAST('2024-02-01' AS DATE) AS m",
      "  UNION ALL",
      "  SELECT DATE_ADD(m, INTERVAL 1 MONTH) FROM months WHERE m < '2024-05-01'",
      "), pairs AS (",
      "  SELECT mo.m, cur.mrr AS cur_mrr, prev.mrr AS prev_mrr",
      "  FROM months mo",
      "  JOIN account_mrr cur ON cur.month_start = mo.m",
      "  LEFT JOIN account_mrr prev ON prev.account_id = cur.account_id AND prev.month_start = DATE_SUB(mo.m, INTERVAL 1 MONTH)",
      "  UNION ALL",
      "  SELECT mo.m, NULL, prev.mrr",
      "  FROM months mo",
      "  JOIN account_mrr prev ON prev.month_start = DATE_SUB(mo.m, INTERVAL 1 MONTH)",
      "  WHERE NOT EXISTS (SELECT 1 FROM account_mrr cur WHERE cur.account_id = prev.account_id AND cur.month_start = mo.m)",
      ")",
      "SELECT mo.m AS month_start,",
      "       COALESCE(SUM(CASE WHEN p.prev_mrr IS NULL THEN p.cur_mrr END), 0) AS new_mrr,",
      "       COALESCE(SUM(CASE WHEN p.cur_mrr > p.prev_mrr THEN p.cur_mrr - p.prev_mrr END), 0) AS expansion_mrr,",
      "       COALESCE(SUM(CASE WHEN p.cur_mrr < p.prev_mrr THEN p.prev_mrr - p.cur_mrr END), 0) AS contraction_mrr,",
      "       COALESCE(SUM(CASE WHEN p.cur_mrr IS NULL THEN p.prev_mrr END), 0) AS churned_mrr",
      "FROM months mo",
      "LEFT JOIN pairs p ON p.m = mo.m",
      "GROUP BY mo.m",
      "ORDER BY mo.m",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE months AS (",
        "  SELECT CAST('2024-01-01' AS DATE) AS m",
        "  UNION ALL",
        "  SELECT DATE_ADD(m, INTERVAL 1 MONTH) FROM months WHERE m < '2024-05-01'",
        "), grid AS (",
        "  SELECT a.account_id, mo.m, COALESCE(x.mrr, 0) AS mrr",
        "  FROM (SELECT DISTINCT account_id FROM account_mrr) a",
        "  CROSS JOIN months mo",
        "  LEFT JOIN account_mrr x ON x.account_id = a.account_id AND x.month_start = mo.m",
        "), moves AS (",
        "  SELECT m, mrr, LAG(mrr) OVER (PARTITION BY account_id ORDER BY m) AS prev FROM grid",
        ")",
        "SELECT mo.m AS month_start,",
        "       SUM(CASE WHEN v.prev = 0 AND v.mrr > 0 THEN v.mrr ELSE 0 END) AS new_mrr,",
        "       SUM(CASE WHEN v.prev > 0 AND v.mrr > v.prev THEN v.mrr - v.prev ELSE 0 END) AS expansion_mrr,",
        "       SUM(CASE WHEN v.mrr > 0 AND v.mrr < v.prev THEN v.prev - v.mrr ELSE 0 END) AS contraction_mrr,",
        "       SUM(CASE WHEN v.prev > 0 AND v.mrr = 0 THEN v.prev ELSE 0 END) AS churned_mrr",
        "FROM months mo",
        "LEFT JOIN moves v ON v.m = mo.m",
        "WHERE mo.m >= '2024-02-01'",
        "GROUP BY mo.m",
        "ORDER BY mo.m",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Churn is about accounts that are *missing* this month — a plain join from this month's rows can never see them.",
      "Pair each account's row this month with its row last month (LEFT JOIN), and separately find last month's rows with no row this month.",
      "Alternatively, build a dense account × month grid with 0 for missing months, and compare with LAG.",
      "Generate the reporting months yourself so a month where nothing moved still gets a row of zeros.",
    ],
    editorial: [
      "Every movement compares an account's MRR in month M with month M − 1, and two of them are about rows that are **absent**: new MRR has no previous row and churn has no current row. A single join from either side can see only one of those, so the comparison set is built from both directions — the pattern a FULL OUTER JOIN would give, which MySQL lacks.",
      "",
      "The solution generates the reporting months with a bounded recursive CTE (February to May, `DATE_ADD(m, INTERVAL 1 MONTH)`). Then `pairs` is a UNION ALL of (a) each current row LEFT JOINed to the same account's row of the previous month — `prev_mrr` NULL means new — and (b) each previous-month row with no current row (`NOT EXISTS`), which is churn. Conditional sums classify every pair: increase, decrease, whole new amount, whole lost amount; an unchanged account adds to nothing. Months are LEFT JOINed to the pairs and COALESCE turns empty sums into 0, so a quiet month still reports zeros.",
      "",
      "The alternative densifies instead: cross join every account with every month from January, fill missing months with 0, and take `LAG(mrr)` per account. With zeros in place, new is `prev = 0 AND mrr > 0` and churn is `prev > 0 AND mrr = 0`, and one window pass replaces the two-sided join. Densifying is the standard warehouse approach — it costs accounts × months rows, which is small here and keeps the logic in one place.",
    ].join("\n"),
  },
];
