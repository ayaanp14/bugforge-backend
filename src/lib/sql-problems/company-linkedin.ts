import type { Cell } from "../sql/types.js";
import type { SqlProblemSpec } from "./types.js";
import { addDays, atTime, chance, dateBetween, FIRST_NAMES, LAST_NAMES, pick, ri, sample, shuffle } from "./kit.js";

/**
 * LinkedIn: the questions a data analyst or engineer on a professional
 * network is handed — connections and invitations, job postings and Easy
 * Apply, recruiter InMail, Premium trials and subscriptions, skill
 * endorsements, posts and reactions, profile views, LinkedIn Learning,
 * company pages and members' work history. The schemas and data are
 * invented for practice; nothing here is LinkedIn's real schema or a real
 * figure. Easiest first.
 */

/** `n` consecutive integers from `from`. */
const seq = (from: number, n: number): number[] => Array.from({ length: n }, (_, i) => from + i);
const fullName = (rng: () => number): string => `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;

const COMPANIES = [
  "Northwind Labs", "Bluepeak Systems", "Kestrel Analytics", "Saffron Fintech", "Monsoon Logistics",
  "Lotus Health", "Orbit Retail", "Tidewater Media", "Cedar Robotics", "Indigo Learning",
] as const;
const SKILLS = ["SQL", "Python", "Java", "Excel", "Leadership", "Figma", "Data Analysis", "Public Speaking", "Product Management", "Machine Learning"] as const;
const JOB_TITLES = ["Data Analyst", "Software Engineer", "Product Manager", "UX Designer", "Sales Associate"] as const;
const PLANS = ["Career", "Business", "Sales Navigator", "Recruiter Lite"] as const;
const REACTIONS = ["celebrate", "funny", "insightful", "like", "love", "support"] as const;
const INDUSTRIES = ["Software", "Banking", "Healthcare", "Education"] as const;
const COURSE_CATEGORIES = ["Data Science", "Leadership", "Software Development", "Marketing", "Project Management"] as const;

/** Every unordered pair of 1..n with probability p, stored once with the smaller id first. */
function randomEdges(rng: () => number, n: number, p: number): [number, number][] {
  const out: [number, number][] = [];
  for (let a = 1; a <= n; a++) for (let b = a + 1; b <= n; b++) if (chance(rng, p)) out.push([a, b]);
  return out;
}

export const COMPANY_LINKEDIN: SqlProblemSpec[] = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    slug: "linkedin-invitations-pending-over-thirty-days",
    title: "LinkedIn: Invitations Pending for More Than 30 Days",
    difficulty: "EASY",
    topics: ["Basics", "Dates"],
    description: [
      "The growth team sends a gentle reminder to members whose connection invitation has sat unanswered for too long, and wants the list as of **2025-06-30**.",
      "",
      "Return `invitation_id`, `sender_id` and `days_pending` — the number of days from `sent_on` to 2025-06-30 — for every invitation whose status is `pending` and whose `days_pending` is **strictly greater than 30**. Accepted, ignored and withdrawn invitations are never in the answer. Order the rows by `days_pending` descending, then by `invitation_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Invitation",
        columns: [
          { name: "invitation_id", type: "int" },
          { name: "sender_id", type: "int" },
          { name: "recipient_id", type: "int" },
          { name: "sent_on", type: "date" },
          { name: "status", type: "enum", values: ["pending", "accepted", "ignored", "withdrawn"] },
        ],
        primaryKey: ["invitation_id"],
        note: "One row per connection invitation. Every `sent_on` is on or before 2025-06-30.",
      },
    ],
    examples: [
      {
        Invitation: [
          [1, 11, 41, "2025-05-30", "pending"],
          [2, 12, 42, "2025-05-31", "pending"],
          [3, 13, 43, "2025-04-02", "accepted"],
          [4, 14, 44, "2025-04-20", "pending"],
          [5, 15, 45, "2025-06-15", "pending"],
          [6, 16, 46, "2025-04-20", "pending"],
          [7, 17, 47, "2025-03-11", "withdrawn"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 4, 18);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 1, 30),
        ri(rng, 31, 60),
        chance(rng, 0.25) ? pick(rng, ["2025-05-29", "2025-05-30", "2025-05-31", "2025-06-01"]) : dateBetween(rng, "2025-03-01", "2025-06-30"),
        pick(rng, ["pending", "pending", "pending", "accepted", "ignored", "withdrawn"]),
      ]);
      return { Invitation: rows };
    },
    solution: [
      "SELECT invitation_id, sender_id, DATEDIFF('2025-06-30', sent_on) AS days_pending",
      "FROM Invitation",
      "WHERE status = 'pending'",
      "  AND DATEDIFF('2025-06-30', sent_on) > 30",
      "ORDER BY days_pending DESC, invitation_id",
    ].join("\n"),
    alternatives: [
      "SELECT invitation_id, sender_id, TIMESTAMPDIFF(DAY, sent_on, '2025-06-30') AS days_pending FROM Invitation WHERE status = 'pending' AND sent_on < DATE_SUB('2025-06-30', INTERVAL 30 DAY) ORDER BY days_pending DESC, invitation_id",
    ],
    ordered: true,
    hints: [
      "`DATEDIFF(later, earlier)` gives the whole days between two dates.",
      "\"More than 30\" is strict: an invitation sent exactly 30 days earlier is not overdue yet.",
      "Sort on the computed column first and on the id second so ties come out in a fixed order.",
    ],
    editorial: [
      "Each invitation qualifies on its own, so this is a filter with a computed column. `DATEDIFF('2025-06-30', sent_on)` counts the days the invitation has been waiting; keep the rows whose status is `pending` and whose wait is greater than 30.",
      "",
      "The boundary matters: an invitation sent on 2025-05-31 has waited exactly 30 days and stays out, while one from 2025-05-30 has waited 31 and is in. The alternative turns the condition around into a date comparison — `sent_on < DATE_SUB('2025-06-30', INTERVAL 30 DAY)` — which can use an index on `sent_on` because the column is not wrapped in a function, and computes the same day count with `TIMESTAMPDIFF(DAY, …)`.",
      "",
      "Two invitations sent on the same day have the same `days_pending`, so the order needs the second key `invitation_id` to be fixed. The query is one scan of the table.",
    ].join("\n"),
  },

  {
    slug: "linkedin-open-to-work-members-with-blank-headline",
    title: "LinkedIn: Open-to-Work Members With a Blank Headline",
    difficulty: "EASY",
    topics: ["Basics", "Strings"],
    description: [
      "Recruiters skim the headline first, so the career-tools team wants to nudge members who switched on **open to work** but left their headline empty.",
      "",
      "Return `member_id` and `full_name` of every member with `open_to_work = 1` whose headline is **blank**: NULL, the empty string, or nothing but spaces. Members not open to work never appear. Order the rows by `member_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Member",
        columns: [
          { name: "member_id", type: "int" },
          { name: "full_name", type: "varchar" },
          { name: "open_to_work", type: "bool" },
          { name: "headline", type: "varchar" },
        ],
        primaryKey: ["member_id"],
        note: "`open_to_work` is 1 when the member shows the open-to-work frame; `headline` is the line under the name and may be NULL.",
      },
    ],
    examples: [
      {
        Member: [
          [1, "Aditi Rao", 1, "Data Analyst | SQL, Power BI"],
          [2, "Kabir Khan", 1, null],
          [3, "Sneha Iyer", 1, ""],
          [4, "Rohan Das", 0, null],
          [5, "Meera Nair", 1, "   "],
          [6, "Vikram Joshi", 1, " Aspiring Product Manager "],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 3, 15);
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        fullName(rng),
        chance(rng, 0.55) ? 1 : 0,
        pick(rng, [null, "", "   ", " ", "Software Engineer at Northwind Labs", "Aspiring Product Manager", "  Data Analyst  ", "Final-year student, B.Tech CSE", "Recruiter | Tech hiring"]),
      ]);
      return { Member: rows };
    },
    solution: [
      "SELECT member_id, full_name",
      "FROM Member",
      "WHERE open_to_work = 1",
      "  AND (headline IS NULL OR TRIM(headline) = '')",
      "ORDER BY member_id",
    ].join("\n"),
    alternatives: [
      "SELECT member_id, full_name FROM Member WHERE open_to_work = 1 AND CHAR_LENGTH(TRIM(COALESCE(headline, ''))) = 0 ORDER BY member_id",
      "SELECT member_id, full_name FROM Member WHERE open_to_work = 1 AND NOT (headline IS NOT NULL AND LENGTH(TRIM(headline)) > 0) ORDER BY member_id",
    ],
    ordered: true,
    hints: [
      "A NULL headline is not equal to `''` — `NULL = ''` is NULL, which WHERE treats as false.",
      "`TRIM` removes the leading and trailing spaces, so a headline of only spaces becomes `''`.",
      "Either test NULL separately, or turn NULL into `''` first with COALESCE.",
    ],
    editorial: [
      "Three different values all mean \"no headline\": NULL, the empty string and a string of spaces. `TRIM(headline) = ''` catches the last two, because trimming a string of spaces leaves the empty string. It does not catch NULL — `TRIM(NULL)` is NULL and comparing NULL with anything is unknown — so NULL needs its own `IS NULL` test, joined with `OR` and wrapped in parentheses so that it binds before the `open_to_work = 1` condition.",
      "",
      "The first alternative folds NULL into the empty string up front with `COALESCE(headline, '')` and then measures the trimmed length; the second states the opposite condition (a headline with at least one visible character) and negates it. A headline with spaces around real words, like ' Aspiring Product Manager ', is not blank in any of them. The query is a single scan of `Member`.",
    ].join("\n"),
  },

  {
    slug: "linkedin-active-premium-members-per-plan",
    title: "LinkedIn: Active Premium Members per Plan on Quarter End",
    difficulty: "EASY",
    topics: ["Aggregation", "Dates"],
    description: [
      "Finance closes the quarter by counting how many members held each Premium plan on **2025-03-31**.",
      "",
      "A subscription is active on that day when `start_date` is on or before 2025-03-31 and `end_date` is NULL (still running) or on or after 2025-03-31. For each plan with at least one active subscription, return `plan` and `active_members`, the number of **different members** with an active subscription to it (a member with two overlapping rows of one plan counts once). Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "PremiumSubscription",
        columns: [
          { name: "subscription_id", type: "int" },
          { name: "member_id", type: "int" },
          { name: "plan", type: "enum", values: [...PLANS] },
          { name: "start_date", type: "date" },
          { name: "end_date", type: "date" },
        ],
        primaryKey: ["subscription_id"],
        note: "One row per subscription period. `end_date` is the last day of access, or NULL while the subscription is still running.",
      },
    ],
    examples: [
      {
        PremiumSubscription: [
          [1, 101, "Career", "2025-01-10", null],
          [2, 102, "Career", "2024-11-01", "2025-03-31"],
          [3, 103, "Career", "2024-12-01", "2025-03-30"],
          [4, 104, "Business", "2025-03-31", "2025-06-30"],
          [5, 101, "Career", "2025-03-01", "2025-04-30"],
          [6, 105, "Sales Navigator", "2025-04-01", null],
          [7, 106, "Business", "2024-06-01", null],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 3, 16);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const start = chance(rng, 0.15) ? "2025-03-31" : dateBetween(rng, "2024-06-01", "2025-05-31");
        const end = chance(rng, 0.35) ? null : chance(rng, 0.2) ? pick(rng, ["2025-03-30", "2025-03-31"]) : addDays(start, ri(rng, 10, 300));
        return [id, ri(rng, 1, 8), pick(rng, PLANS), start, end !== null && end < start ? start : end];
      });
      return { PremiumSubscription: rows };
    },
    solution: [
      "SELECT plan, COUNT(DISTINCT member_id) AS active_members",
      "FROM PremiumSubscription",
      "WHERE start_date <= '2025-03-31'",
      "  AND (end_date IS NULL OR end_date >= '2025-03-31')",
      "GROUP BY plan",
    ].join("\n"),
    alternatives: [
      "SELECT plan, COUNT(*) AS active_members FROM (SELECT DISTINCT plan, member_id FROM PremiumSubscription WHERE '2025-03-31' BETWEEN start_date AND COALESCE(end_date, '9999-12-31')) t GROUP BY plan",
    ],
    hints: [
      "Write the \"active on a day\" test first: started by then, and not yet ended.",
      "A NULL `end_date` means still running — it has to count as active.",
      "Count members, not rows: `COUNT(DISTINCT member_id)`.",
    ],
    editorial: [
      "A subscription covers a day when the day sits inside its period. The start test is plain (`start_date <= '2025-03-31'`), but the end has two shapes: a real date, which must be on or after the day, and NULL, which means the subscription is still open and therefore covers every day from its start. Testing `end_date >= '2025-03-31'` alone would silently drop every open subscription, because a comparison with NULL is never true — hence the `OR end_date IS NULL`.",
      "",
      "Both ends are inclusive: a period ending on 2025-03-31 still covers that day, and one starting on it already does. After the filter, group by plan and count distinct members, since a member who renewed early can have two rows of one plan covering the same day. The alternative turns the open end into a far-future date with `COALESCE` so that a single `BETWEEN` does the test, then de-duplicates the (plan, member) pairs in a derived table before counting. Either is one scan.",
    ].join("\n"),
  },

  {
    slug: "linkedin-skills-endorsed-by-three-or-more-people",
    title: "LinkedIn: Skills Endorsed by Three or More Different People",
    difficulty: "EASY",
    topics: ["Aggregation"],
    description: [
      "The skills-graph team wants the skills that a broad set of members vouch for, not ones propped up by one enthusiastic endorser.",
      "",
      "For each skill, count the **different endorsers** who endorsed it for someone other than themselves — a **self-endorsement** (`endorser_id = member_id`) does not count, and one person endorsing the same skill for several members counts once. Return `skill` and `endorsers` for the skills with **at least 3** endorsers, ordered by `endorsers` descending, then `skill` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Endorsement",
        columns: [
          { name: "endorsement_id", type: "int" },
          { name: "endorser_id", type: "int" },
          { name: "member_id", type: "int" },
          { name: "skill", type: "varchar" },
          { name: "endorsed_on", type: "date" },
        ],
        primaryKey: ["endorsement_id"],
        note: "One row per endorsement: `endorser_id` vouched for `member_id`'s `skill`. Skill names are always spelt the same way.",
      },
    ],
    examples: [
      {
        Endorsement: [
          [1, 1, 2, "SQL", "2025-02-01"],
          [2, 3, 2, "SQL", "2025-02-02"],
          [3, 3, 4, "SQL", "2025-02-03"],
          [4, 4, 4, "SQL", "2025-02-03"],
          [5, 5, 1, "SQL", "2025-02-05"],
          [6, 1, 5, "Python", "2025-02-06"],
          [7, 2, 5, "Python", "2025-02-07"],
          [8, 4, 3, "Python", "2025-02-08"],
          [9, 2, 1, "Figma", "2025-02-09"],
          [10, 2, 3, "Figma", "2025-02-10"],
        ],
      },
    ],
    gen: (rng) => {
      const skills = sample(rng, SKILLS, ri(rng, 2, 5));
      const n = ri(rng, 6, 24);
      const seen = new Set<string>();
      const rows: Cell[][] = [];
      for (let i = 0; i < n; i++) {
        const endorser = ri(rng, 1, 8);
        const member = chance(rng, 0.12) ? endorser : ri(rng, 1, 8);
        const skill = pick(rng, skills);
        const k = `${endorser}|${member}|${skill}`;
        if (seen.has(k)) continue;
        seen.add(k);
        rows.push([rows.length + 1, endorser, member, skill, dateBetween(rng, "2025-01-01", "2025-03-31")]);
      }
      return { Endorsement: rows };
    },
    solution: [
      "SELECT skill, COUNT(DISTINCT endorser_id) AS endorsers",
      "FROM Endorsement",
      "WHERE endorser_id <> member_id",
      "GROUP BY skill",
      "HAVING COUNT(DISTINCT endorser_id) >= 3",
      "ORDER BY endorsers DESC, skill",
    ].join("\n"),
    alternatives: [
      "SELECT skill, COUNT(*) AS endorsers FROM (SELECT DISTINCT skill, endorser_id FROM Endorsement WHERE endorser_id <> member_id) p GROUP BY skill HAVING COUNT(*) > 2 ORDER BY endorsers DESC, skill",
    ],
    ordered: true,
    hints: [
      "Remove the self-endorsements before counting anything.",
      "\"Different endorsers\" is `COUNT(DISTINCT endorser_id)`, not `COUNT(*)`.",
      "A condition on a count belongs in HAVING, after GROUP BY.",
    ],
    editorial: [
      "Three rules shape the count. Self-endorsements are dropped first with `WHERE endorser_id <> member_id`, so they never reach a group. Then each skill forms a group, and inside it the number of different people is `COUNT(DISTINCT endorser_id)` — an endorser who backed SQL for two colleagues is still one person. Finally `HAVING` keeps the groups with at least three; a `WHERE` cannot see a count because it runs before grouping.",
      "",
      "In the example, member 4 endorsing their own SQL is ignored and member 3's two SQL endorsements count once, so SQL has endorsers 1, 3 and 5 and makes the cut with exactly three. The alternative makes the de-duplication explicit: a derived table of distinct (skill, endorser) pairs, then a plain `COUNT(*)` per skill. Ties on the count are ordered by skill name so the result is fixed. The work is one scan plus a grouping of the remaining rows.",
    ].join("\n"),
  },

  {
    slug: "linkedin-company-pages-with-no-new-followers-in-may",
    title: "LinkedIn: Company Pages With No New Followers in May 2025",
    difficulty: "EASY",
    topics: ["Joins", "Subqueries"],
    description: [
      "The Pages team reaches out to company admins whose page stopped growing, starting with the pages that gained nobody in May.",
      "",
      "Return `page_id` and `company_name` of every company page that has **no follow dated in May 2025** (2025-05-01 to 2025-05-31 inclusive). A page with follows only in other months, or with no follows at all, is in the answer. Order the rows by `page_id`.",
    ].join("\n"),
    tables: [
      {
        name: "CompanyPage",
        columns: [
          { name: "page_id", type: "int" },
          { name: "company_name", type: "varchar" },
          { name: "industry", type: "varchar" },
        ],
        primaryKey: ["page_id"],
        note: "One row per company page.",
      },
      {
        name: "PageFollow",
        columns: [
          { name: "member_id", type: "int" },
          { name: "page_id", type: "int" },
          { name: "followed_on", type: "date" },
        ],
        primaryKey: ["member_id", "page_id"],
        note: "A member following a page; `page_id` always names a page.",
      },
    ],
    examples: [
      {
        CompanyPage: [
          [1, "Northwind Labs", "Software"],
          [2, "Saffron Fintech", "Banking"],
          [3, "Lotus Health", "Healthcare"],
          [4, "Indigo Learning", "Education"],
          [5, "Cedar Robotics", "Manufacturing"],
        ],
        PageFollow: [
          [10, 1, "2025-05-01"],
          [11, 1, "2025-04-12"],
          [10, 2, "2025-04-30"],
          [12, 2, "2025-06-01"],
          [13, 3, "2025-05-31"],
          [14, 5, "2025-03-15"],
        ],
      },
    ],
    gen: (rng) => {
      const k = ri(rng, 1, 7);
      const pages: Cell[][] = sample(rng, COMPANIES, k).map((c, i) => [i + 1, c, pick(rng, INDUSTRIES)]);
      const n = chance(rng, 0.1) ? 0 : ri(rng, 1, 14);
      const seen = new Set<string>();
      const follows: Cell[][] = [];
      for (let i = 0; i < n; i++) {
        const m = ri(rng, 1, 15);
        const p = ri(rng, 1, k);
        if (seen.has(`${m}|${p}`)) continue;
        seen.add(`${m}|${p}`);
        follows.push([m, p, chance(rng, 0.3) ? pick(rng, ["2025-04-30", "2025-05-01", "2025-05-31", "2025-06-01"]) : dateBetween(rng, "2025-03-01", "2025-07-15")]);
      }
      return { CompanyPage: pages, PageFollow: follows };
    },
    solution: [
      "SELECT p.page_id, p.company_name",
      "FROM CompanyPage p",
      "WHERE NOT EXISTS (",
      "  SELECT 1 FROM PageFollow f",
      "  WHERE f.page_id = p.page_id",
      "    AND f.followed_on BETWEEN '2025-05-01' AND '2025-05-31'",
      ")",
      "ORDER BY p.page_id",
    ].join("\n"),
    alternatives: [
      "SELECT p.page_id, p.company_name FROM CompanyPage p LEFT JOIN PageFollow f ON f.page_id = p.page_id AND f.followed_on >= '2025-05-01' AND f.followed_on < '2025-06-01' WHERE f.page_id IS NULL ORDER BY p.page_id",
      "SELECT page_id, company_name FROM CompanyPage WHERE page_id NOT IN (SELECT page_id FROM PageFollow WHERE YEAR(followed_on) = 2025 AND MONTH(followed_on) = 5) ORDER BY page_id",
    ],
    ordered: true,
    hints: [
      "You want the pages for which a certain row does *not* exist — an anti join.",
      "The month condition belongs to the follow you are looking for, not to the page.",
      "With a LEFT JOIN, put the date condition in `ON`; in `WHERE` it would throw away the pages with no match.",
    ],
    editorial: [
      "This is an **anti join**: keep each page for which no May follow exists. `NOT EXISTS` says exactly that — the subquery looks for a follow of this page dated in May, and the page survives only if none is found. Pages with follows only in April or June, and pages nobody follows, both pass, which is what the team wants.",
      "",
      "The LEFT JOIN version needs care: the May condition must sit in the `ON` clause, so that a page whose follows are all outside May still produces one row with NULLs, which `WHERE f.page_id IS NULL` then keeps. Putting the date test in `WHERE` would turn it back into an inner join and lose those pages. The `NOT IN` version is safe here because `PageFollow.page_id` is never NULL — with a nullable column, a single NULL in the list would make `NOT IN` return nothing.",
      "",
      "Both boundaries count: a follow on 2025-05-01 or 2025-05-31 is a May follow. With an index on `(page_id, followed_on)` each probe is a short range lookup.",
    ].join("\n"),
  },

  {
    slug: "linkedin-recruiter-inmail-response-rate",
    title: "LinkedIn: InMail Response Rate per Recruiter",
    difficulty: "EASY",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "Talent Solutions coaches recruiters on outreach, and the first number they look at is how often a candidate answers an InMail.",
      "",
      "For every recruiter who sent at least one InMail, return `recruiter_id`, `inmails_sent`, `replies` (InMails with a non-NULL `replied_at`) and `response_rate`, the percentage of InMails that got a reply, **rounded to one decimal place**. Order the rows by `response_rate` descending, then `recruiter_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "InMail",
        columns: [
          { name: "inmail_id", type: "int" },
          { name: "recruiter_id", type: "int" },
          { name: "candidate_id", type: "int" },
          { name: "sent_at", type: "datetime" },
          { name: "replied_at", type: "datetime" },
        ],
        primaryKey: ["inmail_id"],
        note: "One row per InMail. `replied_at` is when the candidate first replied, or NULL if they never did.",
      },
    ],
    examples: [
      {
        InMail: [
          [1, 101, 501, "2025-04-01 09:15:00", "2025-04-01 18:40:00"],
          [2, 101, 502, "2025-04-02 10:00:00", null],
          [3, 101, 503, "2025-04-02 11:30:00", "2025-04-05 08:10:00"],
          [4, 102, 504, "2025-04-03 14:00:00", null],
          [5, 102, 505, "2025-04-04 16:20:00", null],
          [6, 103, 506, "2025-04-04 09:00:00", "2025-04-04 09:45:00"],
          [7, 104, 507, "2025-04-05 12:00:00", "2025-04-06 10:00:00"],
          [8, 104, 508, "2025-04-06 12:00:00", null],
          [9, 104, 509, "2025-04-07 12:00:00", "2025-04-07 13:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const recruiters = sample(rng, [101, 102, 103, 104, 105], ri(rng, 1, 4));
      const n = ri(rng, 1, 15);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const d = dateBetween(rng, "2025-04-01", "2025-04-30");
        return [id, pick(rng, recruiters), ri(rng, 500, 599), atTime(rng, d), chance(rng, 0.45) ? atTime(rng, addDays(d, ri(rng, 1, 6))) : null];
      });
      return { InMail: rows };
    },
    solution: [
      "SELECT recruiter_id,",
      "       COUNT(*) AS inmails_sent,",
      "       COUNT(replied_at) AS replies,",
      "       ROUND(100 * COUNT(replied_at) / COUNT(*), 1) AS response_rate",
      "FROM InMail",
      "GROUP BY recruiter_id",
      "ORDER BY response_rate DESC, recruiter_id",
    ].join("\n"),
    alternatives: [
      "SELECT recruiter_id, COUNT(*) AS inmails_sent, SUM(CASE WHEN replied_at IS NOT NULL THEN 1 ELSE 0 END) AS replies, ROUND(100 * SUM(IF(replied_at IS NULL, 0, 1)) / COUNT(inmail_id), 1) AS response_rate FROM InMail GROUP BY recruiter_id ORDER BY response_rate DESC, recruiter_id",
    ],
    ordered: true,
    hints: [
      "`COUNT(column)` skips NULLs, while `COUNT(*)` counts every row.",
      "The rate is replies divided by InMails sent, times 100.",
      "Round at the end, and break ties in the rate by the recruiter id.",
    ],
    editorial: [
      "Group the InMails by recruiter and compute two counts per group. `COUNT(*)` is every InMail sent; `COUNT(replied_at)` counts only the rows where `replied_at` is not NULL, which is exactly the replies — the NULL-skipping behaviour of `COUNT(column)` does the conditional counting for free. The alternative spells the same thing out with `SUM(CASE …)` and `SUM(IF(…))`, which is the general pattern when the condition is more than \"not NULL\".",
      "",
      "The rate is `100 * replies / sent`. In MySQL `/` is decimal division, so 2 out of 3 gives 66.67 before rounding and 66.7 after; integer division would have given 0. Rounding comes last so no precision is lost along the way. Recruiters with the same rate are ordered by id so the output is fixed. The query is a single grouped scan.",
    ].join("\n"),
  },

  {
    slug: "linkedin-learning-completions-per-category-in-q1",
    title: "LinkedIn: Learning Course Completions per Category in Q1 2025",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation", "Dates"],
    description: [
      "The LinkedIn Learning content team reviews which course categories learners actually finished in the first quarter.",
      "",
      "For **every category** that appears in `Course`, return `category` and `completions`, the number of enrollments in that category's courses with `completed_on` between **2025-01-01 and 2025-03-31 inclusive**. A category with no completion in that window shows `0`. Order the rows by `completions` descending, then `category` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Course",
        columns: [
          { name: "course_id", type: "int" },
          { name: "title", type: "varchar" },
          { name: "category", type: "varchar" },
        ],
        primaryKey: ["course_id"],
        note: "One row per course; several courses share a category.",
      },
      {
        name: "CourseEnrollment",
        columns: [
          { name: "enrollment_id", type: "int" },
          { name: "member_id", type: "int" },
          { name: "course_id", type: "int" },
          { name: "enrolled_on", type: "date" },
          { name: "completed_on", type: "date" },
        ],
        primaryKey: ["enrollment_id"],
        note: "`completed_on` is NULL until the learner finishes the course.",
      },
    ],
    examples: [
      {
        Course: [
          [1, "SQL Essential Training", "Data Science"],
          [2, "Python for Data Analysis", "Data Science"],
          [3, "Leading Without Authority", "Leadership"],
          [4, "Agile Foundations", "Project Management"],
          [5, "Content Marketing Basics", "Marketing"],
        ],
        CourseEnrollment: [
          [1, 21, 1, "2024-12-20", "2025-01-01"],
          [2, 22, 2, "2025-02-01", "2025-03-31"],
          [3, 23, 1, "2025-03-10", "2025-04-01"],
          [4, 24, 3, "2025-01-05", "2025-02-14"],
          [5, 25, 3, "2025-01-20", null],
          [6, 26, 4, "2024-11-02", "2024-12-31"],
          [7, 27, 5, "2025-02-11", "2025-03-02"],
        ],
      },
    ],
    gen: (rng) => {
      const k = ri(rng, 1, 7);
      const courses: Cell[][] = seq(1, k).map((id) => [id, `Course ${id}`, pick(rng, COURSE_CATEGORIES)]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 18);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const enrolled = dateBetween(rng, "2024-11-01", "2025-03-25");
        let done: string | null = chance(rng, 0.3) ? null : addDays(enrolled, ri(rng, 1, 60));
        if (done !== null && chance(rng, 0.25)) {
          const edge = pick(rng, ["2024-12-31", "2025-01-01", "2025-03-31", "2025-04-01"]);
          if (edge >= enrolled) done = edge;
        }
        return [id, ri(rng, 20, 60), ri(rng, 1, k), enrolled, done];
      });
      return { Course: courses, CourseEnrollment: rows };
    },
    solution: [
      "SELECT c.category, COUNT(e.enrollment_id) AS completions",
      "FROM Course c",
      "LEFT JOIN CourseEnrollment e",
      "  ON e.course_id = c.course_id",
      " AND e.completed_on BETWEEN '2025-01-01' AND '2025-03-31'",
      "GROUP BY c.category",
      "ORDER BY completions DESC, c.category",
    ].join("\n"),
    alternatives: [
      [
        "SELECT c.category,",
        "       SUM(CASE WHEN e.completed_on >= '2025-01-01' AND e.completed_on < '2025-04-01' THEN 1 ELSE 0 END) AS completions",
        "FROM Course c LEFT JOIN CourseEnrollment e ON e.course_id = c.course_id",
        "GROUP BY c.category",
        "ORDER BY completions DESC, c.category",
      ].join("\n"),
      [
        "SELECT cat.category,",
        "       (SELECT COUNT(*) FROM CourseEnrollment e JOIN Course c ON c.course_id = e.course_id",
        "        WHERE c.category = cat.category AND QUARTER(e.completed_on) = 1 AND YEAR(e.completed_on) = 2025) AS completions",
        "FROM (SELECT DISTINCT category FROM Course) cat",
        "ORDER BY completions DESC, cat.category",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Categories with no completions must still appear — start from `Course` and LEFT JOIN.",
      "If the date filter goes in WHERE, the categories without a match disappear again.",
      "`COUNT(e.enrollment_id)` counts 0 for a category whose join found nothing.",
    ],
    editorial: [
      "Every category must be listed, even the ones with no completions, so the query starts from `Course` and LEFT JOINs the enrollments. The quarter condition goes into the `ON` clause: it decides which enrollments attach to a course, while a course with none still keeps one row with NULLs. `COUNT(e.enrollment_id)` then counts only the attached enrollments, giving 0 for such a category. Putting the date test in `WHERE` instead would discard the NULL rows and lose exactly the categories the question insists on.",
      "",
      "NULL `completed_on` values fail `BETWEEN`, so unfinished enrollments never count, and both 2025-01-01 and 2025-03-31 are inside the window. The first alternative keeps every enrollment in the join and counts conditionally with `SUM(CASE …)`; the second computes each category's count in a correlated subquery over the distinct categories, testing the quarter with `QUARTER()` and `YEAR()`. Grouping by category merges all of its courses.",
    ].join("\n"),
  },

  {
    slug: "linkedin-easy-apply-share-per-job",
    title: "LinkedIn: Easy Apply Share of Applications per Job",
    difficulty: "EASY",
    topics: ["Joins", "Aggregation", "Conditional Logic"],
    description: [
      "Product managers on Jobs compare how many candidates use **Easy Apply** instead of the employer's own site.",
      "",
      "For **every job posting**, return `job_id`, `applications` (its number of applications) and `easy_apply_pct`, the percentage of those applications made with `easy_apply`, **rounded to one decimal place**. A job with no applications shows `applications` = 0 and `easy_apply_pct` = NULL. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "JobPosting",
        columns: [
          { name: "job_id", type: "int" },
          { name: "company_name", type: "varchar" },
          { name: "title", type: "varchar" },
        ],
        primaryKey: ["job_id"],
        note: "One row per job posting.",
      },
      {
        name: "JobApplication",
        columns: [
          { name: "application_id", type: "int" },
          { name: "job_id", type: "int" },
          { name: "member_id", type: "int" },
          { name: "method", type: "enum", values: ["easy_apply", "company_site"] },
        ],
        primaryKey: ["application_id"],
        note: "One row per application; `job_id` always names a posting.",
      },
    ],
    examples: [
      {
        JobPosting: [
          [1, "Kestrel Analytics", "Data Analyst"],
          [2, "Bluepeak Systems", "Software Engineer"],
          [3, "Orbit Retail", "Product Manager"],
          [4, "Tidewater Media", "UX Designer"],
        ],
        JobApplication: [
          [1, 1, 31, "easy_apply"],
          [2, 1, 32, "easy_apply"],
          [3, 1, 33, "company_site"],
          [4, 2, 31, "company_site"],
          [5, 2, 34, "company_site"],
          [6, 3, 35, "easy_apply"],
        ],
      },
    ],
    gen: (rng) => {
      const k = ri(rng, 1, 6);
      const jobs: Cell[][] = seq(1, k).map((id) => [id, pick(rng, COMPANIES), pick(rng, JOB_TITLES)]);
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 15);
      const apps: Cell[][] = seq(1, n).map((id) => [id, ri(rng, 1, k), ri(rng, 30, 70), chance(rng, 0.6) ? "easy_apply" : "company_site"]);
      return { JobPosting: jobs, JobApplication: apps };
    },
    solution: [
      "SELECT j.job_id,",
      "       COUNT(a.application_id) AS applications,",
      "       ROUND(100 * SUM(CASE WHEN a.method = 'easy_apply' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.application_id), 0), 1) AS easy_apply_pct",
      "FROM JobPosting j",
      "LEFT JOIN JobApplication a ON a.job_id = j.job_id",
      "GROUP BY j.job_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT j.job_id, COALESCE(t.applications, 0) AS applications, t.easy_apply_pct",
        "FROM JobPosting j",
        "LEFT JOIN (SELECT job_id, COUNT(*) AS applications, ROUND(100 * AVG(method = 'easy_apply'), 1) AS easy_apply_pct",
        "           FROM JobApplication GROUP BY job_id) t ON t.job_id = j.job_id",
      ].join("\n"),
    ],
    hints: [
      "Jobs without applications must appear, so the join from `JobPosting` is a LEFT JOIN.",
      "Count `a.application_id`, not `*`, or an empty job would count 1.",
      "Dividing by zero should give NULL — `NULLIF(count, 0)` makes that explicit.",
    ],
    editorial: [
      "Start from `JobPosting` and LEFT JOIN the applications so that every job forms a group. For a job nobody applied to, the join produces one row of NULLs: `COUNT(a.application_id)` counts it as 0 (while `COUNT(*)` would wrongly say 1), and the share is undefined — `NULLIF(…, 0)` turns the zero denominator into NULL, and any arithmetic with NULL is NULL. MySQL would also return NULL for a division by zero, but writing it out makes the intent clear and does not depend on the SQL mode.",
      "",
      "The share itself is a conditional count over the total, times 100, rounded last. The alternative aggregates the applications first in a derived table — `AVG(method = 'easy_apply')` is the fraction of rows where the comparison is 1 — and attaches it to the postings with a LEFT JOIN, where a job without a match gets NULL for the share and `COALESCE` turns its count into 0. Both read each table once.",
    ].join("\n"),
  },

  // ──────────────────────────── MEDIUM ────────────────────────────
  {
    slug: "linkedin-connection-count-of-every-member",
    title: "LinkedIn: Connection Count of Every Member",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Subqueries"],
    description: [
      "The network-health dashboard shows each member's number of first-degree connections. A connection is stored **once per pair**, with the smaller member id in `member_a`.",
      "",
      "Return `member_id`, `full_name` and `connections` for **every member**, where `connections` counts the pairs the member appears in on either side; members with no connections show `0`. Order the rows by `connections` descending, then `member_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "Member",
        columns: [
          { name: "member_id", type: "int" },
          { name: "full_name", type: "varchar" },
        ],
        primaryKey: ["member_id"],
        note: "One row per member.",
      },
      {
        name: "MemberConnection",
        columns: [
          { name: "member_a", type: "int" },
          { name: "member_b", type: "int" },
          { name: "connected_on", type: "date" },
        ],
        primaryKey: ["member_a", "member_b"],
        note: "One row per connected pair, always with `member_a < member_b`; both are member ids.",
      },
    ],
    examples: [
      {
        Member: [
          [1, "Ananya Menon"],
          [2, "Farhan Khan"],
          [3, "Ira Bose"],
          [4, "Karan Mehta"],
          [5, "Pooja Reddy"],
        ],
        MemberConnection: [
          [1, 2, "2024-08-01"],
          [1, 3, "2024-09-12"],
          [2, 3, "2024-10-05"],
          [3, 4, "2025-01-20"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 9);
      const members: Cell[][] = seq(1, n).map((id) => [id, fullName(rng)]);
      const edges: Cell[][] = randomEdges(rng, n, rng() * 0.6).map(([a, b]) => [a, b, dateBetween(rng, "2023-01-01", "2025-06-30")]);
      return { Member: members, MemberConnection: edges };
    },
    solution: [
      "WITH ends AS (",
      "  SELECT member_a AS member_id FROM MemberConnection",
      "  UNION ALL",
      "  SELECT member_b FROM MemberConnection",
      ")",
      "SELECT m.member_id, m.full_name, COUNT(e.member_id) AS connections",
      "FROM Member m",
      "LEFT JOIN ends e ON e.member_id = m.member_id",
      "GROUP BY m.member_id, m.full_name",
      "ORDER BY connections DESC, m.member_id",
    ].join("\n"),
    alternatives: [
      "SELECT m.member_id, m.full_name, (SELECT COUNT(*) FROM MemberConnection c WHERE c.member_a = m.member_id OR c.member_b = m.member_id) AS connections FROM Member m ORDER BY connections DESC, m.member_id",
      "SELECT m.member_id, m.full_name, COUNT(c.member_a) AS connections FROM Member m LEFT JOIN MemberConnection c ON m.member_id IN (c.member_a, c.member_b) GROUP BY m.member_id, m.full_name ORDER BY connections DESC, m.member_id",
    ],
    ordered: true,
    hints: [
      "A member can be in either column of a pair — count both.",
      "Stack the two columns into one list with UNION ALL (not UNION, which would merge duplicates).",
      "LEFT JOIN from `Member` keeps the members with no connections at 0.",
    ],
    editorial: [
      "Storing each connection once keeps the table half the size, but it means a member's connections are split across two columns: the pairs where they are `member_a` and the pairs where they are `member_b`. The CTE stacks both columns into one list of endpoints with `UNION ALL` — every pair contributes one row for each of its members. `UNION` would be wrong here: it removes duplicate values, so a member with three connections would appear once.",
      "",
      "From there it is a LEFT JOIN from `Member` and a count of the matched endpoints, so members who appear nowhere still get a row with 0. The first alternative counts the pairs per member with a correlated subquery and an `OR`; the second joins on `m.member_id IN (c.member_a, c.member_b)`, which matches each pair once per member it involves. The UNION ALL version is usually fastest with an index on each column, since the `OR` conditions are harder to index. Ties on the count are broken by member id.",
    ].join("\n"),
  },

  {
    slug: "linkedin-invitation-acceptance-with-and-without-a-note",
    title: "LinkedIn: Invitation Acceptance With and Without a Note",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Conditional Logic"],
    description: [
      "Before changing the invite dialog, the growth team checks whether adding a personal note makes an invitation more likely to be accepted.",
      "",
      "Only **decided** invitations count — status `accepted` or `ignored`; pending and withdrawn ones are left out entirely. Group them into `'with note'` (`has_note = 1`) and `'without note'` (`has_note = 0`) and return `invitation_type`, `decided`, `accepted` and `acceptance_pct` (accepted ÷ decided × 100, **rounded to one decimal place**). A group with no decided invitations does not appear. Return the rows in any order.",
    ].join("\n"),
    tables: [
      {
        name: "Invitation",
        columns: [
          { name: "invitation_id", type: "int" },
          { name: "sender_id", type: "int" },
          { name: "recipient_id", type: "int" },
          { name: "sent_on", type: "date" },
          { name: "has_note", type: "bool" },
          { name: "status", type: "enum", values: ["pending", "accepted", "ignored", "withdrawn"] },
        ],
        primaryKey: ["invitation_id"],
        note: "One row per connection invitation; `has_note` is 1 when the sender added a personal message.",
      },
    ],
    examples: [
      {
        Invitation: [
          [1, 11, 21, "2025-05-01", 1, "accepted"],
          [2, 11, 22, "2025-05-01", 1, "accepted"],
          [3, 12, 23, "2025-05-02", 1, "ignored"],
          [4, 12, 24, "2025-05-03", 1, "pending"],
          [5, 13, 25, "2025-05-03", 0, "accepted"],
          [6, 13, 26, "2025-05-04", 0, "ignored"],
          [7, 14, 27, "2025-05-05", 0, "ignored"],
          [8, 14, 28, "2025-05-05", 0, "withdrawn"],
          [9, 15, 29, "2025-05-06", 0, "ignored"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 2, 15);
      const allNote = chance(rng, 0.1) ? pick(rng, [0, 1]) : null;
      const rows: Cell[][] = seq(1, n).map((id) => [
        id,
        ri(rng, 1, 20),
        ri(rng, 21, 60),
        dateBetween(rng, "2025-05-01", "2025-05-31"),
        allNote ?? (chance(rng, 0.45) ? 1 : 0),
        pick(rng, ["accepted", "accepted", "ignored", "ignored", "pending", "withdrawn"]),
      ]);
      return { Invitation: rows };
    },
    solution: [
      "SELECT CASE WHEN has_note = 1 THEN 'with note' ELSE 'without note' END AS invitation_type,",
      "       COUNT(*) AS decided,",
      "       SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted,",
      "       ROUND(100 * SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) / COUNT(*), 1) AS acceptance_pct",
      "FROM Invitation",
      "WHERE status IN ('accepted', 'ignored')",
      "GROUP BY invitation_type",
    ].join("\n"),
    alternatives: [
      [
        "SELECT 'with note' AS invitation_type, COUNT(*) AS decided, SUM(status = 'accepted') AS accepted, ROUND(100 * SUM(status = 'accepted') / COUNT(*), 1) AS acceptance_pct",
        "FROM Invitation WHERE has_note = 1 AND status IN ('accepted', 'ignored') HAVING COUNT(*) > 0",
        "UNION ALL",
        "SELECT 'without note', COUNT(*), SUM(status = 'accepted'), ROUND(100 * SUM(status = 'accepted') / COUNT(*), 1)",
        "FROM Invitation WHERE has_note = 0 AND status IN ('accepted', 'ignored') HAVING COUNT(*) > 0",
      ].join("\n"),
      [
        "SELECT IF(has_note = 1, 'with note', 'without note') AS invitation_type, COUNT(*) AS decided, COUNT(CASE WHEN status = 'accepted' THEN 1 END) AS accepted,",
        "       ROUND(AVG(CASE WHEN status = 'accepted' THEN 100 ELSE 0 END), 1) AS acceptance_pct",
        "FROM Invitation WHERE status <> 'pending' AND status <> 'withdrawn' GROUP BY IF(has_note = 1, 'with note', 'without note')",
      ].join("\n"),
    ],
    hints: [
      "Filter to the decided invitations before grouping — a pending invitation is neither a yes nor a no.",
      "Build the label with CASE and group by it.",
      "Count acceptances with a conditional SUM, then divide by the group's size.",
    ],
    editorial: [
      "The denominator is the heart of this question. A pending invitation has not been answered, and a withdrawn one never reached a decision, so counting them would drag both rates down for reasons that have nothing to do with the note. The `WHERE status IN ('accepted', 'ignored')` filter runs first, leaving only answered invitations.",
      "",
      "The label is a `CASE` on `has_note`, and grouping by that alias forms the two groups. In each, `COUNT(*)` is the decided total and a conditional `SUM` counts the acceptances; the percentage is their ratio times 100, rounded last. A group that has no decided invitation simply has no rows after the filter, so it never forms — exactly the statement's rule.",
      "",
      "The first alternative computes each group with its own aggregate and glues them with `UNION ALL`; an aggregate without GROUP BY always returns a row, so `HAVING COUNT(*) > 0` is what drops an empty group. The second averages 100-or-0 per invitation, which is the same percentage. All of them read the table once per branch.",
    ].join("\n"),
  },

  {
    slug: "linkedin-profile-views-doubled-from-april-to-may",
    title: "LinkedIn: Members Whose Profile Views Doubled in May",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Conditional Logic", "Dates"],
    description: [
      "The \"Who viewed your profile\" team wants to celebrate members whose profile is suddenly getting noticed.",
      "",
      "For each viewed member, count the views their profile received in **April 2025** and in **May 2025**. Return `member_id` (the viewed member), `april_views` and `may_views` for members with **at least one April view** whose May views are **at least double** their April views. Order the rows by `member_id`.",
    ].join("\n"),
    tables: [
      {
        name: "ProfileView",
        columns: [
          { name: "view_id", type: "int" },
          { name: "viewer_id", type: "int" },
          { name: "viewed_id", type: "int" },
          { name: "viewed_at", type: "datetime" },
        ],
        primaryKey: ["view_id"],
        note: "One row per profile view: `viewer_id` looked at `viewed_id`'s profile. Every view counts, including repeat views by one viewer.",
      },
    ],
    examples: [
      {
        ProfileView: [
          [1, 20, 1, "2025-04-03 10:00:00"],
          [2, 21, 1, "2025-05-07 12:30:00"],
          [3, 22, 1, "2025-05-31 23:59:00"],
          [4, 23, 2, "2025-04-10 09:00:00"],
          [5, 24, 2, "2025-04-30 23:30:00"],
          [6, 25, 2, "2025-05-01 00:10:00"],
          [7, 26, 3, "2025-05-12 08:00:00"],
          [8, 27, 3, "2025-05-13 08:00:00"],
          [9, 28, 4, "2025-03-31 22:00:00"],
          [10, 28, 4, "2025-04-15 11:00:00"],
          [11, 29, 4, "2025-05-15 11:00:00"],
          [12, 29, 4, "2025-05-16 11:00:00"],
          [13, 29, 4, "2025-06-01 00:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const members = ri(rng, 1, 6);
      for (let m = 1; m <= members; m++) {
        const april = ri(rng, 0, 3);
        const may = chance(rng, 0.3) ? april * 2 : ri(rng, 0, 6);
        const noise = ri(rng, 0, 2);
        for (let i = 0; i < april; i++) rows.push([0, ri(rng, 10, 40), m, atTime(rng, dateBetween(rng, "2025-04-01", "2025-04-30"))]);
        for (let i = 0; i < may; i++) rows.push([0, ri(rng, 10, 40), m, atTime(rng, dateBetween(rng, "2025-05-01", "2025-05-31"))]);
        for (let i = 0; i < noise; i++) rows.push([0, ri(rng, 10, 40), m, atTime(rng, pick(rng, ["2025-03-31", "2025-06-01", "2025-06-15"]))]);
      }
      shuffle(rng, rows).forEach((r, i) => (r[0] = i + 1));
      return { ProfileView: rows };
    },
    solution: [
      "SELECT viewed_id AS member_id,",
      "       SUM(CASE WHEN viewed_at >= '2025-04-01' AND viewed_at < '2025-05-01' THEN 1 ELSE 0 END) AS april_views,",
      "       SUM(CASE WHEN viewed_at >= '2025-05-01' AND viewed_at < '2025-06-01' THEN 1 ELSE 0 END) AS may_views",
      "FROM ProfileView",
      "GROUP BY viewed_id",
      "HAVING april_views >= 1 AND may_views >= 2 * april_views",
      "ORDER BY member_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.viewed_id AS member_id, a.views AS april_views, COALESCE(m.views, 0) AS may_views",
        "FROM (SELECT viewed_id, COUNT(*) AS views FROM ProfileView WHERE DATE_FORMAT(viewed_at, '%Y-%m') = '2025-04' GROUP BY viewed_id) a",
        "LEFT JOIN (SELECT viewed_id, COUNT(*) AS views FROM ProfileView WHERE DATE_FORMAT(viewed_at, '%Y-%m') = '2025-05' GROUP BY viewed_id) m",
        "  ON m.viewed_id = a.viewed_id",
        "WHERE COALESCE(m.views, 0) >= 2 * a.views",
        "ORDER BY member_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "One pass can count both months: a conditional SUM per month.",
      "`viewed_at` has a time — a range `>= '2025-05-01' AND < '2025-06-01'` keeps the evening of the 31st.",
      "The \"at least one April view\" rule also avoids calling 0 → 0 a doubling.",
    ],
    editorial: [
      "Both counts come from one grouped scan with **conditional aggregation**: each view adds 1 to the April column if it falls in April and to the May column if it falls in May, and views in other months add to neither. Because `viewed_at` is a datetime, the month is tested as a half-open range — `>= '2025-05-01' AND < '2025-06-01'` — which keeps a view at 23:59 on the 31st that a `BETWEEN '2025-05-01' AND '2025-05-31'` would lose (that upper bound is midnight at the start of the 31st).",
      "",
      "The comparison runs in `HAVING`, on the grouped values. Requiring at least one April view matters: without it, a member with no views in either month would satisfy 0 ≥ 2 × 0, and a member who was first noticed in May has no April baseline to double. \"At least double\" is inclusive, so 2 → 4 qualifies.",
      "",
      "The alternative builds a per-month count in two derived tables, using `DATE_FORMAT(viewed_at, '%Y-%m')` to pick the month, and LEFT JOINs May onto April so a member with no May views gets 0 rather than disappearing; starting from April enforces the baseline rule. It reads the table twice, the conditional version once.",
    ].join("\n"),
  },

  {
    slug: "linkedin-most-common-reaction-on-each-post",
    title: "LinkedIn: Most Common Reaction on Each Post",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Window Functions", "Joins"],
    description: [
      "The feed team studies which reaction each post draws most — celebrate, insightful, support and so on — to tune what the reaction picker shows first.",
      "",
      "For every post with at least one reaction, return `post_id`, `author_id`, `top_reaction` (the `reaction_type` used most often on that post) and `top_count` (how many times it was used). When two types tie, the one that comes **first alphabetically** wins. Posts without reactions are not listed. Order the rows by `post_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Post",
        columns: [
          { name: "post_id", type: "int" },
          { name: "author_id", type: "int" },
          { name: "posted_on", type: "date" },
        ],
        primaryKey: ["post_id"],
        note: "One row per feed post.",
      },
      {
        name: "Reaction",
        columns: [
          { name: "post_id", type: "int" },
          { name: "member_id", type: "int" },
          { name: "reaction_type", type: "varchar" },
          { name: "reacted_at", type: "datetime" },
        ],
        primaryKey: ["post_id", "member_id"],
        note: "A member's one reaction on a post. `reaction_type` is one of celebrate, funny, insightful, like, love, support (always lower case).",
      },
    ],
    examples: [
      {
        Post: [
          [1, 7, "2025-03-01"],
          [2, 7, "2025-03-03"],
          [3, 8, "2025-03-04"],
          [4, 9, "2025-03-05"],
        ],
        Reaction: [
          [1, 21, "like", "2025-03-01 10:00:00"],
          [1, 22, "celebrate", "2025-03-01 10:05:00"],
          [1, 23, "like", "2025-03-01 11:00:00"],
          [1, 24, "insightful", "2025-03-01 12:00:00"],
          [2, 21, "support", "2025-03-03 09:00:00"],
          [2, 25, "insightful", "2025-03-03 09:30:00"],
          [3, 26, "love", "2025-03-04 18:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const k = ri(rng, 1, 6);
      const posts: Cell[][] = seq(1, k).map((id) => [id, ri(rng, 1, 4), dateBetween(rng, "2025-03-01", "2025-03-20")]);
      const reactions: Cell[][] = [];
      for (let p = 1; p <= k; p++) {
        const types = sample(rng, REACTIONS, ri(rng, 1, 3));
        for (const m of sample(rng, seq(20, 20), ri(rng, 0, 6))) {
          reactions.push([p, m, pick(rng, types), atTime(rng, dateBetween(rng, "2025-03-20", "2025-03-25"))]);
        }
      }
      return { Post: posts, Reaction: reactions };
    },
    solution: [
      "WITH counts AS (",
      "  SELECT post_id, reaction_type, COUNT(*) AS cnt",
      "  FROM Reaction",
      "  GROUP BY post_id, reaction_type",
      "), ranked AS (",
      "  SELECT post_id, reaction_type, cnt,",
      "         ROW_NUMBER() OVER (PARTITION BY post_id ORDER BY cnt DESC, reaction_type) AS rn",
      "  FROM counts",
      ")",
      "SELECT p.post_id, p.author_id, r.reaction_type AS top_reaction, r.cnt AS top_count",
      "FROM Post p",
      "JOIN ranked r ON r.post_id = p.post_id AND r.rn = 1",
      "ORDER BY p.post_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH counts AS (SELECT post_id, reaction_type, COUNT(*) AS cnt FROM Reaction GROUP BY post_id, reaction_type)",
        "SELECT p.post_id, p.author_id, c.reaction_type AS top_reaction, c.cnt AS top_count",
        "FROM Post p JOIN counts c ON c.post_id = p.post_id",
        "WHERE NOT EXISTS (",
        "  SELECT 1 FROM counts o",
        "  WHERE o.post_id = c.post_id",
        "    AND (o.cnt > c.cnt OR (o.cnt = c.cnt AND o.reaction_type < c.reaction_type))",
        ")",
        "ORDER BY p.post_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First count reactions per (post, type).",
      "Then pick one row per post: the largest count, ties broken by the type's name.",
      "`ROW_NUMBER()` with `ORDER BY cnt DESC, reaction_type` gives exactly one winner per post.",
    ],
    editorial: [
      "The question has two levels. Inside a post, reactions are grouped by type and counted. Across the types of one post, the winner is the largest count. That second step is a classic **top-1 per group**, which `ROW_NUMBER()` solves: number the types of each post by `cnt DESC, reaction_type` and keep number 1. Because the type name is part of the ordering, a tie is resolved alphabetically and exactly one row per post survives — `RANK()` would let both tied types through.",
      "",
      "Joining to `Post` adds the author; posts with no reactions have no counts and drop out of the inner join, as required. The alternative keeps a type when no other type of the same post beats it — more uses, or as many uses and an earlier name — which is the same rule written as a `NOT EXISTS`. The window version sorts each post's few types once; the correlated version compares every pair of types per post, which is fine for the handful of reaction types.",
    ].join("\n"),
  },

  {
    slug: "linkedin-custom-profile-urls-breaking-the-rules",
    title: "LinkedIn: Custom Profile URLs That Break the Rules",
    difficulty: "MEDIUM",
    topics: ["Strings"],
    description: [
      "Members can choose a custom public profile address, and the trust team is cleaning up ones saved before the rules were enforced.",
      "",
      "A valid `vanity_slug` is **5 to 30 characters** long, uses **only letters, digits and hyphens**, does **not start or end with a hyphen**, and never has **two hyphens in a row**. Return `member_id` and `vanity_slug` for every member whose slug breaks at least one rule. Members without a custom address (`vanity_slug` NULL) are not checked. Order the rows by `member_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Member",
        columns: [
          { name: "member_id", type: "int" },
          { name: "full_name", type: "varchar" },
          { name: "vanity_slug", type: "varchar" },
        ],
        primaryKey: ["member_id"],
        note: "`vanity_slug` is the part after /in/ in the member's public address, or NULL if they never set one. Slugs are stored in lower case.",
      },
    ],
    examples: [
      {
        Member: [
          [1, "Priya Sharma", "priya-sharma-42"],
          [2, "Rahul Verma", "rahul_verma"],
          [3, "Neha Gupta", "-nehagupta"],
          [4, "Dev Patel", "dev"],
          [5, "Simran Singh", "simran--singh"],
          [6, "Arjun Rao", null],
          [7, "Kavya Iyer", "kavya.iyer"],
          [8, "Ishaan Das", "ishaan-das-"],
          [9, "Tanvi Joshi", "tanvi9"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 4, 14);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const first = pick(rng, FIRST_NAMES).toLowerCase();
        const last = pick(rng, LAST_NAMES).toLowerCase();
        const kind = ri(rng, 0, 11);
        const slug =
          kind <= 3 ? pick(rng, [`${first}-${last}`, `${first}${last}${ri(rng, 1, 99)}`, `${first}-${last}-${ri(rng, 100, 999)}`, `${first}${ri(rng, 10, 99)}`])
          : kind === 4 ? `${first}_${last}`
          : kind === 5 ? `${first}.${last}`
          : kind === 6 ? `-${first}${last}`
          : kind === 7 ? `${first}${last}-`
          : kind === 8 ? `${first}--${last}`
          : kind === 9 ? pick(rng, ["ab", "abcd", "abcde", `${first}-${last}-${first}-${last}-official-page`.slice(0, 31), "a".repeat(30)])
          : kind === 10 ? `${first} ${last}`
          : null;
        return [id, `${first} ${last}`, slug];
      });
      return { Member: rows };
    },
    solution: [
      "SELECT member_id, vanity_slug",
      "FROM Member",
      "WHERE vanity_slug IS NOT NULL",
      "  AND (CHAR_LENGTH(vanity_slug) NOT BETWEEN 5 AND 30",
      "       OR vanity_slug REGEXP '[^a-z0-9-]'",
      "       OR vanity_slug LIKE '-%'",
      "       OR vanity_slug LIKE '%-'",
      "       OR LOCATE('--', vanity_slug) > 0)",
      "ORDER BY member_id",
    ].join("\n"),
    alternatives: [
      "SELECT member_id, vanity_slug FROM Member WHERE vanity_slug IS NOT NULL AND (CHAR_LENGTH(vanity_slug) < 5 OR CHAR_LENGTH(vanity_slug) > 30 OR vanity_slug NOT REGEXP '^[a-z0-9]+(-[a-z0-9]+)*$') ORDER BY member_id",
      "SELECT member_id, vanity_slug FROM Member WHERE vanity_slug IS NOT NULL AND NOT (LENGTH(vanity_slug) BETWEEN 5 AND 30 AND vanity_slug NOT REGEXP '[^a-z0-9-]' AND LEFT(vanity_slug, 1) <> '-' AND RIGHT(vanity_slug, 1) <> '-' AND INSTR(vanity_slug, '--') = 0) ORDER BY member_id",
    ],
    ordered: true,
    hints: [
      "Write each rule as its own condition and join the *violations* with OR.",
      "A negated character class, `[^a-z0-9-]`, finds any character that is not allowed.",
      "One pattern can capture the whole valid shape: words of letters and digits joined by single hyphens.",
    ],
    editorial: [
      "A slug is invalid if **any** rule fails, so the query lists one condition per rule and joins them with `OR`: the length is outside 5–30, some character is outside the allowed set (`REGEXP '[^a-z0-9-]'` finds an underscore, a dot or a space), the first or last character is a hyphen, or `--` occurs somewhere. The NULL check stands apart and is joined with `AND`, so members without a custom address are never flagged.",
      "",
      "The first alternative states the valid shape in one regular expression — `^[a-z0-9]+(-[a-z0-9]+)*$` means one or more runs of letters and digits separated by single hyphens — which covers the character set, the leading and trailing hyphen and the double hyphen at once; only the length stays a separate test. The second writes the positive definition of a valid slug and negates it, using `LEFT`, `RIGHT` and `INSTR` instead of `LIKE` and `LOCATE`. The slugs are ASCII, so `LENGTH` and `CHAR_LENGTH` agree. Every version is one scan with no join.",
    ].join("\n"),
  },

  {
    slug: "linkedin-jobs-reposted-within-thirty-days",
    title: "LinkedIn: Jobs Reposted Within 30 Days",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Dates"],
    description: [
      "When a company posts the same role again soon after the last posting, it usually means the first one did not fill — the jobs marketplace team wants those reposts.",
      "",
      "A posting is a **repost** when the same company posted a job with the **same title** earlier, and the most recent such earlier posting is **at most 30 days** before it. Return `job_id`, `company_id`, `title` and `days_since_previous` (days since that most recent earlier posting) for every repost, ordered by `job_id`. A company never posts the same title twice on one day.",
    ].join("\n"),
    tables: [
      {
        name: "JobPosting",
        columns: [
          { name: "job_id", type: "int" },
          { name: "company_id", type: "int" },
          { name: "title", type: "varchar" },
          { name: "posted_on", type: "date" },
        ],
        primaryKey: ["job_id"],
        note: "One row per job posting. Titles are spelt consistently, so the same role always has the same title.",
      },
    ],
    examples: [
      {
        JobPosting: [
          [1, 10, "Data Analyst", "2025-01-05"],
          [2, 10, "Data Analyst", "2025-02-04"],
          [3, 10, "Data Analyst", "2025-03-10"],
          [4, 11, "Data Analyst", "2025-01-20"],
          [5, 10, "Software Engineer", "2025-01-25"],
          [6, 10, "Software Engineer", "2025-02-25"],
          [7, 11, "Product Manager", "2025-02-01"],
          [8, 11, "Product Manager", "2025-02-11"],
        ],
      },
    ],
    gen: (rng) => {
      const used = new Set<string>();
      const rows: Cell[][] = [];
      const n = ri(rng, 1, 14);
      for (let i = 0; i < n; i++) {
        const company = ri(rng, 10, 12);
        const title = pick(rng, JOB_TITLES.slice(0, 3));
        let date = dateBetween(rng, "2025-01-01", "2025-04-30");
        const same = rows.filter((r) => r[1] === company && r[2] === title);
        if (same.length && chance(rng, 0.5)) date = addDays(same[same.length - 1]![3] as string, pick(rng, [29, 30, 31, 5, 45]));
        const key = `${company}|${title}|${date}`;
        if (used.has(key)) continue;
        used.add(key);
        rows.push([0, company, title, date]);
      }
      shuffle(rng, rows).forEach((r, i) => (r[0] = i + 1));
      return { JobPosting: rows };
    },
    solution: [
      "WITH s AS (",
      "  SELECT job_id, company_id, title, posted_on,",
      "         LAG(posted_on) OVER (PARTITION BY company_id, title ORDER BY posted_on) AS prev_on",
      "  FROM JobPosting",
      ")",
      "SELECT job_id, company_id, title, DATEDIFF(posted_on, prev_on) AS days_since_previous",
      "FROM s",
      "WHERE DATEDIFF(posted_on, prev_on) <= 30",
      "ORDER BY job_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT j.job_id, j.company_id, j.title, DATEDIFF(j.posted_on, MAX(p.posted_on)) AS days_since_previous",
        "FROM JobPosting j",
        "JOIN JobPosting p ON p.company_id = j.company_id AND p.title = j.title AND p.posted_on < j.posted_on",
        "GROUP BY j.job_id, j.company_id, j.title, j.posted_on",
        "HAVING DATEDIFF(j.posted_on, MAX(p.posted_on)) <= 30",
        "ORDER BY j.job_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Each posting needs the date of the previous posting of the same company and title.",
      "`LAG(posted_on) OVER (PARTITION BY company_id, title ORDER BY posted_on)` returns it — or NULL for the first.",
      "A NULL gap fails `<= 30`, so first postings drop out on their own.",
    ],
    editorial: [
      "Each posting is compared with one other row: the latest earlier posting of the same company and title. `LAG(posted_on)` over a window partitioned by `(company_id, title)` and ordered by date hands that date to every row, and `DATEDIFF` turns it into a gap in days. The first posting of a role has no predecessor; `LAG` gives NULL, `DATEDIFF` of NULL is NULL, and `NULL <= 30` is not true, so first postings are excluded without a separate check.",
      "",
      "Only the most recent earlier posting matters: in the example, job 3 comes 34 days after job 2 and is not a repost, even though job 1 is the same role. The same title at a different company is a different partition. The bound is inclusive — exactly 30 days is a repost.",
      "",
      "The alternative self-joins each posting to all earlier postings of the same role and takes `MAX(p.posted_on)` per posting, filtering the gap in `HAVING`; it is quadratic within a role, while the window version sorts each partition once.",
    ].join("\n"),
  },

  {
    slug: "linkedin-applicants-holding-every-required-skill",
    title: "LinkedIn: Applicants Holding Every Required Skill",
    difficulty: "MEDIUM",
    topics: ["Subqueries", "Joins"],
    description: [
      "Recruiters can filter applicants to the ones who already list every skill the job asks for. Rebuild that filter.",
      "",
      "Return `application_id`, `job_id` and `member_id` for every application whose member lists **all** of the job's required skills on their profile. A job with **no required skills** is satisfied by every applicant. Extra skills on the profile are fine. Order the rows by `application_id`.",
    ].join("\n"),
    tables: [
      {
        name: "JobSkill",
        columns: [
          { name: "job_id", type: "int" },
          { name: "skill", type: "varchar" },
        ],
        primaryKey: ["job_id", "skill"],
        note: "A skill the job posting requires.",
      },
      {
        name: "MemberSkill",
        columns: [
          { name: "member_id", type: "int" },
          { name: "skill", type: "varchar" },
        ],
        primaryKey: ["member_id", "skill"],
        note: "A skill listed on the member's profile. Skill names are spelt the same way in both tables.",
      },
      {
        name: "JobApplication",
        columns: [
          { name: "application_id", type: "int" },
          { name: "job_id", type: "int" },
          { name: "member_id", type: "int" },
        ],
        primaryKey: ["application_id"],
        note: "One row per application; a member applies to a job at most once.",
      },
    ],
    examples: [
      {
        JobSkill: [
          [1, "SQL"],
          [1, "Python"],
          [2, "Figma"],
        ],
        MemberSkill: [
          [10, "SQL"],
          [10, "Python"],
          [10, "Excel"],
          [11, "SQL"],
          [12, "Figma"],
        ],
        JobApplication: [
          [100, 1, 10],
          [101, 1, 11],
          [102, 2, 12],
          [103, 2, 10],
          [104, 3, 11],
          [105, 1, 13],
        ],
      },
    ],
    gen: (rng) => {
      const skills = sample(rng, SKILLS, 5);
      const jobs = ri(rng, 1, 4);
      const jobSkill: Cell[][] = [];
      for (let j = 1; j <= jobs; j++) for (const s of sample(rng, skills, ri(rng, 0, 3))) jobSkill.push([j, s]);
      const memberSkill: Cell[][] = [];
      for (let m = 10; m <= 15; m++) for (const s of sample(rng, skills, ri(rng, 0, 4))) memberSkill.push([m, s]);
      const pairs = shuffle(rng, seq(1, jobs).flatMap((j) => seq(10, 6).map((m) => [j, m] as const))).slice(0, ri(rng, 1, 12));
      const apps: Cell[][] = pairs.map(([j, m], i) => [100 + i, j, m]);
      return { JobSkill: jobSkill, MemberSkill: memberSkill, JobApplication: apps };
    },
    solution: [
      "SELECT a.application_id, a.job_id, a.member_id",
      "FROM JobApplication a",
      "WHERE NOT EXISTS (",
      "  SELECT 1 FROM JobSkill js",
      "  WHERE js.job_id = a.job_id",
      "    AND NOT EXISTS (",
      "      SELECT 1 FROM MemberSkill ms",
      "      WHERE ms.member_id = a.member_id AND ms.skill = js.skill",
      "    )",
      ")",
      "ORDER BY a.application_id",
    ].join("\n"),
    alternatives: [
      [
        "SELECT a.application_id, a.job_id, a.member_id",
        "FROM JobApplication a",
        "LEFT JOIN JobSkill js ON js.job_id = a.job_id",
        "LEFT JOIN MemberSkill ms ON ms.member_id = a.member_id AND ms.skill = js.skill",
        "GROUP BY a.application_id, a.job_id, a.member_id",
        "HAVING COUNT(js.skill) = COUNT(ms.skill)",
        "ORDER BY a.application_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "\"Has every required skill\" is the same as \"there is no required skill they lack\".",
      "That turns into two nested NOT EXISTS: no job skill for which no member skill matches.",
      "Or count: the job's required skills and how many of them the member matched must be equal.",
    ],
    editorial: [
      "This is **relational division**: keep the applications whose member's skill set contains the job's whole skill set. SQL has no \"for all\", so the solution uses the double negative — an application qualifies when *there is no* required skill of the job for which *there is no* matching skill on the member's profile. The inner `NOT EXISTS` finds a missing skill; the outer one keeps the application only if no such skill exists.",
      "",
      "The empty case falls out correctly: a job with no rows in `JobSkill` has no required skill that could be missing, so every applicant passes — \"all of nothing\" is true. A member with no skills at all fails any job that requires something.",
      "",
      "The alternative counts instead. LEFT JOIN each application to its job's required skills, then LEFT JOIN each of those to the member's matching skill; `COUNT(js.skill)` is the number required and `COUNT(ms.skill)` the number matched, and they are equal exactly when nothing is missing (both 0 for a job without requirements). The counting version relies on the primary keys preventing duplicate skills; the NOT EXISTS version does not.",
    ].join("\n"),
  },

  {
    slug: "linkedin-premium-trial-conversion-by-month",
    title: "LinkedIn: Premium Free-Trial Conversion by Trial Month",
    difficulty: "MEDIUM",
    topics: ["Aggregation", "Dates", "Conditional Logic"],
    description: [
      "Premium offers a free trial, and the subscriptions team tracks how many trials turn into a paid plan soon after they start.",
      "",
      "A trial **converts** when `paid_on` is not NULL and is **at most 30 days** after `trial_start`. For each month in which trials started, return `trial_month` (as `'YYYY-MM'`), `trials`, `converted` and `conversion_pct` (converted ÷ trials × 100, **rounded to one decimal place**). Order the rows by `trial_month`.",
    ].join("\n"),
    tables: [
      {
        name: "PremiumTrial",
        columns: [
          { name: "trial_id", type: "int" },
          { name: "member_id", type: "int" },
          { name: "trial_start", type: "date" },
          { name: "paid_on", type: "date" },
        ],
        primaryKey: ["trial_id"],
        note: "One row per free trial. `paid_on` is the date of the first paid charge after the trial, or NULL if the member never paid.",
      },
    ],
    examples: [
      {
        PremiumTrial: [
          [1, 41, "2025-01-03", "2025-02-02"],
          [2, 42, "2025-01-15", "2025-02-15"],
          [3, 43, "2025-01-20", null],
          [4, 44, "2025-02-01", "2025-02-20"],
          [5, 45, "2025-02-10", "2025-02-11"],
          [6, 46, "2025-02-28", null],
          [7, 47, "2025-03-05", "2025-05-01"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 15);
      const rows: Cell[][] = seq(1, n).map((id) => {
        const start = dateBetween(rng, "2025-01-01", "2025-03-31");
        const paid = chance(rng, 0.35) ? null : addDays(start, pick(rng, [ri(rng, 0, 45), 30, 31, ri(rng, 1, 14)]));
        return [id, ri(rng, 40, 90), start, paid];
      });
      return { PremiumTrial: rows };
    },
    solution: [
      "SELECT DATE_FORMAT(trial_start, '%Y-%m') AS trial_month,",
      "       COUNT(*) AS trials,",
      "       SUM(CASE WHEN paid_on IS NOT NULL AND DATEDIFF(paid_on, trial_start) <= 30 THEN 1 ELSE 0 END) AS converted,",
      "       ROUND(100 * SUM(CASE WHEN paid_on IS NOT NULL AND DATEDIFF(paid_on, trial_start) <= 30 THEN 1 ELSE 0 END) / COUNT(*), 1) AS conversion_pct",
      "FROM PremiumTrial",
      "GROUP BY trial_month",
      "ORDER BY trial_month",
    ].join("\n"),
    alternatives: [
      [
        "SELECT trial_month, COUNT(*) AS trials, SUM(ok) AS converted, ROUND(100 * SUM(ok) / COUNT(*), 1) AS conversion_pct",
        "FROM (SELECT LEFT(trial_start, 7) AS trial_month, IF(paid_on <= DATE_ADD(trial_start, INTERVAL 30 DAY), 1, 0) AS ok FROM PremiumTrial) t",
        "GROUP BY trial_month",
        "ORDER BY trial_month",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "`DATE_FORMAT(trial_start, '%Y-%m')` labels each trial with its month.",
      "A conversion needs a payment *and* a gap of at most 30 days.",
      "A NULL `paid_on` must count as not converted, not be dropped.",
    ],
    editorial: [
      "Every trial belongs to the month it started in, labelled with `DATE_FORMAT(trial_start, '%Y-%m')`; grouping by that label gives one row per month. Within a month, `COUNT(*)` is the number of trials and a conditional `SUM` counts the conversions — a payment exists and arrived within 30 days, inclusive, of the start. The percentage divides the two and rounds last.",
      "",
      "NULL needs thought. A trial that never paid has `paid_on` NULL; it must stay in the denominator but add 0 to the numerator. The `CASE` does this explicitly. In the alternative, `IF(paid_on <= DATE_ADD(trial_start, INTERVAL 30 DAY), 1, 0)` gets the same result implicitly: the comparison with NULL is unknown, and `IF` treats unknown as false. That version builds the month label with `LEFT(trial_start, 7)` in a derived table first, which also avoids repeating the condition.",
      "",
      "Payments 31 days after the start, like trial 2 in the example, do not count. The query is one grouped scan; with an index on `trial_start` a date-range filter would narrow it further.",
    ].join("\n"),
  },

  {
    slug: "linkedin-running-follower-count-of-company-pages",
    title: "LinkedIn: Running Follower Count of Company Pages",
    difficulty: "MEDIUM",
    topics: ["Window Functions", "Aggregation"],
    description: [
      "Company page admins see a follower graph that moves day by day. Rebuild it from the raw follow and unfollow events, starting from zero followers.",
      "",
      "For each page and each day on which that page had at least one event, return `page_id`, `event_on`, `net_change` (follows minus unfollows that day) and `followers` (the running total of net changes up to and including that day). Order the rows by `page_id`, then `event_on`.",
    ].join("\n"),
    tables: [
      {
        name: "PageFollowEvent",
        columns: [
          { name: "event_id", type: "int" },
          { name: "page_id", type: "int" },
          { name: "event_on", type: "date" },
          { name: "event_type", type: "enum", values: ["follow", "unfollow"] },
        ],
        primaryKey: ["event_id"],
        note: "One row per follow or unfollow of a company page; each page started with no followers.",
      },
    ],
    examples: [
      {
        PageFollowEvent: [
          [1, 1, "2025-05-01", "follow"],
          [2, 1, "2025-05-01", "follow"],
          [3, 1, "2025-05-02", "unfollow"],
          [4, 1, "2025-05-04", "follow"],
          [5, 1, "2025-05-04", "unfollow"],
          [6, 2, "2025-05-02", "follow"],
          [7, 2, "2025-05-03", "follow"],
          [8, 2, "2025-05-03", "follow"],
        ],
      },
    ],
    gen: (rng) => {
      const n = chance(rng, 0.05) ? 0 : ri(rng, 1, 20);
      const rows: Cell[][] = seq(1, n).map((id) => [id, ri(rng, 1, 3), dateBetween(rng, "2025-05-01", "2025-05-10"), chance(rng, 0.65) ? "follow" : "unfollow"]);
      return { PageFollowEvent: rows };
    },
    solution: [
      "WITH daily AS (",
      "  SELECT page_id, event_on,",
      "         SUM(CASE WHEN event_type = 'follow' THEN 1 ELSE -1 END) AS net_change",
      "  FROM PageFollowEvent",
      "  GROUP BY page_id, event_on",
      ")",
      "SELECT page_id, event_on, net_change,",
      "       SUM(net_change) OVER (PARTITION BY page_id ORDER BY event_on) AS followers",
      "FROM daily",
      "ORDER BY page_id, event_on",
    ].join("\n"),
    alternatives: [
      [
        "SELECT d.page_id, d.event_on, d.net_change,",
        "       (SELECT SUM(IF(x.event_type = 'follow', 1, -1)) FROM PageFollowEvent x WHERE x.page_id = d.page_id AND x.event_on <= d.event_on) AS followers",
        "FROM (SELECT page_id, event_on, SUM(IF(event_type = 'follow', 1, -1)) AS net_change FROM PageFollowEvent GROUP BY page_id, event_on) d",
        "ORDER BY d.page_id, d.event_on",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "First collapse the events into one row per page and day: +1 per follow, −1 per unfollow.",
      "A running total is `SUM(...) OVER (PARTITION BY ... ORDER BY ...)`.",
      "Do the daily grouping before the window, so the window sees one row per day.",
    ],
    editorial: [
      "Two aggregations happen at different levels. First the events are collapsed per page and day: a `CASE` maps each follow to +1 and each unfollow to −1, and `SUM` gives the day's net change. That runs in a CTE, so the second step sees exactly one row per page and day.",
      "",
      "The second step is a **running total**: `SUM(net_change) OVER (PARTITION BY page_id ORDER BY event_on)` adds up every day of the page from its first event to the current one. Partitioning restarts the total for each page. Since the daily rows have distinct dates within a page, the default window frame (everything up to the current row's date) includes each day once; had the window run over the raw events, rows sharing a date would all see the same total under the default RANGE frame, and the output would have one row per event rather than per day.",
      "",
      "The alternative computes the running total with a correlated subquery that sums every event of the page up to that date — simpler to read but quadratic in the number of days; the window version sorts each page once.",
    ].join("\n"),
  },

  {
    slug: "linkedin-members-with-exactly-the-same-skill-set",
    title: "LinkedIn: Members With Exactly the Same Skill Set",
    difficulty: "MEDIUM",
    topics: ["Joins", "Aggregation", "Subqueries"],
    description: [
      "The trust and safety team looks for clusters of profiles whose Skills section was copied wholesale, and the first signal is two members listing **exactly the same set** of skills.",
      "",
      "Return every pair of members as `member_a` and `member_b` (with `member_a < member_b`) whose skill sets are **identical**: every skill one lists, the other lists too, and neither has a skill the other lacks. Sharing most skills is not enough — one extra or one missing skill breaks the match. Only members with at least one row in `MemberSkill` are considered. Order the rows by `member_a`, then `member_b`.",
    ].join("\n"),
    tables: [
      {
        name: "MemberSkill",
        columns: [
          { name: "member_id", type: "int" },
          { name: "skill", type: "varchar" },
          { name: "added_on", type: "date" },
        ],
        primaryKey: ["member_id", "skill"],
        note: "A skill listed on a member's profile, and when it was added. Skill names are always spelt the same way, so equal skills are equal strings.",
      },
    ],
    examples: [
      {
        MemberSkill: [
          [1, "SQL", "2024-01-10"],
          [1, "Python", "2024-02-11"],
          [2, "Python", "2024-03-05"],
          [2, "SQL", "2024-03-05"],
          [3, "SQL", "2024-04-01"],
          [3, "Python", "2024-04-01"],
          [3, "Excel", "2024-04-02"],
          [4, "SQL", "2024-05-20"],
          [5, "Figma", "2024-06-01"],
          [6, "Figma", "2024-06-15"],
          [7, "SQL", "2024-07-07"],
        ],
      },
    ],
    gen: (rng) => {
      const pool = sample(rng, SKILLS, ri(rng, 2, 4));
      const n = ri(rng, 2, 8);
      const sets: string[][] = [];
      for (let m = 0; m < n; m++) {
        if (m > 0 && chance(rng, 0.35)) {
          const base = [...pick(rng, sets)];
          // Sometimes a near copy: one skill more or one fewer, the case "exactly" is about.
          if (chance(rng, 0.3)) {
            const extra = pool.find((s) => !base.includes(s));
            if (extra && chance(rng, 0.5)) base.push(extra);
            else if (base.length > 1) base.pop();
          }
          sets.push(base);
        } else sets.push(sample(rng, pool, ri(rng, 1, pool.length)));
      }
      const rows: Cell[][] = [];
      sets.forEach((set, i) => {
        for (const s of set) rows.push([i + 1, s, dateBetween(rng, "2024-01-01", "2025-06-30")]);
      });
      return { MemberSkill: shuffle(rng, rows) };
    },
    solution: [
      "WITH sizes AS (",
      "  SELECT member_id, COUNT(*) AS n",
      "  FROM MemberSkill",
      "  GROUP BY member_id",
      ")",
      "SELECT a.member_id AS member_a, b.member_id AS member_b",
      "FROM MemberSkill a",
      "JOIN MemberSkill b ON b.skill = a.skill AND b.member_id > a.member_id",
      "JOIN sizes sa ON sa.member_id = a.member_id",
      "JOIN sizes sb ON sb.member_id = b.member_id",
      "WHERE sa.n = sb.n",
      "GROUP BY a.member_id, b.member_id, sa.n",
      "HAVING COUNT(*) = sa.n",
      "ORDER BY member_a, member_b",
    ].join("\n"),
    alternatives: [
      [
        "WITH sig AS (",
        "  SELECT member_id, GROUP_CONCAT(skill ORDER BY skill SEPARATOR '|') AS skills",
        "  FROM MemberSkill GROUP BY member_id",
        ")",
        "SELECT x.member_id AS member_a, y.member_id AS member_b",
        "FROM sig x JOIN sig y ON y.skills = x.skills AND y.member_id > x.member_id",
        "ORDER BY member_a, member_b",
      ].join("\n"),
      [
        "WITH m AS (SELECT DISTINCT member_id FROM MemberSkill)",
        "SELECT x.member_id AS member_a, y.member_id AS member_b",
        "FROM m x JOIN m y ON y.member_id > x.member_id",
        "WHERE NOT EXISTS (SELECT 1 FROM MemberSkill s WHERE s.member_id = x.member_id",
        "                  AND NOT EXISTS (SELECT 1 FROM MemberSkill t WHERE t.member_id = y.member_id AND t.skill = s.skill))",
        "  AND NOT EXISTS (SELECT 1 FROM MemberSkill s WHERE s.member_id = y.member_id",
        "                  AND NOT EXISTS (SELECT 1 FROM MemberSkill t WHERE t.member_id = x.member_id AND t.skill = s.skill))",
        "ORDER BY member_a, member_b",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Two sets are equal when they have the same size and every element of one is in the other.",
      "Join the table to itself on the skill to count how many skills each pair shares.",
      "A pair matches when the shared count equals both members' own counts.",
    ],
    editorial: [
      "Set equality has no operator in SQL, so the query reduces it to counting. Two finite sets are equal exactly when they have the same size and their intersection is as large as either of them. The self join on `skill` (with `b.member_id > a.member_id`, so each pair is considered once and never with itself) produces one row per shared skill, so `COUNT(*)` per pair is the size of the intersection. The `sizes` CTE holds each member's own count; the pair qualifies when the two sizes are equal and the shared count reaches that size.",
      "",
      "Both conditions are needed. Member 3 in the example shares SQL and Python with member 1 — the whole of member 1's set — but lists Excel as well, so their sizes differ and the pair fails. Pairs that share no skill never meet in the join, which is right because non-empty sets with nothing in common are not equal. The primary key rules out duplicate skills, so no count is inflated.",
      "",
      "The first alternative builds a **signature** per member — the skills sorted and joined by `GROUP_CONCAT` — and matches equal signatures, which is compact and fast but relies on the separator never appearing inside a skill name. The second states equality literally as two-way containment with double `NOT EXISTS`, which needs no counting but probes the table for every pair.",
    ].join("\n"),
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    slug: "linkedin-mutual-connections-on-pending-invitations",
    title: "LinkedIn: Mutual Connections Behind Pending Invitations",
    difficulty: "HARD",
    topics: ["Joins", "Aggregation", "Subqueries"],
    description: [
      "The invitation inbox shows how many mutual connections the sender shares with you, and the growth team wants to know how that number spreads across invitations still waiting for an answer.",
      "",
      "For every invitation with status `pending`, return `invitation_id`, `sender_id`, `recipient_id` and `mutual_connections`: the number of members who are connected to **both** the sender and the recipient (0 if none). Connections are stored **once per pair** with the smaller id in `member_a`. Order the rows by `mutual_connections` descending, then `invitation_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "MemberConnection",
        columns: [
          { name: "member_a", type: "int" },
          { name: "member_b", type: "int" },
        ],
        primaryKey: ["member_a", "member_b"],
        note: "One row per connected pair, always with `member_a < member_b`.",
      },
      {
        name: "Invitation",
        columns: [
          { name: "invitation_id", type: "int" },
          { name: "sender_id", type: "int" },
          { name: "recipient_id", type: "int" },
          { name: "status", type: "enum", values: ["pending", "accepted", "ignored"] },
        ],
        primaryKey: ["invitation_id"],
        note: "One row per connection invitation; sender and recipient always differ.",
      },
    ],
    examples: [
      {
        MemberConnection: [
          [1, 3],
          [1, 4],
          [2, 3],
          [2, 4],
          [3, 5],
          [4, 6],
          [5, 6],
        ],
        Invitation: [
          [10, 1, 2, "pending"],
          [11, 5, 4, "pending"],
          [12, 1, 6, "pending"],
          [13, 3, 4, "accepted"],
          [14, 6, 2, "pending"],
          [15, 5, 2, "pending"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 3, 8);
      const edges: Cell[][] = randomEdges(rng, n, 0.2 + rng() * 0.4).map(([a, b]) => [a, b]);
      const k = ri(rng, 1, 8);
      const inv: Cell[][] = seq(1, k).map((id) => {
        const s = ri(rng, 1, n);
        let r = ri(rng, 1, n - 1);
        if (r >= s) r++;
        return [id, s, r, pick(rng, ["pending", "pending", "pending", "accepted", "ignored"])];
      });
      return { MemberConnection: edges, Invitation: inv };
    },
    solution: [
      "WITH e AS (",
      "  SELECT member_a AS m, member_b AS f FROM MemberConnection",
      "  UNION ALL",
      "  SELECT member_b, member_a FROM MemberConnection",
      ")",
      "SELECT i.invitation_id, i.sender_id, i.recipient_id, COUNT(r.f) AS mutual_connections",
      "FROM Invitation i",
      "LEFT JOIN e s ON s.m = i.sender_id",
      "LEFT JOIN e r ON r.m = i.recipient_id AND r.f = s.f",
      "WHERE i.status = 'pending'",
      "GROUP BY i.invitation_id, i.sender_id, i.recipient_id",
      "ORDER BY mutual_connections DESC, i.invitation_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH e AS (SELECT member_a AS m, member_b AS f FROM MemberConnection UNION ALL SELECT member_b, member_a FROM MemberConnection)",
        "SELECT i.invitation_id, i.sender_id, i.recipient_id,",
        "       (SELECT COUNT(*) FROM e x WHERE x.m = i.sender_id AND EXISTS (SELECT 1 FROM e y WHERE y.m = i.recipient_id AND y.f = x.f)) AS mutual_connections",
        "FROM Invitation i",
        "WHERE i.status = 'pending'",
        "ORDER BY mutual_connections DESC, i.invitation_id",
      ].join("\n"),
      [
        "SELECT i.invitation_id, i.sender_id, i.recipient_id,",
        "       (SELECT COUNT(*) FROM (SELECT member_a AS m, member_b AS f FROM MemberConnection UNION SELECT member_b, member_a FROM MemberConnection) x",
        "        WHERE x.m = i.sender_id AND x.f IN (SELECT member_b FROM MemberConnection WHERE member_a = i.recipient_id",
        "                                            UNION SELECT member_a FROM MemberConnection WHERE member_b = i.recipient_id)) AS mutual_connections",
        "FROM Invitation i",
        "WHERE i.status = 'pending'",
        "ORDER BY mutual_connections DESC, i.invitation_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Turn the once-per-pair table into a directed list where every connection appears both ways.",
      "A mutual connection is a member `f` with an edge from the sender *and* an edge from the recipient.",
      "LEFT JOINs keep invitations with no mutual connections at 0 — count the second join's column.",
    ],
    editorial: [
      "Stored once per pair, connections are awkward to query: \"my connections\" means the pairs where I am `member_a` plus the pairs where I am `member_b`. The CTE `e` normalises this into a **directed edge list** with every connection twice, once from each end, so `e.m = X` lists all of X's connections in one condition.",
      "",
      "Then a mutual connection is a member `f` reached from both people. The first LEFT JOIN lists the sender's connections `s.f`; the second looks for a recipient edge to the same member (`r.m = recipient AND r.f = s.f`). Each match is one mutual connection, so `COUNT(r.f)` counts them, and the NULLs left by unmatched rows — or by a sender with no connections at all — count as 0. Both joins are LEFT so that invitations with nothing in common still produce a row. The primary key guarantees no duplicate edges, so no mutual connection is counted twice.",
      "",
      "The alternatives count per invitation with correlated subqueries — one with `EXISTS` over the edge list, one with `IN` over the recipient's neighbours built inline. The join version computes one intermediate row per sender connection; with indexes on both columns of `MemberConnection` all three are lookups per invitation.",
    ].join("\n"),
  },

  {
    slug: "linkedin-followers-across-affiliated-company-pages",
    title: "LinkedIn: Followers Across Each Company's Affiliated Pages",
    difficulty: "HARD",
    topics: ["Subqueries", "Joins", "Aggregation"],
    description: [
      "A company on LinkedIn can sit at the top of a tree of pages: showcase pages for its products, pages for its regional arms, and showcase pages under those. The Pages team reports each company's reach across its whole tree.",
      "",
      "For every **top-level** page (`parent_page_id` NULL), return `page_id`, `page_name`, `affiliated_pages` (the number of pages beneath it **at any depth**, not counting itself), `total_follows` (follows of the page itself and every page beneath it) and `unique_followers` (the number of **different members** following at least one page of the tree — a member following three pages of one company counts once). Trees without follows show 0. Order the rows by `unique_followers` descending, then `page_id` ascending.",
    ].join("\n"),
    tables: [
      {
        name: "CompanyPage",
        columns: [
          { name: "page_id", type: "int" },
          { name: "page_name", type: "varchar" },
          { name: "parent_page_id", type: "int" },
        ],
        primaryKey: ["page_id"],
        note: "One row per page. `parent_page_id` is the page this one sits under, or NULL for a company's top-level page; it always names an existing page and the parent links never loop.",
      },
      {
        name: "PageFollow",
        columns: [
          { name: "member_id", type: "int" },
          { name: "page_id", type: "int" },
        ],
        primaryKey: ["member_id", "page_id"],
        note: "A member following a page.",
      },
    ],
    examples: [
      {
        CompanyPage: [
          [1, "Northwind Labs", null],
          [2, "Northwind Cloud", 1],
          [3, "Northwind Cloud India", 2],
          [4, "Northwind Careers", 1],
          [5, "Saffron Fintech", null],
          [6, "Saffron Pay", 5],
          [7, "Cedar Robotics", null],
        ],
        PageFollow: [
          [21, 1],
          [21, 3],
          [22, 3],
          [23, 4],
          [24, 5],
          [24, 6],
          [25, 6],
          [26, 6],
          [21, 6],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 10);
      const names = sample(rng, COMPANIES, Math.min(n, COMPANIES.length));
      const pages: Cell[][] = seq(1, n).map((id) => [
        id,
        id <= names.length ? names[id - 1]! : `Showcase ${id}`,
        id === 1 || chance(rng, 0.35) ? null : ri(rng, 1, id - 1),
      ]);
      const follows: Cell[][] = [];
      const seen = new Set<string>();
      const k = chance(rng, 0.08) ? 0 : ri(rng, 1, 22);
      for (let i = 0; i < k; i++) {
        const m = ri(rng, 20, 31);
        const p = ri(rng, 1, n);
        if (seen.has(`${m}|${p}`)) continue;
        seen.add(`${m}|${p}`);
        follows.push([m, p]);
      }
      return { CompanyPage: pages, PageFollow: follows };
    },
    solution: [
      "WITH RECURSIVE tree AS (",
      "  SELECT page_id AS root_id, page_id",
      "  FROM CompanyPage",
      "  WHERE parent_page_id IS NULL",
      "  UNION ALL",
      "  SELECT t.root_id, c.page_id",
      "  FROM tree t",
      "  JOIN CompanyPage c ON c.parent_page_id = t.page_id",
      ")",
      "SELECT r.page_id, r.page_name,",
      "       COUNT(DISTINCT t.page_id) - 1 AS affiliated_pages,",
      "       COUNT(f.member_id) AS total_follows,",
      "       COUNT(DISTINCT f.member_id) AS unique_followers",
      "FROM CompanyPage r",
      "JOIN tree t ON t.root_id = r.page_id",
      "LEFT JOIN PageFollow f ON f.page_id = t.page_id",
      "GROUP BY r.page_id, r.page_name",
      "ORDER BY unique_followers DESC, r.page_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH RECURSIVE up AS (",
        "  SELECT page_id, page_id AS cur, parent_page_id FROM CompanyPage",
        "  UNION ALL",
        "  SELECT u.page_id, p.page_id, p.parent_page_id FROM up u JOIN CompanyPage p ON p.page_id = u.parent_page_id",
        "), root_of AS (",
        "  SELECT page_id, cur AS root_id FROM up WHERE parent_page_id IS NULL",
        "), sizes AS (",
        "  SELECT root_id, COUNT(*) - 1 AS aff FROM root_of GROUP BY root_id",
        "), reach AS (",
        "  SELECT o.root_id, COUNT(*) AS follows, COUNT(DISTINCT f.member_id) AS uniq",
        "  FROM PageFollow f JOIN root_of o ON o.page_id = f.page_id GROUP BY o.root_id",
        ")",
        "SELECT r.page_id, r.page_name, s.aff AS affiliated_pages, COALESCE(a.follows, 0) AS total_follows, COALESCE(a.uniq, 0) AS unique_followers",
        "FROM CompanyPage r",
        "JOIN sizes s ON s.root_id = r.page_id",
        "LEFT JOIN reach a ON a.root_id = r.page_id",
        "WHERE r.parent_page_id IS NULL",
        "ORDER BY unique_followers DESC, r.page_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "The depth of a tree is not fixed, so a fixed number of self joins cannot reach every page — use `WITH RECURSIVE`.",
      "Carry the top-level page's id down the recursion, so every page knows which company tree it belongs to.",
      "Then it is a grouped count: plain `COUNT` for follows, `COUNT(DISTINCT member_id)` for people.",
    ],
    editorial: [
      "Pages form a tree of unknown depth — a showcase page under a regional page under the company — so no fixed chain of self joins is enough. A **recursive CTE** walks it: the anchor selects the top-level pages and labels each with itself as `root_id`; the recursive step adds every page whose parent is already in the result, copying the parent's `root_id`. When no new children are found the recursion stops, and every page appears once, tagged with the company tree it belongs to.",
      "",
      "The rest is aggregation per root. `COUNT(DISTINCT t.page_id) - 1` counts the pages of the tree minus the root itself. The LEFT JOIN to `PageFollow` keeps pages nobody follows, so a tree without follows still forms a group and gets 0; `COUNT(f.member_id)` counts follows, and `COUNT(DISTINCT f.member_id)` counts people, which is the number that matters for reach — in the example, member 21 follows two Northwind pages and is counted once there, and also counts once for Saffron.",
      "",
      "The alternative walks **upwards** instead: starting from every page, it follows parent links until it reaches a page with no parent, which is that page's root, and then aggregates per root in separate CTEs. The downward walk visits each page once; the upward one visits each page once per ancestor, so it costs more on deep trees.",
    ].join("\n"),
  },

  {
    slug: "linkedin-applications-year-over-year-by-company-quarter",
    title: "LinkedIn: Applications Year over Year by Company and Quarter",
    difficulty: "HARD",
    topics: ["Joins", "Aggregation", "Dates", "Conditional Logic"],
    description: [
      "Account managers for LinkedIn's hiring customers bring a quarter-by-quarter comparison of how many applications each customer's jobs received this year against last year — with every quarter on the page, even an empty one.",
      "",
      "For **every company** and **every quarter 1 to 4**, return `company_name`, `quarter_no`, `apps_2024` and `apps_2025` (applications to the company's postings made in that quarter of 2024 and of 2025, 0 when none) and `growth_pct`: (`apps_2025` − `apps_2024`) ÷ `apps_2024` × 100, **rounded to one decimal place**, or NULL when `apps_2024` is 0. Applications outside 2024 and 2025 are ignored. Order the rows by `company_name`, then `quarter_no`.",
    ].join("\n"),
    tables: [
      {
        name: "Company",
        columns: [
          { name: "company_id", type: "int" },
          { name: "company_name", type: "varchar" },
        ],
        primaryKey: ["company_id"],
        note: "One row per hiring customer; names are unique.",
      },
      {
        name: "JobPosting",
        columns: [
          { name: "job_id", type: "int" },
          { name: "company_id", type: "int" },
          { name: "title", type: "varchar" },
        ],
        primaryKey: ["job_id"],
        note: "One row per job posting; `company_id` always names a company.",
      },
      {
        name: "JobApplication",
        columns: [
          { name: "application_id", type: "int" },
          { name: "job_id", type: "int" },
          { name: "applied_at", type: "datetime" },
        ],
        primaryKey: ["application_id"],
        note: "One row per application; `job_id` always names a posting.",
      },
    ],
    examples: [
      {
        Company: [
          [1, "Kestrel Analytics"],
          [2, "Bluepeak Systems"],
        ],
        JobPosting: [
          [10, 1, "Data Analyst"],
          [11, 1, "Product Manager"],
          [12, 2, "Software Engineer"],
        ],
        JobApplication: [
          [1, 10, "2024-02-10 10:00:00"],
          [2, 11, "2024-03-31 23:50:00"],
          [3, 10, "2025-01-15 09:00:00"],
          [4, 10, "2025-02-20 12:00:00"],
          [5, 11, "2025-03-02 18:00:00"],
          [6, 10, "2024-07-04 11:00:00"],
          [7, 12, "2025-04-01 00:05:00"],
          [8, 12, "2023-12-30 15:00:00"],
          [9, 10, "2025-11-11 11:00:00"],
        ],
      },
    ],
    gen: (rng) => {
      const k = ri(rng, 1, 4);
      const companies: Cell[][] = sample(rng, COMPANIES, k).map((c, i) => [i + 1, c]);
      const jobs: Cell[][] = seq(10, ri(rng, k, k + 3)).map((id, i) => [id, i < k ? i + 1 : ri(rng, 1, k), pick(rng, JOB_TITLES)]);
      const apps: Cell[][] = [];
      for (let c = 1; c <= k; c++) {
        const own = jobs.filter((j) => j[1] === c).map((j) => j[0] as number);
        for (let i = ri(rng, 0, 12); i > 0; i--) {
          const day = chance(rng, 0.15)
            ? pick(rng, ["2023-12-31", "2024-03-31", "2024-04-01", "2025-06-30", "2025-07-01", "2026-01-01"])
            : dateBetween(rng, "2024-01-01", "2025-12-31");
          apps.push([0, pick(rng, own), atTime(rng, day)]);
        }
      }
      shuffle(rng, apps).forEach((r, i) => (r[0] = i + 1));
      return { Company: companies, JobPosting: jobs, JobApplication: apps };
    },
    solution: [
      "WITH quarters AS (",
      "  SELECT 1 AS quarter_no UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4",
      "), counts AS (",
      "  SELECT j.company_id, QUARTER(a.applied_at) AS q,",
      "         SUM(CASE WHEN YEAR(a.applied_at) = 2024 THEN 1 ELSE 0 END) AS y24,",
      "         SUM(CASE WHEN YEAR(a.applied_at) = 2025 THEN 1 ELSE 0 END) AS y25",
      "  FROM JobApplication a",
      "  JOIN JobPosting j ON j.job_id = a.job_id",
      "  WHERE a.applied_at >= '2024-01-01' AND a.applied_at < '2026-01-01'",
      "  GROUP BY j.company_id, QUARTER(a.applied_at)",
      ")",
      "SELECT c.company_name, qs.quarter_no,",
      "       COALESCE(k.y24, 0) AS apps_2024,",
      "       COALESCE(k.y25, 0) AS apps_2025,",
      "       ROUND(100 * (COALESCE(k.y25, 0) - k.y24) / NULLIF(k.y24, 0), 1) AS growth_pct",
      "FROM Company c",
      "CROSS JOIN quarters qs",
      "LEFT JOIN counts k ON k.company_id = c.company_id AND k.q = qs.quarter_no",
      "ORDER BY c.company_name, qs.quarter_no",
    ].join("\n"),
    alternatives: [
      [
        "SELECT g.company_name, g.quarter_no, g.apps_2024, g.apps_2025,",
        "       IF(g.apps_2024 = 0, NULL, ROUND(100 * (g.apps_2025 - g.apps_2024) / g.apps_2024, 1)) AS growth_pct",
        "FROM (",
        "  SELECT c.company_name, qs.quarter_no,",
        "         (SELECT COUNT(*) FROM JobApplication a JOIN JobPosting j ON j.job_id = a.job_id",
        "          WHERE j.company_id = c.company_id AND YEAR(a.applied_at) = 2024 AND QUARTER(a.applied_at) = qs.quarter_no) AS apps_2024,",
        "         (SELECT COUNT(*) FROM JobApplication a JOIN JobPosting j ON j.job_id = a.job_id",
        "          WHERE j.company_id = c.company_id AND YEAR(a.applied_at) = 2025 AND QUARTER(a.applied_at) = qs.quarter_no) AS apps_2025",
        "  FROM Company c",
        "  CROSS JOIN (SELECT 1 AS quarter_no UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4) qs",
        ") g",
        "ORDER BY g.company_name, g.quarter_no",
      ].join("\n"),
      [
        "WITH RECURSIVE qs AS (SELECT 1 AS quarter_no UNION ALL SELECT quarter_no + 1 FROM qs WHERE quarter_no < 4)",
        "SELECT c.company_name, qs.quarter_no,",
        "       COUNT(CASE WHEN a.applied_at >= '2024-01-01' AND a.applied_at < '2025-01-01' THEN 1 END) AS apps_2024,",
        "       COUNT(CASE WHEN a.applied_at >= '2025-01-01' AND a.applied_at < '2026-01-01' THEN 1 END) AS apps_2025,",
        "       ROUND(100 * (COUNT(CASE WHEN a.applied_at >= '2025-01-01' AND a.applied_at < '2026-01-01' THEN 1 END)",
        "                  - COUNT(CASE WHEN a.applied_at >= '2024-01-01' AND a.applied_at < '2025-01-01' THEN 1 END))",
        "             / NULLIF(COUNT(CASE WHEN a.applied_at >= '2024-01-01' AND a.applied_at < '2025-01-01' THEN 1 END), 0), 1) AS growth_pct",
        "FROM Company c",
        "CROSS JOIN qs",
        "LEFT JOIN JobPosting j ON j.company_id = c.company_id",
        "LEFT JOIN JobApplication a ON a.job_id = j.job_id AND QUARTER(a.applied_at) = qs.quarter_no",
        "GROUP BY c.company_id, c.company_name, qs.quarter_no",
        "ORDER BY c.company_name, qs.quarter_no",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Every company needs four rows whether or not anything happened — build the grid first: companies × quarters with a CROSS JOIN.",
      "Count the applications per company and quarter with one conditional SUM per year, then LEFT JOIN the counts onto the grid.",
      "A missing count is 0, but growth from 0 is undefined: `NULLIF(apps_2024, 0)` turns the division into NULL.",
    ],
    editorial: [
      "The report must show a row for every company and every quarter, even when a company had no applications at all in a quarter. Rows that do not exist in the data cannot be produced by grouping it, so the query builds the **grid** first: a four-row quarters table from `UNION ALL`, `CROSS JOIN`ed with `Company`. Then the facts are attached to the grid with a LEFT JOIN.",
      "",
      "The facts are counted once per company and quarter, with **conditional aggregation** placing each application in its year's column — that turns the year from rows into the two columns being compared. The `WHERE` drops applications outside 2024–2025 (in the example, the one from December 2023). Because `applied_at` has a time, the bounds are half-open, and `QUARTER()` puts 23:50 on March 31 in quarter 1.",
      "",
      "A cell with no applications comes through the LEFT JOIN as NULL and `COALESCE` shows 0. Growth divides by last year's count, and growth from nothing is undefined, so `NULLIF(k.y24, 0)` makes the division NULL instead of an error or a misleading number; a fall from 2 to 0 is −100.0.",
      "",
      "The first alternative fills each cell with two correlated counts — simple, but eight probes per company. The second generates the quarters with a recursive CTE and LEFT JOINs postings and applications straight onto the grid, counting with `COUNT(CASE …)`, where the NULLs of an empty cell add nothing.",
    ].join("\n"),
  },

  {
    slug: "linkedin-merged-premium-membership-spans",
    title: "LinkedIn: Merge Overlapping Premium Periods Into Spans",
    difficulty: "HARD",
    topics: ["Window Functions", "Dates"],
    description: [
      "Members switch Premium plans, renew early and come back after a lapse, so their subscription rows overlap. The loyalty programme needs each member's **continuous** Premium spans.",
      "",
      "Merge a member's periods into spans: two periods belong to the same span when they **overlap or touch** — a period starting on the day after another ends continues it, while a gap of one or more whole days without access starts a new span. Both `start_date` and `end_date` are days of access. Return `member_id`, `span_start`, `span_end` and `premium_days` (days of access in the span, both ends included). Order the rows by `member_id`, then `span_start`.",
    ].join("\n"),
    tables: [
      {
        name: "PremiumSubscription",
        columns: [
          { name: "subscription_id", type: "int" },
          { name: "member_id", type: "int" },
          { name: "plan", type: "varchar" },
          { name: "start_date", type: "date" },
          { name: "end_date", type: "date" },
        ],
        primaryKey: ["subscription_id"],
        note: "One row per subscription period; access runs from `start_date` to `end_date` inclusive, and `end_date` is never before `start_date`.",
      },
    ],
    examples: [
      {
        PremiumSubscription: [
          [1, 7, "Career", "2025-01-01", "2025-01-31"],
          [2, 7, "Business", "2025-01-20", "2025-02-28"],
          [3, 7, "Business", "2025-03-01", "2025-03-31"],
          [4, 7, "Career", "2025-04-02", "2025-04-30"],
          [5, 8, "Sales Navigator", "2025-02-01", "2025-06-30"],
          [6, 8, "Career", "2025-03-01", "2025-03-15"],
          [7, 8, "Career", "2025-07-01", "2025-07-31"],
          [8, 9, "Recruiter Lite", "2025-05-10", "2025-05-10"],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const members = ri(rng, 1, 4);
      for (let m = 1; m <= members; m++) {
        let cursor = dateBetween(rng, "2025-01-01", "2025-02-15");
        let lastEnd = addDays(cursor, -40);
        const k = ri(rng, 1, 4);
        for (let i = 0; i < k; i++) {
          const start = i === 0 ? cursor : addDays(lastEnd, pick(rng, [-20, -3, 0, 1, 2, 15]));
          const end = addDays(start, ri(rng, 0, 45));
          rows.push([0, m, pick(rng, PLANS), start, end]);
          if (end > lastEnd) lastEnd = end;
          cursor = start;
          if (chance(rng, 0.2)) {
            const inside = addDays(start, ri(rng, 0, 3));
            rows.push([0, m, pick(rng, PLANS), inside < end ? inside : end, end]);
          }
        }
      }
      shuffle(rng, rows).forEach((r, i) => (r[0] = i + 1));
      return { PremiumSubscription: rows };
    },
    solution: [
      "WITH ordered AS (",
      "  SELECT subscription_id, member_id, start_date, end_date,",
      "         MAX(end_date) OVER (PARTITION BY member_id ORDER BY start_date, subscription_id",
      "                             ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS reach",
      "  FROM PremiumSubscription",
      "), flagged AS (",
      "  SELECT subscription_id, member_id, start_date, end_date,",
      "         CASE WHEN reach IS NULL OR start_date > DATE_ADD(reach, INTERVAL 1 DAY) THEN 1 ELSE 0 END AS new_span",
      "  FROM ordered",
      "), numbered AS (",
      "  SELECT subscription_id, member_id, start_date, end_date,",
      "         SUM(new_span) OVER (PARTITION BY member_id ORDER BY start_date, subscription_id",
      "                             ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS span_no",
      "  FROM flagged",
      ")",
      "SELECT member_id, MIN(start_date) AS span_start, MAX(end_date) AS span_end,",
      "       DATEDIFF(MAX(end_date), MIN(start_date)) + 1 AS premium_days",
      "FROM numbered",
      "GROUP BY member_id, span_no",
      "ORDER BY member_id, span_start",
    ].join("\n"),
    alternatives: [
      [
        "WITH starts AS (",
        "  SELECT DISTINCT s.member_id, s.start_date FROM PremiumSubscription s",
        "  WHERE NOT EXISTS (SELECT 1 FROM PremiumSubscription o WHERE o.member_id = s.member_id",
        "                    AND o.start_date < s.start_date AND o.end_date >= DATE_SUB(s.start_date, INTERVAL 1 DAY))",
        "), ends AS (",
        "  SELECT DISTINCT s.member_id, s.end_date FROM PremiumSubscription s",
        "  WHERE NOT EXISTS (SELECT 1 FROM PremiumSubscription o WHERE o.member_id = s.member_id",
        "                    AND o.end_date > s.end_date AND o.start_date <= DATE_ADD(s.end_date, INTERVAL 1 DAY))",
        ")",
        "SELECT st.member_id, st.start_date AS span_start, MIN(en.end_date) AS span_end,",
        "       DATEDIFF(MIN(en.end_date), st.start_date) + 1 AS premium_days",
        "FROM starts st JOIN ends en ON en.member_id = st.member_id AND en.end_date >= st.start_date",
        "GROUP BY st.member_id, st.start_date",
        "ORDER BY st.member_id, span_start",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Sort each member's periods by start. A period begins a new span when it starts more than one day after the latest end seen so far.",
      "\"The latest end so far\" is a running MAX over the earlier rows — not just the previous row's end, because a long period can cover several short ones.",
      "Turn the new-span flags into span numbers with a running SUM, then group.",
    ],
    editorial: [
      "Interval merging is gaps and islands where the islands are defined by coverage rather than by consecutive numbers. Sort a member's periods by start date. A period continues the current span if it starts no later than the day after the furthest end reached by **any** earlier period — `MAX(end_date)` over the rows before it, not `LAG(end_date)`: in the example, member 8's long Sales Navigator period covers the short March period, and the July period must be compared with June 30, not with March 15. The window `ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING` gives exactly that running reach (NULL for the first period, which always opens a span).",
      "",
      "\"Touching\" counts as continuous, so the test is `start_date > DATE_ADD(reach, INTERVAL 1 DAY)`: a period starting on March 1 after one ending on February 28 merges, one starting on April 2 after March 31 leaves April 1 uncovered and opens a new span. A running `SUM` of the flags numbers the spans, and grouping by it gives each span's first start and last end; the day count adds 1 because both ends are days of access. Periods with equal starts are ordered by id so the reach is well defined.",
      "",
      "The alternative finds span boundaries directly. A start opens a span when no earlier-starting period reaches its previous day; an end closes one when no period ending later starts by the next day. Each span is then a start paired with the first closing end at or after it. It is quadratic, while the window version is one sort per member.",
    ].join("\n"),
  },

  {
    slug: "linkedin-second-degree-network-size",
    title: "LinkedIn: First- and Second-Degree Network Size",
    difficulty: "HARD",
    topics: ["Joins", "Subqueries", "Aggregation"],
    description: [
      "A member's reach on the network is their first-degree connections plus the people one introduction away. The network-insights team wants both numbers for everyone.",
      "",
      "For **every member**, return `member_id`, `first_degree` (their number of connections) and `second_degree`: the number of **different** members who are connected to at least one of their connections but are **neither** the member themselves **nor** already a first-degree connection. Connections are stored once per pair with the smaller id in `member_a`. Members with no connections show 0 and 0. Order the rows by `member_id`.",
    ].join("\n"),
    tables: [
      {
        name: "Member",
        columns: [
          { name: "member_id", type: "int" },
          { name: "full_name", type: "varchar" },
        ],
        primaryKey: ["member_id"],
        note: "One row per member.",
      },
      {
        name: "MemberConnection",
        columns: [
          { name: "member_a", type: "int" },
          { name: "member_b", type: "int" },
        ],
        primaryKey: ["member_a", "member_b"],
        note: "One row per connected pair, always with `member_a < member_b`; both are member ids.",
      },
    ],
    examples: [
      {
        Member: [
          [1, "Aisha Khan"],
          [2, "Dev Sharma"],
          [3, "Emma Nair"],
          [4, "Harsh Gupta"],
          [5, "Liam Rao"],
          [6, "Zara Iyer"],
        ],
        MemberConnection: [
          [1, 2],
          [1, 3],
          [2, 3],
          [3, 4],
          [4, 5],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 1, 9);
      const members: Cell[][] = seq(1, n).map((id) => [id, fullName(rng)]);
      const edges: Cell[][] = randomEdges(rng, n, 0.1 + rng() * 0.4).map(([a, b]) => [a, b]);
      return { Member: members, MemberConnection: edges };
    },
    solution: [
      "WITH e AS (",
      "  SELECT member_a AS m, member_b AS f FROM MemberConnection",
      "  UNION ALL",
      "  SELECT member_b, member_a FROM MemberConnection",
      "), second_ring AS (",
      "  SELECT DISTINCT x.m, y.f AS other",
      "  FROM e x",
      "  JOIN e y ON y.m = x.f",
      "  WHERE y.f <> x.m",
      "    AND NOT EXISTS (SELECT 1 FROM e z WHERE z.m = x.m AND z.f = y.f)",
      ")",
      "SELECT mb.member_id,",
      "       (SELECT COUNT(*) FROM e WHERE e.m = mb.member_id) AS first_degree,",
      "       (SELECT COUNT(*) FROM second_ring s WHERE s.m = mb.member_id) AS second_degree",
      "FROM Member mb",
      "ORDER BY mb.member_id",
    ].join("\n"),
    alternatives: [
      [
        "WITH e AS (SELECT member_a AS m, member_b AS f FROM MemberConnection UNION ALL SELECT member_b, member_a FROM MemberConnection)",
        "SELECT mb.member_id,",
        "       COUNT(DISTINCT x.f) AS first_degree,",
        "       COUNT(DISTINCT CASE WHEN y.f <> mb.member_id",
        "                            AND NOT EXISTS (SELECT 1 FROM e z WHERE z.m = mb.member_id AND z.f = y.f)",
        "                           THEN y.f END) AS second_degree",
        "FROM Member mb",
        "LEFT JOIN e x ON x.m = mb.member_id",
        "LEFT JOIN e y ON y.m = x.f",
        "GROUP BY mb.member_id",
        "ORDER BY mb.member_id",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "List every connection in both directions first.",
      "Two hops: join the edge list to itself, from the member to a connection, and from that connection onwards.",
      "Remove the member themselves and anyone already directly connected, and count distinct people — several paths can reach the same one.",
    ],
    editorial: [
      "Graph questions in SQL start by making the edges easy to follow: the CTE `e` lists every connection in both directions, so `e.m = X` gives all of X's neighbours. A walk of two steps is then a self join of `e` — from the member `x.m` to a neighbour `x.f`, and from that neighbour to its own neighbours `y.f`.",
      "",
      "Those two-step endpoints include noise that must be removed. Every walk can come straight back (`y.f = x.m`), so the member reaches themselves through each of their connections. A first-degree connection can also be reached in two steps through a shared friend, as members 1 and 2 are through 3 in the example — the `NOT EXISTS` against `e` drops them. And one person is often reachable through several connections, so the ring needs `DISTINCT`. What remains is the second-degree network; correlated counts per member give 0 for anyone with no rows.",
      "",
      "The alternative LEFT JOINs both hops from `Member`, so isolated members survive, and does the filtering inside `COUNT(DISTINCT CASE …)`. The cost grows with the sum over members of their neighbours' degrees — modest on sparse graphs, which professional networks are, but the reason real systems precompute this.",
    ].join("\n"),
  },

  {
    slug: "linkedin-top-endorsed-skill-per-industry-and-its-lead",
    title: "LinkedIn: Top Endorsed Skill per Industry and Its Lead",
    difficulty: "HARD",
    topics: ["Window Functions", "Joins", "Aggregation"],
    description: [
      "For the industry reports in LinkedIn's talent insights, the economic-graph team names the skill that members in each industry are endorsed for most, and how clear its lead is.",
      "",
      "Count endorsements per skill among those **received by** members of each industry (members with a NULL `industry` are ignored). For each industry with at least one such endorsement, return `industry`, `top_skill`, `endorsements` (its count) and `lead_over_next`: its count minus the count of the **next** skill in that industry. Rank skills by count descending, ties broken by skill name **alphabetically**, so tied skills give a lead of 0. If the industry has only one endorsed skill, `lead_over_next` equals its count. Order the rows by `industry`.",
    ].join("\n"),
    tables: [
      {
        name: "Member",
        columns: [
          { name: "member_id", type: "int" },
          { name: "industry", type: "varchar" },
        ],
        primaryKey: ["member_id"],
        note: "One row per member; `industry` is the member's current industry, or NULL if they have not set one.",
      },
      {
        name: "Endorsement",
        columns: [
          { name: "endorsement_id", type: "int" },
          { name: "endorser_id", type: "int" },
          { name: "member_id", type: "int" },
          { name: "skill", type: "varchar" },
        ],
        primaryKey: ["endorsement_id"],
        note: "One row per endorsement received by `member_id`; `member_id` always names a member.",
      },
    ],
    examples: [
      {
        Member: [
          [1, "Software"],
          [2, "Software"],
          [3, "Banking"],
          [4, "Banking"],
          [5, "Healthcare"],
          [6, null],
        ],
        Endorsement: [
          [1, 9, 1, "Python"],
          [2, 8, 1, "Python"],
          [3, 7, 2, "Python"],
          [4, 9, 2, "Java"],
          [5, 3, 4, "Excel"],
          [6, 5, 3, "SQL"],
          [7, 1, 3, "Excel"],
          [8, 2, 4, "SQL"],
          [9, 1, 5, "Leadership"],
          [10, 2, 6, "Python"],
          [11, 3, 6, "Python"],
        ],
      },
    ],
    gen: (rng) => {
      const n = ri(rng, 2, 10);
      const members: Cell[][] = seq(1, n).map((id) => [id, chance(rng, 0.1) ? null : pick(rng, INDUSTRIES.slice(0, 3))]);
      const skills = sample(rng, SKILLS, ri(rng, 1, 4));
      const k = chance(rng, 0.05) ? 0 : ri(rng, 1, 22);
      const rows: Cell[][] = seq(1, k).map((id) => [id, ri(rng, 20, 40), ri(rng, 1, n), pick(rng, skills)]);
      return { Member: members, Endorsement: rows };
    },
    solution: [
      "WITH counts AS (",
      "  SELECT m.industry, e.skill, COUNT(*) AS cnt",
      "  FROM Endorsement e",
      "  JOIN Member m ON m.member_id = e.member_id",
      "  WHERE m.industry IS NOT NULL",
      "  GROUP BY m.industry, e.skill",
      "), ranked AS (",
      "  SELECT industry, skill, cnt,",
      "         ROW_NUMBER() OVER (PARTITION BY industry ORDER BY cnt DESC, skill) AS rn",
      "  FROM counts",
      ")",
      "SELECT t.industry, t.skill AS top_skill, t.cnt AS endorsements,",
      "       t.cnt - COALESCE(s.cnt, 0) AS lead_over_next",
      "FROM ranked t",
      "LEFT JOIN ranked s ON s.industry = t.industry AND s.rn = 2",
      "WHERE t.rn = 1",
      "ORDER BY t.industry",
    ].join("\n"),
    alternatives: [
      [
        "WITH counts AS (",
        "  SELECT m.industry, e.skill, COUNT(*) AS cnt FROM Endorsement e JOIN Member m ON m.member_id = e.member_id",
        "  WHERE m.industry IS NOT NULL GROUP BY m.industry, e.skill",
        "), ordered AS (",
        "  SELECT industry, skill, cnt,",
        "         ROW_NUMBER() OVER (PARTITION BY industry ORDER BY cnt DESC, skill) AS rn,",
        "         LEAD(cnt, 1, 0) OVER (PARTITION BY industry ORDER BY cnt DESC, skill) AS next_cnt",
        "  FROM counts",
        ")",
        "SELECT industry, skill AS top_skill, cnt AS endorsements, cnt - next_cnt AS lead_over_next",
        "FROM ordered WHERE rn = 1 ORDER BY industry",
      ].join("\n"),
      [
        "WITH counts AS (",
        "  SELECT m.industry, e.skill, COUNT(*) AS cnt FROM Endorsement e JOIN Member m ON m.member_id = e.member_id",
        "  WHERE m.industry IS NOT NULL GROUP BY m.industry, e.skill",
        "), top1 AS (",
        "  SELECT c.* FROM counts c WHERE NOT EXISTS (",
        "    SELECT 1 FROM counts o WHERE o.industry = c.industry AND (o.cnt > c.cnt OR (o.cnt = c.cnt AND o.skill < c.skill)))",
        ")",
        "SELECT t.industry, t.skill AS top_skill, t.cnt AS endorsements,",
        "       t.cnt - COALESCE((SELECT MAX(o.cnt) FROM counts o WHERE o.industry = t.industry AND o.skill <> t.skill), 0) AS lead_over_next",
        "FROM top1 t ORDER BY t.industry",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Attach each endorsement to the receiving member's industry, then count per (industry, skill).",
      "Rank the skills inside each industry with one ordering: count descending, then name.",
      "The runner-up is rank 2 — join it, or read it with `LEAD`; a missing runner-up counts as 0.",
    ],
    editorial: [
      "First the endorsements are attributed to industries: join each endorsement to the member who **received** it and count per (industry, skill), discarding members without an industry. That turns the question into ranking a short list per industry.",
      "",
      "`ROW_NUMBER()` with `ORDER BY cnt DESC, skill` gives a strict order — the skill name breaks ties so the top is always one skill, and the next skill after a tie has the same count, giving a lead of 0. The answer reads two rows of that order: rank 1 is the top skill, rank 2 the runner-up. A LEFT JOIN to rank 2 keeps industries with a single skill, where `COALESCE(s.cnt, 0)` makes the lead the full count.",
      "",
      "The first alternative reads the runner-up's count from the same row with `LEAD(cnt, 1, 0)`, whose third argument supplies 0 when there is no next row. The second finds the top skill with `NOT EXISTS` and the runner-up's count as the largest count among the *other* skills — the same number as rank 2's, since a tied skill is the largest other one. All three group the endorsements once; the per-industry lists are small.",
    ].join("\n"),
  },

  {
    slug: "linkedin-boomerang-hires-in-work-history",
    title: "LinkedIn: Boomerang Hires in Members' Work History",
    difficulty: "HARD",
    topics: ["Window Functions", "Subqueries", "Dates"],
    description: [
      "Employers like to know who comes back. The talent-insights team looks for **boomerangs** in members' work history: people who left a company, worked somewhere else, and then returned.",
      "",
      "A position is a **return** when the member held an earlier position at the **same company**, and the position **immediately before it** (the member's previous one by start date) was at a **different** company. For every return, give `member_id`, `company_name`, `left_on` (the latest `end_date` among the member's earlier positions at that company), `returned_on` (the return's `start_date`) and `months_away`, the whole months from `left_on` to `returned_on`. Order the rows by `member_id`, then `returned_on`.",
    ].join("\n"),
    tables: [
      {
        name: "WorkHistory",
        columns: [
          { name: "position_id", type: "int" },
          { name: "member_id", type: "int" },
          { name: "company_name", type: "varchar" },
          { name: "start_date", type: "date" },
          { name: "end_date", type: "date" },
        ],
        primaryKey: ["position_id"],
        note: "One row per position on a member's profile. A member's positions never overlap and never share a start date; `end_date` is NULL only for the current position.",
      },
    ],
    examples: [
      {
        WorkHistory: [
          [1, 1, "Northwind Labs", "2018-07-01", "2020-03-31"],
          [2, 1, "Kestrel Analytics", "2020-05-01", "2021-12-31"],
          [3, 1, "Northwind Labs", "2022-02-15", null],
          [4, 2, "Saffron Fintech", "2019-01-01", "2019-12-31"],
          [5, 2, "Saffron Fintech", "2020-01-01", "2022-06-30"],
          [6, 2, "Orbit Retail", "2022-08-01", "2023-03-31"],
          [7, 3, "Lotus Health", "2017-06-01", "2018-05-31"],
          [8, 3, "Cedar Robotics", "2018-07-01", "2019-06-30"],
          [9, 3, "Lotus Health", "2019-08-01", "2020-12-31"],
          [10, 3, "Cedar Robotics", "2021-02-01", null],
        ],
      },
    ],
    gen: (rng) => {
      const rows: Cell[][] = [];
      const members = ri(rng, 2, 5);
      for (let m = 1; m <= members; m++) {
        const companies = sample(rng, COMPANIES, chance(rng, 0.6) ? 2 : 3);
        let start = dateBetween(rng, "2014-01-01", "2016-12-31");
        const k = ri(rng, 1, 6);
        for (let i = 0; i < k; i++) {
          const end = addDays(start, ri(rng, 60, 900));
          const last = i === k - 1 && chance(rng, 0.5);
          rows.push([0, m, pick(rng, companies), start, last ? null : end]);
          start = addDays(end, ri(rng, 1, 120));
        }
      }
      shuffle(rng, rows).forEach((r, i) => (r[0] = i + 1));
      return { WorkHistory: rows };
    },
    solution: [
      "WITH hist AS (",
      "  SELECT position_id, member_id, company_name, start_date,",
      "         LAG(company_name) OVER (PARTITION BY member_id ORDER BY start_date) AS prev_company",
      "  FROM WorkHistory",
      "), comebacks AS (",
      "  SELECT s.member_id, s.company_name, s.start_date AS returned_on,",
      "         (SELECT MAX(w.end_date) FROM WorkHistory w",
      "          WHERE w.member_id = s.member_id AND w.company_name = s.company_name",
      "            AND w.start_date < s.start_date) AS left_on",
      "  FROM hist s",
      "  WHERE s.prev_company <> s.company_name",
      ")",
      "SELECT member_id, company_name, left_on, returned_on,",
      "       TIMESTAMPDIFF(MONTH, left_on, returned_on) AS months_away",
      "FROM comebacks",
      "WHERE left_on IS NOT NULL",
      "ORDER BY member_id, returned_on",
    ].join("\n"),
    alternatives: [
      [
        "SELECT r.member_id, r.company_name, MAX(e.end_date) AS left_on, r.start_date AS returned_on,",
        "       TIMESTAMPDIFF(MONTH, MAX(e.end_date), r.start_date) AS months_away",
        "FROM WorkHistory r",
        "JOIN WorkHistory e ON e.member_id = r.member_id AND e.company_name = r.company_name AND e.start_date < r.start_date",
        "JOIN WorkHistory p ON p.member_id = r.member_id AND p.start_date < r.start_date AND p.company_name <> r.company_name",
        "WHERE NOT EXISTS (SELECT 1 FROM WorkHistory b WHERE b.member_id = r.member_id AND b.start_date > p.start_date AND b.start_date < r.start_date)",
        "GROUP BY r.position_id, r.member_id, r.company_name, r.start_date",
        "ORDER BY r.member_id, returned_on",
      ].join("\n"),
    ],
    ordered: true,
    hints: [
      "Order each member's positions by start date; `LAG` gives the company of the previous one.",
      "A return needs two things: the previous position at another company, and some earlier position at this company.",
      "`left_on` is the latest end date among those earlier positions at the same company; TIMESTAMPDIFF(MONTH, …) counts whole months.",
    ],
    editorial: [
      "Two conditions define a return, and they look at different parts of the history. The first is local: the position just before this one was at another company. `LAG(company_name)` over the member's positions ordered by start date hands each position its predecessor's company, and `prev_company <> company_name` keeps the switches — it also drops a member's first position, whose `LAG` is NULL, and a promotion within one company, whose predecessor is the same company (member 2 in the example).",
      "",
      "The second is global: somewhere earlier, the member worked at this company. A correlated subquery takes `MAX(end_date)` over the earlier positions at the same company — that is `left_on`, the last day before leaving — and a NULL means there was none, so the outer filter `left_on IS NOT NULL` keeps only true returns. Member 3 returns to Lotus Health and later to Cedar Robotics, so both are rows. `TIMESTAMPDIFF(MONTH, left_on, returned_on)` counts only whole months.",
      "",
      "The alternative finds the immediate predecessor `p` with a self join plus `NOT EXISTS` (no position starts between the two) and the earlier stints `e` with another self join, grouping per return. It is more joins for the same answer; the window version sorts each member's history once.",
    ].join("\n"),
  },
];
